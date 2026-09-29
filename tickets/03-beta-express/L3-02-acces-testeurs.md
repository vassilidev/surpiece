# L3-02 · Ouverture contrôlée derrière Cloudflare Access

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L0-01, L3-01 | `pipeline/` [P] | À faire |

## Pourquoi
Le serveur actuel n'accepte que `localhost` par construction (audit B4) : c'est la bonne protection en local, mais elle interdit toute bêta en ligne. Pour ouvrir l'outil à des testeurs invités sans écrire d'authentification (décision n° 8 : l'authentification du service n'est pas tranchée), Cloudflare Access tient la liste des testeurs et leur connexion, et transmet au serveur un jeton signé qui porte leur e-mail. Le serveur vérifie ce jeton lui-même : un en-tête non signé ne vaut rien. Ce dispositif est propre à la bêta express et ne préjuge pas de D1 (L0-02).

## À faire
1. **Réglages par variables d'environnement** (lus dans `pipeline/serveur.py`, valeurs par défaut = comportement actuel) :
   - `PLAN_ECOUTE` (défaut `127.0.0.1`) : adresse d'écoute (`__main__`, `:803`), `0.0.0.0` seulement dans le conteneur ;
   - `PLAN_HOTES` : hôtes autorisés en plus de `localhost:PORT` et `127.0.0.1:PORT` (par exemple `beta.<domaine>`), lus par `hote_ok` (`:499`) ; `origine_ok` (`:504`) accepte alors `https://<hôte>` ;
   - `PLAN_ACCES_EQUIPE` (`https://<équipe>.cloudflareaccess.com`) et `PLAN_ACCES_AUD` (étiquette AUD de l'application Access) ;
   - **démarrage refusé** si l'écoute n'est pas locale ou si `PLAN_HOTES` est rempli sans les deux réglages Access (message clair à la console, code de sortie non nul).
2. **Nouveau module `pipeline/acces.py`** (ajout, sans refonte) : `verifier(jeton) -> email | None`.
   - Jeton lu dans l'en-tête `Cf-Access-Jwt-Assertion` (le cookie `CF_Authorization` n'est pas utilisé) ; jamais d'en-tête d'e-mail en clair.
   - Clés publiques de `https://<équipe>.cloudflareaccess.com/cdn-cgi/access/certs`, gardées en mémoire, rechargées quand un `kid` inconnu arrive.
   - Contrôles : signature, algorithme RS256 seul, `iss` égal au domaine d'équipe, `aud` qui contient l'AUD, `exp` et `nbf` (60 s de tolérance), `email` présent ; e-mail ramené en minuscules.
   - Bibliothèque : PyJWT avec `cryptography`, versions figées dans `requirements.lock` (L1-07).
