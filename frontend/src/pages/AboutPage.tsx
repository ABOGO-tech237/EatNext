export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Maison</p>
      <h1 className="mt-2 text-4xl font-bold text-ink-900">À propos</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-600">
        EatNext est un annuaire ouvert des restaurants du Cameroun. Les diners
        découvrent, notent et gardent leurs tables. Les restaurateurs
        revendiquent une fiche OSM ou en créent une — sans payer pour exister.
      </p>
      <p className="mt-4 leading-relaxed text-ink-600">
        Nous commençons à Yaoundé et Douala. Les prix sont en FCFA. Pas de
        réservation, pas de livraison : juste le lieu, tel qu’il est.
      </p>
    </article>
  );
}
