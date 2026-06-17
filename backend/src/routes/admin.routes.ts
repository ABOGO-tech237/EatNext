import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as adminService from '../services/admin.service.js';
import * as complaintService from '../services/complaint.service.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await adminService.listUsers(page, limit);
    sendSuccess(res, result.items, 200, { page: result.page, limit: result.limit, total: result.total });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await adminService.banUser(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

router.get('/restaurants/pending', async (_req, res, next) => {
  try {
    const restaurants = await adminService.listPendingRestaurants();
    sendSuccess(res, restaurants);
  } catch (err) {
    next(err);
  }
});

router.patch('/restaurants/:id/approve', async (req, res, next) => {
  try {
    const restaurant = await adminService.approveRestaurant(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.patch('/restaurants/:id/reject', async (req, res, next) => {
  try {
    const restaurant = await adminService.rejectRestaurant(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

router.get('/complaints', async (req, res, next) => {
  try {
    const status = req.query.status as never;
    const complaints = await complaintService.listAllComplaints(status);
    sendSuccess(res, complaints);
  } catch (err) {
    next(err);
  }
});

router.get('/reviews/flagged', async (_req, res, next) => {
  try {
    const reviews = await adminService.listFlaggedReviews();
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await adminService.deleteReviewAdmin(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', async (_req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
});

export default router;
