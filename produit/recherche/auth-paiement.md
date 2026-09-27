# Authentification, paiement, crédits et facturation

Recherche du 27/09/2026. Tous les prix sont ceux affichés par les éditeurs à cette date (hors TVA sauf mention). Chaque fait externe est suivi de sa source ; « non vérifié » signale ce que je n'ai pas pu confirmer sur une source primaire.

Hypothèses de travail : backend Python (FastAPI ou équivalent, la chaîne actuelle est en Python), société française soumise à la TVA, clientèle très majoritairement française. Les prix de vente cités en exemple (29 €, 149 €) sont fictifs et servent seulement à comparer les frais.

---

## 0. En bref

**Authentification.** Je recommande une **auth maison minimale au lancement** : lien magique et Google, puis Apple, dans FastAPI, avec les organisations et les rôles stockés dans notre base en UE. Le **SSO SAML** viendra ensuite par un **broker branché à la demande** (Zitadel Cloud en région UE ou Keycloak auto-hébergé, sinon WorkOS SSO facturé par connexion) quand un promoteur l'exigera. Auth0 reste possible, mais quatre points vérifiés jouent contre lui :
1. le lien magique n'est pas pris en charge dans l'écran de connexion hébergé (Universal Login), qui propose un code à usage unique à la place ;
2. l'offre gratuite ne permet que 5 Organizations ;
3. plusieurs domaines personnalisés (la marque blanche par domaine) sont réservés à l'offre Enterprise ;
4. le prix des offres B2B monte vite (2 100 $/mois à 10 000 MAU en B2B Essentials).

