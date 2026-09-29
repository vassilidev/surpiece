# Hébergement de production

Recherche du 27/09/2026. Les prix sont ceux affichés par les fournisseurs à cette date, hors TVA sauf mention. Chaque fait externe est suivi de sa source. « Non vérifié » signale ce que je n'ai pas pu confirmer sur une source primaire. « Mesuré » renvoie à un essai fait ce jour sur la machine de développement. « Estimation » signale un calcul de ma part, dont les hypothèses sont données.

Les prix mensuels sont calculés à **730 h par mois** à partir du prix horaire quand le fournisseur ne donne pas de prix mensuel (sauf Fly.io, qui compte 30 jours).

---

## 0. En bref

1. **L'hébergement pèse peu à côté de l'IA.** Mon estimation va d'environ 70 €/mois au lancement (100 plans) à environ 800 à 1 300 €/mois à 10 000 plans. Sur la même période, la lecture par Claude coûte 116 à 195 $ puis 11 600 à 19 500 $ (1,10 à 1,85 $ par plan, plus 5,5 % de frais OpenRouter). **L'enjeu de coût, c'est le plafonnement d'OpenRouter** (§ 10), pas le choix de l'hébergeur.

2. **Le seul point technique dur, c'est le rendu Chrome sans GPU. Je l'ai mesuré ce jour.** Sur le même Mac M3, en forçant le rendu logiciel SwiftShader à la place de Metal :
   - **les photos sont identiques** : écart moyen inférieur à 1/255 par pixel sur 3 photos, mêmes luminances et même verdict de la visite de contrôle ;
   - **le rendu est environ 11 fois plus lent** : 684 s contre 60 s pour les 11 photos d'un T2, et 13 s contre 6 s pour la visite de contrôle ;
   - **le lancer de rayons (three-gpu-pathtracer) devient inutilisable** : 14 passes en 90 s contre 700.

   Conséquences :
   - un serveur Linux sans GPU suffit pour la version de base ;
   - un GPU (Mac ou NVIDIA) ne devient nécessaire que pour l'option payante « réalisme ».

3. **Recommandation de départ : tout chez Scaleway, à Paris.** Scaleway est un fournisseur français qui propose au même endroit instances, Postgres géré, stockage S3, CDN, tâches sans serveur, GPU, Mac mini et e-mails. Le montage :
   - **une VM** PLAY2-MICRO (4 vCPU, 8 Go, 40,20 €/mois) en Docker Compose, qui porte Caddy, FastAPI, le worker de lecture IA et la visite de contrôle ;
   - **Postgres géré** DB-DEV-S (environ 11,40 €/mois), qui sert aussi de file de travaux ;
   - **Object Storage** avec **Edge Services** comme CDN (0,99 €/mois) ;
   - **les photos rendues par Serverless Jobs** en SwiftShader, payées à la seconde : environ 0,10 à 0,15 € par plan (estimation), sans coût fixe ;
   - **e-mails** par Scaleway TEM.

   Si l'essai de Chrome dans Serverless Jobs échoue, ou si le délai déplaît, la solution de repli est un **Mac mini M4 loué à Paris (149 €/mois)**, qui fait tourner le code actuel sans aucun changement.

   > **Dépassé le 27/09/2026** (décision n° 4 de l'utilisateur, arbitrage R3) : le rendu se fait par défaut et partout en SwiftShader dans un conteneur du Compose, sur notre VM. Serverless Jobs, GPU et Mac mini ne sont que des accélérations facultatives après le lancement (ticket L13-01), jamais obligatoires. Les mesures ci-dessus restent valables.

4. **Évolution.**
   - Vers 1 000 plans/mois : on sépare le worker IA sur une deuxième VM et on passe Sentry en Team.
   - Vers 10 000 plans/mois : 2 VM web derrière un répartiteur de charge, une base avec haute disponibilité, et **un rendu sur GPU** (L4 à 0,79 €/h, ou 2 à 3 Mac mini), une fois l'équivalence visuelle validée par un contrôle automatique.
   - Kubernetes n'est pas nécessaire à ces volumes.

5. **À écarter ou à limiter.**
   - **Fly.io** a arrêté ses GPU le 31/07/2026.
   - **Render, Railway et Fly** sont des sociétés américaines. Ils n'ont pas de GPU et sont 3 à 5 fois plus chers en CPU soutenu.
   - **Clever Cloud** est un bon PaaS français, mais il n'a pas de GPU et sa sortie de données Cellar coûte 0,09 €/Go.
   - **Hetzner** est le moins cher en CPU brut : CX53, 16 vCPU pour 29,49 €. Mais il n'a pas de Postgres géré, et ses prix ont fortement monté en 2026.
   - **Postmark et Resend** stockent les données aux États-Unis.

---

## 1. Ce qu'il faut héberger : ordres de grandeur

Mesures faites sur les dossiers `plans/` du dépôt, sans citer de plan :

| Élément | Valeur | Source |
|---|---|---|
| Durée d'une génération | 8 à 15 min, surtout de l'attente réseau vers l'API. Exemples de `rapport.json` : une lecture de 615 s, une relecture de 83 s, un arbitrage de 184 à 361 s | `CLAUDE.md`, `plans/*/rapport.json` |
| Coût IA par plan | 1,10 à 1,85 $ | `CLAUDE.md`, `HISTORIQUE.md` |
| Rendu des photos (Mac M3, GPU Metal) | 11 photos en 60 s, soit environ 5 s par photo, plus le chargement | Mesuré (§ 2.1) |
| Visite de contrôle (Mac M3, Metal) | 5 à 6 s | Mesuré |
| Poids d'un plan stocké | 1,5 à 4,4 Mo par dossier. `plan.json` fait 21 Ko, les 11 photos 1,3 Mo, le PDF source de l'ordre de 0,6 Mo | Mesuré (`du`) |
| Poids d'une visite servie | environ 1,3 Mo de photos, 21 Ko de `plan.json`, 216 Ko de moteur, plus three.js (chargé aujourd'hui depuis cdn.jsdelivr.net) et Google Fonts | Mesuré |

Hypothèses de charge (estimation) :
- **Concurrence des lectures IA** : environ 12 min par plan et une pointe à 4 fois la moyenne horaire. Cela donne 1 lecture simultanée à 100 plans/mois, 2 à 3 à 1 000 plans/mois, 10 à 12 à 10 000 plans/mois. Une lecture attend surtout l'API, mais `extract.py` (PyMuPDF, OpenCV) et `murs.py` (Shapely) ont des pointes de CPU et de mémoire. Je compte 0,5 à 1 Go de mémoire par lecture en cours.
- **Stockage** : environ 10 Mo par plan, marge comprise. 10 000 plans/mois font donc environ 100 Go de plus par mois, soit environ 1,2 To au bout d'un an.
- **Trafic des visites** : environ 3 Mo par ouverture, une fois three.js et les polices hébergés chez nous. Ouvertures par plan et par mois : environ 20 pour un particulier, 50 à 200 pour un conseiller qui envoie des liens, beaucoup plus pour une intégration sur le site d'un promoteur. On arrive à quelques centaines de Go par mois à 1 000 plans et à quelques To à 10 000 plans.
- **E-mails** : 3 à 5 par plan (lien de connexion, génération terminée, reçu). Soit environ 500, 5 000 et 50 000 par mois selon le palier.

