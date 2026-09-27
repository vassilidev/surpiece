"""Évaluation d'une lecture automatique contre un plan de référence relevé à la main.

  python3 pipeline/evaluer.py plans/<auto>/plan.json <référence>
  référence : un plan.json, ou « d201 » (visite de production du D201, references/d201.app-d.json),
  ou « 432 » (relevé manuel du T2 432, references/432.plan.json)

Recale la lecture sur la référence (translation), puis mesure : murs (recouvrement), pièces (surface,
recouvrement), ouvertures (type, position, largeur, charnières, sens d'ouverture), équipements (type, position).
"""
import json, math, sys
from pathlib import Path
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'pipeline'))
from lire import wall_quad, op_frame, centroid, area  # noqa: E402

KIND = {'entry': 'porte', 'door': 'porte', 'window': 'baie', 'french': 'baie'}


def norm_name(s):
    s = (s or '').lower()
    for k, v in (('séjour', 'sejour'), ('salon', 'sejour'), ('cuisine', 'sejour'), ('chambre', 'chambre'), ('bain', 'sdb'), ("d'eau", 'sdb'), ('sdb', 'sdb'),
                 ('wc', 'wc'), ('toilet', 'wc'), ('entr', 'entree'), ('dégag', 'entree'), ('loggia', 'loggia'), ('balcon', 'loggia'), ('placard', 'placard')):
        if k in s:
            return v
    return s


