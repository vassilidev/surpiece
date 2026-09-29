# L1-04 · Contrôle automatique « aucun texte technique »

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-02 | `outils/` | À faire |

## Pourquoi
Des textes techniques ou écrits pour l'IA atteignent l'écran : « .env », « Chrome sans écran », « Équipement 2 (shower) : … corrige le type », le nom de la bibliothèque 3D et de son CDN, l'identifiant technique en titre, des traces d'erreur (audit B9). La consigne est « aucun texte technique montré » et « tout défaut trouvé devient un contrôle automatique ». Ce ticket livre le contrôle ; L1-05 retire les fuites qu'il trouve (M0.4).

État au 27/09/2026 : `pipeline/serveur.py` filtre chaque écriture d'`etat.json` (`masquer`, `montrable`, motif `TECHNIQUE`) et range les textes retirés dans `textes_masques` ; `accueil.html` ne montre `technique_erreur` qu'avec `?debug=1`. Ce filtre ne suffit pas. Essayé sur les fuites connues, il laisse passer « … dans le fichier .env », « Équipement 2 (shower) … », « Crédit API insuffisant … » et « Logement <identifiant> ». Il ne voit pas les textes du moteur (`ui.js`). Le contrôle de ce ticket reste à faire.

## À faire
1. **Écrire `outils/textes.mjs`** (nouveau, puppeteer), qui s'appuie sur le serveur local déjà en marche (URL en paramètre, `http://localhost:8780` par défaut, comme `outils/vues.mjs`) et ne modifie ni `pipeline/` ni `moteur/`.
2. **Visite** (`/plans/<id>/`) : pour chaque mode, `App.set('mode', …)` sur `plan`, `orbit`, `walk`, puis galerie, visionneuse et fiche ouvertes par leurs boutons, extraire :
   - le texte visible (`document.body.innerText`), `document.title`, les attributs `title`, `alt`, `aria-label`, `placeholder` ;
   - les textes du plan 2D (SVG) ;
   - le contenu de `#err` et du chargeur si la 3D échoue.