---

## 2. Rendu Chrome sans écran sur un serveur Linux

### 2.1 Mesures du 27/09/2026 (Mac M3, 8 cœurs, 8 Go)

J'ai travaillé sur une copie de `moteur/` et du T2 de référence, placée dans le répertoire temporaire de la session puis supprimée. Chrome a été lancé par puppeteer avec deux jeux d'options :
- **Metal** : `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` ;
- **SwiftShader** : `--use-angle=swiftshader --enable-unsafe-swiftshader`.

Chrome a confirmé le moteur utilisé : `ANGLE Metal Renderer: Apple M3` dans le premier cas, `Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver` dans le second.

| Mesure | Metal (GPU) | SwiftShader (CPU) | Rapport |
|---|---|---|---|
| 3 photos (séjour, chambre, maquette), 1 600 × 1 000 suréchantillonnées ×2 | 19 s | 215 s, avec 4,7 cœurs occupés en moyenne (1 060 s de CPU) | × 11 |
| 11 photos du même plan (essai complet fait le même jour sur la même machine par une autre session, journaux dans le même répertoire temporaire) | 60 s | 684 s | × 11,4 |
| Visite de contrôle (`controle.mjs`) | 5 à 6 s | 13 à 14 s | × 2,5 |
| Écart entre les images Metal et SwiftShader | — | 0,64 à 0,72/255 en moyenne ; au plus 0,05 % des pixels s'écartent de plus de 16/255 | identiques à l'œil |
| Verdict de la visite de contrôle | 1 problème | le même problème, au mot près | identique |
| Lancer de rayons (three-gpu-pathtracer 0.0.24), passes accumulées après 15, 45 et 90 s | 177, 580, 700 | 0, 0, 14 | environ × 50 ou plus |

