import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useReplaceMenu, useRestaurantMenu } from '../../hooks/useRestaurants';
import { formatPrice } from '../../lib/utils';
import type { MenuItem } from '../../types';
import { Spinner } from '../../components/ui/Spinner';

export default function ProRestaurantMenuPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useRestaurantMenu(id);
  const replace = useReplaceMenu(id ?? '');
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const addRow = () => setItems((prev) => [...prev, { name: '', price: 0, description: '', category: '' }]);
  const update = (index: number, patch: Partial<MenuItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          price: Number(i.price),
          description: i.description || undefined,
          category: i.category || undefined,
        }));
      await replace.mutateAsync(payload);
      toast.success('Menu enregistré (FCFA).');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’enregistrer le menu.');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/pro/restaurants/${id}`} className="text-sm text-ink-400">
        ← Fiche
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">Menu</h1>
      <p className="mt-1 text-sm text-ink-500">Prix en FCFA. Remplace l'intégralité du menu.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-2xl bg-white p-4 shadow-card sm:grid-cols-[1fr_8rem_auto]">
            <div className="space-y-2 sm:col-span-2">
              <Input
                label="Plat"
                value={item.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
              <Input
                label="Description"
                value={item.description ?? ''}
                onChange={(e) => update(index, { description: e.target.value })}
              />
              <Input
                label="Catégorie"
                value={item.category ?? ''}
                onChange={(e) => update(index, { category: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Prix FCFA"
                type="number"
                min={0}
                value={item.price}
                onChange={(e) => update(index, { price: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-ink-400">{formatPrice(Number(item.price) || 0)}</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Retirer
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addRow}>
            Ajouter un plat
          </Button>
          <Button type="submit" loading={replace.isPending}>
            Enregistrer le menu
          </Button>
        </div>
      </form>
    </div>
  );
}
