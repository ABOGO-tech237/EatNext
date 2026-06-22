/**
 * Service d'administration.
 *
 * Regroupe les opérations de modération (bannir un utilisateur, approuver /
 * rejeter un restaurant, supprimer un avis) et les statistiques agrégées de la
 * plateforme. Toutes ces fonctions sont appelées depuis des routes déjà
 * protégées par le rôle `admin`.
 */
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { sanitizeUsers } from '../utils/user.js';

export async function listUsers(page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { items: sanitizeUsers(items), total, page, limit };
}

export async function banUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('USER_NOT_FOUND', 'Utilisateur introuvable.', 404);
  return prisma.user.update({ where: { id }, data: { isBanned: true } });
}

export async function listPendingRestaurants() {
  return prisma.restaurant.findMany({
    where: { status: 'pending' },
    include: { owner: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveRestaurant(id: string) {
  return prisma.restaurant.update({
    where: { id },
    data: { status: 'published' },
  });
}

export async function rejectRestaurant(id: string) {
  return prisma.restaurant.update({
    where: { id },
    data: { status: 'rejected' },
  });
}

export async function listFlaggedReviews() {
  return prisma.review.findMany({
    where: { isFlagged: true },
    include: {
      user: { select: { id: true, fullName: true } },
      restaurant: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function deleteReviewAdmin(id: string) {
  await prisma.review.delete({ where: { id } });
}

/**
 * Calcule les indicateurs clés du tableau de bord admin en une seule passe
 * (compteurs exécutés en parallèle) puis le top 5 des restaurants par note.
 */
export async function getAnalytics() {
  const [users, restaurants, reviews, complaints, pendingRestaurants] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count({ where: { status: 'published' } }),
    prisma.review.count(),
    prisma.complaint.count({ where: { status: 'pending' } }),
    prisma.restaurant.count({ where: { status: 'pending' } }),
  ]);

  const topRestaurants = await prisma.restaurant.findMany({
    where: { status: 'published' },
    orderBy: { avgRating: 'desc' },
    take: 5,
    select: { id: true, name: true, avgRating: true, city: true },
  });

  return {
    users,
    restaurants,
    reviews,
    pendingComplaints: complaints,
    pendingRestaurants,
    topRestaurants,
  };
}
