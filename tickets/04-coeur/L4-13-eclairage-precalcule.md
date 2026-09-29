# L4-13 · Éclairage précalculé par le serveur : lumière peinte sur les murs et éclairage par pièce

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P2 | L (3 à 5 j) | L1-09, L1-11, L4-12 | `moteur/` [M] | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 14) : le précalcul côté serveur est validé. Il comprend l'éclairage précalculé et « peint » sur les murs, et l'éclairage par pièce. Aujourd'hui, le navigateur calcule lui-même les sondes de lumière de chaque pièce (caméra cube, plusieurs passes), les ombres et l'occlusion ambiante. C'est coûteux sur un appareil modeste (décision 12). Le serveur les calcule une fois, en SwiftShader (décision n° 4), et le navigateur les affiche. Le rendu en direct sur le serveur (streaming vidéo) est écarté pour son coût.

Demande de l'utilisateur du 27/09/2026, mot pour mot : « Il faut s'inspirer des jeux vidéos, des optimisations, différentes textures, ne pas charger ce qu'on ne voit pas etc.. non ? » (direction acceptée, décision 13). La lumière précalculée (lightmaps) des jeux vidéo, c'est ce ticket : elle remplace les ombres et l'occlusion ambiante calculées à chaque image. Diagnostic du 27/09/2026 (L1-14) : GTAO en pleine résolution = 47 à 51 % du temps d'image ; 6 lampes à ombre, qui redessinent chacune la scène 6 fois pour leur cube d'ombre.

Précision de l'utilisateur du 28/09/2026, mot pour mot : « Les lumières peuvent être fake sans soucis si c'est joli ». L'exactitude physique n'est pas exigée : éclairage simplifié ou précalculé (lumière peinte, ombrage d'ambiance précalculé, lampes sans ombre portée, éclairages d'appoint), choisi pour être beau, régulier et rapide, y compris sans carte graphique. Critères : aucune lumière qui apparaît ou disparaît en vue (défaut relevé le 28/09/2026 sur la duplex par la réception de L4-17), aucune pièce sombre, photos cohérentes avec la visite. La réception de L4-17 a mesuré en rendu logiciel 6 à 10 i/s au mieux : ce ticket est le levier suivant.

## Nouvelle direction du 29/09/2026 (retour R4)
Demande de l'utilisateur, mot pour mot : « je vois pas mal de bugs de lumière lors des visites 3D actuellement, il faut que ça soit fixé, une lumière simple, efficace, qui montre bien les murs et basta, pas besoin de calcul ou quoi que ce soit de trop complexe, peu voire pas de calcul je pense.. on doit bien voir et basta ! » Suite : « pouvoir activer on demand le mode ultra réaliste avec tout ce qu'on veut okay mais sur un bouton dans les settings avec tout le reste ».
- Fait le 29/09/2026 (non commité, `moteur/engine.js`) : rendu simple par défaut, sans aucun calcul qui dépende de la scène (ciel figé, environnement neutre, deux directionnelles fixes sans ombre ni reflet direct, tons Neutral) : chaque orientation de mur a sa valeur (161 à 207 sur 255 au D201), aucune fuite, aucun saut aux portes, aucune lampe qui s'allume en vue, la nuit ne change rien. L'ancien rendu est la case « Ultra réaliste ». Contrôles : bascule sans reste, nuit sans effet, pièces ni sombres ni brûlées, matières peintes lisibles et sans tache de reflet (`controle.mjs`).
- Conséquence pour ce ticket : la lumière par défaut n'a plus besoin de précalcul. Il ne vise plus que l'**ultra réaliste** (rendre l'option plus légère et plus belle) ou une version « simple mais peinte » (ombrage d'ambiance dans les angles) si l'utilisateur la demande. Priorité abaissée à P2 en attendant son avis : à confirmer.

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
