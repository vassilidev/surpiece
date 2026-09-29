# L5-06 · File de travaux et worker de lecture

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L4-04, L5-05, L5-07, L5-15 | `service/` | À faire |

## Pourquoi
Aujourd'hui la file tient dans la mémoire d'un processus (`RUNNING`, `SLOTS`, `pipeline/serveur.py:23-24`), un redémarrage passe tout en erreur (`reprise_au_demarrage`, `:779`), l'analyse n'a aucun délai et la calibration relance `extract()` dans la requête HTTP (audit A1, A2, A10). Chaque « Relancer » peut repayer une lecture (B8). Ce ticket met la chaîne existante, découpée en étapes par L4-04, derrière une file Postgres : sous-processus bornés en temps et en mémoire, battement de cœur, reprise sans repayer après un arrêt brutal, une relance payante au plus, état en base pour l'écran « chantier ».

## À faire
1. Procrastinate sur la même base (schéma appliqué par une migration Alembic), files `analyse`, `lecture`, `rendu`. La file `rendu` ne fait qu'appeler l'exécutant de L5-10 ; tant qu'il n'existe pas, le travail s'arrête en `attente_rendu`.
2. Tables `travaux` et `etapes` (ARCHITECTURE § 4.2), avec l'index unique `un_travail_actif_par_plan` qui remplace `reserver` (`pipeline/serveur.py:548`).
3. Worker `service/worker/lecture.py` (image `worker-lecture`). Pour chaque étape (`analyser`, `calibrer`, `qualifier`, `lire`, `controler` de `pipeline/etapes.py`) :
   - le processus parent télécharge les entrées dans un dossier temporaire organisé comme `plans/<id>/` (L5-02), lance **un sous-processus** `python -m service.worker.etape <travail_id> <etape>`, puis téléverse les sorties ;
   - le sous-processus reçoit seulement le dossier, la configuration résolue (L4-01) et, pour `lire` et `qualifier`, la clé IA choisie par L5-09 selon la source du lot (R23) ; ni identifiants de base ni identifiants S3 ;
   - limites : mémoire (`RLIMIT_AS`, 2 Go pour la lecture, 1,5 Go pour l'analyse, à mesurer), délai (analyse 2 min, lecture 30 min, contrôle 15 min). À mesurer aussi sur la duplex 3081-613 : recalage des niveaux par corrélation des murs, pages empilées. Pour le contrôle, mesurer avec le test d'immersion `etancheite` (grille de cubes de 2 cm sur tous les maillages) ; au dépassement, le groupe de processus est tué avec son Chrome (logique d'`enfant` et `arreter`, `:329-337`) ;
   - la progression remonte par des lignes JSON sur la sortie standard ; le parent l'écrit en base par `SuiviBase` (interface `Suivi` de L4-04) : `travaux.etape`, `pct` (jamais en baisse), `etapes` (durée, `code_erreur`, `detail_technique` interne).
4. Protection des lectures payées : pendant `lire`, le parent téléverse dans l'espace privé, **au fil de l'eau** (toutes les 5 s), chaque fichier nouveau ou modifié parmi `reponse-brute*.txt`, `reponse-ia.json`, `relecture-ia.json`, `appels-ia.json`. Un arrêt brutal ne perd alors que l'appel en cours.
5. Battement de cœur : `travaux.battement_le` mis à jour toutes les 30 s par le parent. Tâche périodique (chaque minute) : un travail `en_cours` sans battement depuis plus de 2 min est remis en file à la même étape ; la lecture reprend depuis la réponse gardée, sans nouvel appel pour ce qui est déjà gardé (`read_plan`, `pipeline/lire.py:1480`).
6. Relances : une reprise qui ne rappelle pas l'IA est illimitée. Une reprise qui doit repayer une lecture incrémente `relances_payantes` ; au-delà de 1, le travail passe `echec`, l'équipe reprend la main (L5-17). Toutes les passes et relances d'un plan restent dans le même budget de 3 $ (R6, L5-09). Le bouton « Réessayer » de l'utilisateur suit la même règle.
7. Routes :
   - `POST /api/plans/{id}/calibration` : validation des saisies reprise de `calibration` (`:634` : mètres entre 0,30 et 25, points à plus de 40 px), puis étape `calibrer` en file ; plus aucun `extract()` dans la requête ;
   - `POST /api/plans/{id}/lancer` : dans **une** transaction, réservation au grand livre (L5-07), création du travail, mise en file ; configuration résolue copiée sans la clé dans `travaux.config`.
8. Échec à n'importe quelle étape : `code_erreur` du catalogue (L4-05), jamais un texte libre ; libération du crédit (L5-07) ; e-mail E6 (L5-14) ; détail au journal. Délais d'OFFRES § 6.4, qui font foi (R7) : aucun battement de cœur du travail depuis 2 h (`delai_depasse`) ou pas de démarrage sous 24 h (`file_saturee`) → échec et libération, par une tâche périodique. Un rendu lent en SwiftShader qui bat toujours n'est jamais libéré.
9. Travaux simultanés par organisation (`travaux_simultanes_max`, 2 par défaut) : au-delà, le travail attend (`en_file`, message `attente.file`), il n'est pas refusé.
10. Arrêt propre au déploiement : le worker cesse de prendre du travail et attend jusqu'à 20 min (`stop_grace_period` du service Compose) ; un travail interrompu reprend par l'étape 5.
11. Aucun `importlib.reload` en service ; aucun appel à `pipeline/serveur.py`.

## Critères d'acceptation
- [ ] Témoin fictif (ou `references/432.plan.json` en attendant L1-12) de bout en bout jusqu'au contrôle, en `PLAN_MOCK`, dans Compose : même suite d'étapes que l'outil local.
- [ ] Arrêt brutal (`docker kill`) du worker pendant une lecture contre un faux serveur OpenRouter qui compte les appels : reprise automatique, aucun appel repayé pour une réponse déjà gardée.
- [ ] Délai dépassé et mémoire dépassée provoqués : travail en échec avec un code du catalogue, crédit libéré, Chrome tué.
- [ ] Deux lancements simultanés du même plan : un seul travail actif (index unique).
- [ ] Test : l'état public ne contient que des textes du catalogue (contrôle des textes L1-04) ; aucun texte technique visible.
- [ ] Aucune lecture payante pour tester ; l'outil local marche toujours.

## Mesure
- `plan_analyse` (`resultat`, `motif_refus`, `vectoriel`, `echelle`, `duree_ms`), `plan_calibre`, `plan_lance` (même transaction que la réservation), `controle_termine`, `plan_echoue` (`etape`, `cause`, `cout_ia_usd`, `relance`, `source_lot`).

## Points d'attention
- Le grand livre (L5-07) et le journal (L5-15) sont dans les dépendances ; les e-mails (L5-14) y arrivent par L5-05 → L5-03.
- Vérifier dans la version de Procrastinate retenue : verrous, priorités, travaux bloqués (ARCHITECTURE § 10). L'index unique et notre battement de cœur ne dépendent pas de ces fonctions ; les priorités entre offres sont faites par L5-22.
- Le faux serveur OpenRouter est prévu par L4-03 (P1, hors dépendances) : s'il n'est pas prêt, en écrire un minimal dans `service/tests/`.
- Réservation après calibration, pas avant (PARCOURS § 8.2) : le bouton « lancer » n'est proposé qu'une fois l'échelle validée.

## Références
- produit/ARCHITECTURE.md § 2.3, § 4.2 (`travaux`, `etapes`), § 4.3, § 5.6, § 7.2, § 8.2, § 9.2, M2.6.
- produit/recherche/audit-code.md A1, A2, A10, B8, B10 ; produit/OFFRES.md § 6.4, § 6.7.
- produit/PARCOURS.md A7 (cas limites), A15 ; produit/MESSAGES.md § 7.4, § 7.12.
- `pipeline/serveur.py:23-25`, `:166` (`analyse`), `:352` (`lecture`), `:431-439` (`enfant`, `arreter`), `:448` (`controle`), `:523` (`run`), `:548` (`reserver`), `:739` (`calibration`), `:779` ; `pipeline/lire.py:1480` (`read_plan`).

## Hors périmètre
- Écran « chantier » : L6-03. Qualification étendue aux PDF : L6-02. Budgets IA : L5-09.
- Rendu des images : L5-10. Livraison et publication : L5-11, L5-12.
- Concurrence par file, priorités, essai de charge : L5-22. Supervision et alertes : L5-16.
