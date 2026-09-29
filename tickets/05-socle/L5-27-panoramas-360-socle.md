# L5-27 · Panoramas 360° dans le socle : rendu, marquage, publication, partage

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P1 | M (1 à 3 j) | L4-15, L4-16, L5-11, L5-12, L5-13 | `service/` | À faire |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 15) : un mode 360° à chaque arrêt, dans toutes les visites. Le socle doit donc rendre les panoramas après le contrôle, les marquer, les publier et les servir. Ce sont des images rendues par le serveur : elles suivent les mêmes règles que les images d'aperçu (visite de contrôle d'abord, marquage, contrôle automatique, omission sans blocage, R2). Ils servent dans la visite payante (vue propriétaire, partages, pages prospects) et, si l'offre gratuite devient le 360°, dans la page gratuite. Pour la page gratuite, rien de la visite n'est envoyé : ni moteur, ni `plan.json`, ni maquette (décision n° 6, R4).

## À faire
1. **Contrat de rendu v2** (L5-10). Nouveau type d'image `panorama` (un arrêt, ses images), avec une URL signée d'écriture et un jeton de rappel par panorama. L'exécutant (`moteur/pano.mjs`, L4-15) produit aujourd'hui, par arrêt, un panorama équirectangulaire en 8192, 4096, 2048 et 512 px, plus `visite.json` et `controle.json` ; le worker les relit. À la réception, `service/rendu/verifier.py` contrôle chaque image : ni noire, ni uniforme, dimensions exactes, coutures sous le seuil de L1-16 (3 sur 255).
2. **Ordre**, à décider avec L0-04 : après les images d'aperçu ; ou avant les photos si le 360° devient l'offre gratuite. R2 tient : l'aperçu est publié dès la vue du dessus et le plan 2D.
3. **Marquage** : métadonnée XMP sur chaque face ; mention incrustée ou non, selon la décision de L4-07.
4. **Publication** : images sous `publie/p/<préfixe>/pano/<arrêt>-<largeur>.jpg` (nom proposé, calqué sur la sortie de L4-15) et plans de niveau `niveau-<k>.png`, par la liste blanche de L5-02. `visite.json` (arrêt, nom, niveau, position sur le plan du niveau, direction de départ, liens ; aucune géométrie) passe au filtre des textes ; `controle.json` n'est jamais publié. `publications.images` reçoit le type `panorama`.
5. **État public** (L5-11) : panoramas listés à leur rang. L'écran d'attente ne change pas tant que L6-03 ne les affiche pas (à décider).
6. **Pages** :
   - visite payante (L5-12) : elle charge la visionneuse (L4-16) ;
   - page gratuite `/a/<jeton>` (L5-13), si le 360° est retenu (L6-13) : elle ne sert que la visionneuse, `visite.json` et les images ;
   - CSP par adresse exacte de la visionneuse (ARCHITECTURE.md § 6.2).
7. **Échec** : un panorama en échec après ses nouvelles tentatives est omis (arrêt retiré de `visite.json`, liens recalculés : aucun point ne mène à un panorama absent), avec une alerte (L5-16). Ce n'est jamais une cause d'échec du plan, sauf décision contraire pour l'offre gratuite.
8. **Rejeu sans IA** (L5-17) : les panoramas se refont avec la version du moteur de la publication ; plans déjà publiés rattrapés à faible débit, sans lecture (ajout aux plans déjà livrés : à décider).

## Critères d'acceptation
- [ ] Témoin dans Compose, en SwiftShader : panoramas rendus, marqués, publiés ; visionneuse ouverte en vue propriétaire et par un partage ; le fichier des arrêts servi ne contient aucune coordonnée de mur ni de pièce (test).
- [ ] Page gratuite (si retenue) : aucune requête vers `engine.js`, `plan.json`, la maquette ou `/vendor/three` (interception) ; contrôle bloquant à chaque publication.
- [ ] Panorama en échec forcé : omis, aucun arrêt mort dans la visionneuse, alerte émise, publication non bloquée.
- [ ] Durées en conteneur comparées à L1-16, écart noté.
- [ ] Contrôle des textes (L1-04) sur `visite.json` et les pages ; aucun appel payant ; outil local inchangé.

## Points d'attention
- **État au 28/09/2026** : rendu, contrôles et visionneuse existent dans l'outil local (L4-15 et L4-16, en cours) ; les contrôles passent sur 4 références, le D201 est bloqué par le contrôle des placards tant que sa correction n'est pas publiée. Aujourd'hui, un panorama en échec fait échouer toute l'étape 360° : l'omission d'un seul arrêt (point 7) reste à écrire. Durée mesurée sur Mac en Metal, occlusion ambiante et 8192 compris : 34 à 104 s par plan, 6,8 à 16,3 Mo par plan (indicatif, machine partagée) ; sans carte graphique, l'estimation d'environ 3,5 min par panorama en 4096 (20 à 40 min par plan) date d'avant l'occlusion : à mesurer (L1-16). La visionneuse est autonome dans le dossier `pano/` (script `visionneuse.js`, plus de police tierce, contrôlée sous politique de contenu stricte) ; reste son emplacement en ligne (L4-16).
- Coût : dépend de la mesure de L1-16. Ne rien activer pour l'offre gratuite avant la décision de l'utilisateur.
- Priorité P1 ; elle passe en P0 si L0-04 retient le 360° pour l'offre gratuite ou pour la bêta fermée.
- Charge de rendu sur la VM partagée avec le web : limites de concurrence de L5-22, priorité derrière les images d'aperçu.
- Les panoramas viennent du plan du client : privés, jamais sur un CDN public sans jeton (ARCHITECTURE.md § 5.2).
- Mesure : un événement de fin de rendu (`panoramas_prets`) et la valeur `visite_360` de `visite_mode_choisi` s'ajoutent au dictionnaire dans la même modification que SUIVI.md ; sinon, on ne les émet pas.

## Références
- PLAN.md § 2.1 (décisions 6, 15) ; R2, R4.
- ARCHITECTURE.md § 2.3, § 5.2, § 5.3, § 6.2 ; L1-16, L4-07, L4-15, L4-16, L5-02, L5-10 à L5-13, L5-16, L5-17, L5-22.

## Hors périmètre
- Coût du rendu : L1-16. Page d'aperçu en 360° : L6-13. Écran d'attente : L6-03.
