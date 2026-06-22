import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';

/** URL de base de l'API — surchargeable via variable d'environnement Vite. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

/**
 * Mode mock explicite uniquement (démo hors-ligne).
 * Par défaut false : le frontend exige une API backend disponible.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/** Instance Axios partagée par tous les modules API. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
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

/** Formate les erreurs API pour l'UI (message lisible). */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      error.response?.data?.error?.message ??
      (error.response
        ? `Erreur ${error.response.status}`
        : 'Impossible de joindre le serveur — vérifiez que le backend tourne sur le port 3000.');
    return Promise.reject(new Error(message));
  },
);

/**
 * Exécute une requête API ou le mock si VITE_USE_MOCK=true.
 * Aucun repli silencieux en cas d'erreur réseau.
 */
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockCall: () => T | Promise<T>,
): Promise<T> {
  if (USE_MOCK) return mockCall();
  return apiCall();
}
