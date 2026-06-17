import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

const router = Router();

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

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    sendSuccess(res, data, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body.email, req.body.password);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'refreshToken requis', status: 400 } });
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess(res, tokens);
  } catch (err) {
    next(err);
  }
});

router.post('/google', validateBody(z.object({ email: z.string().email(), fullName: z.string().min(2) })), async (req, res, next) => {
  try {
    const data = await authService.googleLoginStub(req.body.email, req.body.fullName);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.sub);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, (_req, res) => {
  sendSuccess(res, { message: 'Déconnexion réussie.' });
});

export default router;
