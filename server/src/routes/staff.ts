import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { StaffType } from '../../../shared/types';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const STAFF_NAMES: Record<StaffType, string[]> = {
  grower: ['Jardinero Novato', 'Jardinero Experto', 'Maestro Cultivador', 'Ingeniero Agronomo', 'Druida del Cultivo'],
  dealer: ['Camello de Barrio', 'Distribuidor', 'Narco Empresario', 'Cartel Manager', 'Señor de la Droga'],
  security: ['Vigilante', 'Guardia de Seguridad', 'Ex-Militar', 'Agente de Inteligencia', 'Ejercito Privado'],
  researcher: ['Biólogo Aficionado', 'Científico', 'Doctor en Botánica', 'Premio Nobel', 'Cientifico Loco'],
};

const STAFF_HIRE_COSTS: Record<StaffType, number[]> = {
  grower: [8, 40, 120, 350, 900],
  dealer: [10, 45, 130, 350, 900],
  security: [15, 50, 140, 400, 1000],
  researcher: [30, 80, 200, 550, 1400],
};

const STAFF_SALARIES: Record<StaffType, number[]> = {
  grower: [3, 8, 15, 25, 40],
  dealer: [3, 8, 15, 25, 40],
  security: [4, 10, 18, 30, 48],
  researcher: [6, 12, 25, 40, 65],
};

const STAFF_EFFECTS: Record<StaffType, Record<number, string>> = {
  grower: {
    1: 'Agua minima 70%',
    2: 'Agua minima 77%, +10% velocidad',
    3: 'Agua minima 85%, +20% vel., auto-cosecha, auto-planta',
    4: 'Agua minima 92%, +35% vel., auto-cosecha, auto-planta',
    5: 'Agua minima 100%, +50% vel., auto-cosecha, auto-planta, +1 und',
  },
  dealer: {
    1: 'Auto-venta: 1 item cada 30min, +10% precio',
    2: 'Auto-venta: 2 items cada 20min, +20% precio',
    3: 'Auto-venta: 3 items cada 15min, +30% precio',
    4: 'Auto-venta: 4 items cada 12min, +40% precio',
    5: 'Auto-venta: 5 items cada 10min, +50% precio',
  },
  security: {
    1: 'Riesgo de redada x0.9',
    2: 'Riesgo x0.75, reembolso 25% en multa',
    3: 'Riesgo x0.5, reembolso 50% en multa',
    4: 'Riesgo x0.3, reembolso 70% en multa',
    5: 'Riesgo x0.15, reembolso 90% en multa',
  },
  researcher: {
    1: '+5% velocidad, +5% calidad, +15 rango suerte',
    2: '+10% velocidad, +10% calidad, +20 rango suerte',
    3: '+15% velocidad, +20% calidad, +25 rango suerte',
    4: '+20% velocidad, +35% calidad, +30 rango suerte',
    5: '+25% velocidad, +50% calidad, +35 rango suerte',
  },
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { staff: true },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    res.json({ success: true, data: gameState.staff });
  } catch (error) {
    console.error('Staff list error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar staff' });
  }
});

router.post('/hire', async (req: AuthRequest, res: Response) => {
  try {
    const { type, level, growSpaceId } = req.body as { type: StaffType; level: number; growSpaceId?: string };

    if (level < 1 || level > 5) {
      return res.status(400).json({ success: false, error: 'Nivel inválido (1-5)' });
    }

    const gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { staff: true },
    });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const existingOfType = gameState.staff.filter(s => s.type === type);
    const maxAllowed = 1;

    const existingLower = existingOfType.find(s => s.level < level);
    const canUpgrade = existingLower && existingOfType.length <= maxAllowed;

    if (existingOfType.length >= maxAllowed && !canUpgrade) {
      return res.status(400).json({ success: false, error: `Ya tienes el maximo de este tipo (${maxAllowed})` });
    }

    const cost = canUpgrade
      ? STAFF_HIRE_COSTS[type][level - 1] - STAFF_HIRE_COSTS[type][existingLower!.level - 1]
      : STAFF_HIRE_COSTS[type][level - 1];

    if (gameState.money < Math.max(0, cost)) {
      return res.status(400).json({ success: false, error: 'Dinero insuficiente' });
    }

    let staff;
    if (canUpgrade) {
      staff = await prisma.staffMember.update({
        where: { id: existingLower!.id },
        data: {
          level,
          name: STAFF_NAMES[type][level - 1],
          salary: STAFF_SALARIES[type][level - 1],
        },
      });
    } else {
      const salary = STAFF_SALARIES[type][level - 1];
      staff = await prisma.staffMember.create({
        data: {
          gameId: gameState.id,
          type,
          name: STAFF_NAMES[type][level - 1],
          level,
          salary,
          assignedGrowSpaceId: type === 'grower' ? growSpaceId || null : null,
        },
      });
    }

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: { money: gameState.money - Math.max(0, cost) },
    });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'buy',
        amount: -Math.max(0, cost),
        description: canUpgrade
          ? `Mejorado: ${STAFF_NAMES[type][level - 1]} (Nivel ${level})`
          : `Contratado: ${STAFF_NAMES[type][level - 1]} (Nivel ${level})`,
      },
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Hire error:', error);
    res.status(500).json({ success: false, error: 'Error al contratar' });
  }
});

router.post('/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, growSpaceId } = req.body;

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const staff = await prisma.staffMember.findFirst({
      where: { id: staffId, gameId: gameState.id },
    });
    if (!staff) return res.status(404).json({ success: false, error: 'Staff not found' });

    const updated = await prisma.staffMember.update({
      where: { id: staff.id },
      data: { assignedGrowSpaceId: growSpaceId || null },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ success: false, error: 'Error al asignar' });
  }
});

router.post('/fire', async (req: AuthRequest, res: Response) => {
  try {
    const { staffId } = req.body;

    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const staff = await prisma.staffMember.findFirst({
      where: { id: staffId, gameId: gameState.id },
    });
    if (!staff) return res.status(404).json({ success: false, error: 'Staff not found' });

    await prisma.staffMember.delete({ where: { id: staff.id } });

    await prisma.transaction.create({
      data: {
        gameId: gameState.id,
        type: 'salary',
        amount: 0,
        description: `Despedido: ${staff.name}`,
      },
    });

    res.json({ success: true, data: { message: `${staff.name} despedido` } });
  } catch (error) {
    console.error('Fire error:', error);
    res.status(500).json({ success: false, error: 'Error al despedir' });
  }
});

export default router;
