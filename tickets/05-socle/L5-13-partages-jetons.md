# L5-13 · Partages par jeton

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-12 | `service/` | À faire |

## Pourquoi
Aujourd'hui l'identifiant d'un plan est le nom du fichier suivi de 32 bits d'aléa (`slug`, `pipeline/serveur.py:46`, audit B3) : il finit dans l'URL partagée et ne suffit pas comme secret. Un partage doit être un jeton séparé, non devinable, révocable dans la seconde, et ne porter aucun traceur (`SUIVI.md` § 2.3, règle 4). Deux objets se partagent : l'aperçu gratuit (images seulement, 30 jours, `OFFRES.md` § 2.2) et la visite payée (jusqu'à la fin de l'hébergement, `PARCOURS.md` A13).

## À faire
1. **Migration** de la table `partages` (`ARCHITECTURE.md` § 4.2) avec une colonne `objet` (`apercu`, `visite`) en plus de `type` (`lien` au lancement ; `integration` viendra avec L10-04). Colonnes des liens prospects (`libelle`, `suivi_detaille`, `prevenir_createur`) créées mais inactives.
2. **`service/partages.py`** :
   - `creer(plan, objet, libelle, expire_le)` : jeton de 16 octets (`secrets.token_bytes(16)`, 22 caractères base64url) ; `jeton_hash` = SHA-256 ; `jeton_chiffre` = AES-GCM avec une clé du gestionnaire de secrets, versionnée pour permettre sa rotation ;
   - `revoquer`, `lister` (libellé, date, état) et réaffichage du lien à son propriétaire par déchiffrement ;
   - droits : membre de l'organisation du plan (rôles de L5-04) ; un particulier n'agit que sur ses plans.
3. **Résolution à chaque requête**, sans cache : empreinte, recherche, comparaison `hmac.compare_digest`, vérification de `revoque_le`, `expire_le`, plan non supprimé, publication active (ou `publication_id` figée), `objet` cohérent avec la route. `Cache-Control: private, no-store` sur les réponses résolues : une révocation joue dans la seconde.
4. **Routes** (hôte `visite.<domaine>`, pages de L5-12) : `/v/<jeton>` pour une visite ; `/a/<jeton>` pour un aperçu, qui ne sert que des images et les données de la fiche, plus la visionneuse 360° et ses panoramas si le 360° devient l'offre gratuite (L5-27, L6-13). Jamais `engine.js`, `plan.json` ni la maquette précalculée (décision n° 6).
5. **Liens invalides** : jeton inconnu, expiré ou coupé → même statut 404 et même délai, page du catalogue `erreur.lien_inconnu`, `erreur.lien_expire` ou `erreur.lien_coupe` (`MESSAGES.md` § 7.12), rien d'autre révélé ; compteur quotidien `lien_expire_ouvert` (`motif` = `expire` ou `revoque`).
6. **Compteur sans traceur** : `vues_visite (partage_id, jour, ouvertures)`, +1 par ouverture de la page (pas par fichier chargé), sans IP ni identifiant de visiteur. Aucun script de mesure sur `/v/` et `/a/`.
7. **Le jeton ne sort jamais** : filtre des journaux (Caddy, uvicorn, Sentry) qui remplace `/v/<jeton>` et `/a/<jeton>` par `/v/:jeton` ; jamais dans `evenements` (seul `partage_id`).
8. **Cascade** : suppression du plan ou retrait de la publication (L5-12) → révocation de tous ses partages ; alimente l'invariant « aucun partage actif vers un plan supprimé » (§ 4.3).
9. **Limite** : 300 ouvertures par heure, par jeton et par IP (§ 6.4), avec l'utilitaire de limites commun (voir L5-19).

## Critères d'acceptation
- [ ] Tests de jetons : rejoué après révocation (404 en moins d'une seconde), expiré, falsifié d'un caractère, tronqué, jeton d'aperçu sur `/v/` → 404, même corps et même ordre de délai.
- [ ] Jeton de 128 bits vérifié par test ; comparaison en temps constant (test unitaire sur l'utilitaire).
- [ ] Ouverture comptée une fois par page ; la table `vues_visite` n'a ni IP ni identifiant de visiteur (test de schéma).
- [ ] Aucune requête vers Umami ni aucun script de mesure sur `/v/` et `/a/` (contrôle C6 de `SUIVI.md` § 7.4).
- [ ] Un partage d'aperçu ne sert jamais `engine.js` ni `plan.json` (test).
- [ ] Aucun jeton dans les journaux produits par la suite de tests (recherche automatique).
- [ ] Pages d'erreur passées au contrôle « aucun texte technique » (L1-04).
- [ ] Parcours sur le témoin seulement, sans appel payant ; outil local inchangé.

## Mesure
- `partage_cree` (`type_page`, `expiration_j`), `partage_revoque` (`type_page`, `age`).
- Compteurs `partage_ouvert` et `lien_expire_ouvert` (C).

## Points d'attention
- **Schéma** : `ARCHITECTURE.md` § 4.2 porte désormais la colonne `objet` (`apercu`, `visite`) ; `SUIVI.md` § 3.11 utilise `type_page` (`apercu`, `visite`, `prospect`), à faire correspondre.
- **Photos après révocation** : le préfixe du CDN est commun à tous les partages d'une publication ; un lien coupé ne rend pas ses photos introuvables pour qui a gardé leur adresse. Accepter (`ARCHITECTURE.md` § 5.2) ou changer de préfixe à chaque révocation (recopie). À décider.
- Durées : aperçu 30 jours fixes (`apercu.partage.texte`) ; visite 30 jours, 6 mois ou fin de l'hébergement (`PARCOURS.md` A13, textes « à ajouter » dans `MESSAGES.md`).
- Partage à un banquier ou un notaire : hors du cercle de famille, avis de l'avocat attendu (`MESSAGES.md` § 12.1).
- Rotation de la clé AES : garder la version de clé avec chaque copie chiffrée ; l'empreinte n'en dépend pas.

## Références
- `produit/ARCHITECTURE.md` § 2.4, § 4.2 (`partages`, `vues_visite`), § 4.3, § 6.3, § 6.4, M2.9 ; `produit/recherche/audit-code.md` B3.
- `produit/OFFRES.md` § 2.2, § 2.7 ; `produit/PARCOURS.md` A13 ; `produit/MESSAGES.md` § 7.5 (`apercu.partage.*`), § 7.8, § 7.12.
- `produit/SUIVI.md` § 2.3, § 2.4, § 3.11, § 7.4 (C6).
- `pipeline/serveur.py:46` (`slug`).

## Hors périmètre
- Volet « Partager » et page du destinataire avec invitation : L6-08.
- Liens prospects, consentement et suivi détaillé : L9-04. Intégration chez un promoteur : L10-04.
- Tests de sécurité généralisés et limites de débit : L5-19.
