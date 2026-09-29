# L1-11 · Non-régression en CI : chaîne sans IA du témoin et images approuvées

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L0-08, L1-02, L1-04, L1-07, L1-09, L1-12 | `outils/` | À faire |

## Pourquoi
Le rejeu des plans réels (L1-02) ne tourne que sur le poste de l'équipe, car ces plans ne doivent jamais quitter le poste. Il faut en plus un garde-fou automatique à chaque demande de fusion, qui ne dépend ni de la discipline de chacun ni d'un plan de promoteur : la chaîne complète sans IA sur le témoin fictif, en SwiftShader dans un conteneur Linux (décision 4 : c'est le rendu de base), avec comparaison aux images approuvées. Il protège aussi les visites déjà livrées contre une mise à jour de Chrome ou de three.js (OFFRES.md § 10, risque 10).

## À faire
1. **Environnement de CI** (fournisseur ouvert par L0-08, GitHub Actions ou équivalent) : un conteneur Linux construit depuis les verrous de L1-07 (`requirements.lock`, `package-lock.json`, Chrome for Testing figé), avec les polices nécessaires. Écrire le fichier de construction de sorte que l'image Docker de l'outil (L3-01) puisse le reprendre, pour ne pas maintenir deux bases.
2. **Aucun secret ni appel payant** : la CI n'a **aucune** clé d'IA ; lancer Python avec les clés vidées et `HTTPS_PROXY` vers un port fermé (comme L1-02) ; vérifier que `appels-ia.json` du témoin n'a pas grandi.
3. **Étapes, à chaque demande de fusion** :
   1. tests unitaires existants (serveur statique L1-01, champ ZDR L1-08, motifs de L1-04) ;
   2. copie de `references/temoin/` vers `plans/temoin/` puis rejeu sans IA du témoin (`outils/rejouer_references.sh` de L1-02 pointé sur le témoin, ou `outils/finalise.sh temoin` sans les photos) ;
   3. `python3 pipeline/evaluer.py plans/temoin/plan.json references/temoin/plan.json` : au moins égal à la ligne de base du témoin (chiffres notés par L1-12) ;
   4. visite de contrôle en `RENDU_CHROME=swiftshader` : `ok: true`, nom du moteur « SwiftShader » dans `controle.json` ;
   5. contrôle des textes (`outils/textes.mjs`, L1-04) sur la visite et sur la page de dépôt ;
   6. 3 vues fixes (maquette, vue du dessus découpée, plan 2D) comparées aux images approuvées par `outils/ecart_images.py` : écart moyen au plus 2/255, au plus 0,05 % des pixels au-delà de 16/255 ; texture noire et contexte WebGL absent détectés (L1-09) ;
   7. test de fumée de l'outil local (`outils/fumee.sh`, L1-02) sur le PDF du témoin avec `PLAN_MOCK=references/temoin/plan.json`, si sa durée le permet (voir Points d'attention).
4. **Images approuvées** versionnées dans `references/temoin/images-approuvees/` (témoin fictif : autorisé), avec la version de Chrome, de three.js et le moteur de rendu dans un petit fichier d'accompagnement. Une nouvelle image s'approuve **explicitement** : script `outils/approuver_images.sh` qui copie les rendus de la CI (téléchargés comme artefacts) et exige un message de validation ; jamais de mise à jour automatique.
5. **Artefacts en cas d'échec** : images rendues, carte des écarts, `controle.json`, sortie de `textes.mjs`, pour relire sans relancer.
6. **Déclencheurs** : chaque demande de fusion ; chaque changement des verrous (Chrome, puppeteer, three.js dans `moteur/modele.html`) ; une exécution hebdomadaire programmée pour repérer une dérive d'un service extérieur (jsdelivr, polices) tant que L4-06 n'est pas livré.
7. **Branche principale protégée** : la CI est obligatoire pour fusionner (réglage de L0-08).

