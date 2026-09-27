# L4-02 · Journal des appels fiable et budget par plan

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
Décision n° 3 : on doit savoir qui consomme quoi, avec des plafonds qui bloquent facilement. Or le journal des coûts a trois trous (audit A7) : un appel interrompu au milieu du flux n'est pas compté, la qualification n'entre pas dans le total, et une nouvelle calibration remet le cumul à zéro. Et rien ne plafonne une lecture (B8) : 1,10 à 1,85 $ mesurés, mais environ 13 $ possibles en théorie. Ce ticket fiabilise le journal et ajoute un objet `Budget` qui arrête proprement avant l'appel de trop. C'est la base de la table `appels_ia` et des budgets à quatre niveaux (L5-09).

## À faire
1. **Une entrée par appel, quoi qu'il arrive.** Dans `call` (`pipeline/lire.py:107`), l'entrée est écrite dans un bloc `finally`, pour le succès comme pour l'erreur HTTP avant le flux (`:135-139`), l'erreur dans le flux (`:152`), la coupure réseau, la réponse tronquée (`:165`) et le refus du modèle ; même chose pour la branche Anthropic (`:170-:186`). Champs : `fournisseur`, `modele`, `effort`, `etape`, `statut`, `entree`, `sortie`, `reflexion`, `cout_usd`, `cout_estime`, `generation_ref`, `duree_s`, `le`. Statuts repris d'ARCHITECTURE.md § 4.2 (`appels_ia.statut`) : `ok`, `tronque`, `illisible`, `erreur_reseau`, `refus_402`, `refus_403`, plus `erreur_http` et `refus_modele`.
   - OpenRouter : garder l'identifiant de génération des événements du flux (`generation_ref`), qui permet de retrouver plus tard le coût réel ; `usage.cost` s'il est reçu ; sinon `cout_estime: true` avec une estimation prudente (entrée estimée, sortie reçue, prix de `PRIX`).
   - Refus HTTP (401, 402, 403, 429, 5xx) : entrée à coût nul avec son statut, et `error.metadata.limit_source` quand il est présent.
2. **Nom de l'étape** : paramètre `etape` de `call`, passé par chaque appelant : `qualification` (`serveur.py:270`), `lecture` et `correction` (`lire.py:1343`, `:1366`), `reparation_json` (`:1347`), `relecture` (`:635`), `arbitrage` (`:713`).
3. **Qualification comptée** : `qualifier` (`serveur.py:260`) écrit ses appels dans `plans/<id>/appels-ia.json`, le journal que `read_plan` reprend déjà (`lire.py:1312`) ; `rapport.cout_usd` inclut donc la qualification. `cout_qualif` peut rester dans `etat.json` le temps de la transition, sans être affiché.
4. **Cumul jamais remis à zéro** : `ecarter_lecture` (`serveur.py:251`) ne déplace plus `appels-ia.json` ; les autres fichiers de l'ancienne lecture continuent d'être mis de côté.
5. **`Budget`** (nouveau fichier `pipeline/budget.py`, ajout plutôt que modification) : protocole à deux crochets, pour que L5-09 le réimplémente en base sans toucher à `pipeline/` :
   - `autoriser(etape, max_tokens, entree_estimee)` : lève `BudgetDepasse` (attribut `code = 'budget_depasse'`) si dépensé + estimation prudente de l'appel dépasse le plafond. « Dépensé » = somme de tout le journal du plan, toutes passes et relances confondues, qualification comprise (R6). Estimation : 9e décile mesuré de l'étape (table de constantes tirée des `appels-ia.json` des références de L1-02, citée en commentaire), sinon `max_tokens` × prix de sortie + entrée × prix d'entrée. Le dépassement possible est donc borné à un appel ;
   - `enregistrer(entree)` : appelé au moment où l'entrée est écrite (avant toute exception) ; l'implémentation locale ajoute au journal du plan.
   - `BudgetLocal(plafond_usd)` par défaut, plafond lu dans `PLAN_BUDGET_USD` (3 $ par défaut) jusqu'à L4-01, qui le range dans `ConfigIA.budget_usd`.
   - `call(..., budget=None)` et `read_plan(..., budget=None)` : `autoriser` avant chaque appel, `enregistrer` dans le `finally`.
