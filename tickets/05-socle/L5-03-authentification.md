# L5-03 · Authentification selon la décision D1 : lien magique, code, sessions

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L0-02, L5-01, L5-14, L5-15 | `service/` | À faire |

## Pourquoi
Le serveur actuel n'a pas de comptes : quiconque connaît un identifiant voit un plan (audit B1, B2), et la protection se limite à `localhost` (`hote_ok`, `origine_ok`, `pipeline/serveur.py:603-614`, audit B4). Le choix du fournisseur n'est pas tranché : l'utilisateur penchait pour Auth0, la recherche recommande une auth maison (lien magique avec code, Google), Supabase Auth Paris en alternative. Quelle que soit la décision de L0-02, on construit une couche `FournisseurIdentite` interchangeable : le fournisseur dit seulement « qui est-ce », les comptes, organisations, rôles, crédits et sessions restent dans notre base. Ce ticket livre la couche d'identité, le lien magique avec code, les sessions et leurs protections ; la connexion Google est découpée dans L5-24.

## À faire
1. Lire la décision D1 consignée par L0-02 dans ARCHITECTURE § 3. Ce qui suit décrit l'option recommandée (auth maison) ; l'étape 9 donne l'écart pour les deux autres.
2. Tables (migration Alembic) : `comptes`, `organisations` (colonnes utiles au lancement : `type`, `nom`, `offre_code` et `offre_version_id`, `travaux_simultanes_max`, `plafond_ia_mensuel_usd` ; valeurs d'offre lues dans le catalogue de L5-08, jamais un code figé du type `pro-5`, R5), `membres`, `identites`, `sessions`, `jetons_connexion`, `acceptations`, `limites` (ARCHITECTURE § 4.2). Les autres colonnes arrivent avec leurs tickets.
3. `service/auth/fournisseurs/base.py` : le protocole `FournisseurIdentite` (`debut`, `fin` → `IdentiteVerifiee(fournisseur, sujet, email, email_verifie)`), tel qu'écrit dans ARCHITECTURE D1. Après chaque retour de fournisseur, c'est toujours **notre** session qui est posée. Google (L5-24) se branche sur ce protocole sans rien changer ici.
4. Lien magique et code (`fournisseurs/email.py`) :
   - `POST /auth/lien` (e-mail, contexte, adresse de retour interne) : même réponse et même délai que l'adresse soit connue ou non ; l'envoi part par la file d'e-mails de L5-14 (E1, un seul bouton, aucun pixel) ;
   - jeton de 32 octets aléatoires stocké haché (SHA-256), usage unique, lié à l'e-mail et non au navigateur ; durée 15 min par défaut, réglable (durée à trancher dans L0-05) ;
   - code à 6 chiffres dans le même e-mail, stocké en HMAC avec une clé serveur (pas un simple SHA-256 : 10⁶ valeurs se retrouvent en une seconde), 5 essais puis jeton invalidé ;
   - `GET /auth/lien/{jeton}` : crée le compte s'il n'existe pas, puis la session sur **l'appareil où l'on a cliqué** ;
   - `POST /auth/code` : seule voie pour ouvrir la session dans l'onglet d'origine. Cet onglet peut savoir que le lien a été confirmé (référence aléatoire de la demande), **jamais recevoir la session sans le code** (PARCOURS A5) ;
   - limites : 5 demandes par heure par e-mail, 20 par heure par IP, dans la table `limites` (§ 6.4), avec un petit utilitaire `service/limites.py` que L5-19 étendra.
5. E-mail normalisé : minuscules, sans `+étiquette`, points retirés pour Gmail (`email_normalise` unique) ; l'adresse saisie reste dans `email` pour l'envoi.
6. Rattachement des identités : un compte peut porter plusieurs lignes `identites` (fournisseur, sujet) ; une identité vérifiée dont l'e-mail normalisé correspond à un compte existant est rattachée à ce compte. Règle commune, testée ici avec le lien magique ; le fournisseur Google est ajouté par L5-24.
7. À la création d'un compte, dans la même transaction : organisation `personnelle` (offre du particulier, code lu dans le catalogue, R5), ligne `membres` en `proprietaire`, `sessions.organisation_active_id` sur elle. Si l'écran transmet l'acceptation des CGU, ligne `acceptations` (document, version, horodatage, préfixe IP).
8. Sessions et protections :
   - cookie `__Host-session` (`HttpOnly; Secure; SameSite=Lax`), 256 bits, stocké haché, 30 jours glissants, rotation à la connexion, révocation, `POST /auth/deconnexion` et « se déconnecter partout » ;
   - CSRF : jeton lié à la session sur chaque POST, PUT, PATCH et DELETE, plus contrôle de l'en-tête `Origin` ;
   - hôtes autorisés tirés de la configuration (`app.<domaine>`, `localhost` en local), la table `domaines` viendra avec L11-01 ;
   - dépendance FastAPI `session_courante()` → compte et organisation active, utilisée par toutes les routes privées ; comparaisons en temps constant (`hmac.compare_digest`).
9. Écarts selon D1 :
   - Supabase Auth (Paris) : fournisseur `supabase` qui vérifie le jeton de Supabase côté serveur (JWKS), puis pose notre session ; e-mails de Supabase envoyés par notre SMTP avec les textes de MESSAGES.md ; organisations dans notre base ;
   - Auth0 : tenant en région UE, code à 6 chiffres par e-mail au lieu du lien (le lien n'existe pas dans Universal Login), aucune Action ni règle, organisations dans notre base et non dans Auth0 Organizations.
   - Dans les trois cas, la connexion Google passe par L5-24.
10. Pages minimales rendues par le serveur, sans détail technique : `/connexion` (MESSAGES.md § 7.3 « Connexion d'un compte existant » : `connexion.titre`, bouton `connexion.bouton`), écran « Vérifiez votre boîte e-mail » (`compte.envoye.*`, avec le champ du code à 6 chiffres), erreur `erreur.lien_connexion` (§ 7.12). `erreur.google` est traité par L5-24. Le volet d'inscription au moment du dépôt est fait par L6-01.

## Critères d'acceptation
- [ ] Tests du § 6.8 sur ces routes : jeton rejoué, expiré, falsifié, tronqué ; code faux 5 fois ; énumération (même corps, même statut, écart de délai non significatif sur 200 essais) ; CSRF refusé sur chaque route d'écriture ; limites effectives.
- [ ] Test : l'onglet d'origine n'obtient aucune session sans le code, même après confirmation du lien ailleurs.
- [ ] Parcours complet en local avec Mailpit : lien, code, déconnexion, révocation.
- [ ] Parcours manuel sur iPhone : lien ouvert depuis l'application Gmail, dans un autre navigateur que celui de la demande (critère de M2.3).
- [ ] Aucun mot de passe stocké, nulle part ; aucun jeton ni code en clair dans la base ou les journaux.
- [ ] Contrôle des textes (L1-04) réussi sur les pages de connexion ; aucun texte technique visible.

## Mesure
- `lien_magique_refuse` (motif `expire`, `deja_utilise`, `invalide`), `compte_cree` (`methode`, `cible`, `contexte`), `session_ouverte` (`methode`, `cible`). `lien_magique_envoye` est émis par L5-14 quand le service d'envoi accepte l'e-mail.

## Points d'attention
- D1 non tranché : ne pas commencer avant la décision écrite de L0-02. Le protocole et les tables sont les mêmes pour les trois options ; seul le fournisseur change.
- Tranché (découpage) : ARCHITECTURE D1 estimait 4 à 6 jours pour l'auth maison, au-delà d'un L. Ce ticket garde lien magique et code, sessions, CSRF, hôtes autorisés, organisation personnelle et couche d'identité ; la connexion Google est dans L5-24.
- Les événements passent par `journal.ecrire` (L5-15, dans les dépendances), dans la transaction du fait.
- MESSAGES.md porte désormais le code à 6 chiffres sur l'écran `compte.envoye` (`compte.envoye.code.*`) ; vérifier avant de coder qu'E1 le porte aussi (PARCOURS § 8.2).
- Juridique : preuve d'acceptation des CGU (version, horodatage) conservée 5 ans (ARCHITECTURE § 4.4) ; Turnstile et anti-abus du plan offert ne sont pas ici.

## Références
- produit/ARCHITECTURE.md D1, § 2.5 (cookies par origine), § 4.2, § 6.3, § 6.4, § 6.8, M2.3.
- produit/recherche/auth-paiement.md § 1.4, § 1.5.
- produit/PARCOURS.md A4, A5 ; produit/MESSAGES.md § 7.3, § 7.12.
- `pipeline/serveur.py:603-614` (`hote_ok`, `origine_ok`), `:701` (`depot`, en-tête `x-nom`).

## Hors périmètre
- Connexion Google : L5-24.
- Rôles, invitations, changement d'organisation : L5-04. Volet d'inscription dans le parcours : L6-01.
- Turnstile, crédit offert et anti-abus : L6-06. Apple : plus tard. SSO des promoteurs : L10-07.
- Double authentification de l'équipe : L5-17. Tests de sécurité étendus à toutes les routes : L5-19.
