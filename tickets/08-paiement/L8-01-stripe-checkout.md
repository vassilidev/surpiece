# L8-01 · Paiement Stripe des particuliers

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | L (3 à 5 j) | L5-08, L0-06 | `service/` | À faire |

## Pourquoi
Pour vendre la visite (29 € TTC), le plan suivant (15 €) et « Comparer 3 lots » (59 €), il faut encaisser et transformer chaque paiement en plans au grand livre, une fois et une seule. Stripe encaisse, notre base compte : les « billing credits » de Stripe ne s'appliquent pas aux paiements uniques (`recherche/auth-paiement.md` § 2.3). Stripe en direct est préféré à un intermédiaire revendeur, qui coûterait 3,5 à 5 points de plus (§ 2.4). Décision 7 : les prix viennent du catalogue modifiable sans déploiement (L5-08), jamais d'une constante du code. Ticket M3.1 d'`ARCHITECTURE.md`.

## À faire
1. **Prix Stripe** (`service/paiement/prix.py`) : à la publication d'une version payante du catalogue, créer le `Price` Stripe (EUR, TTC, `tax_behavior=inclusive`, taux fixe de 20 %, Stripe Tax non activé, auth-paiement § 2.2) et remplir `stripe_price_id`. Un prix n'est jamais modifié chez Stripe : nouvelle version, nouveau `Price`. Offres : `particulier_visite` (29), `particulier_plan_suivant` (15), `particulier_pack_3` facturé en trois lignes 29 + 15 + 15 (`OFFRES.md` § 2.3).
2. **Page « Votre commande »** (`app.<domaine>/commande`, Jinja2 ; `PARCOURS.md` A11 ; `MESSAGES.md` § 7.7), dans l'ordre :
   - `achat.titre`, puis la ligne (`achat.ligne.visite`, `achat.ligne.pack` ou `achat.ligne.suivant`) avec le prix de la version en vigueur ;
   - `achat.compris` et `achat.validite` construits depuis le **contenu** de la version (R1 : les mêmes images que l'aperçu, aucun nombre de photos promis) ; `achat.limites` ;
   - emplacement des deux cases, livrées par L8-03 ; `achat.retractation`, `achat.remboursement`, `achat.liens` ;
   - bouton principal **« Payer 29,00 € TTC »** (montant lu dans la version), puis la ligne « Paiement sécurisé par carte. Libellé sur votre relevé : … ».
3. **Session Checkout** (`POST /api/commandes`) : `mode=payment` ; `line_items` depuis les `stripe_price_id` ; `customer_email` prérempli ; `client_reference_id` = organisation ; `metadata` : organisation, compte, identifiants des versions d'offre, `plan_id` pour un déblocage, `periode_prix`, identifiants des acceptations de L8-03 ; `invoice_creation` selon le choix de L8-05 ; `expires_at` à 30 min ; carte, Apple Pay et Google Pay. Clé d'idempotence Stripe dérivée du compte, de l'offre, du plan et d'une fenêtre courte : un double clic ne crée qu'une session.
   - Plan suivant à 15 € : seulement dans les 12 mois qui suivent un premier achat payé de l'organisation (calcul sur `achats`), sinon retour au 29 €.
   - Refus de créer la session si la version n'a pas de `stripe_price_id`, si la vente est fermée (drapeau `vente_particuliers_ouverte` du catalogue, ouvert par L8-07), ou si le prix affiché n'est plus celui de la version en vigueur (période de prix changée : la page se recharge, A10).
4. **Webhook** `POST /api/stripe/webhook`, dans le seul service web : corps brut, signature vérifiée avec le secret `whsec_` (gestionnaire de secrets), tolérance d'horodatage ; événement inconnu → 200 sans effet.
   - `checkout.session.completed` avec `payment_status=paid` : dans **une** transaction, ligne `achats` (unique sur `stripe_checkout_session_id`) ; lots par `attribuer` (L5-07), clé d'idempotence = identifiant de la session, **un lot par prix unitaire** (pack : 1 plan à 2 900 centimes et 2 plans à 1 500), `offre_version_id`, validité 12 mois, source `achat` ; événement `achat_paye`. Avec un `plan_id` : appel du déblocage de L8-02 dans la foulée.
   - `checkout.session.expired` → `paiement_abandonne`. `charge.dispute.created` → `litige_ouvert` et alerte immédiate (`OFFRES.md` § 8.11). `charge.refunded` : traité par L8-05.
   - Montants HT et TVA calculés ligne par ligne, en centimes (29,00 TTC = 24,17 HT + 4,83 TVA).
5. **Retour de paiement** : la page interroge l'état de la commande. Tant que le webhook n'est pas traité : « Paiement reçu, confirmation en cours… » ; au-delà de 2 min : `erreur.paiement_interrompu`. Sinon `achat.ok`, `achat.ok_pack`, `achat.annule`, `erreur.paiement_refuse` (`MESSAGES.md` § 7.7, § 7.12).
6. **Paiement en double** pour un même déblocage : le second est remboursé automatiquement (fonction de L8-03) et signalé à l'équipe.
7. **Rapprochement quotidien** (`python -m service.paiement.rapprocher`, tâche planifiée) : paiements réussis de la veille lus par l'API Stripe contre `achats` et `credit_lots`. Paiement sans lot ou lot acheté sans paiement → alerte (L5-16) ; jamais de correction silencieuse (`OFFRES.md` § 6.6).
8. **E7** (confirmation de commande, `MESSAGES.md` § 7.11) envoyé par L5-14, avec les pièces jointes disponibles (facture L8-05, CGV en PDF L8-04, formulaire type L8-03) ; fusionné avec E8 quand l'achat ouvre une visite.
9. **Secrets** : clé Stripe et secret du webhook dans le seul service web (ni worker, ni Chrome) ; filtre des journaux sur `sk_live_`, `sk_test_`, `whsec_` (`ARCHITECTURE.md` § 6.7).

## Critères d'acceptation
- [ ] Stripe en mode test avec la CLI (`stripe listen`, `stripe trigger`) : parcours 29 €, 15 € et 59 € de bout en bout ; lots et montants HT/TVA corrects.
- [ ] Webhook rejoué trois fois → un seul achat, un seul jeu de lots, un seul `achat_paye`.
- [ ] Webhook non signé ou mal signé → 400, aucun effet (test ajouté à la suite de L5-19).
- [ ] Double clic sur « Payer » → une seule session ; plan suivant demandé hors délai → refus.
- [ ] Rapprochement : paiement simulé sans lot → alerte ; lot `achat` sans paiement → alerte.
- [ ] Session expirée → `paiement_abandonne` ; carte de test refusée → `erreur.paiement_refuse`.
- [ ] Invariants du grand livre verts après chaque scénario ; aucune clé Stripe dans les journaux de la suite de tests.
- [ ] Aucune lecture payante pour tester ; aucun texte technique (L1-04) sur la commande et le retour ; outil local inchangé.

## Mesure
- `paiement_ouvert` (`offre`, `montant_ttc_centimes`, `periode_prix`), à la création de la session.
- `achat_paye` (`offre`, `montant_ht_centimes`, `tva_centimes`, `devise`, `moyen`, `premier_achat`, `depuis_apercu`, `periode_prix`), `paiement_abandonne`, `litige_ouvert`.
- `erreur_affichee` (N) avec `paiement_refuse` ; `email_envoye` (`modele=recu`).

## Points d'attention
- **Libellé bancaire** : Stripe limite le libellé du relevé à 22 caractères et peut refuser les lettres accentuées. « SUR PIÈCE » (`MESSAGES.md` § 5.3, § 7.7) risque de devenir « SUR PIECE » : à vérifier sur le compte, puis aligner les textes.
- **Tranché : R5.** La propriété `offre` des événements porte le code stable du catalogue (`particulier_visite`, `particulier_plan_suivant`, `particulier_pack_3`, `SUIVI.md` § 3.2), jamais un code figé avec un prix ; le prix est dans `montant_*`, la période dans `periode_prix`, le déblocage se distingue par `depuis_apercu`.
- **Schéma** : le remboursement par ligne (15 € par plan non utilisé) s'appuie sur `achats_lignes` (`ARCHITECTURE.md` § 4.2, M3.1 : une ligne et un lot par prix unitaire).
- **Même écran que L8-03** : ce ticket livre la page avec la vente fermée ; L8-03 y ajoute les cases ; la vente ne s'ouvre qu'à L8-07.
- **Tranché : R13.** Pendant la bêta fermée (lot 6), aucun achat : seule la variante « bêta » du catalogue est publiée, aucune version payante ni aucun `Price` Stripe n'est créé en production, et aucun message ne propose 29 € avant le lot 8 (`OFFRES.md` § 2.8). Le drapeau `vente_particuliers_ouverte` reste fermé jusqu'à L8-07.
- **Tranché : R1.** Le contenu vendu est la visite dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage) et les mêmes images que l'aperçu (vue du dessus, plan 2D, 2 photos) ; « environ 11 photos » et « 8 autres photos » ne sont jamais écrits. `achat.compris` est lu dans le contenu de la version d'offre ; la galerie complète vient avec L13-02.
- Mode réel seulement avec la société et son compte bancaire (L0-06, L0-08) ; mode test partout ailleurs (`ARCHITECTURE.md` § 9.1).
- TVA : au-delà de 10 000 € HT par an de ventes B2C dans d'autres pays de l'UE, passer au guichet OSS (auth-paiement § 4.1).
- Taille L au plafond : si elle déborde, sortir le rapprochement quotidien dans un ticket séparé.

## Références
- produit/recherche/auth-paiement.md § 2.1 à § 2.4 ; produit/OFFRES.md § 2.3, § 6.4, § 6.6, § 8.2, § 8.11.
- produit/ARCHITECTURE.md M3.1, § 4.2 (`achats`, `credit_lots`), § 4.3, § 6.2 (Checkout par redirection), § 6.7, § 6.8, § 9.1.
- produit/PARCOURS.md A10, A11 ; produit/MESSAGES.md § 7.6, § 7.7, § 7.11 (E7), § 7.12 ; produit/SUIVI.md § 3.2, § 3.10.
- tickets L5-07 (`attribuer`), L5-08 (`stripe_price_id`).

## Hors périmètre
- Déblocage de l'aperçu : L8-02. Cases légales, E8, renonciation et fonction de remboursement : L8-03.
- CGV et médiateur : L8-04. Factures, remboursements depuis l'administration, E10 : L8-05. Tests de prix : L8-06.
- Abonnements et recharges des pros : L9-01. Ouverture de la vente : L8-07.
