# Marché et concurrence : du plan de vente VEFA à la visite 3D

Recherche du 27/09/2026. Chaque fait externe est suivi de sa source. « Non vérifié » signale ce que je n'ai pas pu confirmer sur une source primaire. Les prix sont ceux affichés par les éditeurs à cette date, dans leur devise d'origine, sans conversion.

Limites de la recherche :
- Le quota de recherches web de la session a été épuisé en cours de route. La suite a été faite en lisant directement les sites des éditeurs, les PDF de la FPI et les suggestions de Google.
- Plusieurs pages de prix sont générées en JavaScript et leurs montants ne sont pas lisibles sans navigateur (HomeByMe, Matterport, CubiCasa, grille détaillée de GetFloorplan). Ils sont marqués comme non relevés.
- Aucun volume de recherche Google n'a été mesuré : pas d'accès à Keyword Planner.

Données internes rappelées : coût mesuré de 1,10 à 1,85 $ par plan en appels IA, 8 à 15 minutes de bout en bout (`CLAUDE.md`).

---

## 0. En bref

**Le marché français du neuf vendu aux particuliers est petit et au plus bas.**
- En 2025, on compte **51 826 réservations nettes au détail** (logements ordinaires), plus environ 7 000 en résidences services. Les propriétaires occupants en font 80 %, les investisseurs particuliers 20 % ([FPI, T2 2026](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf)).
- Le **T2 2026 est le « pire trimestre » jamais mesuré par la FPI**. Au premier semestre 2026, les réservations totales passent sous 40 000.
- Les investisseurs particuliers repartent légèrement : +13,4 % au T2 2026, avec le nouveau statut du bailleur privé.
- Entre 2017 et 2019, les ventes brutes au détail dépassaient 126 000 par an. Elles sont tombées à environ 61 000 en 2024 (série SDES reprise par la [FPI](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/2025_T4_DP_rapport%20VF.pdf)).

**Presque tout le neuf se vend avant d'être construit.**
- Au T2 2026, l'offre commerciale de logements collectifs se répartit ainsi : 54 % en projet, 37 % en chantier, 9 % livrés. La moyenne sur 10 ans des logements livrés est de 7 % ([FPI](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf)).
- Il faut 21,4 mois pour écouler l'offre au rythme actuel.

**Côté professionnels :**
- La FPI compte près de 700 promoteurs adhérents et son observatoire couvre 90 % du marché.
- La CNCGP annonce 7 600 adhérents en 2026 et l'ANACOFI 3 507 CIF.
- Parmi les réseaux de mandataires : iad annonce 16 000 conseillers, SAFTI plus de 6 000, Propriétés-privées plus de 3 300.
- Il existe des plateformes de commercialisation de neuf pour les investisseurs, comme Valority et Consultim.

**Concurrence.** Personne ne vise exactement « l'acquéreur VEFA qui dépose son plan de vente et obtient une visite fidèle en 10 minutes ». Les substituts sont nombreux et bon marché :
- Planner 5D transforme un plan importé en projet 3D pour 59,99 $ par an.
- RoomSketcher fait une conversion IA de plan pour 20 $ par niveau.
- GetFloorplan vend des visuels et des visites 360° « à partir de 20 $ » par plan, livrés en 24 h, par IA avec contrôle humain.
- Côté promoteurs, Habiteo revendique plus de 1 500 programmes et plus de 400 promoteurs clients, avec des prix sur devis.

**Recommandation.**
- Se placer sur trois points : **fidélité aux cotes du plan de vente, automatique, 10 minutes, prix au plan**. Le vocabulaire et les moments sont ceux de la VEFA : réservation, rétractation de 10 jours, TMA, visite cloisons.
- Ne pas jouer le photoréalisme, où les studios et GetFloorplan sont devant.
- Le B2C seul ne fait pas un chiffre d'affaires. À titre d'ordre de grandeur, 5 % de 50 000 acheteurs à 29 € donnent environ 70 k€ par an. Il sert surtout d'acquisition et de preuve.
- Le revenu viendra des conseillers (abonnement) et des promoteurs (au lot ou au programme).
- Prix de départ proposés, à tester :
  - B2C : visite à 29 € ;
  - conseillers : 49 à 199 € par mois ;
  - promoteurs : 15 à 25 € HT par lot en volume.

---

## 1. Le marché français

### 1.1 Ventes de logements neufs (Observatoire FPI, ventes nettes de désistements)

| | 2023 | 2024 | 2025 | S1 2026 | Évolution S1 2026 / S1 2025 |
|---|---:|---:|---:|---:|---:|
| **Total des ventes de logements neufs** | 99 796 | 103 481 | 96 957 | 38 932 | -18,3 % |
| Ventes au détail (logements ordinaires) | 57 779 | 57 977 | 51 826 | 25 422 | -9,7 % |
| dont propriétaires occupants | 36 904 (64 %) | 38 593 (67 %) | 41 354 (80 %) | 18 849 (74 %) | -16,8 % |
| dont investisseurs particuliers | 20 875 (36 %) | 19 384 (33 %) | 10 472 (20 %) | 6 573 (26 %) | +19,4 % |
| Ventes en bloc (hors résidences services) | 36 417 | 39 704 | 38 131 | 9 810 | -37 % |
| Résidences services vendues au détail (échantillon) | 5 600 | 5 800 | 7 000 | 3 700 | -5,1 % |
| Mises en vente | 72 912 | 54 746 | 64 475 | 32 483 | -12,9 % |

