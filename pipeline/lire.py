"""Lecture du plan par Claude, puis contrôle et complément sans IA.

Entrée : dossier du plan contenant extract.json (PDF vectoriel) ou calibration.json (image),
         plus plan-src.png (et page.png pour le cartouche).
Sortie : plan.json lisible par moteur/engine.js, et rapport.json (contrôles, avertissements, coût).
"""
import base64, copy, json, math, os, re, sys, time, warnings
from pathlib import Path
try:  # obligatoire : recalage des baies, découpe des murs, contour, cadrages
    from shapely.geometry import Polygon, Point, LineString
    from shapely.ops import unary_union, polylabel
except ImportError as _err:
    raise ImportError('Module shapely manquant : pip3 install shapely (voir pipeline/README.md).') from _err

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import murs, apercu  # noqa: E402  murs propres ; images de relecture
MODEL = os.environ.get('PLAN_MODEL', 'claude-opus-5')
PRIX = {'claude-opus-5': (5, 25), 'claude-opus-5-5': (4, 20), 'claude-sonnet-5': (2, 10), 'claude-fable-5-1': (10, 50)}  # $ par million de jetons
EUR = 0.9


# ---------- géométrie ----------
def area(p):
    return sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p))) / 2


def centroid(p):
    if not p:
        return [0.0, 0.0]
    A = area(p)
    if abs(A) < 1e-9:
        return [sum(q[0] for q in p) / len(p), sum(q[1] for q in p) / len(p)]
    cx = sum((p[i][0] + p[(i + 1) % len(p)][0]) * (p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1]) for i in range(len(p))) / (6 * A)
    cz = sum((p[i][1] + p[(i + 1) % len(p)][1]) * (p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1]) for i in range(len(p))) / (6 * A)
    return [cx, cz]


def centre(p):
    """point d'ancrage d'une pièce (sonde, lampe, étiquette) : son centroïde s'il est bien à l'intérieur,
    sinon le pôle d'inaccessibilité (pièce en L ou en U, dont le centroïde tombe dehors ou contre un angle)"""
    g = Polygon(p).buffer(0)
    if g.is_empty:
        return centroid(p)
    if g.geom_type != 'Polygon':
        g = max(g.geoms, key=lambda q: q.area)
    c = centroid(p); lp = polylabel(g, 0.02)
    if g.contains(Point(*c)) and g.boundary.distance(Point(*c)) >= 0.6 * g.boundary.distance(lp):
        return c
    return [lp.x, lp.y]


def inside(x, z, poly):
    c = False; j = len(poly) - 1
    for i in range(len(poly)):
        xi, zi = poly[i]; xj, zj = poly[j]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            c = not c
        j = i
    return c


def seg_dist(x, z, a, b):
    ex, ez = b[0] - a[0], b[1] - a[1]; l2 = ex * ex + ez * ez or 1e-12
    t = max(0, min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / l2))
    return math.hypot(x - a[0] - t * ex, z - a[1] - t * ez)


def wall_frame(w):
    dx, dz = w['b'][0] - w['a'][0], w['b'][1] - w['a'][1]; L = math.hypot(dx, dz)
    u = (dx / L, dz / L); n = (-u[1], u[0]); s = w.get('side', 1); T = (n[0] * s, n[1] * s)
    pt = lambda ss, d: [w['a'][0] + u[0] * ss + T[0] * d, w['a'][1] + u[1] * ss + T[1] * d]
    return L, u, T, pt


def wall_quad(w):
    if 'poly' in w:
        return w['poly']
    L, u, T, pt = wall_frame(w)
    return [pt(0, 0), pt(L, 0), pt(L, w['t']), pt(0, w['t'])]


# ---------- appel à Claude ----------
def img_block(path, max_side=1800):
    from PIL import Image
    import io
    im = Image.open(path).convert('RGB')
    if max(im.size) > max_side:
        k = max_side / max(im.size); im = im.resize((round(im.width * k), round(im.height * k)))
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    return {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/png', 'data': base64.standard_b64encode(buf.getvalue()).decode()}}


def provider():
    """anthropic (API directe, recommandée) ou openrouter (format OpenAI) selon les clés présentes"""
    p = os.environ.get('PLAN_PROVIDER')
    if p:
        return p
    return 'anthropic' if os.environ.get('ANTHROPIC_API_KEY') else 'openrouter' if os.environ.get('OPENROUTER_API_KEY') else None


def model_id():
    m = os.environ.get('PLAN_MODEL', MODEL)
    return ('anthropic/' + m.replace('claude-opus-5-5', 'claude-opus-5.5') if provider() == 'openrouter' and '/' not in m else m)


def call(system, messages, log, effort=None, max_tokens=100000, progress=None):
    """un appel au modèle, réponse reçue en continu ; progress(n) reçoit le nombre de caractères écrits"""
    effort = effort or os.environ.get('PLAN_EFFORT', 'medium')
    t0 = time.time(); prov = provider(); mid = model_id()
    pin, pout = PRIX.get(mid.split('/')[-1].replace('.', '-'), (5, 25))
    if prov == 'openrouter':
        import urllib.request, ssl
        def conv(c):
            if isinstance(c, str):
                return c
            out = []
            for b_ in c:
                if b_['type'] == 'image':
                    out.append({'type': 'image_url', 'image_url': {'url': f"data:{b_['source']['media_type']};base64,{b_['source']['data']}"}})
                elif b_['type'] == 'text':
                    out.append({'type': 'text', 'text': b_['text']})
            return out
        body = {'model': mid, 'max_tokens': max_tokens, 'stream': True, 'reasoning': {'effort': effort, 'exclude': True}, 'usage': {'include': True},
                'messages': [{'role': 'system', 'content': system}] + [{'role': m['role'], 'content': conv(m['content'])} for m in messages]}
        req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions', data=json.dumps(body).encode(),
                                     headers={'Authorization': 'Bearer ' + os.environ['OPENROUTER_API_KEY'], 'Content-Type': 'application/json', 'X-Title': 'Visite de plans'})
        try:
            import certifi; ctx = ssl.create_default_context(cafile=certifi.where())
        except ImportError:
            ctx = ssl.create_default_context()
        text, usage, finish, model = [], {}, None, mid
        import urllib.error
        try:
            r = urllib.request.urlopen(req, timeout=1800, context=ctx)
        except urllib.error.HTTPError as err:
            detail = err.read().decode('utf-8', 'ignore')[:300]
            raise RuntimeError({402: 'Crédit OpenRouter insuffisant : rechargez le compte (openrouter.ai, Credits).', 401: 'Clé OpenRouter refusée.',
                                429: 'Trop de demandes en même temps chez OpenRouter : relancez dans une minute.'}.get(err.code, f'OpenRouter a répondu {err.code}.') + ' ' + detail)
        with r:
            for raw in r:
                line = raw.decode('utf-8', 'ignore').strip()
                if not line.startswith('data:'):
                    continue
                data = line[5:].strip()
                if data == '[DONE]':
                    break
                try:
                    ev = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if 'error' in ev:
                    raise RuntimeError('OpenRouter : ' + str(ev['error'])[:300])
                model = ev.get('model', model); usage = ev.get('usage') or usage
                for ch in ev.get('choices', []):
                    d = ch.get('delta', {})
                    if d.get('content'):
                        text.append(d['content'])
                        if progress:
                            progress(sum(len(t) for t in text))
                    finish = ch.get('finish_reason') or finish
        cost = usage.get('cost') if usage.get('cost') is not None else ((usage.get('prompt_tokens', 0) * pin + usage.get('completion_tokens', 0) * pout) / 1e6)
        log.append({'fournisseur': 'openrouter', 'modele': model, 'effort': effort, 'entree': usage.get('prompt_tokens'), 'sortie': usage.get('completion_tokens'),
                    'reflexion': (usage.get('completion_tokens_details') or {}).get('reasoning_tokens'), 'cout_usd': round(cost or 0, 3), 'duree_s': round(time.time() - t0)})
        if finish == 'length':
            raise RuntimeError('Réponse tronquée (plan trop complexe pour une seule passe).')
        text = ''.join(text)
        return {'text': text, 'assistant': text}
    import anthropic
    client = anthropic.Anthropic(); n = 0
    with client.beta.messages.stream(model=mid, max_tokens=max_tokens, system=[{'type': 'text', 'text': system, 'cache_control': {'type': 'ephemeral'}}],
                                     messages=messages, thinking={'type': 'adaptive'}, output_config={'effort': effort},
                                     betas=['server-side-fallback-2026-07-01'], fallbacks='default') as st:
        for t in st.text_stream:
            n += len(t)
            if progress:
                progress(n)
        msg = st.get_final_message()
    u = msg.usage
    cost = ((u.input_tokens or 0) * pin + (u.cache_creation_input_tokens or 0) * pin * 1.25 + (u.cache_read_input_tokens or 0) * pin * 0.1 + (u.output_tokens or 0) * pout) / 1e6
    log.append({'fournisseur': 'anthropic', 'modele': msg.model, 'effort': effort, 'entree': u.input_tokens, 'cache_ecrit': u.cache_creation_input_tokens, 'cache_lu': u.cache_read_input_tokens, 'sortie': u.output_tokens, 'cout_usd': round(cost, 3), 'duree_s': round(time.time() - t0)})
    if msg.stop_reason == 'refusal':
        raise RuntimeError('La lecture a été refusée par le modèle.')
    if msg.stop_reason == 'max_tokens':
        raise RuntimeError('Réponse tronquée (plan trop complexe pour une seule passe).')
    return {'text': ''.join(b_.text for b_ in msg.content if b_.type == 'text'), 'assistant': msg.content}


def parse_json(res, need=None):
    """JSON de la réponse, tolérant aux petites fautes (virgule finale, commentaires, texte autour).
    Plusieurs blocs de code : on essaie du dernier au premier et on garde le premier objet qui contient la clé need (ou l'une des clés)."""
    text = res['text'] if isinstance(res, dict) else res
    def load(raw):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            fixed = re.sub(r'//[^\n"]*\n', '\n', raw)
            fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
            fixed = fixed.replace('NaN', 'null').replace('Infinity', 'null')
            return json.loads(fixed)
    keys = (need,) if isinstance(need, str) else need or ()
    good = lambda v: isinstance(v, dict) and (not keys or any(k in v for k in keys))
    cands = re.findall(r'```[A-Za-z]*\s*(\{.*?\})\s*```', text, re.S)[::-1] + [text[text.find('{'): text.rfind('}') + 1]]
    err = None
    for raw in cands:
        try:
            v = load(raw)
        except json.JSONDecodeError as e:
            err = err or e; continue
        if good(v):
            return v
    dec = json.JSONDecoder()  # dernier recours : un objet complet à partir de chaque accolade
    for m in re.finditer(r'\{', text):
        try:
            v = dec.raw_decode(text, m.start())[0]
        except json.JSONDecodeError:
            continue
        if good(v):
            return v
    raise err or json.JSONDecodeError(f'aucun objet JSON{" avec « " + " / ".join(keys) + " »" if keys else ""}', text, 0)


