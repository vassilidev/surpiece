# L4-08 · Réglage niveaux_max : plans au-delà du périmètre validé refusés en service

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | S (jusqu'à 1 j) | L4-01 | `pipeline/` [P] | À faire |

## Pourquoi
Le 27/09/2026, l'utilisateur a levé la consigne « sans généraliser (duplex…) » (décision 11). L'outil local lit maintenant les logements sur plusieurs niveaux : niveaux détectés et nommés, recalage par corrélation des murs, escaliers, pages d'un même logement empilées, `pipeline/niveaux.py`. C'est validé sur la duplex 3081-613 avec une lecture préparée à la main : contrôle réussi, 12 photos (L13-08, fait). Le même jour, l'utilisateur a confirmé : « oui le duplex on l'a géré c'est bon, c'était avant ça ». Les duplex sont donc acceptés en service : `niveaux_max` vaut 2 en service. Le triplex n'a été validé sur aucun plan réel. Principe 7 d'ARCHITECTURE.md : une capacité n'ouvre en production qu'après validation sur des plans réels. OFFRES.md § 1 : les plans hors périmètre sont refusés avant toute dépense, avec un message « pas encore pris en charge ». Il faut donc un réglage qui refuse, avant toute dépense, tout plan de plus de deux niveaux, sans rien changer en local. Le réglage n'existe pas encore : c'est l'objet de ce ticket ; sa valeur n'est plus une question. `niveaux_refus` ne refuse aujourd'hui que les niveaux qui n'ont pas pu être séparés ou superposés.

## À faire
1. **Condition ajoutée** dans `niveaux_refus` (`pipeline/serveur.py:271` ; L4-04, qui dépend de ce ticket, la déplacera ensuite dans `pipeline/etapes.py`) : `n = max(1, nombre de niveaux d'extract.json, niveaux vus par la qualification)` ; si `n > config.produit.niveaux_max`, refus définitif avec le code `depot.refus.niveaux` (catalogue de L4-05 ; en attendant, le texte de MESSAGES.md § 7.1), sans détail technique.
2. **Moment du refus**, inchangé : `niveaux_refus` est déjà appelé dans `analyse` juste après `extract` (`:225`, avant la calibration et la qualification), dans `calibration_needed` après la qualification (`:298`), et au début de `lecture` (`:354`) ; lignes relevées le 27/09/2026. Pour un PDF vectoriel, les niveaux sont lus sans IA : refus avant tout appel. Pour une image, ils peuvent n'être connus qu'après la qualification (environ 0,02 $).
3. **Valeurs** : `Config.depuis_env()` (L4-01) garde en local une valeur sans limite (variable `PLAN_NIVEAUX_MAX` vide par défaut), pour que l'outil local continue de traiter les plans à plusieurs niveaux. **Service : 2** (décision 11, 27/09/2026 : duplex acceptés). Le triplex s'ouvrira en relevant la valeur quand un plan réel de triplex aura été validé (plan par plan). Elle se change par simple réglage, sans déploiement.
4. **Champs lus, déjà en place** : `extract.json` → `niveaux` (avec `recouvrement` et `ordre`), qualification → `niveaux` ; `pipeline/niveaux.py` n'est pas modifié (ARCHITECTURE.md § 8.1, règle 4).
5. **Tests** :
   - unitaires : `niveaux_refus` avec un `extract.json` fabriqué à 1, 2 et 3 niveaux, et une qualification à 1, 2 et 3 niveaux, pour `niveaux_max` = 1, 2 et sans limite ;
   - intégration locale (hors CI, plan réel jamais versionné) : la duplex fournie par l'utilisateur, avec `ia_autorisee = False` (tout appel lèverait une erreur) : acceptée avec `niveaux_max = 2` ; refusée à l'analyse avec `niveaux_max = 1`, journal des appels vide (seul plan réel disponible pour vérifier le chemin du refus).

## Critères d'acceptation
- [ ] `niveaux_max = 2` (service) : la duplex est acceptée ; un `extract.json` fabriqué à 3 niveaux est refusé à l'analyse, sans aucun appel IA.
- [ ] `niveaux_max = 1` : la duplex est refusée à l'analyse, sans aucun appel IA (`ia_autorisee = False` ne lève pas, `appels-ia.json` absent) ; message du catalogue, sans texte technique.
- [ ] Image au-delà de `niveaux_max` : refusée au plus tard après la qualification, jamais après le début de la lecture.
- [ ] Réglage local par défaut : la duplex 3081-613, rejouée depuis sa lecture gardée, donne le même résultat qu'avant (contrôle réussi, 12 photos).
- [ ] Plans à un niveau inchangés (rejeu sans IA des références, L1-02).
- [ ] Contrôle « aucun texte technique » (L1-04) ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **« Avant tout appel payant »** (M1.9) n'est vrai que pour les PDF vectoriels : une image passe par la qualification (environ 0,02 $) avant que ses niveaux soient connus, sauf si `extract` les détecte déjà sur l'image. Accepter cette nuance, ou la reprendre dans L6-02.
- **Deux causes** : « niveaux non séparés » (défaut de lecture) et « au-delà de `niveaux_max` » (choix de périmètre). `depot.refus.niveaux` (« plus de deux niveaux », MESSAGES.md § 7.1) ne vaut que pour la seconde : L4-05 propose un second code pour la première (`depot.refus.niveaux_illisibles`, MESSAGES.md § 12.2). Dans tous les cas, deux causes distinctes au journal pour la mesure (`motif_refus = plusieurs_niveaux`, SUIVI.md § 3.2).
- **Ordre avec L4-04 : tranché.** L4-04, qui déplace `niveaux_refus`, dépend de ce ticket : celui-ci passe avant.
- **Tranché : R17.** Depuis le 27/09/2026, l'analyse n'empile que des pages qui portent des noms de niveau différents et, quand le numéro de lot est écrit, le même lot (`pages_niveaux`, `numeros_lot`, `extract.py`). Un PDF de plusieurs lots sans numéro de lot lisible peut encore être empilé, donc refusé ici avec le message des niveaux s'il empile plus de deux pages. En service, c'est la qualification qui refuse « plusieurs lots » (`depot.refus.plusieurs_lots`, L6-02) ; seul l'import promoteur (L10-02) découpe un PDF de plusieurs lots. Ici, rien n'est généralisé ; l'ordre des deux refus, pour que l'utilisateur lise le bon message, se règle dans L6-02.
- Mot « duplex » dans la FAQ : tranché par la décision 11 (MESSAGES.md § 12.1) ; la FAQ répond oui pour le duplex. Le refus parle de « plus de deux niveaux ».
- **Coordination avec le travail sur les niveaux** (terminé le 27/09/2026, pas encore commité : 23 fichiers, dont `pipeline/niveaux.py`) : partir de son commit (ARCHITECTURE.md, M1.9) ; diff limité à `niveaux_refus` ; critère de fusion du § 8.1.

## Références
- produit/ARCHITECTURE.md § 1 (principe 7), § 7.2 (`ConfigProduit`), § 8.1 (règles 4 et 5), M1.9 ; produit/OFFRES.md § 1 (Périmètre), § 7.1 ; produit/PARCOURS.md § 1.6 (ligne « Plusieurs niveaux ») ; produit/MESSAGES.md § 7.1, § 12.1 ; CLAUDE.md.
- pipeline/serveur.py:166 (`analyse`, appel `:225`), :243 (`texte_niveaux`), :271 (`niveaux_refus`), :290 (`calibration_needed`), :323 (`qualifier`, champ `niveaux`), :352 (`lecture`), relevés le 27/09/2026 ; pipeline/niveaux.py (non modifié) ; pipeline/extract.py (`pages_niveaux`, champ `niveaux`).

## Hors périmètre
- Lecture réelle par l'IA d'une duplex : L1-13 (vérification utile, pas un préalable). Travail sur les plans à plusieurs niveaux : L13-08 (fait). Qualification étendue aux PDF : L6-02. Formulaire « Me prévenir si cela change » et événement `alerte_prise_en_charge_demandee` : parcours du lot 6.
