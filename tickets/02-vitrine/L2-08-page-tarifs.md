# L2-08 · Page tarifs

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L0-04, L2-01 | `site/`, `outils/` | À faire |

## Pourquoi
Le visiteur de `/tarifs` cherche le piège : abonnement caché, plans qui expirent, remboursement impossible (MESSAGES.md § 5). Tous les prix d'OFFRES.md sont des hypothèses ; aucun n'est publié avant validation (L0-04). Et les offres évolueront (décision 7) : les prix et le contenu de chaque offre doivent venir d'un seul fichier de données, lu par toutes les pages, en attendant le catalogue en base (L5-08) que la vitrine et l'application liront ensemble.

## À faire
1. **Fichier unique** `site/donnees/offres.json`, calqué sur les champs du futur catalogue (L5-08 : prix, crédits, contenu débloqué, durée d'essai, validité) :
   - par offre : `id` (identifiant du catalogue, jamais un code figé dans le code, R5 ; codes stables du catalogue, sans prix, SUIVI.md § 3.2 : `particulier_visite`, `particulier_plan_suivant`, `particulier_pack_3`, `pro_solo`, `pro_cabinet`, `pro_equipe`…), `cible`, `libelle`, `prix_centimes`, `taxe` (`TTC` ou `HT`), `periodicite`, `plans_inclus`, `contenu` (liste de livrables), `conditions`, `valide` (booléen posé seulement après L0-04), `date_validation` ;
   - un bloc `livrables_lancement` qui dit ce que le service livre vraiment (R1) : aperçu offert = vue du dessus 3D découpée, plan 2D coté, 2 photos, surfaces, points à faire confirmer ; visite débloquée = visite dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage) et les mêmes images ; aucun nombre de photos, pas de galerie complète. Repris par tous les tableaux comparatifs.
2. **Rendu dans les pages** : `outils/site.py` (L2-01, R19) injecte les prix et contenus du catalogue dans les zones marquées `data-offre="<id>"` de `/tarifs`, de l'accueil (§ 1.5, § 1.8), de `/pro` (§ 2.7), de `/promoteurs` (§ 3.6) et de `/marque-blanche` ; une offre `valide: false` n'est jamais écrite, et sa zone est masquée.
3. **Sections de `/tarifs`, dans l'ordre** (MESSAGES.md § 5) :
   1. Premier écran § 5.1 : surtitre « TARIFS », H1 « Des prix simples, payés au plan. », sous-titre (TTC particuliers, HT professionnels), onglets **Particuliers · Professionnels** (onglets accessibles : `role="tablist"`, flèches du clavier).
   2. Particuliers § 5.2 : quatre cartes (premier plan offert, visite complète, comparer 3 lots, plan suivant), bouton **Importer mon plan** (suit le mode de `site.json`, L2-04).
   3. Bon à savoir avant d'acheter § 5.3 ; Si quelque chose ne va pas § 5.4 ; Ce que la visite ne comprend pas § 5.5 ; Repère § 5.6 (source FPI).
   4. Professionnels § 5.7 : Pro (tableau), Programme, Partenaires, avec liens vers `/pro`, `/promoteurs`, `/marque-blanche` ; chaque formule et son prix restent masqués tant que l'offre n'existe pas (lots 9 à 11, R21), et l'onglet renvoie alors vers l'entretien ou la bêta fondateurs (L2-18).
   5. Questions fréquentes § 5.8 avec `data-question` ; pied § 8.2.
