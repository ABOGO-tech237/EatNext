import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchBarProps {
  value?: string;
  onSubmit: (q: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Barre texte unique — home, header et page recherche.
 */
export function SearchBar({
  value = '',
  onSubmit,
  placeholder = 'Restaurant, cuisine, quartier…',
  className,
  autoFocus,
}: SearchBarProps) {
  const [q, setQ] = useState(value);

  useEffect(() => {
    setQ(value);
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(q.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn(
        'flex h-11 items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 shadow-sm',
        'focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
      <label className="sr-only" htmlFor="eatnext-search-q">
        Rechercher un restaurant
      </label>
      <input
        id="eatnext-search-q"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Chercher
      </button>
    </form>
  );
}
