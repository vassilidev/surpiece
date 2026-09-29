# L2-09 · Page de l'appartement témoin (visite de démonstration)

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L1-05, L1-12, L1-15, L2-01 | `site/`, `outils/` | À faire |

## Pourquoi
Le visiteur veut voir le résultat réel avant de donner son e-mail ; il cherche le défaut (MESSAGES.md § 6). `/appartement-temoin` montre la vraie visite du témoin fictif, jouable par tous, sans inscription, avec des appels vers « Importer mon plan ». Le moteur versionné servi par nous n'arrive qu'au lot 4 (L4-06) : la page utilise d'ici là une **copie figée** du moteur, dont three.js et les polices sont servis par la vitrine (aucune requête vers jsdelivr ni Google Fonts, MARQUE.md § 11.1).

Décision du 27/09/2026 (n° 12) : la visite doit être fluide sur un appareil modeste (portable d'entrée de gamme, téléphone). C'est cette démonstration que jugent les visiteurs, souvent sur téléphone.

## À faire
1. **Copie figée du moteur** dans `site/appartement-temoin/moteur-<commit>/` : `ui.js`, `engine.js`, `visite.css` pris dans un commit **fusionné** (après le travail sur les niveaux, après L1-05 et après les corrections de navigation de L1-15 ; après la qualité adaptative, L4-12, si elle est livrée), jamais dans l'arbre de travail en cours ; le commit est noté dans `site/appartement-temoin/VERSION`. Aucune modification de la copie : un défaut trouvé se corrige dans `moteur/` par un ticket, puis on refait la copie.
2. **Bibliothèques servies par nous** : `outils/vendoriser.sh` (nouveau) télécharge three 0.180.0, three-mesh-bvh 0.9.1 et three-gpu-pathtracer 0.0.24 (versions de `moteur/modele.html` l. 13-20), ne garde que les modules réellement importés par `engine.js` et leurs dépendances, écrit leurs empreintes SHA-384 dans `site/vendor/EMPREINTES`. Le même script doit pouvoir servir L4-06.
3. **Page de visite** `site/appartement-temoin/visite/index.html` écrite pour la vitrine (pas une modification de `modele.html`) : même structure que `modele.html`, table d'import pointant vers `/vendor/…`, feuille `@font-face` vers `/polices/` (L2-01), `plan.json` et `photos/` du témoin (sortis de L2-03), favicon de L2-02, title et description de MESSAGES.md § 6.
4. **Photos affichées** : seulement ce que le service livre au lancement (R1 : visite dans le navigateur, plus les images de l'aperçu, soit la vue du dessus, le plan 2D et 2 photos) ; le `plan.json` publié du témoin ne liste que ces 2 photos, jusqu'à L13-02.
5. **Page d'accueil de la démonstration** `site/appartement-temoin/index.html`, dans l'ordre de MESSAGES.md § 6 :
   1. Bandeau d'en-tête § 6.1 : cartouche « PROGRAMME DE DÉMONSTRATION · T3 · <surface réelle> · Plan fictif, créé pour la démonstration », H1 « Visitez l'appartement témoin. », sous-titre, bouton principal **Entrer dans la visite**, bouton « Voir le plan de départ » (PDF fictif de L2-03).
   2. La visite § 6.2 (plein écran, modes du moteur, mention permanente « Appartement témoin fictif · Illustration non contractuelle »).
   3. Panneau « Ce que vous voyez » § 6.3 (à droite sur ordinateur, en volet sur téléphone), avec l'interrupteur « Voir ce que contient le plan offert » qui montre la disposition de l'aperçu (vue du dessus, plan 2D, surfaces, 2 photos, points à confirmer, visite verrouillée) à partir des mêmes images. Le contenu montré suit l'offre gratuite confirmée (L0-04, L1-16) : aperçu de R1 ou mode 360° ; l'interrupteur reste masqué d'ici là.
   4. Appel à l'action § 6.4 : barre collée en bas (téléphone) ou carte (ordinateur) « Et votre logement ? … » avec **Importer mon plan** (suit `mode_depot`, L2-04) ; rappel unique à la sortie de la visite ou après 90 s, sans bloquer l'écran ; lien pros ; limites.
6. **Mesure sans toucher au moteur** : `site/appartement-temoin/adaptateur.js` écoute l'état public du moteur (`App.on`, `moteur/ui.js` l. 435 ; attribut `body[data-mode]` ; `App.loaded` et `App.fail`) et appelle `mesure()` (L2-14) avec `contexte` = `demo`. Il sera remplacé par l'événement `visite:evenement` émis par le moteur (L7-04, SUIVI.md § 2.7).
7. **Repli** : si WebGL manque, le moteur passe au plan 2D (`App.fail`) ; la page garde l'appel à l'action et les photos.
8. **Contrôle** : la visite de contrôle (`moteur/controle.mjs`) et un contrôle de page (contexte WebGL créé, image non noire, aucune requête hors de l'origine, aucune violation de CSP relevée par `securitypolicyviolation`) tournent sur la page servie par la vitrine ; les besoins de CSP mesurés (styles en ligne de `ui.js`, `blob:`) sont transmis à L2-16.

## Critères d'acceptation
- [ ] Page ouverte avec tout accès sortant bloqué sauf l'origine de la vitrine : la visite démarre, les trois modes fonctionnent, les polices sont les bonnes.
- [ ] `moteur/controle.mjs` réussit sur la copie ; aucune texture noire, fente, objet flottant ni porte à l'envers (revue sur ordinateur et sur un téléphone d'entrée de gamme) ; tout défaut trouvé devient un contrôle automatique dans `moteur/` par un ticket.
- [ ] `outils/textes.mjs` (L1-04) passe sur la page : aucun texte technique, y compris en cas d'échec provoqué (WebGL désactivé, `plan.json` absent).
- [ ] Les empreintes de `site/vendor/EMPREINTES` correspondent aux fichiers servis ; `VERSION` donne le commit du moteur copié.
- [ ] Le rappel § 6.4 ne s'affiche qu'une fois et ne bloque jamais l'écran ; mouvement réduit respecté ; volet accessible au clavier (Échap ferme, focus rendu).
- [ ] Aucun appel payant, aucun fichier de `plans/` autre que le témoin ; aucune modification de `moteur/`.
- [ ] Fluidité mesurée par le banc de L1-14 sur l'appareil modeste de référence : i/s et délai de clic au-dessus des seuils retenus (à décider), aucun défaut de clic, de regard ou de déplacement relevé ; mesure jointe au ticket.

## Mesure
Posées selon L2-14 (inertes sans Umami) : `demo_ouverte` (`emplacement` d'arrivée, `chargement`), `visite_mode_choisi`, `visite_piece_vue`, `visite_photo_ouverte`, `visite_plein_ecran`, `visite_quittee` (`contexte` = `demo`), `visite_chargement_echoue`, `cta_depot_clique` (`emplacement` = `fin_demo`, `flottant_mobile`), `section_vue`.

## Points d'attention
- **Tranché** : L1-05 est une dépendance déclarée ; la copie est prise après lui, sinon elle embarquerait des textes techniques (par exemple `moteur/ui.js`, fonction `armLoader` : « Le moteur 3D (three.js, via cdn.jsdelivr.net) ne s'est pas chargé. », et le message « Erreur de l'interface : » de `boot`).
- **Mode simple (R16)** : la démonstration doit montrer la version de base, sans le bouton « Rendu photoréaliste de la vue » ; prendre la copie après L4-11 si ce ticket est livré, sinon le signaler à l'utilisateur avant publication (la copie n'est jamais retouchée à la main).
- **Coordination avec le travail sur les niveaux** : `moteur/` le porte (fini le 27/09/2026, non commité). Ne copier que depuis un commit fusionné ; ne rien modifier dans `moteur/`.
- **Tranché : R1.** La visite du témoin reflète ce que reçoit un client au lancement : aucune galerie complète (L13-02, jamais promise au lancement).
- **Écart de mesure** : `adaptateur.js` dépend d'API internes du moteur (`App.on`, `App.loaded`) qui peuvent changer ; le figer avec la copie et le remplacer à L7-04.
- **Taille** : copie figée, sélection des modules three.js, adaptateur, volet d'aperçu et contrôles tiennent difficilement en 3 jours. Si besoin, sortir l'interrupteur « plan offert » dans un ticket à part.
- **Dictionnaire** : le lien « Vous êtes conseiller ? Voir la page que reçoit votre prospect → » n'a pas d'événement, et la page prospect n'existe pas encore : le masquer jusqu'au lot 9.
- La copie du moteur rend son code public ; c'est déjà le cas pour toute visite publiée, mais aucun secret ni texte de prompt ne doit s'y trouver.

## Références
- produit/MESSAGES.md § 6 (6.1 à 6.4), § 8.3 ; produit/SUIVI.md § 2.7, § 3.5, § 3.15 ; produit/MARQUE.md § 8.2, § 11.
- moteur/modele.html l. 9-20 (Google Fonts, table d'import jsdelivr) ; moteur/ui.js l. 3 (`window.App`), l. 435 (`App.on`), l. 439 (`boot`, chargement de `plan.json`), fonction `armLoader` (`App.loaded`, `App.fail`, message jsdelivr) ; moteur/controle.mjs.
- produit/ARCHITECTURE.md § 2.4, § 5.5 (moteur versionné), § 6.2 (CSP de la visite).

## Hors périmètre
- Moteur versionné et vendor officiels : L4-06. Émission `visite:evenement` par le moteur : L7-04.
- Compatibilité des navigateurs et repli complet : L4-10. Galerie complète : L13-02.
- Page prospect de démonstration pour les conseillers : lot 9.
