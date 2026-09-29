# L5-02 · Stockage S3 privé et publié

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-01 | `service/` | À faire |

## Pourquoi
Aujourd'hui tout vit dans `plans/<id>/` sur le disque, et le serveur sert une liste de fichiers qui inclut le plan du promoteur (`servable`, `pipeline/serveur.py:565-568`, audit B2 et B7). Décision du 27/09/2026 : stockage S3. Ce ticket crée la seule porte d'accès aux fichiers : un espace privé (sources, intermédiaires, réponses de l'IA) jamais servi tel quel, un espace publié immuable derrière le CDN, des URL signées, et une liste blanche de publication. Les workers continuent de travailler sur un dossier local (ARCHITECTURE § 1, principe 2).

## À faire
1. `service/stockage.py` : une interface `Stockage` et une implémentation S3 (boto3, point d'accès configurable : MinIO en local, Scaleway ou tout S3 compatible ailleurs). Méthodes :
   - `url_envoi(cle, taille_max=40_000_000, duree=900)` : formulaire POST signé avec `content-length-range` ; si le fournisseur ne le permet pas, PUT signé avec `Content-Length` signé et contrôle de taille par `HEAD` après l'envoi ;
   - `url_lecture(cle, duree)`, `url_ecriture(cle, type_contenu, duree)` : pour le navigateur et pour l'exécutant de rendu (L5-10) ;
   - `copier`, `supprimer`, `lister(prefixe)`, `existe`, `taille` ;
   - `telecharger_dossier(prefixe, dossier_local)` et `televerser(dossier_local, prefixe, noms)` : synchronisation du dossier temporaire du worker, qui reprend l'organisation de `plans/<id>/`.
2. Organisation des clés, reprise telle quelle d'ARCHITECTURE § 5.1 et § 5.2 :
   - `prive/depots/<plan_id>/<envoi_id>`, `prive/org/<organisation_id>/plans/<plan_id>/{source.*, analyse/, ia/, travaux/<travail_id>/, publications/<publication_id>/}` ;
   - `publie/moteur/v<N>/`, `publie/vendor/`, `publie/p/<prefixe>/photos/…` (préfixe de 128 bits aléatoires, `secrets.token_urlsafe(16)`).
   Une fonction par type de clé (`cle_source(plan)`, `cle_ia(plan, nom)`…), jamais de chemin construit à la main ailleurs ; les identifiants sont des UUID validés, le nom du fichier déposé n'entre jamais dans une clé (audit B3).
3. Liste blanche de publication : `publier(source_privee, cle_publiee)` refuse tout nom hors de la liste explicite (photos marquées `<vue>-<moment>.jpg`, `vignette.jpg`, fichiers du moteur et de `vendor/`). Les faces des panoramas (L5-27), la visionneuse 360° (L4-16) et les fichiers précalculés (L5-28) s'y ajoutent chacun par son ticket, nom par nom, jamais par un motif large. Refus explicite, avec test, pour : `source.*`, `page.png`, `calibration.png`, `plan-*.png`, `reponse-*`, `relecture-ia.json`, `appels-ia.json`, `extract.json`, `rapport.json`, `controle.json`, `etat.json` (ARCHITECTURE § 5.3). Le filtrage des clés de `plan.json` est fait par L5-12.
4. En-têtes des objets publiés : `Cache-Control: public, max-age=31536000, immutable`, type de contenu exact, `X-Content-Type-Options: nosniff` via le CDN. Un objet publié n'est jamais réécrit : `publier` échoue si la clé existe avec un contenu différent.
5. Identifiants S3 distincts par service (ARCHITECTURE § 6.7) :
   - web : signer les envois vers `prive/depots/` et les lectures courtes ; lire `publie/` ;
   - worker-lecture : lire et écrire `prive/`, écrire `publie/` ;
   - rendu : **aucun** identifiant, seulement des URL signées.
   En local, trois utilisateurs MinIO avec leurs politiques ; en production, les clés équivalentes (création : L0-08, injection : L5-18).
6. Configuration des seaux, par un script idempotent `service/outils/seaux.py` : `prive` sans accès public et avec CORS limité à l'origine `app.<domaine>` (méthodes POST et PUT, pour l'envoi direct) ; `publie` lisible par le CDN seulement ; en local, lisible directement.
7. Écriture atomique, comme aujourd'hui (`ecrit`, `pipeline/lire.py:1226`) : on écrit puis on référence. Aucun objet n'est rendu visible avant d'être complet.

## Critères d'acceptation
- [ ] Test d'aller-retour : un dossier de plan de test (fichiers factices, ou le témoin fictif dès que L1-12 existe) est téléversé, relu, et redonne des octets identiques.
- [ ] Test de liste blanche : chaque nom de l'étape 3 est refusé ; `lister('publie/')` après un scénario complet ne contient aucun fichier hors liste.
- [ ] Test de taille : un envoi de 40 Mo + 1 octet est refusé par le stockage ou supprimé après contrôle, sans passer par le processus web.
- [ ] Test d'accès : l'identifiant du web ne peut pas lire `prive/org/…/ia/` ; une URL signée expirée répond 403.
- [ ] Aucune URL signée ni clé S3 dans les journaux (filtre de L5-01).
- [ ] L'outil local marche toujours ; aucune lecture payante pour tester.

## Points d'attention
- Vérifier sur MinIO et sur le fournisseur retenu (L0-03) la prise en charge du POST signé avec `content-length-range`. Sinon, le contrôle a posteriori laisse passer un objet trop gros quelques secondes : il faut le supprimer avant toute lecture.
- Le versionnement du seau privé et les copies dans une autre région sont faits par L5-26, l'effacement des dépôts à 24 h par L5-23, la purge par L5-20. Le code ne doit pas supposer qu'une suppression est définitive tant que la rotation n'est pas passée.
- Plans des promoteurs : jamais versionnés dans Git ni publiés sans accord (`CLAUDE.md`). Les tests n'utilisent que des fichiers factices ou le témoin fictif.

## Références
- produit/ARCHITECTURE.md § 1 (principes 2 et 3), § 5.1 à § 5.4, § 5.7 (40 Mo), § 6.7, M2.2.
- produit/recherche/audit-code.md A3, B2, B3, B5, B7.
- produit/recherche/hebergement.md § 3.4, § 8.
- `pipeline/serveur.py:565-568` (`VISITE`, `servable`), `:701` (`depot`, lu en mémoire) ; `pipeline/lire.py:1226` (`ecrit`).

## Hors périmètre
- Création des plans et routes d'envoi : L5-05. Publication d'une visite, `plan.json` filtré, `index.html` : L5-12. Moteur versionné sur le CDN : L5-12 avec L4-06.
- Durées de conservation et purge : L5-20. Dépôt provisoire anonyme de 24 h : L5-23. Sauvegardes et versionnement : L5-26.
