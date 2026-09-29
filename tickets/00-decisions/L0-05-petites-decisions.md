# L0-05 · Trancher les questions produit ouvertes

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P1 | S (jusqu'à 1 j) | L0-04 | — | À faire |

## Pourquoi
Les documents de `produit/` laissent une douzaine de petites questions à l'utilisateur. Chacune bloque un texte ou un écran des lots 2, 6 et 7. Une seule séance, après la validation des offres (L0-04), évite de les trancher un par un au fil des tickets.

## À faire
1. **Préparer la liste consolidée** ci-dessous (source, options, recommandation des documents) et la soumettre à l'utilisateur en une séance.

   | # | Question | Source | Recommandation des documents | Où reporter |
   |---|---|---|---|---|
   | 1 | Vouvoiement partout | MARQUE.md § 4.2 | oui, partout | MARQUE.md § 13 (2) |
   | 2 | Favicon « la pièce » | MARQUE.md § 7.3, § 7.5 | oui, sous réserve du test à 16 px | MARQUE.md § 13 (4) ; L2-02 |
   | 3 | Mot « duplex » dans la FAQ de l'accueil | MESSAGES.md § 1.9, § 12.1 ; MARQUE.md § 3.4 | **tranchée le 27/09/2026** par la décision 11 (« oui le duplex on l'a géré c'est bon, c'était avant ça ») : la FAQ répond oui pour le duplex (un ou deux niveaux) ; le triplex reste sans promesse ; déjà reportée dans MESSAGES.md § 12.2 (4) et MARQUE.md § 3.4 | MESSAGES.md § 12.2 (4) |
   | 4 | Carte « rendez-vous bancaire » | MESSAGES.md § 1.7, § 12.1 ; OFFRES.md annexe B (question 6) | publier seulement après l'avis de l'avocat, sinon la retirer | MESSAGES.md § 12.2 (5) |
   | 5 | Bloc « bêta fondateurs » et durée de l'entretien mensuel | MESSAGES.md § 2.9 ; OFFRES.md § 3.10 | principe tranché par R21 (avant les lots 9 à 11, les pages pros proposent un entretien ou la bêta fondateurs, L2-18) ; contenu du bloc et durée de l'entretien à trancher | MESSAGES.md § 12.2 (6) |
   | 6 | Durée de validité du lien de connexion | MESSAGES.md § 7.3 ; ARCHITECTURE.md § 6.3 | 15 min, usage unique, avec code à 6 chiffres | MESSAGES.md § 12.2 (7) |
   | 7 | Délai du rappel avant suppression d'un aperçu | MESSAGES.md E11 ; OFFRES.md § 2.2 (aperçu gardé 6 mois) | à trancher ; la question de la case de consentement va à l'avocat (PARCOURS.md § 8.3, question 8) | MESSAGES.md § 12.2 (7) |
   | 8 | Place de « Où en êtes-vous ? » | PARCOURS.md § 8.2, § 8.3 (1) ; SUIVI.md § 8 (3) | sur l'écran d'attente plutôt qu'à l'inscription | PARCOURS.md § 8.3 ; OFFRES.md § 2.1 |
   | 9 | Lien de l'e-mail « prêt » (E3) | PARCOURS.md § 8.3 (2) | lien d'aperçu direct, ou connexion d'abord | PARCOURS.md § 8.3 ; MESSAGES.md E3 |
   | 10 | Remboursement : bouton en un clic ou réponse à l'e-mail | PARCOURS.md § A15, § 8.2, § 8.3 (3) ; MESSAGES.md E6 | bouton en un clic (proposition de PARCOURS.md) | PARCOURS.md § 8.3 ; MESSAGES.md E6 |
   | 11 | Bandeau de consentement | SUIVI.md § 7.2, § 8 (1) | tranché par R18, à confirmer ici : aucun bandeau tant qu'Umami reste en réglage minimal exempté ; bandeau dès qu'un traceur non exempté est activé (UTM enrichis, relecture de session, publicité) | SUIVI.md § 8 |
   | 12 | Umami sur les écrans de l'application, de façon anonyme | SUIVI.md § 2.6, § 8 (2) | oui (écart assumé avec `recherche/suivi.md` § 7.1) ; jamais sur les liens partagés ni les intégrations | SUIVI.md § 8 |
   | 13 | « Comment nous avez-vous connu ? » sur l'écran d'attente | SUIVI.md § 2.10, § 8 (3) | oui | SUIVI.md § 8 |

2. **Pour chaque question** : noter la réponse, la date et, si l'utilisateur ne suit pas la recommandation, la raison.
3. **Reporter chaque décision** dans le document indiqué (colonne « Où reporter »), en remplaçant la question par « Décidé le JJ/MM/AAAA : … », et signaler les textes à changer aux tickets concernés (lots 2, 6, 7).
4. Les questions qui demandent un avis juridique (4, 7) partent dans le dossier de L0-07 ; la décision finale attend la réponse.

## Critères d'acceptation
- [ ] Les 13 questions ont une réponse datée.
- [ ] Chaque réponse est reportée dans le document source ; plus aucune de ces questions ne figure dans MARQUE.md § 13, MESSAGES.md § 12.2, PARCOURS.md § 8.3 et SUIVI.md § 8 sans sa réponse.
- [ ] Les questions en attente de l'avocat sont inscrites au dossier de L0-07.

## Points d'attention
- **Questions repérées en plus**, absentes du résumé du ticket, à proposer dans la même séance : outil des tableaux de bord, Metabase ou vues SQL (SUIVI.md § 8, point 4) ; respect de GPC en plus de DNT (SUIVI.md § 8, point 5) ; titre retenu de chaque page et ordre des tests de variantes (MESSAGES.md § 12.2, point 3), sachant que seuls les textes se testent par tirage, côté serveur pour les comptes connectés, et les prix uniquement par périodes (R8).
- Le mot « duplex » (question 3) : tranché par l'utilisateur le 27/09/2026. La chaîne gère les plans sur plusieurs niveaux (décision 11), validée sur une duplex (L13-08, fait) ; les duplex sont acceptés en service (`niveaux_max = 2`, L4-08). La lecture réelle par l'IA (L1-13) reste une vérification utile, pas un préalable. Le triplex n'est promis qu'après validation sur un plan réel (OFFRES.md § 7.1).
- Les questions 11 et 12 touchent la conformité (exemption CNIL d'Umami) : l'analyse d'exemption est faite par L7-08 ; la règle du bandeau (R18) en dépend.

## Références
- `produit/MARQUE.md` § 3.4, § 4.2, § 7.3, § 13
- `produit/MESSAGES.md` § 1.7, § 1.9, § 2.9, § 7.3, § 7.11 (E3, E6, E11), § 12.1, § 12.2
- `produit/PARCOURS.md` § A15, § 8.2, § 8.3
- `produit/SUIVI.md` § 2.6, § 2.10, § 7.2, § 8
- `produit/OFFRES.md` § 2.1, § 2.2, § 3.10, annexe B

## Hors périmètre
- Validation des prix et du contenu des offres : L0-04.
- Avis juridiques : L0-07.
- Mise en œuvre des textes et écrans : tickets des lots 2, 6 et 7.
