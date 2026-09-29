"""Serveur local : page de dépôt, chaîne de traitement, fichiers statiques.

  python3 pipeline/serveur.py        puis ouvrir http://localhost:8780/

Chaîne : analyse du fichier (sans IA) → calibration à la main si l'échelle manque ou est incertaine →
lecture et contrôle par Claude → photos (sans IA) → visite prête dans plans/<id>/.
La clé API se lit dans ANTHROPIC_API_KEY ou dans le fichier .env à la racine (jamais commité), relu à chaque étape
qui appelle l'IA. Une variable posée au lancement, même vide, n'est jamais remplacée par le .env.
"""
import atexit, http.client, importlib.util, json, math, os, posixpath, re, shutil, signal, subprocess, sys, threading, traceback, unicodedata, urllib.error, uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, unquote, quote

ROOT = Path(__file__).resolve().parent.parent
PLANS = ROOT / 'plans'
sys.path.insert(0, str(ROOT / 'pipeline'))
PORT = int(os.environ.get('PORT', 8780))
ENV0 = {k for k in os.environ}  # posées au lancement : le .env ne les remplace pas (OPENROUTER_API_KEY= vide coupe l'IA)
DU_ENV = set()                  # clés venues du .env, retirées si elles en disparaissent

LOCK = threading.Lock()
RUNNING = set()      # plans dont le traitement tourne ou attend son tour : jamais deux traitements du même plan
SLOTS = threading.BoundedSemaphore(int(os.environ.get('PLAN_PARALLELE', 2)))  # traitements simultanés (IA, Chrome)
ENFANTS = {}         # pid → processus node (et leur Chrome), arrêtés avec le traitement ou le serveur


def load_env():
    """relit .env (appelé avant chaque étape qui appelle l'IA) : une clé ajoutée ou corrigée est prise sans redémarrer"""
    f = ROOT / '.env'; vus = set()
    lignes = f.read_text().splitlines() if f.exists() else []
    with LOCK:
        for line in lignes:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.split('=', 1); k = k.strip()
                if k and k not in ENV0:
                    os.environ[k] = v.strip().strip('"').strip("'"); vus.add(k)
        for k in DU_ENV - vus:
            os.environ.pop(k, None)
        DU_ENV.clear(); DU_ENV.update(vus)


load_env()


def plan_du_fichier(body, ext):
    """plan déjà déposé avec exactement le même fichier (même taille, même empreinte SHA-256), sinon None"""
    import hashlib
    h = None
    for o in sorted(PLANS.iterdir()) if PLANS.exists() else []:
        f = o / ('source' + ext)
        if o.name.startswith(('_', '.')) or not f.is_file() or f.stat().st_size != len(body):
            continue
        h = h or hashlib.sha256(body).hexdigest()
        if hashlib.sha256(f.read_bytes()).hexdigest() == h:
            return o.name
    return None


def slug(name):
    s = unicodedata.normalize('NFKD', Path(name).stem).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:28] or 'plan'
    return f'{s}-{uuid.uuid4().hex[:8]}'


def format_fichier(head):
    """format reconnu aux premiers octets, jamais au nom : '.pdf', '.png', '.jpg', '.webp', 'heic' ou None"""
    if b'%PDF-' in head[:1024]:
        return '.pdf'
    if head[:8] == b'\x89PNG\r\n\x1a\n':
        return '.png'
    if head[:3] == b'\xff\xd8\xff':
        return '.jpg'
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return '.webp'
    if head[4:8] == b'ftyp' and head[8:12] in (b'heic', b'heix', b'hevc', b'mif1', b'msf1'):
        return 'heic'
    return None


def lire_etat(f):
    try:
        return json.loads(f.read_text())
    except (OSError, ValueError):
        return None


def state(pid, **kw):
    with LOCK:
        return _state(pid, **kw)


def _state(pid, **kw):
    """lit etat.json ; avec des clés, le met à jour par écriture atomique (fichier temporaire puis renommage)"""
    f = PLANS / pid / 'etat.json'
    st = lire_etat(f) if f.exists() else {'id': pid, 'etapes': [], 'avertissements': []}
    if not isinstance(st, dict):  # fichier tronqué (serveur tué pendant une écriture) : on repart, relance possible
        st = {'id': pid, 'etapes': [], 'avertissements': [], 'etape': 'analyse', 'statut': 'erreur', 'message': 'État du traitement illisible. Vous pouvez le relancer.'}
    if not kw:
        return st
    for k, v in kw.items():
        if k == 'avertir':
            av = st.setdefault('avertissements', [])
            av += [a for a in (v if isinstance(v, list) else [v]) if a not in av]
        elif k == 'fait':  # une étape refaite (relance) remplace son texte précédent ; l'analyse en a plusieurs, remises à zéro à son début
            st['etapes'] = [x for x in st.get('etapes', []) if x.get('etape') != v.get('etape') or v.get('etape') == 'analyse'] + [v]
        else:
            st[k] = v
    masquer(st)
    tmp = f.with_name('.etat.json.tmp')
    tmp.write_text(json.dumps(st, ensure_ascii=False, indent=1)); os.replace(tmp, f)
    return st


# texte technique : ids (n1, n1-w3, p_sdb), coordonnées, décimales à point, noms de code, fichiers, erreurs Python, mots du schéma
TECHNIQUE = re.compile(r'Traceback|\w+(?:Error|Exception)\b|\b[a-z]+_[a-z0-9_]+\b|\b[\w-]+\.(?:py|mjs|js|json|png|txt)\b|\(-?\d+[.,]\d+, ?-?\d+[.,]\d+\)'
                       r'|\b\d+\.\d{2,}\b|\bn\d+\b|\bn\d+-\w+|\b(?:ids?|level|levels|void|voids|stairs|rooms|walls|openings|niveau \d+ \(n)\b|«\s*[a-z_]+\s*»', re.I)


def montrable(t):
    """texte que la page de dépôt peut montrer à l'acquéreur (aucun texte technique)"""
    return isinstance(t, str) and not TECHNIQUE.search(t)


def masquer(st):
    """contrôle automatique à chaque écriture d'etat.json : un texte technique n'atteint jamais ce que la page affiche
    (message, étapes, avertissements, pastilles). Il est rangé dans textes_masques pour le débogage."""
    m = st.setdefault('textes_masques', []); vus = []
    if st.get('message') is not None and not montrable(st['message']):
        vus.append(st['message'])
        st['message'] = {'refus': 'Ce plan n’a pas pu être traité. Le PDF d’origine du promoteur donne le meilleur résultat.',
                         'erreur': 'Le traitement s’est arrêté. Vous pouvez le relancer.'}.get(st.get('statut'), 'Traitement en cours…')
    vus += [a for a in st.get('avertissements', []) if not montrable(a)]
    st['avertissements'] = [a for a in st.get('avertissements', []) if montrable(a)]
    for x in st.get('etapes', []):
        if x.get('texte') is not None and not montrable(x['texte']):
            vus.append(x['texte']); x['texte'] = None
    for p in st.get('pieces') or []:
        if isinstance(p, list) and p and not montrable(p[0]):
            vus.append(p[0]); p[0] = 'Pièce'
    m += [t for t in vus if t not in m]
    if vus:
        print('Texte technique masqué :', ' / '.join(map(str, vus))[:300], file=sys.stderr)
    if not m:
        st.pop('textes_masques')


def technique(err):
    """détail technique gardé dans etat.json pour le débogage (page de dépôt : seulement avec ?debug=1), sans les chemins du serveur"""
    t = str(err) if isinstance(err, (RuntimeError, SystemExit)) else f'{type(err).__name__} : {err}'
    return t.replace(str(ROOT) + '/', '').replace(str(ROOT), '')[:800]


