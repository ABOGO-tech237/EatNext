/**
 * Routes des plaintes (`/v1/complaints`).
 *
 * Une plainte suit une machine à états stricte (voir `complaint.service.ts`).
 * La consultation est réservée à l'auteur ou à un admin ; le changement de
 * statut est exclusivement réservé aux admins.
 */
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

/**
 * @openapi
 * /complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Déposer une plainte contre un restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, type, description]
 *             properties:
 *               restaurantId: { type: string, format: uuid }
 *               type: { $ref: '#/components/schemas/ComplaintType' }
 *               description: { type: string, minLength: 10 }
 *     responses:
 *       201:
 *         description: Plainte créée (statut initial `pending`).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Complaint' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/', authenticate, validateBody(createSchema), async (req, res, next) => {
  try {
    const complaint = await complaintService.createComplaint(req.user!.sub, req.body);
    sendSuccess(res, complaint, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /complaints/my:
 *   get:
 *     tags: [Complaints]
 *     summary: Lister mes plaintes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plaintes de l'utilisateur connecté.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Complaint' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const complaints = await complaintService.getMyComplaints(req.user!.sub);
    sendSuccess(res, complaints);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /complaints/{id}:
 *   get:
 *     tags: [Complaints]
 *     summary: Détail d'une plainte
 *     description: Accessible uniquement à l'auteur de la plainte ou à un admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Plainte trouvée.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Complaint' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id, req.user!.sub, req.user!.role);
    sendSuccess(res, complaint);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /complaints/{id}/status:
 *   patch:
 *     tags: [Complaints]
 *     summary: Changer le statut d'une plainte (admin)
 *     description: >
 *       Applique une transition de la machine à états. Transitions valides :
 *       pending → under_review|rejected, under_review → resolved|rejected.
 *       Une transition interdite renvoie 422.
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [under_review, resolved, rejected] }
 *               adminNote: { type: string }
 *     responses:
 *       200:
 *         description: Statut mis à jour.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Complaint' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422:
 *         description: Transition de statut non autorisée.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
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
