# L5-18 · Préproduction, déploiement automatique, secrets

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-01, L0-08 | `service/`, `outils/` | À faire |

## Pourquoi
Décision de l'utilisateur n° 2 : l'application est dockerisée (Docker Compose) pour se déployer partout, avec un stockage S3. Il faut un environnement de préproduction qui reçoit automatiquement chaque fusion, une production promue à partir de la même image, et des secrets injectés au démarrage (`ARCHITECTURE.md` § 9.1, § 9.2, M2.13). Les sauvegardes et la restauration testée sont découpées dans L5-26. La préproduction est aussi le seul endroit, hors du poste de l'équipe, où les plans réels de référence peuvent être rejoués chaque nuit, sans jamais être publiés.

## À faire
1. **Préproduction** (§ 9.1) : projet séparé chez l'hébergeur retenu (D2, L0-03) ; une VM avec le `docker-compose.yml` de L5-01 et une surcharge `compose.preprod.yml` ; Postgres (géré si l'hébergeur en propose, sinon le service du Compose ; aucun composant propre à un hébergeur n'est obligatoire, R3) ; seaux `prive` et `publie` (le seau `sauvegardes` est créé par L5-26) ; domaines `*.preprod.<domaine>` ; `noindex` et accès protégé ; aucune donnée de client ; clé IA `dev` ; Stripe en mode test ; e-mails vers les adresses de l'équipe seulement.
2. **Déploiement par la CI** (§ 9.2) : à chaque fusion sur la branche principale, tests « chaque PR » du § 9.5, construction des trois images (`web`, `worker-lecture`, `rendu`) étiquetées par le commit, envoi au registre ; `outils/publier_moteur` (L5-12) si `moteur/` a changé, **avant** l'application ; puis sur la VM : migrations « étendre », `docker compose pull` et `up -d`. Production : promotion manuelle de la **même** image (même empreinte), sans reconstruction.
3. **Migrations en deux temps** : script de CI qui refuse une migration qui supprime ou renomme une colonne encore lue par la version précédente.
4. **Arrêt des workers** : ils cessent de prendre du travail, attendent jusqu'à 20 min la fin des lectures en cours (8 à 15 min mesurées), puis s'arrêtent ; un travail interrompu reprend sans repayer (L5-06).
5. **Secrets** injectés au démarrage depuis le gestionnaire de secrets (fichier d'environnement produit au déploiement, jamais dans l'image, le dépôt ni les journaux) ; vérification automatique des couches d'image.
6. **Rejeu nocturne des références privées** en préproduction : seau `references-privees/` (accès équipe), script de L1-02 lancé dans le worker, clés vidées ; `plan.json` identiques ou écarts approuvés, `evaluer.py` au moins égal à la référence (D201 : 7 ouvertures sur 7, 6 équipements sur 6 ; 432 : 6 sur 7 et 6 sur 7), visite de contrôle réussie ; rapport envoyé à l'équipe, rien de publié.
7. **« Déployable partout »** : le même Compose installé une fois sur une VM vierge d'un autre fournisseur, avec un stockage compatible S3 et un SMTP ; témoin produit de bout en bout ; procédure écrite et chronométrée (avec L5-21), écarts notés.

## Critères d'acceptation
- [ ] Une fusion sur la branche principale met à jour la préproduction sans geste manuel ; le témoin y est publié et s'ouvre par un lien de partage (critère de M2.13).
- [ ] La promotion en production réutilise l'image de même empreinte (test qui compare les empreintes).
- [ ] Rejeu nocturne sans aucun appel payant (aucune ligne `appels_ia`, aucune clé présente) et rapport reçu.
- [ ] Même Compose déployé chez un second fournisseur : témoin généré avec `PLAN_MOCK`, procédure écrite.
- [ ] Aucun secret dans les images, le dépôt ou les journaux (analyse automatique).
- [ ] Sans identifiants, la préproduction refuse l'accès ; `X-Robots-Tag: noindex` présent.
- [ ] Outil local inchangé (`python3 pipeline/serveur.py`, `outils/finalise.sh`).

## Points d'attention
- **Tranché (découpage)** : sauvegardes, versionnement du seau privé, réplication et restauration testée sont dans L5-26. Ce ticket garde préproduction, déploiement automatique, secrets, rejeu nocturne et essai chez un second fournisseur ; s'il déborde encore, sortir ces deux derniers points.
- **Plans réels en préproduction** : ce sont des plans de promoteurs, jamais versionnés ni publiés sans accord (`CLAUDE.md`). Les copier dans un seau de préproduction n'est pas les publier, mais demander l'accord de l'utilisateur avant.
- D2 n'est pas validée (L0-03). Garder le chemin de déploiement indépendant du fournisseur (SSH et Compose) ; les outils propres à un fournisseur restent optionnels.
- **Tranché : R3.** Le rendu est un service du Compose comme les autres (SwiftShader en conteneur, par défaut et partout) ; Serverless Jobs et Mac mini ne sont que des accélérations optionnelles après le lancement (L13-01), jamais une étape du déploiement.

## Références
- Décision de l'utilisateur du 27/09/2026, n° 2 et n° 4.
- `produit/ARCHITECTURE.md` § 9.1, § 9.2, § 9.5, M2.13 ; `produit/recherche/hebergement.md` § 4, § 8 ; `produit/recherche/audit-code.md` A13.
- `outils/finalise.sh` ; `pipeline/evaluer.py` ; `references/`.

## Hors périmètre
- Sauvegardes, versionnement, réplication et restauration testée : L5-26.
- Procédures d'incident et reconstruction de la VM : L5-21. Supervision : L5-16.
- Purge des données : L5-20. Umami : L7-01. Ouverture de la bêta : L6-10.
