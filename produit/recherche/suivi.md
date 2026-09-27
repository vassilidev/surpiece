# Mesure d'audience, attribution et conversions publicitaires

Recherche du 27/09/2026. Chaque fait externe est suivi de sa source. « Non vérifié » signale ce que je n'ai pas pu confirmer sur une source primaire. Deux limites techniques pendant cette recherche :
- les pages `support.google.com` et `cmppartnerprogram.withgoogle.com` n'étaient pas joignables depuis l'environnement (échec DNS) ; les faits Google viennent donc de `developers.google.com` ;
- le quota de recherche web était épuisé ; toutes les pages ont été lues directement à leur URL.

Les prix sont ceux affichés par les éditeurs à cette date, hors taxes sauf mention.

Hypothèses : backend Python, base Postgres, clientèle française, hébergement dans l'UE (le choix de l'hébergeur est traité ailleurs). Le paiement, l'auth et les campagnes publicitaires viennent plus tard. Ce document prépare donc le plan de marquage et l'architecture sans rien coder.

---

## 0. En bref

**Umami a beaucoup changé en 2026.** Il fait désormais :
- la relecture de session (v3.1.0, avril 2026) ;
- les cartes de chaleur (v3.2.0, juin 2026) ;
- le raccordement des sessions d'un visiteur identifié (v3.3.0, août 2026) ;
- des clés d'API et un serveur MCP (v3.4.0, 17/09/2026).

L'idée « pas de relecture de session » est donc fausse aujourd'hui. Il reste vrai qu'Umami n'a **aucune intégration publicitaire** : rien n'est envoyé à Meta ou à Google. Sources : [versions GitHub](https://github.com/umami-software/umami/releases), [Replays](https://docs.umami.is/docs/replays), [Integrations](https://docs.umami.is/docs/integrations).

**L'absence de cookie ne dispense pas du consentement.** L'article 82 vise toute lecture ou écriture sur le terminal, cookie ou non. L'exemption CNIL dépend de la **finalité** et de la **configuration**. La CNIL ne tient plus de liste de solutions évaluées. Depuis juillet 2025, elle publie un **outil d'auto-évaluation** destiné aux fournisseurs. Cet outil range hors du périmètre exempté :
- les UTM et identifiants de campagne ;
- les identifiants client ;
- la relecture de session ;
- les cohortes de test A/B ;
- toute mesure de performance publicitaire ;
- toute possibilité de suivre la navigation d'un utilisateur unique.

