"""Logements sur plusieurs niveaux (duplex, triplex), sans IA.

Deux repères (voir moteur/SCHEMA.md) :
- repère de la page : celui d'extract.json, niveaux côte à côte dans des zones disjointes. L'IA y lit et répond ;
  assemble, check, relecture, arbitrage et apercu y travaillent.
- repère commun : celui de plan.json, niveaux superposés. Pour le niveau k : p_commun = p_page − decalage[k].

Chaîne : repartit (réponse et tracés découpés par zone) → assemble par niveau (code d'un seul niveau) → fusion
(level sur chaque élément) → controle (escaliers) → superpose (repère commun, levels, stairs, voids) → complete par
niveau → fusion et parties globales (arrêts, photos maquette, contexte, dalles). Un plan à un seul niveau ne passe
jamais ici."""
import copy, math, re
from shapely.geometry import LineString, MultiPoint, Point, Polygon, box
from shapely.ops import substring, unary_union

import murs

DALLE = 0.30      # d'étage à étage en plus de la HSP : dalle 0,26 + sol fini 0,02 + plafond 0,02
SOUS_DALLE = 0.28  # sous-face de la dalle portant un niveau, sous son sol fini
ECHAPPEE = 1.90
ECART_ARRETS = 1.5   # un arrêt « Escalier » jamais à moins de 1,5 m d'un arrêt du même niveau : panoramas presque identiques,
#                      points de passage l'un sur l'autre (duplex 3081 : « Escalier » à 41 cm de l'Entrée) ; l'arrêt voisin prend son rôle
H0 = 2.5


def _L():
    import lire  # import tardif : lire importe ce module
    return lire


def infos(extract):
    """niveaux de l'extraction du bas vers le haut, ou None pour un plan à un seul niveau"""
    niv = (extract or {}).get('niveaux')
    if not isinstance(niv, list) or len(niv) < 2:
        return None
    return sorted(niv, key=lambda n: n.get('ordre', 0))


def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _hsp(v):
    return round(float(v), 2) if _num(v) and 2.1 <= v <= 3.6 else None


def plan_niveaux(extract, A=None):
    """niveaux retenus, du bas vers le haut : [{id, nom, zone, dec, H, y, lu}] ; nom lu par l'IA sinon sur le plan,
    hauteur du niveau lue, sinon la HSP générale lue, sinon 2,50. Ordre incertain : celui de la réponse de l'IA."""
    E = infos(extract)
    if not E:
        return None
    lus = [n for n in (A or {}).get('niveaux') or [] if isinstance(n, dict) and n.get('id')]
    par_id = {n['id']: n for n in lus}
    if extract.get('ordre_incertain') and sorted(n['id'] for n in lus) == sorted(n['id'] for n in E):
        rang = {n['id']: i for i, n in enumerate(lus)}; E = sorted(E, key=lambda n: rang[n['id']])
    d0 = E[0].get('decalage') or [0, 0]
    hg = _hsp((A or {}).get('hsp'))
    NV, y = [], 0.0
    for k, n in enumerate(E):
        lu = par_id.get(n['id'], {})
        h = _hsp(lu.get('hsp')) or hg
        d = n.get('decalage') or [0, 0]
        NV.append({'id': n['id'], 'nom': str(lu.get('nom') or n.get('nom') or f'Niveau {k + 1}'), 'zone': list(n['zone']),
                   'dec': [round(d[0] - d0[0], 4), round(d[1] - d0[1], 4)], 'H': h or H0, 'y': round(y, 3), 'lu': bool(h)})
        y += (h or H0) + DALLE
    return NV


def zone_de(p, NV):
    """niveau dont la zone contient le point, sinon la zone la plus proche (bandes vides entre deux dessins)"""
    x, z = p; best = None
    for k, n in enumerate(NV):
        x0, z0, x1, z1 = n['zone']
        d = math.hypot(max(x0 - x, 0, x - x1), max(z0 - z, 0, z - z1))
        if best is None or d < best[0] - 1e-9:
            best = (d, k)
    return best[1]


def idx(NV, nid):
    return next((k for k, n in enumerate(NV) if n['id'] == nid), None)


# ---------- centres des éléments (le programme attribue le niveau, l'IA n'a pas à le donner) ----------
def _mil(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]


def centre_piece(r):
    return _L().centroid(r['poly'])


def centre_ouverture(o):
    return _mil(*o['p'])


def centre_equipement(f):
    return _L()._centre_fx(f)


def centre_cuisine(k):
    return [(k['r'][0] + k['r'][1]) / 2, (k['r'][2] + k['r'][3]) / 2]


def centre_loggia(lg):
    return _L().centroid(lg['slab'])


def loggias(A):
    lg = A.get('loggia')
    return [lg] if isinstance(lg, dict) else [x for x in lg or [] if isinstance(x, dict)]


# ---------- escaliers dans le repère de la page ----------
def emprise(e):
    """emprise de la volée au niveau bas : bande de largeur « largeur » autour de la foulée"""
    return LineString(e['foulee']).buffer(e['largeur'] / 2, cap_style='flat', join_style='mitre')


def _dir(a, b):
    L = math.dist(a, b) or 1.0
    return ((b[0] - a[0]) / L, (b[1] - a[1]) / L)


def arrivee_page(e, NV, kb, kh, d=0.1):
    """point du niveau haut (repère de la page) où l'on pose le pied en sortant de l'escalier"""
    u = _dir(e['foulee'][-2], e['foulee'][-1]); f = e['foulee'][-1]; db, dh = NV[kb]['dec'], NV[kh]['dec']
    return [f[0] - db[0] + dh[0] + u[0] * d, f[1] - db[1] + dh[1] + u[1] * d]


# ---------- découpe par zone ----------
def _epaisseur(g):
    """épaisseur d'une bande mince, droite ou en L : 2 × aire / périmètre"""
    return 2 * g.area / g.length if g.length else 0


def gc_en_cloison(A, extract):
    """un garde-corps lu sur un tracé identique à celui des cloisons du plan (même bande d'aplats blancs, même épaisseur)
    est une cloison : ses aplats passent dans « cloisons » et le garde-corps est retiré. Le plan fait foi, jamais l'idée
    qu'une trémie a forcément un garde-corps. Un bord marqué « GC » reste un garde-corps. Renvoie les avertissements."""
    B = extract.get('remplissages_blancs') or []
    minces = {i: Polygon(p).buffer(0) for i, p in enumerate(B) if len(p) >= 3}
    minces = {i: g for i, g in minces.items() if not g.is_empty and _epaisseur(g) <= 0.12}
    ref = [g for g in murs.polys(unary_union([minces[i].buffer(0.002, join_style='mitre') for i in A['cloisons'] if i in minces]))
           if g.length > 0.6]
    if not ref:
        return []  # aucune cloison sûre à laquelle comparer : pas de règle
    eps = [_epaisseur(g) for g in ref]  # épaisseurs des cloisons sûres du plan (bandes soudées à 2 mm près)
    gc_txt = [Point(t[0], t[1]) for t in extract.get('textes') or [] if len(t) >= 3 and str(t[2]).strip().upper() in ('GC', 'G.C.', 'G-C')]
    warns = []
    for e in A.get('escaliers') or []:
        garde = []
        for gc in e.get('garde_corps') or []:
            run = []
            for a, b in zip(gc, gc[1:]):
                s = LineString([a, b])
                if s.length < 0.1:
                    run = (run or [a]) + [b]; continue
                pres = [i for i, g in minces.items() if g.distance(s) < 0.04 and g.buffer(0.035).intersection(s).length > 0.05]
                bande = unary_union([minces[i].buffer(0.002, join_style='mitre') for i in pres]) if pres else None
                couvert = bande.buffer(0.03).intersection(s).length / s.length if bande else 0
                marque = any(p.distance(s) < 0.35 for p in gc_txt)
                tb = max((_epaisseur(g) for g in murs.polys(bande)), default=0)
                if couvert >= 0.8 and not marque and any(abs(tb - t) <= 0.012 for t in eps):
                    A['cloisons'] = sorted(set(A['cloisons']) | set(pres))
                    warns.append(f'Bord de trémie ({a[0]:.2f}, {a[1]:.2f}) → ({b[0]:.2f}, {b[1]:.2f}) dessiné comme les cloisons du plan : lu comme une cloison, pas comme un garde-corps.')
                    if len(run) > 1:
                        garde.append(run)
                    run = [b]
                else:
                    run = (run or [a]) + [b]
            if len(run) > 1:
                garde.append(run)
        e['garde_corps'] = garde
    return warns


