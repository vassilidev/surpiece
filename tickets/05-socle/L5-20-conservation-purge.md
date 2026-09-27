# L5-20 · Conservation et purge des données

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P0 | M (1 à 3 j) | L5-02 | `service/` | À faire |

## Pourquoi
Un plan de lot déposé par son acquéreur est une donnée personnelle (`recherche/juridique.md` § 3.2). Le RGPD impose une durée par finalité, puis la suppression, y compris dans les sauvegardes à l'expiration de leur rotation ; les personnes ont droit à l'export et à l'effacement sous un mois (§ 3.4, § 3.6). Les plans des promoteurs ne doivent pas traîner dans nos seaux au-delà de ce qui est annoncé. Ce ticket porte aussi l'export et la suppression du compte, retirés de L8-03 : ils sont dus dès le premier utilisateur, donc avant la bêta fermée (prérequis de L6-10). Les durées commerciales d'OFFRES.md § 6.8 font foi (R7).

## À faire
1. **Tableau des durées** dans `service/conservation.py` (source unique, chaque ligne avec son fondement), valeurs à confirmer par l'avocat et le registre (L0-09) :
   - fichier brut `prive/depots/…` : effacé après l'analyse (`ARCHITECTURE.md` § 5.1) ; dépôt anonyme non rattaché : 24 h (purge propre à L5-23) ;
   - plan offert non débloqué (source, intermédiaires, images) : 6 mois (`OFFRES.md` § 2.2, § 6.8), rappel E11 avant (envoyé par L5-14) ;
   - visite payée : 24 mois en ligne (`OFFRES.md` § 0.1, § 6.8), puis suppression de la publication et des données du plan ;
   - pros et promoteurs : durée du contrat plus 30 jours pour l'export ;
   - compte particulier inactif : 3 ans après le dernier contact ;
   - sessions et jetons de connexion expirés, invitations expirées, table `limites` : purge courte (quelques jours) ;
   - `vues_visite_detail` : 6 mois puis agrégation ;
   - journaux techniques : 6 à 12 mois ; `evenements` : 5 ans (proposition) puis agrégation ;
   - `acceptations` et consentements : 5 ans ; factures : 10 ans, chez Stripe et l'outil comptable.
2. **Durées liées à la version d'offre achetée**, pas au catalogue du jour (décision n° 7 : droits acquis honorés) : la date de fin est calculée et stockée à la publication (`publications.heberge_jusqu_au`, écrite par L5-12 ; `plans.conserver_jusqu_au` pour les données du plan). La purge lit ces dates, jamais le catalogue en vigueur.
3. **Tâche de purge** quotidienne (Procrastinate) : suppression logique (`supprime_le`) puis effacement : lignes en base, objets de `prive/` et `publie/`, révocation des partages (L5-13), retrait des publications et purge du CDN (L5-12). Idempotente, rapport chiffré, alerte en cas d'échec (L5-16).
4. **Sauvegardes** : vérifier les règles de cycle de vie (versions du seau privé effacées après 30 jours, dumps de 30 jours et 12 mois, L5-26) ; décrire au registre que les données supprimées quittent les copies à l'expiration de leur rotation ; envisager de raccourcir la rétention mensuelle.
5. **Export du compte** (`compte.exporter`, `PARCOURS.md` A17) : travail asynchrone qui produit une archive (JSON du compte, des organisations, des plans, des achats, des acceptations ; fichiers sources et images publiées) ; lien signé valable 7 jours envoyé par e-mail ; limite de débit ; action tracée.
6. **Suppression du compte** (`compte.supprimer`) : confirmation qui dit que liens et visites cessent ; immédiatement : sessions révoquées, partages coupés, publications retirées ; puis purge ; identifiants du journal passés à `null` (utilitaire de L5-15) ; preuves (`acceptations`) et mouvements d'achats gardés le temps légal ; un membre qui part d'un cabinet laisse les plans à l'organisation.
7. **Suppression d'un plan** à la demande : effacement effectif sous 24 h.
8. **Rappels transactionnels** : E11 avant la suppression d'un aperçu est planifié et envoyé par L5-14 à partir des dates écrites ici ; le rappel de fin d'hébergement d'une visite (« à ajouter », `PARCOURS.md` A17) suivra le même mécanisme.

## Critères d'acceptation
- [ ] Plan expiré (horloge injectée) : absent de la base et des seaux, lien du CDN en 404 (critère de M3.5).
- [ ] Export d'un compte de test : toutes ses données personnelles, rien d'une autre organisation.
- [ ] Suppression d'un compte : partages en 404 en moins d'une seconde, sessions révoquées, événements anonymisés, preuves conservées.
- [ ] Purge rejouée deux fois : même résultat, aucune erreur.
- [ ] Aucune preuve ni facture purgée avant sa durée légale (test par type).
- [ ] Avec une horloge injectée, un aperçu non débloqué n'est purgé qu'à sa date de fin, après le délai du rappel E11 (envoyé par L5-14).
- [ ] Export et suppression du compte disponibles et testés avant l'ouverture de la bêta fermée (L6-10).
- [ ] Écrans de confirmation, archive d'export et e-mails : aucun texte technique (contrôle de L1-04).
- [ ] Témoin seulement, aucun appel payant ; outil local inchangé.

## Mesure
- `compte_supprime` (`motif` = `demande` ou `inactivite`, `cible`).

## Points d'attention
- **Tranché** : l'export et la suppression du compte sont un droit dès le premier utilisateur (`recherche/juridique.md` § 3.6) : ce ticket passe en P0 et L6-10 (bêta fermée) en dépend.
- **Tranché : R7.** `OFFRES.md` § 6.8 fait foi : aperçu 6 mois, visite 24 mois (repli : 12 mois plus une prolongation, si l'avocat le demande) ; `ARCHITECTURE.md` § 4.4 s'y aligne ; le registre (L0-09) suit.
- Délai du rappel E11 non fixé (`MESSAGES.md` § 7.11 « 14 jours », marqué à confirmer, § 12.2 n° 7). Les 24 mois en ligne sont à valider par l'avocat (`MESSAGES.md` § 12.3).
- **Preuves et effacement** : `acceptations` doit prouver un accord pendant 5 ans alors que le compte est effacé. Garder l'identifiant et un minimum d'identité ? À valider par l'avocat.
- `appels_ia` sert au rapprochement mensuel avec la facture OpenRouter : garder les coûts sans lien avec le plan plutôt que les effacer.
- La copie du fichier dans le navigateur (IndexedDB, 7 jours) est traitée côté client par L6-01.

## Références
- Décision de l'utilisateur du 27/09/2026, n° 7.
- `produit/ARCHITECTURE.md` § 4.1, § 4.4, § 5.1, § 5.2, § 9.3, M3.5 ; `produit/recherche/juridique.md` § 3.2, § 3.4, § 3.5, § 3.6, § 7.
- `produit/OFFRES.md` § 0.1, § 2.2, § 6.2 ; `produit/PARCOURS.md` A3, A17 ; `produit/MESSAGES.md` § 7.11 (E11), § 12.2, § 12.3 ; `produit/SUIVI.md` § 2.8 (règle 4), § 2.12.

## Hors périmètre
- Registre et procédures RGPD : L0-09. Purge d'Umami (25 mois) : L7-01. Sauvegardes : L5-26.
- Renonciation et remboursements : L8-03, L8-05. Expiration des crédits : L5-07. Rappels E10 et E11 : L5-14.
