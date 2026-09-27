# Cadre juridique à préparer (France / UE)

Recherche du 27/09/2026. **Ce document prépare le travail avec un avocat, il ne le remplace pas.** Il liste les textes applicables, les choix à faire et les documents à produire, pour arriver chez l'avocat avec des questions précises.

Chaque fait externe est suivi d'un renvoi vers la liste des sources (section 9), avec son statut :
- **vérifié** : texte lu sur la source primaire le 27/09/2026 ;
- **partiel** : source lue en partie, ou lue seulement via une source secondaire ;
- **non vérifié** : fait tiré de mes connaissances ou d'une source inaccessible pendant cette session (EUR-Lex, economie.gouv.fr et EUIPO ont souvent refusé la lecture automatique).

Les formulations proposées (case à cocher, clauses, mentions) sont des **projets à faire valider**.

Hypothèses de travail :
- une société commerciale française (SAS probable), soumise à la TVA ;
- des clients presque tous en France ;
- des données hébergées dans l'UE, hors appels au modèle d'IA ;
- une lecture des plans par Claude via OpenRouter (voir CLAUDE.md).

Les documents voisins [auth-paiement.md](auth-paiement.md) (paiement, crédits, TVA, facturation) et [audit-code.md](audit-code.md) (ZDR OpenRouter, Google Fonts) ne sont pas répétés ici.

---

## 0. En bref

1. **Rétractation (particuliers).** On peut exclure le droit de rétractation de 14 jours pour une génération lancée pendant le délai, à trois conditions (L221-28 13°) [1] :
   - le consentement exprès du client au démarrage immédiat ;
   - sa reconnaissance qu'il perd son droit ;
   - **une confirmation envoyée sur support durable** (L221-13) [2].

   Les **crédits non utilisés** restent rétractables pendant 14 jours. La case à cocher se place **au lancement de chaque génération**, pas seulement à l'achat.
2. **« Renoncer au contrat ici ».** Depuis le **19/06/2026**, tout contrat conclu à distance via une interface en ligne doit offrir une **fonction de rétractation en ligne**. Elle porte ce libellé ou une formule analogue et envoie un accusé de réception horodaté (ordonnance 2026-2, décret 2026-3, art. D221-5) [4][5]. C'est une obligation récente, que beaucoup de modèles de CGV ne prévoient pas encore.
3. **Garantie légale de conformité des contenus et services numériques.** Elle s'applique et ne peut pas être écartée. On peut seulement faire accepter, **expressément et séparément**, des écarts précis (« dimensions indicatives », « matériaux fictifs ») (L224-25-14 III) [7]. Les CGV doivent contenir l'**encadré type** prévu pour les contenus numériques (D211-3) [8]. Toute clause qui supprime la responsabilité envers un particulier est **abusive** (R212-1 6°) [9].
4. **Médiateur de la consommation.** Il est **obligatoire**, et le manquement coûte jusqu'à 15 000 € d'amende pour une société (L612-1, L616-1, L641-1) [10][11][12]. Exemple de coût : CM2C facture 48 € d'adhésion pour 3 ans (10 personnes au plus), puis 36 € par médiation à distance [13].
5. **RGPD.** Un plan déposé par un acquéreur (adresse du programme, numéro de lot, parfois nom en cartouche) est une **donnée personnelle**. Les rôles se répartissent ainsi :
   - avec les particuliers, nous sommes **responsable de traitement** ;
   - avec les conseillers et promoteurs, nous sommes **sous-traitant**, avec un DPA (art. 28) [19] à signer.

   OpenRouter et Anthropic transfèrent les données vers les États-Unis. Leurs documents s'appuient sur les **clauses contractuelles types**, pas sur le Data Privacy Framework (DPF) [25][27][30][32]. Il faut donc :
   - activer la **ZDR** (aucune conservation) ;
   - **masquer le cartouche** (noms) avant l'envoi ;
   - demander le **routage UE d'OpenRouter**, réservé à l'offre entreprise [28].
6. **Traceurs.** Umami peut être dispensé de consentement s'il respecte les conditions de la CNIL [23]. Meta (pixel et **Conversions API**) et Google Ads exigent un **consentement préalable**, et Meta se déclare **responsable conjoint** avec l'annonceur [34][35]. Le **journal d'ouverture des liens de visite** envoyés aux prospects est un traceur au sens du CEPD [24] : il faut un vrai choix de conception (voir 3.7).
7. **Droit d'auteur.**
   - Un plan d'architecture est une œuvre protégeable (L112-2 12°), et la modéliser en 3D est une **adaptation** qui demande l'accord de l'auteur (L122-4) [39][40].
   - L'acquéreur qui l'utilise pour lui-même présente un risque faible mais non nul (l'exception de copie privée est étroite) [41].
   - Le conseiller qui envoie la visite à des prospects fait une **représentation publique** : il lui faut une **autorisation du promoteur**.
   - Nos CGU doivent faire **garantir les droits par l'utilisateur**. Aucune visite ne doit servir de vitrine sans accord écrit du promoteur.
8. **Images de synthèse.**
   - Chaque rendu porte la mention « illustration non contractuelle générée automatiquement à partir du plan de vente ».
   - Aucun mot comme « conforme », « exact » ou « certifié ».
   - Un renvoi aux plans et à la notice annexés à l'acte de vente (L261-11 CCH) [42].
   - Depuis l'omnibus IA (en vigueur le 27/07/2026), le **marquage des contenus générés par IA** (AI Act, art. 50) s'applique aux nouveaux systèmes [36][38]. Notre cas n'est pas tranché, mais le marquage dans les métadonnées ne coûte presque rien.
9. **Professions réglementées.** L'outil ne change pas le statut des conseillers : carte T de la loi Hoguet pour vendre le bien d'autrui [43], obligation de communication « exacte, claire et non trompeuse » pour les CIF [44]. **Pour nous**, la limite à ne pas franchir est la mise en relation acquéreurs–lots ou la revente de fichiers de prospects, qui relèverait de la loi Hoguet [43].
10. **Ordre de production.**
    1. Mentions légales, CGU, confidentialité, registre, DPA des fournisseurs.
    2. CGV B2C avec les parcours de rétractation, puis adhésion au médiateur.
    3. Dépôt de marque à l'INPI : 190 € pour une classe, 40 € par classe en plus [45].
    4. Contrat pro avec DPA.
    5. Contrat promoteur avec SLA et marque blanche.
    6. Bannière de consentement avant tout pixel Meta ou Google (section 7).

---

## 1. Vente aux particuliers (B2C)

### 1.1 Qualification du produit

Le Code de la consommation distingue :
- le **contenu numérique**, c'est-à-dire des données produites et fournies sous forme numérique (ici les photos, le plan 2D et le fichier de la maquette) ;
- le **service numérique**, c'est-à-dire un service qui permet de créer, traiter, stocker ou consulter des données (ici la visite hébergée et consultable par lien pendant une durée donnée).

Cette définition vient de l'article liminaire et de la directive 2019/770, non relus dans cette session.

Notre offre mêle les deux. La qualification change le régime de la rétractation (voir 1.2) et la durée de la garantie de conformité (voir 1.5). **Proposition à valider** : décrire la génération comme la **fourniture d'un contenu numérique** remis dès la fin du calcul (fichiers téléchargeables), et l'hébergement de la visite comme une **fourniture continue pendant une durée annoncée** (par exemple 12 mois). La page produit et les CGV doivent reprendre cette description.

### 1.2 Droit de rétractation et renonciation

**Principe.** Le consommateur dispose de 14 jours pour se rétracter d'un contrat conclu à distance (L221-18, cité par [1]).

**Exceptions utiles.** Article L221-28, texte vérifié [1] (version en vigueur depuis le 28/05/2022 ; l'ordonnance 2026-2 lue sur Légifrance ne modifie pas ces deux points [4]) :

> 1° De fourniture de services pleinement exécutés avant la fin du délai de rétractation et, si le contrat soumet le consommateur à une obligation de payer, dont l'exécution a commencé avec son accord préalable et exprès et avec la reconnaissance par lui de la perte de son droit de rétractation, lorsque la prestation aura été pleinement exécutée par le professionnel ;

> 13° De fourniture d'un contenu numérique sans support matériel dont l'exécution a commencé avant la fin du délai de rétractation et, si le contrat soumet le consommateur à une obligation de payer, lorsque : a) Il a donné préalablement son consentement exprès pour que l'exécution du contrat commence avant l'expiration du délai de rétractation ; et b) Il a reconnu qu'il perdra son droit de rétractation ; et c) Le professionnel a fourni une confirmation de l'accord du consommateur conformément aux dispositions du deuxième alinéa de l'article L. 221-13.

