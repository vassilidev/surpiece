# L13-08 · Plans sur plusieurs niveaux en service

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P1 | M (1 à 3 j) | — | `pipeline/` [P] | Fait (27/09/2026) |

## Pourquoi
L'utilisateur a levé la consigne « sans généraliser (duplex…) » (décision 11). Le travail est fait le 27/09/2026 (23 fichiers, non commité ; `HISTORIQUE.md`, entrée « Logements sur plusieurs niveaux »). Le même jour, l'utilisateur a confirmé : « oui le duplex on l'a géré c'est bon, c'était avant ça ». Les duplex sont donc acceptés en service : `niveaux_max = 2` (L4-08). Un format validé entre dans le prix de base : ce n'est pas une option (OFFRES.md § 7.1).

## Ce qui est fait (27/09/2026)
- **Extraction** : zone et nom de chaque niveau (R+1, RDC, Niveau…) ; superposition par corrélation des murs (décalage du R+2 : 6,39 m, 91 % des murs superposés) ; escaliers dessinés reconnus (14 girons de 25 cm) ; pages d'un même logement empilées ; arrêt clair avant la lecture payante si les niveaux ne se séparent pas.
- **Chaîne** (`pipeline/niveaux.py`) : chaque niveau assemblé avec le code d'un seul niveau, puis superposé ; escalier (dernière contremarche calée sur le bord de la trémie), trémie calée au nu des murs, garde-corps sur ses bords libres, palier d'arrivée ; dalles, plafonds et toits de chaque niveau ; arrêt « Escalier » dans la visite guidée, sauf à moins de 1,5 m d'un arrêt du même niveau : cet arrêt prend alors le rôle d'escalier (28/09/2026, duplex : l'Entrée) ; une vue d'ensemble par niveau. Un garde-corps lu sur une bande d'aplats de l'épaisseur des cloisons devient une cloison (`gc_en_cloison`, sauf mention « GC »). Fenêtres sur allège vitrée (`allege`) posées d'après la légende du plan.
- **Moteur** : niveaux superposés, escalier plein avec main courante, visiteur qui monte et descend au clavier, itinéraires à travers l'escalier, onglets R+1 / R+2 dans le plan 2D et la maquette, fiche découpée par niveau.
- **Contrôles automatiques nouveaux**, chacun vérifié en remettant le défaut : cage d'escalier sans ligne claire ni pointillés au raccord des niveaux, façade sans bande qui scintille, cloisons du dessus qui ne descendent plus sous le plafond du dessous (`pieds`, `joints`), caméra qui ne traverse plus l'escalier, aucun garde-corps de trémie sur un tracé de cloison (`garde-corps`), test d'immersion sur tous les plans (`etancheite`), baies recoupées avec le sigle de la légende de leur plan (`baie`). S'y ajoutent les contrôles des niveaux de la visite de contrôle (`escalier`, `vide`, `dalle`, `niveau`).
- **Résultat** sur la duplex `plans/3081-613-ef700f1f` (R+1 et R+2 sur la même page, 60,7 m² habitables, deux loggias), avec une lecture préparée à la main, sans appel à l'IA : visite de contrôle réussie, 12 photos (une vue d'ensemble par niveau), montée et descente au clavier de 0 à 2,80 m, surfaces à 2 % près du tableau, 1 min 20 de réassemblage, contrôle et photos. Les 4 plans à un niveau sortent à l'identique (`plan.json`, photos).

## Validation plan par plan, quand un plan est fourni
Ce n'est pas du travail restant. Consigne du projet (`CLAUDE.md`) : on avance plan par plan avec les plans fournis. Un triplex, un escalier quart tournant, une entrée au niveau haut ou un plan en image à plusieurs niveaux se valide le jour où l'utilisateur en fournit un : rejeu sans IA, visite de contrôle, relecture « zéro défaut visible », chaque défaut trouvé devenu un contrôle automatique. Le triplex reste refusé en service par `niveaux_max = 2` tant qu'un plan réel de triplex n'a pas été validé ; la valeur se relève alors par simple réglage (L4-08). La lecture réelle par l'IA d'une duplex (L1-13) est une vérification utile, pas un préalable.

## Suites dans d'autres tickets
- Réglage `niveaux_max` et refus au-delà de 2 niveaux : L4-08.
- Lecture réelle d'une duplex par l'IA, sur accord : L1-13.
- Nombre d'images d'aperçu d'un duplex (une vue du dessus et un plan 2D par niveau, à confirmer) : L0-04, puis L4-09 et L6-05.
- Textes du catalogue de messages (`texte_niveaux`, `depot.reconnu.niveaux`, `depot.refus.niveaux`) : L4-05.
- Empreinte d'un plan sur plusieurs pages : L6-06 avec L5-23.

## Critères d'acceptation
- [x] Duplex 3081-613 assemblée depuis sa lecture gardée : visite de contrôle réussie, 12 photos au bon étage.
- [x] Les 4 plans à un niveau sortent à l'identique (`plan.json`, photos).
- [x] Chaque défaut trouvé à l'inspection est devenu un contrôle automatique, vérifié en remettant le défaut (`HISTORIQUE.md`).
- [x] Aucune lecture payante dépensée pour valider (lecture préparée à la main).
- [x] Périmètre affiché aligné sur « un ou deux niveaux (duplex) » dans OFFRES.md, MESSAGES.md, MARQUE.md, PARCOURS.md et SUIVI.md (27/09/2026).

## Points d'attention
- **Pas encore commité** : 23 fichiers ; les tickets `[P]` et `[M]` partent de ce commit (ARCHITECTURE.md § 8.1). `niveaux.py` n'est pas touché par la migration (règle 4).
- La qualification demande déjà le nombre de niveaux à l'IA (`qualifier`, `pipeline/serveur.py:323`) et le recoupe avec l'extraction (L6-02).

## Références
- HISTORIQUE.md (« Logements sur plusieurs niveaux ») ; CLAUDE.md ; produit/PLAN.md § 2.1 (décision 11).
- `pipeline/niveaux.py` ; `pipeline/serveur.py:166-205` (pages par niveau), `:243-261` (`texte_niveaux`, `fait_niveaux`), `:271` (`niveaux_refus`), relevés le 27/09/2026 ; `moteur/SCHEMA.md` § Plusieurs niveaux ; `moteur/controle.mjs` ; `moteur/photos.mjs:71-87` ; `outils/vues.mjs`.
