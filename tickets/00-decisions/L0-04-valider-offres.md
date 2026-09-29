# L0-04 · Valider les offres et les prix de lancement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | S (jusqu'à 1 j) | — | — | À faire |

## Pourquoi
Tous les prix d'OFFRES.md sont des hypothèses de lancement, et aucun n'est publié avant validation (MESSAGES.md § 0.2). Trois décisions du 27/09/2026 changent déjà le contenu des offres : l'aperçu gratuit ne montre que des images rendues par le serveur, avec les surfaces et les points à faire confirmer (décision 6, R1), il n'y a pas de galerie complète au lancement (décision 5), et les offres doivent pouvoir évoluer sans déploiement, droits acquis honorés (décision 7). La page tarifs (L2-08), les questions ouvertes (L0-05) et le catalogue d'offres (L5-08) attendent ce ticket.

Deux décisions du même jour s'ajoutent. Décision de principe n° 15 : un mode 360° à chaque arrêt (panoramas rendus par le serveur, navigation d'arrêt en arrêt) entre dans toutes les visites, et il deviendra probablement l'offre gratuite, la visite 3D complète restant l'offre payante. Il remplace ou enrichit l'aperçu de R1 : à décider, et à confirmer avec le coût de rendu mesuré (L1-16). Décision n° 11 : les logements sur plusieurs niveaux sont gérés, validés plan par plan.

## À faire
1. **Séance de relecture avec l'utilisateur** d'OFFRES.md § 0.1, § 1 à § 5. Pour chaque ligne du tableau § 0.1 : « validé comme hypothèse de lancement », « modifié » ou « reporté ».
   - Particuliers : visite 29 € TTC ; plan suivant 15 € TTC (dans les 12 mois après un premier achat) ; 3 lots 59 € TTC facturés en lignes 29 + 15 + 15 ; prolongation d'hébergement 9 € au-delà de 24 mois.
   - Conseillers : Solo 49 € HT (5 plans, 1 utilisateur), Cabinet 99 € HT (12 plans, 3 utilisateurs), Équipe 199 € HT (30 plans, 10 utilisateurs) ; annuel 490, 990, 1 990 € HT ; essai 14 jours, 3 plans, 1 par SIREN.
   - Promoteurs : rapport de prise en charge offert ; pilote 600 € HT (40 lots, 5 jours ouvrés) ; au lot 25, 20 ou 15 € HT.
   - Marque blanche : 1 500 € HT puis 490 € HT par mois (50 plans, puis 7 € HT) ; codes à offrir 15 € HT, 12 € HT dès 50.
