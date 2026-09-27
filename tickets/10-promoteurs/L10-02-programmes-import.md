# L10-02 · Programmes, lots et import

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | L (3 à 5 j) | L1-10, L2-18, L5-06, L5-09, L6-02, L10-01 | `service/` | À faire |

## Pourquoi
Un promoteur dépose tous les plans d'un programme d'un coup (PARCOURS.md C2, C4). Il faut rattacher chaque plan à son lot, qualifier sans rien payer pour produire le rapport de prise en charge qui fonde le devis, puis lancer la production sans surveillance, en basse priorité et sous un budget d'import (OFFRES.md § 4.9). Consigne du projet : plan par plan, sans généraliser. Un lot hors périmètre (duplex, maison, plusieurs logements sur une page, plan illisible) est signalé avec sa raison, jamais forcé (ARCHITECTURE.md M5.1). **Tranché : R17.** Aujourd'hui, l'analyse empilerait un PDF de plusieurs lots comme des niveaux : en service, la qualification refuse « plusieurs lots » (L6-02), et ce ticket est le **seul** endroit qui découpe un PDF multi-lots (`OFFRES.md` § 1, § 4.1).

## À faire
1. **Migration** : `programmes`, `lots`, `imports` (ARCHITECTURE.md § 4.2), plus :
   - `lots.statut` : `en_attente`, `non_pris_en_charge`, `pris_en_charge`, `en_file`, `en_cours`, `pret_a_controler`, `en_correction`, `valide`, `echec_equipe` ;
   - `lots.motif_refus` : codes de SUIVI.md § 3.2, plus `maison`, `plusieurs_lots`, `peu_lisible` (PARCOURS.md § 8.1) ;
   - `lots.fichier_nom` (jamais dans une URL), `imports.mode` (`rapport`, `production`), `imports.cout_usd` ;
   - `programmes.autorisation_diffusion` : clé d'objet de la licence signée (L10-01), renseignée par l'équipe.
   Toutes les requêtes sont cadrées par `organisation_id` (404 en accès croisé, L5-05).
2. **Dépôt** (URL signées de L5-05) :
   - plusieurs fichiers ; ou une archive ZIP, ouverte dans le worker isolé de L5-19 (nombre de fichiers, taille décompressée, chemins `../` refusés, type reconnu aux premiers octets comme `format_fichier`, `pipeline/serveur.py:52`) ;
   - ou un PDF à plusieurs lots, **découpé une page = un plan dans `service/`, avant toute analyse** (R17). Raison : `analyse` (`pipeline/serveur.py`, l. 164-176) traite un PDF de plusieurs pages soit comme des niveaux superposés (`pages_niveaux`, `empiler`), soit en ne lisant que la page la plus détaillée (`choisir_page`). Un PDF à plusieurs lots ne doit jamais lui être passé tel quel.
3. **Grille des lots** en CSV, facultative : référence, typologie, étage, surface annoncée, nom du fichier. Sinon, références lues dans les noms de fichiers. Rapprochement automatique, puis manuel pour le reste (écran C4). Doublons repérés par l'empreinte SHA-256, dans la même organisation seulement (ARCHITECTURE.md § 5.7).
4. **Mode `rapport`** (C2) :
   - acceptation des conditions du rapport rédigées par L10-01 (ligne `acceptations`) ;
   - pour chaque lot : analyse sans IA (file `analyse`) puis qualification (environ 0,02 $, L6-02), sous `imports.budget_usd` ; aucune lecture ;
   - rapport à l'écran et en PDF (impression Chromium côté serveur, sans IA) : lots pris en charge, lots non pris en charge avec la raison en clair (textes du catalogue L4-05, jamais un code), « Oui, échelle à confirmer » pour une image, nombre de lots retenus pour le devis ;
   - effacement des fichiers 30 jours après le rapport s'il n'y a pas de commande (règle ajoutée à la purge de L5-20).
5. **Mode `production`**, refusé tant que `autorisation_diffusion` est vide :
   - récapitulatif « ‹n› lots à produire · livraison visée : ‹délai› » (textes à ajouter à MESSAGES.md ; délai de programme du contrat, jamais un délai par génération écrit en dur, R12) ;
   - `imports.budget_usd` = nombre de lots × 3 $ (plafond par plan, toutes passes et relances confondues, R6), réservé par L5-09 ; lot de crédits `programme` au grand livre (L5-07) égal aux lots pris en charge ;
   - travaux en file `lecture_lots`, basse priorité, 4 lectures simultanées au plus par organisation ; priorité aux particuliers réglée avec L5-22.
6. **Garde-fous invisibles pour le client** (OFFRES.md § 4.9) :
   - après 5 lots, coût moyen au-delà de 2,50 $ : plus aucun lancement, alerte à l'équipe, `import_arrete` ;
   - fichier identique déjà lu : pas relu ;
   - `niveaux_max = 1` (L4-08) : un plan à plusieurs niveaux est `non_pris_en_charge` (`plusieurs_niveaux`), jamais tenté ;
   - lot en échec : passe à l'équipe (`echec_equipe`, rejeu sans IA, PARCOURS.md E4), jamais facturé tant qu'il n'est pas validé ; un défaut de notre fait est corrigé gratuitement (R14).
