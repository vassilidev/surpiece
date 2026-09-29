# L6-05 · Page d'aperçu gratuit

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L4-09, L5-11, L4-07 | `service/`, `outils/` | À faire |

## Pourquoi
Décision utilisateur 6 et arbitrages R1 et R4 : l'offre gratuite montre des images prises par le serveur (vue du dessus 3D découpée, plan 2D coté, 2 photos). Décision de l'utilisateur du 27/09/2026 (n° 15) : un mode 360° à chaque arrêt, en panoramas rendus par le serveur, entre dans toutes les visites et deviendra probablement l'offre gratuite, à la place de ces images ou en plus ; à confirmer par le coût de rendu mesuré (L1-16), puis mis en service par L6-13 ; panoramas et visionneuse existent dans l'outil local depuis le 28/09/2026 (L4-15, L4-16, en cours), la décision de l'utilisateur n'est pas prise. Il respecte la décision 6 : des images, ni moteur ni `plan.json`, les surfaces et les points à faire confirmer ; le reste est verrouillé **côté serveur** : **ni le moteur ni `plan.json` ne sont envoyés au navigateur**. Un verrou d'interface ne suffit pas : la maquette ouvre la visite par un double-clic au sol, et `App.set('mode','walk')` tapé dans la console aussi (OFFRES.md § 2.2). L'aperçu doit pourtant donner une vraie valeur, qui protège l'acquéreur (surfaces comparées, points à faire confirmer), et rendre le déblocage évident (PARCOURS.md A9, A10).

