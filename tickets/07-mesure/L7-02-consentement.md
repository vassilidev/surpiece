# L7-02 · Bandeau de consentement

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P0 | M (1 à 3 j) | L7-01 | `site/`, `service/` | À faire |

## Pourquoi
Tout ce qui dépasse la mesure anonyme demande un consentement préalable, aussi simple à refuser qu'à accepter, prouvable et retirable (recherche/juridique.md § 3.7) : UTM dans Umami, relecture de session, cookie d'attribution, envois vers Meta et Google (SUIVI.md § 6.3). Tranché (R18, à confirmer en L0-05) : **aucun bandeau** tant qu'Umami reste dans son réglage minimal exempté (L7-01, L7-08) ; le bandeau arrive dès qu'un traceur non exempté est activé (UTM enrichis, relecture de session, publicité). Ce ticket construit et teste le mécanisme, puis le met en service avec le premier traceur non exempté. Outil retenu : tarteaucitron.js gratuit, hébergé chez nous, sans tiers (§ 6.1).

## À faire
1. **tarteaucitron.js**, version figée, copiée dans `site/` et servie depuis nos domaines (aucun CDN) ; feuille de style à nous (MARQUE.md § 10.2 : « Refuser » et « Accepter » de même style, même taille, même place).
2. **Réglages** (noms à vérifier sur la version retenue, SUIVI.md § 6.1) : `highPrivacy: true`, `DenyAllCta`, `AcceptAllCta`, `handleBrowserDNTRequest`, nom de cookie neutre, icône de réouverture, durée du choix de 6 mois (sinon, le serveur repose la question au-delà).
3. **Catégories** (SUIVI.md § 6.2, MESSAGES.md § 7.13) : nécessaires (toujours actives) ; mesure d'audience anonyme (active, opposition possible) ; **mesure enrichie** (UTM dans Umami, relecture sur la vitrine) ; **publicité** (cookie `attr`, envois serveur plus tard). Le panneau n'affiche que les finalités réellement activées. « Publicité personnalisée » n'est pas déclarée avant la phase 3b.
   - **Mise en service** : un réglage unique active le bandeau ; un contrôle automatique refuse d'activer une finalité non exemptée (mesure enrichie, publicité) tant que le bandeau n'est pas en service.
4. **Textes** : ceux de MESSAGES.md § 7.13, qui font foi pour les textes, relus par l'avocat (L0-07). Fermer le bandeau vaut refus. Lien « Gestion des traceurs » dans chaque pied de page : vers `/traceurs` tant qu'il n'y a pas de bandeau, puis réouverture du bandeau. Le bandeau ne recouvre jamais la zone de dépôt (PARCOURS.md A1).
5. **Rappels** de chaque service déclaré (SUIVI.md § 6.5) :
   - acceptation : `window.choixTraceurs.<finalité> = true` ; `POST /api/consentement` (finalité, version du bandeau, référence du navigateur) ; pour `publicite`, captation de l'attribution sur la page courante (L7-03) ; pour `mesure_enrichie`, UTM transmis par le filtre `avantEnvoi` et chargement de `recorder.js` **sur la vitrine seulement** (échantillon 0,15, masquage strict, 5 min au plus, conservation 30 jours) ;
   - refus ou retrait : `choixTraceurs.<finalité> = false`, `POST /api/consentement`, suppression de `attr`.
6. **Table `consentements`** (schéma de recherche/suivi.md § 7.4) : une ligne par choix, en ajout seul, conservée 5 ans ; route `/api/consentement` avec validation fermée des finalités ; référence de navigateur aléatoire rangée dans le cookie du choix, puis rattachée au compte à l'inscription.
7. **Paramètres du compte** : mêmes interrupteurs dans « Mon compte », origine `parametres` ; au retrait de « publicité », le serveur efface les identifiants de clic du compte et marque qu'aucun envoi ne doit partir.
8. **Pages sans bandeau** : pages de partage privé, intégrations chez un promoteur (aucun traceur) ; le bandeau du prospect est celui du lot 9.
9. Mise à jour de la politique de confidentialité et de la politique de traceurs (L2-11) : finalités, durées (SUIVI.md § 2.12), lien d'opposition, base légale du journal.

## Critères d'acceptation
- [ ] Réglage minimal seul : aucun bandeau sur la vitrine ni dans l'application, lien « Gestion des traceurs » vers `/traceurs` ; activation de la mesure enrichie : bandeau affiché avant tout dépôt de traceur (R18).
- [ ] Scénario R14 (SUIVI.md § 7.5) en puppeteer : refus → aucun cookie `attr`, URL sans requête dans Umami ; acceptation de la mesure enrichie → UTM seuls dans Umami ; retrait → `attr` effacé et nouvelle ligne `consentements`.
- [ ] Refuser demande exactement autant de clics qu'accepter (test) ; les deux boutons ont les mêmes styles calculés.
- [ ] Aucun script publicitaire ni requête vers Meta ou Google, avant comme après acceptation (interception).
- [ ] `recorder.js` jamais chargé sur `app.<domaine>` ni `visite.<domaine>` (interception).
- [ ] Choix gardé 6 mois ; au-delà, la question revient (horloge simulée).
- [ ] Bandeau utilisable au clavier et lisible à 320 px ; contrôle des textes (L1-04) passé.

## Mesure
- S : `consentement_enregistre` (`mesure_enrichie`, `publicite`, `version_bandeau`, `origine` : `bandeau`, `parametres`, `retrait`).

## Points d'attention
- **Tranché : R18.** Aucun bandeau tant qu'Umami est en réglage minimal exempté ; il arrive avec le premier traceur non exempté (UTM enrichis, relecture, publicité). Décision confirmée en L0-05 ; SUIVI.md § 7.2 s'y aligne.
- **Textes et catégories** : MESSAGES.md § 7.13 fait foi (hiérarchie des sources) : boutons « Tout refuser · Tout accepter », lien « Choisir », finalités « Mesure enrichie » et « Publicité » séparées, lien de pied de page « Gestion des traceurs ». SUIVI.md § 6.4 renvoie désormais à ces textes.
- Relecture de session : même sur un échantillon de la vitrine, elle est hors exemption ; ne l'activer qu'avec le consentement et le masquage strict.
- Exemption du cookie d'appareil anti-abus, de Turnstile et de Sentry dans le navigateur : à confirmer par l'avocat (SUIVI.md § 6.2, § 8).
- La version Pro de tarteaucitron (190 € HT par an) n'apporte que des statistiques de consentement, déjà données par notre table.

## Références
- SUIVI.md § 1.2, § 2.12, § 6, § 7.2, § 7.5 (R14), § 8 ; MESSAGES.md § 7.13 ; MARQUE.md § 10.2 ; PARCOURS.md A1.
- recherche/suivi.md § 6 ; recherche/juridique.md § 3.7.

## Hors périmètre
- Cookie `attr` et recopie sur le compte : L7-03. Consentement publicitaire étendu, pixel et balise : L12-03.
- Bandeau de la page d'un prospect : L9-04.
