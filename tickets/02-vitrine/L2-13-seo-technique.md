# L2-13 · Référencement technique, performance, accessibilité

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P1 | M (1 à 3 j) | L2-04 | `site/` | À faire |

## Pourquoi
Les acquéreurs cherchent « transformer plan 2d en 3d » et se rassurent sur leur contrat (« vefa rétractation ») : le référencement est un canal d'acquisition gratuit (marche.md § 3.2, § 5.5). MESSAGES.md fournit title, description et mot-clé de chaque page. Il faut les poser et rendre le site rapide et accessible. La vitrine est indexable dès sa mise en ligne (une fois le nom déposé) ; seules les pages d'application, d'aperçu et de visite sont en `noindex` (R20).

## À faire
1. **Balises par page** (lues dans `site/donnees/pages.json`, injectées par `outils/site.py`, R19) : `<title>` et `meta description` exactement comme MESSAGES.md (accueil § 1, conseillers § 2, promoteurs § 3, marque blanche § 4, tarifs § 5, témoin § 6, méthode § 9) ; longueur vérifiée (title 60 signes au plus hors marque, description 155 au plus, MESSAGES.md § 0.6) ; un seul `h1` par page.
2. **Open Graph et cartes** : `og:title`, `og:description`, `og:image` (images de partage de L2-02, 1200 × 630), `og:locale` = `fr_FR`, `og:type`, `twitter:card` = `summary_large_image`.
3. **URL canoniques** : `link rel="canonical"` absolu sur chaque page ; une seule forme d'URL (avec ou sans barre finale, au choix, partout pareil).
4. **Redirections des domaines** (liste de L0-01, MARQUE.md § 1.6) : `www` → domaine nu, `sur-piece.fr`, `surpiece.com`, `sur-piece.com`, `.eu`, `.app` → `surpiece.fr` en 301 en gardant le chemin ; `http` → `https`. Règles écrites pour l'hébergeur retenu (L2-16) et testées par `curl`.
5. **Plan du site et robots** : `sitemap.xml` généré à partir des pages visibles de `site.json` (pages masquées exclues) ; `robots.txt` qui pointe vers le plan du site.
6. **Indexation (R20)** : toutes les pages publiques de la vitrine (guides et pages légales comprises) sont indexables dès la mise en ligne, qui suit le dépôt du nom (L0-01, L2-16). `noindex` (balise `meta name="robots"` et en-tête `X-Robots-Tag`) seulement sur les pages d'application, d'aperçu et de visite, posé par le service (lots 5 et 6), pas par la vitrine. La préproduction et les aperçus de branche restent toujours en `noindex` et protégés.
7. **Données structurées** (JSON-LD) : `Organization` (nom, logo, URL), `WebSite`, `BreadcrumbList` sur les pages profondes ; `FAQPage` possible mais sans attendre d'affichage enrichi ; aucun `Product`, `Offer`, `Review` ni `AggregateRating` tant que les prix ne sont pas validés et qu'aucun avis réel n'existe.
8. **Performance** : images au bon format et à la bonne taille (L2-03), `width` et `height` déclarés, chargement différé sous la ligne de flottaison, préchargement du seul Archivo, aucun script bloquant, CSS critique en tête ; budgets : LCP sous 2,5 s et CLS sous 0,1 en profil mobile simulé, page d'accueil sous 500 Ko hors vidéo.
9. **Accessibilité AA vérifiée** : axe-core (version figée dans `package.json` de L1-07) sur chaque page, zéro violation grave ou critique ; passage manuel au clavier et avec un lecteur d'écran (VoiceOver) sur l'accueil, un formulaire et la FAQ ; zoom à 200 % sans perte.
10. **Lighthouse** en profil mobile sur chaque page : Performance ≥ 90, Accessibilité ≥ 95, Bonnes pratiques ≥ 95, SEO ≥ 95 ; rapports gardés comme artefacts.
11. Page 404 avec le texte `erreur.404` (MESSAGES.md § 7.12) et lien vers l'accueil ; elle renvoie bien le code 404.

## Critères d'acceptation
- [ ] Un script compare les balises de chaque page à `pages.json` et à MESSAGES.md et échoue sur un écart ou une longueur dépassée (branché en CI par L2-15).
- [ ] `curl -I` sur chaque domaine et variante (`www`, `http`) renvoie une 301 vers l'URL canonique, en une seule redirection.
- [ ] En production, aucune page de la vitrine ne porte `noindex` (balise ni en-tête) ; en préproduction, toutes le portent.
- [ ] Données structurées valides (outil de test des résultats enrichis ou validateur schema.org), sans avertissement bloquant.
- [ ] Lighthouse et axe-core aux seuils du point 9 et du point 10 sur toutes les pages publiées ; captures et rapports joints.
- [ ] Aucun texte technique dans les balises (title, description, alt, JSON-LD).

## Points d'attention
- **Tranché : R20.** La vitrine est indexable dès sa mise en ligne, en mode liste d'attente, une fois le nom déposé ; elle n'attend pas l'ouverture publique (L8-07 n'a plus de `noindex` de la vitrine à lever). Seules les pages d'application, d'aperçu et de visite sont en `noindex`.
- `FAQPage` : Google a restreint l'affichage enrichi des FAQ à quelques sites institutionnels (information à revérifier) ; le balisage reste valide mais n'apporte probablement rien.
- Les domaines et redirections dépendent des achats de L0-01 et de l'hébergeur (D6, L0-03).
- Aucun mot-clé visé n'a de volume mesuré (seulement des suggestions, MESSAGES.md § 0.6).

## Références
- produit/MESSAGES.md § 0.6, balises des § 1, § 2, § 3, § 4, § 5, § 6, § 9, § 11, § 7.12 (`erreur.404`) ; produit/MARQUE.md § 1.6, § 10.
- produit/recherche/marche.md § 3.2, § 5.5 ; produit/PARCOURS.md § 1.5 ; produit/ARCHITECTURE.md § 9.1 (préproduction en `noindex`).

## Hors périmètre
- Hébergement, en-têtes de sécurité, déploiement : L2-16. Contrôles en CI : L2-15.
- Contenus de référencement (guides) : L2-17. `noindex` des pages d'application, d'aperçu et de visite : service (L5-12, L6-05).
