import { apiClient, withMockFallback } from './client';
import { MOCK_USER } from '../mockData';
import type { ApiResponse, AuthTokens, User } from '../../types';

interface AuthPayload {
  user: User;
  tokens: AuthTokens;
}

/** Inscription d'un nouvel utilisateur. */
export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthPayload> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/register', payload);
      return data.data;
    },
    () => ({
      user: { ...MOCK_USER, fullName: payload.fullName, email: payload.email },
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
    }),
  );
}

/** Connexion par email / mot de passe. */
export async function login(email: string, password: string): Promise<AuthPayload> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', {
        email,
        password,
      });
      return data.data;
    },
    () => ({
      user: { ...MOCK_USER, email },
      tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
    }),
  );
}

/** Récupère le profil de l'utilisateur connecté. */
export async function getMe(): Promise<User> {
  return withMockFallback(
    async () => {
      const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      return data.data.user;
    },
    () => MOCK_USER,
  );
}

/** Déconnexion côté serveur (confirmation) puis purge locale. */
export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // La déconnexion est stateless — on ignore les erreurs réseau.
  }
}
