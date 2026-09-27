# L7-07 · Recette automatique des événements

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P1 | M (1 à 3 j) | L7-04 | `outils/`, `service/` | À faire |

## Pourquoi
Un marquage cassé ne se voit pas : l'entonnoir baisse et on croit à un problème de conversion. Pire, une propriété mal filtrée enverrait un jeton ou un e-mail à Umami et ferait tomber l'exemption. SUIVI.md § 7.5 associe à chaque événement du dictionnaire un scénario de recette (R1 à R16), et § 7.4 des contrôles permanents (C1 à C8). Ce ticket les rend automatiques, **sans aucune lecture payante** (règle du projet, SUIVI.md § 7.6).

## À faire
1. **Script** `outils/recette_mesure.mjs` (puppeteer, dépendances figées) qui démarre sur la pile Docker Compose de recette (Umami de recette, Mailpit, MinIO, Stripe en mode test plus tard) et joue les scénarios disponibles à ce stade :
   - R1 vitrine sans consentement (défilement, sections, FAQ, boutons d'appel, formulaires vide puis rempli, passage de `<domaine>` à `app.<domaine>`) ;
   - R2 démonstration (trois modes, deux pièces, une photo, plein écran, fermeture) ;
   - R3 dépôts (PDF du témoin, PNG, `.docx`, 45 Mo, envoi coupé, PDF protégé, cote de calibration, alerte après refus) ;
   - R4 compte (lien magique via Mailpit, lien expiré, domaine jetable, e-mail normalisé en double, 4e plan offert depuis la même IP, questions de source et de situation, suppression) ;
   - R5 génération sans payer (`PLAN_MOCK`, lecture rejouée depuis `reponse-ia.json`, échecs simulés : budget à 0, refus 402 simulé par le faux serveur OpenRouter de L4-03, contrôle bloquant sur un plan abîmé exprès, tâche orpheline) ;
   - R6 aperçu et vue propriétaire ; R8 partage et défaut ; R13 erreurs (dont visite sans WebGL) ; R14 consentement et attribution.
   R7, R9 à R12 et R15 sont ajoutés quand leurs lots existent.
2. **Interception** de chaque requête vers le point de collecte d'Umami : nom présent au dictionnaire, propriétés et valeurs permises, aucune valeur qui ressemble à un e-mail, un UUID, un jeton, un téléphone, un SIREN ou au titre du plan de test, aucune chaîne de requête sans consentement (C5). **Zéro requête** vers Umami sur `/v/` et `/i/` (C6).
3. **Vérifications SQL** sur `evenements` après chaque scénario : événements serveur attendus, une seule ligne par fait (idempotence), propriétés permises, identifiants à `null` après suppression du compte ; invariants C7 (chaque `plan_lance` finit par `apercu_pret` ou `plan_pret`, ou par `plan_echoue` et `credit_rendu` ; chaque publication est suivie d'un `photos_pretes`) ; C8 prêt pour la phase 3 (aucun envoi sans accord).
4. **Aucune dépense** : le script refuse de démarrer si une clé OpenRouter autre que celle du faux serveur est présente dans son environnement ; il vérifie à la fin qu'aucune ligne `appels_ia` n'a un coût non nul.
5. **Données** : le témoin fictif seulement (L1-12). Aucun plan réel, aucune capture d'un plan réel dans les rapports.
6. **Rapport** lisible : pour chaque scénario, événements attendus, reçus, écarts ; sortie non nulle en cas d'écart.
7. **Branchement** : en CI sur chaque demande de fusion qui touche `mesure/`, le filtre, les pages de l'application ou le moteur ; avant chaque déploiement en production ; chaque nuit en préproduction.
8. Une anomalie trouvée en production (propriété rejetée remontée par Sentry, écart Umami / journal) ajoute un cas au script : règle « tout défaut trouvé devient un contrôle automatique ».

## Critères d'acceptation
- [ ] `outils/recette_mesure.mjs` passe sur la pile de recette avec les scénarios listés, sans aucun appel payant (vérifié par le point 4).
- [ ] Tests négatifs : un événement hors dictionnaire, une propriété contenant un UUID, un chargement d'Umami sur `/v/` et un `plan_lance` sans suite font chacun échouer le script.
- [ ] Temps d'exécution compatible avec la CI (objectif à mesurer ; scénarios longs en tâche de nuit s'il le faut).
- [ ] Le rapport ne contient ni e-mail réel, ni jeton, ni image de plan.

## Points d'attention
- R2 dit que `visite_quittee` peut ne pas arriver de façon fiable : si le script le montre, retirer l'événement du dictionnaire plutôt que d'accepter un test instable.
- La connexion Google (R4) demande un compte de test ; si l'automatisation n'est pas possible, la garder en recette manuelle écrite.
- Les scénarios reposent sur des pages de plusieurs lots : ils échouent tant qu'une page manque ; marquer les scénarios « non applicables » explicitement plutôt que de les sauter en silence.
- Le script ouvre la visite dans Chrome : il suit les règles de L1-09 (rendu choisi, aucune variable secrète dans l'environnement de Chrome).

## Références
- SUIVI.md § 2.3, § 3 (colonne « Recette »), § 5.7, § 7.4 (C1 à C8), § 7.5 (R1 à R16), § 7.6.
- ARCHITECTURE.md § 5.6 (rejouer sans repayer), § 9.5 ; `outils/finalise.sh` ; `moteur/controle.mjs` (modèle de script puppeteer).

## Hors périmètre
- Recette des envois publicitaires (R15) : L12-01, L12-02. Recette Stripe (R7) : lot 8.
- Contrôles de la vitrine hors mesure : L2-15.
