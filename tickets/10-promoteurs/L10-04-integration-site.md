# L10-04 · Intégration au site du promoteur

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 10 · Offre promoteurs (Programme) | P0 | L (3 à 5 j) | L5-12, L7-04 | `service/` | À faire |

## Pourquoi
Le promoteur veut les visites de ses lots sur son propre site, sans rien ouvrir à d'autres sites (PARCOURS.md C6). OFFRES.md § 4.4 promet : une iframe limitée aux domaines déclarés, aucun traceur dans l'iframe, des événements `postMessage` qu'il mesure sous sa propre plateforme de consentement, un lien acquéreur par lot, des liens pour sa force de vente, des statistiques agrégées. Aujourd'hui, toute visite répond `frame-ancestors 'none'` (L5-12). Ce ticket ouvre l'intégration, domaine vérifié par domaine vérifié (ARCHITECTURE.md M5.2).

## À faire
1. **Partages `integration`** (type prévu par L5-13) servis sur `visite.<domaine>/i/<jeton>` : même résolution que `/v/` (L5-13), même `index.html` versionné (L5-12), aucun cookie.
2. **Domaines parents** : table `domaines` (ARCHITECTURE.md § 4.2), `usage = 'parent_integration'` :
   - ajout par le promoteur (`www.promoteur.fr`) ; vérification par un enregistrement DNS TXT (jeton) ou un fichier sous `/.well-known/` ;
   - revérification quotidienne : enregistrement disparu → domaine suspendu ;
   - e-mail à la vérification (texte de C6 : « Ajoutez cet enregistrement à votre domaine. Nous le vérifions automatiquement et vous prévenons par e-mail. »).
3. **En-têtes** (ARCHITECTURE.md § 6.2) : pour un partage `integration`, `frame-ancestors` = origines `https://` vérifiées de l'organisation, calculées à chaque réponse ; `X-Frame-Options: DENY` seulement quand la liste est vide ; jamais `*` ni `http:`. Domaine non vérifié : la visite refuse de s'afficher, message « Cette visite ne peut pas s'afficher sur ce site. » (C6).
4. **Événements `postMessage`** (SUIVI.md § 3.16) : l'`index.html` servi pour `/i/` contient un adaptateur qui écoute `visite:evenement` (émis par le moteur, L7-04) et envoie :
   - `visite:ouverte` (référence du lot chez le promoteur) au premier rendu ;
   - `visite:piece` (catégorie de pièce seulement) à l'entrée dans une pièce (changement de pièce repéré par `updateHud`, `moteur/engine.js`, l. 1240) ;
   - un envoi par origine déclarée, avec cette origine en `targetOrigin`, **jamais `'*'`** : le navigateur ne livre qu'à l'origine réelle de la page. Aucun identifiant de visiteur, aucun jeton.
5. **Aucune mesure chez nous dans l'iframe** : ni Umami ni script de mesure (contrôle C6), aucun bandeau de notre part (SUIVI.md § 6.6). Seul un compteur agrégé `vues_visite` est tenu côté serveur.
6. **Code à copier**, par lot et par programme : `<iframe src="https://visite.<domaine>/i/‹jeton›" allow="fullscreen" loading="lazy" title="Visite du lot ‹référence›"></iframe>` ; options de vue d'accueil, de logo et de couleurs (réglages de L9-06 s'ils sont livrés). Page « Voir l'aperçu » qui montre le rendu dans une iframe. Page de documentation des deux messages, sans jargon.
7. **Page programme intégrable** `/i/programme/<jeton>` : liste des lots publiés, filtres (typologie, étage, surface), chaque ligne ouvre la visite du lot ; mêmes règles d'en-têtes.
8. **Liens** : lien acquéreur par lot (partage `lien` avec le bandeau « offert par ‹promoteur› », texte à ajouter à MESSAGES.md) ; liens pour la force de vente ; réaffichage et révocation par L5-13.
9. **Clés d'API** (`cles_api`, ARCHITECTURE.md § 4.2, § 6.3, § 6.4) : 256 bits, préfixe affiché, empreinte seule gardée, montrée une seule fois ; portées `lots:lire` et `partages:creer` ; 60 requêtes par minute et par clé ; révocation ; `derniere_utilisation_le`. Routes `GET /api/v1/programmes/<id>/lots` (référence, typologie, statut, URL d'intégration, lien acquéreur) et `POST /api/v1/lots/<référence>/partages`. En-tête `Authorization: Bearer` ; aucun CORS (appel de serveur à serveur).
10. **Statistiques agrégées** pour le promoteur : ouvertures par lot et par jour, lots les plus vus, depuis `vues_visite` ; aucune donnée par visiteur.