L221-13, 2e alinéa [2] : le professionnel fournit, sur support durable et **avant l'expiration du délai de rétractation**, « la confirmation de son accord exprès pour la fourniture d'un contenu numérique non présenté sur un support matériel et de la reconnaissance de la perte de son droit de rétractation ».

**Conséquences pour les crédits.**

| Situation | Rétractation | Traitement proposé |
|---|---|---|
| Pack acheté, aucun crédit utilisé, moins de 14 jours | **Oui** | Remboursement intégral via la fonction « Renoncer au contrat ici » (voir 1.3) |
| Pack acheté, 1 crédit sur 5 utilisé avec renonciation | Oui pour les crédits restants, non pour le crédit consommé | Remboursement au prorata des crédits non utilisés. Cohérent avec [auth-paiement.md](auth-paiement.md) 3.4 |
| Génération lancée sans case cochée | **Oui**, droit entier | Ne pas lancer : la case est bloquante |
| Hébergement de la visite (12 mois) | Le 1° ne joue que si le service est « pleinement exécuté », ce qui n'est pas le cas d'un hébergement de 12 mois | Présenter l'hébergement comme l'accessoire du contenu livré. **Question pour l'avocat** : risque de devoir rembourser au prorata la part « hébergement » |
| Crédit offert (gratuit) | Sans objet (pas d'obligation de payer) | Les CGU s'appliquent, la garantie de conformité aussi (voir 1.5) |

**Parcours et formulations (projets).**

1. *Page d'achat du pack* (informations avant la commande) :
   > « Vous pouvez vous rétracter pendant 14 jours tant que vos crédits ne sont pas utilisés. Quand vous lancez une génération, vous perdez ce droit pour le crédit utilisé, car la génération commence tout de suite. »

   Le bouton de paiement indique clairement qu'on s'engage à payer, par exemple « Payer 29,00 € TTC » ou « Commande avec obligation de paiement ». L'exigence d'un bouton explicite vient de L221-14, non relu dans cette session ; la mention « commande avec obligation de paiement » est la formule usuelle.
2. *Lancement d'une génération payante* : une **case non cochée par défaut**, qui bloque le bouton :
   > « ☐ Je demande que la génération commence immédiatement, avant la fin de mon délai de rétractation de 14 jours, et je reconnais que je perds mon droit de rétractation pour ce crédit dès le lancement. »

   Bouton : « Lancer la génération (1 crédit) ».
3. *Confirmation sur support durable* : un e-mail envoyé **au moment du lancement**, bien avant la fin des 14 jours. Il reprend :
   - le texte exact de l'accord et de la reconnaissance ;
   - la date et l'heure ;
   - le crédit concerné ;
   - les CGV en PDF ;
   - le formulaire type de rétractation (exigé par L221-13 avec la confirmation du contrat) [2].
4. *Preuve* : journaliser l'horodatage, la version des CGV, le texte affiché, l'identifiant du compte et l'adresse IP. Conserver ce journal au moins pendant la prescription (voir 3.4).

### 1.3 Fonction de rétractation en ligne (depuis le 19/06/2026)

- Nouvel alinéa de **L221-21** (ordonnance n° 2026-2 du 5/01/2026) [4] : « Pour les contrats conclus à distance au moyen d'une interface en ligne, le professionnel met à la disposition du consommateur, sans frais pour ce dernier, une fonctionnalité lui permettant d'exercer gratuitement son droit de rétractation avant l'expiration du délai prévu à l'article L. 221-18. »
- **D221-5** (décret n° 2026-3) [5] : la fonction est identifiée par la mention « renoncer au contrat ici » ou une formule analogue. L'accusé de réception mentionne « le contenu de la déclaration de rétractation ainsi que la date et l'heure de son envoi ». Le texte entre en vigueur le 19/06/2026.
- L221-5, version du 19/06/2026 : les informations précontractuelles doivent mentionner cette fonction [3].
- Sanction citée par une source secondaire : amende administrative jusqu'à 15 000 € (personne physique) et 75 000 € (personne morale) [6]. Montants **non vérifiés** sur le Code.

À faire :
- un lien « Renoncer au contrat ici » dans le compte et dans le pied de page, actif pendant 14 jours après chaque achat ;
- une étape de confirmation ;
- un e-mail d'accusé de réception automatique ;
- un remboursement Stripe des crédits non utilisés.

Même si la plupart des générations sont exclues du droit de rétractation, les crédits non utilisés ne le sont pas : la fonction est donc nécessaire.

### 1.4 Information précontractuelle et confirmation

Les informations à donner avant la conclusion du contrat, selon L221-5 (version du 19/06/2026) [3] :
- caractéristiques essentielles ;
- prix TTC ;
- délai de fourniture ;
- identité et coordonnées ;
- garanties légales, fonctionnalités et compatibilité du contenu numérique ;
- possibilité de recourir à un médiateur ;
- conditions, délai et modalités de la rétractation, avec le formulaire type et la fonction de rétractation ;
- **les cas où le consommateur ne bénéficie pas du droit de rétractation ou le perd** ;
- l'éventuel prix personnalisé par un traitement automatisé. À ne pas pratiquer sans le dire.

Pour notre produit, les « caractéristiques essentielles » doivent dire, sans jargon :
- ce qui est livré ;
- la durée d'hébergement de la visite ;
- le délai de génération (8 à 15 min mesurés) ;
- les limites (voir 5.2) ;
- les navigateurs compatibles, qui relèvent de l'interopérabilité.

**Archivage.** Un contrat électronique d'un montant égal ou supérieur au seuil fixé par décret est conservé, et le client peut y accéder à tout moment (L213-1) [14]. Le seuil de 120 € et la durée de 10 ans (D213-1 et D213-2) viennent de mes connaissances et n'ont pas été relus. En pratique, on conserve chaque commande avec la version des CGV acceptée.

**Prix.** Les prix sont affichés TTC pour les particuliers (Service-public [16] ; L112-1 et l'arrêté du 3/12/1987, non relus). Si un jour on fait des promotions, le prix de référence est encadré (L112-1-1, non relu).

### 1.5 Garantie légale de conformité (contenus et services numériques)

Texte vérifié [7] :
- **Durée.** Pour une fourniture unique, le professionnel répond des défauts qui apparaissent dans les **2 ans** qui suivent la fourniture. Pour une fourniture continue, il en répond pendant toute la durée du contrat (L224-25-12). La visite hébergée pendant 12 mois est une fourniture continue.
- **Présomption.** Un défaut qui apparaît dans les **12 mois** est présumé exister au moment de la fourniture (L224-25-16 I).
- **Conformité.** Le contenu est conforme s'il correspond notamment à la description, à la qualité et aux fonctionnalités annoncées (L224-25-13 et L224-25-14).
- **Écart consenti.** L224-25-14 III, verbatim :

  > « Le consommateur ne peut contester la conformité en invoquant un défaut concernant une ou plusieurs caractéristiques particulières du contenu numérique ou du service numérique, dont il a été spécifiquement informé qu'elles s'écartaient des critères de conformité énoncés au présent article, écart auquel il a expressément et séparément consenti lors de la conclusion du contrat. »

**Application.** C'est le seul levier légal pour encadrer les approximations de la visite. Il prend la forme d'une **seconde case, distincte des CGV**, à l'achat. Projet :

> « ☐ J'ai compris que la visite et les photos sont des illustrations produites automatiquement à partir du plan de vente : les dimensions sont reprises du plan quand il les indique et estimées sinon, les hauteurs, matériaux, couleurs, mobilier, vues et lumière sont fictifs, et certains équipements peuvent être simplifiés. Elles ne remplacent pas les plans et la notice annexés à mon contrat de vente. »

Cette case ne couvre pas une erreur grossière, comme un mur manquant ou une pièce inversée : c'est un défaut de conformité, qui se corrige en régénérant la visite ou en remboursant. Cela rejoint la consigne « zéro défaut visible » du projet.

**Encadré obligatoire.** Les CGV contiennent un encadré qui informe le consommateur sur la mise en œuvre des garanties légales, selon le modèle annexé au Code pour les contrats de L224-25-12 (D211-3, en vigueur depuis le 1/10/2022) [8]. Il faut reprendre le modèle mot pour mot ; l'annexe n'a pas été relue ici.

### 1.6 Contenu des CGV B2C (sommaire à rédiger)

1. Identité et coordonnées de la société.
2. Objet et description du service, avec ses limites (renvoi à 5.2).
3. Compte, crédits (prix TTC, durée de validité, expiration, crédit offert).
4. Commande et paiement (Stripe), facture ou reçu.
5. Fourniture : délai, formats, durée d'hébergement de la visite, liens de partage.
6. Rétractation : 14 jours, exclusion en cas de lancement avec accord, fonction « Renoncer au contrat ici », formulaire type, remboursement des crédits non utilisés.
7. Garanties légales : l'encadré D211-3 et la procédure de réclamation (régénération, puis remboursement).
8. Responsabilité, dans les limites permises (voir 5.3).
9. Propriété intellectuelle : garanties de l'utilisateur sur le plan et licence d'usage des résultats (voir 4.5).
10. Données personnelles : renvoi à la politique de confidentialité.
11. Réclamations, puis médiateur (nom, site, adresse).
12. Droit applicable et juridiction. Le consommateur garde les protections de son pays de résidence dans l'UE.
13. Version et date. Chaque acceptation est journalisée avec la version.

### 1.7 Médiateur de la consommation

- « Tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation » (L612-1) [10]. Le **professionnel paie** le médiateur.
- Le professionnel communique les coordonnées du médiateur compétent (L616-1) [11], en pratique sur le site, dans les CGV et dans la réponse à une réclamation écrite rejetée. Les modalités exactes (R616-1) n'ont pas été relues.
- Sanction : jusqu'à 3 000 € (personne physique) et 15 000 € (personne morale) d'amende administrative (L641-1) [12].
- L616-2 renvoie encore au règlement 524/2013 sur la plateforme européenne de règlement en ligne des litiges (RLL) [11]. D'après mes connaissances, ce règlement a été abrogé par le règlement (UE) 2024/3228 et la plateforme a fermé le 20/07/2025 (**non vérifié**, EUR-Lex inaccessible). Ne pas ajouter de lien vers la RLL sans vérification.

**Lequel choisir ?** Il faut un médiateur référencé par la CECMC et compétent pour les services en ligne. Exemple vérifié : **CM2C**, qui se dit référencé par la CECMC. Ses tarifs [13] :

| | |
|---|---|
| Adhésion | 48 € pour 3 ans (jusqu'à 10 personnes) ; 144 € (11 à 50 personnes) |
| Médiation à distance | 36 € par dossier |
| HT ou TTC | non précisé |

D'autres médiateurs multisectoriels existent (Medicys, AME Conso, CNPM Médiation, médiateur de la FEVAD pour ses adhérents). Leurs tarifs **n'ont pas été vérifiés** : la liste officielle (economie.gouv.fr/mediation-conso) a refusé la lecture automatique. À comparer sur le budget et le délai de traitement.

### 1.8 Mentions légales (site et pages de visite)

L'obligation d'identification figure désormais à l'**article 1-1 de la LCEN** ; sa violation est punie d'un an d'emprisonnement et de 75 000 € d'amende (article 1-2) [17]. Contenu pour une société (Service-public [16] et connaissances) :
- dénomination ;
- forme juridique ;
- capital ;
- adresse du siège ;
- RCS et SIREN ;
- numéro de TVA intracommunautaire ;
- téléphone et e-mail ;
- directeur de la publication ;
- **hébergeur** (nom, adresse, téléphone) ;
- **médiateur** ;
- liens vers les CGU, CGV, la politique de confidentialité et la gestion des traceurs.

Les pages de visite partagées par lien portent un lien discret vers ces mentions. En **marque blanche**, voir 2.4 pour savoir qui les affiche.

**Hébergement de contenus (DSA).** Nous stockons des contenus fournis par les utilisateurs (plans, visites) : nous sommes donc un **fournisseur de services d'hébergement** au sens du règlement (UE) 2022/2065, dit DSA [18]. Nos obligations :
- **un mécanisme de notification et d'action** « facilement accessible » (art. 16, lu) ;
- des points de contact, l'information sur la modération dans les CGU, la motivation des retraits et le signalement des infractions graves (art. 11, 12, 14, 17 et 18, **non relus**) ;
- pas de rapports de transparence : les micro et petites entreprises en sont exemptées (art. 15 §2, lu) ;
- pas les obligations propres aux **plateformes en ligne** tant que nous restons une micro ou petite entreprise (art. 19 §1, lu).

Tant que les visites circulent par liens privés, nous ne sommes probablement pas une plateforme, faute de « diffusion au public » (**interprétation à valider**). Concrètement : une adresse ou un formulaire « Signaler un contenu », et une clause dans les CGU.

**Accessibilité.** L'European Accessibility Act s'applique depuis le 28/06/2025 aux services de commerce électronique. D'après mes connaissances, les **micro-entreprises qui fournissent des services en sont exemptées** (moins de 10 salariés et 2 M€ de chiffre d'affaires ou de bilan, **non vérifié**). La règle est à revoir dès que l'on dépasse ces seuils.

---

## 2. Professionnels (B2B)

### 2.1 CGV pro et contrat d'abonnement (conseillers)

Rappels (Code de commerce et Code civil ; **non relus dans cette session**, sauf mention) :
- les CGV sont communiquées à tout professionnel qui les demande (L441-1 C. com.) ;
- les délais de paiement sont plafonnés (60 jours après la facture, ou 45 jours fin de mois, L441-10) ;
- les factures pro mentionnent les pénalités de retard et l'indemnité forfaitaire de 40 € (voir [auth-paiement.md](auth-paiement.md) 4.2) ;
- le déséquilibre significatif est sanctionné dans les contrats d'adhésion (art. 1171 C. civ.) et entre partenaires commerciaux (L442-1 C. com.) ;
- une clause qui prive de sa substance l'obligation essentielle est réputée non écrite (art. 1170 C. civ.). Un plafond de responsabilité trop bas sur la fourniture même du service est donc fragile.

**Point d'attention : la vente sur place (hors établissement).** Les protections du consommateur (information, **rétractation de 14 jours**) s'étendent au contrat conclu **hors établissement** avec un professionnel qui emploie **5 salariés au plus**, si l'objet du contrat « n'entre pas dans le champ de l'activité principale » de ce professionnel (L221-3, vérifié) [15]. Un abonnement signé au cabinet d'un petit CGP pendant un rendez-vous commercial peut donc ouvrir un droit de rétractation. L'abonnement souscrit en ligne n'est pas concerné, car ce n'est pas un contrat hors établissement. Question pour l'avocat : un outil de visualisation entre-t-il dans « l'activité principale » d'un CGP ?

**Sommaire du contrat d'abonnement pro :**
1. Parties, objet, définitions (plan, génération, visite, lien, crédit, utilisateur, prospect).
2. Offres : quota mensuel de plans, report ou non des crédits, recharges, sièges.
3. Durée, renouvellement tacite, résiliation, préavis. La résiliation « en trois clics » (L215-1-1) ne vise que les consommateurs, mais la proposer ne coûte rien.
4. Prix HT, révision, paiement, retards.
5. Obligations du client :
   - droits sur les plans (voir 4.5) ;
   - usage conforme à son statut (voir 6) ;
   - maintien de la mention « non contractuel » ;
   - information des prospects (voir 3.7) ;
   - interdiction de retirer les mentions.
6. Nos obligations : service décrit, disponibilité visée (sans SLA contractuel pour cette offre, ou un SLA léger), support.
7. **Personnalisation (réglages, prompts)** : le client est responsable des résultats qu'il a personnalisés. Pas d'accès brut au modèle, car les conditions d'OpenRouter interdisent de revendre l'accès API aux modèles (clause 7.4, vérifiée) [26].
8. Propriété intellectuelle : notre moteur reste à nous, et le client reçoit une licence sur les résultats (voir 4.5).
9. Données personnelles : **DPA en annexe** (2.2).
10. Responsabilité : plafond égal aux sommes payées sur 12 mois, exclusion des dommages indirects (perte de vente, image), sauf faute lourde ou dolosive. Ce plafond s'aligne sur celui de notre propre fournisseur : OpenRouter limite sa responsabilité à 12 mois de paiements ou 100 $ (clause 17) [26].
11. Suspension (impayé, abus, contenu signalé), réversibilité et export, suppression.
12. Droit français, tribunal de commerce du siège.

### 2.2 Accord de sous-traitance (DPA, art. 28 RGPD)

Quand un conseiller dépose le plan de **son client** ou envoie des liens à **ses prospects**, il détermine les finalités : il est **responsable de traitement**, et nous sommes son **sous-traitant**. Le contrat doit prévoir les points a) à h) de l'article 28 §3 [19] :
- a) le traitement uniquement sur instruction documentée ;
- b) la confidentialité des personnes autorisées ;
- c) les mesures de sécurité de l'article 32 ;
- d) les conditions pour recruter un sous-traitant ultérieur ;
- e) l'aide pour répondre aux demandes d'exercice des droits ;
- f) l'aide pour les articles 32 à 36 (sécurité, violations, AIPD) ;
- g) la suppression ou le renvoi des données en fin de prestation ;
- h) la mise à disposition de toutes les informations nécessaires, avec les audits.

