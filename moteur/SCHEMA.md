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
- Fenêtres et portes-fenêtres : ouvrent toujours vers l'intérieur. `leaves` 1 ou 2. `frame` : position de la menuiserie dans l'épaisseur, `[d0, d1]` depuis la ligne de référence vers l'extérieur. `depth` : épaisseur totale à traverser (voile et doublage). `bso`, `vr` (volet roulant), `gc` (garde-corps dans le tableau, `[d0, d1]`), `seuil` (hauteur du seuil).

## Pièces : `rooms`

```json
{ "id": "chambre", "name": "Chambre", "area": "11,9", "poly": [[0.14, 3.24], [4.26, 3.24], [4.26, 6.13], [0.14, 6.13]], "label": [2.2, 4.55], "floor": "dry" }
```

- `poly` : contour intérieur, au nu des murs. Les pièces ne se chevauchent pas. Une pièce ouverte sur une autre (entrée dans le séjour) partage un bord avec elle.
- `area` : surface du tableau du promoteur, texte avec virgule. `areaNote` si la pièce est comptée ailleurs (« comprise dans le séjour »), et `inclut: ["entree", "placard"]` sur la pièce qui la compte. Les gaines situées dans une pièce sont déduites de sa surface.
- `floor` : `dry` (parquet), `wet` (carrelage), `loggia` (dalles extérieures).
- `ext: true` ou `floor: "loggia"` pour une loggia, un balcon ou une terrasse, quel que soit l'`id`. `hidden: true` pour un placard ou un seuil. `small: true` pour une étiquette discrète.
- `label` : point `[x, z]` où écrire le nom, utile pour une pièce en L (la chaîne y met le pôle d'inaccessibilité quand le centroïde tombe hors de la pièce).
- Seuils de porte : petites pièces cachées qui comblent l'épaisseur du mur sous chaque porte intérieure, avec `"of": "<pièce>"`. Sans elles, la visite ne peut pas passer la porte. La marche tolère 4 cm d'écart entre un seuil et sa pièce.

## Équipements : `fixtures`

- `{ "type": "shower", "x": [x0, x1], "z": [z0, z1], "drain": [x, z], "valve": { "wall": [x, z], "dir": [0, 1] } }`
- `{ "type": "bath", "x": [..], "z": [..] }`
- `{ "type": "wc", "p": [x, z], "dir": [dx, dz] }` : `p` au milieu du bord du réservoir collé au mur, `dir` du mur vers la cuvette.
- `{ "type": "vanity", "x": [..], "z": [..], "dir": [dx, dz] }` : meuble vasque, `dir` vers l'usager.
- `{ "type": "towel", "x": [..], "z": [..], "dir": [dx, dz] }` : sèche-serviettes.
- `{ "type": "tableau", "x": [..], "z": [..] }` : tableau électrique.
- `{ "type": "placard", "x": [..], "z": [..], "face": "n" | "s" | "e" | "w" }` : placard à portes coulissantes, `face` = côté des portes. Sans `face`, le moteur prend l'ancien rail `track` s'il est mince (nord ou sud), sinon le plus long côté qui donne sur une pièce.
- `{ "type": "dep", "p": [x, z], "r": 0.05 }` : descente d'eaux pluviales.

Champs facultatifs complétés par le moteur : `drain` au centre du receveur, `dir` du WC, de la vasque et du sèche-serviettes vers le centre de la pièce, `r` 0,05. Un équipement inutilisable est écarté avec un avertissement dans la console, jamais bloquant.

`faience` : `[{ "a": [x, z], "b": [x, z], "n": [nx, nz], "y": [0, 2.10] }]`, bandes de faïence posées sur une face de mur, `n` tourné vers la pièce.

`kitchenHint` : cuisine indicative du plan, dessinée en pointillés en 2D seulement : `[{ "r": [x0, x1, z0, z1], "t": "évier · LV", "tp": [x, z], "rot": 0 }]`.

## Loggia : `loggia`

`{ "slab": [...polygone de dalle...], "rail": [...polyligne du garde-corps...], "tile": 0.5 }`, ou une liste de ces objets s'il y a plusieurs loggias ou balcons.

## Lumière et visite

- `lamps` : points lumineux au plafond `{ "p": [x, z], "blind": true }` (`blind` pour une pièce sans fenêtre), appliques `{ "wall": [x, z], "n": [nx, nz], "y": 2.0, "ext": true }`.
- `probes` : un point par pièce intérieure, au centre de la zone libre : `{ "sejour": [x, z], ... }`.
- `passages` : passages entre pièces, pour fondre la lumière : `{ "a": "entree", "b": "sejour", "p": [x, z], "r": 1.0 }`.
- `stops` : arrêts de la visite guidée `{ "id", "room", "label", "p": [x, z], "yaw", "pitch", "open": [ids], "close": [ids] }` (`id` et `room` : l'id de la pièce ; `close` : portes fermées à l'arrivée, celles dont le vantail boucherait la vue). `yaw` : 0 regarde vers le haut du plan (−z), π/2 vers la gauche (−x), −π/2 vers la droite (+x).
- `photos` : vues de la galerie `{ "id", "room", "t", "a", "cam": [x, z, yaw, pitch, fov], "open": [...], "close": [...] }` et `{ "id": "maquette", "t": "Vue d'ensemble", "orbit": true }`.

## Divers

- `outline` : contour extérieur de l'appartement, murs compris (sans la loggia). La chaîne le calcule : union des murs, des gaines, des pièces intérieures et de l'emprise des baies, nettoyée.
- `bounds` : `[xmin, xmax, zmin, zmax]` pour cadrer le plan 2D.
- `dims` : cotes du promoteur `[x1, z1, x2, z2, "4,12"]`.
- `underlay` : calque du plan `{ "file", "x", "z", "w", "h" }`.
- `context` : immeuble autour (`masses`, `palier`, `trees`, `blocks`, `level`, `below`, `above`).
- `simple: true` : version de base, lampes allumées, pas de réglage de lumière.
- `fiche` : tableau des surfaces et remarques `{ "surfaces": [[pièce, surface, cotes]], "sections": [{ "h", "items": [["ok"|"w"|"h", texte]] }] }`. Un item peut aussi être un texte seul ; un drapeau inconnu vaut `h`.

## Robustesse

Le moteur ne plante pas sur un plan.json retouché à la main : ce qui est hors format (mur sans `b`, ouverture sur un mur inconnu, pièce sans polygone, cote incomplète…) est écarté avec un avertissement dans la console, les champs manquants reçoivent leur valeur par défaut, et un mur qui traverse une baie est ouvert par le moteur lui-même.
