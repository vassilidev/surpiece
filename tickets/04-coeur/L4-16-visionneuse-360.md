# L4-16 · Visionneuse 360° sans moteur et navigation d'arrêt en arrêt

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | M (1 à 3 j) | L4-15 | `moteur/` [M] | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 15) : un mode 360° à chaque arrêt, avec navigation d'arrêt en arrêt, dans toutes les visites. La visionneuse a deux usages :
- dans la visite payante (vue propriétaire, partages, pages prospects), un mode « 360° » à côté de la marche libre, fluide sur un appareil modeste (décision 12) ;
- si l'offre gratuite devient le 360° (décision de principe, à confirmer par L1-16), la page gratuite, qui ne reçoit ni le moteur ni `plan.json` (décision n° 6).
Elle ne doit donc rien importer du moteur.

## Ce qui est fait (28/09/2026)
Non commité, aucun appel payant ; `engine.js` et `ui.js` non touchés.
- **`moteur/pano.html` et `moteur/pano.js`** : page autonome qui ne lit que `pano/visite.json`, les panoramas et les plans de niveau (L4-15). Rendu en WebGL direct, sans bibliothèque 3D ni moteur. `pano.mjs` copie la page dans `plans/<id>/pano/index.html` et le script dans `pano/visionneuse.js` : **aucune requête hors du dossier `pano/`**, plus de police Google, fichiers versionnés (`?v=`), vérifié sous une politique de contenu stricte.
- **Champ de vision** (retour R1 de l'utilisateur, « on doit dézoomer ») : 105° en largeur par défaut sur ordinateur, 72° en largeur (115° en hauteur) sur téléphone en portrait ; seule référence trouvée : Pannellum, 100° (bornes 50–120°), pas les valeurs des sites d'annonces. Dézoom jusqu'à +20° en largeur (135° en hauteur au plus) ; zoom avant limité par la netteté. Écran tourné : niveau de zoom gardé (72° → 105° → 72°).
- **Regard** : l'image suit exactement le doigt ou la souris, avec une courte inertie ; flèches du clavier. **Pincement** corrigé : un écartement ×2,3 des doigts zoomait ×3,4 ; il suit maintenant les doigts (pincement, molette, clavier). **Gyroscope** sur téléphone, avec la demande d'autorisation d'iPhone.
- **Netteté** : panorama 8192 chargé sur ordinateur quand l'écran le demande, densité d'écran jusqu'à 3 ; agrandissement mesuré 1,21 sur ordinateur rétine, 1,43 sur téléphone (4096).
- **Navigation** : cercles au sol vers les arrêts voisins (14 px de haut au moins), nom au survol et, sur téléphone, nom du cercle le plus proche du centre ; cercles atteignables au clavier (Tab, Entrée). **Transition** : zoom de 20 % au plus vers l'horizon, fondu, puis rotation douce vers le regard d'arrivée (`lien.arrivee`, L4-15) ; le panorama d'arrivée apparaît à 40° au plus de son regard final (avant, un demi-tour de 165° balayait le mur voisin pendant le fondu). Petit plan du niveau avec les arrêts et le cône de vue (réduit dans l'écran en paysage), onglets de niveau, liste des pièces, plein écran (caché sur iPhone), mode sombre, animations réduites si l'appareil le demande. Cibles tactiles de 44 px.
- **Mention « Illustration non contractuelle »** toujours visible, sur un fond (contraste 5,7:1) ; aucun texte technique ; les boutons cachés le restent (gyroscope sur ordinateur, plein écran sur iPhone).
- **Chargement progressif** : aperçu de 512 px d'abord, puis l'image nette dès son arrivée ; voisins chargés ensuite. Réseau lent simulé : image de 2048 ou plus en 3,3 s.
- **Événement** `visite:evenement` (pièce vue) émis à chaque arrivée, sans outil de mesure dans le script.
- **Contrôles automatiques** (`moteur/pano-visionneuse.mjs`, appelé par `pano.mjs`), dossier servi sous politique de contenu stricte : ordinateur 1 440 × 900 (image jamais noire, cercles au bon endroit à 0,32 px près sur le T2, regard d'arrivée appliqué, champ ≥ 100°, aucune requête hors du dossier, aucune erreur ni avertissement, moteur absent, mention lisible) ; ordinateur rétine et téléphones iPhone et Android émulés 390 × 844 (définition, champ ≥ 65°, taille des cercles, écran tourné, plein écran caché) ; **vrais gestes tactiles** (glisser, pincer ×2 → ×2, toucher un cercle, toucher à côté) ; robustesse (images ou voisin absents, perte du contexte WebGL, adresse inconnue, un seul arrêt, plan absent, retour du navigateur, réseau lent). Passent sur les 4 plans publiés ; le D201 est bloqué par le contrôle des placards de L4-15.
- **Cas limites essayés** avec un `visite.json` modifié : trois niveaux, départ au niveau haut, un seul arrêt, nom de pièce long ; aucune erreur.
- **Servie par l'outil local** : `pipeline/serveur.py` n'expose que la page, `visite.json`, `visionneuse.js` et les images (jamais `controle.json`), et ne sert plus `page.png`. **Le serveur du port 8780 tourne encore avec l'ancien code** (vérifié à 16 h 20 : `visionneuse.js` renvoie 404, donc aucune page 360° ne s'affiche tant qu'il n'est pas relancé).