SYSTEM = """Tu lis des plans de vente d'appartements neufs (promoteurs français) pour construire une maquette 3D fidèle.

Les tracés vectoriels du PDF sont fournis en mètres. Les murs porteurs sont les remplissages noirs : le programme les reprend tels quels, tu n'as pas à les recopier. Ton travail : classer ce qui doit l'être et décrire ce que les tracés ne disent pas seuls (pièces, ouvertures, équipements).

Réponds uniquement par un JSON compact (sans indentation, 2 décimales), dans un bloc ```json, avec ces clés :
- "murs_exclus" : indices (position dans la liste murs_noirs, 0 = premier) des remplissages noirs qui ne sont pas des murs de ce logement (flèche d'entrée, rose des vents, logo, texte, plan de situation, mobilier plein).
- "cloisons" : indices des remplissages_blancs qui sont des cloisons (bandes étroites de 4 à 12 cm entre deux traits). Pas les embrasures de fenêtres, pas les dalles, pas les vantaux.
- "cloisons_ajout" : cloisons dessinées seulement par deux traits, sans remplissage : [{"a":[x,z],"b":[x,z],"t":0.07}] (ligne médiane, épaisseur).
- "gaines" : [{"poly":[[x,z],...],"label":"..."}] coffres techniques pleins du sol au plafond : rectangle barré d'une diagonale ou d'une croix, ou hachuré, ou grisé, souvent dans un angle de cuisine, de WC ou de salle de bain. N'en oublie aucun.
- "openings" : objet {id: ouverture}. Porte : {"kind":"door","p":[[x,z],[x,z]],"depth":e,"charniere":[x,z],"ouvre_vers":[x,z],"head":2.08,"label":"Chambre"} avec p les deux jambages sur une face du mur, depth l'épaisseur du mur, charniere un point près du jambage des paumelles (centre de l'arc), ouvre_vers un point du côté où le vantail s'ouvre. Porte palière : "kind":"entry", head 2.18. Fenêtre : {"kind":"window","p":[[x,z],[x,z]],"depth":e,"exterieur":[x,z],"sill":0.6,"head":2.2,"leaves":2,"bso":true,"gc":true,"label":"F · BSO"} avec p sur la face intérieure, exterieur un point dehors. Porte-fenêtre : "kind":"french", "sill":0, "vr" ou "bso", "seuil":0.02.
- "rooms" : [{"id","name","area","poly":[[x,z],...],"floor":"dry"|"wet"|"loggia"}] contour intérieur au nu des murs et cloisons. "area" = surface du tableau du promoteur (texte avec virgule). Une entrée comptée avec le séjour : pièce à part avec "areaNote":"comprise dans le séjour" et "inclut":["entree"] sur le séjour. Placard : pièce "hidden":true. Loggia ou balcon : "ext":true, "floor":"loggia".
- "fixtures" : [{"type":"shower","x":[x0,x1],"z":[z0,z1],"drain":[x,z]}, {"type":"bath","x":[..],"z":[..]} (baignoire : cuve aux angles arrondis dans un rectangle d'environ 0,70 × 1,60 à 1,80 m, robinetterie à un bout, parfois un pare-baignoire ; douche : receveur d'au moins 0,80 m de large, avec une bonde), {"type":"wc","p":[x,z],"dir":[dx,dz]} (le réservoir, petit rectangle, est toujours contre un mur : p = milieu du bord du réservoir collé au mur ; dir = du mur vers la cuvette ovale), {"type":"vanity","x":[..],"z":[..],"dir":[dx,dz]}, {"type":"towel","x":[..],"z":[..],"dir":[dx,dz]} (sèche-serviettes : rectangle étroit contre un mur de salle de bain, souvent avec deux pattes ; ne l'oublie pas), {"type":"tableau","x":[..],"z":[..]}, {"type":"placard","x":[..],"z":[..],"face":"n"|"s"|"e"|"w"} (face = côté des portes, celui qui donne sur la pièce)]. Tableau électrique (TE, GTL, « tableau ») : à relever s'il est dessiné, souvent dans l'entrée ou un placard.
- "kitchenHint" : [{"r":[x0,x1,z0,z1],"t":"évier · LV"}] cuisine indicative en pointillés, un rectangle par meuble ou groupe, libellé tel qu'écrit sur le plan. L'évier se reconnaît à ses bacs et à son égouttoir rainuré : ne l'oublie pas.
- "loggia" : {"slab":[[x,z],...],"rail":[[x,z],...]} si le logement a une loggia ou un balcon.
- "hsp" : hauteur sous plafond en mètres seulement si le plan l'écrit (« HSP 2,50 »), sinon null.
- "titre", "kicker", "cartouche":{"id","l1","l2","l3"}, "facts":[...], "etage":n, "fiche":{"surfaces":[[pièce,surface,cotes]],"sections":[{"h":"Points à faire confirmer","items":[["w","..."]]}]}.
  Fiche : "surfaces" reprend exactement les lignes du tableau du promoteur (même nom, surface telle qu'écrite, cotes écrites sur le plan pour cette pièce, sinon vide) ; un placard compté dans une pièce n'a jamais sa propre ligne. "Points à faire confirmer" : 2 à 5 questions utiles à poser au promoteur, écrites pour un acquéreur, en phrases simples : pas de jargon (SHAB, nu, trémie, gaine déduite…), pas de note de lecture ni de calcul, rien d'inventé, et ne dis jamais qu'un élément manque s'il est dessiné. Titre : les mots du plan (« Logement 432 » et non « Lot 432 » si le plan dit logement).

Tracés : « legende » décrit chaque clé. Les « symboles » (flèche d'entrée, nord) ne sont pas des murs. Pour une porte, le centre de son arc est la charnière. Les « hachures » signalent soffites, gaines ou isolant ; les « pointilles », la cuisine indicative et le mobilier.
Règles : fidélité d'abord, n'invente rien qui n'est pas dessiné. Reprends les coordonnées des tracés. Vérifie chaque cote écrite et chaque surface du tableau contre tes polygones (2 % près, gaines déduites). Hauteurs non cotées : plafond 2,50, portes 2,04 (linteau 2,08), porte palière 2,15, linteau des fenêtres 2,20, allège lue sur le plan (« All. 60 » = 0,60) sinon 1,00.
"""


def img_size(path, max_side=1800):
    """facteur appliqué par img_block et dimensions de l'image réellement envoyée"""
    from PIL import Image
    with Image.open(path) as im:
        w, h = im.size
    k = max_side / max(w, h) if max(w, h) > max_side else 1.0
    return k, round(w * k), round(h * k)


def build_messages(folder, extract=None, calib=None, hints=''):
    folder = Path(folder)
    content = [img_block(folder / 'plan-src.png')]
    # la calibration est exprimée dans les pixels de plan-src.png : on la ramène à l'image envoyée, réduite à 1800 px
    k, iw, ih = img_size(folder / 'plan-src.png')
    if (folder / 'page.png').exists():
        content.append(img_block(folder / 'page.png', 1400))
    if extract:
        e = {k_: v for k_, v in extract.items() if k_ not in ('image', 'underlay')}
        o = extract['image']['origine_px']
        txt = ("Première image : le plan, recadré. Seconde image : la page entière (cartouche, tableau des surfaces, légende).\n"
               f"Tracés vectoriels extraits du PDF, déjà convertis en mètres ({e['repere']}). Échelle détectée : {e['echelle']}.\n"
               f"La première image fait {iw} × {ih} px : 1 m = {extract['image']['px_par_m'] * k:.2f} px et l'origine est au pixel [{o[0] * k:.1f}, {o[1] * k:.1f}].\n"
               "```json\n" + json.dumps(e, ensure_ascii=False, separators=(',', ':')) + "\n```\n")
    else:
        o = calib['origine_px']
        txt = ("Première image : le plan (capture ou scan, sans tracés vectoriels). "
               f"Calibration saisie par l'utilisateur : l'image fait {iw} × {ih} px, 1 m = {calib['px_par_m'] * k:.2f} px, origine au pixel [{o[0] * k:.1f}, {o[1] * k:.1f}] (x vers la droite, z vers le bas). "
               "Mesure les positions sur l'image aussi précisément que possible et convertis-les en mètres avec cette calibration. Recoupe avec chaque cote écrite.\n")
    txt += hints
    txt += "\nRéponds par le JSON demandé, compact."
    content.append({'type': 'text', 'text': txt})
    return [{'role': 'user', 'content': content}]


# ---------- assemblage de la réponse de l'IA ----------
def fr_area(v):
    """surface affichée avec une virgule, au nombre de décimales du promoteur : « 11,85 », « 26,6 » (« 12.5 m2 » → « 12,5 »)"""
    if v is None or isinstance(v, bool):
        return None
    m = re.search(r'\d+(?:[.,]\d+)?', str(v))
    return m.group().replace('.', ',') if m else None


def num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def pt_ok(p):
    return isinstance(p, (list, tuple)) and len(p) == 2 and all(num(c) for c in p)


def poly_ok(p, n=3):
    return isinstance(p, list) and len([q for q in p if pt_ok(q)]) >= n


