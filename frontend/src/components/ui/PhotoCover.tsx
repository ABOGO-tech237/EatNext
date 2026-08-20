import { cn } from '../../lib/utils';

const PALETTES = [
  'from-brand-800 via-brand-600 to-ink-900',
  'from-ink-800 via-ink-700 to-ink-900',
  'from-brand-900 via-ink-800 to-brand-700',
  'from-ink-700 via-brand-800 to-ink-900',
];

function paletteFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % PALETTES.length;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

interface PhotoCoverProps {
  src?: string | null;
  alt: string;
  seed?: string;
  className?: string;
  imgClassName?: string;
}

/** Photo ou dégradé marque (aucun hotlink Unsplash). */
export function PhotoCover({ src, alt, seed, className, imgClassName }: PhotoCoverProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover', imgClassName)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn('relative h-full w-full bg-gradient-to-br', paletteFor(seed ?? alt), className)}
      role="img"
      aria-label={alt}
    />
  );
}
