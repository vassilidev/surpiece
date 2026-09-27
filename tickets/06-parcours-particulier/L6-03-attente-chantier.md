# L6-03 · Écran d'attente « chantier » avec images en direct

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L5-11, L6-01 | `service/` | À faire |

## Pourquoi
L'attente est le moment du doute : sans carte graphique, elle sera plus longue que les 8 à 15 min mesurées sur Mac (OFFRES.md § 10 risque 3). Décision utilisateur 5 : la vue du dessus 3D découpée est rendue en premier et **affichée en direct sur l'écran d'attente dès qu'elle existe**, puis le plan 2D coté, puis les 2 photos. L'écran « chantier » de `pipeline/accueil.html` est réutilisable tel quel (recherche/audit-code.md § 3) ; seuls changent la source de l'état (la base, L5-11) et les textes, dont la promesse fausse de notification onglet fermé (audit A4).

## À faire
1. **Copier** dans les gabarits de `service/` (Jinja2 et JS sans étape de build) la barre, la chronologie des 40 phrases (`CHANTIER`, `pipeline/accueil.html:122`), le lissage qui ne recule jamais (`pipeline/accueil.html:152`) et la liste des étapes (`poll`, `:179`). **`pipeline/accueil.html` n'est pas modifié** : l'outil local garde son écran.
2. **Page** `app.<domaine>/plans/<id>/attente`, cadrée par organisation (404 sinon). Sections dans l'ordre (MESSAGES.md § 7.4, maquette PARCOURS.md A7) :
   - titre `attente.titre` (« Votre plan est en chantier ») ; barre avec pourcentage en DM Mono ; titre d'onglet `attente.onglet`, puis `attente.onglet_fini` ;
   - phrase de chantier (décorative) ;
   - étapes : « Plan reçu », « Échelle » (seulement si calée), « Lecture du plan », « Vérification avant livraison », « Maquette et photos », « Votre plan est prêt » ou « Votre visite est prête », avec leurs sous-textes ;
   - **zone des images** : vide tant que le contrôle n'a pas réussi ; la vue du dessus apparaît dès qu'elle est listée par l'état public (L5-11), avec la phrase « Votre appartement est sorti de terre » (à ajouter au catalogue) ; puis le plan 2D coté, puis les photos. Mention courte « Illustration non contractuelle » sous chaque image ;
   - `attente.texte` avec l'adresse du compte : on peut fermer la page, un e-mail prévient ;
   - bouton secondaire `attente.notif.bouton` (API Notification, page ouverte seulement), puis `attente.notif.ok` ;
   - bloc « Pendant l'attente » : témoin (`/appartement-temoin`, bouton secondaire, nouvel onglet), rappel de ce qu'apporte le plan offert, lu dans le catalogue et sans prix pendant la bêta (R13) ;
   - emplacements des questions facultatives : « Où en êtes-vous ? » (`compte.etape.*`) si L0-05 la place ici ; « Comment nous avez-vous connu ? » livrée par L7-03.
