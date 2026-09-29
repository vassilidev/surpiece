# Textes du site et du parcours

Version du 27/09/2026, alignée le même jour sur les décisions de l'utilisateur (D1 à D10) et les arbitrages du coordinateur (R1 à R23). **Proposition à valider par l'utilisateur.**

Ce recueil contient tous les textes visibles, prêts à intégrer : pages publiques, écrans du parcours, e-mails, messages d'erreur, bandeau de consentement.

Hiérarchie quand deux documents divergent : décisions de l'utilisateur, puis arbitrages, puis `OFFRES.md` (offres, crédits), `ARCHITECTURE.md` (technique), ce recueil (textes), `PARCOURS.md`, `SUIVI.md`. Pour les règles commerciales, les crédits et les durées, `OFFRES.md` fait foi (R7), et ses délais de support aussi (R15).

Sources :
- offre retenue : `produit/OFFRES.md` ;
- ton, vocabulaire, preuves autorisées, direction artistique : `produit/MARQUE.md` ;
- recherches : `produit/recherche/` (marche, juridique, suivi, auth-paiement, hebergement, audit-code, nom) ;
- consignes du projet : `CLAUDE.md` ;
- libellés existants : `pipeline/accueil.html`, `moteur/ui.js`, relevés le 27/09/2026 sans modification (le travail sur les niveaux (fini le 27/09/2026, non commité) les a modifiés).

---

## 0. Mode d'emploi

### 0.1 Remplacer le nom

- Le nom provisoire est écrit sous une seule forme : **Sur Pièce**. Il n'est jamais précédé de « de », « du » ou « le ».
- Pour passer au plan B, rechercher-remplacer dans ce fichier :
  - `Sur Pièce` → `Avant-Clés` ;
  - `SUR PIÈCE` → `AVANT-CLÉS` ;
  - `surpiece` → `avantcles` (domaines et adresses).
- Reprendre ensuite à la main les passages marqués **[dépend du nom]** : ils jouent sur l'expression « juger sur pièce ». Chacun propose un texte de remplacement pour Avant-Clés.
- Les noms de formules (Solo, Cabinet, Équipe) ne dépendent pas du nom.
- Les domaines (`surpiece.fr`) ne sont ni achetés ni déposés à ce jour (`MARQUE.md` § 1.6). Aucun texte n'est publié avant.

### 0.2 Marqueurs

