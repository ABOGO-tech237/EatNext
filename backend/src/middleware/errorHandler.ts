/**
 * Gestion centralisée des erreurs.
 *
 * `AppError` est l'erreur métier typée (code, message, status) levée par les
 * services. Le `errorHandler` final traduit toute erreur en réponse au format
 * enveloppe standard, et masque les détails internes derrière une 500 générique.
 */
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

  // Erreur non maîtrisée : on journalise la cause réelle mais on ne l'expose pas.
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
