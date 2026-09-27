# L13-03 · Aperçu interactif limité (à tester)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | M (1 à 3 j) | L6-05, L12-05, L13-01 | `moteur/` [M], `service/` | À faire |

## Pourquoi
Idée de l'utilisateur, à tester plus tard : dans l'aperçu gratuit, sauter entre des points prédéfinis par pièce (les arrêts de la visite guidée) et regarder autour, sans marche libre ; et une vue du dessus que l'on peut faire tourner. Contrainte de la décision n° 6 : **ni le moteur ni `plan.json` ne sont envoyés au navigateur pour l'aperçu**. Donc des images rendues par le serveur, ou un fichier distinct sans les données de la visite ; toute fuite possible est à arbitrer par l'utilisateur. OFFRES.md § 2.2 ne construit la maquette interactive que si le test T3 montre que l'aperçu en images convertit mal ; PARCOURS.md § 7.2 (levier L5) prévoit « une maquette qui tourne (images, sans moteur) ». C'est un ticket de R&D.

## À faire
1. **Prototype hors service, sur le témoin fictif seulement** :
   - **panoramas** : pour chaque arrêt de `plan.json` (`stops` : `p`, `yaw`, `level`), 6 faces d'un cube à 90° de champ, rendues par un nouvel outil `moteur/panoramas.mjs` (fichier ajouté, sur le modèle de `photos.mjs` et d'`outils/marche.mjs`, qui capture déjà 4 directions par pièce) ; portes ouvertes comme la visite guidée (`goStop`, `moteur/engine.js:1547`) ; **exposition calculée une fois par arrêt et appliquée aux 6 faces** (l'exposition automatique par vue de `photos.mjs`, l. 92-104, ferait des coutures visibles) ;
   - **vue du dessus manipulable** : 24 à 36 images de la maquette découpée autour d'un axe, glissées au doigt ;
   - **visionneuse sans moteur** dans la page d'aperçu (L6-05) : petit script à nous (cube en CSS 3D ou canevas 2D) qui ne reçoit que des images et une liste `{pièce, image}` ; aucun `plan.json`, aucune géométrie, aucun `engine.js`, aucune bibliothèque 3D ; puces de pièces à la manière de `ui.js` (l. 719).
2. **Mesures** : poids par plan (6 faces × nombre d'arrêts + images de rotation) ; temps de rendu en SwiftShader (environ 70 s par photo pleine taille sur M3 ; faces plus petites, à mesurer) et coût serveur par aperçu ; fluidité sur un téléphone d'entrée de gamme (matrice de L4-10) ; défauts visibles (coutures, face noire, arrêt dans un mur).
3. **Tableau des fuites pour l'arbitrage de l'utilisateur** :
   - panoramas : montrent gratuitement ce que la visite montrerait depuis ces points ;
   - images de rotation : peu de risque ;
   - fichier 3D distinct (glTF réduit) : réutilisable dans n'importe quelle visionneuse, donc la visite donnée ; **déconseillé**.
4. **Test de conversion** si l'utilisateur retient une variante : levier L5 par tirage par compte (L12-05), permis parce qu'il ne touche à aucun prix (R8) ; mesure : achats depuis l'aperçu et coût par aperçu ; garder la variante qui convertit le mieux à coût égal (OFFRES.md § 9.1).
5. **Contrôles automatiques** si la variante passe en service : contrôle de L6-05 inchangé (aucune requête vers `engine.js`, `/moteur/`, `plan.json` ni une bibliothèque 3D) ; aucune face noire ; écart de couleur au bord de deux faces voisines sous un seuil ; chaque arrêt dans sa pièce (`App.roomAt`).

## Critères d'acceptation
- [ ] Prototype sur le témoin : dans la page, `window.App` et `window.__v` indéfinis, aucune requête interdite (interception puppeteer).
- [ ] Tableau des mesures (poids, temps et coût de rendu, fluidité mobile, coutures) et tableau des fuites remis à l'utilisateur ; décision consignée dans OFFRES.md § 2.2.
- [ ] Aucune lecture payante ; aucun plan de promoteur utilisé ; outil local inchangé ; `panoramas.mjs` ajouté sans modifier les fichiers existants de `moteur/`.

## Points d'attention
- **Tranché** : L13-01 (sans accélération, des dizaines d'images par aperçu en SwiftShader coûtent trop cher en temps) et L12-05 (tirage par compte pour comparer à l'aperçu en images) sont des dépendances déclarées. Proposition : le prototype du point 1 peut se faire avant, en SwiftShader, puisque ses mesures (point 2) portent sur ce rendu.
- **Tranché : R1** (décision 6). Au lancement, l'aperçu gratuit reste en images (vue du dessus, plan 2D, 2 photos, surfaces, points à faire confirmer), sans moteur ni `plan.json` ; ce ticket n'en change rien tant que l'utilisateur n'a pas arbitré.
- **Condition d'OFFRES.md § 2.2** : ne construire que si l'aperçu en images convertit mal (T3). Si T3 est bon, ce ticket s'arrête au prototype.
- Les `refs` du JSON citent deux fois OFFRES.md § 2.2 ; la seconde vise le paragraphe « Maquette interactive dans l'aperçu ».
- Coordination `moteur/` : ajout d'un fichier seulement ; tout besoin dans `engine.js` passe par un petit diff isolé avec l'agent des duplex (ARCHITECTURE.md § 8.1).

## Références
- Décision de l'utilisateur n° 6 (27/09/2026) ; produit/OFFRES.md § 2.2, § 9.1, § 9.2 (T3) ; produit/PARCOURS.md A9, A10, § 7.2 (L5).
- `moteur/ui.js:719` (puces des arrêts) ; `moteur/engine.js:1547` (`goStop`) ; `moteur/photos.mjs:92-104` (exposition par vue) ; `outils/marche.mjs` (captures à hauteur d'œil par pièce).

## Hors périmètre
- Page d'aperçu en images : L6-05. Tests A/B : L12-05. Accélération : L13-01.
