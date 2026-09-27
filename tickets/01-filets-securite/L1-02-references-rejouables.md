# L1-02 · Jeu de référence rejouable sans payer

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | — | `outils/` | À faire |

## Pourquoi
Chaque changement de `pipeline/` ou de `moteur/` (travail sur les duplex compris) peut casser un plan qui marchait. Aujourd'hui, le vérifier demande de relancer des lectures payantes (1,10 à 1,85 $ par plan) ou de rejouer à la main. Ce ticket livre un rejeu automatique des 4 plans réels, **sans aucun appel à l'IA**, avec une ligne de base. C'est le critère de fusion commun à tout ticket `[P]` ou `[M]` (ARCHITECTURE.md § 8.1, règle 3 ; M0.1).

## À faire
1. **Constituer le jeu privé, hors du dépôt** : un dossier local de l'équipe (chemin donné par une variable, par exemple `REFERENCES_PRIVEES=~/visite-plans-references`), jamais versionné ni envoyé en CI. Pour chacun des 4 plans (432, D201, Soline, lot 11 ; identifier leurs dossiers de `plans/` avec l'utilisateur), copier : `source.*`, `extract.json`, `plan-src.png` (lu par `build_messages` même quand la lecture est reprise), `page.png`, `plan-<id>.png` (superposition), `calibration.json` s'il existe, `etat.json` (pour `k_saisi`), `reponse-ia.json`, `relecture-ia.json`, `appels-ia.json`, `plan.json`, `controle.json`.
2. **Écrire `outils/rejouer_references.sh`** (nouveau), qui pour chaque référence :
   - copie la référence dans `plans/_rejeu-<nom>/` (sous `plans/`, déjà ignoré par Git, et seul endroit servi par les scripts Chrome) ; ne touche jamais aux dossiers de travail de l'utilisateur ;
   - réassemble sans IA avec la logique de `outils/finalise.sh` (`lire.read_plan` sur la lecture gardée, puis visite de contrôle et `lire.repare_moteur`, 6 passages au plus), **sans modifier `finalise.sh`** ni lancer les photos (trop longues en SwiftShader) ; option `--photos` pour les ajouter ;
   - lance `python3 pipeline/evaluer.py` : contre `432` et `d201` pour ces deux plans ; pour Soline et lot 11, qui n'ont pas de relevé manuel, contre le `plan.json` de la ligne de base (evaluer.py accepte déjà un chemin de `plan.json` comme référence) ;
   - rend les **3 vues fixes** avec `outils/vues.mjs` (maquette, vue du dessus découpée, plan 2D) ;
   - compare `plan.json` à la ligne de base (JSON normalisé : clés triées, nombres arrondis au millimètre) et les 3 vues aux images de base.
3. **Garantir l'absence d'appel payant**, par trois verrous :
   - variables vidées au lancement de Python : `OPENROUTER_API_KEY= ANTHROPIC_API_KEY= PLAN_PROVIDER=` (comme `finalise.sh`) ;
   - `HTTPS_PROXY=http://127.0.0.1:9` et `HTTP_PROXY=…` pour les processus Python seulement : toute requête sortante échoue au lieu de partir ;
   - contrôle après chaque plan : le nombre d'entrées de `appels-ia.json` n'a pas bougé, sinon échec immédiat.
   Ne jamais importer `pipeline/serveur.py` depuis le script : son chargement appelle `load_env()`, qui remet les clés du `.env` dans l'environnement.
