# L6-01 · Dépôt sur la vitrine puis création de compte

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | L (3 à 5 j) | L2-04, L5-03, L5-05, L5-15, L5-23, L6-02, L6-06 | `site/`, `service/` | À faire |

## Pourquoi
Le dépôt du plan est le premier geste, sans compte ; le compte n'est demandé qu'au clic sur « Lancer mon plan offert », quand l'intention est la plus forte (PARCOURS.md § 0, A2 à A6). Le test T5 fixe le seuil : au-delà de 40 % de perte entre le dépôt et l'e-mail vérifié, il faut revoir ce parcours (OFFRES.md § 9.2). Ce ticket assemble les briques du socle (dépôt provisoire L5-23, authentification L5-03, plans L5-05) en un parcours continu, et prépare le passage du bouton « Importer mon plan » de la vitrine (L2-04) du mode liste d'attente au mode dépôt réel. Pendant la bêta fermée (R13), le dépôt est réservé aux invités, avec un code d'invitation, sans aucun achat ; l'ouverture à tous vient avec L8-07.

## À faire
1. **Choisir l'intégration entre `<domaine>` et `app.<domaine>`** avant de coder, car la copie IndexedDB et le cookie de session `__Host-session` sont liés à l'origine (ARCHITECTURE.md § 2.5). Options :
   - (a) **recommandée** : la zone de dépôt du premier écran est une iframe `app.<domaine>/depot/zone` (même site, donc stockage non cloisonné ; CSP `frame-ancestors https://<domaine>` sur cette seule route, `frame-src` côté vitrine). Après l'envoi, l'iframe demande au parent (`postMessage`, origine vérifiée) de naviguer vers `app.<domaine>/depot/<référence>` : tout le reste du parcours reste sur l'origine de l'application ;
   - (b) envoi depuis `<domaine>` par l'API en CORS limité à `<domaine>`, puis bascule vers `app.<domaine>` (la copie locale reste sur `<domaine>`, ce qui complique la reprise) ;
   - (c) simple lien vers `app.<domaine>/depot` : un clic de plus, contraire à A2.
   Le choix est validé par l'utilisateur et reporté dans ARCHITECTURE.md § 2.5 par le responsable du document.
