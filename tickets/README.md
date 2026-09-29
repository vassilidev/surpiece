# Tickets

Index généré par `python3 outils/tickets.py` à partir de l'en-tête de chaque ticket : ne pas l'éditer à la main. Le plan d'ensemble, les décisions et l'ordre de reprise sont dans [`produit/PLAN.md`](../produit/PLAN.md).

**Mode d'emploi.** Un ticket = une branche courte. On passe son statut à « En cours » puis « Fait » dans son en-tête, et on régénère cet index. Un ticket qui touche `pipeline/` [P] ou `moteur/` [M] ne se fusionne qu'avec le critère de `produit/ARCHITECTURE.md` § 8.1 (rejeu sans IA identique, visite de contrôle, contrôle des textes). Tout défaut trouvé devient un contrôle automatique. `python3 outils/tickets.py --verifier` contrôle les en-têtes et les dépendances.

Priorités : P0 indispensable au jalon du lot, P1 important, P2 plus tard. Tailles : S jusqu'à 1 j, M 1 à 3 j, L 3 à 5 j (charge comptée 1, 2 et 4 j, pour une personne).

| Lot | Tickets | P0 | Charge | Faits |
|---|---:|---:|---:|---:|
| [0 · Décisions et préalables](#lot-0) | 9 | 8 | 12 j | 0 |
| [1 · Filets de sécurité et correctifs immédiats](#lot-1) | 18 | 16 | 38 j | 0 |
| [2 · Vitrine](#lot-2) | 18 | 14 | 38 j | 0 |
| [3 · Bêta express dockerisée (optionnelle)](#lot-3) | 6 | 0 | 12 j | 0 |
| [4 · Cœur réutilisable](#lot-4) | 19 | 11 | 45 j | 0 |
| [5 · Socle en ligne](#lot-5) | 28 | 24 | 70 j | 0 |
| [6 · Parcours particulier et bêta fermée](#lot-6) | 13 | 9 | 26 j | 0 |
| [7 · Mesure et entonnoirs](#lot-7) | 8 | 5 | 14 j | 0 |
| [8 · Paiement des particuliers](#lot-8) | 9 | 8 | 20 j | 0 |
| [9 · Offre conseillers (Pro)](#lot-9) | 13 | 7 | 30 j | 0 |
| [10 · Offre promoteurs (Programme)](#lot-10) | 9 | 6 | 21 j | 0 |
| [11 · Marque blanche](#lot-11) | 4 | 2 | 9 j | 0 |
| [12 · Publicité et conversions](#lot-12) | 5 | 3 | 10 j | 0 |
| [13 · Après lancement](#lot-13) | 8 | 0 | 23 j | 1 |
| **Total** | **167** | **113** | **368 j** | **1** |

<a id="lot-0"></a>
## 0 · Décisions et préalables

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L0-01 · Valider le nom et sécuriser la marque](00-decisions/L0-01-nom-et-marque.md) | P0 | S (jusqu'à 1 j) | — | — | À faire |
| [L0-02 · Trancher l'authentification (D1)](00-decisions/L0-02-decision-auth.md) | P0 | S (jusqu'à 1 j) | — | — | À faire |
| [L0-03 · Valider l'hébergement et la pile de déploiement](00-decisions/L0-03-decision-hebergement.md) | P0 | S (jusqu'à 1 j) | — | — | À faire |
| [L0-04 · Valider les offres et les prix de lancement](00-decisions/L0-04-valider-offres.md) | P0 | S (jusqu'à 1 j) | — | — | À faire |
| [L0-05 · Trancher les questions produit ouvertes](00-decisions/L0-05-petites-decisions.md) | P1 | S (jusqu'à 1 j) | L0-04 | — | À faire |
| [L0-06 · Société, banque, expert-comptable, assurance](00-decisions/L0-06-societe-comptable.md) | P0 | M (1 à 3 j) | — | — | À faire |
| [L0-07 · Préparer et tenir le rendez-vous avocat](00-decisions/L0-07-avocat.md) | P0 | M (1 à 3 j) | L0-01 | — | À faire |
| [L0-08 · Ouvrir les comptes fournisseurs et les clés](00-decisions/L0-08-comptes-fournisseurs.md) | P0 | S (jusqu'à 1 j) | L0-03, L0-06 | — | À faire |
| [L0-09 · RGPD : registre, DPA des fournisseurs, procédures droits et violations](00-decisions/L0-09-rgpd-registre-dpa-procedures.md) | P0 | M (1 à 3 j) | L0-02, L0-08 | — | À faire |

<a id="lot-1"></a>
## 1 · Filets de sécurité et correctifs immédiats

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L1-01 · URGENT : fermer la fuite du .env par les scripts Chrome](01-filets-securite/L1-01-fuite-env-scripts-chrome.md) | P0 | S (jusqu'à 1 j) | — | `moteur/` [M] | À faire |
| [L1-02 · Jeu de référence rejouable sans payer](01-filets-securite/L1-02-references-rejouables.md) | P0 | M (1 à 3 j) | — | `outils/` | À faire |
| [L1-03 · Dessiner le plan de vente du témoin fictif](01-filets-securite/L1-03-appartement-temoin.md) | P0 | M (1 à 3 j) | — | `outils/` | À faire |
| [L1-04 · Contrôle automatique « aucun texte technique »](01-filets-securite/L1-04-controle-textes-techniques.md) | P0 | M (1 à 3 j) | L1-02 | `outils/` | À faire |
| [L1-05 · Retirer les textes techniques et corriger les promesses fausses](01-filets-securite/L1-05-textes-visibles.md) | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P], `moteur/` [M] | En cours |
| [L1-06 · Identifiant de plan sans nom de fichier](01-filets-securite/L1-06-identifiant-sans-nom.md) | P1 | S (jusqu'à 1 j) | L1-02 | `pipeline/` [P] | À faire |
| [L1-07 · Figer les dépendances](01-filets-securite/L1-07-dependances-figees.md) | P0 | S (jusqu'à 1 j) | — | `outils/` | À faire |
| [L1-08 · Conservation zéro des données chez OpenRouter](01-filets-securite/L1-08-zdr-openrouter.md) | P0 | S (jusqu'à 1 j) | L1-02 | `pipeline/` [P] | À faire |
| [L1-09 · Rendu Chrome portable : SwiftShader, Metal ou Vulkan au choix](01-filets-securite/L1-09-chrome-portable.md) | P0 | M (1 à 3 j) | L1-01, L1-02 | `moteur/` [M], `outils/` | À faire |
| [L1-10 · Masquer le cartouche avant l'envoi au modèle](01-filets-securite/L1-10-masquage-cartouche.md) | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |
| [L1-11 · Non-régression en CI : chaîne sans IA du témoin et images approuvées](01-filets-securite/L1-11-ci-non-regression-temoin.md) | P0 | M (1 à 3 j) | L0-08, L1-02, L1-04, L1-07, L1-09, L1-12 | `outils/` | À faire |
| [L1-12 · Relevé manuel et lecture gardée du témoin](01-filets-securite/L1-12-temoin-releve-lecture.md) | P0 | M (1 à 3 j) | L1-02, L1-03 | `pipeline/` [P] | À faire |
| [L1-13 · Valider la lecture réelle par l'IA d'un plan à plusieurs niveaux (duplex)](01-filets-securite/L1-13-lecture-reelle-plusieurs-niveaux.md) | P1 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |
| [L1-14 · Diagnostic chiffré de la navigation et banc de fluidité](01-filets-securite/L1-14-diagnostic-banc-fluidite.md) | P0 | M (1 à 3 j) | — | `outils/` | En cours |
| [L1-15 · Corriger clic, regard, déplacement et i/s d'après le diagnostic](01-filets-securite/L1-15-corrections-navigation.md) | P0 | L (3 à 5 j) | L1-02, L1-14 | `moteur/` [M] | En cours |
| [L1-16 · Mesurer le rendu des panoramas 360° en SwiftShader et confirmer l'offre gratuite](01-filets-securite/L1-16-mesure-panoramas-360.md) | P0 | M (1 à 3 j) | L1-02, L1-09 | `outils/` | En cours |
| [L1-17 · Délai : l'acheteur a son plan et sa visite en quelques minutes](01-filets-securite/L1-17-delai-quelques-minutes.md) | P0 | L (3 à 5 j) | L1-02 | `pipeline/` [P] | À faire |
| [L1-18 · Régularité de la lecture : chiffrer l'aléa d'un tirage et le réduire](01-filets-securite/L1-18-regularite-lecture.md) | P0 | L (3 à 5 j) | L1-02 | `pipeline/` [P] | En cours |

<a id="lot-2"></a>
## 2 · Vitrine

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L2-01 · Fondations du site vitrine](02-vitrine/L2-01-fondations-site.md) | P0 | L (3 à 5 j) | — | `site/`, `outils/` | À faire |
| [L2-02 · Logo, favicon et images de partage](02-vitrine/L2-02-logo-favicon.md) | P0 | M (1 à 3 j) | L0-01 | `site/` | À faire |
| [L2-03 · Visuels de l'appartement témoin](02-vitrine/L2-03-visuels-temoin.md) | P0 | M (1 à 3 j) | L1-12 | `site/`, `outils/` | À faire |
| [L2-04 · Page d'accueil particuliers](02-vitrine/L2-04-accueil-particuliers.md) | P0 | L (3 à 5 j) | L2-01, L2-02, L2-03 | `site/` | À faire |
| [L2-05 · Page conseillers (offre Pro)](02-vitrine/L2-05-page-conseillers.md) | P0 | M (1 à 3 j) | L2-01, L2-12 | `site/` | À faire |
| [L2-06 · Page promoteurs (offre Programme) et demande de démo](02-vitrine/L2-06-page-promoteurs.md) | P0 | M (1 à 3 j) | L2-01, L2-12 | `site/` | À faire |
| [L2-07 · Page marque blanche et partenaires](02-vitrine/L2-07-page-marque-blanche.md) | P1 | S (jusqu'à 1 j) | L2-01, L2-12 | `site/` | À faire |
| [L2-08 · Page tarifs](02-vitrine/L2-08-page-tarifs.md) | P0 | M (1 à 3 j) | L0-04, L1-16, L2-01 | `site/`, `outils/` | À faire |
| [L2-09 · Page de l'appartement témoin (visite de démonstration)](02-vitrine/L2-09-page-temoin.md) | P0 | M (1 à 3 j) | L1-05, L1-12, L1-15, L2-01 | `site/`, `outils/` | À faire |
| [L2-10 · Page Méthode](02-vitrine/L2-10-page-methode.md) | P1 | S (jusqu'à 1 j) | L0-07, L2-01 | `site/` | À faire |
| [L2-11 · Pages légales et signalement de contenu](02-vitrine/L2-11-pages-legales.md) | P0 | M (1 à 3 j) | L0-03, L0-06, L0-07, L0-09, L2-01 | `site/` | À faire |
| [L2-12 · Liste d'attente bêta et formulaires pros](02-vitrine/L2-12-liste-attente-formulaires.md) | P0 | M (1 à 3 j) | L0-03, L0-08, L2-01 | `site/`, `service/` | À faire |
| [L2-13 · Référencement technique, performance, accessibilité](02-vitrine/L2-13-seo-technique.md) | P1 | M (1 à 3 j) | L2-04 | `site/` | À faire |
| [L2-14 · Marquage prêt à brancher](02-vitrine/L2-14-marquage-pret.md) | P0 | S (jusqu'à 1 j) | L2-04 | `site/` | À faire |
| [L2-15 · Contrôles automatiques du site](02-vitrine/L2-15-controles-site.md) | P0 | M (1 à 3 j) | L0-08, L1-07, L2-04 | `outils/` | À faire |
| [L2-16 · Mise en ligne de la vitrine](02-vitrine/L2-16-mise-en-ligne-vitrine.md) | P0 | S (jusqu'à 1 j) | L0-01, L0-03, L0-08, L2-04, L2-11, L2-12, L2-15 | `site/`, `outils/` | À faire |
| [L2-17 · Guides de référencement](02-vitrine/L2-17-guides-seo.md) | P2 | L (3 à 5 j) | L2-16 | `site/` | À faire |
| [L2-18 · Entretiens de validation avec conseillers et promoteurs](02-vitrine/L2-18-entretiens-validation-pros.md) | P0 | M (1 à 3 j) | L1-12 | — | À faire |

<a id="lot-3"></a>
## 3 · Bêta express dockerisée (optionnelle)

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L3-01 · Image Docker de l'outil actuel](03-beta-express/L3-01-image-docker-outil.md) | P1 | M (1 à 3 j) | L1-01, L1-07, L1-09 | — | À faire |
| [L3-02 · Ouverture contrôlée derrière Cloudflare Access](03-beta-express/L3-02-acces-testeurs.md) | P1 | M (1 à 3 j) | L0-01, L3-01 | `pipeline/` [P] | À faire |
| [L3-03 · Cloisonnement minimal par testeur](03-beta-express/L3-03-cloisonnement-testeurs.md) | P1 | M (1 à 3 j) | L1-06, L3-02 | `pipeline/` [P] | À faire |
| [L3-04 · Budgets par testeur et plafond global](03-beta-express/L3-04-budgets-testeurs.md) | P1 | M (1 à 3 j) | L3-03 | `pipeline/` [P] | À faire |
| [L3-05 · Déploiement de la bêta express](03-beta-express/L3-05-deploiement-beta.md) | P1 | M (1 à 3 j) | L0-01, L0-08, L3-04 | — | À faire |
| [L3-06 · Programme de testeurs et retours](03-beta-express/L3-06-programme-testeurs.md) | P1 | M (1 à 3 j) | L0-07, L0-09, L1-05, L1-08, L1-10, L2-12, L3-05 | — | À faire |

<a id="lot-4"></a>
## 4 · Cœur réutilisable

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L4-01 · Configuration passée en paramètre au lieu de os.environ](04-coeur/L4-01-configuration-parametre.md) | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |
| [L4-02 · Journal des appels fiable et budget par plan](04-coeur/L4-02-journal-budget-plan.md) | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |
| [L4-03 · Nouvelles tentatives sur erreurs passagères](04-coeur/L4-03-nouvelles-tentatives.md) | P1 | S (jusqu'à 1 j) | L4-02 | `pipeline/` [P] | À faire |
| [L4-04 · Étapes de la chaîne extraites](04-coeur/L4-04-etapes-extraites.md) | P0 | L (3 à 5 j) | L4-01, L4-08 | `pipeline/` [P] | À faire |
| [L4-05 · Catalogue de messages pour l'utilisateur](04-coeur/L4-05-catalogue-messages.md) | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P] | À faire |
| [L4-06 · Moteur, bibliothèques 3D et polices servis par nous](04-coeur/L4-06-moteur-servi-versionne.md) | P0 | M (1 à 3 j) | L1-02, L1-07 | `pipeline/` [P], `moteur/` [M] | À faire |
| [L4-07 · Mention non contractuelle et marquage « généré automatiquement »](04-coeur/L4-07-mention-non-contractuelle.md) | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P], `moteur/` [M] | À faire |
| [L4-08 · Réglage niveaux_max : plans au-delà du périmètre validé refusés en service](04-coeur/L4-08-niveaux-max.md) | P0 | S (jusqu'à 1 j) | L4-01 | `pipeline/` [P] | À faire |
| [L4-09 · Aperçu rendu par le serveur et galerie adaptable](04-coeur/L4-09-apercu-serveur.md) | P0 | M (1 à 3 j) | L1-09 | `moteur/` [M] | À faire |
| [L4-10 · Visite dans le navigateur du client : compatibilité et repli](04-coeur/L4-10-visite-navigateur-client.md) | P0 | M (1 à 3 j) | L4-05, L4-06 | `moteur/` [M] | À faire |
| [L4-11 · Mode simple du moteur : réglages avancés et superposition masqués](04-coeur/L4-11-mode-simple-moteur.md) | P0 | S (jusqu'à 1 j) | L1-02 | `moteur/` [M] | À faire |
| [L4-12 · Qualité adaptative du moteur : textures, résolution, effets](04-coeur/L4-12-qualite-adaptative.md) | P0 | M (1 à 3 j) | L1-14, L1-15 | `moteur/` [M] | En cours |
| [L4-13 · Éclairage précalculé par le serveur : lumière peinte sur les murs et éclairage par pièce](04-coeur/L4-13-eclairage-precalcule.md) | P2 | L (3 à 5 j) | L1-09, L1-11, L4-12 | `moteur/` [M] | À faire |
| [L4-14 · Maquette compressée et itinéraires précalculés](04-coeur/L4-14-maquette-compressee-itineraires.md) | P1 | L (3 à 5 j) | L1-11, L4-06 | `moteur/` [M] | À faire |
| [L4-15 · Panoramas 360° rendus par le serveur à chaque arrêt](04-coeur/L4-15-panoramas-360.md) | P1 | M (1 à 3 j) | L1-09, L1-16 | `moteur/` [M], `pipeline/` [P] | En cours |
| [L4-16 · Visionneuse 360° sans moteur et navigation d'arrêt en arrêt](04-coeur/L4-16-visionneuse-360.md) | P1 | M (1 à 3 j) | L4-15 | `moteur/` [M] | En cours |
| [L4-17 · Ne dessiner que ce qu'on voit : maquette découpée par pièce et par niveau, culling par portails](04-coeur/L4-17-culling-pieces-maquette-decoupee.md) | P1 | L (3 à 5 j) | L1-15, L4-12 | `moteur/` [M] | En cours |
| [L4-18 · Textures compressées à plusieurs résolutions et niveaux de détail des équipements](04-coeur/L4-18-textures-compressees-niveaux-detail.md) | P1 | L (3 à 5 j) | L1-11, L4-06, L4-12 | `moteur/` [M] | En cours |
| [L4-19 · Outil local en mode admin : allègement, bandeau de débogage, vues rayons X et eau, test de bout en bout](04-coeur/L4-19-outil-admin-debogage-bout-en-bout.md) | P1 | M (1 à 3 j) | L4-11, L4-16 | `moteur/`, `pipeline/` [M] | À faire |

<a id="lot-5"></a>
## 5 · Socle en ligne

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L5-01 · Squelette du service : FastAPI, Postgres, Docker Compose, CI](05-socle/L5-01-squelette-service.md) | P0 | L (3 à 5 j) | L0-03, L1-07 | `service/` | À faire |
| [L5-02 · Stockage S3 privé et publié](05-socle/L5-02-stockage-s3.md) | P0 | M (1 à 3 j) | L5-01 | `service/` | À faire |
| [L5-03 · Authentification selon la décision D1 : lien magique, code, sessions](05-socle/L5-03-authentification.md) | P0 | L (3 à 5 j) | L0-02, L5-01, L5-14, L5-15 | `service/` | À faire |
| [L5-04 · Organisations, membres, rôles, invitations](05-socle/L5-04-organisations.md) | P0 | M (1 à 3 j) | L5-03, L5-15 | `service/` | À faire |
| [L5-05 · Plans, dépôt et contrôle d'accès](05-socle/L5-05-plans-depot-acces.md) | P0 | L (3 à 5 j) | L4-05, L5-02, L5-03, L5-15 | `service/` | À faire |
| [L5-06 · File de travaux et worker de lecture](05-socle/L5-06-file-worker-lecture.md) | P0 | L (3 à 5 j) | L4-04, L5-05, L5-07, L5-15 | `service/` | À faire |
| [L5-07 · Grand livre de crédits](05-socle/L5-07-grand-livre-credits.md) | P0 | M (1 à 3 j) | L5-01, L5-15 | `service/` | À faire |
| [L5-08 · Catalogue d'offres modifiable sans déploiement](05-socle/L5-08-catalogue-offres.md) | P0 | M (1 à 3 j) | L5-07 | `service/` | À faire |
| [L5-09 · Budgets IA à quatre niveaux et clés séparées](05-socle/L5-09-budgets-ia.md) | P0 | M (1 à 3 j) | L4-02, L5-06, L5-15 | `service/` | À faire |
| [L5-10 · Worker de rendu en conteneur et contrôle du rendu](05-socle/L5-10-worker-rendu.md) | P0 | L (3 à 5 j) | L1-09, L1-11, L1-12, L4-06, L4-09, L5-02, L5-06 | `service/` | À faire |
| [L5-11 · Livraison en deux temps : visite d'abord, images en direct](05-socle/L5-11-livraison-deux-temps.md) | P0 | M (1 à 3 j) | L5-10, L5-06, L4-07 | `service/`, `outils/` | À faire |
| [L5-12 · Publication et pages de visite](05-socle/L5-12-publication-visites.md) | P0 | L (3 à 5 j) | L5-02, L4-06, L5-05, L1-04 | `service/`, `outils/` | À faire |
| [L5-13 · Partages par jeton](05-socle/L5-13-partages-jetons.md) | P0 | M (1 à 3 j) | L5-12 | `service/` | À faire |
| [L5-14 · E-mails transactionnels](05-socle/L5-14-emails.md) | P0 | M (1 à 3 j) | L5-01, L1-04 | `service/` | À faire |
| [L5-15 · Journal d'événements serveur](05-socle/L5-15-journal-evenements.md) | P0 | M (1 à 3 j) | L5-01 | `service/` | À faire |
| [L5-16 · Supervision et alertes](05-socle/L5-16-supervision.md) | P0 | M (1 à 3 j) | L5-06 | `service/` | À faire |
| [L5-17 · Administration interne (1/2) : comptes, plans, coûts, rejeu, défauts](05-socle/L5-17-administration.md) | P0 | L (3 à 5 j) | L5-07, L5-09, L5-08 | `service/` | À faire |
| [L5-18 · Préproduction, déploiement automatique, secrets](05-socle/L5-18-preproduction-deploiement.md) | P0 | M (1 à 3 j) | L5-01, L0-08 | `service/`, `outils/` | À faire |
| [L5-19 · Tests de sécurité automatiques et limites de débit](05-socle/L5-19-securite-tests.md) | P0 | M (1 à 3 j) | L5-05, L5-13 | `service/` | À faire |
| [L5-20 · Conservation et purge des données](05-socle/L5-20-conservation-purge.md) | P0 | M (1 à 3 j) | L5-02 | `service/` | À faire |
| [L5-21 · Exploitation : incidents, mode maintenance, page d'état](05-socle/L5-21-exploitation-incidents-maintenance.md) | P0 | M (1 à 3 j) | L0-09, L5-16, L5-18, L5-26 | `service/` | À faire |
| [L5-22 · Capacité : limites de concurrence et essai de charge sans payer](05-socle/L5-22-capacite-concurrence-charge.md) | P1 | M (1 à 3 j) | L5-06, L5-10, L4-03 | `service/`, `outils/` | À faire |
| [L5-23 · Dépôt provisoire anonyme de 24 h](05-socle/L5-23-depot-provisoire-anonyme.md) | P0 | M (1 à 3 j) | L5-05, L5-06 | `service/` | À faire |
| [L5-24 · Connexion Google](05-socle/L5-24-connexion-google.md) | P1 | M (1 à 3 j) | L5-03 | `service/` | À faire |
| [L5-25 · Administration (2/2) : catalogue, crédits, gestes commerciaux, journal de l'équipe](05-socle/L5-25-administration-catalogue-credits.md) | P0 | M (1 à 3 j) | L5-08, L5-17 | `service/` | À faire |
| [L5-26 · Sauvegardes et restauration testée](05-socle/L5-26-sauvegardes-restauration.md) | P0 | M (1 à 3 j) | L5-18 | `service/` | À faire |
| [L5-27 · Panoramas 360° dans le socle : rendu, marquage, publication, partage](05-socle/L5-27-panoramas-360-socle.md) | P1 | M (1 à 3 j) | L4-15, L4-16, L5-11, L5-12, L5-13 | `service/` | À faire |
| [L5-28 · Précalcul serveur dans la chaîne en ligne : éclairage, maquette compressée, itinéraires](05-socle/L5-28-precalcul-chaine-en-ligne.md) | P1 | M (1 à 3 j) | L4-13, L4-14, L5-06, L5-10, L5-12 | `service/` | À faire |
| [L5-29 · BLOQUANT avant l'ouverture du SaaS : mode admin et documents des plans hors de portée du public](05-socle/L5-29-mode-admin-hors-public.md) | P0 | M (1 à 3 j) | L4-19, L5-03, L5-04 | `moteur/`, `pipeline/`, `outils/`, `service/` | À faire |

<a id="lot-6"></a>
## 6 · Parcours particulier et bêta fermée

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L6-01 · Dépôt sur la vitrine puis création de compte](06-parcours-particulier/L6-01-depot-puis-compte.md) | P0 | L (3 à 5 j) | L2-04, L5-03, L5-05, L5-15, L5-23, L6-02, L6-06 | `site/`, `service/` | À faire |
| [L6-02 · Qualification bon marché avant toute lecture payante](06-parcours-particulier/L6-02-qualification-avant-lecture.md) | P0 | M (1 à 3 j) | L4-04 | `pipeline/` [P], `service/` | À faire |
| [L6-03 · Écran d'attente « chantier » avec images en direct](06-parcours-particulier/L6-03-attente-chantier.md) | P0 | M (1 à 3 j) | L5-11, L6-01 | `service/` | À faire |
| [L6-04 · Calibration au clic dans le nouveau parcours](06-parcours-particulier/L6-04-calibration-parcours.md) | P0 | M (1 à 3 j) | L6-03 | `service/` | À faire |
| [L6-05 · Page d'aperçu gratuit](06-parcours-particulier/L6-05-page-apercu-gratuit.md) | P0 | M (1 à 3 j) | L4-09, L5-11, L4-07 | `service/`, `outils/` | À faire |
| [L6-06 · Plan offert et anti-abus](06-parcours-particulier/L6-06-credit-offert-anti-abus.md) | P0 | M (1 à 3 j) | L5-07, L5-09 | `service/` | À faire |
| [L6-07 · Mes plans et retour sur mobile](06-parcours-particulier/L6-07-mes-plans-mobile.md) | P1 | M (1 à 3 j) | L6-01 | `service/`, `outils/` | À faire |
| [L6-08 · Partage de la visite et bouche-à-oreille](06-parcours-particulier/L6-08-partage-famille.md) | P1 | M (1 à 3 j) | L5-13 | `service/`, `site/` | À faire |
| [L6-09 · Signaler un défaut, qui devient un contrôle](06-parcours-particulier/L6-09-signaler-defaut.md) | P0 | M (1 à 3 j) | L5-17 | `service/` | À faire |
| [L6-10 · Ouverture de la bêta fermée](06-parcours-particulier/L6-10-ouverture-beta-fermee.md) | P0 | S (jusqu'à 1 j) | L0-09, L1-05, L1-08, L1-10, L1-15, L2-11, L4-07, L4-10, L4-11, L5-16, L5-18, L5-19, L5-20, L5-21, L5-25, L5-26, L6-01, L6-02, L6-03, L6-04, L6-05, L6-06, L6-09, L6-11 | — | À faire |
| [L6-11 · Support client : adresse, formulaire, réponses types, délais](06-parcours-particulier/L6-11-support-client.md) | P0 | M (1 à 3 j) | L5-14, L5-17, L0-09 | `service/`, `site/` | À faire |
| [L6-12 · Preuves : témoignages autorisés et chiffres mesurés](06-parcours-particulier/L6-12-preuves-temoignages.md) | P1 | S (jusqu'à 1 j) | L6-10, L0-07 | `site/` | À faire |
| [L6-13 · Aperçu gratuit en 360° (si l'utilisateur le confirme)](06-parcours-particulier/L6-13-apercu-gratuit-360.md) | P1 | M (1 à 3 j) | L1-16, L5-08, L5-27, L6-05, L6-08 | `service/` | À faire |

<a id="lot-7"></a>
## 7 · Mesure et entonnoirs

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L7-01 · Umami auto-hébergé, réglage minimal](07-mesure/L7-01-umami-installation.md) | P0 | M (1 à 3 j) | L5-18 | `service/`, `site/` | À faire |
| [L7-02 · Bandeau de consentement](07-mesure/L7-02-consentement.md) | P0 | M (1 à 3 j) | L7-01 | `site/`, `service/` | À faire |
| [L7-03 · Attribution des inscriptions](07-mesure/L7-03-attribution.md) | P0 | M (1 à 3 j) | L5-15, L6-01, L7-02 | `site/`, `service/` | À faire |
| [L7-04 · Événements du site et de l'application](07-mesure/L7-04-evenements-navigateur.md) | P0 | M (1 à 3 j) | L7-01, L2-14, L4-06 | `moteur/` [M], `site/`, `service/` | À faire |
| [L7-05 · Entonnoirs et objectifs](07-mesure/L7-05-entonnoirs.md) | P1 | S (jusqu'à 1 j) | L7-04 | `outils/` | À faire |
| [L7-06 · Tableaux de bord métier](07-mesure/L7-06-tableaux-de-bord.md) | P0 | M (1 à 3 j) | L5-15, L5-09 | `service/` | À faire |
| [L7-07 · Recette automatique des événements](07-mesure/L7-07-recette-evenements.md) | P1 | M (1 à 3 j) | L7-04 | `outils/`, `service/` | À faire |
| [L7-08 · Analyse d'exemption CNIL documentée](07-mesure/L7-08-analyse-exemption-cnil.md) | P1 | S (jusqu'à 1 j) | L7-01 | — | À faire |

<a id="lot-8"></a>
## 8 · Paiement des particuliers

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L8-01 · Paiement Stripe des particuliers](08-paiement/L8-01-stripe-checkout.md) | P0 | L (3 à 5 j) | L5-08, L0-06 | `service/` | À faire |
| [L8-02 · Déblocage immédiat de la visite](08-paiement/L8-02-deblocage-visite.md) | P0 | M (1 à 3 j) | L8-01, L6-05 | `service/` | À faire |
| [L8-03 · Parcours légal des particuliers](08-paiement/L8-03-parcours-legal-b2c.md) | P0 | L (3 à 5 j) | L8-01, L0-07, L5-14 | `service/` | À faire |
| [L8-04 · CGV particuliers, garantie légale, médiateur](08-paiement/L8-04-cgv-mediateur.md) | P0 | M (1 à 3 j) | L0-07 | `site/`, `service/` | À faire |
| [L8-05 · Factures, historique d'achats, remboursements](08-paiement/L8-05-factures-historique.md) | P0 | M (1 à 3 j) | L8-01 | `service/` | À faire |
| [L8-06 · Tests de prix](08-paiement/L8-06-tests-prix.md) | P2 | S (jusqu'à 1 j) | L7-05, L7-06, L8-01 | `service/` | À faire |
| [L8-07 · Ouverture publique : plan offert et vente aux particuliers](08-paiement/L8-07-ouverture-publique.md) | P0 | S (jusqu'à 1 j) | L0-01, L0-04, L2-16, L5-29, L6-10, L7-06, L8-01, L8-02, L8-03, L8-04, L8-05, L8-08, L8-09 | `site/`, `service/` | À faire |
| [L8-08 · Téléchargements : photos, plan 2D et fiche en PDF](08-paiement/L8-08-telechargements-pdf.md) | P0 | M (1 à 3 j) | L8-02, L4-07 | `service/`, `outils/` | À faire |
| [L8-09 · Budget du plan offert indexé sur la marge et coupe-circuit](08-paiement/L8-09-budget-offert-coupe-circuit.md) | P0 | M (1 à 3 j) | L5-09, L5-15, L7-06, L8-01 | `service/` | À faire |

<a id="lot-9"></a>
## 9 · Offre conseillers (Pro)

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L9-01 · Abonnements Pro (1/2) : formules, quotas, report, résiliation](09-conseillers/L9-01-abonnements-pro.md) | P0 | L (3 à 5 j) | L2-18, L5-04, L8-01, L9-08 | `service/` | À faire |
| [L9-02 · Essai Pro](09-conseillers/L9-02-essai-pro.md) | P0 | M (1 à 3 j) | L9-01, L9-08 | `service/` | À faire |
| [L9-03 · Prise en main Pro](09-conseillers/L9-03-prise-en-main-pro.md) | P1 | M (1 à 3 j) | L1-12, L9-02, L9-04, L9-06 | `service/` | À faire |
| [L9-04 · Liens prospects sans traceur illicite](09-conseillers/L9-04-liens-prospects.md) | P0 | L (3 à 5 j) | L0-07, L5-13, L7-04, L9-06, L9-08 | `service/` | À faire |
| [L9-05 · Tableau de suivi des prospects](09-conseillers/L9-05-suivi-prospects.md) | P1 | M (1 à 3 j) | L9-04 | `service/` | À faire |
| [L9-06 · Marque du conseiller sur la visite](09-conseillers/L9-06-marque-conseiller.md) | P0 | M (1 à 3 j) | L5-12 | `moteur/` [M], `service/` | À faire |
| [L9-07 · Réglages personnalisés évalués avant activation](09-conseillers/L9-07-reglages-ia-evalues.md) | P2 | M (1 à 3 j) | L4-01 | `pipeline/` [P], `service/` | À faire |
| [L9-08 · Droits des conseillers : accord du promoteur, CGV pro, DPA](09-conseillers/L9-08-droits-pro.md) | P0 | M (1 à 3 j) | L0-07 | `service/`, `site/` | À faire |
| [L9-09 · Codes à offrir à ses clients](09-conseillers/L9-09-codes-a-offrir.md) | P2 | M (1 à 3 j) | L9-01, L9-12 | `service/` | À faire |
| [L9-10 · Facturation électronique](09-conseillers/L9-10-facturation-electronique.md) | P0 | M (1 à 3 j) | L9-01, L0-06 | `service/` | À faire |
| [L9-11 · Premiers conseillers (bêta fondateurs)](09-conseillers/L9-11-premiers-conseillers.md) | P0 | M (1 à 3 j) | L2-05, L1-12 | — | À faire |
| [L9-12 · Partenariats d'orientation et premier partenaire codes](09-conseillers/L9-12-partenariats-orientation.md) | P1 | M (1 à 3 j) | L2-07, L1-12 | — | À faire |
| [L9-13 · Abonnements Pro (2/2) : recharges, places, annuel, remise fondateurs](09-conseillers/L9-13-abonnements-pro-options.md) | P1 | M (1 à 3 j) | L9-01 | `service/` | À faire |

<a id="lot-10"></a>
## 10 · Offre promoteurs (Programme)

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L10-01 · Offre et contrat promoteur](10-promoteurs/L10-01-offre-contrat-promoteur.md) | P0 | M (1 à 3 j) | L0-07 | — | À faire |
| [L10-02 · Programmes, lots et import](10-promoteurs/L10-02-programmes-import.md) | P0 | L (3 à 5 j) | L1-10, L2-18, L5-06, L5-09, L6-02, L10-01 | `service/` | À faire |
| [L10-03 · Contrôle et validation des lots par le promoteur](10-promoteurs/L10-03-validation-lots.md) | P0 | M (1 à 3 j) | L10-02 | `service/` | À faire |
| [L10-04 · Intégration au site du promoteur](10-promoteurs/L10-04-integration-site.md) | P0 | L (3 à 5 j) | L5-12, L7-04 | `service/` | À faire |
| [L10-05 · Portail distributeurs](10-promoteurs/L10-05-portail-distributeurs.md) | P2 | M (1 à 3 j) | L9-04, L10-04 | `service/` | À faire |
| [L10-06 · Superposition du plan autorisée](10-promoteurs/L10-06-superposition-autorisee.md) | P2 | S (jusqu'à 1 j) | L5-12 | `service/` | À faire |
| [L10-07 · SSO à la demande](10-promoteurs/L10-07-sso.md) | P2 | M (1 à 3 j) | L5-03 | `service/` | À faire |
| [L10-08 · Premier pilote promoteur](10-promoteurs/L10-08-pilote-promoteur.md) | P0 | M (1 à 3 j) | L10-01, L10-02, L10-03, L10-04, L10-09 | — | À faire |
| [L10-09 · Facturation des promoteurs et réversibilité](10-promoteurs/L10-09-facturation-promoteurs.md) | P0 | M (1 à 3 j) | L9-10, L10-01 | `service/` | À faire |

<a id="lot-11"></a>
## 11 · Marque blanche

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L11-01 · Domaines des clients et certificats](11-marque-blanche/L11-01-domaines-clients.md) | P0 | L (3 à 5 j) | L5-12, L9-11, L10-04, L10-08 | `service/` | À faire |
| [L11-02 · Thème complet par organisation](11-marque-blanche/L11-02-theme-organisation.md) | P0 | M (1 à 3 j) | L9-06, L11-01 | `service/` | À faire |
| [L11-03 · Clés IA par client](11-marque-blanche/L11-03-cles-ia-client.md) | P2 | S (jusqu'à 1 j) | L5-09 | `service/` | À faire |
| [L11-04 · Contrat et mise en service d'une instance](11-marque-blanche/L11-04-instance-contrat.md) | P1 | M (1 à 3 j) | L0-07, L11-01, L11-02 | `service/` | À faire |

<a id="lot-12"></a>
## 12 · Publicité et conversions

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L12-01 · Conversions Meta par le serveur](12-publicite/L12-01-meta-capi.md) | P0 | M (1 à 3 j) | L7-03, L5-15, L12-03 | `service/` | À faire |
| [L12-02 · Conversions Google par le serveur](12-publicite/L12-02-google-conversions.md) | P0 | M (1 à 3 j) | L7-03, L5-15, L12-03 | `service/` | À faire |
| [L12-03 · Consentement étendu aux traceurs publicitaires](12-publicite/L12-03-bandeau-publicite.md) | P0 | M (1 à 3 j) | L7-02 | `site/`, `service/` | À faire |
| [L12-04 · Premières campagnes](12-publicite/L12-04-premieres-campagnes.md) | P1 | M (1 à 3 j) | L12-01, L12-02 | — | À faire |
| [L12-05 · Tests A/B de la vitrine](12-publicite/L12-05-tests-ab-vitrine.md) | P2 | M (1 à 3 j) | L7-05 | `site/`, `service/` | À faire |

<a id="lot-13"></a>
## 13 · Après lancement

| Ticket | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| [L13-01 · Accélérer le rendu](13-apres-lancement/L13-01-accelerer-rendu.md) | P1 | M (1 à 3 j) | L5-10 | `moteur/` [M], `service/` | À faire |
| [L13-02 · Galerie photo complète](13-apres-lancement/L13-02-galerie-complete.md) | P1 | M (1 à 3 j) | L13-01, L8-02 | `service/` | À faire |
| [L13-03 · Vue du dessus manipulable dans l'aperçu (à tester)](13-apres-lancement/L13-03-apercu-interactif.md) | P2 | S (jusqu'à 1 j) | L6-05, L12-05, L13-01 | `moteur/` [M], `service/` | À faire |
| [L13-04 · Option meublé et aménagement](13-apres-lancement/L13-04-option-meuble.md) | P2 | L (3 à 5 j) | L1-02 | `pipeline/` [P], `moteur/` [M] | À faire |
| [L13-05 · Options lumière réelle, réalisme et 4K](13-apres-lancement/L13-05-option-realisme.md) | P2 | L (3 à 5 j) | L13-01 | `moteur/` [M] | À faire |
| [L13-06 · Option variante TMA](13-apres-lancement/L13-06-option-tma.md) | P2 | L (3 à 5 j) | L1-02 | `pipeline/` [P], `moteur/` [M] | À faire |
| [L13-07 · Vue de la résidence](13-apres-lancement/L13-07-vue-residence.md) | P2 | L (3 à 5 j) | L10-02 | `moteur/` [M] | À faire |
| [L13-08 · Plans sur plusieurs niveaux en service](13-apres-lancement/L13-08-plusieurs-niveaux.md) | P1 | M (1 à 3 j) | — | `pipeline/` [P] | Fait (27/09/2026) |
