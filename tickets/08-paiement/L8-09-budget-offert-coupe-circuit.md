# L8-09 · Budget du plan offert indexé sur la marge et coupe-circuit

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 8 · Paiement des particuliers | P0 | M (1 à 3 j) | L5-09, L5-15, L7-06, L8-01 | `service/` | À faire |

## Pourquoi
Le plan offert coûte autant en IA qu'un plan payant (2,56 € au cas prudent, `OFFRES.md` § 8.8) : c'est un budget d'acquisition, qui doit rester borné. Règle d'OFFRES § 8.8 : un minimum assumé de 10 $ par jour, puis 30 % de la marge faite sur les particuliers, jamais plus de 50 $ par jour tant que la conversion n'est pas mesurée ; coupe-circuit si la conversion passe sous le seuil de perte. Décision 3 : le blocage est d'abord logiciel, le plafond de la clé OpenRouter n'est qu'un second verrou. L5-09 fournit le plafond du jour et l'interrupteur ; ce ticket calcule ce plafond chaque jour et surveille les seuils de pilotage d'`OFFRES.md` § 8.11.

## À faire
1. **Tâche quotidienne** `service/budgets/offert.py`, `calculer_plafond(jour)` (Procrastinate, peu après 00 h UTC, heure de remise à zéro des limites quotidiennes d'OpenRouter) :
   - `marge_7j` = somme sur 7 jours glissants des ventes aux particuliers (`achat_paye` moins `achat_rembourse`, HT) − frais Stripe réels (transactions de solde) − coût IA réel des plans consommés par ces offres, échecs compris − rendu et stockage (0,15 € et 0,05 € par plan tant qu'ils ne sont pas mesurés, `SUIVI.md` § 5.5 ; puis la mesure de L1-16, panoramas 360° et précalcul compris) ; dollars comptés à 1 $ = 1 € (`OFFRES.md` § 8.1) ;
   - `plafond = max(10, 0,30 × marge_7j ÷ 7)` ; tant que la conversion n'est pas mesurée sur 150 aperçus : `plafond = min(plafond, 50)` ;
   - écriture dans `reglages_service.plafond_gratuit_jour_usd` (L5-09) et dans une table `budget_offert_jours` (jour, marge, aperçus mesurés, conversion, seuil, plafond, état du coupe-circuit). Toute modification manuelle passe par l'administration, avec motif (`journal_equipe`).
2. **Conversion à 30 jours** : cohorte des aperçus livrés entre J-60 et J-30 ; part de ceux débloqués (ou suivis d'un achat) dans les 30 jours ; « mesurée » seulement si la cohorte compte au moins 150 aperçus.
3. **Seuil de perte** = coût d'un aperçu ÷ marge d'un déblocage, au prix en vigueur (11,1 % à 29 €, 8,2 % à 39 €, cas prudent) ; recalculé sur les coûts réels à partir de 150 aperçus ; proposition : retenir le plus élevé des deux.
4. **Coupe-circuit** : conversion mesurée sous le seuil → plafond ramené à 10 $ ; plan offert réservé aux PDF (refus d'une image au lancement d'un plan offert, avec un message du catalogue à ajouter qui propose la visite à 29 €) ; alerte. Réarmement **manuel** seulement (administration, motif).
5. **Second verrou** : la clé `prod-gratuit` garde un plafond quotidien fixe égal au plafond absolu (50 $), réglé à la main (L0-08). Le plafond fin reste logiciel : aucune clé de gestion OpenRouter sur les serveurs.
6. **Alertes métier** (`OFFRES.md` § 8.11, `SUIVI.md` § 5.8), vérifiées chaque jour et envoyées par `service/alertes.py` : coût IA moyen sur 30 jours au-delà de 2 $ par plan ; échecs après lecture au-delà de 20 % (avec la recommandation « aperçu réservé aux PDF ») ; conversion sous le seuil ; marge brute d'une formule pro au coût réel sous 50 % et minutes humaines par lot promoteur au-delà de 5 (actives dès que les lots 9 et 10 produisent des données). Coût d'un plan au-delà de 3 $ : déjà dans L5-09 ; litige : L8-01.
7. **Administration** (L5-17, E3) : plafond du jour et consommé, conversion, seuil, état du coupe-circuit, historique ; bouton de réarmement.

## Critères d'acceptation
- [ ] Tests avec horloge injectée et journal simulé : aucune vente → 10 $ ; marge de 2 000 € sur 7 jours → 85,71 $, ramenés à 50 $ avant 150 aperçus, puis 85,71 $ au-delà.
- [ ] Conversion simulée à 9 % au prix de 29 € → coupe-circuit : plafond à 10 $, image refusée pour un plan offert, PDF accepté, alerte ; réarmement manuel tracé.
- [ ] Un plan payant n'est jamais affecté par le plafond du plan offert (test).
- [ ] Alertes « coût moyen > 2 $ » et « échecs > 20 % » déclenchées sur des données simulées.
- [ ] Aucune lecture payante pour tester (faux serveur OpenRouter) ; aucun texte technique dans les messages affichés.

## Mesure
- `credit_offert_refuse` (`motif=budget_jour_attente` ; valeur `format_non_pdf` à ajouter à `SUIVI.md` pour le coupe-circuit).

## Points d'attention
- **Tranché : R23.** La clé `prod-gratuit` ne sert qu'au plan offert des particuliers ; les essais pros passent par la clé `prod-payant`, dans le plafond IA mensuel de leur organisation (`OFFRES.md` § 6.7, § 8.9 ; L9-02). Le budget indexé de ce ticket ne borne donc jamais les essais pros, et un plafond du jour atteint ne les arrête pas.
- **Seuil** : `OFFRES.md` donne 11,1 % fixe à 29 € ; un seuil recalculé plus bas desserrerait le budget. Proposition prudente : le plus élevé des deux ; décision de l'utilisateur.
- **Dépendances** : les vues de marge de L7-06, désormais déclaré ; une seule définition SQL de la marge doit servir aux deux tickets. Les frais Stripe réels supposent L8-01.
- **Monnaie** : plafonds en dollars, marge en euros, taux prudent 1:1 ; à revoir si le dollar s'apprécie.
- **Tranché : R7.** `OFFRES.md` § 8.8 fait foi : minimum de 10 $ par jour, puis indexation, 50 $ au plus avant 150 aperçus mesurés ; `ARCHITECTURE.md` § 6.5 s'y aligne (10 $ par jour au départ).
- **« Réservé aux PDF »** : PDF vectoriels seulement, ou aussi PDF d'image ? À trancher sur les échecs mesurés par format (L6-02 lit l'état du coupe-circuit avant la création du compte, pour ne pas refuser après coup).
- **Rendu des plans offerts** : si le 360° devient l'offre gratuite, chaque aperçu occupe aussi le rendu SwiftShader (environ 10 panoramas par plan, à mesurer, L1-16), hors du budget OpenRouter. Le plafond du jour borne aussi cette charge ; les limites de concurrence de L5-22 font le reste.

## Références
- produit/OFFRES.md § 2.2, § 6.7, § 8.1, § 8.8, § 8.11, § 10 (risque 1) ; produit/ARCHITECTURE.md § 6.5, § 9.4.
- produit/SUIVI.md § 3.7, § 5.5, § 5.8 ; produit/recherche/auth-paiement.md § 3.5 (point 8).
- tickets L5-09 (`reglages_service`, interrupteur), L6-02 (qualification), L6-06 (anti-abus), L7-06 (tableaux de bord).

## Hors périmètre
- Plafonds, clés et interrupteur : L5-09. Anti-abus du plan offert : L6-06.
- Tableaux de bord : L7-06. Tests de prix : L8-06.
