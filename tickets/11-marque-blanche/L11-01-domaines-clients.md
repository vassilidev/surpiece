# L11-01 · Domaines des clients et certificats

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 11 · Marque blanche | P0 | L (3 à 5 j) | L5-12, L9-11, L10-04, L10-08 | `service/` | À faire |

## Pourquoi
Une instance en marque blanche sert les visites et l'application sur le domaine du client (`visite.client.fr` en CNAME vers nous), avec un certificat émis automatiquement (OFFRES.md § 5.2, MARQUE.md § 9.1). Aujourd'hui les hôtes autorisés sont une liste fixe (`hote_ok`, `origine_ok`, audit B4). **Porte d'entrée** : on ne construit qu'au jalon J5, soit 3 conseillers payants, 1 pilote promoteur réussi et 1 lettre d'intention signée (OFFRES.md § 5.6, § 7.3, § 9.1 : « ne construire qu'avec une lettre signée »).

## À faire
0. **Vérifier J5** avant de commencer : 3 abonnements actifs (`abonnement_demarre`), `pilote_livre` jugé réussi (L10-08), `lettre_intention_signee`. Sinon, ne pas ouvrir le ticket.
1. **Table `domaines`** (créée par L10-04 pour `parent_integration`, sinon ici) avec `usage` `visite` ou `app` ; ajout par l'équipe au départ (une instance à la fois) ; vérification en deux temps : enregistrement TXT (jeton) puis CNAME vers `clients.<domaine>` ; `verifie_le`, `tls_etat`.
2. **Certificats** : Caddy `on_demand_tls` avec `ask` pointé sur `GET /api/interne/domaines/autorise?domain=…`, qui répond 200 seulement pour un hôte vérifié et actif (réponse rapide, cache court) ; certificats sur un volume persistant et sauvegardé ; limites d'émission de l'autorité de certification à connaître avant la mise en service.
3. **Hôtes autorisés dynamiques** (B4, ARCHITECTURE.md § 6.1) : liste = configuration + domaines vérifiés ; CSRF lié à la session et à l'hôte ; cookie `__Host-session` propre à chaque hôte, jamais posé sur `.client.fr`.
4. **Résolution** hôte → organisation → marque (thème de L11-02) ; visites sur `visite.client.fr/v/<jeton>` ; photos et moteur restent sur `cdn.<domaine>` (Edge Services limite les domaines par pipeline, M5.3) : la CSP de l'instance autorise `cdn.<domaine>`.
5. **Connexion sur le domaine du client** (`usage = app`) : le lien magique (L5-03) fonctionne sur tout domaine ; Google (L5-24) exige que chaque adresse de retour soit déclarée à l'avance. Options : retour central sur `app.<domaine>` puis passage vers l'hôte du client par un jeton court à usage unique, ou lien magique seul sur les domaines clients. Décision à prendre avec L0-02.
6. **En-têtes** : HSTS sans `includeSubDomains` sur un domaine client ; `frame-ancestors` selon L10-04.
7. **Supervision** (ARCHITECTURE.md § 9.4) : certificat proche de l'expiration ou en échec, CNAME disparu à la revérification quotidienne → alerte, pages de l'hôte refusées proprement.
8. **Retrait** en fin de contrat : domaine désactivé, certificat supprimé, redirection ou coupure selon le contrat (L11-04).

## Critères d'acceptation
- [ ] En préproduction, avec un domaine de test : TXT puis CNAME vérifiés, certificat émis au premier accès, visite et connexion servies aux couleurs de l'organisation.
- [ ] Hôte non vérifié ou désactivé : `ask` refuse, aucun certificat émis, page refusée (test).
- [ ] Une session ouverte sur un domaine ne vaut pas sur un autre ; formulaire posté depuis un hôte inconnu refusé (CSRF, tests de L5-19).
- [ ] CNAME retiré : alerte et désactivation à la revérification suivante.
- [ ] En-têtes présents sur chaque type de réponse de l'hôte client ; aucun texte technique ; aucune lecture payante.

## Mesure
- `domaine_verifie` (`usage` = `visite` ou `app`) ; `instance_creee` est écrit par L11-04.

## Points d'attention
- **Décisions amont** : D1 (Auth0 réserve plusieurs domaines personnalisés à son offre Enterprise : l'auth maison est recommandée pour la marque blanche), D4 (envoi d'e-mails depuis le domaine du client chez TEM non vérifié), D6 et Edge Services (domaines par pipeline, ARCHITECTURE.md § 10).
- **Tranché** : L10-04, qui crée `domaines` et sa vérification, est une dépendance déclarée. Les dépendances L10-08 et L9-11 sont des jalons commerciaux, pas du code.
- **Tranché : R21.** Tant qu'aucune instance n'est en service, la page `/marque-blanche` (L2-07) décrit l'instance comme « en préparation », sans date ni prix, et ne propose qu'un entretien.
- Coûts directs estimés à 15 à 30 € par mois et par client (OFFRES.md § 5.5) ; une seule instance à la fois au départ (§ 5.6).
- Le client est éditeur de la page (LCEN) : ses mentions légales remplacent les nôtres sur son domaine (L11-04).

## Références
- produit/ARCHITECTURE.md § 2.2, § 2.5, § 4.2 (`domaines`), § 6.1 (B4), § 6.2, § 9.4, D1, D4, M5.3.
- produit/OFFRES.md § 5.2, § 5.5, § 5.6, § 7.3 (J5), § 9.1, § 9.2 (T9) ; produit/MARQUE.md § 9.1 ; produit/PARCOURS.md D2.
- produit/recherche/auth-paiement.md § 1.2 (domaines), § 1.5 ; produit/recherche/audit-code.md B4.
- `pipeline/serveur.py:499-510` (`hote_ok`, `origine_ok`, protection locale, inchangée).

## Hors périmètre
- Thème complet : L11-02. Clés IA par client : L11-03. Contrat, mise en service et facturation : L11-04. Domaines parents d'une intégration : L10-04.
