# L6-04 · Calibration au clic dans le nouveau parcours

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L6-03 | `service/` | À faire |

## Pourquoi
Sur une capture ou une photo sans cote lisible, l'échelle doit être calée par l'utilisateur **avant** la lecture payante : une calibration faite après écarte une lecture déjà payée (`ecarter_lecture`, `pipeline/serveur.py:251` ; OFFRES.md § 1). La calibration au clic d'`accueil.html` est réutilisable (détection des centimètres, points trop proches, vraisemblance ; recherche/audit-code.md § 3). PARCOURS.md A6 propose en plus de ne réserver le plan qu'**après** la cote validée, pour qu'un plan ne soit jamais bloqué pendant que l'utilisateur cherche une cote.

## À faire
1. **Copier** dans `service/` la logique de `showCalib`, `calibOk` et `draw` (`pipeline/accueil.html:216-269`) : deux clics, longueur en mètres entre 0,30 et 25, détection d'une saisie en centimètres avec bouton de correction, points trop proches (moins de 40 px), taille de page qui en découle. `accueil.html` n'est pas modifié.
2. **Écran** `app.<domaine>/plans/<id>/echelle` (ou panneau de l'écran d'attente), sections dans l'ordre de PARCOURS.md A8 et MESSAGES.md § 7.2 : `echelle.titre`, `echelle.texte`, image à calibrer, consignes `echelle.etape1` à `echelle.etape3`, champ `echelle.champ` (`inputmode="decimal"`), messages `echelle.trop_proche`, `echelle.centimetres` et `echelle.corriger`, `echelle.hors_plage`, résultat `echelle.resultat` (remplace « 1 m = n px »), rappel `echelle.rappel`, boutons `echelle.recommencer` et **`echelle.valider`** (« Valider la cote », action principale), lien « Mon plan n'a aucune cote » (texte à ajouter : demander le PDF au promoteur, plan offert toujours disponible, bouton « Déposer un autre fichier »). Après validation : `echelle.fait`.
3. **Repères** en Bleu plan ou Brique (MARQUE.md § 6.2), plus le rouge `#e33` (`pipeline/accueil.html:230`).
4. **Mobile** : zoom à deux doigts dans le cadre, loupe au-dessus du doigt, points déplaçables après la pose, variantes « Touchez… » de `echelle.etape1` et `echelle.etape2` (à ajouter). **Clavier** : réticule déplacé aux flèches, Entrée pour poser un point (proposition de PARCOURS.md A8). État annoncé à chaque étape.
5. **Image** : `calibration.png` est une image du plan du promoteur. Servie au seul propriétaire par URL signée courte, jamais publiée ni mise en cache public (ARCHITECTURE.md § 5.3).
6. **Validation côté serveur** : `POST` des deux points (pixels de l'image) et de la longueur ; contrôle des bornes et de la vraisemblance comme `H.calibration` (`pipeline/serveur.py:634`) ; recalcul de l'extraction dans le worker (étape `calibrer` de `pipeline/etapes.py`, L4-04), jamais dans le fil de la requête HTTP (audit A2). Calibration refusée : `calibration_incoherente` du catalogue.
7. **Ordre du lancement** : qualification (L6-02) → calibration → **réservation** au grand livre et création du travail de lecture. Aucune réservation tant que la cote n'est pas validée ; le plan offert reste disponible, avec sa date limite de 30 jours.
8. **E-mail E5** (« Il nous manque une cote pour continuer ») : envoyé si la cote n'est pas validée quelques minutes après la demande (proposition : 10 min, une seule fois), bouton vers cet écran. Le serveur ne sait pas si l'onglet est fermé : le délai évite d'écrire à quelqu'un qui est en train de calibrer.
9. Étape « Échelle » affichée dans l'écran d'attente (L6-03) seulement si elle a lieu ; sous-texte « Image : échelle calée sur votre cote de {valeur} m. ».

## Critères d'acceptation
- [ ] Tests puppeteer sur une image de test tirée du témoin fictif (L1-12) : saisie « 412 » → proposition « 4,12 m » ; points à 20 px → message ; cote valide → extraction refaite, lecture lancée en `PLAN_MOCK` ; **aucune lecture payante**.
- [ ] Aucun mouvement `reservation` au grand livre avant la validation (requête SQL dans le test) ; la réservation suit la validation dans la même transaction que la création du travail.
- [ ] E5 reçu dans Mailpit après le délai sans validation ; pas d'E5 si la cote est validée avant.
- [ ] `calibration.png` inaccessible sans session du propriétaire (test d'accès croisé : 404).
- [ ] Calibration faisable au clavier seul et sur un écran de 320 px (capture) ; contrôle des textes (L1-04) passé ; aucun texte « px ».
- [ ] L'outil local calibre toujours comme avant (test de fumée).

## Mesure
- S : `plan_analyse` (`resultat=a_calibrer`, déjà écrit par l'analyse), `plan_calibre` (`essais`), `email_envoye` (`modele=cote_demandee`).
- N : `erreur_affichee` (`code=calibration_incoherente`), `page_type=app_calibration`.

## Points d'attention
- Réservation après la cote validée : compatible avec OFFRES.md § 6.4 (réservation au lancement, qualification réussie) et § 1 (cote demandée avant la lecture payante). E5 dit déjà « Rien n'a été décompté ». Reste un écart d'ordre : ARCHITECTURE.md § 2.3 numérote la calibration (étape 3) avant la qualification (étape 4), PARCOURS.md A6 et ce ticket font l'inverse ; à aligner dans ARCHITECTURE.md.
- Tranché : P0. Sans ce ticket, une capture sans cote bloque le parcours avant la bêta. Le repli « aperçu réservé aux PDF » (OFFRES.md § 8.8, L8-09) reste un coupe-circuit, pas un plan de lancement.
- Le délai de 10 min avant E5 est une proposition, sans mesure.
- La calibration change l'échelle : si une lecture existe déjà (cas de l'équipe qui recalibre), `ecarter_lecture` la met de côté ; le budget du plan ne doit pas repartir de zéro (L4-02).

## Références
- PARCOURS.md A6, A8, § 8.2 ; MESSAGES.md § 7.2, E5 ; OFFRES.md § 1, § 6.4 ; MARQUE.md § 6.2.
- recherche/audit-code.md § 3 (calibration au clic), A2, A7 ; ARCHITECTURE.md § 2.3 (étape 3), § 5.3.
- `pipeline/accueil.html:216` (`showCalib`), `:223` (`calibOk`), `:227` (`draw`) ; `pipeline/serveur.py:237` (`calibration_needed`), `:251` (`ecarter_lecture`), `:634` (`H.calibration`).

## Hors périmètre
- Détection de l'échelle par l'analyse sans IA : L5-23 et `pipeline/extract.py` (inchangé).
- Qualification avant la calibration : L6-02. Écran d'attente : L6-03.
