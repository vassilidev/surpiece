# Lancement : marque, offres, pages et publicité

Version du 29/09/2026. Ce document reprend les travaux du 27/09/2026 (`MARQUE.md`, `OFFRES.md`, `MESSAGES.md`, `recherche/`) et les **corrige** avec les décisions prises par l'utilisateur le 29/09/2026. En cas d'écart, il prime sur eux pour tout ce qui touche au nom, aux cibles, aux offres affichées et aux pages de vente. La technique (`ARCHITECTURE.md`, tickets des lots 4 et 5) n'est pas touchée.

Fichiers produits :
- `produit/maquettes/accueil.html` : page d'accueil des particuliers, maquette de travail (nom en variable `{{MARQUE}}`) ;
- `produit/maquettes/conseillers.html` : page des conseillers en gestion de patrimoine (CGP) ;
- `produit/marque/` : logo et symboles vectorisés. Les versions « SUR PIÈCE » sont une exploration abandonnée ; la méthode (script de vectorisation d'Archivo) resservira pour le nom final ;
- `produit/recherche/nom-international.md` et `produit/recherche/concurrence-2026-09.md` : recherches du 29/09/2026.

---

## 0. Décisions du 29/09/2026

| # | Décision (paroles de l'utilisateur) | Conséquence |
|---|---|---|
| L1 | Nom international : « je ne vois pas forcément un nom en français car l'outil peut aider bcp de gens rapidement je pense dans le monde entier » | « Sur Pièce » et « Avant-Clés » abandonnés. Recherche d'un nom qui marche en anglais, français, espagnol, allemand. Le logo au « È » disparaît ; la direction artistique reste (§ 3) |
| L2 | Lancement en France d'abord | Site en français au lancement, anglais juste après ; le `.fr` doit être libre |
| L3 | « Particulier puis pro mais avec les landing pages également faites pour pouvoir faire mes ads » | Une page par cible, pensée pour la publicité : un message, un bouton, cohérence annonce → page (§ 5, § 6) |
| L4 | « Promoteur je n'y crois pas mais côté client et CGP j'y crois fortement » | Offres promoteurs (Programme) et marque blanche **reportées** : ni page, ni prix affiché au lancement. Lots 10 et 11 en attente |
| L5 | Réseau existant : CGP / conseillers | Premier canal pro : son réseau, avec l'offre « cabinets fondateurs » |
| L6 | Budget du nom : environ 500 € | Pas de rachat d'un `.com` cher : `.com` libre, ou `.app` / `.homes` / préfixe assumés |
| L7 | CGP : « le CGP enverra un lien et l'utilisateur l'ouvrira […] ils feront leurs rdv ensemble pour débrief ou pour présenter en live le projet donc oser » | L'offre Pro est vendue sur le **lien sans compte** et le **mode présentation**. Le suivi d'ouverture et le bouton « Je suis intéressé » (`OFFRES.md` § 3.4) sortent du discours commercial |

---

## 1. Positionnement

**Pour qui.** L'acquéreur d'un logement neuf vendu sur plan, et le conseiller qui le lui vend (CGP, CIF, commercialisateur).

**La promesse.** Entrer dans son futur logement avant qu'il soit construit, d'après les cotes de son plan de vente, en quelques minutes.

**Ce qui nous distingue** (à confirmer par `recherche/concurrence-2026-09.md`) :
1. **On part du plan de vente tel quel.** Les logiciels grand public obligent à redessiner ; les studios et services en ligne passent par une équipe.
2. **Quelques minutes**, contre 24 h à plusieurs jours chez les services de modélisation. C'est décisif pendant les 10 jours de rétractation, et pour un CGP qui prépare son rendez-vous du lendemain.
3. **Fidélité vérifiée** : surfaces comparées au tableau du promoteur, visite parcourue automatiquement avant livraison.
4. **Le lot exact**, pas un lot type.
5. **Visite et 360° dans le navigateur**, fluides sur un téléphone modeste.

**Sur quoi on ne se bat pas au lancement** : mobilier, décoration, TMA, visite de résidence.

---

## 2. Nom

**Résultat de la recherche** (`recherche/nom-international.md`, 587 `.com` testés) : recommandation **Dejavisit** (33/40, tous domaines libres, aucune marque proche trouvée), plan B **Forewalk** (30/40, risque FIREWALK de Sony à faire valider). Suivent Planporta, Prewalk (`.com` à 3 995 $, hors budget) et Soonkeys. **29/09/2026 : l'utilisateur n'aime aucun des cinq noms (« j'aime aucun des noms c'est fou ») ; recherche à reprendre à partir des styles qu'il préfère.** Pour mémoire, Dejavisit avait d'abord été coché par erreur. Domaines revérifiés libres le même jour : `dejavisit.com`, `dejavisit.fr`, `dejavisit.app`, `dejavisits.com`, `dejavisite.fr` (`dejavisite.com` est pris). À acheter tout de suite, puis recherche d'antériorité INPI et EUIPO et dépôt (L0-01).


En cours : `recherche/nom-international.md`. Critères retenus :
- même prononciation et même orthographe en anglais, français, espagnol, allemand ; aucun sens gênant, arabe compris (Dubaï) ;
- évoquer la décision et la projection (entrer, visiter avant, clés, pièce, seuil), pas la technique (« 3D », « virtual », « immersive », « AI » : bruit de tous les concurrents) ;
- court, déposable ;
- domaine dans le budget de 500 € ; `.fr` libre.

Constat du 29/09/2026 (whois et RDAP) : les `.com` de presque tous les mots simples ou inventés courts sont pris ou parqués. De bons noms restent libres en `.app` ou `.homes`.

À faire dès le choix : domaines, recherche d'antériorité (INPI, EUIPO), dépôt (classes 9, 35, 42, et 36 en option ; en marque de l'UE si l'on vise l'international tôt), comptes sociaux. Le ticket L0-01 reste valable ; remplacer le nom dans la variable `{{MARQUE}}` des maquettes.