## Bouton 360° dans la visite (29/09/2026, retour R4)
Demande de l'utilisateur, mot pour mot : « Il faut également proposer le mode de caméra 360 également dans les boutons ». Fait (non commité), vérifié de façon indépendante le 29/09/2026 :
- bouton « 360° » à côté de Plan 2D, Maquette 3D et Visite (tient à 390 px), montré seulement si `pano/visite.json` existe ; il ouvre la visionneuse au point de vue de la pièce où l'on se tient (sinon le plus proche du niveau), regard gardé (`&cap=`) ;
- bouton « Visite 3D » (« 3D » sur téléphone) de la visionneuse, seulement quand elle vient de la visite : retour au même point de vue, même regard, sans galerie ; `visite.json` porte la position de chaque point de vue (`pos`, une position, aucune géométrie) ;
- contrôles : `controle.mjs` (bouton vers le point de vue de la même pièce depuis chaque arrêt, puis aller-retour réel par clics, écart 0,00 m sur les 5 plans) et `pano-visionneuse.mjs`. Le point 3 ci-dessous est donc tranché : page qui bascule vers la visionneuse.

## À faire
1. **Redémarrer le serveur du port 8780** (non fait par l'agent : au démarrage, il marque comme interrompus les traitements en cours), puis vérifier une page 360° servie.
2. **Script publié à part** du moteur pour la page gratuite : le dossier `pano/` est autonome ; reste l'emplacement en ligne (par exemple `cdn.<domaine>/app/panorama/v<N>/`) et sa version.
3. ~~**Visite payante** (`moteur/ui.js`) : mode « 360° » ajouté aux modes existants ; passage 360° ↔ marche libre au même arrêt.~~ Fait le 29/09/2026 (voir plus haut) ; reste l'offre gratuite, où la visionneuse n'a pas de retour vers une visite 3D qu'elle ne charge pas.
4. **Textes** `apercu.360.*` du catalogue (MESSAGES.md § 7.5) et texte de la mention de L4-07 à la place des textes écrits dans la page.
5. **Contrôles à compléter** : test négatif (une page qui charge `plan.json` doit échouer) ; i/s sur le profil « appareil modeste » (L1-14) ; captures de la mention à 1 280, 375 et 320 px ; parcours au clavier seul et mouvement réduit émulé, vérifiés par un essai.
6. **Vrai téléphone** : gyroscope, mémoire WebGL de Safari sur iPhone, rendu et réseau réels, seulement essayés en émulation.
7. **Repli sans WebGL** : une version sans WebGL (CSS 3D) n'existe pas. À décider avec L4-10.

## Critères d'acceptation
- [ ] Témoin, 4 références et duplex 3081-613 : tous les arrêts atteignables, onglets de niveau sur la duplex, mention visible à 1 280, 375 et 320 px. Fait sur 4 plans (contrôle automatique à 1 440 et 390 px) ; D201 bloqué par son placard (L4-15) ; témoin et largeurs 1 280, 375 et 320 px manquants.
- [ ] Page sans moteur vérifiée par interception : aucune requête hors du dossier `pano/` (fait, contrôle automatique sous politique de contenu stricte) ; test négatif : une page qui charge `plan.json` échoue (non fait).
- [ ] Parcours au clavier seul ; mouvement réduit émulé sans animation (prévus dans le code, non vérifiés par un essai).
- [ ] Fluide sur le profil « appareil modeste » (seuils de L1-14) et sur un téléphone réel.
- [ ] Visite payante : aller en 360° puis revenir à la marche libre, sans erreur à la console ; rejeu L1-02 : photos à moins de 2/255.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 (non commité) ; aucune lecture payante (tenu).

## Points d'attention
- Priorité P1 : elle passe en P0 si le 360° devient l'offre gratuite ou entre dans la bêta fermée (à décider).
- Les panoramas montrent ce que la visite montrerait depuis ces points : c'est l'objet même de la décision de principe. Aucune géométrie ne part : `visite.json` ne contient que les arrêts, leurs noms, niveaux, positions sur le plan du niveau, directions et liens.
- Duplex : il n'y a plus d'arrêt « Escalier » à 40 cm de l'Entrée (corrigé le 28/09/2026 dans `niveaux.py`, L4-15) ; l'Entrée porte le lien « monter ».
- Dans les impasses (retour vers l'entrée d'un couloir), le demi-tour d'arrivée reste grand ; la transition le masque en faisant apparaître le panorama à 40° au plus de son regard final.
- Marque du cabinet sur les pages prospects : lue dans `reglages.json` (L9-06), proposition.

## Références
- PLAN.md § 2.1 (décisions 6, 12, 15) ; R4.
- `moteur/pano.html`, `moteur/pano.js`, `moteur/pano-visionneuse.mjs` (contrôles de la visionneuse) ; `pipeline/serveur.py` (fichiers servis) ; `pipeline/accueil.html` ; moteur/ui.js (puces des arrêts, modes) ; ARCHITECTURE.md § 5.3, § 6.2 ; L4-07, L4-15, L1-14.

## Hors périmètre
- Rendu des panoramas : L4-15. Publication et partage : L5-27. Page d'aperçu en 360° : L6-13.
