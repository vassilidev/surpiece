# L8-06 · Tests de prix

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P2 | S (jusqu'à 1 j) | L7-05, L7-06, L8-01 | `service/` | À faire |

## Pourquoi
Tous les prix d'`OFFRES.md` sont des hypothèses de lancement (visite à 29 €, plan suivant à 15 €, trois lots à 59 €). La règle de décision est la **marge par aperçu** (`OFFRES.md` § 9.1). Un prix qui varie selon le visiteur devrait être annoncé comme personnalisé (L221-5) : on teste donc par **périodes successives**, avec le même prix pour tous pendant une période, jamais par un prix tiré au sort par personne (R8). Le catalogue modifiable sans déploiement (décision 7, L5-08) permet de changer de période sans code.

## À faire
1. **Protocole écrit** dans `produit/tests-prix.md` (nouveau, emplacement proposé) :
   - hypothèses et plages d'`OFFRES.md` § 9.1 : visite à 29 € puis 39 €, 19 € si la conversion est très faible ; plan suivant à 15 € ou 19 € ; trois lots à 49 € ou 59 €, retiré de la page sous 10 % des ventes ;
   - une période = 3 semaines ou environ 150 aperçus ; ordre A, B, A ; un seul test à la fois par étape de l'entonnoir (`PARCOURS.md` § 7.1) ;
   - garde-fous suivis à chaque période : défauts signalés, remboursements, litiges, part d'échecs, demandes au support.
2. **Lancer une période** = publier une version d'offre avec son `periode_prix` (`p1`, `p2`…) et sa date d'effet (L5-08) ; annotation dans Umami (`SUIVI.md` § 4.7) ; reconstruction de la vitrine par l'assemblage `outils/site.py` (R19 : page tarifs, L2-08, et son contrôle d'écart avec `catalogue.json`).
3. **Vue SQL `v_tests_prix`**, sur le journal (branchée aux tableaux de bord de L7-06), par `periode_prix` : aperçus livrés, déblocages et achats à 30 jours, part des trois lots et des plans suivants, chiffre d'affaires HT, marge (conventions de `SUIVI.md` § 5.5), coût des aperçus, et **marge par aperçu = (ventes × marge − coût des aperçus) ÷ aperçus**. Elle lit `offre_choisie`, `paiement_ouvert`, `achat_paye`, `plan_lance` et `apercu_vu`, qui portent déjà `periode_prix`.
4. **Décision écrite** à la fin de chaque période, dans `produit/tests-prix.md` : dates, chiffres, garde-fous, décision, décideur (l'utilisateur) ; report dans `OFFRES.md` § 9 et dans le catalogue.
5. **Règles de présentation** : prix ronds ; jamais de prix barré ni de « au lieu de » (L112-1-1) ; la page de commande affiche toujours le prix qui sera payé (`PARCOURS.md` A10, contrôle de L8-01) ; aucune différence remboursée d'une période à l'autre, écrit dans les CGV si l'avocat l'accepte (L8-04).

## Critères d'acceptation
- [ ] Changement de période sans déploiement : `GET /api/offres`, page de commande et vitrine montrent le nouveau prix dans la journée.
- [ ] Bascule de période pendant un paiement : jamais d'écart entre le prix affiché et le prix payé (test sur le mode test Stripe).
- [ ] Deux comptes différents voient le même prix à la même date (test : aucun tirage par compte ni par visiteur sur un prix).
- [ ] `v_tests_prix` vérifiée sur un jeu simulé de trois périodes, avec un calcul fait à la main.
- [ ] Première décision consignée dans `produit/tests-prix.md`.

## Points d'attention
- **Tranché : R8.** Les prix se testent **uniquement par périodes**, avant comme après la création du compte, jamais par un prix différent tiré au sort par personne (`OFFRES.md` § 9.1, L221-5). Seuls les tests de **textes** (leviers sans prix de `PARCOURS.md` § 7.2) peuvent être tirés côté serveur pour les comptes connectés : ils relèvent de L12-05.
- **Dépendance** : la vue repose sur les tableaux de bord de L7-06, désormais déclaré.
- **Volumes** : il faut environ 690 personnes par variante pour voir un passage de 10 % à 15 % (`PARCOURS.md` § 7.1) ; au lancement, décider sur le sens de l'effet et les garde-fous.
- **Seuil de perte** : il change avec le prix (11,1 % à 29 €, 8,2 % à 39 €, `OFFRES.md` § 8.8) ; L8-09 lit le prix en vigueur.
- **Pros** : les tests du prix Solo (49 puis 69 €) et de la carte à l'essai suivent L9-01 et L9-02, hors de ce ticket ; le prix Solo se teste lui aussi par périodes (R8).

## Références
- produit/OFFRES.md § 8.8, § 9.1, § 9.2 (T3, T4) ; produit/PARCOURS.md § 7.1, § 7.2 (L8, L9) ; produit/SUIVI.md § 3.2 (`periode_prix`), § 4.7, § 4.8, § 5.4, § 5.5.
- produit/recherche/juridique.md § 1.4 (prix personnalisé) ; tickets L5-08 (versions d'offre), L2-08 (page tarifs).

## Hors périmètre
- Tests A/B des leviers sans prix : L12-05. Décision des prix de lancement : L0-04.
- Catalogue et droits acquis : L5-08. Tableaux de bord : L7-06.
