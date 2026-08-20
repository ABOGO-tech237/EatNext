import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useRestaurantReviews } from '../../hooks/useRestaurants';
import { ReviewCard } from '../../components/restaurant/ReviewCard';
import { Button } from '../../components/ui/Button';
import * as restaurantApi from '../../lib/api/restaurants';
import { useQueryClient } from '@tanstack/react-query';
import { restaurantKeys } from '../../hooks/useRestaurants';
import { Spinner } from '../../components/ui/Spinner';

export default function ProRestaurantReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useRestaurantReviews(id);
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reply = async (e: FormEvent, reviewId: string) => {
    e.preventDefault();
    const text = drafts[reviewId]?.trim();
    if (!text) return;
    setPendingId(reviewId);
    try {
      await restaurantApi.replyToReview(reviewId, text);
      queryClient.invalidateQueries({ queryKey: restaurantKeys.reviews(id ?? '') });
      toast.success('Réponse publiée.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Réponse impossible.');
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/pro/restaurants/${id}`} className="text-sm text-ink-400">
        ← Fiche
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">Avis</h1>
      <ul className="mt-6 space-y-4">
        {data?.items.length === 0 && (
          <li className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center text-sm text-ink-500">
            Aucun avis pour l'instant. Ils apparaîtront ici dès qu'un diner notera la table.
          </li>
        )}
        {data?.items.map((review) => (
          <li key={review.id} className="space-y-3">
            <ReviewCard review={review} />
            {!review.ownerReply && (
              <form
                onSubmit={(e) => reply(e, review.id)}
                className="rounded-2xl bg-white p-4 shadow-card"
              >
                <label className="text-sm font-medium text-ink-700" htmlFor={`reply-${review.id}`}>
                  Répondre
                </label>
                <textarea
                  id={`reply-${review.id}`}
                  value={drafts[review.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm" className="mt-2" loading={pendingId === review.id}>
                  Publier la réponse
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
