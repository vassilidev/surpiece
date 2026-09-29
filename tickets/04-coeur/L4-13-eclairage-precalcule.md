# L4-13 · Éclairage précalculé par le serveur : lumière peinte sur les murs et éclairage par pièce

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | L (3 à 5 j) | L1-09, L1-11, L4-12 | `moteur/` [M] | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 14) : le précalcul côté serveur est validé. Il comprend l'éclairage précalculé et « peint » sur les murs, et l'éclairage par pièce. Aujourd'hui, le navigateur calcule lui-même les sondes de lumière de chaque pièce (caméra cube, plusieurs passes), les ombres et l'occlusion ambiante. C'est coûteux sur un appareil modeste (décision 12). Le serveur les calcule une fois, en SwiftShader (décision n° 4), et le navigateur les affiche. Le rendu en direct sur le serveur (streaming vidéo) est écarté pour son coût.

Demande de l'utilisateur du 27/09/2026, mot pour mot : « Il faut s'inspirer des jeux vidéos, des optimisations, différentes textures, ne pas charger ce qu'on ne voit pas etc.. non ? » (direction acceptée, décision 13). La lumière précalculée (lightmaps) des jeux vidéo, c'est ce ticket : elle remplace les ombres et l'occlusion ambiante calculées à chaque image. Diagnostic du 27/09/2026 (L1-14) : GTAO en pleine résolution = 47 à 51 % du temps d'image ; 6 lampes à ombre, qui redessinent chacune la scène 6 fois pour leur cube d'ombre.

Précision de l'utilisateur du 28/09/2026, mot pour mot : « Les lumières peuvent être fake sans soucis si c'est joli ». L'exactitude physique n'est pas exigée : éclairage simplifié ou précalculé (lumière peinte, ombrage d'ambiance précalculé, lampes sans ombre portée, éclairages d'appoint), choisi pour être beau, régulier et rapide, y compris sans carte graphique. Critères : aucune lumière qui apparaît ou disparaît en vue (défaut relevé le 28/09/2026 sur la duplex par la réception de L4-17), aucune pièce sombre, photos cohérentes avec la visite. La réception de L4-17 a mesuré en rendu logiciel 6 à 10 i/s au mieux : ce ticket est le levier suivant.

## Nouvelle direction du 29/09/2026 (retour R4)
Demande de l'utilisateur, mot pour mot : « je vois pas mal de bugs de lumière lors des visites 3D actuellement, il faut que ça soit fixé, une lumière simple, efficace, qui montre bien les murs et basta, pas besoin de calcul ou quoi que ce soit de trop complexe, peu voire pas de calcul je pense.. on doit bien voir et basta ! » Suite : « pouvoir activer on demand le mode ultra réaliste avec tout ce qu'on veut okay mais sur un bouton dans les settings avec tout le reste ».
- Fait le 29/09/2026 (non commité, `moteur/engine.js`) : rendu simple par défaut, sans aucun calcul qui dépende de la scène (ciel figé, environnement neutre, deux directionnelles fixes sans ombre ni reflet direct, tons Neutral) : chaque orientation de mur a sa valeur (161 à 207 sur 255 au D201), aucune fuite, aucun saut aux portes, aucune lampe qui s'allume en vue, la nuit ne change rien. L'ancien rendu est la case « Ultra réaliste ». Contrôles : bascule sans reste, nuit sans effet, pièces ni sombres ni brûlées, matières peintes lisibles et sans tache de reflet (`controle.mjs`).
- Conséquence pour ce ticket : la lumière par défaut n'a plus besoin de précalcul. Il ne vise plus que l'**ultra réaliste** (rendre l'option plus légère et plus belle) ou une version « simple mais peinte » (ombrage d'ambiance dans les angles) si l'utilisateur la demande. Priorité abaissée à P2 en attendant son avis : à confirmer.

## Nouvelle direction du 29/09/2026 (soir) : ultra réaliste premium
Demande de l'utilisateur, mot pour mot : « L4-13 oui effectivement, ce mode-là doit être propre et fonctionnel et ultra qualitatif, si la personne paye on doit la mettre ultra bien. matière et lumière réaliste, paysage, ciel.. tu vois ? on peut faire des textures comme les jeux avec différents niveaux selon la distance etc afin d'optimiser, il faut se dire ça ! » Priorité remontée à P1.