Il décrit aussi l'objet, la durée, la nature, la finalité, les types de données et les catégories de personnes.

À préparer :
- **Liste des sous-traitants ultérieurs**, avec pays et garanties : hébergeur, OpenRouter, fournisseur(s) de modèle, envoi d'e-mails, Stripe (pour la facturation du pro seulement), fournisseur d'authentification.
- Préavis de changement : **30 jours** chez OpenRouter [27], 15 jours d'opposition chez Anthropic [32]. Notre préavis au client doit être au moins aussi long que le délai dont nous disposons nous-mêmes, ou nous devons nous réserver le droit de résilier.
- Délai de notification d'une violation au client : OpenRouter s'engage à **72 h** [27], Anthropic à **48 h** [32]. Si nous promettons 48 h, OpenRouter peut nous prévenir trop tard ; mieux vaut « sans retard injustifié et au plus tard 48 h après que nous en avons connaissance ».
- Suppression en fin de contrat : export sous 30 jours, puis suppression, y compris des sauvegardes selon leur rotation.
- Annexe sécurité : chiffrement, contrôle d'accès, journalisation, sauvegardes en UE, tests.

Nous restons **responsable de traitement** pour nos propres finalités : gestion du compte du pro, facturation, sécurité, statistiques agrégées. Toute réutilisation des plans des clients pour améliorer la chaîne (tests, références) n'est **pas** couverte par le DPA : elle demande un accord écrit séparé du client, et, sur le plan du droit d'auteur, du promoteur (voir 4.6).

