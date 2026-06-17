import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as complaintService from '../services/complaint.service.js';

const router = Router();

const createSchema = z.object({
  restaurantId: z.string().uuid(),
  type: z.enum(['poor_service', 'hygiene', 'wrong_info', 'fraud', 'closed_business']),
  description: z.string().min(10),
});

router.post('/', authenticate, validateBody(createSchema), async (req, res, next) => {
  try {
    const complaint = await complaintService.createComplaint(req.user!.sub, req.body);
    sendSuccess(res, complaint, 201);
  } catch (err) {
    next(err);
  }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const complaints = await complaintService.getMyComplaints(req.user!.sub);
    sendSuccess(res, complaints);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id, req.user!.sub, req.user!.role);
    sendSuccess(res, complaint);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authenticate, requireRole('admin'), validateBody(z.object({
  status: z.enum(['under_review', 'resolved', 'rejected']),
  adminNote: z.string().optional(),
})), async (req, res, next) => {
  try {
    const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body.status, req.body.adminNote);
    sendSuccess(res, complaint);
  } catch (err) {
    next(err);
  }
});

export default router;
