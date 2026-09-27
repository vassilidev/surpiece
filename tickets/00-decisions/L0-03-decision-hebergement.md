# L0-03 · Valider l'hébergement et la pile de déploiement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | S (jusqu'à 1 j) | — | — | À faire |

## Pourquoi
Plusieurs choix sont déjà faits par l'utilisateur (27/09/2026) : Docker Compose pour se déployer partout, stockage S3, rendu qui fonctionne partout avec SwiftShader dans un conteneur sans GPU comme base, et côté serveur seulement la visite de contrôle et les images d'aperçu (décisions 2, 4 et 5). D3 est tranchée (arbitrage R3 : SwiftShader dans un conteneur, par défaut et partout) : il reste à la consigner, puis à valider l'hébergeur (D2), les e-mails (D4), la supervision (D5), la vitrine (D6) et le fournisseur IA (D7). L0-08 (comptes), L5-01 (squelette) et L5-18 (préproduction) en dépendent.

## À faire
1. **Consigner les décisions déjà prises** dans ARCHITECTURE.md § 3 :
   - D3 tranchée (R3) : rendu en conteneur sans GPU (SwiftShader, `--enable-unsafe-swiftshader`) par défaut et partout, sur la VM en Docker Compose, choisi par `RENDU_CHROME` (L1-09) ; Serverless Jobs, GPU ou Mac restent des accélérations optionnelles après la mise en ligne (L13-01), jamais obligatoires ; l'essai M2.7a devient une mesure informative (voir L5-10) ;
   - le serveur ne rend que la visite de contrôle et, dans cet ordre, la vue du dessus 3D découpée, le plan 2D coté, 2 photos ; la visite se calcule dans le navigateur du client. Mettre à jour § 2.1 (ligne « Worker rendu »), § 2.3 (étape 7) et § 9.1 (ligne « Rendu »).
2. **Donner l'ordre de grandeur de la charge de rendu**, avec les mesures existantes (Mac M3, `recherche/hebergement.md` § 2.1) : 3 photos en 215 s en SwiftShader contre 19 s en Metal, 4,7 cœurs occupés en moyenne ; visite de contrôle 13 à 14 s. Estimation pour 4 images : environ 4 à 5 min sur M3, 1,5 à 2 fois plus sur des vCPU de serveur (estimation, à mesurer au T0 par L5-11).
3. **Dimensionnement de départ** : la PLAY2-MICRO recommandée (4 vCPU, 8 Go) porte aussi Caddy, FastAPI, le worker de lecture et Umami. Un rendu SwiftShader qui occupe près de 5 cœurs peut la saturer. Options : (a) service `rendu` du Compose limité à 1 travail à la fois sur la même VM, mesuré au T0 ; (b) VM plus grosse ; (c) VM de rendu séparée, toujours en Docker Compose. Recommandation : (a), avec seuil de bascule écrit. Serverless Jobs n'est pas une option de lancement (R3) : accélération optionnelle, L13-01.
4. **D2, hébergeur** : Scaleway Paris (recommandé : un seul fournisseur français, VM, Postgres géré, S3, Edge Services, TEM, Secret Manager, environ 65 à 75 €/mois au lancement) ; alternatives Clever Cloud pour le web (environ 55 €) avec le rendu ailleurs, Hetzner (environ 25 €, Postgres à administrer), OVHcloud. Écrire la **règle de portabilité** qui découle de la décision 2 : aucune dépendance propre à un fournisseur dans le code, sauf derrière une interface (S3 compatible, SMTP, Postgres standard, OIDC) ; aucun composant propre à un hébergeur n'est obligatoire (R3) ; Serverless Jobs seulement comme exécutant optionnel derrière le contrat de rendu, après la mise en ligne (L13-01).
5. **D4, e-mails** : Scaleway TEM (300 e-mails gratuits par mois, puis 0,25 € les 1 000) ou Brevo (prix et hébergement non vérifiés). Interface SMTP ou API remplaçable ; sous-domaine `mail.<domaine>` avec SPF, DKIM et DMARC ; aucun pixel de suivi.
6. **D5, supervision** : Sentry en région UE (Francfort) — **la région se choisit à la création de l'organisation et ne change plus**, à décider avant L0-08 ; Better Stack gratuit pour la disponibilité et les battements de cœur ; Scaleway Cockpit ; aucun script Sentry dans les pages de visite.
7. **D6, vitrine** : Scaleway Object Storage et Edge Services (palier Professional à 12,99 €/mois, un pipeline pour la vitrine et un pour `cdn.<domaine>`) ou Cloudflare Pages (gratuit, aperçus par branche, société américaine ; la vitrine ne contient pas de données personnelles).
8. **D7, fournisseur IA** : OpenRouter avec ZDR (consigne du projet), second verrou par les plafonds des clés (décision 3) ; décision à rouvrir avant le premier promoteur (routage UE en offre Business, 8 % de frais au lieu de 5,5 %, environ 0,03 à 0,05 $ de plus par plan ; ou contrat direct avec Anthropic).
9. **Autres fournisseurs à confirmer** dans la foulée : Umami auto-hébergé dans l'UE sur notre infrastructure (décision 9), Cloudflare pour Access (bêta express, L3-02) et Turnstile (anti-abus, L6-06).
10. **Qui décide** : l'utilisateur. **Où consigner** : ARCHITECTURE.md § 0 (tableau), § 3 (D2 à D7, « Décision du JJ/MM/AAAA »), § 2.1, § 2.3, § 9.1. Transmettre la liste des fournisseurs et des régions à L0-08 et L0-09.

