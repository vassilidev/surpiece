"""Serveur local : page de dépôt, chaîne de traitement, fichiers statiques.

  python3 pipeline/serveur.py        puis ouvrir http://localhost:8780/

Chaîne : analyse du fichier (sans IA) → calibration à la main si l'échelle manque ou est incertaine →
lecture et contrôle par Claude → photos (sans IA) → visite prête dans plans/<id>/.
La clé API se lit dans ANTHROPIC_API_KEY ou dans le fichier .env à la racine (jamais commité), relu à chaque étape
qui appelle l'IA. Une variable posée au lancement, même vide, n'est jamais remplacée par le .env.
"""
import atexit, http.client, importlib.util, json, math, os, re, shutil, signal, subprocess, sys, threading, traceback, unicodedata, urllib.error, uuid
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
        elif k == 'fait':
            st.setdefault('etapes', []).append(v)
        else:
            st[k] = v
    tmp = f.with_name('.etat.json.tmp')
    tmp.write_text(json.dumps(st, ensure_ascii=False, indent=1)); os.replace(tmp, f)
    return st


def technique(err):
    """détail technique affiché sous le message, sans les chemins du serveur"""
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
    state(pid, etape='analyse', statut='en_cours', message='Analyse du fichier…', pct=3)
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
        if len(doc) > 1:  # une seule page lue, la même pour l'extraction, la calibration et la lecture
            k = choisir_page(doc)
            one = pymupdf.open(); one.insert_pdf(doc, from_page=k, to_page=k); one.save(d / 'source-page.pdf'); pdf = d / 'source-page.pdf'
            state(pid, page=k + 1, avertir=f'Le PDF compte {len(doc)} pages : seule la page {k + 1}, la plus détaillée, est lue.')
    from extract import extract
    try:
        e = extract(pdf, d, pid)
    except SystemExit as err:
        if str(err) == 'ECHELLE':
            return calibration_needed(pid, pdf, 'Aucune cote lisible pour caler l’échelle : indiquez une longueur connue.')
        return refus(pid, str(err))
    except ImportError:
        raise
    except Exception as err:
        return refus(pid, 'L’analyse automatique de ce plan a échoué : murs ou tracés non reconnus. Le PDF d’origine du promoteur donne le meilleur résultat.', err)
    c = e['echelle']; src_kind = 'image' if e.get('raster') else 'vectoriel'
    state(pid, source=src_kind, echelle=c, pdf=pdf.name,
          fait={'etape': 'analyse', 'texte': 'Plan reconnu : murs et cotes lus directement dans le fichier.' if src_kind == 'vectoriel' else 'Plan reconnu : murs lus sur l’image, échelle retrouvée sur les cotes du plan.'})
    if c['confiance'] == 'faible':
        return calibration_needed(pid, pdf, 'Échelle incertaine : confirmez-la en indiquant une longueur connue sur le plan.')
    return 'lecture'


def calibration_needed(pid, pdf, msg):
    import pymupdf
    d = PLANS / pid; page = pymupdf.open(pdf)[0]  # le PDF lu n'a qu'une page (voir analyse)
    z = min(3.0, 2600 / max(page.rect.width, page.rect.height))
    page.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False).save(d / 'calibration.png')
    st = state(pid, avertir=msg, calib_zoom=z, pdf=Path(pdf).name, source=state(pid).get('source') or 'image')
    if not any(x.get('etape') == 'analyse' for x in st.get('etapes', [])):
        state(pid, fait={'etape': 'analyse', 'texte': 'Fichier lu : il reste à caler l’échelle.'})
    if qualifier(pid) is False:
        return None
    state(pid, etape='calibration', statut='attente', message="Cliquez les deux extrémités d'une cote connue du plan, puis indiquez sa longueur.", image='calibration.png')
    return None


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
            state(pid, avertir=f'Qualification impossible : {technique(err)[:200]}')
            return True
    remarque = str(q.get('remarque') or '').strip()
    niveaux = q.get('niveaux') if isinstance(q.get('niveaux'), int) and not isinstance(q.get('niveaux'), bool) else 1
    if q.get('plan') is False:
        refus(pid, ("Ce fichier ne ressemble pas à un plan d'appartement. " + remarque).strip())
        return False
    if q.get('lisible') is False:
        state(pid, avertir=('Plan peu lisible. ' + remarque).strip())
    if niveaux > 1:
        state(pid, avertir=f"{niveaux} niveaux détectés : cette version construit un seul niveau.")
    return True


