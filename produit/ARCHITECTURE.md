# Architecture cible et chemin de migration

Document du 27/09/2026. Il tire des recherches de `produit/recherche/` (audit-code, hebergement, auth-paiement, suivi, juridique, marche, nom) et du code du dépôt une architecture cible, les décisions qui restent à prendre et un ordre de travail en tickets courts. Il ne répète pas ces recherches : il y renvoie.

Aligné le 27/09/2026 sur les décisions de l'utilisateur (`PLAN.md` § 2.1) et sur les arbitrages qui en découlent. **Ordre de primauté** quand deux documents divergent : décisions de l'utilisateur, puis arbitrages, puis `OFFRES.md` pour les offres et les crédits (règles commerciales, ordre de consommation, validités, durées d'hébergement et de conservation), puis ce document pour la technique.

Conventions :
- **Décisions.** « Décision n° N » renvoie aux décisions de l'utilisateur du 27/09/2026 (`PLAN.md` § 2.1). D1 à D7 sont les questions techniques de ce document (§ 3).
- **Tickets.** Les identifiants M0.1 à M5.6 du § 8.3 correspondent aux tickets `L*` du dossier `tickets/`, qui font foi pour le détail. La correspondance est donnée au § 8.3.
- **Nom du produit.** « Sur Pièce » est un nom de travail, **non validé** (plan B : « Avant-Clés », voir `recherche/nom.md`). Il n'apparaît que dans ce paragraphe. Ailleurs, ce document dit « le produit » et écrit `<domaine>` pour le domaine (`surpiece.fr` si le nom est retenu). Dans le code, le nom et les domaines ne vivent que dans la configuration (`MARQUE_NOM`, `DOMAINE_PRINCIPAL`), jamais en dur : la marque blanche l'exige de toute façon. Changer de nom = changer ce paragraphe et ces deux valeurs.
- **Références au code.** Les `fichier:ligne` ont été relevées le 27/09/2026 sur l'arbre de travail, que le travail sur les duplex modifie en parallèle : elles bougeront. `recherche/audit-code.md` cite le commit `fdc073e`. En cas d'écart, chercher le nom de la fonction.
- **Marqueurs de ticket.** `[P]` : le ticket modifie `pipeline/`. `[M]` : il modifie `moteur/`. Ces tickets suivent les règles de coordination du § 8.1.
- « Mesuré » renvoie à une mesure citée dans les recherches. « Estimation » signale un calcul ou un jugement non mesuré.

---

## 0. En bref

**Architecture.** Un site vitrine statique, assemblé par un petit script Python sans dépendance (`outils/site.py`) ; une application web/API FastAPI sans état ; Postgres, qui porte aussi la file de travaux (Procrastinate), le grand livre de crédits et le catalogue d'offres ; un worker « lecture » en Python, qui exécute la chaîne actuelle sans la réécrire ; un worker « rendu » Chrome en SwiftShader dans un conteneur, sans secret, qui ne rend que les images d'aperçu (vue du dessus 3D découpée, plan 2D coté, 2 photos) ; un stockage objet S3 coupé en deux (privé et publié), avec un CDN devant la partie publiée ; des e-mails transactionnels ; la supervision. **La visite 3D se calcule dans le navigateur du client** (décision n° 5). Le tout tourne en Docker Compose et se déploie chez tout hébergeur (décision n° 2) : aucun composant propre à un hébergeur n'est obligatoire. Recommandation : tout en France chez un seul hébergeur, sauf l'appel au modèle (OpenRouter, sans conservation des données).

**Décisions à prendre** (détail au § 3) :

| # | Décision | Recommandation | Alternative sérieuse | À trancher avant |
|---|---|---|---|---|
| D1 | Authentification (non tranchée, décision n° 8) | Auth maison : lien magique (avec code de secours) et Google, derrière une couche d'identité interchangeable | Auth0 (préférence initiale de l'utilisateur), avec contraintes ; Supabase Auth en région Paris | M2.3 (L5-03) ; décision : L0-02 |
| D2 | Hébergement | Docker Compose et S3 **décidés** (n° 2). Hébergeur recommandé : Scaleway Paris, un seul fournisseur | Clever Cloud pour le web ; Hetzner, moins cher mais plus à administrer ; OVHcloud | M2.1 (L5-01) ; décision : L0-03 |
| D3 | Rendu | **Tranchée** (n° 4) : Chrome en SwiftShader dans un conteneur, par défaut et partout. Serverless Jobs, GPU ou Mac mini ne sont que des accélérations optionnelles après le lancement (L13-01) | — | tranchée |
| D4 | E-mails | Scaleway TEM | Brevo | M2.10 (L5-14) |
| D5 | Supervision | Sentry en région UE, Better Stack gratuit, Cockpit | UptimeRobot ; journaux seuls au tout début | M2.11 (L5-16) |
| D6 | Vitrine | Scaleway Object Storage et Edge Services ; pages assemblées par `outils/site.py` | Cloudflare Pages | mise en ligne de la vitrine (L2-16) |
| D7 | Fournisseur IA | OpenRouter avec ZDR (consigne actuelle), plafonds des clés en second verrou (n° 3) ; décision à rouvrir avant le premier promoteur | Anthropic en direct ; routage UE d'OpenRouter | M5.1 (L10-02) |

**Chemin de migration** (§ 8), chaque ticket livrable et testable, l'outil local toujours en état de marche. Entre parenthèses, les lots du dossier `tickets/` :
0. Filets de sécurité et correctifs immédiats, sur l'outil local : jeu de référence rejouable sans payer, appartement témoin fictif (`references/temoin/`), contrôle « aucun texte technique », fuite de `.env` par les scripts Chrome (B6), rendu Chrome portable (lot 1).
1. Cœur réutilisable : configuration passée en paramètre au lieu de `os.environ`, budgets IA, étapes découpées, catalogue de messages, moteur servi par nous et versionné, images d'aperçu rendues par le serveur, visite dans le navigateur du client avec repli. Le comportement local ne change pas (lot 4).
2. Socle en ligne et bêta fermée : FastAPI, Postgres, file, stockage S3, comptes, contrôle d'accès, grand livre, catalogue d'offres, budgets IA, rendu en conteneur, livraison en deux temps, publication, partages, e-mails, préproduction (lot 5), puis parcours particulier sans achat (lot 6).
3. Paiement des particuliers : Stripe, déblocage de l'aperçu sans nouvelle lecture, parcours de rétractation (lot 8).
4. Conseillers : abonnements, réglages par organisation, liens prospects (lot 9).
5. Promoteurs et marque blanche : programmes et lots, import, intégration iframe, domaines des clients, SSO (lots 10 et 11).

**Invariants.** L'outil local (`python3 pipeline/serveur.py`, `outils/finalise.sh`) marche à chaque ticket. Aucun fichier du promoteur ni aucune réponse IA n'est publié. Une page d'aperçu ne reçoit ni le moteur ni `plan.json`. Rien n'est publié sans visite de contrôle réussie. Aucun texte technique n'atteint l'écran. Chaque dollar d'IA est réservé avant d'être dépensé, et un plan coûte 3 $ d'IA au plus, toutes passes et relances confondues. Tout défaut trouvé devient un contrôle. Rien n'est promis avant d'avoir été validé plan par plan (les duplex restent refusés en production).

---

## 1. Principes

1. **Une seule chaîne, deux modes d'exécution.** Le service en ligne appelle le même code que l'outil local (`pipeline/`, `moteur/`), à travers trois interfaces : configuration, suivi de progression, stockage. Pas de copie ni de réécriture. Un correctif de lecture profite aux deux.
2. **Le worker travaille sur un dossier local.** Il télécharge les entrées d'un plan dans un dossier temporaire organisé comme `plans/<id>/` aujourd'hui, exécute les étapes, puis téléverse les sorties. `lire.py`, `murs.py`, `controle.mjs` et `photos.mjs` n'ont pas à connaître S3.
3. **Liste blanche pour tout ce qui sort.** Est publié ce qui est nommé, rien d'autre. C'est la logique de `servable` (`pipeline/serveur.py:461-464`), étendue à la publication.
4. **Aucun texte technique à l'écran.** Les étapes renvoient un code ; un catalogue le traduit pour l'utilisateur ; le détail part au journal.
5. **Budget avant dépense.** Les blocages sont d'abord dans notre logiciel : on sait qui consomme quoi (coût par organisation et par travail) et des plafonds bloquent par appel, par plan (3 $, toutes passes et relances confondues), par organisation, par jour pour le plan offert et globalement. Les plafonds des clés OpenRouter ne sont qu'un second verrou (décision n° 3, § 6.5).
6. **Tout défaut devient un contrôle.** Chaque ticket livre le test qui empêche la régression.
7. **Plan par plan.** Une capacité n'est ouverte en production qu'après validation sur des plans réels. Réglage `niveaux_max = 1` en production tant que les duplex ne sont pas validés.
8. **Données en UE**, sauf l'appel au modèle (OpenRouter, ZDR imposé, cartouche masqué à terme).
9. **Portable.** Docker Compose et interfaces standard (S3 compatible, Postgres, SMTP, OIDC) : aucun composant propre à un hébergeur n'est obligatoire. Un service propre à un hébergeur (Serverless Jobs, GPU, Mac mini) n'entre que comme option, derrière une interface (décision n° 2).
10. **Le serveur rend peu, le navigateur calcule la visite.** Côté serveur : la visite de contrôle et les images d'aperçu, en SwiftShader, par défaut et partout (décision n° 4). La visite débloquée se calcule dans le navigateur du client, à partir du moteur versionné et du `plan.json` filtré (décision n° 5).
11. **Le verrou de l'offre gratuite est côté serveur.** Rien de la visite n'est envoyé pour un aperçu : ni moteur, ni `plan.json` (décision n° 6).
12. **Offres en données.** Prix, contenus et durées vivent dans un catalogue en base, modifiable sans déploiement ; chaque achat garde la version d'offre achetée (droits acquis, décision n° 7).

---

## 2. Vue d'ensemble

### 2.1 Services

| Service | Rôle | Code repris | Technique | Où (recommandé) | Secrets détenus |
|---|---|---|---|---|---|
| **Vitrine** | Pages publiques, démonstration sur l'appartement témoin fictif, mentions légales, formulaires (postés à l'API). Indexable dès sa mise en ligne, une fois le nom déposé | DA de `pipeline/accueil.html` | HTML statique : fichiers sources et petit script d'assemblage Python sans dépendance (`outils/site.py`) qui injecte le nom, les prix du catalogue d'offres et les parties communes ; pas de framework | Object Storage et Edge Services (D6) | aucun |
| **Web/API** | Pages de l'application, API JSON, auth, catalogue d'offres (`GET /api/offres`), page d'aperçu (images seulement), partages, pages de visite, webhooks Stripe, URL signées, limites de débit, en-têtes de sécurité | routes de `serveur.py` (classe `H`, `:483`), écran « chantier » (`accueil.html:121-152`), calibration au clic (`accueil.html:216-269`) | FastAPI et uvicorn derrière Caddy ; pages rendues côté serveur (Jinja2) et JS sans étape de build, comme `accueil.html` | VM (Docker Compose) | base, sessions, Stripe, e-mails, signature S3. **Pas la clé OpenRouter** |
| **File et état** | Travaux, étapes, verrous, reprises, tâches périodiques | remplace `RUNNING`, `SLOTS`, `etat.json` (`serveur.py:23-24`, `:74`) | Postgres géré et Procrastinate | Postgres géré | — |
| **Worker lecture** | Analyse (isolée), qualification, calibration, lecture et relecture IA, murs, complément, visite de contrôle et réparations, marquage des images, publication | `analyse`, `qualifier`, `lecture`, `controle` (`serveur.py:132`, `:260`, `:289`, `:346`), `lire.read_plan` (`lire.py:1300`), `repare_moteur` (`lire.py:947`) | Python ; un sous-processus par travail, avec délai et limites mémoire ; Chrome figé pour le contrôle, en SwiftShader, lancé sans variable secrète | VM (même VM au lancement) | base, stockage privé, clés OpenRouter `prod-payant` et `prod-gratuit` (§ 6.5) |
| **Worker rendu** | Images d'aperçu, dans l'ordre : vue du dessus 3D découpée, plan 2D coté, 2 photos (L4-09). Pas de galerie complète au lancement (L13-02) | `moteur/photos.mjs` | Node et Chrome for Testing figés, **SwiftShader**, service `rendu` du Compose, limité en processeur ; exécutant interchangeable derrière le contrat de rendu (accélérations optionnelles après le lancement : Serverless Jobs, Mac mini, GPU ; L13-01) | VM (même VM au lancement, D3) | **aucun secret durable** : URL signées et un jeton de rappel à usage unique par image |
| **Navigateur du client** | Visite débloquée : marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète ; repli sur les images et le plan 2D sans WebGL (L4-10) | `moteur/` (`engine.js`, `ui.js`) | moteur versionné servi par le CDN, `plan.json` filtré servi après contrôle du jeton | navigateur | aucun |
| **Stockage objet** | Espace privé, espace publié, sauvegardes dans une autre région | `plans/<id>/` | S3 compatible (MinIO en local) | Scaleway Object Storage, Paris (sauvegardes à Amsterdam ou Varsovie) | — |
| **CDN** | Moteur versionné, bibliothèques, polices, photos publiées | — | Edge Services devant l'espace publié | Scaleway | — |
| **E-mails** | Lien de connexion, visite prête, échec et crédit rendu, confirmations légales, reçus | remplace l'API Notification (`accueil.html:135-144`) | SMTP ou API | D4 | clé d'envoi (web et worker) |
| **Mesure d'audience** | Audience anonyme de la vitrine et des pages publiques | — | Umami auto-hébergé dans l'UE, base séparée, réglage minimal exempté (voir `recherche/suivi.md` § 7). Aucun bandeau de consentement tant qu'il reste en réglage minimal ; bandeau dès qu'un traceur non exempté est activé (L0-05, L7-02) | VM | — |
| **Supervision** | Erreurs, disponibilité, battements de cœur, métriques, coûts | journal des coûts (`lire.py:163-164`, `:1304`) | D5 | — | — |

### 2.2 Schéma

```
  visiteur          client connecté        prospect         site d'un promoteur (iframe)
     │                    │                   │                    │
     ▼                    ▼                   ▼                    ▼
 <domaine>          app.<domaine>       visite.<domaine>/v/…  visite.<domaine>/i/…
 vitrine                  └─────────────┬─────┴────────────────────┘
 statique                               ▼
                         Caddy : TLS, domaines des clients à la demande
                                        │
                                        ▼
               web/API FastAPI, sans état : pages, API, auth, partages,
               webhooks Stripe, URL signées, limites de débit, en-têtes
                  │                     │                      │
                  ▼                     ▼                      ▼
          Postgres géré           stockage PRIVÉ          e-mails (TEM)
          données, file,          sources, analyse,
          grand livre, journal    réponses IA, rapports
                  │                 ▲             ▲
          travaux │      lit, écrit │             │ images brutes (URL signées)
                  ▼                 │             │
      worker LECTURE ───────────────┘       worker RENDU (conteneur)
      Python : analyse, lecture IA,         Chrome SwiftShader, sans secret :
      murs, complément, contrôle,           vue du dessus, plan 2D, 2 photos
      réparation, marquage                        ▲
          │    │    └──────── tâche de rendu ─────┘
          │    │
          │    └── publication ──► stockage PUBLIÉ ──► CDN cdn.<domaine>
          ▼                        moteur/vN, vendor,        │
      OpenRouter (ZDR,             images marquées           ▼
      clés plafonnées)                          navigateur du client : la visite
                                                débloquée y est calculée (moteur/vN
                                                et plan.json filtré, § 2.4)
```

### 2.3 Parcours d'une génération

