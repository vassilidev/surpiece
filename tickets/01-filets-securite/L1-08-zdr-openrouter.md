# L1-08 · Conservation zéro des données chez OpenRouter

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | S (jusqu'à 1 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
Les images du plan (adresse, lot, parfois noms en cartouche) partent chez OpenRouter, société américaine, puis chez le fournisseur du modèle. Certains fournisseurs peuvent utiliser les entrées pour l'entraînement ; OpenRouter permet d'imposer la conservation zéro (ZDR) par requête (`provider.zdr: true`) ou pour tout le compte. C'est un prérequis juridique avant le premier testeur (`recherche/juridique.md` § 3.3, § 7 n° 5) et une mesure de l'analyse des transferts (L0-09) (M0.8).

## À faire
1. **Corps de la requête** : dans `call` (`pipeline/lire.py`, branche `openrouter`, dictionnaire `body`), ajouter `'provider': {'zdr': True}`. Tous les appels passent par `call` : lecture, réparation du JSON, corrections, relecture (`relecture`), arbitrage (`arbitre`) et qualification (`pipeline/serveur.py`, `qualifier`). Vérifier par `grep -rn "openrouter.ai" pipeline/` qu'il n'existe aucun autre appel direct.
2. **Test unitaire sans réseau** (fichier de test nouveau, par exemple `pipeline/test_zdr.py` ou sous `outils/`) : remplacer `urllib.request.urlopen` par un faux qui capture la requête et renvoie un flux SSE minimal (`data: {…}` puis `data: [DONE]`) ; appeler `call` avec `PLAN_PROVIDER=openrouter` et une clé factice ; vérifier `body['provider']['zdr'] is True` et que le journal (`log`) reçoit l'appel. Aucun appel réel.
3. **Vérification gratuite de la disponibilité** : avant toute lecture payante, consulter la liste des points d'accès du modèle utilisé (`anthropic/claude-opus-5` via `PLAN_MODEL`) dans l'API publique d'OpenRouter (appel gratuit, route à confirmer dans la documentation ZDR) : avec la ZDR, seuls Bedrock et Vertex restent pour les modèles d'Anthropic. Si aucun point d'accès compatible n'existe, **ne pas fusionner** et le signaler.
4. **Branche Anthropic en direct** (`call`, SDK `anthropic`) : la ZDR n'y a pas d'équivalent par requête ; l'écrire en commentaire et dans `pipeline/README.md`, et prévoir que le service utilise OpenRouter (D7). Ne rien changer à cette branche.
5. **Lecture de contrôle payante, seulement sur accord explicite de l'utilisateur** : une lecture d'un plan de référence (432 ou D201) avec la clé `dev` (1 à 2 $), pour mesurer l'effet de la ZDR sur la durée et le résultat (`evaluer.py` contre le relevé, comparé à la ligne de base de L1-02). Ne la lancer qu'après le test unitaire et la vérification gratuite réussis.
6. **Documentation** : `pipeline/README.md` (section OpenRouter) : ZDR imposée par requête, en plus du réglage du compte (L0-08). Transmettre à L0-09 et à la politique de confidentialité (L2-11) : OpenRouter et, derrière lui, Bedrock ou Vertex comme sous-traitants ultérieurs.

## Critères d'acceptation
- [ ] Le test unitaire de l'étape 2 passe sans réseau ; il échoue si l'on retire le champ.
- [ ] La vérification gratuite de l'étape 3 montre au moins un point d'accès compatible ZDR pour le modèle utilisé (résultat daté noté dans le ticket ou le README).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 : rejeu L1-02 identique (le rejeu n'appelle pas l'IA), contrôle des textes réussi, fumée de l'outil local réussie.
- [ ] Si l'utilisateur donne son accord : lecture de contrôle faite, durée et résultat d'`evaluer.py` notés et comparés à la ligne de base ; sinon, la mesure reste inscrite comme « à faire sur accord ».

## Points d'attention
- Diff d'une ligne dans `lire.py`, fichier en cours de modification par l'agent des duplex : branche courte, fusion coordonnée.
- Effets possibles de la ZDR, non mesurés : latence, disponibilité (moins de fournisseurs), prise en charge du paramètre `reasoning.effort`, coût rapporté par `usage.cost`. La lecture de contrôle de l'étape 5 est le seul moyen de les voir ; pas de généralisation sans elle.
- Par OpenRouter, notre contrat est avec OpenRouter, pas avec Anthropic : les garanties d'Anthropic (propriété intellectuelle) ne nous couvrent probablement pas (`recherche/juridique.md` § 3.3, question pour L0-07).
- Mémoire du projet : ne pas payer de lecture vouée à l'échec ; la lecture de contrôle n'a lieu qu'une fois les vérifications gratuites passées.

## Références
- `produit/recherche/audit-code.md` A12
- `produit/ARCHITECTURE.md` § 3 D7, § 6.6, § 8.3 M0.8, § 10 (effet de la ZDR à mesurer)
- `produit/recherche/hebergement.md` § 10 (ZDR, Bedrock et Vertex)
- `produit/recherche/juridique.md` § 0 (point 5), § 3.3, § 7 (n° 5)
- `pipeline/lire.py` (`call`, `provider`, `model_id`) ; `pipeline/serveur.py` (`qualifier`) ; `pipeline/evaluer.py`

## Hors périmètre
- ZDR au niveau du compte et clés plafonnées : L0-08.
- Masquage du cartouche : L1-10.
- Routage UE ou contrat direct avec Anthropic : décision D7, rouverte avant le premier promoteur (L10-01).
- Configuration par paramètre (`ConfigIA.zdr`) : L4-01.