Plan retenu (étude du 29/09/2026), étapes livrées une à une, chacune avec contrôle automatique, banc de L1-14 et réception indépendante :
- **E1 · Matières hybrides** : pose procédurale gardée (fidèle au plan), remplie d'échantillons scannés CC0 (Poly Haven, ambientCG) étalonnés sur l'albédo actuel ; sources non versionnées (`moteur/matieres/SOURCES.json`, empreintes), fichiers dérivés servis depuis nos origines.
- **E2 · Reflets par pièce stables** : cube de reflet par pièce projeté sur sa boîte, matière clonée par cellule ; plus de saut de `scene.environment` aux portes.
- **E3 · Volume d'éclairage cuit par le serveur** (`moteur/precalcul.mjs`) : sondes L1 sur grille de 20 cm, rebonds, ciel, soleil par heure et saison, lampes de nuit, occlusion ; empreinte du `plan.json`, repli sur le calcul actuel.
- **E4 · Soleil** : carte d'ombre au palier haut, soleil analytique par les baies aux autres paliers.
- **E5 · Ciel et paysage** : ciel Preetham (`Sky.js` r180 vendorisé), nuages fixes, brume en hauteur, horizon, arbres en imposteurs.
- **E6 · Textures « comme les jeux »** : KTX2 natif (BC7 ordinateur, ASTC téléphone, ETC2) avec mipmaps, 512 → 1K → 2K en fondu selon le palier ; repli WebP.
- **E7 · Photos et 360° au même rendu.**

Décisions de l'utilisateur (29/09/2026, soir) : photos et 360° suivent le nouveau rendu (nouvelles références à lui faire approuver) ; nord non lu : soleil indicatif choisi pour être joli, avec la mention « ensoleillement indicatif » ; textures GPU en KTX2 natif, CSP inchangée (pas de Basis ni de `'wasm-unsafe-eval'`).

