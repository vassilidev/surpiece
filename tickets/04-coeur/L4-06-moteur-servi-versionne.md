# L4-06 · Moteur, bibliothèques 3D et polices servis par nous

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-02, L1-07 | `pipeline/` [P], `moteur/` [M] | À faire |

## Pourquoi
La visite charge three.js, three-mesh-bvh et three-gpu-pathtracer depuis `cdn.jsdelivr.net`, et ses polices depuis Google Fonts (audit A5). Conséquences : chaque visite de contrôle et chaque rendu dépendent d'un tiers (une panne du CDN devient une panne de production), l'adresse IP des visiteurs part chez Google (décision allemande LG München I du 20/01/2022, citée par l'audit), et une CSP stricte comme la marque blanche exigent de tout servir nous-mêmes. Décision n° 5 : la visite se calcule dans le navigateur du client, donc tout ce qu'elle charge doit venir de nos origines. Ce ticket prépare aussi le moteur versionné (ARCHITECTURE.md § 5.5).

## À faire
1. **`moteur/vendor/`**, versions de `moteur/modele.html:15-19` :
   - `three@0.180.0/build/` : `three.module.js` et le fichier qu'il importe (`three.core.js` pour cette version, à vérifier), plus les modules de `examples/jsm/` importés par `engine.js:3-13` (`OrbitControls`, `RoundedBoxGeometry`, `BufferGeometryUtils`, `EffectComposer`, `RenderPass`, `GTAOPass`, `OutputPass`, `UnrealBloomPass`, `ShaderPass`, `RectAreaLightUniformsLib`, `Reflector`) **et leurs imports transitifs**, suivis par script, pas à la main ;
   - `three-mesh-bvh@0.9.1/build/index.module.js` ; `three-gpu-pathtracer@0.0.24/build/index.module.js` (import dynamique, `engine.js:1650`) ;
   - `polices/` : Archivo variable (chasse et graisse, `visite.css:130` utilise `"wdth" 105`) et DM Mono 400 et 500, en woff2, feuille `polices.css` (`@font-face`, `font-display: swap`) ;
   - décodeurs de la maquette compressée et des textures, si L4-14 en retient (WebAssembly compris), et visionneuse 360° (L4-16) : même règle, servis par nous ;
- licences (MIT pour les trois bibliothèques, SIL OFL pour les polices) et `EMPREINTES` (empreinte de chaque fichier, version, source).
2. **Outils** : reprendre `outils/vendoriser.sh` (L2-09, empreintes SHA-384) et `outils/polices.sh` (L2-01), pour que la vitrine et le moteur aient des copies identiques. S'ils n'existent pas encore, les créer ici avec ce même contrat. Mode `--verifier` : recalcule les empreintes et échoue au moindre écart.
3. **`moteur/modele.html`** : table d'import vers `../../moteur/vendor/…` ; retrait des `preconnect` et du lien Google Fonts (`:9-11`) ; feuille `../../moteur/vendor/polices/polices.css`. Tous les chemins gardent le préfixe `../../moteur/`, pour que la publication (L5-12) n'ait qu'un préfixe à réécrire.
4. **`pipeline/accueil.html:8-9`** : polices vers `/moteur/vendor/polices/polices.css`.
5. **`pipeline/serveur.py`, `servable`** (`:464`) : autoriser `moteur/vendor/**` pour les seules extensions `.js`, `.css`, `.woff2` (aujourd'hui `moteur/` n'est servi qu'à un niveau de profondeur), toujours sur le chemin résolu ; type MIME `font/woff2` vérifié.
6. **Serveurs statiques des scripts Chrome** (`moteur/chrome.mjs`, L1-01 et L1-09) : même autorisation pour `moteur/vendor/**` et le type woff2.
7. **Contrôle « aucune requête hors de nos origines »** : dans la visite de contrôle (`moteur/controle.mjs`, ou `moteur/chrome.mjs` partagé), interception des requêtes par puppeteer ; toute requête vers une autre origine que le serveur local (hors `data:` et `blob:`) est bloquée et devient un problème qui fait échouer le contrôle ; même règle dans `photos.mjs`.
8. **Poids** : mesurer une ouverture de visite (octets transférés, compressés) avant et après ; résultat noté pour L4-10.

## Critères d'acceptation
- [ ] Visite chargée et contrôle réussi avec tout accès réseau extérieur bloqué, sur les références (L1-02) et le témoin (L1-12) (ARCHITECTURE.md, M1.7).
- [ ] Contrôle ajouté : une copie de `modele.html` qui charge une image d'un autre domaine fait échouer la visite de contrôle.
- [ ] `grep -rn "jsdelivr\|googleapis\|gstatic" moteur/ pipeline/accueil.html` ne trouve rien hors des fichiers d'empreintes et de licences.
- [ ] `--verifier` passe ; un octet modifié dans un fichier de `vendor/` le fait échouer.
- [ ] Photos à moins de 2/255 de la ligne de base ; polices réellement chargées (`document.fonts.check('12px Archivo')` vrai dans la visite de contrôle) ; libellés du plan 2D identiques à l'œil.
- [ ] Outil local : vendor et polices servis ; `/moteur/vendor/../../.env` et tout fichier hors liste → 404.
- [ ] Rejeu sans IA, test de fumée, contrôle des textes ; aucune lecture payante ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Tranché** : L1-07 est une dépendance déclarée ; les versions sont figées par `package-lock.json`, et chaque fichier téléchargé est vérifié par empreinte.
- **Chevauchement** : L2-09 vendorise déjà pour la page du témoin, L2-01 écrit `outils/polices.sh`. Un seul outil, sinon les deux copies divergeront. `outils/publier_moteur` et `manifest.json` (§ 5.5) restent à L5-12, qui s'interroge sur ce point : ce ticket ne les livre pas.
- **Polices** : vérifier que le fichier retenu garde l'axe de chasse, sinon `font-variation-settings` est ignoré sans erreur et le rendu change. OFL : vérifier un éventuel « Reserved Font Name » avant de réduire la police (L2-01). Le marquage des images (L4-07) a besoin d'Archivo en TTF (Pillow ne lit pas le woff2) : le fournir ici.
- **Anciens plans locaux** : leur `index.html` a été copié de l'ancien `modele.html` ; il est recopié à chaque contrôle ou séance photo par `serveur.py`, mais pas par `finalise.sh` s'il existe déjà. Les visites locales jamais rejouées gardent jsdelivr ; sans effet sur le service, qui produit `index.html` à la publication.
- L'attribut `integrity` des tables d'import n'est pas pris en charge partout : ne pas s'y fier ; les empreintes sont contrôlées au build et à la publication.
- **Coordination avec le travail sur les niveaux** (terminé le 27/09/2026, pas encore commité : 23 fichiers, dont `pipeline/niveaux.py`) : partir de son commit ; `modele.html`, `controle.mjs`, `photos.mjs`, `accueil.html` et `serveur.py` le portent ; après L1-09 (`chrome.mjs`) ; petits diffs ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/ARCHITECTURE.md § 5.2, § 5.5, § 6.2, § 9.5 (contrôle CSP et réseau), M1.7 ; produit/recherche/audit-code.md A5, A3 ; produit/recherche/hebergement.md § 1 (poids d'une visite), § 4 ; produit/MARQUE.md § 11 (polices).
- moteur/modele.html:9-20 ; moteur/engine.js:2-13, :1650 ; moteur/visite.css:6, :130 ; moteur/ui.js:879 (message qui cite jsdelivr) ; pipeline/accueil.html:8-9 ; pipeline/serveur.py:568 (`servable`) ; moteur/controle.mjs:20-24 et moteur/photos.mjs:18-24 (serveurs statiques, avant L1-01 et L1-09).

## Hors périmètre
- Publication versionnée sur le CDN, `outils/publier_moteur`, CSP des pages de visite : L5-12. Compatibilité des navigateurs et repli : L4-10. Émission des événements par le moteur : L7-04.
