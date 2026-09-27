# L13-07 · Vue de la résidence

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | L (3 à 5 j) | L10-02 | `moteur/` [M] | À faire |

## Pourquoi
Un promoteur pourrait vouloir naviguer dans tout un programme : étages, façades, choix du lot (OFFRES.md § 4 ; § 7.2, option 5 : « lots stables, promoteur pilote », sur devis). OFFRES.md § 4.8 le range « plus tard, avec un promoteur pilote, sans date ni promesse » ; MESSAGES.md § 3.10 répond aujourd'hui « Pas aujourd'hui ». Les plans de vente d'un lot ne suffisent pas : il faut des plans d'étage (plusieurs logements par page, refusés aujourd'hui en `plusieurs_lots` : **Tranché : R17**, la qualification les refuse, L6-02 ; l'import promoteur, L10-02, découpe un PDF page par page mais signale lui aussi une page à plusieurs logements), des façades ou un plan masse. C'est un ticket de R&D, borné à un prototype.

## À faire
1. **Données d'entrée**, à obtenir d'un promoteur pilote avec son accord écrit (L10-01) : plans d'étage courant, niveaux, façades ou plan masse ; inventaire de ce qui est lisible sans IA (PDF vectoriels).
2. **Prototype sur un immeuble fictif créé par nous** (même principe que le témoin, L1-03) : un plan d'étage fictif à plusieurs lots, dessiné exprès, versionné sans aucune donnée de promoteur, dans `references/` comme le témoin (R11 : `references/temoin/` ; emplacement exact proposé : `references/immeuble-temoin/`).
3. **Assemblage** : placer chaque lot déjà produit (L10-02) sur son étage d'après le plan d'étage ; empiler les étages ; enveloppe extérieure simple. Le moteur a déjà un contexte d'immeuble générique (masses, palier, étages voisins, `moteur/engine.js:823`) : partir de là.
4. **Navigation** : vue d'ensemble, choix d'un étage, choix d'un lot qui ouvre sa visite ; aucune donnée de visite d'un lot non publié.
5. **Contrôles** à définir avec le prototype : lots sans chevauchement, étages alignés, rien qui flotte, zéro défaut visible.
6. **Livrable** : note de R&D (faisabilité, données nécessaires, charge d'un vrai développement, coût) et démonstration sur l'immeuble fictif ; décision de l'utilisateur.

## Critères d'acceptation
- [ ] Prototype jouable sur l'immeuble fictif, sans aucune donnée de promoteur dans le dépôt.
- [ ] Note de R&D remise, avec la liste des données à demander au promoteur et une estimation chiffrée.
- [ ] Aucune promesse ni date dans les textes publics (MESSAGES.md § 3.10 inchangé) ; aucune lecture payante.

## Points d'attention
- **Taille** : L couvre un prototype ; un produit livrable serait bien plus gros et fera d'autres tickets.
- Consigne « plan par plan, sans généraliser » : aucun format de plan d'étage n'est pris en charge avant validation sur des plans réels.
- Coordination `moteur/` : nouveau module plutôt que modification d'`engine.js`, petits diffs isolés (ARCHITECTURE.md § 8.1).
- Les plans d'étage portent souvent les noms des acquéreurs ou des réservations : masquage et droits à traiter avant tout usage (L1-10, juridique.md § 3.2).

## Références
- produit/OFFRES.md § 4.8, § 7.1, § 7.2 (option 5) ; produit/MESSAGES.md § 3.10 ; produit/recherche/marche.md § 5.2 (point 3).
- produit/PARCOURS.md C2 (motif « plusieurs logements sur la page ») ; `moteur/engine.js:823` (contexte d'immeuble) ; `moteur/SCHEMA.md` (`context`).

## Hors périmètre
- Import des lots : L10-02. Plans sur plusieurs niveaux : L13-08. Offre promoteur : L10-01.
