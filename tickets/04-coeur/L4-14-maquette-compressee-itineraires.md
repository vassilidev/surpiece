# L4-14 · Maquette compressée et itinéraires précalculés

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | L (3 à 5 j) | L1-11, L4-06 | `moteur/` [M] | À faire |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 14) : le précalcul côté serveur est validé. Il comprend une maquette compressée prête à l'emploi et les itinéraires. Aujourd'hui, le navigateur reconstruit toute la géométrie depuis `plan.json` à chaque ouverture (murs, baies, escaliers, équipements), puis ses itinéraires. Cela coûte du temps d'ouverture et de la mémoire sur un appareil modeste (décision 12). Le serveur produit une fois la maquette compressée et les itinéraires entre arrêts. Demande de l'utilisateur du 27/09/2026 (« ne pas charger ce qu'on ne voit pas », décision 13) : chargement progressif, la pièce d'entrée d'abord.

## À faire
1. **Export de la maquette** construite par le moteur, depuis la visite chargée en palier « haut » (outil `moteur/precalcul.mjs` de L4-13, ou nouveau s'il n'existe pas encore). Format et compression à choisir sur mesures : poids, temps de décodage, prise en charge par les navigateurs de la matrice de L4-10. Décodeurs servis par nous (L4-06).
2. **Itinéraires précalculés** entre chaque paire d'arrêts (logique d'`outils/trajets.mjs`, escaliers compris), dans un fichier à côté de `plan.json`.
3. **Moteur** : il charge la maquette et les itinéraires s'ils existent et correspondent au `plan.json` (empreinte). Sinon, construction actuelle. Le plan 2D, la fiche et les textes restent tirés de `plan.json`.
4. **Chargement progressif** : la pièce d'entrée (premier arrêt) d'abord, puis les autres pièces, grâce au découpage par pièce et par niveau de L4-17 s'il existe. Ordre exact et découpage du fichier : à mesurer. Jamais de pièce vide, noire ou sans mur visible pendant l'attente ; la visite de contrôle et les photos attendent la maquette complète.
5. **Mesures** : poids transféré et temps jusqu'à la première image (repère de L4-10), avant et après, sur le profil « appareil modeste » (L1-14).
6. **Contrôles automatiques** : la visite de contrôle tourne sur la maquette chargée, test d'immersion `etancheite` compris : ce qui sera publié est ce qui a été contrôlé. Un écart de géométrie entre maquette chargée et maquette construite, au-delà d'un seuil, fait échouer le contrôle.

## Critères d'acceptation
- [ ] Témoin, 4 références, duplex 3081-613 : visite de contrôle réussie sur la maquette chargée ; photos à moins de 2/255 de la construction actuelle.
- [ ] Temps jusqu'à la première image et poids mesurés ; gain consigné.
- [ ] Maquette absente ou périmée : construction actuelle, sans défaut visible ni texte technique.
- [ ] Aucun décodeur ni fichier chargé hors de nos origines (contrôle de L4-06).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 ; aucune lecture payante.

## Points d'attention
- La maquette, c'est la visite : elle est servie comme `plan.json`, seulement pour une visite débloquée, jamais pour un aperçu (décision n° 6, L5-28). Un fichier 3D prêt à l'emploi se réutilise dans n'importe quelle visionneuse : l'envoyer pour la visite payante est à confirmer par l'utilisateur, comme sa place dans l'export promis aux promoteurs (L10-09).
- Un décodeur en WebAssembly peut demander `'wasm-unsafe-eval'` dans la CSP de la visite (ARCHITECTURE.md § 6.2) : à mesurer.
- Faut-il encore envoyer `plan.json` en entier à côté de la maquette (la fiche et le plan 2D en ont besoin) ? À décider.
- Plusieurs niveaux : un groupe par niveau, comme la construction actuelle (`moteur/SCHEMA.md`) ; un groupe par pièce dans chaque niveau si L4-17 est fait, pour que le culling par portails serve.

## Références
- PLAN.md § 2.1 (décisions 6, 12, 14).
- moteur/SCHEMA.md ; outils/trajets.mjs ; ARCHITECTURE.md § 5.3, § 6.2 ; L4-06, L4-10, L4-13.

## Hors périmètre
- Éclairage : L4-13. Précalcul dans le service : L5-28. Culling par pièces : L4-17. Textures compressées : L4-18.
