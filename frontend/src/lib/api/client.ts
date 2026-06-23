import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';

/** URL de base de l'API — surchargeable via variable d'environnement Vite. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

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
    if (error.response?.status === 401) {
      const hadSession = !!useAuthStore.getState().tokens?.accessToken;
      useAuthStore.getState().logout();
      if (hadSession) {
        return Promise.reject(new Error('Session expirée — reconnectez-vous.'));
      }
    }

    const message =
      error.response?.data?.error?.message ??
      (error.response
        ? `Erreur ${error.response.status}`
        : 'Impossible de joindre le serveur — vérifiez que le backend tourne sur le port 3000.');
    return Promise.reject(new Error(message));
  },
);
