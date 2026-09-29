# L7-06 · Tableaux de bord métier

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P0 | M (1 à 3 j) | L5-15, L5-09 | `service/` | À faire |

## Pourquoi
Décision utilisateur 3 : savoir qui consomme quoi, avec un coût par compte. Les seuils de pilotage d'OFFRES.md § 8.11 (coût moyen au-delà de 2 $, plan au-delà de 3 $, plus de 20 % d'échecs, conversion de l'aperçu sous 11,1 %, marge pro sous 50 %) demandent des chiffres exacts, que seul le journal `evenements` et les tables métier donnent (SUIVI.md § 1.4, § 2.1). Umami ne mesure ni l'argent ni les comptes.

## À faire
1. **Outil** : décision de SUIVI.md § 8 point 4. Recommandation : **vues SQL agrégées affichées dans l'administration** (L5-17), sans nouveau service ; Metabase auto-hébergé plus tard si le besoin grandit (application Java dont la mémoire est à mesurer sur la VM). L'utilisateur tranche, décision consignée dans SUIVI.md § 8.
2. **Accès** : utilisateur de base en lecture seule sur des **vues agrégées** (aucune ligne par personne) ; comptes marqués `exclu_statistiques` retirés ; le détail par compte reste dans l'administration avec motif (`journal_equipe`).
3. **Vues**, mises à jour chaque jour (SUIVI.md § 5) :
   - **entonnoirs** `v_entonnoir_particulier`, `v_entonnoir_conseiller`, `v_entonnoir_promoteur`, par cohorte hebdomadaire, taux de passage et de départ (§ 4.2 à § 4.4), avec les objectifs de la table de L7-05 ;
   - **acquisition** (partie journal) : inscriptions, essais et contacts par cible, par canal attribué (premier et dernier contact, L7-03) et par source déclarée ; taux de consentement (`consentement_enregistre`) ; bouche-à-oreille (partages, ouvertures, clics des pages de destinataire) ;
   - **activation** : refus à l'analyse par motif, friction du compte (T5 : `plan_depose` → `compte_cree`), délais dépôt → aperçu prêt → aperçu vu → achat (médiane et 9e décile) ;
   - **revenu** (vide jusqu'au lot 8) : chiffre d'affaires HT par offre, remboursements, crédits expirés ;
   - **coûts IA et marge par offre** (§ 5.5) : coût par plan (moyenne, médiane, 9e décile, maximum, qualification et appels interrompus compris), plans au-delà de 3 $, coût des échecs, coût d'un aperçu offert, seuil de perte recalculé, budget de la clé « gratuit » consommé (plan offert des particuliers seulement, R23), coût par compte et par organisation ; conventions : provisions de rendu d'OFFRES.md § 8.1 (0,05 € pour un aperçu, 0,15 € pour un plan complet ; rendu en SwiftShader sur notre VM, R3), remplacées par le temps de rendu mesuré par plan dès qu'il existe, panoramas 360° et précalcul serveur compris (L1-16) ; coût IA ventilé par nombre de niveaux (lecture d'une duplex estimée à 1,5 à 2 $, L1-13) et stockage 0,05 € par plan tant qu'ils ne sont pas mesurés, change en deux colonnes (taux du mois et 1 $ = 1 €) ;
   - **qualité** (§ 5.6) : échecs après lecture par étape et par cause, résultat de la visite de contrôle, défauts signalés pour 100 plans, délai de traitement, part des défauts confirmés devenus contrôle (objectif 100 %), crédits rendus, durée de bout en bout comparée au délai affiché ; fluidité en production par classe d'appareil (classe d'images par seconde et niveau de qualité, si L7-04 les émet) ;
   - **anti-abus** (§ 5.7) : plans offerts attribués et refusés par motif, répartition agrégée par domaine d'e-mail.
4. **Alertes par e-mail** (§ 5.8) branchées sur la supervision (L5-16) : coût moyen sur 30 jours au-delà de 2 $, plan au-delà de 3 $, échecs au-delà de 20 %, conversion de l'aperçu sous 11,1 % après 150 aperçus, type d'événement clé (`depot_provisoire_recu`, `compte_cree`, `apercu_pret`, `plan_pret`, puis `achat_paye` à partir du lot 8, SUIVI.md § 5.8) à zéro pendant 24 h.
5. **Tableau hebdomadaire** par cohorte envoyé par e-mail à l'équipe (sans données personnelles).
6. Requêtes versionnées dans `service/`, testées sur un jeu de données synthétique.

## Critères d'acceptation
- [ ] Jeu de données synthétique (comptes, plans, travaux, `appels_ia`, événements) chargé en test : chaque vue donne les valeurs calculées à la main (tests unitaires SQL).
- [ ] Un compte `exclu_statistiques` n'apparaît dans aucune vue ; aucune vue ne sort de ligne par compte.
- [ ] Le coût par plan d'une vue égale la somme de `appels_ia.cout_usd` du travail (invariant d'ARCHITECTURE.md § 4.3).
- [ ] Chaque alerte du point 4 déclenchée une fois sur des données provoquées, reçue par e-mail (Mailpit en local).
- [ ] Aucun appel payant pour tester : données synthétiques, `PLAN_MOCK`, rejeux.

## Points d'attention
- ARCHITECTURE.md § 9.4 décrit déjà un « tableau interne » en SQL et L5-17 montre les coûts par plan : partager les requêtes, ne pas les dupliquer.
- Les vues de revenu et de marge dépendent de Stripe (L8-01) et du rapprochement quotidien ; avant le lot 8, elles restent vides plutôt que d'afficher un zéro trompeur.
- La marge promoteur demande les minutes humaines saisies par l'équipe (`pilote_livre`) : lot 10.
- Aucun rapprochement avec Umami (SUIVI.md § 2.3) : les deux sources restent séparées, y compris dans l'affichage.

## Références
- SUIVI.md § 1.4, § 2.1, § 2.8, § 4, § 5, § 8 ; OFFRES.md § 8.1, § 8.8, § 8.11, § 9.2 (T3, T5, T8).
- ARCHITECTURE.md § 4.2 (`appels_ia`, `travaux`, `credit_mouvements`, `evenements`), § 4.3, § 9.4.

## Hors périmètre
- Entonnoirs et tableau d'audience dans Umami : L7-05. Budget indexé sur la marge : L8-09.
- Rapprochement Stripe : L8-01. Coût d'acquisition par canal (dépenses publicitaires) : L12-04.
