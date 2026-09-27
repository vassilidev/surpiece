# L5-15 · Journal d'événements serveur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-01 | `service/` | À faire |

## Pourquoi
Décision de l'utilisateur n° 3 : savoir qui consomme quoi. Décision n° 9 : Umami pour l'audience anonyme, la mesure publicitaire plus tard. `SUIVI.md` § 2.1 fixe la règle : le journal `evenements` est la seule source de vérité des indicateurs (comptes, plans, crédits, paiements), écrit par l'API, les workers et les webhooks, **dans la même transaction que le fait**. Il n'est jamais rapproché d'Umami. Ce ticket livre le mécanisme ; chaque ticket émet ensuite ses propres événements.

## À faire
1. **Migration** : table `evenements` d'`ARCHITECTURE.md` § 4.2 plus les cinq colonnes de `SUIVI.md` § 2.8 : `cle_idempotence text unique`, `partage_id uuid`, `cible text`, `instance text`, `recu_le timestamptz`. Index sur `(type, survenu_le)` et `(organisation_id, survenu_le)`. Ajout seul : le rôle de l'application n'a ni `UPDATE` ni `DELETE` sur la table, sauf une fonction d'anonymisation réservée à la purge (L5-20).
2. **Dictionnaire** `mesure/evenements.json` (chemin proposé par `SUIVI.md` § 2.8) : pour chaque type, le côté (N, S, C), les propriétés et leurs valeurs autorisées (§ 3.2). Un seul fichier, lu par le serveur puis par le navigateur (L7-04).
3. **`service/journal.py`, `ecrire(db, type, *, compte_id, organisation_id, plan_id, partage_id, montant_ht_centimes, devise, proprietes, origine, survenu_le, cle_idempotence)`** :
   - s'exécute dans la transaction de l'appelant, sans validation propre : pas d'événement sans fait, pas de fait sans événement ;
   - valide type, propriétés et valeurs contre le dictionnaire ; en test, toute erreur lève une exception (contrôle C3) ; en production, la propriété fautive est retirée, signalée à Sentry, et l'événement est écrit (§ 2.3, règle 5) ;
   - `cible` déduite du type d'organisation, `instance` de la configuration (`principale`), `recu_le` = maintenant ;
   - `cle_idempotence` (identifiant d'événement Stripe, ou `travail_id:type`) : insertion `on conflict do nothing`.
4. **Aucune donnée personnelle dans `proprietes`** (§ 2.8, règle 3) : validateurs qui refusent une valeur qui ressemble à un e-mail, une IP, un UUID, un jeton ou un texte libre ; les personnes ne sont reliées que par les colonnes d'identifiants.
5. **Contrôles automatiques** (`SUIVI.md` § 7.4) :
   - C1, partie serveur : chaque `journal.ecrire("…")` de `service/` porte un nom du dictionnaire, conforme au motif `^[a-z][a-z0-9]*(_[a-z0-9]+)+$`, 50 caractères au plus ;
   - C2 : `mesure/evenements.json` et les tableaux du § 3 de `SUIVI.md` contiennent les mêmes noms (le test lit la première colonne) ;
   - C3 : refus d'un type inconnu, d'une propriété imprévue, d'une valeur hors liste ;
   - C7, tâche horaire : chaque `plan_lance` se termine par `apercu_pret` (aperçu) ou `plan_pret` (plan complet), ou par `plan_echoue` et `credit_rendu`, dans les délais d'`OFFRES.md` § 6.4 ; écart → alerte (L5-16).
6. **Opposition au suivi d'usage** : colonne `exclu_statistiques` sur `comptes`, lue par les vues des tableaux de bord (L7-06), sans toucher au grand livre.
7. **Suppression d'un compte** : utilitaire qui passe `compte_id`, `organisation_id`, `plan_id` et `partage_id` à `null` (appelé par L5-20).
8. **Noms** : n'utiliser que les noms retenus (`SUIVI.md` annexe A) : `plan_echoue` et non `plan_echec`, `achat_paye` et non `achat_credits`, `credit_rendu` ou `achat_rembourse` et non `plan_rembourse`.

## Critères d'acceptation
- [ ] Tests C1 (partie serveur), C2 et C3 en CI, bloquants.
- [ ] Transaction du fait annulée → aucune ligne dans `evenements` (test).
- [ ] Deux écritures avec la même `cle_idempotence` → une seule ligne.
- [ ] Une adresse e-mail passée en propriété : exception en test, propriété retirée et événement écrit en mode production.
- [ ] Le rôle de l'application ne peut ni modifier ni effacer une ligne (test de droits).
- [ ] C7 : un `plan_lance` sans issue au-delà du délai, simulé avec une horloge injectée, déclenche l'alerte.
- [ ] Anonymisation d'un compte de test : identifiants à `null`, statistiques conservées.
- [ ] Aucune ligne produite par un navigateur ou par Umami : le journal n'a pas de point d'entrée public.

## Points d'attention
- Les événements « à ajouter » de `PARCOURS.md` § 8.1 (`depot_doublon`, `remboursement_demande`, `page_pdf_changee`…) entrent dans le dictionnaire avec le ticket qui les émet, dans la même modification que `SUIVI.md` (§ 3.1).
- Colonnes ajoutées et noms d'événements à aligner dans `ARCHITECTURE.md` § 4.2 (`SUIVI.md` § 8, « À aligner »).
- Durée de conservation de 5 ans proposée (`SUIVI.md` § 2.12), à valider par l'avocat.
- Emplacement de `mesure/` à la racine : nouveau dossier partagé entre le service et le navigateur, hors de `pipeline/` et `moteur/`.
- Ne pas dupliquer les tables métier : durées par étape et coûts par appel restent dans `etapes` et `appels_ia` (§ 2.8, règle 6).

## Références
- Décisions de l'utilisateur du 27/09/2026, n° 3 et n° 9.
- `produit/SUIVI.md` § 2.1, § 2.3, § 2.4, § 2.8, § 2.12, § 3, § 7.4, § 8, annexe A.
- `produit/ARCHITECTURE.md` § 4.1, § 4.2 (`evenements`), M2.12 ; `produit/OFFRES.md` § 6.4.

## Hors périmètre
- Umami et sa base séparée : L7-01. Événements du navigateur : L7-04. Recette automatique complète (C4 à C6) : L7-07.
- Attribution et consentements : L7-02, L7-03. Tableaux de bord : L7-06. Envois à Meta et Google : L12.