def normalise(A):
    """la réponse de l'IA ramenée au format attendu, quelles que soient ses variantes (null, texte, liste au lieu d'objet) ;
    renvoie la réponse nettoyée, les erreurs (à faire corriger) et les avertissements"""
    A = dict(A) if isinstance(A, dict) else {}
    errs, warns = [], []
    for k in ('murs_exclus', 'cloisons', 'cloisons_ajout', 'gaines', 'murs', 'rooms', 'fixtures', 'kitchenHint'):
        A[k] = A.get(k) if isinstance(A.get(k), list) else []
    for k in ('murs_exclus', 'cloisons'):
        A[k] = [int(i) for i in A[k] if num(i)]
    for k, t0 in (('murs', 0.2), ('cloisons_ajout', 0.07)):
        A[k] = [{**c, 't': c['t'] if num(c.get('t')) and c['t'] > 0 else t0} for c in A[k]
                if isinstance(c, dict) and pt_ok(c.get('a')) and pt_ok(c.get('b')) and math.dist(c['a'], c['b']) > 0.05]
    A['gaines'] = [g if isinstance(g, dict) else {'poly': g} for g in A['gaines']]
    A['gaines'] = [{**g, 'poly': [q for q in g['poly'] if pt_ok(q)]} for g in A['gaines'] if poly_ok(g.get('poly'))]
    # pièces : id et nom en texte, polygone d'au moins trois points, surface au format du tableau
    rooms, seen = [], set()
    for i, r in enumerate(A['rooms']):
        if not isinstance(r, dict):
            continue
        r = dict(r); r['id'] = str(r.get('id') or f'piece{i + 1}'); r['name'] = str(r.get('name') or r['id'])
        if r['id'] in seen:
            warns.append(f"Pièce {r['id']} : identifiant en double, renommée {r['id']}-{i + 1}."); r['id'] = f"{r['id']}-{i + 1}"
        seen.add(r['id'])
        if not poly_ok(r.get('poly')):
            errs.append(f"Pièce {r['id']} ({r['name']}) : « poly » absent ou de moins de 3 points [x, z], pièce écartée."); continue
        r['poly'] = [q for q in r['poly'] if pt_ok(q)]
        if 'area' in r:
            r['area'] = fr_area(r['area'])
        if isinstance(r.get('inclut'), str):
            r['inclut'] = [r['inclut']]
        if not pt_ok(r.get('label')):
            r.pop('label', None)
        rooms.append(r)
    A['rooms'] = rooms
    # ouvertures : objet indexé par id (une liste est convertie), deux jambages obligatoires, nombres ou valeurs par défaut
    ops = A.get('openings')
    if isinstance(ops, list):
        ops = {str(o.get('id') or f'o{i + 1}'): {k: v for k, v in o.items() if k != 'id'} for i, o in enumerate(ops) if isinstance(o, dict)}
    A['openings'] = {}
    for oid, o in (ops.items() if isinstance(ops, dict) else []):
        if not isinstance(o, dict):
            continue
        if not (isinstance(o.get('p'), list) and len(o['p']) == 2 and all(pt_ok(q) for q in o['p'])):
            errs.append(f"Ouverture {oid} : « p » absent ou invalide (deux points [x, z] attendus), ouverture écartée."); continue
        o = {k: v for k, v in o.items() if not (k in ('depth', 'head', 'sill', 'seuil', 'leaves') and not num(v))
             and not (k in ('charniere', 'ouvre_vers', 'exterieur') and not pt_ok(v))}
        A['openings'][str(oid)] = o
    # équipements : clés indispensables au moteur selon le type, sinon écartés
    REQ = {'shower': ('x', 'z'), 'bath': ('x', 'z'), 'wc': ('p', 'dir'), 'vanity': ('x', 'z', 'dir'), 'towel': ('x', 'z', 'dir'),
           'tableau': ('x', 'z'), 'placard': ('x', 'z'), 'dep': ('p',)}
    fx = []
    ALIAS = {'seche_serviettes': 'towel', 'seche-serviettes': 'towel', 'sèche-serviettes': 'towel', 'sèche_serviettes': 'towel', 'radiateur': 'towel',
             'vasque': 'vanity', 'lavabo': 'vanity', 'meuble_vasque': 'vanity', 'baignoire': 'bath', 'douche': 'shower', 'receveur': 'shower',
             'toilettes': 'wc', 'toilette': 'wc', 'tableau_electrique': 'tableau', 'te': 'tableau', 'gtl': 'tableau', 'descente': 'dep', 'ep': 'dep'}
    for i, f in enumerate(A['fixtures']):
        if not isinstance(f, dict) or not isinstance(f.get('type'), str):
            warns.append(f"Équipement {i} : type manquant, écarté."); continue
        f = dict(f)
        t = f['type'].strip().lower(); f['type'] = ALIAS.get(t, t)
        if f['type'] not in REQ:
            warns.append(f"Équipement {i} : type « {f['type']} » inconnu (types admis : {', '.join(REQ)}), écarté."); continue
        for k in ('x', 'z', 'track'):
            if pt_ok(f.get(k)):
                f[k] = sorted(f[k])
        bad = [k for k in REQ.get(f['type'], ()) if not pt_ok(f.get(k)) or (k == 'dir' and not any(f[k]))]
        if bad:
            warns.append(f"Équipement {i} ({f['type']}) : {', '.join(bad)} manquant ou invalide (format attendu dans la consigne), écarté."); continue
        if f['type'] == 'shower':
            if not pt_ok(f.get('drain')):
                f['drain'] = [round((f['x'][0] + f['x'][1]) / 2, 3), round((f['z'][0] + f['z'][1]) / 2, 3)]
            if 'valve' in f and not (isinstance(f['valve'], dict) and pt_ok(f['valve'].get('wall')) and pt_ok(f['valve'].get('dir'))):
                f.pop('valve')
        if f['type'] == 'dep' and not (num(f.get('r')) and f['r'] > 0):
            f['r'] = 0.05
        fx.append(f)
    A['fixtures'] = fx
    A['kitchenHint'] = [{**k, 't': str(k.get('t') or '')} for k in A['kitchenHint'] if isinstance(k, dict) and isinstance(k.get('r'), list) and len(k['r']) == 4 and all(num(v) for v in k['r'])]
    for k in A['kitchenHint']:
        if 'tp' in k and not pt_ok(k['tp']):
            k.pop('tp')
    # loggia, étage, textes et fiche
    lg = A.get('loggia')
    if isinstance(lg, dict) and poly_ok(lg.get('slab')):
        A['loggia'] = {**lg, 'slab': [q for q in lg['slab'] if pt_ok(q)], 'rail': [q for q in lg.get('rail') or [] if pt_ok(q)] if isinstance(lg.get('rail'), list) else []}
        if not num(A['loggia'].get('tile')):
            A['loggia'].pop('tile', None)
    else:
        A.pop('loggia', None)
    if 'etage' in A:
        e = str(A['etage'] if A['etage'] is not None else '')
        m = re.search(r'-?\d+', e)
        if m or re.search(r'rdc|rez', e, re.I):
            A['etage'] = int(m.group()) if m else 0
        else:
            A.pop('etage')
    for k in ('titre', 'kicker'):
        if k in A and not isinstance(A[k], str):
            A[k] = '' if A[k] is None else str(A[k])
    if 'facts' in A:
        A['facts'] = [str(x) for x in A['facts']] if isinstance(A['facts'], list) else [A['facts']] if isinstance(A['facts'], str) else []
    if 'cartouche' in A:
        A['cartouche'] = {k: str(v) for k, v in A['cartouche'].items() if v is not None} if isinstance(A['cartouche'], dict) else {}
    if 'fiche' in A:
        F = A['fiche'] if isinstance(A['fiche'], dict) else {}
        out, FLAGS = {}, ('ok', 'w', 'h')
        if isinstance(F.get('surfaces'), list):
            out['surfaces'] = [['' if c is None else str(c).replace('.', ',') if num(c) else str(c) for c in row] for row in F['surfaces'] if isinstance(row, list) and row]
        secs = []
        for s in (F['sections'] if isinstance(F.get('sections'), list) else []):
            if not isinstance(s, dict):
                continue
            items = s.get('items') if isinstance(s.get('items'), list) else [s['items']] if isinstance(s.get('items'), str) else []
            its = []
            for it in items:
                if isinstance(it, dict):
                    v = [x for x in it.values() if isinstance(x, str)]; it = [next((x for x in v if x in FLAGS), 'w'), next((x for x in v if x not in FLAGS), '')]
                if isinstance(it, str):
                    its.append(['w', it])
                elif isinstance(it, (list, tuple)) and it and str(it[-1]):
                    k, t = (it[0], it[1]) if len(it) >= 2 else ('w', it[0])
                    its.append([k if k in FLAGS else 'w', str(t)])
            secs.append({'h': str(s.get('h') or ''), 'items': its})
        out['sections'] = secs
        A['fiche'] = out
    return A, errs, warns


def cote_exterieur(mid, n, depth, rooms):
    """côté extérieur d'une baie dont l'IA n'a pas donné le point « exterieur » : celui où, passé l'épaisseur du mur,
    il n'y a plus de pièce intérieure (ou bien la loggia)"""
    def dehors(s):
        x, z = mid[0] + n[0] * s * (depth + 0.3), mid[1] + n[1] * s * (depth + 0.3)
        r = next((r for r in rooms if inside(x, z, r['poly'])), None)
        return r is None or bool(r.get('ext') or r.get('floor') == 'loggia')
    a, b = dehors(1), dehors(-1)
    if a != b:
        return 1 if a else -1
    dans = lambda s: any(inside(mid[0] + n[0] * s * 0.3, mid[1] + n[1] * s * 0.3, r['poly']) and not r.get('ext') for r in rooms)
    return 1 if dans(-1) else -1 if dans(1) else 1


def assemble(A, extract):
    """la réponse de l'IA (classement + pièces + ouvertures) devient un plan.json complet"""
    A, ferrs, fwarns = normalise(A)
    P = {k: v for k, v in A.items() if k not in ('murs_exclus', 'cloisons', 'cloisons_ajout', 'gaines', 'openings', 'murs')}
    P['_format'] = {'erreurs': ferrs, 'avertissements': fwarns}  # repris par check(), retiré avant l'écriture de plan.json
    P.pop('hsp', None)
    if num(A.get('hsp')) and 2.1 <= A['hsp'] <= 3.6:  # hauteur écrite sur le plan : affichée ; sinon 2,50 supposé, jamais affiché
        P['H'] = round(float(A['hsp']), 2); P['hspLue'] = True
    walls = []
    excl = set(A['murs_exclus'])
    for i, poly in enumerate(extract.get('murs_noirs', []) if extract else []):
        if len(poly) < 3:
            continue
        # un aplat tracé en quadrilatère croisé (« nœud papillon ») remplit ses deux lobes : on les garde tous les deux
        for j, g in enumerate(q for q in murs.polys(murs.valide(Polygon(poly), 0)) if q.area > 0.0004):
            walls.append({'id': f'm{i}' + (f'-{j}' if j else ''), 'k': 'beton', 'poly': murs.ring(g), **({'_exclu': True} if i in excl else {})})
    blancs = extract.get('remplissages_blancs', []) if extract else []
    for i in A['cloisons']:
        if 0 <= i < len(blancs):
            walls.append({'id': f'c{i}', 'k': 'cloison', 'poly': blancs[i]})
    for j, c in enumerate(A['murs']):
        dx, dz = c['b'][0] - c['a'][0], c['b'][1] - c['a'][1]; L = math.hypot(dx, dz) or 1; t = c['t']
        n = (-dz / L * t / 2, dx / L * t / 2)
        walls.append({'id': f'mi{j}', 'k': 'beton', 'a': [c['a'][0] - n[0], c['a'][1] - n[1]], 'b': [c['b'][0] - n[0], c['b'][1] - n[1]], 't': t, 'side': 1})
    for j, c in enumerate(A['cloisons_ajout']):
        dx, dz = c['b'][0] - c['a'][0], c['b'][1] - c['a'][1]; L = math.hypot(dx, dz) or 1; t = c['t']
        n = (-dz / L * t / 2, dx / L * t / 2)
        walls.append({'id': f'ca{j}', 'k': 'cloison', 'a': [c['a'][0] - n[0], c['a'][1] - n[1]], 'b': [c['b'][0] - n[0], c['b'][1] - n[1]], 't': t, 'side': 1})
    # murs soudés, limités au logement, fentes refermées (les flèches, légendes et traits isolés disparaissent)
    journal_murs = P['_format'].setdefault('murs', [])
    walls = murs.soude(walls, A['rooms'], A['gaines'], journal_murs)
    P['walls'] = walls
    # une gaine du palier ou d'un voisin n'est pas dans le logement : elle flotterait seule à côté de la maquette
    Wu = unary_union([Polygon(murs.quad(w)).buffer(0) for w in walls] + [Polygon(r['poly']).buffer(0) for r in A['rooms'] if len(r.get('poly', [])) >= 3])
    P['gaines'] = []
    emp = murs.emprises([f for f in A['fixtures'] if f.get('type') != 'placard'])
    for i, g in enumerate(A['gaines']):
        gp = Polygon(g['poly']).buffer(0)
        if gp.distance(Wu) > 0.05:
            journal_murs.append(f"gaine « {g.get('label', '')} » hors du logement, écartée"); continue
        # une gaine ne traverse pas un WC, une vasque ou une baignoire : lecture fautive
        if any(gp.intersection(e).area > max(0.015, 0.25 * min(gp.area, e.area)) for e in emp):
            journal_murs.append(f"gaine « {g.get('label', '')} » posée sur un équipement, écartée"); continue
        P['gaines'].append({'id': f'g{i}', **g})
    ops = {}
    for oid, o in A['openings'].items():
        p0, p1 = o['p']; dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz)
        if L < 0.3:
            continue
        n = (-dz / L, dx / L); mid = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
        q = {k: v for k, v in o.items() if k not in ('charniere', 'ouvre_vers', 'exterieur')}
        q['depth'] = o.get('depth', 0.2)
        if o.get('kind') in ('window', 'french'):
            if o.get('exterieur'):
                ext = o['exterieur']; side = 1 if (ext[0] - mid[0]) * n[0] + (ext[1] - mid[1]) * n[1] > 0 else -1
            else:
                side = cote_exterieur(mid, n, q['depth'], A['rooms'])
            q.update(side=side, ext=True, leaves=o.get('leaves', 2), sill=o.get('sill', 0 if o['kind'] == 'french' else 1.0), head=o.get('head', 2.2))
            q.setdefault('frame', [-0.02, 0.05])
            # garde-corps dans le tableau : jamais sur une porte-fenêtre qui s'ouvre sur un balcon ou une loggia (on y passe)
            dehors = (mid[0] + n[0] * side * (q['depth'] + 0.35), mid[1] + n[1] * side * (q['depth'] + 0.35))
            sur_balcon = any(inside(*dehors, r['poly']) for r in A['rooms'] if r.get('ext') or r.get('floor') == 'loggia')
            if o.get('gc') and not (o.get('kind') == 'french' and sur_balcon):
                q['gc'] = [max(0.08, q['depth'] - 0.13), max(0.13, q['depth'] - 0.08)]
            else:
                q.pop('gc', None)
        else:
            side = 1
            ov = o.get('ouvre_vers') or [mid[0] + n[0], mid[1] + n[1]]
            q['swing'] = 1 if (ov[0] - mid[0]) * n[0] + (ov[1] - mid[1]) * n[1] > 0 else -1
            ch = o.get('charniere') or p0
            q['hinge'] = 's0' if math.dist(ch, p0) <= math.dist(ch, p1) else 's1'
            q.update(side=side, sill=0, head=o.get('head', 2.18 if o.get('kind') == 'entry' else 2.08))
        ops[oid] = q
    P['openings'] = ops
    # chaque baie traverse le mur entre ses jambages ; les murs sont ouverts au droit des baies, en morceaux convexes
    murs.cale(ops, P['walls'], journal_murs)
    if extract:  # PDF vectoriel : charnière, sens et largeur de chaque porte lus sur son arc
        murs.portes_arcs(ops, extract.get('arcs'), journal_murs)
    P['walls'] = murs.decoupe(P['walls'], ops)
    # placard : ses portes coulissantes sont du côté qui donne sur une pièce (une porte lue à cet endroit devient la façade)
    for f in P.get('fixtures', []):
        if f.get('type') == 'placard':
            f['face'] = murs.face_placard(f, A['rooms'], P['walls'], ops, journal_murs); f.pop('track', None)
    # enveloppe fermée : un bord de pièce sans mur, sans baie et sans pièce voisine reçoit un mur
    murs.ferme(P, journal_murs)
    # équipements : dos collé au mur quand la lecture le laisse à quelques centimètres ; robinetterie de douche contre un mur
    murs.equipements(P, journal_murs)
    return P


