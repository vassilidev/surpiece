# L12-02 · Conversions Google par le serveur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 12 · Publicité et conversions | P0 | M (1 à 3 j) | L7-03, L5-15, L12-03 | `service/` | À faire |

## Pourquoi
Pour enchérir sur les bonnes conversions, Google Ads doit recevoir les inscriptions, essais et achats rattachés au clic d'annonce. Depuis le 15/06/2026, l'import hors ligne par l'API Google Ads échoue pour un nouveau jeton de développeur : il faut passer par la **Data Manager API** (recherche/suivi.md § 5.2). Comme pour Meta, l'envoi part de notre serveur, seulement pour les comptes qui ont consenti, avec l'objet `consent` renseigné à chaque événement (SUIVI.md § 2.11).

## À faire
1. **File d'envoi commune** (`envois_publicitaires`), décrite dans L12-01 (table, statuts, contrôle du consentement par événement) : **règle retenue, écrite aussi dans L12-01 : elle est construite par le premier des deux tickets livré (L12-01 ou L12-02) ; le second la reprend telle quelle, sans la refaire.** Si ce ticket est livré le premier, il la construit ici, avec `contexte_navigateur` laissé à L12-01 (Google ne reçoit aucune IP).
2. **Mise en place Google** : projet Google Cloud, Data Manager API activée, compte de service dont les identifiants vont dans le gestionnaire de secrets, liaison avec le compte Google Ads (destination).
3. **Actions de conversion** de type `UPLOAD_CLICKS` (« Website (Import from clicks) »), une par ligne du § 3.17 :
   - principales : « Achat particulier » (`achat_paye`), « Essai pro » (`essai_pro_demarre`), « Demande de démo » (`rdv_pro_demande`), « Abonnement » (`abonnement_demarre`), « Contact promoteur » (`contact_promoteur_recu`) ;
   - secondaires : « Inscription » (`compte_cree`), « Premier plan offert » (`plan_lance`, `offert_inscription`), « Achat pro » (`recharge_payee`, `codes_achetes`), « Contact partenaire », « Contrat promoteur » (`pilote_signe`, `commande_signee`).
4. **Événement** : `gclid`, `gbraid` ou `wbraid` de l'attribution (90 jours, L7-03) ; e-mail haché (SHA-256, normalisation propre à Google à relire au moment de coder) ; `transactionId` = `evenements.id` ; valeur HT en euros ; horodatage du fait. Objet `consent` : `adUserData = CONSENT_GRANTED` ; `adPersonalization = CONSENT_GRANTED` seulement si la finalité « publicité personnalisée » existe et a été acceptée (phase 3b, L12-03), sinon `CONSENT_DENIED`. **Aucune IP.**
5. **Envoi par lots toutes les heures** (tâche périodique), relances à délai croissant, alerte sur le taux d'erreur (L5-16).
6. **Remboursements** : `achat_rembourse` produit un ajustement de la conversion « Achat particulier » (retrait ou nouvelle valeur).
7. **Consent Mode v2** : ne concerne que les pages où une balise Google serait chargée (phase 3b, mode basique, L12-03) ; rien à faire côté serveur au-delà de l'objet `consent`.
8. **Recette R15** côté Google : mode de validation de l'API (champ `validateOnly`, à confirmer dans la référence), puis diagnostic des conversions importées.

## Critères d'acceptation
- [ ] Chaque type du § 3.17 part vers la bonne action, validé sans erreur en mode de validation.
- [ ] Compte sans accord : `ignore_sans_consentement` ; `adPersonalization = CONSENT_DENIED` tant que la phase 3b n'est pas ouverte (test).
- [ ] Remboursement de test : ajustement envoyé pour le bon `transactionId`.
- [ ] Aucune IP ni e-mail en clair dans les envois et les journaux ; C7 et C8 réussis ; aucune lecture payante pour tester.

## Points d'attention
- **File commune avec L12-01** : construite par le premier des deux livré, jamais deux fois (voir L12-01).
- **Tranché : R18.** Le bandeau de consentement (finalité « publicité », L7-02, L12-03) doit être en service avant le premier envoi.
- **Non vérifié** (recherche/suivi.md § 9) : fenêtre de 90 jours entre le clic et la conversion importée ; nom exact du champ de validation ; besoin d'une CMP certifiée Google pour un annonceur.
- Pas de correspondance par IP pour les utilisateurs de l'EEE ; sans identifiant de clic, seule l'adresse hachée permet l'attribution.
- Pas de GA4 (recherche/suivi.md § 5.5).
- `pilote_signe` et `commande_signee` n'ont un clic connu que rarement ; leur saisie dans l'administration n'a pas de ticket (voir L10-08).

## Références
- produit/SUIVI.md § 2.11, § 3.17, § 6.3, § 7.3, § 7.4 (C7, C8), § 7.5 (R15).
- produit/recherche/suivi.md § 5.1 à § 5.5, § 7.6, § 9 ; produit/ARCHITECTURE.md § 6.7.

## Hors périmètre
- Consentement et balise Google en phase 3b : L12-03. Meta : L12-01. Campagnes : L12-04.
