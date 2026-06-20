/**
 * Routes d'administration (`/v1/admin`).
 *
 * Un middleware appliqué à l'ensemble du routeur impose une authentification
 * ET le rôle `admin` : inutile donc de répéter `security` ressource par
 * ressource côté logique, mais on le documente sur chaque opération pour
 * Swagger. Couvre la modération des utilisateurs, restaurants et avis, ainsi
 * que les statistiques de la plateforme.
 */
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import * as adminService from '../services/admin.service.js';
import * as complaintService from '../services/complaint.service.js';

const router = Router();

// Garde globale : tout ce qui suit nécessite un admin authentifié.
router.use(authenticate, requireRole('admin'));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les utilisateurs (paginé)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Liste paginée d'utilisateurs.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *                     meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
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

/**
 * @openapi
 * /admin/users/{id}/ban:
 *   patch:
 *     tags: [Admin]
 *     summary: Bannir un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Utilisateur banni.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await adminService.banUser(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/restaurants/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les restaurants en attente de modération
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurants au statut `pending`.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/restaurants/pending', async (_req, res, next) => {
  try {
    const restaurants = await adminService.listPendingRestaurants();
    sendSuccess(res, restaurants);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/restaurants/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approuver un restaurant (le publier)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant publié.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/restaurants/:id/approve', async (req, res, next) => {
  try {
    const restaurant = await adminService.approveRestaurant(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/restaurants/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Rejeter un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant rejeté.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/restaurants/:id/reject', async (req, res, next) => {
  try {
    const restaurant = await adminService.rejectRestaurant(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/complaints:
 *   get:
 *     tags: [Admin]
 *     summary: Lister toutes les plaintes (filtrable par statut)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: status, schema: { $ref: '#/components/schemas/ComplaintStatus' } }
 *     responses:
 *       200:
 *         description: Plaintes de la plateforme.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Complaint' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/complaints', async (req, res, next) => {
  try {
    const status = req.query.status as never;
    const complaints = await complaintService.listAllComplaints(status);
    sendSuccess(res, complaints);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/reviews/flagged:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les avis signalés
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avis marqués comme signalés.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Review' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/reviews/flagged', async (_req, res, next) => {
  try {
    const reviews = await adminService.listFlaggedReviews();
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/reviews/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Supprimer un avis (modération)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Avis supprimé.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/reviews/:id', async (req, res, next) => {
  try {
    await adminService.deleteReviewAdmin(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Statistiques agrégées de la plateforme
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compteurs globaux et top restaurants.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/analytics', async (_req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/analytics/report:
 *   get:
 *     tags: [Admin]
 *     summary: Rapport analytique détaillé
 *     description: >
 *       Renvoie les mêmes indicateurs que /admin/analytics enrichis d'un
 *       horodatage de génération, format adapté à l'export.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport généré.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/analytics/report', async (_req, res, next) => {
  try {
    const analytics = await adminService.getAnalytics();
    // Enveloppe le rapport avec des métadonnées de génération pour l'export.
    sendSuccess(res, { generatedAt: new Date().toISOString(), ...analytics });
  } catch (err) {
    next(err);
  }
});

export default router;
