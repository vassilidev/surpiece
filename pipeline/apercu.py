"""Images de relecture : la lecture dessinée en couleur sur le plan du promoteur, équipements dans leur vraie forme
(réservoir et cuvette du WC, face avant de la vasque), portes avec leur arc d'ouverture ; et un zoom par pièce,
plan d'origine à gauche, lecture à droite, pour que la relecture compare à l'échelle où les symboles se lisent."""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

VERT, ORANGE, MAGENTA = (0, 150, 60, 235), (230, 110, 0, 255), (215, 0, 175, 255)


def _police(taille):
    for f in ('/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, taille)
        except OSError:
            pass
    return ImageFont.load_default()


def _quad(w):
    if 'poly' in w:
        return w['poly']
    dx, dz = w['b'][0] - w['a'][0], w['b'][1] - w['a'][1]; L = math.hypot(dx, dz) or 1
    s = w.get('side', 1); T = (-dz / L * s, dx / L * s); a, b, t = w['a'], w['b'], w['t']
    return [a, b, [b[0] + T[0] * t, b[1] + T[1] * t], [a[0] + T[0] * t, a[1] + T[1] * t]]


def _repere(o, W):
    """(p0, u, T, largeur, épaisseur) d'une ouverture décrite par deux points ou par un mur"""
    if o.get('p'):
        p0, p1 = o['p']; sd = o.get('side', 1); t = o.get('depth', 0.2); s0, s1 = 0.0, None
    else:
        w = W.get(o.get('wall'))
        if not w or 'a' not in w:
            return None
        p0, p1, sd, t = w['a'], w['b'], w.get('side', 1), w['t']; s0, s1 = o['s']
    dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz) or 1
    u = (dx / L, dz / L); T = (-u[1] * sd, u[0] * sd)
    if s1 is None:
        s1 = L
    return (p0[0] + u[0] * s0, p0[1] + u[1] * s0), u, T, s1 - s0, t


def dessine(folder, P, extract=None, calib=None, nom='relecture.png'):
    folder = Path(folder)
    im = Image.open(folder / 'plan-src.png').convert('RGB')
    src = extract['image'] if extract else calib
    k = src['px_par_m']; ox, oy = src['origine_px']
    P2 = lambda p: (ox + p[0] * k, oy + p[1] * k)
    base = Image.new('RGBA', im.size, (255, 255, 255, 0)); d = ImageDraw.Draw(base)
    font = _police(max(13, int(k * 0.15)))
    lw = max(2, int(k * 0.022))
    for w in P['walls']:
        if w.get('virtual'):
            continue
        d.polygon([P2(p) for p in _quad(w)], fill=(30, 90, 255, 70) if w.get('k') != 'cloison' else (0, 170, 255, 70))
    for g in P.get('gaines', []):
        d.polygon([P2(p) for p in g['poly']], fill=(120, 120, 120, 110), outline=(80, 80, 80, 255))
    for r in P['rooms']:
        if r.get('of'):
            continue
        d.line([P2(p) for p in r['poly']] + [P2(r['poly'][0])], fill=VERT, width=lw)
        c = r.get('label') or [sum(p[0] for p in r['poly']) / len(r['poly']), sum(p[1] for p in r['poly']) / len(r['poly'])]
        c = P2(c); d.text((c[0], c[1] + k * 0.35), f"[{r['id']}] {r.get('name', '')}", fill=(0, 120, 45, 255), font=font, anchor='mm')
    W = {w['id']: w for w in P['walls']}
    for oid, o in P['openings'].items():
        _ouverture(d, oid, o, W, P2, lw, font)
    for i, fx in enumerate(P.get('fixtures', [])):
        try:
            _equipement(d, fx, P2, lw, font, i)
        except (KeyError, TypeError, IndexError, ValueError):
            continue
    out = Image.alpha_composite(im.convert('RGBA'), base).convert('RGB')
    out.save(folder / nom)
    return folder / nom


