# L5-07 · Grand livre de crédits

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-01, L5-15 | `service/` | À faire |

## Pourquoi
Règle d'OFFRES § 0.2 : un crédit n'est consommé qu'à la publication, après la visite de contrôle ; dans tous les autres cas il est rendu automatiquement. Les « billing credits » de Stripe ne conviennent pas (montants en devise, imputés en fin de période) : il faut notre propre grand livre, en ajout seul, par lots avec origine et expiration (auth-paiement.md § 2.3, § 3). Il sert dès la bêta fermée : chaque testeur reçoit 1 crédit (`CLAUDE.md`), attribué par l'équipe. Côté client, l'unité affichée est le **plan**, jamais le « crédit » (MARQUE.md § 5.1).

## À faire
1. Migration `credit_lots` et `credit_mouvements` (ARCHITECTURE § 4.2), avec ces ajouts :
   - `credit_lots.type_plan` (`apercu`, `complet`, OFFRES § 6.1) ;
   - sources d'OFFRES § 6.2, qui fait foi (R7) : `offert_inscription`, `testeur`, `achat`, `abonnement`, `recharge`, `essai`, `code`, `programme`, `geste_commercial` (et non `geste` ; ARCHITECTURE § 4.2 et SUIVI.md § 3.2 alignés) ;
   - `offre_version_id` nullable, rempli par L5-08 (droits acquis) ;
   - `quantite_restante` en cache, mis à jour dans la même transaction que le mouvement.
2. Sens des mouvements, écrit en tête du module et testé :
   - `attribution` +n ; `reservation` −1 ; `liberation` +1 ; `consommation` 0 (clôt une réservation) ; `expiration` −reste ; `remboursement` −n (crédits non utilisés retirés avant un remboursement Stripe) ; `ajustement` ±n avec motif obligatoire ;
   - chaque mouvement porte une `cle_idempotence` unique (`reservation:<travail>`, `liberation:<travail>`, événement Stripe…) et un `acteur`.
3. `service/credits/grand_livre.py`, fonctions transactionnelles :
   - `attribuer(org, source, type_plan, quantite, expire_le, prix_unitaire_centimes, cle, acteur, motif)` ;
   - `reserver(org, travail_id, type_voulu)` : verrou `SELECT … FOR UPDATE` sur la ligne de l'organisation, choix du lot selon l'étape 4, mouvement −1 ; erreur métier si aucun lot ;
   - `consommer(travail_id)` : appelé **après** l'écriture de la ligne `publications` (L5-12), jamais avant ; plan offert : à la publication de l'aperçu (vue du dessus et plan 2D prêts), plan complet : à la publication de la visite (R2) ;
   - `consommer_directement(org, type='complet', cle, acteur)` : déblocage d'un aperçu (utilisé par L8-02) ;
   - `liberer(travail_id, motif)` : +1 **sur le lot d'origine**, idempotent ;
   - `solde(org)` par type de plan et lots avec leur date d'expiration, pour « il vous en reste {n} ».
4. Ordre de consommation (OFFRES § 6.3, qui fait foi, R7) : un crédit `complet` s'il en existe un, sinon `apercu` ; parmi eux, celui qui expire le plus tôt ; à égalité : `testeur`, `essai`, `abonnement`, `recharge`, `code`, `geste_commercial`, `achat`. Le report d'un mois des crédits pros est porté par l'expiration du lot `abonnement` (fin du mois M+1, OFFRES § 6.2) : l'ordre « report, puis mois en cours, puis recharges » en découle. Les lots `programme` ne servent qu'aux lots de leur programme (L10-02), jamais à un lancement ordinaire. Table de priorité dans le code, testée.
5. Invariants (ARCHITECTURE § 4.3, OFFRES § 6.6), fonction `verifier(org=None)` et commande `python -m service.credits.verifier` :
   - aucun `quantite_restante` négatif ; `quantite_restante` = somme des deltas du lot ;
   - chaque réservation close par exactement une consommation ou une libération ;
   - aucune réservation ouverte au-delà des délais d'OFFRES § 6.4 (2 h sans battement de cœur du travail, 24 h sans démarrage) ou sans travail actif : libération automatique et alerte ;
   - chaque consommation a sa publication (vérifié dès que L5-12 existe).
   Planifiées toutes les heures par Procrastinate dès que L5-06 est fusionné.
