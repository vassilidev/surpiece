# L5-25 · Administration (2/2) : catalogue, crédits, gestes commerciaux, journal de l'équipe

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-08, L5-17 | `service/` | À faire |

## Pourquoi
Décision de l'utilisateur n° 7 : les offres évoluent au fur et à mesure, sans déploiement, et les droits acquis sont honorés (R5). Pendant la bêta fermée, chaque invité reçoit un crédit `testeur` attribué par l'équipe (`CLAUDE.md`, R13). Un défaut de notre fait est toujours corrigé gratuitement, et un plan peut être rendu à la main quand la chaîne ne l'a pas fait (R14, PARCOURS.md E5). Ces gestes touchent à l'argent et aux droits des clients : ils passent par l'administration, avec motif, clé d'idempotence et trace. Découpé de L5-17, qui garde l'accès, la recherche, les comptes, les plans et leurs coûts, le rejeu sans repayer et le cadre de la file des défauts ; ce ticket réutilise son accès (rôles d'équipe, double authentification, motif, 404 pour tout autre compte).

## À faire
1. **Rendre un plan** (PARCOURS.md E5) : depuis la fiche d'un compte ou d'un plan, libération sur le lot d'origine trouvé automatiquement (`liberer` de L5-07), motif obligatoire, e-mail au client en option ; clé d'idempotence par action : un double clic ne rend rien deux fois.
2. **Geste commercial** : lot de source `geste_commercial` (OFFRES.md § 6.2, qui fait foi, R7), type complet, quantité, validité de 12 mois, motif obligatoire.
3. **Crédits testeurs** : lot `testeur` tiré de la variante « bêta » du catalogue (plan complet ou aperçu selon L0-04, 60 jours, non transférable, OFFRES.md § 2.8, R13), attribuable à une liste d'adresses invitées (L6-10) ; une adresse déjà servie n'en reçoit pas un second.
4. **Ajustement** (±n, `ajustement` de L5-07) : rôle `admin` seulement, motif obligatoire, pour corriger un écart constaté par les invariants.
5. **Catalogue d'offres** (fonctions de L5-08) :
   - créer une version en brouillon, la prévisualiser (libellés rendus, contenu, prix affiché TTC ou HT), la publier à une date d'effet, la retirer ; jamais modifier une version publiée ;
   - contrôle des textes (L1-04) et du vocabulaire de MARQUE.md § 5 au moment de publier ;
   - pendant la bêta fermée, seule la variante « bêta » peut être publiée : aucune version payante, aucun prix Stripe (R13) ; les versions payantes sont publiées à l'ouverture (L8-07), et leurs prix Stripe créés à neuf par L8-01 (R5) ;
   - réglages rattachés à une offre (limites anti-abus du plan offert, L6-06) modifiables ici, chaque changement tracé.
6. **Journal de l'équipe** : écran de consultation de `journal_equipe` (table créée par L5-17), filtres par membre, action, cible et période, lecture seule, rôle `admin` ; aucune route de modification ni d'effacement ; pagination bornée, aucun export en masse (ARCHITECTURE.md § 6.7).
7. Chaque action de ce ticket écrit exactement une ligne `journal_equipe` (`rendre_credit`, `geste_commercial`, `attribuer_testeur`, `ajuster_credit`, `publier_offre`, `retirer_offre`, `modifier_reglage_offre`).

## Critères d'acceptation
- [ ] « Rendre un plan » envoyé deux fois avec la même clé : un seul mouvement de libération, sur le lot d'origine.
- [ ] Geste ou ajustement sans motif : refusé ; ajustement par un rôle `support` : refusé.
- [ ] Attribution de testeurs à une liste de 3 adresses : 3 lots `testeur` de 60 jours et 3 événements `credit_offert_attribue` ; la même liste rejouée ne crée aucun doublon.
- [ ] Nouvelle version publiée depuis l'écran : lue par `GET /api/offres` dans la minute, sans déploiement (critère de L5-08) ; version publiée non modifiable par l'écran ; libellé contenant « crédit » ou « garanti » refusé à la publication.
- [ ] En configuration bêta, la publication d'une version payante est refusée.
- [ ] Chaque action écrit exactement une ligne `journal_equipe` (un test par action) ; le journal n'a aucune route d'écriture hors de ces actions.
- [ ] Compte client sur ces routes : 404 ; aucun appel payant pour tester ; outil local inchangé.

## Mesure
- `credit_rendu` (`motif`, `source_lot`), écrit par L5-07 ; `credit_offert_attribue` (`source_lot` = `testeur`).
- Aucun événement du dictionnaire ne décrit un geste commercial : il reste dans `journal_equipe` ; l'ajouter à SUIVI.md et à `mesure/evenements.json` si un indicateur en a besoin.

## Points d'attention
- Rôles par action, proposition : `support` rend un plan ; `admin` fait les gestes, les ajustements, l'attribution des testeurs, le catalogue et la consultation du journal. À confirmer avec la double authentification (D1, L0-02).
- `geste_commercial` est la valeur d'OFFRES.md § 6.2 (R7) ; ARCHITECTURE.md § 4.2, SUIVI.md § 3.2 et PARCOURS.md E5 l'emploient aussi. L'action `geste` de `journal_equipe` et le motif `geste` d'`achat_rembourse` sont d'autres champs.
- Les fonctions et leurs tests restent dans L5-07 (grand livre) et L5-08 (catalogue) ; ce ticket ne fait que les écrans et leur trace. Aucune écriture directe dans les tables de crédits.
- Droits acquis (R5) : un changement de catalogue ne touche ni les lots déjà attribués ni les publications en ligne ; l'écran le rappelle avant la publication.
- Délai des testeurs : l'ouverture de la bêta (L6-10) peut aussi passer par la commande d'attribution de L5-07 si cet écran n'est pas prêt.

## Références
- Décisions de l'utilisateur du 27/09/2026, n° 7 ; arbitrages R5, R7, R13, R14.
- produit/PARCOURS.md parcours E (E2, E5) ; produit/OFFRES.md § 0.2 (règle 7), § 2.8, § 6.2, § 6.3 ; produit/MARQUE.md § 5.
- produit/ARCHITECTURE.md § 4.2 (`journal_equipe`, `credit_lots`, `offres`), § 6.7, M2.11.

## Hors périmètre
- Accès, recherche, fiche compte, plans et coûts, rejeu sans repayer, cadre de la file des défauts : L5-17.
- Fonctions du grand livre : L5-07. Fonctions et API du catalogue : L5-08. Prix Stripe : L8-01. Remboursement en argent : L8-05.
- Abonnements et bascules de prix : L9-01. Recharges et places : L9-13.
