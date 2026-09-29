# L5-19 · Tests de sécurité automatiques et limites de débit

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-05, L5-13 | `service/` | À faire |

## Pourquoi
L'outil local n'a aucune isolation entre comptes (audit B1, B2), des identifiants devinables (B3), et analyse les PDF dans le processus web sans limite (A10). La règle du projet (« tout défaut trouvé devient un contrôle automatique ») s'applique à la sécurité : chaque faille connue doit avoir son test bloquant en CI (`ARCHITECTURE.md` § 6.8). Les limites de débit du § 6.4 protègent le coût (analyses, liens de connexion) et contre l'aspiration des visites.

## À faire
1. **Limites de débit** `service/limites.py` (à créer ici si L5-03 ne l'a pas déjà fait, sinon à généraliser) : compteurs dans la table non journalisée `limites` (`cle`, `fenetre_debut`, `compteur`) avec incrément atomique ; clés par préfixe d'IP (IPv4 /32, IPv6 /64), compte, e-mail normalisé ou jeton ; réponse 429 avec un message du catalogue ; nettoyage périodique. IP réelle lue seulement dans l'en-tête posé par Caddy.
2. **Valeurs de départ** (§ 6.4) : lien de connexion 5 par heure par e-mail et 20 par heure par IP ; code à 6 chiffres 5 essais par jeton ; dépôt 20 par heure par compte ; analyse anonyme 10 par heure par IP (L5-23) ; ouverture de visite 300 par heure par jeton et par IP. Le crédit offert (3 par IP et par 24 h) est posé par L6-06 avec le même utilitaire.
3. **Suite `service/tests/securite/`**, en CI à chaque demande de fusion, bloquante :
   1. accès croisé entre deux organisations sur **chaque** route : 404, jamais 403 ; liste des routes tirée du routeur FastAPI, et un test d'inventaire qui échoue si une nouvelle route n'est pas couverte ;
   2. jetons rejoués, expirés, falsifiés, tronqués, pour chaque type du § 6.3 (partage, lien de connexion, code, session, invitation, vue propriétaire, rappel de rendu) ; comparaisons par l'utilitaire en temps constant seulement (test statique qui refuse `==` sur une empreinte) ;
   3. énumération d'e-mails : même réponse et même délai (médiane sur 20 essais, écart borné) pour une adresse connue ou inconnue ;
   4. CSRF sur chaque POST (liste tirée du routeur) ;
   5. en-têtes présents sur chaque type de réponse (HTML de l'application, JSON, HTML de visite, 302 des photos, 404, 500) ;
   6. `/.env`, `/plans/…/reponse-ia.json` et `/…/page.png` inaccessibles par toutes les voies : application, visite, CDN, et serveur statique des scripts Chrome (contrôle de L1-01 réutilisé) ;
   7. limites effectives, une par ligne du point 2 ;
   8. aucun secret ni jeton dans les journaux produits par la suite (motifs `sk-or-`, `sk-ant-`, `sk_live_`, `whsec_`, jetons de test).
4. **Fichiers hostiles** : corpus produit par un script (aucun plan réel) dans `service/tests/fichiers_hostiles/` : PDF à objets imbriqués sans fin, PDF de milliers de pages (dont des pages qui portent chacune un nom de niveau, pour éprouver l'empilement des pages d'un même logement, `pages_niveaux`), PDF avec JavaScript ou fichier joint, polyglotte PDF et ZIP, PNG de 50 000 × 50 000 px (bombe de décompression), JPEG tronqué, ZIP renommé en `.pdf`, HEIC. Attendu : refus avec un code du catalogue ou arrêt du sous-processus d'analyse à sa limite de temps ou de mémoire (L5-06), processus web toujours réactif, aucun fichier lu hors du dossier du travail.
5. **Dépendances** : audit des paquets Python et npm figés par L1-07 (`pip-audit`, `npm audit`) en CI, non bloquant au début.
6. Un court README de la suite : chaque faille trouvée ajoute un test, avec la référence de l'incident.

## Critères d'acceptation
- [ ] Suite verte en CI et bloquante.
- [ ] Essais de mutation : retirer le cadrage par organisation d'une route, ou la vérification CSRF, fait échouer la suite ; ajouter une route non couverte fait échouer le test d'inventaire.
- [ ] Chaque fichier hostile est refusé ou coupé à sa limite ; pendant ce temps, le point de santé répond en moins d'une seconde.
- [ ] Chaque limite du § 6.4 est atteinte puis refusée avec un message du catalogue, sans texte technique (L1-04).
- [ ] Aucun secret ni jeton dans les journaux de la suite.
- [ ] Aucun appel payant ; témoin et fichiers générés seulement.

## Points d'attention
- **Ordre des tickets** : L5-03 a besoin des limites (lien de connexion) avant ce ticket. Une seule implémentation : créée dans L5-03, généralisée et testée ici.
- IPv6 regroupé en /64 et IP partagées (réseaux mobiles, CGNAT) : des familles peuvent se gêner. Valeurs de départ à ajuster sur les journaux (§ 6.4).
- Test de délai de l'énumération : seuil statistique pour éviter une suite instable.
- `ouvrir_image` (`pipeline/serveur.py:146`) et `extract.py` ne sont pas modifiés : la protection vient des limites du sous-processus, pour ne pas toucher `pipeline/` (fichiers modifiés par le travail sur les niveaux (terminé le 27/09/2026, pas encore commité)).
- Webhooks Stripe non signés ou rejoués (§ 6.8) : test ajouté avec L8-01.
- Un test d'intrusion externe n'est pas prévu dans les documents ; à envisager avant le premier promoteur.

## Références
- `produit/ARCHITECTURE.md` § 4.1, § 4.2 (`limites`), § 6.1, § 6.3, § 6.4, § 6.7, § 6.8, § 9.5.
- `produit/recherche/audit-code.md` A10, B1 à B6 ; `produit/PARCOURS.md` A3 (10 analyses par heure et par IP).
- `pipeline/serveur.py:52` (`format_fichier`), `:146` (`ouvrir_image`), `:166` (`analyse`) ; `moteur/photos.mjs:19-24`, `moteur/controle.mjs:20-24` (serveurs statiques).

## Hors périmètre
- Anti-abus du crédit offert et Turnstile : L6-06. Webhooks Stripe : L8-01.
- Contrôle des scripts Chrome : L1-01. Isolation du sous-processus d'analyse : L5-06.