## Critères d'acceptation
- [ ] D2, D4, D5, D6 et D7 portent chacun une décision datée dans ARCHITECTURE.md § 3 et dans le tableau du § 0.
- [ ] D3 est marqué tranché avec les termes de la décision 4 et de R3 ; § 2.1, § 2.3 et § 9.1 ne présentent plus un Mac mini, un GPU ni Serverless Jobs comme prérequis du lancement.
- [ ] La règle de portabilité (interfaces autorisées, dépendances interdites) est écrite ; L5-18 la vérifiera par un déploiement sur une VM d'un autre fournisseur.
- [ ] L'hypothèse de dimensionnement et son seuil de bascule sont écrits, avec la mesure à faire au T0 (L5-11).
- [ ] La liste des fournisseurs, avec pays et région, est transmise à L0-08 et L0-09.

## Points d'attention
- **Tranché : R3.** L'ancienne recommandation de D3 (« Serverless Jobs s'il ajoute moins de 5 min, sinon Mac mini », décidée par l'essai M2.7a) est dépassée : SwiftShader en conteneur par défaut et partout. Ne pas effacer l'analyse d'ARCHITECTURE.md, la marquer dépassée.
- Serverless Jobs est propre à Scaleway : il n'est jamais obligatoire (R3), sinon il contredirait « déployable partout ».
- **Tranché : R12.** Aucun délai n'est affiché en dur (ni « un quart d'heure », ni « 8 à 15 minutes ») : les textes portent le marqueur ‹délai› jusqu'à la mesure en production (T0, L5-11). Pour mémoire, en SwiftShader les photos sont environ 11 fois plus lentes qu'avec GPU, mais on ne rend que 4 images au lancement.
- SwiftShader avec `--enable-unsafe-swiftshader` n'est pas prévu pour du contenu non fiable : conteneur de rendu isolé et sans secret (`recherche/hebergement.md` § 2.2).
- Prix relevés le 27/09/2026 ; nombre de domaines par pipeline Edge Services non vérifié.

## Références
- `produit/ARCHITECTURE.md` § 0, § 2.1, § 2.3, § 3 (D2 à D7, « Choix proposés comme acquis »), § 9.1, § 9.2, § 10
- `produit/recherche/hebergement.md` § 0, § 2.1 à § 2.3, § 3.3, § 4, § 5, § 7, § 9, § 10, § 11
- `produit/recherche/audit-code.md` B11
- `produit/MESSAGES.md` § 0.3 ; `produit/OFFRES.md` § 1 (délai), § 10 (risque 3)

## Hors périmètre
- Ouverture des comptes : L0-08.
- Images Docker : L3-01 (outil actuel), L5-01 (service).
- Worker de rendu et contrôle du rendu : L5-10 ; mesure T0 du délai : L5-11.
- Accélération du rendu (GPU, Mac, une tâche par image) : L13-01.
