# python3 outils/planche.py plans/<id>/photos <sortie.jpg> : planche contact des photos.
# Avec le plan.json du dossier : ordre de la galerie, étiquette « niveau · vue » sur un plan à plusieurs niveaux.
import sys, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
d = Path(sys.argv[1]); out = sys.argv[2]
fs = sorted(d.glob('*.jpg')); noms = {f.stem: f.stem for f in fs}
try:
    P = json.loads((d.parent / 'plan.json').read_text())
    lv = P.get('levels') or []
    nomlv = lambda k: (lv[k].get('name') if k is not None and 0 <= k < len(lv) else None) or (f'Niveau {k + 1}' if k is not None else '')
    rang = {}
    for i, p in enumerate(P.get('photos', [])):
        for f in fs:
            if f.stem.startswith(p['id'] + '-') and f.stem[len(p['id']) + 1:] in {m.get('id') for m in P.get('moments') or [{'id': 'jour'}]}:
                rang[f.stem] = i
                if len(lv) > 1: noms[f.stem] = f"{nomlv(p.get('level', 0))} · {f.stem}"
    fs.sort(key=lambda f: (rang.get(f.stem, 1e9), f.stem))
except (OSError, ValueError):
    pass
W = 640; ims = []
for f in fs:
    im = Image.open(f); im = im.resize((W, int(im.height * W / im.width))); ims.append((noms[f.stem], im))
cols = 3; rows = (len(ims) + cols - 1) // cols; h = max(i.height for _, i in ims) + 28
sheet = Image.new('RGB', (cols * W, rows * h), 'white'); dr = ImageDraw.Draw(sheet)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 20)
for k, (n, im) in enumerate(ims):
    x, y = (k % cols) * W, (k // cols) * h; sheet.paste(im, (x, y + 28)); dr.text((x + 6, y + 4), n, fill='black', font=font)
sheet.save(out, quality=85)
