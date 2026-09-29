#!/usr/bin/env python3
"""Matières hybrides de l'ultra réaliste (L4-13, étape E1) : échantillons scannés CC0 pour remplir la pose procédurale.

Le moteur garde la pose (lames, joints, formats de carreaux, fenêtres de façade : moteur/matieres.js) et prendra le grain, le fil et
le relief de scans CC0 (Poly Haven, ambientCG). Cet outil prépare les fichiers ; il ne touche pas au moteur.

  1. télécharge chaque source dans .cache/matieres/ (non versionné) et vérifie son SHA-256 contre moteur/matieres/SOURCES.json ;
  2. rend chaque échantillon raccordable si son bord ne raccorde pas (fondu avec sa copie décalée d'une demi-période) ;
  3. étalonne l'albédo moyen (et la rugosité moyenne) sur la texture procédurale actuelle, mesurée en exécutant moteur/matieres.js
     avec Node (sans navigateur), sur ses seules surfaces (joints, coulis et fenêtres exclus, teinte de lame ou de carreau retirée) ;
  4. écrit moteur/matieres/<clé>-{512,1024,2048}-cr.webp (RGB : albédo sRGB, alpha : rugosité ; avec perte, qualité 90) et
     <clé>-{512,1024,2048}-n.webp (normale tangente OpenGL, sans perte) ; mipmaps laissés au GPU ;
  5. écrit moteur/matieres/INDEX.json (clé → fichiers, répétition en mètres, albédo mesuré, cible, ΔE2000) ;
  6. avec --planches DOSSIER : planches de contrôle PNG (procédural actuel, remplissage seul, hybride simulé, à la même échelle).

Usage :
  python3 outils/matieres_pbr.py --empreintes          # première fois : métadonnées des sources, empreintes → SOURCES.json
  python3 outils/matieres_pbr.py [--cles oak,gres] [--planches /chemin/dossier]
Aucun appel payant. Lancer sous `nice -n 19` si une mesure de performance tourne à côté.
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
import zlib
from pathlib import Path

import ssl

import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    import cv2  # lecture des PNG 16 bits (normales Poly Haven) ; repli PIL (8 bits)
except Exception:  # pragma: no cover
    cv2 = None

try:  # Python de python.org sans magasin de certificats : celui de certifi (requirements.txt)
    import certifi
    SSL = ssl.create_default_context(cafile=certifi.where())
except Exception:  # pragma: no cover
    SSL = ssl.create_default_context()

RACINE = Path(__file__).resolve().parent.parent
MOTEUR = RACINE / 'moteur'
SORTIE = MOTEUR / 'matieres'
CACHE = RACINE / '.cache' / 'matieres'
SOURCES_JSON = SORTIE / 'SOURCES.json'
INDEX_JSON = SORTIE / 'INDEX.json'
UA = 'visite-plans-matieres-pbr/1.0 (outil interne ; textures CC0)'
N = 2048            # résolution de travail (sources 2K)
RES = (2048, 1024, 512)
LG, LEVEL = 0.5, 2.8  # carreau de loggia et hauteur d'étage par défaut du moteur (engine.js : D.loggia.tile, CTX.level)

# ---------------------------------------------------------------------------------------------------------------------------------
# Sources retenues (toutes CC0). Poly Haven : fichiers 2K de l'API (couleur JPEG, normale OpenGL PNG, rugosité JPEG).
# ambientCG : archive 2K-JPG (Color, NormalGL, Roughness). Seules les sources photographiées (photogrammétrie, multi-angle) sont
# retenues ; les matières « PBRProcedural » d'ambientCG sont écartées.
SOURCES = {
    'oak_veneer_01': {'fournisseur': 'Poly Haven', 'id': 'oak_veneer_01'},
    'Marble026': {'fournisseur': 'ambientCG', 'id': 'Marble026',
                  # ambientCG ne publie pas la taille de ce scan (dimensionX = 0) : taille estimée à la vue (fossiles de 1 à 3 cm)
                  'dimensions_m': [1.0, 1.0], 'dimensions_note': 'estimée (non publiée par ambientCG), à juger sur planche'},
    'granular_concrete': {'fournisseur': 'Poly Haven', 'id': 'granular_concrete'},
    'concrete_floor_01': {'fournisseur': 'Poly Haven', 'id': 'concrete_floor_01'},
    'painted_plaster_wall': {'fournisseur': 'Poly Haven', 'id': 'painted_plaster_wall'},
    'plastered_wall': {'fournisseur': 'Poly Haven', 'id': 'plastered_wall'},
    'Ground037': {'fournisseur': 'ambientCG', 'id': 'Ground037'},
}

# matières du moteur : clé (fichiers), source, texture procédurale mesurée (moteur/matieres.js), matériaux du moteur et leur teinte
# (makeMaterials, engine.js), pose gardée, fenêtre des planches (m), échelle de normale actuelle (setTex)
MATIERES = [
    {'cle': 'oak', 'source': 'oak_veneer_01', 'proc': 'oak', 'moteur': {'floor_dry': 'ffffff'},
     'pose': 'lames 1,20 × 0,20 m, joints, teinte par lame (oak)', 'fenetre': 2.4, 'zoom': 0.4, 'ns': 0.5},
    {'cle': 'gres', 'source': 'Marble026', 'proc': 'gres', 'moteur': {'floor_wet': 'ffffff', 'palier_floor': 'b9b6ae'},
     'pose': 'carreaux 45 × 45 cm, joint 3 mm, teinte par carreau', 'fenetre': 1.8, 'zoom': 0.3, 'ns': 0.6},
    {'cle': 'loggia', 'source': 'granular_concrete', 'proc': 'loggia', 'moteur': {'loggia_floor': 'ffffff'},
     'pose': 'carreaux lg × lg (0,50 m par défaut), joint 6 mm', 'fenetre': 2.0, 'zoom': 0.4, 'ns': 1.2},
    {'cle': 'paving', 'source': 'concrete_floor_01', 'proc': 'paving', 'moteur': {'paving': 'ffffff'},
     'pose': 'pavés 60 × 30 cm à joints décalés, joint 6 mm', 'fenetre': 2.4, 'zoom': 0.4, 'ns': 0.8},
    {'cle': 'paint', 'source': 'painted_plaster_wall', 'proc': 'paint',
     'moteur': {'wall_b': 'f2f2ef', 'wall_c': 'f2f2ef', 'ceiling': 'f8f7f3', 'ceiling_j': 'f8f7f3'},
     'pose': 'aucune', 'fenetre': 2.0, 'zoom': 0.25, 'ns': 0.25},
    {'cle': 'ext', 'source': 'plastered_wall', 'proc': 'ext', 'moteur': {'ext': 'e8e4dc'},
     'pose': 'aucune', 'fenetre': 4.0, 'zoom': 0.5, 'ns': 0.4},
    # dalles : aujourd'hui l'enduit (T.ext) teinté c9c7c1 ; même cible que l'enduit, la teinte du matériau reste
    {'cle': 'beton', 'source': 'granular_concrete', 'proc': 'ext', 'moteur': {'slab': 'c9c7c1', 'slab_j': 'c9c7c1'},
     'pose': 'aucune', 'fenetre': 4.0, 'zoom': 0.5, 'ns': 0.5},
    {'cle': 'facade', 'source': 'plastered_wall', 'proc': 'facade', 'moteur': {'facade': 'ffffff'},
     'pose': 'modules de 3 m, fenêtres, stores, bandeau de nez de dalle (facade)', 'fenetre': 6.0, 'zoom': 1.0, 'ns': 0.2},
    {'cle': 'grass', 'source': 'Ground037', 'proc': 'grass', 'moteur': {'ground': 'ffffff'},
     'pose': 'aucune', 'fenetre': 8.0, 'zoom': 1.0, 'ns': 0.6},
]

NON_COUVERTES = {
    'faience': "aucun scan CC0 d'émail blanc lisse : les « Porcelain001-003 » d'ambientCG sont procédurales ; les faïences scannées "
               "de Poly Haven ont des carreaux de 5 à 15 cm (joints dans l'échantillon) ; procédural gardé",
    'steel, chrome (inox, chrome)': "aucun inox brossé scanné (ambientCG Metal009/010/012 : procédurales ; Poly Haven : métaux rouillés "
                                    "ou tôles) ; pièces de 1 à 5 cm, lisses dans le moteur",
    'door_leaf, door_frame, entry_leaf (portes)': 'portes laquées unies dans le moteur, aucun bois : rien à remplir',
    'foliage (feuillage)': 'arbres du contexte : étape E5 (imposteurs)',
    'asphalte': 'aucune matière asphalte dans le moteur (abords : pavés et gazon)',
}


# ---------------------------------------------------------------------------------------------------------------------------------
# couleurs
def s2l(c):
    c = np.asarray(c, dtype=np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def l2s(c):
    c = np.clip(np.asarray(c, dtype=np.float32), 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055).astype(np.float32)


def lab(lin):
    """albédo linéaire sRGB (3) → CIELAB (D65)"""
    r, g, b = [float(x) for x in lin]
    X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(X / 0.95047), f(Y / 1.0), f(Z / 1.08883)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def de2000(lin1, lin2):
    L1, a1, b1 = lab(lin1)
    L2, a2, b2 = lab(lin2)
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360
    h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    if C1p * C2p == 0:
        dhp = 0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    elif h2p - h1p > 180:
        dhp = h2p - h1p - 360
    else:
        dhp = h2p - h1p + 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbp = (h1p + h2p) / 2
    elif h1p + h2p < 360:
        hbp = (h1p + h2p + 360) / 2
    else:
        hbp = (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    dth = 30 * math.exp(-((hbp - 275) / 25) ** 2)
    Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    Rt = -math.sin(math.radians(2 * dth)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def hexlin(h):
    return s2l(np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32))


def srgb8(lin):
    return [int(round(float(v) * 255)) for v in l2s(np.asarray(lin))]


# ---------------------------------------------------------------------------------------------------------------------------------
# téléchargement, empreintes
def http(url, dest=None):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120, context=SSL) as r:
        data = r.read()
    if dest:
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_suffix(dest.suffix + '.part')
        tmp.write_bytes(data)
        tmp.replace(dest)
    return data


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def metadonnees(sid, s):
    """métadonnées d'une source par l'API publique du site (--empreintes seulement)"""
    if s['fournisseur'] == 'Poly Haven':
        info = json.loads(http(f"https://api.polyhaven.com/info/{s['id']}"))
        files = json.loads(http(f"https://api.polyhaven.com/files/{s['id']}"))
        fic = [{'role': 'couleur', 'url': files['Diffuse']['2k']['jpg']['url']},
               {'role': 'normale', 'url': files['nor_gl']['2k']['png']['url']},
               {'role': 'rugosite', 'url': files['Rough']['2k']['jpg']['url']}]
        return {'fournisseur': 'Poly Haven', 'page': f"https://polyhaven.com/a/{s['id']}", 'licence': 'CC0-1.0',
                'licence_page': 'https://polyhaven.com/license', 'auteur': ', '.join(info.get('authors', {}).keys()),
                'dimensions_m': [round(d / 1000, 3) for d in info['dimensions']], 'dimensions_note': 'API Poly Haven',
                'titre': info.get('name'), 'fichiers': fic}
    d = json.loads(http(f"https://ambientcg.com/api/v2/full_json?id={s['id']}&include=displayData,dimensionsData,downloadData"))
    a = d['foundAssets'][0]
    if a.get('creationMethod') == 'PBRProcedural':
        raise SystemExit(f"{sid} : matière procédurale sur ambientCG, pas un scan")
    dims = s.get('dimensions_m') or ([a['dimensionX'] / 100, a['dimensionY'] / 100] if a.get('dimensionX') else None)
    return {'fournisseur': 'ambientCG', 'page': f"https://ambientcg.com/view?id={s['id']}", 'licence': 'CC0-1.0',
            'licence_page': 'https://docs.ambientcg.com/license/', 'auteur': 'ambientCG (Lennart Demes)',
            'methode': a.get('creationMethod'), 'dimensions_m': dims,
            'dimensions_note': s.get('dimensions_note', 'API ambientCG'), 'titre': a.get('displayName'),
            'fichiers': [{'role': 'archive', 'url': f"https://ambientcg.com/get?file={s['id']}_2K-JPG.zip"}]}


def chemin_cache(sid, url):
    nom = url.split('file=')[-1] if 'file=' in url else url.rsplit('/', 1)[-1]
    return CACHE / sid / nom


def preparer_sources(empreintes, sids):
    """télécharge ce qui manque dans le cache et vérifie les empreintes ; --empreintes : (ré)écrit SOURCES.json"""
    if empreintes:
        doc = json.loads(SOURCES_JSON.read_text()) if SOURCES_JSON.exists() else {}
        doc['note'] = ("Sources des matières hybrides (L4-13, E1). Fichiers bruts non versionnés (cache .cache/matieres/), vérifiés "
                       "par leur SHA-256 ; seuls les fichiers dérivés de moteur/matieres/ sont servis. Toutes CC0-1.0.")
        doc.setdefault('sources', {})
        for sid in sids:
            m = metadonnees(sid, SOURCES[sid])
            for f in m['fichiers']:
                p = chemin_cache(sid, f['url'])
                if not p.exists():
                    print(f"  téléchargement {f['url']}", flush=True)
                    http(f['url'], p)
                f['sha256'], f['octets'] = sha256(p), p.stat().st_size
            doc['sources'][sid] = m
        doc['matieres'] = {m['cle']: {'source': m['source'], 'materiaux_moteur': list(m['moteur']),
                                      'dimensions_m': doc['sources'][m['source']]['dimensions_m']} for m in MATIERES
                           if m['source'] in doc['sources']}
        SORTIE.mkdir(parents=True, exist_ok=True)
        SOURCES_JSON.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n')
    if not SOURCES_JSON.exists():
        raise SystemExit('SOURCES.json absent : lancer une première fois avec --empreintes')
    doc = json.loads(SOURCES_JSON.read_text())
    for sid in sids:
        if sid not in doc['sources']:
            raise SystemExit(f'{sid} absent de SOURCES.json : relancer avec --empreintes')
        for f in doc['sources'][sid]['fichiers']:
            p = chemin_cache(sid, f['url'])
            if not p.exists():
                print(f"  téléchargement {f['url']}", flush=True)
                http(f['url'], p)
            h = sha256(p)
            if h != f['sha256']:
                raise SystemExit(f"empreinte différente pour {p.name} : {h} au lieu de {f['sha256']} (source changée ?)")
    return doc


# ---------------------------------------------------------------------------------------------------------------------------------
# lecture des sources
def lire(p, gris=False):
    a = cv2.imread(str(p), cv2.IMREAD_UNCHANGED) if cv2 is not None else None
    if a is None:
        im = Image.open(p)
        a = np.asarray(im.convert('L' if gris else 'RGB'), dtype=np.float32) / 255
    else:
        sc = 65535.0 if a.dtype == np.uint16 else 255.0
        a = a.astype(np.float32) / sc
        if a.ndim == 3:
            a = a[..., :3][..., ::-1]
            if gris:
                a = a[..., 0]
        elif not gris:
            a = np.repeat(a[..., None], 3, axis=2)
    if a.shape[0] != N or a.shape[1] != N:
        im = Image.fromarray(a.astype(np.float32)) if a.ndim == 2 else None
        if im is not None:
            a = np.asarray(im.resize((N, N), Image.LANCZOS), dtype=np.float32)
        else:
            a = np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(a[..., k])).resize((N, N), Image.LANCZOS)) for k in range(3)], 2)
    return np.ascontiguousarray(a, dtype=np.float32)


def charger_source(sid, doc):
    s = doc['sources'][sid]
    if s['fournisseur'] == 'Poly Haven':
        p = {f['role']: chemin_cache(sid, f['url']) for f in s['fichiers']}
        col, nor, rou = lire(p['couleur']), lire(p['normale']), lire(p['rugosite'], gris=True)
    else:
        z = chemin_cache(sid, s['fichiers'][0]['url'])
        dx = CACHE / sid / 'x'
        with zipfile.ZipFile(z) as zf:
            noms = zf.namelist()
            def membre(suf):
                n = next(n for n in noms if n.endswith(suf))
                q = dx / n
                if not q.exists():
                    dx.mkdir(parents=True, exist_ok=True)
                    q.write_bytes(zf.read(n))
                return q
            col, nor, rou = lire(membre('_Color.jpg')), lire(membre('_NormalGL.jpg')), lire(membre('_Roughness.jpg'), gris=True)
    nor = nor * 2 - 1
    nor /= np.maximum(np.linalg.norm(nor, axis=2, keepdims=True), 1e-6)
    return s2l(col), nor.astype(np.float32), rou


def raccord(lin, nor, rou):
    """écart au bord (dernière colonne → première, dernière ligne → première) rapporté à l'écart moyen entre pixels voisins ;
       au-delà de 1,6 : fondu avec la copie décalée d'une demi-période (dont le bord raccorde), sur une bande de 12 %"""
    y = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    dx = np.abs(np.diff(y, axis=1)).mean(); dy = np.abs(np.diff(y, axis=0)).mean()
    rx = np.abs(y[:, -1] - y[:, 0]).mean() / max(dx, 1e-6)
    ry = np.abs(y[-1, :] - y[0, :]).mean() / max(dy, 1e-6)
    score = float(max(rx, ry))
    if score <= 1.6:
        return lin, nor, rou, round(score, 2), False
    t = np.linspace(0, 1, N, endpoint=False) + 0.5 / N
    d = np.minimum(t, 1 - t) / 0.12
    f = np.clip(d, 0, 1); f = f * f * (3 - 2 * f)
    w = (f[:, None] * f[None, :])[..., None]
    sh = lambda a: np.roll(np.roll(a, N // 2, 0), N // 2, 1)
    lin2 = lin * w + sh(lin) * (1 - w)
    nor2 = nor * w + sh(nor) * (1 - w)
    nor2 /= np.maximum(np.linalg.norm(nor2, axis=2, keepdims=True), 1e-6)
    rou2 = rou * w[..., 0] + sh(rou) * (1 - w[..., 0])
    return lin2.astype(np.float32), nor2.astype(np.float32), rou2.astype(np.float32), round(score, 2), True


def aplatir(lin, frac=0.1):
    """retire les variations lentes de l'albédo (taches, dégradés d'éclairage de prise de vue) : divisé par son flou gaussien périodique
       (écart type = 10 % de l'échantillon, calculé par FFT, donc raccordable), ramené à sa moyenne. Sans cela, la répétition de
       l'échantillon dessine un damier à grande échelle (gazon sur 8 m : constat des planches du 29/09/2026). La variation à grande
       échelle reste l'affaire de la pose (teinte par lame, par carreau)"""
    n = lin.shape[0]
    f = np.fft.fftfreq(n)
    g = np.exp(-2 * (np.pi * frac * n) ** 2 * (f[:, None] ** 2 + f[None, :] ** 2))
    y = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    lent = np.real(np.fft.ifft2(np.fft.fft2(y) * g))
    return (lin * (y.mean() / np.maximum(lent, 1e-4))[..., None]).astype(np.float32)


# ---------------------------------------------------------------------------------------------------------------------------------
# textures procédurales actuelles (moteur/matieres.js exécuté par Node, sans navigateur)
JS = r"""
import { listeMatieres, genere, rng, hash2 } from '%URL%';
import { writeFileSync } from 'node:fs';
const [dir, lg, level, want] = [process.argv[1], +process.argv[2], +process.argv[3], process.argv[4].split(',')];
const meta = {};
for (const m of listeMatieres(lg, level)) {
  if (!want.includes(m.cle)) continue;
  const r = genere(m.gen, m.p, 1), x = {};
  for (const k of ['col', 'rou', 'nor']) writeFileSync(`${dir}/${m.cle}.${k}`, Buffer.from(r[k].buffer));
  if (m.gen === 'oak') { // mêmes tirages que GEN.oak
    const R = rng(5), cols = 6; x.off = []; x.tone = [];
    for (let c = 0; c < cols; c++) { x.off.push(Math.floor(R() * r.W)); x.tone.push([0.9 + R() * 0.2, 0.9 + R() * 0.2, R(), R()]); }
  }
  if (m.gen === 'tiles') {
    const ni = Math.round(m.p.rep[0] / m.p.tile[0]), nj = Math.round(m.p.rep[1] / m.p.tile[1]); x.hash = [];
    for (let i = 0; i < ni; i++) { const l = []; for (let j = 0; j < nj; j++) l.push(hash2(i, j, m.p.seed)); x.hash.push(l); }
  }
  meta[m.cle] = { gen: m.gen, p: m.p, rep: m.rep, W: r.W, H: r.H, x };
}
writeFileSync(`${dir}/meta.json`, JSON.stringify(meta));
"""


def procedurales(cles):
    d = CACHE / 'proc'
    d.mkdir(parents=True, exist_ok=True)
    js = JS.replace('%URL%', (MOTEUR / 'matieres.js').as_uri())
    subprocess.run(['node', '--input-type=module', '-e', js, str(d), str(LG), str(LEVEL), ','.join(cles)], check=True)
    meta = json.loads((d / 'meta.json').read_text())
    P = {}
    for k, m in meta.items():
        W, H = m['W'], m['H']
        rd = lambda e: np.fromfile(d / f'{k}.{e}', dtype=np.uint8).reshape(H, W, 4)
        P[k] = {**m, 'col': s2l(rd('col')[..., :3] / 255.0), 'rou': rd('rou')[..., 0] / 255.0,
                'nor': rd('nor')[..., :3].astype(np.float32) / 255 * 2 - 1}
    return P


def geom(pm, xm, ym):
    """pose procédurale en un point (mètres, lignes vers le bas comme les pixels de la texture) : surface à remplir, teinte de la
       lame ou du carreau, région (pour décaler l'échantillon), coordonnées locales (m), bande de chanfrein (normale procédurale)"""
    gen, p, rep = pm['gen'], pm['p'], pm['rep']
    xt, yt = np.mod(xm, rep[0]), np.mod(ym, rep[1])
    one = np.ones_like(xt)
    if gen == 'oak':
        W, H = pm['W'], pm['H']
        x, y = xt / rep[0] * W, yt / rep[1] * H
        cw = W / 6
        c = np.clip(np.floor(x / cw).astype(int), 0, 5)
        lx = x - c * cw
        off = np.array(pm['x']['off'], dtype=np.float64)[c]
        yy = np.mod(y - off, H)
        seg = (yy >= W).astype(int)
        yl = yy - seg * W
        e = np.minimum(np.minimum(lx, cw - lx), np.minimum(yl, W - yl))
        tone = np.array(pm['x']['tone'])[:, :2][c, seg]
        m = rep[0] / W
        return {'surf': e >= 1.4, 'bev': e < 3, 'tone': tone, 'reg': c * 2 + seg, 'lu': lx * m, 'lv': yl * m}
    if gen == 'tiles':
        t0, t1 = p['tile']
        j = np.floor(yt / t1).astype(int)
        xs = xt + (np.where(j % 2 == 1, t0 / 2, 0) if p.get('stagger') else 0)
        i = np.floor(xs / t0).astype(int)
        lx, ly = xs - i * t0, yt - j * t1
        e = np.minimum(np.minimum(lx, t0 - lx), np.minimum(ly, t1 - ly))
        g2 = p['grout'] / 2
        hs = np.array(pm['x']['hash'])
        ni, nj = hs.shape
        h = hs[np.mod(i, ni), np.mod(j, nj)]
        return {'surf': e >= g2, 'bev': e < g2 + 0.0025, 'tone': 1 + p['varA'] * (h - 0.5), 'reg': np.mod(i, ni) * nj + np.mod(j, nj),
                'lu': lx, 'lv': ly}
    if gen == 'facade':
        rh = rep[1]
        ymu = rh - yt
        mod = np.floor(xt / 3)
        lxm = xt - mod * 3
        lev = np.floor(ymu / LEVEL)
        ly = ymu - lev * LEVEL
        fen = (lxm > 0.8) & (lxm < 2.2) & (ly > 0.6) & (ly < 2.2)
        return {'surf': ~fen, 'bev': fen, 'tone': np.where(ly > 2.5, 0.9, 1.0), 'reg': np.zeros(xt.shape, int), 'lu': xm, 'lv': ym}
    return {'surf': one > 0, 'bev': one < 0, 'tone': one, 'reg': np.zeros(xt.shape, int), 'lu': xm, 'lv': ym}


def grille_proc(pm):
    W, H = pm['W'], pm['H']
    xm = (np.arange(W) / W * pm['rep'][0])[None, :].repeat(H, 0)
    ym = (np.arange(H) / H * pm['rep'][1])[:, None].repeat(W, 1)
    return geom(pm, xm, ym)


def cible(pm):
    g = grille_proc(pm)
    s = g['surf']
    lin = pm['col'][s] / g['tone'][s][:, None]
    return {'lin': lin.mean(0), 'rou': float(pm['rou'][s].mean()), 'part_surface': float(s.mean()),
            'lin_tout': pm['col'].reshape(-1, 3).mean(0), 'ecart_lum': float((lin @ np.array([0.2126, 0.7152, 0.0722])).std())}


# ---------------------------------------------------------------------------------------------------------------------------------
# étalonnage
def etalonner(lin, rou, T, Rt):
    """albédo : c' = T · (1 + k (c / m − 1)) par canal (teinte moyenne de la cible, variations relatives du scan) ; k réduit tant que
       plus de 0,2 % des pixels saturent ; puis gain pour tomber sur la moyenne. Rugosité : r' = Rt + kr (r − mr), même principe."""
    m = lin.reshape(-1, 3).mean(0)
    rel = lin / m - 1
    k = 1.0
    while True:
        out = T * (1 + k * rel)
        if (out > 1).any(axis=2).mean() <= 0.002 or k < 0.05:
            break
        k *= 0.9
    g = np.ones(3, dtype=np.float32)
    for _ in range(8):
        o = np.clip(T * g * (1 + k * rel), 0, 1)
        g *= T / np.maximum(o.reshape(-1, 3).mean(0), 1e-6)
    lin2 = np.clip(T * g * (1 + k * rel), 0, 1).astype(np.float32)
    mr = rou.mean()
    kr = 1.0
    while kr > 0.05 and ((Rt + kr * (rou - mr) > 1) | (Rt + kr * (rou - mr) < 0.03)).mean() > 0.002:
        kr *= 0.9
    rou2 = np.clip(Rt + kr * (rou - mr), 0.03, 1)
    rou2 = np.clip(rou2 + (Rt - rou2.mean()), 0.03, 1).astype(np.float32)
    return lin2, rou2, round(float(k), 3), round(float(kr), 3)


def reduire(a):
    return 0.25 * (a[0::2, 0::2] + a[1::2, 0::2] + a[0::2, 1::2] + a[1::2, 1::2])


def ecrire_webp(arr8, dest, sans_perte):
    with tempfile.NamedTemporaryFile(suffix='.png', dir=CACHE, delete=False) as t:
        tmp = Path(t.name)
    try:
        Image.fromarray(arr8).save(tmp, compress_level=1)
        # -z 9 et -m 6 : 0,3 % de gain pour 10 à 40 s de plus par fichier en 2048 (mesuré le 29/09/2026)
        opts = ['-lossless', '-z', '6', '-exact'] if sans_perte else ['-q', '90', '-m', '4', '-sharp_yuv', '-alpha_q', '100', '-exact']
        subprocess.run(['cwebp', '-quiet', '-metadata', 'none', *opts, str(tmp), '-o', str(dest)], check=True)
    finally:
        tmp.unlink(missing_ok=True)


def flou_raccord(a, sigma=1.0):
    """flou gaussien séparable, bords repliés (l'échantillon reste raccordable)"""
    r = int(math.ceil(3 * sigma))
    w = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    w /= w.sum()
    for ax in (0, 1):
        a = sum(wi * np.roll(a, i, axis=ax) for i, wi in zip(range(-r, r + 1), w))
    return a.astype(np.float32)


NORMALES = {}  # source → clé dont les fichiers de normale servent (même source, même normale)


def produire(m, lin, nor, rou):
    """rugosité : bruit au pixel lissé (flou de 1 px à 2048, soit 1 mm environ, invisible après filtrage des mipmaps) et
       quantifiée sur 64 niveaux (pas de 1,6 %) : l'alpha sans perte passe de 3,3 à 1 Mo environ pour le chêne en 2048"""
    fichiers = {}
    L, Nn, R = lin, nor, flou_raccord(rou)
    for res in RES:
        if res != N:
            L, Nn, R = reduire(L), reduire(Nn), reduire(R)
            Nn = Nn / np.maximum(np.linalg.norm(Nn, axis=2, keepdims=True), 1e-6)
        cr = np.dstack([np.round(l2s(L) * 255), np.round(np.round(np.clip(R, 0, 1) * 63) * 255 / 63)]).astype(np.uint8)
        n8 = np.round((np.clip(Nn, -1, 1) * 0.5 + 0.5) * 255).astype(np.uint8)
        cle_n = NORMALES.setdefault(m['source'], m['cle'])
        fc, fn = SORTIE / f"{m['cle']}-{res}-cr.webp", SORTIE / f"{cle_n}-{res}-n.webp"
        ecrire_webp(cr, fc, False)
        if cle_n == m['cle']:
            ecrire_webp(n8, fn, True)
        else:
            (SORTIE / f"{m['cle']}-{res}-n.webp").unlink(missing_ok=True)
        # octets_n : 0 si la normale est celle d'une autre clé (comptée une fois dans les poids)
        fichiers[str(res)] = {'cr': fc.name, 'n': fn.name, 'octets_cr': fc.stat().st_size,
                              'octets_n': fn.stat().st_size if cle_n == m['cle'] else 0}
    return fichiers


def relire(fc, fn=None):
    a = np.asarray(Image.open(fc).convert('RGBA'), dtype=np.float32) / 255
    out = {'lin': s2l(a[..., :3]), 'rou': a[..., 3]}
    if fn:
        out['nor'] = np.asarray(Image.open(fn).convert('RGB'), dtype=np.float32) / 255 * 2 - 1
    return out


# ---------------------------------------------------------------------------------------------------------------------------------
# hybride (aperçu hors moteur) et planches
def decalages(cle, n, S):
    r = np.random.default_rng(zlib.crc32(cle.encode()))
    return r.uniform(0, S[0], n), r.uniform(0, S[1], n)


def echantillon(img, S, u, v):
    h, w = img.shape[:2]
    ix = (np.mod(u / S[0], 1) * w).astype(int) % w
    iy = (np.mod(v / S[1], 1) * h).astype(int) % h
    return img[iy, ix]


def rendu(m, pm, F, S, xm, ym):
    """trois vues d'une même fenêtre : procédural actuel, remplissage seul, hybride simulé (pose et teintes procédurales, grain,
       rugosité et relief du scan ; normale procédurale gardée dans les joints et les chanfreins)"""
    W, H, rep = pm['W'], pm['H'], pm['rep']
    ix = (np.mod(xm / rep[0], 1) * W).astype(int) % W
    iy = (np.mod(ym / rep[1], 1) * H).astype(int) % H
    pc, pn = pm['col'][iy, ix], pm['nor'][iy, ix].copy()
    pn[..., :2] *= m['ns']
    pn /= np.linalg.norm(pn, axis=-1, keepdims=True)
    fc, fn = echantillon(F['lin'], S, xm, ym), echantillon(F['nor'], S, xm, ym)
    g = geom(pm, xm, ym)
    nreg = int(g['reg'].max()) + 1
    du, dv = decalages(m['cle'], nreg, S)
    hc = echantillon(F['lin'], S, g['lu'] + du[g['reg']], g['lv'] + dv[g['reg']]) * g['tone'][..., None]
    hn = echantillon(F['nor'], S, g['lu'] + du[g['reg']], g['lv'] + dv[g['reg']])
    s = g['surf'][..., None]
    hyb_c = np.where(s, hc, pc)
    hyb_n = np.where(s & ~g['bev'][..., None], hn, pn)
    return [(pc, pn), (fc, fn), (hyb_c, hyb_n)]


def eclaire(c, n):
    L = np.array([-0.55, 0.55, 0.62], dtype=np.float32)
    L /= np.linalg.norm(L)
    k = (0.25 + 0.75 * np.clip(n @ L, 0, 1)) / (0.25 + 0.75 * L[2])
    return c * k[..., None]


def vers8(lin, px):
    im = Image.fromarray((l2s(lin) * 255 + 0.5).astype(np.uint8))
    return im.resize((px, px), Image.LANCZOS) if im.size[0] != px else im


def fenetre(Wm, ppm, px):
    n = int(min(2560, max(px, math.ceil(Wm * ppm))))
    t = (np.arange(n) + 0.5) / n * Wm
    return np.meshgrid(t, t)


def planche(m, pm, F, S, info, dossier, px=520):
    pp = max(pm['W'] / pm['rep'][0], F['lin'].shape[1] / S[0])
    try:  # police avec accents (macOS), sinon celle de Pillow
        font, petit = (ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', z) for z in (20, 15))
    except OSError:
        font, petit = ImageFont.load_default(size=20), ImageFont.load_default(size=15)
    marge, titre, leg = 12, 74, 26
    im = Image.new('RGB', (3 * px + 4 * marge, titre + 2 * (px + leg) + 3 * marge), (246, 246, 244))
    d = ImageDraw.Draw(im)
    d.text((marge, 8), f"{m['cle']}  ·  source {m['source']} ({info['fournisseur']}, CC0)  ·  échantillon {S[0]:g} × {S[1]:g} m",
           fill=(20, 20, 20), font=font)
    d.text((marge, 36), f"ΔE2000 (albédo moyen, 2048) {info['dE']['2048']:.2f}  ·  pose gardée : {m['pose']}  ·  "
                        f"relief : normale procédurale ×{m['ns']:g} (actuel), normale du scan ×1", fill=(60, 60, 60), font=petit)
    noms = ['actuel (procédural)', 'remplissage (scan étalonné)', 'hybride simulé (pose gardée)']
    for r, (Wm, lit) in enumerate([(m['fenetre'], False), (m['zoom'], True)]):
        xm, ym = fenetre(Wm, pp, px)
        vues = rendu(m, pm, F, S, xm, ym)
        y0 = titre + r * (px + leg + marge)
        for c, (col, nor) in enumerate(vues):
            x0 = marge + c * (px + marge)
            im.paste(vers8(eclaire(col, nor) if lit else col, px), (x0, y0 + leg))
            d.text((x0, y0 + 3), f"{noms[c]} · {Wm:g} × {Wm:g} m" + (' · éclairé rasant' if lit else ' · albédo'),
                   fill=(40, 40, 40), font=petit)
    dest = Path(dossier) / f"{m['cle']}.png"
    im.save(dest, optimize=True)
    return dest


# ---------------------------------------------------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--empreintes', action='store_true', help='métadonnées et empreintes des sources → SOURCES.json')
    ap.add_argument('--cles', default='', help='sous-ensemble de clés (oak,gres,…)')
    ap.add_argument('--planches', default='', help='dossier des planches de contrôle PNG')
    a = ap.parse_args()
    mats = [m for m in MATIERES if not a.cles or m['cle'] in a.cles.split(',')]
    sids = sorted({m['source'] for m in mats})
    CACHE.mkdir(parents=True, exist_ok=True)
    SORTIE.mkdir(parents=True, exist_ok=True)
    t = {'debut': time.time()}

    doc = preparer_sources(a.empreintes, sids)
    t['sources'] = time.time()
    P = procedurales(sorted({m['proc'] for m in mats}))
    t['procedural'] = time.time()
    if a.planches:
        Path(a.planches).mkdir(parents=True, exist_ok=True)

    index = json.loads(INDEX_JSON.read_text()) if INDEX_JSON.exists() else {}
    index.update({
        'note': ("Matières hybrides de l'ultra réaliste (L4-13, E1), produites par outils/matieres_pbr.py. Remplissage de la pose "
                 "procédurale de moteur/matieres.js : le moteur garde lames, joints, formats et teintes par élément, et prend grain, "
                 "rugosité et relief de ces fichiers. Sources et empreintes : SOURCES.json."),
        'format': {'cr': ("WebP avec perte (qualité 90, -sharp_yuv) : RGB = albédo sRGB, alpha = rugosité linéaire (alpha sans perte, "
                          "rugosité lissée d'1 px à 2048 et quantifiée sur 64 niveaux)"),
                   'n': ("WebP sans perte : normale tangente, convention OpenGL (Y vers le haut, comme three.js) ; une seule par source "
                         "(beton reprend celle de loggia, facade celle d'ext)"),
                   'albedo': "variations lentes retirées (flou périodique de 10 % de l'échantillon), puis étalonné sur la cible",
                   'mipmaps': 'générées par le GPU'},
        'cible': ("moyenne linéaire de la texture procédurale actuelle (q = 1) sur ses surfaces (joints, coulis, fenêtres exclus), "
                  "teinte de lame ou de carreau retirée ; sans la teinte du matériau (makeMaterials), qui reste"),
        'parametres_moteur': {'loggia_carreau_m': LG, 'hauteur_etage_m': LEVEL},
        'non_couvertes': NON_COUVERTES,
    })
    index.setdefault('matieres', {})
    durees = {}
    for m in mats:
        t0 = time.time()
        sid, src = m['source'], doc['sources'][m['source']]
        S = src['dimensions_m']
        lin, nor, rou = charger_source(sid, doc)
        lin, nor, rou, score, fondu = raccord(lin, nor, rou)
        lin = aplatir(lin)
        pm = P[m['proc']]
        c = cible(pm)
        lin2, rou2, k, kr = etalonner(lin, rou, c['lin'].astype(np.float32), c['rou'])
        fichiers = produire(m, lin2, nor, rou2)
        dE, mes = {}, {}
        for res in RES:
            f = fichiers[str(res)]
            r = relire(SORTIE / f['cr'])
            mes[str(res)] = r['lin'].reshape(-1, 3).mean(0)
            dE[str(res)] = round(de2000(c['lin'], mes[str(res)]), 2)
            f['rugosite_mesuree'] = round(float(r['rou'].mean()), 3)
        # hybride sur la grille de la texture procédurale : albédo moyen d'ensemble (joints compris) contre l'actuel
        F = relire(SORTIE / fichiers['2048']['cr'], SORTIE / fichiers['2048']['n'])
        g = grille_proc(pm)
        nreg = int(g['reg'].max()) + 1
        du, dv = decalages(m['cle'], nreg, S)
        hc = echantillon(F['lin'], S, g['lu'] + du[g['reg']], g['lv'] + dv[g['reg']]) * g['tone'][..., None]
        hyb = np.where(g['surf'][..., None], hc, pm['col']).reshape(-1, 3).mean(0)
        info = {
            'source': sid, 'fournisseur': src['fournisseur'], 'licence': src['licence'], 'page': src['page'],
            'materiaux_moteur': m['moteur'], 'pose_gardee': m['pose'], 'repetition_m': S,
            'repetition_note': src.get('dimensions_note'), 'fichiers': fichiers,
            'raccord': {'score_bord': score, 'traitement': 'fondu demi-période' if fondu else "d'origine (raccordable)"},
            'albedo_cible_srgb': srgb8(c['lin']), 'albedo_mesure_srgb': srgb8(mes['2048']),
            'albedo_mesure_srgb_par_res': {k2: srgb8(v) for k2, v in mes.items()}, 'dE': dE,
            'dE_hybride_ensemble': round(de2000(c['lin_tout'], hyb), 2),
            'albedo_final_srgb': {k2: srgb8(mes['2048'] * hexlin(h)) for k2, h in m['moteur'].items()},
            'rugosite_cible': round(c['rou'], 3), 'contraste_albedo': k, 'contraste_rugosite': kr,
            'ecart_lum_proc': round(c['ecart_lum'], 4),
            'ecart_lum_scan': round(float((lin2 @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)).std()), 4),
        }
        index['matieres'][m['cle']] = info
        if a.planches:
            info2 = dict(info)
            p = planche(m, pm, F, S, info2, a.planches)
            print(f'  planche {p}', flush=True)
        durees[m['cle']] = round(time.time() - t0, 1)
        print(f"{m['cle']:7s} {sid:22s} ΔE {dE['2048']:.2f}/{dE['1024']:.2f}/{dE['512']:.2f}  hybride {info['dE_hybride_ensemble']:.2f}  "
              f"k {k}  raccord {score}{' (fondu)' if fondu else ''}  "
              f"{sum(f['octets_cr'] + f['octets_n'] for f in fichiers.values()) / 1e6:.2f} Mo  {durees[m['cle']]} s", flush=True)

    poids = {str(r): sum(v['fichiers'][str(r)]['octets_cr'] + v['fichiers'][str(r)]['octets_n'] for v in index['matieres'].values())
             for r in RES}
    index['poids_octets'] = poids
    index['matieres'] = dict(sorted(index['matieres'].items()))
    INDEX_JSON.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n')
    if a.planches:
        ims = [Image.open(Path(a.planches) / f"{m['cle']}.png") for m in mats]
        w = max(i.size[0] for i in ims) // 2
        hs = [i.size[1] * w // i.size[0] for i in ims]
        tout = Image.new('RGB', (w * 2, sum(hs[k] for k in range(0, len(ims), 2)) + 400), (246, 246, 244))
        y = 0
        for k in range(0, len(ims), 2):
            for j in range(2):
                if k + j < len(ims):
                    tout.paste(ims[k + j].resize((w, hs[k + j]), Image.LANCZOS), (j * w, y))
            y += hs[k]
        tout.crop((0, 0, w * 2, y)).save(Path(a.planches) / 'toutes.png', optimize=True)
    t['fin'] = time.time()
    print(f"poids : " + ', '.join(f"{r} : {poids[str(r)] / 1e6:.2f} Mo" for r in RES))
    print(f"durées : sources {t['sources'] - t['debut']:.1f} s, procédural (Node) {t['procedural'] - t['sources']:.1f} s, "
          f"matières {sum(durees.values()):.1f} s ({durees}), total {t['fin'] - t['debut']:.1f} s")


if __name__ == '__main__':
    sys.exit(main())
