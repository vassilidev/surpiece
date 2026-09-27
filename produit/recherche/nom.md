# Nom du produit

Recherche du 27/09/2026. Les disponibilités de domaines ont été relevées ce jour entre 08 h et 09 h (UTC) et peuvent changer d'une heure à l'autre. Chaque fait externe est suivi de sa source. La mention « non vérifié » signale ce que je n'ai pas pu confirmer sur une source primaire.

Nom de travail actuel : « Plan en visite 3D », titre de `pipeline/accueil.html`.

---

## 0. En bref

**Recommandation : « Sur Pièce ».** Slogan : **« Achetez sur plan, jugez sur pièce. »**

Pourquoi ce nom :
- **Il nomme exactement le manque du neuf.** La MAIF présente « juger sur pièce » comme l'avantage de l'ancien : « Le bien est existant et vous pouvez juger sur pièce » ([MAIF](https://www.maif.fr/habitation/guide-achat-immobilier/choisir-neuf-ou-ancien)). En VEFA on achète « sur plan ». Le produit rend au neuf ce qui lui manque. Le nom fait passer d'« acheter sur plan » à « juger sur pièce » sans rien expliquer.
- **Il a trois sens, tous utiles :**
  - la pièce du logement (on visite pièce par pièce) ;
  - la preuve (« juger sur pièce(s) » : se faire une opinion sur des éléments concrets, [Wiktionnaire](https://fr.wiktionary.org/wiki/juger_sur_pi%C3%A8ce)) ;
  - pour les pros, les « pièces graphiques » d'un dossier de permis ou de DCE (usage courant du métier, non sourcé ici).
- **Il inspire confiance** par la vérification, pas par la promesse. Cela sert autant le particulier qui doute que le CGP qui doit convaincre.
- **Il colle à la DA.** « SUR PIÈCE » en capitales Archivo large, dans un cartouche à trait de 1,5 px, reste sobre. L'accent du È fait un détail graphique propre.
- **Il se prête à la marque blanche et aux extensions** : Sur Pièce Pro, Sur Pièce Programme, Meublé, Résidence. On le glisse dans une phrase : « je vous envoie le lien Sur Pièce ».
- **Il est libre partout où j'ai regardé :**
  - domaines `surpiece` en .fr, .com, .immo, .app, .eu et .io, et `sur-piece` en .fr et .com ;
  - aucune marque identique ni proche dans TMview (France, UE, international) ;
  - aucune société de ce nom au registre national des entreprises.

Trois points de vigilance :
1. **`surpieces.fr` et `surpieces.com` (au pluriel) sont pris.** Ils ont été enregistrés tous les deux le 11/07/2026 chez Gandi par un particulier anonyme et sont « parqués » : la page de Gandi indique « currently parked by the owner » (whois AFNIC et Verisign du 27/09/2026). Si ce n'est pas vous, quelqu'un a peut-être eu une idée voisine. Il faut prendre le singulier et la variante à tiret tout de suite.
2. **En anglais, « surpiece » se lit comme « surplice »** (le surplis, vêtement liturgique) : la recherche Brave corrige d'office vers ce mot. C'est sans effet en France, mais le référencement devra viser « Sur Pièce » associé à « visite 3D » ou « plan ».
3. **Une expression courante est moins forte qu'un mot inventé.** Elle n'est pas descriptive d'un logiciel de visite 3D, donc elle reste déposable (mon analyse, pas un avis juridique). Il vaut mieux déposer aussi le logo, c'est-à-dire la version semi-figurative dans son cartouche.

**Suivants, dans l'ordre :**
2. Avant-Clés, « Entrez chez vous avant la remise des clés » : la promesse la plus claire, sans conflit trouvé.
3. Clés en vue.
4. Tour de clé : conflits modérés.
5. Planvif : le plus neutre en B2B.

**À faire cette semaine** (détail au §7) :
- acheter les domaines ;
- vérifier à la main la base INPI et faire une recherche Google, car ces deux vérifications ont été bloquées ici ;
- déposer la marque verbale à l'INPI en classes 9, 35 et 42 avant toute annonce publique ;
- réserver les comptes @surpiece.

---

## 1. Méthode

1. **Génération.** J'ai écrit 139 candidats sous cinq angles :
   - vocabulaire d'architecte détourné (44) ;
   - promesse « chez soi avant la livraison » (32) ;
   - composés français (29) ;
   - mots inventés courts de deux syllabes (25) ;
   - noms neutres crédibles en B2B (9).

   S'y ajoutent 11 variantes d'orthographe pour les finalistes et les 15 noms déjà écartés par l'utilisateur. Critères de génération : français, prononçable d'une traite, pas de jargon incompris d'un particulier, pas de nom qui ne marche que pour la 3D (le produit fait aussi plan 2D, photos, puis aménagement et résidence).
2. **Disponibilité des domaines** : .fr et .com pour tous, puis .immo, .app, .eu et .io pour les finalistes.
   - .fr : `whois -h whois.nic.fr X.fr`, « NOT FOUND » signifie libre.
   - .com : `whois -h whois.verisign-grs.com X.com`, « No match for » signifie libre.
   - .immo et .app : ces registres n'ont pas de serveur whois public. J'ai interrogé leur RDAP, trouvé via le fichier d'amorçage de l'IANA ([data.iana.org/rdap/dns.json](https://data.iana.org/rdap/dns.json)) : Identity Digital pour .immo et .io, Google Registry pour .app. Une réponse 404 veut dire non enregistré ; contrôle fait sur des domaines connus, qui répondent 200. Attention : un nom non enregistré peut quand même être réservé ou vendu au tarif « premium » par le registre.
   - .eu : `whois -h whois.eu`, « Status: AVAILABLE » signifie libre.
   - Pause de 2 s entre deux requêtes. Aucun blocage.
3. **Conflits**, pour chacun des 10 finalistes :
   - **marques** : API publique de [TMview](https://www.tmdn.org/tmview/), offices FR (INPI), EM (EUIPO) et WO (OMPI), recherche par mots proches. Contrôle fait sur SELOGER et MATTERPORT, qui remontent bien. Les dépôts de moins de quelques semaines peuvent ne pas encore y figurer. La base INPI directe ([data.inpi.fr](https://data.inpi.fr)) a refusé l'accès automatisé (403) : **à refaire à la main** ;
   - **sociétés** : API de l'[Annuaire des entreprises](https://annuaire-entreprises.data.gouv.fr) (`recherche-entreprises.api.gouv.fr`) ;
   - **présence web** : moteur Brave, jusqu'à ce qu'il impose un captcha. Le quota de recherche web de la session était épuisé et Bing, Google, DuckDuckGo et Mojeek bloquent les requêtes automatiques. **La vérification web n'est donc complète que pour Sur Pièce, Tour de clé et Lumeplan.** Pour Avant-Clés, Clés en vue, Planvif et Visite neuve, seuls les registres ont été consultés : il faut une recherche Google manuelle avant de choisir ;
   - **sens en anglais et homonymes** : examen au cas par cas.
4. **Notation** de 1 à 5 sur huit critères (§4), en somme simple sur 40. En cas d'égalité, je départage par évocation + confiance, les deux qualités demandées en premier.
5. **Classement** d'un top 5 avec slogans, puis recommandation.

Résultat global : sur les 139 candidats, **26 sont libres en .fr et en .com**, 16 seulement en .fr et 1 seulement en .com. Presque tous les mots simples du métier et tous les mots inventés de 4 à 6 lettres sont pris dans les deux extensions.

---

## 2. Tableau complet des candidats

Déjà vérifiés par l'utilisateur, pris en .fr et en .com, non retestés : aplomb, seuil, lucarne, visitable, embrasure, enfilade, travée, allège, entresol, cotes, volumes, habitable, emménage, déplan, surplan.

Tous les noms ci-dessous ont été testés le 27/09/2026. Dans chaque groupe, les noms libres dans les deux extensions viennent en premier.

**Architecte détourné** (44)

| Nom | Domaine testé | .fr | .com | Remarque |
|---|---|---|---|---|
| Mon cartouche | moncartouche | **libre** | **libre** | le mot « cartouche » évoque aussi les munitions |
| À l'échelle | alechelle | **libre** | **libre** | marque « A l'échelle » en classe 42 (voir §3) |
| Bleu plan | bleuplan | **libre** | pris | nom de la couleur d'accent |
| Clenche | clenche | **libre** | pris | loquet de porte |
| Imposte | imposte | **libre** | pris | fenêtre au-dessus d'une porte ; sonne comme « impôt » / « imposteur » |
| Plan masse | planmasse | pris | **libre** | terme technique |
| Alcôve | alcove | pris | pris |  |
| Antichambre | antichambre | pris | pris | la pièce d'avant |
| Arpent | arpent | pris | pris | « arpenter » son logement |
| Au carré | aucarre | pris | pris | « au carré » = impeccable, et m² |
| Au propre | aupropre | pris | pris | « mettre au propre » |
| Calepin | calepin | pris | pris |  |
| Calque | calque | pris | pris |  |
| Cartouche | cartouche | pris | pris | colle parfaitement à la DA |
| Claire-voie | clairevoie | pris | pris |  |
| Claustra | claustra | pris | pris |  |
| Coursive | coursive | pris | pris |  |
| Croquis | croquis | pris | pris |  |
| D'équerre | dequerre | pris | pris | « être d'équerre » = en ordre |
| Esquisse | esquisse | pris | pris |  |
| Gabarit | gabarit | pris | pris |  |
| Grand jour | grandjour | pris | pris |  |
| Heurtoir | heurtoir | pris | pris |  |
| Jalon | jalon | pris | pris |  |
| Lanterne | lanterne | pris | pris | « éclairer la lanterne » |
| Linteau | linteau | pris | pris |  |
| Loquet | loquet | pris | pris |  |
| Loupiote | loupiote | pris | pris |  |
| Oriel | oriel | pris | pris |  |
| Palier | palier | pris | pris |  |
| Perron | perron | pris | pris |  |
| Plain-pied | plainpied | pris | pris |  |
| Plein jour | pleinjour | pris | pris |  |
| Pénates | penates | pris | pris | « regagner ses pénates » |
| Relevé | releve | pris | pris |  |
| Tabatière | tabatiere | pris | pris |  |
| Trumeau | trumeau | pris | pris |  |
| Vasistas | vasistas | pris | pris |  |
| Verrière | verriere | pris | pris |  |
| Vestibule | vestibule | pris | pris |  |
| Éclaireur | eclaireur | pris | pris |  |
| Élévation | elevation | pris | pris | vue en élévation = passage 2D → 3D |
| Épure | epure | pris | pris |  |
| Équerre | equerre | pris | pris |  |

**Promesse « chez soi avant la livraison »** (29)

| Nom | Domaine testé | .fr | .com | Remarque |
|---|---|---|---|---|
| Avant-Clés | avantcles | **libre** | **libre** | finaliste |
| Avant-visite | avantvisite | **libre** | **libre** | descriptif |
| Chez Demain | chezdemain | **libre** | **libre** | finaliste |
| Chez bientôt | chezbientot | **libre** | **libre** | « Bientôt chez soi » est une enseigne d'une SSII (voir §3) |
| Déjà chez moi | dejachezmoi | **libre** | **libre** | proche de la marque « Déjà chez soi » (cl. 36) |
| Déjà chez soi | dejachezsoi | **libre** | **libre** | marque FR 4500908 en classe 36 (voir §3) |
| Porte ouverte | portouverte | **libre** | **libre** | générique, nombreuses marques |
| Sur Pièce | surpiece | **libre** | **libre** | finaliste (« juger sur pièce ») |
| Tour de clé | tourdecle | **libre** | **libre** | finaliste |
| Visite blanche | visiteblanche | **libre** | **libre** | comme un « examen blanc » |
| Avant les clés | avantlescles | **libre** | pris |  |
| Comme si | commesi | **libre** | pris | « comme si vous y étiez » |
| Entrez donc | entrezdonc | **libre** | pris |  |
| Aperçu | apercu | pris | pris |  |
| Avant-goût | avantgout | pris | pris |  |
| Avant-première | avantpremiere | pris | pris |  |
| Bientôt chez soi | bientotchezsoi | pris | pris |  |
| Comme chez soi | commechezsoi | pris | pris |  |
| Crémaillère | cremaillere | pris | pris |  |
| Demain chez moi | demainchezmoi | pris | pris |  |
| En primeur | enprimeur | pris | pris | VEFA ≈ vente en primeur |
| En vrai | envrai | pris | pris |  |
| Premier pas | premierpas | pris | pris |  |
| Primeur | primeur | pris | pris |  |
| Prévisite | previsite | pris | pris |  |
| Prévu | prevu | pris | pris | « pré-vu » |
| Tour du proprio | tourduproprio | pris | pris | « faire le tour du propriétaire » |
| Tout neuf | toutneuf | pris | pris |  |
| Trousseau | trousseau | pris | pris | trousseau de clés |

**Composé français** (32)

| Nom | Domaine testé | .fr | .com | Remarque |
|---|---|---|---|---|
| Au mètre près | aumetrepres | **libre** | **libre** | long |
| Chez plan | chezplan | **libre** | **libre** |  |
| Cléplan | cleplan | **libre** | **libre** |  |
| Clés en vue | clesenvue | **libre** | **libre** | finaliste (jeu sur « clés en main ») |
| Entremurs | entremurs | **libre** | **libre** | marque ENTREMURS en cl. 19/27/37 (voir §3) |
| Lumeplan | lumeplan | **libre** | **libre** | proche de LUMIPLAN (voir §3) |
| Plan ouvert | planouvert | **libre** | **libre** | « plan ouvert » = open space, descriptif |
| Plan à vivre | planavivre | **libre** | **libre** |  |
| Plan-pièce | planpiece | **libre** | **libre** |  |
| Planeuf | planeuf | **libre** | **libre** |  |
| Planvif | planvif | **libre** | **libre** | finaliste |
| Visite neuve | visiteneuve | **libre** | **libre** | finaliste, descriptif |
| Vue de dedans | vuededans | **libre** | **libre** | long |
| Vue sur plan | vuesurplan | **libre** | **libre** |  |
| Au trait | autrait | **libre** | pris |  |
| Déplié | deplie | **libre** | pris | le plan se déplie en volume |
| Habiplan | habiplan | **libre** | pris |  |
| Pièce à pièce | pieceapiece | **libre** | pris |  |
| Plan-clé | plancle | **libre** | pris |  |
| Tour de plan | tourdeplan | **libre** | pris |  |
| Voluplan | voluplan | **libre** | pris |  |
| En relief | enrelief | pris | pris |  |
| Grandeur nature | grandeurnature | pris | pris |  |
| Ma maquette | mamaquette | pris | pris |  |
| Pièce maîtresse | piecemaitresse | pris | pris |  |
| Pièce montée | piecemontee | pris | pris |  |
| Pièce par pièce | pieceparpiece | pris | pris |  |
| Plan clair | planclair | pris | pris |  |
| Plan libre | planlibre | pris | pris | concept de Le Corbusier |
| Plan-séquence | plansequence | pris | pris | jeu de mots cinéma |
| Trait pour trait | traitpourtrait | pris | pris |  |
| Échelle un | echelleun | pris | pris | échelle 1:1 |

**Mot inventé court** (25)

| Nom | Domaine testé | .fr | .com | Remarque |
|---|---|---|---|---|
| Lodjo | lodjo | **libre** | pris |  |
| Tessel | tessel | **libre** | pris |  |
| Casi | casi | pris | pris |  |
| Cléo | cleo | pris | pris |  |
| Clévia | clevia | pris | pris |  |
| Domi | domi | pris | pris |  |
| Habio | habio | pris | pris |  |
| Habo | habo | pris | pris |  |
| Hublo | hublo | pris | pris |  |
| Linéa | linea | pris | pris |  |
| Logia | logia | pris | pris |  |
| Logéo | logeo | pris | pris |  |
| Lumo | lumo | pris | pris |  |
| Mézon | mezon | pris | pris |  |
| Nido | nido | pris | pris |  |
| Planette | planette | pris | pris |  |
| Plani | plani | pris | pris |  |
| Plania | plania | pris | pris |  |
| Planéo | planeo | pris | pris |  |
| Plao | plao | pris | pris |  |
| Plumo | plumo | pris | pris |  |
| Spatio | spatio | pris | pris |  |
| Tridi | tridi | pris | pris |  |
| Vizio | vizio | pris | pris |  |
| Voluma | voluma | pris | pris |  |

**Neutre B2B** (9)

| Nom | Domaine testé | .fr | .com | Remarque |
|---|---|---|---|---|
| Maquetta | maquetta | **libre** | pris |  |
| Cotalis | cotalis | pris | pris |  |
| Habitas | habitas | pris | pris |  |
| Immerso | immerso | pris | pris |  |
| Lotis | lotis | pris | pris |  |
| Planora | planora | pris | pris |  |
| Previsio | previsio | pris | pris |  |
| Traceo | traceo | pris | pris |  |
| Visalis | visalis | pris | pris |  |

**Variantes testées pour les finalistes** (même méthode) :

| Domaine | .fr | .com | Commentaire |
|---|---|---|---|
| sur-piece | **libre** | **libre** | à prendre avec surpiece |
| surpieces | pris | pris | les deux créés le 11/07/2026 chez Gandi, titulaire « PERSON » anonyme, page parking Gandi |
| avant-cles | **libre** | **libre** | |
| avantcle | **libre** | **libre** | faute de frappe probable |
| avantclefs | **libre** | **libre** | |
| tour-de-cle | **libre** | **libre** | |
| tourdecles | **libre** | **libre** | |
| tourdeclef | **libre** | **libre** | |
| cles-en-vue | **libre** | **libre** | |
| cleenvue | **libre** | **libre** | |
| clefsenvue | **libre** | **libre** | |

**Autres extensions des finalistes** : toutes **non enregistrées**, en RDAP pour .immo et .app, en whois pour .eu, en RDAP pour .io.

| Nom | .immo | .app | .eu | .io |
|---|---|---|---|---|
| surpiece | libre | libre | libre | libre |
| avantcles | libre | libre | libre | libre |
| clesenvue | libre | libre | libre | libre |
| planvif | libre | libre | libre | libre |
| tourdecle | libre | libre | non testé | libre |
| chezdemain, alechelle, visiteneuve, lumeplan, entremurs, portouverte, planouvert, cleplan, chezbientot, planavivre, imposte | libre | libre | non testé | non testé |

---

## 3. Finalistes : conflits trouvés

J'ai retenu les 10 meilleurs noms libres en .fr et en .com, plus Imposte (.fr seulement) parce qu'il figurait dans la liste de départ.

### Sur Pièce (`surpiece`)
- **Marques** : aucune pour « surpiece » ni « surpièce » dans TMview (FR, EM, WO). La recherche « sur pièce » ne remonte que des marques sans rapport : pièces auto, « MA PIECE SUR MESURE » (EUTM 019302589, classes 6/35/37/40/42, pièces métalliques), « SURROUND THE WORKPIECE ».
- **Sociétés** : aucune pour « surpiece ». Dans l'immobilier, le nom le plus proche est MA PIECE (MA PIECE IMMO), une agence immobilière (SIREN 895354074, NAF 68.31Z, [fiche](https://annuaire-entreprises.data.gouv.fr/entreprise/895354074)). Le nom est différent et le risque de confusion faible.
- **Web** : aucune marque, application ni agence nommée « Sur Pièce » dans les résultats Brave. « piecesurpiece.com » est un site québécois sur les maisons en bois « pièce sur pièce » ([piecesurpiece.com](https://piecesurpiece.com/)), sans rapport.
- **Domaine voisin** : `surpieces.fr` et `surpieces.com` sont enregistrés depuis le 11/07/2026 (voir §0).
- **Anglais** : « surpiece » évoque « surplice » (surplis). Sans gravité.
- **Homonymes** : « pièce » désigne aussi une pièce de monnaie, de théâtre ou détachée. Le contexte immobilier lève l'ambiguïté.

### Avant-Clés (`avantcles`)
- **Marques** : aucune pour « avant cles », « avant-clés » ni « avantcles » dans TMview.
- **Sociétés** : aucune.
- **Web** : « avant les clés » n'apparaît que comme expression dans des guides VEFA (remise des clés, pré-livraison), par exemple [Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F2956). La recherche du nom lui-même a été bloquée par captcha : **non vérifié**.
- **Oral** : le « s » est muet et l'accent disparaît dans le domaine. `avantcle` et `avant-cles` sont libres et peuvent servir de redirections.

### Clés en vue (`clesenvue`)
- **Marques** : aucune pour « cles en vue ». La famille voisine « Clés en main » est chargée : une dizaine de marques FR, dont « Les Clés en Main » FR 5048508 (classes 36/37/43/45) et « Les clés en mains » FR 4518972 (classes 35/41/42/43/44), vues dans TMview. Le jeu de mots est visible mais la différence est nette.
- **Sociétés** : aucune sous ce nom. Le seul résultat, une exploitation agricole, est sans rapport.
- **Web** : captcha, **non vérifié**.
- **Oral** : liaison « clé-z-en-vue ». Clé ou clef, avec ou sans « s » : `cleenvue` et `clefsenvue` sont libres.

### Planvif (`planvif`)
- **Marques** : aucune pour « planvif » ni « plan vif ». « PLANIF » (FR 4030633, classe 42) est arrivée à terme.
- **Sociétés** : aucune.
- **Web** : captcha, **non vérifié**.
- **Sens** : « vif » veut dire vivant et lumineux, mais aussi « à vif ». Neutre en anglais.

### Tour de clé (`tourdecle`)
- **Marques** : « TOUR DE CLES » d'Hermès International, en France (FR 4936664, [TMview](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004936664)) et à l'international (WO 1761096), **classe 18 uniquement** (maroquinerie). Ce n'est pas notre classe, mais le titulaire est une maison de renommée, réputée défendre ses marques.
- **Sociétés** :
  - TOUR DE CLEFS IMMOBILIER, agence immobilière à Chasseneuil-sur-Bonnieure (SIREN 452784085, [societe.com](https://www.societe.com/societe/tour-de-clefs-immobilier-452784085.html)) ;
  - « Un tour de clef », agence immobilière à Castelnaudary ([untourdeclef.com](https://www.untourdeclef.com/)) ;
  - « Le Tour de Clé », serrurier (SIREN 901019877, [Facebook](https://www.facebook.com/letourdecle/)) ;
  - « Un tour de clé », garage (SIREN 992707349).
- **Sens** : « donner un tour de clé » veut dire **verrouiller** ([Wiktionnaire](https://fr.wiktionary.org/wiki/donner_un_tour_de_cl%C3%A9)), une image de fermeture plutôt que d'ouverture.

### À l'échelle (`alechelle`)
- **Marque identique en classe 42** : « A l'échelle », FR 5034004, déposée le 27/02/2024 et enregistrée ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/FR500000005034004)).
- S'y ajoute « l'échelle START-UP STUDIO » (FR 4810539, classes 35/36/38/41/42).
- **Éliminé** : risque juridique élevé.

### Visite neuve (`visiteneuve`)
- **Marques et sociétés** : aucune.
- **Risque** : le nom **décrit** le service (visite de logements neufs). L'INPI peut le refuser pour défaut de distinctivité, ou la marque serait faible et difficile à défendre (mon analyse, pas un avis juridique). Il se prête aussi mal aux extensions (plan 2D, photos, aménagement).

### Chez Demain (`chezdemain`)
- **Marques** :
  - « Demain chez vous », FR 4323437, **classes 35/36/37/42**, enregistrée, APPLICATION CONTACTS SAS ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004323437)) ;
  - « Chez Moi Demain », FR 4185752 (classes 36/38/42), expirée ;
  - « Naturellement chez soi, le logement de demain by Icade », FR 4737307 (classes 35/36/37/42).
- **Sociétés** : CHEZ MOI DEMAIN, active, NAF 71.12B, ingénierie et études techniques, c'est-à-dire un secteur voisin (SIREN 849111596, [fiche](https://annuaire-entreprises.data.gouv.fr/entreprise/849111596)).
- **Risque** : modéré à élevé.

### Lumeplan (`lumeplan`)
- **Marques** : **LUMIPLAN**, marque de l'Union européenne 012832127 et internationale WO 1464154, **classes 9, 35 et 42** entre autres ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/EM500000012832127)). Son titulaire est un groupe français d'affichage dynamique créé en 1972 ([Wikipédia](https://fr.wikipedia.org/wiki/Lumiplan), [lumiplan.com](https://www.lumiplan.com/en/)). Une seule lettre d'écart, même prononciation ou presque.
- S'y ajoutent LUCEPLAN, éclairage italien (WO 681915, classe 11, [luceplan.com](https://www.luceplan.com/products/)), et « Lumeplan móveis planejados », fabricant brésilien de meubles ([Instagram](https://www.instagram.com/lumeplan_moveis_planejados/)).
- **Éliminé.**

### Entremurs (`entremurs`)
- **Marques** : « ENTREMURS UNE AUTRE IDEE DES TRAVAUX », FR 4255742, classes 19/27/37 ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004255742)).
- **Sociétés** : ENTREMURS, travaux d'isolation (SIREN 819280900), et SCI ENTREMURS (SIREN 488432295).
- **Risque** : même univers, le bâtiment. Modéré.

### Imposte (`imposte`, .fr seulement)
- **Domaine** : .com pris.
- **Marques** : plusieurs « Imposter » en classe 9 (jeux, Cosmicode, WO 1888260).
- **Sens** : à l'oral, le mot sonne comme « impôt », « imposer », « imposteur ». Mauvais pour la confiance.
- **Éliminé.**

### Autres noms écartés après vérification
- **Déjà chez soi / Déjà chez moi** : marque « Déjà chez soi », FR 4500908, **classe 36**, MK HABITAT SAS, enregistrée ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004500908)).
- **Chez bientôt** : « BIENTOT CHEZ SOI » est l'enseigne de JULATIS SAS, une société de conseil informatique (NAF 62.02A, SIREN 808177331).
- **Porte ouverte** : nom générique, avec une quarantaine de marques. « LA PORTE OUVERTE » (FR 1575534, classes 16/42) est enregistrée.
- **Plan ouvert** : descriptif (« plan ouvert » veut dire espace décloisonné) et source de confusion.

**Contexte concurrentiel utile au choix** : les promoteurs communiquent déjà sur la « 3D » et l'« immersif ». Cogedim, par exemple, propose « CogeHome 3D » avec des logements meublés et décorés ([cogedim.com](https://www.cogedim.com/visites-immersives-de-nos-residences-appartements-et-maisons.html)). Un nom en « 3D », « visio » ou « immersif » se perdrait dans ce bruit, ce qui plaide pour un nom qui parle de la décision (juger, les clés) plutôt que de la technique.

---

## 4. Notation des finalistes

Notes de 1 (faible) à 5 (fort). Pour le **risque juridique, 5 veut dire risque faible**. Un nom dont la présence web n'a pas pu être vérifiée plafonne à 4 sur ce critère.

| Critère | Sur Pièce | Avant-Clés | Clés en vue | Tour de clé | Planvif | À l'échelle | Visite neuve | Chez Demain | Lumeplan | Entremurs |
|---|---|---|---|---|---|---|---|---|---|---|
| Évocation (voir chez soi avant que ça existe) | 5 | 5 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | 3 |
| Confiance | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 3 | 3 | 3 |
| Cohérence avec la DA | 5 | 3 | 3 | 3 | 4 | 5 | 3 | 2 | 4 | 3 |
| Prononçable, mémorisable à l'oral | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 5 | 3 | 4 |
| Neutralité pour la marque blanche | 4 | 3 | 4 | 4 | 5 | 4 | 3 | 3 | 4 | 3 |
| Extensibilité (meublé, aménagement, résidence) | 5 | 4 | 4 | 4 | 4 | 4 | 2 | 3 | 4 | 3 |
| Domaines libres | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 |
| Risque juridique (5 = faible) | 4 | 4 | 4 | 3 | 4 | 1 | 2 | 2 | 1 | 2 |
| **Total sur 40** | **36** | **32** | **32** | **32** | **32** | 29 | 28 | 27 | 27 | 26 |

Justification des notes qui départagent :
- **Sur Pièce, domaines 4 et non 5** : le pluriel est détenu par un tiers.
- **Avant-Clés, DA 3 et marque blanche 3** : le nom parle au particulier (la remise des clés) plus qu'à l'architecte, et il sonne comme une promesse grand public sur le site d'un promoteur.
- **Tour de clé, risque 3** : marque Hermès en classe 18, deux agences immobilières et un serrurier au nom quasi identique.
- **Planvif, évocation 3 et confiance 3** : le nom est net et court, mais il ne dit ni « chez soi » ni « avant ».
- **Égalité à 32** : je départage par évocation + confiance. Avant-Clés fait 9 ; Clés en vue et Tour de clé font 8 ; Planvif fait 6. Entre Clés en vue et Tour de clé, le risque juridique plus faible place Clés en vue devant.

---

## 5. Top 5

| Rang | Nom | Domaine principal | Slogan proposé | Pour qui il marche le mieux |
|---|---|---|---|---|
| 1 | **Sur Pièce** | surpiece.fr | « Achetez sur plan, jugez sur pièce. » | Tous les publics. Version pros : « Vos acquéreurs jugent sur pièce, avant la première pierre. » |
| 2 | **Avant-Clés** | avantcles.fr | « Entrez chez vous avant la remise des clés. » | Particuliers, et promoteurs dans leur parcours client |
| 3 | **Clés en vue** | clesenvue.fr | « Votre futur logement, déjà en vue. » | Particuliers et conseillers |
| 4 | **Tour de clé** | tourdecle.fr | « Faites le tour de chez vous avant les clés. » | Particuliers (conflits à lever d'abord) |
| 5 | **Planvif** | planvif.fr | « Le plan prend vie. » | Pros et marque blanche : le plus neutre, le moins chaleureux |

---

## 6. Recommandation

**Choisir « Sur Pièce ».** Il est le seul nom qui coche à la fois le côté sympathique (une expression que tout le monde connaît), la confiance (juger sur preuve), la DA d'architecte (la pièce, les pièces du dossier) et la neutralité B2B. Aucun conflit n'a été trouvé dans les registres consultés.

Mise en œuvre proposée :
- **Graphie.**
  - « Sur Pièce » en texte courant ;
  - « SUR PIÈCE » dans le logo, en Archivo à chasse large et graisse moyenne, dans un cartouche rectangulaire à trait de 1,5 px, avec le È en bleu plan #2C49B8 ;
  - ligne de légende en DM Mono façon cartouche : « PLAN · VISITE · ÉCH. 1:50 ».
  - Domaine et identifiants de comptes : `surpiece`.
- **Gamme** (des mots simples accolés au nom, pas des sous-marques à déposer) :
  - particuliers : **Sur Pièce** ;
  - conseillers : **Sur Pièce Pro** ;
  - promoteurs : **Sur Pièce Programme**, avec la visite de résidence sous le nom **Sur Pièce Résidence** ;
  - options : « meublé », « aménagé ».
- **Marque blanche** : la visite porte la marque du client. La mention « Visite réalisée avec Sur Pièce » est discrète et peut être retirée contre paiement. Comme le nom est une expression française, il ne jure pas à côté de la marque d'un promoteur.
- **Plan B** si la vérification manuelle (INPI, Google) révèle un conflit : **Avant-Clés**.

---

## 7. Sécuriser le nom

À faire dans cet ordre, **avant toute communication publique** : sur une marque, c'est la date de dépôt qui compte.

1. **Domaines, tout de suite** (quelques euros à quelques dizaines d'euros par an chacun, selon le registrar ; prix non vérifiés) :
   - indispensables : `surpiece.fr`, `surpiece.com`, `sur-piece.fr`, `sur-piece.com` ;
   - conseillés : `surpiece.eu`, `surpiece.app` ;
   - optionnels : `surpiece.immo` (vérifier au panier qu'il n'est pas vendu en « premium »), `surpiece.io`.

   Rediriger toutes les variantes vers `surpiece.fr`. Pour `surpieces.fr` et `surpieces.com`, vérifier qu'ils ne sont pas à vous. Sinon, les surveiller, et éventuellement faire une offre via le formulaire de contact du titulaire chez Gandi. Un .fr peut ensuite être contesté par la procédure SYRELI de l'AFNIC en cas de mauvaise foi ; les conditions n'ont pas été vérifiées ici.
2. **Recherche d'antériorité manuelle** :
   - [data.inpi.fr](https://data.inpi.fr), sur « sur pièce », « surpièce », « surpieces » et les formes proches, identiques et phonétiques ;
   - TMview et [EUIPO eSearch plus](https://euipo.europa.eu/eSearch/) ;
   - recherche Google sur « Sur Pièce » associé à « visite », « plan », « immobilier » et « application ».

   Ces vérifications n'ont pas pu être faites automatiquement ici (§1).
3. **Dépôt INPI** (marque française), en ligne sur [procedures.inpi.fr](https://procedures.inpi.fr), d'une marque verbale « SUR PIÈCE ». Déposer en plus le logo quand il sera figé.
   - **Classe 9** : logiciels et applications téléchargeables ; logiciels de modélisation 3D, de plans et de visite virtuelle.
   - **Classe 35** : publicité et promotion des ventes pour des tiers ; aide à la commercialisation de biens immobiliers ; mise à disposition d'espaces de présentation en ligne.
   - **Classe 42** : logiciel en tant que service (SaaS) ; modélisation 3D et conception de visites virtuelles ; conception de plans et d'aménagement intérieur (architecture d'intérieur et décoration, pour les futures options) ; hébergement de contenus numériques ; services en marque blanche.
   - **Classe 36, optionnelle** : services d'information en matière immobilière. C'est la classe où se trouvent la plupart des marques immobilières voisines. La couvrir protège la case des conseillers et des promoteurs.
   - Formuler les libellés avec [TMclass](https://euipo.europa.eu/ec2/) pour éviter les refus.
   - Tarif connu : 190 € pour une classe, puis 40 € par classe supplémentaire, soit 270 € pour les classes 9, 35 et 42 et 310 € avec la 36. **Non revérifié le 27/09/2026** : la [page INPI du dépôt de marque](https://www.inpi.fr/realiser-demarches/propriete-intellectuelle/depot-de-marque) n'affiche pas les montants sans JavaScript.
   - Délai connu : publication au BOPI, puis deux mois ouverts aux oppositions de tiers. Non revérifié.
4. **Extension à l'Union européenne (EUIPO)**, seulement si une clientèle belge ou luxembourgeoise est visée. Le délai de priorité de la Convention de Paris permet de déposer dans les **6 mois** suivant le dépôt INPI en gardant sa date (article 4 ; non revérifié). Tarif connu : 850 € pour la première classe, 50 € pour la deuxième, 150 € par classe à partir de la troisième. **Non revérifié** : la page tarifs de l'EUIPO a renvoyé 403 ou 404.
5. **Comptes sur les réseaux** : `@surpiece` sur Instagram, LinkedIn (page entreprise « Sur Pièce »), TikTok, YouTube, Facebook, X et Pinterest (utile plus tard pour l'aménagement et la décoration). Prévoir `@surpiece.fr` ou `@surpiece_app` en repli. Seul GitHub a pu être vérifié : `github.com/surpiece` est libre (404). Les autres réseaux demandent une connexion, disponibilité **non vérifiée**.
6. **Société** : prendre « Sur Pièce » comme nom commercial, voire comme dénomination sociale, à la création. Aucune société ne porte ce nom aujourd'hui dans l'Annuaire des entreprises. On peut déposer la marque en nom propre et la céder ensuite à la société ; la cession s'inscrit à l'INPI.
7. **Surveillance** : créer une alerte sur « surpiece » et « sur pièce » dans TMview (gratuit avec un compte) pendant la période d'opposition.
8. **Dans le dépôt** : remplacer le titre « Plan en visite 3D » de `pipeline/accueil.html` une fois la marque déposée. Je ne l'ai pas modifié : un autre agent travaille sur `pipeline/`.

---

## 8. Sources

- Registre .fr : whois AFNIC (`whois.nic.fr`) et [RDAP AFNIC](https://rdap.nic.fr/), consultés le 27/09/2026.
- Registre .com : whois Verisign (`whois.verisign-grs.com`).
- RDAP .immo, .io et .app : [amorçage IANA](https://data.iana.org/rdap/dns.json), `rdap.identitydigital.services`, `pubapi.registry.google`.
- Registre .eu : whois EURid (`whois.eu`).
- Marques : [TMview](https://www.tmdn.org/tmview/), offices FR, EM et WO (API `api/search/results`).
  - [FR 4936664 TOUR DE CLES](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004936664)
  - [FR 5034004 A l'échelle](https://www.tmdn.org/tmview/#/tmview/detail/FR500000005034004)
  - [FR 4323437 Demain chez vous](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004323437)
  - [EM 012832127 LUMIPLAN](https://www.tmdn.org/tmview/#/tmview/detail/EM500000012832127)
  - [FR 4255742 ENTREMURS](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004255742)
  - [FR 4500908 Déjà chez soi](https://www.tmdn.org/tmview/#/tmview/detail/FR500000004500908)
- Sociétés : [Annuaire des entreprises](https://annuaire-entreprises.data.gouv.fr), API `recherche-entreprises.api.gouv.fr`.
- « Juger sur pièce » dans l'ancien : [MAIF, neuf ou ancien](https://www.maif.fr/habitation/guide-achat-immobilier/choisir-neuf-ou-ancien).
- Définitions : [Wiktionnaire, juger sur pièce](https://fr.wiktionary.org/wiki/juger_sur_pi%C3%A8ce), [Wiktionnaire, donner un tour de clé](https://fr.wiktionary.org/wiki/donner_un_tour_de_cl%C3%A9).
- Livraison VEFA : [Service Public, F2956](https://www.service-public.gouv.fr/particuliers/vosdroits/F2956).
- Homonymes et concurrents :
  - [untourdeclef.com](https://www.untourdeclef.com/)
  - [Tour de Clefs Immobilier (societe.com)](https://www.societe.com/societe/tour-de-clefs-immobilier-452784085.html)
  - [Le Tour de Clé, serrurier](https://www.facebook.com/letourdecle/)
  - [Lumiplan (Wikipédia)](https://fr.wikipedia.org/wiki/Lumiplan)
  - [Luceplan](https://www.luceplan.com/products/)
  - [piecesurpiece.com](https://piecesurpiece.com/)
  - [Cogedim, CogeHome 3D](https://www.cogedim.com/visites-immersives-de-nos-residences-appartements-et-maisons.html)
- Non revérifiés ce jour : tarifs INPI et EUIPO, délai d'opposition, délai de priorité de la Convention de Paris, disponibilité des comptes sur les réseaux sociaux (hors GitHub), présence web d'Avant-Clés, de Clés en vue, de Planvif et de Visite neuve.