def repartit(A, extract, NV):
    """réponse de l'IA (déjà normalisée) et tracés découpés par niveau : [(A_k, extract_k, ouverts_k)], erreurs, avertissements.
    Les indices murs_exclus / cloisons restent ceux des listes plates d'extract.json (les éléments des autres zones sont vidés)."""
    L = _L(); n = len(NV); errs, warns = [], []
    A['_journal'] = gc_en_cloison(A, extract)  # notes de lecture : journal des murs (rapport), jamais montrées à l'acquéreur
    lv = lambda p: zone_de(p, NV)

    def verifie(nom, el, k):  # « niveau » donné par l'IA : recoupé avec la zone
        dit = el.get('niveau') if isinstance(el, dict) else None
        if dit and idx(NV, str(dit)) is not None and idx(NV, str(dit)) != k:
            errs.append(f"{nom} : déclaré au niveau {dit} mais dessiné dans la zone du niveau {NV[k]['id']} ({NV[k]['nom']}). Garde le repère de la page : chaque élément dans la zone de son niveau.")
    parts = []
    base = {k_: v for k_, v in A.items() if k_ not in ('niveaux', 'escaliers', 'loggia', '_journal')}
    for k in range(n):
        Ak = copy.deepcopy(base)
        Ak['rooms'] = [r for r in A['rooms'] if lv(centre_piece(r)) == k]
        Ak['fixtures'] = [f for f in A['fixtures'] if centre_equipement(f) and lv(centre_equipement(f)) == k]
        Ak['kitchenHint'] = [c for c in A['kitchenHint'] if lv(centre_cuisine(c)) == k]
        Ak['gaines'] = [g for g in A['gaines'] if lv(L.centroid(g['poly'])) == k]
        Ak['cloisons_ajout'] = [c for c in A['cloisons_ajout'] if lv(_mil(c['a'], c['b'])) == k]
        Ak['murs'] = [c for c in A['murs'] if lv(_mil(c['a'], c['b'])) == k]
        Ak['openings'] = {i: o for i, o in A['openings'].items() if lv(centre_ouverture(o)) == k}
        lg = [x for x in loggias(A) if lv(centre_loggia(x)) == k]
        if lg:
            Ak['loggia'] = lg[0] if len(lg) == 1 else lg
        Ak['hsp'] = NV[k]['H'] if NV[k]['lu'] else None
        parts.append(Ak)
    for r in A['rooms']:
        verifie(f"Pièce {r['id']}", r, lv(centre_piece(r)))
    for i, o in A['openings'].items():
        verifie(f'Ouverture {i}', o, lv(centre_ouverture(o)))
    for i, f in enumerate(A['fixtures']):
        if centre_equipement(f):
            verifie(f"Équipement {i} ({f.get('type')})", f, lv(centre_equipement(f)))
    # indices des aplats : niveau du centre du polygone de l'extraction
    E = []
    for k in range(n):
        e = {k_: v for k_, v in extract.items() if k_ not in ('niveaux', 'escaliers_detectes', 'ordre_incertain') and (not k_.startswith('_') or k_ in ('_murs_decoupes', '_dossier'))}
        for cle in ('murs_noirs', 'remplissages_blancs'):
            e[cle] = [p if len(p) >= 3 and lv(L.centroid(p)) == k else [] for p in extract.get(cle, [])]
        # compléments (épaisseurs, rectangles, cercles) : ceux du niveau
        e['_segments'] = [s for s in extract.get('_segments') or [] if lv(((s[0] + s[2]) / 2, (s[1] + s[3]) / 2)) == k]
        e['_quads'] = [q for q in extract.get('_quads') or [] if lv(L.centroid(q[0])) == k]
        e['_cercles'] = [c for c in extract.get('_cercles') or [] if lv((c[0], c[1])) == k]
        E.append(e)
    for k in range(n):
        parts[k]['murs_exclus'] = [i for i in A['murs_exclus'] if 0 <= i < len(E[k]['murs_noirs']) and E[k]['murs_noirs'][i]]
        parts[k]['cloisons'] = [i for i in A['cloisons'] if 0 <= i < len(E[k]['remplissages_blancs']) and E[k]['remplissages_blancs'][i]]
    # escaliers : emprise au niveau bas, trémie au niveau haut ; ni mur ajouté le long de leurs bords, ni porte lue sur la flèche de foulée
    ouverts = [[] for _ in range(n)]
    for e in A.get('escaliers') or []:
        kb, kh = idx(NV, e['bas']), idx(NV, e['haut'])
        if kb is None or kh is None or kb == kh:
            continue
        ouverts[kb].append(emprise(e)); ouverts[kh].append(Polygon(e['tremie']).buffer(0))
        if not any(Polygon(r['poly']).buffer(0.02).contains(Point(arrivee_page(e, NV, kb, kh))) for r in parts[kh]['rooms']):
            p = palier(parts[kh], E[kh], arrivee_page(e, NV, kb, kh), Polygon(e['tremie']).buffer(0), NV[kh]['zone'])
            if p:
                parts[kh]['rooms'].append(p); warns.append(f"Palier d'arrivée de l'escalier ajouté au niveau {NV[kh]['nom']}.")
    for k in range(n):
        zo = unary_union(ouverts[k]).buffer(0.04) if ouverts[k] else None
        E[k]['arcs'] = [a for a in extract.get('arcs') or [] if isinstance(a, list) and len(a) == 4 and isinstance(a[2], list)
                        and lv(a[2]) == k and not (zo and zo.contains(Point(a[2])))]
    return [(parts[k], E[k], ouverts[k]) for k in range(n)], errs, warns


def palier(Ak, Ek, pt, tremie, zone):
    """palier d'arrivée absent de la lecture : l'espace clos par les aplats, les pièces et la trémie autour du point d'arrivée"""
    obst = [Polygon(p).buffer(0) for i, p in enumerate(Ek['murs_noirs']) if p and i not in set(Ak['murs_exclus'])]
    obst += [Polygon(Ek['remplissages_blancs'][i]).buffer(0) for i in Ak['cloisons'] if Ek['remplissages_blancs'][i]]
    obst += [Polygon(g['poly']).buffer(0) for g in Ak['gaines']] + [Polygon(r['poly']).buffer(0) for r in Ak['rooms']] + [tremie]
    U = unary_union(obst); cadre = box(pt[0] - 2.5, pt[1] - 2.5, pt[0] + 2.5, pt[1] + 2.5).intersection(box(*zone))
    libre = cadre.difference(U.buffer(0.03, join_style='mitre'))
    comp = next((g for g in murs.polys(libre) if g.buffer(0.035).contains(Point(pt))), None)
    if comp is None or comp.buffer(0.02).intersects(cadre.exterior):
        return None  # espace ouvert : ce n'est pas un palier
    g = comp.buffer(0.03, join_style='mitre').difference(U).intersection(cadre)
    g = max(murs.polys(g), key=lambda q: q.area, default=None)
    if g is None or not 0.3 <= g.area <= 6:
        return None
    ids = {r['id'] for r in Ak['rooms']}
    rid = next(i for i in ['palier'] + [f'palier{j}' for j in range(2, 9)] if i not in ids)
    return {'id': rid, 'name': 'Palier', 'hidden': True, 'floor': 'dry', 'poly': murs.ring(g.simplify(0.005))}


# ---------- assemblage par niveau, fusion dans le repère de la page ----------
def assemble(A, extract, assemble_un):
    """chaque niveau passe dans l'assemblage d'un seul niveau (sous-réponse, sous-tracés), puis tout est réuni dans le
    repère de la page, chaque élément portant « level » ; ids uniques sur tout le plan"""
    L = _L()
    A, errs, warns = L.normalise(A)
    NV = plan_niveaux(extract, A)
    parts, e2, w2 = repartit(A, extract, NV)
    errs += e2; warns += w2; journal = A.pop('_journal', [])
    P = {k: v for k, v in A.items() if k not in ('murs_exclus', 'cloisons', 'cloisons_ajout', 'gaines', 'openings', 'murs', 'hsp')}
    P.pop('loggia', None)
    fmt = {'erreurs': errs, 'avertissements': warns, 'murs': list(journal)}
    if _hsp(A.get('hsp')):
        P['H'] = _hsp(A['hsp']); P['hspLue'] = True
    elif any(n['lu'] for n in NV):
        P['hspLue'] = True
    for k in ('walls', 'rooms', 'fixtures', 'gaines', 'kitchenHint'):
        P[k] = []
    P['openings'] = {}; lgs = []
    for k, (Ak, Ek, Ok) in enumerate(parts):
        Pk = assemble_un(Ak, Ek, Ok)
        f = Pk.get('_format') or {}
        fmt['erreurs'] += f.get('erreurs', []); fmt['avertissements'] += f.get('avertissements', [])
        fmt['murs'] += [f"{NV[k]['nom']} : {m}" for m in f.get('murs', [])]
        pris_m = {w['id'] for w in P['walls']}
        for w in Pk['walls']:
            w['level'] = k
            if k:
                w['id'] = f"n{k}-{w['id']}"
            while w['id'] in pris_m:
                w['id'] += "'"
        for g in Pk['gaines']:
            g['level'] = k
            if k:
                g['id'] = f"n{k}-{g['id']}"
        pris_r = {r['id'] for r in P['rooms']}
        for r in Pk['rooms']:
            r['level'] = k
            if r['id'] in pris_r:  # la normalisation globale rend les ids uniques : cas limite (palier ajouté)
                r['id'] = f"n{k}-{r['id']}"
        for i, o in Pk['openings'].items():
            o['level'] = k
            P['openings'][i if i not in P['openings'] else f'n{k}-{i}'] = o
        for x in Pk.get('fixtures', []) + Pk.get('kitchenHint', []):
            x['level'] = k
        for lg in loggias(Pk):
            lgs.append({**lg, 'level': k})
        P['walls'] += Pk['walls']; P['rooms'] += Pk['rooms']; P['fixtures'] += Pk.get('fixtures', [])
        P['gaines'] += Pk['gaines']; P['kitchenHint'] += Pk.get('kitchenHint', [])
    if lgs:
        P['loggia'] = lgs
    fmt['niveaux'] = {'nv': NV, 'detectes': extract.get('escaliers_detectes') or [], 'ordre_incertain': bool(extract.get('ordre_incertain'))}
    P['_format'] = fmt
    return P


