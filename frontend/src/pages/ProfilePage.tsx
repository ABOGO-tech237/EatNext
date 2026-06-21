import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, Shield, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAuthActions } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

/** Page profil — informations du compte connecté. */
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { logoutMutation } = useAuthActions();

  if (!user) return null;

  const memberSince = user.createdAt
    ? format(new Date(user.createdAt), 'MMMM yyyy', { locale: fr })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">Mon profil</h1>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink-900">{user.fullName}</h2>
            <Badge variant="muted" className="mt-1 capitalize">{user.role}</Badge>
          </div>
        </div>

        <dl className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-5 w-5 text-ink-400" />
            <div>
              <dt className="text-ink-400">Email</dt>
              <dd className="font-medium text-ink-800">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-5 w-5 text-ink-400" />
            <div>
              <dt className="text-ink-400">Vérification</dt>
              <dd className="font-medium text-ink-800">
                {user.isVerified ? 'Compte vérifié' : 'Non vérifié'}
              </dd>
            </div>
          </div>
          {memberSince && (
            <div className="flex items-center gap-3 text-sm">
              <UserIcon className="h-5 w-5 text-ink-400" />
              <div>
                <dt className="text-ink-400">Membre depuis</dt>
                <dd className="font-medium text-ink-800 capitalize">{memberSince}</dd>
              </div>
            </div>
          )}
        </dl>

        <Button
          variant="outline"
          className="mt-8 w-full"
          onClick={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
        >
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
