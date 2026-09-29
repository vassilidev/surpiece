# L2-01 · Fondations du site vitrine

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | L (3 à 5 j) | — | `site/`, `outils/` | À faire |

## Pourquoi
Toutes les pages du lot 2 (accueil, pros, tarifs, témoin, méthode, légal) partagent la même direction artistique « architecte new wave », les mêmes composants et les mêmes règles d'accessibilité. Aujourd'hui les jetons sont répartis entre `pipeline/accueil.html` et `moteur/visite.css`, les polices viennent de Google Fonts et il n'y a ni favicon ni règle de mouvement réduit (MARQUE.md § 12). Ce ticket pose un socle unique et statique, sans framework (R19) : des fichiers sources dans un nouveau dossier `site/` et un petit script d'assemblage Python sans dépendance, `outils/site.py`, sans toucher à `pipeline/` ni `moteur/` (travail sur les duplex fini le 27/09/2026, pas encore commité).

## À faire
1. **Arborescence des sources** (proposition ; adresses canoniques de MESSAGES.md, R9) :
   - `site/index.html` (`/`), `site/pro/`, `site/promoteurs/`, `site/marque-blanche/`, `site/tarifs/`, `site/appartement-temoin/`, `site/methode/`, `site/guides/`, pages légales, `site/404.html` ;
   - `site/css/jetons.css`, `site/css/site.css`, `site/js/site.js`, `site/polices/`, `site/marque/` (L2-02), `site/img/` (L2-03), `site/donnees/` ;
   - `site/composants.html` : page de référence de tous les composants, assemblée pour les contrôles mais jamais publiée (R20 : la vitrine publiée est indexable, sans page cachée en `noindex`), qui sert aux captures de contrôle (L2-15).
2. **Un seul fichier de jetons** `site/css/jetons.css` : toutes les variables du tableau MARQUE.md § 6.2 (Papier, Calque, Calque 2, Fond de plan, Encre, Graphite, Trait fin, Bleu plan, Sur bleu, Vert réception, Brique, Ocre soleil, Poché, Hachure, Millimétré, Tireté, Ombre), valeurs claires et sombres exactes, plus `--ui`, `--mono`, `--photo-bg`. Même structure que `moteur/visite.css` l. 1-18 (`:root`, `prefers-color-scheme: dark` sous `:root:not([data-theme="light"])`, `:root[data-theme="dark"]`) pour qu'un alignement ultérieur du moteur soit un simple remplacement.
3. **Polices auto-hébergées** selon MARQUE.md § 11 : `outils/polices.sh` (nouveau) télécharge Archivo variable et DM Mono 400/500 depuis le dépôt de Google Fonts, applique `varLib.instancer` (graisse 400 à 800, chasse 90 à 125) et `pyftsubset` (sous-ensemble latin, commandes du § 11.3), écrit `site/polices/archivo.woff2`, `dm-mono-400.woff2`, `dm-mono-500.woff2` et copie `OFL.txt`. Vérifier la présence d'un « Reserved Font Name » dans `OFL.txt` : s'il existe, renommer la famille des fichiers réduits. `@font-face` du § 11.3, `font-display: swap`, préchargement du seul Archivo sur l'accueil.
4. **Script d'assemblage `outils/site.py`** (R19 ; nouveau, bibliothèque standard de Python seulement, sans framework) : il lit les sources de `site/` et écrit le site assemblé dans un dossier de sortie non versionné (proposé : `public/`), le seul publié. Il injecte :
   - le nom du produit, depuis une seule source, `site/donnees/site.json` (`nom`, `nom_capitales`, `identifiant`, `domaine`, `slogan`, `mode_depot`), dans les éléments marqués `data-var="nom"` : le nom est donc écrit en dur dans le HTML servi (référencement, lecture sans JavaScript) ;
   - les prix et contenus des offres, depuis le catalogue (`site/donnees/offres.json`, L2-08, exporté du catalogue de L5-08 quand il existera) ;
   - les parties communes (étape 5).
   Deux passages sur les mêmes sources donnent une sortie identique, octet pour octet (vérifié en CI par L2-15).
