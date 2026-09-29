# L8-07 · Ouverture publique : plan offert et vente aux particuliers

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | S (jusqu'à 1 j) | L0-01, L0-04, L2-16, L6-10, L7-06, L8-01, L8-02, L8-03, L8-04, L8-05, L8-08, L8-09 | `site/`, `service/` | À faire |

## Pourquoi
Jalon J1 (`OFFRES.md` § 7.3 ; `ARCHITECTURE.md` § 8.4), absent jusqu'ici du dossier : le plan offert et la vente à 29 €, 15 € et 59 € s'ouvrent à tous. **Tranché : R13.** Jusqu'ici (bêta fermée, lot 6), rien n'est vendu : dépôt réservé aux invités avec un code d'invitation, seule la variante « bêta » du catalogue publiée, aucun message qui propose 29 € (`OFFRES.md` § 2.8, `MESSAGES.md` § 0.8). C'est ce ticket qui ouvre à tous. Les obligations envers les particuliers exposent à des amendes (jusqu'à 15 000 € sans médiateur, `OFFRES.md` § 10, risque 9) ; les tests T0 à T2 doivent dire si l'économie tient avant d'ouvrir le gratuit au public (`OFFRES.md` § 9.2). Ce ticket est la liste de passage, la bascule et la première semaine.

## À faire
1. **Liste de passage** dans `produit/ouvertures/J1.md` (nouveau, emplacement proposé), chaque ligne avec sa preuve :
   - **juridique** : CGV, politique de remboursement et médiateur en ligne (L8-04) ; « Renoncer au contrat ici » actif (L8-03) ; RC professionnelle (L0-06) ; marque **déposée** à l'INPI sous le nom retenu (L0-01) ; CGU passées de la version bêta à la version publique (L2-11) ; marqueurs **[À VALIDER : avocat]** de J1 levés (`recherche/juridique.md` § 7, n° 8 à 10) ;
   - **économie** : T0 à T2 consignés ; temps de rendu serveur des panoramas et du précalcul mesuré en production et provisionné s'ils sont livrés (L1-16, L5-22) ; coût moyen **sous 2 $ par plan** (qualification et appels interrompus compris) et **moins de 20 % d'échecs après lecture**. Sinon : ne pas ouvrir le plan offert au public, revoir la qualification (L6-02) et les prix (L0-04), et n'ouvrir que la vente ;
   - **budgets** : plafond du plan offert indexé et coupe-circuit actifs (L8-09) ; clés `prod-gratuit` et `prod-payant` plafonnées, recharge automatique coupée (L0-08, L5-09) ;
   - **paiement** : Stripe en mode réel sur le compte de la société ; un paiement réel de 29 € fait par l'équipe, visite ouverte, puis remboursé ; libellé du relevé vérifié ;
   - **promesses** : délai affiché = mesure T0 (L5-11) : le marqueur ‹délai› n'est remplacé que par cette mesure, jamais par « un quart d'heure » ni « 8 à 15 min » (R12) ; prix affichés = catalogue validé (L0-04) ; contenu promis = contenu livré (R1 : visite dans le navigateur et les mêmes images que l'aperçu, pas de galerie complète ; 360° seulement s'il est livré) ; visite fluide sur les appareils modestes de référence (seuils de L1-14) ; périmètre affiché = formats acceptés en service (un ou deux niveaux, `niveaux_max = 2`, L4-08) ; téléchargements (L8-08) et factures (L8-05) livrés.
2. **Bascule**, sans déploiement quand c'est possible :
   - catalogue : versions payantes publiées (prix Stripe créés à neuf, L8-01), variante « bêta » retirée, `vente_particuliers_ouverte = true`, plan offert ouvert à tous sans code d'invitation ; les crédits `testeur` restants gardent leurs conditions (droits acquis, `OFFRES.md` § 2.8) ;
   - vitrine : passage du mode [Liste d'attente] au mode Ouvert (`MESSAGES.md` § 0.8) : bouton « Importer mon plan » en dépôt réel pour tous (`site.json`, L2-04, L6-01), sections Prix, lien « Tarifs » et `/tarifs` publiés, assemblage relancé (`outils/site.py`, R19) ; pied de page complet (L2-11, L8-04) ;
   - référencement (**Tranché : R20**) : la vitrine est indexable depuis sa mise en ligne, il n'y a pas de `noindex` à lever ici ; `/tarifs` entre dans `sitemap.xml` ; `app.`, `visite.`, `cdn.` et la préproduction restent en `noindex` ;
   - liste d'attente : un e-mail d'ouverture aux inscrits (ils ont demandé à être prévenus, L2-12), sans relance ensuite sans consentement.
3. **Retour arrière écrit** : couper la vente (drapeau du catalogue), couper le plan offert (interrupteur de L5-09), mode maintenance (L5-21) ; qui décide, en combien de minutes.
4. **Première semaine** : point quotidien de 15 min sur le coût par plan, les échecs par cause, les défauts signalés et leur délai, les remboursements, les litiges, les demandes au support, le budget offert consommé, la conversion des aperçus ; décisions notées dans le même fichier.

## Critères d'acceptation
- [ ] Liste de passage complète, avec preuves, validée par l'utilisateur.
- [ ] Contrôle automatique du site construit : aucune occurrence de `[À VALIDER`, `[SI LIVRÉ`, `[Prix : hypothèse]`, `‹délai›`, « bientôt », « un quart d'heure », « 8 à 15 min », « environ 11 photos » ni « 8 autres photos » ; CGV, médiateur et « Renoncer au contrat ici » présents sur chaque gabarit (contrôle de L8-04).
- [ ] Avant la bascule, en préproduction avec le catalogue de la bêta : aucune page ni aucun e-mail ne propose 29 €, 15 € ou 59 € (R13) ; après la bascule, le prix affiché est celui de la version en vigueur.
- [ ] Test HTTP : vitrine indexable ; `app.`, `visite.` et préproduction renvoient `noindex`.
- [ ] Parcours réel en production sur le plan du témoin (lecture et paiement réels, sur accord explicite de l'utilisateur) : dépôt, aperçu, paiement réel, visite ouverte, remboursement.
- [ ] Retour arrière répété une fois en préproduction : vente et plan offert coupés en moins de 5 min.
- [ ] Zéro défaut visible et aucun texte technique sur le parcours de recette.

## Points d'attention
- **Tranché** : L8-05 (facture promise par E7, reçus promis par `PARCOURS.md` A17), L8-08 (téléchargements listés dans `achat.compris`) et L7-06 (mesure de la conversion dont L8-09 a besoin, avec les entonnoirs de L7-05) sont des dépendances déclarées. Le contenu vendu ne liste que ce qui est livré (R1).
- **Tranché : R20.** La vitrine et les guides (L2-13, L2-17) sont indexables dès la mise en ligne de la vitrine, une fois le nom déposé ; ils n'attendent pas ce ticket.
- **Nom** : si L0-01 retient Avant-Clés, le rechercher-remplacer (produit, site, CGV, libellé bancaire) doit être fait avant la bascule. Seul le dépôt compte (date), pas l'enregistrement de la marque.
- Aucun témoignage ni chiffre d'usage avant d'en avoir de réels et autorisés (L6-12, `MESSAGES.md` § 10).
- AIPD courte au plus tard 3 mois après l'ouverture (L0-09).
- La décision T2 revient à l'utilisateur ; les seuils (2 $, 20 %) sont ceux d'`OFFRES.md` § 8.11.

## Références
- produit/OFFRES.md § 7.3 (J1), § 8.11, § 9.2 (T0 à T2), § 10 ; produit/ARCHITECTURE.md § 8.4, § 9.1.
- produit/recherche/juridique.md § 7 (n° 8 à 10, 16) ; produit/MESSAGES.md § 0.2, § 0.3, § 8.2, § 10.
- tickets L2-04, L2-11, L2-13, L2-16, L5-09, L5-11, L5-21, L6-10.

## Hors périmètre
- Bêta fermée (J0) : L6-10. Publicité et conversions : lot 12. Conseillers (J2) : lot 9.
- Budget indexé et coupe-circuit : L8-09. Tests de prix : L8-06.