### 2.3 SLA pour les promoteurs (proposition de contenu)

Aucune norme légale n'existe : c'est une annexe négociée. Contenu habituel (recommandation, pas un fait externe) :

| Élément | Proposition de départ |
|---|---|
| Disponibilité des visites publiées | 99,5 % par mois, hors maintenance annoncée 48 h à l'avance |
| Délai de livraison d'un programme | Par exemple 5 jours ouvrés pour 50 lots, après réception de plans exploitables |
| Qualité | Contrôle par le promoteur sous 10 jours, puis 2 cycles de correction inclus |
| Support | Heures ouvrées ; incident bloquant : réponse en 4 h ouvrées |
| Pénalités | Crédits de service (par exemple 5 % par tranche de 0,5 % sous l'objectif), plafonnés à 20 % du mois, recours exclusif pour l'indisponibilité |
| Exclusions | Force majeure, pannes des fournisseurs d'IA pour la génération (pas pour les visites déjà publiées), usage non conforme |
| Réversibilité | Export des maquettes, photos et visites dans un format ouvert |
| Localisation | Données en UE, sauf l'appel au modèle d'IA (voir 3.3) |

Point de cohérence : la génération dépend d'OpenRouter, qui ne s'engage sur aucun SLA dans ses conditions standard (clause de limitation 17) [26]. On ne promet donc **pas de délai garanti sur la génération** sans marge, ou alors avec un contrat entreprise OpenRouter.

### 2.4 Marque blanche

**Licence.** Nous concédons un droit d'usage du service, non exclusif, non cessible, pour la durée du contrat, avec un sous-domaine du client (par exemple `visite.client.fr`). Le client nous concède une **licence sur sa marque et son logo**, limitée à l'affichage dans son instance. Ce que le contrat doit trancher :
- **Qui est éditeur de la page.** Si la page est aux couleurs du client et sur son domaine, il en est l'éditeur au sens de la LCEN : il fournit les mentions légales, et nous sommes l'hébergeur technique.
- **Qui est responsable de traitement** pour les visiteurs : le client en principe, avec nous comme sous-traitant (DPA).
- **Qui gère le consentement aux traceurs** : sa bannière, ou la nôtre à sa marque.
- **Contenus** : le client garantit ses droits sur les plans, les images et les textes. Nous l'indemnisons seulement pour une atteinte causée par notre moteur.
- **Mention « Propulsé par »** : optionnelle et payante à retirer. Elle ne doit pas laisser croire que nous validons la conformité des lots.
- **Responsabilité envers les acquéreurs finaux** : le client répond de ses communications commerciales. Nous répondons du fonctionnement technique, dans le plafond du contrat.
- **Sortie** : redirection ou coupure des liens, export, puis suppression.

---

## 3. Données personnelles (RGPD)

### 3.1 Traitements et rôles

| Traitement | Personnes | Données | Rôle | Base légale proposée |
|---|---|---|---|---|
| Compte et crédits d'un particulier | Acquéreurs | E-mail, identifiants de connexion, historique des achats | Responsable | Contrat |
| Génération pour un particulier | Acquéreur, et parfois co-acquéreur ou vendeur en cartouche | Plan (adresse du programme, lot, étage, surface, parfois nom), résultats | Responsable | Contrat |
| Génération pour un pro | Clients du pro | Idem | **Sous-traitant** | Celle du pro |
| Liens de visite et journal d'ouverture | Prospects du pro | Identifiant de lien, date et heure, durée, adresse IP, navigateur | **Sous-traitant** | Celle du pro, plus consentement si traceur (voir 3.7) |
| Visites de résidence (promoteur) | Visiteurs du site | Données techniques | Sous-traitant | Celle du promoteur |
| Facturation | Clients payants | Identité, SIREN pour les pros, factures | Responsable | Obligation légale |
| Mesure d'audience | Visiteurs | Statistiques | Responsable | Dispense CNIL si conditions (voir 3.7) |
| Publicité (Meta, Google) | Visiteurs, clients | Identifiants, e-mail haché, événements | Responsable **conjoint** avec Meta [34] | **Consentement** |
| Lutte contre la fraude au crédit gratuit | Inscrits | E-mail normalisé, IP, empreinte du fichier | Responsable | Intérêt légitime |
| Support et réclamations | Clients | Messages | Responsable | Contrat |

### 3.2 Les plans eux-mêmes

- Un plan de lot avec adresse et numéro de lot, déposé par son acquéreur, se rattache à une personne identifiable : c'est une donnée personnelle, même sans nom. Un plan de programme encore invendu, déposé par un promoteur, n'en contient en général pas.
- **Minimisation**, recommandée et peu coûteuse :
  - détecter et **masquer le cartouche** (noms, adresse) avant l'envoi au modèle ;
  - ne jamais afficher ces informations dans les résultats ;
  - ne pas indexer les visites (`noindex`) ;
  - générer des liens non devinables et révocables.

  C'est aussi la consigne « aucun texte technique montré ».
- Pas de donnée sensible (art. 9) attendue. Aucune décision automatisée au sens de l'article 22.

### 3.3 Sous-traitants hors UE et transferts

**OpenRouter** (OpenRouter, Inc., États-Unis) :
- Politique de confidentialité du 31/08/2026 [25] : transferts vers les États-Unis fondés sur les décisions d'adéquation et les **clauses contractuelles types**. **Le DPF n'est pas mentionné.**
- DPA du 26/08/2026 [27] :
  - OpenRouter agit comme **sous-traitant** ;
  - les clauses types retenues sont celles du **module 2** (décision 2021/914), soumises au droit irlandais ;
  - le DPA est **incorporé automatiquement** pour un usage commercial, sans signature séparée ;
  - OpenRouter prévient 30 jours avant de recourir à un nouveau sous-traitant ;
  - notification d'une violation sous 72 h ;
  - suppression sur demande sous 30 jours ;
  - engagement de ne rien conserver après chaque requête, sauf exceptions légales.
- Les fournisseurs de modèles ont chacun leur politique, et « certains peuvent utiliser les entrées et sorties pour l'entraînement » [25]. **Il faut donc imposer la ZDR** (`provider.zdr: true`), comme l'indique déjà [audit-code.md](audit-code.md).
- **Routage en région UE** : proposé aux clients entreprise, sur contact [28].
- Conditions [26] : droit de New York, responsabilité plafonnée, **interdiction de revendre l'accès API aux modèles ou de développer un service concurrent** (7.4). Notre service transforme des plans, il ne revend pas d'accès brut : compatible a priori, mais à confirmer si les pros peuvent écrire leurs propres prompts.

**Anthropic** :
- Pour les produits grand public, l'entité de l'UE est Anthropic Ireland, Limited. Les transferts se fondent sur l'adéquation et les clauses types, et la politique grand public exclut les données traitées pour les clients professionnels [30].
- Conditions commerciales (17/06/2025) [31] : **pas d'entraînement sur les contenus des clients**, le client est propriétaire des résultats, et Anthropic accorde une **garantie contre les réclamations de propriété intellectuelle** pour l'usage payant.
- DPA du 24/02/2025 [32] : clauses types modules 2 et 3, notification sous 48 h, 15 jours d'opposition à un nouveau sous-traitant, suppression sous 30 jours après la fin du contrat. Le DPF n'est pas mentionné.
- **Via OpenRouter, notre contrat est avec OpenRouter, pas avec Anthropic.** Les garanties d'Anthropic (sa garantie de propriété intellectuelle notamment) ne nous bénéficient donc probablement pas directement (interprétation, **à vérifier**). Passer en direct chez Anthropic, avec la clé déjà prévue dans le code, simplifierait la chaîne contractuelle.

**Statut du DPF.** Le Tribunal de l'UE l'a validé le 3/09/2025 (Latombe, T-553/23). Un pourvoi a été formé le 31/10/2025 et reste pendant (sources reprises de [auth-paiement.md](auth-paiement.md) [33], non relues ici). Nos deux fournisseurs d'IA s'appuyant sur les clauses types, il faut une **analyse d'impact des transferts** (AITD), courte et documentée : nature des données, masquage, ZDR, chiffrement en transit, faible intérêt des données pour les autorités américaines. Je n'ai pas vérifié si OpenRouter ou Anthropic figurent sur la liste du DPF (dataprivacyframework.gov non consulté).

Autres sous-traitants à inscrire :
- hébergeur (UE) ;
- e-mails transactionnels ;
- Stripe ;
- Auth0 (Okta, États-Unis) s'il est retenu (voir [auth-paiement.md](auth-paiement.md)) ;
- Meta et Google (responsables conjoints ou indépendants, et non sous-traitants, pour la publicité).

### 3.4 Durées de conservation (propositions)

Principes de la CNIL : une durée par finalité, puis une base active, un archivage intermédiaire et la suppression [21]. Les durées ci-dessous sont des **propositions**. Seules les lignes sourcées sont des obligations ou des recommandations vérifiées.

| Données | Durée proposée | Fondement |
|---|---|---|
| Compte particulier inactif | Suppression 3 ans après le dernier contact | Référentiel CNIL « gestion commerciale » (3 ans pour les prospects), **non relu** |
| Plan déposé et fichiers intermédiaires (particulier) | Durée d'hébergement annoncée (par exemple 12 mois), puis suppression. Suppression immédiate sur demande | Minimisation |
| Plan et résultats (pro, promoteur) | Durée du contrat, plus 30 jours pour l'export | DPA |
| Données chez OpenRouter | Aucune conservation (ZDR) | [27] |
| Journal d'ouverture des liens | 6 mois, agrégé ensuite | Proposition |
| Mesure d'audience | 25 mois au plus | CNIL [23] |
| Preuves d'acceptation (CGV, renonciation, consentement) | 5 ans (prescription de droit commun) ; 10 ans pour les contrats au-dessus du seuil de L213-1 | [14] ; seuil et durée non relus |
| Factures et pièces comptables | 10 ans | Code de commerce L123-22, **non relu** |
| Journaux techniques de sécurité | 6 à 12 mois | Recommandation CNIL sur la journalisation, **non relue** |

### 3.5 Registre, AIPD, sécurité, violations

- **Registre** : le registre des traitements est obligatoire en pratique. L'exception des moins de 250 salariés ne joue pas pour les traitements « non occasionnels », ce qui est notre cas (art. 30 §5 [19] ; CNIL [20]). Il en faut deux versions : **responsable** (tableau 3.1) et **sous-traitant** (clients, sous-traitants ultérieurs, transferts, sécurité). La CNIL fournit un modèle [20].
- **AIPD** : a priori non obligatoire (pas de grande échelle, pas de donnée sensible, pas de profilage). Recommandée sous forme courte, parce que la technologie est nouvelle (IA) et qu'il y a des transferts. Cette appréciation est **à valider** par l'avocat.
- **Violations** : notification à la CNIL sous 72 h si un risque existe (art. 33), et information de nos clients pros selon le DPA.
- **Sécurité** : les points de [audit-code.md](audit-code.md) (secrets, cloisonnement, liens signés) sont aussi des obligations au titre de l'article 32.

### 3.6 Droits des personnes

Les droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition s'exercent **dans un délai d'un mois** (art. 12, connaissance). Les mettre en œuvre dans le produit :
- export du compte ;
- suppression du compte et des plans ;
- adresse de contact dédiée.

Pour les données traitées pour un pro, nous transmettons la demande au pro sous 48 h (DPA, point e).

### 3.7 Cookies et traceurs

Règles de la CNIL [22] :
- consentement **préalable** ;
- refuser aussi simple qu'accepter ;
- retrait possible à tout moment ;
- preuve du consentement ;
- accepter les CGU ne vaut pas consentement ;
- traceurs exemptés : authentification, panier, préférences d'interface, **certaines mesures d'audience**.

**Umami.** L'exemption de la CNIL [23] suppose :
- une finalité **strictement limitée** à la mesure d'audience ;
- des **données statistiques uniquement** ;
- aucun recoupement ni partage de données non anonymisées ;
- aucun identifiant commun à plusieurs sites ;
- une durée de vie du traceur limitée à 13 mois ;
- une conservation limitée à 25 mois.

La CNIL ne certifie aucune solution et ne mentionne pas Umami. Umami **auto-hébergé en UE**, sur un seul site, sans export vers un tiers, remplit a priori ces conditions : c'est à documenter dans la politique de traceurs et le registre. La même logique s'applique au fingerprinting, que la CNIL soumet aux mêmes règles (voir [auth-paiement.md](auth-paiement.md) [39]).

**Meta (pixel et Conversions API) et Google Ads.**
- Meta exige que l'annonceur obtienne « all necessary consents » avant de déposer ou lire des informations sur le terminal dans l'UE [34]. Il faut hacher les coordonnées envoyées par la Conversions API [34]. Meta Ireland et l'annonceur sont **responsables conjoints** (art. 26) pour les données d'événements collectées par ses outils [34], ce qui rejoint la jurisprudence Fashion ID de la CJUE (C-40/17, 2019, **non relue**).
- Google exige le consentement pour les cookies et pour la collecte, le partage et l'utilisation de données personnelles à des fins de personnalisation des annonces, avec conservation de la preuve [35].
- **La Conversions API n'échappe pas au consentement** du fait qu'elle part de notre serveur. L'e-mail haché reste une donnée pseudonyme, et la finalité reste publicitaire. Recommandation : n'envoyer les événements, côté navigateur comme côté serveur, que pour les personnes qui ont consenti, et prévoir une plateforme de gestion du consentement (CMP) avec le Consent Mode de Google. Le Consent Mode n'est pas mentionné dans la page de Google lue [35].

**Journal d'ouverture des liens de visite (qualification des prospects).** C'est le point le plus délicat de l'offre conseillers.
- Le CEPD considère qu'un **lien portant un identifiant de suivi** et un pixel de suivi relèvent de l'article 5(3) de la directive ePrivacy : la collecte de l'identifiant par ce biais est un « accès » au terminal (lignes directrices 2/2023, v2 adoptée le 16/10/2024, §49 à 51) [24]. En droit français, cela correspond à l'article 82 de la loi Informatique et libertés : il faut un consentement, sauf exemption.
- Deux lectures possibles :
  - **Jeton d'accès strictement nécessaire.** Le jeton du lien sert à ouvrir la visite demandée par le prospect, ce qui est exempté.
  - **Traceur publicitaire ou analytique.** Le rapport « ouvert le 12 à 20 h 14, 6 minutes, 3 pièces vues » envoyé au conseiller n'est pas nécessaire à l'affichage de la visite.
- Proposition à valider :
  - le jeton sert à l'accès ;
  - le conseiller ne reçoit que « ouvert / non ouvert » avec la date, sans détail ;
  - le suivi détaillé (durée, pièces) n'est activé qu'après un **bandeau de consentement** sur la page de visite ;
  - le modèle d'e-mail du conseiller contient une ligne d'information : « Ce lien vous est personnel ; son ouverture est notifiée à votre conseiller. »

  Le conseiller reste responsable de traitement (DPA).
- La CNIL avait consulté en 2025 sur une recommandation relative aux pixels dans les courriels. Je n'ai pas pu retrouver ni vérifier sa version finale : c'est à rechercher avant de construire la fonction.

---

## 4. Droit d'auteur sur les plans

### 4.1 Le plan de vente est-il protégé ?

- Sont protégés « les plans, croquis et ouvrages plastiques relatifs à la géographie, à la topographie, à l'architecture et aux sciences » (L112-2 12°) [39], ainsi que les œuvres d'architecture elles-mêmes (L112-2, connaissance), **à condition d'être originaux**. Un plan purement fonctionnel peut ne pas l'être. Le juge en décide au cas par cas : c'est le principe général, sans jurisprudence précise vérifiée ici.
- Plusieurs auteurs ou titulaires peuvent coexister sur un plan de vente :
  - l'**architecte** pour la conception ;
  - l'agence ou le dessinateur pour le document graphique (mobilier, habillage) ;
  - le **promoteur**, cessionnaire ou licencié selon ses contrats.

  Beaucoup de plans portent la mention « document non contractuel, propriété de… ».
- « Toute représentation ou reproduction intégrale ou partielle faite sans le consentement de l'auteur […] est illicite », et il en va de même pour « l'adaptation ou la transformation » (L122-4) [40]. **Une maquette 3D et une visite tirées du plan sont une adaptation.** L'auteur a aussi un droit moral, notamment au respect de l'œuvre (L121-1, non relu). La contrefaçon est un délit (L335-2 et L335-3, 3 ans et 300 000 €, **non relus**).

### 4.2 L'acquéreur (usage privé)

Exceptions (L122-5, version en vigueur depuis le 1/01/2023) [41] :
- 1° « les représentations privées et gratuites effectuées exclusivement dans un cercle de famille » ;
- 2° « les copies ou reproductions réalisées à partir d'une source licite et strictement réservées à l'usage privé du copiste et non destinées à une utilisation collective ».

Limites :
- l'exception vise la **copie** et non l'adaptation ;
- elle suppose que le **copiste soit l'utilisateur**, alors qu'ici c'est notre service qui fabrique la maquette. La jurisprudence ancienne sur les officines de reprographie va dans ce sens (à faire confirmer par l'avocat).

