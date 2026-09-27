# L5-16 · Supervision et alertes

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-06 | `service/` | À faire |

## Pourquoi
L'outil local coupe ses journaux d'accès et écrit ses erreurs par `traceback.print_exc()` (`pipeline/serveur.py`, audit A11). En ligne, un worker bloqué, une file qui gonfle, une clé OpenRouter au plafond ou un plan à 13 $ doivent se voir le jour même. `ARCHITECTURE.md` § 9.4 liste les alertes du premier jour ; D5 propose Sentry en région UE, Better Stack gratuit et Cockpit. Ce ticket est le « bus d'alertes » : les autres tickets produisent les signaux (grand livre, budgets, e-mails, CSP), celui-ci les route et les teste un par un.

## À faire
1. **Sentry, région UE (Francfort)**, organisation créée par L0-08 (région définitive à la création). SDK dans le web et les workers ; `before_send` qui retire les motifs de clé (`sk-or-`, `sk-ant-`, `sk_live_`, `whsec_`, même filtre que les journaux de L5-01), les jetons d'URL (`/v/<jeton>` → `/v/:jeton`) et les adresses e-mail ; étiquettes d'environnement et de version (commit).
2. **Pages de visite** : aucun script Sentry. Point d'entrée `/api/erreur-visite` (livré par L5-12) relayé vers Sentry côté serveur, sans jeton, avec limite de débit.
3. **Better Stack gratuit** : sondes de disponibilité sur `app.`, `visite.` (un partage du témoin) et `cdn.` (un fichier du moteur) ; battements de cœur des workers lecture, rendu et tâches périodiques, alerte après 10 min d'absence.
4. **Tâche périodique `service/supervision.py`** (toutes les 5 min, Procrastinate) :
   - âge du plus vieux travail en file, par file ;
   - taux d'échec de la visite de contrôle sur 24 h (seuil à établir) ; toute image omise après nouvelles tentatives (R2, L5-11) ;
   - coût IA d'un plan au-delà de 3 $ (`travaux.cout_usd`), et toute erreur 402 (`appels_ia.statut = refus_402`) ;
   - seuils de 50, 80 et 100 % de chaque clé OpenRouter, lus par L5-09 sur `GET /api/v1/key` ;
   - réservation de crédit orpheline et invariants du grand livre en échec (tâche horaire de L5-07) ; invariant C7 du journal (L5-15) ;
   - rebonds et plaintes d'e-mails (webhook de L5-14) ; rapports de violation de CSP en hausse (`/api/csp`, L5-12) ;
   - espace disque de la VM.
5. **Envoi des alertes** par e-mail à l'équipe : clé d'incident, une seule alerte par incident, rappel après 1 h, message de retour à la normale, lien vers la procédure (L5-21). Aucun secret, aucun jeton, aucune donnée de client dans le texte.
6. **Métriques d'infrastructure** : Cockpit si Scaleway est retenu (D2) ; sinon l'équivalent du fournisseur. La logique d'alerte métier reste dans notre code pour garder le service déployable partout (décision n° 2).
7. **Scénarios de déclenchement** `service/tests/alertes/`, un par alerte, joués en préproduction : worker arrêté, travail vieilli, contrôle en échec forcé, photo omise, coût de 4 $ inséré, 402 renvoyé par le faux serveur OpenRouter (L4-03), réservation orpheline, rafale de rapports CSP, rebond simulé, disque presque plein.

## Critères d'acceptation
- [ ] Chaque alerte du point 4, provoquée en préproduction, arrive par e-mail en moins de 15 min avec le lien vers sa procédure ; liste cochée dans le README des scénarios.
- [ ] Une exception levée dans un worker avec `sk-or-test…` dans son message arrive dans Sentry UE sans le motif (test).
- [ ] Aucun script Sentry dans les pages de visite (test sur le HTML publié et la CSP).
- [ ] Worker lecture arrêté : alerte de battement de cœur après 10 min.
- [ ] Aucun appel payant pour tester : 402 et coûts simulés par le faux serveur OpenRouter ou des lignes de test.
- [ ] Une alerte en cours n'est pas renvoyée à chaque passage de la tâche.

## Points d'attention
- D5 et D2 ne sont pas encore validées (L0-03). La région Sentry ne se change plus après la création : à décider avant d'ouvrir le compte.
- Better Stack gratuit : 10 sondes et 1 page d'état, partagées avec la page d'état de L5-21.
- Chevauchement à tenir : L5-09 lit les clés OpenRouter et calcule les budgets, L5-07 vérifie les invariants du grand livre ; ils écrivent un signal, ce ticket envoie l'alerte. Une seule implémentation par signal.
- Seuil du taux d'échec du contrôle : aucun chiffre dans les documents (« à établir »). Proposition de départ : alerte au-delà de 20 % sur 24 h, aligné sur le seuil d'échec après lecture d'`OFFRES.md` § 8.11.
- Sentry dans le navigateur des pages de l'application : exemption à valider par l'avocat (`SUIVI.md` § 8) ; au lancement, serveur seulement. Comptes Sentry aux États-Unis : à inscrire au registre (L0-09).

## Références
- `produit/ARCHITECTURE.md` D5, § 2.1, § 6.7, § 9.4, M2.11 ; `produit/recherche/hebergement.md` § 7, § 10 ; `produit/recherche/audit-code.md` A11.
- `produit/OFFRES.md` § 6.7, § 8.11 ; `produit/SUIVI.md` § 5.8, § 7.4 (C7), § 8.

## Hors périmètre
- Procédures d'incident, mode maintenance et page d'état : L5-21. Préproduction : L5-18.
- Alertes métier (conversion de l'aperçu, marge) : L7-06, L8-09. Webhooks Stripe : L8-01. Certificats des domaines clients : L11-01.
- Tableau interne des coûts : L5-17, L7-06.
