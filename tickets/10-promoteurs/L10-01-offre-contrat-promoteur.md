# L10-01 · Offre et contrat promoteur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | M (1 à 3 j) | L0-07 | — | À faire |

## Pourquoi
L'offre Programme se vend sur devis, après un pilote, avec des critères écrits (OFFRES.md § 4). Rien ne peut être produit pour un promoteur sans une licence sur ses plans : une maquette et une visite sont une adaptation (L122-4, recherche/juridique.md § 4.1 et § 4.4). La génération dépend d'OpenRouter, qui ne s'engage sur aucun niveau de service (juridique.md § 2.3) : aucun délai garanti par génération, seulement un délai de programme avec marge. Décision n° 7 : les offres évolueront, les droits acquis sont honorés ; le contrat renvoie donc à une grille datée. Ce ticket fixe l'offre et fait rédiger le contrat et ses annexes ; il ne code rien.

## À faire
1. **Fiche d'offre** soumise à l'utilisateur, après L0-04 et les retours des entretiens promoteurs (L2-18) :
   - rapport de prise en charge offert : conditions d'usage (analyse seulement, effacement 30 jours après le rapport sans commande, aucune publication, PARCOURS.md C2), environ 0,02 $ par lot ;
   - pilote 600 € HT, 40 lots au plus, payé à la commande, démarré après la signature de la licence, livraison visée à 5 jours ouvrés **après réception de plans exploitables**, contrôle sous 10 jours, 2 cycles pour les seules demandes de modification du promoteur (un défaut de notre fait est corrigé gratuitement, hors cycles, R14), intégration, 24 mois d'hébergement, montant déduit si la commande est signée sous 3 mois (OFFRES.md § 4.2) ;
   - critères écrits du pilote : surfaces identiques au tableau, zéro défaut visible, délai tenu, avis de l'équipe commerciale ;
   - prix au lot 25, 20 ou 15 € HT sur 12 mois glissants (15 € avec engagement annuel d'au moins 200 lots et facture mensuelle), commande minimale 10 lots ou 250 € HT, forfait ferme après le rapport (§ 4.3) ;
   - contenu par lot (§ 4.4, R1) : plan 2D, maquette 3D, visite dans le navigateur, vue du dessus 3D découpée, 2 photos, fiche des surfaces comparées à la grille ; aucun nombre de photos promis, galerie complète seulement avec L13-02 ;
   - hébergement 24 mois puis 3 € HT par lot et par an ; nouvelle version d'un lot à 50 % du prix, 10 € HT au minimum ; correction d'un défaut de notre fait gratuite, sans limite (§ 4.6) ;
   - options sur devis : SSO (L10-07), routage IA dans l'UE, facture électronique (§ 4.8).
2. **Dossier pour l'avocat** (complète L0-07), contrat-cadre et annexes :
   - licence consentie par le promoteur, limitée à la fabrication, l'hébergement et la diffusion pour son compte, avec **garantie de ses droits** (architecte, dessinateur : juridique.md § 4.1) ; sort des résultats (licence ou cession, exclusivité) ;
   - autorisation écrite de diffusion étendue à ses distributeurs, s'il prend le portail (L10-05) ;
   - aucune citation comme référence commerciale sans accord écrit (OFFRES.md § 4.10) ;
   - annexe d'engagements de service (OFFRES.md § 4.7) : 99,5 % par mois pour les visites publiées, livraison par programme, aucun délai par génération, support en heures ouvrées sous 1 jour ouvré et 4 h ouvrées pour un incident bloquant (délais d'OFFRES.md, R15), cycles de correction réservés aux demandes de modification (R14), exclusions (pannes des fournisseurs d'IA pour la génération seulement, force majeure, plans non exploitables), avoir de 5 % par tranche de 0,5 %, plafonné à 20 % du mois, recours exclusif ;
   - DPA (article 28, juridique.md § 2.2) : sous-traitants ultérieurs, préavis de changement d'au moins 30 jours (celui d'OpenRouter), violation notifiée « au plus tard 48 h après que nous en avons connaissance » ;
   - réversibilité : export des maquettes, photos et visites dans un format ouvert ; fin de contrat : export sous 30 jours, puis suppression, sauvegardes comprises à l'expiration de leur rotation ;
   - responsabilité plafonnée aux sommes payées sur 12 mois (fragilité de l'article 1170 à vérifier) ;
   - loi Hoguet : aucun formulaire qui oriente des acquéreurs vers des conseillers contre rémunération ;
   - questions ouvertes : licence nécessaire dès le rapport (MESSAGES.md § 3.5, « [À VALIDER : avocat] ») ; effet de la date limite de contrôle (validation tacite ou non) ; conditions de vente (devis, virement à 30 jours).
3. **Rouvrir la décision D7 avant le premier contrat** (ARCHITECTURE.md D7, M5.1) : OpenRouter avec ZDR (Bedrock et Vertex seulement), routage UE d'OpenRouter (offre Business, 8 % de frais au lieu de 5,5 %, environ 0,03 à 0,05 $ de plus par plan), ou contrat direct avec Anthropic. MESSAGES.md § 3.8 promet « Lecture dans l'UE en option » : à garder seulement si l'option est achetable.
4. **Modèles à produire** : devis à prix ferme sur les lots pris en charge, bon de commande du pilote, fiche des critères du pilote, conditions du rapport de prise en charge (acceptées en ligne dans L10-02), contrat-cadre et annexes.
5. **Facturation** : virement à 30 jours ; émission électronique obligatoire au plus tard le 01/09/2027 (L9-10) ; les grands promoteurs reçoivent déjà par plateforme agréée : à vérifier avec L0-06. Devis, bons de commande, factures, export de réversibilité et suivi commercial sont construits par L10-09 à partir des modèles de ce ticket.
6. **Qui décide** : l'utilisateur, sur avis de l'avocat. **Où consigner** : OFFRES.md § 4 (statut daté par ligne), recherche/juridique.md § 2.3 et § 4.4 (réponses de l'avocat), ARCHITECTURE.md D7. Modèles validés et contrats signés hors du dépôt : ce sont des documents de clients.

## Critères d'acceptation
- [ ] Chaque point d'OFFRES.md § 4.1 à § 4.10 porte un statut daté : validé, modifié ou reporté.
- [ ] Contrat-cadre, annexes (licence, engagements de service, DPA, grille de prix) validés par écrit par l'avocat.
- [ ] Aucun document ne promet un délai par génération ; le seul délai est celui d'un programme, après réception de plans exploitables.
- [ ] D7 tranchée et consignée ; MESSAGES.md § 3.8 aligné sur la décision.
- [ ] Liste des blocs de la page promoteurs à démasquer transmise à L2-06 (engagements de service § 3.7).
- [ ] Aucun plan, nom de programme ni nom de promoteur dans le dépôt.

## Points d'attention
- **Tranché : R14.** Un défaut de notre fait est toujours corrigé gratuitement, sans limite et hors cycles ; les « 2 cycles de correction » ne concernent que les demandes de modification du promoteur (OFFRES.md § 4.2, § 4.6, § 4.7). À écrire ainsi dans le contrat.
- **Tranché : R1.** Par lot, au lancement : la visite et les mêmes images que l'aperçu (vue du dessus, plan 2D, 2 photos), « images HD pour les plaquettes » comprises ; « environ 11 photos » n'est jamais promis (OFFRES.md § 4.4 aligné). La galerie complète vient avec L13-02.
- La marge de 54 à 72 % par lot suppose 5 minutes de relecture humaine par lot, jamais mesurées (OFFRES.md § 8.5, § 8.11) : c'est l'objet du pilote (L10-08).
- **Découpé** : la facturation des promoteurs (PARCOURS.md C7 : facture mensuelle des lots validés, paliers glissants, hébergement au-delà de 24 mois, rapport mensuel de disponibilité), l'export de réversibilité promis par le contrat et la saisie commerciale sont dans L10-09.
- Même sans lecture payante, le rapport de prise en charge envoie les images à OpenRouter pour la qualification : le masquage du cartouche (L1-10) doit être en service avant le premier rapport.

## Références
- produit/OFFRES.md § 4.1 à § 4.11, § 7.3 (J3), § 8.5, § 8.11, § 9.2 (T7), annexe B.
- produit/recherche/juridique.md § 2.2, § 2.3, § 4.1, § 4.4, § 4.7, § 7 (ligne 14), § 8 (questions 4, 5, 8, 9, 10).
- produit/ARCHITECTURE.md D7, § 8.4 (jalon promoteurs) ; produit/PARCOURS.md C2, C3, C7 ; produit/MESSAGES.md § 3.5, § 3.7, § 3.8.

## Hors périmètre
- Import et rapport de prise en charge : L10-02. Contrôle des lots : L10-03. Intégration : L10-04.
- Portail distributeurs : L10-05. SSO : L10-07. Pilote : L10-08. Annexe marque blanche : L11-04. Facture électronique : L9-10.
- Devis, factures, export de réversibilité et suivi commercial dans l'administration : L10-09.
