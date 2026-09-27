# L1-12 · Relevé manuel et lecture gardée du témoin

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-02, L1-03 | `pipeline/` [P] | À faire |

## Pourquoi
Suite de L1-03 (découpé : l'ensemble dépassait 5 jours). Le PDF fictif ne sert que s'il passe par la vraie chaîne et devient une référence rejouable : un relevé fait à la main (la vérité), une lecture par l'IA faite une fois et gardée (pour tout rejouer sans payer), une visite de contrôle réussie et zéro défaut visible. Ce ticket débloque la CI (L1-11), la démonstration (L2-09), les visuels (L2-03), les entretiens (L2-18) et la prise en main pro (L9-03).

## À faire
1. **Relevé manuel** `references/temoin/plan.json`, au format de `moteur/SCHEMA.md` et sur le modèle de `references/432.plan.json` : murs et épaisseurs, ouvertures (type, largeur, charnière, sens d'ouverture), pièces (polygone, nom, surface du tableau), équipements (type, position, orientation), gaine, loggia. Partir de la géométrie source de L1-03 (`references/temoin/temoin.json`) et vérifier chaque élément sur le PDF.
2. **Essai gratuit d'abord** : dépôt du PDF dans l'outil local avec `PLAN_MOCK=references/temoin/plan.json` et les clés vidées (ou `outils/fumee.sh` de L1-02) : analyse sans calibration, murs, complément, visite de contrôle, photos. Corriger le relevé tant que le contrôle échoue ; si c'est la chaîne qui échoue sur un cas qu'elle couvre déjà, le signaler (défaut à transformer en contrôle), sans la modifier ici.
3. **Lecture par l'IA, une seule fois, sur accord explicite de l'utilisateur** : clé `dev` plafonnée (1 à 2 $), dépôt normal dans l'outil local (après L1-08 et L1-10 si possible, pour que la lecture gardée soit faite dans les conditions du service). Garder `extract.json`, `plan-src.png`, `reponse-ia.json`, `relecture-ia.json`, `appels-ia.json`, `rapport.json`.
4. **Mesure** : `python3 pipeline/evaluer.py plans/<id>/plan.json references/temoin/plan.json` (evaluer.py accepte déjà un chemin) ; ajouter l'alias `temoin` au dictionnaire des références dans le bloc `__main__` d'`evaluer.py` (une ligne, à côté de `432`). Noter les chiffres : ce sont la ligne de base du témoin pour L1-11.
5. **Visite de contrôle et zéro défaut visible** : `outils/finalise.sh <id>` passe ; relecture humaine avec `outils/marche.mjs` (4 directions par pièce), `outils/vues.mjs`, `outils/trajets.mjs` et une planche des photos (`outils/planche.py`) selon la liste de CLAUDE.md : pas de trou ni de fente, pas de texture noire, pas d'objet qui flotte, pas de mur mal placé, pas de porte à l'envers, pas d'équipement oublié ou mal orienté, aucun texte technique (`outils/textes.mjs`).
6. **Si la lecture a un défaut visible** : ne pas retoucher le résultat à la main (ce que montre la publicité est ce que produit le service, MARQUE.md § 8.2). Consigner le défaut, en faire un contrôle automatique, et décider avec l'utilisateur : correction de la chaîne puis nouvelle lecture payante sur accord, ou témoin laissé en l'état pour la CI seulement en attendant.
7. **Versionner dans `references/temoin/`** : `temoin.pdf` et sa source (L1-03), `plan.json` (relevé), un sous-dossier `lecture/` avec `extract.json`, `plan-src.png`, `reponse-ia.json`, `relecture-ia.json`, `appels-ia.json`, le `plan.json` produit et `controle.json`, et un `LISEZMOI.md` (date, modèle, effort, coût, version du moteur, commit, chiffres d'`evaluer.py`).
8. **Ajouter le témoin au rejeu** (L1-02) comme cinquième référence, versionnée celle-ci ; écrire sa ligne de base.

## Critères d'acceptation
- [ ] Le relevé passe la chaîne en `PLAN_MOCK` sans calibration, visite de contrôle réussie.
- [ ] La lecture gardée est versionnée ; `outils/finalise.sh` la réassemble, clés vidées, sans aucune nouvelle entrée dans `appels-ia.json`.
- [ ] `evaluer.py plans/<id>/plan.json temoin` fonctionne ; chiffres notés dans `references/temoin/LISEZMOI.md`.
- [ ] Visite de contrôle réussie ; relecture humaine « zéro défaut visible » faite et datée, ou défauts consignés avec leur contrôle automatique et la décision de l'étape 6.
- [ ] `outils/textes.mjs` passe sur la visite du témoin.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 pour le diff d'`evaluer.py` ; rejeu L1-02 des 4 références identique.
- [ ] Aucun fichier d'un plan de promoteur dans `references/temoin/`.

## Points d'attention
- **Découpage** : le diff `[P]` se limite à un alias d'`evaluer.py`, facultatif puisque le chemin marche déjà ; le marqueur `[P]` vient surtout de la coordination. En revanche, si la lecture du témoin révèle un défaut de la chaîne, sa correction (et la nouvelle lecture payante) peut faire dépasser la taille M : la traiter dans un ticket à part.
- **Dépendance aux changements d'extraction** : la lecture gardée référence les indices de murs d'`extract.json`. Si l'agent des duplex change `extract.py` au point de décaler ces indices, la lecture gardée ne s'applique plus : il faudra une nouvelle lecture payante, sur accord. Le mode `--extraction` de L1-02 le détecte.
- `reponse-ia.json` est une sortie de l'IA ; ARCHITECTURE.md interdit d'en **publier** : la versionner dans un dépôt privé est acceptable pour le témoin (aucune donnée de client), mais elle ne doit pas figurer sur le site.
- Un seul modèle, un seul effort (ceux du service, `claude-opus-5`, effort medium) : noter la configuration exacte pour que la base soit reproductible.
- Mémoire du projet : ne pas payer de lecture vouée à l'échec ; l'étape 2 gratuite passe avant l'étape 3.

## Références
- `produit/ARCHITECTURE.md` § 8.1, § 8.3 M0.2, § 9.5
- `produit/MARQUE.md` § 8.2 ; `produit/MESSAGES.md` § 6
- `CLAUDE.md` (zéro défaut visible, tester sans payer, `outils/finalise.sh`)
- `moteur/SCHEMA.md` ; `references/432.plan.json` ; `pipeline/evaluer.py` (`__main__`, `from_plan`, `evaluate`) ; `outils/finalise.sh`, `outils/marche.mjs`, `outils/vues.mjs`, `outils/trajets.mjs`, `outils/planche.py`

## Hors périmètre
- Dessin du PDF : L1-03.
- CI : L1-11 ; visuels et page de démonstration : L2-03, L2-09.
- Second témoin (T2 avec balcon) : plus tard.
