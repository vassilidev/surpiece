# L2-03 · Visuels de l'appartement témoin

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L1-12 | `site/`, `outils/` | À faire |

## Pourquoi
Toute image publique doit montrer l'appartement témoin fictif, et lui seul : jamais un plan de promoteur réel, même flouté (MARQUE.md § 8.2 et § 8.4, CLAUDE.md). Les captures doivent sortir de la vraie chaîne, sans retouche, pour que « ce que montre la publicité soit ce que produit le service ». Une fois le témoin relevé et rejouable (L1-12), ce ticket produit tous les visuels dont les pages ont besoin, de façon reproductible.

## À faire
1. **Préparer le rendu du témoin** : copier `references/temoin/` dans `plans/temoin/`, lancer `outils/finalise.sh temoin` (réassemblage depuis `reponse-ia.json`, aucune lecture payante), puis `node moteur/controle.mjs plans/temoin` : la visite de contrôle doit réussir avant toute capture.
2. **Captures fixes** avec `outils/vues.mjs` (maquette par défaut, vue du dessus coupée, plan 2D) et `moteur/photos.mjs` (photos), dans la **même pile de rendu que la production** : `RENDU_CHROME=swiftshader` (L1-09), ou Metal si l'écart aux images SwiftShader est vérifié sous 2/255.
   - vue du dessus 3D découpée, plan 2D coté (cotes affichées), les 2 photos retenues pour l'aperçu (séjour, puis chambre principale ou à défaut la pièce principale suivante, R1 et L4-09), une vue de la visite à hauteur d'yeux (séjour vers la loggia, visuel du premier écran, MESSAGES.md § 1.1), trois vignettes (séjour, chambre, loggia, § 1.3).
3. **Courte vidéo ou GIF de la marche** (10 à 20 s) : parcours guidé entrée → séjour → loggia, enregistré par puppeteer (capture d'écran vidéo ou suite d'images assemblées par ffmpeg), sans interface technique ; formats WebM ou MP4 muets, en lecture automatique seulement si `prefers-reduced-motion` ne l'interdit pas, avec une image fixe de repli.
4. **Axonométrie au trait** (MARQUE.md § 8.1) : axonométrie militaire (plan tourné à 30°/60°), coupe à 1 m, poché des murs coupés, traits 1,5 / 1 / 0,75 px, un seul élément en Bleu plan (parcours ou une cote), sans mobilier. Recommandation : générée en SVG à partir du `plan.json` du témoin par `outils/axonometrie.py` (reproductible quand le témoin change) ; à défaut, dessinée à la main à partir du relevé.
5. **Déclinaisons par page** : recadrages et tailles pour l'accueil (premier écran, démonstration, étapes), pros (conseillers, promoteurs, marque blanche), tarifs, méthode, témoin, images de partage (1200 × 630 et 1080 × 1350, gabarit de L2-02). Formats WebP ou AVIF avec repli JPEG, `srcset`, dimensions déclarées (pas de décalage de mise en page).
6. **Mention** « Appartement témoin fictif · Illustration non contractuelle » (MESSAGES.md § 8.3) : en légende HTML sur le site ; incrustée seulement sur les images destinées aux réseaux et aux présentations (DM Mono 500, au moins 1/60 de la hauteur, en bas à gauche, Graphite sur Calque, jamais rognée, MARQUE.md § 8.3).
7. **Manifeste** `site/img/temoin/manifeste.json` : pour chaque fichier, la source (vue, script, paramètres), la date, le commit du moteur et de la chaîne, la pile de rendu. Un script `outils/visuels_temoin.sh` refait tout le jeu à partir du témoin (règle : refaire les captures quand le rendu change).
8. Copier dans `site/appartement-temoin/` le PDF du plan fictif (bouton « Voir le plan de départ », MESSAGES.md § 6.1).

