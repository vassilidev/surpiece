# L1-13 · Valider la lecture réelle par l'IA d'un plan à plusieurs niveaux (duplex)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P1 | M (1 à 3 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 11) : les logements sur plusieurs niveaux (duplex, triplex) sont gérés, toujours validés plan par plan. La chaîne a été développée et validée sur la duplex `plans/3081-613-ef700f1f` avec une lecture préparée à la main (`reponse-ia.json`), sans aucun appel à l'IA : contrôle réussi, 12 photos. La lecture payante lancée sur ce plan avait été annulée. Personne n'a donc encore vu l'IA lire un plan à plusieurs niveaux : séparation et noms des niveaux, escalier, trémie, légende des sigles de baies, garde-corps dessinés comme des cloisons. L'utilisateur va redéposer le PDF. Le même jour, il a confirmé : « oui le duplex on l'a géré c'est bon, c'était avant ça ». Les duplex sont acceptés en service (`niveaux_max = 2`, L4-08) et affichés au périmètre (« un ou deux niveaux ») sans attendre ce ticket. Il reste une vérification utile : mesurer le coût réel et voir l'IA lire une duplex, pour en tirer des contrôles automatiques.

## À faire
1. **Préalables gratuits** :
   - rejeu sans IA de la duplex (`outils/finalise.sh 3081-613-ef700f1f`, clés vidées) : visite de contrôle réussie ;
   - garder hors du dépôt, dans le jeu privé de L1-02, la lecture préparée et le `plan.json` qui en sort : c'est la référence de ce ticket ;
   - vérifier `evaluer.py` sur un plan à plusieurs niveaux : aujourd'hui `--niveau` ne s'applique qu'au plan lu, la référence garde le niveau d'entrée (bloc `__main__`, `un_niveau`). Corriger, avec un test, pour comparer chaque niveau au même niveau.
2. **Lecture payante, une seule fois, sur accord explicite de l'utilisateur** : dépôt normal du PDF redéposé dans l'outil local, clé `dev` plafonnée ; coût estimé 1,5 à 2 $ (non mesuré). Si possible après L1-08 (ZDR) et L1-10 (cartouche masqué), pour lire dans les conditions du service.
3. **Mesures** : niveaux trouvés et nommés comme sur le plan ; recalage des niveaux (décalage, part des murs superposés) ; escalier (nombre de girons, sens de montée), trémie, palier ; `evaluer.py` niveau par niveau contre la référence ; sigles de baies recoupés avec la légende du plan (contrôle `baie`, champ `allege`), parties fixes (`fixe`), robinetterie (`tap`) ; aucun garde-corps sur un tracé de cloison (contrôle `garde-corps`, règle `gc_en_cloison`) ; test d'immersion ; surfaces comparées au tableau ; nombre de niveaux vu par la qualification recoupé avec l'extraction ; coût (`appels-ia.json`, relecture propre aux niveaux `RELECTURE_NIVEAUX` comprise) et durée de bout en bout.
4. **Relecture humaine « zéro défaut visible »**, niveau par niveau : `outils/marche.mjs`, `vues.mjs`, `trajets.mjs` (montée et descente de l'escalier), planche des photos, liste de CLAUDE.md, contrôle des textes (L1-04 s'il existe).
5. **Chaque défaut trouvé devient un contrôle automatique**, qui échoue avant la correction et passe après. Aucune retouche du résultat à la main. Une correction de la chaîne suivie d'une nouvelle lecture payante se fait sur un nouvel accord, dans un ticket à part si elle dépasse la taille M.
6. **Garder la lecture réelle** dans le jeu privé de L1-02, comme seconde lecture gardée de la duplex, et l'ajouter au rejeu.
7. **Consigner** dans HISTORIQUE.md : date, coût, durée, chiffres d'`evaluer.py`, défauts et contrôles ajoutés ; reporter le coût mesuré dans L5-09.

## Critères d'acceptation
- [ ] Préalables gratuits réussis avant toute dépense ; accord de l'utilisateur noté (date, plafond).
- [ ] Lecture réelle : niveaux séparés sans arrêt, visite de contrôle réussie (réparations notées), photos produites ; coût sous le plafond de 3 $ par plan (R6).
- [ ] `evaluer.py` compare chaque niveau au même niveau de la référence (test fourni) ; chiffres par niveau, coût et durée notés.
- [ ] Relecture humaine datée : zéro défaut visible, ou défauts consignés, chacun avec son contrôle automatique vérifié en remettant le défaut.
- [ ] Rejeu L1-02 : les 4 plans à un niveau inchangés ; la duplex rejouée avec ses deux lectures gardées.
- [ ] Aucun fichier de ce plan dans le dépôt ni dans le ticket.

## Points d'attention
- Plan de promoteur : jamais versionné ni montré ; aucun nom de programme ni de promoteur dans le ticket ni dans les journaux.
- Ne pas payer de lecture vouée à l'échec : les préalables gratuits passent d'abord ; en cas d'échec, rejouer sans IA avant toute relance.
- Hors test ici : triplex, escalier quart tournant, entrée au niveau haut, plan en image. Chacun attend un plan fourni par l'utilisateur (plan par plan), jamais une généralisation.
- Le résultat ne conditionne ni l'ouverture des duplex en service, ni les textes publics, ni le recrutement des testeurs : tranchés par la décision 11 (PLAN.md § 2.1). Un défaut trouvé ici devient un contrôle et une correction de la chaîne, pas un retour en arrière du périmètre.
- `pipeline/` porte le travail sur les niveaux, fini mais non commité : faire ce ticket sur le commit qui l'intègre.

## Références
- HISTORIQUE.md (« Logements sur plusieurs niveaux ») ; moteur/SCHEMA.md (« Plusieurs niveaux ») ; CLAUDE.md ; PLAN.md § 2.1 (décision 11).
- pipeline/extract.py (niveaux, recalage, escaliers) ; pipeline/niveaux.py (`gc_en_cloison`) ; pipeline/lire.py (`legende_baies`, `RELECTURE_NIVEAUX`) ; pipeline/evaluer.py (`un_niveau`, `__main__`) ; moteur/controle.mjs (`baie`, `garde-corps`, `etancheite`, `niveau`, `escalier`) ; outils/finalise.sh.

## Hors périmètre
- Réglage `niveaux_max` (2 en service) : L4-08. Travail sur les niveaux : L13-08 (fait).
- Témoin fictif à deux niveaux pour la CI : à décider.
