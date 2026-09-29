# L6-09 · Signaler un défaut, qui devient un contrôle

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L5-17 | `service/` | À faire |

## Pourquoi
Consigne de CLAUDE.md : zéro défaut visible, et **tout défaut trouvé devient un contrôle automatique pour ne plus jamais revenir**. Un défaut visible sur une visite partagée casse le bouche-à-oreille au moment où il naît (OFFRES.md § 10 risque 7). OFFRES.md § 2.6 promet une correction visée sous 5 jours ouvrés, par un rejeu sans IA, sinon un remboursement. Les testeurs de la bêta fermée (T2) doivent pouvoir signaler dès le premier jour.

## À faire
1. **Bouton `defaut.bouton`** (« Signaler un défaut »), toujours visible :
   - dans la vue propriétaire de la visite : placé dans la page produite à la publication (L5-12), hors du moteur ;
   - sur la page d'aperçu (L6-05) ;
   - pas sur les pages de destinataire d'un partage.
2. **Volet** (MESSAGES.md § 7.10) : `defaut.titre`, choix `defaut.choix`, `defaut.piece` préremplie avec la pièce courante, `defaut.detail` (500 caractères au plus), `defaut.position`, bouton `defaut.envoyer`, confirmation `defaut.merci`. Focus piégé, Échap, feuille montante sur mobile.
3. **Contexte enregistré, sans capture envoyée par l'appareil** :
   - dans la visite : mode (`plan`, `orbit`, `walk`, et le mode 360° quand il existe : arrêt et direction du regard), position et orientation de la caméra, niveau (`App.state.level`, `__v.walk.lv`, posés par le travail sur les niveaux du 27/09/2026, `moteur/SCHEMA.md`), niveau de qualité retenu par la qualité adaptative quand elle existe (L4-12), pièce courante, version du moteur ; lus par les poignées existantes `window.__v` (caméra, état) et `App`. La vue est recalculée au même niveau et au même niveau de qualité ;
   - dans l'aperçu : l'image concernée (vue du dessus, plan 2D, photo et sa pièce).
   La « capture » est refaite par l'équipe : rendu côté serveur de la vue enregistrée avec le module Chrome partagé (L1-09), sur la publication concernée. Aucune image de l'écran de l'utilisateur n'est téléversée.