3. **Source de l'état** : lecture périodique (toutes les 2 s environ) de la vue publique de l'état (L5-05, L5-11) : étape, pourcentage, code de message, liste des images disponibles avec leurs URL signées courtes. Aucune donnée du plan (`plan.json`, `extract.json`) n'est lue par la page.
4. **Pourcentages** recalés sur les durées mesurées en conteneur par T0 (L5-11) : la part « Maquette et photos » est bien plus longue en SwiftShader qu'en Metal. La barre ne recule jamais, y compris après une reprise de travail (`erreur.interrompu`).
5. **États particuliers** : `attente.file`, `attente.file_offert` (ordre de passage d'OFFRES.md § 1), `attente.plafond_jour` et `attente.plafond_jour.lien` (budget du jour, L5-09), `attente.limite_connexion` (limite par IP, L6-06), `erreur.delai` au-delà du 95e centile mesuré, `erreur.lecture`, `erreur.verification`, `erreur.indisponible`. En cas d'arrêt, seul le message d'erreur s'affiche : « Chantier à l'arrêt. » est retiré.
6. **Fin** (R2) : dès la publication (aperçu : vue du dessus et plan 2D prêts ; visite : contrôle réussi), plan offert → bouton principal vers l'aperçu (L6-05) ; plan complet (lot complet, dont le lot testeur si L0-04 le retient) → « Entrer dans ma visite » (vue propriétaire, L5-12). Les photos continuent d'apparaître ; une photo omise ne laisse aucun emplacement vide. L'e-mail E3 ou E4 part du serveur (L5-11), que la page soit ouverte ou non.
7. **Reprise** : l'écran se rouvre depuis « Mes plans » (L6-07) ou le lien de l'e-mail E2, sur n'importe quel appareil connecté, à l'état du serveur.
8. **Accessibilité** (PARCOURS.md § 1.5) : `role="progressbar"` et `aria-valuenow` ; étapes et apparition des images annoncées en `aria-live="polite"` ; phrases de chantier non annoncées ; étapes distinguées par la forme (plein, contour, pulsation) ; `prefers-reduced-motion` : ni pulsation ni fondu, barre par paliers (écart relevé par MARQUE.md § 6.9) ; texte alternatif des images (« Vue du dessus de la maquette 3D », « Plan 2D coté », nom de la pièce). Mobile : questions et témoin sous les étapes, 320 px sans défilement horizontal.

## Critères d'acceptation
- [ ] Parcours joué par puppeteer sur le témoin fictif en `PLAN_MOCK` (aucune lecture payante) : la barre échantillonnée toutes les 250 ms ne décroît jamais ; aucune image avant la fin du contrôle ; ordre d'apparition vue du dessus → plan 2D → photos vérifié.
- [ ] Onglet fermé pendant le chantier : l'e-mail arrive dans Mailpit ; la page rouverte depuis un autre contexte de navigateur connecté reprend à l'état du serveur.
- [ ] Arrêt brutal du worker simulé : la barre ne recule pas, message `erreur.interrompu`, aucun nouvel appel payant.
- [ ] Contrôle « aucun texte technique » (L1-04) sur chaque état, erreurs provoquées comprises ; aucune `{variable}` non remplie.
- [ ] Capture en mouvement réduit émulé (`page.emulateMediaFeatures`) : aucune animation ; capture à 320 px conforme.
- [ ] Aucune requête vers `engine.js`, `/moteur/` ou `plan.json` depuis cette page (interception puppeteer).
- [ ] Zéro défaut visible : aucune image cassée ni noire (dimensions et luminance vérifiées).

## Mesure
- N : `cta_demo_clique` (`emplacement=attente`), `section_vue`, `erreur_affichee`.
- S (si la question est ici) : `situation_declaree`. Les événements `apercu_pret`, `plan_pret`, `photos_pretes`, `plan_echoue` et `email_envoye` sont écrits par la chaîne (L5-06, L5-11), pas par la page.

## Points d'attention
- Tranché : R2. L'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts ; une photo qui échoue après nouvelles tentatives est omise, sans bloquer ni laisser d'emplacement vide ; au pire, la visite est livrée sans photos.
- Les étapes et le rappel « plan 2D coté, maquette 3D et 2 photos » doivent rester vrais pour la version de l'offre en vigueur : lire le contenu dans le catalogue d'offres (L5-08), pas en dur.
- « Votre appartement est sorti de terre » et les sous-textes des images sont absents de MESSAGES.md : à y ajouter avant de coder (règle : aucun texte hors catalogue).
- Les images viennent du plan du client : elles restent privées (URL signées courtes), jamais sur un CDN public sans jeton.
- Aucun délai en dur (R12) : `attente.texte` porte le marqueur ‹délai›, remplacé par la mesure T0 (MESSAGES.md § 0.3) ; avant T0, la phrase est retirée ou remplacée par son repli. PARCOURS.md § 1.3 propose ensuite le 75e centile sur 7 jours, arrondi aux 5 min supérieures.

## Références
- PARCOURS.md A7, § 1.3, § 1.5 ; MESSAGES.md § 7.4, § 7.11 (E2 à E6), § 7.12 ; MARQUE.md § 6.9, § 10.2.
- recherche/audit-code.md § 3 (écran « chantier »), A4 ; OFFRES.md § 1 (file), § 2.1, § 10.
- `pipeline/accueil.html:119` (`STEPS`), `:122` (`CHANTIER`), `:136-144` (`notify`, `notifUI`), `:152` (barre), `:179` (`poll`).

## Hors périmètre
- Production et publication des images dans cet ordre, état public, e-mails : L5-11, L5-14.
- Calibration pendant l'attente : L6-04. Page d'aperçu : L6-05. Question « Comment nous avez-vous connu ? » : L7-03.
- Accélération du rendu : L13-01.
