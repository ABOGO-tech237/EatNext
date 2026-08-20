import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthActions } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { FadeIn } from '../components/ui/FadeIn';
import { BrandLogo } from '../components/brand/BrandLogo';

/** Inscription — bascule Diner / Restaurateur (role owner). */
export default function RegisterPage() {
  const { registerMutation } = useAuthActions();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'owner'>(
    searchParams.get('role') === 'owner' ? 'owner' : 'user',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ fullName, email, password, role });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <FadeIn className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-card">
          <BrandLogo layout="wordmark" className="mb-6" />
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Rejoindre EatNext</p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">Créer un compte</h1>
          <p className="mt-2 text-sm text-ink-500">
            Dîner en ville ou tenir la salle — même plateforme, deux espaces.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-ink-100 p-1" role="tablist" aria-label="Type de compte">
            {(
              [
                { id: 'user' as const, label: 'Diner' },
                { id: 'owner' as const, label: 'Restaurateur' },
              ]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={role === opt.id}
                onClick={() => setRole(opt.id)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-semibold transition',
                  role === opt.id ? 'bg-brand-600 text-white' : 'text-ink-600',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Nom complet"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Awa Ndiaye"
            />
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Mot de passe"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
            <Button type="submit" className="w-full" loading={registerMutation.isPending}>
              {role === 'owner' ? 'Créer mon espace pro' : "S'inscrire"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
