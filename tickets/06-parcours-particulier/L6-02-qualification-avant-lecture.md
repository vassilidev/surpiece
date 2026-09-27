# L6-02 · Qualification bon marché avant toute lecture payante

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L4-04 | `pipeline/` [P], `service/` | À faire |

## Pourquoi
Une lecture coûte 1,10 à 1,85 $ ; un plan hors périmètre lu pour rien coûte une lecture et rend le crédit (OFFRES.md § 0.2 règle 1, § 10 risque 2). Aujourd'hui la qualification (environ 0,02 $ mesuré, recherche/audit-code.md A9) ne tourne que pour les images ou les échelles incertaines : `qualifier` n'est appelée que depuis `calibration_needed` (`pipeline/serveur.py:245`). Les PDF passent directement à la lecture. Ce ticket l'étend à tous les plans, avec des refus motivés qui ne décomptent rien, et règle ses seuils par le test T1, plan par plan.

## À faire
1. **Appeler la qualification pour tout plan**, PDF compris, dans l'étape `qualifier` de `pipeline/etapes.py` (extraite par L4-04), après l'analyse sans IA et **avant** toute réservation et toute lecture (PARCOURS.md A6 : après le compte, avant la calibration). En local, `serveur.py` l'enchaîne de la même façon ; `PLAN_MOCK` continue de la sauter (`qualifier`, `pipeline/serveur.py:264`).
2. **Image envoyée** : pour un PDF, la page entière (`page.png`, produite par `extract`, `pipeline/extract.py:1105`) plutôt que `plan-src.png`, recadré, pour voir plusieurs logements sur la page ; pour une image, `calibration.png` ou `plan-src.png` comme aujourd'hui. L'image passe par le masquage du cartouche (L1-10), qui couvre déjà la qualification.
3. **Question élargie**, réponse en JSON fermé. Garder les champs actuels (`plan`, `lisible`, `niveaux`, `cotes_visibles`, `tableau_surfaces`) et ajouter : type de logement (`appartement`, `maison`, `autre`), nombre de logements dessinés, nature du document (`plan_cote`, `perspective`, `croquis`, `autre`). Aucun texte libre du modèle n'est plus montré : `remarque` part au journal seulement (aujourd'hui elle est ajoutée au message de refus, `pipeline/serveur.py:282`).
4. **Règle de décision** dans une fonction pure, séparée de l'appel, qui rend un code du catalogue (L4-05) :
   - `pas_un_plan` → `depot.refus.pas_un_plan` ; `perspective` ou `croquis` → `depot.refus.perspective` ;
   - `maison` → `depot.refus.maison` ; plusieurs logements → `depot.refus.plusieurs_lots`. Aujourd'hui l'analyse empilerait les pages d'un PDF de plusieurs lots comme des niveaux : en service, ce refus de la qualification est la seule protection (R17), et il passe avant le recoupement des niveaux pour ne pas afficher « plusieurs niveaux » à tort ;
   - plusieurs niveaux → recoupé avec l'extraction par `niveaux_refus` (`pipeline/serveur.py:218`), refus seulement si `ConfigProduit.niveaux_max` le demande (L4-08) → `depot.refus.niveaux` ;
   - peu lisible → pas de refus : choix laissé à l'utilisateur, « Déposer un meilleur fichier » ou « Continuer avec ce plan » (texte « à ajouter », PARCOURS.md § 1.6).
   Tout refus : aucun mouvement au grand livre, « Rien n'a été décompté. », plan offert intact.
5. **Échec de l'appel** (réseau, 5xx après les nouvelles tentatives de L4-03) : pas de lecture sans qualification. Le travail attend et reprend seul ; message `erreur.indisponible`. Aujourd'hui l'échec laisse passer (`return True` après `avertir`, `pipeline/serveur.py:277-279`) et affiche un détail technique.
6. **Coût** : l'appel est journalisé comme les autres (`appels_ia`, L4-02), compté dans le budget de 3 $ du plan (R6) et imputé à la clé choisie par L5-09 : clé « gratuit » pour le seul plan offert des particuliers, clé « payant » pour les autres, dont les essais pros (R23). Payée une seule fois par plan : la réponse est gardée et relue en cas de reprise.
7. **Formulaire « Me prévenir si cela change »** après `depot.refus.niveaux` et `depot.refus.maison` (MESSAGES.md § 7.1) : e-mail rangé dans une table dédiée, jamais dans le journal ; un seul e-mail envoyé, lien de désinscription.
8. **Test T1** (OFFRES.md § 9.2) : sur les plans fournis par l'utilisateur, un par un, y compris hors périmètre. Pour chaque plan : attendu (à la main), obtenu, coût. Compter les faux acceptés (une lecture perdue) et les faux refusés (une vente perdue). La règle de décision se rejoue **sans repayer** sur les réponses gardées ; seul un changement de question ou de modèle demande un nouvel appel.
9. Consigner le réglage retenu et le tableau T1 (identifiant neutre, verdicts, coûts ; ni image, ni nom de programme) dans un fichier de mesures versionné, par exemple `references/qualification-T1.md`.

