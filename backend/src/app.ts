/**
 * Construction de l'application Express EatNext.
 *
 * `createApp()` assemble la chaîne de middlewares (sécurité, CORS, parsing,
 * logs), monte les routeurs de chaque module sous le préfixe versionné `/v1`
 * (et son alias `/api/v1`), expose la documentation Swagger, puis branche les
 * gestionnaires d'erreurs en fin de pile.
 *
 * La fonction est séparée de `server.ts` afin de pouvoir instancier l'app sans
 * démarrer le serveur (utile pour les tests et la génération de la spec).
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
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

  // --- Middlewares globaux ---
  app.use(helmet()); // En-têtes HTTP de sécurité (XSS, clickjacking…).
  app.use(cors({ origin: env.clientUrl, credentials: true })); // Autorise le front + cookies.
  app.use(compression()); // Compression gzip des réponses.
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined')); // Logs HTTP.
  app.use(express.json({ limit: '2mb' })); // Parsing JSON (limite anti-abus).
  app.use(cookieParser()); // Lecture des cookies (refresh token éventuel).

  // Limiteur de débit appliqué uniquement aux routes d'authentification :
  // protège contre le bourrage d'identifiants (credential stuffing).
  const authLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * @openapi
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Sonde de disponibilité du service
   *     responses:
   *       200:
   *         description: Le service répond.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   */
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', service: 'eatnext-api' } });
  });

  // --- Documentation Swagger / OpenAPI ---
  // UI interactive sur /v1/docs et spec JSON brute sur /v1/docs.json.
  app.get('/v1/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'EatNext API — Documentation',
  }));

  // --- Routeurs métier montés sous le préfixe versionné ---
  const v1 = express.Router();
  v1.use('/auth', authLimiter, authRoutes);
  v1.use('/restaurants', restaurantRoutes);
  v1.use('/reviews', reviewRoutes);
  v1.use('/complaints', complaintRoutes);
  v1.use('/favorites', favoriteRoutes);
  v1.use('/admin', adminRoutes);

  // Le même routeur est exposé sur /v1 et /api/v1 pour compatibilité clients.
  app.use('/v1', v1);
  app.use('/api/v1', v1);

  // Toute route non résolue renvoie une 404 au format enveloppe standard.
  app.use((_req, res) => {
    sendError(res, makeError('NOT_FOUND', 'Route introuvable.', 404));
  });

  // Gestionnaire d'erreurs terminal : les AppError métier sont converties en
  // réponse structurée ; le reste passe par le handler générique (500).
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof AppError) {
      return sendError(res, { code: err.code, message: err.message, status: err.status });
    }
    return errorHandler(err, req, res, next);
  });

  return app;
}
