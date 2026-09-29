# Plateforme de marque

Version du 27/09/2026, alignée le même jour sur les décisions de l'utilisateur (D1 à D10) et les arbitrages du coordinateur (R1 à R23). **Proposition à valider par l'utilisateur.** Le nom « Sur Pièce » est retenu comme nom provisoire (D10), « Avant-Clés » en plan B.

Sources :
- recherches : `produit/recherche/nom.md`, `marche.md`, `juridique.md`, `audit-code.md`, `suivi.md`, `auth-paiement.md`, `hebergement.md` ;
- consignes du projet : `CLAUDE.md` ;
- code existant, relevé le 27/09/2026 : `pipeline/accueil.html`, `moteur/visite.css`, `moteur/ui.js`. Le travail sur les niveaux (fini le 27/09/2026, non commité) a modifié `pipeline/` et `moteur/` : les numéros de ligne cités peuvent avoir bougé.

Les ratios de contraste du § 10 ont été calculés le 27/09/2026 avec la formule de luminance relative des WCAG 2.x, sur les couleurs exactes du code.

---

## 0. En bref

- **Nom provisoire : Sur Pièce** (décision du 27/09/2026, D10). Plan B : Avant-Clés. Rien n'est acheté ni déposé à ce jour (§ 1).
- **Slogan : « Achetez sur plan, jugez sur pièce. »**
- **Promesse** : le plan de vente de votre logement neuf devient un plan coté, une maquette 3D, une visite et des photos, en ‹délai›, d'après les cotes du plan. ‹délai› est la valeur mesurée en production (test T0) ; aucun délai n'est écrit en dur avant (R12, `MESSAGES.md` § 0.3).
- **Personnalité** : l'ami architecte qui relit le plan avec vous. Il est précis, rassurant et chaleureux, honnête sur ses limites, et jamais technique. On **vouvoie**, partout.
- **Direction artistique « architecte new wave »** : les codes du dessin d'architecte servent d'ornement (cartouche, cotes, poché, hachures, tireté), avec Archivo à chasse variable, DM Mono pour les chiffres et un seul bleu, le Bleu plan `#2C49B8`. Traits de 1,5 px, angles droits, papier clair et lumineux.
- **Logo** :
  - mot-symbole « SUR PIÈCE » dans un cartouche, dont l'accent du È est dessiné comme un tiret de cote bleu ;
  - symbole « la pièce » (une pièce vue en plan, avec sa porte et son arc) pour le favicon et les avatars.
- **Marque blanche** : le client choisit son logo, sa couleur d'accent (contrôlée automatiquement), son domaine et le nom affiché. Restent fixes : les typographies, les neutres, les codes du plan, la mention non contractuelle et l'accessibilité.
- **Accessibilité** : dans les deux thèmes, toutes les couleurs de texte passent le niveau AA sur tous les fonds. La marge la plus faible est celle du vert sur le papier clair (4,53:1). Trait fin et millimétré restent décoratifs. Largeur minimale de mise en page : **320 px** (R10, § 10.2).
- **Polices** : à auto-héberger (Archivo et DM Mono, sous-ensemble latin en woff2). Plus aucun appel à Google Fonts.

---

## 1. Nom

### 1.1 Remplacer le nom facilement

Le nom n'est pas validé. Pour en changer :
1. rechercher-remplacer les formes du tableau, dans ce fichier et partout ailleurs ;
2. reprendre à la main les passages marqués **[dépend du nom]** (jeux de mots, dessin du mot-symbole), qui ne se traduisent pas mot à mot.

Le symbole « la pièce » (§ 7.3), la palette, la typographie et tout le reste de la direction artistique ne dépendent pas du nom.

| Forme | Sur Pièce (proposé) | Avant-Clés (plan B) |
|---|---|---|
| Texte courant | Sur Pièce | Avant-Clés |
| Mot-symbole | SUR PIÈCE | AVANT-CLÉS |
| Identifiant (domaines, comptes) | surpiece | avantcles |
| Domaine principal | surpiece.fr | avantcles.fr |
| Slogan | Achetez sur plan, jugez sur pièce. | Entrez chez vous avant la remise des clés. |
| Offre conseillers | Sur Pièce Pro | Avant-Clés Pro |
| Offre promoteurs | Sur Pièce Programme | Avant-Clés Programme |
| Signature en marque blanche | Visite réalisée avec Sur Pièce | Visite réalisée avec Avant-Clés |

### 1.2 Pourquoi Sur Pièce

D'après `nom.md` (36/40, premier des 10 finalistes) :
- **Il nomme le manque du neuf.** Dans l'ancien, on « juge sur pièce » ; en VEFA, on achète « sur plan ». Le produit rend au neuf ce qui lui manque.
- **Trois sens utiles** : la pièce du logement, la preuve (« juger sur pièces ») et, pour les pros, les pièces graphiques d'un dossier.
- **Il inspire confiance par la vérification**, pas par la promesse.
- **Il s'accorde avec la DA** : les capitales larges dans un cartouche, et le È comme détail graphique.
- **Il s'étend bien** : Pro, Programme, Résidence. Il se glisse dans une phrase : « je vous envoie le lien Sur Pièce ».

### 1.3 Alternatives, dans l'ordre

| Rang | Nom | Note | Point fort | Réserve |
|---|---|---|---|---|
| 2 | **Avant-Clés** (plan B) | 32 | Promesse la plus claire pour le particulier | Présence web non vérifiée (captcha) ; moins neutre en marque blanche |
| 3 | Clés en vue | 32 | Jeu sur « clés en main » | Famille « Clés en main » chargée en marques ; présence web non vérifiée |
| 4 | Tour de clé | 32 | Très facile à dire | Marque Hermès en classe 18, deux agences et un serrurier homonymes ; « donner un tour de clé » veut dire verrouiller |
| 5 | Planvif | 32 | Le plus neutre en B2B | Le moins chaleureux ; ne dit ni « chez soi » ni « avant » |

Écartés après vérification : À l'échelle (marque identique en classe 42), Lumeplan (proche de LUMIPLAN), Chez Demain, Visite neuve (trop descriptif), Entremurs et Imposte.

### 1.4 Graphie

- Texte courant : **Sur Pièce**, en deux mots, avec S et P capitales et l'accent grave, y compris en capitales (SUR PIÈCE). Le nom est invariable : « des visites Sur Pièce ».
- Jamais : SurPiece, Surpièce, Sur pièce, SUR PIECE, SP.
- Domaines et comptes : `surpiece`, sans accent ni tiret. `sur-piece` sert de redirection.
- L'expression elle-même garde ses minuscules dans une phrase : « jugez sur pièce ». Seule la marque prend les capitales.

### 1.5 Ce qui reste à vérifier

