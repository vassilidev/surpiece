# L9-09 · Codes à offrir à ses clients

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P2 | M (1 à 3 j) | L9-01, L9-12 | `service/` | À faire |

## Pourquoi
Un pro achète des codes (15 € HT par lots de 10, 12 € HT dès 50) et les offre à ses clients acquéreurs, qui déposent eux-mêmes leur plan pour leur usage privé : le pro ne diffuse rien, la question de l'autorisation du promoteur ne se pose a priori pas (à confirmer par l'avocat), et nous gagnons un particulier (`OFFRES.md` § 3.9, § 5.1). C'est aussi la première étape avant toute marque blanche (§ 5.6). Décision du backlog : ne le construire qu'après un premier partenaire signé (jalon J4, L9-12).

## À faire
1. **Catalogue** (L5-08) : `codes_10` (150 € HT, par carte depuis un compte Pro) et `codes_50` (12 € HT l'unité, sur facture et virement, créé par l'équipe) ; 1 code = 1 plan complet, visite comprise, valable 12 mois après l'achat, non revendable.
2. **Tables** `lots_codes` (organisation acheteuse, quantité, prix unitaire, date, expiration, achat ou facture) et `codes` (lot, `code_hash`, `code_chiffre` pour le réafficher à l'acheteur, statut, organisation bénéficiaire, date d'utilisation). Codes de 8 caractères en base 32 sans caractères ambigus, affichés `ABCD-EFGH` ; comparaison en temps constant.
3. **Achat** : Checkout par la fonction de L8-01 (paiement unique, prix HT) ou création par l'équipe dans l'administration pour 50 codes et plus (facture, L9-10) ; le webhook crée le lot de codes. L'acheteur reçoit la liste des codes, le lien de la page co-marquée avec le code prérempli et une carte à imprimer (PDF, outil de L8-08).
4. **Page co-marquée** `app.<domaine>/offert/<partenaire>` (`PARCOURS.md` D1, textes à ajouter à `MESSAGES.md`) : logo du partenaire (marque de L9-06), « Offert par {partenaire} », champ du code, bouton « Utiliser mon code », limites, signature ; puis le parcours A2 à A7 à l'identique.
5. **Utilisation**, à la création du compte ou depuis « Mon compte » : dans une transaction avec verrou, le code passe à `utilise` et un lot `code` d'un plan complet est créé (L5-07), expirant à la date du code. Case d'écart consenti et CGU ; **pas de case de renonciation** (aucun paiement).
6. **Refus motivés** (messages à ajouter) : code inconnu, déjà utilisé, expiré. Limites : 5 essais par heure, par IP et par compte, puis attente.
7. **Tableau du partenaire** : codes utilisés ou non, date d'utilisation ; **aucun** accès au plan, au nom ni à l'e-mail du bénéficiaire.
8. **Codes testeurs** : même écran, générés par l'équipe, valables 60 jours, source `testeur` (`PARCOURS.md` D1, `OFFRES.md` § 2.2).
9. **Comptabilité** : codes prépayés ; ceux qui ne sont pas utilisés au bout de 12 mois expirent (`OFFRES.md` § 8.6) ; ils figurent dans l'export de L8-05.

## Critères d'acceptation
- [ ] Stripe en mode test : achat de 10 codes → 10 codes affichés, facture HT ; utilisation → plan complet, sans paiement ni case de renonciation.
- [ ] Même code utilisé deux fois en même temps → une seule réussite (test de concurrence).
- [ ] Codes inconnu, utilisé, expiré → messages du catalogue ; 6e essai dans l'heure → attente.
- [ ] L'API du partenaire ne renvoie ni plan, ni e-mail, ni nom du bénéficiaire (test).
- [ ] Invariants du grand livre verts ; aucune lecture payante (`PLAN_MOCK`) ; aucun texte technique.

## Mesure
- `codes_achetes` (`quantite`, `prix_unitaire_ht_centimes`, `acheteur`, `moyen`), `code_utilise` (`acheteur`, `delai_depuis_achat`).
- `code_refuse` (à ajouter à `SUIVI.md`, `motif`) ; `credit_offert_attribue` (`source_lot=testeur`) pour les codes testeurs.

## Points d'attention
- **Question à l'avocat** : l'usage privé par l'acquéreur écarte-t-il l'autorisation du promoteur pour le pro qui offre le code (`OFFRES.md` annexe B, q. 4 ; `MESSAGES.md` § 2.10, marqué **[À VALIDER : avocat]**) ?
- **Loi Hoguet** : le code ne crée aucune orientation de l'acquéreur vers le pro, ni de nous vers lui (`OFFRES.md` § 2.7).
- **Acheteurs non pros** : services d'accompagnement VEFA et courtiers (L9-12) n'ont pas forcément d'abonnement Pro ; la dépendance à L9-01 suppose un compte Pro. Proposition : un compte d'organisation `partenaire` sans abonnement ; à trancher.
- **Cannibalisation** (`OFFRES.md` § 10, risque 17) : codes non revendables, licence d'usage privé.
- **Tranché : R21.** Tant que ce ticket n'est pas en production, la page `/marque-blanche` (L2-07) décrit les codes comme « en préparation », sans prix ni commande ; elle ne propose leur commande qu'ensuite.
- Codes d'environ 40 bits : suffisant avec les limites d'essais ; à revoir si des codes circulent publiquement.

## Références
- produit/OFFRES.md § 2.2, § 3.9, § 5.1, § 5.6, § 6.2, § 7.3 (J4), § 8.6, § 10, annexe B ; produit/PARCOURS.md D1.
- produit/MESSAGES.md § 2.10, § 4.2 ; produit/SUIVI.md § 3.14 ; produit/ARCHITECTURE.md § 6.3 (comparaisons en temps constant).
- tickets L5-07 (source `code`), L8-01, L8-08, L9-06, L9-12.

## Hors périmètre
- Recherche du premier partenaire : L9-12. Instance en marque blanche : L11-01 à L11-04.
- Facturation électronique des codes vendus sur facture : L9-10.
