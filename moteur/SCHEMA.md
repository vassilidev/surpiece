# Format plan.json

Un logement décrit en mètres. Le moteur (`moteur/engine.js`) en tire le plan 2D, la maquette 3D, la visite et les photos. Rien n'est codé en dur pour un logement particulier.

## Repère

- `x` vers la droite du plan, `z` vers le bas du plan, `y` vers le haut. Mètres, 3 décimales au plus.
- Sol fini de l'appartement à `y = 0`, plafond à `H` (2,50 par défaut).
- Un point s'écrit `[x, z]`. Un polygone est une liste de points, sans répéter le premier.

## Murs : `walls`

Chaque mur est un rectangle défini par une ligne de référence (une de ses deux faces) et une épaisseur.

```json
{ "id": "sud", "k": "beton", "a": [0, 6.13], "b": [4.26, 6.13], "t": 0.34, "side": 1, "ext": true, "open": ["Fch"] }
```

- `k` : `beton` (voile porteur, noir sur le plan), `doublage` (isolant collé au voile, noir ou hachuré), `cloison` (cloison intérieure, double trait blanc).
- `a`, `b` : extrémités de la ligne de référence. Pour un mur de façade, la ligne de référence est la face intérieure.
- `t` : épaisseur totale en mètres.
- `side` : de quel côté de la ligne l'épaisseur s'étend. On note `u` la direction de `a` vers `b` et `n = (−u.z, u.x)` sa normale gauche. `side: 1` met l'épaisseur du côté `+n`, `side: -1` du côté `−n`. Exemples : ligne vers l'est (`u = (1,0)`, `n = (0,1)`) avec `side: 1`, le mur s'étend vers le bas du plan. Ligne vers le bas (`u = (0,1)`, `n = (−1,0)`) avec `side: 1`, il s'étend vers la gauche.
- `ext` : `true` si la face opposée à la ligne de référence est à l'extérieur (façade, loggia).
- `open` : ouvertures portées par ce mur en plus de celles dont il est le mur principal (utile quand une fenêtre traverse un voile et son doublage décrits séparément).
- Un mur en biais se décrit de la même façon, `a` et `b` suivent la pente.
- Les murs peuvent se chevaucher aux angles. Ils doivent fermer les pièces sans laisser de fente.
- Mur polygonal : `{ "id": "mb3", "k": "beton", "poly": [[x, z], ...] }`. Le polygone doit être **convexe** (le moteur ne sait heurter que des polygones convexes). La chaîne (`pipeline/murs.py`) soude les aplats du plan en une masse, la limite au logement, referme les fentes de moins de 26 cm le long des pièces, l'équerre, l'ouvre au droit des baies, puis la découpe en morceaux convexes. `suppose: true` marque un mur ajouté pour fermer un bord de pièce resté ouvert.

## Gaines : `gaines`

Coffres techniques pleins du sol au plafond : `{ "id": "g1", "poly": [[..],[..],[..],[..]], "label": "VH", "style": "conduit" }`. `style` est optionnel (`conduit` pour un conduit bordé de noir, sinon gaine hachurée).

## Ouvertures : `openings`

Objet indexé par identifiant.

```json
"ch":  { "kind": "door", "wall": "clChN", "s": [0.14, 1.07], "sill": 0, "head": 2.08, "hinge": "s0", "swing": -1, "label": "Chambre" },
"PF":  { "kind": "french", "wall": "sudSal", "s": [0.99, 2.99], "sill": 0, "head": 2.20, "leaves": 2, "frame": [-0.025, 0.05], "vr": true, "depth": 0.39, "seuil": 0.02, "label": "PF · VR" },
"Fch": { "kind": "window", "wall": "sudChD", "s": [1.545, 2.945], "sill": 0.60, "head": 2.20, "leaves": 2, "frame": [-0.02, 0.05], "bso": true, "gc": [0.215, 0.265], "depth": 0.34, "label": "F · BSO" }
```