3. **Données** : lire `plan.json` (champs de texte : `titre`, `kicker`, `cartouche`, `facts`, `note`, `fiche`, noms des pièces, titres des photos et des arrêts…) et, dans `etat.json`, les champs **affichés** par la page de dépôt : `message`, `avertissements`, `etapes[].texte`, `pieces`. `technique_erreur` n'est contrôlé que s'il est affiché (voir étape 4).
4. **Page de dépôt** (`/`) : intercepter `/api/etat/<id>` dans puppeteer (`page.setRequestInterception`) et rejouer des états fabriqués (analyse, calibration en attente, lecture, contrôle, fini, erreur, refus), avec des messages réels tirés des dossiers de `plans/` et des cas provoqués ; relever tout ce qui s'affiche (`#steps`, `#warns`, `#detail`, message principal, notification). Aucun traitement réel n'est lancé.
5. **Motifs interdits** (fichier de données versionné, par exemple `outils/textes-interdits.json`, une entrée par motif avec sa raison et le défaut d'origine) :
   - `.env`, `Error`, `Exception`, `Traceback`, `json`, `undefined`, `NaN`, `null`, `[object` ;
   - URL et domaines (`http`, `www.`, `cdn.`, `jsdelivr`), chemins et extensions de fichier (`/Users/`, `plans/`, `.py`, `.mjs`, `.js`, `.png`) ;
   - identifiants techniques `[a-z0-9-]+-[0-9a-f]{8}` ; coordonnées `(1.23 ; 4.56)` ; nombres à point décimal anglais dans une phrase ;
   - noms anglais des types d'équipement (`shower`, `bath`, `sink`, `basin`, `toilet`, `hob`, `fridge`, `wardrobe`…), en mots entiers ; « WC » et « loggia » restent permis ;
   - noms de services et de techniques : `three.js`, `OpenRouter`, `Anthropic`, `Claude`, `Chrome`, `SwiftShader`, `puppeteer`, `API`, `serveur`, `pipeline` ;
   - jargon listé dans le prompt (`pipeline/lire.py`, constante `SYSTEM`, consigne de la fiche) : `SHAB`, `trémie`, `gaine déduite`… en mots entiers, avec une liste d'exceptions pour éviter les faux positifs (« nu » ne s'applique qu'en contexte).
6. **Sortie** : liste des fuites (texte, endroit, motif), code de sortie non nul s'il y en a une. Option `--liste-blanche` pour un faux positif documenté, jamais pour une vraie fuite.
7. **Jeu de cas** : une visite témoin saine (plan de référence rejoué par L1-02) et des cas abîmés exprès (`plan.json` sans titre, `etat.json` avec une trace d'erreur), pour vérifier que l'outil voit ce qu'il doit voir.
8. **Une seule liste de motifs** : `pipeline/serveur.py` (`montrable`) lit `outils/textes-interdits.json` à la place de son motif `TECHNIQUE`, ou un test vérifie que `TECHNIQUE` refuse chaque cas de la liste. Sur un plan à plusieurs niveaux, contrôler aussi chaque onglet de niveau (plan 2D, maquette), la visite à chaque niveau, les noms de niveaux (repli « Niveau k ») et l'état « niveaux non séparés » de la page de dépôt.
9. **Brancher** l'outil dans `outils/rejouer_references.sh` (L1-02) comme étape de chaque rejeu.

## Critères d'acceptation
- [ ] Sur l'état actuel du code, `node outils/textes.mjs` **échoue** sur les fuites connues : message du chargeur qui cite la bibliothèque 3D et son CDN (`moteur/ui.js`, fonction `armLoader`), titre par défaut « Logement <identifiant> » (`pipeline/lire.py`, fonction `complete`), détail technique sous l'erreur avec `?debug=1` (`pipeline/accueil.html`, `#detail` : signalé comme réservé à l'équipe, jamais atteint par un client), messages d'`expliquer` et de `lecture` qui citent « .env » ou « API », avertissement « Équipement … (shower) » dans `#warns`, messages de `expliquer` qui citent `.env` ou « Chrome sans écran ».
- [ ] Il passe sur les 4 références une fois L1-05 livré (vérifié par L1-05).
- [ ] Les cas abîmés de l'étape 7 sont tous détectés ; la visite saine ne produit aucun faux positif.
- [ ] L'outil tourne sans appel payant et sans modifier `pipeline/` ni `moteur/`.
- [ ] Règle écrite en tête du fichier de motifs : chaque nouvelle fuite trouvée ajoute un motif et un cas de test.

## Points d'attention
- Les messages de `check` (`pipeline/lire.py`) servent aussi de consignes de correction envoyées à l'IA : le contrôle les signale à l'écran, mais leur correction se fait par un filtre côté affichage (L1-05), pas en changeant leur texte (ce serait changer le prompt).
- Le vocabulaire marketing banni (MESSAGES.md § 0.4 : « IA », « algorithme »…) relève des contrôles du site (L2-15) ; ne l'ajouter ici que pour les écrans de la visite, après accord.
- Le catalogue de messages (L4-05) réutilisera ce filtre pour valider chaque texte du catalogue ; garder la liste des motifs lisible par Python et par Node (JSON).
- Chrome est lancé ici avec les options actuelles ; L1-09 le fera passer par `moteur/chrome.mjs`.

## Références
- `produit/recherche/audit-code.md` B9, A4
- `produit/ARCHITECTURE.md` § 1 (principe 4), § 8.3 M0.4, § 9.5 (Aucun texte technique)
- `produit/MESSAGES.md` § 0.4, § 7 (en-tête), § 7.12
- `produit/SUIVI.md` § 3.15
- `moteur/ui.js` (`boot`, `armLoader`, `App.fail`, `App.set`) ; `moteur/engine.js` (`start`) ; `pipeline/accueil.html` (`#detail`, `#warns`) ; `pipeline/serveur.py` (`expliquer`, `technique`) ; `pipeline/lire.py` (`SYSTEM`, `check`, `complete`)

## Hors périmètre
- Retrait des fuites : L1-05.
- Catalogue de messages : L4-05 ; contrôle sur chaque publication en production : L5-12.
- Contrôle des textes des e-mails : L5-14 ; du site : L2-15.
