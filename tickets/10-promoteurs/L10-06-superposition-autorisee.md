# L10-06 · Superposition du plan autorisée

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P2 | S (jusqu'à 1 j) | L5-12 | `service/` | À faire |

## Pourquoi
Le fichier du promoteur et tout ce qui en est une image (`page.png`, `plan-<…>.png`) ne sont jamais publiés (ARCHITECTURE.md § 5.3, audit B7) : la superposition du plan d'origine est réservée à la vue du propriétaire (L5-12). Seule exception prévue : une organisation qui a déposé la preuve d'un accord du promoteur, ou le promoteur lui-même, titulaire des droits (PARCOURS.md C6, point 6 ; OFFRES.md § 4.4). La preuve est vérifiée par l'équipe avant tout affichage (M5.4).

## À faire
1. **Dépôt de la preuve** : `reglages_organisation.autorisation_preuve` (clé d'objet dans `prive/org/<org>/reglages/`), avec sa portée (organisation entière ou programme) et sa date de fin éventuelle. Pour un promoteur, la licence signée (L10-01) sert de preuve.
2. **Vérification par l'équipe** (administration, double authentification, L5-17) : lecture du document, décision motivée dans `journal_equipe`, puis nouvelle version des réglages avec `superposition_autorisee = true`.
3. **Réglage explicite par publication** : `publications.superposition`, faux par défaut même quand l'organisation est autorisée.
4. **Publication** (extension de la liste blanche de L5-12, seulement si `publications.superposition` est vrai) :
   - `plan.json` filtré garde `underlay` (`{file, x, z, w, h}`, `moteur/SCHEMA.md` l. 96 ; avec plusieurs niveaux, `offset` et `zone`, l. 121) ;
   - `file` réécrit vers une route de l'application qui vérifie le jeton, `/v/<jeton>/calque/<n>.png`, avec `Cache-Control: private, no-store` ; **jamais sur le CDN**, pour qu'une révocation coupe l'accès ;
   - dans tous les autres cas, `underlay` retiré et l'image introuvable par toutes les voies (test existant de L5-12).
5. **Retrait de l'autorisation** (fin d'accord, demande du titulaire) : republication sans calque de toutes les publications concernées, en moins d'une heure ; alerte si l'une échoue.
6. **Interface** (**Tranché : R16**) : l'option « Plan 2D : superposer le plan du promoteur » (`moteur/ui.js:363`) est masquée en mode simple par L4-11, livré avant la bêta fermée : elle n'est réservée qu'au propriétaire ou à un accord du promoteur. Ce ticket ne fournit `underlay` qu'aux publications autorisées ; il ne modifie pas `moteur/`.

## Critères d'acceptation
- [ ] Sans autorisation : `underlay` absent de `plan.json` publié, route du calque en 404 (tests par `visite.`, `cdn.` et `app.`).
- [ ] Autorisation vérifiée et réglage actif : le calque s'affiche dans le plan 2D du lien ; lien révoqué : image en 404 dans la seconde.
- [ ] Retrait de l'autorisation : plus aucun calque servi, sur toutes les publications de l'organisation (test).
- [ ] Chaque décision de l'équipe figure dans `journal_equipe` avec son motif.
- [ ] Contrôles des textes et de la CSP de L5-12 réussis avec le calque ; aucune lecture payante (témoin).

## Points d'attention
- **Juridique** : forme de la preuve (accord écrit du promoteur, licence du contrat), cas de l'architecte co-titulaire des droits (recherche/juridique.md § 4.1) : à faire valider par l'avocat (L0-07).
- **Tranché : R16.** La case sans effet (option visible sans calque) est un défaut d'interface corrigé par le ticket [M] L4-11 ; ce ticket ne modifie pas `moteur/`. Vérifier avec L4-11 que la case réapparaît bien quand `underlay` est servi à une publication autorisée.
- Aucun événement du dictionnaire ne couvre l'activation de la superposition ; si on veut la suivre, ajouter une valeur `superposition` à `reglage` (SUIVI.md § 3.12).

## Références
- produit/ARCHITECTURE.md § 2.4 (vue propriétaire), § 4.2 (`reglages_organisation`, `publications`), § 5.3, § 7.3, M5.4.
- produit/OFFRES.md § 4.4 ; produit/PARCOURS.md C6 ; produit/recherche/audit-code.md B7.
- `moteur/SCHEMA.md:96`, `:121` (`underlay`, `offset`, `zone`) ; `moteur/ui.js:363` (option), `:632` (dessin du calque) ; `pipeline/lire.py:1152` (`underlay`).

## Hors périmètre
- Publication et liste blanche générales : L5-12. Intégration : L10-04. Contrat et licence : L10-01.
- Masquage de la case en mode simple : L4-11.
