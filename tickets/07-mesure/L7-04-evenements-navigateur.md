# L7-04 · Événements du site et de l'application

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P0 | M (1 à 3 j) | L7-01, L2-14, L4-06 | `moteur/` [M], `site/`, `service/` | À faire |

## Pourquoi
Les clics sur le verrou, le volet, les onglets ou la démonstration n'atteignent pas le serveur ; ce sont pourtant eux que mesurent les tests T4 et T5 (SUIVI.md § 2.6). Le dictionnaire de SUIVI.md § 3 fixe les noms, les propriétés et les valeurs permises. La vitrine porte déjà ses attributs inertes (L2-14) ; ce ticket branche les événements « N » de l'application et fait émettre la visite. La même visite sert à la démonstration, au propriétaire, aux liens et aux intégrations : **le moteur émet, la page choisit la destination** (§ 2.7), et le moteur ne sait rien des outils de mesure.

## À faire
1. **Dictionnaire complet** dans `mesure/evenements.json` (fichier unique lu par `mesure()`, `avantEnvoi` et `journal.ecrire()`, SUIVI.md § 2.8) : noms, propriétés et valeurs de SUIVI.md § 3, plus les ajouts de PARCOURS.md § 8.1 utiles aux lots 6 et 7 (`page_pdf_changee`, `depot_doublon`, propriété `meme_appareil` de `compte_cree`, valeurs `plusieurs_fichiers`, `heic`, `maison`, `plusieurs_lots`, `peu_lisible`, `mes_plans`, `contact_support`). SUIVI.md est mis à jour **dans le même changement** (contrôle C2).
2. **Application** (pages des lots 6 : dépôt, compte, attente, calibration, aperçu, Mes plans, partage) : brancher les événements « N » des § 3.6, § 3.7, § 3.9, § 3.11 et § 3.15 par `mesure()` ou `mesureUneFois()`. Règle de SUIVI.md § 2.5 : `data-umami-event` seulement sur un lien ou un bouton sans comportement JavaScript propre ; `mesure()` partout ailleurs (zone de dépôt, volets, onglets, sections, défilement). `body[data-page]` porte le `page_type`.
3. **Moteur** : un seul type d'événement, `window.dispatchEvent(new CustomEvent('visite:evenement', { detail: { nom, props } }))`, émis aux endroits suivants de `moteur/ui.js` et `moteur/engine.js` :
   - premier rendu (`visite_chargee`, avec la classe de chargement ; la page le renomme `demo_ouverte` en démonstration) ;
   - changement de mode (`visite_mode_choisi`, une fois par mode et par ouverture : `plan` → `plan_2d`, `orbit` → `maquette`, `walk` → `visite`, avec `rang`) ;
   - entrée dans une pièce en visite ou clic sur sa puce (`visite_piece_vue`, identifiant de pièce seulement ; une fois par pièce) ;
   - photo ouverte en grand (`visite_photo_ouverte`), plein écran (`visite_plein_ecran`) ;
   - départ (`visite_quittee` sur `pagehide`, durée en classe, nombre de modes vus) ;
   - échec d'affichage (`visite_chargement_echoue` : `webgl_absent`, `contexte_perdu`, `delai`, `fichier`).
