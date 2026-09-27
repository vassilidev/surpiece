# L5-11 · Livraison en deux temps : visite d'abord, images en direct

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-10, L5-06, L4-07 | `service/`, `outils/` | À faire |

## Pourquoi
Sans GPU, le rendu est environ 11 fois plus lent (11 photos : 684 s en SwiftShader contre 60 s en Metal, `recherche/hebergement.md` § 2.1). Attendre une galerie complète rendrait le délai intenable. Décision de l'utilisateur du 27/09/2026 (n° 5) : le serveur ne fait que la visite de contrôle et des images d'aperçu, dans l'ordre vue du dessus 3D découpée → plan 2D coté → 2 photos, chacune montrée dès qu'elle existe ; la visite 3D, calculée dans le navigateur du client, est publiée dès le contrôle réussi. Aucune image n'est montrée avant le contrôle : une visite qui échoue ne doit rien avoir laissé voir. Règles de publication tranchées par R2 (OFFRES § 0.2 règle 2, § 6.4) : l'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts, les photos s'ajoutent ensuite, une photo en échec est omise sans bloquer. Ce ticket orchestre cet ordre, expose l'avancement image par image et mesure le délai réel (T0).

## À faire
1. **Enchaînement après la lecture** (tâche `generation` de L5-06, dans `service/`) : `controle` dans le worker lecture, en SwiftShader, jusqu'à 6 passages avec `repare_moteur` entre deux (logique de `controle`, `pipeline/serveur.py:346`, et de `outils/finalise.sh`). Rien n'est mis en file `rendu` avant un contrôle réussi.
2. **Au contrôle réussi**, dans une transaction : créer le préfixe de publication (128 bits, `ARCHITECTURE.md` § 5.2) ; si le lot réservé est de type `complet` (achat, abonnement, testeur si L0-04 le retient…), publier la visite tout de suite (appel à L5-12) ; mettre en file **une** tâche de rendu ordonnée : `vue_dessus` (vue du dessus 3D découpée, nouvelle vue de L4-09, et non la vue `maquette`), `plan_2d`, `photo_1`, `photo_2`. Le choix des vues (séjour, puis chambre principale ou, à défaut, la pièce principale suivante, `OFFRES.md` § 2.2, R1) et la capture du plan 2D viennent de L4-09.
3. **Livraison image par image.** Le contrat de L5-10 fait déjà rappeler l'API par l'exécutant dès qu'une image est écrite (`moteur/photos.mjs` écrit un JPEG par vue, `photos.mjs:107`), avec un jeton de rappel par image attendue ; la route de rappel de L5-10 vérifie et brûle le jeton, contrôle l'image (texture noire, image uniforme) et l'enregistre dans `etapes.sorties`.
4. **Ce ticket prend la suite du rappel** : marquer l'image (`pipeline/marquage.py` de L4-07 : mention incrustée et métadonnée, appelé, jamais modifié) ; copier l'image marquée vers `publie/p/<préfixe>/` ; mettre à jour l'état public. Une image en échec est retentée une fois ; les suivantes ne l'attendent pas. Une photo toujours en échec est omise (galerie adaptative de L4-09, sans emplacement vide), l'équipe est alertée (L5-16), rien ne bloque (R2).
   - **Publication de l'aperçu** (plan offert, R2) : dès que `vue_dessus` et `plan_2d` sont marquées et copiées, appel à la publication simple de L5-12, qui écrit la ligne `publications`, consomme le plan offert et écrit `apercu_pret` dans la même transaction ; les photos s'ajoutent ensuite à l'état public. Vue du dessus ou plan 2D impossibles après nouvelles tentatives : rien n'est publié, crédit libéré, `erreur.verification`, E6.
