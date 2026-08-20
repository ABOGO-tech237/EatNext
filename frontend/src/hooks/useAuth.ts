import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authApi from '../lib/api/auth';
import { useAuthStore } from '../stores/authStore';

/** Hook centralisant login / register / logout avec navigation et toasts. */
export function useAuthActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, logout: clearAuth, setUser, setTokens, tokens } = useAuthStore();
  const from = (location.state as { from?: string } | null)?.from;

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success(`Bienvenue, ${data.user.fullName} !`);
      const dest =
        from ?? (data.user.role === 'owner' || data.user.role === 'admin' ? '/pro' : '/');
      navigate(dest);
    },
    onError: () => toast.error('Identifiants incorrects.'),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      fullName: string;
      email: string;
      password: string;
      role?: 'user' | 'owner';
    }) => authApi.register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success('Compte créé avec succès !');
      navigate(data.user.role === 'owner' ? '/pro/onboarding' : from ?? '/');
    },
    onError: () => toast.error('Impossible de créer le compte.'),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logoutApi,
    onSettled: () => {
      clearAuth();
      toast.success('Déconnexion réussie.');
      navigate('/');
    },
  });

  const refreshRole = async () => {
    try {
      const user = await authApi.getMe();
      setUser(user);
      if (tokens?.refreshToken) {
        const next = await authApi.refreshTokens(tokens.refreshToken);
        setTokens(next);
      }
      return user;
    } catch {
      return useAuthStore.getState().user;
    }
  };

  return { loginMutation, registerMutation, logoutMutation, refreshRole };
}
