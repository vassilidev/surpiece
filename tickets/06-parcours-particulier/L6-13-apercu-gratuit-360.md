# L6-13 · Aperçu gratuit en 360° (si l'utilisateur le confirme)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P1 | M (1 à 3 j) | L1-16, L5-08, L5-27, L6-05, L6-08 | `service/` | À faire |

## Pourquoi
Décision de principe de l'utilisateur du 27/09/2026 (n° 15) : le 360° devient probablement l'offre gratuite ; la visite 3D complète reste payante. Il remplace ou enrichit l'aperçu de R1 (vue du dessus, plan 2D, 2 photos). C'est à confirmer avec le coût de rendu serveur mesuré (L1-16). Ce ticket ne s'ouvre qu'après la décision écrite de l'utilisateur. La décision n° 6 tient : images serveur seulement, ni moteur ni `plan.json` envoyés au navigateur.

## À faire
1. **Page d'aperçu** (L6-05) : visionneuse 360° de L4-16, selon la décision (à la place de la vue du dessus et des 2 photos, ou en plus) ; surfaces et points à faire confirmer inchangés ; verrou côté serveur vers la visite complète (R4) : il porte sur la marche libre, la maquette et le plan 2D interactifs (`verrou.piece.360`).
2. **Page du destinataire d'un partage d'aperçu** (L6-08) : même visionneuse, même contrôle.
3. **Catalogue** : nouvelle version de l'offre gratuite avec son contenu réel (`visite_360`, L5-08, R5) ; droits acquis honorés.
4. **Textes et documents** : R1 révisé (PLAN.md § 2.4), OFFRES.md § 0.1, § 2.2 et § 8.8 (coût d'un aperçu et seuil de perte recalculés), MESSAGES.md (`offre.apercu.*`, `apercu.360.*`, `verrou.piece.360`) ; démasqués seulement à la mise en service.
5. **Budget du plan offert** (L8-09) : temps de rendu des panoramas compris dans le coût et la capacité.
6. **Contrôle de L6-05** étendu : aucune requête vers `engine.js`, `/moteur/`, `plan.json`, une bibliothèque 3D ni un fichier précalculé de la visite ; aucune image cassée ni noire ; aucun texte technique.
7. **Mesure** : `apercu_arret_vu` (proposé dans SUIVI.md § 3.9) ajouté au dictionnaire et à `mesure/evenements.json`, seulement si ce ticket est mis en service.

## Critères d'acceptation
- [ ] Page d'aperçu en 360° sur le témoin : `window.App` et `window.__v` indéfinis, aucune requête interdite (interception puppeteer) ; test négatif : une page qui charge `plan.json` ou la maquette échoue.
- [ ] Tous les arrêts atteignables ; parcours au clavier ; capture à 320 px conforme ; seuils de fluidité de L1-14 tenus sur les appareils modestes de référence.
- [ ] Coût d'un aperçu recalculé et consigné ; seuil de perte d'OFFRES.md § 8.8 mis à jour.
- [ ] Aucun texte technique (L1-04) ; aucune lecture payante ; mention non contractuelle permanente.

## Points d'attention
- **Condition** : aucune ligne de code avant la décision écrite de l'utilisateur (L1-16). Tant qu'elle n'est pas prise, l'aperçu reste celui de R1 et aucun texte ne promet le 360°.
- **État au 28/09/2026** : les panoramas et la visionneuse sans moteur existent dans l'outil local (L4-15, L4-16, en cours) et passent leurs contrôles sur 4 références (D201 bloqué par son placard, correction à publier) ; la décision de l'utilisateur n'est pas prise. Coût à lui présenter (L1-16) : 34 à 104 s par plan sur Mac en Metal (indicatif) ; sans carte graphique, environ 3,5 min par panorama en 4096, soit 20 à 40 min par plan, estimé avant l'occlusion ambiante (à mesurer). La visionneuse est autonome dans son dossier `pano/` ; son emplacement en ligne reste à décider (L4-16) avant de servir une page gratuite.
- Les panoramas montrent gratuitement ce que la visite montrerait depuis ces points : risque accepté par la décision de principe ; la marche libre, la maquette et le plan 2D interactifs restent réservés.
- Pendant la bêta fermée (R13), aucun message ne propose 29 € : le verrou mène à l'attente de l'ouverture.
- 360° dans l'aperçu dès la bêta fermée ou après : à décider (L6-10).

## Références
- PLAN.md § 2.1 (décisions 6, 15) ; R1, R4, R5, R13 ; OFFRES.md § 2.2, § 8.8 ; PARCOURS.md A9, A10 ; SUIVI.md § 3.9, § 5.5.
- L1-16, L4-16, L5-08, L5-27, L6-05, L6-08, L8-09.

## Hors périmètre
- Rendu des panoramas et visionneuse : L4-15, L4-16, L5-27. Mesure et décision : L1-16. Vue du dessus manipulable : L13-03.
