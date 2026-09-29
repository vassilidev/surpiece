# Veille concurrentielle : du plan au logement visitable

Recherche du 29/09/2026. Elle complète `marche.md` (27/09/2026) et le corrige quand c'est nécessaire.

**Règles de lecture**
- Chaque fait externe est suivi de sa source.
- « Non vérifié » signale ce que je n'ai pas pu confirmer.
- Les prix sont dans leur devise d'origine, sans conversion, sauf mention contraire.
- **Vérifié le 29/09** : j'ai relu moi-même la page, en HTML brut ou rendue.
- **Rapporté** : lu par un agent de recherche dans la même session, avec l'URL citée, mais pas relu par moi.
- **Secondaire** : article, agrégateur ou résumé de moteur de recherche, et non le site de l'éditeur.

**Méthode.** Les pages en JavaScript ont été rendues avec r.jina.ai ou Chrome sans interface. Pour GetFloorplan, les prix ont aussi été lus dans le code (bundle JS). Aucune mesure de conversion n'est disponible : quand je dis qu'une page « convertit », c'est une déduction tirée de ses mécaniques, pas une donnée.

---

## 0. En bref

1. **Le vrai danger sur le segment promoteurs est 3D Estate / 3D Twin (Pologne).**
   - Sur un portail, il reçoit par API les plans PDF des logements et génère « en quelques minutes » des vues 3D et une visite interactive. Il a fait plus de 200 000 logements pour obido.pl depuis 2018.
   - Il revendique plus de 400 promoteurs et plus de 2 500 programmes, et il a déjà un site en français : « Vendez ou louez chaque logement sur plan, avant la fin du chantier ».
   - Ses prix ne sont pas publiés.
2. **Sur le segment particuliers, la menace vient d'outils IA récents qui promettent « plan → 3D visitable » en 10 à 30 secondes.**
   - Aginera : 5 plans gratuits, vidéo à 19 $.
   - WalkMyHome : 47 $ ou 67 $ en paiement unique, « True 1:1 Scale ».
   - RoomSketcher AI Convert : 20 $ par niveau, avec Live 3D.
   - Planner 5D : 59,99 $ par an.
   - Aucun ne parle de VEFA ni ne compare les surfaces au tableau du promoteur.
3. **GetFloorplan reste le repère de prix « par plan ».** 25 $ (2D + 3D), 45 $ (+ 360°), 61 $ (+ marque blanche), 69 $ (+ rendus). Livraison en 24 h avec contrôle humain, et pas de marche libre.
4. **En France, c'est encore du fait main.**
   - Studios, sur devis, en 3 à 5 jours : Habiteo/Bien'ici, Realiz3D, VirtualBuilding, Vizion Studio.
   - Figaro 3D Immo vend un pack à **149 € HT** (images 3D, plan 3D, visite) en « quelques jours ».
   - Nouveaux entrants IA : **Plan Alive** (PDF → rendus pour promoteurs, marque blanche, API, prix non publié) et **les galeries IA par lot de Kaufman & Broad** (avril 2026).
5. **L'angle libre.** Personne ne parle à l'**acquéreur VEFA**. Personne ne **prouve** la fidélité aux cotes : Aginera écrit même que ses rendus « may not accurately represent the underlying plans ». Personne ne compare les surfaces au tableau du promoteur, ni ne se cale sur le calendrier de la VEFA (rétractation, TMA, visite cloisons).
6. **Repères de prix.**
   - Acquéreur : 19 à 67 $ par plan dans les outils IA, 139 € TTC pour VEFA Conseil (relecture du contrat, sans 3D), 149 € HT chez Figaro 3D Immo.
   - Agents : 19 à 199 € par mois (Floorfy, Ogulo, Pedra).
   - Promoteurs, faute de mieux : 1 130 € HT par lot (Habiteo, 2017), 199 à 399 zł par logement (3D Estate, offre Otodom).

---

## 1. Tableau de fonctions

Légende : ✓ = oui (source), ✗ = non, ? = non vérifié, « ann. » = annoncé mais non constaté. Le détail et les sources sont dans les fiches (§ 3) et les prix (§ 2).

### 1.1 Plan → 3D ou visite, par IA ou par un service

| Acteur | Entrée | Auto / humain | Délai | Plan 2D | Maquette 3D | Visite libre 1re pers. | 360° | Photoréal. | Mobilier | Fidélité aux cotes annoncée | Lien partage | Marque blanche | Suivi d'ouverture | API | Cible | Pays | Prix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Sur Pièce** (rappel) | plan de vente PDF / capture | auto | ~10 min | ✓ coté | ✓ | ✓ portes au clic | ✓ | option | ✗ (pour l'instant) | ✓ vérifiée automatiquement | ✓ | prévu | prévu | ? | acquéreur, conseiller, promoteur | FR | 29 € ; 49-199 €/mois ; 15-25 € HT/lot |
| **3D Estate / 3D Twin** | plan PDF (API) | auto sur portail ; production pour promoteurs | « quelques minutes » (portail) ; offre Otodom jusqu'à 10 j ouvrés | ? | ✓ plans 3D meublés, coupe 3D | ? (« spacer 360 ») ; caméra libre seulement dans la maquette ELITE | ✓ | ✓ | ✓ plusieurs ambiances | ? | ✓ site, portails | ? | ✓ statistiques, CRM | ✓ | promoteurs, portails, bailleurs | PL (bureaux UK, ES) | sur devis ; 199-399 zł/logement (offre Otodom) |
| **GetFloorplan** | DWG, JPG, PNG, PDF | IA + contrôle humain | 24 h | ✓ | ✓ | ✗ (360° seulement, non vérifié) | ✓ | ✓ (set Max) | ✓ styles | « accurate », non chiffrée | ✓ lien public, widget | ✓ dès 61 $ | ? | mentionnée | promoteurs, gestion, agences 3D, particuliers | origine russe probable (non vérifié) | 25-115 $/plan |
| **Aginera** (outil « Floor Plan to 3D ») | PDF, scan, croquis photo | auto | minutes | ✓ (CAD DWG/DXF) | ✓ dollhouse | ✓ « step inside… from standing height » | ? | ✓ rendus par pièce | ✓ objets détectés | ✗ avertit qu'il faut vérifier | ✓ lien public | ? | ? | ✓ | constructeurs, designers, « home that is still a drawing » | US | 5 plans gratuits ; vidéo 19 $ |
| **Cavoss Floor Plan Studio** | PDF, PNG, CAD + photos ou perspectives | IA (FAQ), service | 24 h | ✓ plan interactif | ? | ✗ vidéo par pièce | ✗ | ? | ? | ? | ✓ lien + iframe | ✓ logo agence | ? | ? | agents UK et Émirats, vente sur plan | UK / EAU | 39 $ par visite |
| **WalkMyHome** | photo ou PDF du plan, ou génération IA | auto | « 30 sec » | ✓ | ✓ | ✓ « walk through » | ? | « Photoreal 3D » annoncé | ✓ 2 000 objets | ✓ « True 1:1 Scale », « Measurements kept » | ? | ? | ? | ? | particuliers, autoconstructeurs | ? | 47 $ / 67 $ une fois |
| **VirtualSpaces Foursite** | JPG, PNG | auto | minutes | ? | ✓ | ann. (billet du 10/06/2026, « coming features ») | ? | ✓ | ✓ IA | « Precision Scaling » | ? | ? | ? | ? | architectes d'intérieur | Inde | ? |
| **RoomSketcher** | PDF, JPG, PNG (dessin informatique) ; échelle à caler à la main | IA (bêta) + éditeur ; ou redessin humain | secondes (IA) ; jour ouvré suivant (humain) | ✓ coté, à l'échelle | ✓ | ✓ Live 3D | ✓ | partiel (3D Photos) | ✓ | « to-scale » | ✓ | ✓ branding dès Pro | ? | Enterprise | agents, pros, particuliers | NO (non vérifié) | 20 $/niveau ; Pro 12-24 $/mois |
| **Planner 5D** | 18 formats dont PDF, DWG | auto, puis correction manuelle | 10 min à 24 h | ✓ | ✓ | ? | ✓ (Pro) | ✓ 4K | ✓ | ✗ ; exige des cotes sur le plan | ✓ | Enterprise | ? | Enterprise | particuliers, designers | international | 59,99 $/an |
| **Plan Alive** (Hubvisory) | PDF, JPG, PNG | IA + « supervision ciblée » | « 20 secondes » de traitement | ? | ? | « 3D Walkthrough » mentionné, sans démo | ? | ✓ | ✓ | ? | ? | ✓ charte du client | ? | ✓ API, connecteurs PIM/CRM | promoteurs, réseaux, VEFA | FR | non publié |
| **Figaro 3D Immo** (plan3d.immo) | photo + plan 2D | humain (non vérifié) | « quelques jours » | ✓ | ✓ plan 3D, axonométrie | ? | ? | ✓ 4K | ✓ | ? | ✓ | ? | ? | ? | agents ; promoteurs sur devis | FR | 149 € HT (pack) ; 75 € HT (plan 3D) |
| **Habiteo / Bien'ici** | plans du promoteur | studio « industrialisé » | non publié | ✓ | ✓ + maquette résidence | ? | ✓ vues réelles | ✓ | ✓ | ? | ✓ mini-site | ✓ | ✓ CRM myHabiteo | ? | promoteurs | FR | sur devis (1 130 € HT/lot en 2017) |
| **Realiz3D** | plans du promoteur | studio | ? | ? | ✓ RealViz3D | ✓ configurateur (Nexity Inside, Urbis) | ? | ✓ | ✓ | ? | ✓ | ✓ | ? | ? | promoteurs | FR | sur devis |
| **VirtualBuilding** | plans d'étage | studio | ? | ? | ✓ maquette orbitale | ✓ « visite 3D libre » | ✓ | ✓ | ✓ | ? | ✓ iframe | ? | ? | ? | promoteurs (200+) | FR (Lyon) | sur devis |
| **Vizion Studio** | plans | studio | 1re image en 72 h, total 3 à 5 j ouvrés | ✓ | ✓ | ✓ visite virtuelle | ✓ | ✓ | ✓ | ? | ? | ? | ? | ? | promoteurs | FR | sur devis |
| **Kaufman & Broad** (en interne) | ? | « visuels générés par IA » | ? | ✓ | ✓ maquettes | ? | ? | ✓ | ? | ? | ✓ site | – | – | – | ses acquéreurs | FR | – |

