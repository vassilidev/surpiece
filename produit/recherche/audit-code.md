# Audit du code : passage en SaaS multi-utilisateurs en ligne

Date : 27/09/2026. Audit en lecture seule du dépôt au commit `fdc073e` (arbre propre au moment de la lecture). Les numéros de ligne renvoient à ce commit ; un autre agent modifie `pipeline/` et `moteur/` en parallèle (duplex), ils peuvent donc bouger.

Fichiers lus : `pipeline/serveur.py`, `pipeline/accueil.html`, `pipeline/README.md`, `pipeline/lire.py` (appels IA, coûts, `appels-ia.json`, `rapport.json`), `moteur/ui.js`, `moteur/modele.html`, `moteur/photos.mjs`, `moteur/controle.mjs`, `moteur/engine.js` (messages d'échec seulement), `outils/finalise.sh`, `README.md`, `HISTORIQUE.md`, `CLAUDE.md`, `.gitignore`, `requirements.txt`, `.env.example`. Le `.env` n'a pas été ouvert. Les dossiers de `plans/` n'ont servi qu'à des mesures anonymes (taille, nombre et coût des appels) ; aucun plan n'est cité.

Légende : **[B]** bloquant pour la mise en ligne, **[A]** à adapter, **[R]** réutilisable tel quel ou presque.

---

## Synthèse

1. Aujourd'hui, le code est un **outil local mono-utilisateur**. Tout ce qui touche aux comptes est absent : pas de notion de propriétaire, liste globale de tous les plans, accès à toute visite par son URL, relance ou calibration du plan d'un autre possibles pour qui connaît l'identifiant.
2. **Trois failles sont à corriger avant toute exposition**, même en bêta fermée :
   - les petits serveurs statiques de `photos.mjs` et `controle.mjs` servent **toute la racine du dépôt, `.env` compris, sur toutes les interfaces réseau** pendant chaque rendu ;
   - `/api/plans` liste les plans de tout le monde ;
   - l'image du plan du promoteur est servie publiquement avec la visite.
3. **Le rendu Chrome ne tourne que sur Mac** (`--use-angle=metal`). Sur un serveur Linux, il faut soit un GPU avec d'autres options (Vulkan, à valider visuellement), soit le rendu logiciel SwiftShader, que Chrome réserve désormais à une activation explicite. La voie la moins risquée pour démarrer est de garder un Mac mini loué comme machine de rendu.
4. **Les coûts sont bien tracés par plan, mais rien ne les plafonne.** Il n'y a ni budget par compte ni limite de relances. Le plafond théorique d'une passe de lecture est d'environ 13 $, contre 1,10 à 1,85 $ mesurés.
5. **Des textes techniques ou destinés à l'IA atteignent l'utilisateur.** Exemples : `.env`, « Chrome sans écran », « Équipement 3 (shower) : … corrige le type », traces d'erreur. C'est contraire à la consigne « aucun texte technique montré ».
6. **Beaucoup de choses se réutilisent** : l'écran « chantier », la calibration au clic, la galerie façon annonce, la fiche, le journal des coûts, la reprise sans repayer (`reponse-ia.json`), la visite de contrôle et l'écriture atomique des états.
7. **Découpe cible** : web/API sans état, file de travaux en base, workers de lecture IA (limités par les entrées-sorties, nombreux en parallèle), workers de rendu Chrome (GPU, peu nombreux), stockage objet. L'ordre de grandeur est de 25 à 40 jours de travail hors paiement et tracking publicitaire (estimation, détail au § 4).

---

## 1. Bloquant pour la mise en ligne [B]

### B1. Aucune isolation entre comptes : liste globale des plans

- `pipeline/serveur.py:486-501` : `GET /api/plans` parcourt **tous** les dossiers de `plans/` et renvoie pour chacun l'identifiant, le titre, le statut et la première photo.
- `pipeline/accueil.html:115` et `:275-281` : la page d'accueil affiche cette liste (« Plans traités ») à tout visiteur.
- Conséquence en ligne : chaque visiteur voit les plans, titres et photos de tous les autres clients.
- À faire : une table `plans` avec `compte_id` en base, et une liste filtrée par compte authentifié. La section « Plans traités » devient « Mes plans ».

### B2. Aucun contrôle d'accès sur les visites, l'état et les actions

- `pipeline/serveur.py:406` et `:409-425` (`VISITE`, `servable`) : la liste blanche est bien faite contre la traversée de chemin. En revanche, **quiconque connaît `/plans/<id>/` accède à `index.html`, `plan.json`, aux photos, et aussi à `page.png`, `calibration.png` et `plan-<id>.png`**, qui sont des rendus du plan du promoteur (voir B7).
- `pipeline/serveur.py:479-485` : `GET /api/etat/<id>` renvoie **tout** `etat.json` à qui connaît l'identifiant, et ce fichier contient beaucoup :
  - le nom du fichier déposé (`nom`, ligne 570) ;
  - le coût (`technique.cout_eur`, ligne 271) ;
  - la qualification IA et son coût (`qualification`, `cout_qualif`, ligne 226) ;
  - l'échelle, la page et les messages techniques.
- `pipeline/serveur.py:528-539` : `POST /api/relancer/<id>` et `POST /api/calibration/<id>` agissent sur n'importe quel plan. Un tiers peut donc recalibrer le plan d'un client ou relancer une lecture payée par ce client (voir B8).
- À faire : chaque route `/api/*` vérifie que le plan appartient au compte. `etat.json` est réduit à une vue publique (étapes, pourcentage, message) avant envoi. Les fichiers de travail (sources, zooms, réponses IA) ne sont jamais servis ; seuls le sont les fichiers publiés d'une visite, et selon son mode de partage.

### B3. Identifiants devinables et bavards

- `pipeline/serveur.py:46-49` : l'identifiant est le nom du fichier normalisé (28 caractères) suivi de 8 caractères hexadécimaux, soit 32 bits d'aléa. Deux problèmes :
  - **le nom du fichier déposé finit dans l'URL partagée**, alors qu'il contient souvent le numéro de lot, le nom du programme, parfois celui de l'acquéreur ;
  - 32 bits suffisent contre le hasard mais pas comme seul secret d'un lien de partage.
- À faire : séparer l'identifiant interne (UUID en base) du **jeton de partage** (au moins 128 bits, révocable, avec expiration optionnelle), et ne jamais reprendre le nom du fichier dans une URL.

### B4. Serveur limité à localhost par construction

- `pipeline/serveur.py:444-447` (`hote_ok`) : l'en-tête Host doit valoir `localhost:PORT` ou `127.0.0.1:PORT`, sinon la réponse est une erreur 403.
- `pipeline/serveur.py:449-454` (`origine_ok`) : les POST ne sont acceptés que depuis ces deux origines.
- `pipeline/serveur.py:641` : le serveur écoute sur `127.0.0.1` uniquement.
- `pipeline/README.md:28` documente ce choix, qui est le bon en local (protection contre le DNS rebinding et la CSRF).
- En ligne, il faut une liste de domaines configurable, qui doit inclure **les domaines de marque blanche**. Il faut aussi une vraie protection CSRF, liée à la session d'authentification. L'en-tête `x-nom` exigé à `serveur.py:543` n'en tient lieu qu'en local.

### B5. `http.server` n'est pas un serveur de production

- `pipeline/serveur.py:11` et `:641` : `ThreadingHTTPServer`, soit un fil d'exécution par connexion, sans limite.
- La documentation Python l'écrit : « `http.server` is not recommended for production. It only implements basic security checks. » ([docs.python.org](https://docs.python.org/3/library/http.server.html), vérifié).
- Ce qui manque :
  - TLS ;
  - une limite de connexions ;
  - des délais de lecture, ce qui expose aux connexions lentes ;
  - des journaux (`log_message` est muet, lignes 432-433) ;
  - les en-têtes de sécurité (seul `nosniff` est envoyé, ligne 436).
- `pipeline/serveur.py:516-525` : le dépôt lit jusqu'à 40 Mo **en mémoire** dans le processus web.
- À faire : un framework web Python (FastAPI ou Django, par exemple) derrière un proxy TLS. Le fichier est envoyé directement au stockage objet par URL signée, jamais à travers le processus web.

### B6. Les serveurs statiques des scripts Chrome exposent tout le dépôt, `.env` compris

- `moteur/photos.mjs:19-23` et `moteur/controle.mjs:17-22` : `http.createServer(...).listen(0)` sert **n'importe quel fichier sous la racine du dépôt**. La seule garde est `f.startsWith(root)`, ce qui inclut `.env`, `plans/` (tous les clients) et `references/`.
- Sans hôte précisé, Node écoute sur toutes les interfaces : « If host is omitted, the server will accept connections on the unspecified IPv6 address (::) when IPv6 is available, or the unspecified IPv4 address (0.0.0.0) otherwise. » ([nodejs.org](https://nodejs.org/api/net.html), vérifié).
- Pendant chaque contrôle et chaque séance photo, une machine du même réseau qui trouve le port peut donc lire `/.env`. **C'est déjà un risque en local** (Wi-Fi partagé), et c'est rédhibitoire sur un serveur.
- À faire, dans ces deux fichiers : écouter sur `127.0.0.1` et ne servir que `plans/<id>/` et `moteur/`. À terme, dans le worker de rendu, n'y déposer que les fichiers du plan à rendre.

### B7. Le plan du promoteur est publié avec la visite

- `pipeline/serveur.py:406` : `plan-[a-z0-9-]+.png`, `page.png` et `calibration.png` sont servis.
- `moteur/ui.js:287` et `:527` : l'option « Plan 2D : superposer le plan du promoteur » affiche cette image dans la visite (`plan.json` → `underlay`, `pipeline/lire.py:1042`).
- `CLAUDE.md` : « Les plans des promoteurs […] ne sont jamais versionnés ni publiés sans accord. » Or un lien de visite envoyé à un prospect par un conseiller, ou intégré sur un site, publie ce plan.
- Point juridique : les plans d'architecture sont des œuvres protégées, art. L112-2 12° du Code de la propriété intellectuelle : « Les plans, croquis et ouvrages plastiques relatifs à la géographie, à la topographie, à l'architecture et aux sciences » ([legifrance.gouv.fr](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278875), vérifié). L'analyse juridique précise n'a pas été faite ici.
- À faire : superposition réservée au propriétaire du plan (page privée), retirée des liens publics et des intégrations, sauf accord du promoteur (cible 3).

### B8. Coûts IA sans plafond

- Aucun budget par compte, par plan ou global dans le code. La seule limite est `len(RUNNING) >= 6` (`serveur.py:553-556`), qui porte sur le nombre de plans simultanés et non sur l'argent.
- **Relances illimitées** (`serveur.py:531-538`). Quand l'erreur survient avant qu'une réponse exploitable soit gardée (`reponse-ia.json`), chaque « Relancer » **repaie une lecture complète**. C'est le cas par exemple pour « Réponse tronquée » (`lire.py:165-166` et `:184-185`) ou pour une réponse illisible déplacée en `reponse-brute.illisible.txt` (`lire.py:1229`). Combiné à B2, un tiers peut déclencher ces dépenses.
- Nombre d'appels possibles par passe (`lire.py:1185-1276`) :

  | Appel | Ligne | Fois | `max_tokens` |
  |---|---|---|---|
  | Qualification | `serveur.py:220-223` | 1 | 4 000 |
  | Lecture | `lire.py:1220` | 1 | 100 000 |
  | Réparation du JSON | `lire.py:1224-1225` | 1 | 30 000 |
  | Corrections | `lire.py:1237-1243` | 2 | 100 000 |
  | Relecture | `lire.py:575` | 1 | 60 000 |
  | Arbitrages | `lire.py:616` (au plus 8 duels), `:651` | 2 par duel, soit 16 au plus | 4 000 |

- **Plafond théorique** : environ **13 $** par passe, en comptant chaque réponse au maximum de `max_tokens` au tarif codé de 25 $ par million de jetons en sortie (`lire.py:19`), plus les entrées (images et historique des corrections). C'est un calcul, non une observation.
- **Mesuré** sur les 4 plans lus du dossier `plans/` : 3 à 9 appels, 1,20 à 1,85 $ par plan, 502 à 821 s d'attente API cumulée, un appel isolé à 1,37 $ au plus (lecture de `appels-ia.json`).
- Tarif codé : Opus 5 à 5 $ / 25 $ par million de jetons (entrée / sortie), Opus 5.5 à 4 $ / 20 $ (`lire.py:19`). Ces tarifs correspondent à ceux qu'affichent les résultats de recherche pour les pages OpenRouter ([Opus 5](https://openrouter.ai/anthropic/claude-opus-5), [Opus 5.5](https://openrouter.ai/anthropic/claude-opus-5.5)) ; la lecture automatique de la page Opus 5 n'a pas affiché le prix, donc vérification partielle.
- À faire :
  - un budget par plan : arrêt au-delà de N $ avec message « on revient vers vous » ;
  - un nombre maximal de relances payantes, par exemple 1, puis reprise par l'équipe ;
  - un budget par compte ;
  - un plafond global côté fournisseur. OpenRouter permet de créer des clés avec `limit` et `limit_reset` (quotidien, hebdomadaire, mensuel), et une clé à court de crédit est refusée avant l'appel au fournisseur ([openrouter.ai/docs](https://openrouter.ai/docs/features/provisioning-api-keys), vérifié pour `limit` et `limit_reset`). Une clé par environnement, voire par gros client, borne donc le risque.

### B9. Textes techniques ou destinés à l'IA montrés à l'utilisateur

C'est contraire à la consigne « aucun texte technique montré à l'utilisateur » de `CLAUDE.md`. Voici ce qui atteint l'écran.

**Détail technique sous le message d'erreur** (`accueil.html:97` et `:205`) :
- `technique_erreur` provient de `serveur.py:100-103`, qui garde type d'exception et message, 800 caractères au plus ;
- il est alimenté par `serveur.py:108`, `:318-319` (la liste des problèmes du contrôle, ex. « On voit dehors par une fente dans « Séjour » (1.23 ; 4.56) ») et `:382` (texte de n'importe quelle exception, y compris `OpenRouter a répondu 500. {json}` venant de `lire.py:137-139`, ou la fin de la sortie d'erreur de Node, `serveur.py:310` et `:335`).

**Messages destinés à l'exploitant** :
- `serveur.py:247` : « ajoutez ANTHROPIC_API_KEY […] dans le fichier .env » ;
- `:345` : « module « x » absent (voir pipeline/README.md) » ;
- `:348` : « Clé API refusée : vérifiez-la dans le fichier .env » ;
- `:350` : « Crédit API insuffisant : rechargez le compte » ;
- `:358` : « (Chrome sans écran) ».

**Avertissements écrits pour l'IA** qui remontent tels quels dans la liste `#warns` (`serveur.py:271`, affichage `accueil.html:201`) :
- `lire.py:741` et `:743` : « Équipement 3 (wc) : … Retrouve-le sur le plan et corrige sa position. » ;
- `lire.py:750` : « Équipement 2 (shower) : … Regarde le symbole […] et corrige le type » ;
- `serveur.py:228` : « Qualification impossible : RuntimeError … ».

**Erreurs affichées dans la visite** :
- `moteur/ui.js:363` et `:366` : « ce dossier doit contenir un fichier plan.json », « Ce plan.json est hors format (message) » ;
- `ui.js:389` : « Erreur de l'interface : » suivi du message JavaScript ;
- `ui.js:724` : « Le moteur 3D (three.js, via cdn.jsdelivr.net) ne s'est pas chargé » ;
- `moteur/engine.js:1362` : « Erreur : » suivi du message.

**Titre et cartouche par défaut** : sans titre fourni par l'IA, `lire.py:1167-1168` prend l'identifiant technique (« Logement xxx-6e1a90c9 »), repris au cartouche et au chargement (`ui.js:247`, `:325`).

À faire :
- un catalogue de messages pour l'utilisateur, par cause ;
- le détail technique envoyé au journal et à l'alerte de l'exploitant, jamais à l'écran ;
- un contrôle automatique qui échoue si un message affiché contient `.env`, `Error`, `json`, un identifiant ou une coordonnée. C'est la règle du projet : un défaut trouvé devient un contrôle.

> **En partie traité le 27/09/2026 dans l'outil local** : la page de dépôt ne montre plus le détail technique (`technique_erreur` seulement avec `?debug=1`), et un filtre automatique des textes techniques (`masquer`, `montrable`) passe à chaque écriture d'`etat.json` dans `serveur.py`. Il laisse encore passer des messages qui citent « .env » ou « API », un type anglais entre parenthèses et les textes du moteur. Restent à faire : le contrôle des textes (L1-04), le retrait des textes (L1-05, « En cours ») et, en service, le catalogue de messages (L4-05). Numéros de ligne ci-dessus : ceux du commit `fdc073e`.

### B10. Configuration globale au processus, rechargement de modules à chaud

- `serveur.py:28-40` (`load_env`) réécrit `os.environ` avant chaque étape IA. `lire.py:18`, `:94-104`, `:109`, `:127` et `:575` lisent modèle, fournisseur, effort et clé dans les variables d'environnement.
- Conséquence : **impossible d'avoir des réglages par compte** (personnalisation des prompts ou de l'effort pour les pros, clé propre à un promoteur) sans passer un objet de configuration à `read_plan` → `call`.
- Les prompts sont des constantes de module : `SYSTEM` (`lire.py:223`), `RELECTURE` (`:551`), `ARBITRE` (`:585`).
- `serveur.py:251` et `:299` : `importlib.reload(lire.murs); importlib.reload(lire.apercu); importlib.reload(lire)` à chaque lecture et chaque contrôle. Pratique en développement, mais **le rechargement d'un module pendant qu'un autre plan l'utilise dans un autre fil est une course**. À retirer en production : le worker redémarre au déploiement.

### B11. Rendu Chrome configuré pour macOS

- `moteur/photos.mjs:28` et `moteur/controle.mjs:25` : `--use-angle=metal` (Metal n'existe que sur macOS), `--enable-gpu` et `--ignore-gpu-blocklist`. `CLAUDE.md` le documente aussi.
- **Sur Linux avec GPU NVIDIA**, Google recommande pour Chrome sans écran : `--headless=new --use-angle=vulkan --enable-features=Vulkan --disable-vulkan-surface --enable-unsafe-webgpu` et `--no-sandbox`, plus des pilotes Vulkan compatibles ([developer.chrome.com](https://developer.chrome.com/blog/supercharge-web-ai-testing), vérifié). Le rendu devra être revalidé : exposition, ombres, GTAO, « zéro défaut visible ».
- **Sans GPU**, il reste SwiftShader (rendu logiciel). Chromium a déprécié le repli automatique à partir de Chrome 130 ; il faut `--enable-unsafe-swiftshader`, et Chromium précise que cet usage n'est pas destiné à du contenu non fiable ([chromestatus.com](https://chromestatus.com/feature/5166674414927872), [groupe blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM), vérifiés par recherche). Les temps de rendu sur processeur n'ont **pas été mesurés** : 1 min 40 pour 11 photos sur Mac avec GPU (`HISTORIQUE.md:9`), vraisemblablement beaucoup plus en logiciel.
- **Option pragmatique** : garder un Mac comme worker de rendu, ce qui ne change rien au code de rendu. Scaleway loue des Mac mini M4 à Paris entre 149 et 199 € par mois (0,22 à 0,29 € de l'heure), avec une durée minimale de 24 h ([scaleway.com/pricing](https://www.scaleway.com/en/pricing/apple-silicon/), [scaleway.com/mac-mini-m4](https://www.scaleway.com/en/mac-mini-m4/), vérifiés). À comparer au plus petit GPU Scaleway, L4-1-24G, à 0,79 € de l'heure, soit environ 575 € par mois s'il tourne en continu ([scaleway.com/pricing/gpu](https://www.scaleway.com/en/pricing/gpu/), vérifié).
- Autres points : `README.md:11` et `photos.mjs:14-15` exigent un `npm install -g puppeteer` global résolu via `npm root -g`. À remplacer par une dépendance figée dans l'image du worker. Puppeteer 24.41.0 est installé ici ; aucune option ANGLE n'est ajoutée par défaut dans sa version installée (`ChromeLauncher.js`, lu localement).

---

## 2. À adapter [A]

### A1. File d'attente et parallélisme

- `serveur.py:23` (`RUNNING`), `:24` (`SLOTS`, 2 par défaut via `PLAN_PARALLELE`), `:553-556` (6 plans au plus), `:369-371` (attente bloquante sur le sémaphore), `:537`, `:576` et `:613` (un fil de fond par plan).
- Tout est en mémoire d'un seul processus. Pas de multi-machines, pas de priorité (un abonnement pro ou un import promoteur passent derrière tout le monde), pas d'équité (un compte peut occuper les 6 places).
- **Un même créneau couvre la lecture IA (8 à 14 min d'attente réseau) et Chrome (GPU)** : deux lectures en cours bloquent tout rendu. Il faut deux files distinctes, lecture (large) et rendu (étroite).
- `reserver` (`serveur.py:389-398`) garantit « jamais deux traitements du même plan ». Cette règle est à garder, mais en base (verrou de ligne, `SELECT … FOR UPDATE SKIP LOCKED`, ou file de type Redis).
- Import d'un programme entier (cible 3) : il faut un traitement par lots, avec une file de basse priorité et un plafond de coût par lot.

### A2. Reprise après redémarrage, relance, nouvelles tentatives

- `serveur.py:617-622` : au démarrage, tout plan « en cours » passe en « erreur », avec un bouton Relancer. Les plans **en attente** dans `SLOTS.acquire()` sont perdus de la même façon. Aucune reprise automatique.
- `lire.py:134-139` : côté OpenRouter, **aucune nouvelle tentative** sur 429 ou 5xx. L'utilisateur lit « Relancez dans une minute » (`serveur.py:353`). Le SDK Anthropic, lui, a ses propres tentatives (comportement par défaut du SDK, non vérifié ici).
- `serveur.py:300-306` : jusqu'à 6 passages de contrôle, chacun avec un délai de 15 min. `analyse` (`serveur.py:132-184`) n'a **aucun délai** : un PDF pathologique bloque un créneau indéfiniment. La calibration relance `extract()` **dans le fil de la requête HTTP** (`serveur.py:604-605`).
- À faire : des étapes idempotentes, avec nouvelles tentatives automatiques et pauses croissantes pour les erreurs passagères (429, 5xx, réseau), des délais par étape, et une reprise automatique au redémarrage du worker. Les étapes s'y prêtent déjà : la lecture gardée n'est pas repayée (`lire.py:1213-1215`), la réponse brute est relue (`:1217-1218`).

### A3. Stockage des fichiers sur disque local

- `serveur.py:16` (`PLANS`) et `:74-97` (`etat.json` comme base d'état), `lire.py:951-954` (écriture atomique). Un dossier par plan, avec la source, les fichiers intermédiaires, la visite et les photos.
- Mesures sur les 5 dossiers présents : 1,1 à 4,4 Mo par plan, dont 0,75 à 1,3 Mo de photos, 15 à 39 fichiers. Soit environ 4 Go pour 1 000 plans : le volume n'est pas un sujet, l'organisation si.
- `serveur.py:296` et `:325` copient `moteur/modele.html` dans chaque plan ; `modele.html:12`, `:24` et `:25` chargent `../../moteur/…` en relatif. **Toutes les visites dépendent donc du moteur courant** : une mise à jour du moteur change, voire casse, les visites déjà livrées. Il faut un moteur versionné (`/moteur/v3/…`), une visite qui pointe vers sa version, et le rejeu d'anciennes visites comme test de non-régression (`outils/finalise.sh` le permet déjà).
- À faire :
  - l'état en base ;
  - des fichiers en stockage objet compatible S3, de préférence hébergé en UE, en séparant un espace privé (source, intermédiaires, réponses IA) d'un espace publié (visite, `plan.json`, photos) ;
  - un CDN devant l'espace publié ;
  - une durée de conservation des sources (données personnelles, plans promoteurs).

### A4. Notifications

- `accueil.html:93` promet : « Vous pouvez fermer cet onglet ou faire autre chose, on vous prévient. » **C'est faux si l'onglet est fermé.** La notification dépend du suivi en cours (`accueil.html:178`, toutes les 1,5 s) et de l'API Notification (`:136-144`), qui ne fonctionne que page ouverte.
- L'API Notification n'existe que dans un contexte sécurisé, en HTTPS ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notification), vérifié). Sur iOS, le Web Push n'est proposé qu'aux applications web ajoutées à l'écran d'accueil ([webkit.org](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), vérifié).
- À faire : un e-mail transactionnel pour visite prête, cote demandée et échec, envoyé côté serveur. Le texte de la ligne 93 doit être corrigé dès maintenant. Le suivi toutes les 1,5 s peut rester, ou passer en flux serveur (SSE).

### A5. Dépendances à des CDN tiers

- `moteur/modele.html:13-20` : three.js 0.180.0, three-mesh-bvh 0.9.1 et three-gpu-pathtracer 0.0.24 via `cdn.jsdelivr.net`. Les versions sont bien figées, mais :
  1. les workers de rendu (`photos.mjs:32`, `controle.mjs:30`) téléchargent three.js à chaque rendu, ce qui impose un accès sortant et fait d'une panne du CDN une panne de production ;
  2. la marque blanche et une politique de sécurité de contenu (CSP) stricte demandent de tout servir soi-même.
- `moteur/modele.html:9-11` et `pipeline/accueil.html:8-9` : Google Fonts chargées depuis Google. Le tribunal régional de Munich (LG München I, 20/01/2022, 3 O 17493/20) a jugé que transmettre l'adresse IP à Google sans consentement en chargeant Google Fonts à distance violait le RGPD ([dejure.org](https://dejure.org/dienste/vernetzung/rechtsprechung?Text=3+O+17493/20), [activemind.legal](https://www.activemind.legal/de/guides/urteil-webfonts/), vérifié par recherche). Il s'agit d'une décision allemande ; la position de la CNIL n'a pas été vérifiée ici.
- À faire : copier three.js, les modules additionnels et les polices dans `moteur/vendor/` avec une intégrité vérifiée, puis retirer le texte technique de `ui.js:724`.

### A6. Mentions « non contractuel »

- Une seule occurrence : `lire.py:1169`, via `setdefault('note', "Images de synthèse calculées automatiquement à partir du plan de vente. Logement vide, finitions supposées. Non contractuel.")`. Elle n'est affichée que dans la colonne de la galerie (`ui.js:318`).
- Rien sur les **photos JPEG** (`photos.mjs:93` écrit l'image brute), rien dans la fiche (`ui.js:326-350`), sur le plan 2D, dans la visite à la première personne, dans la maquette ou sur la page d'accueil.
- Pour les liens envoyés à des prospects (cible 2) et les intégrations promoteurs (cible 3), les photos circuleront seules. Il faut une mention incrustée dans chaque photo, une mention permanente discrète dans la visite, et une ligne dans la fiche. Il s'agit d'une recommandation de prudence ; l'obligation légale précise n'a pas été vérifiée.

### A7. Suivi des coûts

Ce qui existe est bon :
- chaque appel est journalisé avec fournisseur, modèle, effort, jetons, coût et durée (`lire.py:162-164` pour OpenRouter, qui prend `usage.cost` s'il est fourni ; `lire.py:180-181` pour Anthropic, estimé depuis `PRIX`) ;
- le cumul survit aux relances (`appels-ia.json`, `lire.py:1189-1190` et `:1274-1276`) ;
- le total en $ et en € figure dans `rapport.json` (`lire.py:1289-1291`).

Ce qui manque ou fuit :
- le coût de la **qualification** est rangé dans `etat.json` (`serveur.py:226`) et **absent du total** de `rapport.json` ;
- `ecarter_lecture` (`serveur.py:201-207`) déplace `appels-ia.json` après une nouvelle calibration : **le cumul repart de zéro** ;
- avec OpenRouter, une erreur au milieu du flux (`lire.py:152-153`) ou une coupure réseau lève une exception **avant** `log.append` (`:163`) : l'appel éventuellement facturé n'est pas compté ;
- taux de change figé : `EUR = 0.9` (`lire.py:20`) ;
- le coût est exposé au client dans `/api/etat` (`serveur.py:271`, clé `technique`).

À faire : une table `appels_ia` (plan, compte, coût, statut), un rapprochement mensuel avec la facture OpenRouter, un tableau de bord de marge par offre, et le budget de B8.

### A8. Personnalisation et marque blanche

- Prompts et réglages : voir B10. Il faut une configuration par compte (modèle, effort, consignes supplémentaires ajoutées au prompt), versionnée, et mesurée avec `pipeline/evaluer.py` avant d'être proposée.
- Thème :
  - les couleurs sont déjà des variables CSS (`accueil.html:11-13`, `moteur/visite.css:1-14`) ;
  - les titres sont écrits en dur (« Plan en visite 3D », `accueil.html:6` ; « Visite 3D · », `ui.js:367`) ;
  - il n'y a pas d'emplacement de logo.
- Intégration sur le site d'un promoteur : aucune directive `frame-ancestors` ni `X-Frame-Options`. N'importe quel site peut donc intégrer une visite en iframe. Il faut une liste de domaines autorisés par client.

### A9. Offre « 1 crédit gratuit, génération simple sans la visite »

- La partie coûteuse est la **lecture IA** (1,10 à 1,85 $), indispensable à tous les niveaux d'offre. Le contrôle et les photos passent aussi par le moteur 3D. Retirer la visite ne réduit donc presque rien du coût : c'est un **verrou d'interface** (masquer le mode « Visite », `ui.js:252-254`, et le bouton `g-cta`, `ui.js:316`), pas une économie. *Tranché depuis (arbitrage R4, 27/09/2026) : le verrou de l'offre gratuite est côté serveur, ni le moteur ni `plan.json` ne sont envoyés à la page d'aperçu (`OFFRES.md` § 2.2).*
- Le drapeau `D.simple` (`ui.js:261`, `:387`, `:632`) masque déjà les réglages de soleil et de brise-soleil, et peut servir de base.
- Chaque crédit offert coûte donc environ 1 à 2 $ de lecture, plus le rendu. D'où l'importance d'une qualification bon marché avant la lecture (`serveur.py:210-239`, environ 0,02 $ mesuré), étendue aux PDF.

### A10. Dépôt, contrôles d'entrée, limites

- Bien fait : format reconnu aux premiers octets (`serveur.py:52-64`), refus motivés (`:139-178`), limite de 40 Mo (`:516`, `accueil.html:170`).
- À ajouter : limite de débit par compte et par IP ; analyse des PDF non fiables dans un worker isolé, avec limites de mémoire et de temps (pymupdf et opencv tournent aujourd'hui dans le processus web, `serveur.py:141-170`) ; conservation et suppression des sources.

### A11. Journaux, supervision

- `serveur.py:432-433` coupe les journaux d'accès ; les erreurs partent en `traceback.print_exc()` sur la sortie standard (`:380`, `:572`, `:610`).
- Il faut des journaux structurés par plan et par compte, des alertes pour les clés refusées, le crédit épuisé ou un taux d'échec anormal, et des métriques de durée par étape.

### A12. Données envoyées à l'IA

- Les images du plan, qui peuvent porter des noms en cartouche, partent chez OpenRouter (`lire.py:124-127`).
- OpenRouter ne conserve pas les prompts sauf activation de la journalisation. Il permet aussi d'imposer la « Zero Data Retention » par requête (`provider.zdr: true`) ou pour tout le compte ([openrouter.ai/docs](https://openrouter.ai/docs/features/zdr), vérifié).
- À faire : l'imposer dans le corps de la requête (`lire.py:124`), puis le mentionner dans les CGU et le registre RGPD, OpenRouter et le fournisseur du modèle étant sous-traitants.

### A13. Reproductibilité des installations

- `requirements.txt:1-7` : aucune version figée, sauf `shapely>=2.1`. Puppeteer est global et non figé (`README.md:11`).
- Pour déployer des workers identiques : versions figées, une image par type de worker, et un test de non-régression visuel sur les plans de référence (`references/`) à chaque mise à jour.

### A14. `outils/finalise.sh`

- C'est un outil de développement : il suppose un poste local, écrit dans `/tmp/controle_$id.json` (ligne 15) et appelle `lire` en ligne de commande.
- Sa logique est précieuse en service : réassembler sans IA (lignes 7-10), contrôler et réparer (11-19), refaire les photos (20). Elle deviendra une **action d'administration « rejouer sans repayer »**, utile au support et aux mises à jour du moteur.

---

## 3. Réutilisable tel quel ou presque [R]

| Élément | Où | Remarque |
|---|---|---|
| Écran de progression « chantier » | `accueil.html:121-152` (phrases calées sur le pourcentage), `:152` (barre lissée qui ne recule jamais), `:184-188` (étapes) ; côté serveur, avancée pendant la réflexion du modèle, `serveur.py:254-262` | Reprendre tel quel. Seul le mécanisme de suivi change (état en base au lieu de `etat.json`). |
| Calibration au clic | `accueil.html:216-269`, `serveur.py:579-614` | Gère la détection des centimètres saisis à la place des mètres, les points trop proches, les points hors image, et la mise de côté des lectures faites à l'ancienne échelle. La validation passera en tâche de worker (A2). |
| Galerie façon annonce | `ui.js:303-323` (grande image, vignettes, visionneuse, surfaces), `:676-711` (navigation, clavier, préchargement) | Base directe pour les liens envoyés aux prospects (cible 2). |
| Bouton `g-cta` « Lancer la visite 3D » | `ui.js:316`, `:716` (activé au chargement, pourcentage de chargement), `:706` | Reprendre tel quel ; point d'accroche naturel du verrou de l'offre gratuite (A9). |
| Fiche du logement | `ui.js:326-350` : surfaces du plan de vente, sections avec drapeaux Plan / À vérifier / Hypothèse, « Points à faire confirmer » (prompt `lire.py:239`) | Contenu utile à l'acquéreur. Ajouter la mention non contractuelle (A6). |
| Contrôle de qualité avant publication | `moteur/controle.mjs` (pièces accessibles, portes franchissables, étanchéité, baies, vues), `lire.repare_moteur` (`lire.py:881`), blocage `serveur.py:318-320` | Garde-fou central de la promesse « zéro défaut visible ». Ne changent que les options Chrome et le serveur statique (B6, B11). |
| Photos automatiques | `moteur/photos.mjs` (exposition réglée sur l'histogramme, rejet des vues sans intérêt ligne 92) | Idem. |
| Reprise sans repayer | `lire.py:1204-1236` (`reponse-ia.json`, réponse brute relue, réponse rejetée écartée), `outils/finalise.sh` | Indispensable au support et aux montées de version du moteur. |
| Journal des coûts par appel | `lire.py:162-164`, `:180-181`, `:1189-1191`, `:1274-1276` | Base de la facturation interne et du suivi de marge (A7). |
| Écritures atomiques | `serveur.py:95-96`, `lire.py:951-954` | Même principe à garder en stockage objet (écrire, puis publier). |
| Arrêt des processus Chrome | `serveur.py:276-290` (groupe de processus tué avec le traitement) | À garder dans le worker de rendu. |
| Refus motivés et messages clairs | `serveur.py:139-178` (format, image trop petite, PDF protégé ou vide, HEIC) | Déjà écrits pour l'utilisateur, sans jargon. |
| Liste blanche de fichiers servis | `serveur.py:406-425` | Même logique pour l'espace publié : tout est interdit sauf ce qui est nommé. |
| Mesure de qualité | `pipeline/evaluer.py`, `references/` | Test de non-régression à chaque changement de prompt, de modèle ou de réglage pro. |
| Thème clair et sombre en variables CSS | `accueil.html:11-13`, `visite.css:1-14` | Base de la marque blanche. |

---

## 4. Découpe en services : estimation honnête

### 4.1 Cible

```
navigateur ──HTTPS──> web/API (sans état) ──> base Postgres (comptes, plans, travaux, appels IA, crédits, partages)
      │                    │                         ▲
      │ envoi direct       │ met en file             │ état, coûts
      ▼ (URL signée)       ▼                         │
 stockage objet <──── worker « lecture » (Python) ───┤  analyse sans IA, qualification, lecture et relecture IA,
 (privé / publié)          │                         │  murs, complément ; attente réseau, forte concurrence
      ▲                    ▼                         │
      └────────────── worker « rendu » (Node + Chrome GPU) ─┘  contrôle, réparation, photos ; GPU, faible concurrence
                           │
 CDN ──> espace publié (visite versionnée, plan.json, photos) ; e-mails transactionnels ; supervision
```

| Service | Code d'aujourd'hui | Ressource | Dimensionnement (estimation) | Incertitudes |
|---|---|---|---|---|
| **Web/API** | `serveur.py` (routes), `accueil.html` | Petit processeur, sans état | 1 petite instance suffit en bêta ; aucun calcul lourd dedans (A10) | Choix du framework et de l'hébergement Python, non tranchés |
| **File et état** | `RUNNING`, `SLOTS`, `etat.json` | Postgres (file sur table avec `SKIP LOCKED`) ou Redis | Un seul Postgres géré couvre la file, l'état et les coûts en bêta | — |
| **Worker lecture** | `analyse`, `qualifier`, `lecture` (`serveur.py`), `extract.py`, `lire.py`, `murs.py`, `apercu.py` | Surtout de l'attente réseau (8 à 14 min par plan), avec des pics processeur (pymupdf, opencv, shapely, PIL) | Une instance de 2 à 4 vCPU peut mener une dizaine de lectures en parallèle si l'attente est asynchrone ou en fils séparés. La limite réelle vient du budget et des limites de débit OpenRouter | Pics de mémoire d'opencv sur de grandes images non mesurés |
| **Worker rendu** | `controle.mjs`, `photos.mjs`, `repare_moteur` | GPU | Environ 2 à 5 min par plan sur un Mac avec GPU (photos : 1 min 40 pour 11 vues, `HISTORIQUE.md:9`, plus 1 à 6 passages de contrôle), soit de l'ordre de 12 à 30 plans par heure et par Chrome, une seule instance à la fois conseillée pour commencer | **Non mesuré sur serveur.** Mac mini M4 (149 à 199 € par mois, sans changement de code) ou GPU L4 (environ 575 € par mois en continu, options Vulkan à valider) ; SwiftShader déconseillé (B11) |
| **Stockage** | `plans/<id>/` | Stockage objet S3 en UE avec CDN | 1 à 4,5 Mo par plan mesurés, soit environ 4 Go pour 1 000 plans | Politique de conservation des sources à définir |
| **Notifications** | `Notification` dans le navigateur | Service d'e-mail transactionnel | Faible volume | — |
| **Administration** | `finalise.sh`, `evaluer.py` | Dans web/API | Rejouer sans repayer, voir les coûts, rembourser un crédit | — |

### 4.2 Ordre conseillé et charge (ordre de grandeur, une personne, hors paiement, tracking et auth externe)

1. **Sécurité immédiate, même en local** (1 à 2 j) :
   - B6 : serveurs statiques des scripts Chrome limités à `127.0.0.1` et à une liste blanche ;
   - texte de `accueil.html:93` ;
   - retrait des textes techniques visibles et contrôle automatique associé (B9) ;
   - identifiants sans nom de fichier (B3).

   Ces points touchent `moteur/` et `pipeline/` : à coordonner avec l'agent qui y travaille.
2. **Socle en ligne** (8 à 12 j) :
   - web/API avec framework ;
   - comptes (Auth0 ou autre : l'audit ne dépend pas de ce choix, il faut seulement un `compte_id` sur chaque plan) ;
   - Postgres ;
   - stockage objet et envoi direct ;
   - contrôle d'accès et jetons de partage (B1 à B5, B7).
3. **Workers et file** (4 à 6 j) :
   - découpe de `run()` en tâches idempotentes ;
   - nouvelles tentatives et délais ;
   - configuration par compte au lieu de l'environnement, sans rechargement à chaud (B10, A1, A2) ;
   - budgets et plafond de relances (B8).
4. **Rendu hors du poste** (3 à 5 j, plus une validation visuelle) :
   - Mac mini loué, ou GPU Linux avec options Vulkan ;
   - three.js et polices servis localement ;
   - moteur versionné (B11, A3, A5).
5. **Finitions produit** (5 à 8 j) :
   - e-mails ;
   - mention non contractuelle sur les photos ;
   - liens prospects, intégration iframe limitée aux domaines déclarés, marque blanche ;
   - administration « rejouer » et tableau des coûts (A4, A6, A7, A8, A14).

Total : **environ 21 à 33 jours**. Avec une marge d'imprévu de 20 %, on arrive aux **25 à 40 jours** annoncés. Ce chiffrage n'est pas mesuré : il suppose le code actuel stable et ne compte ni le paiement (crédits, abonnements), ni le tracking publicitaire (Meta CAPI, Google), ni la mesure d'audience (Umami), ni l'import par lots des promoteurs au-delà d'une file de basse priorité.

---

## Sources externes

| Fait | Source | Statut |
|---|---|---|
| `http.server` déconseillé en production | https://docs.python.org/3/library/http.server.html | vérifié |
| Node écoute sur `::` ou `0.0.0.0` sans hôte | https://nodejs.org/api/net.html | vérifié |
| Options GPU de Chrome sans écran sous Linux (Vulkan) | https://developer.chrome.com/blog/supercharge-web-ai-testing | vérifié |
| Repli SwiftShader déprécié, `--enable-unsafe-swiftshader` | https://chromestatus.com/feature/5166674414927872 ; https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM | vérifié par résultats de recherche, pages non relues en entier |
| Tarifs Opus 5 (5 $ / 25 $) et Opus 5.5 (4 $ / 20 $) sur OpenRouter | https://openrouter.ai/anthropic/claude-opus-5 ; https://openrouter.ai/anthropic/claude-opus-5.5 | partiel : résultats de recherche, la page Opus 5 n'a pas affiché le prix à la lecture automatique |
| Clés OpenRouter avec `limit` et `limit_reset` | https://openrouter.ai/docs/features/provisioning-api-keys | vérifié |
| Blocage avant appel au fournisseur quand la limite est atteinte | https://openrouter.zendesk.com/hc/en-us/articles/51680687417499 | non relu directement, cité d'après un résultat de recherche |
| Zero Data Retention sur OpenRouter | https://openrouter.ai/docs/features/zdr | vérifié |
| API Notification réservée à HTTPS | https://developer.mozilla.org/en-US/docs/Web/API/Notification | vérifié |
| Web Push iOS réservé aux applications web sur l'écran d'accueil | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | vérifié |
| Plans d'architecture protégés (CPI L112-2 12°) | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278875 | vérifié |
| Google Fonts et RGPD (LG München I, 20/01/2022) | https://dejure.org/dienste/vernetzung/rechtsprechung?Text=3+O+17493/20 ; https://www.activemind.legal/de/guides/urteil-webfonts/ | vérifié par recherche ; position CNIL non vérifiée |
| Mac mini M4 Scaleway : 149 à 199 € par mois, Paris, 24 h minimum | https://www.scaleway.com/en/pricing/apple-silicon/ ; https://www.scaleway.com/en/mac-mini-m4/ | vérifié (la durée minimale vient de la page produit) |
| GPU L4-1-24G Scaleway à 0,79 € de l'heure | https://www.scaleway.com/en/pricing/gpu/ | vérifié |