# ---------- géométrie de l'escalier dans le repère commun ----------
def _tr(pts, d):
    return [[round(p[0] - d[0], 4), round(p[1] - d[1], 4)] for p in pts]


def _perp(u):
    return (-u[1], u[0])


def bord_arrivee(void, fin, u):
    """bord du vide où arrive l'escalier : côté presque perpendiculaire à la dernière volée, le plus proche du
    dernier point ; renvoie (a, b, t) avec t la distance signée, le long de u, du dernier point à ce bord"""
    cs = list(void.exterior.coords); best = None
    for a, b in zip(cs, cs[1:]):
        if math.dist(a, b) < 0.1:
            continue
        e = _dir(a, b)
        if abs(e[0] * u[0] + e[1] * u[1]) > 0.3:
            continue
        m = _perp(e); den = u[0] * m[0] + u[1] * m[1]
        if abs(den) < 1e-6:
            continue
        t = ((a[0] - fin[0]) * m[0] + (a[1] - fin[1]) * m[1]) / den
        d = LineString([a, b]).distance(Point(fin[0] + u[0] * t, fin[1] + u[1] * t))
        if d > 0.3:
            continue
        if best is None or abs(t) < abs(best[2]):
            best = (a, b, t)
    return best


def geo_escalier(e, NV, recale=True):
    """escalier dans le repère commun : foulée (dernière contremarche recalée sur le bord d'arrivée du vide),
    vide brut, emprise, hauteur de marche, giron, échappée la plus faible"""
    kb, kh = idx(NV, e['bas']), idx(NV, e['haut'])
    line = _tr(e['foulee'], NV[kb]['dec']); void = Polygon(_tr(e['tremie'], NV[kh]['dec'])).buffer(0)
    u = _dir(line[-2], line[-1]); ba = bord_arrivee(void, line[-1], u)
    ecart = ba[2] if ba else None
    if recale and ba and abs(ba[2]) <= 0.15:
        line[-1] = [round(line[-1][0] + u[0] * ba[2], 4), round(line[-1][1] + u[1] * ba[2], 4)]
    n = int(e['contremarches']); w = e['largeur']
    ls = LineString(line); Lg = ls.length
    rise = (NV[kh]['y'] - NV[kb]['y']) / n; going = Lg / max(1, n - 1)
    ech = None
    for i in range(n - 1):  # giron i, à (i + 1) hauteurs de marche : sous la dalle du dessus, l'échappée doit suffire
        g = substring(ls, i * going, (i + 1) * going).buffer(w / 2, cap_style='flat', join_style='mitre')
        if g.difference(void).area > 0.002:
            h = NV[kh]['y'] - SOUS_DALLE - (NV[kb]['y'] + (i + 1) * rise)
            ech = h if ech is None else min(ech, h)
    return {'kb': kb, 'kh': kh, 'line': line, 'void': void, 'u': u, 'n': n, 'w': w, 'rise': rise, 'going': going,
            'poly': ls.buffer(w / 2, cap_style='flat', join_style='mitre'), 'ecart': ecart, 'echappee': ech, 'bord': ba}


def _sens_detecte(e, dets, zone_id):
    """sens de montée lu sur la série de girons détectée : les marches en tirets, au-delà de la coupe, sont en haut.
    Renvoie +1 (foulée dans le bon sens), -1 (à l'envers) ou None (pas de détection nette)"""
    f0, f1 = e['foulee'][0], e['foulee'][-1]; ls = LineString(e['foulee'])
    for d in dets:
        if d.get('zone') != zone_id or not d.get('coupe') or not d.get('tirets') or not d.get('pas'):
            continue
        a, b = d['axe']
        if LineString([a, b]).distance(ls) > 0.3 or ls.hausdorff_distance(LineString([a, b])) > 0.6:
            continue
        c = d['coupe']; cible = d['tirets'] * d['pas']
        ea, eb = abs(math.dist(a, c) - cible), abs(math.dist(b, c) - cible)
        if abs(ea - eb) < 2 * d['pas']:
            return None
        haut = a if ea < eb else b
        return 1 if math.dist(haut, f1) < math.dist(haut, f0) else -1
    return None


