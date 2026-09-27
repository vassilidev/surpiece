# L6-06 · Plan offert et anti-abus

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P0 | M (1 à 3 j) | L5-07, L5-09 | `service/` | À faire |

## Pourquoi
Le premier plan offert coûte autant en IA qu'un plan payant (2,56 € au cas prudent, OFFRES.md § 8.8) : c'est un budget d'acquisition borné, qui doit résister à la création de comptes en série. Décision utilisateur 3 : blocages côté logiciel, faciles à activer, puis plafonds des clés OpenRouter en second verrou. Les règles sont posées par recherche/auth-paiement.md § 3.5 et OFFRES.md § 2.2 (M3.3). La clé OpenRouter « gratuit », réservée au plan offert des particuliers (R23), et l'interrupteur d'arrêt sont dans L5-09 ; le budget indexé sur la marge dans L8-09.

## À faire
1. **Lot « offert à l'inscription »** : créé au grand livre (L5-07) quand l'e-mail est vérifié ou le compte Google créé, source `offert_inscription`, type aperçu, quantité 1, validité 30 jours pour lancer (OFFRES.md § 6.2), prix unitaire 0, clé d'idempotence liée au compte.
2. **E-mail normalisé** : minuscules, `+étiquette` retirée, points retirés pour Gmail (`gmail.com`, `googlemail.com`) ; unicité sur `comptes.email_normalise` (ARCHITECTURE.md § 4.2).
3. **Domaines jetables** : liste open source `disposable-email-domains` (CC0) copiée et figée dans le dépôt, mise à jour par une tâche mensuelle revue. Refus à la saisie (`erreur.email_jetable`) et contrôle serveur à l'attribution du lot.
4. **Un seul plan offert** par e-mail normalisé, par compte Google (`sub` dans `identites`) et, plus tard, par compte Apple. Mémoriser ces clés sous forme d'empreinte salée dans une table dédiée (`offerts_attribues`) qui survit à la suppression du compte, avec une durée de conservation écrite au registre (L0-09).
5. **Un seul plan offert par plan**, tous comptes confondus (R22) : au lancement, l'empreinte SHA-256 du fichier **et** celle de la page rendue à résolution fixe (`plans.source_sha256`, `plans.page_empreinte`, calculées par l'analyse, ARCHITECTURE.md § 5.7) sont comparées à celles des plans offerts déjà lancés (`offerts_attribues`) ; l'une ou l'autre déjà connue suffit à refuser. Refus : `erreur.offert_meme_plan` (+ « Si un proche l'a déposé, demandez-lui son lien d'aperçu », à ajouter) ; on ne dit jamais qui l'a déposé.
6. **Turnstile** en mode géré dans le volet d'inscription (L6-01) ; jeton vérifié côté serveur ; échec : `erreur.verification_humain`. Clés de test documentées par Cloudflare pour la CI.
7. **Limite par adresse IP** : au plus 3 plans offerts lancés par IPv4 /32 ou IPv6 /64 et par 24 h, compteur dans la table `limites` (ARCHITECTURE.md § 6.4). Au-delà, le lancement est **différé**, pas refusé : travail en file, message `attente.limite_connexion`, e-mail quand il part. L'inscription, elle, passe.
8. **Budget du jour atteint** (interrupteur et clé « gratuit » de L5-09, qui ne sert qu'au plan offert des particuliers ; les essais pros passent par la clé « payant », R23) : plan offert mis en file pour le lendemain, `attente.plafond_jour` ; les plans payés continuent.
9. **Expiration** : lot non utilisé sous 30 jours → mouvement `expiration`, `erreur.offert_expire` au prochain dépôt.
10. **Identifiant d'appareil** (cookie aléatoire, sans empreinte du navigateur ; OFFRES.md § 2.2, auth-paiement.md § 3.5 point 7) : seulement si l'avocat confirme qu'il est « nécessaire » (MESSAGES.md § 7.13) ; sinon non posé.
11. **Alertes** (L5-16) : plans offerts par jour, par domaine d'e-mail et par préfixe IP au-delà d'un seuil à établir ; vue agrégée pour l'administration (L5-17).
12. **Bêta fermée** (R13, OFFRES.md § 2.8) : l'invité reçoit le lot `testeur` de la variante « bêta » du catalogue à la place du lot `offert_inscription` (plan complet ou aperçu selon L0-04) ; les contrôles de ce ticket (e-mail normalisé, domaines jetables, empreintes, Turnstile, IP) s'appliquent de la même façon ; aucun message ne propose d'achat.
13. **Réglages** de ces règles (limite IP, validité, activation de chaque contrôle) dans la configuration de l'offre du catalogue (L5-08), modifiables sans déploiement depuis l'écran du catalogue (L5-25) ; chaque changement tracé dans `journal_equipe`.

## Critères d'acceptation
- [ ] Un test par règle (scénario R4 de SUIVI.md § 7.5) : même adresse avec `+test` puis avec des points Gmail → un seul lot ; domaine jetable → refus ; même `sub` Google → un seul lot ; même fichier sur deux comptes → second lancement refusé ; même page réenregistrée dans un autre PDF (empreinte de fichier différente, même page rendue) → refusé aussi ; 4e lancement depuis la même IP en 24 h → différé, pas refusé ; jeton Turnstile invalide → refus ; lot de 31 jours → expiré.
- [ ] Compte supprimé puis recréé avec la même adresse : pas de second plan offert.
- [ ] Aucun de ces tests ne lance de lecture payante (`PLAN_MOCK`, faux serveur OpenRouter).
- [ ] Invariants du grand livre (ARCHITECTURE.md § 4.3) verts après chaque scénario.
- [ ] Messages du catalogue seulement ; contrôle des textes (L1-04) passé ; même réponse visible pour « adresse déjà utilisée » et « adresse nouvelle » à l'étape de l'e-mail (pas d'énumération).

## Mesure
- S : `credit_offert_attribue` (`source_lot=offert_inscription`), `credit_offert_refuse` (`motif` : `email_deja_utilise`, `compte_google_deja_utilise`, `plan_deja_offert`, `domaine_jetable`, `limite_ip_attente`, `budget_jour_attente`), `credit_expire`.
- N : `erreur_affichee` (`code` = clé du catalogue : `erreur.offert_deja_utilise`, `erreur.offert_meme_plan`, `erreur.offert_expire`, `erreur.email_jetable`, `attente.plafond_jour` ; SUIVI.md § 3.15).

## Points d'attention
- **Tranché : R22.** Empreinte du fichier **et** empreinte de la page rendue ; ARCHITECTURE.md § 5.7 et L5-23 le portent.
- **Tranché : R13.** Pendant la bêta, `erreur.offert_deja_utilise` et `erreur.offert_meme_plan` utilisent leurs variantes `.beta`, sans « Obtenir la visite · 29 € » ni aucun achat, jusqu'à L8-07.
- Empreintes d'e-mails gardées après suppression du compte : base légale (intérêt légitime, lutte contre la fraude) et durée à valider par l'avocat (L0-07) et à inscrire au registre (L0-09).
- Turnstile est un service de Cloudflare (société américaine) : DPA et transfert à documenter (L0-09) ; exemption de consentement à confirmer (SUIVI.md § 6.2).
- Adresses IP : ne garder que le préfixe, et seulement le temps du compteur (24 h).
- Pendant la bêta fermée, les testeurs invités peuvent partager une IP (entreprise, famille) : la limite différée évite un refus sec.

## Références
- OFFRES.md § 2.2, § 6.2, § 8.8 ; recherche/auth-paiement.md § 3.5 ; ARCHITECTURE.md M3.3, § 4.2, § 5.7, § 6.4.
- PARCOURS.md A4, A6, § 1.6 ; MESSAGES.md § 7.4 (`attente.*`), § 7.12 (`erreur.*`), § 7.13 ; SUIVI.md § 3.7, § 5.7.

## Hors périmètre
- Clé OpenRouter « gratuit », plafond quotidien fixe et interrupteur d'arrêt : L5-09. Plafond indexé sur la marge et coupe-circuit : L8-09.
- Écran d'inscription : L6-01. Rate-limit des analyses anonymes (10 par heure et par IP) : L5-23.
