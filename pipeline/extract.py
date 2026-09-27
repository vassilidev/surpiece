"""Extraction sans IA d'un plan de vente PDF vectoriel.

Lit les tracés et les textes, trouve l'échelle en rapprochant chaque cote de sa ligne de cote,
convertit tout en mètres (x vers la droite, z vers le bas) et écrit :
  extract.json  : murs noirs, remplissages blancs et gris, arcs, traits, pointillés, hachures, textes, cotes
  plan-src.png  : image du plan pour la lecture par l'IA
  plan-<id>.png : calque transparent pour le plan 2D
"""
import json, math, re, statistics, sys
from pathlib import Path
import pymupdf
from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union, split
from shapely.strtree import STRtree


def shoelace(p):
    return sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p))) / 2

NUM = re.compile(r'^\d{1,4}([.,]\d{1,3})?$')


def luminance(c):
    return sum(c) / 3 if c else None


def color_kind(c):
    """noir jusqu'à 0,3 de luminance : le noir CMJN (0 0 0 1 k) ressort en RVB vers 0,13, et des murs sont parfois gris très foncé"""
    if not c:
        return None
    v = sum(c) / 3
    if max(c) - min(c) > 0.15:
        return 'color'
    return 'black' if v < 0.3 else 'white' if v > 0.92 else 'grey'


def bezier(q, t):
    s = 1 - t
    return (s ** 3 * q[0][0] + 3 * s * s * t * q[1][0] + 3 * s * t * t * q[2][0] + t ** 3 * q[3][0],
            s ** 3 * q[0][1] + 3 * s * s * t * q[1][1] + 3 * s * t * t * q[2][1] + t ** 3 * q[3][1])


def subpaths(g):
    """sous-chemins d'un tracé : un nouveau à chaque saut de point ou quand le contour revient à son départ ; chaque 're' et 'qu' à part.
    Les aplats « SOLID » des logiciels de DAO sont des suites de triangles : les mettre bout à bout donnait un polygone en zigzag."""
    subs, cur = [], []
    near = lambda p, q: abs(p[0] - q[0]) < 1e-3 and abs(p[1] - q[1]) < 1e-3
    def close():
        if len(cur) >= 3:
            subs.append(list(cur))
        cur.clear()
    for it in g['items']:
        if it[0] in ('re', 'qu'):
            close(); r = it[1]
            subs.append([(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)] if it[0] == 're' else [(r.ul.x, r.ul.y), (r.ur.x, r.ur.y), (r.lr.x, r.lr.y), (r.ll.x, r.ll.y)])
            continue
        a, b = (it[1].x, it[1].y), (it[-1].x, it[-1].y)
        if cur and not near(cur[-1], a):
            close()
        if not cur:
            cur.append(a)
        if it[0] == 'c':
            q = [(p.x, p.y) for p in it[1:5]]; cur += [bezier(q, t) for t in (0.25, 0.5, 0.75)]
        cur.append(b)
        if len(cur) > 3 and near(cur[-1], cur[0]):
            cur.pop(); close()
    close()
    return subs


def pieces(geo):
    if geo.is_empty:
        return []
    if isinstance(geo, Polygon):
        return [geo]
    return [q for g in getattr(geo, 'geoms', []) for q in pieces(g)]


def sans_trous(P, n=0):
    """un polygone troué (anneau pair-impair, voile autour d'un conduit) devient des polygones simples : on le coupe à travers chaque trou"""
    if not P.interiors or n > 8:
        return [P]
    c = Polygon(P.interiors[0]).representative_point(); x0, y0, x1, y1 = P.bounds
    return [q for r in pieces(split(P, LineString([(c.x, y0 - 1), (c.x, y1 + 1)]))) for q in sans_trous(r, n + 1)]


def fill_polys(g):
    """contours d'un remplissage : sous-chemins réunis (règle non nulle) ou en différence symétrique (pair-impair), un polygone simple par morceau"""
    subs = [(s, shoelace(s)) for s in subpaths(g)]
    ps = [(p, a) for p, a in ((Polygon(s).buffer(0), a) for s, a in subs) if not p.is_empty]
    if not ps:
        return []
    if g.get('even_odd') and len(ps) > 1:
        geo = ps[0][0]
        for p, _ in ps[1:]:
            geo = geo.symmetric_difference(p)
    else:  # règle non nulle : un contour tourné dans l'autre sens et contenu dans les autres est un trou ; sinon on réunit (triangles voisins)
        sg = max(ps, key=lambda q: abs(q[1]))[1] > 0
        geo = unary_union([p for p, a in ps if (a > 0) == sg])
        for p, a in ps:
            if (a > 0) != sg:
                geo = geo.difference(p) if geo.intersection(p).area >= 0.9 * p.area else geo.union(p)
    out = []
    for P in pieces(geo.simplify(0.02)):
        for Q in (q for r in (pieces(P.buffer(0)) if not P.is_valid else [P]) for q in sans_trous(r)):
            if Q.area > 1e-4:
                out.append([(x, y) for x, y in Q.exterior.coords[:-1]])
    return out


def parse_dim(t):
    """valeur d'une cote en mètres : « 412 » (cm), « 4,12 » ou « 4.12 » (m)"""
    if not NUM.match(t):
        return None
    if ',' in t or '.' in t:
        v = float(t.replace(',', '.'))
        return v if 0.3 <= v <= 25 else None
    v = int(t)
    return v / 100 if 30 <= v <= 2500 else None


