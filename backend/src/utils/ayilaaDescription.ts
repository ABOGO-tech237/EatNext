/**
 * Extrait le texte « Aperçu » d’une fiche Ayilaa (`<p itemprop="description">`).
 */

const USER_AGENT = process.env.AYILAA_USER_AGENT ?? 'EatNext/1.0 (import@eatnext.africa)';
const MIN_INTERVAL_MS = 1100;
let lastRequestAt = 0;

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&rsquo;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&rdquo;/gi, '”')
    .replace(/&ldquo;/gi, '“')
    .replace(/&agrave;/gi, 'à')
    .replace(/&aacute;/gi, 'á')
    .replace(/&acirc;/gi, 'â')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&euml;/gi, 'ë')
    .replace(/&icirc;/gi, 'î')
    .replace(/&iuml;/gi, 'ï')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Agrave;/gi, 'À')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function extractAyilaaDescription(html: string): string | null {
  const match = html.match(/<p[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/div>/i);
  if (!match?.[1]) return null;

  const text = decodeEntities(match[1].replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 40) return null;
  return text.slice(0, 4000);
}

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Télécharge la fiche Ayilaa et renvoie le paragraphe Aperçu. */
export async function fetchAyilaaDescription(url: string): Promise<string | null> {
  if (!url.includes('ayilaa.com')) return null;
  await throttle();

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) return null;
  return extractAyilaaDescription(await res.text());
}
