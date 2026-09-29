# L0-07 · Préparer et tenir le rendez-vous avocat

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | M (1 à 3 j) | L0-01 | — | À faire |

## Pourquoi
Les documents de `produit/` renvoient une quarantaine de points à l'avocat, répartis dans cinq fichiers. Sans ses réponses et ses textes, rien ne s'ouvre : ni les testeurs (CGU, confidentialité), ni la vente aux particuliers (CGV, rétractation), ni les pros (CGV pro, DPA), ni les promoteurs (contrat). Un dossier unique, trié par jalon, réduit le coût et le délai. Le nom (L0-01) doit être fixé avant, car il figure dans tous les documents.

## À faire
1. **Constituer le dossier unique de questions**, sans doublon, trié par jalon d'`OFFRES.md` § 7.3 (J0 testeurs, J1 particuliers, J2 conseillers, J3 promoteurs, J5 marque blanche, publicité). Sources à fusionner :
   - `recherche/juridique.md` § 8 (10 questions : qualification du produit, double case, « Renoncer au contrat ici », titularité des rendus, risque de contrefaçon, journal d'ouverture, AI Act, chaîne OpenRouter–Anthropic, plafond B2B, loi Hoguet) ;
   - `OFFRES.md` annexe B (8 questions : pack en lignes, renonciation au déblocage, 24 mois d'hébergement, codes à offrir, statut « ouvert », banquier et cercle de famille, marque blanche, garantie de l'aperçu offert) ;
   - `MESSAGES.md` § 12.3 (passages marqués **[À VALIDER : avocat]**) ;
   - `PARCOURS.md` § 8.3, questions 6 à 9 (copie du fichier dans le navigateur, dépôt anonyme de 24 h, tirage A/B côté serveur des textes pour les comptes connectés, les prix n'étant testés que par périodes (R8), rappel d'un aperçu non débloqué, moment de la case d'autorisation du promoteur) ;
   - `SUIVI.md` § 8 (« À valider par l'avocat » : exemption d'Umami, de Turnstile, de l'identifiant d'appareil et de Sentry dans le navigateur, texte du bandeau, bandeau du prospect, avenant Meta, 5 ans pour le journal) ;
   - `ARCHITECTURE.md` § 10 (valeur IPTC du marquage, notre rôle au sens de l'AI Act, réutilisation d'une lecture entre organisations) ;
   - `MARQUE.md` § 13, point 6 (mentions du § 8.3, formulation des preuves du § 3.3) ;
   - questions nées des décisions du 27/09/2026 : aperçu offert fait d'images serveur, de surfaces et de points à faire confirmer, sans la visite (R1 ; garantie légale sur un contenu gratuit), Cloudflare Access (société américaine) pour la bêta, masquage du cartouche et ZDR comme mesures de l'analyse d'impact des transferts, absence de bandeau tant qu'Umami reste en réglage minimal exempté (R18) ; puis, décision 15 : mode 360° à chaque arrêt, probablement gratuit (garantie légale sur ce contenu gratuit, mention non contractuelle sur chaque panorama et dans la visionneuse).
2. **Commander les documents**, dans cet ordre :
   - J0 : mentions légales ; CGU (testeurs compris) avec **garantie des droits sur le plan par l'utilisateur**, licences (`recherche/juridique.md` § 4.5), mention non contractuelle, notification et retrait (DSA) ; politique de confidentialité ; relecture du registre et des procédures (L0-09) ; textes des mentions non contractuelles (MARQUE.md § 8.3) ; formulation des preuves ;
   - J1 : CGV particuliers (case de renonciation au lancement, case d'écart consenti, encadré D211-3 de garantie légale, fonction « Renoncer au contrat ici », e-mail de confirmation sur support durable, politique de remboursement) ;
   - J2 : CGV pro et contrat d'abonnement, DPA client en annexe, guide d'usage pro ;
   - J3 et J5 : contrat promoteur (licence sur les plans, SLA, réversibilité, référence commerciale), annexe marque blanche.
3. **Préparer la séance** : envoyer le dossier et les textes existants (MESSAGES.md § 7.3, § 7.7, § 8.3, § 8.6, E8, E9) une semaine avant ; demander un devis par document.
4. **Tenir la séance** et noter, question par question : réponse, texte validé ou à réécrire, document commandé, délai.
5. **Consigner** les réponses dans un compte rendu daté (par exemple `produit/juridique/avis-avocat-AAAA-MM-JJ.md`, proposé), puis reporter chaque réponse dans le document source en retirant le marqueur **[À VALIDER : avocat]** du passage validé.

## Critères d'acceptation
- [ ] Dossier unique envoyé : chaque question y a un numéro, sa source et son jalon.
- [ ] Devis reçus et acceptés pour les documents de J0 au moins.
- [ ] Compte rendu daté : chaque question a une réponse, ou une date de réponse.
- [ ] Documents de J0 reçus (mentions légales, CGU, confidentialité, mentions non contractuelles) et transmis à L2-11.
- [ ] `grep -rn "À VALIDER : avocat" produit/` ne renvoie plus que des passages de J1 et au-delà, chacun avec sa date prévue.

## Points d'attention
- Coût : devis par document ; regrouper J0 et J1 en une commande si le budget le permet.
- Les questions de J2 et J3 peuvent attendre, mais leurs réponses changent la conception (journal d'ouverture des liens prospects, autorisation du promoteur) : les poser dès la première séance.
- La relecture du registre et des procédures RGPD (L0-09) se fait dans la même séance ; L0-09 dépend de L0-08, pas de ce ticket : prévoir l'ordre des séances.
- Plusieurs textes publics (preuves, « toutes les cotes lues correspondent ») restent interdits de publication tant qu'ils ne sont pas validés (MESSAGES.md § 0.2).

## Références
- `produit/recherche/juridique.md` § 0, § 1 à § 7, § 8
- `produit/OFFRES.md` § 2.5, § 2.6, § 7.3, annexe B
- `produit/MESSAGES.md` § 0.2, § 8.3, § 8.6, § 10.4, § 12.3
- `produit/PARCOURS.md` § 8.3
- `produit/SUIVI.md` § 8
- `produit/ARCHITECTURE.md` § 8.4, § 10
- `produit/MARQUE.md` § 3.3, § 8.3, § 13

## Hors périmètre
- Registre et procédures RGPD : L0-09.
- Pages légales sur le site : L2-11.
- Parcours légal B2C et CGV en ligne : L8-03, L8-04.
- Contrats pro et promoteur en production : L9-08, L10-01, L11-04.
