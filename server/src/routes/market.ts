import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { SellMethod } from '../../../shared/types';
import { getQualityTier } from '../services/plantGrowth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const SELL_MULTIPLIERS: Record<SellMethod, number> = {
  local: 1.0,
  dealer_sale: 1.4,
  darknet: 1.8,
  export: 2.5,
};

const SELL_RISKS: Record<SellMethod, number> = {
  local: 5,
  dealer_sale: 15,
  darknet: 30,
  export: 50,
};

const SELL_REP_UNLOCK: Record<SellMethod, number> = {
  local: 0,
  dealer_sale: 15,
  darknet: 40,
  export: 75,
};

const SELL_REP_BONUS: Record<SellMethod, number> = {
  local: 0.5,
  dealer_sale: 1.0,
  darknet: 1.5,
  export: 2.0,
};

router.get('/prices', async (req: AuthRequest, res: Response) => {
  try {
    const prices = await prisma.marketPrice.findMany({
      include: { strain: true },
    });

    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('Prices error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar precios' });
  }
});

router.post('/sell', async (req: AuthRequest, res: Response) => {
  try {
    const { inventoryItemId, quantity, method } = req.body as {
      inventoryItemId: string;
      quantity: number;
      method: SellMethod;
    };

    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { staff: true, growSpaces: true },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const maxSecurity = gameState.growSpaces.reduce((max, gs) => Math.max(max, gs.security), 1);
    const securityStaff = gameState.staff.find(s => s.type === 'security');
    const securityStaffLevel = securityStaff?.level || 0;
    const staffMultipliers = [1, 0.9, 0.75, 0.5, 0.3, 0.15];
    const staffMultiplier = staffMultipliers[Math.min(securityStaffLevel, 5)] || 1;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, gameId: gameState.id },
      include: { strain: true },
    });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    if (quantity > item.quantity) {
      return res.status(400).json({ success: false, error: 'Cantidad insuficiente en inventario' });
    }

    const requiredRep = SELL_REP_UNLOCK[method] || 0;
    if (gameState.reputation < requiredRep) {
      return res.status(400).json({ success: false, error: `Necesitas ${requiredRep} de reputacion para usar este metodo (tienes ${gameState.reputation.toFixed(1)})` });
    }

    const marketPrice = await prisma.marketPrice.findUnique({
      where: { strainId: item.strainId },
    });

    const basePrice = marketPrice?.currentPrice || item.strain.baseValue;
    const qualityBonus = 1 + (item.averageQuality - 50) / 100;
    const tier = getQualityTier(item.averageQuality);
    const tierBonus = tier.multiplier;
    const multiplier = SELL_MULTIPLIERS[method] || 1;
    const repBonus = 1 + gameState.reputation / 100;

    const dealerLevel = gameState.staff
      .filter(s => s.type === 'dealer')
      .reduce((max, s) => Math.max(max, s.level), 0);
    const dealerBonus = 1 + dealerLevel * 0.1;

    const totalValue = basePrice * quantity * qualityBonus * tierBonus * multiplier * repBonus * dealerBonus;

    const newQuantity = item.quantity - quantity;
    if (newQuantity <= 0) {
      await prisma.inventoryItem.delete({ where: { id: item.id } });
    } else {
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: newQuantity },
      });
    }

    const repGain = quantity * 0.5 * (item.averageQuality / 100) * (SELL_REP_BONUS[method] || 0.5);

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        money: gameState.money + totalValue,
        reputation: Math.min(100, gameState.reputation + repGain),
        totalSold: gameState.totalSold + totalValue,
      },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'sell',
        amount: totalValue,
        description: `Venta: ${quantity}x ${item.strain.name} (${method}) - ${tier.emoji} ${tier.name}`,
      },
    });

    const baseRisk = SELL_RISKS[method] || 5;
    const SECURITY_REDUCTION = [0, 5, 12, 25, 40];
    const equipmentReduction = SECURITY_REDUCTION[Math.min(maxSecurity, 5) - 1] || 0;
    const effectiveRisk = Math.max(1, Math.floor((baseRisk - equipmentReduction) * staffMultiplier));
    const refundRate = securityStaffLevel >= 5 ? 0.9 : securityStaffLevel >= 4 ? 0.7 : securityStaffLevel >= 3 ? 0.5 : securityStaffLevel >= 2 ? 0.25 : 0;
    if (Math.random() * 100 < effectiveRisk) {
      const fine = totalValue * (0.2 + Math.random() * 0.4);
      const actualFine = refundRate > 0 ? fine * (1 - refundRate) : fine;

      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          money: Math.max(0, gameState.money + totalValue - actualFine),
          reputation: Math.max(0, gameState.reputation - 2),
        },
      });

      await prisma.gameEvent.create({
        data: {
          gameId: gameState.id,
          type: 'raid',
          message: refundRate > 0
            ? `Redada! Perdiste $${actualFine.toFixed(0)} (tu seguridad recupero el ${Math.round(refundRate * 100)}%)`
            : `Te pillaron vendiendo! Pierdes $${actualFine.toFixed(0)}.`,
          severity: 'danger',
          penalty: actualFine,
        },
      });

      await prisma.transaction.create({
        data: {
          gameId: gameState.id,
          type: 'fine',
          amount: -actualFine,
          description: `Multa por venta (${method})`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        amount: totalValue,
        quantity,
        strainName: item.strain.name,
        reputationGained: repGain,
        newReputation: Math.min(100, gameState.reputation + repGain),
      },
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ success: false, error: 'Error al vender' });
  }
});

export default router;
