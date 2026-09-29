# L1-18 · Régularité de la lecture : chiffrer l'aléa d'un tirage et le réduire

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | L (3 à 5 j) | L1-02 | `pipeline/` [P] | En cours |

## Pourquoi
Essais payants du 28/09/2026 (L1-17, 13,40 $ sur les 20 $ accordés) : une nouvelle lecture du D201 et du T2 432 avec le code actuel, réglages inchangés, ne retrouve pas le niveau des lectures gardées. Le sèche-serviettes manque sur les deux plans, et la visite de contrôle du 432 échoue 4 fois (nom de pièce écrit sur une cote dans le plan 2D, objet qui dépasse dans la maquette). Les lectures gardées dans `reponse-ia.json` sont donc les meilleurs tirages connus, pas le niveau normal. Pour un acheteur, c'est le tirage du jour qui compte. Décision 16 : la qualité prime sur la rapidité.

## À faire
1. **Chiffrer l'aléa** : 2 à 3 tirages de base par plan de référence (D201, 432), au code actuel, sur accord de budget (environ 1,5 $ par tirage ; reste 6,6 $ du budget d'essais accordé le 28/09/2026) ; tableau `evaluer.py` et visite de contrôle pour chaque tirage.
2. **Comprendre chaque perte** : le sèche-serviettes vu par la relecture mais non appliqué (base2 du D201), le placard « en trop » du 432 gardé deux fois par l'arbitrage (« B absent » lu comme une omission), les pertes de la relecture en effort bas.
3. **Réduire l'aléa sans perdre en fidélité**, à mesurer : consignes ciblées sur les oublis répétés, contrôles automatiques du programme sur ce que le plan dessine (symbole de sèche-serviettes, repère de descente EP…), arbitrage plus sûr ; en option à décider par l'utilisateur, deux lectures et consensus (coût double, plafond de 3 $ par plan, R6).
4. **Visite de contrôle intermittente** : « matière facade/ground uniforme : surface sans texture » a échoué 2 fois puis réussi sans réparation sur le même plan.json (rejeu du 432, 28/09/2026). Trouver la cause (chargement des textures) : un contrôle intermittent bloquerait une publication à tort.

## Avancement (28/09/2026, contre-vérifié)
**Budget d'essais** : 6,165 $ dépensés sur les 6,60 $ restants, recomptés dans les `appels-ia.json` : 4 lectures complètes au code du jour (D201 1,413 $ et 1,970 $ ; 432 1,065 $ et 1,699 $), plus 0,018 $ pour la vraie question d'arbitrage du sèche-serviettes de base2 (contre-vérification). Reste 0,435 $ du budget de 20 $. Lectures payées gardées dans `plans/_essai-lecture-d201-f14b3e4b-regul-1` et `-regul-2`, `plans/_essai-lecture-t2-432-21258e6e-regul-1` et `-regul-2`, arbitrage réel dans `plans/_essai-lecture-d201-f14b3e4b-base2-arbitre`.

**1. Aléa chiffré** (4 tirages par plan au réglage actuel : lecture gardée, base2, deux nouveaux ; `evaluer.py`, inventaire, visite de contrôle, vues 3D) :
- D201 : sèche-serviettes absent de l'appel principal 8 fois sur 8 (toutes variantes), rattrapé par la relecture en effort medium 9 fois sur 9. Au final, 7/7 ouvertures et 6/6 équipements 3 fois sur 4. Défauts que ni `evaluer.py` ni le contrôle ne voyaient : trou de 0,74 m dans la cloison salle de bain / séjour (nouveau 1), placard de l'entrée muré par une cloison lue sur ses portes (nouveau 2), nom « Entrée + Pl » affiché.
- 432 : sèche-serviettes manquant 3 fois sur 4, jamais signalé par la relecture ; descente EP jamais lue par l'appel principal ; placard en double sur le coffret TE 2 fois sur 4 ; cloison chambre / séjour absente sur 3,20 m et cloison salle de bain / cuisine sur 0,74 m (nouveau 1) ; contrôle raté 2 fois sur 4.
- Un seul tirage publiable sans défaut connu par plan : la lecture gardée.

