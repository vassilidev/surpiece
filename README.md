# visite-plans

On dépose le plan de vente d'un logement neuf (PDF du promoteur, ou capture), on obtient le plan 2D coté, la maquette 3D, la visite à la première personne et une galerie photo. Les logements sur plusieurs niveaux sont gérés : niveaux superposés, escalier praticable dans la visite, un plan 2D et une maquette par niveau (validé sur un duplex, le lot 613 ; triplex prévu par le format, pas encore rencontré). Tout est généré automatiquement : extraction sans IA, lecture et relecture par Claude, murs reconstruits et contrôlés, visite vérifiée dans le vrai moteur avant publication.

Projet indépendant de la visite du D201 (dépôt `appart`), dont le moteur est issu.

## Installation

```
pip3 install -r requirements.txt
npm install -g puppeteer
cp .env.example .env    # puis renseigner OPENROUTER_API_KEY (ou ANTHROPIC_API_KEY)
```

## Lancer

```
python3 pipeline/serveur.py
```

puis ouvrir http://localhost:8780/ et glisser un plan. Détail des étapes, options et coûts : [`pipeline/README.md`](pipeline/README.md). Format du `plan.json` : [`moteur/SCHEMA.md`](moteur/SCHEMA.md).

## Organisation

| Dossier | Rôle |
|---|---|
| `pipeline/` | Serveur et page de dépôt, extraction du PDF (`extract.py`), lecture par Claude (`lire.py`), murs propres (`murs.py`), logements sur plusieurs niveaux (`niveaux.py` : découpe par niveau, superposition, escaliers et trémies), images de relecture (`apercu.py`), mesure contre un relevé manuel (`evaluer.py`). |
| `moteur/` | Visite générique pilotée par `plan.json` : interface et plan 2D (`ui.js`), 3D et visite (`engine.js`), visite de contrôle (`controle.mjs`), photos (`photos.mjs`), visite à 360° (`pano.mjs` pour le rendu, `pano.html` et `pano.js` pour la visionneuse sans moteur). |
| `references/` | Relevés faits à la main, pour mesurer la qualité : visite de production du D201 (`d201.app-d.json`) et T2 432 (`432.plan.json`). |
| `outils/` | Contrôle à la main : `finalise.sh` (réassemblage sans IA, contrôle, photos), `vues.mjs`, `marche.mjs`, `trajets.mjs`, `planche.py`. |
| `plans/` | Un dossier par plan déposé (non versionné : PDF des promoteurs, visites générées). |

## Qualité

```
python3 pipeline/evaluer.py plans/<id>/plan.json d201     # ou 432, ou un plan.json
node moteur/controle.mjs plans/<id>                        # pièces accessibles, portes franchissables, baies dégagées, étanchéité, vues ; escaliers, vides et dalles sur plusieurs niveaux
```
