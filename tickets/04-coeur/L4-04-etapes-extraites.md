# L4-04 · Étapes de la chaîne extraites

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | L (3 à 5 j) | L4-01, L4-08 | `pipeline/` [P] | À faire |

## Pourquoi
Principe 1 d'ARCHITECTURE.md : une seule chaîne, deux modes d'exécution. Le service doit appeler le même code que l'outil local, à travers trois interfaces (configuration, suivi de progression, stockage). Aujourd'hui les étapes sont des fonctions de `serveur.py` liées à `etat.json`, au dossier global `PLANS`, au verrou `LOCK` et aux fils du serveur HTTP. Ce ticket les sort dans `pipeline/etapes.py`, avec une interface `Suivi`, sans changer le comportement local. Le worker du socle (L5-06) les appellera sur un dossier temporaire.

## À faire
0. **Après la fusion du travail sur les duplex** (ARCHITECTURE.md § 8.1, règle 2), ou par le même agent : `analyse`, `lecture` et `controle` contiennent aujourd'hui le code des niveaux.
1. **`pipeline/etapes.py`** (nouveau) : `analyser`, `qualifier`, `calibrer`, `lire`, `controler`, `photographier`, de forme `(dossier, config, suivi, …) -> étape suivante | None`. Code déplacé tel quel depuis `serveur.py` :
   - `analyse` (`:132`), `format_fichier` (`:52`), `ouvrir_image` (`:112`), `choisir_page` (`:126`) → `analyser` ;
   - `texte_niveaux`, `fait_niveaux`, `niveaux_refus` (`:197`, `:207`, `:218`), `calibration_needed` (`:237`) ; `ecarter_lecture` (`:251`) ;
   - `qualifier` (`:260`) ; partie calcul de `calibration` (`:634` : `extract(..., K_force=K)`, `ecarter_lecture`, `fait_niveaux`) → `calibrer(dossier, config, suivi, p1, p2, longueur_m)` ; la validation des saisies reste dans le gestionnaire HTTP ;
   - `lecture` (`:289`, avec son fil qui fait avancer le pourcentage) → `lire` ; `controle` (`:346`) → `controler` ; `photos` (`:378`) → `photographier(..., vues=None)`, prêt pour la liste de vues de L4-09 ;
   - `technique` (`:100`) → `etapes.detail_technique`, pour le journal seulement.
2. **Interface `Suivi`** (protocole, dans `etapes.py` ou `pipeline/suivi.py`) : `etat()`, `maj(**champs)`, `fait(etape, texte)`, `avertir(message)`, `pct(valeur)`, `processus(p)` (enregistre un sous-processus pour qu'il soit arrêté avec le travail), `journal(detail)`. Implémentations :
   - `SuiviEtatJson(dossier, verrou)` : reproduit exactement `state` et `_state` (`:74-97`), écriture atomique comprise ;
   - `SuiviMemoire` pour les tests ; `SuiviBase` viendra avec L5-06.
3. **`serveur.py` garde** le HTTP, l'enchaînement (`run`, `:419`), `RUNNING`, `SLOTS`, `reserver`, `liberer`, `ENFANTS` et `arreter` (via `suivi.processus`), `load_env` et la construction de `Config.depuis_env()` (L4-01). `state()` devient une mince enveloppe de `SuiviEtatJson` pour les routes.
4. **Aucune variable globale dans `etapes.py`** : ni `PLANS`, ni `LOCK` ; le dossier peut être n'importe où (dossier temporaire du worker, ARCHITECTURE.md principe 2) ; le chemin de `moteur/` vient de la configuration ou d'un paramètre.
5. **Messages** : si L4-05 est fusionné, les étapes renvoient des codes du catalogue ; sinon les textes actuels sont déplacés sans changement et convertis par L4-05.
6. **Trace des états** : `outils/trace_etats.py` (nouveau) enregistre chaque écriture d'état pendant une exécution `PLAN_MOCK`, avant et après le ticket, et compare les suites (étape, statut, message, étapes faites, avertissements, état final ; les pourcentages intermédiaires, qui dépendent du temps, sont exclus).

## Critères d'acceptation
- [ ] Même suite d'états dans `etat.json` sur une exécution `PLAN_MOCK` avant et après (`outils/trace_etats.py`) ; état final identique (ARCHITECTURE.md, M1.4).
- [ ] Rejeu sans IA des références (L1-02) : `plan.json` identiques, visite de contrôle réussie, photos à moins de 2/255.
- [ ] Chaque étape s'exécute avec `SuiviMemoire` sur une copie d'un dossier de référence placée hors de `plans/`, sans serveur HTTP (test).
- [ ] Refus identiques (format, image trop petite, PDF protégé, murs non reconnus, niveaux non séparés).
- [ ] Calibration puis reprise en lecture identiques ; arrêt du serveur pendant le contrôle ou les photos → Chrome arrêtés (processus enregistrés par le suivi).
- [ ] `grep -n "PLANS\|LOCK" pipeline/etapes.py` ne trouve rien.
- [ ] Test de fumée, contrôle « aucun texte technique » (L1-04) ; aucune lecture payante.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Taille** : L, à la limite haute. Découpage possible en deux livraisons : (a) `Suivi` et `analyser`, `qualifier`, `calibrer` ; (b) `lire`, `controler`, `photographier`. À décider au début du ticket.
- **Conflits d'ordre** : L4-08 modifie `niveaux_refus`, L4-05 modifie `expliquer` et les textes, L4-09 ajoute la liste de vues de `photographier`. Tranché : L4-08 est une dépendance déclarée, fait avant ce ticket ; L4-05 peut passer avant ou après, mais pas en même temps.
- La calibration continue de tourner dans le fil de la requête HTTP en local (comportement inchangé) ; en service elle passe dans le worker (L5-06, L6-04).
- **Coordination avec le travail sur les duplex** : refonte mécanique de `serveur.py` ; après fusion seulement ; `niveaux.py` n'est pas touché (ARCHITECTURE.md § 8.1, règle 4) ; critère de fusion du § 8.1.

## Références
- produit/ARCHITECTURE.md § 1 (principes 1 et 2), § 8.1, § 8.2 (correspondance du code actuel et de la cible), M1.4 ; produit/recherche/audit-code.md A1, A2, A3, § 3 (éléments réutilisables).
- pipeline/serveur.py:52 (`format_fichier`), :74-97 (`state`, `_state`), :100 (`technique`), :112, :126, :132 (`analyse`), :197-:237 (niveaux, `calibration_needed`), :251 (`ecarter_lecture`), :260 (`qualifier`), :289 (`lecture`), :329 (`enfant`), :346 (`controle`), :378 (`photos`), :419 (`run`), :634 (`calibration`).

## Hors périmètre
- `SuiviBase`, file Procrastinate, reprise sans repayer : L5-06. Stockage S3 et dossier temporaire du worker : L5-02, L5-06.
- Calibration dans le nouveau parcours : L6-04. Qualification étendue aux PDF : L6-02.
