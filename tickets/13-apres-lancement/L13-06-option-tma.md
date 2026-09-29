# L13-06 · Option variante TMA

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | L (3 à 5 j) | L1-02 | `pipeline/` [P], `moteur/` [M] | À faire |

## Pourquoi
Les travaux modificatifs acquéreur (TMA) sont un moment clé de l'achat sur plan : l'acquéreur veut voir son logement avec les cloisons modifiées avant de signer l'avenant (recherche/marche.md § 3, § 2.6). Les configurateurs des promoteurs (Habiteo) le font déjà côté promoteur. OFFRES.md § 7.2 (option 4) fixe le cadre : une variante **seulement à partir d'un plan modificatif du promoteur ou de l'architecte, lu comme un nouveau plan**, jamais à partir d'un croquis, sans aucune mention de faisabilité, avec une vue comparée avant et après. Prix cible : 19 € TTC la variante, 1 plan du quota pour un conseiller, 50 % du prix du lot pour un promoteur.

## À faire
1. **Entrée** : le plan modificatif (PDF du promoteur ou de l'architecte) passe par la chaîne normale (analyse, qualification, lecture, murs, contrôle) et est rattaché au plan d'origine (`plans.version_de`). Le « plan suivant » à 15 € existe déjà pour ce cas ; la variante TMA y ajoute la vue comparée.
2. **Recalage des deux lectures** dans un même repère (enveloppe, porte palière, murs porteurs communs), par un nouveau module `pipeline/comparaison.py` (ajout, pas de modification) ; recalage vérifié (murs communs superposés à quelques centimètres près, seuil fixé sur des cas réels) ; échec → pas de vue comparée, le plan suivant reste disponible.
3. **Vue comparée** : plan 2D avant et après avec les cloisons ajoutées ou retirées surlignées et libellées (jamais la couleur seule) ; surfaces par pièce avant et après ; photos appariées par pièce ; bascule avant/après dans la visite (`[M]`).
4. **Textes** : aucune mention de faisabilité, de structure ni de prix des travaux ; mention non contractuelle ; renvoi vers le promoteur pour toute validation.
5. **Contrôles automatiques** : zéro défaut sur chacune des deux lectures ; recalage vérifié ; aucune différence affichée qui ne vienne des deux plans.
6. **Validation plan par plan** sur des couples réels (plan d'origine et plan modificatif) fournis par l'utilisateur ; coût mesuré ; prix au moins 5 fois ce coût (OFFRES.md § 7.1).

## Critères d'acceptation
- [ ] Sur un couple de test fabriqué (témoin et témoin avec une cloison déplacée) : recalage réussi, différences exactes, aucune fausse différence.
- [ ] Plan modificatif d'un autre logement : recalage refusé proprement, message du catalogue.
- [ ] Aucun texte de faisabilité (liste de mots interdits ajoutée au contrôle des textes, L1-04).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 ; aucune lecture payante pour tester (lectures gardées).

## Points d'attention
- **Tranché : R7.** Le résumé du JSON dit « modifier des cloisons pour visualiser des travaux modificatifs », ce qui évoque un éditeur de cloisons dans l'application. OFFRES.md § 7.2, qui fait foi pour les offres, l'exclut (plan modificatif seulement, jamais un croquis, aucune faisabilité). Ce ticket suit OFFRES.md ; un éditeur serait une nouvelle décision de l'utilisateur (risque : laisser croire qu'une cloison est déplaçable, gaines et porteurs ignorés).
- **Taille** : L au plafond ; découper si besoin en « recalage et différences » puis « vue comparée dans la visite ».
- Pour les promoteurs, une nouvelle version d'un lot existe déjà à 50 % du prix (OFFRES.md § 4.6) : ne pas facturer deux fois.
- Plusieurs niveaux : travail du 27/09/2026 fait (non commité) ; nouveaux fichiers, petits diffs isolés ; variante TMA possible pour un duplex (acceptés en service, `niveaux_max = 2`, L4-08) ; pas au-delà de deux niveaux.

## Références
- produit/OFFRES.md § 0.1 et § 2.3 (plan suivant), § 4.6, § 7.1, § 7.2 (option 4) ; produit/recherche/marche.md § 2.6, § 3.1, § 5.2 ; produit/MESSAGES.md § 3.10.
- produit/ARCHITECTURE.md § 8.1 ; `pipeline/lire.py` (`read_plan`) ; `outils/finalise.sh`.

## Hors périmètre
- Plan suivant à 15 € : L8-01 et le catalogue (L5-08). Meublé : L13-04. Vue de la résidence : L13-07.