def refus(pid, msg, err=None):
    """fichier inexploitable : arrêt définitif, sans bouton Relancer (la relance referait la même chose)"""
    state(pid, statut='refus', etape='analyse', message=msg, technique_erreur=technique(err) if err else None)
    return None


def ouvrir_image(src):
    """image déposée → RGB : orientation EXIF appliquée, transparence posée sur du blanc, 16 bits ramenés à 8"""
    from PIL import Image, ImageOps
    import numpy as np
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode in ('I', 'I;16', 'I;16B', 'I;16L', 'I;16N', 'F'):
        a = np.asarray(im, dtype=np.float64); hi = a.max()
        im = Image.fromarray((255 * a / hi if hi > 0 else a).clip(0, 255).astype(np.uint8), 'L')
    if im.mode in ('RGBA', 'LA', 'PA', 'RGBa', 'La') or 'transparency' in im.info:
        im = im.convert('RGBA'); fond = Image.new('RGB', im.size, 'white'); fond.paste(im, mask=im.getchannel('A'))
        return fond
    return im.convert('RGB')


def choisir_page(doc):
    """page du plan : une seule règle, celle d'extract.py"""
    from extract import choisir_page as choix
    return choix(doc)


def analyse(pid):
    """sans IA : type de fichier, murs (tracés ou aplats de l'image), échelle"""
    d = PLANS / pid
    # repart de zéro : une relance ne double ni les étapes faites ni les avertissements d'une analyse précédente
    state(pid, etape='analyse', statut='en_cours', message='Analyse du fichier…', pct=3, etapes=[], avertissements=[])
    src = next(iter(sorted(d.glob('source.*'))), None)
    with open(src or os.devnull, 'rb') as fh:
        ext = format_fichier(fh.read(1024))
    if ext not in ('.pdf', '.png', '.jpg', '.webp'):
        return refus(pid, 'Fichier vide, illisible ou dans un format non pris en charge. Déposez le PDF du plan ou une image PNG, JPG ou WebP.')
    import pymupdf
    if ext != '.pdf':
        try:
            im = ouvrir_image(src)
        except Exception as err:
            return refus(pid, 'Image illisible (fichier endommagé ou trop grand).', err)
        if min(im.size) < 700:
            return refus(pid, f'Image trop petite ({im.width} × {im.height} px). Il faut au moins 700 px sur le petit côté, idéalement le PDF du promoteur.')
        im.save(d / 'image.png')
        doc = pymupdf.open(); page = doc.new_page(width=im.width * 0.5, height=im.height * 0.5)
        page.insert_image(page.rect, filename=str(d / 'image.png')); doc.save(d / 'source-image.pdf')
        pdf = d / 'source-image.pdf'
        state(pid, avertir="Capture ou photo : les murs sont lus sur l'image. Le PDF du promoteur reste le meilleur format.")
    else:
        try:
            doc = pymupdf.open(src)
        except Exception as err:
            return refus(pid, 'Ce PDF ne s’ouvre pas : fichier endommagé ou incomplet.', err)
        if doc.needs_pass:
            return refus(pid, 'Ce PDF est protégé par un mot de passe : enregistrez-le sans protection, puis déposez-le à nouveau.')
        if len(doc) == 0:
            return refus(pid, 'Ce PDF ne contient aucune page lisible (fichier tronqué ?).')
        pdf = src
        from extract import pages_niveaux, empiler
        pp = pages_niveaux(doc) if len(doc) > 1 else None
        if pp:  # un niveau par page : pages empilées sur une seule page, la même pour l'extraction, la calibration et la lecture
            empiler(doc, pp).save(d / 'source-page.pdf'); pdf = d / 'source-page.pdf'
            state(pid, pages=[k + 1 for k in pp])
            if len(pp) < len(doc):
                state(pid, avertir=f"Le PDF compte {len(doc)} pages : les pages {', '.join(str(k + 1) for k in pp[:-1])} et {pp[-1] + 1}, une par niveau, sont lues.")
        elif len(doc) > 1:  # une seule page lue, la même pour l'extraction, la calibration et la lecture
            k = choisir_page(doc)
            one = pymupdf.open(); one.insert_pdf(doc, from_page=k, to_page=k); one.save(d / 'source-page.pdf'); pdf = d / 'source-page.pdf'
            state(pid, page=k + 1, avertir=f'Le PDF compte {len(doc)} pages : seule la page {k + 1}, la plus détaillée, est lue.')
    from extract import extract
    try:
        e = extract(pdf, d, pid)
    except SystemExit as err:
        if str(err) == 'ECHELLE':
            return calibration_needed(pid, pdf, AV_ECHELLE[1])
        return refus(pid, str(err))
    except ImportError:
        raise
    except Exception as err:
        return refus(pid, 'L’analyse automatique de ce plan a échoué : murs ou tracés non reconnus. Le PDF d’origine du promoteur donne le meilleur résultat.', err)
    c = e['echelle']; src_kind = 'image' if e.get('raster') else 'vectoriel'
    state(pid, source=src_kind, echelle=c, pdf=pdf.name,
          fait={'etape': 'analyse', 'texte': texte_analyse(src_kind, c['confiance'] != 'faible')})
    fait_niveaux(pid, e)
    if niveaux_refus(pid, e):
        return None
    if c['confiance'] == 'faible':
        return calibration_needed(pid, pdf, AV_ECHELLE[0])
    return 'lecture'


# avertissements d'échelle : retirés dès que la calibration a réussi
AV_ECHELLE = ('Échelle incertaine : confirmez-la en indiquant une longueur connue sur le plan.', 'Aucune cote lisible pour caler l’échelle : indiquez une longueur connue.')
AV_FICHIER_LU = 'Fichier lu : il reste à caler l’échelle.'


def texte_analyse(src_kind, echelle_lue=True):
    if src_kind == 'vectoriel':
        return 'Plan reconnu : murs et cotes lus directement dans le fichier.'
    return 'Plan reconnu : murs lus sur l’image' + (', échelle retrouvée sur les cotes du plan.' if echelle_lue else '.')


def texte_niveaux(e):
    """« Duplex : 2 niveaux reconnus (R+1 et R+2). » avec les noms du plan, sinon Niveau 1, Niveau 2… du bas vers le haut ; None pour un seul niveau"""
    nv = sorted(e.get('niveaux') or [], key=lambda x: x.get('ordre', 0))
    if len(nv) < 2:
        return None
    noms = [nom_niveau(x.get('nom'), i) for i, x in enumerate(nv)]
    genre = {2: 'Duplex', 3: 'Triplex'}.get(len(nv), 'Logement sur plusieurs niveaux')
    return f"{genre} : {len(nv)} niveaux reconnus ({', '.join(noms[:-1])} et {noms[-1]})."


def nom_niveau(nom, k):
    """nom du niveau écrit sur le plan (R+1, RDC…), sinon Niveau 1, Niveau 2… du bas vers le haut ; jamais un id"""
    nom = str(nom or '').strip()
    return nom if nom and montrable(nom) else f'Niveau {k + 1}'


def fait_niveaux(pid, e):
    """étape faite décrivant les niveaux, juste après celles de l'analyse ; remplacée si l'extraction est refaite (calibration)"""
    t = texte_niveaux(e)
    with LOCK:
        st = _state(pid); et = [x for x in st.get('etapes', []) if not x.get('niveaux')]
        if t:
            i = max((k + 1 for k, x in enumerate(et) if x.get('etape') == 'analyse'), default=0)
            et.insert(i, {'etape': 'analyse', 'texte': t, 'niveaux': True})
        if et != st.get('etapes', []):
            _state(pid, etapes=et)


