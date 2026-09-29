# L9-03 · Prise en main Pro

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P1 | M (1 à 3 j) | L1-12, L9-02, L9-04, L9-06 | `service/` | À faire |

## Pourquoi
Le déclic d'un conseiller, c'est « mon prospect ouvre le lien et se signale ». `PARCOURS.md` B3 le fait vivre avant même le premier plan, avec l'appartement témoin préchargé, qui ne consomme aucun plan (levier L13). Le cabinet partage ensuite plans, liens et quota entre collègues (B8). L1-12 fournit le témoin validé, créé par nous : aucun droit de promoteur en jeu (`MARQUE.md` § 8.2).

## À faire
1. **Témoin préchargé** : à la création d'une organisation pro (essai ou abonnement), une carte « Appartement témoin (fictif) » dans le tableau de bord, liée à la publication unique du témoin (L1-12, publiée par L5-12). Plan marqué `temoin=true` : aucun plan consommé, exclu des quotas, des coûts et des statistiques d'usage ; aucune lecture ni aucun rendu par organisation.
2. **Liste des 4 étapes** (`PARCOURS.md` B3 ; l'étape 1 est à ajouter à E13 et à `MESSAGES.md`) :
   1. « Envoyez-vous la page prospect de l'appartement témoin » ;
   2. « Déposez le plan d'un de vos lots » ;
   3. « Ajoutez votre logo et vos coordonnées » ;
   4. « Envoyez votre premier lien à un prospect ».
   Chaque étape se coche seule sur l'événement correspondant (lien témoin créé, plan lancé, réglage de marque enregistré, premier lien prospect hors témoin) ; la liste peut être masquée.
3. **Envoi à soi-même** : bouton « Envoyer à un prospect » sur la carte du témoin → lien prospect (L9-04) marqué `temoin`, sans case d'autorisation du promoteur.
4. **Écran des membres** (aucun autre ticket ne le porte, relevé par L5-04) : liste ; invitation par e-mail avec un rôle (propriétaire : facturation ; administrateur : réglages et membres ; membre : plans et liens), lien valable 7 jours ; retrait ; changement de rôle ; « Toutes les places sont prises » (texte à ajouter, B8) avec l'achat d'une place (L9-13) ; au départ d'un membre, ses liens restent actifs et un administrateur les rattache à un autre membre (L9-04).
5. **Premier plan** (`PARCOURS.md` B4) : consommation annoncée avant le lancement, « Ce plan utilisera 1 de vos 3 plans d'essai » (à ajouter) ; champs « Programme » et « Lot n° » au dépôt si L9-04 ne les a pas livrés.
6. **Levier L13** : variante A (tableau vide et E13) ou B (témoin et liste) tirée côté serveur sur le compte (`PARCOURS.md` § 7.1), notée dans le journal ; permis parce que ce test ne porte sur aucun prix (R8, registre de L12-05).

## Critères d'acceptation
- [ ] Nouvelle organisation d'essai → témoin visible, 0 plan consommé ; lien témoin créé puis ouvert en navigation privée (page prospect du témoin).
- [ ] Étapes cochées automatiquement sur des événements simulés.
- [ ] Invitation acceptée depuis une autre adresse → membre avec le bon rôle ; invitation expirée → refus ; 4e membre en Cabinet sans place → refus.
- [ ] Le témoin n'apparaît dans aucun compteur de coût, de quota ni d'usage (test SQL).
- [ ] Tests d'accès croisé : un autre cabinet ne voit ni les liens témoin ni les membres de celui-ci (404).
- [ ] Aucun texte technique ; aucune lecture payante.

## Mesure
- `checklist_etape_faite` (à ajouter, `etape`) ; `lien_prospect_cree` (propriété `temoin` à ajouter).
- `membre_invite`, `membre_rejoint` ; `membre_retire` et `role_modifie` (à ajouter à `SUIVI.md`, `PARCOURS.md` § 8.1).

## Points d'attention
- **Tranché** : L9-04 (lien et page prospect : étapes 1 et 4) et L9-06 (logo et coordonnées : étape 3) sont des dépendances déclarées.
- **Exception au cadrage** : une publication (celle du témoin) partagée entre organisations déroge à la règle « tout est cadré par organisation » (`ARCHITECTURE.md` § 4.1). L'écrire dans l'utilitaire de cadrage et la couvrir par les tests de L5-19.
- Le témoin doit rester à jour avec la dernière version validée du moteur (rejeu sans IA à chaque nouvelle version) ; ses panoramas 360° et ses fichiers précalculés, quand ils existent, sont refaits au même rejeu, sans IA.
- Les rôles décrits ici viennent de `PARCOURS.md` B8 ; leurs droits exacts sont testés par L5-04.

## Références
- produit/PARCOURS.md B3, B4, B8, § 7.2 (L13), § 8.1 ; produit/OFFRES.md § 3.3 ; produit/MARQUE.md § 8.2.
- produit/MESSAGES.md § 7.11 (E13) ; produit/SUIVI.md § 3.12 ; produit/ARCHITECTURE.md § 4.1, § 6.3 (invitations).
- tickets L1-12, L5-04, L5-12, L9-04, L9-06.

## Hors périmètre
- Liens et page prospect : L9-04. Marque du cabinet : L9-06. Places payantes : L9-13.
- Démonstrations commerciales : L9-11.