3. **Dans la classe `H`** (`:483`) : une méthode `identite()` appelée au début de `do_HEAD`, `do_GET` et `do_POST`, juste après `hote_ok`. Si Access est configuré et que le jeton manque ou ne passe pas : 403 avec une page neutre, sans détail. Sans configuration Access : comportement actuel. L'e-mail est gardé dans `self.testeur` pour L3-03.
4. **Frontal.** Recommandation : tunnel `cloudflared` dans le Compose (connexion sortante seulement, aucun port entrant ouvert sur la VM) → Caddy sur le réseau interne → `outil:8780`. Caddy sert aux limites que `http.server` n'a pas (audit B5) : délais de lecture et d'écriture, corps de 41 Mo au plus, en-têtes `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, journal d'accès sans chaîne de requête. TLS est porté par Cloudflare jusqu'au tunnel. Variante si l'on garde une IP publique : Caddy en TLS, pare-feu limité aux plages d'adresses de Cloudflare ; la vérification du jeton reste obligatoire dans les deux cas.
5. **Réglage de Cloudflare Access** (tableau de bord Zero Trust, compte ouvert par L0-08) : application « self-hosted » sur `beta.<domaine>` ; politique « Allow » sur la liste des e-mails des testeurs, tenue par l'équipe ; connexion par code à usage unique envoyé par e-mail (aucun compte à créer), Google en option ; durée de session à fixer (24 h à 7 jours). Aucune règle de contournement, sauf les pages CGU et confidentialité de L3-05 si elles sont servies par la VM.
6. **README**, section « Bêta » : variables, création de l'application Access, ajout et retrait d'un testeur (retrait effectif à l'expiration de la session, ou immédiat en révoquant ses sessions dans Zero Trust).

## Critères d'acceptation
- [ ] Tests unitaires de `pipeline/acces.py` avec une paire de clés RSA créée par le test et un faux point `certs` local : jeton valide → e-mail ; jeton absent, signature fausse, `alg: none`, HS256, `aud` ou `iss` faux, jeton expiré → refus.
- [ ] Test du serveur avec `PLAN_ACCES_*` pointant vers le faux `certs` : sans jeton, `GET /`, `GET /api/plans`, `GET /plans/<id>/index.html` et `POST /api/depot` → 403 ; avec un jeton valide → réponses habituelles.
- [ ] Démarrage refusé avec `PLAN_ECOUTE=0.0.0.0` sans réglage Access.
- [ ] Sans aucune variable nouvelle : outil local inchangé (test de fumée de L1-02) ; en-tête `Host: exemple.invalide` → 403 comme aujourd'hui.
- [ ] Sur un domaine de test : un e-mail hors liste est arrêté par Access ; un testeur de la liste arrive sur l'accueil ; l'IP publique de la VM ne répond sur aucun port web (connexion directe refusée).
- [ ] Aucun texte technique dans les refus ; aucune lecture payante (tests avec `PLAN_MOCK`).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 : rejeu sans IA des références, visite de contrôle, contrôle des textes, test de fumée.

## Points d'attention
- **Sous-traitant hors UE.** Cloudflare (société américaine) voit l'e-mail des testeurs et tout le trafic de la bêta : à inscrire au registre et à la liste des sous-traitants (L0-09), et à citer dans la confidentialité de la bêta (L3-05).
- **Gratuité jusqu'à 50 utilisateurs** : chiffre repris du backlog, non revérifié ici ; à relire sur la page de prix de Cloudflare à l'ouverture du compte (L0-08). Au-delà, recruter par vagues (L3-06).
- **Écart avec le résumé du backlog** (« Caddy en frontal TLS ») : avec un tunnel, le TLS est porté par Cloudflare et Caddy ne garde que les limites et les en-têtes. Choix à consigner dans le README.
- **Domaine.** Access protège un hôte d'une zone gérée par Cloudflare : il faut un domaine dont le DNS est chez Cloudflare. Tranché : L0-01 (nom et domaines) est une dépendance déclarée. Reste à choisir, D6 recommandant Scaleway pour la vitrine : sous-domaine de la marque délégué à Cloudflare, ou domaine technique neutre pour la bêta.
- Vérification faite d'après la documentation de Cloudflare « Validate JWTs » (en-tête `Cf-Access-Jwt-Assertion`, point `certs`, contrôle de `iss` et `aud`), lue le 27/09/2026.
- `ThreadingHTTPServer` reste un serveur de développement (B5) : Caddy en limite les risques pour une bêta courte, pas au-delà.
- **Coordination avec le travail sur les niveaux** (fini le 27/09/2026, non commité) : partir du commit qui l'intègre ; diff limité à `hote_ok`, `origine_ok`, `__main__` et un appel dans chaque `do_*`, plus le nouveau fichier `pipeline/acces.py` ; branche courte ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/recherche/audit-code.md B4, B5 ; produit/ARCHITECTURE.md § 2.5 (hôtes et origines), § 6.2 (en-têtes), § 8.1 ; pipeline/README.md (protection localhost).
- pipeline/serveur.py:587 (classe `H`), :603 (`hote_ok`), :608 (`origine_ok`), :615 (`send_head`), :634 (`do_GET`), :665 (`do_POST`), :793 (`__main__`).
- Documentation Cloudflare : developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/.

## Hors périmètre
- Rattachement des plans aux testeurs : L3-03. Quotas et coûts : L3-04. VM, tunnel en production, pages CGU : L3-05.
- Authentification du service : L5-03, selon la décision D1 (L0-02).