2. **Aperçu gratuit : R1 reste l'hypothèse de travail jusqu'à la confirmation du 360° (décision 15).** Appliquer R1 (tranché, décisions 5 et 6) : images rendues par le serveur (Chromium), dans cet ordre : vue du dessus 3D découpée, plan 2D coté, 2 photos (séjour, puis chambre principale ou, à défaut, la pièce principale suivante) ; plus les surfaces et les points à faire confirmer ; ni le moteur ni `plan.json` envoyés au navigateur, le verrou est côté serveur (R4). Réécrire OFFRES.md § 0.1 et § 2.2 en conséquence. En plus, consigner dans OFFRES.md § 2.2 la décision de principe : le mode 360° à chaque arrêt, fait d'images rendues par le serveur, deviendra probablement l'offre gratuite ; il respecte la décision 6 (ni moteur ni `plan.json` dans le navigateur ; la visionneuse ne reçoit que les panoramas et les liens entre arrêts). « Remplace » ou « enrichit » l'aperçu, et confirmation : après la mesure de L1-16.
3. **Contenu du plan payant au lancement : tranché (R1).** Le mode 360° à chaque arrêt entre aussi dans toutes les visites (décision 15) ; il n'est écrit dans une offre qu'une fois livré (OFFRES.md § 0.2, règle 5). Visite débloquée = moteur et `plan.json` dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage), plus les mêmes images que l'aperçu. La galerie complète (une dizaine de photos) vient plus tard (L13-02) et n'est jamais promise au lancement. Réécrire OFFRES.md § 0.1 et § 2.4 avec des textes qui ne citent aucun nombre de photos ; au pire, la visite est livrée sans photos (décision 5).
4. **Éléments non image de l'aperçu** : surfaces et points à faire confirmer en font partie (R1). Reste à choisir leur forme : textes servis en HTML depuis des champs filtrés (jamais `plan.json`), ou images ; et à confirmer le lien d'aperçu partageable 30 jours d'OFFRES.md § 2.2.
   **Plusieurs niveaux** (décision 11). Pour un logement à plusieurs niveaux, l'aperçu montrerait une vue du dessus et un plan 2D par niveau (la chaîne produit déjà une vue d'ensemble par niveau) : à confirmer. Le périmètre affiché avant paiement passe à « un ou deux niveaux (duplex) » (OFFRES.md § 0.2) : l'utilisateur l'a confirmé le 27/09/2026 (« oui le duplex on l'a géré c'est bon, c'était avant ça »). Le triplex reste hors périmètre tant qu'aucun triplex réel n'a été validé ; escalier quart tournant, entrée au niveau haut et plan en image se valident plan par plan quand un tel plan est fourni.
5. **Unité affichée** : « plan » (recommandé, MARQUE.md § 5.1, OFFRES.md § 1) ou « crédit » (MARQUE.md § 13, point 3).
6. **Testeurs** : plan complet (proposition d'OFFRES.md § 2.2 : 1 crédit « testeur », 60 jours, non transférable) ou aperçu seul (PARCOURS.md § 8.3, question 4). Le choix devient la variante « bêta » du catalogue (R13) : pendant la bêta fermée, aucun achat, dépôt réservé aux invités.
7. **Règle des droits acquis** (décision 7, R5) à écrire dans OFFRES.md § 1 : chaque achat garde un instantané de l'offre (prix, contenu, durées, conditions) et il est honoré tel quel ; un changement du catalogue ne vaut que pour les achats suivants ; un nouveau prix crée un nouveau prix Stripe ; on n'enlève jamais ce qui a été vendu ; une amélioration peut être étendue aux clients existants.
8. **Préparer le catalogue initial pour L5-08** : un tableau par offre (identifiant, libellé client, cible, prix TTC et HT, contenu, durée de validité, conditions, actif ou non), avec les durées d'OFFRES.md, qui fait foi (R7 : aperçu 6 mois, visite 24 mois) ; les offres des organisations y figurent aussi, sans code figé du type `pro-5` (R5).
9. **Qui décide** : l'utilisateur. **Où consigner** : OFFRES.md (statut et date par ligne ; les prix restent des hypothèses jusqu'aux tests T0 à T2, § 9.2), MARQUE.md § 13, PARCOURS.md § 8.3, MESSAGES.md § 12.2 (point 2).

## Critères d'acceptation
- [ ] Chaque ligne d'OFFRES.md § 0.1 porte un statut daté.
- [ ] OFFRES.md § 2.2 et § 2.4 sont réécrits selon R1 et R4 (ordre des images, surfaces et points à faire confirmer, rien du moteur ni de `plan.json` dans l'aperçu, contenu payant au lancement sans nombre de photos).
- [ ] La règle des droits acquis est écrite dans OFFRES.md § 1 ; le tableau du catalogue initial est prêt pour L5-08.
- [ ] Unité affichée et offre des testeurs tranchées et reportées (MARQUE.md § 13, OFFRES.md § 2.2, PARCOURS.md § 8.3).
- [ ] La liste des textes à reprendre est transmise aux tickets du site et du parcours (voir Points d'attention).
- [ ] La décision de principe sur le mode 360° (décision 15) est écrite dans OFFRES.md § 2.2 avec « à confirmer après L1-16 » ; le périmètre affiché sur les niveaux suit la décision 11 (« un ou deux niveaux (duplex) »).

## Points d'attention
- **Contradictions tranchées, textes repris dans les documents le 27/09/2026** (à vérifier pendant la séance) :
  - vue de l'aperçu : « vue du dessus 3D découpée » (décision 5), et non l'ancienne « vue d'ensemble plongeante » d'OFFRES.md § 2.2 ;
  - **Tranché : R1.** « environ 11 photos », « 8 autres photos » et équivalents sont retirés partout : OFFRES.md § 0.1, § 2.4, § 3.3, § 4.4, MESSAGES.md § 1.8, § 2.3, § 3.3, § 5.2, § 7.6, § 7.7 et PARCOURS.md (A10, A11, A12) ;
  - **Tranché : R4.** Le verrou de l'offre gratuite est côté serveur (rien de la visite n'est envoyé), pas un verrou d'interface : ARCHITECTURE.md M3.2 est réécrit en ce sens.
- Rendu des panoramas : environ 10 par plan offert, en SwiftShader sans GPU (R3). Les provisions de rendu d'OFFRES.md § 8.1 (0,05 € par aperçu) ont été calculées pour 4 images ; elles sont revues avec la mesure de L1-16 avant de confirmer le 360° gratuit. Premiers chiffres du 28/09/2026 (L1-16, en cours) : 4 à 10 panoramas par plan sur les 5 références ; 34 à 104 s par plan sur Mac en Metal, occlusion ambiante et 8192 compris (indicatif) ; sans carte graphique, environ 3,5 min par panorama en 4096, soit 20 à 40 min par plan, estimé avant l'occlusion qui double le rendu des vues (ordre de grandeur, mesure SwiftShader à faire).
- Le plan offert coûte autant de lecture IA qu'un plan payant (1,10 à 1,85 $, plafond de 3 $ par plan, R6) : l'économie du gratuit (OFFRES.md § 8.8) ne change pas avec le nombre d'images. Il est consommé à la publication de l'aperçu, et le déblocage payant ne relance aucune lecture (R2).
- Questions juridiques qui restent pour l'avocat (L0-07) : 24 mois d'hébergement, remboursement de 15 € par plan non utilisé du lot de 3, garantie légale sur l'aperçu offert (OFFRES.md annexe B).
- Prix ronds, TTC pour les particuliers et HT pour les pros, sans prix barré (OFFRES.md § 1).

## Références
- `produit/OFFRES.md` § 0.1, § 0.2, § 1, § 2.1 à § 2.4, § 3.1, § 4.2, § 4.3, § 5, § 6, § 8.8, § 9.2, § 10, annexe B
- `produit/MARQUE.md` § 5.1, § 13
- `produit/PARCOURS.md` § A9, § A10, § 8.3
- `produit/MESSAGES.md` § 0.2, § 1.8, § 5, § 6.3, § 7.5, § 7.6, § 12.2
- `produit/ARCHITECTURE.md` § 8.3 M3.2

## Hors périmètre
- Page tarifs : L2-08.
- Catalogue d'offres en base : L5-08.
- Page d'aperçu gratuit : L6-05 ; mesure du 360° : L1-16 ; aperçu en 360° : L6-13 ; vue du dessus manipulable : L13-03.
- Tests de prix : L8-06 ; galerie complète : L13-02.
