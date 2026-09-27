# L5-17 · Administration interne (1/2) : comptes, plans, coûts, rejeu, défauts

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | L (3 à 5 j) | L5-07, L5-09, L5-08 | `service/` | À faire |

## Pourquoi
Le support, la correction des défauts et les montées de version du moteur passent par « rejouer sans repayer », qui n'existe aujourd'hui qu'en script local (`outils/finalise.sh`, audit A14). Décision de l'utilisateur n° 3 : savoir qui consomme quoi, par compte. Toute action de l'équipe sur les données d'un client passe par l'administration, avec double authentification, motif obligatoire et trace dans `journal_equipe` ; aucun export en masse (`ARCHITECTURE.md` § 6.7, `PARCOURS.md` parcours E). C'est le seul endroit où les textes techniques sont visibles. Ce ticket livre l'accès, la recherche, les comptes, les plans et leurs coûts, le rejeu sans repayer et le cadre de la file des défauts ; le catalogue, les crédits, les gestes commerciaux et la consultation du journal de l'équipe sont dans L5-25.

## À faire
1. **Accès** (réutilisé par L5-25) : comptes à `role_equipe` `support` ou `admin` ; routes sous `app.<domaine>/equipe/` ; double authentification exigée (méthode selon D1 : WebAuthn ou TOTP en auth maison, MFA du fournisseur sinon) ; session d'équipe courte (8 h) ; rôle d'équipe attribué seulement par une commande d'exploitation, elle-même tracée. Tout autre compte reçoit 404.
2. **Motif et journal** : table `journal_equipe` créée ici, en ajout seul (aucune modification ni suppression par l'application) ; l'ouverture d'un compte ou d'un plan demande un motif en liste fermée (demande du client, défaut signalé, échec, litige, anti-abus) plus un texte ; ligne `journal_equipe` (`ouvrir_compte`, `ouvrir_plan`) ; motif valable 1 h sur cette cible.
3. **E1 Rechercher** : par e-mail, organisation, SIREN, identifiant interne de plan, identifiant Stripe (quand L8-01 existe), lien de partage collé (retrouvé par son empreinte, L5-13).
4. **E2 Voir un compte** : identité, organisations, offre et version d'offre, acceptations et consentements, grand livre en lecture (lots : source, reste, expiration ; mouvements : nature, clé d'idempotence, acteur, motif ; les actions sur les crédits sont dans L5-25), plans, partages (nombre, révocations), signaux anti-abus (e-mail normalisé, plans offerts depuis la même IP en 24 h), notes internes.
5. **E3 Plans et coûts** : chronologie des étapes et durées (`etapes`) ; appels IA (modèle, jetons, coût, statut, nom de clé, `appels_ia`) ; total face au budget de 3 $ ; verdict de la visite de contrôle avec le détail technique ; version du moteur ; partages ; défauts. Vue d'ensemble par jour, par offre et par clé : coût par plan (médiane, 9e décile), part d'échecs, budget du gratuit consommé (vues SQL, `SUIVI.md` § 5.5).
6. **E4 Rejouer sans repayer** : travail `rejouer` avec `ia_autorisee = false` (tout appel IA lève une erreur, `ARCHITECTURE.md` § 5.6), choix de la version du moteur, visite de contrôle repassée, publication remplacée seulement si elle réussit, rien de décompté, e-mail E12 facultatif. Même logique que `finalise.sh` (clés vidées, `finalise.sh:7`) mais dans le dossier temporaire du travail, pas `/tmp/controle_<id>.json` (`finalise.sh:15`). **Relancer avec IA** : rôle `admin`, une fois au plus par travail (`relances_payantes`), motif et coût estimé affichés (9e décile de l'étape).
7. **E6 File des défauts** (cadre) : entrée de menu, accès avec motif et gabarit de liste triée par échéance ; la table `defauts`, le formulaire, la vue recalculée et les actions (reproduire, rejouer, répondre, clore avec contrôle ajouté) sont livrés par L6-09, qui dépend de ce ticket. Un défaut de notre fait est toujours corrigé gratuitement (R14).
8. **Suspendre** un partage ou une publication (notification d'un titulaire de droits, DSA art. 16) avec décision motivée, par les fonctions de L5-12 et L5-13 ; **supprimer** et **exporter** un compte par les fonctions de L5-20.
9. **Aucun export en masse** : pas de liste téléchargeable de comptes ni de plans, pagination bornée.

## Critères d'acceptation
- [ ] Compte client sur `/equipe/*` : 404 ; compte d'équipe sans double authentification : refusé.
- [ ] Ouvrir un compte sans motif est impossible ; chaque action écrit exactement une ligne `journal_equipe` (un test par action).
- [ ] Rejeu du témoin depuis l'administration : aucune ligne `appels_ia` créée (critère de M2.11) ; un appel IA forcé pendant le rejeu lève une erreur.
- [ ] Deuxième « Relancer avec IA » sur le même travail : refusé.
- [ ] Aucune route ne renvoie plus de N comptes ; aucune route d'export global (test d'inventaire des routes).
- [ ] Les pages clientes restent passées au contrôle « aucun texte technique » (L1-04) ; l'administration en est exclue explicitement, pas par oubli.
- [ ] Recette sur le témoin, sans appel payant ; outil local inchangé.

## Mesure
- `plan_rejoue` (`motif`).
- Les actions de l'équipe vont dans `journal_equipe` (`ouvrir_compte`, `ouvrir_plan`, `rejouer`, `relancer_ia`, `suspendre_partage`, `supprimer_compte` ; celles de L5-25 s'y ajoutent), pas dans `evenements`.

## Points d'attention
- **Tranché (découpage)** : ce ticket garde comptes, plans, coûts, rejeu sans repayer et le cadre de la file des défauts ; catalogue, crédits (rendre un plan, testeurs, ajustements), gestes commerciaux et consultation du journal de l'équipe passent dans L5-25.
- La méthode de double authentification dépend de D1 (L0-02).
- `ia_autorisee` vient de `ConfigIA` (L4-01, par L4-04 puis L5-06). À défaut, vider les clés comme `finalise.sh`.
- Protéger aussi `/equipe/` par une liste d'IP ou un accès de type Cloudflare Access : option à décider (fournisseur américain, déjà utilisé pour la bêta express L3-02).
- Outil des tableaux de bord (Metabase ou vues SQL) : décision attendue (`SUIVI.md` § 8, n° 4).

## Références
- Décisions de l'utilisateur du 27/09/2026, n° 3 et n° 8 ; arbitrage R14.
- `produit/PARCOURS.md` parcours E (E1 à E6) ; `produit/ARCHITECTURE.md` § 4.2 (`journal_equipe`, `comptes.role_equipe`), § 5.6, § 6.7, M2.11 ; `produit/OFFRES.md` § 2.2 (testeurs), § 6.2.
- `produit/recherche/audit-code.md` A14 ; `produit/SUIVI.md` § 3.8, § 5.5.
- `outils/finalise.sh:7-20`.

## Hors périmètre
- Catalogue, crédits, gestes commerciaux, consultation du journal de l'équipe : L5-25.
- Remboursement Stripe : L8-05. Table, formulaire et actions des défauts signalés : L6-09. Support et réponses types : L6-11.
- Tableaux de bord métier : L7-06. Export et suppression RGPD (fonctions) : L5-20.
