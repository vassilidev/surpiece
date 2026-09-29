# L3-03 · Cloisonnement minimal par testeur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L1-06, L3-02 | `pipeline/` [P] | À faire |

## Pourquoi
Aujourd'hui, chacun voit la liste de tous les plans (audit B1), lit l'état, relance ou recalibre le plan d'un autre à partir de son identifiant (B2), et les images du plan du promoteur sont servies avec la visite (B7). Consigne du projet : les plans des promoteurs ne sont jamais publiés sans accord. Avant d'ouvrir la bêta, chaque testeur ne doit voir que ses propres plans, et l'image du plan d'origine ne doit jamais atteindre un tiers. L'identité vient de Cloudflare Access (L3-02) ; l'identifiant sans nom de fichier vient de L1-06.

## À faire
1. **Rattachement.** Dans `depot` (`pipeline/serveur.py:701`), écrire `proprietaire` = e-mail du testeur (`self.testeur`, L3-02) dans `etat.json`. Sans Access (poste local), rien n'est écrit et tout se comporte comme aujourd'hui.
2. **Équipe.** Variable `PLAN_EQUIPE` : liste d'e-mails qui voient tous les plans (support, rejeu).
3. **Une seule fonction de décision** `autorise(pid, email) -> bool` : propriétaire ou membre de l'équipe ; plan sans propriétaire (créé avant ce ticket) → équipe seulement. Tout refus répond **404**, exactement comme un identifiant inexistant (aucun indice d'existence).
4. **Routes à cadrer** :
   - `GET /api/plans` (`:541`) : seulement les plans du testeur ;
   - `GET /api/etat/<id>` (`:534`) : 404 si non autorisé ; pour un testeur, **liste blanche** des clés renvoyées, limitée à ce qu'affiche `accueil.html` : `statut`, `etape`, `message`, `pct`, `etapes`, `avertissements`, `pieces`, `lien`, `image`, `phase`. Jamais `nom`, `technique`, `cout_qualif`, `qualification`, `technique_erreur`, `textes_masques`, `proprietaire`, `k_saisi`, `pdf` (`textes_masques` : textes techniques retirés par le filtre `masquer`, depuis le 27/09/2026). Avec cette liste blanche, `?debug=1` n'affiche rien à un testeur ;
   - `POST /api/relancer/<id>` et `POST /api/calibration/<id>` (`do_POST`, `:561` ; `calibration`, `:634`) : 404 si non autorisé ;
   - fichiers `/plans/<id>/…` (`send_head`, `:511`, avant `servable`, `:464`) : 404 si non autorisé.
5. **Plan du promoteur.** `page.png`, `calibration.png` et `plan-*.png` (liste `VISITE`, `:461`) : servis au propriétaire (calibration, superposition dans sa propre visite) et à l'équipe, jamais par une autre voie. Pas de lien de partage pendant la bêta express.
6. **Environnement des Chrome** : porté par L1-01 (clés API retirées de l'environnement du processus node et des processus Chrome, `moteur/chrome.mjs`), dépendance de L3-01. Ici, seulement le vérifier dans le conteneur (critère ci-dessous) ; aucun diff dans `enfant`.
7. **Accueil** : la section « Plans traités » (`accueil.html:115`) n'affiche plus que les plans du testeur ; son titre devient « Mes plans » si cela tient dans le même petit diff, sinon noté pour L6-07.
8. **Tests automatiques** avec deux testeurs fictifs, A et B, et un membre de l'équipe, à partir des jetons signés du faux point `certs` de L3-02.

## Critères d'acceptation
- [ ] Accès croisé : B reçoit 404 sur `api/etat`, `api/relancer`, `api/calibration`, `index.html`, `plan.json`, `photos/*.jpg`, `page.png`, `calibration.png`, `plan-*.png` du plan de A ; réponse identique (code, corps) à celle d'un identifiant inexistant.
- [ ] `/api/plans` de A ne contient aucun plan de B ; l'équipe voit tous les plans.
- [ ] Réponse d'état d'un testeur : aucune des clés interdites, aucun coût, aucun nom de fichier (test sur le JSON).
- [ ] Plan sans propriétaire : invisible pour un testeur, visible pour l'équipe.
- [ ] Chemins détournés refusés (`%2e%2e`, double encodage, majuscules, lien symbolique) : la décision porte sur le chemin résolu, comme `servable`.
- [ ] Dans le conteneur, Chrome lancé sans `OPENROUTER_API_KEY` ni `ANTHROPIC_API_KEY` dans son environnement (test : `/proc/<pid>/environ` pendant une visite de contrôle ; correctif de L1-01).
- [ ] Sans Access : outil local inchangé (test de fumée de L1-02) ; contrôle « aucun texte technique » (L1-04) réussi.
- [ ] Aucune lecture payante (`PLAN_MOCK` ou lectures gardées).
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **Code jetable assumé** : le socle refait ce cloisonnement en base, par organisation (L5-05). Garder le diff petit et isolé ; ne pas introduire de notion d'organisation ici.
- **Données personnelles** : l'e-mail du testeur est écrit dans `etat.json` sur le volume ; à purger à la fin de la bêta (L3-05, L3-06) et à inscrire au registre (L0-09).
- **Tranché** : l'environnement des Chrome sans clé est porté par L1-01 (côté moteur) ; ce ticket ne fait que le vérifier dans le conteneur.
- **Coordination avec le travail sur les niveaux** : `serveur.py` et `accueil.html` le portent (fini le 27/09/2026, non commité) ; partir du commit qui l'intègre ; branche courte, diff limité aux routes citées et à `depot`, critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- produit/recherche/audit-code.md B1, B2, B3, B7 ; produit/ARCHITECTURE.md § 5.3 (ce qui n'est jamais publié), § 6.1, § 6.7, § 8.1 ; CLAUDE.md (plans des promoteurs).
- pipeline/serveur.py:431 (`enfant`), :565 (`VISITE`), :568 (`servable`), :615 (`send_head`), :638 (`/api/etat`), :645 (`/api/plans`), :665 (`do_POST`), :701 (`depot`), :739 (`calibration`) ; pipeline/accueil.html:115, :276 (liste des plans) ; moteur/ui.js (option « Plan 2D : superposer le plan du promoteur »).

## Hors périmètre
- Quotas, budgets et coûts par testeur : L3-04.
- Contrôle d'accès par organisation, liens de partage, vue propriétaire à jeton court : L5-05, L5-12, L5-13.
