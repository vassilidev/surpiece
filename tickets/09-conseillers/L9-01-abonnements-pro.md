# L9-01 · Abonnements Pro (1/2) : formules, quotas, report, résiliation

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | L (3 à 5 j) | L2-18, L5-04, L8-01, L9-08 | `service/` | À faire |

## Pourquoi
Les conseillers sont visés comme premiers clients payants récurrents (`recherche/marche.md` § 5.5, `OFFRES.md` § 0.3) : Solo 49 €, Cabinet 99 €, Équipe 199 € HT par mois, 5, 12 et 30 plans inclus, report d'un mois, recharges, sans engagement, résiliation en ligne (`OFFRES.md` § 3.1 à § 3.7). Stripe Billing encaisse, notre grand livre compte les plans (`recherche/auth-paiement.md` § 2.2, § 2.3). Les entretiens de L2-18 doivent d'abord avoir confirmé la promesse et la réaction aux prix. Ticket M4.1, découpé en deux : ce ticket porte les formules mensuelles, les quotas, le report, le portail, le SIREN et la TVA, la résiliation et la Veille ; L9-13 porte les recharges, les places, l'annuel et la remise fondateurs.

## À faire
1. **Catalogue** (L5-08, R5) : versions mensuelles `pro_solo`, `pro_cabinet`, `pro_equipe` et `pro_veille` (9 € HT par mois). Prix HT (`tax_behavior=exclusive`, 20 %), `Price` Stripe récurrents créés à neuf à la publication de chaque version (fonction de L8-01 étendue). Quota, places incluses, plafond IA mensuel de l'organisation (L5-09) et générations simultanées (3, 6 en Équipe) lus dans la version, jamais dans le code. Annuel, recharges et places supplémentaires : L9-13.
2. **Page « Choisir votre formule »** (`PARCOURS.md` B7, `MESSAGES.md` § 2.7, § 5.7) : trois cartes en HT, en mensuel (l'annuel et l'offre fondateurs y sont ajoutés par L9-13) ; ligne factuelle tirée de l'essai (« Vous avez utilisé {n} plan(s) sur 3 et créé {m} lien(s). ») ; acceptation des CGV pro et du DPA en vigueur (L9-08) ; bouton `Choisir <formule>` → Checkout `mode=subscription` : carte ou prélèvement SEPA, collecte du numéro de TVA, SIREN prérempli depuis l'organisation (L9-02) en champ personnalisé, adresse de facturation, `client_reference_id` = organisation.
3. **Webhooks** (point d'entrée de L8-01, idempotents) :
   - `checkout.session.completed` (abonnement) → ligne `abonnements`, `organisations.offre_code` et `offre_version_id` (version souscrite du catalogue, R5), `stripe_customer_id` ; `abonnement_demarre` ;
   - `invoice.paid` d'une facture mensuelle → lot `abonnement` de `quota` plans (lu dans la version souscrite), expiration à la fin du mois M+1 (report d'un mois, `OFFRES.md` § 3.2, § 6.2), clé = identifiant de la facture ; `abonnement_renouvele` ;
   - `customer.subscription.updated` (formule, places, résiliation programmée) → `abonnement_modifie` ; `customer.subscription.deleted` → `abonnement_termine` ; `invoice.payment_failed` → `paiement_echoue`, relances de Stripe, e-mail (texte à ajouter), aucun nouveau lot.
4. **Fin de période** : `quota_cloture` (plans inclus, utilisés, reportés, perdus) ; les plans du mois précédent non utilisés expirent (grand livre, `credit_expire`). L'ordre « report, puis mois en cours, puis recharges » (`OFFRES.md` § 3.2, § 6.3, R7) découle de l'expiration la plus proche (L5-07).
5. **Places incluses** : `organisations.membres_max` = places de la formule, lues dans la version (1, 3, 10) ; au-delà, refus par L5-04. L'achat de places supplémentaires est dans L9-13.
6. **Portail client Stripe** : carte, factures (SIREN et numéro de TVA du client portés sur chaque facture) et résiliation.
7. **Changement de formule** : hausse immédiate avec prorata Stripe et quota du mois complété de la différence ; baisse à la fin de la période (planification Stripe). À valider par l'utilisateur.
8. **Résiliation depuis nos pages** (trois écrans au plus, B7) : effective à la fin de la période, sans remboursement du mois entamé ; proposition de la **Veille** (visites et liens gardés, aucun nouveau plan) ; motif facultatif en liste fermée ; liens actifs 90 jours après la fin, avec export (`OFFRES.md` § 3.7, § 6.8).
9. **Droits acquis** (L5-08, R5) : un nouveau prix est une nouvelle version du catalogue et un nouveau `Price` Stripe ; il s'applique aux abonnés par une planification Stripe à la fin du préavis, annoncée par e-mail ; un quota n'est jamais baissé (`OFFRES.md` § 3.1).

