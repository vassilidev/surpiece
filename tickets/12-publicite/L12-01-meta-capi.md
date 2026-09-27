# L12-01 · Conversions Meta par le serveur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 12 · Publicité et conversions | P0 | M (1 à 3 j) | L7-03, L5-15, L12-03 | `service/` | À faire |

## Pourquoi
Pour piloter des campagnes Meta, il faut dire à Meta quelles annonces amènent inscriptions et achats. Le choix de SUIVI.md § 2.11 : les conversions partent **de notre serveur** (Conversions API), sans pixel au départ, seulement pour les comptes qui ont consenti à la finalité « publicité », avec l'identifiant du journal comme `event_id` pour une déduplication future. Le journal (L5-15) est la source ; l'attribution (L7-03) fournit `fbc`.

## À faire
1. **File d'envoi commune à Meta et Google** (`envois_publicitaires`) : **règle retenue, écrite aussi dans L12-02 : elle est construite par le premier des deux tickets livré (L12-01 ou L12-02) ; le second la reprend telle quelle, sans la refaire.** Contenu :
   - table `envois_publicitaires` (recherche/suivi.md § 7.4, plus `consentement_id` et `reponse_ref`), clé primaire `(evenement_id, plateforme)` ;
   - statuts `a_envoyer`, `envoye`, `erreur`, `ignore_sans_consentement`, `ignore_hors_delai` ;
   - création après validation de la transaction du journal, pour chaque type du § 3.17 ;
   - consentement vérifié événement par événement : dernier état « publicité » du compte au moment du fait (`consentement_actif` de L12-03) ; compte sans choix enregistré = refus.
2. **Table `contexte_navigateur`** : IP et agent utilisateur relevés à la création de la session Stripe Checkout, seulement avec consentement, purgés à 7 jours (SUIVI.md § 2.12) ; sert aux achats reçus par webhook, qui ne connaissent ni l'IP ni le navigateur.
3. **Correspondance** (SUIVI.md § 3.17) :
   - `compte_cree` → `CompleteRegistration` ;
   - `plan_lance` avec `source_lot=offert_inscription` → `StartTrial` (`content_category=particulier`) ;
   - `achat_paye` → `Purchase` ; `recharge_payee` et `codes_achetes` → `Purchase` ;
   - `essai_pro_demarre` → `StartTrial` (`content_category=conseiller`) ; `abonnement_demarre` → `Subscribe` ;
   - `rdv_pro_demande`, `contact_promoteur_recu`, `contact_partenaire_recu` → `Lead` ;
   - `paiement_ouvert` → `InitiateCheckout` : facultatif, désactivé par défaut ; `achat_rembourse` : rien.
4. **Événement** : `event_name` ; `event_time` (au plus 7 jours avant l'envoi, sinon `ignore_hors_delai`) ; `event_id` = `evenements.id` ; `action_source=website` ; `event_source_url` = adresse générique de la page du fait, sans jeton ni requête.
   - `user_data` : `em` = SHA-256 de l'e-mail en minuscules sans espaces ; `external_id` = SHA-256 de `compte_id` avec un sel secret ; `fbc` s'il existe (L7-03) ; `client_ip_address` ; `client_user_agent` (obligatoire pour un événement website). Ni téléphone ni `fbp` (phase 3b).
   - `custom_data` : `value` HT et `currency=EUR` pour `Purchase` et `Subscribe` ; `content_category` ; pas de `predicted_ltv`.
5. **Envoi immédiat** par une file dédiée (Procrastinate), relances à délai croissant, idempotence par la clé primaire, alerte au-delà d'un taux d'erreur à établir (L5-16).
6. **Secrets** : jeton d'un utilisateur système Meta dans le gestionnaire de secrets ; motif du jeton ajouté au filtre des journaux (ARCHITECTURE.md § 6.7).
7. **Contrôles permanents** C7 (chaque envoi a un `consentement_id` valide) et C8 (aucun envoi sans accord actif au moment du fait), en CI et chaque jour en production.
8. **Retrait du consentement** : les lignes créées ensuite sont `ignore_sans_consentement` ; identifiants de clic effacés (L7-03).

## Critères d'acceptation
- [ ] Recette R15 côté Meta avec `test_event_code` : chaque conversion du § 3.17 visible dans « Tester les événements », qualité de correspondance relevée.
- [ ] Compte sans accord : `ignore_sans_consentement` ; fait de plus de 7 jours : `ignore_hors_delai` ; Meta indisponible (simulé) : `erreur` puis `envoye` ; même fait traité deux fois : une seule ligne.
- [ ] Aucun pixel ni requête du navigateur vers Meta (interception) ; aucun e-mail en clair ni jeton dans les journaux.
- [ ] C7 et C8 branchés et bloquants en CI ; aucune lecture payante pour tester (événements issus du témoin et de Stripe en mode test).

## Points d'attention
- **File commune** : L12-01 et L12-02 ont besoin de la même file (`envois_publicitaires`), des mêmes statuts et du même contrôle de consentement, sans dépendre l'un de l'autre. Règle retenue : le premier des deux livré la construit, l'autre la reprend. SUIVI.md § 7.2 (point 7) prévoyait de créer et d'alimenter la table dès la phase 2, sans envoi : aucun ticket ne le fait.
- **Tranché : R18.** Les envois publicitaires sont des traceurs non exemptés : le bandeau de consentement (L7-02, finalité « publicité », L12-03) doit être en service avant le premier envoi ; tant qu'Umami reste en réglage minimal exempté et que rien d'autre n'est activé, il n'y a pas de bandeau.
- **Prérequis juridiques** (SUIVI.md § 7.3) : avenant de responsabilité conjointe avec Meta, politique de confidentialité et registre à jour (L12-03). Pas d'envoi en production avant.
- IP et agent utilisateur gardés 7 jours : à inscrire au registre (L0-09).
- `content_category=promoteur` n'est porté par aucune ligne du § 3.17 (le contact promoteur part en `Lead`) : à compléter si l'on veut segmenter.

## Références
- produit/SUIVI.md § 2.3, § 2.11, § 2.12, § 3.17, § 6.3, § 7.3, § 7.4 (C7, C8), § 7.5 (R15), § 7.6.
- produit/recherche/suivi.md § 4.1 à § 4.4, § 7.4, § 7.6 ; produit/ARCHITECTURE.md § 4.2 (`evenements`), § 6.7.

## Hors périmètre
- Consentement étendu, pixel et phase 3b : L12-03. Conversions Google : L12-02. Campagnes : L12-04. Attribution : L7-03.
