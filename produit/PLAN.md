# Plan du projet SaaS

Version du 27/09/2026, après l'alignement des documents et des tickets sur les arbitrages R1 à R23. **Document d'entrée du projet** : on l'ouvre en premier pour savoir où l'on va, ce qui est décidé, ce qui reste à décider et par quel ticket reprendre. Il résume les documents de `produit/` et le dossier `tickets/`, sans les répéter : chaque section renvoie à sa source.

Conventions :
- **Nom.** « Sur Pièce » est un nom provisoire, non validé (plan B : « Avant-Clés »). Il est écrit sous cette seule forme pour qu'un rechercher-remplacer suffise.
- **Charges.** Estimations pour **une personne**, comptées S = 1 j, M = 2 j, L = 4 j (les fichiers de tickets disent S : jusqu'à 1 j, M : 1 à 3 j, L : 3 à 5 j). Elles sont **recalculées par script à partir des en-têtes des 150 fichiers de tickets** (colonnes Priorité, Taille, Dépend de) et ne sont pas mesurées.
- **Priorité.** P0 : requis pour le jalon du lot ; P1 : utile, peut glisser ; P2 : conditionnel ou plus tard.
- **Primauté.** Décisions de l'utilisateur (§ 2.1) > arbitrages du 27/09/2026 (§ 2.4) > `OFFRES.md` > `ARCHITECTURE.md` > `MESSAGES.md` > `PARCOURS.md` > `SUIVI.md`. Les documents de `produit/` restent des propositions à valider.

---

## 0. Par quoi reprendre

1. **L1-01, urgent** (S) : fermer la fuite du `.env`. Serveur statique limité à `127.0.0.1` avec liste blanche, Chrome lancé sans clé (`moteur/chrome.mjs`), test sans réseau. Petit diff à fusionner avec l'agent des duplex (`controle.mjs`, `photos.mjs`, `_dbg.mjs`), puis rotation de la clé OpenRouter (L0-08).
2. **L0-01** (S, plus délais) : acheter les domaines, faire la recherche d'antériorité et le dépôt INPI. Il débloque le logo (L2-02), l'avocat (L0-07), la mise en ligne de la vitrine (L2-16) et l'ouverture publique (L8-07).
3. **Séance de décisions avec l'utilisateur** : L0-04 (prix ; crédit `testeur` de la variante « bêta » : plan complet ou aperçu), L0-05 (13 questions, dont la confirmation de R18), L0-02 (authentification), L0-03 (hébergeur ; le rendu est déjà tranché par R3). L0-03 ouvre le chemin critique de la bêta fermée (§ 6.4).
4. **Démarches longues, en parallèle** : L0-06 (société, banque, RC pro), L0-07 (rendez-vous avocat, dossier unique J0 et J1), puis L0-08 (comptes, clés `prod-payant`, `prod-gratuit` et `dev` plafonnées) et L0-09 (RGPD).
5. **L1-02 et L1-07** : rejouer sans payer, figer les dépendances. L1-02 débloque 12 tickets et porte le critère de fusion des tickets `[P]` et `[M]` (§ 10).
6. **L1-03 puis L1-12** : le témoin fictif, versionné dans `references/temoin/` (R11) ; une seule lecture payante de 1 à 2 $, sur accord. C'est la tête du chemin critique de la vitrine.
7. **Deux nouveaux dossiers, sans conflit avec les duplex** : L2-01 (`site/` et `outils/site.py`, R19), puis le lot 2 ; dès L0-03, L5-01 (`service/`), puis L5-02, L5-15, L5-07, L5-08 et L5-14.
8. **Après la fusion des duplex seulement** : L4-01, L4-08 puis L4-04, qui débloquent L5-06 et L6-02 (§ 6.6).

---

## 1. En bref

- **Le produit.** Un acquéreur de logement neuf (VEFA) dépose le plan de vente du promoteur et obtient un plan 2D coté, une maquette 3D, une visite à la première personne et des photos, générés automatiquement d'après les cotes du plan.
- **La promesse.** « Achetez sur plan, jugez sur pièce. » Fidélité aux cotes, automatique, prix au plan. Pas de photoréalisme au lancement (`MARQUE.md` § 0, `recherche/marche.md` § 0).
- **Les 4 cibles** (`OFFRES.md` § 0.1) :
  1. **particuliers** acquéreurs sur plan : acquisition, preuve, référencement ;
  2. **conseillers** (CGP, CIF, agents, mandataires, commercialisateurs) : abonnement « Sur Pièce Pro », le revenu récurrent ;
  3. **promoteurs** : programme entier au lot, « Sur Pièce Programme » ;
  4. **partenaires et marque blanche** : codes à offrir, puis instance à la marque du client.
- **Où on en est.**
  - Un **outil local mono-utilisateur** (`pipeline/serveur.py`, port 8780) qui fonctionne de bout en bout : analyse sans IA, lecture par Claude (claude-opus-5 via OpenRouter), murs, visite de contrôle, photos.
  - **Qualité mesurée** contre les relevés manuels (`HISTORIQUE.md`) : D201 à 7 ouvertures sur 7 et 6 équipements sur 6 ; 432 à 6 sur 7 et 6 sur 7 ; contrôle réussi du premier coup. Peu de plans testés : aucun taux d'échec de production n'existe.
  - **1,10 à 1,85 $ et 8 à 15 min par plan**, mesurés sur Mac avec GPU (Metal).
  - **Pas exposable en l'état** (`recherche/audit-code.md`) : fuite possible du `.env` par les scripts Chrome, aucune isolation entre comptes, plan du promoteur servi avec la visite, coûts sans plafond, textes techniques visibles.
  - Un autre agent ajoute les **plans sur plusieurs niveaux (duplex)** dans `pipeline/` et `moteur/` ; ce travail n'est pas fusionné.
  - Rien de commercial n'existe : ni domaine acheté, ni marque déposée, ni donnée d'usage.
  - **Documents et tickets alignés** le 27/09/2026 sur les décisions (§ 2.1) et les arbitrages R1 à R24 (§ 2.4) : 150 tickets, tous « À faire », environ 320 j (§ 6.1).

---

## 2. Décisions

### 2.1 Décisions prises le 27/09/2026

| # | Décision de l'utilisateur | Conséquence | Tickets |
|---|---|---|---|
| 1 | On ne code pas les pages maintenant : un plan et un dossier de tickets, puis on avance lot par lot | Ce document et `tickets/` | tous |
| 2 | Application dockerisée (Docker Compose) pour se déployer partout ; stockage S3 | Aucune dépendance propre à un fournisseur hors interface (S3, SMTP, Postgres, OIDC) ; déploiement vérifié sur une VM d'un autre fournisseur | L0-03, L3-01, L5-01, L5-02, L5-18, L5-26 |
| 3 | Blocages côté logiciel : on sait qui consomme quoi (coût par compte), plafonds qui bloquent facilement ; second verrou : plafonds des clés OpenRouter | Réservation avant dépense, plafonds par plan, compte, jour (offert) et global ; clés séparées payant, gratuit, dev (R6, R23) | L4-02, L5-09, L0-08, L8-09 |
| 4 | Rendu qui fonctionne partout : le conteneur sans GPU (SwiftShader) est la base, pas une option dégradée ; la rapidité viendra après la mise en ligne | Question D3 d'`ARCHITECTURE.md` tranchée ; Metal, GPU ou Mac mini deviennent de l'accélération | L1-09, L5-10, L13-01 |
| 5 | Pas de galerie complète au lancement. Le serveur rend la visite de contrôle puis, dans l'ordre : vue du dessus 3D découpée (affichée en direct sur l'écran d'attente dès qu'elle existe), plan 2D coté, 2 photos. La visite 3D se calcule dans le navigateur du client. Au pire, la visite sans les photos au début | Le contenu payant ne cite plus « environ 11 photos » ; compatibilité des navigateurs à tester | L4-09, L4-10, L5-11, L6-03, L8-02, L13-02 |
| 6 | Offre gratuite : images prises par le serveur (Chromium), le reste verrouillé ; ni le moteur ni `plan.json` envoyés au navigateur. L'aperçu interactif (points par pièce, vue du dessus manipulable) est une idée à tester plus tard | Contrôle automatique qui bloque une page d'aperçu chargeant le moteur ou `plan.json` | L6-05, L13-03 |
| 7 | Les offres évolueront : catalogue modifiable sans déploiement, droits acquis honorés | Catalogue en base ; chaque achat garde un instantané de l'offre (R5) | L0-04, L5-08, L5-25 |
| 8 | Authentification non tranchée : préférence pour Auth0 ; la recherche recommande une auth maison (lien magique et Google) derrière une couche interchangeable, Supabase Auth Paris en alternative | Couche d'identité interchangeable quel que soit le choix (§ 2.3) | L0-02, L5-03, L5-24 |
| 9 | Umami envisagé pour tout mesurer : avis rendu, oui, auto-hébergé dans l'UE. Mesure, Meta CAPI, Google et paiement viendront plus tard | Marquage prêt à brancher au lot 2, mesure au lot 7, paiement au lot 8, publicité au lot 12 | L2-14, lot 7, lot 8, lot 12 |
| 10 | Nom provisoire « Sur Pièce » (plan B « Avant-Clés »), non validé | Rien n'est publié avant les domaines et le dépôt INPI | L0-01, L2-02 |

