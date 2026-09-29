# L5-09 · Budgets IA à quatre niveaux et clés séparées

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L4-02, L5-06, L5-15 | `service/` | À faire |

## Pourquoi
Le code actuel n'a aucun plafond en argent : la seule limite est le nombre de plans simultanés (audit B8), et une passe peut théoriquement coûter environ 13 $ contre 1,10 à 1,85 $ mesurés. Décision du 27/09/2026 : les blocages sont d'abord côté logiciel, on sait qui consomme quoi (coût par compte), avec des plafonds qui bloquent facilement ; les plafonds des clés OpenRouter ne sont qu'un second verrou. L4-02 fournit le journal fiable et l'objet `Budget` par plan ; ce ticket le branche sur la base et ajoute les niveaux organisation, jour (plans offerts) et global, l'interrupteur du gratuit, et la surveillance des clés.

## À faire
1. Table `appels_ia` (ARCHITECTURE § 4.2) : une ligne par appel, écrite par le crochet d'enregistrement du `Budget` de L4-02 au moment où l'appel est journalisé (donc avant toute exception), avec `organisation_id`, `travail_id`, `etape_id`, `cle_nom`, `zdr`, jetons, `cout_usd`, `cout_estime`, `statut`, `generation_ref`, `duree_ms`. `travaux.cout_usd` = somme des lignes (invariant § 4.3).
2. Réglages en base (table `reglages_service`, modifiables par l'administration L5-17) : `budget_plan_usd` (3, toutes passes et relances confondues, qualification comprise, R6), `plafond_gratuit_jour_usd` (10 au départ ; L8-09 l'indexe sur la marge), `plafond_global_mois_usd`, `gratuit_actif` (interrupteur d'arrêt du gratuit). Plafond mensuel par organisation : `organisations.plafond_ia_mensuel_usd`, lu dans la version d'offre souscrite (catalogue de L5-08, R5) ; tant que L5-08 n'est pas fusionné, un réglage de `reglages_service`, jamais une constante du code.
3. Réservation avant dépense, dans la transaction de lancement (L5-06) : réserver `budget_plan_usd` sur le reste du mois de l'organisation, sur le reste du jour du gratuit si la source du lot est `offert_inscription` (plan offert des particuliers seulement, R23 ; un essai pro reste dans le plafond mensuel de son organisation), et sur le reste global. Si un niveau est plein :
   - gratuit du jour épuisé ou `gratuit_actif = false` : le travail attend le lendemain (`attente_budget`, message `attente.plafond_jour`), rien n'est décompté, les plans payants continuent ;
   - organisation ou global plein : pas de lancement, message du catalogue, alerte.
4. `BudgetBase` (implémente le protocole `Budget` de L4-02), passé à la configuration du travail : avant chaque appel, `dépensé du travail + estimation prudente ≤ budget du plan` (qualification, lecture, relectures, arbitrages et relance payante éventuelle cumulés, R6), et les plafonds organisation, jour et global tiennent compte des réservations ouvertes. Au-delà : arrêt propre, travail `attente_budget` puis `echec` (`budget_depasse`), crédit libéré (L5-07), alerte. Le dépassement possible est borné à un appel.
5. Choix de la clé par travail, jamais par l'utilisateur (R23) : `prod-gratuit` pour la seule source `offert_inscription` (plan offert des particuliers), `prod-payant` pour les autres, dont `essai` (budget de l'organisation) ; clé de la source `testeur` fixée avec L6-10 (OFFRES § 2.8) ; `dev` en local et en préproduction. Les clés sont des secrets du seul worker-lecture (jamais le web, jamais Chrome) ; `cle_nom` va dans `travaux.config` et `appels_ia`, la clé jamais.
6. Erreurs 402 et 403 : aucune relance (L4-03), `error.metadata.limit_source` journalisé, travail en échec (`refus_402` ou `refus_403`), crédit libéré, alerte immédiate.
7. Surveillance des clés, tâche toutes les 15 min : `GET https://openrouter.ai/api/v1/key` avec chaque clé → `usage`, `limit`, `limit_remaining` enregistrés ; alertes à 50, 80 et 100 % ; alerte critique si une clé n'a pas de `limit` ou de `limit_reset` (réglages attendus : `prod-payant` mensuel à environ 1,5 fois la prévision, `prod-gratuit` quotidien, `dev` 10 $ par jour). Rapprochement quotidien : écart de plus de 5 % entre l'usage d'une clé et la somme de `appels_ia` pour cette clé → alerte.
8. « Qui consomme quoi » : vues SQL `cout_ia_par_organisation_jour`, `…_mois`, `cout_ia_par_travail`, `cout_ia_par_source_lot`, lues par l'administration (L5-17) et les tableaux de bord (L7-06).
9. Alertes : plan au-delà de 3 $, seuils des clés, toute erreur 402, plafond d'organisation ou global atteint, gratuit du jour épuisé, écart de rapprochement. Envoi par un module `service/alertes.py` (journal niveau alerte et e-mail à l'équipe) que L5-16 généralise et teste.

