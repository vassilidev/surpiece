# L5-08 · Catalogue d'offres modifiable sans déploiement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-07 | `service/` | À faire |

## Pourquoi
Décision du 27/09/2026 : les offres évolueront au fur et à mesure. Tous les prix d'OFFRES.md sont des hypothèses, testées par périodes successives (OFFRES § 9.1). Il faut donc pouvoir changer un prix, un contenu ou une durée sans déployer, tout en honorant les droits acquis : crédits vendus, visites en ligne, abonnés prévenus à l'avance. La vitrine et l'application doivent lire le même catalogue, pour que le prix affiché soit toujours le prix payé.

## À faire
1. Tables (migration) :
   - `offres` : `code` stable (`particulier_visite`, `particulier_plan_suivant`, `particulier_pack_3`, `offert_inscription`, `testeur`, variante `beta` (R13), `pro_solo`, `pro_cabinet`, `pro_equipe`, `pro_essai`, `pro_recharge`…), `cible` (`particulier`, `conseiller`, `promoteur`, `partenaire`) ;
   - `offres_versions`, **immuables une fois publiées** : `offre_code`, `version`, `statut` (`brouillon`, `publiee`, `retiree`), `valide_du`, `valide_au`, `prix_centimes` et `prix_affiche` (`ttc` pour les particuliers, `ht` pour les pros), `taux_tva`, `credits` (liste `{type_plan, quantite}`), `validite_credits_jours`, `essai_jours`, `contenu` (liste fermée : `visite`, `maquette_interactive`, `plan_interactif`, `photos` avec un nombre, `visite_360` (panoramas à chaque arrêt ; offre gratuite ou payante : à décider, L0-04, L1-16), `telechargements`, `partage`, `hebergement_mois`), `conditions` (par exemple « dans les 12 mois d'un premier achat »), `periode_prix`, `stripe_price_id` (nullable), `libelles` (clés de MESSAGES.md), `cree_par`, `cree_le`.
2. Règles, vérifiées en base et par des tests :
   - une version publiée n'est jamais modifiée (déclencheur qui refuse tout `UPDATE` hors passage à `retiree`) ; changer un prix, c'est publier une nouvelle version ;
   - une seule version publiée et en vigueur par code à une date donnée ;
   - prix ronds (pas de `,99`, pas de prix barré, OFFRES § 1) ; TTC pour les particuliers, HT pour les pros ;
   - textes passés au contrôle des textes (L1-04) et au vocabulaire de MARQUE.md § 5 : jamais « crédit », « garanti », « au centimètre » côté client.
3. Droits acquis :
   - chaque lot de crédits garde `offre_version_id` (L5-07) : contenu et validité restent ceux de la version achetée ;
   - chaque publication garde sa durée d'hébergement calculée à l'achat (colonne à ajouter par L5-12) ;
   - un abonné garde son prix jusqu'à la fin d'un préavis ; la bascule est planifiée (date et nouvelle version) et prévenue par e-mail. La mécanique Stripe est faite par L9-01.
4. `service/offres/catalogue.py` : `version_en_vigueur(code, date)`, `offres_publiques(cible)` ; lecture en cache court (1 min) invalidé à chaque publication.
5. `GET /api/offres` (public, sans cookie) : champs publics seulement (code, prix affiché, contenu, conditions, `periode_prix`), avec `ETag`. Pour la vitrine statique, recommandation : à chaque publication d'une version, l'application écrit `catalogue.json` dans l'espace de la vitrine ; la page tarifs (L2-08) garde les prix dans son HTML, lus au moment de sa construction, et un contrôle quotidien signale tout écart entre ce HTML et `catalogue.json` (reconstruction de la vitrine).
6. Stripe : les prix ne se modifient pas chez Stripe, on en crée de nouveaux. `stripe_price_id` est rempli à la publication d'une version payante par L8-01 ; une version payante sans prix Stripe ne peut pas être vendue.
7. Amorçage : `python -m service.offres.amorcer` charge les offres décidées par L0-04 (point de départ : OFFRES § 0.1, § 6.2) en versions `publiee`, dans une migration de données rejouable. Pendant la bêta fermée, seule la variante « bêta » est publiée (plan complet ou aperçu selon L0-04) : aucune version payante, aucun prix Stripe (OFFRES § 2.8, R13). Les versions payantes sont publiées à l'ouverture (L8-07).
8. Les montants dans les événements (`periode_prix`, `offre`) et les travaux (`type_plan`) viennent de la version en vigueur, jamais d'une constante du code. De même, les valeurs d'offre d'une organisation (quota, places, plafond IA, travaux simultanés) sont lues dans la version souscrite (`organisations.offre_version_id`), jamais dans un code figé du type `pro-5` (R5).

## Critères d'acceptation
- [ ] Test : `UPDATE` d'une version publiée refusé par la base.
- [ ] Test : publier une nouvelle version de `particulier_visite` change `GET /api/offres` dans la minute, sans redémarrage ni déploiement.
- [ ] Test des droits acquis : un lot acheté en version 1 garde son contenu et sa validité après la publication d'une version 2 ; un abonné garde son prix jusqu'à la date de bascule.
- [ ] Test : un libellé contenant « crédit », « garanti » ou un motif technique est refusé à la publication.
- [ ] Aucune lecture payante pour tester ; l'outil local marche toujours.

## Points d'attention
- Tranché : R5. OFFRES § 0.2 (règle 7) porte le catalogue modifiable sans déploiement, les droits acquis, les valeurs d'offre des organisations lues dans le catalogue et les prix Stripe créés à neuf.
- Juridique : le prix affiché doit être le prix facturé ; les tests de prix se font par périodes, jamais par visiteur (L221-5, OFFRES § 9.1, R8). Durée du préavis des abonnés et clause de révision à faire valider par l'avocat (L0-07, OFFRES § 10 risque 4).
- Tranché : R19. La vitrine est assemblée par `outils/site.py` (Python sans dépendance), qui injecte les prix lus dans `catalogue.json` ; le contrôle quotidien de l'étape 5 signale tout écart et fait relancer l'assemblage. Afficher les prix par un script seul nuirait au référencement et à la lecture sans JavaScript.
- Quotas pros (5, 12, 30 plans), places et plafonds IA par offre (L5-09) se lisent aussi ici dès que leurs tickets les branchent.

## Références
- produit/OFFRES.md § 0.1, § 0.2, § 1 (prix, unité affichée), § 6.2, § 9.1, § 10 (risque 4).
- produit/recherche/auth-paiement.md § 2.2, § 2.3 ; produit/MARQUE.md § 5.
- produit/SUIVI.md § 3.2 (`offre`, `periode_prix`, `source_lot`).

## Hors périmètre
- Écran d'édition du catalogue : L5-25. Checkout Stripe et création des prix : L8-01. Abonnements et bascules : L9-01.
- Page tarifs de la vitrine : L2-08. Tests de prix : L8-06. Décision des prix de lancement : L0-04.
