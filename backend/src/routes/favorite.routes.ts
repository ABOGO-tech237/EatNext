/**
 * Routes des favoris (`/v1/favorites`).
 *
 * Toutes les routes exigent une authentification : un favori est toujours
 * rattaché à l'utilisateur connecté. Les listes permettent de regrouper des
 * favoris (ex. « À tester », « Coups de cœur »).
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as favoriteService from '../services/favorite.service.js';

const router = Router();

/**
 * @openapi
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Lister mes restaurants favoris
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favoris de l'utilisateur (avec restaurant et liste associée).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Favorite' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const favorites = await favoriteService.listFavorites(req.user!.sub);
    sendSuccess(res, favorites);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/{restaurantId}/status:
 *   get:
 *     tags: [Favorites]
 *     summary: Vérifier si un restaurant est en favori
 *     security:
 *       - bearerAuth: []
 */
router.get('/:restaurantId/status', authenticate, async (req, res, next) => {
  try {
    const isFav = await favoriteService.isFavorite(req.user!.sub, req.params.restaurantId);
    sendSuccess(res, { isFavorite: isFav });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/lists:
 *   get:
 *     tags: [Favorites]
 *     summary: Lister mes listes de favoris
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listes de favoris avec le nombre d'éléments.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/FavoriteList' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/lists', authenticate, async (req, res, next) => {
  try {
    const lists = await favoriteService.listFavoriteLists(req.user!.sub);
    sendSuccess(res, lists);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/lists:
 *   post:
 *     tags: [Favorites]
 *     summary: Créer une liste de favoris
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Liste créée.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/FavoriteList' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/lists', authenticate, validateBody(z.object({ name: z.string().min(1) })), async (req, res, next) => {
  try {
    const list = await favoriteService.createFavoriteList(req.user!.sub, req.body.name);
    sendSuccess(res, list, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/lists/{id}/add:
 *   post:
 *     tags: [Favorites]
 *     summary: Ajouter un restaurant à une liste
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Identifiant de la liste }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId]
 *             properties:
 *               restaurantId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Restaurant ajouté à la liste.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Favorite' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/lists/:id/add', authenticate, validateBody(z.object({ restaurantId: z.string().uuid() })), async (req, res, next) => {
  try {
    const favorite = await favoriteService.addToFavoriteList(req.user!.sub, req.params.id, req.body.restaurantId);
    sendSuccess(res, favorite, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/{restaurantId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Ajouter un restaurant aux favoris
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Favori ajouté (idempotent via upsert).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Favorite' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:restaurantId', authenticate, async (req, res, next) => {
  try {
    const favorite = await favoriteService.addFavorite(req.user!.sub, req.params.restaurantId);
    sendSuccess(res, favorite, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /favorites/{restaurantId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Retirer un restaurant des favoris
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Favori retiré.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:restaurantId', authenticate, async (req, res, next) => {
  try {
    await favoriteService.removeFavorite(req.user!.sub, req.params.restaurantId);
    sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
});

export default router;