def seg_dist(px, py, a, b):
    ex, ey = b[0] - a[0], b[1] - a[1]; l2 = ex * ex + ey * ey or 1e-9
    t = max(0, min(1, ((px - a[0]) * ex + (py - a[1]) * ey) / l2))
    return math.hypot(px - a[0] - t * ex, py - a[1] - t * ey)


def choisir_page(doc):
    """page du plan : la plus riche en tracés s'il y a une page vectorielle, sinon celle qu'une image couvre le plus (même règle que serveur.py)"""
    def score(p):
        try:
            n = len(p.get_drawings()); a = p.rect.width * p.rect.height or 1
            return (n >= 50, n if n >= 50 else sum(abs((b[2] - b[0]) * (b[3] - b[1])) for b in (i['bbox'] for i in p.get_image_info())) / a)
        except Exception:
            return (False, -1)
    return 0 if len(doc) == 1 else max(range(len(doc)), key=lambda i: score(doc[i]))


def mots_visibles(page, words):
    """écarte les mots invisibles au rendu : cotes et libellés des lots voisins masqués par un aplat blanc, texte caché.
    Un mot est gardé si au moins 1 % des pixels de son cadre sont encrés."""
    import numpy as np
    z = min(2.0, 4000 / max(page.rect.width, page.rect.height, 1))
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), colorspace=pymupdf.csGRAY, alpha=False)
    img = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width)
    out = []
    for w in words:
        x0, y0, x1, y1 = (max(0, int(round(v * z))) for v in w[:4])
        crop = img[y0:max(y0 + 1, y1), x0:max(x0 + 1, x1)]
        if crop.size == 0 or (crop < 230).mean() >= 0.01:
            out.append(w)
    return out


def raster_polys(page, zoom=3.0, min_pt=2.5):
    """plan en image : les aplats noirs (murs) deviennent des polygones, en points de page ; le texte et les traits fins disparaissent"""
    import numpy as np, cv2
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    img = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3]
    mx = img.max(axis=2).astype(np.int16); mn = img.min(axis=2).astype(np.int16)
    mask = ((mx < 110) & (mx - mn < 40)).astype(np.uint8) * 255  # noir ou gris foncé, pas les couleurs
    k = max(3, int(round(min_pt * zoom)))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)))
    cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for i, c in enumerate(cnts):
        if hier is not None and hier[0][i][3] != -1:
            continue  # trou intérieur : on garde les contours extérieurs
        if cv2.contourArea(c) < 30 * zoom * zoom:  # lettres et petits symboles
            continue
        a = cv2.approxPolyDP(c, 1.2, True).reshape(-1, 2)
        if len(a) >= 3:
            out.append([(float(x) / zoom, float(y) / zoom) for x, y in a])
    return out


def cercle(pts):
    """cercle ajusté aux moindres carrés : (centre, rayon, écart moyen)"""
    import numpy as np
    P = np.asarray(pts, float); A = np.c_[P, np.ones(len(P))]; b = -(P ** 2).sum(1)
    D, E, F = np.linalg.lstsq(A, b, rcond=None)[0]
    cx, cy = float(-D / 2), float(-E / 2); r2 = cx * cx + cy * cy - float(F)
    if r2 <= 0:
        return None
    r = math.sqrt(r2)
    return (cx, cy), r, float(np.abs(np.hypot(P[:, 0] - cx, P[:, 1] - cy) - r).mean())


def arc_bezier(q):
    """arc d'une courbe de Bézier (quart de cercle des portes) : centre à la rencontre des normales aux deux extrémités, rayon"""
    a, b, c, d = q
    t1, t2 = (b[0] - a[0], b[1] - a[1]), (d[0] - c[0], d[1] - c[1])
    den = t1[0] * t2[1] - t1[1] * t2[0]
    if abs(den) < 1e-9 * (math.hypot(*t1) * math.hypot(*t2) or 1):
        return None
    # centre = a + s·n1 = d + u·n2, n = normale (−ty, tx)
    n1, n2 = (-t1[1], t1[0]), (-t2[1], t2[0])
    s = ((d[0] - a[0]) * n2[1] - (d[1] - a[1]) * n2[0]) / (n1[0] * n2[1] - n1[1] * n2[0])
    ctr = (a[0] + s * n1[0], a[1] + s * n1[1])
    return ctr, (math.dist(ctr, a) + math.dist(ctr, d)) / 2