## E1, préparation (29/09/2026)
Non commité ; moteur non modifié. Outil `outils/matieres_pbr.py` : sources dans `.cache/matieres/` (non versionné, 273 Mo), vérifiées par SHA-256 (`moteur/matieres/SOURCES.json`) ; fichiers `moteur/matieres/<clé>-{512,1024,2048}-cr.webp` (albédo sRGB + rugosité en alpha, avec perte q90) et `-n.webp` (normale OpenGL, sans perte) ; `INDEX.json` (fichiers, répétition en mètres, albédo mesuré, cible, ΔE). Cible : moyenne de la texture procédurale actuelle (`matieres.js` exécuté par Node) sur ses seules surfaces, teinte par lame ou carreau retirée ; teintes des matériaux inchangées.
- **Sources (toutes CC0-1.0, licences vérifiées sur polyhaven.com/license et docs.ambientcg.com/license)** : chêne `oak_veneer_01` (Poly Haven, 1,83 m) ; grès `Marble026` (ambientCG, scan multi-angle, taille non publiée : 1 m estimé) ; loggia et dalles `granular_concrete` (Poly Haven, 2,4 m) ; pavés `concrete_floor_01` (Poly Haven, 2 m) ; peinture `painted_plaster_wall` (Poly Haven, 2 m) ; enduit et façade `plastered_wall` (Poly Haven, 2 m) ; gazon `Ground037` (ambientCG, photogrammétrie, 2,1 m).
- **Non couvertes** : faïence (aucun émail blanc scanné : les Porcelain d'ambientCG sont procédurales), inox et chrome (aucun inox brossé scanné), portes (laquées, sans bois), feuillage (E5), asphalte (absent du moteur).
- **ΔE2000 de l'albédo moyen** : 0,06 à 0,56 en 2048, au plus 1,08 en 1024 ou 512 (cible ≤ 3). Hybride simulé, joints compris, contre l'actuel : 0,09 à 1,10.
- **Poids** : 64,2 Mo en 2048, 15,5 Mo en 1024, 3,4 Mo en 512 (9 matières ; normales partagées par source). Les normales sans perte font 70 à 85 % du poids ; rugosité lissée d'1 px et quantifiée sur 64 niveaux (alpha du chêne : 3,3 → 1 Mo).
- **Temps de l'outil** : 73 s (sources déjà en cache), 99 s au premier passage avec téléchargement.
- **Planches** (procédural actuel, remplissage seul, hybride simulé, même échelle en mètres) : dossier temporaire de la session, `scratchpad/matieres/planches/`.
- **Reste** : intégration moteur en ultra réaliste seulement (chargement par `ImageBitmapLoader` sans prémultiplication, rugosité lue dans l'alpha, pose procédurale remplie avec un décalage par lame ou carreau, échelle de normale à régler, repli procédural) ; contrôle `matiere` étendu (fichier chargé, ni noir ni uniforme, ΔE) et contrôle `origines` (aucune texture hors de nos origines) ; juger avec l'utilisateur le grès (échelle estimée), la répétition du gazon à 2,1 m et le relief de la peinture ; poids en 2048 à réduire en E6 (KTX2).

## Fait le 29/09/2026 : occlusion ambiante précalculée (ultra réaliste)
Retour de l'acquéreur : en ultra réaliste, « les lumières sur les murs clignotent ». Champ de distance aux surfaces (`moteur/ao.js`, dans le navigateur, en worker) lu dans les matières : même ombrage à l'arrêt et en mouvement, GTAO retiré de la visite (gardé pour les photos et les 360°). Halo gardé et identique à tous les paliers. Contrôle `sautMouvement`. Détails : HISTORIQUE.md (29/09/2026, après-midi). Reste : calcul côté serveur (fichier livré avec `plan.json`), lumière peinte, sondes précalculées.

## À faire
1. **Prototype sur le témoin.** Deux voies à comparer, puis choix écrit avec l'utilisateur. Elles peuvent se cumuler :
   - (a) sondes et harmoniques sphériques de chaque pièce, calculées par le serveur et livrées dans un fichier à côté de `plan.json` ;
   - (b) éclairage « peint » sur les murs, sols et plafonds (textures de lumière).
2. **Outil `moteur/precalcul.mjs`** (nouveau, sur le modèle de `photos.mjs`, avec `moteur/chrome.mjs` de L1-09) : il charge la visite en palier « haut » (L4-12), calcule, et écrit `eclairage/` dans le dossier du plan. Le rendu est choisi par `RENDU_CHROME` : SwiftShader par défaut, Metal en local.
3. **Moteur** : si les fichiers précalculés existent et correspondent au `plan.json` (empreinte), il les charge au lieu de calculer, et coupe les ombres et l'occlusion ambiante calculées à chaque image (ce qui reste en direct : à mesurer). Sinon, calcul actuel, sans erreur visible.
4. **Plusieurs niveaux** : un éclairage par niveau, escalier et trémie compris.
5. **Mesures en SwiftShader et en Metal** : durée du précalcul, poids des fichiers, gain d'i/s sur le profil « appareil modeste » (L1-14).
6. **Contrôles automatiques** : pièce sans éclairage précalculé, texture de lumière noire ou tachée (luminance par face), empreinte périmée : chacun fait échouer la visite de contrôle.

## Critères d'acceptation
- [ ] Choix de la voie consigné, avec les mesures.
- [ ] Témoin, 4 références et duplex 3081-613 : visite de contrôle réussie avec l'éclairage précalculé ; aucune texture noire.
- [ ] Le rendu change : nouvelles images de référence approuvées explicitement par l'utilisateur (L1-11). Ensuite, écart d'au plus 2/255.
- [ ] Gain d'i/s mesuré sur le profil « appareil modeste ». Critère commun des optimisations inspirées des jeux vidéo : 60 i/s sur le profil « appareil modeste » simulé (processeur ralenti ×4, écran non Retina) et sur le profil téléphone ; écart restant consigné.
- [ ] `plan.json` modifié sans nouveau précalcul : le moteur recalcule en direct, sans défaut visible (test).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 ; aucune lecture payante.

## Points d'attention
- La version de base reste « simple, fidèle et très éclairée » (CLAUDE.md). Le réalisme reste une option payante (L13-05).
- Durée du précalcul en SwiftShader inconnue. Si elle est trop longue pour la VM, garder la voie (a) seule. Sa place dans la chaîne en ligne est réglée par L5-28.
- Toute réparation après la visite de contrôle (`repare_moteur`) change `plan.json` : refaire le précalcul, ou le faire après la dernière réparation (L5-28).
- Demande du 27/09/2026 : photos (`?shoot=1`) et contrôles inchangés par les optimisations. Les images changent ici (critère ci-dessus) : en mode `?shoot=1`, garder les ombres et l'occlusion ambiante calculées en direct, ou faire approuver l'écart par l'utilisateur : à décider au vu du prototype.
- Priorité P1, à confirmer au vu du diagnostic de L1-14 : P0 avant la bêta fermée ou P1 après, à décider.

## Références
- PLAN.md § 2.1 (décisions 4, 12, 14) ; ARCHITECTURE.md § 3 D3.
- moteur/engine.js (ombres, sondes de lumière, occlusion ambiante) ; moteur/photos.mjs ; L1-09, L1-11, L1-14, L4-12.

## Hors périmètre
- Maquette compressée et itinéraires : L4-14. Culling par pièces : L4-17. Textures compressées : L4-18. Précalcul dans le service : L5-28. Réalisme : L13-05.
