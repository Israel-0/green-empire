import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculatePlantGrowth, getQualityTier } from '../services/plantGrowth';
import { processEvents } from '../services/eventEngine';
import { updateMarketPrices } from '../services/economy';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/plant', async (req: AuthRequest, res: Response) => {
  try {
    const { strainId, growSpaceId } = req.body;

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const growSpace = await prisma.growSpace.findFirst({
      where: { id: growSpaceId, gameId: gameState.id },
    });
    if (!growSpace || !growSpace.unlocked) {
      return res.status(400).json({ success: false, error: 'Espacio no disponible' });
    }

    const plantCount = await prisma.plant.count({
      where: { growSpaceId: growSpace.id, harvestedAt: null },
    });
    if (plantCount >= growSpace.capacity) {
      return res.status(400).json({ success: false, error: 'Espacio de cultivo lleno' });
    }

    const strain = await prisma.strain.findUnique({ where: { id: strainId } });
    if (!strain) return res.status(404).json({ success: false, error: 'Strain not found' });

    if (gameState.level < strain.unlockLevel) {
      return res.status(400).json({ success: false, error: 'Nivel insuficiente para esta cepa' });
    }

    const seedInv: Record<string, number> = JSON.parse(gameState.seedInventory || '{}');
    const ownedSeeds = seedInv[strainId] || 0;

    if (ownedSeeds <= 0) {
      return res.status(400).json({
        success: false,
        error: `No tienes semillas de ${strain.name}. Compra en la tienda primero.`,
      });
    }

    const usedSlots = await prisma.plant.findMany({
      where: { growSpaceId: growSpace.id, harvestedAt: null },
      select: { slot: true },
    });
    const usedSlotNumbers = usedSlots.map(p => p.slot);
    let nextSlot = 0;
    while (usedSlotNumbers.includes(nextSlot)) nextSlot++;

    const decayRateMultiplier = 1 - (growSpace.irrigation - 1) * 0.15;

    const plant = await prisma.plant.create({
      data: {
        gameId: gameState.id,
        growSpaceId: growSpace.id,
        strainId: strain.id,
        slot: nextSlot,
        stage: 'seed',
        waterDecayRate: decayRateMultiplier,
        lightDecayRate: 1 - (growSpace.lights - 1) * 0.12,
        nutrientDecayRate: decayRateMultiplier,
      },
      include: { strain: true },
    });

    seedInv[strainId] = ownedSeeds - 1;

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { seedInventory: JSON.stringify(seedInv) },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'buy',
        amount: 0,
        description: `Plantada: ${strain.name} (quedan ${seedInv[strainId]} semillas)`,
      },
    });

    res.json({ success: true, data: plant });
  } catch (error) {
    console.error('Plant error:', error);
    res.status(500).json({ success: false, error: 'Error al plantar' });
  }
});

