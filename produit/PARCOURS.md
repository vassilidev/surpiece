# Parcours de conversion et d'usage

Version du 27/09/2026. **Proposition à valider par l'utilisateur.** Alignée le 27/09/2026 sur les décisions de l'utilisateur (D1 à D10) et les arbitrages du coordinateur (R1 à R23), qui priment sur le reste du document.

> Ce document décrit, écran par écran, les parcours du particulier (A), du conseiller (B), du promoteur (C), de la marque blanche (D) et de l'administration interne (E), puis les leviers de conversion à tester (§ 7).
>
> - **Les pages ne sont pas codées maintenant** (D1) : ce document fixe l'enchaînement que les tickets (`tickets/<lot>/`) réalisent. Les étapes citent leurs tickets.
> - Les prix sont ceux de `OFFRES.md`. Ce sont **tous des hypothèses de lancement**, lues dans le catalogue d'offres modifiable sans déploiement (D7, R5, L5-08).
> - Aucune donnée d'usage n'existe encore. Les taux cités sont des **seuils de décision** ou des **calculs**, jamais des mesures.
> - **Aucun délai en dur** (R12). Les maquettes et les textes portent le marqueur `‹délai›` jusqu'à la mesure en production (test T0, `OFFRES.md` § 9.2, L5-11). « 8 à 15 min » a été mesuré sur Mac avec GPU ; le rendu serveur se fait en SwiftShader dans un conteneur, par défaut et partout (D4, R3), environ 11 fois plus lent pour les photos (`recherche/hebergement.md` § 2.1). L'accélération vient après le lancement (L13-01). « Un quart d'heure environ » (`MESSAGES.md` § 0.3) n'est plus affiché.
> - **Hiérarchie des sources** quand deux documents divergent : décisions de l'utilisateur, puis arbitrages R1 à R23, puis `OFFRES.md` (offres, crédits, durées, R7), `ARCHITECTURE.md` (technique), `MESSAGES.md` (textes), ce document, `SUIVI.md` (événements).

**Nom.** « Sur Pièce » est un nom provisoire (plan B : « Avant-Clés »).
- Il est écrit sous cette seule forme, et « SUR PIÈCE » dans les maquettes.
- Il n'est jamais précédé de « de », « du » ou « le » : un rechercher-remplacer suffit pour le changer (`MARQUE.md` § 1.1).
- Les adresses sont notées `<domaine>`, `app.<domaine>`, `visite.<domaine>` (`ARCHITECTURE.md` § 2.5).

**Sources.**
- `OFFRES.md`, `MARQUE.md`, `ARCHITECTURE.md`, `CLAUDE.md`.
- `recherche/` : audit-code, marche, suivi, auth-paiement, hebergement, juridique, nom.
- L'existant, relu le 27/09/2026 : `pipeline/accueil.html` (écran « chantier », calibration au clic), `pipeline/serveur.py` (refus motivés, analyse, qualification), `moteur/ui.js` (galerie, bouton `g-cta`, fiche). Le travail sur les niveaux (fini le 27/09/2026, non commité) a modifié `pipeline/` et `moteur/` : les numéros de ligne peuvent avoir bougé. Rien n'y est modifié ici.

**Documents écrits en parallèle, lus le 27/09/2026 à 12 h 28.** Ils peuvent encore évoluer.
- **`MESSAGES.md`** est le catalogue des textes. Ce document cite ses **clés** (par exemple `depot.reconnu.titre`) et ses e-mails (E1 à E15). Un texte absent du catalogue est proposé ici et marqué **« à ajouter »**.
- **`SUIVI.md`** est le dictionnaire définitif des événements. Ce document reprend ses noms et sa légende : **N** navigateur vers Umami, anonyme ; **S** serveur vers le journal ; **C** compteur agrégé côté serveur. Un événement absent est marqué **« à ajouter »** et regroupé au § 8.1.
- En cas d'écart, `MESSAGES.md` fait foi pour les textes et `SUIVI.md` pour les événements, dans l'ordre de la hiérarchie ci-dessus. Ce document fixe l'enchaînement des écrans.

---

## 0. En bref

**Particulier.**
- Le dépôt du plan est le premier geste, sans compte.
- Le fichier est gardé dans le navigateur (IndexedDB) et dans un dépôt provisoire de 24 h. Une analyse sans IA répond en quelques secondes « Plan reconnu », ou refuse avant toute dépense.
- Le compte n'est demandé qu'au clic sur « Lancer mon plan offert » : Google ou un e-mail, deux cases, pas de carte.
- Le chantier démarre dès que l'e-mail est vérifié. On peut fermer l'onglet : un e-mail prévient quand c'est prêt.
- Après la vérification avant livraison, l'écran d'attente montre en direct la **vue du dessus 3D découpée**, puis le **plan 2D coté**, puis **2 photos** (D5, L6-03).
- L'aperçu gratuit ne contient que ces images, les surfaces et les points à faire confirmer : **ni moteur ni `plan.json`** ne sont envoyés au navigateur (D6, R1, R4). Décision de principe du 27/09/2026 (n° 15) : la visite 360° d'arrêt en arrêt, en panoramas rendus par le serveur, entre dans toutes les visites et deviendra probablement l'offre gratuite, à confirmer par son coût de rendu (L1-16 ; mise en service L6-13). Il est publié dès que la vue du dessus et le plan 2D sont prêts ; une photo qui échoue est omise sans bloquer (R2).
- La visite se débloque pour 29 € TTC, **sans nouvelle lecture ni nouvelle attente** : elle se calcule dans le navigateur (D5). Pas de galerie complète au lancement (L13-02, R1).
- **Bêta fermée** (lot 6) : dépôt réservé aux invités, aucun achat ni prix proposé. Ouverture à tous et vente en L8-07 (R13).
- Un échec ne décompte rien, avec un e-mail, et le remboursement en argent se demande simplement.

**Conseiller.** Page pro → essai de 14 jours avec 3 plans, sans carte, 1 par SIREN → premier lien envoyé pendant la première session, grâce à l'appartement témoin préchargé → tableau de suivi sans traceur illicite → abonnement. Avant les lots 9 à 11, la page pro ne propose qu'un entretien ou la bêta fondateurs, pas d'essai en ligne (R21, L2-18).

**Promoteur.** Rapport de prise en charge offert → pilote à 600 € HT → import du programme → contrôle lot par lot → publication et intégration limitée aux domaines déclarés → facture.

**Marque blanche.** Les codes à offrir d'abord, l'instance ensuite (`OFFRES.md` § 5.6).

**Administration.** Tout acte de l'équipe laisse une trace et un motif. Un rejeu ne peut pas payer d'IA. Rendre un plan passe toujours par un mouvement du grand livre.

**Six règles tenues à chaque écran.**
1. Une seule action en Bleu plan.
2. Aucun texte technique.
3. Les limites sont écrites près du bouton.
4. Le prix est affiché avant l'engagement : TTC pour les particuliers, HT pour les pros.
5. Aucun plan n'est décompté avant la publication : celle de l'aperçu pour le plan offert (R2), celle de la visite pour un plan complet (L5-11, L8-02).
6. Aucun traceur sur les liens de visite partagés, les pages prospects, les intégrations et les e-mails.

**Tests A/B.** Avant le compte, on teste **par périodes successives**, car les cohortes sortent de l'exemption CNIL. Après le compte, les tests de textes peuvent être tirés côté serveur. Les prix, **toujours par périodes**, jamais un prix différent tiré au sort par personne (R8, § 7.1).

**Entonnoir du particulier et seuils de décision déjà fixés** (détail : `SUIVI.md` § 4.2).

| Passage | Événements (`SUIVI.md`) | Seuil et action | Source |
|---|---|---|---|
| Plan choisi → compte vérifié | `depot_fichier_choisi`, `depot_provisoire_recu` → `compte_cree` | Perte de plus de 40 % : Google en premier, levier L1 | `OFFRES.md` T5 |
| Aperçu prêt → achat | `apercu_pret` → `achat_paye` (`depuis_apercu`) | Moins de 11,1 % sur 30 jours à 29 € : coupe-circuit du gratuit | `OFFRES.md` § 8.8 |
| Lecture lancée → publiée | `plan_lance` → `apercu_pret`, `plan_pret` ou `plan_echoue` | Plus de 20 % d'échecs : qualification resserrée, aperçu réservé aux PDF | `OFFRES.md` § 8.11 |
| Pack parmi les ventes | `achat_paye` (`offre=particulier_pack_3`) | Moins de 10 % des ventes : pack retiré de la page | `OFFRES.md` § 9.1 |
| Essai pro → abonnement | `essai_pro_demarre` → `abonnement_demarre` (`depuis_essai`) | Moins de 10 % : tester la carte demandée ; objectif de la bêta : au moins 25 % | `OFFRES.md` § 9.1, T6 |

---

## 1. Règles communes

### 1.1 Conventions des maquettes

| Signe | Sens |
|---|---|
| `[[ Libellé ]]` | Action principale, en Bleu plan. Une seule par écran |
| `[ Libellé ]` | Bouton secondaire, trait Encre de 1,5 px |
| `<Libellé>` | Lien |
| `[ ]`, `[x]` | Case non cochée, cochée. Aucune case n'est pré-cochée |
| `( )`, `(o)` | Choix possible, choix retenu |
| `(*)`, `(>)` | Étape terminée, étape en cours (formes différentes, pas seulement la couleur) |
| `[#]` | Élément verrouillé : cadenas au trait, jamais d'image cassée |
| `~~~~` | Image : photo, plan 2D, maquette |
| `- - -` | Zone de dépôt, en tireté (la seule zone en tireté Encre, `MARQUE.md` § 6.4) |
| `‹…›` | Valeur variable (`{variable}` dans `MESSAGES.md`) |

Les maquettes « ordinateur » font 74 colonnes, les maquettes « mobile » 38. Elles fixent le contenu et l'ordre, pas le dessin final : celui-ci suit `MARQUE.md` § 6 (cartouche, traits de 1,5 px, angles droits, Archivo et DM Mono). Les textes des maquettes reprennent `MESSAGES.md` quand il les contient.

### 1.2 Principes d'écran

1. **Montrer avant de demander.** Le plan est analysé avant l'e-mail. L'aperçu est montré avant le prix de la visite. L'appartement témoin est ouvert à tous.
2. **Un écran, une décision.** Une action principale ; les autres actions sont des boutons secondaires ou des liens.
3. **Honnêteté d'abord.**
   - Le gratuit est décrit tel qu'il est : « sans la visite ».
   - Le prix de la visite est dit avant le dépôt, dès que la vente est ouverte (L8-07). Pendant la bêta fermée, aucun message ne propose 29 € (R13).
   - On ne promet que ce qui est livré : pas de galerie complète au lancement (R1).
   - Aucun compte à rebours, aucun prix barré, aucune rareté inventée.
   - Sur Pièce ne conseille jamais d'acheter, d'annuler ni de se rétracter (`MARQUE.md` § 4.1).
4. **Rien n'est perdu.**
   - Le fichier survit à un rechargement et au détour par la boîte e-mail.
   - Le chantier se retrouve depuis n'importe quel appareil.
   - Un plan qui échoue n'est pas décompté.
5. **Unité affichée : le plan.** On écrit « votre premier plan est offert », « 2 plans disponibles » ; jamais « crédit », que l'acquéreur entend comme son prêt (`OFFRES.md` § 1). Le grand livre et les factures gardent « crédit ».
6. **Vocabulaire** (`MESSAGES.md` § 0.4).
   - « Vérification avant livraison », pas « visite de contrôle » (terme interne).
   - « Lu dans le plan » ou « automatiquement », jamais « IA » dans l'interface. La page « Méthode », les CGU et la politique de confidentialité disent en revanche clairement qu'un modèle d'intelligence artificielle lit le plan (`MARQUE.md` § 5.2).
   - Jamais « conforme », « exact », « certifié », « garanti » ni « au centimètre » dans une promesse.
7. **Les limites sont toujours visibles près de l'action** (`MESSAGES.md` § 8.4) : appartements sur un ou deux niveaux (duplex), logement vide, finitions supposées, illustration non contractuelle.

### 1.3 Textes

- **Catalogue.** `MESSAGES.md` § 7 (clés `zone.élément`), § 7.11 (e-mails E1 à E15), § 7.12 (erreurs), § 7.13 (bandeaux). Chaque état renvoie un code ; le catalogue le traduit ; le détail technique part au journal (`ARCHITECTURE.md` § 1, principe 4).
- **Contrôle automatique.** La publication échoue si un texte affiché contient `.env`, `Error`, `json`, `http`, un identifiant technique, une coordonnée ou une variable non remplie (`MESSAGES.md` § 7). Le contrôle couvre aussi les e-mails.
- **Message d'erreur** : ce qui s'est passé, ce que ça change pour votre plan, quoi faire maintenant (`MARQUE.md` § 4.3).
- **Délai affiché** (R12) : aucun délai écrit en dur ; le marqueur `‹délai›` reste tant que T0 n'a pas été mesuré en production (L5-11). Proposition de règle ensuite : `‹délai›` = le 75e centile mesuré en production sur 7 jours, arrondi aux 5 min supérieures, précédé de « environ », lu dans une seule valeur de configuration. Ce n'est jamais un engagement.

### 1.4 Mesure

Tout est défini dans `SUIVI.md`. Rappels utiles aux parcours :
- **Nommage** (`SUIVI.md` § 3.1) : `objet_action`, en `snake_case`, en français sans accent, 50 caractères au plus, au participe passé.
- **Où Umami tourne** (`SUIVI.md` § 2.6) :
  - la vitrine et les écrans de l'application, en usage anonyme, sans `identify()`, sans identifiant dans l'URL ni dans le titre ;
  - la vue du propriétaire.
- **Où rien ne tourne** : les liens de visite partagés (`/v/‹jeton›`), les pages prospects, les intégrations (`/i/‹jeton›`), les e-mails. On n'y tient que des compteurs agrégés (`partage_ouvert`, `integration_ouverte`) et le détail d'un prospect qui l'accepte.
- **Provenance sans traceur.** Les pages de destinataire mènent à `/offert` (particulier) et `/pro/decouvrir` (pro), pages identiques pour tous et sans jeton. Le clic est compté par `partage_cta_clique` (C) ; les arrivées, par Umami.
- **Source de vérité** : le journal `evenements`, écrit par le serveur dans la même transaction que le fait qu'il décrit.

### 1.5 Accessibilité et mobile : le socle

**Accessibilité : WCAG 2.2 niveau AA** (`MARQUE.md` § 10).
- **Clavier.** Tout se fait au clavier, dépôt compris : la zone est un `label` avec son `input`, et Entrée ou Espace ouvre le sélecteur. Focus visible de 2 px en Bleu plan, lien d'évitement, ordre logique.
- **Formulaires.**
  - Étiquettes visibles.
  - Erreurs liées au champ (`aria-describedby`) et résumées en haut du formulaire.
  - `autocomplete="email"` ; `inputmode="numeric"` et `autocomplete="one-time-code"` pour un code ; `inputmode="decimal"` pour la cote.
- **États annoncés.**
  - Résultats d'analyse, erreurs et changements d'étape en `aria-live="polite"`.
  - Les phrases de chantier ne sont pas annoncées : elles sont décoratives.
  - La barre a `role="progressbar"` et `aria-valuenow`.
- **Volets et fenêtres.** Focus piégé tant qu'ils sont ouverts, Échap pour fermer, retour du focus sur le déclencheur.
- **Mouvement réduit** (`prefers-reduced-motion`). Pas de pulsation ni de fondu ; la barre avance par paliers. C'est un écart actuel de l'accueil (`MARQUE.md` § 6.9).
- **Jamais la couleur seule.** Étapes par la forme, écarts de surface par un libellé, cadenas par une icône et un texte.
- **Équivalent de la 3D** : plan 2D, tableau des surfaces avec en-têtes, photos avec le nom de la pièce en texte alternatif (`MARQUE.md` § 10.2).
- **Zoom et largeur.** Aucune perte à 200 % de zoom, ni à 320 px de large. Texte de 11 px au moins.
- **Délais.** Aucun délai imposé sans moyen de le prolonger : un lien de connexion expiré se renvoie en un clic.
- **E-mails** : une version texte, un seul bouton, le mot-symbole en image avec son texte alternatif (`MESSAGES.md` § 7.11).

**Mobile d'abord pour le particulier et le prospect.**
- Marges latérales de 16 px, aucun défilement horizontal.
- Action principale collée en bas de l'écran (respect de `safe-area-inset-bottom`) sur l'accueil après le premier écran, l'aperçu, la commande et la page prospect.
- Cibles tactiles de 40 px au moins. Champs en 16 px au moins, pour éviter le zoom automatique d'iOS.
- Volets en feuilles montantes (« bottom sheets »).
- **Navigateurs intégrés** (Instagram, Facebook, LinkedIn), fréquents après une publicité :
  - la connexion Google y est souvent bloquée par Google (non revérifié) ;
  - le lien de connexion s'ouvre dans un autre navigateur, qui ne voit pas le même stockage.

  On y masque donc le bouton Google, on met en avant le **code à 6 chiffres** (A5), et le dépôt est gardé **côté serveur** (A3), pas seulement dans le navigateur.
