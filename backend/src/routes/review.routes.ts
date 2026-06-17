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

router.post('/restaurants/:id/reviews', authenticate, validateBody(reviewSchema), async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user!.sub, req.params.id, req.body);
    sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, validateBody(reviewSchema.partial()), async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.params.id, req.user!.sub, req.user!.role, req.body);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user!.sub, req.user!.role);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reply', authenticate, requireRole('owner', 'admin'), validateBody(z.object({ reply: z.string().min(1) })), async (req, res, next) => {
  try {
    const review = await reviewService.replyToReview(req.params.id, req.user!.sub, req.body.reply);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const review = await reviewService.flagReview(req.params.id);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
});

export default router;
