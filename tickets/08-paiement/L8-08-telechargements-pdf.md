# L8-08 · Téléchargements : photos, plan 2D et fiche en PDF

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | M (1 à 3 j) | L8-02, L4-07 | `service/`, `outils/` | À faire |

## Pourquoi
`OFFRES.md` § 2.4 promet des téléchargements (photos avec la mention incrustée et le marquage des métadonnées ; plan 2D et fiche en PDF à imprimer pour la visite cloisons, « PDF à construire ») et `achat.compris` les liste, mais aucun ticket ne les construisait. Ils se produisent sans IA, à partir du `plan.json` déjà contrôlé. **Tranché : R1.** Au lancement, seules les images déjà rendues par le serveur sont disponibles (vue du dessus, plan 2D, 2 photos, ou moins si une photo a été omise), sans galerie complète (L13-02).

## À faire
1. **Contenu**, lu dans la version d'offre (L5-08) : `images` (vue du dessus 3D, 2 photos et image du plan 2D, JPEG marqués par L4-07, pleine définition 1 600 × 1 000, `moteur/photos.mjs:13`) ; `plan_pdf` ; `fiche_pdf` ; `archive` (zip des trois) si retenu.
2. **Gabarit d'impression** `service/impression/` (Jinja2, CSS d'impression, polices Archivo et DM Mono servies par nous, jetons clairs de `moteur/visite.css:1-16`) :
   - **plan 2D coté** : A4 paysage (A3 si le logement ne tient pas), dessin vectoriel, cotes, légende, nord, barre d'échelle graphique, cartouche (titre, typologie, surface). Le SVG est lu dans la visite publiée ouverte par Chrome en mode plan, cotes affichées (`#plan`, produit par `planMarkup` de `moteur/ui.js`) : aucun changement de `moteur/`. **Jamais** la superposition du plan du promoteur ;
   - **fiche** : surfaces par pièce comparées au tableau du promoteur (drapeaux Plan, À vérifier, Hypothèse écrits en toutes lettres), ouvertures, équipements, points à faire confirmer, et une colonne vide « relevé le jour de la visite cloisons ». Même source que la fiche de la visite (`ficheHTML`, `moteur/ui.js:408`) et que la page d'aperçu (L6-05) ;
   - sur chaque page : mentions de `MESSAGES.md` § 8.3 (« Illustration non contractuelle… » et « Seuls les plans et la notice… font foi »), date, pagination ; métadonnées du PDF : titre, producteur, sujet « contenu généré automatiquement » (valeur retenue avec L4-07).
3. **Production par Chromium** (`page.pdf()`) dans l'exécutant de rendu de L5-10 (sans secret ; SwiftShader suffit, il n'y a pas de 3D à calculer), à la publication complète (L8-02), en tâche de basse priorité ; résultat gardé dans l'espace privé `…/publications/<id>/telechargements/`. Script `outils/imprimer.mjs` (nouveau), utilisable aussi en local sur `plans/<id>/`.
4. **Contrôles automatiques bloquants** avant mise à disposition : texte extrait du PDF passé au filtre de L1-04 ; mention présente sur chaque page ; plan non vide (murs dessinés) ; nombre de pages attendu ; aucune URL ; aucune image noire. Un échec bloque la mise à disposition et alerte l'équipe ; la visite reste ouverte.
5. **Mise à disposition depuis l'application** (« Mes plans » de L6-07 et page du plan) : `GET /api/plans/<id>/telechargements/<fichier>` vérifie l'organisation et la publication complète, puis renvoie une URL signée de 5 min avec `Content-Disposition: attachment` et un nom lisible (`plan-2d-<titre>.pdf`), sans identifiant technique. Pas de bouton dans la visite au lancement (il demanderait un diff [M]).
6. **Pros** : même mécanisme pour l'export des photos (`OFFRES.md` § 3.3).

## Critères d'acceptation
- [ ] Sur le témoin, sans IA : plan 2D et fiche produits en PDF ; impression A4 lisible (capture de contrôle approuvée) ; cotes du PDF identiques à celles de `plan.json` (test).
- [ ] Contrôles du point 4 : un PDF de test contenant « undefined » ou sans mention est bloqué.
- [ ] Autre organisation, ou plan non débloqué : 404 ; URL signée expirée : refus.
- [ ] Photos téléchargées : mention incrustée et métadonnée présentes (contrôle de L4-07).
- [ ] Temps de production mesuré dans le conteneur de rendu (objectif indicatif : moins de 30 s).
- [ ] Aucun texte technique, zéro défaut visible ; outil local inchangé ; `moteur/` non modifié.

## Mesure
- `fichier_telecharge` (`fichier` : `photos_hd`, `plan_pdf`, `fiche_pdf`, `archive` ; `cible`), à l'émission de l'URL signée.

## Points d'attention
- **Échelle** : ne jamais promettre un plan « à l'échelle » ni « au centimètre » (`MARQUE.md` § 5.2) ; une imprimante peut réduire la page. Barre d'échelle graphique et phrase « Cotes reprises du plan de vente » ; formulation à faire relire (L0-07).
- **« Photos HD »** (`OFFRES.md` § 2.4) : les images font 1 600 × 1 000 ; la 4K reste une option future (L13-05) ; valeur `photos_hd` du dictionnaire gardée, libellé client à choisir sans surpromesse.
- **Tranché** : L8-07 (ouverture publique, J1) dépend désormais de ce ticket, puisque `achat.compris` liste les téléchargements. Tant qu'il n'est pas en production, ils restent sous le marqueur **[SI LIVRÉ]** et hors du contenu de la version d'offre.
- `PARCOURS.md` A12 place les téléchargements dans la visite : ce serait un diff [M] ; au lancement, ils sont dans l'application.
- `outils/planche.py` (police macOS en dur) n'est pas utilisable dans un conteneur : ne pas le réutiliser.
- Lire la visite publiée dans Chrome dépend de la version du moteur : tester sur chaque nouvelle version (non-régression visuelle, `ARCHITECTURE.md` § 9.5).

## Références
- produit/OFFRES.md § 2.4, § 3.3 ; produit/PARCOURS.md A12 ; produit/MESSAGES.md § 7.7 (`achat.compris`), § 8.3 ; produit/MARQUE.md § 5.2.
- produit/recherche/juridique.md § 5.1, § 5.4 ; produit/SUIVI.md § 3.9 ; produit/ARCHITECTURE.md § 5.1, § 9.5.
- `moteur/ui.js` (`planMarkup`, `ficheHTML` `:408`), `moteur/photos.mjs:13` (taille des images), `moteur/visite.css:1-16` (jetons).

## Hors périmètre
- Galerie complète et photos supplémentaires : L13-02. Mention et marquage des images : L4-07.
- Fiche PDF du lot aux couleurs d'un cabinet (`OFFRES.md` § 3.3) : sans ticket, après L9-06.