def niveaux_refus(pid, e=None):
    """avant toute lecture payante : niveaux superposés sans doute possible, et autant que la qualification en a vu.
    Sinon arrêt définitif, sans détail technique. Rend True si le traitement s'arrête."""
    if e is None:
        try:
            e = json.loads((PLANS / pid / 'extract.json').read_text())
        except (OSError, ValueError):
            return False
    nv = e.get('niveaux') or []
    q = state(pid).get('qualification'); nq = q.get('niveaux') if isinstance(q, dict) else None
    nq = nq if isinstance(nq, int) and not isinstance(nq, bool) and nq >= 1 else None
    rate = any(x.get('recouvrement') is not None and x['recouvrement'] < 0.6 for x in nv)
    if rate or (nq and nq != max(1, len(nv))):
        state(pid, statut='refus', etape='analyse', technique_erreur=None,
              message="Les niveaux de ce plan n'ont pas pu être séparés et superposés automatiquement : la visite ne peut pas être construite. Le PDF d'origine du promoteur donne le meilleur résultat.")
        return True
    return False


def calibration_needed(pid, pdf, msg):
    import pymupdf
    d = PLANS / pid; page = pymupdf.open(pdf)[0]  # le PDF lu n'a qu'une page (voir analyse)
    z = min(3.0, 2600 / max(page.rect.width, page.rect.height))
    page.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False).save(d / 'calibration.png')
    st = state(pid, avertir=msg, calib_zoom=z, pdf=Path(pdf).name, source=state(pid).get('source') or 'image')
    if not any(x.get('etape') == 'analyse' for x in st.get('etapes', [])):
        state(pid, fait={'etape': 'analyse', 'texte': AV_FICHIER_LU})
    if qualifier(pid) is False or niveaux_refus(pid):  # niveaux non séparés : arrêt avant de demander la calibration
        return None
    state(pid, etape='calibration', statut='attente', message="Cliquez les deux extrémités d'une cote connue du plan, puis indiquez sa longueur.", image='calibration.png')
    return None


def echelle_calee(pid, e, K):
    """calibration réussie : K exact gardé (extract.json l'arrondit : une réextraction redonne les mêmes coordonnées),
    échelle de l'extraction refaite, avertissements d'échelle retirés, « il reste à caler l'échelle » remplacé"""
    with LOCK:
        st = _state(pid); src_kind = 'image' if e.get('raster') else 'vectoriel'
        et = [{**x, 'texte': texte_analyse(src_kind, False)} if x.get('etape') == 'analyse' and x.get('texte') == AV_FICHIER_LU else x for x in st.get('etapes', [])]
        _state(pid, k_saisi=K, echelle=e.get('echelle'), source=src_kind, etapes=et,
               avertissements=[a for a in st.get('avertissements', []) if a not in AV_ECHELLE])


def ecarter_lecture(d):
    """nouvelle échelle : une lecture faite à l'ancienne échelle ne doit pas être reprise (déplacée, jamais effacée)"""
    old = [f for f in ['reponse-ia.json', 'relecture-ia.json', 'appels-ia.json', 'plan.json'] + [x.name for x in d.glob('reponse-brute*.txt')] if (d / f).exists()]
    if old:
        (d / 'ancienne-echelle').mkdir(exist_ok=True)
        for f in old:
            os.replace(d / f, d / 'ancienne-echelle' / f)


def qualifier(pid):
    """avec IA, pour les images : est-ce bien un plan d'appartement lisible ? Payée une seule fois par plan, même après une relance."""
    load_env()
    from lire import call, img_block, parse_json, provider
    if not provider() or os.environ.get('PLAN_MOCK'):
        return True
    q = state(pid).get('qualification')
    if not isinstance(q, dict):
        log = []
        try:
            msg = call("Tu qualifies des fichiers déposés par des acquéreurs de logements neufs. Réponds en JSON.",
                       [{'role': 'user', 'content': [img_block(PLANS / pid / ('calibration.png' if (PLANS / pid / 'calibration.png').exists() else 'plan-src.png'), 1400), {'type': 'text', 'text':
                         'Ce fichier est-il un plan d\'appartement (vue de dessus, murs, pièces) ? Réponds en JSON : {"plan": bool, "lisible": bool, "niveaux": int, "cotes_visibles": ["..."], "tableau_surfaces": bool, "remarque": "une phrase en français"}'}]}],
                       log, effort='low', max_tokens=4000)
            q = parse_json(msg)
            q = q if isinstance(q, dict) else {}
            state(pid, qualification=q, cout_qualif=log)
        except Exception as err:
            state(pid, qualification_erreur=technique(err)[:200])  # contrôle silencieux : rien à montrer à l'acquéreur
            return True
    remarque = str(q.get('remarque') or '').strip()
    if q.get('plan') is False:
        refus(pid, ("Ce fichier ne ressemble pas à un plan d'appartement. " + remarque).strip())
        return False
    if q.get('lisible') is False:
        state(pid, avertir=('Plan peu lisible. ' + remarque).strip())
    return True  # nombre de niveaux : recoupé avec l'extraction avant la lecture (niveaux_refus)


def rejouer_lecture(d):
    """tests sans appel payant (PLAN_REJEU=1, test de bout en bout outils/bout_en_bout.mjs) : si un autre plan a été déposé avec exactement
    le même fichier et que sa lecture est gardée, elle est recopiée ici (reponse-ia.json, relecture-ia.json) et la lecture la reprend
    (lire.read_plan : « réponse IA réutilisée »). Rien n'est recopié si ce dossier a déjà sa lecture. Jamais activé en service"""
    import hashlib
    if (d / 'reponse-ia.json').exists():
        return True
    src = next(iter(sorted(d.glob('source.*'))), None)
    if not src:
        return False
    h = hashlib.sha256(src.read_bytes()).hexdigest()
    for o in sorted(PLANS.iterdir()):
        if o == d or not o.is_dir() or o.name.startswith(('_', '.')) or not (o / 'reponse-ia.json').exists():
            continue
        s2 = next(iter(sorted(o.glob('source.*'))), None)
        if s2 and s2.suffix == src.suffix and hashlib.sha256(s2.read_bytes()).hexdigest() == h:
            for f in ('reponse-ia.json', 'relecture-ia.json'):
                if (o / f).exists():
                    shutil.copy(o / f, d / f)
            return True
    return False


def lecture(pid):
    d = PLANS / pid
    if niveaux_refus(pid):
        return None
    load_env()
    from lire import provider
    rejeu = os.environ.get('PLAN_REJEU') == '1' and rejouer_lecture(d)
    if not provider() and not os.environ.get('PLAN_MOCK') and not rejeu:
        state(pid, statut='erreur', etape='lecture', message="Clé API absente : ajoutez-la dans le fichier .env à la racine du projet (voir pipeline/README.md), puis relancez.")
        return None
    state(pid, etape='lecture', statut='en_cours', message='Lecture du plan en cours…', pct=10)
    import importlib, lire
    importlib.reload(lire.murs); importlib.reload(lire.apercu); importlib.reload(lire.niveaux); importlib.reload(lire); read_plan = lire.read_plan
    import time as _t
    t0 = _t.time(); info = {'n': 0, 'k': 0, 'fin': False}
    def ticker():  # pendant que le modèle réfléchit, rien n'arrive : on avance doucement
        while not info['fin']:
            if info['n'] == 0:
                state(pid, pct=round(10 + 30 * (1 - 2.718 ** (-(_t.time() - t0) / 70)), 1))
            _t.sleep(2)
    def progress(k, n):
        info['n'], info['k'] = n, k
        if n % 400 < 60 or n < 100:
            state(pid, pct=round(min(66, 40 + 26 * n / 5000) if k == 0 else 66 + min(6, 6 * n / 5000) if k < 3 else 72 + min(6, 6 * n / 3000), 1), phase='correction' if k else 'ecriture')
    threading.Thread(target=ticker, daemon=True).start()
    try:
        P, r = read_plan(d, pid, progress=progress)
    finally:
        info['fin'] = True
    rooms = [x for x in P['rooms'] if not x.get('hidden')]
    ok = not any(SURFACE.fullmatch(a) for a in r['avertissements'])
    lv = P.get('levels') or []
    nom_lv = lambda x: nom_niveau((lv[x.get('level', 0)] if 0 <= x.get('level', 0) < len(lv) else {}).get('name'), x.get('level', 0))
    noms = [x['name'] for x in rooms]  # deux pièces du même nom sur deux niveaux : « Loggia · R+1 », « Loggia · R+2 »
    nom = lambda x: f"{x['name']} · {nom_lv(x)}" if len(lv) > 1 and noms.count(x['name']) > 1 else x['name']
    state(pid, fait={'etape': 'lecture', 'texte': f"{len(rooms)} espaces reconnus (pièces, dégagements, loggia)" + (f' sur {len(lv)} niveaux' if len(lv) > 1 else '') + (', surfaces conformes au plan.' if ok else '.')},
          avertir=avis_lecture(rooms, r['avertissements'], nom), avertissements_lecture=r['avertissements'],
          technique={'cout_eur': r['cout_eur'], 'murs': len(P['walls']), 'ouvertures': len(P['openings'])},
          pieces=[[nom(x), x.get('area') or x.get('areaNote') or ''] for x in rooms])
    return 'controle'


