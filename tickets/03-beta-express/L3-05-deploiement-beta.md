# L3-05 · Déploiement de la bêta express

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 3 · Bêta express dockerisée (optionnelle) | P1 | M (1 à 3 j) | L0-01, L0-08, L3-04 | — | À faire |

## Pourquoi
Mettre l'outil conteneurisé (L3-01), fermé par Cloudflare Access (L3-02), cloisonné (L3-03) et plafonné (L3-04) en ligne pour des testeurs invités, en quelques jours, de façon reproductible (décision n° 2 : Docker Compose, déployable partout). Il faut aussi pouvoir tout reconstruire et ne rien perdre : les plans déposés sont des données personnelles et des œuvres de promoteurs. CGU et confidentialité doivent être en ligne avant le premier testeur (recherche/juridique.md § 7, n° 3 et 4).

## À faire
1. **VM** dans le projet Scaleway « bêta », séparé des futurs projets de préproduction et de production (L0-08), région Paris, processeur x86-64 (Chrome for Testing, voir L3-01).
   - Taille : partir de la PLAY2-MICRO (4 vCPU, 8 Go, environ 40 €/mois, recherche/hebergement.md § 3.2), rejouer un plan de référence sans payer, chronométrer. Si le plan complet (11 photos en SwiftShader) dépasse 30 min, prendre une instance plus large pour la durée de la bêta ou garder `PLAN_PARALLELE=1` et l'annoncer aux testeurs.
   - Système Debian ou Ubuntu LTS, Docker Engine et son greffon Compose, mises à jour de sécurité automatiques, SSH par clé seulement, pare-feu : aucun port entrant sauf SSH limité aux adresses de l'équipe (le tunnel `cloudflared` de L3-02 sort vers Cloudflare).
2. **Déploiement** : `git clone` d'une étiquette (`beta-AAAAMMJJ`, commit fusionné), `docker compose up -d --build`. Fichiers propres à la bêta rangés dans `deploiement/beta/` (nouveau dossier, hors de `pipeline/` et `moteur/`) : surcharge Compose (tunnel, Caddy), `Caddyfile`, scripts de sauvegarde et de restauration, procédures.
3. **Secrets** : fichier `/etc/visite-plans/outil.env` (propriétaire root, droits 600) ou Secret Manager de Scaleway lu au démarrage : clé OpenRouter « bêta » (L3-04), jeton du tunnel, `PLAN_ACCES_*`, `PLAN_EQUIPE`. Rien dans le dépôt, l'image ou les journaux.
4. **Stockage des plans** : volume bloc dédié monté sur le volume `plans` (séparé du disque système). Sauvegarde **chaque nuit**, chiffrée côté client (`restic`, ou `rclone` avec chiffrement), vers un seau Object Storage privé dans une autre région (Amsterdam ; transferts entre régions gratuits d'après hebergement.md § 3.2), rétention 30 jours, clés d'accès limitées à ce seau. Le stockage S3 direct n'est pas utile ici : l'outil écrit sur disque.
5. **Supervision minimale** :
   - disponibilité : sonde externe (Better Stack ou UptimeRobot, D5) qui passe Access avec un jeton de service (en-têtes `CF-Access-Client-Id` et `CF-Access-Client-Secret`), sans règle de contournement ;
   - disque : alerte à 80 % (Scaleway Cockpit ou tâche `cron` qui envoie un e-mail) ;
   - coûts : alertes de L3-04 ;
   - échec de la sauvegarde de la nuit : e-mail.
6. **Procédure de reconstruction** écrite (`deploiement/beta/RECONSTRUIRE.md`) : nouvelle VM, Docker, clone de l'étiquette, secrets, restauration du dernier instantané des plans, tunnel, vérification. Objectif : moins d'une heure. Jouée une fois pour de vrai.
7. **CGU de la bêta et politique de confidentialité**, textes validés par l'avocat (L0-07) et cohérents avec le registre et les DPA (L0-09) : publiées sur des pages statiques (sur la vitrine, ou servies par Caddy avec une règle de contournement d'Access limitée à ces deux chemins), datées et versionnées. Elles citent : lecture par un modèle d'IA via OpenRouter avec conservation nulle (L1-08), cartouche masqué (L1-10), sous-traitants (Scaleway, OpenRouter et le fournisseur du modèle, Cloudflare), durée de conservation (fin de la bêta plus un délai court), droits et contact, interdiction de publier la visite, mention « Illustration non contractuelle générée automatiquement à partir du plan de vente. » (MESSAGES.md § 8.3). L'acceptation est recueillie avant l'ajout à la liste Access (L3-06).
8. **Fin de bêta** : procédure de purge écrite (plans, registre de L3-04, e-mails dans Access, sauvegardes à l'expiration de leur rotation), avec la date prévue.

## Critères d'acceptation
- [ ] Depuis un poste extérieur : un testeur de la liste arrive sur l'accueil ; un autre e-mail est arrêté par Access ; un balayage des ports de l'IP publique ne montre que SSH, limité.
- [ ] Un plan de référence rejoué sur la VM sans payer (lecture gardée) : visite de contrôle réussie, photos produites, durée de bout en bout mesurée et notée dans `deploiement/beta/README.md`.
- [ ] Sauvegarde de la nuit présente dans l'autre région ; restauration testée sur une VM jetable (plan rouvert, visite affichée).
- [ ] Reconstruction complète chronométrée une fois, sous une heure.
- [ ] Alerte de disponibilité et alerte disque reçues lors d'un essai provoqué.
- [ ] Aucun secret dans le dépôt ni dans les journaux (`docker compose logs` ne contient ni `sk-or-` ni `sk-ant-`).
- [ ] CGU et confidentialité en ligne, datées, liens vérifiés ; aucune invitation envoyée avant (bloquant pour L3-06).

## Points d'attention
- **Domaine** : Access exige un domaine dont le DNS est chez Cloudflare. Tranché : L0-01 (nom et domaines) est une dépendance déclarée. Reste à choisir un sous-domaine de la marque ou un domaine technique neutre, et où vit le DNS (Cloudflare pour la bêta, Scaleway recommandé par D6 pour la vitrine), avec L3-02.
- **Coût mensuel** (estimation) : VM, volume, sauvegardes et IPv4 de l'ordre de 50 à 60 € par mois, plus l'IA (L3-04). Arrêter la VM à la fin de la bêta.
- **Sauvegardes** : elles contiennent des plans de promoteurs et des e-mails ; chiffrement, rétention et purge à inscrire au registre (L0-09).
- **Code jetable** : garder la bêta dans `deploiement/beta/` pour ne pas la mêler à la préproduction du socle (L5-18).
- **Coordination avec le travail sur les duplex** : aucun fichier de `pipeline/` ni de `moteur/` modifié ; l'étiquette déployée doit être un commit fusionné.

## Références
- produit/recherche/hebergement.md § 3.2, § 4, § 7 (supervision), § 8 (sauvegardes), § 10 ; produit/ARCHITECTURE.md § 3 (D2, D5), § 9.1, § 9.3, § 9.4 ; produit/recherche/juridique.md § 3.3, § 3.4, § 7 (n° 2 à 7) ; produit/OFFRES.md § 7.3 (J0) ; produit/MESSAGES.md § 8.3.
- Fichiers des tickets précédents : `Dockerfile`, `compose.yaml` (L3-01) ; `pipeline/acces.py` (L3-02) ; `outils/couts_beta.py` (L3-04).

## Hors périmètre
- Recrutement, invitations, retours des testeurs : L3-06.
- Préproduction, déploiement automatique et sauvegardes du socle : L5-18. Supervision complète : L5-16.
