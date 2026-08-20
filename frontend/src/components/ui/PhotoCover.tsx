import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { coverForCuisine, DEFAULT_COVER } from '../../lib/covers';

interface PhotoCoverProps {
  src?: string | null;
  alt: string;
  seed?: string;
  cuisine?: string | null;
  className?: string;
  imgClassName?: string;
  /** Photo éditoriale locale si l’URL distante manque ou casse. */
  fallbackSrc?: string | null;
  /** LCP / hero seulement — n’active pas fetchPriority ailleurs. */
  priority?: boolean;
}

function usable(src?: string | null): src is string {
  return Boolean(src?.trim());
}

/**
 * Photo réelle, sinon fallback éditorial, sinon illustration cuisine locale.
 * `onError` évite les trous noirs (URL Ayilaa/OSM morte).
 */
export function PhotoCover({
  src,
  alt,
  cuisine,
  className,
  imgClassName,
  fallbackSrc,
  priority = false,
}: PhotoCoverProps) {
  const chain = useMemo(() => {
    const cuisineCover = coverForCuisine(cuisine);
    return [src, fallbackSrc, cuisineCover, DEFAULT_COVER].filter(
      (url, i, arr): url is string => usable(url) && arr.indexOf(url) === i,
    );
  }, [src, fallbackSrc, cuisine]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src, fallbackSrc, cuisine]);

  const current = chain[Math.min(index, chain.length - 1)] ?? DEFAULT_COVER;

  return (
    <img
      src={current}
      alt={alt}
      className={cn('h-full w-full object-cover', imgClassName, className)}
      loading={priority ? 'eager' : 'lazy'}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      decoding="async"
      onError={() => {
        setIndex((i) => (i + 1 < chain.length ? i + 1 : i));
      }}
    />
  );
}