def lecture(pid):
    d = PLANS / pid
    load_env()
    from lire import provider
    if not provider() and not os.environ.get('PLAN_MOCK'):
        state(pid, statut='erreur', etape='lecture', message="Clé API absente : ajoutez ANTHROPIC_API_KEY (ou OPENROUTER_API_KEY) dans le fichier .env à la racine du projet, puis relancez.")
        return None
    state(pid, etape='lecture', statut='en_cours', message='Lecture du plan en cours…', pct=10)
    import importlib, lire
    importlib.reload(lire.murs); importlib.reload(lire.apercu); importlib.reload(lire); read_plan = lire.read_plan
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
    ok = not r['avertissements']
    state(pid, fait={'etape': 'lecture', 'texte': f"{len(rooms)} espaces reconnus (pièces, dégagements, loggia)" + (', surfaces conformes au plan.' if ok else '.')},
          avertir=r['avertissements'], technique={'cout_eur': r['cout_eur'], 'murs': len(P['walls']), 'ouvertures': len(P['openings'])},
          pieces=[[x['name'], x.get('area') or x.get('areaNote') or ''] for x in rooms])
    return 'controle'


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
    importlib.reload(lire.murs); importlib.reload(lire.apercu); importlib.reload(lire)
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
            state(pid, fait={'etape': 'controle', 'texte': 'Visite contrôlée : toutes les pièces sont accessibles, les portes se franchissent, les baies sont dégagées.'})
            return 'photos'
        if k == 5:
            break
        if not lire.repare_moteur(d, res['problemes']):
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
            done += 1; state(pid, pct=round(80 + 19 * done / total, 1))
    if p.wait() != 0:
        raise RuntimeError('Photos : ' + ''.join(tail)[-400:])
    n = len(list((d / 'photos').glob('*.jpg')))
    state(pid, fait={'etape': 'photos', 'texte': f'{n} photos prêtes.'})
    return 'fini'


def expliquer(etape, err):
    """message pour l'acquéreur selon la cause, et si une relance peut aboutir"""
    t = str(err); tl = t.lower(); code = getattr(err, 'status_code', None); nom = type(err).__name__
    if isinstance(err, ImportError):
        return f'Installation incomplète : module « {err.name} » absent (voir pipeline/README.md). Installez-le, puis relancez.', True
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
        return 'La lecture du plan a échoué (détail ci-dessous). Vous pouvez la relancer.', True
    if etape == 'controle':
        return 'La visite de contrôle n’a pas pu tourner (Chrome sans écran). Vous pouvez la relancer.', True
    if etape == 'photos':
        return 'Le calcul des photos s’est interrompu. Vous pouvez le relancer.', True
    return 'L’analyse de ce fichier a échoué (détail ci-dessous). Déposez de préférence le PDF d’origine du promoteur.', False


def run(pid, start='analyse'):
    """enchaîne les étapes ; le plan a été réservé (RUNNING) par l'appelant et il est libéré à la fin, quoi qu'il arrive"""
    steps = {'analyse': analyse, 'lecture': lecture, 'controle': controle, 'photos': photos}
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