- `kind` : `entry` (porte palière), `door` (porte intérieure), `window` (fenêtre sur allège), `french` (porte-fenêtre).
- `wall` : mur principal. `s` : début et fin de l'ouverture, en mètres le long de la ligne de référence de ce mur, depuis `a`. Largeur de la baie brute, jambages compris.
- `sill` : hauteur d'allège (0 pour une porte ou une porte-fenêtre). `head` : hauteur de linteau.
- Portes : `hinge` `s0` ou `s1`, extrémité qui porte les paumelles. `swing` `1` si le vantail s'ouvre du côté de l'épaisseur (`side × n`), `-1` de l'autre côté. `jamb` optionnel (épaisseur de huisserie, 0,04 par défaut). `closed: true` pour une porte fermée par défaut (placard technique, salle d'eau qui gênerait le passage).
- Fenêtres et portes-fenêtres : ouvrent toujours vers l'intérieur. `leaves` 1 ou 2. `frame` : position de la menuiserie dans l'épaisseur, `[d0, d1]` depuis la ligne de référence vers l'extérieur. `depth` : épaisseur totale à traverser (voile et doublage). `bso`, `vr` (volet roulant), `gc` (garde-corps dans le tableau, `[d0, d1]`), `seuil` (hauteur du seuil). `fixe` : `[a, b]`, partie vitrée fixe (châssis sans ouvrant, sans arc en 2D) de `a` à `b` mètres depuis le début de la baie, contre l'un des jambages ; `leaves` compte alors les seuls vantaux ouvrants (lus sur l'arc du plan vectoriel).
- `allege` (fenêtre) : fenêtre à allège vitrée, haut de la partie basse vitrée fixe (1,00 par défaut) ; traverse, vitrages fixes dessous, vantaux ouvrants au-dessus, obstacle sur toute la partie fixe. La chaîne le pose quand la légende du plan dit « allège vitrée » pour le sigle de la baie (un sigle ne vaut que par la légende de son plan : FA = « fenêtre sur allège » ailleurs).

## Pièces : `rooms`

```json
{ "id": "chambre", "name": "Chambre", "area": "11,9", "poly": [[0.14, 3.24], [4.26, 3.24], [4.26, 6.13], [0.14, 6.13]], "label": [2.2, 4.55], "floor": "dry" }
```

- `poly` : contour intérieur, au nu des murs. Les pièces ne se chevauchent pas. Une pièce ouverte sur une autre (entrée dans le séjour) partage un bord avec elle.
- `area` : surface du tableau du promoteur, texte avec virgule. `areaNote` si la pièce est comptée ailleurs (« comprise dans le séjour »), et `inclut: ["entree", "placard"]` sur la pièce qui la compte. Les gaines situées dans une pièce sont déduites de sa surface.
- `floor` : `dry` (parquet), `wet` (carrelage), `loggia` (dalles extérieures).
- `ext: true` ou `floor: "loggia"` pour une loggia, un balcon ou une terrasse, quel que soit l'`id`. `hidden: true` pour un placard ou un seuil. `small: true` pour une étiquette discrète.
- `soffite: {part, y, poly?}` (calculé par la chaîne, `murs.soffites`) : part de la pièce hachurée comme soffite ou faux plafond par la légende, hauteur écrite (`y`, sinon `null`). Le plan 2D et la visite écrivent « plafond 2,20 m » (pièce entière) ou « soffite 2,20 m » (en partie), « faux plafond » sans hauteur, jamais la hauteur générale. `poly` (pièce entière, hauteur connue, aucune baie plus haute) : plafond abaissé dans la maquette, lampe à sa hauteur.
- `label` : point `[x, z]` où écrire le nom, utile pour une pièce en L (la chaîne y met le pôle d'inaccessibilité quand le centroïde tombe hors de la pièce).
- Seuils de porte : petites pièces cachées qui comblent l'épaisseur du mur sous chaque porte intérieure, avec `"of": "<pièce>"`. Sans elles, la visite ne peut pas passer la porte. La marche tolère 4 cm d'écart entre un seuil et sa pièce.

## Équipements : `fixtures`

- `{ "type": "shower", "x": [x0, x1], "z": [z0, z1], "drain": [x, z], "valve": { "wall": [x, z], "dir": [0, 1] } }`
- `{ "type": "bath", "x": [..], "z": [..] }` ; `tap` (`x0`, `x1`, `z0` ou `z1`) : petit côté de la robinetterie, lu sur le repère « + » du plan (par défaut `x0` ou `z0`).
- `{ "type": "wc", "p": [x, z], "dir": [dx, dz] }` : `p` au milieu du bord du réservoir collé au mur, `dir` du mur vers la cuvette.
- `{ "type": "vanity", "x": [..], "z": [..], "dir": [dx, dz] }` : meuble vasque, `dir` vers l'usager.
- `{ "type": "towel", "x": [..], "z": [..], "dir": [dx, dz] }` : sèche-serviettes.
- `{ "type": "tableau", "x": [..], "z": [..] }` : tableau électrique (gaine technique logement). Le coffret se pose contre le fond de la niche, face au seul côté ouvert sur une pièce ; contre la face `z[0]` si ce côté n'est pas unique. `facade: "n"|"s"|"e"|"w"` (chaîne) : côté ouvert sur la pièce, façade du coffret en trait fin sur le plan (D201) ; sinon une porte (`label` « Tableau électrique », fermée) ferme la niche. Le tableau se voit toujours depuis un point où l'on se tient, ou se trouve derrière une porte.
- `{ "type": "placard", "x": [..], "z": [..], "face": "n" | "s" | "e" | "w" }` : placard à portes coulissantes, `face` = côté des portes. Sans `face`, le moteur prend l'ancien rail `track` s'il est mince (nord ou sud), sinon le plus long côté qui donne sur une pièce.
- `{ "type": "dep", "p": [x, z], "r": 0.05 }` : descente d'eaux pluviales.

Champs facultatifs complétés par le moteur : `drain` au centre du receveur, `dir` du WC, de la vasque et du sèche-serviettes vers le centre de la pièce, `r` 0,05. Un équipement inutilisable est écarté avec un avertissement dans la console, jamais bloquant.

`faience` : `[{ "a": [x, z], "b": [x, z], "n": [nx, nz], "y": [0, 2.10] }]`, bandes de faïence posées sur une face de mur, `n` tourné vers la pièce.

`kitchenHint` : cuisine indicative du plan, dessinée en pointillés en 2D seulement : `[{ "r": [x0, x1, z0, z1], "t": "évier · LV", "tp": [x, z], "rot": 0 }]`.

## Loggia : `loggia`

`{ "slab": [...polygone de dalle...], "rail": [...polyligne du garde-corps...], "tile": 0.5 }`, ou une liste de ces objets s'il y a plusieurs loggias ou balcons.

## Lumière et visite

Rendu de la visite (réglage `rendu`, retour R4 du 29/09/2026) : `simple` par défaut, lumière fixe sans calcul (ciel d'un jour figé, environnement neutre, deux directionnelles sans ombre d'azimut oblique, tons Neutral) : ni ombre, ni occlusion, ni sonde, ni exposition automatique, ni bloom, ni lampe calculée ; les plafonniers restent lumineux. `ultra` (case « Ultra réaliste » des réglages, qui montre alors soleil, brise-soleil, exposition, lampes, occlusion et rendu photoréaliste) : le rendu complet décrit ci-dessous, sondes prises d'un coup à la bascule. Photos et 360° (`?shoot=1`) : ultra réaliste (`?rendu=simple` le force). Contrôles `lumiere` (bascule sans reste, nuit sans effet, pièces ni sombres ni brûlées) et `360` (bouton de la visite, retour « Visite 3D » de la visionneuse au même endroit ; `pos` des arrêts dans `pano/visite.json`).

- `lamps` : points lumineux au plafond `{ "p": [x, z], "blind": true }` (`blind` pour une pièce sans fenêtre), appliques `{ "wall": [x, z], "n": [nx, nz], "y": 2.0, "ext": true }`.
- `probes` : un point par pièce intérieure, au centre de la zone libre : `{ "sejour": [x, z], ... }`.
- `passages` : passages entre pièces, pour fondre la lumière : `{ "a": "entree", "b": "sejour", "p": [x, z], "r": 1.0 }`.
- `stops` : arrêts de la visite guidée `{ "id", "room", "label", "p": [x, z], "yaw", "pitch", "open": [ids], "close": [ids] }` (`id` et `room` : l'id de la pièce ; `close` : portes fermées à l'arrivée, celles dont le vantail boucherait la vue). `yaw` : 0 regarde vers le haut du plan (−z), π/2 vers la gauche (−x), −π/2 vers la droite (+x).
- `photos` : vues de la galerie `{ "id", "room", "t", "a", "cam": [x, z, yaw, pitch, fov], "open": [...], "close": [...] }` et `{ "id": "maquette", "t": "Vue d'ensemble", "orbit": true }`.
- `sans_arret` : ids des pièces volontairement sans arrêt de la visite guidée (aucun point de vue dégagé, dit dans rapport.json). Toute autre pièce intérieure (ni masquée, ni sous-pièce `of`, ni loggia) a son arrêt.

## Divers

- `outline` : contour extérieur de l'appartement, murs compris (sans la loggia). La chaîne le calcule : union des murs, des gaines, des pièces intérieures et de l'emprise des baies, nettoyée.
- `bounds` : `[xmin, xmax, zmin, zmax]` pour cadrer le plan 2D.
- `dims` : cotes du promoteur `[x1, z1, x2, z2, "4,12"]` ; plusieurs niveaux : `[x1, z1, x2, z2, "4,12", level]`.
- `underlay` : calque du plan `{ "file", "x", "z", "w", "h" }`.
- `context` : immeuble autour (`masses`, `palier`, `trees`, `blocks`, `level`, `below`, `above`).
- `simple: true` : version de base, lampes allumées (en ultra réaliste), réglages de lumière remis au moment du plan à chaque chargement.
- `fiche` : tableau des surfaces et remarques `{ "surfaces": [[pièce, surface, cotes]], "sections": [{ "h", "items": [["ok"|"w"|"h", texte]] }] }`. Un item peut aussi être un texte seul ; un drapeau inconnu vaut `h`.

## Plusieurs niveaux (duplex, triplex)

Un plan à un seul niveau n'a ni `levels`, ni `stairs`, ni `voids`, ni `level` : tout ce qui précède s'applique tel quel. Sinon :

- Repère commun : les niveaux sont superposés, en mètres, `x` et `z` comme ci-dessus. Le sol fini du niveau `k` est à `levels[k].y`. Toutes les hauteurs d'un élément (allège, linteau, plafond `H`…) sont comptées depuis le sol de son niveau.
- `level` (entier, index dans `levels`, 0 par défaut) sur : `walls`, `rooms` (seuils et palier compris), chaque ouverture de `openings`, `fixtures`, `gaines`, `masses`, `lamps`, `faience`, `kitchenHint`, chaque objet de `loggia` (alors une liste), `passages`, `stops`, `photos` (vue de pièce : niveau de la pièce ; vue d'ensemble : niveau affiché), `context.palier`. `dims` porte le niveau en 6e valeur. `probes` reste `{idPièce: [x, z]}` : le niveau est celui de la pièce. Les ids sont uniques sur tout le plan (murs et gaines des niveaux au-dessus du premier préfixés `n1-`, `n2-`…).

```json
"levels": [
  { "id": "n0", "name": "R+1", "y": 0, "H": 2.5, "entry": true, "outline": [[x, z], ...],
    "floor": [{ "poly": [...], "trous": [[...]] }], "ceiling": [...], "roof": [...], "zone": [x0, z0, x1, z1], "offset": [0, 0] },
  { "id": "n1", "name": "R+2", "y": 2.8, "H": 2.5, "outline": [...], "floor": [...], "ceiling": [...], "roof": [...], "zone": [...], "offset": [-0.006, -6.388] }
],
"stairs": [{ "id": "esc1", "from": 0, "to": 1, "line": [[7.312, 11.065], [3.819, 11.065]], "width": 0.898, "n": 15, "rise": 0.1867, "going": 0.2495,
             "poly": [[x, z], ...], "void": "v1", "label": "Escalier" }],
"voids": [{ "id": "v1", "level": 1, "poly": [[x, z], ...], "rails": [[[x, z], [x, z], ...]] }]
```

- `levels`, du bas vers le haut. `name` : nom écrit sur le plan (« R+1 », « RDC »…), sinon « Niveau 1 », « Niveau 2 ». `y` : `levels[k+1].y = levels[k].y + levels[k].H + 0.30` (dalle 0,26, sol fini 0,02, plafond 0,02 : 2,80 d'étage à étage pour 2,50 de hauteur sous plafond). `H` : hauteur sous plafond du niveau (lue, sinon 2,50). `entry: true` sur le niveau de la porte palière.
- `outline` : contour du niveau, murs compris, sans loggia. `floor` : dalle portant le niveau (contour moins ses vides ; au-dessus d'un autre niveau, elle couvre aussi le contour du dessous à 3 cm près). `ceiling` : plafond du niveau (contour moins les vides du niveau au-dessus). `roof` : dalle haute sur la partie du niveau que le niveau au-dessus ne couvre pas (tout le contour pour le plus haut). Polygones valides, trous compris, calculés par la chaîne : le moteur n'a pas d'opérations booléennes à faire. Dalle portant un niveau au-dessus d'un autre : de `y − 0,28` à `y − 0,02`. `pieds` et `joints` (niveaux au-dessus du premier) : parties de ses masses posées sur une masse du niveau du dessous (dessinées depuis 1 cm sous le plafond du dessous, faces confondues avec celles du dessous) et parties libres au bord d'un vide (depuis le dessous du plafond du dessous) ; le reste des masses part du dessus du plafond du dessous, caché par lui.
- `zone` : cadre du dessin du niveau dans le repère commun (découpe du calque en 2D). `offset` : décalage du niveau sur la page du promoteur ; `underlay`, dans le repère de la page, se dessine décalé de `−offset` pour ce niveau.
- `outline` (racine) : contour du niveau d'entrée. `bounds` : union de tous les niveaux. `H` (racine) : celle du niveau 0.
- `stairs` : `line` = ligne de foulée au niveau `from`, de la première contremarche (sol de `from`) à la dernière (sol de `to`), qui coïncide avec le bord d'arrivée du vide. `n` contremarches, `rise = (y_to − y_from) / n` (0,16 à 0,20), `going = longueur(line) / (n − 1)`. `poly` : emprise de la volée (bande de largeur `width` autour de `line`) au niveau `from` ; aucune pièce ne la recouvre. `void` : vide traversé. La volée est sous le vide ou sous la dalle avec 1,90 m d'échappée au moins. `label` : texte affiché.
- `voids` : vide dans la dalle du niveau `level` (trémie), bord calé au nu des murs voisins. Aucune pièce, lampe, vue ni arrêt dedans. `rails` : garde-corps sur chaque bord libre (ni mur, ni arrivée d'escalier).
- Palier d'arrivée : pièce `{ "id": "palier", "name": "Palier", "hidden": true, "level": 1 }`, sans `of`, avec une sonde et un passage vers les pièces ouvertes sur lui.
- `stops` : niveau d'entrée d'abord, puis un arrêt `{ "id": "escalier", "label": "Escalier", "stair": "esc1", "room", "level", "p", "yaw", "pitch" }` au pied de la volée regardant la montée, puis le niveau suivant en partant de l'arrivée.
- `photos` : une vue d'ensemble par niveau `{ "id": "maquette-n0", "level": 0, "t": "Vue d'ensemble · R+1", "a": "maquette 3D", "orbit": true }` (un seul niveau : `maquette` comme ci-dessus).
- `context` : `level` = hauteur d'étage (2,80), `below` = étages sous le niveau 0, `above` = étages au-dessus du niveau le plus haut, `palier` au niveau d'entrée.
- `fiche.surfaces` : une ligne d'en-tête par niveau `["R+1", "", ""]` quand le tableau du promoteur est découpé par niveau.

### Dans le moteur

- Au chargement, un plan sans `levels` reçoit un niveau implicite `{y: 0, H, outline}` ; `level` vaut 0 partout où il manque. `App.D.L[k]` est la vue du niveau `k` (murs, pièces, baies, équipements, vides, escaliers…). Murs, seuils, plinthes, portes ne se comparent qu'entre éléments du même niveau.
- Chaque niveau est construit dans son propre groupe, posé à `levels[k].y`. Murs d'un niveau superposé : de 1 cm sous le haut des murs du dessous jusqu'au plafond (façade continue) ; chants de sa dalle et du plafond du dessous repoussés en profondeur (le mur l'emporte en façade). Escalier plein (chaque marche descend jusqu'au sol du niveau bas), giron bois, main courante côté libre.
- Le visiteur a un niveau et un sol : `__v.walk.lv`, `__v.walk.y` (caméra à `y + 1,60`). Il marche sur les pièces de son niveau et sur la rampe des escaliers, jamais dans un vide.
- `App.state.level` : niveau affiché. En visite il suit le visiteur ; en maquette il choisit le niveau montré (niveaux au-dessus retirés, coupe à `y + 1,205`) ; par défaut le niveau d'entrée. Onglets aux noms du plan dans le plan 2D et la maquette, seulement s'il y a plusieurs niveaux.
- Requêtes avec niveau explicite : `App.roomAt(x, z, lv)`, `__v.collide(x, z, r, lv)`, `__v.walkMove(x0, z0, mx, mz, lv)` → `[x, z, refus, lv, y]`, `__v.findPath(x0, z0, lv0, x1, z1, lv1)` → points `[x, z, lv]`, `__v.floorAt(x, z, lv)`. Sur un plan à plusieurs niveaux, un appel sans niveau écrit `niveau manquant : <fonction>` dans la console (la visite de contrôle le refuse). Plan à un niveau : signatures d'origine.
- Photo d'une pièce : caméra au sol de `photos[i].level` ; vue d'ensemble : `App.set('level', photos[i].level)`.

### Maquette découpée et culling (tous plans)

Aucun champ nouveau dans `plan.json` : le moteur tire tout des pièces, des baies, des escaliers et des vides.

- Cellules : une par pièce (sous-pièces `of` rattachées à leur pièce), une par escalier (volée et trémie), et « dehors » (façades, immeuble, abords). Chaque maillage de murs, sols, plafonds, plinthes, équipements et lampes est découpé par matériau et par cellules : chaque triangle va aux cellules dont il touche l'air (mur mitoyen : une face par pièce ; plafond d'un seul tenant : les pièces qu'il recouvre ; embrasure d'une baie : les deux côtés). Les petits morceaux rejoignent un morceau voisin (moins d'appels de dessin, jamais moins dessiné). `userData.cells` sur chaque morceau, `userData.lot` : le maillage d'origine (les contrôles de faces superposées comparent les lots, pas les morceaux).
- Portails : chaque baie (porte ouverte ou fermée), chaque bord commun à deux pièces sans mur, l'emprise de la volée et de la trémie (seul passage d'un niveau à l'autre), loggias vers dehors.
- En visite, hors mode photo : pièce du visiteur, puis pièces vues par les portails, chacune limitée à un rectangle d'écran (ciseaux) ; miroirs parcourus depuis la caméra symétrique ; lampes des pièces ni vues ni voisines d'une pièce vue à intensité nulle, carte d'ombre gelée ; ombres toujours calculées sur toute la maquette (maillages entiers cachés, calque 2). En maquette, en plan, en rendu photo et sous `?shoot=1` : tout est dessiné. Poignées : `__v.cul` (cellules, portails, `force`), `__v.cullStats()`, `__v.cellsAt(x, y, z)`.
- Réglages de la visite seulement (`reglagesVisite`) : le verre, les ampoules et le cadre des miroirs reçoivent les ombres, l'ombre des lampes porte à 40 m (même biais de 3,6 cm) ; sans eux, la lumière d'une lampe cachée traversait les murs (reflets dans les vitres) et l'éteindre changeait l'image. Mode photo et contrôle : rendu d'avant, photos inchangées.
- Textures : générées par `moteur/matieres.js` dans des workers (repli dans la page), mêmes pixels qu'avant ; moitié de la résolution sur écran tactile, appareil à 4 Go ou moins et rendu logiciel, pleine sous `?shoot=1` (`?matieres=0.5` ou `1` la force).

### Contrôles propres aux niveaux (`moteur/controle.mjs`)

Sur un plan à plusieurs niveaux, chaque problème porte `level`. En plus des contrôles d'un seul niveau (pièces accessibles en montant l'escalier, portes, étanchéité et vues à la hauteur de chaque niveau) :

- `escalier` : marches de 16 à 20 cm, giron de 21 à 32 cm, pied et arrivée sur une pièce, dernière contremarche à 1 cm du bord du vide, échappée d'au moins 1,90 m, montée et descente au clavier à 60 et 120 images par seconde.
- `vide` : chaque bord a un mur, un garde-corps ou l'arrivée ; on ne marche pas dans un vide ; aucune pièce, équipement, lampe, vue ni arrêt dans un vide ou sur une volée (sauf l'arrêt « Escalier »).
- `dalle` : ni trou dans un sol ou un plafond, ni plancher fermé au-dessus d'un escalier, ni deux dalles superposées, ni chant de dalle dans le plan d'un mur en façade (`facade`).
- `rebord` : aucun rebord de quelques millimètres (haut de mur du dessous, dalle, plafond) ne dépasse du nu d'un mur du niveau au-dessus dans un vide ou en façade : ligne claire au soleil. La chaîne cale les murs d'un niveau sur ceux du dessous à 5 mm près et prolonge les trous de dalle de 2 cm dans les murs qui bordent le vide.
- `niveau` : vues et arrêts au bon niveau et à hauteur d'œil, pièces dans le contour de leur niveau, ids uniques, aucun appel sans niveau.
- `lampes` : au plus 8 lampes à ombre, aucune lampe dans un vide.

Tous plans : `menuiserie` (aucun jour entre les deux vantaux d'une fenêtre ou d'une porte-fenêtre fermée), `equipement` (tableau électrique face à l'ouverture de sa niche), `arret` avec `manque: true` (pièce sans arrêt de la visite guidée ni place dans `sans_arret`), `maquette` (en maquette de chaque niveau, coupe inactive, aucun élément visible ne dépasse le haut des murs de plus de 5 mm, contexte d'immeuble mis à part), `cloison` (mur `beton` ou doublage de 8 cm au plus, posé sur des aplats blancs minces du PDF et sur aucun aplat noir : une cloison dessinée en noir comme un voile). `lumiere` (les murs arrêtent l'ombre du soleil par leurs deux faces : sinon fente de lumière dans l'angle derrière un mur ensoleillé). `visibilite` (depuis chaque arrêt, 8 directions, et le long des trajets entre arrêts, escaliers compris : l'image de la visite avec culling est identique à l'image sans ; plus de 4 pixels différents après érosion 3×3 bloquent). `matiere` (aucune texture noire ni couleur uniforme, à pleine résolution et à la moitié). `repare_moteur` crée l'arrêt manquant ; `maquette`, `cloison` et `lumiere` bloquent la publication sans réparation.

## Robustesse

Le moteur ne plante pas sur un plan.json retouché à la main : ce qui est hors format (mur sans `b`, ouverture sur un mur inconnu, pièce sans polygone, cote incomplète…) est écarté avec un avertissement dans la console, les champs manquants reçoivent leur valeur par défaut, et un mur qui traverse une baie est ouvert par le moteur lui-même.
