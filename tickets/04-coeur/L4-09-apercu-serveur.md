# L4-09 · Aperçu rendu par le serveur et galerie adaptable

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-09 | `moteur/` [M] | À faire |

## Pourquoi
Décision n° 5 (27/09/2026) : au lancement, pas de galerie complète. Le serveur ne rend que la visite de contrôle et des images d'aperçu, dans cet ordre : **vue du dessus 3D découpée** (rendue en premier, montrée en direct sur l'écran d'attente), **plan 2D coté** (capture), **2 photos**. La visite 3D se calcule dans le navigateur du client ; au pire, la visite est livrée sans les photos. Décision n° 4 : rendu SwiftShader dans un conteneur, environ 11 fois plus lent qu'avec un GPU (11 photos en 684 s contre 60 s, recherche/hebergement.md § 2.1). Décision n° 6 : l'aperçu gratuit n'est fait que d'images serveur. Il faut donc que `photos.mjs` rende une liste ordonnée de vues, dont deux vues nouvelles, et que la galerie de la visite s'adapte à 0, 1, 2 ou N photos sans jamais montrer de vignette vide ou noire.

## À faire
1. **`moteur/photos.mjs` reçoit la liste ordonnée des vues** (deuxième argument, déjà lu comme `only`, `photos.mjs:12`), et la respecte dans cet ordre. Deux vues spéciales, connues de `photos.mjs` seul (aucun changement de `plan.json` ni de `moteur/SCHEMA.md`) :
   - **`vue_dessus`** : mode `orbit`, caméra à la verticale du centre de `App.D.bounds` avec une marge qui cadre tout le logement et la loggia (logique de la vue « dessus » d'`outils/vues.mjs`), éclairage de la version de base (lampes allumées, `plan.simple`), exposition comme la vue d'ensemble ; découpe par l'option existante « Coupe horizontale à 1,20 m » (`App.set('cut', true)`, `engine.js:1619`) ou simple retrait des plafonds du mode `orbit`, à choisir sur les captures des références avec l'utilisateur ; fichier `photos/vue_dessus-jour.jpg`. Plusieurs niveaux : une vue par niveau (`vue_dessus-n<k>`), sans objet en service tant que `niveaux_max = 1` (L4-08) ;
   - **`plan_2d`** : mode `plan`, cotes affichées (`dims`), **superposition du plan du promoteur coupée** (`underlay: false`), légende et commandes masquées, attente de `document.fonts.ready`, capture de l'élément `#plan` (SVG de `drawPlan`, `ui.js:653`) à au moins 2 000 px sur le grand côté, fond blanc ; fichier `photos/plan_2d.png`. Cette capture ne dépend pas de WebGL.
2. **Préréglage `apercu`** : `node moteur/photos.mjs plans/<id> apercu` = `vue_dessus`, `plan_2d`, puis les deux photos données par `choisirApercu(plan)`. Règle tranchée (R1) : le séjour (première vue de la galerie, pièce la plus grande, `lire.py`, `complete`, `:1195-1221`), puis la chambre principale (proposé : la plus grande chambre) ou, à défaut, la pièce principale suivante ; toujours une **autre pièce** (`room` différent : pas la variante `-inverse` du séjour), jamais une loggia, un balcon ni un dégagement. Appliquée et vérifiée à l'œil sur les 4 références (L1-02) et le témoin (L1-12). Si une vue est écartée (« vue sans intérêt », `photos.mjs:106`), prendre la candidate suivante.
3. **Une image à la fois, annoncée** : chaque image est écrite dès qu'elle est prête (fichier temporaire puis renommage), puis annoncée par une ligne `IMAGE {json}` sur la sortie standard : `image` (`vue_dessus`, `plan_2d`, `photo_1`, `photo_2`, noms de L5-10 et L5-11), `vue`, `fichier`, `statut` (`ok`, `ecartee`, `echec`), `duree_ms`, `luminance`, moteur WebGL relevé. Une photo en `echec` après ses nouvelles tentatives est omise, sans bloquer les images suivantes ni la publication (R2 ; alerte à l'équipe par L5-11) ; la vue du dessus et le plan 2D, eux, conditionnent la publication de l'aperçu. Les lignes actuelles (`<vue>-jour luminance …`, lues par `serveur.photos` pour le pourcentage, `serveur.py:378`) restent.
4. **Option `--sans-modifier-plan`** : les vues écartées sont seulement annoncées, `plan.json` n'est pas réécrit (L5-10 : l'exécutant de rendu ne modifie jamais `plan.json`). Sans l'option, comportement actuel.
5. **Sans argument** : comportement actuel inchangé (toutes les vues de `plan.photos`), pour l'outil local.
6. **Galerie adaptable** (`moteur/ui.js`, `renderGallery`, `:797` ; balisage `:379-399`) :
   - 0 photo : ni grande image, ni vignettes, ni compteur ; la colonne (titre, surfaces, `g-cta` « Lancer la visite 3D », Maquette 3D, Plan 2D) reste ;
   - 1 photo : grande image seule, sans flèches ni rangée de vignettes ;
   - N photos : `min(9, N)` colonnes (existant) ;
   - une vignette n'apparaît qu'une fois son image chargée ; une image en erreur (fichier absent, 404) est retirée de la liste au lieu d'afficher une image cassée ; si toutes échouent, cas « 0 photo ».
