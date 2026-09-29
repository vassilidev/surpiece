# L1-06 · Identifiant de plan sans nom de fichier

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 1 · Filets de sécurité et correctifs immédiats | P1 | S (jusqu'à 1 j) | L1-02 | `pipeline/` [P] | À faire |

## Pourquoi
`slug()` construit l'identifiant du plan avec le nom du fichier déposé (28 caractères) et 8 caractères hexadécimaux. Ce nom contient souvent le numéro de lot, le nom du programme, parfois celui de l'acquéreur : il finit dans l'URL de la visite, que l'utilisateur partage, et il est envoyé au modèle dans `extract.json`. 32 bits d'aléa ne suffisent pas non plus comme seul secret d'un lien (audit B3, M0.6). Exemple réel du 27/09/2026 : la duplex a pour identifiant `3081-613-ef700f1f`, qui porte le numéro de lot (`slug`, `serveur.py` l. 46, inchangé). La bêta express (L3-03) s'appuie sur ce correctif.

## À faire
1. **`slug`** (`pipeline/serveur.py`, vers la ligne 46) : ne plus utiliser le nom. Produire un identifiant aléatoire d'au moins 128 bits, compatible avec les contrôles existants (`[a-z0-9-]{1,40}` dans `do_GET` et `do_POST`, motif `plan-[a-z0-9-]+\.png` de `VISITE`). Proposition : `uuid.uuid4().hex` (32 caractères hexadécimaux). La fonction garde sa signature (`slug(name)`) pour un diff minimal, ou devient `nouvel_id()` si cela ne gêne pas le commit du travail sur les niveaux.
2. **Nom gardé dans l'état** : `depot` enregistre déjà `nom=name` dans `etat.json` ; ne rien changer, vérifier seulement que le nom n'apparaît plus dans aucun chemin (`plan-<id>.png`, `extract.json` → `id`, `plan.json` → `id`).
3. **Anciens dossiers** : aucun renommage. Les identifiants existants (avec nom) continuent de s'ouvrir, de se relancer et de se lister, car les motifs de contrôle ne changent pas.
4. **Affichage** : la liste « Plans traités » de la page de dépôt montre déjà le titre du plan (ou le nom du fichier en repli) ; vérifier qu'elle reste lisible avec des identifiants opaques.
5. **Test** (`outils/` ou test Python isolé, sans lancer de traitement) : `slug('Plan lot 432 Dupont.pdf')` ne contient aucun fragment du nom, fait 32 caractères, passe `re.fullmatch(r'[a-z0-9-]{1,40}', …)` ; deux appels donnent deux valeurs différentes.
6. **Vérifier de bout en bout sans payer** : dépôt d'un plan en `PLAN_MOCK` (fumée de L1-02) → URL `/plans/<32 hex>/`, visite qui s'ouvre, photos présentes ; ouverture et relance d'un ancien dossier.

## Critères d'acceptation
- [ ] Un nouveau plan n'a plus le nom du fichier dans son URL ni dans `plan-<id>.png`, `extract.json` (`id`) et `plan.json` (`id`).
- [ ] Les anciens dossiers de `plans/` s'ouvrent, se relancent et apparaissent dans la liste.
- [ ] Le test de l'étape 5 passe.
- [ ] Critère de fusion d'ARCHITECTURE.md § 8.1 : rejeu L1-02 identique (il ne crée pas de nouvel identifiant), fumée de l'outil local réussie, contrôle des textes réussi ; aucune lecture payante.

## Points d'attention
- Diff de trois lignes dans `serveur.py`, fichier modifié par le travail sur les niveaux (fini le 27/09/2026, non commité) : branche courte, sur le commit qui l'intègre.
- Tant que ce ticket n'est pas livré, le nom du fichier part au modèle par le champ `id` d'`extract.json` (`pipeline/lire.py`, `build_messages`) : L1-10 doit en tenir compte.
- Un identifiant opaque rend les commandes manuelles (`outils/finalise.sh <id>`) moins lisibles : le titre reste visible dans la liste ; les dossiers d'essai de l'équipe peuvent garder des noms choisis à la main (`_…`).
- Le jeton de partage séparé (révocable, 128 bits au moins) n'est pas fait ici : l'URL reste le seul secret en local et en bêta express.

## Références
- `produit/recherche/audit-code.md` B3
- `produit/ARCHITECTURE.md` § 6.1 (B3), § 6.3, § 8.2 (`slug`), § 8.3 M0.6
- `pipeline/serveur.py` (`slug`, `depot`, `do_GET`, `do_POST`, `VISITE`, `servable`) ; `pipeline/extract.py` (`extract` : `id`, `underlay`) ; `pipeline/lire.py` (`read_plan` : `P['id']`)

## Hors périmètre
- UUID en base et jetons de partage : L5-05, L5-13.
- Cloisonnement par testeur : L3-03.
- Titre par défaut sans identifiant : L1-05.
