# L4-19 · Outil local en mode admin : allègement, bandeau de débogage, vues rayons X et eau, test de bout en bout

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P1 | M (1 à 3 j) | L4-11, L4-16 | `moteur/`, `pipeline/` [M] | En cours |

## Pourquoi
Retour R4 de l'utilisateur, 29/09/2026, mot pour mot : « le site n'est pas encore en mode SaaS mais en mode admin, il faut alléger et rendre ça simple, straight to the point […] afficher en bas quelque part le debug avec les FPS etc […] d'autres modes qui permettraient de faire un xray ou l'eau […] le site avant de le transformer en SaaS doit être 100000 % fonctionnel du dépôt du plan jusqu'au mode de visite, on s'occupera de la sécurité et des quotas de modes et du style et du wording plus tard ».

Crédits limités : l'utilisateur a choisi « seulement l'essentiel » pour la nuit du 29/09/2026 (lumière simple par défaut, ultra réaliste dans les réglages, bouton 360° : faits, voir L4-13 et L4-16). Les quatre points ci-dessous sont **reportés** et regroupés ici.

## Fait le 29/09/2026
Mode admin de la visite (bandeau, rayons X, eau, plan déposé à côté du plan 2D, contrôles, fichiers), page des plans allégée (tableau, Documents, export et import, dépôt désactivé sans serveur ou sans IA), un plan par fichier, test de bout en bout `outils/bout_en_bout.mjs` (sans appel payant). Détails : HISTORIQUE.md (29/09/2026, fin d'après-midi). Reste : captures validées par l'utilisateur ; comparaison des i/s du bandeau à une mesure externe ; défaut volontaire qui fait échouer le test de bout en bout.

## À faire
1. **Mode admin, allégé** : l'outil local (`pipeline/accueil.html`, `pipeline/serveur.py`, visite `moteur/ui.js`) va droit au but : dépôt, avancement, visite, sans écran ni texte superflu. Pas de sécurité, de quotas, de style ni de textes définitifs (plus tard, lots 5 à 8). Liste de ce qui est retiré ou regroupé : à proposer à l'utilisateur sur captures.
2. **Bandeau de débogage** en bas de la visite, activé depuis les Réglages (et `?debug=1`) : i/s, temps d'image, palier de qualité (L4-12), rendu (simple ou ultra réaliste), pièce et niveau courants, position, nombre d'appels de dessin et de triangles, mémoire des textures. Jamais montré par défaut ; aucun texte technique hors de ce bandeau (L1-04).
3. **Vues rayons X et eau** (modes de contrôle visuel, dans les Réglages) :
   - rayons X : murs en transparence, pour voir équipements, gaines, placards et raccords à travers les parois ;
   - eau : le test d'immersion de `controle.mjs` rendu visible (pièces remplies, fuite éventuelle en couleur), pour montrer où l'eau sortirait.
   Aucune de ces vues ne change le rendu par défaut ; contrôle : retour au rendu simple sans reste (même principe que la bascule ultra réaliste).
4. **Test de bout en bout par le site** : dépôt d'un plan sur `http://localhost:8780`, suivi de l'avancement, visite ouverte, bouton 360° et retour, photos, sur les 5 plans de référence, par un script Chrome (puppeteer) qui clique comme l'utilisateur. Sans lecture payante : lecture gardée rejouée (`PLAN_PROVIDER=`, L1-02). Échec au moindre écran d'erreur, texte technique ou étape bloquée.

## Critères d'acceptation
- [ ] Captures du mode admin allégé validées par l'utilisateur.
- [ ] Bandeau de débogage : valeurs justes (i/s comparées à une mesure externe), caché par défaut, rien d'autre ne change à l'écran.
- [ ] Vues rayons X et eau sur les 5 plans ; bascule et retour sans reste (contrôle automatique, vérifié en remettant un reste).
- [ ] Test de bout en bout vert sur les 5 plans, sans appel payant ; un défaut volontaire (étape cassée) le fait échouer.

## Points d'attention
- L'utilisateur veut l'outil « 100000 % fonctionnel » du dépôt à la visite avant tout travail de SaaS : ce ticket passe avant les lots 5 et 6 dans l'outil local (à confirmer).
- Si `pipeline/serveur.py` change : redémarrer le serveur du port 8780 et vérifier qu'il répond.

## Références
- Retour R4 (29/09/2026) ; HISTORIQUE.md (29/09/2026) ; produit/PLAN.md § 2.1 (décision 17).
- moteur/ui.js (Réglages), moteur/engine.js (`App.renduEtat`, régulateur `aq*`), moteur/controle.mjs (test d'immersion), pipeline/serveur.py, pipeline/accueil.html, outils/finalise.sh ; L1-02, L1-04, L4-11, L4-12, L4-16.

## Hors périmètre
- Sécurité, quotas, style et textes du SaaS : lots 5 à 8 (demande explicite de l'utilisateur de les traiter plus tard).
