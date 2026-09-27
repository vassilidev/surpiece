# L9-13 · Abonnements Pro (2/2) : recharges, places, annuel, remise fondateurs

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P1 | M (1 à 3 j) | L9-01 | `service/` | À faire |

## Pourquoi
L9-01 pose les formules mensuelles, les quotas, le report d'un mois et la résiliation. Il reste quatre mécanismes d'`OFFRES.md` § 3, découpés de L9-01 pour tenir dans sa taille : les **recharges** de 5 plans (45, 40 ou 35 € HT selon la formule, valables 12 mois tant que le compte est actif), les **places** supplémentaires (10 € HT par mois), l'**annuel** (10 mois payés : 490, 990 ou 1 990 € HT) et la **remise fondateurs** (30 % pendant 6 mois pour les 30 premiers cabinets, § 3.10), qui sert la bêta fondateurs de L9-11. Comme pour L9-01, Stripe encaisse et notre grand livre compte les plans ; prix, quantités et durées viennent du catalogue, jamais du code (R5).

## À faire
1. **Catalogue** (L5-08, R5) : versions `pro_recharge_<formule>` (5 plans ; 45, 40 ou 35 € HT), `pro_siege` (10 € HT par mois), versions annuelles des trois formules (490, 990 et 1 990 € HT), remise fondateurs (taux, durée, nombre de cabinets, date de fin). `Price` et coupons Stripe créés à neuf à la publication de chaque version (fonction de L8-01 étendue), jamais modifiés ; droits acquis honorés.
2. **Recharges** (`OFFRES.md` § 3.2) :
   - Checkout en paiement unique depuis l'espace pro, au prix HT de la formule souscrite ;
   - webhook (point d'entrée de L8-01, idempotent, clé = session Checkout) → lot `recharge` de 5 plans (L5-07), valable 12 mois, utilisable tant que le compte est actif (abonnement ou Veille) ; `recharge_payee` ;
   - consommées après le report et le mois en cours, par l'expiration la plus proche (`OFFRES.md` § 6.3, R7) ;
   - garde-fou : au-delà de 3 fois le quota mensuel en recharges dans le mois, `erreur.pro.recharge_limite` et achat validé par l'équipe (administration, motif obligatoire) ; c'est ce qui bloque un compte piraté.
3. **Places supplémentaires** : quantité de l'élément `pro_siege` de l'abonnement, modifiée depuis l'écran des membres (L9-03), avec prorata Stripe ; `organisations.membres_max` = places incluses (L9-01) + places achetées ; une baisse est refusée tant que le nombre de membres dépasse la nouvelle valeur.
4. **Annuel** (`OFFRES.md` § 3.1, § 3.7) :
   - choix mensuel ou annuel ajouté à la page « Choisir votre formule » de L9-01 ;
   - payé d'avance, non remboursable sauf manquement de notre part (§ 6.5) ;
   - Stripe ne facture qu'une fois par an : une tâche mensuelle, à la date anniversaire, attribue le lot `abonnement` du mois (clé `abonnement:<id>:<AAAA-MM>`), avec le même report d'un mois, tant que l'abonnement est actif ;
   - passage du mensuel à l'annuel, ou l'inverse, à la fin de la période en cours.
5. **Remise fondateurs** (`OFFRES.md` § 3.10) : coupon Stripe de 30 % pendant 6 mois (`duration=repeating`), limité aux 30 premiers cabinets et à une date de fin, remis par un code privé pendant la bêta fondateurs (L9-11) ; offre affichée sur la page « Choisir votre formule » seulement quand le code est saisi, et bloc de la page pro seulement pendant la bêta (`MESSAGES.md` § 2.9), jamais présentée comme une remise permanente ; propriété `remise` de `abonnement_demarre`.
6. **Webhooks** : même point d'entrée que L9-01 ; `customer.subscription.updated` distingue formule, périodicité et places.

## Critères d'acceptation
- [ ] Stripe en mode test avec horloges de test : annuel → une facture et 12 lots mensuels, avec report d'un mois ; passage du mensuel à l'annuel à la fin de la période.
- [ ] Recharge payée → lot de 5 plans valable 12 mois ; webhook rejoué → un seul lot ; recharge au-delà de 3 fois le quota dans le mois → refus et message du catalogue.
- [ ] Ordre de consommation vérifié sur horloge injectée : report, puis mois en cours, puis recharges.
- [ ] 4e membre refusé en Cabinet sans place achetée ; place achetée → invitation possible ; baisse de places sous le nombre de membres refusée.
- [ ] Code fondateurs : 30 % appliqué pendant 6 mois, puis plein tarif ; 31e cabinet ou date de fin passée → code refusé avec un message du catalogue.
- [ ] Nouvelle version de prix d'une recharge publiée → nouveau `Price` Stripe, lots déjà achetés inchangés.
- [ ] Aucune lecture payante ; aucun texte technique ; invariants du grand livre verts.

## Mesure
- `recharge_payee` (`formule`, `montant_ht_centimes`).
- `abonnement_demarre` (`periodicite`, `remise` : `aucune` ou `fondateurs_30`) ; `abonnement_modifie` pour un changement de périodicité.
- Un changement du nombre de places n'a pas d'événement au dictionnaire : à ajouter à `SUIVI.md` § 3.12 et à `mesure/evenements.json` si l'on veut le suivre.

## Points d'attention
- **Marge** : même remisées, toutes les formules restent en marge positive (37 % en Équipe, `OFFRES.md` § 8.4) ; la remise est réelle, datée et limitée.
- **Droits acquis** : un abonné annuel garde son prix jusqu'à la fin de la période payée ; la bascule vers une nouvelle version se fait au renouvellement, annoncée par e-mail (L5-08, L9-01).
- **Recharges à la fin du compte** : `OFFRES.md` dit « utilisables tant que le compte est actif (abonnement ou Veille) », sans écrire le sort des plans rechargés restants après la fin de la Veille : à préciser par l'utilisateur (L0-04) avant la mise en production.
- **Tests de prix** : le prix Solo (49 ou 69 €) se teste par périodes, par versions du catalogue, jamais par tirage (R8).
- **Bêta fondateurs** : avant l'essai en ligne, les pages pros ne proposent qu'un entretien ou la bêta fondateurs (R21, L2-18) ; la remise n'est appliquée qu'à la souscription.
- Taille M : si l'annuel déborde (tâche mensuelle et horloges de test), le livrer à part après les recharges et les places.

## Références
- produit/OFFRES.md § 3.1, § 3.2, § 3.7, § 3.10, § 6.2, § 6.3, § 6.5, § 8.4 ; produit/ARCHITECTURE.md M4.1, § 4.2 (`abonnements`, `organisations`).
- produit/PARCOURS.md B7, B8 ; produit/MESSAGES.md § 2.7, § 2.9, § 5.7, § 7.12 (`erreur.pro.recharge_limite`) ; produit/SUIVI.md § 3.12.
- tickets L5-07 (lots `recharge` et `abonnement`), L5-08 (catalogue), L8-01 (prix Stripe), L9-01, L9-03 (écran des membres), L9-11 (bêta fondateurs).

## Hors périmètre
- Formules mensuelles, quotas, report, portail, SIREN et TVA, résiliation, Veille : L9-01.
- Écran des membres et invitations : L9-03. Essai : L9-02. Démarchage des premiers cabinets : L9-11.
- Recharges d'une instance en marque blanche (7 € HT le plan) : L11-04. Facturation électronique : L9-10.
