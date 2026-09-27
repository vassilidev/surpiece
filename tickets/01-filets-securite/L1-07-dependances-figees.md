# L1-07 · Figer les dépendances

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | S (jusqu'à 1 j) | — | `outils/` | À faire |

## Pourquoi
`requirements.txt` ne fige aucune version (sauf `shapely>=2.1`) et puppeteer est installé en global (`npm install -g puppeteer`, résolu par `npm root -g`), avec la version de Chrome qu'il a téléchargée ce jour-là. Deux installations ne donnent donc pas le même rendu, et une mise à jour silencieuse peut changer les photos ou casser la visite de contrôle. Les images Docker (L3-01, L5-01) et la CI (L1-11) exigent des versions figées (audit A13, M0.7).

## À faire
1. **Python** : relever les versions de l'environnement qui produit aujourd'hui les résultats de référence (relevé du 27/09/2026 : Python 3.13.5, pymupdf 1.28.2, shapely 2.1.2, numpy 2.3.1, pillow 11.2.1, opencv-python-headless 5.0.0.93, anthropic 1.8.0, certifi 2025.6.15 ; à reconfirmer au moment du ticket) et écrire `requirements.lock` avec les versions exactes et les dépendances transitives (par exemple `pip-compile --generate-hashes` depuis `requirements.txt`, ou `pip freeze` filtré dans un environnement virtuel propre). Garder `requirements.txt` comme liste lisible des dépendances directes.
2. **Node** : `package.json` à la racine (privé, `"type": "module"` si utile) avec `puppeteer` à la version exacte installée aujourd'hui (24.41.0, relevé du 27/09/2026) ; `package-lock.json` généré et versionné ; `node_modules/` est déjà ignoré par Git. Noter la version de Node (22.18.0 relevée) dans `package.json` (`engines`) et dans la documentation.
3. **Chrome for Testing figé** : la version de Chrome est celle attachée à la version de puppeteer. La noter (sortie de `npx puppeteer browsers list` ou fichier de révisions de puppeteer) et fixer le dossier de cache dans le projet par `.puppeteerrc.cjs` (`cacheDirectory` dans `.cache/puppeteer`, ajouté à `.gitignore`) pour que le Chrome utilisé ne dépende plus du poste. Les images Docker installeront la même version.
4. **Import local de puppeteer** : `moteur/photos.mjs` et `moteur/controle.mjs` essaient déjà l'import local avant le global ; `outils/vues.mjs`, `outils/marche.mjs` et `outils/trajets.mjs` n'utilisent que le global (`npm root -g`) : les passer à l'import local d'abord, repli global ensuite (même motif que `photos.mjs`), en coordination avec l'agent des duplex qui modifie ces fichiers.
5. **Documentation** : `README.md` (Installation) et `pipeline/README.md` (Installation) : `pip3 install -r requirements.lock` puis `npm ci` ; retirer `npm install -g puppeteer`. La ligne « Captures : puppeteer global » de `CLAUDE.md` est à mettre à jour **par l'utilisateur ou avec son accord explicite**.
6. **Installation depuis un clone neuf**, documentée pas à pas et vérifiée : `git clone`, environnement virtuel Python, `pip install -r requirements.lock`, `npm ci`, puis test de fumée de l'outil local (L1-02, `outils/fumee.sh`) et `node moteur/controle.mjs` sur une copie de plan.
7. **Règle de mise à jour** écrite dans le README : toute montée de version (pymupdf, opencv, shapely, puppeteer, Chrome, three.js) passe par le rejeu des références (L1-02) et, une fois L1-11 livré, par la comparaison d'images de la CI.

## Critères d'acceptation
- [ ] `requirements.lock`, `package.json`, `package-lock.json` et `.puppeteerrc.cjs` sont versionnés ; aucune dépendance n'est résolue en global.
- [ ] Sur un clone neuf, sans puppeteer global (`npm uninstall -g puppeteer` sur une machine de test, ou un autre compte), l'installation documentée aboutit et le test de fumée réussit.
- [ ] `grep -rn "npm root -g" moteur/ outils/` ne trouve plus que les replis explicites (ou rien).
- [ ] Rejeu L1-02 identique avant et après (mêmes `plan.json`, mêmes vues à moins de 2/255).
- [ ] La version de Chrome for Testing utilisée est écrite dans la documentation et vérifiable par une commande.

## Points d'attention
- Plusieurs Chrome for Testing sont déjà en cache sur le poste (145 et 147) : vérifier lequel sert réellement avant de figer, pour que la ligne de base de L1-02 reste valable.
- `opencv-python-headless` et `pymupdf` ont des roues par plateforme : générer le verrou sur macOS peut donner des empreintes absentes sous Linux (images Docker) ; prévoir un verrou multiplateforme ou le régénérer dans l'image.
- `outils/*.mjs` et `moteur/*.mjs` sont en cours de modification par l'agent des duplex : diff minimal (une ligne d'import par fichier), fusion coordonnée.
- `moteur/_dbg.mjs` (non suivi, agent des duplex) utilise aussi le global : à signaler.

## Références
- `produit/recherche/audit-code.md` A13, B11 (dernier paragraphe)
- `produit/ARCHITECTURE.md` § 8.3 M0.7, § 9.2 (images avec Chrome for Testing figé), § 9.5
- `produit/recherche/hebergement.md` § 2.2 (figer Chrome dans l'image)
- `README.md` et `pipeline/README.md` (Installation) ; `requirements.txt` ; `.gitignore`
- `moteur/photos.mjs`, `moteur/controle.mjs` (import local puis global) ; `outils/vues.mjs`, `outils/marche.mjs`, `outils/trajets.mjs`

## Hors périmètre
- Options de rendu de Chrome : L1-09.
- Images Docker : L3-01, L5-01 ; CI : L1-11.
- three.js et polices servis par nous : L4-06.