5. **Parties communes** : en-tête (MESSAGES.md § 8.1) et pied de page (§ 8.2) écrits une fois dans `site/_blocs/entete.html` et `pied.html`, insérés par `outils/site.py` à la place des marqueurs `<!-- bloc:entete -->` … `<!-- /bloc:entete -->` de chaque page. Les liens vers des pages pas encore publiées (Tarifs sans prix validés, CGV, « Renoncer au contrat ici », médiateur, Se connecter) sont masqués par une liste de pages visibles dans `site.json`.
6. **Composants** (`site/css/site.css`, `site/js/site.js` sans dépendance) : en-tête avec menu mobile (« Menu · Fermer »), pied, boutons (principal Bleu plan, secondaire au trait Encre 1,5 px, un seul principal par écran), cartouche (MARQUE.md § 6.5), zone de dépôt (tireté 2 px Encre, `label` qui contient l'`input`, comportement laissé à L2-04 et L6-01), FAQ en `details`/`summary` avec `data-question`, formulaires (étiquettes visibles, erreurs liées par `aria-describedby`, résumé en haut, champs de 16 px), cartes, bandeau de prix, bloc « limites » (MESSAGES.md § 8.4), mention non contractuelle (§ 8.3), motif de cote (MARQUE.md § 6.6), papier millimétré (§ 6.7, coupé sous `prefers-contrast: more` et à l'impression), bouton collé en bas sur téléphone (`safe-area-inset-bottom`), icônes SVG au trait de 1,5 px sur grille de 24 px.
7. **Règles transverses** : angles droits partout (cercle réservé aux points fonctionnels), traits 1,5 px, aucune ombre hors panneaux flottants, aucun dégradé ; responsive dès 320 px (aucun défilement horizontal, marges de 16 px) ; `prefers-reduced-motion` (pas de pulsation ni de fondu) ; focus clavier de 2 px en Bleu plan décalé de 2 px ; lien d'évitement ; `lang="fr"` ; texte de 11 px au moins ; cibles tactiles de 40 px.
8. **Contrastes** : `outils/contrastes.py` (nouveau) lit `jetons.css`, recalcule les ratios WCAG 2.x et échoue si une paire du tableau MARQUE.md § 10.1 passe sous son seuil (MARQUE.md § 10.2, règle 8). Réutilisable plus tard pour l'accent des clients (§ 9.3).
9. **Typographie française** : `outils/site.py` pose, à l'assemblage, les espaces insécables (avant « : ; ? », dans « », entre nombre et unité, milliers en espace fine), l'apostrophe typographique et m² (MESSAGES.md § 0.4, MARQUE.md § 5.3), sans toucher aux attributs ni aux URL.

## Critères d'acceptation
- [ ] `site/composants.html` s'affiche sans défilement horizontal dès 320 px, largeur minimale de mise en page (R10), et à 360, 768 et 1280 px (captures jointes) ; tous les composants de l'étape 6 y figurent.
- [ ] `python3 outils/contrastes.py site/css/jetons.css` retrouve les ratios de MARQUE.md § 10.1 (à 0,01 près) et sort en erreur si l'on dégrade une couleur de texte.
- [ ] Ouvert avec le réseau coupé vers l'extérieur, le site assemblé ne fait aucune requête hors de sa propre origine (aucun appel à Google Fonts ni à un CDN).
- [ ] Tous les caractères présents dans les textes de `site/` existent dans les sous-ensembles woff2 (vérification par fonttools, échoue sur un caractère manquant, MARQUE.md § 11.3).
- [ ] Changer `nom` dans `site.json` puis lancer `outils/site.py` remplace le nom partout dans la sortie ; deux passages donnent une sortie identique ; le script ne demande aucune dépendance hors de la bibliothèque standard.
- [ ] Navigation au clavier complète sur `composants.html` (ordre logique, focus visible, Échap ferme le menu) ; mouvement réduit respecté.
- [ ] Aucun fichier de `pipeline/`, `moteur/` ni `plans/` modifié ; l'outil local (`python3 pipeline/serveur.py`) marche toujours.

## Points d'attention
- **Tranché : R19.** Fichiers sources + petit script d'assemblage Python sans dépendance (`outils/site.py`) qui injecte le nom, les prix du catalogue et les parties communes ; pas de framework. Le nom reste dans une seule source et le HTML servi le contient en dur.
- **Thème sombre de la vitrine** : MARQUE.md § 6.1 dit « le marketing se fait en clair », alors que `accueil.html` suit le thème du système. Recommandation : `jetons.css` porte les deux thèmes (pour l'application à venir), la vitrine force le clair. À confirmer par l'utilisateur.
- **Tranché : R10.** Largeur minimale de mise en page : 320 px (WCAG 1.4.10, redistribution ; PARCOURS.md § 1.5). Les contrôles testent aussi 360 px.
- **Tranché : R9.** Adresses canoniques : celles de MESSAGES.md (`/appartement-temoin`, `/marque-blanche`) ; SUIVI.md s'y aligne (son `/demo` et son `/partenaires` disparaissent). Les valeurs de `page_type` du dictionnaire ne sont pas des adresses et restent celles de SUIVI.md.
- `outils/polices.sh` doit servir aussi à L4-06 (polices du moteur) pour que les deux copies restent identiques.
- Le nom n'est pas validé (L0-01) : tout texte reste en `Sur Pièce` via `site.json`, rien n'est publié avant L2-16.
- **Photos d'illustration** : toutes viennent de l'appartement témoin fictif, versionné dans `references/temoin/` (R11), via L2-03.

## Références
- produit/MARQUE.md § 5.3, § 6 (6.2 à 6.10), § 10, § 11, § 12 ; produit/MESSAGES.md § 0.1, § 0.4, § 8.1 à § 8.4 ; produit/PARCOURS.md § 1.5.
- pipeline/accueil.html l. 11-13 (jetons de l'accueil), l. 8-9 (Google Fonts) ; moteur/visite.css l. 1-18 (jetons de la visite) ; moteur/modele.html l. 9-11 (Google Fonts).
- produit/ARCHITECTURE.md § 2.1 (Vitrine, HTML statique), § 8.1 (coordination).

## Hors périmètre
- Logo, favicon, images de partage : L2-02. Visuels du témoin : L2-03. Contenu des pages : L2-04 à L2-11.
- Comportement réel de la zone de dépôt : L2-04 (mode liste d'attente) et L6-01 (dépôt réel).
- Alignement de `moteur/visite.css` et `pipeline/accueil.html` sur `jetons.css` : après le commit du travail sur les niveaux (fini le 27/09/2026), avec L4-06.
- Branchement des contrôles en CI : L2-15.