## À faire
1. **Route** `app.<domaine>/plans/<id>/apercu`, rendue côté serveur (Jinja2), cadrée par organisation (404 sinon). Aucun script du moteur, aucune requête vers `/moteur/`, `engine.js`, `plan.json` ni `/vendor/three`, ni vers un fichier que le serveur précalcule pour la visite (maquette compressée, éclairage précalculé, itinéraires ; décision 14).
2. **Modèle de page** construit côté serveur à partir de `plan.json` lu dans l'espace privé : titre, typologie et surface pour le cartouche ; `fiche.surfaces` et `fiche.sections` (drapeaux `ok`, `w`, `h`, `moteur/SCHEMA.md`) ; noms des pièces. Seuls ces textes sortent, échappés et passés au filtre des textes (L1-04). Repli du titre : « Votre logement » (jamais l'identifiant technique).
3. **Sections dans l'ordre** (PARCOURS.md A9, MESSAGES.md § 7.5) :
   - cartouche : `apercu.badge`, `apercu.titre`, `apercu.sous_titre` ; action principale **`verrou.bouton`** (« Débloquer la visite · 29 € », libellé et prix lus dans le catalogue d'offres, L5-08 ; pendant la bêta fermée, variante `.beta` sans prix ni achat, R13) ; lien « Montrer à vos proches » (L6-08) ;
   - accroche « Voici votre logement d'après le plan. À vous de juger. » (à ajouter, MARQUE.md § 4.4) ;
   - images, dans l'ordre de la décision 5 et de R1, mention incrustée (L4-07) : vue du dessus 3D découpée (`apercu.maquette.titre`) ; plan 2D coté en image (`apercu.plan.titre`, `apercu.plan.legende`), agrandissable en plein écran avec zoom à deux doigts ; 2 photos (`apercu.photos.titre`) : le séjour, puis la chambre principale ou, à défaut, la pièce principale suivante. Si l'utilisateur confirme le 360° comme offre gratuite, la visionneuse entre dans cette section par L6-13 ; images de R1 gardées ou retirées selon sa décision (remplacement ou ajout). Duplex (`niveaux_max = 2`, L4-08) : une vue du dessus et un plan 2D par niveau, avec le nom du niveau (nombre d'images à confirmer, L0-04). Une photo omise après nouvelles tentatives ne laisse aucun emplacement (galerie adaptative, R2) ;
   - surfaces par pièce (`apercu.surfaces.*`), vrai tableau avec en-têtes ; chaque écart porte un libellé, jamais la couleur seule ;
   - points à faire confirmer (`apercu.points.*`), **jamais verrouillés** ;
   - zone verrouillée : Visite, Maquette 3D interactive, Plan 2D interactif, téléchargements, partage de la visite (cadenas au trait et texte `verrou.onglet`, `verrou.telechargement`) ; vignettes verrouillées de la visite **par pièce**, avec le nom de la pièce et sans image. Si le 360° est dans l'aperçu (L6-13), les pièces s'y voient déjà : le verrou porte sur la marche libre, la maquette et le plan 2D interactifs (`verrou.piece.360`, MESSAGES.md § 7.6) ; aucun emplacement de photo supplémentaire, aucune promesse d'un nombre de photos (R1) ;
   - `apercu.conservation` (6 mois), `apercu.mention`.
4. **Volet de déblocage** (MESSAGES.md § 7.6), ouvert par tout élément verrouillé : titre, texte, choix lus dans le catalogue d'offres (contenu débloqué, prix, validité ; contenu de R1 : visite en marche libre et arrêts par pièce, maquette et plan 2D interactifs, fiche complète, téléchargements, partage, et les mêmes images, jamais « environ 11 photos » ni « 8 autres photos »), limites, `Continuer`, lien vers le témoin, « Plus tard ». Focus piégé, Échap, boutons radio dans un `fieldset`, feuille montante sur mobile.
5. **Pendant la bêta fermée** (avant L8-01 et L8-02, R13), la vente n'existe pas : seule la variante « bêta » du catalogue est publiée. Le volet décrit ce que débloque la visite et affiche un texte du catalogue sans prix ni bouton de paiement (`verrou.bouton.beta` et `verrou.volet.beta.*`, MESSAGES.md § 7.6, sans « bientôt ») ; aucun écran ne propose 29 €. Un compte qui a un plan complet disponible (crédit testeur) voit `verrou.bouton_plan_dispo` si le déblocage par crédit est livré (L8-02), sinon rien de plus.
6. **Images** servies par URL signées courtes depuis l'espace privé ou un préfixe de 128 bits (ARCHITECTURE.md § 5.2), jamais le fichier du promoteur (`page.png`, `calibration.png`, `plan-*.png`).
7. **Contrôle automatique bloquant**, dans `outils/` et appelé par le worker à chaque publication d'un aperçu (et en CI sur le témoin) : puppeteer ouvre la page comme son propriétaire, intercepte chaque requête et **échoue** si une URL contient `engine.js`, `/moteur/`, `plan.json`, une bibliothèque 3D ou un fichier précalculé de la visite (maquette compressée, éclairage, itinéraires) ; la visionneuse 360°, si elle y entre (L6-13), n'y reçoit que des images et la liste des arrêts ; extrait le texte visible et échoue sur les motifs de L1-04 ; échoue sur une image cassée, vide ou noire. En cas d'échec, l'aperçu n'est pas publié, le crédit n'est pas consommé, l'équipe est alertée.
8. **Mobile** : une colonne, `verrou.bouton` collé en bas (`safe-area-inset-bottom`), cibles de 40 px.

## Critères d'acceptation
- [ ] Contrôle du point 7 : passe sur l'aperçu du témoin fictif ; échoue sur une page de test qui charge `engine.js`, sur une qui demande `plan.json`, sur une qui affiche « undefined ». Chaque échec bloque la publication (test de bout en bout en `PLAN_MOCK`, aucune lecture payante).
- [ ] Dans la console du navigateur de l'aperçu, `window.App` et `window.__v` sont indéfinis ; `fetch('…/plan.json')` depuis la page renvoie 404.
- [ ] Accès par un autre compte à l'aperçu et à ses images : 404.
- [ ] Tableau des surfaces lisible par un lecteur d'écran (en-têtes) ; photos avec le nom de la pièce en texte alternatif ; volet utilisable au clavier.
- [ ] Captures à 320 px et sur ordinateur, sans image cassée ni emplacement vide ; aucun prix affiché qui ne vienne du catalogue.
- [ ] Une page d'aperçu ne promet aucun contenu absent de l'offre en vigueur (test : contenu débloqué rendu depuis le catalogue) ; aucun nombre de photos promis au déblocage (recherche de « 11 photos », « autres photos » dans le texte visible).
- [ ] Configuration bêta : aucun prix ni bouton de paiement dans la page et le volet.
- [ ] Aperçu avec une photo omise : aucun emplacement vide, aucune image cassée.

## Mesure
- S : `apercu_vu` (`rang`, `delai_depuis_pret`).
- N : `section_vue`, `verrou_clique` (`element`), `volet_deblocage_ouvert` (`origine`), `offre_choisie` (`offre`, `periode_prix`), `cta_demo_clique` (`emplacement=volet`), inertes jusqu'à L7-04.

## Points d'attention
- **Tranché : R1.** Ni « environ 11 photos » ni « 8 autres photos » : au lancement, aucune photo de plus au déblocage, aucun emplacement de photo supplémentaire ; la galerie complète vient plus tard (L13-02) et n'est jamais promise. Le contenu débloqué est lu dans le catalogue.
- **Tranché : R2.** L'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts ; les 2 photos s'ajoutent ; une photo en échec après nouvelles tentatives est omise, sans bloquer, avec alerte à l'équipe.
- **Tranché : R13.** Aucun prix ni achat affiché pendant la bêta ; le texte du volet bêta est à faire relire (L0-07).
- **Tranché : R4.** Verrou côté serveur ; ARCHITECTURE.md M3.2 le suit.
- Leviers L5, L6, L7 (contenu, ordre, forme du verrou) : prévoir l'ordre des sections et le libellé du bouton en réglage, tirage par compte côté serveur pour les textes seulement ; le prix ne se teste que par périodes (R8, PARCOURS.md § 7.2).
- **À confirmer** (décision de principe n° 15 du 27/09/2026) : le 360° devient probablement l'offre gratuite. Tant que l'utilisateur ne l'a pas confirmé après la mesure du coût de rendu (L1-16), R1 (vue du dessus, plan 2D, 2 photos) reste la règle de cette page, et aucun texte ne promet le 360°. Le contrôle du point 7 est écrit pour couvrir aussi la visionneuse et les fichiers précalculés (maquette compressée, éclairage) : une page de test qui les charge le fait échouer.

## Références
- OFFRES.md § 2.2, § 2.4, § 0.2 (règle 3) ; PARCOURS.md A9, A10, § 1.5, § 7.2 ; MESSAGES.md § 7.5, § 7.6, § 8.3 ; MARQUE.md § 4.4, § 10.2.
- ARCHITECTURE.md § 5.2, § 5.3, § 6.2 ; SUIVI.md § 3.9, § 7.5 (R6).
- `moteur/SCHEMA.md` (`fiche`, `simple`) ; `moteur/ui.js:400` (bouton `g-cta` de la visite, non utilisé ici).

## Hors périmètre
- Rendu des images (vue du dessus, plan 2D, 2 photos) : L4-09, L5-11. Mention incrustée : L4-07.
- Paiement et déblocage : L8-01, L8-02. Lien d'aperçu pour les proches : L6-08. Panoramas 360° : rendu L4-15 et L5-27, visionneuse L4-16, aperçu en 360° L6-13. Vue du dessus manipulable : L13-03.