- **Réseau faible.** L'envoi reprend depuis la copie locale. La visite pèse environ 3 Mo par ouverture (`recherche/hebergement.md` § 1) ; poids à remesurer avec la maquette compressée et l'éclairage précalculé (L4-10, L4-14).
- **La visite se calcule dans le navigateur du client** (D5) : sa compatibilité et sa **fluidité sur un appareil modeste** (portable d'entrée de gamme, téléphone) font partie du produit (décision n° 12). Qualité adaptative (L4-12) ; fichiers précalculés par le serveur (éclairage, maquette compressée, itinéraires ; L4-13, L4-14) ; pas de rendu en direct sur le serveur (coût). Seuils chiffrés : L1-14. Sans WebGL ou après une perte de contexte, repli sur la galerie, le plan 2D et la fiche, avec `erreur.3d`, jamais d'écran noir (L4-10).

### 1.6 Cas limites du dépôt (communs à A, B et C)

Détection : **N** = dans le navigateur, avant l'envoi ; **A** = analyse serveur sans IA, avant le compte ; **Q** = qualification (environ 0,02 $), après le compte et avant toute réservation. Dans tous les cas, **rien n'est décompté**.

| Cas | Où | Message (`MESSAGES.md`) | Suite | Événement (`SUIVI.md`) |
|---|---|---|---|---|
| Fichier vide | N | `depot.refus.vide` | Nouveau dépôt | `depot_fichier_refuse` (`fichier_vide`) |
| Plus de 40 Mo | N | `depot.refus.lourd`. **À ajouter** : « S'il s'agit de la plaquette entière, gardez seulement la page du plan : ouvrez-la, puis Imprimer, Enregistrer en PDF. » | Nouveau dépôt | `depot_fichier_refuse` (`trop_lourd`) |
| Plusieurs fichiers déposés d'un coup | N | **À ajouter** : « Un plan à la fois : nous prenons le premier, ‹nom›. » | On garde le premier. Les imports multiples sont réservés aux promoteurs (C4) | valeur `plusieurs_fichiers` **à ajouter** |
| Photo HEIC (iPhone) | N ou A | **À ajouter** si la conversion échoue : « Cette photo est au format iPhone (HEIC). Faites une capture d'écran du plan, ou exportez-la en JPG. » (texte proche de `serveur.py`) | Deux pistes, **à vérifier sur iPhone** : (1) un attribut `accept` limité à PDF, JPG, PNG et WebP, pour qu'iOS convertisse en JPG à la sélection ; (2) une conversion côté serveur | `depot_fichier_refuse`, valeur `heic` **à ajouter** |
| Format inconnu (DWG, DXF, ZIP, Word…) | N | `depot.refus.format` | Nouveau dépôt | `depot_fichier_refuse` (`format_inconnu`) |
| PDF protégé par un mot de passe | A | `depot.refus.protege` | Nouveau dépôt | `plan_analyse` (`refuse`, `pdf_protege`) |
| PDF endommagé ou sans page lisible | A | `depot.refus.abime` | Nouveau dépôt | `plan_analyse` (`pdf_endommage`, `pdf_sans_page`) |
| Image trop petite (moins de 700 px sur le petit côté) | A | `depot.refus.petit` | Nouveau dépôt | `plan_analyse` (`image_trop_petite`) |
| Murs ou tracés non reconnus | A | `depot.refus.illisible` | Nouveau dépôt | `plan_analyse` (`trace_non_reconnu`) |
| Plusieurs pages | A | **À ajouter** : « Le PDF compte ‹5› pages : la page ‹3›, la plus détaillée, sera lue. » + <Choisir une autre page> | Vignette de la page retenue ; la règle de choix reste celle d'`extract.py`. Des pages qui forment les niveaux d'un même logement sont empilées, pas choisies : un duplex est lu en entier ; refus `depot.refus.niveaux` au-delà de `niveaux_max = 2` | `page_pdf_changee` (N) **à ajouter** |
| Plus de deux niveaux | A ou Q | `depot.refus.niveaux` et formulaire « Me prévenir si cela change » (`MESSAGES.md` § 7.1) | Arrêt. Depuis le 27/09/2026, la chaîne traite les plans sur plusieurs niveaux (niveaux détectés et nommés, pages d'un même logement empilées, arrêt avant la lecture payante si les niveaux ne se séparent pas ; L13-08, fait). En production, `niveaux_max = 2` : duplex acceptés (décision 11), refus au-delà (L4-08) ; le triplex s'ouvre quand un plan réel de triplex a été validé. Le refus dit « plus de deux niveaux » (`MESSAGES.md` § 7.1) | `plan_analyse` ou `plan_qualifie` (`plusieurs_niveaux`) ; `alerte_prise_en_charge_demandee` |
| Maison | Q | `depot.refus.maison` | Idem | valeur `maison` **à ajouter** à `motif_refus` |
| Plusieurs logements sur la page, ou PDF de plusieurs lots | Q | `depot.refus.plusieurs_lots` | Nouveau dépôt. Aujourd'hui, l'analyse empilerait ces lots comme des niveaux : la qualification les refuse (L6-02). Seul l'import promoteur découpe un PDF de plusieurs lots (C4, L10-02) (R17) | valeur `plusieurs_lots` **à ajouter** |
| Perspective, croquis | Q | `depot.refus.perspective` | Nouveau dépôt | `plan_qualifie` (`pas_un_plan`) |
| Autre chose qu'un plan | A ou Q | `depot.refus.pas_un_plan` + vignette d'un bon plan (appartement témoin fictif) | Nouveau dépôt | `plan_qualifie` (`pas_un_plan`) |
| Plan peu lisible (photo de biais, scan pâle) | Q | **À ajouter** : « Plan peu lisible : le résultat risque d'être moins précis. » + [ Déposer un meilleur fichier ] et [ Continuer avec ce plan ]. Conseil : « posez le plan à plat et photographiez-le d'aplomb » | **L'utilisateur choisit** | `plan_qualifie`, valeur `peu_lisible` **à ajouter** |
| Aucune cote lisible, ou échelle incertaine | A | `depot.reconnu.image`, puis `echelle.*` | Calibration (A8), avant toute lecture payante | `plan_analyse` (`a_calibrer`) |
| Plan déjà déposé dans le même compte | A | **À ajouter** : « Vous avez déjà déposé ce plan. » + [[ Ouvrir ce plan ]] | Aucune seconde lecture dans la même organisation (`ARCHITECTURE.md` § 5.7) | `depot_doublon` (S) **à ajouter** |
| Plan qui a déjà servi pour un plan offert, dans un autre compte | A | `erreur.offert_meme_plan`. **À ajouter** : « Si un proche l'a déposé, demandez-lui son lien d'aperçu. » | Reconnu par l'empreinte du fichier **ou** par celle de la page rendue (R22, L6-06). [[ Obtenir la visite · 29 € ]] (`depot.reconnu.bouton_payant`) une fois la vente ouverte ; pendant la bêta, variante sans achat (R13). On ne dit jamais qui l'a déposé | `credit_offert_refuse` (`plan_deja_offert`) |
| Coupure réseau pendant l'envoi | N | `erreur.connexion`. **À ajouter** : « L'envoi reprend dès que la connexion revient. » | Reprise depuis IndexedDB | `depot_envoi_echoue` (`reseau`) |
| Analyse plus longue que prévu (plus de 30 s) | A | **À ajouter** : « L'analyse prend plus de temps que d'habitude. Vous pouvez laisser votre e-mail : nous vous écrivons. » | La tâche continue, avec délai et limite de mémoire (`recherche/audit-code.md` A10) | `plan_analyse` (`duree_ms`) |

---

## 2. Parcours A : particulier

### 2.0 Vue d'ensemble

```
Arrivée : publicité, recherche, lien partagé par un proche, code offert,
          invitation à la bêta fermée
   |
   v
A2  Dépôt du plan  --refus immédiat (poids, format)-->  message, rien n'est envoyé
   |  fichier gardé dans le navigateur (IndexedDB) et dépôt provisoire de 24 h
   v
A3  Analyse sans IA  --refus motivé-->  message, e-mail facultatif, rien n'est dépensé
   |  « Plan reconnu »
   v
A4  [[ Lancer mon plan offert ]]  ->  Google ou e-mail, 2 cases, pas de carte
   v
A5  E-mail vérifié (lien ou code à 6 chiffres)
   v
A6  Qualification (environ 0,02 $)  --refus-->  rien de décompté, le plan offert reste
   |        \--échelle à caler-->  A8 Calibration  --> retour ici
   v
    réservation du plan offert
   v
A7  Chantier : on peut fermer, un e-mail prévient  --échec-->  A15 : rien de décompté
   |  vérification avant livraison réussie, puis images en direct :
   |  vue du dessus 3D découpée  ->  plan 2D coté  ->  2 photos
   v
A9  Aperçu gratuit (images seulement), publié dès la vue du dessus et le plan 2D
   |  plan offert consommé à cette publication ; photo en échec omise, sans blocage
   |  ->  A13 lien d'aperçu pour les proches (30 j)
   v
A10 Verrou  ->  volet « Ce logement · 29 € » ou « Comparer 3 lots · 59 € »
   |  (bêta fermée : volet sans achat, le parcours s'arrête là)
   v
A11 Commande : 2 cases, « Payer 29,00 € TTC »  ->  paiement (dès L8-07)
   v
A12 Visite débloquée, sans nouvelle lecture  ->  A13 partage  ->  A14 plan suivant
```

**Tickets du parcours A.** Dépôt et compte : L5-23, L6-01, L5-03. Qualification : L6-02. Calibration : L6-04. Plan offert et anti-abus : L6-06, L5-09. Attente et images : L6-03, L5-11, L4-09, L5-10. Aperçu : L6-05, L5-12. Partage : L6-08, L5-13. Mes plans : L6-07. Défauts : L6-09. Paiement et déblocage : L8-01 à L8-03. Tests de prix : L8-06. Bêta : L6-10 ; ouverture publique : L8-07.

**Pendant la bêta fermée (lot 6, R13).**
- **Accès** : le dépôt est réservé aux invités, par un **code d'invitation**. La vitrine reste en liste d'attente (L2-12) ; l'application reste en `noindex` (R20). **Proposition** : le code se saisit sur l'écran des codes (D1) ou arrive prérempli dans le lien de l'invitation (L6-10).
- **Offre** : une variante « bêta » du catalogue (L5-08) donne un plan complet ou un aperçu, selon la décision de L0-04 (§ 8.3, question 4).
- **Aucun achat** : aucun écran ni message ne propose 29 € avant le lot 8. Le volet de A10 décrit ce que débloque la visite, sans bouton de paiement (texte du catalogue à ajouter, L6-05) ; les refus du plan offert (A4, § 1.6) ont une variante sans achat (L6-06). A11 n'existe pas.
- **Pas de test de prix** : il n'y a rien à vendre (§ 7.1).
- Ouverture à tous et vente : L8-07.

### A1. Arrivée

| Entrée | Page d'arrivée | Particularités |
|---|---|---|
| Publicité (réseaux sociaux, Google) | Accueil (`MESSAGES.md` § 1), ou un guide par moment d'achat (§ 11) | Aucun bandeau de consentement tant qu'Umami est en réglage minimal exempté ; il arrive dès que des traceurs non exemptés sont activés : UTM enrichis, relecture de session, publicité (R18, L7-02, confirmé en L0-05). Navigateurs intégrés (§ 1.5). Publicité : lot 12, après l'ouverture |
| Recherche | Guides : rétractation, visite cloisons, TMA, « transformer un plan 2D en 3D » (`MESSAGES.md` § 11, `recherche/marche.md` § 3.2) | Dépôt en haut de chaque guide ; contenu sans conseil juridique ; renvoi au notaire ou à l'ADIL |
| Lien partagé par un proche | Page du destinataire (A13), puis `/offert` | Aucun traceur sur la page de visite |
| Page prospect d'un conseiller | Seulement la signature « Visite réalisée avec Sur Pièce » (`prospect.signature`), vers `/pro/decouvrir` | **Proposition** : pas d'invitation « plan offert » sur la page d'un conseiller, c'est sa page. Écart avec la valeur `prospect` de `partage_cta_clique` (§ 8.2) |
| Code offert par un partenaire | Page co-marquée (D1) | Pas de paiement, donc pas de case de renonciation |
| Invitation à la bêta fermée | Lien de l'e-mail d'invitation, code d'invitation (L6-10) | Seule entrée vers le dépôt avant L8-07 (R13) |
| Accès direct, bouche-à-oreille | Accueil | Pendant la bêta : liste d'attente (L2-12) |

**Objectif.** En 5 secondes, le visiteur comprend ce que c'est, ce qui est offert, ce que coûte la visite et ce qui n'est pas pris en charge ; puis il dépose son plan.

**Friction à éviter.**
- Mur d'inscription, fenêtre surgissante, vidéo lourde.
- Bandeau qui couvre la zone de dépôt.
- Lien vers la visite témoin plus visible que le dépôt : il reste secondaire.
- Titre générique « visite virtuelle » : les acquéreurs cherchent « transformer mon plan en 3D » (`recherche/marche.md` § 3.2).

**Textes clés** : `MESSAGES.md` § 1.1 (surtitre, titre retenu « Visitez votre futur appartement, d'après son plan de vente. » et ses trois variantes à tester par périodes, sous-titre, zone de dépôt, trois assurances, limites, lien vers le témoin `/appartement-temoin`, R9). Page d'accueil : L2-04 ; page du témoin : L2-09.

**Proposition (écart avec `MESSAGES.md` § 1.1).** Dire dans le premier écran ce que contient le plan offert et le prix de la visite, avec le contenu de R1 :
> « Premier plan offert, sans carte bancaire : vue du dessus 3D, plan 2D coté et 2 photos. La visite s'ouvre ensuite pour 29 €. »

Sans cette phrase, « premier plan offert » peut se lire « visite offerte ». La déception viendrait au verrou, et le risque de pratique trompeuse avec. Cette phrase n'apparaît qu'à l'ouverture de la vente (L8-07) ; pendant la bêta, la vitrine est en liste d'attente et ne cite aucun prix (R13).

**Mesure.** Page vue (N) ; `cta_depot_clique` (N) ; `cta_demo_clique` (N) puis `demo_ouverte` (N, moteur) ; `consentement_enregistre` (S), seulement si le bandeau existe.

**Cas limites.**
- Visiteur pro sur l'accueil : lien « Vous vendez du neuf ? » dans l'en-tête et le pied de page (`MESSAGES.md` § 8.1 et § 8.2).
- Visiteur qui a un plan sur plus de deux niveaux : la limite est lue **avant** le dépôt.
- Retour d'un visiteur dont le fichier est encore dans le navigateur : bandeau « Vous aviez déposé ‹nom du fichier›. [ Reprendre ] <Retirer> » (**à ajouter**).

**Accessibilité et mobile.**
- Sur mobile, la zone de dépôt est visible sans défiler. Après le premier écran, « Importer mon plan » reste collé en bas (`MESSAGES.md` § 1.1).
- Le bandeau de consentement, s'il existe, a deux boutons de même style, même taille et même place, et ne recouvre pas la zone de dépôt (`MARQUE.md` § 10.2).

Maquette de l'accueil, sur ordinateur, après l'ouverture de la vente :

```
+------------------------------------------------------------------------+
| SUR PIÈCE                    <Appartement témoin>  <Pro>  <Connexion>  |
+------------------------------------------------------------------------+
| PLAN DE VENTE → VISITE 3D                                              |
| Visitez votre futur appartement, d'après son plan de vente.            |
| Déposez le plan de vente de votre appartement neuf. En ‹délai›, vous   |
| obtenez le plan 2D coté, la maquette 3D, la visite et les photos.      |
|                                                                        |
|  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -   |
|                 Glissez votre plan de vente ici                        |
|   PDF du promoteur de préférence · PNG, JPG ou WebP · 40 Mo au plus    |
|                     [[ Importer mon plan ]]                            |
|  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -   |
|  Premier plan offert, sans carte bancaire : vue du dessus 3D, plan     |
|  2D coté et 2 photos. La visite s'ouvre ensuite pour 29 €. (proposit.) |
|  Votre plan reste privé : ni publié ni transmis à votre promoteur.     |
|  Rien n'est décompté si la visite ne peut pas être produite.           |
|  Un ou deux niveaux (duplex) · logement vide, finitions supposées ·    |
|  non contractuel                                                       |
|                                                                        |
|  ------------------   ------------------   ------------------          |
|  PDF du promoteur     Capture ou photo     Vérifié avant livraison     |
|  Murs, cotes et       Une cote connue      Chaque visite est parcourue |
|  échelle lus dans     cale l'échelle :     automatiquement : défauts   |
|  le fichier.          5 à 10 cm d'écart.   visibles recherchés.        |
|                                                                        |
|  <Visiter d'abord l'appartement témoin →>                              |
+------------------------------------------------------------------------+
| Vous vendez du neuf ? <Sur Pièce Pro>   <Méthode> <CGU> <Vos données>  |
+------------------------------------------------------------------------+
```

Sur mobile :

```
+------------------------------------+
| SUR PIÈCE                  <Menu>  |
+------------------------------------+
| Visitez votre futur appartement,   |
| d'après son plan de vente.         |
|  - - - - - - - - - - - - - - - -   |
|   Choisissez votre plan de vente   |
|   [[ Importer mon plan ]]          |
|   PDF, PNG, JPG ou WebP · 40 Mo    |
|  - - - - - - - - - - - - - - - -   |
| Premier plan offert, sans carte :  |
| vue du dessus 3D, plan coté et     |
| 2 photos. La visite : 29 € ensuite.|
| Un ou deux niveaux (duplex) ·      |
| logement vide · non contractuel    |
| <Où trouver le plan de vente ?>    |
| <Visiter l'appartement témoin>     |
+------------------------------------+
```

### A2. Dépôt du plan, dans le premier écran

**Objectif.** Le fichier est choisi en un geste, avec un retour immédiat.

**Friction à éviter.**
- Aucun compte, aucun formulaire, aucune question sur le lot avant le dépôt.
- Aucun envoi pour rien : poids, type et fichier vide sont vérifiés dans le navigateur, sur les premiers octets comme le fait le serveur (`format_fichier`).

**Déroulé.**
1. Le fichier est choisi : glisser-déposer, clic, ou sélecteur du téléphone (Photos, Fichiers, appareil photo, scan).
2. Contrôles dans le navigateur (§ 1.6).
3. Copie dans **IndexedDB** et empreinte SHA-256 du fichier calculée dans le navigateur (A3). L'empreinte de la page rendue est calculée par l'analyse serveur (R22).
4. Envoi direct au dépôt provisoire par URL signée, avec une barre d'envoi.

**Textes clés.**
- `depot.zone.titre`, `depot.zone.titre_mobile`, `depot.zone.aide`, `depot.zone.bouton`, `depot.zone.survol`, `depot.envoi`, `depot.analyse`.
- **À ajouter** : l'aide dépliable « Où trouver le plan de vente ? En général dans les documents de votre réservation, ou dans l'e-mail du promoteur ou de votre conseiller. Le PDF d'origine donne le meilleur résultat. »
- **À ajouter**, sous la zone, en complément de l'assurance de `MESSAGES.md` § 1.1 : « Sans suite de votre part, il est effacé sous 24 h. »

**Mesure.**
- `depot_fichier_choisi` (N), avec `format_fichier`, `taille` et `methode`.
- `depot_fichier_refuse` (N), `depot_envoi_termine` (N), `depot_envoi_echoue` (N).
- `depot_provisoire_recu` (S) à la réception ; `plan_depose` (S), avec `connecte` = faux, au rattachement au compte (`SUIVI.md` § 3.6).

**Cas limites.** Voir § 1.6.

**Accessibilité et mobile.**
- La zone de dépôt est un `label` qui contient l'`input`, utilisable au clavier. Le glisser-déposer n'est jamais obligatoire.
- La barre d'envoi est annoncée.
- Sur mobile, la zone prend toute la largeur ; le bouton fait 48 px de haut.

### A3. Fichier gardé dans le navigateur et analyse sans IA : « Plan reconnu »

**Objectif.** Prouver en quelques secondes que le plan est compris, avant de demander quoi que ce soit.

**Ce qui est gardé dans le navigateur (IndexedDB).**
- Le fichier, son nom, son poids, son empreinte, la référence du dépôt provisoire et le résultat de l'analyse.
- **À quoi ça sert.**
  - Rien n'est perdu si l'onglet est rechargé, si l'utilisateur part lire ses e-mails, ou si le dépôt provisoire a expiré.
  - L'envoi reprend en cas de coupure.
  - Le fichier n'est pas renvoyé deux fois.
- **Purge.**
  - Dès que le plan est rattaché à un compte.
  - Sur <Retirer ce plan>.
  - Au plus tard après 7 jours. Safari efface de lui-même, à peu près au même terme, le stockage d'un site sans interaction récente (règle de WebKit, non revérifiée).
- **Navigation privée.** Le stockage peut être refusé ou éphémère : le parcours marche quand même, tant que l'onglet reste ouvert.
- **Traceurs.** C'est un stockage **strictement nécessaire au service demandé** : garder le fichier que l'utilisateur vient de déposer. Il est donc exempté de consentement, comme un panier. À confirmer avec l'avocat (§ 8.3).

**Ce qui est gardé côté serveur (dépôt provisoire).**
- Le fichier reçu par URL signée, dans un espace privé, **effacé au bout de 24 h** s'il n'est rattaché à aucun compte.
- C'est ce qui permet de continuer sur un autre appareil ou dans un autre navigateur, par exemple quand le lien de connexion s'ouvre hors du navigateur intégré d'Instagram.
- `SUIVI.md` le prévoit (`depot_provisoire_recu`, puis `plan_depose` avec `connecte` = faux) ; `ARCHITECTURE.md` § 2.3 (étape 1) et § 4.2 (`depots_provisoires`) aussi (L5-23).

**Analyse sans IA** (travail `analyse` actuel : format, pages, murs, échelle, niveaux, empreinte ; dépôt provisoire et analyse anonyme : L5-23).
- Deux empreintes sont gardées : celle du fichier et celle de la page lue, rendue à résolution fixe. Un PDF réenregistré change la première, pas la seconde (R22, L6-06).
- Elle tourne dans un sous-processus limité en temps et en mémoire.
- Elle est limitée à 10 analyses par heure et par adresse IP (valeur de départ).
- **Aucun appel payant avant le compte.**
- Sa durée sur les plans de référence est à mesurer (T0).

**Écran « Plan reconnu ».**
- Vignette de la page lue. C'est le plan de l'utilisateur, montré à lui seul.
- Résultat : `depot.reconnu.titre`, puis `depot.reconnu.pdf` ou `depot.reconnu.image`.
- Pages, **à ajouter** : « Le PDF compte ‹5› pages : la page ‹3›, la plus détaillée, sera lue. <Choisir une autre page> ».
- Ce que contient le plan offert (R1), et le prix de la visite (même phrase qu'à l'accueil). Pendant la bêta, sans prix (R13).
- Action : [[ Lancer mon plan offert ]] (`depot.reconnu.bouton_offert`) ; secondaire : <Changer de fichier> (`depot.reconnu.changer`) ; limites (`depot.reconnu.limites`).

**Mesure.** `plan_analyse` (S), avec `resultat`, `motif_refus`, `vectoriel`, `echelle` et `duree_ms` ; `page_pdf_changee` (N, **à ajouter**).

**Cas limites.**
- Onglet fermé pendant l'analyse : au retour, la copie locale relance l'analyse, ou affiche le résultat s'il est déjà connu.
- Dépôt provisoire expiré : renvoi silencieux depuis la copie locale.
- Plan déjà offert : voir § 1.6.

**Accessibilité et mobile.**
- Le résultat est annoncé.
- La vignette a pour texte alternatif « Page ‹3› du plan déposé ».
- Le choix de page se fait par une liste de vignettes, avec des boutons radio.
- Sur mobile, l'action est collée en bas de l'écran.

```
+------------------------------------------------------------------------+
| SUR PIÈCE                                                <Connexion>   |
+------------------------------------------------------------------------+
|  +------------------+   Plan reconnu                                   |
|  | ~~~~~~~~~~~~~~~~ |   PDF du promoteur : murs, cotes et échelle      |
|  | ~~ page 3/5 ~~~~ |   seront lus dans le fichier.                    |
|  | ~~~~~~~~~~~~~~~~ |   Le PDF compte 5 pages : la page 3, la plus     |
|  +------------------+   détaillée, sera lue. <Choisir une autre page>  |
|                                                                        |
|  Votre plan offert contient :                                          |
|  - la vue du dessus de la maquette 3D et 2 photos ;                    |
|  - le plan 2D coté et les surfaces, comparées au tableau du promoteur ;|
|  - les points à faire confirmer par votre promoteur.                   |
|  La visite s'ouvre ensuite pour 29 €, sans nouvelle attente.           |
|                                                                        |
|  [[ Lancer mon plan offert ]]     <Changer de fichier>                 |
|  Appartements sur un ou deux niveaux (duplex) · logement présenté      |
|  vide, finitions supposées · illustration non contractuelle.           |
+------------------------------------------------------------------------+
```

### A4. Création de compte, au moment où l'intention est la plus forte

**Objectif.** Créer le compte juste après « Plan reconnu », en un champ et deux cases, en moins de 30 secondes (objectif de conception, pas une mesure).

**Friction à éviter.**
- Mot de passe, nom, téléphone, carte bancaire.
- Nouvelle page : un volet s'ouvre sur la même page, et le plan reste visible derrière.

**Contenu du volet** (`MESSAGES.md` § 7.3, `OFFRES.md` § 2.1 et § 2.5, `recherche/auth-paiement.md` § 1.5) :
1. `compte.titre` et `compte.texte`.
2. Deux cases, **non cochées**, placées **avant** les boutons pour valoir aussi pour Google :
   - `compte.cgu`, avec `compte.confidentialite` en simple lien ;
   - la **case d'écart consenti**, séparée des CGU (L224-25-14 III), texte de `MESSAGES.md` § 7.3.
3. `compte.google` ; `compte.ou` ; `compte.email.label` et `compte.email.bouton` ; `compte.email.aide`.
4. **À ajouter**, en petit mais lisible : « Un plan offert par personne et par plan, à lancer sous 30 jours. Pas de carte bancaire. »
5. Cloudflare Turnstile en mode « géré » : invisible dans la plupart des cas.

**Question facultative « Où en êtes-vous ? ».** `MESSAGES.md` § 7.3 et `OFFRES.md` § 2.1 la placent dans ce volet. **Proposition** : la déplacer sur l'écran d'attente (A7), où l'attention est libre, pour que l'inscription garde un champ et deux cases. À trancher par le levier L3 (§ 7.2).

**Textes d'erreur** : `erreur.cases`, `erreur.email_invalide`, `erreur.email_jetable`, `erreur.verification_humain`, `erreur.google`, `erreur.offert_deja_utilise`.
- **À ajouter** : « Vouliez-vous dire ‹…@gmail.com› ? [ Corriger ] » (liste fermée de domaines courants, dans le navigateur).
- Adresse déjà connue : **même réponse** que pour une adresse nouvelle, avec le même délai, pour éviter l'énumération des comptes (`ARCHITECTURE.md` § 6.8). L'e-mail reçu, lui, dit « Connectez-vous ».

**Mesure.**
- `inscription_ouverte` (N), avec `contexte` = `lancement_plan`.
- `inscription_methode_choisie` (N), avec `methode`.
- `formulaire_refuse` (N) et `erreur_affichee` (N), avec leur code.
- `credit_offert_refuse` (S), avec son `motif`.
- Les acceptations vont dans la table `acceptations` (document, version, horodatage), pas dans le journal.

**Cas limites.**
- Plus de 3 plans offerts depuis la même adresse IP en 24 h : l'inscription passe ; le lancement est **différé**, pas refusé (A6).
- Compte Google dont l'adresse a déjà reçu un plan offert : l'inscription passe ; au lancement, `erreur.offert_deja_utilise` et [[ Obtenir la visite · 29 € ]] une fois la vente ouverte. Pendant la bêta, variante sans achat (R13, L6-06).
- Bêta fermée : le dépôt, donc ce volet, n'est accessible qu'avec un code d'invitation valide (R13, L6-10).
- Navigateur intégré : bouton Google masqué, code à 6 chiffres mis en avant (A5).
- Méthodes de connexion : lien magique et Google supposés ici ; le choix du fournisseur reste ouvert (D8, L0-02, L5-03).

**Accessibilité et mobile.**
- Tout le texte d'une case est cliquable, et la cible fait au moins 40 px de haut.
- Le texte de l'écart consenti est affiché en entier, pas replié : un consentement doit être lisible.
- Sur mobile, le volet monte depuis le bas ; le clavier ne masque ni le champ ni le bouton.

```
+------------------------------------------------------------------------+
|  Où vous prévenir quand c'est prêt ?                        [ Fermer ] |
|  Comptez ‹délai›. On vous écrit dès que votre plan est prêt, et vous   |
|  le retrouvez dans votre compte.                                       |
|                                                                        |
|  [ ] J'accepte les <conditions générales d'utilisation>.               |
|      Comment nous utilisons vos données : <politique de                |
|      confidentialité>.                                                 |
|  [ ] J'ai compris que la visite et les photos sont des illustrations   |
|      produites automatiquement à partir du plan de vente. Les          |
|      dimensions sont reprises du plan quand il les indique, estimées   |
|      sinon. Hauteurs, matériaux, couleurs, vues et lumière sont        |
|      fictifs ; le logement est présenté vide et certains équipements   |
|      peuvent être simplifiés. Elles ne remplacent pas les plans et la  |
|      notice annexés à mon contrat de vente.                            |
|                                                                        |
|  [ Continuer avec Google ]                                             |
|  ou                                                                    |
|  Votre e-mail [ vous@exemple.fr                  ]                     |
|  [[ Recevoir mon lien de connexion ]]                                  |
|  Pas de mot de passe : un lien de connexion arrive dans votre boîte.   |
|  Un plan offert par personne et par plan, à lancer sous 30 jours.      |
+------------------------------------------------------------------------+
```

### A5. Vérification de l'e-mail

**Objectif.** L'e-mail est vérifié sans perdre le fil, sur le même appareil ou un autre.

**Friction à éviter.**
- Le lien s'ouvre dans un autre navigateur que celui du dépôt.
- L'e-mail arrive en retard ou dans les indésirables.
- L'utilisateur doit refaire le dépôt.

**Écran d'attente, dans l'onglet d'origine** : `compte.envoye.titre`, `compte.envoye.texte`, `compte.envoye.renvoyer`, `compte.envoye.changer`, `compte.envoye.pas_recu`.

**Code à 6 chiffres, à ajouter** au catalogue (`compte.envoye` et E1). `recherche/auth-paiement.md` § 1.5 le prévoit dans le même e-mail que le lien :
- à l'écran : « Vous pouvez aussi saisir ici le code à 6 chiffres du même e-mail : [ _ _ _ _ _ _ ] » ;
- dans E1 : « Ou saisissez ce code : ‹482 913›. »

C'est le chemin sûr quand le lien s'ouvre ailleurs : navigateur intégré, autre appareil.

**E-mail E1** : un seul bouton, pas de pixel. Son texte « Vous n'avez rien demandé ? Ignorez cet e-mail : sans clic, rien ne se passe. » protège aussi la personne dont on aurait saisi l'adresse.

**Après la confirmation.**
- **Même navigateur** : l'onglet qui s'ouvre montre le chantier. L'onglet d'origine le voit aussi, par la session partagée, et passe au chantier.
- **Autre appareil** : l'appareil où l'on a cliqué reçoit la session et montre le chantier. L'onglet d'origine affiche, **à ajouter** : « Confirmé sur un autre appareil. Pour suivre ici, saisissez le code reçu. »
- **L'onglet d'origine ne reçoit jamais la session sans le code.** Sinon, quelqu'un qui tape l'adresse d'un autre obtiendrait sa session dès que l'autre clique.

**Mesure.**
- `lien_magique_envoye` (S), `lien_magique_refuse` (S).
- `compte_cree` (S) ; `session_ouverte` (S) pour un compte existant.
- Propriété `meme_appareil` (`oui`, `non`, `inconnu`) **à ajouter** à `compte_cree`, pour le levier L2.

**Cas limites.**
- Lien expiré ou déjà utilisé : `erreur.lien_connexion`.
- Code faux : 5 essais, puis nouveau lien (`ARCHITECTURE.md` § 6.3).
- Dépôt provisoire expiré avant la confirmation (plus de 24 h) : renvoi depuis la copie locale si l'appareil l'a encore. Sinon, **à ajouter** : « Déposez à nouveau votre plan : il a été effacé au bout de 24 h, comme prévu. »

**Accessibilité et mobile.**
- Le code se saisit dans un seul champ, collage accepté, avec `autocomplete="one-time-code"`.
- Les changements d'état sont annoncés.
- Le renvoi est limité (5 par heure et par adresse, `ARCHITECTURE.md` § 6.4), et le texte dit quand il redevient possible.

```
+------------------------------------------------------------------------+
|  Vérifiez votre boîte e-mail                                           |
|  Nous avons envoyé un lien de connexion à vous@exemple.fr. Il est      |
|  valable ‹15› minutes. Votre plan démarre dès que vous cliquez.        |
|                                                                        |
|  Vous pouvez aussi saisir ici le code à 6 chiffres du même e-mail :    |
|  [ _ _ _ _ _ _ ]   [[ Valider ]]                         (à ajouter)   |
|                                                                        |
|  Rien reçu ? Regardez dans vos indésirables, ou continuez avec Google. |
|  [ Renvoyer le lien ] (actif après 60 secondes) · <Changer d'adresse>  |
+------------------------------------------------------------------------+
```

### A6. Lancement : qualification bon marché, refus sans rien décompter

**Objectif.** Ne consommer le plan offert que pour un plan qui a toutes les chances d'aboutir.

**Déroulé, automatique après la vérification**, sans nouveau clic, puisque l'intention a été donnée en A4 :
1. Le dépôt provisoire est rattaché au compte, sans renvoi du fichier.
2. Contrôles anti-abus (L6-06) : 1 plan offert par e-mail normalisé, par compte Google, et par plan, reconnu par l'empreinte du fichier **ou** par celle de la page rendue (R22) ; 3 par adresse IP et par 24 h (`OFFRES.md` § 2.2).
3. Qualification (L6-02), pour environ 0,02 $, sur la clé OpenRouter « gratuit », qui ne sert qu'au plan offert des particuliers (R23, L5-09).
4. Si l'échelle manque : calibration (A8), **avant** la réservation.
5. Réservation du plan offert (−1 au grand livre, L5-07), création du travail, puis chantier (A7) et e-mail E2. La réservation n'est pas une consommation : le plan offert n'est consommé qu'à la publication de l'aperçu (R2).

**Plafond IA** : 3 $ par plan, toutes passes et relances confondues (R6, L4-02, L5-09). Au-delà, échec sans rien décompter (A15).

**Écart proposé avec `OFFRES.md` § 6.4** (réservation « au lancement, qualification réussie »). Quand une calibration est nécessaire, la réservation n'a lieu qu'une fois la cote validée. Un plan n'est ainsi jamais bloqué pendant que l'utilisateur cherche une cote. E5 le dit déjà : « Rien n'a été décompté. Votre plan démarre dès que la cote est validée. »

**Textes clés.**
- Refus à la qualification : clés `depot.refus.*` (§ 1.6), qui finissent par « Rien n'a été décompté. »
- Plan peu lisible : choix laissé à l'utilisateur (§ 1.6, **à ajouter**).
- Plafond du jour atteint (`OFFRES.md` § 8.8, L5-09, puis L8-09) : `attente.plafond_jour` et `attente.plafond_jour.lien`.
- Limite par adresse IP : `attente.limite_connexion`.
- Plan offert non lancé sous 30 jours : `erreur.offert_expire`.

**Mesure.**
- `plan_qualifie` (S), avec `resultat` et `motif_refus`.
- `credit_offert_attribue` (S) ; `credit_offert_refuse` (S), avec `limite_ip_attente` ou `budget_jour_attente`.
- `plan_lance` (S), avec `type_plan`, `source_lot`, `format_fichier`, `calibre`, `premier_plan` et `periode_prix`.
- `email_envoye` (S).

**Accessibilité et mobile.** Pas d'écran propre : l'utilisateur voit le chantier démarrer, ou le message de refus, annoncé.

### A7. Attente « chantier », réutilisée, avec les images en direct

**Objectif.** Rendre l'attente lisible et utile ; faire savoir qu'on peut partir ; montrer le logement dès qu'il existe.

**Tickets.** Écran : L6-03. Ordre des images, état public, e-mails, mesure T0 : L5-11. Rendu des vues : L4-09, en SwiftShader dans le conteneur de rendu (L5-10, R3).

**Ce qu'on reprend tel quel** (`pipeline/accueil.html`, `recherche/audit-code.md` § 3) :
- la barre qui ne recule jamais, avec le pourcentage en DM Mono et dans le titre de l'onglet (`attente.onglet`) ;
- les 40 phrases de chantier, calées sur le pourcentage ;
- la liste des étapes et leurs états.

**Ce qui change** (`MESSAGES.md` § 7.4) :
- **Libellés des étapes** : « Plan reçu », « Échelle » (seulement si elle a été calée), « Lecture du plan », « Vérification avant livraison », « Maquette et photos », « Votre plan est prêt ».
- **Un e-mail envoyé par le serveur** remplace la promesse actuelle, fausse onglet fermé (`recherche/audit-code.md` A4) : `attente.texte`. La notification du navigateur reste proposée en plus, tant que la page est ouverte (`attente.notif.*`).
- **Images en direct** (D5, R2), dans une zone sous les étapes :
  1. rien tant que la vérification avant livraison n'a pas réussi : une visite qui échoue n'a rien laissé voir ;
  2. la **vue du dessus 3D découpée**, rendue en premier, affichée dès qu'elle existe, avec « Votre appartement est sorti de terre » (**à ajouter** à `MESSAGES.md` § 7.4) ;
  3. le **plan 2D coté** ;
  4. les **2 photos** : le séjour, puis la chambre principale ou, à défaut, la pièce principale suivante (R1, règle de choix : L4-09).

  Duplex (`niveaux_max = 2`, L4-08) : une vue du dessus par niveau, avec son nom. Panoramas 360° pendant l'attente : à décider (L5-27, L6-03).

  Chaque image porte « Illustration non contractuelle ». L'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts ; les photos s'y ajoutent. Une photo qui échoue après nouvelles tentatives est omise, sans emplacement vide et sans bloquer ; l'équipe est alertée (R2, L5-16). La page ne lit que l'état public et ses images : ni `plan.json`, ni moteur.
- **Plus aucun détail technique** sous le message ni dans les avertissements (`recherche/audit-code.md` B9). « Chantier à l'arrêt. » est retiré.
- **File d'attente** : `attente.file`, `attente.file_offert`. Ordre de passage : `OFFRES.md` § 1.
- **Pendant l'attente**, sans détourner l'attention :
  - le témoin et le rappel de ce que débloque la visite (`MESSAGES.md` § 7.4, « Pendant l'attente ») ;
  - **proposition** : les deux questions facultatives, « Où en êtes-vous ? » (`compte.etape.*`) et « Comment nous avez-vous connu ? » (liste de `SUIVI.md` § 2.10), en un geste chacune (levier L3).
- **Plus long que prévu**, au-delà du 95e centile : `erreur.delai`.

**Fin de l'attente** (L6-03).
- Plan offert : bouton principal vers l'aperçu (A9) dès sa publication ; les photos encore en cours s'y ajouteront.
- Plan complet (plan payé, crédit testeur complet) : la visite est publiée dès la vérification réussie ; « Entrer dans ma visite » ouvre la vue du propriétaire (L5-11, L5-12). Au pire, la visite sans photos (D5).

**E-mails.** E2 au lancement ; E3 à la publication de l'aperçu (vue du dessus et plan 2D prêts) ; E4 à la publication d'une visite complète ; E6 en cas d'échec (R2, L5-11).

**Mesure.**
- `apercu_pret` (S) ou `plan_pret` (S), puis `photos_pretes` (S) ; `plan_echoue` (S), `email_envoye` (S).
- `situation_declaree` (S) et `source_declaree` (S). Elles servent au test T11 : conversion selon le moment d'achat.
- `cta_demo_clique` (N), avec `emplacement` = `attente`, puis `demo_ouverte` (N).

**Cas limites.**
- Onglet fermé puis rouvert : le chantier reprend à l'état du serveur, depuis n'importe quel appareil connecté.
- Redémarrage du serveur : le travail reprend sans repayer (`erreur.interrompu`, `recherche/audit-code.md` A2), et la barre ne recule pas.
- Aucun résultat au bout de 2 h, ou travail non démarré sous 24 h : rien n'est décompté, avec l'e-mail E6 (A15). S'il est publié plus tard, il est livré sans rien décompter.
- Plusieurs plans en même temps : au-delà de 2 travaux simultanés (`travaux_simultanes_max`, 2 par défaut), le suivant attend son tour, et l'écran le dit.
- Une photo en échec : omise (R2), l'écran finit sans emplacement vide.
- Vue du dessus ou plan 2D impossibles : l'aperçu n'est pas publié, donc rien n'est décompté (R2). Message et suite (relance sans IA, puis échec traité en A15) à fixer dans L5-11 (§ 8.3, question 10).

**Accessibilité et mobile.**
- Les étapes se distinguent par leur forme : plein, contour, pulsation.
- Les phrases de chantier ne sont pas annoncées ; les étapes et l'apparition de chaque image le sont.
- Textes alternatifs : « Vue du dessus de la maquette 3D », « Plan 2D coté », nom de la pièce (L6-03).
- Avec le mouvement réduit : ni pulsation ni fondu.
- Sur mobile, les questions et le lien vers le témoin passent sous les étapes.

```
+------------------------------------------------------------------------+
| SUR PIÈCE                                                  <Mes plans> |
+------------------------------------------------------------------------+
|  Votre plan est en chantier                                            |
|  [#########################################.............]   76 %       |
|  On compare les surfaces au tableau du promoteur…                      |
|                                                                        |
|  (*) Plan reçu                PDF du promoteur : échelle lue dans le   |
|                               fichier.                                 |
|  (*) Lecture du plan          Murs, portes, fenêtres et équipements.   |
|  (*) Vérification avant livraison                                      |
|  (>) Maquette et photos                                                |
|  ( ) Votre plan est prêt                                               |
|                                                                        |
|  Votre appartement est sorti de terre.                   (à ajouter)   |
|  ~~~~~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~~~~~                               |
|  ~~ vue du dessus ~   ~~ plan 2D coté ~~                               |
|  ~~~~~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~~~~~                               |
|  Illustration non contractuelle                                        |
|                                                                        |
|  Comptez ‹délai›. Vous pouvez fermer cette page : on vous écrit à      |
|  vous@exemple.fr dès que c'est prêt.                                   |
|  [ Me prévenir aussi dans ce navigateur ]                              |
|  ----------------------------------------------------------------      |
|  En attendant, faites le tour de l'appartement témoin.                 |
|  [ Visiter l'appartement témoin ]                                      |
|  Où en êtes-vous ? (facultatif, proposition L3)                        |
|  ( ) Je choisis mon lot  ( ) J'ai signé ma réservation  ( ) Mes TMA    |
|  ( ) Visite cloisons  ( ) Livraison  ( ) Je préfère ne pas répondre    |
+------------------------------------------------------------------------+
```

### A8. Calibration, si besoin

**Ticket.** L6-04.

**Quand.** L'image n'a pas de cote lisible, ou l'échelle est incertaine. On le sait dès l'analyse (A3). La cote est demandée après la qualification, **avant la lecture payante** : une calibration faite après la lecture ferait écarter une lecture déjà payée (`ecarter_lecture`, `pipeline/serveur.py`).

**Objectif.** Deux touches et une longueur, sans erreur d'unité.

**Ce qu'on reprend** (`accueil.html`, calibration au clic) : les deux clics puis la longueur, la détection des centimètres saisis à la place des mètres, les points trop proches, la vérification de vraisemblance. Les repères passent du rouge `#e33` au Bleu plan ou à la Brique (`MARQUE.md` § 6.2).

**Textes clés** : `echelle.*` (`MESSAGES.md` § 7.2) et l'e-mail E5 si l'onglet est fermé. `echelle.resultat` remplace l'actuel « 1 m = ‹n› px ».

**Ce qui s'ajoute.**
- **Mobile** : zoom à deux doigts dans le cadre, loupe au-dessus du doigt, points déplaçables après la pose, pavé numérique décimal. **À ajouter** : des variantes « Touchez… » de `echelle.etape1` et `echelle.etape2`.
- **Clavier** : un réticule déplacé aux flèches, Entrée pour poser un point (proposition).
- **Sans cote**, **à ajouter** : « Aucune cote sur votre fichier ? Le PDF du promoteur en contient en général : demandez-le, puis déposez-le. Votre plan offert reste disponible. » + [ Déposer un autre fichier ].
- Rien n'est réservé pendant l'attente de la cote (A6).

**Mesure.** `plan_analyse` (`a_calibrer`), `email_envoye` (`cote_demandee`), `plan_calibre` (S, avec `essais`).

**Accessibilité.** Désigner deux points est un clic, pas un glisser : c'est conforme au critère 2.5.7. L'alternative au clavier est proposée ci-dessus. Le texte d'état est annoncé à chaque étape.

```
+------------------------------------+
| Une cote pour caler l'échelle      |
| Indiquez une dimension connue, la  |
| plus longue possible.              |
| +--------------------------------+ |
| | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | |
| | ~~~~ o-------------o ~~~~~~~~~ | |
| | ~~~~~~~~ 4,12 ~~~~~~~~~~~~~~~~ | |
| | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ | |
| +--------------------------------+ |
| Longueur  [ 4,12 ] m               |
| Avec cette cote, la page mesure    |
| environ 12,4 × 8,7 m. Si cela vous |
| paraît juste, validez.             |
| Sur une image, comptez 5 à 10 cm   |
| d'écart possible.                  |
| [ Recommencer ]                    |
| [[ Valider la cote ]]              |
| <Mon plan n'a aucune cote>         |
+------------------------------------+
```

### A9. Résultat gratuit : ce qui est visible

**Objectif.** Donner une vraie valeur gratuite, qui protège l'acquéreur, et montrer que la visite existe déjà.

**Tickets.** Page : L6-05. Publication « simple » : L5-12. Images : L4-09, L5-11. Mention incrustée : L4-07. Lien pour les proches : L6-08.

**Ce qui est montré** (D6, R1 ; `OFFRES.md` § 2.2, textes `apercu.*` de `MESSAGES.md` § 7.5). Page privée du compte, rendue côté serveur, **images prises par le serveur**, avec la mention non contractuelle incrustée. **Ni le moteur ni `plan.json`** ne sont envoyés au navigateur (R4) ; les surfaces et les points à confirmer sont des textes filtrés, écrits dans la page par le serveur (L6-05). La visite 360° d'arrêt en arrêt (images rendues par le serveur et liste des arrêts, ni moteur ni `plan.json`) y entre si l'utilisateur la confirme comme offre gratuite après la mesure de son coût (décision de principe n° 15, L1-16, L6-13). La vue du dessus manipulable reste une idée à tester (L13-03).
1. Le **cartouche** : `apercu.badge`, `apercu.titre` (repli « Votre logement »), `apercu.sous_titre`.
2. La **vue du dessus 3D découpée** et les **2 photos** : le séjour, puis la chambre principale ou, à défaut, la pièce principale suivante (R1, L4-09).
3. Le **plan 2D coté**, en image capturée côté serveur (L4-09), agrandissable.
4. Les **surfaces par pièce**, comparées au tableau du promoteur : `apercu.surfaces.*`. Chaque écart porte un libellé, jamais la couleur seule.
5. Les **points à faire confirmer**, avec leurs drapeaux : `apercu.points.*`. Ils ne sont jamais verrouillés : ils protègent l'acheteur.
6. La **zone verrouillée**, visible (A10).
7. Le **lien d'aperçu** à montrer à ses proches : `apercu.partage.*`, 30 jours, lecture seule.
8. `apercu.conservation` (6 mois, `OFFRES.md` § 2.2, R7) et `apercu.mention`.

**Publication** (R2).
- La vérification avant livraison réussie est obligatoire : sinon rien n'est publié.
- L'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts. Le plan offert est consommé à cette publication.
- Les 2 photos s'ajoutent quand elles sont prêtes. Une photo qui échoue après nouvelles tentatives est omise : la galerie s'adapte (L4-09), l'équipe est alertée, la publication n'est pas bloquée.
- Un contrôle automatique bloque la publication si la page charge `engine.js`, `plan.json` ou une bibliothèque 3D, ou affiche un texte technique ou une image cassée (L6-05).

**Ordre proposé.** Cartouche et action, images, plan, surfaces, points à confirmer, puis la zone verrouillée. Le levier L6 (§ 7.2) teste les points à confirmer en tête.

**Accroche, à ajouter** (`MARQUE.md` § 4.4) : « Voici votre logement d'après le plan. À vous de juger. »

**Mesure.**
- `apercu_vu` (S), avec `rang` et `delai_depuis_pret`.
- `section_vue` (N).
- `partage_cree` (S), avec `type_page` = `apercu`.

**Cas limites.**
- Une photo manque (échec après nouvelles tentatives) : elle est omise, sans emplacement vide ; l'aperçu reste publié avec la vue du dessus, le plan 2D et l'autre photo, ou sans photo (R2). Cette règle remplace l'ancien blocage de la publication. On ne montre jamais d'image cassée.
- Vue du dessus ou plan 2D absents : pas de publication, rien de décompté (A7, A15).
- Écart de surface important : il est signalé dans les points à confirmer, sans jugement.
- Aperçu proche de son effacement : e-mail E11 (14 jours avant, délai à confirmer).
- Bêta fermée : l'action principale ne propose pas d'achat ; le volet décrit ce que débloque la visite, sans bouton de paiement (R13, L6-05). Si la variante « bêta » donne un plan complet, le testeur n'a pas d'aperçu : il entre directement dans sa visite (A7).

**Accessibilité et mobile.**
- Le tableau des surfaces a de vrais en-têtes ; il est l'équivalent textuel du plan.
- Les photos ont le nom de la pièce en texte alternatif.
- Le plan s'agrandit en plein écran, avec le zoom à deux doigts.
- Sur mobile : une colonne, et l'action `verrou.bouton` collée en bas.
- Captures de contrôle à 320 px de large (R10, L6-05).

Sur ordinateur, vente ouverte (contenu verrouillé lu dans le catalogue, L5-08) :

```
+------------------------------------------------------------------------+
| SUR PIÈCE                                  <Mes plans>  <Mon compte>   |
+------------------------------------------------------------------------+
| +----+---------------------------------+  PLAN OFFERT                  |
| | 23 | Appartement 3 pièces            |                               |
| |    | T3 · 64,8 m² · d'après le plan  |                               |
| |    | Illustration non contractuelle  |                               |
| +----+---------------------------------+                               |
| [[ Débloquer la visite · 29 € ]]       <Montrer à vos proches>         |
| Voici votre logement d'après le plan. À vous de juger.                 |
|  ~~~~~~~~~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~              |
|  ~~ vue du dessus ~~~~~   ~~ séjour ~~~~   ~~ chambre ~~~              |
|  ~~~~~~~~~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~   ~~~~~~~~~~~~~~              |
|  Plan 2D coté       Pièce     Lu sur le   Tableau du   Écart           |
|  ~~~~~~~~~~~~~~               plan        promoteur                    |
|  ~~ plan 2D ~~~     Séjour    28,4 m²     28,4 m²      Identique       |
|  ~~~~~~~~~~~~~~     Chambre   11,6 m²     11,9 m²      0,3 m² : à      |
|                                                        faire confirmer |
|  Points à faire confirmer par votre promoteur                          |
|  À vérifier   Hauteur sous plafond non indiquée sur le plan            |
|  Hypothèse    Cuisine indicative, dessinée en tireté                   |
|  ----------------------------------------------------------------      |
|  [#] Visite   [#] Maquette 3D   [#] Plan 2D interactif                 |
|  [#] Fiche complète   [#] Partage de la visite                         |
|  Illustration non contractuelle générée automatiquement à partir du    |
|  plan de vente. Aperçu disponible jusqu'au 27/03/2027.                 |
+------------------------------------------------------------------------+
```

Sur mobile :

```
+------------------------------------+
| SUR PIÈCE              <Mon compte>|
+------------------------------------+
| PLAN OFFERT                        |
| 23 | T3 · 64,8 m² · d'après le plan|
|    | Illustration non contractuelle|
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| ~~ séjour ~~~~~~~~~~~~ 1 / 3 ~~~~~ |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| Plan 2D coté           [ Agrandir ]|
| Surfaces par pièce                 |
| Séjour   28,4 m²  Identique        |
| Chambre  11,6 m²  Écart de 0,3 m²  |
| Points à faire confirmer     (3)   |
| [#] Visite   [#] Maquette 3D       |
| <Montrer à vos proches>            |
+------------------------------------+
| [[ Débloquer la visite · 29 € ]]   |
+------------------------------------+
```

### A10. Verrou de la visite

**Objectif.** Rendre le déblocage évident et immédiat, sans pression.

**Ce qui est verrouillé** (R1 ; `OFFRES.md` § 2.2), visible avec un cadenas et un texte (`verrou.onglet`, `verrou.telechargement`) ; la liste est lue dans la version d'offre du catalogue (L5-08) :
- la visite 3D : marche libre et arrêts par pièce (le 360° d'arrêt en arrêt n'est pas verrouillé s'il devient l'offre gratuite) ;
- la maquette 3D et le plan 2D interactifs ;
- la fiche complète et le partage de la visite ;
- l'hébergement au-delà de 6 mois (la visite reste en ligne 24 mois, R7) ;
- les téléchargements, seulement quand ils sont livrés (L8-08).

**Aucune photo supplémentaire n'est promise** au lancement : la visite débloquée montre les mêmes images que l'aperçu. La galerie complète viendra avec L13-02 et n'est jamais annoncée avant (R1). `verrou.photo` et les emplacements de photos grisés ne s'affichent pas tant que L13-02 n'est pas en service.

Tout clic sur un de ces éléments ouvre le même **volet** (`MESSAGES.md` § 7.6) :
- titre et texte : « Votre logement est prêt. La visite s'ouvre dès le paiement, sans nouvelle attente. » ;
- deux choix : « Ce logement · 29 € » et « Comparer 3 lots · 59 € », prix et contenu lus dans le catalogue (R5) ;
- les limites ;
- [[ Continuer ]], <Essayer d'abord la visite de l'appartement témoin>, <Plus tard>.

**Pendant la bêta fermée** (R13) : même volet, sans choix payant ni bouton de paiement ; il décrit ce que débloque la visite, avec un texte du catalogue **à ajouter** à `MESSAGES.md`, sans « bientôt » (L6-05). Le texte est à faire relire par l'avocat (L0-07).

**Verrou côté serveur** (D6, R4). Rien de la visite n'est envoyé : la page d'aperçu ne charge **ni `engine.js` ni `plan.json`**, et aucune route ne les sert pour un plan en aperçu (L5-12). Ce n'est pas un verrou d'interface : `ARCHITECTURE.md` M3.2 est réécrit en ce sens. Un contrôle automatique fait échouer la publication d'une page d'aperçu qui chargerait l'un des deux, ou qui afficherait un texte technique (`OFFRES.md` § 2.2, L6-05).

**Mesure.**
- `verrou_clique` (N), avec `element`.
- `volet_deblocage_ouvert` (N), avec `origine`.
- `offre_choisie` (N), avec `offre` et `periode_prix`.
- `cta_demo_clique` (N), avec `emplacement` = `volet`.

**Cas limites.**
- Tentative par la console : il n'y a rien à ouvrir, puisque les données ne sont pas servies.
- Période de test de prix qui change entre l'ouverture du volet et le paiement : la page de commande affiche toujours le prix qui sera payé (A11). Pendant une période, tout le monde voit le même prix (R8, L8-06).
- Plan déjà acheté disponible : `verrou.bouton_plan_dispo` ; plan suivant à 15 € : `verrou.bouton_suivant`.

**Accessibilité et mobile.**
- Le cadenas a un texte.
- Le volet piège le focus et se ferme avec Échap.
- Les choix sont des boutons radio dans un `fieldset`.
- Sur mobile, le volet monte depuis le bas.

```
+------------------------------------------------------------------------+
|  Votre logement est prêt.                                [ Plus tard ] |
|  La visite s'ouvre dès le paiement, sans nouvelle attente.             |
|                                                                        |
|  (o) Ce logement · 29 €                                                |
|      La visite, la maquette et le plan 2D interactifs, la fiche        |
|      complète et le partage privé. En ligne 24 mois.                   |
|  ( ) Comparer 3 lots · 59 €                                            |
|      Ce logement, plus 2 plans à lancer dans les 12 mois.              |
|                                                                        |
|  Logement présenté vide, finitions supposées · illustration non        |
|  contractuelle.                                                        |
|  [[ Continuer ]]   <Essayer d'abord la visite de l'appartement témoin> |
+------------------------------------------------------------------------+
```

### A11. Achat : cases légales et paiement

**Objectif.** Payer en moins d'une minute, avec les informations et les preuves exigées.

**Tickets.** Paiement : L8-01. Cases et e-mail E8 : L8-03. CGV et médiateur : L8-04. Factures : L8-05. Cet écran n'existe qu'à partir de l'ouverture de la vente (L8-07) : aucun achat pendant la bêta fermée (R13).

**Page « Votre commande »**, sur notre domaine, avant Stripe Checkout (`MESSAGES.md` § 7.7) :
- ligne de la commande (`achat.ligne.visite`, `achat.ligne.pack` ou `achat.ligne.suivant`), `achat.compris`, `achat.validite`, `achat.limites`. `achat.compris` est lu dans le catalogue et ne cite que ce qui est livré : aucun nombre de photos (R1), les téléchargements seulement avec L8-08 ;
- **deux cases, non cochées**, qui bloquent le paiement :
  1. l'**écart consenti**, même texte qu'en A4. Il est redemandé à chaque achat tant que l'avocat n'a pas dit le contraire (`OFFRES.md` annexe B, question 2) ;
  2. la **renonciation**, selon le cas : déblocage d'un aperçu, lancement d'un plan payé, ou lot de 3 (la case ne porte alors que sur le plan ouvert maintenant) ;
- `achat.retractation`, `achat.remboursement`, `achat.liens` ;
- le bouton « Payer 29,00 € TTC », et la ligne qui le suit.

**Stripe Checkout.**
- Carte ; Apple Pay et Google Pay à activer, car ils réduisent la saisie sur mobile.
- E-mail prérempli, sans compte Stripe.
- La session est créée avec le prix affiché.
- Retours : `achat.ok` ou `achat.ok_pack` ; `achat.annule`.

**E-mails.** E7 (confirmation de commande) et E8 (confirmation d'ouverture immédiate, sur support durable), fusionnés quand l'achat et l'ouverture ont lieu au même moment.

**Preuves.** Table `acceptations` : document, version, texte affiché, horodatage, compte, préfixe IP, conservés 5 ans.

**Mesure.**
- `paiement_ouvert` (S), `renonciation_acceptee` (S).
- `achat_paye` (S), `paiement_abandonne` (S), `litige_ouvert` (S).
- `erreur_affichee` (N), avec `paiement_refuse`.

**Cas limites.**
- Double clic : une seule session, grâce à une clé d'idempotence.
- Webhook en retard : « Paiement reçu, confirmation en cours… », puis au-delà de 2 minutes : `erreur.paiement_interrompu`. Le rapprochement quotidien vérifie que chaque paiement a son plan (`OFFRES.md` § 6.6).
- Paiement en double : le second est remboursé automatiquement.
- Carte refusée : `erreur.paiement_refuse`.

**Accessibilité et mobile.**
- Les cases sont dans un `fieldset` avec sa légende.
- Le bouton reste focalisable ; s'il manque une case, `erreur.cases` dit laquelle, plutôt qu'un bouton grisé muet.
- L'accessibilité de Checkout dépend de Stripe (non vérifiée ici).

```
+------------------------------------------------------------------------+
|  Votre commande                                                        |
|  Visite complète de votre logement · 29,00 € TTC                       |
|  Visite à hauteur d'yeux · maquette 3D et plan 2D interactifs ·        |
|  fiche complète · liens privés · en ligne 24 mois                      |
|  Appartements sur un ou deux niveaux (duplex) · logement présenté      |
|  vide, finitions supposées · pas de mobilier ni de rendu               |
|  photoréaliste · illustration non contractuelle.                       |
|                                                                        |
|  [ ] J'ai compris que la visite et les photos sont des illustrations   |
|      produites automatiquement à partir du plan de vente. (…)          |
|  [ ] Je demande l'ouverture immédiate de la visite, et je reconnais    |
|      perdre mon droit de rétractation pour ce plan.                    |
|                                                                        |
|  Vous pouvez renoncer à votre achat pendant 14 jours, tant que vos     |
|  plans ne sont pas utilisés. (…)  <CGV>  <Politique de remboursement>  |
|                                                                        |
|  [[ Payer 29,00 € TTC ]]                                               |
|  Paiement sécurisé par carte. Libellé sur votre relevé : SUR PIÈCE.    |
+------------------------------------------------------------------------+
```

### A12. Visite débloquée

**Objectif.** La visite s'ouvre à l'instant, sans nouvelle lecture ni nouveau rendu.

**Tickets.** Déblocage : L8-02. Publication et vue du propriétaire : L5-12. Visite dans le navigateur et repli : L4-10. Mode simple du moteur : L4-11.

**Déroulé.**
1. Webhook reçu : consommation d'un plan complet (`OFFRES.md` § 6.4), dans la même transaction que la publication (L8-02).
2. La publication passe de « aperçu » à « complète », **sans nouvelle lecture** ni nouveau rendu (R2) : le moteur de la version validée par la visite de contrôle et le `plan.json` filtré sont servis, avec les fichiers précalculés par le serveur (éclairage, maquette compressée, itinéraires) quand ils existent, prêts avant le déblocage (moment du précalcul à décider, L5-28) ; la qualité s'adapte à l'appareil (L4-12). La visite se calcule dans le navigateur du client (D5).
3. La visite s'ouvre sur la galerie, avec « Lancer la visite 3D » (`g-cta`) désormais actif ; `verrou.ouvert` (« Votre visite est ouverte. »), **sans** annonce d'autres photos, réservée à `verrou.ouvert.galerie` [SI LIVRÉ : L13-02] (`MESSAGES.md` § 7.6, L8-02).
4. **Aucune photo n'est rendue au déblocage** au lancement (D5, R1). La galerie montre les images déjà produites pour l'aperçu : la vue du dessus et les 2 photos, ou moins si une photo a été omise ; au pire, aucune photo (D5). Elle s'adapte de 0 à N images, sans emplacement vide (L4-09). `verrou.photos_pretes` n'est pas utilisé. La galerie complète viendra avec L13-02.

**Ce qui s'ouvre** (R1) : marche libre, arrêts par pièce, mode 360° (quand il existe, L4-16), maquette et plan 2D interactifs, fiche complète, partage de la visite (A13), bouton « Signaler un défaut » (L6-09), plus les mêmes images. Les téléchargements s'ajoutent quand L8-08 est livré.

**Offre de base** (`OFFRES.md` § 1) : simple et très éclairée.
- En mode `simple`, le moteur masque « Rendu photoréaliste de la vue » (option future payante, L13-05) et la superposition du plan du promoteur, réservée au propriétaire ou à l'accord du promoteur (R16, L4-11, avant la bêta fermée ; L10-06).
- Réglages de soleil masqués aussi : proposition de ce document, non couverte par R16.

**Textes clés.**
- Première aide : les textes actuels du moteur, par exemple « Glisser pour regarder · toucher le sol pour y aller · toucher une porte pour l'ouvrir ».
- `defaut.bouton`, toujours visible.
- Téléchargements, quand L8-08 est livré : photos HD, avec la mention incrustée ; plan 2D et fiche en PDF pour la visite cloisons.
- Appareil sans 3D, ou perte du contexte WebGL : `erreur.3d`, repli sur la galerie, le plan 2D et la fiche (L4-10).

**Mesure.**
- `apercu_debloque` (S), `visite_ouverte` (S), `fichier_telecharge` (S, avec L8-08). `photos_completees` (S) reste inutilisé jusqu'à L13-02.
- `visite_chargee` (N), `visite_mode_choisi` (N), `visite_piece_vue` (N), émis par le moteur (`SUIVI.md` § 2.7).
- `visite_chargement_echoue` (N).

**Cas limites.**
- Les photos omises à l'aperçu ne sont pas relancées au déblocage, qui ne crée aucune tâche de rendu : la galerie n'affiche que les images disponibles (L8-02).
- Aperçu expiré et purgé (6 mois, L5-20) : déblocage impossible ; un plan acheté reste disponible pour un nouveau dépôt (L8-02).
- Paiement reçu mais déblocage en échec : le plan reste dans le compte, l'équipe est alertée, aucun nouvel achat n'est demandé (L8-02).

**Accessibilité et mobile.** Les équivalents de la 3D (§ 1.5). La manette tactile et la visite guidée par pièces existent déjà (`moteur/ui.js`).

### A13. Partage : famille, proches, conseiller

**Objectif.** Faire voir le logement aux proches en deux gestes. C'est aussi le bouche-à-oreille.

**Tickets.** Partage : L6-08. Jetons : L5-13. Pages de visite : L5-12.

**Deux objets partageables.**
- L'**aperçu** gratuit : images seulement, 30 jours (`apercu.partage.*`). Comme pour le propriétaire, ni moteur ni `plan.json` (R4) ; un lien d'aperçu reste un aperçu après le déblocage (L8-02).
- La **visite** débloquée : jusqu'à la fin de l'hébergement.

Les deux liens sont privés, en `noindex` (R20), révocables, sans traceur, **sans la superposition du plan du promoteur**.

**Volet « Partager la visite »**, textes **à ajouter** (`MESSAGES.md` n'a que ceux de l'aperçu et des liens pros) :
- « Pour qui ? (visible par vous seul) », par exemple « Maman ».
- Durée : 30 jours · 6 mois · jusqu'à la fin de l'hébergement.
- [[ Créer le lien ]], puis [ Copier le lien ] et [ Envoyer… ] (partage natif sur mobile, e-mail, SMS).
- La liste des liens créés : libellé, date, [ Couper le lien ].
- La règle : « Lien privé, non référencé, que vous pouvez couper à tout moment. Pour vos proches. Pas de publication sur un réseau social ni dans une annonce. »
- Le partage avec un banquier, un courtier ou un notaire sort peut-être du cercle de famille : à valider par l'avocat avant de l'écrire (`OFFRES.md` annexe B, question 6 ; `MESSAGES.md` § 12.1).

**Page du destinataire** (`visite.<domaine>/v/‹jeton›`), textes `partage.*` (`MESSAGES.md` § 7.8) :
- sans compte, sans traceur, compteur agrégé seulement ;
- cartouche, galerie, visite ou aperçu, fiche, `partage.mention` ;
- en bas : `partage.invitation` et son bouton, vers `/offert` ;
- pied de page discret : `partage.pro`, vers `/pro/decouvrir`.
- `/offert` et `/pro/decouvrir` viennent de `SUIVI.md` § 2.6 ; elles figurent désormais parmi les adresses de `MESSAGES.md` § 0.9, qui font foi (R9).
- **Pendant la bêta fermée**, « Votre premier plan est offert » serait faux pour un destinataire non invité. **Proposition** : l'invitation mène à la liste d'attente (L2-12), et `partage.pro` à l'entretien ou à la bêta fondateurs (R13, R21).

**Mesure.**
- `partage_cree` (S), `partage_canal_choisi` (N), `partage_revoque` (S).
- `partage_ouvert` (C), `partage_cta_clique` (C), `lien_expire_ouvert` (C).
- Arrivées sur `/offert` et `/pro/decouvrir` (N) : mesure du test T10.

**Cas limites.**
- Lien expiré, coupé ou inconnu : `erreur.lien_expire`, `erreur.lien_coupe`, `erreur.lien_inconnu`. Rien d'autre n'est révélé.
- Le conseiller de l'acquéreur veut réutiliser la visite pour ses propres prospects : la licence est d'usage privé (`OFFRES.md` § 2.7). La page d'aide l'oriente vers Sur Pièce Pro.

**Accessibilité et mobile.**
- Le bouton « Copier » confirme par un texte annoncé (`apercu.partage.copie`).
- Le partage natif est proposé en premier sur mobile.

```
+------------------------------------------------------------------------+
|  Partager la visite                      (textes à ajouter) [ Fermer ] |
|  Pour qui ? (visible par vous seul)  [ Maman                      ]    |
|  Durée   (o) 30 jours   ( ) 6 mois   ( ) Jusqu'au 27/09/2028           |
|  [[ Créer le lien ]]                                                   |
|                                                                        |
|  Lien privé, non référencé, que vous pouvez couper à tout moment.      |
|  Pour vos proches. Pas de publication sur un réseau social ni dans     |
|  une annonce.                                                          |
|  ----------------------------------------------------------------      |
|  Vos liens                                                             |
|  Maman       créé le 27/09      [ Copier ]  [ Couper le lien ]         |
|  Paul        créé le 25/09      [ Copier ]  [ Couper le lien ]         |
+------------------------------------------------------------------------+
```

### A14. Deuxième plan : comparer des lots

**Objectif.** Comparer deux ou trois lots, ou le plan modificatif envoyé par le promoteur, sans refaire le parcours.

**Tickets.** « Mes plans » : L6-07. Plans achetés et commande : L8-01, L5-07. Les achats n'existent qu'à partir de L8-07 : pendant la bêta, un invité n'a que ce que lui donne la variante « bêta » (R13).

**Page « Mes plans »** (`compte.plans.*`) :
- une carte par plan : vignette, cartouche, état (`compte.plans.etat.*`), date de fin d'hébergement ;
- en tête : `compte.plans.dispo` ; sinon, **à ajouter** : « Plan suivant : 15 € TTC jusqu'au ‹date› », soit 12 mois après le premier achat ;
- [[ Ajouter un plan ]] ouvre le même dépôt (A2 et A3), dans le compte.

**Lancement d'un plan suivant.**
- Avec un plan disponible : `depot.reconnu.bouton_plan`, et la case de renonciation « lancement d'un plan payé » (`MESSAGES.md` § 7.7). Le plan est **complet** d'emblée, sans aperçu. E8 suit.
- Sans plan disponible : page de commande à 15 € TTC (`achat.ligne.suivant`), mêmes cases qu'en A11.
- Sans achat antérieur, un second plan offert n'est pas possible : le deuxième lot coûte 29 €, ou le pack 59 €.

**Comparaison.** Au lancement, les visites s'ouvrent séparément. Un comparateur côte à côte est **à construire plus tard**, après la mesure de T3 (`OFFRES.md` § 2.4).

**Mesure.**
- `cta_depot_clique` (N), avec une valeur d'`emplacement` **à ajouter** : `mes_plans`.
- `plan_lance`, avec `premier_plan` = faux.
- `achat_paye`, avec `offre` = `particulier_plan_suivant` (code du catalogue, R5).
- `renonciation_acceptee`, avec `contexte` = `lancement`.

**Cas limites.**
- Le même fichier déjà déposé : doublon (§ 1.6).
- Plans proches de leur fin de validité : e-mail E10, 30 puis 7 jours avant ; puis `credit_expire`.

```
+------------------------------------------------------------------------+
|  Mes plans                                       [[ Ajouter un plan ]] |
|  2 plans disponibles, à lancer jusqu'au 27/09/2027                     |
|                                                                        |
|  +------------------+  +------------------+  +------------------+      |
|  | ~~~~~~~~~~~~~~~~ |  | ~~~~~~~~~~~~~~~~ |  |                  |      |
|  | Lot 23 · T3      |  | Lot 31 · T3      |  |  Lot 12 · T2     |      |
|  | 64,8 m²          |  | 66,2 m²          |  |  En chantier 58 %|      |
|  | Visite complète  |  | Plan offert      |  |                  |      |
|  +------------------+  +------------------+  +------------------+      |
+------------------------------------------------------------------------+
```

### A15. Échecs, défauts et remboursement automatique

**Principe.** Un plan n'est consommé qu'à la publication : celle de l'aperçu (vue du dessus et plan 2D prêts) pour le plan offert (R2), celle de la visite pour un plan complet (L5-11, L8-02). Dans tous les autres cas, il est **rendu automatiquement sur son lot d'origine** (« rien n'a été décompté »), avec un e-mail (`OFFRES.md` § 6.4). Les messages ne contiennent aucun détail technique ; le détail part au journal et à l'alerte de l'équipe.

| Moment | Ce que voit l'utilisateur | Grand livre | E-mail | Action proposée | Événement |
|---|---|---|---|---|---|
| Refus à l'analyse (avant compte) | Clés `depot.refus.*` (§ 1.6) | Rien | — | Déposer un autre fichier | `plan_analyse` (`refuse`) |
| Refus à la qualification | Clés `depot.refus.*`, qui finissent par « Rien n'a été décompté. » | Rien | — | Déposer un autre fichier | `plan_qualifie` (`refuse`) |
| Lecture impossible, budget de 3 $ atteint (toutes passes et relances confondues, R6), refus du fournisseur | `erreur.lecture` | Libération +1 | E6 | Déposer un autre fichier ; remboursement si le plan était payé | `plan_echoue`, `credit_rendu` |
| Vérification avant livraison bloquante après réparations | `erreur.verification` | Libération +1 | E6 | Idem | Idem |
| Aucun résultat 2 h après le début, ou pas de démarrage sous 24 h | `erreur.delai` | Libération +1 | E6 | Idem ; livraison sans frais si le plan aboutit plus tard | `plan_echoue` (`delai_depasse`, `file_saturee`) |
| Service indisponible, travail interrompu | `erreur.indisponible`, `erreur.interrompu` | Rien tant que le travail reprend | — | Rien à faire | — |
| Vue du dessus ou plan 2D impossibles après nouvelles tentatives (**proposition**, conséquence de R2) | Message **à définir** (L5-11, § 8.3, question 10) | Libération +1 : l'aperçu n'est pas publié (R2) | E6 | Idem | `plan_echoue` (`etape` = `photos`) |
| Photo d'aperçu en échec après nouvelles tentatives | Rien : la photo est omise, sans emplacement vide (R2) | Rien : l'aperçu est publié | — | — | Alerte à l'équipe (L5-16) ; événement de fin des images à définir (§ 8.1) |
| Défaut visible signalé | `defaut.merci` | Rien | E12 | — | `defaut_signale`, `defaut_traite` |

**Remboursement en argent, sur simple demande** (`OFFRES.md` § 2.6).
- E6 prévoit aujourd'hui une réponse à l'e-mail : « Si vous préférez être remboursé, répondez simplement à cet e-mail. »
- **Proposition** : un bouton [ Être remboursé de ‹29› € ] dans E6 et dans « Mon compte ». Il retire d'abord le plan non utilisé, puis rembourse par Stripe la ligne concernée (29 € ou 15 €). Confirmation, **à ajouter** : « Remboursement de ‹29,00 €› lancé. » Le délai d'arrivée est à confirmer sur la documentation de Stripe.
- Un remboursement rapide coûte moins qu'un litige : 40 € avec la contestation (`OFFRES.md` § 8.3).

**« Signaler un défaut »**, dans la visite : `defaut.*` (`MESSAGES.md` § 7.10), ticket L6-09.
- La pièce est préremplie avec la pièce courante ; la position est enregistrée (`defaut.position`).
- Un défaut de notre fait est **toujours corrigé gratuitement** (R14). Correction visée sous 5 jours ouvrés, par un rejeu sans IA ; sinon, remboursement (`OFFRES.md`, R15).
- **Un défaut confirmé devient un contrôle automatique** (`CLAUDE.md`). L'e-mail E12 le dit.

**Mesure.**
- `plan_echoue` (S), avec `etape` et `cause` ; `credit_rendu` (S), avec `motif` et `source_lot`.
- `achat_rembourse` (S) ; `remboursement_demande` (S) **à ajouter** si le bouton est retenu.
- `defaut_signale` (S) ; `defaut_traite` (S), avec `controle_ajoute` ; `plan_rejoue` (S).

```
+------------------------------------------------------------------------+
|  La lecture de votre plan n'a pas abouti                               |
|  Rien n'a été décompté : votre plan reste disponible. Notre équipe     |
|  l'examine et vous écrit sous 2 jours ouvrés.                          |
|                                                                        |
|  [[ Déposer un autre fichier ]]   [ Être remboursé de 29 € ]           |
|  Le PDF d'origine du promoteur donne le meilleur résultat.             |
+------------------------------------------------------------------------+
```

### A16. Retour sur mobile

**Trois cas fréquents.**
1. Le plan a été déposé sur ordinateur, et l'e-mail « prêt » (E3) est lu sur le téléphone.
2. Tout le parcours se fait sur le téléphone.
3. L'arrivée se fait dans le navigateur intégré d'une application.

**Tickets.** L6-07 (« Mes plans » et retour sur mobile), L6-08 (lien d'aperçu).

**Proposition pour le bouton « Voir mon logement » d'E3.**
- Il ouvre l'aperçu **par le lien d'aperçu** : lecture seule, 30 jours, sans connexion. On voit donc le résultat en un geste.
- Le déblocage demande ensuite la connexion : code à 6 chiffres ou Google. Cela ajoute une étape au moment d'acheter.
- L'autre choix (connexion d'abord) est le levier L11 (§ 7.2).
- On n'envoie **pas** de lien de connexion valable longtemps dans cet e-mail : un lien de connexion reste valable 15 minutes (`recherche/auth-paiement.md` § 1.5).

**Sur le téléphone.**
- Aperçu en une colonne, action collée en bas (A9).
- Checkout avec Apple Pay ou Google Pay.
- Visite avec la manette tactile et la visite guidée par pièces. Le paysage est suggéré, jamais imposé.
- Appareil modeste : la qualité baisse d'elle-même pour garder la visite fluide (L4-12, seuils de L1-14). Sans WebGL, ou navigateur intégré qui perd le contexte 3D : galerie, plan et fiche restent disponibles (`erreur.3d`, L4-10) ; le 360° comme repli est à décider.
- **Proposition** : [ M'envoyer le lien par e-mail ] sur la page d'aperçu, pour finir sur ordinateur (levier L12).

**Mesure.** `apercu_vu` et `visite_ouverte` (avec `appareil`).

### A17. Compte, droits et sortie

**« Mon compte »** (`compte.plans.*`, `compte.supprimer`, `compte.exporter`) :
- plans, achats et reçus, plans disponibles et leur date de fin ;
- « Renoncer au contrat ici » (`renonciation.*`) : actif 14 jours après chaque achat, pour les plans non utilisés, avec accusé de réception horodaté (E9, `recherche/juridique.md` § 1.3) ;
- « Télécharger mes données » et « Supprimer mon compte ». Les liens et visites cessent : c'est dit avant de confirmer.

**Rappels transactionnels**, qui ne demandent pas de consentement : E10 (plans à lancer), E11 (suppression d'un aperçu, conservé 6 mois), fin d'hébergement de la visite, en ligne 24 mois (**à ajouter**). Durées : `OFFRES.md` fait foi (R7) ; purge : L5-20. Renonciation et e-mails légaux : L8-03.

**Mesure.** `retractation_demandee` (S), `compte_supprime` (S), `credit_expire` (S).

---

## 3. Parcours B : conseiller (Sur Pièce Pro)

### 3.0 Vue d'ensemble

```
Page pro --(essai)--> formulaire d'essai (SIREN) --> organisation créée
   |                                                  |
   +--(démonstration 30 min)                          v
                              tableau de bord : appartement témoin préchargé
                                                      |
                              lien témoin envoyé à soi-même (0 plan utilisé)
                                                      v
                              premier plan (3 plans d'essai) --> lien prospect
                                                      v
                              page prospect : « Je suis intéressé » --> e-mail E15
                                                      v
                              tableau de suivi --> abonnement (E14 à J-3)
                                                      v
                              collègues --> personnalisation --> recharges
```

### B1. Page pro

**Objectif.** En une minute, comprendre la valeur (un lien de visite par lot, un prospect qui se signale lui-même), voir une vraie page prospect, démarrer l'essai.

**Friction à éviter.**
- Un formulaire de contact comme seule porte d'entrée.
- Des prix cachés.
- La promesse d'un suivi détaillé des prospects, qui n'est pas vendable en l'état (`OFFRES.md` § 3.4).

**Textes clés** : `MESSAGES.md` § 2 : premier écran (titre retenu « Envoyez la visite du lot, pas seulement son plan. » et variantes), constat, liens de visite, « Savoir qui est intéressé, dans les règles », formules, essai, bêta fondateurs, droits du promoteur, questions fréquentes. Page `/pro/decouvrir` pour les arrivées depuis une visite (adresse à confirmer, R9, § 8.2).

**Ce qui existe d'abord** (R21). Avant les lots 9 à 11, la page pro (L2-05) ne décrit comme disponible que ce qui existe : son action principale est un entretien ou la bêta fondateurs (L2-18, L9-11), pas un essai en ligne. La maquette ci-dessous est celle du lot 9 (L9-02).

**Mesure.**
- Page vue (N), `section_vue` (N), `faq_ouverte` (N).
- `cta_essai_pro_clique` (N), `cta_rdv_pro_clique` (N).
- `formulaire_envoye` (N) puis `rdv_pro_demande` (S).
- `cta_demo_clique` (N), avec `emplacement` = `pro`.

```
+------------------------------------------------------------------------+
| SUR PIÈCE PRO                  <Tarifs>  <Méthode>  <Connexion>        |
+------------------------------------------------------------------------+
|  SUR PIÈCE PRO · CONSEILLERS EN IMMOBILIER NEUF                        |
|  Envoyez la visite du lot, pas seulement son plan.                     |
|  Déposez le plan de vente d'un lot. Vous recevez son plan 2D coté, sa  |
|  maquette 3D, sa visite et ses photos, vérifiés avant livraison.       |
|  Envoyez le lien : votre prospect entre sans compte, et vous prévient  |
|  d'un clic s'il est intéressé.                                         |
|                                                                        |
|  [[ Essayer 14 jours gratuitement ]]                                   |
|  Sans carte bancaire · 3 plans complets · un essai par entreprise      |
|  <Voir une page de visite prospect →>                                  |
|                                                                        |
|  Solo 49 € HT/mois   Cabinet 99 € HT/mois   Équipe 199 € HT/mois       |
|  5 plans · 1 util.   12 plans · 3 util.     30 plans · 10 util.        |
|  Un ou deux niveaux (duplex) · logement vide · non contractuel         |
+------------------------------------------------------------------------+
```

### B2. Essai

**Objectif.** Ouvrir un essai en moins de 2 minutes, sans carte, et écarter les faux comptes pros.

**Formulaire** (textes des champs **à ajouter**, sur le modèle de `MESSAGES.md` § 3.9) :
- e-mail professionnel (lien de connexion ou Google) ;
- entreprise, avec autocomplétion par nom ou SIREN (Annuaire des entreprises) ;
- activité : CGP ou CIF · agent immobilier · mandataire · commercialisateur · autre ;
- prénom et nom ;
- téléphone, facultatif : il s'affichera sur les pages prospects ;
- « Comment nous avez-vous connu ? », facultatif (`SUIVI.md` § 2.10) ;
- case : « [ ] J'accepte les <conditions Sur Pièce Pro> et l'<accord de sous-traitance des données>. » ;
- Turnstile.

**Contrôles.** SIREN actif, **1 essai par SIREN** (`OFFRES.md` § 3.6), domaine jetable refusé.

**Textes d'erreur** : `erreur.pro.siren_essai`, `erreur.pro.siren_inconnu`, `erreur.email_jetable`.
- **À ajouter** à `erreur.pro.siren_essai` : « … ou demandez à un collègue déjà inscrit de vous inviter. » Un salarié d'agence rejoint ainsi le compte de son agence. On ne révèle pas qui a ouvert l'essai.
- **À ajouter** : un message pour un SIREN cessé (`siren_refuse` a la valeur `cesse`).

**E-mail** : E13.

**Mesure.**
- `formulaire_commence` (N), `formulaire_refuse` (N), `formulaire_envoye` (N), avec `formulaire` = `essai_pro`.
- `essai_pro_demarre` (S), `siren_refuse` (S), `source_declaree` (S).

```
+------------------------------------------------------------------------+
|  Essai Sur Pièce Pro · 14 jours · 3 plans · sans carte                 |
|  E-mail pro   [ prenom@cabinet.fr               ]                      |
|  Entreprise   [ Cabinet Martin · 123 456 789      v ]                  |
|  Activité     ( ) CGP ou CIF  ( ) Agent  ( ) Mandataire                |
|               ( ) Commercialisateur  ( ) Autre                         |
|  Prénom, nom  [ Claire Martin                     ]                    |
|  Téléphone    [                                   ]  (facultatif)      |
|  Comment nous avez-vous connu ?  [ Choisir…         v ]  (facultatif)  |
|  [ ] J'accepte les <conditions Sur Pièce Pro> et l'<accord de          |
|      sous-traitance des données>.                                      |
|  [[ Recevoir mon lien de connexion ]]      [ Continuer avec Google ]   |
+------------------------------------------------------------------------+
```

### B3. Organisation et première session

**Objectif.** Faire vivre le moment clé, « mon prospect ouvre le lien », **avant même le premier plan**.

**Déroulé.**
- L'organisation est créée à partir du SIREN. Le nom affiché reste modifiable.
- **Proposition** : le tableau de bord contient **l'appartement témoin fictif, préchargé**. Il ne consomme aucun plan (levier L13).
- Une liste de 4 étapes guide la première session. E13 en donne 3 ; la première ci-dessous est **à ajouter** :
  1. « Envoyez-vous la page prospect de l'appartement témoin. »
  2. « Déposez le plan d'un de vos lots. »
  3. « Ajoutez votre logo et vos coordonnées. »
  4. « Envoyez votre premier lien à un prospect. »
- Formule Cabinet et au-dessus : dossiers par programme et par client.

**Mesure.** `essai_pro_demarre` (S) ; `checklist_etape_faite` (S) **à ajouter** ; `lien_prospect_cree` (S), avec une propriété `temoin` **à ajouter**.

```
+------------------------------------------------------------------------+
| SUR PIÈCE PRO · Cabinet Martin        Essai : 14 jours, 3 plans        |
+------------------------------------------------------------------------+
|  Pour bien démarrer                                                    |
|  (>) 1. Envoyez-vous la page prospect de l'appartement témoin          |
|  ( ) 2. Déposez le plan d'un de vos lots                               |
|  ( ) 3. Ajoutez votre logo et vos coordonnées                          |
|  ( ) 4. Envoyez votre premier lien à un prospect                       |
|                                                                        |
|  Programmes                                     [[ Importer un plan ]] |
|  +------------------------------+                                      |
|  | Appartement témoin (fictif)  |  [ Envoyer à un prospect ]           |
|  | T3 · 65 m² · démonstration   |  0 plan utilisé                      |
|  +------------------------------+                                      |
+------------------------------------------------------------------------+
```

### B4. Premier plan

**Objectif.** Un plan complet, prêt à envoyer, sans verrou.

**Déroulé.**
- Même dépôt et même analyse qu'en A2 et A3.
- En plus : un champ « Programme » (dossier existant ou nouveau) et un champ « Lot n° », facultatif.
- Pas de case de renonciation : c'est un contrat entre professionnels.
- Consommation affichée avant le lancement, **à ajouter** : « Ce plan utilisera 1 de vos 3 plans d'essai. »
- Chantier identique à A7. Les essais passent en deuxième priorité (`OFFRES.md` § 1).
- Les essais pros passent par la clé OpenRouter « payant », sur le budget de leur organisation, jamais par la clé « gratuit » (R23, L5-09).

**Textes clés.**
- Plus de plan ce mois-ci : `erreur.pro.quota`, avec [[ Ajouter 5 plans ]] et <Passer à la formule supérieure>.
- Plans d'essai épuisés, **à ajouter** : « Vos 3 plans d'essai sont utilisés. Vos liens restent actifs. » + [[ Choisir une formule ]].
- Trop de plans en cours (3, ou 6 en Équipe) : `erreur.pro.simultanes`.
- Achat de recharges au-delà de 3 fois le quota : `erreur.pro.recharge_limite`.

**Mesure.** `plan_lance` (`source_lot` : `essai`, `abonnement` ou `recharge`), `quota_atteint` (S), `erreur_affichee` (N).

### B5. Lien prospect et page prospect

**Objectif.** Envoyer un lien personnel en moins de 30 secondes, par le canal habituel du conseiller.

**Création du lien** (`pro.lien.*`, `MESSAGES.md` § 7.9) :
- **Premier lien d'un programme** : la case d'autorisation du promoteur, obligatoire, avec son aide (`OFFRES.md` § 3.8 ; `erreur.pro.autorisation`). Le dépôt du document est facultatif.
- Nom du lien, expiration (90 jours par défaut).
- Cabinet et Équipe : **à ajouter**, « Proposer au prospect le suivi détaillé (durée, pièces vues), s'il l'accepte ».
- [[ Créer le lien ]], puis les **modèles de message** e-mail et SMS, avec la ligne « Ce lien vous est personnel » et la mention non contractuelle.
- Boutons : copier, e-mail, SMS, plein écran pour le rendez-vous. Le code QR est à construire.

**Page prospect** (`visite.<domaine>/v/‹jeton›`, textes `prospect.*`), pensée pour le mobile :
- en-tête du conseiller : logo, nom, cabinet, téléphone (lien `tel:`), e-mail, rendez-vous ;
- cartouche du lot, message d'accueil, galerie, [[ Entrer dans la visite ]], mode 360° (quand il existe, L4-16), fiche ; visite fluide sur le téléphone du prospect (seuils de L1-14) ;
- bouton collé en bas : « Je suis intéressé, prévenir mon conseiller » ;
- **bandeau de consentement**, seulement si le suivi détaillé est proposé (`MESSAGES.md` § 7.13) : deux boutons identiques ; sans réponse, rien n'est suivi ;
- `prospect.lien_perso`, `prospect.mention`, `prospect.signature`, mentions légales ;
- ni prix, ni superposition du plan du promoteur, ni script de mesure.

**« Je suis intéressé »** : volet de `MESSAGES.md` § 7.9, puis e-mail E15 au conseiller.
- La notification ne part **qu'au conseiller qui a créé le lien**.
- Il n'y a aucune mise en relation (loi Hoguet, `OFFRES.md` § 2.7).

**Mesure.**
- `autorisation_promoteur_declaree` (S), `lien_prospect_cree` (S), `lien_prospect_copie` (N).
- `partage_ouvert` (C), `prospect_consentement_choisi` (S), `prospect_interesse` (S), `conseiller_notifie` (S).

**Cas limites.**
- Lien expiré ou coupé : **à ajouter**, une variante avec les coordonnées du conseiller : « Ce lien n'est plus actif. Contactez ‹Claire Martin› au ‹téléphone›. »
- Lien transféré par le prospect : on ne peut pas l'empêcher ; c'est pour cela que la ligne « Ce lien vous est personnel » est écrite.
- Intégration dans un autre site : refusée (`frame-ancestors 'none'` pour un lien de conseiller).

**Accessibilité et mobile.**
- Le bouton « Je suis intéressé » est visible sans défiler, et atteignable au clavier.
- Le bandeau ne masque pas ce bouton.

```
+------------------------------------+
| [logo] Claire Martin · Cabinet M.  |
| 06 12 34 56 78 · <Prendre rdv>     |
+------------------------------------+
| Visite du lot 23                   |
| Résidence ‹nom›, ‹ville›           |
| Bonjour, voici la visite du        |
| logement dont nous avons parlé.    |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| ~~ séjour ~~~~~~~~~~~~ 1 / 3 ~~~~~ |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| [[ Entrer dans la visite ]]        |
| [ Plan 2D ]  [ Fiche ]             |
| Ce lien vous est personnel.        |
| Illustration non contractuelle.    |
| Visite réalisée avec Sur Pièce     |
+------------------------------------+
| [ Je suis intéressé, prévenir      |
|   mon conseiller ]                 |
+------------------------------------+
```

### B6. Tableau de suivi

**Objectif.** Savoir en un coup d'œil quels lots intéressent, et quels prospects rappeler, sans suivi illicite.

**Ce qui est montré** (`OFFRES.md` § 3.4) :
- **Par lot** : ouvertures (total et 7 derniers jours), date de la dernière ouverture. C'est le compteur agrégé par défaut.
- **Par lien** :
  - nom du lien, date de création, date d'expiration ;
  - « Intéressé le 26/09 à 20 h 14 », déclenché par le prospect ;
  - le détail (durée, pièces vues) seulement si le prospect l'a accepté.
- **Compteur d'ouvertures par lien** (`pro.lien.compteur` : « Ouverte ‹n› fois · dernière ouverture le ‹date› ») : c'est le statut « ouvert » par prospect. `OFFRES.md` § 3.4 ne l'affiche qu'après validation par l'avocat (annexe B, question 5). **Proposition** : le masquer par un réglage jusque-là (écart avec `MESSAGES.md`, § 8.2).
- Actions : copier, prolonger, couper (`pro.lien.couper`), renvoyer. Export en formule Cabinet et au-dessus.
- Explication, **à ajouter** : « Vous voyez le nombre d'ouvertures par lot. Le détail d'un prospect n'apparaît que s'il l'a accepté. »

**Mesure.** `lien_prospect_revoque` (S) ; `suivi_consulte` et `suivi_exporte` (S) **à ajouter**, facultatifs.

```
+------------------------------------------------------------------------+
|  Suivi · Résidence ‹nom›                                [ Exporter ]   |
|  Lot   Ouvertures (7 j)   Dernière     Intéressés                      |
|  23         14 (6)        26/09        1                               |
|  31          3 (0)        18/09        0                               |
|  ----------------------------------------------------------------      |
|  Liens du lot 23                                                       |
|  M. Durand, rdv 12/10   expire 25/12   Intéressé le 26/09 à 20 h 14    |
|                         Détail accepté : 6 min · séjour, chambre 1     |
|  Mme Petit              expire 02/01   —              [ Copier ] [ … ] |
+------------------------------------------------------------------------+
```

### B7. Abonnement, recharges et résiliation

**Objectif.** Passer de l'essai à l'abonnement sans rupture, avec des liens qui restent actifs.

**Pendant l'essai.**
- Bandeau, **à ajouter** : « Essai : ‹9› jours et ‹2› plans restants. »
- E14, trois jours avant la fin.
- Les liens créés pendant l'essai restent actifs 30 jours après sa fin, puis sont réactivés dès l'abonnement (`OFFRES.md` § 3.6).

**Page des formules** (`MESSAGES.md` § 2.7 et § 5.7) :
- choix mensuel ou annuel (« 10 mois payés ») ; trois cartes en **HT** ;
- une ligne factuelle tirée de l'essai, comme dans E14 : « Vous avez utilisé ‹n› plan(s) sur 3 et créé ‹m› lien(s). » Aucune recommandation inventée ;
- l'offre fondateurs, tant qu'elle existe, datée et limitée (`MESSAGES.md` § 2.9) ;
- Stripe Checkout en abonnement : carte ou prélèvement SEPA, SIREN et numéro de TVA préremplis.

**Après.**
- Widget, **à ajouter** : « ‹7› plans disponibles ce mois-ci, dont ‹2› reportés · recharges : ‹5›, valables jusqu'au ‹date› ».
- [ Ajouter 5 plans · ‹45, 40 ou 35› € HT ].

**Résiliation**, en ligne, en trois écrans au plus.
- Effective en fin de période.
- Proposition de la **Veille** à 9 € HT par mois : visites et liens gardés en ligne, sans nouveau plan.
- Sinon, les liens restent actifs 90 jours, avec export.
- Motif facultatif, en liste fermée (`SUIVI.md`, `abonnement_resilie`).

**Mesure.**
- `paiement_ouvert` (S), avec une propriété `formule` **à ajouter**.
- `abonnement_demarre`, `abonnement_renouvele`, `abonnement_modifie`, `abonnement_resilie`, `abonnement_termine` (S).
- `recharge_payee`, `quota_cloture`, `paiement_echoue` (S).

```
+------------------------------------------------------------------------+
|  Choisir votre formule           ( ) Mensuel   (o) Annuel (10 mois)    |
|  +--------------------+ +--------------------+ +--------------------+  |
|  | Solo               | | Cabinet            | | Équipe             |  |
|  | 490 € HT / an      | | 990 € HT / an      | | 1 990 € HT / an    |  |
|  | 5 plans par mois   | | 12 plans par mois  | | 30 plans par mois  |  |
|  | 1 utilisateur      | | 3 utilisateurs     | | 10 utilisateurs    |  |
|  |                    | | couleurs, dossiers | | rôles, réglages    |  |
|  | [ Choisir ]        | | [[ Choisir ]]      | | [ Choisir ]        |  |
|  +--------------------+ +--------------------+ +--------------------+  |
|  Vous avez utilisé 3 plans sur 3 et créé 7 liens.                      |
|  Prix hors taxes, TVA de 20 % en sus. Sans engagement en mensuel.      |
+------------------------------------------------------------------------+
```

### B8. Invitation de collègues

**Objectif.** Partager plans, liens et quota au sein du cabinet.

**Déroulé** (textes **à ajouter**) :
- Sièges : 3 en Cabinet, 10 en Équipe ; utilisateur supplémentaire à 10 € HT par mois.
- Invitation par e-mail, avec un rôle :
  - propriétaire : facturation ;
  - administrateur : réglages et membres ;
  - membre : plans et liens.
- Le lien d'invitation est valable 7 jours ; l'adresse de l'invité est vérifiée à l'acceptation.
- Plus de siège libre : « Toutes les places sont prises. [ Ajouter un utilisateur · 10 € HT par mois ] <Passer à Équipe> ».
- Départ d'un membre : ses liens restent actifs. Un administrateur les rattache à un autre membre, dont les coordonnées remplacent les siennes sur les pages prospects.

**Mesure.** `membre_invite` (S), `membre_rejoint` (S) ; `membre_retire` et `role_modifie` (S) **à ajouter**.

### B9. Personnalisation

**Objectif.** Des pages prospects à l'image du cabinet, sans jamais casser la lisibilité ni la mention.

**Réglages** : une liste fermée, **jamais de consigne libre** envoyée au modèle (`OFFRES.md` § 3.5 ; `MESSAGES.md` § 2.6).

| Réglage | Formule |
|---|---|
| Logo, nom affiché, coordonnées, expiration par défaut des liens | Toutes |
| Couleur d'accent (contrôlée automatiquement), texte d'accueil (280 caractères au plus, filtré), lien de rendez-vous, choix et ordre des photos | Cabinet, Équipe |
| Hauteur sous plafond par défaut quand le plan ne la donne pas (affichée « Hypothèse » dans la fiche), vue d'accueil (galerie, maquette ou visite), photos à produire | Équipe |
| Réglage de lecture sur mesure | Sur devis, vérifié avec `pipeline/evaluer.py` avant activation |

**Écran.**
- Aperçu en direct de la page prospect, sur l'appartement témoin.
- Chaque enregistrement crée une nouvelle version des réglages.
- La marque (logo, couleurs, textes) s'applique à tous les liens. Les réglages de rendu ne valent que pour les plans suivants.

**Textes, à ajouter.**
- Couleur refusée (`MARQUE.md` § 9.3) : « Cette couleur manque de contraste sur fond clair. Nous proposons ‹teinte› : même couleur, plus foncée. Votre couleur d'origine reste dans votre logo. »
- « La mention « illustration non contractuelle » reste affichée sur toutes les pages. »

**Mesure.** `reglage_modifie` (S) ; `couleur_ajustee` (S) **à ajouter**.

```
+------------------------------------------------------------------------+
|  Personnalisation                              Aperçu en direct        |
|  Logo          [ logo-martin.svg ] [ Changer ]  +------------------+   |
|  Nom affiché   [ Cabinet Martin             ]   | [logo] C. Martin |   |
|  Couleur       [ #C8102E ]  Acceptée            | ~~~~~~~~~~~~~~~~ |   |
|  Texte d'accueil                                | ~~ séjour ~~~~~~ |   |
|  [ Bonjour, voici le logement dont nous    ]    | [[ Entrer ]]     |   |
|  [ avons parlé.                            ]    | Je suis intéressé|   |
|  Rendez-vous   [ https://…                  ]   +------------------+   |
|  Ordre des photos   [ Glisser pour ordonner ]                          |
|  La mention « illustration non contractuelle » reste affichée.         |
|  [[ Enregistrer ]]                                                     |
+------------------------------------------------------------------------+
```

---

## 4. Parcours C : promoteur (Sur Pièce Programme)

Vente accompagnée : devis, contrat, virement. Les écrans servent l'import, le contrôle et l'intégration ; la conversion passe par les rendez-vous.

### C1. Demande de démonstration

- **Page `/promoteurs`** : `MESSAGES.md` § 3. Titre retenu : « Chaque lot se visite, pas seulement l'appartement témoin. » Démonstration sur l'appartement témoin fictif **seulement**, jamais sur un programme client sans accord écrit.
- **Formulaire** : `MESSAGES.md` § 3.9, avec la case facultative qui demande aussi le rapport de prise en charge.
- **Deuxième porte** : « Recevoir le rapport de prise en charge » (C2).

**Mesure.** `cta_promoteur_clique` (N), `formulaire_envoye` (N), `contact_promoteur_recu` (S).

### C2. Rapport de prise en charge, offert

**Objectif.** Un devis ferme, sans aucune lecture payée.

**Déroulé** (textes de l'écran **à ajouter**) :
1. Lien sécurisé, puis compte promoteur (lien de connexion). Acceptation des conditions du rapport : usage limité à l'analyse, effacement sous 30 jours sans commande, aucune publication.
2. Dépôt de tous les plans du programme : plusieurs fichiers ou une archive.
3. Pour chaque lot : analyse sans IA et qualification (environ 0,02 $ par lot).
4. Rapport, à l'écran et en PDF :
   - lots pris en charge ;
   - lots non pris en charge, avec la raison : plus de deux niveaux (`niveaux_max = 2`, L4-08), maison, plan illisible, plusieurs logements sur la page ;
   - le devis porte seulement sur les lots pris en charge, à prix ferme.

**Mesure.** `import_cree` (S), `rapport_prise_en_charge_livre` (S), `devis_envoye` (S).

```
+------------------------------------------------------------------------+
|  Rapport de prise en charge · Programme ‹nom›          [ PDF ]         |
|  42 plans déposés · 38 pris en charge · 4 non pris en charge           |
|  Lot   Typologie   Format           Prise en charge                    |
|  A01   T2          PDF vectoriel    Oui                                |
|  A02   T3          PDF vectoriel    Oui                                |
|  B14   T4          PDF vectoriel    Non : plus de deux niveaux         |
|  C03   T2          Image            Oui, échelle à confirmer           |
|  …                                                                     |
|  Devis : 38 lots pris en charge.   [[ Demander le devis ]]             |
+------------------------------------------------------------------------+
```

### C3. Pilote sur un programme

**Déroulé** (`OFFRES.md` § 4.2) :
- La licence sur les plans est signée : fabrication, hébergement et diffusion pour le compte du promoteur, avec garantie de ses droits.
- Bon de commande de 600 € HT pour 40 lots au plus, payé à la commande par virement.
- Critères écrits d'avance :
  - surfaces identiques au tableau ;
  - zéro défaut visible ;
  - délai tenu ;
  - avis de l'équipe commerciale.
- Réunion de lancement. Le programme est créé par nous ou par le promoteur.

**Mesure.** `pilote_signe` (S), puis `pilote_livre` (S), avec `minutes_humaines_par_lot`.

### C4. Import du programme

**Objectif.** Rapprocher chaque plan de son lot et lancer la production sans surveillance.

**Étapes de l'écran** (textes **à ajouter**) :
1. **Plans** : un fichier par lot, en PDF vectoriel de préférence.
2. **Grille des lots**, en CSV : référence, typologie, étage, surface annoncée, nom du fichier. Sinon, les références sont lues dans les noms de fichiers.
3. **Rapprochement** automatique, puis manuel pour ce qui reste.
4. **Récapitulatif** : « 38 lots à produire · livraison visée : 5 jours ouvrés. »
5. **Lancement** en file de basse priorité, avec au plus 4 lectures simultanées par compte.

**PDF de plusieurs lots** (R17). Seul cet import les découpe en lots (L10-02). Partout ailleurs, la qualification refuse « plusieurs lots » (§ 1.6, L6-02), car l'analyse actuelle les empilerait comme des niveaux.

**Garde-fous internes, invisibles pour le client** (`OFFRES.md` § 4.9) :
- budget réservé avant l'import : nombre de lots × 3 $ ;
- arrêt et alerte si le coût moyen dépasse 2,50 $ après 5 lots ;
- un fichier identique déjà lu n'est pas relu.

**Suivi par lot.** En file, en cours, prêt à contrôler, en correction, validé, non pris en charge. Un lot en échec passe à l'équipe (rejeu sans IA, E4) : il n'est jamais facturé tant qu'il n'est pas validé.

**Mesure.** `import_cree` (S) ; `plan_depose` (`canal_depot=import`), `plan_lance`, `plan_pret` par lot ; `import_arrete` (S) ; `import_termine` (S) **à ajouter**.

```
+------------------------------------------------------------------------+
|  Import · Programme ‹nom›                                              |
|  1 Plans (42)   2 Grille (42 lots)   3 Rapprochement   4 Lancement     |
|  ----------------------------------------------------------------      |
|  Lot   Fichier              Grille        État                         |
|  A01   A01-T2.pdf           T2 · 44,1 m²  Prêt à contrôler             |
|  A02   A02-T3.pdf           T3 · 65,0 m²  En cours                     |
|  A03   —                    T3 · 63,8 m²  [ Associer un fichier ]      |
|  B14   B14-T4.pdf           T4 · 88,2 m²  Non pris en charge           |
|  38 lots à produire · livraison visée : 5 jours ouvrés                 |
|  [[ Lancer la production ]]                                            |
+------------------------------------------------------------------------+
```

### C5. Contrôle des lots

**Objectif.** Valider vite les lots sans écart ; corriger précisément les autres.

**Déroulé** (textes **à ajouter**) :
- **Avant livraison**, l'équipe relit chaque lot : 5 minutes visées, à mesurer au pilote (E4).
- **Chez le promoteur**, par lot :
  - la visite ;
  - les surfaces comparées à **sa grille**, avec un libellé « Écart » ;
  - les points à confirmer ;
  - [ Valider ] ou [ Demander une correction ], avec un formulaire structuré : pièce, type de défaut (`type_defaut` de `SUIVI.md`), commentaire.
- **Validation groupée** : [[ Valider les 31 lots sans écart ]].
- Compteur de cycles, 2 inclus, et date limite de contrôle, 10 jours après la livraison. Les cycles ne comptent que les **demandes de modification** du promoteur ; un défaut de notre fait est corrigé gratuitement, hors cycles (R14).

**Mesure.** `lot_valide`, `lot_correction_demandee`, `lot_corrige`, `programme_valide` (S) **à ajouter**.

```
+------------------------------------------------------------------------+
|  Contrôle · Programme ‹nom› · cycle 1 sur 2 · jusqu'au 10/10           |
|  31 lots sans écart   [[ Valider les 31 lots sans écart ]]             |
|  ----------------------------------------------------------------      |
|  Lot A07 · T3                          [ Ouvrir la visite ]            |
|  Pièce       Visite    Votre grille                                    |
|  Séjour      27,9 m²   27,9 m²                                         |
|  Chambre 2   10,2 m²   10,6 m²   Écart                                 |
|  [ Valider ]   [ Demander une correction ]                             |
+------------------------------------------------------------------------+
```

### C6. Publication et intégration

**Objectif.** Mettre les visites sur le site du promoteur, sans rien ouvrir à d'autres sites.

**Déroulé** (textes **à ajouter**) :
1. Choix des lots à publier ; la page du programme liste les lots, avec des filtres.
2. **Domaines** : ajout de `www.promoteur.fr`, vérifié par un enregistrement DNS TXT ou un fichier. Tant qu'un domaine n'est pas vérifié, la visite refuse de s'y afficher. Les domaines vérifiés alimentent `frame-ancestors` (`ARCHITECTURE.md` § 6.2).
3. **Code d'intégration** : un `iframe` par lot ou par programme, à copier ; options de vue d'accueil, de logo et de couleurs.
4. **Événements `postMessage`** (`visite:ouverte`, `visite:piece`), documentés pour que le promoteur mesure sous sa propre plateforme de consentement. Aucun traceur dans l'iframe (`SUIVI.md` § 3.16).
5. **Liens** :
   - lien acquéreur par lot (« offert par ‹promoteur› »), à envoyer au réservataire ;
   - liens pour la force de vente.
6. **Superposition** de son propre plan : permise ici, puisqu'il en a les droits. Réglage explicite.
7. **Aperçu de l'intégration** : une page de test montre le rendu dans une iframe.

**Textes clés, à ajouter.**
- Domaine non vérifié, dans l'iframe : « Cette visite ne peut pas s'afficher sur ce site. »
- Vérification : « Ajoutez cet enregistrement à votre domaine. Nous le vérifions automatiquement et vous prévenons par e-mail. »

**Mesure.**
- `domaine_verifie` (S), `lien_acquereur_cree` (S), `cle_api_creee` (S), `integration_ouverte` (C).
- `domaine_ajoute`, `programme_publie`, `integration_copiee` (S) **à ajouter**.

```
+------------------------------------------------------------------------+
|  Intégration · Programme ‹nom›                                         |
|  Domaines autorisés                                                    |
|  www.promoteur.fr        Vérifié le 27/09                              |
|  ventes.promoteur.fr     En attente : ajoutez l'enregistrement DNS     |
|  [ Ajouter un domaine ]                                                |
|  ----------------------------------------------------------------      |
|  Code à copier (lot A07)                                               |
|  <iframe src="https://visite.<domaine>/i/‹jeton›" …></iframe>          |
|  [[ Copier le code ]]   [ Voir l'aperçu ]   <Événements postMessage>   |
|  Aucun traceur dans la visite. Mesurez sous votre propre bandeau.      |
+------------------------------------------------------------------------+
```

### C7. Facturation

- **Pilote** : payé à la commande ; déduit de la commande suivante si elle est signée dans les 3 mois.
- **Au lot** : facture mensuelle des lots livrés et validés, au palier des 12 mois glissants (25, 20 ou 15 € HT). Commande minimale : 10 lots ou 250 € HT.
- **Hébergement** : 24 mois inclus, puis 3 € HT par lot et par an. **Nouvelle version d'un lot** : 50 % du prix, 10 € HT au moins.
- Virement à 30 jours. Facture électronique par plateforme agréée : obligatoire en émission au plus tard le 01/09/2027.
- Page « Factures » : liste, PDF, état du paiement, rapport mensuel de disponibilité (engagement de 99,5 %).

**Mesure.** `commande_signee` (S) ; `facture_emise` et `facture_payee` (S) **à ajouter**, facultatifs si l'outil comptable les suit déjà.

---

## 5. Parcours D : marque blanche

### D1. Codes à offrir (en premier)

**Pour qui** (`OFFRES.md` § 5.1, `MESSAGES.md` § 4.2) : conseillers, courtiers, services d'accompagnement VEFA, promoteurs qui offrent la visite à leurs acquéreurs.

**Côté partenaire.**
- Commande de codes :
  - par 10 à 15 € HT, par carte, depuis un compte Pro ;
  - dès 50 à 12 € HT, sur facture.
- Il reçoit la liste des codes, un lien de page co-marquée et un modèle de carte à imprimer.
- Tableau : codes utilisés et non utilisés, avec la date d'utilisation. **Aucun accès** au plan ni aux données du bénéficiaire.

**Côté bénéficiaire** (textes de la page **à ajouter**).
- Page co-marquée « Offert par ‹partenaire› ». Le lien peut porter le code prérempli.
- Saisie du code, puis le parcours A2 à A7 à l'identique.
- Plan **complet** d'emblée, visite comprise.
- Pas de case de renonciation, faute de paiement. La case d'écart consenti et les CGU restent.
- Erreurs, **à ajouter** : code inconnu, déjà utilisé, expiré.

Le même écran sert aux **codes testeurs**, valables 60 jours (`OFFRES.md` § 2.2).

**Mesure.** `codes_achetes` (S), `code_utilise` (S), `credit_offert_attribue` (`source_lot=testeur`) ; `code_refuse` (S) **à ajouter**.

```
+------------------------------------+
| [logo partenaire]                  |
| Offert par Courtage Dupont         |
+------------------------------------+
| Votre visite est offerte           |
| Plan 2D coté, maquette 3D, visite  |
| et photos de votre logement neuf.  |
| Code   [ ABCD-EFGH ]               |
| [[ Utiliser mon code ]]            |
| Un ou deux niveaux (duplex) ·      |
| logement vide · non contractuel    |
| Visite réalisée avec Sur Pièce     |
+------------------------------------+
```

### D2. Instance en marque blanche

**Quand.** Seulement après 3 conseillers payants, un pilote promoteur réussi et une lettre d'intention signée ; une instance à la fois (`OFFRES.md` § 5.6).

**Mise en service, en liste de contrôle.** Chaque ligne a son contrôle automatique.
1. Contrat, DPA, licence de la marque du client.
2. Domaine `visite.client.fr` en CNAME, certificat émis automatiquement.
3. Logo, nom affiché, favicon ; couleur d'accent contrôlée (`MARQUE.md` § 9.3).
4. Expéditeur des e-mails (SPF, DKIM, DMARC), vérifié par un envoi de test.
5. Bandeau de consentement du client, ou le nôtre à ses couleurs.
6. Mentions légales du client, qui est l'éditeur de la page.
7. Domaines autorisés pour l'intégration.
8. Recette sur 3 plans d'essai.
9. Mise en service ; support de premier niveau chez le client.

**Ce qui ne change pas.**
- La mention non contractuelle reste, non désactivable.
- La signature « Visite réalisée avec Sur Pièce » est présente par défaut, retirable pour 150 € HT par mois (`MESSAGES.md` § 8.5).
- Les parcours des utilisateurs du client sont ceux de B, à ses couleurs. Au lancement, aucune vente aux particuliers sous la marque du client : « on ne facture que le client » (`OFFRES.md` § 5.3).

**Mesure.** `lettre_intention_signee`, `instance_creee`, `domaine_verifie`, `mention_retrait_active` (S) ; `instance_etape_validee` (S) **à ajouter**.

---

## 6. Parcours E : administration interne

**Principes** (`ARCHITECTURE.md` § 6.7).
- Accès réservé aux rôles `support` et `admin`, avec double authentification.
- **Tout accès aux données d'un client demande un motif**, écrit dans `journal_equipe`.
- Aucun export en masse des données des clients.
- Les textes techniques ne sont visibles qu'ici.

### E1. Rechercher un compte

- Recherche par e-mail, organisation, SIREN, identifiant interne de plan, identifiant Stripe (paiement ou client), ou lien de partage collé par un client (retrouvé par son empreinte).
- Motif demandé à l'ouverture, en liste fermée plus un texte : demande du client, défaut signalé, échec, litige, anti-abus.

### E2. Voir un compte

- Identité, organisation(s), offre, abonnement.
- Consentements et acceptations : versions et dates.
- **Grand livre** : lots (source, reste, expiration) et mouvements (nature, clé d'idempotence, acteur, motif).
- Achats, avec leurs liens vers Stripe ; plans ; partages (nombre, révocations).
- Signaux anti-abus : e-mail normalisé, plans offerts depuis la même adresse IP en 24 h.
- Notes internes.
- **Actions** : renvoyer un lien de connexion, rendre un plan, geste commercial, rembourser, suspendre, supprimer (RGPD), exporter pour le client.

### E3. Voir ses plans et ses coûts

**Par plan.**
- Chronologie des étapes, avec leurs durées.
- Appels IA : modèle, jetons, coût, statut, clé.
- Coût total face au budget de 3 $.
- Verdict de la vérification avant livraison, avec la liste des problèmes en texte technique, pour l'équipe seulement.
- Version du moteur, partages, défauts signalés.

**Vue d'ensemble** : par jour, par offre et par clé (`SUIVI.md` § 5.5).
- Coût par plan (médiane et 9e décile), part d'échecs.
- Budget du gratuit consommé.
- Seuils de pilotage de `OFFRES.md` § 8.11, avec leurs alertes.

### E4. Rejouer sans repayer

- Travail `rejouer`, lancé avec `ia_autorisee = false` : tout appel IA lève une erreur au lieu de payer (`ARCHITECTURE.md` § 5.6).
- Choix de la version du moteur.
- La vérification avant livraison est repassée ; la publication n'est remplacée que si elle réussit.
- Rien n'est décompté au client. L'e-mail « Votre visite est corrigée » (E12) est facultatif.
- **Relancer avec IA** : rôle `admin` seulement, une fois au plus par travail, avec motif et coût estimé affiché.
- La relecture d'un lot promoteur avant livraison se fait depuis le même écran (C5), minutée pour mesurer les 5 minutes visées.

### E5. Rendre un plan, geste commercial, remboursement

- **Rendre un plan** : libération sur le lot d'origine, trouvé automatiquement. Motif obligatoire, e-mail au client en option.
- **Geste commercial** : nouveau lot de source `geste_commercial` (`OFFRES.md` § 6.2), avec une quantité et une validité de 12 mois.
- **Remboursement** : retrait des plans non utilisés du lot, puis remboursement Stripe de la ligne, puis e-mail.
- Chaque action a sa clé d'idempotence : un double clic ne rend rien deux fois.

### E6. Défauts signalés, retraits, suppressions

**Défauts signalés.**
- File d'attente, avec la position enregistrée, la pièce, le type et l'échéance à 5 jours ouvrés.
- Actions : reproduire, corriger (rejouer après le correctif), répondre (E12), rembourser.
- **Un défaut ne peut être clos « corrigé » qu'avec le lien vers le contrôle automatique ajouté** (`CLAUDE.md` ; `defaut_traite` porte `controle_ajoute`).

**Autres actions.**
- Notification d'un titulaire de droits (DSA art. 16) : suspension du partage ou de la publication, avec une décision motivée.
- Demandes RGPD : export, suppression.
- Alertes d'abus : par domaine d'e-mail, par adresse IP.

**Mesure.**
- Dans `journal_equipe` : `ouvrir_compte`, `ouvrir_plan`, `rejouer`, `relancer_ia`, `rendre_credit`, `geste`, `rembourser`, `suspendre_partage`, `supprimer_compte`.
- Dans le journal : `plan_rejoue`, `credit_rendu`, `achat_rembourse`, `defaut_traite`.

```
+------------------------------------------------------------------------+
| ÉQUIPE · Plan 3f2a…  (motif : défaut signalé)       Organisation : ‹…› |
+------------------------------------------------------------------------+
|  Étapes          Durée    État        Appels IA   Coût                 |
|  analyse          6 s     réussi       —          —                    |
|  qualification    9 s     réussi       1          0,02 $               |
|  lecture        612 s     réussi       6          1,41 $               |
|  vérification     14 s    1 problème   —          —                    |
|  photos         410 s     réussi       —          —                    |
|  Total 1,43 $ sur un budget de 3 $ · moteur v12                        |
|  Défaut signalé : porte à l'envers · chambre 2 · échéance 03/10        |
|  [[ Rejouer sans IA ]]  [ Rendre le plan ]  [ Rembourser ]  [ Ouvrir ] |
+------------------------------------------------------------------------+
```

---

## 7. Leviers de conversion à tester

### 7.1 Méthode

- **Avant le compte (visiteurs anonymes).**
  - L'outil d'auto-évaluation de la CNIL range « toute création de cohorte d'utilisateurs pour leur présenter des contenus différenciés » hors de l'exemption (`recherche/suivi.md` § 2.2).
  - On teste donc **par périodes successives** : A, puis B, puis A, par semaines entières, avec une annotation dans Umami à chaque changement (`SUIVI.md` § 4.7). Pas de cookie de cohorte. C'est aussi la méthode des titres de `MESSAGES.md` § 1.1.
  - Tirer au sort parmi les seuls visiteurs qui ont consenti biaiserait l'échantillon : à éviter.
- **Après le compte.**
  - Les tests **de textes et de présentation** peuvent être tirés **côté serveur**, sur l'identifiant du compte, écrit dans le journal (R8).
  - Rien n'est lu sur l'appareil au-delà du cookie de session.
  - Base légale proposée : intérêt légitime, avec une information dans la politique de confidentialité. **À valider par l'avocat.**
- **Prix : toujours par périodes**, avec le même prix pour tous pendant une période : 3 semaines ou environ 150 aperçus (`OFFRES.md` § 9.1, L221-5). **Jamais un prix différent tiré au sort par personne** (R8). La propriété `periode_prix` les distingue ; une période = une version d'offre du catalogue, publiée sans déploiement (L5-08, L8-06).
- **Pas de test de prix pendant la bêta fermée** : rien n'est vendu avant L8-07 (R13).
- Tickets : prix, L8-06 ; vitrine, L12-05 ; mesure, L7-04 à L7-06.
- **Un seul test à la fois** par étape de l'entonnoir.
- **Garde-fous surveillés à chaque test** : défauts signalés, remboursements, litiges, part d'échecs, questions au support.
- **Taille.** Ordre de grandeur, calculé et non mesuré : pour voir un passage de 10 % à 15 % (risque de 5 %, puissance de 80 %), il faut environ **690 personnes par variante**. Aux volumes du lancement, seuls les écarts importants seront visibles. On décide donc sur :
  - le sens de l'effet ;
  - les garde-fous ;
  - les retours des testeurs (T2).

### 7.2 Tests proposés

| # | Levier | Hypothèse | Variantes | Mesure principale | Méthode | Décision |
|---|---|---|---|---|---|---|
| L1 | Ordre des méthodes de connexion | Google en premier réduit la perte entre le dépôt et le compte vérifié, surtout sur mobile | A : e-mail d'abord ; B : Google d'abord | `compte_cree` ÷ `depot_provisoire_recu` | Périodes | Garder la meilleure. Obligatoire si la perte dépasse 40 % (`OFFRES.md` T5) |
| L2 | Code à 6 chiffres mis en avant | Le code évite l'abandon quand le lien s'ouvre dans un autre navigateur | A : lien, code en secours ; B : code d'abord | `compte_cree` ÷ `lien_magique_envoye`, par `meme_appareil` | Périodes | Garder B si le gain est net sur mobile |
| L3 | Place de « Où en êtes-vous ? » | La poser pendant l'attente allège l'inscription sans perdre de réponses | A : à l'inscription (`MESSAGES.md` § 7.3) ; B : pendant l'attente | `compte_cree` ÷ `inscription_ouverte` ; taux de réponse à `situation_declaree` | Périodes | B si l'inscription gagne et que le taux de réponse reste utile pour T11 |
| L4 | Visite témoin pendant l'attente | Voir ce que débloque la visite augmente le déblocage | A : bouton mis en avant ; B : simple lien | `achat_paye` (`depuis_apercu`) ÷ `apercu_pret` | Tirage par compte | Garder la meilleure |
| L5 | Contenu de l'aperçu | Le 360° d'arrêt en arrêt, ou une vue du dessus qui tourne, donne envie de la visite | A : vue du dessus, plan 2D et 2 photos (R1) ; B : visite 360° en images, sans moteur ni `plan.json` (décision de principe n° 15, L6-13), ou vue du dessus qui tourne (L13-03). Sans objet pour le 360° si l'utilisateur en fait l'offre gratuite pour tous | Conversion de l'aperçu | Tirage par compte | À coût égal, la meilleure (`OFFRES.md` § 9.1) |
| L6 | Ordre de l'aperçu | Mettre en tête ce qui protège l'acheteur renforce la confiance | A : images d'abord ; B : points à confirmer d'abord | Conversion de l'aperçu, `verrou_clique` | Tirage par compte | Garder la meilleure |
| L7 | Forme du verrou | Le prix sur le bouton évite la surprise ; le volet sans prix attire plus de clics | A : `verrou.bouton` (« Débloquer la visite · 29 € ») ; B : « Débloquer la visite », prix dans le volet | `verrou_clique`, `volet_deblocage_ouvert`, `achat_paye` | Tirage par compte | Selon les achats, pas les clics (`OFFRES.md` T4) |
| L8 | Prix de la visite | La marge par aperçu est plus haute à 39 € | 29 € puis 39 € ; 19 € si la conversion est très faible | Marge par aperçu = (ventes × marge − coût des aperçus) ÷ aperçus | Périodes (R8, L8-06) | Le prix qui maximise la marge par aperçu (`OFFRES.md` § 9.1) |
| L9 | Pack « Comparer 3 lots » | Le pack sert ceux qui hésitent entre plusieurs lots | A : volet à deux choix ; B : un seul choix | Part du pack dans les ventes, revenu par acheteur | Périodes | Moins de 10 % des ventes : retiré |
| L10 | Partage de l'aperçu | Inviter à montrer l'aperçu crée des dépôts | A : lien discret ; B : bloc `apercu.partage` mis en avant | `partage_cree` (`apercu`) ; `partage_cta_clique` ; arrivées sur `/offert` | Tirage par compte (création) ; périodes (arrivées) | Garder B si les dépôts venus d'un partage progressent (T10) |
| L11 | Bouton d'E3 sur mobile | Voir l'aperçu sans connexion augmente la conversion | A : lien d'aperçu direct ; B : connexion d'abord | `achat_paye` ÷ `email_envoye` (`apercu_pret`) | Tirage par compte | Garder la meilleure |
| L12 | Continuer sur ordinateur | Certains préfèrent payer et visiter sur grand écran | A : rien ; B : [ M'envoyer le lien par e-mail ] | Achats sur ordinateur après un aperçu vu sur mobile | Tirage par compte | Garder B si l'effet est net |
| L13 | Première session pro | Envoyer le lien témoin à soi-même crée le déclic plus tôt | A : tableau vide et E13 ; B : témoin préchargé et liste des 4 étapes | `lien_prospect_cree` sous 24 h ; `abonnement_demarre` (`depuis_essai`) | Tirage par compte | Garder B si l'activation progresse |
| L14 | Carte à l'essai pro | La carte demandée filtre les essais sans intention | A : sans carte ; B : carte demandée | Essai → abonnement, essais par semaine | Périodes | Tester B seulement si A convertit à moins de 10 % (`OFFRES.md` § 9.1) |
| L15 | Prix Solo | 69 € ne freine pas les cabinets qui vendent vraiment du neuf | 49 € puis 69 € HT | Essai → abonnement, marge par essai | Périodes (cohortes datées) | Selon la marge par essai |
| L16 | Porte d'entrée pro | La démonstration en direct convainc mieux les CGP que l'essai seul | A : essai en action principale ; B : démonstration en action principale | Abonnements à 30 jours par visiteur de `/pro` | Périodes | Garder la meilleure ; à croiser avec les entretiens T6 |
| L17 | Rappel d'un aperçu non débloqué | Un seul rappel, 3 jours après l'aperçu, fait revenir ceux qui hésitent | A : aucun ; B : un rappel | `achat_paye` sous 14 jours | Tirage par compte, **seulement parmi ceux qui ont accepté les rappels**, par une case recueillie hors de l'inscription (dans le compte) | Garder B si les désinscriptions restent faibles. L'exception « client » pour un service gratuit est à valider (`OFFRES.md` T11) |

Les titres de pages de `MESSAGES.md` (§ 1.1, § 2.1, § 3.1) ont leurs propres tests par périodes ; ils ne sont pas repris ici.

Les leviers mesurés sur les achats (L4 à L9, L11, L12, L17) supposent la vente ; ceux de l'arrivée et de l'inscription (L1 à L3, L10), le dépôt ouvert à tous et la mesure (L7-04). Aucun ne tourne pendant la bêta fermée (R13). L13 à L16 supposent l'offre pro en ligne (lot 9, R21).

---

## 8. Annexes

### 8.1 Événements à ajouter à `SUIVI.md`

Les parcours utilisent le dictionnaire de `SUIVI.md` § 3. Il leur manque :

| Événement ou propriété | Côté | Déclencheur | Étape |
|---|---|---|---|
| `page_pdf_changee` | N | Autre page choisie dans un PDF de plusieurs pages | A3 |
| `depot_doublon` | S | Plan déjà présent dans l'organisation | § 1.6 |
| `remboursement_demande` | S | Bouton « Être remboursé », s'il est retenu | A15 |
| `checklist_etape_faite` | S | Étape de prise en main pro faite (`etape`) | B3 |
| `suivi_consulte`, `suivi_exporte` | S | Tableau de suivi ouvert ou exporté (facultatifs) | B6 |
| `membre_retire`, `role_modifie` | S | Gestion des membres | B8 |
| `couleur_ajustee` | S | Couleur d'accent corrigée automatiquement | B9 |
| `import_termine` | S | Fin d'un import hors pilote (`lots_ok`, `lots_echec`) | C4 |
| `lot_valide`, `lot_correction_demandee`, `lot_corrige`, `programme_valide` | S | Contrôle des lots par le promoteur | C5 |
| `domaine_ajoute`, `programme_publie`, `integration_copiee` | S | Publication et intégration | C6 |
| `facture_emise`, `facture_payee` | S | Facturation des promoteurs (facultatifs) | C7 |
| `code_refuse` | S | Code inconnu, déjà utilisé ou expiré (`motif`) | D1 |
| `instance_etape_validee` | S | Étape de mise en service d'une instance | D2 |
| Propriété `meme_appareil` sur `compte_cree` | S | Lien ou code utilisé sur l'appareil du dépôt, ou non | A5, L2 |
| Propriété `temoin` sur `lien_prospect_cree` | S | Lien créé sur l'appartement témoin | B3, L13 |
| Propriété `formule` sur `paiement_ouvert` | S | Paiement d'un abonnement ou d'une recharge | B7 |
| Valeurs `plusieurs_fichiers` et `heic` pour `depot_fichier_refuse` | N | Refus dans le navigateur | § 1.6 |
| Valeurs `maison`, `plusieurs_lots`, `peu_lisible` pour `motif_refus` ou `resultat` | S | Refus ou alerte de la qualification | § 1.6 |
| Valeur `mes_plans` pour `emplacement` | N | Bouton « Ajouter un plan » | A14 |
| Fin des images de l'aperçu, avec le nombre d'images publiées et omises : **ajouté** à `SUIVI.md` sous le nom `photos_pretes` | S | Toutes les images arrivées ou omises, ou délai maximal atteint (proposition de L5-11) | A7, A9, A15 |

### 8.2 Écarts à reporter dans les autres documents

État au 27/09/2026 : **résolu par Rn** quand un arbitrage a tranché (le document visé reste à corriger par son responsable), **ouvert** sinon.

| Document | Écart | Proposition | État |
|---|---|---|---|
| `OFFRES.md` § 0.1, § 2.2, § 2.4, § 3.3, § 4.4, § 6.4 ; `MESSAGES.md` § 1.8, § 2.3, § 3.3, § 5.2, § 7.6, § 7.7 (relevé de L0-04) | « Environ 11 photos », « 8 autres photos », photos « rendues au déblocage », `verrou.ouvert` « Les autres photos arrivent… », `verrou.photo` | Aperçu : vue du dessus 3D découpée, plan 2D coté, 2 photos, surfaces, points à confirmer. Visite débloquée : marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage, plus les mêmes images. Aucun nombre de photos promis ; galerie complète avec L13-02 | **Résolu par R1.** Corrigé ici en A1, A3, A9 à A12 et B5 |
| `OFFRES.md` § 2.2 | « Vue d'ensemble plongeante » ; photos « le séjour et la pièce principale » | Vue du dessus 3D découpée ; séjour, puis chambre principale ou, à défaut, pièce principale suivante (règle dans L4-09) | **Résolu par D5 et R1** |
| `OFFRES.md` § 0.2 et § 6.4, `ARCHITECTURE.md` § 2.3 ; ancien A9 de ce document | Consommation après « photos marquées » ; publication bloquée si une image manque | Vérification avant livraison obligatoire ; aperçu publié dès la vue du dessus et le plan 2D ; photo en échec omise, alerte, sans blocage ; plan offert consommé à la publication de l'aperçu ; déblocage sans nouvelle lecture | **Résolu par R2** |
| `ARCHITECTURE.md` M3.2 | Verrou d'interface (`publications.offre = 'simple'` masque `g-cta`) | Verrou serveur : rien de la visite n'est envoyé pour l'aperçu, ni moteur ni `plan.json` | **Résolu par R4** |
| `OFFRES.md` § 2.2 ; `ARCHITECTURE.md` § 5.7 et L5-23 | Empreinte « de la page rendue » d'un côté, « de la source » de l'autre | Les deux empreintes, fichier et page rendue | **Résolu par R22** (L6-06) |
| `MESSAGES.md` § 0.3 et textes qui citent un délai | « Un quart d'heure environ » | Marqueur `‹délai›` jusqu'à la mesure T0 en production | **Résolu par R12** (L5-11) |
| `MESSAGES.md` § 7.13 | Bandeau seulement quand une mesure publicitaire est branchée | Bandeau dès qu'un traceur non exempté est activé : UTM enrichis, relecture de session, publicité | **Résolu par R18**, à confirmer en L0-05 (L7-02) |
| `MESSAGES.md` § 7.6 ; `erreur.offert_deja_utilise`, `erreur.offert_meme_plan`, `depot.reconnu.bouton_payant` | Volet de déblocage et refus du plan offert qui proposent 29 € | Pendant la bêta, variantes sans achat ni « bientôt » (A9, A10, § 1.6) | **Résolu par R13** ; textes écrits (`MESSAGES.md` § 7.6 `verrou.volet.beta`, § 7.12 `erreur.offert_*.beta`), relecture de l'avocat (`MESSAGES.md` § 12.3) |
| Tickets L6-01 et L6-10 | Bêta réservée à une liste d'e-mails invités | Accès par code d'invitation ; variante « bêta » dans le catalogue | **Résolu par R13** ; tickets alignés |
| `OFFRES.md` § 2.2 | Clé OpenRouter « offert » ; clé des essais pros non dite | Clé « gratuit » pour le seul plan offert des particuliers ; essais pros sur la clé « payant », budget de leur organisation | **Résolu par R23** |
| `moteur/ui.js` | « Rendu photoréaliste de la vue » et case de superposition visibles en mode simple ; messages qui citent la bibliothèque 3D et son adresse | Mode simple : masquer les deux (L4-11) ; messages du catalogue, `erreur.3d` (L4-10) | **Résolu par R16.** Réglages de soleil : ouvert (§ 8.3, question 13) |
| `ARCHITECTURE.md` § 2.3 et § 5.1 | Le dépôt n'y existe qu'après la création du plan dans un compte ; `SUIVI.md` prévoit déjà `plan_depose` sans connexion | Ajouter un **dépôt provisoire anonyme** : espace privé, effacé à 24 h, analyse sans IA seulement, 10 analyses par heure et par IP, rattaché au compte à la vérification de l'e-mail | **Résolu** : ticket L5-23, reporté dans `ARCHITECTURE.md` § 2.3 (étape 1) et § 4.2 (`depots_provisoires`) |
| `OFFRES.md` § 6.4 | Réservation « au lancement, qualification réussie » | Quand une calibration est nécessaire, réserver après la cote validée (comme le dit déjà E5) | Ouvert. R2 fixe la consommation, pas la réservation |
| `OFFRES.md` § 2.1, `MESSAGES.md` § 7.3 | « Où en êtes-vous ? » dans le volet d'inscription | La déplacer sur l'écran d'attente ; à trancher par L3 | Ouvert (L0-05) |
| `OFFRES.md` § 2.6 | E-mail « votre crédit vous a été rendu » | Aligner sur `MESSAGES.md` : « rien n'a été décompté » | Résolu (27/09) |
| `MESSAGES.md` § 1.1 | Le premier écran dit « Premier plan offert, sans carte bancaire » sans dire ce qu'il contient ni le prix de la visite | Ajouter : « vue du dessus 3D, plan 2D coté et 2 photos. La visite s'ouvre ensuite pour 29 €. », seulement après l'ouverture de la vente | Contenu fixé par R1, prix par R13 ; ajout du texte ouvert |
| `MESSAGES.md` § 7.4 | Aucun texte pour l'apparition des images pendant l'attente | Ajouter « Votre appartement est sorti de terre » et les textes alternatifs des images (L6-03) | **Résolu** : `attente.image.*` dans `MESSAGES.md` § 7.4 |
| `MESSAGES.md` (adresses) et `SUIVI.md` § 2.6 | `/offert` et `/pro/decouvrir`, utilisées par `SUIVI.md` et ce document, ne figurent pas parmi les adresses de `MESSAGES.md` | Les ajouter à `MESSAGES.md`, ou les remplacer par une adresse de `MESSAGES.md` | **Résolu** : ajoutées à `MESSAGES.md` § 0.9 (R9) |
| `MESSAGES.md` § 7.3 et E1 | Pas de code à 6 chiffres | Ajouter le code dans E1 et un champ sur l'écran « Vérifiez votre boîte e-mail » (A5) | **Résolu dans les textes** (`compte.envoye.code.*`, E1) ; la mise en œuvre dépend de l'authentification (D8, L0-02) |
| `MESSAGES.md` E6 | Remboursement en répondant à l'e-mail | Bouton en un clic (A15), à trancher | Ouvert |
| `MESSAGES.md` `pro.lien.compteur` | Ouvertures affichées par lien | `OFFRES.md` § 3.4 : compteur par lot par défaut, statut par lien après avis de l'avocat | Ouvert |
| `MESSAGES.md` `erreur.pro.siren_essai` | Seule issue : choisir une formule | Ajouter l'invitation par un collègue déjà inscrit | Ouvert |
| `SUIVI.md` `partage_cta_clique` | Valeur `prospect` de `type_page` : une invitation sur la page d'un conseiller | Sur la page d'un conseiller, seulement la signature vers `/pro/decouvrir` ; pas d'invitation « plan offert » | Ouvert |
| `pipeline/accueil.html` | Étape « Visite de contrôle » ; promesse de notification onglet fermé ; détail technique affiché ; repères `#e33` ; pas de mouvement réduit (depuis le 27/09/2026, le détail technique n'est plus montré qu'avec `?debug=1`) | Textes de `MESSAGES.md` § 7.4 ; e-mail côté serveur ; catalogue ; Bleu plan ou Brique ; `prefers-reduced-motion` (relevés aussi par `MARQUE.md` § 12 et `recherche/audit-code.md`) | Ouvert : L1-05 (textes, promesse) ; le nouvel écran est L6-03, dans `service/`, sans modifier `accueil.html` |
| `OFFRES.md`, `MESSAGES.md`, tickets L6-05, L8-01, L8-02 | Aperçu = images de R1 ; visite = moteur et `plan.json` seulement | 360° dans toutes les visites, probablement gratuit ; qualité adaptative et précalcul serveur ; rendu en direct sur le serveur écarté | Ouvert : décisions n° 12 à 15 du 27/09/2026, reportées dans `OFFRES.md` et `MESSAGES.md` (textes [SI LIVRÉ]) ; gratuité du 360° à confirmer (L1-16) |

### 8.3 Questions ouvertes

Les numéros ne changent pas : des tickets les citent (L6-01 : question 6 ; L6-10 : question 4). Les questions ajoutées le 27/09/2026 suivent, à partir de 10.

**Pour l'utilisateur.**
1. « Où en êtes-vous ? » : à l'inscription ou pendant l'attente (L3) ? **Ouvert** (L0-05).
2. Le bouton d'E3 : lien d'aperçu direct ou connexion d'abord (L11) ? **Ouvert.**
3. Le remboursement : bouton en un clic, ou réponse à l'e-mail (A15) ? **Ouvert.**
4. Les testeurs reçoivent-ils un plan complet ou l'aperçu (`OFFRES.md` § 2.2) ? **Ouvert** : R13 prévoit une variante « bêta » du catalogue qui permet les deux ; le choix se fait en L0-04.
5. La création de l'appartement témoin fictif, dont dépendent l'accueil, la page pro, la première session pro et les démonstrations (`MARQUE.md` § 8.2). **Résolu par R11** : plan fictif créé par nous, versionné dans `references/temoin/` ; dessin L1-03, relevé et lecture gardée L1-12.

**Pour l'avocat** (en plus de `OFFRES.md` annexe B et `MESSAGES.md` § 12.3).
6. Copie du fichier dans le navigateur (IndexedDB) et dépôt provisoire anonyme de 24 h : exemption de consentement (stockage strictement nécessaire) et information suffisante ? **Ouvert.**
7. Tirage A/B côté serveur pour les comptes connectés : l'intérêt légitime suffit-il ? **Ouvert** : R8 autorise ce tirage pour les tests de textes (jamais pour un prix) ; la base légale reste à valider.
8. Rappel d'un aperçu non débloqué (L17) : faut-il une case, ou l'exception « client » vaut-elle pour un service gratuit ? **Ouvert.**
9. Case d'autorisation du promoteur : la demander dès la génération du premier plan d'un programme, puisque produire la maquette est déjà une adaptation, plutôt qu'au premier lien (`OFFRES.md` § 3.8) ? **Ouvert.**

**Pour l'utilisateur, ajoutées le 27/09/2026.**
10. Vue du dessus ou plan 2D impossibles après nouvelles tentatives : R2 empêche alors la publication de l'aperçu. Quel message, quel e-mail, et quelle suite (proposition en A15 : relance sans IA, puis échec sans rien décompter) ? À fixer dans L5-11.
11. Code d'invitation de la bêta (R13) : saisi sur l'écran des codes (D1), ou prérempli dans le lien de l'invitation ? L6-01 et L6-10 prévoient les deux ; le choix reste à faire.
12. Pendant la bêta, où mènent `partage.invitation` et `partage.pro` des pages de destinataire (A13) ? Proposition : liste d'attente et entretien pro.
13. Réglages de soleil masqués aussi en mode simple, en plus de ce que fixe R16 (A12) ?
14. Découpe de la vue du dessus : coupe horizontale à 1,20 m ou retrait des plafonds, à choisir sur les captures des références (L4-09).
15. Texte du volet de déblocage pendant la bêta (A10), sans achat : écrit dans `MESSAGES.md` § 7.6 (`verrou.volet.beta`), à faire relire (L0-07).
16. Visite 360° : devient-elle l'offre gratuite, à la place de l'aperçu de R1 ou en plus ? Réponse après la mesure de son coût de rendu (L1-16).
17. Le 360° sert-il de repli quand la 3D ne démarre pas (sans WebGL, perte de contexte) ?
18. Précalcul serveur : pour tout plan dès la chaîne (déblocage instantané, calcul payé aussi pour les plans offerts) ou au déblocage (attente) ?
19. Seuils de fluidité et appareils de référence (L1-14), au vu du diagnostic chiffré de la navigation en cours.
20. Plans à plusieurs niveaux pendant la bêta fermée : décidé le 27/09/2026 (décision 11) : duplex acceptés, comme en service ; au-delà de deux niveaux, refus.

**À mesurer avant d'afficher un chiffre** (T0, R12) : `‹délai›`, la durée de l'analyse sans IA, et le temps d'apparition de chaque image d'aperçu (vue du dessus, plan 2D, chaque photo) en SwiftShader dans le conteneur (L4-09, L5-11).
