"""Murs propres, sans IA : les morceaux d'aplats lus sur le plan deviennent des murs soudés, fermés sur les pièces,
d'équerre et découpés en morceaux convexes (le moteur ne sait heurter que des polygones convexes) ; chaque baie
est recalée entre ses deux jambages.

Toutes les distances sont en mètres, dans le repère du plan (x vers la droite, z vers le bas)."""
import math
import os
import re
from shapely import constrained_delaunay_triangles, make_valid
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union

MITRE = dict(join_style='mitre', mitre_limit=4)


def polys(g):
    """les polygones d'une géométrie quelconque"""
    if g is None or g.is_empty:
        return []
    if g.geom_type == 'Polygon':
        return [g]
    return [p for q in getattr(g, 'geoms', []) for p in polys(q)]


def valide(g, trou_min=0.02):
    """géométrie valide, sans les petits vides entre morceaux (les pièces, elles, sont de grands vides)"""
    out = []
    for p in polys(make_valid(g) if not g.is_valid else g):
        p = Polygon(p.exterior, [h for h in p.interiors if Polygon(h).area >= trou_min])
        out.extend(polys(p if p.is_valid else make_valid(p)))
    return unary_union(out) if out else Polygon()


def quad(w):
    if 'poly' in w:
        return w['poly']
    dx, dz = w['b'][0] - w['a'][0], w['b'][1] - w['a'][1]; L = math.hypot(dx, dz) or 1
    s = w.get('side', 1); T = (-dz / L * s, dx / L * s)
    a, b, t = w['a'], w['b'], w['t']
    return [a, b, [b[0] + T[0] * t, b[1] + T[1] * t], [a[0] + T[0] * t, a[1] + T[1] * t]]


def exterieure(r):
    return bool(r.get('ext') or r.get('floor') == 'loggia' or 'loggia' in (r.get('id', '') + r.get('name', '')).lower()
                or 'balcon' in (r.get('name', '')).lower() or 'terrasse' in (r.get('name', '')).lower())


# ---------- équerrage ----------
def equerre_anneau(pts, tol=math.radians(3), lmin=0.08):
    """les côtés presque horizontaux ou verticaux (à tol près) deviennent exactement horizontaux ou verticaux"""
    n = len(pts)
    if n < 4:
        return pts
    ax = []
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]; dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz)
        ang = math.atan2(abs(dz), abs(dx))
        if L >= lmin and ang < tol:
            ax.append(('h', (a[1] + b[1]) / 2))
        elif L >= lmin and ang > math.pi / 2 - tol:
            ax.append(('v', (a[0] + b[0]) / 2))
        else:
            ax.append(None)
    out = []
    for i in range(n):
        p, c = ax[i - 1], ax[i]; x, z = pts[i]
        if p and c and p[0] != c[0]:
            x, z = (c[1], p[1]) if p[0] == 'h' else (p[1], c[1])
            out.append((x, z))
        elif p and c:  # deux côtés parallèles qui se suivent : petit ressaut d'équerre
            if abs(p[1] - c[1]) < 0.004:
                continue
            out.append((x, p[1]) if p[0] == 'h' else (p[1], z))
            out.append((x, c[1]) if c[0] == 'h' else (c[1], z))
        elif p:
            out.append((x, p[1]) if p[0] == 'h' else (p[1], z))
        elif c:
            out.append((x, c[1]) if c[0] == 'h' else (c[1], z))
        else:
            out.append((x, z))
    return out


def equerre(g):
    res = []
    for p in polys(g):
        q = Polygon(equerre_anneau(list(p.exterior.coords)[:-1]), [equerre_anneau(list(h.coords)[:-1]) for h in p.interiors]).buffer(0)
        # garde-fou : l'équerrage ne doit pas changer la forme
        if q.is_empty or abs(q.area - p.area) > 0.03 * p.area + 0.002 or q.symmetric_difference(p).area > 0.05 * p.area + 0.004:
            res.append(p)
        else:
            res.extend(polys(q))
    return unary_union(res) if res else Polygon()


# ---------- découpe en morceaux convexes (triangulation contrainte, puis fusion à la Hertel-Mehlhorn) ----------
def convexe(p, eps=2e-6):
    return p.convex_hull.area - p.area <= eps * max(1.0, p.length)


def convexes(g, amin=2e-4):
    out = []
    for p in polys(g):
        p = p.simplify(0.0002, preserve_topology=True)
        if p.is_empty or p.area < amin:
            continue
        if not p.interiors and convexe(p):
            out.append(p); continue
        tris = [t for t in polys(constrained_delaunay_triangles(p)) if t.area > 1e-9]
        if not tris:
            continue
        key = lambda a: (round(a[0], 6), round(a[1], 6))
        edges = {}
        for i, t in enumerate(tris):
            c = list(t.exterior.coords)[:-1]
            for k in range(len(c)):
                e = tuple(sorted((key(c[k]), key(c[(k + 1) % len(c)]))))
                edges.setdefault(e, []).append(i)
        diag = sorted(((math.dist(*e), v) for e, v in edges.items() if len(v) == 2), key=lambda d: -d[0])
        parent = list(range(len(tris))); geom = dict(enumerate(tris))

        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]; i = parent[i]
            return i
        for _, (i, j) in diag:
            a, b = find(i), find(j)
            if a == b:
                continue
            u = geom[a].union(geom[b])
            if u.geom_type == 'Polygon' and not u.interiors and convexe(u):
                parent[b] = a; geom[a] = u; del geom[b]
        out.extend(geom.values())
    return [q for q in out if q.geom_type == 'Polygon' and q.area > amin]


def ring(p):
    c = list(p.exterior.coords)[:-1]
    if p.exterior.is_ccw:  # même sens partout, arrondi au millimètre
        c = c[::-1]
    return [[round(x, 3), round(z, 3)] for x, z in c]


# ---------- soudure et fermeture ----------
def soude(walls, rooms, gaines=(), log=None, ouverts=(), vides=()):
    """murs en béton : soudés en une masse, limités aux abords du logement, fentes le long des pièces refermées.
    Les cloisons et les murs décrits par deux points restent tels quels (on retire juste ce qui chevauche le béton).
    ouverts : emprises d'escalier et trémies (plusieurs niveaux), qui bordent les murs comme une pièce.
    vides : emprises qui ne sont jamais comblées en jointure (coffret du tableau électrique)."""
    log = log if log is not None else []
    beton = [w for w in walls if 'poly' in w and w.get('k') != 'cloison' and not w.get('virtual')]
    autres = [w for w in walls if w not in beton]
    rs = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('of')]  # placards (cachés) compris
    rs = [r for r in rs if not r.is_empty]
    if not beton or not rs:
        return walls
    R = unary_union(rs)
    # une gaine borde les murs comme une pièce : le voile au-dessus d'un conduit reste un mur du logement
    Rg = unary_union([R] + [Polygon(g['poly']).buffer(0) for g in gaines if len(g.get('poly', [])) >= 3] + list(ouverts))
    # un aplat que la lecture écarte (mobilier plein, symbole) disparaît, sauf s'il borde une pièce : un mur
    # coupé en morceaux ne perd jamais un morceau (tracés en triangles)
    bord = Rg.boundary.buffer(0.06)
    garde_ia = [w for w in beton if not w.get('_exclu') or Polygon(w['poly']).buffer(0).intersects(bord)]
    ignores = sum(1 for w in garde_ia if w.get('_exclu'))
    if ignores:
        log.append(f"{ignores} morceau(x) de mur écarté(s) par la lecture mais collé(s) à une pièce : gardé(s)")
    beton = garde_ia
    M = valide(unary_union([valide(Polygon(w['poly'])) for w in beton]))
    a0 = M.area
    # fissures de moins de 2 cm entre morceaux (tracés en triangles, vectorisation d'image)
    M = valide(valide(M.buffer(0.01, **MITRE)).buffer(-0.01, **MITRE))
    # traits de moins de 3 cm d'épaisseur (garde-corps, hachures, traits de coupe) : pas des murs en béton
    M = valide(valide(M.buffer(-0.015, **MITRE)).buffer(0.015, **MITRE))
    # au-delà de 50 cm des pièces, ce n'est plus notre mur (voisin, coursive, cartouche)
    M = M.intersection(Rg.buffer(0.5, **MITRE))
    # un morceau qui ne borde aucune pièce ni gaine : flèche d'entrée, légende, trait isolé. Jamais un voile de façade long (1 m et plus,
    # 0,1 m² et plus) séparé d'une pièce intérieure par son doublage (bande blanche de moins de 26 cm, refermée plus bas) : constat du
    # 28/09/2026 (plan-du-lot, façade sud de la chambre 2 : voile écarté, un mur supposé posé 12 cm en retrait faisait une marche en façade)
    interieur = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('of') and not exterieure(r)]
    Ri = unary_union(interieur)
    long_ = lambda p: max(math.dist(a, b) for a, b in zip(list(p.minimum_rotated_rectangle.exterior.coords), list(p.minimum_rotated_rectangle.exterior.coords)[1:]))
    garde = [p for p in polys(M) if (p.intersects(Rg.buffer(0.04)) and p.area > 0.003) or (p.area >= 0.1 and p.distance(Ri) <= 0.26 and long_(p) >= 1.0)]
    ecart = len(polys(M)) - len(garde)
    M = unary_union(garde)
    # fente de moins de 26 cm (doublage isolant hachuré, jeu de lecture) entre la face d'un mur et le bord d'une pièce intérieure : fermeture morphologique du
    # logement plein (pièces + murs). Les baies, plus larges, restent ouvertes ; entre deux pièces, c'est la lecture qui décide.
    plein = valide(unary_union([M, R] + [Polygon(g['poly']).buffer(0) for g in gaines]))
    clos = valide(valide(plein.buffer(0.13, **MITRE)).buffer(-0.13, **MITRE))
    entre = unary_union([a.buffer(0.16, **MITRE).intersection(b.buffer(0.16, **MITRE)) for i, a in enumerate(rs) for b in rs[i + 1:]])
    comble = clos.difference(plein).intersection(Ri.buffer(0.26, **MITRE)).difference(entre)
    gs = [q for q in (Polygon(g['poly']).buffer(0) for g in gaines if len(g.get('poly', [])) >= 3) if not q.is_empty]
    # jamais sur une cloison lue qui a la même pièce des deux côtés (séjour qui entoure le renfoncement sous l'escalier) :
    # la fente de 5 cm serait comblée en béton, dessinée en noir, et la cloison disparaîtrait dedans
    for w in autres:
        if w.get('k') != 'cloison' or w.get('virtual') or not comble.intersects(g := Polygon(quad(w)).buffer(0)):
            continue
        c = list(g.minimum_rotated_rectangle.exterior.coords); e = max(((c[i], c[i + 1]) for i in range(4)), key=lambda s: math.dist(*s))
        L = math.dist(*e) or 1; ux, uz = (e[1][0] - e[0][0]) / L, (e[1][1] - e[0][1]) / L; m = g.centroid
        d = min(math.dist(c[i], c[i + 1]) for i in range(4)) / 2 + 0.06
        if any(r.contains(Point(m.x - uz * d, m.y + ux * d)) and r.contains(Point(m.x + uz * d, m.y - ux * d)) for r in rs):
            comble = comble.difference(g)
        # ni sur le cadre d'une gaine (bandes blanches qui la cernent, lues en cloisons) qui ne borde qu'une pièce : comblé, il deviendrait
        # un voile de 7 cm dessiné en noir. Constat du 28/09/2026 (432, nouveau tirage 2 : gaine lue sur son remplissage gris, cadre en
        # cloisons). Un cadre entre deux pièces (gaine dans l'angle d'un cellier et d'un WC, plan 3081) reste comblé comme avant.
        elif any(g.distance(q) <= 0.08 and g.within(box(*q.bounds).buffer(0.1, **MITRE)) for q in gs) and sum(r.distance(g) < 0.15 for r in rs) <= 1:
            comble = comble.difference(g)
    # jamais dans le coffret du tableau électrique : niche de 22 à 25 cm, plus étroite que la fermeture (constat du 28/09/2026, 3124, plan
    # en image : niche du TE comblée en béton, le tableau pris dans un pilier plein)
    if vides:
        comble = comble.difference(unary_union([v for v in vides if not v.is_empty]))
    comble = unary_union([p for p in polys(comble) if p.area > 1e-4])
    M = valide(valide(unary_union([M, comble]).buffer(0.002, **MITRE)).buffer(-0.002, **MITRE))
    M = valide(equerre(M))
    if ecart:
        log.append(f'{ecart} élément(s) isolé(s) écarté(s) des murs')
    if comble.area > 0.01:
        log.append(f'fentes refermées le long des pièces : {comble.area:.2f} m²')
    # la masse peut entourer les pièces (anneau fermé) : un mur polygonal n'a pas de trou, on la découpe tout de suite
    out = [{'id': 'mb', 'k': 'beton', 'poly': ring(c), '_masse': True} for p in polys(M) for c in convexes(p)]
    # les cloisons ne doublent pas le béton : on retire la partie commune, jamais la cloison entière
    for w in autres:
        if w.get('virtual'):
            out.append(w); continue
        g = Polygon(quad(w)).buffer(0)
        commun = g.intersection(M).area
        if commun < 1e-4:
            out.append(w); continue
        restes = [q for q in polys(g.difference(M)) if q.area > 2e-4 and min(q.bounds[2] - q.bounds[0], q.bounds[3] - q.bounds[1]) > 0.015]
        for k, q in enumerate(restes):
            out.append({**{k2: v for k2, v in w.items() if k2 not in ('a', 'b', 't', 'side')}, 'id': f"{w['id']}-{k}" if k else w['id'], 'poly': ring(q)})
        if not restes:
            log.append(f'cloison {w["id"]} entièrement dans un mur béton')
    log.append(f'murs béton : {a0:.2f} m² lus, {M.area:.2f} m² retenus')
    # jointures : une cloison qui s'arrête à quelques centimètres d'un mur, un trait de cote qui entaille un aplat,
    # un angle de cloisons mal fermé laissent une fente où l'on voit le vide ; tout interstice ou encoche de moins de
    # 13 cm entre murs est comblé (une baie, elle, mesure au moins 50 cm)
    tous = valide(unary_union([Polygon(quad(w)).buffer(0) for w in out if not w.get('virtual')]))
    joints = valide(valide(tous.buffer(0.065, **MITRE)).buffer(-0.065, **MITRE)).difference(tous)
    joints = [p for p in polys(joints) if 2e-5 < p.area < 0.04]
    # entre deux pièces, une cloison interrompue sur moins de 50 cm n'est pas un passage (une porte fait au moins 60 cm) :
    # trait de cote ou texte qui coupait l'aplat, morceau manqué par la vectorisation
    tous2 = valide(unary_union([tous] + joints))
    ponts = valide(valide(tous2.buffer(0.25, join_style='mitre', mitre_limit=2)).buffer(-0.25, join_style='mitre', mitre_limit=2)).difference(tous2).intersection(entre)
    ponts = [p for p in polys(ponts) if p.area > 5e-4 and not p.intersects(R.buffer(-0.02))]
    # l'intérieur du coffret du tableau (niche de 25 cm fermée par une porte) n'est pas une cloison interrompue. Constat du 28/09/2026
    # (432, porte « Placard TE ») : deux blocs de béton de 11 cm y étaient posés, vus porte ouverte
    V = unary_union([v for v in vides if not v.is_empty]) if vides else Polygon()
    if not V.is_empty:
        # ni les encoches au fond de la niche (3124, plan en image), une fois le rectangle du tableau calé sur la niche (portes_coffret_image)
        n0 = len(ponts) + len(joints); ponts = [p for p in ponts if p.intersection(V).area < 0.5 * p.area]
        joints = [p for p in joints if p.intersection(V).area < 0.5 * p.area]
        if len(ponts) + len(joints) < n0:
            log.append(f'{n0 - len(ponts) - len(joints)} jointure(s) dans le coffret du tableau électrique laissée(s) vide(s)')
    for p in joints + ponts:
        out.extend({'id': 'mj', 'k': 'beton', 'poly': ring(c), '_masse': True} for c in convexes(p, amin=1e-6))  # les petites entailles aussi
    if joints:
        log.append(f'{len(joints)} jointure(s) entre murs refermée(s)')
    if ponts:
        log.append(f"{len(ponts)} cloison(s) interrompue(s) entre deux pièces refermée(s) ({', '.join(f'{p.area:.3f} m²' for p in ponts)})")
    return out


# ---------- baies calées entre leurs jambages ----------
def _travers(M, p, n, lim=0.8):
    """segments de mur traversés par la droite (p, n), en abscisses le long de n"""
    line = LineString([(p[0] - n[0] * lim, p[1] - n[1] * lim), (p[0] + n[0] * lim, p[1] + n[1] * lim)])
    inter = line.intersection(M); segs = []
    for g in ([inter] if inter.geom_type == 'LineString' else getattr(inter, 'geoms', [])):
        if g.geom_type == 'LineString' and g.length > 1e-4:
            ds = [(x - p[0]) * n[0] + (z - p[1]) * n[1] for x, z in g.coords]
            segs.append([min(ds), max(ds)])
    segs.sort(); fus = []
    for s in segs:
        if fus and s[0] <= fus[-1][1] + 0.01:
            fus[-1][1] = max(fus[-1][1], s[1])
        else:
            fus.append(s)
    return fus