Ce que j'en conclus :
- **Qualité et compatibilité** : three.js 0.180 fonctionne en SwiftShader avec GTAO, bloom, `Reflector`, cibles en demi-flottants et suréchantillonnage, et donne le même résultat que Metal. Aucune texture noire ni différence visible sur les 3 comparaisons.
- **Temps** : les 11 photos d'un plan prennent environ 11 min sur les 8 cœurs d'un M3. Sur des vCPU de serveur (un vCPU correspond en général à un fil d'exécution, pas à un cœur complet), je compte 1,5 à 2 fois plus de temps de CPU. C'est une estimation, **à mesurer sur la machine cible**.
- **Lancer de rayons** : il fonctionne en SwiftShader mais serait bien trop lent (une photo à 500 passes prendrait de l'ordre d'une heure). Il faudra un GPU pour l'option payante « réalisme ».

### 2.2 Cadre technique vérifié

- Chrome n'utilise plus SwiftShader automatiquement pour WebGL : il faut le demander par `--enable-unsafe-swiftshader`. Sans cette option, la création du contexte WebGL échoue. Le motif est un risque de sécurité, car SwiftShader génère du code à la volée (JIT) dans le processus GPU. Chrome maintient ce cas d'usage pour les tests sans GPU. Sources : [documentation Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md), [Intent to Remove](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM). Je n'ai pas pu vérifier la version de Chrome où la suppression est effective. Pour nous, le risque est faible car nous n'affichons que nos propres pages. Mais le conteneur de rendu doit rester **isolé et sans aucun secret**, puisque `plan.json` contient des textes issus du plan déposé.
- **GPU NVIDIA sous Linux** : Google cite les options `--headless=new --use-angle=vulkan --enable-features=Vulkan --disable-vulkan-surface` (plus `--no-sandbox` en conteneur), avec les pilotes NVIDIA et Vulkan installés. Sans eux, Chrome retombe sur SwiftShader. Source : [developer.chrome.com, « Supercharge Web AI model testing »](https://developer.chrome.com/blog/supercharge-web-ai-testing). Je ne l'ai pas testé : **il faudra comparer les images à celles de Metal avant la mise en production**.
- **llvmpipe (Mesa)** est une autre voie logicielle. Je ne l'ai ni mesuré ni vérifié.
- **Contrôle automatique à ajouter**, selon la règle « tout défaut devient un contrôle » : rendre 3 vues de référence sur chaque moteur de rendu déployé et **refuser la publication si l'écart moyen dépasse 2/255 par rapport à la référence Metal**. Le même contrôle détecte une texture noire ou un contexte WebGL non créé. Il faut aussi figer la version de Chrome for Testing dans l'image Docker.

### 2.3 Options de rendu

| Option | Coût fixe | Coût variable par plan | Durée des 11 photos | Changements de code | Lancer de rayons | Remarques |
|---|---|---|---|---|---|---|
| **Scaleway Serverless Jobs, SwiftShader** | 0 € | environ 0,10 à 0,15 € (estimation, voir ci-dessous) | 15 à 25 min en un seul job ; environ 3 à 8 min avec un job par photo (estimation) | options Linux, image Docker avec Chrome, lecture et écriture sur S3 | non | Maximum 6 vCPU et 16 Go par exécution, durée limite 24 h, 400 exécutions en parallèle, pas de GPU affiché ([limites](https://github.com/scaleway/docs-content/blob/main/pages/serverless-jobs/reference-content/jobs-limitations.mdx), [prix](https://www.scaleway.com/en/pricing/serverless/)). `photos.mjs` accepte déjà une liste d'identifiants de vues, ce qui permet un job par photo. |
| **Scaleway Mac mini M4** (PAR-1) | 149 €/mois (M4-S), 199 € (M4-M 32 Go) | environ 0 | environ 1 min pour les photos, plus 6 s de contrôle (M3 mesuré, M4 non mesuré) | aucun (Metal) | oui | Location minimale de 24 h ([prix](https://www.scaleway.com/en/pricing/apple-silicon/) ; les 24 h sont vues dans un résumé de recherche de la [page d'annonce](https://www.scaleway.com/en/news/apple-mac-mini-m4-as-a-service-with-scaleway/), non relues). Capacité d'environ 20 à 30 plans par heure (estimation). macOS est à administrer. Le rendu sans écran sur une machine sans moniteur est à valider. |
| **VM CPU, SwiftShader** (ex. Hetzner CX53, 16 vCPU partagés) | 29,49 €/mois | environ 0 | environ 15 à 25 min (estimation) | comme Serverless Jobs | non | Le moins cher à gros volume : environ 5 000 plans/mois théoriques par VM à 100 % d'occupation (estimation). Mais les vCPU sont partagés et Hetzner n'a pas de Postgres géré ([prix du 15/06/2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)). |
| **GPU L4 Scaleway** (L4-1-24G : 8 vCPU, 48 Go) | 0,79 €/h, soit environ 575 €/mois en continu | environ 0 | probablement inférieure au M3 (non mesuré) | options Vulkan, à valider | oui | [Prix GPU Scaleway](https://www.scaleway.com/en/pricing/gpu/). L40S-1-48G à 1,47 €/h, en PAR-2 et WAW-2 seulement ([page L40S](https://www.scaleway.com/en/l40s-gpu-instance/)). |
| **GPU L4 OVHcloud** (L4-90) | 0,75 €/h ou 540 €/mois | environ 0 | idem | idem | oui | L40S-90 à 1,40 €/h ou 1 008 €/mois ([catalogue public de l'API OVHcloud](https://api.ovh.com/1.0/order/catalog/public/cloud?ovhSubsidiary=FR), prix HT). |
| **Hetzner GEX44 ou GEX45** (serveur GPU dédié) | 272,30 €/mois pour le GEX44, plus des frais d'installation | environ 0 | non mesuré | Vulkan | oui | Prix du GEX44 relevé sur la [page d'ajustement de juin 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/). La [gamme GPU actuelle](https://www.hetzner.com/dedicated-rootserver/matrix-gpu/) montre un GEX45 (RTX PRO 4000 Blackwell, 24 Go, Helsinki), dont je n'ai pas pu lire le prix. |
| **Fly.io GPU** | — | — | — | — | — | Arrêtés : « Fly.io GPUs will be deprecated as of July 31, 2026 » ([forum Fly](https://community.fly.io/t/gpu-migration-fly-io-gpus-will-be-deprecated-as-of-july-31-2026/27110), fil lu par son titre seulement). `docs.fly.io/gpus` renvoie désormais vers le billet [« We were wrong about GPUs »](https://fly.io/blog/wrong-about-gpu/). |

Calcul du coût Serverless Jobs (estimation) :
- 11 photos, environ 3 350 s de CPU sur le M3 (684 s × 4,9 cœurs occupés), soit 5 000 à 6 700 vCPU·s sur serveur ;
- un job de 6 vCPU et 8 Go, occupé à environ 80 %, dure environ 20 min ;
- vCPU : 6 × 1 200 s × 0,00001 € = 0,07 € ;
- mémoire : 8 Go × 1 200 s × 0,000002 € = 0,02 € ;
- total : environ 0,09 à 0,12 €, plus environ 0,04 € de chargements répétés si l'on lance un job par photo.

La franchise mensuelle (200 000 vCPU·s et 400 000 Go·s) couvre environ 25 plans par mois.

**Point de bascule** (estimation) : SwiftShader en Serverless Jobs coûte le moins cher jusqu'à environ 1 000 à 1 500 plans par mois. Au-delà, un Mac mini à 149 € puis un GPU L4 à 575 € deviennent moins chers, et beaucoup plus rapides. Ils deviennent de toute façon nécessaires dès qu'on vend l'option « réalisme ».

> **Mise à jour du 27/09/2026** (décisions de l'utilisateur n° 14 et 15, `PLAN.md` § 2.1) : le rendu en direct sur le serveur (streaming vidéo de la visite) est écarté, pour son coût. Le serveur rendra en plus des panoramas 360° à chaque arrêt (environ 10 par plan) et précalculera l'éclairage « peint » sur les murs, la maquette compressée et les itinéraires. Leur temps en SwiftShader n'est pas mesuré (tickets L1-16, L4-13, L4-14). Depuis la même date, la visite de contrôle ajoute un test d'immersion (grille de cubes de 2 cm, calculée par le processeur) : les 13 à 14 s mesurées plus haut sont à refaire.

---

## 3. Comparatif des hébergeurs

### 3.1 Tableau de synthèse

| | Scaleway | OVHcloud | Clever Cloud | Hetzner | Render | Railway | Fly.io |
|---|---|---|---|---|---|---|---|
| Siège | France | France | France | Allemagne | États-Unis | États-Unis | États-Unis |
| Régions UE | Paris, Amsterdam, Varsovie | Gravelines, Roubaix, Strasbourg, etc. | Paris, etc. | Falkenstein, Nuremberg, Helsinki | Francfort | Amsterdam | Paris, Francfort, Amsterdam |
| Modèle | IaaS + services gérés + sans serveur | IaaS + services gérés | PaaS (`git push`) | IaaS | PaaS | PaaS à l'usage | micro-VM |
| VM ou service « 2 à 4 vCPU, 8 Go » | PLAY2-MICRO 4 vCPU/8 Go : 40,20 € | b3-8 2 vCPU/8 Go : 37,40 € ; VPS-2 4 vCœurs/8 Go : 7,21 € | M 4 vCPU/4 Go : 77,10 € | CX33 4 vCPU/8 Go : 8,49 € | 2 CPU/8 Go : 135 $ | 4 vCPU + 8 Go à pleine charge : 160 $ | performance-2x 4 Go à Paris : environ 70 $ |
| Postgres géré, plus petit utile | DB-DEV-S : environ 11,40 € | Essential db1-4 : 54,46 € | xs_sml (1 Go de RAM, 5 Go) : 19,50 € | aucun (à ma connaissance, non vérifié) | 1 Go : 19 $ | à l'usage, sur volume | non vérifié |
| S3 (par Go et par mois) | 0,016 € (multi-AZ) | environ 0,007 € | 0,0205 € (Cellar) | forfait avec 1 To (montant non lu) | — | — | — |
| Sortie de données | incluse pour les VM ; S3 : 75 Go offerts puis 0,01 €/Go | 0 € (catalogue) | Cellar : 0,09 €/Go | 20 To inclus par VM | 25 Go puis 0,15 $/Go (Pro) | 0,05 $/Go | 0,02 $/Go en Europe |
| GPU | L4, L40S, H100, B300, Mac mini | L4, L40S, H100, H200 | aucun au catalogue | serveurs dédiés GEX | aucun | aucun mentionné | arrêtés au 31/07/2026 |
| Tâches sans serveur | Serverless Jobs (24 h, 6 vCPU) | non étudié | non | non | Workflows, cron | cron | Machines à la demande |
| E-mails | TEM | non étudié | non | non | non | non | non |

Sources du tableau :
- **Scaleway** : [instances](https://www.scaleway.com/en/pricing/virtual-instances/) (le prix affiché inclut la sortie de données, l'IPv4 flexible est à 0,005 €/h) ; [bases gérées](https://www.scaleway.com/en/pricing/managed-databases/) (prix horaires ; les prix mensuels affichés par l'outil de lecture étaient incohérents, je les ai recalculés) ; [stockage](https://www.scaleway.com/en/pricing/storage/) ; [réseau et Edge Services](https://www.scaleway.com/en/pricing/network/).
- **OVHcloud** : [catalogue API public](https://api.ovh.com/1.0/order/catalog/public/cloud?ovhSubsidiary=FR) (prix HT, TVA à 20 % à part) ; [VPS](https://www.ovhcloud.com/fr/vps/), gamme affichée « VPS 2027 ».
- **Clever Cloud** : [grille de prix publique de l'API, zone Paris](https://api.clever-cloud.com/v4/billing/price-system?zone_id=par&currency=EUR) et [modules](https://api.clever-cloud.com/v2/products/addonproviders) ; la page [clever.cloud/pricing](https://clever.cloud/pricing/) n'affiche que le calculateur.
- **Hetzner** : [ajustement du 15/06/2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/) ; [costgoat](https://costgoat.com/pricing/hetzner) (tiers, données du 05/09/2026) pour le CX53 et le trafic de 20 To ; [Object Storage](https://docs.hetzner.com/storage/object-storage/overview/).
- **Render** : [render.com/pricing](https://render.com/pricing), texte de la page extrait ; [régions](https://render.com/docs/regions).
- **Railway** : [plans](https://docs.railway.com/reference/pricing/plans) ; [régions](https://docs.railway.com/reference/regions).
- **Fly.io** : [tarifs](https://docs.fly.io/about/pricing/), constantes lues dans la page (0,75 µ$/s par vCPU partagé, 11,96 µ$/s par vCPU « performance », 1,93 µ$/s par Go de RAM au-delà de l'inclus, majoration de 1,135 pour Paris).

### 3.2 Notes par fournisseur

- **Scaleway (recommandé).**
  - Il couvre tout le besoin dans une seule région française, avec une seule facture et un seul contrat de sous-traitance (DPA).
  - Prix utiles :
    - [Serverless Jobs](https://www.scaleway.com/en/pricing/serverless/) : 0,00001 € par vCPU·s et 0,000002 € par Go·s, avec 200 000 vCPU·s et 400 000 Go·s offerts chaque mois.
    - [Edge Services](https://www.scaleway.com/en/pricing/network/) : Starter à 0,99 €/mois (1 pipeline), Professional à 12,99 € (10 pipelines), Advanced à 109,99 € (100 pipelines), sortie de données indiquée « Free », 4 € par pipeline supplémentaire.
    - Répartiteur de charge LB-S : 0,023 €/h.
    - [Object Storage](https://www.scaleway.com/en/pricing/storage/) : **transferts entre Paris, Amsterdam et Varsovie gratuits**, ce qui est utile pour les sauvegardes dans une autre région.
  - Point d'attention : les « pipelines » d'Edge Services limiteront le nombre de domaines personnalisés en marque blanche. Il faudra alors passer au palier supérieur, ou servir les domaines clients par la VM (Caddy sait émettre les certificats TLS à la demande).
  - Une DB-DEV-S coûte environ 11,40 €/mois (0,0156 €/h). Le stockage de la base est facturé 0,0993 € par Go et par mois (Block 5K).
- **OVHcloud.**
  - Il est très compétitif en GPU (L4 à 0,75 €/h) et en stockage S3 (environ 0,007 €/Go, sortie à 0 € dans le catalogue).
  - Son Postgres géré est cher pour démarrer : 54,46 €/mois au minimum en Essential.
  - Pas de tâches sans serveur équivalentes, ni d'e-mails transactionnels (non étudiés).
  - Bonne alternative à Scaleway si l'on veut le GPU le moins cher en France.
- **Clever Cloud.**
  - C'est le plus simple à exploiter : un `git push` suffit, la facturation est à la seconde, les applications Python sont gérées et Postgres est proposé en module. Grille relevée :
    - applications : XS (1 vCPU, 1 Go) à 0,0222 €/h, soit 16,20 € ; S (2 vCPU, 2 Go) à 32,40 € ; M (4 vCPU, 4 Go) à 77,10 € ;
    - Postgres : xxs_sml (512 Mo de RAM, 1 Go) à 5,25 €/mois, xs_sml à 19,50 €, s_sml à 41 € ;
    - Cellar : 0,0205 € par Go et par mois, sortie à 0,09 €/Go.
  - Pas de GPU au catalogue. SwiftShader y fonctionnerait dans une application Docker, mais à 77 à 154 €/mois pour 4 à 6 vCPU.
  - Bon choix pour le web si l'on refuse d'administrer une VM, avec le rendu confié ailleurs (Scaleway).
- **Hetzner.**
  - C'est le CPU le moins cher : CX23 (2 vCPU, 4 Go) à 5,49 €, CX43 (8 vCPU, 16 Go) à 15,99 €, CX53 (16 vCPU, 32 Go) à 29,49 €, avec 20 To de trafic.
  - Mais **les prix ont été relevés deux fois en 2026** : jusqu'à +37 % au 1/04, et CPX et CCX multipliés par 2,4 à 2,75 au 15/06, selon le [résumé de Northflank](https://northflank.com/blog/hetzner-cloud-server-price-increases) (source tierce). La hausse des CX est confirmée par la page officielle.
  - Pas de Postgres géré, pas de CDN, pas de tâches sans serveur.
  - Intéressant plus tard comme **ferme de rendu SwiftShader** à bas prix, si la latence est acceptable.
- **Render.**
  - Offre Pro à 25 $/mois plus le calcul : 1 CPU et 2 Go à 25 $, 2 CPU et 4 Go à 85 $. Postgres : 1 Go à 19 $, 4 Go à 55 $. Bande passante incluse : 25 Go.
  - Il a une région à Francfort, mais c'est une société américaine, sans GPU. Le calcul soutenu y coûte 3 à 10 fois plus que chez Scaleway ou Hetzner.
- **Railway.**
  - 20 $ par vCPU et par mois, 10 $ par Go de RAM, sortie à 0,05 $/Go, région UE à Amsterdam.
  - Pratique pour un prototype. Coûteux pour des workers occupés 24 h/24 ou pour Chrome.
- **Fly.io.**
  - VM bon marché en temps partagé : shared-cpu-1x avec 1 Go à environ 5,70 $/mois hors majoration régionale.
  - Mais le modèle GPU a été abandonné, c'est une société américaine, et Postgres géré n'est pas vérifié. Je ne le recommande pas ici.

### 3.3 Site vitrine

| | Prix | Usage commercial | Données UE | Source |
|---|---|---|---|---|
| **Cloudflare Pages** (ou Workers avec fichiers statiques) | gratuit, requêtes statiques illimitées | oui | non : société américaine, réseau mondial | [Pages](https://developers.cloudflare.com/pages/functions/pricing/), [Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) (« requests for static assets on Workers are free ») |
| **Vercel** | Hobby gratuit mais **non commercial** ; Pro à 20 $/mois avec 1 To inclus puis 0,15 $/Go | Pro seulement | non | [vercel.com/pricing](https://vercel.com/pricing) |
| **Scaleway Object Storage + Edge Services** | environ 1 €/mois | oui | oui (France) | pages de prix Scaleway citées plus haut |

Recommandation : **Cloudflare Pages** si l'on veut des aperçus par branche Git et la gratuité, puisque la vitrine ne contient pas de données personnelles. **Scaleway + Edge Services** si l'on veut tout garder dans l'UE avec un seul fournisseur. Vercel n'apporte rien ici pour un site statique, et son offre gratuite interdit l'usage commercial.

### 3.4 Stockage objet et CDN des visites

| | Stockage (par Go et par mois) | Sortie de données | Requêtes | Remarques |
|---|---|---|---|---|
| **Scaleway Object Storage** | 0,01606 € (multi-AZ), 0,00803 € (une zone) | 75 Go offerts puis 0,01 €/Go ; gratuite derrière Edge Services | incluses | Données en France, même fournisseur que le reste |
| **Cloudflare R2** | 0,015 $ (10 Go offerts) | **gratuite** | classe A : 4,50 $ par million ; classe B : 0,36 $ par million | Juridiction « EU » possible par seau, définitive, point d'accès `*.eu.r2.cloudflarestorage.com`. Mais société américaine ([prix](https://developers.cloudflare.com/r2/pricing/), [juridiction](https://developers.cloudflare.com/r2/reference/data-location/)) |
| **OVHcloud Object Storage** | environ 0,007 € | 0 € (catalogue) | — | À envisager si l'on migre vers OVHcloud |
| **Clever Cloud Cellar** | 0,0205 € | 0,09 €/Go | — | Il faut un CDN devant |

À 10 000 plans/mois, avec environ 1,2 To stockés et quelques To servis, la facture reste sous 150 € quelle que soit l'option. R2 reste une bonne roue de secours si les intégrations des promoteurs font exploser le trafic.

---

## 4. Architecture recommandée pour démarrer

```
                 vitrine (Cloudflare Pages ou Edge Services)
                              │
 navigateur ──► app.domaine ──► VM Scaleway PLAY2-MICRO (Docker Compose)
                              │    Caddy (TLS) → FastAPI (uvicorn)
                              │    worker « lecture » (Procrastinate, 2 à 4 lectures à la fois)
                              │    visite de contrôle : Chrome SwiftShader (environ 15 à 30 s)
                              │    Umami (base séparée dans le même Postgres)
                              ├──► Postgres géré DB-DEV-S : données, file de travaux, grand livre des crédits
                              ├──► Object Storage (Paris)
                              │      seau privé  : PDF, extraction, reponse-ia.json, rapports
                              │      seau visites : moteur versionné, photos → Edge Services (visite.domaine)
                              ├──► Serverless Jobs « photos » : image Chrome + SwiftShader,
                              │      1 exécution par plan ou par photo, lit et écrit sur S3, rappelle l'API
                              ├──► OpenRouter (clé de production plafonnée, clé « gratuit » plafonnée par jour)
                              └──► Scaleway TEM (e-mails), Sentry UE, surveillance de disponibilité
```

Choix et raisons :
- **File de travaux dans Postgres** plutôt que Redis. [Procrastinate](https://procrastinate.readthedocs.io/en/stable/) (Python, PostgreSQL 13 et plus, asynchrone, relances, verrous, tâches périodiques) évite un service de plus. On peut aussi écrire une table `travaux` lue par `SELECT … FOR UPDATE SKIP LOCKED`. Chaque plan tourne dans un **sous-processus** avec :
  - un délai limite (30 min) ;
  - un battement de cœur ;
  - une reprise sans repayer, grâce au `reponse-ia.json` déjà gardé.
- **Visite de contrôle sur la VM, photos en Serverless Jobs.** Le contrôle est court (13 s en SwiftShader) et tourne dans la boucle de réparation Python (`repare_moteur`). Il reste donc à côté de la lecture. Les photos, longues et gourmandes en CPU, partent en tâches payées à la seconde. Le passage à un Mac mini ou à un GPU ne change que l'exécutant.
- **Le moteur doit être versionné et immuable sur le CDN** (`/moteur/v42/engine.js`). Une visite validée par la visite de contrôle avec la version N doit toujours se charger avec la version N. **three.js, three-mesh-bvh, three-gpu-pathtracer et les polices doivent être servis par nous** : aujourd'hui, les visites dépendent de cdn.jsdelivr.net et de fonts.googleapis.com. C'est une dépendance tierce, et l'adresse IP des visiteurs est transmise à ces services. Je n'ai pas vérifié ici la jurisprudence allemande sur Google Fonts.
- **Liens de visite** : `index.html` et `plan.json` (21 Ko) passent par l'application. Elle contrôle le jeton, l'expiration et la révocation, et tient le journal d'ouverture utile à la qualification par les conseillers. Les fichiers lourds (moteur, photos) passent par le CDN sous des chemins non devinables. **Le plan du promoteur (`page.png`, `plan-*.png`, `source.pdf`) reste dans le seau privé**, comme le demande l'audit B7.
- **Sécurité du rendu** : le conteneur de rendu ne reçoit que les fichiers du plan concerné (pas de `.env`, pas de clé OpenRouter). Son serveur statique écoute sur 127.0.0.1 seulement, ce qui corrige le défaut relevé par l'audit.
- **Secrets** : dans le Secret Manager de Scaleway ou dans des variables d'environnement du déploiement, jamais dans l'image.

Solution de repli si Chrome ne tourne pas bien dans Serverless Jobs (mémoire partagée `/dev/shm`, bac à sable, polices) : un **Mac mini M4 Scaleway** comme worker de rendu. Il prend les travaux dans la file et fait tourner `photos.mjs` tel quel (Metal). Coût fixe : 149 €/mois.

---

## 5. Coût mensuel estimé par palier

Hypothèses : Scaleway Paris, hors TVA. Le coût de l'IA est donné à part, en dollars. Les montants sont des **estimations** construites à partir des prix sourcés ci-dessus.

| Poste | Lancement (~100 plans/mois) | ~1 000 plans/mois | ~10 000 plans/mois |
|---|---|---|---|
| **Web** (API, pages, contrôle) | Une PLAY2-MICRO partagée avec les workers IA : 40,20 €, plus IPv4 3,65 € et disque de 20 Go 1,90 €, soit **environ 46 €** | Une PLAY2-MICRO : **environ 46 €** | Deux PLAY2-MICRO et un LB-S (16,80 €) : **environ 108 €** |
| **Base** | DB-DEV-S (11,40 €) et 5 Go : **environ 12 €** | DB-PLAY2-NANO (31,50 €) et 20 Go : **environ 34 €**, **environ 55 €** avec haute disponibilité (le supplément de HA est approximatif) | DB-PRO2-XXS (80,30 €), HA et 50 Go : **environ 130 €** |
| **Workers IA** (surtout de l'attente réseau) | inclus dans la VM web : **0 €** | Une PLAY2-MICRO dédiée : **environ 46 €** | Deux PRO2-XS (4 vCPU, 16 Go, 81,90 € chacune) : **environ 170 €**, ou Serverless Jobs (1 vCPU, 2 Go, 15 min, environ 0,013 € par plan) : **environ 130 €** |
| **Workers de rendu Chrome** | Serverless Jobs SwiftShader : **environ 5 à 15 €** (franchise déduite), ou Mac mini M4 à 149 € | Serverless Jobs : **environ 100 à 150 €**, ou Mac mini M4 : 149 € | GPU L4 : **environ 575 €**, ou 2 à 3 Mac mini M4 : **environ 300 à 450 €** (Serverless Jobs à 1 000 à 1 500 € n'a plus d'intérêt) |
| **Stockage et CDN** | S3 négligeable et Edge Services Starter : **environ 1 €** | environ 120 Go (2 €) et Edge Services Professional (13 €) : **environ 15 €** | environ 1,2 To (19 €) et Edge Services Advanced (110 €) : **environ 130 €** (ou R2 et Cloudflare : **environ 20 à 40 €**) |
| **E-mails** (TEM) | 300 gratuits, **environ 0 €** | environ 5 000 : **environ 1 €** | environ 50 000 : **environ 12 €** (ou offre Scale à 80 € avec IP dédiée) |
| **Supervision** | Sentry Developer et surveillance gratuite : **0 €** | Sentry Team à 26 $ : **environ 24 €** | Sentry Business (80 $) et Better Stack (29 $) : **environ 100 €** |
| **Vitrine** | 0 € (Cloudflare Pages) | 0 € | 0 € |
| **Total hébergement** | **environ 65 à 75 €** (environ 210 € avec un Mac mini) | **environ 270 à 340 €** | **environ 800 à 1 300 €** |
| Hébergement par plan | environ 0,70 € | environ 0,30 € | environ 0,08 à 0,13 € |
| **IA (OpenRouter), pour comparaison** | 116 à 195 $ | 1 160 à 1 950 $ | 11 600 à 19 500 $ (8 % de frais au lieu de 5,5 % si routage UE, § 10) |

Lecture : l'hébergement représente **environ 5 à 35 % du coût total mensuel (hébergement plus IA)** selon le palier. Chaque dollar gagné sur la lecture IA (cache de requêtes, relectures ciblées, modèle moins cher pour l'arbitrage) pèse plus que n'importe quelle optimisation de l'hébergement.

Les variantes moins chères sont possibles, mais demandent plus d'administration :
- **Hetzner au lancement** : un CX43 à 15,99 € porte tout (web, Postgres autogéré, lecture, rendu SwiftShader limité par `nice` ou `--cpus`), plus Object Storage. Environ 25 €/mois, mais sauvegardes et mises à jour de Postgres à notre charge.
- **Clever Cloud pour le web** : XS web et XS worker (32,40 €), plus Postgres xs_sml (19,50 €). Environ 55 €, pas d'administration système, mais le rendu reste chez Scaleway.

---

## 6. Chemin d'évolution

| Déclencheur | Action |
|---|---|
| **Bêta fermée, moins de 50 plans/mois** | Architecture du § 4. Le **premier essai** consiste à faire tourner `photos.mjs` dans un Serverless Job et à mesurer le temps réel sur vCPU de serveur. Il faut aussi comparer les images au rendu Metal (contrôle du § 2.2). |
| **Rendu trop lent pour l'expérience** (plus de 10 min ajoutées) | Lancer un job par photo (déjà permis par `photos.mjs`), sinon passer au Mac mini M4 (149 €/mois). |
| **Environ 1 000 plans/mois, ou premiers conseillers payants** | Deuxième VM pour les workers IA. Postgres en haute disponibilité. Sentry Team. Sauvegardes logiques hors région (§ 8). Plafonds OpenRouter par clé et par type de client (§ 10). |
| **Imports de promoteurs** (50 à 300 lots d'un coup) | Serverless Jobs absorbe les pics (400 exécutions en parallèle) pour la lecture comme pour le rendu. Limiter la concurrence OpenRouter par compte, prévoir un budget par import et une file prioritaire pour les particuliers. |
| **Option « réalisme »** (lancer de rayons, 4K) | Un GPU devient nécessaire (§ 2.1) : Mac mini M4 Pro (335 €/mois) ou L4 (0,79 €/h) démarré à la demande quand la file dépasse N travaux, puis arrêté. |
| **Environ 10 000 plans/mois** | Deux VM web et un répartiteur de charge. Rendu GPU validé visuellement. CDN au palier Advanced ou R2. Envisager Kubernetes (Kapsule : plan de contrôle mutualisé gratuit, selon la [page de prix](https://www.scaleway.com/en/pricing/containers/)) seulement au-delà de 5 à 6 services à orchestrer. |
| **Clients exigeant la résidence des données** (promoteurs) | Routage OpenRouter dans l'UE (§ 10), Sentry UE, e-mails TEM. Les seuls sous-traitants hors UE restants sont alors OpenRouter (société américaine), Cloudflare si utilisé, et Sentry pour les comptes. |

---

## 7. Supervision

| Outil | Prix | Données UE | Usage | Source |
|---|---|---|---|---|
| **Sentry** | Developer gratuit (1 utilisateur, 5 000 erreurs, 30 jours) ; Team à 26 $/mois (50 000 erreurs, utilisateurs illimités) ; Business à 80 $ ; 1 moniteur de disponibilité inclus, puis 1 $ par alerte de disponibilité | **Région UE à Francfort** : événements, traces et journaux. Comptes et réglages de l'organisation restent aux États-Unis. Le choix se fait **à la création de l'organisation**, sans migration possible ensuite | Erreurs Python et JS, traces des lectures | [prix](https://sentry.io/pricing/), [emplacement des données](https://docs.sentry.io/organization/data-storage-location/) |
| **Better Stack** | gratuit : 10 moniteurs, 1 page de statut ; offre payante à partir de 29 $/mois | région Europe proposée pour la télémétrie | Disponibilité, battements de cœur des workers | [prix](https://betterstack.com/pricing) |
| **UptimeRobot** | gratuit (50 moniteurs, toutes les 5 min, « hobby and non-profit ») ; Solo à 9 à 10 €/mois | non vérifié | Alternative | [prix](https://uptimerobot.com/pricing/) |
| **Scaleway Cockpit** | métriques Scaleway incluses ; journaux personnalisés à 0,35 €/Go ; règles d'alerte à 0,015 € par jour | France | Métriques des VM, de la base et des jobs | [prix](https://www.scaleway.com/en/pricing/managed-services/) |

À surveiller dès le premier jour (alertes par e-mail) :
- disponibilité de `app.` et de `visite.` ;
- **battement de cœur de chaque worker** (une absence de plus de 10 min déclenche une alerte) ;
- **âge du plus vieux travail en attente** dans la file ;
- taux d'échec de la visite de contrôle ;
- **coût IA par plan**, déjà écrit dans `rapport.json` : alerte au-delà de 3 $ ;
- **solde et plafond OpenRouter** via `GET /api/v1/key`, qui renvoie `limit_remaining` ([limites OpenRouter](https://openrouter.ai/docs/api-reference/limits)) ;
- espace disque.

---

## 8. Sauvegardes

- **Postgres géré Scaleway** : sauvegardes automatiques, stockées à 0,03 € par Go et par mois ([prix](https://www.scaleway.com/en/pricing/managed-databases/)). Je n'ai pas vérifié la rétention par défaut. On y ajoute un **`pg_dump` chiffré chaque nuit** vers un seau d'une **autre région** (Amsterdam ou Varsovie, transferts inter-régions gratuits), gardé 30 jours et 12 mois. Cela protège aussi contre une erreur humaine ou une suppression du projet.
- **Object Storage** :
  - versionnement activé sur le seau privé, avec des règles de cycle de vie qui suppriment les anciennes versions après 30 jours et passent les sources de plus d'un an en Glacier à 0,00254 € par Go ;
  - réplication quotidienne des objets essentiels (PDF source, `reponse-ia.json`, `plan.json`) vers la seconde région ;
  - les photos et visites se régénèrent sans IA à partir de `plan.json` : ce n'est pas la peine de les répliquer.
- **VM** : sans état (tout est dans Git, l'image Docker, Postgres et S3), donc pas de sauvegarde de disque. Il suffit d'une procédure écrite de reconstruction en moins d'une heure.
- **Test de restauration mensuel**, automatisable : restaurer le dernier dump dans une base temporaire, compter les lignes des tables clés, puis réassembler un plan avec `outils/finalise.sh` depuis la copie. Objectifs : perte de données de 24 h au plus (1 h avec la restauration à un instant donné, si le fournisseur la propose, non vérifié), remise en service en 4 h au plus.
- **Suppression** : les plans des promoteurs et les données des comptes supprimés doivent aussi sortir des copies à l'expiration de la rétention. Il faut le documenter dans le registre RGPD.

---

## 9. E-mails transactionnels

| Service | Prix | Données | Verdict | Source |
|---|---|---|---|---|
| **Scaleway TEM** | Essential : 300 e-mails/mois gratuits, puis 0,25 € les 1 000, sans IP dédiée ni SLA. Scale : 80 €/mois pour 100 000 e-mails, puis 0,20 € les 1 000, IP dédiée, SLA de 99,9 % | France | **Recommandé** : même fournisseur, coût quasi nul (environ 12 € pour 50 000 e-mails) | [prix](https://www.scaleway.com/en/pricing/managed-services/) |
| **Brevo** | non vérifié : offre gratuite d'environ 300 e-mails/jour de mémoire, pages de prix illisibles par l'outil | société française, hébergement UE non vérifié | Alternative si l'on veut aussi des campagnes marketing (relances des prospects des conseillers) | [brevo.com/pricing](https://www.brevo.com/pricing/) (non lu) |
| **Postmark** | 100 e-mails/mois gratuits ; 15 $/mois pour 10 000, puis 1,20 à 1,80 $ les 1 000 | **États-Unis seulement** : « We currently don't have plans to add servers in the EU » | Excellente délivrabilité, mais hors UE | [prix](https://postmarkapp.com/pricing), [confidentialité UE](https://postmarkapp.com/eu-privacy) |
| **Resend** | gratuit jusqu'à 3 000/mois (100 par jour) ; Pro à 20 $ pour 50 000 | envoi possible depuis l'Irlande, mais « does not control where customer data is stored » : **données aux États-Unis** | Hors UE | [prix](https://resend.com/pricing), [régions](https://resend.com/docs/dashboard/domains/regions) |

Dans tous les cas : SPF, DKIM et DMARC sur un sous-domaine d'envoi dédié (`mail.domaine`), et webhooks de rebond et de plainte branchés sur la table des contacts.

---

## 10. Plafonds de dépense OpenRouter

Mécanismes vérifiés :
- **Plafond par clé** : `limit` en dollars et `limit_reset` (quotidien, hebdomadaire ou mensuel). Quand le plafond est atteint, la requête reçoit une **erreur 402**, avec `error.metadata.limit_source` qui dit quelle limite a joué : solde du compte, clé, ou budget des requêtes en cours. Sources : [limites](https://openrouter.ai/docs/api-reference/limits), [clés de gestion](https://openrouter.ai/docs/features/provisioning-api-keys).
- **Clés de gestion** (Management API, offre Standard et au-dessus) : création, modification et suppression de clés par API, avec plafond, rythme de remise à zéro et date d'expiration. Cas prévu par OpenRouter : une clé par client d'un SaaS ([prix et fonctionnalités par offre](https://openrouter.ai/pricing)).
- **Guardrails** (par espace de travail, attribués à des clés ou à des membres) : budget remis à zéro chaque jour, semaine ou mois, liste de modèles et de fournisseurs autorisés, ZDR imposé, régions de données. « Individual API key budgets still apply. The lower limit wins. » Source : [Guardrails](https://openrouter.ai/docs/guides/features/guardrails.md). Les **budgets par espace de travail** (quotidien à illimité dans le temps, erreur 403) sont réservés à l'offre Enterprise ([Workspace Budgets](https://openrouter.ai/docs/guides/features/workspaces/workspace-budgets.md)).
- **Crédits prépayés** : le solde du compte est le plafond ultime. Frais de **5,5 % (0,80 $ minimum)** par achat par carte. Les crédits **peuvent expirer un an après l'achat**. La recharge automatique est disponible ([FAQ](https://openrouter.ai/docs/faq)).
- **Résidence des données** :
  - le **routage dans l'UE** passe par `https://eu.openrouter.ai`. Il échoue plutôt que de sortir de l'UE, et il est réservé aux offres **Business (8 % de frais au lieu de 5,5 %)** et Enterprise ([In-Region Routing](https://openrouter.ai/docs/guides/features/in-region-routing.md), [prix](https://openrouter.ai/pricing)) ;
  - `anthropic/claude-opus-5`, le modèle utilisé, figure dans la liste des modèles éligibles UE le 27/09/2026 (`GET https://openrouter.ai/api/v1/models?region=eu`) ;
  - surcoût : 2,5 points, soit environ 0,03 à 0,05 $ par plan ;
  - le **ZDR** peut être imposé par requête (`provider.zdr: true`). Pour Anthropic, cela exclut les points d'accès directs d'Anthropic et ne garde que Bedrock et Vertex ([ZDR](https://openrouter.ai/docs/features/zdr)).

Réglage recommandé :
1. **Trois clés distinctes, créées par la Management API** :
   - `prod-payant` : plafond mensuel d'environ 1,5 fois la prévision, remis à zéro chaque mois ;
   - `gratuit` : plafond **quotidien** (par exemple 20 $/jour, soit environ 10 à 15 crédits offerts), ce qui borne les abus du crédit gratuit ;
   - `dev` : 10 $/jour, pour ne jamais payer une lecture de développement vouée à l'échec, conformément à la règle de la mémoire du projet.
2. **Recharge automatique désactivée** au lancement, ou réglée sur un seuil bas avec un montant modeste, pour qu'une boucle ne vide pas la carte. Pas de prépaiement de plus de 2 à 3 mois de consommation, puisque les crédits peuvent expirer.
3. **Budget par plan côté application**, qui est la vraie protection :
   - on réserve 3 $ avant la lecture et on arrête proprement au-delà (l'audit évalue le plafond théorique d'une passe à environ 13 $) ;
   - `max_tokens` borné ;
   - nombre maximal de relectures et d'arbitrages ;
   - pas de relance automatique après une erreur 402 ou 403 : le travail passe « en attente de budget », le crédit du client est libéré et une alerte part.
4. **Budget par compte** pour les conseillers et les promoteurs (plans inclus dans l'abonnement, plafond d'import). Il se tient dans notre grand livre de crédits (voir `auth-paiement.md`), pas chez OpenRouter. Une clé OpenRouter par gros client ne se justifie que pour la marque blanche ou la refacturation au coût réel.
5. **Alerte à 50, 80 et 100 %** du plafond mensuel, lue par une tâche périodique sur `GET /api/v1/key`.

---

## 11. À vérifier ou à tester avant de s'engager

1. **Chrome dans Scaleway Serverless Jobs** : taille de `/dev/shm`, `--no-sandbox`, polices, mémoire, **temps réel des 11 photos sur 6 vCPU**, et comparaison des images avec Metal. Ce n'est plus un essai qui décide du rendu de base (arbitrage R3 : SwiftShader dans le conteneur) ; il ne sert qu'à choisir une accélération après le lancement (L13-01).
2. **Mac mini M4 Scaleway** : rendu Metal sans écran, sans moniteur branché. Temps réel par plan.
3. **GPU L4 sous Linux** (Vulkan) : compatibilité avec GTAO, `Reflector`, les demi-flottants et le lancer de rayons, et écart avec Metal. À faire seulement avant le palier de 10 000 plans ou l'option « réalisme ».
4. Rétention par défaut des sauvegardes Postgres de Scaleway, et restauration à un instant donné.
5. Prix et hébergement de Brevo. Prix actuels de l'Object Storage Hetzner et du GEX45.
6. Supplément exact de la haute disponibilité sur les bases Scaleway (l'outil de lecture a donné « environ 50 à 65 % du nœud principal »).
7. Conditions d'Edge Services : ce que couvrent les « 100GB » ou « 1TB » (cache ou transfert) et le nombre de domaines personnalisés par pipeline.
8. **Panoramas 360° et précalculs en SwiftShader** dans le conteneur, sur la VM cible : temps et processeur pour environ 10 arrêts par plan, puis pour le précalcul d'un plan ; effet sur les aperçus en file (L1-16, L4-13, L4-14, L5-22).

---

## Sources

- Scaleway :
  - [GPU](https://www.scaleway.com/en/pricing/gpu/), [L40S](https://www.scaleway.com/en/l40s-gpu-instance/)
  - [Apple silicon](https://www.scaleway.com/en/pricing/apple-silicon/), [annonce Mac mini M4](https://www.scaleway.com/en/news/apple-mac-mini-m4-as-a-service-with-scaleway/)
  - [Instances](https://www.scaleway.com/en/pricing/virtual-instances/), [Serverless](https://www.scaleway.com/en/pricing/serverless/), [limites Serverless Jobs](https://github.com/scaleway/docs-content/blob/main/pages/serverless-jobs/reference-content/jobs-limitations.mdx), [Containers et Kapsule](https://www.scaleway.com/en/pricing/containers/)
  - [Bases gérées](https://www.scaleway.com/en/pricing/managed-databases/), [Stockage](https://www.scaleway.com/en/pricing/storage/), [Réseau et Edge Services](https://www.scaleway.com/en/pricing/network/), [TEM et Cockpit](https://www.scaleway.com/en/pricing/managed-services/)
- OVHcloud : [catalogue API public cloud](https://api.ovh.com/1.0/order/catalog/public/cloud?ovhSubsidiary=FR), [VPS](https://www.ovhcloud.com/fr/vps/)
- Clever Cloud : [grille de prix de l'API, zone Paris](https://api.clever-cloud.com/v4/billing/price-system?zone_id=par&currency=EUR), [modules](https://api.clever-cloud.com/v2/products/addonproviders), [instances](https://api.clever-cloud.com/v2/products/instances)
- Hetzner : [ajustement du 15/06/2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [Object Storage](https://docs.hetzner.com/storage/object-storage/overview/), [GPU dédiés](https://www.hetzner.com/dedicated-rootserver/matrix-gpu/), [costgoat (tiers)](https://costgoat.com/pricing/hetzner), [Northflank (tiers)](https://northflank.com/blog/hetzner-cloud-server-price-increases)
- Render : [prix](https://render.com/pricing), [régions](https://render.com/docs/regions)
- Railway : [plans](https://docs.railway.com/reference/pricing/plans), [régions](https://docs.railway.com/reference/regions), [prix](https://railway.com/pricing)
- Fly.io : [tarifs](https://docs.fly.io/about/pricing/), [arrêt des GPU (forum)](https://community.fly.io/t/gpu-migration-fly-io-gpus-will-be-deprecated-as-of-july-31-2026/27110), [bex.co (tiers)](https://bex.co/blog/2026/08/16/flyio-august-2026-gpu-sunset-own-vs-rent-accelerators), [« We were wrong about GPUs »](https://fly.io/blog/wrong-about-gpu/)
- Cloudflare : [R2 prix](https://developers.cloudflare.com/r2/pricing/), [R2 juridiction](https://developers.cloudflare.com/r2/reference/data-location/), [Pages](https://developers.cloudflare.com/pages/functions/pricing/), [Workers et fichiers statiques](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- Vercel : [prix](https://vercel.com/pricing)
- Chrome : [SwiftShader](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md), [Intent to Remove](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM), [GPU en mode sans écran](https://developer.chrome.com/blog/supercharge-web-ai-testing)
- Supervision : [Sentry prix](https://sentry.io/pricing/), [Sentry emplacement des données](https://docs.sentry.io/organization/data-storage-location/), [Better Stack](https://betterstack.com/pricing), [UptimeRobot](https://uptimerobot.com/pricing/)
- E-mails : [Postmark prix](https://postmarkapp.com/pricing), [Postmark UE](https://postmarkapp.com/eu-privacy), [Resend prix](https://resend.com/pricing), [Resend régions](https://resend.com/docs/dashboard/domains/regions)
- OpenRouter : [limites](https://openrouter.ai/docs/api-reference/limits), [clés de gestion](https://openrouter.ai/docs/features/provisioning-api-keys), [Guardrails](https://openrouter.ai/docs/guides/features/guardrails.md), [budgets par espace de travail](https://openrouter.ai/docs/guides/features/workspaces/workspace-budgets.md), [routage dans l'UE](https://openrouter.ai/docs/guides/features/in-region-routing.md), [ZDR](https://openrouter.ai/docs/features/zdr), [FAQ](https://openrouter.ai/docs/faq), [prix](https://openrouter.ai/pricing), [modèles éligibles UE](https://openrouter.ai/api/v1/models?region=eu)
- File de travaux : [Procrastinate](https://procrastinate.readthedocs.io/en/stable/)
- Umami (auto-hébergement : Node.js 18.18 ou plus et PostgreSQL 12.14 ou plus) : [installation](https://umami.is/docs/install)