7. **Suivi par lot** (tableau C4) : statuts ci-dessus, libellés du catalogue, en lecture seule tant que L10-03 n'est pas livré.
8. **Fin d'import** : `imports.fini_le`, `lots_ok`, `lots_echec`, e-mail à l'équipe.

## Critères d'acceptation
- [ ] Programme de test fait du témoin fictif dupliqué en 5 lots et d'un plan fabriqué avec deux logements sur une page : rapport produit sans lecture payante (qualification rejouée depuis une réponse gardée ou `PLAN_MOCK`), le plan fabriqué signalé `plusieurs_lots` avec sa raison en clair.
- [ ] PDF de 5 pages, une par lot : 5 plans d'une page chacun, jamais empilés en niveaux (test sur les fichiers remis à l'étape d'analyse).
- [ ] ZIP piégé (chemin `../`, bombe de décompression, fichier qui n'est pas un plan) : refus propre, rien écrit hors du dossier de travail.
- [ ] Coût moyen simulé à 2,60 $ après 5 lots : aucun lancement de plus, `import_arrete`, alerte reçue.
- [ ] Jamais plus de 4 lectures simultanées par organisation ; un plan de particulier lancé pendant l'import passe devant (test de file).
- [ ] Mode `production` refusé sans licence enregistrée ; accès d'une autre organisation au programme : 404 ; aucun nom de fichier dans une URL.
- [ ] Rapport écran et PDF passés au contrôle « aucun texte technique » (L1-04) ; tout défaut trouvé devient un contrôle automatique.
- [ ] Outil local inchangé (aucun fichier de `pipeline/` ni de `moteur/` modifié).

## Mesure
- `import_cree` (`lots_deposes`, `budget_usd`), `rapport_prise_en_charge_livre` (`lots_total`, `lots_pris_en_charge`, `motifs_refus`, `cout_usd`), `import_arrete` (`lots_faits`, `cout_moyen_usd`).
- Par lot : `plan_depose` (`canal_depot=import`), `plan_analyse`, `plan_qualifie`, `plan_lance` (`source_lot=programme`), `plan_pret`, `plan_echoue`.
- `import_termine` (`lots_ok`, `lots_echec`) : à ajouter à SUIVI.md § 3.13 et à `mesure/evenements.json` dans la même modification (PARCOURS.md § 8.1).

## Points d'attention
- **Taille** : L au plafond, avec deux livrables distincts. Si le ticket déborde, le couper en « rapport de prise en charge » et « import de production ».
- **Tranché** : L6-02 (qualification, refus « plusieurs lots ») et L1-10 (masquage du cartouche : les plans d'un promoteur portent son nom et celui du programme) sont des dépendances déclarées. L10-01 (conditions du rapport, licence) ne l'est pas : le code peut se faire avant, mais les modes `rapport` et `production` ne s'ouvrent pas sans ses textes.
- **Tranché : R7.** OFFRES.md § 4.9 et ARCHITECTURE.md § 6.5 disent désormais la même chose : dollars d'IA réservés dans `imports.budget_usd`, lots commandés au grand livre comme un lot `programme`.
- **Capacité** : « 5 jours ouvrés pour 50 lots » suppose 50 lectures de 8 à 15 min (mesure sur Mac), 4 à la fois (2 à 3 h d'IA), plus le rendu des images en SwiftShader dans le conteneur, la base partout (R3, L5-11) ; une accélération (L13-01) reste optionnelle. À mesurer au pilote (L10-08).
- **Coût** : 50 lots × 1,10 à 1,85 $ mesurés, 3 $ au plafond par lot ; aucune lecture payante pour tester ce ticket.
- **Coordination avec le travail sur les duplex** : aucun fichier de `pipeline/` modifié ; le découpage des pages se fait dans `service/` avec PyMuPDF, avant l'étape `analyser` de L4-04. `niveaux.py` n'est pas touché (ARCHITECTURE.md § 8.1, règle 4).
- La saisie des devis, pilotes et commandes (`devis_envoye`, `pilote_signe`, `commande_signee`) est construite par L10-09.

## Références
- produit/ARCHITECTURE.md § 4.2 (`programmes`, `lots`, `imports`), § 5.7, § 6.5, § 8.1, M5.1, D7.
- produit/OFFRES.md § 4.1, § 4.3, § 4.9, § 6.2 ; produit/PARCOURS.md § 1.6, C2, C4, E4, § 8.1.
- produit/SUIVI.md § 3.2, § 3.6, § 3.8, § 3.13, § 4.4, § 7.5 (R11) ; produit/recherche/hebergement.md § 6 (imports de promoteurs).
- `pipeline/serveur.py:52` (`format_fichier`), `:126` (`choisir_page`), `:132-195` (`analyse`, pages 164-176), `:218` (`niveaux_refus`), `:260` (`qualifier`).

## Hors périmètre
- Offre, licence et conditions du rapport : L10-01. Contrôle et validation par le promoteur : L10-03.
- Intégration, liens acquéreurs, clés d'API : L10-04. Pilote : L10-08. Saisie commerciale et facturation : L10-09.
- Refus « plusieurs lots » dans le parcours des particuliers et des conseillers : L6-02.
- Budgets IA génériques : L5-09. Accélération du rendu : L13-01. Plans sur plusieurs niveaux : L13-08.
