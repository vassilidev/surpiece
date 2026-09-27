# L8-04 · CGV particuliers, garantie légale, médiateur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | M (1 à 3 j) | L0-07 | `site/`, `service/` | À faire |

## Pourquoi
Avant la première vente à un particulier (`recherche/juridique.md` § 7, n° 8 à 10) : des CGV qui contiennent l'encadré type de garantie légale des contenus numériques (D211-3), une garantie qui ne peut être ni écartée ni réduite (une telle clause est abusive, R212-1 6°), un médiateur de la consommation désigné (obligatoire, jusqu'à 15 000 € d'amende pour une société, L612-1, L641-1) et une RC professionnelle. Ce sont des prérequis hors technique du jalon J1 (`OFFRES.md` § 7.3). La politique de remboursement doit être écrite avant l'achat (`OFFRES.md` § 2.6).

## À faire
1. **Obtenir de l'avocat (L0-07)** :
   - les CGV B2C selon le sommaire de `recherche/juridique.md` § 1.6 : description et limites ; plans (le mot « crédit » reste interne, `MARQUE.md` § 5.1), validité de 12 mois ; hébergement de 24 mois (repli : 12 mois et une prolongation) ; rétractation, exclusion au lancement, « Renoncer au contrat ici », formulaire type ; garanties avec l'encadré D211-3 **mot pour mot** et la procédure (correction sous 5 jours ouvrés par un rejeu, sinon remboursement) ; responsabilité dans les limites permises ; propriété intellectuelle et licence d'usage privé (partage dans le cercle de famille, pas de publication sur un réseau social ni dans une annonce, `OFFRES.md` § 2.7) ; données ; réclamations puis médiateur ; droit applicable ; version et date ;
   - la politique de remboursement (`OFFRES.md` § 2.6, `MESSAGES.md` § 5.4), dont « pas de remboursement au goût » et l'absence de « satisfait ou remboursé ».
2. **Médiateur** : comparer au moins trois médiateurs référencés par la CECMC et compétents pour les services en ligne (CM2C : 48 € pour 3 ans et 36 € par dossier ; Medicys, AME Conso, CNPM Médiation : tarifs non vérifiés) sur le prix et le délai ; décision de l'utilisateur ; adhésion ; nom, site et adresse consignés.
3. **Affichage du médiateur** : ligne du pied de page (`MESSAGES.md` § 8.2), CGV, mentions légales (§ 8.6, L2-11), e-mail E7, modèle de réponse à une réclamation écrite rejetée (L6-11). Aucun lien vers la plateforme européenne RLL, fermée selon juridique § 1.7 (non vérifié).
4. **Versions** : les documents `cgv` et `remboursement` entrent dans `textes_legaux` (L8-03) avec version et date d'effet ; pages `/cgv` et `/remboursement` de la vitrine générées depuis la version en vigueur, anciennes versions consultables (`/cgv/v<n>`) pour les droits acquis ; PDF de chaque version produit par Chromium (même outil que L8-08), gardé et joint à E7 et E8.
5. **Pied de page par phase** : les lignes CGV, médiateur et « Renoncer au contrat ici », masquées au lot 2 (L2-11), deviennent visibles ici ; bascule publique avec L8-07.
6. **RC professionnelle (et cyber)** souscrite avec la société (L0-06), sur une description exacte du service (juridique § 5.3) ; attestation archivée hors dépôt.
7. **Garantie en pratique** : vérifier que la chaîne « défaut signalé → correction sous 5 jours ouvrés → sinon remboursement » existe avant J1 (L6-09, L8-05) ; la garantie légale est présentée comme une information due, jamais comme un avantage propre (`OFFRES.md` § 2.6).
8. **Contrôles automatiques du site** (extension de L2-15) : CGV, politique de remboursement, médiateur et « Renoncer au contrat ici » atteignables depuis chaque gabarit ; texte extrait du PDF identique à la page HTML de la même version ; encadré D211-3 identique au texte de référence stocké ; le filtre des textes (L1-04) admet « garantie légale de conformité » mais refuse « garanti » dans une promesse (`MARQUE.md` § 5.2).

## Critères d'acceptation
- [ ] CGV et politique de remboursement validées par écrit par l'avocat (compte rendu de L0-07).
- [ ] Attestation d'adhésion au médiateur ; coordonnées présentes aux quatre endroits prévus (test de gabarit).
- [ ] PDF de la version en vigueur généré, texte identique à la page (test) ; ancienne version toujours consultable.
- [ ] Encadré D211-3 identique au modèle de référence (test de comparaison).
- [ ] Attestation de RC professionnelle archivée.
- [ ] Contrôle des textes (L1-04) et du vocabulaire banni réussi sur `/cgv` et `/remboursement`.

## Points d'attention
- **Qualification du produit** (contenu numérique livré ou service continu, `recherche/juridique.md` § 1.1 et § 8, q. 1) : elle change le régime de la rétractation et la durée de garantie ; avec 24 mois d'hébergement, la visite est une fourniture continue garantie pendant toute cette durée (`OFFRES.md` § 10, risque 10).
- **Tranché : R14.** Un défaut de notre fait est toujours corrigé gratuitement, pour toutes les offres, aperçu offert compris ; `OFFRES.md` § 2.6 présente l'aperçu comme couvert par la garantie légale. L'étendue de cette garantie pour un contenu gratuit reste une question à l'avocat (`OFFRES.md` annexe B, q. 8), à écrire dans les CGV.
- **Coût** : une médiation (36 €) efface la marge d'une vente (`OFFRES.md` § 8.3) : rembourser vite reste moins cher.
- **Nom** : les CGV portent la raison sociale et le nom de marque ; si L0-01 change le nom, reprendre les PDF avant J1.
- **Tests de prix** (L8-06, R8 : par périodes seulement, le même prix pour tous pendant une période) : écrire dans les CGV qu'aucune différence n'est remboursée d'une période de prix à l'autre, si l'avocat l'accepte.
- L'encadré D211-3 n'a pas été relu dans les recherches : le prendre sur Légifrance au moment de la rédaction.

## Références
- produit/recherche/juridique.md § 1.1, § 1.5 à § 1.8, § 5.3, § 7 (n° 8 à 10), § 8 ; produit/OFFRES.md § 2.5, § 2.6, § 7.3, § 8.10, § 10, annexe B.
- produit/MESSAGES.md § 5.3, § 5.4, § 7.11 (E7), § 8.2, § 8.6 ; produit/MARQUE.md § 5.
- tickets L2-11 (pages légales, pied de page par phase), L6-11 (support), L8-03 (`textes_legaux`).

## Hors périmètre
- Cases, e-mail de confirmation et fonction « Renoncer au contrat ici » : L8-03.
- Pages légales de la bêta (mentions, CGU, confidentialité) : L2-11. CGV pro et DPA : L9-08.
- Société, banque, assurance : L0-06. Ouverture publique : L8-07.
