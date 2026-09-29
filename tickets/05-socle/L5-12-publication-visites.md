# L5-12 · Publication et pages de visite

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L5-02, L4-06, L5-05, L1-04 | `service/`, `outils/` | À faire |

## Pourquoi
Aujourd'hui, qui connaît `/plans/<id>/` obtient la visite et aussi `page.png`, `calibration.png` et `plan-<…>.png`, images du plan du promoteur (`servable`, `pipeline/serveur.py:565-585` ; audit B2, B7). Chaque visite charge le moteur courant en relatif (`moteur/modele.html:12`, `:24-25`) : une mise à jour du moteur peut casser les visites livrées (A3). Publier, c'est copier en liste blanche, figer la version du moteur et servir la visite sur une origine séparée avec des en-têtes stricts. Décision de l'utilisateur n° 6 : le plan offert ne reçoit ni le moteur ni `plan.json`, donc une publication « simple » n'a pas de page de visite.

## À faire
1. **`service/publication.py`, `publier(travail)`**, exécuté par le worker lecture seulement après un contrôle réussi (`ARCHITECTURE.md` § 5.4) :
   1. images marquées vers `publie/p/<préfixe>/photos/<vue>-<moment>.jpg` et `vignette.jpg` (alimenté image par image par L5-11) ;
   2. `plan.json` filtré dans `prive/org/<org>/plans/<plan>/publications/<pub>/plan.json` : liste blanche de clés tirée de `moteur/SCHEMA.md`, tenue dans `service/publication_cles.py` avec un test qui la compare à `SCHEMA.md`. La liste suit SCHEMA.md du 27/09/2026 : clés des niveaux `levels`, `stairs`, `voids`, `level`, et nouveaux champs `allege`, `fixe`, `tap` ; `underlay` retiré (`pipeline/lire.py:1319`) ; une clé inconnue fait échouer la publication ;
   3. `index.html` produit depuis `moteur/modele.html` sans modifier `moteur/` : `../../moteur/` → `https://cdn.<domaine>/moteur/v<N>/`, importmap (`modele.html:15-19`) et polices (`:9-11`) → `/vendor/` livré par L4-06 ; empreinte SHA-256 de l'importmap pour la CSP ;
   4. vérifications bloquantes : aucune URL tierce dans `index.html` ni `plan.json` ; contrôle des textes (`outils/textes.mjs`, L1-04) sur la version publiée ; CSP et réseau par `outils/verifier_publication.mjs` (nouveau), qui ouvre la page servie avec ses vrais en-têtes, écoute `securitypolicyviolation` et chaque requête, et échoue sur toute violation ou requête hors de nos origines ;
   5. ligne `publications`, avec la colonne à ajouter `heberge_jusqu_au` calculée depuis la version d'offre du lot consommé (droits acquis, L5-08) ; bascule de `plans.publication_active_id` ; puis consommation du crédit (L5-07) et `plan_pret` pour une visite ou `apercu_pret` pour un aperçu (L5-15) dans la même transaction. Les objets passent par `publier` de L5-02, qui refuse tout nom hors liste blanche.
2. **Publication « simple »** (plan offert) : images et données de la fiche (surfaces, points à faire confirmer) pour la page d'aperçu (L6-05). S'y ajoutent les panoramas 360° si L0-04 les retient pour l'offre gratuite (L5-27), jamais la maquette précalculée (L5-28). Elle est écrite dès que la vue du dessus et le plan 2D sont prêts (R2, déclenchée par L5-11), avec la consommation du plan offert dans la même transaction ; les photos s'y ajoutent ensuite. Aucune route publique ne sert son `index.html` ni son `plan.json` ; le `plan.json` filtré reste privé, prêt pour le déblocage (L8-02).
3. **`outils/publier_moteur`** (nouveau, § 5.5), si L4-06 ne l'a pas livré : copie `moteur/` vers `publie/moteur/v<N+1>/` avec `manifest.json` (commit, date, empreintes), seulement si le contenu a changé ; une version publiée n'est jamais réécrite. Lancé par la CI avant le déploiement (L5-18).
4. **Routes de `visite.<domaine>`** (routeur FastAPI par hôte, aucun cookie de session, § 2.4 et § 2.5) :
   - `/v/<jeton>`, `/v/<jeton>/plan.json`, `/v/<jeton>/photos/<vue>.jpg` (302 vers le CDN, chemins relatifs de `ui.js` gardés, `ui.js:833`) ; le jeton est résolu par L5-13 ;
   - vue propriétaire : jeton de 256 bits, haché, 5 min, un seul plan, émis par l'application depuis la session ; seule vue où la superposition du plan du promoteur est permise, image servie par URL signée courte (le moteur en mode simple la masque partout ailleurs, L4-11) ;
   - `/api/csp` (rapports de violation, alerte par L5-16) et `/api/erreur-visite` (erreurs du navigateur, sans script tiers, D5).
