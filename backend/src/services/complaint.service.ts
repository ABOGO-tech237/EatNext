/**
 * Service métier des plaintes.
 *
 * Le cœur de ce service est une machine à états : une plainte ne peut changer
 * de statut qu'en suivant des transitions autorisées, ce qui empêche les
 * incohérences (ex. « résoudre » une plainte déjà rejetée).
 */
import { ComplaintStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Transitions autorisées de la machine à états des plaintes.
 * - pending      → under_review | rejected
 * - under_review → resolved | rejected
 * - resolved / rejected sont des états terminaux (aucune transition).
 */
const VALID_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  pending: ['under_review', 'rejected'],
  under_review: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

export async function createComplaint(
  userId: string,
  data: { restaurantId: string; type: string; description: string },
) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } });
  if (!restaurant) throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant introuvable.', 404);

  return prisma.complaint.create({
    data: {
      userId,
      restaurantId: data.restaurantId,
      type: data.type as never,
      description: data.description,
    },
    include: {
      restaurant: { select: { id: true, name: true } },
    },
  });
}

export async function getMyComplaints(userId: string) {
  return prisma.complaint.findMany({
    where: { userId },
    include: { restaurant: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getComplaintById(id: string, userId: string, role: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      restaurant: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!complaint) throw new AppError('COMPLAINT_NOT_FOUND', 'Plainte introuvable.', 404);
  // Confidentialité : seul l'auteur de la plainte ou un admin peut la consulter.
  if (role !== 'admin' && complaint.userId !== userId) {
    throw new AppError('FORBIDDEN', 'Accès refusé.', 403);
  }
  return complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  adminNote?: string,
) {
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) throw new AppError('COMPLAINT_NOT_FOUND', 'Plainte introuvable.', 404);

  // Refuse toute transition non prévue par la machine à états (HTTP 422).
  const allowed = VALID_TRANSITIONS[complaint.status];
  if (!allowed.includes(status)) {
    throw new AppError(
      'INVALID_TRANSITION',
      `Transition ${complaint.status} → ${status} non autorisée.`,
      422,
    );
  }

  return prisma.complaint.update({
    where: { id },
    data: { status, adminNote },
    include: { restaurant: { select: { id: true, name: true } } },
  });
}

export async function listAllComplaints(status?: ComplaintStatus) {
  return prisma.complaint.findMany({
    where: status ? { status } : undefined,
    include: {
      restaurant: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
