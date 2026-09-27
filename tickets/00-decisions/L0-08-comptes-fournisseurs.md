# L0-08 · Ouvrir les comptes fournisseurs et les clés

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | S (jusqu'à 1 j) | L0-03, L0-06 | — | À faire |

## Pourquoi
La bêta express (L3-05), la préproduction (L5-18) et la CI (L1-11) ont besoin de comptes chez les fournisseurs retenus par L0-03. Les plafonds des clés OpenRouter sont le second verrou de la décision 3 (le premier est dans le logiciel). Certains réglages sont irréversibles (région de Sentry) ou protègent déjà l'outil local (clé `dev` plafonnée, ZDR au niveau du compte).

## À faire
1. **Scaleway** (si D2 est confirmé) : organisation ; deux projets séparés, préproduction et production (ARCHITECTURE.md § 9.1) ; membres de l'équipe avec double authentification ; Secret Manager activé ; alerte de facturation. Les identifiants S3 par service viendront avec L5-02 (moindre privilège, § 6.7).
2. **OpenRouter** :
   - ZDR imposée au niveau du compte (réglages de confidentialité ou Guardrails), en plus du champ par requête de L1-08 ;
   - recharge automatique coupée (ou seuil bas, montant modeste) ; pas plus de 2 à 3 mois de crédits prépayés (ils peuvent expirer au bout d'un an ; 5,5 % de frais par achat) ;
   - clés avec `limit` et `limit_reset` : `dev` (10 $ par jour, poste local et préproduction), `prod-payant` (mensuelle, environ 1,5 fois la prévision), `prod-gratuit` (quotidienne, par exemple 20 $), et une clé plafonnée par jour pour la bêta express (L3-04). `prod-gratuit` ne sert qu'au plan offert des particuliers ; les essais pros passent par `prod-payant`, avec le budget de leur organisation (R23) ;
   - une clé de gestion (Management API) pour créer les clés par programme (offre requise à vérifier : Standard ou au-dessus) ;
   - **la clé `dev` est placée dans le `.env` local par l'utilisateur lui-même** ; aucun agent n'ouvre ni n'écrit ce fichier ;
   - après la correction de la fuite (L1-01), révoquer l'ancienne clé et la remplacer : pendant chaque rendu, le `.env` a pu être lu depuis le réseau local.
3. **Stripe** : compte en mode test, double authentification. Le mode réel ne s'active qu'avec la société (L0-06) et n'est pas utilisé avant L8-01.
4. **Dépôt Git et CI** : dépôt privé (GitHub ou équivalent), branche principale protégée (demande de fusion obligatoire, CI verte), détection de secrets activée. Avant le premier envoi : vérifier que l'historique ne contient ni `plans/` ni `.env`.
5. **Cloudflare** : Access (bêta express, gratuit jusqu'à 50 utilisateurs) et Turnstile (anti-abus). Société américaine : à inscrire dans L0-09.
6. **Sentry** : organisation créée **en région UE (Francfort)**. Ce choix ne se change plus après la création (D5).
7. **Better Stack** (offre gratuite) pour la disponibilité et les battements de cœur, si D5 le confirme.
8. **Fournisseur d'auth** si L0-02 retient Auth0 ou Supabase : tenant ou projet en région UE.
9. **Inventaire des comptes, sans aucun secret** : fournisseur, usage, propriétaire, région, offre, double authentification, adresse de récupération (celle de la structure, pas une adresse personnelle), date. Les secrets vivent dans un gestionnaire de mots de passe d'équipe, puis dans le Secret Manager ; jamais dans le dépôt, les tickets, les journaux ni une conversation.

## Critères d'acceptation
- [ ] Chaque compte est ouvert avec double authentification et une adresse de récupération de la structure ; l'inventaire est à jour et ne contient aucun secret.
- [ ] OpenRouter : ZDR active au niveau du compte ; recharge automatique coupée ; `GET /api/v1/key` (appel gratuit) renvoie pour chaque clé le plafond et le rythme attendus ; l'ancienne clé est révoquée une fois L1-01 livré.
- [ ] Sentry : organisation en région UE (capture du réglage).
- [ ] Scaleway : deux projets, Secret Manager actif, alerte de facturation posée.
- [ ] Dépôt : branche principale protégée, détection de secrets active ; `git log --all --name-only | grep -E '^(plans/|\.env$)'` ne renvoie rien ; `git grep -nE 'sk-or-v1-[A-Za-z0-9]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|sk_live_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}'` ne renvoie rien (les documents citent les préfixes seuls, d'où la longueur minimale).

## Points d'attention
- **Tranché** : L0-06 est une dépendance déclarée (comptes et adresses de récupération au nom de la société, mode réel de Stripe) ; le mode test de Stripe suffit dans ce ticket.
- Si L0-03 retient d'autres fournisseurs que Scaleway ou Sentry, adapter la liste ; si L0-02 n'est pas tranché, le fournisseur d'auth attend.
- Cloudflare, Sentry, OpenRouter et Stripe sont des sociétés américaines : chacun va dans le registre et l'analyse des transferts (L0-09).
- Coûts : OpenRouter prépayé (plafonné), Scaleway environ 65 à 75 €/mois une fois la production lancée, rien avant la préproduction.
- Les montants de plafond sont des valeurs de départ (ARCHITECTURE.md § 6.5), à revoir sur les coûts mesurés (L5-09, L8-09).

## Références
- `produit/ARCHITECTURE.md` § 3 D5, D7, § 6.5, § 6.7, § 9.1, § 9.2
- `produit/recherche/hebergement.md` § 7, § 10
- `produit/recherche/audit-code.md` B6, B8
- `produit/OFFRES.md` § 2.2 (anti-abus), § 8.8
- mémoire du projet : ne pas payer de lecture vouée à l'échec (clé `dev` plafonnée)

## Hors périmètre
- Budgets et alertes dans le logiciel : L5-09 ; supervision : L5-16.
- Plafond quotidien indexé sur la marge : L8-09.
- Préproduction et déploiement : L5-18 ; bêta express : L3-05.
