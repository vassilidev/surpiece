# L3-01 · Image Docker de l'outil actuel

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L1-01, L1-07, L1-09 | — | À faire |

## Pourquoi
Décision du 27/09/2026 (n° 2) : l'application se déploie partout avec Docker Compose. Décision n° 4 : le rendu dans un conteneur sans GPU (SwiftShader) est la base, pas une option dégradée. La bêta express met l'outil local tel qu'il est (`pipeline/serveur.py`, visite de contrôle, photos) dans une image, sans rien réécrire. Les couches « Python + Node + Chrome figés » de cette image servent ensuite au worker de lecture et au rendu du socle (ARCHITECTURE.md § 9.2 : images `web`, `worker-lecture`, `rendu` ; L5-01 prévoit de les reprendre).

## À faire
1. **`.dockerignore`** à la racine : exclure `.env` et `.env.*` (garder `.env.example`), `plans/`, `.git/`, `node_modules/`, `__pycache__/`, `produit/`, `tickets/`, tout dossier de références privées (les 4 plans réels de L1-02 ne sont jamais dans l'image).
2. **`Dockerfile`** multi-étapes à la racine, cible `linux/amd64` :
   - étage `chaine` : `python:3.13-slim-bookworm` (même version mineure que le poste, Python 3.13.5 relevé le 27/09/2026), Node 22 (même version majeure que le poste, v22.18.0) installé depuis l'archive officielle vérifiée par son empreinte ;
   - dépendances Python par `pip install --require-hashes -r requirements.lock`, dépendances Node par `npm ci` (fichiers de L1-07) ;
   - Chrome for Testing à la version figée par L1-07, installé dans un chemin fixe (`/opt/chrome`) et désigné par la variable lue par `moteur/chrome.mjs` (L1-09) ; bibliothèques système de Chrome sous Debian (liste de la page « Troubleshooting » de puppeteer, versions figées par la date du dépôt Debian utilisée) et polices de repli (`fonts-liberation`) ;
   - utilisateur non root `visite` (uid fixe, par exemple 10001), `WORKDIR /app`, copie de `pipeline/`, `moteur/`, `outils/`, `references/` (relevés versionnés seulement), fichiers de dépendances ;
   - `ENV RENDU_CHROME=swiftshader PORT=8780 PYTHONUNBUFFERED=1` ; `CMD ["python3", "pipeline/serveur.py"]`.
3. **`compose.yaml`** à la racine : service `outil`, volume nommé `plans` sur `/app/plans`, `shm_size: 1gb`, `init: true` (les Chrome arrêtés ne restent pas en zombies), `cpus` et `mem_limit` réglés, `restart: unless-stopped`, variable `PLAN_PARALLELE=1`.
4. **Secrets** : jamais dans l'image, jamais en `build-arg`, jamais dans le dépôt. Compose lit un fichier hors du dépôt (`env_file: ${SECRETS_FICHIER:-/etc/visite-plans/outil.env}`, droits 600) ou les variables de l'hôte. Ne jamais monter de `.env` dans `/app` : `load_env` (`pipeline/serveur.py:28`) le lirait.
5. **Écoute.** `serveur.py` écoute sur `127.0.0.1` en dur (`__main__`, `:698`) et `hote_ok` (`:499`) n'accepte que `localhost:PORT`. Sans toucher à `pipeline/`, publier le port par un conteneur `caddy` en `network_mode: "service:outil"` (même pile réseau) qui relaie `:8781` vers `127.0.0.1:8780` ; Compose publie `127.0.0.1:8780:8781` ; Caddy garde l'en-tête Host d'origine (`localhost:8780`), donc `hote_ok` et `origine_ok` passent. Le paramètre d'écoute propre arrive avec L3-02.
6. **Chrome dans le conteneur** : options SwiftShader de L1-09 (`--use-angle=swiftshader --enable-unsafe-swiftshader`). Garder le bac à sable de Chrome en non-root avec le profil seccomp par défaut ; `--no-sandbox` seulement si l'essai échoue, et consigné dans le README. `--disable-dev-shm-usage` seulement si `shm_size` ne suffit pas.
7. **Accès sortant** : tant que L4-06 n'est pas livré, la visite charge three.js depuis jsdelivr et les polices depuis Google ; OpenRouter est aussi appelé. Le conteneur a donc besoin d'un accès HTTPS sortant ; le noter.
8. **Vérification de santé** Compose : requête `GET http://127.0.0.1:8780/` avec `Host: localhost:8780`, attendue en 200.
9. **README**, section « Docker » : construire, lancer, où poser les secrets, où sont les plans (volume), rejouer un plan sans payer (`docker compose exec outil outils/finalise.sh <id>`), arrêter proprement.
10. **Mesures** notées dans le README : durée de la visite de contrôle et des 11 photos en SwiftShader dans le conteneur, sur le poste et sur la machine cible (L3-05).

## Critères d'acceptation
- [ ] `docker compose build` réussit depuis un clone neuf, sans `.env` présent.
- [ ] L'image ne contient ni `.env` ni `plans/` (`docker run --rm <image> ls -a /app`) ; `docker save <image>` exporté puis parcouru ne contient aucune chaîne `sk-or-` ni `sk-ant-`.
- [ ] `docker compose up` : accueil servi sur `http://localhost:8780/` depuis l'hôte ; l'outil local hors Docker (`python3 pipeline/serveur.py`) marche comme avant (test de fumée de L1-02).
- [ ] Dans le conteneur, sans clé : `PLAN_MOCK` sur le témoin (L1-12) → visite de contrôle réussie et photos produites en SwiftShader.
- [ ] `outils/finalise.sh` sur une lecture gardée (jeu de L1-02) : même verdict de contrôle qu'en Metal, images à moins de 2/255 de la ligne de base, contexte WebGL créé, aucune texture noire (contrôles de L1-09).
- [ ] Le processus tourne en non-root ; `docker compose stop` pendant des photos ne laisse aucun Chrome orphelin (`docker top` vide après arrêt).
- [ ] Redémarrage du conteneur : les plans du volume sont conservés ; un plan interrompu passe en erreur avec un message sans texte technique (contrôle de L1-04).
- [ ] Aucune lecture payante pour tester.

## Points d'attention
- **Architecture processeur.** Chrome for Testing n'est publié, à ma connaissance, que pour Linux x86-64 (à vérifier au moment du ticket) : image `linux/amd64`. Sur un Mac Apple Silicon, Docker l'émule et SwiftShader y est encore plus lent : les temps se mesurent sur la VM cible, pas sur le Mac.
- **Temps de rendu.** L'outil actuel rend toute la galerie : 11 photos en 684 s sur un M3 à 8 cœurs (recherche/hebergement.md § 2.1), 1,5 à 2 fois plus sur des vCPU de serveur (estimation). Compter de l'ordre de 20 à 40 min par plan sur 4 vCPU, à mesurer. L'aperçu réduit (L4-09) n'est pas une dépendance du lot 3.
- **Secrets hérités par Chrome : tranché.** `enfant` (`pipeline/serveur.py:329`) lance node sans réduire l'environnement, ce qui contredit ARCHITECTURE.md § 6.7 (Chrome lancé sans variable secrète, parce qu'il affiche des textes issus du plan). L1-01, déjà en dépendance, retire les clés API de l'environnement du processus node et des processus Chrome (`envSansSecret`, `moteur/chrome.mjs`) ; L3-03 le vérifie dans le conteneur.
- **Découpage.** Le paramètre d'écoute est rangé dans L3-02 alors que L3-01 en a besoin pour être joignable : le relais Caddy du point 5 évite de toucher `pipeline/` ici. Si l'on préfère, déplacer `PLAN_ECOUTE` dans L3-01.
- **Coordination avec le travail sur les duplex** : ce ticket ne modifie ni `pipeline/` ni `moteur/`. L'image copie l'arbre au moment du build : construire depuis un commit fusionné, jamais depuis l'arbre de travail de l'autre agent.

## Références
- produit/ARCHITECTURE.md § 9.2 (images et déploiement), § 6.7 (secrets), § 2.1 (services) ; produit/recherche/hebergement.md § 2.1, § 2.2, § 4 ; produit/recherche/audit-code.md B6, B11, A13.
- pipeline/serveur.py:28 (`load_env`), :329 (`enfant`), :499 (`hote_ok`), :504 (`origine_ok`), :674 (`reprise_au_demarrage`), :698 (`__main__`, écoute) ; moteur/photos.mjs:31 et moteur/controle.mjs:31 (`puppeteer.launch`, avant L1-09) ; outils/finalise.sh ; requirements.txt ; README.md (installation actuelle, puppeteer global).

## Hors périmètre
- Accès depuis Internet, identité des testeurs, paramètre d'écoute : L3-02. Cloisonnement : L3-03. Budgets : L3-04. VM, sauvegardes, supervision : L3-05.
- Images du socle (`web`, `worker-lecture`, `rendu`) : L5-01 et L5-10. Moteur et polices servis par nous : L4-06.
