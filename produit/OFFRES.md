# Offres et prix

Version du 27/09/2026, alignée sur les décisions de l'utilisateur du même jour (`PLAN.md` § 2.1) et sur les arbitrages qui en découlent. **Proposition à valider par l'utilisateur.**

> **Tous les prix de ce document sont des hypothèses de lancement.** Ils seront confirmés ou corrigés par les tests du § 9. Aucun n'est publié ni promis à un client avant validation.

**Ce document fait foi** pour les règles commerciales et de crédits : ordre de consommation, report d'un mois des crédits pros, durées (aperçu 6 mois, visite 24 mois), conservation, délais de support. `ARCHITECTURE.md` s'y aligne ; en cas d'écart, seules les décisions de l'utilisateur et les arbitrages du 27/09/2026 priment sur lui.

**Nom.** « Sur Pièce » est un nom provisoire (plan B : « Avant-Clés »).
- Il est écrit partout sous cette seule forme, y compris dans « Sur Pièce Pro » et « Sur Pièce Programme ».
- Il n'est jamais précédé de « de », « du » ou « le ». Un simple rechercher-remplacer suffit donc pour le changer (voir `MARQUE.md` § 1.1).
- Les noms de formules (Solo, Cabinet, Équipe) ne dépendent pas du nom.

**Sources.**
- Recherches : `produit/recherche/` (audit-code, marche, suivi, auth-paiement, hebergement, juridique, nom).
- Autres documents : `produit/MARQUE.md`, `produit/ARCHITECTURE.md`, `CLAUDE.md`.
- Les trois propositions d'offres notées en annexe A.

**Données d'usage.** Aucune donnée d'usage n'existe encore : ni taux de conversion, ni taux d'échec en production, ni consommation réelle des pros. Les chiffres de ce type sont donc des **seuils de décision** ou des **hypothèses** signalées comme telles.

---

## 0. En bref

### 0.1 Tableau de synthèse

| Cible | Offre | Prix (hypothèse) | Contenu | Conditions |
|---|---|---|---|---|
| **Particulier** | Premier plan offert (aperçu) | 0 € | Images rendues par le serveur : vue du dessus 3D découpée, plan 2D coté, 2 photos ; surfaces comparées au tableau du promoteur, points à faire confirmer. **Sans la visite** : ni moteur ni `plan.json` envoyés | 1 par personne et par plan ; à lancer sous 30 jours ; conservé 6 mois |
| | Visite d'un plan | **29 € TTC** | Plan complet : visite calculée dans le navigateur (marche libre, arrêts par pièce), maquette et plan 2D interactifs, les mêmes images que l'aperçu, fiche complète, téléchargements, partage privé, 24 mois en ligne. Aucun nombre de photos promis (galerie complète plus tard, § 7.4) | Paiement unique, sans abonnement |
| | Plan suivant | **15 € TTC** | Un autre lot, ou le plan modificatif envoyé par le promoteur | Dans les 12 mois qui suivent un premier achat |
| | Comparer 3 lots | **59 € TTC** (29 + 15 + 15) | 3 plans complets | Plans valables 12 mois |
| **Conseillers** (Sur Pièce Pro) | Solo | **49 € HT par mois** | 5 plans par mois, 1 utilisateur | Sans engagement. Annuel : 490 € HT |
| | Cabinet | **99 € HT par mois** | 12 plans par mois, 3 utilisateurs, couleurs, dossiers, fiche PDF | Annuel : 990 € HT |
| | Équipe | **199 € HT par mois** | 30 plans par mois, 10 utilisateurs, rôles, statistiques, réglages | Annuel : 1 990 € HT |
| | Essai | 0 € | 14 jours, 3 plans complets, fonctions Cabinet | Sans carte, 1 essai par SIREN |
| **Promoteurs** (Sur Pièce Programme) | Rapport de prise en charge | 0 € | Liste des lots pris en charge et non pris en charge, avant le devis | Aucune lecture payée |
| | Pilote | **600 € HT** | 1 programme de 40 lots au plus, livré en 5 jours ouvrés, intégration au site | Déduit de la commande si elle est signée dans les 3 mois |
| | Au lot | **25, 20 ou 15 € HT** | Tous les lots, intégration au site, portail distributeurs, engagements de service | Palier selon le volume sur 12 mois ; 15 € avec un engagement annuel d'au moins 200 lots |
| **Partenaires** | Codes à offrir | **15 € HT** le code (par 10), **12 € HT** dès 50 codes | 1 plan complet par code, pour l'usage privé de l'acquéreur | Prépayés, valables 12 mois |
| **Marque blanche** | Instance | **1 500 € HT**, puis **490 € HT par mois** | 50 plans par mois inclus, puis 7 € HT le plan. Domaine, logo et couleurs du client | Engagement de 12 mois |

**Pendant la bêta fermée** (lot 6, jalon J0), aucune de ces offres n'est en vente : seule la variante « bêta » existe, réservée aux invités, sans achat (§ 2.8).

### 0.2 Règles qui tiennent l'ensemble

1. **Rien de payant avant une qualification presque gratuite.** Une analyse sans IA, puis une question à environ 0,02 $ : un plan non pris en charge ne coûte rien et ne débite rien.
2. **Un crédit n'est consommé qu'à la publication** (§ 6.4). Rien n'est publié sans une visite de contrôle réussie. Le plan offert est consommé à la publication de l'aperçu (vue du dessus et plan 2D prêts) ; un plan complet, à la publication de la visite ; le déblocage d'un aperçu consomme un crédit complet sans relancer aucune lecture. Dans tous les autres cas, le crédit est rendu automatiquement.
3. **Le verrou de l'aperçu est côté serveur**, pas dans l'interface. La page d'aperçu ne reçoit que des images et des textes filtrés ; le moteur et `plan.json` ne sont servis qu'après déblocage (§ 2.2).
4. **Aucune offre payante n'est à perte**, même dans le pire des cas : chaque plan au plafond dur de 3 $ d'IA, toutes passes et relances confondues, et 20 % d'échecs (§ 8.7).
   - Le premier plan offert est un **budget d'acquisition borné**.
   - Son plafond quotidien suit la marge réellement faite sur les particuliers (§ 8.8).
5. **Rien n'est vendu avant d'exister.**
   - Meublé, lumière réelle, réalisme, 4K et TMA ne seront vendus qu'une fois leurs contrôles automatiques en place (§ 7).
   - Aucune date n'est annoncée, et « bientôt » ne s'écrit nulle part.
   - La galerie complète (une dizaine de photos) n'est jamais promise au lancement : c'est une évolution (§ 7.4).
