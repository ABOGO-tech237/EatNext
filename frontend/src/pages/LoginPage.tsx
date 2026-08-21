import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthActions } from '../hooks/useAuth';
import { FadeIn } from '../components/ui/FadeIn';
import { BrandLogo } from '../components/brand/BrandLogo';

/** Page de connexion — formulaire email/mot de passe. */
export default function LoginPage() {
  const { loginMutation } = useAuthActions();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <FadeIn className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-card">
          <BrandLogo layout="wordmark" className="mb-6" />
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Espace membre</p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">Connexion</h1>
          <p className="mt-2 text-sm text-ink-500">Favoris, avis, et console restaurateur.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
            <Input
              label="Mot de passe"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={loginMutation.isPending}>
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Pas encore de compte ?{' '}
            <Link to="/register" state={{ from }} className="font-medium text-brand-600 hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