---

## 3. Identité visuelle

**Conservée** : la direction artistique « architecte » de `MARQUE.md` § 6. Elle ne dépend pas du nom, elle est lisible dans toutes les langues, et elle se distingue des rendus 3D brillants de la concurrence :
- papier clair, traits d'encre de 1,5 px, angles droits ;
- un seul bleu (Bleu plan `#2C49B8`, `#93A8FF` en sombre) pour l'action, les cotes et le parcours ;
- Archivo à chasse variable (large pour les titres et le mot-symbole), DM Mono pour tout ce qui se mesure ;
- le cartouche comme signature (en-tête de visite, logo étendu, e-mails, factures).

**Logo, principe gardé** : le mot-symbole en capitales Archivo 800, chasse 125, dans un cartouche. Il faudra trouver son détail propre au nom final, comme le È-cote l'était pour « Sur Pièce » : une lettre dont un trait devient une cote, un point en Bleu plan, un arc de porte.

**Symbole (favicon)** : à 16 px, le symbole « la pièce » de `MARQUE.md` § 7.3 (murs, porte et arc) n'est pas lisible (rendu du 29/09/2026). La variante « lettre dans son cadre » l'est. On prendra l'initiale du nom final dans son cadre, avec l'accent en Bleu plan.

**Ton** : vouvoiement, phrases courtes, concret (pièce, cote, surface), aucune promesse juridique (« conforme », « garanti », « au centimètre »). Plus osé sur la page conseillers (L7).

---

## 4. Offres et prix affichés au lancement

Hypothèses de lancement, à tester par périodes (`OFFRES.md` § 9). Changements par rapport au 27/09/2026 : gratuit en 360°, palier « Ultra réaliste », suivi retiré du discours Pro, promoteurs reportés.

### 4.1 Particuliers (TTC, paiement au plan)

| Palier | Prix | Contenu |
|---|---|---|
| Premier plan | Offert | Visite 360° de chaque pièce, plan 2D coté et surfaces, maquette 3D vue du dessus, écarts avec le tableau du promoteur, lien de partage 30 jours. Ni moteur ni `plan.json` envoyés (décision 6) |
| Visite complète | **19 €** (décidé le 29/09/2026 ; 29 € proposé avant) | Tout le gratuit, plus la promenade libre à hauteur d'yeux, maquette et plan 2D interactifs, photos et fiche en PDF, liens privés, 24 mois en ligne |
| Ultra réaliste | **39 €** (décidé le 29/09/2026 ; 49 € proposé avant) | La visite complète, plus le rendu ultra réaliste (matières, lumière du jour, ciel, paysage) et des photos haute définition |
| Plan suivant | 15 € | Autre lot ou plan modificatif, dans les 12 mois |