### 1.2 Outils de conception avec import de plan (dessin ou reconnaissance)

| Acteur | Entrée | Reconnaissance du plan | Visite / 360° | Cible | Prix |
|---|---|---|---|---|---|
| HomeByMe (Dassault Systèmes) | PNG, JPG, PDF **à décalquer à la main** ; ou service de dessin humain en 3 jours | ✗ | 360° (Pro), rendus 4K | particuliers, pros | Starter gratuit ; Essentials 29 €/mois ; Pro 59 €/mois (secondaire) |
| Homestyler | plan, CAO ou photo → « Auto-convert to editable 3D floor plan » | ✓ | panoramas, visite interactive | particuliers, designers | dès 6,27 €/mois (rapporté) |
| Coohom (Manycore) | image ou PDF, avec calage de l'échelle | ✓ murs, portes, fenêtres | 360° en 8K | designers | Pro 29 €/mois (rapporté) |
| Cedreo | JPG, PNG, PDF, DXF, DWG **à décalquer** | ✗ | rendus 3D, effets IA | constructeurs de maisons | sur démo ; « dès 79 €/mois » selon GetApp (non vérifié) |
| Kazaplan (Leroy Merlin, ex-Kozikaza) | dessin manuel | ✗ | 3D, 5 rendus HD par jour | particuliers | gratuit |
| ArchiFacile | import d'image ou de PDF comme fond | ✗ | vue 3D | particuliers | Plus : 37 € à vie ; PRO : 84 €/an |
| Houzz Pro | « AutoMate AI traces the 2D document » | ✓ | dollhouse, visite intérieure | pros du bâtiment | ? |
| Maket.ai | import assisté par IA | ✓ (validation humaine en Pro) | ? | particuliers, pros | 20 $/mois ; 100 $/mois |

### 1.3 Plan → images seulement, sans visite

| Acteur | Promesse | Prix |
|---|---|---|
| Vizcraft | « Floor plan in. 3D isometric out. », en 10 s environ | Free : 2 crédits, sans carte ; 19 $/mois (0,76 $/rendu) ; 49 $/mois (0,49 $/rendu) |
| Rendair | « Convert floor plans into 3D photorealistic renders instantly » | 19, 49 ou 190 $/mois (rapporté) ; 20 crédits offerts |
| Drafto | rendus photoréalistes et modèle WebGL en 30 s | non relevé |
| floor-plan.ai | vues 3D en plusieurs styles | non relevé |
| ArchiVinci, REimagineHome, Spacely AI, Paintit.ai | rendus IA | 79 $/mois ; 19-119 $/mois ; 20-80 $/mois ; ? (rapporté) |
| Pedra (Barcelone) | rendus depuis un plan en 2 à 5 min ; visites à partir de photos 360° | 29 €/mois |

### 1.4 Visites du bâti existant (substituts, pas concurrents directs)

Ces outils partent d'un logement construit : caméra, scan ou photos. Ils fixent les attentes sur ce qu'est une « visite ».
- Matterport (racheté par CoStar) ;
- Ogulo (caméra vyu | Cam) ;
- Floorfy (photos 360°) ;
- CubiCasa (scan au téléphone) ;
- Nodalview ;
- Make Plan (LiDAR) ;
- magicplan (repositionné sur la restauration après sinistre) ;
- Giraffe360 ;
- Kuula (hébergement 360°).

### 1.5 Configurateurs TMA et espaces acquéreurs (côté promoteur)

Show You (TWISY, COSY), MyTMA, Happywait, Scoplan, Visiolab « My Showroom », Realiz3D RealDesigner3D, le configurateur Habiteo, et les configurateurs propres de Bouygues Immobilier et de Vinci Immobilier.

Ils couvrent le choix des prestations et les TMA, pas la visite de chaque lot à partir du plan de vente.

---

## 2. Prix relevés

### 2.1 Au plan ou à la visite