def room_id(it):
    """pièce d'une vue ou d'un arrêt : champ « room », sinon l'id sans le suffixe « -inverse » (plans antérieurs)"""
    if it.get('room'):
        return it['room']
    return it['id'][:-len('-inverse')] if it['id'].endswith('-inverse') else it['id']


def op_frame(o, W):
    """repère d'une ouverture, décrite par un mur ou par deux points"""
    if o.get('wall') and o['wall'] in W:
        return wall_frame(W[o['wall']]), o['s'], W[o['wall']]['t']
    w = {'a': o['p'][0], 'b': o['p'][1], 'side': o.get('side', 1), 't': o.get('depth', 0.2)}
    f = wall_frame(w)
    return f, [0, f[0]], w['t']


# ---------- relecture par l'IA : notre reconstruction dessinée sur le plan d'origine ----------

RELECTURE = """Tu relis la lecture automatique d'un plan de vente d'appartement, avant sa publication. Une erreur publiée est inacceptable.
Première image : le plan du promoteur (en noir) avec, par-dessus, ce qui a été lu, en couleur : murs en bleu, gaines en gris, pièces en vert avec [id], ouvertures en orange avec leur id (portes : vantail ouvert et arc, pivot sur la charnière), équipements en magenta « indice:type » dans leur vraie forme (WC : réservoir rectangulaire contre le mur et cuvette ovale ; vasque, sèche-serviettes et placard : trait épais sur la face avant). Seconde image : le plan d'origine seul. Puis un zoom par pièce : à gauche le plan d'origine, à droite la lecture, au même cadrage ; c'est là que se lisent les symboles.

Méthode, pièce par pièce :
1. Sur le plan d'origine, repère chaque pièce et chaque équipement dessiné (douche, baignoire, vasque, WC, sèche-serviettes, placard, tableau électrique) et chaque ouverture (porte, porte palière, fenêtre, porte-fenêtre).
2. Pour chacun, vérifie sur le zoom qu'il existe dans la lecture, avec le bon type (une baignoire a une cuve arrondie et sa robinetterie à un bout ; un receveur de douche est plat, large d'au moins 0,80 m), dans la bonne pièce, à la bonne place (à 10 cm près), avec la bonne orientation : réservoir du WC contre le même mur que sur le plan, charnière et sens d'ouverture de chaque porte (le centre de l'arc dessiné est la charnière), face avant de la vasque et du placard, gaines (rectangles barrés) toutes présentes.
3. Vérifie aussi l'inverse : rien de lu qui ne soit pas dessiné.

Réponds uniquement par un JSON compact dans un bloc ```json :
{"ok": true|false, "ecarts": ["phrase courte par écart"], "corrections": {clés à remplacer ENTIÈREMENT, au même format que la lecture : "fixtures", "rooms", "openings", "gaines", "cloisons_ajout"}}
Si une clé est corrigée, renvoie sa liste complète (éléments justes compris), avec les types d'équipements de la lecture (shower, bath, wc, vanity, towel, tableau, placard, dep). Si tout est juste : {"ok": true, "ecarts": [], "corrections": {}}. Coordonnées en mètres, même repère que la lecture."""


def relecture(folder, P, A, extract, calib, log, progress=None):
    """une passe de relecture visuelle ; renvoie la lecture corrigée (ou None si rien à corriger) et la liste des écarts"""
    img = apercu.dessine(folder, P, extract, calib)
    zs = apercu.zooms(folder, P, extract, calib)
    lect = {k: A[k] for k in ('rooms', 'openings', 'fixtures', 'gaines', 'cloisons_ajout') if k in A}
    content = [img_block(img, 2000), img_block(Path(folder) / 'plan-src.png', 2000)]
    for rid, zp in zs:
        content.append(img_block(zp, 1600))
    content.append({'type': 'text', 'text': 'Première image : lecture en couleur sur le plan. Seconde image : plan d’origine seul. Puis un zoom par pièce ('
                    + ', '.join(r for r, _ in zs) + ') : plan d’origine à gauche, lecture à droite, même cadrage.\nLecture actuelle :\n```json\n'
                    + json.dumps(lect, ensure_ascii=False, separators=(',', ':')) + '\n```'})
    msg = call(RELECTURE, [{'role': 'user', 'content': content}], log, effort=os.environ.get('PLAN_EFFORT_RELECTURE', 'medium'), max_tokens=60000, progress=progress)
    (Path(folder) / 'reponse-brute-relecture.txt').write_text(msg['text'])
    R = parse_json(msg, ('ok', 'corrections', 'ecarts'))
    ecarts = R.get('ecarts') if isinstance(R.get('ecarts'), list) else []
    if R.get('ok') or not isinstance(R.get('corrections'), dict) or not R['corrections']:
        return None, ecarts
    A2 = dict(A); A2.update(R['corrections'])
    return A2, ecarts


ARBITRE = """Tu compares deux propositions pour un même élément d'un plan de vente d'appartement. L'image montre trois vignettes au même cadrage : à gauche le plan d'origine, seule référence ; au milieu la proposition A ; à droite la proposition B, dessinées en magenta par-dessus le plan.
Dessin : WC = petit rectangle (réservoir, contre le mur) et ovale (cuvette) ; porte = vantail ouvert en trait plein et arc, pivot sur la charnière ; vasque, sèche-serviettes, placard = rectangle avec un trait épais sur la face avant ; « absent » = la proposition n'a pas cet élément.
Regarde le symbole sur le plan d'origine et dis laquelle le reproduit fidèlement : présence, position, orientation, charnière, sens d'ouverture.
Pour une porte, seuls comptent le jambage qui porte la charnière (le gros point, pivot du vantail et centre de l'arc) et le côté du mur où le vantail s'ouvre ; l'angle d'ouverture dessiné (45° ou 90°) et la longueur exacte du trait ne comptent pas.
Réponds uniquement par un JSON : {"choix":"A"|"B","raison":"courte"}"""


def _centre_fx(f):
    if f.get('x') and f.get('z'):
        return ((f['x'][0] + f['x'][1]) / 2, (f['z'][0] + f['z'][1]) / 2)
    return tuple(f['p']) if f.get('p') else None


def _fx_change(a, b):
    ca, cb = _centre_fx(a), _centre_fx(b)
    if not ca or not cb or math.dist(ca, cb) > 0.08:
        return True
    da, db = a.get('dir'), b.get('dir')
    if da and db and (da[0] * db[0] + da[1] * db[1]) / ((math.hypot(*da) * math.hypot(*db)) or 1) < 0.9:
        return True
    if a.get('face') != b.get('face') and a.get('face') and b.get('face'):
        return True
    return any(a.get(k) and b.get(k) and max(abs(u - v) for u, v in zip(a[k], b[k])) > 0.08 for k in ('x', 'z'))


def _op_change(a, b):
    if a.get('kind') != b.get('kind') or any(math.dist(p, q) > 0.08 for p, q in zip(a['p'], b['p'])):
        return True
    return a.get('kind') in ('door', 'entry') and (a.get('hinge') != b.get('hinge') or a.get('swing') != b.get('swing'))


def arbitre(folder, A, A2, P, P2, extract, calib, log, notes, maxi=8):
    """chaque équipement ou ouverture que la relecture modifie est tranché par une question ciblée (plan d'origine | A | B) ;
    renvoie la lecture corrigée où seules les modifications confirmées sont gardées"""
    An, _, _ = normalise(copy.deepcopy(A)); A2n, _, _ = normalise(copy.deepcopy(A2))
    duels = []
    # équipements : appariés par type, au plus proche
    libres = list(range(len(A2n['fixtures'])))
    for i, f in enumerate(An['fixtures']):
        cand = [j for j in libres if A2n['fixtures'][j]['type'] == f['type'] and _centre_fx(A2n['fixtures'][j]) and _centre_fx(f)]
        j = min(cand, key=lambda j: math.dist(_centre_fx(A2n['fixtures'][j]), _centre_fx(f)), default=None)
        if j is not None and math.dist(_centre_fx(A2n['fixtures'][j]), _centre_fx(f)) < 1.5:
            libres.remove(j)
            if _fx_change(f, A2n['fixtures'][j]):
                duels.append(('fx', f['type'], f, A2n['fixtures'][j], i, j))
        else:
            duels.append(('fx', f['type'], f, None, i, None))
    duels += [('fx', A2n['fixtures'][j]['type'], None, A2n['fixtures'][j], None, j) for j in libres]
    # ouvertures : par identifiant, dessinées telles qu'assemblées
    W = {w['id']: w for w in P['walls']}; W.update({w['id']: w for w in P2['walls']})
    for oid in sorted(set(P['openings']) | set(P2['openings'])):
        a, b = P['openings'].get(oid), P2['openings'].get(oid)
        if a is None or b is None or _op_change(a, b):
            duels.append(('op', oid, a, b, oid, oid))
    if not duels:
        return A2
    if len(duels) > maxi:
        notes.append(f'{len(duels)} modifications : relecture gardée telle quelle'); return A2
    garde_avant = []
    for n, (kind, nom, a, b, ia, ib) in enumerate(duels):
        # la question est posée dans les deux ordres : on ne revient à la lecture initiale que si les deux réponses concordent
        votes, raisons = [], []
        for inv in (False, True):
            gauche, droite = (b, a) if inv else (a, b)
            try:
                img = apercu.duel(folder, extract, calib, nom, gauche, droite, W, sortie=f'duel-{n}-{int(inv)}.png')
                msg = call(ARBITRE, [{'role': 'user', 'content': [img_block(img, 1600), {'type': 'text', 'text': f'Élément : {nom}.'}]}], log, effort='low', max_tokens=4000)
                R = parse_json(msg, 'choix'); c = str(R.get('choix', '')).strip().upper()[:1]
            except Exception as err:  # une question qui échoue : la relecture l'emporte, comme avant
                notes.append(f'{nom} : arbitrage impossible ({type(err).__name__})'); votes = []; break
            votes.append((c == 'B') if inv else (c == 'A')); raisons.append(str(R.get('raison', '')))
        if not votes:
            continue
        avant_juste = all(votes)
        notes.append(f"{nom} : {'lecture initiale confirmée' if avant_juste else 'correction gardée'}" + ('' if len(set(votes)) == 1 else ' (réponses divergentes)') + f" — {raisons[0]}")
        if avant_juste:
            garde_avant.append((kind, a, b, ia, ib))
    if not garde_avant:
        return A2
    A3 = copy.deepcopy(A2); A3['fixtures'] = list(A2n['fixtures']); A3['openings'] = dict(A2n['openings'])
    for kind, a, b, ia, ib in garde_avant:
        if kind == 'fx':
            if ib is not None:
                A3['fixtures'][ib] = a  # a peut être None : l'ajout est refusé
            elif a is not None:
                A3['fixtures'].append(a)
        else:
            if ia in An['openings']:
                A3['openings'][ia] = An['openings'][ia]
            else:
                A3['openings'].pop(ib, None)
    A3['fixtures'] = [f for f in A3['fixtures'] if f is not None]
    return A3


