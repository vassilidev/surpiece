# L8-05 · Factures, historique d'achats, remboursements

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | M (1 à 3 j) | L8-01 | `service/` | À faire |

## Pourquoi
L'e-mail E7 promet « votre facture » en pièce jointe et « Mon compte » doit montrer achats et reçus (`PARCOURS.md` A17). Un remboursement rapide coûte moins qu'un litige (40 € avec la contestation, `OFFRES.md` § 8.3). Les plans achetés sont valables 12 mois, avec un rappel 30 et 7 jours avant l'échéance (`OFFRES.md` § 2.3, E10). À partir du 01/09/2027, les ventes aux particuliers passent en e-reporting (`recherche/auth-paiement.md` § 4.3, § 4.4) : les données doivent être prêtes.

## À faire
1. **Factures** : recommandation, `invoice_creation` dans la session Checkout de L8-01, qui produit une facture Stripe numérotée en séquence continue. Mentions d'auth-paiement § 4.2 : vendeur (dénomination, SIREN, siège, forme, capital), client, numéro, date d'émission et de prestation, désignation, prix unitaire HT, quantité, taux et totaux ; catégorie « prestation de services » en champ personnalisé ; option pour les débits si l'expert-comptable la retient (L0-06). Pack en trois lignes (29 + 15 + 15). `stripe_invoice_id` gardé dans `achats`. Alternative : reçu Stripe seul (la facture n'est pas exigée pour un particulier) ; décision de l'utilisateur, au vu du coût d'Invoicing (0,4 % plafonné).
2. **Historique dans « Mon compte »** (`PARCOURS.md` A17, `MESSAGES.md` § 7.7) : achats (date, produit, montant TTC, lien vers la facture), plans disponibles avec leur date limite (`compte.plans.dispo`), remboursements ; limité à l'organisation du compte (404 sinon).
3. **Remboursements depuis l'administration** (`PARCOURS.md` E5, écran de L5-17) : action « Rembourser » sur un achat, rôle `admin`, motif obligatoire (`journal_equipe`), clé d'idempotence :
   - plans non utilisés : `rembourser_non_utilises` de L8-03 ;
   - ligne consommée (motif `echec`, `defaut_non_corrige`, `geste`) : remboursement Stripe de la ligne, plafonné à son montant, sans mouvement au grand livre ; e-mail au client (texte à ajouter).
4. **Webhook `charge.refunded`** (point d'entrée de L8-01) : `achats.statut` (`rembourse`, partiel ou total), événement `achat_rembourse`. Un remboursement fait à la main dans le tableau de bord Stripe est détecté, rapproché, et déclenche une alerte si les plans correspondants n'ont pas été retirés.
5. **Bouton « Être remboursé »** dans E6 et « Mon compte » après un échec (`PARCOURS.md` A15) : derrière un drapeau, activé seulement si l'utilisateur le retient (L0-05, « remboursement en un clic »). Sinon, remboursement sur simple réponse à l'e-mail.
6. **E10, rappels d'échéance** (`MESSAGES.md` § 7.11) : tâche quotidienne sur les lots `achat` avec un reste, à 30 puis 7 jours de l'expiration ; un envoi par lot et par échéance (clé d'idempotence) ; e-mail transactionnel, sans consentement (`PARCOURS.md` A17).
7. **Export mensuel** `python -m service.paiement.export --mois AAAA-MM` (CSV) : encaissements TTC, HT et TVA par date d'encaissement, remboursements, plans consommés valorisés au prix unitaire de leur lot, plans expirés. Il sert à l'expert-comptable (chiffre d'affaires constaté à la consommation, produits constatés d'avance, auth-paiement § 3.3) et à la plateforme agréée (L9-10) pour l'e-reporting.

## Critères d'acceptation
- [ ] Stripe en mode test : facture de 59 € en trois lignes avec toutes les mentions, vérifiée par un test qui lit la facture par l'API.
- [ ] Remboursement partiel d'un pack depuis l'administration → Stripe, grand livre et historique concordent ; double clic → un seul remboursement.
- [ ] Remboursement fait dans le tableau de bord Stripe → rapproché ; alerte si les plans n'ont pas été retirés.
- [ ] Horloge injectée : lot à J-30 puis J-7 → deux E10, jamais trois ; lot épuisé → aucun e-mail.
- [ ] Export d'un mois simulé : total = achats − remboursements (test) ; aucun identifiant de carte ni adresse e-mail dans le fichier.
- [ ] Historique inaccessible depuis une autre organisation (404) ; aucun texte technique dans les e-mails et les pages.

## Mesure
- `achat_rembourse` (`offre`, `motif`, `montant_ht_centimes`, `partiel`).
- `remboursement_demande` (à ajouter à `SUIVI.md`, seulement si le bouton est retenu).
- `email_envoye` (`modele` : `rappel_expiration_30j`, `rappel_expiration_7j`).

## Points d'attention
- **Découpage** : la fonction de remboursement est créée par L8-03 (P0) et réutilisée ici ; l'e-reporting est transmis par la plateforme de L9-10, ce ticket n'en prépare que les données.
- **Tranché** : L8-07 (ouverture publique, J1) dépend désormais de ce ticket, puisqu'E7 promet la facture et `PARCOURS.md` A17 les reçus. Le choix entre facture Stripe et reçu seul (point 1) reste à l'utilisateur ; E7 ne promet que ce qui est retenu.
- **Rappel de fin d'hébergement de la visite** (`PARCOURS.md` A17, « à ajouter ») : sans ticket ; à rattacher à L5-20.
- TVA exigible à l'encaissement ou option pour les débits : arbitrage de l'expert-comptable (L0-06), qui change les mentions de la facture et l'e-reporting.
- Le mot « crédit » peut figurer sur une facture (document interne et comptable, `OFFRES.md` § 1) ; les e-mails au client disent « plan ».

## Références
- produit/recherche/auth-paiement.md § 3.2, § 3.3, § 4.1 à § 4.5 ; produit/OFFRES.md § 2.3, § 2.6, § 6.5, § 8.3.
- produit/PARCOURS.md A15, A17, E5 ; produit/MESSAGES.md § 7.7, § 7.11 (E6, E7, E10) ; produit/SUIVI.md § 3.8, § 3.10.
- tickets L5-07 (grand livre), L5-17 (administration), L8-03 (`rembourser_non_utilises`).

## Hors périmètre
- Renonciation et remboursement dans les 14 jours : L8-03. Facturation électronique et e-reporting transmis : L9-10.
- Écran d'administration : L5-17. Abonnements et factures des pros : L9-01.
