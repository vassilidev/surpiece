# L5-22 · Capacité : limites de concurrence et essai de charge sans payer

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P1 | M (1 à 3 j) | L5-06, L5-10, L4-03 | `service/`, `outils/` | À faire |

## Pourquoi
Aujourd'hui, un même créneau couvre la lecture IA (8 à 14 min d'attente réseau) et Chrome : deux lectures bloquent tout rendu, un compte peut occuper les 6 places, il n'y a pas de priorité (`pipeline/serveur.py:23-24`, `run` `:419` ; audit A1). Décision de l'utilisateur n° 4 : le rendu en SwiftShader dans un conteneur est la base ; il est gourmand en CPU (4,7 cœurs occupés en moyenne pour 3 photos sur un M3, `recherche/hebergement.md` § 2.1) et peut affamer le web sur une VM de 4 vCPU. Il faut des bornes, des priorités, et savoir mesurer sans payer à partir de quand ajouter une machine.

## À faire
1. **Concurrence par file**, en réglages (conteneurs de workers séparés dans le Compose) :
   - `lecture` : départ à 2 lectures simultanées sur une VM de 8 Go (0,5 à 1 Go par lecture en cours, estimation d'`hebergement.md` § 1) ;
   - `analyse` : 1 à 2, avec la limite de mémoire du sous-processus (L5-06) ;
   - `rendu` : 1 travail à la fois, conteneur borné en CPU (`cpus` de Docker, par exemple 2 sur 4) et `nice`, pour garder du CPU au web.
2. **Priorités** (`OFFRES.md` § 1) : générations payantes (particuliers, abonnés) avant plans offerts et essais pros, avant imports de promoteurs (file `lecture_lots`) ; même ordre pour la file `rendu`. Par priorité de Procrastinate si la version retenue la gère bien (à vérifier, `ARCHITECTURE.md` § 10), sinon par files séparées consommées dans cet ordre.
3. **Plafond par organisation** `organisations.travaux_simultanes_max` (valeur lue dans la version d'offre du catalogue, R5 ; 2 au départ) : au-delà, le travail attend son tour, il n'est pas refusé ; message `attente.file` ou `erreur.pro.simultanes`. Livré par L5-06 (point 9) ; ici, vérifié sous charge et combiné aux priorités.
4. **Plafond global de travaux en attente** : au-delà, un nouveau lancement n'est pas réservé ; message du catalogue avec un délai estimé (position × durée médiane mesurée) ; les plans offerts passent en file d'abord (`attente.file_offert`).
5. **Essai de charge sans payer** dans `outils/charge/` (nouveau) :
   - faux serveur OpenRouter de L4-03 qui rejoue la lecture gardée du témoin (`reponse-ia.json`) avec une latence réglable (accélérée pour la CI, réelle de 8 à 15 min pour l'essai de référence) ;
   - N dépôts simultanés du témoin (copies d'empreinte différente), chaîne complète jusqu'aux images ;
   - mesures : générations simultanées tenues sans erreur, attente en file, durée de chaque image sous charge, latence du web (9e décile de `/sante` et de l'état public) pendant les rendus, pics de mémoire, arrêts pour manque de mémoire.
6. **Seuils du chemin d'évolution** (`hebergement.md` § 6), écrits dans `service/exploitation/capacite.md` et reliés aux alertes (L5-16) : par exemple attente en file au 9e décile au-delà de 10 min, rendu qui ajoute plus de 10 min, web au-delà de 1 s. Actions : deuxième VM pour les workers, puis les accélérations optionnelles de L13-01 (une tâche par photo, GPU ou Mac), jamais obligatoires (R3).
7. Consigner les valeurs retenues et les résultats de l'essai (date, taille de VM, version).

## Critères d'acceptation
- [ ] Essai de charge sans aucune clé OpenRouter et sans ligne `appels_ia` payante ; rapport en tableau produit par `outils/charge/`.
- [ ] Pendant un rendu SwiftShader, le 9e décile de latence du web reste sous la cible retenue (proposition : 500 ms).
- [ ] Priorité : un travail payant mis en file après trois travaux offerts démarre le premier (test).
- [ ] Plafond par organisation : le troisième travail d'une organisation à 2 attend et affiche le message du catalogue.
- [ ] Plafond global : au-delà, aucun crédit réservé, message avec délai estimé, sans texte technique (L1-04).
- [ ] Aucun arrêt pour manque de mémoire sur la VM de référence à la concurrence retenue.
- [ ] Seuils écrits et alertes correspondantes configurées.

## Points d'attention
- Les mesures ne valent que pour la taille de VM retenue (L0-03) ; à refaire sur toute autre machine (décision n° 2, « déployable partout »).
- La décision n° 4 renvoie l'accélération après la mise en ligne : ce ticket borne et mesure, il n'optimise pas.
- **Textes** : `MESSAGES.md` § 7.4 a `attente.file` (sans délai) et `attente.file_estime` (« Il devrait démarrer dans {attente} ») ; `{attente}` est calculé à partir des durées mesurées, jamais écrit en dur (R12).
- Un travail non démarré sous 24 h libère le crédit (`OFFRES.md` § 6.4, invariant de L5-07) : le plafond global doit rester cohérent avec ce délai.
- Essai de charge avec le témoin seulement ; les 4 plans réels ne servent qu'en local.
- Coordination : le rendu par image (L5-11) change le profil de charge ; refaire l'essai après L5-11, puis après les panoramas et le précalcul (L1-16, L5-27, L5-28), qui multiplient le rendu par plan.

## Références
- Décisions de l'utilisateur du 27/09/2026, n° 2 et n° 4.
- `produit/recherche/hebergement.md` § 1, § 2.1, § 4, § 6 ; `produit/recherche/audit-code.md` A1 ; `produit/OFFRES.md` § 1, § 6.4, § 10 (risque 3).
- `produit/ARCHITECTURE.md` § 2.1, § 4.2 (`travaux_simultanes_max`), § 6.4, § 10 ; `produit/MESSAGES.md` § 7.4, § 7.12 (`erreur.pro.simultanes`).
- `pipeline/serveur.py:23-24` (`RUNNING`, `SLOTS`), `:523` (`run`).

## Hors périmètre
- Accélération du rendu, une tâche par image : L13-01. File des imports de promoteurs : L10-02.
- Deuxième VM : quand un seuil est atteint, hors de ce lot.
