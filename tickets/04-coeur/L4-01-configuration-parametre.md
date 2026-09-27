# L4-01 · Configuration passée en paramètre au lieu de os.environ

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
La configuration est globale au processus (audit B10) : `load_env` réécrit `os.environ` avant chaque étape IA, `lire.py` y lit modèle, fournisseur, effort et clé, et `importlib.reload` recharge les modules à chaque lecture, ce qui crée une course dès que deux plans tournent ensemble. Impossible donc d'avoir deux réglages dans le même processus : ni clé OpenRouter par usage (décision n° 3 : clés séparées et plafonnées en second verrou), ni réglages par compte (pros, marque blanche). Ce ticket introduit un objet de configuration passé en paramètre, sans rien changer pour l'outil local. Il précède L4-04, L4-08, L9-07 et les workers du socle.

## À faire
0. **Attendre la fusion du travail sur les duplex** (ARCHITECTURE.md § 8.1, règle 2 : refonte mécanique de `lire.py` et `serveur.py`), ou confier le ticket au même agent.
1. **`pipeline/config.py`** (nouveau) : dataclasses gelées `ConfigIA`, `ConfigRendu`, `ConfigProduit`, `Config`, champs d'ARCHITECTURE.md § 7.2 :
   - `ConfigIA` : `fournisseur`, `modele`, `effort`, `effort_relecture`, `cle` (`repr=False`), `cle_nom`, `zdr=True`, `ia_autorisee=True`, `budget_usd=3.0` (par plan, toutes passes et relances confondues, R6), `arbitrages_max=8` (aujourd'hui `maxi=8` dans `arbitre`), `consignes=''`, `version_prompts=''` ; plus `url_openrouter` (défaut `https://openrouter.ai/api/v1`), à reprendre de L4-02 s'il l'a déjà introduit sous forme de variable ;
   - `ConfigRendu` : `chrome` (valeur de `RENDU_CHROME`, L1-09), `moments`, `photos_max`, `mode_simple` (drapeau `simple` lu par le moteur, L4-11), `mention` ;
   - `ConfigProduit` : `offre` (identifiant du catalogue, jamais un code figé, R5), `niveaux_max`, `superposition_autorisee=False` (superposition du plan du promoteur, masquée par le moteur sans cette autorisation, L4-11) ;
   - `Config.sans_secret() -> dict` (JSON sans `cle`), destiné à `rapport.json` et plus tard à `travaux.config` (L5-06).
2. **`Config.depuis_env()`** reproduit exactement le comportement actuel, lu au moment de l'appel (après `load_env`, pour qu'une clé ajoutée au `.env` serve sans redémarrer) :

   | Aujourd'hui | Champ |
   |---|---|
   | `PLAN_PROVIDER`, sinon présence d'`ANTHROPIC_API_KEY` puis d'`OPENROUTER_API_KEY` (`provider`, `lire.py:94`) | `ia.fournisseur` |
   | `PLAN_MODEL` (`lire.py:18`), conversion de `model_id` (`:102`) | `ia.modele` |
   | `PLAN_EFFORT` (`:109`) ; `PLAN_EFFORT_RELECTURE` (`:635`) | `ia.effort`, `ia.effort_relecture` |
   | clé lue par `call` (`:127`) ou par le SDK Anthropic (`:170`) | `ia.cle`, `cle_nom='local'` |
   | `PLAN_BUDGET_USD` (L4-02, s'il existe) ; `RENDU_CHROME` (L1-09) | `ia.budget_usd`, `rendu.chrome` |

3. **Signatures compatibles** : `read_plan(folder, pid, mock=None, progress=None, config=None)` ; `call(system, messages, log, effort=None, max_tokens=100000, progress=None, config=None)` ; `relecture` et `arbitre` transmettent `config` ; `provider(config)` et `model_id(config)`. `config=None` → `Config.depuis_env()`. Les efforts forcés par appel (qualification et arbitrage en `low`) restent des surcharges locales.
4. **Clé** : en-tête `Authorization` d'OpenRouter et `anthropic.Anthropic(api_key=config.ia.cle)` ; plus aucune lecture de clé dans `os.environ` depuis `lire.py`. `ia_autorisee=False` → `call` lève `IAInterdite` avant tout accès réseau (base du travail `rejouer`, ARCHITECTURE.md § 5.6).
5. **`serveur.py`** : `qualifier` (`:260`) et `lecture` (`:289`) construisent `Config.depuis_env()` juste après `load_env()` et le passent ; `load_env` reste pour l'outil local ; `PLAN_MOCK` reste lu par l'appelant et passé en `mock`.
6. **Rechargement de modules** : `importlib.reload` (`lecture`, `:300` ; `controle`, `:352`) seulement si `PLAN_DEV_RECHARGE=1`. Valeur par défaut locale à convenir avec l'agent des duplex (il s'en sert peut-être) ; jamais en service.
7. **Tests unitaires** (`tests/` ou le dossier retenu par L1-02) : `depuis_env` pour chaque combinaison de variables ; deux `Config` différentes dans le même processus donnent deux corps de requête différents (faux `urlopen` ou faux serveur de L4-02) ; ni `repr(config)` ni `sans_secret()` ne contiennent la clé ; `ia_autorisee=False` lève sans réseau.
8. `outils/finalise.sh` ne change pas (il vide les clés) ; il peut passer `ia_autorisee=False` explicitement.