router.post('/:id/care', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    if (plant.harvestedAt) {
      return res.status(400).json({ success: false, error: 'Planta ya cosechada' });
    }

    const updated = await prisma.plant.update({
      where: { id: plant.id },
      data: {
        waterLevel: Math.min(100, plant.waterLevel + 50),
        nutrientLevel: Math.min(100, plant.nutrientLevel + 45),
        health: Math.min(100, plant.health + 25),
        lastCaredAt: new Date(),
      },
      include: { strain: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Care error:', error);
    res.status(500).json({ success: false, error: 'Error al cuidar' });
  }
});

router.post('/:id/water', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    if (plant.harvestedAt) {
      return res.status(400).json({ success: false, error: 'Planta ya cosechada' });
    }

    const updated = await prisma.plant.update({
      where: { id: plant.id },
      data: { waterLevel: Math.min(100, plant.waterLevel + 40), lastCaredAt: new Date() },
      include: { strain: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Water error:', error);
    res.status(500).json({ success: false, error: 'Error al regar' });
  }
});

router.post('/:id/nutrient', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    if (plant.harvestedAt) {
      return res.status(400).json({ success: false, error: 'Planta ya cosechada' });
    }

    const updated = await prisma.plant.update({
      where: { id: plant.id },
      data: { nutrientLevel: Math.min(100, plant.nutrientLevel + 35), lastCaredAt: new Date() },
      include: { strain: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Nutrient error:', error);
    res.status(500).json({ success: false, error: 'Error al nutrir' });
  }
});

router.post('/:id/harvest', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { staff: true, growSpaces: true },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    if (plant.harvestedAt) {
      return res.status(400).json({ success: false, error: 'Planta ya cosechada' });
    }

    const growSpace = await prisma.growSpace.findUnique({ where: { id: plant.growSpaceId } });
    const equipment = growSpace
      ? { lights: growSpace.lights, ventilation: growSpace.ventilation, irrigation: growSpace.irrigation, security: growSpace.security }
      : { lights: 1, ventilation: 1, irrigation: 1, security: 1 };

    const researcher = gameState.staff.find(s => s.type === 'researcher');
    const researcherLevel = researcher?.level || 0;
    const gardener = gameState.staff.find(s => s.type === 'grower' && s.assignedGrowSpaceId === plant.growSpaceId);
    const gardenerLevel = gardener?.level || 0;

    const growth = calculatePlantGrowth(plant, plant.strain, equipment, researcherLevel, gardenerLevel);
    if (growth.stage !== 'ready') {
      return res.status(400).json({ success: false, error: `La planta aún no está lista (${growth.stage})` });
    }

    const isYerbon = growth.quality >= 98;
    const yield_ = Math.max(1, Math.round(plant.strain.baseYield * (growth.quality / 100) * (isYerbon ? 2 : 1)));
    const tier = getQualityTier(growth.quality).tier;

    const updatedPlant = await prisma.plant.update({
      where: { id: plant.id },
      data: {
        harvestedAt: new Date(),
        stage: 'ready',
        quality: growth.quality,
        isYerbon,
      },
    });

    const existingInventory = await prisma.inventoryItem.findFirst({
      where: { gameId: gameState.id, strainId: plant.strainId, tier },
    });

    if (existingInventory) {
      const totalQty = existingInventory.quantity + Math.round(yield_);
      const newAvgQuality = ((existingInventory.averageQuality * existingInventory.quantity) + (growth.quality * Math.round(yield_))) / totalQty;
      await prisma.inventoryItem.update({
        where: { id: existingInventory.id },
        data: { quantity: totalQty, averageQuality: Math.round(newAvgQuality * 100) / 100 },
      });
    } else {
      await prisma.inventoryItem.create({
        data: {
          gameId: gameState.id,
          strainId: plant.strainId,
          quantity: Math.round(yield_),
          averageQuality: growth.quality,
          tier,
          isYerbon,
        },
      });
    }

    const expGain = plant.strain.difficulty * 15 + growth.quality * 0.5;
    const newExp = gameState.experience + expGain;
    let newLevel = gameState.level;
    let nextExp = gameState.experienceToNext;

    while (newExp >= nextExp) {
      newLevel++;
      nextExp = Math.floor(nextExp * 1.5);
    }

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        experience: newExp,
        level: newLevel,
        experienceToNext: nextExp,
        totalHarvested: gameState.totalHarvested + 1,
      },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'event',
        amount: 0,
        description: `Cosechada: ${plant.strain.name} (${growth.quality.toFixed(1)}% calidad)${isYerbon ? ' ★YERBÓN★' : ''}`,
      },
    });

    if (newLevel > gameState.level) {
      await prisma.gameEvent.create({
        data: {
          gameId: gameState.id,
          type: 'level_up',
          message: `¡Subiste al nivel ${newLevel}!`,
          severity: 'success',
        },
      });
    }

    const events = await processEvents(gameState.id);
    await updateMarketPrices();

    res.json({
      success: true,
      data: {
        plant: updatedPlant,
        yield: Math.round(yield_),
        quality: growth.quality,
        isYerbon,
        expGain,
        newLevel,
        newEvents: events,
      },
    });
  } catch (error) {
    console.error('Harvest error:', error);
    res.status(500).json({ success: false, error: 'Error al cosechar' });
  }
});

router.post('/:id/treat', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    if (!plant.hasPests) {
      return res.status(400).json({ success: false, error: 'La planta no tiene plagas' });
    }

    const cost = Math.max(1, Math.round(plant.strain.baseValue * 0.3));
    if (gameState.money < cost) {
      return res.status(400).json({ success: false, error: `Necesitas $${cost} para comprar pesticida` });
    }

    const updated = await prisma.plant.update({
      where: { id: plant.id },
      data: {
        hasPests: false,
        health: Math.min(100, plant.health + 10),
      },
      include: { strain: true },
    });

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { money: gameState.money - cost },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'buy',
        amount: -cost,
        description: `Pesticida: ${updated.strain?.name || 'Planta'}`,
      },
    });

    res.json({ success: true, data: { ...updated, cost } });
  } catch (error) {
    console.error('Treat error:', error);
    res.status(500).json({ success: false, error: 'Error al tratar' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const plant = await prisma.plant.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
      include: { strain: true },
    });
    if (!plant) return res.status(404).json({ success: false, error: 'Plant not found' });

    await prisma.plant.delete({ where: { id: plant.id } });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'event',
        amount: 0,
        description: `Eliminada: ${plant.strain.name}`,
      },
    });

    res.json({ success: true, data: { message: 'Planta eliminada' } });
  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar planta' });
  }
});

export default router;