Pourquoi trois paliers :
- le 360° gratuit est ce que l'acheteur connaît déjà des sites d'annonces : il le partage, et il donne envie d'entrer vraiment (décision 15) ;
- 29 € reste un achat d'impulsion : 0,01 % du prix d'un T3 neuf ;
- le palier à 49 € rend le 29 € raisonnable et vend le mode « Ultra réaliste » décidé le 29/09/2026 (« si la personne paye on doit la mettre ultra bien »). Il n'est vendu qu'une fois ses contrôles en place (`OFFRES.md` § 7.1).

Points d'attention :
- **Coût du 360° gratuit.** Sans carte graphique, rendre 4 à 11 panoramas prend de l'ordre de 20 à 40 min par plan (L1-16). À mesurer avant d'afficher « 360° offert » ; repli possible : 360° de 2 pièces offert, le reste à débloquer.
- Le comparatif à 3 lots (59 €) de `OFFRES.md` n'est plus affiché en carte : il encombrait la grille. Le plan suivant à 15 € le remplace.

### 4.2 Conseillers : offre Pro (HT, sans engagement)

| Formule | Prix | Contenu |
|---|---|---|
| Solo | 49 €/mois | 5 plans par mois, 1 utilisateur, liens illimités, votre logo |
| Cabinet | 99 €/mois | 12 plans, 3 utilisateurs, dossiers par client, vos couleurs et votre lien de rendez-vous, fiche du lot en PDF |
| Équipe | 199 €/mois | 30 plans, 10 utilisateurs, bibliothèque partagée, visites intégrées au site |
| Essai | 0 € | 14 jours, 3 plans, sans carte, 1 par SIREN |
| Cabinets fondateurs | **3 mois offerts** (décidé le 29/09/2026) | Les 30 premiers cabinets, contre un entretien mensuel de 20 min. Porte d'entrée idéale pour le réseau de l'utilisateur |

Annuel : 10 mois payés sur 12. Recharges et reports : `OFFRES.md` § 3.2.

**Mode présentation** (à construire, ticket à créer dans le lot 9) : visite guidée pièce par pièce, en plein écran, avec plan coté et maquette à portée de clic, pensée pour le partage d'écran. C'est la fonction phare de la page conseillers. Le moteur a déjà les arrêts par pièce et le 360° : c'est surtout de l'interface.

Retirés du discours (L7) : statut « ouvert » par client, notification « Je suis intéressé ». Un simple compteur d'ouvertures par lot peut rester dans l'outil sans être vendu.

### 4.3 Reportés

Promoteurs (rapport, pilote, prix au lot), marque blanche, codes à offrir : gardés dans `OFFRES.md` § 4 et § 5, sans page ni prix publics tant que l'utilisateur ne les rouvre pas.

---

## 5. Pages de vente

Deux pages, une par cible, construites pour la publicité. Chacune tient la même promesse que l'annonce qui y mène, et n'a qu'une action principale.

| Page | Adresse | Action principale | Titre |
|---|---|---|---|
| Particuliers | `/` | Importer mon plan (premier plan offert) | « Entrez dans votre appartement avant qu'il soit construit. » |
| Conseillers | `/pro` | Essayer 14 jours, sans carte ; puis démonstration | « Faites visiter le lot avant la première pierre. » |

