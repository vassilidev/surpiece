# L2-06 · Page promoteurs (offre Programme) et demande de démo

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L2-01, L2-12 | `site/` | À faire |

## Pourquoi
L'argument promoteur est « tous les lots, pas quelques lots types » (marche.md § 5.5, point 3). La page `/promoteurs` doit obtenir une demande de démonstration ou de rapport de prise en charge, et rassurer sur ce qui inquiète un promoteur : droits sur ses plans, image (un défaut visible sur son site), délais, RGPD. La vente se fait sur devis après un pilote : la page est une porte d'entrée vers un rendez-vous, pas un achat en ligne.

## À faire
1. **Sections, dans l'ordre** (MESSAGES.md § 3, textes non recopiés) :
   1. En-tête § 8.1, bouton de page « Demander une démonstration ».
   2. Premier écran § 3.1 : surtitre « SUR PIÈCE PROGRAMME · PROMOTEURS », H1 « Chaque lot se visite, pas seulement l'appartement témoin. », sous-titre, bouton principal **Demander une démonstration**, bouton secondaire « Recevoir le rapport de prise en charge », ligne « Rapport offert… ».
   3. Le constat § 3.2 (chiffres FPI du 2e trimestre 2026, sourcés).
   4. Ce que vous obtenez § 3.3 (par lot, par programme ; portail distributeurs masqué, [SI LIVRÉ]).
   5. Qualité § 3.4 (faits autorisés de MESSAGES.md § 0.5 seulement ; lien « Notre méthode en détail → » si L2-10 est publié).
   6. Déroulé et délais § 3.5 (avec la phrase « appartements sur un seul niveau »).
   7. Prix § 3.6 : depuis `site/donnees/offres.json`, masqués tant que L0-04 ne les a pas validés et que l'offre Programme n'existe pas (L10-01, R21).
   8. Engagements de service § 3.7 : masqués tant que le contrat et le SLA ne sont pas validés (L0-07, L10-01).
   9. Sécurité, données et droits § 3.8 ([À CONFIRMER : hébergeur] rempli après L0-03 ; « aucune conservation » seulement si L1-08 est livré).
   10. Formulaire de demande de démonstration § 3.9 (titre « Voyons vos plans ensemble. », champs, case facultative du rapport, mention de confidentialité, bouton **Demander une démonstration**, confirmation et messages d'erreur du § 3.9).
   11. Questions fréquentes § 3.10 avec `data-question` ; dernier appel § 3.11 ; pied § 8.2.
2. **Formulaire** branché sur le service de L2-12 (type `contact_promoteur`) : champs obligatoires et facultatifs exactement comme § 3.9 ; le bouton « Recevoir le rapport de prise en charge » fait défiler jusqu'au formulaire avec la case du rapport cochée ; l'adresse de repli `promoteurs@<domaine>` doit exister avant publication.
3. **Démonstration** : visuels et démonstration sur l'appartement témoin fictif **seulement** (PARCOURS.md C1), jamais sur un programme client, même avec accord, tant que l'accord écrit n'existe pas.
4. **Promesses de capacité** (R21 : la page ne décrit comme disponible que ce qui existe) : tout ce qui n'existe pas encore (offre Programme L10-01, rapport de prise en charge et import de programme L10-02, intégration au site L10-04, portail distributeurs L10-05, SSO L10-07, délai de 5 jours ouvrés pour 50 lots) porte `data-si` et reste masqué ou formulé « en préparation », sans date. Avant le lot 10, la page propose un entretien (démonstration sur l'appartement témoin, L2-18), jamais un essai en ligne.
5. Accroches de mesure : `data-page="promoteurs"`, `data-section`, `data-question` ; attributs d'événements selon L2-14.
6. Balises title et description de MESSAGES.md § 3 (reprises par L2-13).

## Critères d'acceptation
- [ ] Le formulaire refuse un envoi incomplet avec les messages de § 3.9 (champ vide, e-mail invalide) liés au champ ; un envoi valide crée une demande dans le stockage de L2-12 et notifie l'équipe ; la confirmation « Merci. Nous vous répondons sous 1 jour ouvré… » s'affiche.
- [ ] Coupure réseau simulée : message « Votre demande n'est pas partie… » sans texte technique.
- [ ] Aucun prix, délai garanti ni engagement de service visible sans la validation correspondante (contrôle L2-15 sur `data-si`).
- [ ] Aucune image autre que le témoin fictif ; aucun nom ni logo de promoteur.
- [ ] Pas de défilement horizontal dès 320 px (R10) ni à 360 px ; formulaire utilisable au clavier ; aucune erreur axe-core grave.

## Mesure
Posées selon L2-14 : page vue, `cta_promoteur_clique`, `cta_demo_clique`, `section_vue`, `page_defilee`, `faq_ouverte`, `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye` (`formulaire` = `contact_promoteur`) ; côté serveur, `contact_promoteur_recu` écrit par le service de L2-12.

## Points d'attention
- **Dictionnaire** : `cta_promoteur_clique` porte `intention` = `rapport` ou `pilote` (SUIVI.md § 3.4), mais les boutons de MESSAGES.md sont « Demander une démonstration » et « Recevoir le rapport de prise en charge » : il manque une valeur `demo`. Les réponses « Moins de 50 · 50 à 199 · 200 et plus · Je ne sais pas encore » ne correspondent pas à `lots_annonces` (`1_49`, `50_199`, `200_plus`) : il manque `inconnu`. À ajouter par le propriétaire de SUIVI.md.
- **Tranché : R1.** « environ 11 photos » par lot (§ 3.3) disparaît : au lancement, chaque lot a sa visite dans le navigateur et les mêmes images que l'aperçu (vue du dessus, plan 2D, 2 photos) ; galerie complète plus tard (L13-02), jamais promise. À corriger dans MESSAGES.md avant publication, contenu lu dans `offres.json`.
- **Tranché : R21.** Le bouton secondaire « Recevoir le rapport de prise en charge » et la case du rapport ne s'affichent que si le rapport existe (L10-01, L10-02) ; sinon, la demande de démonstration reste la seule action.
- **Juridique** : § 3.5 note « licence nécessaire dès le rapport ? » [À VALIDER : avocat] ; ne pas inviter à transmettre des plans avant l'avis (L0-07). La case « envoyez-moi le lien sécurisé pour déposer nos plans » ne déclenche aucun envoi automatique de lien au lot 2 : l'équipe répond à la main.
- **Données** : le formulaire collecte des coordonnées professionnelles ; le traitement doit figurer au registre (L0-09) et dans la politique de confidentialité (L2-11).
- Aucun concurrent nommé (MESSAGES.md § 0.4).

## Références
- produit/MESSAGES.md § 0.5, § 3 (3.1 à 3.11), § 8.1, § 8.2 ; produit/OFFRES.md § 4 (4.1 à 4.11) ; produit/PARCOURS.md C1, C2.
- produit/SUIVI.md § 3.2, § 3.4, § 3.13 ; produit/recherche/marche.md § 4.2, § 5.5 ; produit/recherche/juridique.md § 2.3, § 4.4.
- produit/MARQUE.md § 3.2, § 3.4, § 8.4.

## Hors périmètre
- Service qui reçoit les formulaires : L2-12. Prix : L2-08.
- Rapport de prise en charge, import, intégration, portail : L10-01 à L10-05. Contrat et pilote : L10-01, L10-08.
- Étude de cas d'un pilote : L6-12 et L10-08, seulement avec accord écrit.