5. **En-têtes** (§ 6.2) sur toutes les réponses : HSTS, `nosniff`, `Permissions-Policy` ; pour la visite : CSP de départ du § 6.2, `frame-ancestors 'none'` et `X-Frame-Options: DENY` tant que la liste est vide, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store` pour `index.html` et `plan.json`.
6. **Retrait** `retirer(publication)` : révoque les partages (L5-13), efface `publie/p/<préfixe>/`, purge le CDN, date `retiree_le`. Utilisé par la suppression (L5-05, L5-20) et les retraits sur notification.
7. **Invariants horaires** (§ 4.3) : aucune publication active dont les objets manquent au CDN ; aucun partage actif vers un plan supprimé. Écart → alerte (L5-16).

## Critères d'acceptation
- [ ] Témoin publié de bout en bout dans `docker compose` (MinIO), sans aucun appel payant : la visite s'ouvre en vue propriétaire et la vérification passe avec tout accès réseau extérieur bloqué.
- [ ] `source.*`, `page.png`, `calibration.png`, `plan-*.png`, `reponse-*`, `relecture-ia.json`, `appels-ia.json`, `extract.json`, `rapport.json`, `controle.json`, `etat.json` : 404 par `visite.`, `cdn.` et `app.` (test automatique).
- [ ] `plan.json` publié sans `underlay` ; une clé inconnue ajoutée à un plan de test bloque la publication.
- [ ] Publication simple : `index.html` et `plan.json` répondent 404 par toutes les voies (test).
- [ ] URL externe injectée dans un plan de test : `verifier_publication.mjs` échoue ; sur le témoin : zéro violation, zéro requête hors de nos origines.
- [ ] En-têtes présents sur chaque type de réponse (HTML, JSON, 302, 404, 500).
- [ ] Moteur : même contenu → pas de nouvelle version ; fichier modifié → v<N+1> ; une visite publiée en v<N> se charge toujours en v<N>.
- [ ] Arrêt provoqué entre l'écriture des objets et la ligne `publications` : aucun crédit consommé.
- [ ] Jeton propriétaire expiré : 404 ; superposition absente de toute autre vue.
- [ ] Aucun texte technique visible (L1-04), zéro défaut visible ; outil local inchangé (ni `pipeline/` ni `moteur/` modifiés).

## Mesure
- `apercu_pret` (aperçu) ou `plan_pret` (visite), écrit dans la transaction de publication et de consommation (`SUIVI.md` § 3.8, R2).
- `visite_ouverte` (`type_plan`, `rang`, `appareil`), à l'émission du jeton propriétaire.

## Points d'attention
- **Tranché : R4.** Le verrou de l'offre gratuite est côté serveur (rien de la visite n'est envoyé), pas un verrou d'interface ; `ARCHITECTURE.md` M3.2 est réécrit en ce sens.
- `ARCHITECTURE.md` § 2.3 (étape 6) met les contrôles CSP et réseau dans la visite de contrôle (`controle.mjs`). Ici, ils passent par un outil séparé pour ne pas toucher `moteur/`, qui porte le travail sur les niveaux (terminé le 27/09/2026, pas encore commité).
- `ui.js` écrit des attributs `style` par `innerHTML` : un `style-src-attr 'unsafe-inline'` provisoire peut être nécessaire, à mesurer par l'outil.
- Chevauchement possible avec L4-06 (« préparation du moteur versionné ») pour `publier_moteur` : vérifier avant de coder.
- Une photo reste joignable par son préfixe tant que la publication n'est pas retirée, même si un partage est coupé (§ 5.2). À dire dans la politique de confidentialité, ou à décider autrement dans L5-13.
- Umami sur la vue propriétaire (`SUIVI.md` § 2.6) : la CSP devra autoriser `m.<domaine>` là seulement (contrôle C6), avec L7-04.
- Taille L au plafond : si elle déborde, séparer « publication » et « pages de visite ».

## Références
- `produit/ARCHITECTURE.md` § 2.4, § 2.5, § 4.3, § 5.2 à § 5.5, § 6.2, § 6.3, M2.8, M3.2 ; `produit/OFFRES.md` § 2.2 ; `produit/SUIVI.md` § 2.6, § 7.4 (C6).
- `produit/recherche/audit-code.md` A3, A5, B2, B7.
- `pipeline/serveur.py:565-585` (`VISITE`, `servable`) ; `pipeline/lire.py:1319` (`underlay`) ; `moteur/modele.html:9-25` ; `moteur/ui.js:672` (superposition), `:833` (chemins des photos) ; `moteur/SCHEMA.md`.

## Hors périmètre
- Jetons et partages : L5-13. Intégration et `frame-ancestors` par client : L10-04. Superposition autorisée : L10-06.
- Marque du conseiller (`reglages.json`) : L9-06. Page d'aperçu : L6-05. Déblocage : L8-02. Umami : L7-04.
- Panoramas et visionneuse 360° : L5-27. Maquette compressée et éclairage précalculé, servis comme `plan.json` : L5-28.
