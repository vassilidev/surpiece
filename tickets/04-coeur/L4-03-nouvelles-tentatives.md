# L4-03 · Nouvelles tentatives sur erreurs passagères

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | S (jusqu'à 1 j) | L4-02 | `pipeline/` [P] | À faire |

## Pourquoi
Côté OpenRouter, aucune nouvelle tentative n'est faite sur un 429 ou une erreur 5xx (audit A2) : la lecture échoue, l'utilisateur lit « Relancez dans une minute », et une relance manuelle peut repayer une lecture complète (B8). Une erreur passagère doit être retentée automatiquement, peu de fois, en attendant de plus en plus. À l'inverse, un 402 ou un 403 signale un plafond de clé ou un refus : c'est le second verrou voulu par la décision n° 3, il ne se retente jamais (ARCHITECTURE.md § 6.5).

## À faire
1. **Dans `call`** (`pipeline/lire.py:107`), une boucle d'au plus **3 tentatives au total** pour :
   - HTTP 429, 500 à 599 (dont 502, 503, 504, et 529 « surchargé ») ;
   - erreurs réseau : `URLError`, `ConnectionError`, `TimeoutError`, `http.client.HTTPException`, erreurs SSL ;
   - événement `error` reçu dans le flux (`:152`) quand son code est 429 ou 5xx.
2. **Attente croissante avec gigue** : environ 2 s puis 8 s (base 2 s × 4^k, gigue de plus ou moins 20 %) ; `Retry-After` respecté s'il est présent et d'au plus 60 s, sinon tentative abandonnée. Fonction d'attente injectable pour les tests.
3. **Jamais de nouvelle tentative** pour : 400, 401, 402, 403, 404, 413, réponse tronquée (`finish_reason: length`, `:165`), refus du modèle, JSON illisible (déjà traité par `read_plan`). `error.metadata.limit_source` journalisé (L4-02).
4. **Budget avant chaque tentative** : `budget.autoriser(...)` de L4-02 est appelé avant chaque essai ; chaque essai a sa propre entrée au journal (`statut`, numéro de tentative). Une erreur au milieu du flux peut avoir été facturée : le budget en tient compte.
5. **SDK Anthropic** (`:170`) : une seule politique. Recommandation : `anthropic.Anthropic(max_retries=0)` et la même boucle, pour que chaque essai soit journalisé et passe par le budget.
6. **Échec après les 3 tentatives** : exception passagère identifiable (attribut `code = 'service_indisponible'`), traduite par le catalogue en `erreur.indisponible` (L4-05) ; en attendant L4-05, `expliquer` (`serveur.py:396`) garde son comportement.
7. **Faux serveur de L4-02** complété par les scénarios : 429, 429 puis succès ; 500 trois fois ; coupure réseau puis succès ; 402 ; 403 ; 401 ; `Retry-After: 3` ; `Retry-After: 600` ; erreur dans le flux avec code 503.

## Critères d'acceptation
- [ ] 429, 429 puis succès → succès, 3 entrées au journal, attentes conformes (horloge simulée).
- [ ] 500 trois fois → échec après 3 tentatives, exception de code `service_indisponible`, 3 entrées.
- [ ] 402, 403 et 401 → une seule tentative ; `limit_source` présent dans l'entrée quand le serveur le donne.
- [ ] Budget épuisé entre deux tentatives → aucune tentative suivante, `BudgetDepasse`.
- [ ] `Retry-After` de 3 s respecté ; `Retry-After` de 600 s → abandon immédiat.
- [ ] Rejeu sans IA des références (L1-02) identique ; test de fumée ; tests uniquement avec le faux serveur, aucune lecture payante.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **À ne pas confondre** : ces tentatives restent à l'intérieur d'une même passe. La « relance payante » limitée à une par travail (OFFRES.md § 6.7, ARCHITECTURE.md § 5.6) est une nouvelle passe décidée après un échec : elle n'est pas concernée ici. Les deux restent sous le même plafond de 3 $ par plan, toutes passes et relances confondues (R6).
- **Coût** : une erreur au milieu du flux peut être facturée ; trois tentatives d'une lecture complète peuvent coûter jusqu'à 3 fois un appel de lecture. Le budget de L4-02 borne ce risque.
- La qualification (`serveur.py:260`) passe par `call` et profite des tentatives sans changement.
- **Ordre avec L4-01** : les deux tickets touchent `call` ; enchaîner sur la même branche ou rebaser proprement.
- **Coordination avec le travail sur les duplex** : diff limité à `call` ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/ARCHITECTURE.md § 6.5 (402 et 403), M1.3, § 8.1 ; produit/recherche/audit-code.md A2, B8 ; produit/recherche/hebergement.md § 10 ; produit/OFFRES.md § 6.7.
- pipeline/lire.py:107 (`call`), :135-:139 (`urlopen`, erreurs HTTP), :152 (erreur dans le flux), :165 (réponse tronquée), :170 (client Anthropic) ; pipeline/serveur.py:260 (`qualifier`), :396 (`expliquer`).

## Hors périmètre
- Reprise automatique après l'arrêt d'un worker, relance payante unique : L5-06. Essai de charge avec le faux serveur : L5-22. Alertes sur les 402 : L5-09, L5-16.
