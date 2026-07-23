import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const events = await prisma.gameEvent.findMany({
      where: { gameId: gameState.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar eventos' });
  }
});

router.post('/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const event = await prisma.gameEvent.findFirst({
      where: { id: req.params.id, gameId: gameState.id },
    });
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    if (event.resolved) {
      return res.status(400).json({ success: false, error: 'Evento ya resuelto' });
    }

    const updateData: Record<string, unknown> = { resolved: true };

    if (event.reward && event.reward > 0) {
      updateData['money'] = gameState.money + event.reward;
    } else if (event.penalty && event.penalty > 0) {
      updateData['money'] = Math.max(0, gameState.money - event.penalty);
    }

    await prisma.gameEvent.update({
      where: { id: event.id },
      data: { resolved: true },
    });

    if (event.reward || event.penalty) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          money: event.reward
            ? gameState.money + event.reward
            : Math.max(0, gameState.money - (event.penalty || 0)),
        },
      });

      await prisma.transaction.create({
        data: {
          gameId: gameState.id,
          type: 'event',
          amount: event.reward || -(event.penalty || 0),
          description: `Evento: ${event.message}`,
        },
      });
    }

    if (event.type === 'pest' || event.type === 'mold') {
      if (event.plantId) {
        await prisma.plant.update({
          where: { id: event.plantId },
          data: {
            hasPests: event.type === 'pest' ? true : undefined,
            isMoldy: event.type === 'mold' ? true : undefined,
          },
        });
      }
    }

    res.json({ success: true, data: { resolved: true } });
  } catch (error) {
    console.error('Resolve event error:', error);
    res.status(500).json({ success: false, error: 'Error al resolver evento' });
  }
});

export default router;
