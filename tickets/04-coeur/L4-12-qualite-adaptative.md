# L4-12 · Qualité adaptative du moteur : textures, résolution, effets

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-14, L1-15 | `moteur/` [M] | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 13) : la qualité adaptative est validée (textures, résolution, effets). Elle doit garder la visite fluide sur un appareil modeste (décision 12). Aujourd'hui, le moteur ne distingue qu'`App.coarse` (écran tactile) : rapport de pixels plafonné (`moteur/engine.js:37`), ombres et sondes de lumière plus petites, occlusion ambiante coupée (`ao: !App.coarse`, `moteur/ui.js`). Les autres effets tournent sur tous les appareils. L4-10 ne prévoyait d'y toucher « que si les mesures le justifient » : c'est désormais une décision. Diagnostic du 27/09/2026 (L1-14), Mac M3 Retina : 16 à 18 i/s ; le goulot est le remplissage de pixels (GTAO en pleine résolution : 47 à 51 % du temps d'image, MSAA 4× : 28 à 31 %, rapport de pixels 1,75), pas la géométrie.

## Avancement (27 et 28/09/2026, avec L1-15 et L4-18)
Non commité, dans `moteur/engine.js` et `moteur/matieres.js`. Le mode `?shoot=1` (photos, contrôle) garde la chaîne pleine qualité et les textures pleine résolution.

**Qualité en mouvement** (fait avec L1-15) :
- L'image à l'arrêt garde la chaîne pleine qualité, inchangée. Elle revient 180 ms après le dernier mouvement.
- En mouvement, des chaînes préallouées, une par rapport de pixels et MSAA. Paliers : rapport de pixels, MSAA, bloom. L'occlusion ambiante est retirée des images de mouvement : en demi-résolution, elle faisait des artefacts sombres.
- Régulateur :
  - il vise la cadence réelle de l'écran, travaille sur la médiane des derniers temps d'image et descend à 3 images manquées sur 30 ;
  - il ne remonte qu'après 1,5 s de mouvement fluide ;
  - le palier est gardé dans le navigateur (`visite.qualite-mouvement.2`), et les paliers voisins sont préparés à l'arrêt ;
  - une barrière GPU limite la file d'images.
- Anisotropie au maximum à l'arrêt, réduite en mouvement selon le palier (8, 4, 4, 2, 2, 1).

**Choix au démarrage** (fait avec L4-18) :
- textures en résolution moitié sur écran tactile, sur un appareil annonçant 4 Go ou moins, et en rendu logiciel ;
- en rendu logiciel sans palier mémorisé, départ au palier le plus léger (avant, il restait au palier 0 à 3 ou 4 i/s) ;
- `?matieres=0.5` ou `1` force la résolution des textures.

## Lumière simple par défaut (29/09/2026, retour R4)
Demande de l'utilisateur, mot pour mot : « je vois pas mal de bugs de lumière lors des visites 3D actuellement, il faut que ça soit fixé, une lumière simple, efficace, qui montre bien les murs et basta, pas besoin de calcul ou quoi que ce soit de trop complexe, peu voire pas de calcul je pense.. on doit bien voir et basta ! » L'ultra réaliste reste « on demand », sur une case des réglages.
- Fait (non commité) : rendu simple par défaut en visite et en maquette, sans ombre, occlusion ambiante, sonde, exposition automatique, bloom ni lampe calculée ; l'ancien rendu complet devient « Ultra réaliste » (case des Réglages). Photos, 360° et `?shoot=1` restent en ultra réaliste, inchangés.
- Temps d'image mesuré le 29/09/2026 (Mac M3, 1 280 × 800, séjour, image pleine qualité) : 1,7 ms en simple contre 12,2 à 12,9 ms en ultra réaliste (D201 et duplex), soit environ 7 fois moins. Les paliers ci-dessous ne concernent plus que l'ultra réaliste ; en simple, seuls restent le rapport de pixels, le MSAA et la taille des textures.
- Vérification indépendante du 29/09/2026 : porte palière presque noire en simple (45 à 52 sur 255, 124 sur les photos) et tache blanche de reflet de la lumière d'appoint sur les surfaces lisses (246 sur 255, entrée du 3124), corrigées ; contrôles `matieresSimple` de `controle.mjs`, vérifiés en remettant chaque défaut.

## À faire
0. **Recaler ce ticket sur la lumière simple** : paliers et seuils de L1-14 mesurés d'abord en simple (le rendu par défaut), l'ultra réaliste n'étant qu'une option lourde assumée (« plus lourd » écrit sur la case).
1. **Paliers de qualité de l'image à l'arrêt** (proposition : haut, moyen, bas), écrits dans `moteur/QUALITE.md` (nouveau, pas encore écrit). Chaque palier fixe : rapport de pixels, taille des textures, taille des ombres, occlusion ambiante, bloom, reflets, sondes de lumière. Valeurs fixées sur les mesures du banc de L1-14. Les paliers de mouvement existants y sont décrits. Coût mesuré de l'image à l'arrêt :
   - Mac : 55 à 67 ms, dont 36 à 40 ms d'occlusion ambiante ;
   - portable modeste simulé : 31 à 33 ms ;
   - téléphone émulé : 7 à 9 ms.
2. **Choix du palier** au démarrage d'après la mémoire annoncée, les cœurs, l'écran tactile, la taille d'écran et le moteur WebGL relevé : fait pour les textures seulement. Il reste l'image à l'arrêt et les effets.
3. **Palier forcé** par `App.set('qualite', …)` et par l'adresse (`?qualite=`), pour les tests : pas encore fait (seul `?matieres=` existe). Les captures du serveur (`controle.mjs`, `photos.mjs`, panoramas de L4-15) restent en pleine qualité.
4. **Rien ne disparaît** : aucun palier ne retire un élément de la visite (mur, équipement, texte, garde-corps). Il ne change que la définition et les effets. Zéro défaut visible : pas de texture noire, pas de trou d'ombre, pas de pièce sans lumière, pas de scintillement au changement de palier. Déjà vu : saut léger de netteté des sols rasants au retour à l'arrêt, dû à l'anisotropie réduite en mouvement.
5. **Contrôle automatique** : la visite de contrôle en palier « bas » en plus du palier « haut ». Existe déjà dans `controle.mjs` :
   - régulateur : pas de baisse à 30 i/s, baisse quand une image sur deux est manquée, pas de baisse à 120 Hz ;
   - `matiere` : textures à pleine résolution et à la moitié.
   Le banc de L1-14 vérifie ses seuils avec l'adaptation active (processeur ralenti ×4 : le palier descend et les i/s repassent au-dessus du seuil).
6. Essai sur de vrais appareils modestes. Mémoire GPU des chaînes de mouvement gardées (jusqu'à environ 5 sur écran Retina) à mesurer sur un GPU à mémoire partagée.

## Critères d'acceptation
- [ ] Profil « appareil modeste » de L1-14 : seuils tenus, adaptation active, sur les références et le témoin s'il existe. Seuils non décidés.
  - Portable simulé (1920×1080, DPR 1, processeur ×4) : 60 i/s, p50 16,7 ms, p95 ≤ 16,8 ms, max ≤ 33,4 ms, paliers retenus 0 à 1, sur d201, T2 et duplex.
  - Stress à processeur ×12 : 58 à 59 i/s, avec une image à 100 ms sur l'escalier (mesure de l'implémentation, avant la correction).
  - Le GPU du M3 n'est pas ralenti par l'émulation. Aucun appareil réel essayé.
- [ ] Visite de contrôle réussie en palier « haut » et en palier « bas » : 4 références, duplex 3081-613, témoin. Contrôle ok sur les 5 références en pleine qualité. En palier bas, seules les textures sont contrôlées (`matiere`).
- [ ] Photos à moins de 2/255 de la ligne de base, palier « haut » forcé. Non atteignable : l'ancien moteur contre lui-même dépasse déjà 2/255 sur 4,3 % des pixels. Nouveau contre ancien : au niveau de ce bruit (≤ 4,22 %).
- [ ] Changement de palier en marche : aucune image noire, aucun texte technique (capture et contrôle des textes de L1-04).
  - Aucune image noire dans les scénarios réels de la réception de L4-17 (804 et 790 comparaisons sur d201 et T2).
  - Artefacts sombres du palier bas et survol en palier bas corrigés.
  - Contrôle des textes (L1-04) pas encore disponible.
- [ ] Matrice de L4-10 refaite, i/s notées par appareil.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1. Aucune lecture payante : tenu.

## Points d'attention
- Réglage manuel visible par l'utilisateur, ou tout automatique : à décider. Aujourd'hui, tout est automatique.
- Le lancer de rayons n'est pas concerné : il est masqué en mode simple (L4-11).
- L'éclairage précalculé (L4-13) et la maquette compressée (L4-14) allègent encore le navigateur : recaler les paliers après eux.
- Textures des matériaux : juger avec l'utilisateur, sur captures, la netteté des carrelages et des libellés en palier « bas ». Captures en résolution moitié prêtes dans le dossier temporaire de la session (`scratchpad/jeux/res/nettete`), pas encore montrées.
- Les caractéristiques de l'appareil ne partent jamais chez un tiers ; au plus une classe sans identifiant, si la mesure en production est décidée (L7-04, SUIVI.md).
- Le point 7 de L4-10 (réglages pour les petits appareils) est absorbé ici.
- Décision 13 : L4-17 et L4-18 sont implémentés en premier jet (28/09/2026). Pas de fichiers de textures précalculés : L4-18 génère les textures au chargement, en pleine résolution ou en moitié. Critère commun : 60 i/s sur le profil « appareil modeste » simulé (processeur ralenti ×4, écran non Retina) et sur le profil téléphone. Il est tenu en émulation, pas en rendu logiciel (21 à 41 i/s au palier le plus léger).

## Références
- PLAN.md § 2.1 (décisions 12 et 13) ; ARCHITECTURE.md § 1 (principe 13) ; HISTORIQUE.md (27 et 28/09/2026).
- moteur/engine.js:37 (rapport de pixels), régulateur (`aq*`), chaînes de mouvement, barrière GPU, ombres, sondes de lumière, occlusion ambiante ; moteur/matieres.js ; moteur/ui.js (`ao`) ; moteur/controle.mjs (régulateur, `matiere`) ; moteur/photos.mjs ; L1-14, L1-15, L4-10, L4-18.

## Hors périmètre
- Commandes et caméra : L1-15. Précalcul : L4-13, L4-14. Culling par pièces : L4-17. Textures compressées et niveaux de détail : L4-18. Repli sans WebGL : L4-10. Lumière réelle et réalisme : L13-05.
