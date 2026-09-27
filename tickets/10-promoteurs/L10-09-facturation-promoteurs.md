# L10-09 · Facturation des promoteurs et réversibilité

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | M (1 à 3 j) | L9-10, L10-01 | `service/` | À faire |

## Pourquoi
L'offre Programme se vend sur devis, puis se facture avec un paiement par virement à 30 jours (OFFRES.md § 4). PARCOURS.md C7 décrit ce qu'il faut facturer : le pilote payé à la commande et déduit de la commande suivante si elle est signée dans les 3 mois ; chaque mois, les lots livrés et validés, au palier des 12 mois glissants (25, 20 ou 15 € HT) ; l'hébergement au-delà de 24 mois (3 € HT par lot et par an) ; les nouvelles versions de lots (50 % du prix, 10 € HT au moins) ; une page « Factures » avec le rapport mensuel de disponibilité (engagement de 99,5 %). Le contrat promet aussi la réversibilité : export des maquettes, photos et visites dans un format ouvert, et en fin de contrat export sous 30 jours puis suppression (OFFRES.md § 4.4, § 4.10 ; recherche/juridique.md § 2.3). Aucun ticket ne construisait ces écrans ni la saisie commerciale (devis envoyé, pilote signé, commande signée) : L10-01, L10-03 et L10-08 l'avaient relevé. L'émission électronique passe par la plateforme retenue par L9-10.

## À faire
1. **Tables** (schéma à reporter dans ARCHITECTURE.md § 4.2) :
   - `devis` : organisation, programme, type (`pilote`, `commande`), lots pris en charge (issus du rapport de L10-02), palier, montant HT, statut (`brouillon`, `envoye`, `accepte`, `refuse`, `expire`), grille de prix datée du contrat (L10-01) ;
   - `commandes` : devis, date de signature, bon de commande signé (clé d'objet dans l'espace privé, jamais publié), déduction du pilote ;
   - `factures_promoteurs` : commande, période, lignes (lots validés, hébergement prolongé, nouvelles versions, avoir de disponibilité), montants HT et TVA en centimes, statut (`emise`, `payee`, `en_retard`), identifiant de la facture chez l'outil de facturation et à la plateforme (L9-10).
   Toutes les requêtes sont cadrées par `organisation_id` (404 en accès croisé).
2. **Devis et bons de commande** : devis à prix ferme sur les lots pris en charge, généré depuis le rapport de prise en charge (L10-02) et les modèles de L10-01 ; commande minimale contrôlée (10 lots ou 250 € HT, OFFRES.md § 4.3) ; PDF produit par Chromium (outil d'impression de L8-08), passé au contrôle des textes (L1-04). Pilote : 600 € HT pour 40 lots au plus, payé à la commande (OFFRES.md § 4.2).
3. **Factures** :
   - pilote à la commande ; puis facture mensuelle des seuls lots **validés** dans le mois (L10-03), au palier des 12 mois glissants ; un lot en échec ou non validé n'est jamais facturé (L10-02) ;
   - déduction du pilote sur la première facture de commande si elle est signée dans les 3 mois ;
   - hébergement au-delà de 24 mois après la livraison : 3 € HT par lot et par an ; nouvelle version d'un lot (plan modifié par le promoteur ou l'architecte) : 50 % du prix, 10 € HT au moins ; une correction d'un défaut de notre fait n'est **jamais** facturée (R14) ;
   - avoir de 5 % par tranche de 0,5 % sous l'objectif de 99,5 %, plafonné à 20 % du mois (OFFRES.md § 4.7), calculé sur la disponibilité mesurée des visites publiées (sondes de L5-16) ;
   - création de la facture par l'outil retenu par L9-10 (par exemple Stripe Invoicing), virement à 30 jours, conversion et transmission électroniques par la plateforme agréée de L9-10 ; relance d'une facture en retard par l'équipe.
4. **Page « Factures »** de l'espace programme (PARCOURS.md C7) : liste, PDF, état du paiement, rapport mensuel de disponibilité ; rôles `proprietaire` et `admin` de l'organisation (L5-04).
5. **Export de réversibilité** : action dans l'espace programme et dans l'administration ; archive par programme, produite sans IA, contenant pour chaque lot les données de la visite, les images et la fiche, dans des formats ouverts (proposition : `plan.json`, JPEG, CSV) ; lien signé à durée courte ; aucune donnée d'une autre organisation. En fin de contrat : export disponible 30 jours, puis suppression par la purge (L5-20), sauvegardes comprises à l'expiration de leur rotation (L5-26 ; ARCHITECTURE.md § 4.4).
6. **Suivi commercial dans l'administration** (L5-17, L5-25) : saisie de devis envoyé, pilote signé, pilote livré (minutes humaines par lot saisies par l'équipe, L10-08), commande signée, facture émise et payée ; rôle `admin`, motif et trace dans `journal_equipe`.

