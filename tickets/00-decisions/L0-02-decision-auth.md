# L0-02 · Trancher l'authentification (D1)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | S (jusqu'à 1 j) | — | — | À faire |

## Pourquoi
L'authentification n'est pas tranchée (décision 8 du 27/09/2026). L'utilisateur penchait pour Auth0 ; la recherche recommande une auth maison (lien magique avec code de secours, Google) derrière une couche interchangeable, avec Supabase Auth en région Paris comme alternative sans code d'auth. L5-03 (lien magique, code à 6 chiffres, sessions, couche d'identité) et L5-24 (connexion Google) sont bloqués tant que ce choix n'est pas écrit, et le choix change la liste des sous-traitants (L0-09) et des comptes à ouvrir (L0-08).

## À faire
1. **Présenter les trois options à l'utilisateur**, faits vérifiés à l'appui :

   | | A. Auth maison (recommandée) | B. Auth0 (préférence initiale) | C. Supabase Auth, région Paris |
   |---|---|---|---|
   | Lien magique | oui : 32 octets haché, 15 min, usage unique, lié à l'e-mail et non au navigateur, donc fiable sur iPhone depuis Gmail | **non en Universal Login** (code à 6 chiffres à la place) ; en Classic Login, le lien doit s'ouvrir dans le même navigateur (échec iPhone depuis Gmail) | oui |
   | Code à 6 chiffres | oui, dans le même e-mail, 5 essais | oui | oui |
   | Google | OIDC (Authlib) | oui | oui |
   | Organisations B2B | dans notre base | 5 en gratuit ; B2B 300 $/mois à 1 000 MAU, 2 100 $ à 10 000 ; à garder de toute façon dans notre base | à modéliser dans notre base |
   | Domaines de marque blanche | illimités | plusieurs domaines : Enterprise seulement | 1 domaine personnalisé par projet |
   | Coût | ~0 € (envoi d'e-mails) | gratuit jusqu'à 25 000 MAU en B2C | 25 $/mois jusqu'à 100 000 MAU |
   | Données, éditeur | UE, nous | région UE possible, éditeur américain (Okta) | UE (Paris), éditeur américain |
   | Charge (estimation) | 4 à 6 j avec les tests de sécurité | 2 à 3 j | à estimer (écran et organisations à construire) |
   | Sécurité | à notre charge (tests § 6.8) | chez le fournisseur | chez le fournisseur |

2. **Rappeler l'invariant, quelle que soit l'option** (ARCHITECTURE.md § 3 D1) : protocole `FournisseurIdentite` (`debut`, `fin` → identité vérifiée), table `identites` qui relie `(fournisseur, sujet)` au compte, session **toujours** posée par nous, aucun mot de passe stocké, aucune logique métier chez le fournisseur (pas d'Actions Auth0). Changer de fournisseur = renvoyer un lien de connexion.
3. **Questions à poser à l'utilisateur** pour trancher :
   - le lien cliquable sur iPhone depuis Gmail est-il indispensable, ou le code suffit-il ?
   - accepte-t-on de porter la sécurité de l'auth (tests automatiques du § 6.8) ?
   - un éditeur américain est-il acceptable face aux promoteurs (DPF sous pourvoi) ?
   - connexion Apple au lancement ? (recommandation : plus tard, compte Apple Developer requis) ;
   - la marque blanche exige-t-elle une page de connexion sur le domaine du client ? (ARCHITECTURE.md : les pages de visite n'exigent pas de connexion).
4. **Recommandation à présenter** : option A au lancement, avec le code à 6 chiffres dès le premier jour ; SSO des promoteurs plus tard par un broker branché comme un fournisseur de plus (Zitadel Cloud UE ou Keycloak ; WorkOS en solution rapide, données aux États-Unis).
5. **Si B est retenu malgré tout** : tenant en région UE, deux tenants possibles (B2C gratuit, B2B séparé), code e-mail à la place du lien, organisations dans notre base, écran de connexion sur notre domaine seulement.
6. **Qui décide** : l'utilisateur. **Où consigner** : ARCHITECTURE.md § 3 D1 (« Décision du JJ/MM/AAAA », raisons, date de réexamen) et tableau du § 0 ; si B ou C, ajouter le fournisseur à L0-08 (compte, région) et à L0-09 (DPA, transfert) ; aligner MESSAGES.md § 7.3 et E1 (lien et code).

## Critères d'acceptation
- [ ] Décision écrite et datée dans ARCHITECTURE.md § 3 D1 et § 0, avec les raisons et la réversibilité.
- [ ] Les cinq questions de l'étape 3 ont une réponse écrite.
- [ ] Si un fournisseur externe est retenu : région UE confirmée par écrit, offre et prix notés, DPA ajouté à la liste de L0-09, compte ajouté à L0-08.
- [ ] Les critères d'acceptation de L5-03 et de L5-24 correspondent à l'option retenue (parcours sur iPhone depuis l'application Gmail, tests du § 6.8).

## Points d'attention
- Préférence de l'utilisateur contre recommandation de la recherche : présenter les faits, ne pas trancher à sa place.
- Écart entre documents à corriger après la décision : MESSAGES.md § 7.3 et E1 n'ont pas encore le code à 6 chiffres (PARCOURS.md § 8.2).
- Auth0 : le passage automatique au palier supérieur après trois mois de dépassement vient d'une source secondaire, non vérifiée.
- Transferts : le DPF est validé par le Tribunal de l'UE (Latombe, 3/09/2025), pourvoi pendant ; un éditeur américain garde un risque non nul.
- Les charges en jours sont des estimations, non mesurées.

## Références
- `produit/ARCHITECTURE.md` § 0, § 3 D1, § 6.3 (jetons), § 6.4 (limites), § 6.8 (tests), § 8.3 M2.3, M5.5
- `produit/recherche/auth-paiement.md` § 1.1 à § 1.5, § 5
- `produit/recherche/juridique.md` § 3.3
- `produit/PARCOURS.md` § A4, § A5, § 8.2
- `produit/MESSAGES.md` § 7.3, § 7.11 (E1)

## Hors périmètre
- Implémentation de l'auth : L5-03 (lien magique, code à 6 chiffres, sessions, couche d'identité) ; connexion Google : L5-24.
- E-mails transactionnels (lien de connexion) : L5-14.
- Anti-abus du plan offert : L6-06.
- SSO des promoteurs : L10-07.
