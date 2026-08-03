import { useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactInfos = [
  {
    icon: Mail,
    title: 'Email',
    lines: ['contact@eatnext.africa'],
  },
  {
    icon: Phone,
    title: 'Téléphone',
    lines: ['+237 6 90 00 00 00'],
  },
  {
    icon: MapPin,
    title: 'Adresse',
    lines: ['Rue de la Réunification', 'Douala, Cameroun'],
  },
  {
    icon: Clock,
    title: 'Horaires',
    lines: ['Lun. – Ven. : 8 h – 18 h', 'Sam. : 9 h – 13 h'],
  },
];

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

/**
 * Page « Contact » — coordonnées d'EatNext + formulaire de contact.
 * Le formulaire est purement côté client : validation locale puis toast de succès.
 */
export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  /** Valide les champs du formulaire et renvoie les erreurs éventuelles. */
  const validate = (): FormErrors => {
    const next: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = 'Le nom est requis.';
    } else if (trimmedName.length < 2) {
      next.name = 'Le nom doit contenir au moins 2 caractères.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "L'email est requis.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = 'Veuillez saisir une adresse email valide.';
    }

    if (!subject.trim()) {
      next.subject = 'Le sujet est requis.';
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      next.message = 'Le message est requis.';
    } else if (trimmedMessage.length < 10) {
      next.message = 'Le message doit contenir au moins 10 caractères.';
    }

    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    toast.success('Merci ! Votre message a bien été envoyé.');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setErrors({});
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink-900">Contactez-nous</h1>
        <p className="mt-3 text-ink-500">
          Une question, une suggestion ou un partenariat en tête ? Écrivez-nous et notre équipe
          vous répondra dans les meilleurs délais.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* Coordonnées */}
        <div className="space-y-4 lg:col-span-2">
          {contactInfos.map(({ icon: Icon, title, lines }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-ink-900">{title}</h2>
                {lines.map((line) => (
                  <p key={line} className="text-sm text-ink-500">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-semibold text-ink-900">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nom"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Awa Ndiaye"
                  error={errors.name}
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
              </div>
              <Input
                label="Sujet"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="À quel sujet souhaitez-vous nous écrire ?"
                error={errors.subject}
              />
              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-ink-700">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message…"
                  className={cn(
                    'w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-ink-900',
                    'placeholder:text-ink-400 transition-colors',
                    'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                    errors.message && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                  )}
                />
                {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="h-4 w-4" />
                Envoyer le message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
