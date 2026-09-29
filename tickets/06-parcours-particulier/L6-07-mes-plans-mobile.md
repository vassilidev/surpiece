# L6-07 · Mes plans et retour sur mobile

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P1 | M (1 à 3 j) | L6-01 | `service/`, `outils/` | À faire |

## Pourquoi
« Rien n'est perdu » : le chantier se retrouve depuis n'importe quel appareil, et un deuxième lot se dépose sans refaire le parcours (PARCOURS.md § 1.2 principe 4, A14). Trois retours sont fréquents : plan déposé sur ordinateur et e-mail lu sur téléphone, parcours entier sur téléphone, arrivée dans le navigateur intégré d'une application (A16). L'application vise WCAG 2.2 niveau AA (PARCOURS.md § 1.5, MARQUE.md § 10), vérifié automatiquement pour ne pas régresser.

## À faire
1. **Page « Mes plans »** `app.<domaine>/plans` (A14, MESSAGES.md § 7.7) :
   - titre `compte.plans.titre` ; en tête `compte.plans.dispo` ou `compte.plans.aucun` ;
   - action principale **« Ajouter un plan »** : même dépôt que L6-01, dans le compte (`plan_depose` avec `connecte=true`) ;
   - une carte par plan : vignette (vue du dessus du niveau d'entrée pour un plan à plusieurs niveaux, `entry` de `moteur/SCHEMA.md` ; jamais le plan du promoteur), cartouche, état `compte.plans.etat.*` (`chantier` avec pourcentage, `echelle`, `apercu`, `visite`, `arrete`), date de fin de conservation ;
   - clic sur une carte : écran d'attente (L6-03), calibration (L6-04), aperçu (L6-05) ou visite (vue propriétaire, L5-12) selon l'état ;
   - suppression : `compte.plans.supprimer` et `compte.plans.supprimer.confirmer` (liens et visite cessent, c'est dit avant).
   La liste est cadrée par l'organisation (faille B1 de l'audit) : 404 en accès croisé.
2. **Retour depuis l'e-mail E3** (« Voir mon logement ») selon la décision L0-05 (levier L11) : lien d'aperçu en lecture seule de 30 jours (L6-08), ou connexion d'abord. Aucun lien de connexion de longue durée dans un e-mail (15 min, recherche/auth-paiement.md § 1.5).
3. **Navigateurs intégrés** (Instagram, Facebook, LinkedIn) : détection prudente par l'agent utilisateur ; bouton Google masqué, code à 6 chiffres mis en avant (A5), dépôt gardé côté serveur.
4. **Accessibilité de l'application**, toutes les pages du lot 6 (dépôt, plan reconnu, volet de compte, vérification, attente, calibration, aperçu, Mes plans, partage) :
   - clavier complet, focus visible de 2 px en Bleu plan, lien d'évitement, ordre logique ;
   - volets : focus piégé, Échap, retour du focus ;
   - erreurs liées au champ (`aria-describedby`) et résumées ; états annoncés en `aria-live="polite"` ;
   - `prefers-reduced-motion` respecté ; aucune perte à 200 % de zoom ni à 320 px ; texte de 11 px au moins ; cibles de 40 px sur écran tactile ; champs en 16 px au moins ;
   - jamais la couleur seule.
5. **Contrôle automatique** dans `outils/` (puppeteer, dépendances figées) : pour chaque page, à 320 px et à 1280 px, analyse axe-core (règles WCAG 2.2 A et AA), absence de défilement horizontal, parcours au clavier scripté (tabulation, Entrée, Échap), capture en mouvement réduit émulé. Bloquant en CI.
6. **Tests sur appareils réels** (manuels, consignés dans le ticket à la livraison) : iPhone Safari, Android Chrome d'entrée de gamme, un portable d'entrée de gamme, navigateur intégré d'Instagram ; sur chacun, la visite du témoin est mesurée avec les indicateurs et seuils de L1-14 (images par seconde, clic, déplacement), et la qualité adaptative (L4-12) est vérifiée (niveau retenu, aucun défaut visible) ; parcours complet dépôt → compte → attente → aperçu sur téléphone ; dépôt sur ordinateur et e-mail ouvert sur téléphone.
7. Proposition facultative (levier L12, P2) : « M'envoyer le lien par e-mail » sur l'aperçu vu sur téléphone. Seulement si L0-05 la retient.

## Critères d'acceptation
- [ ] `outils/` : le contrôle d'accessibilité tourne en CI sur la pile Docker Compose avec le témoin fictif et `PLAN_MOCK` (aucune lecture payante) et passe sur toutes les pages listées.
- [ ] Il échoue sur une page de test sans étiquette de champ, sur un volet sans piège de focus et sur un débordement à 320 px (tests négatifs).
- [ ] « Mes plans » d'un compte A n'affiche jamais un plan du compte B ; l'URL d'un plan de B répond 404 pour A.
- [ ] Carte d'un plan en chantier : ouvre l'attente à l'état du serveur depuis un second contexte de navigateur.
- [ ] Rapport des tests sur appareils réels joint, sans capture d'un plan réel (témoin seulement).
- [ ] Contrôle des textes (L1-04) passé sur chaque page ; aucun nom de fichier affiché.

## Mesure
- S : `apercu_vu`, `visite_ouverte` (`appareil`), `plan_depose` (`connecte=true`).
- N : `cta_depot_clique` avec `emplacement=mes_plans` (valeur à ajouter, PARCOURS.md § 8.1).

## Points d'attention
- Priorité P1, mais les critères d'accessibilité du lot 6 reposent sur le contrôle du point 5 : le livrer au plus tard avec L6-10.
- Le contrôle axe-core détecte une partie seulement des critères WCAG ; le parcours au clavier et les tests réels restent nécessaires.
- `compte.plans.etat.*` doit suivre les états réels de la chaîne (L5-06) ; un état sans clé du catalogue fait échouer le contrôle des textes.
- « Mon compte » (export, suppression, renonciation) n'est pas ici : export et suppression dans L5-20, renonciation dans L8-03.

## Références
- PARCOURS.md § 1.2, § 1.5, A14, A16, A17, § 7.2 (L11, L12) ; MESSAGES.md § 7.7 (`compte.plans.*`), E3 ; MARQUE.md § 10.
- ARCHITECTURE.md § 4.1 (cadrage par organisation), § 6.1 (B1) ; recherche/audit-code.md B1 ; recherche/auth-paiement.md § 1.5.
- `pipeline/accueil.html:275` (`list`, liste globale actuelle des plans, à ne pas reprendre).

## Hors périmètre
- Compatibilité de la visite 3D dans le navigateur du client : L4-10. Seuils de fluidité sur appareil modeste : L1-14 ; corrections : L1-15, L4-12. Comparateur de lots : plus tard (OFFRES.md § 2.4).
- Plan suivant à 15 € et achat : L8-01. Export et suppression du compte : L5-20.