### 2.2 Décisions à prendre

| Décision | Options | Recommandation des documents | Ticket | Avant |
|---|---|---|---|---|
| Nom | Sur Pièce ; Avant-Clés | Sur Pièce ; acheter les domaines, recherche d'antériorité manuelle, dépôt INPI avant toute annonce | L0-01 | lot 2 (L2-02, L2-16) |
| Authentification (D1) | auth maison ; Auth0 ; Supabase Auth Paris | auth maison derrière une couche interchangeable (§ 2.3) | L0-02 | lot 5 (L5-03) |
| Hébergeur (D2) | Scaleway Paris ; Clever Cloud et rendu ailleurs ; Hetzner ; OVHcloud | Scaleway Paris, un seul fournisseur français | L0-03 | L5-01 (chemin critique) ; L3-05 |
| Place du rendu dans le Compose (le rendu lui-même est tranché par R3) | même VM limitée à 1 travail ; VM plus grosse ; VM séparée | même VM, seuil de bascule écrit, mesure au T0 ; accélérations seulement après le lancement (L13-01) | L0-03, L5-22 | lot 5 |
| E-mails (D4) | Scaleway TEM ; Brevo | TEM | L0-03 | L5-14 |
| Supervision (D5) | Sentry UE, Better Stack, Cockpit ; UptimeRobot | Sentry région UE (choisie à la création, définitive) | L0-03 | L0-08 |
| Hébergement de la vitrine (D6) | Scaleway Edge Services ; Cloudflare Pages | Scaleway (tout en UE) ; Cloudflare gratuit en alternative | L0-03 | L2-16 |
| Fournisseur IA (D7) | OpenRouter avec ZDR ; routage UE (offre Business) ; Anthropic en direct | OpenRouter avec ZDR au lancement ; à rouvrir avant le premier promoteur | L0-03 | lot 3 ; lot 10 |
| Prix des offres | tableau du § 3.1 | valider comme hypothèses ; le contenu est tranché (R1) | L0-04 | L2-08, L5-08 |
| Crédit `testeur` de la variante « bêta » (R13) ; unité affichée | plan complet ou aperçu ; « plan » ou « crédit » | testeurs à trancher ; « plan » (`OFFRES.md` § 1) | L0-04 | lot 2 ; L3-06, L6-10 |
| 13 questions ouvertes (vouvoiement, favicon, « duplex » dans la FAQ, carte « rendez-vous bancaire », « Où en êtes-vous ? », remboursement en un clic, Umami dans l'application…) | liste de L0-05 | celles des documents ; bandeau tranché par R18, à confirmer | L0-05 | lots 2, 6, 7 |
| Code d'invitation de la bêta (R13) | personnel ou par vague ; saisi ou prérempli dans le lien | à trancher (`MESSAGES.md` § 12.2, `PARCOURS.md` § 8.3) | L6-01, L6-10 | L6-10 |
| Aperçu impossible : vue du dessus ou plan 2D en échec (R2) | message, e-mail et suite | relance sans IA, puis échec sans rien décompter (`PARCOURS.md` A15) | L5-11 | L6-10 |
| Découpe de la vue du dessus ; réglages de soleil en mode simple | coupe à 1,20 m ou retrait des plafonds ; soleil masqué ou non | à choisir sur les captures des références | L4-09, L4-11 | L6-10 |
| Faire la bêta express | oui (VM, Cloudflare Access, en partie jetable) ; non | utile si le socle tarde | lot 3 | L3-01 |
| Outil de liste d'attente | formulaire maison ; outil UE type Brevo | à trancher | L2-12 | L2-16 |
| Tableaux de bord métier | Metabase auto-hébergé ; page d'administration | à trancher (mémoire de Metabase à mesurer) | L7-06 | lot 7 |
| Structure, TVA, facturation électronique | avec l'expert-comptable | réception par plateforme agréée déjà due (01/09/2026) | L0-06 | lot 8 (L8-01) |
| Suivi des liens prospects | par lot ; par lien | selon l'avis de l'avocat | L9-04 | lot 9 |

### 2.3 Authentification : Auth0 face à la recommandation

| | Auth maison (recommandée) | Auth0 (préférence initiale) | Supabase Auth, Paris |
|---|---|---|---|
| Lien magique | oui, lié à l'e-mail, fiable sur iPhone depuis Gmail | pas dans l'écran hébergé (code à 6 chiffres à la place) ; en Classic Login, lien à ouvrir dans le même navigateur | oui |
| Google | oui (OIDC) | oui | oui |
| Organisations B2B | dans notre base | 5 en gratuit ; B2B 300 $/mois à 1 000 MAU, 2 100 $ à 10 000 | dans notre base |
| Domaines de marque blanche | illimités | plusieurs domaines : offre Enterprise seulement | 1 par projet |
| Coût | environ 0 € | gratuit jusqu'à 25 000 MAU en B2C | 25 $/mois jusqu'à 100 000 MAU |
| Sécurité | à notre charge (tests automatiques) | chez le fournisseur | chez le fournisseur |
| Éditeur, données | nous, UE | éditeur américain, région UE possible | éditeur américain, Paris |
| Charge (estimation) | 4 à 6 j avec les tests | 2 à 3 j | à estimer |

Lecture honnête :
- **Pour Auth0** : moins de code d'authentification à écrire et à sécuriser, intégration plus courte, offre B2C gratuite généreuse, SDK officiels.
- **Contre Auth0** : ses limites touchent surtout les pros et la marque blanche (lots 9 à 11), et le lien magique sur mobile. Dans tous les cas, organisations, rôles, crédits et sessions restent dans notre base.
- **Réversibilité** : la couche `FournisseurIdentite` (`ARCHITECTURE.md` § 3 D1) rend le choix réversible ; changer de fournisseur revient à renvoyer un lien de connexion. La décision ne bloque ni la vitrine ni les lots 0 à 4.

### 2.4 Arbitrages du 27/09/2026

Ils découlent des décisions du § 2.1 et tranchent les contradictions relevées entre documents. Ils s'appliquent partout.

| # | Arbitrage | Tickets |
|---|---|---|
| R1 | **Aperçu gratuit** : vue du dessus 3D découpée, plan 2D coté, 2 photos (séjour, puis chambre principale ou, à défaut, pièce principale suivante), surfaces, points à faire confirmer ; ni moteur ni `plan.json`. **Visite débloquée** : moteur et `plan.json` dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage), plus les mêmes images. Galerie complète plus tard, jamais promise au lancement | L0-04, L4-09, L6-05, L8-02, L13-02 |
| R2 | Visite de contrôle réussie obligatoire. Aperçu publié dès que la vue du dessus et le plan 2D sont prêts, photos ajoutées ensuite ; une photo en échec est omise (alerte), sans bloquer. Plan offert consommé à la publication de l'aperçu ; le déblocage ne relance aucune lecture | L4-09, L5-11, L5-12, L8-02 |
| R3 | Rendu SwiftShader en conteneur, par défaut et partout ; Serverless Jobs, GPU ou Mac = accélérations facultatives après le lancement. D3 tranchée, M2.7a devient une mesure. Aucun composant propre à un hébergeur n'est obligatoire | L0-03, L1-09, L5-10, L13-01 |
| R4 | Verrou de l'offre gratuite côté serveur (rien de la visite n'est envoyé), pas dans l'interface | L5-12, L6-05 |
| R5 | Catalogue d'offres en base, modifiable sans déploiement ; valeurs d'offre des organisations lues dans le catalogue ; prix Stripe créés à neuf ; droits acquis honorés | L5-08, L5-25, L8-01, L9-01 |
| R6 | Plafond IA : 3 $ par plan, toutes passes et relances confondues | L4-02, L5-09 |
| R7 | `OFFRES.md` fait foi pour les règles commerciales et de crédits (ordre de consommation, report d'un mois des crédits pros, aperçu 6 mois, visite 24 mois, conservation) | L5-07, L5-20 |
| R8 | Tests de prix par périodes seulement ; tests de textes tirés côté serveur possibles pour les comptes connectés | L8-06, L12-05 |
| R9 | Adresses de la vitrine : celles de `MESSAGES.md` § 0.9 (`/appartement-temoin`, `/marque-blanche`…) | lot 2, L6-08 |
| R10 | Largeur minimale de mise en page : 320 px | L2-01, L2-15 |
| R11 | Témoin fictif créé par nous, versionné dans `references/temoin/` | L1-03, L1-12 |
| R12 | Aucun délai en dur : marqueur ‹délai› jusqu'à la mesure T0 en production | L5-11, L8-07 |
| R13 | Bêta fermée sans achat : dépôt sur code d'invitation, variante « bêta » du catalogue, aucun message à 29 € avant le lot 8 ; ouverture à tous en L8-07 | L6-01, L6-10, L8-07 |
| R14 | Un défaut de notre fait est toujours corrigé gratuitement ; les cycles de correction d'un promoteur ne couvrent que ses demandes de modification | L6-09, L10-01 |
| R15 | Les délais de support d'`OFFRES.md` § 1 font foi | L6-11 |
| R16 | Mode simple du moteur : « Rendu photoréaliste de la vue » et superposition du plan masqués, avant la bêta fermée | L4-11 (nouveau) |
| R17 | Un PDF de plusieurs lots est refusé par la qualification ; seul l'import promoteur le découpe | L6-02, L10-02 |
| R18 | Pas de bandeau tant qu'Umami reste en réglage minimal exempté ; bandeau au premier traceur non exempté (UTM enrichis, relecture, publicité). À confirmer en L0-05 | L7-02, L0-05 |
| R19 | Vitrine : fichiers sources et `outils/site.py` (Python sans dépendance) qui injecte nom, prix du catalogue et parties communes ; pas de framework | L2-01 |
| R20 | Vitrine indexable dès sa mise en ligne (nom déposé) ; application, aperçu et visite en `noindex` | L2-13, L2-16 |
| R21 | Pages pros : seulement ce qui existe ; avant les lots 9 à 11, entretien ou bêta fondateurs, pas d'essai en ligne | L2-05, L2-06, L2-18 |
| R22 | Anti-abus du plan offert : empreinte du fichier **et** empreinte de la page rendue | L5-23, L6-06 |
| R23 | Clé OpenRouter « gratuit » réservée au plan offert des particuliers ; essais pros sur la clé « payant », budget de leur organisation | L0-08, L5-09, L9-02 |
| R24 | Le crédit est réservé après la qualification et, s'il en fallait une, après la cote validée : un plan abandonné à la calibration ne bloque rien | L5-07, L6-04 |

**Hiérarchie des sources** quand deux documents divergent : décisions de l'utilisateur > arbitrages R1 à R24 > `OFFRES.md` (offres, crédits) > `ARCHITECTURE.md` (technique) > `MESSAGES.md` (textes) > `PARCOURS.md` > `SUIVI.md` (dictionnaire d'événements).

