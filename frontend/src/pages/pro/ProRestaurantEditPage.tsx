import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRestaurant } from '../../hooks/useRestaurants';
import { PRICE_RANGE_TIERS } from '../../lib/utils';
import * as restaurantApi from '../../lib/api/restaurants';
import { Spinner } from '../../components/ui/Spinner';

export default function ProRestaurantEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useRestaurant(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    cuisineType: '',
    priceRange: 2,
    phone: '',
    website: '',
    openingHours: '',
    photos: '',
    lat: 0,
    lng: 0,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      description: data.description ?? '',
      address: data.address,
      city: data.city,
      cuisineType: data.cuisineType,
      priceRange: data.priceRange,
      phone: data.phone ?? '',
      website: data.website ?? '',
      openingHours: data.openingHours ?? '',
      photos: data.photos.join('\n'),
      lat: data.lat,
      lng: data.lng,
    });
  }, [data]);

  const patch = (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await restaurantApi.updateRestaurant(id, {
        name: form.name,
        description: form.description,
        address: form.address,
        city: form.city,
        cuisineType: form.cuisineType,
        priceRange: Number(form.priceRange),
        phone: form.phone,
        website: form.website || undefined,
        openingHours: form.openingHours,
        photos: form.photos.split('\n').map((s) => s.trim()).filter(Boolean),
        lat: Number(form.lat),
        lng: Number(form.lng),
      });
      await refetch();
      toast.success('Fiche enregistrée.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Éditeur</p>
      <h1 className="mt-1 text-3xl font-bold text-ink-900">{data.name}</h1>
      <div className="mt-2 flex gap-3 text-sm">
        <Link to={`/pro/restaurants/${id}/menu`} className="text-brand-600">
          Menu
        </Link>
        <Link to={`/pro/restaurants/${id}/reviews`} className="text-brand-600">
          Avis
        </Link>
        <Link to={`/restaurants/${id}`} className="text-ink-400">
          Fiche publique
        </Link>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-card">
        <Input label="Nom" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm"
          />
        </div>
        <Input label="Adresse" value={form.address} onChange={(e) => patch({ address: e.target.value })} />
        <Input label="Ville" value={form.city} onChange={(e) => patch({ city: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Latitude" type="number" step="0.0001" value={form.lat} onChange={(e) => patch({ lat: Number(e.target.value) })} />
          <Input label="Longitude" type="number" step="0.0001" value={form.lng} onChange={(e) => patch({ lng: Number(e.target.value) })} />
        </div>
        <Input label="Cuisine" value={form.cuisineType} onChange={(e) => patch({ cuisineType: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Prix (FCFA)</label>
          <select
            value={form.priceRange}
            onChange={(e) => patch({ priceRange: Number(e.target.value) })}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
          >
            {PRICE_RANGE_TIERS.map((t) => (
              <option key={t.level} value={t.level}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Input label="Téléphone" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
        <Input label="Site web" value={form.website} onChange={(e) => patch({ website: e.target.value })} />
        <Input label="Horaires" value={form.openingHours} onChange={(e) => patch({ openingHours: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Photos (URLs)</label>
          <textarea
            value={form.photos}
            onChange={(e) => patch({ photos: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm"
          />
        </div>
        <Button type="submit" loading={saving}>
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