En B2C pur, en revanche, son offre gratuite est généreuse (jusqu'à 25 000 MAU).

**Paiement.** **Stripe en direct, sans intermédiaire revendeur (Merchant of Record)** :
- particuliers : Checkout en paiement unique pour des packs de crédits ;
- conseillers : Checkout en abonnement, avec Billing et le portail client ;
- promoteurs : devis puis facture.

Stripe Tax n'est pas nécessaire tant que les ventes restent en France. Paddle, Lemon Squeezy et Stripe Managed Payments coûtent 3,5 à 5 points de plus sur chaque vente pour un gain faible quand les clients sont français, et Managed Payments ne gère pas les domaines personnalisés.

**Crédits.** Il faut **notre propre grand livre dans Postgres**, en ajout seul, par lots avec date d'expiration, avec réservation, confirmation ou libération (le remboursement se fait automatiquement si la génération échoue). Les « billing credits » de Stripe ne conviennent pas : ce sont des montants en devise, imputés seulement sur les factures d'abonnements au compteur (voir 2.3).

**Anti-abus du crédit gratuit.** Plusieurs mesures se combinent :
- e-mail vérifié par le lien magique, normalisé, sans domaine jetable ;
- un crédit par e-mail et par compte Google ;
- un seul crédit gratuit par empreinte de fichier plan ;
- Cloudflare Turnstile à l'inscription ;
- limites par IP ;
- une clé OpenRouter réservée au gratuit, avec plafond quotidien.

**Facturation électronique.**
- La **réception passe par une plateforme agréée depuis le 1er septembre 2026** pour toutes les entreprises, et elle est donc déjà due.
- L'**émission et l'e-reporting deviennent obligatoires le 1er septembre 2027** pour les PME et micro-entreprises.
- Stripe n'est pas une plateforme agréée : on y branche une application du Stripe App Marketplace (Billit ou Pennylane cités par Stripe) ou notre outil comptable s'il est une plateforme agréée.

---

## 1. Authentification

### 1.1 Besoins

| Besoin | Détail |
|---|---|
| Particuliers | Connexion sans mot de passe (lien magique), Google, Apple. Usage ponctuel : quelques connexions autour de l'achat. |
| Pros (CGP, agents, mandataires, commercialisateurs) | Comptes multi-utilisateurs par cabinet (propriétaire, admin, membre), invitations, crédits partagés au niveau du cabinet. |
| Prospects des pros | Ouvrent un lien de visite. **Ils ne doivent pas avoir de compte** : lien signé, non devinable, révocable, avec expiration et journal d'ouverture pour la qualification. Avantage direct : ils ne comptent pas dans les MAU facturés par un fournisseur d'auth. |
| Promoteurs (plus tard) | SSO SAML ou OIDC avec leur annuaire d'entreprise. |
| Marque blanche | Domaine du client (ex. `visite.client.fr`) et écran de connexion à ses couleurs. |
| RGPD | Données hébergées dans l'UE, fournisseur de préférence non soumis au droit américain. |
| Coût | Maîtrisé à 1 000, 10 000 et 100 000 utilisateurs. |
| Dépendance | Pouvoir changer de fournisseur sans casser les comptes. |

Un point de contexte juridique : le cadre UE–États-Unis de transfert de données (Data Privacy Framework) a été validé par le Tribunal de l'UE le 3/09/2025 (affaire Latombe, T-553/23). Un pourvoi devant la CJUE a été formé le 31/10/2025 et reste pendant ([IAPP](https://iapp.org/news/a/european-general-court-dismisses-latombe-challenge-upholds-eu-us-data-privacy-framework), [WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)). Un fournisseur américain reste donc utilisable légalement aujourd'hui, avec un risque juridique qui n'est pas nul.

### 1.2 Comparatif

| | Auth0 (Okta) | Clerk | WorkOS AuthKit | Supabase Auth | Zitadel | Keycloak (auto-hébergé) | Auth maison (FastAPI) |
|---|---|---|---|---|---|---|---|
| Lien magique | Oui, **mais pas en Universal Login** (code à usage unique à la place ; en Classic Login, le lien doit être ouvert dans le même navigateur) [1] | Oui [5] | « Magic Auth » [8] | Oui | Non vérifié (passkeys et OTP documentés) | Via l'extension open source Phase Two [16] | Oui, à écrire (~1 à 2 jours) |
| Google, Apple | Oui (connexions sociales illimitées) [2] | Oui (3 connexions sociales en Hobby) [5] | Oui [8] | Oui | Oui (3 fournisseurs d'identité externes en Free/Pro) [12] | Oui | Oui (OIDC via Authlib) ; Apple impose un compte Apple Developer payant (non vérifié : 99 $/an) |
| Organisations B2B | Organizations : 5 en Free, illimitées en B2B Essentials/Pro [2] | 100 organisations incluses, puis 1 $/organisation/mois [5] | Oui | **Non natif** (à modéliser dans Postgres) | Natif, illimité [11] | « Organizations » en disponibilité générale depuis Keycloak 26 [15] | Tables `organizations`/`memberships` |
| SSO SAML | 1 connexion en Free ; 3 en B2B Essentials, 5 en B2B Pro, +100 $/mois par connexion supplémentaire [2] | 1 incluse en Pro, puis 75 $/mois dégressif [5] | 125 $/connexion/mois (1 à 15), dégressif [8] | 50 utilisateurs SSO inclus, puis 0,015 $/utilisateur SSO actif [9] | Oui (fournisseurs externes) | Oui, natif | Non : à déléguer à un broker le jour venu |
| Marque blanche : couleurs | Branding par organisation (logo, couleurs) [3] | Suppression de la marque Clerk en Pro [5] | Oui | On construit l'écran soi-même | Branding par organisation [13] | Thèmes | Total : c'est notre page |
| Marque blanche : domaines | 1 domaine perso (Free, carte bancaire exigée) ; **plusieurs domaines = Enterprise uniquement** (jusqu'à 20 par tenant) [2][4] | « Satellite domains » à 10 $/mois chacun [5] | Domaine perso à 99 $/mois [8] | 10 $/domaine/mois/projet [9] | 1 inclus en Pro, 50 $ par domaine supplémentaire [12] | Illimité (URL frontale par realm) | Illimité (le domaine du client pointe en CNAME vers l'app) |
| Région UE | Cloud public « Europe » (Francfort possible), sous-région non choisie [6] | **US uniquement** [7] | **US uniquement** [7][10] | Oui, région au choix (Paris eu-west-3, Francfort…) [14] | UE, Suisse, US, Australie [11] | Là où on l'héberge | Là où on l'héberge |
| Éditeur | Okta (US) | US | US | US (données en UE) | ZITADEL Inc. (US) et CAOS AG (Saint-Gall, CH) [17] | Projet open source (Apache 2.0) | Nous |
| SDK Python | Officiels : `auth0-fastapi`, `auth0-server-python`, `auth0-api-python` [18] | `clerk-backend-api` (vérification des jetons ; l'écran de connexion est en JS) [19] | `workos-python` officiel [20] | `supabase-py` | OIDC standard | OIDC standard (`python-keycloak`) | Natif |
| Dépendance | Forte (règles, Actions, Organizations) | Forte (UI en JS) | Moyenne | Moyenne (liée à Postgres) | Faible (OIDC, AGPL-3.0 depuis la v3 [21]) | Faible | Nulle |

### 1.3 Coût mensuel à 1 000, 10 000 et 100 000 utilisateurs actifs

MAU (Auth0, WorkOS, Supabase), MRU (Clerk : utilisateur revenu au moins 24 h après l'inscription) et DAU (Zitadel) sont des métriques différentes. Pour des acquéreurs qui se connectent peu, le nombre d'actifs sur un mois sera bien inférieur au nombre d'inscrits. Le tableau prend le pire cas (actifs = utilisateurs).

| Fournisseur | 1 000 | 10 000 | 100 000 | Remarques |
|---|---|---|---|---|
| Auth0 Free | 0 $ | 0 $ | Non (plafond 25 000 MAU) | 5 Organizations, 1 SSO, 1 domaine, logs gardés 1 jour, pas de MFA Pro [2] |
| Auth0 B2C Essentials | 70 $ | 700 $ | Sur devis (3 500 $ à 50 000) | [2] |
| Auth0 B2B Essentials | 300 $ | 2 100 $ | Sur devis (dès 30 000) | Organizations illimitées [2] |
| Auth0 B2B Professional | 800 $ | 2 400 $ | Sur devis (dès 20 000) | [2] |
| Clerk Pro | 25 $ | 25 $ | ~1 025 $ (25 $ + 50 000 × 0,02 $) | Plus les organisations au-delà de 100, le SSO et les domaines satellites [5] |
| WorkOS AuthKit | 0 $ (+99 $ domaine) | 0 $ (+99 $) | 0 $ (+99 $) | Gratuit jusqu'à 1 M MAU ; SSO 125 $/connexion [8] |
| Supabase Pro | 25 $ | 25 $ | 25 $ | 100 000 MAU inclus puis 0,00325 $/MAU ; hors calcul du projet et hors domaine [9] |
| Zitadel Cloud Pro | 100 $ | 100 $ | 100 $ (si ≤ 25 000 actifs par jour) | Free : 100 DAU seulement [11][12] |
| Keycloak auto-hébergé | Serveur + Postgres | idem | idem | Coût surtout humain : mises à jour, sécurité, Java |
| Auth maison | ~0 € (envoi d'e-mails) | idem | idem | Coût de développement initial et de maintenance |

Chez Auth0, dépasser son palier trois mois de suite déclenche un passage automatique au palier supérieur, d'après une source secondaire (non vérifié sur auth0.com) ([Siit](https://www.siit.io/tools/trending/auth0-review)).

### 1.4 Auth0 en détail (l'option vers laquelle penche l'utilisateur)

**Pour :**
- L'offre gratuite couvre 25 000 MAU, avec connexion sans mot de passe, connexions sociales illimitées, 1 domaine personnalisé, 5 Organizations, 1 connexion d'entreprise, SCIM et personnalisation de la marque [2].
- Des SDK Python officiels existent pour FastAPI [18].
- Une région UE est disponible [6], et un branding par organisation aussi [3].
- On ne code pas l'auth.

**Contre (vérifié) :**
1. **« Magic Links are not supported for Universal Login »** [1]. Le particulier recevrait un code à 6 chiffres, pas un lien. En Classic Login, le lien doit être ouvert dans le même navigateur : sur iPhone, un lien ouvert depuis Gmail part dans Safari et échoue [1].
2. **5 Organizations en Free** [2]. Si on s'appuie sur Organizations pour les cabinets de CGP, il faut passer en B2B dès le 6e cabinet : 300 $/mois à 1 000 MAU, 2 100 $/mois à 10 000. On peut l'éviter en gardant les organisations dans notre base, mais on perd alors l'intérêt d'Organizations (branding par cabinet, SSO par cabinet).
3. **Plusieurs domaines personnalisés : Enterprise uniquement** (« Multiple Custom Domains », disponibilité générale en avril 2026, 20 domaines par tenant de base) [4]. Une marque blanche avec le domaine de chaque client n'est donc pas accessible en libre-service.
4. Éditeur américain (Okta), soumis au droit américain.
5. Au-delà de 20 000 à 30 000 MAU en B2B, c'est sur devis [2].

**Si Auth0 est choisi malgré tout**, voici comment limiter les risques :
- un tenant en région UE ;
- deux tenants (B2C sur l'offre gratuite, B2B séparé) pour ne pas payer le tarif B2B sur les particuliers ;
- le code e-mail à la place du lien magique ;
- les organisations, les rôles et les crédits gardés dans notre base, avec Auth0 réduit à « qui est-ce » (le `sub` associé à notre `user_id`) ;
- aucune logique métier dans les Actions Auth0.

Sans mot de passe stocké chez Auth0, une migration ultérieure reste simple : on renvoie un lien ou un code, sans reprise de hachages de mots de passe.

### 1.5 Recommandation

**Phase 1 (lancement, particuliers et premiers conseillers) : auth maison dans FastAPI.**
- **Lien magique.** Jeton aléatoire de 32 octets, stocké **haché**, à usage unique, valable 15 minutes, associé à l'e-mail et non au navigateur (il fonctionne donc sur iPhone quel que soit le navigateur ouvert). Le même e-mail contient un code à 6 chiffres en secours. Limitation par e-mail et par IP.
- **Google** en OIDC (Authlib). **Apple** dans un second temps : compte Apple Developer requis, et l'adresse relais « Masquer mon adresse » impose d'enregistrer le domaine d'envoi chez Apple (non vérifié en détail).
- **Session.** Identifiant opaque en base, cookie `HttpOnly; Secure; SameSite=Lax`, rotation à la connexion, révocation, protection CSRF sur les formulaires.
- **Modèle de données.** `users`, `organizations` (branding : logo, couleurs, domaine), `memberships` (rôle), `invitations` (lien magique d'invitation), `identities` (fournisseur et `sub`, pour brancher plus tard Google, Apple, SAML ou un broker sans migration).
- **Marque blanche.** Le client fait pointer `visite.client.fr` vers nous, et le certificat TLS est émis automatiquement (par exemple TLS à la demande côté proxy ; choix de l'outil et coût non vérifiés). La page de connexion prend les couleurs de l'organisation trouvée à partir du domaine.
- **Liens prospects.** Jeton signé, révocable, sans compte.
- **Pourquoi.** Coût nul quel que soit le volume, données en UE, marque blanche illimitée, aucune dépendance, et un lien magique fiable. Sans mot de passe, la surface d'attaque est réduite : pas de base de hachages, pas de réinitialisation.
- **Risque.** La sécurité est à notre charge. Il faut donc des tests automatiques (jeton rejoué, expiré, falsifié, énumération d'e-mails, limitation de débit), dans l'esprit de la règle « tout défaut devient un contrôle ».

**Phase 2 (premier promoteur qui exige le SSO) : broker SAML branché comme « un fournisseur d'identité de plus ».**
- Premier choix : **Zitadel Cloud en région UE** (Pro 100 $/mois, organisations et branding natifs) ou **Keycloak auto-hébergé** (gratuit, SAML natif, Organizations en disponibilité générale depuis la version 26).
- Solution rapide : **WorkOS SSO** à 125 $/connexion/mois, refacturé dans l'offre Entreprise. Ses données sont hébergées aux États-Unis.
- Dans notre base, une organisation reçoit un `idp` et un domaine e-mail, et la connexion de ses membres passe par ce fournisseur.

**Alternative raisonnable si on ne veut pas coder l'auth : Supabase Auth en région Paris.** Elle coûte 25 $/mois jusqu'à 100 000 MAU, avec lien magique, Google, Apple et SAML inclus. En contrepartie, il faut modéliser soi-même les organisations et construire l'écran, et le domaine personnalisé est unique par projet.

---

## 2. Paiement

### 2.1 Stripe : tarifs France (stripe.com/fr/pricing, consulté le 27/09/2026) [22][23]

| Poste | Tarif |
|---|---|
| Carte standard EEE | 1,5 % + 0,25 € |
| Carte premium EEE | 2,8 % + 0,25 € |
| Carte britannique | 2,5 % + 0,25 € |
| Carte internationale | 3,15 % + 0,25 € (+2 % en cas de conversion de devise) |
| Prélèvement SEPA | 0,35 € |
| Billing (abonnements) | 0,7 % du volume facturé via Billing (offres annuelles à partir de 500 €/mois) |
| Tax | 0,5 % par transaction (sans code) ou 0,45 € par transaction (API), **seulement là où on est immatriculé** |
| Invoicing | 0,4 % par facture payée (la page FR indique un plafond de 2 $ par facture) |
| Litige | 20 € par litige reçu, et 20 € de frais de contestation, remboursés en cas de victoire |
| Domaine personnalisé (Checkout, portail) | 10 $/mois |

Ce qui est inclus dans Billing [23] :
- le portail client (changer de carte, voir les factures, résilier) ;
- les relances automatiques ;
- les « Smart Retries » (nouvelles tentatives de prélèvement optimisées) ;
- les devis ;
- les abonnements en plusieurs phases.

### 2.2 Usage recommandé par cible

| Cible | Produit Stripe | Notes |
|---|---|---|
| Particulier | **Checkout en paiement unique** (pack de 1, 3 ou 5 plans) | Pas de frais Billing. Carte, Apple Pay, Google Pay. Le webhook `checkout.session.completed` crédite le grand livre (clé d'idempotence = identifiant de la session). |
| Conseiller | **Checkout en abonnement, Billing et portail client** | Prélèvement SEPA proposé (0,35 €), collecte du numéro de TVA, quantité = nombre de sièges si besoin. Le webhook `invoice.paid` alloue les crédits du mois. |
| Promoteur | Devis, puis facture (**Stripe Invoicing** ou directement l'outil de facturation électronique), paiement par virement | Volumes et prix négociés. |
| Stripe Tax | **Pas au départ** | Ventes en France : taux fixe de 20 % saisi dans Stripe. À activer si les ventes B2C transfrontalières dans l'UE dépassent 10 000 € HT par an (voir 4.1). |

### 2.3 Crédits : fonctions Stripe ou grand livre maison ?

Les **billing credits** de Stripe (objet « Credit Grant ») [24] :
- sont des **montants en devise**, pas des unités (« 1 plan ») ;
- ne s'appliquent **qu'aux abonnements à prix au compteur** (compteurs Stripe) ;
- ne s'appliquent **pas aux factures ponctuelles**, ni aux paiements Checkout uniques, ni aux prix fixes ;
- ne se déduisent qu'à la **finalisation de la facture**, donc à la fin de la période, et non au moment de lancer une génération ;
- sont limités à 100 attributions non consommées par client ;
- un avoir ne restitue pas les crédits.

Pour les frais, depuis la disponibilité générale (premier semestre 2026), **les crédits imputés comptent dans le volume Billing** facturé à 0,7 % [25].

Stripe a finalisé le rachat de Metronome (facturation à l'usage) le 14/01/2026 [26]. L'offre intégrée qui en sortira n'est pas documentée publiquement pour notre cas (non vérifié).

**Conclusion.** Il faut **un grand livre maison** (voir 3), qui décide en temps réel si une génération peut partir. Stripe encaisse l'argent et notre base compte les crédits. Un rapprochement quotidien vérifie que chaque paiement Stripe a bien produit un crédit, et inversement.

### 2.4 Intermédiaires revendeurs (Merchant of Record, MoR)

Le MoR est le vendeur légal : il encaisse, calcule, déclare et reverse la TVA de tous les pays, et gère les litiges et le support de paiement.

| | Frais | Points notables |
|---|---|---|
| Paddle | **5 % + 0,50 $** par transaction, sur devis sous 10 $ [27] | TVA et facturation dans le monde entier, gestion des litiges, support. |
| Lemon Squeezy | **5 % + 0,50 $**, plus des frais hors États-Unis non chiffrés [28] | Racheté par Stripe en 2024. En 2026, migration annoncée vers Stripe Managed Payments, sans date [29]. |
| Stripe Managed Payments | **3,5 % en plus** des frais Stripe habituels [30] | Accessible depuis la France pour le SaaS et les services automatisés [31]. Le client voit **Link** comme vendeur (« Sold through Link »), et Link envoie reçus et factures. **Pas de domaine personnalisé sur le Checkout** [32]. Pas de service avec intervention humaine. |

Exemples de frais, avec des prix fictifs et une carte standard de l'EEE (le taux de change pour les 0,50 $ n'est pas vérifié, autour de 0,43 €) :

| Vente | Stripe direct | Stripe Managed Payments | Paddle / Lemon Squeezy |
|---|---|---|---|
| Pack particulier 29 € TTC | 0,69 € (2,4 %) | 1,70 € (5,9 %) | ~1,88 € (6,5 %) |
| Abonnement conseiller 149 € HT (178,80 € TTC), carte | 2,93 € + 1,25 € Billing = 4,18 € (2,3 %) | ≥ 9,19 € (hors Billing) | ~9,37 € (5,2 %) |
| Même abonnement en SEPA | 0,35 € + 1,25 € = 1,60 € (0,9 %) | Prélèvement SEPA non listé parmi les moyens de Managed Payments [32] | — |

**Avis.** Un MoR sert à vendre partout sans gérer la TVA de 27 pays ou plus. Ici, les clients sont français : la TVA est de 20 %, et le B2C dans l'UE reste à la TVA française sous 10 000 € par an. Le MoR coûterait donc 3,5 à 5 points sur **tout** le chiffre d'affaires pour un service dont on n'a presque pas besoin. De plus, le client pro recevrait sa facture du MoR et non de nous. Managed Payments supprime aussi le domaine personnalisé et n'est pas prévu pour les services avec intervention humaine. **Stripe en direct est recommandé.** Il faudra réévaluer si les ventes B2C hors de France décollent.

Avec un MoR, nous ne vendrions plus au client final mais au MoR étranger. Nos obligations de facturation électronique changeraient alors de nature (e-reporting international plutôt que facture électronique domestique). Ce point est **à confirmer avec un expert-comptable** (non vérifié).

---

## 3. Modèle de crédits

### 3.1 Principes du grand livre

- **Ajout seul.** On ne modifie jamais un mouvement ; toute correction passe par un mouvement inverse. Le solde est la somme des mouvements (avec un cache mis à jour dans la même transaction).
- **Lots.** Chaque entrée de crédits forme un lot : source, quantité, reste, date d'expiration, priorité, prix unitaire payé et référence Stripe. On consomme **d'abord ce qui expire le plus tôt**, puis les crédits offerts, puis les crédits d'abonnement, et en dernier les crédits achetés. Stripe applique la même logique pour ses propres crédits [24].
- **Idempotence.** Chaque mouvement porte une clé unique : identifiant d'événement Stripe, identifiant de tâche ou identifiant d'attribution. Un webhook reçu deux fois ne crédite qu'une fois.
- **Porteur du compte.** Le compte de crédits appartient à l'utilisateur (particulier) ou à l'organisation (cabinet, promoteur). Chaque mouvement enregistre qui l'a déclenché.
- **Invariants vérifiés automatiquement :**
  - aucun solde négatif ;
  - pas de réservation ouverte depuis plus d'une heure ;
  - somme des lots = solde ;
  - chaque paiement Stripe réussi a son crédit, et chaque crédit acheté a son paiement.

Schéma indicatif :

```sql
credit_lots(id, account_id, source,          -- purchase | subscription | signup_free | tester | goodwill
            qty_initial, qty_left, expires_at, priority,
            unit_price_cents, stripe_ref, created_at)
credit_moves(id, account_id, lot_id, delta,   -- +n / -n
             kind,                             -- grant | reserve | capture | release | expire | refund | adjust
             job_id, idempotency_key UNIQUE, actor, reason, created_at)
jobs(id, account_id, plan_sha256, state,       -- reserved | running | succeeded | failed
     reserved_move_id, ...)
```

### 3.2 Réservation, confirmation, libération (remboursement automatique)

1. **Au lancement** : dans une transaction avec verrou sur la ligne du compte (`SELECT … FOR UPDATE`), on vérifie le solde, puis on écrit un mouvement `reserve -1` sur le lot prioritaire. La génération démarre.
2. **Succès** : la visite de contrôle passe et la publication n'est pas bloquée (voir la chaîne, `moteur/controle.mjs`). On écrit alors un `capture`, et le crédit est consommé.
3. **Échec** : lecture impossible, contrôle bloquant ou délai dépassé. On écrit un `release +1` automatiquement, **sur le lot d'origine**, et on prévient l'utilisateur (« votre crédit vous a été rendu »).
4. **Tâche orpheline** (serveur redémarré) : une tâche planifiée libère les réservations de plus de N minutes sans résultat.
5. **Remboursement en argent** (Stripe) : on retire d'abord les crédits restants du lot concerné ; si des crédits ont déjà été consommés, la politique inscrite dans les CGV s'applique.

### 3.3 Expiration et abonnements

| Type de crédit | Recommandation |
|---|---|
| Crédits achetés à l'unité (particulier) | Valables 12 mois, date affichée dans le compte, rappel avant l'expiration. Stripe cite 12 mois comme durée raisonnable et insiste : « Customers should never be surprised by lost credits » [33]. |
| Crédits mensuels d'abonnement (pros) | **Non cumulables** : remis à zéro à chaque renouvellement, sur le modèle « X plans inclus par mois ». Variante plus commerciale : report limité à un mois [33]. Au-delà du quota, recharges achetées à l'unité (lot séparé, 12 mois). |
| Crédit offert à l'inscription | 1 génération simple (sans visite), valable 30 jours. |
| Crédits testeurs | Lot `tester` de 30 à 90 jours, non transférable, marqué « offert » (sans chiffre d'affaires), avec le nom du testeur dans le motif. |

**Comptabilité et TVA** (à valider par l'expert-comptable) :
- Pour les prestations de services, la TVA est exigible à l'encaissement, acomptes compris, selon la FAQ de la DGFiP [36]. La TVA sur un pack est donc due au paiement.
- Le chiffre d'affaires se constate à la consommation, avec des produits constatés d'avance entre les deux. Stripe recommande aussi de rattacher le revenu à l'usage réel [33].

**Nature juridique.** La monnaie électronique suppose d'être « acceptée par une personne […] autre que l'émetteur » (art. L315-1 du Code monétaire et financier) [34]. Des crédits utilisables uniquement pour nos propres services ne relèvent donc a priori pas de ce régime (à confirmer par un juriste).

### 3.4 Droit de la consommation (particuliers)

- **Rétractation de 14 jours** pour les contrats à distance. Elle ne s'applique pas si l'exécution a commencé **avec l'accord préalable et exprès** du consommateur et **sa reconnaissance de la perte du droit**, une fois le service entièrement exécuté (art. L221-28 du Code de la consommation) [35]. En pratique :
  - une case à cocher au moment de lancer la génération (pas seulement à l'achat) ;
  - le remboursement sur demande des crédits **non utilisés** pendant 14 jours.
- **Résiliation « en trois clics »** : obligatoire pour tout contrat souscrit en ligne par un consommateur, depuis le 1er juin 2023 (art. L215-1-1 du Code de la consommation) ([ministère de l'Économie](https://presse.economie.gouv.fr/01062023-cp-entree-en-vigueur-de-la-resiliation-en-ligne-des-contrats-en-trois-clics/)). Elle ne concerne que les abonnements vendus à des particuliers. Le portail client Stripe permet de résilier [23], mais le bouton doit rester accessible depuis notre site.

### 3.5 Anti-abus du crédit gratuit

Le coût mesuré est de 1,10 à 1,85 $ par plan complet (CLAUDE.md) ; la génération simple offerte coûte moins, mais pas zéro. Les mesures suivantes se combinent :

1. **E-mail vérifié avant tout crédit.** Le lien magique vérifie l'adresse par construction. On normalise l'adresse avant de tester l'unicité : minuscules, suppression de `+étiquette`, suppression des points pour Gmail.
2. **Domaines jetables refusés** avec la liste open source `disposable-email-domains` (licence CC0, paquet Python disponible) [37].
3. **Un seul crédit gratuit** par e-mail normalisé, par compte Google (`sub`) et par compte Apple.
4. **Un seul crédit gratuit par plan.** L'empreinte SHA-256 du fichier déposé, ou mieux celle de la page rendue, ne donne droit qu'à une génération gratuite, tous comptes confondus. Cela bloque la création de dix comptes pour le même plan. Le même cache interne évite aussi de payer deux fois la même lecture (le résultat reste privé et n'est jamais publié).
5. **Cloudflare Turnstile** à l'inscription : gratuit, sans limite de requêtes annoncée, 20 widgets [38].
6. **Limites par IP** : au plus 3 crédits gratuits par IP (IPv4 /32, IPv6 /64) et par 24 heures ; au-delà, la génération passe en file d'attente et n'est pas refusée sèchement.
7. **Identifiant d'appareil** : un cookie aléatoire posé à la première visite. Pas d'empreinte navigateur sans analyse juridique : la CNIL soumet le fingerprinting aux mêmes règles de consentement que les cookies, avec des exemptions pour certains usages de sécurité [39].
8. **Plafond budgétaire quotidien.** Une **clé OpenRouter dédiée au gratuit** porte une limite de dépense **réinitialisée chaque jour** (les réinitialisations quotidienne, hebdomadaire et mensuelle sont prises en charge, à minuit UTC) [40]. Quand la limite est atteinte, les gratuits partent en file d'attente pour le lendemain avec un message clair, et les payants continuent sur leur propre clé. S'y ajoute un coupe-circuit global dans notre base (nombre de gratuits par jour).
9. **Offre gratuite volontairement limitée** (génération simple sans visite) : l'abus en devient moins intéressant.
10. **Journal et alertes** : tableau des crédits gratuits par jour, par domaine e-mail et par IP, avec une alerte en cas d'écart.

---

## 4. Facturation en France

### 4.1 TVA

| Client | Règle | Source |
|---|---|---|
| Particulier en France | TVA française (20 %). Prix affichés TTC. | — |
| Particulier ailleurs dans l'UE | Service fourni par voie électronique : TVA française tant que le total des ventes B2C transfrontalières dans l'UE reste **sous 10 000 € HT** (année en cours et année précédente). Au-delà, TVA du pays du client, déclarée via le **guichet unique OSS**. Si des étapes manuelles s'ajoutent (saisie assistée), la qualification de « service électronique » est à revoir. | [41][42] |
| Professionnel en France (CGP, promoteur) | TVA française (20 %). Facture électronique obligatoire à partir de notre date d'émission (voir 4.3). | — |
| Professionnel ailleurs dans l'UE | Pas de TVA française. Mention **« Autoliquidation »** et numéro de TVA du client (à vérifier dans VIES), déclaration européenne de services (DES). | [43] |
| Professionnel hors UE | « TVA non applicable – art. 259-1 du CGI ». | [43] |

### 4.2 Mentions obligatoires sur les factures

Mentions déjà obligatoires, d'après Service-public, page vérifiée le 11/08/2026 [44] :
- identité du vendeur (dénomination, SIREN, adresse du siège, forme juridique, capital) ;
- nom et adresse du client ;
- numéro unique en séquence chronologique et continue ;
- date d'émission et date de la prestation ;
- désignation précise ;
- prix unitaire HT, quantité, taux de TVA, totaux HT et TTC ;
- taux des pénalités de retard ;
- **indemnité forfaitaire de 40 €** pour les clients professionnels ;
- conditions d'escompte, ou « néant » ;
- mention d'autoliquidation ou de franchise en base, le cas échéant.

**Quatre nouvelles mentions** sont rendues obligatoires « à compter du 1er septembre 2026 » selon la FAQ de la DGFiP (version du 01/09/2026) [36] :
- le **SIREN du client** ;
- la **catégorie de l'opération** (ici : prestation de services) ;
- l'**option pour le paiement de la TVA d'après les débits**, le cas échéant ;
- l'adresse de livraison si elle diffère de l'adresse de facturation (sans objet ici).

Certaines sources secondaires lient ces mentions à l'entrée dans l'obligation d'émission (2027 pour une PME). Les ajouter dès maintenant ne coûte rien. Stripe permet d'ajouter des champs personnalisés sur les factures, et le SIREN se collecte au moment de l'achat pro.

Pour les particuliers, aucune facture n'est exigée côté client [44]. Stripe envoie de toute façon un reçu ou une facture.

### 4.3 Réforme de la facturation électronique : calendrier exact

Sources primaires : impots.gouv.fr [45][46], FAQ DGFiP du 01/09/2026 [36], guide pratique de démarrage de la DGFiP de juillet 2026 [47].

| Date | Obligation | Qui |
|---|---|---|
| **1er septembre 2026** (en vigueur) | **Recevoir** les factures électroniques **via une plateforme agréée** (PA, ex-PDP) | **Toutes** les entreprises assujetties, quelle que soit leur taille |
| 1er septembre 2026 | **Émettre** en électronique et faire l'e-reporting | Grandes entreprises et ETI (donc la plupart des promoteurs importants) |
| **1er septembre 2027** | **Émettre** en électronique et faire l'**e-reporting** | **PME, TPE, micro-entreprises** (notre cas probable). Une entrée anticipée volontaire est possible. |

Précisions utiles :

- **Périmètre.** Les factures électroniques concernent les opérations entre assujettis **établis en France**. L'**e-reporting** couvre les ventes aux **particuliers** (données agrégées) et les opérations **internationales**, ainsi que les **données de paiement** pour les prestations de services dont la TVA est exigible à l'encaissement. Ces données de paiement ne sont pas dues en cas d'option pour les débits ou d'autoliquidation. La fréquence dépend du régime de TVA : par exemple tous les deux mois en franchise en base, trois fois par mois au réel normal mensuel [36].
- **Formats.** UBL, CII ou un format mixte (Factur-X : PDF/A-3 avec du XML intégré) [46].
- **Plateformes agréées.** Ce sont des opérateurs immatriculés par l'administration pour trois ans renouvelables. Elles émettent, transmettent et reçoivent les factures, et transmettent les données de facture, de transaction et de paiement à l'administration [45]. Une première liste de 101 plateformes a été publiée en janvier 2026 ([economie.gouv.fr](https://www.economie.gouv.fr/actualites/facturation-electronique-la-liste-des-101-premieres-plateformes-agreees-est-disponible)). Des sources secondaires en comptent environ 150 fin août 2026 (non vérifié sur la liste officielle, en téléchargement sur [impots.gouv.fr](https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees), mise à jour le 22/09/2026).
- **Sanctions :**
  - **50 € par facture** non émise sous forme électronique, plafonnés à **15 000 € par an** (art. 1737 III du CGI, version en vigueur depuis le 21/02/2026, [Légifrance](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046869201)) ;
  - **250 € par transmission** d'e-reporting manquante, plafonnés à 15 000 € par an (art. 1788 D du CGI, d'après des sources secondaires, non vérifié sur Légifrance) ;
  - pour la réception, mise en demeure de trois mois avant une amende de 500 €, puis de 1 000 € (art. 1737 IV bis).
- **Tolérance au démarrage.** Le guide de la DGFiP de juillet 2026 annonce qu'il n'y aura pas de sanction pendant la phase de démarrage pour les entreprises « engagées dans une trajectoire sérieuse de mise en conformité ». Il ne s'agit « ni [d']un report ni [d']une suspension de l'obligation » [47].

### 4.4 Impact pour nous

1. **Dès maintenant** (si la société existe et est assujettie) : **choisir une plateforme agréée pour recevoir** les factures de nos fournisseurs français (hébergement, outils). L'obligation court depuis le 1er septembre 2026. En pratique, c'est souvent l'outil comptable ou la banque pro : Pennylane et Qonto figurent parmi les plateformes selon des sources secondaires, à vérifier sur la liste officielle. Les fournisseurs étrangers (OpenRouter, par exemple) ne sont pas concernés par la facture électronique domestique.
2. **Ventes aux CGP, agents et promoteurs français** : ce sont des factures entre assujettis établis en France, donc **en facture électronique via une PA au plus tard le 1er septembre 2027**. Nos gros clients promoteurs émettent et reçoivent déjà en électronique. Prévoir d'entrer tôt de façon volontaire si un promoteur l'exige : c'est permis [36].
3. **Ventes aux particuliers** : **e-reporting** des données de transaction à partir du 1er septembre 2027, et e-reporting des données de paiement si la TVA reste exigible à l'encaissement (cas par défaut des services). L'**option pour les débits** supprime l'e-reporting de paiement mais avance l'exigibilité de la TVA : arbitrage à faire avec l'expert-comptable.
4. **Clients étrangers** (promoteurs belges, par exemple) : e-reporting international.
5. Les CGP ont en général des activités en partie exonérées de TVA, mais ils restent des assujettis : ils entrent dans le champ de la réforme (à confirmer au cas par cas avec l'expert-comptable).

### 4.5 Comment Stripe s'y branche

- Stripe l'écrit lui-même : **Stripe Billing et Stripe Invoicing ne produisent ni n'envoient de factures électroniques**. Il renvoie vers des applications tierces de son App Marketplace, **Billit** et **Pennylane**, qui convertissent les factures Stripe et les transmettent par leur point d'accès (page mise à jour le 20/08/2026) [48]. Billit est présentée par Stripe comme générant du Factur-X [49].
- **Schéma cible :**
  - Stripe (Checkout, Billing, Invoicing) crée la facture ;
  - une application de plateforme agréée connectée à Stripe la convertit en Factur-X ou UBL et l'envoie à la plateforme du client ;
  - la même plateforme fait l'e-reporting B2C à partir des paiements Stripe.
- Si l'outil comptable est lui-même une plateforme agréée, on garde **une seule** plateforme pour l'émission, la réception et l'e-reporting. Un changement de plateforme reste possible, mais l'annuaire doit être mis à jour [36].
- **Ce qu'il faut côté produit** :
  - collecter le SIREN et le numéro de TVA des clients pros à l'achat (Checkout le permet) ;
  - donner à chaque produit sa catégorie « prestation de services » ;
  - conserver l'identifiant Stripe de la facture dans le grand livre pour les rapprochements.

---

## 5. À confirmer avant de décider

- Auth0 : passage automatique au palier supérieur après trois mois de dépassement (source secondaire).
- Zitadel : prise en charge du lien magique ; tarif exact au-delà de 25 000 DAU ; domaine personnalisé par organisation selon l'offre.
- WorkOS : nombre de domaines personnalisés possibles (marque blanche par client).
- Apple Developer Program : prix actuel (page Apple indisponible lors de la recherche).
- Stripe Managed Payments : application ou non des frais Billing en plus des 3,5 % ; conséquences sur la facturation électronique avec Link comme vendeur.
- Montant de l'amende e-reporting (art. 1788 D) sur Légifrance ; nombre exact de plateformes agréées sur la liste officielle.
- Avec l'expert-comptable :
  - régime de TVA de la société (franchise ou réel) ;
  - option pour les débits ;
  - traitement comptable et TVA des packs de crédits (bons à usage unique ?) ;
  - statut des CGP ;
  - effet d'un MoR sur nos obligations.

---

## Sources

[1] Auth0, *Passwordless with Magic Links* : https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-magic-link
[2] Auth0, tarifs : https://auth0.com/pricing et https://auth0.com/pricing.md
[3] Auth0, *B2B Branding* : https://auth0.com/docs/get-started/architecture-scenarios/business-to-business/branding
[4] Auth0, *Multiple Custom Domains* : https://auth0.com/blog/unlimited-brand-experiences-auth0-multiple-custom-domains/ ; https://auth0.com/docs/customize/custom-domains/multiple-custom-domains
[5] Clerk, tarifs : https://clerk.com/pricing
[6] Auth0, régions : https://auth0.com/blog/unified-login-flows-and-data-location-choices-in-dach/ ; https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region
[7] Auth Omnibus, *Data residency* (page datée du 16/04/2025) : https://authomnibus.com/provisioning/data-residency/
[8] WorkOS, tarifs : https://workos.com/pricing.md
[9] Supabase, tarifs : https://supabase.com/pricing
[10] WorkOS, blog sur la résidence des données : https://workos.com/blog/data-residency-for-enterprise-saas
[11] Zitadel, tarifs : https://zitadel.com/pricing
[12] Zitadel, tarifs détaillés : https://zitadel.com/pricing/detail
[13] Zitadel, branding : https://zitadel.com/docs/guides/manage/customize/branding
[14] Supabase, régions : https://supabase.com/docs/guides/platform/regions
[15] Keycloak, Organizations : https://www.keycloak.org/2024/06/announcement-keycloak-organizations
[16] Phase Two, extension lien magique pour Keycloak : https://github.com/p2-inc/keycloak-magic-link
[17] Zitadel, société : https://www.cbinsights.com/company/zitadel ; https://zitadel.com/gdpr
[18] Auth0, SDK Python : https://github.com/auth0/auth0-fastapi ; https://github.com/auth0/auth0-server-python ; https://github.com/auth0/auth0-api-python
[19] Clerk, SDK Python : https://github.com/clerk/clerk-sdk-python
[20] WorkOS, SDK Python : https://github.com/workos/workos-python
[21] Zitadel, passage à l'AGPL-3.0 : https://zitadel.com/blog/apache-to-agpl
[22] Stripe, tarifs France : https://stripe.com/fr/pricing ; https://stripe.com/en-fr/pricing
[23] Stripe Billing, tarifs : https://stripe.com/fr/billing/pricing
[24] Stripe, *Billing credits* : https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits
[25] Stripe, frais des billing credits : https://support.stripe.com/questions/billing-credits-pricing-understanding-credit-funding-and-applications
[26] Stripe, rachat de Metronome : https://stripe.com/newsroom/news/stripe-completes-metronome-acquisition
[27] Paddle, tarifs : https://www.paddle.com/pricing
[28] Lemon Squeezy, tarifs : https://www.lemonsqueezy.com/pricing
[29] Lemon Squeezy, point 2026 : https://www.lemonsqueezy.com/blog/2026-update
[30] Stripe, tarif de Managed Payments : https://support.stripe.com/questions/managed-payments-pricing
[31] Stripe, éligibilité à Managed Payments : https://docs.stripe.com/payments/managed-payments/eligibility
[32] Stripe, fonctionnement de Managed Payments : https://docs.stripe.com/payments/managed-payments/how-it-works
[33] Stripe, modèle d'abonnement à crédits (mis à jour le 04/04/2025) : https://stripe.com/resources/more/what-is-a-credits-based-subscription-model-and-how-does-it-work
[34] Code monétaire et financier, art. L315-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027007558
[35] Code de la consommation, art. L221-28 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170
[36] DGFiP, FAQ *Je découvre la facturation électronique* (version du 01/09/2026) : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/faq---fe_je-decouvre-la-facturation-electronique.pdf
[37] disposable-email-domains : https://github.com/disposable-email-domains/disposable-email-domains
[38] Cloudflare, Turnstile : https://blog.cloudflare.com/turnstile-ga/ (le détail des limites de l'offre gratuite vient de sources secondaires)
[39] CNIL, fingerprinting : https://www.cnil.fr/fr/definition/fingerprinting ; https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi
[40] OpenRouter, limites des clés : https://openrouter.ai/docs/api_reference/limits ; https://openrouter.ai/docs/features/provisioning-api-keys
[41] BOFiP, services fournis par voie électronique : https://bofip.impots.gouv.fr/bofip/11964-PGP.html/identifiant=BOI-TVA-CHAMP-20-50-40-20-20190925
[42] impots.gouv.fr, guichet unique TVA (OSS) : https://www.impots.gouv.fr/professionnel/jutilise-le-guichet-unique-tva-ioss-oss
[43] impots.gouv.fr, prestations entre assujettis : https://www.impots.gouv.fr/professionnel/prestations-entre-assujettis
[44] Service-public Entreprendre, mentions obligatoires sur les factures : https://entreprendre.service-public.gouv.fr/vosdroits/F31808
[45] impots.gouv.fr, plateformes agréées : https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees
[46] impots.gouv.fr, *Je découvre la facturation électronique* : https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique
[47] DGFiP, guide pratique de démarrage au 1er septembre 2026 (juillet 2026) : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf
[48] Stripe, facturation électronique en France (mise à jour le 20/08/2026) : https://stripe.com/resources/more/e-invoicing-france
[49] Stripe, Factur-X : https://stripe.com/resources/more/factur-x-format-france