4. **Adaptateur de page** (dans l'`index.html` produit à la publication, L5-12, et dans la page de démonstration, L2-09) : ajoute `contexte`, remplace l'identifiant de pièce par sa **catégorie** (`sejour`, `cuisine`, `chambre`, `salle_de_bain`, `wc`, `entree`, `degagement`, `rangement`, `loggia`, `balcon`, `terrasse`, `autre`), déduite du nom de la pièce par une table fermée, jamais le nom ni l'identifiant ; puis choisit la destination :
   - démonstration, vue propriétaire → `mesure()` (Umami anonyme) ;
   - tout lien `/v/`, intégration, prospect → **rien** (les destinations `postMessage` et suivi consenti des prospects sont faites par L10-04 et L9-04).
5. **Erreurs visibles** : `erreur_affichee` avec la clé du catalogue, jamais le texte (SUIVI.md § 3.15).
6. **Contrôles** C1 (nom trouvé dans le code = motif, 50 caractères, présent au dictionnaire), C2 (dictionnaire et tableaux de SUIVI.md identiques), C3 (valeurs hors liste refusées en test) branchés en CI.

## Critères d'acceptation
- [ ] C1, C2 et C3 verts en CI ; un nom hors dictionnaire ajouté dans une page fait échouer la CI.
- [ ] Scénarios R2, R3, R6 et R13 de SUIVI.md § 7.5 joués par L7-07 sur le témoin fictif (aucune lecture payante) : chaque événement attendu arrive une fois, avec des valeurs permises.
- [ ] Sur `/v/<jeton>`, l'adaptateur n'émet rien (zéro requête vers le domaine de mesure, C6).
- [ ] Aucune propriété ne contient un nom de pièce, un identifiant, un titre de plan ou un texte libre (C5).
- [ ] **Critère de fusion `[M]`** (ARCHITECTURE.md § 8.1) : rejeu sans IA des références (L1-02) avec `plan.json` et images identiques, visite de contrôle réussie, contrôle des textes réussi, test de fumée de l'outil local réussi. Sans écouteur, l'émission ne change rien à la visite.
- [ ] Le moteur modifié est publié comme nouvelle version (`moteur/v<N+1>/`, L4-06) ; les visites déjà publiées restent sur leur version.

## Mesure
- N (moteur) : `demo_ouverte`, `visite_chargee`, `visite_mode_choisi`, `visite_piece_vue`, `visite_photo_ouverte`, `visite_plein_ecran`, `visite_quittee`, `visite_chargement_echoue`.
- N (application) : `depot_fichier_choisi`, `depot_fichier_refuse`, `depot_envoi_termine`, `depot_envoi_echoue`, `inscription_ouverte`, `inscription_methode_choisie`, `verrou_clique`, `volet_deblocage_ouvert`, `offre_choisie`, `partage_canal_choisi`, `section_vue`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye`, `erreur_affichee`, `cta_depot_clique`, `cta_demo_clique`.

## Points d'attention
- **Ticket `[M]`** : un autre agent modifie `moteur/ui.js` et `moteur/engine.js` (duplex). Diff petit et isolé (quelques appels d'une fonction `emettre(nom, props)`), sur une branche courte, après accord avec cet agent ; aucun changement de rendu.
- `visite_quittee` part à la fermeture de la page : s'il n'arrive pas de façon fiable en recette (R2), le retirer du dictionnaire (SUIVI.md § 3.5).
- Avec plusieurs niveaux, une pièce peut exister sur deux niveaux : la catégorie suffit, le niveau n'est pas transmis.
- À vérifier sur la version installée d'Umami : un élément marqué par `data-umami-event` bloque-t-il ses autres écouteurs (SUIVI.md § 2.5) ?
- Émission côté moteur écrite par ce ticket, contrairement à SUIVI.md § 2.7 qui la laissait « à l'agent qui travaille sur `moteur/` » : c'est la même règle, appliquée par un diff coordonné.

## Références
- SUIVI.md § 2.5, § 2.6, § 2.7, § 2.8, § 3 (tous les tableaux), § 7.1, § 7.4 (C1 à C6), § 7.5 ; PARCOURS.md § 8.1.
- ARCHITECTURE.md § 5.5 (moteur versionné), § 8.1 ; `moteur/ui.js:460` (`App.set`), `:815` (`leaveGallery`), `:719` (puces des pièces) ; `moteur/engine.js:1668` (`window.__v`) ; `moteur/SCHEMA.md` (`rooms`).

## Hors périmètre
- Installation d'Umami et filtre : L7-01. Recette automatique : L7-07.
- Événements serveur (journal) : L5-15 et les tickets qui écrivent les faits. `postMessage` des intégrations : L10-04. Suivi consenti des prospects : L9-04.
