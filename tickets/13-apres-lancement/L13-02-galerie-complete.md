# L13-02 · Galerie photo complète

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 13 · Après lancement | P1 | M (1 à 3 j) | L13-01, L8-02 | `service/` | À faire |

## Pourquoi
Décision n° 5 : au lancement, le serveur ne rend que la vue du dessus, le plan 2D et 2 photos ; au pire la visite sans photos. **Tranché : R1.** La galerie complète « façon annonce » (une dizaine de photos par plan, OFFRES.md § 7.4) vient ici, et seulement ici : c'est une évolution de la version de base, jamais promise au lancement ; aucun texte n'en cite le nombre de photos avant que ce ticket soit en production. L0-04 recommande de l'ajouter **sans supplément aux plans déjà vendus** (droits acquis, amélioration étendue aux clients existants). En SwiftShader, 11 photos prennent 684 s sur un M3 (estimation de 15 à 25 min en un seul travail sur serveur) : ce ticket suit l'accélération (L13-01).

## À faire
1. **Rendu en tâche de fond**, déclenché par un déblocage (L8-02) ou par un plan complet publié : toutes les vues de `plan.json` (`photos`, un seul moment en mode `simple`) sauf celles déjà rendues ; file `rendu` en priorité basse, derrière les images d'aperçu (L5-22) ; même contrat de rendu (L5-10), même version du moteur que la publication (sinon refus `rendu_version` et passage par un rejeu, L5-10) ; images contrôlées (L5-10), marquées (L4-07) et copiées au préfixe de la publication (L5-11).
2. **Vues écartées** (« vue sans intérêt ») ou refusées par `photos.mjs` : retirées de la liste publiée, jamais un emplacement vide ni une image cassée.
3. **Galerie sans modifier le moteur** : `plan.json` d'une visite est servi par l'application après contrôle du jeton (ARCHITECTURE.md § 2.4). À chaque requête, l'application ne met dans `photos` que les vues déjà publiées, dans l'ordre d'origine. La galerie de `moteur/ui.js` (l. 791-826, `photoFile` l. 793) n'affiche donc que des images existantes ; un rechargement montre les nouvelles.
4. **Messages** : la variante `verrou.ouvert.galerie` au déblocage (« Les autres photos s'y ajoutent dès qu'elles sont prêtes », `MESSAGES.md` § 7.6, marquée [SI LIVRÉ : L13-02]) seulement si la galerie complète est au catalogue, avec un délai tiré de la mesure en production et jamais écrit en dur (R12) ; `verrou.photos_pretes` à la fin.
5. **Fin** : toutes les vues rendues ou écartées → `photos_completees` ; e-mail « vos photos sont prêtes » (nouveau modèle, texte à ajouter à MESSAGES.md § 7.11, sans pixel ni lien traçant).
6. **Retard** : au-delà d'un délai réglable, `retard` vrai, une relance sans frais, puis la galerie reste avec les photos disponibles (PARCOURS.md A12, cas limites) ; alerte à l'équipe (L5-16).
7. **Rattrapage des plans déjà vendus** : tâche d'administration qui met en file, à faible débit, les publications complètes sans galerie ; rendu seulement, aucune lecture IA ; e-mail de l'étape 5 à chacun.
8. **Catalogue et textes** (R1, R5) : nouvelle version des offres avec le contenu `photos` réel (L5-08), étendue sans supplément aux plans déjà vendus si L0-04 le retient ; les textes qui décrivent la galerie (MESSAGES.md, OFFRES.md § 2.4, § 7.4) ne sont démasqués qu'une fois ce ticket en production, et le nombre de photos y est lu dans le catalogue, jamais écrit en dur ; vignettes verrouillées `verrou.photo` de l'aperçu activées (L6-05) ; elles n'existent pas avant ce ticket (`OFFRES.md` § 2.2 : aucun emplacement de photo supplémentaire au lancement).
9. **Téléchargements HD** (L8-08) : incluent les nouvelles photos.

## Critères d'acceptation
- [ ] Témoin, déblocage simulé, sans lecture payante (`PLAN_MOCK`) : toutes les vues rendues ; pendant le rendu, un parcours automatisé vérifie que chaque image de la galerie est chargée (`naturalWidth > 0`) : aucune image cassée à aucun moment.
- [ ] Vue écartée volontairement (vue face à un mur) : absente de la galerie et de `plan.json` servi.
- [ ] Exécutant tué pendant la galerie : une relance sans frais, puis galerie partielle sans trou ; `photos_completees` avec `retard` vrai.
- [ ] Rattrapage sur 3 publications de test : galeries complétées, aucune ligne `appels_ia`.
- [ ] Chaque photo porte la mention non contractuelle ; aucun texte technique (L1-04) ; outil local inchangé.

## Mesure
- `photos_completees` (`photos`, `duree_s`, `retard`) ; `plan_rejoue` (`motif=photos`) pour le rattrapage.
- `email_envoye` avec `modele=photos_pretes` : valeur à ajouter à SUIVI.md § 3.8 et à `mesure/evenements.json`.

## Points d'attention
- **Remplissage en direct** (« Photo en préparation » qui se remplit seule, PARCOURS.md A12) : demande que `ui.js` relise la liste des photos, donc un petit diff `[M]` à faire avec l'agent des duplex (critère de fusion d'ARCHITECTURE.md § 8.1). Hors de ce ticket ; ici, rechargement et e-mail.
- **Tranché : R12.** Aucun délai de galerie n'est écrit en dur (« en quelques minutes » compris) : en SwiftShader sans L13-01, c'est plutôt 15 à 25 min par plan (estimation) ; le texte suit la mesure en production.
- Charge : 11 rendus par plan déverrouillé, sur la même VM que le web au lancement ; la priorité basse et les limites de L5-22 évitent d'affamer les aperçus.
- **Tranché : R1.** Au lancement, un lot promoteur a les mêmes images qu'un plan de particulier ; la galerie par lot n'arrive qu'avec ce ticket (L10-01, OFFRES.md § 4.4).
- **Rendu** (R3) : la galerie est rendue en SwiftShader par défaut ; L13-01 l'accélère sans en être une condition de justesse.
- Moments multiples (jour, soir) : exclus de la base (`simple`) ; chaque moment multiplie le rendu.

## Références
- produit/OFFRES.md § 2.2, § 2.4, § 6.4 ; produit/PARCOURS.md A12, A15 ; produit/MESSAGES.md § 7.6, § 7.11 ; produit/SUIVI.md § 3.8, § 3.9.
- produit/ARCHITECTURE.md § 2.3 (étapes 7 à 9), § 2.4, § 5.2 ; produit/recherche/hebergement.md § 2.1.
- `moteur/photos.mjs:12`, `:107`, `:112-116` ; `moteur/ui.js:791-826` (galerie), `:793` (`photoFile`).

## Hors périmètre
- Accélération : L13-01. Déblocage : L8-02. Page d'aperçu : L6-05. Téléchargements : L8-08. Rendu d'aperçu en deux temps : L5-11.
