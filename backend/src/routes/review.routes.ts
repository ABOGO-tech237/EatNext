/**
 * Routes des avis (`/v1/reviews`).
 *
 * Note : la liste et la création d'avis sont rattachées à un restaurant via
 * le sous-chemin `/restaurants/{id}/reviews`. Les autres opérations ciblent un
 * avis par son identifiant. La règle métier impose un seul avis par couple
 * (utilisateur, restaurant) — voir le service.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as reviewService from '../services/review.service.js';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

const reviewUpdateSchema = reviewSchema.partial();

/**
 * @openapi
 * /reviews/restaurants/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Lister les avis d'un restaurant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Liste paginée d'avis.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Review' } }
 *                     meta: { $ref: '#/components/schemas/Pagination' }
 */
/**
 * @openapi
 * /reviews/me:
 *   get:
 *     tags: [Reviews]
 *     summary: Lister mes avis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Liste paginée des avis de l'utilisateur connecté.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await reviewService.listUserReviews(req.user!.sub, page, limit);
    sendSuccess(res, result.items, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
});

router.get('/restaurants/:id/reviews', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await reviewService.listRestaurantReviews(req.params.id, page, limit);
    sendSuccess(res, result.items, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reviews/restaurants/{id}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Publier un avis sur un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               content: { type: string }
 *               photos: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Avis créé (la note moyenne du restaurant est recalculée).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: L'utilisateur a déjà publié un avis pour ce restaurant.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/restaurants/:id/reviews', authenticate, validateBody(reviewSchema), async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user!.sub, req.params.id, req.body);
    sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Modifier son avis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               content: { type: string }
 *               photos: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Avis mis à jour.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, validateBody(reviewUpdateSchema), async (req, res, next) => {
  try {
    // Le service autorise l'auteur de l'avis ou un admin uniquement.
    const review = await reviewService.updateReview(req.params.id, req.user!.sub, req.user!.role, req.body);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Supprimer son avis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Avis supprimé (note moyenne recalculée).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user!.sub, req.user!.role);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reviews/{id}/reply:
 *   post:
 *     tags: [Reviews]
 *     summary: Répondre à un avis (propriétaire / admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reply]
 *             properties:
 *               reply: { type: string }
 *     responses:
 *       200:
 *         description: Réponse enregistrée.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/reply', authenticate, requireRole('owner', 'admin'), validateBody(z.object({ reply: z.string().min(1) })), async (req, res, next) => {
  try {
    // Double contrôle : `requireRole` filtre owner/admin, puis le service vérifie
    // que l'appelant est bien le propriétaire DU restaurant concerné.
    const review = await reviewService.replyToReview(req.params.id, req.user!.sub, req.body.reply);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /reviews/{id}/report:
 *   post:
 *     tags: [Reviews]
 *     summary: Signaler un avis abusif
 *     description: Marque l'avis comme `isFlagged` afin qu'un admin le modère.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Avis signalé.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Review' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const review = await reviewService.flagReview(req.params.id);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

export default router;
