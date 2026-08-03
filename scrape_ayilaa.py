#!/usr/bin/env python3
"""
Scraper pour ayilaa.com — construit une base de données locale (JSONL + CSV)
des fiches (restaurants, hôtels, sites touristiques, etc.) du Cameroun.

Fonctionnement :
1. Parcourt les catégories principales (fixées ci-dessous, extraites du menu du site).
2. Pour chaque catégorie, pagine sur /fr/categorie/{id}/{slug}?page=N et récupère
   les liens vers les fiches (pattern d'URL /fr/{categorie}/{id}-{slug}).
3. Visite chaque fiche et extrait les détails (nom, adresse, description, photos, avis...).
4. Sauvegarde en continu dans un fichier JSONL (reprise possible si interrompu)
   puis exporte un CSV à la fin.

IMPORTANT :
- Vérifie robots.txt / CGU de ayilaa.com avant de lancer un scraping massif.
- Le script est volontairement lent (délai entre requêtes) pour ne pas surcharger le site.
- Les sélecteurs sont basés sur la structure observée le 03/07/2026 ; si le site change
  de template, ajuste les fonctions parse_listing_container() et parse_detail_page().
"""

import argparse
import csv
import json
import random
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ayilaa.com"

# Catégories principales extraites du menu (id, slug tels qu'utilisés dans les URLs)
MAIN_CATEGORIES = [
    (11, "restauration"),
    (12, "hotels-et-hebergements"),
    (13, "divertissements"),
    (14, "sites-touristiques"),
    (15, "modes-et-beaute"),
    (16, "transports"),
    (17, "commerces"),
    (18, "sports"),
    (19, "secours"),
    (20, "administrations"),
]

# Un lien de fiche ressemble à /fr/<slug-categorie>/<id>-<slug-du-lieu>
LISTING_LINK_RE = re.compile(r"^/fr/[a-z0-9\-]+/(\d+)-[a-z0-9\-]+/?$", re.IGNORECASE)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
}


def get_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def polite_get(session: requests.Session, url: str, delay_range=(1.0, 2.2), retries=3):
    """GET avec délai aléatoire, retries, et gestion d'erreurs basique."""
    for attempt in range(1, retries + 1):
        try:
            time.sleep(random.uniform(*delay_range))
            resp = session.get(url, timeout=20)
            if resp.status_code == 200:
                return resp
            if resp.status_code == 404:
                return None
            print(f"  [warn] {url} -> HTTP {resp.status_code} (essai {attempt}/{retries})")
        except requests.RequestException as e:
            print(f"  [warn] erreur réseau sur {url}: {e} (essai {attempt}/{retries})")
        time.sleep(2 * attempt)
    return None


def clean_text(s: str | None) -> str | None:
    if s is None:
        return None
    s = re.sub(r"\s+", " ", s).strip()
    return s or None


def extract_price(text: str) -> int | None:
    m = re.search(r"([\d\s,]+)\s*XAF", text)
    if not m:
        return None
    digits = re.sub(r"[^\d]", "", m.group(1))
    return int(digits) if digits else None


def extract_rating_stars(text: str) -> float | None:
    # La note "étoiles" (ex: 4.3) est toujours suivie de "(N likes)".
    # On évite ainsi de confondre avec la note globale sur 10 (ex: "9.0")
    # qui peut apparaître ailleurs dans le texte.
    m = re.search(r"(\d\.\d)\s*\(\s*\d+\s*likes?", text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r"\b(\d\.\d)\b", text)
    return float(m.group(1)) if m else None


def extract_likes(text: str) -> int | None:
    m = re.search(r"(\d+)\s*likes?", text, re.IGNORECASE)
    return int(m.group(1)) if m else None


# --------------------------------------------------------------------------
# 1. LISTING (pages de catégorie)
# --------------------------------------------------------------------------

def scrape_category_listing(session, cat_id: int, cat_slug: str, max_pages: int = 500):
    """Génère les items (dict basique) trouvés en paginant une catégorie."""
    page = 1
    seen_ids_this_category = set()
    while page <= max_pages:
        url = f"{BASE_URL}/fr/categorie/{cat_id}/{cat_slug}?page={page}"
        print(f"[listing] {cat_slug} page {page} -> {url}")
        resp = polite_get(session, url)
        if resp is None:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        links = soup.find_all("a", href=True)

        page_item_ids = set()
        for a in links:
            href = a["href"]
            path = urlparse(href).path
            m = LISTING_LINK_RE.match(path)
            if not m:
                continue
            item_id = m.group(1)
            if item_id in page_item_ids:
                continue
            page_item_ids.add(item_id)

            item = parse_listing_container(a, path)
            if item:
                item["id"] = item_id
                item["url"] = urljoin(BASE_URL, path)
                item["categorie_principale"] = cat_slug
                yield item

        if not page_item_ids or page_item_ids.issubset(seen_ids_this_category):
            # Rien de nouveau -> fin de la pagination
            break
        seen_ids_this_category |= page_item_ids
        page += 1