**2 et 3. Pertes comprises, corrigées sans IA** (règles sur ce que le plan dessine, notées dans le journal des murs du rapport) :
- `lire.normalise` : un équipement écrit avec `face` au lieu de `dir` est converti au lieu d'être écarté (sèche-serviettes de la relecture de base2, D201, qui faisait refuser toute la relecture). La consigne RELECTURE donne le format de chaque type. Vérifié par la vraie question d'arbitrage, posée dans les deux ordres : correction gardée les deux fois, D201 base2 passe de 5/6 à 6/6.
- `murs.cloisons_oubliees` : bande blanche non classée, ou double trait, ajoutée comme cloison. Condition : rien ne sépare les deux pièces à cet endroit, et il y a une pièce différente de chaque côté sur au moins 60 % de la longueur. Cas corrigés : 432 nouveau 1 (3,18 m et 1,05 m) et D201 nouveau 1 (0,81 m). Trou refermé, vérifié en vue de dessus.
- `murs.placards_sur_tableau` : un placard lu sur le rectangle du tableau électrique est écarté, et on ne paie plus de question d'arbitrage pour lui.
- `murs.seche_serviettes` : un sèche-serviettes dessiné au trait et absent de la lecture est ajouté. Il faut deux traits parallèles de 0,35 à 0,80 m, à 3-12 cm d'un mur de pièce d'eau, hors équipement, gaine et baie.
  - Portée réelle : le 432 seulement.
  - Sur le D201, le 3124 et le plan du lot, le symbole n'est pas dans les tracés vectoriels. Vérifié en retirant le sèche-serviettes lu : rien n'est ajouté ailleurs, rien n'est inventé.
- Autres corrections :
  - `murs.degage_placard` : cloison lue sur les portes d'un placard, retirée devant elles ;
  - `murs.niches` : pièce qui passe derrière sa porte TE ;
  - `murs.soude` : le cadre d'une gaine n'est plus comblé en béton ;
  - `lire.nom_hors_cotes` : nom de pièce écrit sur le texte d'une cote ;
  - « + Pl » s'écrit « + placard ».
- Ajouté à la contre-vérification :
  - `murs.piece_eau` : l'ancien test de sous-chaîne prenait « bureau » ou « plateau » pour une pièce d'eau, à cause de « eau » ;
  - les baies sont exclues des candidats sèche-serviettes (vantail coulissant, appui de fenêtre).

**Rejeu sans IA, code d'avant contre code d'après.** Les lectures gardées sont identiques octet pour octet sur le D201, la duplex 3081, le 3124 et le plan du lot. Le 432 ne perd que le placard en double (« en trop » passe de 1 à 0). Après la visite de contrôle, le D201 est identique au plan publié, et le 432 aussi, au placard près. Les arrêts de la duplex diffèrent du plan publié le 28/09 à 8 h 35 (arrêt « Escalier ») : l'écart est le même avec le code d'avant, il ne vient pas de ce ticket.

Les 16 tirages déjà payés ont été rejoués à partir des réponses brutes gardées, l'arbitrage étant rejoué d'après les décisions notées. Résultats :
- D201 : 7/7 et 6/6 sur les 5 tirages au prompt actuel. Plus de trou ni de placard muré, contrôle réussi.
- 432 : 6/7 équipements ou mieux sur tous les tirages (base2 : 7/7), plus aucun placard en double. Contrôle réussi sur la lecture gardée et le nouveau 2 (échec après 6 tours avant correction). Il échoue encore sur base2 et le nouveau 1, pour deux causes du moteur :
  - la descente EP, cylindre de hauteur H + 0,3 dans `moteur/engine.js`, dépasse de 15 cm les murs ; tout tirage qui la lit bien est donc bloqué ;
  - le culling, sur le trajet loggia → séjour, en (7,32 ; 3,72) : l'image change le long du vantail de la porte-fenêtre, l'extérieur n'étant pas dessiné (`dehors: false`). Ni l'encoche de 5 × 5 cm à l'angle des cloisons c27 et c29, ni le contour du séjour n'y sont pour rien : vérifié en les corrigeant, l'échec reste.

