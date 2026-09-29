# L4-17 · Ne dessiner que ce qu'on voit : maquette découpée par pièce et par niveau, culling par portails

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | L (3 à 5 j) | L1-15, L4-12 | `moteur/` [M] | En cours |

## Pourquoi
Demande de l'utilisateur du 27/09/2026, mot pour mot : « Il faut s'inspirer des jeux vidéos, des optimisations, différentes textures, ne pas charger ce qu'on ne voit pas etc.. non ? ». Réponse donnée et acceptée comme direction : oui (PLAN.md § 2.1, décision 13). Les détails techniques restent à mesurer.

Diagnostic du 27/09/2026 (L1-14), Mac M3 Retina : 16 à 18 i/s, 8 à 10 en marchant sur la duplex. Le goulot est le remplissage de pixels (occlusion ambiante GTAO en pleine résolution : 47 à 51 % du temps d'image ; MSAA 4× : 28 à 31 % ; rapport de pixels 1,75), pas la géométrie (environ 220 appels de dessin, 220 000 triangles). Trois constats empêchent pourtant d'écarter ce qu'on ne voit pas :
- les murs de tout l'appartement sont fusionnés en un seul maillage par matériau (`mergeGeometries`, `moteur/engine.js`) : le tri hors champ du navigateur (frustum culling) n'écarte rien ;
- 6 lampes projettent des ombres ; chacune redessine la scène 6 fois pour son cube d'ombre, même loin de la pièce où l'on se trouve ;
- sur la duplex, masquer l'autre niveau hors de la volée et de la trémie fait déjà gagner 12 %.

Les jeux vidéo en intérieur font ainsi : on dessine la pièce courante et ce qu'on voit par ses ouvertures (culling par portails).

## Avancement (28/09/2026 : implémentation, réception indépendante refusée, correction)
Non commité. Fichiers : `moteur/engine.js`, `moteur/controle.mjs`, `moteur/SCHEMA.md`, HISTORIQUE.md (« Ne dessiner que ce qu'on voit, matières »).

**Maquette découpée par pièce** :
- Cellules : une par pièce (sous-pièces rattachées), une par escalier (volée et trémie), plus « dehors ».
- Chaque triangle va aux cellules dont il touche l'air : un mur mitoyen donne une face à chaque pièce, l'embrasure d'une baie va aux deux côtés. Les faces horizontales sont testées contre le contour de chaque pièce, et les grands triangles sont aussi échantillonnés le long de leurs bords.
- L'air qu'aucune pièce ne couvre est rattaché aux pièces voisines, dans un rayon de 60 cm.
- Regroupement par matériau à l'intérieur de chaque pièce ; les morceaux de moins de 0,25 m² sont réunis entre eux.
- Contexte découpé en cases de 6 m.

**Culling par portails** :
- Portails : baies (portes fermées comprises, pour les jours autour du vantail), bords communs sans mur, volée et trémie, loggias vers dehors.
- À chaque image, depuis l'air autour de l'œil, de proche en proche. Chaque portail est recoupé avec le rectangle d'écran de la pièce d'où on le voit, et chaque objet est limité à son rectangle par des ciseaux.
- Miroirs parcourus depuis la caméra symétrique. Ciel non dessiné quand dehors n'est pas vu.
- Tout est dessiné en maquette, en plan, en rendu photoréaliste (culling coupé pendant sa préparation) et sous `?shoot=1`.

**Lampes** : une lampe passe à intensité nulle, carte d'ombre gelée, seulement si rien de ce qu'elle éclaire n'est vu. Elle reste allumée dans quatre cas :
- sa portée est vue (portée calculée au chargement par `lampReach`) ;
- une cellule au-delà des 12 m de son ombre est vue ;
- une vitre ou un miroir est vu ;
- sa pièce est vue ou voisine d'une pièce vue.
Les appliques sans ombre ne sont jamais éteintes.

**Ombres** : toujours calculées sur toute la maquette, dans une passe séparée qui utilise des maillages entiers réservés aux ombres (calque 2).

**Réglages propres à la visite** : seules les ampoules reçoivent l'ombre des lampes. Le verre et les cadres de miroir, qui recevaient les ombres, et l'ombre portée à 40 m, qui changeaient l'aspect sans accord, ont été retirés à la correction.

**Autres corrections** : sol du palier de l'immeuble abaissé de 2 mm (il perçait le sol du rangement du plan du lot) ; inventaire du culling refait en rendant d'abord tous les objets.

**Contrôles** (`moteur/controle.mjs`) :
- `visibilite` compare l'image avec culling à l'image sans. Il tourne dans une vraie visite, hors `?shoot=1`, de jour puis de nuit, lampes allumées. Vues :
  - arrêts × 8 directions, regard en bas et en haut ;
  - trajets entre arrêts, escaliers compris ; volées regardées en bas, en haut et en arrière ;
  - volets changés en cours de visite.
  Échec au-delà de 4 pixels après érosion 3×3.
- Nouveau test : rendu photoréaliste lancé en marchant.
- Les contrôles de faces superposées et de raccords comparent le maillage d'origine (`userData.lot`).

**Défauts de la réception corrigés** :
- duplex : lampes de l'étage éteintes alors que leur lumière passait par la trémie ou les fenêtres (jusqu'à 36 607 pixels ; 6 à 18 vues en échec sur 1 409 selon l'heure et les portes) ;
- scène amputée envoyée au rendu photoréaliste lancé en marchant (179 à 360 objets cachés) ;
- aspect de la visite changé sans accord (20 à 35 % des pixels des vues de loggia) ;
- ligne d'un pixel au bord de la trémie (193 à 214 pixels) ;
- mur vu par un renfoncement hors des pièces, coupé (T2 réassemblé, lecture base2 du 432 : 178 à 323 pixels).

## À faire
1. **Lampes** : après correction, elles restent allumées dans 95 à 100 % des vues (duplex 5,6 sur 6, T2 3 sur 3), donc leur culling ne rapporte presque plus rien. Pas de plafond du nombre de lampes à ombre actives. À revoir avec l'éclairage précalculé (L4-13).
2. **Fuites de lumière antérieures au ticket**, gardées pour que la visite reste identique aux photos : les lampes éclairent les vitres à travers les murs, et de nuit les abords et l'immeuble d'en face au-delà de 12 m. Les corriger change nettement l'aspect de nuit et les photos : décision de l'utilisateur (comparaison `scratchpad/jeux/corr/duo-dup-h21.5-loggia2-1.png`, dossier temporaire de la session).
3. **Refaire sur le moteur final** la campagne de visibilité en 1280×800 et la comparaison d'aspect (elles ont tourné avant les deux dernières retouches, qui ne font que dessiner davantage). Mesurer aussi le bruit de l'ancien moteur contre lui-même pour la comparaison d'aspect (0,2 à 0,4 % d'écart non attribué).
4. **Défauts trouvés en chemin, sans contrôle** (à transformer en contrôles automatiques, CLAUDE.md) :
   - T2 réassemblé : fente étroite entre l'huisserie et le mur de la niche du tableau électrique, dalle visible en bas, aussi avec l'ancien moteur. Avertissement « mur mj27 ouvert au droit de p_te » ;
   - points de trajet lissés à 5 cm d'un mur : le plan proche de la caméra traverse le mur (contrôle de navigation à prévoir) ;
   - palier de l'immeuble qui chevauche le rangement dans le `plan.json` du plan du lot : corrigé au rendu, pas dans la chaîne.
5. **Performances** :
   - téléphone émulé : palier 0 plus lent de 0,7 à 1,3 ms (appels de dessin doublés, culling de 0,5 à 0,8 ms par image au processeur ×4). À vérifier sur un vrai téléphone ;
   - rendu logiciel : 21 à 41 i/s en marche au palier le plus léger, 60 i/s non tenus. Levier suivant : L4-13 ;
   - mesurer le plan du lot, le 3124 et le témoin.
6. Le test « volets changés en cours de visite » ne peut pas échouer dans l'état actuel du moteur (garde-fou pour la suite).

## Critères d'acceptation
- [ ] Gain consigné au banc de L1-14 sur les 4 références, la duplex 3081-613 et le témoin s'il existe. Critère commun des optimisations inspirées des jeux vidéo : 60 i/s sur le profil « appareil modeste » simulé et sur le profil téléphone, pas seulement sur le Mac ; écart restant consigné, avec le levier suivant.
  - Consigné sur d201, T2 et duplex seulement (banc de L1-14 non écrit ; 2 passes en alternance).
  - Chiffres pour L4-17 et L4-18 ensemble, avant → après, dans l'ordre d201 / T2 / duplex.
  - Mac (1440×862, DPR 2) :
    - image pleine qualité : 64,3 / 59,5 / 60,5 → 61,9 / 58,4 / 64,3 ms ;
    - palier 0 : 14,7 / 14,6 / 16,4 → 15,1 / 13,6 / 17,8 ms ;
    - appels de dessin : 113 / 150 / 161 → 248 / 194 / 255 ;
    - triangles : 139 k / 144 k / 144 k → 35 k / 20 k / 29 k ;
    - rotation et marche : 56,6 à 60 i/s, dont une passe duplex à 56,6 i/s avec un à-coup de 175 ms.
  - Portable modeste simulé : palier 0 14,8 / 13,0 / 15,5 ms ; 60 i/s ; visite prête en 2,3 à 3,5 s au lieu de 4,9 à 5,5 s.
  - Téléphone émulé : palier 0 5,2 / 5,2 / 6,3 → 6,5 / 5,9 / 7,1 ms ; 60 i/s ; visite prête en 2,1 à 4,5 s au lieu de 4,7 à 5,5 s.
  - Rendu logiciel :
    - palier le plus léger : 198 / 169 / 246 → 99 / 78 / 130 ms ;
    - marche : 3,2 / 4,0 / 2,7 → 28,8 / 40,9 / 21,3 i/s ;
    - visite prête inchangée (17 à 34 s).
  - Recalcul des ombres : 903 / 622 / 1 543 → 729-904 / 420-623 / 806-1 544 appels de dessin.
  - Le GPU du M3 n'est pas ralenti par l'émulation. Sur GPU, la réception ne voit aucun gain d'image ; le gain de chargement vient surtout des textures réduites (L4-18). Levier suivant : L4-13.
- [x] Contrôle de visibilité réussi partout ; test négatif : un portail oublié le fait échouer.
  - `controle.mjs` : ok sur les 5 références, pire 0 pixel sur 696 à 2 210 vues.
  - Campagne 1280×800, 3 états de portes, jour et nuit : 0 vue en échec sur les 5 plans (1 032 à 5 151 comparaisons par plan et par heure).
  - Tests négatifs détectés :
    - fenêtres retirées des portails : 13 552 et 31 664 pixels ;
    - bords communs oubliés : 117 905 pixels (d201) ;
    - un tiers des portails retiré (réception) : 88 à 147 vues en échec sur 408 ;
    - ancienne règle des lampes : 51 588 pixels ;
    - rendu photoréaliste sans correctif : 277 objets cachés.
- [ ] Duplex : escalier monté et descendu sans niveau manquant ni lumière qui saute (cas du banc de L1-14).
  - Vues fixes d'escalier et de trémie (en avant, en arrière, en haut, en bas), jour et nuit : 0 vue en échec sur 1 717 par état de portes.
  - Parcours enchaîné sur la duplex (escalier monté à reculons, descendu en regardant en haut) : pas refait après correction. Avant correction : 1 échec sur 1 595 au téléphone émulé (ligne de la trémie, depuis corrigée) ; synthèse sur écran de bureau non relue.
  - Banc de L1-14 non écrit.
- [ ] Visite de contrôle réussie sur les 5 références ; photos à moins de 2/255 de la ligne de base (rejeu L1-02).
  - Contrôle ok sur les 5 références, en 18 à 35 s par plan au lieu de 17 à 23 s.
  - Photos au niveau du bruit de l'ancien moteur, pas sous 2/255 (non atteignable, même ancien contre ancien). Moyenne, pixels à plus de 16/255, écart maximal :
    - ancien contre ancien : d201 0,218 / 0,038 % / 66 ;
    - nouveau contre ancien : d201 0,220 / 0,041 % / 78 ; T2 0,254 / 0,065 % / 74 ; duplex 0,260 / 0,063 % / 89.
  - `finalise.sh` sur les 5 vrais plans : contrôle ok pour 4. Le d201 réassemblé a une fente dans l'Entrée, qui vient de la chaîne modifiée par une autre tâche et que l'ancien moteur montre aussi. Le `plan.json` d'avant a été remis.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1. Aucune lecture payante : tenu.

## Points d'attention
- Ordre : après les corrections en cours (L1-15, L4-12). Priorité P1 ; P0 avant la bêta fermée si les 60 i/s ne sont pas tenus après elles : à décider (PLAN.md § 2.2). Mesure du 28/09/2026 : 60 i/s tenus en émulation (GPU non ralenti), pas en rendu logiciel.
- Le goulot mesuré est le remplissage de pixels : le culling allège surtout les passes d'ombre et la marche sur la duplex. Gain réel à mesurer, jamais à promettre. Sur Mac, l'occlusion ambiante fait 36 à 40 ms des 57 à 63 ms d'une image à l'arrêt.
- L1-18 note, sur une lecture base2 du 432, un échec du culling sur le trajet loggia → séjour, en (7,32 ; 3,72), le long du vantail de la porte-fenêtre, extérieur non dessiné. La correction du 28/09/2026 annonce 0 pixel sur cette lecture : à recouper.
- La maquette compressée (L4-14) garde ce découpage : un groupe par pièce et par niveau dans le fichier exporté ; elle en tire le chargement progressif.
- L'éclairage précalculé (L4-13) doit remplacer les ombres calculées à chaque image : recaler le point 3 après lui.
- Pièce ouverte sur une autre sans porte (cuisine ouverte, séjour en L) : portail permanent. À valider plan par plan sur les plans fournis.

## Références
- PLAN.md § 2.1 (décisions 12, 13, 14) ; ARCHITECTURE.md § 1 (principe 13), § 2.6.
- moteur/engine.js (`mergeGeometries`, découpage en cellules, portails, `lampReach`, `shadowPass`, `reglagesVisite`, `cullRestore`, `startPT`, lampes à ombre, GTAO, `App.roomAt`) ; moteur/SCHEMA.md ; moteur/controle.mjs (`visibilite`) ; outils/trajets.mjs ; HISTORIQUE.md (28/09/2026) ; L1-14, L1-15, L1-18, L4-12, L4-14.

## Hors périmètre
- Textures et niveaux de détail : L4-18. Lumière précalculée : L4-13. Maquette compressée et chargement progressif : L4-14. Paliers de qualité par appareil : L4-12. Commandes et caméra : L1-15.
