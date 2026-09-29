# L1-15 · Corriger clic, regard, déplacement et i/s d'après le diagnostic

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | L (3 à 5 j) | L1-02, L1-14 | `moteur/` [M] | En cours |

## Pourquoi
L'utilisateur juge la visite pas assez fluide : clic difficile, déplacement pénible, regard qui a du mal, point de vue étrange, trop peu d'i/s (décision n° 12 du 27/09/2026). L1-14 mesure et classe les défauts. Ce ticket corrige dans le moteur actuel ce qui gêne le plus, avant la démonstration publique (L2-09) et les testeurs (L3-06, L6-10). Tout défaut trouvé devient un contrôle automatique.

## Avancement (27 et 28/09/2026 : implémentation, réception indépendante, correction)
Non commité. Fichiers : `moteur/engine.js`, `moteur/controle.mjs`, `moteur/ui.js` (texte d'aide seulement), `pipeline/lire.py` et `pipeline/niveaux.py` (tangage des arrêts, P1-6), HISTORIQUE.md (« Navigation de la visite »). Le mode `?shoot=1` garde son rendu, ses sondes, ses ombres, son champ de vision et son pas de temps.

**Fait dans le moteur** :
- i/s : chaîne pleine qualité inchangée à l'arrêt, chaînes de mouvement préallouées ; régulateur à paliers (rapport de pixels, MSAA, bloom) qui vise la cadence réelle de l'écran ; barrière GPU qui limite la file d'images ; pleine qualité 180 ms après le dernier mouvement. Détail côté réglage par appareil : L4-12.
- Pas de temps plafonné (0,1 s marche et regard, 0,05 s portes), sous-pas de 50 ms pour les trajets.
- Clic : `clickTarget` (sol, autre côté d'une porte, pied d'un mur, d'un équipement ou du plafond ; jamais un placard, hors pièce ou autre niveau), anneau posé à la destination au survol, arrivée exacte au point visé s'il est libre (test `standable`), clic sur une marche à la hauteur de la rampe, clic sur un mur de la cage d'escalier mène au niveau de ce mur.
- Regard saisi 1:1 (0,05 °/px au lieu de 0,194), élan de 0,25 s, seuil de 5 px à la souris et 10 px au doigt, clic droit et second doigt neutralisés.
- Trajets : départ à 1,35 m/s, jusqu'à 2,3 m/s au-delà de 5 m (0,9 sur une volée), lacet ≤ 115 °/s, tangage ≤ 55 °/s, redirection qui freine au-delà de 60°.
- Sondes de lumière capturées au chargement puis seulement à l'arrêt ; shaders compilés au chargement ; grilles construites au chargement.
- Portes : ouverture anticipée à 1,3 m en 0,3 s ; aide au passage seulement si l'on vise l'ouverture et qu'on va accrocher le tableau (0,7 m/s latéral au plus), jamais vers un mur, en longeant la baie ou sur une volée.
- Molette sans effet ; pincement du pavé tactile : zoom jusqu'au prochain arrêt ; champ vertical = clamp(2·atan(tan 40°/aspect), 45°, 75°).
- Ombres d'un vantail recalculées seulement à la fin de son mouvement.
- P1-6 : tangage des arrêts des petites pièces et de l'arrêt d'escalier en descente à −0,15 (`ARRET_PITCH_PETITE` dans `lire.py`, `niveaux.py`). 17 arrêts des 5 `plan.json` réels changeront au prochain réassemblage ; vérifié sur copies (contrôle ok), `plan.json` réels non régénérés.

**Contrôles ajoutés à `moteur/controle.mjs`**, chacun vérifié en remettant le défaut : clic (grille 32×20 à chaque arrêt intérieur), regard à la souris réelle, portes (aucune aspiration, correction ≤ moitié du pas, passage de face décalé de 25 cm), régulateur (30 i/s sans baisse, une image sur deux manquée fait baisser, 120 Hz sans baisse), arrivée sur une marche à la hauteur de la rampe.

**Défauts de la réception corrigés** : aspiration par les portes (35/35 à d201, jusqu'à 3,75 m/s), aide des portes active sur l'escalier, porte de placard sans « placard » dans l'identifiant qui s'ouvrait seule, artefacts sombres en mouvement (occlusion en demi-résolution, retirée des images de mouvement), régulateur au plus bas à 30 Hz, latence du glisser continu (61 à 97 ms), pleine qualité jusqu'à 1,44 s après un trajet, survol qui passait l'image en palier bas, échec du contrôle sur la duplex réassemblée (P1-6).

## À faire
1. Restes mesurés, à corriger ou à accepter avec l'utilisateur :
   - écart ≤ 2/255 avec l'image d'arrêt actuelle : non atteignable, l'ancien moteur contre lui-même dépasse déjà 2/255 sur 4,3 % des pixels (critère à redéfinir, voir PLAN.md § 2.2) ;
   - démarrage : une image à 50,1 ms (duplex, Mac, premier tour) sur 1 exécution sur 27 ; 3 relances propres ;
   - portable modeste simulé, duplex : glisser continu p50 46,1 ms et premier mouvement après clic 45,7 ms (seuil de 45 ms fixé pour le Mac) ;
   - clic sur le ciel pendant un trajet (d201) : 15,6 m/s² pour 15 visés, probablement un virage de l'itinéraire à 2,3 m/s ;
   - barrière GPU : en trajet, images réellement rendues jusqu'à 35 à 48 ms (intervalles rAF ≤ 29 ms) ;
   - hors critère : bascule maquette ↔ visite au téléphone, une image de 300 ms (déjà 300 ms avant) ; changement d'heure, 1 à 2 images de 50 à 133 ms ;
   - marche contre les murs de l'Entrée : caméra 2 à 4 cm dans l'embrasure de la porte palière (défaut antérieur, dans la tolérance de 4 cm) ;
   - traversée des portes-fenêtres larges : 0 à 0,71 m/s latéral ;
   - molette : ne zoome plus (les souris à molette perdent le zoom) ; pincement à deux doigts sur téléphone sans effet.
2. P1-6 incomplet : régénérer les `plan.json` réels au prochain réassemblage (17 arrêts) ; « arrêt au seuil avec le regard vers l'intérieur » non fait.
3. Cas de banc ou contrôle manquant pour : artefacts du palier bas, latence du glisser continu, retour en pleine qualité après un trajet, survol en palier bas, porte de placard sans « placard » dans l'identifiant. À ranger dans le banc de L1-14 (`outils/fluidite.mjs`, pas encore écrit) ou dans `controle.mjs`.
4. Essayer sur un vrai portable d'entrée de gamme et un vrai téléphone : l'émulation (processeur ×4, ×12) ne ralentit pas le GPU du M3. Mémoire GPU des chaînes de mouvement gardées (jusqu'à environ 5 sur écran Retina) non mesurée sur GPU à mémoire partagée.
5. Rejeu L1-02 : `plan.json` identiques hors tangages P1-6 (écart voulu) ; écarts d'images voulus approuvés explicitement (L1-11 s'il existe).
6. Validation par l'utilisateur, sur sa machine et sur les appareils modestes de référence ; commit.

## Critères d'acceptation
- [ ] Banc de L1-14 au-dessus des seuils décidés, sur tous les profils. Seuils non décidés, banc non écrit. Mesuré contre les critères du diagnostic (Mac M3 1440×862 DPR 2, économiseur d'énergie coupé ; portable modeste simulé 1920×1080 DPR 1 processeur ×4 ; téléphone émulé 390×844 DPR 3 processeur ×4 ; d201, T2, duplex) :
  - débit en mouvement, Mac : p50 16,7 ms, p95 ≤ 16,8 ms, max ≤ 29,2 ms (avant : p50 50 à 67 ms, 15 à 20 i/s) ; modeste : p50 16,7, p95 ≤ 16,8, max ≤ 33,4 ms ; téléphone (trajet) : p50 16,7, max ≤ 33,3 ms ;
  - latence, Mac : clavier p50 41,5 à 52,8 ms, p95 55,4 à 60,1 ms (seuils 55 et 70) ; glisser continu p50 22,1 à 40,2 ms (seuil 45 ; avant 61 à 96) ; modeste : 24,1 à 46,1 ms ; téléphone : 21 à 23 ms ;
  - premier mouvement après un clic au sol, p50 : Mac 16,8 à 20,1 ms, modeste 20,4 à 45,7 ms, téléphone 37,2 à 40,3 ms (seuil 50 ; avant 113 ms sur Mac) ;
  - vitesse : 1,35 m/s et 91,7 °/s sur Mac et en modeste (cible 1,35 ± 0,05 m/s, 92 ± 4 °/s) ;
  - pleine qualité après le lâcher : 183 à 204 ms après un trajet (18 trajets), 62 à 66 ms après un glisser (seuil 300 ms) ;
  - démarrage : 0 image > 50 ms sur 26 exécutions sur 27, une à 50,1 ms ;
  - clic : 100 % d'actions à tous les arrêts sur Mac, 96,8 à 100 % au téléphone (avant : 0 à 40 %) ; 0 placard ; 0 écart > 1 cm au point libre ;
  - regard : point saisi ≤ 1 px (souris), 1,9 px (doigt) ; aucun geste à deux effets ; clic droit 0 m ;
  - trajets : durée ≤ +0,16 s, 10 premiers cm ≤ 87 ms, lacet 115 °/s, tangage ≤ 55 °/s, décélération ≤ 6,3 m/s², redirection ≤ 6,2 m/s² ;
  - portes : 100 % à 0° et à 30° sur les départs dégagés (3 plans), aucune traversée en visant le mur ;
  - écran à 30 et 20 i/s : palier 0 gardé (avant : palier le plus bas).
- [x] Visite de contrôle réussie sur les 5 références ; photos au niveau du bruit : nouveau contre ancien moteur ≤ 4,22 % des pixels au-delà de 2/255 (max 77), ancien contre ancien 4,31 % (max 73). Aucune photo n'est identique à l'octet, pas plus d'une exécution de l'ancien moteur à l'autre. `finalise.sh` sur copies de d201 et de la duplex : contrôle ok au 2e tour, après une réparation de la chaîne sans lien avec la navigation.
- [ ] Plans à plusieurs niveaux : montée et descente au clavier réussies (réception : saut vertical ≤ 3 cm par image ; contrôle `escalier` ok sur la duplex). Déport de 3 m/s vers la salle de bain en montée corrigé (aide des portes coupée sur une volée), sans nouvelle mesure chiffrée au clavier après correction. Au doigt : aucun résultat chiffré, et pas de cas de banc (banc de L1-14 non écrit).
- [ ] Chaque défaut corrigé a son cas de banc ou son contrôle, vérifié en remettant le défaut : fait pour le clic, le regard, les portes, le régulateur à 30 i/s et le clic sur une marche (moteur de HEAD ou copies mutées : clic 0 à 48 %, 138 à 531 arrivées dans un placard, 16 signalements d'aspiration, 5 paliers perdus à 30 i/s, « 2 clics hors des pièces ») ; manquant pour les défauts listés au point 3 de l'À faire.
- [ ] Validation écrite et datée de l'utilisateur.
- [ ] Critère de fusion de PLAN.md § 10 (L1-02, L1-11, L1-04 et banc de L1-14 pas encore disponibles). Aucune lecture payante : tenu.

## Points d'attention
- Travail fait sans commit, sur le moteur non commité qui porte les niveaux : partir du commit qui intègre les deux ; petits diffs.
- Le ticket a aussi touché `pipeline/lire.py` et `pipeline/niveaux.py` (tangage des arrêts, P1-6), hors de la colonne « Touche ».
- Mesures sur un seul Mac M3. Chrome plafonne à 30 i/s sous 20 % de batterie (économiseur d'énergie) : il a été coupé dans un profil de test pour mesurer à 60 i/s.
- Le palier de mouvement est gardé dans le navigateur (clé `visite.qualite-mouvement.2`) ; un appareil qui accélère ne remonte que par essais successifs.
- `controle.mjs` dure environ 7 s de plus par plan.
- Chargement de la visite plus long de 0,35 à 0,9 s (grilles, sondes, shaders, chaînes de mouvement), derrière l'écran de chargement.
- Les photos du serveur sortent du même moteur : une baisse de qualité pour gagner des i/s ne vaut que pour l'écran du client. La qualité adaptative complète relève de L4-12.
- Ne pas toucher au mode simple (R16, L4-11).

## Références
- CLAUDE.md ; PLAN.md § 2.1 (décision 12) ; rapport de L1-14 ; HISTORIQUE.md (« Navigation de la visite (27/09/2026) »).
- moteur/engine.js (`clickTarget`, `planTo`, `standable`, régulateur `aq*`, barrière GPU, aide des portes), moteur/ui.js, moteur/controle.mjs (contrôles de clic, de regard, de portes, du régulateur) ; pipeline/lire.py (`ARRET_PITCH_PETITE`), pipeline/niveaux.py ; outils/trajets.mjs, outils/marche.mjs.

## Hors périmètre
- Qualité adaptative (textures, résolution, effets selon l'appareil) : L4-12. Précalcul d'éclairage et maquette compressée : L4-13, L4-14.
- Optimisations inspirées des jeux vidéo (demande du 27/09/2026) : culling par pièces et maquette découpée (L4-17), textures compressées et niveaux de détail (L4-18), après ce ticket et L4-12.
- Mode 360° : L1-16 (mesure), puis L4-15, L4-16.
