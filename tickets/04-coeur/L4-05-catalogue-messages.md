# L4-05 · Catalogue de messages pour l'utilisateur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P] | À faire |

## Pourquoi
Principe 4 d'ARCHITECTURE.md : aucun texte technique n'atteint l'écran ; les étapes renvoient un code, un catalogue le traduit, le détail part au journal. Aujourd'hui les messages sont écrits en dur dans `serveur.py` et mélangent l'utilisateur et l'exploitant (audit B9 : `.env`, « Chrome sans écran », exceptions, phrases écrites pour l'IA, remarque libre du modèle). MESSAGES.md § 7 fournit les textes, rangés par clé `zone.élément`. Ce catalogue sert ensuite à l'état public du service (L5-05), aux workers (L5-06), aux e-mails (L5-14) et aux pages (lot 6). Déjà fait le 27/09/2026 dans l'outil local, comme filet : le filtre automatique `masquer` passe à chaque écriture d'`etat.json` (`serveur.py:106-132`) ; un texte technique y est remplacé par un texte générique et rangé dans `textes_masques`. La page de dépôt ne montre `technique_erreur` qu'avec `?debug=1`. Reste à faire : les codes et le catalogue, et sortir `technique_erreur` et `textes_masques` de l'état public (`/api/etat` renvoie encore `etat.json` en entier).

## À faire
1. **`pipeline/messages.py`** (nouveau) : `CATALOGUE = {code: Message(texte, titre=None, bouton=None, relance=False)}`. Codes = clés de MESSAGES.md § 7, textes repris mot pour mot, pour ce que la chaîne peut produire :
   - refus du dépôt et de l'analyse (§ 7.1 : `depot.refus.*`, `depot.reconnu.*`) ;
   - échelle (§ 7.2 : `echelle.*`) ;
   - étapes affichées et leurs sous-textes (§ 7.4 : libellés « Plan reçu », « Lecture du plan », « Vérification avant livraison », « Maquette et photos ») ;
   - erreurs de fabrication et de page (§ 7.12 : `erreur.lecture`, `erreur.verification`, `erreur.delai`, `erreur.indisponible`, `erreur.interrompu`, `erreur.500`…) ;
   - mentions (§ 8.3) pour L4-07.
2. **`texte(code, **valeurs)`** : lève une erreur si une `{variable}` reste vide (jamais de variable brute à l'écran) ; code inconnu → `erreur.500` à l'écran et le code au journal. Le nom du produit n'est jamais écrit en dur : `{marque}` vient de `MARQUE_NOM` (ARCHITECTURE.md, conventions).
3. **Correspondance cause → code**, dans `messages.py`, qui remplace `expliquer` (`serveur.py:500`) et les refus d'`analyse` (`:166-:229`) :

   | Cause | Code | Relance |
   |---|---|---|
   | fichier vide, format inconnu, HEIC | `depot.refus.vide`, `depot.refus.format` | non |
   | image de moins de 700 px | `depot.refus.petit` | non |
   | PDF protégé ; PDF endommagé ou sans page | `depot.refus.protege` ; `depot.refus.abime` | non |
   | murs non reconnus | `depot.refus.illisible` | non |
   | pas un plan (qualification) | `depot.refus.pas_un_plan` | non |
   | niveaux non séparés ou non superposés (défaut de lecture, `niveaux_refus`) | code à ajouter à MESSAGES.md § 7.1 (proposé : `depot.refus.niveaux_illisibles`), qui reprend le texte actuel de `niveaux_refus` | non |
| plus de niveaux que `niveaux_max` (choix de périmètre, L4-08) | `depot.refus.niveaux` | non |
   | plusieurs logements sur le plan (qualification, L6-02 ; R17) | `depot.refus.plusieurs_lots` | non |
   | clé absente ou refusée (401, 403), module manquant | `erreur.indisponible`, alerte à l'exploitant | par l'équipe |
   | plafond 402 | `erreur.indisponible` | pas de relance automatique |
   | 429, 5xx, réseau après les tentatives (L4-03) | `erreur.indisponible` | oui |
   | réponse tronquée ou illisible, refus du modèle, plan incohérent, budget dépassé (L4-02) | `erreur.lecture` | une relance payante au plus |
   | visite de contrôle bloquante | `erreur.verification` | non |
   | Chrome en échec au contrôle ou aux photos | `erreur.indisponible` | oui |
   | serveur redémarré pendant le travail | voir « Points d'attention » | oui |

4. **État** : `run` (`:419`) écrit dans `etat.json` `code` et `message = texte(code)` ; le détail technique part dans `plans/<id>/journal.txt` (ajout horodaté, jamais servi : la liste blanche de `servable`, `:464`, ne change pas) et n'est plus écrit dans `technique_erreur`.
5. **Avertissements affichés** (`#warns` d'`accueil.html`) : seulement des codes du catalogue. Les avertissements écrits pour l'IA (`lire.py`, contrôle des surfaces et des équipements) et la remarque libre de la qualification (`serveur.py:280-285`) vont au journal, jamais à l'écran.
6. **Textes d'étapes** : les textes `fait` de `serveur.py` passent au catalogue ; « surfaces conformes au plan » (`lecture`, `:323`) disparaît (mot interdit par MARQUE.md § 5 et MESSAGES.md § 0.4).
7. **Erreurs HTTP** de `do_POST`, `depot` (`:596`) et `calibration` (`:634`) : codes `echelle.trop_proche`, `echelle.centimetres`, `echelle.hors_plage`, `depot.refus.lourd`, `erreur.500`… ; plus de `technique(e)` dans une réponse.
8. **Moteur** : `erreur.3d` et `erreur.chargement` sont repris dans `moteur/ui.js` par L4-10 ; un test vérifie que les deux copies sont identiques au catalogue.
9. **Tests** : chaque texte du catalogue passe le filtre de L1-04 ; injection d'une exception dans chaque étape (`ImportError`, HTTP 401, 402, 403, 429, 500, coupure réseau, réponse tronquée, refus du modèle, JSON illisible, `BudgetDepasse`, contrôle bloquant, node qui plante, `SystemExit` d'`extract`) → l'état public ne contient que des textes du catalogue, et `journal.txt` contient le détail.

## Critères d'acceptation
- [ ] Test : chaque texte du catalogue passe le filtre de L1-04 ; aucune variable non remplie possible.
- [ ] Tests d'injection du point 9 : état public composé uniquement de textes du catalogue ; détail présent dans `journal.txt`.
- [ ] `GET /api/etat/<id>` ne renvoie jamais `technique_erreur`, un texte d'exception, un chemin, un coût ni une remarque du modèle.
- [ ] `outils/textes.mjs` (L1-04) passe sur les références et sur des erreurs provoquées (clé absente, 402, 500, contrôle en échec), comme exigé par M0.5.
- [ ] Aucun nom de produit en dur dans `pipeline/messages.py`.
- [ ] Rejeu sans IA des références (L1-02), test de fumée ; aucune lecture payante ; critère de fusion d'ARCHITECTURE.md § 8.1.
- [ ] L'étape « niveaux reconnus » (`texte_niveaux`, `serveur.py:243`, par exemple « Duplex : 2 niveaux reconnus (R+1 et R+2). ») passe au catalogue (code proposé : `depot.reconnu.niveaux`, à ajouter à MESSAGES.md § 7.1) ; les noms lus sur le plan sont des variables ; un nom de niveau illisible s'affiche « Niveau 1 », « Niveau 2 » (`nom_niveau`), jamais un identifiant.
- [ ] Tests d'injection : liste `textes_masques` vide. Le catalogue suffit, le filet `masquer` n'a rien eu à attraper.

## Points d'attention
- **Promesses fausses avant le socle.** `erreur.lecture` et `erreur.verification` promettent « Notre équipe vous écrit sous 2 jours ouvrés », `erreur.interrompu` une reprise automatique (marqué [SI LIVRÉ] dans MESSAGES.md) : faux dans l'outil local et en bêta express. Prévoir des variantes sans promesse tant que L5-06 et L5-14 ne sont pas livrés, ou un réglage qui choisit la variante. À valider par l'utilisateur.
- **Nommage réglé** : SUIVI.md § 3.15 prend désormais les clés de MESSAGES.md telles quelles (`depot.refus.format`, `erreur.offert_deja_utilise`, `erreur.404`…) comme valeurs de `erreur_affichee.code` ; une clé ajoutée au catalogue entre dans le dictionnaire par la même modification.
- **Chevauchement avec L1-05**, qui retire les textes techniques en place : si L1-05 passe d'abord, ce ticket remplace ses textes par des codes, sans les réécrire.
- Plusieurs textes sont marqués **[À VALIDER : avocat]** dans MESSAGES.md : les reprendre tels quels, la validation se fait dans MESSAGES.md.
- **Coordination avec le travail sur les niveaux** (terminé le 27/09/2026, pas encore commité : 23 fichiers, dont `pipeline/niveaux.py`) : partir de son commit ; `serveur.py` et `accueil.html` le portent ; nouveau fichier `pipeline/messages.py`, diffs limités à `expliquer`, `refus`, `run`, aux routes et aux textes `fait` ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/ARCHITECTURE.md § 1 (principe 4), § 8.2, M1.5 ; produit/MESSAGES.md § 0.2, § 0.4, § 7.1, § 7.2, § 7.4, § 7.12, § 8.3, § 12.1 ; produit/SUIVI.md § 3.15 ; produit/MARQUE.md § 5 ; produit/recherche/audit-code.md B9.
- pipeline/serveur.py:134 (`technique`), :140 (`refus`), :166-:229 (`analyse`), :222 et :386 (textes `fait`), :323-:349 (`qualifier`, remarque du modèle), :500 (`expliquer`), :523 (`run`), :568 (`servable`), :701 (`depot`), :739 (`calibration`) ; pipeline/accueil.html (`#warns`, détail technique affiché).

## Hors périmètre
- Retrait immédiat des textes techniques et promesses fausses : L1-05. Textes du moteur et repli de la 3D : L4-10.
- État public du service : L5-05. E-mails : L5-14. Pages du parcours : lot 6. Mesure `erreur_affichee` : L7-04.