## Critères d'acceptation
- [ ] Programme de test (témoin dupliqué, L10-02), sans lecture payante : devis calculé depuis le rapport, commande signée, lots validés (L10-03), facture mensuelle limitée aux lots validés ; un lot en échec absent de la facture.
- [ ] Horloge injectée : commande signée à 2 mois du pilote → 600 € déduits ; à 4 mois → aucune déduction ; lot livré depuis 25 mois → ligne d'hébergement.
- [ ] Une correction de défaut de notre fait ne crée aucune ligne de facture (test) ; une nouvelle version de lot en crée une, au bon prix.
- [ ] Disponibilité simulée à 98,9 % sur un mois → avoir calculé selon OFFRES.md § 4.7, plafonné à 20 %.
- [ ] Facture de test transmise dans l'environnement de test de la plateforme de L9-10.
- [ ] Export d'un programme de test : archive complète, lisible sans nos services ; accès d'une autre organisation → 404 ; lien expiré → refus.
- [ ] Fin de contrat simulée : export disponible 30 jours, puis données supprimées par la purge.
- [ ] Événements du point Mesure écrits une fois chacun ; aucun texte technique (L1-04) ; aucun plan, nom de programme ni nom de promoteur réel dans le dépôt ou la CI.

## Mesure
- `devis_envoye` (`type_devis`, `lots`, `montant_ht_centimes`), `pilote_signe`, `pilote_livre`, `commande_signee` (`lots`, `palier`, `montant_ht_centimes`, `deduction_pilote`) : SUIVI.md § 3.13.
- `facture_emise`, `facture_payee` (facultatifs si l'outil comptable les suit déjà, SUIVI.md § 3.13).
- `pilote_signe` et `commande_signee` alimentent la conversion Google « Contrat promoteur » quand un clic d'annonce est connu (L12-02).

## Points d'attention
- **Règles à écrire au contrat (L10-01)** : palier appliqué à tous les lots de l'année ou seulement au-delà de chaque seuil ; effet de la date limite de contrôle (validation tacite ou non) sur la facturation ; contenu exact de l'export (le moteur n'est pas cédé : ce que couvre « les visites » est à préciser avec l'avocat).
- **Droits acquis** : la grille signée est celle qui s'applique pendant le contrat (décision 7) ; une nouvelle grille ne vaut que pour les nouveaux contrats ou à l'échéance prévue.
- **Tranché : R14.** Un défaut de notre fait est toujours corrigé gratuitement ; les cycles de correction ne concernent que les demandes de modification, qui ne sont pas facturées dans la limite des 2 cycles.
- **Facture électronique** : les grands promoteurs reçoivent déjà par plateforme agréée ; une entrée anticipée est possible (L9-10, point 4).
- **Documents de clients** : devis, bons de commande et contrats signés ne vont jamais dans le dépôt (L10-01).
- Taille M : si elle déborde, sortir l'export de réversibilité dans un ticket séparé.

## Références
- produit/OFFRES.md § 4.2, § 4.3, § 4.4, § 4.6, § 4.7, § 4.10 ; produit/PARCOURS.md C2, C7 ; produit/SUIVI.md § 3.13.
- produit/ARCHITECTURE.md § 4.2, § 4.4 (conservation) ; produit/recherche/juridique.md § 2.3 ; produit/recherche/auth-paiement.md § 4.2, § 4.5.
- tickets L5-16 (sondes de disponibilité), L5-17 et L5-25 (administration), L5-20 (purge), L5-26 (sauvegardes), L8-08 (impression PDF), L9-10, L10-01, L10-02, L10-03, L10-08.

## Hors périmètre
- Contrat, grille et modèles : L10-01. Émission électronique et plateforme agréée : L9-10.
- Import et rapport de prise en charge : L10-02. Validation des lots : L10-03. Déroulé du pilote : L10-08.
- Factures des particuliers : L8-05. Abonnements des conseillers : L9-01, L9-13.
