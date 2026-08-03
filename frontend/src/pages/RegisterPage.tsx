import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthActions } from '../hooks/useAuth';

/** Contraintes de mot de passe : min 8 caractères, au moins une lettre et un chiffre. */
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/** Page d'inscription — création de compte utilisateur. */
export default function RegisterPage() {
  const { registerMutation } = useAuthActions();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /** Valide tous les champs et renvoie les erreurs éventuelles. */
  const validate = (): FormErrors => {
    const next: FormErrors = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      next.fullName = 'Le nom complet est requis.';
    } else if (trimmedName.length < 2) {
      next.fullName = 'Le nom doit contenir au moins 2 caractères.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "L'email est requis.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = 'Veuillez saisir une adresse email valide.';
    }

    if (!password) {
      next.password = 'Le mot de passe est requis.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      next.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      next.password = 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Veuillez confirmer votre mot de passe.';
    } else if (confirmPassword !== password) {
      next.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-ink-900">Créer un compte</h1>
          <p className="mt-2 text-sm text-ink-500">
            Rejoignez la communauté EatNext en quelques secondes.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Input
              label="Nom complet"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Awa Ndiaye"
              error={errors.fullName}
            />
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              error={errors.email}
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                error={errors.password}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                className="absolute right-3 top-9 text-ink-400 transition-colors hover:text-ink-600 focus:outline-none focus-visible:text-brand-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                error={errors.confirmPassword}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                className="absolute right-3 top-9 text-ink-400 transition-colors hover:text-ink-600 focus:outline-none focus-visible:text-brand-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {!errors.password && (
              <p className="text-xs text-ink-400">
                Au moins 8 caractères, avec une lettre et un chiffre.
              </p>
            )}

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
