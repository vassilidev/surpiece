# L1-17 · Délai : l'acheteur a son plan et sa visite en quelques minutes

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | L (3 à 5 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
Décision de l'utilisateur du 28/09/2026 (n° 16), mot pour mot : « je veux que mon utilisateur sur le site internet ait son plan et sa visite en quelques minutes », puis, le même jour : « la qualité prime sur la rapidité, on peut avoir une app plus lente pour un meilleur résultat plutôt que l'inverse » ; l'attente se met en scène (L6-03 : animation, questions utiles, plan original face au plan redessiné, extraction montrée au fil de l'eau). Mesuré le 28/09/2026 sur les 4 lectures payées gardées (`appels-ia.json`, champ `duree_s`) : 8 à 15 min de bout en bout, dont 5 à 10 min pour l'appel principal de lecture (289 à 615 s ; 24 500 à 48 800 jetons de sortie, réflexion comprise, effort `medium`), 1 à 3 min de relecture, environ 2 min de contrôle et de photos sur un Mac M3. Le rendu sans GPU (SwiftShader, R3) allongera les photos et les panoramas (mesure : L1-16).

## À faire
1. **Chronométrer chaque étape** d'un dépôt, du fichier reçu à la visite prête, et l'écrire dans `rapport.json` (analyse, qualification, lecture, relecture, arbitrage, murs, complément, contrôle, photos, panoramas), sur les 5 références rejouées sans IA (L1-02) et, pour l'IA, d'après les `duree_s` gardés.
2. **Affichage progressif** (sans IA, gratuit) : plan 2D et maquette publiés dès la fin de l'assemblage et du contrôle, puis la visite, puis photos et 360° ajoutés au fil de l'eau ; l'écran d'attente (L6-03) les montre dès qu'ils existent. Jamais rien de publié avant la visite de contrôle réussie (R2).
3. **Lecture plus courte, sans perte de fidélité**, à mesurer dans cet ordre :
   - pré-remplissage par le programme de ce qu'il sait déjà lire (portes sur leurs arcs, pièces sur leurs étiquettes et leurs murs, baies sur la légende) : l'IA confirme ou corrige au lieu de tout écrire ;
   - lectures en parallèle (par niveau, par zone, ou pièces d'un côté et ouvertures de l'autre), puis assemblage ;
   - effort de réflexion ou modèle adapté à chaque partie ;
   - relecture et arbitrages en parallèle.
4. **Rendus en parallèle** : contrôle, photos et panoramas en même temps, la première image d'abord.
5. **Budget d'essais payants accordé le 28/09/2026 : 15 à 20 $** (1 à 2 $ par lecture), sur les plans déjà lus ; chaque essai comparé aux relevés de référence par `pipeline/evaluer.py` ; une variante plus rapide n'est gardée que si la fidélité est au moins égale (la qualité prime).

## Critères d'acceptation
- [ ] Temps de chaque étape écrit dans `rapport.json` et tableau avant/après sur les 5 références.
- [ ] Objectif, toujours second après la qualité : plan 2D et maquette en 2 à 3 min, visite complète en 4 à 5 min, photos et 360° dans la minute qui suit (médiane sur les 5 références, machine visée écrite).
- [ ] Aucune perte de fidélité : `evaluer.py` au moins égal à la ligne de base sur les références, visite de contrôle réussie, rejeu sans IA identique hors changements voulus.
- [ ] Coût par plan inchangé ou plus bas (plafond de 3 $, R6).

## Résultats des essais payants du 28/09/2026 (13,40 $ sur 20 $, contre-vérifiés)
Mesurés sur le D201 et le T2 432 (relevés de référence), `evaluer.py` et visite de contrôle à chaque essai :

| Variante | Appel principal | Fidélité | Verdict |
|---|---|---|---|
| Lecture gardée (référence) | 615 s / 426 s | D201 : ouvertures 7/7, équipements 6/6 ; 432 : 7/7, 6/7 | meilleur tirage connu |
| Nouvelle lecture, code actuel | 497 s / 427 s | sèche-serviettes perdu sur les deux ; contrôle du 432 raté | aléa d'un tirage (L1-18) |
| Effort bas | 261 s / 253 s | 432 : vasque à 3,20 m, sèche-serviettes à 1,96 m ; contrôle raté | écartée |
| Lecture découpée en 3, en parallèle | 313 s / 215 s | 432 : vasque et sèche-serviettes posés sur la gaine ; contrôle raté | écartée |
| Pré-remplissage (étiquettes, tableau) | 476 s / 299 s | 432 : porte de placard et sèche-serviettes manquants ; contrôle du D201 raté | écartée |
| Relecture en effort bas | relecture 16 s au lieu de 50 à 349 s | D201 : sèche-serviettes plus rattrapé | écartée |
| Arbitrage en parallèle | arbitrage 4 à 15 s au lieu de 6 à 56 s | identique (vérifié aussi sur le 3124) | retenue, option `PLAN_ARBITRAGE_PARALLELE=1`, désactivée par défaut |

Conclusion : aucune variante qui raccourcit l'appel principal n'est aussi fidèle ; la lecture actuelle est gardée (la qualité prime, décision 16). Le délai se traite par l'attente mise en scène et l'affichage progressif (L6-03), et la qualité d'un tirage par la régularité (L1-18). Le pré-remplissage des portes sur leurs arcs a été abandonné avant l'essai : le détecteur de vantail ouvert ou fermé se trompait sur environ la moitié des arcs.

## Points d'attention
- Une lecture découpée ou pré-remplie change le format de la réponse de l'IA : lectures gardées (`reponse-ia.json`) à versionner (`_extract`, format), rejeu sans IA toujours possible.
- La relecture et l'arbitrage ont rattrapé de vraies erreurs (HISTORIQUE.md) : on ne les supprime pas pour gagner du temps, on les parallélise.
- Les photos et les panoramas en SwiftShader peuvent dépasser à eux seuls « quelques minutes » : L1-16 donne la mesure, L13-01 l'accélération.

## Références
- CLAUDE.md (consigne « Délai ») ; produit/PLAN.md § 2.1 (décision 16) ; HISTORIQUE.md ; tickets L1-02, L1-16, L4-02 (journal et budget), L6-03 (écran d'attente), L13-01.
