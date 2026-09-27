# L2-12 · Liste d'attente bêta et formulaires pros

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L0-03, L0-08, L2-01 | `site/`, `service/` | À faire |

## Pourquoi
Tant que le service en ligne n'existe pas, le bouton « Importer mon plan » inscrit à la bêta ; la bêta express (L3-06) et la bêta fermée (L6-10) recrutent leurs testeurs dans cette liste. Les pages pros ont besoin de formulaires de démonstration et de présentation. La vitrine est statique : il faut un petit point de réception, hébergé dans l'UE, qui respecte le consentement et ne laisse passer ni le spam ni un texte technique.

## À faire
1. **Décision d'outil** (à consigner dans ARCHITECTURE.md § 3 à côté de D4 et D6, par l'utilisateur) :
   - A. **Maison** : petit service FastAPI dans le Docker Compose (décision 2), base Postgres ou SQLite sur volume sauvegardé, envoi par le fournisseur d'e-mails D4 ; conçu pour devenir un routeur de l'application de L5-01. **Recommandé** : déployable partout, données chez nous, aucun script tiers dans les pages.
   - B. **Brevo** (société française) : formulaires, double confirmation et export prêts ; hébergement UE et DPA non vérifiés (hebergement.md § 9) ; le formulaire intégré charge des scripts tiers (CSP, traceurs à vérifier).
   - C. Fonction sans serveur de l'hébergeur retenu (Scaleway), avec la même base : composant propre à un hébergeur, qui ne peut pas être obligatoire (décision 2, R3) ; à écarter sauf comme variante optionnelle de A.
2. **Point de réception** (option A) `service/formulaires/` : `POST /api/formulaires/<type>` pour `liste_attente`, `rdv_pro`, `contact_promoteur`, `contact_partenaire`, `signalement` (L2-11) ; validation stricte des champs (liste blanche, longueurs), limite de débit par IP, réponse JSON avec un code du catalogue (jamais de détail technique), CORS limité au domaine de la vitrine.
3. **Liste d'attente** : e-mail (obligatoire), profil (particulier, conseiller, promoteur, partenaire), « Où en êtes-vous ? » pour un particulier (choix de MESSAGES.md § 7.3, facultatif), activité et volume estimé pour un pro (facultatifs) ; une seule finalité annoncée : être invité à la bêta.
4. **Double confirmation** : e-mail de confirmation avec lien à usage unique (jeton de 128 bits haché, 7 jours) ; l'inscription n'est active qu'une fois confirmée ; lien de désinscription dans chaque e-mail ; domaine d'envoi avec SPF, DKIM et DMARC.
5. **Formulaires pros** : champs exactement comme MESSAGES.md § 3.9 (promoteurs) et § 4.4 (partenaires) ; pour les conseillers, prénom, nom, cabinet, e-mail professionnel, téléphone facultatif, activité, plans par mois estimés, message. Confirmations et erreurs des § 3.9 et § 4.4.
6. **Consentement et information** : aucune case pré-cochée ; sous chaque formulaire, une mention courte (« Vos coordonnées servent seulement à … ») et le lien vers la politique de confidentialité (L2-11) ; durée de conservation proposée : liste d'attente effacée à la désinscription ou 3 ans après le dernier contact, demandes pros 3 ans (à valider au registre, L0-09).
7. **Anti-spam** : Cloudflare Turnstile en mode géré (clé de L0-08), vérifié côté serveur ; en plus un champ piège et un délai minimal de saisie. Repli sans Turnstile si l'avocat ne valide pas son exemption.
8. **Notification à l'équipe** : e-mail à l'adresse de l'équipe pour chaque demande pro et chaque signalement ; résumé quotidien pour la liste d'attente ; aucun contenu libre dans l'objet.
9. **Export** : commande `python -m formulaires.exporter --type liste_attente` qui écrit un CSV hors du dépôt (jamais versionné), avec journal de l'export.
10. **Journal** : une ligne par demande avec le nom d'événement du dictionnaire (`rdv_pro_demande`, `contact_promoteur_recu`, `contact_partenaire_recu`) et les propriétés prévues, pour reprise dans le journal `evenements` de L5-15.
11. **Côté pages** : composant formulaire de L2-01 branché (`site/js/formulaires.js`), états « envoi », « confirmé », « erreur » annoncés en `aria-live`.
12. Textes manquants à rédiger, faire valider et reporter dans MESSAGES.md (par son propriétaire) : bloc de la liste d'attente, e-mail de confirmation, e-mail de bienvenue, page « inscription confirmée », page « désinscription ».