| Acteur | Offre | Prix | Délai | Source | Statut |
|---|---|---|---|---|---|
| GetFloorplan | Basic set (2D + 3D) | **25 $** | 24 h | [getfloorplan.com/pricing](https://getfloorplan.com/pricing) | vérifié le 29/09 (page rendue) |
| GetFloorplan | Plus set (+ visite 360°) | **45 $** | 24 h | idem | vérifié le 29/09 |
| GetFloorplan | Pro set (+ marque blanche) | **61 $** | 24 h | idem | vérifié le 29/09 |
| GetFloorplan | Max Render set (+ rendus) | **69 $** | 24 h | idem | vérifié le 29/09 |
| GetFloorplan | Multi Set Pro (3 styles) | **115 $** | 24 h | idem | vérifié le 29/09 |
| GetFloorplan | vue de fenêtre personnalisée | 15 $ | – | texte dans le bundle JS | rapporté |
| GetFloorplan | volume, API | « contact us », non publié | – | idem | non vérifié |
| RoomSketcher | AI Convert, sans abonnement | 20 $ par niveau | secondes | [roomsketcher.com/pricing](https://www.roomsketcher.com/pricing/) | rapporté, et déjà vu le 27/09 |
| RoomSketcher | AI Convert en crédits | 5 crédits, soit environ 10 à 17,50 $ par niveau | – | [roomsketcher.com/credits](https://www.roomsketcher.com/credits/) | rapporté |
| RoomSketcher | plan commandé (humain) | 38 $ par niveau ; dès 18 $ avec abonnement | jour ouvré suivant | [floor-plan-services](https://www.roomsketcher.com/floor-plan-services/) | rapporté |
| Aginera | Floor Plan to 3D | gratuit (5 plans) | minutes | [aginera.ai/tools/floor-plan-to-3d](https://aginera.ai/tools/floor-plan-to-3d) | 5 plans : rapporté ; page vérifiée le 29/09 |
| Aginera | vidéo de visite de 30 s | 19 $ une fois | « about 8 minutes » | idem | vérifié le 29/09 |
| Cavoss | visite interactive à partir du plan | **39 $** | 24 h | [cavoss.com](https://cavoss.com/) | vérifié le 29/09 |
| WalkMyHome | Starter (3 projets) / Lifetime (25 projets) | **47 $ / 67 $ une fois** (« prix fondateurs », barrés 247 $ et 353 $) | 30 s | [walkmyhome.ai](https://walkmyhome.ai/) | vérifié le 29/09 |
| 3D Estate | « Wirtualny Remont » (offre avec Otodom) | 399 zł (1 logement) ; 333 zł (3) ; 279 zł (10) ; 199 zł (25), HT | jusqu'à 10 jours ouvrés | [wirtualnyremont.3destate.pl](https://wirtualnyremont.3destate.pl/) | rapporté |
| Figaro 3D Immo | Pack Privilège (images 3D 4K, plan 3D, visite virtuelle) | **149 € HT** | « quelques jours » | [plan3d.immo](https://plan3d.immo/3d-hd-realite-virtuelle-immobilier/) | vérifié le 29/09 |
| Figaro 3D Immo | Plan 3D HomeByMe | 75 € HT | ? | idem | vérifié le 29/09 |
| HomeByMe | dessin du plan par un expert | dès 14,99 € par étage | 3 jours ouvrables | [TopApps](https://topapps.fr/vie-pratique/homebyme) ; [home.by.me](https://home.by.me/fr/offer/service-dessin-plan/) | prix secondaire ; délai rapporté |
| CubiCasa | LITE / PLUS / PLUS 3D | 0 $ / 15 $ / 65 $ | 24 à 48 h | [cubi.casa/pricing](https://www.cubi.casa/pricing/) | rapporté (scan, pas de plan PDF) |
| Matterport | plan schématique | 14,99 $ par espace | 2 jours ouvrés | [blog Matterport](https://matterport.com/blog/schematic-floor-plans-now-1499-space) | secondaire, non daté |
| BoxBrownie | plan 3D couleur | 28 € | – | [boxbrownie.com/pricing](https://www.boxbrownie.com/pricing) | relevé du 27/09 |
| MachouPichou | images 3D de plan VEFA | 99 à 249 € | ? | [machoupichou.com](https://machoupichou.com/plans-vefa-en-3d/) | rapporté |
| Ma Maison 3D | visite 360° par pièce | dès 80 € HT | ? | [mamaison3d.com/tarifs](https://www.mamaison3d.com/tarifs/) | rapporté, prix « indicatifs » |
| Agence BLEU (architecte) | visuel 3D par vue | 250 à 450 € | ? | [ableu.fr](https://ableu.fr/assistance-vefa-accompagnement-modification-et-conseil-achat-sur-plan-vefa/modification-plan-vefa-tm) | rapporté |
| Fiverr | conversion d'un plan 2D en 3D | dès 10 $, souvent 20 à 30 $ | ~4 h à quelques jours | [exemple](https://www.fiverr.com/floorplanner1/convert-2d-floor-plan-to-3d-floor-plan-in-4-hours-e834) | rapporté |
| 3D Swiss View | visite 3D pour le neuf | dès 2 000 CHF | ? | [3dswissview.ch](https://www.3dswissview.ch/services/visite-virtuelle/visite-virtuelle-3d-immobilier-neuf/) | rapporté |
| VEFA Conseil | analyse des documents VEFA (sans 3D) | 139 € TTC | 72 h | [vefa-conseil.fr](https://www.vefa-conseil.fr/) | confirmé (rapporté) |

### 2.2 Abonnements

| Acteur | Formules | Source | Statut |
|---|---|---|---|
| Planner 5D | Premium 59,99 $/an ou 19,99 $/mois (import de plan inclus) ; Pro 399,99 $/an ou 49,99 $/mois | [planner5d.com/pricing](https://planner5d.com/pricing) | confirmé (rapporté) |
| RoomSketcher | Pro 24 $/mois (12 $ en annuel) ; Team 70 $/mois (35 $ en annuel) | [roomsketcher.com/pricing](https://www.roomsketcher.com/pricing/) | confirmé |
| HomeByMe | Essentials 29 €/mois ou 299 €/an ; Pro 59 €/mois ou 590 €/an | [TopApps, 24/09/2026](https://topapps.fr/vie-pratique/homebyme) | **secondaire** (montants chargés en JS, illisibles) |
| Matterport | Starter 12-14 $/mois ; Professional 58-69 $/mois ; Business 296-355 $/mois | [matterport.com/plans](https://matterport.com/plans) | rapporté |
| Floorfy | Small 19 €/mois (5 visites) ; Medium 59 € (20) ; Large 99 € (50) ; pack avec location de caméra 74 €/mois ; pack annuel avec caméra 999 € | [floorfy.com/prices](https://floorfy.com/prices), [floorfy.com](https://floorfy.com/) | 74 € et 999 € vérifiés le 29/09 ; le reste rapporté |
| Ogulo | Basis 69 €/mois ; Business 129 € ; Premium 189 € (contrat de 24 mois) | [ogulo.com/preise](https://ogulo.com/preise/) | rapporté |
| Pedra | 29 €/mois (100 crédits) ; 239 €/an | [pedra.ai](https://pedra.ai/) | rapporté |
| Coohom | Pro 29 €/mois ; Élite 60 €/poste/mois | [coohom.com](https://www.coohom.com/) | rapporté |
| Homestyler | Pro+ dès 6,27 €/mois ; Master+ dès 10,89 € ; Team 18,37 €/poste | [homestyler.com](https://www.homestyler.com/) | rapporté |
| Vizcraft | Free (2 crédits, sans carte) ; 19 $/mois ; 49 $/mois | [vizcraft.ai/pricing](https://vizcraft.ai/pricing) | vérifié le 29/09 |
| Kuula | Pro 20-24 $/mois ; Business 36-48 $/mois | [kuula.co/page/pricing](https://kuula.co/page/pricing) | rapporté |
| Make Plan | 10 à 50 €/mois | [makeplan.tech](https://www.makeplan.tech/fr) | rapporté |
| ArchiFacile | Plus 37 € à vie ; PRO 84 €/an | [archifacile.net/versions](https://www.archifacile.net/versions) | rapporté |
| magicplan | 25 à 40 $ par projet, minimum 10 projets/mois | [magicplan.app/pricing](https://www.magicplan.app/pricing) | rapporté |

### 2.3 Promoteurs : les rares ordres de grandeur publics

| Acteur | Prix | Date | Source |
|---|---|---|---|
| Habiteo | « 1 130 euros HT par lot » (plan 3D, visite virtuelle…) | 2017 | [ITespresso](https://www.itespresso.fr/habiteo-leve-fonds-vitrine-digitale-promoteurs-immobiliers-176744.html) |
| Habiteo | « 6 500 euros par résidence » (maquette, plans 3D de tous les lots, une visite par typologie) ; abonnement back-office 110 € | 2016 | [JDN](https://www.journaldunet.com/economie/immobilier/1186852-grace-a-la-realite-virtuelle-habiteo-booste-la-vente-d-immobilier-neuf/) |
| 3D Estate | sur démo ; seul prix public : 199 à 399 zł par logement (offre Otodom, voir 2.1) | 2026 | [3dtwin.com/fr](https://3dtwin.com/fr/) |
| Studios (Vizion, VirtualBuilding, Printixel, Imagedoing, Visiolab, Artefacto, Realiz3D) | sur devis | 2026 | fiches § 3 |
| Plan Alive | non publié ; affirme « Coûts ÷30 » | 2026 | [planalive.app](https://planalive.app/) |

**Lecture.**
- Le prix de 15 à 25 € HT par lot prévu pour les promoteurs est **très en dessous** des seuls prix publics français (1 130 € par lot chez Habiteo en 2017, sans mise à jour connue).
- Il reste **sous** GetFloorplan (25 à 69 $) et sous l'offre Otodom de 3D Estate (199 zł, environ 47 € : conversion approximative, non vérifiée).
- Le prix de 29 € pour l'acquéreur se situe entre les outils IA (0 à 67 $) et les services humains (139 à 149 €).

---

## 3. Fiches courtes des concurrents proches

### 3D Estate / 3D Twin (Pologne) : menace n° 1 côté promoteurs
- **Ce qu'il fait.** Applications 3D de vente de programmes neufs : maquette de la résidence, moteur de recherche des lots, et pour chaque logement des plans 3D meublés, une coupe 3D et une visite virtuelle dans les ambiances de finition du promoteur. Le logement peut être changé d'ambiance pendant la visite ([3dtwin.com/fr/plans-3d-et-visites-virtuelles](https://3dtwin.com/fr/plans-3d-et-visites-virtuelles/), vérifié le 29/09).
- **Automatisation prouvée.**
  - « Spacer powstaje z rzutu mieszkania, nie ze zdjęć. » (La visite est construite à partir du plan du logement, pas de photos.)
  - Avec obido.pl, « portal przekazuje plan mieszkania w PDF przez API, a system generuje renderowane widoki 3D i interaktywny spacer w ciągu kilku minut ». (Le portail transmet le plan PDF par API et le système génère des vues 3D et une visite interactive en quelques minutes.)
  - 40 000 visites au lancement en 2018, plus de 200 000 logements depuis.
  - Source : [3destate.pl, étude de cas](https://3destate.pl/case-study/wirtualny-spacer-360), vérifié le 29/09.
- **Taille annoncée.**
  - « Plus de 400 promoteurs et opérateurs… plus de 2 500 programmes en Europe » ([3dtwin.com/fr](https://3dtwin.com/fr/), vérifié).
  - « Ponad 25 % » des logements du marché polonais du neuf ont une visite 3D Estate ([3destate.pl/en](https://3destate.pl/en), vérifié).
  - Références : Acciona, YIT, Greystar (Royaume-Uni).
- **Limites pour nous.** Pas d'offre pour l'acquéreur, prix sur démo, pas de fidélité aux cotes annoncée. La marche libre dans le logement n'est pas vérifiée : le site parle de « spacer 360 » et réserve la caméra libre à la maquette de la résidence. Le domaine 3destate.com est à vendre (190 000 $ chez GoDaddy, vérifié le 29/09).
- **Risque.** Il peut entrer en France à tout moment : le site français est prêt.

### GetFloorplan : le repère de prix
- **Offre.** Plan en DWG, JPG, PNG ou PDF, transformé en 2D, 3D, 360°, rendus et modèle FBX. 25 à 115 $ par plan, en 24 h, « AI speed with human review », remboursement si le client n'est pas satisfait (voir § 2.1).
- **Limites.** Délai de 24 h. Aucun avis client ni aucune démo ne montre de marche libre. Origine probablement russe : le code référence hart-estate.ru. Non vérifié au-delà du code.
- **Signal.** Un avis client affiché sur la page d'accueil demande « the result faster without the human factor » (rapporté). La demande de vitesse existe.

### Aginera : la technologie la plus proche, pas un produit immobilier
- **Offre.** Plan PDF, scan ou croquis transformé en 3D interactive : dollhouse, puis visite « from standing height ». Surfaces par pièce, lien public, comparaison plan / rendu au curseur, rendus par pièce, vidéo à 19 $ ([aginera.ai](https://aginera.ai/tools/floor-plan-to-3d), vérifié le 29/09).
- **Modèle.** L'éditeur (Kamna Ventures, Californie) vend du métré de chantier. L'outil 3D sert à attirer des clients : il est gratuit.
- **Point clé.**
  - Sa FAQ pose la question « Our listing renders never quite match the actual floor plan we sell against — is there a tool that fixes that? ». Le besoin de fidélité est donc identifié.
  - Mais sa mention légale dit « may not accurately represent the underlying plans ».

### Cavoss Floor Plan Studio (Royaume-Uni / Dubaï) : même promesse commerciale
- **Accroche.** « Interactive property tours from floor plans. $39 flat. 24-hour delivery. » Une page dédiée à la vente sur plan à Dubaï : « Sell to buyers who can't visit. »
- **Contenu.** Plan cliquable avec une vidéo par pièce, simulation de l'ensoleillement, score du quartier, trajets domicile-travail. Pas de 3D libre ([cavoss.com](https://cavoss.com/), vérifié le 29/09).

### WalkMyHome : concurrent de l'offre particulier
- **Offre.** Plan importé (photo ou PDF) ou généré par IA, 3D meublée visitable en 30 s.
- **Arguments.** « True 1:1 Scale », « Measurements kept », 47 $ ou 67 $ en paiement unique, remboursement sous 30 jours.
- **Cible.** Particuliers qui font construire, pas d'acheteurs VEFA ([walkmyhome.ai](https://walkmyhome.ai/), vérifié le 29/09).
- **Preuve affichée.** « 1,694 happy users », « 4.9/5 », « 118+ reviews ».

### RoomSketcher et Planner 5D : les substituts en libre-service
- **RoomSketcher.**
  - AI Convert : 20 $ par niveau, fonction encore en bêta. Il faut caler l'échelle à la main et les croquis ne sont pas acceptés.
  - Ensuite : Live 3D (visite 3D navigable) et vues 360°.
  - Service de redessin humain en J+1.
  - Revendique « 10M+ » utilisateurs ([roomsketcher.com](https://www.roomsketcher.com/), vérifié).
- **Planner 5D.**
  - La reconnaissance de plan prend « between 10 minutes and 24 hours ».
  - L'éditeur prévient : « Without [dimensions], we cannot reproduce the plan while maintaining the desired dimensions ». Il faut corriger à la main ([support Planner 5D](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan), rapporté).

### Plan Alive (Hubvisory, France) : entrant IA côté promoteurs
- **Accroche.** H1 « Du plan technique au coup de cœur. », puis « Rendus photoréalistes. Coûts ÷30. Temps réel. »
- **Arguments.** « Seul votre plan 2D suffit », charte graphique du client appliquée, API et connecteurs PIM/CRM, « IA Créative, Supervision Ciblée » ([planalive.app](https://planalive.app/), vérifié le 29/09).
- **Limites.** Surtout des images fixes. Aucune démo de visite, aucun prix, aucune offre pour l'acquéreur.

### Habiteo / Bien'ici : le leader établi chez les promoteurs
- **Chiffres.** « 1500+ programmes », « 26 000+ lots », « 400+ promoteurs ».
- **Offre.** Packs Light « par lot », Essentiel et Premium. Chef de projet dédié. Filiale de Bien'ici depuis 2022 ([habiteo.com](https://www.habiteo.com/), [Bien'ici](https://corporate.bienici.com/actualites/press-details/bienici-rachete-habiteo-leader-francais-de-la-3d-dans-limmobilier)).
- **Évolution.** Aucune IA annoncée. Nouveauté : myHabiteo Studio, des captures en haute définition tirées des visites existantes.
- **Force.** La diffusion sur Bien'ici.

### Kaufman & Broad : un promoteur qui fait déjà de l'IA par lot
- Nouveau site (10/04/2026) : « Chaque lot est également associé à une galerie d'images dédiée, produite à partir de visuels générés par IA ». Plan 2D par lot et maquettes 3D interactives. Prestataire non nommé ([FrenchWeb](https://www.frenchweb.fr/du-programme-au-logement-la-nouvelle-vitrine-digitale-de-kaufman-broad/461238), vérifié le 29/09).
- C'est un client possible en marque blanche, ou une preuve que les promoteurs internalisent.

### Figaro 3D Immo (groupe Figaro)
- **Offres.** Pack Privilège à 149 € HT, à partir d'une photo et d'un plan 2D : images 3D 4K, plan axonométrique, plan 3D vu de dessus, visite virtuelle, lien vers un configurateur. Livré en « quelques jours ». Plan 3D HomeByMe à 75 € HT ([plan3d.immo](https://plan3d.immo/3d-hd-realite-virtuelle-immobilier/), vérifié).
- **Promoteurs.** Maquettes orbitales et lots en 3D via HomeByMe, sur devis ([plan3d.immo/promoteurs-immobiliers](https://plan3d.immo/promoteurs-immobiliers/)).

### Outils des grands promoteurs (rapporté, sources dans § 7)
| Promoteur | Outil | Détail |
|---|---|---|
| Nexity | « Inside », depuis 12/2020 | 3D temps réel, « 100 % de l'offre en accession », personnalisation après réservation. Prestataire : Realiz3D. Toujours actif en 2026 : non vérifié |
| Cogedim | « CogeHome 3D » | Plan 3D et visite « avec ou sans mobilier », « vue extérieure réelle à travers chaque fenêtre », personnalisation pièce par pièce. Prestataire non indiqué |
| Bouygues Immobilier | Configurateur 3D (03/2025) | Cloisons et cuisine modifiables avec chiffrage, « visite immersive "on-foot" » ; 452 logements dans 29 résidences ; objectif 50 % des programmes fin 2025 ; fait en interne à partir du BIM |
| Vinci Immobilier | Configurateur (2018) | Ambiances de finition |
| Eiffage, Emerige | Réalité virtuelle | Visites ponctuelles |
| Icade | – | Maquettes 3D des résidences, mais aucun outil 3D du logement décrit |

**Lecture.** Les grands promoteurs ont leurs outils pour **leurs** lots, faits à partir de leur BIM ou par un studio. Les promoteurs moyens et les commercialisateurs multi-promoteurs n'en ont pas. L'acquéreur ne peut pas en commander.

### Rhinov Pro : à surveiller
- La « Visite Virtuelle 3D » à partir d'un plan et de photos, avec 360° par pièce et plan 3D, est annoncée « Bientôt disponible ! » ([rhinov.pro](https://www.rhinov.pro/fr/nos-offres), rapporté).

### Floorfy : signal d'entrée en France (outil photo, pas plan)
- A racheté Realisti.co (Italie) en septembre 2025. Son PDG désigne **la France comme prochain grand marché** ([OnlineMarketplaces](https://www.onlinemarketplaces.com/articles/floorfy-acquires-realisti-co/), rapporté).
- Visites faites à partir de photos 360°. Pas de fonction plan → 3D.

---

## 4. Wording : titres, slogans et clichés

### 4.1 Titres (H1) et accroches, en langue d'origine

| Acteur | H1 | Sous-titre / slogan | Prix d'appel | Statut |
|---|---|---|---|---|
| 3D Twin (FR) | « Vendez ou louez chaque logement sur plan, avant la fin du chantier. » | « Disponibilités en temps réel, plans 3D et visite virtuelle de chaque logement. Sur votre site web et dans votre bureau de vente, synchronisés avec votre CRM. » | aucun (« Demander une démo ») | vérifié le 29/09 |
| 3D Estate (EN) | « Interactive 3D applications for residential real estate » | « The largest global supplier of 3D applications & materials for sales and marketing of residential projects » | aucun | vérifié |
| GetFloorplan | « Convert floorplan to 3D, renders, 360 tours » | « Profi Getfloorplan AI to create accurate visuals for property in one day* » / « *NO need skills » | « A whole bundle of visuals for $25 » | vérifié |
| Aginera | « Floor Plan PDF to Interactive 3D » | « Upload a floor plan — a PDF, a scan, or a photo of a hand sketch. AI detects rooms, walls, doors and windows, then builds an interactive 3D model you can explore. » | gratuit | vérifié |
| Cavoss | « Buyers who've already explored the property don't waste your Saturdays. » | « Delivered as a hosted link in 24 hours. $39 per property » | 39 $ | vérifié |
| WalkMyHome | « [Import / Create / Generate…] Floor Plans In 30 Seconds Then Walk in 3D » | « …before you spend a cent building it. » / « Change it here, not on site. » | 47 $ une fois, « 81% OFF » | vérifié |
| RoomSketcher | « Professional Floor Plans in Minutes » | « Accurate, editable floor plans and polished visuals, powered by AI. » | gratuit, puis 12 $/mois | vérifié |
| Planner 5D | « Design your dream home » | « Draw a floor plan and create a 3D home design in 10 minutes… realistic 4K renders. » | gratuit | vérifié |
| HomeByMe | « Créez la maison de vos rêves à partir de vos plans maison 3D » | « Dessinez en 2D, aménagez en 3D et visualisez en 4K avec HomeByMe, logiciel gratuit de plans 3D. » | gratuit | vérifié |
| Plan Alive | « Du plan technique au coup de cœur. » | « Vision par ordinateur & IA Générative fusionnées. Rendus photoréalistes. Coûts ÷30. Temps réel. » | aucun | vérifié |
| Habiteo | « Créez une expérience client 100% digitale / Projetez vos clients dans le logement » (carrousel) | « Plans 3D, visites virtuelle, vues réelles » | aucun | rapporté |
| Vizion Studio | « Commercialisez vos programmes avant même leur construction » | « Première image sous 72 h » | devis | rapporté |
| VirtualBuilding | « AGENCE 3D POUR L'IMMOBILIER » | « VirtualBuilding, créateur de désirs immobiliers » | devis | rapporté |
| Realiz3D | « L'innovation 3D au service de l'immobilier » | – | devis | rapporté |
| VEFA Conseil | « Sécurisez votre achat sur plan, avec un expert VEFA » | « Votre achat en VEFA, sécurisé, optimisé et sans surprise ! » | 139 € TTC | rapporté |
| Floorfy | « Sell more properties with Artificial Intelligence » (ES : « Vende más inmuebles con Inteligencia Artificial ») | « Create 3D tours, floor plans and videos. Publish listings that stand out and close sales faster. » | « 14 days free · Cancel anytime » | vérifié |
| Ogulo | « ALL-IN-ONE Lösung für eine zeitgemäße Immobilienvermarktung » | « 14 Tage unverbindlich testen » | essai | vérifié |
| Cedreo | « La solution tout-en-un de la conception à l'exécution » | « Le logiciel de conception de maisons pour les professionnels de la construction et de la rénovation. » | démo | vérifié |
| Vizcraft | « Floor plan in. 3D isometric out. » | « …in about ten seconds. No 3D modeling, no render farm, nothing to install. » | gratuit, sans carte | vérifié |
| Rendair | « Convert floor plans into 3D photorealistic renders instantly » | – | 20 crédits offerts | vérifié |

### 4.2 Les clichés qui reviennent partout (à éviter ou à retourner)

- **La vitesse vague** : « instantly », « in minutes », « in seconds », « Temps réel ». Tout le monde le dit. Seuls ceux qui **chiffrent** se distinguent (« 30 sec », « about ten seconds », « 24 hours », « 72 h »).
- **« AI » et « IA générative »** comme argument en soi : Floorfy, Plan Alive, RoomSketcher, Planner 5D, GetFloorplan.
- **Le rêve et la décoration** : « dream home », « maison de vos rêves », « coup de cœur », « créateur de désirs », « stunning », « photorealistic 4K ».
- **« All-in-one » / « tout-en-un »** : Ogulo, Cedreo, Floorfy.
- **« Immersive », « 100 % digital », « se projeter », « projetez vos clients »** : tout le secteur français des promoteurs.
- **« No skills needed » / « sans compétence »** : GetFloorplan, Rendair, WalkMyHome.
- **« Stand out » / « se démarquer »** : ces discours visent l'agent qui publie une annonce.

### 4.3 Ce qui manque partout (angle libre)

1. **La preuve de fidélité.**
   - Seul WalkMyHome dit « True 1:1 Scale ». GetFloorplan dit « accurate » sans chiffre.
   - Aginera et Planner 5D préviennent au contraire que le résultat peut s'écarter du plan.
   - Personne ne montre un **écart mesuré** entre la visite et les cotes du plan, ni une **comparaison des surfaces** avec le tableau du promoteur.
2. **L'acquéreur comme destinataire.**
   - Tous parlent à l'agent (« sell faster »), au promoteur (« commercialisez ») ou au particulier qui décore (« dream home »).
   - Personne ne dit « vous avez signé (ou allez signer) sur plan, voici votre logement ».
   - VEFA Conseil parle à l'acquéreur, mais sans image.
3. **Le calendrier de la VEFA** : rétractation de 10 jours, choix des TMA, visite cloisons, livraison. Aucun concurrent ne s'y cale.
4. **Le logement vide, honnête**, face aux rendus meublés et stylisés. Cela peut devenir un argument (« votre logement tel qu'il sera livré, sans décor trompeur »), à condition d'assumer l'absence de mobilier.
5. **Le « plan de vente »** comme document d'entrée, nommé par son nom : aucun concurrent n'utilise ce terme dans son titre.
6. **« Tous les lots, pas quelques lots types »** pour les promoteurs. Seul 3D Estate le dit (« chaque logement »), et en français.

---

## 4 bis. Héros et structure des pages

Relevé le 29/09/2026 sur les pages rendues (r.jina.ai). Les visuels ont été regardés en téléchargeant les images du héros. Je n'ai aucune donnée de conversion : les « déclencheurs » ci-dessous sont des mécaniques observées, pas des résultats mesurés.

### 4 bis.1 Relevé par page

| Page | Visuel du héros | Titre | Bouton principal | Preuve juste sous le héros | Ordre des sections | Prix d'appel |
|---|---|---|---|---|---|---|
| **GetFloorplan** ([accueil](https://getfloorplan.com/)) | **Avant → après statique** : plans .jpg/.png et .dwg/.pdf posés sur une photo d'intérieur, flèche vers un plan 3D meublé | « Convert floorplan to 3D, renders, 360 tours » | « Place an order » (en-tête), « See results » | cibles (promoteurs « reduce deal time 30% », agences « reduce production costs on 70% ») | segments de clients → « What does AI create » (5 livrables en vignettes) → 3 étapes (« Upload… in 1 minute / Do nothing / Get visuals ») → grande galerie par projet → **configurateur de styles et de vues de fenêtre** → « Why trusted » (25 $, 24 h, 24/7, remboursement) → avis Trustpilot | « A whole bundle of visuals for $25 » |
| **RoomSketcher** ([accueil](https://www.roomsketcher.com/)) | illustration : mascotte qui tient un plan, avec une **vidéo** | « Professional Floor Plans in Minutes » | « Get Started for Free » | **4 notes** : Trustpilot 4.4, Google 4.4, G2 4.5, Capterra 4.4 | étape 1 « Create » (« Already have a floor plan? Convert it in seconds » ou dessin) → étape 2 « Edit » → étape 3 « Generate Polished Visuals » (2D, 3D, branding, Live 3D, 360) → avis → « Get Started for Free… **No credit card required** » → logos (RE/MAX, Keller Williams) → 3 raisons → chiffres (10M+, 170+ pays, 20 ans) → FAQ | gratuit |
| **Planner 5D** ([accueil](https://planner5d.com/)) | grille de 8 cartes (AI Studio, plan, pièce, maison, déco…) | « Design your dream home » | « Get Started » | « 100M+ homeowners and pros… 540M homes » + logos presse (NYT, Business Insider) | import ou dessin du plan (**vidéo**) → meubler (vidéo) → rendus 4K (vidéo) → IA (vidéo) → avis (4,4, 645 avis G2/Capterra) → fonctions | gratuit |
| **HomeByMe** ([accueil](https://home.by.me/fr/)) | **photo de style de vie** (couple devant un ordinateur, cartons de déménagement) + galerie de la communauté | « Créez la maison de vos rêves à partir de vos plans maison 3D » | « Inscrivez-vous gratuitement ! » | aucune preuve chiffrée | nouveautés (vidéo, articles) → rendus de la communauté → « Concevez votre plan » → meubler (marques) → images 4K → partager → application mobile → MOOC déco → guides | gratuit |
| **3D Twin / 3D Estate** ([FR](https://3dtwin.com/fr/)) | maquette de téléphone et captures de l'application (plan de masse interactif, visite) | « Vendez ou louez chaque logement sur plan, avant la fin du chantier. » | « Demander une démo » | « Plus de 400 promoteurs… 2 500 programmes » | 3 canaux (site, bureau de vente, chaque logement) → étude de cas Greenford Quay → témoignages de promoteurs (Acciona, YIT, Greystar : « taux de conversion en ligne 3 fois plus élevés ») → forfaits CORE / COMFORT / ELITE sans prix | aucun |
| **Ogulo** ([accueil](https://www.ogulo.com/)) | visuel de logiciel + icônes des 6 fonctions | « ALL-IN-ONE Lösung… » | « 14 Tage unverbindlich testen » | aucune | une section par fonction (surface, plan, photos, dollhouse, prix, mot de passe) → vidéo du PDG → fonctions | essai de 14 jours |
| **Floorfy** ([accueil](https://floorfy.com/)) | **vidéo en boucle de la visite 360°** d'un intérieur réel | « Sell more properties with Artificial Intelligence » | « Start for free » + « Book a demo » ; « **14 days free · Cancel anytime** » | « +20K Real estate agents », « +1M Virtual properties », logos (Blackstone, RE/MAX, Century 21) | « All property marketing in 15 minutes » (**démo animée** : « Analyzing images… Writing descriptives… ») → 4 chiffres (« +3x visits », « +47% CTR » selon idealista) → une vidéo par fonction → packs avec caméra (**74 €/mois**, 999 €/an) → appel vidéo → témoignage | 74 €/mois (pack) |
| **Cedreo** ([FR](https://cedreo.com/fr/)) | 2 images : rendu 3D de façade (effet IA « fin de journée ») + plan de façade | « La solution tout-en-un de la conception à l'exécution » | « Demander une démo » | **3 chiffres** : « 2 h » pour dessiner et chiffrer, « 60 % » d'économies, « x2 » plus vite | bénéfices (coûts, marge, process) → 4 onglets (plans, 3D, permis, chiffrage « en moins de 10 min ») → métiers | aucun |
| **Kazaplan / Leroy Merlin** | non relevé (403 et CAPTCHA) | – | – | – | – | gratuit, 5 rendus HD par jour ([Tapis Beige](https://tapis-beige.fr/blogs/infos/kazaplan-2026-le-guide-ultime-du-logiciel-plan-maison-3d-gratuit-ex-kozikaza), secondaire) |
| **Aginera** ([outil](https://aginera.ai/tools/floor-plan-to-3d)) | **démo interactive dans le héros** : exemples de plans cliquables, **curseur « drag to compare » plan ↔ rendu**, onglets « 3D Model / AI Rendering / Walkthrough / Source PDF », compteurs (pièces, portes, surface), « Scene Confidence: 95% » | « Floor Plan PDF to Interactive 3D » | « Upload plan » (4 étapes affichées) | le résultat lui-même : surfaces, objets détectés et leurs dimensions | galerie par pièce → tableau des objets → « Keep this plan in a project » (compte gratuit) → FAQ (dont la fidélité) → vidéo à 19 $ → autres outils | gratuit ; 19 $ |
| **Vizcraft** ([accueil](https://vizcraft.ai/)) | **« In » / « Out » côte à côte** (plan puis isométrique 3D) + **chronomètre animé de 0 à 10 s** | « Floor plan in. 3D isometric out. » | « Try your plan free » + « See pricing » | mention honnête : « Selected example… Results vary with the floor plan you upload » | « One plan. One credit. About ten seconds. » (3 étapes) → **tableau contre un rendu traditionnel** (délai, prérequis, coût « From $0.40 ») → staging photo avec **curseur avant / après** | gratuit (2 crédits, sans carte) ; dès 0,40 $ l'image |
| **WalkMyHome** ([accueil](https://walkmyhome.ai/)) | **vidéo du héros** (plan → 3D → marche) | « …Floor Plans In 30 Seconds Then Walk in 3D » | « Start Now » ; bandeau « Founders Special Offer • 81% OFF » | **rangée de réassurance** : « One Time Payment », « 30-day money-back », « No Skills Needed », « True 1:1 Scale » ; puis « 1,694 happy users », « 4.9/5 », « 118+ reviews », « 190+ countries », « 30 sec first 3D plan » | **section douleur** (« The most expensive room is the one you see too late » : le mur coulé, la chambre sans lumière, « The $40k you cannot claw back ») → « No subscriptions, No manual redrawing, No waiting » → offres **47 $ / 67 $ une fois** (barrés 247 $ / 353 $) | 47 $ une fois |
| **Cavoss** ([accueil](https://cavoss.com/)) | pas de visuel dominant relevé ; texte + **2 boutons dont un avec le prix** | « Buyers who've already explored the property don't waste your Saturdays. » | « **Order your tour — $39** » + « See a live demo → » | statistique attribuée à la NAR (« sell up to 31% faster… 60% more online views ») + « Works with Rightmove · Zoopla · Bayut · Property Finder · WhatsApp » | 4 contenus de la visite → 3 étapes → livraison du lien en 24 h → autres produits → FAQ | 39 $ |
| **Rendair** ([outil](https://rendair.ai/tools/floorplan-to-render)) | **avant / après** (images « Before » et « After » ; curseur probable, non vérifié) | « Convert floor plans into 3D photorealistic renders instantly » | « Convert Floor Plans » | logos « Trusted By » | étapes « Upload / Generate / Download / Ready! » → « Join 300,000+ satisfied creators » + avis | 20 crédits gratuits |
| **Drafto** ([outil](https://www.getdrafto.com/ai-floor-plan-to-render)) | non relevé (page rendue en texte) | « AI Floor Plan to Render – Convert Floor Plans into Realistic Renders Instantly » | « Upload your plan » + « View Examples » | « in 30 seconds » | long texte pour le référencement (6 étapes, entrées, sorties) | non relevé |

### 4 bis.2 Ce qui déclenche l'envie de payer (observé)

1. **L'avant → après dès le premier écran, avec un vrai plan en entrée.** GetFloorplan (collage plan → 3D avec flèche), Vizcraft (« In / Out »), Rendair (Before / After), Aginera (curseur plan ↔ rendu). L'utilisateur voit **son** problème (un plan illisible) résolu avant de lire quoi que ce soit.
2. **Un délai chiffré, et même mis en scène.** Vizcraft anime un chronomètre de 0 à 10 s. WalkMyHome écrit « 30 sec first 3D plan ». Cavoss et GetFloorplan disent « 24 hours ». Floorfy dit « in 15 minutes » et joue une fausse analyse en direct (« Analyzing images… »).
3. **Un prix visible et bas, souvent dans le bouton lui-même.** « Order your tour — $39 » (Cavoss), « A whole bundle of visuals for $25 » (GetFloorplan), « $47 once » (WalkMyHome), « From $0.40 » (Vizcraft). À l'opposé, les acteurs promoteurs (3D Twin, Habiteo, Cedreo) ne donnent aucun prix et demandent une démo.
4. **Un essai sans risque.**
   - Gratuit sans carte : RoomSketcher (« No credit card required »), Vizcraft (« No credit card »), Aginera (gratuit), Floorfy (« 14 days free · Cancel anytime »).
   - Remboursement : GetFloorplan (« Moneyback »), WalkMyHome (« 30-day money-back »).
   - Paiement unique : WalkMyHome (« No subscriptions »).
5. **Une démo à essayer sans compte.** Aginera (le héros **est** la démo), Cavoss (« See a live demo → »), 3D Estate (visites d'exemple), Ogulo (« Mustertour anschauen »).
6. **Une preuve chiffrée juste sous le héros.** RoomSketcher (4 notes d'avis), Floorfy (+20K agents, +1M logements), WalkMyHome (4,9/5, 118 avis), 3D Twin (400 promoteurs), Cedreo (2 h, 60 %, x2).
7. **La douleur avant la solution** (WalkMyHome : « The most expensive room is the one you see too late » ; Cavoss : « don't waste your Saturdays »). C'est la seule approche qui ne parle pas d'IA.
8. **Une honnêteté qui rassure.** Vizcraft : « Results vary with the floor plan you upload » et « Path-traced renderers still win for final hero shots ». Aginera affiche un score de confiance de la scène.

**Contre-exemples** (pages de type « catalogue », sans déclencheur immédiat) :
- HomeByMe : photo de style de vie, nouveautés et magazine. Aucun avant / après, aucun chiffre.
- Planner 5D : grille de cartes.
- Ogulo : liste de fonctions.
- Cedreo et 3D Twin : démo commerciale obligatoire, ce qui est normal en B2B.

### 4 bis.3 Conséquences pour notre héros (recommandation, pas un fait)

- **Visuel.** Un **vrai plan de vente de promoteur** (anonymisé) à gauche, la **visite 3D qui tourne** à droite, avec un curseur plan ↔ vue du dessus. Mieux encore : la visite d'exemple **jouable dans le héros**, sans compte, comme Aginera.
- **Titre.** Il parle à l'acquéreur et nomme le document : « plan de vente », « avant la livraison ». Pas de « rêve », pas d'« IA » dans le titre.
- **Délai mis en scène.** « Environ 10 minutes », avec la progression réelle des étapes (lecture du plan, contrôle des cotes, 3D, visite).
- **Prix dans le bouton.** « Voir mon logement — 29 € » ; en second bouton, « Essayer avec un plan d'exemple ». Rappeler « 1er plan offert, sans carte » si c'est le cas.
- **Preuve sous le héros.** Pas d'avis au lancement, mais une **preuve de fidélité mesurée** : l'écart constaté entre la visite et les cotes du plan (chiffre à publier à partir de nos contrôles, non encore sourcé ici), et la fiche des surfaces comparée au tableau du promoteur.
- **Ordre proposé.**
  1. Héros : avant / après et démo.
  2. Douleur : « signer pour un logement qu'on n'a jamais vu ».
  3. Ce que vous recevez : les 6 livrables en vignettes.
  4. Fidélité vérifiée.
  5. Moments de la VEFA : rétractation, TMA, cloisons.
  6. Prix.
  7. Pros (conseillers, promoteurs).
  8. FAQ.

---

## 5. Signaux de marché 2024-2026

Rapporté par un agent de recherche. **[v]** = page source ouverte par l'agent, **[e]** = extrait de moteur de recherche seulement.

### 5.1 Rachats, introductions en bourse, levées

| Date | Événement | Source |
|---|---|---|
| 28/02/2025 | CoStar finalise le rachat de **Matterport** (environ 1,6 Md$) [v] | [CoStar](https://investors.costargroup.com/news-releases/news-release-details/costar-group-completes-acquisition-matterport-ushering-new-era) |
| 10/2025 → 05/2026 | **Zillow retire les visites Matterport** de Zillow et StreetEasy, à cause des conditions de CoStar [v] | [HousingWire, 27/05/2026](https://www.housingwire.com/articles/zillow-matterport-3d-tours/) |
| 07/10/2024 | Zillow rachète **Virtual Staging AI** [e] | [Zillow](https://www.zillow.com/news/zillow-group-acquires-ai-company-offering-virtual-staging/) |
| 10/2025 | REA Group prend 61,5 % de **Planitar (iGUIDE)**, présent sur 25 % des ventes au Canada [e] | [iGUIDE](https://goiguide.com/news/rea-group-to-acquire-leading-3d-tour-and-interactive-floor-plan-technology-iguide) |
| 09/2025 | **Floorfy** rachète Realisti.co (Italie) ; son PDG vise **la France** comme prochain grand marché [v] | [OnlineMarketplaces](https://www.onlinemarketplaces.com/articles/floorfy-acquires-realisti-co/) |
| 17/04/2026 | **Manycore (Coohom / Kujiale)** entre en bourse à Hong Kong : environ 1,22 Md HKD levés, +144 % le premier jour, 820 M RMB de chiffre d'affaires 2025 [v] | [PR Newswire Asia](https://en.prnasia.com/releases/global/manycore-tech-debuts-on-hkex-as-the-world-s-first-spatial-intelligence-company-529481.shtml), [SCMP](https://www.scmp.com/business/banking-finance/article/3350387/manycore-one-hangzhous-six-little-dragons-surges-hong-kong-ipo-debut) |
| 30/06/2026 | **Higharc** lève 95 M$ en série C ; son « AutoTranslate » convertit des **images de plans 2D en modèles 3D** pour les constructeurs [v] | [TechTimes](https://www.techtimes.com/articles/319480/20260701/homebuilding-ai-raises-95m-floor-plan-vision-tech-moves-lumber-supply-chain.htm) |
| 22/04/2026 | **Collov Labs** lève 23 M$ en série A (staging IA) [v] | [raising.fi](https://raising.fi/news/collov-labs-series-a-april-2026) |
| 26/03/2026 | **Giraffe360** lève 10 M$ en série B [v] | [Vestbee](https://www.vestbee.com/insights/articles/giraffe360-secures-10-m) |
| 29/05/2026 | **Drafted** lève 16 M$ en amorçage : plans et 3D générés à partir de texte (montant exact non vérifié : 16 ou 17,5 M$) [v] | [The SaaS News](https://www.thesaasnews.com/news/drafted-raises-16m-seed) |
| 09/2026 | **Rayon** (Paris) lève 10 M€ en série A : dessin pour architectes d'intérieur, vectorise déjà les plans scannés, **lance la 3D** [e] | [EU-Startups](https://www.eu-startups.com/2026/09/paris-based-rayon-raises-e10-million-to-build-the-drawing-layer-for-interior-designs-ai-era) |
| 06/05/2026 | **Davis** (Paris) lève 4,6 M€ en pré-amorçage : génération de plans, service aux promoteurs [e] | [BeBeez](https://bebeez.eu/2026/05/06/french-ai-real-estate-startup-davis-raises-e4-6-million-and-unveils-gaudi-1-for-automated-architectural-generation/) |
| 29/10/2025 | **Maket** lève 3,4 M$ CAD en amorçage [v] | [BetaKit](https://betakit.com/maket-secures-3-4-million-to-make-floor-planning-quicker-with-ai/) |
| 07/2025 | **Spacely AI** lève 1 M$ en amorçage [e] | [AI Insider](https://theaiinsider.tech/2025/07/23/spacely-ai-secures-1m-seed-round-to-supercharge-generative-ai-design-for-architects-worldwide/) |
| 01/2026 | **Nucleus4D** lève 1,5 M$ en pré-amorçage : visites par Gaussian splatting [e] | [GamesBeat](https://gamesbeat.com/spatial-computing-startup-nucleus4d-announces-1-5-million-pre-seed-round-to-fund-its-goal-of-digitizing-the-world/) |
| 14/04/2026 | **GetFloorplan** annonce « AI Getfloorplan 2.0 — 4K » dans les actualités de sa page d'accueil | [getfloorplan.com](https://getfloorplan.com/) (rapporté) |
| 04/2026 | **Kaufman & Broad** : galerie d'images générées par IA pour chaque lot | [FrenchWeb](https://www.frenchweb.fr/du-programme-au-logement-la-nouvelle-vitrine-digitale-de-kaufman-broad/461238) (vérifié) |
| 03/2025 | **Bouygues Immobilier** : configurateur 3D avec visite « on-foot » | [Bouygues Immobilier](https://www.bouygues-immobilier-corporate.com/newsroom/bouygues-immobilier-continue-dameliorer-lexperience-de-ses-clients-grace-un-configurateur) (rapporté) |
| 22/04/2025 | **Kozikaza ferme** et devient Kazaplan (Leroy Merlin), gratuit | [chantieraccess.fr](https://chantieraccess.fr/kozikaza/) (secondaire) |

Aucune levée connue en 2024-2026 pour GetFloorplan, Ogulo, 3D Estate, REimagineHome, Rendair ou Habiteo. Aucune fermeture notable trouvée.

**Lecture.**
- L'argent va aux **plans générés par IA** (Higharc, Drafted, Maket, Davis, Rayon) et au **staging** (Collov, VSAI).
- **Aucune levée identifiée ne vise « plan de vente → visite pour l'acheteur sur plan »**. Le créneau n'est pas financé, ou il est occupé en silence par 3D Estate.
- Deux acteurs parisiens (Rayon, Davis) touchent la lecture et la génération de plans : partenaires ou concurrents possibles.

### 5.2 La vente sur plan hors de France

| Pays | Chiffres clés | Source |
|---|---|---|
| **Dubaï** | S1 2026 : 87 800 transactions pour 291,7 Md AED, **71 % sur plan** en volume [v]. En 2025, la part sur plan varie de 65 % (betterhomes, en volume) à 79 % (Allsopp & Allsopp) selon la méthode | [Zawya / Provident](https://www.zawya.com/en/press-release/research-studies/dubai-records-aed-291.7bln-in-real-estate-transactions-in-h1-2026-as-off-plan-captures-71-of-deals-394574), [Allsopp & Allsopp](https://www.allsoppandallsopp.com/dubai/about-us/news-videos/1689-off-plan-dominates-as-dubai-records-aed-5415-billion-in-property-transactions-in-2025), [Arabian Business](https://www.arabianbusiness.com/industries/real-estate/dubai-off-plan-homes-dominate-property-market-with-record-65-of-transactions) |
| **Royaume-Uni** (Angleterre et Pays de Galles) | **33 % des logements neufs vendus sur plan en 2025**, plus bas depuis 2013 ; pic de 49 % il y a dix ans (Hamptons) [v] | [The Negotiator](https://thenegotiator.co.uk/news/land-new-homes/off-plan-sales-hit-12-year-low-as-government-warned-it-could-miss-building-target/) |
| **Espagne** | INE 2025 : 155 910 ventes de logements neufs sur 714 237 (21,6 %) [v]. Pas de statistique « sobre plano » trouvée | [Clikalia](https://blog.clikalia.com/noticias/la-compraventa-de-viviendas-en-2025-supera-las-700-000-operaciones/) |
| **Portugal** | INE 2025 : 33 567 logements neufs vendus sur 169 812 [v]. Idealista.pt : 61 % des programmes neufs dont la date de livraison est connue sont encore en construction ; les biens sur plan reçoivent plus de contacts [e] | [Jornal Económico](https://jornaleconomico.sapo.pt/noticias/vendas-de-casas-com-valor-recorde-de-412-mil-milhoes-em-2025/), [idealista.pt](https://www.idealista.pt/news/imobiliario/habitacao/2026/06/18/75925-procura-por-casas-em-planta-ja-supera-interesse-por-imoveis-concluidos) |
| **Pologne** | Fin 2025 : 123 800 logements en offre, dont 31 % achevés, donc environ 69 % encore en chantier (déduction) [v]. JLL T4 2025 : 11 600 ventes sur les 7 plus grands marchés [v] | [BIG DATA RynekPierwotny](https://bigdata.rynekpierwotny.pl/biuro-prasowe/informacje-prasowe/tysiace-gotowych-mieszkan-deweloperskich-do-wziecia-od-reki-czy-to-dobry-moment-na-zakup-41118/), [JLL](https://www.jll.com/pl-pl/insights/residential-market-in-poland) |

**Lecture.**
- **Dubaï est le plus gros marché de la vente sur plan**, avec des acheteurs souvent à distance. Cavoss et PropVR y sont déjà.
- **La Pologne est déjà servie par 3D Estate** (25 % des logements neufs).
- **L'Espagne et le Portugal** n'ont pas encore d'acteur « plan → visite » identifié, mais Floorfy (photos) et Pedra (Barcelone) y sont implantés.

### 5.3 Effet des visites sur les ventes (données d'éditeurs, à citer avec prudence)

- **Zillow Showcase (2024)** : environ 2 % de prix en plus, +20 % de chances d'avoir une offre acceptée sous 14 jours, +75 % de vues [v] ([PR Newswire](https://www.prnewswire.com/news-releases/showcase-listings-on-zillow-are-more-than-just-cutting-edge--featured-homes-sell-faster-and-for-more-money-302117486.html)).
- **Zillow 3D Home (2020-2021)** : vente 14 % plus rapide [e] ([Zillow](https://www.zillow.com/research/3d-tours-virtual-tools-popular-29650/)).
- **3D Estate** cite une étude JLL : un logement présenté en 3D est jugé attrayant « deux fois plus souvent ». Otodom et Murapol mesurent **60 % de temps en plus** passé sur les sites avec visite ([3destate.pl/en](https://3destate.pl/en), affirmations de l'éditeur, non vérifiées à la source).

---

## 6. Non vérifié

**Fonctions non vérifiées**
- **3D Estate** :
  - la visite est-elle une marche libre ou du saut entre panoramas 360° ?
  - existe-t-il une marque blanche ?
  - quels sont les prix promoteurs ?
  - quel est le délai de l'offre promoteurs (hors Obido) ?
- **GetFloorplan** :
  - le pays et la société, l'origine russe étant déduite seulement du code ;
  - les paliers de volume et le prix de l'API ;
  - l'absence de marche libre (seul « 360 Tour » est affiché) ;
  - la balise exacte du titre du héros.
- **Aginera** : la marque blanche et le suivi d'ouverture ; le détail des « 5 plans gratuits » (rapporté).
- **WalkMyHome** : le pays, le lien de partage, la fidélité réelle derrière « True 1:1 Scale ».
- **VirtualSpaces Foursite** : la visite à la 1re personne est-elle disponible, ou seulement annoncée ? Prix inconnus.
- **Plan Alive** : la visite (« 3D Walkthrough ») sans démo visible, les prix, la réalité des « 20 secondes » et du « ÷30 ».
- **Cavoss** : les statistiques et l'API. La statistique « up to 31% faster… NAR » n'a pas été retrouvée dans une publication de la NAR.

**Prix non confirmés en source primaire**
- **HomeByMe** : 29/299 € et 59/590 € ne viennent que de TopApps ; la page officielle charge ses prix en JavaScript.
- **Habiteo** : aucun prix après 2017.
- **Matterport** : plan schématique à 14,99 $ (blog non daté, centre d'aide inaccessible).
- **Cedreo** : prix en euros (seulement GetApp et Capterra).
- **Autres** : Homestyler, Coohom, Rendair, REimagineHome, Spacely, ArchiVinci (relevés par un agent, non relus).
- **Kazaplan** : les conditions de gratuité (sources secondaires).

**Offres des promoteurs**
- Le prestataire de CogeHome 3D (Realiz3D probable, non prouvé), du configurateur Vinci et de la galerie IA de Kaufman & Broad.
- Nexity Inside est-il toujours actif en 2026 ?

**Sites et acteurs**
- **Realiz3D** : realiz3d.fr répond (code 200 le 29/09), mais realiz3d.com ne répond pas. L'activité 2026 n'est pas vérifiée.
- Kazaplan et la page Leroy Merlin : héros non relevé (403).
- Drafto : visuel du héros non relevé.
- Rendair : curseur avant / après probable, non vérifié.
- Acteurs cités dans les pistes mais introuvables : Kalisto/Kaliop, Immersive-Lab, Cadmap, Home3D, Treeview, Wizzvision, Keemia, Kaptn, Novap, plansdevente.fr.

**Marché**
- Signaux de marché marqués [e] : Rayon, Davis, VSAI, iGUIDE, Spacely, Nucleus4D, et les parts de vente sur plan à Dubaï par trimestre.
- Conversions de devises (zlotys en euros) : approximatives.
- **Aucune donnée de conversion** (taux de transformation) n'est disponible pour les pages analysées au § 4 bis.

---

## 7. Sources

**Concurrents : plan → 3D ou visite**
- 3D Estate / 3D Twin : [3dtwin.com/fr](https://3dtwin.com/fr/), [plans 3D et visites](https://3dtwin.com/fr/plans-3d-et-visites-virtuelles/), [3destate.pl/en](https://3destate.pl/en), [étude de cas Obido](https://3destate.pl/case-study/wirtualny-spacer-360), [Wirtualny Remont](https://wirtualnyremont.3destate.pl/), [dossier de presse IBS](https://www.buildersshow.com/assets/docs/ibs/pressKits/PK_44010_3DEstatepressrelase.pdf), [3destate.com à vendre](https://3destate.com/)
- GetFloorplan : [accueil](https://getfloorplan.com/), [prix](https://getfloorplan.com/pricing), [Trustpilot](https://www.trustpilot.com/review/getfloorplan.com)
- Aginera : [floor plan to 3D](https://aginera.ai/tools/floor-plan-to-3d), [floor plan to video](https://aginera.ai/tools/floor-plan-to-video), [prix](https://aginera.ai/pricing)
- Cavoss : [accueil](https://cavoss.com/), [vente sur plan à Dubaï](https://cavoss.com/off-plan-marketing-dubai)
- WalkMyHome : [walkmyhome.ai](https://walkmyhome.ai/)
- VirtualSpaces : [virtualspaces.tech](https://virtualspaces.tech/), [billet du 10/06/2026](https://virtualspaces.tech/blog/foursite-coming-features-floor-plan-to-3d-walkthrough)
- RoomSketcher : [accueil](https://www.roomsketcher.com/), [prix](https://www.roomsketcher.com/pricing/), [crédits](https://www.roomsketcher.com/credits/), [AI Convert](https://www.roomsketcher.com/features/ai-convert/), [services](https://www.roomsketcher.com/floor-plan-services/)
- Planner 5D : [accueil](https://planner5d.com/), [prix](https://planner5d.com/pricing), [aide à l'import](https://support.planner5d.com/en/articles/14434484-how-to-upload-a-floor-plan)
- Plan Alive : [planalive.app](https://planalive.app/)

**Promoteurs et studios en France**
- Habiteo et Bien'ici : [habiteo.com](https://www.habiteo.com/), [packs résidentiels](https://www.habiteo.com/fr/habiteo-residentiel/), [Bien'ici Solutions Pro](https://solutionspro.bienici.com/nos-offres/promoteur-immobilier/renforcer-lattractivite-de-mes-programmes/modelisation-3d/), [JDN 2016](https://www.journaldunet.com/economie/immobilier/1186852-grace-a-la-realite-virtuelle-habiteo-booste-la-vente-d-immobilier-neuf/), [ITespresso 2017](https://www.itespresso.fr/habiteo-leve-fonds-vitrine-digitale-promoteurs-immobiliers-176744.html), [rachat par Bien'ici](https://corporate.bienici.com/actualites/press-details/bienici-rachete-habiteo-leader-francais-de-la-3d-dans-limmobilier)
- Studios et services 3D : [Realiz3D](https://www.realiz3d.fr/), [Artefacto](https://www.artefacto-ar.com/), [VirtualBuilding](https://www.virtualbuilding.fr/visite-virtuelle-3d-libre), [Figaro 3D Immo](https://plan3d.immo/3d-hd-realite-virtuelle-immobilier/), [Figaro 3D Immo promoteurs](https://plan3d.immo/promoteurs-immobiliers/), [Vizion Studio](https://vizion-studio.com/), [Prévisite](https://www.previsite.fr/solution-3d-promoteur/modelisation/visite-virtuelle-3d.html), [Imagedoing](https://www.imagedoing.fr/portfolio/plan-de-vente-3d/), [Visiolab](https://www.visio-lab.com/solutions), [Printixel](https://printixel.com/plans-de-vente-3d/), [MachouPichou](https://machoupichou.com/plans-vefa-en-3d/), [Ma Maison 3D](https://www.mamaison3d.com/tarifs/), [VR Interactive](https://www.vr-interactive.fr/combien-coute-visite-virtuelle/), [3D Swiss View](https://www.3dswissview.ch/services/visite-virtuelle/visite-virtuelle-3d-immobilier-neuf/)
- Configurateurs TMA : [Show You](https://www.show-you.fr/), [MyTMA](https://mytma.fr/solution-mytma/), [Happywait](https://blog.happywait.com/personnalisation-logement-neuf-vefa), [Scoplan](https://www.scoplan.com/fr/Promoteur/logiciel-tma-promoteur-immobilier)
- Nexity : [Nexity Inside](https://pressroom.nexity.fr/actualites/avec-inside-nexity-propose-a-ses-clients-une-experience-immersive-unique-sur-le-marche-de-limmobilier-neuf-c82e-6731a.html)
- Cogedim : [CogeHome 3D](https://www.cogedim.com/visites-immersives-de-nos-residences-appartements-et-maisons.html)
- Bouygues Immobilier : [configurateur](https://www.bouygues-immobilier-corporate.com/newsroom/bouygues-immobilier-continue-dameliorer-lexperience-de-ses-clients-grace-un-configurateur), [Click & Visit](https://www.plan-immobilier.fr/actualites-immobilieres/bouygues-immobilier-click-and-visit)
- Kaufman & Broad : [FrenchWeb, 10/04/2026](https://www.frenchweb.fr/du-programme-au-logement-la-nouvelle-vitrine-digitale-de-kaufman-broad/461238)
- Vinci Immobilier : [configurateur](https://configurateur.vinci-immobilier.com/visite/index?ambiance=2&lid=0&pid=25&type=t3)
- Icade : [Icade](https://www.icade-immobilier.com/icade/icade-promoteur-digital)
- Eiffage : [Eiffage](https://www.eiffage.com/medias/actualites/eiffage-immobilier-et-la-dsi-deiffage-recompenses-pour-leur-dispositif-de-visite-virtuelle-du-logement)
- Emerige : [Emerige](https://www.emerige.com/editorial/concretisez-votre-projet-immobilier-depuis-chez-vous-avec-emerige-grace-a-notre-dispositif-100-digital-mais-100-humain)
- LP Promotion : [LP Promotion](https://www.lp-promotion.com/les-services-lp-promotion/le-configurateur-de-logement-neuf)
- Accompagnement de l'acquéreur : [VEFA Conseil](https://www.vefa-conseil.fr/), [Agence BLEU](https://ableu.fr/assistance-vefa-accompagnement-modification-et-conseil-achat-sur-plan-vefa/modification-plan-vefa-tm), [Angelica Déco](https://www.angelica-deco.com/conseil-achat-appartement-sur-plan-vefa.html), [Rhinov Pro](https://www.rhinov.pro/fr/nos-offres), [Fiverr](https://www.fiverr.com/floorplanner1/convert-2d-floor-plan-to-3d-floor-plan-in-4-hours-e834)

**Outils de conception**
- [HomeByMe](https://home.by.me/fr/), [HomeByMe, service de dessin](https://home.by.me/fr/offer/service-dessin-plan/), [TopApps (prix HomeByMe)](https://topapps.fr/vie-pratique/homebyme)
- [Cedreo](https://cedreo.com/fr/), [Cedreo, prix](https://cedreo.com/fr/tarifs/), [GetApp Cedreo](https://www.getapp.com/construction-software/a/cedreo/)
- [Kazaplan](https://www.kozikaza.com/kazaplan/new), [chantieraccess (fermeture de Kozikaza)](https://chantieraccess.fr/kozikaza/), [Tapis Beige (Kazaplan)](https://tapis-beige.fr/blogs/infos/kazaplan-2026-le-guide-ultime-du-logiciel-plan-maison-3d-gratuit-ex-kozikaza)
- [ArchiFacile](https://www.archifacile.net/versions), [Homestyler](https://www.homestyler.com/), [Coohom](https://www.coohom.com/)

**Rendus IA**
- [Vizcraft](https://vizcraft.ai/), [Vizcraft, prix](https://vizcraft.ai/pricing), [Rendair](https://rendair.ai/tools/floorplan-to-render), [Drafto](https://www.getdrafto.com/ai-floor-plan-to-render), [floor-plan.ai](https://floor-plan.ai/floor-plan-to-3d), [Pedra](https://pedra.ai/)

**Visites du bâti existant**
- [Matterport, prix](https://matterport.com/plans), [blog Matterport (plans schématiques)](https://matterport.com/blog/schematic-floor-plans-now-1499-space)
- [Floorfy](https://floorfy.com/), [Floorfy, prix](https://floorfy.com/prices), [Ogulo](https://www.ogulo.com/), [Ogulo, prix](https://ogulo.com/preise/), [Ogulo, neuf](https://ogulo.com/neubauvermarktung/)
- [CubiCasa](https://www.cubi.casa/pricing/), [magicplan](https://www.magicplan.app/pricing), [Kuula](https://kuula.co/page/pricing), [Make Plan](https://www.makeplan.tech/fr), [Nodalview](https://nodalview.com/)

**Signaux et marchés** : voir les liens des tableaux du § 5.

**Recherche web** : « AI floor plan to 3D render upload instantly 2026 » (29/09/2026). Elle a fait apparaître Aginera, Drafto, Vizcraft, Rendair et floor-plan.ai.