def controle(P):
    """contrôles propres aux niveaux et aux escaliers (repère de la page) : erreurs à faire corriger par l'IA, avertissements"""
    L = _L(); info = (P.get('_format') or {}).get('niveaux')
    if not info:
        return [], []
    NV, dets = info['nv'], info['detectes']; errs, warns = [], []
    lv = lambda el: el.get('level', 0)
    rooms = [r for r in P.get('rooms', []) if L.poly_ok(r.get('poly'))]
    for k, n in enumerate(NV):
        if not any(lv(r) == k and not r.get('hidden') for r in rooms):
            x0, z0, x1, z1 = n['zone']
            errs.append(f"Aucune pièce lue au niveau {n['id']} ({n['nom']}, zone x {x0:.2f} à {x1:.2f}, z {z0:.2f} à {z1:.2f}). Décris tous les niveaux, chacun dans sa zone.")
    lus = [x.get('id') for x in P.get('niveaux') or []]
    if lus and sorted(lus) != sorted(n['id'] for n in NV):
        warns.append(f"« niveaux » : ids {lus}, attendus {[n['id'] for n in NV]}.")
    escs = P.get('escaliers') or []
    for k in range(len(NV) - 1):
        if not any({idx(NV, e['bas']), idx(NV, e['haut'])} == {k, k + 1} for e in escs):
            errs.append(f"Aucun escalier lu entre {NV[k]['nom']} ({NV[k]['id']}) et {NV[k + 1]['nom']} ({NV[k + 1]['id']}) : ajoute-le dans « escaliers » (foulée au niveau bas, trémie au niveau haut).")
    for j, e in enumerate(escs):
        nom = f'Escalier {j + 1}'
        kb, kh = idx(NV, e['bas']), idx(NV, e['haut'])
        if kb is None or kh is None or kh <= kb:
            errs.append(f"{nom} : « bas » ({e['bas']}) et « haut » ({e['haut']}) doivent être deux ids de niveaux, le haut au-dessus du bas ({', '.join(n['id'] for n in NV)}, du bas vers le haut)."); continue
        if any(zone_de(p, NV) != kb for p in e['foulee']):
            errs.append(f"{nom} : la foulée doit être entièrement dans la zone du niveau bas {NV[kb]['id']} ({NV[kb]['nom']}), repère de la page."); continue
        if any(zone_de(p, NV) != kh for p in e['tremie']):
            errs.append(f"{nom} : la trémie doit être entièrement dans la zone du niveau haut {NV[kh]['id']} ({NV[kh]['nom']}), repère de la page."); continue
        G = geo_escalier(e, NV)
        sens = _sens_detecte(e, dets, NV[kb]['id'])
        if sens == -1:
            errs.append(f"{nom} : foulée lue à l'envers. Les marches en trait plein sont en bas, celles en tirets au-delà de la ligne de coupe oblique sont en haut : la foulée va du nez de la première marche (côté plein) au bord d'arrivée (côté tirets).")
        if G['bord'] is None or abs(G['ecart']) > 0.15:
            errs.append(f"{nom} : le dernier point de la foulée ({e['foulee'][-1][0]:.2f}, {e['foulee'][-1][1]:.2f}) doit tomber sur le bord de la trémie où l'on arrive au niveau haut"
                        + (f" (écart {abs(G['ecart']):.2f} m une fois les niveaux superposés)" if G['bord'] else '') + ". Vérifie le sens de montée et la trémie.")
        det = next((d for d in dets if d.get('zone') == NV[kb]['id'] and LineString(d['axe']).distance(LineString(e['foulee'])) < 0.3), None)
        if det and not det['girons'] <= G['n'] <= det['girons'] + 2:
            errs.append(f"{nom} : {G['n']} contremarches lues alors que {det['girons'] + 1} marches sont dessinées ({det['girons']} girons de {det['pas']:.2f} m).")
        if not 0.16 <= G['rise'] <= 0.20:
            errs.append(f"{nom} : hauteur de marche {G['rise']:.3f} m ({NV[kh]['y'] - NV[kb]['y']:.2f} m d'étage pour {G['n']} contremarches), hors de 0,16 à 0,20 m. Recompte les contremarches.")
        if not 0.21 <= G['going'] <= 0.32:
            errs.append(f"{nom} : giron {G['going']:.3f} m ({LineString(G['line']).length:.2f} m de foulée pour {G['n'] - 1} girons), hors de 0,21 à 0,32 m. Vérifie la foulée et les contremarches.")
        elif not 0.58 <= 2 * G['rise'] + G['going'] <= 0.66:
            warns.append(f"{nom} : 2h + g = {2 * G['rise'] + G['going']:.3f} m, hors de 0,58 à 0,66 m.")
        if G['echappee'] is not None and G['echappee'] < ECHAPPEE:
            errs.append(f"{nom} : échappée de {G['echappee']:.2f} m sous le plancher du niveau haut (1,90 m au moins) : la trémie doit couvrir la volée jusque-là.")
        u0 = _dir(e['foulee'][0], e['foulee'][1]); pied = [e['foulee'][0][0] - u0[0] * 0.1, e['foulee'][0][1] - u0[1] * 0.1]
        if not any(lv(r) == kb and Polygon(r['poly']).buffer(0.02).contains(Point(pied)) for r in rooms):
            errs.append(f"{nom} : le pied de l'escalier ({pied[0]:.2f}, {pied[1]:.2f}) ne donne sur aucune pièce du niveau bas.")
        arr = arrivee_page(e, NV, kb, kh)
        if not any(lv(r) == kh and Polygon(r['poly']).buffer(0.02).contains(Point(arr)) for r in rooms):
            errs.append(f"{nom} : l'arrivée ({arr[0]:.2f}, {arr[1]:.2f}, zone du niveau haut) n'est dans aucune pièce : ajoute le palier {{\"id\":\"palier\",\"name\":\"Palier\",\"hidden\":true}} ou corrige la foulée.")
        emp, tr = emprise(e), Polygon(e['tremie']).buffer(0)
        for r in rooms:
            g = Polygon(r['poly']).buffer(0)
            if lv(r) == kb and g.intersection(emp).area > 0.1:
                errs.append(f"Pièce {r['id']} : elle recouvre l'emprise de l'escalier ({g.intersection(emp).area:.2f} m²) ; son polygone doit exclure les marches.")
            if lv(r) == kh and g.intersection(tr).area > 0.1:
                errs.append(f"Pièce {r['id']} : elle recouvre la trémie ({g.intersection(tr).area:.2f} m²) ; aucune pièce ne recouvre le vide de l'escalier.")
        # chambre ouverte sur la trémie (garde-corps au lieu de cloison) : une chambre est fermée, jamais ouverte sur la cage d'escalier
        Wh = _union_murs([w for w in P.get('walls', []) if lv(w) == kh], [q for q in P.get('gaines', []) if lv(q) == kh]).buffer(0.02)
        for r in rooms:
            if lv(r) != kh or r.get('hidden') or not ('chambre' in (r.get('name') or '').lower() or re.match(r'ch\s*\d|chambre', str(r['id']).lower())):
                continue
            ouv = Polygon(r['poly']).buffer(0).boundary.intersection(tr.buffer(0.12, join_style='mitre')).difference(Wh)
            if ouv.length > 0.3:
                errs.append(f"Pièce {r['id']} : chambre ouverte sur la trémie de l'escalier sur {ouv.length:.2f} m, sans mur ni cloison. Une chambre est fermée : "
                            "le double trait entre la chambre et la trémie est une cloison (ajoute ses remplissages dans « cloisons »), le garde-corps ne borde que la circulation.")
        for gc in e.get('garde_corps') or []:
            ga = LineString(_tr(gc, NV[kh]['dec']))
            if G['bord'] and ga.intersection(LineString(G['bord'][:2]).buffer(0.03)).length > min(0.3, 0.5 * G['w']):
                warns.append(f'{nom} : un garde-corps lu barre l\'arrivée de l\'escalier ; il est ignoré.')
    return errs, warns


# ---------- superposition : repère de la page → repère commun ----------
def _dep_pts(pts, d):
    return [[round(p[0] - d[0], 4), round(p[1] - d[1], 4)] for p in pts]


def _dep_el(el, d, champs_pts=(), champs_pt=()):
    for c in champs_pts:
        if isinstance(el.get(c), list) and el[c]:
            el[c] = _dep_pts(el[c], d)
    for c in champs_pt:
        if isinstance(el.get(c), list) and len(el[c]) == 2:
            el[c] = [round(el[c][0] - d[0], 4), round(el[c][1] - d[1], 4)]


def _union_murs(walls, gaines=()):
    L = _L()
    return unary_union([Polygon(L.wall_quad(w)).buffer(0) for w in walls if not w.get('virtual') and not w.get('_vide')]
                       + [Polygon(g['poly']).buffer(0) for g in gaines])


def cale_vide(void, W, R):
    """bord du vide poussé jusqu'au nu du mur ou au bord de la pièce voisine quand il en reste 6 cm au plus : pas de bande
    de dalle contre un mur, et la bande du garde-corps dessiné (5 cm) ne laisse ni lanière de sol ni pièce découpée en
    peigne autour du vide ; jamais dans une pièce"""
    cs = list(void.exterior.coords)[:-1]; ajout = []
    for i in range(len(cs)):
        a, b = cs[i], cs[(i + 1) % len(cs)]
        if math.dist(a, b) < 0.05:
            continue
        e = _dir(a, b); nrm = _perp(e); m = _mil(a, b)
        if void.contains(Point(m[0] + nrm[0] * 0.002, m[1] + nrm[1] * 0.002)):
            nrm = (-nrm[0], -nrm[1])
        # par tronçons de 2 cm : un bord en partie contre un mur (cloison posée sur le bord) et en partie à 5 cm d'une
        # pièce (bande du garde-corps dessiné) n'est poussé que là où il reste une bande
        n = max(3, math.ceil(math.dist(a, b) / 0.02)); ds = []
        for j in range(n):
            t = (j + 0.5) / n; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            ray = LineString([(p[0] + nrm[0] * 0.001, p[1] + nrm[1] * 0.001), (p[0] + nrm[0] * 0.065, p[1] + nrm[1] * 0.065)])
            hit = [Point(p).distance(h) for h in (ray.intersection(W), ray.intersection(R)) if not h.is_empty]
            ds.append(min(hit) if hit and 0.002 < min(hit) <= 0.06 else None)
        j = 0
        while j < n:
            if ds[j] is None:
                j += 1; continue
            k = j
            while k + 1 < n and ds[k + 1] is not None:
                k += 1
            if k - j + 1 >= min(8, n):  # au moins 15 cm (ou tout le bord) : pas une encoche de raccord
                t0, t1 = (0 if j == 0 else j / n), (1 if k == n - 1 else (k + 1) / n); h = max(ds[j:k + 1])
                p0 = (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0); p1 = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
                ajout.append(Polygon([p0, p1, (p1[0] + nrm[0] * h, p1[1] + nrm[1] * h), (p0[0] + nrm[0] * h, p0[1] + nrm[1] * h)]))
            j = k + 1
    if not ajout:
        return void
    g = unary_union([void] + [q.buffer(0.0005, join_style='mitre') for q in ajout]).buffer(-0.0005, join_style='mitre')
    return max(murs.polys(g), key=lambda q: q.area)


