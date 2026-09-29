# Plan de marquage et de mesure

Version du 27/09/2026. **Proposition à valider par l'utilisateur.**

**Alignement du 27/09/2026.** Ce document suit les décisions de l'utilisateur (D1 à D10, puis D11 à D15 du 27/09/2026 : plusieurs niveaux, fluidité, qualité adaptative, précalcul côté serveur, mode 360°) et les arbitrages du coordinateur (R1 à R24), qui priment sur lui. Pour ne pas les confondre avec les scénarios de recette R1 à R17 (§ 7.5), ils sont toujours écrits ici « arbitrage Rn ». Quand deux documents divergent, l'ordre est : décisions de l'utilisateur, arbitrages, `OFFRES.md` (offres, crédits), `ARCHITECTURE.md` (technique), `MESSAGES.md` (textes), `PARCOURS.md`, puis ce document, qui ne fait foi que pour le dictionnaire d'événements. Points les plus touchés :
- D5 et arbitrage R2 : l'aperçu est publié dès que la vue du dessus et le plan 2D sont prêts (`apercu_pret`), les 2 photos s'ajoutent ensuite (`photos_pretes`), une photo en échec est omise sans rien bloquer ;
- D9 : Umami auto-hébergé dans l'UE ; Meta, Google et le paiement viennent plus tard ;
- arbitrage R8 : les prix se testent seulement par périodes ;
- arbitrage R9 : les adresses de la vitrine sont celles de `MESSAGES.md` ;
- arbitrage R18 : aucun bandeau tant qu'Umami reste en réglage minimal exempté ;
- D12 et D13 : visite fluide sur un appareil modeste, qualité adaptative : mesure de la fluidité proposée (§ 3.5, § 5.6), à décider ;
- D15 : mode 360° à chaque arrêt, peut-être offre gratuite, à confirmer (§ 3.2, § 3.8, § 3.9, § 5.5) ;
- D11 : plans à plusieurs niveaux gérés (L13-08, fait) ; l'utilisateur a confirmé le 27/09/2026 : « oui le duplex on l'a géré c'est bon, c'était avant ça ». En service, `niveaux_max = 2` : duplex acceptés, refus au-delà (L4-08) (§ 3.2, § 3.6).

**Objet.** Mesurer tout ce qui sert à décider : conversions, entonnoirs, coûts, qualité. Chaque mesure est placée là où elle est fiable et permise :
- Umami pour l'audience anonyme ;
- notre journal d'événements pour tout ce qui touche un compte ou de l'argent ;
- plus tard, des envois serveur vers Meta et Google, pour les seules personnes qui ont accepté.

**Sources.**
- Recherches, dont les faits externes ne sont pas répétés ici :
  - `produit/recherche/suivi.md` (Umami, CNIL, Meta, Google, bandeaux) ;
  - `juridique.md` § 3, `auth-paiement.md` § 3.5, `hebergement.md` § 7 et § 10, `audit-code.md`, `marche.md`.
- Documents produit :
  - `produit/OFFRES.md` : offres, seuils de décision, tests T0 à T13 ;
  - `produit/ARCHITECTURE.md` : services, tables, jetons ;
  - `produit/MARQUE.md` : ton, règles du bandeau ;
  - `produit/MESSAGES.md` : clés des textes, e-mails E1 à E15, adresses des pages ;
  - `produit/PARCOURS.md` : écrans, événements « à ajouter » de son § 8.1 ;
  - les tickets `tickets/<lot>/`, dont les sections « Mesure » citent ce dictionnaire ;
  - `CLAUDE.md`.

**Nom.** « Sur Pièce » est un nom provisoire.
- Aucun nom d'événement, de propriété, de cookie ni de chemin ne le contient. Le domaine est noté `<domaine>`.
- Le changer ne touche que le libellé du site dans Umami et le domaine.
- Il est écrit sous cette seule forme, jamais précédé de « de », « du » ou « le » (`MARQUE.md` § 1.1).

**Données d'usage.** Il n'en existe aucune à ce jour. Les objectifs chiffrés de ce document sont donc de deux sortes :
- des **seuils de décision** déjà posés dans `OFFRES.md` ;
- des valeurs marquées **« à établir »**.

Aucun repère extérieur n'est cité, faute de source.

---

## 0. En bref

- **Umami : oui, auto-hébergé dans l'UE** (décision D9), pour l'audience anonyme de la vitrine, de la démonstration et des écrans de l'application. C'est un service de plus du Docker Compose (D2).
  - **Réglage minimal, sans consentement :**
    - ni identification, ni UTM, ni identifiant de clic, ni relecture ;
    - chemins réduits à des gabarits ;
    - purge à 25 mois et lien d'opposition.
  - **Réglage enrichi, après consentement** : UTM, et relecture sur un échantillon de la vitrine. Il n'existe qu'avec le bandeau (§ 6.0).
  - Il ne mesure ni l'argent ni les comptes, et n'envoie rien à Meta ni à Google.
- **La source de vérité est le journal `evenements`**, dans notre Postgres. Le serveur l'écrit dans la même transaction que le fait qu'il décrit : mouvement du grand livre, publication, webhook Stripe.
- **L'attribution est gardée seulement après consentement**, donc pas avant l'arrivée du bandeau.
  - Données : UTM, gclid, gbraid, wbraid, fbclid transformé en fbc, référent, page d'arrivée, en premier et dernier contact.
  - Elle est conservée 90 jours dans un cookie propriétaire, puis recopiée sur le compte à l'inscription.
  - La question « Comment nous avez-vous connu ? » couvre tout le monde, sans traceur.
- **Envois vers Meta (CAPI) et Google (Data Manager API), en phase 3** (tickets L12-01 et L12-02, qui construisent la file `envois_publicitaires`).
  - Ils partent du serveur.
  - `event_id` est l'identifiant de la ligne du journal, ce qui permet la déduplication.
  - Le consentement est vérifié et joint à chaque événement.
