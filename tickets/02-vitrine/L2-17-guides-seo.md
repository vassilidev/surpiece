# L2-17 · Guides de référencement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P2 | L (3 à 5 j) | L2-16 | `site/` | À faire |

## Pourquoi
L'acquéreur ne cherche pas « une visite virtuelle » : il cherche à transformer son plan en 3D et à se rassurer sur son contrat (« vefa rétractation », « visite cloison que vérifier », « coût tma vefa », « achat sur plan piège à éviter », marche.md § 3.2). Des guides neutres et sourcés captent ces recherches aux moments clés de l'achat et mènent vers « Importer mon plan », sans jamais donner de conseil juridique.

## À faire
1. **Liste et cadrage** (MESSAGES.md § 11, title, description et H1 donnés) :
   - `/guides/retractation-vefa` : « Rétractation en VEFA : vos 10 jours pour décider » ;
   - `/guides/visite-cloisons-vefa` : « Visite cloisons : que vérifier, pièce par pièce » ;
   - `/guides/tma-vefa` : « Choisir ses TMA en voyant son logement d'abord » ;
   - `/guides/achat-sur-plan` : « Acheter sur plan : les points à vérifier » ;
   - cinquième guide selon la décision du point 2 des Points d'attention.
2. **Plan type de chaque guide** (MESSAGES.md § 11) : réponse courte en 3 phrases ; faits sourcés (Légifrance, service-public.fr, ANIL), avec lien et date de consultation ; ce que vous pouvez préparer ; où intervient Sur Pièce, en une section, sans pression ; pour aller plus loin (notaire, ADIL du département) ; bouton **Importer mon plan** (suit `mode_depot`).
3. **Rédaction, un guide à la fois** : neutralité stricte (ni acheter, ni annuler, ni se rétracter, MARQUE.md § 4.1) ; aucun chiffre sans source ; guide TMA sans aucun coût cité (ce qui fait varier le prix, renvoi au devis du promoteur) ; guide rétractation après relecture complète de l'article L271-1 du Code de la construction et de l'habitation ; aucun concurrent nommé.
4. **Relecture par l'avocat** de tout contenu juridique avant publication (date et version consignées).
5. **Mise en page** : gabarit « guide » de L2-01 (sommaire ancré, 62 à 75 caractères par ligne, pas de millimétré sous le texte), visuel du témoin et, pour la visite cloisons, un exemple de tableau des cotes et surfaces tiré du relevé du témoin (une cote dit vrai) ; date de mise à jour visible.
6. **Référencement** : balises de MESSAGES.md § 11 (reprises par L2-13), `BreadcrumbList`, liens internes depuis l'accueil (§ 1.7, cartes « Quand s'en servir ») et le pied (§ 8.2, colonne Guides), plan du site.
7. Accroches de mesure : `data-page="guide"`, `data-section` ; attributs selon L2-14.

## Critères d'acceptation
- [ ] Chaque affirmation factuelle a une source officielle liée ; relecture juridique consignée pour chaque guide.
- [ ] Aucun conseil de décision ; renvoi au notaire ou à l'ADIL présent dans chaque guide.
- [ ] Contrôle L2-15 réussi (vocabulaire, textes techniques, prix, liens, 320 px, R10) ; balises de L2-13 conformes, sans `noindex` (R20).
- [ ] Aucune image autre que le témoin fictif ; aucun plan réel ni visite réelle.

## Mesure
Posées selon L2-14 : page vue, `cta_depot_clique` (`emplacement` = `guide`, `page_type` = `guide`), `cta_demo_clique`, `section_vue`, `page_defilee`.

## Points d'attention
- **Contradiction de liste** : le résumé du backlog cite « lire un plan de vente » comme cinquième guide ; MESSAGES.md § 11 prévoit « Transformer un plan 2D en 3D : trois façons de faire » (mot-clé principal de l'accueil), et le pied de page § 8.2 n'en liste que quatre. À trancher par l'utilisateur ; MESSAGES.md à aligner ensuite.
- **Tranché : R20.** La vitrine, guides compris, est indexable dès sa mise en ligne (L2-16, une fois le nom déposé) : chaque guide est indexé dès sa publication, sans attendre l'ouverture publique (L8-07).
- **Taille** : cinq guides avec relecture juridique dépassent facilement 5 jours ; découper en un ticket par guide si besoin, en commençant par la rétractation (hypothèse T11 : ce moment convertit le mieux).
- Les options futures (meublé, TMA dans l'outil) ne sont jamais évoquées comme disponibles ; les plans à plusieurs niveaux, seulement pour le duplex (MARQUE.md § 3.4).

## Références
- produit/MESSAGES.md § 0.6, § 1.7, § 8.2, § 11 ; produit/MARQUE.md § 4.1, § 5 ; produit/OFFRES.md § 9.2 (T11).
- produit/recherche/marche.md § 3.1, § 3.2, § 5.5 (point 1) ; produit/recherche/juridique.md § 5.2.

## Hors périmètre
- Référencement technique : L2-13. Campagnes publicitaires vers les guides : L12-04. Tests A/B : L12-05.