def chaines_tirets(units, textes=()):
    """lignes en tirets exportées en petits traits pleins : on enchaîne les tirets bout à bout (intervalle de 0,1 à 2,5 fois leur longueur,
    dans le prolongement l'un de l'autre, sans texte dans l'intervalle : une ligne de cote coupée par ses nombres n'est pas un pointillé),
    puis on garde les chaînes régulières d'au moins 3 tirets. Rend des listes d'indices dans l'ordre."""
    tg = {}
    for x, y in textes:
        tg.setdefault((int(x // 8), int(y // 8)), []).append((x, y))
    def texte_entre(p, q, g):
        mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        return any(math.hypot(x - mx, y - my) < 0.6 * g + 1 for gx in range(int(mx // 8) - 2, int(mx // 8) + 3) for gy in range(int(my // 8) - 2, int(my // 8) + 3) for x, y in tg.get((gx, gy), []))
    ends, grid = [], {}
    for i, u in enumerate(units):
        L = u['L']
        for e, (p, q) in enumerate(((u['pts'][0], u['pts'][1]), (u['pts'][-1], u['pts'][-2]))):
            d = math.dist(p, q) or 1
            ends.append((i, e, p, ((p[0] - q[0]) / d, (p[1] - q[1]) / d)))
            grid.setdefault((int(p[0] // 8), int(p[1] // 8)), []).append(len(ends) - 1)
    pairs = []
    for k, (i, e, p, d) in enumerate(ends):
        Li = units[i]['L']; r = min(16, max(4, 2.5 * Li))
        for gx in range(int((p[0] - r) // 8), int((p[0] + r) // 8) + 1):
            for gy in range(int((p[1] - r) // 8), int((p[1] + r) // 8) + 1):
                for k2 in grid.get((gx, gy), []):
                    j, f, q, dq = ends[k2]
                    if j <= i:
                        continue
                    g = math.dist(p, q); Lj = units[j]['L']
                    if g < 0.1 * min(Li, Lj) or g > min(16, max(4, 2.5 * max(Li, Lj))):
                        continue
                    v = ((q[0] - p[0]) / g, (q[1] - p[1]) / g)
                    c1, c2 = v[0] * d[0] + v[1] * d[1], -(v[0] * dq[0] + v[1] * dq[1])
                    if c1 > 0.87 and c2 > 0.87 and not texte_entre(p, q, g):
                        pairs.append((g / max(Li, Lj) + 2 - c1 - c2, k, k2, g))
    link, used = {}, set()
    for s, k, k2, g in sorted(pairs):
        if k in used or k2 in used:
            continue
        used |= {k, k2}; link[k] = (k2, g); link[k2] = (k, g)
    seen, chains = set(), []
    for i in range(len(units)):
        if i in seen:
            continue
        # remonter jusqu'à un bout de chaîne, puis parcourir
        start, e, n = i, 0, 0
        while (2 * start + e) in link and n < len(units):
            k2, _ = link[2 * start + e]; j, f = ends[k2][0], ends[k2][1]
            if j == i:
                break
            start, e, n = j, 1 - f, n + 1
        chain, gaps, cur, ce = [], [], start, 1 - e
        while cur not in seen:
            seen.add(cur); chain.append((cur, ce == 1))
            nxt = link.get(2 * cur + ce)
            if not nxt:
                break
            j, f = ends[nxt[0]][0], ends[nxt[0]][1]
            gaps.append(nxt[1]); cur, ce = j, 1 - f
        if len(chain) < 3:
            continue
        # un trait bien plus long que les tirets (demi-ligne de cote, contour) coupe la chaîne ; chaque morceau doit rester régulier
        Lm = statistics.median(units[c]['L'] for c, _ in chain); run, rg = [], []
        for k, (c, f) in enumerate(chain + [(None, None)]):
            if c is not None and units[c]['L'] <= 1.6 * Lm:
                run.append((c, f)); rg.append(gaps[k - 1] if len(run) > 1 else None); continue
            gp = [g for g in rg if g is not None]
            if len(run) >= 3:
                gm, lm = statistics.median(gp), statistics.median(units[x]['L'] for x, _ in run)
                if sum(0.5 * gm <= g <= 2 * gm for g in gp) >= 0.7 * len(gp) and sum(0.5 * lm <= units[x]['L'] for x, _ in run) >= 0.7 * len(run):
                    chains.append(run)
            run, rg = [], []
    return chains


def ligne_de_cote(c, u, tw, size, segs):
    """ligne de cote d'un texte : trait parallèle au texte (±3°), à moins d'une hauteur de texte ; quand le texte coupe la ligne,
    les deux moitiés sont réunies. Rend (longueur, début, fin) ou None."""
    n = (-u[1], u[0]); near = []
    for a, b, black in segs:
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy)
        if L < 0.3 or abs(dx * u[1] - dy * u[0]) > 0.052 * L:
            continue
        sg = (1 if dx * u[0] + dy * u[1] > 0 else -1) / L  # décalage mesuré sur la normale du trait : constant le long d'une droite très légèrement penchée
        pa = ((a[0] - c[0]) * -dy + (a[1] - c[1]) * dx) * sg
        if abs(pa) > 0.9 * size + 1:
            continue
        t0, t1 = sorted(((a[0] - c[0]) * u[0] + (a[1] - c[1]) * u[1], (b[0] - c[0]) * u[0] + (b[1] - c[1]) * u[1]))
        if t1 > -150 * size and t0 < 150 * size:
            near.append((pa, t0, t1, black))
    near.sort(); groups, best = [], None
    for s in near:
        if groups and s[0] - groups[-1][-1][0] < 0.1:  # même droite
            groups[-1].append(s)
        else:
            groups.append([s])
    h = tw / 2
    for gr in groups:
        pa = statistics.median(s[0] for s in gr); spans = []
        spans += [(s[1], s[2], s[3]) for s in gr if s[1] <= -h + 0.5 and s[2] >= h - 0.5]  # trait continu sous le texte
        left = [s for s in gr if -h - 1.5 * size <= s[2] <= -0.25 * h]
        right = [s for s in gr if 0.25 * h <= s[1] <= h + 1.5 * size]
        if left and right:  # ligne coupée par le texte
            l, r = max(left, key=lambda s: s[2]), min(right, key=lambda s: s[1])
            if r[1] - l[2] >= 0.5 * tw and l[1] <= -h + 0.5 and r[2] >= h - 0.5:
                spans.append((l[1], r[2], l[3] and r[3]))
        for t0, t1, black in spans:
            sc = abs(t0 + t1) / (t1 - t0) + 0.3 * abs(pa) / size + (0 if black else 0.3)
            if best is None or sc < best[0]:
                best = (sc, t1 - t0, (c[0] + u[0] * t0 + n[0] * pa, c[1] + u[1] * t0 + n[1] * pa), (c[0] + u[0] * t1 + n[0] * pa, c[1] + u[1] * t1 + n[1] * pa))
    return best[1:] if best else None


def echelle_graphique(words, info, segs):
    """échelle graphique : « 0 1 2 3m » ou « 0 0,5 1 1,5 2 » sans unité, nombres croissants alignés à partir de 0.
    Chaque nombre est calé sur la graduation dessinée la plus proche quand on la trouve ; la pente donne les points par mètre."""
    nums = []
    for w in words:
        m_ = re.match(r'^(\d{1,3}(?:[.,]\d{1,2})?)\s?(m)?$', w[4])
        if m_:
            nums.append((float(m_.group(1).replace(',', '.')), w))
    out = []
    for v0, z in nums:
        if v0 != 0:
            continue
        u, size = info(z)[:2]; c0 = ((z[0] + z[2]) / 2, (z[1] + z[3]) / 2); n = (-u[1], u[0])
        seq = []
        for v, w in nums:
            c = ((w[0] + w[2]) / 2, (w[1] + w[3]) / 2); t = (c[0] - c0[0]) * u[0] + (c[1] - c0[1]) * u[1]
            if v > 0 and 0 < t < 60 * size and abs((c[0] - c0[0]) * n[0] + (c[1] - c0[1]) * n[1]) < 0.3 * size:
                seq.append((t, v))
        chain = [(0.0, 0.0)]
        for t, v in sorted(seq):
            if v > chain[-1][1] and t - chain[-1][0] > 0.8 * size:
                chain.append((t, v))
        if len(chain) < 3:
            continue
        # graduations : extrémités des traits de la barre, juste au-dessus ou au-dessous des nombres
        ticks = []
        for a, b, _ in segs:
            for p in (a, b):
                dt = (p[0] - c0[0]) * u[0] + (p[1] - c0[1]) * u[1]; dn = (p[0] - c0[0]) * n[0] + (p[1] - c0[1]) * n[1]
                if abs(dn) < 3 * size and -2 * size < dt < chain[-1][0] + 2 * size:
                    ticks.append(dt)
        step = chain[-1][0] / (len(chain) - 1); snapped = []
        for t, v in chain:
            tk = min(ticks, key=lambda x: abs(x - t), default=None)
            snapped.append((tk if tk is not None and abs(tk - t) < 0.25 * step else None, v))
        pts = [(t, v) for t, v in snapped if t is not None]
        pts = pts if len(pts) >= 0.8 * len(chain) and len(pts) >= 3 else chain
        mv, mt = statistics.mean(v for _, v in pts), statistics.mean(t for t, _ in pts)
        k = sum((v - mv) * (t - mt) for t, v in pts) / sum((v - mv) ** 2 for _, v in pts)
        if k > 0 and max(abs(t - mt - k * (v - mv)) for t, v in pts) < 0.12 * step:
            out.append((k, ' '.join(str(v).rstrip('0').rstrip('.') for _, v in chain)))
    return out


def familles_hachures(segs, K):
    """hachures : au moins 5 traits parallèles (même angle à 1° près), côte à côte, à pas régulier ; un trait isolé n'en est jamais une.
    Les familles parallèles aux axes (escaliers, parquet) doivent être plus serrées. Rend [(indices, angle, pas en m)]."""
    by = {}
    for i, (a, b) in enumerate(segs):
        ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0])) % 180
        by.setdefault(int(round(ang)) % 180, []).append((ang, i))
    done, out = set(), []
    for k0 in sorted(by, key=lambda k: -len(by[k])):
        grp = [(ang, i) for kk in (k0 - 1, k0, k0 + 1) for ang, i in by.get(kk % 180, []) if i not in done and min(abs(ang - k0), 180 - abs(ang - k0)) <= 1]
        if len(grp) < 5:
            continue
        th = math.radians(k0); d = (math.cos(th), math.sin(th)); n = (-d[1], d[0])
        rows = []
        for ang, i in grp:
            a, b = segs[i]; o = ((a[0] + b[0]) / 2 * n[0] + (a[1] + b[1]) / 2 * n[1]) / K
            t0, t1 = sorted(((a[0] * d[0] + a[1] * d[1]) / K, (b[0] * d[0] + b[1] * d[1]) / K))
            rows.append((o, t0, t1, i))
        rows.sort(); parent = list(range(len(rows)))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]; x = parent[x]
            return x
        for x in range(len(rows)):
            for y in range(x + 1, len(rows)):
                if rows[y][0] - rows[x][0] > 0.3:
                    break
                if min(rows[x][2], rows[y][2]) - max(rows[x][1], rows[y][1]) >= 0.3 * min(rows[x][2] - rows[x][1], rows[y][2] - rows[y][1]):
                    parent[find(x)] = find(y); break  # plus proche voisin qui se recouvre vraiment : deux zones qui se touchent par un coin restent séparées
        fam = {}
        for x in range(len(rows)):
            fam.setdefault(find(x), []).append(rows[x])
        axe = min(k0 % 90, 90 - k0 % 90) <= 2
        for f in fam.values():
            offs = sorted({round(r[0], 3) for r in f}); sp = [b - a for a, b in zip(offs, offs[1:]) if b - a > 0.004]
            if len(offs) < (8 if axe else 5) or not sp:
                continue
            p = statistics.median(sp)
            if axe and p > 0.12:
                continue
            if sum(any(abs(s - m * p) <= 0.2 * p for m in (1, 2, 3)) for s in sp) >= 0.75 * len(sp):
                out.append(([r[3] for r in f], k0, p)); done |= {r[3] for r in f}
    return out


def vote_echelle(cands):
    """échelle retenue parmi les indices (points par mètre, méthode, texte) : la valeur sur laquelle le plus d'indices s'accordent (1,5 %).
    Confiance « haute » ou « moyenne » seulement avec une vraie avance : 2 voix de plus que la meilleure autre valeur (écart de plus de 3 %),
    et pas seulement des rayons entre murs. Sinon « faible », et l'utilisateur confirme l'échelle."""
    vals = sorted(c[0] for c in cands)
    votes = lambda r: sum(1 for q in vals if abs(q - r) / r < 0.015)
    best_c, best_n = None, 0
    for r in vals:
        n = votes(r)
        if n > best_n or (n == best_n and best_c and r < best_c):
            best_c, best_n = r, n
    agree = [c for c in cands if abs(c[0] - best_c) / best_c < 0.015]
    K = statistics.median([c[0] for c in agree])
    kinds = sorted({c[1] for c in agree})
    second = max([votes(r) for r in vals if abs(r - best_c) / best_c > 0.03] or [0])
    if best_n - second < 2 or kinds == ['murs']:
        confiance = 'faible'
    else:
        confiance = 'haute' if best_n >= 4 and (len(kinds) >= 2 or 'ligne de cote' in kinds or 'échelle graphique' in kinds) else 'moyenne' if best_n >= 3 else 'faible'
    return K, confiance, f"{best_n} indices concordants sur {len(cands)} ({', '.join(kinds)})" + (f", {second} pour la meilleure autre valeur" if second else '')


def extract(pdf, outdir, pid, K_force=None):
    outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    npage = choisir_page(doc); page = doc[npage]
    if page.rotation:  # /Rotate : tracés, textes et images dans le repère de la page affichée (le fichier n'est pas modifié)
        page.remove_rotation()
    drawings = page.get_drawings()
    tp = page.get_textpage(flags=pymupdf.TEXTFLAGS_WORDS); words = mots_visibles(page, tp.extractWORDS())
    tlines = [(l['bbox'], l['dir'], l['spans'][0]['size'], ''.join(s['text'] for s in l['spans'])) for b in tp.extractDICT()['blocks'] for l in b.get('lines', []) if l['spans']]
    raster = len(drawings) < 50
    if raster and not page.get_images():
        raise SystemExit('PDF vide : ni tracés ni image.')

    def info(w):
        """direction de lecture, taille et longueur d'un mot"""
        cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2  # ligne de texte qui contient le mot (les numéros de bloc diffèrent entre les deux extractions)
        ln = [l for l in tlines if l[0][0] - 0.5 <= cx <= l[0][2] + 0.5 and l[0][1] - 0.5 <= cy <= l[0][3] + 0.5]
        ln = sorted(ln, key=lambda l: w[4] not in l[3])
        u, size = (ln[0][1], ln[0][2]) if ln else ((1.0, 0.0), w[3] - w[1])
        bw, bh = w[2] - w[0], w[3] - w[1]
        tw = (bw - size * abs(u[1])) / abs(u[0]) if abs(u[0]) >= abs(u[1]) else (bh - size * abs(u[0])) / abs(u[1])
        return u, size, max(tw, 0.3 * size)

    # traits et arcs ; les tirets exportés en petits traits pleins sont enchaînés plus bas
    lines, arcs, dashed, units, dimsegs = [], [], [], [], []
    for g in drawings:
        ck = color_kind(g.get('color'))
        if g['type'] not in ('s', 'fs') or ck in (None, 'white'):
            continue
        dash = g.get('dashes') not in (None, '[] 0', '')
        cur = []
        def tiret():  # un tiret = une suite de traits jointifs d'un même tracé (il peut tourner un angle)
            L = sum(math.dist(p, q) for p, q in zip(cur, cur[1:]))
            if ck in ('black', 'grey') and not dash and 0.2 <= L <= 30:
                units.append({'pts': list(cur), 'L': L})
        for it in g['items']:
            if it[0] == 'l':
                a, b = (it[1].x, it[1].y), (it[2].x, it[2].y)
                dimsegs.append((a, b, ck == 'black'))
                if ck in ('black', 'grey'):
                    (dashed if dash else lines).append((a, b))
            elif it[0] == 'c' and ck in ('black', 'grey'):
                arcs.append((tuple((p.x, p.y) for p in it[1:5]), dash))
            if it[0] in ('l', 'c'):
                a, b = (it[1].x, it[1].y), (it[-1].x, it[-1].y)
                if cur and math.dist(cur[-1], a) < 1e-3:
                    if len(cur) < 2 or math.dist(cur[-2], b) > 1e-3:  # un tracé fermé sur un seul trait (a→b→a) reste un trait
                        cur.append(b)
                else:
                    tiret(); cur = [a, b]
            else:
                tiret(); cur = []
        tiret()
    # tirets : chaînes régulières, retirées des traits et des lignes de cote possibles
    chains = chaines_tirets(units, [((w[0] + w[2]) / 2, (w[1] + w[3]) / 2) for w in words])
    in_chain = set()
    for ch in chains:
        for i, _ in ch:
            p = units[i]['pts']
            in_chain |= {(round(a[0], 2), round(a[1], 2), round(b[0], 2), round(b[1], 2)) for a, b in zip(p, p[1:])}
    key = lambda a, b: (round(a[0], 2), round(a[1], 2), round(b[0], 2), round(b[1], 2))
    lines = [l for l in lines if key(*l) not in in_chain]
    dimsegs = [s for s in dimsegs if key(s[0], s[1]) not in in_chain]

    # remplissages (murs noirs, cloisons blanches, gaines grises), un polygone simple par morceau
    polys = []
    for g in drawings:
        k = color_kind(g.get('fill'))
        if g['type'] in ('f', 'fs') and k in ('black', 'white', 'grey'):
            for pts in fill_polys(g):
                xs, ys = [p[0] for p in pts], [p[1] for p in pts]
                polys.append({'k': k, 'v': luminance(g.get('fill')), 'pts': pts, 'bb': (min(xs), min(ys), max(xs), max(ys)), 'area': abs(shoelace(pts))})
    area = lambda k, f=lambda p: True: sum(p['area'] for p in polys if p['k'] == k and f(p))
    if not raster and area('grey', lambda p: p['v'] < 0.55) > 3 * area('black'):  # murs en gris foncé
        for p in polys:
            if p['k'] == 'grey' and p['v'] < 0.55:
                p['k'] = 'black'
    if raster or not any(p['k'] == 'black' for p in polys):  # plan en image, ou murs sans remplissage exploitable : murs vectorisés depuis le rendu
        for pts in raster_polys(page):
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            polys.append({'k': 'black', 'v': 0, 'pts': pts, 'bb': (min(xs), min(ys), max(xs), max(ys)), 'area': abs(shoelace(pts))})
    W, Hh = page.rect.width, page.rect.height
    solid = [p for p in polys if p['k'] == 'black' and (p['bb'][2] - p['bb'][0]) < W * 0.5 and (p['bb'][3] - p['bb'][1]) < Hh * 0.5]
    if not solid:
        raise SystemExit('Aucun mur plein reconnu sur ce plan : les murs doivent être dessinés en noir ou en gris foncé.')

    # échelle : trois indices, on garde la valeur sur laquelle le plus d'indices s'accordent
    cands = []
    dim_words = [(w, parse_dim(w[4])) for w in words]
    dim_words = [(w, v) for w, v in dim_words if v]
    for w, v in dim_words:  # 1. cote posée sur sa ligne de cote
        u, size, tw = info(w)
        dl = ligne_de_cote(((w[0] + w[2]) / 2, (w[1] + w[3]) / 2), u, tw, size, dimsegs)
        if dl:
            cands.append((dl[0] / v, 'ligne de cote', w[4]))
    for k_, t_ in echelle_graphique(words, info, dimsegs):  # 2. échelle graphique, compte double
        cands += [(k_, 'échelle graphique', t_)] * 2
    edges = []
    for p in solid:
        q = p['pts']
        for j in range(len(q)):
            edges.append((q[j], q[(j + 1) % len(q)]))
    def ray(cx, cy, dx, dy):
        best = None
        for a, b in edges:
            ex, ey = b[0] - a[0], b[1] - a[1]; den = dx * ey - dy * ex
            if abs(den) < 1e-9:
                continue
            t = ((a[0] - cx) * ey - (a[1] - cy) * ex) / den; u = ((a[0] - cx) * dy - (a[1] - cy) * dx) / den
            if t > 0.5 and 0 <= u <= 1 and (best is None or t < best):
                best = t
        return best
    for w, v in dim_words:  # 3. distance entre les murs de part et d'autre d'une cote écrite dans la pièce, dans le sens du texte
        cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2; (dx, dy), _, _ = info(w)
        a, b = ray(cx, cy, dx, dy), ray(cx, cy, -dx, -dy)
        if a and b:
            cands.append(((a + b) / v, 'murs', w[4]))
    if K_force:
        cands = [(K_force, 'cote saisie', '')] * 5
    if not cands:
        raise SystemExit('ECHELLE')
    K, confiance, scale_note = vote_echelle(cands)
    if K_force:
        confiance, scale_note = 'saisie', "échelle calée sur la cote saisie par l'utilisateur"

    # symboles : triangles pleins isolés (flèche d'entrée, nord), qui ne touchent les murs que par une pointe
    tree = STRtree([Polygon(p['pts']) for p in solid])
    def symbole(i, p):
        P = Polygon(p['pts']).simplify(0.01 * K)
        q = list(P.exterior.coords)[:-1] if isinstance(P, Polygon) else []
        if len(q) != 3 or not all(0.15 <= math.dist(q[j], q[(j + 1) % 3]) / K <= 1.2 for j in range(3)):
            return False
        oth = [solid[j] for j in tree.query(P.buffer(0.02 * K)) if j != i]
        if not oth:
            return True
        touch = P.exterior.intersection(unary_union([Polygon(o['pts']) for o in oth]).buffer(0.01 * K)).length
        return touch < 0.1 * P.length
    symbols = [p for i, p in enumerate(solid) if symbole(i, p)]
    solid = [p for p in solid if p not in symbols]

    # zone du logement : plus grand amas de remplissages noirs (murs)
    blacks = [p for p in solid if (p['bb'][2] - p['bb'][0]) < 20 * K and (p['bb'][3] - p['bb'][1]) < 20 * K]
    gap = 0.4 * K; parent = list(range(len(blacks)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i, a in enumerate(blacks):
        for j in range(i + 1, len(blacks)):
            b = blacks[j]
            if a['bb'][0] - gap < b['bb'][2] and b['bb'][0] - gap < a['bb'][2] and a['bb'][1] - gap < b['bb'][3] and b['bb'][1] - gap < a['bb'][3]:
                parent[find(i)] = find(j)
    groups = {}
    for i, p in enumerate(blacks):
        g = groups.setdefault(find(i), [0, []]); g[0] += p['area']; g[1].append(p)
    if not groups:
        raise SystemExit('Aucun mur plein reconnu sur ce plan : les murs doivent être dessinés en noir ou en gris foncé.')
    # le plus grand amas, puis les amas voisins de taille comparable (une baie coupe la façade en morceaux) ;
    # les petites icônes proches (nord, flèche d'entrée) restent à l'écart
    gl = sorted(groups.values(), key=lambda g: -g[0]); main = gl[0]
    bb = lambda ps: (min(p['bb'][0] for p in ps), min(p['bb'][1] for p in ps), max(p['bb'][2] for p in ps), max(p['bb'][3] for p in ps))
    walls = list(main[1]); changed = True
    while changed:
        changed = False; B = bb(walls)
        for g in gl[1:]:
            if g[1][0] in walls or g[0] < 0.08 * main[0]:
                continue
            b = bb(g[1]); m2 = 2.5 * K
            if b[0] - m2 < B[2] and B[0] - m2 < b[2] and b[1] - m2 < B[3] and B[1] - m2 < b[3]:
                walls += g[1]; changed = True
    X0 = min(p['bb'][0] for p in walls); Y0 = min(p['bb'][1] for p in walls)
    X1 = max(p['bb'][2] for p in walls); Y1 = max(p['bb'][3] for p in walls)
    M = 1.2 * K
    rx0, ry0, rx1, ry1 = X0 - M, Y0 - M, X1 + M, Y1 + M
    inside = lambda x, y: rx0 <= x <= rx1 and ry0 <= y <= ry1
    m = lambda p: [round((p[0] - X0) / K, 3), round((p[1] - Y0) / K, 3)]

    def keep(p, min_len):
        bb = p['bb']
        return inside((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2) and max(bb[2] - bb[0], bb[3] - bb[1]) / K >= min_len

    # murs noirs : sans les traits épais dessinés en aplat (moins de 1 cm) ni les doublons superposés (même mur sur deux calques)
    murs = [p for p in polys if p['k'] == 'black' and p not in symbols and keep(p, 0.03)]
    murs = [p for p in murs if 2 * p['area'] / (Polygon(p['pts']).length or 1) / K >= 0.01]
    shp = [Polygon(p['pts']) for p in murs]; t2 = STRtree(shp); drop = set()
    for i in sorted(range(len(murs)), key=lambda i: -murs[i]['area']):
        if i in drop:
            continue
        for j in t2.query(shp[i]):
            if j != i and j not in drop and murs[j]['area'] <= murs[i]['area']:
                inter = shp[j].intersection(shp[i]).area  # même mur dessiné deux fois (et pas un morceau de mur couvert par un grand aplat)
                if inter >= 0.95 * murs[j]['area'] and inter >= 0.9 * murs[i]['area']:
                    drop.add(j)
    murs = [p for i, p in enumerate(murs) if i not in drop]

    # traits qui ne font que border un remplissage (contour d'un mur ou d'une cloison) : déjà décrits par le polygone
    edges = []
    for p in polys:
        q = p['pts']
        if not inside((p['bb'][0] + p['bb'][2]) / 2, (p['bb'][1] + p['bb'][3]) / 2):
            continue
        for j in range(len(q)):
            edges.append((q[j], q[(j + 1) % len(q)]))
    grid = {}
    for e in edges:
        for c in {(int(e[0][0] // 20), int(e[0][1] // 20)), (int(e[1][0] // 20), int(e[1][1] // 20))}:
            grid.setdefault(c, []).append(e)
    def outline(a, b):
        tol = 0.012 * K
        cand = grid.get((int(a[0] // 20), int(a[1] // 20)), []) + grid.get((int(b[0] // 20), int(b[1] // 20)), [])
        return any(seg_dist(*a, *e) < tol and seg_dist(*b, *e) < tol for e in cand)

    # hachures : familles de traits parallèles à pas régulier (soffites, gaines, isolant)
    zl = [l for l in lines if inside(*l[0]) and inside(*l[1]) and math.dist(*l) / K >= 0.03]
    hatch_ids, hachures = set(), []
    for ids, ang, pas in familles_hachures(zl, K):
        hatch_ids |= set(ids)
        U = unary_union([LineString([m(zl[i][0]), m(zl[i][1])]).buffer(pas * 0.6, cap_style=2) for i in ids]).simplify(pas * 0.7)  # sans les dents des bouts de traits
        for P in pieces(U):
            if P.area >= 0.05:
                hachures.append({'poly': [[round(x, 2), round(y, 2)] for x, y in P.exterior.coords[:-1]], 'angle': ang, 'pas': round(pas, 3)})

    # arcs : extrémités, centre et rayon (courbes de Bézier, et arcs en tirets)
    arcs_out = []
    for q, dash in arcs:
        a, d = q[0], q[3]
        if not inside(*a) or math.dist(a, d) / K <= 0.12:
            continue
        ab = arc_bezier(q)
        if ab and ab[1] / K < 5:
            arcs_out.append([m(a), m(d), m(ab[0]), round(ab[1] / K, 3)])
        else:
            arcs_out.append([m(a), m(d), m(bezier(q, 0.5)), None])
    pointilles = [[m(a), m(b)] for a, b in dashed if inside(*a) and inside(*b) and math.dist(a, b) / K >= 0.05]
    for ch in chains:
        pts = []
        for i, fwd in ch:
            p = units[i]['pts'] if fwd else units[i]['pts'][::-1]
            pts += p
        if not all(inside(*p) for p in (pts[0], pts[-1])):
            continue
        Lc = LineString(pts)
        if Lc.length / K < 0.12:
            continue
        chord = LineString([pts[0], pts[-1]])
        if max(chord.distance(Point(p)) for p in pts) / K < 0.02:
            pointilles.append([m(pts[0]), m(pts[-1])]); continue
        fit = cercle(pts)  # débattement de porte ou de fenêtre, aire de rotation : rayon de 15 cm à 1,3 m, points bien sur le cercle
        if fit and fit[2] < min(0.03 * fit[1], 0.015 * K) and 0.15 <= fit[1] / K <= 1.3:
            arcs_out.append([m(pts[0]), m(pts[-1]), m(fit[0]), round(fit[1] / K, 3)])
        else:
            pointilles.append([m(p) for p in Lc.simplify(0.02 * K).coords])

    out = {
        'id': pid, 'source': Path(pdf).name, 'page': npage + 1, 'format': 2,  # 2 : un polygone par morceau d'aplat (indices de murs_noirs différents du format 1)
        'echelle': {'pt_par_m': round(K, 4), 'ech': f'1/{round(72 / 0.0254 / K)}', 'controle': scale_note, 'confiance': confiance}, 'raster': raster,
        'repere': 'mètres ; origine au coin haut-gauche des murs ; x vers la droite, z vers le bas',
        'legende': {'arcs': '[extrémité, extrémité, centre, rayon] : débattements de portes et fenêtres, pleins ou en tirets',
                    'pointilles': 'lignes en tirets [[x,z],…] : cuisine indicative, meubles, emprises',
                    'hachures': 'zones hachurées {poly, angle, pas} : soffites et faux plafonds, gaines, isolant',
                    'symboles': "triangles pleins isolés (flèche d'entrée, nord) : ce ne sont pas des murs",
                    'cotes': '[x0,z0,x1,z1,texte] : ligne de cote entière'},
        'emprise_murs': [0, round((X1 - X0) / K, 3), 0, round((Y1 - Y0) / K, 3)],
        'murs_noirs': [[m(q) for q in p['pts']] for p in murs],
        'remplissages_blancs': [[m(q) for q in p['pts']] for p in polys if p['k'] == 'white' and keep(p, 0.15)],
        'remplissages_gris': [[m(q) for q in p['pts']] for p in polys if p['k'] == 'grey' and keep(p, 0.1)],
        'arcs': arcs_out,
        'traits': [[m(a), m(b)] for i, (a, b) in enumerate(zl) if math.dist(a, b) / K >= 0.12 and i not in hatch_ids and not outline(a, b)],
        'hachures': hachures,
        'pointilles': pointilles,
        'symboles': [[m(q) for q in p['pts']] for p in symbols if keep(p, 0.03)],
        'cotes': [],
    }
    # textes : dans la zone en mètres, ailleurs en coordonnées de page (cartouche, tableau des surfaces)
    tz, tp_ = [], []
    for w in words:
        cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
        (tz if inside(cx, cy) else tp_).append([*m((cx, cy)), w[4]] if inside(cx, cy) else [round(cx), round(cy), w[4]])
    out['textes'] = tz; out['textes_hors_plan'] = tp_
    for w, v in dim_words:
        cx, cy = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
        if not inside(cx, cy):
            continue
        u, size, tw = info(w)
        dl = ligne_de_cote((cx, cy), u, tw, size, dimsegs)
        if dl and abs(dl[0] / K - v) / v < 0.03:
            out['cotes'].append([*m(dl[1]), *m(dl[2]), w[4]])

    # images : plan pour l'IA, calque transparent ; le cadre est rogné à la page quand la marge en sort
    clip = pymupdf.Rect(rx0, ry0, rx1, ry1) & page.rect
    zoom = min(4.0, 1800 / clip.width, 1800 / clip.height)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=False)
    pix.save(outdir / 'plan-src.png')
    out['image'] = {'file': 'plan-src.png', 'px_par_m': round(zoom * K, 2), 'origine_px': [round((X0 - clip.x0) * zoom, 1), round((Y0 - clip.y0) * zoom, 1)]}
    full = page.get_pixmap(matrix=pymupdf.Matrix(1.2, 1.2), alpha=False); full.save(outdir / 'page.png')
    try:
        from PIL import Image
        import numpy as np
        big = page.get_pixmap(matrix=pymupdf.Matrix(4, 4), clip=clip, alpha=False)
        im = Image.frombytes('RGB', (big.width, big.height), big.samples).convert('L')
        a = np.clip((255 - np.asarray(im, dtype=np.float32)) * 1.4, 0, 255).astype(np.uint8)
        rgba = np.zeros((*a.shape, 4), np.uint8); rgba[..., 3] = a
        Image.fromarray(rgba, 'RGBA').resize((big.width // 2, big.height // 2)).save(outdir / f'plan-{pid}.png', optimize=True)
        out['underlay'] = {'file': f'plan-{pid}.png', 'x': round((clip.x0 - X0) / K, 3), 'z': round((clip.y0 - Y0) / K, 3), 'w': round(clip.width / K, 3), 'h': round(clip.height / K, 3)}
    except ImportError:
        pass
    (outdir / 'extract.json').write_text(json.dumps(out, ensure_ascii=False))
    return out


if __name__ == '__main__':
    r = extract(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'plan')
    print(json.dumps({k: (len(v) if isinstance(v, list) else v) for k, v in r.items() if k not in ('image', 'underlay', 'legende')}, ensure_ascii=False, indent=1))