## Critères d'acceptation
- [ ] Page parente de test servie sur une origine vérifiée : la visite s'affiche et la page reçoit `visite:ouverte` puis `visite:piece` ; même page sur une origine non vérifiée : affichage refusé par le navigateur, message du catalogue dans l'iframe (recette R11).
- [ ] Aucun `postMessage` vers `'*'` (test de l'adaptateur) ; aucune requête vers Umami ni script de mesure sur `/i/` (C6).
- [ ] `X-Frame-Options: DENY` si la liste est vide, absent sinon ; `frame-ancestors` exact sur chaque type de réponse.
- [ ] Clé absente, révoquée ou de portée insuffisante : refus ; 61e requête dans la minute : 429 ; aucune clé ni jeton dans les journaux.
- [ ] Enregistrement TXT retiré : domaine suspendu à la revérification suivante.
- [ ] Aucun texte technique (L1-04) ; tests sur le témoin seulement, sans lecture payante ; outil local inchangé.

## Mesure
- `integration_ouverte` (C : `vues_visite`, par lot et par jour), `lien_acquereur_cree`, `cle_api_creee` (`portee`), `domaine_verifie` (`usage=parent_integration`).
- `domaine_ajoute`, `programme_publie`, `integration_copiee` : à ajouter à SUIVI.md § 3.13 et à `mesure/evenements.json` (PARCOURS.md § 8.1).

## Points d'attention
- **Tranché** : L7-04 (émission de `visite:evenement` par le moteur, petit diff `[M]`) est une dépendance déclarée, sans laquelle aucun `postMessage` ne part. L9-06 reste facultatif : options de logo et de couleurs seulement s'il est livré.
- **Taille** : L au plafond. Coupe possible : (a) iframe, domaines, en-têtes, `postMessage` ; (b) clés d'API, liens, page programme, statistiques.
- **À décider** : OFFRES.md § 4.4 dit que le lien acquéreur « ouvre sa visite et ses partages privés ». Laisser l'acquéreur créer ses propres liens suppose un compte et un transfert de droits (qui est responsable de traitement ?). Ici, le lien seul.
- `Referrer-Policy: no-referrer` empêche l'iframe de connaître l'origine parente : d'où l'envoi à chaque origine déclarée. `ui.js` protège déjà `localStorage` (l. 449, 463), utile dans une iframe tierce sous Safari.
- La table `domaines` et sa vérification servent aussi à L11-01, qui y ajoute les CNAME et les certificats.
- Loi Hoguet : aucun formulaire de mise en relation dans l'iframe (OFFRES.md § 4.10).
- L'export de réversibilité promis au § 4.4 est construit par L10-09.

## Références
- produit/ARCHITECTURE.md § 2.4, § 2.5, § 4.2 (`partages`, `domaines`, `cles_api`), § 6.2, § 6.3, § 6.4, M5.2.
- produit/OFFRES.md § 4.4, § 4.10 ; produit/PARCOURS.md C6 ; produit/MESSAGES.md § 3.3, § 3.10.
- produit/SUIVI.md § 2.6, § 2.7, § 3.13, § 3.16, § 6.6, § 7.4 (C6), § 7.5 (R11) ; produit/recherche/suivi.md § 7.7.
- `moteur/engine.js:1240` (`updateHud`) ; `moteur/ui.js:449`, `:463` (stockage local protégé).

## Hors périmètre
- Émission des événements par le moteur : L7-04. Domaines de visite en CNAME et certificats : L11-01.
- Portail distributeurs : L10-05. Superposition du plan dans les publications : L10-06. Partages et jetons génériques : L5-13.
