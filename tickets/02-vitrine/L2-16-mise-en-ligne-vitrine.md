# L2-16 · Mise en ligne de la vitrine

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | S (jusqu'à 1 j) | L0-01, L0-03, L0-08, L2-04, L2-11, L2-12, L2-15 | `site/`, `outils/` | À faire |

## Pourquoi
Le lot 2 se termine quand la vitrine est en ligne sur le domaine retenu, en HTTPS, avec la liste d'attente qui fonctionne et les pages légales publiées. Rien n'est publié avant l'achat des domaines et le dépôt de la marque (MESSAGES.md § 0.1, MARQUE.md § 1.6). La mise en ligne doit être automatique depuis le dépôt et déployable ailleurs sans réécriture (décision 2).

## À faire
1. **Hébergeur** selon D6 (tranché par L0-03). Options sur la table :
   - Scaleway Object Storage et Edge Services (recommandation d'ARCHITECTURE.md D6 : UE, un seul fournisseur, palier à 12,99 €/mois) ;
   - Cloudflare Pages (gratuit, aperçus par branche, société américaine ; hebergement.md § 3.3) ;
   - conteneur Caddy dans le Docker Compose, à côté du service de L2-12 (déployable partout, mais la vitrine tombe avec la machine).
   Les en-têtes et redirections sont écrits une fois (`site/_entetes` ou `Caddyfile`) et traduits pour l'hôte retenu.
2. **Domaine** : domaine principal (L0-01), DNS, certificat TLS automatique ; redirections des autres domaines et de `www` (règles de L2-13), testées.
3. **En-têtes de sécurité** sur toutes les réponses : `Strict-Transport-Security` (1 an), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictive, `X-Frame-Options: DENY` et `frame-ancestors 'none'`, CSP de départ :
   `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' <point de réception L2-12>; form-action 'self' <point de réception>; base-uri 'none'; object-src 'none'`, plus `challenges.cloudflare.com` en `script-src` et `frame-src` si Turnstile est retenu ; pour `/appartement-temoin/visite/`, les besoins mesurés par L2-09 (hash de la table d'import, `worker-src blob:`, styles en ligne éventuels).
4. **Cache** : fichiers versionnés (polices, vendor, moteur figé) en `immutable` ; HTML en revalidation courte.
5. **Déploiement automatique** : à chaque fusion sur la branche principale, la CI assemble le site par `outils/site.py` (R19), lance L2-15 sur la sortie, puis publie cette sortie ; aperçu protégé (`noindex`, accès restreint) pour chaque demande de fusion si l'hôte le permet ; retour arrière documenté (republier le commit précédent).
6. **Page 404** (`site/404.html`, texte `erreur.404`) servie avec le code 404.
7. **Service des formulaires** (L2-12) déployé, secrets injectés au démarrage, sauvegarde quotidienne de sa base vers une autre région et restauration testée une fois.
8. **Supervision minimale** : vérification de disponibilité de la vitrine et du point de réception (alerte par e-mail), échéance des certificats.
9. **Contrôle final avant ouverture** : `site.json` sur `mode_depot = liste_attente`, vitrine indexable (R20 : aucun `noindex` en production, nom déposé), aucune page non validée visible ; noter la date de mise en ligne.

## Critères d'acceptation
- [ ] `https://<domaine>/` répond en HTTP/2 avec un certificat valide ; `curl -I` montre tous les en-têtes du point 3.
- [ ] Observatoire de sécurité (type Mozilla Observatory) : note A ou mieux ; aucune violation de CSP dans la console sur toutes les pages, page du témoin comprise.
- [ ] Une fusion de test publie automatiquement en moins de 10 minutes ; un retour arrière est fait une fois et chronométré.
- [ ] Une inscription réelle à la liste d'attente depuis la production arrive en base, reçoit son e-mail de confirmation et apparaît dans l'export après confirmation.
- [ ] La page 404 renvoie le code 404 ; toutes les redirections sont des 301 en un seul saut.
- [ ] Aucun secret dans le dépôt ni dans les journaux de la CI ; aucune donnée de formulaire dans le dépôt.

## Points d'attention
- **Tranché** : L0-03 (hébergeur de la vitrine, D6) et L0-08 (comptes Scaleway, Cloudflare, CI) sont des dépendances déclarées.
- **Écart entre documents** : ARCHITECTURE.md D6 recommande Scaleway ; hebergement.md § 3.3 recommande Cloudflare Pages « si l'on veut des aperçus par branche », Scaleway « si l'on veut tout garder dans l'UE ». La décision 2 (Docker Compose) ouvre la troisième option. Le choix se fait dans L0-03, pas ici ; quel qu'il soit, la vitrine reste un dossier statique assemblé, déployable ailleurs sans réécriture (aucun composant propre à un hébergeur n'est obligatoire, R3).
- **Juridique** : la mise en ligne publique demande mentions légales et confidentialité (L2-11) et, pour une inscription, le registre (L0-09) ; vérifier que L2-11 est bien publié en même temps.
- **Tranché : R20.** La vitrine est indexable dès sa mise en ligne (une fois le nom déposé) ; seules les pages d'application, d'aperçu et de visite sont en `noindex`. L'aperçu protégé de chaque demande de fusion reste en `noindex`.
- La vitrine ne dépose aucun cookie au lot 2 (hors anti-spam éventuel) : la page « Gestion des traceurs » doit le dire exactement.

## Références
- produit/ARCHITECTURE.md § 2.1, § 2.5, D6, § 6.2, § 9.1, § 9.2 ; produit/recherche/hebergement.md § 3.3, § 7, § 8.
- produit/MARQUE.md § 1.6 ; produit/MESSAGES.md § 0.1, § 7.12 ; produit/SUIVI.md § 6.3.

## Hors périmètre
- Choix de l'hébergeur et achat des domaines : L0-03, L0-01. Balises et redirections (règles) : L2-13.
- Umami et son sous-domaine : L7-01. Bascule en dépôt réel : L6-01. Ouverture publique : L8-07.
