# L1-09 · Rendu Chrome portable : SwiftShader, Metal ou Vulkan au choix

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-01, L1-02 | `moteur/` [M], `outils/` | À faire |

## Pourquoi
Décision de l'utilisateur (27/09/2026) : le rendu doit fonctionner partout, et le rendu dans un conteneur sans GPU est la base, pas une option dégradée. Or chaque script Chrome force `--use-angle=metal`, qui n'existe que sur macOS (audit B11). La mesure du 27/09/2026 montre qu'en SwiftShader les images sont identiques (écart moyen 0,64 à 0,72/255, au plus 0,05 % des pixels au-delà de 16/255, même verdict de contrôle), pour un rendu environ 11 fois plus lent (M1.6).

## À faire
1. **Étendre `moteur/chrome.mjs`** (créé par L1-01 avec le serveur statique) d'une fonction `lancerChrome(options)` qui choisit les options selon `RENDU_CHROME` :
   - `metal` (défaut sous macOS) : `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` (options actuelles) ;
   - `swiftshader` (défaut ailleurs, et dans les conteneurs) : `--use-angle=swiftshader --enable-unsafe-swiftshader` ; en conteneur, ajouter au besoin `--no-sandbox` et `--disable-dev-shm-usage` (petit `/dev/shm`), à documenter ;
   - `vulkan` : `--use-angle=vulkan --enable-features=Vulkan --disable-vulkan-surface` (options citées par Google, **non validées** : disponible mais marqué expérimental) ;
   - une valeur inconnue arrête le script avec un message clair.
   `headless`, `protocolTimeout` et la taille de fenêtre restent passés par l'appelant. `lancerChrome` passe toujours l'environnement filtré de L1-01 (`envSansSecret()`) : aucun appelant ne peut lancer Chrome avec une clé API.
2. **Vérifier le moteur réellement utilisé**, à chaque lancement : créer un contexte WebGL dans la page, lire le nom du moteur (`WEBGL_debug_renderer_info`, `UNMASKED_RENDERER_WEBGL`) et échouer s'il ne correspond pas au choix (« SwiftShader » attendu pour `swiftshader`, « Metal » pour `metal` ; pour `vulkan`, « Vulkan » **sans** « SwiftShader », car le nom du moteur logiciel contient aussi « Vulkan 1.3.0 (SwiftShader Device…) ») ou si le contexte n'est pas créé. Jamais de repli silencieux d'un moteur à l'autre. Écrire le nom du moteur dans `controle.json` et dans la sortie de `photos.mjs`.
3. **Brancher** `moteur/controle.mjs` et `moteur/photos.mjs` sur `lancerChrome` (remplacer leurs `puppeteer.launch(…)`). Puis `outils/vues.mjs`, `outils/marche.mjs`, `outils/trajets.mjs` et `outils/textes.mjs` (L1-04) s'ils existent. Signaler `moteur/_dbg.mjs` à l'agent des duplex.
4. **Délais** : les attentes fixes (par exemple 9 s par vue dans `outils/vues.mjs`, attentes de lumière dans `photos.mjs`) supposent la vitesse d'un GPU. Les rendre dépendantes du moteur (facteur appliqué en SwiftShader) ou, mieux, attendre un nombre d'images rendues ; mesurer que les vues convergent.
5. **Détecter une texture noire** : pour chaque image produite (photos et 3 vues), rejeter une image presque entièrement noire ou uniforme (luminance moyenne et écart déjà calculés par `grab` dans `photos.mjs`) ; ce contrôle vaut quel que soit le moteur.
6. **Reproduire la mesure de la recherche sur le Mac**, sans payer : rejeu L1-02 des 4 références en `RENDU_CHROME=metal` puis `RENDU_CHROME=swiftshader` ; comparer verdicts de contrôle et 3 vues avec `outils/ecart_images.py` ; noter les durées.
7. **Essai Linux** (recommandé, sans en faire un critère bloquant tant que l'image Docker n'existe pas) : lancer `node moteur/controle.mjs` sur une copie du témoin ou d'une référence dans un conteneur Linux jetable, avec Chrome for Testing figé (L1-07), pour repérer tôt les manques (polices, `/dev/shm`, bac à sable).
8. **Documentation** : `pipeline/README.md` et `README.md` : variable `RENDU_CHROME`, valeurs, défauts, durées mesurées ; remplacer la mention « Chrome `--use-angle=metal` » de la documentation.

## Critères d'acceptation
- [ ] En local sur le Mac, sans variable : comportement et images inchangés (rejeu L1-02 identique, écart des 3 vues sous 2/255).
- [ ] En `RENDU_CHROME=swiftshader` sur le Mac : même verdict de contrôle, mot pour mot, sur les 4 références ; 3 vues à moins de 2/255 en moyenne et au plus 0,05 % des pixels au-delà de 16/255 des images Metal ; nom du moteur « SwiftShader » écrit dans `controle.json`.
- [ ] Un lancement forcé sur un moteur indisponible (par exemple `vulkan` sur le Mac) échoue avec un message clair, sans produire d'image.
- [ ] Une image noire provoquée (page qui masque le canevas) est rejetée par le contrôle de l'étape 5.
- [ ] `grep -rn "use-angle" moteur/ outils/` ne trouve plus que `moteur/chrome.mjs` (hors `_dbg.mjs`).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 ; aucune lecture payante ; tout écart trouvé devient un contrôle.

## Points d'attention
- Chromium n'active plus SwiftShader par défaut pour WebGL et précise que `--enable-unsafe-swiftshader` n'est pas destiné à du contenu non fiable : le conteneur de rendu reste isolé et sans secret (`recherche/hebergement.md` § 2.2 ; L5-10).
- Durées attendues en SwiftShader (Mac M3) : visite de contrôle 13 à 14 s, 3 photos 215 s, 11 photos 684 s. Les délais du serveur (`controle` : 15 min par passage dans `pipeline/serveur.py`) restent suffisants ; `photos` n'a pas de délai.
- `moteur/` et `outils/` sont en cours de modification par l'agent des duplex : petits diffs (un appel remplacé par fichier), branche courte, fusion coordonnée ; `controle.mjs` porte aussi les contrôles des duplex.
- Vulkan n'est pas validé visuellement : ne pas l'utiliser en production avant une comparaison d'images (L13-01).
- Le lancer de rayons (option future « réalisme ») est inutilisable en SwiftShader : hors sujet ici.

## Références
- `produit/recherche/audit-code.md` B11
- `produit/recherche/hebergement.md` § 2.1, § 2.2, § 2.3
- `produit/ARCHITECTURE.md` § 3 D3, § 6.1 (B11), § 8.3 M1.6, § 9.5 (non-régression visuelle)
- `moteur/photos.mjs` (`puppeteer.launch`, `grab`) ; `moteur/controle.mjs` (`puppeteer.launch`) ; `outils/vues.mjs`, `outils/marche.mjs`, `outils/trajets.mjs` ; `moteur/_dbg.mjs`
- `CLAUDE.md` (options de capture actuelles)

## Hors périmètre
- Serveur statique en liste blanche : L1-01.
- Image Docker de l'outil : L3-01 ; worker de rendu en conteneur : L5-10.
- CI Linux et images approuvées : L1-11.
- Accélération (GPU, Mac, une tâche par image) : L13-01.
