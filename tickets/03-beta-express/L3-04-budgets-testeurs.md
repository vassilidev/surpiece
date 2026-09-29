# L3-04 · Budgets par testeur et plafond global

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L3-03 | `pipeline/` [P] | À faire |

## Pourquoi
Décision n° 3 : blocages côté logiciel d'abord (on sait qui consomme quoi, plafonds qui bloquent facilement), plafonds des clés OpenRouter en second verrou. Le code n'a aucun plafond en argent : relances illimitées, plafond théorique d'une passe d'environ 13 $ contre 1,10 à 1,85 $ mesurés (audit B8). Pendant la bêta express, une vraie clé tourne derrière des testeurs invités : il faut un quota par testeur, une seule relance payante par plan, un arrêt au-delà de 3 $ par plan, toutes passes et relances confondues (R6), une clé dédiée plafonnée par jour, et les coûts lisibles par testeur.

## À faire
1. **Registre de la bêta** `plans/_beta/beta.sqlite` (module `sqlite3` de la bibliothèque standard ; `/api/plans` ignore déjà les dossiers commençant par `_`, et `servable` ne sert rien sous `plans/_beta/`) :
   - `testeurs(email, quota_plans, plans_lances, cree_le)` ;
   - `plans(pid, email, lance_le, relances_payantes, statut)` ;
   - `couts(pid, email, source, cout_usd, le)` alimentée à la fin de chaque étape payante.