# ---------- contrôle et complément sans IA ----------
def check(P):
    fmt = P.get('_format') or {}
    errs, warns = list(fmt.get('erreurs', [])), list(fmt.get('avertissements', []))
    W = {w.get('id'): w for w in P.get('walls', [])}
    if not P.get('rooms') or not P.get('walls'):
        errs.append('Aucune pièce ou aucun mur.')
        return errs, warns
    for w in P['walls']:
        if 'poly' in w:
            continue
        if not all(k in w for k in ('a', 'b', 't')):
            errs.append(f"Mur {w.get('id')} : a, b ou t manquant."); continue
        if not 0.02 <= w['t'] <= 0.7:
            errs.append(f"Mur {w['id']} : épaisseur {w['t']} m improbable.")
    for oid, o in P.get('openings', {}).items():
        if o.get('p'):
            if math.dist(*o['p']) < 0.4:
                errs.append(f"Ouverture {oid} : largeur {math.dist(*o['p']):.2f} m trop faible.")
        else:
            w = W.get(o.get('wall'))
            if not w or 'poly' in w:
                errs.append(f"Ouverture {oid} : mur « {o.get('wall')} » introuvable."); continue
            L = wall_frame(w)[0]
            s0, s1 = o.get('s', [0, 0])
            if not (-0.01 <= s0 < s1 <= L + 0.01):
                errs.append(f"Ouverture {oid} : s={o.get('s')} hors du mur {w['id']} (longueur {L:.2f}).")
        if o.get('kind') not in ('entry', 'door', 'window', 'french'):
            errs.append(f"Ouverture {oid} : kind « {o.get('kind')} » inconnu.")
    bad = [r for r in P['rooms'] if not poly_ok(r.get('poly')) or abs(area(r['poly'])) < 0.2]
    for r in bad:
        errs.append(f"Pièce {r.get('id')} : polygone invalide.")
    vis = [r for r in P['rooms'] if not r.get('hidden') and r not in bad]
    for r in vis:
        if r.get('area'):
            try:
                a = float(str(r['area']).replace(',', '.'))
            except ValueError:
                continue
            if a <= 0:
                continue
            gaines = sum(abs(area(g['poly'])) for g in P.get('gaines', []) if inside(*centroid(g['poly']), r['poly']))
            got = abs(area(r['poly'])) - gaines
            extra = sum(abs(area(q['poly'])) for q in P['rooms'] if q.get('id') in r.get('inclut', []))
            if abs(got + extra - a) / a > 0.03:
                warns.append(f"Pièce {r.get('name') or r['id']} : {got + extra:.2f} m² mesurés (gaines déduites{', annexes comprises' if extra else ''}) pour {a:.2f} m² annoncés.")
    # règles métier : chaque équipement dans une pièce qui peut le recevoir
    def room_of(f):
        c = ((f['x'][0] + f['x'][1]) / 2, (f['z'][0] + f['z'][1]) / 2) if pt_ok(f.get('x')) and pt_ok(f.get('z')) else tuple(f['p']) if pt_ok(f.get('p')) else None
        if c and f.get('type') == 'wc' and pt_ok(f.get('dir')):  # le point d'appui est au mur : on juge au centre de la cuvette
            n_ = math.hypot(*f['dir']) or 1; c = (c[0] + f['dir'][0] / n_ * 0.35, c[1] + f['dir'][1] / n_ * 0.35)
        return next((r for r in vis if c and inside(c[0], c[1], r['poly'])), None) if c else None
    wet = lambda r: r and any(k in (r.get('id', '') + ' ' + r.get('name', '')).lower() for k in ('bain', 'eau', 'sdb', 'sde', 'douche'))
    wcish = lambda r: r and any(k in (r.get('id', '') + ' ' + r.get('name', '')).lower() for k in ('wc', 'toilet'))
    NOMS = {'towel': 'Le sèche-serviettes', 'bath': 'La baignoire', 'shower': 'La douche', 'wc': 'La cuvette de WC', 'vanity': 'La vasque'}
    for i, f in enumerate(P.get('fixtures', [])):
        r = room_of(f); t = f.get('type')
        if t not in NOMS:
            continue
        ok = wet(r) if t in ('towel', 'bath', 'shower') else (wet(r) or wcish(r))
        if r is None:
            warns.append(f"Équipement {i} ({t}) : {NOMS[t]} est hors de toute pièce. Retrouve-le sur le plan et corrige sa position.")
        elif not ok:
            warns.append(f"Équipement {i} ({t}) : {NOMS[t]} est placé dans « {r.get('name') or r['id']} », pièce qui ne peut pas le recevoir. "
                         + ("Dans un WC, le rectangle contre le mur derrière la cuvette est son réservoir, pas un sèche-serviettes. " if t == 'towel' and wcish(r) else '')
                         + "Retrouve le vrai sur le plan (un sèche-serviettes est un rectangle étroit contre un mur de la salle de bain) et corrige.")
    for i, f in enumerate(P.get('fixtures', [])):
        if f.get('type') == 'shower' and pt_ok(f.get('x')) and pt_ok(f.get('z')):
            a_, b_ = sorted((abs(f['x'][1] - f['x'][0]), abs(f['z'][1] - f['z'][0])))
            if a_ < 0.78 and b_ >= 1.2:
                warns.append(f"Équipement {i} (shower) : {a_:.2f} × {b_:.2f} m, format d'une baignoire et non d'un receveur de douche. Regarde le symbole (cuve arrondie, robinetterie à un bout) et corrige le type si c'est une baignoire.")
    # chevauchements de pièces : aire commune (symétrique, juste pour les pièces en L), au-delà des arrondis au centimètre
    gs = [Polygon(r['poly']).buffer(0) for r in vis]
    for i, a in enumerate(vis):
        for j in range(i + 1, len(vis)):
            x = gs[i].intersection(gs[j]).area
            if x > 0.1:
                errs.append(f"Les pièces {a['id']} et {vis[j]['id']} se chevauchent ({x:.2f} m² en commun).")
    return errs, warns


def free_point(room, walls, x, z, clear=0.45, fixtures=()):
    """rapproche un point du centre de la pièce jusqu'à ce qu'il soit libre (murs et équipements)"""
    c = centre(room['poly']); quads = [wall_quad(w) for w in walls] + [list(g.exterior.coords)[:-1] for g in murs.emprises(fixtures)]
    for k in range(21):
        px, pz = x + (c[0] - x) * k / 20, z + (c[1] - z) * k / 20
        if not inside(px, pz, room['poly']):
            continue
        ok = all(not inside(px, pz, q) and min(seg_dist(px, pz, q[i], q[(i + 1) % len(q)]) for i in range(len(q))) >= clear for q in quads)
        if ok:
            return [round(px, 3), round(pz, 3)]
    return [round(c[0], 3), round(c[1], 3)]


def best_views(room, walls, gaines, tgt, n=1, galerie=False, fixtures=()):
    """cadrages : position à 45 cm au moins des murs, direction qui voit le plus loin, fenêtre dans le champ si possible.
    galerie : les vues suivantes changent vraiment de direction (sinon, simples variantes pour remplacer une vue refusée)"""
    rp = Polygon(room['poly']).buffer(0)
    solid = unary_union([Polygon(wall_quad(w)).buffer(0) for w in walls] + [Polygon(g['poly']).buffer(0) for g in gaines])
    # pas de prise de vue dans la baignoire ni collée au placard : les équipements sont des obstacles, pas des murs pour la vue
    genes = unary_union(murs.emprises(fixtures)) if fixtures else Polygon()
    free = rp.buffer(-0.45).difference(solid.buffer(0.45)).difference(genes.buffer(0.3))
    if free.is_empty:
        free = rp.buffer(-0.25).difference(solid.buffer(0.25)).difference(genes.buffer(0.2))
    if free.is_empty:
        c = centre(room['poly']); return [(c[0], c[1], 0.0)]
    x0, z0, x1, z1 = rp.bounds; cands = []
    step = max(0.25, min(x1 - x0, z1 - z0) / 8)
    xs = [x0 + step / 2 + i * step for i in range(int((x1 - x0) / step) + 1)]
    zs = [z0 + step / 2 + i * step for i in range(int((z1 - z0) / step) + 1)]
    walls_all = solid.union(rp.exterior.buffer(0.01))
    clear = lambda x, z: Point(x, z).distance(walls_all)
    dmin = 2.0 if rp.area >= 7 else 1.4  # WC, salle d'eau : la pièce entière tient dans 2 m
    def sight(x, z, yaw):
        dx, dz = -math.sin(yaw), -math.cos(yaw)
        seg = LineString([(x, z), (x + dx * 30, z + dz * 30)]); hit = seg.intersection(walls_all)
        return 30 if hit.is_empty else Point(x, z).distance(hit)
    for x in xs:
        for z in zs:
            if not free.contains(Point(x, z)):
                continue
            yaws = [i * math.pi / 8 for i in range(16)]
            if tgt:
                yaws.append(math.atan2(-(tgt[0] - x), -(tgt[1] - z)))
            for yaw in yaws:
                d = sight(x, z, yaw)
                if d < dmin:
                    continue
                # profondeur (côtés compris), fenêtre dans le champ, recul contre un mur
                side = min(sight(x, z, yaw + 0.5), sight(x, z, yaw - 0.5))
                win = 0
                if tgt:
                    a = math.atan2(-(tgt[0] - x), -(tgt[1] - z)); da = abs((yaw - a + math.pi) % (2 * math.pi) - math.pi)
                    win = 1.5 if da < 0.45 else 0.6 if da < 0.8 else 0
                back = sight(x, z, yaw + math.pi)
                # dégagement autour de l'appareil : pas de vue prise au fond d'un couloir
                cands.append((min(d, 8) + 0.5 * min(side, 5) + win * 2 - 0.3 * min(back, 3) + 0.8 * min(clear(x, z), 1.2), x, z, yaw))
    if not cands:
        # petite pièce (WC, salle d'eau, dégagement) : du point libre le plus central, la direction qui voit le plus loin
        # sans sortir de la pièce (la vue reste dans la pièce, jamais à travers la porte)
        c = centre(room['poly']); pts = [Point(c)]
        if not free.is_empty:
            pts = [free.representative_point()] + [Point(q) for g in getattr(free, 'geoms', [free]) for q in list(getattr(g, 'exterior', g).coords)[:8]]
        best = None
        for q in pts:
            for i in range(16):
                yaw = i * math.pi / 8; d = sight(q.x, q.y, yaw)
                sc = min(d, 6) + 0.5 * min(sight(q.x, q.y, yaw + 0.5), sight(q.x, q.y, yaw - 0.5), 4) - 0.2 * Point(q).distance(Point(c))
                if best is None or sc > best[0]:
                    best = (sc, q.x, q.y, yaw)
        return [(round(best[1], 3), round(best[2], 3), round(best[3], 3))]
    cands.sort(reverse=True)
    out = [cands[0]]
    for c_ in cands[1:]:
        if len(out) >= n:
            break
        # vues suivantes : un autre point de vue, pas la même image à 10 cm près ; en galerie, une autre direction
        dy = lambda o_: abs((c_[3] - o_[3] + math.pi) % (2 * math.pi) - math.pi)
        if galerie and clear(c_[1], c_[2]) < 0.8:  # autre angle : pas depuis un couloir (moins de 1,6 m de large)
            continue
        if all(dy(o_) > 1.6 if galerie else dy(o_) > 1.2 or math.dist(c_[1:3], o_[1:3]) > 1.0 for o_ in out):
            out.append(c_)
    return [(round(x, 3), round(z, 3), round(yaw, 3)) for _, x, z, yaw in out]