def _ecart(a, b):
    return max(0.0, max(a[0], b[0]) - min(a[1], b[1]))


def cale(ops, walls, log=None):
    """chaque baie traverse toute l'épaisseur du mur entre ses deux jambages, et s'arrête aux jambages"""
    log = log if log is not None else []
    M = unary_union([Polygon(quad(w)).buffer(0) for w in walls if not w.get('virtual')])
    for oid, o in ops.items():
        if not o.get('p'):
            continue
        (p0, p1) = o['p']; dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz)
        if L < 0.3:
            continue
        # la baie est exactement parallèle à son mur : on prend la direction du plus long bord de mur voisin, presque
        # parallèle (8° au plus) ; sinon, dans un mur en biais, le cadre laisse une fente à un bout
        mid = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); best = None
        for g in polys(M):
            for ring_ in [g.exterior] + list(g.interiors):
                cs = list(ring_.coords)
                for a_, b_ in zip(cs, cs[1:]):
                    l_ = math.dist(a_, b_)
                    if l_ < 0.25 or LineString([a_, b_]).distance(Point(mid)) > 0.5:
                        continue
                    ex, ez = (b_[0] - a_[0]) / l_, (b_[1] - a_[1]) / l_
                    cosang = abs(ex * dx / L + ez * dz / L)
                    if cosang > math.cos(math.radians(8)) and (best is None or l_ > best[0]):
                        best = (l_, ex if ex * dx + ez * dz > 0 else -ex, ez if ex * dx + ez * dz > 0 else -ez)
        if best and abs(best[1] * dx / L + best[2] * dz / L) < 0.99999:
            p0 = [mid[0] - best[1] * L / 2, mid[1] - best[2] * L / 2]; p1 = [mid[0] + best[1] * L / 2, mid[1] + best[2] * L / 2]
            o['p'] = [[round(p0[0], 4), round(p0[1], 4)], [round(p1[0], 4), round(p1[1], 4)]]
            dx, dz = p1[0] - p0[0], p1[1] - p0[1]
            log.append(f'baie {oid} alignée sur son mur')
        u = (dx / L, dz / L); n = (-u[1], u[0]); sd = o.get('side', 1); dp = o.get('depth', 0.2)
        at = lambda s, d: (p0[0] + u[0] * s + n[0] * d, p0[1] + u[1] * s + n[1] * d)
        cur = [0.0, dp] if sd > 0 else [-dp, 0.0]
        jamb, cands = {}, {}
        for bout, ss in (('g', (-0.04, -0.08, -0.12)), ('d', (L + 0.04, L + 0.08, L + 0.12))):
            vus = []
            for s in ss:
                segs = [g for g in _travers(M, at(s, 0), n) if g[1] - g[0] >= 0.03]
                if segs:
                    g = min(segs, key=lambda g: (_ecart(g, cur), abs((g[0] + g[1]) / 2 - (cur[0] + cur[1]) / 2)))
                    if _ecart(g, cur) < 0.3:
                        vus.append(g)
            if vus:
                # le jambage : l'épaisseur la plus fréquente parmi les sondes (une cloison perpendiculaire n'y figure qu'une fois)
                jamb[bout] = min(vus, key=lambda g: g[1] - g[0]); cands[bout] = vus
        rec = lambda a, b: min(a[1], b[1]) - max(a[0], b[0])
        if len(cands) == 2 and rec(jamb['g'], jamb['d']) < 0.03:
            # les deux jambages d'une même baie sont dans le même mur : s'ils ne se recouvrent pas, la paire de sondes la plus mince qui se
            # recouvre (D201, porte du WC : au-delà du bout de sa cloison, les sondes du jambage nord tombaient dans la niche ouverte du
            # tableau, sur sa cloison du fond à 25 cm)
            paires = [(a, b) for a in cands['g'] for b in cands['d'] if rec(a, b) >= 0.03]
            if paires:
                a, b = min(paires, key=lambda ab: (ab[0][1] - ab[0][0]) + (ab[1][1] - ab[1][0]))
                jamb = {'g': a, 'd': b}
        # on ne recale l'épaisseur que si les deux jambages s'accordent (une cloison perpendiculaire au bout de la baie
        # la traverse de part en part et laisse l'autre jambage décider) ; sinon l'épaisseur lue est gardée, mais les
        # bouts de la baie vont quand même jusqu'au trou du mur (plus loin)
        lo, hi = cur
        if o.pop('_arc', False):  # baie posée d'après son arc (porte du coffret du tableau) : épaisseur et nu gardés
            jamb = {}
        if len(jamb) == 2:
            l2, h2 = max(jamb['g'][0], jamb['d'][0]), min(jamb['g'][1], jamb['d'][1])
            if 0.03 <= h2 - l2 <= 0.65 and _ecart([l2, h2], cur) <= 0.3 and h2 - l2 <= max(2 * dp, dp + 0.12):
                lo, hi = l2, h2
        # façade de niche (coffret, gaine) : les deux jambages s'arrêtent au même nu, du même côté de la baie lue et à quelques centimètres
        # d'elle ; la porte ferme la niche entre les bouts des jambages, dont chacun est prolongé sur l'épaisseur de la porte (le plan dessine
        # leurs traits jusqu'à son nu). Constat du 28/09/2026 (432, porte « Placard TE ») : posée 5 cm devant les cloisons du coffret, elle
        # laissait entre son huisserie et chaque cloison une fente sur toute la hauteur, par laquelle on voyait l'intérieur et la dalle
        if len(jamb) == 2 and [lo, hi] == cur:
            jg, jd = jamb['g'], jamb['d']
            # jambages tous deux avant la bande (aucun n'y entre), l'un au moins arrêté de 0,5 à 8 cm avant elle : la bande se pose contre le
            # bout du plus court (le nu de la niche), et chaque jambage est prolongé jusqu'à son autre face (432, tirage « regul-1 » : un
            # jambage lu jusqu'au nu de la porte, l'autre 5 cm avant)
            e_av, E_av = min(jg[1], jd[1]), max(jg[1], jd[1])
            e_ap, E_ap = max(jg[0], jd[0]), min(jg[0], jd[0])
            av = E_av <= cur[0] + 0.005 and cur[0] - e_av >= 0.005 and cur[0] - e_av <= 0.08
            ap = not av and E_ap >= cur[1] - 0.005 and e_ap - cur[1] >= 0.005 and e_ap - cur[1] <= 0.08
            if av or ap:
                lo, hi = (e_av, e_av + dp) if av else (e_ap - dp, e_ap)
                for nom_b, sa, sb in (('g', -0.005, -0.3), ('d', L + 0.005, L + 0.3)):
                    fin_j = jamb[nom_b][1] if av else jamb[nom_b][0]
                    bout_j = fin_j - 0.01 if av else fin_j + 0.01  # dans le jambage, juste avant son bout
                    if (av and fin_j >= hi - 0.002) or (ap and fin_j <= lo + 0.002):
                        continue  # déjà jusqu'à l'autre face
                    seg = LineString([at(sa, bout_j), at(sb, bout_j)]).intersection(M)
                    ls = [g for g in ([seg] if seg.geom_type == 'LineString' else getattr(seg, 'geoms', [])) if g.geom_type == 'LineString' and g.length > 0.01]
                    ls = [g for g in ls if g.distance(Point(at(sa, bout_j))) < 0.01]
                    if not ls:
                        continue
                    ss = [(x - p0[0]) * u[0] + (z - p0[1]) * u[1] for x, z in ls[0].coords]
                    e0, e1 = (min(ss), 0.0) if nom_b == 'g' else (L, max(ss))
                    q = Polygon([at(e0, lo), at(e1, lo), at(e1, hi), at(e0, hi)]).difference(M)
                    for part in polys(q):
                        if part.area > 2e-4:
                            walls.append({'id': f'jb{len([w for w in walls if str(w.get("id", "")).startswith("jb")])}', 'k': 'cloison', 'poly': ring(part)})
                log.append(f'baie {oid} : façade de niche, posée contre le bout de ses jambages ({abs((lo if av else hi) - (cur[0] if av else cur[1])) * 100:.0f} cm), jambages prolongés')
                cur = [lo, hi]
        ref = lo if sd > 0 else hi
        # bouts de la baie : si le trou du mur déborde la lecture (moins de 15 cm), la baie va jusqu'aux jambages, pour ne
        # jamais laisser de fente vide entre le jambage et le cadre ; si la lecture déborde le trou, la découpe s'en charge
        s0, s1 = 0.0, L
        for f in (0.2, 0.35, 0.5, 0.65, 0.8):
            d = lo + (hi - lo) * f
            libre = LineString([at(-0.3, d), at(L + 0.3, d)]).difference(M)
            for g in ([libre] if libre.geom_type == 'LineString' else getattr(libre, 'geoms', [])):
                if g.geom_type != 'LineString' or g.length < 0.2:
                    continue
                ss = sorted((x - p0[0]) * u[0] + (z - p0[1]) * u[1] for x, z in g.coords)
                a, b = ss[0], ss[-1]
                if a <= L / 2 <= b:
                    if -0.15 <= a < s0:
                        s0 = a
                    if s1 < b <= L + 0.15:
                        s1 = b
        q0, q1 = at(s0, ref), at(s1, ref)
        moved = math.dist(q0, p0) + math.dist(q1, p1)
        o['p'] = [[round(q0[0], 3), round(q0[1], 3)], [round(q1[0], 3), round(q1[1], 3)]]
        o['depth'] = round(hi - lo, 3)
        if o.get('gc'):
            o['gc'] = [round(max(0.05, o['depth'] - 0.13), 3), round(max(0.1, o['depth'] - 0.08), 3)]
        if moved > 0.05:
            log.append(f'baie {oid} recalée entre ses jambages ({moved * 100:.0f} cm)')
    return ops


# ---------- découpe aux baies, puis morceaux convexes ----------
def decoupe(walls, ops):
    trous = []
    for o in ops.values():
        if not o.get('p'):
            continue
        (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2)
        dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz)
        if L < 1e-3:
            continue
        T = (-dz / L * sd, dx / L * sd)
        at = lambda p, d: (p[0] + T[0] * d, p[1] + T[1] * d)
        trous.append(Polygon([at(p0, -0.04), at(p1, -0.04), at(p1, dp + 0.04), at(p0, dp + 0.04)]))
    H = unary_union(trous) if trous else Polygon()
    out, k = [], 0
    for w in walls:
        if w.get('virtual'):
            out.append(w); continue
        g = Polygon(quad(w)).buffer(0)
        touche = not H.is_empty and g.intersects(H) and g.intersection(H).area > 1e-5
        if not touche and not w.get('_masse') and ('poly' not in w or convexe(g)):
            out.append({k2: v for k2, v in w.items() if k2 != '_masse'}); continue
        rest = g.difference(H) if touche else g
        base = {k2: v for k2, v in w.items() if k2 not in ('a', 'b', 't', 'side', 'poly', '_masse', 'id')}
        for part in convexes(rest, amin=1e-6 if g.area < 4e-4 else 2e-4):  # une petite jointure reste entière
            # languette de moins de 1,5 cm laissée par une baie dans une cloison lue sur le vantail fermé (432 : le remplissage blanc
            # du vantail de la porte « Placard TE » lu comme cloison ; il en restait une plaque de 1 cm derrière la porte)
            if touche and w.get('k') == 'cloison' and part.distance(H) < 0.005:
                if 2 * part.area / max(part.length, 1e-9) < 0.015:  # largeur d'une bande mince : 2 × aire / périmètre
                    continue
            out.append({**base, 'id': f"{w['id']}{k}", 'poly': ring(part)}); k += 1
    return out


# ---------- enveloppe fermée ----------
def trous(P, pas=0.05, ouverts=()):
    """bords de pièce intérieure qui ne donnent ni sur un mur, ni sur une baie, ni sur une autre pièce, ni sur un
    escalier ou une trémie (ouverts : polygones shapely, logement sur plusieurs niveaux)"""
    W = unary_union([Polygon(quad(w)).buffer(0) for w in P['walls']] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])]).buffer(0.03)
    O = []
    for o in P['openings'].values():
        if not o.get('p'):
            continue
        (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2)
        dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz) or 1
        T = (-dz / L * sd, dx / L * sd)
        at = lambda p, d: (p[0] + T[0] * d, p[1] + T[1] * d)
        O.append(Polygon([at(p0, -0.12), at(p1, -0.12), at(p1, dp + 0.12), at(p0, dp + 0.12)]))
    # le devant d'un placard est fermé par ses portes coulissantes
    for f in P.get('fixtures', []):
        if f.get('type') == 'placard' and f.get('x') and f.get('z'):
            O.append(Polygon([(f['x'][0], f['z'][0]), (f['x'][1], f['z'][0]), (f['x'][1], f['z'][1]), (f['x'][0], f['z'][1])]).buffer(0.12, **MITRE))
    # niche du tableau électrique, ouverte sur la pièce (façade en trait fin, D201) ou fermée par sa porte (3124, porte lue sur l'image) : le
    # coffret est son fond, pas un trou de l'enveloppe (le test d'immersion vérifie qu'elle est fermée au fond)
    for f in P.get('fixtures', []):
        if f.get('type') == 'tableau' and f.get('x') and f.get('z'):
            O.append(box(min(f['x']), min(f['z']), max(f['x']), max(f['z'])).buffer(0.07, **MITRE))
    O += [g.buffer(0.03, **MITRE) for g in ouverts]  # volée d'escalier au niveau bas, trémie au niveau haut : bords ouverts
    O = unary_union(O) if O else Polygon()
    rooms = [r for r in P['rooms'] if len(r.get('poly', [])) >= 3 and not r.get('of')]
    autres = {r['id']: unary_union([Polygon(q['poly']).buffer(0) for q in rooms if q is not r]).buffer(0.03) for r in rooms}
    res = []
    for r in rooms:
        if exterieure(r):
            continue
        poly = r['poly']; rp = Polygon(poly).buffer(0)
        for i in range(len(poly)):
            a, b = poly[i], poly[(i + 1) % len(poly)]; L = math.dist(a, b)
            if L < 0.05:
                continue
            ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
            m = max(2, int(L / pas)); run = None
            for k in range(m + 1):
                t = k / m; x, z = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
                ok = True
                for sg in (1, -1):
                    q = Point(x - uz * 0.06 * sg, z + ux * 0.06 * sg)
                    if rp.contains(q):
                        continue
                    ok = W.contains(q) or O.contains(q) or autres[r['id']].contains(q)
                if not ok:
                    run = run or [(x, z), (x, z)]; run[1] = (x, z)
                elif run:
                    if math.dist(*run) >= 0.08:
                        res.append({'piece': r['id'], 'a': run[0], 'b': run[1], 'dehors': (-uz, ux)})
                    run = None
            if run and math.dist(*run) >= 0.08:
                res.append({'piece': r['id'], 'a': run[0], 'b': run[1], 'dehors': (-uz, ux)})
    # sens « dehors » : du côté qui n'est pas dans la pièce
    for h in res:
        r = next(q for q in rooms if q['id'] == h['piece']); m = ((h['a'][0] + h['b'][0]) / 2, (h['a'][1] + h['b'][1]) / 2)
        d = h['dehors']
        if Polygon(r['poly']).buffer(0).contains(Point(m[0] + d[0] * 0.05, m[1] + d[1] * 0.05)):
            h['dehors'] = (-d[0], -d[1])
    return res


def ferme(P, log=None, ouverts=()):
    """referme chaque trou de l'enveloppe par un mur posé contre le bord de la pièce (béton côté extérieur, cloison entre pièces) ;
    jamais le long d'un escalier, d'une trémie ou d'un palier (ouverts)"""
    log = log if log is not None else []
    ajout = []
    for k, h in enumerate(trous(P, ouverts=ouverts)):
        a, b, d = h['a'], h['b'], h['dehors']; L = math.dist(a, b)
        ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        a2, b2 = (a[0] - ux * 0.05, a[1] - uz * 0.05), (b[0] + ux * 0.05, b[1] + uz * 0.05)
        # épaisseur : celle de la baie voisine sur la même façade, sinon 20 cm
        t = 0.2
        for o in P['openings'].values():
            if o.get('p') and o.get('kind') in ('window', 'french', 'entry') and LineString(o['p']).distance(LineString([a, b])) < 0.25:
                t = max(0.12, min(0.5, o.get('depth', 0.2))); break
        poly = Polygon([a2, b2, (b2[0] + d[0] * t, b2[1] + d[1] * t), (a2[0] + d[0] * t, a2[1] + d[1] * t)])
        # on ne mord pas sur une autre pièce
        for r in P['rooms']:
            if len(r.get('poly', [])) >= 3 and r['id'] != h['piece']:
                poly = poly.difference(Polygon(r['poly']).buffer(0))
        for part in convexes(poly):
            ajout.append({'id': f'fx{k}', 'k': 'beton', 'poly': ring(part), 'suppose': True})
        log.append(f"mur ajouté pour fermer « {h['piece']} » sur {L:.2f} m")
    ajout = decoupe(ajout, P['openings'])  # un mur ajouté ne mord jamais sur une baie
    P['walls'] += ajout
    return ajout