1. **Dépôt.** L'application crée la ligne `plans`, **sans empreinte** (`source_sha256` est calculée après l'envoi, à l'étape 2), et renvoie une URL signée d'envoi (PUT, 40 Mo au plus, 15 min). Le navigateur envoie le fichier **directement** au stockage privé : il ne transite plus par le processus web (B5 ; aujourd'hui il est lu en mémoire, `serveur.py:571`). Un dépôt sans compte passe par un dépôt provisoire anonyme de 24 h, analysé sans IA, puis rattaché au compte à la vérification de l'e-mail (L5-23). Pendant la bêta fermée, le dépôt est réservé aux invités (code d'invitation) ; l'ouverture à tous vient avec la vente (L8-07).
2. **Analyse** (travail `analyse`, sans IA, gratuit pour l'utilisateur) : format reconnu à ses premiers octets (`format_fichier`, `serveur.py:52`), refus motivés, page la plus détaillée, échelle, niveaux, **empreintes** : SHA-256 du fichier reçu et empreinte de la page retenue, rendue à résolution fixe (§ 5.7). Elle tourne dans un sous-processus limité en mémoire et en temps (A10), sans clé IA. Un plan refusé ne consomme **aucun crédit**. Un plan à plusieurs niveaux est refusé en production (`niveaux_max = 1`, voir `niveaux_refus`, `serveur.py:218`). **Plusieurs lots** : aujourd'hui, l'analyse empilerait les pages d'un PDF de plusieurs lots comme des niveaux (`pages_niveaux`, `empiler`) ; en service, la qualification refuse donc « plusieurs lots » (L6-02), et seul l'import promoteur découpe un PDF de plusieurs lots, une page = un plan, avant l'analyse (L10-02).
3. **Qualification puis calibration.** La qualification IA légère (environ 0,02 $, `recherche/audit-code.md` A9) passe **avant** toute demande de cote, comme dans le code actuel (`calibration_needed` appelle `qualifier` avant d'attendre la cote, `serveur.py:245`) : un refus (pas un plan, perspective, maison, plusieurs lots, plusieurs niveaux) ne décompte rien et n'oblige personne à caler une échelle pour rien (L6-02). Ensuite, calibration si l'échelle est incertaine : clic sur une cote connue, repris d'`accueil.html:216-269`. La validation passe dans le worker (aujourd'hui `extract()` tourne dans le fil de la requête HTTP).
4. **Lancement**, qualification réussie et cote validée s'il en fallait une (la réservation vient après la cote validée, `OFFRES.md` § 6.4, arbitrage R24 de `PLAN.md`). Le type de génération n'est pas choisi par l'utilisateur : il suit le lot réservé (un crédit complet s'il en existe un, sinon le crédit aperçu, `OFFRES.md` § 6.3). Pour un plan payant, le particulier coche la renonciation au droit de rétractation (`recherche/juridique.md` § 1.2). Dans **une transaction** : vérification du solde, mouvement `reservation` au grand livre, réservation du budget IA du plan (3 $) sur les plafonds de l'organisation, du jour (plan offert) et global (§ 6.5), création du travail `generation`. L'index unique sur les travaux actifs garantit qu'un plan n'est jamais traité deux fois (remplace `reserver`, `serveur.py:444`).
5. **Lecture** (file `lecture`) : `read_plan` avec la configuration résolue (§ 7) et un budget de 3 $, toutes passes et relances confondues. Chaque appel IA est écrit dans `appels_ia` **avant** toute exception. Réponses gardées dans l'espace privé (`reponse-ia.json`), ce qui permet de reprendre sans repayer.
6. **Visite de contrôle** dans le worker lecture : `controle.mjs` en SwiftShader (13 à 14 s mesurés contre 5 à 6 s en Metal), jusqu'à 6 passages avec `repare_moteur` entre deux. Plus deux contrôles ajoutés : aucun texte technique, aucune violation de CSP ni requête sortante (§ 9.5). **Un échec bloque tout** : aucune image rendue ni montrée, rien de publié.
7. **Images d'aperçu** (file `rendu`), seulement après un contrôle réussi : le worker lecture crée le préfixe de publication et confie à l'exécutant de rendu **une** tâche ordonnée (L4-09, L5-10) : `vue_dessus` (vue du dessus 3D découpée), `plan_2d` (plan 2D coté, capture sans WebGL, sans la superposition du plan du promoteur), `photo_1` (séjour), `photo_2` (chambre principale, à défaut la pièce principale suivante). Entrées par URL signées (`plan.json`, version du moteur) ; pour chaque image, une URL signée d'écriture et **un jeton de rappel à usage unique**. L'exécutant rappelle l'API dès qu'une image est écrite ; les vues écartées sont annoncées, l'exécutant ne réécrit jamais `plan.json` (aujourd'hui `photos.mjs` les retire de `plan.json`, `photos.mjs:98-101`).
8. **Marquage**, image par image dès son rappel : contrôle de l'image (ni noire ni uniforme), mention « illustration non contractuelle » incrustée et métadonnées de contenu généré (A6, `recherche/juridique.md` § 5.1 et 5.4), en post-traitement Python, sans toucher au moteur ; puis copie vers l'espace publié et mise à jour de l'état public (L5-11).
9. **Publication en deux temps** (§ 5.4), jamais sans contrôle réussi :
   - **plan complet** (achat, testeur, abonnement…) : la visite est publiée dès le contrôle réussi (`plan.json` filtré, `index.html` pointant vers `moteur/v<N>/`) ; les images s'ajoutent quand elles sont prêtes ;
   - **aperçu** (plan offert) : publié dès que la vue du dessus et le plan 2D sont prêts ; les 2 photos s'ajoutent quand elles sont prêtes. Ni `index.html` ni `plan.json` ne sont servis ; le `plan.json` filtré reste privé, prêt pour le déblocage ;
   - une photo qui échoue après nouvelles tentatives est **omise** (galerie adaptative, alerte à l'équipe), sans bloquer. Au pire, la visite est livrée sans photos ;
   - dans la transaction de publication : ligne `publications`, puis mouvement `consommation` au grand livre, événement `apercu_pret` (aperçu) ou `plan_pret` (visite) ; `photos_pretes` à la fin des images (`SUIVI.md` § 3.8). Le plan offert est consommé à la publication de l'aperçu, le plan complet à celle de la visite. E-mail « votre aperçu est prêt » ou « votre visite est prête » ;
   - le **déblocage** payant d'un aperçu publie la visite déjà contrôlée, sans lecture ni rendu (L8-02).
10. **Échec** à n'importe quelle étape (ou délais d'`OFFRES.md` § 6.4 dépassés) : mouvement `liberation` sur le lot d'origine, budget IA réservé libéré, e-mail « rien n'a été décompté » (E6 de `MESSAGES.md`), message du catalogue à l'écran, détail au journal et alerte si la cause est de notre côté.

**État public d'un plan.** Vue réduite, cadrée par organisation, lue par l'écran d'attente (L6-03) : étape et clé du catalogue de messages (jamais un texte libre), pourcentage qui ne recule jamais, `visite_disponible` (booléen) et `images`, **liste ordonnée des images disponibles** `{type: vue_dessus | plan_2d | photo, rang, url}`. La liste reste vide tant que le contrôle n'a pas réussi ; une image apparaît dès qu'elle est marquée et copiée ; `url` est une route de l'application qui vérifie l'organisation puis redirige vers le CDN (L5-11). L'écran d'attente affiche la vue du dessus dès qu'elle existe.

### 2.4 Ouverture d'une visite

- `visite.<domaine>/v/<jeton>` : l'application hache le jeton, retrouve le partage, vérifie révocation et expiration, incrémente le compteur du jour et renvoie `index.html`, avec les en-têtes du § 6.2 (CSP, `frame-ancestors`, `noindex`, `no-referrer`).
- `…/v/<jeton>/plan.json` : servi par l'application après le même contrôle. C'est la version filtrée, gardée dans l'espace privé de la publication.
- `…/v/<jeton>/photos/<vue>.jpg` : redirection 302 vers `cdn.<domaine>/p/<préfixe>/photos/<vue>.jpg`. `ui.js` garde ainsi ses chemins relatifs (`ui.js:362`, `:678`) et le moteur n'a pas à changer.
- Moteur, bibliothèques et polices viennent de `cdn.<domaine>/moteur/v<N>/` et `/vendor/`, immuables et mis en cache longtemps.
- Le propriétaire voit sa visite privée sur la même origine, avec un **jeton propriétaire de courte durée** (5 min, un seul plan) émis par l'application. Lui seul peut afficher la superposition du plan du promoteur (B7), sauf accord prouvé du promoteur (L10-06). En mode simple, le moteur masque « Rendu photoréaliste de la vue » et la superposition partout ailleurs (L4-11, `[M]`, avant la bêta fermée).
- La visite se calcule **dans le navigateur du client**. Sans WebGL ou après une perte de contexte, la page se replie sur les images et le plan 2D, avec un message du catalogue (L4-10).

**Aperçu (plan offert).** `app.<domaine>/plans/<id>/apercu` (propriétaire, L6-05) et `visite.<domaine>/a/<jeton>` (lien d'aperçu à montrer à ses proches, 30 jours, `OFFRES.md` § 2.2, L5-13) : page rendue côté serveur, qui ne sert que les images publiées et les données de la fiche (surfaces, points à faire confirmer). **Aucune route ne sert `engine.js`, `/vendor/three`, `index.html` ni `plan.json` d'un aperçu** : le verrou est côté serveur, rien de la visite n'est envoyé (décision n° 6). Un aperçu interactif est une idée à tester plus tard (L13-03).

### 2.5 Domaines et origines

| Hôte | Rôle | Cookie |
|---|---|---|
| `<domaine>` | vitrine | aucun (Umami sans cookie) |
| `app.<domaine>` | application | session `__Host-session`, `HttpOnly; Secure; SameSite=Lax` |
| `visite.<domaine>` | pages de visite (liens, intégrations, vue propriétaire) | **aucun cookie de session** |
| `cdn.<domaine>` | fichiers publiés | aucun |
| `mail.<domaine>` | envoi (SPF, DKIM, DMARC) | — |
| `visite.client.fr` (marque blanche) | pages de visite d'un client, CNAME vers nous, certificat émis à la demande par Caddy | aucun |

Les visites affichent des textes issus du plan déposé et de l'IA. Les servir sur une **origine distincte de l'application** garantit qu'une faille dans la visite ne peut pas lire la session.

**Indexation.** La vitrine est indexable dès sa mise en ligne, une fois le nom déposé. Les pages de l'application, d'aperçu et de visite sont en `noindex`.

---

## 3. Décisions à prendre

Chaque décision est présentée avec la recommandation, les alternatives, ce qui ferait basculer, la réversibilité et le ticket qu'elle bloque.

Les décisions de l'utilisateur du 27/09/2026 (`PLAN.md` § 2.1) en ont déjà tranché une partie : Docker Compose et S3 (n° 2, D2), blocages côté logiciel puis plafonds des clés (n° 3, § 6.5), rendu SwiftShader partout (n° 4, D3 tranchée), aperçu rendu par le serveur et visite calculée dans le navigateur (n° 5 et 6), catalogue d'offres modifiable (n° 7), Umami auto-hébergé (n° 9). D1 reste ouverte (n° 8). Les tickets de décision sont L0-02 (D1) et L0-03 (D2 à D7).

### D1. Authentification

**Contexte.** Décision n° 8 : non tranchée. L'utilisateur penche pour Auth0. La recherche (`recherche/auth-paiement.md` § 1) recommande une auth maison. Les faits vérifiés qui jouent contre Auth0 :
- le lien magique n'est pas pris en charge dans l'écran de connexion hébergé (Universal Login), qui propose un code à 6 chiffres à la place ; en Classic Login, le lien doit être ouvert dans le même navigateur, ce qui échoue sur iPhone depuis Gmail ;
- 5 Organizations dans l'offre gratuite ; l'offre B2B coûte 300 $/mois à 1 000 MAU et 2 100 $/mois à 10 000 ;
- plusieurs domaines personnalisés (la marque blanche par domaine) sont réservés à l'offre Enterprise ;
- éditeur américain.

En sa faveur : l'offre gratuite va jusqu'à 25 000 MAU en B2C, et les SDK Python sont officiels.

**Recommandation : auth maison au lancement, derrière une couche d'identité interchangeable.**
- Lien magique : jeton de 32 octets aléatoires, stocké haché, à usage unique, valable 15 min, lié à l'e-mail et non au navigateur. Le même e-mail contient un code à 6 chiffres en secours (5 essais).
- Google en OIDC (Authlib). Apple plus tard (compte Apple Developer nécessaire).
- Sessions opaques en base (`sessions`), rotation à la connexion, révocation, protection CSRF.
- Coût nul quel que soit le volume ; données en UE ; marque blanche sans limite de domaines (la page de connexion prend les couleurs de l'organisation trouvée par l'hôte).
- Charge : 4 à 6 jours avec les tests de sécurité (estimation), contre 2 à 3 jours pour brancher Auth0 (estimation).

**Couche interchangeable (à construire quel que soit le choix).**

```python
class FournisseurIdentite(Protocol):
    nom: str                      # 'email', 'google', 'auth0', 'supabase', 'saml:<organisation>'
    def debut(self, retour: str, marque: Marque) -> Redirection | Formulaire: ...
    async def fin(self, requete) -> IdentiteVerifiee: ...   # (fournisseur, sujet, email, email_verifie)
```

Règles qui rendent le fournisseur remplaçable :
- le fournisseur ne dit que **« qui est-ce »**. Comptes, organisations, rôles, crédits et sessions restent **dans notre base** ;
- la table `identites` relie `(fournisseur, sujet)` à `compte_id`. Ajouter ou retirer un fournisseur ne touche pas aux comptes ;
- après le retour du fournisseur, c'est **toujours notre session** qui est posée. Aucune logique métier chez le fournisseur (pas d'Actions Auth0, pas de règles) ;
- aucun mot de passe stocké, nulle part. Changer de fournisseur revient à renvoyer un lien de connexion, sans reprise de hachages.

**Si Auth0 est retenu malgré tout :** un tenant en région UE ; le code e-mail à la place du lien ; les organisations dans notre base et non dans Auth0 Organizations ; l'écran de connexion sur notre domaine seulement (la marque blanche par domaine reste chez nous, sur les pages de visite, qui n'exigent pas de connexion). **Supabase Auth en région Paris** est l'autre option sans code d'auth : 25 $/mois jusqu'à 100 000 MAU, lien magique, Google, Apple et SAML inclus, mais un seul domaine personnalisé par projet.

**SSO des promoteurs (plus tard) :** un broker branché comme un fournisseur de plus (Zitadel Cloud en région UE ou Keycloak auto-hébergé ; WorkOS en solution rapide, données aux États-Unis).

**Réversibilité :** élevée grâce à la couche ci-dessus. **Bloque :** M2.3 (L5-03).

### D2. Hébergement

**Décidé (n° 2, 27/09/2026) :** application dockerisée, **Docker Compose**, déployable partout ; stockage **S3**. Règle de portabilité : le code ne dépend que d'interfaces standard (S3 compatible, Postgres, SMTP, OIDC) ; aucun composant propre à un hébergeur n'est obligatoire. L5-18 la vérifie par un déploiement sur une VM d'un autre fournisseur. Reste à choisir l'hébergeur (L0-03).

**Recommandation : Scaleway, région Paris** (`recherche/hebergement.md` § 0, § 4). Un seul fournisseur français, un seul contrat de sous-traitance, et au même endroit : VM, Postgres géré, S3, CDN, e-mails, et plus tard, si l'on veut accélérer le rendu, Serverless Jobs, GPU ou Mac mini.

| Poste au lancement (~100 plans/mois) | Choix | Coût (estimation de la recherche) |
|---|---|---|
| VM : Caddy, FastAPI, worker lecture, visite de contrôle, rendu des images d'aperçu, Umami | PLAY2-MICRO (4 vCPU, 8 Go), Docker Compose | environ 46 € |
| Base et file | Postgres géré DB-DEV-S | environ 12 € |
| Stockage et CDN | Object Storage et Edge Services | environ 1 à 13 € selon le palier d'Edge Services |
| Rendu des images d'aperçu | conteneur SwiftShader sur la même VM (D3) ; capacité à mesurer au T0 (L5-11, L5-22) | 0 € de plus tant que la VM suffit |
| E-mails, supervision | TEM, Sentry Developer, surveillance gratuite | environ 0 € |
| **Total** | | **environ 60 à 70 €/mois** (somme des lignes, estimation) ; plus si la mesure impose une VM plus grosse ou séparée pour le rendu (D3) |

L'IA coûte à côté 116 à 195 $ pour 100 plans : l'enjeu de coût est le plafonnement d'OpenRouter (§ 6.5), pas l'hébergeur.

**Alternatives :**
- Clever Cloud pour le web (PaaS, `git push`, environ 55 €/mois avec Postgres), rendu chez Scaleway : moins d'administration système, deux fournisseurs.
- Hetzner (environ 25 €/mois tout compris) : Postgres à administrer soi-même, pas de CDN ni de tâches sans serveur, prix relevés deux fois en 2026.
- OVHcloud : GPU les moins chers, à revoir pour l'option « réalisme ».
- Écartés : Render, Railway, Fly.io (sociétés américaines, sans GPU ; Fly.io a arrêté ses GPU le 31/07/2026).

**Réversibilité :** bonne. Images Docker, S3 standard, Postgres standard, aucun service propriétaire dans le code ; une accélération propre à un hébergeur (Serverless Jobs, Mac mini, GPU) ne peut entrer que derrière le contrat de rendu, en option (D3). **Bloque :** M2.1 (L5-01) ; préproduction : M2.13 (L5-18).

### D3. Rendu : SwiftShader en conteneur (tranchée)

**Décision (n° 4, 27/09/2026).** Le rendu doit fonctionner partout : **Chrome en SwiftShader dans un conteneur sans GPU est la base, par défaut et partout** (VM en Docker Compose), pas une option dégradée. Il est choisi par `RENDU_CHROME` (L1-09). Serverless Jobs, GPU ou Mac mini deviennent des **accélérations optionnelles après le lancement** (L13-01), jamais obligatoires. La vitesse sera améliorée après la mise en ligne.

**Ce que le serveur rend (décision n° 5).**
- La **visite de contrôle**, dans le worker lecture : elle est courte et s'imbrique dans la boucle de réparation Python.
- Puis les **images d'aperçu**, dans cet ordre : vue du dessus 3D découpée (affichée en direct sur l'écran d'attente dès qu'elle existe), plan 2D coté, 2 photos (séjour, puis chambre principale ou, à défaut, la pièce principale suivante). Service `rendu` du Compose, sans secret, contrat de rendu (L5-10).
- **Pas de galerie complète au lancement** (une dizaine de photos, plus tard : L13-02). La visite 3D se calcule dans le navigateur du client ; au pire, la visite est livrée sans photos.

**Mesures du 27/09/2026** (Mac M3, `recherche/hebergement.md` § 2.1) :
- 11 photos d'un T2 : **60 s en Metal, 684 s en SwiftShader (× 11,4)** ;
- 3 photos : 19 s en Metal, 215 s en SwiftShader, avec 4,7 cœurs occupés en moyenne ;
- visite de contrôle : 5 à 6 s contre 13 à 14 s (× 2,5) ;
- images identiques à l'œil : écart moyen de 0,64 à 0,72/255, au plus 0,05 % des pixels au-delà de 16/255, même verdict de contrôle au mot près ;
- lancer de rayons (three-gpu-pathtracer) inutilisable en logiciel : 14 passes en 90 s contre 700.

Estimation pour les 4 images d'aperçu : environ 4 à 5 min sur M3, 1,5 à 2 fois plus sur des vCPU de serveur. À remplacer par la mesure T0 en conteneur (L5-11), qui fixe aussi le délai affiché : aucun délai n'est écrit en dur d'ici là.

**Place du rendu sur la VM.** Un rendu SwiftShader qui occupe près de 5 cœurs peut saturer une VM de 4 vCPU qui porte aussi le web et la lecture. Options : (a) service `rendu` sur la même VM, limité à un travail à la fois et en processeur ; (b) VM plus grosse ; (c) VM de rendu séparée ; (d) exécutant externe optionnel. Recommandation : (a), avec un seuil de bascule écrit après la mesure T0 (L0-03, L5-22).

**Essai M2.7a.** Il ne décide plus rien : il devient une **mesure informative** (durée de chaque image et de la visite de contrôle en SwiftShader sur la VM cible, L5-10).

**Options d'accélération, après le lancement** (analyse du 27/09/2026, conservée pour L13-01 ; elle n'est plus un choix de lancement) :

