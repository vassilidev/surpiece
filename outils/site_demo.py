#!/usr/bin/env python3
"""Génère site/demo/ : le logement de démonstration du site (animation « du plan à la visite » et démo du vrai moteur).

    python3 outils/site_demo.py [--source ../surpiece] [--plan d201-f14b3e4b]

--source contient moteur/ et plans/<id>/ (par défaut la copie publiée, stable, plutôt que le moteur en cours de travail).
Produit, dans site/demo/ (jamais versionné, site/.gitignore) :
- moteur/ : copie du moteur sans admin.js (le mode admin ne doit jamais apparaître sur le site) ;
- plans/<id>/ : la visite et le 360° du logement, cartouche et titres neutres (ni promoteur ni programme), panoramas limités à 4096 ;
- avant.jpg : plan du promoteur recadré sur un rectangle en mètres (repère du plan.json) ; apres.jpg : vue du dessus du moteur sur le
  même rectangle (outils/site_rendu.mjs) ; les deux se superposent au pixel près ;
- geo.json : murs, pièces, ouvertures, cotes, caméra de la photo du séjour, pour assets/js/cinema.js ;
- visite.jpg, maquette.jpg, photos des pièces et une vue 360 recadrée pour le bento.
Le logement doit être plus long en z qu'en x : l'animation l'affiche tourné d'un quart de tour (z vers la droite)."""
import argparse, json, re, shutil, subprocess, sys
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
RATIO = 1.5  # largeur / hauteur de l'animation (3:2)


def copie_moteur(src, dst):
    shutil.copytree(src / 'moteur', dst / 'moteur', ignore=lambda d, f: [x for x in f if x == 'admin.js' or x.startswith('.')])


def neutre(p, facts):
    """Aucun nom de promoteur, de SCCV ni de programme sur le site."""
    p['titre'] = f"{facts['type']} · {facts['surface']} m²"
    p['kicker'] = 'Appartement de démonstration'
    c = p.get('cartouche') or {}
    p['cartouche'] = {'id': c.get('id', ''), 'l1': f"{facts['type']} · {facts['etage']}", 'l2': f"{facts['surface']} m² habitables", 'l3': facts['ext']}
    return p


def faits(p, extract):
    txt = ' '.join(p.get('facts') or [])
    m = re.search(r'(\d+)\s*Pi[eè]ces?', txt)
    t = f"T{m.group(1)}" if m else 'Logement'
    m = re.search(r'habitable[^0-9]*([\d.,]+)', txt)
    s = m.group(1).replace('.', ',') if m else ''
    rooms = {r['id']: r for r in p['rooms'] if r.get('name')}
    ext = next((f"{r['name']} {r['area']} m²" for k, r in rooms.items() if k in ('loggia', 'balcon', 'terrasse')), '')
    m = re.search(r'(\d+)\s*(?:e|è|ème|eme)\s*étage', ' '.join([txt] + list((p.get('cartouche') or {}).values())), re.I)
    etage = f"{m.group(1)}e étage" if m else ''
    return {'type': t, 'surface': s, 'ext': ext, 'etage': etage, 'ech': extract['echelle']['ech']}


