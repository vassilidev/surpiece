# L7-03 · Attribution des inscriptions

| Lot | Priorité | Taille | Dépend de | Touche | Statut |
|---|---|---|---|---|---|
| 7 · Mesure et entonnoirs | P0 | M (1 à 3 j) | L5-15, L6-01, L7-02 | `site/`, `service/` | À faire |

## Pourquoi
Savoir quelles campagnes, quels partenaires et quelles recherches amènent des inscriptions, pour décider où dépenser (SUIVI.md § 5.2) et, plus tard, envoyer les conversions à Meta et Google (lot 12). L'attribution n'est gardée **qu'après consentement** à la finalité « publicité » (SUIVI.md § 2.3, règle 2) : sans bandeau en service (R18), aucune captation, seule la source déclarée existe. Pour tous, y compris ceux qui refusent, la question « Comment nous avez-vous connu ? » donne une provenance déclarée, sans traceur (§ 2.10).

## À faire
1. **Captation** (SUIVI.md § 2.9), seulement quand « publicité » est acceptée, à l'arrivée ou au moment de l'accord sur la page courante : `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `gbraid`, `wbraid`, `fbclid`, hôte du référent, chemin d'arrivée en gabarit. **Rien n'est gardé avant l'accord**, pas même dans `sessionStorage`.
2. **`fbc`** = `fb.1.<horodatage ms>.<fbclid>`, sans toucher à la casse du `fbclid`.
3. **Premier et dernier contact** : un contact est une arrivée avec un UTM, un identifiant de clic ou un référent externe (hors nos domaines, `checkout.stripe.com`, `accounts.google.com`). Premier contact jamais écrasé ; dernier contact remplacé à chaque nouveau contact, jamais par une visite directe.
4. **Cookie `attr`** : propriétaire, sur `.<domaine>`, `Secure`, `SameSite=Lax` ; JSON en base64url de moins de 4 Ko, valeurs coupées à 100 caractères ; chaque identifiant de clic garde sa date et expire 90 jours après ; le cookie expire 90 jours après le dernier contact.
5. **Recopie sur le compte** :
   - Google (L5-24) : le serveur lit `attr` à la création du compte (même navigateur) ;
   - lien magique : la demande de lien (volet de L6-01) emporte le contenu de `attr`, que le serveur attache à la demande en attente ; l'attribution survit à l'ouverture du lien sur un autre appareil ;
   - le serveur **valide chaque champ** (liste fermée de clés, longueurs, motifs), écrit la ligne `attribution` et une copie de l'état du consentement, puis efface le cookie.
6. **Table `attribution`** : schéma de recherche/suivi.md § 7.4, plus `canal_premier`, `canal_dernier` (règle de priorité de SUIVI.md § 2.9 : `payant_google`, `payant_meta`, `payant_autre`, `email`, `partenaire`, `social`, `qr`, `recherche_naturelle`, `referent`, `direct`) et `source_declaree_detail` (200 caractères au plus).
7. **Retrait** du consentement (bandeau ou compte, L7-02) : `attr` effacé, identifiants de clic du compte effacés en base, ligne `consentements`, plus aucun envoi possible.
8. **« Comment nous avez-vous connu ? »** : composant réutilisable, un seul choix facultatif, réponses en ordre aléatoire sauf « Autre » en dernier avec un champ court. Valeurs : `source` de SUIVI.md § 3.2 (particulier et pro). Placé sur l'écran d'attente du particulier (emplacement de L6-03), pas à l'inscription ; version pro dans le formulaire d'essai (lot 9). Le texte de « Autre » va dans `attribution`, jamais dans le journal.
9. **Convention UTM** (SUIVI.md § 2.9) écrite dans un fichier de référence pour l'équipe et les partenaires : minuscules sans accent, `utm_campaign` au format `aaaa_mm_<cible>_<theme>`.
10. Suppression du compte : la ligne `attribution` est supprimée avec le compte ; seules les statistiques anonymes du journal restent.

## Critères d'acceptation
- [ ] Scénario R14 (SUIVI.md § 7.5) : arrivée avec UTM, `gclid` et `fbclid` ; refus → aucun cookie `attr` ; acceptation → `attr` rempli, `fbc` bien formé et casse du `fbclid` intacte ; inscription par Google → ligne `attribution` ; inscription par lien magique ouvert dans un autre contexte de navigateur → ligne `attribution` aussi ; retrait → identifiants effacés.
- [ ] Tests unitaires de la règle de canal (un cas par ligne du tableau de SUIVI.md § 2.9) et du premier et dernier contact (visite directe entre deux campagnes).
- [ ] Cookie forgé (clé inconnue, valeur de 5 Ko, script) : rejeté ou nettoyé, rien d'autre n'est écrit.
- [ ] Réponse à la question sur l'écran d'attente : événement `source_declaree` sans texte libre ; texte de « Autre » présent seulement dans `attribution`.
- [ ] Aucune donnée d'attribution dans Umami ni dans le journal (C5 et requête SQL).
- [ ] Question « Comment nous avez-vous connu ? » : libellés lisibles (liste de SUIVI.md § 2.10, textes à reporter dans MESSAGES.md), aucun texte technique ni code de valeur affiché (contrôle de L1-04).

## Mesure
- S : `source_declaree` (`source`, `cible`) ; propriétés `attribution` (`avec`, `sans`) et `consentement_pub` de `compte_cree` ; `consentement_enregistre` (`origine=retrait`).

## Points d'attention
- Le composant est affiché par L6-03 mais livré ici : coordonner, ou le livrer avec L6-03 si le lot 7 tarde (il ne dépend d'aucun traceur).
- « Où en êtes-vous ? » (`situation_declaree`) partage le même emplacement ; sa place est une décision de L0-05 (levier L3).
- Les identifiants de clic sont des données personnelles : 90 jours au plus, finalité publicitaire, inscrits au registre (L0-09) ; l'IP et l'agent utilisateur pour Meta relèvent de L12-01, pas d'ici.
- L'attribution est un minorant : les refus de consentement n'ont que la source déclarée.
- La demande de lien magique de L6-01 (dans les dépendances) transmet `attr`.

## Références
- SUIVI.md § 2.3, § 2.4, § 2.9, § 2.10, § 2.12, § 3.2, § 3.7, § 5.2, § 7.5 (R14) ; recherche/suivi.md § 7.4, § 7.5.
- PARCOURS.md A5, A7, § 7.2 (L3) ; OFFRES.md § 9.2 (T10, T11).

## Hors périmètre
- Envois de conversions à Meta et Google : L12-01, L12-02. Premières campagnes : L12-04.
- Bandeau et table `consentements` : L7-02.