Sources :
- 2025 à S1 2026 : [rapport FPI du T2 2026, 9/09/2026](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf), sur la [page presse FPI](https://fpifrance.fr/presse/les-chiffres-de-la-promotion-privee-au-2e-trimestre-2026) ;
- 2023 : [rapport FPI du T4 2025, 12/02/2026](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/2025_T4_DP_rapport%20VF.pdf).

Les chiffres 2025 ont été révisés entre les deux rapports. En février 2026, la FPI publiait 92 352 ventes au total, dont 9 469 à des investisseurs. C'est ce premier chiffre que reprend la presse (-10,8 % sur un an, année « catastrophique »).

Autres points du T2 2026 ([communiqué FPI « Peur sur la ville »](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909FPICPT22026.pdf)) :
- Les ventes totales baissent de 23,6 % sur un an. Les ventes en bloc baissent de 40,8 %.
- Les ventes aux particuliers baissent de 11,3 %, et celles aux propriétaires occupants de 17,9 %.
- Seuls les investisseurs particuliers progressent : +13,4 %, avec un « rebond fragile » que le statut du bailleur privé « pourrait conforter ».
- Causes avancées par la FPI : tensions au Moyen-Orient, budget 2027, approche de la présidentielle.

**Série longue** (réservations brutes au détail, SDES, reprise par la FPI dans le [rapport T4 2025](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/2025_T4_DP_rapport%20VF.pdf)) :
- 2017 : 130 362 ;
- 2019 : 131 089 ;
- 2022 : 103 199 ;
- 2023 : 65 086 ;
- 2024 : 60 749.

Les investisseurs pesaient 45 à 54 % du détail entre 2015 et 2022. Le marché des particuliers a donc été divisé par deux depuis 2019.

### 1.2 Statistique publique (SDES, enquête ECLN)

- **T2 2026** : 16 112 réservations par des particuliers, en données corrigées des variations saisonnières. C'est 55,1 % des logements neufs commercialisés et -4,8 % sur un trimestre. Les mises en vente sont de 17 499, soit +11,1 % ([SDES, publié le 20/08/2026](https://www.statistiques.developpement-durable.gouv.fr/commercialisation-des-logements-neufs-vente-aux-particuliers-au-2e-trimestre-2026)).
- **T4 2025** : 15 536 réservations par des particuliers, soit 54,8 % du total ([SDES, 20/02/2026](https://www.statistiques.developpement-durable.gouv.fr/commercialisation-des-logements-neufs-vente-aux-particuliers-au-4e-trimestre-2025)). Le T1 2026 compte 16 502 réservations ([Immo Matin](https://www.immomatin.com/evaluation/services-evaluer/logement-neuf-16-502-reservations-par-des-particuliers-au-t1-2026-4-vs-t4-2025.html), titre seul lu).
- **Année 2025**, selon une source secondaire qui cite le SDES ([trouver-un-logement-neuf.com](https://www.trouver-un-logement-neuf.com/immobilier-infos/bilan-2025-commercialisation-logement-neuf-11198.html)) :
  - 64 867 réservations par des particuliers, contre 69 061 en 2024 ;
  - 53 761 ventes en bloc ;
  - 123 945 logements disponibles ;
  - délai d'écoulement de 7,7 trimestres pour les appartements ;
  - prix moyen de 4 947 €/m² pour les appartements et de 348 521 € pour une maison.

  Je n'ai pas vérifié ces chiffres sur la publication annuelle du SDES. Le périmètre du SDES diffère de celui de la FPI : il inclut les maisons, les logements réhabilités et les réservations brutes.

INSEE : non consulté. Les séries de référence du neuf sont celles du SDES et de la FPI.

### 1.3 Prix et produit type

Prix au T2 2026, logements collectifs, TVA au taux normal, hors parking ([FPI](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf)) :
- 5 833 €/m² en Île-de-France (+0,7 %) et 4 656 €/m² en régions (-3,2 %) ;
- en France entière, un 2 pièces coûte en moyenne 223 606 € pour 44 m², un 3 pièces 315 314 € pour 65 m² et un 4 pièces 456 454 € pour 87 m².

Conséquence pour le prix : une visite vendue 29 € représente environ 0,01 % du prix d'un 3 pièces.

### 1.4 Part des ventes sur plan

Aucune statistique publique trouvée ne donne directement « la part des ventes faites sur plan ». L'indicateur le plus proche est la composition de l'offre commerciale suivie par la FPI :

| Offre de logements collectifs | T4 2025 | T2 2026 |
|---|---:|---:|
| En projet (avant chantier) | 47 % | 54 % |
| En chantier | 39 % | 37 % |
| Livrés (« stock dur ») | 14 % | 9 % |
| Offre totale (logements) | 88 089 | 87 619 |
| Délai d'écoulement | 21,3 mois | 21,4 mois |

La FPI donne 7 % de logements livrés en moyenne sur 10 ans. **J'en déduis que plus de 90 % des ventes au détail se font avant achèvement.** C'est une déduction, pas une statistique publiée.

### 1.5 Contexte fiscal 2026 : le statut du bailleur privé

Selon des sources secondaires ([Garantme](https://garantme.fr/fr/blog/proprietaire/statut-du-bailleur-prive-fonctionnement-amortissement-limites), [Meilleurtaux Placement](https://placement.meilleurtaux.com/scpi/actualites/2026-fevrier/loi-de-finances-2026-focus-sur-le-nouveau-statut-du-bailleur-prive.html), [Valority](https://www.valority.com/investir-immobilier/statut-du-bailleur-prive/)), la loi de finances 2026 crée un amortissement fiscal :
- 5 % par an dans le neuf, avec des plafonds de 8 000, 10 000 et 12 000 € selon le niveau de loyer ;
- pour les actes signés du 21/02/2026 à fin 2028 ;
- en logement collectif et en location nue seulement.

Je n'ai pas vérifié ces conditions sur le texte de loi. La FPI lie à ce statut le léger retour des investisseurs, qui pèsent 27 % du détail au T2 2026. Pour nous, cela redonne du poids au canal des conseillers en investissement.

### 1.6 Les acteurs : combien sont-ils ?

| Population | Chiffre | Source | Fiabilité |
|---|---|---|---|
| Promoteurs adhérents FPI | « près de 700 » sociétés, 17 chambres régionales. Promotion privée : 27,5 Md€ HT d'activité et 22 650 salariés | [communiqué FPI, 9/09/2026](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909FPICPT22026.pdf) | Primaire |
| Couverture de l'observatoire FPI | 90 % du marché | idem | Primaire |
| Nombre total de promoteurs en France, hors FPI | non trouvé | | Non vérifié |
| CNCGP | 7 600 adhérents en 2026 ; 44 % des cabinets cumulent CIF, IAS et IOBSP ; 110 Md€ d'encours CIF et IAS en 2024 | [cncgp.fr](https://www.cncgp.fr/) | Primaire |
| ANACOFI | 3 507 CIF, 9 954 courtiers, 1 057 professionnels de l'immobilier (2026) | [anacofi.asso.fr](https://www.anacofi.asso.fr/) | Primaire |
| Registre ORIAS au 31/12/2025 | 72 666 intermédiaires. La catégorie finance compte 12 636 inscriptions, CIF, ALPSI, CIP et IFP confondus | [orias.fr](https://www.orias.fr/) | Primaire. Le nombre de CIF seuls n'est pas isolé |
| CGP indépendants | « près de 4 500 personnes », sans date ni source | [Wikipédia](https://fr.wikipedia.org/wiki/Conseiller_en_gestion_de_patrimoine) | Faible |
| Agences immobilières | 27 000 fin 2012 et 32 000 en 2008. Aucun décompte à jour des cartes professionnelles | [Wikipédia](https://fr.wikipedia.org/wiki/Agent_immobilier) | Obsolète. Chiffre actuel non vérifié |
| Mandataires (réseaux) | iad : 16 000 conseillers en France. SAFTI : plus de 6 000. Propriétés-privées : plus de 3 300. Capifrance : site inaccessible (403) | [iadfrance.fr](https://www.iadfrance.fr/), [safti.fr](https://www.safti.fr/), [proprietes-privees.com](https://www.proprietes-privees.com/) | Déclaratif. Total du secteur non vérifié |

Commercialisateurs et plateformes de neuf pour les investisseurs :
- **Valority** : groupe fondé en 1985, qui annonce 5 Md€ d'immobilier commercialisé depuis cette date. Il vend du neuf « en partenariat avec les plus grands promoteurs » et possède plusieurs marques, dont Maslow Immo ([valority.com](https://www.valority.com/)).
- **Consultim Groupe** : plateforme fondée en 1995 pour les professionnels du patrimoine. Elle vend du LMNP neuf et ancien, de la nue-propriété et des SCPI. Ses chiffres ne sont pas lisibles sur la page ([consultim.com](https://consultim.com/)). L'ancienne adresse `consultim.com/cerenicimo` renvoie une erreur 404.
- **Pierre Papier** : `pierrepapier.fr` est « le site de référence sur les SCPI, les OPCI, les SIIC » ([pierrepapier.fr](https://www.pierrepapier.fr/)). Ce n'est pas un commercialisateur de VEFA. La « pierre-papier » désigne l'immobilier indirect.
- **Cardinal** : non identifié, non vérifié.
- Stellium, Vivienne Investissement, Primonial, Nexity et Selexium sont souvent cités comme réseaux de vente de neuf aux investisseurs, mais leurs sites n'étaient pas joignables depuis l'environnement de recherche. Non vérifié.

---

## 2. Concurrents et substituts

Les limites indiquées sont celles qui comptent pour notre promesse : partir du plan de vente, être fidèle aux cotes, être automatique et rapide, pour l'acquéreur VEFA.

### 2.1 3D pour promoteurs (France)

| Acteur | Offre | Cible | Prix public | Limites / écart avec nous | Source |
|---|---|---|---|---|---|
| **Habiteo** | Maquettes 3D web, visites virtuelles, plans 3D, configurateur avec TMA, CRM myHabiteo. Revendique plus de 1 500 programmes, plus de 26 000 lots modélisés et plus de 400 promoteurs partenaires. Clients cités : Kaufman & Broad, Bouygues Immobilier, Nexity, LP Promotion | Promoteurs résidentiels et tertiaires, constructeurs, agences | Sur devis | Commandé par le promoteur, programme par programme. L'acquéreur ne peut pas en commander. Délais et prix par lot non publiés | [habiteo.com](https://www.habiteo.com/) |
| **Artefacto** | Application Up!Immo (réalité augmentée et virtuelle pour la commercialisation), visites 360° (Up!Immersive), perspectives, films, drone. Plus de 20 ans d'activité | Promoteurs, industriels | Sur devis | Production sur mesure. Pas de libre-service | [artefacto-ar.com](https://www.artefacto-ar.com/) |
| Studios de perspective 3D locaux | Perspectives, plans 3D, films | Promoteurs | Sur devis. GetFloorplan affirme que les studios « traditionnels » facturent environ 130 $ par plan | Délais de plusieurs jours à plusieurs semaines, coût par image | Affirmation d'un concurrent (voir 2.3). Non vérifié |

### 2.2 Outils 3D grand public à partir d'un plan

| Acteur | Offre | Cible | Prix public | Limites | Source |
|---|---|---|---|---|---|
| **HomeByMe** (groupe Dassault Systèmes) | Plan 2D, aménagement 3D, images réalistes jusqu'en 4K, images 360°, catalogue de mobilier de marques | Particuliers, décorateurs, enseignes | Gratuit : 2 projets et 5 images HD. Au-delà, packs et abonnements Starter, Essentials et Pro, dont les montants ne sont pas relevés | Le plan est à **redessiner à la main**. La fidélité dépend de l'utilisateur | [home.by.me/fr/offres](https://home.by.me/fr/offres/) |
| **Kozikaza** | `kozikaza.com` redirige (301) vers l'outil « Créez votre plan maison 3D » de Leroy Merlin | Particuliers | Non relevé (page 403) | Saisie manuelle | [kozikaza.com](https://www.kozikaza.com/) vers [leroymerlin.fr](https://www.leroymerlin.fr/outils-projet/maison/creez-votre-plan-maison-3d.html) |
| **Planner 5D** | Conception 3D. L'offre Premium permet d'« Upload a floor plan and instantly turn it into a 3D project ». Visite 360° et outils IA | Particuliers, pros | Gratuit. Premium : 59,99 par an (4,99 par mois) ou 19,99 par mois. Pro : 399,99 par an ou 49,99 par mois (prix US) | **Substitut le plus direct et le moins cher.** Import générique, sans garantie de fidélité aux cotes ni contrôle des défauts | [planner5d.com/pricing](https://planner5d.com/pricing) |
| **Floorplanner** | Plans 2D et 3D, exports, visites 3D en crédits | Particuliers, agents, enseignes | Gratuit jusqu'à 5 projets en SD avec filigrane. Crédits : 5 pour 8,15 $, 100 pour 163 $. Passage en HD, 4K ou 8K payé en crédits | Saisie manuelle | [floorplanner.com/pricing](https://floorplanner.com/pricing) |
| **RoomSketcher** | Plans 2D et 3D, Live 3D, vue 360, **conversion IA de plan** | Particuliers, agents, pros | Gratuit : 2 crédits et 1 conversion IA offerte. Pro : 24 $ par mois (12 $ en annuel). Team : 70 $ par mois (35 $ en annuel). Conversion IA : 20 $ par niveau. Plan commandé : 18 à 38 $ par niveau, livré le jour ouvré suivant | Service de dessin plutôt que visite prête à partager. Pas centré sur la VEFA | [roomsketcher.com/pricing](https://www.roomsketcher.com/pricing/) |
| Sweet Home 3D | Logiciel libre de plan et d'aménagement 3D | Particuliers | Gratuit | Saisie manuelle, rendu daté | [sweethome3d.com](https://www.sweethome3d.com/) (non revérifié ce jour) |
| **magicplan** | Relevé de l'existant sur place (LiDAR, laser), plans, rapports | Pros de la rénovation et de l'assurance | Paiement par projet, minimum 10 projets par mois, 40 $ par projet supplémentaire | Suppose un logement **construit** | [magicplan.app/pricing](https://www.magicplan.app/pricing) |

### 2.3 Visuels et visites générés par IA depuis un plan

| Acteur | Offre | Cible | Prix public | Limites | Source |
|---|---|---|---|---|---|
| **GetFloorplan** | À partir d'un plan 2D : plans 2D et 3D, rendus meublés, visite 360°, vues par les fenêtres, visites « White Box / Grey Shell » pour le neuf. IA avec contrôle qualité humain, livraison en 24 h, API | Agents, **promoteurs**, agences 3D | « À partir de 20 $ ». 10 plans pour 200 $, contre 1 300 $ annoncés chez les studios. Grille détaillée non relevée | 24 h et non quelques minutes. Contrôle humain. Pas centré sur la VEFA française. Le code du site configure aussi une API pour `hart-estate.ru` | Textes du site lus dans son code JavaScript ([getfloorplan.com](https://getfloorplan.com/)) |
| RoomSketcher AI Convert | Voir 2.2 | | 20 $ par niveau | | [roomsketcher.com/pricing](https://www.roomsketcher.com/pricing/) |
| Planner 5D (import de plan) | Voir 2.2 | | Compris dans Premium | | [planner5d.com/pricing](https://planner5d.com/pricing) |

### 2.4 Visites du bâti existant (substituts partiels)

Ces outils supposent un logement construit. Ils ne concurrencent pas la VEFA avant livraison, mais ils fixent les attentes des acheteurs et des agents sur ce qu'est une « visite virtuelle ».

| Acteur | Offre | Prix public | Source |
|---|---|---|---|
| **Matterport** | Jumeau numérique par scan. Offres Free (1 espace), Starter (5 à 20 espaces), Professional (20 à 150), Business (100 à 300), Enterprise. Plans schématiques en option | Montants non relevés (page dynamique) | [matterport.com/plans](https://matterport.com/plans) |
| **Giraffe360** | Caméra robotisée avec IA : photos HDR, visite, plans LiDAR, home staging IA | Sur configuration, non affiché | [giraffe360.com](https://www.giraffe360.com/) |
| **Nodalview** | Application pour agents : photos HDR, visites 360°, plans, IA. Une visite ou un plan coûte 15 crédits, une photo 1 crédit | Crédit jusqu'à 0,60 € dans le plus gros pack. Abonnements sur devis | [nodalview.com/pricing](https://www.nodalview.com/pricing) |
| **CubiCasa** | Plans par scan au smartphone. Premier plan 2D gratuit | Montants non relevés | [cubi.casa/pricing](https://www.cubi.casa/pricing/) |

### 2.5 Home staging virtuel

| Acteur | Prix public | Source |
|---|---|---|
| **BoxBrownie** | Staging virtuel : 21 € par image. Staging 360° : 42 €. Plan 2D redessiné : 21 à 24,50 €. **Plan 3D couleur : 28 €**. Visite virtuelle : 14 € jusqu'à 15 photos | [boxbrownie.com/pricing](https://www.boxbrownie.com/pricing) |
| **Virtual Staging AI** | 16 $ par mois pour 6 photos (2,67 $ la photo), 19 $ pour 20 photos, 39 $ pour 60 photos (0,65 $ la photo). Traitement en « 10 secondes » | [virtualstagingai.app/pricing](https://www.virtualstagingai.app/pricing) |

Limite commune : ces services partent d'une **photo d'une pièce existante**. Sans photo, ils ne s'appliquent pas à un appartement sur plan.

### 2.6 Configurateurs TMA

- Le **configurateur Habiteo** intègre les TMA et est présenté comme une source de ventes additionnelles « sans showroom » ([habiteo.com](https://www.habiteo.com/)).
- **Up!Immo d'Artefacto** est une autre offre ([artefacto-ar.com](https://www.artefacto-ar.com/)).
- Les espaces clients et configurateurs propres aux grands promoteurs n'ont pas été vérifiés.

Pour nous, les TMA sont une **option future**. Il faudrait redessiner le plan modifié et chiffrer, ce que les configurateurs font déjà côté promoteur.

### 2.7 Appartements témoins, bulles de vente, maquettes physiques

Pas de source publique trouvée sur leur coût. Non vérifié. Deux constats d'observation :
- Ils ne montrent qu'**un** lot type.
- Google suggère surtout des appartements témoins **patrimoniaux** (Perret au Havre, Tony Garnier à Lyon), pas des bulles de vente. Aucune suggestion ne ressort pour « visite virtuelle programme neuf ».

### 2.8 Accompagnement de l'acquéreur VEFA

**VEFA Conseil** ([vefa-conseil.fr](https://www.vefa-conseil.fr/)) :
- analyse du contrat de réservation et de la notice descriptive en 72 h pour **139 € TTC** ;
- négociation payée au résultat ;
- visites de chantier (après cloisons, avant livraison, livraison) et suivi des réserves ;
- basé en Île-de-France, actif dans les grandes métropoles.

C'est un **partenaire naturel** plus qu'un concurrent. Il donne aussi un repère de prix pour ce qu'un acquéreur inquiet accepte de payer pendant la rétractation.

### 2.9 International

- Les substituts les plus proches sont déjà internationaux : GetFloorplan (visuels depuis un plan, 24 h), RoomSketcher (Norvège), Planner 5D (catalogue multilingue), Floorplanner (Pays-Bas), CubiCasa (Finlande), Matterport et Giraffe360 (bâti existant).
- Archilogic (Zurich) fait de la donnée spatiale et des plans pour l'immobilier d'entreprise, sur devis. Ce n'est pas un concurrent résidentiel ([archilogic.com](https://www.archilogic.com/)).
- La taille des marchés étrangers de la vente sur plan n'a pas été vérifiée : Dubaï, Espagne, Portugal, Pologne, Royaume-Uni sont souvent cités. Conformément à la consigne « plan par plan », je ne recommande pas d'ouverture internationale avant d'avoir couvert les formats de plans de vente français.

---

## 3. L'acquéreur VEFA : douleurs, moments clés, recherches

### 3.1 Le parcours et ses douleurs

| Moment | Ce qui se passe | Douleur | Ce qu'on peut apporter |
|---|---|---|---|
| Choix du lot | Plan de vente en PDF, plaquette, parfois une perspective de la résidence | Du mal à se projeter à partir d'un plan coté. On compare mal les surfaces et on ne sait pas si les meubles rentrent | Visite à la première personne fidèle aux cotes, photos de chaque pièce, comparaison de plusieurs lots |
| Signature du contrat de réservation | Dépôt de garantie d'au plus 5 % du prix si la vente est conclue dans l'année, 2 % dans les deux ans, rien au-delà ([CCH R261-28](https://www.legifrance.gouv.fr/search/code?tab_selection=code&searchField=NUM_ARTICLE&query=R261-28)) | Engagement lourd sur un bien qu'on n'a pas vu | |
| **Rétractation de 10 jours** | L'acquéreur non professionnel peut se rétracter pendant 10 jours à compter du lendemain de la première présentation de la lettre de notification ([CCH L271-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037667917), texte intégral non relu ici) | **Le doute** : « ai-je bien choisi ? », « est-ce trop petit ? ». Google suggère « vefa rétractation après 10 jours », « contrat de réservation vefa annulation » | **Moment d'achat n° 1 en B2C** : il faut un résultat en quelques minutes, pas en 24 h |
| Prêt, puis acte authentique | Délai de plusieurs mois | Attente, appels de fonds | Visite à partager avec les proches |
| Choix des TMA et des options | Délai fixé par le promoteur, avec frais de dossier | Choisir sans voir. Google suggère « coût tma vefa » et « vefa modification plan promoteur » | Option future : variante du plan et visite comparée |
| Chantier | 18 à 30 mois selon l'ordre de grandeur habituel (non vérifié) | Retards. Google suggère « vefa retard de livraison indemnités » | Pas notre sujet |
| **Visite cloisons** | Visite du chantier une fois les cloisons posées | Vérifier que le plan est respecté. Google suggère « visite cloison vefa que vérifier » et « vefa plan non respecté » | Comparer la visite générée à ce qu'on voit. Liste des cotes par pièce |
| Livraison | Réserves | Google suggère « vefa surface non conforme » et « vefa tolérance surface » | Surfaces par pièce issues du plan, pour référence |

### 3.2 Recherches Google observées

Suggestions de saisie Google (`suggestqueries.google.com`, `hl=fr`, `gl=fr`), relevées le 27/09/2026. Ce sont des suggestions, pas des volumes.

- **Se projeter et passer du plan à la 3D :**
  - « transformer plan 2d en 3d », « … gratuit en ligne », « … ia », « transformer un plan 2d en 3d avec ia » ;
  - « plan 3d a partir d un plan 2d », « faire un plan 3d a partir d un plan 2d gratuit » ;
  - « plan appartement 3d gratuit », « plan appartement 3d en ligne gratuit », « plan 3d appartement leroy merlin », « plan 3d appartement ikea » ;
  - « plan de vente appartement ».
- **Inquiétude sur le contrat :**
  - « achat sur plan piège à éviter » ;
  - « contrat de réservation vefa annulation », « contrat de reservation vefa retractation » ;
  - « vefa rétractation après 10 jours », « annulation vefa avant signature notaire », « vefa plan non respecté ».
- **Surfaces et conformité :** « vefa surface non conforme », « vefa tolérance surface ».
- **TMA :** « coût tma vefa », « contrat tma vefa », « modification plan vefa », « optimisation plan vefa ».
- **Visite cloisons :** « visite cloison vefa que vérifier », « visite cloison combien de temps avant livraison », « visite cloison cuisiniste ».
- **Services existants :** « vefa conseil avis », « expert vefa avis », « avis vefa pro ».
- **Aucune suggestion** pour « visite virtuelle programme neuf », « visite virtuelle appartement neuf », « logement neuf 3d » ni « vefa meubles ».

À retenir :
- L'acquéreur ne cherche pas « une visite virtuelle ». Il cherche à **transformer son plan en 3D**, souvent gratuitement, face à Planner 5D, Leroy Merlin, IKEA et HomeByMe.
- Il cherche aussi à **se rassurer sur son contrat**.
- Le référencement doit viser ces deux familles, avec des pages sur la rétractation, la visite cloisons et les TMA.

---

## 4. Conseillers et promoteurs

### 4.1 Conseillers (CGP, CIF, agents, mandataires, commercialisateurs)

Constats sourcés :
- Les investisseurs particuliers sont passés de 33 % du détail en 2024 à 20 % en 2025, puis remontent à 27 % au T2 2026 ([FPI](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf)). Le canal des conseillers a fondu avec la fin du Pinel au 31/12/2024 et repart timidement avec le statut du bailleur privé.
- Les réseaux sont grands : 7 600 adhérents CNCGP, 3 507 CIF à l'ANACOFI, 16 000 conseillers iad. Mais la part qui vend réellement du neuf n'est pas connue. Les grands réseaux de mandataires, sauf iad avec son filtre « Neuf », ne mettent pas le neuf en avant sur leur page d'accueil.

Douleurs, déduites du parcours et non mesurées par une source :
- L'investisseur achète souvent **à distance**, sans visiter le quartier ni l'appartement témoin. Le conseiller doit rendre le lot concret en rendez-vous ou en visio.
- **Qualification** : savoir qui a vraiment regardé le lot. Un lien de visite avec un suivi d'ouverture (ouvert, durée, pièces vues) sert d'indicateur d'intérêt.
- **Hésitation, puis annulation** pendant la rétractation ou au refus de prêt. La FPI publie des ventes nettes de désistements et le SDES des ventes brutes, mais **aucun taux de désistement public n'a été trouvé** (non vérifié). À demander aux premiers conseillers et promoteurs partenaires.

### 4.2 Promoteurs

Constats sourcés ([FPI T2 2026](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf)) :
- 87 619 logements en offre et 21,4 mois d'écoulement. Il faut **vendre plus vite**.
- 54 % de l'offre est encore en projet : la commercialisation sur plan conditionne le lancement des chantiers. Le seuil de pré-commercialisation exigé par les banques n'a pas été vérifié.
- Mises en vente : 64 475 en 2025, 32 483 au premier semestre 2026. C'est l'ordre de grandeur annuel des lots à illustrer.
- Les ventes en bloc s'effondrent (-40,8 % au T2 2026). Les promoteurs dépendent davantage des particuliers, ce qui rend les outils de vente au détail plus utiles.

Coûts actuels de la 3D par lot : **aucun prix public** chez Habiteo ni Artefacto. Repères indirects :
- GetFloorplan annonce environ 130 $ par plan chez un studio classique, contre 20 $ chez lui ;
- BoxBrownie facture 28 € le plan 3D couleur ;
- RoomSketcher facture 18 à 38 $ par niveau pour un plan commandé.

Ces repères concernent des plans 3D, pas des visites. Aucun prix public de visite interactive par lot n'a été trouvé. Non vérifié.

En général, seuls quelques lots types sont modélisés, avec parfois une maquette de la résidence. Les autres lots n'ont qu'un plan PDF. C'est une déduction : Habiteo annonce 26 000 lots pour 1 500 programmes, soit environ 17 lots par programme.

---

## 5. Positionnement recommandé

### 5.1 Où nous gagnons

1. **L'entrée est le plan de vente.** Sans redessin, contrairement à HomeByMe, Floorplanner, Sweet Home 3D et Leroy Merlin. L'acquéreur a déjà ce document, le conseiller aussi.
2. **Fidélité aux cotes mesurée.** Contrôle automatique contre les relevés de référence, politique « zéro défaut visible », publication bloquée si le contrôle échoue. Ni Planner 5D ni RoomSketcher n'annoncent de garantie équivalente. GetFloorplan passe par un contrôle humain en 24 h.
3. **Rapidité : 8 à 15 minutes**, contre 24 h chez GetFloorplan, le jour ouvré suivant chez RoomSketcher et plusieurs jours ou semaines chez les studios. C'est décisif dans la fenêtre de rétractation de 10 jours.
4. **Coût unitaire bas** : 1,10 à 1,85 $ d'IA par plan. Cela permet un prix au plan compétitif avec une marge brute élevée.
5. **Spécifique à la VEFA française** : vocabulaire, moments clés, lien de visite partageable pour les conseillers, et plus tard marque blanche pour les promoteurs.

### 5.2 Où nous perdons, ou pas encore

1. **Le réalisme.** Pas de photoréalisme, pas encore de mobilier ni de décoration. Les studios, Habiteo et GetFloorplan sont devant, et Planner 5D ou HomeByMe montrent du mobilier de marque.
2. **Les TMA et les variantes**, que les configurateurs promoteurs (Habiteo) couvrent déjà.
3. **La résidence et l'extérieur** : vue, étage, orientation réelle, parties communes.
4. **La couverture des plans.** Nous avançons plan par plan. Duplex et triplex sont gérés par la chaîne depuis le 27/09/2026, validés sur une seule duplex avec une lecture préparée à la main ; lecture réelle par l'IA, triplex, escalier quart tournant, entrée au niveau haut et plan en image ne sont pas encore testés.
5. **La notoriété et la confiance** face à des marques établies (Dassault Systèmes, Leroy Merlin, Habiteo).
6. **La fréquence.** L'acquéreur achète une fois, et il existe des substituts gratuits ou presque (Planner 5D Premium à 59,99 par an avec import de plan).
7. **Le 360°.** GetFloorplan, RoomSketcher, Planner 5D, HomeByMe et Nodalview le proposent (§ 2). Chez nous, il est décidé le 27/09/2026 (panoramas rendus par le serveur à chaque arrêt, `PLAN.md` § 2.1, décision 15) mais pas encore construit.

### 5.3 Prix de référence du marché

| Repère | Prix | Ce que c'est |
|---|---|---|
| Crédit Floorplanner | 1,63 $ | Mise à niveau d'un projet |
| Virtual Staging AI | 0,65 à 2,67 $ par photo | Staging d'une photo existante |
| Nodalview | environ 9 € et plus par visite ou plan (15 crédits à 0,60 € au mieux) | Visite ou plan de bâti existant |
| Planner 5D Premium | 59,99 par an ou 19,99 par mois | Outil avec import de plan |
| GetFloorplan | à partir de 20 $ par plan | Visuels et visite 360° par IA en 24 h |
| RoomSketcher | 20 $ par niveau (conversion IA), 18 à 38 $ (plan commandé) | Plan converti ou redessiné |
| BoxBrownie | 21 € par image de staging, 28 € par plan 3D | Service à la pièce |
| Studio « traditionnel » | environ 130 $ par plan | Affirmation de GetFloorplan, non vérifiée |
| VEFA Conseil | 139 € TTC | Relecture du contrat de réservation |
| magicplan | 40 $ par projet supplémentaire | Relevé de l'existant, pros |
| Abonnements pros | RoomSketcher Team 35 à 70 $ par mois ; Planner 5D Pro 33 à 50 $ par mois ; Virtual Staging AI 16 à 39 $ par mois | Outils pros mensuels |

### 5.4 Grille proposée (hypothèses à tester, pas des faits)

| Cible | Proposition | Justification |
|---|---|---|
| Particulier, 1 crédit offert | Génération simple : plan 2D, maquette 3D et quelques photos, sans visite | Conforme à la consigne. Coût maîtrisé d'environ 1 à 2 $ |
| Particulier, visite | **29 €** (fourchette de test 19 à 39 €), environ 49 € avec l'aménagement meublé quand il sera prêt | Au-dessus des outils en libre-service, sous les services faits à la main (GetFloorplan à partir de 20 $, grille détaillée non relevée ; BoxBrownie 28 € pour un seul plan 3D ; VEFA Conseil 139 €). Moins de 0,01 % du prix du logement |
| Conseiller | **49 € par mois pour 5 plans, 99 € pour 15 plans, 199 € pour 40 plans**, liens de visite illimités avec suivi d'ouverture. Plan supplémentaire à 8 ou 10 € | Aligné sur les abonnements pros (35 à 70 $ par mois) et sur les 40 $ par projet de magicplan. La valeur vendue est un rendez-vous gagné ou une annulation évitée |
| Promoteur | **15 à 25 € HT par lot** en volume. Forfait par programme (par exemple 40 lots pour environ 600 à 1 000 €). Résidence intégrée et marque blanche sur devis | Sous GetFloorplan (20 $ et plus, en 24 h) et bien sous un studio. Argument : **tous** les lots au lieu de quelques lots types |
| Marque blanche | Frais de mise en place et abonnement annuel | Voir `auth-paiement.md` pour les contraintes de domaine |

Ordres de grandeur du chiffre d'affaires possible en France, par calcul :
- B2C : 50 000 acheteurs par an × 5 % × 29 € ≈ **72 k€**.
- Promoteurs : 64 000 lots mis en vente par an × 15 % × 20 € ≈ **190 k€**.
- Conseillers : 300 abonnés × 99 € × 12 ≈ **360 k€**.

La France seule reste un marché de quelques centaines de k€ à environ 1 M€ par an. Les options payantes (meublé, TMA, 4K, photoréalisme) et les promoteurs portent l'essentiel du potentiel.

### 5.5 Recommandations concrètes

1. **Lancer par le moment du doute.** Visite en 10 minutes pendant les 10 jours de rétractation. Pages de référencement sur « transformer plan 2d en 3d », « rétractation vefa », « visite cloison que vérifier » et « coût tma vefa ».
2. **Faire du conseiller le premier client payant récurrent.** Lien de visite sans compte pour le prospect, suivi d'ouverture, dossier par lot. Viser d'abord les CGP qui vendent du neuf aux investisseurs, un segment qui repart en 2026, et les commercialisateurs.
3. **Aller chez les promoteurs avec l'argument « tous les lots, pas quelques lots types »**, facturé au lot, délai de quelques minutes par plan. Ne pas attaquer Habiteo sur le photoréalisme.
4. **Nouer des partenariats d'orientation** avec les services d'accompagnement VEFA (type VEFA Conseil), les courtiers (9 954 à l'ANACOFI) et les réseaux de mandataires.
5. **Mesurer le taux de désistement** et le temps de décision chez les premiers partenaires. C'est la donnée manquante qui permettra de chiffrer notre valeur.
6. **Point juridique à faire vérifier.** Un plan de vente est un document du promoteur et de l'architecte. L'usage privé par l'acquéreur pose peu de question. En revanche, la **diffusion à des prospects** de visites construites sur les plans d'un promoteur, par un conseiller, peut demander l'accord du promoteur. Ce point n'a pas été vérifié juridiquement. Il est cohérent avec la règle interne qui interdit de publier les plans des promoteurs sans accord.

---

## 6. Non vérifié ou manquant

- Nombre actuel d'agents immobiliers (cartes T) et de mandataires en France. Seuls des chiffres de 2008 à 2012 et les déclarations des réseaux ont été lus.
- Nombre total de promoteurs, hors adhérents FPI.
- Taux de désistement ou d'annulation des réservations en VEFA.
- Coût d'un appartement témoin ou d'une bulle de vente. Prix d'Habiteo, d'Artefacto et des studios de perspective.
- Tarifs d'abonnement de HomeByMe, Matterport et CubiCasa, et grille détaillée de GetFloorplan (pages dynamiques).
- « Cardinal » et plusieurs commercialisateurs (Stellium, Vivienne Investissement, Primonial, Selexium) : sites non joignables depuis l'environnement de recherche.
- Chiffres annuels 2025 du SDES (source secondaire). Conditions exactes du statut du bailleur privé, vues seulement dans des sources secondaires.
- Volumes de recherche Google (seules les suggestions ont été relevées).
- Tailles des marchés étrangers de la vente sur plan.

## 7. Sources consultées

- FPI, 2e trimestre 2026 : [page presse](https://fpifrance.fr/presse/les-chiffres-de-la-promotion-privee-au-2e-trimestre-2026), [rapport PDF](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909_Obs%20FPI_T2_rapport.pdf), [communiqué PDF](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/20260909FPICPT22026.pdf)
- FPI, 4e trimestre 2025 et bilan annuel : [page presse](https://fpifrance.fr/presse/les-chiffres-de-la-promotion-privee-au-4e-trimestre-2025-et-bilan-annuel), [rapport PDF](https://fpifranceprodcellar.cellar-c2.services.clever-cloud.com/public/media/file/2025_T4_DP_rapport%20VF.pdf)
- SDES : [T2 2026](https://www.statistiques.developpement-durable.gouv.fr/commercialisation-des-logements-neufs-vente-aux-particuliers-au-2e-trimestre-2026), [T4 2025](https://www.statistiques.developpement-durable.gouv.fr/commercialisation-des-logements-neufs-vente-aux-particuliers-au-4e-trimestre-2025) ; bilan 2025 via [trouver-un-logement-neuf.com](https://www.trouver-un-logement-neuf.com/immobilier-infos/bilan-2025-commercialisation-logement-neuf-11198.html) ; T1 2026 via [Immo Matin](https://www.immomatin.com/evaluation/services-evaluer/logement-neuf-16-502-reservations-par-des-particuliers-au-t1-2026-4-vs-t4-2025.html)
- Statut du bailleur privé : [Garantme](https://garantme.fr/fr/blog/proprietaire/statut-du-bailleur-prive-fonctionnement-amortissement-limites), [Meilleurtaux Placement](https://placement.meilleurtaux.com/scpi/actualites/2026-fevrier/loi-de-finances-2026-focus-sur-le-nouveau-statut-du-bailleur-prive.html), [Valority](https://www.valority.com/investir-immobilier/statut-du-bailleur-prive/)
- Droit : [CCH L271-1 (Légifrance)](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037667917), [CCH R261-28 (recherche Légifrance)](https://www.legifrance.gouv.fr/search/code?tab_selection=code&searchField=NUM_ARTICLE&query=R261-28)
- Professions : [CNCGP](https://www.cncgp.fr/), [ANACOFI](https://www.anacofi.asso.fr/), [ORIAS](https://www.orias.fr/), [Wikipédia CGP](https://fr.wikipedia.org/wiki/Conseiller_en_gestion_de_patrimoine), [Wikipédia agent immobilier](https://fr.wikipedia.org/wiki/Agent_immobilier), [iad](https://www.iadfrance.fr/), [SAFTI](https://www.safti.fr/), [Propriétés-privées](https://www.proprietes-privees.com/)
- Commercialisation : [Valority](https://www.valority.com/), [Consultim](https://consultim.com/), [Pierre Papier](https://www.pierrepapier.fr/)
- Concurrents :
  - 3D pour promoteurs : [Habiteo](https://www.habiteo.com/), [Artefacto](https://www.artefacto-ar.com/)
  - Outils grand public : [HomeByMe](https://home.by.me/fr/offres/), [Kozikaza](https://www.kozikaza.com/), [Planner 5D](https://planner5d.com/pricing), [Floorplanner](https://floorplanner.com/pricing), [RoomSketcher](https://www.roomsketcher.com/pricing/), [magicplan](https://www.magicplan.app/pricing)
  - IA depuis un plan : [GetFloorplan](https://getfloorplan.com/)
  - Bâti existant : [Matterport](https://matterport.com/plans), [Giraffe360](https://www.giraffe360.com/), [Nodalview](https://www.nodalview.com/pricing), [CubiCasa](https://www.cubi.casa/pricing/), [Archilogic](https://www.archilogic.com/)
  - Home staging virtuel : [BoxBrownie](https://www.boxbrownie.com/pricing), [Virtual Staging AI](https://www.virtualstagingai.app/pricing)
  - Accompagnement de l'acquéreur : [VEFA Conseil](https://www.vefa-conseil.fr/)
- Suggestions Google : `https://suggestqueries.google.com/complete/search?client=firefox&hl=fr&gl=fr&q=<requête>`, relevées le 27/09/2026
