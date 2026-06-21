import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';

/** URL de base de l'API — surchargeable via variable d'environnement Vite. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

/**
 * Force le mode mock (données locales) sans appeler le backend.
 * Utile pour le développement front isolé ou démo hors-ligne.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/** Instance Axios partagée par tous les modules API. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Injecte le jeton d'accès JWT sur chaque requête authentifiée. */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Détecte une erreur réseau ou 5xx pour basculer vers le mock si configuré. */
export function shouldUseMockFallback(error: unknown): boolean {
  if (USE_MOCK) return true;
  if (!axios.isAxiosError(error)) return false;
  const err = error as AxiosError;
  if (!err.response) return true; // pas de réponse = backend injoignable
  return err.response.status >= 500;
}

/** Exécute une requête API avec repli automatique sur une fonction mock. */
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockCall: () => T | Promise<T>,
): Promise<T> {
  if (USE_MOCK) return mockCall();
  try {
    return await apiCall();
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      console.warn('[EatNext] API indisponible — bascule en mode démo local.');
      return mockCall();
    }
    throw error;
  }
}
