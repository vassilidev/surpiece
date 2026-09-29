# L5-28 · Précalcul serveur dans la chaîne en ligne : éclairage, maquette compressée, itinéraires

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 5 · Socle en ligne | P1 | M (1 à 3 j) | L4-13, L4-14, L5-06, L5-10, L5-12 | `service/` | À faire |

## Pourquoi
Décision de l'utilisateur du 27/09/2026 (n° 14) : le précalcul côté serveur est validé (éclairage peint sur les murs, éclairage par pièce, maquette compressée, itinéraires). L4-13 et L4-14 livrent les outils. Ce ticket les place dans la chaîne en ligne, en SwiftShader (décision 4), sans casser deux règles : rien n'est publié sans visite de contrôle réussie, et ce qui est publié est ce qui a été contrôlé.

## À faire
1. **Place du précalcul**, choisie par écrit d'après les mesures (durée en SwiftShader, mémoire) :
   - soit après la dernière réparation de la visite de contrôle (`repare_moteur`), puis un contrôle final sur la maquette chargée ;
   - soit dans le worker rendu.
2. **Sorties** dans `prive/…/travaux/<travail_id>/precalcul/`, copiées dans la publication d'une visite. Elles sont servies comme `plan.json` : par `/v/<jeton>/…`, après contrôle du jeton, en `private, no-store`. Jamais pour un aperçu, même en 360°.
3. **Listes blanches** : celle de la publication (L5-02) et celle de `plan.json` (L5-12) s'étendent aux seuls noms retenus. L'empreinte du `plan.json` est vérifiée.
4. **Échec du précalcul** : la visite est publiée sans précalcul (le moteur calcule en direct, L4-13, L4-14), avec une alerte (L5-16). Le plan n'échoue jamais pour cette seule raison (proposition, à confirmer par l'utilisateur).
5. **Rejouer sans repayer** (L5-17) refait le précalcul. Déblocage d'un aperçu (L8-02) : précalcul fait pour tout plan dans la chaîne (déblocage instantané, calcul payé aussi pour les plans offerts jamais débloqués) ou fait au déblocage (attente) : à décider.
6. **Mesure T0** (L5-11) complétée par la durée du précalcul.

## Critères d'acceptation
- [ ] Témoin en Compose : visite publiée avec précalcul, contrôlée sur la maquette chargée, ouverte par un partage.
- [ ] Aperçu : maquette et éclairage répondent 404 par toutes les voies (test).
- [ ] Précalcul en échec forcé : visite publiée quand même, alerte émise, aucun défaut visible.
- [ ] Aucun appel payant ; outil local inchangé.

## Points d'attention
- CSP de la visite : `'wasm-unsafe-eval'` peut être nécessaire (L4-14), mesuré par la vérification de L5-12.
- Délai : le précalcul allonge la génération. Publier la visite avant ou après lui est à décider (L5-11).
- Capacité de la VM (L5-22) : le précalcul s'ajoute au rendu des images et des panoramas. Panoramas 360° : environ 3,5 min par panorama en 4096 sans carte graphique, soit 20 à 40 min par plan (ordre de grandeur du 28/09/2026, estimé avant l'occlusion ambiante qui double le rendu des vues ; à mesurer par L1-16).

## Références
- PLAN.md § 2.1 (décisions 4, 6, 14).
- ARCHITECTURE.md § 2.3, § 5.1, § 5.3, § 6.2 ; L4-13, L4-14, L5-02, L5-06, L5-10, L5-11, L5-12, L5-16, L5-17, L5-22, L8-02.

## Hors périmètre
- Outils de précalcul : L4-13, L4-14. Accélération : L13-01.
