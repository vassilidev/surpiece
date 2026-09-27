# L0-01 · Valider le nom et sécuriser la marque

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 0 · Décisions et préalables | P0 | S (jusqu'à 1 j) | — | — | À faire |

## Pourquoi
« Sur Pièce » n'est qu'un nom provisoire (décision 10 du 27/09/2026), avec « Avant-Clés » en plan B. Sur une marque, c'est la date de dépôt qui compte : aucun texte ne doit être publié avant (MESSAGES.md § 0.1). `surpieces.fr` et `surpieces.com`, au pluriel, ont été enregistrés le 11/07/2026 par un tiers anonyme et sont parqués. Le logo (L2-02), la mise en ligne de la vitrine (L2-16), le rendez-vous avocat (L0-07) et l'ouverture publique (L8-07) attendent ce ticket.

## À faire
1. **Vérifications manuelles d'abord**, car elles peuvent faire basculer sur le plan B (elles ont été bloquées pendant la recherche, `recherche/nom.md` § 1 et § 7.2) :
   - data.inpi.fr sur « sur pièce », « surpièce », « surpieces » et les formes phonétiques proches ;
   - TMview et EUIPO eSearch plus ;
   - Google : « Sur Pièce » avec visite, plan, immobilier, application.
   Noter les requêtes, la date et les résultats utiles dans MARQUE.md § 1.5 (cocher chaque point).
2. **`surpieces.fr` et `surpieces.com`** : confirmer avec l'utilisateur qu'ils ne sont pas à lui. Sinon, les surveiller (offre possible par le formulaire de contact du titulaire chez Gandi ; la procédure SYRELI n'a pas été vérifiée).
3. **Décision de l'utilisateur** : Sur Pièce (recommandé, 36/40, `recherche/nom.md` § 0 et § 6) ou Avant-Clés (32/40, MARQUE.md § 1.3).
4. **Domaines** (MARQUE.md § 1.6, `recherche/nom.md` § 7.1), pour la forme retenue :
   - indispensables : `surpiece.fr`, `surpiece.com`, `sur-piece.fr`, `sur-piece.com` ;
   - conseillés : `surpiece.eu`, `surpiece.app` ;
   - optionnels : `surpiece.immo` (vérifier au panier qu'il n'est pas vendu en « premium »), `surpiece.io`.
   Compte du registrar au nom de la structure (ou transfert prévu vers la société, L0-06), double authentification, renouvellement automatique. Les redirections vers le domaine principal se posent à la mise en ligne (L2-16).
5. **Dépôt INPI de la marque verbale d'abord** (procedures.inpi.fr) ; le logo est déposé ensuite, après son dessin (L2-02) :
   - classes 9, 35 et 42, plus la 36 en option ; libellés proposés dans `recherche/nom.md` § 7.3, à formuler avec TMclass ;
   - coût connu : 270 € (3 classes) ou 310 € (4 classes), **non revérifié** le 27/09/2026 ;
   - déposant : la société si elle existe déjà (L0-06), sinon en nom propre, puis cession inscrite à l'INPI (`recherche/nom.md` § 7.6).
6. **Comptes `@surpiece`** : Instagram, LinkedIn (page), TikTok, YouTube, Facebook, X, Pinterest ; repli `@surpiece.fr`. GitHub `surpiece` a été vu libre. E-mail de récupération de la structure, pas une adresse personnelle.
7. **Alerte TMview** sur « surpiece » et « sur pièce » pendant la période d'opposition (deux mois après la publication au BOPI, délai non revérifié).
8. **Extension EUIPO** : à décider seulement si la Belgique ou le Luxembourg sont visés, dans les 6 mois suivant le dépôt INPI (délai non revérifié). Noter la décision, même négative.
9. **Rechercher-remplacer** dans `produit/` selon MARQUE.md § 1.1, MESSAGES.md § 0.1 et l'en-tête d'OFFRES.md. Si le plan B est retenu, reprendre à la main les passages marqués **[dépend du nom]**. ARCHITECTURE.md ne cite le nom qu'une fois (Conventions) ; dans le code, le nom ne vivra que dans `MARQUE_NOM` et `DOMAINE_PRINCIPAL`.
10. Marquer « tranché le JJ/MM/AAAA » : MARQUE.md § 13 (point 1) et § 0, MESSAGES.md § 12.2 (point 1).

## Critères d'acceptation
- [ ] Décision écrite et datée dans MARQUE.md § 13 et § 0.
- [ ] Recherche d'antériorité consignée (requêtes, date, résultat) : aucun conflit bloquant, ou bascule sur le plan B documentée.
- [ ] Les 4 domaines indispensables sont enregistrés au nom de la structure : `whois` le confirme ; renouvellement automatique actif.
- [ ] Récépissé de dépôt INPI reçu ; numéro national et classes notés dans MARQUE.md § 1.6.
- [ ] Comptes sociaux réservés et portés à l'inventaire des comptes (L0-08), sans aucun mot de passe dans le dépôt.
- [ ] `grep -rn "Avant-Clés\|avantcles" produit/` ne renvoie que les mentions du plan B (ou l'inverse si le plan B est retenu).
- [ ] Aucun texte public n'utilise le nom avant la date de dépôt.

## Points d'attention
- **Tranché** : ce ticket dépose la marque verbale seule ; le dépôt semi-figuratif du logo se fait à la fin de L2-02, une fois le dessin vectoriel figé (pas de dépendance circulaire).
- Une expression courante se défend moins bien qu'un mot inventé : c'est la raison du dépôt du logo (MARQUE.md § 1.5).
- En anglais, « surpiece » est corrigé en « surplice » : le référencement associera « Sur Pièce » à « plan » ou « visite ».
- Tarifs et délais INPI et EUIPO non revérifiés au 27/09/2026.
- Qui détient domaines et marque : à aligner avec la création de la société (L0-06) pour éviter une cession tardive.
- Coûts : domaines, quelques dizaines d'euros par an (non vérifié) ; INPI, 270 à 310 €.

## Références
- `produit/recherche/nom.md` § 0, § 3 (Sur Pièce, Avant-Clés), § 6, § 7
- `produit/MARQUE.md` § 0, § 1.1 à § 1.7, § 13
- `produit/MESSAGES.md` § 0.1, § 12.2
- `produit/ARCHITECTURE.md` en-tête (Conventions : `MARQUE_NOM`, `DOMAINE_PRINCIPAL`)
- `produit/recherche/juridique.md` § 7 (n° 1)
- `produit/OFFRES.md` § 10 (risque 20)

## Hors périmètre
- Dessin du logo et du favicon, puis dépôt semi-figuratif du logo : L2-02.
- Mise en ligne et redirections des domaines : L2-16.
- Création de la société et nom commercial : L0-06.
- Titre « Plan en visite 3D » de `pipeline/accueil.html` : remplacé par la valeur de configuration du nom (L2-01 pour le site, L4-01 pour la chaîne), pas ici.
