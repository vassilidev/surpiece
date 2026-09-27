# L11-03 · Clés IA par client

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 11 · Marque blanche | P2 | S (jusqu'à 1 j) | L5-09 | `service/` | À faire |

## Pourquoi
Décision n° 3 : on sait qui consomme quoi, des plafonds côté logiciel bloquent facilement, et les plafonds des clés OpenRouter sont un second verrou. Pour un client de marque blanche, ou un client refacturé au coût réel, une clé propre isole son coût, permet de le couper sans toucher aux autres et donne un relevé indépendant (ARCHITECTURE.md § 6.5, M5.6). La recherche précise que cela ne se justifie que dans ces deux cas (recherche/hebergement.md § 10, point 4).

## À faire
1. **Options, décision de l'utilisateur** :
   - (a) clé créée par nous pour le client par la Management API d'OpenRouter, sous notre compte, avec `limit` et `limit_reset` mensuel ; **recommandée** : même chaîne contractuelle, même ZDR, révocable par nous ;
   - (b) clé du compte OpenRouter du client : seulement sur demande ; le client contracte alors lui-même avec OpenRouter, ce qui change le DPA et la liste des sous-traitants.
2. **Rattachement** : `organisations.cle_ia_nom` ; secret rangé dans le gestionnaire de secrets sous ce nom ; le worker lecture résout la clé du travail (organisation avec `cle_ia_nom`, sinon règle de L5-09 : `prod-payant`, `prod-gratuit` ne servant qu'au plan offert des particuliers, R23). La clé n'atteint jamais l'application web ni Chrome ; seul `cle_nom` va dans `travaux.config` et `appels_ia`.
3. **Budgets** : ceux de L5-09 restent le premier verrou (3 $ par plan, toutes passes et relances confondues, R6 ; plafond de l'organisation ; global) ; la clé du client en est le second.
4. **Surveillance** : la tâche de L5-09 inclut les clés des clients (seuils de 50, 80 et 100 %, clé sans plafond, rapprochement quotidien avec `appels_ia`).
5. **ZDR** : `provider.zdr` imposé dans chaque requête (L1-08), quelle que soit la clé ; en option (b), vérifier les réglages du compte du client ou refuser.
6. **Refacturation au coût réel** : relevé mensuel des coûts de l'organisation (vues de L5-09), joint à la facture. On facture un service (des plans produits), pas un accès au modèle.
7. **Fin de contrat** : clé supprimée par la Management API, secret retiré.

## Critères d'acceptation
- [ ] Deux organisations de test : chaque travail utilise la bonne clé (vérifié par `appels_ia.cle_nom`, faux serveur OpenRouter, aucune lecture payante).
- [ ] Plafond de la clé du client atteint (402 simulé) : aucune relance, travail en échec, crédit libéré, alerte ; les autres organisations continuent.
- [ ] Aucune clé dans les journaux, `travaux.config` ni l'environnement de Chrome (recherche automatique).

## Points d'attention
- **Juridique** : les conditions d'OpenRouter interdisent de revendre l'accès API aux modèles (clause 7.4, recherche/juridique.md § 2.1). Refacturer « au coût réel » doit rester la facture d'un service ; formulation à valider par l'avocat (L0-07).
- La Management API est réservée à l'offre Standard et au-dessus d'OpenRouter (recherche/hebergement.md § 10) ; la clé de gestion ne va sur aucun serveur (L0-08).
- Utile seulement avec une instance (L11-04) ou un gros client refacturé ; sinon, ne pas le construire.

## Références
- produit/ARCHITECTURE.md § 4.2 (`organisations.cle_ia_nom`), § 6.5, § 6.7, M5.6 ; produit/OFFRES.md § 5.2, § 6.7.
- produit/recherche/hebergement.md § 10 ; produit/recherche/juridique.md § 2.1 (point 7), § 2.2.

## Hors périmètre
- Budgets et clés de base : L5-09. Ouverture des comptes et clés : L0-08. Contrat de l'instance : L11-04.
