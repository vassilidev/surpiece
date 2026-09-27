# L1-05 · Retirer les textes techniques et corriger les promesses fausses

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P], `moteur/` [M] | À faire |

## Pourquoi
L'outil actuel montre à l'utilisateur des détails d'exception, des consignes pour l'exploitant (« .env », « Chrome sans écran »), des avertissements rédigés pour l'IA et le nom du CDN de la 3D. La page de dépôt promet aussi une notification « onglet fermé » qui ne marche pas, et une « précision au centimètre » que MARQUE.md interdit. La bêta express (L3) réutilise cet outil : ces textes doivent disparaître avant tout testeur (M0.5). Le contrôle de L1-04 dit quand c'est fini.

## À faire
1. **Page de dépôt** (`pipeline/accueil.html`) :
   - ligne 85 environ : « Précision au centimètre. » → « Murs, cotes et échelle lus directement dans le fichier. » (MARQUE.md § 12, `recherche/juridique.md` § 5.2) ;
   - ligne 93 environ (`#notifTxt`) : remplacer « Vous pouvez fermer cet onglet … on vous prévient » par un texte vrai, par exemple « Gardez cet onglet ouvert : vous serez prévenu ici dès que la visite est prête, même si vous faites autre chose. » ; aucune promesse d'e-mail (l'outil local n'en envoie pas) ;
   - `#detail` (ligne 205 environ) : ne plus afficher `technique_erreur`, jamais.
2. **Détail technique au journal** (`pipeline/serveur.py`) : dans `run` (bloc `except`), `controle` (échec) et `refus`, ajouter la ligne technique (`technique(err)`) à `plans/<id>/journal.txt` (fichier non servi : absent de la liste blanche de `servable`) et à la console du serveur, en plus d'`etat.json`.
3. **Messages de `expliquer`** (`pipeline/serveur.py`) : un texte pour l'utilisateur par cause, repris de MESSAGES.md § 7.12 **sans les promesses que l'outil local ne tient pas** (e-mail, équipe, « sous 2 jours ouvrés »). Proposition :
   - module absent, clé absente ou refusée, crédit insuffisant (401, 402, 403) : « Le service est momentanément indisponible. Votre plan est gardé : vous pourrez relancer. » ; la cause exacte (nom du module, `.env`, crédit) va à la console et à `journal.txt` ;
   - 429, 5xx, réseau : texte actuel (« … momentanément indisponible ou saturé. Relancez dans une minute. ») ;
   - réponse tronquée, refusée, plan incohérent, autre échec de lecture : « La lecture de votre plan n'a pas abouti. Vous pouvez la relancer. » ;
   - visite de contrôle impossible : « La vérification de la visite n'a pas pu se faire. Vous pouvez la relancer. » ;
   - analyse : retirer « (détail ci-dessous) ».
   Le message de `lecture` « Clé API absente : ajoutez … .env » devient le message « indisponible » ; au démarrage de `serveur.py`, un avertissement en console signale l'absence de clé.
4. **Avertissements** (`#warns`) : filtrer **dans `serveur.py`** (fonction `lecture`, avant `state(pid, avertir=…)`) ce qui vient de `r['avertissements']`, sans toucher aux textes de `lire.py` (fonction `check`), qui servent aussi de consignes de correction envoyées à l'IA :
   - « Équipement … » et tout message qui contient un identifiant ou un type anglais : journal seulement ;
   - écarts de surface « Pièce X : a m² mesurés (gaines déduites …) pour b m² annoncés » : réécrits pour l'acquéreur, virgule décimale, sans jargon (« Séjour : 27,1 m² mesurés pour 27,5 m² annoncés au tableau. ») ;
   - « Qualification impossible : … » (`qualifier`) : journal seulement.