## Critères d'acceptation
- [ ] Rejeu sans IA des références (L1-02) : `plan.json` identiques, `evaluer.py` au moins égal à la ligne de base, visite de contrôle réussie.
- [ ] `grep -n "os.environ" pipeline/lire.py` ne trouve plus rien, hors du bloc `__main__` qui appelle `Config.depuis_env()` (ARCHITECTURE.md, M1.1).
- [ ] Outil local : fonctionne avec le `.env` comme avant ; une clé changée dans le `.env` est prise sans redémarrer (vérifié avec une clé fausse : message d'erreur du catalogue, aucun appel réussi).
- [ ] Tests unitaires verts ; la clé n'apparaît dans aucun journal, `rapport.json`, `repr` ni message d'erreur.
- [ ] Test de fumée `PLAN_MOCK`, contrôle « aucun texte technique » (L1-04) ; aucune lecture payante pour tester.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Ordre avec L4-02** : les deux tickets changent la signature de `call` et de `read_plan`. Recommandation : L4-02 d'abord (petit), puis L4-01 range son budget dans `ConfigIA.budget_usd` ; ou les deux par le même agent, à la suite.
- **Valeur locale de `niveaux_max`** : ne doit rien changer localement (le travail sur les duplex accepte plusieurs niveaux) ; valeur fixée avec L4-08.
- **Constantes** : `MODEL` (`lire.py:18`) devient la valeur par défaut de la configuration. `PRIX` et `EUR` (`:19-20`) restent des constantes (le taux de change est un autre sujet).
- **Nom du produit** : `MARQUE_NOM` et `DOMAINE_PRINCIPAL` relèvent de l'infrastructure (ARCHITECTURE.md, conventions), pas de `Config` ; L0-01 compte sur ce ticket pour retirer le titre en dur de la chaîne, à confirmer.
- **Coordination avec le travail sur les duplex** : refonte mécanique ; après fusion seulement ; branche courte ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/ARCHITECTURE.md § 7.1, § 7.2, § 7.3, § 5.6, § 8.1, § 8.2, M1.1 ; produit/recherche/audit-code.md B10, A8.
- pipeline/lire.py:18 (`MODEL`), :94 (`provider`), :102 (`model_id`), :107 (`call`), :127 (clé OpenRouter), :170 (client Anthropic), :623 et :635 (`relecture`), :676 (`arbitre`), :1308 (`read_plan`) ; pipeline/serveur.py:28 (`load_env`), :260 (`qualifier`), :289 (`lecture`, rechargement `:300`), :346 (`controle`, rechargement `:352`) ; outils/finalise.sh.

## Hors périmètre
- Budget par plan et journal fiable : L4-02. Étapes découpées et interface `Suivi` : L4-04. Refus des plans à plusieurs niveaux : L4-08.
- Résolution offre < organisation < équipe et copie dans `travaux.config` : L5-06, L5-08. Réglages IA évalués pour les pros : L9-07.