7. **Contrôle automatique** `outils/galerie.mjs` (nouveau) : ouvre une copie de visite de référence avec 0, 1, 2 et 11 photos, et avec un fichier manquant ; échoue sur toute image visible de largeur naturelle nulle, toute vignette sans image, toute vignette dont la luminance moyenne est sous 0,03 (noire), et tout texte technique (L1-04). Il vérifie aussi les images d'aperçu : 4 fichiers présents, taille attendue, ni noirs ni uniformes (luminance moyenne et écart-type au-dessus d'un seuil), plan 2D sans aucune requête vers `plan-*.png` pendant la capture.
8. **Mesures** en SwiftShader (conteneur de L3-01, ou poste avec `RENDU_CHROME=swiftshader`) : durée de chaque image (vue du dessus, plan 2D, chaque photo) sur les références et le témoin ; notées pour T0 (L5-11). Ce sont des mesures internes : aucun délai n'est affiché avant la mesure en production (marqueur ‹délai›, R12).

## Critères d'acceptation
- [ ] `node moteur/photos.mjs plans/<ref> apercu` produit, dans l'ordre, `vue_dessus-jour.jpg`, `plan_2d.png` et deux photos de deux pièces différentes, avec une ligne `IMAGE` par image dès qu'elle est écrite, sur les 4 références et le témoin.
- [ ] Plan 2D capturé : cotes lisibles, aucune superposition du plan du promoteur (aucune requête vers `plan-*.png`, vérifié par interception).
- [ ] Sans argument : 11 photos comme avant, à moins de 2/255 de la ligne de base ; `plan.json` non réécrit avec `--sans-modifier-plan`.
- [ ] `outils/galerie.mjs` vert : 0, 1, 2 et 11 photos, fichier manquant ; aucune vignette vide ni noire, aucune image cassée, aucun texte technique.
- [ ] Capture du plan 2D réussie avec Chrome lancé sans WebGL.
- [ ] Durées SwiftShader mesurées et notées ; aucune lecture payante (lectures gardées) ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Tranché : R1 (quelles 2 photos).** Séjour, puis chambre principale ou, à défaut, la pièce principale suivante (et non séjour puis séjour sous un autre angle, ordre actuel de la galerie) ; L2-03 et L6-05 reprennent la même règle.
- **Tranché : décision 5 (quelle vue du dessus).** Vue du dessus 3D découpée, nouvelle, pas la vue `maquette` (« vue d'ensemble plongeante » d'OFFRES.md § 2.2, `vue_dessus (vue maquette, orbit)` de L5-11).
- **Tranché : R1 (textes ailleurs).** « environ 11 photos » (OFFRES.md § 0.1 et § 2.4, MESSAGES.md § 7.6) et les 8 photos rendues au déblocage (PARCOURS.md A12) disparaissent : la galerie complète (L13-02) n'est jamais promise au lancement ; textes repris par leurs propriétaires et par L2-08, L6-05 et L8-02, pas ici.
- Les images sont marquées ensuite par L4-07 (PNG compris) ; ce ticket ne marque rien.
- Sans L4-06, la capture du plan 2D charge les polices depuis Google : accès réseau nécessaire.
- **Coordination avec le travail sur les duplex** : `photos.mjs` et `ui.js` sont modifiés en parallèle (plusieurs niveaux) ; petits diffs, sur un commit fusionné ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/OFFRES.md § 2.2, § 2.4 ; produit/PARCOURS.md A7, A9, A12 ; produit/ARCHITECTURE.md § 2.3 (étape 7), D3, § 9.5 ; produit/recherche/hebergement.md § 2.1, § 2.3 ; produit/MESSAGES.md § 0.3, § 7.6.
- moteur/photos.mjs:12 (liste de vues), :70-73 (vue `orbit`), :106 (vues écartées), :112-116 (réécriture de `plan.json`) ; outils/vues.mjs (vues « dessus » et « plan ») ; moteur/engine.js:1358 (`defaultOrbitView`), :1619 (`cut`) ; moteur/ui.js:379-399 (galerie), :392 (`g-cta`), :653 (`drawPlan`), :797 (`renderGallery`) ; pipeline/lire.py:1195-1221 (vues de la galerie) ; pipeline/serveur.py:378 (`photos`).

## Hors périmètre
- Exécutant de rendu et contrat : L5-10. Ordre de livraison, affichage en direct, e-mail, T0 : L5-11. Page d'aperçu : L6-05. Marquage : L4-07. Galerie complète : L13-02.
