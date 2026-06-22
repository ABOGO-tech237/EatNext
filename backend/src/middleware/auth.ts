/**
 * Middlewares d'authentification et d'autorisation.
 *
 * - `authenticate` : exige un jeton Bearer valide et l'attache à `req.user`.
 * - `optionalAuth` : décode le jeton s'il est présent, sans bloquer sinon.
 * - `requireRole`  : restreint l'accès à certains rôles (à utiliser APRÈS
 *   `authenticate`).
 */
import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.js';
import { makeError, sendError } from '../utils/response.js';
import type { UserRole } from '@prisma/client';

// Étend le type Request d'Express pour transporter l'utilisateur authentifié.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Vérifie le jeton Bearer et rejette toute requête non authentifiée (401). */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendError(res, makeError('UNAUTHORIZED', 'Token manquant.', 401));
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
    return next();
  } catch {
    return sendError(res, makeError('UNAUTHORIZED', 'Token invalide ou expiré.', 401));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Fabrique un middleware qui n'autorise que les rôles indiqués.
 * Renvoie 401 si non authentifié, 403 si le rôle ne fait pas partie des rôles permis.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, makeError('UNAUTHORIZED', 'Authentification requise.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, makeError('FORBIDDEN', 'Accès refusé.', 403));
    }
    return next();
  };
}
