"""
Builds the BOSSONE.LK catalogue from the client's stock report (docs/data/stock-report-by-brand.xlsx).

    python3 apps/api/prisma/tools/import_stock_report.py            # data + images
    python3 apps/api/prisma/tools/import_stock_report.py --no-images

Writes:
  apps/api/prisma/catalogue-data.ts           brands and products used by `pnpm db:seed`
  apps/api/prisma/seed-assets/products/*.webp  sample packshot pictures (one per product)
  docs/data/catalogue-import-report.md         what was loaded, renamed, skipped and needs checking

Stock quantities are real (the report's "Total Physical Quantity").
PRICES ARE DUMMY VALUES until the client sends the price list; the pictures are generated samples.
Needs: pip install openpyxl pillow
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / 'docs/data/stock-report-by-brand.xlsx'
OUT_TS = ROOT / 'apps/api/prisma/catalogue-data.ts'
OUT_IMG = ROOT / 'apps/api/prisma/seed-assets/products'
OUT_REPORT = ROOT / 'docs/data/catalogue-import-report.md'

UNBRANDED = 'Unbranded / Salon supplies'
UNVERIFIED = 'Unspecified / Verify brand'

# ---------------------------------------------------------------- brands
# Display names: only clear misspellings of well-known brands are corrected. Everything else is kept
# exactly as the report spells it and listed for the client to confirm.
BRAND_DISPLAY = {"L'Oreal": "L'Oréal", 'Ganier': 'Garnier', 'Treseme': 'TRESemmé', 'LOTUS': 'Lotus'}
BRANDS_TO_CONFIRM = {
    'Keun': 'Possibly a misspelling of Keune; kept separate as in the report.',
    'Gillert': 'Possibly Gillette; kept as in the report.',
    'Botani': 'Item names also say "Botoni"; shown as Botani.',
}

# ---------------------------------------------------------------- items left out
# Office stationery, drinks, cleaning supplies and furniture are not sold on BOSSONE.LK.
EXCLUDE_PATTERNS = [
    (r'\bwater bottle\b', 'drinking water'),
    (r'garbage bag', 'cleaning supplies'),
    (r'^tiisol|^leo ?matic', 'cleaning supplies'),
    (r'^trolly$', 'furniture'),
    (r'sheets?\b|shets\b|\breports?\b', 'office forms'),
    (r'brithday cup', 'staff item'),
    (r'empty bottle', 'empty container'),
    (r'^[a-z]$', 'no usable name'),
]

# ---------------------------------------------------------------- name clean-up
TYPOS = [
    (r'\bAifarprtb\b|\bAlfarparf\b', 'Alfaparf'), (r'\bLorea\b|\bLorial\b|\bLoreal\b', "L'Oréal"),
    (r'\bGanier\b', 'Garnier'), (r'\bTreseme\b', 'TRESemmé'), (r'\bJavees\b', 'Jovees'), (r'\bBotoni\b', 'Botani'),
    (r'\bLafresh\b|\bLeresh\b', 'La Fresh'), (r'\bLeo matic\b', 'Leomatic'),
    (r'\bDe(?:va|ver)lop(?:er)?\b|\bDevaloper\b|\bDeverloper\b|\bdevelper\b', 'Developer'),
    (r'\bStraigting\b', 'Straightening'), (r'\bStraigt\b', 'Straightening'), (r'\bstraightner\b', 'Straightener'),
    (r'\bNeutralizerlizing\b', 'Neutralizing'), (r'\bNutralizer\b|\bNutrlizer\b', 'Neutralizer'),
    (r'\bNeutralization\b', 'Neutralizer'),
    (r'\bConditoner\b|\bCondotioner\b|\bConditoner\b', 'Conditioner'), (r'\bLeavon\b', 'Leave-on'),
    (r'\bLeave on\b', 'Leave-on'), (r'\bSpary\b', 'Spray'), (r'\bClensing\b', 'Cleansing'), (r'\bClenser\b', 'Cleanser'),
    (r'\bCleaner\b', 'Cleanser'), (r'\bLiquvid\b', 'Liquid'), (r'\bSafron\b', 'Saffron'), (r'\bSherving\b', 'Shaving'),
    (r'\bShaving Form\b', 'Shaving Foam'), (r'\bScisser\b', 'Scissors'), (r'\bSponch\b|\bspounch\b', 'Sponge'),
    (r'\bTavel\b', 'Towel'), (r'\bDiffusor\b', 'Diffuser'), (r'\bgard\b', 'Guard'), (r'\bTreding Nul\b', 'Threading Thread'),
    (r'\bNeckrol\b', 'Neck Roll'), (r'\bbrash\b', 'Brush'), (r'\bHot Stemmer - Hot\b', 'Hot Steamer'), (r'\bStemmer\b', 'Steamer'), (r'\bkeratun\b', 'Keratin'),
    (r'\bKeratine\b', 'Keratin'), (r'\bBloned\b', 'Blonde'), (r'\bneutrition\b', 'Nutrition'), (r'\bPsc\b', 'Pcs'), (r'Pack\(60 items\)', 'Pack (60 pcs)'), (r'Wool\( ?500g\)', 'Wool (500g)'),
    (r'\b5Minit\b', '5 Minute'), (r'\bColonge\b', 'Cologne'), (r'\bE Vitamine\b', 'Vitamin E'), (r'\bHairMask\b', 'Hair Mask'),
    (r'\bcollagin\b', 'Collagen'), (r'\bWrite\b', 'White'), (r'\bSoftmatie\b', 'Softmatic'), (r'\bLiqued\b', 'Liquid'),
    (r'\bligh?tener\b', 'Lightener'), (r'\bdetergent\b', 'Detergent'), (r'\bH/C\b', 'Hair Cutting'),
    (r'\bSOFTEN ESSENCE\b', 'Soften Essence'), (r'\bCITRUS\b', 'Citrus'), (r'\bGERM\b', 'Germ'), (r'\bLOTION\b', 'Lotion'),
    (r'\bScale\b', 'Weighing Scale'), (r'\bDust- Fiber\b', 'Dust Fiber'), (r'\bpro -tech\b', 'Pro-Tech'),
    (r'\bAnti- ', 'Anti-'), (r'\b20- Vol\b', '20 Vol'), (r'\b1- Neutralizer- ', 'Neutralizer '), (r'\bColorfull\b', 'Colourful'),
    (r'\s+-\s*|\s*-\s+', ' – '),
]
LOWER_KEEP = {'ml', 'g', 'kg', 'l', 'm', 'x', 'per', 'and', 'of', 'for', 'with', 'pcs', 'pc'}


def clean_name(raw: str) -> str:
    s = re.sub(r'\s+', ' ', raw.replace('–', '-')).strip()
    s = re.sub(r'\s*-\s*$', '', s)                    # trailing " -"
    s = re.sub(r'\s*\[one inch\]', ' 1 inch', s)
    s = re.sub(r'\(\s+', '(', s)
    for pat, rep in TYPOS:
        s = re.sub(pat, rep, s, flags=re.I)
    s = re.sub(r'(\d)\s*Ml\b', r'\1ml', s)
    s = re.sub(r'(\d+)\*(\d+)', r'\1 x \2', s)
    words = []
    for w in s.split(' '):
        if w.islower() and w.isalpha() and w not in LOWER_KEEP:
            w = w[0].upper() + w[1:]
        words.append(w)
    s = ' '.join(words)
    s = re.sub(r'\bml\b', 'ml', s, flags=re.I)
    return s.strip(' -')


# ---------------------------------------------------------------- categories
# (pattern, category slug) – first match wins. Patterns run on the cleaned, lower-cased name.
RULES = [
    (r'dryer|iron machine|steamer|trimmer|curler|weighing scale', 'electrical-tools'),
    (r'developer|oxido|peroxide', 'developers'),
    (r'bleach|blondera|lightener', 'bleach-lighteners'),
    (r'colou?r chart', 'accessories'),
    (r'colou?r mix|mix cup|colou?r bowls?|colou?r brush|colou?r mixer', 'accessories'),
    (r'setting spray', 'skin-care'),
    (r'^dreamron lotion', 'perm-straightening'),
    (r'colou?r|colorante|tint|streax|booster|5 minute', 'hair-colour'),
    (r'shav|after ?shave|razor|blade|gillert|machine oil|\bhopes jasmine powder|best powder', 'barber-shaving'),
    (r'straighten|neutrali[sz]|\bperm|keratin care|smoothing|nanoplasty|botox|rebond|relax', 'perm-straightening'),
    (r'shampoo', 'shampoos'),
    (r'conditioner|detangl', 'conditioners'),
    (r'hair mask|mask - 1l|mask 1l|spa cream|keratin|bond|silicon|soften essence|vital nutrition|restoring cream|protein|treatment', 'treatments-masks'),
    (r'cologne|tonic|hair oil|\boil\b', 'oils-tonics'),
    (r'hair spray|setting spray|styling|mousse|hair gel|hair wax|\bwax$|toppik|fiber powder|prime pro', 'styling-products'),
    (r'hot wax|hard wax|wax beans|cleanser|cleansing|scrub|toner|facial|face mask gold|massage cream|vitamin|aloe|rose water|sun ?screen|compact powder|hydra|ecg gel|derma|herbal|wheat germ|(fruit|glow|saffron) pack|^jovees pack', 'skin-care'),
]
BRAND_DEFAULT_CATEGORY = {  # for rows that only carry the brand name
    'Keune': 'hair-colour', 'Bellose': 'hair-colour', 'ECO': 'hair-colour', 'Botani': 'hair-colour',
    'Dreamron': 'hair-colour', 'Evon': 'skin-care', "L'Oreal": 'hair-colour', 'Ganier': 'hair-colour',
    'Little Bud': 'accessories', 'Prime Pro': 'styling-products', 'Axe': 'oils-tonics', 'Jovees': 'skin-care',
    'Protech': 'treatments-masks', 'Keun': 'perm-straightening',
}


def categorise(name: str, brand: str, brand_only: bool) -> tuple[str, bool]:
    """Returns (category, guessed). guessed=True when the category could not be read from the name."""
    if brand_only:
        return BRAND_DEFAULT_CATEGORY.get(brand, 'accessories'), True
    low = name.lower()
    for pat, cat in RULES:
        if re.search(pat, low):
            return cat, False
    if brand in BRAND_DEFAULT_CATEGORY:
        return BRAND_DEFAULT_CATEGORY[brand], True
    return 'accessories', brand not in (UNBRANDED,)


TYPE_LABEL = {
    'shampoos': 'Shampoo', 'conditioners': 'Conditioner', 'treatments-masks': 'Treatment', 'oils-tonics': 'Oil & Tonic',
    'perm-straightening': 'Straightening', 'styling-products': 'Styling', 'hair-colour': 'Hair Colour',
    'developers': 'Developer', 'bleach-lighteners': 'Bleach', 'skin-care': 'Skin Care', 'barber-shaving': 'Barber',
    'accessories': 'Salon Supply', 'electrical-tools': 'Electrical',
}
SUMMARY = {
    'shampoos': 'Salon shampoo', 'conditioners': 'Salon conditioner', 'treatments-masks': 'Hair treatment',
    'oils-tonics': 'Hair oil, tonic or cologne', 'perm-straightening': 'Straightening and perming product',
    'styling-products': 'Hair styling product', 'hair-colour': 'Professional hair colour',
    'developers': 'Colour developer (oxidant)', 'bleach-lighteners': 'Bleach and lightener',
    'skin-care': 'Facial and skin care product', 'barber-shaving': 'Barber and shaving product',
    'accessories': 'Salon supply', 'electrical-tools': 'Salon electrical tool',
}

# ---------------------------------------------------------------- sizes
SIZE_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(ml|l|g|kg|m)\b', re.I)


def size_of(name: str) -> tuple[str | None, float | None]:
    """('400ml', 400.0) – volume in ml (or grams), metres kept as label only."""
    m = SIZE_RE.search(name)
    if not m:
        return None, None
    n, unit = float(m.group(1)), m.group(2).lower()
    label = f"{m.group(1)}{'L' if unit == 'l' else unit}"
    if unit == 'm':
        return label, None
    return label, n * (1000 if unit in ('l', 'kg') else 1)


def pack_of(name: str) -> str | None:
    m = re.search(r'\((\d+)\s*(pc|pcs|items)\)', name, re.I) or re.search(r'(\d+) x (\d+)', name)
    if m:
        return f'{m.group(1)} x {m.group(2)}' if 'x' in m.group(0) else f'{m.group(1)} pcs'
    if re.search(r'\bpack\b|\bbox\b|\bkit\b', name, re.I):
        return 'Pack'
    return None


# ---------------------------------------------------------------- dummy prices
BASE = {  # (LKR for the reference size, reference ml/g)
    'shampoos': (1800, 1000), 'conditioners': (1650, 1000), 'treatments-masks': (2300, 1000), 'oils-tonics': (650, 100),
    'perm-straightening': (2400, 400), 'styling-products': (1150, 250), 'hair-colour': (1150, 60),
    'developers': (1350, 1000), 'bleach-lighteners': (1900, 500), 'skin-care': (1450, 200),
    'barber-shaving': (950, 250), 'accessories': (480, None), 'electrical-tools': (9500, None),
}
BRAND_TIER = {
    'Keune': 1.55, 'Alfaparf': 1.6, 'Farmavita': 1.5, 'Wella': 1.5, "L'Oreal": 1.6, 'Toni & Guy': 1.4,
    'Beauty Garage': 1.4, 'Keratin Protech': 1.3, 'Amazonic': 1.3, 'Keratin Queen': 1.2, 'Divine': 1.2,
    'Botani': 1.1, 'ECO': 1.0, 'Bellose': 1.0, 'Dreamron': 0.9, 'Kejo': 0.95, 'Protech': 1.1,
    'Streax': 0.6, 'Ganier': 0.7, 'Jovees': 0.75, 'Evon': 0.7, 'Nanny': 0.5, 'Hopes': 0.55, 'Fathima': 0.6,
    'Navarathna': 0.6, 'Emami': 0.6, 'La Fresh': 0.8, 'Derma': 0.9,
}
FIXED = [  # exact-ish prices for supplies and tools (name pattern, LKR)
    (r'2000w', 9800), (r'2200w', 10900), (r'2500w', 12500), (r'3000w', 15800), (r'5000w', 24500),
    (r'iron machine', 7500), (r'steamer', 28500), (r'trimmer', 5600), (r'curler', 6800), (r'weighing scale', 3400),
    (r'foil', 1450), (r'gloves box', 1650), (r'neck roll', 950), (r'towel pack', 12500), (r'towel \(6', 3200),
    (r'cutting towel|face towel', 650), (r'\bcape\b', 1650), (r'apron', 1450), (r'scissors', 2800),
    (r'shower cap', 450), (r'tissue', 380), (r'magic sponge', 650), (r'sponge', 250), (r'cotton wool', 980),
    (r'spray bottle', 480), (r'colou?r chart', 3500), (r'hair dummy', 6500), (r'diffuser', 2400), (r'ear guard', 250),
    (r'machine oil', 650), (r'threading', 350), (r"hairdresser's pouch", 2200), (r'face mask$', 650),
    (r'hair band', 250), (r'gel brush', 280), (r'colou?r brush', 280), (r'mix(er)? cup|colou?r mixer|colou?r bowls?', 350),
    (r'roller brush', 850), (r'comb set', 1250), (r'comb', 350), (r'clip', 450), (r'blade pack', 1250), (r'blade rk box', 2400),
    (r'razor', 450), (r'hot wax', 1850), (r'wax beans', 1650),
]


def jitter(key: str, spread: float = 0.12) -> float:
    h = int(hashlib.sha1(key.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    return 1 + (h * 2 - 1) * spread


def round_price(p: float) -> int:
    step = 50 if p >= 1000 else 10
    return int(round(p / step) * step)


def dummy_price(name: str, brand: str, category: str, volume: float | None, sku: str) -> int:
    low = name.lower()
    for pat, price in FIXED:
        if re.search(pat, low):
            return round_price(price * jitter(sku, 0.06))
    base, ref = BASE[category]
    price = base * BRAND_TIER.get(brand, 1.0)
    if ref and volume:
        price *= (volume / ref) ** 0.75
    return max(150, round_price(price * jitter(sku)))


def moq_for(price: int, category: str) -> int:
    if category == 'hair-colour':
        return 3
    if price < 500:
        return 6
    if price < 1500:
        return 3
    if price < 5000:
        return 2
    return 1


# ---------------------------------------------------------------- build
def brand_code(brand: str) -> str:
    if brand == UNBRANDED:
        return 'GEN'
    if brand == UNVERIFIED:
        return 'UNV'
    letters = re.sub(r'[^A-Za-z]', '', brand).upper()
    return (letters + 'XXX')[:3]


def slugify(s: str) -> str:
    s = s.lower().replace("'", '').replace('é', 'e').replace('&', 'and')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def build():
    wb = openpyxl.load_workbook(SOURCE, data_only=True)
    rows = [r for r in wb['Products by Brand'].iter_rows(min_row=2, values_only=True) if r[0] and r[1]]

    excluded, renamed, guessed = [], [], []
    by_brand: dict[str, list] = defaultdict(list)
    for brand, raw, qty, page in rows:
        raw = str(raw).strip()
        reason = next((why for pat, why in EXCLUDE_PATTERNS if re.search(pat, raw.lower())), None)
        if reason:
            excluded.append((brand, raw, qty, reason))
            continue
        by_brand[brand].append((raw, int(qty or 0), page))

    codes_used: dict[str, str] = {}
    products, brands = [], []
    for brand, items in sorted(by_brand.items(), key=lambda kv: -sum(q for _, q, _ in kv[1])):
        display = BRAND_DISPLAY.get(brand, brand)
        code = brand_code(brand)
        while code in codes_used.values() and codes_used.get(brand) != code:
            code = code[:2] + chr(ord(code[2]) + 1 if code[2] < 'Z' else 65)
        codes_used[brand] = code

        cleaned = []
        for raw, qty, page in items:
            name = clean_name(raw)
            brand_only = name.lower().rstrip('s') in (brand.lower().rstrip('s'), display.lower(), 'dreamroon') or (
                brand == "L'Oreal" and name == "L'Oréal")
            cleaned.append([raw, name, qty, page, brand_only])

        # Number rows that only carry the brand name, and repeated generic names, so every product is unique.
        counts = Counter(c[1] for c in cleaned if not c[4])
        seen: Counter = Counter()
        only_n = 0
        for c in cleaned:
            raw, name = c[0], c[1]
            if c[4]:
                only_n += 1
                c[1] = f'{display} item {only_n}'
            elif counts[name] > 1:
                seen[name] += 1
                c[1] = f'{name} item {seen[name]}'
            if brand not in (UNBRANDED, UNVERIFIED) and not re.match(re.escape(display), c[1], re.I):
                # Brand first, once: "Shaving Foam Black Knight" -> "Black Knight Shaving Foam"
                rest = re.sub(re.escape(display), '', c[1], flags=re.I)
                rest = re.sub(r'\s{2,}', ' ', re.sub(r'^[\s–-]+|[\s–-]+$', '', rest.replace('– –', '–')))
                c[1] = f'{display} {rest}'.strip()
            if c[1] != raw:
                renamed.append((brand, raw, c[1]))

        for n, (raw, name, qty, page, brand_only) in enumerate(cleaned, start=1):
            category, was_guessed = categorise(name, brand, brand_only)
            if brand == UNVERIFIED:
                was_guessed = True
            if was_guessed:
                guessed.append((brand, name, category))
            sku = f'{code}-{n:03d}'
            size_label, volume = size_of(name)
            price = dummy_price(name, brand, category, volume, sku)
            moq = moq_for(price, category)
            products.append({
                'sku': sku, 'name': name, 'sourceName': raw, 'sourcePage': page,
                'brand': None if brand in (UNBRANDED, UNVERIFIED) else slugify(display),
                'brandCheck': brand == UNVERIFIED, 'category': category,
                'summary': f"{SUMMARY[category]}{f' – {size_label}' if size_label else ''}.",
                'typeLabel': TYPE_LABEL[category], 'image': f'products/{sku.lower()}.webp',
                'price': price, 'moq': moq, 'available': qty, 'pack': size_label or pack_of(name),
                'tiers': [{'minQty': max(moq * 3, 6), 'unitPrice': round_price(price * 0.95), 'label': 'Volume price'}],
                'needsName': brand_only, 'categoryGuessed': was_guessed,
            })
        if brand not in (UNBRANDED, UNVERIFIED):
            brands.append({'brand': brand, 'display': display, 'items': items})

    # Featured: the best-stocked named products, one per brand.
    featured_brands = set()
    for p in sorted(products, key=lambda p: -p['available']):
        if p['brand'] and not p['needsName'] and p['brand'] not in featured_brands and len(featured_brands) < 8:
            p['featured'] = True
            featured_brands.add(p['brand'])

    stock = Counter()
    cats = defaultdict(Counter)
    for p in products:
        if p['brand']:
            stock[p['brand']] += p['available']
            cats[p['brand']][p['category']] += 1
    styles = ['DARK', 'NAVY', 'LIGHT']
    brand_rows = []
    top = [b for b, _ in stock.most_common(8)]
    for i, b in enumerate(sorted(brands, key=lambda b: -stock[slugify(b['display'])])):
        slug = slugify(b['display'])
        main = [TYPE_LABEL[c] for c, _ in cats[slug].most_common(2)]
        wordmark = b['display'].upper() if len(b['display']) <= 12 else b['display'].split()[0].upper()
        brand_rows.append({
            'name': b['display'], 'slug': slug, 'wordmark': wordmark, 'cardTag': main[0] if main else None,
            'specialty': ' & '.join(main), 'tagline': ' · '.join(main),
            'description': f"{b['display']} products stocked by BOSSONE.LK: {', '.join(m.lower() for m in main)}.",
            'featureTags': main, 'tileStyle': styles[i % 3], 'featured': slug in top, 'partnerBadges': [],
            'check': BRANDS_TO_CONFIRM.get(b['brand']),
        })
    return brand_rows, products, excluded, renamed, guessed


def write_ts(brands, products):
    head = (
        '/**\n * GENERATED by prisma/tools/import_stock_report.py from docs/data/stock-report-by-brand.xlsx.\n'
        ' * Do not edit by hand: change the script or the spreadsheet and run it again.\n *\n'
        ' * Stock quantities are the real closing stock. PRICES ARE DUMMY VALUES and the pictures are generated\n'
        ' * samples until the client sends the price list and product photos.\n */\n'
        "import type { SeedBrand, SeedProduct } from './seed-catalogue';\n\n"
    )
    b = [{k: v for k, v in x.items() if k != 'check' and v is not None} for x in brands]
    keep = ['sku', 'name', 'sourceName', 'brand', 'category', 'summary', 'typeLabel', 'image', 'price', 'moq',
            'available', 'pack', 'tiers', 'featured']
    p = [{k: x[k] for k in keep if x.get(k) is not None} for x in products]
    body = (
        f'export const BRANDS: SeedBrand[] = {json.dumps(b, ensure_ascii=False, indent=2)};\n\n'
        f'export const PRODUCTS: SeedProduct[] = {json.dumps(p, ensure_ascii=False, indent=2)};\n'
    )
    OUT_TS.write_text(head + body)


def write_report(brands, products, excluded, renamed, guessed):
    L = ['# Catalogue import report', '',
         'Source: `docs/data/stock-report-by-brand.xlsx` (client stock report). '
         'Generated by `apps/api/prisma/tools/import_stock_report.py`.', '',
         f'- **Loaded:** {len(products)} products, {len(brands)} brands '
         f'({sum(1 for p in products if not p["brand"])} products have no brand: salon supplies or brand to confirm).',
         f'- **Left out:** {len(excluded)} rows (not products sold to salons).',
         f'- **Stock:** real quantities from the report. **Prices: dummy values. Pictures: generated samples.**', '',
         '## Needs a real product name', '',
         'These rows only carried the brand name in the report (probably colour shades). They are loaded as numbered items.', '',
         '| SKU | Loaded as | Stock |', '| --- | --- | --- |']
    L += [f"| {p['sku']} | {p['name']} | {p['available']} |" for p in products if p['needsName']]
    L += ['', '## Category guessed (please confirm)', '', '| Brand | Product | Category |', '| --- | --- | --- |']
    L += [f'| {b} | {n} | {c} |' for b, n, c in guessed if not n.endswith(tuple(f' item {i}' for i in range(1, 99)))]
    L += ['', '## Brands to confirm', '']
    L += [f"- **{b['name']}:** {b['check']}" for b in brands if b['check']]
    L += ['', '## Left out', '', '| Report brand | Item | Stock | Why |', '| --- | --- | --- | --- |']
    L += [f'| {b} | {n} | {q} | {why} |' for b, n, q, why in excluded]
    L += ['', '## Renamed (spelling and clean-up)', '', '| Report name | Loaded as |', '| --- | --- |']
    L += [f'| {r} | {n} |' for _, r, n in renamed if not n.endswith(tuple(f' item {i}' for i in range(1, 99)))]
    OUT_REPORT.write_text('\n'.join(L) + '\n')


if __name__ == '__main__':
    brands, products, excluded, renamed, guessed = build()
    write_ts(brands, products)
    write_report(brands, products, excluded, renamed, guessed)
    if '--no-images' not in sys.argv:
        from packshots import render_all  # noqa: E402  (same folder)
        render_all(products, {b['slug']: b for b in brands}, OUT_IMG)
    print(f'{len(brands)} brands, {len(products)} products, {len(excluded)} left out')