6. **Arrêt propre** : `BudgetDepasse` sort de `read_plan` sans écrire `plan.json`, avec `appels-ia.json` à jour ; `run` (`serveur.py:419`) affiche un message sans texte technique (`erreur.lecture` du catalogue de L4-05, ou le texte générique actuel s'il n'est pas encore fusionné) ; aucune relance automatique.
7. **Faux serveur OpenRouter** `tests/faux_openrouter.py` (HTTP local, réponses en flux SSE), réglable par scénario : succès avec `usage.cost`, erreur dans le flux, coupure après N caractères, 402 avec `limit_source`, 403, 429, 500, `finish_reason: length`, coût par appel. Adresse de base d'OpenRouter lue dans `OPENROUTER_BASE_URL` (défaut `https://openrouter.ai/api/v1`). Il sert ensuite à L4-03, L3-04, L5-16 et L5-22.

## Critères d'acceptation
- [ ] Faux serveur : coupure au milieu du flux → une entrée `erreur_reseau` au coût estimé ; événement `error` dans le flux → une entrée ; 402 → entrée `refus_402` à coût nul avec `limit_source` ; réponse tronquée → entrée `tronque` avec son coût ; succès → coût de `usage.cost`.
- [ ] `rapport.cout_usd` = somme de toutes les entrées, qualification comprise.
- [ ] Après une nouvelle calibration, `appels-ia.json` garde les appels précédents.
- [ ] Relance payante d'un plan qui a déjà dépensé 2,50 $ : le plafond restant est de 0,50 $, pas de 3 $ (R6).
- [ ] Faux serveur facturant 2 $ par appel, plafond 3 $ : le deuxième appel n'est pas lancé, `BudgetDepasse` levée, journal à jour, aucun `plan.json` écrit, message sans texte technique (contrôle de L1-04).
- [ ] Rejeu sans IA des références (L1-02) identique ; outil local inchangé tant que le plafond n'est pas atteint ; aucune lecture payante pour tester.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Tranché : R6.** Plafond IA de 3 $ par plan, toutes passes et relances confondues : une relance payante ne reçoit pas de nouveau plafond (OFFRES.md § 0.2, § 6.7 et § 8.7 et ARCHITECTURE.md § 6.5 le disent désormais ainsi).
- **Ordre avec L4-01** : les deux tickets changent `call` et `read_plan` ; faire celui-ci d'abord, ou les deux par le même agent.
- **Estimation sans `usage`** : elle peut s'écarter du coût réel ; le rapprochement mensuel avec la facture d'OpenRouter passe par `generation_ref` (L5-09, L5-16).
- Les causes `budget_depasse`, `refus_402` et `refus_403` alimentent `plan_echoue.cause` (SUIVI.md § 3.2 et § 3.8), émis côté serveur par le socle (L5-15), pas ici.
- L5-06 et L5-16 attribuent le faux serveur à L4-03 : il est créé ici parce que les tests de ce ticket en ont besoin, et complété par L4-03.
- **Coordination avec le travail sur les duplex** : `relecture` et `arbitre` sont dans du code que l'autre agent modifie (`RELECTURE_NIVEAUX`) ; diff limité aux appels de `call`, nouveau fichier `pipeline/budget.py` ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/ARCHITECTURE.md § 4.2 (`appels_ia`), § 6.5, § 8.1, M1.2 ; produit/recherche/audit-code.md B8, A7 ; produit/OFFRES.md § 6.7, § 8.1, § 8.7 ; produit/recherche/hebergement.md § 10 (402, `limit_source`).
- pipeline/lire.py:19 (`PRIX`), :107 (`call`), :135-:139 (erreur HTTP), :152 (erreur dans le flux), :163 (journal OpenRouter), :165 (réponse tronquée), :170-:186 (branche Anthropic), :1308 (`read_plan`), :1312 (reprise du journal), :1343, :1347, :1366 (appels) ; pipeline/serveur.py:251 (`ecarter_lecture`), :260 (`qualifier`), :276 (`cout_qualif`), :419 (`run`).

## Hors périmètre
- Nouvelles tentatives sur erreurs passagères : L4-03. Configuration par paramètre : L4-01.
- Table `appels_ia`, budgets par organisation, par jour et global, clés séparées, alertes : L5-09, L5-16. Quotas de la bêta express : L3-04.
