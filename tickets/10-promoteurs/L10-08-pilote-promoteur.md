# L10-08 · Premier pilote promoteur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | M (1 à 3 j) | L10-01, L10-02, L10-03, L10-04, L10-09 | — | À faire |

## Pourquoi
Les prix au lot et la marge de 54 à 72 % reposent sur des hypothèses : 5 minutes humaines par lot, une livraison en 5 jours ouvrés, une part de lots pris en charge inconnue (OFFRES.md § 8.5, § 9.2 T7). Le test T7 prévoit 1 ou 2 pilotes payants à 600 € HT, trouvés par les chambres régionales de la FPI. Un pilote réussi est aussi une condition du jalon J5 (marque blanche, L11-01). Charge : environ 1 à 3 jours de travail de l'équipe, étalés sur plusieurs semaines.

## À faire
1. **Prospection** : liste de cibles (promoteurs régionaux, chambres régionales de la FPI, contacts des entretiens L2-18, demandes reçues par `/promoteurs`) ; démonstration en visio de 30 minutes (MESSAGES.md § 3.9) sur l'**appartement témoin fictif seulement**, jamais sur le programme d'un client sans son accord écrit.
2. **Rapport de prise en charge offert** sur le programme proposé (L10-02, mode `rapport`), puis devis à prix ferme sur les lots pris en charge.
3. **Signature** : licence sur les plans, critères écrits du pilote, bon de commande de 600 € HT payé (modèles de L10-01). D7 tranchée avant la signature (L10-01).
4. **Déroulé** : réunion de lancement ; import de production (L10-02) ; relecture de l'équipe et livraison, contrôle, 2 cycles pour les demandes de modification, défauts de notre fait corrigés gratuitement hors cycles (L10-03, R14) ; intégration au site (L10-04) ; bilan avec l'équipe commerciale du promoteur.
5. **Mesures T7**, consignées dans un compte rendu : délai réel en jours ouvrés après réception de plans exploitables, minutes humaines par lot, cycles de correction, part des lots pris en charge et motifs (dont `plusieurs_niveaux`, au-delà de deux niveaux, pour chiffrer l'intérêt d'ouvrir le triplex), fluidité de la visite relevée par l'équipe commerciale sur ses appareils (seuils de L1-14), coût IA moyen par lot, conversion en commande sous 3 mois, chiffres de désistement du promoteur (donnée publique manquante, recherche/marche.md § 4.1). Chiffres agrégés, sans nom, reportés dans OFFRES.md § 9.2 (T7).
6. **Décision écrite** après le pilote : prix au lot, outillage à améliorer si le temps humain dépasse 5 minutes (§ 8.11), ouverture du jalon J3, contribution au jalon J5.
7. **Cas client** : publié seulement avec l'accord écrit du promoteur (OFFRES.md § 4.10), sur un texte d'autorisation validé par l'avocat (MESSAGES.md § 10.4), via L6-12.
8. **Saisie commerciale** dans l'administration (écrans de L10-09) : devis envoyé, pilote signé, pilote livré (minutes humaines saisies par l'équipe), commande signée.

## Critères d'acceptation
- [ ] Un pilote signé et payé, ou une décision écrite d'arrêt après N prospections (N fixé par l'utilisateur).
- [ ] Compte rendu T7 complet ; OFFRES.md § 9.2 mis à jour avec des chiffres mesurés et datés.
- [ ] Critères écrits du pilote évalués un par un, avec l'avis signé de l'équipe commerciale du promoteur.
- [ ] Aucun plan du promoteur dans le dépôt, en CI, dans une capture ni dans un support commercial sans accord écrit.

## Mesure
- `contact_promoteur_recu`, `import_cree`, `rapport_prise_en_charge_livre`, `devis_envoye` (`type_devis`, `lots`, `montant_ht_centimes`), `pilote_signe`, `pilote_livre` (`lots_ok`, `delai_j_ouvres`, `minutes_humaines_par_lot`, `cycles_correction`), `commande_signee` (`lots`, `palier`, `montant_ht_centimes`, `deduction_pilote`).

## Points d'attention
- **Tranché** : L10-03 (contrôle, cycles) et L10-04 (intégration) sont des dépendances déclarées, puisque le pilote les promet (OFFRES.md § 4.2).
- **Découpé** : la saisie de `devis_envoye`, `pilote_signe`, `pilote_livre` et `commande_signee`, la facturation des lots validés et l'export de réversibilité sont dans L10-09. Ce ticket n'en dépend pas : si le pilote se signe avant, devis et bon de commande suivent les modèles de L10-01 et sont saisis après coup (proposition).
- **Coût réel** : environ 40 lots × 1,10 à 1,85 $ d'IA, plafonnés à 3 $ par lot, soit 120 $ réservés ; plans de plus de deux niveaux refusés (`niveaux_max = 2`, L4-08) ; une duplex est estimée à 1,5 à 2 $ de lecture (à mesurer, L1-13).
- **Tranché : R1.** Contenu livré par lot : la visite, la vue du dessus, le plan 2D, 2 photos et la fiche ; le mode 360° seulement s'il est en production au moment du pilote (L5-27) ; aucun nombre de photos promis ; galerie complète seulement avec L13-02.

## Références
- produit/OFFRES.md § 4.1, § 4.2, § 4.10, § 7.3 (J3, J5), § 8.5, § 8.11, § 9.2 (T7) ; produit/PARCOURS.md C1 à C5.
- produit/recherche/marche.md § 4.2, § 5.5 (point 3) ; produit/MESSAGES.md § 3, § 10.4 ; produit/SUIVI.md § 3.13, § 4.4.

## Hors périmètre
- Offre et contrat : L10-01. Import : L10-02. Contrôle : L10-03. Intégration : L10-04. Preuves publiées : L6-12.
- Devis, factures et saisie commerciale dans l'administration : L10-09.