def pochettes(P, log=None, amax=0.01):
    """poche d'air qui n'appartient à aucune pièce, cernée par les pièces, les murs, les gaines et les baies (moins de 1 dm², sans
    équipement) : comblée par un morceau de cloison. Constat du 28/09/2026 (432) : deux cloisons qui ne se touchaient que par un angle
    laissaient dans le coin de la salle de bains une encoche de 5 × 5 cm sur toute la hauteur ; la fermeture des jointures (soude) ne la
    voit pas (l'encoche est à l'angle saillant du mur). Trouvée par le contrôle des fentes fines (moteur/controle.mjs, 1 quater bis)."""
    log = log if log is not None else []
    parts = [Polygon(r['poly']).buffer(0) for r in P.get('rooms', []) if len(r.get('poly', [])) >= 3]
    parts += [Polygon(quad(w)).buffer(0) for w in P.get('walls', []) if not w.get('virtual')]
    parts += [Polygon(g['poly']).buffer(0) for g in P.get('gaines', []) if len(g.get('poly', [])) >= 3]
    bandes = []
    for o in P.get('openings', {}).values():
        if not o.get('p'):
            continue
        (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2)
        L = math.dist(p0, p1)
        if L < 1e-3:
            continue
        T = (-(p1[1] - p0[1]) / L * sd, (p1[0] - p0[0]) / L * sd)
        bandes.append(Polygon([p0, p1, (p1[0] + T[0] * dp, p1[1] + T[1] * dp), (p0[0] + T[0] * dp, p0[1] + T[1] * dp)]).buffer(0))
    parts += bandes
    B = unary_union(bandes).buffer(0.06) if bandes else Polygon()
    E = valide(unary_union([q for q in parts if not q.is_empty]), trou_min=0)
    emp = unary_union(emprises(P.get('fixtures', [])) + [box(min(f['x']), min(f['z']), max(f['x']), max(f['z'])) for f in P.get('fixtures', []) if f.get('x') and f.get('z')])
    ajout = []
    for g in polys(E):
        for h in g.interiors:
            t = Polygon(h)
            # une vraie encoche (plus d'1 cm de large : 2 × aire / périmètre), pas le jeu d'arrondi entre une pièce et son mur ; jamais dans
            # une baie ni contre elle (le seuil et l'huisserie s'en chargent)
            if not (1e-4 < t.area < amax) or 2 * t.area / t.length < 0.01 or t.intersects(B) or (not emp.is_empty and t.intersection(emp).area > 0.1 * t.area):
                continue
            for c in convexes(t, amin=1e-6):
                ajout.append({'id': f'mp{len(ajout)}', 'k': 'cloison', 'poly': ring(c)})
            log.append(f"poche d'air de {t.area * 1e4:.0f} cm² hors de toute pièce comblée ({t.centroid.x:.2f} ; {t.centroid.y:.2f})")
    P['walls'] += ajout
    return ajout


# ---------- placards ----------
def face_placard(f, rooms, walls, ops=None, log=None):
    """côté des portes d'un placard : le plus long côté qui donne sur une pièce sans traverser de mur. Une porte lue
    sur ce côté est retirée : ce sont les portes du placard (sinon, un vantail battant devant des portes coulissantes)."""
    x0, x1 = sorted(f['x']); z0, z1 = sorted(f['z']); xm, zm = (x0 + x1) / 2, (z0 + z1) / 2
    vis = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('hidden') and not r.get('of')]
    W = unary_union([Polygon(quad(w)).buffer(0) for w in walls if not w.get('virtual')])
    cotes = {'s': ((x0, z1), (x1, z1), (0, 1)), 'n': ((x0, z0), (x1, z0), (0, -1)), 'e': ((x1, z0), (x1, z1), (1, 0)), 'w': ((x0, z0), (x0, z1), (-1, 0))}
    cand = []
    for face, (a, b, n) in cotes.items():
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); q = (m[0] + n[0] * 0.2, m[1] + n[1] * 0.2)
        libre = LineString([(m[0] + n[0] * 0.02, m[1] + n[1] * 0.02), q]).intersection(W).length < 0.01
        if libre and any(r.contains(Point(q)) for r in vis):
            cand.append((math.dist(a, b), face))
    if f.get('face') in cotes and any(c[1] == f['face'] for c in cand):
        face = f['face']
    elif cand:
        face = max(cand)[1]
    else:
        t = f.get('track')
        face = ('s' if abs(max(t) - z1) <= abs(min(t) - z0) else 'n') if isinstance(t, list) and len(t) == 2 and abs(t[1] - t[0]) < 0.2 \
            else f.get('face') if f.get('face') in cotes else 's'
    if ops:  # une porte battante lue sur la façade du placard : c'est elle qui ferme le placard (pas de portes coulissantes)
        a, b, _ = cotes[face]; seg = LineString([a, b]).buffer(0.12)
        for oid in [k for k, o in ops.items() if o.get('kind') == 'door' and o.get('p') and LineString(o['p']).intersects(seg)
                    and LineString(o['p']).intersection(seg).length > 0.5 * LineString(o['p']).length]:
            f['battante'] = oid
            if log is not None:
                log.append(f'placard fermé par la porte battante {oid}')
    return face


def emprises(fixtures):
    """emprise au sol des équipements (obstacles pour les cadrages et les arrêts)"""
    out = []
    for f in fixtures or []:
        try:
            if 'x' in f and 'z' in f:
                out.append(Polygon([(f['x'][0], f['z'][0]), (f['x'][1], f['z'][0]), (f['x'][1], f['z'][1]), (f['x'][0], f['z'][1])]).buffer(0))
            elif f.get('type') == 'wc' and f.get('p'):
                d = f.get('dir') or [0, 0]; n = math.hypot(*d) or 1
                out.append(Point(f['p'][0] + d[0] / n * 0.3, f['p'][1] + d[1] / n * 0.3).buffer(0.35))
            elif f.get('p'):
                out.append(Point(f['p']).buffer(f.get('r', 0.05)))
        except (TypeError, ValueError, KeyError, IndexError):
            continue
    return [g for g in out if not g.is_empty]


# ---------- portes calées sur leur arc (PDF vectoriel) ----------
def portes_arcs(ops, arcs, log=None, huisserie=0.038, rayons=None):
    """l'arc de débattement dessiné par l'architecte donne la charnière (son centre), le vantail (son rayon) et le sens
    d'ouverture (l'extrémité hors du mur) : la baie brute va du jambage côté charnière au jambage opposé, huisseries comprises.
    Fenêtre et porte-fenêtre : charnière, et partie fixe vitrée quand les vantaux (rayon × nombre) laissent 20 cm ou plus ;
    rayons[id] = rayon lu (contrôlé ensuite contre la largeur des vantaux)"""
    log = log if log is not None else []
    rayons = rayons if rayons is not None else {}
    arcs = [a for a in arcs or [] if isinstance(a, list) and len(a) == 4 and all(isinstance(v, list) and len(v) == 2 for v in a[:3])]
    for oid, o in ops.items():
        vitre = o.get('kind') in ('window', 'french')
        if not o.get('p') or not (o.get('kind') in ('door', 'entry') or vitre):
            continue
        (p0, p1) = o['p']; dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz)
        if L < 0.3:
            continue
        u = (dx / L, dz / L); n = (-u[1], u[0]); sd = o.get('side', 1); dp = o.get('depth', 0.2)
        S = lambda q: (q[0] - p0[0]) * u[0] + (q[1] - p0[1]) * u[1]
        N = lambda q: (q[0] - p0[0]) * n[0] + (q[1] - p0[1]) * n[1]
        lo, hi = sorted((0.0, sd * dp))
        best = None
        for e1, e2, c, r in arcs:
            sc, nc = S(c), N(c)
            # centre sur une face du mur (ou dans son épaisseur), près d'un bout de la baie ; rayon proche de la largeur
            if not (lo - 0.08 <= nc <= hi + 0.08) or not ((0.25 if vitre else 0.55 * L) <= r <= 1.15 * L):
                continue
            bout = min(abs(sc), abs(sc - L))
            if bout > 0.15:
                continue
            if best is None or bout < best[0]:
                best = (bout, sc, nc, r, e1, e2)
        if not best:
            continue
        _, sc, nc, r, e1, e2 = best
        charniere = 's0' if abs(sc) <= abs(sc - L) else 's1'
        if vitre:  # un vantail vitré s'ouvre toujours vers l'intérieur : charnière et partie fixe lues sur l'arc
            nom, n = ('porte-fenêtre' if o['kind'] == 'french' else 'fenêtre'), o.get('leaves', 2)
            rayons[oid] = round(r, 3)
            if n == 1 and o.get('hinge') != charniere:
                log.append(f"{nom} {oid} : charnière {o.get('hinge', 's0')}→{charniere} (arc du plan)")
            if n == 1:
                o['hinge'] = charniere
            a = n * r + 0.075  # vantaux depuis le jambage de l'arc (dormant 5 cm, montant 2,5 cm) : le reste est vitrage fixe
            if L - a >= 0.2:
                o['fixe'] = [round(a, 3), round(L, 3)] if charniere == 's0' else [0.0, round(L - a, 3)]
                log.append(f"{nom} {oid} : {n} vantail(s) de {r:.2f} m (arc du plan), partie fixe de {L - a:.2f} m")
            elif o.pop('fixe', None) is not None:
                log.append(f"{nom} {oid} : partie fixe retirée, les vantaux de l'arc occupent la baie")
            continue
        if L >= r + 0.04:  # la baie lue contient déjà vantail et huisseries (trou du mur retrouvé) : largeur gardée
            s0, s1 = 0.0, L
        elif r < 0.65:  # porte de gaine ou de coffret (60 cm) : le vantail ferme la niche entre ses deux cloisons, sans huisserie autour.
            # Constat du 28/09/2026 (432, porte « Placard TE ») : élargie de 0,60 à 0,68 m, elle rognait les cloisons de 5 cm à 1,2 cm
            # et laissait une fente sur la hauteur, par laquelle on voyait l'intérieur du coffret depuis le salon
            s0, s1 = (sc, sc + r) if charniere == 's0' else (sc - r, sc)
            if s0 < -0.15 or s1 > L + 0.15:
                continue
        else:  # la lecture a pris la largeur du vantail : la baie brute l'entoure de ses deux huisseries
            s0, s1 = (sc - huisserie, sc + r + huisserie) if charniere == 's0' else (sc - r - huisserie, sc + huisserie)
            if s0 < -0.15 or s1 > L + 0.15:
                continue
        # extrémité ouverte : celle qui sort le plus du mur ; son côté donne le sens
        ouv = max((e1, e2), key=lambda e: abs(N(e) - nc))
        cote = 1 if N(ouv) - nc > 0 else -1
        T = sd  # T = n × side : swing = +1 si le vantail s'ouvre du côté de l'épaisseur
        swing = cote * T
        avant = (o.get('hinge'), o.get('swing'), round(L, 2))
        o['p'] = [[round(p0[0] + u[0] * s0, 3), round(p0[1] + u[1] * s0, 3)], [round(p0[0] + u[0] * s1, 3), round(p0[1] + u[1] * s1, 3)]]
        o['hinge'], o['swing'] = charniere, swing
        apres = (charniere, swing, round(s1 - s0, 2))
        if avant != apres:
            log.append(f'porte {oid} calée sur son arc : charnière {avant[0]}→{apres[0]}, sens {avant[1]}→{apres[1]}, largeur {avant[2]}→{apres[2]} m')
    return ops


def portes_coffret(ops, fixtures, arcs, log=None):
    """porte du coffret du tableau électrique que la lecture a oubliée : un arc de débattement (rayon de 35 à 70 cm) dont la charnière est
    contre un côté du rectangle du tableau, et qu'aucune baie lue n'utilise, donne une porte le long de ce côté (charnière au centre de
    l'arc, vantail fermé du centre à l'extrémité de l'arc qui longe le côté). Constat du 28/09/2026 (plan-du-lot) : la porte de la GTL du
    séjour, dessinée avec son arc de 50 cm, manquait ; la niche était ouverte sur la pièce."""
    log = log if log is not None else []
    arcs = [a for a in arcs or [] if isinstance(a, list) and len(a) == 4 and all(isinstance(v, list) and len(v) == 2 for v in a[:3]) and 0.35 <= a[3] <= 0.7]
    tabs = [f for f in fixtures or [] if f.get('type') == 'tableau' and f.get('x') and f.get('z')]
    ajout = {}
    for e1, e2, c, r in arcs:
        # arc d'une baie lue : charnière à un bout de la baie, rayon à sa mesure, vantail fermé le long d'elle
        def utilise(o):
            if not o.get('p') or min(math.dist(c, q) for q in o['p']) >= 0.15 or not (0.55 * math.dist(*o['p']) <= r <= 1.15 * math.dist(*o['p'])):
                return False
            (a, b), L = o['p'], math.dist(*o['p']) or 1
            return any(abs((e[0] - c[0]) * (b[0] - a[0]) + (e[1] - c[1]) * (b[1] - a[1])) > 0.95 * r * L for e in (e1, e2))
        if any(utilise(o) for o in list(ops.values()) + list(ajout.values())):
            continue
        for f in tabs:
            x0, x1, z0, z1 = min(f['x']), max(f['x']), min(f['z']), max(f['z'])
            T = box(x0, z0, x1, z1)
            if T.distance(Point(c)) > 0.15:
                continue
            # extrémité fermée : celle dont le vantail (du centre à elle) longe un côté du tableau, à 15 cm au plus de lui
            for ferme, ouvre in ((e1, e2), (e2, e1)):
                dx, dz = ferme[0] - c[0], ferme[1] - c[1]
                axe_z = abs(dx) < 0.05 * r  # vantail fermé le long de z (côté x0 ou x1 du tableau)
                if not (axe_z or abs(dz) < 0.05 * r):
                    continue
                if axe_z:
                    cote, prof = min((abs(c[0] - x0), x0 - c[0]), (abs(c[0] - x1), x1 - c[0]))
                else:
                    cote, prof = min((abs(c[1] - z0), z0 - c[1]), (abs(c[1] - z1), z1 - c[1]))
                if cote > 0.15:
                    continue
                oid = f'p_tableau{len(ajout) or ""}'
                # épaisseur d'une cloison (7 cm) du côté du tableau ; la baie tient sa place du dessin (cale n'en change pas l'épaisseur :
                # avant que le coffret soit fermé, ses jambages ne sont pas encore des murs)
                pp = [[round(c[0], 3), round(c[1], 3)], [round(ferme[0], 3), round(ferme[1], 3)]]
                # une porte a son épaisseur du côté gauche de p0 → p1 (lire.assemble_un) : ici, vers le tableau
                if -dz * ((x0 + x1) / 2 - c[0]) + dx * ((z0 + z1) / 2 - c[1]) < 0:
                    pp.reverse()
                ajout[oid] = {'kind': 'door', 'p': pp, 'charniere': [c[0], c[1]], 'ouvre_vers': [ouvre[0], ouvre[1]], 'depth': 0.07,
                              'label': 'Tableau électrique', '_arc': True}
                log.append(f"porte du tableau électrique ajoutée d'après son arc (charnière ({c[0]:.2f} ; {c[1]:.2f}), vantail de {r:.2f} m)")
                break
            break
    ops.update(ajout)
    return ajout


