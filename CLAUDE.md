# visite-plans : du plan de vente à la visite 3D

Produit en construction (futur SaaS) : un acquéreur dépose le plan de vente de son logement neuf et obtient plan 2D, maquette 3D, visite et photos. Répondre en français, être factuel.

## Consignes de l'utilisateur

- Version de base simple, fidèle et très éclairée. Réalisme, lumière, physique, 4K, TMA, déco et aménagement viendront plus tard, en option payante.
- Zéro défaut visible : pas de trou ni de fente, pas de texture noire, pas d'objet qui flotte, pas de mur mal placé, pas de porte à l'envers, pas d'équipement oublié ou mal orienté, aucun texte technique montré à l'utilisateur. Tout défaut trouvé doit devenir un contrôle automatique pour ne plus jamais revenir.
- Avancer plan par plan avec les plans que l'utilisateur fournit, sans généraliser à des cas inconnus (duplex…).
- Fonctionne sans Claude Code, par l'API (OpenRouter en service, clé dans `.env`, jamais versionnée ni affichée).
- Plus tard : mise en ligne (hébergement Python à choisir), 1 crédit offert par testeur, coûts maîtrisés, saisie manuelle pré-remplie seulement en dernier recours.
- Les plans des promoteurs (PDF, visites générées) ne sont jamais versionnés ni publiés sans accord.

## Référence qualité

La visite du D201 faite à la main (dépôt `vassilidev/appart`, `visite/index.html`) est la source de vérité ; ses données sont extraites dans `references/d201.app-d.json`. `pipeline/evaluer.py` mesure une lecture automatique contre ce relevé et contre `references/432.plan.json`.

## Chaîne

`pipeline/serveur.py` (port 8780) : analyse (`extract.py`, sans IA) → lecture par Claude (`lire.py`) avec corrections, relecture en zoom par pièce (`apercu.py`) et arbitrage de chaque modification (question ciblée posée dans les deux ordres) → murs (`murs.py` : soudure, fentes, baies alignées et calées entre jambages, portes calées sur leur arc, morceaux convexes, enveloppe fermée) → complément (seuils, sols jusqu'aux murs, vues, arrêts, contexte) → visite de contrôle (`moteur/controle.mjs`, réparations `repare_moteur`, publication bloquée sinon) → photos (`moteur/photos.mjs`).

Tester sans payer : `outils/finalise.sh <id>` réassemble un plan à partir de sa lecture gardée (`reponse-ia.json`). Captures : puppeteer global, Chrome `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Poignées de debug : `window.__v`, `App.D`, `App.set(clé, valeur)`.

Coût mesuré : 1,10 à 1,85 $ par plan (claude-opus-5 via OpenRouter, effort medium), 8 à 15 min de bout en bout.