def parse_listing_container(a_tag, path: str) -> dict | None:
    """
    Remonte dans le DOM à partir du lien de la fiche pour trouver le bloc
    "carte" contenant nom / ville / prix / note / likes, puis extrait via regex.
    """
    container = a_tag
    block_text = ""
    for _ in range(6):
        if container.parent is None:
            break
        container = container.parent
        block_text = container.get_text(" ", strip=True)
        # Une carte complète contient généralement "XAF" et "likes"
        if "XAF" in block_text or "like" in block_text.lower():
            break

    name = clean_text(a_tag.get("title") or a_tag.get_text(" ", strip=True))
    if not name:
        img = a_tag.find("img")
        if img is not None:
            name = clean_text(img.get("alt"))

    # Ville / quartier : souvent sous la forme "Quartier, Ville, Cameroun"
    location_match = re.search(
        r"([A-ZÀ-Ý][\wÀ-ÿ'’\-\.\s]+,\s*[A-ZÀ-Ý][\wÀ-ÿ'’\-\.\s]+,\s*Cameroun)", block_text
    )
    location = clean_text(location_match.group(1)) if location_match else None
    quartier, ville = (None, None)
    if location:
        parts = [p.strip() for p in location.split(",")]
        if len(parts) >= 3:
            quartier, ville = parts[0], parts[1]

    return {
        "nom": name,
        "quartier": quartier,
        "ville": ville,
        "localisation_brute": location,
        "prix_a_partir_de_xaf": extract_price(block_text),
        "note_etoiles": extract_rating_stars(block_text),
        "nb_likes": extract_likes(block_text),
    }


# --------------------------------------------------------------------------
# 2. DETAIL (fiche complète)
# --------------------------------------------------------------------------

def scrape_detail(session, url: str) -> dict:
    resp = polite_get(session, url)
    if resp is None:
        return {"url": url, "erreur": "page inaccessible"}

    soup = BeautifulSoup(resp.text, "html.parser")
    full_text = soup.get_text("\n", strip=True)

    data = {"url": url}

    # Nom : premier h1/h4 significatif
    title_tag = soup.find(["h1", "h4"])
    data["nom"] = clean_text(title_tag.get_text(" ", strip=True)) if title_tag else None

    # Catégories (breadcrumb "Catégories: X, Y")
    cat_match = re.search(r"Catégories\s*:\s*(.+?)(?:\n|Localisation)", full_text)
    data["categories"] = clean_text(cat_match.group(1)).rstrip(",") if cat_match else None

    # Localisation / Adresse
    loc_match = re.search(r"Localisation\s*:\s*([^\n]+)", full_text)
    data["localisation"] = clean_text(loc_match.group(1)) if loc_match else None
    addr_match = re.search(r"Adresse\s*:\s*([^\n]+)", full_text)
    data["adresse"] = clean_text(addr_match.group(1)) if addr_match else None

    data["prix_a_partir_de_xaf"] = extract_price(full_text)
    data["note_etoiles"] = extract_rating_stars(full_text)
    data["nb_likes"] = extract_likes(full_text)

    # Téléphone (peut être partiel si non connecté)
    phone_match = re.search(r"\+?237\s?\d{9}", full_text)
    data["telephone"] = clean_text(phone_match.group(0)) if phone_match else None

    # Description : paragraphes après le titre "Aperçu" jusqu'à "Découvrez d'autres"
    desc_match = re.search(
        rf"{re.escape(data['nom'] or '')}\s*\n(.+?)(?:Découvrez d'autres|Horaires|Avis des clients)",
        full_text,
        re.DOTALL,
    )
    if desc_match:
        data["description"] = clean_text(desc_match.group(1))[:3000]
    else:
        data["description"] = None

    # Images (galerie hébergée sur le S3 du site)
    images = set()
    for img in soup.find_all("img", src=True):
        if "s3" in img["src"] and "amazonaws" in img["src"]:
            images.add(img["src"])
    for a in soup.find_all("a", href=True):
        if "s3" in a["href"] and "amazonaws" in a["href"]:
            images.add(a["href"])
    data["images"] = sorted(images)

    # Avis clients : bloc répétitif "Nom" / "Publié le DD/MM/AAAA" / "(N/5)" / commentaire
    reviews = []
    for m in re.finditer(
        r"([A-ZÀ-Ý][\wÀ-ÿ'’\.\-\s]{2,40})\nPubliée? le (\d{2}/\d{2}/\d{4})\n\*?\*?\((\d)/5\)\*?\*?\n?([^\n]*)",
        full_text,
    ):
        reviews.append(
            {
                "auteur": clean_text(m.group(1)),
                "date": m.group(2),
                "note": int(m.group(3)),
                "commentaire": clean_text(m.group(4)),
            }
        )
    data["avis"] = reviews
    data["nb_avis_affiches"] = len(reviews)

    return data


