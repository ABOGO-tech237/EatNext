import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoCover } from '../ui/PhotoCover';
import { cn } from '../../lib/utils';

interface PhotoGalleryProps {
  photos: string[];
  name: string;
  seed: string;
  cuisine?: string | null;
  onOpen?: (src: string) => void;
}

/**
 * Galerie swipeable en haut de fiche — plusieurs images, snap, compteur.
 */
export function PhotoGallery({ photos, name, seed, cuisine, onOpen }: PhotoGalleryProps) {
  const slides = photos.length > 0 ? photos : [undefined];
  const [i, setI] = useState(0);
  const total = slides.length;

  const go = (next: number) => setI((next + total) % total);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink-900">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
          if (idx !== i && idx >= 0 && idx < total) setI(idx);
        }}
      >
        {slides.map((src, idx) => (
          <button
            key={src ?? `cover-${idx}`}
            type="button"
            className="relative min-h-[16rem] w-full shrink-0 snap-center sm:min-h-[22rem] lg:min-h-[28rem]"
            onClick={() => src && onOpen?.(src)}
          >
            <PhotoCover src={src} alt={idx === 0 ? name : ''} seed={`${seed}-${idx}`} cuisine={cuisine} />
          </button>
        ))}
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 sm:flex"
            onClick={() => go(i - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 sm:flex"
            onClick={() => go(i + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <p
            className={cn(
              'absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-0.5 text-xs font-medium text-white',
            )}
          >
            {i + 1} / {total}
          </p>
        </>
      )}
    </div>
  );
}
