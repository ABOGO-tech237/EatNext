import { useState } from 'react';
import { cn } from '../../lib/utils';
import { coverForCuisine } from '../../lib/covers';

interface PhotoCoverProps {
  src?: string | null;
  alt: string;
  seed?: string;
  cuisine?: string | null;
  className?: string;
  imgClassName?: string;
}

/**
 * Photo réelle, sinon illustration cuisine locale.
 * `onError` évite les trous noirs (URL Ayilaa/OSM morte).
 */
export function PhotoCover({ src, alt, cuisine, className, imgClassName }: PhotoCoverProps) {
  const [failed, setFailed] = useState(false);
  const remote = src && !failed ? src : null;
  const fallback = coverForCuisine(cuisine);

  return (
    <img
      src={remote ?? fallback}
      alt={alt}
      className={cn('h-full w-full object-cover', imgClassName, className)}
      loading="lazy"
      onError={() => {
        if (remote) setFailed(true);
      }}
    />
  );
}