def comble_marches(g, lmax=0.065):
    """décrochés de quelques cm (deux côtés courts autour d'un angle rentrant) comblés par leur parallélogramme"""
    cs = list(g.exterior.coords)[:-1]; n = len(cs); ajout = []
    sg = 1 if g.exterior.is_ccw else -1
    for i in range(n):
        a, c, b = cs[i - 1], cs[i], cs[(i + 1) % n]
        if math.dist(a, c) > lmax or math.dist(c, b) > lmax:
            continue
        cr = (c[0] - a[0]) * (b[1] - c[1]) - (c[1] - a[1]) * (b[0] - c[0])
        if cr * sg < -1e-7:  # angle rentrant
            ajout.append(Polygon([a, c, b, (a[0] + b[0] - c[0], a[1] + b[1] - c[1])]).buffer(0))
    if not ajout:
        return g
    u = unary_union([g] + ajout).buffer(0.0005, join_style='mitre').buffer(-0.0005, join_style='mitre')
    return max(murs.polys(u), key=lambda q: q.area)


def garde_corps(void, W, arrivee):
    """garde-corps sur chaque bord libre du vide : ni mur contre le bord, ni arrivée d'escalier (segment, largeur)"""
    cs = list(void.exterior.coords); pts = []
    for a, b in zip(cs, cs[1:]):
        Lg = math.dist(a, b)
        if Lg < 1e-6:
            continue
        e = _dir(a, b); nrm = _perp(e); m = _mil(a, b)
        if void.contains(Point(m[0] + nrm[0] * 0.002, m[1] + nrm[1] * 0.002)):
            nrm = (-nrm[0], -nrm[1])
        k = max(2, int(Lg / 0.02))
        for j in range(k):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            q = Point(p[0] + nrm[0] * 0.05, p[1] + nrm[1] * 0.05)
            # un mur dont la face est à 5 cm du bord (cloison de 5 cm posée sur le bord) compte : pas de garde-corps collé à un mur
            libre = W.distance(q) > 0.015 and not any(zo.contains(Point(p)) for zo in arrivee)
            pts.append((p, libre))
    i0 = next((i for i, x in enumerate(pts) if not x[1]), None)
    if i0 is None:  # vide entièrement libre : garde-corps tout autour
        return [[[round(x, 3), round(z, 3)] for x, z in cs]] if pts else []
    pts = pts[i0:] + pts[:i0]
    runs, cur = [], None
    for p, libre in pts + [pts[0]]:
        if libre:
            cur = (cur or []) + [p]
        else:
            if cur:
                runs.append(cur + [p])  # jusqu'au point de rencontre avec le mur ou l'arrivée
            cur = None
    out = []
    for r in runs:
        c = list(LineString(r).simplify(0.002).coords)
        # retour de moins de 10 cm au bout (contre l'arrivée ou un mur) : lisse et poteaux s'y empileraient sur ceux de l'angle
        while len(c) > 2 and math.dist(c[-1], c[-2]) < 0.1:
            c.pop()
        while len(c) > 2 and math.dist(c[0], c[1]) < 0.1:
            c.pop(0)
        if LineString(c).length >= 0.1:
            out.append([[round(x, 3), round(z, 3)] for x, z in c])
    return out


def _parts(g, amin=0.002, nd=3):
    """géométrie shapely → [{poly, trous}] valides, arrondis au millimètre (nd décimales)"""
    out = []
    for p in murs.polys(g.buffer(0)):
        if p.area < amin:
            continue
        q = Polygon([(round(x, nd), round(z, nd)) for x, z in p.exterior.coords],
                    [[(round(x, nd), round(z, nd)) for x, z in h.coords] for h in p.interiors if Polygon(h).area > 0.001])
        if not q.is_valid:
            q = q.buffer(0)
            if q.geom_type != 'Polygon':
                continue
        ring = lambda c: [[round(x, nd), round(z, nd)] for x, z in list(c.coords)[:-1]]
        out.append({'poly': ring(q.exterior), 'trous': [ring(h) for h in q.interiors]})
    return out


def superpose(P, extract):
    """P passe du repère de la page au repère commun (translation par niveau) ; levels, stairs et voids sont créés"""
    L = _L(); NV = plan_niveaux(extract, P)
    lv = lambda el: el.get('level', 0)
    for w in P['walls']:
        _dep_el(w, NV[lv(w)]['dec'], ('poly',), ('a', 'b'))
    for r in P['rooms']:
        _dep_el(r, NV[lv(r)]['dec'], ('poly',), ('label',))
    for o in P['openings'].values():
        _dep_el(o, NV[lv(o)]['dec'], ('p',))
    for f in P.get('fixtures', []):
        d = NV[lv(f)]['dec']
        for c, dd in (('x', d[0]), ('z', d[1])):
            if isinstance(f.get(c), list) and len(f[c]) == 2:
                f[c] = [round(f[c][0] - dd, 4), round(f[c][1] - dd, 4)]
        _dep_el(f, d, (), ('p', 'drain'))
        if isinstance(f.get('valve'), dict):
            _dep_el(f['valve'], d, (), ('wall',))
    for g in P.get('gaines', []):
        _dep_el(g, NV[lv(g)]['dec'], ('poly',))
    for c in P.get('kitchenHint', []):
        d = NV[lv(c)]['dec']; x0, x1, z0, z1 = c['r']
        c['r'] = [round(x0 - d[0], 4), round(x1 - d[0], 4), round(z0 - d[1], 4), round(z1 - d[1], 4)]
        _dep_el(c, d, (), ('tp',))
    for lg in loggias(P):
        _dep_el(lg, NV[lv(lg)]['dec'], ('slab', 'rail'))
    # cotes du promoteur : chacune dans le repère commun, avec son niveau en 6e valeur
    dims = []
    for c in (extract or {}).get('cotes') or []:
        if isinstance(c, list) and len(c) >= 5 and all(_num(v) for v in c[:4]):
            k = zone_de(_mil(c[:2], c[2:4]), NV); d = NV[k]['dec']
            dims.append([round(c[0] - d[0], 4), round(c[1] - d[1], 4), round(c[2] - d[0], 4), round(c[3] - d[1], 4), c[4], k])
    P['dims'] = dims
    ent = next((lv(o) for o in P['openings'].values() if o.get('kind') == 'entry'), 0)
    P['levels'] = [{'id': n['id'], 'name': n['nom'], 'y': n['y'], 'H': n['H'], **({'entry': True} if k == ent else {}),
                    'zone': [round(n['zone'][0] - n['dec'][0], 3), round(n['zone'][1] - n['dec'][1], 3), round(n['zone'][2] - n['dec'][0], 3), round(n['zone'][3] - n['dec'][1], 3)],
                    'offset': list(n['dec'])} for k, n in enumerate(NV)]
    P['H'] = NV[0]['H']
    # escaliers et vides
    P['stairs'], P['voids'] = [], []
    for j, e in enumerate(P.get('escaliers') or []):
        kb, kh = idx(NV, e['bas']), idx(NV, e['haut'])
        if kb is None or kh is None or kh <= kb:
            continue
        G = geo_escalier(e, NV)
        Wh = _union_murs([w for w in P['walls'] if lv(w) == kh], [g for g in P.get('gaines', []) if lv(g) == kh])
        Rh = unary_union([Polygon(r['poly']).buffer(0) for r in P['rooms'] if lv(r) == kh and L.poly_ok(r.get('poly'))])
        void = cale_vide(G['void'], Wh, Rh)
        # coin laissé entre deux bords poussés (quelques cm²) : comblé, sinon le garde-corps y ferait un décroché ; la pièce qui
        # le tenait le perd
        ferme = comble_marches(void)
        if ferme.geom_type == 'Polygon' and 0 < ferme.difference(void).area < 0.005:
            void = ferme
            for r in P['rooms']:
                if lv(r) == kh and L.poly_ok(r.get('poly')):
                    g = Polygon(r['poly']).buffer(0)
                    if g.intersection(void).area > 1e-5:
                        h = max(murs.polys(g.difference(void)), key=lambda q: q.area, default=None)
                        if h is not None and h.area > 0.98 * g.area:
                            r['poly'] = murs.ring(h.simplify(0.001))
        # arrivée : la partie du bord d'arrivée couverte par la volée reste ouverte
        arr = []
        ba = bord_arrivee(void, G['line'][-1], G['u'])
        if ba:
            a, b, _ = ba; fin = G['line'][-1]; nrm = _perp(G['u']); w2 = G['w'] / 2 + 0.02
            arr.append(LineString([(fin[0] + nrm[0] * w2, fin[1] + nrm[1] * w2), (fin[0] - nrm[0] * w2, fin[1] - nrm[1] * w2)]).buffer(0.02, cap_style='flat'))
        vid = f'v{j + 1}'
        P['voids'].append({'id': vid, 'level': kh, 'poly': murs.ring(void.simplify(0.001)),
                           'rails': garde_corps(void, Wh, arr)})
        P['stairs'].append({'id': f'esc{j + 1}', 'from': kb, 'to': kh, 'line': [[round(x, 3), round(z, 3)] for x, z in G['line']], 'width': round(G['w'], 3), 'n': G['n'],
                            'rise': round(G['rise'], 4), 'going': round(G['going'], 4), 'poly': murs.ring(G['poly']), 'void': vid, 'label': 'Escalier'})
    for k in ('escaliers', 'niveaux'):
        P.pop(k, None)
    return P


