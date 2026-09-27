# L9-05 · Tableau de suivi des prospects

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 9 · Offre conseillers (Pro) | P1 | M (1 à 3 j) | L9-04 | `service/` | À faire |

## Pourquoi
Le conseiller veut savoir en un coup d'œil quels lots intéressent et quels prospects rappeler (`PARCOURS.md` B6), sans suivi illicite : compteur par lot par défaut, intérêts déclarés par les prospects eux-mêmes, détail seulement avec leur accord (`OFFRES.md` § 3.4). Les données viennent de L9-04 ; ce ticket les montre et les exporte, dans les limites du consentement.

## À faire
1. **Page** `app.<domaine>/pro/suivi`, filtrable par programme. Tableau par lot (vrai tableau, avec en-têtes) : ouvertures totales et sur 7 jours, dernière ouverture, nombre d'intérêts. Explication (à ajouter à `MESSAGES.md`) : « Vous voyez le nombre d'ouvertures par lot. Le détail d'un prospect n'apparaît que s'il l'a accepté. »
2. **Liens d'un lot** : libellé, date de création, expiration ; « Intéressé le {date} à {heure} » avec le message ; détail (durée, pièces vues) seulement si le prospect l'a accepté ; compteur par lien seulement si le drapeau `statut_ouvert_par_lien` est levé (L9-04).
3. **Actions** : copier ; prolonger l'expiration ; couper (`pro.lien.couper`) ; renvoyer (modèle de message proposé à nouveau). Pas de relance automatique : nous n'écrivons jamais aux prospects.
4. **Export CSV** (Cabinet et Équipe, `OFFRES.md` § 3.3) : libellés, dates, intérêts et messages, détail consenti ; jamais d'adresse IP ; UTF-8 avec BOM pour Excel. Rien n'est gardé côté serveur après la génération.
5. **Statistiques par programme** (Équipe) : lots les plus ouverts, intérêts par lot.
6. **Droits** : membres de l'organisation. Proposition : en Cabinet et Équipe, chaque membre voit tous les liens de l'organisation (plans partagés, `OFFRES.md` § 3.3) ; à trancher par l'utilisateur.
7. **Données** : agrégats calculés sur `vues_visite`, `interets_prospect` et `vues_visite_detail` ; la purge à 6 mois (L5-20) s'applique aussi à l'affichage et à l'export.

## Critères d'acceptation
- [ ] Sans consentement : aucune durée ni pièce affichée ou exportée (test).
- [ ] Drapeau par lien fermé : aucun compteur par lien, ni dans la page, ni dans l'API, ni dans l'export (test).
- [ ] Couper un lien → la page prospect répond 404 dans la seconde (L5-13).
- [ ] Export refusé en Solo, accepté en Cabinet ; accès depuis une autre organisation → 404.
- [ ] Tableau lisible par un lecteur d'écran (en-têtes) ; affichage correct à 320 px.
- [ ] Aucun texte technique ; aucune lecture payante.

## Mesure
- `lien_prospect_revoque` (`age`, `ouvertures`).
- `suivi_consulte` et `suivi_exporte` (à ajouter à `SUIVI.md`, facultatifs, `PARCOURS.md` § 8.1).

## Points d'attention
- **Écart** : `pro.lien.compteur` (`MESSAGES.md` § 7.9) affiche les ouvertures par lien, alors qu'`OFFRES.md` § 3.4 limite l'affichage par défaut au lot. `PARCOURS.md` § 8.2 propose de le masquer par un réglage jusqu'à l'avis de l'avocat : c'est le drapeau de L9-04.
- **« Relances »** du résumé du ticket : lu comme « renvoyer le lien » par le conseiller, jamais comme un envoi de notre part.
- **Export** : fichier de données personnelles de prospects remis au responsable de traitement (le conseiller) ; nous restons sous-traitant (DPA, L9-08).
- **Loi Hoguet** : aucun fichier de prospects exploité, revendu ou rapproché d'autres comptes par nous (`OFFRES.md` § 2.7, § 10 risque 13).

## Références
- produit/PARCOURS.md B6, § 8.1, § 8.2 ; produit/OFFRES.md § 3.3, § 3.4, § 10 ; produit/MESSAGES.md § 2.5, § 7.9.
- produit/SUIVI.md § 3.12 ; produit/ARCHITECTURE.md § 4.2 (`vues_visite`, `vues_visite_detail`), § 4.4.

## Hors périmètre
- Création des liens, bouton d'intérêt et consentement : L9-04. Tableaux internes de l'équipe : L7-06.
- Statistiques agrégées des promoteurs : lot 10.