def point_interieur(poly):
    """Point de la pièce le plus éloigné de ses murs (recherche sur une grille) : place l'étiquette dans une pièce en L."""
    xs, zs = [a for a, _ in poly], [b for _, b in poly]
    def dedans(x, z):
        c = False
        for (x1, z1), (x2, z2) in zip(poly, poly[1:] + poly[:1]):
            if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1: c = not c
        return c
    def dist(x, z):
        best = 1e9
        for (x1, z1), (x2, z2) in zip(poly, poly[1:] + poly[:1]):
            dx, dz = x2 - x1, z2 - z1; L = dx * dx + dz * dz or 1e-9
            k = max(0, min(1, ((x - x1) * dx + (z - z1) * dz) / L))
            best = min(best, ((x - x1 - k * dx) ** 2 + (z - z1 - k * dz) ** 2) ** .5)
        return best
    best, pt = -1, [sum(xs) / len(xs), sum(zs) / len(zs)]
    n = 40
    for i in range(n + 1):
        for j in range(n + 1):
            x = min(xs) + (max(xs) - min(xs)) * i / n; z = min(zs) + (max(zs) - min(zs)) * j / n
            if dedans(x, z):
                d = dist(x, z)
                if d > best: best, pt = d, [x, z]
    return [round(pt[0], 3), round(pt[1] - .1, 3)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', default=str(RACINE.parent / 'surpiece'))
    ap.add_argument('--plan', default='d201-f14b3e4b')
    ap.add_argument('--dest', default=str(RACINE / 'site' / 'demo'))
    a = ap.parse_args()
    src, dst, pid = Path(a.source), Path(a.dest), a.plan
    sp = src / 'plans' / pid
    p = json.loads((sp / 'plan.json').read_text())
    ex = json.loads((sp / 'admin' / 'extract.json').read_text())
    if dst.exists(): shutil.rmtree(dst)
    (dst / 'plans' / pid / 'pano').mkdir(parents=True)
    (dst / 'plans' / pid / 'photos').mkdir()
    copie_moteur(src, dst)

    f = faits(p, ex)
    # visite et 360 du logement, neutralisés
    noindex = lambda f: f.write_text(f.read_text().replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow">', 1))
    shutil.copy(sp / 'index.html', dst / 'plans' / pid / 'index.html'); noindex(dst / 'plans' / pid / 'index.html')
    # polices du site hébergées avec lui : aucun appel à Google Fonts depuis la démo
    vi = dst / 'plans' / pid / 'index.html'
    vi.write_text(re.sub(r'<link rel="preconnect" href="https://fonts\.g[^>]*>\s*', '', re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>',
                  '<link rel="stylesheet" href="../../../assets/css/polices.css">', vi.read_text())))
    (dst / 'plans' / pid / 'plan.json').write_text(json.dumps(neutre(dict(p), f), ensure_ascii=False))
    for x in (sp / 'photos').glob('*.jpg'): shutil.copy(x, dst / 'plans' / pid / 'photos' / x.name)
    pano = sp / 'pano'
    for x in pano.iterdir():
        if x.name in ('index.html', 'visionneuse.js') or re.fullmatch(r'niveau-\d+\.png', x.name) or re.fullmatch(r'.+-(512|2048|4096)\.jpg', x.name):
            shutil.copy(x, dst / 'plans' / pid / 'pano' / x.name)
    noindex(dst / 'plans' / pid / 'pano' / 'index.html')
    v = json.loads((pano / 'visite.json').read_text())
    v['tailles'] = [t for t in v.get('tailles', [2048]) if t <= 4096]; v['titre'] = f"{f['type']} · {f['surface']} m²"
    (dst / 'plans' / pid / 'pano' / 'visite.json').write_text(json.dumps(v, ensure_ascii=False))

    # rectangle en mètres, format 3:2 une fois tourné (z vers la droite)
    bx0, bx1, bz0, bz1 = p['bounds']
    if bz1 - bz0 < bx1 - bx0: sys.exit('Logement plus large que long : l\'animation attend un plan plus long en z (à adapter).')
    # marges larges : la puce en haut, les étapes en bas et le compteur d'analyse à droite ne doivent pas cacher le logement,
    # qui est donc décalé vers la gauche du cadre
    FW = (bz1 - bz0) * 1.36; FH = FW / RATIO
    if FH < (bx1 - bx0) * 1.5: FH = (bx1 - bx0) * 1.5; FW = FH * RATIO
    cz, cx = (bz0 + bz1) / 2 + FW * .1, (bx0 + bx1) / 2
    X0, X1, Z0, Z1 = round(cx - FH / 2, 3), round(cx + FH / 2, 3), round(cz - FW / 2, 3), round(cz + FW / 2, 3)

    # plan du promoteur recadré (même rectangle), 1200 × 1800
    im = ex['image']; k, (ox, oz) = im['px_par_m'], im['origine_px']
    src_img = Image.open(sp / 'admin' / im['file']).convert('RGB')
    box = (round(ox + X0 * k), round(oz + Z0 * k), round(ox + X1 * k), round(oz + Z1 * k))
    page = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), 'white')
    page.paste(src_img, (-box[0], -box[1]))
    page.resize((1200, 1800), Image.LANCZOS).save(dst / 'avant.jpg', quality=88)

    # vue du dessus du moteur (même rectangle)
    tmp = dst / '_dessus.png'
    subprocess.run(['node', str(RACINE / 'outils' / 'site_rendu.mjs'), str(src), f'plans/{pid}', str(tmp), str(X0), str(X1), str(Z0), str(Z1), '900'], check=True)
    Image.open(tmp).convert('RGB').resize((1200, 1800), Image.LANCZOS).save(dst / 'apres.jpg', quality=86); tmp.unlink()

    # géométrie pour l'animation
    r3 = lambda v: round(v, 3)
    rooms = [r for r in p['rooms'] if r.get('name')]
    rooms.sort(key=lambda r: -float(r['area'].replace(',', '.')))
    photo = next((c for c in p.get('photos', []) if c.get('room') == rooms[0]['id'] and 'inverse' not in c['id']), p['photos'][0])
    g = {'frame': [X0, X1, Z0, Z1], 'H': p['H'], 'facts': f,
         'walls': [{'k': w['k'], 'p': [[r3(x), r3(z)] for x, z in w['poly']]} for w in p['walls']],
         'rooms': [{'id': r['id'], 'n': r['name'], 'a': r['area'], 'at': point_interieur(r['poly']), 'p': [[r3(x), r3(z)] for x, z in r['poly']]}
                   for r in rooms if float(r['area'].replace(',', '.')) >= 1.5],
         'open': [{'k': o['kind'], 'p': o['p']} for o in p['openings'].values()],
         'dims': [[r3(a), r3(b), r3(c), r3(d), t] for a, b, c, d, t in p.get('dims', [])],
         'cam': photo['cam'], 'photo': photo['id']}
    (dst / 'geo.json').write_text(json.dumps(g, ensure_ascii=False, separators=(',', ':')))

    # images du site
    ph = sp / 'photos'
    shutil.copy(ph / f"{photo['id']}-jour.jpg", dst / 'visite.jpg')
    if (ph / 'maquette-jour.jpg').exists(): shutil.copy(ph / 'maquette-jour.jpg', dst / 'maquette.jpg')
    n0 = next(pano.glob('niveau-0.png'), None)
    if n0: shutil.copy(n0, dst / 'plan2d.png')
    eq = pano / f"{v['depart']}-2048.jpg"
    if eq.exists():
        e = Image.open(eq).convert('RGB'); W, H = e.size
        e.crop((int(W * .2), int(H * .22), int(W * .8), int(H * .78))).resize((1400, 900)).save(dst / 'pano.jpg', quality=84)
    print(f"site/demo prêt : {pid} · {f['type']} {f['surface']} m² · cadre x {X0}..{X1}, z {Z0}..{Z1} · photo {photo['id']}")


if __name__ == '__main__':
    main()
