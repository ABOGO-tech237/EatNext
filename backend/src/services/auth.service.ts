import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/user.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserRole } from '@prisma/client';

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new AppError('EMAIL_EXISTS', 'Cet email est déjà utilisé.', 409);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash: await hashPassword(input.password),
      role: input.role ?? 'user',
    },
  });

  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      expiresIn: 3600,
    },
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user?.passwordHash) throw new AppError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.', 401);
  if (user.isBanned) throw new AppError('USER_BANNED', 'Compte suspendu.', 403);

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.', 401);

  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      expiresIn: 3600,
    },
  };
}

export async function refreshTokens(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isBanned) throw new AppError('UNAUTHORIZED', 'Token invalide.', 401);

  const newPayload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
    expiresIn: 3600,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('USER_NOT_FOUND', 'Utilisateur introuvable.', 404);
  return sanitizeUser(user);
}

export async function googleLoginStub(email: string, fullName: string) {
  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        fullName,
        googleId: `stub-${Date.now()}`,
        isVerified: true,
      },
    });
  }

  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    user: sanitizeUser(user),
    tokens: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      expiresIn: 3600,
    },
  };
}
