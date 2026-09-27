# L9-02 · Essai Pro

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P0 | M (1 à 3 j) | L9-01, L9-08 | `service/` | À faire |

## Pourquoi
L'essai est la porte d'entrée de la page pro (`PARCOURS.md` B1, B2) : 14 jours, 3 plans complets, fonctions Cabinet, **sans carte** (`OFFRES.md` § 3.6). Un essai par SIREN, vérifié dans l'Annuaire des entreprises, écarte les faux comptes pros. Coût maximal pour nous : 8,10 € par essai (`OFFRES.md` § 8.9) ; les essais sont rentables si 1 sur 4 devient un Solo pendant un mois.

## À faire
1. **Formulaire** `app.<domaine>/pro/essai` (`PARCOURS.md` B2 ; textes des champs à ajouter à `MESSAGES.md`, sur le modèle du § 3.9) : e-mail professionnel (lien magique, L5-03, ou Google, L5-24 ; « Continuer avec Google » affiché seulement si L5-24 est livré) ; entreprise avec autocomplétion par nom ou SIREN ; activité (CGP ou CIF, agent, mandataire, commercialisateur, autre) ; prénom et nom ; téléphone facultatif (il s'affichera sur les pages prospects) ; « Comment nous avez-vous connu ? » facultatif (`SUIVI.md` § 2.10) ; case d'acceptation des conditions Pro et de l'accord de sous-traitance (textes de L9-08) ; Turnstile. Boutons : « Recevoir mon lien de connexion », « Continuer avec Google ».
2. **Vérification du SIREN** côté serveur, par l'API publique de recherche d'entreprises de l'Annuaire des entreprises (sans clé) : 9 chiffres et clé de contrôle, entreprise active. Refus : `erreur.pro.siren_inconnu` ; « SIREN cessé » (message à ajouter) ; `erreur.pro.siren_essai` complété par « … ou demandez à un collègue déjà inscrit de vous inviter » (`PARCOURS.md` § 8.2). API indisponible : essai en attente de vérification, pas de refus sec. Réponses mises en cache peu de temps.
3. **Un essai par SIREN** : table `essais_siren` (SIREN, organisation, date), qui survit à la suppression du compte (lutte contre l'abus ; durée à inscrire au registre, L0-09). Un second compte du même SIREN est orienté vers l'invitation par l'organisation existante (L5-04), **sans révéler** qui l'a ouverte.
4. **Création**, dans une transaction : organisation `cabinet` (nom affiché modifiable), offre `pro_essai` avec les droits Cabinet (3 places, couleurs, détail avec consentement), lot `essai` de 3 plans complets valable 14 jours (L5-07) ; e-mail **E13** (`MESSAGES.md` § 7.11).
5. **File et clé** : les générations d'essai passent en deuxième priorité (`OFFRES.md` § 1), sur la clé `prod-payant`, dans le plafond IA mensuel de l'organisation d'essai (L5-09, `OFFRES.md` § 6.7, § 8.9), 3 générations simultanées au plus ; jamais sur la clé `prod-gratuit` (R23).
6. **Pendant et après l'essai** : bandeau « Essai : {n} jours et {m} plans restants » (à ajouter, B7) ; **E14** trois jours avant la fin ; à la fin : plus de lancement (variante « essai terminé » de `erreur.pro.quota`, à ajouter), liens actifs 30 jours puis coupés, réactivés dès l'abonnement (L9-01) ; bouton « Choisir une formule » partout où l'essai s'arrête.
7. **Garde-fous** : domaines jetables refusés (liste de L6-06) ; limites de débit du formulaire (5 par heure et par IP) ; alerte au-delà d'un nombre d'essais par jour à fixer.

## Critères d'acceptation
- [ ] SIREN actif → essai créé, lot de 3 plans, E13 reçu dans Mailpit ; SIREN cessé ou inconnu → message du catalogue.
- [ ] SIREN déjà utilisé → refus, invitation proposée, aucun nom révélé ; compte supprimé puis nouvel essai du même SIREN → refusé.
- [ ] Horloge injectée : J-3 → E14 ; J+14 → lancement refusé, liens actifs ; J+44 → liens coupés ; abonnement à J+50 → liens réactivés.
- [ ] Générations d'essai sur `prod-payant`, comptées dans le plafond de l'organisation, et en deuxième priorité (test de file) ; plafond du plan offert atteint → l'essai continue.
- [ ] API de l'Annuaire simulée par des réponses enregistrées : aucune dépendance réseau en CI.
- [ ] Aucune lecture payante (`PLAN_MOCK`) ; aucun texte technique.

## Mesure
- N : `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` (`formulaire=essai_pro`).
- S : `essai_pro_demarre` (`activite`, `effectif`, `source`), `siren_refuse` (`motif`), `source_declaree`, `compte_cree` (`cible=conseiller`, `contexte=essai_pro`).
- `email_envoye` pour E13 (`modele` = `essai_debut`) et E14 (`essai_fin_proche`), SUIVI.md § 3.8.

## Points d'attention
- **Tranché** : L9-08 est une dépendance déclarée (pas d'essai sans les conditions Pro et le DPA).
- **Tranché : R23.** La clé `prod-gratuit` ne sert qu'au plan offert des particuliers ; l'essai passe par `prod-payant` avec le budget de son organisation. Un pic d'aperçus (plafond indexé de L8-09) ne bloque donc pas les essais.
- **Tranché : R21.** Tant que ce ticket n'est pas en production, `/pro` ne propose pas d'essai en ligne, seulement un entretien ou la bêta fondateurs (mode [Pré-lancement pro] de `MESSAGES.md` § 0.8, L2-18) ; `cta_essai_pro_clique` n'existe qu'ensuite.
- **E-mail professionnel** : beaucoup de mandataires utilisent une adresse grand public ; ne pas exiger un domaine d'entreprise, le SIREN fait le filtre.
- La carte demandée à l'essai (levier L14) ne se teste que si la conversion reste sous 10 % (`OFFRES.md` § 9.1).
- Pas de vente hors établissement ici (essai en ligne) ; la démonstration en visio relève de L9-11.

## Références
- produit/OFFRES.md § 1 (file), § 3.6, § 6.2, § 8.9, § 9.1, § 9.2 (T6) ; produit/PARCOURS.md B1, B2, B7, § 8.2.
- produit/MESSAGES.md § 2.8, § 7.11 (E13, E14), § 7.12 (`erreur.pro.*`) ; produit/SUIVI.md § 2.10, § 3.7, § 3.12.
- tickets L5-03, L5-04, L5-07, L5-09, L5-24, L6-06.

## Hors périmètre
- Abonnements : L9-01. Prise en main et membres : L9-03. Conditions et DPA : L9-08.
- Démonstration et bêta fondateurs : L9-11.
