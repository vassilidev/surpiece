# L2-10 · Page Méthode

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P1 | S (jusqu'à 1 j) | L0-07, L2-01 | `site/` | À faire |

## Pourquoi
Le particulier prudent, le conseiller qui vérifie avant de recommander et le promoteur avant un pilote veulent savoir ce qui est lu, ce qui est supposé et où vont les données. La page `/methode` donne les preuves autorisées et l'information due : la lecture du plan est faite par un modèle d'intelligence artificielle (MARQUE.md § 5.2, « IA et transparence »), puis vérifiée par des contrôles automatiques.

## À faire
1. **Sections, dans l'ordre** (MESSAGES.md § 9, textes non recopiés) :
   1. En-tête § 8.1.
   2. Premier écran § 9.1 : surtitre « MÉTHODE », H1 « Comment votre plan de vente devient une visite. », sous-titre.
   3. Ce que nous lisons § 9.2.
   4. Sur le PDF du promoteur § 9.3 ; sur une capture ou une photo § 9.4.
   5. Comment nous vérifions § 9.5.
   6. Ce que nous supposons § 9.6.
   7. Nos essais § 9.7 : seulement les faits de MESSAGES.md § 0.5 ; la phrase « toutes les cotes lues correspondent » masquée jusqu'à l'avis de l'avocat ; aucun délai en dur : marqueur ‹délai›, et passage masqué, jusqu'à la mesure en production (T0, R12).
   8. Qui lit votre plan, et où vont vos données § 9.8.
   9. Ce que nous ne faisons pas § 9.9, bouton **Importer mon plan** (suit `mode_depot`, L2-04), lien « Visiter l'appartement témoin → ».
   10. Pied § 8.2.
2. **Phrases conditionnelles** (`data-si`, L2-01) :
   - « aucune conservation » : seulement si L1-08 (ZDR) est livré ;
   - « Les noms et l'adresse du cartouche sont masqués avant la lecture » : seulement si L1-10 est livré ;
   - hébergeur de l'UE : rempli après L0-03 ;
   - marquage des métadonnées des photos : seulement si L4-07 est livré.
3. **Cohérence avec la politique de confidentialité** (L2-11) : mêmes sous-traitants, mêmes lieux, mêmes durées ; lien « Détails : politique de confidentialité ».
4. Illustration : l'axonométrie au trait et les captures du témoin (L2-03), avec une cote vraie.
5. Accroches de mesure : `data-page="methode"`, `data-section` ; attributs selon L2-14. Balises de MESSAGES.md § 9 (reprises par L2-13).

## Critères d'acceptation
- [ ] Chaque phrase de preuve de la page figure dans le tableau des faits autorisés (MESSAGES.md § 0.5, MARQUE.md § 3.3) ; aucun autre chiffre.
- [ ] Aucune phrase conditionnelle visible si sa condition n'est pas remplie (contrôle L2-15).
- [ ] L'intelligence artificielle est nommée clairement ; aucun nom de fournisseur ni de modèle, aucun terme technique banni (MARQUE.md § 5.2).
- [ ] Relecture par l'avocat consignée (date, version) avant publication ; « au centimètre » absent.
- [ ] Pas de défilement horizontal dès 320 px (R10) ni à 360 px ; aucune erreur axe-core grave.

## Mesure
Posées selon L2-14 : page vue, `cta_depot_clique` (`page_type` = `methode`), `cta_demo_clique`, `section_vue`, `page_defilee`.

## Points d'attention
- **Tranché** : L0-07 est une dépendance déclarée ; la page n'est publiée qu'avec des formulations validées par l'avocat.
- **Données réelles de l'outil** : la page décrit un service en ligne qui n'existe pas encore ; au lot 2 et pendant la bêta express (lot 3), vérifier que chaque phrase (hébergement UE, pas de conservation, masquage) est vraie à la date de publication.
- **Tranché : R12.** Les 8 à 15 minutes sont mesurées en Metal, alors que la production rend en SwiftShader (décision 4, R3) : aucun délai n'est affiché avant la mesure en production (T0, L5-11).
- Aucun concurrent nommé.

## Références
- produit/MESSAGES.md § 0.3, § 0.5, § 9 (9.1 à 9.9), § 12.3 ; produit/MARQUE.md § 3.3, § 3.4, § 5.2.
- produit/recherche/juridique.md § 3.3, § 5.2, § 5.4 ; produit/ARCHITECTURE.md § 6.6, D7.

## Hors périmètre
- ZDR : L1-08. Masquage du cartouche : L1-10. Marquage des images : L4-07.
- Politique de confidentialité : L2-11. Chiffres mesurés en production : L6-12.