| Option | Coût fixe | Coût par plan | Durée des 11 photos | Changement de code | Réalisme plus tard |
|---|---|---|---|---|---|
| **Serverless Jobs, SwiftShader** | 0 € | 0,10 à 0,15 € (estimation) | 15 à 25 min en un job ; 3 à 8 min avec un job par photo (estimation) | options de Chrome pour Linux, image Docker | non |
| **Mac mini M4 loué** (Scaleway, Paris) | 149 €/mois (24 h minimum) | ~0 | environ 1 min (M3 mesuré) | aucun (Metal) | oui |
| GPU L4 | environ 575 €/mois en continu | ~0 | non mesurée | options Vulkan, à valider | oui |

- Ancienne recommandation, **dépassée par la décision n° 4** : essai M2.7a dans Serverless Jobs, gardé si la génération s'allongeait de moins de 5 min au 9e décile avec un écart sous 2/255, sinon Mac mini.
- Tout exécutant d'accélération suit le même **contrat de rendu** (entrées et sorties par URL signées, un jeton de rappel par image), passe le contrôle d'aptitude sur les images approuvées du témoin (écart moyen au plus 2/255) et se replie sur SwiftShader s'il est indisponible (L13-01).
- Un GPU ne devient nécessaire que pour l'option « réalisme » ou vers 10 000 plans par mois.

**Réversibilité :** élevée (contrat de rendu). **Bloque :** plus rien ; le worker rendu est livré par L5-10.

### D4. E-mails transactionnels

- **Recommandation : Scaleway TEM.** Français, même fournisseur ; 300 e-mails/mois gratuits puis 0,25 € les 1 000 (environ 1 € par mois à 1 000 plans/mois, estimation de la recherche).
- **Alternative : Brevo** (société française), utile si l'on veut aussi des campagnes. Prix et hébergement non vérifiés.
- **Écartés :** Postmark et Resend, données aux États-Unis.
- Dans tous les cas : sous-domaine `mail.<domaine>` avec SPF, DKIM et DMARC ; webhooks de rebond et de plainte ; **aucun pixel de suivi** dans les e-mails transactionnels (`recherche/suivi.md` § 7.7).
- Point ouvert : envoi depuis le domaine d'un client en marque blanche (possibilité et coût chez TEM non vérifiés).
- **Bloque :** M2.10 (L5-14).

### D5. Supervision

- **Recommandation.**
  - Sentry en **région UE** (Francfort) pour les erreurs Python. Le choix de la région se fait **à la création de l'organisation Sentry et ne se change plus** : le décider avant d'ouvrir le compte.
  - Better Stack gratuit pour la disponibilité et les **battements de cœur** des workers.
  - Scaleway Cockpit pour les métriques de la VM, de la base et des jobs.
  - Un tableau interne en SQL pour les coûts et la marge par offre.
- **Pages de visite : pas de script Sentry.** Les erreurs du navigateur sont envoyées à notre propre point d'entrée (`/api/erreur-visite`), sans tiers dans la page.
- **Alternatives :** UptimeRobot pour la disponibilité ; journaux structurés seuls pendant la bêta fermée.
- **Bloque :** M2.11 (L5-16, L5-17).

### D6. Vitrine

- **Construction (sans objet de décision).** Fichiers sources HTML et un petit script d'assemblage Python sans dépendance, `outils/site.py`, qui injecte le nom (`MARQUE_NOM`), les prix du catalogue d'offres et les parties communes (en-tête, pied de page). Pas de framework. Les prix viennent du catalogue publié (§ 4.2, L5-08) : un contrôle signale tout écart entre la vitrine construite et le catalogue en vigueur.
- **Indexation.** La vitrine est indexable dès sa mise en ligne, une fois le nom déposé ; seules les pages d'application, d'aperçu et de visite sont en `noindex`.
- **Recommandation d'hébergement : Scaleway Object Storage et Edge Services.** Tout reste en UE chez un fournisseur unique, ce qui est un argument pour les promoteurs. Il faut le palier Professional (12,99 €/mois, 10 pipelines), puisque la vitrine et `cdn.<domaine>` prennent chacune un pipeline.
- **Alternative : Cloudflare Pages.** Gratuit, avec des aperçus par branche Git, mais société américaine. La vitrine ne contient pas de données personnelles. Des fichiers statiques se déplacent sans réécriture (décision n° 2).
- Les visuels de la vitrine viennent **exclusivement de l'appartement témoin fictif** (M0.2, `references/temoin/`, versionné), jamais d'un plan de promoteur.

### D7. Fournisseur IA et chaîne contractuelle

- **Aujourd'hui :** OpenRouter (consigne du projet). Le code sait aussi appeler Anthropic en direct (`lire.py:94-104`, `:171`).
- **Faits :**
  - la ZDR sur OpenRouter (`provider.zdr: true`) exclut les points d'accès directs d'Anthropic et ne garde que Bedrock et Vertex ;
  - le routage UE d'OpenRouter est réservé à l'offre Business, avec 8 % de frais au lieu de 5,5 %, soit environ 0,03 à 0,05 $ de plus par plan ;
  - via OpenRouter, notre contrat est avec OpenRouter et non avec Anthropic (`recherche/juridique.md` § 3.3).
- **Recommandation :**
  - garder OpenRouter avec ZDR au lancement, avec les plafonds des clés comme second verrou derrière nos propres plafonds (décision n° 3, § 6.5) ;
  - `ConfigIA.fournisseur` rend la bascule possible par simple réglage ;
  - **rouvrir la décision avant le premier contrat promoteur** (routage UE, ou contrat direct avec Anthropic).
- **Point à mesurer avec la clé `dev`** : effet de la ZDR sur la durée et la qualité de la lecture, sur un plan de référence.

### Choix proposés comme acquis, sauf objection

| Sujet | Choix | Raison |
|---|---|---|
| Framework web | FastAPI | Python comme la chaîne, asynchrone, adapté aux API |
| File de travaux | Procrastinate sur Postgres | pas de Redis ; relances, verrous et tâches périodiques. Une table maison lue par `SELECT … FOR UPDATE SKIP LOCKED` reste le repli |
| Pages de l'application | rendu serveur et JS sans build, dans la DA d'`accueil.html` et `visite.css` | cohérent avec le code actuel, petite équipe |
| Paiement | Stripe en direct, sans revendeur (MoR) | clientèle française (`recherche/auth-paiement.md` § 2) |
| Crédits | grand livre maison en ajout seul ; règles d'`OFFRES.md` § 6 | les « billing credits » de Stripe ne conviennent pas |
| Offres | catalogue en base, versions immuables, modifiable sans déploiement ; chaque achat garde sa version (L5-08) | décision n° 7 : les offres évolueront, droits acquis honorés |
| Vitrine | fichiers sources et `outils/site.py`, sans framework | petite équipe, prix et nom injectés depuis une seule source |
| Mesure | Umami auto-hébergé dans l'UE, en réglage minimal exempté ; journal `evenements` en base ; envois Meta et Google côté serveur après consentement, plus tard (lot 12) | décision n° 9 ; `recherche/suivi.md` § 7 |
| Orchestration | Docker Compose, sans Kubernetes | décision n° 2 : déployable partout ; Kubernetes inutile à ces volumes |

---

## 4. Modèle de données

### 4.1 Principes

- **Porteur des données : l'organisation.** Chaque compte reçoit à l'inscription une organisation « personnelle ». Plans, crédits, réglages et partages appartiennent à une organisation. Particuliers, cabinets et promoteurs suivent donc le même chemin de code.
- **Toute requête est cadrée par `organisation_id`**, par un utilitaire unique. Un accès à la ressource d'une autre organisation répond 404, pas 403 (pas d'indice d'existence). Les tests d'accès croisé font partie de la CI (§ 9.5). La sécurité au niveau des lignes de Postgres (RLS) reste une seconde barrière possible plus tard.
- Identifiants `uuid` ; dates `timestamptz` ; montants en centimes d'euro, ou en dollars à 4 décimales pour l'IA ; instantanés en `jsonb`.
- **En ajout seul** : grand livre, journal d'événements, acceptations, journal de l'équipe. On corrige par un mouvement inverse.
- **Suppression logique** (`supprime_le`), puis purge par une tâche périodique selon les durées de conservation (§ 4.4).
- Migrations Alembic, « étendre puis contracter » (§ 9.2).

### 4.2 Tables

