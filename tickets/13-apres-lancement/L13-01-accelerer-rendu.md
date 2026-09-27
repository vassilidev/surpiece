# L13-01 · Accélérer le rendu

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P1 | M (1 à 3 j) | L5-10 | `moteur/` [M], `service/` | À faire |

## Pourquoi
Décision n° 4 : le rendu doit fonctionner partout ; Chrome en SwiftShader dans un conteneur sans GPU est la base, par défaut et partout (VM en Docker Compose), et la rapidité sera améliorée **après** la mise en ligne. **Tranché : R3.** Serverless Jobs, GPU ou Mac mini ne sont que des accélérations optionnelles, jamais obligatoires ; aucun composant propre à un hébergeur n'est requis pour que le service fonctionne. Les mesures du 27/09/2026 (Mac M3) donnent l'ordre de grandeur : 11 photos en 684 s en SwiftShader contre 60 s en Metal (× 11,4), 3 images en 215 s ; sur des vCPU de serveur, 1,5 à 2 fois plus (estimation). Accélérer sert l'attente de l'aperçu (L5-11), la galerie complète (L13-02), les imports de promoteurs (L10-02) et, plus tard, le réalisme (L13-05). On mesure avant, on change une seule chose, on mesure après.

## À faire
1. **Mesure avant** : protocole T0 de L5-11 (`outils/mesure_t0.sh`) sur la VM de production : durée par image (médiane et 9e décile), visite de contrôle, charge processeur et effet sur le temps de réponse du web (avec L5-22).
2. **Voie 1 : une tâche par image, en parallèle, sur l'exécutant en conteneur** (L5-10) :
   - `photos.mjs` accepte déjà une liste de vues (`moteur/photos.mjs:12`) : la tâche ordonnée est découpée en tâches d'une vue ;
   - chaque tâche dans son propre dossier de travail : `photos.mjs` réécrit `plan.json` quand une vue est écartée (`:112-116`), ce qui ne doit jamais se faire en concurrence ;
   - nombre de tâches simultanées borné par les cœurs réservés au rendu ; mesurer le coût du chargement répété (moteur, sondes de lumière, `:81`, `:91-92`) contre le gain.
3. **Voie 2, optionnelle : un exécutant d'accélération hors de la VM**, derrière l'interface `Executant` de L5-10, choisi sur la mesure ; le rendu SwiftShader de la VM reste en place et reprend tout si cet exécutant disparaît :
   - Serverless Jobs en SwiftShader : aucun coût fixe, environ 0,10 à 0,15 € par plan (estimation), 6 vCPU et 16 Go au plus par exécution, 400 en parallèle ; `/dev/shm`, bac à sable de Chrome et polices à éprouver ;
   - Mac mini M4 loué à Paris : 149 € par mois (24 h minimum), Metal, code actuel tel quel, environ 1 min pour 11 photos mesurée sur M3 ; rendu sans écran à valider ; macOS à administrer ;
   - GPU L4 : 0,79 € de l'heure, options Vulkan (`--headless=new --use-angle=vulkan --enable-features=Vulkan --disable-vulkan-surface`, pilotes NVIDIA), démarré à la demande quand la file dépasse un seuil.
   Au plus un exécutant retenu, seulement si la mesure le justifie ; les autres restent des options écrites.
4. **Côté `moteur/`**, petit diff isolé seulement si nécessaire : `RENDU_CHROME=vulkan` dans `moteur/chrome.mjs` (L1-09) ; option de `photos.mjs` qui écrit la liste des vues écartées dans un fichier au lieu de réécrire `plan.json`.
5. **Équivalence visuelle bloquante** pour tout nouvel exécutant : contrôle d'aptitude de L5-10 (3 vues fixes et plan 2D du témoin contre les images approuvées : écart moyen au plus 2/255, au plus 0,05 % des pixels au-delà de 16/255) ; contexte WebGL absent ou texture noire : exécutant inapte, tâches renvoyées à SwiftShader.
6. **Repli** : exécutant accéléré indisponible → bascule automatique sur le rendu SwiftShader de base, sans erreur visible pour l'utilisateur.
7. **Mesure après**, même protocole ; décision écrite (gain, coût mensuel, coût par plan) ; délai affiché (marqueur ‹délai›, R12) remis à jour sur la nouvelle mesure en production (L5-11, point 9), jamais sur une estimation.

## Critères d'acceptation
- [ ] Tableau avant et après consigné (médiane et 9e décile par image, coût par plan, coût fixe).
- [ ] Images de l'exécutant retenu dans les seuils de L5-10 sur le témoin ; exécutant tué pendant un rendu : repli SwiftShader et images livrées.
- [ ] Aucun secret dans l'exécutant (environnement inspecté) ; aucune lecture payante pour tester (lectures gardées, `PLAN_MOCK`).
- [ ] Diff `moteur/` éventuel : critère de fusion d'ARCHITECTURE.md § 8.1 (rejeu des 4 références identique, visite de contrôle, contrôle des textes, fumée de l'outil local) ; outil local inchangé (Metal par défaut sur macOS).
- [ ] Tout défaut d'image trouvé devient un contrôle d'aptitude ou de réception.

## Points d'attention
- **Décision n° 4** : l'accélération n'est jamais un prérequis ; tout doit rester juste sans elle.
- **Taille** : M couvre la mesure, la voie 1 et un seul exécutant de la voie 2 ; un deuxième exécutant fera un ticket séparé.
- **Point de bascule estimé** : SwiftShader en Serverless Jobs est le moins cher jusqu'à 1 000 à 1 500 plans par mois ; au-delà, Mac mini ou GPU (recherche/hebergement.md § 2.3).
- **Sécurité** : SwiftShader compile du code à la volée et `plan.json` contient des textes issus du plan déposé : conteneur isolé, sans secret (hebergement.md § 2.2).
- **Tranché : R3.** ARCHITECTURE.md D3 est tranchée (SwiftShader en conteneur, par défaut et partout) ; l'essai M2.7a n'est plus qu'une mesure informative (L5-10). Ce ticket ne décide donc pas du rendu de base, seulement d'une accélération facultative.
- Coordination avec le travail sur les duplex : `photos.mjs` a une logique propre aux plans à plusieurs niveaux (`:80-90`) ; ne pas la toucher.

## Références
- produit/ARCHITECTURE.md D3, § 2.1 (worker rendu), § 9.2, M2.7a, M2.7b ; produit/recherche/hebergement.md § 2.1 à § 2.3, § 6, § 11.
- produit/OFFRES.md § 9.2 (T0).
- `moteur/photos.mjs:12` (liste de vues), `:24` (serveur statique), `:31` (lancement Metal), `:81`, `:91-92` (sondes), `:80-90` (plusieurs niveaux), `:107` (écriture d'une image), `:112-116` (vues écartées).

## Hors périmètre
- Exécutant de base et contrat de rendu : L5-10. Ordre de livraison et délai affiché : L5-11. Galerie complète : L13-02. Réalisme et 4K : L13-05. Capacité et limites de processeur : L5-22.