| Marqueur | Sens | Action |
|---|---|---|
| **[dépend du nom]** | Jeu de mots sur « sur pièce » | Remplacer par la variante donnée si le nom change |
| **[À VALIDER : avocat]** | Formulation juridique ou promesse à faire relire | Ne pas publier avant l'avis de l'avocat |
| **[SI LIVRÉ : …]** | La fonction citée est encore à construire (OFFRES, ARCHITECTURE) | Retirer la phrase tant que la fonction n'existe pas |
| **[À MESURER]** | Chiffre à confirmer en production | Voir § 0.3 |
| **[À CONFIRMER : …]** | Choix technique ou d'organisation pas encore arrêté (hébergeur, accès de l'équipe) | Ajuster le texte au choix fait |
| `{variable}` | Valeur remplie par l'application | Ne jamais afficher la variable brute : prévoir un repli |
| **[Prix : hypothèse]** | Tous les prix d'`OFFRES.md` | Aucun prix n'est publié avant validation. Les prix écrits ici sont les valeurs d'hypothèse : à l'affichage, ils sont lus dans le catalogue d'offres (L5-08), par l'application et par l'assemblage de la vitrine (`outils/site.py`, R19), jamais écrits en dur (R5) |
| **‹délai›** | Délai de bout en bout, pas encore mesuré en production | Voir § 0.3 (R12) |
| **[Liste d'attente]**, **[Bêta]**, **[Pré-lancement pro]** | Variante d'un texte selon le mode de publication | Voir § 0.8 (R13, R21). Un texte sans marqueur de mode est celui du mode ouvert |

### 0.3 Le délai

- **Aucun délai n'est écrit en dur (R12).** Le marqueur **‹délai›** tient la place du délai de bout en bout, jusqu'à sa mesure en production (test T0, `OFFRES.md` § 9.2, ticket L5-11).
- « 8 à 15 minutes » a été mesuré sur Mac avec carte graphique. En production, le rendu se fait sans carte graphique, dans un conteneur (R3) : les images y sont environ 11 fois plus lentes (`hebergement.md` § 2.1). Ce chiffre n'est donc plus publié, et « un quart d'heure environ » non plus.
- **Valeur** (`PARCOURS.md` § 1.3) : le 75e centile mesuré en production sur 7 jours, arrondi aux 5 minutes supérieures, précédé de « environ ». Exemple de forme : « environ 25 minutes ». Capitale en début de phrase.
- **Une seule valeur**, tenue en configuration : l'application la lit (`{delai}`), et l'assemblage de la vitrine l'injecte comme les prix (proposition, R19).
- **Avant T0**, une phrase qui contient ‹délai› n'est pas publiée : on publie son **repli avant T0** quand il est donné, sinon on retire la phrase.
- **File d'attente** : l'attente estimée (`{attente}`) est calculée, jamais promise : position dans la file × durée médiane mesurée, arrondie aux 5 minutes supérieures, précédée de « environ » (L5-22).
- Aucun délai n'est garanti pour une génération. Le mot « garanti » n'apparaît dans aucune promesse (seule la « garantie légale de conformité » est citée, comme information due).

### 0.4 Règles appliquées partout

**Ton** (`MARQUE.md` § 4) :
- l'ami architecte qui relit le plan avec vous : précis, rassurant, honnête sur ses limites, jamais technique ;
- vouvoiement partout ; « nous » pour les engagements, « on » toléré dans les petites phrases d'interface ;
- au plus 20 mots par phrase dans l'interface ;
- pas de point d'exclamation, pas d'emoji, pas de capitales pour crier ;
- humour réservé à l'écran « chantier ».

**Vocabulaire** (`MARQUE.md` § 5) :
- côté client, l'unité est le **plan** (« votre premier plan est offert »), jamais le « crédit », qu'un acquéreur entend comme son prêt ;
- les cinq livrables, toujours dans cet ordre : plan 2D, maquette 3D, visite, photos, fiche ;
- jamais : IA, algorithme, modèle, rendu, serveur, pipeline, conforme, exact, certifié, garanti, au centimètre, révolutionnaire, magique, immersif, expérience, solution, plateforme, découvrez, vivez, comme si vous y étiez, bientôt, tous types de plans, photoréaliste, meublé (sauf pour dire que ce n'est pas fourni) ;
- l'intelligence artificielle est nommée clairement là où l'information est due : page Méthode (§ 9), FAQ « Comment le plan est-il lu ? », politique de confidentialité, CGU.

**Neutralité.** Sur Pièce ne conseille jamais d'acheter, d'annuler ni de se rétracter. Pour le contrat, il renvoie au notaire ou à l'ADIL du département.

**Prix.** TTC pour les particuliers, HT pour les pros, toujours précisé. Prix ronds, sans prix barré.

**Limites.** Elles s'affichent près de chaque bouton d'achat, lisibles :
- appartements sur un ou deux niveaux (duplex) ;
- logement vide, finitions supposées ;
- pas de mobilier ni de rendu photoréaliste ;
- illustration non contractuelle.

**Visuels.** Toute image du site montre l'**appartement témoin fictif** (`MARQUE.md` § 8.2 ; plan et relevé dans `references/temoin/`, versionné, R11), jamais un plan de promoteur réel. Captures non retouchées, qui ne montrent que ce que livre l'offre en vigueur (§ 0.7). Légende : « Appartement témoin fictif · Illustration non contractuelle ».

**Preuves.** Aucun témoignage, aucun nombre d'utilisateurs, aucune note, aucun logo tant qu'ils n'existent pas réellement, avec accord écrit. Voir § 10.

**Concurrents.** Aucun n'est nommé en public.

**Typographie.** Les textes sont écrits avec des espaces et apostrophes simples. Une passe automatique à l'intégration pose les espaces insécables (avant « : ; ? », dans « », entre nombre et unité), l'apostrophe typographique et les exposants (m²) (`MARQUE.md` § 5.3).

### 0.5 Faits utilisables, et où

| Fait vérifié | Formulation | Où |
|---|---|---|
| Sur PDF vectoriel, murs, cotes et échelle lus dans le fichier | « Sur le PDF du promoteur, les murs, les cotes et l'échelle sont lus directement dans le fichier. » | Partout |
| Sur image, une cote connue cale l'échelle, précision 5 à 10 cm | « Depuis une capture ou une photo du plan, vous indiquez une cote connue pour caler l'échelle. Comptez 5 à 10 cm d'écart possible. » | Partout (c'est aussi une limite) |
| Surfaces comparées au tableau du promoteur | « Les surfaces lues sont comparées au tableau du promoteur. Chaque écart vous est signalé. » | Partout |
| Visite de contrôle automatique avant publication | « Avant de vous être livrée, chaque visite est parcourue automatiquement à la recherche de défauts visibles. » | Partout |
| Délai de bout en bout | « ‹délai› », mesuré en production (§ 0.3). « 8 à 15 minutes », mesuré sur Mac avec carte graphique, n'est plus publié | Partout, [À MESURER] |
| 4 plans réels testés | « Testé sur 4 plans réels : T2 et T3, avec loggia, balcon ou façade en biais. » | Méthode, pages pros |
| 7 ouvertures sur 7, 6 équipements sur 6 | « Sur notre plan de référence, relevé à la main : 7 ouvertures sur 7 et 6 équipements sur 6 retrouvés. » | Méthode, pages pros |
| Toutes les cotes retrouvées sur les PDF testés | « Sur les PDF de promoteur de nos essais, toutes les cotes lues correspondent à celles du plan. » | Méthode seulement, avec son contexte, [À VALIDER : avocat]. Jamais dans un titre ni une publicité |
| Coût IA de 1,10 à 1,85 $ par plan | Aucune formulation publique | Investisseurs et partenaires seulement |

Chiffres de marché cités (source publique, datée) :
- prix moyen d'un 3 pièces neuf : 315 314 €, pour 65 m² (FPI, 2e trimestre 2026) ;
- offre de 87 619 logements et 21,4 mois d'écoulement ; 54 % de l'offre collective encore en projet (FPI, 2e trimestre 2026) ;
- ventes aux investisseurs particuliers : +13,4 % sur un an au 2e trimestre 2026, seul segment en hausse (FPI).

### 0.6 Mots-clés visés

Ce sont des **suggestions de saisie Google** relevées le 27/09/2026 (`marche.md` § 3.2). Aucun volume n'a été mesuré.

| Page | Mot-clé principal | Secondaires |
|---|---|---|
| Accueil | transformer plan 2d en 3d | plan appartement 3d, plan 3d a partir d un plan 2d, plan de vente appartement |
| Conseillers | visite 3d logement neuf (non suggéré, à tester) | plan 3d vefa, outil cgp immobilier neuf |
| Promoteurs | maquette 3d programme immobilier (non suggéré, à tester) | visite virtuelle programme neuf, 3d lot vefa |
| Marque blanche | visite 3d marque blanche immobilier (non suggéré) | — |
| Tarifs | prix plan 3d appartement | transformer plan 2d en 3d gratuit |
| Démonstration | appartement témoin | plan appartement 3d en ligne gratuit |
| Méthode | plan 3d a partir d un plan 2d | faire un plan 3d a partir d un plan 2d |
| Guides (§ 11) | vefa rétractation ; visite cloison vefa que vérifier ; coût tma vefa ; achat sur plan piège à éviter | contrat de reservation vefa retractation ; vefa plan non respecté ; modification plan vefa |

Longueurs : balise title de 60 signes au plus hors marque, meta description de 155 signes au plus.

### 0.7 Ce que contient chaque offre au lancement (R1, R2)

**Premier plan offert (aperçu).** Une page privée faite d'images prises par le serveur et de quelques textes filtrés. Ni le moteur de la visite ni les données du plan ne sont envoyés au navigateur : le verrou est côté serveur (D6, R4).
- la maquette 3D vue du dessus, découpée : première image produite, montrée en direct pendant l'attente ;
- le plan 2D coté, en image ;
- 2 photos : le séjour, puis la chambre principale, ou à défaut la pièce principale suivante ;
- les surfaces par pièce, comparées au tableau du promoteur ;
- les points à faire confirmer par le promoteur, jamais verrouillés ;
- [SI LIVRÉ : L6-13, et si le 360° est confirmé comme offre gratuite] la visite à 360°, d'arrêt en arrêt : on regarde autour de soi dans chaque pièce ;
- un lien d'aperçu pour les proches, valable 30 jours. L'aperçu reste en ligne 6 mois (R7).

**Visite débloquée (visite complète).** La visite se calcule dans le navigateur du client (D5).
- la visite à hauteur d'yeux : déplacement libre et arrêt dans chaque pièce ; [SI LIVRÉ : L4-16] la vue à 360° de chaque arrêt ;
- la maquette 3D et le plan 2D interactifs ;
- la fiche complète : surfaces, ouvertures, équipements, hypothèses ;
- le partage privé avec les proches ;
- les mêmes images que l'aperçu, sans galerie supplémentaire ;
- [SI LIVRÉ : L8-08] les téléchargements : images, plan 2D et fiche en PDF ;
- en ligne 24 mois (R7) **[À VALIDER : avocat]**.

**Règles d'écriture.**
- **Pas de galerie complète au lancement** (L13-02). « Environ 11 photos », « 8 autres photos », « les autres photos arrivent » ne s'écrivent nulle part. Les textes qui en dépendent portent [SI LIVRÉ : L13-02].
- **Photo omise.** Une photo qui échoue après nouvelles tentatives est omise, sans bloquer (R2). La galerie s'adapte, sans emplacement vide ; le client est prévenu (`attente.image.photo_omise`, `apercu.photos.omise`) et l'équipe alertée.
- **360°** (décision n° 15 du 27/09/2026) : tant que sa place n'est pas confirmée (offre gratuite ou non, L1-16), aucun texte ne le promet ; les textes qui le citent portent [SI LIVRÉ : L4-16] (visite) ou [SI LIVRÉ : L6-13] (aperçu). `offre.apercu.resume` et `offre.apercu.liste` auront une variante 360°, écrite quand l'utilisateur aura fixé le contenu gratuit (remplacement ou ajout). Nom public du mode : à décider (`MARQUE.md` § 13). Jamais « immersif » ni « comme si vous y étiez » (§ 0.4).
- **Publication** (R2) : rien n'est publié sans visite de contrôle réussie. L'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts ; les photos s'y ajoutent ensuite.
- **Décompte** (R2) : le plan offert est décompté à la publication de l'aperçu. Le déblocage payant ne relance aucune lecture : « sans nouvelle attente » reste vrai.
- **Mode simple** (R16, L4-11) : la visite montrée au client n'affiche ni « Rendu photoréaliste de la vue » ni la superposition du plan du promoteur, réservée au propriétaire du plan ou à l'accord du promoteur.
- **Catalogue** (R5, D7) : le contenu affiché est lu dans la version d'offre du catalogue (L5-08). Un achat garde le contenu promis au moment de l'achat (droits acquis).

**Textes partagés.** Même phrase partout où l'offre est résumée (accueil, dépôt, attente, volets) :

| Clé | Texte |
|---|---|
| `offre.apercu.resume` | Premier plan offert : la maquette 3D vue du dessus, le plan 2D coté et 2 photos. La visite s'ouvre ensuite pour 29 €. |
| `offre.apercu.resume.beta` | Pendant la phase de test, chaque personne invitée reçoit un plan offert. |
| `offre.apercu.liste` | La maquette 3D vue du dessus · le plan 2D coté · 2 photos : le séjour, puis la chambre principale ou une autre pièce · les surfaces comparées au tableau du promoteur · les points à faire confirmer |
| `offre.visite.liste` | La visite à hauteur d'yeux, pièce par pièce · la maquette 3D et le plan 2D interactifs · la fiche complète · le partage privé · les mêmes images · en ligne 24 mois |

### 0.8 Modes de publication (R13, R21)

| Mode | Où | Jusqu'à quand | Ce qui change |
|---|---|---|---|
| **[Liste d'attente]** | Vitrine | Ouverture à tous (L8-07) | Aucun dépôt depuis la vitrine : les boutons de dépôt mènent au formulaire de liste d'attente (L2-12). Aucun prix particulier affiché ni proposé : sections Prix masquées, lien « Tarifs » du menu masqué, `/tarifs` non publiée |
| **[Bêta]** | Application | Bêta fermée (lot 6), jusqu'à L8-07 | Dépôt réservé aux invités, avec un code d'invitation (§ 7.14). Aucun achat, aucune phrase qui propose 29 €, 15 € ou 59 € (R13). Le plan offert est celui de la variante « bêta » du catalogue : plan complet ou aperçu, selon L0-04. Les clés de variante finissent par `.beta` |
| **[Pré-lancement pro]** | Pages pros de la vitrine | Conseillers : essai en ligne (L9-02). Promoteurs : lot 10. Marque blanche : codes (L9-09) et instance (lot 11) | Les pages ne décrivent comme disponible que ce qui existe. Elles proposent un entretien, ou la bêta fondateurs (L2-18), jamais un essai en ligne (R21). Ce qui reste à construire est groupé sous le surtitre « EN PRÉPARATION », sans date |
| Ouvert | Partout | — | Textes sans marqueur |

- Le mode est un réglage (vitrine : `site.json`, L2-04 ; application : catalogue d'offres, L5-08), jamais un texte en dur.
- Aucune variante n'annonce de date ni n'écrit « bientôt » (`MARQUE.md` § 3.4).
- **Tests de variantes** (R8) : un prix ne se teste que par périodes, le même pour tous pendant la période, jamais tiré au sort par personne. Un texte peut être tiré côté serveur pour un compte connecté.

### 0.9 Adresses canoniques (R9, R20)

`SUIVI.md` et les tickets s'alignent sur ces adresses.

| Page | Adresse | Indexation |
|---|---|---|
| Accueil particuliers | `/` | Indexée |
| Conseillers | `/pro` | Indexée |
| Arrivée d'un pro depuis une visite | `/pro/decouvrir` (reprend la page conseillers, proposition de L2-04) | Indexée |
| Arrivée d'un particulier depuis un partage | `/offert` (reprend l'accueil ; son bouton suit le mode, L6-08) | Indexée |
| Promoteurs | `/promoteurs` | Indexée |
| Marque blanche et partenaires | `/marque-blanche` (pas `/partenaires`) | Indexée |
| Tarifs | `/tarifs` (publiée en mode ouvert, § 0.8) | Indexée |
| Appartement témoin | `/appartement-temoin` (pas `/demo`) | Indexée |
| Méthode | `/methode` | Indexée |
| Guides | `/guides/…` (§ 11) | Indexées |
| Pages légales | `/mentions-legales`, `/cgu`, `/cgv`, `/remboursement`, `/confidentialite`, `/traceurs`, `/signaler-un-contenu` (L2-11, L8-04) | Indexées |
| Application, aperçus, liens d'aperçu, visites, partages, intégrations | `app.<domaine>/…`, `visite.<domaine>/…` | `noindex` |

La vitrine est indexable dès sa mise en ligne, une fois le nom déposé (R20).

---

## 1. Accueil particuliers

**Adresse** : `/`

**Objectif.** Faire déposer un plan. Mesure principale : dépôts par visiteur. Mesure secondaire : ouvertures de la visite témoin. **[Liste d'attente]** : faire inscrire à la liste d'attente (L2-12).

**Visiteur type.**
- Un acquéreur en VEFA, souvent propriétaire occupant (80 % des ventes au détail en 2025, FPI), qui a réservé ou va réserver un T2 ou un T3.
- Il arrive par une recherche (« transformer plan 2d en 3d », « plan appartement 3d »), par un lien partagé par un proche, ou par une publicité.

**État d'esprit.**
- Il doute : « est-ce assez grand ? », « le lit passe-t-il ? », « ai-je bien choisi ? ».
- Il a du mal à se projeter à partir d'un plan coté.
- Il se méfie des gadgets et des promesses, et craint de payer pour rien ou de voir son plan circuler.
- Il est pressé s'il est dans ses 10 jours de rétractation.

**Balise title** (61 signes) : `Plan 2D en 3D et visite de votre appartement neuf | Sur Pièce`

**Meta description** (145 signes) : `Déposez le plan de vente de votre appartement neuf : plan 2D coté, maquette 3D, visite et photos, d'après les cotes du plan. Premier plan offert.`

**[Liste d'attente]** (153 signes) : `Le plan de vente de votre appartement neuf devient plan 2D coté, maquette 3D, visite et photos, d'après les cotes du plan. Inscrivez-vous pour l'essayer.`

**Mot-clé** : transformer plan 2d en 3d. Secondaires : plan appartement 3d, plan de vente appartement.

### 1.1 Premier écran : titre et dépôt

**Surtitre** : PLAN DE VENTE → VISITE 3D

**Titre (H1) retenu** : Visitez votre futur appartement, d'après son plan de vente.

**Variantes à tester** (une période de 3 semaines chacune, même texte pour tous pendant la période, mesure : dépôts par visiteur) :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Transformez le plan de votre appartement neuf en visite 3D. | Reprend la recherche « transformer plan 2d en 3d » : meilleure cohérence pour le trafic de recherche |
| B | Vous avez signé sur plan ? Jugez sur pièce. **[dépend du nom]** (Avant-Clés : « Vous avez signé sur plan ? Entrez chez vous avant les clés. ») | Parle au doute après la réservation : meilleure conversion sur le trafic « rétractation » |
| C | Entrez chez vous avant la remise des clés. | Promesse émotionnelle de projection |

**Sous-titre** : Déposez le plan de vente de votre appartement neuf. En ‹délai›, vous obtenez le plan 2D coté, la maquette 3D, la visite à hauteur d'yeux et les photos, d'après les cotes du plan.
Repli avant T0 : Déposez le plan de vente de votre appartement neuf. Vous obtenez le plan 2D coté, la maquette 3D, la visite à hauteur d'yeux et les photos, d'après les cotes du plan.

**Zone de dépôt** (dans le premier écran, sur ordinateur comme sur téléphone) :
- Titre de la zone : Glissez votre plan de vente ici
- Ligne d'aide : PDF du promoteur de préférence · PNG, JPG ou WebP acceptés · 40 Mo au plus
- Bouton principal : **Importer mon plan**
- Sur téléphone, le titre de la zone devient : Choisissez votre plan de vente

**[Liste d'attente]** La zone garde sa place et son tireté, et contient le formulaire de L2-12 :
- Titre de la zone : Essayez Sur Pièce avec votre plan de vente
- Texte : Nous ouvrons l'accès par petits groupes. Laissez votre e-mail pour recevoir une invitation.
- Bouton principal : **Demander une invitation** (remplace « Importer mon plan » sur toute la vitrine dans ce mode)
- Fichier lâché sur la page, jamais envoyé : Le dépôt est réservé aux personnes invitées. Laissez votre e-mail : l'invitation arrive par e-mail.

**Sous la zone, trois assurances** :
- Premier plan offert, sans carte bancaire.
- Votre plan reste privé : il n'est ni publié ni transmis à votre promoteur.
- Rien n'est décompté si la visite ne peut pas être produite.

**Ce qui est offert**, sous les assurances : `offre.apercu.resume` (§ 0.7). **[Liste d'attente]** : `offre.apercu.resume.beta`.

**Limites, sous les assurances** (texte courant, pas en petits caractères) :
Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · illustration non contractuelle.

**Lien secondaire** : Visiter d'abord l'appartement témoin →

**Visuel** : capture de la visite de l'appartement témoin fictif, séjour vers la loggia. Légende incrustée : « Appartement témoin fictif · Illustration non contractuelle ».

**Intégration.**
- Sur téléphone, un bouton « Importer mon plan » reste fixé en bas de l'écran après le premier écran.
- Le dépôt se fait **sans compte**. Le compte est demandé au lancement, après le message « Plan reconnu » (§ 7.1 et § 7.3).

### 1.2 Bandeau de trois faits

Trois colonnes, sous le premier écran :

- **PDF du promoteur.** Murs, cotes et échelle lus directement dans le fichier.
- **Capture ou photo.** Vous indiquez une cote connue pour caler l'échelle. Comptez 5 à 10 cm d'écart possible.
- **Surfaces comparées.** Les surfaces lues sont comparées au tableau du promoteur. Chaque écart vous est signalé.

Remplace le texte actuel de `pipeline/accueil.html`, dont « Précision au centimètre » est à retirer (`MARQUE.md` § 12).

### 1.3 Démonstration : l'appartement témoin

**Surtitre** : APPARTEMENT TÉMOIN

**Titre** : Faites le tour avant de déposer votre plan.

**Texte** : Voici un T3 d'environ 65 m² avec loggia, dessiné pour la démonstration. Il a été lu et vérifié comme le sera votre plan. Plan 2D, maquette 3D, visite et photos : c'est ce que vous obtenez avec la visite complète.

**Aperçu intégré** : la maquette 3D du témoin vue du dessus, avec deux vignettes (séjour, chambre principale) : les images que livre l'offre au lancement (§ 0.7), rien de plus.

**Boutons** :
- Entrer dans la visite (principal de la section, ouvre `/appartement-temoin`)
- Voir le plan 2D coté

**Légende** : Appartement témoin fictif · Illustration non contractuelle

Note : la surface « environ 65 m² » est celle prévue pour le témoin (`MARQUE.md` § 8.2, `references/temoin/`). Remplacer par la surface réelle une fois le plan créé.

### 1.4 Comment ça marche

**Surtitre** : EN TROIS ÉTAPES

**Titre** : Du plan de vente à la visite, sans rien redessiner.

**Étape 1 — Déposez votre plan de vente.**
Le PDF envoyé par le promoteur donne le meilleur résultat. Une capture ou une photo nette convient aussi. On vous dit tout de suite si le plan est pris en charge.

**Étape 2 — Nous le lisons et le vérifions.**
Murs, cotes, portes, fenêtres et équipements sont repris du plan. Les surfaces sont comparées au tableau du promoteur. Avant livraison, chaque visite est parcourue automatiquement à la recherche de défauts visibles.

**Étape 3 — Entrez chez vous.**
Comptez ‹délai›. Votre maquette vue du dessus s'affiche dès qu'elle est prête, et on vous prévient par e-mail. Premier plan offert : la maquette 3D vue du dessus, le plan 2D coté et 2 photos. La visite complète s'ouvre ensuite pour 29 €.
Repli avant T0 : la première phrase devient « Votre maquette vue du dessus s'affiche dès qu'elle est prête, et on vous prévient par e-mail. »
**[Liste d'attente]** : Votre maquette vue du dessus s'affiche dès qu'elle est prête, et on vous prévient par e-mail. Pendant la phase de test, chaque personne invitée reçoit un plan offert.

**Bouton** : Importer mon plan

### 1.5 Ce que vous obtenez

**Surtitre** : CE QUE VOUS RECEVEZ

**Titre** : Votre logement, pièce par pièce.

**Tableau comparatif** :

| | Premier plan offert | Visite complète · 29 € TTC |
|---|---|---|
| Maquette 3D | Vue du dessus, en image | À faire tourner, pièce par pièce |
| Plan 2D coté, surfaces par pièce | Oui, en image | Oui, interactif |
| Surfaces comparées au tableau du promoteur | Oui | Oui |
| Points à faire confirmer par le promoteur | Oui | Oui |
| Visite à hauteur d'yeux | — | Oui : déplacement libre et arrêt dans chaque pièce |
| Visite à 360°, d'arrêt en arrêt | [SI LIVRÉ : L6-13] Selon la décision sur l'offre gratuite | [SI LIVRÉ : L4-16] Oui |
| Photos | 2 : le séjour, puis la chambre principale ou une autre pièce | Les mêmes |
| Fiche : surfaces, ouvertures, équipements, hypothèses | — | Oui |
| Téléchargements | — | [SI LIVRÉ : L8-08] Images, plan 2D et fiche en PDF |
| Partage avec vos proches | Un lien d'aperçu, 30 jours | Des liens privés, que vous pouvez couper |
| En ligne | 6 mois | 24 mois **[À VALIDER : avocat]** (repli : 12 mois) |

**Sous le tableau** : Vous commencez par le plan offert. Si vous voulez la visite, elle s'ouvre tout de suite, sans nouvelle attente.

**[Liste d'attente]** : section masquée (elle affiche un prix, § 0.8).

**Bouton** : Importer mon plan

### 1.6 Fidélité et contrôle

**Surtitre** : FIDÈLE AU PLAN

**Titre** : Lu dans le plan, vérifié avant livraison.

**Texte** : Nous ne redessinons pas votre logement à l'œil. Nous lisons le plan que le promoteur vous a remis, et nous vous disons ce qui vient du plan et ce qui est supposé.

**Puces** :
- **Lu dans le fichier.** Sur le PDF du promoteur, les murs, les cotes et l'échelle sont lus directement dans le fichier.
- **Sur une image, calé par vous.** Depuis une capture ou une photo, vous indiquez une cote connue. Comptez 5 à 10 cm d'écart possible.
- **Surfaces comparées.** Chaque surface lue est comparée au tableau du promoteur. Chaque écart vous est signalé.
- **Vérifié avant livraison.** Chaque visite est parcourue automatiquement à la recherche de défauts visibles : une fente par laquelle on verrait dehors, une porte qu'on ne peut pas franchir, une pièce inaccessible. Une visite qui ne passe pas n'est pas livrée.
- **Honnête sur le reste.** Hauteurs, matériaux, couleurs et lumière sont supposés. Chaque point incertain est marqué « d'après le plan », « à vérifier » ou « hypothèse ».

**Lien** : Notre méthode en détail →

### 1.7 Quand s'en servir

**Surtitre** : À CHAQUE ÉTAPE DE VOTRE ACHAT

**Titre** : Pour décider sur plan en connaissance de cause.

**Carte 1 — Pendant vos 10 jours de rétractation.**
Vous venez de signer le contrat de réservation et le doute s'installe : la chambre est-elle assez grande, le séjour assez lumineux ? Voyez chaque pièce à hauteur d'yeux, avec ses cotes, en ‹délai›.
Repli avant T0 : « Voyez chaque pièce à hauteur d'yeux, avec ses cotes. »
Petit rappel : la loi vous laisse 10 jours pour vous rétracter. Ils courent à partir du lendemain de la première présentation de la lettre qui vous notifie le contrat (article L271-1 du Code de la construction et de l'habitation). **[À VALIDER : avocat]**
Sur Pièce ne vous dit pas s'il faut rester ou vous rétracter. Pour votre contrat, l'ADIL de votre département ou votre notaire peuvent vous répondre.

**Carte 2 — Avant de choisir vos TMA.**
Avant de demander à déplacer une cloison ou une prise, regardez le logement tel qu'il est dessiné. Le promoteur vous envoie un plan modificatif ? Visitez-le aussi : 15 € le plan suivant.
**[Liste d'attente]** : la dernière phrase devient « Visitez-le aussi, comme un nouveau plan. »

**Carte 3 — Avant la visite cloisons.**
Quand les cloisons sont posées, vous visitez le chantier. Venez avec les cotes et les surfaces de chaque pièce, d'après le plan de vente [SI LIVRÉ : imprimées depuis la fiche en PDF]. Pour vérifier ce qui est construit, seuls les plans annexés à votre contrat font foi.

**Carte 4 — Pour votre conjoint et votre famille.**
Envoyez-leur un lien privé : ils l'ouvrent depuis leur téléphone, sans créer de compte. Avec la visite complète, ils entrent dans le logement comme vous. Vous décidez à plusieurs, sur la même image.

**Carte 5 — Pour votre rendez-vous bancaire.** **[À VALIDER : avocat]** (le partage à un banquier sort peut-être du cercle de famille, `OFFRES.md` annexe B, question 6)
Montrez à votre conseiller bancaire le logement que vous financez : plan coté, surfaces et photos, sur votre écran.
Repli si l'avocat l'écarte : supprimer cette carte.

**Bouton** : Importer mon plan

### 1.8 Prix

**Surtitre** : PRIX

**Titre** : Payez au plan, sans abonnement. **[Prix : hypothèse]**

**Trois cartes** :

1. **Premier plan · offert**
   La maquette 3D vue du dessus, le plan 2D coté, 2 photos, les surfaces comparées au tableau du promoteur et les points à faire confirmer.
   Sans carte bancaire.
   Bouton : Importer mon plan

2. **Visite complète · 29 € TTC**
   Tout le plan offert, plus la visite à hauteur d'yeux, la maquette 3D et le plan 2D interactifs, la fiche complète et le partage privé [SI LIVRÉ : L8-08, et les téléchargements]. En ligne 24 mois.
   Bouton : Importer mon plan

3. **Comparer 3 lots · 59 € TTC**
   Trois visites complètes, pour choisir entre plusieurs lots ou comparer avec le plan modificatif.
   Bouton : Importer mon plan

**Sous les cartes** :
- Déjà un plan acheté ? Chaque plan suivant coûte 15 € TTC pendant 12 mois.
- Si la visite ne peut pas être produite, rien n'est décompté.
- Plans achetés et non utilisés : remboursés pendant 14 jours.

**Lien** : Tous les tarifs →
**Lien discret** : Vous vendez du neuf ? Sur Pièce Pro →

**[Liste d'attente]** : section masquée (§ 0.8).

### 1.9 Questions fréquentes

**Titre** : Vos questions avant de déposer votre plan

**La visite est-elle fidèle à mon plan ?**
Elle reprend les cotes de votre plan de vente. Sur le PDF du promoteur, murs, cotes et échelle sont lus dans le fichier. Les surfaces sont comparées au tableau du promoteur, et chaque écart vous est signalé. Avant livraison, chaque visite est vérifiée automatiquement à la recherche de défauts visibles. Ce que le plan ne dit pas (hauteur, matériaux, couleurs) est supposé, et marqué comme tel.

**Je n'ai qu'une capture d'écran ou une photo du plan. Ça marche ?**
Oui, si l'image est nette et fait au moins 700 pixels sur son petit côté. Vous cliquez les deux extrémités d'une cote connue et vous indiquez sa longueur : cela cale l'échelle. Comptez 5 à 10 cm d'écart possible. Si vous pouvez, demandez le PDF à votre conseiller commercial : c'est le meilleur point de départ.

**Qui voit mon plan ?**
Vous, et les personnes à qui vous envoyez un lien. Votre plan sert seulement à produire votre visite. Notre équipe ne l'ouvre qu'en cas d'échec ou de défaut signalé, pour le corriger **[À CONFIRMER : accès de l'équipe limité à ces cas]**. Nous ne le publions pas, nous ne le transmettons pas à votre promoteur, et nous ne l'utilisons ni pour nos démonstrations ni pour améliorer notre service sans votre accord écrit. [SI LIVRÉ : masquage du cartouche] Les noms et l'adresse du cartouche sont masqués avant la lecture. Vos liens de partage sont privés, absents des moteurs de recherche, et vous pouvez les couper à tout moment. Vous pouvez supprimer votre plan et votre compte quand vous voulez.

**Comment le plan est-il lu ?**
Par un programme d'intelligence artificielle, qui repère les murs, les portes, les fenêtres et les équipements. Des contrôles automatiques vérifient ensuite le résultat avant de vous le livrer. Nos fichiers sont hébergés dans l'Union européenne **[À CONFIRMER : hébergeur, `ARCHITECTURE.md` D2]** ; la lecture passe par un prestataire situé hors de l'Union, qui ne conserve pas votre plan après la lecture. **[À VALIDER : avocat]** [SI LIVRÉ : option « aucune conservation » activée, `juridique.md` § 3.3]

**La visite a-t-elle une valeur contractuelle ?**
Non. C'est une illustration générée automatiquement à partir du plan de vente. Seuls les plans et la notice descriptive annexés à votre contrat de vente font foi.

**Mon logement est un duplex ou une maison. Est-ce pris en charge ?**
Un duplex, oui : Sur Pièce prend en charge les appartements sur un ou deux niveaux, en PDF ou en image. Une maison, un logement sur plus de deux niveaux ou un plan d'étage avec plusieurs logements est refusé avant d'être lancé : rien n'est décompté. Vous pouvez laisser votre e-mail : nous vous écrirons si cela change. Nous n'annonçons pas de date.

**Combien de temps faut-il ?**
Comptez ‹délai›. La maquette vue du dessus s'affiche dès qu'elle est prête, puis le plan 2D et les photos. Vous pouvez fermer la page : on vous écrit dès que c'est prêt. Les jours de forte demande, un plan offert peut attendre son tour ; un plan payé passe en priorité.
Repli avant T0 : même réponse, sans la première phrase.
**[Liste d'attente]** : La maquette vue du dessus s'affiche dès qu'elle est prête, puis le plan 2D et les photos. Vous pouvez fermer la page : on vous écrit dès que c'est prêt.

**[Liste d'attente] Quand pourrai-je déposer mon plan ?** (question ajoutée dans ce mode)
Nous ouvrons l'accès par petits groupes, et nous n'annonçons pas de date. Laissez votre e-mail : l'invitation arrive par e-mail, avec un code d'invitation.

**Et si ça ne marche pas ? Suis-je remboursé ?**
- Si votre plan n'est pas pris en charge, il est refusé avant toute dépense.
- Si la visite ne peut pas être produite, ou si elle ne passe pas notre vérification, votre plan revient automatiquement sur votre compte. Si vous l'aviez payé, nous vous remboursons sur simple demande.
- Si vous voyez un défaut dans une visite livrée (un mur mal placé, une porte à l'envers), signalez-le. Nous visons une correction sous 5 jours ouvrés, sans frais ; à défaut, nous vous remboursons.
- Les plans achetés et non utilisés sont remboursés pendant 14 jours.
- Une visite livrée sans défaut n'est pas remboursée parce qu'elle ne plaît pas, sous réserve de vos garanties légales.

**Que contient le premier plan offert ?**
La maquette 3D vue du dessus, le plan 2D coté, deux photos (le séjour, puis la chambre principale ou, à défaut, une autre pièce), les surfaces par pièce comparées au tableau du promoteur et la liste des points à faire confirmer. Si une photo ne peut pas être prise, elle est omise et vous êtes prévenu ; le reste vous est livré. La visite à hauteur d'yeux n'en fait pas partie : elle s'ouvre pour 29 €, sans nouvelle attente. Un plan offert par personne et par plan.
**[Liste d'attente]** : les deux dernières phrases deviennent « Pendant la phase de test, chaque personne invitée reçoit un plan offert ; son contenu est précisé dans l'invitation. »

**Le logement est-il meublé ? Les finitions sont-elles les miennes ?**
Le logement est présenté vide. Les équipements dessinés sur le plan (cuisine, sanitaires) sont en place, parfois simplifiés. Sols, murs et couleurs sont supposés : ce ne sont pas ceux de votre notice.

**Puis-je montrer la visite à mes proches ?**
Oui. Vous créez un lien privé et l'envoyez à votre conjoint ou à votre famille. Ils l'ouvrent sans compte. En revanche, la visite ne se publie pas sur un réseau social ni dans une annonce : le plan appartient à son auteur.

**Sur quels appareils ?**
Ordinateur, tablette ou téléphone, dans un navigateur à jour, sans rien installer. [SI LIVRÉ : L4-12, seuils de L1-14 tenus] La visite s'adapte à votre appareil, même d'entrée de gamme, pour rester fluide. Si la 3D ne démarre pas sur un appareil, le plan 2D et les photos restent disponibles.

**Le promoteur m'a envoyé un plan modifié. Que faire ?**
Déposez-le comme un nouveau plan. Après un premier achat, chaque plan suivant coûte 15 € TTC pendant 12 mois.
**[Liste d'attente]** : seulement « Déposez-le comme un nouveau plan. »

**[Liste d'attente]** Les réponses qui citent un paiement (« Et si ça ne marche pas ? Suis-je remboursé ? ») gardent seulement les lignes sans achat : refus avant tout décompte, plan rendu en cas d'échec, correction des défauts sans frais.

**Sur Pièce peut-il me dire si je dois acheter ou me rétracter ?**
Non. Sur Pièce vous montre votre logement d'après le plan ; la décision vous appartient. Pour une question sur votre contrat, l'ADIL de votre département (conseil gratuit) ou votre notaire peuvent vous répondre.

### 1.10 Dernier appel

**Titre** : Votre plan de vente est dans vos e-mails. Déposez-le.

**Texte** : Premier plan offert, sans carte bancaire. ‹délai› plus tard, vous voyez votre logement.
Repli avant T0 : « Premier plan offert, sans carte bancaire. On vous écrit dès que votre logement est prêt. »

**Bouton** : Importer mon plan

**[Liste d'attente]** :
- Titre : Votre plan de vente est dans vos e-mails. Gardez-le sous la main.
- Texte : Nous ouvrons l'accès par petits groupes. Laissez votre e-mail pour recevoir une invitation.
- Bouton : Demander une invitation

**Limites** : Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · illustration non contractuelle.

---

## 2. Conseillers : Sur Pièce Pro

**Adresse** : `/pro`

**Objectif.** Faire démarrer l'essai de 14 jours. Mesure principale : essais démarrés. Mesure secondaire : demandes de démonstration en visio. **[Pré-lancement pro]** (jusqu'à L9-02) : obtenir un entretien ou une inscription à la bêta fondateurs (R21, L2-18).

**Visiteur type.**
- CGP et CIF qui vendent du neuf aux investisseurs (statut du bailleur privé), agents immobiliers, mandataires et commercialisateurs.
- Il arrive par une recherche, un réseau professionnel, un salon, ou parce qu'un client lui a montré une visite.

**État d'esprit.**
- Peu de temps, beaucoup de dossiers. Il veut savoir vite ce que ça lui rapporte en rendez-vous.
- Méfiant envers les outils de plus. Il craint de payer un abonnement qui dort.
- Attentif à sa conformité : communication non trompeuse, données de ses prospects, droits du promoteur.
- Il vend un marché difficile : il cherche à qualifier plus vite et à faire décider les indécis.

**Balise title** (58 signes) : `Visites 3D des lots neufs pour conseillers | Sur Pièce Pro`

**Meta description** (148 signes) : `CGP, agents, mandataires : envoyez à vos prospects la visite de chaque lot, d'après son plan de vente. Essai 14 jours, 3 plans, sans carte bancaire.`

**[Pré-lancement pro]** (154 signes) : `CGP, agents, mandataires : la visite de chaque lot, d'après son plan de vente, à envoyer à vos prospects. Offre en préparation : parlons-en en 30 minutes.`

**Mot-clé** : visite 3d logement neuf (non suggéré par Google, à tester). Secondaires : plan 3d vefa, outil cgp immobilier neuf.

### 2.1 Premier écran

**Surtitre** : SUR PIÈCE PRO · CONSEILLERS EN IMMOBILIER NEUF

**Titre (H1) retenu** : Envoyez la visite du lot, pas seulement son plan.

**Variantes à tester** (mesure : essais démarrés par visiteur) :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Vos acquéreurs jugent sur pièce, avant la première pierre. **[dépend du nom]** (Avant-Clés : « Vos acquéreurs entrent chez eux avant la première pierre. ») | Signature de marque, parle du client final |
| B | Qualifiez vos prospects sur une visite, pas sur un PDF. | Parle du bénéfice commercial direct |
| C | Chaque lot que vous vendez, en visite en ‹délai›. | Parle de rapidité et de volume ; pas testée avant T0 |

**Sous-titre** : Déposez le plan de vente d'un lot. Vous recevez son plan 2D coté, sa maquette 3D, sa visite et ses photos, vérifiés avant livraison. Envoyez le lien : votre prospect entre sans compte, et vous prévient d'un clic s'il est intéressé.

**Bouton principal** : Essayer 14 jours gratuitement
**Sous le bouton** : Sans carte bancaire · 3 plans complets · un essai par entreprise

**Bouton secondaire** : Voir une page de visite prospect → (ouvre la page prospect de démonstration, § 7.9, sur l'appartement témoin, au nom d'un cabinet fictif « Votre cabinet »)

**Visuel** : la page prospect du témoin sur un téléphone, avec le bouton « Je suis intéressé ». Légende : « Appartement témoin fictif · Illustration non contractuelle ».

**[Pré-lancement pro]** Tant que l'essai en ligne n'existe pas (L9-02), la page ne décrit comme disponible que ce qui existe (R21) :
- Sous-titre : Déposez le plan de vente d'un lot, recevez sa visite vérifiée avant livraison, et envoyez le lien à votre prospect. L'offre Pro est en préparation : nous la construisons avec les premiers conseillers.
- Bouton principal : **Demander un entretien** (ouvre le formulaire de L2-12, profil conseiller)
- Sous le bouton : 30 minutes en visio, sur l'appartement témoin. Sans engagement.
- Bouton secondaire : Rejoindre la bêta fondateurs (seulement si L0-05 retient le § 2.9) ; sinon : Visiter l'appartement témoin →
- « Voir une page de visite prospect → » : masqué tant que la page prospect de démonstration n'existe pas (L2-05).
- Visuel : une capture de la visite du témoin. Pas de capture d'une page qui n'existe pas (`MARQUE.md` § 8.4).
- § 2.3 à § 2.6 : sous le surtitre **EN PRÉPARATION**, précédés de « Voici ce que nous construisons avec les premiers conseillers. Rien n'est encore en vente. »
- § 2.7 (Formules) et § 2.8 (Essai) : masqués. § 2.10 (droits du promoteur) : toujours visible, sans la puce ni le lien sur les codes à offrir tant que L9-09 n'est pas livré.

### 2.2 Le constat

**Surtitre** : LE PLAN NE SUFFIT PLUS

**Titre** : Un prospect qui ne se projette pas remet sa décision à plus tard.

**Texte** :
Au 2e trimestre 2026, les ventes aux investisseurs particuliers progressent de 13,4 % sur un an, quand le reste du marché du neuf recule (FPI). Ces clients achètent un logement qui n'existe pas encore, parfois loin de chez eux. Le plan de vente est alors tout ce qu'ils voient.

**Trois cas** :
- **Le prospect qui hésite.** Il voit la pièce à hauteur d'yeux, avec ses cotes. Il tranche, dans un sens ou dans l'autre, et vous le savez plus tôt.
- **Le prospect qui achète à distance.** Il ne verra ni le quartier ni l'appartement témoin. Vous lui envoyez la visite de son lot, pas d'un lot type.
- **Le couple qui décide à deux.** Le lien circule entre eux. Vous présentez le même logement aux deux, sans refaire le rendez-vous.

Note (non publiée) : ne promettre aucune baisse des désistements. Aucun taux de désistement public n'a été trouvé (`marche.md` § 4.1) ; il sera mesuré avec les premiers conseillers (test T6).

### 2.3 Comment ça marche

**Surtitre** : EN QUATRE ÉTAPES

**Titre** : Du plan de vente au rendez-vous, en ‹délai›.
Repli avant T0 et **[Pré-lancement pro]** : « Du plan de vente au rendez-vous. »

1. **Déposez le plan du lot.** Le PDF du promoteur de préférence. Un plan non pris en charge est refusé avant d'être décompté.
2. **Recevez la visite vérifiée.** Plan 2D coté, maquette 3D, visite, [SI LIVRÉ : L4-16] vues à 360°, vue du dessus et 2 photos, et fiche des surfaces comparées au tableau du promoteur.
3. **Envoyez le lien.** Par e-mail, SMS ou messagerie. Votre prospect l'ouvre sans compte, depuis son téléphone. [SI LIVRÉ : QR code pour vos plaquettes.]
4. **Votre prospect vous fait signe.** Un bouton « Je suis intéressé, prévenir mon conseiller » vous envoie une notification. C'est lui qui la déclenche.

**Bouton** : Essayer 14 jours gratuitement

### 2.4 Les liens de visite

**Surtitre** : LIENS DE VISITE

**Titre** : Une page à votre nom pour chaque lot.

**Puces** :
- **Sans compte pour le prospect.** Il ouvre le lien et entre dans la visite. Rien à installer.
- **À vos couleurs.** Votre logo, votre nom, votre téléphone et votre e-mail sur la page.
- **Autant de liens que vous voulez.** Un par prospect ou un par lot, sans limite.
- **Privés.** Liens impossibles à deviner, absents des moteurs de recherche, que vous coupez quand vous voulez. Expiration réglable, 90 jours par défaut.
- **En rendez-vous et en visio.** La visite s'ouvre en plein écran : vous la parcourez avec votre client.
- **Sans prix affiché.** La page n'affiche pas de prix. Si vous en ajoutez un, les mentions d'une annonce et vos honoraires sont à votre charge.
- **Mention non contractuelle, toujours.** Elle protège votre client et vous protège. Elle ne se retire pas.
- **Le plan du promoteur n'apparaît jamais.** Seule la visite est partagée.

### 2.5 Savoir qui est intéressé, dans les règles

**Surtitre** : SUIVI RESPECTUEUX

**Titre** : Le bon signal, sans pister vos prospects.

**Texte** : Un lien envoyé à un prospect peut servir à le suivre. La CNIL encadre ces liens. Nous avons donc choisi des signaux clairs, que votre prospect maîtrise.

**Puces** :
- **Compteur d'ouvertures par lot.** Combien de fois la visite a été ouverte, et quand pour la dernière fois.
- **Bouton « Je suis intéressé ».** Votre prospect vous prévient d'un clic, avec un message s'il le souhaite. C'est le meilleur signal de qualification, et c'est lui qui l'envoie.
- **Détail de la visite, avec son accord.** Formules Cabinet et Équipe : si votre prospect l'accepte sur la page, vous voyez la durée et les pièces vues. **[À VALIDER : avocat]**
- **Aucun pixel de suivi dans vos e-mails.** Rien n'est caché dans vos messages.
- **Vous restez maître des données de vos prospects.** Nous les traitons pour votre compte, avec un contrat de sous-traitance fourni.

### 2.6 Réglages personnalisés

**Surtitre** : À VOTRE MAIN

**Titre** : Des réglages prêts, déjà testés.

**Texte** : Chaque réglage est vérifié sur nos plans de référence avant d'être proposé. Vos visites restent contrôlées de la même façon.

**Puces** :
- Toutes les formules : logo, coordonnées, expiration des liens par défaut.
- Cabinet : couleurs du cabinet, texte d'accueil, lien de prise de rendez-vous, choix et ordre des photos, dossiers par programme et par client [SI LIVRÉ : fiche PDF du lot à vos couleurs].
- Équipe : hauteur sous plafond par défaut quand le plan ne la donne pas (affichée comme hypothèse), vue d'accueil, photos à produire, statistiques par programme, visites intégrées à votre site.
- Sur devis : un réglage de lecture sur mesure, vérifié sur nos plans de référence avant activation.

### 2.7 Formules

**Surtitre** : FORMULES

**Titre** : Des plans inclus chaque mois, sans engagement. **[Prix : hypothèse]**

**Tableau** (prix HT, TVA de 20 % en sus) :

| | Solo | Cabinet | Équipe |
|---|---|---|---|
| Prix mensuel | 49 € HT | 99 € HT | 199 € HT |
| En annuel | 490 € HT (10 mois payés) | 990 € HT | 1 990 € HT |
| Plans inclus par mois | 5 | 12 | 30 |
| Utilisateurs | 1 | 3 | 10, avec des rôles |
| 5 plans en plus | 45 € HT | 40 € HT | 35 € HT |
| Liens de visite | Illimités | Illimités | Illimités |
| Bouton « Je suis intéressé » | Oui | Oui | Oui |
| Couleurs, texte d'accueil, rendez-vous | — | Oui | Oui |
| Détail des visites, avec consentement | — | Oui | Oui |
| Réglages par défaut des nouvelles visites | — | — | Oui |
| Visites intégrées à votre site | — | — | Oui |
| Support | 2 jours ouvrés | 2 jours ouvrés | 1 jour ouvré |
| Bouton | Choisir Solo | Choisir Cabinet | Choisir Équipe |

**Sous le tableau** :
- Les plans non utilisés d'un mois restent disponibles le mois suivant.
- Une visite qui échoue ou qu'il faut refaire après un défaut n'est pas décomptée.
- Utilisateur supplémentaire : 10 € HT par mois.
- Résiliation en ligne à tout moment, effective en fin de mois. Vos liens restent actifs 90 jours après.
- Réseau d'agences ou de conseillers : sous-comptes, facture unique. Bouton : Nous contacter

### 2.8 Essai

**Surtitre** : ESSAI

**Titre** : 14 jours, 3 lots, sans carte bancaire.

**Puces** :
- 3 plans complets, avec les fonctions Cabinet.
- Aucune carte demandée. Un essai par entreprise, vérifié par votre SIREN.
- Vos liens restent actifs 30 jours après l'essai, et repartent dès votre abonnement.
- Sur demande, une démonstration de 30 minutes en visio : nous lançons l'un de vos lots au début de l'appel.

**Boutons** : Essayer 14 jours gratuitement · Demander une démonstration

### 2.9 Bêta fondateurs (bloc optionnel, pendant la bêta seulement)

**Titre** : Les 30 premiers cabinets : 30 % de remise pendant 6 mois.

**Texte** : En échange, un entretien de 30 minutes par mois pour nous dire ce qui manque. Offre ouverte jusqu'au {date} ou jusqu'au 30e cabinet. **[Prix : hypothèse]**

**Bouton** : Rejoindre la bêta fondateurs

**Sous le bouton** [Pré-lancement pro] : Une inscription, pas un achat : nous vous recontactons pour un premier entretien.

Note : la durée de l'entretien (30 minutes) est une proposition ; `OFFRES.md` § 3.10 dit « un entretien mensuel ». Retirer le bloc à la fin de la bêta ; ne jamais le présenter comme une remise permanente. En pré-lancement, le bouton ouvre le formulaire de L2-12 (profil conseiller) : aucun paiement, aucune remise appliquée avant l'ouverture de l'offre (R21).

### 2.10 Les droits du promoteur

**Surtitre** : À SAVOIR AVANT D'ENVOYER

**Titre** : Pour diffuser une visite, il faut l'accord du promoteur.

**Texte** :
Un plan de vente est une œuvre de son architecte, dont le promoteur détient en général les droits. En faire une visite et l'envoyer à des prospects, c'est une diffusion commerciale : elle demande l'autorisation du promoteur. Votre convention de commercialisation la prévoit parfois.

**Puces** :
- Avant le premier lien d'un programme, vous confirmez disposer de cette autorisation.
- Le document n'est pas demandé, mais gardez-le.
- Votre client dépose lui-même son plan pour son usage privé ? Offrez-lui un code : il obtient sa visite, et vous ne diffusez rien. **[À VALIDER : avocat]**
- [SI LIVRÉ : portail distributeurs] Votre promoteur utilise Sur Pièce Programme ? Il peut vous autoriser directement : vous envoyez ses visites sans consommer vos plans.

**Lien** : Offrir la visite à vos clients →

### 2.11 Questions fréquentes (conseillers)

**Mon prospect doit-il créer un compte ?**
Non. Il ouvre le lien et entre dans la visite, depuis son téléphone ou son ordinateur.

**Puis-je savoir si mon prospect a ouvert le lien ?**
Vous voyez le nombre d'ouvertures par lot et la date de la dernière. Votre prospect peut vous prévenir d'un clic avec le bouton « Je suis intéressé ». En Cabinet et en Équipe, s'il l'accepte sur la page, vous voyez aussi la durée et les pièces vues. **[À VALIDER : avocat]**

**Ai-je le droit d'envoyer la visite d'un lot ?**
Oui, si vous avez l'autorisation du promoteur, par exemple dans votre convention de commercialisation. Vous le confirmez avant le premier lien d'un programme.

**Et si le plan n'est pas pris en charge ?**
Il est refusé avant d'être décompté. Aujourd'hui, Sur Pièce prend en charge les appartements sur un ou deux niveaux (duplex).

**Et si une visite a un défaut ?**
Signalez-le depuis la visite. Nous la refaisons sans décompter de plan. Chaque défaut confirmé devient un contrôle automatique, pour qu'il ne revienne pas.

**Les visites sont-elles meublées ?**
Non : le logement est présenté vide, avec les équipements du plan. Nous ne vendons une fonction qu'une fois qu'elle existe et qu'elle est contrôlée.

**Puis-je écrire mes propres consignes de lecture ?**
Non. Vous choisissez parmi des réglages prêts et testés. Un réglage sur mesure est possible sur devis, vérifié sur nos plans de référence avant activation.

**Que deviennent mes liens si j'arrête ?**
Ils restent actifs 90 jours, et vous pouvez tout exporter. Pour les garder en ligne sans nouveau plan, la formule Veille coûte 9 € HT par mois.

**Comment suis-je facturé ?**
Par carte ou prélèvement SEPA, chaque mois ou chaque année. Factures HT avec TVA, à votre SIREN.

**Qui est responsable des données de mes prospects ?**
Vous. Nous les traitons pour votre compte, selon un contrat de sous-traitance (article 28 du RGPD) fourni avec l'abonnement.

**[Pré-lancement pro]** Les questions sur l'essai, la facturation et l'arrêt sont masquées. Question ajoutée en tête :

**L'offre Pro est-elle ouverte ?**
Pas encore : nous la construisons avec les premiers conseillers, et nous n'annonçons pas de date. En 30 minutes de visio, nous vous montrons la visite de l'appartement témoin et nous écoutons ce qui servirait à vos rendez-vous.

### 2.12 Dernier appel

**Titre** : Votre prochain rendez-vous commence par une visite.

**Texte** : 14 jours, 3 lots, sans carte bancaire. Si ça ne vous sert pas, vous n'avez rien à résilier.

**Boutons** : Essayer 14 jours gratuitement · Demander une démonstration

**[Pré-lancement pro]** :
- Titre : Construisons Sur Pièce Pro avec vous.
- Texte : 30 minutes en visio, sur l'appartement témoin. Dites-nous ce qui servirait à vos rendez-vous.
- Boutons : Demander un entretien · Rejoindre la bêta fondateurs (si L0-05 retient le § 2.9)

---

## 3. Promoteurs : Sur Pièce Programme

**Adresse** : `/promoteurs`

**Objectif.** Obtenir une demande de démonstration ou de rapport de prise en charge. Mesure : formulaires envoyés. **[Pré-lancement pro]** (jusqu'au lot 10) : obtenir une demande de démonstration seulement (R21).

**Visiteur type.**
- Directeur commercial ou marketing d'un promoteur, responsable digital, responsable d'une chambre régionale.
- Il arrive par une prospection, une chambre de la FPI, un salon, ou un distributeur qui utilise Sur Pièce Pro.

**État d'esprit.**
- Pression sur l'écoulement : 87 619 logements en offre et 21,4 mois pour les vendre au rythme actuel (FPI, 2e trimestre 2026).
- Il a déjà des perspectives et quelques lots types en 3D. Il se demande ce que ça ajoute.
- Il craint pour ses plans (droits, confidentialité), pour son image (un défaut visible sur son site), pour ses délais et pour la conformité RGPD de son site.
- Il achète sur devis, après un pilote, avec des critères écrits.

**Balise title** (55 signes) : `Visite 3D de chaque lot d'un programme neuf | Sur Pièce`

**Meta description** (155 signes) : `Promoteurs : chaque lot de votre programme en plan 2D, maquette 3D, visite et photos, sur votre site. Rapport de prise en charge offert, pilote de 40 lots.`

**[Pré-lancement pro]** (134 signes) : `Promoteurs : chaque lot de votre programme en plan 2D, maquette 3D, visite et photos. Offre en préparation : parlons-en en 30 minutes.`

**Mot-clé** : maquette 3d programme immobilier (non suggéré, à tester). Secondaires : visite virtuelle programme neuf, 3d lot vefa.

### 3.1 Premier écran

**Surtitre** : SUR PIÈCE PROGRAMME · PROMOTEURS

**Titre (H1) retenu** : Chaque lot se visite, pas seulement l'appartement témoin.

**Variantes à tester** (mesure : formulaires envoyés) :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Tous les lots de votre programme en visite, pas quelques lots types. | Argument de couverture, le plus concret |
| B | Vos plans de vente deviennent des visites, lot par lot, sur votre site. | Parle du livrable et de l'intégration |
| C | Vos acquéreurs jugent sur pièce, lot par lot. **[dépend du nom]** (Avant-Clés : « Vos acquéreurs entrent dans leur lot avant les clés. ») | Signature de marque |

**Sous-titre** : À partir de vos plans de vente, chaque lot reçoit son plan 2D coté, sa maquette 3D, sa visite et ses photos, vérifiés avant livraison. Intégrés à votre site, à vos couleurs.

**Bouton principal** : Demander une démonstration
**Bouton secondaire** : Recevoir le rapport de prise en charge

**Sous les boutons** : Rapport offert : vous savez quels lots sont pris en charge avant tout devis.

**[Pré-lancement pro]** Tant que l'import d'un programme n'existe pas (lot 10), la page ne décrit comme disponible que ce qui existe (R21) :
- Sous-titre : À partir de vos plans de vente, chaque lot reçoit son plan 2D coté, sa maquette 3D et sa visite, vérifiés avant livraison. L'offre Programme est en préparation : nous la construisons avec les premiers promoteurs.
- Bouton principal : **Demander une démonstration**. Sous le bouton : 30 minutes en visio, sur l'appartement témoin. Sans engagement.
- Bouton secondaire « Recevoir le rapport de prise en charge » et ligne « Rapport offert » : masqués.
- § 3.3, § 3.5, § 3.6 et § 3.7 : sous le surtitre **EN PRÉPARATION**, précédés de « Voici ce que nous construisons avec les premiers promoteurs. Rien n'est encore en vente. » ; délais et engagements chiffrés masqués (L2-06).
- § 3.8 (confiance) : seules les puces vraies aujourd'hui (licence, pas de vitrine sans accord, données).
- § 3.9 : la case « rapport de prise en charge » est masquée ; aucun plan de promoteur n'est demandé avant l'avis de l'avocat (L2-06, L0-07).

### 3.2 Le constat

**Surtitre** : LE LOT TYPE NE SUFFIT PAS

**Titre** : Vos acquéreurs achètent un lot précis, pas un lot type.

**Texte** :
Souvent, seuls quelques lots types ont leur 3D ; les autres n'ont qu'un plan PDF. Or chaque acquéreur se demande comment sera son logement à lui : la disposition de ses pièces, sa loggia, ses fenêtres.
54 % de l'offre de logements collectifs est encore en projet (FPI, 2e trimestre 2026). La vente se fait sur plan : c'est le plan qu'il faut rendre lisible.

### 3.3 Ce que vous obtenez

**Surtitre** : LIVRABLES

**Titre** : Par lot et par programme.

**Pour chaque lot** :
- plan 2D coté, maquette 3D, visite à hauteur d'yeux, [SI LIVRÉ : L4-16] vues à 360°, vue du dessus et 2 photos ;
- fiche des surfaces, comparées à votre tableau ;
- [SI LIVRÉ : L8-08] images en haute définition pour vos plaquettes, avec la mention non contractuelle ;
- la superposition de votre plan d'origine, sur vos propres pages.

**Pour le programme** :
- une page programme avec la liste des lots, filtrable ;
- la visite intégrée à votre site, limitée aux domaines que vous déclarez ;
- un lien acquéreur par lot, à envoyer au réservataire, avec la mention « offert par » suivie de votre nom ;
- des liens pour votre force de vente ;
- des statistiques agrégées : ouvertures par lot, lots les plus vus ;
- votre logo et vos couleurs ;
- l'export de vos maquettes, photos et visites à tout moment.
- [SI LIVRÉ : portail distributeurs] Un portail pour vos commercialisateurs et CGP : ils envoient les visites de vos lots, avec votre autorisation.

### 3.4 Qualité

**Surtitre** : FIDÈLE AU PLAN

**Titre** : Lu dans vos fichiers, vérifié avant livraison.

**Puces** :
- Sur vos PDF vectoriels, les murs, les cotes et l'échelle sont lus directement dans le fichier.
- Les surfaces lues sont comparées à votre tableau. Chaque écart est signalé.
- Chaque visite est parcourue automatiquement à la recherche de défauts visibles avant d'être publiée. Une visite qui ne passe pas n'est pas publiée.
- Testé sur 4 plans réels : T2 et T3, avec loggia, balcon ou façade en biais.
- Sur notre plan de référence, relevé à la main : 7 ouvertures sur 7 et 6 équipements sur 6 retrouvés.
- Chaque défaut confirmé devient un contrôle automatique.
- Vos équipes contrôlent chaque livraison sous 10 jours. Un défaut de notre fait est toujours corrigé sans frais ; 2 cycles de correction sont inclus pour vos demandes de modification.

**Lien** : Notre méthode en détail →

### 3.5 Déroulé et délais

**Surtitre** : DÉROULÉ

**Titre** : Du dossier de plans aux visites en ligne.

1. **Vous nous transmettez les plans de vente du programme.** Par un lien sécurisé. **[À VALIDER : avocat]** (licence nécessaire dès le rapport ?)
2. **Rapport de prise en charge, offert.** La liste des lots pris en charge et des lots non pris en charge. Les seconds ne sont pas facturés.
3. **Devis à prix ferme**, sur les seuls lots pris en charge.
4. **Signature de la licence sur vos plans**, limitée à la fabrication, à l'hébergement et à la diffusion pour votre compte.
5. **Livraison.** Visée à 5 jours ouvrés pour 50 lots, après réception de plans exploitables. Le PDF vectoriel donne le meilleur résultat.
6. **Contrôle par vos équipes** sous 10 jours, puis 2 cycles de correction pour vos demandes de modification. Nos défauts sont corrigés sans frais, sans limite.
7. **Mise en ligne** sur votre site, avec 24 mois d'hébergement inclus.

**Note sous le déroulé** : Nous nous engageons sur le délai d'un programme, pas sur celui de chaque lot pris isolément.

Aujourd'hui, Sur Pièce prend en charge les appartements sur un ou deux niveaux (duplex). Les autres lots figurent dans le rapport comme non pris en charge.

### 3.6 Prix

**Surtitre** : PRIX

**Titre** : Un pilote, puis un prix au lot. **[Prix : hypothèse]**

**Pilote** :
- 600 € HT pour un programme de 40 lots au plus.
- Livraison visée en 5 jours ouvrés, intégration à votre site, 24 mois d'hébergement.
- Critères écrits d'avance : surfaces identiques à votre tableau, aucun défaut visible, délai tenu, avis de votre équipe commerciale.
- Déduit de votre commande si elle est signée dans les 3 mois.

**Au lot** (volume livré sur 12 mois glissants) :

| Lots | Prix par lot |
|---|---|
| 1 à 49 | 25 € HT |
| 50 à 199 | 20 € HT |
| 200 et plus, avec engagement annuel | 15 € HT |

**Sous le tableau** :
- Commande minimale : 10 lots ou 250 € HT.
- 24 mois d'hébergement inclus, puis 3 € HT par lot et par an.
- Nouvelle version d'un lot (plan modificatif, TMA d'un acquéreur) : la moitié du prix du lot, 10 € HT au minimum.
- Correction d'un défaut de notre fait : gratuite, sans limite.
- Petit programme, sans besoin d'engagement de service ? La formule Équipe (199 € HT par mois, 30 lots) peut suffire.

### 3.7 Engagements de service

**Titre** : Des engagements écrits.

| Point | Engagement |
|---|---|
| Disponibilité des visites publiées | 99,5 % par mois, hors maintenance annoncée 48 h à l'avance |
| Livraison | 5 jours ouvrés pour 50 lots, après réception de plans exploitables |
| Qualité | Contrôle par vos équipes sous 10 jours ; 2 cycles de correction pour vos demandes de modification ; défaut de notre fait corrigé sans frais, sans limite |
| Support | Heures ouvrées, réponse sous 1 jour ouvré ; incident bloquant : 4 heures ouvrées |
| Pénalités | Avoir de 5 % par tranche de 0,5 % sous l'objectif, plafonné à 20 % du mois |

### 3.8 Sécurité, données et droits

**Surtitre** : CONFIANCE

**Titre** : Vos plans restent à vous.

**Puces** :
- **Licence limitée.** Vous nous autorisez à fabriquer, héberger et diffuser les visites pour votre compte, rien de plus.
- **Pas de vitrine sans accord.** Nous ne citons jamais votre programme comme référence sans votre accord écrit.
- **Données dans l'Union européenne.** Plans et visites y sont hébergés **[À CONFIRMER : choix de l'hébergeur, `ARCHITECTURE.md` D2]**. La lecture des plans passe par un prestataire hors UE, sans conservation après la lecture [SI LIVRÉ : option « aucune conservation » activée]. Lecture dans l'UE en option.
- **Contrat de sous-traitance** (article 28 du RGPD) et réversibilité : export de tout, à tout moment.
- **Aucun traceur dans la visite intégrée.** Vous mesurez l'audience avec vos propres outils, sous votre propre bandeau de consentement.
- **Diffusion maîtrisée.** Visites limitées à vos domaines, liens privés et révocables.
- **Options entreprise** : connexion unique (SSO), facture électronique.

### 3.9 Formulaire de demande de démonstration

**Titre** : Voyons vos plans ensemble.

**Texte** : 30 minutes en visio. Nous vous montrons une visite de bout en bout et répondons à vos questions sur les droits, les délais et l'intégration.

**Champs** :
- Prénom (obligatoire)
- Nom (obligatoire)
- Société (obligatoire)
- Fonction (obligatoire)
- E-mail professionnel (obligatoire)
- Téléphone (facultatif)
- Nombre de lots à mettre en visite sur 12 mois (obligatoire) : Moins de 50 · 50 à 199 · 200 et plus · Je ne sais pas encore
- Ce que vous voulez faire (cases, facultatif) : Visites sur notre site · Liens pour nos réservataires · Outil pour nos distributeurs · Autre
- Votre message (facultatif). Aide : « Programme, calendrier de commercialisation, contraintes particulières. »

**Case facultative** (non cochée) : Je veux recevoir aussi le rapport de prise en charge : envoyez-moi le lien sécurisé pour déposer nos plans.

**Mention sous le formulaire** : Vos coordonnées servent seulement à vous répondre. Elles ne sont ni vendues ni partagées. En savoir plus : Politique de confidentialité.

**Bouton** : Demander une démonstration

**Confirmation** : Merci. Nous vous répondons sous 1 jour ouvré pour fixer un créneau.

**Erreurs** :
- Champ vide : Ce champ est nécessaire pour vous répondre.
- E-mail invalide : Cette adresse e-mail semble incomplète.
- Envoi impossible : Votre demande n'est pas partie. Réessayez, ou écrivez-nous à promoteurs@surpiece.fr.

### 3.10 Questions fréquentes (promoteurs)

**Quels fichiers faut-il ?**
Les plans de vente de chaque lot, en PDF vectoriel de préférence : murs, cotes et échelle y sont lus directement. Les images sont acceptées.

**Que deviennent les lots non pris en charge ?**
Ils figurent dans le rapport et ne sont pas facturés. Aujourd'hui, Sur Pièce prend en charge les appartements sur un ou deux niveaux (duplex).

**Pouvons-nous montrer notre plan d'origine dans la visite ?**
Oui, sur vos propres pages : vous en détenez les droits. Il n'apparaît jamais sur les liens envoyés par des tiers.

**Comment intégrer les visites à notre site ?**
Votre équipe web colle un code d'intégration (iframe) dans la page du programme. Il ne fonctionne que sur les domaines que vous déclarez. La visite n'y dépose aucun traceur ; elle signale les ouvertures et les pièces vues à votre page, que vous mesurez avec vos outils.

**L'architecte modifie un plan. Que se passe-t-il ?**
Nous produisons une nouvelle version du lot, à la moitié de son prix, 10 € HT au minimum.

**Proposez-vous la visite de la résidence entière, ou un configurateur de TMA ?**
Pas aujourd'hui. Sur Pièce produit la visite de chaque logement.

**Nos équipes peuvent-elles se connecter avec leurs identifiants habituels ?**
Oui, en option : connexion unique (SSO), sur devis.

**Vous engagez-vous sur les délais ?**
Oui, sur le délai d'un programme : 5 jours ouvrés pour 50 lots après réception de plans exploitables. Pas sur celui de chaque lot pris isolément.

### 3.11 Dernier appel

**Titre** : Commencez par le rapport. Il est offert.

**Texte** : Vous savez quels lots sont pris en charge avant de recevoir un devis.

**Boutons** : Demander une démonstration · Recevoir le rapport de prise en charge

**[Pré-lancement pro]** :
- Titre : Voyons ensemble ce que vos acquéreurs verraient.
- Texte : 30 minutes en visio, sur l'appartement témoin. Nous construisons l'offre Programme avec les premiers promoteurs.
- Bouton : Demander une démonstration

---

## 4. Marque blanche et partenaires

**Adresse** : `/marque-blanche`

**Objectif.** Obtenir une demande de présentation (instance) ou une commande de codes. Mesure : formulaires envoyés.

**Visiteur type.**
- Codes à offrir : services d'accompagnement de l'acquéreur VEFA, courtiers, conseillers et promoteurs qui veulent offrir la visite.
- Instance : réseaux de mandataires, commercialisateurs, groupements de CGP, groupes de promotion.

**État d'esprit.**
- Il cherche un service de plus à proposer à ses clients, sous sa marque, sans développement.
- Il veut garder la relation client et la maîtrise de sa marque.
- Il craint un engagement lourd et une responsabilité sur la qualité.

**Balise title** (56 signes) : `Visite 3D en marque blanche, immobilier neuf | Sur Pièce`

**Meta description** (139 signes) : `Offrez la visite 3D du logement à vos clients, ou proposez-la sous votre marque, sur votre domaine. Codes à offrir par 10, instance dédiée.`

**Mot-clé** : visite 3d marque blanche immobilier (non suggéré, à tester).

### 4.1 Premier écran

**Surtitre** : PARTENAIRES ET MARQUE BLANCHE

**Titre (H1) retenu** : La visite du logement neuf, offerte par vous ou sous votre marque.

**Variantes à tester** :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Offrez à vos clients la visite de leur futur logement. | Entrée la plus simple : les codes |
| B | Vos clients visitent leur logement neuf, sur votre site, à votre nom. | Entrée instance |
| C | Un service de plus pour vos acquéreurs, sans une ligne de développement. | Parle de l'effort évité |

**Sous-titre** : Deux façons de travailler ensemble : des codes à offrir, pour commencer dès demain ; une instance à votre marque, sur votre domaine.

**Boutons** : Commander des codes · Demander une présentation

**[Pré-lancement pro]** Tant que les codes (L9-09) et l'instance (lot 11) n'existent pas (R21) :
- Meta description (134 signes) : `Offrez la visite 3D du logement neuf à vos clients, ou proposez-la sous votre marque. Offre en préparation : parlons-en en 30 minutes.`
- Sous-titre : Deux façons de travailler ensemble sont en préparation : des codes à offrir, et une instance à votre marque, sur votre domaine. Parlons-en.
- Boutons : **Demander une présentation** · Parler des codes à offrir (même formulaire, « Codes à offrir » pré-rempli ; aucune commande ni paiement)
- § 4.2 et § 4.3 : sous le surtitre **EN PRÉPARATION** ; « pour commencer dès demain » et « Nous ouvrons les instances une par une » masqués (L2-07).

### 4.2 Codes à offrir

**Titre** : Offrez la visite complète à vos clients.

**Texte** : Chaque code donne un plan complet : plan 2D coté, maquette 3D, visite, photos et fiche. Votre client dépose lui-même son plan, sur une page d'accueil à votre logo.

**Puces** :
- 15 € HT le code, par lots de 10. 12 € HT dès 50 codes, par facture et virement. **[Prix : hypothèse]**
- Valable 12 mois, non revendable.
- Pour l'usage privé de votre client : vous ne diffusez rien.
- Gratuit pour lui, sans carte bancaire.

**Bouton** : Commander des codes

### 4.3 Instance à votre marque

**Titre** : Sur Pièce, à votre nom, sur votre domaine.

**Ce que vous personnalisez** :
- votre domaine (par exemple visite.votresite.fr) ;
- votre logo, votre couleur et votre nom sur chaque page et dans chaque e-mail ;
- votre bandeau de consentement et vos mentions légales.

**Ce qui reste fixe, pour votre protection** :
- la mention « illustration non contractuelle », sur chaque photo et dans chaque visite ;
- la vérification automatique avant chaque livraison ;
- l'accessibilité : votre couleur est contrôlée, et ajustée si le texte devient illisible.

**Prix** **[Prix : hypothèse]** :
- Mise en place : 1 500 € HT, avec un essai sur 3 de vos plans.
- Abonnement : 490 € HT par mois, engagement de 12 mois, 50 plans par mois inclus, puis 7 € HT le plan.
- Utilisateurs illimités.
- Signature « Visite réalisée avec Sur Pièce » : présente par défaut, retirable pour 150 € HT par mois.

**Qui facture vos clients.** Vous utilisez l'instance pour vos prospects, ou vous offrez la visite. Nous ne vendons rien à vos clients sous votre marque.

**Texte** : Nous ouvrons les instances une par une, pour accompagner chacune.

**Bouton** : Demander une présentation

### 4.4 Formulaire de présentation

**Champs** : Prénom · Nom · Société · Fonction · E-mail professionnel · Téléphone (facultatif) · Votre activité (Réseau de mandataires · Commercialisateur · Groupement de CGP · Promoteur · Service aux acquéreurs · Courtier · Autre) · Ce qui vous intéresse (Codes à offrir · Instance à notre marque · Les deux) · Nombre de plans par mois estimé (facultatif) · Votre message (facultatif)

**Mention** : Vos coordonnées servent seulement à vous répondre. Elles ne sont ni vendues ni partagées.

**Bouton** : Demander une présentation

**Confirmation** : Merci. Nous vous répondons sous 1 jour ouvré.

### 4.5 Questions fréquentes (partenaires)

**Pouvons-nous revendre la visite à nos clients ?**
Pas au lancement. Vous l'utilisez pour vos prospects ou vous l'offrez. Une revente fait de vous le vendeur, avec ses obligations envers les particuliers : nous l'étudierons avec vous au cas par cas. **[À VALIDER : avocat]**

**Pouvons-nous retirer la mention « illustration non contractuelle » ?**
Non. Elle protège vos clients et vous protège.

**Qui répond à nos clients ?**
Votre équipe, en premier niveau. Nous répondons à la vôtre.

**Où sont les données ?**
Dans l'Union européenne **[À CONFIRMER : hébergeur]**, avec un contrat de sous-traitance. La lecture des plans passe par un prestataire hors UE, sans conservation après la lecture.

---

## 5. Tarifs

**Adresse** : `/tarifs`

**Objectif.** Lever le doute sur le prix et les conditions, puis renvoyer vers le dépôt (particuliers) ou l'essai (pros). Mesure : clics vers « Importer mon plan » et « Essayer 14 jours ».

**Visiteur type.** Un particulier déjà intéressé, ou un pro qui compare. Il arrive de l'accueil, d'une page pro ou d'une recherche sur le prix.

**État d'esprit.**
- Il cherche le piège : abonnement caché, plans qui expirent, remboursement impossible.
- Il compare avec des outils gratuits où il faudrait tout redessiner.
- Il veut savoir ce qu'il paie exactement, et ce qui se passe si ça échoue.

**Balise title** (58 signes) : `Tarifs : premier plan offert, visite 3D à 29 € | Sur Pièce`

**Meta description** (148 signes) : `Premier plan offert, visite complète 29 € TTC sans abonnement. Conseillers dès 49 € HT par mois, promoteurs au lot. Rien de décompté en cas d'échec.`

**Mot-clé** : prix plan 3d appartement. Secondaire : transformer plan 2d en 3d gratuit.

**[Prix : hypothèse]** pour toute la page.

**Publication** : en mode ouvert seulement (L8-07). **[Liste d'attente]** : page non publiée, lien « Tarifs » masqué (R13, § 0.8). Les formules pros (§ 5.7) ne s'affichent qu'une fois l'offre concernée ouverte (R21) ; avant, une ligne : « Professionnels : offre en préparation. Demander un entretien → ».

### 5.1 Premier écran

**Surtitre** : TARIFS

**Titre (H1) retenu** : Des prix simples, payés au plan.

**Variantes à tester** (mesure : clics vers le dépôt) :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Votre premier plan est offert. La visite complète : 29 €. | Le gratuit en tête |
| B | Payez la visite de votre logement une fois, sans abonnement. | Rassure contre l'abonnement caché |
| C | 29 € : moins de 0,01 % du prix moyen d'un 3 pièces neuf. | Ancrage sur le prix du logement (source FPI citée sous le titre) |

**Sous-titre** : Prix TTC pour les particuliers, HT pour les professionnels. Rien n'est décompté si une visite ne peut pas être produite.

**Onglets** : Particuliers · Professionnels

### 5.2 Particuliers (prix TTC)

**Quatre cartes** :

1. **Premier plan · offert**
   - Maquette 3D vue du dessus, en image
   - Plan 2D coté, en image
   - 2 photos : le séjour, puis la chambre principale ou une autre pièce
   - Surfaces par pièce, comparées au tableau du promoteur
   - Points à faire confirmer par le promoteur
   - Un lien d'aperçu pour vos proches, 30 jours
   - En ligne 6 mois
   - Sans carte bancaire. Un par personne et par plan.
   Bouton : Importer mon plan

2. **Visite complète · 29 €**
   - Tout le plan offert
   - Visite à hauteur d'yeux : déplacement libre et arrêt dans chaque pièce
   - Maquette 3D et plan 2D interactifs
   - Fiche complète : surfaces, ouvertures, équipements, hypothèses
   - Liens privés pour vos proches
   - [SI LIVRÉ : L8-08] Téléchargements : images, plan 2D et fiche en PDF
   - En ligne 24 mois **[À VALIDER : avocat]**
   Si vous avez déjà le plan offert, la visite s'ouvre tout de suite.
   Bouton : Importer mon plan

3. **Comparer 3 lots · 59 €**
   - Trois visites complètes
   - Pour choisir entre plusieurs lots, ou comparer avec un plan modificatif
   - Facturé 29 € + 15 € + 15 €
   Bouton : Importer mon premier plan

4. **Plan suivant · 15 €**
   - Une visite complète de plus : un autre lot, ou le plan modificatif envoyé par le promoteur
   - Pendant 12 mois après votre premier achat

**Sous les cartes** : Paiement unique par carte bancaire. Pas d'abonnement.

### 5.3 Bon à savoir avant d'acheter

- **Validité.** Un plan acheté se lance dans les 12 mois. Nous vous le rappelons 30 jours et 7 jours avant la fin.
- **Durée en ligne.** Votre visite reste en ligne 24 mois : de la réservation à la visite cloisons, en général. **[À VALIDER : avocat]**
- **Le plan offert** se lance dans les 30 jours après la création de votre compte. Son aperçu reste disponible 6 mois ; pendant ce temps, la visite s'y débloque tout de suite.
- **Rétractation.** Vous pouvez renoncer à votre achat pendant 14 jours, tant que vos plans ne sont pas utilisés. Quand vous lancez un plan ou débloquez une visite, elle vous est livrée tout de suite : vous perdez ce droit pour ce plan. Nous vous le demandons par une case à cocher, et nous vous le confirmons par e-mail.
- **Renoncer au contrat.** Le lien « Renoncer au contrat ici » est dans votre compte et en bas de chaque page, pendant 14 jours après chaque achat.
- **Relevé bancaire.** Le paiement apparaît sous le nom SUR PIÈCE. Votre reçu arrive par e-mail tout de suite.

### 5.4 Si quelque chose ne va pas

- **Plan non pris en charge** : refusé avant le paiement. S'il s'avère non pris en charge après l'achat, votre plan revient sur votre compte, et nous vous remboursons sur demande.
- **Visite impossible à produire** : votre plan revient automatiquement sur votre compte. Remboursement sur simple demande.
- **Défaut visible dans une visite livrée** : signalez-le depuis la visite. Correction visée sous 5 jours ouvrés, sans frais. À défaut, remboursement.
- **Plans non utilisés** : remboursés en entier pendant 14 jours. Pour le lot de 3, chaque plan non utilisé est remboursé 15 €. **[À VALIDER : avocat]**
- **Visite livrée sans défaut** : pas de remboursement parce qu'elle ne plaît pas, sous réserve de la garantie légale de conformité, qui s'applique toujours.

### 5.5 Ce que la visite ne comprend pas

Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · pas de mobilier ni de rendu photoréaliste · illustration non contractuelle : seuls les plans et la notice annexés à votre contrat font foi.

### 5.6 Repère

Un 3 pièces neuf coûte en moyenne 315 314 € (FPI, 2e trimestre 2026). La visite complète à 29 € en représente moins de 0,01 %.

### 5.7 Professionnels (prix HT)

**Conseillers : Sur Pièce Pro**

| | Solo | Cabinet | Équipe |
|---|---|---|---|
| Par mois | 49 € HT | 99 € HT | 199 € HT |
| Par an (10 mois payés) | 490 € HT | 990 € HT | 1 990 € HT |
| Plans inclus par mois | 5 | 12 | 30 |
| Utilisateurs | 1 | 3 | 10 |
| 5 plans en plus | 45 € HT | 40 € HT | 35 € HT |

- Sans engagement en mensuel. Report des plans non utilisés sur le mois suivant.
- Essai de 14 jours, 3 plans complets, sans carte bancaire.
- Bouton : Essayer 14 jours gratuitement · Lien : Tout sur Sur Pièce Pro →

**Promoteurs : Sur Pièce Programme**
- Rapport de prise en charge : offert.
- Pilote : 600 € HT pour un programme de 40 lots au plus, déduit de la commande signée dans les 3 mois.
- Au lot : 25 € HT (1 à 49 lots par an), 20 € HT (50 à 199), 15 € HT (200 et plus, avec engagement annuel).
- Lien : Tout sur Sur Pièce Programme →

**Partenaires**
- Codes à offrir : 15 € HT le code par 10, 12 € HT dès 50.
- Instance à votre marque : 1 500 € HT de mise en place, puis 490 € HT par mois pour 50 plans, 7 € HT le plan en plus.
- Lien : Marque blanche et partenaires →

### 5.8 Questions fréquentes (tarifs)

**Y a-t-il un abonnement pour les particuliers ?**
Non. Vous payez une fois, au plan.

**Mes plans achetés expirent-ils ?**
Un plan acheté se lance dans les 12 mois. Nous vous prévenons 30 jours et 7 jours avant.

**Pourquoi le plan offert n'inclut-il pas la visite ?**
Pour que vous puissiez juger du résultat sans payer : maquette vue du dessus, plan coté, surfaces et photos. Si vous voulez entrer dans le logement, la visite s'ouvre pour 29 €, sans nouvelle attente.

**Et si la visite ne me plaît pas ?**
Si elle présente un défaut visible, nous la corrigeons ou nous vous remboursons. Si elle est fidèle au plan mais que le logement ne vous convient pas, elle a joué son rôle : elle n'est pas remboursée, sous réserve de vos garanties légales. Le plan offert est là pour juger avant de payer.

**Comment payer ?**
Par carte bancaire, sur une page de paiement sécurisée. Vous recevez un reçu par e-mail.

**Les prix des pros sont-ils HT ?**
Oui. La TVA de 20 % s'ajoute. Les prix des particuliers sont TTC.

---

## 6. Visite de démonstration : l'appartement témoin

**Adresse** : `/appartement-temoin`

**Objectif.** Montrer le résultat réel, puis mener au dépôt. Mesure principale : clics sur « Importer mon plan » depuis la page. Mesure secondaire : temps passé dans la visite, clics pros vers l'essai.

**Visiteur type.** Tout visiteur qui veut voir avant de donner son e-mail : particuliers surtout, conseillers et promoteurs aussi.

**État d'esprit.**
- Curieux et un peu sceptique : il cherche le défaut, la texture qui manque, la porte à l'envers.
- Il se demande si son propre plan donnera la même chose.
- Il ne veut pas s'inscrire pour regarder.

**Balise title** (57 signes) : `Appartement témoin : visitez un T3 neuf en 3D | Sur Pièce`

**Meta description** (143 signes) : `Entrez dans un T3 de démonstration d'environ 65 m² avec loggia : plan 2D coté, maquette 3D, visite pièce par pièce et photos. Sans inscription.`

**Mot-clé** : appartement témoin. Secondaire : plan appartement 3d en ligne gratuit.

**Préalable.** L'appartement témoin fictif est à créer (`MARQUE.md` § 8.2, `ARCHITECTURE.md` M0.2, L1-03) : un plan de vente dessiné par nous, sans nom réel, rangé dans `references/temoin/` et versionné (R11), passé par la vraie chaîne, visite de contrôle comprise. Les surfaces citées ici sont celles prévues ; les remplacer par les surfaces réelles du plan créé.

**Contenu montré** : exactement celui d'une visite débloquée au lancement (§ 0.7) : la visite, la maquette, le plan 2D, la fiche, et les mêmes images (vue du dessus, 2 photos). Pas de galerie complète tant que L13-02 n'est pas livré (R1). Visite en mode simple (R16).

### 6.1 Bandeau d'en-tête (au-dessus de la visite)

**Cartouche** : PROGRAMME DE DÉMONSTRATION · T3 · environ 65 m² · Plan fictif, créé pour la démonstration

**Titre (H1) retenu** : Visitez l'appartement témoin.

**Variantes à tester** (mesure : clics vers le dépôt depuis la page) :

| Variante | Titre | Hypothèse |
|---|---|---|
| A | Voici ce que deviendra votre plan de vente. | Relie tout de suite la démo au plan du visiteur |
| B | Entrez dans un T3 neuf, d'après son seul plan de vente. | Insiste sur la source unique : le plan |
| C | Faites le tour d'un T3 d'environ 65 m², pièce par pièce. | Concret, orienté exploration |

**Sous-titre** : Un T3 dessiné pour la démonstration, lu et vérifié comme le sera votre plan. Aucune inscription.

**Boutons** :
- Entrer dans la visite (principal)
- Voir le plan de départ (ouvre le PDF du plan fictif : c'est notre plan, nous pouvons le montrer)

### 6.2 La visite

- Plein écran, avec les modes existants : Plan 2D · Maquette 3D · Visite · Photos · Fiche ; [SI LIVRÉ : L4-16] 360°.
- Aides de déplacement : reprendre celles de `moteur/ui.js` (« Glisser pour regarder · toucher le sol pour y aller… »).
- Mention permanente, en bas à gauche : Appartement témoin fictif · Illustration non contractuelle

### 6.3 Panneau « Ce que vous voyez » (à droite sur ordinateur, en volet sur téléphone)

**Titre** : Ce que vous voyez

- **Les cotes du plan.** Chaque dimension vient du plan de vente. Activez « Afficher les cotes » dans le plan 2D.
- **Les surfaces comparées.** Ouvrez la fiche : chaque pièce est comparée au tableau du plan.
- **Les points à confirmer.** Ce que le plan ne dit pas est marqué « hypothèse », comme la hauteur sous plafond.
- **Vérifié avant livraison.** Cette visite a été parcourue automatiquement à la recherche de défauts visibles avant d'être publiée.

**Interrupteur** : Voir ce que contient le plan offert
- Activé : la page montre la disposition de l'aperçu offert (maquette 3D vue du dessus, plan 2D coté, 2 photos, surfaces, points à confirmer), avec la visite verrouillée.
- Texte sous l'interrupteur : Le plan offert vous montre ceci. La visite s'ouvre pour 29 €.
- **[Liste d'attente]** : Le plan offert vous montre ceci.

### 6.4 Appel à l'action

**Barre fixée en bas** (téléphone) ou **carte** sous le panneau (ordinateur) :
- Texte : Et votre logement ? Premier plan offert, sans carte bancaire.
- Bouton : Importer mon plan

**Rappel unique**, à la sortie de la visite ou après 90 secondes dans la visite, sans bloquer l'écran :
- Titre : Votre plan de vente peut donner la même chose.
- Texte : Déposez-le : on vous dit tout de suite s'il est pris en charge.
- Boutons : Importer mon plan · Continuer la visite

**[Liste d'attente]** :
- Barre ou carte : Et votre logement ? Nous ouvrons l'accès par petits groupes. Bouton : Demander une invitation
- Rappel : titre inchangé ; texte « Laissez votre e-mail pour recevoir une invitation. » ; boutons : Demander une invitation · Continuer la visite

**Lien pros** : Vous êtes conseiller ? Voir la page que reçoit votre prospect →
**[Pré-lancement pro]** : Vous êtes conseiller ? Sur Pièce Pro → (la page prospect de démonstration n'existe pas encore)

**Limites, sous l'appel** : Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · illustration non contractuelle.

---

## 7. Microtextes du parcours

Chaque texte porte une clé (`zone.élément`) pour le catalogue de messages demandé par l'audit (`audit-code.md` B9). Un message d'erreur répond toujours à trois questions : ce qui s'est passé, ce que ça change pour vous, quoi faire maintenant. Jamais de code, de nom de fichier, de coordonnée ni de nom de service.

**Clés stables.** Une clé existante n'est jamais renommée ni réutilisée pour un autre sens : on change son texte, ou on ajoute une clé. Une variante de mode garde la clé et prend un suffixe : `.beta` pour la bêta fermée (§ 0.8). Sans variante `.beta`, un texte qui propose un achat n'est pas affiché pendant la bêta.

**Contrôle automatique à ajouter** (consigne du projet) : la publication échoue si un texte affiché contient `.env`, `Error`, `json`, `http`, un identifiant technique, une coordonnée ou une `{variable}` non remplie.

### 7.1 Dépôt

| Clé | Texte |
|---|---|
| `depot.zone.titre` | Glissez votre plan de vente ici |
| `depot.zone.titre_mobile` | Choisissez votre plan de vente |
| `depot.zone.aide` | PDF du promoteur de préférence · PNG, JPG ou WebP acceptés · 40 Mo au plus |
| `depot.zone.bouton` | Importer mon plan |
| `depot.zone.survol` | Déposez le fichier ici |
| `depot.envoi` | Envoi de votre plan… |
| `depot.analyse` | Nous regardons votre fichier… |
| `depot.reconnu.titre` | Plan reconnu |
| `depot.reconnu.pdf` | PDF du promoteur : murs, cotes et échelle seront lus dans le fichier. |
| `depot.reconnu.image` | Image reçue : vous indiquerez une cote connue pour caler l'échelle. Comptez 5 à 10 cm d'écart possible. |
| `depot.reconnu.offre` | `offre.apercu.resume` (§ 0.7) ; `.beta` : `offre.apercu.resume.beta` |
| `depot.reconnu.bouton_offert` | Lancer mon plan offert |
| `depot.reconnu.bouton_plan` | Lancer ce plan (il vous en reste {n}) |
| `depot.reconnu.bouton_payant` | Obtenir la visite · 29 € (non affiché pendant la bêta) |
| `depot.reconnu.changer` | Changer de fichier |
| `depot.reconnu.limites` | Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · illustration non contractuelle. |
| `depot.provisoire_expire` | Déposez à nouveau votre plan : il a été effacé au bout de 24 h, comme prévu. |

**Refus au dépôt.** Titre en gras, puis texte, puis bouton. Tous finissent par « Rien n'a été décompté. » quand un plan était réservé.

| Clé | Titre | Texte | Bouton |
|---|---|---|---|
| `depot.refus.format` | Ce fichier ne s'ouvre pas comme un plan | Déposez le PDF du plan de vente, ou une image PNG, JPG ou WebP. | Choisir un autre fichier |
| `depot.refus.vide` | Ce fichier est vide | Il ne contient rien à lire. Déposez à nouveau votre plan de vente. | Choisir un autre fichier |
| `depot.refus.lourd` | Ce fichier dépasse 40 Mo | Le PDF d'origine du promoteur est souvent plus léger. Pour une image, réduisez-la avant de la déposer. | Choisir un autre fichier |
| `depot.refus.petit` | Cette image est trop petite pour lire les cotes | Il faut au moins 700 pixels sur son petit côté. Le PDF du promoteur donne le meilleur résultat. | Choisir un autre fichier |
| `depot.refus.protege` | Ce PDF est protégé par un mot de passe | Ouvrez-le, enregistrez-en une copie sans protection, puis déposez cette copie. | Choisir un autre fichier |
| `depot.refus.abime` | Ce PDF ne s'ouvre pas | Il semble endommagé ou incomplet. Téléchargez-le à nouveau depuis l'e-mail du promoteur. | Choisir un autre fichier |
| `depot.refus.pas_un_plan` | Ce fichier ne ressemble pas à un plan d'appartement | Déposez le plan de vente de votre logement : le document coté, vu de dessus. | Choisir un autre fichier |
| `depot.refus.niveaux` | Ce plan comporte plus de deux niveaux | Sur Pièce prend en charge aujourd'hui les appartements sur un ou deux niveaux. | Me prévenir si cela change · Déposer un autre plan |
| `depot.refus.maison` | Ce plan semble être celui d'une maison | Sur Pièce prend en charge aujourd'hui les appartements sur un ou deux niveaux. | Me prévenir si cela change · Déposer un autre plan |
| `depot.refus.plusieurs_lots` | Ce plan montre plusieurs logements | Déposez le plan de votre seul lot, tel qu'il figure dans votre dossier de réservation. | Choisir un autre fichier |
| `depot.refus.offert_pdf` | Pour un plan offert, déposez le PDF du promoteur | Aujourd'hui, le plan offert se lance seulement depuis le PDF du promoteur. Demandez-le à votre conseiller commercial. | Choisir un autre fichier · Obtenir la visite · 29 € |
| `depot.refus.perspective` | Ce document n'est pas un plan coté | Une perspective ou un croquis ne donne pas les dimensions. Déposez le plan de vente de votre lot. | Choisir un autre fichier |
| `depot.refus.illisible` | Nous n'arrivons pas à lire ce plan | Les murs ne sont pas reconnus. Essayez le PDF d'origine du promoteur, ou une image plus nette. | Choisir un autre fichier |

Notes :
- `depot.refus.plusieurs_lots` : en service, c'est la qualification qui le décide (L6-02), avant tout décompte. Un PDF de plusieurs lots n'est jamais lu comme des niveaux ; seul l'import promoteur (L10-02) découpe un PDF multi-lots (R17).
- `depot.refus.offert_pdf` : coupe-circuit du plan offert (L8-09), en mode ouvert seulement ; une image refusée pour un plan offert reste acceptée pour un plan payé. Vérifié avant la création du compte (L6-02), pour ne pas refuser après coup.

**Formulaire « Me prévenir si cela change »** :
- Texte : Laissez votre e-mail. Nous vous écrirons une seule fois, si ce type de plan est pris en charge. Nous n'annonçons pas de date.
- Champ : Votre e-mail
- Bouton : Me prévenir
- Confirmation : C'est noté. Vous pouvez vous désinscrire depuis le lien de cet unique e-mail.

### 7.2 Échelle (plan en image)

L'échelle est demandée **avant** la lecture du plan (`OFFRES.md` § 1).

| Clé | Texte |
|---|---|
| `echelle.titre` | Une cote pour caler l'échelle |
| `echelle.texte` | Votre plan est une image. Indiquez une dimension que vous connaissez, la plus longue possible : par exemple la largeur du séjour. |
| `echelle.etape1` | Cliquez la première extrémité de la cote. |
| `echelle.etape2` | Cliquez la seconde extrémité. |
| `echelle.etape3` | Indiquez la longueur de cette cote, en mètres. |
| `echelle.champ` | Longueur … m (exemple affiché : 4,12) |
| `echelle.trop_proche` | Les deux points sont trop proches : choisissez une cote plus longue. |
| `echelle.centimetres` | « {saisie} » ressemble à des centimètres. La longueur se saisit en mètres : {valeur} m. |
| `echelle.corriger` | Corriger en {valeur} m |
| `echelle.hors_plage` | Indiquez une longueur en mètres, entre 0,30 et 25 (par exemple 4,12). |
| `echelle.resultat` | Avec cette cote, la page mesure environ {largeur} × {hauteur} m. Si cela vous paraît juste, validez. |
| `echelle.rappel` | Sur une image, comptez 5 à 10 cm d'écart possible. |
| `echelle.recommencer` | Recommencer |
| `echelle.valider` | Valider la cote |
| `echelle.fait` | Échelle calée sur votre cote de {valeur} m. |
| `echelle.chantier` | Le chantier attend votre coup de mètre. |

Le texte actuel « Échelle obtenue : 1 m = {n} px » est remplacé par `echelle.resultat` (pas d'unité technique).

### 7.3 Création de compte (au lancement du plan)

| Clé | Texte |
|---|---|
| `compte.titre` | Où vous prévenir quand c'est prêt ? |
| `compte.texte` | Comptez ‹délai›. On vous écrit dès que votre plan est prêt, et vous le retrouvez dans votre compte. (Repli avant T0 : sans la première phrase.) |
| `compte.offert.regle` | Un plan offert par personne et par plan, à lancer sous 30 jours. |
| `compte.offert.regle.beta` | Un plan offert par personne invitée, à lancer avant le {date}. |
| `compte.google` | Continuer avec Google |
| `compte.ou` | ou |
| `compte.email.label` | Votre e-mail |
| `compte.email.bouton` | Recevoir mon lien de connexion |
| `compte.email.aide` | Pas de mot de passe : un lien et un code de connexion arrivent dans votre boîte. |
| `compte.cgu` | J'accepte les conditions générales d'utilisation. (lien sur « conditions générales d'utilisation ») |
| `compte.confidentialite` | Comment nous utilisons vos données : politique de confidentialité. (simple lien, pas une case) |

**Case d'écart consenti** — séparée, non cochée, obligatoire pour lancer (`OFFRES.md` § 2.5, `juridique.md` § 1.5) **[À VALIDER : avocat]** :

> J'ai compris que la visite et les photos sont des illustrations produites automatiquement à partir du plan de vente. Les dimensions sont reprises du plan quand il les indique, estimées sinon. Hauteurs, matériaux, couleurs, vues et lumière sont fictifs ; le logement est présenté vide et certains équipements peuvent être simplifiés. La visite et les photos ne remplacent pas les plans et la notice annexés à mon contrat de vente.

**Question facultative** :
- `compte.etape.question` : Où en êtes-vous ? (facultatif)
- Choix : Je choisis mon lot · J'ai signé mon contrat de réservation · Je choisis mes TMA · Je prépare la visite cloisons · Je prépare la livraison · Je préfère ne pas répondre
- `compte.etape.aide` : Cela nous aide à comprendre à quoi sert Sur Pièce. Nous ne vous enverrons rien de plus.

**Après l'envoi du lien** :

| Clé | Texte |
|---|---|
| `compte.envoye.titre` | Vérifiez votre boîte e-mail |
| `compte.envoye.texte` | Nous avons envoyé un lien de connexion à {email}. Il est valable {durée} minutes. Votre plan démarre dès que vous cliquez. |
| `compte.envoye.code.label` | Vous pouvez aussi saisir ici le code à 6 chiffres du même e-mail : |
| `compte.envoye.code.bouton` | Valider |
| `compte.envoye.code.faux` | Ce code ne correspond pas. Vérifiez-le dans le dernier e-mail reçu. |
| `compte.envoye.code.bloque` | Trop d'essais avec ce code. Demandez un nouveau lien : il arrive avec un nouveau code. |
| `compte.envoye.autre_appareil` | Confirmé sur un autre appareil. Pour suivre ici, saisissez le code reçu. |
| `compte.envoye.renvoyer` | Renvoyer le lien (actif après 60 secondes) |
| `compte.envoye.renvoyer_limite` | Vous avez demandé plusieurs liens. Vous pourrez en redemander un à {heure}. |
| `compte.envoye.changer` | Changer d'adresse |
| `compte.envoye.pas_recu` | Rien reçu ? Regardez dans vos indésirables, ou continuez avec Google. |

- `{durée}` : durée de validité du lien et du code, à fixer (L0-05, `auth-paiement.md`). Le code vaut pour 5 essais, puis le lien est invalidé (L5-03).
- Le champ du code accepte le collage, avec `autocomplete="one-time-code"`. Dans un navigateur intégré, le bouton Google est masqué et le code passe en premier (`PARCOURS.md` A5).
- L'onglet d'origine n'ouvre jamais la session sans le code : `compte.envoye.autre_appareil` le dit sans jargon.
- Si la décision d'authentification (D8, L0-02) retient un fournisseur qui n'envoie qu'un code, sans lien : `compte.envoye.texte` devient « Nous avons envoyé un code à 6 chiffres à {email}. Il est valable {durée} minutes. Votre plan démarre dès que vous le saisissez. », et `compte.envoye.code.label` devient « Code à 6 chiffres reçu par e-mail : ».

**Connexion d'un compte existant** :
- `connexion.titre` : Se connecter
- `connexion.texte` : Indiquez votre e-mail : nous vous envoyons un lien et un code de connexion.
- `connexion.bouton` : Recevoir mon lien de connexion
- L'écran suivant reprend `compte.envoye.*`, code compris, sans la phrase « Votre plan démarre dès que vous cliquez. »

### 7.4 Attente : l'écran « chantier »

| Clé | Texte |
|---|---|
| `attente.titre` | Votre plan est en chantier |
| `attente.texte` | Comptez ‹délai›. Vous pouvez fermer cette page : on vous écrit à {email} dès que c'est prêt. (Repli avant T0 : sans la première phrase.) |
| `attente.notif.bouton` | Me prévenir aussi dans ce navigateur |
| `attente.notif.ok` | Vous serez aussi prévenu dans ce navigateur, tant que cet onglet reste ouvert. |
| `attente.onglet` | {n} % · Votre plan en chantier |
| `attente.onglet_fini` | Prêt · Sur Pièce |

Le texte actuel « Vous pouvez fermer cet onglet ou faire autre chose, on vous prévient » est faux onglet fermé (`audit-code.md` A4). Il est remplacé par `attente.texte`, qui promet un e-mail.

**Étapes affichées** (libellés sans jargon ; « visite de contrôle » reste un terme interne) :

| Étape interne | Libellé | Sous-texte |
|---|---|---|
| analyse | Plan reçu | PDF du promoteur : échelle lue dans le fichier. · Image : échelle calée sur votre cote de {valeur} m. |
| calibration | Échelle | Une cote connue est demandée. |
| lecture | Lecture du plan | Murs, portes, fenêtres et équipements. |
| controle | Vérification avant livraison | Nous parcourons le logement à la recherche de défauts visibles. |
| photos | Vue du dessus, plan 2D et photos ([SI LIVRÉ : L5-27, si affiché pendant l'attente] et vues à 360°) | Chaque image s'affiche ici dès qu'elle est prête. |
| fini (offert) | Votre plan est prêt | — |
| fini (payant) | Votre visite est prête | — |

**Images en direct** (D5, R2). La zone des images reste vide tant que la vérification n'a pas réussi : une visite qui échoue ne laisse rien voir. Ensuite, chaque image apparaît dès qu'elle existe, dans cet ordre : vue du dessus, plan 2D coté, photos. Sous chaque image : « Illustration non contractuelle » (§ 8.3).

| Clé | Texte |
|---|---|
| `attente.image.vue_dessus` | Votre appartement est sorti de terre. Le voici, vu du dessus. |
| `attente.image.vue_dessus.alt` | Vue du dessus de la maquette 3D |
| `attente.image.vue_dessus.niveau` | Le {niveau}, vu du dessus. ({niveau} : nom lu sur le plan, « R+1 », « RDC » ; repli « Niveau 1 ») |
| `attente.image.vue_dessus.niveau.alt` | Vue du dessus de la maquette 3D, {niveau} |
| `attente.image.360` | [SI LIVRÉ : L5-27, si affiché pendant l'attente, à décider] La visite à 360° est prête : {n} points de vue, d'arrêt en arrêt. |
| `attente.image.plan` | Le plan coté est tracé. |
| `attente.image.plan.alt` | Plan 2D coté |
| `attente.image.photo` | Photo prise : {pièce}. |
| `attente.image.photo.alt` | {pièce} (nom de la pièce, sans autre texte) |
| `attente.image.photo_omise` | Une photo n'a pas pu être prise : elle n'apparaîtra pas. Le reste de votre plan est livré, et notre équipe est prévenue. |
| `attente.apercu_pret` | Votre plan est prêt à consulter. Les photos s'y ajoutent dès qu'elles sont prises. |
| `attente.apercu_pret.bouton` | Voir mon logement |
| `attente.visite_prete` | Votre visite est ouverte. Les images s'y ajoutent dès qu'elles sont prêtes. |
| `attente.visite_prete.bouton` | Entrer dans ma visite |

- `attente.apercu_pret` s'affiche dès que la vue du dessus et le plan 2D sont publiés (R2) ; `attente.visite_prete`, pour un plan complet, dès la vérification réussie.
- `attente.image.photo_omise` : après les nouvelles tentatives (R2). Aucun emplacement vide ne reste à l'écran.
- Variante courte de `attente.image.vue_dessus`, si la place manque : « Votre appartement est sorti de terre. »

**File d'attente et plafonds** :

| Clé | Texte |
|---|---|
| `attente.file` | Votre plan attend son tour : d'autres sont en cours. Il démarre dès qu'une place se libère. |
| `attente.file_estime` | Votre plan attend son tour. Il devrait démarrer dans {attente}. On vous écrit dès qu'il est prêt. |
| `attente.file_offert` | Votre plan offert attend son tour. Les plans payés passent en priorité ; on vous écrit dès qu'il est prêt. |
| `attente.file_offert.beta` | Votre plan attend son tour : d'autres sont en cours. On vous écrit dès qu'il est prêt. |
| `attente.plafond_jour` | Les plans offerts du jour sont tous partis. Le vôtre est en file pour demain : on vous écrit dès qu'il est prêt. |
| `attente.plafond_jour.lien` | Pas envie d'attendre ? Obtenir la visite complète maintenant · 29 € (non affiché pendant la bêta) |
| `attente.offert_suspendu` | Les plans offerts sont momentanément suspendus. Votre plan est gardé : il démarre dès leur reprise, et on vous écrit dès qu'il est prêt. Rien n'a été décompté. |
| `attente.offert_suspendu.lien` | Pas envie d'attendre ? Obtenir la visite complète maintenant · 29 € (non affiché pendant la bêta) |
| `attente.limite_connexion` | Plusieurs plans offerts ont déjà été demandés depuis votre connexion aujourd'hui. Le vôtre est en file d'attente : on vous écrit dès qu'il est prêt. |

- `attente.file_estime` remplace `attente.file` quand l'attente estimée est connue (`{attente}`, § 0.3, L5-22) ; sinon, `attente.file`.
- `attente.offert_suspendu` : interrupteur des plans offerts coupé depuis l'administration (L5-09), par exemple sur un coût anormal (L5-21). Aucune date de reprise n'est annoncée. Si le plan n'a pas démarré dans le délai de libération (`OFFRES.md` § 6.4), le plan offert est rendu et E6 part.
- Coupe-circuit du plan offert (L8-09, mode ouvert) : il ne suspend pas, il réserve le plan offert au PDF du promoteur (`depot.refus.offert_pdf`, § 7.1).

**Pendant l'attente** (sous la barre) :
- Titre : En attendant, faites le tour de l'appartement témoin.
- Bouton : Visiter l'appartement témoin (nouvel onglet)
- Rappel : `offre.apercu.resume` (§ 0.7). **[Bêta]** : `offre.apercu.resume.beta`, ou rien si le plan de test est un plan complet.

**Phrases de chantier.**
- Garder la chronologie actuelle de `pipeline/accueil.html` (40 phrases, de « Réception du plan… » à « Réception des travaux : les clés sont sur la porte. »).
- Règle : une phrase reste une métaphore et n'annonce jamais un contrôle qui n'a pas lieu (`MARQUE.md` § 4.3).
- Retirer « Chantier à l'arrêt. » : l'humour n'accompagne jamais une erreur. En cas d'arrêt, seul le message d'erreur s'affiche.
- [SI LIVRÉ : L13-02] Pour le rendu de la galerie après un déblocage, ajouter : « Le photographe repasse dans chaque pièce… », « Il cherche le bon angle dans la chambre… », « Dernières photos… ». Au lancement, aucune photo n'est rendue après un déblocage (R1).
- La chronologie des phrases suit l'ordre réel : les phrases de photos ne passent qu'après la vue du dessus et le plan 2D.

### 7.5 Résultat du plan offert (aperçu)

Page privée du compte, rendue par le serveur. Elle ne reçoit que des images et des textes filtrés : ni le moteur de la visite ni les données du plan (D6, R4, `OFFRES.md` § 2.2). Le verrou est côté serveur, pas dans l'interface. Ordre des sections (R1, L6-05) : cartouche et bouton de déblocage, accroche, vue du dessus, photos, plan 2D coté, surfaces, points à faire confirmer, éléments verrouillés, conservation et mention. Publiée dès que la vue du dessus et le plan 2D sont prêts ; les photos s'y ajoutent ensuite (R2).

| Clé | Texte |
|---|---|
| `apercu.badge` | Plan offert |
| `apercu.titre` | {Titre du logement} ; repli : Votre logement |
| `apercu.sous_titre` | {Typologie} · {surface} m² · d'après le plan de vente |
| `apercu.accroche` | Voici votre logement d'après le plan. À vous de juger. |
| `apercu.plan.titre` | Plan 2D coté |
| `apercu.plan.legende` | Cotes reprises du plan de vente. |
| `apercu.surfaces.titre` | Surfaces par pièce |
| `apercu.surfaces.colonnes` | Pièce · Lu sur le plan · Tableau du promoteur · Écart |
| `apercu.surfaces.identique` | Identique au tableau |
| `apercu.surfaces.ecart` | Écart de {valeur} m² : à faire confirmer |
| `apercu.surfaces.absente` | Absente du tableau du promoteur |
| `apercu.surfaces.sans_tableau` | Ce plan ne contient pas de tableau des surfaces. Les surfaces sont lues sur le plan, à titre indicatif. |
| `apercu.maquette.titre` | Maquette 3D, vue du dessus |
| `apercu.photos.titre` | Photos |
| `apercu.photos.en_cours` | Les photos arrivent : elles s'ajoutent ici dès qu'elles sont prises. |
| `apercu.photos.omise` | Une photo n'a pas pu être prise : elle est omise. Le reste de votre plan vous est livré. |
| `apercu.photos.verrou` | [SI LIVRÉ : L13-02] {n} autres photos avec la visite complète. Non affiché au lancement (R1). |
| `apercu.360.titre` | [SI LIVRÉ : L6-13] Visite à 360° (nom public à décider) |
| `apercu.360.aide` | Glisser pour regarder · toucher un point pour y aller |
| `apercu.360.aide_clavier` | Flèches pour regarder · Entrée pour aller au point choisi |
| `apercu.360.piece` | {pièce} ; plan à plusieurs niveaux : {pièce} · {niveau} |
| `apercu.360.mention` | Illustration non contractuelle générée automatiquement à partir du plan de vente. |
| `apercu.points.titre` | Points à faire confirmer par votre promoteur |
| `apercu.points.intro` | Le plan ne dit pas tout. Voici ce que nous avons supposé ou ce qui reste à vérifier. |
| `apercu.points.drapeau_plan` | D'après le plan |
| `apercu.points.drapeau_verifier` | À vérifier |
| `apercu.points.drapeau_hypothese` | Hypothèse |
| `apercu.points.exemple` | Hauteur sous plafond : non indiquée sur le plan, supposée à {valeur} m. (exemple de rédaction) |
| `apercu.partage.titre` | Montrer à vos proches |
| `apercu.partage.texte` | Un lien en lecture seule, valable 30 jours. Vous pouvez le couper à tout moment. |
| `apercu.partage.bouton` | Copier le lien |
| `apercu.partage.copie` | Lien copié. |
| `apercu.conservation` | Cet aperçu reste disponible jusqu'au {date}. |
| `apercu.mention` | Illustration non contractuelle générée automatiquement à partir du plan de vente. |

Les points à faire confirmer ne sont jamais verrouillés : ils protègent l'acquéreur.

### 7.6 Verrou de la visite

| Clé | Texte |
|---|---|
| `verrou.bouton` | Débloquer la visite · 29 € |
| `verrou.bouton.beta` | Ce que contient la visite |
| `verrou.bouton_suivant` | Débloquer la visite · 15 € (plan suivant) |
| `verrou.bouton_plan_dispo` | Ouvrir la visite (utilise 1 de vos {n} plans) |
| `verrou.onglet` | Disponible avec la visite complète |
| `verrou.piece` | {pièce} · à visiter avec la visite complète |
| `verrou.piece.360` | [SI LIVRÉ : L6-13, 360° gratuit] {pièce} · à parcourir librement avec la visite complète |
| `verrou.photo` | [SI LIVRÉ : L13-02] Photo disponible avec la visite complète |
| `verrou.telechargement` | [SI LIVRÉ : L8-08] Téléchargements disponibles avec la visite complète |

Éléments verrouillés au lancement : la visite (une vignette par pièce, avec son nom et sans image, `verrou.piece`), la maquette 3D et le plan 2D interactifs, la fiche complète, le partage de la visite. Aucune photo verrouillée n'est montrée tant que la galerie complète n'existe pas (R1). On ne montre jamais d'image cassée.

**Volet de déblocage** :
- Titre : Votre logement est prêt.
- Texte : La visite s'ouvre dès le paiement, sans nouvelle attente.
- Choix 1 : **Ce logement · 29 €** — La visite à hauteur d'yeux, la maquette 3D et le plan 2D interactifs, la fiche complète et le partage privé, avec les mêmes images [SI LIVRÉ : L8-08, et les téléchargements]. En ligne 24 mois.
- Choix 2 : **Comparer 3 lots · 59 €** — Ce logement, plus 2 plans à lancer dans les 12 mois.
- Limites : Logement présenté vide, finitions supposées · illustration non contractuelle.
- Bouton : Continuer
- Lien : Essayer d'abord la visite de l'appartement témoin
- Fermer : Plus tard

**Volet pendant la bêta** (`verrou.volet.beta`, R13) : il décrit la visite sans rien proposer d'acheter.
- `verrou.volet.beta.titre` : La visite de votre logement est prête.
- `verrou.volet.beta.texte` : Elle ne fait pas partie de votre plan de test. Pendant la phase de test, la visite n'est pas en vente.
- `verrou.volet.beta.contenu` : `offre.visite.liste` (§ 0.7)
- Limites : Logement présenté vide, finitions supposées · illustration non contractuelle.
- Lien : Visiter l'appartement témoin
- Fermer : Fermer

Un compte qui a un plan complet disponible (plan de test complet, selon L0-04) voit `verrou.bouton_plan_dispo` si le déblocage par plan disponible est livré (L8-02).

**Après le déblocage** :
- `verrou.ouvert` : Votre visite est ouverte.
- `verrou.ouvert.galerie` : [SI LIVRÉ : L13-02] Votre visite est ouverte. Les autres photos s'y ajoutent dès qu'elles sont prêtes. (Aucun délai écrit en dur, R12.)
- `verrou.photos_pretes` : [SI LIVRÉ : L13-02] Toutes vos photos sont prêtes.

### 7.7 Achat

La page de commande, le retour du paiement et la renonciation ne s'affichent qu'après l'ouverture de la vente (L8-01, L8-07) : pendant la bêta, rien ne s'achète (R13). « Mon compte : mes plans » sert dès la bêta.

**Page de commande** (avant le paiement sécurisé) :

| Clé | Texte |
|---|---|
| `achat.titre` | Votre commande |
| `achat.ligne.visite` | Visite complète de votre logement · 29,00 € TTC |
| `achat.ligne.pack` | Comparer 3 lots : 1er plan 29,00 € + 2 plans suivants à 15,00 € · 59,00 € TTC |
| `achat.ligne.suivant` | Plan suivant · 15,00 € TTC |
| `achat.compris` | Visite à hauteur d'yeux, pièce par pièce · [SI LIVRÉ : L4-16] vue à 360° de chaque arrêt · maquette 3D et plan 2D interactifs · fiche complète · liens privés · les mêmes images que l'aperçu · [SI LIVRÉ : L8-08] téléchargements · en ligne 24 mois |
| `achat.validite` | Plans à lancer dans les 12 mois, jusqu'au {date}. |
| `achat.limites` | Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · pas de mobilier ni de rendu photoréaliste · illustration non contractuelle. |
| `achat.retractation` | Vous pouvez renoncer à votre achat pendant 14 jours, tant que vos plans ne sont pas utilisés. Quand vous lancez un plan ou ouvrez une visite, elle vous est livrée tout de suite : vous perdez ce droit pour ce plan. |
| `achat.remboursement` | Si une visite ne peut pas être produite, rien n'est décompté, et nous remboursons sur simple demande. Une visite livrée sans défaut n'est pas remboursée parce qu'elle ne plaît pas, sous réserve de vos garanties légales. |
| `achat.liens` | Conditions générales de vente · Politique de remboursement |

**Cases** (non cochées, elles bloquent le bouton) **[À VALIDER : avocat]** :
1. Case d'écart consenti : même texte qu'au § 7.3.
2. Case de renonciation, selon le cas :
   - déblocage d'un aperçu : « Je demande l'ouverture immédiate de la visite, et je reconnais perdre mon droit de rétractation pour ce plan. »
   - lancement d'un plan payé : « Je demande que la fabrication de ma visite commence immédiatement, et je reconnais perdre mon droit de rétractation pour ce plan. »
   - achat du lot de 3 : la case ne porte que sur le plan ouvert maintenant ; les 2 autres restent rétractables.

**Bouton de paiement** : Payer 29,00 € TTC (ou 59,00 €, ou 15,00 €)
**Sous le bouton** : Paiement sécurisé par carte. Libellé sur votre relevé : SUR PIÈCE.

**Retour du paiement** :

| Clé | Texte |
|---|---|
| `achat.ok` | Paiement reçu. Votre visite s'ouvre. |
| `achat.ok_pack` | Paiement reçu. Il vous reste 2 plans, à lancer jusqu'au {date}. |
| `achat.annule` | Paiement annulé. Rien n'a été prélevé. Votre aperçu reste disponible. |

**Mon compte : mes plans** :

| Clé | Texte |
|---|---|
| `compte.plans.titre` | Mes plans |
| `compte.plans.dispo` | {n} plan(s) disponible(s), à lancer jusqu'au {date} |
| `compte.plans.aucun` | Aucun plan disponible. |
| `compte.plans.etat.chantier` | En chantier |
| `compte.plans.etat.echelle` | Une cote est demandée |
| `compte.plans.etat.apercu` | Plan offert |
| `compte.plans.etat.visite` | Visite complète |
| `compte.plans.etat.arrete` | Arrêté : rien n'a été décompté |
| `compte.plans.supprimer` | Supprimer ce plan |
| `compte.plans.supprimer.confirmer` | Supprimer ce plan, sa visite et ses liens de partage ? Cette action est définitive. |
| `compte.supprimer` | Supprimer mon compte |
| `compte.exporter` | Télécharger mes données |

**Renoncer au contrat ici** (lien dans le compte et en pied de page, actif 14 jours après chaque achat) :

| Clé | Texte |
|---|---|
| `renonciation.titre` | Renoncer au contrat |
| `renonciation.texte` | Vous pouvez renoncer à un achat de moins de 14 jours, pour les plans que vous n'avez pas encore utilisés. |
| `renonciation.ligne` | Achat du {date} · {produit} · {n} plan(s) non utilisé(s) · remboursement de {montant} TTC |
| `renonciation.bouton` | Confirmer ma renonciation |
| `renonciation.fait` | Votre renonciation est enregistrée le {date} à {heure}. Un accusé de réception vous est envoyé par e-mail. Le remboursement de {montant} arrive sur votre carte sous 14 jours au plus. |
| `renonciation.rien` | Aucun achat n'est concerné : vos plans ont été utilisés, ou l'achat date de plus de 14 jours. |

### 7.8 Page du destinataire d'un partage (particulier)

Sans compte, sans traceur ; seul un compteur agrégé est tenu (`OFFRES.md` § 2.7).

| Clé | Texte |
|---|---|
| `partage.bandeau` | Voici un futur logement, d'après son plan de vente. |
| `partage.entrer` | Entrer dans la visite |
| `partage.mention` | Illustration non contractuelle générée automatiquement à partir du plan de vente. |
| `partage.invitation` | Vous achetez aussi sur plan ? Votre premier plan est offert. |
| `partage.invitation.bouton` | Importer mon plan (vers `/offert`) |
| `partage.invitation.beta` | Vous achetez aussi sur plan ? Demandez une invitation pour essayer Sur Pièce. |
| `partage.invitation.bouton.beta` | Demander une invitation |
| `partage.pro` | Vous vendez du neuf ? Essai Sur Pièce Pro (vers `/pro/decouvrir`) |
| `partage.pro.prelancement` | Vous vendez du neuf ? Découvrir Sur Pièce Pro (tant que l'essai n'existe pas, R21) |

### 7.9 Page de visite d'un prospect (conseiller)

| Clé | Texte |
|---|---|
| `prospect.entete` | {Nom du conseiller} · {Cabinet} · {téléphone} · {e-mail} |
| `prospect.titre` | Visite du lot {lot} ; repli : Visite du logement |
| `prospect.sous_titre` | {Programme}, {ville} (saisis par le conseiller, facultatifs) |
| `prospect.accueil_defaut` | Bonjour, voici la visite du logement dont nous avons parlé. Faites le tour, pièce par pièce, et dites-moi ce que vous en pensez. |
| `prospect.entrer` | Entrer dans la visite |
| `prospect.interesse` | Je suis intéressé, prévenir mon conseiller |
| `prospect.rdv` | Prendre rendez-vous (Cabinet et Équipe) |
| `prospect.lien_perso` | Ce lien vous est personnel. **[À VALIDER : avocat]** |
| `prospect.mention` | Illustration non contractuelle générée automatiquement à partir du plan de vente. |
| `prospect.signature` | Visite réalisée avec Sur Pièce |

**Volet « Je suis intéressé »** :
- Titre : Prévenir {Prénom du conseiller}
- Texte : {Prénom du conseiller} saura que ce logement vous intéresse.
- Champ : Un message pour {Prénom du conseiller} (facultatif). Exemple affiché : « Je suis disponible jeudi en fin de journée. »
- Mention : Votre message n'est transmis qu'à {Prénom du conseiller}.
- Bouton : Prévenir {Prénom du conseiller}
- Confirmation : C'est fait. {Prénom du conseiller} est prévenu.
- Erreur : Le message n'est pas parti. Réessayez, ou appelez {Prénom du conseiller} au {téléphone}.

**Modèles de message pour le conseiller** (proposés à la création du lien, modifiables) :

E-mail :
> Objet : La visite du lot {lot}
>
> Bonjour {Prénom},
>
> Comme convenu, voici la visite du lot {lot} ({programme}) : {lien}
>
> Vous pouvez la parcourir pièce par pièce, depuis votre téléphone, sans rien installer. Ce lien vous est personnel. Il s'agit d'une illustration non contractuelle, réalisée d'après le plan de vente.
>
> Si le logement vous intéresse, le bouton « Je suis intéressé » me prévient directement.
>
> {Signature}

SMS ou messagerie :
> Bonjour {Prénom}, voici la visite du lot {lot} : {lien} (lien personnel, illustration non contractuelle). {Prénom du conseiller}

**Création d'un lien par le conseiller** :
- `pro.lien.libelle` : Nom du lien (visible par vous seul). Exemple affiché : « M. et Mme Martin, lot B12 ».
- `pro.lien.expiration` : Expire le {date} (90 jours par défaut)
- `pro.lien.creer` : Créer le lien
- `pro.lien.copie` : Lien copié.
- `pro.lien.couper` : Couper ce lien
- `pro.lien.coupe` : Ce lien ne fonctionne plus.
- `pro.lien.compteur` : Ouverte {n} fois · dernière ouverture le {date}

**Case d'autorisation du promoteur** (avant le premier lien d'un programme, obligatoire) :
> Je dispose de l'autorisation du promoteur, ou d'une convention de commercialisation, pour produire et diffuser ces illustrations.

Aide sous la case : Le document n'est pas demandé. Gardez-le : il peut vous être réclamé en cas de contestation.

### 7.10 Signaler un défaut

| Clé | Texte |
|---|---|
| `defaut.bouton` | Signaler un défaut |
| `defaut.titre` | Qu'avez-vous remarqué ? |
| `defaut.choix` | Un trou ou une fente dans un mur · Une zone noire ou sans texture · Un objet qui flotte · Un mur mal placé · Une porte à l'envers · Un équipement oublié ou mal orienté · Une cote qui ne correspond pas au plan · Autre chose |
| `defaut.piece` | Dans quelle pièce ? (facultatif) |
| `defaut.detail` | Un mot de plus ? (facultatif) |
| `defaut.position` | Nous enregistrons l'endroit où vous regardez, pour retrouver le défaut. |
| `defaut.envoyer` | Envoyer |
| `defaut.merci` | Merci. Nous vérifions et visons une correction sous 5 jours ouvrés, sans frais. Nous vous écrivons à chaque étape. |
| `defaut.merci_pro` | Merci. La visite corrigée ne décompte aucun plan. |

### 7.11 E-mails transactionnels

**Règles communes.**
- Expéditeur : Sur Pièce <bonjour@surpiece.fr>, envoyé depuis `mail.surpiece.fr` (SPF, DKIM, DMARC). Réponse : aide@surpiece.fr.
- Aucun pixel de suivi, aucun lien raccourci par un tiers (`ARCHITECTURE.md` D4).
- Aucun nom de fichier, identifiant ou texte technique.
- Texte brut lisible en plus du HTML. Un seul bouton par e-mail.
- En marque blanche : nom, logo et adresse d'expédition du client.

**Pied commun** :
> Sur Pièce · {raison sociale}, {adresse}
> Vous recevez cet e-mail parce que vous avez un compte Sur Pièce. Une question : répondez simplement à ce message.

Chaque e-mail : **Objet**, **Aperçu** (texte affiché après l'objet dans la boîte), **Corps**, **Bouton**.

#### E1. Lien de connexion

- **Objet** : Votre lien de connexion
- **Aperçu** : Un clic, et votre plan démarre.
- **Corps** :
  > Bonjour,
  >
  > Voici votre lien pour vous connecter à Sur Pièce. Il est valable {durée} minutes et ne sert qu'une fois.
  >
  > Le lien s'ouvre dans un autre navigateur, ou sur un autre appareil ? Saisissez plutôt ce code sur la page où vous l'avez demandé : {code}
  >
  > Ne transmettez ce code à personne.
  >
  > Vous n'avez rien demandé ? Ignorez cet e-mail : sans clic, rien ne se passe.
- **Bouton** : Me connecter
- `{code}` : 6 chiffres, écrits en deux groupes de trois (« 482 913 ») en texte, lisibles dans la version texte brut. Même durée que le lien ; 5 essais au plus (L5-03).
- Variante « code seul » (si D8 retient un fournisseur sans lien) : **Objet** : Votre code de connexion ; **Corps** : « Voici votre code pour vous connecter à Sur Pièce : {code}. Il est valable {durée} minutes. Ne le transmettez à personne. Vous n'avez rien demandé ? Ignorez cet e-mail. » ; pas de bouton.

#### E2. Bienvenue (compte créé, plan offert lancé)

- **Objet** : Bienvenue : votre plan est en chantier
- **Aperçu** : On vous écrit dès qu'il est prêt, dans ‹délai›. (Repli avant T0 et plan en file : « On vous écrit dès qu'il est prêt. »)
- **Corps** :
  > Bonjour,
  >
  > Votre compte est créé et votre plan de vente est en cours de lecture. Comptez ‹délai› ; on vous écrit dès qu'il est prêt.
  >
  > Ce que vous allez recevoir, offert :
  > - la maquette 3D vue du dessus, visible dès qu'elle est prête sur la page de suivi ;
  > - le plan 2D coté et la surface de chaque pièce, comparée au tableau du promoteur ;
  > - deux photos : le séjour, puis la chambre principale ou une autre pièce ;
  > - les points à faire confirmer par votre promoteur.
  >
  > Votre plan reste privé : il n'est ni publié ni transmis à votre promoteur.
  >
  > En attendant, vous pouvez faire le tour de l'appartement témoin.
  >
  > L'équipe Sur Pièce
- **Bouton** : Visiter l'appartement témoin
- Plan en file, plafond du jour ou plans offerts suspendus : la phrase « Comptez ‹délai› ; on vous écrit dès qu'il est prêt. » devient « Votre plan attend son tour ; on vous écrit dès qu'il est prêt. »
- **[Bêta]** : la liste « Ce que vous allez recevoir » est celle de la variante « bêta » du catalogue (plan complet ou aperçu, selon L0-04).

#### E3. Plan offert prêt

- **Objet** : Votre logement est prêt, d'après son plan
- **Aperçu** : La maquette vue du dessus, le plan coté, les surfaces et les photos vous attendent.
- **Corps** :
  > Bonjour,
  >
  > Votre plan est prêt : {typologie}, {surface} m² d'après le plan.
  > {Si écart : « {n} écart(s) avec le tableau du promoteur vous sont signalés. » Sinon : « Les surfaces correspondent au tableau du promoteur. » Sans tableau : ligne absente.}
  > {Si une photo manque : « Une photo n'a pas pu être prise : elle est omise. Le reste de votre plan vous est livré. »}
  >
  > La visite à hauteur d'yeux est prête elle aussi. Elle s'ouvre pour 29 €, sans nouvelle attente.
  >
  > Votre aperçu reste disponible jusqu'au {date}.
  >
  > Illustration non contractuelle générée automatiquement à partir du plan de vente.
- **Bouton** : Voir mon logement
- Envoi : à la fin du rendu des images, ou au délai maximal prévu pour les images (L5-11), même s'il en manque. Sans aucune photo, l'aperçu dit « La maquette vue du dessus, le plan coté et les surfaces vous attendent. »
- **[Bêta]** : la phrase sur la visite devient « La visite à hauteur d'yeux ne fait pas partie de votre plan de test. » ; ajouter avant la mention : « Votre avis nous aide : répondez à cet e-mail pour nous dire ce que vous en pensez. »

#### E4. Visite prête

- **Objet** : Votre visite est prête
- **Aperçu** : Entrez dans votre logement, pièce par pièce.
- **Corps** :
  > Bonjour,
  >
  > La visite de votre logement est prête : plan 2D, maquette 3D, visite, photos et fiche.
  > {Si une photo manque : « Une photo n'a pas pu être prise : elle est omise. » Sans aucune photo : « Les photos n'ont pas pu être prises : votre visite vous est livrée sans elles, et notre équipe est prévenue. » La liste devient alors « plan 2D, maquette 3D, visite et fiche ».}
  >
  > Pour la montrer à vos proches, créez un lien privé depuis la visite : ils l'ouvrent sans compte.
  >
  > Votre visite reste en ligne jusqu'au {date}. Un défaut ? Le bouton « Signaler un défaut » est dans la visite.
  >
  > Illustration non contractuelle générée automatiquement à partir du plan de vente. Seuls les plans et la notice annexés à votre contrat de vente font foi.
- **Bouton** : Entrer dans ma visite

#### E5. Précision demandée (une cote)

- **Objet** : Il nous manque une cote pour continuer
- **Aperçu** : Une minute suffit : indiquez une dimension connue du plan.
- **Corps** :
  > Bonjour,
  >
  > Votre plan est une image. Pour caler l'échelle, nous avons besoin d'une dimension que vous connaissez, par exemple la largeur du séjour : cliquez ses deux extrémités sur le plan, puis indiquez sa longueur.
  >
  > Rien n'a été décompté. Votre plan démarre dès que la cote est validée.
- **Bouton** : Indiquer la cote

#### E6. Échec : rien n'a été décompté

- **Objet** : Votre visite n'a pas pu être produite : rien n'a été décompté
- **Aperçu** : Votre plan est de nouveau disponible sur votre compte.
- **Corps** :
  > Bonjour,
  >
  > Nous n'avons pas pu produire la visite de votre plan déposé le {date}.
  > {Cause, une seule ligne parmi :
  > – lecture : « Nous n'avons pas réussi à lire ce plan avec assez de certitude. »
  > – vérification : « La visite n'a pas passé notre vérification avant livraison. Nous ne livrons pas une visite avec un défaut visible. »
  > – délai : « La préparation a pris trop de temps de notre côté. »}
  >
  > **Ce que ça change pour vous** : rien n'a été décompté. Votre plan {offert / payé} est de nouveau disponible sur votre compte. {Si payé : « Si vous préférez être remboursé, répondez simplement à cet e-mail. »}
  >
  > **Et maintenant** : notre équipe examine votre plan et vous écrit sous 2 jours ouvrés. Si votre visite est prête plus tard, elle vous sera livrée sans rien décompter. Vous pouvez aussi essayer avec le PDF d'origine du promoteur, qui donne le meilleur résultat.
- **Bouton** : Déposer un autre fichier

#### E7. Confirmation de commande

- **Objet** : Votre commande : {produit}, {montant} TTC
- **Aperçu** : Votre reçu, vos conditions et votre droit de renonciation.
- **Corps** :
  > Bonjour,
  >
  > Merci pour votre commande du {date}.
  > {Produit} · {montant} TTC, dont TVA {montant TVA} · commande n° {numéro}
  >
  > Vos plans se lancent jusqu'au {date}.
  >
  > **Votre droit de renonciation.** Vous pouvez renoncer à cet achat jusqu'au {date}, pour les plans que vous n'avez pas utilisés : depuis le lien « Renoncer au contrat ici » de votre compte, ou avec le formulaire joint. Quand vous lancez un plan ou ouvrez une visite, vous perdez ce droit pour ce plan.
  >
  > En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation : {nom du médiateur}, {site}.
  >
  > Pièces jointes : votre facture, nos conditions générales de vente (version {v}), le formulaire type de rétractation.
- **Bouton** : Voir mes plans

#### E8. Confirmation d'ouverture immédiate (support durable)

Envoyé à chaque lancement d'un plan payé ou déblocage d'une visite, avant la fin du délai de 14 jours (`juridique.md` § 1.2). Fusionné avec E7 quand l'achat et l'ouverture ont lieu au même moment. **[À VALIDER : avocat]**

- **Objet** : Confirmation : ouverture immédiate de votre visite
- **Aperçu** : Le texte que vous avez accepté, daté.
- **Corps** :
  > Bonjour,
  >
  > Le {date} à {heure}, vous avez demandé l'ouverture immédiate de la visite de votre logement, et reconnu perdre votre droit de rétractation pour ce plan.
  >
  > Texte accepté : « {texte exact de la case} »
  > Plan concerné : commande n° {numéro}, plan {n} sur {total}.
  >
  > Vos autres plans non utilisés restent rétractables jusqu'au {date}.
  >
  > Pièces jointes : nos conditions générales de vente (version {v}), le formulaire type de rétractation.
- **Bouton** : Entrer dans ma visite

#### E9. Accusé de réception d'une renonciation

- **Objet** : Accusé de réception de votre renonciation
- **Aperçu** : Remboursement de {montant} sous 14 jours au plus.
- **Corps** :
  > Bonjour,
  >
  > Nous avons reçu votre renonciation le {date} à {heure}.
  >
  > Votre déclaration : « Je renonce à mon achat du {date} ({produit}) pour {n} plan(s) non utilisé(s). »
  >
  > Remboursement : {montant} TTC, sur la carte utilisée, sous 14 jours au plus. Les plans concernés ont été retirés de votre compte.
- **Bouton** : aucun

#### E10. Rappel : plans à lancer (30 jours, puis 7 jours avant)

- **Objet** : Il vous reste {n} plan(s), à lancer avant le {date}
- **Aperçu** : Un autre lot, ou le plan modificatif du promoteur ?
- **Corps** :
  > Bonjour,
  >
  > Vous avez {n} plan(s) non utilisé(s). Ils se lancent jusqu'au {date}.
  >
  > Un autre lot à comparer, ou un plan modificatif envoyé par votre promoteur ? Déposez-le.
- **Bouton** : Déposer un plan

#### E11. Rappel avant suppression d'un aperçu

Envoyé 14 jours avant la fin des 6 mois **[À CONFIRMER : délai du rappel]**.

- **Objet** : Votre aperçu sera supprimé le {date}
- **Aperçu** : Pour garder votre logement en ligne, ouvrez la visite.
- **Corps** :
  > Bonjour,
  >
  > Comme prévu, votre aperçu du {date} et votre plan seront supprimés le {date}.
  >
  > Pour garder votre logement en ligne 24 mois, ouvrez la visite complète.
  >
  > Vous ne souhaitez rien garder ? Vous n'avez rien à faire.
- **Bouton** : Ouvrir la visite · 29 €
- **[Bêta]** (vente fermée) : aperçu de l'e-mail « Votre aperçu reste consultable jusque-là. » ; la phrase sur la visite complète est retirée ; bouton : Voir mon aperçu.

#### E12. Défaut signalé, puis corrigé

Accusé :
- **Objet** : Nous avons reçu votre signalement
- **Corps** :
  > Bonjour,
  >
  > Merci. Nous vérifions « {défaut} » dans {pièce}. Nous visons une correction sous 5 jours ouvrés, sans frais. Nous vous écrivons dès que c'est fait.

Correction :
- **Objet** : Votre visite est corrigée
- **Corps** :
  > Bonjour,
  >
  > Le défaut signalé le {date} est corrigé. Ce défaut devient aussi un contrôle automatique, pour qu'il ne revienne pas.
- **Bouton** : Revoir ma visite

Défaut non retrouvé :
- **Objet** : Votre signalement du {date}
- **Corps** :
  > Bonjour,
  >
  > Nous n'avons pas retrouvé de défaut à l'endroit signalé. Pouvez-vous nous en dire plus en répondant à cet e-mail, avec une capture d'écran si possible ?

#### E13. Conseillers : essai démarré

- **Objet** : Votre essai Sur Pièce Pro a commencé
- **Aperçu** : 14 jours, 3 plans complets, jusqu'au {date}.
- **Corps** :
  > Bonjour {Prénom},
  >
  > Votre essai court jusqu'au {date} : 3 plans complets, avec les fonctions Cabinet. Aucune carte n'est enregistrée : rien ne sera prélevé.
  >
  > Pour commencer :
  > 1. déposez le plan de vente d'un lot que vous commercialisez ;
  > 2. envoyez le lien de visite à un prospect ;
  > 3. voyez s'il clique « Je suis intéressé ».
  >
  > Rappel : pour diffuser la visite d'un programme, il faut l'accord du promoteur.
  >
  > Une démonstration de 30 minutes en visio ? Répondez à cet e-mail.
- **Bouton** : Déposer un premier plan

#### E14. Conseillers : fin d'essai dans 3 jours

- **Objet** : Votre essai se termine le {date}
- **Aperçu** : Vos liens restent actifs 30 jours après.
- **Corps** :
  > Bonjour {Prénom},
  >
  > Vous avez utilisé {n} plan(s) sur 3 et créé {m} lien(s) de visite.
  >
  > Pour continuer, choisissez une formule. Sans formule, rien n'est prélevé et vos liens restent actifs 30 jours après la fin de l'essai.
- **Bouton** : Choisir une formule

#### E15. Conseillers : un prospect est intéressé

- **Objet** : {Nom du lien} est intéressé par le lot {lot}
- **Aperçu** : Clic sur « Je suis intéressé » le {date} à {heure}.
- **Corps** :
  > Bonjour {Prénom},
  >
  > {Nom du lien} a cliqué « Je suis intéressé » le {date} à {heure}, depuis la visite du lot {lot} ({programme}).
  >
  > Son message : « {message} » (ou : Pas de message.)
  >
  > Cette personne vous a contacté elle-même. Répondez-lui selon vos règles habituelles.
- **Bouton** : Voir le lien

#### E16. Invitation à la bêta fermée (particulier)

Envoyé par l'équipe aux personnes invitées (L6-10). Aucun prix, aucun achat proposé (R13). Aucun plan réel en illustration.

- **Objet** : Votre invitation à essayer Sur Pièce
- **Aperçu** : Votre code d'invitation et votre plan offert.
- **Corps** :
  > Bonjour,
  >
  > Vous êtes invité à essayer Sur Pièce pendant sa phase de test. Vous déposez le plan de vente de votre appartement neuf, et vous voyez votre logement d'après ses cotes.
  >
  > Votre code d'invitation : {code_invitation}
  > {Contenu du plan de test, lu dans la variante « bêta » du catalogue (L0-04)}, à lancer avant le {date}.
  >
  > Pour que ça marche :
  > - un appartement sur un ou deux niveaux (duplex) ;
  > - le PDF envoyé par le promoteur, de préférence ; une capture nette convient aussi ;
  > - l'adresse e-mail qui reçoit cette invitation, pour créer votre compte.
  >
  > Pendant la phase de test, rien n'est à payer. Un défaut ? Signalez-le depuis votre plan, ou répondez à cet e-mail.
- **Bouton** : Déposer mon plan

#### E17. Invitation d'un collègue (pros)

- **Objet** : {Prénom Nom} vous invite à rejoindre {Organisation} sur Sur Pièce
- **Aperçu** : Invitation valable jusqu'au {date}.
- **Corps** :
  > Bonjour,
  >
  > {Prénom Nom} vous invite à rejoindre {Organisation} sur Sur Pièce, comme {rôle}.
  >
  > {Selon le rôle : « Administrateur : vous gérez les réglages et les membres. » · « Membre : vous déposez des plans et créez des liens de visite. »}
  >
  > L'invitation est valable jusqu'au {date}. Pour l'accepter, connectez-vous avec cette adresse e-mail.
  >
  > Vous ne connaissez pas {Prénom Nom} ? Ignorez cet e-mail : sans clic, rien ne se passe.
- **Bouton** : Rejoindre {Organisation}

#### E18. Retard dû à un incident

Envoyé par l'équipe quand un incident de notre côté retarde des plans au-delà du délai affiché (L5-21). Si le plan n'aboutit pas dans les délais de libération (`OFFRES.md` § 6.4), E6 suit.

- **Objet** : Votre plan prend du retard
- **Aperçu** : Rien n'a été décompté. Vous n'avez rien à faire.
- **Corps** :
  > Bonjour,
  >
  > Un incident de notre côté retarde la préparation de votre plan déposé le {date}.
  >
  > **Ce que ça change pour vous** : votre plan est gardé, et rien n'a été décompté.
  >
  > **Et maintenant** : vous n'avez rien à faire. Nous vous écrivons dès qu'il est prêt. L'état du service est suivi en ligne.
- **Bouton** : Voir l'état du service

### 7.12 Messages d'erreur

Chaque message : ce qui s'est passé, ce que ça change, quoi faire. Pas de code d'erreur à l'écran ; le détail technique part au journal de l'équipe.

**Pendant la fabrication d'un plan**

| Clé | Message |
|---|---|
| `erreur.lecture` | La lecture de votre plan n'a pas abouti. Rien n'a été décompté : votre plan reste disponible. Notre équipe l'examine et vous écrit sous 2 jours ouvrés. |
| `erreur.verification` | Votre visite n'a pas passé notre vérification avant livraison : nous ne livrons pas une visite avec un défaut visible. Rien n'a été décompté. Notre équipe vous écrit sous 2 jours ouvrés. |
| `erreur.delai` | La préparation prend plus de temps que prévu de notre côté. Rien n'a été décompté. On vous écrit dès que votre visite est prête, sans rien décompter. |
| `erreur.indisponible` | Le service est momentanément indisponible. Votre plan est gardé ; nous reprenons dès que possible et vous prévenons par e-mail. |
| `erreur.interrompu` | Le travail sur votre plan a été interrompu de notre côté. Il reprend tout seul : vous n'avez rien à faire. [SI LIVRÉ : reprise automatique, `audit-code.md` A2] |
| `erreur.bouton_reessayer` | Réessayer |

**Connexion et compte**

| Clé | Message |
|---|---|
| `erreur.lien_connexion` | Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau : il arrive en quelques secondes. |
| `erreur.email_invalide` | Cette adresse e-mail semble incomplète. Vérifiez-la. |
| `erreur.email_jetable` | Cette adresse e-mail n'est pas acceptée. Utilisez votre adresse habituelle : c'est là que nous vous prévenons. |
| `erreur.verification_humain` | Nous n'avons pas pu vérifier votre demande. Rechargez la page et réessayez. |
| `erreur.offert_deja_utilise` | Votre plan offert a déjà été utilisé avec ce compte. La visite complète de ce plan coûte 29 €. |
| `erreur.offert_deja_utilise.beta` | Votre plan de test a déjà été utilisé avec ce compte. Pour en essayer un autre, écrivez-nous. |
| `erreur.offert_meme_plan` | Ce plan a déjà bénéficié d'un aperçu offert. Sa visite complète coûte 29 €. |
| `erreur.offert_meme_plan.beta` | Ce plan a déjà été lancé pendant la phase de test. Déposez un autre plan, ou écrivez-nous. |
| `erreur.offert_expire` | Votre plan offert n'a pas été lancé dans les 30 jours. La visite complète reste disponible pour 29 €. |
| `erreur.offert_expire.beta` | Votre plan de test n'a pas été lancé avant le {date}. Écrivez-nous si vous voulez toujours essayer. |
| `erreur.relance_refusee` | Nous reprenons ce plan de notre côté. Vous n'avez rien à faire : on vous écrit dès qu'il est prêt. |
| `erreur.google` | La connexion avec Google n'a pas abouti. Réessayez, ou recevez un lien de connexion par e-mail. |

**Paiement**

| Clé | Message |
|---|---|
| `erreur.paiement_refuse` | Le paiement n'a pas abouti. Rien n'a été prélevé. Essayez une autre carte, ou réessayez dans quelques minutes. |
| `erreur.paiement_interrompu` | Le paiement a été interrompu. Si un montant a été prélevé, votre plan apparaît dans votre compte d'ici quelques minutes. Sinon, réessayez. |
| `erreur.cases` | Cochez les deux cases pour continuer. |

**Liens et visites**

| Clé | Message |
|---|---|
| `erreur.lien_expire` | Ce lien de visite a expiré. Demandez un nouveau lien à la personne qui vous l'a envoyé. |
| `erreur.lien_coupe` | Ce lien de visite n'est plus actif. Demandez un nouveau lien à la personne qui vous l'a envoyé. |
| `erreur.lien_inconnu` | Ce lien ne mène à aucune visite. Vérifiez qu'il est complet. |
| `erreur.3d` | La 3D ne démarre pas sur cet appareil. Le plan 2D et les photos restent disponibles. Essayez un navigateur à jour, ou un autre appareil. |
| `erreur.3d.360` | [SI LIVRÉ : L4-16, si le 360° sert de repli, à décider] La 3D ne démarre pas sur cet appareil. La visite à 360°, le plan 2D et les photos restent disponibles. |
| `erreur.chargement` | La visite met du temps à se charger. Vérifiez votre connexion ; elle reprend dès que possible. |
| `erreur.connexion` | La connexion à Internet a été interrompue. Vérifiez-la, puis réessayez. |

Le texte actuel de `moteur/ui.js` qui cite la bibliothèque 3D et son adresse est remplacé par `erreur.3d`.

**Conseillers**

| Clé | Message |
|---|---|
| `erreur.pro.quota` | Vous avez utilisé les plans de ce mois. Ajoutez 5 plans, ou attendez le {date}. |
| `erreur.pro.simultanes` | {n} plans sont déjà en chantier sur votre compte. Le suivant démarre dès que l'un d'eux est prêt. |
| `erreur.pro.siren_essai` | Un essai a déjà été utilisé pour cette entreprise. Choisissez une formule, ou demandez à un collègue déjà inscrit de vous inviter. |
| `erreur.pro.siren_inconnu` | Nous ne trouvons pas ce SIREN. Vérifiez les 9 chiffres. |
| `erreur.pro.autorisation` | Confirmez l'autorisation du promoteur pour créer le premier lien de ce programme. |
| `erreur.pro.recharge_limite` | Pour cet achat, écrivez-nous : nous le validons avec vous sous 1 jour ouvré. |

**Pages**

| Clé | Message |
|---|---|
| `erreur.404` | Cette page n'existe pas, ou plus. Retour à l'accueil. |
| `erreur.500` | Quelque chose n'a pas fonctionné de notre côté. Réessayez dans quelques minutes. Vos plans et vos visites ne sont pas touchés. |

### 7.13 Bandeau de consentement

**Quand l'afficher (R18).** Aucun bandeau tant qu'Umami tourne dans son réglage minimal, exempté de consentement (`SUIVI.md` § 1.2, § 6.3). **Le bandeau arrive dès qu'un traceur non exempté est activé** : UTM enrichis, relecture de sessions, publicité (Meta, Google). Décision à confirmer en L0-05. Outil proposé : tarteaucitron.js, hébergé chez nous. Tant qu'il n'y a pas de bandeau, le lien « Gestion des traceurs » du pied de page mène à `/traceurs`, avec l'opposition à la mesure anonyme.

**Règles CNIL** : refuser aussi simple qu'accepter ; boutons de même taille et de même style ; rien de publicitaire avant le choix ; choix conservé 6 mois ; modifiable à tout moment.

**Bandeau du site** :
- Titre : Vos choix sur ce site
- Texte : Nous mesurons l'audience de ce site de façon anonyme, sans cookie publicitaire. Avec votre accord, nous mesurons aussi d'où viennent nos visiteurs et, sur un petit échantillon, la façon dont les pages sont parcourues. {Si la publicité est branchée : « Nous mesurons aussi l'efficacité de nos publicités chez Google et Meta (Facebook, Instagram). »}
- Boutons : Tout refuser · Tout accepter
- Lien : Choisir

**Panneau « Choisir »** (une ligne par finalité réellement activée, catégories de `SUIVI.md` § 6.2) :

| Finalité | État | Texte |
|---|---|---|
| Nécessaires au service | Toujours actif | Connexion à votre compte, sécurité, prévention des abus du plan offert, mémorisation de vos choix. |
| Mesure d'audience anonyme | Active, avec opposition possible | Nombre de visites et pages vues, sans cookie et sans vous suivre d'un site à l'autre. Case : « Je m'oppose à cette mesure ». |
| Mesure enrichie | Désactivée par défaut | Savoir quelle campagne ou quel partenaire vous a amené, et revoir de façon anonymisée quelques parcours sur ce site, jamais dans votre compte ni dans une visite. |
| Publicité | Désactivée par défaut, affichée seulement une fois branchée | Mesurer nos publicités chez Google et Meta. Google et Meta reçoivent alors des informations sur votre visite, dont ils sont en partie responsables. |

- Boutons : Tout refuser · Enregistrer mes choix
- Note sous les boutons : Votre choix est conservé 6 mois. Vous pouvez le changer à tout moment, depuis le lien « Gestion des traceurs » en bas de chaque page.

**[À VALIDER : avocat]** : le cookie d'appareil anti-abus (aléatoire, sans empreinte du navigateur) est classé ici comme nécessaire (`auth-paiement.md` § 3.5, point 7).

**Page de visite d'un prospect** (formules Cabinet et Équipe, seulement si le conseiller active le détail des visites) **[À VALIDER : avocat]** :
- Texte : {Prénom du conseiller} aimerait savoir quelles pièces vous regardez et combien de temps, pour mieux vous répondre. Rien n'est transmis sans votre accord.
- Boutons : Refuser · Accepter
- Après le choix : Votre choix est enregistré. Vous pouvez le changer en bas de la page.
- Lien permanent en bas de page : Mes choix sur cette visite

**Pas de bandeau** sur la page d'un partage privé (aucun traceur) ni dans une visite intégrée chez un promoteur (aucun traceur ; le promoteur mesure sous sa propre bannière).

### 7.14 Accès pendant la bêta fermée (R13)

Le dépôt est réservé aux invités, sur `app.<domaine>/depot` (non référencé, L6-01). Cet écran passe avant le dépôt ; le bouton de l'e-mail E16 y mène. Aucun prix, aucun achat.

| Clé | Texte |
|---|---|
| `beta.titre` | Sur Pièce est en phase de test |
| `beta.texte` | Le dépôt est réservé aux personnes invitées. Saisissez le code reçu dans votre e-mail d'invitation. |
| `beta.code.label` | Code d'invitation |
| `beta.code.bouton` | Continuer |
| `beta.code.inconnu` | Ce code n'est pas reconnu. Vérifiez-le dans votre e-mail d'invitation. |
| `beta.code.expire` | Ce code n'est plus valable. Répondez à votre e-mail d'invitation : nous regardons avec vous. |
| `beta.email_non_invite` | Cette adresse ne figure pas parmi les invitations. Utilisez l'adresse qui a reçu l'invitation. |
| `beta.sans_code` | Vous n'avez pas de code ? Laissez votre e-mail : nous invitons par petits groupes. |
| `beta.sans_code.bouton` | Demander une invitation |
| `beta.mention` | Phase de test : rien n'est à payer. Signalez-nous tout défaut, il sera corrigé. |

Les refus du plan offert en bêta ont leurs variantes (`erreur.offert_*.beta`, § 7.12). Le volet de la visite verrouillée aussi (`verrou.volet.beta`, § 7.6).

### 7.15 Invitations de collègues (pros)

Sièges et rôles : `PARCOURS.md` B8, ticket L5-04. Rôles affichés : Propriétaire (facturation et tout le reste), Administrateur (réglages et membres), Membre (plans et liens de visite). Invitation valable 7 jours ; e-mail E17.

**Page d'acceptation** (`/invitation/‹jeton›`, sans texte technique) :

| Clé | Texte |
|---|---|
| `invitation.titre` | Rejoindre {Organisation} |
| `invitation.texte` | {Prénom Nom} vous invite comme {rôle}. Vous accéderez aux plans et aux liens de visite de {Organisation}. |
| `invitation.connexion` | Pour accepter, connectez-vous avec l'adresse qui a reçu l'invitation. |
| `invitation.accepter` | Accepter l'invitation |
| `invitation.refuser` | Refuser |
| `invitation.acceptee` | C'est fait : vous avez rejoint {Organisation}. |
| `invitation.refusee` | Invitation refusée. |
| `erreur.invitation_expiree` | Cette invitation a expiré. Demandez-en une nouvelle à la personne qui vous l'a envoyée. |
| `erreur.invitation_utilisee` | Cette invitation a déjà servi. Si vous avez déjà rejoint l'équipe, connectez-vous. |
| `erreur.invitation_autre_adresse` | Cette invitation a été envoyée à une autre adresse. Connectez-vous avec l'adresse qui l'a reçue, ou demandez une nouvelle invitation. |
| `erreur.invitation_places` | Toutes les places de {Organisation} sont prises. Prévenez la personne qui vous a invité. |

`erreur.invitation_autre_adresse` ne dit jamais à quelle adresse l'invitation a été envoyée (L5-04).

**Gestion des membres** (propriétaire et administrateurs) :

| Clé | Texte |
|---|---|
| `membres.titre` | Membres |
| `membres.inviter` | Inviter un collègue |
| `membres.email` | Son e-mail professionnel |
| `membres.role` | Rôle : Administrateur (réglages et membres) · Membre (plans et liens de visite) |
| `membres.envoyer` | Envoyer l'invitation |
| `membres.envoyee` | Invitation envoyée à {email}. Elle est valable 7 jours. |
| `membres.en_attente` | Invitation en attente · envoyée le {date} · Renvoyer · Annuler |
| `membres.places_pleines` | Toutes les places sont prises. Ajouter un utilisateur · 10 € HT par mois · ou passer à Équipe |
| `membres.retirer` | Retirer {Prénom Nom} |
| `membres.retirer.confirmer` | Retirer {Prénom Nom} de {Organisation} ? Ses plans restent à {Organisation}, et ses liens de visite restent actifs. |
| `membres.dernier_proprietaire` | Une équipe garde toujours au moins un propriétaire. Nommez-en un autre d'abord. |

### 7.16 Maintenance

Pendant une maintenance, le dépôt, le lancement et le paiement sont suspendus ; les visites publiées, les partages et les aperçus restent ouverts ; un plan déjà en chantier se termine (L5-21). `{heure}` : fin estimée saisie par l'équipe à l'activation, toujours « environ » et jamais garantie ; sans estimation, les variantes `.sans_fin` s'affichent.

| Clé | Texte |
|---|---|
| `maintenance.bandeau` | Maintenance en cours jusqu'à {heure} environ : le dépôt de nouveaux plans est suspendu. Vos visites et vos aperçus restent ouverts. |
| `maintenance.bandeau.sans_fin` | Maintenance en cours : le dépôt de nouveaux plans est suspendu pour le moment. Vos visites et vos aperçus restent ouverts. |
| `maintenance.depot` | Le dépôt est suspendu pendant une maintenance. Rien n'a été envoyé. Réessayez après {heure}. |
| `maintenance.depot.sans_fin` | Le dépôt est suspendu pendant une maintenance. Rien n'a été envoyé. Réessayez un peu plus tard. |
| `maintenance.lancement` | Le lancement est suspendu pendant une maintenance. Rien n'a été décompté : relancez votre plan après {heure}. |
| `maintenance.lancement.sans_fin` | Le lancement est suspendu pendant une maintenance. Rien n'a été décompté : relancez votre plan un peu plus tard. |
| `maintenance.paiement` | Le paiement est suspendu pendant une maintenance. Rien n'a été prélevé. Réessayez après {heure}. (Non affiché pendant la bêta.) |
| `maintenance.en_chantier` | Votre plan était déjà en chantier : il se termine normalement, et on vous écrit dès qu'il est prêt. |
| `maintenance.annonce` | Maintenance prévue le {date}, de {heure_debut} à {heure_fin}. Le dépôt de nouveaux plans sera suspendu ; les visites publiées restent ouvertes. |
| `maintenance.etat` | Suivre l'état du service → (vers la page d'état publique, L5-21) |

- `maintenance.annonce` paraît 48 h avant une maintenance prévue (engagement de service des promoteurs, `OFFRES.md` § 4.7), dans l'application et sur la page d'état.
- Un incident qui retarde des plans déjà lancés : e-mail E18.

---

## 8. Éléments communs

### 8.1 En-tête

**Pages publiques (visiteur non connecté)** :
- À gauche : le logo, mot-symbole SUR PIÈCE dans son cartouche. Texte alternatif : « Sur Pièce, accueil ».
- Menu : Comment ça marche · Appartement témoin · Tarifs · Professionnels
- Sous-menu « Professionnels » : Conseillers · Promoteurs · Marque blanche et partenaires
- À droite : Se connecter · bouton **Importer mon plan**
- Sur les pages pros, le bouton devient : **Essayer 14 jours** (conseillers) ou **Demander une démonstration** (promoteurs, marque blanche).
- Sur téléphone : Menu · Fermer
- **[Liste d'attente]** : menu sans « Tarifs » ; bouton **Demander une invitation** ; « Se connecter » visible dès que les invités ont un compte (L6-01).
- **[Pré-lancement pro]** : sur la page conseillers, le bouton devient **Demander un entretien**.

**Visiteur connecté (particulier)** :
- Mes plans · {n} plan(s) disponible(s) · Mon compte · Se déconnecter
- Bouton : Importer un plan

**Visiteur connecté (pro)** :
- Mes lots · Mes liens · {n} plan(s) ce mois-ci · Réglages · Mon compte · Se déconnecter
- Bouton : Déposer un plan

### 8.2 Pied de page

**Colonne 1 — Sur Pièce**
Achetez sur plan, jugez sur pièce. **[dépend du nom]** (Avant-Clés : « Entrez chez vous avant la remise des clés. »)
Du plan de vente à la visite, d'après les cotes du plan.

**Colonne 2 — Particuliers**
Importer mon plan · Appartement témoin · Tarifs · Notre méthode · Questions fréquentes

**Colonne 3 — Professionnels**
Conseillers · Promoteurs · Marque blanche · Codes à offrir

**Colonne 4 — Guides**
Rétractation en VEFA · Visite cloisons · Choisir ses TMA · Acheter sur plan

**Colonne 5 — Informations**
Mentions légales · Conditions générales d'utilisation · Conditions générales de vente · Politique de confidentialité · Gestion des traceurs · Signaler un contenu · Contact

**Ligne visible sur toutes les pages** : Renoncer au contrat ici (dès que la vente est ouverte, L8-03)

**[Liste d'attente]** : colonne 2 : Demander une invitation · Appartement témoin · Notre méthode · Questions fréquentes. **[Pré-lancement pro]** : colonne 3 : Conseillers · Promoteurs · Marque blanche (sans « Codes à offrir »).

**Ligne du médiateur** : En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation : {nom du médiateur}, {site}.

**Dernière ligne** : © 2026 {raison sociale}. Les visites et les photos sont des illustrations non contractuelles, générées automatiquement à partir des plans de vente.

### 8.3 Mentions non contractuelles

Textes canoniques (`MARQUE.md` § 8.3, `juridique.md` § 5.1) **[À VALIDER : avocat]**. Non désactivables, y compris en marque blanche.

| Où | Texte |
|---|---|
| Sur chaque photo (incrustée) et dans la visite (bandeau permanent) | Illustration non contractuelle générée automatiquement à partir du plan de vente. |
| Espaces réduits (vignettes, téléphone) | Illustration non contractuelle |
| Visuels marketing (site, réseaux, salons) | Appartement témoin fictif · Illustration non contractuelle |
| Fiche du logement | Les dimensions proviennent du plan quand il les indique ; les autres sont estimées. Hauteurs, matériaux, couleurs, mobilier, vue et ensoleillement sont indicatifs. Seuls les plans et la notice descriptive annexés à votre contrat de vente font foi. |

Le texte actuel de la galerie (« Images de synthèse calculées automatiquement… Non contractuel. », `lire.py`) est à aligner sur ces textes.

### 8.4 Bloc « limites » standard

À placer près de chaque bouton d'achat et de chaque appel au dépôt :

> Appartements sur un ou deux niveaux (duplex) · logement présenté vide, finitions supposées · pas de mobilier ni de rendu photoréaliste · illustration non contractuelle.

Version courte (sous un bouton) : Appartements sur un ou deux niveaux (duplex) · logement vide · illustration non contractuelle.

### 8.5 Signature en marque blanche et sur les pages de conseillers

- Signature : Visite réalisée avec Sur Pièce
- Elle ne dit jamais que nous validons le logement ou le lot.
- Retirable en marque blanche contre paiement ; la mention non contractuelle, elle, reste.

### 8.6 Mentions légales (plan de la page)

Contenu requis (`juridique.md` § 1.8), à remplir à la création de la société :
- dénomination, forme juridique, capital, siège, RCS et SIREN, numéro de TVA ;
- téléphone et e-mail ;
- directeur de la publication ;
- hébergeur : nom, adresse, téléphone ;
- médiateur de la consommation ;
- liens : CGU, CGV, politique de confidentialité, gestion des traceurs ;
- signaler un contenu : formulaire ou adresse dédiée (règlement européen sur les services numériques).

---

## 9. Page Méthode

**Adresse** : `/methode`

**Objectif.** Donner les preuves et l'information due (lecture par intelligence artificielle, données, limites), puis ramener au dépôt. Mesure : clics vers le dépôt.

**Visiteur type.** Le particulier le plus prudent, le conseiller qui vérifie avant de recommander, le promoteur avant un pilote.

**État d'esprit.** Il veut savoir d'où viennent les chiffres, ce qui est lu et ce qui est inventé. Il se méfie des promesses.

**Balise title** (51 signes) : `Comment nous lisons votre plan de vente | Sur Pièce`

**Meta description** (148 signes) : `Murs, cotes et échelle lus dans le PDF du promoteur, surfaces comparées au tableau, visite vérifiée avant livraison : notre méthode, et ses limites.`

**Mot-clé** : plan 3d a partir d un plan 2d. Secondaire : faire un plan 3d a partir d un plan 2d.

### 9.1 Premier écran

**Surtitre** : MÉTHODE

**Titre (H1) retenu** : Comment votre plan de vente devient une visite.

**Variantes à tester** :

| Variante | Titre |
|---|---|
| A | Ce que nous lisons, ce que nous supposons. |
| B | Lu dans le plan, vérifié avant livraison. |
| C | Du plan coté à la visite : notre méthode, et ses limites. |

**Sous-titre** : Nous ne redessinons pas votre logement à l'œil. Voici ce que nous lisons dans votre plan, comment nous le vérifions, et ce que nous devons supposer.

### 9.2 Ce que nous lisons

- Les murs, leur épaisseur et leur position.
- Les portes, leur largeur et leur sens d'ouverture ; les fenêtres et les portes-fenêtres, d'après le sigle écrit à côté et la légende de votre plan : une « FA » n'a pas le même sens d'un promoteur à l'autre.
- Les escaliers et les niveaux d'un duplex.
- Les équipements dessinés : cuisine, douche ou baignoire, vasque, WC.
- Les cotes, les noms des pièces et, s'il existe, le tableau des surfaces du promoteur.
- Les espaces extérieurs : loggia, balcon.

### 9.3 Sur le PDF du promoteur

Sur le PDF du promoteur, les murs, les cotes et l'échelle sont lus directement dans le fichier. C'est le meilleur point de départ : demandez-le à votre conseiller commercial si vous ne l'avez pas.

### 9.4 Sur une capture ou une photo

Vous cliquez les deux extrémités d'une cote connue et vous indiquez sa longueur : cela cale l'échelle. Comptez 5 à 10 cm d'écart possible. L'image doit être nette et faire au moins 700 pixels sur son petit côté.

### 9.5 Comment nous vérifions

- **Les surfaces.** Chaque surface lue est comparée au tableau du promoteur. Chaque écart vous est signalé.
- **La visite.** Avant de vous être livrée, chaque visite est parcourue automatiquement à la recherche de défauts visibles : une fente par laquelle on verrait dehors, une porte qu'on ne peut pas franchir, une pièce inaccessible depuis l'entrée. [À VALIDER : utilisateur, avocat ; `MARQUE.md` § 3.3] Nous remplissons aussi chaque pièce d'eau, virtuellement, portes et fenêtres fermées : si l'eau trouve une sortie, même de 4 cm, un trou existe et la visite n'est pas livrée. Chaque fenêtre est comparée au sigle écrit à côté d'elle sur le plan. Quand un défaut ne peut pas être réparé, la visite n'est pas livrée, et rien n'est décompté.
- **Chaque défaut devient un contrôle.** Chaque défaut que nous trouvons, ou que vous nous signalez et que nous confirmons, devient un nouveau contrôle automatique, pour qu'il ne revienne pas.

### 9.6 Ce que nous supposons

Le plan de vente ne dit pas tout. Ce que nous supposons est marqué comme tel :
- la hauteur sous plafond, quand le plan ne la donne pas ;
- les sols, les murs, les couleurs et les matériaux ;
- la lumière : un éclairage simple et clair, pas l'ensoleillement réel ;
- la vue par les fenêtres ;
- le détail des équipements, parfois simplifiés.

Le logement est présenté vide. Chaque point incertain porte un repère : « d'après le plan », « à vérifier » ou « hypothèse ».

### 9.7 Nos essais

- Testé sur 4 plans réels : T2 et T3, avec loggia, balcon ou façade en biais.
- Sur notre plan de référence, relevé à la main : 7 ouvertures sur 7 et 6 équipements sur 6 retrouvés.
- Sur les PDF de promoteur de nos essais, toutes les cotes lues correspondent à celles du plan. **[À VALIDER : avocat]**
- En production, comptez ‹délai› de bout en bout. **[À MESURER]** (ligne retirée avant T0)

C'est encore peu de plans. Nous avançons plan par plan : un nouveau type de plan n'est proposé qu'après avoir été validé sur des plans réels.

### 9.8 Qui lit votre plan, et où vont vos données

- La lecture du plan est faite par un programme d'intelligence artificielle. Des contrôles automatiques vérifient ensuite le résultat.
- Vos fichiers sont hébergés dans l'Union européenne **[À CONFIRMER : hébergeur]**. La lecture passe par un prestataire situé hors de l'Union, qui ne conserve pas votre plan après la lecture [SI LIVRÉ : option « aucune conservation » activée].
- [SI LIVRÉ : masquage du cartouche] Les noms et l'adresse du cartouche sont masqués avant la lecture.
- Votre plan n'est ni publié, ni transmis à votre promoteur, ni utilisé pour nos démonstrations ou pour améliorer notre service sans votre accord écrit.
- Les photos portent, dans leurs données internes, l'indication qu'elles sont générées automatiquement.
- Détails : politique de confidentialité.

### 9.9 Ce que nous ne faisons pas

- Nous ne vérifions pas le logement construit : seuls les plans annexés à votre contrat font foi.
- Nous ne donnons pas d'avis sur votre achat ni sur votre contrat.
- Pas de mobilier ni de rendu photoréaliste.
- Pas de logements sur plus de deux niveaux, pas de maisons.

**Bouton** : Importer mon plan
**Lien** : Visiter l'appartement témoin →

---

## 10. Preuves à collecter

Rien ici n'est inventé : chaque emplacement reste **masqué** tant qu'il n'est pas rempli de preuves réelles, avec l'accord écrit des personnes concernées (`MARQUE.md` § 3.3 et § 8.4).

### 10.1 Emplacements prévus

| Page | Emplacement | S'affiche quand |
|---|---|---|
| Accueil | Après « Fidélité et contrôle » : « Ils ont vu leur logement avant les clés » | Au moins 3 témoignages autorisés |
| Conseillers | Après les formules : « Ils envoient des visites à leurs prospects » | Au moins 2 témoignages de conseillers autorisés |
| Promoteurs | Après « Qualité » : étude de cas d'un pilote | Pilote terminé et accord écrit du promoteur |
| Marque blanche | Logos des partenaires | Contrat signé et accord écrit sur l'usage du logo |
| Méthode | Chiffres mesurés en production | Mesure datée, sur un volume suffisant |

### 10.2 Ce qu'il faut recueillir

| Preuve | Auprès de qui | Quand | Accord |
|---|---|---|---|
| Témoignages de particuliers | Testeurs (1 plan complet chacun) | Fin du test T2 (`OFFRES.md` § 9.2) | Écrit, texte exact relu par la personne, retirable |
| Témoignages de conseillers | Bêta fondateurs | Entretien du 2e mois | Écrit ; aucun programme cité sans l'accord de son promoteur |
| Étude de cas promoteur | Promoteur pilote | Après le pilote | Écrit, conformément au contrat (jamais de référence sans accord) |
| Logos de partenaires | Partenaires codes, promoteurs, réseaux | Après signature | Écrit, avec la version du logo fournie |
| Chiffres d'usage | Journal de production | Après les tests T0 et T8 | — (chiffres datés, avec leur périmètre) |

Chiffres à publier seulement une fois mesurés, datés et sur un volume suffisant :
- délai médian de bout en bout en production ;
- part des plans déposés pris en charge ;
- nombre de plans de référence validés ;
- part des visites livrées sans défaut signalé.

### 10.3 Questions à poser aux testeurs

1. À quel moment de votre achat étiez-vous ? (choix du lot, rétractation, TMA, visite cloisons, livraison)
2. Qu'est-ce qui vous faisait douter avant de voir votre logement ?
3. Qu'avez-vous compris en le visitant que le plan ne vous montrait pas ?
4. À qui l'avez-vous montré ?
5. Avez-vous vu un défaut ? Lequel ?
6. Qu'est-ce qui vous a manqué ?
7. La visite était-elle fluide sur votre appareil ? Lequel ?

### 10.4 Texte d'autorisation (à faire valider) **[À VALIDER : avocat]**

> J'autorise Sur Pièce à publier le témoignage ci-dessus, tel que je l'ai relu, avec mon prénom, l'initiale de mon nom et {ma ville / mon cabinet}, sur son site et ses réseaux, pendant 3 ans. Je peux retirer cette autorisation à tout moment en écrivant à aide@surpiece.fr.

### 10.5 Règles de publication

- Citation exacte, seulement corrigée des fautes de frappe.
- Pas de photo de la personne sans autorisation distincte.
- Pas de plan réel ni de visite réelle en illustration : l'appartement témoin seulement.
- Pas d'avis rémunéré ou récompensé.
- Si des avis de clients sont affichés un jour, dire s'ils sont vérifiés et comment (obligation d'information sur les avis en ligne). **[À VALIDER : avocat]**

---

## 11. Guides de référencement

Pages de contenu qui captent les recherches d'inquiétude sur le contrat (`marche.md` § 3.2). Chacune reste **neutre** : elle informe, ne conseille ni d'acheter ni de se rétracter, et renvoie au notaire ou à l'ADIL. **Tout contenu juridique est à faire relire par l'avocat.** Aucun chiffre sans source.

Seuls le cadrage et les titres sont donnés ici ; les textes seront écrits à part, un guide à la fois.

| Guide | Adresse | Title | Meta description | H1 |
|---|---|---|---|---|
| Rétractation | `/guides/retractation-vefa` | Rétractation en VEFA : le délai de 10 jours expliqué | Contrat de réservation VEFA : quand courent les 10 jours de rétractation, comment se rétracter, et comment juger votre logement pendant ce délai. | Rétractation en VEFA : vos 10 jours pour décider |
| Visite cloisons | `/guides/visite-cloisons-vefa` | Visite cloisons VEFA : que vérifier, pièce par pièce | Avant la visite cloisons, préparez les cotes et les surfaces de chaque pièce d'après votre plan de vente. Ce qu'il faut regarder et noter. | Visite cloisons : que vérifier, pièce par pièce |
| TMA | `/guides/tma-vefa` | TMA en VEFA : choisir ses modifications sur plan | Travaux modificatifs acquéreur : délais, frais de dossier, plan modificatif. Comment choisir vos TMA en voyant votre logement d'abord. | Choisir ses TMA en voyant son logement d'abord |
| Achat sur plan | `/guides/achat-sur-plan` | Achat sur plan : les pièges à éviter avant de signer | Surface, plan, notice, délai de rétractation : les points à vérifier avant et après le contrat de réservation d'un logement neuf. | Acheter sur plan : les points à vérifier |
| Plan 2D en 3D | `/guides/plan-2d-en-3d` | Transformer un plan 2D en 3D : trois façons de faire | Redessiner à la main, importer dans un logiciel ou lire le plan de vente : trois façons de passer d'un plan 2D à la 3D, et leurs limites. | Transformer un plan 2D en 3D : trois façons de faire |

Plan type d'un guide :
1. La réponse courte, en 3 phrases.
2. Les faits, sourcés (Légifrance, service-public.fr, ANIL).
3. Ce que vous pouvez préparer.
4. Où intervient Sur Pièce, en une section, sans pression.
5. Pour aller plus loin : notaire, ADIL.
6. Bouton : Importer mon plan.

Précautions :
- Guide TMA : aucun coût de TMA n'est cité, faute de source. On explique seulement ce qui fait varier le prix (frais de dossier, nature des travaux) et on renvoie au devis du promoteur.
- Guide « plan 2D en 3D » : aucun concurrent nommé.
- Guide rétractation : l'article L271-1 du Code de la construction et de l'habitation est à relire en entier avant publication.

---

## 12. Écarts et décisions attendues

### 12.1 Écarts avec les autres documents

| Point | Ce document | Autre document | Proposition |
|---|---|---|---|
| Le mot « duplex » | Apparaît dans la question de FAQ de l'accueil (§ 1.9), parce que les visiteurs le cherchent ; la réponse dit oui | `MARQUE.md` § 3.4 : périmètre « un ou deux niveaux (duplex) » | Décidé le 27/09/2026 (décision 11, complétée par l'utilisateur : « oui le duplex on l'a géré c'est bon, c'était avant ça ») : duplex acceptés en service (`niveaux_max = 2`, L4-08) ; la FAQ répond oui pour le duplex ; le triplex reste sans promesse ; le refus au-delà dit « plus de deux niveaux » (L0-05, question 3, tranchée) |
| Partage au banquier | Carte « rendez-vous bancaire » (§ 1.7) | `OFFRES.md` annexe B, question 6 | Publier seulement après l'avis de l'avocat ; sinon supprimer la carte |
| Délai | ‹délai› partout, avec un repli avant T0 (R12, § 0.3) | `OFFRES.md` § 1 : délai mesuré en production ; `PARCOURS.md` § 1.3 : règle du 75e centile | Remplacer ‹délai› par la valeur T0, tenue en une seule valeur de configuration |
| Contenu des offres | Aperçu et visite selon R1 ; ni « environ 11 photos » ni « 8 autres photos » (§ 0.7) | Anciennement `OFFRES.md` § 0.1, § 2.2, § 2.4, § 6.4 et `PARCOURS.md` A9 à A12 : 11 photos, 8 photos rendues au déblocage, « vue d'ensemble plongeante » | **Résolu (R1)** : documents alignés le 27/09/2026 |
| Publication de l'aperçu | Publié dès la vue du dessus et le plan 2D ; photo en échec omise, sans bloquer (R2) | Anciennement `PARCOURS.md` A9 : publication bloquée si une image manque | **Résolu (R2)** : `PARCOURS.md` aligné |
| Adresses | `/marque-blanche`, `/appartement-temoin` (§ 0.9) | Anciennement `SUIVI.md` § 2.6 et § 3.4 : `/partenaires`, `/demo` | **Résolu (R9)** : `SUIVI.md` et les tickets alignés |
| Bandeau de consentement | Aucun tant qu'Umami reste en réglage minimal exempté ; dès qu'un traceur non exempté est activé (R18, § 7.13) | Anciennement `SUIVI.md` § 7.2 et L7-02 : dès le lancement | **Résolu (R18)** : `SUIVI.md` et L7-02 alignés ; L0-05 confirme |
| Tarifs en liste d'attente | `/tarifs` non publiée et sections Prix masquées avant L8-07 (§ 0.8) | L2-04 et L2-08 : sections masquées tant que les prix ne sont pas validés | Proposition, conséquence de R13 : à valider |
| Bouton de dépôt en liste d'attente | « Demander une invitation » (§ 1.1) | L2-04 : « Importer mon plan » mène au formulaire | Proposition : un bouton qui ne dépose rien ne dit pas « Importer » ; à valider |
| Cycles de correction des promoteurs | Seulement pour leurs demandes de modification ; nos défauts toujours corrigés sans frais (R14, § 3.4, § 3.7) | `OFFRES.md` § 4.2 et § 4.7 | **Résolu (R14)** : `OFFRES.md` aligné |
| « Toutes les cotes retrouvées » | Page Méthode seulement | `OFFRES.md` § 1 : rendez-vous pro seulement ; `MARQUE.md` § 3.3 : Méthode et pros | Page Méthode avec son contexte, après avis de l'avocat |
| Intelligence artificielle nommée | FAQ de l'accueil et page Méthode | `MARQUE.md` § 5.2 : pas dans l'interface, oui là où l'information est due | Garder : la FAQ répond à une question que l'acquéreur pose |
| Écran d'attente | Promet un e-mail | `pipeline/accueil.html` promet une notification onglet fermé | Corriger le texte actuel (`audit-code.md` A4) |
| Mention de la galerie | Textes canoniques § 8.3 | `lire.py` (`note`) | Aligner |

Aucun fichier de `pipeline/` ni de `moteur/` n'est modifié ici ; le travail sur les niveaux (fini le 27/09/2026, non commité) les a modifiés.

### 12.2 Décisions attendues de l'utilisateur

1. Le nom : « Sur Pièce » est retenu comme nom provisoire (D10), « Avant-Clés » en plan B ; dépôt et domaines restent à faire avant toute publication (rechercher-remplacer, puis les passages **[dépend du nom]**, si le plan B est choisi).
2. Les prix, tous des hypothèses de lancement (`OFFRES.md`).
3. Le titre retenu de chaque page, et l'ordre des tests de variantes.
4. Le mot « duplex » dans la FAQ (§ 12.1). Décidé le 27/09/2026 (décision 11) : la FAQ répond oui pour le duplex.
5. La carte « rendez-vous bancaire » (§ 1.7).
6. Le bloc « bêta fondateurs » et la durée de l'entretien mensuel (§ 2.9) : il sert d'appel principal des pages pros en pré-lancement (R21).
7. La durée de validité du lien et du code de connexion (§ 7.3) et le délai du rappel avant suppression d'un aperçu (§ 7.11, E11).
8. Le contenu du plan de test en bêta, plan complet ou aperçu (L0-04) : il fixe `offre.apercu.resume.beta`, E2 et E16.
9. Le code d'invitation de la bêta : personnel (lié à l'adresse invitée) ou commun à une vague, et sa durée de validité (§ 7.14).
10. Le libellé de la deuxième photo (« la chambre principale ou une autre pièce »), à confirmer sur les plans de référence avec la règle de L4-09.
11. La fin estimée d'une maintenance, saisie à l'activation (§ 7.16) : champ à ajouter au réglage de L5-21.
12. Les propositions du § 12.1 : `/tarifs` non publiée en liste d'attente, bouton « Demander une invitation ».
13. La place du 360° : offre gratuite, à la place ou en plus de l'aperçu de R1, après la mesure de son coût de rendu (L1-16) ; son nom public ; textes marqués [SI LIVRÉ] jusque-là.
14. Le 360° comme repli quand la 3D ne démarre pas (`erreur.3d.360`).
15. La formulation du test d'immersion (§ 9.5), si l'utilisateur en fait une preuve publique (`MARQUE.md` § 3.3).
16. Les codes proposés pour les plans à plusieurs niveaux : `depot.refus.niveaux_illisibles` (niveaux non séparés, défaut de lecture, distinct du refus de périmètre `depot.refus.niveaux`) et `depot.reconnu.niveaux` (« 2 niveaux reconnus (R+1 et R+2) ») (L4-05).

### 12.3 À faire relire par l'avocat

Tous les passages marqués **[À VALIDER : avocat]**, en particulier :
- les cases d'écart consenti et de renonciation (§ 7.3, § 7.7) et l'e-mail de confirmation sur support durable (E8) ;
- le rappel sur la rétractation VEFA (§ 1.7) ;
- les 24 mois en ligne (§ 1.5, § 5.2) ;
- le remboursement de 15 € par plan non utilisé du lot de 3 (§ 5.4) ;
- le suivi détaillé des prospects avec consentement et la ligne « Ce lien vous est personnel » (§ 2.5, § 7.9, § 7.13) ;
- les codes à offrir comme réponse au droit du promoteur (§ 2.10) ;
- la phrase « toutes les cotes lues correspondent » (§ 9.7) ;
- les mentions non contractuelles (§ 8.3) ;
- le texte d'autorisation des témoignages (§ 10.4) ;
- le volet de la visite pendant la bêta, qui décrit une visite qui n'est pas en vente (`verrou.volet.beta`, § 7.6 ; L6-05) ;
- l'omission d'une photo promise dans l'aperçu (§ 0.7, `apercu.photos.omise`) au regard de la conformité.