SURFACE = re.compile(r'Pièce (.+) : (\d+\.\d+) m² mesurés \([^)]*\) pour (\d+\.\d+) m² annoncés\.')


def avis_lecture(rooms, avs, nom):
    """avertissements de la lecture montrés à l'acquéreur : écarts de surface (promis par la page de dépôt) et lecture sur image.
    Les autres s'adressent à l'IA (ids, indices, coordonnées, consignes) : gardés dans etat.json (avertissements_lecture), jamais affichés."""
    fr = lambda v: v.replace('.', ',')
    def piece(n, a):  # la pièce par son nom et sa surface annoncée ; un id (pièce sans nom) n'est jamais montré
        return next((x for x in rooms if x.get('name') == n and re.fullmatch(r'\d+(?:[.,]\d+)?', str(x.get('area') or '').strip())
                     and f"{float(str(x['area']).replace(',', '.')):.2f}" == a), None)
    out = []
    for a in avs:
        m = SURFACE.fullmatch(a); x = m and piece(m[1], m[3])
        if x:
            out.append(f'{nom(x)} : {fr(m[2])} m² mesurés sur le plan pour {fr(m[3])} m² au tableau des surfaces.')
        elif a.startswith('Plan lu sur une image'):
            out.append(a)
        elif ARRET.fullmatch(a):
            out.append(avis_arret(a))
    return out


ARRET = re.compile(r"La visite guidée n'a pas d'arrêt dans « (.+) » : aucun point de vue dégagé\.")  # lire.repare_moteur, lire.complete (rapport.json)


def avis_arret(a):
    """pièce laissée sans arrêt de la visite guidée, dite à l'acquéreur (le nom entre guillemets serait pris pour un texte technique)"""
    return f"{ARRET.fullmatch(a)[1]} : pas d'arrêt dans la visite guidée, aucun point de vue assez dégagé."


def arrets_retires(d):
    """avertissements d'arrêt écrits dans rapport.json par la réparation de la visite de contrôle"""
    try:
        return [avis_arret(a) for a in json.loads((d / 'rapport.json').read_text()).get('avertissements', []) if ARRET.fullmatch(a)]
    except (OSError, ValueError):
        return []


def enfant(pid, cmd, **kw):
    """processus node du traitement, dans son propre groupe : arrêté avec son Chrome si le traitement ou le serveur s'arrête"""
    p = subprocess.Popen(cmd, cwd=ROOT, start_new_session=True, **kw)
    with LOCK:
        ENFANTS.setdefault(pid, []).append(p)
    return p


def arreter(procs):
    for p in procs:
        if p.poll() is None:
            try:
                os.killpg(p.pid, signal.SIGTERM)
            except (ProcessLookupError, PermissionError):
                pass


