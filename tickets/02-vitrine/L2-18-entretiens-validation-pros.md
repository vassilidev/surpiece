# L2-18 · Entretiens de validation avec conseillers et promoteurs

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L1-12 | — | À faire |

## Pourquoi
Les offres Pro (lot 9) et Programme (lot 10) reposent sur des hypothèses : que les conseillers veulent un lien de visite par lot, qu'ils paieront 49, 99 ou 199 € HT par mois, qu'ils ont l'autorisation du promoteur ; que les promoteurs veulent « tous les lots ». Aucune n'est mesurée (OFFRES.md § 9.1, marche.md § 6). Avant de construire L9-01 et L10-02, qui dépendent de ce ticket, on les confronte à 15 à 20 conseillers et à quelques promoteurs, avec une démonstration sur l'appartement témoin fictif.

## À faire
1. **Préparer** (1/2 j) :
   - liste de cibles : CGP qui vendent du neuf (annuaires CNCGP et ANACOFI), mandataires qui utilisent le filtre « Neuf » d'iad, commercialisateurs ; promoteurs via les chambres régionales de la FPI ;
   - guide d'entretien de 30 min : contexte (lots vendus par mois, part à distance, outils actuels), démonstration du témoin (visite, plan 2D, fiche ; page L2-09 si publiée, sinon outil local sur `plans/temoin`, copie de `references/temoin/`, R11 ; démonstration faite aussi sur un appareil modeste, portable d'entrée de gamme ou téléphone, décision 12 : un défaut de fluidité vu en entretien devient un cas du banc de L1-14), questions de mesure (point 2), réaction aux prix, autorisation du promoteur, taux de désistement ;
   - tableau de suivi privé (hors dépôt) ; message d'invitation ; consentement à la prise de notes et, si l'entretien est enregistré, à l'enregistrement.
2. **Mesurer chez les conseillers** (test T6) :
   - la part qui **demande l'essai** (intention déclarée ou inscription à la bêta fondateurs via L2-12, puisque l'essai n'existe pas encore) ;
   - les plans par mois qu'ils déclarent ;
   - leur réaction à 49, 99 et 199 € HT (sans prix barré ni engagement ; formulés comme hypothèses) ;
   - s'ils ont l'autorisation du promoteur (convention de commercialisation) ;
   - leur taux de désistement et leur temps de décision (donnée publique manquante) ;
   - l'intérêt pour le meublé (+3 € HT), sans le vendre ni le dater (T12).
3. **Premiers échanges promoteurs** (test T7, en amont du pilote) : intérêt pour « tous les lots », rapport de prise en charge offert, pilote à 600 € HT, exigences (SLA, SSO, intégration), leurs chiffres de désistement, et la question des droits sur les plans.
4. **Règles pendant les entretiens** :
   - **aucun plan de promoteur montré**, même anonymisé ; seulement le témoin fictif ;
   - aucune lecture payante (pas de génération en direct d'un plan apporté par l'interlocuteur : droits non vérifiés et coût) ;
   - aucune promesse de date, de fonction non construite ni de prix ferme ; parler de fonction « en préparation » (MARQUE.md § 3.4) ;
   - aucun concurrent dénigré.
5. **Synthèse et décision écrite** :
   - `produit/recherche/entretiens-pros.md` (nouveau, anonymisé : pas de nom de personne, de cabinet ni de programme) : échantillon, réponses agrégées, citations anonymes, taux mesurés ;
   - décision écrite par l'utilisateur : **si moins d'un tiers des conseillers demande l'essai, revoir la promesse avant le prix** ; sinon, confirmer ou ajuster formules, quotas et prix ;
   - reporter la décision dans OFFRES.md § 9.2 (T6, T7) et, si besoin, MESSAGES.md § 2 et § 3 (par leurs propriétaires).

## Critères d'acceptation
- [ ] Au moins 15 entretiens de conseillers menés (objectif 20) et au moins 3 échanges avec des promoteurs ou des chambres de la FPI, datés dans le suivi privé.
- [ ] Les cinq mesures du point 2 sont chiffrées sur l'échantillon, avec leur taille.
- [ ] La synthèse ne contient aucune donnée personnelle ni nom de programme, et aucun plan de promoteur n'a été montré ni reçu.
- [ ] La décision est écrite, datée, signée par l'utilisateur, et reportée dans OFFRES.md § 9.2.
- [ ] Aucune dépense IA engagée pour les démonstrations.

## Points d'attention
- **Coûts et délais** : trouver 20 conseillers prend du temps calendaire (relances) même si la charge reste de quelques jours ; prévoir 3 à 4 semaines calendaires.
- **RGPD** : les coordonnées et notes des interlocuteurs sont des données personnelles (prospection B2B) : base intérêt légitime, information à la prise de contact, conservation limitée, jamais dans le dépôt.
- **Juridique** : ne pas présenter comme acquis le suivi détaillé des prospects ni le partage par des codes (avis de l'avocat attendus, OFFRES.md annexe B) ; ne pas collecter de plans « pour essayer ».
- **Porte d'entrée des pages pros** (R21) : avant les lots 9 à 11, `/pro`, `/promoteurs` et `/marque-blanche` renvoient vers ces entretiens ou vers la bêta fondateurs, jamais vers un essai en ligne.
- **Cohérence** : les réponses sur les prix alimentent L0-04 et L8-06 ; celles sur l'autorisation du promoteur alimentent L9-08 ; celles des promoteurs, L10-01.
- Le témoin doit être prêt et sans défaut visible (L1-12) : un défaut vu en démonstration devient un contrôle automatique avant l'entretien suivant.

## Références
- produit/OFFRES.md § 3, § 4, § 9.1, § 9.2 (T6, T7, T12), annexe B ; produit/recherche/marche.md § 4.1, § 4.2, § 5.5 (points 2, 3 et 5), § 6.
- produit/PARCOURS.md § 8.3 ; produit/MARQUE.md § 3.2, § 3.4, § 8.4 ; produit/MESSAGES.md § 2.2 (aucune promesse sur les désistements).

## Hors périmètre
- Recrutement et suivi des premiers conseillers payants : L9-11. Offre et contrat promoteur : L10-01. Premier pilote : L10-08.
- Construction des offres : L9-01 et suivants, L10-02 et suivants.