## Critères d'acceptation
- [ ] Tests unitaires de la règle de décision sur des réponses JSON enregistrées (une par motif, plus réponses incomplètes ou mal formées) : bon code du catalogue, aucun texte venu du modèle.
- [ ] Test avec le faux serveur OpenRouter (L4-03) : appel en erreur → travail en attente, aucune lecture lancée, aucun mouvement au grand livre.
- [ ] Sur un PDF refusé, `appels_ia` ne contient que l'appel de qualification ; aucune ligne de lecture.
- [ ] Rejeu sans IA des plans de référence (L1-02) : `plan.json` identiques ; `evaluer.py` au moins égal à la référence ; visite de contrôle et contrôle des textes réussis ; test de fumée de l'outil local réussi (critère de fusion d'ARCHITECTURE.md § 8.1).
- [ ] T1 joué **seulement sur accord explicite de l'utilisateur**, avec la clé `dev` (environ 0,02 $ par plan), résultats consignés.
- [ ] Contrôle des textes (L1-04) passé sur chaque message de refus.

## Mesure
- S : `plan_qualifie` (`resultat`, `motif_refus`, `cout_usd`) ; `alerte_prise_en_charge_demandee` (`motif_refus`).
- Valeurs `maison`, `plusieurs_lots`, `peu_lisible` à ajouter à `motif_refus` ou `resultat` dans SUIVI.md et `mesure/evenements.json` (PARCOURS.md § 8.1).

## Points d'attention
- **Ticket [P]** : petits diffs isolés sur une branche courte, après la fusion du travail sur les duplex (dépendance L4-04). `pipeline/niveaux.py` n'est pas touché ; le refus des niveaux reste réglé par `niveaux_max` pour que l'outil local continue d'accepter les duplex en cours de validation.
- Le prompt de qualification vit aujourd'hui dans `qualifier` ; le déplacer avec les autres prompts versionnés (`version_prompts`, ARCHITECTURE.md § 7.2).
- `page.png` montre le cartouche : sans L1-10, la qualification enverrait des noms et une adresse au modèle. L1-10 est un prérequis de L6-10.
- Un modèle moins cher pour la qualification est possible, mais seulement après T1 comparatif (OFFRES.md § 10 risque 4).
- Seuil de pilotage : plus de 20 % d'échecs après lecture → resserrer la qualification (OFFRES.md § 8.11). Ce ticket fournit le levier ; la surveillance est dans L7-06.
- Les refus de la qualification arrivent après la création du compte : l'utilisateur a déjà donné son e-mail. Le message doit le dire sans reproche et laisser le plan offert disponible.

## Références
- recherche/audit-code.md A9, B8, B9 ; PARCOURS.md § 1.6, A6 ; OFFRES.md § 0.2, § 1 (périmètre), § 9.2 (T1), § 10 ; MESSAGES.md § 7.1.
- ARCHITECTURE.md § 2.3 (étape 2), § 6.5, § 8.1 ; SUIVI.md § 3.8, § 4.8 (T1).
- `pipeline/serveur.py:260` (`qualifier`), `:237` (`calibration_needed`), `:218` (`niveaux_refus`), `:106` (`refus`) ; `pipeline/extract.py:1105` (`page.png`) ; `pipeline/lire.py:84` (`img_block`), `:107` (`call`).

## Hors périmètre
- Refus avant compte (format, poids, PDF protégé, tracés non reconnus) : analyse sans IA de L5-23.
- Refus des plans à plusieurs niveaux en service : réglage de L4-08. Coupe-circuit « aperçu réservé aux PDF » : L8-09.
- Découpage d'un PDF de plusieurs lots, une page = un plan : import promoteur seulement (L10-02, R17).
