import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as favoriteService from '../services/favorite.service.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const favorites = await favoriteService.listFavorites(req.user!.sub);
    sendSuccess(res, favorites);
  } catch (err) {
    next(err);
  }
});

router.post('/:restaurantId', authenticate, async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(req.user!.sub, req.params.restaurantId);
    sendSuccess(res, favorite, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/:restaurantId', authenticate, async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user!.sub, req.params.restaurantId);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

router.get('/lists/all', authenticate, async (req, res, next) => {
  try {
    const lists = await favoriteService.listFavoriteLists(req.user!.sub);
    sendSuccess(res, lists);
  } catch (err) {
    next(err);
  }
});

router.post('/lists', authenticate, validateBody(z.object({ name: z.string().min(1) })), async (req, res, next) => {
  try {
    const list = await favoriteService.createFavoriteList(req.user!.sub, req.body.name);
    sendSuccess(res, list, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/lists/:id/add', authenticate, validateBody(z.object({ restaurantId: z.string().uuid() })), async (req, res, next) => {
  try {
    const favorite = await favoriteService.addToFavoriteList(req.user!.sub, req.params.id, req.body.restaurantId);
    sendSuccess(res, favorite, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
