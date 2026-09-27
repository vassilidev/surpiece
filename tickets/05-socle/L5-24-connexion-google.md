# L5-24 · Connexion Google

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P1 | M (1 à 3 j) | L5-03 | `service/` | À faire |

## Pourquoi
Le volet de création de compte propose « Continuer avec Google » à côté du lien magique (PARCOURS.md A4, MESSAGES.md § 7.3, `compte.google`) : un clic de moins que l'aller-retour par la boîte e-mail, au moment où l'intention est la plus forte. ARCHITECTURE D1 et recherche/auth-paiement.md § 1.4 et § 1.5 prévoient Google en OIDC derrière la couche `FournisseurIdentite`, quel que soit le choix de L0-02 (décision n° 8 : authentification non tranchée). Découpé de L5-03, qui garde le lien magique avec code, les sessions, le CSRF, les hôtes autorisés, l'organisation personnelle et la couche d'identité : Google n'est qu'un fournisseur de plus, qui dit « qui est-ce », puis c'est toujours **notre** session qui est posée.

## À faire
1. **Fournisseur** `service/auth/fournisseurs/google.py` (Authlib), qui implémente le protocole `FournisseurIdentite` de L5-03 (`debut`, `fin` → `IdentiteVerifiee`) :
   - OpenID Connect avec `state`, `nonce` et PKCE, tous liés à la demande et à usage unique ;
   - portées `openid email` seulement ; `email_verified` exigé, sinon refus ;
   - identité `('google', sub)` dans `identites` ; aucun jeton d'accès ni de rafraîchissement Google conservé après la vérification.
2. **Routes** :
   - `GET /auth/google` : adresse de retour **interne** seulement (liste blanche de chemins de `app.<domaine>`), contexte du parcours (lancement du plan offert, connexion) ;
   - `GET /auth/google/retour` : vérification du jeton d'identité (signature par les clés publiées de Google, audience, émetteur, expiration, `nonce`), puis session de L5-03 (cookie `__Host-session`, rotation, organisation active).
3. **Compte** : identité déjà connue → session ; e-mail vérifié qui correspond à un compte existant (`email_normalise`) → identité rattachée à ce compte (règle commune de L5-03) ; sinon création du compte et de son organisation personnelle dans la même transaction que L5-03 (étape 7), avec l'acceptation des CGU transmise par le volet (L6-01).
4. **Dépôt anonyme** : le retour de Google rattache le dépôt provisoire de l'onglet (L5-23) comme le fait la vérification de l'e-mail ; l'attribution est lue à la création du compte si le consentement « publicité » a été donné (L7-03).
5. **Erreurs** : refus de Google, `state` inconnu, `nonce` faux, e-mail non vérifié → page `erreur.google` (MESSAGES.md § 7.12) qui propose le lien magique ; aucun détail technique, aucun message de Google recopié.
6. **Écarts selon D1** (L0-02) : Supabase Auth → Google configuré dans Supabase, jeton vérifié côté serveur puis notre session ; Auth0 → connexion sociale Google du tenant UE, puis notre session. Dans les trois cas, organisations, rôles et crédits restent dans notre base.
7. **Configuration** : identifiants du client OAuth lus au démarrage (gestionnaire de secrets, L5-18), adresses de retour déclarées pour `app.<domaine>` et `app.preprod.<domaine>` seulement ; écran de consentement au nom de la marque (`MARQUE_NOM`, nom provisoire « Sur Pièce », décision n° 10).
8. **Bêta fermée** (R13) : Google ne contourne pas le code d'invitation ; il n'ouvre un compte que dans un parcours déjà admis par ce code (L6-01, L6-10).

## Critères d'acceptation
- [ ] Tests contre un faux fournisseur OIDC : `state` rejoué ou absent, `nonce` faux, signature invalide, audience ou émetteur faux, jeton expiré, `email_verified` faux → refus, aucune session, page `erreur.google`.
- [ ] Rattachement : un compte créé par lien magique puis une connexion Google avec la même adresse vérifiée → un seul compte, deux lignes `identites`, un seul plan offert (contrôle de L6-06).
- [ ] Adresse de retour externe ou inconnue refusée (test de redirection ouverte).
- [ ] Parcours manuel avec un compte Google de test en local et en préproduction, dont le rattachement d'un dépôt provisoire.
- [ ] Aucun jeton Google en base ni dans les journaux (recherche automatique dans la suite de tests).
- [ ] Contrôle des textes (L1-04) réussi sur la page d'erreur ; aucun texte technique visible.

## Mesure
- `compte_cree` et `session_ouverte` avec `methode` = `google` (SUIVI.md § 3.7) ; `inscription_methode_choisie` (`methode` = `google`) est posé par la page (L6-01).

## Points d'attention
- Les navigateurs intégrés (Instagram, Facebook, LinkedIn) bloquent souvent la connexion Google : le bouton y est masqué par L6-01 et L6-07, et le code à 6 chiffres mis en avant (PARCOURS.md A5, A16).
- Google est une société américaine : identité reçue et transfert à inscrire au registre (L0-09) ; seule l'adresse et le `sub` sont gardés.
- Vérifier au moment de la création du client OAuth les exigences de Google pour l'écran de consentement (nom, logo, domaines autorisés) ; un changement de nom (plan B « Avant-Clés », décision n° 10) impose de le mettre à jour.
- Ordre des boutons (lien magique ou Google d'abord) : levier L1, testé par périodes (PARCOURS.md § 7.2) ; le réglage est dans L6-01.
- Apple n'est pas au lancement ; le même protocole l'accueillera.

## Références
- produit/ARCHITECTURE.md D1, § 2.5, § 6.3, § 6.8 ; produit/recherche/auth-paiement.md § 1.4, § 1.5.
- produit/PARCOURS.md A4, A5, A16, § 7.2 ; produit/MESSAGES.md § 7.3 (`compte.google`), § 7.12 (`erreur.google`) ; produit/SUIVI.md § 3.7.

## Hors périmètre
- Lien magique, code, sessions, CSRF, couche d'identité : L5-03. Bouton dans le volet de compte : L6-01.
- Un plan offert par compte Google : L6-06. Attribution : L7-03. Apple : plus tard. SSO des promoteurs : L10-07.