## Critères d'acceptation
- [ ] Une demande de fusion sans changement passe au vert ; durée totale notée (objectif : moins de 20 min).
- [ ] Quatre régressions provoquées sur des branches d'essai font échouer la CI : une fente remise dans une menuiserie (contrôle `etancheite`, test d'immersion), et une porte retournée dans `murs.py` ou le complément (écart `evaluer.py` ou contrôle), un texte technique réintroduit dans `ui.js` (contrôle des textes), un changement de rendu (écart d'image, par exemple exposition modifiée).
- [ ] Une texture noire provoquée et un Chrome lancé sans WebGL font échouer la CI avec un message clair.
- [ ] Aucune clé d'IA dans la configuration de la CI ; aucune ligne ajoutée à `appels-ia.json` ; aucun plan de promoteur dans le dépôt ni dans les artefacts.
- [ ] La procédure d'approbation d'une nouvelle image est documentée et testée une fois.
- [ ] Tout défaut trouvé par la CI ou à la main sur le témoin devient un contrôle de la CI.

## Points d'attention
- **Durée** : en SwiftShader, 11 photos prennent 684 s sur un Mac M3, sans doute bien plus sur un exécuteur de CI à 2 ou 4 vCPU. Le test de fumée de l'outil local fait toute la galerie (`photos` dans `pipeline/serveur.py`) : s'il dépasse le budget de temps, le passer en exécution nocturne, ou attendre que `photos.mjs` reçoive la liste des vues (L4-09) ; ne pas modifier la chaîne pour la CI dans ce ticket.
- **Images de référence et polices** : ARCHITECTURE.md § 9.5 prévoit des références « rendu Metal ». Le plan 2D est un SVG avec du texte : l'anticrénelage des polices diffère entre macOS et Linux et peut dépasser 0,05 % de pixels. Proposition : approuver les références depuis le rendu Linux de la CI, et garder la comparaison Metal ↔ SwiftShader sur le poste (L1-09). À valider ; c'est un écart avec § 9.5.
- **Réseau** : tant que three.js et les polices viennent de jsdelivr et Google Fonts (jusqu'à L4-06), la CI dépend d'eux ; une panne extérieure fait échouer la CI sans régression de notre code.
- **Découpage** : L1-02 (scripts de rejeu, `ecart_images.py`, `fumee.sh`) n'est pas une dépendance déclarée ; il est couvert par L1-12, qui en dépend. Le conteneur de CI recoupe l'image de L3-01 et la CI de L5-01 : les faire partir de la même base.
- Les 4 plans réels restent hors CI : rejeu local (L1-02), puis nocturne en préproduction (L5-18).
- **Plusieurs niveaux** : la seule référence à deux niveaux est une duplex de promoteur, qui ne va jamais en CI. Les contrôles des niveaux ne tournent donc qu'au rejeu local (L1-02), tant qu'aucun témoin fictif à deux niveaux n'existe (à décider). La visite de contrôle s'est allongée le 27/09/2026 (test d'immersion) : durée à mesurer sur l'exécuteur.

## Références
- `produit/ARCHITECTURE.md` § 8.1, § 9.2 (CI), § 9.5 (chaîne sans IA, non-régression visuelle, fumée, jeux privés hors CI)
- `produit/recherche/audit-code.md` A13
- `produit/recherche/hebergement.md` § 2.1, § 2.2 (contrôle d'équivalence visuelle)
- `produit/OFFRES.md` § 10 (risque 10)
- `produit/SUIVI.md` § 7.6 (tester sans payer)
- `outils/finalise.sh` ; `outils/vues.mjs` ; `pipeline/evaluer.py` ; `moteur/controle.mjs` ; `moteur/modele.html` (importmap three.js)

## Hors périmètre
- Scripts de rejeu et d'écart d'image : L1-02 ; module Chrome : L1-09 ; contrôle des textes : L1-04.
- Données du témoin : L1-03, L1-12.
- CI du service (images web, worker, rendu) : L5-01 ; rejeu nocturne des références privées : L5-18.
- three.js et polices servis par nous : L4-06.