def from_plan(P):
    """modèle d'évaluation depuis un plan.json (manuel ou automatique)"""
    W = {w['id']: w for w in P['walls']}
    walls = unary_union([Polygon(wall_quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    ops = []
    for oid, o in P['openings'].items():
        (L, u, T, pt), (s0, s1), t = op_frame(o, W)
        t = o.get('depth', t)  # une baie peut traverser plusieurs couches (doublage + béton)
        c = pt((s0 + s1) / 2, t / 2)
        cut = Polygon([pt(s0, -0.02), pt(s1, -0.02), pt(s1, t + 0.02), pt(s0, t + 0.02)])
        walls = walls.difference(cut)
        d = {'id': oid, 'kind': KIND.get(o['kind'], o['kind']), 'k': o['kind'], 'c': c, 'w': s1 - s0}
        if o['kind'] in ('door', 'entry'):
            sw = o.get('swing', 1); hs = s0 if o.get('hinge', 's0') == 's0' else s1
            d['hinge'] = pt(hs, t / 2); d['open'] = (T[0] * sw, T[1] * sw)
        ops.append(d)
    rooms = [{'id': r['id'], 'n': norm_name(r.get('name') or r['id']), 'name': r.get('name') or r['id'], 'poly': Polygon(r['poly']).buffer(0), 'area': r.get('area')}
             for r in P['rooms'] if not r.get('hidden') and not r.get('of') and len(r.get('poly', [])) >= 3]
    fx = []
    for f in P.get('fixtures', []):
        if 'x' in f:
            c = ((f['x'][0] + f['x'][1]) / 2, (f['z'][0] + f['z'][1]) / 2)
        elif 'p' in f:  # cuvette : point contre le mur, orientée par dir
            d = f.get('dir', [0, 0]) if f['type'] == 'wc' else [0, 0]
            c = (f['p'][0] + d[0] * 0.33, f['p'][1] + d[1] * 0.33)
        else:
            c = None
        if c:
            fx.append({'t': f['type'], 'c': c, **({'dir': tuple(f['dir'])} if f.get('dir') else {})})
    return {'walls': walls, 'ops': ops, 'rooms': rooms, 'fx': fx}


def from_d201():
    """modèle d'évaluation depuis la visite de production du D201 (données App.D, plan d'origine sans TMA)"""
    D = json.loads((ROOT / 'references' / 'd201.app-d.json').read_text())  # App.D de la visite de production, extrait tel quel
    rect = lambda r: box(r['x'][0], r['z'][0], r['x'][1], r['z'][1])
    wl = D['beton'] + D['doublage'] + D['cloisons'] + D['gaines']
    walls = unary_union([rect(w) for w in wl] + [box(a, D['loggia']['postZ'][0], b, D['loggia']['postZ'][1]) for a, b in D['loggia'].get('posts', [])])
    ops = []
    for oid, o in D['openings'].items():
        w = next((q for q in wl if oid in q.get('open', [])), None)
        if not w:
            continue
        ax = o['axis']; a0, a1 = o['a']; dr = w['z'] if ax == 'x' else w['x']
        if o['kind'] == 'entry':
            dr = [-3.685, -3.325]
        P2 = (lambda s, d: (s, d)) if ax == 'x' else (lambda s, d: (d, s))
        # la baie traverse aussi le doublage collé au mur porteur
        walls = walls.difference(Polygon([P2(a0, dr[0] - 0.15), P2(a1, dr[0] - 0.15), P2(a1, dr[1] + 0.15), P2(a0, dr[1] + 0.15)]))
        c = P2((a0 + a1) / 2, (dr[0] + dr[1]) / 2)
        d = {'id': oid, 'kind': KIND.get(o['kind'], o['kind']), 'k': o['kind'], 'c': c, 'w': a1 - a0}
        if o['kind'] in ('door', 'entry'):
            hs = a0 if o.get('hinge') == 'a0' else a1
            d['hinge'] = P2(hs, (dr[0] + dr[1]) / 2); d['open'] = P2(0, o.get('swing', 1))
        ops.append(d)
    rooms = []
    for r in D['rooms']:
        if r.get('hidden'):
            continue
        rooms.append({'id': r['id'], 'n': norm_name(r['name']), 'name': r['name'], 'poly': unary_union([box(q[0], q[2], q[1], q[3]) for q in r['rects']]), 'area': r.get('area')})
    s = D['sanitary']; fx = []
    def dos(r):  # côté du rectangle collé à un mur : l'équipement regarde à l'opposé
        (x0, x1), (z0, z1) = r['x'], r['z']; cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        for (px, pz), d in (((x0 - 0.03, cz), (1, 0)), ((x1 + 0.03, cz), (-1, 0)), ((cx, z0 - 0.03), (0, 1)), ((cx, z1 + 0.03), (0, -1))):
            if walls.contains(Point(px, pz)):
                return d
        return None
    for k, t in (('bath', 'bath'), ('basin', 'vanity'), ('wc', 'wc'), ('towel', 'towel'), ('tableau', 'tableau')):
        if k in s:
            d = dos(s[k]) if t in ('wc', 'vanity') else None
            fx.append({'t': t, 'c': ((s[k]['x'][0] + s[k]['x'][1]) / 2, (s[k]['z'][0] + s[k]['z'][1]) / 2), **({'dir': d} if d else {})})
    fx.append({'t': 'placard', 'c': ((3.737 + 5.046) / 2, (-2.115 - 1.45) / 2)})
    return {'walls': walls, 'ops': ops, 'rooms': rooms, 'fx': fx}


def shift(m, dx, dz):
    from shapely.affinity import translate
    t = lambda p: (p[0] + dx, p[1] + dz)
    return {'walls': translate(m['walls'], dx, dz), 'ops': [{**o, 'c': t(o['c']), **({'hinge': t(o['hinge'])} if 'hinge' in o else {})} for o in m['ops']],
            'rooms': [{**r, 'poly': translate(r['poly'], dx, dz)} for r in m['rooms']], 'fx': [{**f, 'c': t(f['c'])} for f in m['fx']]}


def align(ref, auto):
    """translation qui cale la lecture sur la référence : d'abord par les pièces de même nom, puis affinée sur les murs"""
    ds = []
    for r in ref['rooms']:
        cand = [a for a in auto['rooms'] if a['n'] == r['n']]
        if cand:
            a = min(cand, key=lambda a: abs(a['poly'].area - r['poly'].area))
            ds.append((r['poly'].centroid.x - a['poly'].centroid.x, r['poly'].centroid.y - a['poly'].centroid.y))
    if not ds:
        rb, ab = ref['walls'].bounds, auto['walls'].bounds; ds = [(rb[0] - ab[0], rb[1] - ab[1])]
    ds.sort(); dx = sorted(d[0] for d in ds)[len(ds) // 2]; dz = sorted(d[1] for d in ds)[len(ds) // 2]
    best = (-1, dx, dz)
    for step, span in ((0.05, 0.6), (0.01, 0.06)):
        cx, cz = best[1], best[2]
        n = int(round(span / step))
        for i in range(-n, n + 1):
            for j in range(-n, n + 1):
                x, z = cx + i * step, cz + j * step
                from shapely.affinity import translate
                g = translate(auto['walls'], x, z)
                iou = ref['walls'].intersection(g).area / max(1e-9, ref['walls'].union(g).area)
                if iou > best[0]:
                    best = (iou, x, z)
    return best


def evaluate(ref, auto):
    iou, dx, dz = align(ref, auto)
    A = shift(auto, dx, dz)
    out = {'recalage': [round(dx, 3), round(dz, 3)], 'murs_recouvrement': round(iou, 3)}
    # pièces
    rooms = []
    for r in ref['rooms']:
        cand = [a for a in A['rooms'] if a['n'] == r['n']] or A['rooms']
        a = max(cand, key=lambda a: r['poly'].intersection(a['poly']).area) if cand else None
        rr = {'ref': r['name'], 'lu': a['name'] if a else None}
        if a:
            rr['recouvrement'] = round(r['poly'].intersection(a['poly']).area / max(1e-9, r['poly'].union(a['poly']).area), 3)
            rr['surface_ref'] = round(r['poly'].area, 2); rr['surface_lue'] = round(a['poly'].area, 2)
        rooms.append(rr)
    out['pieces'] = rooms
    # ouvertures
    used, ops = set(), []
    for o in ref['ops']:
        cand = [(math.dist(o['c'], a['c']), i, a) for i, a in enumerate(A['ops']) if a['kind'] == o['kind'] and i not in used]
        cand.sort()
        if not cand or cand[0][0] > 0.6:
            ops.append({'ref': o['id'], 'k': o['k'], 'statut': 'MANQUANTE'}); continue
        d, i, a = cand[0]; used.add(i)
        e = {'ref': o['id'], 'lu': a['id'], 'k': o['k'], 'ecart_centre_cm': round(d * 100, 1), 'ecart_largeur_cm': round((a['w'] - o['w']) * 100, 1)}
        if 'hinge' in o and 'hinge' in a:
            e['charnieres_ok'] = math.dist(o['hinge'], a['hinge']) < max(0.25, o['w'] / 2 - 0.05)
            e['sens_ok'] = (o['open'][0] * a['open'][0] + o['open'][1] * a['open'][1]) > 0
        ops.append(e)
    extra = [a['id'] for i, a in enumerate(A['ops']) if i not in used]
    out['ouvertures'] = ops; out['ouvertures_en_trop'] = extra
    # équipements
    usedf, fxs = set(), []
    for f in ref['fx']:
        cand = sorted((math.dist(f['c'], a['c']), i) for i, a in enumerate(A['fx']) if a['t'] == f['t'] and i not in usedf)
        if not cand or cand[0][0] > 0.8:
            fxs.append({'ref': f['t'], 'statut': 'MANQUANT' if not cand else f'MAL PLACÉ ({cand[0][0]:.2f} m)'})
            if cand:
                usedf.add(cand[0][1])
            continue
        usedf.add(cand[0][1]); e = {'ref': f['t'], 'ecart_cm': round(cand[0][0] * 100, 1)}
        a = A['fx'][cand[0][1]]
        if f.get('dir') and a.get('dir'):
            e['orientation_ok'] = f['dir'][0] * a['dir'][0] + f['dir'][1] * a['dir'][1] > 0.7
        fxs.append(e)
    out['equipements'] = fxs; out['equipements_en_trop'] = [A['fx'][i]['t'] for i in range(len(A['fx'])) if i not in usedf]
    # note globale simple : ce qui est juste sur ce qui existe
    ok = sum(1 for o in ops if o.get('lu') and o['ecart_centre_cm'] <= 15 and abs(o['ecart_largeur_cm']) <= 15 and o.get('sens_ok', True) and o.get('charnieres_ok', True))
    okf = sum(1 for f in fxs if 'ecart_cm' in f and f['ecart_cm'] <= 30 and f.get('orientation_ok', True))
    okr = sum(1 for r in rooms if r.get('recouvrement', 0) >= 0.9)
    out['synthese'] = {'ouvertures_justes': f'{ok}/{len(ops)}', 'equipements_justes': f'{okf}/{len(fxs)}', 'pieces_justes': f'{okr}/{len(rooms)}',
                       'en_trop': len(extra) + len(out['equipements_en_trop']), 'murs_recouvrement': round(iou, 3)}
    return out


if __name__ == '__main__':
    auto = from_plan(json.loads(Path(sys.argv[1]).read_text()))
    cible = {'432': ROOT / 'references' / '432.plan.json'}.get(sys.argv[2], sys.argv[2])
    ref = from_d201() if sys.argv[2] == 'd201' else from_plan(json.loads(Path(cible).read_text()))
    r = evaluate(ref, auto)
    print(json.dumps(r, ensure_ascii=False, indent=1))
