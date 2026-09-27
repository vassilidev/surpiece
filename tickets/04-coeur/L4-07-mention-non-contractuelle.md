# L4-07 · Mention non contractuelle et marquage « généré automatiquement »

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 4 · Cœur réutilisable | P0 | M (1 à 3 j) | L1-04 | `pipeline/` [P], `moteur/` [M] | À faire |

## Pourquoi
La seule mention « non contractuel » est la note de la galerie (`lire.py:1273`) ; rien sur les photos, la fiche, le plan 2D ni la visite (audit A6). Or les images circuleront seules : aperçu partagé, liens envoyés par les conseillers, intégrations. recherche/juridique.md § 5.1 prévoit une mention incrustée dans chaque image et un bandeau permanent dans la visite ; § 5.4 recommande un marquage lisible par machine (règlement européen sur l'IA, article 50 § 2, applicable depuis le 2/08/2026 aux systèmes concernés ; notre qualification reste à faire par l'avocat). juridique.md § 7 (n° 7) le place avant le premier testeur. OFFRES.md § 1 : mention non retirable, y compris en marque blanche. Prérequis de L5-11, L6-05, L6-10 et L8-08.

## À faire
1. **`pipeline/marquage.py`** (nouveau, post-traitement Python, sans toucher au rendu) :
   - `marquer_image(chemin)` : bande discrète en bas de l'image, fond clair semi-opaque et texte Encre (jetons de `visite.css`), police Archivo en TTF (fournie avec L4-06), texte long de MESSAGES.md § 8.3 (« Illustration non contractuelle générée automatiquement à partir du plan de vente. ») si l'image fait au moins 1 000 px de large, texte court (« Illustration non contractuelle ») sinon ; hauteur de texte d'au moins 14 px sur une image de 1 600 px ; JPEG enregistré en qualité 0,9 comme `photos.mjs`, PNG sans perte ;
   - **métadonnées** : paquet XMP (segment APP1 pour le JPEG, bloc `iTXt` `XML:com.adobe.xmp` pour le PNG) avec `Iptc4xmpExt:DigitalSourceType` (URI du vocabulaire IPTC ; valeur proposée à faire valider : `trainedAlgorithmicMedia`, ou `algorithmicMedia` si l'avocat retient que l'image vient d'un moteur 3D déterministe), `dc:description` = la mention, et un marqueur interne de version pour l'idempotence. Paramètre `xmp` de Pillow si la version figée le permet (à vérifier), sinon segment écrit à la main ; pas de nouvel outil externe ;
   - **idempotence** : une image déjà marquée (marqueur XMP présent) n'est pas marquée une seconde fois ;
   - `verifier_image(chemin) -> liste de problèmes` : bande présente (zone de pixels comparée au rendu attendu de la bande), XMP présent avec la valeur attendue ;
   - ligne de commande : `python3 pipeline/marquage.py plans/<id>/photos` (marque) et `--verifier`.
2. **Branchement local** : `photos` (`pipeline/serveur.py:378`) marque le dossier après `photos.mjs`, puis vérifie ; une vérification en échec empêche l'état « fini » (publication bloquée) avec un message du catalogue ; `outils/finalise.sh` appelle le même marquage à la fin. Ces deux points sont les seuls diffs dans les appelants.
3. **Visite** (`moteur/ui.js`) : bandeau permanent et discret portant la mention longue (courte sous 480 px de large), visible dans les quatre modes (galerie, plan 2D, maquette, visite), lisible sur mobile (11 px au moins, contraste AA, MARQUE.md § 10), sans masquer les commandes. Classe `ui` : il est masqué pendant les captures de `photos.mjs` et `controle.mjs`, puisque les images reçoivent la bande ensuite.
4. **Fiche** (`ficheHTML`, `ui.js:408`) : paragraphe de MESSAGES.md § 8.3 (ligne « Fiche du logement ») toujours ajouté à la fin.
5. **Galerie** : la note par défaut (`lire.py:1273`) prend le texte canonique ; le moteur affiche de toute façon la mention, y compris pour les anciens `plan.json`.
6. **Une seule source par langage** : `marquage.MENTION` et `MENTION_COURTE` en Python (reprises du catalogue de L4-05 s'il est fusionné), constante dans `ui.js` ; un test vérifie qu'elles sont identiques à MESSAGES.md § 8.3.
7. **Contrôle automatique** : `--verifier` sur tout dossier de photos avant publication ; dans la visite de contrôle ou le contrôle des textes (L1-04), vérifier que le bandeau existe, est visible et porte la mention exacte dans chaque mode, et que la fiche contient le paragraphe.

## Critères d'acceptation
- [ ] Chaque image de `photos/` (JPEG, et PNG d'aperçu de L4-09) porte la mention et la métadonnée XMP, sur les références (L1-02) et le témoin (L1-12) ; lu par `--verifier` et par un lecteur XMP indépendant.
- [ ] Marquer deux fois ne double pas la bande.
- [ ] Une image non marquée fait échouer `--verifier`, et l'outil local n'atteint pas l'état « fini » ; message sans texte technique.
- [ ] Bandeau visible dans les quatre modes, à 1 280 px, 375 px et 320 px de large (largeur minimale, R10) ; fiche avec son paragraphe ; contrôle des textes (L1-04) réussi.
- [ ] Hors de la bande, les images restent à moins de 2/255 de la ligne de base.
- [ ] Rejeu sans IA, test de fumée ; aucune lecture payante ; critère de fusion d'ARCHITECTURE.md § 8.1.

## Points d'attention
- **À valider par l'avocat (L0-07)** : textes des mentions (marqués [À VALIDER : avocat], MESSAGES.md § 8.3), valeur IPTC, notre rôle au sens du règlement sur l'IA (juridique.md § 8, question 7). Les valeurs sont des constantes, faciles à changer.
- **Échec du marquage en service (R2)** : une photo qui ne peut pas être marquée est traitée comme une photo en échec : omise (galerie adaptative, L4-09), alerte à l'équipe, sans bloquer la publication. La vue du dessus et le plan 2D, eux, conditionnent la publication de l'aperçu : non marqués, l'aperçu attend. En local, le blocage de l'état « fini » reste le garde-fou de ce ticket.
- **Deux mentions différentes** : la mention non contractuelle n'est jamais retirable ; la signature « Visite réalisée avec Sur Pièce », elle, est retirable en option payante (OFFRES.md § 5.2 et § 8.6, SUIVI.md `mention_retrait_active`, ARCHITECTURE.md § 7.3). Deux réglages distincts dans le code, pour ne jamais retirer la première en croyant retirer la seconde.
- **Visuels du témoin** : texte « Appartement témoin fictif · Illustration non contractuelle » (MESSAGES.md § 8.3) ; `marquer_image` accepte un texte de remplacement pour L2-03.
- **Vignettes** : les vignettes sont la même image réduite ; la bande n'y est plus lisible, d'où le bandeau permanent de la visite.
- Manifeste C2PA signé : non traité ici (clés de signature, coût) ; à rouvrir si l'avocat l'exige.
- **Coordination avec le travail sur les duplex** : `ui.js`, `serveur.py` et `lire.py` sont modifiés en parallèle ; nouveau fichier `pipeline/marquage.py`, trois petits diffs ; critère de fusion d'ARCHITECTURE.md § 8.1. Jusqu'à ce ticket, la bêta express porte la mention par écrit (L3-06).

## Références
- produit/recherche/juridique.md § 5.1, § 5.4, § 7 (n° 7), § 8 ; produit/MESSAGES.md § 8.3, § 12.3 ; produit/OFFRES.md § 1 (Mentions), § 5.2 ; produit/ARCHITECTURE.md § 2.3 (étape 8), § 7.3, M1.8 ; produit/recherche/audit-code.md A6.
- pipeline/lire.py:1273 (`note` par défaut) ; pipeline/serveur.py:378 (`photos`) ; moteur/photos.mjs (JPEG en qualité 0,9, masquage de `.ui` pendant les captures) ; moteur/ui.js:379-399 (galerie, `g-note`), :408 (`ficheHTML`) ; moteur/visite.css:1-16 (jetons) ; outils/finalise.sh.

## Hors périmètre
- Mention sur la page d'aperçu : L6-05. Téléchargements et PDF : L8-08. Visuels du témoin : L2-03. Signature « Visite réalisée avec » et son retrait : L11-02 et L11-04 (thème et offre de marque blanche).
