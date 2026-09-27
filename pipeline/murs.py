"""Murs propres, sans IA : les morceaux d'aplats lus sur le plan deviennent des murs soudés, fermés sur les pièces,
d'équerre et découpés en morceaux convexes (le moteur ne sait heurter que des polygones convexes) ; chaque baie
est recalée entre ses deux jambages.

Toutes les distances sont en mètres, dans le repère du plan (x vers la droite, z vers le bas)."""
import math
from shapely import constrained_delaunay_triangles, make_valid
from shapely.geometry import LineString, Point, Polygon
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
def soude(walls, rooms, gaines=(), log=None):
    """murs en béton : soudés en une masse, limités aux abords du logement, fentes le long des pièces refermées.
    Les cloisons et les murs décrits par deux points restent tels quels (on retire juste ce qui chevauche le béton)."""
    log = log if log is not None else []
    beton = [w for w in walls if 'poly' in w and w.get('k') != 'cloison' and not w.get('virtual')]
    autres = [w for w in walls if w not in beton]
    rs = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('of')]  # placards (cachés) compris
    rs = [r for r in rs if not r.is_empty]
    if not beton or not rs:
        return walls
    R = unary_union(rs)
    # une gaine borde les murs comme une pièce : le voile au-dessus d'un conduit reste un mur du logement
    Rg = unary_union([R] + [Polygon(g['poly']).buffer(0) for g in gaines if len(g.get('poly', [])) >= 3])
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
    # un morceau qui ne borde aucune pièce ni gaine : flèche d'entrée, légende, trait isolé
    garde = [p for p in polys(M) if p.intersects(Rg.buffer(0.04)) and p.area > 0.003]
    ecart = len(polys(M)) - len(garde)
    M = unary_union(garde)
    # fente de moins de 26 cm (doublage isolant hachuré, jeu de lecture) entre la face d'un mur et le bord d'une pièce intérieure : fermeture morphologique du
    # logement plein (pièces + murs). Les baies, plus larges, restent ouvertes ; entre deux pièces, c'est la lecture qui décide.
    interieur = [Polygon(r['poly']).buffer(0) for r in rooms if len(r.get('poly', [])) >= 3 and not r.get('of') and not exterieure(r)]
    Ri = unary_union(interieur)
    plein = valide(unary_union([M, R] + [Polygon(g['poly']).buffer(0) for g in gaines]))
    clos = valide(valide(plein.buffer(0.13, **MITRE)).buffer(-0.13, **MITRE))
    entre = unary_union([a.buffer(0.16, **MITRE).intersection(b.buffer(0.16, **MITRE)) for i, a in enumerate(rs) for b in rs[i + 1:]])
    comble = clos.difference(plein).intersection(Ri.buffer(0.26, **MITRE)).difference(entre)
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
        jamb = {}
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
                jamb[bout] = min(vus, key=lambda g: g[1] - g[0])
        # on ne recale l'épaisseur que si les deux jambages s'accordent (une cloison perpendiculaire au bout de la baie
        # la traverse de part en part et laisse l'autre jambage décider) ; sinon l'épaisseur lue est gardée, mais les
        # bouts de la baie vont quand même jusqu'au trou du mur (plus loin)
        lo, hi = cur
        if len(jamb) == 2:
            l2, h2 = max(jamb['g'][0], jamb['d'][0]), min(jamb['g'][1], jamb['d'][1])
            if 0.03 <= h2 - l2 <= 0.65 and _ecart([l2, h2], cur) <= 0.3 and h2 - l2 <= max(2 * dp, dp + 0.12):
                lo, hi = l2, h2
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
            out.append({**base, 'id': f"{w['id']}{k}", 'poly': ring(part)}); k += 1
    return out


# ---------- enveloppe fermée ----------
def trous(P, pas=0.05):
    """bords de pièce intérieure qui ne donnent ni sur un mur, ni sur une baie, ni sur une autre pièce"""
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


def ferme(P, log=None):
    """referme chaque trou de l'enveloppe par un mur posé contre le bord de la pièce (béton côté extérieur, cloison entre pièces)"""
    log = log if log is not None else []
    ajout = []
    for k, h in enumerate(trous(P)):
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
def portes_arcs(ops, arcs, log=None, huisserie=0.038):
    """l'arc de débattement dessiné par l'architecte donne la charnière (son centre), le vantail (son rayon) et le sens
    d'ouverture (l'extrémité hors du mur) : la baie brute va du jambage côté charnière au jambage opposé, huisseries comprises"""
    log = log if log is not None else []
    arcs = [a for a in arcs or [] if isinstance(a, list) and len(a) == 4 and all(isinstance(v, list) and len(v) == 2 for v in a[:3])]
    for oid, o in ops.items():
        vitre = o.get('kind') in ('window', 'french')
        if not o.get('p') or not (o.get('kind') in ('door', 'entry') or (vitre and o.get('leaves', 2) == 1)):
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
            if not (lo - 0.08 <= nc <= hi + 0.08) or not (0.55 * L <= r <= 1.15 * L):
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
        if vitre:  # un vantail vitré s'ouvre toujours vers l'intérieur : seule la charnière est lue sur l'arc
            if o.get('hinge') != charniere:
                log.append(f"{'porte-fenêtre' if o['kind'] == 'french' else 'fenêtre'} {oid} : charnière {o.get('hinge', 's0')}→{charniere} (arc du plan)")
            o['hinge'] = charniere
            continue
        if L >= r + 0.04:  # la baie lue contient déjà vantail et huisseries (trou du mur retrouvé) : largeur gardée
            s0, s1 = 0.0, L
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
        except (TypeError, ValueError, KeyError):
            continue
    return P