4. **Servir les vues sans second `serveur.py`** : un second serveur lancerait `reprise_au_demarrage()`, qui marque « en erreur » les plans en cours du premier. Utiliser le serveur statique en liste blanche de L1-01 (`moteur/chrome.mjs`) démarré par un petit script `outils/`, ou, tant que L1-01 n'est pas livré, le serveur local déjà ouvert sur le port 8780.
5. **Écrire `outils/ecart_images.py`** (nouveau, PIL et numpy, déjà installés) : pour deux images de même taille, écart moyen en /255, part des pixels dont l'écart dépasse 16/255, part de pixels presque noirs (repère d'une texture noire) ; code de sortie non nul au-delà des seuils (par défaut 2/255 et 0,05 %, `recherche/hebergement.md` § 2.1). Réutilisé par L1-09 et L1-11.
6. **Ligne de base** : première exécution avec `--nouvelle-base` ; stockée dans `$REFERENCES_PRIVEES/<nom>/base/` (plan.json, controle.json, résultat d'evaluer.py, 3 vues, date, commit, version de Chrome). Une nouvelle base ne s'enregistre que par `--nouvelle-base`, jamais implicitement.
7. **Mode `--extraction`** : relance aussi `pipeline/extract.py` depuis la source (avec `k_saisi` si le plan a été calibré) et compare `extract.json` à la base. Si le format ou les indices des murs changent, la lecture gardée ne s'applique plus : le script le signale (« lecture à refaire, non payée ») au lieu d'échouer en silence.
8. **Sortie** : un tableau par plan (ouvertures justes, équipements justes, pièces justes, contrôle, écarts des 3 vues, `plan.json` identique ou non, durée), et un code de sortie non nul en cas de recul.
9. **Test de fumée de l'outil local** (critère de § 8.1) : `outils/fumee.sh` qui lance `OPENROUTER_API_KEY= ANTHROPIC_API_KEY= PLAN_MOCK=<plan.json> PORT=<libre> python3 pipeline/serveur.py` **dans une copie de travail séparée** (`git worktree`, avec son propre `plans/`), dépose un PDF de référence par `curl` (en-têtes `x-nom` et `Origin`), puis attend `statut: fini` sur `/api/etat/<id>`. Sur le poste, il utilise un plan privé ; en CI, le témoin (L1-11).
10. **Documenter** dans `pipeline/README.md` (section « Tests sans clé ») l'usage des deux scripts.

## Critères d'acceptation
- [ ] `outils/rejouer_references.sh` tourne de bout en bout sur les 4 plans, clés vidées, sans aucune nouvelle entrée dans `appels-ia.json` et sans requête sortante depuis Python.
- [ ] Il produit le tableau de l'étape 8 et enregistre la ligne de base ; une seconde exécution sans changement de code donne des `plan.json` identiques et des écarts d'image sous les seuils.
- [ ] `evaluer.py` retrouve au moins les chiffres de `HISTORIQUE.md` : D201 à 7 ouvertures sur 7 et 6 équipements sur 6 ; 432 à 6 sur 7 et 6 sur 7.
- [ ] `outils/ecart_images.py` détecte une image noircie à dessein et une image décalée (tests fournis).
- [ ] `outils/fumee.sh` réussit dans une copie de travail séparée, sans toucher à `plans/` du dépôt principal.
- [ ] Aucun fichier des plans réels n'entre dans le dépôt : `git status` ne montre que les scripts et la documentation.

## Points d'attention
- Les 4 plans sont des plans de promoteurs : ils ne quittent jamais le poste de l'équipe (puis le seau `references-privees/` de la préproduction, L5-18). Aucun nom, aucune adresse, aucune capture dans les journaux du script ni dans les tickets.
- `outils/` est aussi en cours de modification par l'agent des duplex (`finalise.sh`, `vues.mjs`…) : ajouter des fichiers, ne pas modifier les siens.
- `outils/vues.mjs` attend un temps fixe (9 s) par vue : en SwiftShader, environ 11 fois plus lent, ce délai peut ne pas suffire ; à surveiller dans L1-09 et L1-11.
- Un changement d'`extract.py` peut décaler les indices des murs lus par l'IA : le mode `--extraction` le détecte ; seule une nouvelle lecture payante, sur accord, peut alors refaire la base.
- Durée attendue sur le Mac (Metal) : quelques dizaines de secondes par plan sans photos (contrôle 5 à 6 s par passage, 3 vues d'environ 9 s).

## Références
- `produit/ARCHITECTURE.md` § 5.6, § 8.1, § 8.3 M0.1, § 9.5 (rejeu des références privées, non-régression visuelle)
- `produit/recherche/hebergement.md` § 2.1 (seuils d'écart)
- `outils/finalise.sh` ; `outils/vues.mjs` ; `pipeline/evaluer.py` (`__main__`, `evaluate`) ; `pipeline/lire.py` (`read_plan`, `repare_moteur`) ; `pipeline/serveur.py` (`load_env`, `reprise_au_demarrage`)
- `HISTORIQUE.md` (chiffres de référence) ; `pipeline/README.md` (Tests sans clé)
- mémoire du projet : ne pas payer de lecture vouée à l'échec

## Hors périmètre
- Serveur statique en liste blanche : L1-01 ; Chrome configurable : L1-09.
- Appartement témoin et son rejeu en CI : L1-03, L1-12, L1-11.
- Rejeu nocturne en préproduction : L5-18.