5. **État public** (vue réduite de L5-05) : ajouter `images`, liste ordonnée `{type: vue_dessus|plan_2d|photo, rang, url}` où `url` est une route de l'application qui vérifie l'organisation puis redirige (302) vers le CDN ; `visite_disponible` (booléen) ; étapes et libellés de `MESSAGES.md` § 7.4 par leur clé, jamais un texte libre. Liste vide tant que le contrôle n'a pas réussi. Pourcentage qui ne recule jamais, avec des poids d'étape recalés sur T0.
6. **E-mails et fin du travail** : E3 part à la publication de l'aperçu, E4 à la publication de la visite (OFFRES § 6.4), par L5-14. Le travail passe `reussi` quand les 4 images sont là ou omises, au plus tard `DELAI_IMAGES_MAX` après le contrôle (réglage, valeur tirée de T0). Visite complète sans photos : livrée quand même (décision n° 5, « au pire la visite sans les photos »), images manquantes relancées une fois sans frais.
7. **Crédit** (tranché : R2) : le plan offert est consommé à la publication de l'aperçu, le plan complet à la publication de la visite, jamais avant le contrôle réussi ; le déblocage payant ne relance aucune lecture (L8-02). Échec du contrôle → libération, `erreur.verification`, E6.
8. **Mesure T0 en conteneur** : `outils/mesure_t0.sh` (nouveau) lance le Compose de L5-01 sur la taille de VM retenue (L0-03), rejoue sans IA (clés vidées comme `finalise.sh:7`) le témoin et, en local ou en préproduction seulement, les 4 plans réels ; il chronomètre chaque passage de contrôle, la vue du dessus, le plan 2D et chaque photo (médiane et 9e décile). Durée de lecture : reprise des `rapport.json` des plans de référence (502 à 821 s d'attente API, `recherche/audit-code.md` B8). Résultats consignés dans `OFFRES.md` § 9.2 (T0).
9. **Délai affiché** : remplacer le marqueur ‹délai› (`MESSAGES.md` § 0.3, R12 ; aucun délai en dur, ni « un quart d'heure » ni « 8 à 15 minutes ») par la valeur T0 dans `MESSAGES.md`, le catalogue (L4-05), les e-mails E2 et la vitrine. Recommandation : une seule valeur de configuration `{delai}` lue partout, pour les mises à jour suivantes (règle du 75e centile, `PARCOURS.md` § 1.3).

## Critères d'acceptation
- [ ] Sur le témoin, dans `docker compose` en SwiftShader, sans aucun appel payant (`PLAN_MOCK` ou lecture gardée) : vue du dessus, plan 2D, puis 2 photos apparaissent dans l'état public dans cet ordre, chacune avant la fin du rendu de la suivante.
- [ ] Contrôle forcé en échec (plan de test abîmé exprès) : aucune image listée, aucun objet sous `publie/p/`, crédit libéré, message `erreur.verification`.
- [ ] Offre complète : `index.html` publié avant la première image ; offre simple : aucune page de visite publiée.
- [ ] Exécutant tué pendant les photos : visite complète livrée sans photos avec E4, un seul mouvement de consommation, photos relancées une fois sans frais.
- [ ] Aperçu : publié et plan offert consommé dès la vue du dessus et le plan 2D ; photo en échec forcé → omise, aucun emplacement vide, alerte émise ; plan 2D en échec forcé → rien de publié, crédit rendu, E6.
- [ ] Une image arrivée hors ordre (photo avant la vue du dessus, simulée) est affichée à son rang, sans attendre ni bloquer les autres.
- [ ] Chaque image listée porte la mention et la métadonnée (contrôle de L4-07) ; aucune image noire (contrôle de L5-10).
- [ ] Contrôle « aucun texte technique » (L1-04) réussi sur l'état public et les e-mails E3, E4, E6.
- [ ] Tableau T0 consigné ; délai affiché identique partout (test qui échoue si le marqueur ‹délai›, « un quart d'heure » ou « 8 à 15 minutes » subsiste après remplacement).
- [ ] Outil local inchangé : `python3 pipeline/serveur.py` et `outils/finalise.sh <id>` marchent comme avant (aucun fichier de `pipeline/` ni de `moteur/` modifié).
- [ ] Tout défaut trouvé pendant la recette devient un contrôle automatique.

## Mesure
- `controle_termine` (`resultat`, `passages`, `defauts`).
- `apercu_pret` à la publication de l'aperçu, `plan_pret` à celle de la visite (`source_lot`, `duree_s`, `cout_ia_usd`, `relance`, `version_moteur`) ; `photos_pretes` (`type_plan`, `photos`, `omises`, `duree_s`) à la fin des images (`SUIVI.md` § 3.8).
- `plan_echoue` (`etape` = `controle` ou `images`, `cause` = `controle_bloquant` ou `rendu_images` : vue du dessus ou plan 2D d'un aperçu impossibles ; une photo manquante n'est jamais un échec, R2), `credit_rendu`.
- `email_envoye` (`modele` = `apercu_pret`, `visite_prete`, `echec`).

## Points d'attention
- **Tranché : R2.** Consommation du plan offert à la publication de l'aperçu, du plan complet à la publication de la visite (`OFFRES.md` § 0.2 règle 2, § 6.4 ; `ARCHITECTURE.md` § 2.3 étape 9).
- **Tranché : R2.** Contenu minimal de l'aperçu : vue du dessus et plan 2D obligatoires ; photos omises si elles échouent après nouvelles tentatives (galerie 0 à N de L4-09), avec alerte.
- Jetons de rappel : un jeton par image, désormais écrit dans `ARCHITECTURE.md` § 6.3.
- **Dictionnaire.** Réglé dans `SUIVI.md` § 3.8 : `apercu_pret` et `plan_pret` sont écrits à la publication, `photos_pretes` à la fin des images ; `photos_completees` ne sert qu'avec la galerie complète (L13-02). Reporter ces noms dans `mesure/evenements.json`.
- **Ordre de grandeur (estimation, à remplacer par T0)** : 3 images en 215 s sur un M3 à 8 cœurs, soit environ 70 s par image ; 1,5 à 2 fois plus sur des vCPU de serveur. La vue du dessus arriverait environ 2 min après le contrôle, le jeu complet 6 à 9 min après. Estimations internes, jamais affichées (R12).
- `MESSAGES.md` § 7.4 n'a qu'une étape « Maquette et photos » : l'affichage image par image est à régler dans L6-03.
- Les 4 plans réels ne vont ni en CI ni dans un rapport publié (`CLAUDE.md`).
- Si le catalogue de L4-05 vit dans `pipeline/messages.py`, y changer le délai est un petit diff `[P]` à coordonner avec le travail sur les duplex (critère de fusion d'`ARCHITECTURE.md` § 8.1) ; la variable `{delai}` lue dans la configuration l'évite.

## Références
- Décisions de l'utilisateur du 27/09/2026, n° 4 et n° 5 ; arbitrages R2, R3, R12.
- `produit/PARCOURS.md` A7, § 1.3 ; `produit/MESSAGES.md` § 0.3, § 7.4, § 7.11 (E3, E4, E6), § 7.12 ; `produit/OFFRES.md` § 0.2, § 2.2, § 6.4, § 9.2 (T0), § 10 (risque 3).
- `produit/ARCHITECTURE.md` § 2.3, § 5.2, § 5.4, § 6.3, M2.7a, M2.7b ; `produit/recherche/hebergement.md` § 2.1, § 2.3.
- `pipeline/serveur.py:346` (`controle`), `:378` (`photos`), `:419` (`run`) ; `moteur/photos.mjs:12` (liste de vues en argument), `:107` (écriture d'une image), `:112-116` (vues écartées) ; `outils/finalise.sh`.

## Hors périmètre
- Rendu des vues et galerie adaptable : L4-09. Exécutant de rendu et contrat : L5-10. Publication : L5-12.
- Écran d'attente : L6-03. Page d'aperçu : L6-05. Déblocage : L8-02.
- Accélération du rendu : L13-01. Galerie complète : L13-02.
