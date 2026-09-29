# L8-02 · Déblocage immédiat de la visite

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | M (1 à 3 j) | L8-01, L6-05 | `service/` | À faire |

## Pourquoi
L'aperçu offert passe par la même chaîne qu'un plan payant, visite de contrôle comprise (`OFFRES.md` § 2.2) : `plan.json` est déjà contrôlé et gardé côté serveur avec les images (décision 6 : ni moteur ni `plan.json` envoyés pour l'aperçu). Débloquer, c'est servir le moteur, `plan.json` et, quand ils existent, les fichiers que le serveur prépare pour une visite fluide sur appareil modeste (maquette compressée, éclairage précalculé, itinéraires ; décision 14, L5-28) à la vue propriétaire, la visite 3D se calculant dans le navigateur du client (décision 5), sans nouvelle lecture ni nouvelle attente. Ces fichiers doivent exister avant le déblocage ; le moment du précalcul est à décider (pour tout plan dans la chaîne, ou au déblocage avec une attente) (« La visite s'ouvre dès le paiement »). **Tranché : R1, R2.** Au lancement, **aucune photo supplémentaire** n'est rendue au déblocage : la visite montre les mêmes images que l'aperçu (vue du dessus, plan 2D, 2 photos, ou moins si une photo a été omise), au pire aucune photo ; la galerie complète viendra avec L13-02. Le plan offert a été consommé à la publication de l'aperçu ; le déblocage consomme un plan complet et ne relance aucune lecture. **Tranché : R4.** Le verrou est côté serveur, pas dans l'interface : la page de visite n'existait simplement pas (ARCHITECTURE.md M3.2, réécrit en ce sens).

## À faire
1. **`service/deblocage.py`, `debloquer(plan, compte, origine)`**, avec `origine` = `achat` (appelé par le webhook de L8-01, clé = session Checkout) ou `plan_disponible` (bouton `verrou.bouton_plan_dispo`, clé = `deblocage:<plan_id>`) :
   - vérifie : plan de l'organisation (404 sinon), publication active de type `apercu`, aperçu non expiré (6 mois, `OFFRES.md` § 6.8), aucune publication complète active (sinon sans effet : idempotent) ;
   - exige une acceptation de la case de renonciation « déblocage d'un aperçu » rattachée (L8-03), sauf lot sans paiement (`testeur`, `code`, `geste_commercial`) ;
   - dans **une** transaction : nouvelle ligne `publications` `type='complete'` (même `travail_id`, même `moteur_version`, même préfixe CDN), bascule de `plans.publication_active_id`, `heberge_jusqu_au` = maintenant + durée de la version d'offre du lot consommé (24 mois au lancement) ; **puis** `consommer_directement(org, type='complet')` (L5-07, lot choisi selon `OFFRES.md` § 6.3) ; événement `apercu_debloque`.
2. **Page de visite sans rendu ni IA** : appel de `publier` (L5-12) en mode « complet depuis une publication simple » : `index.html` pointé sur `moteur/v<N>/` (version validée par la visite de contrôle), `plan.json` filtré déjà présent dans l'espace privé. Aucune ligne `appels_ia`, aucune tâche `rendu` ni de précalcul (si le précalcul est fait pour tout plan dans la chaîne) ; les fichiers précalculés, déjà dans l'espace privé, passent au préfixe publié.
3. **Cohérence des photos** : le `plan.json` publié ne liste que les vues dont l'image marquée existe sous `publie/p/<préfixe>/photos/` (vue du dessus en `orbit`, 2 photos, ou moins). La galerie adaptable de L4-09 affiche de 0 à N photos ; les panoramas 360° des arrêts (L5-27), s'ils existent, sont publiés de la même façon, arrêt omis compris : aucune vignette vide, grise ou cassée (`photoFile`, `moteur/ui.js:833`).
4. **Ouverture** : redirection vers la vue propriétaire (jeton court de L5-12), sur la galerie, bouton « Lancer la visite 3D » actif (`g-cta`, `moteur/ui.js:400`) ; message `verrou.ouvert` (« Votre visite est ouverte. », `MESSAGES.md` § 7.6, catalogue de L4-05). Les variantes `verrou.ouvert.galerie` et `verrou.photos_pretes`, marquées [SI LIVRÉ : L13-02], ne sont pas utilisées au lancement.
5. **Ce qui s'ouvre avec la visite**, liste lue dans le contenu de la version d'offre (L5-08) : partage de la visite (L6-08), fiche complète (dialogue `#fiche`, `ficheHTML`), téléchargements (L8-08, affichés seulement s'ils sont livrés), bouton « Signaler un défaut » (L6-09). Les liens d'aperçu déjà créés (`/a/<jeton>`) restent des aperçus.
6. **Après le déblocage** : la page d'aperçu redirige vers la visite ; e-mails E7 et E8 fusionnés (L8-01, L8-03) ; pas d'E4.
7. **Contrôle automatique après chaque déblocage** (`outils/verifier_publication.mjs` de L5-12, étendu) : ouverture de la vue propriétaire, aucune requête en échec (image 404, fichier précalculé absent), nombre de vignettes = nombre d'images publiées, bouton de visite actif après chargement, aucun texte technique (L1-04), aucune violation de CSP. En cas d'échec : publication complète retirée, retour à l'aperçu, plan rendu sur son lot, alerte, message du catalogue.
8. **Cas limites** :
   - aperçu expiré et purgé (L5-20) : déblocage impossible ; le plan acheté reste disponible pour un nouveau dépôt ;
   - paiement reçu mais déblocage en échec : le plan reste dans le compte (`compte.plans.dispo`), alerte, aucun nouvel achat demandé.

## Critères d'acceptation
- [ ] Bout en bout sur le témoin (`docker compose`, Stripe en mode test, `PLAN_MOCK`) : aperçu → paiement → visite ouverte moins de 5 s après le webhook (mesuré), zéro appel IA, zéro tâche de rendu.
- [ ] Webhook rejoué et double clic → une seule consommation, une seule publication complète.
- [ ] Plan disponible (lot testeur, reste d'un pack) → déblocage sans paiement ; case de renonciation exigée pour un lot acheté, pas pour un lot testeur.
- [ ] Galerie avec 2, 1 et 0 photo : aucune vignette vide ou noire (captures et contrôle du point 7).
- [ ] Avant déblocage, `plan.json`, `engine.js` et les fichiers précalculés de la visite répondent 404 (test de L6-05) ; après, ils sont servis par la vue propriétaire.
- [ ] Contrôle du point 7 forcé en échec → retour à l'aperçu, plan rendu, invariants du grand livre verts.
- [ ] Aucun texte technique, zéro défaut visible ; outil local inchangé (`pipeline/` et `moteur/` non modifiés).

## Mesure
- `apercu_debloque` (`delai_depuis_apercu`, `source_lot`).

## Points d'attention
- **Tranché : R1, R2.** Aucune photo n'est rendue au déblocage au lancement ; « environ 11 photos », « 8 autres photos » et « photos restantes rendues ensuite » ne décrivent pas le lancement (`OFFRES.md` § 2.4 et § 6.4 alignés). `photos_completees` reste inutilisé jusqu'à L13-02.
- **Tranché : R4.** ARCHITECTURE.md M3.2 décrit désormais le verrou côté serveur (aucune route ne sert `engine.js` ni `plan.json` d'un aperçu), et non un verrou d'interface.
- **Tranché : R16.** En mode `simple`, « Rendu photoréaliste de la vue » (`ui.js:375`, option future, L13-05) et la case « superposer le plan du promoteur » (`ui.js:371`) sont masqués par le ticket [M] L4-11, livré avant la bêta fermée ; ce ticket ne touche pas `moteur/`.
- Ordre des écritures : publication d'abord, consommation ensuite, dans la même transaction (`ARCHITECTURE.md` § 5.4).
- Validité de la case de renonciation au déblocage d'un contenu déjà calculé, et 24 mois d'hébergement : questions à l'avocat (`OFFRES.md` annexe B, q. 2 et 3).
- Une visite validée en version N du moteur reste en version N ; la passer sur un moteur plus récent demande un rejeu sans IA (L5-17).
- Le précalcul serveur (L4-13, L4-14, L5-28) et la qualité adaptative (L4-12) sont construits ailleurs ; ce ticket les sert, il ne les produit pas.

## Références
- produit/OFFRES.md § 2.2, § 2.4, § 6.3, § 6.4 ; produit/ARCHITECTURE.md M3.2, § 5.4, § 5.5, § 5.6.
- produit/PARCOURS.md A10, A12, § 8.2 ; produit/MESSAGES.md § 7.6, § 7.7 ; produit/SUIVI.md § 3.9.
- `moteur/ui.js:310` (`pageHTML`), `:400` (bouton `g-cta`), `:833` (`photoFile`), `:371` et `:375` (réglages visibles en mode simple), `:416` (`ficheHTML`), relevés le 27/09/2026.

## Hors périmètre
- Paiement et webhook : L8-01. Cases, E8 : L8-03. Téléchargements : L8-08.
- Galerie complète rendue au déblocage : L13-02. Partage de la visite : L6-08. Rejeu sur un nouveau moteur : L5-17.
- Masquage des réglages avancés et de la superposition en mode simple : L4-11.
