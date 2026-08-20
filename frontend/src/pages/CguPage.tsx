export default function CguPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Légal</p>
      <h1 className="mt-2 text-4xl font-bold text-ink-900">Conditions générales</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-600">
        <p>
          EatNext publie un annuaire ouvert. Les fiches issues d’OpenStreetMap
          restent attribuées à leurs contributeurs jusqu’à revendication par un
          établissement.
        </p>
        <p>
          Les restaurants créés par un utilisateur sont visibles comme « Non
          vérifié ». Un administrateur peut suspendre une fiche abusive.
        </p>
        <p>
          Les avis reflètent l’opinion de leurs auteurs. Le propriétaire d’une
          fiche officielle peut y répondre. Les prix sont indiqués en FCFA (XAF).
        </p>
      </div>
    </article>
  );
}
