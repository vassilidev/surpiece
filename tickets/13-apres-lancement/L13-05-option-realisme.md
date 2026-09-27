# L13-05 · Options lumière réelle, réalisme et 4K

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P2 | L (3 à 5 j) | L13-01 | `moteur/` [M] | À faire |

## Pourquoi
Deux options distinctes du calendrier d'OFFRES.md § 7.2, vendues seulement aux conditions du § 7.1, et qui n'ont pas les mêmes besoins :
- **A. Lumière réelle, sans GPU** (option 2) : soleil selon l'orientation, la date et l'heure ; le moteur sait déjà le faire hors du mode `simple`. Elle se calcule avec le rendu de base, SwiftShader en conteneur (R3), et dans le navigateur du client pour la visite : elle ne demande **aucun GPU côté serveur** et ne dépend pas de L13-01 ;
- **B. Réalisme et 4K, avec GPU** (option 3, vendus ensemble) : lancer de rayons (`three-gpu-pathtracer`), inutilisable en rendu logiciel : 14 passes en 90 s en SwiftShader contre 700 en Metal (recherche/hebergement.md § 2.1). C'est la seule partie qui demande un exécutant GPU, choisi par L13-01 ; s'il n'y en a pas, l'option B n'existe pas, et rien d'autre n'en dépend (R3).

La dépendance à L13-01 de l'en-tête ne vaut que pour la partie B. Décision n° 1 de l'utilisateur : la base reste simple et très éclairée.

## À faire
**Partie A : lumière réelle (sans GPU côté serveur, sans L13-01)**

1. **Lecture du nord et soleil** :
   - le moteur lit `D.geo?.nord` (`moteur/engine.js:956`), mais aucune étape ne produit `geo.nord` et `moteur/SCHEMA.md` ne le décrit pas ; le prompt de lecture traite la flèche du nord comme un symbole à ignorer (`pipeline/lire.py:241`) ;
   - lecture du nord à ajouter (`[P]`, petit diff), validée plan par plan ; nord absent ou douteux → option indisponible pour ce plan, jamais un soleil inventé ;
   - mention « ensoleillement indicatif » ; contrôle d'exposition des photos (ni brûlées ni noires) ; réglages du soleil (`moteur/ui.js`, bloc hors mode simple, l. 337-360) ouverts seulement avec l'option.
2. **Coût et validation de A** : temps de rendu des photos avec soleil mesuré en SwiftShader dans le conteneur ; validation plan par plan sur les plans de référence (L1-02), D201 en tête ; prix au moins 5 fois le coût (§ 7.1). Hypothèses : +9 € TTC, +2 € HT par plan en Solo et Cabinet (inclus en Équipe), +2 € HT par lot.

**Partie B : réalisme et 4K (GPU, après L13-01)**

3. **Rendu** :
   - photos de galerie rendues avec le lancer de rayons (`startPT`, `moteur/engine.js:1567`) sur l'exécutant GPU de L13-01, en 3840 × 2160, nombre de passes fixé par la mesure ;
   - rendu côté serveur seulement ; la visite dans le navigateur reste celle de base ;
   - contrôle d'équivalence adapté : même cadrage et même structure que la photo de base, aucune texture noire, bruit résiduel sous un seuil mesuré.
4. **Coût et validation de B** : temps GPU par photo × coût horaire de l'exécutant ; prix au moins 5 fois ce coût (§ 7.1). Hypothèses : +15 € TTC, +4 € HT par plan pour un conseiller, +6 € HT par lot. Validation sur les plans de référence (L1-02), D201 en tête ; captures relues.

**Commun**

5. **Offre de base inchangée** (**Tranché : R16**) : le bouton « Rendu photoréaliste de la vue » (`moteur/ui.js:367`), aujourd'hui hors du bloc masqué en mode `simple` (l. 337-360), est masqué en mode simple par L4-11, avant la bêta fermée. Ce ticket ne le rouvre pas : le réalisme de la partie B est rendu côté serveur (point 3). Les réglages du soleil ne s'ouvrent qu'avec l'option A.

## Critères d'acceptation
- [ ] A, lumière réelle, sans GPU côté serveur : un plan sans nord lisible n'a pas l'option (test) ; un plan avec nord : orientation du soleil vérifiée sur un cas connu ; photos rendues en SwiftShader dans le conteneur, ni brûlées ni noires.
- [ ] B, réalisme : photos 4K de l'exécutant GPU conformes au contrôle d'équivalence sur le témoin ; texture noire injectée → refusée ; sans exécutant GPU, l'option n'est pas proposée.
- [ ] Coûts mesurés et consignés ; aucune vente avant les 4 conditions d'OFFRES.md § 7.1.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 pour chaque diff ; aucune lecture payante pour tester (lecture du nord évaluée sur les lectures gardées, puis une lecture payante seulement sur accord).

## Points d'attention
- **Ordre** : la partie A ne demande pas de GPU et vient avant le réalisme dans OFFRES.md § 7.2 ; elle peut se faire sans attendre L13-01 (dépendance réelle : L1-02). Si le ticket doit être découpé, le couper selon les parties A et B.
- **Tranché : R16.** Le bouton visible en mode simple est traité par L4-11 (petit diff `[M]`, avec l'agent des duplex), pas ici.
- **Tranché : R3.** Le GPU n'est jamais obligatoire : il n'est requis que pour l'option B, qui n'existe que si un exécutant GPU est retenu par L13-01.
- Coût GPU : L4 à 0,79 € de l'heure ou Mac mini M4 Pro à 335 € par mois (recherche/hebergement.md § 6) ; ne pas engager de coût fixe avant une demande mesurée.
- Vulkan sur GPU NVIDIA non testé : comparer aux images Metal avant toute vente (hebergement.md § 2.2).

## Références
- produit/OFFRES.md § 7.1, § 7.2 (options 2 et 3) ; produit/PARCOURS.md A12 ; produit/recherche/hebergement.md § 2.1, § 2.2, § 2.3, § 6.
- `moteur/engine.js:956` (nord), `:1567` (`startPT`) ; `moteur/ui.js:337-360` (réglages hors mode simple), `:367` (bouton) ; `pipeline/lire.py:241` (flèche du nord).

## Hors périmètre
- Exécutant GPU et mesure : L13-01. Meublé : L13-04. Galerie complète : L13-02.
