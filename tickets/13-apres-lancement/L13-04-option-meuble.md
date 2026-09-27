# L13-04 · Option meublé et aménagement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | L (3 à 5 j) | L1-02 | `pipeline/` [P], `moteur/` [M] | À faire |

## Pourquoi
La visite de base montre un logement vide (consigne de l'utilisateur : déco et aménagement plus tard, en option payante). Le meublé est la première option du calendrier (OFFRES.md § 7.2), parce que particuliers et conseillers la demandent. Rien n'existe aujourd'hui : l'état `furniture` est remis à faux à chaque chargement (`moteur/ui.js:430`, `:454`) et `moteur/SCHEMA.md` ne décrit aucun meuble. La règle d'OFFRES.md § 7.1 s'applique : pas de vente avant que les contrôles automatiques couvrent les défauts possibles, que tous les plans de référence passent (D201 en tête), que le coût soit mesuré et que le prix vaille au moins 5 fois ce coût. Zéro défaut visible : aucun objet qui flotte ou traverse un mur.

## À faire
1. **Cadrage R&D** : un seul style au départ ; pièces couvertes (séjour, chambres, coin repas), équipements existants inchangés (cuisine, sanitaires) ; placement **par règles, sans IA** (murs, ouvertures, arcs des portes, allèges des fenêtres, équipements, circulation) ; un appel IA seulement s'il est mesuré nécessaire, et le coût revu (§ 7.2).
2. **Données** : nouvelle clé `furniture` dans `plan.json`, documentée dans `moteur/SCHEMA.md` et ajoutée à la liste blanche de publication (L5-12) ; produite par un nouveau module `pipeline/meubles.py` appelé après le complément, seulement pour un plan qui a l'option. Plan sans option : `plan.json` identique à aujourd'hui.
3. **Modèles 3D** : bibliothèque sous licence compatible avec un usage commercial, provenance et licence consignées ; poids total borné par le budget de chargement de la visite dans le navigateur (L4-10) ; servis par nous (`/vendor/`, L4-06).
4. **Moteur** : rendu des meubles, ombres, collisions en mode visite (on ne traverse pas un canapé), prise en compte par `photos.mjs` ; interrupteur « meublé / vide » dans la visite.
5. **Contrôles automatiques** (OFFRES.md § 7.2), dans la visite de contrôle ou un contrôle dédié :
   - aucun meuble qui flotte (base au sol de son niveau) ;
   - aucun meuble qui traverse un mur, une cloison ou un autre meuble ;
   - portes (arc de débattement) et fenêtres dégagées ;
   - circulation libre entre les arrêts (`outils/trajets.mjs`) ;
   - équipements et meubles bien orientés (dos au mur, face vers la pièce).
   Un défaut → l'option est refusée pour ce plan, jamais publiée avec un défaut.
6. **Validation plan par plan** : les 4 plans de référence rejoués sans IA (L1-02), captures relues par l'utilisateur ; coût variable mesuré (placement, poids, temps de rendu en SwiftShader).
7. **Mise en vente, seulement après validation** : hypothèses +20 € TTC (visite meublée à 49 €), +3 € HT par plan en Solo et Cabinet, inclus en Équipe, +5 € HT par lot pour les promoteurs, +2 € HT en marque blanche ; ajout à un plan déjà débloqué sans nouvelle lecture ; offre au catalogue (L5-08) ; textes « logement présenté vide » adaptés selon l'offre.

## Critères d'acceptation
- [ ] Chaque contrôle échoue sur un cas fabriqué exprès (chaise à 10 cm du sol, canapé à travers une cloison, porte bloquée, lit tourné vers le mur) et passe sur un placement correct.
- [ ] Les 4 plans de référence passent sans défaut ; sans l'option, rejeu identique à la ligne de base (L1-02).
- [ ] Coût variable et poids mesurés et consignés ; aucune vente ni annonce avant les conditions d'OFFRES.md § 7.1 (« pas de prévente, pas de date, jamais bientôt »).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 pour chaque diff de `pipeline/` et `moteur/` ; aucune lecture payante pour tester.

## Points d'attention
- **Taille** : L pour une R&D et une mise en vente, c'est trop. Découper : (a) placement et contrôles sur les plans de référence, (b) moteur et rendu, (c) mise en vente.
- **Coordination avec le travail sur les duplex** : nouveaux fichiers plutôt que modifications ; petits diffs isolés ; aucune généralisation aux plans à plusieurs niveaux tant qu'ils ne sont pas validés (L13-08).
- **Juridique** : licences des modèles 3D ; une visite meublée reste une illustration non contractuelle (MARQUE.md § 3.4, MESSAGES.md § 8.3).
- Le rendu SwiftShader s'alourdit avec le mobilier : à mesurer avec L13-01.
- Intérêt à sonder pendant les entretiens, sans vendre ni dater (OFFRES.md § 9.2, T12).

## Références
- produit/OFFRES.md § 0.2 (règle 5), § 7.1, § 7.2, § 9.2 (T12) ; produit/MARQUE.md § 3.4 ; produit/ARCHITECTURE.md § 8.1, § 10.
- `moteur/ui.js:430`, `:454` (`furniture`) ; `moteur/SCHEMA.md` ; `outils/trajets.mjs` ; `moteur/controle.mjs:99` (arrêt net dans une baie).

## Hors périmètre
- Lumière réelle, réalisme et 4K : L13-05. Variante TMA : L13-06. Galerie complète : L13-02.
