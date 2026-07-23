import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import plantsRoutes from './routes/plants';
import marketRoutes from './routes/market';
import shopRoutes from './routes/shop';
import expansionRoutes from './routes/expansion';
import staffRoutes from './routes/staff';
import eventsRoutes from './routes/events';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === config.clientUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Demasiados intentos, espera 15 minutos' },
});
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/expansion', expansionRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/events', eventsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`[Green Empire] Server running on port ${config.port} (${process.env.NODE_ENV || 'development'})`);
});

export default app;
