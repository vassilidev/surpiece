# L9-10 · Facturation électronique

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | M (1 à 3 j) | L9-01, L0-06 | `service/` | À faire |

## Pourquoi
Réforme de la facturation électronique (`recherche/auth-paiement.md` § 4.3) : la **réception** par une plateforme agréée est obligatoire depuis le 01/09/2026 (traitée par L0-06) ; l'**émission** et l'**e-reporting** le deviennent au plus tard le 01/09/2027 pour une PME, plus tôt si un client l'exige (les grands promoteurs émettent et reçoivent déjà en électronique). Stripe Billing et Invoicing ne produisent ni n'envoient de factures électroniques : il faut une application de plateforme agréée branchée sur Stripe, ou l'outil comptable s'il est lui-même plateforme agréée (§ 4.5). Sanctions : 50 € par facture non électronique, 250 € par transmission d'e-reporting manquante (plafonds de 15 000 € par an). Ticket M4.5.

## À faire
1. **Choisir la plateforme** (décision de l'utilisateur, avec l'expert-comptable de L0-06). Options :
   - (a) l'outil comptable, s'il est plateforme agréée et reçoit déjà nos factures : une seule plateforme pour la réception, l'émission et l'e-reporting (**recommandé**) ;
   - (b) Billit, application de l'App Marketplace de Stripe, qui produit du Factur-X ;
   - (c) Pennylane branché sur Stripe.
   Critères : présence sur la liste officielle d'impots.gouv.fr (à vérifier le jour du choix), connecteur Stripe (Billing, Invoicing, Checkout), e-reporting B2C à partir des paiements Stripe, prix, export et réversibilité. Consigner dans `produit/decisions/facturation-electronique.md` (emplacement proposé).
2. **Côté produit** :
   - SIREN et numéro de TVA des clients pros collectés et vérifiés (L9-01, L9-02) ;
   - catégorie « prestation de services » sur chaque produit ; mentions obligatoires de 09/2026 (SIREN du client, catégorie, option pour les débits le cas échéant) sur les factures Stripe ;
   - identifiant de facture Stripe gardé dans `abonnements`, `achats` et au grand livre, pour les rapprochements ;
   - clients pros hors de France : autoliquidation, numéro vérifié dans VIES, déclaration européenne de services, ou refus au lancement.
3. **Brancher** l'émission des factures d'abonnement (L9-01), de recharges (L9-13), de codes (L9-09) et des promoteurs (devis, puis factures produites par L10-09) en Factur-X ou UBL vers la plateforme du client ; l'e-reporting des ventes aux particuliers (transactions, et paiements si la TVA reste exigible à l'encaissement) à partir de l'export de L8-05.
4. **Entrée anticipée** volontaire si un client l'exige (permise, auth-paiement § 4.4).
5. **Procédure écrite** : vérification mensuelle des rejets de la plateforme et des écarts entre Stripe et la plateforme ; qui la fait.

## Critères d'acceptation
- [ ] Décision consignée : plateforme, date d'entrée, option pour les débits ou non.
- [ ] Facture d'un abonnement de test (Stripe en mode test) convertie et transmise dans l'environnement de test de la plateforme, avec SIREN du client et catégorie.
- [ ] E-reporting de test d'un mois de ventes aux particuliers accepté par la plateforme.
- [ ] Mise en production au plus tard le 01/09/2027 ; rappel programmé 3 mois avant.
- [ ] Aucun secret de la plateforme dans le dépôt ; clés au gestionnaire de secrets.

## Points d'attention
- **Chevauchement avec L8-05** (« préparation de l'e-reporting B2C ») : L8-05 prépare les données, ce ticket les transmet.
- **Priorité** : P0 pour le lot 9, mais l'échéance légale est le 01/09/2027 ; l'ordre réel dépend du premier client qui l'exige.
- **Option pour les débits** : elle supprime l'e-reporting des paiements mais avance l'exigibilité de la TVA ; arbitrage de l'expert-comptable.
- Liste des plateformes : 101 publiées en janvier 2026, environ 150 fin août selon des sources secondaires (non vérifié).
- Un intermédiaire revendeur (MoR) changerait la nature de nos obligations ; écarté (auth-paiement § 2.4).

## Références
- produit/recherche/auth-paiement.md § 2.2, § 2.4, § 4.1 à § 4.5, § 5 ; produit/OFFRES.md § 3.7, § 4.8, § 10 (risque 19).
- produit/ARCHITECTURE.md M4.5, § 4.2 (`organisations.siren`, `tva_intracom`) ; produit/SUIVI.md § 3.13 (`facture_emise`, facultatif).
- tickets L0-06 (réception), L8-05 (export), L9-01, L9-09, L9-13, L10-09.

## Hors périmètre
- Réception des factures fournisseurs : L0-06. Factures des particuliers : L8-05.
- Contrat promoteur : L10-01. Devis, bons de commande et factures des promoteurs : L10-09, qui passe par ce ticket pour l'émission électronique.
