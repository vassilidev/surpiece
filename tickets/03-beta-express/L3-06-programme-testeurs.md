# L3-06 · Programme de testeurs et retours

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L0-07, L0-09, L1-05, L1-08, L1-10, L2-12, L3-05 | — | À faire |

## Pourquoi
Consigne du projet : 1 crédit offert par testeur, et tout défaut trouvé devient un contrôle automatique. Le test T2 d'OFFRES.md § 9.2 doit mesurer, avant toute ouverture de l'aperçu offert au public : le coût complet par plan, les échecs par cause, les défauts signalés, la compréhension du résultat, les personnes avec qui les testeurs partagent, et le prix jugé acceptable. Règle de décision : au-delà de 2 $ par plan ou de 20 % d'échecs, on revoit la qualification et les prix avant d'aller plus loin. Ce ticket organise le recrutement, les retours et la synthèse ; il ne contient pas de code.

## À faire
1. **Liste « avant le premier testeur »**, toutes les cases cochées avec le lien de leur preuve, consignée dans ce ticket :
   - CGU de la bêta et confidentialité validées par l'avocat (L0-07) et en ligne (L3-05) ;
   - registre des traitements, DPA des fournisseurs (OpenRouter, Scaleway, Cloudflare) et procédures de droits et de violation (L0-09) ;
   - conservation nulle chez OpenRouter dans chaque appel (L1-08) ; cartouche masqué avant l'envoi au modèle (L1-10) ; textes techniques retirés (L1-05) ;
   - quotas et plafonds en place (L3-04) ;
   - mention non contractuelle **écrite sur la page de la bêta et dans l'invitation** (texte de MESSAGES.md § 8.3), puisque la mention incrustée dans les images n'arrive qu'avec L4-07.