2. **Quota par testeur** (1 plan par défaut : « 1 crédit offert par testeur », CLAUDE.md ; réglable par l'équipe) :
   - compté **au début de la lecture payante** (`lecture`, `pipeline/serveur.py:352`), pas au dépôt : un fichier refusé à l'analyse ou à la qualification ne coûte rien au testeur ;
   - dépôts limités à 10 par testeur et par jour, pour borner les qualifications (environ 0,02 $ chacune) ;
   - quota épuisé : refus avant tout appel, message sans jargon (texte proposé plus bas).
3. **Relances** (`POST /api/relancer`, `:561`) : au plus **une** relance qui repaie une lecture (reprise à l'étape `lecture` sans `reponse-ia.json` gardé) ; relances sans IA (lecture gardée, contrôle, photos) acceptées. Au-delà : refus poli, l'équipe reprend par `outils/finalise.sh`.
4. **Budget par plan (3 $, R6)** : brancher l'objet `Budget` de L4-02 (`PLAN_BUDGET_USD=3`). Le plafond est cumulé sur tout le plan : qualification, lecture, relance payante et appels écartés par une nouvelle calibration compris. Si L4-02 n'est pas fusionné, garde minimal et jetable : `lire.call` refuse un nouvel appel quand la somme de tout le journal du plan (`appels-ia.json` et `ancienne-echelle/`, qualification comprise) dépasse le plafond (même règle que L4-02, pour reprendre ses tests ensuite).
5. **Clé OpenRouter dédiée à la bêta** (créée par L0-08) : `limit` quotidien (par exemple 20 $, `limit_reset` quotidien), recharge automatique du compte coupée. Un refus 402 dû à ce plafond donne un message propre (jamais « rechargez le compte »), aucune relance automatique, une alerte à l'équipe.
6. **Coûts visibles par testeur** : `outils/couts_beta.py` (lecture seule) additionne, par testeur et par plan, les appels de `appels-ia.json`, y compris ceux déplacés dans `ancienne-echelle/` par `ecarter_lecture` (`:251`), et la qualification rangée dans `etat.json` (`cout_qualif`, `:276`) tant que L4-02 ne l'a pas mise au journal. Sortie : tableau (plans, relances, coût total, coût maximal d'un plan), option `--csv`. Accès équipe seulement (`docker compose exec`), jamais par le web.
7. **Alertes minimales** : écrire une ligne d'alerte (et un e-mail si L3-05 a branché l'envoi) quand un plan dépasse 3 $, quand un testeur atteint son quota, et quand la clé passe 80 % de son plafond du jour (lecture périodique de `GET /api/v1/key`, sans jamais journaliser la clé).
8. **Textes à ajouter à MESSAGES.md** (par son responsable, ils n'y figurent pas) — propositions :
   - quota atteint : « Votre plan de test a déjà été utilisé. Pour en essayer un autre, écrivez-nous. » ;
   - relance refusée : « Nous reprenons ce plan de notre côté et vous écrivons dès qu'il est prêt. » ;
   - plafond du jour : proche d'`attente.plafond_jour` (§ 7.4), sans mention de prix.

## Critères d'acceptation
- [ ] Sans payer (`PLAN_MOCK`, ou faux serveur OpenRouter de L4-02) : un testeur à quota 1 lance un plan ; son deuxième lancement est refusé avant tout appel ; un fichier refusé à l'analyse n'a rien décompté.
- [ ] Deuxième relance payante d'un même plan refusée ; relance d'une lecture gardée acceptée sans aucun appel.
- [ ] Faux serveur qui facture 2 $ par appel, plafond 3 $ : le deuxième appel n'est pas lancé, message du catalogue, aucune visite publiée ; une relance payante du même plan ne reçoit pas de nouveau plafond (R6).
- [ ] Refus 402 simulé : message propre, aucune relance automatique, alerte écrite.
- [ ] `outils/couts_beta.py` sur un jeu d'essai : totaux égaux à la somme des appels, qualification et ancienne échelle comprises.
- [ ] `/plans/_beta/beta.sqlite` → 404 par toutes les voies.
- [ ] Clé bêta créée avec son plafond quotidien (vérifié par `GET /api/v1/key`, clé jamais affichée).
- [ ] Contrôle « aucun texte technique » (L1-04) sur chaque refus ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Découpage** : le budget par plan est l'objet de L4-02 (lot 4), absent des dépendances. Recommandation : faire L4-02 avant ce ticket ; sinon le garde du point 4 est du code jetable, dont les tests seront repris par L4-02 et L5-09.
- **Tranché : R6.** Plafond IA de 3 $ par plan, toutes passes et relances confondues (pas de nouveau plafond pour une relance payante).
- **Ce qu'obtient un testeur** : OFFRES.md § 2.2 donne un plan complet (question ouverte, PARCOURS.md § 8.3, n° 4, tranchée par L0-04). La bêta express livre l'outil actuel, galerie complète comprise : c'est plus que le contenu du lancement (R1), et rien dans la bêta ne promet cette galerie pour la suite.
- **Ordre de grandeur** (estimation) : 30 testeurs × 1,10 à 1,85 $, plus les échecs et quelques relances, soit environ 60 à 100 $ pour la bêta. Une lecture de plan à plusieurs niveaux est estimée à 1,5 à 2 $ (non mesurée, L1-13) : sous le plafond de 3 $, à suivre.
- **Données personnelles** : e-mails dans le registre ; à purger en fin de bêta (L3-06).
- **Coordination avec le travail sur les niveaux** (fini le 27/09/2026, non commité) : partir du commit qui l'intègre ; diff limité à `lecture`, `do_POST` (relance) et `depot` dans `serveur.py`, nouveau module de registre à part ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/recherche/audit-code.md B8, A7 ; produit/OFFRES.md § 6.7, § 8.1, § 8.7 ; produit/ARCHITECTURE.md § 6.5 ; produit/recherche/hebergement.md § 10 (plafonds et 402) ; produit/MESSAGES.md § 7.4.
- pipeline/serveur.py:314 (`ecarter_lecture`), :323 (`qualifier`, `cout_qualif`), :352 (`lecture`), :665 (`do_POST`, relance), :701 (`depot`) ; pipeline/lire.py:107 (`call`), :163 (journal OpenRouter), :1480 (`read_plan`, `appels-ia.json`).

## Hors périmètre
- Journal fiable et objet `Budget` : L4-02. Budgets à quatre niveaux, clés séparées en production, table `appels_ia` : L5-09. Grand livre de crédits : L5-07.
