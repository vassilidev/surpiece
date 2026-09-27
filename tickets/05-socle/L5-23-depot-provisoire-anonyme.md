# L5-23 · Dépôt provisoire anonyme de 24 h

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-05, L5-06 | `service/` | À faire |

## Pourquoi
Le parcours du particulier montre avant de demander : le plan est déposé et analysé sans compte, « Plan reconnu » s'affiche en quelques secondes, et l'e-mail n'est demandé qu'au lancement (`PARCOURS.md` A2 à A4 ; test T5 d'`OFFRES.md` § 9.2). `ARCHITECTURE.md` § 2.3 ne le prévoit pas : le dépôt y suit la création du plan dans un compte (`PARCOURS.md` § 8.2). Ce ticket crée côté serveur un dépôt anonyme, privé, effacé à 24 h, avec une analyse **sans IA** seulement, puis son rattachement au compte à la vérification de l'e-mail. Découpé de L5-05 ; la partie navigateur (IndexedDB, écrans) est dans L6-01.

## À faire
1. **Table `depots_provisoires`** : `id`, `jeton_reprise_hash` (256 bits, jeton gardé par le navigateur avec le fichier), `source_sha256`, `page_empreinte` (page retenue rendue à résolution fixe, calculée par l'analyse, R22), `taille`, `format`, `ip_prefixe`, `statut` (`attente_envoi`, `recu`, `analyse`, `reconnu`, `a_calibrer`, `refuse`), `resultat` (codes seulement : motif de refus, pages, page retenue, vectoriel, échelle, niveaux), `email_normalise_hash` (posé à la demande de lien), `cree_le`, `expire_le` (= création + 24 h), `rattache_plan_id`, `rattache_le`. Jamais le nom du fichier.
2. **API sans session** (`app.<domaine>`) :
   - `POST /api/depots` : taille (40 Mo au plus) et format annoncés ; limite de débit ; pendant la bêta fermée, code d'invitation valide exigé, vérifié côté serveur (R13 ; codes émis par L6-10, saisie par L6-01) ; renvoie l'identifiant, le jeton de reprise et une URL signée d'envoi (PUT, 15 min, 40 Mo, type imposé) vers `prive/depots/anonymes/<depot_id>/source` ;
   - `POST /api/depots/<id>/analyser` (jeton de reprise) : vérifie l'objet, recalcule l'empreinte côté serveur, met en file `analyse` (sous-processus limité en temps et en mémoire, L5-06) : format aux premiers octets, refus motivés, choix de page, extraction, échelle, niveaux avec `niveaux_max = 1` (logique d'`analyse`, `pipeline/serveur.py:132`, appelée par les étapes de L4-04, jamais modifiée ici). **Aucune qualification IA, aucune clé IA dans ce conteneur** ;
   - `GET /api/depots/<id>` : statut et codes du catalogue (`depot.reconnu.*`, `depot.refus.*`), pages, vignette de la page lue par URL signée courte (le plan de l'utilisateur, montré à lui seul), état de l'échelle ;
   - `POST /api/depots/<id>/page` : autre page choisie, nouvelle analyse (comptée dans la limite) ;
   - `DELETE /api/depots/<id>` : « Retirer ce plan ».
3. **Limites** : 10 analyses par heure et par IP (`PARCOURS.md` A3), créations de dépôts bornées par IP, avec l'utilitaire de limites (L5-03, L5-19).
4. **Rattachement** à la vérification de l'e-mail (L5-03, déclenché par le parcours de L6-01), en une transaction : ligne `plans` dans l'organisation personnelle (statut tiré de l'analyse), copie côté serveur de la source vers `prive/org/<org>/plans/<plan>/source.<ext>` et des sorties d'analyse vers `analyse/`, `plans.source_sha256` et `plans.page_empreinte` renseignées, dépôt marqué rattaché, objets provisoires effacés. Preuve de possession : le jeton de reprise, ou l'identifiant de dépôt porté par le lien de connexion demandé pour cette adresse (cas de l'autre appareil, `PARCOURS.md` A5). Dépôt expiré : code dédié, pour que le navigateur renvoie le fichier depuis sa copie locale.
5. **Purge** toutes les 15 min : dépôts non rattachés expirés → objets et ligne effacés. Garantie : 24 h plus 15 min.
6. **Anti-abus** : les empreintes ne sont gardées durablement qu'au rattachement (`plans.source_sha256` et `plans.page_empreinte`, utilisées par L6-06 : un plan offert par plan, reconnu par l'une ou l'autre, R22) ; pour un dépôt non rattaché, elles disparaissent avec la ligne, sauf décision contraire (voir plus bas).
7. **Messages** : codes du catalogue seulement ; phrase « Sans suite de votre part, il est effacé sous 24 h » (« à ajouter », `PARCOURS.md` A2).

## Critères d'acceptation
- [ ] PDF du témoin : dépôt, analyse, « reconnu » ; durée mesurée et notée (T0) ; aucune ligne `appels_ia`, aucune clé IA dans l'environnement du conteneur d'analyse (test).
- [ ] 11e analyse dans l'heure depuis la même IP : 429 et message du catalogue.
- [ ] Horloge injectée à 24 h 15 : objet et ligne effacés (liste du seau MinIO vide pour ce dépôt).
- [ ] Rattachement : le plan apparaît dans « Mes plans » du nouveau compte, source déplacée, dépôt effacé ; mauvais jeton → 404 ; dépôt expiré → code dédié.
- [ ] Dépôt sur un appareil, lien ouvert sur un autre : plan rattaché au compte vérifié ; l'onglet d'origine ne reçoit la session qu'avec le code (règle de `PARCOURS.md` A5, portée par L5-03).
- [ ] Chaque refus de l'analyse du tableau `PARCOURS.md` § 1.6 (lignes « A ») renvoie son code du catalogue, testé sur des fichiers générés (aucun plan réel).
- [ ] Réponses de l'API passées au contrôle « aucun texte technique » (L1-04) ; aucun nom de fichier stocké ni renvoyé.
- [ ] Sans jeton de reprise, un dépôt répond 404 (test d'énumération, L5-19).

## Mesure
- `depot_provisoire_recu` (`format_fichier`, `taille_ko`, `page_type`), à la réception du fichier, sans aucun identifiant ; `plan_depose` (`canal_depot` = `unitaire`, `connecte` = faux) au rattachement, quand la ligne `plans` est créée (SUIVI.md § 3.6).
- `plan_analyse` (`resultat`, `motif_refus`, `vectoriel`, `echelle`, `duree_ms`).

## Points d'attention
- **Dictionnaire** : réglé dans `SUIVI.md` § 3.6 : un dépôt anonyme écrit `depot_provisoire_recu` à la réception, puis `plan_depose` une seule fois, au rattachement.
- **Juridique** : copie dans le navigateur et dépôt anonyme de 24 h, exemption de consentement et information suffisante : question à l'avocat (`PARCOURS.md` § 8.3, n° 6), à trancher avant l'ouverture.
- Garder l'empreinte d'un dépôt jamais rattaché au-delà de 24 h (anti-abus) revient à garder une donnée liée à un plan identifiable : seulement si le registre (L0-09) le prévoit.
- L'analyse sans IA consomme du CPU pour des anonymes : limite par IP, plafond de file (L5-22), et Turnstile au dépôt en réserve si des abus apparaissent (`PARCOURS.md` ne le met qu'à l'inscription).
- `ARCHITECTURE.md` § 2.3 et § 5.1 sont à compléter (chemin `depots/anonymes/<depot_id>/` au lieu de `depots/<plan_id>/<envoi_id>`).
- **PDF de plusieurs lots** (R17) : l'analyse sans IA empile aujourd'hui leurs pages comme des niveaux ; le refus « plusieurs lots » vient de la qualification (L6-02), après le compte. Vérifier sur un fichier généré quel message l'analyse anonyme affiche pour un tel PDF (avec `niveaux_max = 1`, `niveaux_refus` peut le refuser comme « niveaux ») ; seul l'import promoteur (L10-02) découpe un PDF de plusieurs lots.
- Travail sur les duplex : `analyse`, `extract.py` et `niveaux.py` bougent ; les appeler par `pipeline/etapes.py` (L4-04), ne rien y modifier.
- Doublon signalé avec L6-01 : ici l'API et le stockage, là-bas le navigateur et les écrans.

## Références
- `produit/PARCOURS.md` A2, A3, A5, A6, § 1.6, § 8.2, § 8.3 ; `produit/OFFRES.md` § 9.2 (T5) ; `produit/SUIVI.md` § 3.6.
- `produit/ARCHITECTURE.md` § 2.3, § 5.1, § 5.7, § 6.4 ; `produit/recherche/audit-code.md` A10 ; `produit/recherche/auth-paiement.md` § 3.5.
- `pipeline/serveur.py:52` (`format_fichier`), `:126` (`choisir_page`), `:132` (`analyse`), `:218` (`niveaux_refus`).

## Hors périmètre
- IndexedDB, zone de dépôt, écran « Plan reconnu », volet de compte : L6-01. Création de compte et code : L5-03.
- Qualification IA : L6-02. Calibration : L6-04. Anti-abus du plan offert : L6-06. Dépôt dans un compte connecté : L5-05.
