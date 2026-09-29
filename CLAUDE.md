# visite-plans : du plan de vente à la visite 3D

Produit en construction (futur SaaS) : un acquéreur dépose le plan de vente de son logement neuf et obtient plan 2D, maquette 3D, visite et photos. Répondre en français, être factuel.

## Consignes de l'utilisateur

- Version de base simple, fidèle et très éclairée. Réalisme, lumière, physique, 4K, TMA, déco et aménagement viendront plus tard, en option payante.
- Zéro défaut visible : pas de trou ni de fente, pas de texture noire, pas d'objet qui flotte, pas de mur mal placé, pas de porte à l'envers, pas d'équipement oublié ou mal orienté, aucun texte technique montré à l'utilisateur. Tout défaut trouvé doit devenir un contrôle automatique pour ne plus jamais revenir.
- Plans sur plusieurs niveaux (duplex, triplex) et plans atypiques gérés. Toujours avancer plan par plan et valider sur les plans que l'utilisateur fournit. Référence duplex : `plans/3081-613-ef700f1f` (lecture préparée à la main dans `reponse-ia.json`).
- Fonctionne sans Claude Code, par l'API (OpenRouter en service, clé dans `.env`, jamais versionnée ni affichée).
- Visite fluide sur un appareil modeste, pas seulement sur une machine puissante : qualité adaptative (textures, résolution, effets), précalcul côté serveur (éclairage, maquette compressée), et mode 360° à chaque arrêt (panoramas rendus par le serveur, comme sur les sites d'annonces), intégré à toutes les visites ; le 360° sera probablement l'offre gratuite, la visite 3D complète l'offre payante (décision du 27/09/2026, à reporter dans `produit/`).
- Délai : la qualité prime sur la rapidité (« on peut avoir une app plus lente pour un meilleur résultat plutôt que l'inverse », 28/09/2026). Objectif : l'acheteur a son plan et sa visite en quelques minutes, sans jamais perdre en fidélité (toute accélération vérifiée contre les relevés de référence, `pipeline/evaluer.py`). L'attente devient une expérience : jolie animation, informations à remplir pendant ce temps, son plan original face au plan 2D redessiné, ce qu'on a extrait montré au fil de l'eau, puis maquette, visite, photos et 360°. Mesuré le 28/09/2026 : 8 à 15 min de bout en bout, dont 5 à 10 min pour l'appel principal de lecture. Leviers : affichage progressif, lecture raccourcie (pré-remplissage par le programme, lectures en parallèle, réflexion ou modèle adaptés), rendus en parallèle. Budget d'essais de lecture accordé : 15 à 20 $.
- Visite 3D (29/09/2026) : par défaut une lumière simple, sans calcul, qui montre bien les murs (« on doit bien voir et basta ») ; le rendu complet (ombres, occlusion, sondes, photoréaliste) devient un « mode ultra réaliste » activable à la demande dans les réglages. Bouton 360° dans les modes de la visite. Le site est en mode admin, pas encore SaaS : interface allégée, droit au but, bandeau de débogage (i/s, etc.) et vues d'admin (rayons X, test de l'eau…). Avant le SaaS, le site doit être entièrement fonctionnel du dépôt du plan jusqu'à la visite ; sécurité, quotas, style et textes viendront après.
- Plus tard : mise en ligne (hébergement Python à choisir), 1 crédit offert par testeur, coûts maîtrisés, saisie manuelle pré-remplie seulement en dernier recours.
- Les plans des promoteurs (PDF, visites générées) ne sont jamais versionnés ni publiés sans accord.

## Référence qualité

La visite du D201 faite à la main (dépôt `vassilidev/appart`, `visite/index.html`) est la source de vérité ; ses données sont extraites dans `references/d201.app-d.json`. `pipeline/evaluer.py` mesure une lecture automatique contre ce relevé et contre `references/432.plan.json`.

## Chaîne

`pipeline/serveur.py` (port 8780) : analyse (`extract.py`, sans IA ; niveaux séparés et recalés) → lecture par Claude (`lire.py`) avec corrections, relecture en zoom par pièce (`apercu.py`) et arbitrage de chaque modification (question ciblée posée dans les deux ordres) → murs (`murs.py` : soudure, fentes, baies alignées et calées entre jambages, portes calées sur leur arc, morceaux convexes, enveloppe fermée) → plusieurs niveaux (`niveaux.py` : chaque niveau assemblé à part, superposition, escalier, trémie, dalles) → complément (seuils, sols jusqu'aux murs, vues, arrêts, contexte) → visite de contrôle (`moteur/controle.mjs`, réparations `repare_moteur`, publication bloquée sinon) → photos (`moteur/photos.mjs`) → visite à 360° (`moteur/pano.mjs` : panoramas, liens entre arrêts, contrôles bloquants ; visionneuse `moteur/pano.html` + `pano.js` sans moteur ni `plan.json`).

Tester sans payer : `outils/finalise.sh <id>` réassemble un plan à partir de sa lecture gardée (`reponse-ia.json`). Captures : puppeteer global, Chrome `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Poignées de debug : `window.__v`, `App.D`, `App.set(clé, valeur)`.

Coût mesuré : 1,10 à 1,85 $ par plan (claude-opus-5 via OpenRouter, effort medium), 8 à 15 min de bout en bout.
