# L11-04 · Contrat et mise en service d'une instance

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 11 · Marque blanche | P1 | M (1 à 3 j) | L0-07, L11-01, L11-02 | `service/` | À faire |

## Pourquoi
Une instance en marque blanche est une vente accompagnée : un contrat qui fixe les rôles (le client est éditeur de la page et responsable de traitement, nous sommes hébergeur technique et sous-traitant), puis une mise en service en liste de contrôle où **chaque ligne a son contrôle automatique** (PARCOURS.md D2). Offre actuelle, en hypothèse : 1 500 € HT de mise en place, puis 490 € HT par mois sur 12 mois, 50 plans par mois inclus (OFFRES.md § 5.2). Une seule instance à la fois au départ (§ 5.6).

## À faire
1. **Annexe marque blanche** avec l'avocat (recherche/juridique.md § 2.4, OFFRES.md § 5.4) :
   - rôles LCEN et RGPD, DPA ; licence d'usage non exclusive et non cessible ; licence de la marque du client limitée à l'affichage ; garantie de ses droits sur les plans, images et textes ;
   - responsabilité plafonnée aux sommes payées sur 12 mois, sans dommages indirects ; sortie : export, redirection ou coupure des liens, puis suppression ;
   - non négociable : mention « illustration non contractuelle », moteur à nous, pas d'accès brut au modèle ;
   - « on ne facture que le client » (§ 5.3) : aucune vente aux particuliers sous sa marque ; une revente fait de lui le vendeur, à revoir avec l'avocat avant de l'ouvrir ;
   - support de premier niveau chez le client ; lettre d'intention préalable.
2. **Mise en service** (`service/instances/`), liste de contrôle de D2, une ligne = un contrôle :
   1. contrat, DPA, licence de marque : pièces déposées ; `lettre_intention_signee` saisie ;
   2. domaine en CNAME, certificat valide : contrôle de L11-01 ;
   3. logo, nom affiché, favicon, accent : contrôle de L11-02 ;
   4. expéditeur des e-mails : envoi de test, SPF, DKIM et DMARC lus dans `Authentication-Results` ;
   5. bandeau de consentement du client, ou le nôtre à ses couleurs, configuré pour son domaine (SUIVI.md § 6.6) : présence vérifiée par un parcours automatisé ;
   6. mentions légales du client : lien présent et joignable sur chaque page ;
   7. domaines autorisés pour l'intégration : vérifiés (L10-04) ;
   8. recette sur 3 plans d'essai du client : 3 visites de contrôle réussies (test d'immersion et recoupement des baies avec la légende compris), zéro défaut visible relu, visite fluide sur un téléphone d'entrée de gamme (seuils de L1-14), aucun texte technique (L1-04) ;
   9. mise en service : `instance_creee`.
   Chaque ligne validée écrit `instance_etape_validee` ; l'instance ne s'ouvre qu'avec les 9 lignes.
3. **Facturation** : offre `marque_blanche` au catalogue (L5-08, R5 : prix et quotas lus dans la version, droits acquis honorés) : mise en place facturée une fois ; abonnement mensuel sur 12 mois (Stripe Billing, prélèvement SEPA, L9-01) ; 50 plans par mois inclus puis recharges prépayées à 7 € HT (mécanique des recharges de L9-13) ; options : retrait de la signature 150 € HT par mois, réglage de lecture sur mesure 490 € HT (L9-07), SSO sur devis (L10-07). Chaque ligne du journal porte `instance` (SUIVI.md § 3.14).
4. **Statistiques** : un site Umami propre au client s'il le demande (recherche/suivi.md § 7.7).
5. **Support** : procédure écrite entre l'équipe du client (premier niveau) et la nôtre (L6-11).

## Critères d'acceptation
- [ ] Annexe validée par écrit par l'avocat.
- [ ] Instance de test en préproduction : chaque ligne de la liste échoue quand sa condition manque (domaine sans CNAME, accent refusé, DMARC absent, bandeau absent, lien de mentions mort) et passe une fois corrigée.
- [ ] Facturation en mode test Stripe : mise en place, premier mois, recharge ; `abonnement_demarre` avec `formule=marque_blanche`.
- [ ] Aucune lecture payante pour la recette automatique (témoin) ; les 3 plans d'essai réels du client ne vont ni en CI ni dans une capture publiée.

## Mesure
- `lettre_intention_signee`, `instance_creee`, `domaine_verifie`, `mention_retrait_active`, `abonnement_demarre` et `recharge_payee` (`formule=marque_blanche`).
- `instance_etape_validee` : à ajouter à SUIVI.md § 3.14 et à `mesure/evenements.json` (PARCOURS.md § 8.1).

## Points d'attention
- **Dépendances non déclarées** : L11-02 (contrôle 3), L9-01 (abonnements), L9-13 (recharges), L5-08 (catalogue) ; L11-03 si le client a sa propre clé IA.
- **Support** (R15) : les délais d'`OFFRES.md` § 1 font foi ; pour la marque blanche, ils ne fixent que le premier niveau, chez le client (§ 5.6). Notre délai de second niveau n'est écrit nulle part : à fixer dans l'annexe (point 1).
- Tous les prix sont des hypothèses (OFFRES.md § 9.1 : 390 à 490 € par mois testés sur lettres d'intention).
- Envoi depuis le domaine du client : non vérifié chez TEM (ARCHITECTURE.md D4).
- Facture électronique au plus tard le 01/09/2027 (L9-10).

## Références
- produit/OFFRES.md § 5.2 à § 5.6, § 8.6, § 9.1 ; produit/PARCOURS.md D2 ; produit/recherche/juridique.md § 2.4.
- produit/MARQUE.md § 9 ; produit/MESSAGES.md § 4.3, § 4.5, § 8.5 ; produit/SUIVI.md § 3.14, § 4.5, § 6.6, R12.

## Hors périmètre
- Domaines et certificats : L11-01. Thème : L11-02. Clés IA : L11-03. Codes à offrir : L9-09.
