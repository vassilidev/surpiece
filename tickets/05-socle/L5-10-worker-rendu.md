# L5-10 · Worker de rendu en conteneur et contrôle du rendu

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L1-09, L1-11, L1-12, L4-06, L4-09, L5-02, L5-06 | `service/` | À faire |

## Pourquoi
Décision du 27/09/2026 : le rendu doit fonctionner partout ; **Chrome en SwiftShader dans un conteneur sans GPU est la base**, pas une option dégradée ; la vitesse sera améliorée après la mise en ligne. Au lancement, le serveur rend la visite de contrôle et les images d'aperçu (vue du dessus 3D découpée, plan 2D coté, 2 photos), la visite étant calculée dans le navigateur du client. Décisions de l'utilisateur prises ensuite, le 27/09/2026 : panoramas 360° à chaque arrêt dans toutes les visites (décision 15), et précalcul côté serveur (éclairage, maquette compressée, itinéraires ; décision 14). Le rendu en direct sur le serveur (streaming vidéo) est écarté pour son coût. Ce ticket livre le contrat v1 (images d'aperçu), versionné pour que les panoramas (L5-27) et le précalcul (L5-28) l'étendent. Mesures du 27/09/2026 : images SwiftShader identiques à Metal (écart moyen 0,64 à 0,72/255), environ 11 fois plus lentes ; visite de contrôle 13 à 14 s. Ce ticket livre l'exécutant de rendu en conteneur, sans secret, son contrat, et les contrôles qui bloquent toute image défectueuse.

## À faire
1. Visite de contrôle dans l'image `worker-lecture` (étape `controler` de L5-06) : Chrome for Testing figé, `RENDU_CHROME=swiftshader` (module `moteur/chrome.mjs` de L1-09), polices installées, `/dev/shm` d'au moins 1 Go, processus lancé avec un environnement réduit (aucune variable secrète, ARCHITECTURE § 6.7). Échec si le contexte WebGL n'est pas créé ou si le moteur ne démarre pas (déjà bloquant dans `controle.mjs`). Tous les contrôles de `controle.mjs` restent bloquants tels quels, dont ceux ajoutés le 27/09/2026 : test d'immersion `etancheite`, `baie` (recoupée avec le sigle de la légende de son plan), `garde-corps`, `escalier`, `vide`, `niveau`, `dalle`, `cloison`, `menuiserie`, `rebord`, `lumiere`, `maquette`, `texte`.
2. Exécutant de rendu, service Compose `rendu` (image de L5-01), sur la même VM au lancement, limité en processeur (`cpus`, à régler avec L5-22) :
   - petit serveur HTTP `POST /taches`, joignable **seulement** sur le réseau interne de Compose, une tâche à la fois ;
   - aucun identifiant de base ni de stockage, aucune clé IA : seulement ce que la tâche apporte ;
   - utilisateur non root, système de fichiers en lecture seule, `/tmp` et `/dev/shm` en mémoire ; bac à sable de Chrome gardé avec un profil seccomp adapté, `--no-sandbox` seulement si l'essai échoue, et consigné ;
   - sorties réseau limitées au stockage et au point de rappel (réseau interne et mandataire à liste blanche, ou règles du pare-feu de la VM).
3. Contrat de rendu, version 1, écrit dans `service/rendu/CONTRAT.md` :
   - entrée : `travail_id`, `moteur_version`, URL signée de lecture de `plan.json`, liste **ordonnée** d'images (`vue_dessus`, `plan_2d`, `photo_1`, `photo_2`, mêmes noms que L5-11 ; vues choisies par L4-09), et pour chaque image une URL signée d'écriture dans l'espace privé et un **jeton de rappel à usage unique** (256 bits, stocké haché, ARCHITECTURE § 6.3), délai maximal ;
   - l'exécutant charge la page une fois, rend les images dans l'ordre avec `moteur/photos.mjs` (liste de vues de L4-09), téléverse chaque image dès qu'elle est prête et rappelle aussitôt `POST /api/interne/rendu/rappel` avec son jeton : vue, statut (`ok`, `ecartee`, `echec`), empreinte, taille, durée, moteur WebGL relevé, luminance mesurée par `grab` ;
   - un dernier rappel donne les vues écartées (`photos.mjs` les retire aujourd'hui de `plan.json`, `moteur/photos.mjs:112-116`) : l'exécutant ne réécrit jamais `plan.json` dans le stockage, le worker-lecture applique ;
   - le moteur est celui de l'image ; si `moteur_version` diffère, refus (`rendu_version`) et le travail repasse par la visite de contrôle.
4. Côté service : `service/rendu/executants.py`, une interface `Executant` et l'implémentation `ExecutantCompose` (Serverless Jobs, Mac mini ou GPU pourront s'ajouter derrière la même interface après le lancement, comme accélérations optionnelles, jamais obligatoires : L13-01, R3) ; tâche de la file `rendu` (L5-06) qui prépare les URL et les jetons ; route de rappel dans l'application web, qui vérifie le jeton en temps constant, le brûle, passe l'image au contrôle de l'étape 5 et l'enregistre dans `etapes.sorties`. Le marquage, la copie vers l'espace publié et l'état public sont faits par L5-11.
5. Contrôles de chaque image (« publication bloquée ») :
   - dans l'exécutant, seul endroit où c'est possible : contexte WebGL créé, moteur lu par `WEBGL_debug_renderer_info` conforme au rendu configuré (SwiftShader en conteneur) ; sinon statut `echec`, rien de téléversé ;
   - à la réception, par `service/rendu/verifier.py` (Python, Pillow), appelé par la route de rappel : pas de texture noire (luminance moyenne et part de pixels presque noirs dans des bornes par type d'image : photo, vue du dessus, plan 2D sur fond clair), image non uniforme, dimensions exactes, JPEG lisible, empreinte conforme au rappel.
   Une image qui échoue est refaite une fois après relance de Chrome, puis déclarée `echec` : jamais copiée dans l'espace publié, jamais montrée. La suite est celle de R2, appliquée par L5-11 : une photo en échec est omise sans bloquer (galerie adaptative, alerte à l'équipe) et n'est jamais une cause d'échec du plan ; pour un aperçu, une vue du dessus ou un plan 2D en échec empêche sa publication et rend le crédit (`plan_echoue`, `etape=images`, `cause=rendu_images`, SUIVI.md § 3.2).
6. Contrôle d'aptitude de l'exécutant, au démarrage puis toutes les 6 h : rendu des 3 vues fixes et du plan 2D du témoin fictif, comparés aux images approuvées de L1-11 (écart moyen au plus 2/255, au plus 0,05 % des pixels au-delà de 16/255). En cas d'écart, l'exécutant se déclare inapte (`/sante/pret` en 503), refuse les tâches, alerte ; les travaux restent en `attente_rendu` et suivent les délais d'OFFRES § 6.4.
7. Mesure informative (ancien M2.7a) : durée de chaque image et de la visite de contrôle sur la VM cible, en SwiftShader, enregistrée dans `etapes.duree_ms` et résumée dans le ticket. Les 13 à 14 s mesurées datent d'avant les contrôles ajoutés le 27/09/2026, dont le test d'immersion : mesure à refaire, sur un plan à un niveau et sur la duplex. La mesure officielle du délai affiché (T0) est faite par L5-11.

## Critères d'acceptation
- [ ] Témoin fictif en Compose : visite de contrôle réussie en SwiftShader dans `worker-lecture` ; les 4 images d'aperçu rendues dans l'ordre par `rendu`, chacune rappelée dès qu'elle existe.
- [ ] Images du témoin à moins de 2/255 des images approuvées (critère de M2.7b) ; contexte WebGL absent (Chrome lancé sans SwiftShader) → rien de téléversé ; image noire ou uniforme injectée → refusée par `verifier.py`, jamais publiée.
- [ ] Aucun secret dans le conteneur `rendu` : `env` inspecté, aucun identifiant S3 ni clé ; sortie vers un site quelconque refusée.
- [ ] Jeton rejoué, expiré ou falsifié → rappel refusé ; URL signée expirée → échec propre.
- [ ] Aucun texte technique dans ce qui remonte à l'état public ; aucune lecture payante pour tester (lectures gardées, `PLAN_MOCK`).
- [ ] Tout défaut de rendu trouvé pendant ce ticket ajoute un contrôle à l'étape 5 ou 6.
- [ ] L'outil local marche toujours (Metal par défaut sur macOS).

## Points d'attention
- Tranché : ARCHITECTURE § 2.3 et D3 placent la visite de contrôle dans le worker-lecture (boucle de réparation Python, `repare_moteur`, `pipeline/lire.py:1086`) ; le service `rendu` ne fait que les images d'aperçu.
- Tranché : R3. SwiftShader dans un conteneur, par défaut et partout (VM en Docker Compose) ; ARCHITECTURE D3 est tranchée et l'essai M2.7a devient une mesure informative (étape 7) ; l'avis contraire d'audit-code.md § 4.1 est dépassé. Aucun composant propre à un hébergeur n'est obligatoire.
- L1-11, L1-12 et L4-06 sont dans les dépendances : le contrôle d'aptitude compare au témoin et à ses images approuvées, et le conteneur ne sort vers aucun CDN tiers (three.js et polices servis par nous).
- Sécurité : SwiftShader compile du code à la volée dans Chrome et `plan.json` contient des textes issus du plan déposé ; d'où l'absence de secret, le réseau restreint et le bac à sable (hebergement.md § 2.2).
- Coordination `moteur/` : ce ticket ne modifie pas `moteur/`. Tout besoin (liste de vues, capture du plan 2D, mesure de la luminance) passe par L1-09 ou L4-09, petits diffs isolés, critère de fusion d'ARCHITECTURE § 8.1, sur le commit du le travail sur les niveaux (terminé le 27/09/2026, pas encore commité).

## Références
- produit/ARCHITECTURE.md D3, § 2.1 (worker rendu), § 2.3 (étapes 6 et 7), § 6.3, § 6.7, § 9.5 (non-régression visuelle), M2.7a, M2.7b.
- produit/recherche/hebergement.md § 2.1, § 2.2, § 2.3, § 4, § 11 ; produit/OFFRES.md § 2.2, § 9.2 (T0).
- `moteur/photos.mjs:20` (serveur statique), `:31` (lancement Metal), `:43` (`grab`), `:112-116` (vues écartées) ; `moteur/controle.mjs:31`, `:406` ; `pipeline/serveur.py:448` (`controle`), `:482` (`photos`).

## Hors périmètre
- Ordre de livraison, affichage en direct, e-mail, mesure T0 : L5-11. Publication : L5-12. Marquage des images : L4-07.
- Accélération (une tâche par image, Serverless Jobs, GPU, Mac mini) et galerie complète : L13-01, L13-02.
- Panoramas 360° (contrat v2) : L5-27. Précalcul d'éclairage et maquette compressée : L5-28. Coût de rendu des panoramas : L1-16.
- Limites de processeur sous charge : L5-22. Alertes généralisées : L5-16.
