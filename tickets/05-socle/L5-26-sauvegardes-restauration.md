# L5-26 · Sauvegardes et restauration testée

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-18 | `service/` | À faire |

## Pourquoi
Une sauvegarde qui n'a jamais été restaurée ne protège de rien. ARCHITECTURE.md § 9.3 et M2.13 fixent la cible : perte de 24 h au plus, remise en service en 4 h au plus, restauration essayée. Les lectures payées (`reponse-ia.json`) valent de l'argent : les perdre obligerait à repayer. Décision de l'utilisateur n° 2 : le service est déployable partout, donc la sauvegarde ne doit dépendre d'aucun outil propre à un hébergeur. Découpé de L5-18, qui garde la préproduction, le déploiement automatique et les secrets. La bêta fermée exige des sauvegardes avec une restauration testée (L6-10).

## À faire
1. **Base de l'application** :
   - `pg_dump` chiffré chaque nuit vers le seau `sauvegardes` d'une autre région (ou d'un autre fournisseur compatible S3), gardé 30 jours et 12 mois ;
   - sauvegardes automatiques de la base gérée en plus, si l'hébergeur retenu (D2, L0-03) en fournit : elles ne remplacent pas le dump ;
   - clé de chiffrement au gestionnaire de secrets (L5-18), jamais dans l'image, le dépôt, les journaux ni le seau des sauvegardes.
2. **Base `umami`** (L7-01) : même dump, dans un fichier séparé ; sa perte ne touche aucun indicateur métier.
3. **Objets** : seau privé versionné, anciennes versions supprimées après 30 jours ; réplication quotidienne des objets essentiels (source, `reponse-ia.json`, `plan.json`) vers l'autre région ; photos et visites non répliquées (elles se régénèrent sans IA).
4. **Test de restauration** mensuel automatisé (Procrastinate) : dernier dump restauré dans une base temporaire de l'environnement de production (jamais en préproduction, qui ne reçoit aucune donnée de client), comptage des tables clés, invariants du grand livre (L5-07), rejeu sans IA d'un plan depuis les objets répliqués ; base temporaire effacée ensuite ; échec → alerte (L5-16).
5. **Première restauration** faite à la main et chronométrée, de bout en bout, sur une VM vierge : perte de données mesurée, durée de remise en service ; écarts notés.
6. **Procédure** écrite avec L5-21 (procédure 6) : ordre des opérations, qui la lance, contrôles après restauration, message aux clients.
7. **Conservation** : les données supprimées quittent les copies à l'expiration de leur rotation (versions du seau à 30 jours, dumps jusqu'à 12 mois) ; à inscrire au registre (L0-09) et à reprendre dans L5-20.

## Critères d'acceptation
- [ ] Restauration faite une fois, chronométrée sous 4 h, perte de données sous 24 h ; résultat noté dans la procédure.
- [ ] Tâche mensuelle planifiée et reliée à une alerte ; un dump volontairement abîmé fait échouer le test et déclenche l'alerte.
- [ ] Un dump est illisible sans la clé (test) ; aucune clé ni URL signée dans les journaux.
- [ ] Objet supprimé du seau privé : restaurable pendant 30 jours ; objets essentiels présents dans l'autre région le lendemain.
- [ ] Rejeu depuis la copie sans aucun appel payant (aucune ligne `appels_ia`).
- [ ] Procédure jouée avec `pg_dump`, `pg_restore` et un stockage compatible S3 seulement : aucun outil propre à un hébergeur n'est requis.

## Points d'attention
- Les dumps de 12 mois gardent des données supprimées : durée à valider au registre (L0-09) ; raccourcir la rétention mensuelle si l'avocat le demande (L5-20).
- Restaurer des données de production n'est permis que dans l'environnement de production, avec les mêmes accès que la production ; les plans des promoteurs ne sortent jamais vers un poste ou la préproduction sans accord (`CLAUDE.md`).
- Photos non répliquées : leur régénération demande du rendu SwiftShader (quelques minutes par plan, L5-22) ; après une perte totale, prévoir un rendu étalé.
- Le seau `sauvegardes` suit les mêmes règles d'accès que le seau privé : aucun accès public, identifiants distincts de ceux des services.

## Références
- Décision de l'utilisateur du 27/09/2026, n° 2.
- produit/ARCHITECTURE.md § 4.4, § 9.3, M2.13 ; produit/recherche/hebergement.md § 8 ; produit/recherche/juridique.md § 3.4.

## Hors périmètre
- Préproduction, déploiement, secrets : L5-18. Procédures d'incident : L5-21. Supervision : L5-16.
- Purge et durées de conservation : L5-20. Base Umami et sa purge : L7-01.