4. **Stockage** : table `defauts` (plan, publication, organisation, compte, type, pièce, mode, position `jsonb`, image, commentaire privé, statut `recu` · `reproduit` · `corrige` · `rembourse` · `non_confirme`, échéance à 5 jours ouvrés, référence du contrôle ajouté, dates). Le commentaire ne va jamais au journal `evenements`. Limite : 10 signalements par jour et par compte.
5. **E-mail d'accusé** E12 (« Nous avons reçu votre signalement ») à l'envoi (modèle de L5-14).
6. **File dans l'administration** (cadre livré par L5-17, PARCOURS.md E6 ; table et actions livrées ici) : liste triée par échéance, avec la vue recalculée, la pièce, le type, le verdict de la visite de contrôle de la publication. Actions : reproduire, rejouer sans IA après correctif (`ia_autorisee = false`), répondre (E12 « corrigée » ou « non retrouvé »), rembourser (après L8-05). Ouverture avec motif dans `journal_equipe`.
7. **Clôture « corrigé » impossible sans le contrôle automatique ajouté** : champ obligatoire (contrainte en base) qui pointe vers le commit et le test : motif dans `outils/textes.mjs`, vérification dans `moteur/controle.mjs` (par exemple `etancheite`, `baie`, `garde-corps`, ajoutés le 27/09/2026 sur des défauts vus par l'utilisateur), `pipeline/murs.py` ou `pipeline/niveaux.py`, cas dans le rejeu des références (L1-02) ou la CI du témoin (L1-11).
8. **Procédure écrite**, rangée avec les procédures d'exploitation (L5-21) : reproduire sur le rendu serveur ; trouver la cause ; écrire d'abord le contrôle qui échoue sur ce plan ; corriger ; rejouer les références sans payer (critère de fusion d'ARCHITECTURE.md § 8.1) ; rejouer le plan du client sans IA ; vérifier ; clôturer ; e-mail. Non confirmé : E12 « non retrouvé », rien n'est retiré.
9. **Rejeu sans repayer** : un défaut de notre fait est toujours corrigé gratuitement, pour toutes les offres, aperçu offert compris (R14, OFFRES.md § 2.6) ; rien n'est décompté au client ; la publication n'est remplacée que si la visite de contrôle réussit (ARCHITECTURE.md § 5.6).

## Critères d'acceptation
- [ ] Signalement envoyé depuis la visite du témoin fictif (puppeteer) : ligne `defauts` avec mode, position et pièce ; E12 dans Mailpit ; aucune image téléversée.
- [ ] Depuis l'administration, la vue enregistrée est recalculée côté serveur et ressemble à celle du navigateur (comparaison d'image sous le seuil de L1-11).
- [ ] Clôture « corrigé » sans référence de contrôle refusée par la base ; avec référence, `defaut_traite.controle_ajoute = true`.
- [ ] Rejeu depuis l'administration : aucune ligne `appels_ia` créée ; aucun mouvement au grand livre.
- [ ] Autre compte : le signalement d'un plan qui n'est pas le sien répond 404.
- [ ] Contrôle des textes (L1-04) sur le volet et les e-mails ; commentaire échappé dans l'administration.

## Mesure
- S : `defaut_signale` (`type_defaut`, `piece`, `mode`, `cible`), `defaut_traite` (`issue`, `delai_j_ouvres`, `controle_ajoute`), `plan_rejoue` (`motif=defaut_signale`), `email_envoye`.
- N : `formulaire_commence` et `formulaire_envoye` (`formulaire=signaler_defaut`).

## Points d'attention
- **Listes alignées** : `type_defaut` (SUIVI.md § 3.2) suit désormais les choix de `defaut.choix` (MESSAGES.md § 7.10), dans le même ordre (`trou_ou_fente`, `zone_noire`, `objet_flottant`, `mur_mal_place`, `porte_inversee`, `equipement_oublie_ou_mal_oriente`, `cote_differente`, `autre`) ; `texte_technique` ne sert qu'aux défauts relevés par le contrôle automatique des textes (L1-04), jamais au formulaire.
- Les poignées `window.__v` et `App` sont documentées comme poignées de debug (CLAUDE.md) : si le moteur change, la lecture de la position casse. Une petite fonction stable exposée par le moteur serait un diff `[M]`, à faire après la fusion du travail sur les niveaux et à coordonner avec les travaux à venir sur le moteur (qualité adaptative L4-12, corrections de navigation L1-15) ; en attendant, un test de CI vérifie que la lecture fonctionne sur la version publiée du moteur.
- Visite multi-niveaux : le moteur gère les niveaux empilés depuis le 27/09/2026 (onglets, escalier, `App.state.level`) ; la position enregistre le niveau ; les duplex sont acceptés en service (`niveaux_max = 2`, L4-08).
- Le délai de 5 jours ouvrés est un engagement affiché (`defaut.merci`) : il demande une personne disponible pendant la bêta (L6-10, L6-11).
- Les contrôles ajoutés touchent `moteur/` ou `pipeline/` : chacun est un petit diff `[M]` ou `[P]` soumis au critère de fusion d'ARCHITECTURE.md § 8.1.

## Références
- CLAUDE.md (consignes, zéro défaut) ; OFFRES.md § 2.4, § 2.6, § 6.4, § 10 ; PARCOURS.md A15, E4, E6 ; MESSAGES.md § 7.10, E12.
- SUIVI.md § 3.11, § 5.6 ; ARCHITECTURE.md § 5.6, § 8.1.
- `moteur/engine.js:1746` (`window.__v`), `moteur/ui.js:3` (`App`), `moteur/controle.mjs`, `outils/finalise.sh`.

## Hors périmètre
- Administration, rejeu et journal de l'équipe : L5-17. Remboursement en argent : L8-05.
- Support général (autres demandes) : L6-11.
