# L9-04 · Liens prospects sans traceur illicite

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | L (3 à 5 j) | L0-07, L5-13, L7-04, L9-06, L9-08 | `service/` | À faire |

## Pourquoi
Un lien par prospect est un **lien traçant** au sens du CEPD (lignes directrices 2/2023) et de l'article 82 (`recherche/juridique.md` § 3.7, `SUIVI.md` § 6.6). Le conseiller veut pourtant qualifier ses prospects. La réponse d'`OFFRES.md` § 3.4 : un compteur agrégé par défaut ; le bouton « Je suis intéressé, prévenir mon conseiller », seule notification nominative, déclenchée par le prospect lui-même ; le détail (durée, pièces vues) seulement après consentement sur la page (Cabinet, Équipe). La granularité du statut « ouvert » (par lot ou par lien) dépend de l'avis de l'avocat (`OFFRES.md` annexe B, q. 5). Ticket M4.3.

## À faire
1. **Migration** :
   - `partages` : colonne `usage` (`prive`, `prospect`, `temoin`) ; colonnes déjà créées par L5-13 activées (`libelle`, `suivi_detaille`, `prevenir_createur`, `cree_par`) ;
   - `plans.programme_libelle` et `plans.lot_libelle`, saisis par le conseiller au dépôt, facultatifs (`PARCOURS.md` B4) ;
   - `interets_prospect` (partage, date, message chiffré, état de l'envoi) ; `vues_visite_detail` (`ARCHITECTURE.md` § 4.2) ; `consentements_prospect` (partage, choix, version du texte, date ; aucune adresse IP).
2. **Création d'un lien** (espace pro, textes `pro.lien.*` de `MESSAGES.md` § 7.9) : sur un plan complet publié de l'organisation ; libellé (« visible par vous seul ») ; expiration (90 jours par défaut, réglable par l'organisation) ; option « Proposer au prospect le suivi détaillé », seulement en Cabinet et Équipe et seulement si le drapeau `suivi_detaille_autorise` a été levé après l'avis de l'avocat. **Premier lien d'un programme** : déclaration d'autorisation du promoteur exigée (`autorisation_ok` de L9-08), sinon `erreur.pro.autorisation`. Ensuite : copier ; modèles de message e-mail et SMS proposés, avec « Ce lien vous est personnel » et la mention non contractuelle ; boutons `mailto:` et `sms:` ; plein écran pour le rendez-vous. Nous n'écrivons jamais aux prospects.
3. **Page prospect** `visite.<domaine>/v/<jeton>` (`PARCOURS.md` B5) : la visite publiée, mode 360° compris quand il existe (L4-16 ; décision 15 : dans toutes les visites), plus un script séparé `prospect.js` servi depuis `cdn.<domaine>/app/prospect/v<N>/` (hors de `moteur/`, CSP complétée) qui ajoute : titre `prospect.titre` (repli « Visite du logement ») ; barre collée en bas avec « Je suis intéressé, prévenir mon conseiller » et le téléphone du conseiller (lien `tel:`) ; `prospect.lien_perso`, `prospect.mention`, `prospect.signature`, lien vers les mentions légales. La marque du cabinet (logo, couleur, accueil, coordonnées) vient de L9-06. Ni prix, ni superposition du plan du promoteur, ni script de mesure ; `frame-ancestors 'none'`.
4. **« Je suis intéressé »** : volet de `MESSAGES.md` § 7.9 (message facultatif de 500 caractères au plus, filtré et échappé) → `POST /v/<jeton>/interet` (même origine, sans cookie de session) → ligne `interets_prospect`, puis **E15** au seul créateur du lien (`prevenir_createur`). Limites : 5 envois par heure par jeton et par IP, 3 notifications par lien et par jour. Confirmation et erreur du catalogue. Aucune mise en relation (loi Hoguet, `OFFRES.md` § 2.7).
5. **Consentement au suivi détaillé**, seulement si le lien le propose : bandeau de `MESSAGES.md` § 7.13 et `SUIVI.md` § 6.6 (« Refuser » et « Accepter » de même style, sans masquer le bouton d'intérêt) ; sans réponse, rien n'est suivi ; choix gardé dans un cookie de `visite.<domaine>` propre au partage et dans `consentements_prospect` ; lien permanent « Mes choix sur cette visite » pour le retirer.
6. **Suivi détaillé après accord** : `prospect.js` mesure la durée (visibilité de la page) et les pièces vues à partir des événements `visite:evenement` émis par le moteur (L7-04) et par la visionneuse 360° (L4-16), et les envoie par `navigator.sendBeacon` à `/v/<jeton>/suivi` → `vues_visite_detail`. Purge et agrégation à 6 mois : règle ajoutée à L5-20.
7. **Compteur agrégé** : `vues_visite` (L5-13). `GET /api/pro/liens` renvoie par défaut le total **par lot** et la date de la dernière ouverture ; le compteur par lien (`pro.lien.compteur`) seulement si le drapeau `statut_ouvert_par_lien` est levé après l'avis de l'avocat.
8. **Lien expiré ou coupé** : page d'erreur du catalogue avec les coordonnées du conseiller (variante à ajouter, B5).
9. **Départ d'un membre** : ses liens restent actifs ; un administrateur les rattache à un autre membre, dont les coordonnées remplacent les siennes (B8).

## Critères d'acceptation
- [ ] Sans clic ni consentement, le conseiller ne voit qu'un compteur par lot et par jour (test de l'API) ; aucune ligne `vues_visite_detail` n'est créée.
- [ ] Clic « Je suis intéressé » → E15 au créateur seul (Mailpit), rien aux autres membres ; 6e envoi dans l'heure refusé.
- [ ] Bandeau : refus → aucune requête `suivi` (interception réseau) ; acceptation → ligne de détail ; retrait → plus aucun envoi.
- [ ] Page prospect : aucune requête vers Umami, un pixel ou un domaine tiers ; aucun cookie hors celui du choix ; `frame-ancestors 'none'` (test d'en-têtes).
- [ ] Premier lien d'un programme sans déclaration → refus ; second lien du même programme → sans case.
- [ ] Message du prospect avec du HTML → affiché échappé (test d'injection) ; contrôle des textes (L1-04) réussi sur la page prospect.
- [ ] Recette sur le témoin, sans lecture payante ; outil local inchangé ; `moteur/` non modifié.
- [ ] Page prospect ouverte sur le téléphone d'entrée de gamme de référence : seuils de fluidité de L1-14 tenus (le prospect ouvre surtout sur téléphone).

## Mesure
- `lien_prospect_cree` (`individuel`, `expiration_j`, `suivi_detaille`, `formule`), `lien_prospect_copie` (N), `lien_prospect_revoque`.
- `prospect_consentement_choisi` (`choix`), `prospect_interesse`, `conseiller_notifie` (`delai_s`), `email_envoye` (`modele=interet_prospect`).
- Compteurs `partage_ouvert` et `lien_expire_ouvert` (C).

## Points d'attention
- **Avis de l'avocat attendu** (L0-07) : statut « ouvert » par lien avec une simple ligne d'information, texte du bandeau, « Ce lien vous est personnel ». La recommandation de la CNIL sur les pixels dans les courriels reste à retrouver (`recherche/juridique.md` § 3.7). Les deux drapeaux restent fermés par défaut.
- **Tranché** : L9-08 (déclaration d'autorisation), L9-06 (marque du cabinet) et L7-04 (événements `visite:evenement`, sans lesquels seule la durée est mesurable) sont des dépendances déclarées ; L5-14 (E15) vient avec le socle du lot 5.
- **Architecture** : `prospect.js` hors de `moteur/` évite un diff [M] pendant les travaux sur le moteur (niveaux, à commiter depuis le 27/09/2026 ; corrections de navigation L1-15 et qualité adaptative L4-12 à venir) ; l'alternative (point d'accroche dans `ui.js`) serait un diff [M]. Choix à valider.
- **Taille** : L au plafond ; si elle déborde, sortir le suivi détaillé avec consentement (points 5 et 6) dans un ticket P1.
- **Rôles RGPD** : le conseiller est responsable de traitement pour le libellé et le message de ses prospects, nous sommes sous-traitant (DPA, L9-08) ; message conservé 6 mois.
- **Écart** : `SUIVI.md` § 3.11 (`partage_cta_clique`, `type_page=prospect`) prévoit une invitation « plan offert » sur la page d'un prospect ; `PARCOURS.md` § 8.2 l'exclut pour une page de conseiller. Ici : pas d'invitation, seulement la signature.

## Références
- produit/OFFRES.md § 2.7, § 3.3, § 3.4, § 3.8, annexe B (q. 5) ; produit/recherche/juridique.md § 2.2, § 3.7, § 8 (q. 6).
- produit/ARCHITECTURE.md M4.3, § 4.2 (`partages`, `vues_visite`, `vues_visite_detail`), § 6.2, § 6.4 ; produit/PARCOURS.md B5, B8, § 8.2.
- produit/MESSAGES.md § 2.5, § 7.9, § 7.11 (E15), § 7.13 ; produit/SUIVI.md § 2.7, § 3.11, § 3.12, § 6.6.

## Hors périmètre
- Tableau de suivi et export : L9-05. Marque du cabinet : L9-06. Déclaration d'autorisation et DPA : L9-08.
- QR code (« à construire », `OFFRES.md` § 3.3) : sans ticket. Intégration iframe : L10-04.