En pratique, le **risque est faible** : l'acquéreur a reçu le plan légitimement, pour son propre logement, et le montre à sa famille. Il n'est pas nul si les visites sont publiées. Partager un lien avec ses proches reste dans le « cercle de famille ». Publier la visite sur un réseau social ou une annonce de revente en sort.

### 4.3 Le conseiller (envoi à des prospects)

- Envoyer la visite à des prospects, c'est **représenter l'adaptation en dehors du cercle de famille, dans un but commercial**. Aucune exception ne s'applique.
- Un commercialisateur ou un CGP partenaire reçoit en général un **kit de commercialisation** du promoteur, avec un droit d'usage pour vendre les lots. Ce droit couvre-t-il des **œuvres dérivées** (3D, visites) ? Cela dépend de chaque convention de commercialisation.
- Conséquence : les CGU pro exigent que le conseiller **déclare disposer de l'autorisation du promoteur** (ou du titulaire) pour produire et diffuser une visite. À terme, l'offre promoteur réglera le problème à la source, avec un promoteur qui autorise ses distributeurs.

### 4.4 Le promoteur

Il est titulaire des droits ou licencié de l'architecte. Le contrat promoteur doit :
- lui faire **garantir** qu'il peut autoriser l'adaptation 3D et la diffusion en ligne ;
- préciser la **licence qu'il nous consent**, limitée à la fabrication, l'hébergement et la diffusion pour son compte ;
- régler le **sort des résultats** : cession ou licence, et exclusivité éventuelle ;
- dire si nous pouvons citer le programme comme **référence commerciale**. Par défaut **non**, conformément à la consigne du projet.