# ---------- complément niveau par niveau ----------
def _vide(i, poly):
    return {'id': f'_vide{i}', 'k': 'vide', 'poly': poly, '_vide': True}


def obstacles(P, k):
    """emprises d'escalier (niveau bas) et vides (niveau haut) du niveau k : ni sol étendu, ni lampe, ni vue dedans"""
    return [s['poly'] for s in P.get('stairs', []) if s['from'] == k] + [v['poly'] for v in P.get('voids', []) if v['level'] == k]


def sous_plan(P, k, avec_obstacles=True):
    """vue d'un seul niveau, avec les listes de ce niveau (mêmes objets que P) et les obstacles en murs fictifs"""
    lv = lambda el: el.get('level', 0)
    Pk = {c: v for c, v in P.items() if c not in ('walls', 'rooms', 'openings', 'fixtures', 'gaines', 'kitchenHint', 'loggia', 'levels', 'stairs', 'voids',
                                                   'photos', 'stops', 'lamps', 'passages', 'probes', 'masses', 'outline', 'bounds', 'context', 'dims', '_avertir', 'sans_arret')}
    Pk['walls'] = [w for w in P['walls'] if lv(w) == k] + ([_vide(i, p) for i, p in enumerate(obstacles(P, k))] if avec_obstacles else [])
    Pk['rooms'] = [r for r in P['rooms'] if lv(r) == k]
    Pk['openings'] = {i: o for i, o in P['openings'].items() if lv(o) == k}
    for c in ('fixtures', 'gaines', 'kitchenHint'):
        Pk[c] = [x for x in P.get(c, []) if lv(x) == k]
    lg = [x for x in loggias(P) if lv(x) == k]
    if lg:
        Pk['loggia'] = lg
    Pk['H'] = P['levels'][k]['H']
    return Pk


def _ordonne(stops, depart):
    reste = list(stops); cur = depart; out = []
    while reste:
        reste.remove(cur); out.append(cur)
        if reste:
            cur = min(reste, key=lambda q: math.dist(q['p'], cur['p']))
    return out


def arret_escalier(P, s, essai=0, monte=True, deja=()):
    """arrêt « Escalier » : au pied de la volée regardant la montée (ou en haut regardant la descente), dans une pièce
    libre du niveau, à 30 cm au moins des murs, des équipements et de la volée, et à ECART_ARRETS au moins des arrêts
    déjà posés sur ce niveau (deja)"""
    L = _L(); lv = lambda el: el.get('level', 0)
    k = s['from'] if monte else s['to']
    line = s['line']; u = _dir(line[0], line[1]) if monte else _dir(line[-1], line[-2])
    p0 = line[0] if monte else line[-1]; nrm = _perp(u)
    walls = [w for w in P['walls'] if lv(w) == k and not w.get('virtual')]
    W = _union_murs(walls, [g for g in P.get('gaines', []) if lv(g) == k])
    gen = unary_union(murs.emprises([f for f in P.get('fixtures', []) if lv(f) == k]) + [Polygon(o).buffer(0) for o in obstacles(P, k)])
    rooms = [r for r in P['rooms'] if lv(r) == k and not r.get('hidden') and not r.get('of')]
    cands = []
    for d in (0.9, 0.75, 1.05, 0.6, 1.25, 1.5):
        for lat in (0, 0.15, -0.15, 0.3, -0.3):
            x, z = p0[0] - u[0] * d + nrm[0] * lat, p0[1] - u[1] * d + nrm[1] * lat
            r = next((q for q in rooms if L.inside(x, z, q['poly'])), None)
            if r and Point(x, z).distance(W) >= 0.3 and Point(x, z).distance(gen) >= 0.3 and Polygon(r['poly']).buffer(-0.25).contains(Point(x, z)) \
                    and all(math.dist((x, z), q['p']) >= ECART_ARRETS for q in deja if lv(q) == k):
                cands.append((x, z, r['id']))
    if essai >= len(cands):
        return None
    x, z, rid = cands[essai]
    yaw = math.atan2(-u[0], -u[1])
    return {'id': 'escalier' if s['id'] == 'esc1' else f"escalier-{s['id']}", 'room': rid, 'label': 'Escalier', 'stair': s['id'], 'level': k,
            'p': [round(x, 3), round(z, 3)], 'yaw': round(yaw, 3), 'pitch': 0.12 if monte else -0.15, 'open': [], 'close': []}  # en descente, regard à peine baissé (jamais vers le sol)


def role_escalier(P, s, monte, deja):
    """pas de place pour un arrêt « Escalier » à l'écart des autres : l'arrêt du niveau le plus proche de l'endroit où il
    aurait été (à ECART_ARRETS au plus) et qui voit le pied de la volée sans mur entre les deux prend son rôle (stair) ;
    la visite à 360° y pose le point de passage de l'escalier. Renvoie cet arrêt, ou None"""
    a = arret_escalier(P, s, 0, monte)
    if not a:
        return None
    k = a['level']; line = s['line']; p0 = line[0] if monte else line[-1]
    W = _union_murs([w for w in P['walls'] if w.get('level', 0) == k and not w.get('virtual')],
                    [g for g in P.get('gaines', []) if g.get('level', 0) == k])
    proches = sorted((q for q in deja if q.get('level', 0) == k and math.dist(q['p'], a['p']) < ECART_ARRETS), key=lambda q: math.dist(q['p'], a['p']))
    for q in proches:
        if not LineString([q['p'], p0]).intersects(W.buffer(-0.01)):
            return q
    return None


def aligne_masses(P, tol=0.005):
    """murs d'un niveau calés sur ceux du dessous à 5 mm près : les deux recalages diffèrent d'un millimètre, et le haut du
    mur du dessous ferait un rebord d'1 mm, ligne claire au soleil sur la façade et dans la cage d'escalier"""
    from shapely.ops import nearest_points
    lv = lambda el: el.get('level', 0)
    for k in sorted({lv(m) for m in P.get('masses', [])}):
        if k == 0:
            continue
        # nu des masses du dessous d'abord (ce que le moteur dessine), murs ensuite : un nu de mur à 0,5 mm de celui de la masse
        # arrondie laisserait deux faces à 0,5 mm, qui se disputent le tampon de profondeur (pointillés dans la cage d'escalier)
        nu = lambda gs: (lambda U: None if U.is_empty else U.boundary)(unary_union(gs))
        Bm = nu([Polygon(m['poly'], m.get('trous') or []).buffer(0) for m in P['masses'] if lv(m) == k - 1])
        Bw = nu([Polygon(_L().wall_quad(w)).buffer(0) for w in P['walls'] if lv(w) == k - 1 and not w.get('virtual')])
        if Bm is None and Bw is None:
            continue
        # sommet du dessous d'abord : un angle posé sur le jambage d'une baie du dessous (distance nulle au bord) garderait sinon le
        # millimètre d'écart avec l'angle voisin, et le nu du mur du dessus serait légèrement de biais
        som = [MultiPoint([c for g in (B.geoms if hasattr(B, 'geoms') else [B]) for c in g.coords]) if B is not None else None for B in (Bm, Bw)]
        def cale(ring):
            out = []
            for x, z in ring:
                q = next((q for B, t in ((som[0], 0.003), (Bm, tol), (som[1], 0.003), (Bw, tol)) if B is not None and (q := nearest_points(Point(x, z), B)[1]).distance(Point(x, z)) < t), None)
                out.append([round(q.x, 4), round(q.y, 4)] if q is not None else [x, z])
            return out
        for m in P['masses']:
            if lv(m) != k:
                continue
            poly, trous = cale(m['poly']), [cale(h) for h in m.get('trous') or []]
            if Polygon(poly, trous).is_valid:
                m['poly'], m['trous'] = poly, trous