```sql
-- ─── Comptes, organisations, accès ────────────────────────────────────────────
create table comptes (
  id uuid primary key,
  email_normalise text not null unique,   -- minuscules, sans +étiquette, points retirés pour Gmail
  email text not null,                    -- tel que saisi, pour l'envoi
  nom text,
  organisation_personnelle_id uuid not null,
  role_equipe text check (role_equipe in ('support', 'admin')),   -- null pour les clients
  cree_le timestamptz not null default now(),
  derniere_connexion_le timestamptz,
  supprime_le timestamptz
);

create table organisations (
  id uuid primary key,
  type text not null check (type in ('personnelle', 'cabinet', 'promoteur', 'marque_blanche')),
  nom text not null,
  offre_code text not null,               -- code du catalogue (table offres, L5-08) : jamais une valeur figée dans le code
  offre_version_id uuid,                  -- version souscrite (abonnés : prix garanti jusqu'à la bascule annoncée)
  siren text, tva_intracom text,          -- facturation électronique (clients pros)
  stripe_customer_id text unique,
  reglages_version int,                   -- version active de reglages_organisation
  plafond_ia_mensuel_usd numeric(8,2),    -- budget IA de l'organisation (§ 6.5) ; défaut lu dans le catalogue
  travaux_simultanes_max smallint not null default 2,   -- défaut lu dans le catalogue (OFFRES § 3.2)
  cle_ia_nom text,                        -- clé OpenRouter propre (marque blanche) ; sinon celle de l'offre
  idp_id uuid,                            -- SSO, plus tard
  cree_le timestamptz not null default now(),
  supprime_le timestamptz
);

create table membres (
  organisation_id uuid references organisations,
  compte_id uuid references comptes,
  role text not null check (role in ('proprietaire', 'admin', 'membre')),
  cree_le timestamptz not null default now(),
  primary key (organisation_id, compte_id)
);

create table invitations (
  id uuid primary key,
  organisation_id uuid not null references organisations,
  email_normalise text not null,
  role text not null,
  jeton_hash bytea not null unique,       -- lien d'invitation, 32 octets aléatoires, haché
  invite_par uuid references comptes,
  expire_le timestamptz not null, acceptee_le timestamptz, revoquee_le timestamptz
);

create table identites (                  -- couche interchangeable (D1)
  id uuid primary key,
  compte_id uuid not null references comptes,
  fournisseur text not null,              -- 'email', 'google', 'apple', 'auth0', 'supabase', 'saml:<org>'
  sujet text not null,                    -- sub OIDC, ou e-mail normalisé pour 'email'
  email_verifie boolean not null,
  cree_le timestamptz not null default now(), derniere_utilisation_le timestamptz,
  unique (fournisseur, sujet)
);

create table sessions (
  id_hash bytea primary key,              -- le cookie porte l'identifiant, la base son empreinte
  compte_id uuid not null references comptes,
  organisation_active_id uuid not null,
  cree_le timestamptz not null default now(), vue_le timestamptz,
  expire_le timestamptz not null, revoquee_le timestamptz,
  ip_prefixe inet, agent text              -- famille de navigateur, pour la liste « appareils connectés »
);

create table jetons_connexion (           -- lien magique et code de secours
  hash bytea primary key,
  email_normalise text not null,
  code_hash bytea not null, essais smallint not null default 0,
  expire_le timestamptz not null, utilise_le timestamptz,
  ip_prefixe inet
);

create table acceptations (               -- preuves, conservées 5 ans (juridique § 3.4)
  id uuid primary key,
  compte_id uuid not null,
  document text not null,                 -- 'cgu', 'cgv', 'renonciation_retractation', 'ecarts_acceptes', 'dpa'
  version text not null,
  travail_id uuid,                        -- la renonciation se coche à chaque lancement
  accepte_le timestamptz not null default now(),
  ip_prefixe inet
);

-- ─── Plans, travaux, étapes, IA ───────────────────────────────────────────────
create table plans (
  id uuid primary key,
  organisation_id uuid not null references organisations,
  cree_par uuid references comptes,
  titre text,                             -- affiché ; jamais l'identifiant technique (cf. lire.py:1263)
  nom_fichier text,                       -- privé : jamais dans une URL ni un lien (B3)
  source_sha256 bytea,                    -- calculée par l'analyse après l'envoi direct (null avant) ;
                                          -- anti-abus du plan offert ; déduplication dans l'organisation (§ 5.7)
  page_empreinte bytea,                   -- empreinte de la page retenue, rendue à résolution fixe (anti-abus, § 5.7)
  source_format text,                     -- 'pdf_vectoriel', 'pdf_image', 'image'
  niveaux smallint,                       -- lu par l'analyse ; au-delà de niveaux_max : refus motivé
  echelle_origine text,                   -- 'fichier' ou 'calibration'
  calibration jsonb,                      -- deux points et longueur saisis
  statut text not null,                   -- 'depose', 'analyse', 'a_calibrer', 'pret', 'en_cours', 'publie', 'echec', 'refus'
  publication_active_id uuid,
  lot_id uuid,                            -- promoteurs
  conserver_jusqu_au timestamptz,
  cree_le timestamptz not null default now(), supprime_le timestamptz
);
create index on plans (organisation_id, cree_le desc);

create table depots_provisoires (         -- dépôt sans compte, analyse sans IA, effacé à 24 h (L5-23)
  id uuid primary key,
  jeton_reprise_hash bytea not null,      -- 256 bits, gardé par le navigateur
  source_sha256 bytea, taille int, format text, ip_prefixe inet,
  statut text not null,                   -- 'attente_envoi', 'recu', 'analyse', 'reconnu', 'a_calibrer', 'refuse'
  resultat jsonb,                         -- codes seulement ; jamais le nom du fichier
  expire_le timestamptz not null,         -- création + 24 h
  rattache_plan_id uuid, rattache_le timestamptz
);

create table offerts_attribues (          -- anti-abus du plan offert (L6-06) ; survit à la suppression du compte
  empreinte bytea primary key,            -- e-mail normalisé ou sujet Google (salés), empreinte du fichier, empreinte de la page
  nature text not null,                   -- 'email', 'google', 'fichier', 'page'
  cree_le timestamptz not null default now()   -- durée de conservation : registre (L0-09)
);

create table travaux (
  id uuid primary key,
  plan_id uuid not null references plans,
  organisation_id uuid not null,
  type text not null,                     -- 'analyse', 'generation', 'rejouer', 'photos', 'import_lot'
  type_plan text,                         -- 'apercu' (plan offert : images seulement) ou 'complet' ;
                                          -- suit le lot réservé (OFFRES § 6.3), jamais choisi par l'utilisateur
  file text not null,                     -- 'analyse', 'lecture', 'lecture_lots', 'rendu'
  etat text not null,                     -- 'en_file', 'en_cours', 'attente_rendu', 'attente_budget', 'reussi', 'echec', 'annule'
  etape text, pct smallint,               -- alimentent l'écran « chantier » (état public, § 2.3)
  config jsonb not null,                  -- configuration résolue, sans secret (§ 7)
  moteur_version int,
  budget_usd numeric(6,2),                -- 3 $ par plan, toutes passes et relances confondues (§ 6.5)
  cout_usd numeric(8,4) not null default 0,
  relances_payantes smallint not null default 0,
  credit_mouvement_id uuid,               -- réservation au grand livre
  code_erreur text,                       -- clé du catalogue de messages, jamais un texte libre
  lance_par uuid,
  cree_le timestamptz not null default now(),
  demarre_le timestamptz, battement_le timestamptz, fini_le timestamptz
);
create unique index un_travail_actif_par_plan on travaux (plan_id)
  where etat in ('en_file', 'en_cours', 'attente_rendu');   -- remplace RUNNING et reserver()

create table etapes (
  id uuid primary key,
  travail_id uuid not null references travaux,
  nom text not null,                      -- 'analyse', 'qualification', 'lecture', 'relecture', 'arbitrage', 'murs',
                                          -- 'complement', 'controle', 'reparation', 'photos', 'marquage', 'publication'
  tentative smallint not null default 1,
  etat text not null, debut_le timestamptz, fin_le timestamptz, duree_ms int,
  code_erreur text,
  detail_technique text,                  -- exception, sortie de Node : interne, jamais renvoyé par l'API
  sorties jsonb                           -- clés des objets produits
);

create table appels_ia (
  id uuid primary key,
  travail_id uuid, etape_id uuid, plan_id uuid, organisation_id uuid,
  fournisseur text not null, modele text not null, effort text,
  cle_nom text not null,                  -- 'dev', 'prod-payant', 'prod-gratuit', ou clé d'un client
  zdr boolean not null,
  jetons_entree int, jetons_sortie int, jetons_reflexion int,
  cout_usd numeric(8,4) not null,         -- usage.cost d'OpenRouter, sinon estimation
  cout_estime boolean not null,
  statut text not null,                   -- 'ok', 'tronque', 'illisible', 'erreur_reseau', 'refus_402', 'refus_403'
  generation_ref text,                    -- identifiant OpenRouter, pour le rapprochement mensuel
  version_prompts text,
  duree_ms int,
  cree_le timestamptz not null default now()
);

-- ─── Catalogue d'offres (L5-08 ; décision n° 7) ───────────────────────────────
create table offres (
  code text primary key,                  -- stable : 'particulier_visite', 'particulier_plan_suivant', 'particulier_pack_3',
                                          -- 'offert_inscription', 'testeur' (variante « bêta » : plan complet ou aperçu
                                          -- selon L0-04), 'pro_solo', 'pro_cabinet', 'pro_equipe', 'pro_essai', 'pro_recharge', ...
  cible text not null                     -- 'particulier', 'conseiller', 'promoteur', 'partenaire'
);

create table offres_versions (            -- immuable une fois publiée : changer un prix = publier une version
  id uuid primary key,
  offre_code text not null references offres,
  version int not null,
  statut text not null check (statut in ('brouillon', 'publiee', 'retiree')),
  valide_du timestamptz, valide_au timestamptz,   -- une seule version publiée en vigueur par code et par date
  prix_centimes int, prix_affiche text,   -- 'ttc' (particuliers) ou 'ht' (pros) ; prix ronds (OFFRES § 1)
  taux_tva numeric(4,2),
  credits jsonb,                          -- [{type_plan, quantite}]
  validite_credits_jours int,             -- valeurs d'OFFRES § 6.2
  hebergement_mois int,                   -- aperçu 6, visite 24 au lancement (OFFRES § 2.2, § 2.4)
  contenu jsonb,                          -- liste fermée : visite, maquette_interactive, plan_interactif, photos (nombre), ...
  conditions jsonb,                       -- par exemple « dans les 12 mois d'un premier achat »
  periode_prix text,                      -- tests de prix par périodes seulement, jamais par personne (OFFRES § 9.1)
  stripe_price_id text,                   -- prix Stripe créé à neuf pour chaque version payante (jamais modifié)
  libelles jsonb,                         -- clés de MESSAGES.md
  cree_par uuid, cree_le timestamptz not null default now(),
  unique (offre_code, version)
);

-- ─── Crédits et paiements (recherche/auth-paiement.md § 3 ; règles : OFFRES.md § 6) ─
create table credit_lots (
  id uuid primary key,
  organisation_id uuid not null,
  source text not null check (source in ('offert_inscription', 'testeur', 'achat', 'essai', 'abonnement',
                                         'recharge', 'code', 'geste_commercial', 'programme')),
                                          -- OFFRES § 6.2 ; 'programme' (promoteurs) : SUIVI.md § 3.2, L5-07
  type_plan text not null check (type_plan in ('apercu', 'complet')),
  quantite_initiale int not null,
  quantite_restante int not null check (quantite_restante >= 0),
  expire_le timestamptz not null,         -- validités d'OFFRES § 6.2 ; abonnement du mois M : fin du mois M+1 (report d'un mois)
  priorite smallint not null,             -- ordre d'OFFRES § 6.3 : complet avant aperçu, puis expiration la plus proche,
                                          -- puis testeur, essai, abonnement, recharge, code, geste_commercial, achat
  prix_unitaire_centimes int,             -- prix payé ; 0 pour les crédits offerts
  offre_version_id uuid,                  -- version d'offre achetée : contenu et durées garantis (droits acquis)
  achat_ligne_id uuid, abonnement_id uuid,
  cree_le timestamptz not null default now()
);

create table credit_mouvements (          -- grand livre, en ajout seul
  id uuid primary key,
  organisation_id uuid not null,
  lot_id uuid not null references credit_lots,
  delta int not null,
  nature text not null check (nature in ('attribution', 'reservation', 'consommation', 'liberation',
                                          'expiration', 'remboursement', 'ajustement')),
  travail_id uuid,
  cle_idempotence text not null unique,   -- événement Stripe, travail, attribution
  acteur text not null,                   -- compte, 'stripe', 'systeme', membre de l'équipe
  motif text,
  cree_le timestamptz not null default now()
);

create table achats (
  id uuid primary key,
  organisation_id uuid not null, compte_id uuid,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text, stripe_invoice_id text,
  montant_ht_centimes int not null, tva_centimes int not null, devise char(3) not null default 'EUR',
  statut text not null,                   -- 'paye', 'rembourse_partiel', 'rembourse', 'litige'
  cree_le timestamptz not null default now()
);

create table achats_lignes (              -- facturation et remboursement ligne par ligne (OFFRES § 2.3, § 6.5)
  id uuid primary key,
  achat_id uuid not null references achats,
  offre_version_id uuid not null,         -- par exemple pack « 1er plan 29 € + 2 plans suivants à 15 € » : 2 lignes
  quantite int not null,
  prix_unitaire_ttc_centimes int not null, prix_unitaire_ht_centimes int not null,
  credit_lot_id uuid,                     -- un lot par ligne (un prix unitaire par lot)
  rembourse_quantite int not null default 0,   -- plans non utilisés remboursés sur cette ligne
  rembourse_le timestamptz
);

create table abonnements (
  id uuid primary key,
  organisation_id uuid not null,
  stripe_subscription_id text not null unique,
  offre_version_id uuid not null,         -- prix garanti jusqu'à une bascule planifiée et annoncée
  plans_inclus_par_periode int not null,  -- lot mensuel valable jusqu'à la fin du mois suivant (report d'un mois)
  statut text not null,
  periode_debut timestamptz, periode_fin timestamptz,
  resiliation_demandee_le timestamptz,
  cree_le timestamptz not null default now()
);

-- ─── Publication, partages, vues ──────────────────────────────────────────────
create table publications (
  id uuid primary key,
  plan_id uuid not null references plans,
  travail_id uuid not null references travaux,
  moteur_version int not null,            -- la visite se charge toujours avec cette version
  prefixe text not null unique,           -- 128 bits aléatoires : chemin des images sur le CDN
  type text not null check (type in ('apercu', 'complete')),
                                          -- 'apercu' : images et fiche seulement ; ni index.html ni plan.json servis
                                          -- (verrou côté serveur, § 5.3). Déblocage : nouvelle ligne 'complete', même travail
  images jsonb not null default '[]',     -- images disponibles, dans l'ordre : [{type, rang, cle}] ; alimenté image par image
  heberge_jusqu_au timestamptz not null,  -- durée de la version d'offre du lot consommé (droits acquis, OFFRES § 2.2, § 2.4)
  superposition boolean not null default false,   -- plan du promoteur : seulement avec autorisation prouvée
  controle jsonb,                         -- résumé du verdict de la visite de contrôle
  cree_le timestamptz not null default now(), retiree_le timestamptz
);

create table partages (
  id uuid primary key,
  organisation_id uuid not null,
  plan_id uuid not null references plans,
  publication_id uuid,                    -- null : suit la publication active du plan
  type text not null check (type in ('lien', 'integration')),
  objet text not null check (objet in ('apercu', 'visite')),   -- aperçu : /a/<jeton>, images seulement, 30 jours
  jeton_hash bytea not null unique,       -- SHA-256 du jeton de 128 bits
  jeton_chiffre bytea not null,           -- pour réafficher le lien à son propriétaire
  libelle text,                           -- « M. X, rendez-vous du 12 » : donnée du conseiller (sous-traitance)
  suivi_detaille boolean not null default false,   -- durée et pièces vues : seulement après consentement du prospect
  prevenir_createur boolean not null default true,
  cree_par uuid, cree_le timestamptz not null default now(),
  expire_le timestamptz, revoque_le timestamptz
);

create table vues_visite (                -- agrégé : ni IP ni identifiant de visiteur
  partage_id uuid not null,
  jour date not null,
  ouvertures int not null default 0,
  primary key (partage_id, jour)
);

create table vues_visite_detail (         -- seulement avec consentement sur la page ; purge à 6 mois
  id uuid primary key,
  partage_id uuid not null,
  ouvert_le timestamptz not null,
  duree_s int, pieces_vues text[],
  interesse_le timestamptz                -- clic « Je suis intéressé, prévenir mon conseiller »
);

-- ─── Journal serveur et mesure (schéma détaillé : recherche/suivi.md § 7.4) ───
create table evenements (
  id uuid primary key,                    -- réutilisé comme event_id Meta et transactionId Google
  type text not null,                     -- 'compte_cree', 'plan_depose', 'plan_lance', 'apercu_pret', 'plan_pret', 'plan_echoue',
                                          -- 'credit_rendu', 'visite_ouverte', 'achat_paye', 'abonnement_demarre', ... (SUIVI.md § 3 et annexe A)
  survenu_le timestamptz not null default now(),
  compte_id uuid, organisation_id uuid, plan_id uuid,
  montant_ht_centimes int, devise char(3),
  proprietes jsonb not null default '{}',
  origine text not null                   -- 'api', 'stripe', 'worker'
);
-- consentements, attribution, envoi_publicitaire : tels que décrits dans recherche/suivi.md § 7.4

-- ─── Réglages par organisation (§ 7) ──────────────────────────────────────────
create table reglages_organisation (
  organisation_id uuid not null,
  version int not null,
  marque jsonb,                           -- nom affiché, logo (clé d'objet), couleurs = jetons de visite.css (--accent, --paper…)
  textes jsonb,                           -- mot d'accueil de la galerie, coordonnées du conseiller ; passés au filtre des textes
  rendu jsonb,                            -- moments, nombre de photos, mode simple, saison, heure (liste fermée)
  ia jsonb,                               -- effort, consignes ajoutées au prompt : écrit par l'équipe seulement
  mention_propulse boolean not null default true,
  superposition_autorisee boolean not null default false,
  autorisation_preuve text,               -- clé d'objet : accord écrit du promoteur
  cree_par uuid, cree_le timestamptz not null default now(),
  primary key (organisation_id, version)
);

create table domaines (
  id uuid primary key,
  organisation_id uuid not null,
  hote text not null unique,              -- 'visite.client.fr', 'www.promoteur.fr'
  usage text not null check (usage in ('visite', 'app', 'parent_integration')),
                                          -- parent_integration : alimente frame-ancestors
  jeton_verification text, verifie_le timestamptz,
  tls_etat text,
  cree_le timestamptz not null default now()
);

-- ─── Promoteurs ───────────────────────────────────────────────────────────────
create table programmes (
  id uuid primary key,
  organisation_id uuid not null,
  nom text not null, commune text,
  statut text not null,                   -- 'brouillon', 'en_cours', 'publie', 'archive'
  autorisation_diffusion text,            -- clé d'objet : preuve des droits (juridique § 4.4)
  cree_le timestamptz not null default now()
);

create table lots (
  id uuid primary key,
  programme_id uuid not null references programmes,
  reference text not null,                -- numéro de lot du promoteur
  typologie text, etage text, surface_annoncee_m2 numeric(6,2),
  plan_id uuid, partage_integration_id uuid,
  ordre int,
  unique (programme_id, reference)
);

create table imports (
  id uuid primary key,
  programme_id uuid not null,
  lance_par uuid,
  budget_usd numeric(8,2) not null,       -- plafond de coût de l'import entier
  lots_total int, lots_ok int, lots_echec int,
  etat text not null,
  cree_le timestamptz not null default now(), fini_le timestamptz
);

create table cles_api (                   -- intégration des promoteurs
  id uuid primary key,
  organisation_id uuid not null,
  prefixe text not null unique,           -- affiché dans l'interface
  hash bytea not null,
  portee text[] not null,                 -- 'lots:lire', 'partages:creer', ...
  cree_par uuid, cree_le timestamptz not null default now(),
  derniere_utilisation_le timestamptz, revoquee_le timestamptz
);

-- ─── Exploitation ─────────────────────────────────────────────────────────────
create table journal_equipe (             -- toute action de l'équipe sur les données d'un client
  id uuid primary key,
  acteur_id uuid not null,
  action text not null,                   -- 'rejouer', 'rendre_credit', 'ouvrir_plan', 'changer_reglage_ia', ...
  cible_type text, cible_id uuid,
  motif text not null,
  cree_le timestamptz not null default now()
);

create unlogged table limites (           -- compteurs de limites de débit (§ 6.4), sans Redis
  cle text not null, fenetre_debut timestamptz not null, compteur int not null,
  primary key (cle, fenetre_debut)
);
```

### 4.3 Invariants vérifiés automatiquement

