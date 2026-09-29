# L9-06 · Marque du conseiller sur la visite

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | M (1 à 3 j) | L5-12 | `moteur/` [M], `service/` | À faire |

## Pourquoi
Les pages de visite envoyées aux prospects doivent être à l'image du cabinet (logo, couleur, mot d'accueil, coordonnées), sans jamais casser la lisibilité ni retirer la mention (`PARCOURS.md` B9, `OFFRES.md` § 3.5, `ARCHITECTURE.md` § 7.3). Les réglages de marque sont servis **à côté** de la visite (`reglages.json`), pas dans `plan.json` : changer un logo ne relance ni lecture ni rendu (M4.2). La couleur d'accent passe un contrôle automatique d'accessibilité (`MARQUE.md` § 9.3, § 10). C'est aussi la base du thème complet de la marque blanche (L11-02).

## À faire
1. **Table `reglages_organisation`** (`ARCHITECTURE.md` § 4.2), versionnée : chaque enregistrement crée une version, `organisations.reglages_version` pointe la version active. `marque` : nom affiché, logo, accent clair, accent sombre dérivé. `textes` : mot d'accueil (280 caractères), téléphone, e-mail, lien de prise de rendez-vous.
2. **Droits par formule** (`OFFRES.md` § 3.5) : toutes les formules : logo, nom affiché, coordonnées, expiration par défaut des liens ; Cabinet et Équipe : couleur, mot d'accueil, lien de rendez-vous. Rôles : propriétaire et administrateur.
3. **Contrôles à l'enregistrement** :
   - couleur (`service/reglages/couleur.py`) : en clair, luminance relative au plus 0,15 (au moins 4,5:1 sur Papier `#EDEFEA`, texte blanc posé dessus aussi) ; en sombre, variante dérivée de luminance au moins 0,25 (au moins 4,5:1 sur `#1F2421`, texte `#0E1120` dessus). Si la couleur échoue : teinte la plus proche qui passe, en ne changeant que la luminosité (OKLCH), montrée au client avec le texte de B9 ;
   - textes : filtre du contrôle des textes (L1-04), vocabulaire banni (`MARQUE.md` § 5.2), pas de prix par défaut ; lien de rendez-vous en `https` seulement ; échappement à l'affichage ;
   - logo : PNG, JPEG ou SVG de 1 Mo au plus ; un SVG est assaini ou converti en PNG côté serveur (il peut contenir du script) ; dimensions normalisées ; original dans l'espace privé (`org/<id>/reglages/`), copie publiée sous un préfixe aléatoire.
4. **`reglages.json`** servi par l'application à `visite.<domaine>/v/<jeton>/reglages.json` (et pour la vue propriétaire) quand le plan appartient à une organisation pro : champs publics de la version active seulement ; 404 pour un particulier ; `Cache-Control: private, max-age=60`.
5. **Petit diff [M] dans `moteur/ui.js`** (M4.2) :
   - `boot()` lit `reglages.json` en option juste après `plan.json` (`ui.js:447`) ; absent ou illisible → apparence actuelle, sans message ;
   - jetons `--accent` et `--accent-ink` (clair et sombre, `moteur/visite.css:1-16`) posés par `document.documentElement.style.setProperty`, permis par la CSP ;
   - logo dans la case d'identité du cartouche (`.cart-id`, `pageHTML`) ; mot d'accueil et coordonnées dans la colonne de la galerie (`g-side`) ; textes insérés par `textContent` ou `esc()` ;
   - la mention non contractuelle et la signature « Visite réalisée avec Sur Pièce » restent.
6. **Écran « Personnalisation »** (`PARCOURS.md` B9) : aperçu en direct de la page prospect sur l'appartement témoin (L1-12) ; phrase « La mention « illustration non contractuelle » reste affichée sur toutes les pages. »
7. **Contrôle automatique** : la visite de contrôle et `verifier_publication.mjs` (L5-12) s'exécutent aussi avec des `reglages.json` de test (couleurs limites acceptées, textes les plus longs) : aucun texte technique, aucune violation de CSP, contrastes recalculés sur la page rendue (script de `MARQUE.md` § 10.2, point 8).

## Critères d'acceptation
- [ ] Changer la couleur d'un cabinet → visible sur tous ses liens en moins d'une minute, sans aucun travail ni appel IA créé (test).
- [ ] `#F39200`, `#6C2A8C`, `#C8102E` : décisions identiques au tableau de `MARQUE.md` § 9.3 (tests unitaires).
- [ ] SVG contenant `<script>` ou un gestionnaire d'événement → assaini ou refusé ; l'image servie ne contient aucun script.
- [ ] Visite d'un particulier (pas de `reglages.json`) : rendu identique à avant (captures comparées, écart au plus 2/255).
- [ ] Critère de fusion des tickets [M] (`ARCHITECTURE.md` § 8.1) : rejeu sans IA des références identique, visite de contrôle réussie, contrôle des textes réussi, test de fumée de l'outil local réussi.
- [ ] Zéro défaut visible et aucun texte technique avec les réglages de test.

## Mesure
- `reglage_modifie` (`reglage` : `logo`, `couleurs`, `texte_accueil`, `lien_rdv`, `expiration_liens` ; `formule`).
- `couleur_ajustee` (à ajouter à `SUIVI.md`, `PARCOURS.md` § 8.1).

## Points d'attention
- **Coordination** : diff [M] petit et isolé, sur une branche courte, après la fusion du travail sur les niveaux (27/09/2026) et en accord avec les corrections de navigation (L1-15) et la qualité adaptative (L4-12) ; `engine.js` n'est pas touché. Au point 5, `boot` est désormais en `ui.js:445` (relevé le 27/09/2026).
- **Visionneuse 360°** (L4-16) : proposition, elle lit le même `reglages.json` (logo, accent) sur la page prospect, sans diff [M].
- **Moteur versionné** : les visites publiées avec une version antérieure ne lisent pas `reglages.json`. Les rejouer sans IA (L5-17) pour qu'elles prennent la marque, ou l'accepter pour les visites déjà envoyées.
- **Partage avec L9-04** : la barre de la page prospect (`prospect.js`, bouton d'intérêt, téléphone) est dans L9-04 ; ce ticket ne fait que la marque dans la visite. Garder une seule source de coordonnées (`reglages_organisation.textes`).
- **Réglages sans ticket** : « choix et ordre des photos » (Cabinet) est sans objet au lancement (**Tranché : R1** : 2 photos, galerie complète seulement avec L13-02, `OFFRES.md` § 3.5) ; la vue d'accueil et la hauteur sous plafond par défaut (Équipe) sont prises par L9-07 ; la fiche PDF aux couleurs du cabinet n'a pas de ticket.
- **Référence** : le résumé renvoie à `MARQUE.md` § 10 (accessibilité) ; le contrôle de la couleur d'accent est au § 9.3.

## Références
- produit/ARCHITECTURE.md M4.2, § 4.2 (`reglages_organisation`), § 6.2, § 7.3, § 8.1 ; produit/OFFRES.md § 3.3, § 3.5.
- produit/MARQUE.md § 5.2, § 9.1 à § 9.3, § 10 ; produit/PARCOURS.md B9, § 8.1 ; produit/MESSAGES.md § 7.9, § 8.5.
- `moteur/ui.js:447` (`boot`, lecture de `plan.json`), `pageHTML` (`.cart-id`, `g-side`) ; `moteur/visite.css:1-16` (jetons).

## Hors périmètre
- Page prospect, bouton d'intérêt, consentement : L9-04. Thème complet et domaines des clients : L11-01, L11-02.
- Réglages de lecture et préférences de rendu : L9-07.
