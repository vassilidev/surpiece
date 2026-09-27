# L7-08 · Analyse d'exemption CNIL documentée

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P1 | S (jusqu'à 1 j) | L7-01 | — | À faire |

## Pourquoi
La CNIL ne publie plus de liste de solutions exemptées : elle fournit depuis juillet 2025 un outil d'auto-évaluation, et l'éditeur du site reste responsable en cas de contrôle (recherche/suivi.md § 2.2). Bien réglé, Umami auto-hébergé coche la plupart des critères ; **deux écarts restent** : l'écran Sessions (navigation individuelle visible) et l'absence d'arrondi à la dizaine (§ 2.3). La CNIL admet une solution hors grille si l'analyse est documentée : sans ce document, la mesure sans consentement de L7-01 n'est pas défendable (SUIVI.md § 1.1, condition 2).

## À faire
1. **Remplir la grille** de l'outil d'auto-évaluation de la CNIL (juillet 2025), critère par critère, avec notre réglage réel (L7-01) et une preuve pour chacun : finalité limitée, trois types d'événements seulement (présence, usage d'une fonction, temps), aucun import d'UTM ni d'identifiant de campagne sans consentement, référent limité à l'origine, pas d'identifiant client, empreinte propre au site avec sel mensuel, IP non conservée, pas de relecture, conservation de 25 mois avec purge, opposition durable (cookie `opposition_mesure`, DNT, GPC), aucune réutilisation par un prestataire (`DISABLE_TELEMETRY`, auto-hébergé).
2. **Documenter les deux écarts et leurs parades** (SUIVI.md § 1.3) :
   - écran Sessions : deux comptes nominatifs, pas de lien de partage public, règle écrite « ne jamais s'en servir pour suivre une personne », aucune exportation brute, aucun rapprochement avec le journal ;
   - pas d'arrondi : tout chiffre d'Umami remis à un tiers (client de marque blanche, promoteur, présentation) est arrondi à la dizaine.
3. **Documenter l'écart d'usage** : Umami sur les écrans de l'application (écart avec le principe 5 de recherche/suivi.md § 7.1), et ce qui garde l'anonymat (pas d'`identify()`, chemins en gabarits, titre générique, aucun recoupement), si l'utilisateur l'a retenu (L0-05).
4. **Annexe « à qualifier »** : Turnstile, identifiant d'appareil anti-abus et Sentry dans le navigateur, dont l'exemption repose sur la sécurité (SUIVI.md § 6.2, § 8).
5. **Rédaction** sur une page, datée et versionnée, rangée avec le registre des traitements (emplacement fixé par L0-09) ; relue par l'avocat (L0-07) ; revue chaque année et à chaque mise à jour majeure d'Umami.
6. **Repli** écrit : si l'avocat ou une remarque de la CNIL le demande, Matomo en mode CNIL (SUIVI.md § 1.5), ou mesure seulement après consentement.

## Critères d'acceptation
- [ ] Chaque critère de la grille a une réponse et une preuve (capture de la configuration, test du filtre C4, tâche de purge, page de politique de confidentialité avec le lien d'opposition).
- [ ] Les deux écarts ont leur parade écrite et appliquée (comptes nominatifs vérifiés, aucun lien de partage public dans Umami).
- [ ] Document relu par l'avocat, joint au registre, avec la date de la prochaine revue.

## Points d'attention
- Les critères cités viennent de recherche/suivi.md § 2.2, qui en donne des extraits : relire la version complète de l'outil de la CNIL avant de remplir la grille.
- L'analyse ne vaut que pour le réglage minimal : toute nouvelle propriété, tout nouvel événement ou l'ajout de la relecture hors consentement la remet en cause (contrôles C1, C4, C5).
- La relecture de session et les UTM sont hors exemption : ils relèvent du consentement (L7-02).

## Références
- SUIVI.md § 1.1, § 1.3, § 1.5, § 6.2, § 6.7, § 8 ; recherche/suivi.md § 2.1 à § 2.4, § 7.1 ; recherche/juridique.md § 3.5, § 3.7, § 7 (n° 11).

## Hors périmètre
- Installation et réglage d'Umami : L7-01. Registre des traitements : L0-09. Bandeau : L7-02.
