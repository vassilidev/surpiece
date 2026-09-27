# L2-07 · Page marque blanche et partenaires

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P1 | S (jusqu'à 1 j) | L2-01, L2-12 | `site/` | À faire |

## Pourquoi
Les partenaires (services d'accompagnement VEFA, courtiers, réseaux de mandataires, groupements de CGP) sont un canal d'orientation (marche.md § 5.5, point 4). La page `/marque-blanche` recueille leurs demandes de présentation. Les deux offres (codes à offrir, instance à leur marque) ne seront construites qu'après un premier partenaire ou une lettre d'intention (OFFRES.md § 5.6, jalons J4 et J5) : la page sert d'abord à trouver ces partenaires, pas à vendre.

## À faire
1. **Sections, dans l'ordre** (MESSAGES.md § 4, textes non recopiés) :
   1. En-tête § 8.1, bouton de page « Demander une démonstration » (§ 8.1 : pages marque blanche).
   2. Premier écran § 4.1 : surtitre « PARTENAIRES ET MARQUE BLANCHE », H1 « La visite du logement neuf, offerte par vous ou sous votre marque. », sous-titre, boutons « Commander des codes » et **Demander une présentation**.
   3. Codes à offrir § 4.2 (prix masqués sans validation L0-04 et tant que les codes n'existent pas, L9-09, R21).
   4. Instance à votre marque § 4.3 (ce que le client personnalise, ce qui reste fixe : mention non contractuelle, vérification avant livraison, accessibilité ; prix masqués sans validation et tant que l'instance n'existe pas, L11-01, R21).
   5. Formulaire de présentation § 4.4 (champs, mention, bouton **Demander une présentation**, confirmation).
   6. Questions fréquentes § 4.5 avec `data-question` ; pied § 8.2.
2. **Pré-lancement** : les codes et l'instance n'existent pas. « Commander des codes » ouvre le même formulaire avec « Ce qui vous intéresse » = « Codes à offrir » pré-rempli ; aucune commande ni paiement. Les phrases de capacité (« pour commencer dès demain », « Nous ouvrons les instances une par une ») portent `data-si` et restent masquées ou reformulées tant que L9-09 et L11-01 ne sont pas livrés.
3. **Formulaire** branché sur le service de L2-12 (type `contact_partenaire`), champs exactement comme § 4.4 ; adresse de repli `partenaires@<domaine>` créée avant publication.
4. Aucun logo de partenaire (MESSAGES.md § 10.1 : seulement après contrat et accord écrit sur le logo).
5. Accroches de mesure : `data-page="partenaires"`, `data-section`, `data-question` ; attributs selon L2-14.
6. Balises title et description de MESSAGES.md § 4 (reprises par L2-13).

## Critères d'acceptation
- [ ] Un envoi valide du formulaire crée une demande dans le stockage de L2-12, notifie l'équipe et affiche « Merci. Nous vous répondons sous 1 jour ouvré. » ; un envoi incomplet affiche les erreurs liées aux champs.
- [ ] « Commander des codes » ne déclenche aucun paiement ni aucune promesse de livraison.
- [ ] Aucun prix visible sans validation L0-04 ; aucun élément `data-si` visible dont la condition est fausse (contrôle L2-15).
- [ ] Pas de défilement horizontal dès 320 px (R10) ni à 360 px ; aucune erreur axe-core grave ; aucun texte technique.

## Mesure
Posées selon L2-14 : page vue, `cta_partenaire_clique` (`offre_partenaire` = `codes` ou `marque_blanche`), `section_vue`, `faq_ouverte`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` (`formulaire` = `contact_partenaire`) ; côté serveur, `contact_partenaire_recu` écrit par le service de L2-12.

## Points d'attention
- **Tranché : R9.** Adresse canonique `/marque-blanche` (MESSAGES.md) ; SUIVI.md § 2.6 et § 3.4 s'y alignent. La valeur `page_type` = `partenaires` du dictionnaire n'est pas une adresse et reste inchangée.
- **Tranché : R21.** Avant les lots 9 à 11, la page ne propose qu'une présentation (entretien) : codes à offrir (L9-09) et instance à la marque du client (L11-01) sont décrits comme « en préparation », sans date ni prix.
- **Juridique** : la revente par le partenaire (FAQ § 4.5) et les codes comme réponse au droit du promoteur (MESSAGES.md § 2.10) sont [À VALIDER : avocat] (L0-07) : réponses prudentes ou masquées d'ici là.
- Rien n'est vendu avant d'exister (OFFRES.md § 0.2, règle 5) : la page ne doit pas laisser croire qu'une instance est disponible.

## Références
- produit/MESSAGES.md § 4 (4.1 à 4.5), § 8.1, § 8.2, § 10.1 ; produit/OFFRES.md § 5 (5.1 à 5.6) ; produit/PARCOURS.md D1, D2.
- produit/MARQUE.md § 9 (ce que le client personnalise, ce qui reste fixe) ; produit/SUIVI.md § 3.4, § 3.14.
- produit/recherche/marche.md § 2.8, § 5.5 ; produit/recherche/juridique.md § 2.4.

## Hors périmètre
- Service des formulaires : L2-12. Prix : L2-08.
- Partenariats et premier partenaire codes : L9-12. Codes à offrir : L9-09. Instance, domaines, thème : L11-01 à L11-04.