## Critères d'acceptation
- [ ] Tests avec un faux serveur OpenRouter qui renvoie `usage.cost` : budget du plan dépassé → arrêt avant l'appel suivant, code `budget_depasse`, crédit rendu, aucune ligne `appels_ia` manquante.
- [ ] Test : plafond du gratuit atteint → un plan offert attend le lendemain, un plan payant lancé juste après démarre.
- [ ] Test : `gratuit_actif = false` coupe les nouveaux plans offerts sans toucher aux travaux en cours.
- [ ] Test : 402 simulé → aucune relance, `limit_source` au journal, alerte émise.
- [ ] Test : clé sans plafond détectée ; somme de `appels_ia` par travail égale à `travaux.cout_usd`.
- [ ] Aucune lecture payante pour tester (faux serveur, lectures gardées) ; aucune clé dans les journaux ni dans `travaux.config`.

## Mesure
- `plan_echoue` avec `cause` = `budget_depasse`, `refus_402`, `refus_403` ; `credit_offert_refuse` avec `motif` = `budget_jour_attente` ; `credit_rendu` avec `motif` = `refus_402_403` (écrit par L5-07).

## Points d'attention
- Coordination `pipeline/` : ce ticket ne modifie pas `pipeline/`. Si le `Budget` de L4-02 n'expose pas de crochet par appel (enregistrement et autorisation), le demander dans L4-02 : petit diff isolé, critère de fusion d'ARCHITECTURE § 8.1, après le commit du le travail sur les niveaux (terminé le 27/09/2026, pas encore commité).
- Les clés OpenRouter sont créées et réglées par L0-08 (clé de gestion hors des serveurs). Ce ticket les vérifie, il ne les crée pas.
- Un message pour « plans offerts suspendus » (interrupteur coupé) n'existe pas dans MESSAGES.md : réutiliser `attente.plafond_jour` ou ajouter une clé.
- Recharge automatique OpenRouter coupée, pas plus de 2 à 3 mois de crédits prépayés (ils expirent au bout d'un an) : réglages du compte, à vérifier par L0-08.
- L3-04 (bêta express) a écrit une version jetable de ces budgets : en reprendre les tests.
- **Plans à plusieurs niveaux** : la relecture ajoute une consigne propre aux niveaux (`RELECTURE_NIVEAUX`, `pipeline/lire.py:653`). Le coût d'une lecture réelle est estimé entre 1,5 et 2 $, à mesurer par L1-13. Plafond de 3 $ par plan inchangé (R6), sauf décision de l'utilisateur.

## Références
- produit/OFFRES.md § 6.7, § 8.8, § 8.11 ; produit/ARCHITECTURE.md § 4.2 (`appels_ia`), § 4.3, § 6.5, § 9.4.
- produit/recherche/hebergement.md § 10 ; produit/recherche/audit-code.md B8, A7 ; produit/SUIVI.md § 5.5.
- `pipeline/lire.py:107` (`call`), `:123-127` (corps OpenRouter), `:162-164` (journal de l'appel) ; `pipeline/serveur.py:323` (`qualifier`).

## Hors périmètre
- Budget du gratuit indexé sur la marge et coupe-circuit : L8-09. Crédit offert et anti-abus : L6-06.
- Budget d'import des promoteurs : L10-02. Clés par client : L11-03. Nouvelles tentatives : L4-03.
- Mode maintenance global : L5-21. Tableaux de bord : L7-06.
