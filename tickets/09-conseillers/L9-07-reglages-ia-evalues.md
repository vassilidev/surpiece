# L9-07 · Réglages personnalisés évalués avant activation

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P2 | M (1 à 3 j) | L4-01 | `pipeline/` [P], `service/` | À faire |

## Pourquoi
Les pros demandent des « prompts custom ». Version sûre (`OFFRES.md` § 3.5) : **jamais** de consigne libre envoyée au modèle (les conditions d'OpenRouter interdisent de revendre l'accès aux modèles, clause 7.4 ; une consigne libre ferait aussi perdre la maîtrise du coût), mais des réglages prédéfinis et, sur devis (490 € HT), un réglage de lecture sur mesure écrit par l'équipe, versionné, activable seulement si `pipeline/evaluer.py` sur les plans de référence ne recule pas (`ARCHITECTURE.md` § 7.3, M4.4). L4-01 fait de la configuration un paramètre (`ConfigIA.consignes`, `effort`) : c'est le prérequis.

## À faire
1. **Réglages prédéfinis**, liste fermée, formule Équipe (`OFFRES.md` § 3.5) : hauteur sous plafond par défaut quand le plan ne la donne pas (bornes 2,40 à 3,00 m, affichée « Hypothèse » dans la fiche) ; vue d'accueil (galerie, maquette ou visite), si l'utilisateur la retient. Stockés dans `reglages_organisation.rendu`, appliqués par la résolution de configuration (défaut < offre < organisation < équipe, `ARCHITECTURE.md` § 7.2), pour les plans suivants seulement.
2. **Réglage de lecture sur mesure**, dans `reglages_organisation.ia`, écrit par l'équipe seulement (rôle `admin`) : `effort`, `effort_relecture`, `consignes` (texte ajouté au prompt, 2 000 caractères au plus), `version`, `statut` (`brouillon`, `evalue`, `actif`, `retire`), rapport d'évaluation.
3. **Petit diff [P]**, après la fusion du travail sur les duplex (même règle que L4-01) :
   - dans `pipeline/lire.py`, `system(extract)` (`:256`) et la relecture (`relecture`, `:623`, prompt `RELECTURE` `:606`) ajoutent `config.ia.consignes` dans un bloc délimité, après les consignes de base ; sans consigne, prompts identiques au caractère près ;
   - `version_prompts` = empreinte des prompts et version du réglage, écrite dans le journal des appels (`appels_ia`) ;
   - la hauteur par défaut remplace la valeur fixe de `complete` (`P.setdefault('H', 2.5)`, `lire.py:1068`) quand elle est fournie.
4. **Évaluation** `outils/evaluer_reglage.sh <organisation> <version>` :
   - d'abord gratuit : rejeu sans IA des références (L1-02), pour vérifier que rien d'autre ne bouge ;
   - **puis, seulement sur accord explicite de l'utilisateur**, lecture payante avec la clé `dev` des plans de référence (432 et D201 relevés à la main, témoin de L1-12), avec et sans le réglage ; `evaluer.py` (murs, pièces, ouvertures, équipements) ; visite de contrôle ; coût par plan ;
   - rapport JSON gardé dans l'espace privé ; réglage **accepté** seulement si aucune mesure ne recule par rapport à la ligne de base (D201 : 7 ouvertures sur 7, 6 équipements sur 6 ; 432 : 6 sur 7 et 6 sur 7, `ARCHITECTURE.md` § 9.5), contrôle réussi sur tous les plans, surcoût mesuré.
5. **Activation** dans l'administration (L5-17) : impossible sans rapport accepté pour cette version exacte (contrainte en base) ; motif obligatoire, trace `changer_reglage_ia` dans `journal_equipe` ; si le coût par plan augmente, supplément de 3 fois le surcoût mesuré au devis (`OFFRES.md` § 3.5) et plafond IA mensuel de l'organisation ajusté (L5-09).
6. **Traçabilité** : chaque travail garde la configuration résolue, sans clé, dans `travaux.config` ; une visite se rejoue avec le réglage qui l'a produite.

## Critères d'acceptation
- [ ] Un réglage non évalué, ou évalué sur une autre version, ne peut pas être activé (tests en base et par l'API).
- [ ] Sans consigne : rejeu des références avec des `plan.json` identiques, `evaluer.py` au moins égal, visite de contrôle et contrôle des textes réussis, test de fumée de l'outil local réussi (critère de fusion [P], `ARCHITECTURE.md` § 8.1).
- [ ] Test unitaire : les consignes n'apparaissent que dans le bloc prévu, et jamais pour une organisation sans réglage actif.
- [ ] Hauteur par défaut appliquée au témoin rejoué, affichée « Hypothèse » dans la fiche.
- [ ] Aucune lecture payante dans la CI ; la lecture payante d'évaluation n'a lieu qu'après un accord consigné.

## Mesure
- `reglage_modifie` (`reglage` : `hauteur_defaut`, `vue_accueil`).

## Points d'attention
- **Jeu de référence mince** : 432 et D201 relevés à la main, plus le témoin. Un réglage qui aide un plan peut en dégrader un autre, inconnu ; le client reste responsable des résultats qu'il a personnalisés (`recherche/juridique.md` § 2.1, point 7).
- **Coordination [P]** : `lire.py` est en cours de modification pour les duplex ; diff fait après leur fusion, ou par le même agent ; `niveaux.py` n'est pas touché (`ARCHITECTURE.md` § 8.1).
- **Coût d'une évaluation** : environ 7 à 11 $ pour 3 plans lus deux fois, à inclure dans les 490 € de mise en place ; ne jamais lancer une lecture vouée à l'échec.
- **Photos à produire** (Équipe) : sans objet au lancement (R1 : 2 photos, galerie complète seulement avec L13-02, `OFFRES.md` § 3.5).
- **Budget** : le plafond de 3 $ par plan, toutes passes et relances confondues (R6), vaut aussi avec un réglage sur mesure ; le coût mesuré à l'évaluation doit rester dessous avec une marge, sinon les lectures du client s'arrêteraient au plafond.
- Pas d'accès brut au modèle, même en marque blanche (`OFFRES.md` § 5.2).

## Références
- produit/OFFRES.md § 3.5, § 5.2 ; produit/ARCHITECTURE.md M4.4, § 7.2, § 7.3, § 8.1, § 9.5.
- produit/recherche/juridique.md § 2.1 ; produit/PARCOURS.md B9, E4 ; produit/MESSAGES.md § 2.6.
- `pipeline/lire.py:256` (`system`), `:606` (`RELECTURE`), `:623` (`relecture`), `:1068` (`complete`, hauteur par défaut), `:1308` (`read_plan`) ; `pipeline/evaluer.py` (`evaluate`, `from_plan`).

## Hors périmètre
- Configuration passée en paramètre : L4-01. Marque du cabinet : L9-06.
- Clés IA propres à un client : L11-03. Rejeu et administration : L5-17.