def portes_coffret_image(ops, fixtures, image, log=None):
    """plan en image : porte du coffret du tableau électrique que la lecture a oubliée. Un côté du rectangle du tableau que l'image ne borde
    pas de noir (les trois autres le sont : murs de la niche), long de 35 à 80 cm, et contre lequel un vantail est dessiné entrouvert (trait
    sombre rectiligne partant d'un bout du côté, vers la pièce, entre 12° et 70°, sur toute sa longueur) donne une porte le long de ce côté,
    charnière à ce bout. Constat du 28/09/2026 (3124) : niche du TE comblée en pilier plein, sa porte de 55 cm oubliée."""
    log = log if log is not None else []
    try:
        from PIL import Image
        im = Image.open(image['chemin']).convert('L')
    except Exception:
        return {}
    W_, H_ = im.size; px = im.load(); k = image['px_par_m']; ox, oz = image['origine_px']
    def sombre(x, z, d=2):
        u, v = int(round(ox + x * k)), int(round(oz + z * k)); best = 255
        for du in range(-d, d + 1):
            for dv in range(-d, d + 1):
                if 0 <= u + du < W_ and 0 <= v + dv < H_:
                    best = min(best, px[u + du, v + dv])
        return best
    noir = lambda a, b, n=24: sum(sombre(a[0] + (b[0] - a[0]) * (i + 0.5) / n, a[1] + (b[1] - a[1]) * (i + 0.5) / n, 0) < 80 for i in range(n)) / n
    ajout = {}
    for f in fixtures or []:
        if f.get('type') != 'tableau' or not f.get('x') or not f.get('z'):
            continue
        x0, x1, z0, z1 = min(f['x']), max(f['x']), min(f['z']), max(f['z'])
        T = box(x0, z0, x1, z1)
        if any(o.get('p') and LineString(o['p']).distance(T) < 0.08 for o in list(ops.values()) + list(ajout.values())):
            continue
        # côtés : (bout a, bout b, normale sortante) ; mur de la niche : bande noire pleine d'au moins 4 cm à moins de 12 cm dehors (les traits
        # fins d'une huisserie ou d'un cadre n'en sont pas)
        cotes = [((x0, z0), (x1, z0), (0, -1)), ((x0, z1), (x1, z1), (0, 1)), ((x0, z0), (x0, z1), (-1, 0)), ((x1, z0), (x1, z1), (1, 0))]
        dehors = lambda a, b, n, d: noir((a[0] + n[0] * d, a[1] + n[1] * d), (b[0] + n[0] * d, b[1] + n[1] * d))
        def mur_(a, b, n, pas=0.5 / k):
            run = best_ = 0
            for i in range(int(0.16 / pas)):
                run = run + 1 if dehors(a, b, n, i * pas) >= 0.7 else 0; best_ = max(best_, run)
            return best_ * pas >= 0.04
        murs_ = [mur_(a, b, n) for a, b, n in cotes]
        if sum(murs_) != 3:
            continue
        # rectangle du tableau calé sur la niche : chaque côté fermé va jusqu'au bord de son mur (premier noir franc), à 5 cm au plus
        # (3124 : rectangle lu 2 à 4 cm en retrait des murs, des encoches restaient au fond de la niche, comblées en béton)
        pas = 0.5 / k
        for (ca, cb, cn), m_ in zip(cotes, murs_):
            if not m_:
                continue
            d = next((i * pas for i in range(int(0.06 / pas)) if dehors(ca, cb, cn, i * pas) >= 0.7), 0.0)
            if d > 0.004:
                if cn[0]:
                    f['x'] = sorted([round((x0 if cn[0] < 0 else x1) + cn[0] * d, 3), x1 if cn[0] < 0 else x0])
                else:
                    f['z'] = sorted([round((z0 if cn[1] < 0 else z1) + cn[1] * d, 3), z1 if cn[1] < 0 else z0])
                x0, x1, z0, z1 = min(f['x']), max(f['x']), min(f['z']), max(f['z'])
        cotes = [((x0, z0), (x1, z0), (0, -1)), ((x0, z1), (x1, z1), (0, 1)), ((x0, z0), (x0, z1), (-1, 0)), ((x1, z0), (x1, z1), (1, 0))]
        a, b, n = cotes[murs_.index(False)]; L = math.dist(a, b)
        if not 0.35 <= L <= 0.8:
            continue
        best = None
        for ch, autre in ((a, b), (b, a)):
            u = ((autre[0] - ch[0]) / L, (autre[1] - ch[1]) / L)
            # pivot à 4 cm près du coin (huisserie), points du vantail comptés au-delà de 7 cm du côté (hors des traits de l'huisserie)
            for dn in (0.0, 0.02, 0.04):
                for du in (-0.02, 0.0, 0.02):
                    pv = (ch[0] + n[0] * dn + u[0] * du, ch[1] + n[1] * dn + u[1] * du)
                    for deg in range(15, 71, 2):
                        t = math.radians(deg); d = (math.cos(t) * u[0] + math.sin(t) * n[0], math.cos(t) * u[1] + math.sin(t) * n[1])
                        pts = [(pv[0] + d[0] * r, pv[1] + d[1] * r) for r in [0.9 * L * i / 30 for i in range(31)] if r * math.sin(t) + dn > 0.07]
                        if len(pts) < 8:
                            continue
                        sc = sum(sombre(*q, 1) < 128 for q in pts) / len(pts)
                        if best is None or sc > best[0]:
                            best = (sc, ch, autre, deg, (pv[0] + d[0] * L, pv[1] + d[1] * L))
        if not best or best[0] < 0.9:
            continue
        sc, ch, autre, deg, bout = best
        oid = f'p_tableau{len(ajout) or ""}'
        dp = 0.05  # porte sur le nu de la niche, son épaisseur vers le tableau (huisserie au droit des murs qui la bordent)
        pp = [[round(ch[0] + n[0] * dp, 3), round(ch[1] + n[1] * dp, 3)], [round(autre[0] + n[0] * dp, 3), round(autre[1] + n[1] * dp, 3)]]
        # épaisseur de la porte du côté gauche de p0 → p1 (lire.assemble_un) : vers le tableau
        if -(pp[1][1] - pp[0][1]) * ((x0 + x1) / 2 - pp[0][0]) + (pp[1][0] - pp[0][0]) * ((z0 + z1) / 2 - pp[0][1]) < 0:
            pp.reverse()
        ajout[oid] = {'kind': 'door', 'p': pp, 'charniere': pp[0] if math.dist(pp[0], ch) < math.dist(pp[1], ch) else pp[1], 'ouvre_vers': [round(bout[0], 3), round(bout[1], 3)],
                      'depth': dp, 'label': 'Tableau électrique', '_arc': True, '_vantail': True}
        log.append(f"porte du tableau électrique ajoutée d'après son vantail dessiné (charnière ({ch[0]:.2f} ; {ch[1]:.2f}), {L:.2f} m, ouvert à {deg}°)")
    ops.update(ajout)
    return ajout


