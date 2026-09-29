# L4-10 · Visite dans le navigateur du client : compatibilité et repli

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L4-05, L4-06 | `moteur/` [M] | À faire |

## Pourquoi
Décision n° 5 : la visite 3D se calcule dans le navigateur du client. Sa compatibilité devient donc le produit : iPhone, Android d'entrée de gamme, navigateurs intégrés aux réseaux sociaux (fréquents après une publicité, PARCOURS.md § 1.5), ordinateur sans GPU. Aujourd'hui, sans WebGL, le moteur appelle `App.fail` avec un message ; une perte de contexte WebGL n'est pas traitée (écran noir) ; plusieurs erreurs affichent un texte technique (« Erreur : … », « three.js, via cdn.jsdelivr.net », « Ce plan.json est hors format »). Une ouverture pèse environ 3 Mo (recherche/hebergement.md § 1). Consigne : jamais d'écran noir ni de texte technique ; tout défaut trouvé devient un contrôle. Décision de l'utilisateur du 27/09/2026 (n° 12) : la visite doit être **fluide sur un appareil modeste** (portable d'entrée de gamme, téléphone), pas seulement sur une machine puissante. Sa plainte : « pas assez fluide, je passe ma vie à essayer de bien cliquer / bien me déplacer, pas assez de FPS, le POV est étrange ». La compatibilité se juge donc aussi en images par seconde et en confort, pas seulement « la page s'ouvre ».