## Critères d'acceptation
- [ ] `docker compose up` lance le service en local ; parcours complet testé avec Mailpit : inscription, e-mail reçu, confirmation, désinscription.
- [ ] Une inscription non confirmée n'apparaît pas dans l'export ; un jeton réutilisé ou expiré est refusé avec un message du catalogue.
- [ ] Envoi sans jeton Turnstile valide, avec champ piège rempli, ou au-delà de la limite de débit : refusé, rien n'est stocké.
- [ ] Aucune réponse du service ne contient de trace, de nom de fichier, de SQL ni de nom de fournisseur (test automatique sur les erreurs provoquées).
- [ ] Données stockées dans l'UE ; secrets (clé Turnstile, fournisseur d'e-mails) injectés au démarrage, jamais dans le dépôt ni dans l'image.
- [ ] Sauvegarde quotidienne de la base et restauration testée une fois.

## Mesure
Côté navigateur (selon L2-14) : `formulaire_commence`, `formulaire_refuse`, `formulaire_envoye`. Côté serveur, lignes gardées pour L5-15 : `rdv_pro_demande`, `contact_promoteur_recu`, `contact_partenaire_recu`.

## Points d'attention
- **Tranché** : L0-03 (fournisseur d'e-mails D4, hébergement D2) et L0-08 (clés Turnstile, domaine d'envoi) sont des dépendances déclarées.
- **Taille** : service, double confirmation, anti-spam, trois formulaires, export, sauvegarde : plutôt L (3 à 5 j). Découper si besoin : service et liste d'attente d'abord, formulaires pros ensuite.
- **Chevauchement avec L5-01** : si l'option A est retenue, le service préfigure `service/` ; garder FastAPI et la même configuration pour que L5-01 l'absorbe au lieu de le réécrire.
- **Dictionnaire** : la liste d'attente n'a pas d'événement. Proposition à ajouter à SUIVI.md § 3.2 et § 3.4 : `formulaire` = `liste_attente`, et côté serveur `liste_attente_inscrite`, `liste_attente_confirmee`.
- **RGPD** : prospection par e-mail d'un particulier interdite sans consentement ; la liste ne sert qu'à inviter à la bêta, rien d'autre sans nouvelle case.
- **Règle projet** : tout message d'erreur passe par le catalogue ; un défaut trouvé (texte technique, spam) devient un test.

## Références
- produit/MESSAGES.md § 2.8, § 2.9, § 3.9, § 4.4, § 7.1 (« Me prévenir si cela change »), § 7.3 (« Où en êtes-vous ? ») ; produit/SUIVI.md § 3.2, § 3.4, § 3.12 à § 3.14, § 6.2.
- produit/ARCHITECTURE.md § 2.1 (formulaires postés à l'API), § 6.2 à § 6.4, D4 ; produit/recherche/hebergement.md § 9 ; produit/recherche/auth-paiement.md § 3.5 (Turnstile) ; produit/recherche/juridique.md § 3.1, § 3.4.

## Hors périmètre
- Politique de confidentialité et formulaire de signalement (textes) : L2-11. Recrutement des testeurs : L3-06.
- Journal `evenements` : L5-15. E-mails transactionnels du service : L5-14. Support : L6-11.
