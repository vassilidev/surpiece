# L5-04 · Organisations, membres, rôles, invitations

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-03, L5-15 | `service/` | À faire |

## Pourquoi
L'organisation porte les données : plans, crédits, réglages et partages appartiennent à une organisation, personnelle pour un particulier, cabinet ou promoteur pour un pro (ARCHITECTURE § 4.1). Particuliers, conseillers et promoteurs suivent ainsi le même chemin de code. L5-03 crée l'organisation personnelle à l'inscription ; ce ticket ajoute les organisations à plusieurs membres, les rôles, les invitations et le changement d'organisation active, avec des tests d'accès par rôle.

## À faire
1. Migration : compléter `organisations` (`siren`, `tva_intracom`, `reglages_version`, `cle_ia_nom`, `membres_max`, lu dans la version d'offre du catalogue de L5-08 et jamais figé dans le code, R5) et créer `invitations` (ARCHITECTURE § 4.2). `stripe_customer_id` et `idp_id` viendront avec L8-01 et L10-07.
2. Matrice des droits, dans un seul fichier `service/app/acces.py` (créé ici, ou par L5-05 s'il est fusionné avant ; même module dans les deux cas) :
   - `proprietaire` : tout, y compris la facturation et la suppression de l'organisation ;
   - `admin` : réglages, membres, invitations ;
   - `membre` : plans et liens (PARCOURS B8).
   Une dépendance FastAPI `exiger_role('admin')` ; toute ressource se lit par l'organisation active de la session, et l'accès à une autre organisation répond **404**, jamais 403 (ARCHITECTURE § 4.1).
3. Routes (API JSON) :
   - `GET /api/organisations` : organisations du compte et rôle ;
   - `POST /api/organisations/active` : change `sessions.organisation_active_id`, seulement vers une organisation dont le compte est membre ;
   - `POST /api/organisations` : crée un cabinet (type `cabinet`), le créateur en `proprietaire` ; le SIREN et l'essai sont faits par L9-02 ;
   - `GET /api/organisations/{id}/membres`, `PATCH …/membres/{compte}` (rôle), `DELETE …/membres/{compte}` ;
   - `POST /api/organisations/{id}/invitations`, `DELETE …/invitations/{inv}`, `POST …/invitations/{inv}/renvoyer`.
4. Invitations :
   - jeton de 256 bits stocké haché, valable 7 jours, usage unique (ARCHITECTURE § 6.3) ;
   - e-mail envoyé par L5-14 ; page `GET /invitation/{jeton}` qui demande de se connecter (L5-03) ;
   - acceptation seulement si l'e-mail vérifié du compte connecté est celui de l'invitation (`email_normalise`) ; sinon message clair, sans dire à qui l'invitation était destinée ;
   - refus quand les places sont prises (`membres_max`) ; la vente de places supplémentaires est faite par L9-13.
5. Règles de cohérence, vérifiées par des tests :
   - une organisation garde toujours au moins un `proprietaire` ;
   - une organisation `personnelle` n'a qu'un membre et ne reçoit pas d'invitation ;
   - un membre retiré perd l'accès aussitôt : ses sessions qui pointaient sur cette organisation basculent sur son organisation personnelle ; ses plans et ses liens restent à l'organisation.
6. Page minimale d'acceptation d'invitation, sans texte technique. Les textes d'invitation n'existent pas encore dans MESSAGES.md (PARCOURS B8 les marque « à ajouter ») : les écrire avec la marque (MESSAGES.md § 0.4) et les passer au contrôle des textes (L1-04).

## Critères d'acceptation
- [ ] Tests d'accès par rôle : pour chaque route, `proprietaire`, `admin`, `membre` et non-membre obtiennent la réponse attendue ; non-membre : 404.
- [ ] Test de changement d'organisation : impossible vers une organisation dont on n'est pas membre (404) ; les listes suivent l'organisation active.
- [ ] Tests d'invitation : jeton rejoué, expiré, falsifié, accepté par un autre e-mail, révoqué ; places pleines.
- [ ] Test : dernier propriétaire impossible à retirer ou à rétrograder.
- [ ] Parcours en local avec Mailpit : invitation, acceptation, retrait.
- [ ] Contrôle des textes réussi sur la page d'acceptation et l'e-mail ; aucun texte technique visible.

## Mesure
- `membre_invite` (`role`) et `membre_rejoint` (`role`).

## Points d'attention
- `membre_retire` et `role_modifie` ne sont pas encore au dictionnaire (PARCOURS § 8.1) : les ajouter à SUIVI.md et à `mesure/evenements.json` dans la même modification, ou ne pas les émettre.
- Le module d'accès est aussi construit par L5-05, qui ne dépend pas de ce ticket : se coordonner pour n'avoir qu'un seul utilitaire de cadrage (sinon deux règles d'accès divergent).
- L'écran de gestion des membres de l'espace pro n'a pas de ticket nommé dans le lot 9 : le rattacher à L9-01 ou L9-03.
- Départ d'un membre : PARCOURS B8 prévoit que ses liens prospects soient rattachés à un autre membre (coordonnées affichées). C'est le travail de L9-04, pas d'ici.

## Références
- produit/ARCHITECTURE.md § 4.1, § 4.2 (`organisations`, `membres`, `invitations`, `sessions`), § 6.3, M2.4.
- produit/PARCOURS.md B8 ; produit/OFFRES.md § 3.1 (utilisateurs par formule).
- produit/recherche/auth-paiement.md § 1.1, § 1.5.

## Hors périmètre
- Plans et cadrage des routes de plans : L5-05. Abonnements : L9-01. Places payantes : L9-13. Essai et SIREN : L9-02.
- SSO par organisation : L10-07. Thème par organisation : L11-02.
