# L12-04 · Premières campagnes

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 12 · Publicité et conversions | P1 | M (1 à 3 j) | L12-01, L12-02 | — | À faire |

## Pourquoi
Une fois les conversions transmises et vérifiées (R15), on peut acheter du trafic en sachant ce qu'il rapporte. Le repère économique est connu : un aperçu offert coûte 2,56 € au cas prudent, et il faut débloquer au moins 11,1 % des aperçus à 29 € pour couvrir leur coût (OFFRES.md § 8.8). Une campagne doit donc se juger sur la marge par aperçu et le coût par achat, pas sur les clics. Meta impose des règles propres au logement (« Housing ») qui peuvent s'appliquer à nos annonces (recherche/suivi.md § 4.4).

## À faire
1. **Prérequis cochés** : ouverture publique faite (L8-07) : **Tranché : R13**, pendant la bêta fermée le dépôt est réservé aux invités et aucun message ne propose 29 €, donc aucune campagne vers le dépôt ; recette R15 réussie en mode test sur les deux plateformes (L12-01, L12-02) ; avenant Meta et confidentialité à jour (L12-03) ; entonnoirs et tableaux de bord en place (L7-05, L7-06) ; budget du plan offert indexé et coupe-circuit actifs (L8-09).
2. **Convention UTM** (SUIVI.md § 2.9) dans les modèles d'URL des plateformes : `utm_source` `google` ou `meta`, `utm_medium` `cpc` ou `paid_social`, `utm_campaign` au format `aaaa_mm_<cible>_<theme>`, `utm_content` pour la variante, `utm_term` pour le mot-clé. Vérifier sur une arrivée de test que le canal calculé est `payant_google` ou `payant_meta`.
3. **Politiques publicitaires** :
   - Meta : tester dès les premières annonces le classement « Housing » (ciblage restreint : âges de 18 à 65 ans et plus, pas de genre, rayon d'au moins 25 km, pas d'audiences similaires) ; nous vendons un logiciel, mais une annonce « votre futur appartement » peut y être classée ;
   - rédaction : vocabulaire de MARQUE.md § 5 (jamais « au centimètre », « garanti ») ; mention non contractuelle sur les visuels ; visuels de l'appartement témoin seulement, jamais un plan de promoteur.
4. **Pages d'atterrissage**, aux adresses canoniques de `MESSAGES.md` § 0.9 (R9) : accueil, `/offert`, `/appartement-temoin`, guides (L2-17 : rétractation VEFA, visite cloisons, TMA), `/pro`, `/promoteurs` ; message de l'annonce repris par la page. **Tranché : R21** : une annonce pro ne promet l'essai en ligne qu'une fois L9-02 en production ; avant, elle mène à l'entretien ou à la bêta fondateurs.
5. **Budget de test** : plafond mensuel fixé par l'utilisateur et écrit avant le lancement ; campagnes courtes par thème ; règle d'arrêt écrite d'avance (par exemple coût par aperçu offert et coût par achat comparés à la marge par aperçu, OFFRES.md § 9.1). La dépense d'IA induite reste bornée par la clé du plan offert (L8-09).
6. **Dépenses** : saisie mensuelle par canal pour le coût d'acquisition (SUIVI.md § 7.3, point 5), lue par L7-06.
7. **Lecture** : entonnoirs du § 4 par `canal_premier` et `canal_dernier` ; l'attribution est un minorant (refus de consentement) ; annotation Umami à chaque lancement et arrêt ; décision écrite après chaque période (3 semaines ou environ 150 aperçus).

## Critères d'acceptation
- [ ] Liste des prérequis signée ; plafond de budget et règle d'arrêt écrits avant la première annonce.
- [ ] Une arrivée de test par plateforme porte les bons UTM et le bon canal dans `attribution`.
- [ ] Classement « Housing » vérifié sur les premières annonces Meta et consigné.
- [ ] Compte rendu de la première période : dépenses, aperçus, achats, coût par achat, marge par aperçu, décision.

## Points d'attention
- LinkedIn (`utm_source=linkedin`) ne reçoit aucune conversion serveur dans ce lot : mesure par UTM et source déclarée seulement.
- Non vérifié : classement « Housing » de nos annonces, politiques Google Ads propres à l'immobilier.
- **Tranché : R8.** Aucun prix n'est testé par annonce : les tests de prix se font par périodes (L8-06), jamais par un prix tiré au sort par personne (L221-5).
- Coût : l'IA des aperçus induits (1,10 à 1,85 $ par plan) s'ajoute à la dépense publicitaire.

## Références
- produit/SUIVI.md § 2.9, § 4.2 à § 4.7, § 5.2, § 7.3 ; produit/OFFRES.md § 8.8, § 8.11, § 9.1, § 9.2 (T3, T10, T11).
- produit/recherche/suivi.md § 4.4 ; produit/recherche/marche.md § 3.2, § 5.5 (point 1) ; produit/MARQUE.md § 5.

## Hors périmètre
- Envois des conversions : L12-01, L12-02. Consentement et pixel : L12-03. Tests A/B de la vitrine : L12-05. Guides : L2-17.