6. **Périmètre affiché avant tout paiement** : appartements sur un seul niveau, logement vide, finitions supposées, illustration non contractuelle.
7. **Catalogue d'offres modifiable sans déploiement, droits acquis honorés** (décision n° 7, ticket L5-08).
   - Offres, prix, contenus, quotas, durées et conditions vivent dans un catalogue en base, par **versions** : une version publiée n'est jamais modifiée ; changer une offre, c'est publier une nouvelle version. La vitrine et l'application lisent le même catalogue : le prix affiché est le prix payé.
   - **Droits acquis** : chaque achat, chaque lot de crédits et chaque publication gardent la version d'offre en vigueur au moment de l'achat (prix, contenu, durées, conditions) et sont honorés tels quels. Un changement ne vaut que pour les achats suivants. On n'enlève jamais ce qui a été vendu ; une amélioration peut être étendue aux clients existants.
   - **Abonnés** : ils gardent leur prix jusqu'à la fin d'un préavis, prévenus par e-mail (durée du préavis à valider par l'avocat).
   - **Organisations** : leurs valeurs d'offre (quota, places, plafond IA) viennent de la version du catalogue souscrite, jamais d'un code figé dans le logiciel (du type `pro-5`).
   - **Stripe** : un prix Stripe ne se modifie pas ; chaque nouvelle version payante crée un prix Stripe neuf.
8. **Tests de prix par périodes seulement** : le même prix pour tous pendant une période, jamais un prix différent tiré au sort par personne (§ 9.1). Les tests de textes peuvent être tirés côté serveur pour les comptes connectés.
9. **Pas d'achat pendant la bêta fermée** : variante « bêta » du catalogue, dépôt réservé aux invités, aucun message qui propose 29 € avant le lot 8 (§ 2.8).

### 0.3 Pourquoi cette offre

La base est la proposition « revenu récurrent des pros d'abord », la mieux notée (53/70, annexe A). Deux autres propositions lui ont été greffées :
- depuis « maîtrise des coûts et des risques » (51/70) : le coût prudent, le budget du gratuit indexé sur la marge, le rendu partiel de l'aperçu (depuis la décision n° 5, aperçu et visite ont les mêmes images) et le rapport de prise en charge des promoteurs ;
- depuis « acquisition des particuliers d'abord » (45/70) : le plan suivant à 15 €, la facturation du pack en lignes, le partage de l'aperçu et les codes à offrir.

---

## 1. Règles communes

- **Un plan = un logement généré complet** : plan 2D, maquette 3D, visite, fiche, et les images rendues par le serveur (vue du dessus 3D découpée, plan 2D coté, 2 photos au lancement).
  - Version de base : **simple et très éclairée**, avec un seul éclairage (`CLAUDE.md`).
  - Lumière réelle, meublé, réalisme, 4K et TMA sont des options futures (§ 7).
  - Les « moments de lumière » ne sont donc **pas** dans l'offre de base.
- **Unité affichée.** Le client voit des **plans** : « votre premier plan est offert », « 2 plans restants », « 12 plans inclus par mois ». Le mot « crédit » reste interne (grand livre, factures), car un acquéreur l'entend comme son prêt (`MARQUE.md` § 5.1).
- **Prix.** Les particuliers voient des prix TTC (TVA de 20 %), les pros des prix HT, toujours précisés. Les prix sont ronds : pas de « ,99 », pas de prix barré, pas de prix personnalisé par un traitement automatisé (L221-5, L112-1-1).
- **Périmètre.**
  - Pris en charge : un appartement sur un seul niveau, en PDF ou en image.
  - Refusés avant toute dépense : duplex, maison, plan d'étage à plusieurs lots, croquis, perspective, format inconnu. Le message dit « pas encore pris en charge » et propose de laisser son e-mail pour être prévenu. Rien n'est promis.
  - Un PDF de plusieurs lots serait aujourd'hui empilé comme des niveaux par l'analyse : en service, la qualification le refuse (« plusieurs lots », L6-02). Seul l'import promoteur (§ 4.1, L10-02) découpe un PDF multi-lots.
  - Un nouveau format n'entre dans le prix de base qu'après validation plan par plan, sur des plans fournis par l'utilisateur.
- **Sur une image**, une cote connue cale l'échelle, avec une précision de 5 à 10 cm.
  - Si l'analyse sans IA ne trouve pas d'échelle, la cote est demandée **avant** la lecture payante.
  - Une calibration faite après la lecture écarte en effet la lecture déjà payée (`ecarter_lecture`, `pipeline/serveur.py`).
  - Point à vérifier avec l'agent qui travaille sur `pipeline/`.
- **Mentions.**
  - Chaque image (photos, vue du dessus, plan 2D) et chaque visite portent « Illustration non contractuelle générée automatiquement à partir du plan de vente ». La mention n'est pas retirable, y compris en marque blanche.
  - Les métadonnées des images portent le marquage de contenu généré (IPTC `DigitalSourceType`).
  - Aucun texte technique n'est montré.
- **Vocabulaire.**
  - Jamais « conforme », « exact », « certifié », « au centimètre » ni « garanti » dans une promesse. On écrit « cotes reprises du plan de vente » (`juridique.md` § 5.2, `MARQUE.md` § 5.2).
  - Le fait « toutes les cotes retrouvées sur les PDF testés » ne sert qu'en rendez-vous pro, avec son contexte : PDF vectoriels, 4 plans.
- **Plans des promoteurs.**
  - Ils ne sont jamais publiés sans accord.
  - La superposition du plan d'origine reste réservée au titulaire du compte, et n'apparaît jamais sur un lien partagé ni dans une intégration (audit B7), sauf accord prouvé du promoteur.
  - Les démonstrations et les visuels marketing montrent **l'appartement témoin fictif** (`MARQUE.md` § 8.2).
- **Délai.**
  - « 8 à 15 min » est mesuré sur Mac avec GPU. En production, le rendu se fait par défaut et partout en SwiftShader dans un conteneur, sans GPU : environ 11 fois plus lent (`hebergement.md` § 2.1). GPU, Mac ou tâches à la demande sont des accélérations optionnelles après le lancement (L13-01), jamais obligatoires.
  - Le délai affiché sera celui **mesuré en production** au test T0 (§ 9). D'ici là, aucun délai n'est écrit en dur (ni « un quart d'heure », ni « 8 à 15 min ») : les textes portent le marqueur ‹délai›. Aucun délai n'est garanti par génération.
  - Pour faire patienter, la vue du dessus s'affiche sur l'écran d'attente dès qu'elle existe, après la visite de contrôle réussie.
- **Délais de support** (ils font foi pour tous les documents) : particuliers, Solo et Cabinet, réponse sous 2 jours ouvrés par formulaire et e-mail, sans téléphone (§ 2.6, § 3.3) ; Équipe, 1 jour ouvré (§ 3.3) ; promoteurs, heures ouvrées, 1 jour ouvré et 4 h ouvrées pour un incident bloquant (§ 4.7) ; marque blanche, premier niveau chez le client (§ 5.6).
- **File d'attente, par ordre de priorité** :
  1. les générations payantes (particuliers et abonnés) ;
  2. les aperçus offerts et les essais pros ;
  3. les imports des promoteurs, dont le délai se compte en jours.

---

## 2. Particuliers

### 2.1 Parcours

1. **Accueil.**
   - La visite complète de l'appartement témoin fictif est en libre accès.
   - La page annonce « Votre premier plan est offert, sans carte bancaire ».
   - Elle ne cite que des faits vérifiés (`MARQUE.md` § 3.3).
   - Les limites sont écrites près du bouton.
   - Aucun témoignage tant qu'il n'en existe pas de réels et d'autorisés.
2. **Dépôt sans compte.** L'analyse sans IA répond tout de suite par « plan reconnu » ou par un refus motivé.
3. **Compte, demandé au lancement.**
   - Il se crée par lien magique ou avec Google (fournisseur d'identité non tranché, L0-02), avec une raison naturelle : « on vous prévient par e-mail quand c'est prêt ».
   - Le même écran contient :
     - la case CGU ;
     - la **case séparée d'écart consenti** (§ 2.5) ;
     - la question facultative « Où en êtes-vous ? » (je choisis mon lot, réservation signée le…, choix des TMA, visite cloisons, livraison).
4. **Qualification** (environ 0,02 $), puis réservation du crédit offert et génération.
5. **Attente.**
   - L'écran « chantier » existant propose la visite témoin et les prix (sans prix pendant la bêta fermée, § 2.8).
   - Après la visite de contrôle réussie, les images apparaissent une à une dès qu'elles existent : vue du dessus 3D découpée d'abord, puis plan 2D coté, puis les 2 photos.
   - Un **e-mail** prévient quand c'est prêt : l'API Notification ne marche pas onglet fermé (audit A4).
6. **Aperçu, puis déblocage** de la visite.

### 2.2 Premier plan offert (aperçu, « génération simple sans la visite »)

**Comment il est produit.** L'aperçu passe par la même chaîne qu'un plan payant : lecture, murs, complément et visite de contrôle.
- Il coûte donc autant en IA qu'un plan payant (audit A9).
- Au lancement, le serveur rend **les mêmes images** pour un aperçu et pour un plan complet (décision n° 5), après la visite de contrôle réussie et dans cet ordre : vue du dessus 3D découpée, plan 2D coté, 2 photos. Pas de galerie complète au lancement (§ 7.4).
- Seule différence : la page d'aperçu ne reçoit que ces images et des textes filtrés. Le moteur et `plan.json` ne sont servis qu'au déblocage.
- C'est ce qui rend le déblocage instantané, sans nouvelle lecture ni nouveau rendu.

**Publication de l'aperçu** (§ 6.4). Il est publié dès que la vue du dessus et le plan 2D sont prêts, et c'est à ce moment que le plan offert est consommé. Les 2 photos s'ajoutent quand elles sont prêtes. Une photo qui échoue après nouvelles tentatives est omise, sans bloquer : la page s'adapte au nombre d'images présentes, sans emplacement vide ni image cassée, et l'équipe est alertée.

**Ce qui est montré** (page privée du compte, mention non contractuelle incrustée dans chaque image) :
- la **vue du dessus 3D découpée** de tout le logement, rendue en premier ;
- le **plan 2D coté**, en image capturée côté serveur (L4-09) ;
- **2 photos** intérieures : le séjour, puis la chambre principale ou, à défaut, la pièce principale suivante ;
- les **surfaces par pièce**, comparées au tableau du promoteur quand le plan en contient un, avec la typologie et la surface totale ;
- les **points à faire confirmer** auprès du promoteur, avec les drapeaux Plan / À vérifier / Hypothèse. On ne verrouille pas ce qui protège l'acheteur ;
- un **lien d'aperçu** à montrer à ses proches, avec le même contenu, en lecture seule, non indexé, révocable et valable 30 jours.

Surfaces et points à faire confirmer sont servis en texte depuis des champs filtrés côté serveur, jamais depuis `plan.json`.

**Ce qui est verrouillé** (visible, avec un cadenas) :
- le bouton **« Débloquer la visite · 29 € »** de la page d'aperçu (L6-05), qui tient la place de « Lancer la visite 3D ». Il ouvre un court volet :
  - le texte « Votre logement est prêt. La visite s'ouvre dès le paiement, sans nouvelle attente. » ;
  - deux choix : « Ce logement : 29 € » et « Comparer 3 lots : 59 € » ;
  - un lien « Essayer la visite de l'appartement témoin » ;
- pendant la bêta fermée, ce bouton et ce volet n'affichent ni prix ni achat (§ 2.8) ;
- la visite, la maquette 3D et le plan 2D **interactifs** ;
- les téléchargements, le partage de la visite et l'hébergement au-delà de 6 mois.

Aucun emplacement de photo supplémentaire n'est montré : la galerie complète n'existe pas au lancement.

**Pourquoi le verrou est côté serveur.** La maquette interactive ouvre la visite par un double-clic au sol, et le plan 2D par un clic dans une pièce (`moteur/engine.js`, `moteur/ui.js`). De plus, `App.set('mode','walk')` tapé dans la console suffit à l'ouvrir. Un verrou d'interface ne suffirait donc pas : rien de la visite n'est envoyé à la page d'aperçu.
- La page d'aperçu ne charge **ni le moteur (`engine.js`, `ui.js`) ni `plan.json`**.
- **Contrôle automatique** : une page d'aperçu qui charge l'un des deux, ou qui affiche un texte technique, fait échouer la publication.
- `ARCHITECTURE.md` M3.2 suit cette règle (verrou côté serveur, et non verrou d'interface).

**Aperçu interactif.** Une maquette ou une vue du dessus manipulable dans l'aperçu demanderait un fichier distinct, sans les données de la visite. C'est une idée à tester plus tard (L13-03), pas une offre du lancement.

**Conditions et anti-abus** (`auth-paiement.md` § 3.5) :
- e-mail vérifié par lien magique, ou compte Google ;
- adresse normalisée (minuscules, sans « +étiquette », sans points pour Gmail) ;
- domaines jetables refusés ;
- **1 crédit offert** par e-mail normalisé, par compte Google et par compte Apple ;
- **1 crédit offert par plan**, tous comptes confondus, reconnu par deux empreintes : l'empreinte SHA-256 du **fichier** déposé **et** celle de la **page rendue** : l'une ou l'autre déjà connue suffit à refuser un second plan offert ;
- Cloudflare Turnstile à l'inscription ;
- 3 crédits offerts au plus par adresse IP (IPv4 /32, IPv6 /64) et par 24 h. Au-delà, la demande passe en file d'attente, elle n'est pas refusée sèchement ;
- un cookie d'appareil aléatoire, sans empreinte du navigateur (CNIL) ;
- un plafond quotidien côté logiciel, doublé du plafond de la clé OpenRouter « gratuit » (`prod-gratuit`), qui ne sert qu'au plan offert des particuliers (§ 6.7, § 8.8). Une fois atteint, message clair et génération le lendemain ;
- des alertes par domaine d'e-mail et par IP.

**Validité et conservation.**
- Le crédit offert est à lancer sous 30 jours.
- L'aperçu est conservé 6 mois, avec un rappel avant suppression. Pendant ce temps, le déblocage reste instantané.

**En cas d'échec.**
- Visite de contrôle échouée, ou vue du dessus ou plan 2D impossibles après nouvelles tentatives : rien n'est publié, le crédit offert est rendu, avec un message sans jargon.
- Photo en échec après nouvelles tentatives : l'aperçu reste publié sans elle (voir « Publication de l'aperçu »).
- Aucune nouvelle lecture payante n'est relancée automatiquement.
- L'équipe peut rejouer le plan sans IA (`outils/finalise.sh`).

**Testeurs** (avant le lancement, `CLAUDE.md`). Chaque testeur reçoit 1 crédit « testeur », valable 60 jours et non transférable, dans la variante « bêta » (§ 2.8). Proposition : il donne un **plan complet**, pour juger la visite. **À décider par l'utilisateur** (L0-04) : `CLAUDE.md` peut aussi se lire comme le crédit offert sans la visite.

### 2.3 Prix

| Produit | Prix TTC | HT | Facturation |
|---|---|---|---|
| Premier plan, ou déblocage de l'aperçu | 29 € | 24,17 € | Bouton « Payer 29,00 € TTC » |
| Plan suivant (autre lot, plan modificatif), dans les 12 mois qui suivent un premier achat | 15 € | 12,50 € | Une ligne |
| Comparer 3 lots | 59 € | 49,17 € | **En lignes : « 1er plan 29 € + 2 plans suivants à 15 € »** |

- La facturation en lignes garde un remboursement juste en cas de rétractation partielle : 15 € par plan non utilisé. **À valider par l'avocat.**
- Pas d'abonnement.
- Les plans achetés sont valables 12 mois, avec la date affichée et un rappel 30 jours et 7 jours avant l'échéance.
- Au-delà de 24 mois, l'hébergement se prolonge à 9 € TTC par tranche de 12 mois. Cette option n'ouvrira que dans 2 ans.
- Pas de pack plus gros : l'acquéreur achète une ou deux fois.

**Repères** (`marche.md` § 5.3, usage interne, aucun concurrent cité en public) :

| Repère | Prix |
|---|---|
| BoxBrownie, plan 3D couleur | 28 € |
| GetFloorplan | à partir de 20 $, livré en 24 h |
| RoomSketcher, conversion IA | 20 $ par niveau |
| Planner 5D Premium | 59,99 $ par an |
| VEFA Conseil, relecture du contrat | 139 € TTC |

29 € représentent environ 0,01 % du prix moyen d'un 3 pièces neuf (315 314 €, FPI, T2 2026).

### 2.4 Ce que débloque un plan payant

Sur le plan déjà contrôlé, sans nouvelle lecture ni nouveau rendu. Le moteur et `plan.json` sont alors servis, et la visite 3D se calcule dans le navigateur du client (décision n° 5) :
- la **visite** à la première personne, en marche libre et avec des arrêts par pièce, et la **maquette 3D** et le **plan 2D** interactifs. Tout s'ouvre tout de suite ;
- **les mêmes images que l'aperçu** : vue du dessus 3D découpée, plan 2D coté, 2 photos. Aucun nombre de photos n'est promis ; au pire, la visite est livrée sans les photos. La galerie complète viendra plus tard (§ 7.4) ;
- la **fiche complète** : surfaces, équipements, ouvertures, hypothèses, points à faire confirmer ;
- les **téléchargements** (L8-08) :
  - les images en haute définition, avec la mention incrustée et le marquage des métadonnées ;
  - le plan 2D et la fiche en PDF, à imprimer pour la visite cloisons (PDF à construire) ;
- le **partage privé** : des liens révocables, non indexés et sans traceur, pour le conjoint, la famille ou le banquier, sans la superposition du plan du promoteur ;
- l'**hébergement pendant 24 mois**, qui couvre en général la réservation, le chantier et la visite cloisons. Cette durée est à valider par l'avocat (§ 10, risque 10) ; le repli est 12 mois plus une prolongation ;
- le bouton **« Signaler un défaut »** dans la visite.

En mode simple, la visite ne montre ni « Rendu photoréaliste de la vue » (option future, § 7) ni la superposition du plan du promoteur, réservée au titulaire du compte ou à un accord du promoteur (L4-11).

Le même crédit peut aussi lancer directement un plan complet, sans passer par l'aperçu.

**À construire plus tard** : un comparateur côte à côte pour le pack. Au lancement, les 3 visites s'ouvrent séparément.

### 2.5 Parcours légal (`juridique.md` § 1)

- **À l'achat.**
  - Une **case séparée d'écart consenti** (L224-25-14 III) : dimensions reprises du plan ou estimées ; hauteurs, matériaux, couleurs, vues et lumière fictifs ; équipements parfois simplifiés.
  - Elle est aussi demandée au lancement du premier plan offert.
  - Bouton « Payer 29,00 € TTC ».
- **Au lancement d'un plan payant ou au déblocage.**
  - Une case **non cochée par défaut**, qui bloque le bouton : « Je demande que la génération commence immédiatement et je reconnais perdre mon droit de rétractation pour ce plan. »
  - Puis un **e-mail de confirmation sur support durable**, qui contient le texte accepté, l'horodatage, les CGV en PDF et le formulaire type (L221-28 13°, L221-13).
- **« Renoncer au contrat ici »** : actif 14 jours après chaque achat, avec un accusé de réception horodaté. Obligatoire depuis le 19/06/2026.
- **CGV** avec l'encadré D211-3, un médiateur désigné (par exemple CM2C : 48 € pour 3 ans, puis 36 € par dossier) et la politique de remboursement écrite avant l'achat.
- **Preuve** : horodatage, version des CGV, texte affiché, compte et adresse IP, conservés au moins 5 ans.

### 2.6 Garanties et remboursements

- **Plan non pris en charge** : il est refusé avant le paiement, rien n'est débité. S'il est découvert non pris en charge après un achat, le crédit est rendu, et remboursé en argent sur demande.
- **Échec de génération ou publication bloquée** : le crédit est rendu automatiquement sur son lot d'origine, avec l'e-mail « rien n'a été décompté » (E6 de `MESSAGES.md`). Il est remboursé en argent sur simple demande.
- **Défaut visible signalé** (trou, fente, texture noire, objet qui flotte, mur mal placé, porte à l'envers, équipement oublié ou mal orienté, cote mal reprise) :
  - un défaut de notre fait est **toujours corrigé gratuitement**, pour toutes les offres, aperçu offert compris ;
  - correction visée sous 5 jours ouvrés, en rejouant le plan sans IA, sans reprendre de crédit ;
  - à défaut, remboursement ;
  - **chaque défaut confirmé devient un contrôle automatique.**
- **Garantie légale de conformité** : 2 ans pour les fichiers livrés, toute la durée de l'hébergement pour la visite. Elle est présentée avec l'encadré D211-3, jamais comme un avantage propre. L'aperçu offert est couvert lui aussi.
- **Plans non utilisés** : remboursés en entier pendant 14 jours, par « Renoncer au contrat ici ». Au-delà, ils ne sont pas remboursés et restent valables 12 mois.
- **Pas de remboursement « au goût »** après publication, sous réserve de la garantie légale. C'est écrit avant l'achat.
- **Pas de « satisfait ou remboursé » au lancement.** La garantie serait détournable pendant les 10 jours de réflexion de la VEFA : visite vue, puis remboursée. Voir l'annexe A.
- **Support** : formulaire et e-mail, réponse sous 2 jours ouvrés, pas de téléphone (délais de référence, § 1).
- **Libellé bancaire** explicite (« SUR PIÈCE ») et reçu immédiat, pour limiter les litiges : 20 € de frais par litige, plus 20 € de contestation.

### 2.7 Partage, bouche-à-oreille, canal vers les pros

- **Page du destinataire** d'un aperçu ou d'une visite partagée :
  - sans compte ni traceur, avec un compteur agrégé seulement ;
  - l'invitation « Votre premier plan est offert » ;
  - en pied de page discret : « Vous vendez du neuf ? Essai Sur Pièce Pro ». Avant l'ouverture de l'essai en ligne (lot 9), ce lien mène à un entretien ou à la bêta fondateurs (§ 3.6).
- **CGU** :
  - partage privé, dans le cercle de famille (CPI L122-5 1°) ;
  - publication interdite sur un réseau social ou dans une annonce ;
  - licence d'usage privé : un pro ne peut pas utiliser un achat de particulier.
- **Interdits** (loi Hoguet) :
  - orienter un acquéreur vers un conseiller ;
  - revendre des prospects ;
  - contacter un promoteur à partir des plans déposés, ou lui révéler qu'ils circulent.
- **Plus tard**, seulement après mesure de la conversion (§ 9, T10) : parrainage (1 plan offert au parrain quand le filleul achète) et carte cadeau.

### 2.8 Bêta fermée : variante « bêta », sans achat

Pendant la bêta fermée (lot 6, jalon J0, L6-10), rien n'est vendu.
- **Accès** : le dépôt est réservé aux invités, avec un code d'invitation. La vitrine reste en liste d'attente, l'application en `noindex`.
- **Catalogue** : seule la variante « bêta » est publiée. Elle donne à chaque invité 1 crédit `testeur` (60 jours, non transférable, § 2.2) : plan complet ou aperçu, selon la décision de L0-04. Aucune version payante n'est publiée, aucun prix Stripe n'est créé.
- **Textes** : aucun message ne propose 29 €, ni aucun autre prix, avant le lot 8. Le verrou de l'aperçu, l'écran d'attente et les e-mails n'affichent ni prix ni bouton d'achat.
- **Règles inchangées** : visite de contrôle obligatoire, consommation à la publication, crédit rendu en cas d'échec, défauts corrigés gratuitement, anti-abus.
- **Coût** : chaque plan de testeur reste sous le plafond de 3 $ (§ 6.7). Clé OpenRouter et plafond de dépense de la bêta à fixer avec L6-10.
- **Sortie** : l'ouverture à tous (L8-07, jalon J1) publie les versions payantes du catalogue. Les crédits `testeur` restants gardent leurs conditions (droits acquis, § 0.2).

---

## 3. Conseillers : Sur Pièce Pro

Cibles : CGP et CIF qui vendent du neuf aux investisseurs (statut du bailleur privé), agents immobiliers, mandataires et commercialisateurs. Vente en libre-service.

### 3.1 Formules

Prix HT, TVA de 20 % en sus.

| Formule | Mensuel | Annuel (10 mois payés) | Plans par mois | Utilisateurs | Recharge de 5 plans | Prix d'un plan inclus |
|---|---|---|---|---|---|---|
| Solo | 49 € | 490 € | 5 | 1 | 45 € (9 € le plan) | 9,80 € |
| Cabinet | 99 € | 990 € | 12 | 3 | 40 € (8 € le plan) | 8,25 € |
| Équipe | 199 € | 1 990 € | 30 | 10 | 35 € (7 € le plan) | 6,63 € |
| Réseau | sur devis | — | selon contrat | sous-comptes par agence | — | base de prix : l'instance du § 5.2 |

Formules, quotas, places et prix sont des versions du catalogue (§ 0.2, règle 7) : chaque organisation porte la version souscrite, jamais un code figé.

Autres prix :
- **Utilisateur supplémentaire** : 10 € HT par mois. Il n'a pas de coût variable.
- **Veille** : 9 € HT par mois, proposée au moment de la résiliation. Elle garde les visites et les liens en ligne, sans nouveau plan.

**Quotas prudents à la hausse.** Les quotas (5, 12, 30) sont calculés au coût prudent (§ 8). `marche.md` proposait 15 et 40 plans.
- On **relèvera** les quotas si le coût réel mesuré le permet (T8). On ne les baissera jamais.
- Relever est un bon geste ; baisser serait un litige.

### 3.2 Plans inclus, report, recharges

- **Un plan = un logement généré.** Une régénération après un défaut ou un échec n'est pas décomptée.
- **Report d'un mois.** Les plans non utilisés d'un mois restent utilisables le mois suivant, pas au-delà. Ordre de consommation : report, puis mois en cours, puis recharges.
- **Recharges** : par 5 plans, valables 12 mois, utilisables tant que le compte est actif (abonnement ou Veille).
- **Garde-fous** :
  - aucune génération sans plan disponible ;
  - au plus 3 générations simultanées par compte (6 en Équipe) ;
  - au-delà de 3 fois le quota mensuel en recharges, l'achat passe par l'équipe, ce qui bloque un compte piraté.

### 3.3 Fonctions

**Toutes les formules :**
- le plan complet : plan 2D, maquette 3D, visite, vue du dessus 3D découpée, 2 photos, fiche des surfaces comparées au tableau du promoteur (galerie complète plus tard, § 7.4) ;
- des **liens de visite illimités** : non devinables, non indexés, révocables, avec une expiration réglable (90 jours par défaut). Un QR code (à construire) et la visite en plein écran pour le rendez-vous ou la visio ;
- une **page sans compte pour le prospect**, avec le logo, le nom, le téléphone et l'e-mail du conseiller ;
- le **bouton « Je suis intéressé, prévenir mon conseiller »** (§ 3.4) ;
- la mention non contractuelle, non désactivable ;
- **aucun prix affiché par défaut**. Si le conseiller en ajoute un, les mentions d'annonce immobilière et ses honoraires sont à sa charge ;
- **jamais la superposition du plan du promoteur** sur un lien prospect ;
- le crédit rendu en cas d'échec, et l'export des photos.

**Cabinet, en plus :**
- 3 utilisateurs, avec des plans partagés ;
- des dossiers par programme et par client ;
- les couleurs du cabinet (couleur d'accent contrôlée, `MARQUE.md` § 9.3), un texte d'accueil et un lien de prise de rendez-vous ;
- le choix et l'ordre des photos, une fois la galerie complète en service (§ 7.4) ;
- une **fiche PDF du lot** à ses couleurs, à construire ;
- des statistiques détaillées **avec consentement** (§ 3.4) et leur export.

**Équipe, en plus :**
- 10 utilisateurs avec des rôles (propriétaire, administrateur, membre) ;
- une bibliothèque partagée ;
- des réglages de génération par défaut (§ 3.5) ;
- des statistiques par programme ;
- l'intégration de visites sur le site du cabinet, limitée aux domaines déclarés ;
- une facture unique ;
- un support sous 1 jour ouvré (2 jours pour les autres formules) ;
- le meublé inclus quand il existera, sans date (§ 7).

**Réseau** (sur devis) : sous-comptes par agence, SSO, import par lots, facture unique, marque blanche en option (§ 5).

### 3.4 Qualification des prospects, sans traceur illicite

Un lien par prospect est un **lien traçant** (article 82 ; CNIL, FAQ du 22/07/2026 ; `suivi.md` § 7.7, `juridique.md` § 3.7).

- **Par défaut** : un compteur **agrégé par lot**, qui compte les ouvertures et donne la date de la dernière. Aucun suivi individuel.
- **Bouton « Je suis intéressé, prévenir mon conseiller »** : c'est la **seule notification nominative**, et c'est le prospect qui la déclenche. C'est aussi le meilleur signal de qualification.
- **Liens individuels** (un par prospect) : ils sont permis.
  - Le statut « ouvert » par prospect n'est affiché qu'après validation par l'avocat, avec une ligne d'information dans le message du conseiller : « Ce lien vous est personnel. »
  - La durée et les pièces vues ne sont suivies qu'après acceptation d'un **bandeau de consentement** sur la page de visite (Cabinet et Équipe).
- **Aucun pixel dans les e-mails.** Le journal est conservé 6 mois, puis agrégé.
- **À ne pas vendre** : « ouvert à 20 h 14, 6 minutes, 3 pièces vues », tant qu'un juriste ne l'a pas validé.

### 3.5 Réglages personnalisés

Ce sont **uniquement des réglages prédéfinis et testés**, jamais une consigne libre envoyée au modèle.
- Les conditions d'OpenRouter interdisent de revendre l'accès au modèle (clause 7.4).
- Une consigne libre ferait aussi perdre la maîtrise du coût.

| Réglage | Formule |
|---|---|
| Logo, coordonnées, expiration par défaut des liens | Toutes |
| Couleurs, texte d'accueil, lien de rendez-vous ; choix et ordre des photos (avec la galerie complète, § 7.4) | Cabinet, Équipe |
| Hauteur sous plafond par défaut quand le plan ne la donne pas (affichée « Hypothèse » dans la fiche), vue d'accueil ; photos à produire (avec la galerie complète) | Équipe |
| **Réglage de lecture sur mesure** (consignes ajoutées, effort) | Sur devis : 490 € HT de mise en place. Il est vérifié avec `pipeline/evaluer.py` sur les plans de référence avant activation. S'il augmente le coût par plan, un supplément égal à 3 fois le surcoût mesuré s'ajoute |

### 3.6 Essai

- 14 jours, **3 plans complets**, avec les fonctions Cabinet. **Sans carte bancaire.**
- **1 essai par SIREN**, vérifié dans l'Annuaire des entreprises. C'est ce qui écarte les faux comptes pros.
- Les liens créés pendant l'essai restent actifs 30 jours après sa fin, puis sont réactivés dès l'abonnement.
- Démonstration en visio de 30 min sur demande. La génération d'un de leurs lots démarre au début de l'appel, avec leurs droits ; on montre l'appartement témoin pendant l'attente.
- Les plans d'essai passent par la clé OpenRouter « payant » (`prod-payant`), dans le budget IA de l'organisation, jamais par la clé « gratuit » (§ 6.7).
- Coût maximal pour nous : 8,10 € (§ 8.9).
- **Pas d'essai en ligne avant qu'il existe** : avant les lots 9 à 11, les pages pros ne proposent qu'un entretien ou la bêta fondateurs (§ 3.10, L2-18).

### 3.7 Engagement, paiement, facturation

- **Mensuel sans engagement.** Résiliation en ligne à tout moment, effective en fin de période, sans remboursement du mois entamé. Après résiliation, les liens restent actifs 90 jours (ou tant que la Veille est payée), avec un export possible.
- **Annuel** : payé d'avance, non remboursable sauf manquement de notre part.
- **Paiement** : Stripe Checkout en abonnement, Billing et portail client. Carte ou prélèvement SEPA (0,35 €). SIREN et numéro de TVA collectés.
- **Facturation électronique** : la réception passe déjà par une plateforme agréée ; l'émission devient obligatoire au plus tard le 01/09/2027.
- **Souscription en ligne de préférence.** Un abonnement signé en rendez-vous chez un pro de 5 salariés au plus peut ouvrir 14 jours de rétractation (L221-3) : on l'applique d'office.

### 3.8 Droits et obligations

- **Autorisation du promoteur.** Avant le premier lien d'un programme, une case obligatoire : « Je dispose de l'autorisation du promoteur, ou d'une convention de commercialisation, pour produire et diffuser ces illustrations. » (`juridique.md` § 4.3)
  - Le dépôt du document est facultatif.
  - Garantie et indemnisation par le conseiller, retrait sur notification (DSA art. 16).
- **DPA en annexe** : le conseiller est responsable de traitement, nous sommes sous-traitant.
- **Obligations du conseiller** : il ne retire pas la mention et ne présente pas les rendus comme des photos réelles.

### 3.9 Codes à offrir à ses clients

Un conseiller peut acheter des **codes à offrir** (§ 5.1) pour ses clients acquéreurs.
- Le client dépose lui-même son plan et en garde un **usage privé**. Le conseiller ne diffuse rien.
- La question de l'autorisation du promoteur ne se pose alors a priori pas. **À confirmer par l'avocat.**
- Nous y gagnons un particulier.

### 3.10 Bêta « fondateurs »

- Les 30 premiers cabinets bénéficient de **30 % de remise pendant 6 mois**, en échange d'un entretien mensuel.
- La remise est réelle, datée et limitée.
- Même remisées, toutes les formules restent en marge positive (§ 8.4).

### 3.11 Repères

| Repère | Prix |
|---|---|
| RoomSketcher Team | 35 à 70 $ par mois |
| Planner 5D Pro | 33 à 50 $ par mois |
| magicplan | 40 $ par projet supplémentaire |
| GetFloorplan | 20 $ le plan, en 24 h |

- Le plan Solo (9,80 € HT) coûte environ la moitié d'un plan GetFloorplan. Il inclut la visite et vise un délai de moins d'une heure, au lieu de 24 h (délai réel à mesurer en production, T0).
- L'abonnement Solo annuel représente environ 0,22 % du prix d'un 2 pièces neuf moyen (223 606 €).

---

## 4. Promoteurs : Sur Pièce Programme

**Argument : tous les lots, pas quelques lots types.**
- Habiteo annonce 26 000 lots pour 1 500 programmes, soit environ 17 lots modélisés par programme (déduction de `marche.md`).
- Nous ne nous battons ni sur le photoréalisme ni sur le configurateur de TMA.

Conditions de vente : devis, puis facture payée par virement à 30 jours. Prix HT.

### 4.1 Rapport de prise en charge, offert

- Le promoteur dépose tous les plans de vente du programme. Un PDF qui contient plusieurs lots est découpé par l'import promoteur (L10-02), le seul endroit où ce découpage existe (§ 1).
- Chaque lot passe l'analyse sans IA et la qualification (environ 0,02 $ par lot).
- Le promoteur reçoit un rapport :
  - les lots pris en charge ;
  - les lots non pris en charge (duplex, maison, plan illisible…), qui ne sont pas facturés.
- Le devis ne porte que sur les lots pris en charge, à **prix ferme**.

### 4.2 Pilote payant

- **600 € HT** pour 1 programme de 40 lots au plus (15 € le lot), payé à la commande.
- Il démarre après la signature de la licence sur les plans.
- Livraison visée : 5 jours ouvrés après réception de plans exploitables, de préférence en PDF vectoriel (murs, cotes et échelle lus dans le fichier).
- Contrôle par le promoteur sous 10 jours, puis 2 cycles de correction inclus. Ces cycles ne concernent que ses **demandes de modification** ; un défaut de notre fait est toujours corrigé gratuitement, hors cycles (§ 4.6).
- Intégration à son site et 24 mois d'hébergement.
- **Critères écrits d'avance** : surfaces identiques au tableau, zéro défaut visible, délai tenu, avis de l'équipe commerciale.
- **Montant déduit** de la commande suivante si elle est signée dans les 3 mois.

### 4.3 Prix au lot

| Volume de lots livrés sur 12 mois glissants | Prix par lot |
|---|---|
| 1 à 49 | 25 € HT |
| 50 à 199 | 20 € HT |
| 200 et plus, avec engagement annuel et facture mensuelle | 15 € HT |

- Commande minimale : 10 lots, ou 250 € HT.
- Forfait programme : nombre de lots pris en charge × prix de la tranche, ferme après le rapport de prise en charge.
- Toute cette grille reste dans les 15 à 25 € HT par lot de `marche.md`.

### 4.4 Contenu

**Par lot :**
- plan 2D, maquette 3D, visite, vue du dessus 3D découpée, 2 photos et fiche des surfaces comparées à la grille du promoteur. Aucun nombre de photos n'est promis tant que la galerie complète n'est pas en service (§ 7.4) ;
- images HD pour les plaquettes ;
- la superposition de son propre plan, permise ici puisqu'il en a les droits.

**Par programme :**
- une page programme avec la liste des lots, filtrable ;
- une **intégration iframe** limitée aux domaines déclarés ;
- un **lien acquéreur par lot**, à envoyer au réservataire. Il ouvre sa visite et ses partages privés, avec « offert par » suivi du nom du promoteur ;
- des liens pour sa force de vente ;
- des statistiques **agrégées** (ouvertures par lot, lots les plus vus) ;
- **aucun traceur dans l'iframe**, mais des événements `postMessage` (`visite:ouverte`, `visite:piece`) qu'il mesure sous sa propre CMP ;
- son logo et ses couleurs ;
- l'export des maquettes, photos et visites (réversibilité).

### 4.5 Portail distributeurs

- Le promoteur autorise ses commercialisateurs et ses CGP.
- Ceux-ci envoient les visites de ses lots depuis leur compte Sur Pièce Pro, **sans consommer leurs propres plans**.
- C'est ce qui règle à la source la question du droit d'auteur pour les conseillers (`juridique.md` § 4.3), et fait connaître l'offre Pro.
- À construire après le premier pilote.

### 4.6 Hébergement et nouvelles versions

- **Hébergement** : inclus pendant 24 mois après la livraison, ce qui couvre les 21,4 mois d'écoulement moyen (FPI). Ensuite, 3 € HT par lot et par an.
- **Nouvelle version d'un lot** (plan modificatif de l'architecte ou TMA d'un acquéreur) : 50 % du prix du lot, 10 € HT au minimum. Elle demande une nouvelle lecture.
- **Correction d'un défaut de notre fait** : gratuite, sans limite.

### 4.7 Engagements de service (annexe au contrat, `juridique.md` § 2.3)

| Point | Engagement |
|---|---|
| Disponibilité des visites publiées | 99,5 % par mois, hors maintenance annoncée 48 h à l'avance |
| Livraison | 5 jours ouvrés pour 50 lots après réception de plans exploitables. **Aucun délai par génération** : OpenRouter ne s'engage sur aucun niveau de service |
| Qualité | Contrôle par le promoteur sous 10 jours, puis 2 cycles de correction pour ses demandes de modification. Un défaut de notre fait est toujours corrigé gratuitement, hors cycles |
| Support | Heures ouvrées, réponse sous 1 jour ouvré ; incident bloquant : 4 h ouvrées |
| Pénalités | Avoir de 5 % par tranche de 0,5 % sous l'objectif, plafonné à 20 % du mois. C'est le seul recours pour l'indisponibilité |
| Exclusions | Pannes des fournisseurs d'IA pour la génération (pas pour les visites déjà publiées), force majeure, plans non exploitables |
| Données | En UE, sauf l'appel au modèle, fait sans conservation (ZDR) |

### 4.8 Options entreprise (sur devis)

- **SSO** : broker branché à la demande (Zitadel, Keycloak, ou WorkOS à 125 $ par connexion et par mois), refacturé.
- **Routage des appels IA dans l'UE** : 2,5 points de frais OpenRouter en plus.
- **Facture électronique** : entrée anticipée. Les grands promoteurs émettent et reçoivent déjà par plateforme agréée.
- **Visite de la résidence** (immeuble, étages, vues, parties communes) : plus tard, avec un promoteur pilote, sans date ni promesse.

### 4.9 Maîtrise des coûts à l'import

- Un budget IA est réservé avant l'import : nombre de lots × 3 $. Les lots commandés entrent au grand livre comme un lot de crédits `programme` (§ 6.2).
- Les imports passent en file de basse priorité, avec 4 lectures simultanées au plus par compte.
- **Arrêt et alerte** si le coût moyen dépasse 2,50 $ par lot après 5 lots.
- Un fichier identique déjà lu n'est pas relu.

### 4.10 Contrat

- **Licence** consentie par le promoteur sur ses plans, limitée à la fabrication, à l'hébergement et à la diffusion pour son compte, avec **garantie de ses droits**.
- **Autorisation écrite de diffusion étendue à ses distributeurs**, s'il utilise le portail.
- **Jamais de citation comme référence commerciale** sans son accord écrit.
- **DPA** et réversibilité.
- **Loi Hoguet** : pas de formulaire qui orienterait des acquéreurs vers des conseillers contre rémunération.

### 4.11 Petits promoteurs et repères

- **Petits promoteurs.** Un promoteur qui n'a besoin ni de SLA ni de portail peut prendre la formule **Équipe** (199 € HT par mois pour 30 lots). C'est acceptable, puisque c'est aussi du récurrent.
- **Repères de prix :**

| Repère | Prix |
|---|---|
| GetFloorplan | 20 $ par plan, en 24 h |
| BoxBrownie, plan 3D | 28 € |
| RoomSketcher, plan commandé | 18 à 38 $ par niveau |
| Studio classique | environ 130 $ par plan (chiffre avancé par GetFloorplan, non vérifié) |
| Habiteo | sur devis |

---

## 5. Marque blanche et partenaires

### 5.1 Codes à offrir (co-marqués, sans domaine à développer)

**Pour qui :**
- services d'accompagnement de l'acquéreur VEFA ;
- courtiers ;
- conseillers qui offrent la visite à leurs clients ;
- promoteurs qui l'offrent à leurs réservataires.

**Prix :**
- 15 € HT le code, par lots de 10 (150 € HT) ;
- 12 € HT dès 50 codes (600 € HT), par facture et virement.

**Conditions :**
- 1 code = 1 plan complet, visite comprise ;
- valable 12 mois, non revendable ;
- pour l'usage privé du bénéficiaire.

**Pour le particulier**, c'est gratuit :
- une page d'accueil co-marquée, au logo du partenaire ;
- pas de case de renonciation, puisqu'il n'y a pas de paiement ;
- les CGU et la garantie de conformité s'appliquent.

**Développement** : un lot `code` au grand livre et une page de saisie. C'est la première étape avant toute instance.

### 5.2 Instance en marque blanche

**Pour qui :** réseaux de mandataires, commercialisateurs, groupements de CGP, groupes de promotion.

**Mise en place : 1 500 € HT.** Elle comprend :
- le domaine du client (`visite.client.fr`) et son certificat TLS ;
- le logo, la couleur d'accent contrôlée et le nom affiché (`MARQUE.md` § 9) ;
- l'expéditeur des e-mails (SPF, DKIM, DMARC) ;
- sa bannière de consentement ;
- le DPA et la liste des domaines autorisés ;
- un essai sur 3 de ses plans.

**Abonnement : 490 € HT par mois**, avec un engagement de 12 mois :
- 50 plans par mois inclus, puis 7 € HT le plan en recharges prépayées ;
- utilisateurs illimités, puisque le coût est au plan.

**Options :**
- retrait de la mention « Visite réalisée avec Sur Pièce » : 150 € HT par mois ;
- réglage de lecture sur mesure : 490 € HT (§ 3.5) ;
- SSO : sur devis.

**Non négociable :**
- la mention « illustration non contractuelle » reste ;
- le moteur reste à nous ;
- pas d'accès brut au modèle.

### 5.3 On ne facture que le client

- Au lancement, nous n'encaissons rien auprès de particuliers sous la marque d'un tiers. Cela évite Stripe Connect, un domaine Checkout à 10 $ par mois et des obligations de consommation sous deux marques.
- Le client utilise l'instance pour ses prospects, ou **offre** la visite.
- S'il la revend à des particuliers, il est le vendeur : CGV, médiateur, rétractation. Ce montage est à revoir avec l'avocat avant d'ouvrir une revente.

### 5.4 Contrat

- **Rôles** : le client est éditeur de la page (il fournit les mentions légales) et responsable de traitement ; nous sommes hébergeur technique et sous-traitant.
- **Licences** : licence d'usage non exclusive et non cessible ; licence de sa marque pour l'affichage ; garantie de ses droits sur les plans, les images et les textes.
- **Responsabilité** plafonnée aux sommes payées sur 12 mois, sans dommages indirects.
- **Sortie** : export, redirection ou coupure des liens, puis suppression.

### 5.5 Technique et coûts directs

- Authentification non tranchée (L0-02) : une auth maison gère un nombre illimité de domaines, Auth0 les réserve à son offre Enterprise, Supabase Auth en permet un par projet (`PLAN.md` § 2.3).
- Certificats émis à la demande par Caddy, ou 4 € par pipeline Edge Services.
- Un site Umami par client, s'il veut ses statistiques.
- Coûts directs : environ 15 à 30 € par mois et par client, hors plans.

### 5.6 Quand

- **Les codes d'abord**, dès le premier partenaire.
- **La première instance** seulement après 3 conseillers payants, un pilote promoteur réussi et une lettre d'intention signée.
- Une seule instance à la fois au départ. Le support de premier niveau reste chez le client.

---

## 6. Grand livre de crédits

Il est tenu dans notre base Postgres, **en ajout seul**. Les « billing credits » de Stripe ne conviennent pas (`auth-paiement.md` § 2.3 et § 3 ; schéma dans `ARCHITECTURE.md` § 4.2).

Ce chapitre fait foi pour les sources, l'ordre de consommation, les délais et les durées : `ARCHITECTURE.md` § 4.2 et § 4.3 s'y alignent (valeurs de `source`, délai d'une réservation orpheline).

### 6.1 Principes

- **Pas de modification.** On ne modifie jamais un mouvement ; une correction passe par un mouvement inverse. Le solde est la somme des mouvements.
- **Lots.** Chaque entrée de crédits forme un lot : source, type (aperçu ou complet), quantité, reste, expiration, priorité, **prix unitaire payé**, référence Stripe ou facture, et **version d'offre du catalogue** (droits acquis, § 0.2 règle 7).
- **Porteur.** Les crédits appartiennent à l'organisation : organisation personnelle pour un particulier, cabinet ou promoteur pour un pro. Chaque mouvement enregistre qui l'a déclenché.
- **Idempotence.** Chaque mouvement porte une clé unique (événement Stripe, travail, attribution). Un webhook reçu deux fois ne crédite qu'une fois.

### 6.2 Lots, validité, report

| Source (valeur de `source`) | Origine | Type | Quantité | Validité | Report |
|---|---|---|---|---|---|
| `offert_inscription` | Premier plan offert d'un particulier (§ 2.2) | aperçu | 1 par personne et par plan | 30 jours pour lancer | non |
| `testeur` | Invité de la bêta fermée (§ 2.8), attribué par l'équipe avec un motif | complet ou aperçu selon L0-04 (proposition : complet) | 1 | 60 jours | non, non transférable |
| `achat` | Achat d'un particulier (§ 2.3) | complet | 1, 3 ou 1 plan suivant | 12 mois (rappels à 30 et 7 jours) | non |
| `abonnement` | Quota d'un mois M d'une formule pro (§ 3.1) | complet | quota de la version souscrite | fin du mois M+1 | **un mois**, porté par la date d'expiration |
| `recharge` | Recharge pro de 5 plans (§ 3.2) | complet | 5 | 12 mois, tant que le compte est actif | non |
| `essai` | Essai pro (§ 3.6) | complet | 3 | 14 jours | non |
| `code` | Code à offrir utilisé par son bénéficiaire (§ 5.1) | complet | 1 | 12 mois après l'achat du code | non |
| `programme` | Commande d'un promoteur (§ 4.2, § 4.3) | complet | lots pris en charge commandés | durée fixée au contrat (L10-01) | non |
| `geste_commercial` | Geste de l'équipe, avec un motif obligatoire | complet | n | 12 mois | non |

Quantités, validités et contenus viennent de la version d'offre du catalogue attachée au lot ; les valeurs ci-dessus sont celles du lancement.

**Alignement des autres documents** (fait le 27/09/2026) : `ARCHITECTURE.md` § 4.2 a `recharge`, `essai`, `code` et `programme` dans la contrainte de `source` ; `ARCHITECTURE.md` § 4.2 et `SUIVI.md` § 3.2 (`source_lot`) écrivent `geste_commercial`.

### 6.3 Ordre de consommation

- Un lancement consomme un crédit **complet** s'il en existe un ; sinon, un crédit **aperçu**. Le déblocage d'un aperçu consomme toujours un crédit complet.
- Parmi les crédits du type retenu, on prend **celui qui expire le plus tôt**. À égalité d'expiration, l'ordre est : `testeur`, `essai`, `abonnement`, `recharge`, `code`, `geste_commercial`, `achat`.
  - Le crédit `testeur` passe en premier : il est gratuit, personnel et n'existe que pour la bêta.
  - `achat` passe en dernier : un plan payé et non utilisé reste remboursable pendant 14 jours (§ 6.5).
  - Pour un pro, l'expiration donne déjà l'ordre du § 3.2 : report, puis mois en cours, puis recharges.
- Les crédits `programme` ne servent qu'aux lots de leur programme, importés par L10-02 ; ils n'entrent jamais dans un lancement ordinaire (proposition).

### 6.4 Cycle d'une génération

| Événement | Mouvement | Pour le client |
|---|---|---|
| Plan refusé à l'analyse ou à la qualification | aucun | Message clair, rien de débité |
| Lancement (qualification réussie, **cote validée** si une calibration était nécessaire, case de renonciation cochée si le plan est payant) : un plan abandonné à l'étape de la cote ne bloque aucun crédit | **réservation** −1, dans une transaction avec verrou sur le compte | La génération démarre |
| Aperçu (crédit aperçu) : visite de contrôle réussie, puis vue du dessus et plan 2D marqués, publication de l'aperçu écrite | **consommation** (après la ligne de publication, jamais avant) | L'aperçu s'affiche ; e-mail « votre aperçu est prêt » |
| Plan complet (crédit complet) : visite de contrôle réussie, publication de la visite écrite | **consommation** (après la ligne de publication, jamais avant) | La visite s'ouvre ; e-mail « votre visite est prête ». Les images s'ajoutent quand elles sont prêtes |
| Photo en échec après nouvelles tentatives | aucun | Photo omise, sans emplacement vide ; alerte à l'équipe. Au pire, une visite complète est livrée sans photos |
| Lecture impossible, contrôle bloquant après réparations, budget de 3 $ atteint, refus 402 ou 403 d'OpenRouter ; pour un aperçu, vue du dessus ou plan 2D impossibles après nouvelles tentatives | **libération** +1 sur le lot d'origine | Rien n'est publié ; e-mail « rien n'a été décompté » (E6 de `MESSAGES.md`) |
| Réservation orpheline : aucun battement de cœur du travail depuis 2 h, ou travail non démarré sous 24 h (file saturée) | **libération** +1, avec alerte | Idem. Si le plan est publié plus tard, il est livré sans reprendre de crédit |
| Déblocage d'un aperçu | **consommation directe** −1 complet, après la case de renonciation | Le moteur et `plan.json` sont servis : la visite s'ouvre tout de suite, sans nouvelle lecture ni nouveau rendu |
| Correction d'un défaut signalé | aucun | Rejeu sans IA, toujours gratuit |
| Webhook Stripe reçu deux fois | aucun (idempotence) | — |

**Battement de cœur et délais de libération.**
- Le travail signale régulièrement qu'il est vivant, à chaque étape et pendant les étapes longues (lecture, contrôle, rendu). Une réservation n'est libérée que si ce signal manque depuis **2 h** : un rendu lent en SwiftShader n'est donc jamais pris pour un travail mort.
- Un travail jamais démarré est libéré au bout de **24 h** de file.
- Ces deux délais (valeurs proposées) remplacent le délai de 1 h d'`ARCHITECTURE.md` § 4.3. Ce sont des réglages, revus sur le 99e centile mesuré en production (T0).

### 6.5 Remboursements en argent

- **Plans non utilisés, sous 14 jours** : remboursement intégral par « Renoncer au contrat ici ». Pour un pack entamé, on rembourse **les lignes non utilisées** (15 € par plan). À valider par l'avocat.
- **Après un échec** : le crédit est déjà rendu. Remboursement en argent sur simple demande ; seuls les frais Stripe sont perdus.
- **Défaut non corrigé sous 5 jours ouvrés** : remboursement.
- **Ordre des opérations** : on retire d'abord les crédits non utilisés du lot concerné, puis on rembourse par Stripe.
- **Pros** : pas de remboursement au prorata du mois entamé. L'annuel n'est remboursé qu'en cas de manquement de notre part.

### 6.6 Invariants vérifiés automatiquement

- Aucun solde négatif.
- Aucune réservation ouverte au-delà des délais du § 6.4.
- La somme des lots égale le solde.
- **Rapprochement quotidien** : chaque paiement Stripe a son lot, et chaque lot acheté a son paiement.
- Chaque consommation a sa publication, et chaque libération a son e-mail.

### 6.7 Budgets IA : quatre niveaux

Les blocages sont d'abord **dans notre logiciel** (décision n° 3) : chaque appel est enregistré avec son coût, on sait qui consomme quoi (par plan, par organisation, par jour), et chaque plafond bloque avant la dépense. Les plafonds des clés OpenRouter ne sont qu'un **second verrou**.

1. **Par plan : 3 $ au plus, toutes passes et relances confondues**, réservés avant la lecture, avec un arrêt propre au-delà.
   - `max_tokens` bornés, nombre maximal de relectures et d'arbitrages.
   - Au plus **une** relance payante, à nos frais, dans ces mêmes 3 $. Ensuite, l'équipe rejoue le plan sans IA.
   - Aucune relance automatique après un refus 402 ou 403.
2. **Par compte** :
   - pas de génération sans crédit ;
   - générations simultanées limitées (§ 3.2) ;
   - un plafond mensuel en dollars par organisation (`ARCHITECTURE.md` § 6.5), lu dans la version d'offre du catalogue.
3. **Par jour** : le plan offert des particuliers, avec un plafond quotidien indexé (§ 8.8). La clé « gratuit » (`prod-gratuit`) ne sert qu'à lui. Les essais pros passent par la clé « payant », dans le plafond mensuel de leur organisation.
4. **Par clé OpenRouter** (second verrou) :
   - `prod-payant` : plafond mensuel d'environ 1,5 fois la prévision ;
   - `prod-gratuit` : plafond quotidien, réservé au plan offert des particuliers ;
   - `dev` : 10 $ par jour ;
   - recharge automatique coupée ;
   - pas plus de 2 à 3 mois de crédits prépayés, car ils expirent au bout d'un an ;
   - alertes à 50, 80 et 100 % des plafonds, et pour tout plan au-delà de 3 $.

### 6.8 Durées de mise en ligne et de conservation

Ces durées font foi. Chacune est calculée et stockée à l'achat ou à la publication, selon la version d'offre achetée, jamais selon le catalogue du jour (droits acquis). La purge et les durées propres aux données personnelles sont portées par L5-20.

| Objet | Durée | Détail |
|---|---|---|
| Crédit offert | à lancer sous 30 jours | § 2.2 |
| Aperçu publié, non débloqué | **6 mois** | Rappel avant suppression ; déblocage instantané pendant ce temps (§ 2.2) |
| Lien d'aperçu partagé | 30 jours | Révocable (§ 2.2) |
| Plans achetés par un particulier, non lancés | 12 mois | Rappels à 30 et 7 jours (§ 2.3) |
| Visite d'un particulier (débloquée ou lancée en plan complet) | **24 mois** en ligne | À valider par l'avocat ; repli : 12 mois plus une prolongation. Au-delà, 9 € TTC par tranche de 12 mois (§ 2.3, § 2.4) |
| Liens de visite pros | 90 jours par défaut, réglables | Après résiliation : 90 jours, ou tant que la Veille est payée ; liens d'essai : 30 jours après la fin de l'essai (§ 3.3, § 3.6, § 3.7) |
| Lots promoteurs | 24 mois après la livraison | Puis 3 € HT par lot et par an (§ 4.6) |
| Journal des liens prospects | 6 mois | Puis agrégé (§ 3.4) |
| Preuves du parcours légal | 5 ans au moins | § 2.5 |

---

## 7. Options futures et calendrier

### 7.1 Règle

Une option n'est vendue que si quatre conditions sont réunies :
1. ses **contrôles automatiques** couvrent ses défauts possibles (consigne « zéro défaut visible ») ;
2. elle passe sur **tous les plans de référence** (D201 en tête), validés plan par plan ;
3. son **coût variable est mesuré** ;
4. son prix vaut **au moins 5 fois** ce coût.

En plus :
- pas de prévente, pas de date annoncée, jamais « bientôt » ;
- une option peut s'ajouter plus tard à un plan déjà débloqué, sans nouvelle lecture quand c'est possible ;
- la couverture de nouveaux formats (duplex…) **n'est pas une option**. Un format validé entre dans le prix de base, et rien n'est promis avant.

### 7.2 Ordre et prix cibles

| Ordre | Option | Conditions propres | Particulier (TTC) | Conseillers (HT par plan) | Promoteurs (HT par lot) |
|---|---|---|---|---|---|
| 1 | **Aménagement et déco (meublé)**, un seul style au départ | Contrôles : aucun meuble qui flotte ou traverse un mur, portes et fenêtres dégagées, circulation libre, équipements bien orientés. Coût revu si le placement demande un appel IA | +20 € (visite meublée à 49 €) | +3 € en Solo et Cabinet, inclus en Équipe | +5 € |
| 2 | **Lumière réelle** : soleil selon l'orientation, la date et l'heure. Le moteur sait déjà le faire hors du mode simple | Nord lu de façon fiable ; mention « ensoleillement indicatif » ; contrôle d'exposition | +9 € | +2 € en Solo et Cabinet, inclus en Équipe | +2 € |
| 3 | **Réalisme et 4K**, vendus ensemble (lancer de rayons) | GPU obligatoire : en rendu logiciel, 14 passes en 90 s contre 700 sur GPU. L4 à la demande (0,79 € de l'heure) ou Mac mini M4 (149 € par mois), plus un contrôle d'équivalence visuelle | +15 € | +4 € | +6 € |
| 4 | **Variante TMA avec vue comparée** avant/après | Seulement à partir d'un plan modificatif du promoteur ou de l'architecte, lu comme un nouveau plan. Jamais à partir d'un croquis ; aucune mention de faisabilité | 19 € la variante (contre 15 € pour un simple plan suivant, disponible dès le lancement) | 1 plan du quota | 50 % du prix du lot |
| 5 | **Visite de la résidence** | Lots stables, promoteur pilote | — | — | Sur devis |

- **Formule tout compris** : son prix sera fixé quand trois options existeront, affiché sans prix barré.
- **Marque blanche** : +2 € HT par plan pour le meublé ; le reste sur devis.

### 7.3 Calendrier par jalons (interne, sans date publique)

| Jalon | Déclencheur | Ce qui ouvre |
|---|---|---|
| **J0 : bêta fermée** (lot 6) | Failles bloquantes corrigées (audit B1 à B9), grand livre, verrou serveur de l'aperçu, contrôle « aucun texte technique », mention incrustée, masquage en mode simple du rendu photoréaliste et de la superposition (L4-11), mentions légales, CGU, confidentialité, ZDR | Variante « bêta » : invités seulement (code d'invitation), 1 crédit `testeur` par testeur, aucun achat ni prix affiché (§ 2.8) |
| **J1 : particuliers payants** (lot 8, ouverture à tous en L8-07) | CGV avec les parcours de rétractation, médiateur, RC Pro, « Renoncer au contrat ici », tests T0 à T2 concluants | Premier plan offert, 29 €, 15 €, 59 € |
| **J2 : conseillers** | Contrat pro et DPA, liens prospects, bouton « Je suis intéressé », Billing. Avant ce jalon, les pages pros ne proposent qu'un entretien ou la bêta fondateurs (L2-18) | Bêta fondateurs, puis Solo, Cabinet et Équipe, et l'essai en ligne |
| **J3 : promoteurs** | Contrat promoteur et SLA, iframe limitée aux domaines, facture électronique possible | Rapport de prise en charge, pilote, prix au lot |
| **J4 : codes** | Premier partenaire | Codes à offrir |
| **J5 : marque blanche** | 3 conseillers payants, 1 pilote réussi, 1 lettre d'intention | 1 instance |
| **Options** | Conditions du § 7.1 | Dans l'ordre du § 7.2. Le meublé passe en premier, car les deux cibles le demandent |

### 7.4 Évolutions de la version de base (pas des options)

Elles améliorent ce qui est déjà vendu, sans être vendues à part. Aucune n'est promise ni annoncée avant d'être en production.

| Évolution | Ticket | Règle |
|---|---|---|
| **Galerie complète** : une dizaine de photos par plan | L13-02, après L13-01 | Jamais promise au lancement : les textes ne citent aucun nombre de photos. Une fois en production, nouvelle version d'offre au catalogue ; proposition de L0-04 : l'ajouter **sans supplément** aux plans déjà vendus, par un rendu seul, sans lecture IA |
| **Rendu plus rapide** (GPU, Mac, tâches à la demande) | L13-01 | Accélération optionnelle ; le rendu SwiftShader en conteneur reste la base, partout |
| **Aperçu interactif** (vue du dessus manipulable) | L13-03 | Idée à tester ; ni moteur ni `plan.json` dans l'aperçu tant qu'elle n'est pas validée |

---

## 8. Économie unitaire

### 8.1 Hypothèses de coût

| Poste | Valeur | Source |
|---|---|---|
| IA par plan | 1,10 à 1,85 $, plus 0,02 $ de qualification, plus 5,5 % de frais OpenRouter (8 % avec le routage UE) : **1,18 à 1,97 $** | `CLAUDE.md`, `hebergement.md` § 10 |
| Change | **1 $ = 1 €** par prudence (la chaîne code 0,90) | `lire.py` |
| Échecs après lecture | **20 % supposés**, non mesurés : seuls 4 plans ont été testés | hypothèse |
| Rendu au lancement : visite de contrôle, vue du dessus, plan 2D et 2 photos, en SwiftShader dans un conteneur sur notre VM | Coût marginal compris dans les coûts fixes (§ 8.10). **Provisions par prudence**, reprises de l'estimation en tâches à la demande : 0,05 € pour les 4 images d'un aperçu ; 0,15 € pour un plan complet, qui couvre aussi le rendu futur de la galerie complète si elle est ajoutée sans supplément (§ 7.4) | `hebergement.md` § 2.3 (0,10 à 0,15 € pour 11 photos, 0,03 à 0,05 € pour 3 images) |
| Stockage, e-mails, CDN | moins de 0,05 € par plan | `hebergement.md` § 5 |
| Relecture humaine d'un lot promoteur | 5 min à 50 € de l'heure, soit **4,17 €** (hypothèse à mesurer au pilote) | hypothèse |

**Coûts par plan qui en découlent :**

| Cas | Plan complet | Aperçu offert | Déblocage d'un aperçu |
|---|---|---|---|
| **Prudent** (20 % d'échecs, 1 $ = 1 €) | **2,70 €** (arrondi de 1,97 ÷ 0,8 + 0,15 + 0,05) | **2,56 €** (1,97 ÷ 0,8 + 0,05 + 0,05) | **0,12 €** (aucune lecture ni rendu au déblocage ; provision pour la galerie future et 24 mois de stockage) |
| Bas (sans échec, 1 $ = 0,90 €) | environ 1,20 € | environ 1,10 € | 0,12 € |
| **Plafond dur** (chaque plan à 3 $ d'IA, toutes passes et relances comprises, soit 3,17 € avec les frais, et 20 % d'échecs) | **4,16 €** | 4,06 € | 0,12 € |

Aperçu et plan complet rendent les mêmes images au lancement : l'écart de 0,14 € entre les deux colonnes n'est qu'une provision pour la galerie future (0,10 €) et un arrondi. Les calculs de marge gardent donc 2,70 € par plan complet, un peu au-dessus du coût du lancement.

Sans garde-fou, le plafond théorique d'une passe serait d'environ 13 $ (audit B8). Le budget de 3 $ par plan, relances comprises, est donc indispensable.

### 8.2 Frais de paiement (Stripe France)

| Poste | Frais |
|---|---|
| Carte standard de l'EEE | 1,5 % + 0,25 € |
| **Carte premium** (pire cas, retenu ci-dessous) | 2,8 % + 0,25 € |
| Prélèvement SEPA | 0,35 € |
| Billing | 0,7 % du montant TTC |
| Invoicing | 0,4 %, plafonné à 2 $ |
| Litige | 20 €, plus 20 € de contestation |

### 8.3 Particuliers (carte premium, coût prudent)

| Offre | TTC | HT | Stripe | Coût | Marge | % du HT |
|---|---|---|---|---|---|---|
| Déblocage de l'aperçu | 29 € | 24,17 € | 1,06 € | 0,12 € | **22,99 €** | 95 % |
| Premier plan, lancé directement | 29 € | 24,17 € | 1,06 € | 2,70 € | **20,41 €** | 84 % |
| Plan suivant | 15 € | 12,50 € | 0,67 € | 2,70 € | **9,13 €** | 73 % |
| Comparer 3 lots (aperçu débloqué + 2 nouveaux) | 59 € | 49,17 € | 1,90 € | 5,52 € | **41,75 €** | 85 % |
| Comparer 3 lots (3 nouveaux) | 59 € | 49,17 € | 1,90 € | 8,10 € | **39,17 €** | 80 % |

Un seul litige bancaire (40 € avec la contestation) ou une médiation (36 €) efface la marge d'une vente. Rembourser vite coûte moins cher.

### 8.4 Conseillers (quota entièrement consommé, carte premium et Billing, coût prudent)

| Formule | Prix HT | Frais | Plans | Marge | % |
|---|---|---|---|---|---|
| Solo mensuel | 49 € | 2,31 € | 5 × 2,70 = 13,50 € | **33,19 €** | 68 % |
| Cabinet mensuel | 99 € | 4,41 € | 12 × 2,70 = 32,40 € | **62,19 €** | 63 % |
| Équipe mensuel | 199 € | 8,61 € | 30 × 2,70 = 81,00 € | **109,39 €** | 55 % |
| Solo annuel (par mois) | 40,83 € | 1,74 € | 13,50 € | 25,59 € | 63 % |
| Cabinet annuel (par mois) | 82,50 € | 3,49 € | 32,40 € | 46,61 € | 56 % |
| Équipe annuel (par mois) | 165,83 € | 6,99 € | 81,00 € | 77,84 € | 47 % (50 % en SEPA) |
| Recharge Solo (5 plans) | 45 € | 1,76 € | 13,50 € | 29,74 € | 66 % |
| Recharge Cabinet (5 plans) | 40 € | 1,59 € | 13,50 € | 24,91 € | 62 % |
| Recharge Équipe (5 plans) | 35 € | 1,43 € | 13,50 € | 20,07 € | 57 % |
| Bêta fondateurs, −30 % (Solo, Cabinet, Équipe) | 34,30 / 69,30 / 139,30 € | 1,69 / 3,16 / 6,10 € | 13,50 / 32,40 / 81 € | 19,11 / 33,74 / 52,20 € | 56 / 49 / 37 % |
| Utilisateur supplémentaire | 10 € | 0,67 € | — | 9,33 € | 93 % |
| Veille | 9 € | 0,63 € | — | 8,37 € | 93 % |

- En prélèvement SEPA, Cabinet monte à 66 % et Équipe à 58 %.
- **Règle de calibrage** : au moins 50 % de marge brute en mensuel, au coût prudent, quota plein et pire carte. C'est pourquoi l'offre de 40 plans pour 199 € de `marche.md` est écartée : sa marge serait de 41 à 43 %.

### 8.5 Promoteurs (virement, relecture humaine supposée de 5 min par lot)

| Prix du lot | Coût IA | Relecture | Marge par lot | % |
|---|---|---|---|---|
| 25 € HT | 2,70 € | 4,17 € | **18,08 €** | 72 % |
| 20 € HT | 2,70 € | 4,17 € | **13,08 €** | 65 % |
| 15 € HT | 2,70 € | 4,17 € | **8,08 €** | 54 % |

- **Pilote à 600 €** : il reste 492 € après l'IA (40 × 2,70 €). Il couvre donc environ 10 h de travail à 50 € de l'heure : contrôle, 2 cycles et intégration. Le temps réel sera mesuré au pilote.
- **Nouvelle version d'un lot** (10 € HT au minimum) : marge positive, même avec 5 min de relecture.
- **Hébergement au-delà de 24 mois** (3 € HT par lot et par an) : coût négligeable, environ 10 Mo par plan.

### 8.6 Marque blanche et codes

| Offre | Calcul | Marge |
|---|---|---|
| Instance à 490 € HT par mois, en SEPA | 490 − 4,47 € de frais − 50 × 2,70 € − 30 € de coûts directs | **environ 320 €** (65 %) |
| Plan supplémentaire à 7 € HT | 7 − 2,70 | 4,30 € (61 %) |
| Retrait de la mention (150 € par mois) | — | environ 150 € |
| Mise en place (1 500 €) | Paie le temps de l'équipe, plus environ 8 € d'IA pour les 3 plans d'essai | — |
| Code à 15 € HT (par 10, carte) | 15 − 0,53 − 2,70 | 11,77 € (78 %) |
| Code à 12 € HT (dès 50, virement) | 12 − 2,70 | 9,30 € (77 %) |

Les codes non utilisés au bout de 12 mois sont payés d'avance et expirés : c'est du chiffre sans coût.

### 8.7 Sensibilité : au plafond dur, aucune offre n'est à perte

Coût de 4,16 € par plan livré (chaque plan à 3 $ d'IA, toutes passes et relances comprises, 20 % d'échecs), carte premium :

| Offre | Marge | % |
|---|---|---|
| Premier plan particulier (29 €) | 18,95 € | 78 % |
| Plan suivant (15 €) | 7,67 € | 61 % |
| Comparer 3 lots, 3 nouveaux (59 €) | 34,79 € | 71 % |
| Solo | 25,89 € | 53 % |
| Cabinet | 44,67 € | 45 % |
| Équipe | 65,59 € | 33 % |
| Recharge Équipe | 12,77 € | 36 % |
| Promoteur à 15 € (avec relecture) | 6,62 € | 44 % |
| Instance marque blanche | environ 247 € | 51 % |
| Code à 12 € | 7,84 € | 65 % |

Si le coût moyen réel dépasse 2 $ par plan sur 30 jours, les quotas et les prix sont revus (§ 8.11).

### 8.8 Premier plan offert : coût, seuil, budget

- **Coût d'un aperçu** : 2,56 € au cas prudent, environ 1,10 € au cas bas. Au lancement, le verrou n'économise aucun rendu, puisque l'aperçu et la visite ont les mêmes images : il protège la visite, pas le coût. Le plan offert n'est consommé qu'à la publication de l'aperçu (§ 6.4) ; un échec ne coûte que l'IA déjà dépensée.
- **Seuil de perte.** C'est la part des aperçus qui doivent être débloqués pour que la marge couvre leur coût. Calcul : coût de l'aperçu ÷ marge d'un déblocage.

  | Prix du déblocage | Seuil de perte (cas prudent) | Seuil de perte (cas bas) |
  |---|---|---|
  | **29 €** | **11,1 %** | 4,8 % |
  | 39 € | 8,2 % | 3,5 % |

  Ces seuils ignorent les packs, qui rapportent plus, et les coûts fixes.
- **Budget quotidien du plan offert** (plafond logiciel, doublé de celui de la clé « gratuit », `prod-gratuit`, qui ne sert qu'au plan offert des particuliers ; les essais pros n'y puisent pas, § 6.7) :
  1. **Minimum assumé** : 10 $ par jour, soit environ 4 à 8 aperçus et **300 $ par mois au plus**. C'est le budget d'acquisition.
  2. **Au-delà** : le plafond du jour vaut **30 % de la marge des ventes aux particuliers des 7 derniers jours, divisée par 7**. Les aperçus ne peuvent donc jamais consommer plus de 30 % de ce que rapportent les particuliers, en plus du minimum.
  3. **Plafond absolu** : 50 $ par jour, tant que la conversion n'est pas mesurée sur au moins 150 aperçus.
  4. **Plafond atteint** : les aperçus attendent le lendemain, avec un message clair. Les payants et les essais pros continuent sur la clé « payant ».
- **Coupe-circuit.** Si la conversion sur 30 jours passe sous le seuil de perte :
  - le plafond revient au minimum ;
  - l'aperçu offert est réservé aux PDF. Hypothèse à vérifier : les PDF échouent moins souvent que les images.

### 8.9 Essai pro

- **Coût** : 8,10 € au plus (3 plans × 2,70 €), payé sur la clé « payant » et compté dans le plafond IA de l'organisation (§ 6.7).
- **Rentabilité** : les essais sont remboursés si **1 sur 4** devient un Solo pendant un mois, ou 1 sur 12 s'ils restent 3 mois.

### 8.10 Coûts fixes (hors marge brute)

- **Hébergement** : environ 65 à 75 € par mois au lancement, soit environ 0,70 € par plan à 100 plans par mois ; environ 0,30 € par plan à 1 000 plans par mois (`hebergement.md` § 5). Deux à trois abonnés Solo, ou quatre plans vendus à 29 €, le couvrent. Le rendu SwiftShader tourne sur cette VM (Docker Compose) : sa taille est à confirmer par la mesure T0 (L0-03, L5-22).
- **Autres** :
  - médiateur : 48 € pour 3 ans, puis 36 € par dossier ;
  - dépôt INPI : 270 à 310 €, une fois ;
  - sur devis : RC Pro, avocat, plateforme agréée de facturation électronique, CMP si campagnes.

### 8.11 Seuils de pilotage

| Indicateur | Seuil | Action |
|---|---|---|
| Coût IA moyen par plan sur 30 jours | plus de 2 $ | Revoir la qualification, les quotas et les prix |
| Coût d'un plan | plus de 3 $ | Arrêt (budget) et alerte |
| Échecs après lecture | plus de 20 % | Resserrer la qualification ; aperçu réservé aux PDF |
| Conversion de l'aperçu sur 30 jours | sous le seuil de perte (11,1 % à 29 €) | Coupe-circuit (§ 8.8) |
| Marge brute d'une formule pro au coût réel | moins de 50 % | Revoir le quota de cette formule |
| Temps humain par lot promoteur | plus de 5 min | Revoir le prix au lot ou l'outillage |
| Remboursements et litiges | tout litige | Analyse de cause ; libellé et parcours revus |

### 8.12 Ordres de grandeur (repris de `marche.md` § 5.4, ce ne sont pas des prévisions)

- Particuliers : environ 50 000 acheteurs par an × 5 % × 29 € ≈ **72 k€ par an**. Le particulier sert surtout d'acquisition, de preuve et de référencement.
- Conseillers : 300 abonnés × 99 € × 12 ≈ **360 k€ par an**.
- Promoteurs : 64 000 lots mis en vente par an × 15 % × 20 € ≈ **190 k€ par an**.

---

## 9. Hypothèses à tester et protocole

### 9.1 Hypothèses de prix et de contenu

| Hypothèse | Au lancement | Plage testée | Mesure | Règle de décision |
|---|---|---|---|---|
| Prix d'un plan particulier | 29 € TTC | 29 €, puis 39 € ; 19 € si la conversion est très faible | Marge par aperçu = (ventes × marge − coût des aperçus) ÷ aperçus | Garder le prix qui maximise la marge par aperçu |
| Plan suivant | 15 € TTC | 15 ou 19 € | Part des acheteurs qui en prennent un | Garder 15 € s'il sert, sinon le fondre dans le pack |
| Comparer 3 lots | 59 € TTC | 49 ou 59 € | Part des ventes | Sous 10 % des ventes, retiré de la page ; le plan suivant reste |
| Contenu de l'aperçu | Vue du dessus 3D découpée, plan 2D coté et 2 photos, en images | Aperçu interactif (L13-03), sans moteur ni `plan.json` de la visite | Conversion | Garder la variante qui convertit le mieux, à coût égal |
| Verrou | Prix sur le bouton, puis volet | Volet sans prix sur le bouton | Clics, achats | Selon la conversion |
| Quotas pros | 5, 12, 30 | Relevés si le coût réel est inférieur à 2 € | Consommation réelle, coût réel | Relever, jamais baisser |
| Prix Solo | 49 € HT | 49 € ou 69 € par cohortes | Passage de l'essai à l'abonnement, marge | Selon la marge par essai |
| Essai sans carte | oui | Carte demandée si la conversion est faible | Passage de l'essai à l'abonnement | Sous 10 %, tester la carte demandée |
| Prix au lot promoteur | 25, 20 et 15 € HT | 15 à 25 € | Temps humain, conversion du pilote | Ajuster le palier |
| Instance marque blanche | 490 € HT par mois | 390 à 490 € | Lettres d'intention | Ne construire qu'avec une lettre signée |

**Règle** : tous les tests de prix se font **par périodes successives** (3 semaines, ou environ 150 aperçus), avec le même prix pour tous pendant une période. Jamais de prix différent tiré au sort par personne : un prix qui varie selon le visiteur devrait être annoncé comme personnalisé (L221-5). Chaque période est une version du catalogue (§ 0.2, règle 7). Les tests de **textes** (et non de prix) peuvent être tirés côté serveur pour les comptes connectés.

### 9.2 Protocole, du moins cher au plus cher

**T0. Sans aucune dépense IA, avant les testeurs.**
- **Rendu en production** : réassembler sans IA l'appartement témoin et, hors CI, les 4 plans testés (`outils/finalise.sh`), en SwiftShader dans le conteneur de la VM (Docker Compose), le rendu par défaut partout (L5-11).
  - Mesurer la durée de chaque passage de la visite de contrôle, de la vue du dessus, du plan 2D et de chaque photo (médiane et 9e décile).
  - Comparer au rendu Metal : l'écart doit rester sous 2/255.
  - **Décision** : le délai affiché, qui remplace le marqueur ‹délai› partout, et la taille de la VM. L'essai M2.7a d'`ARCHITECTURE.md` n'est qu'une mesure informative ; GPU, Mac et tâches à la demande sont des accélérations après le lancement (L13-01), jamais obligatoires.
- **Verrou** : contrôle automatique « ni moteur ni `plan.json` sur la page d'aperçu, aucun texte technique ».
- **Grand livre** : réservation, consommation (à la publication de l'aperçu, puis à celle d'une visite) et libération sur un échec simulé, un refus 402 simulé, une réservation orpheline (battement de cœur absent) et un webhook reçu deux fois. Clé `dev` et réponses déjà gardées (`reponse-ia.json`).

**T1. Qualification**, environ 0,02 $ par plan.
- Sur les plans que l'utilisateur fournit, un par un, y compris des plans hors périmètre.
- Compter les faux acceptés, qui coûtent une lecture, et les faux refusés, qui perdent une vente.
- **Décision** : le réglage de la qualification.

**T2. Testeurs** (1 crédit par testeur).
- Mesurer :
  - le coût complet par plan, qualification et appels interrompus compris ;
  - les échecs par cause ;
  - les défauts signalés ;
  - la compréhension de l'aperçu ;
  - les personnes avec qui ils partagent ;
  - le prix jugé acceptable (4 questions de type Van Westendorp).
- **Décision** : si le coût dépasse 2 $ par plan ou si plus de 20 % des lectures échouent, revoir la qualification et les prix **avant** d'ouvrir l'aperçu offert au public.

**T3. Conversion de l'aperçu.**
- Événements du journal serveur (`SUIVI.md`) : `plan_lance` (`source_lot=offert_inscription`), puis `achat_paye` et `apercu_debloque`.
- Mesurer le délai jusqu'au déblocage et la part des packs et des plans suivants.
- Tests de prix selon le § 9.1.

**T4. Verrou.** Prix affiché sur le bouton, ou volet de choix : mesurer les clics et les achats.

**T5. Friction du compte.**
- Mesurer la part des visiteurs perdus entre le dépôt et l'e-mail vérifié.
- Au-delà de 40 % : proposer Google en premier, et montrer « plan reconnu » (analyse sans IA) avant de demander l'e-mail.

**T6. Conseillers.**
- **Entretiens** : 15 à 20 entretiens avec démonstration en direct, auprès de CGP qui vendent du neuf (annuaires CNCGP et ANACOFI) et de mandataires qui utilisent le filtre « Neuf » d'iad.
- **Mesures** :
  - la part qui demande l'essai ;
  - les plans par mois qu'ils déclarent ;
  - leur réaction à 49, 99 et 199 € ;
  - s'ils ont l'autorisation du promoteur ;
  - leur taux de désistement, qui est la donnée publique manquante.
- **Décision** : si moins d'un tiers demande l'essai, revoir la promesse avant le prix.
- **Bêta fondateurs** (30 cabinets), avec objectifs :
  - passage de l'essai à l'abonnement : au moins 25 % ;
  - consommation par formule ;
  - clics « Je suis intéressé » ;
  - résiliations au 2e et au 3e mois.

**T7. Promoteurs.** 1 ou 2 pilotes payants à 600 €, par les chambres régionales de la FPI. Mesurer :
- le délai réel ;
- les **minutes humaines par lot**, qui valident les 54 à 72 % de marge ;
- les cycles de correction ;
- la part des lots pris en charge ;
- la conversion en commande ;
- leurs chiffres de désistement.

**T8. Coût réel sur les 100 premiers plans.** Remplacer les 2,70 € prudents par la mesure. Si le coût réel reste sous 2 €, relever les quotas pros.

**T9. Codes et marque blanche.** Trouver un premier partenaire codes (service VEFA ou courtier), puis obtenir 1 lettre d'intention avant de développer le multi-domaine.

**T10. Bouche-à-oreille.** Mesurer :
- la part des aperçus et des visites partagés ;
- les dépôts venus d'une page partagée (événement anonyme dans Umami) ;
- les clics « Vous vendez du neuf ? » ;
- les essais pros dont la source déclarée est « un client m'a montré une visite ».

Parrainage et carte cadeau ne seront testés qu'ensuite.

**T11. Moments clés.**
- Mesurer la conversion selon la réponse à « Où en êtes-vous ? ». Hypothèse : le délai de rétractation de 10 jours convertit le mieux.
- En déduire l'accueil et les pages de référencement : rétractation VEFA, visite cloisons, coût des TMA, « transformer un plan 2D en 3D ».
- Aucun e-mail de relance sans consentement ou exception client validée.

**T12. Options.** Sonder l'intérêt pour le meublé pendant les entretiens (+3 € HT pour un pro, +20 € TTC pour un particulier), sans le vendre ni donner de date.

**T13. Avocat, avant la première vente.** Voir l'annexe B.

---

## 10. Risques

| # | Risque | Effet | Parade |
|---|---|---|---|
| 1 | Conversion de l'aperçu inconnue | Le gratuit perd de l'argent sous 11,1 % à 29 € (cas prudent) | Budget indexé sur la marge, minimum assumé, coupe-circuit (§ 8.8) |
| 2 | Plus d'échecs qu'en test (4 plans seulement) | Chaque échec coûte une lecture et rend le crédit | Qualification, refus hors périmètre, budget de 3 $, une seule relance, rejeu sans IA, coût prudent de 2,70 € |
| 3 | Délais plus longs sans GPU (environ 11 fois) | Promesse du « quart d'heure » intenable au moment du doute | Aucun délai écrit en dur (marqueur ‹délai› jusqu'à T0), vue du dessus montrée dès qu'elle existe, 2 photos seulement au lancement, aperçu publié sans attendre les photos, accélérations après le lancement (L13-01), aucun délai garanti |
| 4 | Coût IA et change | Marges | Calcul à 1 $ = 1 €, clause de révision avec préavis pour les pros, alertes. Un modèle moins cher n'est adopté qu'après vérification par `evaluer.py` |
| 5 | Verrou contourné | Visites gratuites | Verrou serveur et contrôle automatique |
| 6 | Abus du gratuit et des essais | Coût | Mesures du § 2.2 (dont les deux empreintes, fichier et page rendue), SIREN, plafond quotidien de la clé « gratuit », budget IA par organisation pour les essais, alertes |
| 7 | Défaut visible sur une visite partagée | Casse le bouche-à-oreille au moment où il naît | Visite de contrôle, « Signaler un défaut », chaque défaut devient un contrôle |
| 8 | Promesses trop fortes | Pratique commerciale trompeuse ; la promesse devient contractuelle | Vocabulaire banni (§ 1), « cotes reprises du plan de vente » |
| 9 | Obligations envers les particuliers | Amendes (jusqu'à 15 000 € sans médiateur) | Liste de J1 (§ 7.3) remplie avant la première vente |
| 10 | 24 mois d'hébergement, c'est 24 mois de garantie de conformité | Une mise à jour du moteur peut casser une ancienne visite | Moteur versionné, rejeu des anciennes visites en test de non-régression. Repli : 12 mois plus une prolongation |
| 11 | Conseiller sans autorisation du promoteur | Contrefaçon, risque moyen à élevé | Case déclarative, retrait sur notification, codes à offrir, portail distributeurs |
| 12 | Liens prospects traçants | Non-conformité CNIL | Compteur agrégé par défaut, bouton « Je suis intéressé », détail seulement avec consentement, avis de l'avocat |
| 13 | Loi Hoguet | Requalification de l'activité | Pas de mise en relation, pas de revente de prospects ni de fichiers de lots |
| 14 | Plans des promoteurs | Atteinte aux droits, perte de confiance | Jamais publiés sans accord, pas de vitrine, appartement témoin fictif, superposition jamais sur un lien |
| 15 | OpenRouter sans SLA | Engagement impossible à tenir | Engagement sur les visites publiées et sur un délai par programme, jamais par génération |
| 16 | Marché au plus bas (T2 2026, le pire trimestre mesuré par la FPI) | Quotas et prix mal calibrés | Sans engagement, bêta fondateurs, recalibrage, coûts fixes bas |
| 17 | Cannibalisation (codes et plans pros moins chers qu'au particulier) | Baisse du chiffre des particuliers | Codes non revendables, SIREN vérifié, licence d'usage privé pour les particuliers |
| 18 | Litiges bancaires | 40 € par litige | Libellé clair, reçu immédiat, remboursement facile en cas de défaut |
| 19 | Facturation électronique | Amendes | Plateforme agréée pour la réception (déjà due), émission au plus tard le 01/09/2027 |
| 20 | Nom non validé | Conflit ou rebranding | Forme unique « Sur Pièce ». `surpieces.fr` (au pluriel) est pris. Dépôt INPI avant toute annonce |
| 21 | Support d'une petite équipe | Délais, erreurs | File de basse priorité pour les imports, formulaire de défaut structuré, pas de téléphone pour les particuliers, une instance de marque blanche à la fois |

---

## Annexe A. Notes des trois propositions et raisons du choix

Notes sur 10.

| Critère | A. Acquisition des particuliers d'abord | B. Revenu récurrent des pros d'abord | C. Maîtrise des coûts et des risques |
|---|---|---|---|
| Conversion des particuliers | 8 | 7 | 5 |
| Revenu récurrent | 7 | 9 | 7 |
| Marge garantie (gratuit compris) | 5 | 8 | 9 |
| Simplicité à comprendre et à coder | 4 | 6 | 7 |
| Conformité juridique | 7 | 8 | 8 |
| Crédibilité face aux concurrents | 7 | 8 | 7 |
| Adéquation aux consignes | 7 | 7 | 8 |
| **Total sur 70** | **45** | **53** | **51** |

**A (45).** Le meilleur moteur de croissance : partage de l'aperçu, plan suivant, facturation en lignes, codes et moments clés. Mais trois défauts :
- la maquette 3D interactive dans l'aperçu gratuit charge le moteur et `plan.json`, ce qui ouvre la visite par la console ou par un double-clic ;
- les « moments de lumière » sont inclus dans l'offre de base, alors que la lumière est une option future selon `CLAUDE.md` ;
- il y a trop de produits : 29, 39, 49 et 15 €, carte cadeau, parrainage et « satisfait ou remboursé ». Ce dernier est détournable pendant la rétractation VEFA.

En plus : un coût non prudent (1,90 €), 40 plans pour 199 € et un pilote gratuit.

**B (53), retenue comme base.** Une vision claire du revenu, avec :
- une grille pros cohérente ;
- un essai sans carte vérifié par SIREN ;
- le verrou côté serveur ;
- le portail distributeurs, qui règle le droit d'auteur et fait connaître l'offre Pro ;
- un pilote payant ;
- la bêta fondateurs, la Veille et les codes prépayés.

Ce qui a été corrigé :
- les moments de lumière, retirés de la base ;
- l'offre Équipe à 249 €, ramenée à 199 € pour 30 plans ;
- le contrat cadre à trois paliers, simplifié en prix au lot selon le volume.

**C (51), deuxième.** La meilleure rigueur économique :
- coût prudent (1 $ = 1 €, 20 % d'échecs) ;
- quatre niveaux de budget ;
- budget du gratuit indexé sur la marge et coupe-circuit ;
- rendu de 3 images seulement pour l'aperçu ;
- cote demandée avant la lecture ;
- rapport de prise en charge offert aux promoteurs ;
- hébergement au lot et par an ;
- nouvelle version à 50 % ;
- « on ne facture que le client » en marque blanche.

Mais trois choix pèsent sur la conversion :
- 39 € et un pack à 89 € ;
- un aperçu placé en fin de file, avec un délai affiché « dans l'heure, sinon le lendemain », faible au moment du doute ;
- une carte demandée pour l'essai pro.

Le repère `{NOM}` est aussi moins lisible que la forme exacte.

**Greffes retenues :**
- depuis C : les § 6.4, 6.7, 8.1, 8.7 et 8.8, le rendu partiel de l'aperçu, le § 4.1, le § 4.6 et le § 5.3 ;
- depuis A : le plan suivant à 15 €, les lignes « 29 + 15 + 15 », le lien d'aperçu partageable, la page du destinataire, la question « Où en êtes-vous ? », les codes à offrir par les conseillers et les tests de friction du compte.

**Écarté :**
- « satisfait ou remboursé » (détournable) ;
- 36 mois d'hébergement (garantie longue ; 24 mois retenus, à valider) ;
- pack de 2 à 39 € et carte cadeau au lancement (trop de produits) ;
- pilote gratuit (moins crédible qu'un pilote payant déduit) ;
- 40 plans pour 199 € (41 à 43 % de marge au coût prudent).

## Annexe B. Questions pour l'avocat liées aux offres

1. La facturation du pack en lignes (29 + 15 + 15) suffit-elle pour rembourser 15 € par plan non utilisé en cas de rétractation ?
2. La case de renonciation au déblocage d'un aperçu déjà calculé est-elle valable, puisque le contenu est livré à l'instant ? La case d'écart consenti doit-elle être répétée à chaque achat ?
3. Un hébergement de 24 mois compris dans le prix : quel risque de remboursement au prorata pour la part hébergement, et quelle durée de garantie ?
4. Codes à offrir : l'usage privé par l'acquéreur écarte-t-il la question de l'autorisation du promoteur pour le conseiller qui offre le code ?
5. Liens individuels par prospect : le statut « ouvert » peut-il être montré au conseiller avec une simple ligne d'information, ou faut-il un consentement ?
6. Le partage privé avec un banquier ou un notaire sort-il du cercle de famille (CPI L122-5 1°) ?
7. Marque blanche : en cas de revente à des particuliers par le client, qui porte les obligations du vendeur ?
8. Garantie légale et aperçu offert : quelle étendue pour un contenu gratuit fourni contre une adresse e-mail ?
