# L7-01 · Umami auto-hébergé, réglage minimal

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P0 | M (1 à 3 j) | L5-18 | `service/`, `site/` | À faire |

## Pourquoi
Décision utilisateur 9 : Umami, auto-hébergé dans l'UE, pour mesurer l'audience anonyme de la vitrine, de la démonstration et des écrans de l'application (SUIVI.md § 0, § 1.1). Trois conditions tiennent l'exemption de consentement : l'auto-héberger (jamais Umami Cloud, dont le DPA autorise l'« improve the Services »), le réglage minimal, et une analyse écrite des deux écarts restants (L7-08). Décision 2 : l'application est dockerisée ; Umami devient un service de plus dans le même Docker Compose, déployable partout.

## À faire
1. **Service `umami`** dans le Docker Compose (L5-01, L5-18) : image `postgresql` d'Umami, **version figée** (v3.4.x au 27/09/2026), mise à jour mensuelle revue.
2. **Base `umami` séparée** sur le Postgres, avec un utilisateur qui n'a **aucun droit** sur la base de l'application. Aucune jointure possible avec le journal (SUIVI.md § 2.3, règle 1).
3. **Variables** (noms exacts à vérifier sur la version installée, SUIVI.md § 2.5) : `DISABLE_TELEMETRY=1`, `PRIVATE_MODE=1`, en-tête d'IP posé par Caddy (`CLIENT_IP_HEADER`), rotation du sel mensuelle, MCP désactivé, noms neutres du script et du point de collecte (`TRACKER_SCRIPT_NAME`, `COLLECT_API_ENDPOINT`, ni `umami` ni `analytics`). Secret de l'application au gestionnaire de secrets.
4. **Sous-domaine `m.<domaine>`** servi par Caddy : seuls le script et le point de collecte sont publics ; l'interface d'administration est restreinte (liste d'IP ou accès protégé), deux comptes nominatifs, aucun lien de partage public.
5. **Sites dans Umami** : `production` (vitrine, `app.<domaine>`, démonstration, vue propriétaire), `recette` (préproduction).
6. **Filtre avant envoi** `avantEnvoi`, `DICO_MESURE`, `filtrerProprietes`, `mesure()` et `mesureUneFois()` (esquisse de SUIVI.md § 2.5), servis depuis nos domaines et chargés **avant** le script Umami ; ils lisent le dictionnaire unique `mesure/evenements.json` (L2-14, L5-15). Réglage minimal : chemins réduits en gabarits (`/v/:jeton`, `/plans/:id`, UUID → `:id`), aucune chaîne de requête, référent réduit à l'origine, titre remplacé par le type de page hors vitrine, jamais `identify()` ni `data-distinct-id`, rien si GPC ou opposition.
7. **Balise** de SUIVI.md § 2.5 (`data-domains`, `data-exclude-hash="true"`, `data-do-not-track="true"`, `data-before-send="avantEnvoi"`) posée **seulement** sur les pages du § 2.6 : vitrine, écrans de l'application, démonstration, vue propriétaire. **Jamais** sur `/v/<jeton>`, `/i/<jeton>`, les pages de prospects, les intégrations ni les e-mails.
8. **CSP** : `m.<domaine>` ajouté à `script-src` et `connect-src` des seules pages concernées ; la CSP de `visite.<domaine>` ne l'autorise que pour la vue propriétaire (contrôle C6).
9. **Opposition** : sur la page `/traceurs` (lien « Gestion des traceurs » du pied de page, MESSAGES.md § 7.13) et dans la politique de confidentialité (L2-11), qui pose `opposition_mesure=1` sur `.<domaine>` pour 13 mois ; lu par le filtre sur tous les sous-domaines. DNT et GPC respectés.
10. **Purge mensuelle** des données de plus de 25 mois : tâche périodique (Procrastinate ou tâche planifiée du Compose), noms des tables relevés sur la version installée.
11. **Sauvegarde** : la base `umami` suit les sauvegardes de L5-26 ; sa perte ne touche aucun indicateur métier (le journal fait foi).

## Critères d'acceptation
- [ ] `docker compose up` démarre Umami ; une page de la vitrine de recette envoie une page vue visible dans le site `recette`.
- [ ] Tests unitaires du filtre (contrôle C4 de SUIVI.md § 7.4) : jeton, UUID et identifiant de plan remplacés ; requête retirée ; aucun identifiant de clic ; titre générique hors vitrine ; rien avec GPC ou le cookie d'opposition ; événement hors dictionnaire refusé.
- [ ] Interception puppeteer (C5) sur la vitrine et les écrans de l'application avec le témoin fictif : aucune valeur qui ressemble à un e-mail, un UUID, un jeton ou un titre de plan de test.
- [ ] **Zéro requête** vers `m.<domaine>` sur `/v/` et `/i/` (C6) ; la CSP de ces pages l'interdit.
- [ ] L'utilisateur `umami` ne peut lire aucune table de l'application (test SQL).
- [ ] Purge jouée sur des données datées de 26 mois : supprimées.
- [ ] Aucun appel sortant d'Umami vers l'extérieur (capture réseau du conteneur).

## Mesure
- N : page vue automatique (chemin en gabarit, référent réduit, appareil, pays). Les événements nommés sont branchés par L7-04.

## Points d'attention
- **Umami sur les écrans de l'application** est un écart assumé avec recherche/suivi.md § 7.1 (principe 5), en attente de décision (SUIVI.md § 8, L0-05). Sans accord, la balise ne va que sur la vitrine et la démonstration.
- À vérifier sur la version installée (SUIVI.md § 8) : forme de `url` et de `type` dans `data-before-send`, continuité de session entre `<domaine>` et `app.<domaine>`, noms des tables à purger.
- Ne jamais contourner une opposition : les noms neutres évitent les listes de blocage génériques, pas un refus exprimé.
- L'exemption n'est tenable qu'avec l'analyse écrite des deux écarts (écran Sessions, absence d'arrondi) : L7-08, à livrer avant la mise en production.
- Le filtre et le dictionnaire sont partagés avec le journal (C1 à C3) : une modification passe par SUIVI.md et `mesure/evenements.json` dans le même changement.

## Références
- SUIVI.md § 0, § 1, § 2.1 à § 2.6, § 2.12, § 7.1, § 7.2, § 7.4 (C4 à C6), § 8 ; recherche/suivi.md § 1.3, § 1.4, § 2.3.
- ARCHITECTURE.md § 2.1 (mesure d'audience), § 2.5, § 6.2 ; recherche/juridique.md § 3.7.

## Hors périmètre
- Bandeau et réglage enrichi (UTM, relecture) : L7-02. Tant qu'Umami reste dans ce réglage minimal exempté, aucun bandeau (R18). Événements nommés et moteur : L7-04.
- Analyse d'exemption : L7-08. Entonnoirs : L7-05.
