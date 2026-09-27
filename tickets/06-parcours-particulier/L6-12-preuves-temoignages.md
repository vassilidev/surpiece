# L6-12 · Preuves : témoignages autorisés et chiffres mesurés

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 6 · Parcours particulier et bêta fermée | P1 | S (jusqu'à 1 j) | L6-10, L0-07 | `site/` | À faire |

## Pourquoi
Aucun témoignage, aucun nombre d'utilisateurs, aucune note ni aucun logo client tant qu'ils n'existent pas réellement, avec l'accord écrit des personnes (MARQUE.md § 3.3 ; OFFRES.md § 2.1). La bêta fermée (L6-10) produit les premières preuves réelles : les témoignages des testeurs à la fin de T2, et des chiffres mesurés en production. Ce ticket les recueille dans les règles et les affiche aux emplacements prévus, masqués tant qu'ils sont vides (MESSAGES.md § 10).

## À faire
1. **Autorisation** : texte de MESSAGES.md § 10.4, validé par l'avocat (L0-07) avant tout envoi. Accord écrit, texte exact relu par la personne, prénom et initiale du nom, ville, durée de 3 ans, retrait possible à tout moment par `aide@<domaine>`. Archiver chaque accord (date, version du texte, citation acceptée) hors du dépôt, avec les preuves (conservation au registre, L0-09).
2. **Recueil** en fin de test T2 : questions de MESSAGES.md § 10.3 ; citation exacte, seulement corrigée des fautes de frappe ; pas de photo de la personne sans autorisation distincte ; aucun avis rémunéré ni récompensé.
3. **Emplacements** (MESSAGES.md § 10.1) dans `site/`, pilotés par un fichier de données versionné (témoignages publiés, chiffres, date de mesure) : un emplacement vide n'est **pas rendu** du tout (ni titre ni cadre).
   - Accueil, après « Fidélité et contrôle » : « Ils ont vu leur logement avant les clés », affiché à partir de 3 témoignages autorisés ;
   - Méthode : chiffres mesurés en production.
4. **Chiffres** (MESSAGES.md § 10.2), calculés par requête sur le journal `evenements` et `appels_ia`, avec leur date et leur périmètre écrits à côté :
   - délai médian de bout en bout en production (mesure T0 et suivantes, pas les 8 à 15 min du Mac) ;
   - part des plans déposés pris en charge ;
   - part des visites livrées sans défaut signalé ;
   - nombre de plans de référence validés.
   Publiés seulement sur un volume suffisant, fixé par l'utilisateur avant la publication. Requêtes versionnées pour les recalculer.
5. **Retrait** : procédure en moins de 2 jours ouvrés après une demande (retirer du fichier de données, redéployer la vitrine, confirmer par e-mail).
6. **Illustrations** : aucun plan réel, aucune visite réelle ; l'appartement témoin fictif seulement (`references/temoin/`, R11 ; MESSAGES.md § 10.5, MARQUE.md § 8.4).
7. Témoignages de conseillers (après les formules), étude de cas promoteur et logos de partenaires : emplacements prévus, remplis par les lots 9 à 11.

## Critères d'acceptation
- [ ] Le contrôle automatique du site (L2-15) échoue si un emplacement de preuve est rendu vide, ou si un témoignage n'a pas de référence d'accord dans le fichier de données.
- [ ] Avec 2 témoignages dans le fichier : la section de l'accueil n'apparaît pas ; avec 3 : elle apparaît.
- [ ] Chaque chiffre affiché porte sa date et son périmètre ; la requête qui le produit est dans le dépôt et redonne la même valeur.
- [ ] Aucun texte banni (MARQUE.md § 5.2 : « exact », « conforme », « garanti », « au centimètre »…) dans les citations publiées (contrôle de L2-15).
- [ ] Retrait testé : un témoignage retiré disparaît de la page déployée.

## Points d'attention
- Une citation qui promet plus que le produit (« c'est exactement mon appartement ») engage aussi : la citation exacte est la règle, mais l'avocat dit si un témoignage peut être écarté ou accompagné d'une mention (L0-07).
- Si des avis de clients sont affichés un jour, il faut dire s'ils sont vérifiés et comment (MESSAGES.md § 10.5) ; ce ticket publie des témoignages choisis, pas des avis.
- Les chiffres de la bêta viennent de peu de plans : ne pas publier un pourcentage sur une dizaine de plans.
- « 8 à 15 min » a été mesuré sur Mac avec carte graphique ; en production sans carte graphique, ce chiffre ne vaut plus (MARQUE.md § 3.3 le retire, R12) : ne publier que le délai mesuré.

## Références
- MESSAGES.md § 10 ; MARQUE.md § 3.3, § 8.4 ; OFFRES.md § 2.1, § 9.2 (T2) ; recherche/juridique.md § 5.2.

## Hors périmètre
- Témoignages de conseillers et bêta fondateurs : L9-11. Étude de cas promoteur : L10-08.
- Collecte des retours de la bêta : L6-10.
