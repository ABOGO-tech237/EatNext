import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.js';
import { makeError, sendError } from '../utils/response.js';
import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

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
