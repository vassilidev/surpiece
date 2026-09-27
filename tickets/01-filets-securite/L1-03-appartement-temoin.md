# L1-03 · Dessiner le plan de vente du témoin fictif

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | — | `outils/` | À faire |

## Pourquoi
Les plans des promoteurs ne sont jamais versionnés ni publiés sans accord (CLAUDE.md). Il faut donc **notre propre** plan de vente pour la CI (L1-11), la démonstration sur le site (L2-09), les visuels (L2-03), la prise en main pro (L9-03) et les entretiens (L2-18). Ce ticket dessine le PDF ; le relevé, la lecture gardée et la vérification sont dans L1-12 (découpage : l'ensemble dépassait 5 jours).

## À faire
1. **Programme du logement** (proposition, à valider avec l'utilisateur) : T3 d'environ 65 m² habitables, un seul niveau, avec loggia (MARQUE.md § 8.2 ; 65 m², surface moyenne d'un 3 pièces neuf). Exemple : entrée 5,0 m², séjour-cuisine 27,5 m², chambre 1 12,0 m², chambre 2 10,5 m², salle de bains 4,8 m², WC séparé 1,6 m², dégagement 2,4 m², placards 1,2 m² (total 65,0 m²) ; loggia d'environ 7 m² en annexe. Seulement des cas que la chaîne couvre déjà (murs droits, portes battantes, porte-fenêtre sur la loggia, une gaine, baignoire ou douche, cuisine ouverte) : pas de duplex, pas de façade en biais au premier témoin.
2. **Dessin original** : concevoir la distribution nous-mêmes. **Ne jamais décalquer ni adapter** un des plans réels du dépôt (un plan d'architecture est une œuvre protégée, `recherche/juridique.md` § 4.1 ; adapter est déjà une contrefaçon).
3. **Source unique de la géométrie**, versionnée : `references/temoin/temoin.json` (murs, épaisseurs, ouvertures avec charnière et sens, pièces avec nom et surface, équipements avec type, position et orientation, gaine, loggia), en mètres. Elle sert à dessiner le PDF et aidera le relevé de L1-12.
4. **Générateur reproductible** `outils/temoin_pdf.py` (nouveau), avec pymupdf (déjà une dépendance), qui écrit `references/temoin/temoin.pdf`, PDF **vectoriel** au style des plans de vente :
   - murs en aplats noirs (polygones pleins, comme ceux que lit `extract.py`), cloisons plus fines ;
   - portes avec vantail et arc, fenêtres et porte-fenêtre dans l'épaisseur du mur ;
   - cotes intérieures en centimètres (« 412 ») ou en mètres (« 4,12 ») avec leurs lignes de cote, que `parse_dim` (`pipeline/extract.py`) sait lire ;
   - échelle graphique et mention « Éch. 1/50 » (format A3 paysage, proposé) ;
   - symboles d'équipements (WC, vasque, baignoire ou douche, évier, plaques, sèche-serviettes), gaine hachurée, placards ;
   - noms des pièces avec leur surface, **tableau des surfaces** (pièces, total habitable, loggia en annexe) ;
   - **cartouche fictif** : « PROGRAMME DE DÉMONSTRATION · T3 · environ 65 m² », « Plan fictif, créé pour la démonstration » ; ni adresse, ni architecte, ni promoteur, ni personne (MARQUE.md § 8.2, MESSAGES.md § 6.1) ;
   - textes en vrai texte (police standard intégrée), pas en contours, pour que l'extraction les lise.
5. **Contrôle sans IA** : `python3 pipeline/extract.py references/temoin/temoin.pdf <dossier temporaire> temoin` doit trouver l'échelle seule (confiance haute, sans calibration), les murs, les cotes et les textes du tableau, et un seul niveau. Si l'extraction bute, corriger **le dessin** (conventions de plan de vente), jamais `extract.py` dans ce ticket.
6. **Relecture par l'utilisateur** du PDF (lisibilité, style réaliste, aucune incohérence : cotes = géométrie, surfaces = polygones à 1 % près).
7. **Documenter** en tête de `references/temoin/LISEZMOI.md` : origine (dessin original, date), licence (notre propriété, affichable publiquement), règle « ne jamais remplacer par un plan réel ».

## Critères d'acceptation
- [ ] `python3 outils/temoin_pdf.py` régénère `references/temoin/temoin.pdf` à l'identique (même empreinte SHA-256 à version égale de pymupdf, ou même rendu à l'œil).
- [ ] L'extraction sans IA passe : échelle trouvée sans calibration, murs reconnus, cotes retrouvées, tableau des surfaces présent dans les textes, aucun niveau multiple.
- [ ] Surfaces du tableau = surfaces des polygones de `temoin.json` à 1 % près ; cotes écrites = distances de la géométrie à 1 cm près (vérification scriptée).
- [ ] Aucun nom réel : les textes du PDF (`pymupdf`, `page.get_text()`) ne contiennent ni adresse, ni nom de personne, ni nom de promoteur ou d'architecte ; le cartouche porte « Plan fictif, créé pour la démonstration ».
- [ ] Validation écrite de l'utilisateur (programme et rendu du PDF).

## Points d'attention
- **Tranché : R11.** Le témoin vit dans `references/temoin/`, versionné, à côté des autres relevés, là où la CI et `evaluer.py` les cherchent (et non dans `produit/temoin/`, ancienne proposition de MARQUE.md § 8.2, aligné depuis).
- Style « promoteur » sans copie : s'inspirer des conventions générales (aplats, cotes, tableau, cartouche), pas d'une mise en page précise d'un plan réel.
- Un témoin trop « facile » ne teste rien, un témoin trop inhabituel échoue : rester dans ce que les 4 plans réels ont déjà validé (consigne « plan par plan »).
- Le cartouche fictif servira aussi à tester le masquage (L1-10) ; une variante avec de fausses données personnelles (« M. et Mme Exemple », « 1 rue de l'Exemple ») peut être produite par le même générateur, sous un autre nom de fichier, **jamais montrée au public**.
- Un second témoin (T2 d'environ 44 m² avec balcon, MARQUE.md § 8.2) viendra plus tard, hors de ce ticket.

## Références
- `produit/ARCHITECTURE.md` § 3 D6 (visuels du témoin seulement), § 8.3 M0.2, § 9.5
- `produit/MARQUE.md` § 8.2, § 8.4
- `produit/MESSAGES.md` § 0.4 (Visuels), § 6 (en-tête, § 6.1)
- `produit/recherche/juridique.md` § 4.1
- `pipeline/extract.py` (`extract`, `parse_dim`, `echelle_graphique`) ; `references/432.plan.json` (format d'un relevé)

## Hors périmètre
- Relevé `plan.json`, lecture gardée, visite de contrôle et « zéro défaut visible » : L1-12.
- CI : L1-11 ; page de démonstration : L2-09 ; visuels : L2-03.
- Second témoin (T2 avec balcon) : à planifier après L1-12.
