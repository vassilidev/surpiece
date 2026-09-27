# L1-01 · URGENT : fermer la fuite du .env par les scripts Chrome

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | S (jusqu'à 1 j) | — | `moteur/` [M] | À faire |

## Pourquoi
Pendant chaque visite de contrôle et chaque séance photo, `moteur/controle.mjs` et `moteur/photos.mjs` lancent un petit serveur HTTP qui sert **n'importe quel fichier sous la racine du dépôt** (`.env`, tous les dossiers de `plans/`, `references/`), et Node l'ouvre sur **toutes les interfaces réseau** faute d'hôte précisé. Une machine du même Wi-Fi qui trouve le port peut lire la clé API. Le risque existe déjà en local ; il est rédhibitoire sur un serveur (audit B6, correctif M0.3). En plus, Chrome hérite aujourd'hui des clés API : `enfant` (`pipeline/serveur.py`) lance node sans réduire l'environnement, et puppeteer transmet cet environnement à Chrome, qui affiche des textes issus du plan (ARCHITECTURE.md § 6.7 : Chrome lancé sans variable secrète).

## À faire
1. **Créer `moteur/chrome.mjs`** (nouveau fichier, règle « ajouter plutôt que modifier » d'ARCHITECTURE.md § 8.1) avec deux fonctions pour l'instant, le serveur ci-dessous, par exemple `serveurStatique(root, dir)`, et le filtre de l'étape 2 :
   - écoute sur `127.0.0.1` uniquement (`listen(0, '127.0.0.1')`), port libre choisi par le système ;
   - `dir` doit être de la forme `plans/<id>` (motif `[A-Za-z0-9_-]+`, comme les dossiers d'essai `_…`), sinon arrêt avec un message clair ;
   - chemin décodé, résolu (`path.resolve`, puis `fs.realpathSync` pour suivre les liens) et comparé par `path.relative` (pas par `startsWith`, qui laisse passer un dossier voisin au nom plus long) ;
   - **liste blanche** inspirée de `servable` (`pipeline/serveur.py`, fonction `servable` et motif `VISITE`), réduite à ce que charge la visite : dans `<dir>/`, `index.html`, `plan.json`, `plan-*.png` (superposition, désactivée par défaut) et `photos/*.jpg` ; dans `moteur/`, les fichiers `.js` et `.css` du premier niveau. `page.png` et `calibration.png` (images du plan du promoteur, utiles seulement à la page de dépôt) ne sont **pas** servis. Tout segment qui commence par un point est refusé ; tout le reste répond 404 ;
   - aucune liste de répertoire.
   Le moteur ne charge que `plan.json`, `../../moteur/visite.css`, `ui.js`, `engine.js`, les photos de la galerie et l'image de superposition (`moteur/ui.js`, fonctions `boot` et `drawPlan`) ; three.js vient encore de cdn.jsdelivr.net (jusqu'à L4-06).
2. **Environnement sans clé** : ajouter à `moteur/chrome.mjs` une fonction, par exemple `envSansSecret()`, qui renvoie une copie de `process.env` sans `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` ni aucune variable dont le nom se termine par `_API_KEY`, `_SECRET` ou `_TOKEN` ; au chargement du module, retirer aussi ces variables de `process.env` du processus node lui-même. L'environnement filtré est passé explicitement (`env`) à chaque `puppeteer.launch`.
3. **Brancher** `moteur/controle.mjs` et `moteur/photos.mjs` sur ce module : remplacer le bloc `http.createServer(…).listen(0)` (vers les lignes 18 à 24 des deux fichiers) par l'appel à `serveurStatique`, et ajouter `env: envSansSecret()` à leur `puppeteer.launch` (ligne 31 environ). Rien d'autre ne change (options de Chrome : L1-09, qui reprend ce filtre dans `lancerChrome`).
4. **Test automatique** `moteur/chrome.test.mjs` ou `outils/test_statique.mjs` (node, sans navigateur) qui démarre le serveur sur un dossier factice sous `plans/_test-statique/` et vérifie :
   - `server.address().address === '127.0.0.1'` ;
   - 404 pour `/.env`, `/pipeline/serveur.py`, `/references/432.plan.json`, `/plans/<autre>/plan.json`, `/<dir>/../../.env`, `/%2e%2e/.env`, `/<dir>/.etat.json.tmp`, `/<dir>/reponse-ia.json`, `/<dir>/source.pdf`, `/<dir>/page.png`, `/moteur/chrome.mjs`, un lien symbolique vers `.env` placé dans `<dir>` ;
   - 200 pour `/<dir>/index.html`, `/<dir>/plan.json`, `/moteur/ui.js`, `/moteur/visite.css`.
   Le test ne lit jamais le contenu de `.env` : il crée son propre fichier leurre pour vérifier le refus. Il vérifie aussi que `envSansSecret()` retire une clé leurre (`OPENROUTER_API_KEY=leurre`) et garde `PATH` et `HOME`.
5. **Vérifier la chaîne sans payer** : `node moteur/controle.mjs plans/<copie>` et `node moteur/photos.mjs plans/<copie>` sur des copies de plans déjà lus (dossiers `plans/_…`), avant et après le correctif : même `controle.json` (verdict et problèmes), mêmes photos à l'œil. Puis `outils/finalise.sh <copie>` de bout en bout.
6. **Tous les scripts qui servent des fichiers** : `grep -rn "createServer\|listen(\|http.server\|HTTPServer" moteur/ outils/`. Relevé du 27/09/2026 : `moteur/controle.mjs`, `moteur/photos.mjs` et `moteur/_dbg.mjs` (lignes 19 à 24, fichier non suivi créé par l'agent des duplex) ouvrent le même serveur ; `outils/` n'en ouvre aucun. Prévenir l'agent des duplex : `_dbg.mjs` doit passer par `serveurStatique` et `envSansSecret` (ou être supprimé) avant toute fusion. Tout nouveau script qui sert des fichiers passe par `serveurStatique`.
7. **Après la fusion**, demander à l'utilisateur de faire tourner la clé API (L0-08) : on ne peut pas exclure qu'elle ait été lue pendant un rendu passé.

## Critères d'acceptation
- [ ] Le test de l'étape 4 passe (toutes les réponses 404 et 200 attendues, clé leurre retirée) et tourne en moins de 5 s, sans réseau.
- [ ] Pendant un rendu, `lsof -nP -iTCP -sTCP:LISTEN | grep node` ne montre que `127.0.0.1:<port>`.
- [ ] Visite de contrôle lancée avec `OPENROUTER_API_KEY=leurre` dans l'environnement : l'environnement des processus Chrome (`ps eww` sous macOS, `/proc/<pid>/environ` sous Linux) ne contient ni `OPENROUTER_API_KEY` ni `ANTHROPIC_API_KEY`.
- [ ] `grep -rn "createServer" moteur/ outils/` ne trouve plus que `moteur/chrome.mjs` dans tout fichier fusionné ; `_dbg.mjs`, s'il existe encore, est signalé à l'agent des duplex et n'est jamais fusionné avec son serveur ouvert.
- [ ] Même verdict de la visite de contrôle et mêmes photos avant et après, sur au moins deux plans déjà lus ; outil local (`python3 pipeline/serveur.py`) et `outils/finalise.sh` toujours en marche ; aucune lecture payante.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 (règle 3) appliqué dès que L1-02 existe ; tout défaut trouvé ici devient un cas du test de l'étape 4.

## Points d'attention
- **Découpage** : M0.3 demande « rejeu M0.1 identique », mais ce ticket ne dépend pas de L1-02, volontairement (urgence). En attendant, la comparaison manuelle de l'étape 5 tient lieu de rejeu ; L1-02 rejouera ensuite.
- Petit diff isolé sur une branche courte : deux blocs de 6 lignes remplacés, une option `env` ajoutée à deux lancements et un fichier nouveau ; `controle.mjs` et `photos.mjs` sont en cours de modification par l'agent des duplex, à fusionner avec lui.
- Le filtre de l'environnement est fait côté moteur, sans toucher à `enfant` (`pipeline/serveur.py`) ; il remplace la proposition faite dans L3-01 et L3-03.
- L1-09 étendra `moteur/chrome.mjs` avec le lancement de Chrome : garder le module simple et exporté par fonctions nommées.
- Les outils `outils/vues.mjs`, `marche.mjs` et `trajets.mjs` passent par le serveur local (`pipeline/serveur.py`, déjà limité à 127.0.0.1 et à une liste blanche) : ils n'ouvrent aucun serveur. Lancés à la main, hors de `enfant`, ils ne reçoivent pas les clés du `.env` ; ils passeront par `lancerChrome` et son environnement filtré avec L1-09.

## Références
- `produit/recherche/audit-code.md` B6, synthèse point 2
- `produit/ARCHITECTURE.md` § 6.1 (B6), § 6.8 (`/.env` inaccessible par toutes les voies), § 8.1, § 8.3 M0.3
- `produit/recherche/hebergement.md` § 4 (sécurité du rendu)
- `moteur/photos.mjs` et `moteur/controle.mjs` (serveur statique en tête de fichier, `root`, `MIME`) ; `moteur/_dbg.mjs`
- `pipeline/serveur.py` (`servable`, `VISITE`)

## Hors périmètre
- Options de Chrome et module de lancement : L1-09.
- Rotation de la clé : L0-08.
- Rendu dans un conteneur qui ne reçoit que les fichiers du plan : L5-10.
