"""
Sample product pictures for the catalogue, used until the client supplies real product photos.

Each picture is a simple studio-style packshot drawn from the product type (tube, bottle, tub, pouch,
spray, box, tool or electrical) in the brand colour, with the brand, product and size on the label and a
small "Sample image" mark. Called by import_stock_report.py.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 1400          # drawing size (downscaled to OUT for smooth edges)
OUT = 700
FONT_DIR = Path('/usr/share/fonts/opentype/inter')
FONTS = {
    'black': FONT_DIR / 'Inter-Black.otf', 'bold': FONT_DIR / 'Inter-Bold.otf',
    'semi': FONT_DIR / 'Inter-SemiBold.otf', 'medium': FONT_DIR / 'Inter-Medium.otf',
}

BRAND_COLOURS = [
    '#16325C', '#7A1E3A', '#0F5E5A', '#4B2C6F', '#1F4D2B', '#2B2B30', '#8A5A12', '#A23E2A', '#1756A9',
    '#5C2346', '#264653', '#6B3E26', '#0B3954', '#3D405B', '#8C2F39', '#2F5D50',
]
NEUTRAL = '#4A5568'
BACKGROUND = {  # soft studio backdrop per category (top, bottom)
    'hair-colour': ('#FBF1F5', '#F3DDE7'), 'developers': ('#F2F4FB', '#DFE5F4'),
    'bleach-lighteners': ('#F7F5FC', '#E6E0F5'), 'shampoos': ('#EEF5FC', '#D9E8F7'),
    'conditioners': ('#EEF8F6', '#D6EEE8'), 'treatments-masks': ('#FBF6EE', '#F1E5CF'),
    'oils-tonics': ('#FCF7EA', '#F4E7C2'), 'perm-straightening': ('#F3F1FA', '#E2DDF2'),
    'styling-products': ('#F1F3F6', '#DFE3EA'), 'skin-care': ('#F0F8F2', '#D9EEDF'),
    'barber-shaving': ('#EEF1F4', '#D8DEE5'), 'accessories': ('#FFF7E6', '#F7E7C1'),
    'electrical-tools': ('#EEF0F5', '#D7DCE6'),
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS[kind]), size)


def colour_for(key: str | None) -> str:
    if not key:
        return NEUTRAL
    return BRAND_COLOURS[int(hashlib.md5(key.encode()).hexdigest(), 16) % len(BRAND_COLOURS)]


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def mix(c: str, other: str, t: float) -> tuple[int, int, int]:
    a, b = hex_rgb(c), hex_rgb(other)
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


# ---------------------------------------------------------------- shape choice
def shape_for(p: dict) -> str:
    n = p['name'].lower()
    cat = p['category']
    if cat == 'electrical-tools':
        for k in ('dryer', 'iron', 'trimmer', 'steamer', 'scale', 'curler'):
            if k in n:
                return k
        return 'dryer'
    tools = [('scissor', 'scissors'), ('comb', 'comb'), ('brush', 'brush'), ('clip', 'clip'), (r'cap\b', 'cap'),
             ('towel', 'cloth'), ('cape', 'cloth'), ('apron', 'cloth'), ('sponge', 'sponge'), ('cup', 'bowl'),
             ('bowl', 'bowl'), ('mixer', 'bowl'), ('foil', 'box'), ('gloves', 'box'), ('tissue', 'box'),
             ('chart', 'box'), ('blade', 'box'), ('razor', 'razor'), ('band', 'clip'), ('neck roll', 'box'),
             ('thread', 'box'), ('pouch', 'pouch'), ('dummy', 'box'), ('diffuser', 'bowl'), ('ear guard', 'clip'),
             ('cotton', 'box'), ('spray bottle', 'spray'), ('face mask', 'box')]
    for k, s in tools:
        if re.search(rf'\b{k.removesuffix(chr(92) + "b")}s?\b', n):
            return s
    if re.search(r'spray|mousse|foam', n):
        return 'spray'
    if 'pouch' in n:
        return 'pouch'
    if re.search(r'tub|mask|cream|wax|powder|scrub|bleach|gel tub|pack\b|kit', n) and cat != 'hair-colour':
        return 'tub'
    if cat == 'hair-colour':
        return 'box' if 'booster' in n or 'chart' in n else 'tube'
    if re.search(r'\b4l\b', n):
        return 'jug'
    if cat in ('accessories',):
        return 'box'
    return 'bottle'


# ---------------------------------------------------------------- label text
def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int, max_lines: int) -> list[str]:
    words, lines, cur = text.split(), [], ''
    for w in words:
        trial = f'{cur} {w}'.strip()
        if draw.textlength(trial, font=f) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
        if len(lines) == max_lines:
            break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if len(lines) == max_lines and ' '.join(lines) != ' '.join(words):
        while draw.textlength(lines[-1] + '…', font=f) > width and len(lines[-1]) > 1:
            lines[-1] = lines[-1][:-1]
        lines[-1] = lines[-1].rstrip() + '…'
    return lines


def fit(draw: ImageDraw.ImageDraw, text: str, kind: str, size: int, width: int) -> ImageFont.FreeTypeFont:
    f = font(kind, size)
    while draw.textlength(text, font=f) > width and size > 18:
        size -= 2
        f = font(kind, size)
    return f


def label(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], p: dict, brand: str, colour: str,
          dark: bool = False, compact: bool = False) -> None:
    """Brand, product line and size, centred in box."""
    x0, y0, x1, y1 = box
    w = x1 - x0
    ink = (255, 255, 255) if dark else hex_rgb(colour)
    sub = (230, 233, 240) if dark else (70, 78, 92)
    mark = brand.upper()
    fb = fit(draw, mark, 'black', 86 if not compact else 64, int(w * 0.86))
    product = p['name']
    if brand and product.lower().startswith(brand.lower()):
        product = product[len(brand):].strip(' –-')
    size = p.get('pack') or ''
    if size:
        product = re.sub(r'\s*[(–-]*\s*' + re.escape(size) + r'\)?', '', product, flags=re.I).strip(' –-')
    product = product or p['typeLabel']
    fp = font('semi', 44 if not compact else 38)
    lines = wrap(draw, product, fp, int(w * 0.86), 3 if not compact else 2)
    fs = font('bold', 40 if not compact else 34)
    total = fb.size + 18 + len(lines) * (fp.size + 8) + (fs.size + 26 if size else 0)
    y = y0 + (y1 - y0 - total) // 2
    draw.text(((x0 + x1) // 2, y), mark, font=fb, fill=ink, anchor='mt')
    y += fb.size + 10
    draw.line([((x0 + x1) // 2 - 40, y), ((x0 + x1) // 2 + 40, y)], fill=ink, width=4)
    y += 16
    for ln in lines:
        draw.text(((x0 + x1) // 2, y), ln, font=fp, fill=sub, anchor='mt')
        y += fp.size + 8
    if size:
        y += 14
        draw.text(((x0 + x1) // 2, y), size, font=fs, fill=ink, anchor='mt')


# ---------------------------------------------------------------- shapes
def shadow(img: Image.Image, cx: int, y: int, w: int) -> None:
    layer = Image.new('L', img.size, 0)
    ImageDraw.Draw(layer).ellipse([cx - w // 2, y - 28, cx + w // 2, y + 28], fill=120)
    layer = layer.filter(ImageFilter.GaussianBlur(26))
    img.paste((40, 46, 60), mask=layer)


def gloss(img: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    """Soft vertical highlight on the left of a package."""
    x0, y0, x1, y1 = box
    layer = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x0 + (x1 - x0) * 0.1, y0 + 30, x0 + (x1 - x0) * 0.2, y1 - 30], radius=radius, fill=70)
    layer = layer.filter(ImageFilter.GaussianBlur(14))
    img.paste((255, 255, 255), mask=layer)


def draw_bottle(img, d, p, brand, c, tall=1.0):
    cx, base = S // 2, 1150
    w, h = 400, int(640 * tall)
    body = (cx - w // 2, base - h, cx + w // 2, base)
    shadow(img, cx, base, w + 120)
    d.rounded_rectangle(body, radius=90, fill=hex_rgb(c))
    d.rounded_rectangle((cx - 70, base - h - 120, cx + 70, base - h + 20), radius=26, fill=mix(c, '#000000', 0.35))
    d.rounded_rectangle((cx - 110, base - h - 30, cx + 110, base - h + 30), radius=20, fill=mix(c, '#000000', 0.2))
    gloss(img, body, 40)
    lab = (body[0] + 34, base - h + 140, body[2] - 34, base - 90)
    d.rounded_rectangle(lab, radius=28, fill=(255, 255, 255))
    label(d, lab, p, brand, c)


def draw_jug(img, d, p, brand, c):
    cx, base = S // 2 - 30, 1150
    w, h = 560, 640
    body = (cx - w // 2, base - h, cx + w // 2, base)
    shadow(img, cx, base, w + 140)
    d.rounded_rectangle((body[2] - 40, base - h + 40, body[2] + 110, base - h + 330), radius=60, outline=hex_rgb(c), width=46)
    d.rounded_rectangle(body, radius=70, fill=hex_rgb(c))
    d.rounded_rectangle((cx - 90, base - h - 90, cx + 90, base - h + 20), radius=24, fill=mix(c, '#000000', 0.35))
    gloss(img, body, 40)
    lab = (body[0] + 40, base - h + 110, body[2] - 40, base - 80)
    d.rounded_rectangle(lab, radius=26, fill=(255, 255, 255))
    label(d, lab, p, brand, c)


def draw_tube(img, d, p, brand, c):
    cx, base = S // 2, 1170
    w, h = 380, 760
    shadow(img, cx, base, w + 120)
    silver = (232, 235, 240)
    # crimped top, body tapering to the cap at the bottom
    d.polygon([(cx - w // 2, base - h), (cx + w // 2, base - h), (cx + w // 2 - 50, base - 120), (cx - w // 2 + 50, base - 120)], fill=silver)
    d.rectangle((cx - w // 2, base - h - 30, cx + w // 2, base - h + 10), fill=(205, 210, 218))
    for i in range(9):
        x = cx - w // 2 + 20 + i * (w - 40) // 8
        d.line([(x, base - h - 26), (x, base - h + 6)], fill=(185, 190, 200), width=4)
    d.rounded_rectangle((cx - 110, base - 130, cx + 110, base), radius=22, fill=hex_rgb(c))
    band = (cx - w // 2 + 14, base - h + 40, cx + w // 2 - 14, base - h + 150)
    d.rectangle(band, fill=hex_rgb(c))
    gloss(img, (cx - w // 2, base - h, cx + w // 2, base - 120), 30)
    d.text((cx, (band[1] + band[3]) // 2), brand.upper() or 'COLOUR', font=fit(d, brand.upper() or 'COLOUR', 'black', 54, w - 70),
           fill=(255, 255, 255), anchor='mm')
    lab = (cx - w // 2 + 40, band[3] + 30, cx + w // 2 - 40, base - 170)
    product = p['name'][len(brand):].strip(' –-') if brand and p['name'].lower().startswith(brand.lower()) else p['name']
    fp = font('bold', 46)
    lines = wrap(d, product or 'Hair Colour', fp, lab[2] - lab[0], 3)
    y = lab[1] + 30
    for ln in lines:
        d.text((cx, y), ln, font=fp, fill=hex_rgb(c), anchor='mt')
        y += 58
    d.text((cx, lab[3] - 40), (p.get('pack') or 'Colour cream'), font=font('semi', 32), fill=(90, 98, 112), anchor='mb')


def draw_tub(img, d, p, brand, c):
    cx, base = S // 2, 1130
    w, h = 640, 400
    shadow(img, cx, base, w + 140)
    d.rounded_rectangle((cx - w // 2 + 20, base - h, cx + w // 2 - 20, base), radius=50, fill=(250, 250, 252))
    d.rounded_rectangle((cx - w // 2, base - h - 120, cx + w // 2, base - h + 20), radius=36, fill=hex_rgb(c))
    d.line([(cx - w // 2 + 30, base - h - 50), (cx + w // 2 - 30, base - h - 50)], fill=mix(c, '#ffffff', 0.25), width=6)
    lab = (cx - w // 2 + 60, base - h + 50, cx + w // 2 - 60, base - 30)
    label(d, lab, p, brand, c, compact=True)


def draw_pouch(img, d, p, brand, c):
    cx, base = S // 2, 1150
    w, h = 520, 720
    shadow(img, cx, base, w + 100)
    d.polygon([(cx - w // 2, base - h), (cx + w // 2, base - h), (cx + w // 2 + 20, base), (cx - w // 2 - 20, base)], fill=hex_rgb(c))
    d.rectangle((cx - w // 2, base - h, cx + w // 2, base - h + 40), fill=mix(c, '#000000', 0.25))
    d.rounded_rectangle((cx + w // 2 - 120, base - h - 70, cx + w // 2 - 40, base - h + 10), radius=14, fill=mix(c, '#000000', 0.4))
    lab = (cx - w // 2 + 50, base - h + 110, cx + w // 2 - 50, base - 80)
    d.rounded_rectangle(lab, radius=24, fill=(255, 255, 255))
    label(d, lab, p, brand, c)


def draw_spray(img, d, p, brand, c):
    cx, base = S // 2, 1160
    w, h = 330, 700
    body = (cx - w // 2, base - h, cx + w // 2, base)
    shadow(img, cx, base, w + 120)
    d.rounded_rectangle(body, radius=40, fill=hex_rgb(c))
    d.ellipse((cx - w // 2, base - h - 60, cx + w // 2, base - h + 60), fill=hex_rgb(c))
    d.rounded_rectangle((cx - 90, base - h - 190, cx + 90, base - h - 30), radius=40, fill=(225, 228, 235))
    d.rounded_rectangle((cx - 40, base - h - 230, cx + 60, base - h - 170), radius=14, fill=(60, 66, 80))
    gloss(img, body, 30)
    lab = (body[0] + 26, base - h + 110, body[2] - 26, base - 80)
    d.rounded_rectangle(lab, radius=22, fill=(255, 255, 255))
    label(d, lab, p, brand, c, compact=True)


def draw_box(img, d, p, brand, c):
    cx, base = S // 2, 1140
    w, h, depth = 640, 560, 90
    shadow(img, cx + 30, base, w + 160)
    front = (cx - w // 2, base - h, cx + w // 2, base)
    d.polygon([(front[2], front[1]), (front[2] + depth, front[1] - depth // 2), (front[2] + depth, base - depth // 2), (front[2], base)], fill=mix(c, '#000000', 0.35))
    d.polygon([(front[0], front[1]), (front[0] + depth, front[1] - depth // 2), (front[2] + depth, front[1] - depth // 2), (front[2], front[1])], fill=mix(c, '#ffffff', 0.25))
    d.rectangle(front, fill=hex_rgb(c))
    lab = (front[0] + 50, front[1] + 60, front[2] - 50, base - 60)
    d.rounded_rectangle(lab, radius=24, fill=(255, 255, 255))
    label(d, lab, p, brand, c)


def tool_card(img, d, p, brand, c, draw_icon):
    """Tools: a drawn icon above a name card."""
    cx = S // 2
    shadow(img, cx, 1170, 760)
    draw_icon(d, cx, 520, hex_rgb(c))
    lab = (cx - 380, 860, cx + 380, 1150)
    d.rounded_rectangle(lab, radius=32, fill=(255, 255, 255))
    label(d, lab, p, brand, c, compact=True)


def icon_comb(d, cx, cy, col):
    d.rounded_rectangle((cx - 380, cy - 120, cx + 380, cy - 20), radius=30, fill=col)
    for i in range(32):
        x = cx - 360 + i * 23
        d.rectangle((x, cy - 30, x + 12, cy + (150 if i < 18 else 110)), fill=col)


def icon_brush(d, cx, cy, col):
    d.rounded_rectangle((cx - 420, cy - 40, cx - 60, cy + 40), radius=40, fill=col)
    d.rounded_rectangle((cx - 80, cy - 150, cx + 380, cy + 150), radius=150, fill=tuple(min(255, v + 40) for v in col))
    for i in range(10):
        for j in range(5):
            d.ellipse((cx - 30 + i * 40, cy - 110 + j * 52, cx - 14 + i * 40, cy - 94 + j * 52), fill=(40, 40, 46))


def icon_scissors(d, cx, cy, col):
    d.polygon([(cx - 40, cy), (cx + 420, cy - 140), (cx + 430, cy - 110), (cx + 10, cy + 30)], fill=(150, 156, 168))
    d.polygon([(cx - 40, cy + 20), (cx + 420, cy + 160), (cx + 430, cy + 130), (cx + 10, cy - 10)], fill=(175, 180, 192))
    for oy in (-110, 130):
        d.ellipse((cx - 330, cy + oy - 90, cx - 90, cy + oy + 90), outline=col, width=44)
    d.ellipse((cx - 40, cy - 10, cx + 0, cy + 30), fill=(60, 64, 76))


def icon_clip(d, cx, cy, col):
    for k in range(3):
        x = cx - 360 + k * 260
        d.rounded_rectangle((x, cy - 160, x + 200, cy + 160), radius=60, fill=col)
        d.rounded_rectangle((x + 40, cy - 120, x + 160, cy + 40), radius=40, fill=tuple(min(255, v + 70) for v in col))


def icon_bowl(d, cx, cy, col):
    d.pieslice((cx - 380, cy - 300, cx + 380, cy + 260), 0, 180, fill=col)
    d.ellipse((cx - 380, cy - 60, cx + 380, cy + 40), fill=tuple(min(255, v + 60) for v in col))
    d.rounded_rectangle((cx + 300, cy - 30, cx + 470, cy + 10), radius=16, fill=col)


def icon_cloth(d, cx, cy, col):
    for k, off in enumerate((60, 0, -60)):
        shade = tuple(min(255, v + 30 * k) for v in col)
        d.rounded_rectangle((cx - 380, cy - 120 + off, cx + 380, cy + 40 + off), radius=36, fill=shade)


def icon_sponge(d, cx, cy, col):
    d.rounded_rectangle((cx - 320, cy - 180, cx + 320, cy + 180), radius=120, fill=tuple(min(255, v + 90) for v in col))
    for i in range(14):
        x, y = cx - 250 + (i * 137) % 500, cy - 120 + (i * 61) % 240
        d.ellipse((x, y, x + 34, y + 30), fill=tuple(min(255, v + 50) for v in col))


def icon_cap(d, cx, cy, col):
    d.pieslice((cx - 330, cy - 280, cx + 330, cy + 280), 180, 360, fill=tuple(min(255, v + 80) for v in col))
    d.rounded_rectangle((cx - 360, cy - 20, cx + 360, cy + 40), radius=30, fill=col)


def icon_razor(d, cx, cy, col):
    d.rounded_rectangle((cx - 60, cy - 60, cx + 60, cy + 360), radius=50, fill=col)
    d.rounded_rectangle((cx - 260, cy - 200, cx + 260, cy - 60), radius=40, fill=(205, 210, 220))
    d.rectangle((cx - 230, cy - 170, cx + 230, cy - 150), fill=(120, 126, 140))


def icon_dryer(d, cx, cy, col):
    d.rounded_rectangle((cx - 380, cy - 170, cx + 240, cy + 110), radius=140, fill=col)
    d.rounded_rectangle((cx + 200, cy - 120, cx + 420, cy + 60), radius=40, fill=tuple(max(0, v - 30) for v in col))
    d.ellipse((cx - 330, cy - 120, cx - 150, cy + 60), fill=tuple(min(255, v + 60) for v in col))
    d.rounded_rectangle((cx - 120, cy + 60, cx + 20, cy + 380), radius=50, fill=col)


def icon_iron(d, cx, cy, col):
    for dy in (-60, 60):
        d.rounded_rectangle((cx - 420, cy + dy - 40, cx + 420, cy + dy + 40), radius=40, fill=col)
        d.rectangle((cx - 380, cy + dy - 18, cx - 40, cy + dy + 18), fill=(210, 214, 222))


def icon_trimmer(d, cx, cy, col):
    d.rounded_rectangle((cx - 110, cy - 300, cx + 110, cy + 330), radius=90, fill=col)
    d.rectangle((cx - 130, cy - 340, cx + 130, cy - 290), fill=(200, 205, 214))
    for i in range(12):
        d.rectangle((cx - 125 + i * 22, cy - 380, cx - 113 + i * 22, cy - 340), fill=(160, 166, 178))


def icon_steamer(d, cx, cy, col):
    d.ellipse((cx - 300, cy - 300, cx + 200, cy + 60), fill=col)
    d.rounded_rectangle((cx - 40, cy - 40, cx + 20, cy + 360), radius=20, fill=(120, 126, 140))
    d.rounded_rectangle((cx - 200, cy + 330, cx + 180, cy + 380), radius=20, fill=(90, 96, 110))


def icon_scale(d, cx, cy, col):
    d.rounded_rectangle((cx - 380, cy - 60, cx + 380, cy + 200), radius=40, fill=col)
    d.rounded_rectangle((cx - 420, cy - 140, cx + 420, cy - 60), radius=30, fill=(220, 224, 232))
    d.rounded_rectangle((cx - 140, cy + 30, cx + 140, cy + 130), radius=16, fill=(30, 40, 30))


ICONS = {
    'comb': icon_comb, 'brush': icon_brush, 'scissors': icon_scissors, 'clip': icon_clip, 'bowl': icon_bowl,
    'cloth': icon_cloth, 'sponge': icon_sponge, 'cap': icon_cap, 'razor': icon_razor, 'dryer': icon_dryer,
    'iron': icon_iron, 'curler': icon_iron, 'trimmer': icon_trimmer, 'steamer': icon_steamer, 'scale': icon_scale,
}


def render(p: dict, brand_name: str, path: Path) -> None:
    top, bottom = BACKGROUND.get(p['category'], ('#F4F5F8', '#E3E6EC'))
    img = Image.new('RGB', (S, S), hex_rgb(top))
    grad = Image.linear_gradient('L').resize((S, S))
    img = Image.composite(Image.new('RGB', (S, S), hex_rgb(bottom)), img, grad)
    d = ImageDraw.Draw(img)
    c = colour_for(p.get('brand'))
    shape = shape_for(p)
    if shape in ICONS:
        tool_card(img, d, p, brand_name, c, ICONS[shape])
    else:
        {'bottle': draw_bottle, 'jug': draw_jug, 'tube': draw_tube, 'tub': draw_tub, 'pouch': draw_pouch,
         'spray': draw_spray, 'box': draw_box}[shape](img, d, p, brand_name, c)
    d = ImageDraw.Draw(img)
    d.text((S - 50, S - 44), 'SAMPLE IMAGE', font=font('semi', 28), fill=(130, 138, 152), anchor='rb')
    img.resize((OUT, OUT), Image.LANCZOS).save(path, 'WEBP', quality=82, method=6)


def render_all(products: list[dict], brands: dict[str, dict], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob('*.webp'):
        old.unlink()
    for p in products:
        if p.get('brand'):
            brand = brands.get(p['brand'], {}).get('name', '')
        else:  # no brand: supplies say so, other items show what they are
            brand = 'Salon Supply' if p['category'] in ('accessories', 'electrical-tools') else p['typeLabel']
        render(p, brand, out_dir / Path(p['image']).name)