## À faire
1. **Matrice de compatibilité**, consignée dans `moteur/COMPATIBILITE.md` (nouveau), sur le témoin fictif seulement :
   - iPhone récent et iPhone ancien encore mis à jour (Safari, version d'iOS notée) ;
   - Android d'entrée de gamme (Chrome, 2 à 3 Go de mémoire) ;
   - navigateurs intégrés d'Instagram, Facebook et LinkedIn, sur iOS et Android ;
   - portable d'entrée de gamme avec GPU intégré (Chrome, Edge) ;
   - ordinateur sans GPU utilisable (WebGL absent ou pilote refusé) et ordinateur récent (Chrome, Firefox, Safari, Edge).
   Pour chaque ligne : chargement, temps jusqu'à la première image, images par seconde en mode visite (médiane et pire seconde, banc de L1-14), facilité du clic et du déplacement, les trois modes, plan 2D (onglets de niveau compris), galerie, repli, plantage éventuel.
2. **Mesures reproductibles** `outils/mesure_visite.mjs` (nouveau, puppeteer) : octets transférés (compressés) pour une ouverture et temps jusqu'à la première image, repère `performance.mark('visite:premiere-image')` posé par `engine.js` au premier rendu ; profils réseau 4G et « 3G rapide », processeur ralenti ×4 ; sur le témoin et une référence (lecture gardée).
3. **Sans WebGL** (`engine.js:35-36`) : `App.fail('webgl_absent')` ; la page montre `erreur.3d` (texte exact du catalogue de L4-05), bascule sur la galerie et le plan 2D, masque le canevas, désactive `g-cta` et le bouton Maquette avec le même texte (`ui.js`, `armLoader`, `:829-839`).
4. **Perte de contexte** : écouteur `webglcontextlost` sur le canevas (`preventDefault`), arrêt de la boucle de rendu, canevas masqué, repli sur la galerie et le plan 2D avec `erreur.3d` et un bouton « Réessayer » qui recharge la page. Pas de tentative de restauration à chaud (textures et cibles de rendu à recréer, peu fiable).
5. **Autres échecs** : délai de 45 s (`ui.js:879`) → `erreur.chargement`, cause `delai` ; `plan.json` absent ou hors format (`ui.js:447-451`) → texte du catalogue (proposition : `erreur.lien_inconnu` pour un fichier absent, `erreur.500` pour un fichier illisible), cause `fichier` ; erreur de l'interface (`:476`) et « Erreur : … » (`engine.js:1749`) → `erreur.3d`, détail en console seulement.
6. **`App.fail(cause)`** remplace `App.fail(message)` : le texte vient toujours du catalogue ; le détail technique ne va qu'à la console. Les textes du catalogue repris dans `ui.js` sont vérifiés égaux à `pipeline/messages.py` par un test (L4-05).
7. **Réglages pour les petits appareils** : faits désormais par L4-12 (qualité adaptative, validée par l'utilisateur le 27/09/2026, décision 13), et non plus « seulement si les mesures le justifient ». Ici, on vérifie sur la matrice que L4-12 tient les seuils de L1-14 ; la ligne i/s de la matrice est refaite après L4-12. Ce qui suit reste la liste des leviers : rapport de pixels (`engine.js:37`), ombres, occlusion ambiante, sondes de lumière pour `App.coarse`. Le masquage du bouton « Rendu photoréaliste de la vue » et de la superposition en mode `simple` (écart noté par PARCOURS.md § 8.2) est fait par L4-11, pas ici. Chaque changement vérifié par le rejeu (les photos se rendent sur ordinateur, pas en `coarse`).
8. **Contrôle automatique** `outils/repli3d.mjs` (nouveau), sur le témoin :
   - Chrome lancé avec `--disable-3d-apis` (SUIVI.md, R13) → galerie et plan 2D visibles, `erreur.3d` exact, canevas masqué, aucune zone noire (luminance de la capture), contrôle des textes (L1-04) réussi ;
   - perte de contexte forcée (`WEBGL_lose_context`) → repli en moins de 2 s ;
   - `plan.json` absent → message du catalogue ; three.js bloqué → `erreur.chargement` au délai.

## Critères d'acceptation
- [ ] Matrice remplie sur appareils réels : chaque ligne « fonctionne » ou « repli propre », aucune n'a d'écran noir ni de texte technique ; captures du témoin jointes (jamais d'un plan réel).
- [ ] Poids et temps jusqu'à la première image mesurés et notés ; objectif proposé à l'utilisateur au vu des chiffres.
- [ ] `outils/repli3d.mjs` vert pour les quatre cas du point 8.
- [ ] Rejeu sans IA des références (L1-02) : contrôle et photos identiques (le chemin normal n'est pas touché).
- [ ] Contrôle « aucun texte technique » (L1-04) ; aucune lecture payante ; critère de fusion d'ARCHITECTURE.md § 8.1.
- [ ] I/s mesurées sur chaque ligne de la matrice. Seuils de L1-14 tenus sur le portable et l'Android d'entrée de gamme ; sinon, écart consigné et ticket ouvert.

## Mesure
- `visite_chargement_echoue` (N, moteur) : ce ticket fixe les causes `webgl_absent`, `contexte_perdu`, `delai`, `fichier` (SUIVI.md § 3.15) et les expose par `App.fail` ; l'émission par `visite:evenement` est faite par L7-04.
- `visite_chargee` (propriété `chargement`, classe de durée) : alimentée par le repère `visite:premiere-image` ; émission par L7-04.

## Points d'attention
- **Appareils réels** : les navigateurs intégrés ne s'automatisent pas ; il faut des appareils en main. Un service de test à distance (souvent américain) n'est acceptable qu'avec le seul témoin fictif.
- **Ordinateur sans GPU** : Chrome ne bascule plus seul sur SwiftShader pour WebGL (hebergement.md § 2.2) ; un poste d'entreprise sans GPU reconnu tombe donc dans le repli. C'est un cas fréquent, pas un cas marginal.
- **iPhone** : mémoire limitée pour les canevas, risque de perte de contexte sur les anciens modèles ; le repli du point 4 est l'essentiel.
- **Découpage** : les réglages du point 7 peuvent grossir ; s'ils dépassent une journée, les sortir dans un ticket à part, mesuré.
- La page d'aperçu gratuit ne charge jamais le moteur (L6-05) : elle n'est pas concernée ; la page du témoin (L2-09) l'est, par sa copie figée du moteur.
- **Coordination avec le travail sur les niveaux** (terminé le 27/09/2026, pas encore commité : 23 fichiers, dont `pipeline/niveaux.py`) : partir de son commit ; `engine.js` et `ui.js` le portent ; petits diffs ; critère de fusion d'ARCHITECTURE.md § 8.1.
- **Repli par les panoramas** : une visionneuse 360° en CSS 3D (L4-16) peut fonctionner sans WebGL. Si c'est vérifié, et si l'utilisateur le retient (à décider), le repli des points 3 et 4 propose aussi les panoramas 360° en plus des images et du plan 2D.

## Références
- produit/PARCOURS.md § 1.5 (mobile, navigateurs intégrés, réseau faible), A12 ; produit/SUIVI.md § 2.7, § 3.5, § 3.15, § 7.5 (R13) ; produit/MESSAGES.md § 7.12 (`erreur.3d`, `erreur.chargement`, `erreur.lien_inconnu`) ; produit/recherche/hebergement.md § 1, § 2.2 ; produit/recherche/audit-code.md B9, A5.
- moteur/engine.js:35-37 (création du rendu WebGL, rapport de pixels), :1671 (`App.fail('Erreur : …')`) ; moteur/ui.js:447-451 (`plan.json` absent ou hors format), :468 (erreur de l'interface), :829-839 (`armLoader`, `App.fail`, délai de 45 s).

## Hors périmètre
- Émission des événements par le moteur : L7-04. Moteur et bibliothèques servis par nous : L4-06. Mode simple (rendu photoréaliste et superposition masqués) : L4-11. Accélération du rendu serveur : L13-01. Vue du dessus manipulable : L13-03. Confort de navigation (clic, regard, déplacement, i/s) : L1-14, L1-15. Qualité adaptative : L4-12. Éclairage précalculé et maquette compressée : L4-13, L4-14. Panoramas et visionneuse 360° : L4-15, L4-16.
