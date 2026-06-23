import { apiClient } from './client';
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
  const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/register', payload);
  return data.data;
}

/** Connexion par email / mot de passe. */
export async function login(email: string, password: string): Promise<AuthPayload> {
  const { data } = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

/** Récupère le profil de l'utilisateur connecté. */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
  return data.data.user;
}

/** Déconnexion côté serveur (confirmation) puis purge locale. */
export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // La déconnexion est stateless — on ignore les erreurs réseau.
  }
}