def dalles(P):
    """dalle, plafond et toit de chaque niveau (le moteur n'a pas d'opérations booléennes) : floor = contour moins les vides
    du niveau (débordant de 3 cm sur le contour du dessous, pas de fente au raccord), ceiling = contour moins les vides du
    niveau au-dessus, roof = partie du contour que le niveau au-dessus ne couvre pas"""
    n = len(P['levels'])
    O = [Polygon(l['outline']).buffer(0) for l in P['levels']]
    V = [unary_union([Polygon(v['poly']).buffer(0) for v in P.get('voids', []) if v['level'] == k]) for k in range(n)]
    # trou de dalle et de plafond prolongé de 2 cm dans les murs qui bordent le vide : un bord calé au millimètre près
    # sur le nu du mur laisserait un rebord de dalle d'1 mm, ligne claire sur le mur de la cage d'escalier
    for k in range(n):
        if not V[k].is_empty:
            W = _union_murs([w for w in P['walls'] if w.get('level', 0) == k], [g for g in P.get('gaines', []) if g.get('level', 0) == k])
            V[k] = unary_union([V[k], V[k].buffer(0.02, join_style='mitre').intersection(W)]).buffer(0.002, join_style='mitre').buffer(-0.002, join_style='mitre')
    for k, l in enumerate(P['levels']):
        dessous = O[k - 1] if k else None
        porte = O[k] if dessous is None else unary_union([O[k], dessous.intersection(O[k].buffer(0.03, join_style='mitre'))])
        l['floor'] = _parts(porte.difference(V[k]))
        l['ceiling'] = _parts(O[k].difference(V[k + 1]) if k + 1 < n else O[k])
        if k + 1 < n:
            couvert = unary_union([O[k + 1], O[k].intersection(O[k + 1].buffer(0.03, join_style='mitre'))])
            reste = O[k].difference(couvert).buffer(-0.01, join_style='mitre').buffer(0.01, join_style='mitre')
            l['roof'] = _parts(reste, 0.02)
        else:
            l['roof'] = _parts(O[k])
    # pied des murs d'un niveau superposé : « pieds » = partie posée sur une masse du dessous (1 cm de recouvrement, faces
    # confondues) ; « joints » = partie libre au bord d'un vide (ferme le trou de plafond prolongé dans le mur) ; le reste part
    # du dessus du plafond du dessous, caché par lui (un mur libre qui descendrait sous ce plafond y tracerait une ligne claire)
    M = [unary_union([Polygon(m['poly'], m.get('trous') or []).buffer(0) for m in P.get('masses', []) if m.get('level', 0) == k]) for k in range(n)]
    for k, l in enumerate(P['levels']):
        l.pop('pieds', None); l.pop('joints', None)
        if not k or M[k].is_empty:
            continue
        pose = M[k].intersection(M[k - 1]).buffer(-0.002, join_style='mitre').buffer(0.002, join_style='mitre').intersection(M[k])  # sans liseré
        l['pieds'] = _parts(pose, 0.0002, 4)
        l['joints'] = _parts(M[k].difference(pose).intersection(V[k].buffer(0.03, join_style='mitre')), 0.00005, 4) if not V[k].is_empty else []


def complete(P, extract):
    """complément de chaque niveau sur son sous-plan (code d'un seul niveau), puis fusion et parties globales"""
    L = _L(); lv = lambda el: el.get('level', 0)
    notes = []; n = len(P['levels'])
    ent = next((k for k, l in enumerate(P['levels']) if l.get('entry')), 0)
    subs = []; pris = set()
    for k in range(n):
        Pk = sous_plan(P, k)
        Pk['context'] = {}
        nk = L.complete(Pk, extract, ids_pris=pris)
        notes += [f"{P['levels'][k]['name']} : {x}" for x in nk]
        P.setdefault('_avertir', []).extend(Pk.pop('_avertir', []))  # arrêt impossible à cadrer : l'acquéreur est prévenu
        if Pk.get('sans_arret'):
            P.setdefault('sans_arret', []).extend(Pk.pop('sans_arret'))
        pris |= {r['id'] for r in Pk['rooms']}
        subs.append(Pk)
    # fusion
    P['walls'] = [w for Pk in subs for w in Pk['walls'] if not w.get('_vide')]
    P['rooms'] = []
    for k, Pk in enumerate(subs):
        for r in Pk['rooms']:
            r['level'] = k
        P['rooms'] += Pk['rooms']
    for k, Pk in enumerate(subs):
        P['levels'][k]['outline'] = Pk['outline']
        for c in ('masses', 'lamps', 'passages'):
            for x in Pk.get(c, []):
                x['level'] = k
    P['masses'] = [m for Pk in subs for m in Pk['masses']]
    aligne_masses(P)  # chaque sous-plan a ses masses : le calage sur le niveau du dessous se fait après la fusion
    P['lamps'] = [x for Pk in subs for x in Pk.get('lamps', [])]
    P['passages'] = [x for Pk in subs for x in Pk.get('passages', [])]
    P['probes'] = {i: p for Pk in subs for i, p in Pk.get('probes', {}).items()}
    for c in ('H', 'simple', 'moments', 'underlay'):
        if c in subs[ent]:
            P[c] = subs[ent][c]
    P['H'] = P['levels'][0]['H']
    P['outline'] = P['levels'][ent]['outline']
    bs = [Pk['bounds'] for Pk in subs]
    P['bounds'] = [min(b[0] for b in bs), max(b[1] for b in bs), min(b[2] for b in bs), max(b[3] for b in bs)]
    # palier d'arrivée : une sonde pour la lumière, et un passage vers chaque pièce ouverte sur lui
    for r in [r for r in P['rooms'] if r.get('hidden') and not r.get('of') and str(r['id']).startswith('palier')]:
        k = lv(r); Pk = subs[k]
        c = L.centre(r['poly'])
        P['probes'].setdefault(r['id'], L.free_point(r, Pk['walls'], c[0], c[1], 0.2))
        Wk = _union_murs(Pk['walls'])
        for q in Pk['rooms']:
            if q is r or q.get('hidden') or q.get('of') or q.get('ext'):
                continue
            e = Polygon(r['poly']).buffer(0.03).intersection(Polygon(q['poly']).buffer(0.03)).difference(Wk)
            e = [g for g in murs.polys(e) if g.area > 0.005]
            if e:
                g = max(e, key=lambda q_: q_.area); rp = g.representative_point()
                P['passages'].append({'a': r['id'], 'b': q['id'], 'p': [round(rp.x, 3), round(rp.y, 3)], 'r': 0.9, 'level': k})
    # photos : celles des pièces, niveau d'entrée d'abord ; puis une vue d'ensemble par niveau
    ordre = [ent] + list(range(ent + 1, n)) + list(range(ent - 1, -1, -1))
    photos = []
    for k in ordre:
        for ph in subs[k].get('photos', []):
            if not ph.get('orbit'):
                photos.append({**ph, 'level': k})
    # même nom de pièce sur deux niveaux (« Loggia ») : niveau en suffixe dans le titre et la légende, comme dans la visite guidée
    noms = {}
    for r in P['rooms']:
        if not r.get('hidden') and not r.get('of') and r.get('name'):
            noms.setdefault(r['name'], set()).add(lv(r))
    R = {r['id']: r for r in P['rooms']}
    for ph in photos:
        r = R.get(ph.get('room'))
        if r and len(noms.get(r.get('name'), ())) > 1:
            nm, suf = r['name'], f"{r['name']} · {P['levels'][lv(r)]['name']}"
            for c in ('t', 'a'):
                if isinstance(ph.get(c), str) and ph[c].startswith(nm) and not ph[c].startswith(suf):
                    ph[c] = suf + ph[c][len(nm):]
    photos += [{'id': f"maquette-{P['levels'][k]['id']}", 'level': k, 't': f"Vue d'ensemble · {P['levels'][k]['name']}", 'a': 'maquette 3D', 'orbit': True} for k in range(n)]
    P['photos'] = photos
    # arrêts : niveau d'entrée (au plus proche en partant de l'entrée), « Escalier », puis le niveau suivant depuis l'arrivée
    stops = []
    for j, k in enumerate(ordre):
        st = [{**s, 'level': k} for s in subs[k].get('stops', [])]
        if not st:
            continue
        if j == 0:
            stops += _ordonne(st, st[0]); continue
        prev = ordre[j - 1] if ordre[j - 1] in (k - 1, k + 1) else None
        s = next((s for s in P['stairs'] if prev is not None and {s['from'], s['to']} == {prev, k}), None)
        if s:
            monte = s['from'] == prev
            deja = [q for q in stops if q['level'] == (s['from'] if monte else s['to'])]
            a = arret_escalier(P, s, 0, monte, deja)
            if a:
                stops.append(a)
            else:
                q = role_escalier(P, s, monte, deja)
                if q:
                    q['stair'] = s['id']
                    notes.append(f"Escalier : l'arrêt « {q.get('label', q['id'])} » voit le pied de la volée, il sert d'arrêt d'escalier.")
            cible = s['line'][-1] if monte else s['line'][0]
            stops += _ordonne(st, min(st, key=lambda q: math.dist(q['p'], cible)))
        else:
            stops += _ordonne(st, st[0])
    P['stops'] = stops
    # contexte : palier devant la porte palière (niveau d'entrée), étages voisins sous le niveau 0 et au-dessus du plus haut
    ctx = {}
    m_ = None
    if P.get('etage') is not None:
        import re
        m_ = re.search(r'-?\d+', str(P['etage']))
    ctx['level'] = round(P['levels'][0]['H'] + DALLE, 3)
    ctx['below'] = max(0, int(m_.group()) - ent) if m_ else 2
    ctx['above'] = 2; ctx['masses'] = []
    pal = (subs[ent].get('context') or {}).get('palier')
    if pal:
        ctx['palier'] = {**pal, 'level': ent}
    L.abords(ctx, P['bounds'])
    P['context'] = ctx
    dalles(P)
    # rien de ce qui éclaire ou cadre ne tombe dans un vide ou sur une volée
    obst = [(k, Polygon(p).buffer(0)) for k in range(n) for p in obstacles(P, k)]
    dedans = lambda k, p: any(kk == k and g.contains(Point(p)) for kk, g in obst)
    P['lamps'] = [x for x in P['lamps'] if not dedans(lv(x), x['p'])]
    notes.append(f"{n} niveaux superposés, {len(P['stairs'])} escalier(s).")
    P.setdefault('titre', 'Logement ' + str(P.get('id', '')))
    P.setdefault('cartouche', {'id': str(P.get('id', '')), 'l1': '', 'l2': '', 'l3': ''})
    P.setdefault('note', "Images de synthèse calculées automatiquement à partir du plan de vente. Logement vide, finitions supposées. Non contractuel.")
    return notes


