# L13-08 · Plans sur plusieurs niveaux en service

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | S (jusqu'à 1 j) | L4-08 | `pipeline/` [P] | À faire |

## Pourquoi
Un autre agent travaille en ce moment sur les duplex (`pipeline/niveaux.py`, `extract.py`, `lire.py`, `murs.py`, `serveur.py`, `moteur/`). Tant que ce travail n'est pas validé plan par plan sur des plans réels, le service refuse tout plan à plusieurs niveaux (`niveaux_max = 1`, L4-08) et les textes n'en parlent pas (MARQUE.md § 3.4). Consigne de l'utilisateur : avancer plan par plan, sans généraliser à des cas inconnus. Ce ticket ouvre le service aux formats validés, et seulement à eux, puis met à jour textes et offres. Un format validé entre dans le prix de base : ce n'est pas une option (OFFRES.md § 7.1).

## À faire
1. **Critère d'ouverture écrit**, par format (duplex d'abord ; triplex seulement s'il est validé à part) :
   - plans réels fournis par l'utilisateur, rejoués sans IA (L1-02) ; `evaluer.py` contre un relevé fait à la main ;
   - visite de contrôle réussie (escaliers, trémies, dalles) ; photos au bon étage (`moteur/photos.mjs` refuse déjà une photo prise au mauvais niveau, l. 80-90) ;
   - images d'aperçu par niveau (vue du dessus et plan 2D, comme `outils/vues.mjs`) ;
   - zéro défaut visible relu par l'utilisateur ; décision consignée.
2. **Réglage** : `ConfigProduit.niveaux_max` passé en service à la valeur validée (2 pour les duplex), jamais au-delà ; `niveaux_refus` (`pipeline/serveur.py:218`) inchangé pour les autres cas ; retour à 1 par simple réglage si un défaut apparaît.
3. **Aperçu d'un duplex** : décider combien d'images (une vue du dessus par niveau ? une photo par niveau ?) et vérifier L4-09 et L6-05 en conséquence.
4. **Textes et offres** : « appartements sur un seul niveau » à remplacer par le périmètre validé dans MESSAGES.md (§ 0.4, § 1.1, § 1.9 dont la question sur les duplex, § 3.5, § 3.10, § 5.5, § 6.4, § 7.1 `depot.reconnu.limites` et `depot.refus.niveaux`, § 7.7 `achat.limites`, § 8.4, § 9.9) ; OFFRES.md § 0.2 (règle 6), § 1, § 4.1 ; MARQUE.md § 3.4 et § 5.2 ; PARCOURS.md § 1.6 ; catalogue (L5-08) ; page tarifs (L2-08) ; motifs du rapport de prise en charge (L10-02). Libellés du catalogue de messages (L4-05) : petit diff `[P]`.
5. **Prévenir ceux qui l'ont demandé** : un seul e-mail aux adresses laissées après un refus `plusieurs_niveaux` (table dédiée de `alerte_prise_en_charge_demandee`), puis purge de ces adresses.

## Critères d'acceptation
- [ ] Critère d'ouverture rempli et signé par l'utilisateur pour chaque format ouvert ; les autres restent refusés (test : plan à 3 niveaux refusé avec `niveaux_max = 2`).
- [ ] Refus toujours avant tout appel payant pour un format non ouvert (test de L4-08).
- [ ] Contrôle des textes (L1-04) et contrôle du site (L2-15) sans ancienne formule restante (recherche automatique de « un seul niveau »).
- [ ] E-mail de prévenance envoyé une seule fois, adresses purgées ensuite.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 ; aucune lecture payante pour valider (lectures gardées).

## Mesure
- `plan_analyse` (`motif_refus=plusieurs_niveaux` doit baisser), `plan_lance`, `plan_pret`.
- `email_envoye` avec une valeur de `modele` à ajouter (prévenance) dans SUIVI.md § 3.8 et `mesure/evenements.json`.

## Points d'attention
- **Coordination** : ce ticket se fait avec l'agent des duplex ou après la fusion de son travail ; `niveaux.py` n'est pas touché par la migration (ARCHITECTURE.md § 8.1, règle 4).
- La qualification demande déjà le nombre de niveaux à l'IA (`pipeline/serveur.py:272`) et le recoupe avec l'extraction : vérifier ce recoupement sur les duplex réels.
- Coût : un duplex peut coûter plus cher à lire qu'un plan simple ; mesurer avant d'ouvrir (budget de 3 $ par plan, L5-09).
- Photos : caméra au sol du niveau de la vue, une maquette par niveau (en-tête de `moteur/photos.mjs`) ; nombre d'images d'aperçu à fixer (point 3).

## Références
- CLAUDE.md (consignes de l'utilisateur) ; produit/ARCHITECTURE.md § 1 (principe 7), § 8.1, § 10, M1.9 ; produit/OFFRES.md § 0.2, § 1, § 4.1, § 7.1.
- produit/MARQUE.md § 3.4, § 5.2 ; produit/MESSAGES.md § 7.1, § 7.7, § 8.4, § 12.1 ; produit/PARCOURS.md § 1.6 ; produit/SUIVI.md § 3.6.
- `pipeline/serveur.py:164-176` (pages par niveau), `:218` (`niveaux_refus`), `:272` (qualification) ; `pipeline/niveaux.py` ; `moteur/photos.mjs:80-90` ; `outils/vues.mjs`.

## Hors périmètre
- Réglage `niveaux_max` et refus en service : L4-08. Travail sur les duplex lui-même : agent des duplex. Vue de la résidence : L13-07.
