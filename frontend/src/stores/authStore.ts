import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, User } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  /** Indique si la session a été restaurée depuis le localStorage. */
  hydrated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  setHydrated: () => void;
}

/**
 * Store Zustand pour l'authentification.
 * Persiste user + tokens en localStorage pour conserver la session au rechargement.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hydrated: false,
      setAuth: (user, tokens) => set({ user, tokens }),
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      logout: () => set({ user: null, tokens: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'eatnext-auth',
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Sélecteur pratique : l'utilisateur est-il connecté ? */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.hydrated && !!s.user && !!s.tokens?.accessToken);
}
