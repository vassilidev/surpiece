# L2-02 · Logo, favicon et images de partage

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L0-01 | `site/` | À faire |

## Pourquoi
Le produit n'a ni logo ni favicon (`<link rel="icon" href="data:,">` dans `accueil.html` et `modele.html`). La vitrine, les e-mails, les factures et les réseaux ont besoin d'un mot-symbole vectoriel, d'un symbole lisible à 16 px et d'images de partage. MARQUE.md § 7 décrit précisément le dessin ; ce ticket le produit une fois le nom tranché (L0-01).

## À faire
1. **Mot-symbole en cartouche** (MARQUE.md § 7.1), selon le nom retenu :
   - lettres en capitales, Archivo 800, chasse 125, approche −0,01 em, **vectorisées** (aucune dépendance à une police installée) ;
   - pour Sur Pièce : accent du È redessiné en tiret de cote à 45°, environ 0,3 C de long et 0,08 C d'épaisseur, en Bleu plan, **descendant vers la droite** (tourné dans l'autre sens il se lirait É) ; pour Avant-Clés, adapter l'accent du É (passage marqué [dépend du nom]) ;
   - cadre à angles vifs, trait de C/20, marges C/3 × 0,4 C ; zone de protection 0,5 C ; taille minimale C = 20 px ;
   - déclinaisons : clair (Encre `#161918` + accent `#2C49B8`), sombre (`#E6E9E4` + `#93A8FF`), monochrome Encre, monochrome blanc (sur aplat Bleu plan) ; légende facultative « PLAN · MAQUETTE · VISITE » en DM Mono.
2. **Cartouche étendu** (§ 7.2) pour les en-têtes d'e-mails, factures, fiches et diapositives : gabarit SVG avec la case d'identité et trois lignes.
3. **Symbole « la pièce »** (§ 7.3) sur grille 32 × 32 : murs de 3 px en aplat Encre (carré de 4 à 28), baie de x = 16 à 25 dans le mur du bas, vantail de 2 px de (16 ; 25) à (16 ; 16), arc de rayon 9 centré en (16 ; 25) en Bleu plan 1,5 px. Version 16 px : géométrie divisée par deux, murs de 2 px, vantail et arc de 1 px. Vérifier le sens d'ouverture (règle « pas de porte à l'envers »).
4. **Test des 16 px** : captures du favicon dans un onglet clair et un onglet sombre (Chrome, Safari, Firefox), jointes au ticket. Si le symbole n'est pas lisible, prendre le monogramme de secours « SP » (§ 7.4) et le noter.
5. **Jeu de fichiers** (§ 7.5) dans `site/marque/` : `favicon.svg` (avec `prefers-color-scheme: dark` interne), `favicon.ico` (16 et 32 px, fond Papier), `apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (zone sûre de 80 %), `site.webmanifest`, mot-symbole en SVG et en PNG (1×, 2×) pour les e-mails, avec texte alternatif « Sur Pièce ». Export reproductible par un petit script (rendu du SVG par le Chromium figé de L1-07, `.ico` par Pillow déjà présent dans `requirements.txt`).
6. **Images de partage (Open Graph)** 1200 × 630, et 1080 × 1350 pour les réseaux (MARQUE.md § 6.10) : fond Papier et millimétré, une cote qui dit vrai (mesure réelle du témoin), titre en Archivo 800, mot-symbole en bas à gauche, mention « Appartement témoin fictif · Illustration non contractuelle ». Une image par page publique (accueil, pro, promoteurs, marque blanche, tarifs, témoin, méthode), gabarit HTML rendu en PNG par le même script pour pouvoir les refaire.
7. Brancher les balises dans `site/_blocs/` (L2-01) : `link rel="icon"`, `apple-touch-icon`, `manifest`, `theme-color` ; les balises `og:image` sont posées par L2-13.
8. **Dépôt INPI semi-figuratif du logo**, une fois le dessin vectoriel figé (MARQUE.md § 1.6, point 4) : la marque verbale a été déposée d'abord par L0-01 ; déposant et classes à confirmer avec l'utilisateur. Récépissé et numéro notés dans MARQUE.md § 1.6.

## Critères d'acceptation
- [ ] Le mot-symbole SVG ne contient aucun élément `<text>` ni référence de police ; il s'affiche identique sur une machine sans Archivo installée.
- [ ] L'accent-tiret descend vers la droite (vérifié visuellement et par la géométrie du chemin) ; aucune version ne le montre tourné.
- [ ] Captures du favicon à 16 px dans un onglet clair et un onglet sombre jointes ; décision (symbole ou monogramme) notée dans le ticket et reportée dans MARQUE.md par son propriétaire.
- [ ] Le script d'export régénère tous les PNG, l'`.ico` et les images de partage à l'identique à partir des SVG et gabarits versionnés.
- [ ] Aucune image de partage ne montre autre chose que l'appartement témoin fictif ; chaque cote affichée correspond à une mesure du relevé du témoin.
- [ ] Aucun interdit de MARQUE.md § 7.6 (coins arrondis, ombre, dégradé, étirement, pictogramme de maison ou de clé, « 3D »).
- [ ] Récépissé du dépôt semi-figuratif du logo reçu, sur les fichiers vectoriels figés de ce ticket.

## Points d'attention
- **Tranché** : L0-01 dépose d'abord la marque verbale ; le logo est déposé ici, après son dessin (étape 8), comme le prévoit MARQUE.md § 1.6. Plus de dépendance circulaire.
- **Découpage** : les images de partage « par page » demandent des captures du témoin (MARQUE.md § 6.10), donc L2-03, qui n'est pas une dépendance. Proposition : gabarit et image générique ici ; images par page dès que L2-03 est livré (dans ce ticket s'il l'est déjà, sinon dans L2-03).
- Le choix du symbole comme favicon est aussi listé dans L0-05 (« favicon la pièce ») : le test des 16 px de ce ticket sert de base à cette décision.
- Vectorisation d'Archivo : la licence OFL permet l'usage dans un logo ; garder `OFL.txt` avec les sources (MARQUE.md § 11.2).

## Références
- produit/MARQUE.md § 1.4, § 1.6, § 6.2, § 6.5, § 6.10, § 7 (7.1 à 7.6), § 10.2 (règle 6) ; produit/MESSAGES.md § 8.1.
- pipeline/accueil.html l. 7 et moteur/modele.html l. 7 (`data:,`, pas de favicon).
- produit/recherche/nom.md (choix du nom).

## Hors périmètre
- Dépôt INPI de la marque verbale et réservation des comptes : L0-01.
- Captures et visuels du témoin : L2-03. Balises Open Graph et données structurées : L2-13.
- Logo et favicon des clients en marque blanche : L11-02.