def controle(pid):
    """visite de contrôle dans le vrai moteur : pièces accessibles, baies dégagées, vues libres ; réparation puis blocage si besoin"""
    d = PLANS / pid
    shutil.copy(ROOT / 'moteur' / 'modele.html', d / 'index.html')
    state(pid, etape='controle', statut='en_cours', message='Visite de contrôle…', pct=79)
    import importlib, lire
    importlib.reload(lire.murs); importlib.reload(lire.apercu); importlib.reload(lire.niveaux); importlib.reload(lire)
    for k in range(6):
        (d / 'controle.json').unlink(missing_ok=True)  # jamais le verdict d'un passage précédent
        p = enfant(pid, ['node', str(ROOT / 'moteur' / 'controle.mjs'), f'plans/{pid}'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            out, err = p.communicate(timeout=900)
        except subprocess.TimeoutExpired:
            arreter([p]); raise RuntimeError('Contrôle : plus de 15 minutes, arrêté.')
        try:
            res = json.loads((d / 'controle.json').read_text())
        except Exception:
            raise RuntimeError('Contrôle : ' + (err or out)[-400:])
        if res['ok']:
            esc = bool(json.loads((d / 'plan.json').read_text()).get('stairs'))
            state(pid, fait={'etape': 'controle', 'texte': 'Visite contrôlée : toutes les pièces sont accessibles, les portes se franchissent, les baies sont dégagées'
                             + (', l’escalier se monte et se descend.' if esc else '.')})
            return 'photos'
        if k == 5:
            break
        repare = lire.repare_moteur(d, res['problemes'])
        state(pid, avertir=arrets_retires(d))  # un arrêt retiré n'est jamais passé sous silence
        if not repare:
            break
    state(pid, statut='erreur', message="La visite n'a pas passé le contrôle qualité. Elle n'est pas publiée.",
          technique_erreur=' / '.join(p['texte'] for p in res['problemes'])[:800])
    return None


def photos(pid):
    d = PLANS / pid
    shutil.copy(ROOT / 'moteur' / 'modele.html', d / 'index.html')
    state(pid, etape='photos', statut='en_cours', message='Construction de la 3D et des photos…', pct=82)
    total = len(json.loads((d / 'plan.json').read_text()).get('photos', [])) or 1
    p = enfant(pid, ['node', str(ROOT / 'moteur' / 'photos.mjs'), f'plans/{pid}'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    done, tail = 0, []
    for line in p.stdout:
        tail = (tail + [line])[-8:]
        if '-jour ' in line:
            done += 1; state(pid, pct=round(80 + 14 * done / total, 1))
    if p.wait() != 0:
        raise RuntimeError('Photos : ' + ''.join(tail)[-400:])
    n = len(list((d / 'photos').glob('*.jpg')))
    state(pid, fait={'etape': 'photos', 'texte': f'{n} photos prêtes.'})
    return 'pano'


def pano(pid):
    """panoramas 360° de chaque arrêt (moteur/pano.mjs), contrôlés : la visite n'est pas publiée si le contrôle échoue"""
    d = PLANS / pid
    state(pid, etape='pano', statut='en_cours', message='Visite à 360°…', pct=94)
    total = len(json.loads((d / 'plan.json').read_text()).get('stops', [])) or 1
    (d / 'pano' / 'controle.json').unlink(missing_ok=True)  # jamais le verdict d'un passage précédent
    p = enfant(pid, ['node', str(ROOT / 'moteur' / 'pano.mjs'), f'plans/{pid}'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    done, tail = 0, []
    for line in p.stdout:
        tail = (tail + [line])[-8:]
        if line.startswith('PANO '):
            done += 1; state(pid, pct=round(94 + 5.5 * done / total, 1))
    if p.wait() != 0:
        raise RuntimeError('Panoramas : ' + ''.join(tail)[-400:])
    try:
        res = json.loads((d / 'pano' / 'controle.json').read_text())
    except Exception:
        raise RuntimeError('Panoramas : ' + ''.join(tail)[-400:])
    if not res.get('ok'):
        state(pid, statut='erreur', message="La visite à 360° n'a pas passé le contrôle qualité. Elle n'est pas publiée.",
              technique_erreur=' / '.join(res.get('problemes', []))[:800])
        return None
    n = sum(1 for _ in (d / 'pano').glob('*-512.jpg'))
    state(pid, fait={'etape': 'pano', 'texte': f'Visite à 360° prête : {n} points de vue, d’arrêt en arrêt.'})
    return 'fini'


def expliquer(etape, err):
    """message pour l'acquéreur selon la cause, et si une relance peut aboutir"""
    t = str(err); tl = t.lower(); code = getattr(err, 'status_code', None); nom = type(err).__name__
    if isinstance(err, ImportError):
        return 'Installation incomplète du service : un module manque. Installez-le (voir le guide d’installation), puis relancez.', True
    if etape == 'lecture':
        if code in (401, 403) or t.startswith('Clé') or nom in ('AuthenticationError', 'PermissionDeniedError'):
            return 'Clé API refusée : vérifiez-la dans le fichier .env, puis relancez.', True
        if code == 402 or t.startswith('Crédit') or 'credit balance' in tl:
            return 'Crédit API insuffisant : rechargez le compte, puis relancez.', True
        if code in (429, 529) or (code or 0) >= 500 or isinstance(err, (urllib.error.URLError, ConnectionError, TimeoutError, http.client.HTTPException)) or 'overloaded' in tl or t.startswith(('Trop de demandes', 'OpenRouter a répondu 5')) \
                or nom in ('APIConnectionError', 'APITimeoutError', 'RateLimitError', 'InternalServerError', 'OverloadedError'):
            return 'Le service de lecture est momentanément indisponible ou saturé. Relancez dans une minute.', True
        if t.startswith(('Réponse tronquée', 'La lecture a été refusée', 'Plan incohérent')):
            return t.split(' : ')[0] + '. Vous pouvez relancer la lecture.', True
        return 'La lecture du plan a échoué. Vous pouvez la relancer.', True
    if etape == 'controle':
        return 'La visite de contrôle n’a pas pu tourner. Vous pouvez la relancer.', True
    if etape == 'photos':
        return 'Le calcul des photos s’est interrompu. Vous pouvez le relancer.', True
    if etape == 'pano':
        return 'Le calcul de la visite à 360° s’est interrompu. Vous pouvez le relancer.', True
    return 'L’analyse de ce fichier a échoué. Déposez de préférence le PDF d’origine du promoteur.', False


def run(pid, start='analyse'):
    """enchaîne les étapes ; le plan a été réservé (RUNNING) par l'appelant et il est libéré à la fin, quoi qu'il arrive"""
    steps = {'analyse': analyse, 'lecture': lecture, 'controle': controle, 'photos': photos, 'pano': pano}
    step = start
    try:
        if not SLOTS.acquire(blocking=False):
            state(pid, message='En file d’attente : un autre plan est en cours de traitement…')
            SLOTS.acquire()
        try:
            while step and step != 'fini':
                step = steps[step](pid)
            if step == 'fini':
                state(pid, etape='fini', statut='fini', message='Visite prête.', lien=f'/plans/{pid}/', pct=100, technique_erreur=None)
        finally:
            SLOTS.release()
    except Exception as err:
        traceback.print_exc()
        msg, relance = expliquer(step, err)
        state(pid, statut='erreur' if relance else 'refus', message=msg, technique_erreur=technique(err))
    finally:
        with LOCK:
            RUNNING.discard(pid); procs = ENFANTS.pop(pid, [])
        arreter(procs)


def reserver(pid, garde, **kw):
    """sous le verrou : refuse si le plan tourne déjà ou si son état ne s'y prête pas (garde(st) → message), sinon le réserve et applique kw"""
    with LOCK:
        if pid in RUNNING:
            return 'Ce plan est déjà en cours de traitement.', None
        st = _state(pid); e = garde(st)
        if e:
            return e, st
        RUNNING.add(pid)
        return None, (_state(pid, **kw) if kw else st)


def liberer(pid):
    with LOCK:
        RUNNING.discard(pid)


# page.png (page entière du PDF, logos du promoteur) et plan-src.png (plan recadré) ne sont lus que par le serveur : jamais servis ; le plan
# de la visite est plan-<id>.png exactement (le motif plan-[a-z0-9-]+ laissait passer plan-src.png)
VISITE = re.compile(r'index\.html|plan\.json|calibration\.png')
PANO = re.compile(r'index\.html|visite\.json|visionneuse\.js|[a-z0-9_-]+-(?:512|2048|4096|8192)\.jpg|niveau-\d{1,2}\.png')


# mode admin de l'outil local : fichiers d'un plan montrés dans la visite (jamais les fichiers commençant par un point)
ADMIN_FICHIER = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.(?:json|txt|png|jpg|jpeg|webp|pdf)')
ADMIN_TYPES = {'.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf'}


CSP_PANO = ("default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; "
            "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")


def servable(f):
    """liste blanche sur le chemin résolu (%xx décodés, .. et liens résolus) : visites, moteur, page d'accueil ; rien d'autre"""
    try:
        f = f.resolve(); parts = [x.lower() for x in f.relative_to(ROOT).parts]
    except (ValueError, OSError):
        return False
    if not parts or not f.is_file() or any(x.startswith('.') for x in parts):
        return False
    if parts == ['pipeline', 'accueil.html']:
        return True
    if parts[0] == 'moteur':
        # moteur (premier niveau) et three.js servi avec la visite (moteur/vendor/**.js, fiche C9 : l'import map de modele.html y pointe)
        return (len(parts) == 2 and parts[1].endswith(('.js', '.css'))) or (len(parts) >= 3 and parts[1] == 'vendor' and parts[-1].endswith('.js'))
    if parts[0] == 'plans' and len(parts) == 3:
        return bool(VISITE.fullmatch(parts[2])) or parts[2] == f'plan-{parts[1]}.png'
    if parts[0] == 'plans' and len(parts) == 4:
        # visite à 360° : la page, visite.json et les images seulement (jamais controle.json)
        return (parts[2] == 'photos' and parts[3].endswith('.jpg')) or (parts[2] == 'pano' and bool(PANO.fullmatch(parts[3])))
    return False


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        # cache : pages, données et scripts revalidés à chaque fois (une correction republiée se voit tout de suite) ; images du 360°
        # gardées un an, leur adresse change à chaque rendu (?v=<version>, écrit par moteur/pano.mjs)
        p = urlparse(self.path)
        if not self._headers_buffer or b'cache-control' not in b''.join(self._headers_buffer).lower():
            if '/pano/' in p.path and p.path.endswith(('.jpg', '.png')) and 'v=' in p.query:
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            else:
                self.send_header('Cache-Control', 'no-cache')
        if '/pano/' in p.path:  # le 360° ne demande rien hors de son dossier
            self.send_header('Content-Security-Policy', CSP_PANO)
            self.send_header('Referrer-Policy', 'no-referrer')
        super().end_headers()

    def send_json(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header('content-type', 'application/json'); self.send_header('cache-control', 'no-store')
        self.send_header('content-length', len(b)); self.end_headers(); self.wfile.write(b)

    def hote_ok(self):
        """Host attendu, sinon 403 : bloque le DNS rebinding (un site tiers dont le nom pointe vers 127.0.0.1)"""
        port = self.server.server_address[1]
        return self.headers.get('host', '').lower() in (f'localhost:{port}', f'127.0.0.1:{port}')

    def origine_ok(self):
        """POST : seulement depuis les pages du serveur, pas depuis un autre site (CSRF)"""
        port = self.server.server_address[1]; o = self.headers.get('origin')
        if o is not None and o.lower() not in (f'http://localhost:{port}', f'http://127.0.0.1:{port}'):
            return False
        return self.headers.get('sec-fetch-site', 'same-origin') in ('same-origin', 'none')

    def send_head(self):
        """point de passage commun à GET et HEAD : le filtre porte sur le fichier réellement servi, jamais sur le chemin brut"""
        if urlparse(self.path).path in ('/', '/index.html'):
            self.path = '/pipeline/accueil.html'
        f = Path(self.translate_path(self.path))
        if not servable(f / 'index.html' if f.is_dir() else f):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_HEAD(self):
        if not self.hote_ok():
            return self.send_error(403)
        return super().do_HEAD()

    def do_GET(self):
        if not self.hote_ok():
            return self.send_error(403)
        p = urlparse(self.path).path
        if p.startswith('/api/etat/'):
            pid = unquote(p.split('/')[-1])
            f = PLANS / pid / 'etat.json'
            if not re.fullmatch(r'[a-z0-9-]{1,40}', pid) or not f.exists():
                return self.send_json({'statut': 'inconnu'}, 404)
            st = lire_etat(f)
            return self.send_json(st, 200) if isinstance(st, dict) else self.send_json({'statut': 'illisible'}, 503)
        if p == '/api/plans':
            out = []
            # copies temporaires du test de bout en bout (outils/bout_en_bout.mjs) : hors de la liste de l'outil
            caches = ('_', '.') if os.environ.get('PLAN_DOUBLONS') == '1' else ('_', '.', 'bout-en-bout-')
            for d in sorted((x for x in PLANS.iterdir() if x.is_dir() and not x.name.startswith(caches)), key=lambda d: -d.stat().st_mtime) if PLANS.exists() else []:
                try:
                    st = lire_etat(d / 'etat.json') if (d / 'etat.json').exists() else {'statut': 'fini' if (d / 'plan.json').exists() else 'inconnu'}
                    st = st if isinstance(st, dict) else {'statut': 'inconnu'}
                    titre = json.loads((d / 'plan.json').read_text()).get('titre') if (d / 'plan.json').exists() else None
                    titre = titre or st.get('nom') or 'Plan en cours de lecture'
                    # vignette : la première vue de la galerie (la pièce principale), pas la première par ordre alphabétique
                    ordre = [p_['id'] for p_ in json.loads((d / 'plan.json').read_text()).get('photos', []) if not p_.get('orbit')] if (d / 'plan.json').exists() else []
                    jpgs = sorted((d / 'photos').glob('*.jpg'), key=lambda f: next((i for i, n in enumerate(ordre) if f.stem.rsplit('-', 1)[0] == n), 99)) if (d / 'photos').exists() else []
                    photo = f'/plans/{quote(d.name)}/photos/{quote(jpgs[0].name)}' if jpgs else None
                    out.append({'id': d.name, 'titre': str(titre), 'statut': st.get('statut'), 'photo': photo, 'date': int(d.stat().st_mtime), 'pano': (d / 'pano' / 'visite.json').exists(),
                                'sources': [f.name for f in sorted(d.glob('source.*')) if ADMIN_FICHIER.fullmatch(f.name)] + (['page.png'] if (d / 'page.png').exists() else [])})
                except Exception:
                    out.append({'id': d.name, 'titre': 'Plan', 'statut': 'inconnu', 'photo': None})
            return self.send_json(out)
        if p == '/api/sante':  # la page des plans n'active le dépôt que si le moteur et l'IA sont là
            load_env()
            from lire import provider
            return self.send_json({'depot': True, 'ia': bool(provider() or os.environ.get('PLAN_MOCK') or os.environ.get('PLAN_REJEU') == '1')})
        if p.startswith('/api/admin/'):
            return self.admin(p)
        if p == '/api/export':
            return self.exporter()
        if p.startswith('/api/'):
            return self.send_json({'erreur': 'inconnu'}, 404)
        return super().do_GET()

    def exporter(self):
        """export complet (outils/exporter.mjs) : tous les plans, ou ?ids=a,b ; archive .tar.gz téléchargée"""
        from urllib.parse import parse_qs
        ids = [x for x in (parse_qs(urlparse(self.path).query).get('ids') or [''])[0].split(',') if x]
        if any(not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', x) or not (PLANS / x / 'plan.json').exists() for x in ids):
            return self.send_json({'erreur': 'plan inconnu'}, 404)
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            f = Path(t) / 'export.tar.gz'
            r = subprocess.run(['node', str(ROOT / 'outils' / 'exporter.mjs'), str(f), *ids], cwd=ROOT, capture_output=True, text=True, timeout=900)
            if r.returncode or not f.exists():
                return self.send_json({'erreur': 'Export impossible.', 'detail': (r.stderr or r.stdout)[-600:]}, 500)
            import datetime
            nom = f"surpiece-{ids[0] if len(ids) == 1 else 'plans'}-{datetime.datetime.now():%Y%m%d-%H%M}.tar.gz"
            self.send_response(200); self.send_header('content-type', 'application/gzip'); self.send_header('content-length', f.stat().st_size)
            self.send_header('content-disposition', f'attachment; filename="{nom}"'); self.send_header('cache-control', 'no-store'); self.end_headers()
            with open(f, 'rb') as fh:
                shutil.copyfileobj(fh, self.wfile)

    def importer(self, p, body):
        """import (outils/importer.mjs) : archive envoyée (corps) ou adresse d'une copie partagée ({"url": …}) ; en-tête x-remplacer: 1 pour
        remplacer un plan de même identifiant. Rend le compte rendu de l'outil, ligne par ligne"""
        import tempfile
        remplacer = ['--remplacer'] if self.headers.get('x-remplacer') == '1' else []
        with tempfile.TemporaryDirectory() as t:
            if p == '/api/import':
                if not body:
                    return self.send_json({'erreur': 'Archive vide.'}, 400)
                src = Path(t) / 'import.tar.gz'; src.write_bytes(body); src = str(src)
            else:
                try:
                    src = json.loads(body or b'{}').get('url', '')
                except ValueError:
                    src = ''
                if not re.fullmatch(r'https?://[^\s"\'<>]{3,500}', src or ''):
                    return self.send_json({'erreur': 'Adresse invalide (https://…).'}, 400)
            r = subprocess.run(['node', str(ROOT / 'outils' / 'importer.mjs'), src, *remplacer], cwd=ROOT, capture_output=True, text=True, timeout=1800)
        lignes = [x for x in (r.stdout + r.stderr).splitlines() if x.strip()]
        return self.send_json({'ok': r.returncode == 0, 'lignes': lignes[-60:]}, 200 if r.returncode == 0 else 400)

    def admin(self, p):
        """mode admin de l'outil local (L4-19) : fichiers d'un plan (plan déposé, images de lecture, réponses de l'IA, plan.json, contrôles).
        /api/admin/<id> : liste ; /api/admin/<id>/<fichier> : le fichier (racine du dossier, et pano/controle.json). Local seulement
        (127.0.0.1, hôte vérifié) : à retirer ou à réserver à l'administrateur avant toute mise en ligne (lot 5)"""
        parts = [unquote(x) for x in p[len('/api/admin/'):].split('/') if x]
        if not parts or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', parts[0]) or not (PLANS / parts[0]).is_dir():
            return self.send_json({'erreur': 'plan inconnu'}, 404)
        d = (PLANS / parts[0]).resolve()
        if len(parts) == 1:
            out = []
            for f in sorted([*d.iterdir(), d / 'pano' / 'controle.json']):
                if f.is_file() and ADMIN_FICHIER.fullmatch(f.name):
                    st = f.stat(); out.append({'nom': f.relative_to(d).as_posix(), 'taille': st.st_size, 'date': int(st.st_mtime)})
            return self.send_json(out)
        rel = '/'.join(parts[1:])
        if not (ADMIN_FICHIER.fullmatch(parts[-1]) and (len(parts) == 2 or rel == 'pano/controle.json')):
            return self.send_json({'erreur': 'fichier refusé'}, 404)
        f = (d / rel).resolve()
        if d not in f.parents or not f.is_file():
            return self.send_json({'erreur': 'fichier introuvable'}, 404)
        b = f.read_bytes(); ext = f.suffix.lower()
        self.send_response(200)
        self.send_header('content-type', ADMIN_TYPES.get(ext, 'application/octet-stream')); self.send_header('content-length', len(b))
        self.send_header('cache-control', 'no-store'); self.send_header('content-disposition', 'inline')
        self.end_headers(); self.wfile.write(b)

    def do_POST(self):
        if not self.hote_ok() or not self.origine_ok():
            return self.send_json({'erreur': 'Requête refusée : elle doit venir de la page de dépôt.'}, 403)
        p = urlparse(self.path).path
        try:
            n = int(self.headers.get('content-length') or 0)
        except ValueError:
            n = -1
        if n < 0:
            return self.send_json({'erreur': 'Requête invalide.'}, 400)
        if n > {'/api/depot': 40_000_000, '/api/import': 4_000_000_000}.get(p, 100_000):
            self.close_connection = True
            left = n if n < 300_000_000 else 0  # on lit le corps pour que le navigateur reçoive la réponse
            while left > 0:
                c = self.rfile.read(min(left, 1 << 20))
                if not c:
                    break
                left -= len(c)
            return self.send_json({'erreur': 'Fichier trop lourd (40 Mo maximum).' if p == '/api/depot' else 'Requête trop lourde.'}, 413)
        body = self.rfile.read(n)
        if p == '/api/depot':
            return self.depot(body)
        if p in ('/api/import', '/api/import-url'):
            return self.importer(p, body)
        pid = unquote(p.split('/')[-1])
        if not (re.fullmatch(r'[a-z0-9-]{1,40}', pid) and (PLANS / pid).is_dir()) or not p.startswith(('/api/relancer/', '/api/calibration/')):
            return self.send_json({'erreur': 'inconnu'}, 404)
        if p.startswith('/api/relancer/'):
            err, st = reserver(pid, lambda st: None if st.get('statut') == 'erreur' else 'Rien à relancer : ce plan n’est pas en erreur.',
                               statut='en_cours', message='Reprise…', technique_erreur=None)
            if err:
                return self.send_json({'erreur': err}, 409)
            step = st.get('etape') if st.get('etape') in ('analyse', 'lecture', 'controle', 'photos', 'pano') else \
                'lecture' if st.get('etape') == 'calibration' and st.get('k_saisi') else 'analyse'  # échelle déjà calée : pas de nouvelle cote à demander
            threading.Thread(target=run, args=(pid, step), daemon=True).start()
            return self.send_json({'ok': True, 'etape': step})
        return self.calibration(pid, body)

    def depot(self, body):
        name = self.headers.get('x-nom')
        if name is None:  # en-tête exigé : un autre site ne peut pas l'envoyer sans l'accord du serveur (pré-vérification CORS)
            return self.send_json({'erreur': 'Nom du fichier manquant (en-tête x-nom).'}, 400)
        name = unquote(name).replace('\x00', '')[:200] or 'plan'
        if not body:
            return self.send_json({'erreur': 'Fichier vide.'}, 400)
        ext = format_fichier(body[:1024])
        if ext == 'heic':
            return self.send_json({'erreur': 'Photo HEIC (iPhone) non prise en charge : exportez-la en JPG ou faites une capture d’écran du plan.'}, 415)
        if not ext:
            return self.send_json({'erreur': 'Format non reconnu : déposez le PDF du plan ou une image PNG, JPG ou WebP.'}, 415)
        # un plan par fichier : le même fichier déjà déposé ramène à son plan, rien n'est refait (demande du 29/09/2026 ; le test de bout
        # en bout, qui redépose les plans de référence, crée ses copies avec PLAN_DOUBLONS=1 et les supprime ensuite)
        if os.environ.get('PLAN_DOUBLONS') != '1':
            deja = plan_du_fichier(body, ext)
            if deja:
                return self.send_json({'id': deja, 'existant': True})
        with LOCK:
            plein = len(RUNNING) >= 6
        if plein:
            return self.send_json({'erreur': 'Trop de plans en cours de traitement : réessayez dans quelques minutes.'}, 429)
        d = pid = None
        try:
            PLANS.mkdir(exist_ok=True)
            for _ in range(5):
                pid = slug(name)
                try:
                    (PLANS / pid).mkdir(); d = PLANS / pid; break
                except FileExistsError:
                    continue
            if d is None:
                raise RuntimeError('identifiant déjà pris')
            (d / ('source' + ext)).write_bytes(body)
            with LOCK:
                RUNNING.add(pid); _state(pid, nom=name, statut='en_cours', etape='analyse', message='Fichier reçu.')
        except Exception:
            traceback.print_exc()
            if d:
                shutil.rmtree(d, ignore_errors=True); liberer(pid)
            return self.send_json({'erreur': 'Enregistrement du fichier impossible : réessayez dans un instant.'}, 500)
        threading.Thread(target=run, args=(pid,), daemon=True).start()
        return self.send_json({'id': pid})

    def calibration(self, pid, body):
        try:
            c = json.loads(body); (x1, y1), (x2, y2) = c['p1'], c['p2']
            x1, y1, x2, y2, m = (float(v) for v in (x1, y1, x2, y2, c['m']))
            if not all(math.isfinite(v) for v in (x1, y1, x2, y2, m)):
                raise ValueError
        except (ValueError, KeyError, TypeError, IndexError):
            return self.send_json({'erreur': 'Calibration illisible : cliquez deux points puis indiquez une longueur.'}, 400)
        fr = lambda v: f'{v:.2f}'.replace('.', ',')
        if not 0.3 <= m <= 25:  # les plans écrivent les cotes en cm (« 412 ») : on attend des mètres
            return self.send_json({'erreur': f'Longueur attendue en mètres : vouliez-vous dire {fr(m / 100)} m ?' if 0.3 <= m / 100 <= 25 else
                                   'Indiquez la longueur en mètres, entre 0,30 et 25 (ex. 4,12).'}, 400)
        px = math.hypot(x2 - x1, y2 - y1)
        if px < 40:
            return self.send_json({'erreur': 'Les deux points sont trop proches : choisissez une cote plus longue.'}, 400)
        err, st = reserver(pid, lambda st: None if st.get('statut') == 'attente' and st.get('etape') == 'calibration' else 'Ce plan n’attend pas de calibration.')
        if err:
            return self.send_json({'erreur': err}, 409)
        d = PLANS / pid
        try:
            from PIL import Image
            w, h = Image.open(d / st.get('image', 'calibration.png')).size
            if not all(0 <= x <= w and 0 <= y <= h for x, y in ((x1, y1), (x2, y2))):
                liberer(pid); return self.send_json({'erreur': 'Un des points est hors du plan : recommencez.'}, 400)
            z = st.get('calib_zoom', 1.0); K = (px / z) / m  # points de page par mètre
            from extract import extract
            e = extract(d / st.get('pdf', 'source.pdf'), d, pid, K_force=K)
            ecarter_lecture(d)
            echelle_calee(pid, e, K)
            fait_niveaux(pid, e)
        except SystemExit as e:
            liberer(pid); return self.send_json({'erreur': f'Plan illisible : {e}'}, 400)
        except Exception:  # le plan reste en attente : une autre cote peut réussir
            traceback.print_exc(); liberer(pid)
            return self.send_json({'erreur': 'Analyse impossible avec cette échelle : vérifiez les deux points et la longueur. Si cela persiste, les murs de ce plan ne sont pas reconnus.'}, 422)
        state(pid, fait={'etape': 'calibration', 'texte': f"Échelle calée sur votre cote de {fr(m)} m."}, statut='en_cours', message='Échelle calée.')
        threading.Thread(target=run, args=(pid, 'lecture'), daemon=True).start()
        return self.send_json({'ok': True})


def reprise_au_demarrage():
    """plans restés « en cours » quand le serveur s'est arrêté : marqués interrompus, avec le bouton Relancer"""
    for f in PLANS.glob('*/etat.json'):
        st = lire_etat(f)
        if not isinstance(st, dict) or st.get('statut') == 'en_cours':
            state(f.parent.name, statut='erreur', message='Traitement interrompu (serveur redémarré). Vous pouvez le relancer.')


def arreter_tout():
    with LOCK:
        procs = [p for l in ENFANTS.values() for p in l]
    arreter(procs)


def test_liste_blanche():
    """contrôle au démarrage (et python3 pipeline/serveur.py --test) : sur un serveur de ce code lancé à part, pour chaque plan publié,
    rien d'interne n'est servi depuis l'adresse de son 360° (page du PDF, plan recadré, source, lecture, état, contrôles), sous toutes
    les écritures (%2e%2e, majuscules, doubles barres) ; les images du 360° versionnées sont gardées en cache, le reste revalidé.
    Renvoie la liste des fuites (vide si tout va bien)"""
    srv = ThreadingHTTPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    fuites = []

    def get(chemin):
        c = http.client.HTTPConnection('127.0.0.1', port, timeout=5)
        try:
            c.request('GET', chemin, headers={'Host': f'localhost:{port}'}); r = c.getresponse(); r.read()
            return r.status, {k.lower(): v for k, v in r.getheaders()}
        finally:
            c.close()
    try:
        plans = [d for d in PLANS.iterdir() if d.is_dir() and not d.name.startswith(('_', '.')) and (d / 'pano' / 'visite.json').exists()] if PLANS.exists() else []
        interdits = ['page.png', 'plan-src.png', 'source.pdf', 'extract.json', 'reponse-ia.json', 'etat.json', 'rapport.json', 'controle.json', 'relecture-ia.json', 'appels-ia.json']
        for d in plans:
            b = f'/plans/{quote(d.name)}/pano/'
            for n in interdits:
                for ch in (f'{b}../{n}', f'{b}%2e%2e/{n}', f'{b}%2E%2E/{n.upper()}', f'/plans/{quote(d.name)}//{n}', f'/plans/{quote(d.name)}/{n}'):
                    if get(ch)[0] != 404:
                        fuites.append(ch)
            for ch in (f'{b}controle.json', f'{b}%63ontrole.json', f'{b}../../../pipeline/serveur.py', f'{b}../../../.env'):
                if get(ch)[0] != 404:
                    fuites.append(ch)
            st, h = get(b)
            if st != 200 or 'no-cache' not in h.get('cache-control', '') or "script-src 'self'" not in h.get('content-security-policy', ''):
                fuites.append(f'{b} : en-têtes {h.get("cache-control")} / politique de contenu absente')
            v = json.loads((d / 'pano' / 'visite.json').read_text()).get('version', '')
            dep = json.loads((d / 'pano' / 'visite.json').read_text()).get('depart', '')
            st, h = get(f'{b}{quote(dep)}-512.jpg?v={v}')
            if st != 200 or 'immutable' not in h.get('cache-control', ''):
                fuites.append(f'{b}{dep}-512.jpg : cache {h.get("cache-control")} ({st})')
        # la visite 3D charge three.js par l'import map de moteur/modele.html (chemins relatifs à plans/<id>/), puis chaque module importe
        # les siens : tout doit être servi, sinon la 3D ne démarre pas (constat du 28/09/2026 : moteur/vendor/** refusé, 404)
        for ch in scripts_visite():
            if get(ch)[0] != 200:
                fuites.append(f'{ch} : script de la visite refusé')
    finally:
        srv.shutdown(); srv.server_close()
    return fuites


def scripts_visite(modele=None):
    """adresses de tous les scripts que la page de visite charge : import map et scripts de moteur/modele.html, puis, de proche en
    proche, les imports relatifs de chaque module (three/examples/jsm importe ../../../build/three.module.js, etc.)"""
    html = (modele or ROOT / 'moteur' / 'modele.html').read_text()
    base = '/plans/x/'
    vus, file = set(), []
    m = re.search(r'<script type="importmap">(.*?)</script>', html, re.S)
    carte = json.loads(m.group(1)).get('imports', {}) if m else {}
    for v in carte.values():
        if v.endswith('.js'):
            file.append(posixpath.normpath(posixpath.join(base, v)))
    for v in re.findall(r'<script[^>]+src="([^"]+)"', html) + re.findall(r'''import\s*(?:[^'"]*?from\s*)?['"](\.[^'"]+)['"]''', html):
        file.append(posixpath.normpath(posixpath.join(base, v)))
    for pre, cible in carte.items():  # modules nommés importés par le moteur (three/addons/…)
        if pre.endswith('/'):
            for f in (ROOT / 'moteur').glob('*.js'):
                for v in re.findall(r'''['"]%s([^'"]+\.js)['"]''' % re.escape(pre), f.read_text()):
                    file.append(posixpath.normpath(posixpath.join(base, cible, v)))
    while file:
        ch = file.pop()
        if ch in vus:
            continue
        vus.add(ch)
        f = ROOT / ch.lstrip('/')
        if not f.is_file():
            continue
        for v in re.findall(r'''(?:import|export)\s*(?:[^'";]*?from\s*)?['"](\.{1,2}/[^'"]+)['"]''', f.read_text(errors='ignore')):
            file.append(posixpath.normpath(posixpath.join(posixpath.dirname(ch), v)))
        for pre, cible in carte.items():
            if pre.endswith('/'):
                for v in re.findall(r'''from\s*['"]%s([^'"]+\.js)['"]''' % re.escape(pre), f.read_text(errors='ignore')):
                    file.append(posixpath.normpath(posixpath.join(base, cible, v)))
    return sorted(vus)


if __name__ == '__main__' and '--test' in sys.argv:
    f = test_liste_blanche()
    print('\n'.join(f) if f else 'Liste blanche et cache : aucun problème.')
    sys.exit(1 if f else 0)

if __name__ == '__main__':
    pip = {'pymupdf': 'pymupdf', 'PIL': 'pillow', 'numpy': 'numpy', 'shapely': 'shapely', 'cv2': 'opencv-python-headless'}
    manque = [v for k, v in pip.items() if importlib.util.find_spec(k) is None]
    if manque:
        sys.exit('Modules Python absents. Installez-les : pip3 install ' + ' '.join(manque))
    PLANS.mkdir(exist_ok=True)
    fuites = test_liste_blanche()
    if fuites:  # un fichier interne servi : on ne démarre pas
        sys.exit('Fichiers internes servis, serveur arrêté :\n' + '\n'.join(fuites))
    reprise_au_demarrage()
    atexit.register(arreter_tout)
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))  # arrêt propre : les Chrome des traitements sont arrêtés aussi
    print(f'Dépôt de plans : http://localhost:{PORT}/')
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
