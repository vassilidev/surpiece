# Dépôt de plans → visite 3D

Chaîne autonome : on dépose un plan de vente sur une page web, on obtient le plan 2D coté, la maquette 3D, la visite et la galerie photo. Elle tourne sans Claude Code : seule l'étape de lecture appelle Claude, par l'API Anthropic ou par OpenRouter.

## Installation (une fois)

```
pip3 install pymupdf pillow numpy shapely opencv-python-headless anthropic
npm install -g puppeteer
```

Toutes ces dépendances sont obligatoires. `shapely` sert au recalage des baies, à la découpe des murs, au contour du logement et au cadrage des vues : sans lui, `lire.py` s'arrête avec « Module shapely manquant ». `opencv-python-headless` sert à lire les murs d'un plan en image (`extract.py`).

Clé API dans un fichier `.env` à la racine du projet (ignoré par git) :

```
ANTHROPIC_API_KEY=sk-ant-...
```

ou, pour passer par OpenRouter :

```
OPENROUTER_API_KEY=sk-or-...
```

Options : `PLAN_MODEL` (par défaut `claude-opus-5` ; sur OpenRouter `anthropic/claude-opus-5`), `PLAN_PROVIDER` (`anthropic` ou `openrouter` pour forcer le choix), `PORT` (8780), `PLAN_PARALLELE` (traitements simultanés, 2 par défaut ; les suivants attendent leur tour).

Le `.env` est relu à chaque lecture : une clé ajoutée sert sans redémarrer. Une variable posée au lancement, même vide, reste prioritaire. Le serveur n'accepte que `http://localhost:PORT` et `http://127.0.0.1:PORT` (en-tête Host contrôlé, requêtes d'une autre origine refusées) et ne sert que la page d'accueil, le moteur et, pour chaque plan, la visite, `plan.json`, les images et les photos.

## Lancer

```
python3 pipeline/serveur.py
```

puis ouvrir http://localhost:8780/ et glisser un plan.

## Ce qui se passe

| Étape | IA | Fichier | Rôle |
|---|---|---|---|
| Analyse | non | `extract.py` | Type de fichier (reconnu à son contenu), page la plus détaillée d'un PDF de plusieurs pages, page redressée si elle est tournée. Pour un PDF vectoriel : aplats découpés en polygones valides, textes visibles, cotes, arcs de porte, pointillés, hachures (soffites, gaines), flèche d'entrée ; échelle votée entre trois indices (lignes de cote, échelle graphique, écart entre murs), conversion en mètres. Pour une image : murs vectorisés sur le rendu. |
| Qualification | oui, légère | `serveur.py` | Pour une image : est-ce un plan d'appartement, lisible, combien de niveaux. Refus motivé sinon. |
| Échelle | non | page web | Pour une image ou une échelle incertaine : l'utilisateur clique les deux bouts d'une cote connue et saisit sa longueur. |
| Lecture | oui | `lire.py` | Claude produit `plan.json` (murs, ouvertures, pièces, équipements) à partir de l'image et des tracés. |
| Contrôle | non | `lire.py` | Réponse ramenée au format attendu (valeurs nulles, listes, éléments incomplets écartés), murs et ouvertures cohérents, pièces sans chevauchement, surfaces comparées au tableau du promoteur. En cas d'écart, Claude corrige (2 tours au plus). |
| Murs | non | `murs.py` | Aplats soudés en une masse, limités au logement (flèches et traits isolés écartés), fentes le long des pièces refermées, équerrage ; chaque baie recalée entre ses jambages ; murs ouverts au droit des baies puis découpés en morceaux convexes ; tout bord de pièce resté ouvert reçoit un mur. |
| Relecture | oui | `lire.py`, `apercu.py` | Claude compare la lecture dessinée sur le plan (portes avec leur arc, équipements dans leur vraie forme) au plan d'origine, avec un zoom par pièce, et corrige. |
| Complément | non | `lire.py` | Seuils de porte, contour du logement (murs et pièces, sans la loggia), lumière par pièce et passages entre pièces ouvertes, vues de la galerie, arrêts de visite, palier et abords. |
| Visite de contrôle | non | `moteur/controle.mjs` | Dans le vrai moteur : chaque pièce accessible depuis l'entrée, chaque porte franchissable au clavier, chaque baie dégagée, chaque vue prise dans une zone libre. Réparation automatique (`repare_moteur`), sinon la visite n'est pas publiée. |
| Photos | non | `moteur/photos.mjs` | Chrome sans écran : chaque vue est calculée, exposée sur son histogramme et enregistrée. |

Refus et avertissements : image de moins de 700 px, format inconnu, fichier qui n'est pas un plan, PDF de plusieurs pages (seule la page la plus détaillée est lue), lecture sur image (précision réduite), surfaces qui ne collent pas au tableau.

## Résultat

Chaque plan vit dans `plans/<id>/` : `plan.json` (modifiable à la main ou par script, voir `moteur/SCHEMA.md`), `index.html` (la visite), `photos/`, `rapport.json` (contrôles, coût), `etat.json`, et les fichiers d'extraction.

Réponses de l'IA : `reponse-brute*.txt` (texte reçu, écrit avant toute lecture), `reponse-ia.json` (dernière lecture que le programme sait exploiter, reprise telle quelle par « Relancer » sans repayer), `relecture-ia.json`, et `appels-ia.json` (chaque appel facturé, même tronqué ou illisible : le coût du rapport est cumulé sur les relances). Une réponse gardée qui ferait planter le programme est renommée `reponse-ia.rejetee.json` et envoyée à l'IA pour correction, au lieu d'être rejouée à chaque relance.

Pour régénérer les photos après une retouche de `plan.json` :

```
node moteur/photos.mjs plans/<id>
```

## Évaluation

`python3 pipeline/evaluer.py plans/<id>/plan.json <référence>` compare une lecture automatique à un relevé fait à la main (`432` ou `d201`, voir `references/`) : recouvrement des murs et des pièces, position, largeur, charnière et sens de chaque ouverture, position et orientation de chaque équipement.

## Tests sans clé

`PLAN_MOCK=references/432.plan.json python3 pipeline/serveur.py` remplace la lecture par l'IA par un plan déjà relevé : utile pour vérifier le reste de la chaîne.
