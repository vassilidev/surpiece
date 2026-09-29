# L1-10 · Masquer le cartouche avant l'envoi au modèle

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
Le cartouche d'un plan de vente porte des données personnelles ou identifiantes : adresse du programme, numéro de lot, parfois noms des acquéreurs. Tout part aujourd'hui chez OpenRouter, en image et en texte. Le masquer avant l'envoi est la mesure de minimisation recommandée (`recherche/juridique.md` § 3.2) et un prérequis juridique avant le premier testeur (§ 7, n° 6). Contrainte forte : le tableau des surfaces, les noms des pièces et les cotes doivent rester lisibles, sinon la lecture recule.

## À faire
1. **Inventaire de ce qui part au modèle** (lecture du code, sans appel) :
   - images : `plan-src.png` (plan recadré) et `page.png` (page entière, « cartouche, tableau des surfaces, légende ») dans `build_messages` ; `calibration.png` ou `plan-src.png` dans `qualifier` (`pipeline/serveur.py`) ; `relecture.png`, les zooms par pièce et les vignettes d'arbitrage, tous dessinés sur `plan-src.png` (`pipeline/apercu.py`, `dessine`, `zooms`, `duel`) ;
   - **texte** : le JSON d'`extract.json` envoyé par `build_messages` contient `textes_hors_plan` (les mots hors de la zone du plan, donc le cartouche, écrits par `extract`, `pipeline/extract.py`) et le champ `id`, qui porte le nom du fichier tant que L1-06 n'est pas livré.
2. **Écrire `pipeline/masquage.py`** (nouveau fichier) :
   - pour un PDF vectoriel : repérer les lignes de texte hors de la zone du plan (coordonnées de page d'`extract.json`, zone et origine de `image`) ; **garder** celles du tableau des surfaces et de la légende (surfaces `\d+[,.]\d+ ?m²`, noms de pièces, « total », « surface habitable », « annexes », « loggia », « balcon », noms de niveaux) ; **masquer** les autres (adresse, programme, lot, bâtiment, noms, promoteur, architecte, dates, téléphone, e-mail) et les images matricielles placées hors de la zone du plan ;
   - produire les rectangles à masquer en coordonnées de page, puis peindre ces rectangles en blanc sur `page.png`, `plan-src.png` et `calibration.png` (mêmes coordonnées converties par le facteur de chaque image), **en place**, sans changer la taille ni la géométrie des images ;
   - fournir `filtrer_textes(extract)` qui retire de `textes_hors_plan` les lignes masquées et retire le champ `id` du JSON envoyé ;
   - écrire `masquage.json` (rectangles et textes retirés) dans le dossier du plan, jamais servi, pour la relecture humaine.
3. **Brancher par de petits diffs isolés** :
   - `pipeline/serveur.py` : appeler le masquage juste après chaque `extract(…)` réussi (`analyse`, `calibration`) et avant `qualifier` ;
   - `pipeline/lire.py`, `build_messages` : passer `e` par `filtrer_textes` avant de l'écrire dans le message (une ligne).
   Les images dérivées (`relecture.png`, zooms, vignettes) héritent du masquage, puisqu'elles partent de `plan-src.png`.
4. **Plans en image** (capture, photo, scan) : pas de texte vectoriel, donc pas de repérage fiable sans reconnaissance de caractères. Au premier temps : ne rien masquer, le signaler dans `masquage.json`, et soumettre la décision à l'utilisateur (voir Points d'attention). Aucune dépendance nouvelle sans accord.
5. **Vérifier sans payer, plan par plan** :
   - sur les 4 références (hors dépôt) et sur le témoin fictif avec une variante de cartouche à fausses données personnelles (L1-03) : planche avant/après relue par l'utilisateur, **qui reste sur le poste** (jamais versionnée ni publiée) ;
   - contrôles scriptés : toutes les surfaces du tableau et toutes les cotes (`extract['cotes']`) sont encore dans le texte envoyé ; aucun rectangle masqué ne coupe la zone du plan ; aucune ligne du cartouche fictif ne subsiste dans le texte envoyé ;
   - rejeu L1-02 identique (le rejeu reprend les lectures gardées : il prouve que rien d'autre ne bouge).
6. **Lecture de contrôle payante, seulement sur accord de l'utilisateur** : relire 432 et D201 avec le masquage (clé `dev`, 1 à 2 $ par plan) et comparer `evaluer.py` à la ligne de base. Si la lecture recule, ne pas fusionner ; ajuster le masquage, jamais généraliser.
7. **Documentation** : `pipeline/README.md` (ce qui part au modèle), et transmission à L0-09 (analyse des transferts) et à la politique de confidentialité (L2-11).

## Critères d'acceptation
- [ ] Sur les 4 références et le témoin, les images envoyées ne montrent plus l'adresse, le programme, le lot ni aucun nom ; le tableau des surfaces, les noms des pièces et les cotes restent lisibles (relecture de l'utilisateur, datée).
- [ ] Contrôles scriptés de l'étape 5 réussis ; le champ `id` n'est plus envoyé.
- [ ] `lire.legende_baies` donne le même résultat sur le texte filtré et sur le texte d'origine, pour les 5 références (au D201, FA = « fenêtre sur allège » ; à la duplex, FA = « fenêtre allège vitrée ») ; aucun rectangle masqué ne coupe une zone de niveau.
- [ ] Rejeu L1-02 identique ; contrôle des textes (L1-04) et fumée de l'outil local réussis.
- [ ] Si l'utilisateur donne son accord : lecture de contrôle sur 432 et D201 au moins égale à la ligne de base (D201 : 7 ouvertures sur 7, 6 équipements sur 6 ; 432 : 6 sur 7 et 6 sur 7). Sans accord, le ticket ne peut pas être fermé : il reste « vérifié sans payer ».
- [ ] Tout texte personnel repéré après coup devient un cas du jeu de test du masquage.

