# L4-18 · Textures compressées à plusieurs résolutions et niveaux de détail des équipements

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | L (3 à 5 j) | L1-11, L4-06, L4-12 | `moteur/` [M] | En cours |

## Pourquoi
Demande de l'utilisateur du 27/09/2026, mot pour mot : « Il faut s'inspirer des jeux vidéos, des optimisations, différentes textures, ne pas charger ce qu'on ne voit pas etc.. non ? ». Réponse donnée et acceptée comme direction : oui (PLAN.md § 2.1, décision 13). Les détails techniques restent à mesurer.

Aujourd'hui, les textures des matériaux sont générées au chargement par le navigateur, à partir de bruit procédural (`CanvasTexture`, `texFrom`, `moteur/engine.js`). Cela coûte du temps d'ouverture et de la mémoire, et tous les appareils reçoivent la même définition. Les équipements ont une seule version, de près comme de loin. Les jeux vidéo livrent des textures compressées pour la carte graphique, avec mipmaps et plusieurs résolutions, et des versions simplifiées des objets lointains (niveaux de détail).

## Avancement (28/09/2026 : implémentation, réception indépendante, correction)
Non commité. Fichiers : `moteur/matieres.js` (nouveau), `moteur/engine.js`, `moteur/controle.mjs`, HISTORIQUE.md (« Ne dessiner que ce qu'on voit, matières »).
- **Génération sortie du fil principal** : la génération procédurale actuelle tourne dans un module exécuté par 6 workers, par bandes de lignes. Repli dans la page si les workers manquent, ou après 20 s sans réponse (vérifié en coupant les workers : chargement en 22 s au lieu de ne jamais finir).
  - Mêmes pixels : 30 textures sur 30 identiques à l'octet près sous `?shoot=1` (d201, duplex ; vérifié aussi par la réception).
  - 0,28 à 0,43 s au lieu de 0,8 à 0,96 s sur Mac, et le fil principal reste libre.
- **Résolution selon l'appareil** : moitié sur écran tactile, sur un appareil annonçant 4 Go ou moins et en rendu logiciel ; pleine sous `?shoot=1`. `?matieres=0.5` ou `1` la force.
- **Anisotropie** : au maximum à l'arrêt, réduite en mouvement selon le palier de L4-12.
- **Écartés sur mesure** :
  - fichiers précalculés : 10,9 Mo en PNG sans perte, 0,8 Mo en WebP mais avec perte, donc pas identiques ;
  - KTX2/Basis : aucun encodeur disponible, transcodeur en WebAssembly (CSP), perte de qualité ;
  - niveaux de détail des équipements : gain nul. La géométrie fait 3 à 7 ms d'une image de 150 à 260 ms en rendu logiciel et 1,3 à 2,2 ms au téléphone. Les équipements visibles font 0 à 3 000 triangles sur 9 000 à 25 000.
- **Contrôle `matiere`** (`controle.mjs`) : aucune texture noire ni couleur uniforme, à pleine résolution et à la moitié.

## À faire
1. **Décider avec l'utilisateur** l'abandon des fichiers précalculés (KTX2/Basis, PNG, WebP) et des niveaux de détail, écartés sur mesure. Sinon, les reprendre avec un encodeur et une mesure de l'écart, qui doit rester sous 2/255 en `?shoot=1`.
2. **Netteté en résolution moitié** : la faire juger par l'utilisateur. Captures prêtes (parquet et salle de bain, Mac et téléphone, pleine résolution et moitié) dans le dossier temporaire de la session (`scratchpad/jeux/res/nettete`), à refaire sur le témoin quand il existe.
3. **Contrôle « texture chargée hors de nos origines »** : pas encore fait (avec L4-06).
4. **Mesures** au banc de L1-14 sur le plan du lot, le 3124 et le témoin. Temps de génération en profils émulés à remesurer : la limitation du processeur par Chrome ne semble pas ralentir les workers, donc le gain annoncé (4,1 à 6,1 s → 1 à 2,1 s) est probablement optimiste.
5. Choix de la résolution par les paliers de L4-12 quand ils existeront (aujourd'hui, règle fixe : écran tactile, mémoire, rendu logiciel).

## Critères d'acceptation
- [ ] Gain consigné (poids, première image, mémoire, i/s) sur les 4 références, la duplex 3081-613 et le témoin s'il existe. Critère commun des optimisations inspirées des jeux vidéo : 60 i/s sur le profil « appareil modeste » simulé et sur le profil téléphone ; écart restant consigné.
  - Consigné sur d201, T2 et duplex seulement.
  - Mémoire des textures : 98,9 → 24,7 Mo au téléphone et en rendu logiciel. La réception compte 130,9 → 32,7 Mo avec les mipmaps : même facteur 4. Inchangée sur Mac.
  - Mémoire GPU totale : téléphone 224-239 → 156-170 Mo ; rendu logiciel 375-428 → 307-360 Mo.
  - Visite prête (avec L4-17) : portable modeste simulé 4,9-5,5 → 2,3-3,5 s ; téléphone émulé 4,7-5,5 → 2,1-4,5 s ; Mac 1,5-2,2 → 1,35-2,2 s ; rendu logiciel inchangé.
  - i/s : voir L4-17. 60 i/s tenus en émulation (GPU non ralenti), pas en rendu logiciel.
  - Poids transféré : aucun fichier de texture, les textures restent générées.
- [ ] Visite de contrôle réussie en palier « haut » et en palier « bas » ; test négatif : une texture noire fait échouer le contrôle.
  - Contrôle ok sur les 5 références.
  - `matiere` vérifie les textures à pleine résolution et à la moitié. Pas de palier « bas » complet (L4-12).
  - Tests négatifs détectés : parquet noir en résolution réduite, peinture uniforme.
- [ ] Photos à moins de 2/255 de la ligne de base en mode `?shoot=1` (rejeu L1-02).
  - Textures identiques à l'octet près.
  - Photos au niveau du bruit de l'ancien moteur contre lui-même, qui dépasse déjà 2/255 (voir L4-17).
- [ ] Netteté des carrelages et des libellés en palier « bas » jugée avec l'utilisateur, sur captures du témoin.
- [ ] Aucun transcodeur ni fichier chargé hors de nos origines (contrôle de L4-06). Aucun transcodeur ajouté ; contrôle de L4-06 pas encore disponible.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1. Aucune lecture payante : tenu.

## Points d'attention
- Le titre parle de textures compressées. Après mesure, le premier jet garde la génération procédurale, en pleine résolution ou en moitié, sans fichier ni transcodeur.
- Ordre : après les corrections en cours (L1-15, L4-12). Priorité P1 ; P0 avant la bêta fermée si les 60 i/s ne sont pas tenus : à décider (PLAN.md § 2.2).
- Un transcodeur en WebAssembly peut demander `'wasm-unsafe-eval'` dans la CSP de la visite (ARCHITECTURE.md § 6.2), comme la maquette compressée (L4-14). Il n'y en a pas aujourd'hui.
- La version de base reste « simple, fidèle et très éclairée » : aucun matériau nouveau ici. Le réalisme reste une option payante (L13-05).
- L'anisotropie réduite en mouvement donne un léger saut de netteté des sols rasants au retour à l'arrêt (réception).

## Références
- PLAN.md § 2.1 (décisions 12, 13) ; ARCHITECTURE.md § 1 (principe 13), § 2.6, § 6.2 ; HISTORIQUE.md (28/09/2026).
- moteur/matieres.js ; moteur/engine.js (`texFrom`, `CanvasTexture`, équipements) ; moteur/controle.mjs (`matiere`) ; moteur/photos.mjs ; L1-11, L1-14, L4-06, L4-10, L4-12, L4-17.

## Hors périmètre
- Culling par pièces et maquette découpée : L4-17. Lumière précalculée : L4-13. Maquette compressée : L4-14. Matériaux réalistes : L13-05.
