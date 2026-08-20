import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useRestaurantSearch } from '../../hooks/useRestaurants';
import type { Restaurant } from '../../types';

const DEBOUNCE_MS = 280;
const SUGGESTION_LIMIT = 8;

interface SearchBarProps {
  value?: string;
  onSubmit: (q: string) => void;
  /** Après debounce — ex. remplacer `?q=` sur `/search`. */
  onLiveQuery?: (q: string) => void;
  onQueryChange?: (q: string) => void;
  /** Lien « Voir tous les résultats » (défaut `/search?q=`). */
  getResultsHref?: (q: string) => string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  inputId?: string;
  /** Version navbar : pas de bouton « Chercher ». */
  compact?: boolean;
  /** Champ nu dans un <form> parent (accueil). */
  embedded?: boolean;
}

/**
 * Combobox de recherche — suggestions live, clavier, liste accessible.
 */
export function SearchBar({
  value = '',
  onSubmit,
  onLiveQuery,
  onQueryChange,
  placeholder = 'Restaurant, cuisine, quartier…',
  className,
  autoFocus,
  inputId = 'eatnext-search-q',
  compact,
  embedded,
}: SearchBarProps) {
  const navigate = useNavigate();
  const reactId = useId();
  const listboxId = `${inputId}-listbox-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQ = useDebouncedValue(q, DEBOUNCE_MS);
  const trimmed = debouncedQ.trim();
  const canSuggest = open && trimmed.length > 0;

  const { data, isFetching } = useRestaurantSearch(
    { q: trimmed || undefined, limit: SUGGESTION_LIMIT },
    { enabled: canSuggest },
  );

  const hits = (data?.items ?? []).slice(0, SUGGESTION_LIMIT);
  const footerIndex = hits.length;
  const optionCount = trimmed ? hits.length + 1 : 0;
  const showPanel = open && q.trim().length > 0;

  useEffect(() => {
    setQ(value);
  }, [value]);

  useEffect(() => {
    if (!onLiveQuery) return;
    const next = debouncedQ.trim();
    if (next === value.trim()) return;
    onLiveQuery(next);
  }, [debouncedQ, onLiveQuery, value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const goToSearch = (query: string) => {
    close();
    onSubmit(query.trim());
  };

  const goToRestaurant = (restaurant: Restaurant) => {
    close();
    navigate(`/restaurants/${restaurant.id}`);
  };

  const setQuery = (next: string) => {
    setQ(next);
    onQueryChange?.(next);
    setActiveIndex(-1);
    setOpen(next.trim().length > 0);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    goToSearch(q);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!q.trim()) return;
      setOpen(true);
      setActiveIndex((i) => (i < optionCount - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!q.trim()) return;
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Enter' && open && activeIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      if (activeIndex < hits.length) goToRestaurant(hits[activeIndex]);
      else goToSearch(q);
    }
  };

  const field = (
    <>
      {!embedded && <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />}
      <label className="sr-only" htmlFor={inputId}>
        Rechercher un restaurant
      </label>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
        }
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (q.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none',
          embedded && 'h-12 px-4 text-ink-900 placeholder:text-ink-400',
        )}
      />
      {!compact && !embedded && (
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Chercher
        </button>
      )}
    </>
  );

  const panel = showPanel ? (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Suggestions de restaurants"
      className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[70] max-h-80 overflow-auto rounded-2xl border border-ink-100 bg-white py-1 shadow-lg"
    >
      {isFetching && hits.length === 0 && (
        <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Recherche…
        </li>
      )}
      {!isFetching && hits.length === 0 && (
        <li className="px-3 py-2.5 text-sm text-ink-500">Aucun restaurant</li>
      )}
      {hits.map((restaurant, index) => (
        <li key={restaurant.id} role="presentation">
          <button
            type="button"
            id={`${listboxId}-opt-${index}`}
            role="option"
            aria-selected={activeIndex === index}
            className={cn(
              'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm',
              activeIndex === index ? 'bg-brand-50 text-brand-900' : 'text-ink-900 hover:bg-ink-50',
            )}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => goToRestaurant(restaurant)}
          >
            <span className="font-medium">{restaurant.name}</span>
            <span className="text-xs capitalize text-ink-500">
              {restaurant.city}
              {restaurant.cuisineType ? ` · ${restaurant.cuisineType}` : ''}
            </span>
          </button>
        </li>
      ))}
      <li role="presentation" className="border-t border-ink-100">
        <button
          type="button"
          id={`${listboxId}-opt-${footerIndex}`}
          role="option"
          aria-selected={activeIndex === footerIndex}
          className={cn(
            'flex w-full items-center px-3 py-2.5 text-left text-sm font-medium',
            activeIndex === footerIndex ? 'bg-brand-50 text-brand-800' : 'text-brand-700 hover:bg-ink-50',
          )}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setActiveIndex(footerIndex)}
          onClick={() => goToSearch(q)}
        >
          Voir tous les résultats
        </button>
      </li>
    </ul>
  ) : null;

  const barClass = cn(
    'flex items-center gap-2',
    embedded
      ? 'h-12 min-w-0'
      : cn(
          'rounded-2xl border border-ink-200 bg-white px-3',
          compact ? 'h-10' : 'h-11 shadow-sm',
          'focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20',
        ),
  );

  return (
    <div ref={containerRef} className={cn('relative', embedded && 'min-w-0', className)}>
      {embedded ? (
        <div className={barClass}>{field}</div>
      ) : (
        <form onSubmit={handleSubmit} role="search" className={barClass}>
          {field}
        </form>
      )}
      {panel}
    </div>
  );
}
