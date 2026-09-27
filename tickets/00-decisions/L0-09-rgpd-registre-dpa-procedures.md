# L0-09 · RGPD : registre, DPA des fournisseurs, procédures droits et violations

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | M (1 à 3 j) | L0-02, L0-08 | — | À faire |

## Pourquoi
Un plan déposé par un acquéreur (adresse du programme, numéro de lot, parfois nom en cartouche) est une donnée personnelle. Avec les particuliers, nous sommes responsable de traitement ; avec les pros, sous-traitant. Le registre, les DPA des fournisseurs, l'analyse des transferts hors UE et les procédures (droits, violations) sont exigés **avant le premier testeur externe** (`recherche/juridique.md` § 7, n° 4 et 5). L3-06 et L6-10 citaient ce prérequis sans ticket : c'est celui-ci.

## À faire
1. **Registre, deux versions** (modèle CNIL) :
   - **responsable** : un traitement par ligne du tableau de `recherche/juridique.md` § 3.1 (compte et crédits, génération pour un particulier, facturation, mesure d'audience, anti-abus du plan offert (empreinte du fichier et empreinte de la page rendue, R22), support), avec finalité, base légale, données, personnes, durée, destinataires, transferts, mesures de sécurité ;
   - **sous-traitant** : génération pour un pro, liens de visite et journal d'ouverture, visites de résidence ; clients, sous-traitants ultérieurs, transferts, sécurité ;
   - ajouter le **jeu de référence privé** (plans réels de l'utilisateur, finalité de test, poste de l'équipe puis seau `references-privees/` de la préproduction, jamais en CI ni en capture).
2. **Liste des sous-traitants**, publiable (elle sera reprise par la politique de confidentialité et le DPA client), d'après les choix de L0-03 et L0-08 :
   - hébergeur (Scaleway, France, si D2 est confirmé) ;
   - **OpenRouter** (États-Unis) : DPA du 26/08/2026 incorporé automatiquement, clauses types module 2, droit irlandais, 72 h pour notifier une violation, préavis de 30 jours pour un nouveau sous-traitant ; avec la ZDR, les modèles d'Anthropic ne passent plus que par Bedrock ou Vertex (`recherche/hebergement.md` § 10) : identifier ces sous-traitants ultérieurs dans la liste d'OpenRouter ;
   - e-mails (TEM ou autre, D4) ; Sentry (événements en UE, comptes aux États-Unis) ; Stripe ; Cloudflare (Access, Turnstile) ; Better Stack si retenu ;
   - fournisseur d'auth seulement si L0-02 retient Auth0 ou Supabase ;
   - Umami auto-hébergé n'est pas un sous-traitant ; Meta et Google (plus tard) sont des responsables conjoints ou indépendants, pas des sous-traitants.
3. **DPA vérifiés et archivés** : pour chaque sous-traitant, version et date du DPA, mécanisme de transfert, lieu des données ; copie PDF archivée hors dépôt si le DPA n'est pas public.
4. **Analyse d'impact des transferts** (AITD), courte : nature des données, masquage du cartouche (L1-10), ZDR (L1-08), chiffrement en transit, faible intérêt des données pour les autorités ; statut du DPF (validé le 3/09/2025, pourvoi pendant) ; OpenRouter et Anthropic s'appuient sur les clauses types, pas sur le DPF.
5. **Procédures écrites** :
   - exercice des droits : réponse sous 1 mois ; adresse de contact dédiée ; export et suppression du compte et des plans (outil : L5-20) ; demande concernant les données d'un pro transmise au pro sous 48 h ;
   - violation de données : qualification du risque, registre des violations, notification à la CNIL sous 72 h si un risque existe (art. 33), information des clients pros selon le DPA, information des personnes si le risque est élevé (à confirmer avec l'avocat) ; qui fait quoi, à quelle heure ;
   - durées de conservation : celles d'OFFRES.md, qui fait foi (R7 : aperçu 6 mois, visite 24 mois, conservation), complétées par le tableau de `recherche/juridique.md` § 3.4 et d'ARCHITECTURE.md § 4.4, y compris la sortie des données supprimées des copies de sauvegarde à l'expiration de leur rotation (§ 9.3).
6. **AIPD courte** : à rédiger au plus tard 3 mois après l'ouverture (recommandée, non obligatoire a priori ; appréciation à valider par l'avocat). Inscrire l'échéance.
7. **Relecture** par l'avocat dans la séance de L0-07.
8. **Où consigner** : un dossier dédié (par exemple `produit/rgpd/`, proposé) avec le registre, la liste des sous-traitants, l'AITD, les procédures et les durées ; aucune donnée personnelle réelle dedans.

## Critères d'acceptation
- [ ] Registre responsable et registre sous-traitant complets pour chaque traitement de `recherche/juridique.md` § 3.1, plus le jeu de référence privé.
- [ ] Liste des sous-traitants publiable, avec pays, lieu des données, mécanisme de transfert et date du DPA.
- [ ] Chaque DPA est vérifié et archivé ; l'AITD est écrite.
- [ ] Procédures droits et violations écrites, avec responsables nommés par rôle et délais (1 mois, 48 h, 72 h).
- [ ] Tableau des durées de conservation aligné sur OFFRES.md (R7), puis sur ARCHITECTURE.md § 4.4 et § 9.3.
- [ ] Échéance de l'AIPD inscrite (ouverture + 3 mois).
- [ ] Relecture de l'avocat notée (date, remarques traitées).

## Points d'attention
- **Tranché** : L0-02 (fournisseur d'auth) est une dépendance déclarée ; L0-03 (e-mails, supervision, vitrine) est couvert par L0-08, qui en dépend.
- La ZDR (L1-08) et le masquage (L1-10) sont des mesures citées dans l'AITD : les décrire comme prévues tant qu'ils ne sont pas livrés, et mettre à jour ensuite.
- Durées « proposées » non relues pour plusieurs lignes (`recherche/juridique.md` § 3.4) : à faire confirmer par l'avocat.
- Les conditions d'OpenRouter interdisent de revendre l'accès aux modèles (7.4) : compatible a priori, à confirmer si des pros peuvent écrire leurs propres consignes.

## Références
- `produit/recherche/juridique.md` § 0 (5), § 3.1 à § 3.6, § 7 (n° 4, 5, 16)
- `produit/recherche/hebergement.md` § 8, § 10
- `produit/recherche/auth-paiement.md` § 1.1 (DPF)
- `produit/ARCHITECTURE.md` § 4.4, § 6.6, § 8.4, § 9.3, § 9.5 (jeux privés)
- `produit/SUIVI.md` § 6.7

## Hors périmètre
- Politique de confidentialité en ligne : L2-11.
- Outils d'export, de suppression et de purge : L5-20.
- Exploitation des incidents : L5-21 ; support : L6-11.
- Analyse d'exemption d'Umami : L7-08.
