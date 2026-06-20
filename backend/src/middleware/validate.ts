/**
 * Middlewares de validation basés sur Zod.
 *
 * En cas d'échec, ils renvoient une 400 normalisée (code VALIDATION_ERROR) ;
 * en cas de succès, ils remplacent `req.body` / `req.query` par les données
 * validées et typées, garantissant aux handlers des entrées sûres.
 */
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { makeError, sendError } from '../utils/response.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        makeError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Données invalides.', 400),
      );
    }
    req.body = parsed.data;
    return next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return sendError(
        res,
        makeError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Paramètres invalides.', 400),
      );
    }
    req.query = parsed.data as Request['query'];
    return next();
  };
}
