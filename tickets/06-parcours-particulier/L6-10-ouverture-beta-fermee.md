# L6-10 · Ouverture de la bêta fermée

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | S (jusqu'à 1 j) | L0-09, L1-05, L1-08, L1-10, L1-15, L2-11, L4-07, L4-10, L4-11, L5-16, L5-18, L5-19, L5-20, L5-21, L5-25, L5-26, L6-01, L6-02, L6-03, L6-04, L6-05, L6-06, L6-09, L6-11 | — | À faire |

## Pourquoi
Jalon J0 (OFFRES.md § 7.3) : des testeurs invités utilisent le service en ligne, avec un crédit chacun (CLAUDE.md : 1 crédit offert par testeur). Règles de la bêta (R13, OFFRES.md § 2.8) : aucun achat, dépôt réservé aux invités par un code d'invitation, variante « bêta » du catalogue, aucun message qui propose 29 € avant le lot 8. Ce ticket ne code pas : il vérifie que chaque prérequis technique et juridique est livré, ouvre l'accès aux invités et organise le suivi quotidien. La bêta alimente le test T2 (coût complet, échecs, défauts, compréhension de l'aperçu, partages, prix acceptable), qui conditionne l'ouverture publique (L8-07).

## À faire
1. **Revue des prérequis**, avec une preuve pour chacun (lien vers le test, la capture ou le document) :
   - juridique (recherche/juridique.md § 7, n° 2 à 7) : mentions légales, CGU bêta, politique de confidentialité en ligne (L2-11) ; registre, DPA des fournisseurs, procédures de droits et de violation (L0-09) ; ZDR dans chaque appel (L1-08) ; cartouche masqué avant l'envoi au modèle (L1-10) ; mention incrustée et métadonnées (L4-07) ; export et suppression du compte disponibles (L5-20) ;
   - sécurité : tests automatiques et limites de débit verts (L5-19) ; aucune faille B1 à B9 de l'audit ouverte ;
   - exploitation : supervision et alertes testées (L5-16), procédures d'incident, mode maintenance et page d'état (L5-21), préproduction (L5-18), sauvegardes avec restauration testée (L5-26) ;
   - parcours : dépôt et compte (L6-01), qualification (L6-02), attente (L6-03), aperçu verrouillé côté serveur (L6-05), plan offert et anti-abus (L6-06), signalement des défauts (L6-09), support (L6-11), visite dans le navigateur du client et son repli (L4-10), fluide sur les appareils modestes de référence, seuils de L1-14 tenus après les corrections de L1-15 (décision 12), mode simple du moteur sans « Rendu photoréaliste de la vue » ni superposition du plan du promoteur (L4-11, R16).
2. **Décisions à obtenir de l'utilisateur** avant d'ouvrir, et à consigner : ce que donne le crédit `testeur` de la variante « bêta » (plan complet ou aperçu, 60 jours ; OFFRES.md § 2.8, L0-04) ; nombre de testeurs de la première vague (proposition : 10 à 20) ; clé OpenRouter de la source `testeur` et plafond de dépense de la bêta (OFFRES.md § 2.8 ; la clé « gratuit » ne sert qu'au plan offert des particuliers, R23) ; forme du code d'invitation (saisi ou prérempli par le lien, PARCOURS.md § 8.3, question 11) ; 360° dans le plan de test ou non (L1-16, L4-15, L4-16, L6-13). Les duplex sont acceptés pendant la bêta comme en service (décision 11, `niveaux_max = 2`) : plus une question.
3. **Accès fermé** (R13) : la vitrine reste en liste d'attente ; le dépôt n'est ouvert qu'avec un code d'invitation valide, vérifié côté serveur (L5-23, L6-01) ; les codes sont émis par l'équipe pour les invités choisis dans l'export de la liste d'attente (L2-12) ; seule la variante « bêta » du catalogue est publiée (L5-08) : aucune version payante, aucun prix Stripe ; l'application reste en `noindex` (R20). Crédits `testeur` attribués depuis l'administration (L5-25) ou par la commande de L5-07, avec motif.
4. **Invitation** : e-mail aux invités avec le lien de dépôt et le code d'invitation, les consignes (un ou deux niveaux ; PDF du promoteur de préférence, « Signaler un défaut », adresse d'aide), la mention que le service est en test ; aucun plan réel en illustration (témoin seulement).
5. **Suivi quotidien** pendant la bêta (requêtes SQL ou vue de l'administration, sans attendre les tableaux de L7-06) : plans lancés, coût IA par plan (moyenne, maximum), échecs par étape et par cause, défauts signalés et leur échéance, demandes de support ouvertes, plans offerts refusés par motif, remarques sur la navigation (clics ratés, saccades, regard difficile) avec l'appareil utilisé. Seuils de décision : coût moyen au-delà de 2 $ par plan ou plus de 20 % d'échecs après lecture → revoir la qualification et les prix avant J1 (OFFRES.md § 9.2, T2).
6. **Retours des testeurs** : questions de MESSAGES.md § 10.3 et les 4 questions de prix d'OFFRES.md § 9.2 (T2), en fin de test ; autorisation des témoignages préparée pour L6-12.
7. **Retour arrière** écrit : mode maintenance (L5-21), coupure des lancements, message aux testeurs.
8. **Procès-verbal d'ouverture** (date, prérequis et preuves, décisions, participants), rangé dans `produit/jalons/J0.md` ; l'AIPD courte est à faire dans les 3 mois qui suivent (L0-09).

## Critères d'acceptation
- [ ] Chaque ligne du point 1 a sa preuve ; aucune n'est « à faire ».
- [ ] Un premier testeur de l'équipe fait le parcours complet en production avec le témoin fictif, puis avec un vrai plan fourni par l'utilisateur (lectures payantes, seulement sur accord explicite de l'utilisateur ; plan jamais versionné ni montré hors du compte), sans défaut visible ni texte technique.
- [ ] Sans code d'invitation valide, ni dépôt ni compte (test en production) ; aucun prix ni bouton d'achat sur tout le parcours d'un testeur (contrôle du texte visible et des e-mails).
- [ ] Dans la visite d'un testeur, le mode simple du moteur ne montre ni « Rendu photoréaliste de la vue » ni la superposition du plan du promoteur hors de la vue propriétaire (L4-11).
- [ ] Export et suppression d'un compte de testeur faits une fois en production (L5-20).
- [ ] Les alertes de coût et de plafond OpenRouter arrivent sur un test provoqué la veille de l'ouverture.
- [ ] Le procès-verbal est écrit et validé par l'utilisateur.
- [ ] La visite du témoin tient les seuils de fluidité de L1-14 sur chaque appareil modeste de référence (mesures jointes, témoin seulement).

## Points d'attention
- La mesure d'audience (lot 7) n'est pas en place : T2 repose sur le journal `evenements`, `appels_ia` et les retours écrits. Aucune donnée d'Umami n'est attendue.
- Tranché : R13. La vente n'existe pas avant le lot 8 : aucun écran, aucun e-mail et aucun message d'anti-abus ne propose un paiement ni un prix (L6-05, L6-06, L5-14) ; ouverture à tous en L8-07.
- Testeurs de la bêta express (lot 3, optionnel) : leurs plans restent sur l'ancienne VM ; ne pas les migrer sans rejeu contrôlé ; les réinviter ici avec un nouveau crédit si l'utilisateur le décide.
- Aucun délai en dur (R12) : le délai affiché aux testeurs est la valeur T0 (L5-11) ; tant qu'elle manque, le marqueur ‹délai› n'est pas publié (repli de MESSAGES.md § 0.3).
- Les plans réels des testeurs ne quittent pas la production et n'apparaissent dans aucune capture ni aucun rapport (SUIVI.md § 7.6).

## Références
- ARCHITECTURE.md § 8.4 ; OFFRES.md § 2.2 (testeurs), § 7.3 (J0), § 9.2 (T2) ; recherche/juridique.md § 7.
- MESSAGES.md § 10.3 ; PARCOURS.md § 8.3 (question 4) ; CLAUDE.md (1 crédit par testeur).

## Hors périmètre
- Ouverture publique et vente : L8-07. Témoignages et chiffres publiés : L6-12.
- Mesure d'audience et entonnoirs : lot 7 (L7-01 à L7-08).
