# L1-14 · Diagnostic chiffré de la navigation et banc de fluidité

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | — | `outils/` | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 12) : la visite doit être fluide sur un appareil modeste (portable d'entrée de gamme, téléphone), pas seulement sur une machine puissante. Sa plainte : « pas assez fluide, je passe ma vie à essayer de bien cliquer / bien me déplacer, pas assez de FPS, le POV est étrange, le regard a du mal ». La visite se calcule dans le navigateur du client (décision n° 5) : sa fluidité fait partie du produit. Un diagnostic chiffré est en cours. Ce ticket le cadre et en fait un contrôle réutilisable : sans mesure, on ne sait ni quoi corriger (L1-15, L4-12) ni si une correction tient. L4-10 ne mesure que le poids et la première image, ni les images par seconde en marche ni les clics.

## Avancement (27 et 28/09/2026)
- **Diagnostic** du 27/09/2026 (premiers chiffres en Points d'attention) : il a servi de base aux corrections de L1-15 et au régulateur de L4-12.
- **Mesures avant/après** faites pour L1-15, L4-12, L4-17 et L4-18, chaque fois par l'implémentation puis par une réception indépendante avec ses propres scripts. Chiffres dans ces tickets. Plans : d201, T2 et duplex pour les mesures ; les 5 références pour la non-régression (et pour la visibilité, L4-17). Profils :
  - Mac M3 avec écran, 1440×862, DPR 2 ;
  - portable modeste simulé : 1920×1080, DPR 1, processeur ×4 (plus un stress à ×12) ;
  - téléphone émulé : 390×844, DPR 3, tactile, processeur ×4 ;
  - rendu logiciel (SwiftShader), 1280×720.
- **Mesuré** : intervalles d'images (rAF indépendant du moteur), temps d'image par palier, appels de dessin, triangles, mémoire GPU estimée, temps jusqu'à la visite prête ; latence entrée → image GPU finie (readPixels) ; premier mouvement après un clic ; clics réels en grille ; regard à la souris et au doigt réels ; trajets (lacet, tangage, décélération, durée) ; passages de portes ; escalier ; utilisateur pressé ; écran limité à 30 et 20 Hz ; démarrage.
- **Scripts** : seulement dans le dossier temporaire de la session (`scratchpad/nav/impl`, `nav/recep`, `nav/fix`, `jeux/`, `jeux/recep`, `jeux/corr/perf`), pas dans `outils/`. `outils/fluidite.mjs` n'existe pas.
- **Constats de méthode** :
  - l'émulation (processeur ×4 ou ×12) ne ralentit pas le GPU du M3 : aucun profil actuel ne représente un GPU faible, hors rendu logiciel ;
  - Chrome plafonne à 30 i/s sous 20 % de batterie (économiseur d'énergie). Il faut le couper dans un profil de test (fichier Local State) et mesurer sur secteur : sur batterie, les mesures en rendu logiciel dérivaient de 50 % ;
  - d'autres Chrome qui tournent en même temps faussent les chiffres. Mesures faites en alternant ancien et nouveau moteur ;
  - incidents de banc non attribués (3 chargements bloqués à 300 s, un contexte détruit), non reproduits sur 48 chargements dédiés.

## À faire
1. **Script `outils/fluidite.mjs`** (nouveau, dépendances de L1-07), à reprendre des scripts de mesure de la session avant leur disparition. Il rejoue des parcours fixes par les poignées existantes (`window.__v`, `App.set`) et sort un tableau par plan et par profil :
   - arrêts de la visite guidée et trajets d'`outils/trajets.mjs` ;
   - clics au sol et sur les portes ;
   - rotation du regard ;
   - montée d'escalier, au clavier et au doigt.
   Même serveur que `outils/vues.mjs` ; passage par `moteur/chrome.mjs` quand L1-01 et L1-09 existent.
2. **Mesures** encore à faire :
   - sur le plan du lot et le 3124 (seulement non-régression et visibilité aujourd'hui), et sur le témoin quand il existe (L1-12) ;
   - i/s en maquette ;
   - point de vue (hauteur des yeux) ;
   - temps pour aller de l'entrée à chaque pièce.
3. **Profils** : processeur ×6 à taille de téléphone, non mesuré. Surtout, des appareils modestes réels, dont les modèles sont à décider avec l'utilisateur (proposition : un portable d'entrée de gamme, un téléphone Android d'entrée de gamme de 2 à 3 Go, un iPhone ancien encore mis à jour).
4. **Rapport daté** : consolider en un seul endroit les chiffres dispersés dans L1-15, L4-12, L4-17 et L4-18, avec ce qui coûte encore le plus. Sur Mac, l'occlusion ambiante fait 36 à 40 ms des 57 à 63 ms d'une image à l'arrêt (mesure du 28/09/2026, avant L4-17).
5. **Seuils** : proposer à l'utilisateur un seuil d'i/s et de délai de clic par profil. Une fois décidés, les écrire en tête du script avec leur date : le banc échoue sous le seuil. En CI, seulement des seuils relatifs (aucune baisse des i/s au-delà d'un pourcentage à fixer, processeur ralenti) : à brancher avec L1-11.

## Critères d'acceptation
- [ ] Tableau des mesures sur les 5 références et les profils ; deux passages successifs donnent des chiffres proches (écart noté).
  - Fait sur 3 références seulement (d201, T2, duplex), 4 profils, 2 passages en alternance.
  - Écart entre deux mesures indépendantes : latence clavier p50 de 27 à 31 ms à l'implémentation, 34 à 52 ms à la réception (L1-15). Temps de l'image la plus légère en rendu logiciel : −6 à −54 % annoncés, −30 à −43 % remesurés (L4-17).
- [ ] Chaque défaut de navigation relevé a un cas dans le banc, qui échoue sur l'état actuel. Banc non écrit. Une partie des défauts a un contrôle dans `moteur/controle.mjs` (clic, regard, portes, régulateur, marche ; voir L1-15).
- [ ] Appareils de référence et seuils décidés par l'utilisateur, écrits en tête du script avec leur date.
- [ ] Test négatif : une version volontairement ralentie du rendu fait échouer le banc.
- [ ] Aucune modification de `moteur/` ni de `pipeline/` ; aucune lecture payante ; rapport sans image d'un plan réel. À vérifier à la livraison du script. Les mesures déjà faites n'ont rien payé.

## Points d'attention
- Reprendre les mesures du diagnostic déjà commencé, sans les refaire. Premiers chiffres du 27/09/2026, Mac M3 Retina : 16 à 18 i/s (8 à 10 en marchant sur la duplex) ; goulot au remplissage de pixels (GTAO en pleine résolution : 47 à 51 % du temps d'image, MSAA 4× : 28 à 31 %, rapport de pixels 1,75), pas à la géométrie (environ 220 appels de dessin, 220 000 triangles) ; 6 lampes à ombre ; murs fusionnés en un maillage par matériau ; textures générées au chargement ; sur la duplex, masquer l'autre niveau hors de la volée et de la trémie fait gagner 12 %.
- Critère des optimisations inspirées des jeux vidéo (demande du 27/09/2026, décision 13 ; L4-13, L4-17, L4-18) : 60 i/s sur le profil « appareil modeste » simulé (processeur ralenti ×4, écran non Retina) et sur le profil téléphone. Le banc garde ces deux profils.
- SwiftShader ne représente pas un appareil modeste réel : ne jamais s'en servir comme seul profil. Les seuils absolus se vérifient sur appareils réels.
- Les photos du serveur sortent du même moteur : le rapport distingue ce qui touche l'écran du client de ce qui toucherait aussi les photos.
- Le rendu en direct sur le serveur (streaming vidéo) est écarté par l'utilisateur pour son coût : ne pas le proposer comme parade.
- La duplex est un plan de promoteur : jamais en CI, jamais versionnée.

## Références
- CLAUDE.md (visite fluide sur un appareil modeste) ; PLAN.md § 2.1 (décisions 12 et 13).
- moteur/engine.js (rapport de pixels l. 37, `App.coarse`, sondes de lumière, ombres, occlusion ambiante) ; moteur/ui.js ; moteur/controle.mjs (relevé des i/s pendant la marche) ; outils/vues.mjs, outils/marche.mjs, outils/trajets.mjs.

## Hors périmètre
- Corrections : L1-15. Qualité adaptative : L4-12. Précalculs : L4-13, L4-14. Culling par pièces et textures compressées : L4-17, L4-18. Mode 360° : L1-16, L4-15, L4-16.
