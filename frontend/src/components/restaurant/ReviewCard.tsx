import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Rating } from '../ui/Rating';
import type { Review } from '../../types';

interface ReviewCardProps {
  review: Review;
}

/** Carte d'avis individuel sur la fiche restaurant. */
export function ReviewCard({ review }: ReviewCardProps) {
  const date = format(new Date(review.createdAt), 'd MMMM yyyy', { locale: fr });

  return (
    <article className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {review.user?.fullName?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="font-medium text-ink-900">{review.user?.fullName ?? 'Anonyme'}</p>
            <p className="text-xs text-ink-400">{date}</p>
          </div>
        </div>
        <Rating value={review.rating} showValue={false} size="sm" />
      </div>
      {review.content && (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{review.content}</p>
      )}
    </article>
  );
}
