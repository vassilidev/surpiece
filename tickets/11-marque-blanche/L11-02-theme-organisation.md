# L11-02 · Thème complet par organisation

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 11 · Marque blanche | P0 | M (1 à 3 j) | L9-06, L11-01 | `service/` | À faire |

## Pourquoi
Dans une instance en marque blanche, le client personnalise son logo, sa couleur d'accent, son nom affiché, son favicon, ses mentions légales, son bandeau et la signature ; tout le reste est fixe pour garantir la lisibilité et la mention non contractuelle (MARQUE.md § 9.1, § 9.2). L9-06 place déjà le logo, l'accent contrôlé et le mot d'accueil sur la visite du conseiller (`reglages.json`). Ce ticket étend la marque du client à tous les écrans (connexion, application), aux e-mails, aux titres d'onglets et au favicon, avec les seuils d'accessibilité de MARQUE.md § 10 appliqués à sa couleur.

## À faire
1. **Réglages** : `reglages_organisation.marque` étendu (nouvelle version à chaque enregistrement) : `nom_affiche`, `logo` (SVG nettoyé de tout script et lien externe, ou PNG au double de la taille affichée, fond transparent), `favicon` (sinon un favicon neutre, sans notre symbole), `accent` et `accent_sombre` dérivé, `mention_propulse`, `mentions_legales_url`, `expediteur_nom`.
2. **Contrôle de l'accent** (MARQUE.md § 9.3), dans le même module que L9-06, sans le dupliquer :
   - thème clair : luminance relative au plus 0,15 (au moins 4,5:1 sur Papier `#EDEFEA`, texte blanc lisible dessus) ;
   - thème sombre : variante dérivée de luminance au moins 0,25 (au moins 4,5:1 sur Calque 2 `#1F2421`) ;
   - échec : proposer la teinte la plus proche qui passe en ne faisant varier que la luminosité (OKLCH), aperçu montré, couleur d'origine permise dans le logo ;
   - tests sur les exemples du § 9.3 : orange `#F39200` refusé en clair, violet `#6C2A8C` et rouge `#C8102E` acceptés en clair avec une variante sombre dérivée.
3. **Jetons** : une seule feuille de jetons (L2-01) ; l'accent du client remplace le Bleu plan (boutons, cotes, focus, état en cours) ; neutres, couleurs de sens (Vert réception, Brique, Ocre soleil), typographies (Archivo, DM Mono), codes du plan et structure restent fixes. Accent à moins de 20° de teinte de la Brique ou du Vert réception : les états gardent libellé et forme.
4. **Écrans** : connexion, inscription, attente, aperçu, Mes plans, espace pro, pages de visite ; marque trouvée par l'hôte (L11-01), ou par l'organisation sur nos domaines ; `<title>` de la forme « ‹Nom affiché› · … » ; favicon du client.
5. **E-mails** (L5-14) : nom d'expéditeur, logo dans l'en-tête, accent sur le bouton ; textes inchangés et passés au contrôle des textes. Envoi depuis le domaine du client : seulement si le fournisseur le permet (point ouvert de D4) ; sinon `mail.<domaine>` avec le nom d'expéditeur du client.
6. **Ce qui reste fixe, vérifié par des tests** : mention « illustration non contractuelle » dans les photos, la visite et la fiche, non désactivable ; aucun prix sur la page de visite par défaut ; photos non remplacées ; modes et structure inchangés.
7. **Signature** « Visite réalisée avec Sur Pièce » (MESSAGES.md § 8.5) présente par défaut, retirée seulement si l'option payée est active ; jamais une formule qui laisserait croire que nous validons le lot.
8. **Contrôle d'accessibilité** (MARQUE.md § 10.2, règle 8) : ratios recalculés à l'enregistrement et en CI sur le fichier de jetons et l'accent de chaque client ; toute régression fait échouer la publication.

## Critères d'acceptation
- [ ] Les trois couleurs d'exemple du § 9.3 donnent les décisions attendues (tests unitaires).
- [ ] Une organisation de test avec logo, accent et favicon : captures claires et sombres de la connexion, de l'aperçu et de la visite, à 320 px et sur ordinateur, sans débordement ni texte illisible.
- [ ] Mention non contractuelle présente partout, y compris quand la signature est retirée (test).
- [ ] SVG contenant un script ou un lien externe refusé à l'envoi.
- [ ] E-mails de test aux couleurs du client, contrôle des textes réussi (L1-04) ; aucune lecture payante (témoin).

## Mesure
- `reglage_modifie` (`reglage` = `logo`, `couleurs`), `mention_retrait_active`.
- `couleur_ajustee` : à ajouter à SUIVI.md et à `mesure/evenements.json` (PARCOURS.md § 8.1).

## Points d'attention
- **Référence** : le JSON du lot cite MARQUE.md § 10 (accessibilité) ; les règles de marque blanche sont au § 9. Les deux s'appliquent ici.
- **Dépendance non déclarée** : L11-01 pour la marque trouvée par l'hôte (écran de connexion sur le domaine du client). Sans lui, le thème ne s'applique qu'aux pages de nos domaines rattachées à l'organisation.
- Le bandeau de consentement du client et ses mentions légales sont vérifiés dans la mise en service (L11-04), pas ici.
- Coordination `moteur/` : si la visite doit lire plus que `reglages.json` de L9-06 (favicon, titre), c'est un petit diff `[M]` à faire avec l'agent des duplex (ARCHITECTURE.md § 8.1).

## Références
- produit/MARQUE.md § 6.2, § 6.3, § 7.5, § 9.1, § 9.2, § 9.3, § 10.1, § 10.2 ; produit/MESSAGES.md § 8.5.
- produit/ARCHITECTURE.md § 4.2 (`reglages_organisation`), § 7.3, D4 ; produit/PARCOURS.md B9, D2 ; produit/OFFRES.md § 5.2.
- `moteur/visite.css:1-16` (jetons de couleur de la visite).

## Hors périmètre
- Marque du conseiller sur la visite : L9-06. Domaines et certificats : L11-01. Mise en service d'une instance : L11-04. Logo et favicon de Sur Pièce : L2-02.
