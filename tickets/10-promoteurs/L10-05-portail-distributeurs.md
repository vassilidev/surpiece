# L10-05 · Portail distributeurs

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P2 | M (1 à 3 j) | L9-04, L10-04 | `service/` | À faire |

## Pourquoi
Un conseiller qui envoie à ses prospects la visite d'un lot représente une adaptation du plan hors du cercle de famille, dans un but commercial : il lui faut l'autorisation du promoteur (recherche/juridique.md § 4.3). Le portail règle ce point à la source : le promoteur autorise ses commercialisateurs et ses CGP, qui envoient les visites de ses lots depuis leur compte Pro, **sans consommer leurs propres plans** (OFFRES.md § 4.5). C'est aussi une porte d'entrée vers l'offre Pro. OFFRES.md le place après le premier pilote.

## À faire
1. **Table `distributions`** : `programme_id`, `organisation_distributeur_id`, `role` (`commercialisateur`, `cgp`), `accordee_par`, `accordee_le`, `revoquee_le`, `preuve` (clé d'objet de l'autorisation écrite de diffusion étendue, prévue au contrat de L10-01).
2. **Écran du promoteur** : inviter un distributeur (adresse e-mail d'un compte Pro existant, ou invitation à en créer un), liste des distributeurs par programme, révocation.
3. **Côté Pro** : rubrique « Programmes partenaires » avec les lots publiés du programme ; création de liens prospects (L9-04) sur la publication du promoteur, sans débit du quota ; l'hébergement reste celui du lot payé par le promoteur.
4. **Contrôle d'accès** : le partage appartient à l'organisation du distributeur et pointe vers un plan d'une autre organisation, autorisé par une ligne active de `distributions`. C'est la seule exception à la règle « 404 en accès croisé » : utilitaire dédié, testé route par route (L5-19).
5. **Déclaration d'autorisation** : la case « j'ai l'accord du promoteur » (L9-08) est remplie d'office par la distribution, avec sa preuve.
6. **Affichage** : page prospect au nom du distributeur (marque de L9-06), mention du programme ; jamais la superposition du plan du promoteur (L10-06 ne s'applique pas aux distributeurs sans accord explicite).
7. **Statistiques** : le promoteur voit des compteurs agrégés par distributeur et par lot ; jamais les prospects, leurs libellés ni le suivi détaillé.
8. **Données personnelles** : le distributeur est responsable de traitement de ses prospects, nous sommes sous-traitant (DPA pro, L9-08) ; le promoteur n'y a aucun accès.
9. **Révocation** : effet immédiat sur la création de nouveaux liens ; sort des liens déjà envoyés à décider (coupés ou maintenus jusqu'à expiration).

## Critères d'acceptation
- [ ] Un distributeur autorisé crée un lien prospect sur un lot du promoteur : aucun mouvement de consommation sur son grand livre.
- [ ] Un compte Pro non autorisé, ou dont l'autorisation est révoquée, reçoit 404 sur les lots du programme (tests d'accès croisé).
- [ ] Le promoteur ne voit aucune donnée de prospect (test sur les réponses de ses écrans et de son API).
- [ ] Parcours de recette R11 (`distributeur_autorise`) sur le témoin, sans lecture payante ; aucun texte technique.

## Mesure
- `distributeur_autorise` (`activite` : `commercialisateur`, `cgp` ; SUIVI.md § 3.13) ; `lien_prospect_cree` (`formule`, avec une valeur à ajouter pour un lien de distribution si l'on veut les distinguer).

## Points d'attention
- **Tranché** : L9-04 (liens prospects) est une dépendance déclarée, et avec elle L9-08 (déclaration d'autorisation, DPA pro), dont L9-04 dépend. L9-01 (comptes Pro) et le premier pilote (L10-08 ; OFFRES.md § 4.5 : « après le premier pilote ») restent des préalables non déclarés.
- **Juridique** : l'autorisation doit couvrir l'adaptation 3D et la diffusion aux prospects, pour le promoteur et l'architecte (juridique.md § 4.1, § 4.3) ; loi Hoguet : pas de mise en relation rémunérée (OFFRES.md § 4.10).
- Texte « [SI LIVRÉ : portail distributeurs] » de MESSAGES.md § 3.3 : à démasquer seulement quand ce ticket est en production.

## Références
- produit/OFFRES.md § 3.8, § 4.5, § 4.10 ; produit/recherche/juridique.md § 4.3, § 4.4.
- produit/ARCHITECTURE.md § 4.1 (règle 404), § 4.2 (`partages`, `membres`) ; produit/SUIVI.md § 3.12, § 3.13.

## Hors périmètre
- Liens prospects et consentement : L9-04. Marque du conseiller : L9-06. Intégration au site du promoteur : L10-04.
