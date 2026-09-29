# L4-11 · Mode simple du moteur : réglages avancés et superposition masqués

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | S (jusqu'à 1 j) | L1-02 | `moteur/` [M] | À faire |

## Pourquoi
La version de base est simple et très éclairée ; réalisme et lumière réelle viendront plus tard, en option payante (CLAUDE.md, OFFRES.md § 1 et § 7). Le drapeau `simple` de `plan.json` (posé à `true` pour tout plan par `complete`, `pipeline/lire.py:1236`) masque déjà les réglages de soleil, de brise-soleil et de lumière (`moteur/ui.js:345`) et les préréglages de lumière (`:786`, `:804`). Mais le panneau Réglages garde deux éléments qui ne relèvent pas de l'offre de base :
- le bouton « Rendu photoréaliste de la vue » et son paragraphe (`ui.js:374-377`), qui lance le lancer de rayons (`three-gpu-pathtracer`, `engine.js:1650`, `:1673`) ; or le mot « photoréaliste » est banni des textes (MESSAGES.md § 0.4) et les limites affichées disent « pas de rendu photoréaliste » ;
- la case « Plan 2D : superposer le plan du promoteur » (`ui.js:371`), affichée même quand `plan.json` n'a pas de calque (`underlay`), alors que la superposition est réservée à la vue du propriétaire ou à l'accord du promoteur (OFFRES.md § 1, audit B7, L10-06).

PARCOURS.md § 8.2 relève cet écart. Arbitrage R16 : le corriger avant la bêta fermée.

**Changé le 29/09/2026 (retour R4, voir L4-13)** : le panneau Réglages a une case « Ultra réaliste » ; le bouton « Rendu photoréaliste de la vue » et les réglages de soleil, brise-soleil (seulement si le plan en a), lampes, exposition et occlusion ne sont montrés que quand elle est cochée, pour tout plan (`D.simple` ne les masque plus). Reste de ce ticket : dans l'offre de base publiée, masquer aussi la case elle-même et le mot « photoréaliste » (MESSAGES.md § 0.4), ou en faire une option, à décider avec les offres (OFFRES.md § 7) ; la case de superposition (point 3) est inchangée.

## À faire
1. **Bouton « Rendu photoréaliste de la vue »** : ni le bouton ni son paragraphe ne sont rendus quand `D.simple` est vrai (même motif que la section Soleil, `ui.js:345`). Le module `three-gpu-pathtracer` n'est alors jamais importé (import dynamique, `engine.js:1650`).
2. **Garde dans `engine.js`** : l'écouteur de `btnPhoto` (`engine.js:1673`) suppose que le bouton existe ; le rendre sûr (élément absent → aucun écouteur), sinon le moteur plante au démarrage en mode simple.
3. **Case de superposition** (`#optUnderlay`, `ui.js:371` ; liaison `:767`, `:809`) : rendue seulement si `D.underlay` est présent. Le service ne laisse `underlay` dans le `plan.json` publié que pour la vue du propriétaire ou avec l'accord prouvé du promoteur (L5-12, L10-06) ; la case suit donc la même règle. Défaut `underlay: false` inchangé (`DEF`, `ui.js:438`) : la superposition ne s'allume jamais seule. Ce point reprend le petit diff demandé par L10-06 (point 6).
4. **Hors mode simple** (`simple: false`, pour les options futures) : panneau inchangé (soleil, lumière, rendu photoréaliste).
5. **Contrôle automatique** dans la visite de contrôle (`moteur/controle.mjs`) : en mode simple, échec si `#btnPhoto` existe ou si un texte « photoréaliste » est présent dans le panneau Réglages, si `#optUnderlay` existe alors que `plan.json` n'a pas d'`underlay`, ou si une requête vers `three-gpu-pathtracer` part. Le problème relevé porte un code clair, jamais affiché à l'utilisateur.
6. **Vérifier sans payer** : rejeu L1-02 des 4 références et, s'il existe, du témoin (L1-12) ; captures du panneau Réglages en mode simple, avec et sans `underlay`, et sur un `plan.json` de test en `simple: false`.

## Critères d'acceptation
- [ ] En mode simple : le panneau Réglages ne contient ni « Rendu photoréaliste de la vue » ni son paragraphe ; aucune erreur à la console ni écran d'erreur au démarrage.
- [ ] Sans `underlay` dans `plan.json` : aucune case de superposition ; avec `underlay` : case visible, décochée par défaut, superposition fonctionnelle.
- [ ] Sur un `plan.json` de test en `simple: false` : bouton et réglages avancés présents comme aujourd'hui.
- [ ] Aucune requête vers `three-gpu-pathtracer` en mode simple (interception dans la visite de contrôle).
- [ ] Test négatif : une copie de `ui.js` qui réaffiche le bouton en mode simple fait échouer la visite de contrôle.
- [ ] Rejeu sans IA des références (L1-02) : `plan.json` identiques, visite de contrôle réussie, photos à moins de 2/255 (le panneau est masqué pendant les captures) ; contrôle des textes (L1-04) s'il est livré ; aucune lecture payante ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Verrou d'interface seulement** : masquer la case ne protège pas le plan du promoteur. Le verrou est côté serveur : l'image du plan n'est jamais servie à un tiers (L3-03 en bêta express, L5-12 en service, R4). Ce ticket évite seulement de proposer une fonction réservée ou vide.
- **Outil local** : le `plan.json` local garde `underlay` ; la case reste donc visible en local, pour la vérification de l'équipe (vue du propriétaire).
- **Rien n'est supprimé** : le lancer de rayons et les réglages de lumière restent dans le code, masqués par `simple`, pour les options payantes futures (OFFRES.md § 7).
- **Copie figée du témoin** : la page de démonstration (L2-09) prend sa copie du moteur après ce ticket, pour montrer la version de base.
- **Coordination avec le travail sur les niveaux** (terminé le 27/09/2026, pas encore commité : 23 fichiers, dont `pipeline/niveaux.py`) : partir de son commit ; `ui.js`, `engine.js` et `controle.mjs` le portent ; petits diffs isolés ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/PARCOURS.md A12 (« Offre de base »), § 8.2 (ligne `moteur/ui.js`) ; produit/OFFRES.md § 1 (version de base, plans des promoteurs), § 7 ; produit/MESSAGES.md § 0.4 ; produit/ARCHITECTURE.md § 5.3, § 7.2 (`mode_simple`, `superposition_autorisee`) ; produit/recherche/audit-code.md B7 ; CLAUDE.md (version de base simple et très éclairée).
- moteur/ui.js:345 (section Soleil sous `D.simple`), :371 (`#optUnderlay`), :374-377 (`#btnPhoto` et paragraphe), :438 (`DEF`), :672 (dessin du calque), :767 et :809 (liaison des cases), :786 et :804 (préréglages masqués) ; moteur/engine.js:1650 (import de `three-gpu-pathtracer`), :1673 (écouteur de `btnPhoto`) ; moteur/SCHEMA.md (`simple`, `underlay`) ; moteur/controle.mjs ; pipeline/lire.py:1236 (`simple`, non modifié).

## Hors périmètre
- Retrait d'`underlay` des publications et vue du propriétaire : L5-12 ; superposition autorisée par le promoteur : L10-06.
- `ConfigRendu.mode_simple` et `ConfigProduit.superposition_autorisee` : L4-01.
- Repli sans WebGL et réglages des petits appareils : L4-10.
- Options payantes (lumière réelle, réalisme) : OFFRES.md § 7, après le lancement.