- **Jamais dans Umami** : jeton de lien, identifiant de plan ou de compte, e-mail, nom, SIREN, titre de plan, texte libre. Un test automatique inspecte chaque envoi.
- **Aucun script de mesure** sur les liens de visite partagés, les liens prospects ni les intégrations chez les promoteurs. Seuls des compteurs agrégés côté serveur y fonctionnent, plus le détail pour un prospect qui l'accepte.
- **Nommage** : français sans accent, `objet_action`, 50 caractères au plus. Vérifié par script sur tous les noms du § 3 (§ 3.1).
- **Dictionnaire** de 143 événements nommés au § 3 (plus la page vue d'Umami), chacun avec son scénario de recette.
- **Génération en deux temps** (D5, arbitrage R2) : `controle_termine`, puis `apercu_pret` (aperçu publié : vue du dessus et plan 2D) ou `plan_pret` (visite publiée), puis `photos_pretes` (photos publiées ou omises). Avec le mode 360° en service (L5-27) : `panoramas_prets` (panoramas publiés ou omis).
- **Tests** (arbitrage R8) : les prix, seulement par périodes successives, jamais tirés au sort par personne ; les textes, par périodes pour les anonymes, ou par tirage côté serveur pour les comptes connectés, noté au journal et jamais dans Umami (§ 4.8).
- **Entonnoirs** au § 4 : particulier, conseiller, promoteur, partenaires, liste d'attente de la bêta.
- **Tableaux de bord** au § 5 : acquisition, activation, revenu, coûts IA et marge par offre, qualité.
- **Bandeau** (arbitrage R18) : **aucun tant qu'Umami reste en réglage minimal exempté**. Il arrive dès qu'un traceur non exempté est activé : UTM dans Umami, relecture, publicité. Outil prévu : tarteaucitron.js, gratuit et hébergé chez nous, où « Refuser » est aussi simple qu'« Accepter ». Décision à confirmer en L0-05.
- **Trois phases** (§ 7) :
  1. bases posées avec la vitrine (L2-14) et le socle (L5-15) : attributs `data-umami-event` et journal. Les attributs restent inertes tant qu'Umami n'est pas branché ;
  2. lancement de la mesure (lot 7) ;
  3. campagnes Meta et Google (lot 12).

---

## 1. Umami : avis et alternatives

### 1.1 Avis

**C'est un bon choix, auto-hébergé dans l'UE, à trois conditions.**

Ce qui plaide pour :
- **Coût.** Licence MIT. Il s'auto-héberge sur le Postgres de l'application, dans une base séparée. Il ajoute un service au Docker Compose (décision D2, `ARCHITECTURE.md` § 2.1, ticket L7-01), déployable partout.
- **Couverture du besoin d'avant compte** (`suivi.md` § 1.1) :
  - entonnoirs (Funnel, avec une fenêtre en minutes entre deux étapes) ;
  - parcours (Journey) et objectifs (Goals) ;
  - rétention ;
  - UTM et attribution pour le trafic consentant ;
  - tableaux composables (Boards).
- **Accès aux chiffres.** API complète, clés d'API et serveur MCP depuis la v3.4.0 (17/09/2026). On interroge les chiffres sans exporter de données.
- **Développement actif en 2026.** Relecture de session (v3.1.0) et cartes de chaleur (v3.2.0), sans changer d'outil.

Les trois conditions :
1. **L'auto-héberger, et non passer par Umami Cloud.** Le DPA de Cloud autorise l'« improve the Services », ses sous-traitants sont surtout américains, et le choix de la région n'est pas documenté (`suivi.md` § 1.3).
2. **Ne pas confondre « sans cookie » et « sans bandeau ».** L'article 82 vise aussi l'empreinte du terminal (`suivi.md` § 2.1). L'exemption tient à deux choses :
   - le réglage minimal du § 1.2 ;
   - une analyse écrite des deux écarts qui restent (§ 1.3).
3. **Ne pas lui demander ce qu'il ne fait pas** (§ 1.4).

### 1.2 Deux réglages

| | Minimal, sans consentement (exempté si les conditions CNIL sont tenues) | Enrichi, après accord pour la « mesure enrichie » |
|---|---|---|
| Pages vues, événements du dictionnaire | oui | oui |
| Chemin | gabarit (`/v/:jeton`, `/plans/:id`), sans chaîne de requête ni ancre | gabarit, plus les 5 paramètres UTM |
| Référent | origine seule, par exemple `https://www.google.com` | origine seule |
| Identifiants de clic (gclid, gbraid, wbraid, fbclid, msclkid…) | retirés | **retirés aussi** : ils vont au cookie d'attribution (§ 2.9), pas dans Umami |
| Titre de page | vitrine : titre réel ; application et visite : type de page | idem |
| Identification (`umami.identify`, `data-distinct-id`) | jamais | **jamais** : les comptes se mesurent dans le journal |
| Relecture et cartes de chaleur (`recorder.js`) | non chargé | vitrine seulement : échantillon (0,15 par défaut dans Umami), masquage « strict », 5 min au plus, conservation de 30 jours. Jamais sur `app.` ni sur `visite.`, dont les pages montrent des plans |
| Étiquette de test (`data-tag`), variante d'un test | non | non : les tests de prix se font seulement par périodes successives, notées en annotations (`OFFRES.md` § 9.1, arbitrage R8). Les variantes tirées côté serveur pour les comptes connectés sont notées au journal, jamais dans Umami (§ 4.8) |
| Do Not Track, Global Privacy Control, lien d'opposition | respectés | respectés |

Le réglage minimal se limite aux trois types d'événements admis par l'outil d'auto-évaluation de la CNIL (`suivi.md` § 2.2) :
- la présence sur une page ;
- l'usage d'une fonction (clic) ;
- les temps de chargement, de défilement ou de lecture.

### 1.3 Écarts à documenter (analyse d'exemption)

Umami auto-hébergé coche la plupart des critères de la CNIL (`suivi.md` § 2.3). Deux écarts restent.

| Écart | Parade |
|---|---|
| L'**écran Sessions** montre la navigation d'un visiteur anonyme. Aucun réglage ne le masque | Deux comptes nominatifs sur Umami, pas de lien de partage public. Règle écrite : ne jamais s'en servir pour suivre une personne. Aucune exportation brute, aucun rapprochement avec le journal (§ 2.3) |
| **Pas d'arrondi à la dizaine** dans les rapports | Tout chiffre d'Umami remis à un tiers (client de marque blanche, promoteur, présentation) est arrondi à la dizaine |

- L'analyse tient sur une page. Elle est rangée avec le registre des traitements.
- Si l'on veut un jour ne plus avoir à discuter ce point : Matomo en mode CNIL (§ 1.5).

### 1.4 Ce qu'Umami ne fait pas, et ce qui le fait chez nous

| Besoin | Umami | Chez nous |
|---|---|---|
| Comptes, plans, argent, abonnements | non. Il ne doit pas le faire : l'identification est interdite | journal `evenements`, grand livre, Stripe (§ 2.8) |
| Envoi des conversions à Meta et Google | aucune intégration publicitaire | file `envois_publicitaires` côté serveur (§ 2.11, tickets L12-01 et L12-02) |
| Test A/B avec statistiques, drapeaux de fonctionnalité | étiquettes seulement | périodes successives pour les prix et les visiteurs anonymes ; tirage côté serveur pour les textes vus par des comptes connectés, noté au journal (arbitrage R8, L12-05) ; PostHog UE si le besoin vient (§ 1.5) |
| Reconnaître un visiteur anonyme au-delà d'un mois | non, à cause du sel mensuel | sans objet, volontairement |
| Relier une session anonyme à un compte | seulement par `identify()` | interdit. Le lien passe par l'attribution consentie et la source déclarée |
| Coûts IA, durées, échecs | non | tables `appels_ia`, `travaux`, `etapes` (`ARCHITECTURE.md` § 4.2) |
| Chiffres exacts | non : les bloqueurs, DNT, GPC et l'opposition font perdre des visites | le journal est exact ; Umami donne des minorants |
| Erreurs techniques | non | Sentry, région UE (`hebergement.md` § 7) |

### 1.5 Alternatives

| | Umami auto-hébergé | Matomo en mode CNIL | PostHog Cloud UE |
|---|---|---|---|
| Sans consentement en France | oui, avec le réglage minimal et l'analyse des 2 écarts | **oui, avec une configuration documentée**, calée sur l'outil CNIL de juillet 2025 : masque IP de 2 octets, User ID coupé, relecture et UTM coupés, conservation de 759 jours | seulement en mode sans cookie, où `identify()` ne marche plus. Ses points forts demandent le consentement |
| Point fort | léger, entonnoirs, API et MCP | défendable sans discussion | produit connecté : personnes, relectures, expériences, drapeaux, envoi vers Meta |
| Point faible | 2 écarts à documenter | plus lourd ; entonnoirs, relecture et A/B en extensions payantes | société américaine (données à Francfort) ; payant à l'usage au-delà du gratuit |
| Quand l'adopter | choix par défaut | si un client (promoteur, marque blanche) exige un outil documenté CNIL, ou après une remarque de la CNIL | si les expériences et les drapeaux deviennent centraux dans l'application, avec consentement |

- **Plausible** fait moins qu'Umami pour nos entonnoirs : ses Funnels sont réservés à l'offre Business.
- **La destination Meta de PostHog** ne dispense ni du consentement ni de l'identification des personnes. Notre propre envoi serveur (§ 2.11) garde le consentement et la source de vérité dans notre base.

Sources : `suivi.md` § 2.4 et § 3.

---

## 2. Architecture de mesure

### 2.1 Une source par rôle

| Source | Rôle | Qui écrit | Personnes |
|---|---|---|---|
| **Umami** (`m.<domaine>`) | Audience anonyme de la vitrine, de la démonstration et des écrans de l'application ; entonnoir d'avant compte | Script dans la page | Aucune identité |
| **Journal `evenements`** | Source de vérité : comptes, plans, crédits, paiements, abonnements, pros, promoteurs | API, workers, webhooks Stripe, administration | `compte_id` et `organisation_id` en colonnes ; propriétés sans donnée personnelle |
| **Compteurs agrégés** (`vues_visite`, `clics_pages_partagees`) | Ouvertures des liens partagés, des liens prospects et des intégrations ; clics sur les pages de destinataire | Serveur de visite | Aucun visiteur identifié |
| **Tables métier** (`credit_mouvements`, `achats`, `abonnements`, `appels_ia`, `travaux`, `etapes`) | Montants, coûts IA, durées, états | Chaîne et grand livre | Par organisation |
| **`attribution` et `consentements`** | Provenance du compte ; preuve des choix | Serveur, à l'inscription et à chaque choix | Par compte, ou par référence de navigateur |
| **File `envois_publicitaires`** | Recopie consentie vers Meta et Google (phase 3, construite par les tickets L12-01 et L12-02) | Tâche qui suit la validation de la transaction | E-mail haché, identifiant de clic |

Sentry reçoit les erreurs techniques. Il est hors du périmètre de la mesure.

### 2.2 Schéma

```
 NAVIGATEUR                                   SERVEUR (FastAPI, workers)                  EXTÉRIEUR
 ──────────                                   ──────────────────────────                  ─────────
 <domaine>, app.<domaine>
   mesure() et data-umami-event
   filtre avantEnvoi : gabarits, pas de
   requête (UTM seulement si « enrichie ») ──► Umami (m.<domaine>, base Postgres séparée,
                                                 purge 25 mois, aucun lien avec le journal)

   bandeau (dès le 1er traceur non exempté, arbitrage R18)
   tarteaucitron ── chaque choix ────────────► /api/consentement ──► consentements (preuve)
     « publicité » acceptée :
     cookie attr, 90 j : UTM, gclid, gbraid,
     wbraid, fbclid → fbc, référent, arrivée,
     premier et dernier contact
                                               inscription ──► attribution (copie de attr)
   dépôt, inscription, achat ──────────────►  API ────────┐
   Stripe (webhooks) ──────────────────────►  ────────────┼──► evenements (même transaction
   workers (lecture, contrôle, photos) ────►  ────────────┘     que le grand livre ou la publication)
                                                                   │ type qui porte une conversion
 visite.<domaine>                                                  ▼
   /v/, /a/, /i/ <jeton> : AUCUN script        vues_visite    envois_publicitaires ── consentement ?
     +1 par lien et par jour ──────────────►   (agrégé)           ├ oui ─► Meta CAPI (event_id)
     prospect qui accepte : durée, pièces ──►  vues_visite_detail ├ oui ─► Data Manager API (Google)
     intégration : postMessage au parent                          └ non ─► « ignore_sans_consentement »
   démonstration et vue propriétaire :
     Umami, anonyme
```

### 2.3 Règles de séparation

1. **Umami et le journal ne sont jamais rapprochés** : ni export, ni jointure, ni recoupement par l'horodatage. C'est une condition de l'exemption (« aucun recoupement »).
2. **Rien de publicitaire sans consentement** : ni cookie d'attribution, ni identifiant de clic gardé, ni envoi.
3. **Ni pixel Meta ni balise Google au lancement.** On ne les ajoutera que si le remarketing le justifie (phase 3b), en mode basique.
4. **Les pages de visite partagées ne chargent aucun script de mesure.** Ce qui s'y passe est compté côté serveur, de façon agrégée. Seule exception : le détail des prospects qui l'acceptent.
5. **La mesure ne casse jamais une page ni une transaction.**
   - `mesure()` avale ses propres erreurs.
   - En production, une propriété invalide est retirée et signalée à Sentry ; l'événement est quand même écrit.
   - En test, la même erreur fait échouer la suite.

### 2.4 Où va chaque donnée

| Donnée | Umami | Journal | Attribution | Meta, Google (phase 3) |
|---|---|---|---|---|
| E-mail | jamais | jamais | non | haché en SHA-256, si consentement |
| Identifiant de compte | jamais | colonne `compte_id` | clé | haché (`external_id` Meta), si consentement |
| Identifiant de plan, de partage | jamais | colonnes | non | jamais |
| Jeton de lien de visite | **jamais** (remplacé par `:jeton`) | **jamais** (seul `partage_id` interne) | non | jamais |
| UTM | si mesure enrichie acceptée | non | si publicité acceptée | non (canal agrégé seulement) |
| gclid, gbraid, wbraid | jamais | non | si publicité acceptée, 90 jours | Google |
| fbclid et fbc, fbp (phase 3b) | jamais | non | si publicité acceptée, 90 jours | Meta |
| Adresse IP | utilisée pour le pays puis jetée par Umami | non | non | Meta seulement, gardée 7 jours ; jamais Google (pas de correspondance par IP dans l'EEE) |
| Navigateur (user agent) | type d'appareil déduit | non | non | Meta, gardé 7 jours |
| Montants | jamais | oui | non | valeur HT |
| Titre, adresse, programme, lot, nom sur le cartouche | **jamais** | **jamais** | non | jamais |
| Texte libre saisi | jamais | jamais | détail de « Autre », 200 caractères au plus | jamais |

### 2.5 Umami : installation et filtre avant envoi

**Installation** (phase 2, ou dès que la vitrine est en ligne) :
- **Version.** Image `postgresql` d'Umami, version figée (v3.4.x le 27/09/2026), mise à jour chaque mois.
- **Base.** Une base `umami` séparée sur le Postgres de l'application, avec un utilisateur qui n'a aucun droit sur la base de l'application.
- **Service.** Un conteneur de plus dans le Docker Compose (D2) ; aucun composant propre à un hébergeur (arbitrage R3).
- **Variables d'environnement** (`suivi.md` § 1.4) :
  - `DISABLE_TELEMETRY=1` et `PRIVATE_MODE=1` ;
  - `CLIENT_IP_HEADER` : l'en-tête posé par Caddy, sinon tous les visiteurs partagent la même IP ;
  - `SALT_ROTATION` : mensuel ;
  - MCP laissé désactivé.
- **Sous-domaine propriétaire `m.<domaine>`.**
  - Il est servi par Caddy.
  - Le script et le point de collecte portent des noms neutres (`TRACKER_SCRIPT_NAME`, `COLLECT_API_ENDPOINT`), ni `umami` ni `analytics`.
  - Cela évite les pertes dues aux listes de blocage génériques.
  - En revanche, on ne contourne jamais une opposition exprimée : DNT, GPC et opposition sont respectés.
- **Sites dans Umami :**
  - `production` : vitrine, `app.<domaine>`, démonstration et vue propriétaire ;
  - `recette` : préproduction ;
  - un site par client de marque blanche qui le demande.
- **Purge mensuelle** des données de plus de 25 mois. Les noms des tables sont à relever sur la version installée.
- **Lien « Ne pas être mesuré »** dans la politique de confidentialité.
  - Il pose un cookie `opposition_mesure=1` sur `.<domaine>`, valable 13 mois.
  - Ce cookie est lu par le filtre sur tous les sous-domaines, alors que la clé `umami.disabled` du `localStorage` ne vaut que pour une origine.

**Balise** (identique sur toutes les pages qui ont Umami) :

```html
<script>/* avantEnvoi, DICO_MESURE, filtrerProprietes : chargés AVANT le script Umami */</script>
<script defer src="https://m.<domaine>/m.js"
        data-website-id="…"
        data-domains="<domaine>,app.<domaine>,visite.<domaine>"
        data-exclude-hash="true"
        data-do-not-track="true"
        data-before-send="avantEnvoi"></script>
```

On ne met pas `data-exclude-search="true"` : il retirerait aussi les UTM consentis. C'est le filtre qui s'en charge.

**Filtre avant envoi** (esquisse). La forme exacte de `url` et de `type` est à vérifier sur la version installée.

```js
// Défini avant le script Umami. Aucune dépendance, aucun appel réseau.
(function () {
  var VITRINE = '<domaine>';
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var GABARITS = [                                  // chemins qui portent un identifiant
    [/\/v\/[^/?#]+/, '/v/:jeton'], [/\/a\/[^/?#]+/, '/a/:jeton'], [/\/i\/[^/?#]+/, '/i/:jeton'],
    [/\/plans\/[^/?#]+/, '/plans/:id'], [/\/programmes\/[^/?#]+/, '/programmes/:id'],
    [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id']
  ];
  function oppose() {
    return navigator.globalPrivacyControl === true
      || /(?:^|; )opposition_mesure=1/.test(document.cookie);
  }
  window.avantEnvoi = function (type, p) {
    if (type !== 'event' || oppose()) return false;            // identify() : jamais
    if (p.name && !window.DICO_MESURE[p.name]) return false;   // hors dictionnaire : rien
    var u = new URL(p.url, location.origin), q = new URLSearchParams();
    GABARITS.forEach(function (g) { u.pathname = u.pathname.replace(g[0], g[1]); });
    if (window.choixTraceurs && window.choixTraceurs.mesure_enrichie === true)
      UTM.forEach(function (k) { var v = u.searchParams.get(k); if (v) q.set(k, v.slice(0, 100)); });
    p.url = (/^https?:/.test(p.url) ? u.origin : '') + u.pathname + (q.toString() ? '?' + q : '');
    try { p.referrer = p.referrer ? new URL(p.referrer).origin : ''; } catch (e) { p.referrer = ''; }
    if (location.hostname !== VITRINE) p.title = document.body.dataset.page || 'application';
    if (p.data) p.data = window.filtrerProprietes(p.name, p.data);  // propriétés et valeurs prévues
    return p;
  };
})();
```

**Fonctions communes** : un seul point d'appel, qui ne casse jamais la page.

```js
window.mesure = function (nom, props) {
  try {
    if (window.umami) window.umami.track(nom, Object.assign({ page_type: document.body.dataset.page }, props));
  } catch (e) {}
};
window.mesureUneFois = function (cle, nom, props) {   // « une fois par page vue »
  var vu = (window.__mesures = window.__mesures || {});
  if (!vu[cle]) { vu[cle] = 1; window.mesure(nom, props); }
};
```

**Attributs HTML, posés dès le lot 1 du site.** Ils ne font rien tant que le script Umami n'est pas chargé.

```html
<body data-page="accueil">
  <a class="btn primary" href="#depot"
     data-umami-event="cta_depot_clique"
     data-umami-event-emplacement="hero"
     data-umami-event-page_type="accueil">Importer mon plan</a>
  <section data-section="preuves">…</section>
  <details data-question="plans_pris_en_charge">…</details>
</body>
```

**Règle d'usage des attributs.** Selon la documentation d'Umami relevée dans `suivi.md` § 1.1, sur un élément marqué par `data-umami-event`, les autres écouteurs ne sont pas déclenchés. Donc :
- `data-umami-event` seulement sur les liens et les boutons sans comportement JavaScript propre ;
- `mesure()` partout ailleurs : zone de dépôt, onglets, volet, FAQ, sections, défilement.

Ce point est à vérifier en recette (R1).

### 2.6 Pages avec et sans Umami

| Hôte et pages | Umami | Autre mesure |
|---|---|---|
| `<domaine>` : `/` (accueil), `/guides/…`, `/tarifs`, `/methode`, questions fréquentes, `/pro`, `/promoteurs`, `/marque-blanche`, `/appartement-temoin`, `/offert`, `/pro/decouvrir`, liste d'attente de la bêta | oui | — |
| `app.<domaine>` : dépôt, inscription, attente, aperçu (`/plans/:id/apercu`), confirmation de paiement, compte, espace pro, espace programme | oui, anonyme. Titre remplacé par le type de page, chemins en gabarit | journal |
| `visite.<domaine>`, vue propriétaire | oui : le serveur n'insère le script que pour cette vue | `visite_ouverte` au journal |
| `visite.<domaine>/v/<jeton>` : liens privés et liens prospects | **non** | compteur agrégé ; détail seulement si le prospect l'accepte |
| `visite.<domaine>/a/<jeton>` : liens d'aperçu montrés aux proches (`ARCHITECTURE.md` § 2.4) | **non** | compteur agrégé |
| `visite.<domaine>/i/<jeton>` : intégrations | **non** | compteur agrégé ; `postMessage` au site du promoteur |
| E-mails | **aucun pixel, aucun lien traçant** | `email_envoye` au journal |
| Domaines de marque blanche | site Umami propre au client, s'il le demande | journal (colonne `instance`) |

**Adresses canoniques (arbitrage R9).** Les adresses de la vitrine sont celles de `MESSAGES.md` : `/`, `/pro`, `/promoteurs`, `/marque-blanche`, `/tarifs`, `/appartement-temoin`, `/methode`, `/guides/<sujet>` (`MESSAGES.md` § 11). Les anciennes adresses de ce document, `/demo` et `/partenaires`, ne sont plus utilisées. Les valeurs de `page_type` restent inchangées : `demo` désigne `/appartement-temoin` et `partenaires` désigne `/marque-blanche`. `/offert` et `/pro/decouvrir` sont les pages d'arrivée du bouche-à-oreille, créées par L6-08.

**Écart assumé avec `suivi.md` § 7.1 (principe 5).** Umami est chargé sur les écrans de l'application.
- **Pourquoi** : les clics sur le verrou, le volet et les onglets n'atteignent pas le serveur. Or ce sont eux que les tests T4 et T5 mesurent (`OFFRES.md` § 9.2).
- **Ce qui garde l'exemption** : l'usage reste anonyme (usage d'une fonction), sans `identify()`, sans identifiant dans l'URL ni dans le titre, et sans rapprochement avec le journal.
- **À vérifier en recette (R1)** : la session anonyme continue-t-elle de `<domaine>` à `app.<domaine>` ? Le hachage documenté ne contient pas le nom d'hôte (`suivi.md` § 1.2). Sinon, l'entonnoir Umami se coupe au dépôt et le journal prend le relais.

**Pages d'arrivée dédiées.** Les pages de destinataire ne transmettent aucun référent (`Referrer-Policy: no-referrer`). Leurs liens mènent donc à des pages génériques, identiques pour tous et sans jeton :
- `/offert` pour un particulier ;
- `/pro/decouvrir` pour un pro.

Umami voit ainsi le bouche-à-oreille sans identifiant de campagne.

### 2.7 Le moteur émet, la page choisit la destination

La même visite sert à la démonstration, au propriétaire, aux liens et aux intégrations. Le moteur ne doit donc rien savoir des outils de mesure. Le changement se fait dans `moteur/` et **n'est pas fait ici** (L7-04), sur le commit qui intègre le travail sur les niveaux (fini le 27/09/2026, non commité).

- **Côté moteur** : il émet un seul type d'événement, `window.dispatchEvent(new CustomEvent('visite:evenement', { detail: { nom, props } }))`. Les noms sont ceux du § 3.5, par exemple `visite_mode_choisi` ou `visite_piece_vue`.
- **Côté page** (`index.html` de la visite, rendu par le serveur), un adaptateur choisit la destination :

| Contexte | Destination |
|---|---|
| démonstration, vue propriétaire | `mesure()`, donc Umami anonyme |
| intégration chez un promoteur | `parent.postMessage` vers l'origine déclarée : `visite:ouverte`, `visite:piece` (§ 3.16) |
| lien prospect, si le prospect a accepté le suivi détaillé | envoi discret à `/v/<jeton>/detail`, écrit dans `vues_visite_detail` |
| tout autre lien | rien |

### 2.8 Journal d'événements

La table est celle d'`ARCHITECTURE.md` § 4.2 (`evenements`), avec cinq colonnes à ajouter :

| Colonne | Rôle |
|---|---|
| `cle_idempotence text unique` | Identifiant de l'événement Stripe, ou identifiant du travail et type. Un webhook reçu deux fois n'écrit qu'une ligne |
| `partage_id uuid` | Événements des liens (intérêt d'un prospect, révocation) |
| `cible text` | `particulier`, `conseiller`, `promoteur`, `partenaire`, déduite de l'organisation |
| `instance text` | `principale`, ou le client de marque blanche |
| `recu_le timestamptz` | Heure d'écriture. `survenu_le` garde l'heure du fait, par exemple `created` de Stripe |

Règles d'écriture :
1. **Un seul point d'entrée**, `journal.ecrire(type, …)`.
   - Il vérifie le type, les propriétés et leurs valeurs contre le dictionnaire (§ 3.2), qui est tenu en code dans un fichier unique, par exemple `mesure/evenements.json`.
   - Le navigateur et le serveur lisent le même fichier.
2. **Même transaction que le fait.** Pas d'événement sans fait, pas de fait sans événement. Exemples : `apercu_pret` ou `plan_pret` avec la ligne `publications` et le mouvement `consommation` ; `achat_paye` avec le lot de crédits.
3. **Propriétés sans donnée personnelle.** Pas d'e-mail, de nom, de téléphone, d'IP, d'adresse, de titre de plan ni de texte libre. Seulement des valeurs énumérées, des nombres et des classes. Le rattachement à une personne passe uniquement par les colonnes d'identifiants.
4. **Suppression d'un compte.** `compte_id`, `organisation_id`, `plan_id` et `partage_id` passent à `null`. Les statistiques restent, anonymes.
5. **Opposition au suivi d'usage** (intérêt légitime). L'indicateur `exclu_statistiques` sur le compte retire ses lignes des vues des tableaux de bord. Le grand livre n'est pas touché.
6. **Pas de doublon avec les tables métier.** Les durées par étape et les coûts par appel restent dans `etapes` et `appels_ia`. Le journal garde les jalons.

### 2.9 Attribution

**Captation, seulement si la finalité « publicité » est acceptée** (`suivi.md` § 7.5). Tant qu'aucun bandeau n'est en place (arbitrage R18), rien n'est capté : seule la source déclarée (§ 2.10) renseigne la provenance.
- À l'arrivée, ou au moment où l'accord est donné sur la page courante, on lit dans l'URL :
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` ;
  - `gclid`, `gbraid`, `wbraid`, `fbclid` ;
  - plus l'hôte du référent et le chemin d'arrivée, en gabarit.
- On construit `fbc = fb.1.<horodatage ms>.<fbclid>`, sans toucher à la casse du `fbclid`.
- **Avant l'accord, rien n'est gardé**, pas même dans `sessionStorage`. Si le visiteur change de page avant de choisir, la provenance de cette visite est perdue. C'est accepté.

**Premier et dernier contact.**
- Un contact est une arrivée avec un UTM, un identifiant de clic ou un référent externe.
- Ne sont pas des référents externes : nos domaines, `checkout.stripe.com`, `accounts.google.com`.
- Le **premier contact** n'est jamais écrasé.
- Le **dernier contact** est remplacé à chaque nouveau contact, mais pas par une visite directe (dernier clic non direct).

**Cookie `attr`.**
- Propriétaire, posé sur `.<domaine>` pour que `app.` le lise ; `Secure`, `SameSite=Lax`.
- Contenu en JSON encodé en base64url, moins de 4 Ko, chaque valeur coupée à 100 caractères.
- Chaque identifiant de clic garde sa date de captation et expire 90 jours après.
- Le cookie expire 90 jours après le dernier contact enregistré.

**Recopie sur le compte.**
- **Google** : même navigateur. Le serveur lit `attr` à la création du compte.
- **Lien magique** : il peut être ouvert sur un autre appareil. Le formulaire qui demande le lien envoie donc le contenu de `attr` avec la demande, et le serveur l'attache à la demande en attente. L'attribution survit ainsi au changement d'appareil.
- Le serveur écrit la ligne `attribution` et une copie de l'état du consentement, **en valide chaque champ** (liste fermée de clés, longueurs), puis efface le cookie.

**Table `attribution`.** Celle de `suivi.md` § 7.4, avec trois champs en plus :
- `canal_premier` et `canal_dernier`, calculés par la règle ci-dessous ;
- `source_declaree_detail`, pour le texte de « Autre » (200 caractères au plus).

**Retrait du consentement** (lien « Gestion des traceurs » du pied de page, `MESSAGES.md` § 8.2, ou paramètres du compte) :
- `attr` est effacé ;
- les identifiants de clic du compte sont effacés en base ;
- une ligne est écrite dans `consentements` ;
- plus aucun envoi ne part.

**Canal, par ordre de priorité :**

| Condition | Canal |
|---|---|
| `gclid`, `gbraid` ou `wbraid`, ou `utm_source=google` avec `utm_medium=cpc` | `payant_google` |
| `fbclid`, ou `utm_source` = `meta`, `facebook` ou `instagram` avec `utm_medium=paid_social` | `payant_meta` |
| autre `utm_medium` = `cpc` ou `paid_social` | `payant_autre` |
| `utm_medium=email` | `email` |
| `utm_medium=partenaire` | `partenaire` |
| `utm_medium` = `social` ou `qr` | `social` ou `qr` |
| sans UTM, référent = moteur de recherche (Google, Bing, Qwant, DuckDuckGo, Ecosia) | `recherche_naturelle` |
| sans UTM, référent = réseau social | `social` |
| sans UTM, autre référent externe | `referent` |
| rien | `direct` |

**Convention des UTM** : en minuscules, sans accent.

| Paramètre | Valeurs |
|---|---|
| `utm_source` | `google`, `meta`, `linkedin`, `newsletter`, `partenaire_<nom>`, `salon_<nom>` |
| `utm_medium` | `cpc`, `paid_social`, `social`, `email`, `partenaire`, `qr` |
| `utm_campaign` | `aaaa_mm_<cible>_<theme>`, par exemple `2026_11_particulier_retractation` |
| `utm_content` | la variante de la création |
| `utm_term` | le mot-clé |

Dans les annonces, les UTM sont remplis par les modèles d'URL des plateformes.

### 2.10 « Comment nous avez-vous connu ? »

C'est la seule attribution disponible pour les visiteurs qui refusent. Elle ne demande aucun traceur.

- **Particulier.** Question posée sur l'**écran d'attente**, pendant la génération, et non à l'inscription. La personne attend, et l'inscription ne gagne aucune friction : c'est ce que mesure le test T5.
  - La question « Où en êtes-vous ? », placée sur l'écran de lancement par `OFFRES.md` § 2.1, pourrait aussi passer sur cet écran.
  - Décision au § 8.
- **Conseiller.** Question posée dans le formulaire d'essai, facultative.
- **Forme.** Un seul choix, facultatif. Ordre aléatoire des réponses, sauf « Autre » toujours en dernier, avec un champ libre court. Ce texte libre va dans `attribution`, jamais dans le journal.
- **Valeurs** : au § 3.2 (`source`).

### 2.11 Envois vers Meta et Google (phase 3)

**Tickets.** La file `envois_publicitaires` et son socle d'envoi sont construits par L12-01 (Meta) et L12-02 (Google), au lot 12, par celui des deux qui est livré le premier. Rien de cette section n'existe avant, pas même la table.

**Déclenchement.**
- Une ligne du journal dont le type porte une conversion (§ 3.17) crée, après validation de la transaction, une ligne `envois_publicitaires` par plateforme.
- Clé primaire : `(evenement_id, plateforme)`, ce qui rend l'envoi idempotent.
- Colonnes ajoutées à `suivi.md` § 7.4 :
  - `consentement_id` : la ligne de `consentements` qui justifie l'envoi ;
  - `reponse_ref`.
- Statuts :
  - `a_envoyer`, `envoye`, `erreur` ;
  - `ignore_sans_consentement` : on garde la trace de la décision ;
  - `ignore_hors_delai`.

**Consentement, vérifié à chaque événement** : c'est le dernier état du compte au moment du fait.
- Sans accord « publicité » : rien ne part.
- Avec accord :
  - **Meta** : l'événement part.
  - **Google** : `consent.adUserData = CONSENT_GRANTED`. `consent.adPersonalization` vaut `CONSENT_GRANTED` seulement si la finalité « publicité personnalisée » existe et a été acceptée (phase 3b) ; sinon `CONSENT_DENIED`.
- Un compte sans aucun choix enregistré, par exemple inscrit depuis un autre appareil, est traité comme un refus.

**Meta Conversions API** (`suivi.md` § 4) :
- **Délai.** Envoi immédiat, puisque `event_time` ne peut pas remonter à plus de 7 jours. Au-delà : `ignore_hors_delai`.
- **Champs de l'événement :**
  - `event_id` = `evenements.id` ;
  - `action_source=website` ;
  - `event_source_url` = URL générique de la page du fait, sans jeton ni requête.
- **`user_data` :**
  - `em` : e-mail normalisé (minuscules, sans espaces), puis haché ;
  - `external_id` : SHA-256 de `compte_id` avec un sel secret ;
  - `fbc` s'il existe, et `fbp` en phase 3b ;
  - `client_ip_address` et `client_user_agent`.
- **Cas des webhooks Stripe.** Un achat reçu par webhook ne connaît ni l'IP ni le navigateur. On les garde dans `contexte_navigateur` à la création de la session Checkout, seulement si le consentement est donné, pendant 7 jours.
- **`custom_data` :**
  - `value` (HT) et `currency=EUR` pour `Purchase` et `Subscribe` ;
  - `content_category` = `particulier`, `conseiller` ou `promoteur`.
- **Pas de téléphone envoyé**, par minimisation.

**Google, Data Manager API** (`suivi.md` § 5) :
- L'import par l'API Google Ads échoue depuis le 15/06/2026 pour un nouveau jeton. On passe donc par la Data Manager API.
- Une action de conversion de type `UPLOAD_CLICKS` par conversion du § 3.17.
- Contenu de chaque événement :
  - `gclid`, `gbraid` ou `wbraid`, et l'e-mail haché. La normalisation propre à Google est à relire au moment de coder ;
  - `transactionId` = `evenements.id` ;
  - l'objet `consent` ;
  - aucune IP.
- Envoi par lots, toutes les heures.

**Remboursements.** Pour Google, un `achat_rembourse` produit un ajustement de la conversion (retrait ou nouvelle valeur). Pour Meta, rien n'est envoyé.

**Fiabilité.**
- Relances avec un délai croissant.
- Alerte si le taux d'erreur dépasse un seuil, à établir.
- Secrets (jeton Meta, identifiants Google Cloud) dans le gestionnaire de secrets, jamais versionnés ni journalisés.

**Phase 3b, si le remarketing le justifie.** Pixel ou balise en mode basique, chargés après consentement. La page de confirmation passe le même `evenements.id` au navigateur, par exemple `fbq('track', 'Purchase', {…}, { eventID: id })`. La déduplication se fait alors sur le couple `event_id` et nom, dans les 48 h.

### 2.12 Conservation

| Données | Où | Durée |
|---|---|---|
| Audience anonyme | Umami | 25 mois, purge mensuelle |
| Relectures et cartes de chaleur (consentement) | Umami | 30 jours |
| Journal d'événements | `evenements` | 5 ans (proposition), puis agrégation ; identifiants retirés à la suppression du compte |
| UTM, référent, page d'arrivée, source déclarée | `attribution` | durée de vie du compte |
| Identifiants de clic (gclid, gbraid, wbraid, fbc) | cookie `attr`, `attribution` | 90 jours après captation |
| IP, navigateur et fbp pour Meta | `contexte_navigateur` | 7 jours |
| Envois publicitaires | `envois_publicitaires` | 25 mois (proposition) |
| Preuves de consentement | `consentements` | 5 ans (`juridique.md` § 3.4) |
| Choix fait dans le bandeau | cookie de tarteaucitron | 6 mois, puis la question est reposée (recommandation CNIL de 2020 citée par `suivi.md` § 6, non revérifiée) |
| Opposition à la mesure | cookie `opposition_mesure` | 13 mois |
| Ouvertures agrégées | `vues_visite`, `clics_pages_partagees` | durée de vie du lien (aucune donnée personnelle) |
| Suivi détaillé des prospects (consentement) | `vues_visite_detail` | 6 mois, puis agrégation (`juridique.md` § 3.4) |

### 2.13 Ce qui n'est pas mesuré, volontairement

- La navigation individuelle d'un visiteur anonyme : pas d'identification, et l'écran Sessions n'est pas utilisé.
- Ce que font les destinataires d'un partage privé, au-delà d'un compteur par lien et par jour.
- Le détail d'un prospect (durée, pièces) sans son accord sur la page.
- Les visiteurs du site d'un promoteur dans l'intégration : c'est au promoteur de mesurer, sous sa propre CMP.
- L'ouverture des e-mails et les clics dans les e-mails : ni pixel, ni lien traçant.
- Le passage d'un appareil à l'autre d'un visiteur anonyme.

---

## 3. Convention de nommage et dictionnaire

### 3.1 Règles de nommage

- **Forme** : `objet_action`, en snake_case, en français **sans accent**, en minuscules. L'objet vient d'abord, l'action ensuite, au participe passé : `plan_lance`, `achat_paye`, `faq_ouverte`.
- **Motif vérifié** : `^[a-z][a-z0-9]*(_[a-z0-9]+)+$`, **50 caractères au plus** (limite d'Umami).
  - Le 27/09/2026, un script a relu la première colonne des tableaux « Nom » du § 3 : les 143 noms respectent le motif et la longueur (31 caractères au plus), aucun n'apparaît deux fois, et les propriétés et valeurs énumérées sont en snake_case, sauf les deux exceptions ci-dessous. Le même contrôle sera fait en CI par C1 et C2 (§ 7.4).
  - Les noms de propriétés et les valeurs énumérées suivent aussi le snake_case, 50 caractères au plus. Deux exceptions voulues : les codes d'erreur, qui sont les clés à points de `MESSAGES.md` (§ 3.15), et les messages `visite:…` des intégrations (§ 3.16).
- **Un nom a un seul sens.**
  - Un changement de sens d'une propriété donne un nouveau nom.
  - Un nom retiré n'est jamais réutilisé.
  - Toute modification passe par ce document et par le fichier `mesure/evenements.json`, dans la même modification.
- **Un événement pour une action, ses variantes en propriétés.** Exemple : `cta_depot_clique` avec `emplacement=hero`.
  - Exception : les étapes d'un entonnoir Umami ont chacune leur nom, parce que ses entonnoirs ne filtrent pas les propriétés (point à vérifier sur la version installée).
- **Propriétés** : même forme, 50 propriétés au plus, et des **valeurs énumérées** (§ 3.2), des nombres ou des booléens.
  - Dans Umami, les durées et les tailles passent en **classes**, pour ne jamais isoler une personne.
- **Les événements des intégrations** (`visite:ouverte`, `visite:piece`) gardent leur forme à deux points. Ils sont destinés au site du promoteur, hors de notre mesure (§ 3.16).

### 3.2 Propriétés et valeurs autorisées

Toute valeur hors de ces listes est retirée en production et fait échouer les tests.

| Propriété | Valeurs |
|---|---|
| `page_type` | `accueil`, `pro`, `pro_decouvrir`, `promoteurs`, `partenaires`, `tarifs`, `methode`, `faq`, `guide`, `demo`, `offert`, `legal`, `app_depot`, `app_calibration`, `app_inscription`, `app_attente`, `app_apercu`, `app_paiement`, `app_compte`, `app_pro`, `app_programme`, `visite_proprietaire`, `erreur_404`. Valeurs inchangées malgré les nouvelles adresses : `demo` pour `/appartement-temoin`, `partenaires` pour `/marque-blanche` (§ 2.6) |
| `emplacement` | `entete`, `hero`, `preuves`, `etapes`, `demo`, `limites`, `tarifs`, `faq`, `pied`, `guide`, `fin_demo`, `volet`, `attente`, `flottant_mobile`, `refus_depot`, `pro` (page `/pro`, `PARCOURS.md` B1), `mes_plans` (bouton « Ajouter un plan », A14) |
| `section` | `hero`, `preuves`, `etapes`, `demo`, `depot`, `livrables`, `fidelite`, `moments`, `limites`, `tarifs`, `faq`, `dernier_appel`, `pros`, `promoteurs`, `partenaires`, `methode`, `pied`. Les quatre ajoutées suivent `MESSAGES.md` § 1.5 à § 1.7 et § 1.10 |
| `question` (FAQ) | identifiant court fixé dans le HTML (`data-question`), jamais le texte. Exemples : `plans_pris_en_charge`, `precision_cotes`, `delai`, `non_contractuel`, `mobilier`, `partage`, `retractation_achat`, `donnees_plan`, `prix`, `autorisation_promoteur` |
| `cible` | `particulier`, `conseiller`, `promoteur`, `partenaire` |
| `formulaire` | `liste_attente` (bêta, L2-12), `essai_pro`, `rdv_pro`, `contact_promoteur`, `contact_partenaire`, `alerte_prise_en_charge`, `signaler_defaut`, `contact_support` (L6-11) |
| `champ` | nom du champ, jamais sa valeur : `email`, `siren`, `telephone`, `message`, `lots`, `case_autorisation`, `autre` |
| `format_fichier` | navigateur : `pdf`, `png`, `jpg`, `webp`, `autre` ; serveur : `pdf_vectoriel`, `pdf_image`, `image` |
| `motif_refus` | analyse et navigateur : `format_inconnu`, `fichier_vide`, `trop_lourd`, `image_illisible`, `image_trop_petite`, `pdf_endommage`, `pdf_protege`, `pdf_sans_page`, `trace_non_reconnu`, `plusieurs_niveaux` (en service : au-delà de `niveaux_max = 2`, L4-08 ; l'outil local accepte les plans à plusieurs niveaux depuis le 27/09/2026 et refuse ceux dont les niveaux ne se séparent pas), `pas_un_plan` (repris des refus de `pipeline/serveur.py`) ; navigateur seulement : `plusieurs_fichiers`, `heic` (`PARCOURS.md` § 1.6) ; qualification : `maison`, `plusieurs_lots`. En service, un PDF de plusieurs lots est refusé avec `plusieurs_lots` ; seul l'import promoteur (L10-02) le découpe (arbitrage R17) |
| `cause` (échec) | `lecture_illisible`, `reponse_tronquee`, `plan_incoherent`, `budget_depasse` (plafond de 3 $ par plan atteint, toutes passes et relances confondues, arbitrage R6), `refus_402`, `refus_403`, `controle_bloquant`, `rendu_images` (vue du dessus ou plan 2D d'un aperçu impossibles après nouvelles tentatives ; une photo manquante n'est jamais une cause d'échec, arbitrage R2), `delai_depasse`, `file_saturee`, `erreur_interne` |
| `type_plan` | `apercu`, `complet` |
| `source_lot` | `offert_inscription`, `testeur`, `achat`, `abonnement`, `essai`, `recharge`, `code`, `geste_commercial`, `programme` (sources du grand livre, `OFFRES.md` § 6.2, qui fait foi, arbitrage R7). Pendant la bêta fermée, les invités reçoivent un lot `testeur` tiré de la variante « bêta » du catalogue, en plan complet ou en aperçu selon L0-04 (arbitrage R13) |
| `offre` | code stable de l'offre dans le catalogue (L5-08), sans prix : au lancement `particulier_visite`, `particulier_plan_suivant`, `particulier_pack_3`. La liste permise est lue dans le catalogue : une offre ajoutée sans déploiement est acceptée sans changer le dictionnaire (D7, arbitrage R5). Le prix payé est dans `montant_*` et la période dans `periode_prix`. Un déblocage se distingue d'un premier plan par `depuis_apercu` |
| `formule` | code d'offre pro du catalogue (L5-08), par exemple `pro_solo`, `pro_cabinet`, `pro_equipe`, ou `aucune`. Même règle que `offre` : aucun code figé dans le dictionnaire (arbitrage R5) |
| `periodicite` | `mensuel`, `annuel` |
| `periode_prix` | identifiant de la période de test de prix (`p1`, `p2`…), porté par la version d'offre du catalogue et noté en annotation dans Umami. Un prix ne change que d'une période à l'autre, jamais selon la personne (arbitrage R8) |
| `experience` | code du test dans le registre des tests (L12-05). Journal seulement, jamais dans Umami (§ 4.8) |
| `variante` | `a`, `b`. Journal seulement, pour un test tiré côté serveur sur un compte connecté (§ 4.8) |
| `mode` | `plan_2d`, `maquette`, `visite` (modes `plan`, `orbit`, `walk` du moteur), `visite_360` (panoramas d'arrêt en arrêt, dès L4-16) ; `apercu` pour un défaut signalé sur une image de l'aperçu (`defaut_signale` seulement, L6-09) |
| `piece` | `sejour`, `cuisine`, `chambre`, `salle_de_bain`, `wc`, `entree`, `degagement`, `rangement`, `loggia`, `balcon`, `terrasse`, `autre` (l'escalier et le palier d'un plan à plusieurs niveaux vont dans `degagement`) |
| `qualite` | proposition, avec L4-12 : niveau de qualité retenu par la qualité adaptative, `haute`, `moyenne`, `basse` (liste fixée avec L4-12) |
| `controles` (visite de contrôle) | proposition : types de problèmes de `moteur/controle.mjs`, en snake_case : `etancheite`, `baie`, `garde_corps`, `cloison`, `maquette`, `lumiere`, `menuiserie`, `rebord`, `dalle`, `escalier`, `vide`, `niveau`, `texte`… Liste reprise de `controle.mjs` ; un contrôle ajouté y entre par la même modification |
| Classes d'images par seconde | proposition, à fixer avec les seuils de L1-14 : `moins_20`, `20_30`, `30_50`, `plus_50` |
| `type_defaut` | un code par choix de `defaut.choix` (`MESSAGES.md` § 7.10), dans le même ordre : `trou_ou_fente` (« Un trou ou une fente dans un mur »), `zone_noire` (« Une zone noire ou sans texture »), `objet_flottant`, `mur_mal_place`, `porte_inversee` (« Une porte à l'envers »), `equipement_oublie_ou_mal_oriente`, `cote_differente` (« Une cote qui ne correspond pas au plan »), `autre` (« Autre chose »). Même liste pour les demandes de correction des promoteurs (L10-03) |
| `defauts` (visite de contrôle) | liste de valeurs de `type_defaut`, plus `texte_technique`, que seul le contrôle automatique des textes relève (L1-04) |
| `element` (verrou) | `bouton_visite`, `onglet_visite`, `onglet_maquette`, `onglet_plan`, `telechargement`, `partage_visite`. `photo` n'existe qu'avec la galerie complète (L13-02) : au lancement, aucune photo verrouillée n'est montrée ni promise (arbitrage R1) |
| `canal` (partage) | `copier`, `email`, `sms`, `whatsapp`, `natif`, `qr`, `plein_ecran` |
| `source` (déclarée) | particulier : `recherche_web`, `reseau_social`, `proche`, `conseiller_ou_agent`, `promoteur`, `article_ou_forum`, `publicite`, `autre`. Pro : `recherche_web`, `linkedin`, `confrere`, `client_visite`, `reseau_ou_association`, `promoteur_partenaire`, `salon`, `publicite`, `autre` |
| `etape` (situation) | `choix_lot`, `reservation_signee`, `choix_tma`, `visite_cloisons`, `livraison`, `autre` |
| `activite` | `cgp`, `cif`, `agent`, `mandataire`, `commercialisateur`, `promoteur`, `courtier`, `reseau_mandataires`, `groupement_cgp`, `service_acquereurs`, `autre` (déclarée ; les trois ajoutées viennent du formulaire partenaires, `MESSAGES.md` § 4.4) |
| `role` (membre d'une organisation) | `proprietaire`, `administrateur`, `membre` (`PARCOURS.md` B8) |
| `code` (erreur) | clé du catalogue de messages, écrite telle quelle, avec ses points : liste au § 3.15 |
| `modele` (e-mail) | un code par e-mail de `MESSAGES.md` : table au § 3.8 |
| Classes de durée | `moins_30s`, `30s_2min`, `2_5min`, `5_15min`, `plus_15min` |
| Classes de chargement | `moins_2s`, `2_5s`, `5_10s`, `plus_10s` |
| Classes de taille | `moins_1mo`, `1_5mo`, `5_20mo`, `20_40mo`, `plus_40mo` |
| Classes de délai ou d'âge | `moins_1h`, `1_24h`, `1_7j`, `7_30j`, `plus_30j` |
| `jours_depuis_reservation` | `0_10`, `11_30`, `31_90`, `plus_90` (seulement si la réservation est signée) |
| `rang` | `1`, `2`, `3_et_plus` (ou l'ordre de la section dans la page) |

Côté serveur, les nombres restent bruts (`duree_s`, `cout_usd`, `montant_ht_centimes`). Le journal est interne et n'est jamais montré tel quel.

### 3.3 Légende des tableaux

- **Côté** :
  - **N** : navigateur, vers Umami, anonyme. « (attribut) » : posé par `data-umami-event`. « (script) » : appel à `mesure()`. « (moteur) » : émis par la visite (§ 2.7).
  - **S** : serveur, vers le journal `evenements`.
  - **C** : compteur agrégé côté serveur, sans ligne par personne.
- **Meta · Google** : l'équivalent envoyé en phase 3 (§ 3.17). « — » : rien n'est envoyé.
- **Recette** : le scénario du § 7.5 qui vérifie l'événement.

### 3.4 Site vitrine

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| (page vue) | Chargement d'une page qui porte le script ; URL réduite par le filtre | N (automatique) | aucune ; Umami relève le chemin en gabarit, le référent réduit, l'appareil, le pays | toutes les pages avec Umami (§ 2.6) | — | R1 |
| `cta_depot_clique` | Clic sur un bouton « Importer mon plan » (`MESSAGES.md` § 1.1), ou « Ajouter un plan » dans Mes plans. Tant que la vitrine est en liste d'attente, le même bouton mène au formulaire de la liste : le nom ne change pas, la bascule est notée en annotation (§ 4.7) | N (attribut) | `emplacement`, `page_type` | vitrine, démonstration, attente, Mes plans | — | R1, R17 |
| `cta_demo_clique` | Clic sur « Visiter l'appartement témoin » | N (attribut) | `emplacement`, `page_type` | vitrine, volet de déblocage, attente | — | R1, R2 |
| `cta_tarifs_clique` | Clic vers la page ou la section des tarifs | N (attribut) | `emplacement`, `page_type` | vitrine | — | R1 |
| `cta_essai_pro_clique` | Clic sur « Essayer 14 jours gratuitement ». N'existe qu'avec l'essai en ligne (lot 9) : avant, les pages pros ne proposent que la démonstration ou la bêta fondateurs (arbitrage R21) | N (attribut) | `emplacement`, `page_type`, `formule` (depuis la grille, sinon `aucune`) | `/pro`, `/pro/decouvrir`, `/tarifs` | — | R1 |
| `cta_rdv_pro_clique` | Clic sur « Demander une démonstration » d'une page conseillers (`MESSAGES.md` § 2.8, § 2.12) | N (attribut) | `emplacement`, `page_type` | `/pro`, `/tarifs` | — | R1 |
| `cta_promoteur_clique` | Clic sur « Demander une démonstration » ou « Recevoir le rapport de prise en charge » (`MESSAGES.md` § 3.1, § 3.11) | N (attribut) | `emplacement`, `intention` (`demo`, `rapport`) | `/promoteurs` | — | R1 |
| `cta_partenaire_clique` | Clic sur « Commander des codes » ou « Demander une présentation » (`MESSAGES.md` § 4.1) | N (attribut) | `emplacement`, `offre_partenaire` (`codes`, `marque_blanche`) | `/marque-blanche` | — | R1 |
| `section_vue` | Section visible à 50 % au moins (ou couvrant la moitié de l'écran si elle est plus haute que lui) pendant 1 s ; une fois par section et par page vue | N (script) | `section`, `page_type`, `rang` | vitrine, attente, aperçu | — | R1 |
| `page_defilee` | Défilement qui atteint 25, 50, 75 puis 100 % ; une fois par seuil et par page vue | N (script) | `seuil` (`25`, `50`, `75`, `100`), `page_type` | vitrine, guides | — | R1 |
| `faq_ouverte` | Ouverture d'une question (l'élément `details` passe à ouvert), pas la fermeture | N (script) | `question`, `page_type`, `rang` | FAQ, tarifs, `/pro`, `/promoteurs` | — | R1 |
| `tarifs_onglet_choisi` | Clic sur l'onglet « Particuliers » ou « Professionnels » de la page des tarifs (`MESSAGES.md` § 5.1) | N (script) | `onglet` (`particulier`, `professionnel`) | `/tarifs` | — | R1 |
| `formulaire_commence` | Premier champ modifié d'un formulaire ; une fois par formulaire et par page vue | N (script) | `formulaire`, `page_type` | liste d'attente, `/pro`, `/promoteurs`, `/marque-blanche`, refus de dépôt, visite, aide | — | R1, R17 |
| `formulaire_refuse` | Envoi refusé par la validation (navigateur ou API), message affiché | N (script) | `formulaire`, `champ`, `motif` (`vide`, `format`, `siren_inconnu`, `essai_deja_fait`) | idem | — | R1, R9 |
| `formulaire_envoye` | Réponse positive de l'API à l'envoi | N (script) | `formulaire` | idem | — (l'événement serveur correspondant porte la conversion) | R1, R17 |
| `liste_attente_inscrite` | Inscription à la liste d'attente de la bêta reçue par l'API, avant confirmation ; l'adresse va dans la table de la liste, jamais dans l'événement (L2-12) | S | `cible` (profil déclaré), `etape` (situation, facultative, particulier), `activite` (facultative, pro) | vitrine en liste d'attente, `/pro` (bêta fondateurs) | — | R17 |
| `liste_attente_confirmee` | Lien de confirmation ouvert (double confirmation) : l'inscription devient active | S | `cible`, `delai_depuis_inscription` (classe de délai) | page « inscription confirmée » | — | R17 |
| `liste_attente_quittee` | Désinscription par le lien de l'e-mail | S | `cible`, `confirmee` (booléen) | page « désinscription » | — | R17 |

### 3.5 Démonstration et moteur de visite

Ces événements sont émis par le moteur (§ 2.7). Ils n'existent que pour la démonstration (l'appartement témoin fictif) et pour la vue propriétaire, **jamais pour un lien**. La visite se calcule dans le navigateur du client (D5) : ces événements mesurent donc aussi si elle s'affiche, et si elle est fluide, sur les appareils réels (D12 : fluide sur un portable d'entrée de gamme et un téléphone).

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `demo_ouverte` | Premier rendu de la visite de l'appartement témoin fictif | N (moteur) | `emplacement` (d'où l'on vient : `hero`, `fin_demo`, `volet`, `attente`, `pro`…), `chargement` (classe) | `/appartement-temoin` | — (phase 3b : `ViewContent` par le pixel) | R2 |
| `visite_chargee` | Premier rendu de la visite du propriétaire | N (moteur) | `contexte` (`proprietaire`), `chargement` (classe), `mode_initial` | vue propriétaire | — | R6 |
| `visite_mode_choisi` | Passage à un mode ; une fois par mode et par ouverture | N (moteur) | `contexte` (`demo`, `proprietaire`), `mode`, `rang` | démonstration, vue propriétaire | — | R2, R6 |
| `visite_piece_vue` | Entrée dans une pièce en mode visite, ou clic sur la puce d'une pièce ; une fois par pièce et par ouverture | N (moteur) | `contexte`, `piece` (catégorie seulement) | idem | — | R2 |
| `visite_photo_ouverte` | Ouverture d'une photo en grand dans la galerie | N (moteur) | `contexte`, `piece` | idem | — | R2 |
| `visite_plein_ecran` | Passage en plein écran | N (moteur) | `contexte` | idem | — | R2 |
| `visite_quittee` | Départ de la page (`pagehide`) après un premier rendu | N (moteur) | `contexte`, `duree` (classe), `modes_vus` (`1`, `2`, `3`) | idem | — | R2 |
| `visite_fluidite_mesuree` | **Proposition, à décider** (D12) : une fois par ouverture, 20 s après le premier rendu en mode visite ou 360° | N (moteur) | `contexte`, `mode`, `ips` (classe, médiane), `ips_bas` (classe, 1er décile), `qualite` (niveau retenu par L4-12), `appareil` (`mobile`, `tablette`, `ordinateur`) ; jamais d'identifiant d'appareil | démonstration, vue propriétaire | — | R2, R6 |

`visite_quittee` part au moment où la page se ferme. S'il n'arrive pas de façon fiable en recette, on s'en passe : `visite_mode_choisi` suffit à mesurer l'engagement.

### 3.6 Dépôt et analyse

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `depot_fichier_choisi` | Fichier choisi par le sélecteur ou lâché sur la zone | N (script) | `format_fichier`, `taille` (classe), `methode` (`selecteur`, `glisser`) | zone de dépôt (accueil, `/pro`, app) | — | R3 |
| `depot_fichier_refuse` | Refus dans le navigateur, avant l'envoi | N (script) | `motif_refus` (`format_inconnu`, `fichier_vide`, `trop_lourd`, `plusieurs_fichiers`, `heic`) | idem | — | R3 |
| `depot_envoi_termine` | Envoi terminé : réponse positive du stockage à l'URL signée | N (script) | `format_fichier`, `duree` (classe) | idem | — | R3 |
| `depot_envoi_echoue` | Envoi interrompu ou refusé | N (script) | `motif` (`reseau`, `delai`, `serveur`) | idem | — | R3 |
| `depot_provisoire_recu` | Fichier reçu dans le dépôt provisoire anonyme de 24 h, **avant tout compte** (ligne `depots_provisoires` au statut `recu`, L5-23). Aucun identifiant n'est écrit : ni compte, ni plan, ni dépôt | S | `format_fichier`, `taille_ko`, `page_type` | — | — | R3 |
| `plan_depose` | Ligne `plans` créée dans une organisation, avec son fichier dans l'espace privé : dépôt fait en étant connecté, import, API, ou **rattachement d'un dépôt provisoire** à la vérification de l'e-mail. Un dépôt provisoire rattaché n'est donc compté qu'une fois ici, sans nouvel envoi | S | `format_fichier`, `taille_ko`, `canal_depot` (`unitaire`, `import`, `api`), `connecte` (booléen : faux pour un dépôt provisoire rattaché), `page_type` | — | — | R3, R4 |
| `plan_analyse` | Fin de l'analyse sans IA. Pour un dépôt provisoire, elle a lieu avant le compte : la ligne n'a pas de `plan_id` et n'est pas réécrite au rattachement | S | `resultat` (`reconnu`, `a_calibrer`, `refuse`), `motif_refus`, `vectoriel` (booléen), `echelle` (`lue`, `a_caler`), `provisoire` (booléen), `niveaux` (`1`, `2`, `3_et_plus` : niveaux détectés par l'extraction ; proposition, pour mesurer la part des duplex et la demande au-delà de deux niveaux), `duree_ms` | — | — | R3 |
| `page_pdf_changee` | Autre page choisie dans un PDF de plusieurs pages (« Choisir une autre page », `PARCOURS.md` A3) | N (script) | `page_type` | écran « Plan reconnu » | — | R3 |
| `depot_doublon` | Plan déjà présent dans la même organisation (même empreinte) : aucune seconde lecture, message « Vous avez déjà déposé ce plan » (`PARCOURS.md` § 1.6) | S | `cible` | écran « Plan reconnu » | — | R3 |
| `plan_calibre` | Cote connue validée par l'utilisateur | S | `essais` (nombre de tentatives) | écran de calibration | — | R3 |
| `alerte_prise_en_charge_demandee` | E-mail laissé après un refus « pas encore pris en charge » ; l'adresse va dans une table dédiée, jamais dans l'événement | S | `motif_refus` | écran de refus | — | R3 |

### 3.7 Compte

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `inscription_ouverte` | Écran de création de compte affiché | N (script) | `contexte` (`lancement_plan`, `essai_pro`, `code_offert`, `connexion`), `cible` | `app_inscription` | — | R4 |
| `inscription_methode_choisie` | Clic sur « Recevoir mon lien de connexion » ou « Continuer avec Google » (`MESSAGES.md` § 7.3) | N (script) | `methode` (`lien_magique`, `google`, `apple`) | idem | — | R4 |
| `lien_magique_envoye` | E-mail de connexion accepté par le service d'envoi | S | `contexte` | — | — | R4 |
| `lien_magique_refuse` | Lien ouvert expiré, déjà utilisé ou invalide ; message affiché | S | `motif` (`expire`, `deja_utilise`, `invalide`) | page de connexion | — | R4, R13 |
| `compte_cree` | Compte créé après vérification de l'e-mail ou retour de Google | S | `methode` (`lien_magique`, `google`, `apple`, `sso`), `cible`, `contexte`, `meme_appareil` (booléen : lien ou code utilisé sur l'appareil du dépôt, `PARCOURS.md` A5), `attribution` (`avec`, `sans`), `consentement_pub` (booléen) | — | Meta `CompleteRegistration` · Google « Inscription » (secondaire) | R4, R14 |
| `session_ouverte` | Connexion réussie à un compte existant | S | `methode` (mêmes valeurs ; `sso` pour les promoteurs, L10-07), `cible` | — | — | R4 |
| `credit_offert_attribue` | Lot « offert » ou « testeur » créé au grand livre | S | `source_lot` | — | — | R4 |
| `credit_offert_refuse` | Plan offert non attribué, ou mis en attente par l'anti-abus ; message affiché | S | `motif` (`email_deja_utilise`, `compte_google_deja_utilise`, `plan_deja_offert` : même empreinte du fichier ou de la page rendue, arbitrage R22 ; `domaine_jetable`, `limite_ip_attente`, `budget_jour_attente`, `format_non_pdf` : plan offert réservé aux PDF par le coupe-circuit, L8-09) | message à l'écran | — | R4, R13 |
| `source_declaree` | Réponse à « Comment nous avez-vous connu ? » | S | `source`, `cible` | attente (particulier), formulaire d'essai (pro) | — | R4 |
| `situation_declaree` | Réponse à « Où en êtes-vous ? » | S | `etape`, `jours_depuis_reservation` | écran de lancement ou d'attente | — | R4 |
| `consentement_enregistre` | Choix fait dans le bandeau ou dans les paramètres du compte, ou retrait. N'existe qu'avec le bandeau, qui n'arrive qu'avec le premier traceur non exempté (arbitrage R18) | S | `mesure_enrichie` (booléen), `publicite` (booléen), `version_bandeau`, `origine` (`bandeau`, `parametres`, `retrait`) | bandeau, compte | — | R14 |
| `compte_supprime` | Suppression effective du compte | S | `motif` (`demande`, `inactivite`), `cible` | — | — | R4 |

### 3.8 Génération

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `plan_qualifie` | Réponse de la qualification par l'IA (environ 0,02 $) | S | `resultat` (`accepte`, `refuse`, `peu_lisible` : alerte, l'utilisateur choisit de continuer ou de déposer un meilleur fichier, `PARCOURS.md` § 1.6), `motif_refus` (dont `maison`, `plusieurs_lots`, `plusieurs_niveaux`, `pas_un_plan`), `cout_usd` | — | — | R5 |
| `plan_lance` | Réservation au grand livre et création du travail, dans la même transaction | S | `type_plan`, `source_lot`, `format_fichier`, `calibre` (booléen), `premier_plan` (booléen), `periode_prix` | écran de lancement | Meta `StartTrial` si `source_lot=offert_inscription` · Google « Premier plan offert » (secondaire) | R5 |
| `controle_termine` | Fin de la visite de contrôle, réparations comprises. Sans contrôle réussi, rien n'est publié ni montré (arbitrage R2) | S | `resultat` (`ok`, `repare`, `bloque`), `passages` (1 à 6), `defauts` (liste, § 3.2), `controles` (proposition : types de `controle.mjs` en échec avant réparation, § 3.2) | — | — | R5 |
| `apercu_pret` | **Aperçu publié** (plan offert, `type_plan=apercu`) : vue du dessus 3D découpée et plan 2D coté marqués et listés ; ligne `publications`, puis consommation du crédit aperçu, dans la même transaction. Les photos ne sont pas attendues (D5, arbitrage R2) | S | `source_lot`, `duree_s` (du lancement à la publication de l'aperçu), `cout_ia_usd`, `relance` (booléen), `version_moteur` | — | — | R5 |
| `plan_pret` | **Visite publiée** (plan complet, `type_plan=complet`) dès le contrôle réussi : `index.html` et `plan.json` filtré publiés, puis consommation du crédit complet, dans la même transaction. Les images s'ajoutent ensuite. Ne sert plus pour l'aperçu | S | `source_lot`, `duree_s` (du lancement à la publication), `cout_ia_usd`, `relance` (booléen), `version_moteur` | — | — | R5 |
| `photos_pretes` | Fin des images d'un travail publié : les 2 photos (séjour, puis chambre principale ou à défaut la pièce principale suivante) sont publiées, ou omises après nouvelles tentatives, ou le délai maximal des images est atteint. Une image omise ne bloque rien et déclenche une alerte à l'équipe (arbitrage R2) | S | `type_plan`, `photos` (nombre publié : `0`, `1`, `2`), `omises` (nombre d'images omises, toutes sortes), `duree_s` (du contrôle réussi à la dernière image) | — | — | R5 |
| `panoramas_prets` | Dès L5-27 : fin du rendu des panoramas 360° d'un travail publié ; panoramas publiés, ou omis après nouvelles tentatives (arrêt retiré du 360°, alerte) | S | `type_plan`, `panoramas` (nombre publié), `omis`, `duree_s` (du contrôle réussi au dernier panorama) | — | — | R5 |
| `plan_echoue` | Travail arrêté sans publication ; message du catalogue affiché | S | `etape` (`qualification`, `lecture`, `murs`, `complement`, `controle`, `images`, `publication`), `cause`, `cout_ia_usd`, `relance` (booléen), `source_lot`. `images` ne vaut que pour un aperçu dont la vue du dessus ou le plan 2D n'ont pas pu être rendus | écran d'échec | — | R5, R13 |
| `credit_rendu` | Mouvement de libération au grand livre | S | `motif` (`echec`, `delai_depasse`, `file_saturee`, `refus_402_403`), `source_lot` | — | — | R5 |
| `photos_completees` | **Après le lancement seulement** (galerie complète, L13-02) : photos supplémentaires rendues après un déblocage. Au lancement, un déblocage ne rend aucune image de plus (arbitrage R1) | S | `photos`, `duree_s`, `retard` (booléen) | — | — | (L13-02) |
| `plan_rejoue` | Rejeu sans IA par l'équipe | S | `motif` (`defaut_signale`, `echec`, `photos`) | administration | — | R5 |
| `email_envoye` | E-mail transactionnel accepté par le service d'envoi. Aucun pixel ni lien traçant : on sait qu'il est parti, pas qu'il est lu | S | `modele` (table ci-dessous) | — | — | R4, R5, R7, R17 |

**Valeurs de `modele`**, un code par e-mail de `MESSAGES.md` § 7.11, plus les e-mails dont le texte reste à écrire :

| E-mail | `modele` | Tickets |
|---|---|---|
| E1 Lien de connexion | aucun : l'envoi est compté par `lien_magique_envoye` (§ 3.7), pour ne pas le compter deux fois | L5-14 |
| E2 Bienvenue (compte créé, plan offert lancé) | `bienvenue` | L5-14 |
| E3 Plan offert prêt | `apercu_pret` | L5-14, L5-11 |
| E4 Visite prête | `visite_prete` | L5-14, L5-11 |
| E5 Précision demandée (une cote) | `cote_demandee` | L5-14, L6-04 |
| E6 Échec : rien n'a été décompté | `echec` | L5-14, L5-11 |
| E7 Confirmation de commande | `recu` | L8-01 |
| E8 Confirmation d'ouverture immédiate | `ouverture_immediate` ; `recu_ouverture_immediate` quand E7 et E8 sont fusionnés | L8-03 |
| E9 Accusé de réception d'une renonciation | `accuse_renonciation` | L8-03 |
| E10 Rappel : plans à lancer | `rappel_expiration_30j`, `rappel_expiration_7j` | L8-05 |
| E11 Rappel avant suppression d'un aperçu | `rappel_suppression_apercu` | L5-20 |
| E12 Défaut signalé, puis corrigé | `defaut_recu`, `defaut_corrige`, `defaut_non_retrouve` | L6-09 |
| E13 Conseillers : essai démarré | `essai_debut` | L9-02 |
| E14 Conseillers : fin d'essai dans 3 jours | `essai_fin_proche` | L9-02 |
| E15 Conseillers : un prospect est intéressé | `interet_prospect` | L9-04 |
| « Me prévenir si cela change » (`MESSAGES.md` § 7.1), e-mail unique | `alerte_prise_en_charge` | à établir (ouverture d'un format refusé aujourd'hui, par exemple le triplex) |
| Liste d'attente : confirmation d'inscription (texte à ajouter à `MESSAGES.md`, L2-12) | `liste_attente_confirmation` | L2-12 |
| Bêta fermée : invitation (texte à ajouter, L6-10) | `invitation_beta` | L6-10 |
| Invitation d'un collègue (texte à ajouter, `PARCOURS.md` B8) | `invitation_membre` | L5-04 |

`confirmation_renonciation` et la valeur `credit_rendu` de `modele` sont retirées : la première mélangeait E8 et E9, la seconde prenait le nom d'un événement.

### 3.9 Aperçu, verrou et téléchargements

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `apercu_vu` | Ouverture de la page d'aperçu par son propriétaire, servie par l'application. La page ne reçoit que des images : ni moteur ni `plan.json` (D6, arbitrage R4) | S | `rang`, `delai_depuis_pret` (classe, depuis `apercu_pret`) | `app_apercu` | — | R6 |
| `verrou_clique` | Clic sur un élément verrouillé | N (script) | `element` | `app_apercu` | — | R6 |
| `volet_deblocage_ouvert` | Ouverture du volet « Débloquer la visite » | N (script) | `origine` (valeur d'`element`) | `app_apercu` | — | R6 |
| `offre_choisie` | Clic sur « Ce logement » ou « Comparer 3 lots » dans le volet | N (script) | `offre`, `periode_prix` | volet | — | R6 |
| `apercu_debloque` | Déblocage d'un aperçu : consommation directe d'un crédit complet et publication de la visite déjà contrôlée, sans lecture ni rendu (arbitrage R2) | S | `delai_depuis_apercu` (classe), `source_lot` | — | — | R7 |
| `apercu_arret_vu` | [SI LIVRÉ : L6-13] Changement d'arrêt dans la visionneuse 360° de l'aperçu gratuit ; une fois par arrêt et par page vue. La page ne reçoit que des images (D6) | N (script) | `piece` (catégorie), `rang` | `app_apercu` | — | R6 |
| `fichier_telecharge` | URL signée de téléchargement émise par l'application | S | `fichier` (`photos_hd`, `plan_pdf`, `fiche_pdf`, `archive`), `cible` | galerie, espace pro | — | R6 |

Pendant la bêta fermée (lot 6), aucun achat n'est possible et aucun message ne propose 29 € (arbitrage R13) : `volet_deblocage_ouvert`, `offre_choisie` et `apercu_debloque` n'apparaissent qu'avec le lot 8 (ouverture à tous en L8-07).

### 3.10 Achat et remboursement (particuliers)

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `paiement_ouvert` | Session Stripe Checkout créée | S | `offre`, `formule` (abonnement ou recharge pro, sinon `aucune`), `montant_ttc_centimes`, `periode_prix` | volet, page d'achat, page des formules | Meta `InitiateCheckout` (facultatif) · — | R7, R9 |
| `renonciation_acceptee` | Case « Je demande que la génération commence immédiatement et je reconnais perdre mon droit de rétractation » cochée, puis paiement ou lancement validé ; la preuve va dans `acceptations` | S | `contexte` (`lancement`, `deblocage`), `version_texte` | paiement, lancement | — | R7 |
| `paiement_abandonne` | Webhook `checkout.session.expired` | S | `offre` | — | — | R7 |
| `achat_paye` | Webhook `checkout.session.completed` payé, ou paiement différé confirmé | S | `offre`, `montant_ht_centimes`, `tva_centimes`, `devise`, `moyen` (`carte`, `sepa`, `autre`), `premier_achat` (booléen), `depuis_apercu` (booléen), `periode_prix` | page de confirmation | Meta `Purchase` · Google « Achat particulier » (principale) ; valeur HT en euros | R7 |
| `achat_rembourse` | Webhook `charge.refunded` | S | `offre`, `motif` (`retractation_14j`, `echec`, `defaut_non_corrige`, `geste`), `montant_ht_centimes`, `partiel` (booléen) | — | — · Google : ajustement de la conversion | R7 |
| `litige_ouvert` | Webhook `charge.dispute.created` | S | `offre`, `motif_banque` (code Stripe) | — | — | R7 |
| `retractation_demandee` | Envoi de « Renoncer au contrat ici » | S | `offre`, `plans_non_utilises` | compte | — | R7 |
| `remboursement_demande` | Clic sur « Être remboursé » après un échec, dans E6 ou dans Mon compte (`PARCOURS.md` A15). **Seulement si ce bouton est retenu** ; sinon, la demande par réponse à l'e-mail n'a pas d'événement et seul `achat_rembourse` compte | S | `offre`, `motif` (`echec`, `defaut_non_corrige`) | e-mail E6, compte | — | R7 |
| `credit_expire` | Lot arrivé à expiration avec un reste | S | `source_lot`, `quantite` | — | — | R7 |

### 3.11 Partage, visites et défauts

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `partage_cree` | Lien privé créé par un particulier | S | `type_page` (`apercu`, `visite`), `expiration_j` | galerie, aperçu | — | R8 |
| `partage_canal_choisi` | Clic sur copier, e-mail, SMS, WhatsApp ou partage natif | N (script) | `type_page`, `canal` | app | — | R8 |
| `partage_revoque` | Lien révoqué par son créateur | S | `type_page`, `age` (classe) | compte | — | R8 |
| `partage_ouvert` | Ouverture d'un lien valide (aperçu, visite privée, prospect, acquéreur) | C : `vues_visite`, +1 par lien et par jour | aucune ligne par personne | `visite.<domaine>/a/…` et `/v/…` | — | R8, R10 |
| `partage_cta_clique` | Clic sur le bouton de `partage.invitation` (« Importer mon plan », vers `/offert`) ou sur `partage.pro` (« Vous vendez du neuf ? Essai Sur Pièce Pro », vers `/pro/decouvrir`) d'une page de destinataire (`MESSAGES.md` § 7.8), compté par une redirection. Sur la page d'un prospect, seule la signature « Visite réalisée avec Sur Pièce » mène à `/pro/decouvrir` : pas d'invitation « plan offert » (`PARCOURS.md` § 8.2) | C : `clics_pages_partagees`, par jour, sans identifiant de lien | `cta` (`offert`, `essai_pro`), `type_page` (`apercu`, `visite`, `prospect` ; avec `prospect`, seulement `cta=essai_pro`) | pages de destinataire | — | R8 |
| `lien_expire_ouvert` | Ouverture d'un lien expiré ou révoqué ; message affiché | C : par jour | `type_page`, `motif` (`expire`, `revoque`) | idem | — | R8, R13 |
| `visite_ouverte` | Ouverture de sa visite par le propriétaire (jeton propriétaire émis) | S | `type_plan`, `rang`, `appareil` (`mobile`, `tablette`, `ordinateur`, déduit du navigateur, qui n'est pas conservé) | vue propriétaire | — | R6 |
| `defaut_signale` | Envoi du formulaire « Signaler un défaut » (`MESSAGES.md` § 7.10) | S | `type_defaut` (choix de `defaut.choix`), `piece`, `mode` (dans la visite ; `apercu` pour une image de l'aperçu), `cible` | vue propriétaire, aperçu, espace pro | — | R8 |
| `defaut_traite` | Clôture du signalement par l'équipe. Un défaut de notre fait est toujours corrigé sans frais (arbitrage R14) | S | `issue` (`corrige`, `rembourse`, `non_confirme`), `delai_j_ouvres`, `controle_ajoute` (booléen) | administration | — | R8 |

### 3.12 Conseillers : Sur Pièce Pro

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `essai_pro_demarre` | SIREN vérifié dans l'Annuaire des entreprises, lot « essai » de 3 plans créé | S | `activite`, `effectif` (tranche de l'Annuaire), `source` | formulaire d'essai | Meta `StartTrial` · Google « Essai pro » (principale des campagnes pros) | R9 |
| `siren_refuse` | SIREN inconnu, cessé ou déjà utilisé pour un essai ; message affiché | S | `motif` (`inconnu`, `cesse`, `essai_deja_fait`) | formulaire d'essai | — | R9, R13 |
| `rdv_pro_demande` | Demande de démonstration en visio reçue par l'API | S | `activite`, `source` | `/pro` | Meta `Lead` · Google « Demande de démo » (principale) | R9 |
| `abonnement_demarre` | Premier paiement d'un abonnement confirmé par webhook | S | `formule`, `periodicite`, `montant_ht_centimes`, `depuis_essai` (booléen), `remise` (`aucune`, `fondateurs_30`), `moyen` | — | Meta `Subscribe` · Google « Abonnement » (principale) ; valeur HT de la première période | R9 |
| `abonnement_renouvele` | Facture de renouvellement payée | S | `formule`, `periodicite`, `montant_ht_centimes`, `rang_periode` | — | — | R9 |
| `abonnement_modifie` | Changement de formule ou de périodicité | S | `formule_avant`, `formule_apres`, `sens` (`hausse`, `baisse`) | portail client | — | R9 |
| `abonnement_resilie` | Résiliation demandée | S | `formule`, `anciennete_mois`, `motif` (`prix`, `peu_utilise`, `qualite`, `autre_outil`, `fin_activite`, `autre`, `sans_reponse`), `veille_proposee` (booléen) | portail client | — | R9 |
| `abonnement_termine` | Fin effective de l'abonnement | S | `formule`, `anciennete_mois`, `veille` (booléen) | — | — | R9 |
| `paiement_echoue` | Webhook `invoice.payment_failed` | S | `formule`, `tentative` | — | — | R9 |
| `recharge_payee` | Recharge de 5 plans payée | S | `formule`, `montant_ht_centimes` | espace pro | Meta `Purchase` · Google « Achat pro » (secondaire) | R9 |
| `quota_atteint` | Lancement demandé sans plan disponible ; message affiché | S | `formule`, `jour_du_mois` | espace pro | — | R9, R13 |
| `quota_cloture` | Fin de période : plans utilisés, reportés et perdus | S | `formule`, `plans_inclus`, `plans_utilises`, `plans_reportes`, `plans_perdus` | — | — | R9 |
| `checklist_etape_faite` | Étape de la liste « Pour bien démarrer » faite (`PARCOURS.md` B3) | S | `etape` (`envoi_temoin`, `premier_plan`, `logo_coordonnees`, `premier_lien`), `rang` | espace pro | — | R9 |
| `membre_invite` | Invitation envoyée | S | `role` | espace pro | — | R9 |
| `membre_rejoint` | Invitation acceptée | S | `role` | — | — | R9 |
| `membre_retire` | Membre retiré de l'organisation, ou départ d'un membre ; ses liens restent actifs et sont rattachés à un autre membre (`PARCOURS.md` B8) | S | `role` (celui qu'il avait), `liens_rattaches` (booléen) | espace pro | — | R9 |
| `role_modifie` | Rôle d'un membre changé par un administrateur | S | `role_avant`, `role_apres` (valeurs de `role`) | espace pro | — | R9 |
| `reglage_modifie` | Enregistrement d'un réglage | S | `reglage` (`logo`, `couleurs`, `texte_accueil`, `lien_rdv`, `photos`, `expiration_liens`, `hauteur_defaut`, `vue_accueil`), `formule` | espace pro | — | R9 |
| `couleur_ajustee` | Couleur d'accent refusée pour manque de contraste et remplacée par une teinte plus foncée (`PARCOURS.md` B9, `MARQUE.md` § 9.3) | S | `formule` | espace pro, instance | — | R9, R12 |
| `suivi_consulte` | Tableau de suivi des prospects ouvert (`PARCOURS.md` B6) ; facultatif | S | `formule` | espace pro | — | R10 |
| `suivi_exporte` | Tableau de suivi exporté (formule Cabinet et au-dessus) ; facultatif | S | `formule` | espace pro | — | R10 |
| `autorisation_promoteur_declaree` | Case d'autorisation du promoteur cochée avant le premier lien d'un programme | S | `document_depose` (booléen) | création de lien | — | R10 |
| `lien_prospect_cree` | Lien de visite créé pour un prospect | S | `individuel` (booléen), `expiration_j`, `suivi_detaille` (booléen), `temoin` (booléen : lien sur l'appartement témoin préchargé, `PARCOURS.md` B3), `formule` | espace pro | — | R10 |
| `lien_prospect_copie` | Clic sur copier, e-mail, QR code ou plein écran | N (script) | `canal` | espace pro | — | R10 |
| `lien_prospect_revoque` | Lien révoqué | S | `age` (classe), `ouvertures` (classe : `0`, `1`, `2_5`, `plus_5`) | espace pro | — | R10 |
| `prospect_consentement_choisi` | Choix fait dans le bandeau de la page de visite (suivi détaillé) | S | `choix` (`accepte`, `refuse`) | page de visite du prospect | — | R10 |
| `prospect_interesse` | Clic sur « Je suis intéressé, prévenir mon conseiller » | S | `formule`, `delai_depuis_creation` (classe), `suivi_detaille` (booléen) | page de visite du prospect | — : jamais transmis aux plateformes, le prospect n'est pas notre client | R10 |
| `conseiller_notifie` | E-mail envoyé au conseiller après un intérêt | S | `delai_s` | — | — | R10 |

Le compteur d'ouvertures des liens prospects est `partage_ouvert` (§ 3.11). Le détail (durée, pièces vues) n'est écrit dans `vues_visite_detail` qu'après l'accord du prospect, et n'est pas un événement du journal.

### 3.13 Promoteurs : Sur Pièce Programme

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `contact_promoteur_recu` | Formulaire de demande de démonstration reçu par l'API (`MESSAGES.md` § 3.9) | S | `intention` (`demo`, `rapport` : bouton d'origine ; `autre`), `rapport_demande` (booléen : case « Je veux recevoir aussi le rapport »), `lots_annonces` (`1_49`, `50_199`, `200_plus`, `inconnu` pour « Je ne sais pas encore ») | `/promoteurs` | Meta `Lead` · Google « Contact promoteur » (principale) | R11 |
| `import_cree` | Import d'un programme créé avec ses fichiers | S | `lots_deposes`, `budget_usd` | espace programme | — | R11 |
| `import_termine` | Fin d'un import hors pilote : tous les lots publiés, en échec ou non pris en charge (`PARCOURS.md` C4) | S | `lots_ok`, `lots_echec` | espace programme | — | R11 |
| `lot_valide` | Lot validé par le promoteur, seul ou par la validation groupée (`PARCOURS.md` C5) | S | `groupe` (booléen), `cycle` | espace programme | — | R11 |
| `lot_correction_demandee` | Demande de correction d'un lot par le promoteur | S | `nature` (`defaut` : défaut de notre fait, corrigé sans frais et hors cycles ; `modification` : demande du promoteur, qui compte dans les cycles, arbitrage R14), `type_defaut`, `cycle` | espace programme | — | R11 |
| `lot_corrige` | Lot corrigé et republié après une demande | S | `nature`, `cycle`, `controle_ajoute` (booléen, pour un défaut) | administration | — | R11 |
| `programme_valide` | Tous les lots d'un programme validés | S | `lots`, `cycles` | espace programme | — | R11 |
| `rapport_prise_en_charge_livre` | Rapport de prise en charge envoyé | S | `lots_total`, `lots_pris_en_charge`, `motifs_refus` (comptes par code), `cout_usd` | — | — | R11 |
| `devis_envoye` | Devis saisi et envoyé depuis l'administration | S | `type_devis` (`pilote`, `commande`), `lots`, `montant_ht_centimes` | administration | — | R11 |
| `pilote_signe` | Pilote payé | S | `lots`, `montant_ht_centimes` | administration | — · Google « Contrat promoteur » (secondaire, import hors ligne si un clic d'annonce est connu) | R11 |
| `pilote_livre` | Tous les lots du pilote publiés | S | `lots_ok`, `delai_j_ouvres`, `minutes_humaines_par_lot` (saisies par l'équipe), `cycles_correction` (demandes de modification seulement, arbitrage R14) | — | — | R11 |
| `commande_signee` | Commande signée | S | `lots`, `palier` (`25`, `20`, `15`), `montant_ht_centimes`, `deduction_pilote` (booléen) | administration | — · Google « Contrat promoteur » (idem) | R11 |
| `import_arrete` | Arrêt automatique : coût moyen au-delà de 2,50 $ par lot après 5 lots | S | `lots_faits`, `cout_moyen_usd` | — | — | R11 |
| `domaine_ajoute` | Domaine du promoteur ajouté, avant sa vérification (`PARCOURS.md` C6) | S | `usage` | espace programme | — | R11 |
| `programme_publie` | Lots d'un programme publiés pour l'intégration | S | `lots` | espace programme | — | R11 |
| `integration_copiee` | Code d'intégration copié | S | `portee_integration` (`lot`, `programme`) | espace programme | — | R11 |
| `lien_acquereur_cree` | Lien acquéreur d'un lot créé | S | aucune | espace programme | — | R11 |
| `integration_ouverte` | Chargement d'une visite intégrée au site du promoteur | C : `vues_visite`, par lot et par jour | aucune ligne par personne | iframe | — | R11 |
| `cle_api_creee` | Clé d'API créée | S | `portee` | espace programme | — | R11 |
| `distributeur_autorise` | Distributeur autorisé sur le portail, qui viendra après le premier pilote | S | `activite` (`commercialisateur`, `cgp`) | portail | — | R11 |
| `facture_emise` | Facture promoteur émise ; facultatif si l'outil comptable le suit déjà (`PARCOURS.md` C7) | S | `type_devis` (`pilote`, `commande`), `montant_ht_centimes` | administration | — | R11 |
| `facture_payee` | Facture promoteur payée ; facultatif | S | `type_devis`, `montant_ht_centimes`, `delai_j` | administration | — | R11 |

### 3.14 Codes, partenaires et marque blanche

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `contact_partenaire_recu` | Formulaire de présentation reçu par l'API (`MESSAGES.md` § 4.4) | S | `offre_partenaire` (`codes`, `marque_blanche`, `les_deux`), `activite` | `/marque-blanche` | Meta `Lead` · Google « Contact partenaire » (secondaire) | R12 |
| `codes_achetes` | Lot de codes payé par carte, ou facturé | S | `quantite`, `prix_unitaire_ht_centimes`, `acheteur` (`conseiller`, `partenaire`, `promoteur`), `moyen` | espace pro, administration | Meta `Purchase` · Google « Achat pro » (secondaire) | R12 |
| `code_utilise` | Code saisi par un particulier, lot créé | S | `acheteur`, `delai_depuis_achat` (classe) | page co-marquée | — | R12 |
| `code_refuse` | Code saisi refusé ; message affiché (`PARCOURS.md` D1) | S | `motif` (`inconnu`, `deja_utilise`, `expire`) | page co-marquée | — | R12, R13 |
| `lettre_intention_signee` | Saisie par l'équipe | S | aucune | administration | — | R12 |
| `instance_creee` | Instance de marque blanche mise en place | S | aucune | administration | — | R12 |
| `instance_etape_validee` | Étape de la mise en service d'une instance validée par son contrôle (`PARCOURS.md` D2) | S | `etape` (`contrat`, `domaine`, `marque`, `expediteur`, `bandeau`, `mentions`, `domaines_integration`, `recette`, `mise_en_service`) | administration | — | R12 |
| `domaine_verifie` | Domaine d'un client vérifié et certificat émis | S | `usage` (`visite`, `app`, `parent_integration`) | administration | — | R12 |
| `mention_retrait_active` | Option de retrait de la signature activée | S | aucune | administration | — | R12 |

Les abonnements et recharges d'une instance réutilisent `abonnement_demarre` et `recharge_payee`, avec `formule=marque_blanche`. Chaque ligne du journal porte `instance`.

### 3.15 Erreurs visibles

Un message montré à l'utilisateur vient toujours du catalogue de messages : aucun texte technique n'est montré (`ARCHITECTURE.md` § 1, principe 4). La mesure utilise la clé du catalogue, jamais le texte.

| Nom | Déclencheur exact | Côté | Propriétés | Page ou écran | Meta · Google | Recette |
|---|---|---|---|---|---|---|
| `erreur_affichee` | Affichage d'un message d'erreur ou d'attente du catalogue, ou de la page introuvable | N (script) | `code` (clé de `MESSAGES.md`, liste ci-dessous), `page_type` | toutes les pages avec Umami | — | R13 |
| `visite_chargement_echoue` | La visite ne peut pas s'afficher : WebGL absent, contexte perdu, délai dépassé, fichier manquant | N (moteur) pour la démonstration et le propriétaire ; Sentry, adresse nettoyée du jeton, pour les liens | `contexte`, `cause` (`webgl_absent`, `contexte_perdu`, `delai`, `fichier`) | visite | — | R13 |

**Valeurs de `code`.** La clé du catalogue, écrite telle quelle avec ses points, jamais le texte. La liste permise est tirée du catalogue de messages (L4-05), qui reprend `MESSAGES.md` ; une clé ajoutée au catalogue entre dans le dictionnaire par la même modification. Au 27/09/2026 :

| Écran | Clés (`MESSAGES.md`) |
|---|---|
| Dépôt (§ 7.1) | `depot.refus.format`, `depot.refus.vide`, `depot.refus.lourd`, `depot.refus.petit`, `depot.refus.protege`, `depot.refus.abime`, `depot.refus.pas_un_plan`, `depot.refus.niveaux`, `depot.refus.maison`, `depot.refus.plusieurs_lots`, `depot.refus.perspective`, `depot.refus.illisible` |
| Échelle (§ 7.2) | `echelle.trop_proche`, `echelle.centimetres`, `echelle.hors_plage` |
| Attente (§ 7.4) | `attente.plafond_jour`, `attente.limite_connexion` |
| Fabrication (§ 7.12) | `erreur.lecture`, `erreur.verification`, `erreur.delai`, `erreur.indisponible`, `erreur.interrompu` |
| Connexion et compte (§ 7.12) | `erreur.lien_connexion`, `erreur.email_invalide`, `erreur.email_jetable`, `erreur.verification_humain`, `erreur.offert_deja_utilise`, `erreur.offert_meme_plan`, `erreur.offert_expire`, `erreur.google` |
| Paiement (§ 7.12) | `erreur.paiement_refuse`, `erreur.paiement_interrompu`, `erreur.cases` |
| Liens et visites (§ 7.12) | `erreur.lien_expire`, `erreur.lien_coupe`, `erreur.lien_inconnu`, `erreur.3d`, `erreur.chargement`, `erreur.connexion` |
| Conseillers (§ 7.12) | `erreur.pro.quota`, `erreur.pro.simultanes`, `erreur.pro.siren_essai`, `erreur.pro.siren_inconnu`, `erreur.pro.autorisation`, `erreur.pro.recharge_limite` |
| Pages (§ 7.12) | `erreur.404`, `erreur.500` |
| Repli | `inconnue` : clé absente du dictionnaire, signalée à Sentry. Elle ne doit jamais apparaître ; le contrôle C3 la traque |

Les messages marqués « à ajouter » dans `PARCOURS.md` § 1.6 (plusieurs fichiers, HEIC, plusieurs pages, doublon, plan peu lisible) et les erreurs de code promotionnel (D1) recevront leur clé dans `MESSAGES.md` ; elles entrent ici avec elle.

Côté serveur, les erreurs visibles ont déjà leur événement : `lien_magique_refuse`, `credit_offert_refuse`, `plan_echoue`, `siren_refuse`, `quota_atteint`, `paiement_echoue`, `code_refuse` et le compteur `lien_expire_ouvert`. Les erreurs techniques vont à Sentry, pas au journal.

### 3.16 Événements transmis au site d'un promoteur

Ils sont repris d'`ARCHITECTURE.md` (M5.2). Ce ne sont pas nos mesures : le promoteur les capte avec ses outils, sous sa CMP.

| Message `postMessage` | Quand | Contenu |
|---|---|---|
| `visite:ouverte` | premier rendu de la visite intégrée | référence du lot chez le promoteur |
| `visite:piece` | entrée dans une pièce ; en mode 360°, arrêt atteint (L4-16) | catégorie de pièce |

Envoi limité à l'origine parente déclarée (`domaines.usage = 'parent_integration'`). Aucun script de mesure dans l'iframe.

### 3.17 Conversions envoyées à Meta et Google (phase 3)

| Événement du journal | Meta (CAPI) | Google (Data Manager API, action `UPLOAD_CLICKS`) | Valeur |
|---|---|---|---|
| `compte_cree` | `CompleteRegistration` | « Inscription » (secondaire) | — |
| `plan_lance`, si `source_lot=offert_inscription` | `StartTrial` (`content_category=particulier`) | « Premier plan offert » (secondaire) | — |
| `paiement_ouvert` | `InitiateCheckout` (facultatif) | — | — |
| `achat_paye` | `Purchase` | « Achat particulier » (**principale**) | HT |
| `essai_pro_demarre` | `StartTrial` (`content_category=conseiller`) | « Essai pro » (**principale**) | — |
| `rdv_pro_demande` | `Lead` | « Demande de démo » (**principale**) | — |
| `abonnement_demarre` | `Subscribe` | « Abonnement » (**principale**) | HT de la première période |
| `recharge_payee`, `codes_achetes` | `Purchase` | « Achat pro » (secondaire) | HT |
| `contact_promoteur_recu` | `Lead` | « Contact promoteur » (**principale**) | — |
| `contact_partenaire_recu` | `Lead` | « Contact partenaire » (secondaire) | — |
| `pilote_signe`, `commande_signee` | — | « Contrat promoteur » (secondaire) | HT |
| `achat_rembourse` | — | ajustement de la conversion « Achat particulier » | — |

- **Valeur toujours HT, en euros.** Le retour sur dépense publicitaire se lit ainsi sur ce que l'on garde réellement.
- **Principale ou secondaire.** Les actions « principales » servent aux enchères. Les « secondaires » sont seulement observées.
- **`predicted_ltv` n'est pas envoyé** tant que la durée de vie des abonnés n'est pas mesurée (à établir).
- **Tickets** : L12-01 (Meta) et L12-02 (Google), au lot 12, après le bandeau étendu de L12-03.

---

## 4. Entonnoirs

### 4.1 Deux niveaux

| Niveau | Outil | Ce qu'il voit | Limite |
|---|---|---|---|
| **Avant compte** | Umami (Funnels, Goals) | les visiteurs anonymes, de l'arrivée jusqu'au formulaire | minorant (bloqueurs, DNT, opposition) ; fenêtre en minutes ; pas de filtre sur les propriétés |
| **Après dépôt** | SQL sur le journal (vues `v_entonnoir_*`) | chaque dépôt, chaque plan et chaque compte, exactement, par cohorte hebdomadaire | rien avant `depot_provisoire_recu` |

- **Raccord des deux niveaux** : `depot_envoi_termine` dans Umami compte le même geste que `depot_provisoire_recu` plus `plan_depose` avec `connecte` = vrai et `canal_depot=unitaire` dans le journal. L'écart mesure la part des envois qu'Umami ne voit pas. Cet écart est suivi (§ 5.7), mais les deux sources ne sont jamais jointes.
- **Taux de passage** : la part qui franchit l'étape. **Taux de départ** : la part qui quitte l'entonnoir à l'étape, soit 1 moins le taux de passage.
- **Objectif de départ** : soit un **seuil de décision** d'`OFFRES.md`, soit **« à établir »**. Un objectif « à établir » est fixé après la première période de mesure : 3 semaines, ou environ 150 aperçus (`OFFRES.md` § 9.1).

### 4.2 Particulier

| # | Étape | Mesure | Objectif de départ | Origine |
|---|---|---|---|---|
| 1 | Arrivée sur une page de la vitrine | page vue (Umami) | — | — |
| 2 | Clic vers le dépôt, ou fichier choisi directement | `cta_depot_clique` ou `depot_fichier_choisi` | à établir | — |
| 3 | Fichier envoyé | `depot_envoi_termine` (Umami) ; `depot_provisoire_recu` (journal) | à établir | — |
| 4 | Plan reconnu par l'analyse sans IA | `plan_analyse.resultat` = `reconnu` ou `a_calibrer` (`provisoire` = vrai) | à établir. Part des plans hors périmètre mesurée en T1 | `OFFRES.md` § 9.2 |
| 5 | Compte créé, e-mail vérifié, dépôt rattaché | `compte_cree` ; `plan_depose` (`connecte` = faux) | **perte au-delà de 40 % entre le dépôt et l'e-mail vérifié → proposer Google en premier et montrer « plan reconnu » avant de demander l'e-mail** | T5, `OFFRES.md` § 9.2 |
| 6 | Plan offert lancé | `plan_lance` (`source_lot=offert_inscription`) | à établir | — |
| 7 | Aperçu prêt (vue du dessus et plan 2D publiés) | `apercu_pret` ; sinon `plan_echoue`. Photos : `photos_pretes` | **échecs après lecture sous 20 %**, sinon resserrer la qualification et réserver l'aperçu aux PDF | `OFFRES.md` § 8.11 |
| 8 | Aperçu vu | `apercu_vu` (rang 1) | à établir | — |
| 9 | Verrou cliqué, volet ouvert (lot 8) | `verrou_clique`, `volet_deblocage_ouvert` (Umami) | à établir. Comparaison des variantes du verrou en T4 | `OFFRES.md` § 9.1 |
| 10 | Paiement ouvert (lot 8) | `paiement_ouvert` | à établir | — |
| 11 | Achat dans les 30 jours après l'aperçu (lot 8) | `achat_paye` (`depuis_apercu`) | **au moins 11,1 % à 29 €** (seuil de perte, cas prudent ; 4,8 % au cas bas). En dessous sur 30 jours : coupe-circuit | `OFFRES.md` § 8.8 |
| 12 | Plan suivant ou pack (lot 8) | `achat_paye` (`offre` = `particulier_plan_suivant` ou `particulier_pack_3`) | **pack sous 10 % des ventes → retiré de la page** | `OFFRES.md` § 9.1 |

Pendant la bêta fermée (lot 6), l'entonnoir s'arrête à l'étape 8 : aucun achat n'est proposé (arbitrage R13).

Mesures associées :
- délais médians entre les étapes 3 et 8, puis 8 et 11 ;
- délai entre `apercu_pret` et `photos_pretes`, et part des aperçus avec une photo omise ;
- conversion à 30 jours selon `situation_declaree` (T11) ;
- conversion selon `periode_prix` (T3) ;
- remboursements et rétractations rapportés aux achats.

### 4.3 Conseiller

| # | Étape | Mesure | Objectif de départ | Origine |
|---|---|---|---|---|
| 1 | Arrivée sur `/pro` ou `/pro/decouvrir` | page vue (Umami) | — | — |
| 2 | Clic vers l'essai ou la démonstration | `cta_essai_pro_clique`, `cta_rdv_pro_clique` | à établir | — |
| 3 | Formulaire commencé, puis envoyé | `formulaire_commence`, `formulaire_envoye` (`essai_pro`, `rdv_pro`) | à établir | — |
| 4 | Essai ouvert (SIREN validé) | `essai_pro_demarre` ; refus : `siren_refuse` | à établir | — |
| 5 | Premier plan d'essai lancé, puis prêt | `plan_lance` et `plan_pret` (`source_lot=essai`) | à établir ; échecs sous 20 % | `OFFRES.md` § 8.11 |
| 6 | Premier lien prospect créé | `lien_prospect_cree` | à établir | — |
| 7 | Première ouverture par un prospect | `partage_ouvert` (compteur du lien) | à établir | — |
| 8 | Premier « Je suis intéressé » | `prospect_interesse` | à établir | — |
| 9 | Abonnement | `abonnement_demarre` (`depuis_essai`) | **au moins 25 % des essais** (objectif de la bêta fondateurs). **Sous 10 % : tester la carte demandée à l'essai.** Les essais sont rentables si 1 sur 4 devient Solo pendant un mois | T6 et § 9.1 ; § 8.9 |
| 10 | Rétention aux 2e et 3e mois | `abonnement_renouvele`, `abonnement_resilie` | à établir, mesurée en T6 | — |

Avant le lot 9, il n'y a pas d'essai en ligne (arbitrage R21) : les étapes 2 à 4 se lisent sur la démonstration (`cta_rdv_pro_clique`, `rdv_pro_demande`) et sur la liste d'attente de la bêta fondateurs (`liste_attente_inscrite` avec `cible=conseiller`, L2-18).

Mesures associées :
- plans utilisés rapportés au quota (`quota_cloture`), par formule. Si le coût réel reste sous 2 € par plan, les quotas sont relevés (T8) ;
- passages en formule supérieure ;
- motifs de résiliation.

### 4.4 Promoteur

| # | Étape | Mesure | Objectif de départ | Origine |
|---|---|---|---|---|
| 1 | Arrivée sur `/promoteurs` | page vue (Umami) | — | — |
| 2 | Clic sur un bouton d'appel, puis formulaire envoyé | `cta_promoteur_clique`, `formulaire_envoye` | à établir | — |
| 3 | Contact reçu | `contact_promoteur_recu` | à établir | — |
| 4 | Plans du programme déposés | `import_cree` | à établir | — |
| 5 | Rapport de prise en charge livré | `rapport_prise_en_charge_livre` | délai à établir ; part des lots pris en charge mesurée | T7 |
| 6 | Devis, puis pilote signé | `devis_envoye`, `pilote_signe` | à établir | — |
| 7 | Pilote livré, puis validé | `pilote_livre` ; `lot_valide`, `lot_correction_demandee` (`nature`), `programme_valide` | **5 jours ouvrés** après réception de plans exploitables ; **au plus 5 minutes humaines par lot** ; 2 cycles de modification inclus | `OFFRES.md` § 4.2 et § 8.11 ; `PARCOURS.md` C5 |
| 8 | Commande dans les 3 mois | `commande_signee` | à établir | — |

### 4.5 Codes et marque blanche

| Étape | Mesure | Objectif de départ | Origine |
|---|---|---|---|
| Contact partenaire | `contact_partenaire_recu` | à établir | — |
| Codes achetés, puis utilisés dans les 12 mois | `codes_achetes`, `code_utilise` ; refus : `code_refuse` | taux d'utilisation à établir | — |
| Lettre d'intention, puis instance | `lettre_intention_signee`, `instance_etape_validee`, `instance_creee` | **aucune instance sans lettre signée** | `OFFRES.md` § 5.6 et § 9.1 |

### 4.6 Bouche-à-oreille et moments clés

- **Bouche-à-oreille** (T10). Chaîne mesurée :
  1. `partage_cree` ;
  2. compteur `partage_ouvert` ;
  3. `partage_cta_clique` ;
  4. arrivées sur `/offert` et `/pro/decouvrir` (Umami) ;
  5. `source_declaree` = `proche` ou `client_visite`.
  
  Tous les objectifs sont à établir.
- **Moments clés** (T11). Conversion à 30 jours selon `situation_declaree`. L'hypothèse de `OFFRES.md` est que le délai de rétractation de 10 jours convertit le mieux. Objectif à établir.

### 4.7 Configuration dans Umami

La fenêtre est le délai maximal entre deux étapes (`suivi.md` § 1.1). Les durées ci-dessous sont des valeurs de départ.

| Entonnoir | Étapes | Fenêtre |
|---|---|---|
| Particulier, vitrine vers dépôt | URL `/` → `cta_depot_clique` → `depot_fichier_choisi` → `depot_envoi_termine` → `inscription_ouverte` → `inscription_methode_choisie` | 60 min |
| Démonstration vers dépôt | `demo_ouverte` → `visite_mode_choisi` → `cta_depot_clique` → `depot_envoi_termine` | 60 min |
| Aperçu vers paiement | URL se terminant par `/apercu` → `verrou_clique` → `volet_deblocage_ouvert` → `offre_choisie` → URL se terminant par `/paiement/confirme` | 60 min |
| Conseiller | URL `/pro` → `cta_essai_pro_clique` → `formulaire_commence` → `formulaire_envoye` | 30 min |
| Promoteur | URL `/promoteurs` → `cta_promoteur_clique` → `formulaire_commence` → `formulaire_envoye` | 30 min |
| Bouche-à-oreille | URL `/offert` → `cta_depot_clique` → `depot_envoi_termine` | 60 min |
| Liste d'attente (tant que la vitrine n'ouvre pas le dépôt) | URL `/` → `cta_depot_clique` → `formulaire_commence` → `formulaire_envoye` | 30 min |

**Objectifs (Goals)** : `depot_envoi_termine`, `inscription_methode_choisie`, `formulaire_envoye`, `demo_ouverte`, `offre_choisie`.

**Parcours (Journey)** : départ `/`, arrivée `depot_envoi_termine`, 5 étapes.

**Annotations** : chaque changement de période de prix ou de variante d'un test de textes par périodes, de texte du bandeau, de mise en page de l'accueil, et la bascule du bouton de la liste d'attente vers le dépôt (L6-01, L8-07).

### 4.8 Tests d'`OFFRES.md` § 9 et événements

| Test | Ce qu'il mesure | Événements |
|---|---|---|
| T0 Délai affiché | durées réelles de bout en bout, en rendu logiciel (arbitrage R3) ; aucun délai n'est écrit avant cette mesure (arbitrage R12) | `apercu_pret.duree_s`, `plan_pret.duree_s`, `photos_pretes.duree_s` ; table `etapes` |
| T1 Qualification | faux acceptés, faux refusés | `plan_analyse`, `plan_qualifie`, `plan_echoue` |
| T2 Testeurs | coût complet, échecs, défauts, partages | `plan_lance` (`testeur`), `apercu_pret` ou `plan_pret` selon la variante « bêta » (L0-04), `photos_pretes`, `plan_echoue`, `defaut_signale`, `partage_cree` ; `appels_ia` |
| T3 Conversion de l'aperçu | déblocage, délai, packs | `plan_lance` (`offert_inscription`), `apercu_pret`, `apercu_vu`, `achat_paye`, `apercu_debloque` |
| T4 Verrou | clics, achats selon la variante | `verrou_clique`, `volet_deblocage_ouvert`, `offre_choisie` (Umami, par périodes) ; `achat_paye` (`experience`, `variante` si le test est tiré par compte) |
| T5 Friction du compte | perte entre le dépôt et l'e-mail vérifié | `depot_provisoire_recu`, `inscription_ouverte`, `lien_magique_envoye`, `compte_cree` (`meme_appareil`), `plan_depose` (`connecte` = faux) |
| T6 Conseillers | essai vers abonnement, consommation, intérêts, résiliations | § 4.3 |
| T7 Promoteurs | délai, minutes par lot, cycles, conversion | § 4.4 |
| T8 Coût réel | coût par plan sur les 100 premiers, toutes passes et relances comprises (arbitrage R6) | `apercu_pret.cout_ia_usd`, `plan_pret.cout_ia_usd`, `appels_ia` |
| T9 Codes et marque blanche | premier partenaire, lettre d'intention | § 4.5 |
| T10 Bouche-à-oreille | partages et arrivées | § 4.6 |
| T11 Moments clés | conversion selon la situation | `situation_declaree`, `achat_paye` |
| Fluidité de la visite (D12 ; numéro de test à attribuer dans `OFFRES.md` § 9.2) | images par seconde par classe d'appareil et niveau de qualité ; seuils de L1-14 | `visite_fluidite_mesuree` (si retenu) ; banc `outils/fluidite.mjs` en recette |
| Coût du 360° (D15) | temps de rendu SwiftShader des panoramas par plan, coût d'un aperçu offert en 360° | `panoramas_prets.duree_s`, table `etapes` ; mesure de L1-16 |

**Règles des tests (arbitrage R8, `OFFRES.md` § 9.1, `PARCOURS.md` § 7.1).**
- **Prix : seulement par périodes successives**, avec le même prix pour tous pendant une période (3 semaines ou environ 150 aperçus). Jamais un prix différent tiré au sort par personne, connectée ou non (L221-5). La période est portée par la version d'offre du catalogue (`periode_prix`) et notée en annotation dans Umami (L8-06).
- **Textes vus par des visiteurs anonymes : par périodes** aussi (A, puis B, puis A), sans cookie de cohorte ; l'outil de la CNIL range les cohortes hors de l'exemption.
- **Textes vus par des comptes connectés : tirage possible côté serveur**, sur l'identifiant du compte (L12-05). L'affectation est écrite dans la table `affectations` ; les événements du journal de l'étape testée portent `experience` et `variante`. Rien de tout cela n'est envoyé à Umami, dont le réglage minimal n'admet pas de cohorte (§ 1.2). Base légale à faire valider par l'avocat (`PARCOURS.md` § 8.3, question 7).
- Un seul test à la fois par étape de l'entonnoir.

### 4.9 Liste d'attente et bêta fermée

Tant que la vitrine est en liste d'attente, « Importer mon plan » mène au formulaire de la liste. Pendant la bêta fermée (lot 6), le dépôt est réservé aux invités, sans achat (arbitrage R13) ; l'ouverture à tous vient avec L8-07.

| # | Étape | Mesure | Objectif de départ | Origine |
|---|---|---|---|---|
| 1 | Formulaire de la liste envoyé | `formulaire_envoye` (`liste_attente`, Umami) ; `liste_attente_inscrite` (journal) | à établir | — |
| 2 | Inscription confirmée par le lien de l'e-mail | `liste_attente_confirmee` ; `email_envoye` (`liste_attente_confirmation`) | à établir | — |
| 3 | Invité à la bêta | `email_envoye` (`invitation_beta`) | 10 à 20 invités pour la première vague (proposition de L6-10, à décider) | L6-10 |
| 4 | Compte créé, plan lancé | `compte_cree`, `plan_lance` (`source_lot=testeur`) | à établir | T2 |
| 5 | Plan livré | `apercu_pret` ou `plan_pret`, puis `photos_pretes` | **échecs après lecture sous 20 %, coût moyen sous 2 $ par plan**, sinon revoir la qualification et les prix avant J1 | `OFFRES.md` § 9.2 (T2) |

Désinscriptions : `liste_attente_quittee`.

---

## 5. Tableaux de bord

### 5.1 Outils

- **Audience** : un tableau composé (Board) dans Umami.
- **Tableaux métier** : vues SQL agrégées sur le journal et les tables métier, lues par un utilisateur en lecture seule. Deux options, à décider (§ 8) :
  - **Metabase** auto-hébergé. C'est une application Java : sa mémoire est à mesurer sur la VM ;
  - la page d'administration prévue par `ARCHITECTURE.md` § 9.4.
- **Accès.**
  - Les tableaux lisent des **vues agrégées** : aucune ligne par personne.
  - Le détail par compte reste dans l'administration, dont chaque accès laisse une trace dans `journal_equipe`.
  - Les comptes marqués `exclu_statistiques` sont retirés des vues.
- **Rythme.** Mise à jour quotidienne. Un tableau hebdomadaire par cohorte est envoyé par e-mail à l'équipe.

### 5.2 Acquisition

| Indicateur | Source | Détail |
|---|---|---|
| Visites, visiteurs, pages d'arrivée, pages vues | Umami | par jour et par semaine ; par type de page |
| Provenance | Umami | origines des référents ; UTM pour la part consentie |
| Intérêt pour les contenus | Umami | `section_vue`, `page_defilee`, `faq_ouverte` : sections vues, profondeur, questions les plus ouvertes |
| Clics sur les boutons d'appel, par emplacement | Umami | `cta_*_clique` ventilés par `emplacement` |
| Taux de consentement (dès que le bandeau existe, arbitrage R18) | journal | `consentement_enregistre` : part des choix « publicité » et « mesure enrichie » acceptés |
| Liste d'attente de la bêta | journal | inscriptions, confirmations, désinscriptions, par profil (`cible`) |
| Inscriptions, essais, contacts | journal | par cible, par canal attribué (premier et dernier contact) et par source déclarée |
| Coût d'acquisition par canal | journal et dépenses | dépenses publicitaires (saisie mensuelle, puis API des plateformes) divisées par les inscriptions, essais et achats attribués ; à partir de la phase 3 |
| Bouche-à-oreille | compteurs, journal | partages, ouvertures, clics sur les pages de destinataire, sources `proche` et `client_visite` |

### 5.3 Activation

| Indicateur | Source |
|---|---|
| Entonnoirs du § 4, par cohorte hebdomadaire, avec les taux de passage et de départ | vues `v_entonnoir_particulier`, `v_entonnoir_conseiller`, `v_entonnoir_promoteur` |
| Refus à l'analyse, par motif | `plan_analyse` |
| Friction du compte (T5) | `depot_provisoire_recu` → `plan_depose` (`connecte` = faux), avec `compte_cree` (`meme_appareil`) |
| Délais : dépôt → aperçu prêt → photos prêtes → aperçu vu → achat (médiane et 9e décile) | journal (`depot_provisoire_recu`, `apercu_pret`, `photos_pretes`, `apercu_vu`, `achat_paye`) |
| Pros : essai → premier plan → premier lien → première ouverture → premier intérêt | journal, compteurs |
| Usage de la démonstration et de la visite : modes, pièces, durée | Umami |

### 5.4 Revenu

| Indicateur | Source | Remarque |
|---|---|---|
| Chiffre d'affaires HT par jour, semaine et mois, par offre | `achat_paye`, `abonnement_*`, `recharge_payee`, `codes_achetes`, `commande_signee` | rapproché chaque jour avec Stripe (invariants d'`OFFRES.md` § 6.6) |
| Revenu récurrent mensuel des pros | `abonnements` | l'annuel est ramené au mois ; par formule |
| Nouveaux abonnés, résiliations, passages en formule supérieure ou inférieure | `abonnement_*` | taux de résiliation mensuel par cohorte |
| Revenu par canal (attribué et déclaré) | journal et `attribution` | premier contact et dernier contact non direct, côte à côte |
| Remboursements, rétractations, litiges | `achat_rembourse`, `retractation_demandee`, `litige_ouvert` | montant et motif |
| Crédits expirés sans usage | `credit_expire` | du chiffre sans coût |
| Ventes selon la période de prix | `periode_prix` | tests par périodes successives seulement (`OFFRES.md` § 9.1, arbitrage R8, § 4.8) |

### 5.5 Coûts IA et marge par offre

| Indicateur | Calcul |
|---|---|
| Coût IA par plan : moyenne, médiane, 9e décile, maximum | `appels_ia` par travail, qualification et appels interrompus compris |
| Plans arrêtés au plafond de 3 $ | nombre et part ; le plafond compte toutes les passes et relances d'un plan (arbitrage R6) |
| Coût par compte et par organisation | `appels_ia` rapporté au compte qui a lancé : on sait qui consomme quoi (D3) |
| Coût des échecs | coût IA des travaux `plan_echoue`, imputé à la source du lot |
| Coût d'un aperçu offert | coût IA des aperçus (réussis et échoués) + rendu des 4 images (vue du dessus, plan 2D, 2 photos) et, si le 360° devient l'offre gratuite (à confirmer, L1-16), rendu des panoramas (environ 10 par plan), divisé par les aperçus livrés (`apercu_pret`) |
| Seuil de perte de l'aperçu, recalculé | coût réel d'un aperçu ÷ marge réelle d'un déblocage, comparé à la conversion réelle à 30 jours (`OFFRES.md` § 8.8) |
| Budget de la clé `prod-gratuit` | dépense du jour ÷ plafond du jour ; jours où le plafond est atteint. Cette clé ne sert qu'aux plans offerts des particuliers ; les essais pros passent par la clé `prod-payant` et le budget de leur organisation (arbitrage R23) |
| Marge brute par offre | CA HT − frais Stripe réels − coût IA réel des plans consommés par l'offre (échecs compris) − rendu et stockage |
| Marge d'une formule pro au coût réel | par formule, avec le taux de consommation réel du quota |
| Marge promoteur | prix du lot − coût IA − minutes humaines × 50 € de l'heure (hypothèse d'`OFFRES.md` § 8.1) |

Conventions de calcul :
- **Frais Stripe** : lus dans les transactions de solde.
- **Rendu et stockage** : 0,15 € et 0,05 € par plan tant qu'ils ne sont pas mesurés (`OFFRES.md` § 8.1) ; panoramas et précalculs compris dès qu'ils existent (mesures de L1-16, L4-13, L4-14).
- **Change** : on affiche deux colonnes, au taux réel du mois et à 1 $ = 1 € (cas prudent).

### 5.6 Qualité

| Indicateur | Source | Objectif de départ |
|---|---|---|
| Échecs après lecture, par étape et par cause | `plan_echoue` | **sous 20 %** (`OFFRES.md` § 8.11) |
| Résultat de la visite de contrôle : ok, réparé, bloqué ; défauts trouvés par type | `controle_termine` | à établir |
| Défauts signalés pour 100 plans publiés, par type | `defaut_signale` | à établir |
| Délai de traitement d'un défaut | `defaut_traite` | **5 jours ouvrés** (`OFFRES.md` § 2.6) |
| Part des défauts confirmés devenus un contrôle automatique | `defaut_traite.controle_ajoute` | **100 %** (`CLAUDE.md`) |
| Crédits rendus, par motif | `credit_rendu` | à établir |
| Remboursements et litiges, par motif | `achat_rembourse`, `litige_ouvert` | tout litige : analyse de cause (`OFFRES.md` § 8.11) |
| Durée de bout en bout (médiane, 9e décile) comparée au délai affiché | `apercu_pret.duree_s`, `plan_pret.duree_s`, `photos_pretes.duree_s` | délai affiché mesuré en T0 ; aucun délai écrit avant (arbitrage R12) |
| Images omises après nouvelles tentatives | `photos_pretes.omises` | à établir ; chaque omission alerte l'équipe (arbitrage R2) |
| Erreurs affichées, par code | `erreur_affichee` (Umami) | à établir |
| Visites qui ne s'affichent pas | `visite_chargement_echoue`, Sentry | à établir |
| Liens expirés ouverts | `lien_expire_ouvert` | à établir |
| Fluidité : images par seconde (médiane et 1er décile) par classe d'appareil, niveau de qualité retenu | `visite_fluidite_mesuree` (Umami, si retenu) | seuils de L1-14 (D12 : fluide sur appareil modeste) |
| Contrôles bloquants en échec avant réparation, par type (`etancheite`, `baie`, `garde_corps`…) | `controle_termine.controles` | à établir |
| Plans refusés au-delà de deux niveaux, par nombre de niveaux | `plan_analyse` (`motif_refus=plusieurs_niveaux`, `niveaux`) | à établir ; sert à décider l'ouverture du triplex |
| Panoramas omis | `panoramas_prets.omis` | à établir ; chaque omission alerte l'équipe |

### 5.7 Anti-abus et santé de la mesure

- **Plans offerts** (`auth-paiement.md` § 3.5) :
  - attribués par jour ;
  - refusés ou mis en attente, par motif ;
  - répartis par domaine d'e-mail (vue agrégée).
- **Écart entre Umami et le journal** sur les dépôts (`depot_envoi_termine` face à `depot_provisoire_recu` plus `plan_depose` avec `connecte` = vrai) : sa hausse brutale signale un défaut de marquage.
- **Volumes par type d'événement.** Un type clé (`depot_provisoire_recu`, `compte_cree`, `apercu_pret`, `plan_pret`, puis `achat_paye` à partir du lot 8) à zéro pendant 24 h déclenche une alerte.
- **Propriétés rejetées** par la validation en production : relevées par Sentry.
- **Envois publicitaires** (phase 3) : part envoyée, ignorée sans consentement, en erreur, hors délai.

### 5.8 Alertes (e-mail)

| Alerte | Seuil | Origine |
|---|---|---|
| Coût IA moyen sur 30 jours | plus de 2 $ par plan | `OFFRES.md` § 8.11 |
| Coût d'un plan | plafond de 3 $ atteint (arrêt propre, toutes passes et relances confondues, arbitrage R6) | idem |
| Image omise après nouvelles tentatives | chaque omission | arbitrage R2 ; `photos_pretes.omises` |
| Échecs après lecture | plus de 20 % | idem |
| Conversion de l'aperçu sur 30 jours (après 150 aperçus) | sous 11,1 % à 29 € | idem |
| Marge brute d'une formule pro au coût réel | sous 50 % | idem |
| Minutes humaines par lot promoteur | plus de 5 | idem |
| Litige bancaire | dès le premier | idem |
| Type d'événement clé à zéro | 24 h | § 5.7 |
| Envois publicitaires en erreur (lot 12) | seuil à établir | § 2.11, L12-01, L12-02 |

Les alertes de supervision (workers, file, plafonds OpenRouter, grand livre) sont celles d'`ARCHITECTURE.md` § 9.4.

---

## 6. Consentement

### 6.0 Quand le bandeau apparaît (arbitrage R18)

- **Aucun bandeau** tant qu'Umami reste en réglage minimal exempté (§ 1.2) et qu'aucun autre traceur non exempté n'est chargé. C'est le cas au lancement de la mesure : la vitrine et l'application n'ont alors que les traceurs nécessaires et Umami minimal.
- **Le bandeau arrive dès qu'un traceur non exempté est activé** : UTM enrichis dans Umami, relecture de session, cookie d'attribution ou toute mesure publicitaire. Il est posé **avant** l'activation, dans la même mise en production.
- Décision à confirmer par l'utilisateur en L0-05. `MESSAGES.md` § 7.13 suit cette règle (UTM enrichis, relecture, publicité).
- Conséquences tant qu'il n'y a pas de bandeau : pas d'UTM dans Umami, pas de relecture, pas de cookie `attr`, pas d'attribution captée (§ 2.9), aucun événement `consentement_enregistre`. La provenance vient de la seule source déclarée (§ 2.10) et des origines de référents d'Umami.

### 6.1 Recommandation : tarteaucitron.js

**tarteaucitron.js, version gratuite, hébergée chez nous** (`suivi.md` § 6), installé seulement au moment fixé par le § 6.0.

Pourquoi :
- **Aucun tiers** : ni script externe, ni transfert.
- **Fonctions utiles** : il gère les signaux du Consent Mode v2 de Google, pour le jour où une balise serait chargée (phase 3b), et il accepte des services déclarés à la main.
- **Adapté à notre architecture.** Nos envois publicitaires partent du serveur. Le bandeau n'a donc qu'à recueillir le choix et prévenir notre serveur ; tarteaucitron suffit.
- **Aucun coût par domaine**, ce qui compte pour la marque blanche. La version Pro coûte 190 € HT par an, pour des statistiques de consentement dont on n'a pas besoin : notre table `consentements` les donne.
- **Style entièrement à nous** (feuille de style externe), ce qui permet de respecter `MARQUE.md` § 10.2 : « Refuser » et « Accepter » ont le même style, la même taille et la même place.

Autres options :
- **Axeptio** (à partir de 7 € par mois et par domaine, CMP certifiée Google) si l'on veut une console hébergée avec preuves et statistiques, ou si une CMP certifiée devient nécessaire avec une balise Google. L'obligation pour un annonceur n'est pas vérifiée (`suivi.md` § 6).
- **Didomi** (sur devis) si un promoteur l'impose.

**Réglages** (noms d'options à vérifier sur la version retenue) :
- `highPrivacy: true` : aucun consentement implicite ;
- `DenyAllCta: true` et `AcceptAllCta: true` ;
- `handleBrowserDNTRequest: true` ;
- `cookieName` neutre ;
- icône de réouverture ;
- lien « Gestion des traceurs » dans le pied de page (`MESSAGES.md` § 8.2) ;
- durée du choix fixée à 6 mois. Si l'option n'existe pas, le serveur repose la question au-delà ;
- bandeau lisible et utilisable au clavier à 320 px de large (arbitrage R10).

### 6.2 Catégories

| Catégorie | Sert à | Outils | Consentement | Durée |
|---|---|---|---|---|
| **Nécessaires** | Connexion, sécurité, anti-abus du plan offert, mémoriser le choix | Cookie de session (`app.`), jeton anti-falsification, Cloudflare Turnstile à l'inscription, identifiant d'appareil aléatoire (sans empreinte), cookie du choix, cookie d'opposition | non (exemptés) | session ; choix : 6 mois ; opposition : 13 mois |
| **Mesure d'audience anonyme** | Statistiques de fréquentation et d'usage | Umami, réglage minimal | non : exemption CNIL, avec opposition par un lien | aucun cookie ; données 25 mois |
| **Mesure enrichie** | Savoir quelles campagnes et quels partenaires amènent des visites ; relecture sur un échantillon de la vitrine | Umami (UTM, `recorder.js`) | **oui** | données 25 mois ; relectures 30 jours |
| **Publicité** | Savoir quelles annonces amènent des inscriptions et des achats | Cookie `attr` ; envois Meta et Google depuis notre serveur | **oui** | 90 jours |
| **Publicité personnalisée** (phase 3b seulement) | Remarketing, audiences | Pixel Meta, balise Google en mode basique | **oui** | selon les plateformes, à documenter |

- Pour Turnstile et l'identifiant d'appareil, l'exemption repose sur la sécurité. Elle est à confirmer avec l'avocat, avec l'analyse d'exemption (§ 8).
- Sentry dans le navigateur (sans cookie, sans relecture, adresse nettoyée) est à qualifier de la même façon.

### 6.3 Ce qui tourne sans consentement

- Umami, réglage minimal. Chemins en gabarit, sans requête, référent réduit, respect de DNT, GPC et de l'opposition.
- Le journal `evenements`. Il ne lit rien sur le terminal au-delà de la session. Base légale : exécution du contrat ou intérêt légitime, avec information et droit d'opposition (`exclu_statistiques`).
- Les compteurs agrégés des liens, des intégrations et des pages de destinataire.
- La question « Comment nous avez-vous connu ? », qui est une réponse volontaire.
- Les traceurs nécessaires du § 6.2.

**Ce qui ne tourne jamais sans consentement :**
- les UTM dans Umami, la relecture et les cartes de chaleur ;
- le cookie `attr` et la conservation des identifiants de clic ;
- tout envoi vers Meta ou Google ;
- tout pixel ou toute balise publicitaire ;
- le suivi détaillé d'un prospect.

### 6.4 Texte du bandeau

**Le texte est celui de `MESSAGES.md` § 7.13**, qui fait foi pour les textes : titre « Vos choix sur ce site », boutons « Tout refuser » et « Tout accepter » de même style, lien « Choisir » vers le panneau des finalités, note sur la conservation du choix pendant 6 mois. À faire relire par l'avocat. L'ancien texte proposé ici est retiré.

Correspondance entre le panneau « Choisir » de `MESSAGES.md` et les finalités techniques du § 6.2 :

| Ligne du panneau (`MESSAGES.md` § 7.13) | Finalités techniques |
|---|---|
| Nécessaires au service | nécessaires |
| Mesure d'audience anonyme (avec la case « Je m'oppose à cette mesure ») | mesure d'audience anonyme ; l'opposition pose `opposition_mesure` |
| Provenance et publicité | `publicite` et la partie UTM de `mesure_enrichie` |
| aucune à ce jour | relecture de session (`recorder.js`) : **elle reste désactivée** tant que `MESSAGES.md` n'a pas de ligne qui la décrit |

- Fermer le bandeau vaut refus.
- Le lien « Gestion des traceurs », dans chaque pied de page, rouvre le bandeau.

### 6.5 Branchement

Chaque service déclaré dans tarteaucitron (`mesure_enrichie`, `publicite`, puis `publicite_personnalisee`) a deux fonctions de rappel. Tant que le panneau de `MESSAGES.md` réunit provenance et publicité sur une seule ligne, un seul choix règle `publicite` et la partie UTM de `mesure_enrichie`.

**À l'acceptation :**
1. `window.choixTraceurs.<finalité> = true` ;
2. POST `/api/consentement` avec la finalité, la version du bandeau et la référence du navigateur. Le serveur écrit une ligne `consentements` et l'événement `consentement_enregistre` ;
3. pour `publicite` : captation de l'attribution sur la page courante (§ 2.9) ;
4. pour `mesure_enrichie` : UTM transmis par le filtre `avantEnvoi` ; chargement de `recorder.js`, sur la vitrine seulement, quand la relecture aura sa propre ligne dans le panneau (§ 6.4).

**Au refus ou au retrait :**
1. `window.choixTraceurs.<finalité> = false` ;
2. POST `/api/consentement` ;
3. suppression de `attr`. Pour un compte, le serveur efface les identifiants de clic et arrête les envois.

**Référence du navigateur.** Un identifiant aléatoire, rangé dans le cookie du choix, relie les preuves anonymes. À l'inscription, les preuves de ce navigateur sont rattachées au compte.

**Paramètres du compte.** Les mêmes interrupteurs existent dans le compte, avec l'origine `parametres`.

### 6.6 Pages de visite des prospects, intégrations, marque blanche

- **Page de visite d'un prospect** (liens avec `suivi_detaille`, formules Cabinet et Équipe, `OFFRES.md` § 3.4) :
  - **un seul choix** : « Autoriser [nom du conseiller] à voir combien de temps vous avez regardé ce logement et quelles pièces ? » avec [Refuser] et [Autoriser], de même style ;
  - le conseiller est responsable de traitement, et nous sommes sous-traitant ;
  - sans accord, seuls le compteur agrégé et le bouton « Je suis intéressé » fonctionnent ;
  - le choix est gardé dans un cookie sur `visite.<domaine>`, qui ne porte aucun autre cookie.
- **Intégration chez un promoteur** : aucun bandeau de notre part et aucun script de mesure. Le promoteur mesure les messages `postMessage` sous sa CMP.
- **Marque blanche** : un bandeau par domaine, aux textes du client. Le client est responsable de traitement ; ses choix sont séparés des nôtres.

### 6.7 Information et registre

**Politique de confidentialité** : les finalités du § 6.2, les durées du § 2.12, le lien d'opposition à Umami, la question « Comment nous avez-vous connu ? », et le droit de s'opposer au suivi d'usage du compte.

**Registre** (`juridique.md` § 3.1) : trois traitements.
- mesure d'audience (exemption, avec l'analyse du § 1.3) ;
- suivi d'usage et statistiques du service (journal) ;
- publicité : consentement, responsabilité conjointe avec Meta, avenant à signer avant la phase 3.

---

## 7. Mise en œuvre et recette

Toutes les charges sont **estimées et non mesurées**, pour une personne. Elles reprennent `suivi.md` § 7.8, plus le marquage du dictionnaire complet.

### 7.1 Phase 1 : bases prêtes à brancher, avec la vitrine et le socle

Tickets : L2-14 (marquage de la vitrine), L5-15 (journal), L6-08 (pages `/offert` et `/pro/decouvrir`).

Contenu :
1. **Dictionnaire en code**, dans un seul fichier (`mesure/evenements.json`) :
   - noms, propriétés et valeurs du § 3 ;
   - il est lu par `mesure()`, `avantEnvoi` et `journal.ecrire()`.
2. **Vitrine marquée** :
   - `data-page` sur `body`, `data-section` sur les sections, `data-question` sur la FAQ ;
   - `data-umami-event` et `data-umami-event-emplacement` sur tous les boutons d'appel ;
   - `mesure()` pour la zone de dépôt, les onglets, la FAQ, les sections, le défilement et les formulaires.
   
   Sans le script Umami, tout cela est inerte et ne coûte rien.
3. **Filtre `avantEnvoi`**, **fonctions `mesure()` et `mesureUneFois()`**, en fichiers servis depuis notre domaine.
4. **Journal** :
   - table `evenements` avec les colonnes du § 2.8 ;
   - `journal.ecrire()` avec validation ;
   - premiers événements : liste d'attente, dépôt provisoire, analyse, compte, génération (`apercu_pret`, `plan_pret`, `photos_pretes`), crédits.
5. **Pages `/offert` et `/pro/decouvrir`**, et redirections comptées des pages de destinataire.
6. **Contrôles automatiques** du § 7.4, branchés dans la CI.
7. **Écart à signaler au moteur** (§ 2.7) : l'émission de `visite:evenement`, faite par L7-04 en petit diff coordonné avec l'agent qui travaille sur `moteur/`.

Critère de fin :
- R1 et R3 passent contre une instance Umami de recette ;
- R5 passe sans aucun appel payant ;
- C1 à C5 passent en CI.

Charge : 2 à 4 jours (`suivi.md` § 7.8), plus 1 à 2 jours pour le dictionnaire complet.

### 7.2 Phase 2 : lancement de la mesure (lot 7, jalons J1 et J2 d'`OFFRES.md` § 7.3)

Tickets : L7-01 à L7-08. Les événements Stripe suivent le lot 8, ceux des pros les lots 9 à 11.

Contenu :
1. **Umami en production** (§ 2.5), réglage minimal : sous-domaine, purge à 25 mois, lien d'opposition, deux comptes nominatifs, analyse d'exemption rédigée (L7-08).
2. **Question « Comment nous avez-vous connu ? »**, sans traceur, sur l'écran d'attente.
3. **Bandeau, tables `consentements` et `attribution`, cookie `attr`** : **pas au lancement** (arbitrage R18, § 6.0). Ils sont livrés par L7-02 et L7-03 dans la mise en production qui active le premier traceur non exempté (UTM enrichis, relecture ou publicité). Décision à confirmer en L0-05.
4. **Événements Stripe** (lot 8) : achat, abonnement, remboursement, litige, rétractation.
5. **Événements pros** (lots 9 à 11) : compteurs agrégés, bandeau du prospect, « Je suis intéressé ».
6. **Entonnoirs, objectifs et annotations dans Umami** (§ 4.7).
7. **Tableaux de bord** du § 5, en version 1, et **alertes** du § 5.8.

La file `envois_publicitaires` n'est pas créée ici : elle appartient à L12-01 et L12-02 (§ 2.11).

Critère de fin :
- R1 à R6, R8, R13, R16 et R17 passent ; R7 et R9 à R12 s'ajoutent avec leurs lots (8 à 11) ; R14 passe dès que le bandeau existe ;
- après le lot 8, le rapprochement quotidien avec Stripe est juste pendant 7 jours de suite en préproduction.

Charge : 3 à 5 jours (`suivi.md` § 7.8), plus les tableaux de bord.

### 7.3 Phase 3 : campagnes Meta et Google

Tickets : L12-01 (Meta et socle de la file `envois_publicitaires`), L12-02 (Google), L12-03 (consentement étendu), L12-04 (premières campagnes), L12-05 (tests A/B).

Prérequis :
- bandeau en place avec la finalité « publicité » (§ 6.0, L7-02, L12-03) ;
- avenant de responsabilité conjointe avec Meta ;
- politique de confidentialité à jour ;
- vérification de la catégorie spéciale « Housing » de Meta sur les premières annonces (`suivi.md` § 4.4).

Contenu :
1. **Meta** : jeu de données (pixel) dans le gestionnaire d'événements, jeton d'accès d'un utilisateur système au gestionnaire de secrets, envoi CAPI (§ 2.11).
2. **Google** :
   - projet Google Cloud et Data Manager API ;
   - actions de conversion `UPLOAD_CLICKS` du § 3.17, principales et secondaires ;
   - envoi par lots toutes les heures.
3. **Table `envois_publicitaires` et tâche d'envoi** (L12-01, L12-02) : d'abord alimentée avec `ignore_sans_consentement` ou `a_envoyer` **sans envoi**, pour vérifier la logique ; puis relances, idempotence, expiration à 7 jours pour Meta, `contexte_navigateur` purgé à 7 jours.
4. **Modèles d'URL** avec les UTM du § 2.9 dans les deux plateformes.
5. **Dépenses publicitaires** : saisie mensuelle pour le coût d'acquisition, puis lecture par API si le volume le justifie.
6. **Phase 3b**, seulement si le remarketing le justifie :
   - pixel et balise en mode basique, chargés après la finalité « publicité personnalisée » ;
   - `fbp` ajouté aux envois ;
   - déduplication par `eventID` ;
   - vérification du besoin d'une CMP certifiée Google.

Critère de fin : R15 passe en mode test des deux plateformes. Ensuite seulement, les premières annonces sont diffusées.

Charge : 3 à 5 jours (`suivi.md` § 7.8).

### 7.4 Contrôles automatiques (permanents)

Selon la règle « tout défaut trouvé devient un contrôle automatique » (`CLAUDE.md`).

| # | Contrôle | Quand | Bloquant |
|---|---|---|---|
| C1 | Tout nom trouvé dans le code (`data-umami-event=`, `mesure(`, `journal.ecrire(`) respecte le motif du § 3.1, fait 50 caractères au plus et figure dans `mesure/evenements.json` | chaque modification | oui |
| C2 | `mesure/evenements.json` et les tableaux du § 3 de ce document contiennent les mêmes noms (le test lit la première colonne des seuls tableaux dont l'en-tête est « Nom », § 3.4 à § 3.15) ; les valeurs de `code` et de `modele` sont comparées aux tableaux des § 3.15 et § 3.8 | chaque modification | oui |
| C3 | `journal.ecrire()` refuse, en test, un type inconnu, une propriété imprévue ou une valeur hors liste | chaque modification | oui |
| C4 | Tests du filtre `avantEnvoi` : jetons, UUID et identifiants remplacés ; requête retirée sans consentement ; UTM seuls avec consentement ; aucun identifiant de clic ; titre générique hors de la vitrine ; rien si GPC ou opposition | chaque modification | oui |
| C5 | Parcours automatisés (puppeteer, comme `moteur/controle.mjs`) qui interceptent chaque envoi à Umami. Ils vérifient : nom au dictionnaire, propriétés et valeurs prévues, aucune valeur qui ressemble à un e-mail, un UUID, un jeton, un numéro de téléphone, un SIREN ou un titre de plan de test, aucune chaîne de requête sans consentement | chaque modification ; chaque déploiement | oui |
| C6 | Aucune requête vers Umami, ni aucun script de mesure, sur `/v/`, `/a/` et `/i/` ; la CSP de `visite.<domaine>` n'autorise pas `m.<domaine>` hors de la vue propriétaire | chaque publication (avec la visite de contrôle) | oui |
| C7 | Invariants de mesure : chaque `plan_lance` se termine par `apercu_pret` (aperçu) ou `plan_pret` (plan complet), ou par `plan_echoue` et `credit_rendu`, dans les délais d'`OFFRES.md` § 6.4 ; chaque `apercu_pret` et chaque `plan_pret` sont suivis d'un `photos_pretes` avant le délai maximal des images (L5-11), et, dès que le 360° est en service (L5-27), d'un `panoramas_prets` ; aucun `apercu_pret` ni `plan_pret` sans `controle_termine` réussi ; chaque `achat_paye` a son lot de crédits ; chaque envoi a un `consentement_id` valide (lot 12) | toutes les heures en production | alerte |
| C8 | Aucun envoi publicitaire pour un compte sans accord « publicité » actif au moment du fait | chaque modification ; chaque jour en production | oui ; alerte |

### 7.5 Scénarios de recette

Chaque événement du § 3 renvoie à au moins un scénario.

| # | Scénario | Événements attendus | Vérification |
|---|---|---|---|
| R1 | Vitrine, sans bandeau (réglage minimal) : accueil, défilement jusqu'en bas, chaque section, deux questions de FAQ, chaque bouton d'appel à chaque emplacement, onglets des tarifs, formulaire pro envoyé vide puis rempli, sur les adresses de `MESSAGES.md` (`/appartement-temoin`, `/marque-blanche`…). Même parcours de `<domaine>` vers `app.<domaine>` | page vue, `cta_*_clique`, `section_vue` (une fois), `page_defilee` (4 seuils, une fois chacun), `faq_ouverte`, `tarifs_onglet_choisi`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` | Interception par le parcours automatisé (C5) et vue en temps réel d'Umami. Vérifier que le lien suit toujours après un clic marqué par attribut (§ 2.5), et que la session continue entre les deux hôtes (§ 2.6) |
| R2 | Démonstration ouverte depuis l'accueil puis depuis le volet ; trois modes (quatre avec le 360°, L4-16) ; deux pièces ; une photo ; plein écran ; si `visite_fluidite_mesuree` est retenu, 20 s en mode visite avec le processeur ralenti ×4 (`qualite` descendue) ; fermeture de l'onglet | `demo_ouverte` (bon `emplacement`), `visite_mode_choisi` (une fois par mode), `visite_piece_vue`, `visite_photo_ouverte`, `visite_plein_ecran`, `visite_quittee` | Interception ; `visite_quittee` reçu à la fermeture (sinon, le retirer du dictionnaire) |
| R3 | Dépôts, sans compte puis connecté : PDF de référence, image PNG, fichier `.docx`, fichier vide, deux fichiers d'un coup, photo HEIC, fichier de 45 Mo, envoi coupé (hors ligne), image non plan, PDF protégé, PDF de plusieurs pages avec changement de page, même plan déposé deux fois dans un compte, cote de calibration, alerte laissée après un refus | `depot_fichier_choisi`, `depot_fichier_refuse` (chaque motif), `depot_envoi_termine`, `depot_envoi_echoue`, `depot_provisoire_recu` (sans compte), `plan_depose` (connecté), `plan_analyse` (chaque `motif_refus`, `provisoire`), `page_pdf_changee`, `depot_doublon`, `plan_calibre`, `alerte_prise_en_charge_demandee` | Interception ; requête SQL sur `evenements` ; l'analyse est sans IA, donc sans coût |
| R4 | Compte : lien magique (e-mails capturés localement, par exemple avec Mailpit), code ouvert sur un autre appareil que celui du dépôt, Google (compte de test), lien expiré, domaine jetable, même e-mail normalisé deux fois, même plan offert depuis un autre compte, quatrième plan offert depuis la même IP, questions de source et de situation, suppression du compte | `inscription_ouverte`, `inscription_methode_choisie`, `lien_magique_envoye`, `lien_magique_refuse`, `compte_cree` (`meme_appareil`), `plan_depose` (`connecte` = faux, au rattachement du dépôt provisoire), `session_ouverte`, `credit_offert_attribue`, `credit_offert_refuse` (chaque motif), `source_declaree`, `situation_declaree`, `compte_supprime`, `email_envoye` (`bienvenue`) | SQL ; après suppression, vérifier que les identifiants sont à `null` |
| R5 | Génération sans payer, en rendu logiciel : lecture rejouée à partir de `reponse-ia.json` (`outils/finalise.sh`, `PLAN_MOCK`, chaîne sans IA de la CI), en aperçu puis en plan complet ; échecs simulés (budget à 0, refus 402 simulé, contrôle bloquant sur un plan de test abîmé exprès, tâche orpheline, vue du dessus impossible, une photo en échec ; dès L5-27, un panorama en échec, `omis` = 1, sans échec du travail) ; rejeu par l'équipe | `plan_qualifie` (réponse gardée, dont `peu_lisible`), `plan_lance`, `controle_termine` (`ok`, `repare`, `bloque`), `apercu_pret`, `plan_pret`, `photos_pretes` (`omises` = 1 pour la photo en échec, sans échec du travail), `plan_echoue` (chaque cause simulée, dont `rendu_images`), `credit_rendu`, `plan_rejoue`, `email_envoye` (`apercu_pret`, `visite_prete`, `echec`) | SQL ; invariants C7 ; aucune ligne `appels_ia` payante |
| R6 | Aperçu : ouverture, clic sur chaque élément verrouillé, volet, choix des deux offres ; vue propriétaire d'une visite ; téléchargements | `apercu_vu`, `verrou_clique` (chaque `element`), `volet_deblocage_ouvert`, `offre_choisie`, `visite_ouverte`, `visite_chargee`, `visite_mode_choisi`, `fichier_telecharge` | Interception et SQL ; le contrôle existant confirme que la page d'aperçu ne charge ni `engine.js` ni `plan.json` |
| R7 | Paiement Stripe en mode test (lot 8) : réussite, carte refusée, session expirée, déblocage, pack, remboursement, litige (carte de test prévue par Stripe), « Renoncer au contrat ici », lot expiré (horloge de test), bouton « Être remboursé » s'il est retenu | `paiement_ouvert`, `renonciation_acceptee`, `paiement_abandonne`, `achat_paye`, `apercu_debloque` (sans nouvelle lecture ni nouveau rendu), `achat_rembourse`, `remboursement_demande`, `litige_ouvert`, `retractation_demandee`, `credit_expire`, `erreur_affichee` (`erreur.paiement_refuse`), `email_envoye` (`recu`, `ouverture_immediate`, `accuse_renonciation`, `rappel_expiration_30j`) | Stripe CLI (`stripe listen`, `stripe trigger`) ; webhook rejoué deux fois → une seule ligne (`cle_idempotence`) ; rapprochement avec Stripe |
| R8 | Partage : lien d'aperçu (`/a/`) et de visite (`/v/`), chaque canal, ouverture dans une fenêtre privée, clic sur les deux boutons de la page de destinataire, révocation, ouverture du lien révoqué et d'un lien expiré ; signalement d'un défaut (chaque choix de `defaut.choix`, depuis la visite et depuis l'aperçu) puis clôture | `partage_cree`, `partage_canal_choisi`, compteur `partage_ouvert` +1, compteur `partage_cta_clique`, `partage_revoque`, compteur `lien_expire_ouvert`, `defaut_signale`, `defaut_traite`, `email_envoye` (`defaut_recu`, `defaut_corrige`, `defaut_non_retrouve`) | SQL sur les compteurs ; **zéro requête vers Umami sur `/v/` et `/a/`** (C6) ; arrivée sur `/offert` vue par Umami |
| R9 | Pro (lot 9) : SIREN valide, inconnu, déjà utilisé ; essai et liste « Pour bien démarrer » ; abonnement mensuel et annuel ; montée de formule ; résiliation avec motif ; paiement échoué ; recharge ; quota atteint ; fin de mois (horloge de test Stripe) ; invitation, retrait d'un membre, changement de rôle ; réglages, dont une couleur trop claire | `essai_pro_demarre`, `siren_refuse`, `rdv_pro_demande`, `checklist_etape_faite`, `abonnement_*`, `paiement_ouvert` (`formule`), `paiement_echoue`, `recharge_payee`, `quota_atteint`, `quota_cloture`, `membre_invite`, `membre_rejoint`, `membre_retire`, `role_modifie`, `reglage_modifie`, `couleur_ajustee`, `formulaire_refuse`, `email_envoye` (`essai_debut`, `essai_fin_proche`, `invitation_membre`) | SQL et Stripe en mode test |
| R10 | Liens prospects : case d'autorisation du promoteur, création (dont un lien sur le témoin), copie, ouverture par le prospect sans choix, avec refus, avec accord ; « Je suis intéressé » ; tableau de suivi ouvert et exporté ; révocation | `autorisation_promoteur_declaree`, `lien_prospect_cree` (`temoin`), `lien_prospect_copie`, `partage_ouvert`, `prospect_consentement_choisi`, `prospect_interesse`, `conseiller_notifie`, `email_envoye` (`interet_prospect`), `suivi_consulte`, `suivi_exporte`, `lien_prospect_revoque` | Sans accord : aucune ligne dans `vues_visite_detail`. Avec accord : durée et pièces écrites. Aucun script de mesure sur la page |
| R11 | Promoteur (lot 10) : formulaire, import des plans de référence et d'un plan non pris en charge, rapport, devis, pilote, livraison, validation d'un lot, demande de correction (un défaut, puis une modification), validation du programme, domaine ajouté puis vérifié, publication, code d'intégration copié, commande et factures (administration), arrêt simulé d'un import, intégration sur une page parente de test, clé d'API | `contact_promoteur_recu`, `import_cree`, `import_termine`, `rapport_prise_en_charge_livre`, `devis_envoye`, `pilote_signe`, `pilote_livre`, `lot_valide`, `lot_correction_demandee` (`nature`), `lot_corrige`, `programme_valide`, `domaine_ajoute`, `programme_publie`, `integration_copiee`, `commande_signee`, `facture_emise`, `facture_payee`, `import_arrete`, `lien_acquereur_cree`, compteur `integration_ouverte`, `cle_api_creee`, `distributeur_autorise` | La page parente reçoit `visite:ouverte` et `visite:piece` ; aucun script de mesure dans l'iframe |
| R12 | Codes et marque blanche (lot 11) : achat de codes en mode test, code utilisé, code inconnu, déjà utilisé et expiré, instance sur un domaine de test et chaque étape de sa mise en service, domaine vérifié, couleur ajustée, retrait de la mention | `contact_partenaire_recu`, `codes_achetes`, `code_utilise`, `code_refuse` (chaque motif), `lettre_intention_signee`, `instance_etape_validee`, `instance_creee`, `domaine_verifie`, `couleur_ajustee`, `mention_retrait_active` | SQL ; colonne `instance` renseignée |
| R13 | Erreurs : chaque clé du tableau du § 3.15 déclenchée ; page introuvable ; visite sans WebGL (Chrome lancé sans les API 3D), qui se replie sur les images et le plan 2D (repli sur la visionneuse 360° : à décider) | `erreur_affichee` (chaque `code`, dont `erreur.404` et `erreur.3d`), `visite_chargement_echoue` ; côté serveur, les événements d'erreur des R3 à R12 | Interception ; aucun texte technique à l'écran (contrôle existant) |
| R14 | Consentement et attribution, **dès que le bandeau existe** (§ 6.0) : arrivée avec UTM, gclid et fbclid ; refus → pas de `attr`, URL sans requête dans Umami ; acceptation → `attr` rempli, UTM seuls dans Umami ; inscription par Google, puis par lien magique ouvert dans un autre navigateur ; retrait | `consentement_enregistre`, `compte_cree` (`attribution=avec`), ligne `attribution` (premier et dernier contact, `fbc` bien formé, casse du fbclid intacte), identifiants de clic effacés au retrait | Outils de développement du navigateur (cookies), interception, SQL |
| R15 | Envois (phase 3) : chaque conversion du § 3.17 en mode test ; compte sans accord ; plateforme indisponible (simulée) ; fait de plus de 7 jours | Lignes `envois_publicitaires` : `envoye`, `ignore_sans_consentement`, `erreur` puis `envoye`, `ignore_hors_delai` | Meta : « Tester les événements » avec `test_event_code`, qualité de correspondance. Google : mode de validation de la Data Manager API (champ `validateOnly`, à confirmer dans la référence), puis diagnostic des conversions importées |
| R16 | Confidentialité, automatique | C1 à C8 | CI et production |
| R17 | Liste d'attente et bêta fermée : formulaire envoyé vide puis rempli, e-mail de confirmation (Mailpit), confirmation, lien réutilisé, désinscription ; invitation à la bêta ; compte et premier plan d'un invité ; bouton de dépôt avant et après la bascule | `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` (`liste_attente`), `liste_attente_inscrite`, `liste_attente_confirmee`, `liste_attente_quittee`, `email_envoye` (`liste_attente_confirmation`, `invitation_beta`), `compte_cree`, `plan_lance` (`testeur`), `cta_depot_clique` | SQL ; aucune adresse e-mail dans le journal ni dans Umami ; aucun prix ni paiement proposé pendant la bêta (arbitrage R13) |

### 7.6 Tester sans payer

Aucune recette de la mesure ne demande de lecture payante (règle du projet).
- **Génération** : rejouée depuis les lectures gardées (`reponse-ia.json`, `outils/finalise.sh`, `PLAN_MOCK`), comme la chaîne sans IA de la CI (`ARCHITECTURE.md` § 9.5).
- **Paiements** : Stripe en mode test, avec ses cartes de test, son CLI et ses horloges de test.
- **Plateformes publicitaires** : mode test de Meta, validation de Google.
- **Plans** : seulement le témoin fictif en CI. Les plans réels de l'utilisateur ne quittent pas le poste de l'équipe ni la préproduction, et n'apparaissent dans aucune capture ni aucun rapport de recette.

---

## 8. Décisions attendues et points à valider

**Déjà tranché :**
- **Umami** auto-hébergé dans l'UE pour mesurer ; Meta, Google et le paiement plus tard (décision D9).
- **Bandeau** : aucun tant qu'Umami reste en réglage minimal exempté, dès le premier traceur non exempté ensuite (arbitrage R18, § 6.0). Reste à le confirmer en L0-05.
- **Tests de prix** par périodes seulement (arbitrage R8, § 4.8).
- **Adresses** de la vitrine : celles de `MESSAGES.md` (arbitrage R9, § 2.6).

**Décisions de l'utilisateur, attendues en L0-05 :**
1. **Umami sur les écrans de l'application**, de façon anonyme (§ 2.6). C'est un écart assumé avec `suivi.md` § 7.1.
2. **Question « Comment nous avez-vous connu ? » sur l'écran d'attente** (recommandé), et éventuellement « Où en êtes-vous ? » au même endroit (§ 2.10, levier L3 de `PARCOURS.md`).
3. **Outil des tableaux de bord** : Metabase auto-hébergé, ou vues SQL et page d'administration (§ 5.1).
4. **Respect de GPC** en plus de DNT (recommandé ; coût nul).
5. **Bouton « Être remboursé »** en un clic, ou réponse à l'e-mail E6 : il décide si `remboursement_demande` existe (§ 3.10).

**Décisions de l'utilisateur liées au 27/09/2026 :**
6. **Mesure de la fluidité en production** (`visite_fluidite_mesuree`, `qualite`, classes d'images par seconde) : oui ou non ; seuils et appareils de référence (L1-14).
7. **Offre gratuite en 360°** : remplace, enrichit ou non l'aperçu de R1, sur le coût de rendu mesuré (L1-16). Selon la réponse, `apercu_arret_vu` entre ou non au dictionnaire.
8. **Repli sans WebGL** sur la visionneuse 360° (scénario R13).
9. **Propriétés `niveaux` et `controles`** proposées pour `plan_analyse` et `controle_termine`.

**À valider par l'avocat :**
- l'analyse d'exemption d'Umami (écran Sessions, arrondi) ;
- l'exemption de Turnstile, de l'identifiant d'appareil et de Sentry dans le navigateur ;
- le texte du bandeau ;
- le bandeau du prospect et le statut « ouvert » d'un lien individuel (`OFFRES.md`, annexe B, question 5) ;
- l'avenant de responsabilité conjointe avec Meta ;
- la durée de 5 ans pour le journal.

**À aligner dans `ARCHITECTURE.md`**, que ce document ne modifie pas :
- les noms d'événements de l'annexe A ;
- les colonnes ajoutées à `evenements` (§ 2.8) et à `envois_publicitaires` (§ 2.11) ;
- les tables `clics_pages_partagees` et `contexte_navigateur` ;
- Umami sur `app.` et sur la vue propriétaire ;
- l'émission `visite:evenement` du moteur (§ 2.7) ;
- § 2.3, point 9 : fait le 27/09/2026 (`apercu_pret` pour un aperçu, `plan_pret` pour une visite, puis `photos_pretes`), ainsi que le commentaire de `evenements.type` (noms de l'annexe A) et `geste_commercial` au § 4.2.

**À aligner dans `MESSAGES.md`** (textes), que ce document ne modifie pas :
- § 7.13 : fait pour le déclencheur du bandeau (arbitrage R18) ; reste une ligne du panneau « Choisir » pour la relecture, si elle est activée un jour (§ 6.4) ;
- textes manquants pour les e-mails de la liste d'attente, de l'invitation à la bêta et de l'invitation d'un collègue (§ 3.8) ;
- clés pour les messages « à ajouter » de `PARCOURS.md` § 1.6 et pour les refus de code (§ 3.15).

**À aligner dans `PARCOURS.md`**, qui renvoie à ce dictionnaire pour les événements (fait le 27/09/2026) :
- § 0 et § 1.6 : `plan_pret` (`source_lot=offert_inscription`) devient `apercu_pret` ; `plan_depose` avant le compte devient `depot_provisoire_recu` ;
- A15 : la ligne « Photos restantes en retard après un déblocage » (`photos_completees`) ne vaut qu'avec la galerie complète (L13-02) ;
- A14 : `offre` = `particulier_plan_suivant`, et non plus `plan_suivant_15`.

**À aligner dans les tickets** (sections « Mesure ») : fait le 27/09/2026 pour la liste ci-dessous :
- L5-23, L6-01 : à la réception, le dépôt anonyme écrit `depot_provisoire_recu`, et non plus `plan_depose` ; `plan_depose` (`connecte` = faux) est écrit au rattachement ;
- L5-11, L5-12 : `apercu_pret`, `photos_pretes`, `etape=images` et `cause=rendu_images` au lieu de `photos` et `rendu_photos` ;
- L6-09, L10-03 : `type_defaut` suit maintenant les choix de `defaut.choix` ;
- L8-03 : `modele` = `ouverture_immediate`, `accuse_renonciation` ; L5-14, L9-02 : `bienvenue`, `echec`, `defaut_*`, `essai_debut`, `essai_fin_proche` ;
- L8-01, L8-06, L5-08, L9-01, L11-04 : `offre` et `formule` sont des codes du catalogue (`particulier_visite`…), et non plus `plan_29` ou `solo` ;
- L12-05 : `experience` et `variante` vont au journal seulement, jamais dans Umami ;
- L10-05 : `distributeur_autorise` porte `activite`, et non plus `role`.

**À vérifier sur la version installée d'Umami** (recette R1) :
- le comportement des écouteurs sur un élément marqué par attribut ;
- la continuité de session entre sous-domaines ;
- la forme de `url` et de `type` dans le filtre ;
- le filtrage des propriétés dans les entonnoirs ;
- les noms des tables à purger.

---

## Annexe A. Correspondance avec les noms provisoires

Les noms ci-dessous figuraient dans `suivi.md` et `ARCHITECTURE.md`. Les noms de droite suivent la règle `objet_action`.

| Nom provisoire | Nom retenu |
|---|---|
| `cta-deposer-plan` | `cta_depot_clique` |
| `depot-fichier-choisi` | `depot_fichier_choisi` |
| `depot-envoye` | `depot_envoi_termine` |
| `inscription-ouverte` | `inscription_ouverte` |
| `inscription-ok` | côté navigateur : `inscription_methode_choisie` ; la création du compte est `compte_cree` (serveur) |
| `paiement-ouvert` | `offre_choisie` (navigateur) et `paiement_ouvert` (serveur) |
| `visite-demo-ouverte` | `demo_ouverte` |
| `contact-promoteur-envoye` | `formulaire_envoye` (`formulaire=contact_promoteur`) |
| `plan_echec` | `plan_echoue` |
| `plan_rembourse` | `credit_rendu` (crédit) ou `achat_rembourse` (argent) |
| `achat_credits` | `achat_paye` |
| `demande_demo_conseiller` | `rdv_pro_demande` |
| `contact_promoteur` | `contact_promoteur_recu` |
| tables `evenement`, `consentement`, `envoi_publicitaire` | `evenements`, `consentements`, `envois_publicitaires` |
| cookie `vp_attr` | `attr` (sans nom de produit) |

Les événements `compte_cree`, `plan_depose`, `plan_lance`, `plan_pret`, `visite_ouverte`, `abonnement_demarre`, `abonnement_renouvele` et `abonnement_resilie` gardent leur nom.

**Changements du 27/09/2026** (alignement sur les décisions et arbitrages). Aucun de ces noms n'était encore écrit dans le code :

| Avant | Après |
|---|---|
| `plan_depose` écrit pour un dépôt anonyme | `depot_provisoire_recu` ; `plan_depose` seulement quand une ligne `plans` existe (au rattachement, `connecte` = faux) |
| `plan_pret` avec `type_plan=apercu` | `apercu_pret` ; `plan_pret` ne sert plus qu'au plan complet |
| propriété `photos` de `plan_pret` | événement `photos_pretes` (`photos`, `omises`) |
| `etape=photos`, `cause=rendu_photos` de `plan_echoue` | `etape=images`, `cause=rendu_images` (une photo manquante n'est plus un échec) |
| `type_defaut` : `trou`, `fente`, `texture_noire`, `equipement_absent`, `equipement_mal_oriente`, `cote_mal_reprise`, `porte_inversee`… | les choix de `MESSAGES.md` : `trou_ou_fente`, `zone_noire`, `equipement_oublie_ou_mal_oriente`, `cote_differente`… ; `texte_technique` reste pour le contrôle seul |
| `code` d'erreur : `depot_format_inconnu`, `plan_offert_indisponible`, `page_introuvable`… | clés de `MESSAGES.md` : `depot.refus.format`, `erreur.offert_deja_utilise`, `erreur.404`… |
| `modele` : `credit_rendu`, `confirmation_renonciation` | `echec` ; `ouverture_immediate` et `accuse_renonciation` |
| `offre` : `plan_29`, `deblocage_29`, `plan_suivant_15`, `pack_3_59` ; `formule` : `solo`… | codes du catalogue : `particulier_visite`, `particulier_plan_suivant`, `particulier_pack_3` ; `pro_solo`… (le déblocage se lit par `depuis_apercu`) |
| `intention` : `pilote` | `demo` (bouton « Demander une démonstration ») |
| `onglet` : `conseiller`, `promoteur`, `mensuel`, `annuel` | `particulier`, `professionnel` (les onglets de `MESSAGES.md` § 5.1) |
| `role` de `distributeur_autorise` | `activite` (`role` désigne le rôle d'un membre) |
| adresses `/demo`, `/partenaires` | `/appartement-temoin`, `/marque-blanche` ; `page_type` inchangé |

## Sources

Les faits externes (Umami, CNIL, Meta, Google, CMP, prix) viennent de `produit/recherche/suivi.md`, qui cite ses sources primaires et signale ce qui n'a pas été vérifié. Documents internes utilisés :
- `produit/recherche/` : `suivi.md`, `juridique.md`, `auth-paiement.md`, `hebergement.md`, `audit-code.md`, `marche.md` ;
- `produit/OFFRES.md`, `produit/ARCHITECTURE.md`, `produit/MARQUE.md`, `produit/MESSAGES.md`, `produit/PARCOURS.md` ;
- les tickets `tickets/`, lus le 27/09/2026 pour leurs sections « Mesure » et leurs demandes d'ajout au dictionnaire ;
- les décisions de l'utilisateur et les arbitrages du coordinateur du 27/09/2026 ;
- `CLAUDE.md` ;
- code relevé le 27/09/2026 : motifs de refus (`pipeline/serveur.py`) et modes de la visite (`moteur/ui.js`). Le travail sur les niveaux (fini le 27/09/2026, non commité) a modifié ces fichiers : onglets de niveau, arrêt « Escalier ».