2. **Zone de dépôt** (A2, MESSAGES.md § 1.1 et § 7.1) : `label` contenant l'`input` (clavier : Entrée ou Espace), glisser-déposer facultatif, textes `depot.zone.titre`, `depot.zone.titre_mobile`, `depot.zone.aide`, `depot.zone.bouton` (« Importer mon plan »), `depot.zone.survol`. Attribut `accept` limité à PDF, JPG, PNG, WebP (piste HEIC de PARCOURS.md § 1.6, à vérifier sur iPhone).
3. **Contrôles dans le navigateur, avant tout envoi** (PARCOURS.md § 1.6) : fichier vide (`depot.refus.vide`), plus de 40 Mo (`depot.refus.lourd`), format reconnu sur les premiers octets comme `format_fichier` (`pipeline/serveur.py:52`) (`depot.refus.format`), plusieurs fichiers (on garde le premier, texte « à ajouter »).
4. **Copie locale** : fichier, nom, poids, empreinte SHA-256 (SubtleCrypto), référence du dépôt provisoire et résultat de l'analyse dans IndexedDB. Purge au rattachement au compte, sur « Retirer ce plan », au plus tard à 7 jours. En navigation privée, le parcours marche tant que l'onglet reste ouvert.
5. **Envoi** : demande d'URL signée au dépôt provisoire (L5-23), `PUT` direct au stockage privé avec barre d'envoi annoncée (`depot.envoi`), reprise depuis la copie locale après une coupure (`erreur.connexion`).
6. **Écran « Plan reconnu »** (A3) : vignette de la page lue (image servie par URL signée courte, jamais publiée), `depot.reconnu.titre` puis `.pdf` ou `.image`, choix de page si le PDF en compte plusieurs (texte « à ajouter »). Depuis le 27/09/2026, l'analyse empile les pages d'un même logement comme ses niveaux (`pipeline/extract.py`) : un PDF dont deux pages forment les niveaux d'un duplex est lu en entier, jamais page par page, et l'écran dit quelles pages sont lues ensemble (texte « à ajouter ») ; au-delà de `niveaux_max = 2` (L4-08), refus `depot.refus.niveaux`, contenu du plan offert et prix de la visite (même phrase qu'à l'accueil, lus dans le catalogue ; pendant la bêta, variante `.beta` sans prix, R13), action `depot.reconnu.bouton_offert`, lien `depot.reconnu.changer`, limites `depot.reconnu.limites`. Refus de l'analyse : clés `depot.refus.*`.
7. **Volet de création de compte** (A4, MESSAGES.md § 7.3), sur la même page, plan visible derrière : `compte.titre`, `compte.texte`, deux cases non cochées placées avant les boutons (`compte.cgu` avec lien `compte.confidentialite`, case d'écart consenti en texte intégral), `compte.google` (connexion de L5-24, masqué dans les navigateurs intégrés et absent tant que L5-24 n'est pas livré), `compte.email.*`, ligne « Un plan offert par personne et par plan, à lancer sous 30 jours » (à ajouter), Turnstile en mode géré. Suggestion de domaine mal saisi (« Vouliez-vous dire … ? », liste fermée, dans le navigateur). Acceptations écrites dans `acceptations` (document, version, horodatage). Même réponse et même délai pour une adresse connue ou nouvelle.
8. **Vérification** (A5) : écran `compte.envoye.*` avec champ du code à 6 chiffres (`autocomplete="one-time-code"`, collage accepté), renvoi actif après 60 s, « Changer d'adresse ». Même navigateur : l'onglet d'origine passe au chantier. Autre appareil : cet appareil reçoit la session ; l'onglet d'origine affiche « Confirmé sur un autre appareil. Pour suivre ici, saisissez le code reçu » (à ajouter) et **ne reçoit jamais la session sans le code**.
9. **Lancement automatique** (A6), sans nouveau clic : rattachement du dépôt provisoire au compte sans renvoi du fichier, contrôles du plan offert (L6-06), qualification (L6-02), calibration si besoin (L6-04), réservation et création du travail, e-mail E2 (modèle de L5-14), puis écran d'attente (L6-03).
10. **Mode du bouton de la vitrine** : brancher le mode « dépôt réel » sur la variable unique prévue par L2-04. Pendant la bêta fermée (R13), la vitrine publique reste en liste d'attente ; le dépôt est ouvert sur `app.<domaine>/depot` (`noindex`) **seulement avec un code d'invitation valide**, saisi à l'entrée du dépôt ou prérempli par le lien de l'invitation (choix ouvert, PARCOURS.md § 8.3, question 11) ; le code est vérifié côté serveur par L5-23 et émis par L6-10 ; aucun écran ne propose d'achat ni de prix avant le lot 8.
11. Textes « à ajouter » de ce parcours proposés au responsable de MESSAGES.md, puis passés au catalogue (L4-05) : aucun texte en dur dans les gabarits.

## Critères d'acceptation
- [ ] Parcours complet joué par puppeteer sur `docker compose up` (MinIO, Mailpit), avec le témoin fictif et `PLAN_MOCK` : dépôt → plan reconnu → compte par lien → chantier, **sans aucune lecture payante**.
- [ ] Rechargement de l'onglet à chaque étape : rien n'est perdu ; envoi coupé (mode hors ligne de puppeteer) puis repris depuis IndexedDB.
- [ ] Lien ouvert dans un autre contexte de navigateur : la session n'arrive pas dans l'onglet d'origine sans le code ; le code valide l'y amène.
- [ ] Fichier `.docx`, fichier vide, fichier de 45 Mo : refusés dans le navigateur, aucune requête d'envoi émise.
- [ ] Configuration bêta : sans code d'invitation valide, ni dépôt ni compte ; avec un code, parcours complet sans aucun prix affiché (contrôle du texte visible).
- [ ] Adresse connue et adresse nouvelle : réponses identiques (corps et délai mesurés dans le test).
- [ ] Parcours fait à la main sur iPhone, lien ouvert depuis l'application Gmail, et dans le navigateur intégré d'Instagram (bouton Google masqué, code mis en avant).
- [ ] Contrôle « aucun texte technique » (L1-04) étendu à ces écrans et passé ; aucun nom de fichier ni identifiant dans une URL. Le détail technique que l'outil local montre avec `?debug=1` (`technique_erreur`, `pipeline/accueil.html`) n'a aucun équivalent en service : paramètre sans effet, champ jamais servi au navigateur (test).
- [ ] Clavier seul de bout en bout ; focus piégé dans le volet, Échap ferme, retour du focus.
- [ ] L'outil local (`python3 pipeline/serveur.py`) marche toujours : rien n'est modifié dans `pipeline/` ni `moteur/`.

