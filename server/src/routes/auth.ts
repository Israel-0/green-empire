import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Usuario o email ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        gameState: {
          create: {
            money: 50,
            level: 1,
            experience: 0,
            experienceToNext: 100,
            reputation: 0,
            growSpaces: {
              create: {
                name: 'Armario',
                level: 1,
                capacity: 2,
                drugType: 'marijuana',
                lights: 1,
                ventilation: 1,
                irrigation: 1,
                security: 1,
                unlocked: true,
              },
            },
          },
        },
      },
      include: {
        gameState: {
          include: { growSpaces: true },
        },
      },
    });

    const gameState = user.gameState;
    if (gameState && gameState.growSpaces.length > 0) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: { activeGrowSpaceId: gameState.growSpaces[0].id },
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, createdAt: user.createdAt.toISOString() },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Error al registrar' });
  }
});

router.post('/login', async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, createdAt: user.createdAt.toISOString() },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
  }
});

router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
});

export default router;
