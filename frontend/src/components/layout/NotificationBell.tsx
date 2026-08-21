import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

/**
 * Notifications : panneau vide identifié — aucun faux message inventé.
 * Le backend n’expose pas encore de fil d’alertes.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-xl p-2 text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-4 shadow-card-hover"
        >
          <p className="text-sm font-semibold text-ink-900">Notifications</p>
          <p className="mt-2 text-sm text-ink-500">
            Aucune notification pour le moment. Ce panneau s’alimentera quand le fil d’alertes
            sera branché.
          </p>
        </div>
      )}
    </div>
  );
}
