# L4-15 · Panoramas 360° rendus par le serveur à chaque arrêt

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | M (1 à 3 j) | L1-09, L1-16 | `moteur/` [M], `pipeline/` [P] | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 15) : un mode 360° à chaque arrêt, comme sur les sites d'annonces immobilières, dans toutes les visites. Les panoramas sont rendus par le serveur ; on navigue d'arrêt en arrêt. L'utilisateur ajoute : « ce sera peut-être le truc gratuit plutôt que la visite complète » : décision de principe, à confirmer avec le coût de rendu mesuré (L1-16). La visionneuse est dans L4-16, le socle dans L5-27.

## Ce qui est fait (28/09/2026)
Construit dans l'outil local, sans toucher `engine.js`, `ui.js`, `controle.mjs` ni `photos.mjs` ; non commité, aucun appel payant. État vérifié à 16 h 20 : `pano/controle.json` à `ok: true` sur t2-432, plan-du-lot, 3124 et la duplex 3081-613 ; **à `ok: false` sur le D201** (placard de l'entrée, voir plus bas), donc 360° du D201 non publié.
- **`moteur/pano.mjs`** (avec `pano-regard.mjs`, `pano-visionneuse.mjs`, `pano-mesures.mjs`). À chaque arrêt de `plan.json` : 6 vues à hauteur d'œil du niveau de l'arrêt, rendues par le moteur en mode photo (`?shoot=1`), une seule exposition par panorama (borne basse 0,2), projection équirectangulaire, fondu de ±3,4° aux bords des vues, léger tramage avant la compression JPEG (plus d'anneaux autour des halos de lampes). **Occlusion ambiante** : chaque face est rendue sans puis avec, et le rapport des deux est appliqué au panorama (fondu sur ±4°) ; sans elle, les contremarches de la duplex se confondaient avec le mur (écart 1,2 % → 23 %) et les angles n'avaient pas d'ombre (1 → 18 à 31 sur 255). Vérifié en tournant le cube de 45° (`--rotation=45`) : 1 à 2 sur 255 d'écart en plus près des arêtes. Options `--standard`, `--logiciel` (SwiftShader), `--arrets=`, `--essai=<défaut>`.
- **Point de vue** : celui de l'arrêt, déplacé au plus près (0,07 à 0,73 m, 12 arrêts sur 33) s'il est dans le débattement d'une porte, à moins de 0,7 m du vantail ouvert, ou dans la cuisine indicative. La visite 3D garde ses arrêts ; la correction de fond est dans `lire.py` (à faire, point 7).
- **Portes** : état de la visite guidée ; jamais ouverte une porte qui ne relie pas deux pièces ayant un arrêt (placard, tableau, gaine) ; puis chaque porte est basculée si cela montre plus d'arrêts voisins ; porte palière fermée.
- **Points de passage** : cercle entier visible (centre et 12 points du bord), à 14 px de haut au moins à l'écran ; jamais vu à travers la pièce d'un autre arrêt ; jamais sur un vantail ouvert ; deux pièces qui communiquent ont un lien direct (le T2 n'avait pas Salon ↔ Chambre 1) ; quand deux cercles se superposent à l'écran (écart réel des contours), l'un est déplacé avant d'en retirer un.
- **Regards** (`pano-regard.mjs`) : vue de départ et regard d'arrivée de chaque lien (`lien.arrivee`) notés sur tout le champ de l'écran (profondeur, mur nu, fenêtres, équipements, obstacles à moins de 75 cm), à 135° au plus de la direction du cercle touché ; regard baissé dans les petites pièces (−0,3 dans les WC et celliers, −0,18 dans les salles de bains et dégagements). Réponse au retour R1 de l'utilisateur (ci-dessous).
- **Duplex** : `pipeline/niveaux.py` ne crée plus d'arrêt « Escalier » à moins de 1,5 m d'un autre arrêt du même niveau ; l'Entrée porte le lien « monter ». La duplex a donc 10 arrêts (11 avant). Ce changement touche aussi `plan.json`, donc la visite 3D de la duplex (plus d'arrêt « Escalier »).
- **Noms** : « Séjour / Cuisine » (D201), « Salle de bains / WC » (T2) ; plus de capitales.
- **Sorties** dans `plans/<id>/pano/` : `<arrêt>-8192.jpg` (chargé seulement sur ordinateur quand l'écran le demande), `-4096`, `-2048`, `-512` (aperçu) ; `niveau-<k>.png` sans texte ; `visite.json` (titre, niveaux, départ, arrêts avec nom, niveau, position sur le plan du niveau, direction de départ, liens et regard d'arrivée ; ni murs, ni pièces, ni `plan.json`) ; `index.html` et `visionneuse.js` (L4-16) ; `controle.json`.
- **Une ligne `PANO {json}` par panorama**, lue par le serveur pour la progression.
- **Contrôles automatiques bloquants** (`pano/controle.json`) : un panorama par arrêt ; aucune image noire ou uniforme ; coutures sous 3 sur 255 (1,46 au plus) et couture d'occlusion sous 40 (28,4 au plus) ; arrêt dans une pièce de son niveau ; deux arrêts d'un même niveau qui se voient jamais à moins de 1,2 m ; œil hors du débattement et à 0,7 m au moins d'un vantail ouvert ; cercles entiers visibles, jamais superposés ni vus à travers une autre pièce qui a son arrêt ; arrêts atteignables, liens réciproques, niveaux reliés ; regard d'arrivée sans obstacle proche ni mur nu, pas nettement moins bon que la meilleure direction permise ; **placard dont un côté autre que la façade se voit depuis un arrêt, et tableau électrique adossé à rien** (retour R2) ; exposition hors borne ; noms ; plus les contrôles de la visionneuse (L4-16).
- **Essais négatifs vérifiés** : arrêt placé dans un mur ; vue exposée 15 % plus fort (6,6 contre 3) ; `--essai=arrivee` (3 défauts signalés) ; ancien D201 refusé par le contrôle des placards, copie corrigée acceptée. D'autres essais sont écrits (`vantail`, `confondus`, `disque`, `traversee`, `porte-sans-arret`, `exposition`, `sans-occlusion`, `noms`, `separateur`), sans résultat consigné.
- **Chaîne** : étape « Visite à 360° » de `pipeline/serveur.py` après les photos ; si le contrôle échoue, la visite à 360° n'est pas publiée et l'étape peut être relancée. `outils/finalise.sh` refait aussi le 360°.

### Retours de l'utilisateur (28/09/2026)
- **R1** « l'angle de la caméra lors des déplacements est étrange, on finit la tête dans le mur.. la POV doit être + grande dans l'effet 360, on doit dézoomer je pense.. » : regards d'arrivée refaits (voir ci-dessus) et vérifiés sur captures image par image des 60 transitions des 5 plans, ordinateur et téléphone ; il reste deux cas limites dans des pièces de 1 m² (rangement, cellier), où l'on regarde par la porte faute de mieux. Champ de vision : L4-16.
- **R2** « notre 201 a un gros problème non sur le placard dans l'entrée » : reproduit. Cause vérifiée sur le PDF : le tableau électrique est dans un compartiment fermé à double trait (joue x 3,825–3,934, façade z 1,563–1,634, les cloisons `clGtl` et `clGtlN` du relevé fait à la main), que la lecture avait oublié ; par ce côté ouvert on voyait l'étagère et la tringle du placard, et le coffret ressortait comme un panneau seul. Correction dans `pipeline/murs.py` (`compartiments_tableau`, appelée pour l'instant depuis `murs.robinets`) ; même défaut corrigé et publié sur la duplex (tableau du séjour) et plan-du-lot (cloison nord). Sur le T2, le contrôle a trouvé une fente sur toute la hauteur à côté de la porte du coffret (« Placard TE ») : corrigée dans `murs.portes_arcs` (une porte de moins de 65 cm garde la largeur de son vantail) et `murs.decoupe`. **Le D201 publié n'a pas encore la correction** : avec elle, la visite de contrôle 3D signale une fente en (2,55 ; 0,45), faux positif vérifié par lancer de rayons (un rayon posé exactement sur le plan du jambage de la porte palière passe entre deux maillages ; à ±2 mm il touche l'huisserie).
- **R3** « Les lumières peuvent être fake sans soucis si c'est joli » ; sécurité pas prioritaire tant que tout est local : rien à changer dans le 360° (exposition réglée par panorama).

### Mesures (28/09/2026, Mac, Metal : indicatif)
- 8 s par panorama en médiane, 11,7 s au plus (33 panoramas, 8192, 4096, 2048 et aperçu, occlusion comprise : chaque face rendue deux fois) ; 34,5 s (T2, 4 arrêts) à 104,3 s (duplex, 10 arrêts) par plan, liens, regards et contrôles compris. Avant l'occlusion et le 8192 : 5,0 s par panorama, 24,6 à 57,8 s par plan.
- SwiftShader : environ 3,5 min par panorama en 4096 d'après le rapport de construction, avant l'occlusion et le 8192 ; à remesurer (L1-16).
- Tableau complet et poids des images : L1-16.

## À faire
1. **Publier le D201 corrigé** : dans `moteur/controle.mjs` (réservé à un autre agent), ne compter une fente que si deux rayons voisins (±2 mm le long du bord) passent tous les deux, avec essai négatif (fente de 2 cm près d'une baie toujours signalée) ; dans `lire.repare_moteur`, ne jamais reposer un bloc identique (5 blocs `fu00` identiques posés au D201). Puis `outils/finalise.sh d201-f14b3e4b` ; le 360° du D201 doit passer à `ok: true`.
2. **Placard et coffret dans le moteur et la lecture** (autres agents) : `lire.py` appelle `murs.compartiments_tableau` directement après `murs.ferme` (et les deux lignes de `murs.robinets` sont retirées) ; `engine.js` `buildPlacard` pose une joue sur chaque côté qui n'est pas contre un mur, le coffret du tableau n'est posé que contre de la matière, pas d'étagère ni de tringle quand le placard battant est le coffret ; contrôle équivalent dans `controle.mjs`, fondé sur la visibilité depuis les arrêts (sonder la pièce ne suffit pas).
3. **Chrome portable** : passer par `moteur/chrome.mjs` (L1-09, L1-01, pas encore écrits) au lieu du lancement et du serveur statique propres à `pano.mjs` ; aucune variable secrète dans l'environnement de Chrome.
4. **Palier de qualité « haut »** (L4-12) pour le rendu des vues, quand il existera.
5. **Format et résolution** retenus par l'utilisateur après L1-16 (aujourd'hui équirectangulaire 8192, 4096, 2048 et 512).
6. **Contrôles à compléter** : arrêt hors d'un meuble (seuls la pièce, les vantaux et la cuisine indicative sont contrôlés) ; consigner le résultat des essais négatifs écrits mais non consignés.
7. **Correction de fond dans `lire.py`** : exclure des positions d'arrêt et de photo le quart de disque de chaque porte agrandi de 0,3 m, les points à moins de 0,7 m du vantail ouvert et la cuisine indicative agrandie de 0,3 m ; contrôle correspondant.
8. **Témoin** (L1-12) : panoramas et contrôles sur le témoin quand il existera.
9. **Planche relue avec l'utilisateur** (panoramas et coutures ; il a vu le 360° et fait les retours R1 et R2, mais pas encore la version corrigée), puis critère de fusion.

## Critères d'acceptation
- [ ] Témoin, 4 références et duplex 3081-613 : un panorama par arrêt ; ni face noire ni couture visible à l'œil (planche relue avec l'utilisateur) ; duplex : arrêts des deux niveaux reliés par l'escalier. Contrôles passés sur le T2, plan-du-lot, 3124 et la duplex (l'Entrée porte le lien « monter ») ; D201 bloqué par son placard ; témoin et relecture avec l'utilisateur manquants.
- [ ] Durées Metal et SwiftShader notées, comparées à L1-16 ; aucune estimation affichée à l'utilisateur (R12). Metal noté ; SwiftShader seulement estimé, avant l'occlusion.
- [x] Test négatif : un arrêt placé dans un mur fait échouer le contrôle (essai volontaire du 28/09/2026). Une vue exposée 15 % plus fort aussi (6,6 contre un seuil de 3).
- [ ] `photos.mjs` et la visite inchangés. `engine.js`, `ui.js`, `controle.mjs` et `photos.mjs` non touchés par le 360° ; mais `niveaux.py` retire l'arrêt « Escalier » de la visite 3D de la duplex, et `murs.py` change la maquette de la duplex, de plan-du-lot et du T2 : rejeu L1-02 à faire.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 (rejeu L1-02, non commité) ; aucune lecture payante (tenu).

## Points d'attention
- Priorité P1 : elle passe en P0 si l'utilisateur retient le 360° pour l'offre gratuite ou pour la bêta fermée (à décider).
- Nombre : un panorama par arrêt de la visite guidée, 4 à 10 sur les 5 références (33 au total).
- Un panorama en échec fait aujourd'hui échouer toute l'étape 360° (non publiée, relançable) ; l'omission d'un seul arrêt sans bloquer les autres relève du socle (L5-27).
- Le contrôle des placards du 360° voit ce que la visite 3D ne signale pas (au D201, la niche appartenait à la pièce masquée du placard) : tant que `controle.mjs` n'a pas son équivalent, un placard ouvert n'est bloqué que par le 360°.
- Dans les impasses (retour vers l'entrée d'un couloir), la rotation d'arrivée reste grande ; la transition la masque (L4-16).
- Marquage « non contractuel » : mention permanente dans la visionneuse, rien d'incrusté dans les images ; à décider (L4-07, avocat).
- Place dans la chaîne en ligne et dans l'offre gratuite : L5-27 et L0-04, pas ici.
- Une porte qui masque la vue d'un arrêt est un défaut de placement de l'arrêt : on le corrige dans la chaîne, jamais en retouchant l'image.

## Références
- PLAN.md § 2.1 (décisions 4, 15) ; R12.
- `moteur/pano.mjs` (en-tête : options, essais, seuils), `moteur/pano-regard.mjs`, `moteur/pano-mesures.mjs` ; `pipeline/niveaux.py` (`ECART_ARRETS`) ; `pipeline/murs.py` (`compartiments_tableau`, `portes_arcs`, `decoupe`) ; `pipeline/serveur.py` (`pano`) ; `outils/finalise.sh` ; L1-16 (mesures) ; moteur/photos.mjs ; moteur/SCHEMA.md (`stops`).

## Hors périmètre
- Visionneuse : L4-16. Rendu, marquage et publication dans le socle : L5-27. Coût serveur : L1-16.
