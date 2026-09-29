# L2-14 · Marquage prêt à brancher

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | S (jusqu'à 1 j) | L2-04 | `site/` | À faire |

## Pourquoi
SUIVI.md § 7.1 demande que les bases de la mesure soient posées « dès le lot 1 du site » : attributs `data-umami-event`, accroches de sections et de FAQ, fonctions `mesure()` et filtre avant envoi. Tant qu'Umami n'est pas installé (L7-01), tout reste inerte et ne coûte rien ; le jour où il l'est, la vitrine est mesurée sans reprendre les pages. Décision 9 : Umami auto-hébergé dans l'UE, le reste plus tard.

## À faire
1. **Dictionnaire en code** `mesure/evenements.json` (à la racine, comme le prévoit SUIVI.md § 7.1 ; nouveau dossier, hors `pipeline/` et `moteur/`) : au moins les événements des § 3.4 (site vitrine) et § 3.5 (démonstration), avec propriétés et valeurs autorisées du § 3.2. Il sera complété par L5-15 et L7-04.
2. **Module** `site/js/suivi.js`, chargé sur toutes les pages, sans dépendance :
   - `window.mesure(nom, props)` et `window.mesureUneFois(cle, nom, props)` (esquisse de SUIVI.md § 2.5) : n'envoient rien si `window.umami` n'existe pas, ne lèvent jamais d'erreur ;
   - `window.DICO_MESURE`, `window.filtrerProprietes`, `window.avantEnvoi` (filtre avant envoi du § 2.5 : chemins réduits en gabarits, aucune requête sans consentement, GPC et cookie `opposition_mesure` respectés) ;
   - écouteurs : `section_vue` (50 % visible pendant 1 s, une fois par section), `page_defilee` (25, 50, 75, 100 %), `faq_ouverte` (ouverture d'un `details`), `tarifs_onglet_choisi`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye`.
3. **Attributs sur les pages existantes** : `data-page` sur `body` (valeurs de `page_type`), `data-section`, `data-question` ; `data-umami-event` et `data-umami-event-emplacement` (et `-page_type`) sur les liens et boutons **sans** comportement JavaScript propre ; `mesure()` pour tout élément qui a déjà un écouteur (zone de dépôt, onglets, volets, FAQ), parce qu'Umami bloque les autres écouteurs d'un élément marqué (SUIVI.md § 2.5, à vérifier en recette R1).
4. **Aucune donnée personnelle** : jamais d'e-mail, de téléphone, de texte libre, de nom de fichier ni d'identifiant dans un événement ; seules les valeurs énumérées du § 3.2.
5. **Aucune balise Umami** ajoutée ici : le `<script>` d'Umami et le sous-domaine `m.<domaine>` viennent avec L7-01. `site/_blocs/` prévoit l'emplacement, vide.
6. **Règle pour les pages suivantes** : note dans `site/README.md` (convention de marquage) pour que L2-05 à L2-10 posent eux-mêmes leurs attributs.

## Critères d'acceptation
- [ ] Sans Umami : aucune requête réseau supplémentaire, aucune erreur dans la console, liens et boutons marqués fonctionnent normalement.
- [ ] Avec un faux `window.umami.track` injecté par puppeteer : le parcours R1 (SUIVI.md § 7.5) produit exactement les événements attendus, une seule fois chacun, avec des propriétés du dictionnaire.
- [ ] Tests du filtre `avantEnvoi` (contrôle C4) : gabarits appliqués, requête retirée sans consentement, rien si GPC ou opposition.
- [ ] Contrôle C1 : tout nom trouvé dans `site/` (`data-umami-event=`, `mesure(`) respecte `^[a-z][a-z0-9]*(_[a-z0-9]+)+$`, fait 50 caractères au plus et figure dans `mesure/evenements.json` (branché en CI par L2-15).
- [ ] Aucune valeur ressemblant à un e-mail, un téléphone ou un identifiant dans les appels interceptés (contrôle C5).

## Mesure
Événements posés : `cta_depot_clique`, `cta_demo_clique`, `cta_tarifs_clique`, `cta_essai_pro_clique`, `cta_rdv_pro_clique`, `cta_promoteur_clique`, `cta_partenaire_clique`, `section_vue`, `page_defilee`, `faq_ouverte`, `tarifs_onglet_choisi`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye`, et pour la démonstration `demo_ouverte`, `visite_mode_choisi`, `visite_piece_vue`, `visite_photo_ouverte`, `visite_plein_ecran`, `visite_quittee`, `visite_chargement_echoue`, `erreur_affichee`.

## Points d'attention
- **Écarts du dictionnaire à faire corriger dans SUIVI.md** (par son propriétaire, ce ticket ne le modifie pas) :
  - `cta_depot_clique` décrit les boutons « Déposer mon plan » et « Essayer avec mon plan », alors que le bouton s'appelle « Importer mon plan » (MESSAGES.md) ;
  - `formulaire` n'a pas de valeur pour la liste d'attente (proposition : `liste_attente`, voir L2-12) ;
  - `section` n'a pas de valeur pour « Ce que vous obtenez », « Fidélité et contrôle », « Quand s'en servir », « Dernier appel » (propositions : `livrables`, `fidelite`, `moments`, `dernier_appel`) ;
  - `emplacement` n'a pas `pro` (PARCOURS.md B1) ; `intention` de `cta_promoteur_clique` n'a pas `demo` ; `onglet` n'a pas `professionnel` (voir L2-06, L2-08).
- **Bascule du bouton** (L6-01) : garder `cta_depot_clique` avant et après ; noter la date de la bascule en annotation dans Umami (L7-05) plutôt que de créer un second nom.
- Nouveaux écrans du moteur : onglets de niveau (plan 2D, maquette), et plus tard mode 360° (décision 15). `visite_mode_choisi` n'a pas de valeur pour eux : à ajouter par le propriétaire de SUIVI.md quand ils sont publiés.
- Le fichier `mesure/evenements.json` et les tableaux de SUIVI.md § 3 doivent rester identiques (contrôle C2) : toute modification passe par les deux dans la même demande de fusion.

## Références
- produit/SUIVI.md § 0, § 2.5, § 2.6, § 2.7, § 3.1 à § 3.5, § 7.1, § 7.4 (C1 à C5), § 7.5 (R1, R2) ; produit/PARCOURS.md § 1.4, § 8.1.
- produit/recherche/suivi.md § 1.1 (comportement des attributs d'Umami).

## Hors périmètre
- Installation d'Umami, sous-domaine, purge, opposition : L7-01. Bandeau de consentement : L7-02. Attribution : L7-03.
- Événements du moteur (`visite:evenement`) et de l'application : L7-04. Recette automatique complète : L7-07.