## Mesure
- N : `depot_fichier_choisi`, `depot_fichier_refuse`, `depot_envoi_termine`, `depot_envoi_echoue`, `inscription_ouverte` (`contexte=lancement_plan`), `inscription_methode_choisie`, `formulaire_refuse`, `erreur_affichee`. Posés par `mesure()`, inertes tant qu'Umami n'est pas branché (L7-04).
- S : `depot_provisoire_recu` à la réception (L5-23), `plan_depose` (`connecte=false`) au rattachement, `lien_magique_envoye`, `lien_magique_refuse`, `compte_cree` (propriété `meme_appareil` à ajouter, PARCOURS.md § 8.1), `session_ouverte`, `plan_lance`, `email_envoye`.

## Points d'attention
- L5-15, L6-02 et L6-06 sont dans les dépendances. L6-03 (qui dépend de ce ticket) et L6-04 enchaînent aussi ses étapes : les livrer ensemble, ou brancher des étapes neutres en attendant (qualification acceptée d'office interdite en production : elle ouvrirait des lectures payantes).
- Tranché : R13. Pendant la bêta, dépôt réservé aux invités par code d'invitation, sans achat ; passage de la vitrine en dépôt pour tous au jalon J1 (L8-07).
- « Où en êtes-vous ? » : dans le volet (OFFRES.md § 2.1, MESSAGES.md § 7.3) ou sur l'écran d'attente (PARCOURS.md A4, levier L3) ; décision L0-05. Par défaut, rien dans le volet.
- Le choix de méthode (lien magique ou Google d'abord) est le levier L1, testé par périodes (R8 : visiteurs non connectés) : prévoir l'ordre des boutons en réglage.
- Copie IndexedDB et dépôt provisoire de 24 h : exemption de consentement à confirmer par l'avocat (PARCOURS.md § 8.3, question 6 ; L0-07).
- Aucun délai en dur (R12) : `compte.texte` porte le marqueur ‹délai›, remplacé par la valeur T0 de L5-11 ; avant T0, la phrase est retirée ou remplacée par son repli (MESSAGES.md § 0.3).

## Références
- PARCOURS.md § 0, § 1.5, § 1.6, A1 à A6, § 7.2 (L1, L2) ; MESSAGES.md § 1.1, § 7.1 à § 7.3, E1, E2 ; OFFRES.md § 2.1, § 2.5, § 9.2 (T5).
- ARCHITECTURE.md § 2.3, § 2.5, § 6.2 (CSP), § 6.3 (jetons), § 6.4 (limites), § 6.8 ; recherche/auth-paiement.md § 1.5.
- SUIVI.md § 2.9 (envoi de `attr` avec la demande de lien, branché par L7-03), § 3.6, § 3.7.
- `pipeline/serveur.py:52` (`format_fichier`), `pipeline/accueil.html:164` (`send`, dépôt actuel en `POST` avec en-tête `x-nom`, à ne pas reprendre).

## Hors périmètre
- Dépôt provisoire, analyse sans IA et purge à 24 h : L5-23. Authentification elle-même : L5-03. Connexion Google : L5-24.
- Anti-abus du plan offert : L6-06. Qualification : L6-02. Calibration : L6-04. Écran d'attente : L6-03.
- Attribution recopiée sur le compte : L7-03. Passage de la vitrine en dépôt pour tous : L8-07.