6. Expiration : tâche quotidienne qui expire les lots échus avec un reste.
7. Crédits testeurs attribués par l'équipe : commande `python -m service.credits.attribuer --email … --source testeur --type complet --quantite 1 --jours 60 --motif "…"`, qui refuse sans motif et note l'acteur. Pendant la bêta fermée, quantité, type et validité viennent de la variante « bêta » du catalogue dès que L5-08 existe (R13). L'écran d'administration est fait par L5-25.
8. Aucune écriture directe dans ces tables ailleurs que dans ce module (test qui cherche les `insert` et `update`).

## Critères d'acceptation
- [ ] Tests unitaires de chaque fonction et de chaque invariant (critère de M2.6b).
- [ ] Test de concurrence : 20 réservations simultanées sur une organisation qui a 1 plan → une seule réussit, aucun solde négatif.
- [ ] Scénarios T0 d'OFFRES § 9.2, sans IA : échec simulé, refus 402 simulé, tâche orpheline → plan rendu sur son lot d'origine ; consommation seulement après publication.
- [ ] Test d'idempotence : même clé deux fois → un seul mouvement.
- [ ] Commande d'attribution testée sur une base locale ; motif absent → refus.
- [ ] Aucune lecture payante pour tester.

## Mesure
- `credit_offert_attribue` (`source_lot` : `testeur`, puis `offert_inscription` avec L6-06), `credit_rendu` (`motif`, `source_lot`), `credit_expire` (`source_lot`, `quantite`).

## Points d'attention
- Tranché : R7. OFFRES § 6.2 à § 6.4 font foi pour l'ordre de consommation (étape 4), les délais d'une réservation orpheline (2 h sans battement de cœur, 24 h sans démarrage) et les sources (dont `geste_commercial`). ARCHITECTURE § 4.2 et § 4.3 et auth-paiement.md § 3.1 s'y alignent (`geste_commercial` et commentaire de `credit_lots.priorite` corrigés le 27/09/2026).
- Ce que reçoit un testeur (plan complet ou aperçu) est décidé par L0-04 : le module accepte les deux.
- Découpage : la réservation au lancement et la libération sur échec sont branchées par L5-06, la consommation par L5-12 et L5-11. Ce ticket livre les fonctions, les invariants et leurs tests. La tâche horaire ne peut être planifiée qu'avec Procrastinate (L5-06) : en attendant, la commande `verifier`.
- Écrire les événements par `journal.ecrire` (L5-15, dans les dépendances), dans la même transaction que le mouvement.
- Comptabilité : chiffre d'affaires constaté à la consommation, TVA due à l'encaissement (auth-paiement § 3.3) : à valider par l'expert-comptable (L0-06). Le prix unitaire payé est gardé sur chaque lot pour cela.

## Références
- produit/OFFRES.md § 0.2, § 6.1 à § 6.6, § 9.2 (T0) ; produit/PARCOURS.md A15.
- produit/ARCHITECTURE.md § 2.3 (étapes 4, 9, 10), § 4.2 (`credit_lots`, `credit_mouvements`), § 4.3, M2.6b.
- produit/recherche/auth-paiement.md § 2.3, § 3.1 à § 3.3.
- `pipeline/serveur.py:444` (`reserver`, à remplacer côté service).

## Hors périmètre
- Crédit offert à l'inscription et anti-abus : L6-06. Achats et webhooks Stripe : L8-01. Déblocage : L8-02.
- Remboursements en argent : L8-05. Abonnements et report d'un mois : L9-01. Recharges : L9-13.
- Écran d'administration (rendre un plan, attribuer, geste commercial) : L5-25. Catalogue des offres : L5-08.
