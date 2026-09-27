# L12-03 · Consentement étendu aux traceurs publicitaires

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 12 · Publicité et conversions | P0 | M (1 à 3 j) | L7-02 | `site/`, `service/` | À faire |

## Pourquoi
Aucun envoi vers Meta ou Google, aucun pixel ni aucune balise ne part sans consentement (SUIVI.md § 6.3). Ce consentement doit être éclairé (les destinataires sont nommés), prouvable, et relié à chaque envoi (`consentement_id`, § 2.11). **Tranché : R18.** Aucun bandeau tant qu'Umami reste dans son réglage minimal exempté ; le bandeau (L7-02) arrive dès qu'un traceur non exempté est activé : UTM enrichis, relecture de sessions ou publicité (`MESSAGES.md` § 7.13 ; décision confirmée en L0-05). Les envois publicitaires en sont : au plus tard ici, le bandeau est en service avec la finalité « publicité ». Ce ticket l'étend avant les campagnes : preuve transmise aux envois serveur, et, seulement si c'est utile, pixel et balise en phase 3b.

## À faire
1. **Mettre en service ou relire la finalité « publicité »** du bandeau (L7-02 ; ligne « affichée seulement une fois branchée », `MESSAGES.md` § 7.13) : elle doit nommer Meta et Google comme destinataires, dire ce qui est transmis (e-mail haché, identifiants de clic, IP et navigateur pour Meta) et la durée (90 jours). Si le texte ne le disait pas, publier une nouvelle `version_bandeau` et redemander le choix : un accord recueilli sous une version qui ne nommait pas ces transferts ne justifie aucun envoi.
2. **`consentement_actif(compte_id, finalite, a_la_date)`** : dernière ligne `consentements` du compte (ou du navigateur rattaché à l'inscription) ; renvoie l'identifiant de la ligne qui justifie l'envoi, ou rien. Utilisée par L12-01 et L12-02 pour `consentement_id`.
3. **Transmission** : `contexte_navigateur` (L12-01) écrit seulement si la finalité est acceptée au moment de la session Checkout ; paramètres du compte : l'interrupteur « publicité » (L7-02) coupe les envois dès son retrait.
4. **Phase 3b, seulement sur décision écrite** (remarketing justifié par les premières campagnes, L12-04) :
   - finalité « publicité personnalisée » déclarée dans tarteaucitron ;
   - pixel Meta chargé après accord, avec `fbq('consent','revoke')` avant l'initialisation puis `grant` ;
   - balise Google en Consent Mode v2, **mode basique** (rien chargé avant le choix) ;
   - page de confirmation d'achat : même `evenements.id` passé en `eventID` pour la déduplication ; `fbp` ajouté aux envois de L12-01 ;
   - vérifier alors si une CMP certifiée Google devient nécessaire (sinon Axeptio, SUIVI.md § 6.1).
5. **CSP** : aucune origine Meta ni Google autorisée tant que la phase 3b n'est pas ouverte ; ensuite, sur la vitrine et la confirmation d'achat seulement, jamais sur `visite.` (C6).
6. **Documents** : avenant de responsabilité conjointe avec Meta accepté ; politique de confidentialité et registre (traitement « publicité ») mis à jour (L2-11, L0-09) ; texte du bandeau relu par l'avocat (L0-07).
7. **Marque blanche** : le bandeau d'une instance est celui du client, qui est responsable de ses propres envois (SUIVI.md § 6.6) ; aucun envoi publicitaire depuis une instance.

## Critères d'acceptation
- [ ] Hors phase 3b, avant comme après acceptation : aucune requête du navigateur vers Meta ni Google (interception en puppeteer, scénario R14 étendu).
- [ ] Nouvelle version du bandeau : un accord ancien ne justifie plus d'envoi (test sur `consentement_actif`) ; le choix est redemandé.
- [ ] Refuser demande autant de clics qu'accepter ; les boutons ont les mêmes styles calculés ; bandeau utilisable au clavier et à 320 px.
- [ ] C8 réussi : aucun envoi pour un compte sans accord actif au moment du fait.
- [ ] Contrôle des textes réussi (L1-04).

## Mesure
- `consentement_enregistre` (`publicite`, `version_bandeau`, `origine`).

## Points d'attention
- **Tranché (hiérarchie des sources)** : MESSAGES.md § 7.13 (textes) prime ; les textes et boutons du bandeau sont ceux de MESSAGES.md, auxquels SUIVI.md § 6.4 renvoie désormais (correspondance des lignes du panneau « Choisir » et des finalités techniques).
- Recommandation CNIL sur les pixels et avenant Meta : veille continue (recherche/juridique.md § 7, ligne 17).
- Le mode avancé du Consent Mode fait partir des requêtes vers Google avant tout choix : écarté (recherche/suivi.md § 5.4).

## Références
- produit/SUIVI.md § 2.3, § 2.11, § 2.12, § 6.1 à § 6.7, § 7.3, § 7.4 (C6, C8), § 7.5 (R14, R15), § 8.
- produit/recherche/suivi.md § 4.4, § 5.4, § 6 ; produit/recherche/juridique.md § 3.7, § 7 (ligne 15) ; produit/MESSAGES.md § 7.13 ; produit/MARQUE.md § 10.2.

## Hors périmètre
- Bandeau de base, table `consentements` : L7-02. Attribution : L7-03. Envois serveur : L12-01, L12-02. Campagnes : L12-04.