## Critères d'acceptation
- [ ] Stripe en mode test avec horloges de test : 3 mois en mensuel → 3 lots, report d'un mois, expiration du reste.
- [ ] Webhooks rejoués → un seul lot par période ; paiement échoué → aucun lot, `paiement_echoue`.
- [ ] Résiliation → fin de période, liens actifs 90 jours puis coupés ; Veille → liens gardés, lancement refusé.
- [ ] 4e membre refusé en Cabinet (3 places incluses, lues dans la version).
- [ ] Nouvelle version de prix publiée → abonné existant facturé à l'ancien prix jusqu'à la date de bascule annoncée.
- [ ] SIREN du client et numéro de TVA présents sur la facture Stripe (test par l'API).
- [ ] Un membre sans rôle de propriétaire ne peut ni changer de formule ni résilier (test d'accès).
- [ ] Aucune lecture payante ; aucun texte technique ; invariants du grand livre verts.

## Mesure
- `paiement_ouvert` (`formule` = code d'offre pro du catalogue, SUIVI.md § 3.2 et § 3.10).
- `abonnement_demarre`, `abonnement_renouvele`, `abonnement_modifie`, `abonnement_resilie`, `abonnement_termine`, `paiement_echoue`.
- `quota_cloture`, `quota_atteint`.

## Points d'attention
- **Découpé** : recharges, places supplémentaires, annuel et remise fondateurs sont dans L9-13, qui dépend de ce ticket.
- **Tranché : R7.** `OFFRES.md` fait foi : report d'un mois (§ 3.2, § 6.2) ; `ARCHITECTURE.md` M4.1 s'y aligne (le lot « non cumulable » est abandonné).
- **Tranché : R5.** Les valeurs d'offre des organisations viennent du catalogue (`organisations.offre_code`, `offre_version_id`), jamais d'un code figé du type `pro-5` ; les quotas du lancement sont 5, 12 et 30 (`OFFRES.md` § 3.1).
- **Tranché** : L9-08 est une dépendance déclarée (CGV pro et DPA acceptés avant le paiement).
- Frais : Billing 0,7 % ; le prélèvement SEPA (0,35 €) améliore la marge (`OFFRES.md` § 8.2, § 8.4).
- L221-3 : un abonnement signé en rendez-vous chez un pro de 5 salariés au plus ouvre 14 jours de rétractation, appliqués d'office (`OFFRES.md` § 3.7) : procédure dans l'administration.
- Clients pros hors de France : autoliquidation et déclaration européenne de services (auth-paiement § 4.1), ou refus au lancement.
- L'écran des membres (relevé par L5-04) est porté par L9-03.

## Références
- produit/OFFRES.md § 3.1 à § 3.7, § 3.10, § 6.2, § 6.3, § 8.2, § 8.4 ; produit/recherche/auth-paiement.md § 2.2, § 3.3, § 4.1, § 4.2.
- produit/ARCHITECTURE.md M4.1, § 4.2 (`abonnements`, `organisations`), § 6.5 ; produit/PARCOURS.md B7, B8 ; produit/MESSAGES.md § 2.7, § 5.7, § 7.12.
- produit/SUIVI.md § 3.12 ; tickets L5-04, L5-07, L5-08, L5-09, L8-01.

## Hors périmètre
- Recharges, places supplémentaires, annuel, remise fondateurs : L9-13.
- Essai : L9-02. Écran des membres et prise en main : L9-03. Conditions et DPA : L9-08.
- Facturation électronique : L9-10. Codes à offrir : L9-09. Marque blanche : lot 11.
