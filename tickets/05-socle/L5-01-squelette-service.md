# L5-01 · Squelette du service : FastAPI, Postgres, Docker Compose, CI

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L0-03, L1-07 | `service/` | À faire |

## Pourquoi
Le serveur actuel (`pipeline/serveur.py`, `http.server`, dépôt lu en mémoire) n'est pas un serveur de production (audit B5). Décision du 27/09/2026 : l'application est dockerisée (Docker Compose) pour se déployer partout, avec un stockage S3. Ce ticket pose le socle vide sur lequel tous les tickets du lot 5 s'appuient : une application FastAPI, une base Postgres, trois images (web, worker-lecture, rendu) construites par la CI, sans rien changer à l'outil local.

## À faire
1. Créer l'arborescence `service/` (nouveau dossier, aucun fichier de `pipeline/` ni de `moteur/` modifié) :
   - `service/app/` : `main.py` (application FastAPI), `config.py` (réglages d'infrastructure lus dans l'environnement : `ENV`, `DATABASE_URL`, `S3_ENDPOINT`, `S3_SEAU_PRIVE`, `S3_SEAU_PUBLIE`, `SMTP_*`, `DOMAINE_PRINCIPAL`, `MARQUE_NOM`), `journaux.py`, `sante.py` ;
   - `service/migrations/` : Alembic, migration initiale vide et convention « étendre puis contracter » (ARCHITECTURE § 4.1, § 9.2) ;
   - `service/worker/` et `service/rendu/` : points d'entrée vides, remplis par L5-06 et L5-10 ;
   - `service/tests/` : pytest, base Postgres jetable par test (transaction annulée).
2. Dépendances : `service/requirements.lock` figé sur le modèle de L1-07 (FastAPI, uvicorn, SQLAlchemy 2, psycopg 3, Alembic, pydantic-settings, boto3, structlog ou `logging` JSON). Aucune dépendance non figée.
3. Trois Dockerfiles dans `service/docker/` :
   - `web` : Python, uvicorn, sans Node ni Chrome ;
   - `worker-lecture` : Python, `pipeline/`, `moteur/`, Node et Chrome for Testing figés (L1-07), polices, options SwiftShader (L1-09), pour la visite de contrôle ;
   - `rendu` : Node, Chrome for Testing figé, `moteur/`, sans Python métier. Utilisateur non root dans les trois.
4. `.dockerignore` à la racine : exclure `.env`, `.env.*`, `plans/`, `references-privees/`, `.git/`, `node_modules/`, `__pycache__/`. Un `COPY` large ne doit jamais embarquer un secret ni un plan de promoteur.
5. `service/compose.yaml` (fichier placé dans `service/`, **pas à la racine** : Docker Compose lit automatiquement le `.env` du dossier du projet pour l'interpolation, et celui de la racine contient la clé de l'outil local) :
   - `postgres:16` ; `minio` et un conteneur d'initialisation qui crée les seaux `prive` et `publie` ; `mailpit` ;
   - `web` (port 8000, jamais 8780 réservé à l'outil local), `worker-lecture`, `rendu` ;
   - variables lues dans `service/.env.local.example` (valeurs factices, versionné) copié en `service/.env.local` (ignoré par Git) et passé par `--env-file`.
6. Point de santé : `GET /sante` (le processus répond) et `GET /sante/pret` (base joignable, migrations à jour, seaux joignables). Réponses sans détail technique.
7. Journaux structurés JSON sur la sortie standard : horodatage, niveau, identifiant de requête, `organisation_id`, `travail_id` quand ils existent. Adresse IP tronquée dans les journaux applicatifs (IPv4 /24, IPv6 /48), à confirmer au registre (L0-09).
8. Filtre des secrets appliqué à **tous** les journaux (application, uvicorn, workers) : remplace par `***` les motifs `sk-or-`, `sk-ant-`, `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, les en-têtes `Authorization` et `Cookie`, et les paramètres de signature S3 (`X-Amz-Signature`, `X-Amz-Credential`) (ARCHITECTURE § 6.7).
9. CI (GitHub Actions ou équivalent, `.github/workflows/service.yml`) à chaque demande de fusion : lint, tests unitaires, `alembic upgrade head` puis `downgrade -1` sur un Postgres de service, construction des trois images étiquetées par le commit. La poussée vers le registre est faite par L5-18.
10. `service/README.md` : lancer en local (`docker compose --env-file .env.local up`), lancer les tests, règles (aucun secret dans l'image, aucune dépendance à `pipeline/serveur.py`).

## Critères d'acceptation
- [ ] `docker compose --env-file .env.local up` depuis `service/` démarre les six services ; `curl localhost:8000/sante/pret` répond 200.
- [ ] CI verte : tests, migration aller-retour, trois images construites.
- [ ] Aucun import de `pipeline/serveur.py` dans `service/` (test qui parcourt les imports) : ce module lit le `.env` de la racine dès son import (`load_env`, `pipeline/serveur.py:28`).
- [ ] Test d'image : `.env` absent des trois images (`docker run … test ! -e /app/.env`), aucun fichier sous `plans/`.
- [ ] Test du filtre : un journal contenant `sk-or-v1-xxxx`, `whsec_xxx` ou une URL signée S3 sort masqué.
- [ ] L'outil local marche toujours : `python3 pipeline/serveur.py` et `outils/finalise.sh` inchangés, test de fumée `PLAN_MOCK` réussi.
- [ ] Aucune lecture payante pour tester : aucune clé IA n'est nécessaire à ce ticket.

## Points d'attention
- Le `.env` de la racine ne doit jamais être lu par le service, ni par Compose, ni copié dans une image. C'est la même famille de fuite que B6 (L1-01).
- « Déployable partout » : aucun code propre à Scaleway. Point d'accès S3, SMTP et base configurables. Le déploiement sur une VM vierge d'un autre fournisseur est vérifié par L5-18.
- L3-01 (image Docker de l'outil actuel) a déjà écrit un Dockerfile avec Chrome for Testing et SwiftShader : en reprendre les couches plutôt que tout réécrire.
- Taille : à la limite de L. Si la CI et les images prennent plus de temps que prévu, sortir la construction de l'image `rendu` vers L5-10.
- Choix acquis sauf objection (ARCHITECTURE § 3, « Choix proposés comme acquis ») : FastAPI, Procrastinate, rendu serveur des pages sans étape de build. Les confirmer dans L0-03 avant de commencer.

## Références
- produit/ARCHITECTURE.md § 2.1 (services), M2.1, § 6.7 (secrets et filtre), § 9.1 (environnements), § 9.2 (CI, images).
- produit/recherche/audit-code.md B5, A11, A13.
- produit/recherche/hebergement.md § 4 (montage Docker Compose).
- `pipeline/serveur.py:28` (`load_env`), `:698` (`ThreadingHTTPServer`).

## Hors périmètre
- Stockage et URL signées : L5-02. Comptes : L5-03. File de travaux : L5-06. Worker de rendu : L5-10.
- Registre de conteneurs, préproduction, secrets au démarrage : L5-18. Sauvegardes et restauration : L5-26.
- Supervision (Sentry, battements de cœur) : L5-16.
