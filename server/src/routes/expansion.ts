import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { EquipmentType } from '../../../shared/types';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const EXPANSION_COSTS = [0, 200, 800, 3000, 12000, 50000];
const EXPANSION_CAPACITIES = [2, 4, 8, 16, 32, 50];
const EXPANSION_NAMES = ['Armario', 'Tienda de cultivo', 'Habitación', 'Sótano', 'Nave industrial', 'Invernadero'];
const EXPANSION_REQUIREMENTS = [1, 5, 10, 18, 30, 45];

const EQUIPMENT_COSTS: Record<EquipmentType, number[]> = {
  lights:       [0, 50,  200, 800,  3000],
  ventilation:  [0, 30,  120, 500,  2000],
  irrigation:   [0, 40,  180, 700,  2500],
  security:     [0, 80,  350, 1500, 6000],
};

const EQUIPMENT_NAMES: Record<EquipmentType, string[]> = {
  lights:       ['CFL', 'LED', 'HPS', 'Quantum', 'Espectro Pro'],
  ventilation:  ['PC Fan', 'Inline', 'Carbon Filter', 'Clima Control', 'Semi-industrial'],
  irrigation:   ['Manual', 'Goteo', 'Automático', 'Hidropónico', 'Aeropónico'],
  security:     ['Ninguna', 'Alarma', 'Cámaras', 'Perro Guardián', 'Seguridad Privada'],
};

router.get('/spaces', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { growSpaces: true },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    res.json({ success: true, data: gameState.growSpaces });
  } catch (error) {
    console.error('Spaces error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar espacios' });
  }
});

router.post('/space/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const { growSpaceId } = req.body;

    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const space = await prisma.growSpace.findFirst({
      where: { id: growSpaceId, gameId: gameState.id },
    });
    if (!space) return res.status(404).json({ success: false, error: 'Space not found' });

    const nextLevel = space.level + 1;
    if (nextLevel > 6) {
      return res.status(400).json({ success: false, error: 'Nivel máximo alcanzado' });
    }

    if (gameState.level < EXPANSION_REQUIREMENTS[nextLevel - 1]) {
      return res.status(400).json({
        success: false,
        error: `Necesitas nivel ${EXPANSION_REQUIREMENTS[nextLevel - 1]} para esta mejora`,
      });
    }

    const cost = EXPANSION_COSTS[nextLevel - 1];
    if (gameState.money < cost) {
      return res.status(400).json({ success: false, error: 'Dinero insuficiente' });
    }

    const updated = await prisma.growSpace.update({
      where: { id: space.id },
      data: {
        level: nextLevel,
        capacity: EXPANSION_CAPACITIES[nextLevel - 1],
        name: EXPANSION_NAMES[nextLevel - 1],
      },
    });

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { money: gameState.money - cost },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'upgrade',
        amount: -cost,
        description: `Mejora: ${space.name} → ${updated.name}`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Space upgrade error:', error);
    res.status(500).json({ success: false, error: 'Error al mejorar espacio' });
  }
});

router.post('/equipment/upgrade', async (req: AuthRequest, res: Response) => {
  try {
    const { growSpaceId, equipmentType } = req.body as { growSpaceId: string; equipmentType: EquipmentType };

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const space = await prisma.growSpace.findFirst({
      where: { id: growSpaceId, gameId: gameState.id },
    });
    if (!space) return res.status(404).json({ success: false, error: 'Space not found' });

    const currentLevel = space[equipmentType];
    const nextLevel = currentLevel + 1;
    const maxLevel = 5;

    if (nextLevel > maxLevel) {
      return res.status(400).json({ success: false, error: 'Nivel máximo de equipamiento alcanzado' });
    }

    const cost = EQUIPMENT_COSTS[equipmentType][nextLevel - 1];
    if (gameState.money < cost) {
      return res.status(400).json({ success: false, error: 'Dinero insuficiente' });
    }

    const updateData: Record<string, number> = {};
    updateData[equipmentType] = nextLevel;

    const updated = await prisma.growSpace.update({
      where: { id: space.id },
      data: updateData,
    });

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { money: gameState.money - cost },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'upgrade',
        amount: -cost,
        description: `Mejora: ${EQUIPMENT_NAMES[equipmentType][nextLevel - 1]} (${equipmentType})`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Equipment upgrade error:', error);
    res.status(500).json({ success: false, error: 'Error al mejorar equipo' });
  }
});

export default router;
