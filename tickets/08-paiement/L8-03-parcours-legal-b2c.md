# L8-03 · Parcours légal des particuliers

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | L (3 à 5 j) | L8-01, L0-07, L5-14 | `service/` | À faire |

## Pourquoi
Vendre un contenu numérique à un consommateur impose, pour exclure la rétractation de 14 jours : le consentement exprès au démarrage immédiat, la reconnaissance de la perte du droit, et leur confirmation sur support durable (L221-28 13°, L221-13). Il faut aussi une case séparée d'écart consenti (L224-25-14 III), seule façon d'encadrer les approximations de la visite, et, depuis le 19/06/2026, une fonction « Renoncer au contrat ici » avec accusé de réception horodaté (L221-21, D221-5). Les plans non utilisés restent rétractables et remboursables. Sans ce parcours, pas de vente (jalon J1). Ticket M3.4 ; l'export et la suppression du compte sont faits par L5-20.

## À faire
1. **Preuves** : table `acceptations` (`ARCHITECTURE.md` § 4.2), en ajout seul, conservée 5 ans, complétée de `contexte` (`achat`, `lancement`, `deblocage`), `achat_id`, `plan_id`, `ligne` (rang du plan dans la commande), `texte_sha256`. Table `textes_legaux` (document, version, texte exact, date d'effet) : chaque case affichée pointe une version, et l'e-mail reproduit ce texte à l'identique.
2. **Cases**, non cochées, qui bloquent le bouton (`fieldset` avec légende ; `erreur.cases` dit laquelle manque, `PARCOURS.md` A11) :
   - écart consenti (texte de `MESSAGES.md` § 7.3), redemandé à chaque achat tant que l'avocat n'a pas dit le contraire ;
   - renonciation selon le contexte (`MESSAGES.md` § 7.7) : déblocage d'un aperçu (page de commande de L8-01 ou bouton `verrou.bouton_plan_dispo`) ; lancement d'un plan payé (écran de lancement de L6-01, dès qu'un lot `achat` sera consommé) ; lot de 3 : la case ne porte que sur le plan ouvert maintenant.
   - contrôle serveur : le webhook (L8-01), le déblocage (L8-02) et le lancement (L5-06) refusent sans acceptation valide rattachée. Aucune case de renonciation pour un lot sans paiement (testeur, code, geste) ni pour un pro (`PARCOURS.md` B4).
3. **E8, confirmation d'ouverture immédiate** (`MESSAGES.md` § 7.11), envoyé au lancement ou au déblocage : texte exact accepté, date et heure, commande, « plan {n} sur {total} », date limite des plans encore rétractables, CGV en PDF de la version acceptée (L8-04), formulaire type de rétractation. Fusionné avec E7 quand achat et ouverture ont lieu au même instant. Envoi idempotent ; un échec d'envoi déclenche une alerte, car la confirmation conditionne l'exclusion du droit.
4. **« Renoncer au contrat ici »** : lien dans « Mon compte » et dans le pied de page de toutes les pages, vitrine et application (`MESSAGES.md` § 8.2), actif 14 jours après chaque achat :
   - page `renonciation.*` : achats éligibles (`renonciation.ligne`), étape de confirmation, `renonciation.fait`, ou `renonciation.rien` ;
   - accès : connecté (lien magique ou code) ; sans connexion, formulaire qui envoie un lien de confirmation à l'adresse de l'achat ;
   - enregistrement horodaté (table `renonciations` : achat, lignes, déclaration, date, montant) ; **E9** immédiat avec le contenu de la déclaration, la date et l'heure (D221-5).
5. **Remboursement des plans non utilisés** : `service/paiement/remboursement.py`, `rembourser_non_utilises(achat, motif, acteur)` : retire d'abord les plans restants du lot (mouvement `remboursement`, L5-07), puis rembourse par Stripe les lignes correspondantes (pack : 15 € par plan non utilisé ; achat simple non utilisé : 29 €), clé d'idempotence, dans le délai légal de 14 jours. Fonction réutilisée par L8-01 (paiement en double) et L8-05 (administration).
6. **Information avant la commande** (L221-5), sur la page de L8-01 : `achat.retractation`, `achat.remboursement`, liens CGV et politique de remboursement, médiateur (L8-04), bouton explicite « Payer 29,00 € TTC ».
7. Vérifier que la case d'écart consenti posée au lancement du premier plan offert (`OFFRES.md` § 2.5, écran de L6-01) écrit bien dans la même table.

## Critères d'acceptation
- [ ] Stripe en mode test : achat de 29 € puis déblocage → E7 et E8 fusionnés reçus dans Mailpit ; le texte de la case y figure à l'identique (comparaison automatique d'empreinte), avec l'heure, la version des CGV et les deux pièces jointes.
- [ ] Case non cochée → bouton sans effet et message ; requête forgée sans acceptation → refus serveur.
- [ ] Pack de 59 € avec 1 plan utilisé : renonciation à J+13 → 30 € remboursés (2 × 15), plans retirés, E9 horodaté reçu ; à J+15 → `renonciation.rien` (horloge injectée).
- [ ] Renonciation rejouée → un seul remboursement ; invariants du grand livre verts.
- [ ] Lien « Renoncer au contrat ici » présent sur chaque gabarit de page (test automatique, vitrine et application).
- [ ] Relecture avec l'avocat consignée dans le compte rendu de L0-07 ; marqueurs **[À VALIDER : avocat]** de `MESSAGES.md` § 7.3, § 7.7 et E8 levés.
- [ ] `acceptations` et `renonciations` refusent toute modification (test de droits) ; aucun texte technique ; aucune lecture payante.

## Mesure
- `renonciation_acceptee` (`contexte`, `version_texte`).
- `retractation_demandee` (`offre`, `plans_non_utilises`) ; `achat_rembourse` (`motif=retractation_14j`, `partiel`), écrit au webhook par L8-05.
- `email_envoye` pour E8 (`modele` = `ouverture_immediate`, ou `recu_ouverture_immediate` quand E7 et E8 sont fusionnés) et E9 (`accuse_renonciation`), SUIVI.md § 3.8.

## Points d'attention
- **Questions à l'avocat** (L0-07) : case au déblocage d'un contenu déjà calculé et répétition de l'écart consenti (`OFFRES.md` annexe B, q. 2) ; forme de la fonction pour des achats partiellement utilisés (`recherche/juridique.md` § 8, q. 3) ; remboursement de 15 € par ligne (annexe B, q. 1) ; part « hébergement » (q. 3) ; acceptation des CGV par case ou par lien (MESSAGES n'a que deux cases).
- **À trancher** : un plan réservé dont la génération est en cours est-il « utilisé » ? Proposition : oui dès la réservation, puisque la case de renonciation a été cochée.
- **Dictionnaire** : réglé dans `SUIVI.md` § 3.8 (`confirmation_renonciation` retiré au profit d'`ouverture_immediate` et d'`accuse_renonciation`) ; reporter ces valeurs dans `mesure/evenements.json`.
- Sanctions de la fonction de rétractation citées par une source secondaire, non vérifiées (juridique § 1.3).
- Même écran que L8-01 : livrer les deux ensemble derrière le drapeau de vente fermée.
- Archivage des contrats au-delà de 120 € (L213-1, non relu) : le pack de 59 € est en dessous, mais chaque commande est gardée avec sa version de CGV.

## Références
- produit/recherche/juridique.md § 1.2 à § 1.4, § 1.6, § 3.4, § 7 (n° 8), § 8 ; produit/recherche/auth-paiement.md § 3.4.
- produit/OFFRES.md § 2.5, § 2.6, § 6.5, annexe B ; produit/ARCHITECTURE.md M3.4, § 4.2 (`acceptations`).
- produit/PARCOURS.md A11, A17 ; produit/MESSAGES.md § 7.3, § 7.7, § 7.11 (E7, E8, E9), § 8.2 ; produit/SUIVI.md § 3.8, § 3.10.

## Hors périmètre
- CGV, politique de remboursement, médiateur : L8-04. Factures et remboursements depuis l'administration : L8-05.
- Export et suppression du compte : L5-20. Conditions et DPA des pros : L9-08.