La **liberté de panorama** (L122-5 11°) ne couvre pas un usage commercial et ne concerne pas les intérieurs (connaissance, non relu).

### 4.5 Ce que nos CGU doivent contenir

1. **Garantie de l'utilisateur** : il détient les droits nécessaires sur le plan déposé, ou une autorisation, ou il en fait un usage strictement privé. Il ne dépose pas les plans d'autrui sans droit.
2. **Licence qu'il nous consent** : limitée à ce qui est techniquement nécessaire pour fournir le service (copies de travail, envoi au modèle, hébergement), pour la durée du service. **Aucune** réutilisation pour la démonstration, l'entraînement ou les tests sans accord séparé.
3. **Licence sur les résultats** : d'après les conditions d'Anthropic, les résultats appartiennent au client [31]. La propriété de nos rendus reste à construire avec l'avocat. En pratique, l'utilisateur reçoit une licence d'usage conforme à son offre : usage privé pour un particulier, diffusion commerciale pour un pro qui a l'autorisation. Notre moteur, nos modèles 3D et nos textures restent à nous.
4. **Conservation des mentions** : l'utilisateur ne supprime pas la mention « illustration non contractuelle ».
5. **Garantie en cas de réclamation** (B2B) : le pro nous indemnise des réclamations liées aux plans qu'il a déposés. En B2C, une telle clause serait fragile : on se limite au retrait du contenu et à la suspension.
6. **Notification et retrait** (DSA art. 16) : un titulaire de droits peut demander le retrait d'une visite. Nous coupons le lien et motivons la décision (art. 17).

### 4.6 Publication des visites et nos propres usages

- Liens non indexés, non devinables, révocables, avec une expiration. **Aucune galerie publique.**
- **Vitrine commerciale** (site, démonstrations, salons) : uniquement des plans **créés par nous** ou fournis avec une **autorisation écrite** du promoteur. Jamais de plans du dossier `plans/` (consigne du projet).
- **Amélioration de la chaîne** avec des plans clients (références de test) : il faut à la fois une licence du titulaire des droits et une base RGPD. L'exception de fouille de textes et de données (L122-5-3 CPI, non relue) couvre des reproductions pour l'analyse, pas la constitution d'une base de plans conservée. À traiter avec l'avocat avant de le faire.

### 4.7 Tableau des risques

| Cas | Risque | Mesure |
|---|---|---|
| Acquéreur, usage personnel | Faible | CGU (usage privé), liens privés |
| Acquéreur qui publie sa visite (revente, réseaux sociaux) | Moyen (pour lui ; pour nous en tant qu'hébergeur une fois alertés) | CGU, mention, retrait sur notification |
| Conseiller sans autorisation du promoteur | Moyen à élevé (usage commercial) | Déclaration dans les CGU pro, garantie, retrait |
| Promoteur | Faible si le contrat couvre les droits | Clause de garantie et licence |
| Nous, vitrine avec des plans de clients | **Élevé**, et contraire à la consigne du projet | Interdit sans accord écrit |

---

## 5. Images de synthèse, promesses et responsabilité

### 5.1 Mentions à afficher (projet)

- Sur chaque photo (filigrane discret) et dans la visite (bandeau permanent, lisible sur mobile) : **« Illustration non contractuelle générée automatiquement à partir du plan de vente. »**
- Dans la fiche d'information de la visite :

  > « Les dimensions proviennent du plan quand il les indique ; les autres sont estimées. Hauteurs, matériaux, couleurs, mobilier, vue et ensoleillement sont indicatifs. Seuls les plans et la notice descriptive annexés à votre contrat de vente font foi. »

  Pour une VEFA, le contrat comporte en annexe « les indications utiles relatives à la consistance et aux caractéristiques techniques de l'immeuble » (L261-11 CCH) [42].
- Pour les pros : la mention est **non désactivable** dans l'offre standard.

### 5.2 Ne rien promettre de ce qu'on ne garantit pas

- Proscrire, dans le marketing comme dans l'interface, « conforme », « exact », « certifié », « au centimètre », « fidèle à 100 % ». Préférer « fidèle au plan de vente », « d'après le plan », « illustration ».
- L'écart consenti (L224-25-14 III, voir 1.5) ne vaut que pour les **caractéristiques précises** annoncées : la liste de 5.1 sert à la fois d'information et de base à la case d'acceptation.
- Des allégations trop fortes exposent aux **pratiques commerciales trompeuses** (L121-2 C. conso, **non relu**) et font entrer la promesse dans le contrat.
- La jurisprudence admet que des documents publicitaires assez précis puissent devenir contractuels malgré la mention « non contractuel ». C'est un principe **à faire confirmer**, sans décision vérifiée ici : la mention aide, mais ne protège pas d'une erreur grossière.

### 5.3 Si la visite est fausse et que l'acquéreur décide sur cette base

Scénarios : l'acquéreur achète une cuisine ou des meubles aux cotes de la visite, choisit un lot plutôt qu'un autre, ou renonce à des travaux modificatifs (TMA).

- **Envers un particulier** :
  - la garantie de conformité s'applique : mise en conformité, réduction du prix ou résolution [7] ;
  - s'y ajoute la responsabilité contractuelle de droit commun pour le préjudice (art. 1231-1 C. civ., non relu), limitée au dommage prévisible sauf faute lourde (art. 1231-3, non relu) ;
  - on ne peut **ni supprimer ni réduire** le droit à réparation : clause abusive « de manière irréfragable » (R212-1 6°) [9].

  La défense repose sur trois éléments :
  1. la description honnête et l'écart consenti ;
  2. le lien de causalité : l'acquéreur disposait des plans cotés du contrat ;
  3. la qualité réelle du produit, avec les contrôles automatiques du projet.
- **Envers un pro** : plafond et exclusion des dommages indirects (2.1). Le pro doit vérifier la visite avant de la diffuser et ne doit pas retirer la mention.
- **Assurance** : une **RC professionnelle couvrant les activités numériques et le « conseil »** est à souscrire avant la mise en ligne. Préciser à l'assureur la nature exacte du service (non vérifié : garanties et prix à demander en devis).

### 5.4 Règlement européen sur l'IA (AI Act)

- Calendrier publié par la CNIL (page mise à jour le 17/08/2026) [36] :
  - le **2/08/2026**, entrée en application des « obligations de transparence concernant certains systèmes d'IA » ;
  - le **2/12/2026**, entrée en application de l'« obligation de transparence concernant le marquage de contenu généré par IA pour les systèmes d'IA concernés ayant été mis sur le marché avant le 2 août 2026 » ;
  - l'omnibus numérique a été adopté le 24/07/2026 et est **entré en vigueur le 27/07/2026** [36][38].
- Un système mis sur le marché **après** le 2/08/2026, comme le nôtre au lancement, entre donc directement sous l'article 50 s'il est concerné.
- L'article 50 §2 impose au **fournisseur** d'un système qui génère des images de synthèse un **marquage lisible par machine**. Une exception existe lorsque le système a une fonction d'assistance à la mise en forme standard ou ne modifie pas substantiellement les données d'entrée ou leur sens [37]. Le texte a été lu de façon **partielle**, et la formulation vient de mes connaissances.
- Notre cas est **ambigu** : un modèle de langage lit le plan, puis un moteur déterministe (three.js) produit les images. Le sens du plan est conservé, mais sa forme change radicalement. L'article 50 §4 (hypertrucages) vise des contenus qui ressemblent à des lieux existants et pourraient passer pour authentiques. Il pèse sur le **déployeur**, c'est-à-dire le conseiller.
- **Recommandation, pour un coût quasi nul** :
  - la mention visible de 5.1 ;
  - un marquage des métadonnées des photos (IPTC `DigitalSourceType`, voire un manifeste C2PA) ;
  - un paragraphe dans les CGU pro sur l'obligation de ne pas présenter les rendus comme des photos réelles.

  Faire qualifier notre rôle par l'avocat (fournisseur au sens du règlement, puisque nous intégrons un modèle d'usage général sous notre nom).

