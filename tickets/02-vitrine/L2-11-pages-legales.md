# L2-11 · Pages légales et signalement de contenu

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 2 · Vitrine | P0 | M (1 à 3 j) | L0-03, L0-06, L0-07, L0-09, L2-01 | `site/` | À faire |

## Pourquoi
Aucun site ne peut être mis en ligne sans mentions légales (LCEN art. 1-1, sanction jusqu'à 75 000 € d'amende, juridique.md § 1.8). La liste d'attente et les formulaires collectent des données personnelles : politique de confidentialité et registre sont dus avant la première inscription (juridique.md § 7, lignes 2 à 4). Nous hébergerons des contenus fournis par les utilisateurs : le DSA impose un mécanisme de signalement « facilement accessible » (art. 16). Les textes viennent de l'avocat (L0-07) et du registre (L0-09) ; ce ticket les intègre proprement.

## À faire
1. **Pages** (adresses proposées, à ajouter au pied § 8.2, colonne « Informations ») :
   - `/mentions-legales` : plan de MESSAGES.md § 8.6 (dénomination, forme, capital, siège, RCS et SIREN, TVA, téléphone et e-mail, directeur de la publication, hébergeur de la vitrine avec nom, adresse, téléphone ; médiateur quand il existe ; liens) ;
   - `/confidentialite` : politique de confidentialité fournie ou validée par l'avocat, alignée sur le registre (L0-09) : traitements de la vitrine (liste d'attente, demandes de démonstration et de présentation, signalements, anti-spam), finalités, bases légales, durées, sous-traitants et transferts (y compris Cloudflare si Turnstile est retenu, le fournisseur d'e-mails et l'hébergeur), droits et adresse d'exercice (réponse sous 1 mois), réclamation auprès de la CNIL ; les traitements du service (plans, lecture par un modèle d'intelligence artificielle, ZDR) seulement quand ils existent ;
   - `/traceurs` (« Gestion des traceurs ») : ce qui est déposé aujourd'hui (rien, ou le seul anti-spam classé nécessaire), et la place prévue pour Umami (L7-01). Pas de bandeau de consentement tant qu'Umami reste en réglage minimal exempté ; le bandeau (L7-02) n'arrive qu'avec des traceurs non exemptés (UTM enrichis, relecture de session, publicité) (R18, confirmé en L0-05) ;
   - `/cgu` : CGU provisoires de la bêta (service, limites, garantie des droits sur le plan par l'utilisateur, mention non contractuelle, notification et retrait, suspension), datées et versionnées ;
   - `/signaler-un-contenu` : formulaire DSA (art. 16) : adresse exacte du contenu (URL), explication, nom et e-mail du notifiant, déclaration de bonne foi, case « droits d'auteur » ; accusé de réception automatique, envoi au service de L2-12 (type `signalement`), notification à l'équipe ;
   - « Contact » : adresse `aide@<domaine>` en attendant le formulaire de L6-11.
2. **Version et date** en tête de chaque texte juridique (« Version du … ») ; anciennes versions conservées dans `site/legal/archives/` pour la preuve.
3. **Pied de page par phase** : au lot 2, seuls Mentions légales, CGU, Confidentialité, Gestion des traceurs, Signaler un contenu et Contact sont visibles. CGV, ligne du médiateur et « Renoncer au contrat ici » restent masqués jusqu'à L8-03 et L8-04 (`data-si`).
4. **Mise en forme** : texte long lisible (62 à 75 caractères par ligne, titres numérotés, sommaire ancré), sans papier millimétré sous le texte (MARQUE.md § 6.7) ; imprimable.
5. **Cohérence** : mêmes sous-traitants et mêmes lieux que la page Méthode (L2-10) et que les textes des formulaires (L2-12).
6. Pages indexables comme toute la vitrine (R20) ; exclues des tests A/B et des bandeaux.

## Critères d'acceptation
- [ ] Les textes publiés sont exactement ceux validés par l'avocat (version et date consignées dans le ticket) ; aucun passage marqué [À VALIDER] visible.
- [ ] Mentions légales complètes selon juridique.md § 1.8 (liste vérifiée point par point), hébergeur réel de la vitrine renseigné.
- [ ] La politique de confidentialité cite chaque traitement et chaque sous-traitant du registre qui concerne la vitrine ; test : chaque formulaire du site renvoie à une section qui le décrit.
- [ ] Un signalement de test est reçu, horodaté, accusé par e-mail et visible par l'équipe ; les champs de l'article 16 sont présents.
- [ ] Liens du pied de page présents sur toutes les pages (contrôle L2-15) ; aucun lien mort.
- [ ] Pas de défilement horizontal dès 320 px (R10) ; titres et sommaire navigables au clavier.

## Points d'attention
- **Tranché** : L0-06 (société : dénomination, RCS, SIREN, TVA) et L0-03 (hébergeur de la vitrine, D6) sont des dépendances déclarées, exigées par les mentions légales.
- **Registre** : le tableau des traitements de juridique.md § 3.1 ne contient ni la liste d'attente, ni les demandes de contact des pros, ni les signalements. À ajouter au registre (L0-09) avant la première inscription.
- **Turnstile** : son exemption de consentement repose sur la sécurité et reste à confirmer par l'avocat (SUIVI.md § 6.2 et § 8).
- **DSA** : l'information sur la modération doit figurer dans les CGU (art. 14, non relu selon juridique.md § 1.8).
- **Accessibilité** : l'exemption des micro-entreprises à l'European Accessibility Act est non vérifiée ; on vise AA quand même.
- Les CGV et la politique de remboursement ne sont pas publiées au lot 2 : rien n'est vendu pendant la bêta.

## Références
- produit/recherche/juridique.md § 1.8, § 3.1, § 3.4 à § 3.7, § 4.5, § 7 ; produit/MESSAGES.md § 8.2, § 8.6, § 12.3.
- produit/SUIVI.md § 2.5 (lien « Ne pas être mesuré »), § 6.2, § 6.7 ; produit/MARQUE.md § 6.7, § 10.

## Hors périmètre
- Rédaction juridique : L0-07. Registre et DPA : L0-09. Société : L0-06.
- CGV, médiateur, « Renoncer au contrat ici » : L8-03, L8-04. Bandeau de consentement : L7-02.
- Formulaire de contact et support : L6-11.
