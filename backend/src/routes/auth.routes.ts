/**
 * Routes d'authentification (`/v1/auth`).
 *
 * Toutes ces routes sont protégées par un limiteur de débit (cf. `app.ts`).
 * La validation du corps est effectuée par des schémas Zod avant d'atteindre
 * le service, garantissant que les handlers reçoivent des données conformes.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// Schéma d'inscription : le rôle est restreint à user/owner (jamais admin via API publique).
const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'owner']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Créer un compte utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, minLength: 2, example: "Awa Ndiaye" }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role:
 *                 type: string
 *                 enum: [user, owner]
 *     responses:
 *       201:
 *         description: Compte créé, jetons retournés.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *                         tokens: { $ref: '#/components/schemas/AuthTokens' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       409:
 *         description: Email déjà utilisé.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Se connecter avec email et mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie, jetons retournés.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *                         tokens: { $ref: '#/components/schemas/AuthTokens' }
 *       401:
 *         description: Identifiants invalides.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Compte suspendu.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body.email, req.body.password);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renouveler les jetons via un refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nouveaux jetons.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokens' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    // Validation manuelle ici car le refresh token n'est pas couvert par un schéma Zod dédié.
    if (!refreshToken) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'refreshToken requis', status: 400 } });
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess(res, tokens);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion / inscription via Google (stub)
 *     description: Implémentation simplifiée — crée le compte s'il n'existe pas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               fullName: { type: string }
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *                         tokens: { $ref: '#/components/schemas/AuthTokens' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/google', validateBody(z.object({ email: z.string().email(), fullName: z.string().min(2) })), async (req, res, next) => {
  try {
    const data = await authService.googleLoginStub(req.body.email, req.body.fullName);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur courant.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    // `req.user` est garanti non nul grâce au middleware `authenticate`.
    const user = await authService.getMe(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Déconnexion
 *     description: >
 *       Les jetons étant stateless (JWT), la déconnexion est gérée côté client
 *       en supprimant les jetons. L'endpoint confirme simplement l'opération.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion confirmée.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/logout', authenticate, (_req, res) => {
  sendSuccess(res, { message: 'Déconnexion réussie.' });
});

export default router;
