# L5-14 · E-mails transactionnels

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-01, L1-04 | `service/` | À faire |

## Pourquoi
L'outil actuel promet de prévenir « onglet fermé » par l'API Notification, qui ne marche que page ouverte (`pipeline/accueil.html:93`, `:135-144` ; audit A4). L'e-mail envoyé par le serveur est le seul canal fiable : lien de connexion (L5-03 en dépend), aperçu ou visite prête, précision demandée, échec sans rien décompter, et les rappels (plans à lancer, aperçu non débloqué avant sa suppression). Décision D4 : Scaleway TEM recommandé, Brevo en alternative. Décision de l'utilisateur n° 2 (« déployable partout ») : l'envoi passe par une interface qui accepte n'importe quel SMTP.

## À faire
1. **`service/emails/envoi.py`** : interface `Expediteur` avec une implémentation SMTP générique (TEM, Brevo ou tout autre) et Mailpit en local (service du Compose de L5-01). Fournisseur choisi par la configuration, clé d'envoi injectée au démarrage, présente seulement dans le web et le worker (`ARCHITECTURE.md` § 2.1).
2. **Domaine d'envoi** `mail.<domaine>` : SPF, DKIM, DMARC (`p=none` au départ, `quarantine` après deux semaines de rapports propres), adresse de réponse `aide@<domaine>`. Enregistrements DNS décrits dans une procédure (L5-21), sans secret.
3. **Modèles** dans `service/emails/modeles/` (Jinja2), chacun en HTML et en texte brut, un seul bouton, pied commun, textes repris de `MESSAGES.md` § 7.11 (ou du catalogue de L4-05 s'il les porte). Nom et domaine lus dans `MARQUE_NOM` et `DOMAINE_PRINCIPAL`, jamais en dur. Modèles de ce lot :
   - E1 lien de connexion, avec le code à 6 chiffres (`PARCOURS.md` A5, « à ajouter » dans `MESSAGES.md`) ;
   - E2 bienvenue, E3 plan offert prêt, E4 visite prête, E5 précision demandée, E6 échec, rien n'a été décompté ;
   - E10 rappel des plans à lancer et E11 rappel avant la suppression d'un aperçu non débloqué, envoyés par ce ticket (étape 11) ;
   - E12 (défaut) préparé pour L6-09.
4. **Variables** : chaque `{variable}` a un repli ; une variable absente lève une erreur en test et n'est jamais envoyée brute. Le délai de bout en bout n'est jamais écrit en dur (R12) : `{delai}` vient de la configuration (valeur T0, L5-11) ; avant T0, la phrase qui le porte (E2) est retirée ou remplacée par son repli (`MESSAGES.md` § 0.3).
5. **Contrôle des textes** : étendre L1-04 aux e-mails rendus (texte visible du HTML et texte brut) avec des données de test, bloquant en CI.
6. **Aucun traceur** : ni pixel, ni image distante hors logo servi par `cdn.<domaine>`, ni lien raccourci par un tiers, ni paramètre de suivi (`SUIVI.md` § 2.13, D4).
7. **Envoi par la file** (tâche Procrastinate) avec nouvelles tentatives et clé d'idempotence (`travail_id` + modèle, ou `jeton_connexion`) : une relance n'envoie jamais deux fois.
8. **Rebonds et plaintes** : webhook du fournisseur → table `contacts_email` (statut par adresse normalisée), alerte (L5-16) ; plus d'envoi vers une adresse en plainte, sauf lien de connexion demandé.
9. **Préproduction** : liste d'adresses de l'équipe autorisées, tout autre destinataire refusé (`ARCHITECTURE.md` § 9.1).
10. **Journaux** : modèle et identifiants internes seulement, jamais l'adresse ni le contenu.
11. **Rappels planifiés** (tâche quotidienne Procrastinate) :
   - E10 (`MESSAGES.md` E10) : lots non utilisés dont l'échéance approche, 30 jours puis 7 jours avant (`OFFRES.md` § 2.3, § 6.8) ; dates et sources lues au grand livre (L5-07) et dans la version d'offre du lot, jamais dans le catalogue du jour ;
   - E11 : aperçu non débloqué, avant la fin de ses 6 mois (`OFFRES.md` § 6.8) ; date lue dans `publications.heberge_jusqu_au` (L5-12), délai du rappel à confirmer (`MESSAGES.md` § 12.2) ; la purge elle-même est faite par L5-20 ;
   - clé d'idempotence par lot ou publication et par échéance : un rappel n'est jamais envoyé deux fois ; aucun rappel pour un lot déjà utilisé ou un aperçu déjà débloqué ;
   - pendant la bêta fermée (R13), variantes `.beta` sans prix ni bouton d'achat : le bouton d'E11 « Ouvrir la visite · 29 € » n'est pas envoyé avant le lot 8.
12. **Aucun prix pendant la bêta** : tant que seule la variante « bêta » du catalogue est publiée (L5-08), aucun modèle ne propose 29 € ni un autre prix (R13, test sur les modèles rendus).

## Critères d'acceptation
- [ ] Dans Mailpit, chaque modèle du lot reçu avec des données de test : HTML et texte brut, un seul bouton, liens vers `app.<domaine>` seulement.
- [ ] Test automatique : aucune image de suivi (1 × 1, image distante hors `cdn.<domaine>`), aucun paramètre de suivi dans les liens.
- [ ] Contrôle « aucun texte technique » (L1-04) réussi sur tous les modèles ; une variable non remplie fait échouer le test.
- [ ] Tâche d'envoi rejouée : un seul e-mail reçu.
- [ ] Changement de fournisseur par la seule configuration (Mailpit puis un second serveur SMTP de test).
- [ ] En préproduction : SPF, DKIM et DMARC valides sur un e-mail reçu (en-têtes `Authentication-Results`).
- [ ] Aucune adresse ni aucun contenu d'e-mail dans les journaux de la suite de tests.
- [ ] Rappels avec une horloge injectée : E10 à 30 jours puis à 7 jours de l'échéance d'un lot non utilisé, une seule fois chacun ; E11 une seule fois avant la fin d'un aperçu non débloqué ; aucun rappel après utilisation ou déblocage.
- [ ] En variante bêta : aucun modèle rendu ne contient un prix ni « un quart d'heure » (contrôle des textes).

## Mesure
- `email_envoye` (`modele`), écrit quand le fournisseur accepte l'envoi.
- `lien_magique_envoye` (`contexte`) pour E1.
- `email_envoye` (`modele` = `rappel_suppression_apercu`) pour E11 ; E10 : `rappel_expiration_30j`, `rappel_expiration_7j` (SUIVI.md § 3.8).

## Points d'attention
- **Dictionnaire** : `SUIVI.md` § 3.8 donne désormais une valeur de `modele` par e-mail (E2 `bienvenue`, E6 `echec`, E7 `recu`, E8 `ouverture_immediate`, E12 `defaut_recu`, `defaut_corrige`, `defaut_non_retrouve`, E13 `essai_debut`, E14 `essai_fin_proche`…) ; les reporter dans `mesure/evenements.json` avant l'envoi.
- **Libellé de l'échec** : tranché par la hiérarchie des sources. Le mot « crédit » reste interne (`OFFRES.md` § 1) et `MESSAGES.md` fait foi pour les textes : le client lit « rien n'a été décompté » (E6). Le nom interne `credit_rendu` reste.
- Durée de validité du lien de connexion à fixer (`MESSAGES.md` § 12.2, n° 7 ; 15 min dans `ARCHITECTURE.md` § 6.3).
- D4 n'est pas encore validée (L0-03). Envoi depuis le domaine d'un client en marque blanche non vérifié chez TEM.
- Tranché : R2. E3 part à la publication de l'aperçu (vue du dessus et plan 2D prêts), E4 à la publication de la visite (L5-11).
- Les rappels lisent le grand livre (L5-07) et les publications (L5-12), qui ne sont pas dans les dépendances : la tâche de l'étape 11 se branche quand ils sont fusionnés.

## Références
- `produit/ARCHITECTURE.md` D4, § 2.1, § 9.1, M2.10 ; `produit/MESSAGES.md` § 0.3, § 7.11, § 7.12, § 12.2 ; `produit/PARCOURS.md` A5, A7, § 8.2.
- `produit/SUIVI.md` § 2.13, § 3.7, § 3.8 ; `produit/recherche/hebergement.md` § 9 ; `produit/recherche/audit-code.md` A4.
- `pipeline/accueil.html:93`, `:135-144` (notification actuelle).

## Hors périmètre
- Parcours de connexion : L5-03. Purge après le rappel : L5-20. Défauts : L6-09.
- E-mails d'achat et de renonciation (E7 à E9) : L8-01, L8-03. Conseillers (E13 à E15) : L9.
- Boîte `aide@` et réponses types : L6-11. Expéditeur à la marque d'un client : L11.
