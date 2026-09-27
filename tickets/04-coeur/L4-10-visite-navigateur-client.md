# L4-10 · Visite dans le navigateur du client : compatibilité et repli

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L4-05, L4-06 | `moteur/` [M] | À faire |

## Pourquoi
Décision n° 5 : la visite 3D se calcule dans le navigateur du client. Sa compatibilité devient donc le produit : iPhone, Android d'entrée de gamme, navigateurs intégrés aux réseaux sociaux (fréquents après une publicité, PARCOURS.md § 1.5), ordinateur sans GPU. Aujourd'hui, sans WebGL, le moteur appelle `App.fail` avec un message ; une perte de contexte WebGL n'est pas traitée (écran noir) ; plusieurs erreurs affichent un texte technique (« Erreur : … », « three.js, via cdn.jsdelivr.net », « Ce plan.json est hors format »). Une ouverture pèse environ 3 Mo (recherche/hebergement.md § 1). Consigne : jamais d'écran noir ni de texte technique ; tout défaut trouvé devient un contrôle.

## À faire
1. **Matrice de compatibilité**, consignée dans `moteur/COMPATIBILITE.md` (nouveau), sur le témoin fictif seulement :
   - iPhone récent et iPhone ancien encore mis à jour (Safari, version d'iOS notée) ;
   - Android d'entrée de gamme (Chrome, 2 à 3 Go de mémoire) ;
   - navigateurs intégrés d'Instagram, Facebook et LinkedIn, sur iOS et Android ;
   - ordinateur sans GPU utilisable (WebGL absent ou pilote refusé) et ordinateur récent (Chrome, Firefox, Safari, Edge).
   Pour chaque ligne : chargement, temps jusqu'à la première image, fluidité à l'œil en mode visite, les trois modes, plan 2D, galerie, repli, plantage éventuel.
2. **Mesures reproductibles** `outils/mesure_visite.mjs` (nouveau, puppeteer) : octets transférés (compressés) pour une ouverture et temps jusqu'à la première image, repère `performance.mark('visite:premiere-image')` posé par `engine.js` au premier rendu ; profils réseau 4G et « 3G rapide », processeur ralenti ×4 ; sur le témoin et une référence (lecture gardée).
3. **Sans WebGL** (`engine.js:35-36`) : `App.fail('webgl_absent')` ; la page montre `erreur.3d` (texte exact du catalogue de L4-05), bascule sur la galerie et le plan 2D, masque le canevas, désactive `g-cta` et le bouton Maquette avec le même texte (`ui.js`, `armLoader`, `:829-839`).
4. **Perte de contexte** : écouteur `webglcontextlost` sur le canevas (`preventDefault`), arrêt de la boucle de rendu, canevas masqué, repli sur la galerie et le plan 2D avec `erreur.3d` et un bouton « Réessayer » qui recharge la page. Pas de tentative de restauration à chaud (textures et cibles de rendu à recréer, peu fiable).
5. **Autres échecs** : délai de 45 s (`ui.js:839`) → `erreur.chargement`, cause `delai` ; `plan.json` absent ou hors format (`ui.js:439-443`) → texte du catalogue (proposition : `erreur.lien_inconnu` pour un fichier absent, `erreur.500` pour un fichier illisible), cause `fichier` ; erreur de l'interface (`:468`) et « Erreur : … » (`engine.js:1671`) → `erreur.3d`, détail en console seulement.
6. **`App.fail(cause)`** remplace `App.fail(message)` : le texte vient toujours du catalogue ; le détail technique ne va qu'à la console. Les textes du catalogue repris dans `ui.js` sont vérifiés égaux à `pipeline/messages.py` par un test (L4-05).
7. **Réglages pour les petits appareils**, seulement si les mesures le justifient : rapport de pixels (`engine.js:37`), ombres, occlusion ambiante, sondes de lumière pour `App.coarse`. Le masquage du bouton « Rendu photoréaliste de la vue » et de la superposition en mode `simple` (écart noté par PARCOURS.md § 8.2) est fait par L4-11, pas ici. Chaque changement vérifié par le rejeu (les photos se rendent sur ordinateur, pas en `coarse`).
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

## Mesure
- `visite_chargement_echoue` (N, moteur) : ce ticket fixe les causes `webgl_absent`, `contexte_perdu`, `delai`, `fichier` (SUIVI.md § 3.15) et les expose par `App.fail` ; l'émission par `visite:evenement` est faite par L7-04.
- `visite_chargee` (propriété `chargement`, classe de durée) : alimentée par le repère `visite:premiere-image` ; émission par L7-04.

## Points d'attention
- **Appareils réels** : les navigateurs intégrés ne s'automatisent pas ; il faut des appareils en main. Un service de test à distance (souvent américain) n'est acceptable qu'avec le seul témoin fictif.
- **Ordinateur sans GPU** : Chrome ne bascule plus seul sur SwiftShader pour WebGL (hebergement.md § 2.2) ; un poste d'entreprise sans GPU reconnu tombe donc dans le repli. C'est un cas fréquent, pas un cas marginal.
- **iPhone** : mémoire limitée pour les canevas, risque de perte de contexte sur les anciens modèles ; le repli du point 4 est l'essentiel.
- **Découpage** : les réglages du point 7 peuvent grossir ; s'ils dépassent une journée, les sortir dans un ticket à part, mesuré.
- La page d'aperçu gratuit ne charge jamais le moteur (L6-05) : elle n'est pas concernée ; la page du témoin (L2-09) l'est, par sa copie figée du moteur.
- **Coordination avec le travail sur les duplex** : `engine.js` et `ui.js` sont modifiés en parallèle ; petits diffs, sur un commit fusionné ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/PARCOURS.md § 1.5 (mobile, navigateurs intégrés, réseau faible), A12 ; produit/SUIVI.md § 2.7, § 3.5, § 3.15, § 7.5 (R13) ; produit/MESSAGES.md § 7.12 (`erreur.3d`, `erreur.chargement`, `erreur.lien_inconnu`) ; produit/recherche/hebergement.md § 1, § 2.2 ; produit/recherche/audit-code.md B9, A5.
- moteur/engine.js:35-37 (création du rendu WebGL, rapport de pixels), :1671 (`App.fail('Erreur : …')`) ; moteur/ui.js:439-443 (`plan.json` absent ou hors format), :468 (erreur de l'interface), :829-839 (`armLoader`, `App.fail`, délai de 45 s).

## Hors périmètre
- Émission des événements par le moteur : L7-04. Moteur et bibliothèques servis par nous : L4-06. Mode simple (rendu photoréaliste et superposition masqués) : L4-11. Accélération du rendu serveur : L13-01. Aperçu interactif limité : L13-03.
