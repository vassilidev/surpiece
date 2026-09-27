# L6-08 · Partage de la visite et bouche-à-oreille

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P1 | M (1 à 3 j) | L5-13 | `service/`, `site/` | À faire |

## Pourquoi
L'acquéreur montre son futur logement au conjoint, à la famille, à son conseiller : c'est la valeur perçue et le bouche-à-oreille (OFFRES.md § 2.7, test T10). Deux objets se partagent : l'**aperçu** gratuit (images seulement, 30 jours) et la **visite** (jusqu'à la fin de l'hébergement). Les deux liens sont privés, non indexés, révocables, sans traceur et sans la superposition du plan du promoteur (PARCOURS.md A13). Les jetons, la révocation et le compteur agrégé existent (L5-13) ; ce ticket construit les écrans et la page du destinataire.

## À faire
1. **Lien d'aperçu** (bloc `apercu.partage.*` de la page d'aperçu, L6-05) : un clic crée un partage de type lien vers la publication d'aperçu, expiration 30 jours, lecture seule ; `apercu.partage.copie` annoncé après la copie ; « Couper le lien » disponible.
2. **Volet « Partager la visite »** (plans complets seulement) : textes à ajouter à MESSAGES.md avant de coder (PARCOURS.md A13) :
   - « Pour qui ? (visible par vous seul) » → `partages.libelle` ;
   - durée : 30 jours · 6 mois · jusqu'à la fin de l'hébergement ;
   - action principale **« Créer le lien »**, puis « Copier le lien » et « Envoyer… » (partage natif du téléphone en premier, e-mail, SMS) ;
   - liste des liens : libellé, date, « Copier », « Couper le lien » ;
   - règle affichée : lien privé, non référencé, coupable à tout moment, pour ses proches, pas de publication sur un réseau social ni dans une annonce.
3. **Page du destinataire** `visite.<domaine>/v/<jeton>` (MESSAGES.md § 7.8) :
   - aperçu partagé : cartouche, images, plan 2D, surfaces, points à faire confirmer, `partage.mention`. **Même règle que L6-05** : ni moteur ni `plan.json`, et ni prix ni bouton de déblocage (ce n'est pas le plan du destinataire) ;
   - visite partagée : `partage.bandeau`, `partage.entrer`, visite servie comme en L5-12, sans superposition ;
   - en bas : `partage.invitation` et son bouton `partage.invitation.bouton`, vers `/offert` ; en pied discret : `partage.pro`, vers `/pro/decouvrir` ;
   - sur les pages créées par un conseiller (lot 9) : ni invitation ni prix, seulement la signature `prospect.signature`.
4. **Sans traceur** : aucun script de mesure sur `/v/` (ni Umami, ni Sentry, ni police ou bibliothèque tierce), `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store` pour la page et les données (ARCHITECTURE.md § 6.2).
5. **Comptage** : ouverture → +1 par lien et par jour dans `vues_visite` (L5-13). Clic sur l'invitation ou sur le lien pro → redirection par une route serveur qui incrémente `clics_pages_partagees` (par jour, `cta` et `type_page`, **sans identifiant de lien**) puis renvoie vers `/offert` ou `/pro/decouvrir`.
6. **Pages d'arrivée génériques** `/offert` (particulier) et `/pro/decouvrir` (pro), identiques pour tous et sans jeton (SUIVI.md § 2.6) : aucun ticket ne les crée. Les faire ici, dans `site/`, avec les composants de la vitrine (L2-01) : `/offert` reprend le premier écran de l'accueil (dépôt, plan offert, limites) ; `/pro/decouvrir` renvoie à la page conseillers (L2-05) ; avant les lots 9 à 11, elle propose un entretien ou la bêta fondateurs (L2-18), jamais un essai en ligne (R21). Adresses canoniques de MESSAGES.md § 0.9 (R9), pages indexées (R20).
7. **Liens expirés, coupés, inconnus** : `erreur.lien_expire`, `erreur.lien_coupe`, `erreur.lien_inconnu`, rien d'autre n'est révélé ; compteur `lien_expire_ouvert`.
8. **Page d'aide** : un conseiller qui veut réutiliser la visite d'un client pour ses prospects est orienté vers l'offre Pro (licence d'usage privé, OFFRES.md § 2.7) ; avant les lots 9 à 11, vers un entretien ou la bêta fondateurs (R21).

## Critères d'acceptation
- [ ] Scénario R8 (SUIVI.md § 7.5) joué par puppeteer sur le témoin en `PLAN_MOCK` : création, chaque canal, ouverture dans un contexte privé (+1 au compteur du jour, une seule fois par jour), clics sur les deux boutons (compteur agrégé sans identifiant de lien), révocation puis ouverture (message du catalogue en moins d'une seconde), lien expiré.
- [ ] **Zéro requête** vers le domaine de mesure ou un tiers pendant l'ouverture de `/v/` (interception puppeteer, contrôle C6 de SUIVI.md § 7.4) ; en-têtes du point 4 présents.
- [ ] Aperçu partagé : le contrôle de L6-05 (ni `engine.js` ni `plan.json`, aucun texte technique, aucune image cassée) passe aussi sur la page du destinataire.
- [ ] Aucune superposition du plan du promoteur ni `page.png` accessible par un lien (test des chemins connus : 404).
- [ ] Libellé « Pour qui ? » jamais visible du destinataire.
- [ ] Captures à 320 px ; contrôle des textes (L1-04) passé.

## Mesure
- S : `partage_cree` (`type_page`, `expiration_j`), `partage_revoque` (`type_page`, `age`).
- N : `partage_canal_choisi` (`type_page`, `canal`), depuis l'application seulement.
- C : `partage_ouvert`, `partage_cta_clique` (`cta`, `type_page`), `lien_expire_ouvert`.

## Points d'attention
- Partage avec un banquier, un courtier ou un notaire : peut sortir du cercle de famille (CPI L122-5 1°). Ne pas l'écrire avant l'avis de l'avocat (OFFRES.md annexe B, question 6 ; L0-07).
- Écart relevé par PARCOURS.md § 8.2 : SUIVI.md prévoit la valeur `prospect` de `type_page` pour `partage_cta_clique`, alors que la page d'un conseiller ne porte pas d'invitation « plan offert ». À aligner dans SUIVI.md.
- Pendant la bêta fermée, `/offert` mène au dépôt réservé aux invités : son bouton suit le mode de la vitrine (liste d'attente ou dépôt, L6-01).
- Parrainage et carte cadeau : seulement après la mesure de T10 (OFFRES.md § 2.7).

## Références
- OFFRES.md § 2.2, § 2.7, § 9.2 (T10) ; PARCOURS.md A13, § 1.4, § 8.2 ; MESSAGES.md § 7.5 (`apercu.partage.*`), § 7.8, § 7.12.
- ARCHITECTURE.md § 2.4, § 4.2 (`partages`, `vues_visite`), § 6.2, § 6.3 ; SUIVI.md § 2.6, § 2.13, § 3.11, § 4.6, § 7.4 (C6).

## Hors périmètre
- Jetons, révocation effective, compteur quotidien : L5-13. Pages de visite et CSP : L5-12.
- Liens prospects des conseillers et leur consentement : L9-04. Intégration chez un promoteur : L10-04.