def _ouverture(d, oid, o, W, P2, lw, font, coul=ORANGE):
    f = _repere(o, W)
    if not f:
        return
    (x0, z0), u, T, L, t = f
    at = lambda s, dd: (x0 + u[0] * s + T[0] * dd, z0 + u[1] * s + T[1] * dd)
    d.polygon([P2(at(0, 0)), P2(at(L, 0)), P2(at(L, t)), P2(at(0, t))], fill=coul[:3] + (90,), outline=coul)
    if o.get('kind') in ('door', 'entry'):
        # vantail ouvert et arc, comme sur un plan d'architecte : pivot sur la charnière, du côté où il s'ouvre
        sw = o.get('swing', 1); hs = 0 if o.get('hinge', 's0') == 's0' else L
        face = t if sw > 0 else 0
        h = at(hs, face); dirf = (T[0] * sw, T[1] * sw); ferme = (u[0] if hs == 0 else -u[0], u[1] if hs == 0 else -u[1])
        d.line([P2(h), P2((h[0] + dirf[0] * L, h[1] + dirf[1] * L))], fill=coul, width=lw)
        c_ = P2(h); rr = lw * 3  # la charnière, bien visible
        d.ellipse([c_[0] - rr, c_[1] - rr, c_[0] + rr, c_[1] + rr], fill=coul)
        pts = []
        for i in range(17):
            a = i / 16 * math.pi / 2
            v = (ferme[0] * math.cos(a) + dirf[0] * math.sin(a), ferme[1] * math.cos(a) + dirf[1] * math.sin(a))
            pts.append(P2((h[0] + v[0] * L, h[1] + v[1] * L)))
        d.line(pts, fill=coul, width=max(1, lw // 2))
    c = P2(at(L / 2, t / 2)); d.text(c, oid, fill=coul, font=font, anchor='mm')


def emprise(item, W=None):
    """rectangle englobant [x0, z0, x1, z1] d'un équipement ou d'une ouverture (en mètres)"""
    if 'type' in item:
        if item.get('x'):
            return [min(item['x']), min(item['z']), max(item['x']), max(item['z'])]
        (x, z) = item['p']; return [x - 0.5, z - 0.5, x + 0.5, z + 0.5]
    f = _repere(item, W or {})
    (x0, z0), u, T, L, t = f
    pts = [(x0 + u[0] * s + T[0] * dd, z0 + u[1] * s + T[1] * dd) for s in (0, L) for dd in (-L, 0, t, t + L)]
    return [min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)]


def duel(folder, extract, calib, nom, avant, apres, W=None, marge=0.7, cote=560, sortie='duel.png'):
    """trois vignettes au même cadrage : plan d'origine | proposition A (avant) | proposition B (après) ;
    avant ou apres peut être None (élément absent de la proposition)"""
    folder = Path(folder)
    src = extract['image'] if extract else calib
    k = src['px_par_m']; ox, oy = src['origine_px']
    P2 = lambda p: (ox + p[0] * k, oy + p[1] * k)
    bb = [e for e in (emprise(x, W) for x in (avant, apres) if x) if e]
    x0, z0 = min(b[0] for b in bb) - marge, min(b[1] for b in bb) - marge
    x1, z1 = max(b[2] for b in bb) + marge, max(b[3] for b in bb) + marge
    orig = Image.open(folder / 'plan-src.png').convert('RGB')
    box = (max(0, int(P2((x0, z0))[0])), max(0, int(P2((x0, z0))[1])), min(orig.width, int(P2((x1, z1))[0])), min(orig.height, int(P2((x1, z1))[1])))
    font = _police(max(13, int(k * 0.15))); lw = max(2, int(k * 0.022))
    vues = [orig.crop(box)]
    for item in (avant, apres):
        base = Image.new('RGBA', orig.size, (255, 255, 255, 0)); d = ImageDraw.Draw(base)
        if item is not None:
            if 'type' in item:
                _equipement(d, item, P2, lw, font, 0)
            else:
                _ouverture(d, nom, item, W or {}, P2, lw, font, coul=MAGENTA)
        vues.append(Image.alpha_composite(orig.convert('RGBA'), base).convert('RGB').crop(box))
    f = cote / max(vues[0].width, vues[0].height)
    vues = [v.resize((max(1, int(v.width * f)), max(1, int(v.height * f))), Image.LANCZOS) for v in vues]
    w, h = vues[0].size
    comp = Image.new('RGB', (w * 3 + 40, h + 40), 'white'); dd = ImageDraw.Draw(comp); ft = _police(20)
    for i, (v, t) in enumerate(zip(vues, ("Plan d'origine", 'A', 'B'))):
        comp.paste(v, (i * (w + 20), 40)); dd.text((i * (w + 20) + 6, 8), t + ('' if i == 0 or (avant if i == 1 else apres) else ' (absent)'), fill=(0, 0, 0), font=ft)
    comp.save(folder / sortie)
    return folder / sortie


def _equipement(d, f, P2, lw, font, i):
    t = f['type']
    lab = f'{i}:{t}'
    if t == 'wc':
        (bx, bz), (dx, dz) = f['p'], f['dir']; n = math.hypot(dx, dz) or 1; dx, dz = dx / n, dz / n; sx, sz = -dz, dx
        at = lambda a, b: P2((bx + dx * a + sx * b, bz + dz * a + sz * b))
        d.polygon([at(0, -0.21), at(0.18, -0.21), at(0.18, 0.21), at(0, 0.21)], outline=MAGENTA, width=lw)  # réservoir, contre le mur
        d.line([at(0.18 + 0.25 * (1 + math.cos(a)), 0.18 * math.sin(a)) for a in [j / 24 * 2 * math.pi for j in range(25)]], fill=MAGENTA, width=lw)
        d.text(at(0.43, 0), lab, fill=MAGENTA, font=font, anchor='mm')
        return
    x0, x1 = sorted(f['x']); z0, z1 = sorted(f['z'])
    d.rectangle([P2((x0, z0)), P2((x1, z1))], outline=MAGENTA, width=lw)
    if t in ('vanity', 'towel') and f.get('dir'):
        dx, dz = f['dir']
        # face avant (côté pièce) en trait épais
        if abs(dx) > abs(dz):
            xa = x1 if dx > 0 else x0; d.line([P2((xa, z0)), P2((xa, z1))], fill=MAGENTA, width=lw * 3)
        else:
            za = z1 if dz > 0 else z0; d.line([P2((x0, za)), P2((x1, za))], fill=MAGENTA, width=lw * 3)
    if t == 'shower' and f.get('drain'):
        c = P2(f['drain']); d.ellipse([c[0] - lw * 2, c[1] - lw * 2, c[0] + lw * 2, c[1] + lw * 2], outline=MAGENTA, width=lw)
    if t == 'placard':  # façade (côté des portes) en trait épais
        fc = f.get('face', 's')
        seg = {'s': ((x0, z1), (x1, z1)), 'n': ((x0, z0), (x1, z0)), 'e': ((x1, z0), (x1, z1)), 'w': ((x0, z0), (x0, z1))}.get(fc)
        if seg:
            d.line([P2(seg[0]), P2(seg[1])], fill=MAGENTA, width=lw * 3)
    d.text(P2(((x0 + x1) / 2, (z0 + z1) / 2)), lab, fill=MAGENTA, font=font, anchor='mm')


def zooms(folder, P, extract=None, calib=None, image='relecture.png', cote=760, marge=0.55):
    """un zoom par pièce (hors placards et seuils) : plan d'origine | lecture, côte à côte ; renvoie [(id, chemin)]"""
    folder = Path(folder)
    src = extract['image'] if extract else calib
    k = src['px_par_m']; ox, oy = src['origine_px']
    orig = Image.open(folder / 'plan-src.png').convert('RGB'); lu = Image.open(folder / image).convert('RGB')
    font = _police(22); out = []
    for r in P['rooms']:
        if r.get('of') or r.get('hidden') or len(r.get('poly', [])) < 3:
            continue
        xs = [p[0] for p in r['poly']]; zs = [p[1] for p in r['poly']]
        box = (int(ox + (min(xs) - marge) * k), int(oy + (min(zs) - marge) * k), int(ox + (max(xs) + marge) * k), int(oy + (max(zs) + marge) * k))
        box = (max(0, box[0]), max(0, box[1]), min(orig.width, box[2]), min(orig.height, box[3]))
        if box[2] - box[0] < 20 or box[3] - box[1] < 20:
            continue
        a, b = orig.crop(box), lu.crop(box)
        f = cote / max(a.width, a.height)
        a = a.resize((max(1, int(a.width * f)), max(1, int(a.height * f))), Image.LANCZOS); b = b.resize(a.size, Image.LANCZOS)
        comp = Image.new('RGB', (a.width * 2 + 24, a.height + 40), 'white')
        comp.paste(a, (0, 40)); comp.paste(b, (a.width + 24, 40))
        dd = ImageDraw.Draw(comp)
        dd.text((6, 8), f"{r.get('name', r['id'])} : plan d'origine", fill=(0, 0, 0), font=font)
        dd.text((a.width + 30, 8), f"[{r['id']}] lecture", fill=(0, 120, 45), font=font)
        p = folder / f"zoom-{r['id']}.png"; comp.save(p); out.append((r['id'], p))
    return out