Ce que montrent les maquettes :
- **en tête de page, le produit lui-même**, pas une image : une maquette 3D en direct de l'appartement témoin fictif (T3 de 63 m², surfaces et cotes calculées sur la géométrie dessinée). Particuliers : trois modes (plan 2D, maquette 3D, hauteur d'yeux) et une ouverture où le plan se lève en volume. Conseillers : une visite guidée « en visio » qui passe de pièce en pièce, portes comprises ;
- **l'attente mise en scène** (décision 16) : sur la page particuliers, déposer un fichier lance une démonstration de l'écran « chantier » (étapes, phrases de chantier), puis ouvre la visite. Aucun fichier n'est envoyé ;
- **les objections levées tôt** : trois assurances sous le bouton (offert sans carte, plan privé, rien décompté en cas d'échec), limites écrites en clair (un ou deux niveaux, logement vide, non contractuel) ;
- un comparatif **sans nommer de concurrent** (publicité comparative encadrée) : logiciel à redessiner, service de modélisation, appartement témoin ;
- sur téléphone, le bouton reste fixé en bas de l'écran. Vérifié à 390 px, sans défilement horizontal, en clair et en sombre.

À faire ensuite : page Tarifs, page Méthode, pages légales (`MESSAGES.md` § 5, § 9, § 8.6), version anglaise, variantes de titre pour les tests (§ 6.3). Les textes de `MESSAGES.md` restent la base pour les parcours et les e-mails, en retirant le nom « Sur Pièce ».

---

## 6. Publicité

### 6.1 Particuliers

**Recherche Google** : c'est là qu'est l'intention. Mots relevés (`recherche/marche.md` § 3.2) :
- « transformer plan 2d en 3d », « plan appartement 3d », « plan de vente appartement » ;
- « vefa rétractation », « achat sur plan piège à éviter », « visite cloison vefa que vérifier », « coût tma vefa ».
Une annonce par famille, et un titre de page qui lui répond (variantes A à C de `MESSAGES.md` § 1.1).

**Meta (Instagram, Facebook)** : vidéo courte au format vertical, tournée sur l'appartement témoin fictif : le PDF → le plan redessiné → la maquette qui se lève → la marche dans le séjour. Accroches proposées :
- « Vous avez signé sur plan ? Entrez chez vous. »
- « Votre plan de vente, en visite 3D, en quelques minutes. Premier plan offert. »
- « Le lit passe-t-il dans la chambre 2 ? Vérifiez avant les clés. »
À vérifier avant la première campagne : les règles de Meta pour les annonces liées au logement (ciblage restreint), et la catégorie applicable en France (lot 12, L12-01).

### 6.2 Conseillers

- **Son réseau d'abord** : message direct, offre « cabinets fondateurs », démonstration de 20 min où l'on génère un de leurs lots pendant l'appel.
- **LinkedIn** : contenus et annonces vers les CGP, CIF et commercialisateurs de neuf (statut du bailleur privé, investisseurs qui achètent à distance). Accroches : « Votre client achète un T2 à Bordeaux depuis Lille. Faites-lui visiter le lot. » ; « Le lot que vous vendez n'a qu'un PDF. Donnez-lui une visite. »
- **Associations et salons** : CNCGP, ANACOFI, Patrimonia.

### 6.3 Mesure

Chaque annonce pointe vers sa page avec des paramètres UTM. Mesure principale : dépôts par visiteur (particuliers), essais démarrés (conseillers). Umami et le journal d'événements serveur, comme prévu (`PLAN.md` § 5). Le bandeau de consentement devient nécessaire dès que les UTM sont enrichis ou qu'un pixel publicitaire est posé (R18). À prévoir avant la première campagne.

---

## 7. Concurrence

Détail : `recherche/concurrence-2026-09.md` (29/09/2026), qui complète `recherche/marche.md`.

- **Les plus proches** : 3D Estate / 3D Twin (Pologne, plans PDF → 3D par API, plus de 400 promoteurs, site français prêt), GetFloorplan (25 à 69 $ par plan, 24 h, contrôle humain), Aginera (plan PDF → 3D où l'on marche, gratuit, produit d'appel), WalkMyHome (30 s, 47 à 67 $), RoomSketcher (20 $ par niveau). En France : Plan Alive (promoteurs), Habiteo (fait main), Kaufman & Broad (images IA de chaque lot depuis avril 2026).
- **Ce que personne ne fait** : prouver la fidélité au plan (surfaces comparées au tableau du promoteur, contrôle avant livraison), et parler le langage de la VEFA (rétractation, TMA, visite cloisons).
- **Mécaniques de héros qui reviennent chez ceux qui convertissent**, reprises dans la maquette du 29/09/2026 : avant/après dès le premier écran avec un vrai plan ; délai chiffré ; prix ou gratuité dans le bouton ; essai sans risque ; démo sans compte juste en dessous.

## 7 bis. Pages : ce qui a changé le 29/09/2026 au soir

Demandes de l'utilisateur : utiliser ses vrais plans, un avant/après « simple, que tout le monde peut comprendre », s'inspirer des concurrents « car ça marche », retirer la ligne des limites du héros (« ça inquiète plus que ça aide »), et une grande démo plus bas où l'on navigue entre plan importé, plan 2D généré, maquette 3D, visite 3D, 360° et ultra réaliste.

- Héros : titre fonctionnel (« Transformez votre plan de vente en visite 3D. »), bouton « Essayer gratuitement avec mon plan » qui ouvre directement le sélecteur de fichier (plus de défilement), curseur avant/après entre le plan du promoteur et la vue du dessus du moteur, calés au pixel près en mètres (T2 « 432 »).
- Section « Essayez sur un vrai logement » : le vrai moteur et la vraie visionneuse 360°, pilotés par six onglets.
- Les limites restent près des prix et en pied de page.
- **À régler avant toute mise en ligne publique** : le T2 432 vient d'un plan de promoteur. Il faut son accord écrit, ou un plan qui t'appartient (le D201), ou l'appartement témoin fictif (L1-03). Les images dérivées ne sont pas versionnées (`produit/maquettes/.gitignore`).

---

## 8. Questions ouvertes pour l'utilisateur

1. **Nom** : aucun des 5 finalistes retenu ; recherche relancée par style.
2. **Prix particuliers** : tranché le 29/09/2026, offert / 19 € / 39 €. Reste : coût de rendu du 360° gratuit (20 à 40 min de calcul par plan) à mesurer.
3. **Offre fondateurs CGP** : tranché le 29/09/2026, 3 mois offerts (30 cabinets, entretien mensuel).
4. **Publicité** : tranché le 29/09/2026, environ 500 €/mois sur Google Search d'abord.
5. **Anglais** : quelle date, et quel premier marché étranger (Royaume-Uni, Espagne, Dubaï) ?
6. **Visage** : la marque parle-t-elle au nom d'une équipe anonyme, ou avec toi comme fondateur visible (LinkedIn notamment, très efficace auprès des CGP) ?

## 9. Le vrai site (29/09/2026, soir)

Les maquettes deviennent le site réel, dans `site/` (fichiers sources sans framework, R19) :
- `site/pages/index.html` (particuliers) et `site/pages/conseillers.html` (CGP), `site/assets/` (styles, scripts, illustrations au trait) ;
- `python3 outils/site_demo.py` produit `site/demo/` : le logement de démonstration (D201, choisi par l'utilisateur), moteur copié **sans `admin.js`**, cartouche et titres neutres (ni promoteur ni SCCV), plan du promoteur et vue du dessus recalés au pixel près, géométrie pour l'animation ; `outils/site_rendu.mjs` fait la vue du dessus (Chrome sans secret, serveur en liste blanche de `moteur/chrome.mjs`) ;
- `python3 outils/site.py --nom "<nom>"` assemble `site/dist/` ; `site/demo/` et `site/dist/` ne sont jamais versionnés.

Structure de la page d'accueil, suivant les retours de l'utilisateur (esprit Apple / Airbnb, rassurant, illustrations au trait, bento) : héros avec l'animation en vraie 3D (dépôt, analyse avec compteurs, plan 2D, murs qui montent, plongée dans le séjour, fondu sur la photo) ; bande sombre des chiffres réels de la lecture ; démo du vrai moteur (6 onglets) ; planche des rendus ; preuves (surfaces, contrôles dont le test de l'eau, questions à poser au promoteur) ; frise de l'achat sur plan ; « votre plan reste le vôtre » ; comparatif ; prix ; questions. Même système pour la page conseillers (visio, mode présentation, fondateurs).

Reste à faire :
- **mode « intégré » du moteur** (démarrage direct dans un mode, sans galerie ni en-tête) : aujourd'hui la page masque le moteur jusqu'à ce qu'il soit prêt ; à ajouter dans `moteur/ui.js` en coordination avec l'agent qui y travaille ;
- inscription, connexion et dépôt réel (reportés par l'utilisateur) : les boutons mènent pour l'instant à la démo ;
- favicon et logo au nom définitif ; hébergement OVH ou Scaleway ;
- la section « mode présentation » vendue aux CGP est à construire dans le produit (ticket du lot 9).

### 9.1 Labo de contrôle (site)

La carte « Une batterie de tests avant chaque livraison » ouvre le labo (`site/assets/js/labo.js`) : cinq contrôles animés sur le D201. Chacun illustre un contrôle **réel** de la chaîne ; ne jamais en ajouter un qui n'existe pas :
- l'eau → étanchéité, test d'immersion (`moteur/controle.mjs`, types `etancheite`, `fuite`) ;
- la boîte noire → fentes : le dehors cherché depuis chaque bord de pièce, rayons à ±2 mm, fentes fines de moins de 4 mm (`controle.mjs`, types `fente`, `lumiere`) ;
- la superposition → relecture en zoom par pièce et arbitrage de chaque correction posé dans les deux ordres (`pipeline/lire.py`, `apercu.py`) ;
- le parcours → pièces accessibles, portes franchissables, baies dégagées (`controle.mjs`, `navigation`, `porte`, `baie`) ;
- les surfaces → comparées au tableau du promoteur (fiche).
Le mur « oublié » de la version ratée est un vrai mur de façade du logement, retiré pour la démonstration.
