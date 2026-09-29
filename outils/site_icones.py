#!/usr/bin/env python3
"""Icônes et image de partage du site (site/assets/img/), à relancer si le nom ou la charte changent.

    python3 outils/site_icones.py [--nom "Déjà chez moi"] [--lettre D]

- favicon.svg (lettre vectorisée, Archivo 800 large, blanche sur Bleu plan, carré aux angles doux), favicon-32.png,
  apple-touch-icon.png (180), icon-192.png, icon-512.png ;
- og.png (1200 × 630) : cartouche du nom, titre, maquette du logement de démonstration (site/demo/maquette.jpg, sinon rien).
La police Archivo (variable) est lue dans .cache/fonts/Archivo.ttf (Google Fonts, licence OFL), téléchargée si absente."""
import argparse, subprocess
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import Image, ImageDraw, ImageFont

R = Path(__file__).resolve().parent.parent
FONT = R / '.cache' / 'fonts' / 'Archivo.ttf'
OUT = R / 'site' / 'assets' / 'img'
BLEU, ENCRE, PAPIER, GRAPHITE = '#2C49B8', '#161918', '#EDEFEA', '#555B57'


def police():
    if not FONT.exists():
        FONT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['curl', '-fsSL', '-o', str(FONT), 'https://github.com/google/fonts/raw/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf'], check=True)
    return FONT


def favicon(lettre):
    f = instantiateVariableFont(TTFont(police()), {'wght': 800, 'wdth': 125})
    gs, g = f.getGlyphSet(), f.getBestCmap()[ord(lettre)]
    b = BoundsPen(gs); gs[g].draw(b); x0, y0, x1, y1 = b.bounds
    k = 300 / (y1 - y0)  # hauteur de la lettre : 300 sur 512
    w = (x1 - x0) * k
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, 256 - w / 2 - x0 * k, 256 + 150 + y0 * k)))
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="{BLEU}"/>'
           f'<path d="{pen.getCommands()}" fill="#fff"/></svg>')
    (OUT / 'favicon.svg').write_text(svg)
    for nom, taille in [('favicon-32.png', 32), ('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
        subprocess.run(['magick', '-background', 'none', '-density', '384', str(OUT / 'favicon.svg'), '-resize', f'{taille}x{taille}', str(OUT / nom)], check=True)


def og(nom):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), PAPIER); d = ImageDraw.Draw(im)
    for x in range(0, W, 40): d.line([(x, 0), (x, H)], fill='#E1E4DE')
    for y in range(0, H, 40): d.line([(0, y), (W, y)], fill='#E1E4DE')
    def fnt(taille, wght, wdth):
        ft = ImageFont.truetype(str(police()), taille)
        ft.set_variation_by_axes([wght, wdth]); return ft
    maq = R / 'site' / 'demo' / 'maquette.jpg'
    if maq.exists():
        m = Image.open(maq).convert('RGB'); m = m.resize((520, int(520 * m.height / m.width)))
        top = (H - m.height) // 2; im.paste(m, (W - 520 - 50, top))
        d.rectangle([W - 520 - 50, top, W - 50, top + m.height], outline='#CDD2CB', width=2)
    # cartouche du nom
    fc = fnt(34, 800, 125); t = nom.upper(); bx = d.textbbox((0, 0), t, font=fc)
    d.rectangle([60, 60, 60 + bx[2] + 40, 60 + 70], fill='#FAFBF8', outline=ENCRE, width=3)
    d.text((80, 60 + 35 - (bx[3] + bx[1]) / 2), t, font=fc, fill=ENCRE)
    # titre
    ft = fnt(66, 800, 112); y = 190
    for ligne in ['Transformez', 'votre plan en', 'visite 3D.']:
        d.text((60, y), ligne, font=ft, fill=ENCRE); y += 74
    d.text((60, y + 26), 'Neuf ou ancien · en quelques minutes', font=fnt(26, 500, 100), fill=GRAPHITE)
    d.rectangle([60, y + 80, 60 + 64, y + 86], fill=BLEU)
    im.save(OUT / 'og.png', optimize=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--nom', default='Déjà chez moi'); ap.add_argument('--lettre', default='D'); a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True); favicon(a.lettre); og(a.nom)
    print('icônes et image de partage prêtes :', ', '.join(sorted(p.name for p in OUT.iterdir())))
