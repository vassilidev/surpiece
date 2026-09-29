# L13-03 · Vue du dessus manipulable dans l'aperçu (à tester)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | S (jusqu'à 1 j) | L6-05, L12-05, L13-01 | `moteur/` [M], `service/` | À faire |

## Pourquoi
Idée de l'utilisateur, à tester plus tard (décision n° 6) : dans l'aperçu gratuit, une vue du dessus que l'on peut faire tourner. Contrainte de la décision n° 6 : **ni le moteur ni `plan.json` ne sont envoyés au navigateur pour l'aperçu**. Donc des images rendues par le serveur, ou un fichier distinct sans les données de la visite ; toute fuite possible est à arbitrer par l'utilisateur. PARCOURS.md § 7.2 (levier L5) prévoit « une maquette qui tourne (images, sans moteur) ». C'est un ticket de R&D.

**Réduit le 27/09/2026.** L'autre moitié de l'idée d'origine (sauter entre des points prédéfinis par pièce et regarder autour) est devenue une décision de l'utilisateur : le mode 360° à chaque arrêt, dans toutes les visites, probablement l'offre gratuite (décision 15). Elle est sortie de ce ticket : prototype, coût en SwiftShader et décision dans L1-16 ; rendu des panoramas dans L4-15 ; visionneuse sans moteur dans L4-16 ; socle dans L5-27 ; aperçu gratuit en 360° dans L6-13. Ce ticket garde la seule vue du dessus manipulable.

## À faire
1. **Prototype hors service, sur le témoin fictif seulement** : 24 à 36 images de la maquette découpée autour d'un axe (même découpe que la vue du dessus de L4-09 ; une série par niveau pour un plan à plusieurs niveaux), glissées au doigt dans la visionneuse sans moteur de L4-16 (ou un petit script à nous qui ne reçoit que des images) ; aucun `plan.json`, aucune géométrie, aucun `engine.js`, aucune bibliothèque 3D.
2. **Mesures** : poids par plan ; temps de rendu en SwiftShader (à comparer à la mesure des panoramas de L1-16) et coût serveur par aperçu ; fluidité sur un téléphone d'entrée de gamme (matrice de L4-10, seuils de L1-14) ; défauts visibles (image noire, saut entre deux images).
3. **Tableau des fuites pour l'arbitrage de l'utilisateur** : images de rotation, peu de risque ; fichier 3D distinct (glTF réduit), réutilisable dans n'importe quelle visionneuse, donc la visite donnée : **déconseillé**.
4. **Test de conversion** si l'utilisateur retient la variante, à côté de l'aperçu confirmé par L1-16 (images de R1, 360°, ou les deux) : levier L5 par tirage par compte (L12-05), permis parce qu'il ne touche à aucun prix (R8) ; garder la variante qui convertit le mieux à coût égal (OFFRES.md § 9.1).
5. **Contrôles automatiques** si la variante passe en service : contrôle de L6-05 inchangé (aucune requête vers `engine.js`, `/moteur/`, `plan.json`, une bibliothèque 3D ni un fichier précalculé de la visite) ; aucune image noire.

## Critères d'acceptation
- [ ] Prototype sur le témoin : dans la page, `window.App` et `window.__v` indéfinis, aucune requête interdite (interception puppeteer).
- [ ] Tableau des mesures (poids, temps et coût de rendu, fluidité mobile) et tableau des fuites remis à l'utilisateur ; décision consignée dans OFFRES.md § 2.2.
- [ ] Aucune lecture payante ; aucun plan de promoteur utilisé ; outil local inchangé ; aucun fichier existant de `moteur/` modifié.

## Points d'attention
- **Tranché** : L13-01 (accélération) et L12-05 (tirage par compte) restent des dépendances déclarées, puisque ce ticket ajoute des dizaines d'images par aperçu. Le prototype du point 1 peut se faire avant, en SwiftShader.
- **R1** (décision 6) : l'aperçu gratuit reste celui que l'utilisateur confirme après L1-16 (images de R1, 360°, ou les deux) ; ce ticket n'en change rien tant qu'il n'a pas arbitré.
- La condition d'OFFRES.md § 2.2 (construire seulement si l'aperçu en images convertit mal, T3) vaut pour cette vue du dessus manipulable ; elle ne vaut plus pour le 360°, décidé le 27/09/2026.
- Coordination `moteur/` : ajout de fichiers seulement ; tout besoin dans `engine.js` passe par un petit diff isolé, sur le code commité du travail sur les niveaux (ARCHITECTURE.md § 8.1).

## Références
- Décisions de l'utilisateur n° 6 et n° 15 (27/09/2026) ; produit/OFFRES.md § 2.2, § 9.1, § 9.2 (T3) ; produit/PARCOURS.md A9, A10, § 7.2 (L5).
- `outils/vues.mjs` (« dessus coupée », par niveau) ; tickets L1-16, L4-09, L4-15, L4-16, L5-27, L6-13.

## Hors périmètre
- Mode 360° : L1-16, L4-15, L4-16, L5-27, L6-13. Page d'aperçu en images : L6-05. Tests A/B : L12-05. Accélération : L13-01.
