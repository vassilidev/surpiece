# L10-03 · Contrôle et validation des lots par le promoteur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | M (1 à 3 j) | L10-02 | `service/` | À faire |

## Pourquoi
Le promoteur achète des lots conformes à son tableau et sans défaut visible : ce sont les critères écrits du pilote (OFFRES.md § 4.2). Il contrôle chaque livraison sous 10 jours, avec 2 cycles de correction pour ses demandes de modification (§ 4.7), et un lot n'est facturé qu'une fois validé (PARCOURS.md C4, C7). **Tranché : R14.** Un défaut de notre fait est toujours corrigé gratuitement, hors cycles. L'objectif de l'écran : valider vite les lots sans écart, corriger précisément les autres (C5). Une correction de notre fait se fait par rejeu, sans repayer de lecture (ARCHITECTURE.md § 5.6), et chaque défaut confirmé devient un contrôle automatique (CLAUDE.md).

## À faire
1. **Relecture de l'équipe avant livraison** (5 minutes visées par lot, OFFRES.md § 8.5) : écran d'administration par lot (L5-17) avec la visite en vue propriétaire (superposition du plan du promoteur permise dans cette vue, L5-12), la fiche des surfaces, les points à faire confirmer et le verdict de la visite de contrôle. Actions « bon pour livraison » ou « à reprendre », tracées dans `journal_equipe`. Durée passée à l'écran enregistrée par lot.
2. **Livraison** : table `livraisons` (`programme_id`, `cycle`, `livree_le`, `date_limite` à 10 jours selon le contrat de L10-01) ; e-mail au promoteur « livraison prête à contrôler » (texte à ajouter à MESSAGES.md, passé au contrôle des textes).
3. **Écran promoteur « Contrôle · Programme »** (maquette de C5) :
   - en-tête : cycle ‹n› sur 2 (demandes de modification seulement), date limite ;
   - validation groupée : « Valider les ‹n› lots sans écart » ;
   - par lot : « Ouvrir la visite » (jeton propriétaire, L5-12) ; tableau Pièce · Visite · Votre grille, avec le libellé « Écart » (jamais la couleur seule, MARQUE.md § 10.2) ; points à faire confirmer ; « Valider » et « Demander une correction ».
4. **Calcul de l'écart** : `rooms[].area` recopie la surface du tableau du promoteur (prompt `SYSTEM` de `pipeline/lire.py`, l. 233 et 239). Comparer donc :
   - la surface mesurée sur le polygone de chaque pièce à celle du tableau, avec la tolérance déjà demandée à la lecture (2 %, gaines déduites, l. 242) ;
   - la surface totale du lot à `lots.surface_annoncee_m2` de la grille CSV (L10-02).
   La règle exacte est vérifiée sur les plans de référence (L1-02, `evaluer.py`) avant d'être affichée. Lot en duplex : écart par pièce, puis total par niveau et total du lot, comme la fiche découpée par niveau.
5. **Demande de correction** : formulaire structuré (pièce choisie dans la liste des pièces du lot, `type_defaut` de SUIVI.md § 3.2, commentaire de 500 caractères au plus, filtré et échappé) ; table `corrections` (`lot_id`, `cycle`, `nature`, `piece`, `type_defaut`, `commentaire`, `demandee_par`, `statut`, `resolution`, `controle_ajoute`, `traitee_le`). `nature` est fixée par l'équipe au traitement : `defaut` (défaut de notre fait, hors cycles, R14) ou `modification` (demande du promoteur, comptée dans les 2 cycles), comme la propriété `nature` de `lot_correction_demandee` (SUIVI.md § 3.13).
6. **Traitement par l'équipe** (administration) :
   - défaut de notre fait : correctif de code, contrôle automatique ajouté (champ `controle_ajoute` obligatoire pour clore), travail `rejouer` avec `ia_autorisee = false`, sans frais et sans consommer de cycle (R14), même après les 2 cycles ;
   - lecture fausse : une relance payante au plus, à nos frais et sous budget (ARCHITECTURE.md § 5.6) ; correction manuelle de la lecture gardée en tout dernier recours (CLAUDE.md), tracée ;
   - plan modifié par le promoteur ou l'architecte : c'est une nouvelle version payante (OFFRES.md § 4.6), pas une correction ; l'écran le dit.
   Lot corrigé : `en_correction` puis `pret_a_controler`, relivré au cycle suivant.
