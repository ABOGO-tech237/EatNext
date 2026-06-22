import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authApi from '../lib/api/auth';
import { useAuthStore } from '../stores/authStore';

/** Hook centralisant login / register / logout avec navigation et toasts. */
export function useAuthActions() {
  const navigate = useNavigate();
  const { setAuth, logout: clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success(`Bienvenue, ${data.user.fullName} !`);
      navigate('/');
    },
    onError: () => toast.error('Identifiants incorrects.'),
  });

  const registerMutation = useMutation({
    mutationFn: (payload: { fullName: string; email: string; password: string }) =>
      authApi.register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast.success('Compte créé avec succès !');
      navigate('/');
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

  return { loginMutation, registerMutation, logoutMutation };
}
