# L2-04 · Page d'accueil particuliers

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | L (3 à 5 j) | L2-01, L2-02, L2-03 | `site/` | À faire |

## Pourquoi
L'accueil (`/`) doit faire déposer un plan : en 5 secondes, le visiteur comprend ce que c'est, ce qui est offert, ce que coûte la visite et ce qui n'est pas pris en charge (PARCOURS.md A1). Tant que le service en ligne n'existe pas, le même bouton « Importer mon plan » inscrit à la liste d'attente de la bêta ; il bascule en dépôt réel au lot 6 (L6-01) par une seule variable, sans refaire la page.

## À faire
1. **Variable de mode** : `site/donnees/site.json` → `mode_depot` = `liste_attente` (maintenant) ou `depot` (L6-01). `site/js/site.js` lit la valeur écrite dans la page par `outils/site.py` (`<body data-mode-depot>`, R19) ; aucun fichier n'est envoyé en mode `liste_attente`.
2. **Sections, dans l'ordre** (textes de MESSAGES.md, non recopiés ici) :
   1. En-tête § 8.1 (bouton principal « Importer mon plan » ; « Se connecter » masqué jusqu'à L6-01).
   2. Premier écran § 1.1 : surtitre « PLAN DE VENTE → VISITE 3D », H1 « Visitez votre futur appartement, d'après son plan de vente. », sous-titre, zone de dépôt (« Glissez votre plan de vente ici », mobile « Choisissez votre plan de vente », aide 40 Mo), bouton **Importer mon plan**, trois assurances, phrase de PARCOURS.md A1 sur le contenu du plan offert et le prix de la visite, limites, lien « Visiter d'abord l'appartement témoin → », visuel du témoin (L2-03).
   3. Bandeau de trois faits § 1.2 (sans « Précision au centimètre » de `accueil.html` l. 85).
   4. Démonstration § 1.3 : titre « Faites le tour avant de déposer votre plan. », boutons « Entrer dans la visite » (vers `/appartement-temoin`) et « Voir le plan 2D coté ».
   5. Comment ça marche § 1.4 (trois étapes, bouton Importer mon plan).
   6. Ce que vous obtenez § 1.5 : tableau généré depuis `site/donnees/offres.json` (L2-08), pas écrit en dur ; aucun nombre de photos (R1).
   7. Fidélité et contrôle § 1.6 (lien « Notre méthode en détail → » masqué tant que L2-10 n'est pas publié).
   8. Quand s'en servir § 1.7 : cartes rétractation, TMA, visite cloisons, famille ; carte « rendez-vous bancaire » masquée par défaut (avis de l'avocat attendu).
   9. Prix § 1.8 : cartes générées depuis `offres.json`, section entière masquée tant que les prix ne sont pas validés (L0-04) et que l'achat n'est pas ouvert : aucun message qui propose 29 € avant le lot 8 (R13).
   10. FAQ § 1.9, chaque question avec un `data-question` du dictionnaire (SUIVI.md § 3.2).
   11. Dernier appel § 1.10, puis pied de page § 8.2.
3. **Mode liste d'attente** : la zone du premier écran garde sa place et son tireté mais affiche le formulaire de L2-12 (e-mail, profil, « Où en êtes-vous ? ») ; tous les boutons « Importer mon plan » y mènent. Un fichier lâché sur la page n'est jamais envoyé : message court qui invite à s'inscrire. Rédiger les variantes de texte de ce mode (premier écran, étape 3, dernier appel, FAQ « Combien de temps »), les faire valider et les reporter dans MESSAGES.md (par son propriétaire).
4. **Mode dépôt** (préparé, activé par L6-01) : contrôles dans le navigateur sur les premiers octets comme `format_fichier` (`pipeline/serveur.py`), refus `depot.refus.format`, `.vide`, `.lourd` (MESSAGES.md § 7.1), sans envoi ; le reste du parcours (IndexedDB, URL signée, compte) appartient à L6-01.
5. **Mobile** : zone visible sans défiler, bouton de 48 px ; après le premier écran, bouton « Importer mon plan » collé en bas (`safe-area-inset-bottom`) ; aucune fenêtre surgissante.
6. **Blocs conditionnels** : tout passage marqué [SI LIVRÉ], [À VALIDER : avocat], [À CONFIRMER] ou [Prix : hypothèse] dans MESSAGES.md porte `data-si="<condition>"` et reste masqué tant que la condition n'est pas vraie dans `site.json` (liste des conditions tenue à jour).
7. **Accroches de mesure** posées dès maintenant : `data-page="accueil"`, `data-section` sur chaque section, `data-question` sur chaque question ; les attributs d'événements suivent L2-14.
8. Titre et description de la page : balises de MESSAGES.md § 1 (reprises par L2-13).

## Critères d'acceptation
- [ ] Basculer `mode_depot` de `liste_attente` à `depot` puis relancer `outils/site.py` change le comportement de tous les boutons sans autre modification de la page.
- [ ] En mode `liste_attente`, aucun octet de fichier ne quitte le navigateur (vérifié par interception des requêtes dans puppeteer en lâchant un PDF).
- [ ] Aucun défilement horizontal dès 320 px (R10) ; premier écran lisible sans défilement vertical à 360 × 640 et 1280 × 720 : titre, zone, bouton, contenu du plan offert, limites (captures jointes).
- [ ] Aucun prix affiché si `offres.json` n'est pas marqué validé, ni aucun prix de la visite avant l'ouverture de l'achat (lot 8, R13) ; aucun passage [À VALIDER] ou [SI LIVRÉ] visible (contrôle L2-15).
- [ ] Aucun texte technique ni vocabulaire banni (MARQUE.md § 5.2) ; « au centimètre » absent.
- [ ] Toutes les images viennent de `site/img/temoin/` (témoin fictif) avec légende « Appartement témoin fictif · Illustration non contractuelle ».
- [ ] Accessibilité : zone utilisable au clavier (Entrée ou Espace ouvre le sélecteur), FAQ au clavier, aucune erreur axe-core de niveau grave ; mouvement réduit respecté.
- [ ] Poids de la page sous 500 Ko hors vidéo ; l'outil local reste intact.

## Mesure
Posées selon L2-14 (inertes tant qu'Umami n'est pas installé, L7-01) : page vue, `cta_depot_clique` (`emplacement` : `entete`, `hero`, `etapes`, `tarifs`, `flottant_mobile`…), `cta_demo_clique`, `cta_tarifs_clique`, `section_vue`, `page_defilee`, `faq_ouverte`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` ; en mode dépôt (L6-01) `depot_fichier_choisi`, `depot_fichier_refuse`.

## Points d'attention
- **Tranché : R1.** Aperçu offert : vue du dessus 3D découpée, plan 2D coté, 2 photos, surfaces et points à faire confirmer. Visite débloquée : visite dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche complète, partage) et les mêmes images. La galerie complète vient plus tard (L13-02) et n'est jamais promise : « environ 11 photos » de MESSAGES.md § 1.5, § 1.8 et d'OFFRES.md § 0.1 disparaît (textes corrigés par leurs propriétaires). Le tableau et les cartes sont lus dans `offres.json`, pour ne rien promettre de plus que ce qui est livré.
- **Tranché : R13.** Pendant la bêta fermée (lot 6), aucun achat : dépôt réservé aux invités (code d'invitation), variante « bêta » du catalogue (plan complet ou aperçu selon L0-04). La phrase « Premier plan offert … La visite s'ouvre ensuite pour 29 € » et tout prix de la visite restent masqués jusqu'au lot 8 ; ouverture à tous en L8-07.
- **Mot « duplex »** dans la FAQ (MESSAGES.md § 12.1) : à trancher dans L0-05 ; par défaut, la question dit « plusieurs niveaux ou une maison ».
- **Tranché : R12.** Aucun délai affiché en dur (ni « un quart d'heure environ », ni « 8 à 15 minutes ») : les textes portent le marqueur ‹délai› jusqu'à la mesure en production (T0, L5-11), et un passage qui le porte reste masqué (`data-si`) d'ici là. Les mesures actuelles viennent du Mac avec GPU, alors que la production rend en SwiftShader (décision 4).
- **Démonstration intégrée** : § 1.3 prévoit « la maquette 3D du témoin, à faire tourner » dans la page ; charger le moteur (environ 3 Mo) sur l'accueil nuit au premier affichage. Proposition : image ou vidéo de L2-03 et lien vers `/appartement-temoin`. À valider.
- **Pages sans ticket** : `/offert` et `/pro/decouvrir` (SUIVI.md § 2.6 et § 7.1, point 5), pages d'arrivée du bouche-à-oreille, n'ont pas de ticket. Proposition : copie de l'accueil avec `data-page="offert"`, à ajouter ici ou à L6-08.
- Les emplacements de témoignages (MESSAGES.md § 10.1) ne sont pas créés : rien n'est affiché sans preuve réelle.

## Références
- produit/MESSAGES.md § 0.3, § 0.4, § 1 (1.1 à 1.10), § 7.1, § 8.1 à § 8.4, § 10.1, § 12.1 ; produit/PARCOURS.md A1, A2, § 1.5 ; produit/SUIVI.md § 3.2, § 3.4.
- produit/MARQUE.md § 3.4, § 5.2, § 6.10 (gabarit Accueil), § 8.2.
- pipeline/accueil.html l. 84-85 (faits, « Précision au centimètre ») ; pipeline/serveur.py (`format_fichier`, contrôle sur les premiers octets).

## Hors périmètre
- Formulaire et stockage de la liste d'attente : L2-12. Dépôt réel, compte, IndexedDB : L6-01.
- Prix et page tarifs : L2-08. Balises, sitemap, données structurées : L2-13. Attributs de mesure : L2-14.
- Témoignages et chiffres mesurés : L6-12. Tests A/B des titres : L12-05.