## Critères d'acceptation
- [ ] `outils/visuels_temoin.sh` régénère l'ensemble des visuels sans aucun appel payant (clés vidées, comme `finalise.sh`) et sans fichier de `plans/` autre que `plans/temoin/`.
- [ ] Visite de contrôle du témoin réussie avant capture ; aucune texture noire, aucune fente, aucun objet flottant, aucune porte à l'envers sur les images (revue visuelle signée dans le ticket) ; tout défaut trouvé devient un contrôle automatique (ticket ouvert contre la chaîne, pas corrigé dans l'image).
- [ ] Captures non retouchées : seuls recadrage et redimensionnement ; le manifeste le prouve (paramètres de chaque image).
- [ ] Aucun texte technique visible sur les images (interface masquée comme dans `vues.mjs`) ; contrôle `outils/textes.mjs` (L1-04) passé sur le témoin.
- [ ] Chaque cote visible sur un visuel correspond au relevé du témoin (MARQUE.md § 6.6 : « une cote dit vrai »).
- [ ] Poids : visuel du premier écran sous 150 Ko en WebP à 1280 px de large ; vidéo sous 1,5 Mo.

## Points d'attention
- **Tranché : R1.** Au lancement, la visite débloquée comprend la visite dans le navigateur (marche libre, arrêts par pièce, maquette, plan 2D interactif, fiche, partage) et les mêmes images que l'aperçu (vue du dessus, plan 2D, 2 photos) ; la galerie complète vient plus tard (L13-02) et n'est jamais promise. Les visuels ne suggèrent aucun nombre de photos : seules les 2 photos du lancement sont montrées comme « photos » ; les autres vues rendues restent hors vitrine jusqu'à L13-02. Mode 360° (décision 15) : quand il existe, un panorama par arrêt du témoin, rendu par le même outil que le service (L4-15), peut servir aux pages (L2-04, L2-09) ; pas avant, et rien n'est annoncé avant d'être livré.
- **Sécurité** : `photos.mjs` et `controle.mjs` servent toute la racine du dépôt, `.env` compris, sur toutes les interfaces (`photos.mjs`, serveur statique en tête de fichier, `.listen(0)`). Ne lancer les captures qu'après la fusion de L1-01, ou hors de tout réseau partagé.
- **Tranché : R11.** Le témoin vit dans `references/temoin/`, versionné (L1-03, L1-12) ; MARQUE.md § 8.2 est aligné (l'ancienne proposition `produit/temoin/` est abandonnée).
- **Coordination avec le travail sur les niveaux** : `outils/vues.mjs` et `moteur/photos.mjs` le portent (fini le 27/09/2026, non commité). Capturer à partir du commit qui l'intègre et noter ce commit dans le manifeste ; ne modifier aucun de ces fichiers ici.
- **Taille** : axonométrie générée + vidéo + déclinaisons peuvent dépasser 3 jours. Si c'est le cas, sortir l'axonométrie dans un ticket à part.
- Surface : remplacer partout « environ 65 m² » par la surface réelle du témoin (MESSAGES.md § 1.3, § 6).

## Références
- produit/MARQUE.md § 6.6, § 6.10, § 8.1 à § 8.4 ; produit/MESSAGES.md § 0.4 (Visuels), § 1.1, § 1.3, § 6, § 8.3.
- outils/vues.mjs (maquette, dessus coupée, plan) ; moteur/photos.mjs (photos, serveur statique en tête) ; outils/finalise.sh ; outils/marche.mjs.
- produit/ARCHITECTURE.md D6 (visuels exclusivement du témoin) ; produit/recherche/hebergement.md § 2.1 (écart SwiftShader et Metal).

## Hors périmètre
- Dessin du plan de vente fictif et relevé : L1-03, L1-12.
- Page jouable du témoin : L2-09. Images de partage (gabarit) : L2-02.
- Visuels d'un deuxième témoin (T2 d'environ 44 m²) : plus tard, quand la chaîne est validée dessus.
