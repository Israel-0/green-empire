import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/strains', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const unlockedDrugTypes: string[] = JSON.parse(gameState.unlockedDrugTypes || '["marijuana"]');
    const seedInv: Record<string, number> = JSON.parse(gameState.seedInventory || '{}');

    const strains = await prisma.strain.findMany({
      where: { drugType: { in: unlockedDrugTypes } },
    });

    const withCounts = strains.map(s => ({
      ...s,
      ownedSeeds: seedInv[s.id] || 0,
    }));

    res.json({ success: true, data: withCounts });
  } catch (error) {
    console.error('Strains error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar cepas' });
  }
});

router.post('/buy', async (req: AuthRequest, res: Response) => {
  try {
    const { strainId, quantity } = req.body;

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const strain = await prisma.strain.findUnique({ where: { id: strainId } });
    if (!strain) return res.status(404).json({ success: false, error: 'Strain not found' });

    const totalCost = strain.seedCost * quantity;

    if (gameState.money < totalCost) {
      return res.status(400).json({ success: false, error: 'Dinero insuficiente' });
    }

    const seedInv: Record<string, number> = JSON.parse(gameState.seedInventory || '{}');
    seedInv[strainId] = (seedInv[strainId] || 0) + quantity;

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        money: gameState.money - totalCost,
        seedInventory: JSON.stringify(seedInv),
      },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'buy',
        amount: -totalCost,
        description: `Compra: ${quantity}x semillas de ${strain.name}`,
      },
    });

    res.json({
      success: true,
      data: { message: `Compraste ${quantity}x ${strain.name}`, totalCost, ownedSeeds: seedInv[strainId] },
    });
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ success: false, error: 'Error al comprar' });
  }
});

export default router;
