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

Options : `PLAN_MODEL` (par défaut `claude-opus-5` ; sur OpenRouter `anthropic/claude-opus-5`), `PLAN_PROVIDER` (`anthropic` ou `openrouter` pour forcer le choix), `PORT` (8780), `PLAN_PARALLELE` (traitements simultanés, 2 par défaut ; les suivants attendent leur tour), `PLAN_ARBITRAGE_PARALLELE=1` (questions d'arbitrage posées toutes en même temps au lieu d'une à une : mêmes questions et mêmes décisions, fidélité égale sur d201 et 432 le 28/09/2026 ; désactivé par défaut).

Le `.env` est relu à chaque lecture : une clé ajoutée sert sans redémarrer. Une variable posée au lancement, même vide, reste prioritaire. Le serveur n'accepte que `http://localhost:PORT` et `http://127.0.0.1:PORT` (en-tête Host contrôlé, requêtes d'une autre origine refusées) et ne sert que la page d'accueil, le moteur et, pour chaque plan, la visite, `plan.json`, les images, les photos et la visite à 360° (`pano/` : page, `visite.json`, images ; jamais `controle.json`).

## Lancer

```
python3 pipeline/serveur.py
```

puis ouvrir http://localhost:8780/ et glisser un plan.

## Ce qui se passe

| Étape | IA | Fichier | Rôle |
|---|---|---|---|
| Analyse | non | `extract.py` | Type de fichier (reconnu à son contenu), page la plus détaillée d'un PDF de plusieurs pages (ou pages des niveaux d'un même logement, empilées), page redressée si elle est tournée. Logement sur plusieurs niveaux : zone de chaque niveau sur la page, nom (R+1, RDC…), décalage qui les superpose (corrélation des murs), escaliers dessinés. Pour un PDF vectoriel : aplats découpés en polygones valides, textes visibles, cotes, arcs de porte, pointillés, hachures (soffites, gaines), flèche d'entrée ; échelle votée entre trois indices (lignes de cote, échelle graphique, écart entre murs), conversion en mètres. Pour une image : murs vectorisés sur le rendu. |
| Qualification | oui, légère | `serveur.py` | Pour une image : est-ce un plan d'appartement, lisible, combien de niveaux. Refus motivé sinon. |
| Échelle | non | page web | Pour une image ou une échelle incertaine : l'utilisateur clique les deux bouts d'une cote connue et saisit sa longueur. |
| Lecture | oui | `lire.py` | Claude produit `plan.json` (murs, ouvertures, pièces, équipements) à partir de l'image et des tracés. Plusieurs niveaux : Claude lit chaque niveau dans sa zone, sans rien superposer, et décrit les escaliers (foulée, contremarches, trémie). |
| Contrôle | non | `lire.py`, `niveaux.py` | Réponse ramenée au format attendu (valeurs nulles, listes, éléments incomplets écartés), murs et ouvertures cohérents, pièces sans chevauchement (dans un même niveau), surfaces comparées au tableau du promoteur. Escaliers : sens de montée, contremarches recoupées avec le dessin, hauteur de marche 0,16 à 0,20, giron, échappée, arrivée sur un palier, trémie libre de toute pièce. En cas d'écart, Claude corrige (2 tours au plus). |
| Murs | non | `murs.py` | Aplats soudés en une masse, limités au logement (flèches et traits isolés écartés), fentes le long des pièces refermées, équerrage ; chaque baie recalée entre ses jambages ; murs ouverts au droit des baies puis découpés en morceaux convexes ; tout bord de pièce resté ouvert reçoit un mur, sauf le long d'un escalier ou d'une trémie. Plusieurs niveaux : chaque niveau est assemblé à part (`niveaux.py`), palier d'arrivée ajouté s'il manque. D'après les tracés du plan : aplats rognés par la découpe du PDF, voiles de façade gardés, coffret du tableau (façade en trait fin ou porte, vantail lu sur l'image d'un plan scanné), gaines au symbole de la légende, descentes EP, équipements recalés sur leur rectangle, soffites hachurés, emplacements d'appareils en pointillés. Masses dessinées sans marche entre les faces d'une même paroi (`nus_masses`). |
| Relecture | oui | `lire.py`, `apercu.py` | Claude compare la lecture dessinée sur le plan (portes avec leur arc, équipements dans leur vraie forme) au plan d'origine, avec un zoom par pièce, et corrige. |
| Superposition | non | `niveaux.py` | Plusieurs niveaux : le plan passe du repère de la page (niveaux côte à côte) au repère commun (niveaux superposés), hauteurs des niveaux, escalier (dernière contremarche calée sur le bord du vide), vide calé au nu des murs, garde-corps sur ses bords libres. |
| Complément | non | `lire.py`, `niveaux.py` | Seuils de porte, contour du logement (murs et pièces, sans la loggia), lumière par pièce et passages entre pièces ouvertes, vues de la galerie, arrêts de visite, palier et abords. Plusieurs niveaux : niveau par niveau (rien dans un vide ni sur une volée), puis dalles, plafonds et toits de chaque niveau, arrêts du niveau d'entrée, arrêt « Escalier », niveau suivant, une vue d'ensemble par niveau. |
| Visite de contrôle | non | `moteur/controle.mjs` | Dans le vrai moteur : chaque pièce accessible depuis l'entrée, chaque porte franchissable au clavier, chaque baie dégagée, aucune fente, chaque vue prise dans une zone libre. Plusieurs niveaux : escalier monté et descendu au clavier, marches, échappée, bords de vide protégés, dalles sans trou ni rebord, vues au bon niveau (liste dans `moteur/SCHEMA.md`). Réparation automatique (`repare_moteur`, niveau par niveau ; garde-corps ajouté, pièce recoupée, escalier recalé, dalles recalculées, lampe retirée d'un vide…), sinon la visite n'est pas publiée. |
| Photos | non | `moteur/photos.mjs` | Chrome sans écran : chaque vue est calculée, exposée sur son histogramme et enregistrée. |
| Visite à 360° | non | `moteur/pano.mjs` | À chaque arrêt, six vues du moteur, une exposition, projection équirectangulaire (4096 et 2048 px, aperçu 512) ; plan de chaque niveau ; `pano/visite.json` (arrêts, niveaux, liens entre arrêts qui se voient). Contrôles dans `pano/controle.json`, publication bloquée s'ils échouent. Visionneuse `moteur/pano.html` + `pano.js`, sans moteur ni `plan.json`, servie en `/plans/<id>/pano/`. |

