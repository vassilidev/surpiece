# L1-16 · Mesurer le rendu des panoramas 360° en SwiftShader et confirmer l'offre gratuite

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P0 | M (1 à 3 j) | L1-02, L1-09 | `outils/` | En cours |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 15) : un mode 360° à chaque arrêt, comme sur les sites d'annonces, entre dans toutes les visites (panoramas rendus par le serveur, navigation d'arrêt en arrêt). « Ce sera peut-être le truc gratuit plutôt que la visite complète » : le 360° devient probablement l'offre gratuite, et il remplace ou enrichit l'aperçu de R1. C'est à confirmer avec le coût de rendu mesuré : le rendu tourne en SwiftShader sans GPU par défaut (décision 4, R3), environ 11 fois plus lent que Metal (11 photos en 684 s contre 60 s sur M3, `recherche/hebergement.md` § 2.1), et environ 10 panoramas par plan offert représentent un temps de calcul à mesurer et à provisionner, bien plus que les 4 images de R1. Le 360° respecte la décision 6 : des images du serveur, ni moteur ni `plan.json` dans le navigateur. Ce ticket mesure avant toute décision et tout développement en service.

## Ce qui est fait (28/09/2026)
Le 360° a été construit directement dans l'outil local (L4-15 et L4-16, en cours), sans passer par un prototype jetable `outils/panoramas.mjs`. Ce ticket en reprend les mesures.
- **Rendu** (`moteur/pano.mjs`) : à chaque arrêt, 6 vues à hauteur d'œil du niveau de l'arrêt, en mode photo (`?shoot=1`), une seule exposition par panorama, projection équirectangulaire en 8192 × 4096 (chargé seulement sur ordinateur quand l'écran le demande), 4096 × 2048, 2048 × 1024 et un aperçu de 512 px. Depuis le 28/09/2026, **occlusion ambiante** : chaque face est rendue deux fois (sans puis avec), ce qui allonge le rendu. Options `--standard` (2048 × 1024 au plus) et `--logiciel` (SwiftShader). Format et résolution choisis pour l'essai, **pas encore validés par l'utilisateur**.
- **Coutures** : écart de luminance entre deux vues voisines de 1,46 sur 255 au plus sur les 33 panoramas (seuil `SEUIL_COUTURE` : 3) ; écart du rapport d'occlusion entre deux vues voisines, avant fondu : 28,4 au plus (seuil 40). Essai négatif : une vue exposée 15 % plus fort donne 6,6 et le contrôle la refuse. Occlusion vérifiée en tournant le cube de 45° : 1 à 2 sur 255 d'écart en plus près des arêtes, invisible.
- **Contrôles** (`pano/controle.json`, bloquants pour la publication) : ceux de L4-15 (images, coutures, placement des arrêts et des cercles, regards, placards) et de L4-16 (visionneuse sans moteur ni requête hors de son dossier, sous politique de contenu stricte). Ils passent sur le T2, plan-du-lot, 3124 et la duplex ; le D201 est bloqué par le contrôle des placards (retour R2 de l'utilisateur, L4-15).
- **Visionneuse** : celle de L4-16, contrôlée sur ordinateur (1 440 × 900, et rétine) et en émulation de téléphone (390 × 844, iPhone et Android, gestes tactiles) ; pas encore sur un vrai téléphone.

### Mesures du 28/09/2026 (Mac, rendu Metal)
Chiffres **indicatifs** (machine partagée avec d'autres agents).

| Plan | Arrêts | Durée par plan, liens, regards et contrôles compris (16 h 09 à 16 h 20) | Première version, sans occlusion ni 8192 | Dossier `pano/` |
|---|---|---|---|---|
| t2-432 | 4 | 34,5 s | 24,6 s | 6,8 Mo |
| plan-du-lot (c02f7fc8) | 6 | 60,9 s | 34,4 s | 10,4 Mo |
| d201 | 6 | 71,2 s (contrôle en échec : placard) | 35,8 s | 8,8 Mo |
| plans-du-lot-3124 | 7 | 70,3 s | 45,3 s | 10,7 Mo |
| duplex 3081-613 | 10 (11 dans la première version, arrêt « Escalier » retiré) | 104,3 s | 57,8 s | 16,3 Mo |

- **Par panorama** (8192, 4096, 2048 et aperçu, occlusion comprise) : 8,0 s en médiane, 9e décile 10,6 s, maximum 11,7 s (33 panoramas). Première version, sans occlusion ni 8192 : 5,0 s en médiane.
- **Poids moyen (maximum)** : 8192 × 4096 : 0,94 à 1,11 Mo selon le plan (2,06 Mo) ; 4096 × 2048 : 351 à 417 Ko (786 Ko) ; 2048 × 1024 : 106 à 124 Ko (240 Ko) ; aperçu 512 : 11 à 12 Ko (21 Ko).
- **Sans carte graphique (SwiftShader)** : environ 3,5 min par panorama en 4096, soit 20 à 40 min par plan, d'après le rapport de construction, **avant** l'occlusion (faces rendues deux fois) et le 8192. Ordre de grandeur dépassé, **pas mesuré** sur les 5 plans ni sur la VM visée ; c'est le vrai coût à prévoir si le 360° devient l'offre gratuite.
- Cœurs occupés et mémoire de pointe : non mesurés.

## Avis de l'utilisateur (29/09/2026, soir)
Validation de l'utilisateur du 29/09/2026 (soir), mot pour mot : « L1-16 je te laisse faire la vérification alors, je pense que l'offre gratuite peut proposer ça oui, ou le plan découpé 3D. » Direction : l'offre gratuite propose le 360° ou la maquette découpée (plan découpé en 3D) ; choix final au vu des mesures en SwiftShader, à présenter.

## À faire
1. **Mesurer en SwiftShader** (`node moteur/pano.mjs plans/<id> --logiciel`) sur les 5 références, sur une machine non partagée, avec et sans le 8192 et en `--standard` : durée par panorama et par plan (médiane, 9e décile), part de l'occlusion, cœurs occupés, mémoire de pointe.
2. **Extrapoler** à la VM visée (L0-03, 4 vCPU) : durée ajoutée à l'offre gratuite, plans par heure, provision de rendu par plan (OFFRES.md § 8.1, § 8.8), comparées aux 4 images actuelles.
3. **Présenter à l'utilisateur** les chiffres, les panoramas et la visionneuse (il a vu le 360° du D201 le 28/09/2026 et fait les retours R1 et R2, L4-15 ; pas encore les chiffres), et deux options : le 360° remplace l'aperçu de R1, ou il l'enrichit ; plus le format (équirectangulaire), la résolution (8192, 4096 ou 2048), l'occlusion et le rendu logiciel ou sur carte graphique (L13-01). Consigner sa décision datée dans PLAN.md § 2.1 et § 2.4 (R1), OFFRES.md § 0.1, § 2.2 et § 8.1 ; signaler les textes à reprendre (MESSAGES.md, L2-04, L2-08, L2-09, L6-05, L6-13).

## Critères d'acceptation
- [ ] Tableau des mesures sur les 5 références, en Metal et en SwiftShader, avec la date et la machine. Metal fait le 28/09/2026 (indicatif, machine partagée) ; SwiftShader manquant.
- [ ] Extrapolation écrite : durée par plan offert sur la VM visée, capacité, provision de rendu.
- [ ] Aucune image noire ni uniforme ; coutures sous un seuil écrit (3 sur 255, 1,46 au plus mesuré) ; chaque arrêt dans une pièce de son niveau ; la visionneuse ne charge ni le moteur ni `plan.json`. Tenu sur 4 plans ; le D201 est à `ok: false` (placard de l'entrée) tant que sa correction n'est pas publiée.
- [ ] Décision de l'utilisateur écrite et datée (offre gratuite ou non, remplacement ou ajout, format, résolution), reportée dans PLAN.md et OFFRES.md.
- [x] Aucune lecture payante ; les panoramas des plans réels restent dans `plans/`, non versionné.

## Points d'attention
- Le rendu en service et la visionneuse de production relèvent de L4-15, L4-16 et L5-27 ; les mesures de ce ticket servent à la décision.
- Le précalcul d'éclairage (décision 14, L4-13) changera la durée de rendu : refaire la mesure quand il existera.
- La mention non contractuelle s'applique à chaque panorama (MARQUE.md § 8.3) : affichée en permanence par la visionneuse, pas incrustée dans l'image ; incrustée ou non : L4-07.
- Le rendu en direct sur le serveur (streaming vidéo) est écarté pour son coût : ne pas le réétudier ici.
- Même règle que L1-01 et L1-09 : aucune variable secrète dans l'environnement de Chrome. `moteur/pano.mjs` lance Chrome lui-même, avec son propre serveur statique sur la racine du dépôt : à passer par `moteur/chrome.mjs` quand L1-01 et L1-09 existent.

## Références
- CLAUDE.md ; PLAN.md § 2.1 (décisions 4, 6, 15), § 2.4 (R1, R3) ; OFFRES.md § 2.2, § 8.1, § 8.8.
- produit/recherche/hebergement.md § 2.1 (3 photos en 215 s en SwiftShader sur Mac M3).
- `moteur/pano.mjs` (en-tête : usage, options, `SEUIL_COUTURE`) ; `plans/<id>/pano/controle.json` (mesures par panorama) ; moteur/photos.mjs ; moteur/SCHEMA.md (`stops`, `levels`).

## Hors périmètre
- Rendu des panoramas en service : L4-15, L5-27. Visionneuse de production : L4-16. Aperçu gratuit en 360° : L6-13.
- Vue du dessus manipulable : L13-03. Galerie complète : L13-02.
