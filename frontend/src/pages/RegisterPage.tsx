import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthActions } from '../hooks/useAuth';

/** Page d'inscription — création de compte utilisateur. */
export default function RegisterPage() {
  const { registerMutation } = useAuthActions();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ fullName, email, password });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-ink-900">Créer un compte</h1>
          <p className="mt-2 text-sm text-ink-500">
            Rejoignez la communauté EatNext en quelques secondes.
          </p>

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
              S'inscrire
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