Matomo propose un mode « CNIL » calé sur cet outil. Je n'ai trouvé aucune auto-évaluation publiée par Umami (non vérifié faute de recherche web). Sources : [CNIL, page du 04/07/2025](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience), [outil d'auto-évaluation (PDF)](https://www.cnil.fr/sites/default/files/2025-07/outil_d_auto-evaluation_mesure_d_audience.pdf), [Matomo](https://matomo.org/faq/how-to/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/).

**Umami Cloud est moins adapté qu'un Umami auto-hébergé dans l'UE**, pour trois raisons :
- son DPA autorise le traitement des données clients « to improve the Services », alors que la CNIL exclut toute réutilisation pour le compte du prestataire ;
- la plupart de ses sous-traitants sont américains (AWS, Vercel, Cloudflare, ClickHouse, ainsi qu'Anthropic et OpenAI) ;
- on ne sait pas si l'on peut choisir la région d'hébergement (non vérifié).

Sources : [DPA Umami](https://umami.is/dpa), [sous-traitants](https://umami.is/subprocessors), [FAQ Cloud](https://docs.umami.is/docs/cloud/faq).

**Google Ads.** Depuis le **15/06/2026**, l'import de conversions hors ligne par l'API Google Ads (`UploadClickConversions`) échoue pour tout jeton qui n'en envoyait pas déjà. Un nouveau projet doit passer par la **Data Manager API**. L'adresse IP ne sert pas à la correspondance pour les utilisateurs de l'EEE. Source : [Google Ads API, upload-offline](https://developers.google.com/google-ads/api/docs/conversions/upload-offline).

**Meta CAPI.**
- La déduplication se fait sur le couple `event_id` + `event_name`, dans une fenêtre de 48 h.
- `event_time` ne peut pas remonter à plus de 7 jours.
- `client_user_agent` et `event_source_url` sont obligatoires pour les événements « website ».

Sources : [déduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events), [paramètres serveur](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event).

**Ma recommandation** repose sur trois étages :
1. **Umami auto-hébergé** sur notre Postgres, en configuration minimale sans consentement : pas d'identification, pas d'UTM, pas de relecture. Il s'enrichit (UTM, relecture) seulement quand le visiteur a consenti, grâce au crochet `data-before-send`.
2. **Un journal d'événements dans notre base**, source de vérité pour les comptes, les plans, les paiements et les abonnements.
3. **L'envoi serveur vers Meta (CAPI) et Google (Data Manager API)**, seulement pour les comptes qui ont consenti à la mesure publicitaire. L'attribution (UTM, gclid, fbclid, en premier et dernier contact) est gardée dans un cookie propriétaire posé après consentement, puis recopiée sur le compte à l'inscription.

Côté bandeau, **tarteaucitron.js** (gratuit, ou 190 € HT/an en version Pro) suffit. Une CMP certifiée Google n'est pas nécessaire tant qu'on ne monétise pas notre site par la publicité (voir § 6). GA4 n'est pas utile au lancement.

**Mon avis sur Umami** (détail au § 8) : **oui, en auto-hébergé**, pour l'audience anonyme du site. Mais il ne faut pas le présenter comme « conforme CNIL sans bandeau » par nature. Il ne remplace ni le journal serveur ni l'envoi publicitaire.

---

## 1. Umami en 2026

### 1.1 Fonctionnalités

| Fonction | Depuis | Ce qu'elle fait | Source |
|---|---|---|---|
| Événements par attribut HTML | v2 | `data-umami-event="nom"` sur un élément, propriétés via `data-umami-event-*`. Tout est stocké en chaîne, et les autres écouteurs de l'élément ne sont pas déclenchés. | [track-events](https://docs.umami.is/docs/track-events) |
| `umami.track()` | v2 | Formes : `track()`, `track(payload)`, `track(nom)`, `track(nom, data)`. Types conservés (nombre, booléen, tableau, objet). L'horodatage peut être forcé. | [tracker-functions](https://docs.umami.is/docs/tracker-functions), [event-data](https://docs.umami.is/docs/event-data) |
| Limites des événements | | Nom de 50 caractères au plus. Chaînes de 500 caractères au plus, nombres à 4 décimales, objets de 50 propriétés au plus. Pas de données sans nom d'événement. | [tracker-functions](https://docs.umami.is/docs/tracker-functions), [track-events](https://docs.umami.is/docs/track-events) |
| `umami.identify()` (Distinct ID) et données de session | v2 | Formes : `identify(id)`, `identify(id, data)`, `identify(data)`. Identifiant de 50 caractères au plus. Les propriétés de session sont filtrables. | [distinct-ids](https://docs.umami.is/docs/distinct-ids), [guide identify](https://docs.umami.is/docs/guides/identify-logged-in-users) |
| Raccordement des sessions identifiées | v3.3.0 (12/08/2026) | Les sessions d'un même Distinct ID, y compris sur plusieurs appareils, forment un seul profil. | [versions](https://github.com/umami-software/umami/releases) |
| Attribut `data-distinct-id` | v3.4.0 (17/09/2026) | Identifie le visiteur dès le script. | [versions](https://github.com/umami-software/umami/releases) |
| Funnel | v2.3.0 | Étapes ordonnées (URL, événement, joker « se termine par ») avec une fenêtre maximale en minutes entre deux étapes. Deux étapes au minimum. | [funnel](https://docs.umami.is/docs/funnel) |
| Journey | v2.12.0 | Chemins les plus fréquents, de 3 à 7 étapes, avec départ et arrivée facultatifs. | [journey](https://docs.umami.is/docs/journey) |
| Retention | v2.5.0 | Cohortes par jour de première visite, avec le taux de retour à J+n, sur un mois donné. | [retention](https://docs.umami.is/docs/retention) |
| Goals | v2.12.0 | Taux de conversion vers une page vue ou un événement. | [goals](https://docs.umami.is/docs/goals) |
| UTM | v2.11.0 | Vues ventilées par les 5 paramètres UTM. | [utm](https://docs.umami.is/docs/utm) |
| Attribution | v2.18.0 | Modèles premier clic et dernier clic vers une page ou un événement de conversion. Utilise le référent, les « paid ads » et les UTM. | [attribution](https://docs.umami.is/docs/attribution) |
| Revenue | v2.14.0 | Événement avec les propriétés `revenue` et `currency` (ISO 4217, USD par défaut si le code est inconnu). | [revenue](https://docs.umami.is/docs/revenue) |
| Breakdown, Compare, Insights | v2.5.0 | Ventilation par champs et comparaison dans le temps. | [breakdown](https://docs.umami.is/docs/breakdown), [insights](https://docs.umami.is/docs/insights) |
| Segments et cohortes | v3.0.0 | Filtres enregistrés. Les cohortes regroupent les visiteurs qui ont vu une URL ou déclenché un événement sur une période. | [segments](https://docs.umami.is/docs/segments), [cohorts](https://docs.umami.is/docs/cohorts) |
| Écran Sessions | v2.13.0 | Activité de chaque visiteur (pays, navigateur, pages vues) et profil individuel avec son historique. | [sessions](https://docs.umami.is/docs/sessions) |
| Relecture de session | v3.1.0 (16/04/2026) | Basée sur rrweb, par un script `recorder.js` séparé. Taux d'échantillonnage par défaut de 0,15. Masquage « moderate » (champs de saisie) ou « strict » (tout le texte). Durée maximale de 5 min. Conservation de 30 jours. | [replays](https://docs.umami.is/docs/replays) |
| Cartes de chaleur | v3.2.0 (24/06/2026) | Clics et défilement, agrégés, échantillonnage de 0,15, script `recorder.js`. | [heatmaps](https://docs.umami.is/docs/heatmaps) |
| Tableaux (Boards), partage, annotations | v3.1.0 et v3.4.0 | Tableaux de bord composables et partageables, notes datées sur les courbes. | [versions](https://github.com/umami-software/umami/releases) |
| Tags (test A/B simple) | v2.11.0 | `data-tag="variante"` sur le script, puis filtre ou Breakdown par tag. La répartition des visiteurs reste à notre charge. | [setup-ab-testing](https://docs.umami.is/docs/guides/setup-ab-testing) |
| Liens et pixels | v3.0.0 | Liens courts de redirection avec UTM et aperçu social ; pixel image pour les e-mails. | [links](https://docs.umami.is/docs/links), [pixels](https://docs.umami.is/docs/pixels) |
| Web Vitals | v3.1.0 | LCP, INP, CLS, FCP, TTFB avec `data-performance="true"`. | [tracker-configuration](https://docs.umami.is/docs/tracker-configuration) |

Réglages utiles du script ([tracker-configuration](https://docs.umami.is/docs/tracker-configuration)) :
- `data-domains` : n'enregistrer que sur le domaine de production ;
- `data-exclude-search` et `data-exclude-hash` : ne pas garder la chaîne de requête ni l'ancre ;
- `data-do-not-track` ;
- `data-auto-pageview="false"` ;
- `data-tag` ;
- **`data-before-send`** : une fonction qui reçoit `(type, payload)` et renvoie la charge modifiée, ou une valeur fausse pour annuler l'envoi. C'est la pièce clé de la configuration en deux niveaux (§ 7.2).

### 1.2 Ce qu'Umami collecte et comment il compte

Source : [metric-definitions](https://docs.umami.is/docs/metric-definitions), [sessions](https://docs.umami.is/docs/sessions), [FAQ](https://docs.umami.is/docs/faq).

- **Pas de cookie.** La session est une empreinte : un hachage de l'IP, du user-agent et de l'identifiant du site, avec un sel qui tourne chaque mois. La rotation est réglable par `SALT_ROTATION` depuis la v3.1.0 ([environment-variables](https://docs.umami.is/docs/environment-variables)).
  - Conséquence : un visiteur anonyme n'est plus reconnu d'un mois à l'autre. La rétention anonyme au-delà d'un mois n'a pas de sens.
  - Derrière un proxy ou un CDN, il faut régler `CLIENT_IP_HEADER`, sinon tous les visiteurs partagent la même IP.
- **IP jamais stockée.** Elle sert à la géolocalisation (pays, région, ville) puis est jetée.
- **Collecté à chaque événement :**
  - l'URL (chemin et chaîne de requête), le référent, le titre et le tag ;
  - le navigateur, l'OS, le type d'appareil, la taille d'écran et la langue ;
  - les **5 UTM** ;
  - les **identifiants de clic publicitaires `gclid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id` et `twclid`**, captés automatiquement dans l'URL.
- **Opposition.** La clé `localStorage` `umami.disabled = 1` coupe la mesure pour ce navigateur ([exclude-my-own-visits](https://docs.umami.is/docs/exclude-my-own-visits)). On peut s'en servir comme bouton d'opposition.
- **Bloqueurs de publicité.** On peut servir le script et le point de collecte depuis notre domaine (`TRACKER_SCRIPT_NAME`, `COLLECT_API_ENDPOINT`) ([bypass-ad-blockers](https://docs.umami.is/docs/bypass-ad-blockers)).

### 1.3 Umami Cloud

Offres lues dans les données de la page [umami.is/pricing](https://umami.is/pricing) le 27/09/2026 :

| | Hobby | Pro | Business | Enterprise |
|---|---|---|---|---|
| Prix | 0 $ | 20 $/mois | 200 $/mois | sur devis |
| Événements inclus par mois | 100 000 | 1 million | 10 millions | sur mesure |
| Événement supplémentaire | non | 0,00003 $ | 0,00002 $ | sur mesure |
| Sites | 1 | jusqu'à 20 | illimité | illimité |
| Membres d'équipe | non | jusqu'à 10 | illimité | illimité |
| Conservation | 6 mois | 2 ans | 5 ans | sur mesure |
| Accès API et MCP | non | oui | oui | oui |
| Relectures de session | non | non | 5 000 incluses, puis 0,005 $ l'unité | sur mesure |
| Cartes de chaleur, marque blanche, API de flux | non | non | oui | oui |
| SSO SAML, SLA, journal d'audit | non | non | non | oui |

Points à connaître :
- **Comptage** : chaque page vue compte pour un événement, et **chaque propriété enregistrée aussi** ([FAQ Cloud](https://docs.umami.is/docs/cloud/faq)). Un événement avec 3 propriétés coûte donc 4 événements.
- **Essai et export** : 14 jours d'essai sur les offres payantes. Export des données possible sur toutes les offres.
- **Hébergement** : « Umami Cloud servers are located in the US and EU » ([FAQ Cloud](https://docs.umami.is/docs/cloud/faq)). Je n'ai trouvé aucun moyen documenté de choisir la région (non vérifié).
- **Société et sous-traitants** : Umami Software, Inc. est américaine ([politique de confidentialité](https://umami.is/privacy)). La liste des sous-traitants, datée du 24/04/2026, comprend :
  - AWS, Vercel, Cloudflare, Upstash, Axiom, Resend, Stripe, Salesforce, Discord et Google (tous aux États-Unis) ;
  - ClickHouse (États-Unis et UE) et Hetzner (UE) ;
  - Anthropic et OpenAI.

  Source : [subprocessors](https://umami.is/subprocessors).
- **DPA** : Umami agit en sous-traitant, mais le client lui donne instruction de traiter les données « to provide, maintain, secure, support, and improve the Services ». Les transferts reposent sur une décision d'adéquation, les clauses contractuelles types ou un autre mécanisme valide ([DPA](https://umami.is/dpa)). Le mot « improve » est en tension directe avec le critère CNIL « aucune réutilisation des données pour le propre compte du prestataire […] (amélioration de son service…) » (§ 2.2).

### 1.4 Umami auto-hébergé

- **Licence MIT** ([dépôt GitHub](https://github.com/umami-software/umami)). Développement très actif : 4 versions mineures entre avril et septembre 2026.
- **Prérequis** : Node.js 18.18 ou plus, et **PostgreSQL 12.14 ou plus**, qui est la seule base prise en charge ([install](https://docs.umami.is/docs/install), [FAQ](https://docs.umami.is/docs/faq)). ClickHouse est pris en charge pour les gros volumes ([versions](https://github.com/umami-software/umami/releases)). Image Docker : `docker.umami.is/umami-software/umami:postgresql-latest`.
- **Fonctions** : relecture et cartes de chaleur sont disponibles en auto-hébergé (« Self-hosted heatmap recording and storage support », v3.2.0). L'API est gratuite. Le MCP est désactivé par défaut (`MCP_ENABLED=1` pour l'activer) ([versions](https://github.com/umami-software/umami/releases)).
- **Coût** :
  - marginal si Umami partage l'instance Postgres de l'application, dans une base séparée ;
  - un service Node s'ajoute à la pile Python ;
  - coût réel : un petit conteneur et un peu d'entretien (mises à jour mensuelles, sauvegardes).

  Je n'ai pas pu lire les prix des VPS (page Hetzner chargée en JavaScript). Un ordre de grandeur de 0 à 10 €/mois est plausible mais non vérifié.
- **Conservation** : « data is retained indefinitely unless you manually delete it » ([FAQ](https://docs.umami.is/docs/faq)). Il faudra une tâche de purge à 25 mois (recommandation CNIL, § 2.1).
- **Télémétrie** : mettre `DISABLE_TELEMETRY=1` ; `PRIVATE_MODE=1` coupe tous les appels externes ([environment-variables](https://docs.umami.is/docs/environment-variables)).

### 1.5 API et export

- **API REST** : statistiques, pages, événements, données d'événements, sessions, funnels, goals, attribution et breakdown ([index de la doc API](https://docs.umami.is/docs/api)).
- **Clés d'API**, **client TypeScript typé** (`@umami/api-client`) et **documentation OpenAPI** depuis la v3.4.0 ([versions](https://github.com/umami-software/umami/releases)).
- **Envoi côté serveur** par `POST /api/send` ou `/api/batch` (User-Agent obligatoire), avec un exemple Python dans la doc ([send-server-side-events](https://docs.umami.is/docs/guides/send-server-side-events)). Ces événements ne sont rattachés à aucune session de navigateur, ce qui limite leur intérêt dans un entonnoir.
- **En auto-hébergé**, lecture SQL directe de la base.

### 1.6 Limites

1. **Aucune intégration publicitaire.** La page Integrations ne liste que des extensions de CMS et des clients d'API ([integrations](https://docs.umami.is/docs/integrations)). Rien ne part vers Meta ou Google : c'est à faire nous-mêmes, côté serveur.
2. **Pas de drapeaux de fonctionnalité** ni de moteur d'expérimentation avec statistiques. L'A/B se limite à des tags et à la comparaison manuelle ([setup-ab-testing](https://docs.umami.is/docs/guides/setup-ab-testing)).
3. **Relecture de session récente** (avril 2026) et moins mûre que PostHog. Conservation limitée à 30 jours.
4. **Visiteurs anonymes remis à zéro chaque mois** (sel mensuel).
5. **Pas de « mode CNIL »** qui désactiverait l'écran Sessions (navigation individuelle), les UTM et l'identification d'un seul geste. Ces points sont à régler nous-mêmes (§ 2.3).
6. **Umami Cloud** : réserves du § 1.3 sur le DPA, les sous-traitants et la région.

---

## 2. CNIL : exemption de consentement pour la mesure d'audience

### 2.1 Le cadre

L'article 82 de la loi Informatique et Libertés impose le consentement avant toute lecture ou écriture sur le terminal, sauf pour ce qui est strictement nécessaire au service demandé. La CNIL admet que la mesure d'audience peut en faire partie sous conditions ([page CNIL du 04/07/2025](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience), [FAQ cookies, question 9](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)).

Pour être exemptés, les traceurs doivent :
- servir une finalité **strictement limitée à la mesure d'audience**, pour le compte exclusif de l'éditeur ;
- ne produire que des **données statistiques anonymes** ;
- ne pas permettre de **recoupement** avec d'autres traitements, ni de transmission de données non anonymes à des tiers ;
- ne pas permettre le **suivi global** de la navigation sur plusieurs sites.

La CNIL recommande aussi :
- d'informer les utilisateurs (dans la politique de confidentialité) ;
- une durée de vie des traceurs de 13 mois, non prorogée ;
- une conservation de 25 mois au plus ;
- un réexamen périodique de ces durées.

Il faut enfin un **mécanisme d'opposition** facile d'accès, car le traitement reste soumis au RGPD (FAQ, question 10).

« Sans cookie » ne sort pas du champ de l'article 82. Celui-ci s'applique aussi à l'empreinte du terminal : la CNIL en parle explicitement dans son outil, et le CEPD en décrit le périmètre technique dans ses [lignes directrices 2/2023, version 2.0 adoptée le 16/10/2024](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en).

### 2.2 Plus de liste officielle : un outil d'auto-évaluation (juillet 2025)

La CNIL ne publie plus de liste de solutions exemptées. Elle fournit aux éditeurs de solutions un [outil d'auto-évaluation (PDF, juillet 2025)](https://www.cnil.fr/sites/default/files/2025-07/outil_d_auto-evaluation_mesure_d_audience.pdf) :
- une solution ne peut pas se dire « certifiée » ou « validée par la CNIL » ;
- le fournisseur remet à ses prospects un document d'auto-évaluation ;
- l'éditeur du site doit demander ce document à son prestataire et reste responsable en cas de contrôle.

Critères de l'outil qui concernent directement notre cas (extraits) :

| Critère | Mesure recommandée par la CNIL |
|---|---|
| Finalité | Désactiver par défaut « toute mesure à visée marketing, y compris […] la mesure de performance des canaux de conversion, de performance de campagnes publicitaires, de mesure des canaux d'acquisition » et « toute création de cohorte d'utilisateurs pour leur présenter des contenus différenciés » (donc l'A/B). |
| Données minimisées | En-têtes réduits (par exemple la version majeure du navigateur ou de l'OS). Trois types d'événements au plus : présence sur une page, usage d'une fonctionnalité (clic), temps de chargement, de défilement ou de lecture. |
| Sous-traitance | DPA conforme à l'article 28, pas de mise en commun entre clients, **aucune réutilisation pour le compte du prestataire « quelle que soit la finalité (amélioration de son service, lutte contre la fraude, etc.) »**. |
| Aucun import externe | « Désactivation de toute collecte ou import d'identifiant client (ou "CRM"), d'UTM ou d'identifiant de campagne dans les URLs ». Référent limité au domaine. Pas d'intégration avec des outils tiers. |
| Pas de suivi hors du site | Une empreinte doit intégrer une composante propre au site et une composante temporelle. IP pseudonymisée (au moins le dernier octet retiré), localisation à l'échelle de la ville au plus fin. |
| Données anonymes | Rapports et exports **agrégés et arrondis à la dizaine**, ou analyse d'anonymat documentée. Aucune combinaison de filtres ne doit isoler un utilisateur. |
| Pas de suivi individuel | « Aucun suivi de la navigation d'un utilisateur unique n'est possible » : **désactiver la relecture de session**. |
| Opposition | Un bouton ou un lien dans la politique de confidentialité, et une prise en compte durable (cookie d'opposition ou liste d'exclusion). |

### 2.3 Umami face à ces critères

| Critère | Umami (auto-hébergé) | Action de notre côté |
|---|---|---|
| Empreinte propre au site et limitée dans le temps | Oui : identifiant du site et sel mensuel | Garder `SALT_ROTATION` au mois, ou plus court |
| IP | Jamais stockée, géolocalisation jusqu'à la ville | Rien à faire |
| UTM et identifiants de clic | **Collectés par défaut**, y compris gclid et fbclid | Les retirer sans consentement (`data-before-send` ou `data-exclude-search`) |
| Référent limité au domaine | Non par défaut | Le réduire à l'origine dans `data-before-send` |
| Identifiant client | Seulement si l'on appelle `identify()` | **Ne jamais appeler `identify()`** ni poser `data-distinct-id` |
| Relecture et cartes de chaleur | Seulement si `recorder.js` est chargé | Ne le charger qu'après consentement |
| Pas de suivi individuel | **Écran Sessions et profil visiteur disponibles** ; je n'ai pas trouvé de réglage pour les masquer | Écart résiduel à documenter (voir ci-dessous) |
| Arrondi à la dizaine | Non | Écart résiduel, analyse d'anonymat à documenter |
| Aucune réutilisation par le prestataire | Sans objet en auto-hébergé | `DISABLE_TELEMETRY=1` |
| Conservation de 25 mois | Illimitée par défaut | Purge SQL mensuelle |
| Opposition | Clé `umami.disabled` | Lien « Ne pas être mesuré » dans la politique de confidentialité, qui pose la clé |

Verdict factuel : bien configuré, Umami auto-hébergé coche la plupart des critères. **Deux écarts restent**, l'écran Sessions (navigation individuelle visible) et l'absence d'arrondi. La CNIL admet qu'une solution hors grille puisse rester exemptée si l'analyse est documentée. Le risque est faible pour un petit site, mais il n'est pas nul, et il faut rédiger cette analyse. Umami Cloud ajoute l'écart « improve the Services » et des transferts hors UE.

### 2.4 Les autres outils face à l'exemption

- **Matomo** propose une configuration explicitement calée sur l'outil de juillet 2025 ([Matomo, FAQ CNIL](https://matomo.org/faq/how-to/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/)) :
  - masque IP de 2 octets ;
  - cookie de 13 mois non prorogé ;
  - User ID désactivé ;
  - cartes de chaleur et relectures désactivées ;
  - UTM « stripped at ingestion and not stored » ;
  - conservation de 759 jours ;
  - opposition à intégrer par l'éditeur.

  C'est l'option la plus facile à défendre.
- **Plausible** se dit sans cookie et « made and hosted in the EU » ([plausible.io](https://plausible.io/#pricing)). Je n'ai pas vérifié qu'il publie une auto-évaluation CNIL.
- **PostHog** a un mode `cookieless_mode: "always"` présenté comme permettant de se passer de bandeau, mais `identify()` n'y fonctionne plus ([PostHog, cookieless](https://posthog.com/tutorials/cookieless-tracking)). Dès qu'on veut ses points forts (relecture, personnes, expériences), il faut le consentement en France.

---

## 3. Alternatives comparées

| | Umami (auto-hébergé) | PostHog Cloud UE | Matomo | Plausible |
|---|---|---|---|---|
| Nature | Audience web, léger | Suite produit complète | Audience web complète | Audience web minimaliste |
| Hébergement | Chez nous, dans l'UE | Francfort (sélecteur « EU (Frankfurt) » sur la page prix) ; société américaine | Cloud à Francfort ([pricing](https://matomo.org/pricing/)) ou auto-hébergé | UE, « European-owned infrastructure » |
| Prix d'entrée | 0 € de licence (MIT) | Gratuit : 1 M événements, 5 000 relectures, 1 M requêtes de drapeaux par mois | Cloud à partir de « 29 » par mois HT (devise non lisible dans la page récupérée), 2 mois offerts à l'année ; On-Premise gratuit, extensions premium payantes | 9 $/mois (Starter), 14 $ (Growth), 19 $ (Business) pour 10 000 pages vues par mois |
| Au-delà du gratuit | Coût d'hébergement | 0,00005 $ par événement de 1 à 2 M ; relecture à 0,005 $ de 5 000 à 15 000 ; drapeaux à 0,0001 $ la requête de 1 à 2 M ; « identified events » à 0,000198 $ de 1 à 2 M ; options Boost 250 $, Teams 450 $, Scale 750 $, Enterprise 2 000 $ par mois | Paliers selon les hits | Paliers selon les pages vues |
| Funnels | Oui | Oui, par personne | Oui (premium) | Oui, offre Business seulement |
| Relecture et cartes de chaleur | Oui (v3.1 et v3.2) | Oui, la référence | Oui (premium) | Non |
| Drapeaux et tests A/B | Tags seulement | Oui, avec statistiques | A/B (premium) | Non |
| Envoi vers Meta et Google | Non | Oui : destinations temps réel, dont Meta Ads Conversions (e-mail haché, fbc, fbp) ; 10 000 déclenchements gratuits puis 0,0005 $ l'unité | Non (non vérifié) | Non |
| Sans consentement en France | Possible en configuration minimale (§ 2.3) | Seulement en mode cookieless, avec les fonctions limitées | Oui, mode CNIL documenté | Revendiqué, auto-évaluation non vérifiée |

Sources PostHog : [pricing](https://posthog.com/pricing), [catalogue de facturation public (JSON)](https://billing.posthog.com/api/products-v2), [destination Meta Ads](https://posthog.com/docs/cdp/destinations/meta-ads). Sources Matomo : [pricing](https://matomo.org/pricing/). Source Plausible : [pricing](https://plausible.io/#pricing).

Lecture : **PostHog** devient intéressant si l'on veut des expériences, des drapeaux et de la relecture sur l'application connectée, avec consentement ou dans un cadre contractuel. **Matomo** s'impose si un client (promoteur, marque blanche) exige un outil documenté CNIL. **Plausible** fait moins qu'Umami pour notre besoin d'entonnoir.

---

## 4. Meta Conversions API

### 4.1 Événements standard utiles

Source : [référence des événements du Pixel](https://developers.facebook.com/docs/meta-pixel/reference).

| Événement | Définition Meta | Propriétés | Usage chez nous |
|---|---|---|---|
| `CompleteRegistration` | Formulaire d'inscription terminé | `currency`, `value`, `status` facultatifs | Compte particulier créé |
| `Lead` | « When a sign up is completed » | `currency`, `value` facultatifs | Demande de démo d'un conseiller, contact d'un promoteur |
| `StartTrial` | Début d'essai gratuit | `currency`, `value`, `predicted_ltv` facultatifs | Premier plan lancé avec le crédit offert |
| `Purchase` | Achat terminé | **`currency` et `value` obligatoires** | Pack de crédits payé (webhook Stripe) |
| `Subscribe` | Souscription d'un abonnement payant | `currency`, `value`, `predicted_ltv` facultatifs | Abonnement conseiller |

### 4.2 Déduplication pixel et serveur

Source : [deduplicate-pixel-and-server-events](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events).

- Le **`eventID`** du pixel doit égaler le **`event_id`** de CAPI, et les deux événements doivent porter le **même nom**.
- La fenêtre est de **48 h** après la réception du premier. À contenu égal, Meta garde en général le premier reçu.
- Il existe une méthode de secours par `event_name` et `fbp` ou `external_id`, mais un événement serveur n'est pas écarté si l'événement navigateur arrive après lui.
- Chez nous, `event_id` = identifiant UUID de la ligne du journal d'événements (§ 7.4).

### 4.3 Paramètres de correspondance

Sources : [customer-information-parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters), [fbp-and-fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc), [server-event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event).

**Données hachées en SHA-256 après normalisation :**
- `em` : e-mail sans espaces autour, en minuscules ;
- `ph` : chiffres seulement, avec l'indicatif pays et sans zéro initial ;
- `fn`, `ln`, `ct`, `zp`, `country` ;
- `external_id` : le hachage est recommandé.

**Données non hachées :**
- `client_ip_address` et `client_user_agent`. **`client_user_agent` est obligatoire** pour les événements website.
- `fbc` et `fbp`.

**Construction de `fbc` :**
- format `fb.1.<horodatage ms>.<fbclid>`, construit côté serveur à partir du `fbclid` de l'URL ;
- **le `fbclid` est sensible à la casse et ne doit pas être modifié** ;
- cookie `_fbc` de 90 jours ;
- Meta recommande d'envoyer `fbc` avec chaque événement.

`fbp` n'existe que si le Pixel est chargé.

**Autres contraintes :**
- `event_time` ne peut pas remonter à plus de **7 jours**, sinon Meta renvoie une erreur ;
- `action_source` vaut `website` (ou `system_generated` pour un renouvellement automatique) ;
- `event_source_url` est obligatoire pour les événements website ;
- `opt_out: true` réserve l'événement à l'attribution, sans optimisation ;
- `data_processing_options` (LDU) ne concerne que les États-Unis.

### 4.4 Consentement dans l'UE

- Pixel : `fbq('consent', 'revoke')` avant l'initialisation, sur chaque page, puis `fbq('consent', 'grant')` après accord. Meta suggère un bandeau avec consentement affirmatif ([Meta, GDPR](https://developers.facebook.com/docs/meta-pixel/implementation/gdpr)). La page ne dit rien de CAPI.
- CAPI transmet des données personnelles à des fins publicitaires : un e-mail haché reste une donnée personnelle, pseudonymisée. Deux étapes demandent le consentement :
  - poser ou lire le `fbclid` sur le terminal pour le garder jusqu'à l'inscription (article 82) ;
  - le partage lui-même (base légale RGPD, qui en pratique ne peut être que le consentement pour de la publicité ciblée).

  Il s'agit de mon analyse et non d'une citation. La jurisprudence de la CJUE sur la coresponsabilité avec Meta pour la collecte et la transmission (arrêt Fashion ID, C-40/17, 2019) va dans ce sens (non revérifié ici).
- **Catégorie spéciale « Housing ».** Meta impose des catégories spéciales en Europe depuis le 07/12/2021. Pour le logement, l'emploi et le crédit, le ciblage est restreint :
  - âges fixés de 18 à 65 ans et plus ;
  - pas de ciblage par genre ;
  - rayon d'au moins 25 km ;
  - pas d'audiences similaires.

  Source : [Meta, special ad category](https://developers.facebook.com/docs/marketing-api/audiences/special-ad-category). Nos annonces vendent un logiciel et non un logement, mais une annonce qui montre « votre futur appartement » pourrait être classée « Housing » (non vérifié ; à tester dès les premières campagnes).

---

## 5. Google Ads

### 5.1 Conversions améliorées

- **Enhanced conversions for web** : le tag Google envoie l'e-mail ou le téléphone haché au moment de la conversion. Cela suppose le tag Google chargé, donc le consentement.
- **Enhanced conversions for leads** : on importe plus tard, côté serveur, la conversion avec des données hachées (e-mail, téléphone, nom, prénom, adresse) et, si possible, le `gclid`. Google recommande d'inclure le `gclid` même quand le tag capte les e-mails ([upload-offline](https://developers.google.com/google-ads/api/docs/conversions/upload-offline)).
- Pour notre schéma centré sur le serveur, le second mode est le plus naturel.

### 5.2 Import hors ligne : passer par la Data Manager API

Source : [Google Ads API, upload-offline](https://developers.google.com/google-ads/api/docs/conversions/upload-offline) (avertissement en tête de page).

- « Starting June 15, 2026, UploadClickConversion requests will fail if the developer token hasn't previously sent requests to upload offline conversions or enhanced conversions for leads. Use the Data Manager API instead. » Une note ajoute que les jetons de développeur sont remplacés par des projets Google Cloud.
- La [Data Manager API](https://developers.google.com/data-manager/api) couvre les conversions hors ligne, les conversions améliorées pour les leads, les ajustements de conversion et les audiences Customer Match ([events](https://developers.google.com/data-manager/api/devguides/events), [send-events](https://developers.google.com/data-manager/api/devguides/events/google-ads/offline/send-events)).
- La destination est une action de conversion de type `UPLOAD_CLICKS`, affichée « Website (Import from clicks) » dans l'interface. Les identifiants utilisateur sont hachés en SHA-256, encodés en hexadécimal ou en Base64. Un chiffrement supplémentaire est possible.
- Chaque événement porte un objet **`consent`** qui contient `adUserData` et `adPersonalization`, avec les valeurs `CONSENT_GRANTED`, `CONSENT_DENIED` ou non précisé ([Consent](https://developers.google.com/data-manager/api/reference/rest/v1/Consent)). Côté API Google Ads, sans ce champ, « it's possible that your conversions won't be attributable ».
- **Pas de correspondance par IP pour les utilisateurs de l'EEE, du Royaume-Uni et de la Suisse** ([upload-offline](https://developers.google.com/google-ads/api/docs/conversions/upload-offline)).
- Les conversions « multi-source » envoyées en complément du tag sont réservées à une liste d'autorisation, et n'alimentent pas les enchères pendant 14 jours d'essai ([events](https://developers.google.com/data-manager/api/devguides/events)).
- La fenêtre entre le clic et la conversion importée est au plus de 90 jours. Je n'ai pas pu le revérifier, faute d'accès à support.google.com.

### 5.3 gclid, gbraid, wbraid

- **`gclid`** : paramètre ajouté par le marquage automatique au clic sur une annonce.
- **`gbraid`** : clic sur le web vers une application iOS.
- **`wbraid`** : clic dans une application iOS vers une page web.

Google recommande d'envoyer à la fois `gclid` et `gbraid` quand on dispose des deux ([upload-offline](https://developers.google.com/google-ads/api/docs/conversions/upload-offline)). Pour un site web, on captera `gclid` et `wbraid`, et `gbraid` par précaution.

### 5.4 Consent Mode v2

Sources : [consent-mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [guide consent](https://developers.google.com/tag-platform/security/guides/consent).

- **Quatre signaux** : `ad_storage`, `analytics_storage`, `ad_user_data` et `ad_personalization`. Les deux derniers ont été ajoutés en novembre 2023, dans le cadre du renforcement de la politique Google de consentement des utilisateurs de l'UE pour le trafic de l'EEE.
- **Deux modes** :
  - **Mode basique** : aucun tag Google n'est chargé avant le choix ; Google applique une modélisation générale.
  - **Mode avancé** : le tag est chargé avec des valeurs refusées par défaut, et envoie des pings sans cookie qui alimentent une modélisation propre à l'annonceur.
- **Date d'obligation** : l'exigence est appliquée depuis mars 2024 pour utiliser les audiences et la mesure Google Ads dans l'EEE. Seule source lue : l'éditeur de CMP [Didomi](https://www.didomi.io/regulations/google-consent-mode-v2) ; la page d'aide Google n'était pas accessible.
- **Position prudente en France** : le mode avancé fait partir des requêtes vers Google avant tout consentement. Au regard de l'article 82 et des lignes directrices 2/2023 du CEPD, je recommande le **mode basique**, ou rien du tout côté navigateur (§ 7). La CNIL n'a pas, à ma connaissance, tranché le mode avancé (non vérifié).
- Avec l'architecture serveur proposée, le Consent Mode ne concerne que les pages où l'on chargerait un tag Google. Pour l'import serveur, seul compte le champ `consent` de chaque événement.

### 5.5 GA4 : utile ou non ?

**Non au lancement**, pour quatre raisons :
1. GA4 n'est pas nécessaire pour mesurer les conversions Google Ads : le `gclid` et l'import serveur suffisent.
2. En France, GA4 exige le consentement, puisque Google réutilise les données. Sans consentement, il n'apporte donc rien de plus qu'Umami.
3. Il ferait doublon avec Umami et avec le journal.
4. Il faudrait le paramétrer (transferts, conservation, signaux Google).

On le reconsidérera si l'on a besoin de listes de remarketing issues de GA4 ou de la modélisation multicanal de Google. Même dans ce cas, les audiences Customer Match passent aussi par la Data Manager API.

---

## 6. Plateformes de gestion du consentement (CMP)

| Outil | Offre et prix | Consent Mode v2 | Certification Google | Source |
|---|---|---|---|---|
| **tarteaucitron.js** (français) | Open source gratuit (hébergé chez nous). Version Pro : **190 € HT/an**, 490 € HT pour 3 ans, 690 € HT à vie ; sites illimités, plus de 220 services, statistiques | Oui : « gère automatiquement l'envoi des signaux Google Consent Mode v2 pour GA4 et Google Ads » | Non revendiquée sur la page d'accueil (présence dans la liste Google non vérifiée) | [tarteaucitron.io](https://tarteaucitron.io/fr/) |
| **Axeptio** (français) | Extra Small 7 €/mois, Small 29 €, Medium 69 €, Large 129 €, par domaine ; 10 % de remise à l'année. Unités des paliers (pages vues ou visiteurs) à confirmer sur la page | Oui, dès Extra Small | « Certified CMP Partner », badge Gold ; IAB TCF v2.3 | [axept.io/fr/tarifs](https://www.axept.io/fr/tarifs) |
| **Didomi** (français) | Essential, Advanced, Premium selon le nombre de visiteurs uniques mensuels ; **prix sur devis** | Oui | « Certified Google CMP Gold Partner » | [offers](https://www.didomi.io/offers), [consent mode](https://www.didomi.io/regulations/google-consent-mode-v2) |
| **Cookiebot** (Usercentrics) | Free (50 sous-pages, 1 domaine) ; Premium Lite dès 7 €/mois ; Small 15 €/mois par domaine (350 sous-pages) ; Medium 30 € ; Large 50 € ; XLarge 90 € ; 14 jours d'essai | Oui | Non mentionnée sur la page de prix (non vérifié) | [cookiebot.com/fr/pricing](https://www.cookiebot.com/fr/pricing/) |

**Qui doit utiliser une CMP certifiée Google ?**
- À ma connaissance, l'obligation vise les **éditeurs qui monétisent** avec AdSense, Ad Manager ou AdMob dans l'EEE et au Royaume-Uni (non vérifié, pages Google inaccessibles).
- Pour un **annonceur**, Google documente l'implémentation du Consent Mode avec son propre bandeau : « Developers implementing their own consent solution… » ([guide consent](https://developers.google.com/tag-platform/security/guides/consent)).
- La phrase de Didomi, « you'll need to share data via Google Consent Mode v2 with a certified CMP », est une affirmation d'éditeur de CMP, que je n'ai pas pu confirmer sur une source Google.

**Recommandation :**
- **tarteaucitron.js en version gratuite**, hébergé chez nous : aucun tiers, Consent Mode v2 intégré, déclaration d'un service « mesure publicitaire (Meta, Google) » même sans script, grâce à un rappel JavaScript qui prévient notre serveur.
- On garde **notre propre journal des consentements** (preuve, version du bandeau, date), car la CNIL demande de pouvoir démontrer le consentement.
- On passe à **Axeptio** si l'on veut une console hébergée avec preuves et statistiques de consentement.
- **Didomi** si un promoteur l'impose.
- En **marque blanche**, les CMP payantes facturent par domaine, alors que tarteaucitron ne coûte rien de plus.

Rappels CNIL : « Tout refuser » doit être aussi simple que « Tout accepter ». Le choix, acceptation ou refus, est conservé pendant une durée raisonnable (6 mois recommandés dans la recommandation de 2020, non revérifié ici).

---

## 7. Architecture de mesure recommandée

### 7.1 Principes

1. **Trois étages, trois rôles, pas de doublon.**
   - **Umami** mesure l'**audience anonyme** du site public et l'entonnoir avant compte.
   - Le **journal d'événements** en base est la **source de vérité** de tout ce qui touche un compte ou de l'argent : inscription, plan lancé, plan prêt, achat, abonnement.
   - L'**envoi serveur** vers Meta et Google recopie une partie du journal, avec consentement.
2. **Pas d'identifiant personnel dans Umami.** Ni `identify()`, ni e-mail, ni identifiant de plan ou de lien partagé dans les URL.
3. **Rien de publicitaire sans consentement** : pas de cookie d'attribution, pas de gclid ou fbclid gardé, pas d'envoi à Meta ou Google.
4. **Côté serveur d'abord.** Pas de Pixel Meta ni de tag Google au lancement : CAPI et Data Manager API suffisent pour les conversions. On ajoutera le pixel ou gtag seulement si le remarketing ou l'optimisation sur des événements du haut de l'entonnoir le justifient.
5. **Les statistiques des utilisateurs connectés viennent du journal (SQL)** et non d'un traceur navigateur. Aucune lecture du terminal au-delà du cookie de session, qui est strictement nécessaire. Base légale RGPD : intérêt légitime ou exécution du contrat, avec information dans la politique de confidentialité.

### 7.2 Schéma

```
Navigateur (site public)                        Serveur (Python)                      Plateformes
------------------------                        ----------------                      -----------
script Umami (proxy sur notre domaine)
  before-send : si pas de consentement,
  retire la chaîne de requête (UTM, gclid,
  fbclid), réduit le référent à l'origine,
  remplace /v/<jeton> par /v/:jeton  ------->  Umami auto-hébergé (base Postgres dédiée)

bandeau tarteaucitron
  "Mesure publicitaire" accepté ?
   -> cookie propriétaire vp_attr (90 j)
      premier et dernier contact : UTM,
      gclid/gbraid/wbraid, fbc, référent,
      page d'arrivée
   -> POST /api/consentement  ------------->  table consentement (preuve)
   -> recorder.js Umami (relecture),
      seulement si accepté et échantillonné

inscription  ------------------------------>  compte créé
                                              + lecture de vp_attr -> table attribution
                                              + événement compte_cree -> journal
                                                        |
Stripe (webhook) -------------------------->  achat_credits / abonnement_demarre -> journal
travailleurs de génération ---------------->  plan_lance / plan_pret / plan_echec -> journal
                                                        |
                                              file envoi_publicitaire (si consentement)
                                                 |-> Meta CAPI (event_id = id journal)  -> Meta
                                                 '-> Data Manager API (transactionId =
                                                     id journal, consent)               -> Google Ads
```

**Configuration Umami « sans consentement »**, fonction passée à `data-before-send` (esquisse) :
- lire l'état de consentement posé par la CMP ;
- sans consentement :
  - `payload.url` = chemin sans chaîne de requête ;
  - `payload.referrer` = origine seule ;
  - les jetons de lien partagé sont remplacés par `:jeton`.
- avec consentement : l'URL complète est transmise, et les rapports UTM et Attribution se remplissent pour cette partie du trafic.
- dans tous les cas, **les jetons de visite ne sont jamais envoyés**. Ce sont des URL-capacités : quiconque lit le tableau de bord Umami pourrait sinon ouvrir les visites.

### 7.3 Plan de marquage

**Umami, côté navigateur, anonyme.** Noms de 50 caractères au plus, sans donnée personnelle.

| Événement Umami | Déclencheur | Propriétés |
|---|---|---|
| (page vue auto) | Chaque page publique | aucune |
| `cta-deposer-plan` | Clic sur « Déposer mon plan » | `cible` (particulier, conseiller, promoteur), `emplacement` |
| `depot-fichier-choisi` | Fichier sélectionné | `format` (pdf, image) |
| `depot-envoye` | Envoi du plan réussi | aucune |
| `inscription-ouverte` | Formulaire d'inscription affiché | `methode` (lien magique, Google) |
| `inscription-ok` | Page de confirmation (côté client, pour boucler l'entonnoir Umami) | `cible` |
| `paiement-ouvert` | Redirection vers Stripe Checkout | `offre` |
| `visite-demo-ouverte` | Visite de démonstration lancée | aucune |
| `contact-promoteur-envoye` | Formulaire promoteur envoyé | aucune |

Entonnoirs Umami :
- page d'accueil → `cta-deposer-plan` → `depot-envoye` → `inscription-ok` → `paiement-ouvert` ;
- la même chose par landing page ou par `cible`.

Goals : `inscription-ok` et `contact-promoteur-envoye`.

**Journal serveur**, source de vérité, et correspondances publicitaires :

| Événement du journal | Émis par | Meta (si consentement) | Google Ads (si consentement) |
|---|---|---|---|
| `compte_cree` | API d'inscription | `CompleteRegistration` | Action « Inscription » (secondaire) |
| `demande_demo_conseiller`, `contact_promoteur` | API formulaire | `Lead` | Action « Lead pro » (principale) |
| `plan_depose` | API de dépôt | aucun | aucune |
| `plan_lance` (avec `credit_offert` vrai ou faux) | File de génération | `StartTrial` si crédit offert | Action « Premier plan » (secondaire) |
| `plan_pret`, `plan_echec`, `plan_rembourse` | Travailleurs | aucun | aucune |
| `visite_ouverte` (propriétaire ou lien partagé) | Serveur de visite | aucun | aucune |
| `achat_credits` (montant HT, EUR, pack, identifiant Stripe) | Webhook Stripe | `Purchase` (`value`, `currency`) | Action « Achat » (principale, valeur, `transactionId`) |
| `abonnement_demarre`, `_renouvele`, `_resilie` | Webhook Stripe | `Subscribe` au démarrage | Action « Abonnement » (principale, valeur) |

### 7.4 Journal d'événements (esquisse de schéma)

```sql
create table evenement (
  id uuid primary key,                 -- réutilisé comme event_id Meta et transactionId Google
  type text not null,                  -- 'compte_cree', 'achat_credits', ...
  survenu_le timestamptz not null default now(),
  compte_id uuid, organisation_id uuid, plan_id uuid,
  montant_ht_centimes integer, devise char(3),
  proprietes jsonb not null default '{}',
  origine text not null                -- 'api', 'stripe', 'travailleur'
);

create table attribution (             -- une ligne par compte, écrite à l'inscription
  compte_id uuid primary key,
  premier_contact jsonb,               -- utm_*, référent (hôte), page d'arrivée, horodatage
  dernier_contact jsonb,
  gclid text, gbraid text, wbraid text, fbc text, fbp text,
  ids_clic_expirent_le timestamptz,    -- purge à 90 jours
  source_declaree text                 -- « Comment nous avez-vous connu ? », sans traceur
);

create table consentement (            -- preuve, en ajout seul
  id uuid primary key, compte_id uuid, reference_navigateur text,
  mesure_publicitaire boolean not null, version_bandeau text not null,
  choisi_le timestamptz not null, origine text   -- 'bandeau', 'parametres', 'retrait'
);

create table envoi_publicitaire (      -- file d'envoi idempotente
  evenement_id uuid references evenement(id),
  plateforme text check (plateforme in ('meta', 'google')),
  statut text not null default 'a_envoyer',  -- 'envoye', 'ignore_sans_consentement', 'erreur'
  tentatives integer not null default 0, derniere_erreur text, envoye_le timestamptz,
  primary key (evenement_id, plateforme)
);
```

Les indicateurs métier se calculent en SQL sur ce journal :
- taux inscription → premier plan → achat ;
- délai et coût IA par plan (déjà journalisés par la chaîne) ;
- rétention des conseillers ;
- revenu par canal déclaré ou attribué.

Metabase ou un tableau interne suffit.

### 7.5 Garder l'attribution jusqu'au compte

1. **À l'arrivée**, seulement si la finalité « mesure publicitaire » est acceptée :
   - on lit dans l'URL `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid` et `fbclid`, plus l'hôte du référent et la page d'arrivée ;
   - on construit `fbc = fb.1.<ms>.<fbclid>` sans toucher à la casse ([fbp-and-fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc)).
2. **Règles de contact** : un « contact » est une arrivée avec UTM, identifiant de clic ou référent externe.
   - Le **premier contact** n'est jamais écrasé.
   - Le **dernier contact** est remplacé à chaque nouveau contact, mais pas par une visite directe (logique du dernier clic non direct).
3. **Stockage** dans un cookie propriétaire `vp_attr` de 90 jours, `SameSite=Lax`, `Secure`. Si le consentement arrive après l'arrivée, on capte ce qui reste dans l'URL de la page courante. Au-delà, c'est perdu.
4. **À l'inscription**, le serveur lit `vp_attr`, écrit la ligne `attribution` et copie l'état du consentement sur le compte. Il demande aussi, facultativement, « Comment nous avez-vous connu ? » : c'est la seule attribution disponible pour les visiteurs qui refusent, et elle ne demande aucun traceur.
5. **Retrait du consentement** (lien « Gérer mes cookies » ou paramètres du compte) :
   - suppression de `vp_attr` ;
   - `consentement` mis à jour ;
   - identifiants de clic effacés en base ;
   - plus aucun envoi publicitaire.
6. **Durées de conservation** :
   - identifiants de clic : 90 jours, ce qui couvre la fenêtre Google (non revérifiée) et le cookie `_fbc` de Meta ;
   - source, support et campagne : aussi longtemps que le compte ;
   - données Umami : 25 mois.

### 7.6 Envoi serveur vers Meta et Google

- **Déclenchement** : à chaque insertion dans `evenement` d'un type mappé (§ 7.3), on crée une ligne dans `envoi_publicitaire` par plateforme. Si le compte n'a pas de consentement actif, la ligne est marquée `ignore_sans_consentement`, ce qui garde la trace de la décision.
- **Meta** :
  - envoi immédiat, puisque `event_time` ne peut pas remonter à plus de 7 jours ;
  - `event_id` = `evenement.id`, `action_source=website`, `event_source_url` ;
  - `user_data` : `em` haché, `external_id` haché à partir de `compte_id`, `fbc` s'il existe, `client_user_agent`, `client_ip_address` ;
  - pour un achat reçu par webhook Stripe, on n'a ni l'IP ni l'user-agent de l'acheteur : il faut les garder au moment de la création de la session Checkout ;
  - `custom_data` : `value` et `currency` pour `Purchase` et `Subscribe`.
- **Google** (Data Manager API) :
  - envoi par lots (toutes les heures, par exemple) ;
  - une action de conversion `UPLOAD_CLICKS` par type ;
  - `gclid`, `gbraid` ou `wbraid` et e-mail haché ;
  - `transactionId` = `evenement.id` ;
  - `consent` = `CONSENT_GRANTED` pour les deux signaux, puisqu'on n'envoie qu'aux comptes consentants ;
  - pas d'IP.
- **Fiabilité** : relances avec délai croissant, idempotence par la clé `(evenement_id, plateforme)`, alerte si le taux d'erreur dépasse un seuil. **Le secret des API (jeton Meta, identifiants Google Cloud) reste dans les variables d'environnement, jamais versionné.**
- **Pixel ou gtag plus tard** : sur la page de confirmation, on passe le même `evenement.id` au navigateur pour `fbq('track', 'Purchase', {...}, {eventID: id})`, et la déduplication Meta joue.

### 7.7 Cas particuliers du produit

- **Liens de visite envoyés par les conseillers** (« votre prospect a ouvert la visite »). Un lien par prospect est un **lien traçant**. Dans son questions-réponses du 22/07/2026, la CNIL rappelle que ces liens relèvent de l'article 82 et du RGPD, et ne sont exemptés que s'ils sont strictement nécessaires au service demandé ([CNIL, FAQ pixels](https://www.cnil.fr/fr/faq-recommandation-pixels-courriers-electroniques)). Prévenir le conseiller n'est pas nécessaire au service que demande le prospect.

  Proposition, à valider par un juriste :
  - le conseiller est responsable de traitement et nous sommes sous-traitant ;
  - la page de visite affiche une information claire ;
  - la notification nominative ne part que si le prospect clique sur un bouton explicite du type « Je suis intéressé, prévenir mon conseiller ». C'est aussi un meilleur signal de qualification qu'une simple ouverture ;
  - sans ce clic, le conseiller ne voit qu'un compteur agrégé par lien.
- **Visite intégrée chez un promoteur (iframe)** : l'éditeur de la page est le promoteur. Je propose :
  - pas d'Umami dans l'iframe ;
  - des compteurs agrégés côté serveur (chargements, lots vus), fournis au promoteur en tant que sous-traitant ;
  - l'émission d'événements `postMessage` (`visite:ouverte`, `visite:piece`) que le promoteur peut mesurer avec ses propres outils, sous sa propre CMP.
- **Marque blanche** : un site Umami par locataire si le client veut ses statistiques (partage par Boards ou liens de partage) ; la configuration de la CMP se fait par domaine.
- **Pixels dans les e-mails** (Umami Pixels, ou suivi d'ouverture d'un outil d'e-mailing) : ils sont soumis à la recommandation CNIL sur les pixels de 2026. Je conseille de ne pas les utiliser dans les e-mails transactionnels.

### 7.8 Ordre de mise en œuvre et charge

La charge est estimée et non mesurée, pour une personne.

| Phase | Contenu | Charge |
|---|---|---|
| 0 : testeurs (maintenant) | Umami auto-hébergé, proxy du script, `before-send` minimal, plan de marquage Umami ; journal `evenement` alimenté par l'API et les travailleurs ; question « Comment nous avez-vous connu ? » | 2 à 4 jours |
| 1 : lancement payant | Événements Stripe dans le journal ; tarteaucitron avec finalité publicitaire ; tables `consentement` et `attribution` ; cookie `vp_attr` ; lien d'opposition Umami ; purge à 25 mois ; analyse d'exemption rédigée | 3 à 5 jours |
| 2 : campagnes payantes | File `envoi_publicitaire` ; Meta CAPI ; Data Manager API (projet Google Cloud, actions de conversion) ; recette avec les outils de test des deux plateformes | 3 à 5 jours |
| 3 : si besoin | Pixel ou gtag en mode basique pour le remarketing ; relecture Umami sur échantillon consenti, ou PostHog UE pour les expériences et les drapeaux dans l'application | à décider |

---

## 8. « Tu en penses quoi ? » Mon avis sur Umami

**C'est un bon choix, à trois conditions.**

Ce qui plaide pour :
- l'outil est léger, sous licence MIT et **auto-hébergeable sur le Postgres qu'on aura de toute façon**, pour un coût marginal quasi nul ;
- les rapports couvrent exactement le besoin avant compte : entonnoir, parcours, objectifs, UTM et attribution pour le trafic consentant, rétention ;
- il a une API complète et un serveur MCP qui permet d'interroger les statistiques depuis Claude ;
- le développement est très actif en 2026, et la relecture et les cartes de chaleur sont arrivées sans changer d'outil.

Les trois conditions :
1. **L'auto-héberger dans l'UE**, et non Umami Cloud. Le DPA de Cloud autorise l'« amélioration des services », ses sous-traitants sont surtout américains et le choix de région n'est pas documenté. Cloud Hobby (gratuit, 100 000 événements, 1 site, 6 mois) peut servir quelques jours de prototype, pas davantage.
2. **Ne pas croire que « sans cookie » veut dire « sans bandeau ».** L'exemption CNIL tient à une configuration minimale : pas d'`identify()`, pas d'UTM ni d'identifiants de clic, pas de relecture sans consentement, purge à 25 mois, lien d'opposition. Il faut aussi rédiger une courte analyse sur les deux écarts restants (écran Sessions, absence d'arrondi). Si un jour l'on veut zéro discussion sur ce point, **Matomo en mode CNIL** est l'option documentée.
3. **Ne pas lui demander ce qu'il ne fait pas.**
   - Il n'envoie rien à Meta ou Google : c'est le serveur qui s'en charge.
   - Il ne mesure pas l'argent ni les comptes : c'est le journal, qui est la seule source de vérité.
   - Ce n'est pas un outil d'expérimentation : si les tests A/B et les drapeaux deviennent centraux dans l'application, **PostHog UE** sera plus adapté, avec consentement.

Ce que je déconseille : faire d'Umami la source des indicateurs business, appeler `identify()` avec l'e-mail, ou activer la relecture pour tout le monde sans consentement.

---

## 9. Non vérifié ou à valider

- Région d'hébergement d'Umami Cloud et possibilité de la choisir ; existence d'une auto-évaluation CNIL publiée par Umami ou Plausible (recherche web indisponible).
- Obligation de CMP certifiée Google pour un annonceur, et présence de tarteaucitron ou Cookiebot dans la liste Google (pages Google inaccessibles).
- Fenêtre de 90 jours pour l'import hors ligne Google Ads ; date de mars 2024 pour le Consent Mode v2 (source Didomi seulement).
- Prix exacts de Matomo Cloud (devise) et unités des paliers Axeptio.
- Classement de nos annonces en catégorie « Housing » chez Meta.
- Qualification juridique des liens de visite nominatifs et du rôle du conseiller : **à faire valider par un juriste ou un DPO** avant la mise en ligne de la fonction.
- Coût d'hébergement réel d'Umami (dépend de l'hébergeur retenu).

---

## Sources

**Umami**
- Tarifs : https://umami.is/pricing (données de la page lues dans son code le 27/09/2026)
- FAQ Cloud : https://docs.umami.is/docs/cloud/faq
- Confidentialité : https://umami.is/privacy
- DPA : https://umami.is/dpa
- Sous-traitants : https://umami.is/subprocessors
- Versions : https://github.com/umami-software/umami/releases
- Dépôt : https://github.com/umami-software/umami
- Documentation :
  - https://docs.umami.is/docs/track-events
  - https://docs.umami.is/docs/tracker-functions
  - https://docs.umami.is/docs/tracker-configuration
  - https://docs.umami.is/docs/event-data
  - https://docs.umami.is/docs/distinct-ids
  - https://docs.umami.is/docs/guides/identify-logged-in-users
  - https://docs.umami.is/docs/metric-definitions
  - https://docs.umami.is/docs/sessions
  - https://docs.umami.is/docs/replays
  - https://docs.umami.is/docs/heatmaps
  - https://docs.umami.is/docs/funnel
  - https://docs.umami.is/docs/journey
  - https://docs.umami.is/docs/retention
  - https://docs.umami.is/docs/goals
  - https://docs.umami.is/docs/utm
  - https://docs.umami.is/docs/attribution
  - https://docs.umami.is/docs/revenue
  - https://docs.umami.is/docs/breakdown
  - https://docs.umami.is/docs/insights
  - https://docs.umami.is/docs/segments
  - https://docs.umami.is/docs/cohorts
  - https://docs.umami.is/docs/links
  - https://docs.umami.is/docs/pixels
  - https://docs.umami.is/docs/integrations
  - https://docs.umami.is/docs/faq
  - https://docs.umami.is/docs/install
  - https://docs.umami.is/docs/environment-variables
  - https://docs.umami.is/docs/exclude-my-own-visits
  - https://docs.umami.is/docs/bypass-ad-blockers
  - https://docs.umami.is/docs/guides/send-server-side-events
  - https://docs.umami.is/docs/guides/setup-ab-testing
  - https://docs.umami.is/docs/api

**CNIL et CEPD**
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience (04/07/2025)
- https://www.cnil.fr/sites/default/files/2025-07/outil_d_auto-evaluation_mesure_d_audience.pdf
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ
- https://www.cnil.fr/fr/faq-recommandation-pixels-courriers-electroniques (22/07/2026)
- https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en

**Alternatives**
- Matomo : https://matomo.org/faq/how-to/how-do-i-configure-matomo-without-tracking-consent-for-french-visitors-cnil-exemption/ et https://matomo.org/pricing/
- PostHog :
  - https://posthog.com/pricing
  - https://billing.posthog.com/api/products-v2
  - https://posthog.com/docs/cdp/destinations/meta-ads
  - https://posthog.com/tutorials/cookieless-tracking
- Plausible : https://plausible.io/#pricing

**Meta**
- https://developers.facebook.com/docs/meta-pixel/reference
- https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event
- https://developers.facebook.com/docs/meta-pixel/implementation/gdpr
- https://developers.facebook.com/docs/marketing-api/audiences/special-ad-category

**Google**
- https://developers.google.com/google-ads/api/docs/conversions/upload-offline
- https://developers.google.com/data-manager/api
- https://developers.google.com/data-manager/api/devguides/events
- https://developers.google.com/data-manager/api/devguides/events/google-ads/offline/send-events
- https://developers.google.com/data-manager/api/reference/rest/v1/Consent
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent

**CMP**
- https://tarteaucitron.io/fr/
- https://www.axept.io/fr/tarifs
- https://www.didomi.io/offers
- https://www.didomi.io/regulations/google-consent-mode-v2
- https://www.cookiebot.com/fr/pricing/