## Reste à faire
- Moteur (autre chantier, `moteur/` non touché ici) : hauteur de la descente EP (H au lieu de H + 0,3) et culling de l'extérieur vu par la porte-fenêtre de la loggia (432). Tant que ce n'est pas fait, le critère « contrôle réussi à chaque tirage » ne peut pas passer sur le 432.
- Pertes sans correction :
  - descente EP jamais lue par l'appel principal (0 sur 4 ; cause côté IA non établie) ;
  - gaine VH du 432 posée dans l'épaisseur de la façade (nouveau 1, archive) ou lue comme une fenêtre `f_sdb` (nouveau 2) ;
  - petite gaine de 17 × 19 cm du D201 nouveau 2 (noyée à 98 % dans le mur, invisible).
- `lire.nom_hors_cotes` recopie les tailles de texte du moteur (`moteur/ui.js`, TXT). Si le moteur change ces tailles, il faut les reprendre ici. Mieux : que le moteur mesure lui-même les textes des cotes.
- Valider les corrections sur de nouveaux tirages, après le correctif du moteur. Il faut 3 lectures neuves par plan de référence (D201 : environ 1,4 à 2,0 $ ; 432 : environ 1,1 à 1,7 $), soit environ 10 $. Budget à demander : 12 $ au plus. Le reste de 0,435 $ ne suffit pas.
- Point 4 (contrôle « surface sans texture ») : pas revenu sur 15 lancements de 13 plans, mais jamais mesuré 10 fois de suite sur le même plan.json (gratuit, à faire).
- Consensus de deux lectures : non essayé (coût double, décision de l'utilisateur).

## Critères d'acceptation
- [x] Aléa chiffré : au moins 2 tirages par plan de référence, tableau `evaluer.py` et contrôle.
- [ ] Chaque perte expliquée et corrigée, ou reportée avec sa cause.
- [ ] Sur 3 tirages par plan de référence : `evaluer.py` au niveau des lectures gardées (ouvertures, équipements) et visite de contrôle réussie à chaque tirage.
- [ ] Contrôle « surface sans texture » stable sur 10 lancements du même plan.json.

## Points d'attention
- Fait le 28/09/2026 : le dessin de relecture plantait sur une descente EP (`dep`, sans `x` ni `z`), ce qui rendait l'arbitrage impossible et gardait la correction sans vérification. Corrigé (`apercu._equipement`), et `apercu.auto_test()` dessine chaque type d'équipement avant toute relecture payante ; défaut remis : l'auto-test échoue.
- Option retenue par les essais, désactivée par défaut : `PLAN_ARBITRAGE_PARALLELE=1` (fidélité identique, quelques secondes à 40 s gagnées). Risque : jusqu'à 8 requêtes simultanées, un 429 ou un 402 donne « arbitrage impossible ».
- Les rejeux ne remplacent pas un tirage neuf : ils reprennent les réponses gardées, et une question d'arbitrage que le tirage payé n'a jamais posée y compte comme « arbitrage impossible ». Base2 du D201 est le seul cas, tranché par un vrai appel.
- Le moteur change en parallèle (empreinte de `engine.js` passée de 54927ce03d à bafb3fc8dc pendant la contre-vérification) : les contrôles du 28/09 valent pour ces empreintes.
- Budget : chaque tirage est payant ; ne jamais dépasser le budget accordé.

## Références
- tickets L1-17, L1-02 ; `pipeline/lire.py` (`normalise`, `relecture`, `arbitre`, `nom_hors_cotes`), `pipeline/murs.py` (`cloisons_oubliees`, `placards_sur_tableau`, `seche_serviettes`, `degage_placard`, `niches`), `pipeline/apercu.py`, `pipeline/evaluer.py` ; `references/d201.app-d.json`, `references/432.plan.json` ; HISTORIQUE.md.