## Points d'attention
- **Prompt et cartouche** : le prompt demande au modèle de remplir `titre`, `kicker` et `cartouche` (`l1` à `l3`) d'après le plan (`pipeline/lire.py`, `SYSTEM`). Cartouche masqué, il peut laisser ces champs vides ou **inventer** (une adresse, un programme). Le contrôle des textes ne détecte pas une invention. Une consigne du type « le cartouche est masqué : laisse l1 à l3 vides » est un changement de prompt, donc une lecture payante d'évaluation (ARCHITECTURE.md § 9.5) : à arbitrer par l'utilisateur, et **peut faire dépasser la taille M** (découpage).
- **Plans en image** : sans reconnaissance de caractères, pas de masquage automatique. Options à présenter : (a) accepter et l'écrire dans la politique de confidentialité ; (b) reconnaissance de caractères locale (nouvelle dépendance, coût de maintenance) ; (c) demander à l'utilisateur de recadrer ou de masquer lui-même, au dépôt. Décision de l'utilisateur, avec l'avocat (L0-07).
- Sur beaucoup de plans, le tableau des surfaces est **dans** le cartouche : masquer ligne par ligne, jamais un bloc entier.
- Numéro de lot écrit dans la zone du plan (près du dessin) : non masqué par cette méthode ; à noter dans l'analyse des transferts.
- Coordination : `extract.py`, `lire.py` et `serveur.py` portent le travail sur les niveaux (fini le 27/09/2026, non commité) ; ce ticket ajoute un fichier et deux appels, sur le commit qui l'intègre. `extract.json` a changé de forme le 27/09/2026 (zone et nom de chaque niveau, pages d'un même logement empilées) : la zone du plan est l'union des zones de niveaux ; les noms de niveaux et la légende des sigles restent envoyés au modèle (un sigle ne vaut que par la légende de son plan).
- `page.png` est aussi servi publiquement avec la visite (audit B7) : le masquage ne règle pas cette fuite (L3-03, L5-12).

## Références
- `produit/recherche/juridique.md` § 3.2, § 3.3, § 7 (n° 6)
- `produit/recherche/audit-code.md` A12, B3, B7
- `produit/ARCHITECTURE.md` § 1 (principe 8), § 6.6, § 8.4, § 9.5 (lecture payante)
- `pipeline/lire.py` (`img_block`, `build_messages`, `relecture`, `arbitre`, `SYSTEM`) ; `pipeline/apercu.py` (`dessine`, `zooms`, `duel`) ; `pipeline/extract.py` (`extract` : `textes_hors_plan`, `image`, `plan-src.png`, `page.png`) ; `pipeline/serveur.py` (`analyse`, `calibration_needed`, `qualifier`, `calibration`)

## Hors périmètre
- ZDR : L1-08 ; identifiant sans nom de fichier : L1-06.
- Plan du promoteur retiré des publications : L3-03, L5-12.
- Analyse des transferts et registre : L0-09.