Vérifiés par une tâche périodique (toutes les heures) et par les tests :
- aucun `quantite_restante` négatif ; somme des lots = somme des mouvements par organisation ;
- aucune réservation ouverte sans travail actif ni au-delà des délais d'`OFFRES.md` § 6.4 (2 h après le début du traitement, 24 h sans démarrage, à caler au T0) ; sinon libération automatique et alerte ;
- chaque consommation a sa publication, et chaque libération son e-mail (`OFFRES.md` § 6.6) ;
- chaque paiement Stripe réussi a ses lots de crédits (un par ligne d'achat), et réciproquement (rapprochement quotidien) ;
- aucune publication d'aperçu dont `index.html` ou `plan.json` soit joignable ;
- aucun travail `en_cours` sans battement de cœur depuis plus de 2 min (sinon reprise sans repayer) ;
- somme de `appels_ia.cout_usd` par travail = `travaux.cout_usd` ; rapprochement mensuel avec la facture OpenRouter ;
- aucune publication active dont les objets sont absents du CDN ;
- aucun partage actif vers un plan supprimé.

### 4.4 Conservation

Durées proposées dans `recherche/juridique.md` § 3.4, appliquées par une tâche de purge qui efface aussi les objets et, à l'expiration de leur rotation, les copies de sauvegarde. Les durées commerciales (validité des crédits, hébergement des aperçus et des visites) font foi dans `OFFRES.md` (§ 2.2, § 2.4, § 4.6, § 6.2) ; ce tableau s'y aligne. La durée d'une publication est celle de la version d'offre achetée (`publications.heberge_jusqu_au`, droits acquis).

| Données | Durée proposée |
|---|---|
| Dépôt provisoire anonyme | 24 h (plus 15 min de purge), s'il n'est pas rattaché à un compte (L5-23) |
| Aperçu d'un plan offert, et son plan déposé et ses fichiers intermédiaires | 6 mois, avec un rappel avant suppression (`OFFRES.md` § 2.2) ; suppression immédiate sur demande |
| Visite d'un plan payant, et son plan déposé et ses fichiers intermédiaires (particulier) | 24 mois en ligne (`OFFRES.md` § 2.4, à valider par l'avocat ; repli : 12 mois plus une prolongation) ; suppression immédiate sur demande |
| Plans et résultats des promoteurs | 24 mois après la livraison, puis prolongation payante (`OFFRES.md` § 4.6) ; données du contrat : durée du contrat plus 30 jours pour l'export |
| Plans et résultats des conseillers | durée du contrat plus 30 jours pour l'export |
| `vues_visite_detail` | 6 mois, puis agrégation |
| Preuves (`acceptations`, consentements) | 5 ans |
| Factures | 10 ans (chez Stripe et l'outil comptable) |
| Journaux techniques | 6 à 12 mois |

---

## 5. Stockage

### 5.1 Espace privé

Seau versionné, jamais derrière le CDN, lu par les workers et, pour les URL signées, par l'application.

```
prive/
  depots/<plan_id>/<envoi_id>                        fichier brut reçu par URL signée ; effacé après l'analyse
  depots/anonymes/<depot_id>/source                  dépôt provisoire sans compte (L5-23) ; effacé à 24 h ou au rattachement
  org/<organisation_id>/plans/<plan_id>/
    source.<pdf|png|jpg|webp>                        après contrôle du format
    analyse/     extract.json, page.png, calibration.png, plan-<…>.png (superposition), fichiers de niveaux
    ia/          reponse-brute*.txt, reponse-ia.json, relecture-ia.json, appels-ia.json, reponse-ia.rejetee.json
    travaux/<travail_id>/
                 plan.json (brouillon), rapport.json, controle.json, images-brutes/, journal.txt
    publications/<publication_id>/
                 plan.json (filtré ; servi par l'application après contrôle du jeton, pour une visite seulement ;
                 pour un aperçu, gardé privé jusqu'au déblocage)
  org/<organisation_id>/reglages/                    logos, preuves d'autorisation des promoteurs
references-privees/                                  jeu de non-régression (§ 9.5), accès équipe seulement
```

### 5.2 Espace publié

Objets **immuables**, servis par `cdn.<domaine>`, cache long.

```
publie/
  moteur/v<N>/     engine.js, ui.js, visite.css, manifest.json (commit, date, empreintes des fichiers)
  vendor/          three@0.180.0/…, three-mesh-bvh@0.9.1/…, three-gpu-pathtracer@0.0.24/…, polices/ (Archivo, DM Mono)
  p/<préfixe>/     photos/vue_dessus-jour.jpg, photos/plan_2d.png, photos/<vue>-<moment>.jpg (marquées), vignette.jpg
```

Au lancement, un préfixe contient au plus les 4 images d'aperçu (vue du dessus, plan 2D, 2 photos), copiées une à une dès qu'elles sont marquées. La galerie complète viendra plus tard (L13-02).

Le préfixe fait 128 bits aléatoires ; il ne dit rien du plan ni du client. Retirer une publication (révocation de tous ses partages, suppression, fin de contrat) efface ses objets et purge le CDN.

### 5.3 Ce qui n'est jamais publié

- Le **fichier du promoteur** et tout ce qui en est une image : `source.*`, `page.png`, `calibration.png`, `plan-<…>.png` (superposition). **Seule exception** : la superposition dans une publication dont l'organisation a déposé la preuve d'un accord du promoteur (`reglages_organisation.superposition_autorisee`), sinon elle reste réservée à la vue du propriétaire (B7).
- Les **réponses et journaux de l'IA** : `reponse-*`, `relecture-ia.json`, `appels-ia.json`, et les coûts.
- `extract.json`, `rapport.json`, `controle.json`, `etat.json`, le nom du fichier déposé.
- Dans `plan.json` : la clé `underlay`, et tout champ que le moteur ne lit pas. La liste blanche des clés est tirée de `moteur/SCHEMA.md` et vérifiée par un test : une clé inconnue fait échouer la publication plutôt que de fuir.
- **Pour un aperçu (plan offert) : rien de la visite.** Ni `index.html`, ni `plan.json`, ni le moteur, sur aucune route. La page d'aperçu est rendue côté serveur avec les images publiées et les seules données de la fiche (surfaces, points à faire confirmer), échappées et passées au filtre des textes. **Contrôle automatique** : une page d'aperçu qui charge `engine.js`, `/vendor/three` ou `plan.json`, ou qui affiche un texte technique, fait échouer la publication (`OFFRES.md` § 2.2, L6-05).

### 5.4 Publication

Étape du worker lecture, **exécutée seulement si la visite de contrôle a réussi**, en deux temps (§ 2.3, étape 9 ; L5-11, L5-12) :
1. au contrôle réussi : créer le préfixe ; écrire le `plan.json` filtré dans `prive/…/publications/<id>/` ;
2. **plan complet** : produire `index.html` à partir de `moteur/modele.html` (chemins relatifs `../../moteur/`, `modele.html:12`, `:24-25`, remplacés par `https://cdn.<domaine>/moteur/v<N>/`, importmap et polices pointées vers `/vendor/` ; tant que M1.7 (L4-06) n'est pas fait, cette réécriture se fait à la publication, sans modifier `moteur/`), puis publier la visite tout de suite ;
   **aperçu** : attendre que la vue du dessus et le plan 2D soient prêts, puis publier la page d'aperçu ; aucun `index.html` n'est servi ;
3. contrôler le résultat (aucune URL tierce, aucun texte technique, CSP respectée ; pour un aperçu, aucune requête vers le moteur ni `plan.json`) ;
4. écrire la ligne `publications`, basculer `plans.publication_active_id`, **puis** consommer le crédit, dans la même transaction. C'est le principe d'écriture atomique déjà suivi (`serveur.py:95-96`, `lire.py:1050` `ecrit`) : écrire, puis publier. Le plan offert est consommé à la publication de l'aperçu ;
5. ensuite, image par image : l'image contrôlée et marquée est copiée vers `publie/p/<préfixe>/`, ajoutée à `publications.images` et à l'état public. Une image qui échoue après nouvelles tentatives est omise (galerie adaptative de L4-09, alerte à l'équipe), sans bloquer ni retirer la publication. Si la vue du dessus ou le plan 2D d'un aperçu ne sont pas prêts dans les délais d'`OFFRES.md` § 6.4, l'aperçu n'est pas publié et le crédit est rendu.

**Déblocage d'un aperçu** (L8-02) : nouvelle ligne `publications` de type `complete` sur le même travail, la même version du moteur et le même préfixe ; `index.html` produit comme à l'étape 2 ; aucune lecture ni aucun rendu ; puis consommation directe d'un crédit complet. Les images servies sont celles déjà produites.

### 5.5 Moteur versionné

- `outils/publier_moteur` (à créer) copie `moteur/` vers `publie/moteur/v<N+1>/` avec son `manifest.json`, **seulement si le contenu a changé**. Une version publiée n'est jamais modifiée.
- Chaque publication enregistre `moteur_version`. Une visite validée par la visite de contrôle en version N se charge toujours en version N : une mise à jour du moteur ne casse plus les visites livrées (A3).
- Pour passer une visite existante sur un nouveau moteur, on la **rejoue** (§ 5.6), ce qui repasse la visite de contrôle.
- En local, rien ne change : `index.html` continue de charger `../../moteur/`.

### 5.6 Rejouer sans repayer

- Travail `rejouer` : réassemblage depuis `reponse-ia.json` gardé, complément, visite de contrôle avec réparations, images, publication. C'est la logique d'`outils/finalise.sh`, qui vide déjà les clés (`finalise.sh:7`).
- La configuration d'un travail `rejouer` porte `ia_autorisee = false` : **tout appel IA lève une erreur** au lieu de payer.
- Usages :
  - montée de version du moteur ;
  - correctif de `murs.py` ou du complément ;
  - support, et correction d'un défaut de notre fait, **toujours gratuite** (aucun crédit repris) ;
  - images manquantes relancées sans frais.
- Le déblocage d'un aperçu n'a pas besoin de rejouer : la visite contrôlée et son `plan.json` filtré existent déjà (§ 5.4).
- Une relance après échec reprend là où la lecture gardée le permet (`lire.py:1319-1349`). Une seule relance payante par travail, **dans le budget de 3 $ du plan** ; ensuite l'équipe reprend la main (B8).

### 5.7 Dépôt, doublons

- Taille maximale 40 Mo, comme aujourd'hui (`serveur.py:571`, `accueil.html:170`), imposée par la politique de l'URL signée.
- Les empreintes sont calculées **par l'analyse, après l'envoi direct** : le processus web ne lit jamais le fichier, et la ligne `plans` est créée sans empreinte.
  - `source_sha256` : SHA-256 du fichier reçu ;
  - `page_empreinte` : empreinte de la page retenue, rendue à résolution fixe, jugée meilleure par `recherche/auth-paiement.md` § 3.5 (un PDF réenregistré change d'empreinte de fichier, L6-06).
- **Anti-abus du plan offert**, toutes organisations confondues : un plan donne droit à un seul plan offert, vérifié sur l'empreinte du fichier **et** sur l'empreinte de la page rendue, au lancement (L6-06, `offerts_attribues`).
- L'empreinte du fichier sert aussi à éviter de payer deux fois la même lecture, **dans la même organisation seulement**.
- Réutiliser la lecture d'une autre organisation reviendrait à réutiliser les données d'un client pour un autre : exclu sans avis juridique.

---

## 6. Sécurité

### 6.1 Failles de l'audit et corrections

| Faille (`recherche/audit-code.md`) | Correction dans la cible | Ticket | Touche |
|---|---|---|---|
| **B1** `/api/plans` liste les plans de tous (`serveur.py:541`, `accueil.html:115`, `:276`) | liste « Mes plans » cadrée par organisation ; test d'accès croisé | M2.5 (L5-05) | — (nouveau code) |
| **B2** état, visites et actions accessibles à qui connaît l'identifiant (`serveur.py:534`, `:586`) | chaque route vérifie l'organisation ; vue publique réduite de l'état (étape, pourcentage, message du catalogue) ; fichiers de travail jamais servis | M2.5, M2.6 (L5-05, L5-06) | — |
| **B3** identifiant = nom du fichier et 32 bits d'aléa (`slug`, `serveur.py:46`) | UUID interne, jeton de partage séparé de 128 bits, nom du fichier jamais dans une URL | M0.6, M2.9 (L1-06, L5-13) | [P] |
| **B4** serveur limité à localhost (`hote_ok`, `origine_ok`, `serveur.py:499-510`) | liste d'hôtes issue de la configuration et de `domaines` ; CSRF lié à la session ; l'en-tête `x-nom` disparaît | M2.3 (L5-03) | — (le local garde sa protection) |
| **B5** `http.server` en production (`serveur.py:11`, `:698`), dépôt lu en mémoire (`:571`) | FastAPI et uvicorn derrière Caddy (TLS, délais, limites), dépôt direct au stockage | M2.1, M2.5 (L5-01, L5-05) | — |
| **B6** les scripts Chrome servent tout le dépôt, `.env` compris, sur toutes les interfaces (`photos.mjs:19-23`, `controle.mjs:16-21`) | écoute sur `127.0.0.1`, liste blanche `plans/<id>/` et `moteur/` ; dans le worker de rendu, seuls les fichiers du plan sont présents | **M0.3** (L1-01) | [M] |
| **B7** plan du promoteur publié avec la visite (`VISITE`, `serveur.py:461` ; `ui.js:527`) | superposition retirée des publications, sauf accord prouvé ; vue propriétaire par jeton court ; en mode simple, le moteur masque la superposition et « Rendu photoréaliste de la vue » | M2.8 (L5-12), L4-11, L10-06 | — ; [M] pour L4-11 |
| **B8** coûts IA sans plafond, relances illimitées | budgets du § 6.5 (3 $ par plan, toutes passes et relances confondues), une relance payante au plus, erreur 402 sans relance automatique | M1.2, M2.6 (L4-02, L5-06, L5-09) | [P] |
| **B9** textes techniques à l'écran (`accueil.html:205`, `serveur.py:296`, `expliquer` `:396`, `ui.js:363-389`, `:724`, `engine.js:1362`, titre par défaut `lire.py:1263`) | catalogue de messages, détail au journal, contrôle automatique | M0.4, M0.5, M1.5 (L1-04, L1-05, L4-05) | [P] [M] |
| **B10** configuration dans `os.environ`, `importlib.reload` à chaud (`serveur.py:28-40`, `:300`, `:352`) | objet de configuration passé en paramètre ; pas de rechargement en service | M1.1 (L4-01) | [P] |
| **B11** Chrome configuré pour macOS (`--use-angle=metal`, `photos.mjs:28`, `controle.mjs:25`) | module Chrome partagé, rendu choisi par la configuration (SwiftShader par défaut en conteneur, Metal en local sur Mac, Vulkan plus tard) | M1.6 (L1-09) | [M] |

### 6.2 En-têtes, CSP, intégration

**Sur toutes les réponses :** `Strict-Transport-Security` (1 an), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` restrictive (caméra, micro, géolocalisation coupés).

**Application (`app.<domaine>`)**, point de départ :

```
default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;
connect-src 'self' https://<seau-privé>.s3.fr-par.scw.cloud;
img-src 'self' data: https://cdn.<domaine> https://<seau-privé>.s3.fr-par.scw.cloud;
style-src 'self'; font-src https://cdn.<domaine>; object-src 'none'; base-uri 'none';
form-action 'self'; frame-ancestors 'none'
```

Turnstile n'intervient qu'à l'inscription. Stripe Checkout est une redirection, sans script dans nos pages.

**Visite (`visite.<domaine>`)**, point de départ :

```
default-src 'none'; script-src https://cdn.<domaine>/moteur/v<N>/ https://cdn.<domaine>/vendor/ 'sha256-<importmap>';
style-src https://cdn.<domaine>/moteur/v<N>/ https://cdn.<domaine>/vendor/; img-src 'self' https://cdn.<domaine> data: blob:;
connect-src 'self' https://cdn.<domaine>; font-src https://cdn.<domaine>; worker-src blob:;
object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors <liste>
```

- Ces deux politiques sont des points de départ. **La visite de contrôle relève chaque violation de CSP** (événement `securitypolicyviolation`) **et chaque requête vers une origine non prévue, et échoue s'il y en a.** Les besoins réels du moteur sont ainsi mesurés et non devinés. Exemple : `ui.js` écrit des attributs `style` par `innerHTML` (`ui.js:363`, `:366`), ce qui peut demander un `style-src-attr 'unsafe-inline'` provisoire.
- Les rapports de violation en production vont à `/api/csp` et déclenchent une alerte s'ils augmentent.
- En plus : `X-Robots-Tag: noindex, nofollow` ; `Referrer-Policy: no-referrer` (le jeton est dans l'URL) ; `Cache-Control: private, no-store` pour `index.html` et `plan.json`.

**Aperçu (`app.<domaine>/plans/<id>/apercu`, `visite.<domaine>/a/<jeton>`).** Même base que la visite, mais sans `cdn.<domaine>/moteur/` ni `/vendor/` dans `script-src` : la page ne charge aucun script du moteur. `noindex`, `no-referrer`. Le contrôle de publication vérifie qu'aucune requête ne part vers `engine.js`, `/vendor/three` ou `plan.json` (§ 5.3).

**`frame-ancestors` par client.**
- Par défaut `'none'` : un lien de conseiller n'a pas à être intégré.
- Pour un partage de type `integration` : la liste des hôtes `domaines.usage = 'parent_integration'` **vérifiés** de l'organisation, calculée à chaque réponse.
- `X-Frame-Options` n'accepte pas de liste : il n'est envoyé (`DENY`) que lorsque la liste est vide.

### 6.3 Jetons

| Jeton | Taille | Stockage | Durée | Remarques |
|---|---|---|---|---|
| Partage (lien ou intégration) | **128 bits** au moins (16 octets, 22 caractères base64url) | SHA-256 pour la recherche, copie chiffrée (AES-GCM, clé au gestionnaire de secrets) pour réafficher le lien | visite : sans limite par défaut, expiration réglable, révocable ; lien d'aperçu : 30 jours (`OFFRES.md` § 2.2), révocable | jamais transmis à Umami (remplacé par `:jeton`, `recherche/suivi.md` § 7.2) |
| Lien de connexion | 256 bits, plus un code à 6 chiffres | haché | 15 min, usage unique, 5 essais de code | lié à l'e-mail, pas au navigateur |
| Session | 256 bits | haché | 30 jours glissants | rotation à la connexion, révocable, liste des appareils |
| Invitation | 256 bits | haché | 7 jours | e-mail de l'invité vérifié à l'acceptation |
| Vue propriétaire | 256 bits | haché | 5 min, un seul plan | seul accès à la superposition sans accord |
| Rappel de rendu | 256 bits | haché, lié au travail et à l'image | délai de la tâche, usage unique | **un jeton par image rendue** (livraison image par image, L5-10, L5-11) ; seule « identité » de l'exécutant de rendu |
| Clé d'API promoteur | 256 bits, préfixe affiché | haché | jusqu'à révocation | portées limitées |

Toutes les comparaisons se font en temps constant (`hmac.compare_digest`).

### 6.4 Limites de débit

Valeurs de départ, à ajuster sur les journaux. Compteurs dans Postgres (table `limites`) : pas de Redis au lancement.

| Action | Limite |
|---|---|
| Demande de lien de connexion | 5 par heure par e-mail, 20 par heure par IP |
| Essai de code à 6 chiffres | 5 par jeton, puis jeton invalidé |
| Dépôt | 20 par heure par compte ; 40 Mo ; dépôt anonyme : 10 analyses par heure et par IP (L5-23) |
| Travaux simultanés | par organisation, selon l'offre (`travaux_simultanes_max`) ; au-delà, le travail attend son tour au lieu d'un refus |
| Crédit offert | 1 par e-mail normalisé, par compte Google, par empreinte de fichier et par empreinte de page rendue ; 3 lancements par IP (IPv4 /32, IPv6 /64) et par 24 h, au-delà différés et non refusés ; Turnstile à l'inscription |
| Relance payante | 1 par travail, dans le budget de 3 $ du plan |
| Ouverture de visite | 300 par heure par jeton et par IP (contre l'aspiration) |
| API promoteur | 60 par minute par clé |

### 6.5 Budgets IA et clés

Décision n° 3 : **les blocages sont d'abord dans notre logiciel.** Chaque appel est écrit dans `appels_ia` avec son organisation et son travail : on sait qui consomme quoi (vues de coût par organisation, par jour, par travail et par source de lot, L5-09). Les plafonds se règlent sans déploiement (réglages en base, modifiables par l'administration ; valeurs par offre lues dans le catalogue) et bloquent avant la dépense. Les plafonds des clés OpenRouter ne sont qu'un **second verrou**. Les valeurs commerciales (quatre niveaux) sont celles d'`OFFRES.md` § 6.7.

| Niveau | Mécanisme | Valeur de départ |
|---|---|---|
| **Appel** | `max_tokens` borné par étape, comme aujourd'hui : lecture 100 000 (`lire.py:107`), relecture 60 000 (`:635`), arbitrage 4 000 (`:713`), réparation du JSON 30 000 (`:1340`), qualification 4 000 (`serveur.py:273`) | existant |
| **Plan** | objet `Budget` passé à `call`, réservé au lancement : avant chaque appel, dépensé plus estimation prudente de l'appel (9e décile mesuré de l'étape, sinon `max_tokens` × prix) doit rester sous le budget ; sinon arrêt propre, travail `attente_budget` puis `echec`, crédit libéré, alerte. Le dépassement possible est donc borné à un appel | **3 $ par plan, toutes passes et relances confondues** : qualification, lecture, relecture, arbitrages, réparation du JSON et relance payante (mesuré : 1,10 à 1,85 $ par plan, 1,37 $ au plus pour un appel ; plafond théorique d'une passe environ 13 $) |
| **Relances** | une relance payante par travail, **comptée dans les 3 $ du plan** ; les reprises sans IA (`rejouer`) sont illimitées | 1 |
| **Organisation** | plafond mensuel en dollars (`organisations.plafond_ia_mensuel_usd`), en plus des crédits : borne un abonnement dont chaque plan coûterait anormalement cher ; plein → pas de lancement, message du catalogue, alerte | par exemple 1,5 × plans inclus × 1,85 $ (à fixer par offre, dans le catalogue) |
| **Jour (plan offert)** | plafond quotidien des plans offerts des particuliers, réservé au lancement ; atteint, ou interrupteur `gratuit_actif` coupé → le plan offert attend le lendemain avec un message clair, les payants continuent (L5-09, L8-09) | 10 $/jour au départ, puis indexé sur la marge (`OFFRES.md` § 8.8) |
| **Import promoteur** | `imports.budget_usd`, file basse priorité | fixé au devis |
| **Global** | plafond mensuel de tout le service en base ; puis clés OpenRouter séparées, créées par l'API de gestion, avec `limit` et `limit_reset` ; recharge automatique coupée ou basse ; alertes à 50, 80 et 100 % par lecture périodique de `GET /api/v1/key` ; clé sans plafond → alerte critique | voir ci-dessous |

Clés OpenRouter (choisies par travail selon la source du lot, jamais par l'utilisateur) :
- `prod-payant` : plafond mensuel d'environ 1,5 fois la prévision. Sert à tout plan payant ou inclus, **y compris les essais pros**, sur le budget de leur organisation ;
- `prod-gratuit` : plafond **quotidien**, réservé au **plan offert des particuliers**, et à lui seul. Une fois atteint, les plans offerts attendent le lendemain avec un message clair, les payants continuent ;
- `dev` : 10 $ par jour, pour le poste local et la préproduction. C'est la clé à mettre dans le `.env` local (règle du projet : ne pas payer de lecture vouée à l'échec) ;
- plus tard, une clé par client de marque blanche ou refacturé au coût réel (`organisations.cle_ia_nom`).

Erreurs 402 et 403 : **aucune relance automatique**. `error.metadata.limit_source` dit quelle limite a joué ; il est journalisé.

### 6.6 Données envoyées à l'IA

- **ZDR imposée dans chaque requête** : `provider: {zdr: true}` dans le corps (`lire.py:124`), et un garde-fou au niveau du compte OpenRouter. Un test unitaire vérifie la présence du champ.
- **Masquage du cartouche** (noms, adresse) avant l'envoi, recommandé par `recherche/juridique.md` § 3.2. Attention : le tableau des surfaces et les cotes doivent rester lisibles. Ticket `[P]` (L1-10) mesuré avec `evaluer.py`, et fait plan par plan.
- Routage UE : D7.

### 6.7 Secrets et moindre privilège

- Secrets dans le gestionnaire de secrets de l'hébergeur (Secret Manager chez Scaleway) ou, à défaut, dans les secrets de Docker Compose, injectés au démarrage des conteneurs. Jamais dans l'image, jamais dans le dépôt, jamais dans les journaux : un filtre retire les motifs de clé (`sk-or-`, `sk-ant-`, `sk_live_`, `whsec_`).
- L'application n'a **pas** la clé OpenRouter. Le worker lecture n'a pas les secrets Stripe.
- La visite de contrôle et `photos.mjs` sont lancés **sans aucune variable d'environnement secrète** (`env` réduit au strict nécessaire), car Chrome y exécute une page qui affiche des textes issus du plan.
- L'exécutant de rendu n'a aucun identifiant de stockage : seulement des URL signées valables pour son travail.
- Identifiants S3 distincts par service : l'application signe les envois vers `prive/depots/` et lit `publie/` ; le worker lecture lit et écrit `prive/` et écrit `publie/`.
- Toute action de l'équipe sur les données d'un client passe par l'administration et laisse une trace dans `journal_equipe`. L'accès de l'équipe exige une double authentification.

### 6.8 Tests de sécurité automatiques

Dans la CI, selon la règle « tout défaut devient un contrôle » :
- accès croisé entre deux organisations sur chaque route : réponse 404 ;
- jetons rejoués, expirés, falsifiés, tronqués ; comparaison en temps constant ;
- énumération d'e-mails : même réponse et même délai pour une adresse connue ou inconnue ;
- limites de débit effectives ;
- CSRF sur chaque POST ;
- webhooks Stripe non signés ou rejoués refusés ;
- en-têtes présents sur chaque type de réponse ;
- `/.env`, `/plans/…/reponse-ia.json` et `/…/page.png` inaccessibles par toutes les voies (application, CDN, scripts Chrome) ;
- pour un aperçu : `index.html`, `plan.json` et `engine.js` répondent 404 par toutes les voies avant le déblocage ;
- jeton de rappel de rendu rejoué, expiré ou falsifié : refusé ;
- aucun secret dans les journaux produits par les tests.

---

## 7. Configuration par compte au lieu de `os.environ`

C'est le prérequis de la personnalisation pour les pros et de la marque blanche.

### 7.1 Aujourd'hui

- `load_env` réécrit `os.environ` avant chaque étape IA (`serveur.py:28-40`).
- `lire.py` lit le modèle, le fournisseur, l'effort et la clé dans l'environnement (`lire.py:18`, `:94-104`, `:109`, `:127`, `:635`).
- Les prompts sont des constantes de module (`SYSTEM` `lire.py:223`, `RELECTURE` `:606`, `ARBITRE` `:645`).
- `importlib.reload` à chaque lecture et contrôle (`serveur.py:300`, `:352`) : pratique en développement, mais c'est une course quand deux plans tournent en même temps.

Conséquence : impossible d'avoir deux réglages différents dans le même processus.

### 7.2 Cible

```python
@dataclass(frozen=True)
class ConfigIA:
    fournisseur: str            # 'openrouter' | 'anthropic'
    modele: str                 # 'anthropic/claude-opus-5'
    effort: str                 # 'medium'
    effort_relecture: str       # 'medium'
    cle: str = field(repr=False)            # secret : jamais journalisé ni copié dans travaux.config
    cle_nom: str                # 'dev' | 'prod-payant' | 'prod-gratuit' | clé d'un client
    zdr: bool = True
    ia_autorisee: bool = True   # False pour 'rejouer' : tout appel lève une erreur
    budget_usd: float = 3.0     # par plan, toutes passes et relances confondues
    arbitrages_max: int = 8     # aujourd'hui maxi=8 (lire.py:676)
    consignes: str = ''         # ajoutées au prompt ; validées par evaluer.py avant usage
    version_prompts: str = ''

@dataclass(frozen=True)
class ConfigRendu:
    chrome: str                 # 'swiftshader' (par défaut, en conteneur, partout) | 'metal' (local, Mac) | 'vulkan' (plus tard)
    images: tuple               # images d'aperçu, dans l'ordre : ('vue_dessus', 'plan_2d', 'photo_1', 'photo_2')
    moments: tuple              # un seul éclairage dans la version de base ('jour')
    photos_max: int             # 2 au lancement ; galerie complète plus tard (L13-02)
    mode_simple: bool           # D.simple (ui.js:261, :387, :632)
    mention: str                # texte incrusté, non modifiable par les clients

@dataclass(frozen=True)
class ConfigProduit:
    type_plan: str              # 'apercu' | 'complet' (suit le lot réservé)
    niveaux_max: int = 1        # duplex refusés tant qu'ils ne sont pas validés
    superposition_autorisee: bool = False

@dataclass(frozen=True)
class Config:
    ia: ConfigIA; rendu: ConfigRendu; produit: ConfigProduit
    @staticmethod
    def depuis_env() -> 'Config': ...   # reproduit exactement le comportement local actuel
```

**Ordre de résolution :** valeurs par défaut du code (versionnées) < version d'offre du catalogue (§ 4.2) < réglages de l'organisation (version active) < surcharge par l'équipe sur un travail. L'environnement ne porte que l'infrastructure et les secrets : base, seaux, clés, domaines, `MARQUE_NOM`. La configuration résolue, sans la clé, est copiée dans `travaux.config` : on sait toujours avec quels réglages une visite a été produite, et on peut la rejouer à l'identique.

**Signatures :**
- `read_plan(folder, pid, mock=None, progress=None, config=None)` et `call(…, config=None)` ;
- `config=None` veut dire `Config.depuis_env()`. **L'outil local et `outils/finalise.sh` ne changent pas.**

**Rechargement de modules :**
- en service, jamais : le worker redémarre au déploiement ;
- en local, gardé derrière `PLAN_DEV_RECHARGE=1`, pour ne pas gêner le travail en cours.

### 7.3 Qui règle quoi

| Réglage | Particulier | Conseiller (admin de l'organisation) | Promoteur | Équipe |
|---|---|---|---|---|
| Logo, couleurs (jetons de `visite.css:1-16`), mot d'accueil, coordonnées | non | oui | oui | oui |
| Mention « illustration non contractuelle » | non modifiable | non modifiable | complément possible, pas de retrait | — |
| « Propulsé par » | affiché | affiché | retirable (option payante) | — |
| Domaines de visite, sites autorisés à intégrer | non | domaine de visite (option) | oui | oui |
| Préférences de rendu (moments, nombre de photos, mode simple) | non | oui, dans une liste fermée | oui | oui |
| Modèle, effort, consignes ajoutées au prompt | non | non | sur demande | **oui, après `evaluer.py` sur les plans de référence** |
| Plafond IA mensuel, travaux simultanés | selon l'offre | selon l'offre | selon le contrat | oui |
| Superposition du plan du promoteur dans les liens | jamais | seulement avec preuve d'accord | avec autorisation | contrôle de la preuve |

Les textes saisis par les clients (mot d'accueil, coordonnées) passent par le même filtre que le contrôle « aucun texte technique » et sont échappés à l'affichage.

Les réglages de marque sont servis à côté de la visite (`reglages.json`), **pas dans `plan.json`**. Changer un logo ne demande ni lecture ni rendu, sauf si la marque figure dans les photos (elle n'y figure pas : la mention incrustée reste neutre).

---

## 8. Chemin de migration

### 8.1 Coordination avec le travail sur les duplex

Au 27/09/2026, un autre agent modifie `pipeline/extract.py`, `lire.py`, `murs.py`, `serveur.py`, `accueil.html` et crée `pipeline/niveaux.py` (arbre de travail non validé).

Règles :
1. **Ajouter plutôt que modifier.** Les nouveaux éléments vont dans `service/` (application et workers), `outils/`, ou de nouveaux fichiers de `pipeline/` (`etapes.py`, `messages.py`, `config.py`, `marquage.py`). Les tickets `[P]` et `[M]` sont de **petits diffs isolés**, sur une branche courte.
2. **Les refontes mécaniques** (M1.1 configuration, M1.4 étapes ; L4-01, L4-04) touchent `lire.py` et `serveur.py` partout. Elles se font **après la fusion du travail sur les duplex**, ou par le même agent, jamais en parallèle.
3. **Critère de fusion commun à tout ticket `[P]` ou `[M]` :**
   - rejeu sans IA des plans de référence (M0.1, L1-02) avec des `plan.json` identiques, ou des écarts voulus et justifiés, `evaluer.py` au moins égal à la référence ;
   - visite de contrôle réussie ;
   - contrôle des textes réussi ;
   - test de fumée de l'outil local réussi.
4. **`niveaux.py` n'est pas touché par la migration.** Le service applique `niveaux_max = 1` et ne communique pas sur les duplex tant qu'ils ne sont pas validés sur des plans réels.
5. Aucun ticket ne généralise un comportement à des plans inconnus.

### 8.2 Correspondance entre le code actuel et la cible

| Aujourd'hui | Cible |
|---|---|
| `load_env` (`serveur.py:28`) | supprimé en service ; `Config.depuis_env()` en local |
| `slug` (`serveur.py:46`) | UUID ; jeton de partage séparé |
| `format_fichier` (`:52`), `ouvrir_image` (`:112`), `choisir_page` (`:126`) | repris tels quels dans l'étape d'analyse |
| `state`, `_state`, `lire_etat` (`:67-97`), `etat.json` | interface `Suivi` : `SuiviEtatJson` en local (comportement actuel), `SuiviBase` en service (`travaux`, `etapes`) |
| `technique` (`:100`), `technique_erreur` | `etapes.detail_technique`, journal seulement |
| `analyse`, `qualifier`, `lecture`, `controle`, `photos` (`:132`, `:260`, `:289`, `:346`, `:378`) | `pipeline/etapes.py`, appelées par `serveur.py` en local et par les workers |
| `expliquer` (`:396`) | `pipeline/messages.py` : code, puis texte du catalogue |
| `run` (`:419`), `SLOTS`, fils de fond | local : inchangé ; service : chaîne de tâches Procrastinate (files `analyse`, `lecture`, `rendu`) |
| `reserver`, `liberer`, `RUNNING` (`:444-458`) | index unique `un_travail_actif_par_plan` |
| `VISITE`, `servable` (`:461-464`) | liste blanche de publication (§ 5.3) |
| classe `H` (`:483`) | routes FastAPI |
| `reprise_au_demarrage` (`:674`) | battement de cœur et reprise sans repayer |
| `ENFANTS`, `arreter` (`:25`, `:337`) | repris dans les workers (groupe de processus tué avec le travail) |
| `copy modele.html` (`:349`, `:380`) | `index.html` produit à la publication d'une visite, avec la version du moteur ; aucun pour un aperçu |
| `photos` (`:378`) et `photos.mjs` sans argument (toutes les vues de `plan.photos`) | préréglage `apercu` : 4 images ordonnées, annoncées une à une (L4-09) ; exécutant en conteneur SwiftShader (L5-10) ; sans argument, comportement local inchangé |
| `appels-ia.json`, `rapport.json` (`lire.py:1304`, `:1406`) | gardés dans l'espace privé, **et** lignes `appels_ia` |
| `outils/finalise.sh` | travail `rejouer` (administration) ; le script reste l'outil local |
| `pipeline/evaluer.py`, `references/` | CI et garde-fou des réglages IA |
| Notification du navigateur (`accueil.html:135-144`) | e-mails ; notification gardée en complément quand la page est ouverte |

### 8.3 Phases et tickets

Charges : estimations pour une personne, hors imprévus. Chaque ticket est livrable seul et a son test d'acceptation. Les charges des tickets de `tickets/` (`PLAN.md` § 6.1) sont plus élevées : elles comptent aussi la vitrine, les décisions, l'exploitation, le support et les tests.

**Correspondance avec `tickets/`.** Les tickets du dossier `tickets/` font foi pour le détail ; leur identifiant `L*` suit le nom de chaque ticket M dans les tableaux ci-dessous. En résumé :
- phase 0 → lot 1 (filets de sécurité) ;
- phase 1 → lot 4 (cœur réutilisable), sauf M1.6 → L1-09 ;
- phase 2 → lot 5 (socle en ligne), puis lot 6 (parcours particulier et bêta fermée) ;
- phase 3 → lot 8 (paiement des particuliers), sauf M3.2 → L6-05 et L8-02, M3.3 → L6-06 (lot 6, avant la bêta fermée) et M3.5 → L5-20 (lot 5) ;
- phase 4 → lot 9 (conseillers) ; phase 5 → lots 10 (promoteurs) et 11 (marque blanche) ;
- sans équivalent ici : lot 0 (décisions), lot 2 (vitrine), lot 3 (bêta express, facultative), lot 7 (mesure), lot 12 (publicité), lot 13 (après lancement). Les tickets ajoutés dans les lots 1, 4, 5, 6 et 8 à 11 sans ticket M sont nommés sous chaque phase.

#### Phase 0 : filets de sécurité et correctifs immédiats (outil local, 3 à 5 jours)

| Ticket | Contenu | Touche | Accepté quand |
|---|---|---|---|
| **M0.1** Jeu de référence rejouable · L1-02 | `outils/rejouer_references.sh` (nouveau). Les 4 plans réels (432, D201, Soline, lot 11) sont copiés hors du dépôt (dossier local de l'équipe, plus tard `references-privees/`) avec leur source, `extract.json` et `reponse-ia.json`. Le script rejoue chaque plan sans IA dans un dossier temporaire, lance `evaluer.py` (432, D201), la visite de contrôle et le rendu de 3 vues fixes, puis enregistre une ligne de base | — | Tourne clés vidées, sans aucun appel payant ; produit un tableau (ouvertures, équipements, contrôle, écart d'image) ; la ligne de base est enregistrée |
| **M0.2** Appartement témoin fictif · L1-03, L1-12 | Un plan de vente **créé par nous** (T2 ou T3 sur un niveau, PDF vectoriel), avec son relevé `plan.json` fait à la main et sa lecture gardée, **versionné** dans `references/temoin/`. Il sert à la CI, à la démonstration et aux visuels marketing | — | `finalise.sh` passe ; contrôle réussi ; utilisable en CI sans aucun fichier de promoteur |
| **M0.3** Scripts Chrome fermés (B6) · L1-01 | `listen(0, '127.0.0.1')` ; liste blanche `plans/<id>/` et `moteur/` | [M] | `curl` sur `/.env` et sur un autre plan → 404 ; le port n'écoute que sur 127.0.0.1 ; rejeu M0.1 identique |
| **M0.4** Contrôle « aucun texte technique », version 1 · L1-04 | `outils/textes.mjs` (nouveau) : ouvre la visite, parcourt chaque mode (galerie, fiche, plan, maquette, visite), extrait le texte visible, lit les champs texte de `plan.json` et les messages de `etat.json`. Motifs interdits : `.env`, `Error`, `Exception`, `Traceback`, `json`, `undefined`, `NaN`, `null`, `[object`, URL, chemins de fichier, identifiants techniques (`[a-z0-9-]+-[0-9a-f]{8}`), coordonnées `(1.23 ; 4.56)`, noms anglais des types d'équipement (`shower`, `bath`, `sink`…), jargon listé dans le prompt (`lire.py:239`) | — | Échoue sur les fuites connues (`ui.js:724`, titre par défaut `lire.py:1263`) ; passe une fois M0.5 livré ; chaque nouvelle fuite trouvée ajoute un motif |
| **M0.5** Textes visibles · L1-05 | `accueil.html:93` (promesse fausse une fois l'onglet fermé) ; détail technique retiré de l'écran (`accueil.html:205`) ; messages exploitant de `expliquer` (`.env`, « Chrome sans écran ») ; avertissements écrits pour l'IA qui remontent dans `#warns` ; messages d'erreur de `ui.js` et `engine.js` ; titre par défaut | [P] [M] | M0.4 passe sur les 4 références et sur des erreurs provoquées (clé absente, 402, 500, contrôle en échec) |
| **M0.6** Identifiant sans nom de fichier (B3) · L1-06 | `slug` produit un identifiant aléatoire ; le nom reste dans l'état | [P] | Un nouveau plan n'a pas le nom du fichier dans son URL ; les anciens dossiers s'ouvrent toujours |
| **M0.7** Dépendances figées (A13) · L1-07 | `requirements.lock` ; `package.json` et `package-lock.json` à la racine avec puppeteer figé. `photos.mjs` et `controle.mjs` essaient déjà l'import local avant le global (`photos.mjs:14`) | — | Installation propre depuis un clone neuf, test de fumée réussi |
| **M0.8** ZDR · L1-08 | `provider: {zdr: true}` dans le corps OpenRouter (`lire.py:124`) | [P] | Test unitaire sur le corps ; une lecture de contrôle avec la clé `dev` (1 à 2 $, **sur accord**) mesure l'effet sur la durée et le résultat |

Tickets du lot 1 sans équivalent M : L1-10 (masquage du cartouche avant l'envoi au modèle, `[P]`, § 6.6), L1-11 (CI de non-régression : chaîne sans IA du témoin et images approuvées dans `references/temoin/images-approuvees/`), L1-12 (relevé manuel et lecture gardée du témoin, complète M0.2).

#### Phase 1 : cœur réutilisable, sans changement pour l'outil local (6 à 9 jours)

| Ticket | Contenu | Touche | Accepté quand |
|---|---|---|---|
| **M1.1** Objet de configuration (B10) · L4-01 | `pipeline/config.py` ; `read_plan` et `call` reçoivent `config` ; `Config.depuis_env()` ; rechargement de modules derrière un drapeau | [P], **après la fusion des duplex** | Rejeu M0.1 identique ; `grep os.environ pipeline/lire.py` ne trouve plus que `depuis_env` ; l'outil local marche avec le `.env` comme avant |
| **M1.2** Journal fiable et budget par plan (B8, A7) · L4-02 | L'appel est journalisé **avant** toute exception (erreur au milieu du flux, `lire.py:150-164`) ; coût de la qualification compté dans le total ; le cumul n'est plus remis à zéro par `ecarter_lecture` (`serveur.py:251`) ; objet `Budget` | [P] | Tests avec un faux serveur OpenRouter : appel interrompu compté ; budget dépassé → arrêt propre et code d'erreur du catalogue |
| **M1.3** Nouvelles tentatives (A2) · L4-03 | 429, 5xx et erreurs réseau : 3 essais espacés de façon croissante dans `call` ; 402 et 403 : aucun | [P] | Tests avec le faux serveur |
| **M1.4** Étapes extraites · L4-04 | `pipeline/etapes.py` : `analyser`, `qualifier`, `calibrer`, `lire`, `controler`, `photographier`, qui prennent `(dossier, config, suivi)` ; `serveur.py` garde le HTTP et l'enchaînement ; interface `Suivi` | [P], **après la fusion des duplex** | Même suite d'états dans `etat.json` sur une exécution `PLAN_MOCK` ; rejeu identique |
| **M1.5** Catalogue de messages (B9) · L4-05 | `pipeline/messages.py` : code, texte pour l'utilisateur, relance possible ou non ; `expliquer` renvoie un code | [P] | Test unitaire : chaque message du catalogue passe le filtre de M0.4 ; injection d'exceptions dans chaque étape → l'état public ne contient que des textes du catalogue |
| **M1.6** Chrome configurable (B11) · L1-09 | `moteur/chrome.mjs` partagé par `photos.mjs` et `controle.mjs` (serveur statique en liste blanche, lancement) ; rendu choisi par `RENDU_CHROME=metal|swiftshader|vulkan` : SwiftShader par défaut en conteneur, partout (D3) ; Metal par défaut en local sur macOS | [M] | Local inchangé ; en SwiftShader sur Mac : même verdict de contrôle, images à moins de 2/255 (mesure de la recherche reproduite) |
| **M1.7** Moteur servi par nous (A5) · L4-06 | `moteur/vendor/` : three.js 0.180.0, three-mesh-bvh 0.9.1, three-gpu-pathtracer 0.0.24 et les polices Archivo et DM Mono, avec empreintes vérifiées ; importmap de `modele.html` et polices d'`accueil.html` pointées dessus | [M] [P] | La visite se charge et le contrôle passe avec tout accès réseau extérieur bloqué (interception des requêtes dans puppeteer) ; contrôle ajouté : aucune requête hors de nos origines |
| **M1.8** Mention et métadonnées (A6) · L4-07 | `pipeline/marquage.py` : mention incrustée dans chaque photo, métadonnées de contenu généré (valeur IPTC à choisir avec l'avocat, `recherche/juridique.md` § 5.4) ; mention permanente dans la visite et la fiche | [P] (+ [M] pour la visite) | Test : chaque JPEG porte la mention (zone de pixels vérifiée) et la métadonnée ; M0.4 passe |
| **M1.9** Réglage `niveaux_max` · L4-08 | Le refus existant (`niveaux_refus`, `serveur.py:218`) lit `ConfigProduit.niveaux_max` ; valeur locale inchangée | [P], avec l'agent des duplex | En service, un plan à 2 niveaux est refusé avant tout appel payant, avec un message du catalogue |

Tickets du lot 4 sans équivalent M, tous `[M]` et soumis au critère de fusion du § 8.1 : L4-09 (images d'aperçu rendues par le serveur, dans l'ordre vue du dessus, plan 2D, 2 photos ; galerie adaptable de 0 à N photos), L4-10 (visite dans le navigateur du client : compatibilité, repli sans WebGL), L4-11 (en mode simple, le moteur masque « Rendu photoréaliste de la vue » et la superposition du plan du promoteur, réservée au propriétaire ou à l'accord du promoteur ; avant la bêta fermée).

#### Phase 2 : socle en ligne et bêta fermée (15 à 22 jours)

| Ticket | Contenu | Accepté quand |
|---|---|---|
| **M2.1** Squelette `service/` (D2) · L5-01 | FastAPI, Alembic, Docker Compose local (Postgres 16, MinIO pour S3, Mailpit pour les e-mails), configuration d'infrastructure, point de santé, journaux structurés | `docker compose up` ; CI verte ; aucune dépendance à `pipeline/serveur.py` |
| **M2.2** Stockage · L5-02 | `service/stockage.py` : URL signées, copie, liste blanche ; synchronisation du dossier temporaire du worker (télécharger, exécuter, téléverser) | Test : un plan témoin fait l'aller-retour ; aucun fichier hors liste blanche dans `publie/` |
| **M2.3** Authentification (D1) · L5-03 | couche `FournisseurIdentite`, lien magique avec code, Google, sessions, CSRF, organisation personnelle créée à l'inscription, hôtes autorisés (B4) | Tests du § 6.8 ; parcours complet sur iPhone (lien ouvert depuis l'application Gmail) |
| **M2.4** Organisations · L5-04 | membres, rôles, invitations, changement d'organisation active | Tests d'accès par rôle |
| **M2.5** Plans et dépôt (B1, B2, B5) · L5-05 | création, URL signée, « Mes plans », suppression ; routes cadrées par organisation | Tests d'accès croisé : 404 partout |
| **M2.6** Travaux, file, worker lecture (A1, A2) · L5-06 | Procrastinate ; files `analyse`, `lecture`, `rendu` ; sous-processus avec délai (analyse 2 min, lecture 30 min) et limite mémoire ; battement de cœur ; reprise ; écran « chantier » repris d'`accueil.html` sur la vue publique de l'état ; une relance payante au plus | Plan témoin de bout en bout en `PLAN_MOCK` ; arrêt brutal du worker en pleine lecture → reprise sans nouvel appel payant |
| **M2.6b** Grand livre · L5-07 | `credit_lots`, `credit_mouvements` ; sources, types de plan, validités et ordre de consommation d'`OFFRES.md` § 6.2 et § 6.3 ; réservation, consommation, libération ; invariants du § 4.3 ; attribution des crédits `testeur` par l'administration | Tests d'invariants ; échec provoqué → crédit rendu sur le lot d'origine |
| **M2.7a** Mesure de rendu (D3 tranchée) · L5-10 | ancien essai Serverless Jobs, devenu **mesure informative** : durée de chaque image d'aperçu et de la visite de contrôle en SwiftShader sur la VM cible, notée dans `etapes.duree_ms` | Durées notées ; aucune décision n'en dépend ; le délai affiché vient du T0 (L5-11) |
| **M2.7b** Worker rendu en conteneur · L5-10 | service `rendu` du Compose, SwiftShader, sans secret ; contrat de rendu (URL signées, un jeton de rappel à usage unique par image, vues écartées annoncées sans réécrire `plan.json`) ; contrôle de chaque image (ni noire ni uniforme) ; contrôle d'aptitude sur le témoin | Images du témoin à moins de 2/255 des images approuvées ; aucun secret dans le conteneur de rendu ; image noire injectée refusée, jamais publiée |
| **M2.8** Publication et pages de visite (A3, B7) · L5-12 | liste blanche, `plan.json` filtré, `index.html` pointé sur `moteur/v<N>/`, `outils/publier_moteur`, en-têtes et CSP du § 6.2, vue propriétaire par jeton court ; publication d'aperçu sans `index.html` ni `plan.json` servis | Contrôles textes, CSP et réseau réussis ; `page.png` et `plan-*.png` introuvables par toutes les voies publiques ; aperçu : `index.html` et `plan.json` en 404 |
| **M2.9** Partages · L5-13 | jetons de 128 bits, révocation, expiration, compteur quotidien `vues_visite` | Tests de jetons ; un partage révoqué répond 404 dans la seconde |
| **M2.10** E-mails (D4, A4) · L5-14 | lien de connexion, aperçu prêt, visite prête, échec et crédit rendu ; modèles passés au filtre des textes | Mailpit en local ; SPF, DKIM et DMARC valides en préproduction |
| **M2.11** Supervision et administration (D5, A7, A11, A14) · L5-16, L5-17 | Sentry UE, battements de cœur, alertes du § 9.4 ; administration : rejouer sans repayer, coûts par plan et par organisation, crédits testeurs, `journal_equipe` | Une alerte provoquée de chaque type arrive ; un rejeu depuis l'administration ne crée aucune ligne `appels_ia` |
| **M2.12** Journal et audience · L5-15, L7-01 | table `evenements` alimentée par l'API et les workers ; Umami auto-hébergé en réglage minimal exempté, sans bandeau tant qu'aucun traceur non exempté n'est activé (`recherche/suivi.md` § 7.8, phase 0) | Aucun jeton ni identifiant de plan dans Umami (test sur les URL envoyées) |
| **M2.13** Préproduction · L5-18 | projet séparé chez l'hébergeur, déploiement automatique (§ 9.2), sauvegardes (§ 9.3) ; déploiement vérifié sur une VM d'un autre fournisseur (décision n° 2) | Restauration testée une fois ; plan témoin publié en préproduction |

Ces tickets ne touchent pas `pipeline/` ni `moteur/` : ils les appellent.

Tickets du lot 5 sans équivalent M : L5-08 (catalogue d'offres modifiable sans déploiement, versions immuables, droits acquis, § 4.2), L5-09 (budgets IA à quatre niveaux et clés séparées, § 6.5), L5-11 (livraison en deux temps, état public qui liste les images disponibles, mesure T0, § 2.3), L5-19 (tests de sécurité et limites de débit, § 6.8), L5-21 (exploitation, mode maintenance), L5-22 (capacité, concurrence, essai de charge sans payer), L5-23 (dépôt provisoire anonyme de 24 h). Lot 6 (parcours particulier et bêta fermée) : L6-01 à L6-12, dont L6-02 (qualification avant toute lecture payante, refus « plusieurs lots »), L6-03 (écran d'attente avec les images en direct), L6-05 (page d'aperçu), L6-10 (ouverture de la bêta fermée).

#### Phase 3 : paiement des particuliers (6 à 9 jours)

| Ticket | Contenu | Accepté quand |
|---|---|---|
| **M3.1** Stripe Checkout · L8-01 | offres du catalogue (un prix Stripe créé à neuf pour chaque version payante), achat en lignes (`achats_lignes`, un lot par ligne), webhook `checkout.session.completed` idempotent, rapprochement quotidien | Tests : webhook rejoué → un seul crédit ; paiement sans crédit → alerte ; pack → une ligne et un lot par prix unitaire |
| **M3.2** Aperçu et déblocage (verrou côté serveur) · L6-05, L8-02 | le plan offert produit une publication `apercu` : images rendues par le serveur (vue du dessus, plan 2D, 2 photos) et données de la fiche, sur une page rendue côté serveur. **Aucune route ne sert `engine.js`, `plan.json` ni `index.html` d'un aperçu** : rien de la visite n'est envoyé. Ce n'est pas un verrou d'interface : la maquette ouvre la visite par un double-clic au sol et `App.set('mode','walk')` suffit (`OFFRES.md` § 2.2). Déblocage : publication `complete` sur le même travail et la même version du moteur, sans lecture ni rendu, puis consommation directe d'un crédit complet | Avant déblocage, `engine.js` et `plan.json` répondent 404 par toutes les voies ; une page d'aperçu qui les charge fait échouer la publication ; le déblocage ne crée aucun appel IA ni tâche de rendu ; M0.4 passe dans les deux cas |
| **M3.3** Crédit offert et anti-abus · L6-06 | lot `offert_inscription` (30 jours), e-mail normalisé, domaines jetables refusés, empreinte du fichier et empreinte de la page rendue, limites par IP, Turnstile, clé `prod-gratuit` (plan offert des particuliers seulement) | Tests de chaque règle (`recherche/auth-paiement.md` § 3.5) |
| **M3.4** Parcours juridique B2C · L8-03 | case de renonciation à chaque lancement payant et au déblocage (`acceptations`), confirmation sur support durable par e-mail, fonction « Renoncer au contrat ici » avec accusé horodaté, remboursement **ligne par ligne** des plans non utilisés sous 14 jours (`OFFRES.md` § 6.5), export et suppression du compte | Relecture avec l'avocat ; tests des parcours |
| **M3.5** Conservation · L5-20 | tâche de purge (§ 4.4), y compris objets et sauvegardes à rotation | Test : un plan expiré n'existe plus ni en base ni dans les seaux |

Pendant la bêta fermée (lot 6), **aucun achat** : M3.2 ne sert qu'à la page d'aperçu (L6-05) ; le déblocage payant et l'ouverture à tous viennent avec le lot 8 (L8-02, L8-07). Tickets du lot 8 sans équivalent M : L8-04 (CGV, médiateur), L8-05 (factures, historique, remboursements), L8-06 (tests de prix, par périodes seulement), L8-07 (ouverture publique), L8-08 (téléchargements), L8-09 (budget du plan offert indexé sur la marge, coupe-circuit).

#### Phase 4 : conseillers (8 à 12 jours)

| Ticket | Contenu | Accepté quand |
|---|---|---|
| **M4.1** Abonnements · L9-01 | Stripe Billing, portail client, prix du catalogue ; `invoice.paid` → lot mensuel valable jusqu'à la fin du mois suivant (**report d'un mois**, `OFFRES.md` § 3.2 et § 6.2), SIREN et TVA collectés, résiliation accessible depuis nos pages | Tests des webhooks ; renouvellement simulé ; plans non utilisés reportés un mois, puis expirés |
| **M4.2** Réglages d'organisation · L9-06 | marque (jetons de couleur de `visite.css`, logo), mot d'accueil, préférences de rendu ; `reglages.json` servi avec la visite (petit changement `[M]` : `ui.js` le lit) | Changer la couleur d'un cabinet ne relance aucun travail ; M0.4 et CSP passent |
| **M4.3** Liens prospects · L9-04 | un lien par prospect, libellé, compteur agrégé ; bouton « Je suis intéressé, prévenir mon conseiller » ; suivi détaillé seulement après consentement sur la page ; ligne d'information pour le prospect (`recherche/juridique.md` § 3.7) | Sans clic ni consentement, le conseiller ne voit qu'un compteur par jour |
| **M4.4** Réglages IA par l'équipe · L9-07 | modèle, effort, consignes ajoutées, versionnés ; appliqués seulement si `evaluer.py` sur les plans de référence ne recule pas (lecture payante avec la clé `dev`, sur accord) | Un réglage non évalué ne peut pas être activé |
| **M4.5** Facturation électronique · L9-10 | application de plateforme agréée branchée sur Stripe ; catégorie « prestation de services » ; mentions DGFiP | Avant le 01/09/2027 au plus tard (`recherche/auth-paiement.md` § 4) |

Tickets du lot 9 sans équivalent M : L9-02 (essai pro, sur la clé `prod-payant` et le budget de l'organisation), L9-03, L9-05, L9-08, L9-09 (codes à offrir), L9-11 (premiers conseillers), L9-12.

#### Phase 5 : promoteurs et marque blanche (à chiffrer au premier contrat)

| Ticket | Contenu |
|---|---|
| **M5.1** Programmes, lots, import · L10-01, L10-02 | tables `programmes`, `lots`, `imports` ; dépôt de tous les plans d'un programme ; un PDF de plusieurs lots est découpé, une page = un plan, **avant** l'analyse (seul chemin qui l'accepte, § 2.3) ; file `lecture_lots` de basse priorité ; budget d'import ; rapport lot par lot ; décision D7 rouverte |
| **M5.2** Intégration · L10-04 | partages de type `integration`, `frame-ancestors` par client, événements `postMessage` (`visite:ouverte`, `visite:piece`) pour les outils de mesure du promoteur, clés d'API (liste des lots et de leurs liens) ; pas d'Umami dans l'iframe |
| **M5.3** Domaines des clients · L11-01 | CNAME, vérification par jeton DNS, certificat à la demande par Caddy (`on_demand_tls` avec point `ask` qui consulte `domaines`) ; les pipelines d'Edge Services limitent les domaines sur le CDN, d'où Caddy pour les pages |
| **M5.4** Superposition autorisée · L10-06 | preuve d'accord déposée et vérifiée par l'équipe, puis superposition dans les publications de cette organisation |
| **M5.5** SSO · L10-07 | broker branché comme un `FournisseurIdentite` (D1) |
| **M5.6** Clés IA par client · L11-03 | clé OpenRouter propre par client de marque blanche ou refacturé au coût réel |
| Plus tard | lot 13 : accélération du rendu (L13-01), galerie complète (L13-02), aperçu interactif à tester (L13-03), meublé, réalisme (GPU), 4K, TMA, visite de la résidence, plusieurs niveaux (L13-04 à L13-08) : hors de ce document |

Tickets des lots 10 et 11 sans équivalent M : L10-03 (validation des lots par le promoteur), L10-05 (portail distributeurs), L10-08 (premier pilote), L11-02 (thème par organisation), L11-04 (contrat et mise en service d'une instance).

### 8.4 Jalons d'ouverture

| Jalon | Techniquement prêt après | Prérequis hors technique (`recherche/juridique.md` § 7) |
|---|---|---|
| Bêta fermée (J0, L6-10), 1 crédit par testeur | Phases 0 à 2, avec les lots 1, 4, 5 et 6. **Aucun achat** : dépôt réservé aux invités (code d'invitation), variante « bêta » du catalogue (plan complet ou aperçu selon L0-04), aucun message qui propose 29 € | mentions légales, CGU, confidentialité et registre, DPA des fournisseurs, ZDR, masquage du cartouche, mentions « non contractuel » |
| Vente aux particuliers (J1), ouverture à tous (L8-07) | Phase 3, lot 8 | CGV B2C, médiateur, RC professionnelle, dépôt de la marque une fois le nom validé |
| Conseillers (J2) | Phase 4, lot 9 | CGV pro, DPA client, guide d'usage (autorisation du promoteur, information des prospects) |
| Promoteurs (J3), marque blanche (J5) | Phase 5, lots 10 et 11 | contrat promoteur, SLA, annexe marque blanche |

---

## 9. Environnements, déploiement, exploitation

### 9.1 Environnements

| | Local, outil | Local, service | Préproduction | Production |
|---|---|---|---|---|
| Lancement | `python3 pipeline/serveur.py` (inchangé) | `docker compose up` | `docker compose`, projet séparé chez l'hébergeur | `docker compose` chez l'hébergeur retenu (D2) |
| Données | `plans/` (jamais versionné) | témoin fictif (`references/temoin/`), MinIO | témoin et jeu de référence privé (accès équipe) ; aucun client | clients |
| IA | clé `dev` du `.env` (plafond 10 $/jour conseillé) ; `PLAN_MOCK` et rejeu pour tester sans payer | `PLAN_MOCK` et rejeu ; clé `dev` sur accord | clé `dev` | `prod-payant`, `prod-gratuit` |
| Rendu | Metal (Mac), ou SwiftShader par `RENDU_CHROME` | SwiftShader (conteneur `rendu`) | SwiftShader (conteneur `rendu`) | SwiftShader (conteneur `rendu`) ; accélération optionnelle après le lancement (L13-01) |
| Paiement | — | Stripe en mode test | Stripe en mode test | Stripe en mode réel |
| E-mails | — | Mailpit | TEM, adresses de l'équipe seulement | TEM |
| Domaine | `localhost:8780` | `localhost` | `*.preprod.<domaine>`, `noindex`, accès protégé | `<domaine>` |

### 9.2 Déploiement

- **CI** (GitHub Actions ou équivalent), à chaque demande de fusion : tests du § 9.5 marqués « chaque PR », puis construction de trois images (`web`, `worker-lecture` avec Chrome for Testing figé pour le contrôle, `rendu`), étiquetées par le commit et poussées au registre de conteneurs de l'hébergeur (Scaleway recommandé ; tout registre compatible OCI convient).
- **Vitrine :** `outils/site.py` assemble les pages depuis leurs sources (nom, prix du catalogue d'offres, parties communes), puis elles sont publiées. Un contrôle quotidien signale tout écart entre les prix de la vitrine et le catalogue en vigueur (L5-08).
- **Moteur :** si `moteur/` a changé, `outils/publier_moteur` publie `moteur/v<N+1>/` **avant** le déploiement de l'application. Les versions sont immuables : aucun retour arrière n'est nécessaire pour les visites déjà publiées.
- **Préproduction** déployée automatiquement depuis la branche principale. **Production** : promotion manuelle de la **même image**.
- **Migrations** Alembic en deux temps (étendre, puis contracter une version plus tard), car le web et les workers tournent brièvement dans deux versions différentes.
- **Arrêt des workers :** ils cessent de prendre du travail, attendent jusqu'à 20 min la fin des lectures en cours (8 à 15 min mesurées), puis s'arrêtent. Un travail interrompu reprend sans repayer (`reponse-ia.json`).
- **Retour arrière :** redéployer l'étiquette précédente. Les migrations en deux temps le permettent.
- **Secrets :** Secret Manager, injectés au démarrage ; rotation documentée (clés OpenRouter, Stripe, session).
- **Exécutant de rendu :** le service `rendu` du Compose suit la même étiquette d'image que le reste. Un exécutant d'accélération ajouté après le lancement (L13-01) suit la même étiquette : définition du job mise à jour pour Serverless Jobs ; script de mise à jour, image et version de Chrome figées pour un Mac mini.

### 9.3 Sauvegardes et restauration

D'après `recherche/hebergement.md` § 8 :
- Postgres géré : sauvegardes automatiques, plus un `pg_dump` chiffré chaque nuit vers un seau d'une **autre région** (30 jours et 12 mois) ;
- seau privé versionné ; les anciennes versions sont supprimées après 30 jours ; réplication quotidienne des objets essentiels (source, `reponse-ia.json`, `plan.json`) vers l'autre région ;
- photos et visites : **pas répliquées**, elles se régénèrent sans IA par `rejouer` ;
- VM sans état : procédure écrite de reconstruction en moins d'une heure ;
- **test de restauration mensuel automatisé** : dernier dump restauré dans une base temporaire, comptage des tables clés, rejeu d'un plan depuis la copie. Objectifs : perte de 24 h au plus, remise en service en 4 h au plus ;
- les données supprimées sortent aussi des copies à l'expiration de leur rotation (à inscrire au registre RGPD).

### 9.4 Supervision et alertes

Alertes par e-mail dès le premier jour :
- disponibilité de `app.`, `visite.` et `cdn.` ;
- battement de cœur absent depuis plus de 10 min pour un worker ;
- âge du plus vieux travail en file ;
- taux d'échec de la visite de contrôle ; image d'aperçu omise après nouvelles tentatives ; exécutant de rendu déclaré inapte ;
- coût IA d'un plan au-delà de 3 $ ; plafond d'organisation, du jour (plan offert) ou global atteint ; seuils de 50, 80 et 100 % sur chaque clé OpenRouter ; clé sans plafond ; toute erreur 402 ;
- réservation de crédit orpheline ; invariant du grand livre en échec ; webhook Stripe en échec ;
- rebonds et plaintes d'e-mails ;
- rapports de violation de CSP en hausse ;
- certificat d'un domaine client proche de l'expiration ou en échec ;
- espace disque de la VM.

Tableau interne (SQL sur `appels_ia`, `travaux`, `evenements`, `credit_mouvements`) : coût IA par plan et par offre, durée par étape, marge par offre, taux inscription → premier plan → achat.

### 9.5 Tests

| Test | Contenu | Quand | Bloquant |
|---|---|---|---|
| Unitaires | fonctions pures du cœur, `Budget`, catalogue de messages, résolution de la configuration, grand livre | chaque PR | oui |
| Chaîne sans IA, témoin | dépôt → analyse → lecture rejouée → murs → contrôle → images d'aperçu dans l'ordre (SwiftShader) → publication de l'aperçu et de la visite → ouverture par un jeton | chaque PR, en CI | oui |
| Aperçu verrouillé | page d'aperçu : aucune requête vers `engine.js`, `/vendor/three` ni `plan.json`, qui répondent 404 ; images ni noires ni uniformes ; galerie de 0, 1, 2 photos sans vignette vide | chaque PR ; **chaque publication d'aperçu** | oui : bloque la publication |
| Rejeu des références privées | 4 plans réels rejoués sans IA : `plan.json` identiques ou écarts approuvés ; `evaluer.py` au moins égal à la référence (D201 : 7 ouvertures sur 7 et 6 équipements sur 6 ; 432 : 6 sur 7 et 6 sur 7, relevés dans `HISTORIQUE.md`) ; visite de contrôle réussie | chaque PR `[P]` ou `[M]` ; chaque nuit en préproduction | oui |
| Non-régression visuelle | 3 vues fixes et le plan 2D de chaque plan de référence, comparés aux images approuvées (celles du témoin sont versionnées dans `references/temoin/images-approuvees/`, L1-11) : écart moyen au plus 2/255, au plus 0,05 % des pixels au-delà de 16/255 (seuils tirés des mesures de `recherche/hebergement.md` § 2.1). Détecte aussi une texture noire ou un contexte WebGL absent | PR `[M]`, changement d'exécutant de rendu, mise à jour de Chrome ou de three.js | oui ; une nouvelle image de référence s'approuve explicitement |
| Aucun texte technique | M0.4 étendu : chaque mode de la visite, `plan.json` publié, messages d'état, e-mails, catalogue, textes saisis par les clients | chaque PR ; **chaque publication en production** | oui : bloque la publication |
| CSP et réseau | aucune violation de CSP, aucune requête hors de nos origines pendant la visite de contrôle | chaque publication | oui |
| Sécurité | § 6.8 | chaque PR | oui |
| Grand livre | invariants du § 4.3, idempotence des webhooks, réservations orphelines | chaque PR ; toutes les heures en production | oui ; alerte en production |
| Fumée de l'outil local | `serveur.py` avec `PLAN_MOCK` sur le témoin | chaque PR `[P]` ou `[M]` | oui |
| Lecture payante | relecture complète des plans de référence avec l'IA (clé `dev`) | seulement pour un changement de prompt, de modèle, d'effort ou de réglage IA pro, **après** le rejeu gratuit réussi, et sur accord explicite | décision humaine |
| Restauration | § 9.3 | mensuel | alerte |

Les jeux privés (plans réels de l'utilisateur) ne quittent jamais le poste de l'équipe ou le seau `references-privees/` de la préproduction. La CI publique n'utilise que le témoin fictif, créé par nous et versionné dans `references/temoin/`.

---

## 10. Hors périmètre et points ouverts

**Hors périmètre de ce document :**
- logements sur plusieurs niveaux, tant que le travail en cours n'est pas validé sur des plans réels ;
- galerie complète (une dizaine de photos, L13-02), jamais promise au lancement ; aperçu interactif (L13-03) ;
- visite de la résidence ; meublé et aménagement ; réalisme (lancer de rayons sur GPU) ; 4K ; TMA ;
- saisie manuelle pré-remplie (dernier recours, selon les consignes) ;
- application mobile.

**À vérifier avant de s'engager :**
- Procrastinate : priorité des tâches, verrous (`lock`, `queueing_lock`) et détection des travaux bloqués dans la version retenue. L'index unique et notre battement de cœur ne dépendent pas de ces fonctions.
- Conteneur de rendu SwiftShader : `/dev/shm`, bac à sable de Chrome (profil seccomp, `--no-sandbox` seulement en dernier recours et consigné), polices, charge sur la VM partagée (L5-10, L5-22).
- Accélérations après le lancement (L13-01) : pour Serverless Jobs, surcharge des variables à chaque exécution et `/dev/shm` ; pour un Mac mini M4, rendu Metal sans écran branché.
- Place de la source `testeur` dans l'ordre de consommation, et contenu de la variante « bêta » (plan complet ou aperçu) : L0-04.
- Délai affiché : aucun avant la mesure T0 en conteneur (L5-11).
- Edge Services : nombre de domaines par pipeline, portée des volumes inclus.
- TEM : envoi depuis le domaine d'un client.
- Besoins réels de CSP du moteur (workers, `blob:`, styles en ligne) : mesurés par la visite de contrôle.
- Effet de la ZDR sur la durée et la qualité de lecture (M0.8).
- Valeur IPTC du marquage des photos, et qualification de notre rôle au sens de l'AI Act (avocat).
- Réutilisation d'une lecture entre organisations pour le même plan : exclue sans avis juridique.
