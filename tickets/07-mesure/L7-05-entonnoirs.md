# L7-05 · Entonnoirs et objectifs

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P1 | S (jusqu'à 1 j) | L7-04 | `outils/` | À faire |

## Pourquoi
Les seuils de décision d'OFFRES.md (perte de plus de 40 % entre dépôt et e-mail vérifié, conversion de l'aperçu d'au moins 11,1 % à 29 €, moins de 20 % d'échecs, pack sous 10 % des ventes, 25 % des essais pros abonnés) ne servent que s'ils sont lus au même endroit, avec les mêmes définitions. Avant le compte, seul Umami voit les visiteurs anonymes ; après le dépôt, le journal est exact (SUIVI.md § 4.1). Ce ticket configure la partie Umami et écrit la table des objectifs ; les vues SQL sur le journal sont dans L7-06.

## À faire
1. **Entonnoirs dans Umami** (SUIVI.md § 4.7), sur le site `production` puis `recette`, avec leur fenêtre :
   - particulier, vitrine vers dépôt : `/` → `cta_depot_clique` → `depot_fichier_choisi` → `depot_envoi_termine` → `inscription_ouverte` → `inscription_methode_choisie` (60 min) ;
   - démonstration vers dépôt : `demo_ouverte` → `visite_mode_choisi` → `cta_depot_clique` → `depot_envoi_termine` (60 min) ;
   - aperçu vers paiement : URL finissant par `/apercu` → `verrou_clique` → `volet_deblocage_ouvert` → `offre_choisie` → URL finissant par `/paiement/confirme` (60 min ; vide jusqu'au lot 8) ;
   - conseiller : `/pro` → `cta_rdv_pro_clique` avant le lot 9 (entretien ou bêta fondateurs, R21), `cta_essai_pro_clique` quand l'essai en ligne existe → `formulaire_commence` → `formulaire_envoye` (30 min) ;
   - promoteur : `/promoteurs` → `cta_promoteur_clique` → `formulaire_commence` → `formulaire_envoye` (30 min) ;
   - bouche-à-oreille : `/offert` → `cta_depot_clique` → `depot_envoi_termine` (60 min).
2. **Objectifs (Goals)** : `depot_envoi_termine`, `inscription_methode_choisie`, `formulaire_envoye`, `demo_ouverte`, `offre_choisie`. **Parcours (Journey)** : départ `/`, arrivée `depot_envoi_termine`, 5 étapes. **Tableau d'audience (Board)** : visites, pages d'arrivée, provenance, boutons d'appel par emplacement, sections vues, FAQ ouvertes.
3. **Configuration versionnée** : script `outils/umami_config.py` qui crée ou met à jour ces rapports par l'API d'Umami si la version installée le permet ; sinon, procédure écrite pas à pas. Dans les deux cas, la configuration se refait à l'identique sur une nouvelle instance (décision 2 : déployable partout).
4. **Annotations** : chaque changement de période de prix, de texte du bandeau ou de mise en page de l'accueil est noté dans Umami (procédure).
5. **Table des objectifs** (fichier versionné lu par les tableaux de L7-06) : pour chaque étape des entonnoirs de SUIVI.md § 4.2 à § 4.5, l'objectif de départ repris d'OFFRES.md avec sa source, ou « à établir ». Un objectif « à établir » est fixé après la première période de mesure : 3 semaines ou environ 150 aperçus (OFFRES.md § 9.1).
6. **Lecture croisée** : l'écart entre `depot_envoi_termine` (Umami) et `plan_depose` (journal) est suivi comme indicateur de santé (SUIVI.md § 5.7), **sans jointure** entre les deux sources.

## Critères d'acceptation
- [ ] Après une exécution de la recette (L7-07) sur `recette`, chaque entonnoir disponible montre les étapes attendues, dans l'ordre, avec au moins un passage complet.
- [ ] Le script ou la procédure recrée la configuration sur une instance Umami vierge (essai fait une fois).
- [ ] La table des objectifs cite une source pour chaque chiffre ; aucun objectif inventé.
- [ ] Aucune étape d'entonnoir ne repose sur une propriété (les entonnoirs d'Umami ne les filtrent pas, SUIVI.md § 3.1, à vérifier).

## Points d'attention
- **Continuité de session** entre `<domaine>` et `app.<domaine>` à vérifier (SUIVI.md § 2.6, R1) : si elle casse, l'entonnoir « vitrine vers dépôt » s'arrête au dépôt et le journal prend le relais. Le signaler dans la table des objectifs.
- Umami donne des **minorants** (bloqueurs, DNT, GPC, opposition) : ne jamais comparer ses taux aux seuils d'OFFRES.md mesurés sur le journal.
- Si l'utilisateur refuse Umami sur les écrans de l'application (L0-05), les entonnoirs 1 (après `depot_fichier_choisi`) et 3 deviennent impossibles dans Umami : leurs étapes passent au journal (L7-06).
- Tout chiffre d'Umami remis à un tiers est arrondi à la dizaine (analyse d'exemption, L7-08).

## Références
- SUIVI.md § 3.1, § 4.1 à § 4.8, § 5.7 ; OFFRES.md § 8.8, § 8.11, § 9.1, § 9.2 ; PARCOURS.md § 0 (tableau des seuils).
- recherche/suivi.md § 1.1, § 1.5 (API d'Umami).

## Hors périmètre
- Vues SQL des entonnoirs après dépôt, par cohorte hebdomadaire : L7-06. Tests A/B : L12-05. Tests de prix : L8-06.