2. **Recrutement** depuis la liste d'attente (L2-12), en vérifiant que le consentement recueilli couvre une invitation à tester : profil particulier en priorité (acquéreur VEFA avec un plan de vente réel ; appartement sur un ou deux niveaux : duplex acceptés, décision 11) ; 10 à 30 testeurs, par vagues de 5 ; e-mail d'invitation (ce qu'on teste, 1 plan par personne, délai réel mesuré en L3-05, limites de MESSAGES.md § 8.4, mention non contractuelle, liens CGU et confidentialité, formulaire d'acceptation). Ajout à la liste Access (L3-02) seulement après acceptation (version et date gardées).
3. **Consignes** (une page) : déposer de préférence le PDF du promoteur ; ce qui n'est pas pris en charge (maison, plan de plusieurs lots, logement sur plus de deux niveaux ; un duplex à escalier quart tournant ou à entrée par le niveau haut n'a pas encore été vu : il se valide plan par plan) ; comment signaler un défaut ; ne pas publier la visite ; le plan reste privé et sera supprimé à la fin de la bêta.
4. **Formulaires**, avec l'outil retenu pour L2-12 (données hébergées dans l'UE) :
   - « Signaler un défaut » : choix de MESSAGES.md § 7.10 (`defaut.choix`), équivalents des valeurs `type_defaut` de SUIVI.md § 3.2, pièce, mode (plan 2D, maquette 3D, visite), identifiant du plan copié depuis l'adresse, appareil et navigateur, capture facultative ;
   - questionnaire de fin : questions de MESSAGES.md § 10.3, compréhension des limites, « À qui l'avez-vous montré ? », les 4 questions de prix de type Van Westendorp (OFFRES.md § 9.2, T2), et question sur les images d'aperçu du lancement (vue du dessus, plan 2D, 2 photos) ; fluidité sur leur appareil (modèle et navigateur, clic, déplacement, regard, saccades), puisque la visite doit être fluide sur un appareil modeste (décision 12) ; si le mode 360° existe, lequel ils veulent pour un premier aperçu gratuit (décision 15) ;
   - autorisation de témoignage séparée, texte de MESSAGES.md § 10.4 (à valider par l'avocat).
5. **Entretiens** courts (20 min en visio) avec 5 à 10 testeurs, sur le script de MESSAGES.md § 10.3 ; notes sans nom ni adresse.
6. **Boucle des défauts** : pour chaque signalement, reproduire par rejeu sans payer (`outils/finalise.sh`), corriger dans `pipeline/` ou `moteur/` par un ticket `[P]`/`[M]`, et **ajouter le contrôle automatique** qui l'aurait détecté (`controle.mjs`, contrôle des textes, `evaluer.py`…). Le plan du testeur n'est jamais versionné : reproduire le cas sur le témoin ou sur un cas fabriqué ; à défaut, le garder hors dépôt dans le jeu privé de L1-02 avec l'accord écrit du testeur. Délai visé : 5 jours ouvrés ; le testeur est informé à chaque étape.
7. **Suivi pendant la bêta** : chaque jour, coûts par testeur (`outils/couts_beta.py`, L3-04), échecs par cause, défauts ouverts ; point hebdomadaire écrit.
8. **Synthèse finale**, datée, avec son périmètre (nombre de plans, formats) : coût complet moyen et maximal par plan (qualification et appels interrompus compris), taux d'échec par cause, défauts par type et contrôles ajoutés, délai réel de bout en bout, prix jugés acceptables, verbatims autorisés. Propositions de modification d'OFFRES.md et de MESSAGES.md, soumises à l'utilisateur, qui décide.
9. **Clôture** : purge des plans, du registre et des e-mails selon la durée annoncée (procédure de L3-05) ; les témoignages autorisés sont gardés avec leur preuve d'accord.

## Critères d'acceptation
- [ ] Liste « avant le premier testeur » entièrement cochée, preuves liées, avant la première invitation.
- [ ] Chaque testeur a accepté CGU et confidentialité (version, date) avant son accès.
- [ ] Chaque défaut signalé a une issue (corrigé, non confirmé) ; chaque défaut confirmé a son contrôle automatique, avec le lien du commit.
- [ ] Aucun plan de testeur dans le dépôt (`git ls-files` n'en montre aucun ; `plans/` reste ignoré).
- [ ] Synthèse T2 écrite ; décision appliquée : si le coût dépasse 2 $ par plan ou si plus de 20 % des lectures échouent, révision de la qualification et des prix avant l'ouverture de l'aperçu offert.
- [ ] Aucun témoignage publié sans accord écrit (MESSAGES.md § 10.5).
- [ ] Aucune lecture payante hors des plans des testeurs : les corrections se vérifient par rejeu.

## Points d'attention
- **Plan complet ou aperçu** : OFFRES.md § 2.2 donne au testeur un plan complet, mais la question reste ouverte (PARCOURS.md § 8.3, n° 4 ; CLAUDE.md peut se lire comme le crédit offert sans la visite). La bêta express livre l'outil actuel avec la galerie complète, alors qu'au lancement il n'y aura pas de galerie complète (tranché : R1, galerie en L13-02, jamais promise) : les retours sur la galerie ne valent pas pour le lancement, et l'invitation ne la présente pas comme une fonction à venir ; d'où la question sur les images d'aperçu.
- **Mention non contractuelle** : avant L4-07, les photos circulent sans mention incrustée ; les CGU de la bêta interdisent leur publication.
- **Plans des testeurs** : données personnelles et œuvres protégées ; jamais versionnés, jamais montrés dans un visuel (seul le témoin l'est).
- **Nombre de testeurs** : la gratuité d'Access est annoncée jusqu'à 50 utilisateurs (non revérifié, voir L3-02).
- **Budget** : voir L3-04 (environ 60 à 100 $ d'IA pour 30 testeurs, estimation).
- **Dépendances** : la liste d'attente (L2-12) et l'outil de formulaire doivent exister ; sans eux, recruter à la main parmi des contacts directs, avec la même acceptation écrite.

## Références
- produit/OFFRES.md § 2.2 (Testeurs), § 8.11, § 9.2 (T2) ; produit/MESSAGES.md § 7.10, § 8.3, § 8.4, § 10 ; produit/SUIVI.md § 3.2 (`type_defaut`) ; produit/PARCOURS.md § 8.3 ; produit/recherche/juridique.md § 3.2, § 7 ; CLAUDE.md (consignes, 1 crédit par testeur, défauts devenus contrôles).
- outils/finalise.sh ; moteur/controle.mjs ; pipeline/evaluer.py.

## Hors périmètre
- Bêta fermée sur le socle : L6-10. Bouton « Signaler un défaut » intégré à la visite : L6-09. Publication des preuves : L6-12. Support client : L6-11.