# --------------------------------------------------------------------------
# 3. ORCHESTRATION
# --------------------------------------------------------------------------

def load_seen_ids(jsonl_path: Path) -> set:
    seen = set()
    if jsonl_path.exists():
        with jsonl_path.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    if obj.get("id"):
                        seen.add(obj["id"])
                except json.JSONDecodeError:
                    continue
    return seen


def run(categories, max_pages, output_jsonl, delay_min, delay_max, skip_detail=False):
    session = get_session()
    out_path = Path(output_jsonl)
    seen_ids = load_seen_ids(out_path)
    print(f"[resume] {len(seen_ids)} fiches déjà enregistrées, elles seront ignorées.")

    with out_path.open("a", encoding="utf-8") as out_f:
        for cat_id, cat_slug in categories:
            print(f"\n=== Catégorie: {cat_slug} (id {cat_id}) ===")
            for listing_item in scrape_category_listing(session, cat_id, cat_slug, max_pages):
                if listing_item["id"] in seen_ids:
                    continue

                record = dict(listing_item)
                if not skip_detail:
                    print(f"  -> fiche détail: {listing_item['url']}")
                    detail = scrape_detail(session, listing_item["url"])
                    record.update({k: v for k, v in detail.items() if v is not None})

                out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                out_f.flush()
                seen_ids.add(listing_item["id"])

    print(f"\nTerminé. {len(seen_ids)} fiches au total dans {out_path}")


def jsonl_to_csv(jsonl_path: str, csv_path: str):
    rows = []
    all_keys = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            obj["images"] = "|".join(obj.get("images", [])) if isinstance(obj.get("images"), list) else obj.get("images")
            obj["avis"] = json.dumps(obj.get("avis", []), ensure_ascii=False)
            rows.append(obj)
            for k in obj:
                if k not in all_keys:
                    all_keys.append(k)

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_keys)
        writer.writeheader()
        writer.writerows(rows)
    print(f"CSV exporté : {csv_path} ({len(rows)} lignes)")


def main():
    parser = argparse.ArgumentParser(description="Scraper ayilaa.com")
    parser.add_argument(
        "--categories",
        nargs="*",
        default=None,
        help="Slugs de catégories à scraper (ex: restauration hotels-et-hebergements). "
        "Par défaut : toutes.",
    )
    parser.add_argument("--max-pages", type=int, default=500, help="Pages max par catégorie")
    parser.add_argument("--output", default="ayilaa_data.jsonl", help="Fichier JSONL de sortie")
    parser.add_argument("--csv", default="ayilaa_data.csv", help="Fichier CSV final")
    parser.add_argument("--delay-min", type=float, default=1.0)
    parser.add_argument("--delay-max", type=float, default=2.2)
    parser.add_argument(
        "--skip-detail",
        action="store_true",
        help="N'extraire que les infos de la page listing (plus rapide, moins complet)",
    )
    parser.add_argument(
        "--csv-only",
        action="store_true",
        help="Ne fait que convertir un JSONL déjà généré en CSV (pas de scraping)",
    )
    args = parser.parse_args()

    if args.csv_only:
        jsonl_to_csv(args.output, args.csv)
        return

    cats = MAIN_CATEGORIES
    if args.categories:
        cats = [c for c in MAIN_CATEGORIES if c[1] in args.categories]
        if not cats:
            print("Aucune catégorie valide trouvée. Slugs disponibles :")
            for _, slug in MAIN_CATEGORIES:
                print(f"  - {slug}")
            sys.exit(1)

    run(
        categories=cats,
        max_pages=args.max_pages,
        output_jsonl=args.output,
        delay_min=args.delay_min,
        delay_max=args.delay_max,
        skip_detail=args.skip_detail,
    )
    jsonl_to_csv(args.output, args.csv)


if __name__ == "__main__":
    main()
