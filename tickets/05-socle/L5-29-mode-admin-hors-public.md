# L5-29 · BLOQUANT avant l'ouverture du SaaS : mode admin et documents des plans hors de portée du public

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L4-19, L5-03, L5-04 | `moteur/`, `pipeline/`, `outils/`, `service/` | À faire |

## Pourquoi
Décision de l'utilisateur du 29/09/2026 : tant que le produit n'est pas un SaaS, le mode admin reste visible partout, y compris sur la copie partagée (GitHub Pages) : « je dois toujours voir les fichiers et le moteur eau etc. en prod pour l'instant », puis « note dans tes tickets qu'on ne doit pas laisser comme ça au début du SaaS ».

Aujourd'hui, n'importe quel visiteur d'une visite voit :
- le bouton « Admin » (`moteur/admin.js`, chargé par `moteur/ui.js` sans condition) : bandeau de débogage, rayons X, eau, verdict des contrôles ;
- tous les documents du plan : PDF et page du promoteur, plan recadré, réponses brutes et relecture de l'IA, coûts des appels, `plan.json`, contrôles (`/api/admin/<id>` en local ; `plans/<id>/admin/` et `fichiers.json` dans la copie partagée faite par `outils/publier.mjs`) ;
- dans la page des plans : menu « Documents », liens Admin.

Rien de cela ne doit être visible d'un acquéreur, d'un invité ni d'un promoteur tiers (CLAUDE.md : aucun texte technique montré à l'utilisateur ; plans des promoteurs jamais publiés sans accord ; ARCHITECTURE.md § 6).

## À faire
1. **Mode admin réservé à l'administrateur** : `admin.js` servi et chargé seulement pour une session administrateur (rôle, L5-03 et L5-04) ; ailleurs, ni bouton, ni panneau, ni `?debug=1`, ni lien `#admin`.
2. **Documents des plans** : `/api/admin/*` (pipeline/serveur.py) remplacé par une route authentifiée du service (administrateur seulement) ; aucun document dans le stockage publié (S3 privé, L5-02) ; `outils/publier.mjs` : option par défaut sans `admin/` ni `fichiers.json` pour toute copie destinée au public.
3. **Page des plans** (`pipeline/accueil.html`) : menu Documents et liens Admin seulement pour l'administrateur ; la page publique est celle du lot 6.
4. **Contrôles automatiques** : une visite servie à un visiteur non administrateur ne charge pas `admin.js`, ne montre ni bouton Admin ni bandeau, et chaque adresse de document répond 404 (ajouté au test de bout en bout et au test du serveur statique, `outils/test_statique.mjs`).
5. **Copie partagée actuelle** (dépôt GitHub Pages, s'il est créé) : retirée ou refaite sans `admin/` avant l'ouverture.

## Critères d'acceptation
- [ ] Visiteur anonyme et acquéreur connecté : aucun bouton Admin, aucun document accessible (404), contrôle automatique vert.
- [ ] Administrateur : mode admin complet, comme aujourd'hui.
- [ ] Aucune copie publique du mode admin ni des documents au lancement (vérifié à la main et par le test).

## Points d'attention
- Bloque L8-07 (ouverture publique) et la bêta fermée si des testeurs extérieurs y ont accès.
- Ne pas retirer le mode admin de l'outil local : il sert au débogage (L4-19).

## Références
- L4-19 ; HISTORIQUE.md (29/09/2026) ; moteur/admin.js ; pipeline/serveur.py (`admin`, `/api/sante`) ; outils/publier.mjs ; outils/importer.mjs.
