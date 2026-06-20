/**
 * Aides au formatage des réponses HTTP selon l'enveloppe standard EatNext :
 *   succès -> { success: true, data, meta? }
 *   erreur -> { success: false, error: { code, message, status } }
 * Centraliser ce format garantit une API homogène pour tous les clients.
 */
import type { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
) {
  return res.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(res: Response, error: ApiError) {
  return res.status(error.status).json({
    success: false,
    error,
  });
}

export function makeError(code: string, message: string, status: number): ApiError {
  return { code, message, status };
}