Contrôles qui n'ont pas pu être faits automatiquement (`nom.md` § 1 et § 7) :
- **base INPI** (data.inpi.fr a refusé l'accès automatisé), à interroger à la main sur « sur pièce », « surpièce », « surpieces » et les formes phonétiques proches ;
- **recherche Google** sur « Sur Pièce » associé à visite, plan, immobilier et application ;
- **`surpieces.fr` et `surpieces.com`**, au pluriel, enregistrés le 11/07/2026 chez Gandi et parqués : vérifier qu'ils ne sont pas à vous, sinon les surveiller ;
- **comptes sur les réseaux** : seul `github.com/surpiece` a été vu libre ;
- **tarifs et délais INPI et EUIPO**, non revérifiés ce jour ;
- **`.immo`** : vérifier au panier qu'il n'est pas vendu au tarif « premium ».

Autres risques connus :
- en anglais, « surpiece » est corrigé en « surplice ». Le référencement devra associer « Sur Pièce » à « plan » ou « visite » ;
- une expression courante se défend moins bien qu'un mot inventé. Il faut donc déposer aussi le logo.

### 1.6 Ce qu'il faut réserver et déposer, dans l'ordre, avant toute communication publique

1. **Domaines** :
   - indispensables : `surpiece.fr`, `surpiece.com`, `sur-piece.fr`, `sur-piece.com` ;
   - conseillés : `surpiece.eu`, `surpiece.app` ;
   - optionnels : `surpiece.immo`, `surpiece.io`.

   Tous redirigent vers `surpiece.fr`.
2. **Recherche d'antériorité manuelle** : INPI, TMview, EUIPO eSearch plus, Google.
3. **Dépôt INPI de la marque verbale « SUR PIÈCE »** :
   - classes 9, 35 et 42, avec la classe 36 en option ;
   - tarif connu de 190 € pour une classe, puis 40 € par classe supplémentaire, soit 270 € ou 310 € (non revérifié) ;
   - libellés à formuler avec TMclass.
4. **Dépôt semi-figuratif du logo** (§ 7.1), une fois le dessin vectoriel figé.
5. **Comptes `@surpiece`** : Instagram, LinkedIn, TikTok, YouTube, Facebook, X et Pinterest. En repli : `@surpiece.fr`.
6. **Extension UE (EUIPO)** dans les 6 mois, seulement si la Belgique ou le Luxembourg sont visés (délai de priorité non revérifié).
7. **Alerte TMview** sur « surpiece » et « sur pièce » pendant la période d'opposition.
8. **Nom commercial** « Sur Pièce » à la création de la société.

### 1.7 Gamme

La gamme se compose de mots simples accolés au nom, pas de sous-marques à déposer :

| Public | Nom | Communiqué |
|---|---|---|
| Particuliers | Sur Pièce | oui |
| Conseillers | Sur Pièce Pro | oui |
| Promoteurs | Sur Pièce Programme | oui |
| Visite de résidence | Sur Pièce Résidence | **non**, tant que le service n'existe pas |
| Options futures | « meublé », « aménagé », en minuscules | **non**, tant qu'elles n'existent pas |

---

## 2. Slogan et variantes [dépend du nom]

**Slogan principal : « Achetez sur plan, jugez sur pièce. »**

Il oppose deux verbes (acheter, juger) et deux états (sur plan, sur pièce). Il ne promet rien de technique et laisse le jugement à l'acquéreur. Il s'écrit avec le point final.

| Usage | Variante |
|---|---|
| Particuliers | « Votre futur logement, pièce par pièce, avant la remise des clés. » |
| Particuliers, moment du doute | « Vous avez signé sur plan ? Jugez sur pièce. » |
| Conseillers | « Vos acquéreurs jugent sur pièce, avant la première pierre. » |
| Promoteurs | « Chaque lot se visite, pas seulement l'appartement témoin. » |
| Format court (bannière, onglet) | « Jugez sur pièce. » ou « Du plan de vente à la visite. » |
| Plan B (Avant-Clés) | « Entrez chez vous avant la remise des clés. » |

À ne pas écrire, ni en slogan ni ailleurs : « comme si vous y étiez », « en vrai », « garanti », « au centimètre », « révolutionnez… ».

---

## 3. Promesse et positionnement

### 3.1 La promesse

> **Sur Pièce transforme le plan de vente de votre logement neuf en plan coté, maquette 3D, visite et photos, en ‹délai›, d'après les cotes du plan. Pour vous projeter et décider en connaissance de cause, avant la remise des clés.**

Avant la mesure en production (T0), la promesse s'écrit sans délai : « … en plan coté, maquette 3D, visite et photos, d'après les cotes du plan. »

Positionnement, pour usage interne :
- **Cibles** : les acquéreurs d'un logement neuf sur plan, et ceux qui le leur vendent.
- **Service** : Sur Pièce transforme le plan de vente en visite fidèle au plan, en ‹délai›.
- **Différence** : il lit le plan du promoteur au lieu de le faire redessiner, et il vérifie chaque visite avant de la livrer (`marche.md` § 5.1).

Sur quoi on ne se bat pas : le photoréalisme, le mobilier et les TMA. Les studios, Habiteo et GetFloorplan y sont devant (`marche.md` § 5.2).

### 3.2 Par cible

| Cible | Ce qu'on promet | Ce qu'on ne promet pas |
|---|---|---|
| **Particulier** qui doute ou a du mal à se projeter | Voir son logement pièce par pièce, avec les dimensions du plan. Un premier plan offert : aujourd'hui, la maquette 3D vue du dessus, le plan 2D coté, 2 photos (le séjour, puis la chambre principale ou une autre pièce), les surfaces et les points à faire confirmer, sans la visite. Ce contenu sera probablement remplacé ou complété par le mode 360° de chaque arrêt (décision du 27/09/2026, confirmée après la mesure de L1-16). La visite se paie au plan et montre les mêmes images (R1, `MESSAGES.md` § 0.7). | La conformité du logement livré. Un avis sur l'achat ou sur la rétractation. Du mobilier. Une galerie complète de photos : elle ne sera annoncée qu'une fois livrée (L13-02). Pendant la bêta fermée, aucun achat (R13). |
| **Conseiller** (CGP, CIF, agent, mandataire, commercialisateur) | Un lien de visite à envoyer, sans compte pour le prospect. Savoir si le lien a été ouvert : le détail (durée, pièces vues) seulement avec le consentement du prospect (`juridique.md` § 3.7). Des réglages à sa main. Un nombre de plans inclus dans l'abonnement. | Le droit de diffuser le plan d'un promoteur : l'autorisation du promoteur relève du conseiller (`juridique.md` § 4.3). La visite meublée, tant qu'elle n'existe pas. |
| **Promoteur** | Tous les lots d'un programme en visite, lot par lot, à ses couleurs et sur son site. | La visite de la résidence, les TMA, le photoréalisme : ils figurent sur la feuille de route, sans date. |
| **Marque blanche** | Le service à la marque du client, sur son domaine. | Une validation de la conformité des lots (`juridique.md` § 2.4). |

### 3.3 Preuves utilisables

Seuls ces faits, vérifiés, servent de preuves. Le vocabulaire proscrit du § 5.2 s'applique aussi à eux.

| Fait vérifié | Formulation publique | Où |
|---|---|---|
| Sur PDF vectoriel, murs, cotes et échelle lus dans le fichier | « Sur le PDF du promoteur, les murs, les cotes et l'échelle sont lus directement dans le fichier. » | Partout |
| Toutes les cotes retrouvées au centimètre sur les plans testés | « Sur les PDF de promoteur de nos essais, toutes les cotes lues correspondent à celles du plan. » | Page « Méthode » et rendez-vous pros, après avis de l'avocat (L2-10). La mention « au centimètre » n'y figure pas : elle est proscrite (§ 5.2, `juridique.md` § 5.2) et le contrôle du site la bloque (L2-15). |
| 7 ouvertures sur 7 et 6 équipements sur 6, contre un relevé manuel | « Sur notre plan de référence, relevé à la main : 7 ouvertures sur 7 et 6 équipements sur 6 retrouvés. » | Page « Méthode » |
| Sur image, une cote connue cale l'échelle, précision de 5 à 10 cm | « Depuis une capture ou une photo du plan, vous indiquez une cote connue pour caler l'échelle. Comptez 5 à 10 cm d'écart possible. » | Partout : c'est aussi une limite |
| Surfaces comparées au tableau du promoteur | « Les surfaces lues sont comparées au tableau du promoteur. Chaque écart vous est signalé. » | Partout |
| Visite de contrôle automatique avant publication | « Avant de vous être livrée, chaque visite est parcourue automatiquement à la recherche de défauts visibles. » | Partout |
| Délai de bout en bout | « ‹délai› », mesuré en production (T0). « 8 à 15 minutes » a été mesuré sur Mac avec carte graphique ; la production rend sans carte graphique (R3) : ce chiffre n'est plus publié | Partout, après T0 (R12) |
| 4 plans réels testés | « Testé sur 4 plans réels : T2 et T3, avec loggia, balcon ou façade en biais. » | Page « Méthode », pros. Une duplex a été assemblée et contrôlée avec une lecture préparée à la main (L13-08) ; la citer comme plan testé est à valider |
| Test d'immersion avant publication : un trou de 4 cm ou plus dans un mur, une menuiserie, une dalle ou un plafond bloque la visite | Proposition, à valider : « Avant livraison, chaque visite est vérifiée comme si on la remplissait d'eau : un trou dans un mur ou une fenêtre bloque sa publication. » | Page « Méthode », après validation |
| Coût IA de 1,10 à 1,85 $ par plan | Aucune formulation publique | Investisseurs et partenaires seulement. Ce chiffre parle d'IA et de marge. |

Aucun témoignage, aucun nombre d'utilisateurs, aucune note ni aucun logo client tant qu'ils n'existent pas réellement, avec l'accord écrit des personnes concernées.

### 3.4 Limites à dire

Ces limites s'affichent près du bouton d'achat, lisibles, pas en petits caractères :
- appartements sur un ou deux niveaux (duplex) : décision 11, confirmée le 27/09/2026 (« oui le duplex on l'a géré c'est bon, c'était avant ça ») ;
- logement vide, finitions supposées ;
- pas de mobilier ni de rendu photoréaliste ;
- illustration non contractuelle : seuls les plans et la notice annexés au contrat de vente font foi.

Règles de communication :
- le duplex peut être nommé comme pris en charge ; ne jamais présenter comme pris en charge un logement sur plus de deux niveaux (triplex) tant qu'aucun plan réel de ce type n'a été validé ;
- ne jamais écrire « tous types de plans » ;
- ne jamais dater une option future ;
- en rendez-vous pro, parler de fonction « en préparation », sans date ;
- ne jamais écrire « bientôt » sur le site ;
- sur les pages pros, ne décrire comme disponible que ce qui existe : avant les lots 9 à 11, elles proposent un entretien ou la bêta fondateurs, pas un essai en ligne (R21, `MESSAGES.md` § 0.8) ;
- ne jamais annoncer plus d'images que l'offre en vigueur n'en livre : ni « environ 11 photos » ni galerie complète au lancement (R1).

---

## 4. Personnalité et ton de voix

### 4.1 Le personnage

**L'ami architecte qui relit le plan avec vous, à la table de la cuisine.** Il connaît le métier et parle simplement. Il montre, il ne vend pas.

| Sur Pièce est | Sur Pièce n'est pas |
|---|---|
| Précis : il cite la pièce, la cote, la source | Pointilleux ni jargonneux |
| Rassurant : il dit ce qu'on sait et ce qu'on suppose | Complaisant (« vous avez fait le bon choix ») |
| Chaleureux : il pense à la personne qui attend ses clés | Familier ni blagueur |
| Honnête : il annonce ses limites avant qu'on les découvre | Défensif |
| Sobre : peu de mots, des mots concrets | Froid ni administratif |
| Neutre dans la décision : il aide à juger | Un conseiller juridique ou financier |

**Neutralité.** Sur Pièce ne conseille jamais d'acheter, d'annuler ni de se rétracter. Pour une question sur le contrat, il renvoie vers le notaire, un juriste ou l'ADIL du département.

### 4.2 Tutoiement ou vouvoiement : le vouvoiement, partout

Recommandation : **vouvoiement partout, réseaux sociaux compris.** Quatre raisons :
1. **L'enjeu** : un achat de 220 000 à 460 000 € en moyenne selon la taille (FPI, T2 2026). Le tutoiement y sonne léger.
2. **Les publics** : CGP, promoteurs et leurs acquéreurs vouvoient.
3. **La marque blanche** : le produit s'affiche sur le site des promoteurs, qui vouvoient. Une seule voix évite deux jeux de textes.
4. **L'existant** : l'interface actuelle vouvoie déjà.

Pronoms :
- « **nous** » pour les engagements (CGV, garanties, méthode) ;
- « **on** » toléré dans les phrases de chantier et les petites phrases d'interface (« on vous prévient »), comme aujourd'hui.

### 4.3 Règles d'écriture

1. Une idée par phrase. Au plus 20 mots par phrase dans l'interface.
2. Le concret d'abord : pièce, cote, surface, lot, étage.
3. Dire d'où vient l'information : « d'après le plan », « lu dans le PDF », « supposé », « indicatif ».
4. Un message d'erreur répond à trois questions : ce qui s'est passé, ce que ça change pour vous (votre plan, décompté ou non), quoi faire maintenant. Jamais de code, de nom de fichier, de coordonnée ni de nom de service. C'est la consigne du projet ; l'`audit-code.md` B9 liste les écarts actuels.
5. L'humour se limite à l'**écran chantier** pendant l'attente (« On coule la dalle, le béton prend son temps… »). Jamais dans une erreur, un paiement ni un texte juridique. Une phrase de chantier reste une métaphore ; elle n'annonce jamais un contrôle qui n'a pas lieu.
6. Pas de point d'exclamation, pas d'emoji, pas de capitales pour crier. Les capitales sont réservées aux surtitres et aux étiquettes.

### 4.4 Exemples

| Au lieu de | Écrire |
|---|---|
| « Erreur 500 : OpenRouter a répondu… » | « La lecture de votre plan n'a pas abouti. Rien n'a été décompté : votre plan reste disponible. » (`MESSAGES.md`, `erreur.lecture`) |
| « Clé API refusée : vérifiez le fichier .env » | « Le service est momentanément indisponible. Votre plan est gardé ; nous reprenons dès que possible. » |
| « Équipement 3 (shower) : corrige le type » | « Un point est à vérifier sur votre plan : l'emplacement de la douche. » |
| « Notre IA de pointe analyse votre plan » | « Nous lisons les murs, les cotes et l'échelle dans le PDF du promoteur. » |
| « Précision au centimètre garantie » | « Les cotes viennent du plan. Les surfaces sont comparées au tableau du promoteur. » |
| « Vivez une expérience immersive révolutionnaire » | « Entrez et passez d'une pièce à l'autre, à hauteur d'yeux. » |
| « Rassurez-vous, vous avez fait le bon choix » | « Voici votre logement d'après le plan. À vous de juger. » |
| « Traitement en cours… » | L'écran chantier : « On pose les huisseries des portes… » |
| « Logement xxx-6e1a90c9 » | « Votre logement » |
| « Génération terminée » | « Votre visite est prête. » |

---

## 5. Vocabulaire

### 5.1 À employer

| Mot | Précision |
|---|---|
| plan de vente | Le document de départ. Pas « plan commercial » ni « fichier ». |
| votre futur logement, votre appartement | Plutôt que « bien », « actif » ou « produit ». |
| pièce, séjour, chambre, cuisine, salle d'eau, salle de bains, WC, entrée, dégagement, loggia, balcon | Les noms du plan, avec ses majuscules et abréviations (T2, T3). |
| cote, surface, hauteur sous plafond | Toujours avec l'unité. |
| lot, programme, résidence | Vocabulaire du promoteur et du conseiller. |
| réservation, contrat de réservation, acte, remise des clés, visite cloisons | Les moments de la VEFA (`marche.md` § 3.1). |
| plan 2D, maquette 3D, visite, photos, fiche | Les cinq livrables, toujours dans cet ordre. |
| d'après le plan, lu dans le PDF, supposé, indicatif, illustration | Ils disent la source et le degré de certitude. |
| lien de visite, prospect, suivi d'ouverture | Côté conseillers. « Prospect », pas « lead ». |
| vérification, contrôle avant livraison | Pour la visite de contrôle, qui reste un terme interne. |

**« Crédit » ou « plan ».** Pour un acquéreur, « crédit » évoque d'abord son **prêt immobilier**. Recommandation, à valider :
- côté particuliers, l'unité affichée est le **plan** : « votre premier plan est offert », « 2 plans restants » ;
- côté pros : « 15 plans inclus par mois » ;
- le mot « crédit » reste celui du grand livre interne et des factures, si besoin.

### 5.2 À bannir

| Mot ou tournure | Pourquoi | Remplacer par |
|---|---|---|
| IA, intelligence artificielle, algorithme, modèle, LLM, prompt, jetons, apprentissage | Jargon, et ce n'est pas le bénéfice | « lu dans le plan », « automatiquement » |
| JSON, GPU, rendu, pipeline, serveur, Chrome, OpenRouter, Claude, bug, erreur 500 | Texte technique, interdit par `CLAUDE.md` | Voir le § 4.4 |
| révolutionnaire, disruptif, magique, bluffant, incroyable, game changer, nouvelle génération | Emphase creuse, contraire au personnage | Le fait précis |
| immersif, expérience, jumeau numérique, métavers | Bruit des concurrents (`nom.md` § 3), promesse floue | « visite », « à hauteur d'yeux » |
| conforme, exact, certifié, garanti, sans erreur, fidèle à 100 %, au centimètre (en promesse) | Risque de pratique commerciale trompeuse et promesse contractuelle (`juridique.md` § 5.2) | « fidèle au plan de vente », « d'après le plan » |
| photoréaliste, meublé, décoré, 4K | Pas encore fournis | Rien, tant que l'option n'existe pas |
| tous types de plans, maisons ; triplex tant qu'aucun plan réel n'est validé ; « un seul niveau » (ancienne limite) | Non couverts, pas encore validés, ou devenu faux | la limite du § 3.4 |
| comme si vous y étiez, vivez, découvrez l'expérience | Cliché, surpromesse | « entrez », « visitez », « faites le tour » |
| solution, plateforme, outil tout-en-un | Jargon SaaS | Le nom du livrable |
| lead, onboarding, dashboard, feature, upload | Anglicismes | prospect, prise en main, tableau de bord, fonction, déposer |
| « vous avez fait le bon choix », « pas d'inquiétude » | Sort de la neutralité | « À vous de juger. » |

**IA et transparence.** Bannir le jargon ne veut pas dire cacher l'IA :
- la page « Méthode », la politique de confidentialité et les CGU disent clairement que la lecture du plan est faite par un modèle d'intelligence artificielle, puis vérifiée par des contrôles automatiques ;
- elles précisent aussi où partent les données (`juridique.md` § 3.3 et § 5.4) ;
- les photos portent un marquage dans leurs métadonnées (IPTC `DigitalSourceType`).

La règle vise les titres, les publicités et l'interface, pas l'information obligatoire.

**Concurrents.** Aucun concurrent n'est nommé dans une comparaison publique sans validation juridique, la publicité comparative étant encadrée.

### 5.3 Nombres et typographie

- **Décimales et unités** : virgule décimale et unité toujours présente, séparée par une espace insécable : « 4,12 m », « 65 m² », « 12,40 m² ». Le ² est un exposant, pas « m2 ».
- **Milliers** : espace fine insécable, « 1 850 € ».
- **Intervalles** : « 5 à 10 cm », « 12 à 15 m² ». Aucun délai n'est écrit en dur : marqueur ‹délai› jusqu'à la mesure T0 (R12).
- **Pourcentages** : « 12 % », avec une espace insécable, comme la barre de progression actuelle.
- **Ponctuation** : guillemets français « » avec espaces insécables, apostrophe typographique ’, espace insécable avant « : ; ? ».
- **Dates** : « 27 septembre 2026 » dans le texte, « 27/09/2026 » dans les tableaux. Heures : « 20 h 14 ».
- **Capitales** : toujours accentuées (É, È, À, Ç).
- **Prix** : TTC pour les particuliers, HT pour les pros, toujours précisé.

---

## 6. Direction artistique « architecte new wave »

### 6.1 Le principe

Les codes du dessin d'architecte deviennent l'ornement : cartouche, cotes et lignes de rappel, poché des murs, hachures, tireté, papier millimétré. On les associe à une grotesque à chasse variable, très large en titre, et à **un seul bleu**.

Rien n'est décoratif qui ne pourrait figurer sur un plan. Le fond est clair et lumineux, comme les visites : la version de base se veut « très éclairée » (`CLAUDE.md`). Le thème sombre existe pour l'interface. Le marketing se fait en clair.

### 6.2 Couleurs

Valeurs exactes des variables CSS de `pipeline/accueil.html` (l. 11-13) et `moteur/visite.css` (l. 1-18) :

| Jeton | Nom de marque | Rôle | Clair | Sombre |
|---|---|---|---|---|
| `--paper` | Papier | Fond de page | `#EDEFEA` | `#101312` |
| `--panel` | Calque | Panneaux, cartes, boutons | `#FAFBF8` | `#181C1A` |
| `--panel-2` | Calque 2 | Survol, champs, puces | `#F2F4F0` | `#1F2421` |
| `--plan-bg` | Fond de plan | Fond du plan 2D et de la mini-carte | `#F7F8F5` | `#141816` |
| `--ink` | Encre | Texte, traits de 1,5 px, sélection inversée | `#161918` | `#E6E9E4` |
| `--ink-2` | Graphite | Texte secondaire, surtitres | `#555B57` | `#A1A8A2` |
| `--line` | Trait fin | Séparateurs internes, décoratifs | `#CDD2CB` | `#2E3431` |
| `--accent` | **Bleu plan** | Action principale, cotes, focus, état en cours, accent du logo | `#2C49B8` | `#93A8FF` |
| `--accent-ink` | Sur bleu | Texte posé sur le Bleu plan | `#FFFFFF` | `#0E1120` |
| `--ok` | Vert réception | Étape terminée | `#2F7A4A` | `#6FCB8F` |
| `--warn` | Brique | Attention, écart, refus | `#A8471F` | `#F08A5D` |
| `--sun` | Ocre soleil | Informations d'ensoleillement | `#8F5A06` | `#E9A83E` |
| `--poche` | Poché | Voiles et murs coupés | `#1A1C1B` | `#DCE0DA` |
| `--hatch` | Hachure | Gaines, hachures à 45° | `#7C837D` | `#6E7670` |
| `--grid` | Millimétré | Calepinage du sol, papier millimétré | `#A9AFA9` | `#48504B` |
| `--dash` | Tireté | Éléments indicatifs (cuisine indicative) | `#6D746F` | `#8B938D` |
| `--shadow` | Ombre | Panneaux flottant au-dessus de la 3D, seulement | `0 1px 2px rgba(22,25,24,.08), 0 8px 24px rgba(22,25,24,.10)` | `0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)` |

Règles d'emploi :
- **Proportions** : environ 80 % de Papier et de Calque, 15 % d'Encre, 5 % de Bleu plan au plus. Un écran n'a qu'**une** action en Bleu plan.
- **Le Bleu plan est réservé** à l'action principale, aux cotes, au focus clavier, à l'état « en cours » et à l'accent du logo. Il ne sert jamais de fond de page.
- **Couleurs de sens** : le Vert réception, la Brique et l'Ocre soleil ne servent qu'à leur signification. Jamais comme décor ni comme couleur de marque.
- **Le thème sombre** n'est pas une inversion mécanique. Le Poché devient clair et le Bleu plan s'éclaircit (`#93A8FF`) pour garder le contraste.

Écarts à corriger plus tard, sans y toucher ici :
- `--ok` n'existe que dans l'accueil ; `--sun`, `--poche`, `--hatch`, `--grid`, `--dash`, `--plan-bg` et `--shadow` n'existent que dans la visite. Il faut **un seul fichier de jetons** partagé.
- Des couleurs sont écrites en dur hors palette : `#e33` pour les repères de calibration (`accueil.html`, fonction `draw`), `#111` derrière les photos, et plusieurs voiles `rgba`. Les rattacher à des jetons : Bleu plan ou Brique pour les repères, `--photo-bg` pour le fond des photos.

### 6.3 Typographie

- **Archivo**, police variable : axes de chasse (`wdth`) de 62 à 125 et de graisse de 100 à 900 chez l'éditeur. Le code utilise la chasse de 90 à 125 et les graisses de 400 à 800.
- **DM Mono**, en graisses 400 et 500, pour tout ce qui se mesure.

| Style | Réglage (d'après le code) | Usage |
|---|---|---|
| Titre 1 | Archivo 800, chasse 112, `clamp(30px, 4.6vw, 54px)`, interligne 1,02, approche −0,015 em, `text-wrap: balance` | Accueil, galerie |
| Titre de cartouche | Archivo 800, chasse 125, 30 px (22 px sous 900 px de large), approche −0,01 em | Identifiant du lot, mot-symbole |
| Titre 2 | Archivo 800, chasse 108 à 120, 20 à 22 px | Blocs, fiche |
| Surtitre | Archivo 700, 12 px, capitales, espacement 0,12 em, Graphite | « PLAN DE VENTE → VISITE 3D » |
| Étiquette de panneau | Archivo 700, 10,5 à 11 px, capitales, espacement 0,1 em, Graphite | Réglages, légende (à passer à 11 px, § 10) |
| Chapô | Archivo 400, 17 px, Graphite, 62 caractères par ligne au plus | Sous le titre 1 |
| Corps | Archivo 400, 15 px / 1,5 (pages) ; 14 px / 1,4 (visite) | Texte courant |
| Bouton | Archivo 600, 15 px ; chasse 90 dans la visite | Actions |
| Chiffres | DM Mono 500, chiffres tabulaires | Cotes, surfaces, pourcentages, étapes, tableaux |
| Cote sur plan | DM Mono 500, Bleu plan | Plan 2D, illustrations |

Règles :
- **La chasse porte la hiérarchie** : plus c'est important, plus c'est large (125 pour le cartouche, 108 à 112 pour les titres, 100 pour le texte, 90 pour les boutons serrés). On ne déforme jamais une lettre par mise à l'échelle.
- **Titres en casse de phrase**. Les capitales sont réservées aux surtitres, aux étiquettes et au mot-symbole.
- **Pas d'italique** : il n'est pas chargé. On met en valeur par la graisse.
- **Tout nombre accompagné d'une unité est en DM Mono** dans les tableaux, cotes et étiquettes. Dans une phrase, Archivo suffit.

### 6.4 Traits, angles, ombres, icônes

- **Traits de 1,5 px en Encre** pour tout contenant et tout contrôle : panneaux, boutons, cartes, champs, barre de progression, cartouche.
- **Trait de 1 px en Trait fin** pour les séparateurs internes : lignes du cartouche, sections, tableaux.
- **Tireté de 2 px en Encre** pour la seule zone de dépôt du plan.
- **Tireté en Tireté** pour tout ce qui est supposé ou indicatif. C'est la convention du plan : le tireté signale ce qui est supposé.
- **Angles droits partout** (`border-radius: 0`, joints en onglet). Seule exception : le cercle, réservé aux points fonctionnels (états des étapes, « Entrer ici », joystick, repères). Pas de pilule ni de coin arrondi.
- **Ombre** : seulement sur les panneaux qui flottent au-dessus de la 3D (`--shadow`). Les pages restent à plat, tenues par leurs traits.
- **Dégradés** : aucun, sauf le voile sombre sous les légendes de photos.
- **Icônes** : au trait de 1,5 px, bouts carrés, sur une grille de 24 px, sans remplissage (sauf un point en Bleu plan). Pas d'icônes de bibliothèque arrondies. Remplacer les caractères de secours comme `⤢` (bouton Recadrer) par une icône SVG dessinée selon ces règles.
- **Flèche** : « → » dans les surtitres, pour dire un passage (« Plan de vente → visite 3D »).

### 6.5 Le cartouche

C'est la signature. Il reprend le cartouche d'un plan d'architecte et existe déjà dans la visite (`.cartouche`, `visite.css` l. 34-40).

Anatomie :
- **cadre** : 1,5 px en Encre, fond Calque, angles droits ;
- **case d'identité**, à gauche : Archivo 800, chasse 125, 30 px, marges de 10 px sur 12 px, séparée par un trait vertical de 1,5 px. Elle porte le numéro du lot, sinon le mot-symbole ;
- **corps**, à droite, sur trois lignes séparées par des traits de 1 px en Trait fin :
  1. le titre, en Archivo 600 (« Appartement 3 pièces ») ;
  2. les mesures, en DM Mono 12 px (« T3 · 65 m² · 3e étage ») ;
  3. la mention, en Archivo 11 px Graphite (« Illustration non contractuelle »).

Emplois :
- en-tête de visite (identité du logement) ;
- logo étendu (§ 7.2) ;
- en-tête des e-mails, des factures et des fiches PDF ;
- cartes pour les réseaux sociaux ;
- titres de diapositives.

Règles :
- jamais d'identifiant technique dans la case d'identité ; à défaut de numéro de lot, « Votre logement » ;
- la troisième ligne peut disparaître sur mobile (comme aujourd'hui), mais la mention non contractuelle reste alors visible ailleurs sur l'écran.

### 6.6 Cotes et lignes de rappel

Le motif graphique principal reprend le dessin des cotes du plan 2D (`ui.js`, bloc « cotes ») :
- **ligne de cote** : trait fin en Bleu plan (1 px à l'écran) ;
- **extrémités** : deux tirets obliques à 45°, plus épais (1,5 px, environ 8 px de long) ;
- **lignes de rappel** : 1 px en Graphite, perpendiculaires à la cote. Elles partent à 3 px de l'objet mesuré et dépassent la ligne de cote de 4 px ;
- **valeur** : DM Mono 500 en Bleu plan, centrée sur la ligne, posée sur un masque de la couleur du fond. Elle est tournée de −90° sur une cote verticale ;
- **format** : en mètres avec virgule (« 4,12 ») dans le marketing ; dans le produit, le format du plan d'origine.

Emplois :
- souligner un mot clé d'un titre par une cote qui en donne la « largeur » ;
- séparer des sections ;
- servir d'axes aux graphiques ;
- relier une capture à sa légende.

Règles :
- **Une cote dit vrai.** Dans une illustration, elle reprend une mesure réelle de l'appartement témoin fictif (§ 8.2), jamais un nombre au hasard. Une marque qui parle de précision ne peut pas afficher une fausse cote.
- Au plus deux cotes par composition.

### 6.7 Papier millimétré

- **Motif** : lignes fines tous les 8 px et lignes principales tous les 40 px, en 1 px, couleur Millimétré, à environ 35 % d'opacité pour les fines et 70 % pour les principales.
- **Emplois** : fond de la zone d'en-tête, des états vides, des cartes pour les réseaux et des illustrations.
- **Jamais sous un paragraphe** de plus de deux lignes, sous un tableau ni sous un champ de saisie.
- **Désactivé** avec `prefers-contrast: more` et à l'impression.
- C'est un décor : il ne porte aucune information (voir § 10).

### 6.8 Poché, hachures, tireté

Les conventions du plan 2D valent pour toute la marque :
- **poché** (aplat Poché) : murs et voiles coupés ;
- **hachures à 45°** : gaines techniques et matières coupées ;
- **tireté** : éléments indicatifs ou supposés ;
- **point en Bleu plan** : « vous êtes ici » ou « entrer ici ».

### 6.9 Mouvement

- Transitions de 150 à 300 ms, sans rebond. Pulsation lente (1,2 s) pour l'étape en cours.
- La barre de progression ne recule jamais, comme aujourd'hui.
- Respect de `prefers-reduced-motion`. La visite le fait (`visite.css` l. 243), mais l'accueil ne le fait pas encore (pulsation, barre, fondu des phrases de chantier).

### 6.10 Gabarits

| Gabarit | Composition |
|---|---|
| Accueil | Structure actuelle : surtitre, titre 1, chapô, zone de dépôt, trois preuves séparées par un filet de 1,5 px (`.facts`), limites visibles, puis la liste des plans. |
| Page de visite partagée | Cartouche du logement en haut à gauche. Signature discrète en bas : « Visite réalisée avec Sur Pièce », avec un lien vers les mentions légales. Mention non contractuelle permanente. |
| E-mail | Mot-symbole en image (PNG issu du SVG, avec texte alternatif), texte en police système (Helvetica Neue, Arial), un seul bouton Bleu plan, cartouche du logement en tableau HTML. |
| Facture | Cartouche en en-tête, tableau en DM Mono, mentions légales en pied. |
| Carte pour les réseaux (1200 × 630, 1080 × 1350) | Fond Papier et millimétré, capture de l'appartement témoin fictif, une cote, un titre en Archivo 800, mot-symbole en bas à gauche, mention non contractuelle. |

---

## 7. Logo

Unité de mesure : **C = corps du texte** (taille de police). Les rapports reprennent l'en-tête de la visite : corps de 30 px, trait de 1,5 px, marges de 10 px sur 12 px.

### 7.1 Mot-symbole en cartouche (logo principal) [dépend du nom]

- **Lettres** : « SUR PIÈCE » en capitales, Archivo 800, chasse 125, approche −0,01 em, espace normale entre les mots. Le dessin final est vectorisé : il ne dépend d'aucune police installée.
- **L'accent du È est un tiret de cote**, et c'est lui qui rend le logo reconnaissable :
  - l'accent grave est redessiné en tiret droit à 45°, extrémités coupées droit ;
  - longueur d'environ 0,3 C, épaisseur d'environ 0,08 C ;
  - en Bleu plan, centré au-dessus du E ;
  - il descend vers la droite, dans le sens de l'accent grave. **Tourné dans l'autre sens, il se lirait É** : c'est l'erreur à ne jamais commettre.
- **Cadre** : rectangle à angles vifs, trait de C/20, marges intérieures de C/3 en hauteur et 0,4 C en largeur.
- **Couleurs** :
  - sur fond clair : lettres et cadre en Encre `#161918`, accent en Bleu plan `#2C49B8` ;
  - sur fond sombre : `#E6E9E4` et `#93A8FF` ;
  - en monochrome : tout en Encre (ou tout en blanc) ;
  - sur un aplat Bleu plan : tout en blanc, jamais de bleu sur bleu.
- **Zone de protection** : 0,5 C autour du cadre.
- **Taille minimale** : C = 20 px à l'écran (le trait fait alors 1 px) et C = 4 mm à l'impression. En dessous, on utilise le symbole (§ 7.3).
- **Légende facultative**, sous le cadre, en DM Mono capitales : « PLAN · MAQUETTE · VISITE ».

### 7.2 Cartouche étendu (en-têtes)

C'est le cartouche du § 6.5, avec le mot-symbole dans la case d'identité (sans son propre cadre) et trois lignes à droite. Il sert aux en-têtes de documents, de factures, d'e-mails et de diapositives.

### 7.3 Symbole « la pièce » (monogramme, favicon, avatar)

Une pièce vue en plan : quatre murs, une porte et son arc d'ouverture. Il ne dépend pas du nom : il fonctionne aussi avec Avant-Clés (la porte, c'est entrer).

Dessin sur une grille de 32 × 32 :
- **murs** : un carré extérieur de 4 à 28 (24 px de côté), avec des murs de 3 px en aplat Encre (le poché) ;
- **baie** : le mur du bas est interrompu de x = 16 à x = 25 (9 px) ;
- **vantail** : trait de 2 px en Encre, de la paumelle (16 ; 25), au nu intérieur du mur, jusqu'à (16 ; 16). La porte est ouverte à 90°, vers l'intérieur de la pièce ;
- **arc de débattement** : quart de cercle de centre (16 ; 25) et de rayon 9, de (16 ; 16) à (25 ; 25), trait de 1,5 px en Bleu plan.

Le sens d'ouverture est juste : vantail côté pièce, arc de la porte ouverte jusqu'au jambage opposé. La règle du projet « pas de porte à l'envers » vaut aussi pour le logo.

**Version 16 px** : même géométrie divisée par deux, murs de 2 px, vantail et arc de 1 px.

**Test avant adoption** : lisibilité à 16 px dans un onglet clair et dans un onglet sombre. Si le test échoue, prendre le monogramme de secours (§ 7.4).

### 7.4 Monogramme de secours [dépend du nom]

« SP » en Archivo 800, chasse 112, dans un carré à trait de C/20, avec l'accent-tiret bleu posé en haut à droite. À n'utiliser que si le symbole « la pièce » échoue au test des 16 px.

### 7.5 Jeu de fichiers du favicon

Le code actuel n'a pas de favicon (`<link rel="icon" href="data:,">`).

| Fichier | Contenu |
|---|---|
| `favicon.svg` | Le symbole, fond transparent, avec `@media (prefers-color-scheme: dark)` interne : murs et vantail en `#E6E9E4`, arc en `#93A8FF` |
| `favicon.ico` | 32 px et 16 px, fond Papier |
| `apple-touch-icon.png` | 180 px, fond Papier, symbole sur 60 % de la largeur, centré |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Manifeste ; pour la version masquable, le symbole tient dans la zone sûre de 80 % |

### 7.6 Interdits

- coins arrondis, ombre, dégradé, contour des lettres ;
- étirement ou compression (la largeur vient de l'axe de chasse, jamais d'une mise à l'échelle) ;
- rotation, accent tourné dans l'autre sens ;
- autres couleurs que celles du § 7.1 ;
- ajout de « 3D », d'un pictogramme de maison ou d'une clé ;
- logo posé directement sur une photo : il faut un aplat Calque ;
- logo dans une phrase : dans le texte, le nom s'écrit en toutes lettres.

---

## 8. Illustration et images

### 8.1 Axonométries au trait

- **Projection** : axonométrie à plan vrai, dite militaire (plan tourné à 30°/60° ou 45°, verticales verticales). Le plan n'y est pas déformé, ce qui dit visuellement « fidèle au plan ». Pas de perspective conique.
- **Coupe à 1 m**, comme un plan : le dessus des murs coupés est en poché, et l'on voit l'intérieur.
- **Traits** : 1,5 px en Encre pour les contours coupés, 1 px pour les arêtes vues, 0,75 px en Graphite pour les arêtes lointaines. Aucune texture, aucune ombre portée. Hachures et tireté selon le § 6.8.
- **Un seul élément en Bleu plan** par illustration : le parcours de visite, une cote ou le lot mis en avant.
- **Pas de mobilier** tant que l'option n'existe pas. Seulement ce que le produit dessine : cuisine indicative en tireté, sanitaires, portes et fenêtres.
- **Personnages** : aucun, ou une silhouette au trait de 1 px pour l'échelle, sans visage.

### 8.2 Captures : l'appartement témoin fictif

Toute capture du produit (site, réseaux, présentations, salons) montre **l'appartement témoin fictif**, et lui seul.

- **Ce qu'on crée** : un plan de vente dessiné par nous, au format d'un plan de promoteur (PDF vectoriel, cotes, tableau des surfaces, cartouche). Il ne porte aucun nom réel : programme « Programme de démonstration », sans adresse, sans architecte ni promoteur. Le cartouche indique « Plan fictif, créé pour la démonstration ».
- **Contenu** : d'abord un T3 d'environ 65 m² sur un seul niveau, avec loggia (65 m², c'est la surface moyenne d'un 3 pièces neuf, FPI T2 2026). Ensuite un T2 d'environ 44 m² avec balcon. Seulement des cas que la chaîne couvre déjà, comme le veut la consigne d'avancer plan par plan.
- **Passage par la vraie chaîne**, visite de contrôle comprise.
- **Captures non retouchées** : recadrage et redimensionnement seulement. On note la date et la version du moteur, et l'on refait les captures quand le rendu change. Ce que montre la publicité est ce que produit le service.
- **Rien de plus que l'offre en vigueur** (R1) : au lancement, les images du témoin sont celles d'une visite livrée, soit la maquette vue du dessus, le plan 2D coté et 2 photos (le séjour, puis la chambre principale), plus des captures de la visite elle-même. Pas de galerie de photos tant qu'elle n'est pas livrée (L13-02). Pas de mode 360° dans les captures tant qu'il n'est pas livré (décision du 27/09/2026). La visite est en mode simple : ni « Rendu photoréaliste de la vue » ni superposition du plan du promoteur à l'écran (R16, L4-11).
- **Rangement** : `references/temoin/`, versionné (R11, L1-03) : plan, relevé et lecture du témoin. Il reste distinct de `plans/`, qui n'est jamais versionné.

### 8.3 Mention non contractuelle

Textes canoniques, repris de `juridique.md` § 5.1, à faire valider par l'avocat :
- **sur toute photo, sur chaque panorama du mode 360° et dans la visite** : « Illustration non contractuelle générée automatiquement à partir du plan de vente. » ;
- **format court**, pour les espaces réduits : « Illustration non contractuelle » ;
- **sur les visuels marketing** : « Appartement témoin fictif · Illustration non contractuelle » ;
- **dans la fiche** : le paragraphe complet du § 5.1 de `juridique.md`, qui finit par « Seuls les plans et la notice descriptive annexés à votre contrat de vente font foi. ».

Aujourd'hui, le produit n'a qu'une variante, dans la galerie (`lire.py`, champ `note`). Il faut l'aligner sur ces textes.

Dessin de la mention :
- DM Mono 500, au moins 11 px à l'écran ; incrustée dans une photo, au moins 1/60 de sa hauteur (18 px sur une photo de 1080 px) ;
- en bas à gauche, en Graphite sur un aplat Calque, avec un contraste d'au moins 4,5:1 ;
- jamais rognée ;
- non désactivable dans l'offre standard.

### 8.4 Interdits

- un plan de promoteur réel, même flouté ou recadré ;
- une photo de programme réel ;
- le logo d'un promoteur sans son accord écrit ;
- un programme client cité comme référence sans accord écrit (par défaut : non) ;
- des images générées qui montrent un rendu que le produit ne fait pas (meublé, photoréaliste, vue réelle) ;
- une fausse capture d'écran ;
- une photo de personne avec une citation inventée. Les personnes montrées sont réelles et ont donné leur accord ;
- un avant/après fait sur un plan réel.

---

## 9. Marque blanche

### 9.1 Ce que le client personnalise

| Élément | Règle |
|---|---|
| **Logo** | SVG (ou PNG au double de la taille affichée), sur fond transparent. Il prend la case d'identité du cartouche des pages d'accueil et de connexion, et l'en-tête des e-mails. Le client nous concède une licence limitée à cet affichage (`juridique.md` § 2.4). |
| **Couleur d'accent** | Une seule couleur, qui remplace le Bleu plan (boutons, cotes, focus, état en cours). Elle passe par le contrôle automatique du § 9.3. |
| **Domaine** | Sous-domaine du client (par exemple `visite.client.fr`) en CNAME vers nous, certificat TLS émis automatiquement. Contraintes d'authentification multi-domaine : voir `auth-paiement.md` § 1.5. |
| **Nom affiché** | Titre des pages et des onglets, nom d'expéditeur des e-mails, textes « Visite de [nom] ». |
| **Favicon** | Celui du client, sinon un favicon neutre, sans notre symbole. |
| **Mentions légales** | Celles du client, qui est l'éditeur de la page (LCEN). Nous sommes l'hébergeur technique. |
| **Bandeau de consentement** | Celui du client, ou le nôtre à ses couleurs, configuré par domaine. |
| **Signature « Visite réalisée avec Sur Pièce »** | Présente par défaut, discrète, retirable contre paiement. Elle ne doit jamais laisser croire que nous validons la conformité des lots. |

### 9.2 Ce qui reste fixe

- **Typographies** : Archivo et DM Mono. Le client ne change pas de police : c'est ce qui garantit la lisibilité et les couvertures de caractères testées.
- **Neutres** : Papier, Calque, Encre, Graphite, Trait fin, et leurs valeurs sombres.
- **Couleurs de sens** : Vert réception, Brique, Ocre soleil.
- **Codes du plan** : poché, hachures, tireté pour l'indicatif, cotes, légende.
- **Structure et ergonomie** : modes Plan 2D, Maquette 3D et Visite, cartouche, fiche, photos.
- **Mention non contractuelle** : non désactivable, et le client s'engage à ne pas la retirer (`juridique.md` § 4.5).
- **Accessibilité** : les seuils du § 10 s'imposent à la couleur du client.
- **Photos non retouchées** : le client ne remplace pas les rendus par d'autres images présentées comme des captures.
- **Pas de prix** sur la page de visite par défaut. Si le client en ajoute un, les mentions d'annonce immobilière sont à sa charge (`juridique.md` § 6).

### 9.3 Contrôle automatique de la couleur d'accent

Conformément à la règle du projet (un défaut trouvé devient un contrôle), l'accent du client est vérifié à l'enregistrement.

**Thème clair** : luminance relative de l'accent au plus 0,15. L'accent fait alors au moins 4,5:1 comme texte sur Papier `#EDEFEA`, le fond clair le plus foncé, et le texte blanc posé dessus aussi (il faudrait au plus 0,18).

**Thème sombre** : on dérive une variante claire, de luminance relative au moins 0,25. Elle fait alors au moins 4,5:1 sur Calque 2 sombre `#1F2421`, le fond sombre le plus clair, et avec le texte `#0E1120` posé dessus.

Si la couleur échoue :
- on propose la teinte la plus proche qui passe, en ne faisant varier que la luminosité (OKLCH) ;
- l'aperçu est montré au client ;
- sa couleur d'origine reste permise dans son logo.

Exemples calculés (couleurs génériques) :

| Couleur | Sur Papier (clair) | Blanc dessus | Sur Calque 2 (sombre) | Décision |
|---|---|---|---|---|
| Orange `#F39200` | 2,03:1 | 2,35:1 | 6,70:1 | Refusée en clair (teinte foncée proposée) ; acceptée en sombre |
| Violet `#6C2A8C` | 7,73:1 | 8,95:1 | 1,76:1 | Acceptée en clair ; variante claire dérivée pour le sombre |
| Rouge `#C8102E` | 5,08:1 | 5,88:1 | 2,68:1 | Acceptée en clair ; variante claire dérivée pour le sombre |

**Proximité avec les couleurs de sens.** Si l'accent est trop proche de la Brique ou du Vert réception (écart de teinte de moins de 20°), les alertes et les états gardent leur libellé et leur forme. De toute façon, aucune information ne repose sur la couleur seule.

---

## 10. Accessibilité

Objectif : **WCAG 2.2 niveau AA**, soit :
- 4,5:1 pour le texte ;
- 3:1 pour le texte de 24 px et plus, ou de 18,66 px et plus en gras ;
- 3:1 pour les composants d'interface et les graphiques porteurs d'information.

L'European Accessibility Act exempte probablement les micro-entreprises de services (non vérifié, `juridique.md` § 1.8). On vise AA quand même.

### 10.1 Contrastes calculés (27/09/2026)

**Thème clair**

| Couleur | Papier `#EDEFEA` | Calque `#FAFBF8` | Calque 2 `#F2F4F0` | Fond de plan `#F7F8F5` | Usage permis |
|---|---|---|---|---|---|
| Encre `#161918` | 15,29 | 17,04 | 15,99 | 16,61 | Tout texte |
| Graphite `#555B57` | 6,00 | 6,69 | 6,28 | 6,52 | Tout texte |
| Bleu plan `#2C49B8` | 6,59 | 7,35 | 6,89 | 7,16 | Texte, liens, cotes, focus |
| Vert réception `#2F7A4A` | **4,53** | 5,05 | 4,74 | 4,92 | Texte d'état ; sur Papier, marge presque nulle |
| Brique `#A8471F` | 5,06 | 5,64 | 5,29 | 5,49 | Texte d'alerte |
| Ocre soleil `#8F5A06` | 4,99 | 5,57 | 5,22 | 5,42 | Texte d'ensoleillement |
| Tireté `#6D746F` | 4,14 | 4,62 | 4,33 | 4,50 | Traits seulement (au moins 3:1), pas de texte |
| Hachure `#7C837D` | 3,36 | 3,74 | 3,51 | 3,65 | Graphismes (au moins 3:1) |
| Millimétré `#A9AFA9` | 1,93 | 2,15 | 2,02 | 2,10 | Décor seulement |
| Trait fin `#CDD2CB` | 1,33 | 1,48 | 1,39 | 1,44 | Décor seulement |
| Poché `#1A1C1B` | 14,79 | 16,49 | 15,48 | 16,07 | Murs |

Paires : texte blanc sur Bleu plan, 7,63:1 ; Calque sur Encre (sélection inversée), 17,04:1.

**Thème sombre**

| Couleur | Papier `#101312` | Calque `#181C1A` | Calque 2 `#1F2421` | Fond de plan `#141816` | Usage permis |
|---|---|---|---|---|---|
| Encre `#E6E9E4` | 15,25 | 14,05 | 12,86 | 14,63 | Tout texte |
| Graphite `#A1A8A2` | 7,69 | 7,08 | 6,48 | 7,37 | Tout texte |
| Bleu plan `#93A8FF` | 8,26 | 7,61 | 6,97 | 7,92 | Texte, liens, cotes, focus |
| Vert réception `#6FCB8F` | 9,44 | 8,70 | 7,97 | 9,06 | Texte d'état |
| Brique `#F08A5D` | 7,56 | 6,97 | 6,38 | 7,25 | Texte d'alerte |
| Ocre soleil `#E9A83E` | 9,02 | 8,31 | 7,61 | 8,65 | Texte d'ensoleillement |
| Tireté `#8B938D` | 5,92 | 5,46 | 4,99 | 5,68 | Traits |
| Hachure `#6E7670` | 3,99 | 3,68 | 3,37 | 3,83 | Graphismes (au moins 3:1) |
| Millimétré `#48504B` | 2,25 | 2,07 | 1,89 | 2,15 | Décor seulement |
| Trait fin `#2E3431` | 1,47 | 1,35 | 1,24 | 1,41 | Décor seulement |
| Poché `#DCE0DA` | 13,98 | 12,88 | 11,80 | 13,41 | Murs |

Paires : texte `#0E1120` sur Bleu plan, 8,29:1 ; Calque sur Encre, 14,05:1.

**Lecture** :
- **Textes** : toutes les couleurs de texte passent AA sur les quatre fonds, dans les deux thèmes. Le cas limite est le Vert réception sur Papier clair (4,53:1). On ne l'emploie pas en texte de moins de 14 px sur Papier ; sur Calque, il fait 5,05:1.
- **Focus clavier** (2 px en Bleu plan, décalé de 2 px) : 6,59:1 sur Papier clair et 8,26:1 sur Papier sombre.
- **Trait fin et Millimétré** sont sous 3:1. Ils ne délimitent **jamais seuls** un champ, un bouton ou un état : tout contrôle garde son trait Encre de 1,5 px. Les puces de pièces (`.chip`), bordées en Trait fin, restent conformes parce que leur texte les identifie et que la sélection se fait par inversion (17,04:1 et 14,05:1).
- **Repères de calibration** en `#e33` : 3,82:1 sur Fond de plan, suffisant pour un graphisme mais hors palette. Les remplacer par le Bleu plan (7,16:1) ou la Brique (5,49:1).
- **Légendes de la grande photo** : blanc sur un voile qui va jusqu'à `rgba(0,0,0,.55)`. Au pire, sur une photo blanche, cela fait du blanc sur `#737373`, soit 4,74:1 : conforme.
- **Légendes des vignettes** (blanc 11 px avec une simple ombre, `visite.css` l. 231) : contraste non garanti sur une photo claire. Il faut un aplat derrière.

### 10.2 Règles

1. **Taille de texte minimale : 11 px.** Sont à relever : `.chip small`, `.rail-h`, `.flag`, la légende mobile et `#railM span`, aujourd'hui à 10,5 px.
2. **Cibles tactiles** d'au moins 40 px sur écran tactile, comme aujourd'hui. Le minimum AA est de 24 × 24 px.
3. **Jamais la couleur seule.** Les étapes se distinguent par la forme (plein, contour, pulsation) et par le texte. Les écarts portent un libellé.
4. **Mouvement réduit** respecté partout, accueil compris.
5. **Équivalent textuel de la 3D** : le plan 2D, la fiche (surfaces par pièce, en tableau) et les photos, avec un texte alternatif égal au nom de la pièce.
6. **Langue** déclarée (`lang="fr"`, déjà présent). Le logo a pour texte alternatif « Sur Pièce ».
7. **Bandeau de consentement** : « Refuser » et « Accepter » ont le même style, la même taille et la même place, parce que refuser doit être aussi simple qu'accepter (CNIL, `juridique.md` § 3.7). Pas de bouton en Bleu plan face à un lien gris.
8. **Contrôle automatique** : un script recalcule ces ratios sur le fichier de jetons et sur l'accent de chaque client, et fait échouer la publication en cas de régression.
9. **Largeur minimale de mise en page : 320 px** (R10 ; WCAG 2.2, critère 1.4.10 « Redistribution »). À 320 px de large en pixels CSS, aucune page ne défile horizontalement et rien n'est coupé : vitrine, écrans de l'application, aperçu, e-mails, bandeau de consentement. Seuls les contenus qui demandent deux dimensions peuvent se déplacer dans leur propre cadre : plan 2D, maquette, visite et tableaux de données. Les gabarits, le cartouche et le mot-symbole sont vérifiés à cette largeur ; les captures à 320 px font partie des contrôles automatiques.

---

## 11. Polices auto-hébergées

### 11.1 Pourquoi

Aujourd'hui, `pipeline/accueil.html` (l. 8-9) et `moteur/modele.html` (l. 9-11) chargent les polices depuis Google Fonts, ce qui pose trois problèmes :
- **RGPD** : l'adresse IP de chaque visiteur part chez Google. Le tribunal régional de Munich l'a jugé illicite sans consentement (LG München I, 20/01/2022). C'est une décision allemande ; la position de la CNIL n'a pas été vérifiée (`audit-code.md` A5).
- **Marque blanche et sécurité** : la politique de sécurité de contenu se réduit à `font-src 'self'`, et le domaine du client ne dépend d'aucun tiers.
- **Robustesse** : une panne de Google ne change plus l'apparence des visites.

### 11.2 Quoi

- **Archivo**, variable, réduite aux axes utilisés : graisse de 400 à 800, chasse de 90 à 125.
- **DM Mono** en 400 et 500.
- **Licence** : les deux polices sont diffusées sous SIL Open Font License 1.1 selon Google Fonts. À confirmer sur le fichier `OFL.txt` au moment de la copie. On garde ce fichier à côté des polices. Si l'`OFL.txt` déclare un « Reserved Font Name », il faut renommer la famille des fichiers réduits.
- **Sous-ensemble latin** en woff2 : il couvre les accents, œ, « », ’, €, ², ·, …, l'espace fine insécable et le signe moins.

### 11.3 Comment

Avec fonttools (`pip install fonttools brotli`) :

```sh
fonttools varLib.instancer Archivo[wdth,wght].ttf wght=400:800 wdth=90:125 -o archivo-reduite.ttf
pyftsubset archivo-reduite.ttf --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212" \
  --output-file=archivo.woff2
# idem pour DMMono-Regular.ttf et DMMono-Medium.ttf
```

```css
@font-face{font-family:"Archivo";src:url("/polices/archivo.woff2") format("woff2");font-weight:400 800;font-stretch:90% 125%;font-style:normal;font-display:swap}
@font-face{font-family:"DM Mono";src:url("/polices/dm-mono-400.woff2") format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"DM Mono";src:url("/polices/dm-mono-500.woff2") format("woff2");font-weight:500;font-display:swap}
```

- **Service** : fichiers versionnés sous `/polices/` sur notre domaine, et sur celui du client en marque blanche, pour rester sur la même origine. Cache long et `immutable`. Préchargement (`<link rel="preload" as="font" crossorigin>`) du seul fichier Archivo, sur l'accueil.
- **Polices de secours** : on garde celles du code (« Helvetica Neue », Arial ; ui-monospace, Menlo, Consolas).
- **`font-variation-settings: "wdth"`** continue de fonctionner. On peut migrer vers `font-stretch` quand on voudra.
- **Rendus serveur** : les photos, la mention incrustée et les PDF (factures, fiches) utilisent les mêmes fichiers, chargés localement, sans accès réseau. L'OFL permet l'incorporation dans un PDF.
- **E-mails** : aucune police web. On utilise la pile système, et le mot-symbole est une image.
- **Contrôle automatique** : tout caractère des textes d'interface doit exister dans le sous-ensemble. Un caractère manquant fait échouer la construction.

---

## 12. Écarts de l'existant avec cette plateforme

Relevés le 27/09/2026. **Rien n'est modifié ici** ; le travail sur les niveaux (fini le 27/09/2026, non commité) a modifié `pipeline/` et `moteur/`.

| Où | Écart | À faire |
|---|---|---|
| `accueil.html` l. 6, `ui.js` l. 367, `modele.html` l. 6 | Titres « Plan en visite 3D », « Visite 3D · », « Visite » | Nom de marque, une fois le dépôt fait |
| `accueil.html` l. 7, `modele.html` l. 7 | Pas de favicon (`data:,`) | Jeu du § 7.5 |
| `accueil.html` l. 8-9, `modele.html` l. 9-11 | Google Fonts à distance | § 11 |
| `accueil.html` l. 85 | « Précision au centimètre. » | « Murs, cotes et échelle lus directement dans le fichier. » (`juridique.md` § 5.2) |
| `accueil.html` et `visite.css` | Jetons répartis entre deux fichiers | Un seul fichier de jetons |
| `accueil.html` (fonction `draw`) | Repères `#e33` hors palette | Bleu plan ou Brique |
| `accueil.html` | Pas de règle `prefers-reduced-motion` | § 6.9 |
| `visite.css` | Textes à 10,5 px | 11 px au moins |
| `visite.css` l. 231 | Légendes des vignettes sans aplat | Aplat derrière |
| `lire.py` (repli du cartouche) | Identifiant technique dans le cartouche | « Votre logement » |
| `lire.py` (`note`) et photos | Mention non contractuelle seulement dans la galerie | § 8.3 |
| `accueil.html` (`#detail`), `serveur.py` | Détail technique montré seulement avec `?debug=1`, et filtre automatique (`masquer`) depuis le 27/09/2026 ; restent des messages qui citent « .env », « API » ou un type anglais (L1-04, L1-05) | Catalogue de messages (§ 4.3 ; `audit-code.md` B9) |
| `ui.js` (réglages de la visite) | « Rendu photoréaliste de la vue » et superposition du plan du promoteur visibles en mode simple, contraires au § 3.4 et au § 8.4 | Masqués en mode simple ; superposition réservée au propriétaire ou à l'accord du promoteur (R16, ticket L4-11) |
| `ui.js`, `photos.mjs` (galerie) | Galerie d'environ 11 photos (12 sur la duplex : une vue d'ensemble par niveau), au-delà de l'offre de lancement | Galerie adaptable à 0, 1, 2 ou N photos, sans emplacement vide (L4-09) ; galerie complète plus tard (L13-02) |

---

## 13. Décisions attendues de l'utilisateur

1. **Le nom** : Sur Pièce est retenu comme nom provisoire (D10), Avant-Clés en plan B. Reste à confirmer après les vérifications du § 1.5, puis achat des domaines et dépôt INPI avant toute annonce (§ 1.6). La vitrine est indexable dès sa mise en ligne, une fois le nom déposé (R20).
2. **Le vouvoiement partout** (§ 4.2).
3. **L'unité affichée aux particuliers** : « plan » plutôt que « crédit » (§ 5.1).
4. **Le symbole « la pièce »** comme favicon, sous réserve du test à 16 px (§ 7.3).
5. **La création de l'appartement témoin fictif** (T3 d'environ 65 m² avec loggia). Son dossier est fixé : `references/temoin/`, versionné (R11, § 8.2).
6. **La validation par l'avocat** des mentions (§ 8.3) et de la formulation des preuves (§ 3.3).
7. **Le mode 360°** : son nom public (« vue à 360° », « visite à 360° », « panoramas »…) et sa place dans l'offre gratuite, après L1-16.
8. **Le test d'immersion** comme preuve publique (§ 3.3). La limite affichée sur les niveaux est décidée : « un ou deux niveaux (duplex) » (§ 3.4, décision 11, 27/09/2026).