Refus et avertissements : image de moins de 700 px, format inconnu, fichier qui n'est pas un plan, PDF de plusieurs pages (seule la page la plus détaillée est lue, sauf les pages des niveaux d'un même logement), niveaux qui ne se séparent ou ne se superposent pas automatiquement, lecture sur image (précision réduite), surfaces qui ne collent pas au tableau.

## Résultat

Chaque plan vit dans `plans/<id>/` : `plan.json` (modifiable à la main ou par script, voir `moteur/SCHEMA.md`), `index.html` (la visite), `photos/`, `pano/` (visite à 360°), `rapport.json` (contrôles, coût), `etat.json`, et les fichiers d'extraction.

Réponses de l'IA : `reponse-brute*.txt` (texte reçu, écrit avant toute lecture), `reponse-ia.json` (dernière lecture que le programme sait exploiter, reprise telle quelle par « Relancer » sans repayer), `relecture-ia.json`, et `appels-ia.json` (chaque appel facturé, même tronqué ou illisible : le coût du rapport est cumulé sur les relances). Une réponse gardée qui ferait planter le programme est renommée `reponse-ia.rejetee.json` et envoyée à l'IA pour correction, au lieu d'être rejouée à chaque relance.

Pour régénérer les photos après une retouche de `plan.json` :

```
node moteur/photos.mjs plans/<id>
```

## Évaluation

`python3 pipeline/evaluer.py plans/<id>/plan.json <référence>` compare une lecture automatique à un relevé fait à la main (`432` ou `d201`, voir `references/`) : recouvrement des murs et des pièces, position, largeur, charnière et sens de chaque ouverture, position et orientation de chaque équipement. Plan sur plusieurs niveaux : un seul niveau est comparé (`--niveau k`, par défaut celui de l'entrée).

## Tests sans clé

`PLAN_MOCK=references/432.plan.json python3 pipeline/serveur.py` remplace la lecture par l'IA par un plan déjà relevé : utile pour vérifier le reste de la chaîne.

Référence sur plusieurs niveaux : le duplex `3081-613-ef700f1f` (R+1 et R+2 l'un sous l'autre sur la page), avec une lecture préparée à la main dans `reponse-ia.json`.

`outils/finalise.sh <id>` réassemble un plan à partir de sa lecture gardée (`reponse-ia.json`, et `relecture-ia.json` pour ne pas relancer la relecture), sans aucun appel payant, puis lance la visite de contrôle, ses réparations, les photos et la visite à 360°. La page de visite est créée si elle manque. Une lecture qui ne passe pas le contrôle s'arrête là (la correction demanderait un appel à l'IA).

## Mode admin, export, import, copie partagée

- **Page des plans** (`http://localhost:8780/`) : un plan par fichier (redéposer le même fichier ramène au plan existant) ; par plan : Visite, 360°, Admin (maquette avec le panneau d'admin ouvert), Documents (tous les fichiers du dossier, et « Exporter ce plan »), Suivi. En haut : Exporter tout, Importer une archive, Importer depuis une adresse. Le dépôt est désactivé, avec sa raison, sans serveur Python ou sans IA configurée (`/api/sante`).
- **Visite, bouton Admin** (`moteur/admin.js`) : bandeau de débogage (aussi `?debug=1`), rayons X, eau (fuites du test d'immersion), plan déposé à côté du plan 2D, verdict des contrôles, fichiers du plan lisibles dans la page.
- **Export** : `node outils/exporter.mjs <archive.tar.gz> [id…]` : dossiers complets des plans.
- **Import** : `node outils/importer.mjs <archive.tar.gz | dossier | https://…/> [--remplacer]` : archive d'export, copie partagée (dossier ou adresse en ligne) ; plan déjà présent (même fichier déposé ou même identifiant) laissé tel quel.
- **Copie partagée** (GitHub Pages ou tout hébergement de fichiers) : `node outils/publier.mjs <dossier hors du projet> [id…]` : visites, 360°, mode admin et documents, page des plans en lecture seule. À ne plus faire tel quel à l'ouverture du SaaS (ticket L5-29).
- **Test de bout en bout** : `node outils/bout_en_bout.mjs [id…]` : dépôt de chaque plan de référence par le site, sans appel payant (serveur de test sans clé, `PLAN_REJEU=1` : lecture gardée reprise ; `PLAN_DOUBLONS=1`), jusqu'à la visite, au 360° et aux photos ; plan obtenu identique à la référence ; copies supprimées.
- **Serveur des rendus** : `outils/test_statique.mjs` vérifie que les scripts Chrome ne servent que la visite, sur 127.0.0.1, sans clé.
