# L12-05 · Tests A/B de la vitrine

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 12 · Publicité et conversions | P2 | M (1 à 3 j) | L7-05 | `site/`, `service/` | À faire |

## Pourquoi
MESSAGES.md propose des variantes de titres pour chaque page (§ 1.1, § 2.1, § 3.1, § 4.1) et PARCOURS.md § 7.2 dix-sept leviers de conversion. La méthode est contrainte par la CNIL : créer des cohortes de visiteurs anonymes pour leur montrer des contenus différents sort de l'exemption de la mesure d'audience (recherche/suivi.md § 2.2). D'où deux méthodes : **par périodes successives** pour les anonymes, **tirage côté serveur** pour les comptes connectés (PARCOURS.md § 7.1). **Tranché : R8.** Ce tirage ne vaut que pour les textes et les présentations, jamais pour un prix : les prix se testent uniquement par périodes (L8-06). Aux volumes du lancement, seuls les grands écarts seront visibles : il faut environ 690 personnes par variante pour voir un passage de 10 % à 15 %.

## À faire
1. **Registre des tests** (`service/experiences/`) : table `experiences` (`code`, étape de l'entonnoir, hypothèse, variantes, méthode `periodes` ou `compte`, dates, statut, décision écrite) ; un seul test actif par étape de l'entonnoir (vérifié à l'activation).
2. **Anonymes, par périodes** : semaines entières, A puis B puis A ; la variante de la période est lue dans une configuration (`site/experiences.json`, publiée avec la vitrine) et identique pour tous ; aucune lecture ni écriture sur l'appareil, aucun cookie de cohorte ; annotation dans Umami à chaque bascule (SUIVI.md § 4.7). Pas de tirage parmi les seuls visiteurs qui ont consenti (échantillon biaisé).
3. **Comptes, tirage serveur** : table `affectations` (`compte_id`, `experience`, `variante`, `tiree_le`) ; tirage déterministe (HMAC d'un sel secret, de l'identifiant du compte et du code du test) ; rien lu sur l'appareil au-delà de la session ; information dans la politique de confidentialité (L2-11).
4. **Premiers tests proposés** : titres de l'accueil (MESSAGES.md § 1.1) par périodes ; L1 ordre des méthodes de connexion (périodes) ; L7 forme du verrou (tirage par compte). Leviers L4 à L7, L10 à L13 et L17 ensuite, un par étape.
5. **Garde-fous suivis pendant chaque test** : défauts signalés, remboursements, litiges, part d'échecs, questions au support ; arrêt si l'un se dégrade.
6. **Décision écrite** à la fin de chaque test : sens de l'effet, garde-fous, retours des testeurs ; la variante gagnante devient le texte de référence dans MESSAGES.md.
7. **Outil** : maison au lancement (volumes faibles, aucun tiers) ; PostHog UE seulement si les tests deviennent centraux dans l'application, avec consentement (recherche/suivi.md § 8).

## Critères d'acceptation
- [ ] Bascule de période sans aucun cookie ni stockage local nouveau (inspection du navigateur, parcours automatisé).
- [ ] Tirage par compte stable (même variante à chaque connexion) et réparti à 50 % sur 10 000 identifiants simulés.
- [ ] Deux tests actifs sur la même étape refusés à l'activation.
- [ ] Propriétés reportées dans `mesure/evenements.json`, jamais envoyées à Umami, et contrôles C1 à C3 réussis ; aucun texte technique dans les variantes (L1-04).

## Mesure
- Tests tirés par compte : propriétés `experience` et `variante` (déjà au dictionnaire, SUIVI.md § 3.2) sur les événements serveur de l'étape testée (par exemple `compte_cree`, `achat_paye`), écrites au journal seulement, jamais dans Umami (SUIVI.md § 0 et § 3.2, R8) ; reportées dans `mesure/evenements.json` (C1 à C3).
- Tests par périodes : aucune propriété sur les événements ; la période est notée en annotation dans Umami (SUIVI.md § 4.7).

## Points d'attention
- **Juridique** : l'intérêt légitime comme base du tirage côté serveur est à valider par l'avocat (PARCOURS.md § 8.3, question 7).
- **Tranché : R8.** Les prix ne se testent jamais ici : par périodes seulement, même prix pour tous (L8-06, OFFRES.md § 9.1, L221-5). Un levier qui touche au prix affiché (L7, forme du verrou) garde le même prix pour tous ; seule la présentation varie.
- **Bêta fermée** (R13) : aucun test qui affiche un prix avant l'ouverture publique (L8-07).
- Les périodes mélangent l'effet de la variante et celui de la saison ou des campagnes (L12-04) : alterner A, B, A et noter chaque campagne en annotation.
- Référencement : une variante de titre servie à tous pendant une période n'est pas du contenu masqué aux moteurs.
- La vitrine est statique : la bascule d'une période est une nouvelle publication de la vitrine, assemblée par `outils/site.py` (R19, L2-16), à automatiser à date.

## Références
- produit/PARCOURS.md § 7.1, § 7.2, § 8.3 ; produit/MESSAGES.md § 1.1, § 2.1, § 3.1, § 4.1.
- produit/SUIVI.md § 3.1, § 3.2, § 4.7, § 4.8, § 7.4 ; produit/OFFRES.md § 9.1.
- produit/recherche/suivi.md § 2.2, § 8.

## Hors périmètre
- Entonnoirs : L7-05. Tests de prix : L8-06. Campagnes : L12-04. Aperçu interactif comparé à l'aperçu en images : L13-03.
