# Historique

Journal des demandes et des étapes du projet, issu du dossier de la visite D201 (dépôt appart) où il a commencé le 26/09/2026.

## Deuxième plan et chaîne automatique (26/09/2026)

- Question de l'acquéreur : peut-on refaire le même travail pour d'autres plans, par appels API, avec photos générées sans IA ? Estimation donnée : 3 à 6 € de lecture par plan avec Claude, 15 à 30 min.
- Plan reçu : T2 432, Côté Montessuy (Icade), Caluire-et-Cuire, R+3, 43,6 m² + loggia 5,7 m². PDF Archicad vectoriel au 1/50 : murs, cotes et surfaces relus dans les tracés, toutes les cotes du promoteur retrouvées au centimètre.
- Moteur générique `moteur/` créé à partir de celui du D201 : murs en biais, pièces polygonales, collisions et itinéraires sur polygones, contexte d'immeuble paramétrable. Galerie de 11 photos générée par script (1 min 40).
- Consignes de l'acquéreur pendant le travail : version simple et fidèle d'abord, très éclairée, sans réglages ; lumière et physique plus tard ; objectif : une page où l'on dépose son plan ; traiter les captures d'écran (avertir, demander une saisie, refuser) ; système utilisable sans Claude Code, par l'API (Anthropic ou OpenRouter) ; avancer plan par plan.
- Chaîne `pipeline/` : dépôt, analyse sans IA (échelle trouvée seule sur les deux plans : 1/50 pour le 432, 0,2 % d'écart pour le D201), calibration au clic pour les images, lecture et contrôle par Claude, photos. Testée de bout en bout avec une lecture simulée ; la lecture réelle attend une clé API.


## Réévaluation complète de la chaîne (26/09/2026, soir)

- Demande de l'acquéreur : réévaluer toute la chaîne avec plusieurs agents, relancer les plans depuis zéro, la visite D201 de production servant de référence de qualité.
- Revue par 8 agents (57 défauts confirmés), corrections par 4 agents (serveur sécurisé, lecture robuste, extraction refaite, moteur tolérant), non-régression.
- Outil de mesure `pipeline/evaluer.py` contre les relevés manuels (D201 de production, 432).
- Cause des « trous dans les murs » du D201 trouvée : le PDF dessine des murs en quadrilatères croisés dont une moitié était perdue. Nouveau module `murs.py` : murs soudés, fentes refermées, éléments isolés écartés, baies calées entre leurs jambages, portes calées sur l'arc dessiné, murs convexes, enveloppe fermée.
- Placards ouverts sur n'importe quel côté (la dalle grise de la Soline venait d'un placard latéral). Pas de prise de vue dans la baignoire ni collée au placard.
- Relecture IA avec un zoom par pièce, puis arbitrage de chaque modification par une question ciblée (plan d'origine, version A, version B) : sur la 432, la relecture retournait à tort le WC, l'arbitrage l'a rétabli.
- Les trois plans relus depuis zéro (432, D201, Soline) : 7 ouvertures sur 7 justes contre les deux relevés manuels, contrôle dans le moteur réussi, 1,10 à 1,58 $ de lecture par plan, 8 à 11 min de bout en bout.
- Contrôle adversarial par 9 agents (3 plans × fidélité, visite et photos, fiche et textes) : 115 défauts prouvés, dont 5 bloquants (cloison WC/SdB disparue et gaine fantôme dans le WC du D201, premier arrêt bouché par une porte, fente de 10 cm dans un mur de la Soline). Corrections : cloisons jamais supprimées, fentes et encoches de moins de 13 cm refermées, gaine posée sur un équipement écartée, sols prolongés jusqu'aux murs, fenêtres à un vantail calées sur leur arc, équipements recollés au mur, robinetterie de douche, portes fermées quand elles boucheraient une photo, vues distinctes, arrêt de visite pour chaque pièce (WC compris), maquette cadrée en entier, plus d'identifiant technique ni de « HSP » inventé, fiche rédigée pour l'acquéreur.
- Relance finale des trois plans (432 : 1,20 $ ; D201 : 1,60 $ ; Soline : 1,85 $, 9 à 15 min) : contrôle réussi du premier coup ; contre les relevés manuels, D201 à 7 ouvertures sur 7 et 6 équipements sur 6, 432 à 6 sur 7 et 6 sur 7. L'arbitrage a rattrapé à chaque fois les erreurs de la relecture (WC de la 432, porte de salle de bain de la Soline).
- Quatrième plan testé par l'acquéreur : appartement 11, T3 de 59,28 m² avec balcon de 5,47 m², R+1, Monopolis (Bouygues Immobilier), 22 rue Victor Basch à Villeurbanne. PDF vectoriel au 1/50 avec façade en biais et balcon en saillie. Lu en 9 min pour 1,10 $, contrôle réussi du premier coup. Seule erreur : la baignoire lue comme une douche, d'où une nouvelle règle (un « receveur » de moins de 0,78 m de large et de plus de 1,20 m de long est signalé à l'IA), corrigée pour 0,20 $.
- Rendu des murs d'un seul tenant (plus de traits aux raccords des morceaux), petites entailles en V refermées, visite guidée qui ferme les portes dont le vantail barrerait le trajet (traversées divisées par deux environ).