7. **Validation du programme** : tous les lots validés ou non pris en charge → programme validé ; les lots validés deviennent facturables (donnée lue par la facturation C7, L10-09).
8. **Rôles** : valider et demander une correction réservés aux rôles `proprietaire` et `admin` de l'organisation (L5-04) ; `membre` en lecture.

## Critères d'acceptation
- [ ] Programme de test (témoin dupliqué), sans aucune lecture payante (`PLAN_MOCK`, lectures gardées) : livraison, validation groupée, demande de correction, rejeu sans aucune ligne `appels_ia`, relivraison au cycle 2, programme validé.
- [ ] Une surface volontairement fausse dans la grille CSV fait apparaître le libellé « Écart » ; aucune pièce sans écart n'en porte.
- [ ] Un `membre` ne peut pas valider ; une autre organisation reçoit 404 (tests d'accès).
- [ ] Une correction « défaut de notre fait » ne peut pas être close sans contrôle automatique lié, et ne décompte aucun cycle (test : défaut signalé au 3e tour → corrigé, sans frais).
- [ ] Lots relivrés : visite de contrôle réussie avec tous ses contrôles bloquants (test d'immersion `etancheite`, baies recoupées avec la légende de leur plan `baie`, `garde-corps`, `menuiserie`, et pour un lot à plusieurs niveaux `escalier`, `vide`, `dalle`, `niveau`), zéro défaut visible ; écrans et e-mails sans texte technique (L1-04).
- [ ] Outil local inchangé.

## Mesure
- `lot_valide`, `lot_correction_demandee` (`nature`, `type_defaut`, `cycle`), `lot_corrige` (`nature`, `cycle`, `controle_ajoute`), `programme_valide` (SUIVI.md § 3.13), à reporter dans `mesure/evenements.json`.
- `plan_rejoue` (`motif=defaut_signale`) ; `pilote_livre` (`minutes_humaines_par_lot`, `cycles_correction`) alimenté par les durées du point 1, saisi par l'équipe à la fin du pilote (L10-08).

## Points d'attention
- **Tranché : R14.** Les cycles ne comptent que les demandes de modification du promoteur ; un défaut de notre fait est corrigé gratuitement, hors cycles. L'effet de la date limite (validation tacite ou non) reste à trancher par L10-01, avec l'avocat.
- La durée d'écran n'est qu'une approximation du temps humain par lot ; SUIVI.md § 3.13 prévoit une saisie par l'équipe, qui reste la référence du seuil de 5 minutes (OFFRES.md § 8.11).
- Un rejeu repasse la visite de contrôle et le rendu des images en SwiftShader (L5-11), plus les panoramas 360° et le précalcul d'éclairage s'ils sont au contenu (L5-27, L5-28) : le délai de relivraison en dépend (L13-01).
- Dépendances implicites : L5-17 (écrans de l'équipe), L5-14 (e-mails), L5-12 (vue propriétaire).
- Les plans réels d'un promoteur ne vont ni en CI ni dans une capture de recette (CLAUDE.md) : tests sur le témoin seulement.

## Références
- produit/PARCOURS.md C4, C5, C7, E4 ; produit/OFFRES.md § 4.2, § 4.6, § 4.7, § 8.5, § 8.11.
- produit/ARCHITECTURE.md § 5.6, § 6.7 (`journal_equipe`) ; produit/SUIVI.md § 3.2 (`type_defaut`), § 3.8, § 3.13.
- `pipeline/lire.py:233`, `:239`, `:242` (prompt `SYSTEM` : surfaces du tableau, tolérance de 2 %) ; `moteur/SCHEMA.md` (`fiche`) ; `outils/finalise.sh`.

## Hors périmètre
- Import et rapport de prise en charge : L10-02. Intégration et liens : L10-04. Contrat : L10-01.
- Facturation des lots validés : L10-09. Signalement de défaut par un particulier : L6-09.