4. **Règles d'affichage** : TTC pour les particuliers, HT et « TVA de 20 % en sus » pour les pros ; prix ronds, sans prix barré ; chiffres en DM Mono tabulaire ; bloc « limites » (MESSAGES.md § 8.4) près de chaque bouton d'achat.
5. **Passages juridiques** (24 mois en ligne, remboursement de 15 € par plan non utilisé du lot de 3, rétractation, « Renoncer au contrat ici ») : `data-si` jusqu'à l'avis de l'avocat (L0-07) et aux CGV (L8-04). Pendant la bêta, où rien n'est vendu, la section « Bon à savoir avant d'acheter » reste masquée.
6. **Visibilité** (R13) : tant qu'aucune offre particulier n'est validée **et** que l'achat n'est pas ouvert (lot 8, L8-07), aucun prix aux particuliers n'est affiché et la page n'apparaît ni dans le menu, ni dans le plan du site, ni dans les liens « Tous les tarifs → ». Aucun message ne propose 29 € avant le lot 8.
7. Accroches de mesure : `data-page="tarifs"`, `data-section`, `data-question` ; attributs selon L2-14.

## Critères d'acceptation
- [ ] Modifier un prix dans `offres.json` puis lancer `outils/site.py` change ce prix sur toutes les pages qui l'affichent, et nulle part ailleurs ; deux passages donnent une sortie identique.
- [ ] Avec toutes les offres à `valide: false`, aucun montant en euros n'apparaît sur le site (contrôle L2-15 : tout nombre suivi de « € » doit provenir d'une offre validée ou d'une source citée comme le prix FPI) ; avant l'ouverture de l'achat (lot 8), aucun prix aux particuliers (R13).
- [ ] Le contenu affiché de la visite payante correspond à `livrables_lancement` : aucun nombre de photos (R1).
- [ ] Onglets utilisables au clavier et annoncés ; pas de défilement horizontal dès 320 px (R10) ni à 360 px ; aucune erreur axe-core grave.
- [ ] Aucun texte technique ni vocabulaire banni ; « garanti » seulement dans « garantie légale de conformité ».

## Mesure
Posées selon L2-14 : page vue, `tarifs_onglet_choisi`, `cta_depot_clique` (`emplacement` = `tarifs`), `cta_essai_pro_clique`, `cta_promoteur_clique`, `cta_partenaire_clique`, `section_vue`, `faq_ouverte`.

## Points d'attention
- **Tranché : R1.** « environ 11 photos, téléchargeables en haute définition » (MESSAGES.md § 5.2, OFFRES.md § 0.1) disparaît : pas de galerie complète au lancement (L13-02, jamais promise), et au pire la visite sans les photos (décision 5). Le contenu vient de `livrables_lancement` ; MESSAGES.md et OFFRES.md sont corrigés par leurs propriétaires.
- **Dictionnaire** : MESSAGES.md prévoit deux onglets (Particuliers, Professionnels), SUIVI.md § 3.4 prévoit `onglet` = `particulier`, `conseiller`, `promoteur`, `mensuel`, `annuel`. Il manque `professionnel`, ou il faut trois onglets. À trancher et aligner.
- **Unité affichée** : « plan » plutôt que « crédit » côté particuliers (MARQUE.md § 5.1), tranché par L0-04.
- **Tranché : R8.** Les prix ne se testent que par périodes, jamais par un prix différent tiré au sort par personne : un seul prix par période, changé dans le catalogue.
- **Tranché : R5.** Catalogue d'offres en base, modifiable sans déploiement (L5-08) ; quand il existera, `offres.json` en sera exporté et `outils/site.py` relancé ; garder les mêmes identifiants ; droits acquis honorés.

## Références
- produit/MESSAGES.md § 0.2 ([Prix : hypothèse]), § 0.4 (Prix, Limites), § 1.5, § 1.8, § 2.7, § 3.6, § 4.2, § 4.3, § 5 (5.1 à 5.8), § 8.4.
- produit/OFFRES.md § 0.1, § 0.2, § 2.3, § 2.6, § 9.1 ; produit/SUIVI.md § 3.2 (`offre`, `formule`), § 3.4.
- produit/MARQUE.md § 5.1, § 5.3.

## Hors périmètre
- Décision des prix : L0-04. Catalogue en base et droits acquis : L5-08. Paiement : L8-01. CGV : L8-04. Tests de prix : L8-06.