---

## 6. Professions réglementées (conseillers utilisateurs)

**Ce que l'outil ne change pas.**
- La loi Hoguet vise les personnes qui prêtent habituellement leur concours aux opérations sur les **biens d'autrui** : « achat, vente, recherche, échange, location… » (art. 1). Ces activités exigent une **carte professionnelle** délivrée par la CCI, avec aptitude, garantie financière et assurance RC (art. 3) [43].
- Un CGP ou un conseiller qui commercialise des lots en VEFA doit donc déjà être titulaire de la carte T, ou habilité par un titulaire (agent commercial, mandataire). Utiliser notre outil n'y ajoute rien et n'y retire rien.
- Le promoteur qui vend ses propres lots n'est pas visé, puisqu'il ne vend pas le bien d'autrui.

**Points d'attention pour eux (à intégrer au guide d'usage pro et aux CGU) :**
1. **Communication non trompeuse.** Pour un CIF, les informations doivent présenter « un contenu exact, clair et non trompeur », et « les communications à caractère promotionnel sont clairement identifiables en tant que telles » (L541-8-1 8° CMF) [44]. Pour tout professionnel, les pratiques commerciales trompeuses sont interdites (L121-2 C. conso, non relu). La mention « non contractuel » et l'interdiction de la retirer protègent aussi le conseiller.
2. **Annonces.** Si la page de visite affiche un prix, elle se rapproche d'une annonce immobilière, et l'agent doit alors y faire figurer ses honoraires. Cette règle vient de l'arrêté du 10/01/2017 sur l'information des consommateurs par les professionnels de l'immobilier, **non relu** ici. Par défaut, la page de visite n'affiche pas de prix, et c'est au pro d'ajouter ces mentions s'il en ajoute un.
3. **Données des prospects.** Le conseiller est responsable de traitement (voir 3.7) : il informe le prospect, respecte ses règles de prospection et répond aux demandes d'exercice des droits.
4. **Droit d'auteur** : il lui faut l'autorisation du promoteur (4.3).

**Ce qui nous ferait entrer dans la loi Hoguet** : la loi vise aussi la « recherche » de biens et la **vente de listes ou de fichiers** relatifs aux ventes d'immeubles (art. 1) [43]. Plusieurs fonctions seraient donc à éviter sans analyse préalable :
- mettre en relation acquéreurs et lots ;
- orienter les visiteurs d'une résidence vers un conseiller contre rémunération ;
- revendre des prospects ou des fichiers de lots disponibles.

Nous restons un **fournisseur d'outil** : chaque pro exploite ses propres prospects.

---

## 7. Liste priorisée des documents et démarches

Ordre proposé, du plus urgent (avant le premier testeur externe) au plus tardif (avant la publicité).

| # | Document ou démarche | Quand | Contenu clé | Coût connu |
|---|---|---|---|---|
| 1 | **Recherche d'antériorité puis dépôt de marque** à l'INPI | Avant toute communication publique | Classes probables : 9 (logiciel), 42 (SaaS, conception), 35 ou 36 selon l'offre ; vérifier aussi les noms de domaine | **190 € pour une classe, 40 € par classe en plus** (grille du 2/07/2026) [45]. Marque de l'UE : 850 €, puis 50 € et 150 € par classe (**non vérifié**) |
| 2 | **Mentions légales** | Avant la mise en ligne | 1.8 ; LCEN art. 1-1 [17] | 0 € |
| 3 | **CGU** (tous utilisateurs, testeurs compris) | Avant le premier testeur | Service, limites, garanties de droits, licences (4.5), mention non contractuelle, notification et retrait (DSA), suspension | Avocat (devis) |
| 4 | **Politique de confidentialité** et **registre** (responsable et sous-traitant) | Avant le premier testeur | 3.1 à 3.6 ; sous-traitants et transferts | 0 € (modèle CNIL [20]) |
| 5 | **DPA des fournisseurs** : vérifier l'incorporation (OpenRouter [27]), activer la ZDR, AITD, décider d'une bascule en direct chez Anthropic ou du routage UE | Avant le premier testeur | 3.3 | 0 € ; routage UE sur devis |
| 6 | **Masquage du cartouche** avant l'envoi au modèle ; liens non indexés et révocables | Avant le premier testeur | 3.2, 4.6 | Développement |
| 7 | **Mentions « non contractuel »** dans les rendus et **marquage des métadonnées** | Avant le premier testeur | 5.1, 5.4 ; en faire un contrôle automatique (consigne du projet) | Développement |
| 8 | **CGV B2C** avec l'encadré D211-3, la case de renonciation, la case d'écart consenti, l'e-mail de confirmation, la fonction « Renoncer au contrat ici », l'archivage | Avant la première vente | 1.2 à 1.6 | Avocat |
| 9 | **Adhésion à un médiateur** et affichage de ses coordonnées | Avant la première vente | 1.7 | Par exemple CM2C : 48 € pour 3 ans et 36 € par dossier [13] |
| 10 | **RC professionnelle** (et cyber) | Avant la première vente | 5.3 | Devis |
| 11 | **Politique de traceurs** ; Umami configuré selon la CNIL | À la mise en ligne | 3.7 | 0 € |
| 12 | **CGV pro et contrat d'abonnement**, avec le **DPA client** en annexe et la liste des sous-traitants | Avant le premier conseiller payant | 2.1, 2.2 | Avocat |
| 13 | **Guide d'usage pro** (mentions, information des prospects, autorisation du promoteur) et **journal d'ouverture conforme** | Avant l'offre conseillers | 3.7, 4.3, 6 | Rédaction interne |
| 14 | **Contrat promoteur** : licence sur les plans, SLA, réversibilité, référence commerciale ; **annexe marque blanche** | Avant le premier promoteur | 2.3, 2.4, 4.4 | Avocat |
| 15 | **CMP** avec Consent Mode, avenant de responsabilité conjointe Meta, Conversions API seulement après consentement | Avant toute campagne payante | 3.7 | Outil CMP (devis) |
| 16 | **AIPD courte** et revue annuelle | Dans les 3 mois après le lancement | 3.5 | Interne |
| 17 | Veille : accessibilité (seuils de la micro-entreprise), DPF (pourvoi Latombe), recommandation CNIL sur les pixels, AI Act | En continu | | |

