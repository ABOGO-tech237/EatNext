export default function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Maison</p>
      <h1 className="mt-2 text-4xl font-bold text-ink-900">Contact</h1>
      <p className="mt-6 leading-relaxed text-ink-600">
        Une fiche à corriger, un quartier manquant, une question restaurateur ?
        Écrivez-nous à{' '}
        <a className="text-brand-600 underline" href="mailto:hello@eatnext.cm">
          hello@eatnext.cm
        </a>
        .
      </p>
    </article>
  );
}