VISITE = re.compile(r'index\.html|plan\.json|plan-[a-z0-9-]+\.png|calibration\.png|page\.png')


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
        return len(parts) == 2 and parts[1].endswith(('.js', '.css'))
    if parts[0] == 'plans' and len(parts) == 3:
        return bool(VISITE.fullmatch(parts[2]))
    if parts[0] == 'plans' and len(parts) == 4:
        return parts[2] == 'photos' and parts[3].endswith('.jpg')
    return False


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
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
            for d in sorted((x for x in PLANS.iterdir() if x.is_dir() and not x.name.startswith(('_', '.'))), key=lambda d: -d.stat().st_mtime) if PLANS.exists() else []:
                try:
                    st = lire_etat(d / 'etat.json') if (d / 'etat.json').exists() else {'statut': 'fini' if (d / 'plan.json').exists() else 'inconnu'}
                    st = st if isinstance(st, dict) else {'statut': 'inconnu'}
                    titre = json.loads((d / 'plan.json').read_text()).get('titre') if (d / 'plan.json').exists() else None
                    titre = titre or st.get('nom') or 'Plan en cours de lecture'
                    # vignette : la première vue de la galerie (la pièce principale), pas la première par ordre alphabétique
                    ordre = [p_['id'] for p_ in json.loads((d / 'plan.json').read_text()).get('photos', []) if not p_.get('orbit')] if (d / 'plan.json').exists() else []
                    jpgs = sorted((d / 'photos').glob('*.jpg'), key=lambda f: next((i for i, n in enumerate(ordre) if f.stem.rsplit('-', 1)[0] == n), 99)) if (d / 'photos').exists() else []
                    photo = f'/plans/{quote(d.name)}/photos/{quote(jpgs[0].name)}' if jpgs else None
                    out.append({'id': d.name, 'titre': str(titre), 'statut': st.get('statut'), 'photo': photo})
                except Exception:
                    out.append({'id': d.name, 'titre': 'Plan', 'statut': 'inconnu', 'photo': None})
            return self.send_json(out)
        if p.startswith('/api/'):
            return self.send_json({'erreur': 'inconnu'}, 404)
        return super().do_GET()

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
        if n > (40_000_000 if p == '/api/depot' else 100_000):
            self.close_connection = True
            left = n if n < 300_000_000 else 0  # on lit le corps pour que le navigateur reçoive la réponse
            while left > 0:
                c = self.rfile.read(min(left, 1 << 20))
                if not c:
                    break
                left -= len(c)
            return self.send_json({'erreur': 'Fichier trop lourd (40 Mo maximum).'}, 413)
        body = self.rfile.read(n)
        if p == '/api/depot':
            return self.depot(body)
        pid = unquote(p.split('/')[-1])
        if not (re.fullmatch(r'[a-z0-9-]{1,40}', pid) and (PLANS / pid).is_dir()) or not p.startswith(('/api/relancer/', '/api/calibration/')):
            return self.send_json({'erreur': 'inconnu'}, 404)
        if p.startswith('/api/relancer/'):
            err, st = reserver(pid, lambda st: None if st.get('statut') == 'erreur' else 'Rien à relancer : ce plan n’est pas en erreur.',
                               statut='en_cours', message='Reprise…', technique_erreur=None)
            if err:
                return self.send_json({'erreur': err}, 409)
            step = st.get('etape') if st.get('etape') in ('analyse', 'lecture', 'controle', 'photos') else 'analyse'
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
        except Exception as err:
            traceback.print_exc()
            if d:
                shutil.rmtree(d, ignore_errors=True); liberer(pid)
            return self.send_json({'erreur': f'Enregistrement du fichier impossible ({technique(err)[:120]}).'}, 500)
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
            extract(d / st.get('pdf', 'source.pdf'), d, pid, K_force=K)
            ecarter_lecture(d)
        except SystemExit as e:
            liberer(pid); return self.send_json({'erreur': f'Plan illisible : {e}'}, 400)
        except Exception as e:  # le plan reste en attente : une autre cote peut réussir
            traceback.print_exc(); liberer(pid)
            return self.send_json({'erreur': f'Analyse impossible avec cette échelle : vérifiez les deux points et la longueur. Si cela persiste, les murs de ce plan ne sont pas reconnus ({technique(e)[:120]}).'}, 422)
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


if __name__ == '__main__':
    pip = {'pymupdf': 'pymupdf', 'PIL': 'pillow', 'numpy': 'numpy', 'shapely': 'shapely', 'cv2': 'opencv-python-headless'}
    manque = [v for k, v in pip.items() if importlib.util.find_spec(k) is None]
    if manque:
        sys.exit('Modules Python absents. Installez-les : pip3 install ' + ' '.join(manque))
    PLANS.mkdir(exist_ok=True)
    reprise_au_demarrage()
    atexit.register(arreter_tout)
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))  # arrêt propre : les Chrome des traitements sont arrêtés aussi
    print(f'Dépôt de plans : http://localhost:{PORT}/')
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