def vue_seuil(room, P, W, at, detendu=False):
    """vue d'une petite pièce prise juste derrière le seuil de sa porte, dans la direction qui voit le plus loin
    (axe et côtés), sans sortir de la pièce"""
    rp = Polygon(room['poly']).buffer(0)
    solid = unary_union([Polygon(wall_quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    genes = unary_union(murs.emprises(P.get('fixtures', [])))
    obst = solid.union(rp.exterior.buffer(0.01))
    x0, z0, x1, z1 = rp.bounds; diag = math.hypot(x1 - x0, z1 - z0)
    def sight(x, z, yaw):
        hit = LineString([(x, z), (x - math.sin(yaw) * 20, z - math.cos(yaw) * 20)]).intersection(obst)
        return 20 if hit.is_empty else Point(x, z).distance(hit)
    best = None
    for o in P['openings'].values():
        if o.get('kind') not in ('door', 'entry'):
            continue
        t = op_frame(o, W)[2]
        for d_in, d_chk in ((-0.4, -0.25), (t + 0.4, t + 0.25)):
            x, z = at(o, d_in)
            if not rp.contains(Point(at(o, d_chk))) or not rp.contains(Point(x, z)):
                continue
            q = Point(x, z)
            if q.distance(solid) < 0.18 or q.distance(genes) < 0.12:
                continue
            for i in range(32):
                yaw = i * math.pi / 16; c = sight(x, z, yaw)
                if c < min(1.8, 0.6 * diag) and not detendu:  # mêmes exigences que la visite de contrôle
                    continue
                cote = max(sight(x, z, yaw + 0.4), sight(x, z, yaw - 0.4))
                if cote < min(1.5, 0.5 * diag) and not detendu:
                    continue
                sc = min(c, 5) + 0.5 * min(cote, 4)
                if best is None or sc > best[0]:
                    best = (sc, x, z, yaw)
    return (round(best[1], 3), round(best[2], 3), round(best[3], 3)) if best else None


def repare_moteur(folder, probs):
    """corrige plan.json d'après la visite de contrôle ; renvoie la liste de ce qui a été corrigé"""
    folder = Path(folder); P = json.loads((folder / 'plan.json').read_text()); fixed = []
    vis = [r for r in P['rooms'] if not r.get('hidden')]
    widen = {}
    for p in probs:
        if p['type'] == 'passage' and p['id'] in P['openings'] and P['openings'][p['id']].get('gc') and P['openings'][p['id']].get('kind') == 'french':
            P['openings'][p['id']].pop('gc'); fixed.append(p['texte'] + ' (garde-corps retiré)'); continue
        if p['type'] == 'passage':  # porte qui ne se franchit pas au clavier : seuil élargi de part et d'autre
            sr = next((r for r in P['rooms'] if r['id'] == f"seuil-{p['id']}"), None)
            if sr:
                g = Polygon(sr['poly']).buffer(0.08, join_style='mitre')
                sr['poly'] = [[round(x, 3), round(z, 3)] for x, z in list(g.exterior.coords)[:-1]]; fixed.append(p['texte'])
        if p['type'] == 'ouverture' and p['id'] in P['openings'] and P['openings'][p['id']].get('p'):
            o = dict(P['openings'][p['id']]); (p0, p1) = o['p']; sd = o.get('side', 1)
            dx, dz = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dz); T = (-dz / L * sd, dx / L * sd)
            o['p'] = [[p0[0] - T[0] * 0.3, p0[1] - T[1] * 0.3], [p1[0] - T[0] * 0.3, p1[1] - T[1] * 0.3]]; o['depth'] = o.get('depth', 0.2) + 0.6
            widen[p['id']] = o; fixed.append(p['texte'])
    if widen:
        P['walls'] = murs.decoupe(P['walls'], widen); calc_masses(P)
    # fente par laquelle on voit dehors : un mur la referme, contre le bord de la pièce, jamais sur une baie
    ajout = []
    for k, p in enumerate(q for q in probs if q['type'] == 'fuite'):
        (ax, az), (bx, bz), (nx, nz) = p['a'], p['b'], p['n']
        L = math.hypot(bx - ax, bz - az) or 0.0; ux, uz = ((bx - ax) / L, (bz - az) / L) if L > 1e-6 else (-nz, nx)
        a2 = (ax - ux * 0.05 + nx * 0.08, az - uz * 0.05 + nz * 0.08); b2 = (bx + ux * 0.05 + nx * 0.08, bz + uz * 0.05 + nz * 0.08)  # bord de la pièce
        g = Polygon([a2, b2, (b2[0] + nx * 0.14, b2[1] + nz * 0.14), (a2[0] + nx * 0.14, a2[1] + nz * 0.14)]).buffer(0)
        for r in P['rooms']:
            if len(r.get('poly', [])) >= 3 and not r.get('of'):
                g = g.difference(Polygon(r['poly']).buffer(0))
        for part in murs.convexes(g, amin=1e-6):
            ajout.append({'id': f'fu{k}', 'k': 'beton', 'poly': murs.ring(part), 'suppose': True})
        fixed.append(p['texte'] + ' (refermée)')
    if ajout:
        P['walls'] += murs.decoupe(ajout, P['openings']); calc_masses(P)
    for p in probs:
        if p['type'] in ('photo', 'arret'):
            lst = P['photos'] if p['type'] == 'photo' else P['stops']
            it = next((q for q in lst if q['id'] == p['id']), None)
            r = next((q for q in vis if it and q['id'] == room_id(it)), None)
            if not it or not r:
                continue
            views = best_views(r, P['walls'], P.get('gaines', []), None, 8, fixtures=P.get('fixtures', []))
            k = it.get('essai', 0) + 1 + (1 if p['type'] == 'photo' and it['id'] != room_id(it) else 0)
            if k >= len(views):
                if p['type'] == 'photo':
                    P['photos'] = [q for q in P['photos'] if q['id'] != it['id']]  # plus de bon cadrage : la vue est retirée
                else:
                    P['stops'] = [q for q in P['stops'] if q['id'] != it['id']] or P['stops']
                fixed.append(p['texte'] + ' (retirée)'); continue
            v = views[k]; it['essai'] = k
            if p['type'] == 'photo':
                it['cam'][:3] = list(v)
            else:
                it['p'] = [v[0], v[1]]; it['yaw'] = v[2]
            fixed.append(p['texte'])
    ecrit(folder / 'plan.json', P)
    return fixed


def calc_masses(P):
    """union des murs et des gaines, polygones à trous, pour dessiner chaque masse d'un seul tenant"""
    U = unary_union([Polygon(wall_quad(w)).buffer(0) for w in P['walls'] if not w.get('virtual')] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    U = U.buffer(0.004, join_style=2).buffer(-0.004, join_style=2)  # ressauts et fentes de quelques millimètres
    P['masses'] = [{'poly': [[round(x, 3), round(z, 3)] for x, z in list(g.exterior.coords)[:-1]],
                    'trous': [[[round(x, 3), round(z, 3)] for x, z in list(h.coords)[:-1]] for h in g.interiors if Polygon(h).area > 0.0005]}
                   for g in murs.polys(U.simplify(0.001)) if g.area > 0.0005]
    return P


def ecrit(path, data):
    """écriture atomique : la page ou le serveur ne lisent jamais un fichier à moitié écrit"""
    tmp = Path(path).with_name(f'.{Path(path).name}.{os.getpid()}.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1)); os.replace(tmp, path)


def complete(P, extract=None):
    """ajoute ce qui se calcule : seuils, contour, cadrage, photos, visite, contexte"""
    notes = []
    P.setdefault('H', 2.5); P['simple'] = True
    P['moments'] = [{'id': 'jour', 't': 'Jour', 'season': 'automne', 'hour': 13}]
    W = {w['id']: w for w in P['walls']}
    # loggia ou balcon : reconnu par « ext » ou par son sol ; le moteur attend le sol « loggia » et l'id « loggia »
    ext = [r for r in P['rooms'] if not r.get('of') and (r.get('ext') or r.get('floor') == 'loggia')]
    for r in ext:
        r['ext'] = True; r['floor'] = 'loggia'
    if ext and not any(r['id'] == 'loggia' for r in P['rooms']):
        old = ext[0]['id']; ext[0]['id'] = 'loggia'
        for r in P['rooms']:
            if isinstance(r.get('inclut'), list):
                r['inclut'] = ['loggia' if x == old else x for x in r['inclut']]
            if r.get('of') == old:
                r['of'] = 'loggia'
        for q in P.get('passages') or []:
            q.update({k: 'loggia' for k in ('a', 'b') if q.get(k) == old})
        if old in (P.get('probes') or {}):
            P['probes']['loggia'] = P['probes'].pop(old)
    rooms = [r for r in P['rooms'] if not r.get('of')]
    # seuils sous les portes, débordant de 4 cm dans chaque pièce pour qu'aucune fente ne bloque le pas
    for oid, o in P['openings'].items():
        if o['kind'] not in ('door', 'french', 'entry') or o['kind'] == 'entry':
            continue
        (L, u, T, pt), (s0, s1), t = op_frame(o, W); j = o.get('jamb', 0.04)
        q = [pt(s0 + j, -0.04), pt(s1 - j, -0.04), pt(s1 - j, t + 0.04), pt(s0 + j, t + 0.04)]
        if o['kind'] == 'french':
            d = o.get('depth', t); q = [pt(s0 + 0.05, -0.04), pt(s1 - 0.05, -0.04), pt(s1 - 0.05, d + 0.04), pt(s0 + 0.05, d + 0.04)]
        m_ = (s0 + s1) / 2
        ra = next((r for r in rooms if inside(*pt(m_, -0.25), r['poly']) and not r.get('hidden')), None)
        rb = next((r for r in rooms if inside(*pt(m_, o.get('depth', t) + 0.25), r['poly']) and not r.get('hidden')), None)
        if not ra or not rb:
            continue  # porte de placard ou de local technique : pas de passage
        room_of = ra if not ra.get('ext') else rb; of = room_of['id']
        P['rooms'].append({'id': f'seuil-{oid}', 'poly': [[round(a, 3), round(b, 3)] for a, b in q], 'hidden': True, 'floor': 'seuil' if o['kind'] == 'french' else room_of.get('floor', 'dry'), 'of': of})
    # sols et plafonds jusqu'au pied des murs : une pièce lue quelques centimètres trop courte laisse voir la dalle brute
    solide = unary_union([Polygon(wall_quad(w)).buffer(0) for w in P['walls']] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    baies = unary_union([Polygon([op_frame(o, W)[0][3](op_frame(o, W)[1][0] - 0.02, -0.3), op_frame(o, W)[0][3](op_frame(o, W)[1][1] + 0.02, -0.3),
                                  op_frame(o, W)[0][3](op_frame(o, W)[1][1] + 0.02, op_frame(o, W)[2] + 0.3), op_frame(o, W)[0][3](op_frame(o, W)[1][0] - 0.02, op_frame(o, W)[2] + 0.3)]).buffer(0)
                         for o in P['openings'].values()])
    for r in [r for r in rooms if not r.get('ext')]:
        rp = Polygon(r['poly']).buffer(0)
        autres = unary_union([Polygon(q['poly']).buffer(0) for q in P['rooms'] if q is not r and len(q.get('poly', [])) >= 3])
        gain = rp.buffer(0.08, join_style=2).difference(solide).difference(autres).difference(baies).difference(rp)
        gain = [q for q in murs.polys(gain) if q.area > 5e-5 and q.distance(solide) < 0.01]
        if gain:
            nv = unary_union([rp] + [q.buffer(0.001, join_style=2) for q in gain]).buffer(-0.001, join_style=2)
            if nv.geom_type == 'Polygon' and not nv.interiors and nv.area - rp.area < 0.15 * rp.area:
                r['poly'] = [[round(x, 3), round(z, 3)] for x, z in list(nv.simplify(0.002).exterior.coords)[:-1]]
    for lg in ([P['loggia']] if isinstance(P.get('loggia'), dict) else P.get('loggia') or []):
        if isinstance(lg, dict) and len(lg.get('slab') or []) >= 3:  # dalle de loggia raccordée à la dalle du logement (pas de fente)
            g = Polygon(lg['slab']).buffer(0.015, join_style=2)
            lg['slab'] = [[round(x, 3), round(z, 3)] for x, z in list(g.exterior.coords)[:-1]]
    # contour du logement, murs compris, sans la loggia : union des murs, gaines et pièces intérieures (dalles et plafonds suivent la façade)
    pts = [p for w in P['walls'] for p in wall_quad(w)]
    walls_u = unary_union([Polygon(wall_quad(w)).buffer(0) for w in P['walls']] + [Polygon(g['poly']).buffer(0) for g in P.get('gaines', [])])
    if 'outline' not in P:
        def baie(o):
            (L, u, T, pt), (s0, s1), t = op_frame(o, W); return Polygon([pt(s0, 0), pt(s1, 0), pt(s1, t), pt(s0, t)]).buffer(0)
        U = unary_union([walls_u] + [Polygon(r['poly']).buffer(0) for r in rooms if not r.get('ext')] + [baie(o) for o in P['openings'].values()])
        big = lambda G: max(getattr(G, 'geoms', [G]), key=lambda q: q.area)
        g = big(U.buffer(0.05, join_style=2).buffer(-0.05, join_style=2))  # referme les fentes entre murs et pièces
        if not g.is_empty:  # murs creux comblés, puis traits et échardes de moins de 6 cm retirés (tracés parasites)
            g = big(Polygon(g.exterior).buffer(-0.03, join_style=2).buffer(0.03, join_style=2))
        if ext and not g.is_empty:  # la loggia reste dehors ; fermée par ses voiles et son allège, on ouvre l'allège plutôt que de la combler
            lu = unary_union([Polygon(r['poly']).buffer(0) for r in ext]); g = Polygon(g.exterior)
            for m in (0.01, 0.15, 0.3, 0.45):
                h = big(g.difference(lu.buffer(m, join_style=2)))
                if h.geom_type == 'Polygon' and not h.interiors:
                    break
            if m > 0.01:  # allège ouverte : la façade rognée au passage revient au logement
                back = g.intersection(unary_union([Polygon(r['poly']).buffer(0) for r in rooms if not r.get('ext')]).buffer(0.45, join_style=2))
                h2 = big(h.union(back.difference(lu.buffer(0.01, join_style=2))))
                h = h2 if h2.geom_type == 'Polygon' and not h2.interiors else h
            g = h
        if g.is_empty or g.geom_type != 'Polygon':
            xs, zs = [p[0] for p in pts], [p[1] for p in pts]; P['outline'] = [[min(xs), min(zs)], [max(xs), min(zs)], [max(xs), max(zs)], [min(xs), max(zs)]]
        else:
            P['outline'] = [[round(x, 3), round(z, 3)] for x, z in list(Polygon(g.exterior).simplify(0.005).exterior.coords)[:-1]]
    allp = pts + [p for r in P['rooms'] for p in r['poly']] + ((P.get('loggia') or {}).get('slab') or [])
    xs, zs = [p[0] for p in allp], [p[1] for p in allp]
    P['bounds'] = [round(min(xs) - 0.4, 2), round(max(xs) + 0.4, 2), round(min(zs) - 0.4, 2), round(max(zs) + 0.4, 2)]
    if extract:
        P['underlay'] = extract.get('underlay')
        P.setdefault('dims', extract.get('cotes', []))
    # masses de murs pour le rendu : l'union des murs et des gaines, d'un seul tenant (pas de trait aux raccords des
    # morceaux convexes, qui ne servent plus qu'aux collisions et au plan 2D)
    calc_masses(P)
    # sondes, lampes, passages par défaut
    vis = [r for r in rooms if not r.get('hidden')]
    P.setdefault('probes', {})
    for r in vis:
        c = centre(r['poly'])
        if not pt_ok(r.get('label')) and math.dist(c, centroid(r['poly'])) > 0.01:
            r['label'] = [round(c[0], 3), round(c[1], 3)]  # pièce en L : le nom s'affiche dans la pièce, pas à son centroïde
        if not r.get('ext') and r['id'] not in P['probes']:
            P['probes'][r['id']] = free_point(r, P['walls'], c[0], c[1], 0.3, fixtures=P.get('fixtures', []))
    def at(o, d):
        (L, u, T, pt), (s0, s1), t = op_frame(o, W); return pt((s0 + s1) / 2, d)
    windows = {r['id']: [o for o in P['openings'].values() if o['kind'] in ('window', 'french') and inside(*at(o, -0.3), r['poly'])] for r in vis}
    if not P.get('lamps'):
        P['lamps'] = [{'p': P['probes'][r['id']], **({'blind': True} if not windows.get(r['id']) else {})} for r in vis if r['id'] in P['probes'] and abs(area(r['poly'])) > 2]
    if not P.get('passages'):
        P['passages'] = []
        for oid, o in P['openings'].items():
            if o['kind'] in ('door', 'french'):
                t = op_frame(o, W)[2]
                a = next((r['id'] for r in vis if inside(*at(o, -0.3), r['poly'])), None); b = next((r['id'] for r in vis if inside(*at(o, t + 0.3), r['poly'])), None)
                if a and b and a != b:
                    P['passages'].append({'a': a, 'b': b, 'p': [round(v, 3) for v in at(o, t / 2)], 'r': 0.9})
        # pièces ouvertes l'une sur l'autre (entrée et séjour) : bord commun sans mur de plus de 50 cm
        inner = [r for r in vis if not r.get('ext')]; have = {frozenset((q['a'], q['b'])) for q in P['passages']}
        for i, a in enumerate(inner):
            for b in inner[i + 1:]:
                if frozenset((a['id'], b['id'])) in have:
                    continue
                e = Polygon(a['poly']).buffer(0.03).intersection(Polygon(b['poly']).buffer(0.03)).difference(walls_u)
                parts = [g for g in getattr(e, 'geoms', [e]) if g.geom_type == 'Polygon' and g.area > 0.005]
                if not parts:
                    continue
                g = max(parts, key=lambda q: q.area)
                with warnings.catch_warnings():  # division par zéro bénigne de shapely sur une bande très fine
                    warnings.simplefilter('ignore', RuntimeWarning); xy = list(g.minimum_rotated_rectangle.exterior.coords)
                long_ = max(math.dist(xy[0], xy[1]), math.dist(xy[1], xy[2]))
                if long_ > 0.5:
                    c = g.representative_point()
                    P['passages'].append({'a': a['id'], 'b': b['id'], 'p': [round(c.x, 3), round(c.y, 3)], 'r': round(min(1.2, max(0.9, long_ / 2)), 2)})
    # photos : on essaie de nombreuses positions et directions, on garde la vue la plus profonde qui cadre la fenêtre
    if not P.get('photos'):
        P['photos'] = []
        for r in sorted(vis, key=lambda r: -abs(area(r['poly']))):
            A_ = abs(area(r['poly']))
            if A_ < 2.5:
                continue
            ws = windows.get(r['id']) or []
            tgt = at(max(ws, key=lambda o: op_frame(o, W)[0][0]), 0) if ws else None
            name = r.get('name') or r['id']; label = name + (', ' + str(r['area']) + ' m²' if r.get('area') else '')
            def sides(o):
                t = op_frame(o, W)[2]
                return [next((q['id'] for q in vis if inside(*at(o, d), q['poly'])), None) for d in (-0.3, t + 0.3)]
            def battant(o):  # pièce où le vantail ouvert se rabat
                sd_ = sides(o); return sd_[1] if o.get('swing', 1) > 0 else sd_[0]
            # portes ouvertes pour la vue, sauf celles dont le vantail se rabattrait dans la pièce photographiée (il boucherait la vue)
            near = [oid for oid, o in P['openings'].items() if o['kind'] == 'door' and all(sides(o)) and (not o.get('closed') or r['id'] in sides(o)) and battant(o) != r['id']]
            ferme_ = [oid for oid, o in P['openings'].items() if o['kind'] == 'door' and all(sides(o)) and battant(o) == r['id']]
            shots = []
            if A_ < 7:  # petite pièce : cadrée depuis le seuil de sa porte, comme un photographe, si la vue est dégagée
                v = vue_seuil(r, P, W, at)
                shots = [v] if v else []
            shots = shots or best_views(r, P['walls'], P.get('gaines', []), tgt, 2 if A_ >= 12 else 1, galerie=True, fixtures=P.get('fixtures', []))
            for k, (x, z, yaw) in enumerate(shots):
                P['photos'].append({'id': r['id'] + ('-inverse' if k else ''), 'room': r['id'], 't': name + (', autre angle' if k else ''), 'a': label,
                                    'cam': [x, z, yaw, -0.22 if A_ < 7 else -0.05, 72 if A_ < 8 else 66], 'open': near, 'close': ferme_})
        P['photos'].append({'id': 'maquette', 't': "Vue d'ensemble", 'a': 'maquette 3D', 'orbit': True})
        notes.append('Vues de la galerie calculées automatiquement.')
    if not P.get('stops'):
        seen = set(); P['stops'] = []
        for ph in P['photos']:
            if ph.get('orbit') or room_id(ph) in seen:
                continue
            rid = room_id(ph); seen.add(rid); r = next((q for q in vis if q['id'] == rid), None)
            petite = r is not None and abs(area(r['poly'])) < 7
            P['stops'].append({'id': rid, 'room': rid, 'label': (r.get('name') or rid) if r else rid, 'p': ph['cam'][:2], 'yaw': ph['cam'][2], 'pitch': -0.3 if petite else -0.06, 'open': ph.get('open', []), 'close': ph.get('close', [])})
        # chaque pièce a son arrêt, même sans photo (WC) : vu depuis le seuil de sa porte
        for r in vis:
            if r['id'] not in seen and not r.get('ext'):
                v = vue_seuil(r, P, W, at, detendu=True)
                if v:
                    P['stops'].append({'id': r['id'], 'room': r['id'], 'label': r.get('name') or r['id'], 'p': [v[0], v[1]], 'yaw': v[2], 'pitch': -0.38, 'open': []})
        # ordre de visite : l'entrée d'abord, puis toujours l'arrêt le plus proche (pas d'allers-retours)
        entry = next((r for r in vis if r['id'] in ('entree', 'entrée')), None) or next((r for r in vis if 'entr' in (r.get('name') or '').lower()), None)
        if P['stops']:
            reste = list(P['stops']); cur = next((q for q in reste if entry and q['id'] == entry['id']), reste[0]); ordre = []
            while reste:
                reste.remove(cur); ordre.append(cur)
                if reste:
                    cur = min(reste, key=lambda q: math.dist(q['p'], cur['p']))
            P['stops'] = ordre
    # contexte générique : palier devant la porte palière, arbres et immeubles voisins
    ctx = P.setdefault('context', {})
    m = re.search(r'-?\d+', str(P['etage'])) if P.get('etage') is not None else None
    ctx.setdefault('level', 2.8); ctx.setdefault('below', max(0, int(m.group())) if m else 2); ctx.setdefault('above', 2); ctx.setdefault('masses', [])
    ent = next((o for o in P['openings'].values() if o['kind'] == 'entry'), None)
    if ent and 'palier' not in ctx:
        (L, u, T, pt), (s0, s1), t = op_frame(ent, W)
        out = 1 if not any(inside(*pt((s0 + s1) / 2, t + 0.3), r['poly']) for r in vis) else -1  # le palier est du côté sans pièce
        d0, d1 = (t, t + 2.2) if out > 0 else (0, -2.2)
        # le palier s'arrête avant toute fenêtre de la même façade (la fenêtre donne dehors, pas dans le palier)
        ga, dr = s0 - 0.8, s1 + 0.8
        for o in P['openings'].values():
            if o['kind'] in ('window', 'french'):
                (L2, u2, T2, pt2), (a2, b2), t2 = op_frame(o, W)
                if abs(u2[0] * u[1] - u2[1] * u[0]) < 0.05:
                    q0, q1 = sorted(((pt2(a2, 0)[0] - pt(0, 0)[0]) * u[0] + (pt2(a2, 0)[1] - pt(0, 0)[1]) * u[1], (pt2(b2, 0)[0] - pt(0, 0)[0]) * u[0] + (pt2(b2, 0)[1] - pt(0, 0)[1]) * u[1]))
                    off = abs((pt2(a2, 0)[0] - pt(0, 0)[0]) * u[1] - (pt2(a2, 0)[1] - pt(0, 0)[1]) * u[0])
                    if off < 0.6:
                        if q0 >= s1:
                            dr = min(dr, q0 - 0.05)
                        elif q1 <= s0:
                            ga = max(ga, q1 + 0.05)
        ctx['palier'] = {'poly': [[round(v, 3) for v in pt(ga, d0)], [round(v, 3) for v in pt(dr, d0)], [round(v, 3) for v in pt(dr, d1)], [round(v, 3) for v in pt(ga, d1)]]}
    b = P['bounds']
    if 'trees' not in ctx:
        import random
        R = random.Random(7); cx, cz, rad = (b[0] + b[1]) / 2, (b[2] + b[3]) / 2, max(b[1] - b[0], b[3] - b[2]) / 2 + 9
        ctx['trees'] = [[round(cx + math.cos(a) * (rad + R.random() * 12), 1), round(cz + math.sin(a) * (rad + R.random() * 12), 1)] for a in [i * 2 * math.pi / 16 + R.random() * 0.3 for i in range(16)]]
        ctx['blocks'] = [[round(cx + math.cos(a) * 34 - 9, 1), round(cx + math.cos(a) * 34 + 9, 1), round(cz + math.sin(a) * 34 - 7, 1), round(cz + math.sin(a) * 34 + 7, 1), 12 + (i % 3) * 3] for i, a in enumerate([0.3, 1.5, 2.6, 3.7, 4.8, 5.8])]
    # fiche et galerie
    P.setdefault('titre', 'Logement ' + str(P.get('id', '')))
    P.setdefault('cartouche', {'id': str(P.get('id', '')), 'l1': '', 'l2': '', 'l3': ''})
    P.setdefault('note', "Images de synthèse calculées automatiquement à partir du plan de vente. Logement vide, finitions supposées. Non contractuel.")
    return notes


def essai(A, extract):
    """assemble, contrôle et complète une copie de la réponse : (P assemblé, erreurs, avertissements).
    Une réponse qui fait planter le programme devient une erreur à faire corriger, jamais une reprise qui boucle."""
    try:
        P = assemble(copy.deepcopy(A), extract); errs, warns = check(P)
        if not errs:
            complete(copy.deepcopy(P), extract)
        return P, errs, warns
    except Exception as err:
        return None, [f"Réponse inexploitable par le programme ({type(err).__name__} : {str(err)[:200]}). Respecte exactement le format demandé."], []


def read_plan(folder, pid, mock=None, progress=None):
    folder = Path(folder)
    extract = json.loads((folder / 'extract.json').read_text()) if (folder / 'extract.json').exists() else None
    calib = json.loads((folder / 'calibration.json').read_text()) if (folder / 'calibration.json').exists() else None
    journal = folder / 'appels-ia.json'  # coût cumulé : une reprise garde les appels déjà payés
    log = json.loads(journal.read_text()) if journal.exists() else []
    rapport = {'modele': model_id(), 'fournisseur': provider(), 'appels': log, 'avertissements': [], 'erreurs': []}
    mock = mock or os.environ.get('PLAN_MOCK')
    if mock:
        P = json.loads(Path(mock).read_text())
        for k in ('photos', 'stops', 'context', 'bounds', 'moments'):
            P.pop(k, None)
        P['rooms'] = [r for r in P['rooms'] if not r.get('of')]
    else:
        hints = '' if extract else ('\nPas de tracés vectoriels : ajoute la clé "murs" : [{"a":[x,z],"b":[x,z],"t":0.2}] (ligne médiane et épaisseur de chaque voile et doublage), en plus des cloisons dans "cloisons_ajout". '
                                    'Précision plus faible : signale les points incertains dans fiche.sections.')
        messages = build_messages(folder, extract, calib, hints)
        attempt = [0]
        prog = (lambda n: progress(attempt[0], n)) if progress else None
        saved, brute = folder / 'reponse-ia.json', folder / 'reponse-brute.txt'
        fmt = (extract or {}).get('format')
        garde = lambda A_: saved.write_text(json.dumps({**A_, '_extract': fmt}, ensure_ascii=False))
        if saved.exists() and json.loads(saved.read_text()).get('_extract') != fmt:
            # lecture faite sur une autre extraction (indices des murs différents) : on la met de côté et on relit
            for f_ in ('reponse-ia.json', 'reponse-brute.txt', 'relecture-ia.json'):
                if (folder / f_).exists():
                    (folder / f_).replace(folder / f_.replace('.', '.ancienne.', 1))
        try:
            if saved.exists():  # relance après un incident : on ne repaie pas la lecture
                A = json.loads(saved.read_text()); A.pop('_extract', None); msg = {'text': json.dumps(A), 'assistant': json.dumps(A)}
                rapport['notes_lecture'] = 'réponse IA réutilisée'
            else:
                if brute.exists():  # réponse payée mais illisible la dernière fois : on la relit
                    txt = brute.read_text(); msg = {'text': txt, 'assistant': txt}
                else:
                    msg = call(SYSTEM, messages, log, progress=prog); brute.write_text(msg['text'])
                try:
                    A = parse_json(msg, 'rooms')
                except json.JSONDecodeError as err:  # dernier recours : l'IA répare son propre JSON (court, peu cher)
                    fix = call('Tu répares un JSON invalide. Réponds uniquement par le JSON corrigé, compact, dans un bloc ```json, sans rien changer au contenu.',
                               [{'role': 'user', 'content': f'Erreur : {err}\n```json\n{msg["text"]}\n```'}], log, effort='low', max_tokens=30000)
                    try:
                        A = parse_json(fix, 'rooms')
                    except json.JSONDecodeError:
                        brute.replace(folder / 'reponse-brute.illisible.txt')  # la prochaine relance refera la lecture
                        raise
            # reponse-ia.json ne reçoit qu'une réponse que le programme sait exploiter
            P, errs, warns = essai(A, extract); best = None
            if P is None and saved.exists():  # la réponse gardée fait planter le programme : on ne la rejoue plus telle quelle
                saved.replace(folder / 'reponse-ia.rejetee.json')
            if P is not None:
                best = (A, P, errs); garde(A)
            for k in range(2):
                if not errs and not [w for w in warns if 'm² mesurés' in w or w.startswith('Équipement')]:
                    break
                attempt[0] = k + 1
                messages += [{'role': 'assistant', 'content': msg['assistant']},
                             {'role': 'user', 'content': 'Contrôle automatique :\n- ' + '\n- '.join(errs + warns) + '\nCorrige et renvoie le JSON complet, compact.'}]
                msg = call(SYSTEM, messages, log, progress=prog)
                (folder / f'reponse-brute-{k + 1}.txt').write_text(msg['text'])
                try:
                    A_ = parse_json(msg, 'rooms')
                except json.JSONDecodeError as err:
                    errs, warns = [f'JSON illisible ({err}). Renvoie le JSON complet et valide, dans un bloc ```json.'], []; continue
                P_, errs, warns = essai(A_, extract)
                if P_ is not None and (best is None or not errs or best[2]):  # une correction qui ajoute des erreurs ne remplace pas une lecture propre
                    best = (A_, P_, errs); garde(A_)
            if best is None:
                raise RuntimeError('Réponse de l’IA inexploitable : ' + ' / '.join(errs[:2]))
            A, P, _ = best
            # relecture visuelle par l'IA (une passe), gardée seulement si elle ne casse rien
            if not (folder / 'relecture-ia.json').exists():
                try:
                    attempt[0] = 3
                    A2, ecarts = relecture(folder, P, A, extract, calib, log, progress=prog)
                    rel = {'ecarts': ecarts, 'applique': False}
                    if A2:
                        P2, e2, w2 = essai(A2, extract)
                        if P2 is not None and not e2:  # chaque modification est confirmée par une question ciblée
                            rel['arbitrage'] = []
                            A2 = arbitre(folder, A, A2, P, P2, extract, calib, log, rel['arbitrage'])
                            P2, e2, w2 = essai(A2, extract)
                        if P2 is not None and not e2 and len(w2) <= len(check(P)[1]):
                            A, P = A2, P2; rel['applique'] = True
                            garde(A)
                    (folder / 'relecture-ia.json').write_text(json.dumps(rel, ensure_ascii=False, indent=1))
                    rapport['relecture'] = rel
                except Exception as err:  # la relecture est un plus : son échec ne bloque pas la visite
                    rapport['relecture'] = {'erreur': str(err)[:300]}
        finally:  # chaque appel payé reste compté, même tronqué, illisible ou suivi d'une erreur
            if log:
                journal.write_text(json.dumps(log, ensure_ascii=False))
    P['id'] = pid
    errs, warns = check(P)
    if errs:
        rapport['erreurs'] = errs
        raise RuntimeError('Plan incohérent après lecture : ' + ' / '.join(errs[:4]))
    rapport['avertissements'] += warns
    rapport['murs'] = (P.get('_format') or {}).get('murs', [])
    P.pop('_format', None)
    rapport['notes'] = complete(P, extract)
    # la relecture de la visite se fait ensuite dans le vrai moteur (moteur/controle.mjs)
    if not extract:
        rapport['avertissements'].insert(0, 'Plan lu sur une image : précision de l’ordre de 5 à 10 cm, à vérifier sur les cotes du promoteur.')
    rapport['cout_usd'] = round(sum(c.get('cout_usd') or 0 for c in log), 3); rapport['cout_eur'] = round(rapport['cout_usd'] * EUR, 2)
    ecrit(folder / 'plan.json', P)
    ecrit(folder / 'rapport.json', rapport)
    return P, rapport


if __name__ == '__main__':
    folder, pid = sys.argv[1], sys.argv[2]
    mock = sys.argv[3] if len(sys.argv) > 3 else None
    P, r = read_plan(folder, pid, mock)
    print(json.dumps(r, ensure_ascii=False, indent=1))
