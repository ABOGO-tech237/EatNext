import { Router } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as restaurantService from '../services/restaurant.service.js';

const router = Router();

const searchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  cuisine: z.string().optional(),
  minRating: z.coerce.number().optional(),
  priceRange: z.coerce.number().min(1).max(4).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
  sortBy: z.enum(['rating', 'distance', 'name']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  cuisineType: z.string().min(2),
  priceRange: z.number().min(1).max(4),
  photos: z.array(z.string()).optional(),
});

router.get('/', validateQuery(searchSchema), async (req, res, next) => {
  try {
    const result = await restaurantService.searchRestaurants(req.query as never);
    sendSuccess(res, result.items, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/nearby', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 5000);
    const limit = Number(req.query.limit ?? 20);
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'lat et lng requis', status: 400 } });
    }
    const result = await restaurantService.getNearbyRestaurants(lat, lng, radius, limit);
    sendSuccess(res, result.items);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validateBody(createSchema), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user!.sub, req.body);
    sendSuccess(res, restaurant, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      req.body,
    );
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      req.body,
    );
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await restaurantService.deleteRestaurant(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/claim', authenticate, async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      { status: 'pending' },
    );
    await restaurantService.updateRestaurant(req.params.id, 'admin', 'admin', {});
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/photos', authenticate, validateBody(z.object({ photos: z.array(z.string()) })), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    if (req.user!.role !== 'admin' && restaurant.ownerId !== req.user!.sub) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé', status: 403 } });
    }
    const updated = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      { photos: req.body.photos },
    );
    sendSuccess(res, updated, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
