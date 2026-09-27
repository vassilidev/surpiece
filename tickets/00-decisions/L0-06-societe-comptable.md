# L0-06 · Société, banque, expert-comptable, assurance

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | M (1 à 3 j) | — | — | À faire |

## Pourquoi
Pour vendre, il faut une structure qui facture, un compte bancaire, des réponses fiscales (TVA, packs de crédits) et une assurance. Depuis le 01/09/2026, toute entreprise assujettie doit pouvoir **recevoir** ses factures électroniques par une plateforme agréée ; l'émission suivra le 01/09/2027 pour une PME. Ces démarches sont longues : les lancer maintenant évite qu'elles bloquent le paiement (L8-01) et la facturation électronique (L9-10).

## À faire
1. **Structure juridique** : choisir la forme avec l'expert-comptable (la forme n'a pas été étudiée dans les recherches). Prendre « Sur Pièce » (ou le nom retenu par L0-01) comme nom commercial, voire comme dénomination sociale (`recherche/nom.md` § 7.6). Si la marque a été déposée en nom propre, prévoir sa cession à la société, inscrite à l'INPI.
2. **Compte bancaire professionnel**, au nom de la société. Vérifier s'il fait aussi office de plateforme agréée ou s'y connecte (Qonto et Pennylane figurent parmi les plateformes selon des sources secondaires, à vérifier sur la liste officielle d'impots.gouv.fr, mise à jour le 22/09/2026).
3. **Expert-comptable** : lettre de mission, puis réponses écrites à ces questions (`recherche/auth-paiement.md` § 4 et § 5) :
   - régime de TVA : franchise en base ou réel ;
   - option pour la TVA d'après les débits (elle supprime l'e-reporting des données de paiement mais avance l'exigibilité) ;
   - traitement comptable et TVA des packs de crédits (bons à usage unique ?) et des plans non utilisés ;
   - statut des CGP clients (activités en partie exonérées, mais assujettis) ;
   - seuil de 10 000 € HT de ventes B2C dans l'UE (guichet OSS au-delà) ;
   - mentions de facture à ajouter dès maintenant (SIREN du client, catégorie « prestation de services », option pour les débits).
4. **Plateforme agréée pour la réception** des factures électroniques : la choisir (idéalement la même que pour l'émission de 2027 et l'e-reporting) et s'inscrire à l'annuaire. Sanction en cas de manquement : mise en demeure de trois mois, puis 500 € et 1 000 € (art. 1737 IV bis du CGI).
5. **Préparer l'émission** (01/09/2027 au plus tard, plus tôt si un promoteur l'exige) : noter le schéma cible Stripe → application de plateforme agréée (Billit ou Pennylane, que Stripe cite) → plateforme du client. La mise en œuvre est L9-10.
6. **Assurance RC professionnelle** (et cyber) : décrire précisément le service à l'assureur (génération automatique de plans et de visites à partir de plans de vente, illustrations non contractuelles, clientèle de particuliers et de pros) ; demander la couverture des activités numériques et du « conseil » (`recherche/juridique.md` § 5.3). Obligatoire en pratique avant la première vente (jalon J1).
7. **Consigner** les décisions et les réponses dans un document interne daté (par exemple `produit/SOCIETE.md`, proposé), **sans** pièce d'identité, IBAN ni identifiant de connexion ; les pièces restent chez l'expert-comptable et dans le coffre de l'équipe.

## Critères d'acceptation
- [ ] SIREN attribué ; nom commercial inscrit.
- [ ] Compte bancaire professionnel ouvert.
- [ ] Lettre de mission de l'expert-comptable signée ; réponses écrites aux six questions de l'étape 3.
- [ ] Plateforme agréée de réception choisie et inscrite à l'annuaire.
- [ ] Attestation d'assurance RC professionnelle reçue, avec les activités couvertes.
- [ ] Document interne à jour, relu : aucune donnée bancaire ni personnelle sensible dans le dépôt.

## Points d'attention
- **Tranché** : L0-08 dépend désormais de ce ticket (mode réel de Stripe, comptes au nom de la société). L0-01 n'en dépend pas : la marque verbale peut être déposée en nom propre puis cédée à la société (étape 1).
- Sources secondaires non vérifiées : plateformes Pennylane et Qonto, montant de l'amende d'e-reporting (art. 1788 D), nombre de plateformes agréées.
- Tolérance de la DGFiP au démarrage : ni report ni suspension de l'obligation (`recherche/auth-paiement.md` § 4.3).
- Coûts non connus : expert-comptable, assurance, frais de création (devis à demander).
- Le médiateur de la consommation est traité par L8-04, pas ici.

## Références
- `produit/recherche/auth-paiement.md` § 4.1 à § 4.5, § 5
- `produit/recherche/juridique.md` § 5.3, § 7 (n° 10)
- `produit/recherche/nom.md` § 7.6
- `produit/OFFRES.md` § 7.3 (jalon J1), § 10 (risque 19)
- `produit/ARCHITECTURE.md` § 8.3 M4.5, § 8.4

## Hors périmètre
- Compte Stripe et clés : L0-08 ; paiement : L8-01.
- Émission des factures électroniques et e-reporting : L9-10.
- Médiateur de la consommation et CGV : L8-04.
