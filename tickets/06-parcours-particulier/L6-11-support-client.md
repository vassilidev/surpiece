# L6-11 · Support client : adresse, formulaire, réponses types, délais

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L5-14, L5-17, L0-09 | `service/`, `site/` | À faire |

## Pourquoi
Les documents promettent des délais de réponse, dont la référence est OFFRES.md § 1 (R15) : 2 jours ouvrés pour un particulier, Solo et Cabinet (§ 2.6, § 3.3), 1 jour ouvré pour la formule Équipe (§ 3.3), 1 jour ouvré et 4 h ouvrées pour un incident bloquant chez un promoteur (§ 4.7), premier niveau chez le client en marque blanche (§ 5.6), un mois pour une demande RGPD (recherche/juridique.md § 3.6). Chaque e-mail transactionnel dit « Une question : répondez simplement à ce message » (MESSAGES.md § 7.11). Une petite équipe doit tenir ces délais sans téléphone (OFFRES.md § 10 risque 21). Aucun support n'existe aujourd'hui.

## À faire
1. **Adresse `aide@<domaine>`** : boîte partagée hébergée dans l'UE (fournisseur à choisir ; contrat de sous-traitance archivé par L0-09), adresse de réponse de tous les e-mails transactionnels (L5-14). Accès nominatif, double authentification.
2. **Formulaire de contact** dans l'application (connecté : compte et plan joints automatiquement, jamais le fichier) et sur la vitrine (Turnstile, sans compte). Champs : catégorie, message (2 000 caractères au plus), plan concerné (liste des plans du compte), e-mail si non connecté.
3. **Catégories et routage** :
   - défaut visible → renvoi vers « Signaler un défaut » (L6-09) quand un plan est en cause ;
   - facturation, remboursement → file support (réelles seulement après le lot 8) ;
   - données personnelles → procédure de L0-09 : réponse sous un mois ; si les données sont traitées pour un pro, transmission au pro sous 48 h ;
   - droits d'auteur et DSA → formulaire « Signaler un contenu » (L2-11), décision motivée tracée ;
   - pro, autre.
4. **Table `demandes_support`** : catégorie, compte ou e-mail, plan, statut (`ouverte`, `en_attente_client`, `close`), échéance calculée en jours ouvrés selon la catégorie et l'offre (table des délais lue dans le catalogue d'offres, L5-08), dates. Les messages eux-mêmes restent dans la boîte partagée ; la table ne garde que le suivi.
5. **Accusé de réception** automatique : e-mail avec le délai de réponse de la catégorie (modèle à ajouter à MESSAGES.md § 7.11, sans pixel ni lien traçant).
6. **Réponses types** : rédigées pour chaque catégorie et chaque cas fréquent (plan refusé, dont un plan sur plusieurs niveaux, échec « rien n'a été décompté », délai, calibration, partage, suppression du compte, export, visite lente ou difficile à parcourir sur un appareil modeste, 3D qui ne démarre pas avec son repli `erreur.3d`), relues, rangées dans le dépôt, passées au contrôle des textes (L1-04) et au vocabulaire banni de MARQUE.md § 5.2.
7. **Administration** (L5-17) : file des demandes triée par échéance ; recherche du compte par e-mail ou identifiant ; ouverture du compte avec motif obligatoire dans `journal_equipe` (« demande du client ») ; alerte quand une échéance approche (L5-16).
8. **Page d'aide** `/aide` sur la vitrine (adresse absente de MESSAGES.md § 0.9 : à y ajouter avant de coder, R9) : questions fréquentes du parcours (MESSAGES.md § 1.9), usage privé de la visite et orientation d'un conseiller vers l'offre Pro (avant les lots 9 à 11 : entretien ou bêta fondateurs, R21), lien vers le formulaire, délais affichés tels qu'ils sont tenus.
9. **Suivi des délais** : part des demandes répondues dans le délai, par catégorie, chaque semaine pendant la bêta.

## Critères d'acceptation
- [ ] Formulaire envoyé depuis la vitrine et depuis l'application (pile Docker Compose, Mailpit) : ligne `demandes_support` avec la bonne échéance ; accusé reçu ; message arrivé dans la boîte de test.
- [ ] Catégorie « défaut » avec un plan sélectionné : l'utilisateur est orienté vers le signalement, rien n'est perdu.
- [ ] Demande RGPD de test : échéance à un mois, procédure de L0-09 suivie jusqu'à l'export ou la suppression.
- [ ] Ouverture d'un compte depuis la file sans motif impossible ; chaque ouverture laisse une trace.
- [ ] Toutes les réponses types et l'accusé passent le contrôle des textes (L1-04).
- [ ] Aucun fichier de plan ne transite par la boîte e-mail : le formulaire joint une référence, jamais la source.

## Mesure
- N : `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye`, avec une valeur `formulaire=contact_support` à ajouter à SUIVI.md § 3.2 et à `mesure/evenements.json`.

## Points d'attention
- **Tranché : R15.** Les délais d'OFFRES.md § 1 font foi : particuliers, Solo et Cabinet, 2 jours ouvrés ; Équipe, 1 jour ouvré ; promoteurs, 1 jour ouvré et 4 h ouvrées pour un incident bloquant ; marque blanche, premier niveau chez le client. Ne rien afficher qui ne soit pas tenu.
- Pendant la bêta, les catégories facturation et remboursement n'ont pas d'objet : les masquer tant que la vente est fermée.
- Le texte libre peut contenir des données personnelles : conservation à fixer au registre (L0-09), jamais copié dans le journal ni dans Sentry.
- MESSAGES.md n'a pas encore d'accusé de réception ni de textes du formulaire : les y ajouter avant de coder.
- Un support hors délai coûte plus cher qu'un geste : prévoir « rendre un plan » depuis la file (L5-25). Un défaut de notre fait est toujours corrigé gratuitement (R14).

## Références
- OFFRES.md § 2.6, § 3.3, § 4.7, § 10 (risque 21) ; MESSAGES.md § 1.9, § 7.11 ; PARCOURS.md E1, E2, E6, A13.
- recherche/juridique.md § 3.6 ; ARCHITECTURE.md § 6.7 (accès de l'équipe) ; MARQUE.md § 5.2.

## Hors périmètre
- Signalement structuré des défauts : L6-09. Signalement de contenu (DSA) : L2-11.
- Remboursements en argent : L8-05. Support des promoteurs sous SLA : lot 10.
