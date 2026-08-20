import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CAMEROON_CITIES, PRICE_RANGE_TIERS } from '../../lib/utils';
import * as restaurantApi from '../../lib/api/restaurants';
import { useAuthActions } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { restaurantKeys } from '../../hooks/useRestaurants';

const STEPS = ['Identité', 'Adresse', 'Détails'] as const;

export default function ProRestaurantNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const multi = params.get('multi') === '1';
  const { refreshRole } = useAuthActions();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: 'Yaoundé',
    address: '',
    lat: Number(CAMEROON_CITIES[0].lat),
    lng: Number(CAMEROON_CITIES[0].lng),
    cuisineType: 'camerounaise',
    priceRange: 2,
    phone: '',
    website: '',
    openingHours: '',
    photos: '',
  });

  const cityCoords = useMemo(
    () => CAMEROON_CITIES.find((c) => c.name === form.city) ?? CAMEROON_CITIES[0],
    [form.city],
  );

  const patch = (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial }));

  const handleCity = (city: string) => {
    const found = CAMEROON_CITIES.find((c) => c.name === city);
    patch({
      city,
      lat: found ? Number(found.lat) : form.lat,
      lng: found ? Number(found.lng) : form.lng,
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    try {
      const created = await restaurantApi.createRestaurant({
        name: form.name,
        description: form.description || undefined,
        address: form.address,
        city: form.city,
        lat: Number(form.lat),
        lng: Number(form.lng),
        cuisineType: form.cuisineType,
        priceRange: Number(form.priceRange),
        phone: form.phone || undefined,
        website: form.website || undefined,
        openingHours: form.openingHours || undefined,
        photos: form.photos
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refreshRole();
      queryClient.invalidateQueries({ queryKey: restaurantKeys.mine });
      toast.success('Fiche publiée (non vérifiée).');
      navigate(`/pro/restaurants/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nouvelle fiche</p>
      <h1 className="mt-1 text-3xl font-bold text-ink-900">
        {multi ? 'Première adresse' : 'Créer un restaurant'}
      </h1>
      {multi && (
        <p className="mt-2 text-sm text-ink-500">
          Créez ce lieu, puis revenez au tableau de bord pour les autres adresses.
        </p>
      )}

      <ol className="mt-6 flex gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'text-brand-600' : undefined}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-card">
        {step === 0 && (
          <>
            <Input label="Nom" required value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm"
              />
            </div>
            <Input
              label="Cuisine"
              required
              value={form.cuisineType}
              onChange={(e) => patch({ cuisineType: e.target.value })}
            />
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
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Ville</label>
              <select
                value={form.city}
                onChange={(e) => handleCity(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"
              >
                {CAMEROON_CITIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Adresse"
              required
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                type="number"
                step="0.0001"
                required
                value={form.lat}
                onChange={(e) => patch({ lat: Number(e.target.value) })}
              />
              <Input
                label="Longitude"
                type="number"
                step="0.0001"
                required
                value={form.lng}
                onChange={(e) => patch({ lng: Number(e.target.value) })}
              />
            </div>
            <p className="text-xs text-ink-400">
              Centre par défaut : {cityCoords.name}. Ajustez l'épingle (lat/lng).
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <Input label="Téléphone" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
            <Input
              label="Site web"
              type="url"
              value={form.website}
              onChange={(e) => patch({ website: e.target.value })}
            />
            <Input
              label="Horaires"
              value={form.openingHours}
              onChange={(e) => patch({ openingHours: e.target.value })}
              placeholder="Lun–Sam 11h–23h"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Photos (une URL par ligne)
              </label>
              <textarea
                value={form.photos}
                onChange={(e) => patch({ photos: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm"
              />
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Retour
          </Button>
          <Button type="submit" loading={saving}>
            {step < 2 ? 'Continuer' : 'Publier la fiche'}
          </Button>
        </div>
      </form>
    </div>
  );
}
