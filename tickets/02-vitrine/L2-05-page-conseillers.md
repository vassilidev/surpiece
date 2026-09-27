# L2-05 · Page conseillers (offre Pro)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L2-01, L2-12 | `site/` | À faire |

## Pourquoi
Les conseillers (CGP, CIF, agents, mandataires, commercialisateurs) sont visés comme premiers clients payants récurrents (marche.md § 5.5, point 2). La page `/pro` doit leur faire comprendre en une minute la valeur (un lien de visite par lot, un prospect qui se signale lui-même, le respect du consentement et des droits du promoteur) et les amener à un rendez-vous : tant que les lots 9 à 11 ne sont pas livrés, un entretien ou la bêta fondateurs (L2-18), jamais un essai en ligne (R21). Elle sert aussi de support aux entretiens de validation (L2-18) et aux premiers conseillers (L9-11).

## À faire
1. **Sections, dans l'ordre** (MESSAGES.md § 2, textes non recopiés) :
   1. En-tête § 8.1, bouton de page « Essayer 14 jours » (ou son remplaçant du point 2).
   2. Premier écran § 2.1 : surtitre « SUR PIÈCE PRO · CONSEILLERS EN IMMOBILIER NEUF », H1 « Envoyez la visite du lot, pas seulement son plan. », sous-titre, bouton principal **Essayer 14 jours gratuitement** et sa ligne « Sans carte bancaire · 3 plans complets · un essai par entreprise » (seulement une fois L9-02 livré ; avant, bouton du point 2), visuel du témoin.
   3. Le constat § 2.2 (chiffres FPI sourcés ; aucune promesse de baisse des désistements).
   4. Comment ça marche § 2.3 (quatre étapes).
   5. Les liens de visite § 2.4.
   6. Savoir qui est intéressé, dans les règles § 2.5 (compteur agrégé et bouton « Je suis intéressé » ; le détail des visites reste masqué, [À VALIDER : avocat]).
   7. Réglages personnalisés § 2.6.
   8. Formules § 2.7 : tableau généré depuis `site/donnees/offres.json` (L2-08), masqué tant que les prix ne sont pas validés (L0-04) et que les formules ne sont pas en vente (L9-01, R21).
   9. Essai § 2.8, masqué tant que l'essai n'existe pas (L9-02, R21) ; bloc « Bêta fondateurs » § 2.9 : principe retenu par R21, contenu tranché par L0-05.
   10. Les droits du promoteur § 2.10 (toujours visible : c'est une information due).
   11. Questions fréquentes § 2.11 avec `data-question` ; dernier appel § 2.12 ; pied § 8.2.
2. **Mode pré-lancement** (le même principe que le mode liste d'attente de L2-04, piloté par `site.json`) : tant que l'essai n'existe pas (L9-02), la page ne propose que ce qui existe (R21) : le bouton principal propose un entretien (démonstration sur l'appartement témoin) ou la bêta fondateurs (L2-18), et ouvre le formulaire de L2-12 avec le profil « conseiller » (activité, plans par mois estimés, téléphone facultatif). « Essayer 14 jours » et sa ligne restent masqués. Rédiger ces textes de repli, les faire valider, les reporter dans MESSAGES.md (par son propriétaire).
3. **Fonctions pas encore construites** : chaque phrase qui décrit une fonction absente (liens prospects, bouton « Je suis intéressé », QR code, fiche PDF, portail distributeurs, codes à offrir) porte `data-si="<ticket>"` et reste masquée ou reformulée « en préparation », sans date (MARQUE.md § 3.4, MESSAGES.md § 0.2 [SI LIVRÉ]).
4. **Bouton secondaire** « Voir une page de visite prospect → » : masqué tant que la page prospect de démonstration n'existe pas ; à sa place, « Visiter l'appartement témoin → ».
5. Accroches de mesure : `data-page="pro"`, `data-section`, `data-question` ; attributs d'événements selon L2-14.
6. Balises title et description de MESSAGES.md § 2 (reprises par L2-13).

## Critères d'acceptation
- [ ] Avec `site.json` en mode pré-lancement, aucun bouton ne promet un essai immédiat ; tous mènent au formulaire de L2-12, qui enregistre une demande de test (profil conseiller) de bout en bout.
- [ ] Aucune fonction non construite n'est présentée comme disponible : le contrôle L2-15 ne trouve aucun élément `data-si` visible dont la condition est fausse.
- [ ] Aucun prix affiché sans validation L0-04 ; prix HT avec « TVA de 20 % en sus » quand ils le sont.
- [ ] Le bloc « Les droits du promoteur » est visible sur ordinateur et sur téléphone.
- [ ] Aucun visuel autre que le témoin fictif ; aucune capture d'une page qui n'existe pas.
- [ ] Pas de défilement horizontal dès 320 px (R10) ni à 360 px ; aucune erreur axe-core grave ; aucun texte technique ni vocabulaire banni (« lead », « dashboard »…).

## Mesure
Posées selon L2-14 : page vue, `cta_essai_pro_clique` (quand l'essai existe), `cta_rdv_pro_clique`, `cta_demo_clique`, `section_vue`, `page_defilee`, `faq_ouverte`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` (`formulaire` = `rdv_pro`) ; côté serveur, `rdv_pro_demande` écrit par le service de L2-12.

## Points d'attention
- **Tranché** : L2-12 (formulaire de rendez-vous ou de bêta) est une dépendance déclarée, comme pour L2-06 et L2-07.
- **Tranché : R21.** Au lot 2, aucune fonction Pro n'existe (essai L9-02, liens prospects L9-04, marque du conseiller L9-06). La page ne décrit comme disponible que ce qui existe : avant les lots 9 à 11, elle propose un entretien ou la bêta fondateurs (L2-18), pas un essai en ligne ; les fonctions à venir sont masquées ou dites « en préparation », sans date (OFFRES.md § 0.2, règle 5 ; juridique.md § 5.2).
- **Tranché : R1.** « environ 11 photos » par lot (§ 2.3) disparaît : au lancement, visite dans le navigateur et mêmes images que l'aperçu, dont 2 photos ; galerie complète plus tard (L13-02), jamais promise. Contenu lu dans `offres.json`.
- **Fausse capture** : le visuel de § 2.1 (« la page prospect du témoin sur un téléphone ») serait une capture d'une page qui n'existe pas encore, interdite par MARQUE.md § 8.4.
- **Dictionnaire** : PARCOURS.md B1 utilise `emplacement` = `pro`, valeur absente de SUIVI.md § 3.2 ; à ajouter par le propriétaire de SUIVI.md.
- Le suivi détaillé des prospects (durée, pièces vues) ne doit jamais être présenté sans l'avis de l'avocat (OFFRES.md § 3.4).

## Références
- produit/MESSAGES.md § 0.2, § 2 (2.1 à 2.12), § 8.1, § 8.2 ; produit/OFFRES.md § 3 (3.1 à 3.10), § 0.2 ; produit/PARCOURS.md B1.
- produit/MARQUE.md § 3.2, § 3.4, § 5.2, § 8.4 ; produit/recherche/marche.md § 4.1, § 5.5 ; produit/recherche/juridique.md § 3.7, § 4.3.
- produit/SUIVI.md § 3.2, § 3.4, § 3.12.

## Hors périmètre
- Formulaire et stockage des demandes : L2-12. Prix : L2-08.
- Essai, abonnements, liens prospects, page prospect de démonstration : L9-01 à L9-06.
- Page `/pro/decouvrir` (arrivées depuis une visite) : sans ticket, voir L2-04. Premiers conseillers : L9-11.
