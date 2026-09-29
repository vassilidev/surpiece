# L9-08 · Droits des conseillers : accord du promoteur, CGV pro, DPA

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | M (1 à 3 j) | L0-07 | `service/`, `site/` | À faire |

## Pourquoi
Envoyer la visite d'un lot à des prospects, c'est représenter une adaptation de l'œuvre de l'architecte hors du cercle de famille, dans un but commercial : il faut l'autorisation du promoteur (`recherche/juridique.md` § 4.3 ; `OFFRES.md` § 10, risque 11). Le conseiller la déclare (case), la garantit et nous indemnise ; nous retirons sur notification (DSA art. 16). Pour les données de ses prospects, il est responsable de traitement et nous sommes sous-traitant : un DPA est annexé (juridique § 2.2). Ce sont les prérequis hors technique du jalon J2 (`ARCHITECTURE.md` § 8.4 ; juridique § 7, n° 12 et 13).

## À faire
1. **Documents** commandés à l'avocat (L0-07), publiés et versionnés dans `textes_legaux` (L8-03) :
   - **CGV pro et contrat d'abonnement** (sommaire de juridique § 2.1) : quotas, report, recharges, places ; durée, renouvellement, résiliation ; prix HT et révision avec préavis ; obligations du client (droits sur les plans, maintien de la mention, information des prospects, interdiction de présenter les rendus (photos, et panoramas 360° quand ils existent) comme des photos réelles, en particulier dans une annonce) ; personnalisation ; responsabilité plafonnée aux sommes payées sur 12 mois ; suspension, réversibilité, suppression ; clause pour l'abonnement signé hors établissement (L221-3) ;
   - **DPA client** (art. 28 § 3, points a à h) : liste des sous-traitants ultérieurs avec pays et garanties (tirée du registre de L0-09) ; préavis de changement d'au moins 30 jours (celui d'OpenRouter) ; notification d'une violation « sans retard injustifié et au plus tard 48 h » après que nous en avons connaissance ; export sous 30 jours puis suppression en fin de contrat ; annexe sécurité ;
   - **guide d'usage pro** : autorisation du promoteur, information des prospects (« Ce lien vous est personnel »), mention non contractuelle, pas de prix sans les mentions d'annonce.
2. **Acceptation** : case « J'accepte les conditions Sur Pièce Pro et l'accord de sous-traitance des données » au formulaire d'essai (L9-02) et avant tout abonnement (L9-01) ; ligne `acceptations` (`cgv_pro`, `dpa`, version) ; une nouvelle version est redemandée à la connexion suivante d'un administrateur.
3. **Déclaration d'autorisation du promoteur** (texte et aide de `MESSAGES.md` § 7.9) : `service/pro/autorisations.py`, `declarer(org, programme, compte, document=None)` et `autorisation_ok(org, programme)`, appelée par L9-04. Stockage dans `acceptations` (`autorisation_promoteur`, version, programme). Dépôt facultatif du document dans l'espace privé, jamais publié. Moment réglable : **avant le premier lien d'un programme** (`OFFRES.md` § 3.8) ou **au premier plan d'un programme** si l'avocat le demande (`PARCOURS.md` § 8.3, q. 9).
4. **Retrait sur notification** : le formulaire « Signaler un contenu » (L2-11) alimente la file de l'administration (L5-17, `PARCOURS.md` E6) : suspension des liens du plan visé, décision motivée envoyée au conseiller et au notifiant (DSA art. 16 et 17), trace dans `journal_equipe`.
5. **Pages** : `/pro/conditions`, `/pro/dpa`, `/pro/sous-traitants`, `/pro/guide` ; liens depuis l'espace pro, la page pro (`MESSAGES.md` § 2.10) et E13.
6. **Superposition du plan du promoteur** : jamais sur un lien prospect, même avec la case (`OFFRES.md` § 3.3) ; seule une preuve vérifiée par l'équipe l'ouvrira (L10-06).

## Critères d'acceptation
- [ ] Textes validés par écrit par l'avocat (compte rendu de L0-07), publiés avec version et date.
- [ ] Essai ou abonnement impossible sans acceptation ; nouvelle version → acceptation redemandée (tests).
- [ ] Premier lien (ou premier plan, selon le réglage) d'un programme bloqué sans déclaration ; déclaration enregistrée avec version, compte et date ; document déposé inaccessible hors de l'organisation (404).
- [ ] Notification simulée → liens suspendus par l'équipe, décision motivée envoyée, trace présente.
- [ ] Liste des sous-traitants ultérieurs identique au registre de L0-09 (vérification à chaque changement).
- [ ] Aucun texte technique sur les pages et dans les e-mails.

## Mesure
- `autorisation_promoteur_declaree` (`document_depose`).

## Points d'attention
- **Questions à l'avocat** : moment de la case (premier lien ou premier plan, `PARCOURS.md` § 8.3, q. 9) ; codes à offrir comme alternative (`OFFRES.md` annexe B, q. 4) ; niveau réel du risque de contrefaçon et opportunité d'exiger une preuve (`recherche/juridique.md` § 8, q. 5).
- **Limite** : une case déclarative ne supprime pas le risque (moyen à élevé) ; le portail distributeurs (L10-05) le règle à la source.
- **Tranché** : la déclaration est construite ici et appelée par L9-04 ; L9-01, L9-02 et L9-04 dépendent désormais de ce ticket.
- **Délais des fournisseurs** : 30 jours de préavis chez OpenRouter, 15 jours d'opposition chez Anthropic, notification de violation à 72 h et 48 h (juridique § 2.2) : nos engagements doivent en tenir compte.
- Réutiliser des plans de clients pour nos tests demande un accord séparé : hors du DPA (juridique § 2.2).

## Références
- produit/recherche/juridique.md § 2.1, § 2.2, § 3.6, § 4.3, § 4.5, § 6, § 7 (n° 12, 13), § 8 ; produit/OFFRES.md § 3.3, § 3.8, § 10, annexe B.
- produit/ARCHITECTURE.md § 4.2 (`acceptations`), § 8.4 ; produit/PARCOURS.md B2, B5, E6, § 8.3 ; produit/MESSAGES.md § 2.10, § 7.9 ; produit/SUIVI.md § 3.12.

## Hors périmètre
- Liens prospects : L9-04. Registre RGPD et DPA des fournisseurs : L0-09. Superposition autorisée : L10-06.
- Contrat promoteur et SLA : L10-01. Pages légales de la bêta : L2-11.