---

## 8. Questions à poser à l'avocat

1. Notre produit relève-t-il du « contenu numérique » (L221-28 13°), du « service » (1°), ou des deux ? Quel est le risque de remboursement au prorata pour la part hébergement de la visite ?
2. La double case (renonciation au lancement et écart consenti à l'achat) est-elle suffisante et bien rédigée ? Faut-il la répéter à chaque génération ?
3. La fonction « Renoncer au contrat ici » est-elle due pour un achat dont la rétractation est exclue, et sous quelle forme pour des crédits partiellement utilisés ?
4. Qui est titulaire des droits sur nos rendus 3D et nos photos ? Quelle licence donner à chaque cible ?
5. Quel est le niveau de risque réel de contrefaçon pour l'acquéreur et pour le conseiller ? Faut-il exiger une preuve d'autorisation du promoteur avant d'activer la diffusion aux prospects ?
6. Le journal d'ouverture des liens est-il un traceur soumis à consentement, et avec quelle information pour le prospect ?
7. Sommes-nous « fournisseur » au sens de l'AI Act ? L'exception de l'article 50 §2 s'applique-t-elle ?
8. Chaîne contractuelle OpenRouter–Anthropic : faut-il passer en direct chez Anthropic pour bénéficier de sa garantie de propriété intellectuelle et simplifier les transferts ?
9. Plafond de responsabilité B2B défendable au regard de l'article 1170 ; conditions de la RC Pro.
10. Offre promoteur avec formulaire de contact sur la visite : où passe la frontière avec la loi Hoguet ?

---

## 9. Sources

Lues le 27/09/2026 sauf mention contraire.

| # | Source | Statut |
|---|---|---|
| 1 | Code de la consommation, art. L221-28 (1° et 13° cités mot pour mot) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170 | vérifié |
| 2 | Code de la consommation, art. L221-13 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563210 | vérifié |
| 3 | Code de la consommation, art. L221-5 (version du 19/06/2026) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310511 | vérifié (lu sous forme de synthèse) |
| 4 | Ordonnance n° 2026-2 du 5/01/2026 (L221-21, entrée en vigueur le 19/06/2026) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053298845 | vérifié |
| 5 | Décret n° 2026-3 du 5/01/2026 (D221-5) : https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053298978 | vérifié |
| 6 | Village Justice, É. Kalfon, fonction de rétractation (sanctions) : https://www.village-justice.com/articles/fonction-retractation-ligne-entre-vigueur-juin-2026-que-change-ordonnance-2026,57910.html ; voir aussi https://ekavocat.fr/ressources/bouton-retractation-vente-en-ligne-2026/ | partiel (sources secondaires) |
| 7 | Code de la consommation, L224-25-12 à L224-25-16 : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/ | vérifié |
| 8 | Code de la consommation, D211-3 (encadré pour les contenus et services numériques) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045981108 | vérifié (modèle annexé non relu) |
| 9 | Code de la consommation, R212-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032807196 | vérifié |
| 10 | Code de la consommation, L612-1 : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032223347?anchor=LEGIARTI000032224805 | vérifié (début de l'article) |
| 11 | Code de la consommation, L616-1 et L616-2 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032224762 | vérifié |
| 12 | Code de la consommation, L641-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032224624 | vérifié |
| 13 | CM2C, tarifs : https://www.cm2c.net/tarifs.php ; référencement par la CECMC : https://www.cm2c.net/ | vérifié (HT ou TTC non précisé) |
| 14 | Code de la consommation, L213-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226994 | vérifié ; seuil de 120 € et durée de 10 ans (D213-1, D213-2) non relus |
| 15 | Code de la consommation, L221-3 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226882 | vérifié |
| 16 | Service-public, mentions obligatoires d'un site : https://entreprendre.service-public.gouv.fr/vosdroits/F31228 | vérifié |
| 17 | LCEN, art. 1-1 et 1-2 (version en vigueur) : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164 | vérifié |
| 18 | Règlement (UE) 2022/2065 (DSA) : https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32022R2065 | partiel (art. 15 §2, 16 §1 et 19 §1 lus ; art. 11, 12, 14, 17 et 18 non relus) |
| 19 | RGPD, art. 28 et 30 (site de la CNIL) : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4 | vérifié |
| 20 | CNIL, registre des traitements : https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement | vérifié |
| 21 | CNIL, durées de conservation : https://www.cnil.fr/fr/les-durees-de-conservation-des-donnees | vérifié (principes) ; référentiel « gestion commerciale » non relu |
| 22 | CNIL, cookies, que dit la loi : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi | vérifié |
| 23 | CNIL, outils de mesure d'audience : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience | vérifié |
| 24 | CEPD, lignes directrices 2/2023 sur l'article 5(3) ePrivacy, v2 du 16/10/2024 : https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en (§47 à 51 lus dans le PDF) | vérifié |
| 25 | OpenRouter, politique de confidentialité (31/08/2026) : https://openrouter.ai/privacy | vérifié |
| 26 | OpenRouter, conditions d'utilisation (31/08/2026 ; 6, 7.4, 10.2, 17, 18) : https://openrouter.ai/terms | vérifié |
| 27 | OpenRouter, DPA (26/08/2026) : https://openrouter.ai/data-processing-agreement | vérifié |
| 28 | OpenRouter, confidentialité et journalisation (routage UE réservé à l'offre entreprise) : https://openrouter.ai/docs/features/privacy-and-logging | vérifié |
| 29 | OpenRouter, ZDR : https://openrouter.ai/docs/features/zdr | vérifié dans audit-code.md, non relu ici |
| 30 | Anthropic, politique de confidentialité (10/09/2026) : https://www.anthropic.com/legal/privacy | vérifié |
| 31 | Anthropic, conditions commerciales (17/06/2025) : https://www.anthropic.com/legal/commercial-terms | vérifié |
| 32 | Anthropic, DPA (24/02/2025) : https://www.anthropic.com/legal/data-processing-addendum | vérifié |
| 33 | DPF, arrêt Latombe et pourvoi : https://iapp.org/news/a/european-general-court-dismisses-latombe-challenge-upholds-eu-us-data-privacy-framework ; https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework | repris de auth-paiement.md, non relu ici |
| 34 | Meta Business Tools Terms (3/11/2025) : https://www.facebook.com/legal/terms/businesstools | vérifié |
| 35 | Google, EU user consent policy : https://www.google.com/about/company/user-consent-policy/ | vérifié (page sans date) |
| 36 | CNIL, calendrier du RIA et omnibus (mise à jour du 17/08/2026) : https://www.cnil.fr/fr/entree-en-vigueur-du-reglement-europeen-sur-lia-les-premieres-questions-reponses-de-la-cnil | vérifié |
| 37 | Règlement (UE) 2024/1689 (AI Act), art. 50 : https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32024R1689 | partiel (texte non lu mot pour mot) |
| 38 | IAPP, calendrier de l'AI Act (16/09/2026) : https://iapp.org/resources/article/eu-ai-act-timeline/ | vérifié |
| 39 | CPI, L112-2 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278875 | vérifié (via audit-code.md) |
| 40 | CPI, L122-4 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278911 | vérifié |
| 41 | CPI, L122-5 (1° et 2°) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278917 | vérifié |
| 42 | CCH, L261-11 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037667798 | vérifié |
| 43 | Loi n° 70-9 du 2/01/1970 (Hoguet), art. 1 et 3 : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000512228 | vérifié |
| 44 | CMF, L541-8-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035043376 | vérifié |
| 45 | INPI, tarifs des procédures au 2/07/2026 : https://www.inpi.fr/tarifs (PDF : https://www.inpi.fr/inpi-block/download-document?id=20516) | vérifié |

**Non vérifié** (connaissances ou sources inaccessibles pendant cette session) :
- montants des taxes EUIPO ;
- abrogation du règlement 524/2013 par le règlement 2024/3228 et fermeture de la plateforme RLL le 20/07/2025 ;
- exemption des micro-entreprises dans l'European Accessibility Act ;
- arrêt Fashion ID (C-40/17) ;
- articles L112-1, L112-1-1, L121-2 et L221-14 du Code de la consommation ;
- articles L441-1, L441-10, L442-1 et L123-22 du Code de commerce ;
- articles 1170, 1171, 1231-1 et 1231-3 du Code civil ;
- articles L121-1, L122-5 11°, L122-5-3, L335-2 et L335-3 du CPI ;
- arrêté du 10/01/2017 ;
- référentiel CNIL « gestion commerciale » ;
- recommandation CNIL sur les pixels dans les courriels ;
- présence d'OpenRouter et d'Anthropic sur la liste du DPF ;
- tarifs de Medicys, AME Conso et CNPM.
