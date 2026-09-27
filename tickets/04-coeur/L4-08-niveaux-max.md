# L4-08 · Plans sur plusieurs niveaux refusés en service

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | S (jusqu'à 1 j) | L4-01 | `pipeline/` [P] | À faire |

## Pourquoi
Consigne du projet : avancer plan par plan, sans généraliser à des cas inconnus (duplex). Principe 7 d'ARCHITECTURE.md : une capacité n'ouvre en production qu'après validation sur des plans réels ; `niveaux_max = 1` en production tant que les duplex ne sont pas validés. OFFRES.md § 1 : les plans à plusieurs niveaux sont refusés avant toute dépense, avec un message « pas encore pris en charge ». Or l'outil local accepte désormais plusieurs niveaux (travail en cours, `pipeline/niveaux.py`) : `niveaux_refus` ne refuse que les niveaux qui n'ont pas pu être séparés ou superposés. Il faut un réglage qui refuse tout plan au-delà de `niveaux_max`, sans rien changer en local.

## À faire
1. **Condition ajoutée** dans `niveaux_refus` (`pipeline/serveur.py:218` ; L4-04, qui dépend de ce ticket, la déplacera ensuite dans `pipeline/etapes.py`) : `n = max(1, nombre de niveaux d'extract.json, niveaux vus par la qualification)` ; si `n > config.produit.niveaux_max`, refus définitif avec le code `depot.refus.niveaux` (catalogue de L4-05 ; en attendant, le texte de MESSAGES.md § 7.1, sans le mot « duplex »), sans détail technique.
2. **Moment du refus**, inchangé : `niveaux_refus` est déjà appelé dans `analyse` juste après `extract` (`:190`, avant la calibration et la qualification), dans `calibration_needed` après la qualification (`:237`), et au début de `lecture` (`:289`). Pour un PDF vectoriel, les niveaux sont lus sans IA : refus avant tout appel. Pour une image, ils peuvent n'être connus qu'après la qualification (environ 0,02 $).
3. **Valeurs** : `Config.depuis_env()` (L4-01) garde en local une valeur sans limite (variable `PLAN_NIVEAUX_MAX` vide par défaut), pour que le travail sur les duplex continue ; la configuration du service fixe `niveaux_max = 1`.
4. **Avec l'agent des duplex** : s'accorder sur les champs lus (`extract.json` → `niveaux`, qualification → `niveaux`) ; `pipeline/niveaux.py` n'est pas modifié (ARCHITECTURE.md § 8.1, règle 4).
5. **Tests** :
   - unitaires : `niveaux_refus` avec un `extract.json` fabriqué à 1 et 2 niveaux, et une qualification à 1 et 2 niveaux, pour `niveaux_max` = 1, 2 et sans limite ;
   - intégration locale (hors CI, plan réel jamais versionné) : un plan à deux niveaux fourni par l'utilisateur, `niveaux_max = 1` et `ia_autorisee = False` (tout appel lèverait une erreur) → refus à l'analyse, journal des appels vide.

## Critères d'acceptation
- [ ] `niveaux_max = 1` : un PDF à deux niveaux est refusé à l'analyse, sans aucun appel IA (`ia_autorisee = False` ne lève pas, `appels-ia.json` absent) ; message du catalogue, sans « duplex » ni texte technique.
- [ ] Image à deux niveaux : refusée au plus tard après la qualification, jamais après le début de la lecture.
- [ ] Réglage local par défaut : les plans à plusieurs niveaux de l'agent des duplex donnent le même résultat qu'avant (rejeu de ses plans).
- [ ] Plans à un niveau inchangés (rejeu sans IA des références, L1-02).
- [ ] Contrôle « aucun texte technique » (L1-04) ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **« Avant tout appel payant »** (M1.9) n'est vrai que pour les PDF vectoriels : une image passe par la qualification (environ 0,02 $) avant que ses niveaux soient connus, sauf si `extract` les détecte déjà sur l'image. Accepter cette nuance, ou la reprendre dans L6-02.
- **Deux causes, un message** : « niveaux non séparés » (défaut technique, local) et « au-delà de `niveaux_max` » (choix de périmètre) mènent au même texte pour l'utilisateur, mais doivent garder deux causes distinctes au journal pour la mesure (`motif_refus = plusieurs_niveaux`, SUIVI.md § 3.2).
- **Ordre avec L4-04 : tranché.** L4-04, qui déplace `niveaux_refus`, dépend de ce ticket : celui-ci passe avant.
- **Tranché : R17.** Aujourd'hui, un PDF de plusieurs lots serait empilé comme des niveaux par l'analyse, donc refusé ici avec le message « plusieurs niveaux ». En service, c'est la qualification qui refuse « plusieurs lots » (`depot.refus.plusieurs_lots`, L6-02) ; seul l'import promoteur (L10-02) découpe un PDF de plusieurs lots. Ici, rien n'est généralisé ; l'ordre des deux refus, pour que l'utilisateur lise le bon message, se règle dans L6-02.
- MESSAGES.md § 12.1 laisse ouverte la question du mot « duplex » dans la FAQ ; les refus disent « plusieurs niveaux » dans tous les cas.
- **Coordination avec le travail sur les duplex** : ce ticket se fait avec l'agent des duplex (ARCHITECTURE.md, M1.9) ; diff limité à `niveaux_refus` ; critère de fusion du § 8.1.

## Références
- produit/ARCHITECTURE.md § 1 (principe 7), § 7.2 (`ConfigProduit`), § 8.1 (règles 4 et 5), M1.9 ; produit/OFFRES.md § 1 (Périmètre), § 7.1 ; produit/PARCOURS.md § 1.6 (ligne « Plusieurs niveaux ») ; produit/MESSAGES.md § 7.1, § 12.1 ; CLAUDE.md.
- pipeline/serveur.py:132 (`analyse`, appel `:190`), :197 (`texte_niveaux`), :218 (`niveaux_refus`), :237 (`calibration_needed`), :260 (`qualifier`, champ `niveaux`), :289 (`lecture`) ; pipeline/niveaux.py (non modifié) ; pipeline/extract.py (`pages_niveaux`, champ `niveaux`).

## Hors périmètre
- Ouverture des plans à plusieurs niveaux en service : L13-08. Qualification étendue aux PDF : L6-02. Formulaire « Me prévenir si cela change » et événement `alerte_prise_en_charge_demandee` : parcours du lot 6.