### 2.5 Écarts entre documents : état au 27/09/2026

**Tranchés et reportés dans les documents** : « environ 11 photos » et « 8 autres photos » (R1) ; « vue d'ensemble plongeante » (R1) ; publication bloquée par une image manquante (R2) ; D3 et l'essai M2.7a (R3) ; verrou d'interface de M3.2 (R4) ; codes d'offre figés du type `pro-5` (R5) ; « un quart d'heure » (R12) ; `/demo` et `/partenaires` (R9) ; bêta sur liste d'e-mails (R13) ; bandeau dès le lancement (R18, confirmation en L0-05) ; empreinte de la source seule (R22) ; clé des essais pros (R23) ; cycles de correction (R14) ; code à 6 chiffres absent de `MESSAGES.md` § 7.3 ; dépôt anonyme absent d'`ARCHITECTURE.md` (L5-23) ; e-mail d'échec « rien n'a été décompté » partout (`MESSAGES.md` fait foi) ; réservation après la cote validée (R24) ; qualification avant la calibration dans `ARCHITECTURE.md` § 2.3, comme dans le code (`serveur.py:245`).

**Encore ouverts entre documents** (à régler par leur responsable ou par L0-05) :

| Écart | Documents | Voie |
|---|---|---|
| « Où en êtes-vous ? » à l'inscription ou sur l'écran d'attente | `OFFRES.md` § 2.1, `MESSAGES.md` § 7.3 ; `PARCOURS.md` § 8.3 | L0-05, question 8 |
| Remboursement : bouton en un clic ou réponse à l'e-mail | `PARCOURS.md` A15 ; `MESSAGES.md` E6 | L0-05, question 10 |
| Mot « duplex » dans la FAQ de l'accueil | `MESSAGES.md` § 1.9 ; `MARQUE.md` § 3.4 | L0-05, question 3 |
| Compteur d'ouvertures des liens prospects par lien ou par lot | `MESSAGES.md` `pro.lien.compteur` ; `OFFRES.md` § 3.4 | avis de l'avocat (L0-07, L9-04) |
| « Toutes les cotes retrouvées » : page Méthode ou rendez-vous pro seulement | `MESSAGES.md` ; `OFFRES.md` § 1 ; `MARQUE.md` § 3.3 | avis de l'avocat (L2-10) |
| Bouton de la vitrine en liste d'attente : « Demander une invitation » ou « Importer mon plan » ; `/tarifs` non publiée avant L8-07 | `MESSAGES.md` § 0.8, § 1.1 ; L2-04, L2-08 | propositions de `MESSAGES.md` § 12.2, à valider |
| **Plusieurs niveaux** : `CLAUDE.md` (mis à jour le 27/09/2026 par l'agent des duplex) déclare les duplex et triplex gérés par la chaîne, validés plan par plan ; les documents et L4-08 gardent `niveaux_max = 1` en service et « un seul niveau » dans le périmètre affiché | `CLAUDE.md` ; `OFFRES.md`, `MESSAGES.md`, L4-08, L13-08 | à la fusion des duplex : ouvrir `niveaux_max` aux types validés sur les plans fournis (L13-08, à avancer), puis mettre à jour les textes |
| Lignes déjà tranchées encore listées comme écarts | `MESSAGES.md` § 12.1 ; `PARCOURS.md` § 8.2 | nettoyage par leurs responsables |
| Charges jusqu'à la bêta fermée : 24 à 36 j contre 142 j | `ARCHITECTURE.md` § 8.3 ; § 6.1 ci-dessous | périmètres différents ; recaler après les 5 premiers tickets |

**Dépendances et priorités** : les inversions P0/P1, les prérequis manquants de L8-07, L6-10 et L10-08 ont été corrigés le 27/09/2026, et l'ancien index `.backlog.json` retiré ; `python3 outils/tickets.py --verifier` ne signale plus rien. Reste un choix assumé : L2-06, L2-08 et L2-09 (pages promoteurs, tarifs, témoin) ne conditionnent pas la mise en ligne de la vitrine, qui peut ouvrir avec l'accueil seul.

---

## 3. Offres et économie unitaire

**Tous les prix sont des hypothèses de lancement**, modifiables (décision 7) et testées par périodes successives (`OFFRES.md` § 9). Aucun n'est publié avant L0-04.

### 3.1 Offres en une page

| Cible | Offre | Prix (hypothèse) | Contenu au lancement |
|---|---|---|---|
| Particulier | Plan offert (aperçu) | 0 € | Images rendues par le serveur : vue du dessus 3D découpée, plan 2D coté, 2 photos ; surfaces, points à faire confirmer. Ni moteur ni `plan.json` (R1, R4). 1 par personne, conservé 6 mois |
| | Visite d'un plan | 29 € TTC | Visite calculée dans le navigateur (marche libre, arrêts par pièce), maquette et plan 2D interactifs, mêmes images que l'aperçu, fiche complète, téléchargements, partage, 24 mois en ligne. Aucun nombre de photos promis ; galerie complète plus tard (L13-02) |
| | Plan suivant | 15 € TTC | Autre lot ou plan modificatif, dans les 12 mois |
| | Comparer 3 lots | 59 € TTC | 3 plans complets |
| Conseillers (Pro) | Solo, Cabinet, Équipe | 49, 99, 199 € HT/mois | 5, 12, 30 plans/mois ; 1, 3, 10 utilisateurs ; annuel 490, 990, 1 990 € HT |
| | Essai | 0 € | 14 jours, 3 plans, sans carte, 1 par SIREN |
| Promoteurs (Programme) | Rapport de prise en charge | 0 € | Lots pris en charge ou non, sans lecture payée |
| | Pilote | 600 € HT | 1 programme de 40 lots au plus, 5 jours ouvrés |
| | Au lot | 25, 20 ou 15 € HT | Tous les lots, intégration au site, portail distributeurs |
| Partenaires | Codes à offrir | 15 € HT (par 10) ; 12 € HT dès 50 | 1 plan complet par code |
| Marque blanche | Instance | 1 500 € HT, puis 490 € HT/mois | 50 plans/mois inclus, puis 7 € HT |
| Bêta fermée (J0) | Variante « bêta » | 0 € | Sur code d'invitation, sans achat ; crédit `testeur` : plan complet ou aperçu (L0-04, R13) |

Règles qui tiennent l'ensemble (`OFFRES.md` § 0.2) : rien de payant avant une qualification à environ 0,02 $ ; un plan n'est décompté qu'à la publication (plan offert : à celle de l'aperçu, R2) ; verrou de l'aperçu côté serveur ; catalogue versionné, droits acquis honorés (R5) ; aucune offre à perte, même au plafond dur ; périmètre affiché avant paiement (un seul niveau, logement vide, illustration non contractuelle) ; options (meublé, lumière réelle, réalisme et 4K, TMA) vendues seulement quand leurs contrôles existent, sans date annoncée.

