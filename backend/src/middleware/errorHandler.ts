import type { NextFunction, Request, Response } from 'express';
import { makeError, sendError } from '../utils/response.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof Error && 'status' in err) {
    const apiErr = err as Error & { status: number; code?: string };
    return sendError(res, {
      code: apiErr.code ?? 'ERROR',
      message: apiErr.message,
      status: apiErr.status,
    });
  }

  console.error(err);
  return sendError(res, makeError('INTERNAL_ERROR', 'Erreur serveur inattendue.', 500));
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