def descentes_ep(fixtures, textes, cercles, rooms=(), image=None, log=None):
    """descente d'eaux pluviales que la lecture a oubliée (constat du 28/09/2026) : un texte « DEP » ou « EP » du plan accompagné d'un cercle
    de 6 à 16 cm de diamètre à 30 cm au plus (T2 432 : « DEP » écrit à côté d'un cercle de 10 cm dans l'angle de la loggia) ; plan en image
    (image) : un disque plein gris ou noir de 8 à 15 cm posé sur le bord d'une loggia (3124 : disque gris de 11 cm à l'angle de la loggia).
    Ajoutée à fixtures si aucune descente n'est déjà à 30 cm."""
    log = log if log is not None else []
    deps = [f for f in fixtures if f.get('type') == 'dep' and f.get('p')]
    ajout = []
    def pose(c, r, pourquoi):
        if any(math.dist(c, f['p']) < 0.3 for f in deps + ajout):
            return
        ajout.append({'type': 'dep', 'p': [round(c[0], 3), round(c[1], 3)], 'r': round(max(0.03, min(0.08, r)), 3)})
        log.append(f"descente d'eaux pluviales ajoutée ({c[0]:.2f} ; {c[1]:.2f}, {2 * r * 100:.0f} cm) : {pourquoi}")
    for t in textes or []:
        if not (isinstance(t, list) and len(t) >= 3 and re.fullmatch(r'D?\.?E\.?P\.?', str(t[2]).strip().upper())):
            continue
        cs = [c for c in cercles or [] if 0.03 <= c[2] <= 0.08 and math.dist(c[:2], t[:2]) <= 0.3]
        if cs:
            c = min(cs, key=lambda c: math.dist(c[:2], t[:2]))
            pose(c[:2], c[2], f"texte « {str(t[2]).strip()} » et son cercle sur le plan")
    if image:
        try:
            import numpy as np
            from PIL import Image
            im = np.asarray(Image.open(image['chemin']).convert('L'))
        except Exception:
            im = None
        loggias = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and exterieure(r)]
        if im is not None and loggias:
            import cv2
            k = image['px_par_m']; ox, oz = image['origine_px']
            for nom_, masque in (('gris', (im > 90) & (im < 210)), ('noir', im < 90)):
                # ouverture de 5 px : les traits fins (quadrillage du dallage, hachures) qui touchent le disque en sont détachés
                masque = cv2.morphologyEx(masque.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
                n, lab, st, cen = cv2.connectedComponentsWithStats(masque, 8)
                for i in range(1, n):
                    x, y, w, h, a = st[i]
                    d = (w + h) / 2 / k
                    if not (0.08 <= d <= 0.15) or abs(w - h) > 0.2 * max(w, h) or not (0.7 <= a / (w * h) <= 0.86):
                        continue
                    c = ((cen[i][0] - ox) / k, (cen[i][1] - oz) / k)
                    if any(L.exterior.distance(Point(c)) <= 0.12 for L in loggias):
                        pose(c, d / 2, f"disque {nom_} au bord de la loggia sur le plan")
    fixtures.extend(ajout)
    return ajout


def portes_image(ops, image, log=None):
    """plan en image (pas d'arcs vectoriels) : charnière et sens de chaque porte lus sur le dessin. Pour chacune des quatre hypothèses
    (charnière à un bout ou à l'autre, ouverture d'un côté ou de l'autre), on regarde l'image le long de l'arc de débattement théorique
    (rayon : largeur du vantail, entre 10° et 40° d'ouverture, là où l'arc ne se confond ni avec le mur ni avec le vantail fermé) :
    l'hypothèse dont l'arc est dessiné (traits ou tirets plus sombres que le fond, sur 80 % des angles au moins) remplace la lecture
    si l'arc de la lecture l'est nettement moins (30 points de moins).
    image : {'chemin', 'px_par_m', 'origine_px'} ; ops modifiés sur place. Constat du 28/09/2026 (3124, fiche C4) : la porte de la
    chambre 1 était lue avec sa charnière au nord, alors que le vantail et l'arc partent du jambage sud (paire symétrique avec la chambre 2)."""
    log = log if log is not None else []
    try:
        from PIL import Image
        im = Image.open(image['chemin']).convert('L')
    except Exception:
        return ops
    W_, H_ = im.size; px = im.load(); k = image['px_par_m']; ox, oz = image['origine_px']
    def sombre(x, z):  # pixel le plus sombre à ±2 px du point
        u, v = int(round(ox + x * k)), int(round(oz + z * k)); best = 255
        for du in range(-2, 3):
            for dv in range(-2, 3):
                if 0 <= u + du < W_ and 0 <= v + dv < H_:
                    best = min(best, px[u + du, v + dv])
        return best
    for oid, o in ops.items():
        # porte du coffret posée d'après son vantail dessiné (portes_coffret_image) : déjà lue sur l'image ; un arc essayé vers l'intérieur de
        # la niche y rencontrerait les murs du fond, sombres, et passerait pour dessiné
        if o.get('kind') not in ('door', 'entry') or not o.get('p') or o.get('_vantail'):
            continue
        (p0, p1) = o['p']; L = math.dist(p0, p1)
        if L < 0.5:
            continue
        u = ((p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L); sd = o.get('side', 1); T = (-u[1] * sd, u[0] * sd); dp = o.get('depth', 0.1)
        scores = {}
        for ch in ('s0', 's1'):
            for sw in (1, -1):
                face = dp if sw > 0 else 0.0
                sh, st = (L - 0.04, 0.04) if ch == 's1' else (0.04, L - 0.04)
                r = abs(st - sh); fer = ((st - sh) / r * u[0], (st - sh) / r * u[1]); ouv = (T[0] * sw, T[1] * sw)
                Hh = (p0[0] + u[0] * sh + T[0] * face, p0[1] + u[1] * sh + T[1] * face)
                n = vu = 0
                for deg in range(10, 41):  # un angle compte si l'arc y est dessiné, à un rayon entre la largeur du vantail et celle de la baie
                    a = math.radians(deg); n += 1
                    vu += any(sombre(Hh[0] + rr * (math.cos(a) * fer[0] + math.sin(a) * ouv[0]), Hh[1] + rr * (math.cos(a) * fer[1] + math.sin(a) * ouv[1])) < 200
                              for rr in [r - 0.03 + 0.015 * i for i in range(9)])
                scores[(ch, sw)] = vu / max(n, 1)
        rang = sorted(scores.items(), key=lambda kv: -kv[1])
        (ch, sw), best = rang[0]; lu = scores.get((o.get('hinge'), o.get('swing')), 0.0)
        # l'arc est dessiné presque partout pour la meilleure hypothèse, et nettement moins pour la lecture (murs et meubles voisins
        # assombrissent aussi quelques points des autres hypothèses)
        if best < 0.8 or best - lu < 0.3:
            continue
        if (o.get('hinge'), o.get('swing')) != (ch, sw):
            log.append(f"porte {oid} lue sur le dessin (arc de débattement) : charnière {o.get('hinge')}→{ch}, sens {o.get('swing')}→{sw}")
            o['hinge'], o['swing'] = ch, sw
    return ops


# ---------- robinetterie de baignoire ----------
def croix(traits, lmax=0.3):
    """repères « + » du plan : deux traits courts perpendiculaires qui se coupent près de leurs milieux"""
    tr = [t for t in traits or [] if isinstance(t, list) and len(t) == 2 and all(isinstance(p, list) and len(p) == 2 for p in t) and 0.02 < math.dist(*t) < lmax]
    mil = lambda t: ((t[0][0] + t[1][0]) / 2, (t[0][1] + t[1][1]) / 2)
    uni = lambda t: ((t[1][0] - t[0][0]) / math.dist(*t), (t[1][1] - t[0][1]) / math.dist(*t))
    out = []
    for i, a in enumerate(tr):
        for b in tr[i + 1:]:
            ma, mb = mil(a), mil(b)
            if math.dist(ma, mb) < 0.03 and abs(uni(a)[0] * uni(b)[0] + uni(a)[1] * uni(b)[1]) < 0.2:
                out.append(((ma[0] + mb[0]) / 2, (ma[1] + mb[1]) / 2))
    return out


def cote_robinet(f, cx):
    """petit côté de la baignoire f dont le quart contient un repère « + » (x0, x1, z0, z1), sinon None"""
    (x0, x1), (z0, z1) = f['x'], f['z']; lx = x1 - x0 >= z1 - z0
    for c in cx:
        if x0 <= c[0] <= x1 and z0 <= c[1] <= z1:
            t = (c[0] - x0) / (x1 - x0) if lx else (c[1] - z0) / (z1 - z0)
            if t < 0.25 or t > 0.75:
                return ('x' if lx else 'z') + ('0' if t < 0.25 else '1')
    return None


def lignes_cote(segments, ax, c, a, b, marge=0.12):
    """traits parallèles à un côté (axe 0 : horizontal à z = c, étendue a..b en x ; axe 1 : vertical à x = c), à moins de « marge » de lui :
    {(coordonnée arrondie au mm, épaisseur): part du côté couverte}"""
    L = max(b - a, 1e-6); groupes = {}
    for s in segments or []:
        x0, z0, x1, z1, w = s
        if ax == 0 and abs(z1 - z0) <= 0.02 * abs(x1 - x0) and abs((z0 + z1) / 2 - c) <= marge:
            cc, lo, hi = (z0 + z1) / 2, min(x0, x1), max(x0, x1)
        elif ax == 1 and abs(x1 - x0) <= 0.02 * abs(z1 - z0) and abs((x0 + x1) / 2 - c) <= marge:
            cc, lo, hi = (x0 + x1) / 2, min(z0, z1), max(z0, z1)
        else:
            continue
        lo, hi = max(lo, a), min(hi, b)
        if hi > lo:
            groupes.setdefault((round(cc, 3), w), []).append((lo, hi))
    out = {}
    for k, iv in groupes.items():
        iv.sort(); tot, cur = 0, None
        for lo, hi in iv:
            if cur and lo <= cur[1] + 0.005:
                cur[1] = max(cur[1], hi)
            else:
                tot += (cur[1] - cur[0]) if cur else 0; cur = [lo, hi]
        tot += (cur[1] - cur[0]) if cur else 0
        out[k] = tot / L
    return out


def cote_facade(T, segments, couvert=0.7):
    """côté d'un compartiment (rectangle shapely) dessiné en trait fin — la façade du coffret, comme la façade coulissante d'un placard —
    alors que les autres côtés le sont en trait gras (cloisons). Constat du 28/09/2026 (D201) : côté ouest de la GTL, rectangle de 5 cm en
    trait de 0,24 pt, cloisons nord, est et sud en 0,54 pt ; duplex 3081 : façade de la GTL du séjour en 0,03 pt, cloisons en 0,28 pt.
    Rend (nom, ligne extérieure, ligne intérieure) ou None : au moins deux traits fins sur ce côté, tous au plus aux 2/3 de l'épaisseur
    des traits des autres côtés, dont deux au moins sont en trait gras."""
    if not segments:
        return None
    x0, z0, x1, z1 = T.bounds
    cotes = {'n': (0, z0, x0, x1, -1), 's': (0, z1, x0, x1, 1), 'w': (1, x0, z0, z1, -1), 'e': (1, x1, z0, z1, 1)}
    ep = {}
    for nom, (ax, c, a, b, sens) in cotes.items():
        lg = {k: v for k, v in lignes_cote(segments, ax, c, a, b).items() if v >= couvert}
        if lg:
            ep[nom] = (max(w for _, w in lg), sorted({cc for cc, _ in lg}), sens)
    for nom, (wmax, pos, sens) in ep.items():
        autres = [e[0] for n2, e in ep.items() if n2 != nom]
        if len(pos) < 2 or len(autres) < 2 or wmax <= 0:
            continue
        ref = min(autres)
        if wmax <= ref / 1.5:
            ext = min(pos) if sens < 0 else max(pos)  # trait côté pièce (hors du compartiment)
            inn = max(pos) if sens < 0 else min(pos)
            return nom, ext, inn
    return None


def gaines_symboles(quads, segments=None, taille=(0.2, 1.5)):
    """gaines techniques dessinées avec le symbole de la légende « Gaine technique » (D201) : dans un même tracé, un rectangle et un
    quadrilatère qui partage trois de ses coins, le quatrième à l'intérieur (le triangle du symbole). Rend des rectangles shapely, agrandis
    jusqu'aux cloisons qui les bordent en trait gras (D201, gaine du coin cuisine : cloison de 7 cm à l'est et au sud, dessinée avec elle)."""
    par = {}
    for q in quads or []:
        par.setdefault(q[2], []).append(q)
    out = []
    for qs in par.values():
        if len(qs) != 2:
            continue
        rects = [q for q in qs if Polygon(q[0]).buffer(0).area > 0 and abs(Polygon(q[0]).buffer(0).area - box(*Polygon(q[0]).bounds).area) < 1e-4]
        for R in rects:
            T = next(q for q in qs if q is not R)
            B = box(*Polygon(R[0]).bounds); x0, z0, x1, z1 = B.bounds
            if not (taille[0] <= x1 - x0 <= taille[1] and taille[0] <= z1 - z0 <= taille[1]):
                continue
            coins = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
            sur = [p for p in T[0] if any(math.dist(p, c) < 0.005 for c in coins)]
            dedans = [p for p in T[0] if not any(math.dist(p, c) < 0.005 for c in coins)]
            m = 0.15 * min(x1 - x0, z1 - z0)
            if len(sur) != 3 or len(dedans) != 1 or not (x0 + m < dedans[0][0] < x1 - m and z0 + m < dedans[0][1] < z1 - m):
                continue
            gras = 1.5 * max(R[1], 0.01)
            ext = {'x0': x0, 'z0': z0, 'x1': x1, 'z1': z1}
            for nom, (ax, c, a, b, sens) in {'z0': (0, z0, x0, x1, -1), 'z1': (0, z1, x0, x1, 1), 'x0': (1, x0, z0, z1, -1), 'x1': (1, x1, z0, z1, 1)}.items():
                lg = [cc for (cc, w), v in lignes_cote([s for s in segments or [] if s[4] >= gras], ax, c + sens * 0.085, a, b, marge=0.05).items() if v >= 0.7 and 0.04 <= (cc - c) * sens <= 0.13]
                if lg:
                    ext[nom] = max(lg) if sens > 0 else min(lg)
            out.append(box(ext['x0'], ext['z0'], ext['x1'], ext['z1']))
            break
    return out


def hors_gaines(r, gaines):
    """rectangle [x0, x1, z0, z1] d'une cuisine indicative sans les gaines qu'il recouvre : le plus grand des rectangles restants"""
    x0, x1, z0, z1 = r
    for g in gaines:
        gx0, gz0, gx1, gz1 = g.bounds
        if min(x1, gx1) - max(x0, gx0) <= 0.01 or min(z1, gz1) - max(z0, gz0) <= 0.01:
            continue
        cands = [(x0, min(x1, gx0), z0, z1), (max(x0, gx1), x1, z0, z1), (x0, x1, z0, min(z1, gz0)), (x0, x1, max(z0, gz1), z1)]
        cands = [c for c in cands if c[1] - c[0] >= 0.1 and c[3] - c[2] >= 0.1]
        if not cands:
            return None
        x0, x1, z0, z1 = max(cands, key=lambda c: (c[1] - c[0]) * (c[3] - c[2]))
    return [round(x0, 3), round(x1, 3), round(z0, 3), round(z1, 3)]


def compartiments_tableau(P, traits, log=None, blancs=(), segments=None):
    """tableau électrique (GTL) dessiné dans une boîte fermée : chaque côté de son rectangle qui ne donne pas sur un mur, mais que le plan
    borde de deux traits parallèles (de 2 à 15 cm l'un de l'autre, sur 70 % du côté au moins), est une cloison ou la façade du coffret.
    Elle est ajoutée entre ces traits, sans mordre sur un placard voisin. Sans elle, le coffret ressortait dans la pièce comme un panneau
    posé seul, et le placard voisin était ouvert sur le côté (on voyait son étagère et sa tringle).
    Constats du 28/09/2026 : D201, retour de l'utilisateur sur le placard de l'entrée (joue x 3,825-3,934 et façade z 1,563-1,634, comme
    les cloisons clGtl et clGtlN du relevé fait à la main) ; duplex 3081, GTL du séjour (façade x 7,255-7,305).
    PDF vectoriel seulement (traits) ; un tableau posé dans un placard (432 : porte « Placard TE ») ou contre un mur n'est pas touché."""
    log = log if log is not None else []
    if not traits and not blancs:
        return []
    traits = traits or []
    rect = lambda f: box(min(f['x']), min(f['z']), max(f['x']), max(f['z']))
    W = unary_union([Polygon(quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')]
                    + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', []) if len(g.get('poly', [])) >= 3])
    placards = [rect(f) for f in P.get('fixtures', []) if f.get('type') == 'placard' and f.get('x') and f.get('z')]
    # segments des traits, horizontaux (axe 0 : coordonnée z, étendue en x) ou verticaux (axe 1 : coordonnée x, étendue en z)
    segs = []
    # traits du plan, et bords des remplissages blancs (une cloison dessinée en aplat blanc que la lecture n'a pas reprise : 432, tirage
    # « regul-1 », cloison ouest du coffret « Placard TE »)
    bords = [[q[i], q[(i + 1) % len(q)]] for q in (blancs or []) if isinstance(q, list) and len(q) >= 3 for i in range(len(q))]
    for t in list(traits) + bords:
        for a, b in zip(t, t[1:]):
            L = math.dist(a, b)
            if L < 0.1:
                continue
            if abs(b[1] - a[1]) <= 0.02 * L:
                segs.append((0, (a[1] + b[1]) / 2, min(a[0], b[0]), max(a[0], b[0])))
            elif abs(b[0] - a[0]) <= 0.02 * L:
                segs.append((1, (a[0] + b[0]) / 2, min(a[1], b[1]), max(a[1], b[1])))
    ajout = []
    for f in P.get('fixtures', []):
        if f.get('type') != 'tableau' or not f.get('x') or not f.get('z'):
            continue
        T = rect(f)
        if any(T.intersection(q).area >= 0.5 * T.area for q in placards):
            continue
        x0, z0, x1, z1 = T.bounds
        # côté : (axe des traits, coordonnée, étendue, normale sortante)
        cotes = {'n': (0, z0, (x0, x1), (0, -1)), 's': (0, z1, (x0, x1), (0, 1)), 'w': (1, x0, (z0, z1), (-1, 0)), 'e': (1, x1, (z0, z1), (1, 0))}
        # façade du coffret (trait fin, les cloisons en trait gras) : ce côté reste ouvert sur la pièce, le tableau s'y voit (relevé fait à
        # la main du D201 : niche ouverte sur le dégagement, seules clGtl et clGtlN la ferment). Une cloison lue sur la façade est retirée
        # du compartiment, et le tableau va jusqu'au trait de façade côté pièce. Sans porte de coffret sur ce côté (plan-du-lot : porte)
        fac = cote_facade(T, segments)
        if fac:
            nomf, ext, inn = fac; ax, c, (a, b), n = cotes[nomf]
            cote_l = LineString([(a, c), (b, c)] if ax == 0 else [(c, a), (c, b)])
            if any(o.get('p') and LineString(o['p']).buffer(0.12).intersection(cote_l).length >= 0.5 * cote_l.length for o in P.get('openings', {}).values()):
                fac = None
        if fac:
            if ax == 0:
                zone = box(x0, min(ext, z0) - 0.01, x1, z1) if n[1] < 0 else box(x0, z0, x1, max(ext, z1) + 0.01)
            else:
                zone = box(min(ext, x0) - 0.01, z0, x1, z1) if n[0] < 0 else box(x0, z0, max(ext, x1) + 0.01, z1)
            neufs, retire = [], []
            for w in P['walls']:
                if w.get('k') != 'cloison' or w.get('virtual'):
                    neufs.append(w); continue
                g = Polygon(quad(w)).buffer(0)
                if g.intersection(zone).area < 2e-4:
                    neufs.append(w); continue
                retire.append(w['id'])
                for k, q in enumerate(q for q in polys(g.difference(zone).buffer(-0.002, **MITRE).buffer(0.002, **MITRE)) if q.area > 2e-4):
                    neufs += [{**{k2: v for k2, v in w.items() if k2 not in ('a', 'b', 't', 'side')}, 'id': f"{w['id']}-f{k}", 'poly': ring(c_)} for c_ in convexes(q)]
            P['walls'] = neufs
            if ax == 0:
                f['z'] = [round(ext, 3), f['z'][1]] if n[1] < 0 else [f['z'][0], round(ext, 3)]
            else:
                f['x'] = [round(ext, 3), f['x'][1]] if n[0] < 0 else [f['x'][0], round(ext, 3)]
            f['facade'] = nomf
            T = rect(f); x0, z0, x1, z1 = T.bounds
            cotes = {'n': (0, z0, (x0, x1), (0, -1)), 's': (0, z1, (x0, x1), (0, 1)), 'w': (1, x0, (z0, z1), (-1, 0)), 'e': (1, x1, (z0, z1), (1, 0))}
            W = unary_union([Polygon(quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')]
                            + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', []) if len(g.get('poly', [])) >= 3])
            log.append(f"coffret du tableau électrique ouvert côté {nomf} : façade en trait fin sur le plan ({'z' if ax == 0 else 'x'} {min(ext, inn):.3f}-{max(ext, inn):.3f})"
                       + (f", cloison lue retirée devant lui ({', '.join(retire)})" if retire else ''))
        for nom, (ax, c, (a, b), n) in cotes.items():
            if fac and nom == fac[0]:
                continue
            pts = [(a + (b - a) * i / 20, c) if ax == 0 else (c, a + (b - a) * i / 20) for i in range(1, 20)]
            if sum(W.contains(Point(p[0] + n[0] * 0.03, p[1] + n[1] * 0.03)) for p in pts) >= 0.8 * len(pts):
                continue  # déjà contre un mur
            # côté fermé par une porte (le vantail fermé est souvent dessiné en aplat blanc entre deux traits) : pas de cloison
            cote_l = LineString([(a, c), (b, c)] if ax == 0 else [(c, a), (c, b)])
            if any(o.get('p') and LineString(o['p']).distance(cote_l) < 0.1 and LineString(o['p']).buffer(0.1).intersection(cote_l).length >= 0.5 * cote_l.length
                   for o in P.get('openings', {}).values()):
                continue
            lignes = [s for s in segs if s[0] == ax and abs(s[1] - c) <= 0.12 and min(b, s[3]) - max(a, s[2]) >= 0.7 * (b - a)]
            if len(lignes) < 2:
                continue
            # groupe de traits le plus fourni sur 15 cm au plus : les deux faces de la cloison ou de la façade
            cs = sorted({round(s[1], 3) for s in lignes})
            grp = max(([v for v in cs if u <= v <= u + 0.15] for u in cs), key=len)
            lo, hi = grp[0], grp[-1]
            if hi - lo < 0.02:
                continue
            # étendue : celle du trait extérieur (la face vue de la pièce) ; le trait de façade d'un placard voisin, plus long, ne
            # prolonge pas la cloison devant ses portes, et le trait intérieur, plus court, n'ouvre pas de jour dans l'angle
            ext = hi if n[ax ^ 1] > 0 else lo
            ex = [s for s in lignes if abs(round(s[1], 3) - ext) < 0.004]
            e0, e1 = max(a - 0.15, min(s[2] for s in ex)), min(b + 0.15, max(s[3] for s in ex))
            # un bout qui arrive à quelques millimètres d'un mur le rejoint (pas de fente) ; sinon il s'arrête au trait (pas d'ergot)
            m = (lo + hi) / 2
            dans = lambda t: W.contains(Point(t, m) if ax == 0 else Point(m, t))
            e0 -= 0.02 if dans(e0 - 0.015) else 0
            e1 += 0.02 if dans(e1 + 0.015) else 0
            g = box(e0, lo, e1, hi) if ax == 0 else box(lo, e0, hi, e1)
            g = g.difference(W)
            for q in placards:
                g = g.difference(q)
            g = g.buffer(-0.005, **MITRE).buffer(0.005, **MITRE)  # sans languette de moins d'un centimètre
            parts = [p for p in convexes(g) if p.area > 2e-4]
            for part in parts:
                ajout.append({'id': f'gtl{len(ajout)}', 'k': 'cloison', 'poly': ring(part)})
            if parts:
                W = W.union(unary_union(parts))
                log.append(f"coffret du tableau électrique fermé côté {nom} : cloison entre les deux traits du plan "
                           f"({'z' if ax == 0 else 'x'} {lo:.3f}-{hi:.3f})")
        # le tableau occupe l'intérieur de son compartiment, ni plus ni moins : chaque côté qui mord sur un mur (D201 : 3,5 cm dans la cloison
        # ouest, 7,5 cm dans la joue est) ou qui s'arrête à quelques centimètres de lui (plan-du-lot : 3,5 cm devant la cloison nord, le
        # coffret flottait) est ramené au nu du mur, s'il le trouve sur 80 % de sa longueur
        x0, z0, x1, z1 = T.bounds
        bords = {'x0': x0, 'x1': x1, 'z0': z0, 'z1': z1}
        for nom, (ax, sens) in {'x0': (0, -1), 'x1': (0, 1), 'z0': (1, -1), 'z1': (1, 1)}.items():
            c = bords[nom]; a, b = (bords['z0'], bords['z1']) if ax == 0 else (bords['x0'], bords['x1'])  # côtés en x d'abord, déjà ramenés
            dec = []
            for i in range(1, 10):
                t = a + (b - a) * i / 10
                at = lambda d: Point(c + sens * d, t) if ax == 0 else Point(t, c + sens * d)
                # décalage vers le dehors (positif, 6 cm au plus) ou le dedans (négatif, 12 cm au plus) jusqu'au nu du mur
                if W.contains(at(0.002)):
                    d = next((-e / 1000 for e in range(0, 121) if not W.contains(at(-e / 1000 + 0.002))), None)
                else:
                    d = next((e / 1000 for e in range(0, 61) if W.contains(at(e / 1000 + 0.002))), None)
                if d is not None:
                    dec.append(d)
            if len(dec) >= 7:
                dec.sort(); bords[nom] = c + sens * dec[len(dec) // 2]
        if bords['x1'] - bords['x0'] > 0.1 and bords['z1'] - bords['z0'] > 0.1 and max(abs(bords[k] - v) for k, v in zip(('x0', 'z0', 'x1', 'z1'), T.bounds)) > 0.004:
            f['x'], f['z'] = [round(bords['x0'], 3), round(bords['x1'], 3)], [round(bords['z0'], 3), round(bords['z1'], 3)]
            log.append(f"tableau électrique ramené au nu des murs de son compartiment (x {f['x'][0]:.3f}-{f['x'][1]:.3f}, z {f['z'][0]:.3f}-{f['z'][1]:.3f})")
    ajout = decoupe(ajout, P.get('openings', {}))
    P['walls'] += ajout
    return ajout


def robinets(P, traits, log=None):
    """baignoire : robinetterie du petit côté où le plan dessine son repère « + » (sinon le moteur la pose en x0 ou z0)"""
    log = log if log is not None else []
    cx = croix(traits)
    for f in P.get('fixtures', []):
        if f.get('type') == 'bath' and f.get('x') and f.get('z') and (c := cote_robinet(f, cx)):
            defaut = 'x0' if f['x'][1] - f['x'][0] >= f['z'][1] - f['z'][0] else 'z0'
            if f.get('tap', defaut) != c:
                log.append(f"baignoire : robinetterie côté {c} (repère du plan)")
            if c == defaut:
                f.pop('tap', None)
            else:
                f['tap'] = c


# ---------- équipements posés contre les murs ----------
def _jusquau_mur(W, p, d, lim=0.14):
    """distance de p au premier mur dans la direction d (None au-delà de lim)"""
    hit = LineString([p, (p[0] + d[0] * lim, p[1] + d[1] * lim)]).intersection(W)
    return None if hit.is_empty else Point(p).distance(hit)


def equipements(P, log=None):
    log = log if log is not None else []
    W = unary_union([Polygon(quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    for f in P.get('fixtures', []):
        t = f.get('type')
        try:
            if t in ('vanity', 'towel') and f.get('dir') and f.get('x'):
                dx, dz = f['dir']; n = math.hypot(dx, dz) or 1; dx, dz = dx / n, dz / n
                (x0, x1), (z0, z1) = sorted(f['x']), sorted(f['z'])
                # milieu du dos (côté opposé à dir), puis on recule jusqu'au mur
                bx = x0 if dx > 0.5 else x1 if dx < -0.5 else (x0 + x1) / 2
                bz = z0 if dz > 0.5 else z1 if dz < -0.5 else (z0 + z1) / 2
                g = _jusquau_mur(W, (bx, bz), (-dx, -dz))
                if g is not None and 0.004 < g <= 0.14:
                    f['x'] = [round(x0 - dx * g, 3), round(x1 - dx * g, 3)]; f['z'] = [round(z0 - dz * g, 3), round(z1 - dz * g, 3)]
                    log.append(f'{t} recollé au mur ({g * 100:.0f} cm)')
            elif t == 'wc' and f.get('p') and f.get('dir'):
                dx, dz = f['dir']; n = math.hypot(dx, dz) or 1; dx, dz = dx / n, dz / n
                g = _jusquau_mur(W, tuple(f['p']), (-dx, -dz))
                if g is not None and 0.004 < g <= 0.14:
                    f['p'] = [round(f['p'][0] - dx * g, 3), round(f['p'][1] - dz * g, 3)]; log.append(f'WC recollé au mur ({g * 100:.0f} cm)')
            elif t == 'shower' and f.get('x') and not f.get('valve'):
                (x0, x1), (z0, z1) = sorted(f['x']), sorted(f['z'])
                cotes = [((x0, (z0 + z1) / 2), (1, 0), z1 - z0), ((x1, (z0 + z1) / 2), (-1, 0), z1 - z0), (((x0 + x1) / 2, z0), (0, 1), x1 - x0), (((x0 + x1) / 2, z1), (0, -1), x1 - x0)]
                murés = [c for c in cotes if W.contains(Point(c[0][0] - c[1][0] * 0.04, c[0][1] - c[1][1] * 0.04))]
                if murés:
                    # robinetterie au fond de la douche : le côté muré opposé au côté ouvert, sinon le plus long
                    ouverts = [c for c in cotes if c not in murés]
                    fond = next((c for c in murés for o in ouverts if c[1][0] == -o[1][0] and c[1][1] == -o[1][1]), None) or max(murés, key=lambda c: c[2])
                    f['valve'] = {'wall': [round(fond[0][0], 3), round(fond[0][1], 3)], 'dir': list(fond[1])}
            elif t == 'dep' and f.get('p'):
                # descente EP lue dans l'épaisseur du mur (432, tirage « base2 » : centre à 7 cm du nu, le tuyau pris dans le mur, seul son
                # sommet dépassait dans la maquette) : ramenée contre le nu, du côté de la pièce la plus proche, à 12 cm au plus
                r_ = f.get('r', 0.05); c = Point(f['p'])
                if W.buffer(-0.001).intersects(c.buffer(r_ * 0.9)):
                    libre = unary_union([Polygon(q['poly']).buffer(0) for q in P.get('rooms', []) if len(q.get('poly', [])) >= 3 and not q.get('hidden')]).difference(W.buffer(r_ + 0.005))
                    if not libre.is_empty:
                        from shapely.ops import nearest_points
                        q = nearest_points(libre, c)[0]
                        if q.distance(c) <= 0.12:
                            f['p'] = [round(q.x, 3), round(q.y, 3)]; log.append(f'descente EP ramenée hors du mur ({q.distance(c) * 100:.0f} cm)')
        except (TypeError, ValueError, KeyError):
            continue
    return P


# ---------- ce que le plan dessine et que la lecture a oublié (constats du 28/09/2026, L1-18) ----------
# pièce d'eau d'après son nom ou son id : « eau » seulement en début de mot (« salle d'eau »), jamais dans « bureau » ou « plateau »
PIECE_EAU = re.compile(r"bain|douche|(?<![a-z])(eau|sdb|sde)")


def recale_equipements(P, quads, log=None):
    """vasque, sèche-serviettes, baignoire et douche recalés sur le rectangle que le plan dessine pour eux (constat du 28/09/2026, D201 : vasque
    lue de 0,59 m au lieu de 0,80, un jour de 21 cm contre la baignoire ; sèche-serviettes décalé de 21 cm). Parmi les rectangles tracés en
    trait fin (quads de l'extraction, 0,03 à 3 m²), celui qui recouvre le mieux l'équipement (rapport intersection / union d'au moins 0,25,
    centre à 25 cm au plus, chaque dimension entre 0,5 et 2 fois la lue) le remplace. Sèche-serviettes (symbole plus mince que l'appareil) :
    seule sa position et sa longueur le long du mur sont reprises."""
    log = log if log is not None else []
    rects = []
    for q in quads or []:
        pts = q[0]; xs, zs = [p[0] for p in pts], [p[1] for p in pts]
        x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs)
        if not all((abs(p[0] - x0) < 2e-3 or abs(p[0] - x1) < 2e-3) and (abs(p[1] - z0) < 2e-3 or abs(p[1] - z1) < 2e-3) for p in pts):
            continue
        if min(x1 - x0, z1 - z0) >= 0.02 and 0.005 <= (x1 - x0) * (z1 - z0) <= 3.0 and (len(q) < 2 or q[1] <= 0.5):
            rects.append((x0, x1, z0, z1))
    rects = list(dict.fromkeys(rects))
    iou = lambda a, b: (max(0, min(a[1], b[1]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[2], b[2]))) / max(1e-9, (a[1] - a[0]) * (a[3] - a[2]) + (b[1] - b[0]) * (b[3] - b[2]) - max(0, min(a[1], b[1]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[2], b[2])))
    for f in P.get('fixtures', []):
        t = f.get('type')
        if t not in ('vanity', 'towel', 'bath', 'shower') or not f.get('x') or not f.get('z'):
            continue
        a = (min(f['x']), max(f['x']), min(f['z']), max(f['z'])); w, h = a[1] - a[0], a[3] - a[2]
        best = None
        for r in rects:
            rw, rh = r[1] - r[0], r[3] - r[2]
            if t == 'towel':  # le long de son grand côté
                lx = w < h  # mur vertical : longueur en z
                la, lr = ((a[2], a[3]), (r[2], r[3])) if lx else ((a[0], a[1]), (r[0], r[1]))
                ta, tr = ((a[0], a[1]), (r[0], r[1])) if lx else ((a[2], a[3]), (r[2], r[3]))
                if (rh < rw) == lx or min(ta[1], tr[1]) - max(ta[0], tr[0]) < -0.02 or not 0.5 <= (lr[1] - lr[0]) / (la[1] - la[0]) <= 2:
                    continue
                sc = max(0, min(la[1], lr[1]) - max(la[0], lr[0])) / (max(la[1], lr[1]) - min(la[0], lr[0]))
                if abs((la[0] + la[1]) / 2 - (lr[0] + lr[1]) / 2) > 0.25:
                    continue
            else:
                if not (0.5 <= rw / w <= 2 and 0.5 <= rh / h <= 2) or math.dist(((a[0] + a[1]) / 2, (a[2] + a[3]) / 2), ((r[0] + r[1]) / 2, (r[2] + r[3]) / 2)) > 0.25:
                    continue
                sc = iou(a, r)
            if sc >= 0.25 and (best is None or sc > best[0]):
                best = (sc, r)
        if not best:
            continue
        r = best[1]
        if t == 'towel':
            n = (list(a[:2]), [round(r[2], 3), round(r[3], 3)]) if w < h else ([round(r[0], 3), round(r[1], 3)], list(a[2:]))
        else:
            n = ([round(r[0], 3), round(r[1], 3)], [round(r[2], 3), round(r[3], 3)])
        if max(abs(n[0][0] - a[0]), abs(n[0][1] - a[1]), abs(n[1][0] - a[2]), abs(n[1][1] - a[3])) < 0.02:
            continue
        log.append(f"{t} recalé sur son dessin : x {a[0]:.2f}-{a[1]:.2f} → {n[0][0]:.2f}-{n[0][1]:.2f}, z {a[2]:.2f}-{a[3]:.2f} → {n[1][0]:.2f}-{n[1][1]:.2f}")
        f['x'], f['z'] = n
    return P


def aligne_nus(P, log=None):
    """lame de mur de moins de 9 mm collée sur toute sa longueur à un autre mur, l'autre face libre (D201, séjour : béton de 5 mm en saillie
    sur 28 cm) : retirée, la face du mur qu'elle double devient le nu. Les marches qui restent entre deux faces d'une même paroi sont
    effacées sur les masses dessinées (nus_masses, appelé par lire.calc_masses)."""
    log = log if log is not None else []
    ws = [w for w in P.get('walls', []) if not w.get('virtual')]
    gs = [valide(Polygon(quad(w)).buffer(0)) for w in ws]
    lames = []
    for i, (w, g) in enumerate(zip(ws, gs)):
        if g.is_empty or g.area > 0.01:
            continue
        c = list(g.minimum_rotated_rectangle.exterior.coords)
        cotes = sorted(math.dist(c[j], c[j + 1]) for j in range(4))
        if cotes[0] >= 0.009 or cotes[-1] < 0.05:
            continue
        autres = unary_union([h for j, h in enumerate(gs) if j != i and j not in lames])
        # une seule grande face collée à un mur, l'autre libre (sinon c'est un joint qui ferme une fente : gardé)
        e = max(((c[j], c[j + 1]) for j in range(4)), key=lambda ab: math.dist(*ab)); L = math.dist(*e) or 1
        u = ((e[1][0] - e[0][0]) / L, (e[1][1] - e[0][1]) / L); nn = (-u[1], u[0]); m = g.centroid; dd = cotes[0] / 2 + 0.002
        cote_ = [sum(autres.contains(Point(m.x + nn[0] * sg * dd + u[0] * t * L * 0.4, m.y + nn[1] * sg * dd + u[1] * t * L * 0.4)) for t in (-1, 0, 1)) for sg in (1, -1)]
        if sorted(cote_) == [0, 3] and g.boundary.intersection(autres.buffer(0.0005)).length >= 0.8 * cotes[-1] + cotes[0]:
            lames.append(i)
    if lames:
        retire = {id(ws[i]) for i in lames}
        P['walls'] = [w for w in P['walls'] if id(w) not in retire]
        log.append(f"{len(lames)} lame(s) de mur de moins de 9 mm doublant un autre mur retirée(s)")
    return len(lames)


def nus_masses(GS, P, tol=0.015, amax=math.radians(4)):
    """nus d'une même paroi alignés sur les masses murales dessinées (constats du 28/09/2026 : plan-du-lot, chambre 1, voile en saillie de
    5 mm sur la cloison lue, et jambage de la porte du rangement en saillie de 5 mm sur le mur du séjour ; D201, séjour, béton à 3,570 entre
    deux cloisons à 3,575 et un morceau en biais pour les raccorder ; 3124, murs d'un plan en image). Une marche de moins d'1 cm entre deux
    faces se voyait du plafond à la plinthe (tirets de la petite face prise entre deux faces, plinthe cassée).
    GS : polygones shapely des masses (murs et gaines unis). Les faces des baies (linteaux et allèges, dessinés d'après la baie) en font
    partie. Faces presque parallèles (4°), tournées du même côté, à moins d'1 cm l'une de la droite de l'autre et bout à bout (2 cm au plus) :
    une paroi, regroupée de proche en proche ; chaque face vue d'une pièce (hors placards et coffrets) est ramenée sur la droite de la plus
    longue face de sa paroi, et une baie de la paroi y est décalée (P['openings'] modifié). Rend les polygones corrigés (un polygone qui se
    déformerait est gardé tel quel)."""
    GS = [G for G in GS if G.geom_type == 'Polygon' and not G.is_empty]
    if not GS:
        return GS
    Mu = unary_union(GS)
    # jamais contre un placard (joues posées au nu) ; la niche ouverte du tableau, elle, se voit (D201 : marches de 5 mm au fond)
    loin = [box(min(f['x']), min(f['z']), max(f['x']), max(f['z'])).buffer(0.03) for f in P.get('fixtures', []) if f.get('type') == 'placard' and f.get('x') and f.get('z')]
    # ni les bouts de mur au droit d'une baie (jambages : l'huisserie y est posée ; plan-du-lot, porte du rangement : un cran d'angle
    # corrigé reculait le jambage de 12 mm, fente de part en part)
    jambages = []  # (zone, direction du jambage)
    for o in (P.get('openings') or {}).values():
        if o.get('p') and len(o['p']) == 2:
            (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2); L = math.dist(p0, p1)
            if L > 1e-3:
                T = (-(p1[1] - p0[1]) / L * sd, (p1[0] - p0[0]) / L * sd)
                jambages += [(LineString([q, (q[0] + T[0] * dp, q[1] + T[1] * dp)]).buffer(0.025), T) for q in (p0, p1)]
    loin = unary_union(loin) if loin else Polygon()
    Jz = unary_union([z for z, _ in jambages]) if jambages else Polygon()
    rings = []  # (polygone, anneau, sommets)
    for gi, G in enumerate(GS):
        rings.append((gi, 0, list(G.exterior.coords)[:-1]))
        rings += [(gi, hi + 1, list(h.coords)[:-1]) for hi, h in enumerate(G.interiors)]
    aretes = []  # (anneau ou -1, i ou (baie, face), a, b, longueur, u, normale vers le dehors, vue)
    for k, (gi, _, q) in enumerate(rings):
        for i in range(len(q)):
            a, b = q[i], q[(i + 1) % len(q)]; L = math.dist(a, b)
            if L < 0.02:
                continue
            u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L); m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            n = next((n for n in ((u[1], -u[0]), (-u[1], u[0])) if not Mu.contains(Point(m[0] + n[0] * 0.003, m[1] + n[1] * 0.003))), None)
            if n is None:
                continue
            # toute face, vue d'une pièce ou de dehors (loggia : sa dalle déborde de la pièce), sauf contre un placard, et sauf un bout de mur
            # au droit d'une baie (face dans le sens du jambage : l'huisserie y est posée)
            # (le bout de mur au droit d'une baie ne va que sur le bout de la baie : jambage, voir plus bas)
            seg = LineString([a, b])
            jb = any(z.intersects(seg) and abs(u[0] * T[0] + u[1] * T[1]) > 0.9 for z, T in jambages)
            vu = 'jambage' if jb and not loin.intersects(seg) else not loin.intersects(seg) and not jb
            aretes.append((k, i, a, b, L, u, n, vu))
    baies = {}
    for oid, o in (P.get('openings') or {}).items():
        if not o.get('p') or len(o['p']) != 2:
            continue
        (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2); L = math.dist(p0, p1)
        if L < 0.05:
            continue
        u = ((p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L); T = (-u[1] * sd, u[0] * sd); baies[oid] = T
        for f_, (d, n) in enumerate(((0.0, (-T[0], -T[1])), (dp, T))):
            a, b = (p0[0] + T[0] * d, p0[1] + T[1] * d), (p1[0] + T[0] * d, p1[1] + T[1] * d)
            aretes.append((-1, (oid, f_), a, b, L, u, n, True))
        # bouts de la baie (l'huisserie y est posée) : références fixes, prioritaires ; le bout de mur voisin y est ramené (duplex, porte
        # de la chambre 1 : mur arrêté 1 cm avant la baie, marche au-dessus du linteau)
        for q, n in ((p0, u), (p1, (-u[0], -u[1]))):
            aretes.append((-2, (oid, 'bout'), q, (q[0] + T[0] * dp, q[1] + T[1] * dp), max(dp, 0.02), T, n, False))
    N = len(aretes); par = list(range(N))
    def racine(x):
        while par[x] != x:
            par[x] = par[par[x]]; x = par[x]
        return x
    for i1 in range(N):
        e = aretes[i1]
        for i2 in range(i1 + 1, N):
            f = aretes[i2]
            if f[6][0] * e[6][0] + f[6][1] * e[6][1] < math.cos(amax):
                continue
            g_, h_ = (e, f) if e[4] >= f[4] else (f, e)  # distance mesurée depuis la droite de la plus longue
            fa, fu, fn = g_[2], g_[5], g_[6]
            d = [(p[0] - fa[0]) * fn[0] + (p[1] - fa[1]) * fn[1] for p in (h_[2], h_[3])]
            if max(abs(v) for v in d) > tol:
                continue
            sa, sb = sorted((p[0] - fa[0]) * fu[0] + (p[1] - fa[1]) * fu[1] for p in (h_[2], h_[3]))
            if sa > g_[4] + 0.02 or sb < -0.02:
                continue
            par[racine(i1)] = racine(i2)
    groupes = {}
    for i1 in range(N):
        groupes.setdefault(racine(i1), []).append(i1)
    deplace, bouge = {}, {}
    for membres in groupes.values():
        if len(membres) < 2:
            continue
        bouts = [aretes[j] for j in membres if aretes[j][0] == -2]
        ref = max(bouts, key=lambda e: e[4]) if bouts else max((aretes[j] for j in membres), key=lambda e: e[4]); fa, fn = ref[2], ref[6]
        if min(abs(fn[0]), abs(fn[1])) < 0.01:  # droite presque d'axe (0,6°) : d'axe, calée au millimètre (l'arrondi des sommets ne recrée pas de marche)
            fn = (float(round(fn[0])), float(round(fn[1])))
            c = round(((ref[2][0] + ref[3][0]) / 2) if fn[0] else ((ref[2][1] + ref[3][1]) / 2), 3)
            fa = (c, 0.0) if fn[0] else (0.0, c)
        for j in membres:
            k, i, a, b, L, u, n, vu = aretes[j]
            if not vu or k == -2 or (vu == 'jambage' and not bouts):
                continue
            if k == -1:  # face de baie : décalage de la face le long de sa normale
                m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dm = (m[0] - fa[0]) * fn[0] + (m[1] - fa[1]) * fn[1]
                if abs(dm) >= 2e-4:
                    bouge.setdefault(i[0], {})[i[1]] = -dm * (n[0] * fn[0] + n[1] * fn[1])
                continue
            for jj, p in ((i, a), ((i + 1) % len(rings[k][2]), b)):
                d = (p[0] - fa[0]) * fn[0] + (p[1] - fa[1]) * fn[1]
                if abs(d) >= 2e-4:
                    deplace.setdefault((k, jj), []).append((fa, fn))
    # sommet d'angle : sur les droites de ses deux parois (intersection), sinon projeté sur la seule
    for (k, jj), dr in list(deplace.items()):
        p = rings[k][2][jj]; (fa, fn) = dr[0]
        autre = next((x for x in dr[1:] if abs(x[1][0] * fn[1] - x[1][1] * fn[0]) > 0.5), None)
        if autre:
            (ga, gn) = autre; c1, c2 = fa[0] * fn[0] + fa[1] * fn[1], ga[0] * gn[0] + ga[1] * gn[1]; det = fn[0] * gn[1] - fn[1] * gn[0]
            deplace[(k, jj)] = ((c1 * gn[1] - c2 * fn[1]) / det, (fn[0] * c2 - gn[0] * c1) / det)
        else:
            d = (p[0] - fa[0]) * fn[0] + (p[1] - fa[1]) * fn[1]
            deplace[(k, jj)] = (p[0] - fn[0] * d, p[1] - fn[1] * d)
    # crans d'angle : une ou deux petites arêtes (moins de 2 cm) entre deux faces de 5 cm et plus non parallèles (D201, angle séjour-entrée :
    # cran de 7 × 8 mm, loggia : 8 mm ; WC : entaille en V de 7 mm) ; les sommets du cran vont à l'intersection des deux faces
    for k, (gi, _, q) in enumerate(rings):
        n_ = len(q)
        if n_ < 5:
            continue
        pos = [deplace.get((k, j), q[j]) for j in range(n_)]
        for j in range(n_):
            for c in (1, 2):  # cran de c arêtes courtes, de j à j + c
                a0, a1 = pos[(j - 1) % n_], pos[j]; b0, b1 = pos[(j + c) % n_], pos[(j + c + 1) % n_]
                if math.dist(a0, a1) < 0.05 or math.dist(b0, b1) < 0.05:
                    continue
                cran = [pos[(j + t) % n_] for t in range(c + 1)]
                if any(math.dist(cran[t], cran[t + 1]) >= 0.02 for t in range(c)) or any(loin.contains(Point(p)) or Jz.contains(Point(p)) for p in cran):
                    continue
                ua = ((a1[0] - a0[0]) / math.dist(a0, a1), (a1[1] - a0[1]) / math.dist(a0, a1)); ub = ((b1[0] - b0[0]) / math.dist(b0, b1), (b1[1] - b0[1]) / math.dist(b0, b1))
                det = ua[0] * ub[1] - ua[1] * ub[0]
                if abs(det) < math.sin(math.radians(30)):
                    # cran dans une face droite (entaille en V, pointe) : ses sommets reviennent sur la face
                    if ua[0] * ub[0] + ua[1] * ub[1] > 0.99 and abs((b0[0] - a1[0]) * ua[1] - (b0[1] - a1[1]) * ua[0]) < 0.002:
                        for t in range(c + 1):
                            p = pos[(j + t) % n_]; s_ = (p[0] - a1[0]) * ua[0] + (p[1] - a1[1]) * ua[1]
                            X = (a1[0] + ua[0] * s_, a1[1] + ua[1] * s_); deplace[(k, (j + t) % n_)] = X; pos[(j + t) % n_] = X
                        break
                    continue
                t_ = ((b0[0] - a0[0]) * ub[1] - (b0[1] - a0[1]) * ub[0]) / det; X = (a0[0] + ua[0] * t_, a0[1] + ua[1] * t_)
                if max(math.dist(X, p) for p in cran) > 0.025 or not Mu.buffer(0.02).contains(Point(X)):
                    continue
                for t in range(c + 1):
                    deplace[(k, (j + t) % n_)] = X; pos[(j + t) % n_] = X
                break
    # bout de mur au droit d'une baie : ses sommets à moins de 1,5 cm du bout de la baie y sont ramenés (duplex, porte de la chambre 1 :
    # entaille de 1 × 1 cm à l'angle du jambage, marche au-dessus du linteau)
    for oid, o in (P.get('openings') or {}).items():
        if not o.get('p') or len(o['p']) != 2 or oid not in baies:
            continue
        (p0, p1), dp, T = o['p'], o.get('depth', 0.2), baies[oid]; L = math.dist(p0, p1); u = ((p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L)
        for q in (p0, p1):
            for k, (gi, _, r) in enumerate(rings):
                for j, p0_ in enumerate(r):
                    pc = deplace.get((k, j), p0_); v = (pc[0] - q[0], pc[1] - q[1]); t_ = v[0] * T[0] + v[1] * T[1]; d_ = v[0] * u[0] + v[1] * u[1]
                    if not (1e-4 < abs(d_) < 0.015 and -0.01 <= t_ <= dp + 0.01):
                        continue
                    # jamais le bout d'une longue face qui longe la baie (elle pencherait) : seulement les petites entailles du jambage
                    voisins = [deplace.get((k, (j + e) % len(r)), r[(j + e) % len(r)]) for e in (-1, 1)]
                    if any(math.dist(w, pc) > 0.03 and abs((w[0] - pc[0]) * T[0] + (w[1] - pc[1]) * T[1]) > 0.9 * math.dist(w, pc) for w in voisins):
                        continue
                    deplace[(k, j)] = (pc[0] - u[0] * d_, pc[1] - u[1] * d_)
    out = []
    for gi, G in enumerate(GS):
        ks = [k for k, r in enumerate(rings) if r[0] == gi]
        if not any((k, j) in deplace for k in ks for j in range(len(rings[k][2]))):
            out.append(G); continue
        nr = [[deplace.get((k, j), p) for j, p in enumerate(rings[k][2])] for k in ks]
        nr = [[p for t, p in enumerate(r) if t == 0 or math.dist(p, r[t - 1]) > 1e-9] for r in nr]
        try:
            H = valide(Polygon(nr[0], nr[1:]), trou_min=0)
            parts = [c for c in polys(H) if c.area > 1e-5]
        except Exception:
            parts = []
        ok = len(parts) == 1 and abs(parts[0].area - G.area) <= 0.02 * G.area + 0.01 and len(parts[0].interiors) == len(G.interiors)
        if not ok and os.environ.get('NUS_DEBUG'):
            print('nus_masses : masse gardée telle quelle', [round(v, 2) for v in G.bounds], len(parts), [round(c.area, 4) for c in parts], G.area)
        out.append(parts[0] if ok else G)
    # baies décalées avec leur paroi : face 0 (le long de p) de d0, face 1 (à « depth ») de d1, chacune vers le dehors de la baie
    for oid, mv in bouge.items():
        o = P['openings'][oid]; T = baies[oid]; d0, d1 = mv.get(0, 0.0), mv.get(1, 0.0)
        if max(abs(d0), abs(d1)) > tol:
            continue
        o['p'] = [[round(q[0] - T[0] * d0, 4), round(q[1] - T[1] * d0, 4)] for q in o['p']]
        o['depth'] = round(o.get('depth', 0.2) + d0 + d1, 4)
    return out


SIGLES_APPAREILS = {'LL', 'LV', 'SL', 'LS', 'R', 'F', 'FR', 'REF', 'C', 'CU', 'CUI', 'TRI', 'CE', 'BAL', 'NOURRICES', 'NOURICES'}


def emplacements(P, extract, log=None):
    """emplacement indicatif d'un appareil dessiné en pointillés avec son sigle (constat du 28/09/2026 : lave-linge « LL » du WC du D201,
    nourrices du WC du duplex) que la lecture n'a pas repris : ajouté aux emplacements indicatifs (kitchenHint, plan 2D seulement), le
    rectangle des pointillés autour du sigle (40 cm à 1,2 m de côté)."""
    log = log if log is not None else []
    if not extract:
        return P
    kh = P.setdefault('kitchenHint', [])
    dans_kh = lambda x, z: any(isinstance(k, dict) and isinstance(k.get('r'), list) and k['r'][0] - 0.05 <= x <= k['r'][1] + 0.05 and k['r'][2] - 0.05 <= z <= k['r'][3] + 0.05 for k in kh)
    pts = [q for l in extract.get('pointilles') or [] for q in (l if isinstance(l, list) else []) if isinstance(q, list) and len(q) == 2]
    for t in extract.get('textes') or []:
        if not (isinstance(t, list) and len(t) >= 3):
            continue
        mot = str(t[2]).strip(); cle = mot.upper().replace('.', '')
        if cle not in SIGLES_APPAREILS or dans_kh(t[0], t[1]):
            continue
        # dans une pièce de ce plan (sur un plan à plusieurs niveaux, les textes de la page valent pour tous les niveaux)
        if not any(Polygon(r['poly']).buffer(0).contains(Point(t[0], t[1])) for r in P.get('rooms', []) if len(r.get('poly', [])) >= 3 and not r.get('of')):
            continue
        prs = [q for q in pts if abs(q[0] - t[0]) < 0.7 and abs(q[1] - t[1]) < 0.7]
        if len(prs) < 3:
            continue
        x0, x1, z0, z1 = min(q[0] for q in prs), max(q[0] for q in prs), min(q[1] for q in prs), max(q[1] for q in prs)
        if not (0.4 <= x1 - x0 <= 1.2 and 0.4 <= z1 - z0 <= 1.2 and x0 - 0.02 <= t[0] <= x1 + 0.02 and z0 - 0.02 <= t[1] <= z1 + 0.02):
            continue
        # jamais par-dessus un emplacement déjà lu (les pointillés voisins de la cuisine se mêleraient au rectangle)
        B = box(x0, z0, x1, z1)
        if any(isinstance(k, dict) and isinstance(k.get('r'), list) and B.intersection(box(k['r'][0], k['r'][2], k['r'][1], k['r'][3])).area > 0.1 * B.area for k in kh):
            continue
        kh.append({'r': [round(x0, 3), round(x1, 3), round(z0, 3), round(z1, 3)], 't': 'nourrices' if cle.startswith('NOUR') else mot})
        log.append(f"emplacement indicatif « {mot} » ajouté d'après ses pointillés ({x0:.2f} ; {z0:.2f} à {x1:.2f} ; {z1:.2f})")
    return P


def soffites(P, extract, log=None):
    """plafond abaissé (soffite, faux plafond) que le plan de vente hachure et que sa légende nomme (constat du 28/09/2026, D201 : Entrée et
    salle de bains hachurées, « Soffite : 2,20m HSP environ », le plan 2D y écrivait la hauteur générale « HSP 2,50 » ; duplex : cellier
    hachuré « HSP=2.25m » ; plan-du-lot : « Faux-plafond ou soffite »). Chaque pièce couverte à 30 % au moins par les zones hachurées
    (0,3 m² et plus) reçoit soffite = {part, y} ; y : hauteur écrite dans la pièce (« HSP=2.25m »), sinon celle de la légende, sinon None."""
    log = log if log is not None else []
    if not extract:
        return P
    mots = [t for t in (extract.get('textes_hors_plan') or []) + (extract.get('textes') or []) if isinstance(t, list) and len(t) >= 3]
    leg = [t for t in mots if re.search(r'soffite|faux[- ]?plafond', str(t[2]), re.I)]
    if not leg:
        return P
    num_ = lambda w: (lambda m: float(m.group(1).replace(',', '.')) if m and 1.8 <= float(m.group(1).replace(',', '.')) <= 2.6 else None)(re.search(r'(\d[,.]\d{1,2})\s*m?\b', str(w)))
    y_leg = None
    for t in leg:  # hauteur sur la même ligne de la légende, à droite du mot (« Soffite : 2,20m HSP environ »)
        for u in sorted((u for u in mots if u is not t and abs(u[1] - t[1]) <= 3 and 0 < u[0] - t[0] < 250), key=lambda u: u[0]):
            if (h := num_(u[2])) is not None:
                y_leg = h; break
        if y_leg is None and (h := num_(t[2])) is not None:
            y_leg = h
        if y_leg is not None:
            break
    H = [Polygon(h['poly']).buffer(0) for h in extract.get('hachures') or [] if len(h.get('poly', [])) >= 3]
    H = [h for h in H if h.area >= 0.3]
    locaux = [(t[0], t[1], num_(t[2])) for t in extract.get('textes') or [] if isinstance(t, list) and len(t) >= 3 and re.search(r'HSP|H\.S\.P', str(t[2])) and num_(t[2])]
    for r in P.get('rooms', []):
        if r.get('hidden') or r.get('of') or exterieure(r) or len(r.get('poly', [])) < 3:
            continue
        g = Polygon(r['poly']).buffer(0)
        if g.area <= 0:
            continue
        part = sum(g.intersection(h).area for h in H) / g.area
        if part < 0.3:
            continue
        y = next((h for x, z, h in locaux if g.contains(Point(x, z))), None) or y_leg
        r['soffite'] = {'part': round(min(1.0, part), 2), 'y': y}
        # pièce entièrement sous le soffite, hauteur connue, aucune baie plus haute : plafond abaissé aussi dans la maquette (poly : la pièce
        # élargie d'1 cm, dans l'épaisseur des murs, pour qu'aucun jour ne reste entre le soffite et les murs ; retombée visible aux passages)
        hautes = [o for o in (P.get('openings') or {}).values() if o.get('p') and o.get('kind') in ('window', 'french', 'door', 'entry') and o.get('head', 2.08) > (y or 9) + 0.005
                  and LineString(o['p']).distance(g) < 0.5 and g.buffer(0.45).intersects(LineString(o['p']))]
        if part >= 0.9 and y and y <= P.get('H', 2.5) - 0.1 and not hautes:
            # élargi d'1 cm dans les murs seulement (jamais au-delà d'un passage ni devant la face d'un mur voisin : lèvre de 1 cm visible)
            W_ = unary_union([Polygon(quad(w)).buffer(0) for w in P.get('walls', []) if not w.get('virtual')] + [Polygon(q['poly']).buffer(0) for q in P.get('gaines', []) if len(q.get('poly', [])) >= 3])
            r['soffite']['poly'] = ring(max(polys(valide(unary_union([g, g.buffer(0.01, **MITRE).intersection(W_)]))), key=lambda c: c.area))
        log.append(f"« {r.get('name') or r['id']} » : plafond abaissé sur {part * 100:.0f} % de la pièce ({'hauteur ' + format(y, '.2f') if y else 'hauteur non écrite'})")
    return P


def piece_eau(r):
    return bool(PIECE_EAU.search((str(r.get('id', '')) + ' ' + str(r.get('name', ''))).lower()))


def bandes_traits(traits, emin, emax, lmin, lmax=None):
    """bandes entre deux traits parallèles du plan (écart de emin à emax), sur leur longueur commune (lmin à lmax)"""
    segs = []
    for t in traits or []:
        if not (isinstance(t, list) and len(t) == 2 and all(isinstance(p, list) and len(p) == 2 for p in t)):
            continue
        L = math.dist(*t)
        if L >= lmin:
            segs.append((tuple(t[0]), tuple(t[1]), L))
    out = []
    for i, (a0, a1, La) in enumerate(segs):
        u = ((a1[0] - a0[0]) / La, (a1[1] - a0[1]) / La); n = (-u[1], u[0])
        for b0, b1, Lb in segs[i + 1:]:
            v = ((b1[0] - b0[0]) / Lb, (b1[1] - b0[1]) / Lb)
            if abs(u[0] * v[1] - u[1] * v[0]) > 0.03:
                continue
            d0 = (b0[0] - a0[0]) * n[0] + (b0[1] - a0[1]) * n[1]; d1 = (b1[0] - a0[0]) * n[0] + (b1[1] - a0[1]) * n[1]
            if abs(d0 - d1) > 0.01 or not emin <= abs(d0) <= emax:
                continue
            s = sorted(((b0[0] - a0[0]) * u[0] + (b0[1] - a0[1]) * u[1], (b1[0] - a0[0]) * u[0] + (b1[1] - a0[1]) * u[1]))
            lo, hi = max(0.0, s[0]), min(La, s[1])
            if hi - lo < lmin or (lmax and hi - lo > lmax):
                continue
            d = (d0 + d1) / 2
            p = lambda s_, e: (a0[0] + u[0] * s_ + n[0] * e, a0[1] + u[1] * s_ + n[1] * e)
            out.append(Polygon([p(lo, 0), p(hi, 0), p(hi, d), p(lo, d)]))
    return out


def _axe(g):
    """(longueur, épaisseur moyenne, vecteur unitaire du grand côté) d'une bande"""
    c = list(g.minimum_rotated_rectangle.exterior.coords)
    e = max(((c[k], c[k + 1]) for k in range(4)), key=lambda s: math.dist(*s)); L = math.dist(*e)
    return L, (g.area / L if L else 0), (((e[1][0] - e[0][0]) / L, (e[1][1] - e[0][1]) / L) if L else (1, 0))


def cloisons_oubliees(walls, rooms, gaines, ops, extract, lues, log=None):
    """cloisons que le plan dessine entre deux pièces et que la lecture n'a pas reprises : bande blanche étroite non classée
    (remplissage), ou bande entre deux traits parallèles (cloison dessinée au trait). Une bande n'est retenue que là où rien ne
    sépare les deux pièces (ni mur, ni gaine, ni baie) et qu'elle a une pièce différente de chaque côté sur 60 % de cette longueur :
    entre une entrée et un séjour ouverts l'un sur l'autre, le plan ne dessine ni bande ni double trait.
    Constats du 28/09/2026 : 432, remplissage n° 27 (3,20 m entre chambre et séjour) et n° 55 non classés ; D201, cloison au
    trait de 0,82 m entre salle de bain et séjour oubliée par cloisons_ajout. Renvoie les murs à ajouter (avant la soudure)."""
    log = log if log is not None else []
    RP = [(r['id'], Polygon(r['poly']).buffer(0)) for r in rooms
          if len(r.get('poly', [])) >= 3 and not r.get('hidden') and not r.get('of') and not exterieure(r)]
    if len(RP) < 2 or not extract:
        return []
    cov = [Polygon(quad(w)).buffer(0) for w in walls if not w.get('virtual') and not w.get('_exclu')]
    cov += [Polygon(g['poly']).buffer(0) for g in gaines if len(g.get('poly', [])) >= 3]
    for o in ops.values():
        p = o.get('p'); dp = o.get('depth') if isinstance(o.get('depth'), (int, float)) else 0.2
        if isinstance(p, list) and len(p) == 2 and math.dist(*p) > 0.05:
            cov.append(LineString(p).buffer(max(0.2, dp) + 0.12, cap_style=2))
    C = unary_union(cov).buffer(0.01)
    blancs = extract.get('remplissages_blancs') or []
    cands = [('blanc', i, Polygon(b).buffer(0)) for i, b in enumerate(blancs) if i not in set(lues) and len(b) >= 3]
    cands += [('traits', k, g) for k, g in enumerate(bandes_traits(extract.get('traits'), 0.035, 0.15, 0.25))]
    ajout, bandes = [], []
    for src, i, g in cands:
        if g.is_empty or g.area < 1e-4:
            continue
        L, w, (ux, uz) = _axe(g)
        if not (0.03 <= w <= 0.15 and L >= 0.3):
            continue
        U = g.difference(C)
        if U.is_empty or U.area / w < 0.25:
            continue
        m = g.centroid; Ub = U.buffer(0.005); ok = tot = 0; d = w / 2 + 0.04
        for k in range(int(L / 0.05) + 1):
            s = -L / 2 + k * 0.05; q = Point(m.x + ux * s, m.y + uz * s)
            if not Ub.contains(q):
                continue
            tot += 1
            a = next((rid for rid, rp in RP if rp.contains(Point(q.x - uz * d, q.y + ux * d))), None)
            b = next((rid for rid, rp in RP if rp.contains(Point(q.x + uz * d, q.y - ux * d))), None)
            ok += a is not None and b is not None and a != b
        if tot < 5 or ok < 0.6 * tot:
            continue
        if src == 'blanc':  # comme si la lecture l'avait classée
            ajout.append({'id': f'c{i}', 'k': 'cloison', 'poly': blancs[i]})
            log.append(f'cloison dessinée entre deux pièces et non lue (remplissage {i}, {U.area / w:.2f} m) : ajoutée')
        else:
            bandes.append(g)
    if bandes:  # doubles traits : une seule cloison par endroit, là où rien n'est déjà construit
        B = unary_union(bandes).difference(unary_union(cov) if cov else Polygon())
        for k, part in enumerate(q for p in polys(B) for q in convexes(p) if q.area > 5e-4):
            ajout.append({'id': f'ct{k}', 'k': 'cloison', 'poly': ring(part)})
        log.append(f'cloison dessinée au trait entre deux pièces et non lue : ajoutée ({B.area / 0.07:.2f} m environ)')
    return ajout


def placards_sur_tableau(fixtures, log=None):
    """un placard lu sur le même rectangle que le tableau électrique est un doublon : le coffret TE n'est pas un placard.
    Constat du 28/09/2026 (432, lecture gardée et base2) : la relecture le signale, l'arbitrage le garde (« B l'omet »)."""
    log = log if log is not None else []
    rect = lambda f: Polygon([(f['x'][0], f['z'][0]), (f['x'][1], f['z'][0]), (f['x'][1], f['z'][1]), (f['x'][0], f['z'][1])]).buffer(0)
    tabs = [rect(f) for f in fixtures if f.get('type') == 'tableau' and f.get('x') and f.get('z')]
    out = []
    for f in fixtures:
        if f.get('type') == 'placard' and f.get('x') and f.get('z') and tabs:
            g = rect(f)
            if any(g.intersection(t).area >= 0.5 * g.union(t).area for t in tabs if not g.is_empty):
                log.append(f"placard lu sur le tableau électrique ({f['x'][0]:.2f}-{f['x'][1]:.2f} ; {f['z'][0]:.2f}-{f['z'][1]:.2f}) : doublon écarté")
                continue
        out.append(f)
    return out


def seche_serviettes(P, traits, log=None):
    """sèche-serviettes dessiné et non lu : rectangle étroit (deux traits parallèles à 1,5-6 cm, de 0,35 à 0,80 m) parallèle à un
    mur de salle de bain et à 3-12 cm de lui (ses pattes), hors de tout autre équipement, de toute gaine et de toute baie, dans une pièce d'eau qui
    n'a pas encore de sèche-serviettes. Constat du 28/09/2026 : sur le 432, l'appel principal l'oublie 3 fois sur 4 et la relecture
    ne le signale jamais ; le plan le dessine pourtant au trait (x 1,30-1,80, à 6 cm du mur nord)."""
    log = log if log is not None else []
    eau = [r for r in P.get('rooms', []) if len(r.get('poly', [])) >= 3 and not r.get('hidden') and not r.get('of')
           and piece_eau(r)]
    if not eau or not traits:
        return
    W = unary_union([Polygon(quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')])
    # ni devant une baie : le vantail d'une porte coulissante ou l'appui d'une fenêtre est aussi un rectangle étroit le long du mur
    baies = [LineString(o['p']).buffer((o.get('depth') if isinstance(o.get('depth'), (int, float)) else 0.2) + 0.15)
             for o in P.get('openings', {}).values() if isinstance(o.get('p'), list) and len(o['p']) == 2]
    E = unary_union(emprises([f for f in P.get('fixtures', []) if f.get('type') != 'towel'])
                    + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', []) if len(g.get('poly', [])) >= 3]).buffer(0.02)
    E = unary_union([E] + baies)
    cands = sorted(bandes_traits(traits, 0.015, 0.06, 0.35, 0.8), key=lambda g: -_axe(g)[0])
    for g in cands:
        L, w, (ux, uz) = _axe(g)
        if not (abs(ux) > 0.995 or abs(uz) > 0.995) or g.intersects(E):
            continue
        m = g.centroid
        r = next((r for r in eau if Polygon(r['poly']).buffer(0).contains(m)), None)
        if r is None or any(f.get('type') == 'towel' and f.get('x') and f.get('z') and Polygon(r['poly']).buffer(0).contains(
                Point((f['x'][0] + f['x'][1]) / 2, (f['z'][0] + f['z'][1]) / 2)) for f in P.get('fixtures', [])):
            continue
        dmur = g.distance(W)
        if not 0.03 <= dmur <= 0.12:
            continue
        # le mur est d'un seul côté, dans l'axe perpendiculaire : c'est le dos ; dir va du mur vers la pièce
        n = (round(-uz), round(ux))
        dos = [s for s in (1, -1) if _jusquau_mur(W, (m.x, m.y), (n[0] * s, n[1] * s), lim=w / 2 + 0.13) is not None]
        if len(dos) != 1:
            continue
        b = (n[0] * dos[0], n[1] * dos[0]); x0, z0, x1, z1 = g.bounds
        e = _jusquau_mur(W, (m.x, m.y), b, lim=w / 2 + 0.13)
        mur = (m.x + b[0] * e, m.y + b[1] * e)
        xs = sorted((x0, x1) if b[0] == 0 else (mur[0], x1 if b[0] < 0 else x0))
        zs = sorted((z0, z1) if b[1] == 0 else (mur[1], z1 if b[1] < 0 else z0))
        f = {'type': 'towel', 'x': [round(v, 3) for v in xs], 'z': [round(v, 3) for v in zs], 'dir': [-b[0], -b[1]]}
        P.setdefault('fixtures', []).append(f)
        log.append(f"sèche-serviettes dessiné et non lu ({xs[0]:.2f}-{xs[1]:.2f} ; {zs[0]:.2f}-{zs[1]:.2f}, « {r.get('name') or r['id']} ») : ajouté")


def degage_placard(f, rooms, walls, log=None):
    """façade d'un placard murée par une cloison lue sur ses portes coulissantes (le trait des portes pris pour une cloison) :
    la cloison est retirée devant les portes. Seulement si aucun côté du placard ne donne librement sur une pièce (un placard
    a toujours un accès), si une pièce est derrière la cloison, et jamais pour un mur en béton.
    Constat du 28/09/2026 (D201, nouveau tirage 2) : placard de l'entrée muré par la cloison [3,64 ; 1,6]→[5,25 ; 1,6]."""
    log = log if log is not None else []
    x0, x1 = sorted(f['x']); z0, z1 = sorted(f['z'])
    cotes = {'s': ((x0, z1), (x1, z1), (0, 1)), 'n': ((x0, z0), (x1, z0), (0, -1)), 'e': ((x1, z0), (x1, z1), (1, 0)), 'w': ((x0, z0), (x0, z1), (-1, 0))}
    if f.get('face') not in cotes:
        return walls
    vis = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('hidden') and not r.get('of')]
    W = unary_union([Polygon(quad(w)).buffer(0) for w in walls if not w.get('virtual')])
    def libre(face):
        a, b, n = cotes[face]; m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        return LineString([(m[0] + n[0] * 0.02, m[1] + n[1] * 0.02), (m[0] + n[0] * 0.2, m[1] + n[1] * 0.2)]).intersection(W).length < 0.01
    if any(libre(k) and any(r.contains(Point(((a[0] + b[0]) / 2 + n[0] * 0.2, (a[1] + b[1]) / 2 + n[1] * 0.2))) for r in vis)
           for k, (a, b, n) in cotes.items()):
        return walls
    a, b, n = cotes[f['face']]; L = math.dist(a, b); u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    if not any(r.contains(Point(m[0] + n[0] * 0.25, m[1] + n[1] * 0.25)) for r in vis):
        return walls
    # bande devant les portes (de 3 cm dans le placard à 12 cm dans la pièce), sans les angles
    at = lambda s, d: (a[0] + u[0] * s + n[0] * d, a[1] + u[1] * s + n[1] * d)
    bande = Polygon([at(0.03, -0.03), at(L - 0.03, -0.03), at(L - 0.03, 0.12), at(0.03, 0.12)])
    trait = LineString([at(0.03, 0.03), at(L - 0.03, 0.03)])
    beton = unary_union([Polygon(quad(w)).buffer(0) for w in walls if not w.get('virtual') and w.get('k') != 'cloison'])
    if trait.intersection(beton).length > 0.3 * trait.length:
        return walls
    cible = []
    for w in walls:
        if w.get('virtual') or w.get('k') != 'cloison':
            continue
        g = Polygon(quad(w)).buffer(0)
        if g.intersection(bande).area < 1e-4:
            continue
        _, _, (vx, vz) = _axe(g)
        if abs(vx * u[0] + vz * u[1]) > 0.95:  # cloison parallèle à la façade (une cloison perpendiculaire, en bout, reste)
            cible.append(w)
    if not cible or trait.intersection(unary_union([Polygon(quad(w)).buffer(0) for w in cible])).length < 0.5 * trait.length:
        return walls
    out = []
    for w in walls:
        if w not in cible:
            out.append(w); continue
        base = {k: v for k, v in w.items() if k not in ('a', 'b', 't', 'side', 'poly', 'id')}
        for k, part in enumerate(convexes(Polygon(quad(w)).buffer(0).difference(bande))):
            if min(part.bounds[2] - part.bounds[0], part.bounds[3] - part.bounds[1]) > 0.015:
                out.append({**base, 'id': f"{w['id']}p{k}", 'poly': ring(part)})
    log.append(f"cloison lue sur la façade du placard ({x0:.2f}-{x1:.2f} ; {z0:.2f}-{z1:.2f}, côté {f['face']}) : retirée devant ses portes")
    return out


def niches(P, log=None):
    """pièce qui passe derrière l'une de ses portes (niche du tableau électrique englobée dans le séjour) : la même pièce des deux
    côtés d'une porte obligerait la visite à franchir une porte qui ne mène nulle part. La partie isolée par les murs et la porte
    (moins de 1,5 m²) est retirée de la pièce, avec les murs qui la bordent, jusqu'au droit de la porte.
    Constat du 28/09/2026 (432, nouveau tirage 2) : visite de contrôle ratée, « La porte TE ne se franchit pas »."""
    log = log if log is not None else []
    Wg = [Polygon(quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')]
    W = unary_union(Wg)
    for oid, o in P.get('openings', {}).items():
        if o.get('kind') != 'door' or not o.get('p'):
            continue
        (p0, p1), sd, dp = o['p'], o.get('side', 1), o.get('depth', 0.2)
        dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz)
        if L < 0.3:
            continue
        T = (-dz / L * sd, dx / L * sd); mid = ((p0[0] + p1[0]) / 2 + T[0] * dp / 2, (p0[1] + p1[1]) / 2 + T[1] * dp / 2)
        cote = lambda s: Point(mid[0] + T[0] * s * (dp / 2 + 0.1), mid[1] + T[1] * s * (dp / 2 + 0.1))
        for r in P['rooms']:
            if len(r.get('poly', [])) < 3 or r.get('of') or r.get('hidden'):
                continue
            rp = Polygon(r['poly']).buffer(0)
            if not (rp.contains(cote(1)) and rp.contains(cote(-1))):
                continue
            at = lambda p, d: (p[0] + T[0] * d, p[1] + T[1] * d)
            baie = Polygon([at(p0, -0.02), at(p1, -0.02), at(p1, dp + 0.02), at(p0, dp + 0.02)])
            morceaux = sorted(polys(rp.difference(W).difference(baie)), key=lambda q: -q.area)
            petits = [q for q in morceaux[1:] if q.area < 1.5 and q.area < 0.2 * rp.area and q.distance(baie) < 0.03]
            if not petits:
                continue
            # la niche, ses murs et la baie jusqu'au droit de la porte (ligne des jambages) : la pièce s'arrête à la porte
            bord = [g for g in Wg if any(g.distance(q) < 0.02 for q in petits)]
            cut = unary_union(petits + bord + [LineString([p0, p1]).buffer(0.001)]).convex_hull.intersection(unary_union(petits).buffer(0.15, **MITRE).union(baie))
            reste = sorted(polys(rp.difference(cut)), key=lambda q: -q.area)
            if not reste:
                continue
            q = reste[0].simplify(0.003, preserve_topology=True)
            r['poly'] = [[round(x, 3), round(z, 3)] for x, z in list(q.exterior.coords)[:-1]]
            log.append(f"« {r.get('name') or r['id']} » passait derrière la porte {oid} ({sum(p.area for p in petits):.2f} m²) : niche retirée de la pièce")