### 3.2 Économie unitaire (`OFFRES.md` § 8)

| Cas | Plan complet | Aperçu offert | Déblocage d'un aperçu |
|---|---|---|---|
| Prudent (20 % d'échecs supposés, 1 $ = 1 €) | 2,70 € | 2,56 € | 0,12 € |
| Bas (sans échec) | environ 1,20 € | environ 1,10 € | 0,12 € |
| Plafond dur (3 $ par plan, toutes passes et relances, 20 % d'échecs) | 4,16 € | 4,06 € | 0,12 € |

- **Marges au coût prudent, carte premium** : 29 € lancé directement : 20,41 € (84 % du HT) ; déblocage d'un aperçu : 22,99 € (95 %) ; plan suivant : 9,13 € (73 %) ; Solo, Cabinet, Équipe à quota plein : 68 %, 63 %, 55 % ; lot promoteur à 25, 20, 15 € avec 5 min de relecture : 72 %, 65 %, 54 % ; instance de marque blanche : environ 65 %.
- **Au plafond dur**, la pire marge reste positive (Équipe : 33 %).
- **Plan offert** : seuil de perte de 11,1 % de conversion à 29 € (cas prudent). Budget du plan offert (clé « gratuit », réservée aux particuliers, R23) : 10 $/jour au minimum, puis 30 % de la marge des particuliers des 7 derniers jours, plafond absolu 50 $/jour tant que 150 aperçus n'ont pas été mesurés ; coupe-circuit sous le seuil de perte (L8-09).
- **Rendu** : visite de contrôle et 4 images en SwiftShader sur notre VM (R3) ; coût marginal compris dans les coûts fixes, avec des provisions par prudence (0,05 € par aperçu, 0,15 € par plan complet, `OFFRES.md` § 8.1). La contrainte devient la capacité de calcul (L5-22).
- **Ordres de grandeur, pas des prévisions** (`OFFRES.md` § 8.12) : particuliers environ 72 k€/an, conseillers environ 360 k€/an à 300 abonnés Cabinet, promoteurs environ 190 k€/an.

---

## 4. Architecture en bref

Détail : `ARCHITECTURE.md` (§ 2 services et schéma, § 4 données, § 5 stockage, § 6 sécurité, § 9 exploitation).

```
 visiteur ──► VITRINE statique (<domaine>) : pages, témoin, liste d'attente, dépôt
                     │
                     ▼
 client ──► Caddy (TLS) ──► WEB/API FastAPI sans état (app.<domaine>)
                            comptes, dépôt par URL signée, crédits, catalogue d'offres,
                            partages, pages de visite (visite.<domaine>), administration
                                   │                         │
                                   ▼                         ▼
                   POSTGRES : données, file (Procrastinate),   E-MAILS : connexion, « prêt »,
                   grand livre, journal, appels_ia              échec et plan rendu
                                   │ travaux
                 ┌─────────────────┴──────────────────┐
                 ▼                                    ▼
   WORKER LECTURE (Python, chaîne actuelle)     WORKER RENDU (conteneur, SwiftShader,
   analyse, qualification, lecture IA,          sans secret) : vue du dessus 3D,
   murs, visite de contrôle, marquage           plan 2D coté, 2 photos
        │           │                                 │ URL signées, rappel à usage unique
        ▼           └──► S3 PRIVÉ (source, reponse-ia.json, intermédiaires) ◄──┘
   OpenRouter (ZDR,               │ publication en liste blanche
   clés plafonnées)               ▼
                            S3 PUBLIÉ ──► CDN (cdn.<domaine>) : moteur/vN, photos marquées
                                                      │
                                                      ▼
                            navigateur du client : la visite 3D y est calculée
 À côté : Umami auto-hébergé (UE), supervision (Sentry UE, battements de cœur).
```

Invariants : l'outil local (`python3 pipeline/serveur.py`, `outils/finalise.sh`) marche à chaque ticket ; aucun fichier du promoteur ni aucune réponse IA n'est publié ; aucun texte technique n'atteint l'écran ; chaque dollar d'IA est réservé avant d'être dépensé ; tout défaut devient un contrôle ; plusieurs niveaux refusés en service (`niveaux_max = 1`) tant que les duplex ne sont pas validés plan par plan ; PDF de plusieurs lots refusé par la qualification, seul l'import promoteur le découpe (R17) ; aucun composant propre à un hébergeur n'est obligatoire (R3) ; la vitrine est assemblée par `outils/site.py`, sans framework (R19).

---

## 5. Mesure en bref

Détail : `SUIVI.md` (plan de marquage) et `recherche/suivi.md` (faits).

**Avis sur Umami : oui, auto-hébergé dans l'UE**, pour l'audience anonyme de la vitrine, de la démonstration et des écrans de l'application. Quatre limites :
1. **Pas Umami Cloud** : son DPA autorise l'« improve the Services », ses sous-traitants sont surtout américains, le choix de la région n'est pas documenté.
2. **Pas « sans bandeau » par nature** : « sans cookie » ne suffit pas (l'article 82 vise aussi l'empreinte du terminal). L'exemption CNIL tient au réglage minimal (chemins en gabarits, ni UTM, ni identification, ni relecture) et à une analyse écrite de deux écarts : l'écran Sessions, l'absence d'arrondi (L7-08).
3. **Ne remplace pas le journal serveur** : comptes, plans, argent et coûts vivent dans la table `evenements`, écrite dans la même transaction que le fait (L5-15). Umami ne donne que des minorants.
4. **Ne remplace pas les envois vers Meta et Google** : il n'a aucune intégration publicitaire. Les conversions partent du serveur, après consentement.

Jamais d'Umami sur les liens de visite partagés, les liens prospects ni les intégrations chez les promoteurs.

| Quand | Quoi | Tickets |
|---|---|---|
| Lot 2 | Attributs `data-umami-event` inertes, sans données personnelles | L2-14 |
| Lot 5 | Journal d'événements serveur, source de vérité | L5-15 |
| Lot 7 | Umami minimal ; bandeau tarteaucitron prêt, affiché seulement au premier traceur non exempté (R18) ; attribution après consentement, événements, entonnoirs, tableaux de bord, recette automatique, analyse d'exemption | L7-01 à L7-08 |
| Lot 8 | Événements Stripe (achat, remboursement, litige, rétractation) | L8-01, L8-03 |
| Lot 12 | Consentement publicitaire, Meta Conversions API, Google Data Manager API (l'import hors ligne par l'API Google Ads est fermé aux nouveaux projets depuis le 15/06/2026), campagnes (catégorie « Housing » chez Meta), tests A/B | L12-01 à L12-05 |

---

## 6. Feuille de route

### 6.1 Les 14 lots

Le **« premier lot » dont parlait l'utilisateur, les pages vitrine, est le lot 2**. Il s'appuie sur quelques tickets des lots 0 et 1 : le nom (L0-01), l'appartement témoin fictif (L1-03, L1-12), l'avocat et le RGPD pour les pages légales (L0-07, L0-09), les prix pour la page tarifs (L0-04).

Charges recalculées le 27/09/2026 par script sur les en-têtes des 150 tickets (S = 1 j, M = 2 j, L = 4 j).

| Lot | Titre | But | Tickets (dont P0) | Charge (dont P0) | Jalon |
|---|---|---|---|---|---|
| 0 | Décisions et préalables | Trancher et lancer les démarches longues | 9 (8) | 12 j (11 j) + délais | — |
| 1 | Filets de sécurité | Corriger l'outil local, rejouer sans payer, témoin | 12 (11) | 20 j (19 j) | — |
| 2 | Vitrine | Site public, liste d'attente, marquage prêt | 18 (14) | 38 j (30 j) | Vitrine en ligne |
| 3 | Bêta express (facultative) | Faire tester l'outil actuel pendant la construction | 6 (0) | 12 j (—) | Bêta express |
| 4 | Cœur réutilisable | Chaîne utilisable en multi-comptes, sans changer l'outil local | 11 (10) | 21 j (20 j) | — |
| 5 | Socle en ligne | Service Docker Compose complet | 26 (24) | 66 j (62 j) | — |
| 6 | Parcours particulier | Du dépôt à l'aperçu puis à la visite | 12 (9) | 24 j (19 j) | Bêta fermée (J0) |
| 7 | Mesure | Umami, consentement, entonnoirs | 8 (5) | 14 j (10 j) | — |
| 8 | Paiement des particuliers | Vendre la visite, parcours légal | 9 (8) | 20 j (19 j) | Vente aux particuliers (J1) |
| 9 | Conseillers (Pro) | Abonnements, essai, liens prospects | 13 (7) | 30 j (18 j) | Conseillers (J2), codes (J4) |
| 10 | Promoteurs (Programme) | Import, validation, intégration, pilote, facturation | 9 (6) | 21 j (16 j) | Promoteurs (J3) |
| 11 | Marque blanche | Domaines et thème des clients | 4 (2) | 9 j (6 j) | Marque blanche (J5) |
| 12 | Publicité | Conversions serveur, campagnes, A/B | 5 (3) | 10 j (6 j) | Premières campagnes |
| 13 | Après lancement | Vitesse, galerie, options, résidence, niveaux | 8 (0) | 23 j (—) (R&D, sans doute sous-estimé) | Options |

**Total : 150 tickets, environ 320 j** (107 P0 pour 236 j ; 28 P1 ; 15 P2 ; 26 S, 101 M, 23 L). Depuis la version précédente (144 tickets, 309 j) : L4-11 ajouté, L5-03, L5-17, L5-18 et L9-01 découpés (L5-24, L5-25, L5-26, L9-13), L10-09 ajouté, dépendances et priorités revues.

**Cumuls jusqu'aux jalons** : tickets nécessaires par les dépendances (fermeture du graphe), et chaîne la plus longue du § 6.4.

| Jalon | Ticket d'ouverture | Tickets | Charge | Chaîne la plus longue |
|---|---|---|---|---|
| Vitrine en ligne | L2-16 | 19 | 36 j | 13 j |
| Bêta express (facultative) | L3-06 | 24 | 42 j | 16 j |
| Bêta fermée (J0) | L6-10 | 65 (68 avec la vitrine en ligne) | 142 j (147 j) | 32 j |
| Vente aux particuliers (J1) | L8-07 | 78 | 169 j | 33 j |
| Conseillers (J2) | J1 et les P0 du lot 9 (L9-01, L9-02, L9-04, L9-06, L9-08, L9-10, L9-11) | 91 | 198 j | 33 j |
| Promoteurs (J3) | L10-08 | 50 | 117 j | 29 j |
| Codes (J4) | L9-09 | 27 | 58 j | 21 j |
| Marque blanche (J5) | L11-01 | 54 | 127 j | 33 j |

- Les cumuls de J3, J4 et J5 ne comprennent ni J0 ni J1, dont ils ne dépendent pas formellement : ce sont des minimums.
- **Vue par lots** (tous les tickets des lots, hors lots 3 et 13) : lots 0 à 2 : 70 j ; jusqu'au lot 6 : 181 j ; jusqu'au lot 8 : 215 j ; jusqu'au lot 12 : 285 j.
- Ces cumuls dépassent nettement `ARCHITECTURE.md` § 8.3 (24 à 36 j jusqu'à la bêta fermée, contre 142 j ici) et `audit-code.md` (25 à 40 j hors paiement et mesure) : les tickets comptent aussi la vitrine, les décisions, l'exploitation, le support, les tests, et arrondissent M à 2 j. **À recaler après les cinq premiers tickets**, en comparant le réalisé à l'estimé.

### 6.2 Tickets clés par lot

- **Lot 0.** L0-01 nom (domaines, antériorité, INPI classes 9, 35, 42) ; L0-02 auth ; L0-03 hébergement ; L0-04 offres ; L0-05 questions ouvertes ; L0-06 société, banque, comptable, assurance ; L0-07 rendez-vous avocat (dossier unique de questions) ; L0-08 comptes fournisseurs et clés plafonnées, recharge automatique coupée ; L0-09 registre RGPD, DPA des fournisseurs, procédures.
- **Lot 1.** L1-01 **urgent** : fuite du `.env` par les serveurs statiques de `photos.mjs` et `controle.mjs` ; L1-02 jeu de référence rejouable sans payer (critère de fusion commun) ; L1-03 et L1-12 plan de vente du témoin fictif, relevé et lecture gardée ; L1-04 et L1-05 contrôle et retrait des textes techniques ; L1-06 identifiant de plan sans nom de fichier ; L1-07 dépendances figées ; L1-08 ZDR ; L1-09 rendu Chrome portable (SwiftShader, Metal, Vulkan) ; L1-10 cartouche masqué avant l'envoi au modèle ; L1-11 CI de non-régression sur le témoin.
- **Lot 2.** L2-01 fondations (`site/` statique, `outils/site.py` sans dépendance, jetons de la DA, 320 px) ; L2-02 logo ; L2-03 visuels du témoin ; L2-04 accueil (liste d'attente jusqu'à L8-07, puis dépôt réel pour tous ; en bêta, les invités déposent par leur lien) ; L2-05 à L2-08 pages conseillers, promoteurs, marque blanche, tarifs (entretien ou bêta fondateurs, pas d'essai en ligne avant le lot 9, R21 ; `/tarifs` non publiée avant L8-07) ; L2-09 page du témoin ; L2-11 pages légales ; L2-12 liste d'attente ; L2-14 marquage ; L2-15 contrôles du site ; L2-16 mise en ligne ; L2-18 entretiens avec 15 à 20 conseillers et des promoteurs.
- **Lot 3.** L3-01 image Docker de l'outil actuel ; L3-02 Cloudflare Access (gratuit jusqu'à 50 testeurs) ; L3-03 cloisonnement par testeur ; L3-04 budgets par testeur ; L3-05 déploiement sur VM ; L3-06 programme de testeurs (1 crédit chacun).
- **Lot 4.** L4-01 configuration en paramètre et L4-04 étapes extraites (**après la fusion des duplex**) ; L4-02 journal des appels et budget par plan ; L4-05 catalogue de messages ; L4-06 moteur et bibliothèques servis par nous, versionnés ; L4-07 mention non contractuelle incrustée ; L4-08 plusieurs niveaux refusés en service ; L4-09 aperçu rendu par le serveur ; L4-10 visite dans le navigateur du client et repli sur les images ; **L4-11 mode simple du moteur** (réglage « Rendu photoréaliste de la vue » et superposition masqués, R16).
- **Lot 5.** L5-01 squelette (FastAPI, Postgres, Compose, CI) ; L5-02 S3 privé et publié ; L5-03 auth (lien magique, code à 6 chiffres, sessions, couche d'identité) ; L5-24 connexion Google ; L5-04 organisations ; L5-05 plans et contrôle d'accès ; L5-06 file et worker de lecture ; L5-07 grand livre ; L5-08 catalogue d'offres ; L5-09 budgets IA à quatre niveaux ; L5-10 worker de rendu SwiftShader ; L5-11 livraison en deux temps ; L5-12 publication ; L5-13 partages ; L5-17 et L5-25 administration (comptes, plans, coûts, rejeu, défauts ; puis catalogue, crédits, gestes commerciaux, journal de l'équipe) ; L5-18 préproduction, déploiement, secrets ; L5-26 sauvegardes et restauration testée ; L5-19 sécurité ; L5-20 conservation et purge ; L5-21 exploitation ; L5-22 capacité ; L5-23 dépôt anonyme de 24 h.
- **Lot 6.** L6-01 dépôt puis compte (code d'invitation en bêta, R13) ; L6-02 qualification avant toute lecture payante (refus des PDF de plusieurs lots, R17) ; L6-03 écran « chantier » avec la vue du dessus en direct ; L6-04 calibration au clic ; L6-05 aperçu gratuit ; L6-06 plan offert et anti-abus (deux empreintes, R22) ; L6-09 signaler un défaut ; L6-11 support ; L6-10 ouverture de la bêta fermée.
- **Lot 7.** L7-01 Umami ; L7-02 bandeau de consentement (R18) ; L7-03 attribution ; L7-04 événements ; L7-05 entonnoirs ; L7-06 tableaux de bord ; L7-07 recette ; L7-08 analyse d'exemption.
- **Lot 8.** L8-01 Stripe ; L8-02 déblocage immédiat ; L8-03 parcours légal (« Renoncer au contrat ici », obligatoire depuis le 19/06/2026) ; L8-04 CGV et médiateur ; L8-05 factures ; L8-08 téléchargements ; L8-09 budget du plan offert indexé sur la marge ; L8-07 ouverture publique (fin de la variante « bêta », R13).
- **Lot 9.** L9-01 abonnements (formules, quotas, report, portail, SIREN et TVA, résiliation) ; L9-13 recharges, places, annuel, remise fondateurs ; L9-02 essai ; L9-04 liens prospects sans traceur illicite ; L9-08 accord du promoteur, CGV pro, DPA ; L9-10 facturation électronique (émission au plus tard le 01/09/2027) ; L9-11 premiers conseillers ; L9-12 premier partenaire codes.
- **Lot 10.** L10-01 contrat promoteur ; L10-02 programmes et import ; L10-03 validation des lots ; L10-04 intégration au site du promoteur ; L10-08 premier pilote ; **L10-09 facturation des promoteurs et réversibilité** (devis, bons de commande, factures électroniques, export promis au contrat, suivi commercial).
- **Lot 11.** L11-01 domaines des clients (seulement au jalon J5) ; L11-02 thème ; L11-03 clés IA par client ; L11-04 contrat d'instance.
- **Lot 12.** L12-03 consentement publicitaire ; L12-01 Meta ; L12-02 Google ; L12-04 campagnes ; L12-05 A/B.
- **Lot 13.** L13-01 accélérer le rendu ; L13-02 galerie complète ; L13-03 aperçu interactif (à tester) ; L13-04 à L13-06 options meublé, réalisme et 4K, TMA ; L13-07 résidence ; L13-08 plusieurs niveaux en service.

### 6.3 Jalons

| Jalon | Ticket | Condition d'ouverture |
|---|---|---|
| Vitrine en ligne | L2-16 | Accueil, pages légales, liste d'attente, contrôles du site, nom sécurisé. Pas de dépôt réel |
| Bêta express (facultative) | L3-05, L3-06 | Outil actuel derrière Cloudflare Access, budgets par testeur, CGU et confidentialité, ZDR, cartouche masqué, textes techniques retirés |
| Bêta fermée (J0) | L6-10 | Socle, parcours particulier, sécurité, supervision, sauvegardes restaurées (L5-26), support, signalement des défauts, mode simple du moteur (L4-11), prérequis juridiques ; dépôt sur code d'invitation, variante « bêta », aucun achat (R13) ; 1 crédit par testeur |
| Vente aux particuliers (J1) | L8-07 | CGV, médiateur, RC pro, marque déposée ; T0 à T2 concluants : coût moyen sous 2 $ par plan, moins de 20 % d'échecs ; délai affiché = mesure T0 (R12) ; versions payantes du catalogue publiées, prix Stripe neufs |
| Conseillers (J2) | L9-01, L9-11 | Contrat pro et DPA, liens prospects, abonnements, facturation électronique ; bêta fondateurs d'abord, pas d'essai en ligne avant (R21) |
| Promoteurs (J3) | L10-08 | Contrat et engagements de service, import (seul à découper un PDF de plusieurs lots, R17), intégration limitée aux domaines déclarés, facturation (L10-09) |
| Codes (J4) | L9-12, puis L9-09 | Un premier partenaire signé avant de construire |
| Marque blanche (J5) | L11-01 | 3 conseillers payants, 1 pilote réussi, 1 lettre d'intention signée |

### 6.4 Chemin critique

Chaîne la plus longue en jours, calculée par script sur la colonne « Dépend de » des en-têtes :
- **Vitrine (13 j)** : L1-02 ou L1-03 → L1-12 → L2-03 → L2-04 → L2-15 → L2-16, plus les délais calendaires du nom (L0-01) et de l'avocat (L0-07 → L2-11, pages légales).
- **Bêta fermée (30 j)** : L0-03 → L5-01 → L5-14 → L5-03 → L5-05 → L5-06 → L5-09 → L6-06 → L6-01 → L6-03 → L6-10.
  - Presque critiques, à 2 j près : L6-05, L6-09 et L6-11 (par L5-17), et la livraison L5-06 → L5-10 → L5-11.
  - L5-03 attend la décision d'authentification (L0-02) : elle doit être prise avant la fin de L5-14 et L5-15.
  - L5-06 attend aussi L4-04 (L1-02 → L4-01 → L4-08 → L4-04, environ 6 j de marge) : **si la fusion des duplex tarde, elle fixe la date de la bêta fermée**.
- **Vente aux particuliers (32 j)** : même chaîne jusqu'à L5-06, puis L5-10 → L5-11 → L6-05 → L8-02 → L8-08 → L8-07 (L6-10 n'a que 1 j de marge), plus les délais juridiques et administratifs : CGV et médiateur (L0-07 → L8-04), RC pro et société (L0-06), marque déposée (L0-01).
- **Promoteurs (29 j)** : L0-03 → … → L5-06 → L5-09 → L10-02 → L10-03 → L10-08, plus le contrat (L0-07 → L10-01). **Marque blanche (33 j)** : la même chaîne, puis L11-01, et ses conditions commerciales (3 conseillers payants, 1 pilote réussi, 1 lettre d'intention).

Seul, la durée approche le cumul du § 6.1 ; le chemin critique ne devient la limite que si plusieurs personnes ou agents travaillent en parallèle.

### 6.5 Ce qui peut avancer en parallèle

- **Tout de suite, sans code** : L0-01 (domaines, INPI), L0-06 (société), L0-07 (prendre rendez-vous), qui ont des délais propres.
- **Vitrine** (lot 2) : nouveau dossier `site/`, aucun conflit avec les duplex. L2-01 n'a aucune dépendance.
- **Socle** (lot 5) : nouveau dossier `service/`. L5-01, L5-02, L5-07, L5-08, L5-14, L5-15, L5-18, L5-26, puis L5-03 (après L0-02), L5-04 et L5-05 peuvent avancer avant la fusion.
- **Petits diffs isolés `[M]` ou `[P]`**, dès que L1-02 existe et en coordination avec l'agent des duplex : L4-11 (mode simple), L1-09 (rendu portable), puis L4-06 et L4-09.
- **Entretiens pros** (L2-18) et **premiers conseillers** (L9-11) dès que le témoin existe : ils valident la promesse avant de construire les lots 9 et 10.
- **Bêta express** (lot 3) pendant le socle, en sachant qu'une partie sera jetée.

### 6.6 Ce qui attend la fusion du travail sur les duplex

- **Après la fusion, jamais en parallèle** : L4-01 (configuration), L4-08 (refus des plans à plusieurs niveaux, prérequis de L4-04) et L4-04 (étapes), qui touchent `lire.py` et `serveur.py` partout. Ils bloquent L5-06 et L6-02, donc la bêta fermée : **si la fusion tarde au-delà de la marge du § 6.4, c'est elle qui fixe la date de la bêta fermée**.
- **Avec l'agent des duplex** : L4-08, puis L13-08 (ouverture plus tard).
- **Petits diffs isolés, coordonnés** : L1-01, L1-10, L1-12 (`evaluer.py`), et les 32 tickets marqués `[P]` ou `[M]` (21 `[P]`, 16 `[M]`, 5 les deux), qui suivent le critère de fusion du § 10.
- `pipeline/niveaux.py` n'est pas touché par la migration.

---

## 7. Budget

Hors TVA, hors salaires. Sources : `recherche/hebergement.md` § 5 et § 10, `OFFRES.md` § 8, `recherche/juridique.md` § 7, `recherche/nom.md` § 7.

### 7.1 Coûts fixes mensuels par palier (estimations de la recherche, Scaleway Paris)

| Poste | Lancement (~100 plans/mois) | ~1 000 plans/mois | ~10 000 plans/mois |
|---|---|---|---|
| Web, workers, contrôle (VM) | ~46 € | ~92 € (2 VM) | ~108 € web + ~130 à 170 € workers |
| Postgres géré (base et file) | ~12 € | ~34 € (~55 € avec haute disponibilité) | ~130 € |
| Rendu | ~5 à 15 € (Serverless Jobs) | ~100 à 150 € | ~300 à 575 € (Mac mini ou GPU) |
| Stockage et CDN | ~1 € | ~15 € | ~130 € |
| E-mails, supervision | ~0 € | ~25 € | ~112 € |
| **Total hébergement** | **~65 à 75 €** | **~270 à 340 €** | **~800 à 1 300 €** |
| IA (OpenRouter), pour comparaison | 116 à 195 $ | 1 160 à 1 950 $ | 11 600 à 19 500 $ |

- La ligne « rendu » vient de la recherche, qui supposait Serverless Jobs puis un Mac mini ou un GPU. Depuis R3, le rendu tourne en SwiftShader dans un conteneur de notre Compose, sur la VM : son coût passe dans la ligne VM, qui peut devoir grossir. **Non recalculé**, à mesurer au T0 (L0-03, L5-22). Mac mini et GPU restent des accélérations facultatives (L13-01).
- Vitrine : 0 € sur Cloudflare Pages ; 12,99 €/mois si Scaleway Edge Services au palier Professional (D6).
- Budget d'acquisition du plan offert : 10 $/jour au minimum, soit 300 $/mois au plus ; plafond absolu 50 $/jour avant mesure (§ 3.2).
- Clé `dev` : 10 $/jour au plus conseillés, pour ne jamais payer une lecture de développement vouée à l'échec.

### 7.2 IA par plan

- **Mesuré** : 1,10 à 1,85 $ par plan, plus environ 0,02 $ de qualification.
- **Frais OpenRouter** : 5,5 % par achat de crédits (0,80 $ au minimum), 8 % avec le routage UE (offre Business). Qualification et frais de 5,5 % compris : 1,18 à 1,97 $ par plan.
- **Prévu dans les prix** : 2,70 € par plan livré (cas prudent), plafond dur de 3 $ par plan, toutes passes et relances confondues, dont au plus une relance payante (R6) ; le plafond théorique d'une passe sans garde-fou est d'environ 13 $ (audit B8).

### 7.3 Coûts ponctuels et annexes connus

| Poste | Montant | Source |
|---|---|---|
| Dépôt INPI, classes 9, 35, 42 (+36 en option) | 270 € (310 € avec la 36) ; grille du 2/07/2026, non revérifiée | `recherche/nom.md` § 7, `recherche/juridique.md` § 7 |
| Extension UE (EUIPO), facultative | 850 € la 1re classe, 50 € la 2e, 150 € ensuite ; non vérifié | idem |
| Domaines (4 indispensables, 2 à 4 conseillés) | quelques euros à quelques dizaines d'euros par an chacun ; non vérifié | `recherche/nom.md` § 7 |
| Médiateur de la consommation (ex. CM2C) | 48 € pour 3 ans, puis 36 € par médiation | `recherche/juridique.md` § 1.7 |
| Lecture gardée du témoin | 1 à 2 $, une fois, sur accord | L1-12 |
| Frais Stripe | 1,5 % + 0,25 € (carte UE), 2,8 % + 0,25 € (premium), 0,35 € (SEPA), Billing 0,7 % ; litige 20 € + 20 € | `OFFRES.md` § 8.2 |
| Outils gratuits au départ | Cloudflare Access (50 testeurs), Turnstile, Sentry Developer, Better Stack, Umami, tarteaucitron | tickets L3-02, L6-06 ; `recherche/hebergement.md` § 7 |
| Accélération (après lancement) | Mac mini M4 149 €/mois ; GPU L4 0,79 €/h | `recherche/hebergement.md` |

### 7.4 Ce qui n'est pas chiffré

Avocat (tous les documents juridiques), RC professionnelle et cyber, expert-comptable, création de la société, plateforme agréée de facturation électronique, supplément exact de haute disponibilité, routage UE d'OpenRouter, prix de Brevo, compte Apple Developer (connexion Apple, plus tard), outil de consentement certifié si campagnes, budgets publicitaires, et le temps de travail lui-même.

---

## 8. Risques principaux et parades

| Risque | Effet | Parades | Tickets |
|---|---|---|---|
| **Coûts IA** : dérive, abus du gratuit, boucle de relances | Marge détruite ; carte vidée | Réservation avant dépense, 3 $ par plan relances comprises (R6), plafonds par compte, jour et global ; clés séparées plafonnées, clé « gratuit » réservée au plan offert (R23), recharge automatique coupée ; qualification à 0,02 $ ; budget du gratuit indexé sur la marge ; alertes à 50, 80, 100 % | L4-02, L5-09, L0-08, L6-02, L6-06, L8-09, L5-16 |
| **Qualité « zéro défaut »** : peu de plans testés ; un contrôle adversarial avait trouvé 115 défauts, dont 5 bloquants (`HISTORIQUE.md`) | Défaut visible sur une visite partagée : le bouche-à-oreille casse | Visite de contrôle bloquante, rejeu sans payer, CI de non-régression, contrôle des textes et du rendu, refus hors périmètre (plusieurs niveaux, plusieurs lots, R17), « Signaler un défaut » qui devient un contrôle, défaut de notre fait toujours corrigé gratuitement (R14), validation plan par plan | L1-02, L1-11, L1-04, L5-10, L4-08, L6-02, L6-09 |
| **Droit d'auteur des plans** : la 3D est une adaptation du plan | Contrefaçon, perte de confiance des promoteurs | CGU qui font garantir les droits ; plans jamais publiés ; vitrine sur le seul témoin fictif ; accord du promoteur pour les conseillers ; superposition masquée en mode simple, seulement avec preuve | L0-07, L2-11, L5-12, L1-03, L4-11, L9-08, L10-06 |
| **Traceurs sur les liens prospects** (journal d'ouverture = traceur selon le CEPD) | Non-conformité CNIL | Compteur agrégé par défaut, bouton « Je suis intéressé », détail seulement après consentement, avis de l'avocat ; pas d'Umami sur ces liens | L9-04, L7-01 |
| **Marché VEFA en baisse** : T2 2026 pire trimestre mesuré par la FPI ; 51 826 ventes au détail en 2025 | Volumes et prix mal calibrés | Particulier comme acquisition ; revenu des pros ; entretiens avant de construire ; sans engagement ; coûts fixes bas | L2-18, L9-11 |
| **Dépendance à un fournisseur d'IA** : OpenRouter sans SLA, un seul modèle | Panne, hausse de prix, engagement intenable | Fournisseur en réglage ; décision à rouvrir avant le premier promoteur ; engagement sur les visites publiées, jamais par génération ; reprise sans repayer ; tout changement de modèle validé par `evaluer.py` | L4-01, L0-03, L5-21 |
| **Vitesse du rendu logiciel** : environ 11 fois plus lent (3 photos en 215 s contre 19 s sur Mac M3) | Attente longue ; VM saturée (près de 5 cœurs par rendu) | 4 images seulement, vue du dessus en direct, visite calculée chez le client, délai mesuré avant d'être affiché, concurrence bornée, accélération après | L5-11, L6-03, L5-22, L13-01 |
| **Visite dans le navigateur du client** : téléphones d'entrée de gamme, navigateurs intégrés | Écran noir, visite illisible | Matrice de navigateurs testée, repli sur les images, message du catalogue | L4-10 |
| **Sécurité de l'existant** (audit B1 à B9) | Fuite de clé ou de plans | Lot 1 d'abord ; tests de sécurité automatiques ; rotation documentée des clés | L1-01, L5-19, L5-21 |
| **Nom non validé** : `surpieces.fr` et `.com` (pluriel) enregistrés par un tiers le 11/07/2026 | Conflit, changement de nom | Domaines et dépôt INPI avant toute annonce ; forme unique pour le rechercher-remplacer | L0-01 |

---

## 9. Indicateurs à suivre dès la bêta

Définitions et calculs : `SUIVI.md` § 5 ; seuils : `OFFRES.md` § 8.11.

| Indicateur | Seuil ou objectif | Source |
|---|---|---|
| Coût IA par plan : moyenne sur 30 jours, 9e décile, maximum | moyenne au-delà de 2 $ : revoir qualification, quotas et prix ; plan au-delà de 3 $ : arrêt et alerte | `appels_ia` |
| Échecs après lecture, par étape et par cause | sous 20 % | `plan_echoue` |
| Qualification : faux acceptés, faux refusés | à établir (test T1) | `plan_analyse` |
| Visite de contrôle : réussie, réparée, bloquée | à établir | `controle_termine` |
| Défauts signalés pour 100 plans publiés | à établir | `defaut_signale` |
| Défauts confirmés devenus un contrôle automatique | 100 %, traités en 5 jours ouvrés | `defaut_traite` |
| Délais : jusqu'à la vue du dessus, jusqu'à la visite, bout en bout (médiane, 9e décile) | comparés au délai affiché (T0) | journal |
| Durée de rendu par image en conteneur | seuil de bascule écrit (L5-22) | `etapes.duree_ms` |
| Visites qui ne s'affichent pas (WebGL absent ou perdu) | à établir | `visite_chargement_echoue` |
| Perte entre dépôt et compte vérifié | au-delà de 40 % : Google en premier | journal |
| Plans rendus, par motif | à établir | `credit_rendu` |
| Partages d'aperçus et de visites | à établir (T10) | journal |
| Prix jugé acceptable par les testeurs | décision avant J1 | questionnaire (T2) |
| Conversion aperçu → achat sur 30 jours (après 150 aperçus) | sous 11,1 % à 29 € : coupe-circuit | journal (dès J1) |
| Entretiens pros qui demandent l'essai | au moins un tiers, sinon revoir la promesse | L2-18 |
| Coût d'hébergement du mois | palier du § 7.1 | factures |

---

## 10. Mode d'emploi du dossier `tickets/`

**Organisation.** Un dossier par lot (`tickets/02-vitrine/`…), un fichier par ticket (`L2-04-accueil-particuliers.md`). En tête, un tableau à garder **exactement** dans ce format, car les charges et le chemin critique en sont tirés par script : `| Lot | Priorité | Taille | Dépend de | Touche | Statut |` (dossiers touchés : `[P]` pour `pipeline/`, `[M]` pour `moteur/`). Puis : Pourquoi, À faire, Critères d'acceptation, Points d'attention, Références, Hors périmètre. Ce sont les en-têtes qui font foi : l'index `tickets/README.md` en est tiré par `python3 outils/tickets.py`, et `python3 outils/tickets.py --verifier` contrôle en-têtes et dépendances (sans boucle, jamais vers un lot plus tardif).

**Un ticket = une branche courte**, nommée comme le fichier (`L1-01-fuite-env-scripts-chrome`), fusionnée dès que le ticket est fini. Pas de branche qui mélange deux tickets.

**Statuts** (cellule « Statut » du tableau d'en-tête) :
- À faire ;
- En cours ;
- En revue ;
- Fait (date) ;
- Bloqué (motif et ticket ou décision qui bloque) ;
- Abandonné (raison).

**Définition du « fini »** :
- tous les critères d'acceptation cochés ;
- le contrôle automatique qui empêche la régression est livré avec le ticket ;
- l'outil local marche toujours (`python3 pipeline/serveur.py`, `outils/finalise.sh`) ;
- aucun secret, aucun plan de promoteur, aucune réponse IA versionnés ou publiés ;
- aucun texte technique à l'écran ;
- aucun appel payant sans accord explicite ; tester d'abord sans payer (lectures gardées, `PLAN_MOCK`) ;
- les décisions prises en chemin sont reportées, datées, dans le document de `produit/` concerné.

**Critère de fusion pour tout ticket `[P]` ou `[M]`** (`ARCHITECTURE.md` § 8.1) :
1. rejeu sans IA des plans de référence (L1-02) : `plan.json` identiques, ou écarts voulus et justifiés ;
2. `evaluer.py` au moins égal à la référence ;
3. visite de contrôle réussie ;
4. contrôle des textes réussi (L1-04) ;
5. test de fumée de l'outil local réussi ;
6. pour `[M]` : images comparées aux images approuvées (L1-11) ;
7. petit diff isolé, coordonné avec l'agent des duplex ; ajouter plutôt que modifier.

**Règle « tout défaut devient un contrôle »** (`CLAUDE.md`) : chaque défaut trouvé, par nous, un testeur ou un client (L6-09), donne un contrôle automatique qui échoue avant la correction et passe après. Il est rangé là où il s'exécutera à chaque fois : visite de contrôle, contrôle des textes, vérification du rendu, CI. L'indicateur visé est 100 % (§ 9).

**Ajouter un ticket** :
1. le ranger dans le dossier de son lot, avec le numéro suivant (`L6-13-…`) ;
2. reprendre la structure ci-dessus, avec des dépendances vers des tickets existants ;
3. taille L au plus (5 j) ; au-delà, découper (comme L1-03 et L1-12) ;
4. citer le code par nom de fonction en plus du numéro de ligne, qui bouge ;
5. ne rien généraliser à des cas inconnus ; aucun secret ni contenu de plan de promoteur ;
6. régénérer l'index (`python3 outils/tickets.py`) et, s'il change un jalon, une charge ou le chemin critique, recalculer le § 6.1 et le § 6.4 de ce document ;
7. un P0 ne dépend pas d'un P1 : relever la priorité du prérequis ou retirer la dépendance.

---

## 11. Index des documents

| Document | En une ligne |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Consignes du projet : zéro défaut visible, plan par plan, tester sans payer, rien de versionné des promoteurs |
| [`../README.md`](../README.md) | Présentation de la chaîne actuelle |
| [`../pipeline/README.md`](../pipeline/README.md) | Installation et fonctionnement de l'outil local |
| [`../moteur/SCHEMA.md`](../moteur/SCHEMA.md) | Format de `plan.json`, lu par le moteur |
| [`../HISTORIQUE.md`](../HISTORIQUE.md) | Journal des étapes et des mesures de qualité |
| [`OFFRES.md`](OFFRES.md) | Offres, prix, grand livre de crédits, économie unitaire, tests T0 à T13, risques |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture cible, décisions D1 à D7, données, sécurité, migration, exploitation |
| [`MARQUE.md`](MARQUE.md) | Nom, promesse, ton, vocabulaire, direction artistique, logo, accessibilité |
| [`MESSAGES.md`](MESSAGES.md) | Tous les textes : pages, parcours, e-mails, erreurs, bandeau |
| [`PARCOURS.md`](PARCOURS.md) | Parcours écran par écran : particulier, conseiller, promoteur, marque blanche, administration |
| [`SUIVI.md`](SUIVI.md) | Plan de marquage : Umami, journal, attribution, dictionnaire, entonnoirs, tableaux de bord |
| [`recherche/audit-code.md`](recherche/audit-code.md) | Audit du code : bloquants B1 à B11, à adapter, réutilisable |
| [`recherche/marche.md`](recherche/marche.md) | Marché VEFA, concurrents, cibles, prix de référence |
| [`recherche/suivi.md`](recherche/suivi.md) | Faits sur Umami, CNIL, Meta, Google et bandeaux |
| [`recherche/auth-paiement.md`](recherche/auth-paiement.md) | Authentification, Stripe, crédits, anti-abus, facturation électronique |
| [`recherche/hebergement.md`](recherche/hebergement.md) | Hébergeurs, mesure SwiftShader, coûts par palier, plafonds OpenRouter |
| [`recherche/juridique.md`](recherche/juridique.md) | Rétractation, garantie, RGPD, droit d'auteur, AI Act, documents à produire |
| [`recherche/nom.md`](recherche/nom.md) | Choix du nom, disponibilités, sécurisation de la marque |
| [`../tickets/`](../tickets/) | Les 150 tickets rangés par lot ; en-têtes qui font foi ; index `README.md` régénéré par `outils/tickets.py` |
