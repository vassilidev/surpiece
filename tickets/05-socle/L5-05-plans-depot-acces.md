# L5-05 · Plans, dépôt et contrôle d'accès

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L4-05, L5-02, L5-03, L5-15 | `service/` | À faire |

## Pourquoi
Trois failles bloquantes de l'audit concernent les plans : `/api/plans` liste les plans de tout le monde (B1, `pipeline/serveur.py:645`), l'état, les visites et les actions sont ouverts à qui connaît l'identifiant (B2, `:638`, `:665`), et le dépôt est lu en mémoire par un serveur de développement (B5, `depot`, `:701`). Ce ticket crée les plans en base, l'envoi direct au stockage par URL signée, « Mes plans », la suppression, et cadre **toutes** les routes par organisation. Il expose aussi une vue réduite de l'état, sans aucun détail technique, pour l'écran « chantier ».

## À faire
1. Migration `plans` (ARCHITECTURE § 4.2) :
   - `source_sha256` et `page_empreinte` **nullables** : les deux empreintes (fichier et page rendue, R22) sont calculées par l'analyse (L5-06), jamais dans le processus web, comme le prévoit déjà § 4.2 ;
   - statut `envoi` avant `depose` (ligne créée, fichier pas encore reçu) : écart à reporter dans ARCHITECTURE § 4.2.
2. Utilitaire unique de cadrage `service/app/acces.py` (partagé avec L5-04) : toute lecture de plan passe par `plan_de(ctx, plan_id)`, qui filtre sur l'organisation active et `supprime_le is null`, et répond **404** sinon. Aucune requête SQL sur `plans` hors de ce module (test qui cherche `select(Plan)` ailleurs).
3. Routes :
   - `POST /api/plans` : crée la ligne (`envoi`), renvoie `plan_id` et le formulaire d'envoi signé de L5-02 vers `prive/depots/<plan_id>/<envoi_id>` (40 Mo, 15 min). Le nom du fichier reçu du navigateur va dans `nom_fichier`, jamais dans une URL ni une clé ;
   - `POST /api/plans/{id}/envoi-termine` : `HEAD` sur l'objet (existe, taille ≤ 40 Mo, sinon suppression et refus `depot.refus.lourd`), statut `depose`, mise en file de l'analyse si L5-06 est là ;
   - `GET /api/plans` (« Mes plans ») : identifiant, titre, statut, vignette (URL courte), date ; paginé, organisation active seulement ;
   - `GET /api/plans/{id}` et `PATCH /api/plans/{id}` (titre, passé au filtre des textes et échappé) ;
   - `DELETE /api/plans/{id}` : `supprime_le`, travail actif annulé, objets à effacer mis en file ; l'effacement réel et les copies sont traités par L5-20 ;
   - `GET /api/plans/{id}/etat` : vue réduite décrite à l'étape 4.
4. Vue réduite de l'état, construite par une fonction pure testée :
   - `etape` (analyse, calibration, lecture, controle, photos, fini), libellé de MESSAGES.md § 7.4 (« Plan reçu », « Lecture du plan », « Vérification avant livraison »…), `pct` qui ne recule jamais, `message` = texte du catalogue de L4-05 (`pipeline/messages.py`) à partir du `code_erreur`, `relance_possible` ;
   - jamais : coût, qualification, nom du fichier, échelle, avertissements écrits pour l'IA, `technique_erreur` (tout ce que `/api/etat` renvoie aujourd'hui, audit B2).
   La liste des images disponibles y sera ajoutée par L5-11.
5. Limites : 20 dépôts par heure par compte (table `limites`, L5-03), 40 Mo imposés par le stockage.
6. Doublon dans la même organisation : détecté par l'analyse sur `source_sha256` (L5-06) ; la route d'état renvoie alors le plan existant. Aucune seconde lecture dans la même organisation, jamais de réutilisation entre organisations (ARCHITECTURE § 5.7).
7. Test d'accès croisé **généré** : il parcourt `app.routes`, crée deux organisations et vérifie que chaque route qui prend un `plan_id` répond 404 à l'autre organisation. Une nouvelle route est couverte sans qu'on y pense.

## Critères d'acceptation
- [ ] Test d'accès croisé généré : 404 partout (critère de M2.5), y compris pour un plan supprimé.
- [ ] Test : le fichier va du navigateur au stockage sans passer par le processus web (aucune route n'accepte un corps de plus de 100 Ko).
- [ ] Test de la vue réduite : un état qui contient coût, nom de fichier, trace Python ou avertissement pour l'IA n'en laisse rien passer ; contrôle des textes (L1-04) réussi sur ses sorties.
- [ ] Test : le nom du fichier déposé n'apparaît dans aucune URL, clé d'objet ni lien.
- [ ] Dépôt de bout en bout en local (Compose, MinIO) avec un fichier factice ou le témoin fictif ; aucune lecture payante.
- [ ] L'outil local marche toujours (`pipeline/serveur.py` inchangé).

## Mesure
- `plan_depose` (`taille_ko`, `canal_depot` = `unitaire`, `connecte`, `page_type`), écrit dans la même transaction que le passage à `depose`.

## Points d'attention
- `plan_depose` porte `format_fichier` dans SUIVI.md § 3.6, avec des valeurs serveur (`pdf_vectoriel`, `pdf_image`, `image`) qui ne sont connues qu'après l'analyse : écrire `format_fichier` dans `plan_analyse` et le retirer de `plan_depose`, ou le laisser vide. Écart à trancher dans SUIVI.md.
- Ne pas importer `pipeline/serveur.py` (il lit le `.env` à l'import). Le contrôle du format aux premiers octets (`format_fichier`, `pipeline/serveur.py:52`) est fait par l'analyse (L4-04, L5-06), pas ici.
- Le dépôt sans compte (24 h) a été découpé dans L5-23 : ne pas l'ajouter ici, mais garder `POST /api/plans` réutilisable par L5-23.

## Références
- produit/ARCHITECTURE.md § 2.3 (étapes 1 et 2), § 4.1, § 4.2 (`plans`), § 5.1, § 5.7, § 6.1 (B1, B2, B5), § 6.4, M2.5.
- produit/recherche/audit-code.md B1, B2, B3, B5, A10.
- produit/PARCOURS.md § 1.6 (cas limites du dépôt), § 8.2 ; produit/MESSAGES.md § 7.1, § 7.4.
- `pipeline/serveur.py:638` (`/api/etat`), `:645` (`/api/plans`), `:665` (`do_POST`), `:701` (`depot`), `:46` (`slug`).

## Hors périmètre
- Analyse, calibration, lancement et travaux : L5-06. Dépôt provisoire anonyme : L5-23.
- Écran « Mes plans » : L6-07. Écran « chantier » : L6-03. Images dans l'état : L5-11.
- Purge et suppression définitive : L5-20. Tests de sécurité complets et fichiers hostiles : L5-19.
