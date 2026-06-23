/**
 * Extraction d'URLs photo depuis les tags OpenStreetMap.
 * Sources : image, wikimedia_commons, mapillary, logo.
 * Sans tag image → tableau vide (photo par défaut côté frontend).
 */
export function extractPhotosFromOsmTags(tags: Record<string, string>): string[] {
  const photos: string[] = [];

  const push = (url: string | undefined) => {
    if (!url) return;
    const normalized = normalizeImageUrl(url);
    if (normalized && !photos.includes(normalized)) photos.push(normalized);
  };

  push(tags.image);
  push(tags.photo);
  push(tags['image:url']);

  for (const [key, value] of Object.entries(tags)) {
    if (!value) continue;
    if (key.startsWith('image:') || key.startsWith('photo:')) push(value);
  }

  const commons = tags.wikimedia_commons ?? tags['wikimedia commons'];
  if (commons?.startsWith('File:')) {
    const file = commons.slice(5);
    push(
      `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`,
    );
  }

  if (tags.mapillary) {
    push(`https://images.mapillary.com/${tags.mapillary}/thumb-2048.jpg`);
  }

  push(tags.logo?.startsWith('http') ? tags.logo : undefined);

  return photos.slice(0, 5);
}

function normalizeImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return null;
}

/** Retire les anciennes cartes statiques OSM stockées comme « photo ». */
export function isOsmStaticMapUrl(url: string): boolean {
  return url.includes('staticmap.openstreetmap.de');
}