# ---------- réparations après la visite de contrôle (moteur/controle.mjs) ----------
def _arrivees(P, v):
    """zones d'arrivée des escaliers qui débouchent dans le vide v : jamais de garde-corps en travers"""
    out = []
    for s in P.get('stairs', []):
        if s.get('void') != v['id']:
            continue
        fin = s['line'][-1]; u = _dir(s['line'][-2], s['line'][-1]); nrm = _perp(u); w2 = s['width'] / 2 + 0.02
        out.append(LineString([(fin[0] + nrm[0] * w2, fin[1] + nrm[1] * w2), (fin[0] - nrm[0] * w2, fin[1] - nrm[1] * w2)]).buffer(0.02, cap_style='flat'))
    return out


def _rails_libres(P, v):
    """garde-corps que demande chaque bord libre du vide v (ni mur, ni arrivée)"""
    k = v['level']
    W = _union_murs([w for w in P['walls'] if w.get('level', 0) == k], [g for g in P.get('gaines', []) if g.get('level', 0) == k])
    return garde_corps(Polygon(v['poly']).buffer(0), W, _arrivees(P, v))


def _rails_ajoute(v, runs):
    """ajoute aux garde-corps du vide les tronçons pas encore couverts (2 cm près) ; renvoie le nombre d'ajouts"""
    deja = unary_union([LineString(r) for r in v.get('rails', []) if len(r) >= 2]).buffer(0.02) if v.get('rails') else Polygon()
    n = 0
    for r in runs:
        if len(r) >= 2 and LineString(r).difference(deja).length > 0.05:
            v.setdefault('rails', []).append(r); n += 1
    return n


def repare(P, probs):
    """réparations sûres des défauts propres aux niveaux ; les autres (marches hors norme, pied sans pièce, équipement
    dans un vide, montée impossible, trop de lampes à ombre…) ne sont pas réparés et bloquent la publication"""
    lv = lambda el: el.get('level', 0); fixed = []; refaire_dalles = False
    voids = {v['id']: v for v in P.get('voids', [])}
    stairs = {s['id']: s for s in P.get('stairs', [])}
    for p in probs:
        t, texte = p.get('type'), p.get('texte', '')
        if t == 'vide' and p.get('piece'):  # pièce sur un vide ou sur une volée : le vide est retiré de la pièce
            r = next((q for q in P['rooms'] if q['id'] == p['piece']), None)
            o = voids.get(p.get('vide')) or stairs.get(p.get('escalier'))
            if r and o:
                g = Polygon(r['poly']).buffer(0); h = g.difference(Polygon(o['poly']).buffer(0.005, join_style='mitre'))
                h = max(murs.polys(h), key=lambda q: q.area, default=None)
                if h is not None and h.area >= 0.8 * g.area:
                    r['poly'] = murs.ring(h.simplify(0.002)); fixed.append(texte + ' (pièce recoupée)')
        elif t == 'vide' and p.get('garde_corps') == 'arrivee':  # garde-corps en travers de l'arrivée : retiré à cet endroit
            v = voids.get(p['id'])
            if v:
                arr = unary_union(_arrivees(P, v)).buffer(0.1)
                rails = []
                for r in v.get('rails', []):
                    for q in _lignes(LineString(r).difference(arr)):
                        if q.length >= 0.1:
                            rails.append([[round(x, 3), round(z, 3)] for x, z in q.coords])
                v['rails'] = rails; fixed.append(texte + ' (garde-corps retiré)')
        elif t == 'vide' and pt_ok(p.get('p')) and not p.get('equipement') and not p.get('a'):  # on marche dans le vide : garde-corps sur le bord libre voisin
            v = voids.get(p['id'])
            if v:
                runs = [r for r in _rails_libres(P, v) if LineString(r).distance(Point(p['p'])) < 0.6]
                if _rails_ajoute(v, runs):
                    fixed.append(texte + ' (garde-corps ajouté)')
        elif t == 'escalier' and 'ecart' in p:  # dernière contremarche décalée : recalée sur le bord d'arrivée du vide
            s = stairs.get(p['id']); v = voids.get(s.get('void')) if s else None
            if s and v:
                u = _dir(s['line'][-2], s['line'][-1]); ba = bord_arrivee(Polygon(v['poly']).buffer(0), s['line'][-1], u)
                if ba and 0.001 < abs(ba[2]) <= 0.15:
                    f = s['line'][-1]; s['line'][-1] = [round(f[0] + u[0] * ba[2], 3), round(f[1] + u[1] * ba[2], 3)]
                    ls = LineString(s['line']); s['going'] = round(ls.length / max(1, s['n'] - 1), 4)
                    s['poly'] = murs.ring(ls.buffer(s['width'] / 2, cap_style='flat', join_style='mitre'))
                    fixed.append(texte + ' (escalier recalé)')
        elif t == 'rebord':  # rebord au raccord de deux niveaux : murs recalés sur ceux du dessous, trous de dalle prolongés
            _L().calc_masses(P); refaire_dalles = True; fixed.append(texte + ' (murs recalés)')
        elif t == 'dalle' and p.get('id') != 'facade':  # trou ou dalles superposées : dalles, plafonds et toits recalculés (façade qui scintille : moteur)
            refaire_dalles = True; fixed.append(texte + ' (dalles recalculées)')
        elif t == 'lampes' and str(p.get('id', '')).startswith('lampe-') and pt_ok(p.get('p')):  # lampe dans un vide : retirée
            k = p.get('level', 0); n0 = len(P.get('lamps', []))
            P['lamps'] = [x for x in P.get('lamps', []) if not (lv(x) == k and math.dist(x['p'], p['p']) < 0.05)]
            if len(P['lamps']) < n0:
                fixed.append(texte + ' (lampe retirée)')
        elif t == 'niveau' and p.get('piece') and pt_ok(p.get('p')):  # pièce qui déborde du contour de son niveau : recoupée au contour
            r = next((q for q in P['rooms'] if q['id'] == p['piece']), None); k = lv(r) if r else 0
            if r and P.get('levels') and k < len(P['levels']):
                g = Polygon(r['poly']).buffer(0); h = g.intersection(Polygon(P['levels'][k]['outline']).buffer(0))
                h = max(murs.polys(h), key=lambda q: q.area, default=None)
                if h is not None and h.area >= 0.95 * g.area:
                    r['poly'] = murs.ring(h.simplify(0.002)); fixed.append(texte + ' (pièce recoupée)')
        elif t == 'niveau' and p.get('liste') in ('stops', 'photos'):  # id en double (arrêt ou vue, jamais référencés ailleurs)
            vus = set()
            for q in P.get(p['liste'], []):
                if q.get('id') == p['id'] and q['id'] in vus:
                    q['id'] = f"n{lv(q)}-{q['id']}"
                    while q['id'] in vus:
                        q['id'] += '-b'
                    fixed.append(texte + ' (renommé)')
                vus.add(q.get('id'))
    if refaire_dalles:
        dalles(P)
    return fixed


def _lignes(g):
    if g.is_empty:
        return []
    return [g] if g.geom_type == 'LineString' else [q for q in getattr(g, 'geoms', []) if q.geom_type == 'LineString']


def pt_ok(p):
    return isinstance(p, (list, tuple)) and len(p) == 2 and all(_num(v) for v in p)