5. **Titre et cartouche par défaut** (`pipeline/lire.py`, fonction `complete`, `P.setdefault('titre', …)` et `P.setdefault('cartouche', …)`) : « Votre logement » au lieu de « Logement <identifiant> », et identifiant vide dans le cartouche (MARQUE.md § 12). Diff d'une ou deux lignes, sans effet sur le prompt.
6. **Moteur** (`moteur/ui.js`, `moteur/engine.js`) :
   - `boot` : « Plan introuvable : ce dossier doit contenir un fichier plan.json. » → « Cette visite n'est pas disponible. Vérifiez le lien. » ; « Ce plan.json est hors format (…) » → « Cette visite ne peut pas s'afficher. » ;
   - `boot` (« Erreur de l'interface : … »), `armLoader` (message qui cite three.js et cdn.jsdelivr.net) et `start().catch` d'`engine.js` (« Erreur : … ») → texte `erreur.3d` de MESSAGES.md § 7.12 ;
   - le détail technique passe par `console.error('[visite] …')`.
7. **Garder le diagnostic de la visite de contrôle** : `moteur/controle.mjs` lit aujourd'hui le texte de `#err` pour expliquer un moteur non démarré ; lui faire relever aussi les messages de console préfixés `[visite]`, pour que `controle.json` garde la cause technique.
8. **Vérifier** avec `outils/textes.mjs` (L1-04) sur les 4 références rejouées (L1-02) et sur des erreurs provoquées sans payer : clé absente (variables vidées), 402 et 500 simulés (faux serveur local ou `expliquer` appelé avec l'exception correspondante), contrôle en échec (plan de test abîmé exprès dans `plans/_…`).

## Critères d'acceptation
- [ ] `node outils/textes.mjs` passe sur les 4 références et sur les quatre erreurs provoquées de l'étape 8.
- [ ] `grep -n "\.env\|Chrome sans écran\|jsdelivr\|détail ci-dessous\|au centimètre" pipeline/accueil.html pipeline/serveur.py moteur/ui.js moteur/engine.js` ne trouve plus de texte destiné à l'écran (les commentaires et la console restent permis).
- [ ] Le détail technique de chaque erreur provoquée se trouve dans `plans/<id>/journal.txt` et dans la console ; `curl http://localhost:8780/plans/<id>/journal.txt` répond 404.
- [ ] `controle.json` d'un moteur qui ne démarre pas contient toujours la cause technique.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 : rejeu L1-02 avec `plan.json` identiques (sauf `titre` et `cartouche` par défaut, écart voulu), visite de contrôle réussie, contrôle des textes réussi, fumée de l'outil local réussie ; aucune lecture payante.
- [ ] Chaque texte technique trouvé en cours de route ajoute un motif à `outils/textes-interdits.json`.

## Points d'attention
- Coordination : `serveur.py`, `lire.py`, `accueil.html`, `ui.js`, `engine.js` et `controle.mjs` sont en cours de modification par l'agent des duplex. Petits diffs isolés sur une branche courte ; `lire.py` ne change que dans `complete`, jamais dans les prompts ni dans `check`.
- Ne pas changer le texte des avertissements de `check` : ils sont renvoyés à l'IA (« Contrôle automatique : … ») et leur changement modifierait la lecture sans évaluation payante.
- `etat.json` reste lisible par `/api/etat/<id>` pour qui connaît l'identifiant (B2) : ce ticket règle l'écran ; la vue publique de l'état vient avec L3-03 (bêta) et L4-05 (catalogue).
- Les textes choisis ici sont provisoires : L4-05 les remplace par le catalogue (clés `erreur.*` de MESSAGES.md § 7.12) ; garder une correspondance cause → clé en commentaire pour faciliter la reprise.
- Écart avec MESSAGES.md : l'étape « Visite de contrôle » de l'écran d'attente doit prendre les textes du § 7.4 (PARCOURS.md § 8.2) ; à faire ici seulement si le diff reste petit.

## Références
- `produit/recherche/audit-code.md` B9, A4
- `produit/ARCHITECTURE.md` § 6.1 (B9), § 8.1, § 8.3 M0.5, M1.5
- `produit/MARQUE.md` § 5.2, § 12 ; `produit/MESSAGES.md` § 7.4, § 7.12, § 12.1 ; `produit/PARCOURS.md` § 8.2
- `pipeline/accueil.html` (`#notifTxt`, `#detail`, `#warns`) ; `pipeline/serveur.py` (`technique`, `refus`, `qualifier`, `lecture`, `controle`, `expliquer`, `run`, `servable`) ; `pipeline/lire.py` (`check`, `complete`) ; `moteur/ui.js` (`boot`, `armLoader`) ; `moteur/engine.js` (`start`) ; `moteur/controle.mjs` (lecture de `#err`)

## Hors périmètre
- Catalogue de messages complet : L4-05.
- Vue publique réduite de l'état et cloisonnement : L3-03, L5-05.
- E-mail « votre visite est prête » : L5-14.
- Mention non contractuelle alignée : L4-07.
