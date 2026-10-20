import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import trackingRoutes from './routes/tracking.routes';
import { runMigrations } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// Support application/json dan sendBeacon blobs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Fallback text parser jika sendBeacon mengirimkan payload sebagai text/plain
app.use(express.text({ type: ['text/plain', 'application/json'] }));

// Parse raw body string into JSON jika terdeteksi string dari sendBeacon
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // bukan JSON valid, biarkan apa adanya
    }
  }
  next();
});

app.use(cookieParser());

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mounting Tracking Routes: /api/track/click, /api/track/metrics, /api/track/events
app.use('/api/track', trackingRoutes);

// Global fallback 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Jalankan server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`[Backend Server] Running on http://localhost:${PORT}`);
    if (process.env.AUTO_MIGRATE === 'true') {
      await runMigrations();
    }
  });
}

export default app;
