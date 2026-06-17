import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { sendError, makeError } from './utils/response.js';
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import reviewRoutes from './routes/review.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import adminRoutes from './routes/admin.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  const authLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', service: 'eatnext-api' } });
  });

  const v1 = express.Router();
  v1.use('/auth', authLimiter, authRoutes);
  v1.use('/restaurants', restaurantRoutes);
  v1.use('/reviews', reviewRoutes);
  v1.use('/complaints', complaintRoutes);
  v1.use('/favorites', favoriteRoutes);
  v1.use('/admin', adminRoutes);

  app.use('/v1', v1);
  app.use('/api/v1', v1);

  app.use((_req, res) => {
    sendError(res, makeError('NOT_FOUND', 'Route introuvable.', 404));
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof AppError) {
      return sendError(res, { code: err.code, message: err.message, status: err.status });
    }
    return errorHandler(err, req, res, next);
  });

  return app;
}
