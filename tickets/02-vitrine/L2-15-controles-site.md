# L2-15 · Contrôles automatiques du site

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L0-08, L1-07, L2-04 | `outils/` | À faire |

## Pourquoi
Règle du projet : zéro défaut visible, et tout défaut trouvé devient un contrôle automatique. Sur la vitrine, les défauts qui coûtent cher sont une promesse interdite (« au centimètre », « garanti »), un prix non validé, un plan de promoteur montré, un texte technique, une page cassée sur téléphone ou un lien mort. Ce ticket les rend impossibles à publier : un script bloque la fusion et la mise en ligne (L2-16 en dépend).

## À faire
1. **Script** `outils/site_controles.mjs` (puppeteer figé par L1-07) :
   - assemble le site par `outils/site.py` (R19) et sert la sortie assemblée sur **127.0.0.1** seulement, jamais la racine du dépôt (leçon de L1-01) ;
   - parcourt toutes les pages visibles de `site.json` (plus `composants.html`), à 320 px (largeur minimale, R10), 360, 768 et 1280 px de large.
2. **Contrôles, chacun avec un message clair et la page fautive** :
   1. **Débordement horizontal** : `scrollWidth` > largeur de la fenêtre à 320 et 360 px.
   2. **Liens** : chaque lien et ancre internes répondent (code 200, cible présente) ; liens externes vérifiés à part, chaque semaine, sans bloquer.
   3. **Images** : attribut `alt` présent partout (vide seulement pour une image décorative), dimensions déclarées, aucune image hors de `site/img/`, `site/marque/` ou `site/appartement-temoin/`, chaque image du témoin listée dans le manifeste de L2-03.
   4. **Poids** : total transféré par page sous le budget (accueil 500 Ko hors vidéo, autres pages 300 Ko, page du témoin à part).
   5. **Requêtes** : aucune requête hors de l'origine de la vitrine (sauf liste blanche : Turnstile si retenu, point de réception de L2-12).
   6. **Contrastes** : `outils/contrastes.py` (L2-01) sur `jetons.css`, plus la règle `color-contrast` d'axe-core sur chaque page rendue.
   7. **Textes interdits** dans le texte visible, les attributs `alt`, `title`, `aria-label` et les balises `meta` : vocabulaire banni de MARQUE.md § 5.2 (IA dans l'interface hors pages d'information due, JSON, rendu, serveur, révolutionnaire, immersif, expérience, solution, plateforme, découvrez, vivez, comme si vous y étiez, conforme, exact, certifié, garanti hors « garantie légale de conformité », au centimètre, photoréaliste, bientôt, tous types de plans, triplex tant qu'aucun triplex réel n'est validé, et l'ancienne limite « un seul niveau », selon MARQUE.md § 3.4 ; « duplex » est permis) ; graphies fautives du nom (SurPiece, Surpièce, SUR PIECE) ; motifs techniques de `outils/textes.mjs` (L1-04) ; marqueurs de MESSAGES.md non traités (`[À VALIDER`, `[SI LIVRÉ`, `[À MESURER]`, `[À CONFIRMER`, `[Prix`, `[dépend du nom]`, `‹délai›`) et `{variable}` non remplie ; délai écrit en dur (« quart d'heure », « minutes » près de « visite » ou « plan », R12) ; nombre de photos promis (« 11 photos », « environ 11 », « 8 autres photos », R1) ; noms de promoteurs et de programmes réels.
   8. **Prix** : tout montant suivi de « € » provient d'une offre `valide: true` de `offres.json` ou d'une source citée (prix FPI) ; sinon échec. Tant que l'achat n'est pas ouvert (lot 8), aucun prix aux particuliers (R13).
   9. **Conditions** : aucun élément `data-si` visible dont la condition est fausse dans `site.json`.
   10. **Marquage** : `data-page` sur chaque `body` ; contrôle C1 de SUIVI.md § 7.4 sur `data-umami-event` et `mesure(` ; chaque bouton principal marqué.
   11. **Assemblage reproductible** : deux passages d'`outils/site.py` sur les mêmes sources donnent une sortie identique ; aucune dépendance hors de la bibliothèque standard de Python (R19).
   12. **Balises** : contrôle de L2-13 (title, description, un seul `h1`, canonique, aucun `noindex` sur les pages de la vitrine, R20).
   13. **Polices** : tous les caractères des textes existent dans les sous-ensembles woff2.
3. **Captures** de chaque page aux quatre largeurs, gardées comme artefacts pour la revue humaine.
4. **CI** : tâche lancée à chaque demande de fusion qui touche `site/`, `mesure/`, `outils/site.py` ou `outils/site_*` ; bloquante ; aucun secret, aucun appel payant, aucun plan réel.
5. **Liste privée des noms de promoteurs** : lue depuis un fichier hors dépôt ou une variable secrète de la CI, jamais versionnée ; le contrôle est ignoré avec un avertissement si la liste manque en local.
6. `outils/README.md` : comment ajouter un motif quand un défaut est trouvé.

## Critères d'acceptation
- [ ] Chaque contrôle a un test négatif : une page piégée (texte « au centimètre », prix non validé, image sans `alt`, lien mort, bloc `data-si` visible, débordement à 320 px, requête vers Google Fonts, `{prenom}`) fait échouer le script avec un message qui nomme la page et l'élément.
- [ ] Sur le site du lot 2, le script passe en moins de 3 minutes en CI.
- [ ] La CI bloque la fusion en cas d'échec ; aucun secret n'apparaît dans les journaux.
- [ ] Aucun fichier de `plans/` ni plan réel utilisé ; aucune lecture payante.

## Points d'attention
- **Tranché** : L0-08 (dépôt et CI) et L1-07 (puppeteer figé) sont des dépendances déclarées.
- **Liste des promoteurs** : la versionner révélerait quels plans nous avons testés ; elle reste privée.
- **Plusieurs niveaux** : la liste des mots bloqués suit les formats acceptés en service (`niveaux_max`, L4-08 ; MARQUE.md § 3.4) : « duplex » permis, « triplex » et « un seul niveau » bloqués ; « tous types de plans » reste bloqué dans tous les cas.
- Faux positifs : « expérience » peut apparaître dans une citation autorisée ; toute exception est déclarée dans une liste versionnée avec sa raison, jamais silencieuse.

## Références
- produit/MARQUE.md § 1.4, § 5.2, § 8.4, § 10.2 (règle 8), § 11.3 ; produit/MESSAGES.md § 0.2, § 0.4, § 7 (contrôle automatique à ajouter) ; produit/SUIVI.md § 7.4 (C1, C2, C5).
- produit/ARCHITECTURE.md § 9.5 (tests), § 8.1 ; CLAUDE.md (consignes zéro défaut, textes techniques).
- moteur/photos.mjs (serveur statique ouvert à corriger par L1-01, à ne pas reproduire).

## Hors périmètre
- Contrôle des textes de la visite et de la chaîne : L1-04. CI de la chaîne sans IA : L1-11.
- Recette complète de la mesure (R1 à R16) : L7-07.
