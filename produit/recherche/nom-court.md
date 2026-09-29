# Nom court

Recherche du 29/09/2026, vérifications de domaines terminées à 10 h 25 (UTC). Elle suit `nom.md` et `nom-international.md`. L'utilisateur y a rejeté Sur Pièce, Avant-Clés, Dejavisit, Forewalk, Planporta, Prewalk et Soonkeys : trop descriptifs, ou mots anglais. Il cherche maintenant un nom **court et inventé, façon appli**, dans l'esprit de Domvu ou Casavu. En cours de recherche, il a élargi la demande à **deux familles**, présentées séparément ici :

- **A.** des mots inventés de toute pièce ;
- **B.** de vrais jeux de mots, simples et faciles à retenir, si possible compris en français et en anglais.

Les disponibilités de domaines changent d'une heure à l'autre. Chaque fait externe renvoie à une source (§6). « Non vérifié » signale ce que je n'ai pas pu confirmer.

---

## 0. En bref

**Recommandation : Vizavu** (famille B, se dit « vis-à-vu »).

- **L'idée.** « Vis-à-vis » veut dire « face à face ». Le mot existe tel quel en anglais. Ici, l'acheteur se retrouve face à face avec un appartement qui n'existe pas encore, et le « vu » final dit qu'il l'a déjà vu. Six lettres, trois syllabes ouvertes, aucun accent, et ça s'écrit comme ça se prononce.
- **Domaines.** `.com`, `.fr`, `.app`, `.io` et `.co` sont tous libres. Attention : `visavu.com`, avec un s, a été enregistré le 11/05/2026 chez GoDaddy et renvoie une erreur 404. Un utilisateur qui écrit le nom avec un s tombera donc ailleurs.
- **Marques.** J'ai cherché dans EUIPO eSearch (marques de l'UE et enregistrements internationaux qui visent l'UE). Aucun résultat pour « vizavu », « visavu », « vizavue » ni « vis a vu ». La famille « vis-à-vis » a en revanche des marques vivantes : VISAVIS (classes 9, 35, 38, 45), MAISON VISAVIS (classes 16, 35, 36, 41, 43) et VIS-A-VIS (classes 20, 35). Je n'ai pas pu interroger TMview, et donc ni l'INPI ni l'OMPI (§1).
- **Recherche web.** Aucun homonyme trouvé.

**Top 5 de la famille A (inventés)** : Kazvia, Loftvu, Domavu, Nidvu, Arkvu. Leur `.com`, `.fr`, `.app`, `.io` et `.co` sont libres.
**Top 5 de la famille B (jeux de mots)** : Vizavu, Plan avec vue (version anglaise Plan with a View), Voilavu, Tour de clé, Home Sweet Plan. Toutes leurs extensions sont libres aussi.

| # | Nom | Famille | Note /30 | Risque principal |
|---|---|---|---:|---|
| 1 | **Vizavu** | B | 27 | `visavu.com` pris ; marques « VISAVIS » en classes 35 et 36 |
| 2 | **Kazvia** | A | 25 | évocation moins directe (casa + via) |
| 3 | **Loftvu** | A | 25 | « loft » évoque l'ancien réhabilité, pas le neuf |
| 4 | **Domavu** | A | 25 | boutique en ligne allemande domavu.de |
| 5 | **Plan avec vue** | B | 25 | nom long (11 lettres), deux versions à gérer |
| 6 | **Voilavu** | B | 24 | plus de 80 marques « VOILA » dans l'UE, dont en classes 35, 36 et 42 |
| 7 | **Nidvu** | A | 24 | « nid » n'est pas compris en anglais |
| 8 | **Tour de clé** | B | 24 | idiome français, accent, peu « appli » |

**Écartés au dernier tour, malgré un bon son :**
- **Chezvu** : `chezvu.com` est pris depuis 2020, et ChezVuDecor est un compte de décoration d'appartements parisiens suivi par 85 000 personnes sur Instagram ;
- **Domazu** : il est à une lettre de Domaza, une plateforme immobilière internationale ;
- **Home Sweet Plan** : trop proche de Sweet Home 3D, un logiciel de plans en 3D.

**Constat.** J'ai testé 704 noms (720 requêtes `.com`). Parmi les noms testés, aucun nom de 4 lettres n'a son `.com` libre, ni aucun nom en consonne + voyelle + consonne + voyelle (Kivo, Vumo, Kazu, Plazo). Les rares `.com` libres de 5 à 7 lettres ont presque tous la même forme : une racine, puis « vu », « zu » ou « via » (arkvu, nidvu, loftvu, domavu, kazvia, vizavu). Cette forme est donc la seule piste pour un nom court avec son `.com`, dans le budget.

---

## 1. Méthode

1. **Génération.** 704 noms au total :
   - **famille A** : 587 inventés, répartis en 26 angles. Ce sont des racines d'habitat, de pièce, de vision, de plan ou de clé (dom, casa/kaz, nid, lum, pla, klev, porta, hab, oikos, dar, loft, lot, zimmer, mez…), combinées avec des lettres rares (k, z, x, y), des doubles voyelles et les terminaisons -o, -a, -u, -vu, -zu, -via, -ly, -io, -ify, -oo, -ea ;
   - **famille B** : 117 jeux de mots en 21 mécaniques (expressions connues détournées, rimes, doubles sens plan/maison/clé/visite, références culturelles, onomatopées).

   Je n'ai pas retesté les noms que l'utilisateur avait déjà vérifiés, ni ceux déjà présents dans `nom.md` et `nom-international.md`. La troisième vague, générée par script, en a retesté 16 par erreur : les 16 résultats sont identiques à la première passe, ce qui sert de contrôle.
2. **`.com` en masse** : `whois -h whois.verisign-grs.com X.com`. « No match for » veut dire libre ; une réponse avec « Domain Name: » veut dire pris ; tout autre cas est compté comme « erreur ». Pause de 0,3 s entre les requêtes. Résultat : 720 requêtes, **0 erreur**. J'ai revérifié les 13 finalistes à 10 h 25 UTC.
3. **Autres extensions** pour les finalistes et les meilleurs jeux de mots dont le `.com` est pris. Contrôle préalable : `google` sort « pris » partout, et une chaîne aléatoire sort « libre » partout.
   - `.fr` : `whois.nic.fr`, « NOT FOUND » ;
   - `.app` : RDAP de Google Registry, 404 ;
   - `.io` : `whois.nic.io`, « not found » ;
   - `.co` : `whois.registry.co`, « not found ».

   Un nom non enregistré peut quand même être classé « premium » par le registre. **Le prix réel reste à vérifier au panier.**
4. **`.com` pris des jeux de mots les plus forts** : j'ai relevé la date de création (whois) et le titre de la page d'accueil.
5. **Marques.**
   - **TMview est inaccessible aujourd'hui.** L'API `https://www.tmdn.org/tmview/api/search/results` et même la page d'accueil renvoient vers `https://www.tmdn.org/error/revise.html`. C'est un défi JavaScript du pare-feu F5 (en-tête `Server: BigIP`). Le blocage vaut pour curl comme pour Python, avec ou sans cookies, et je l'ai revérifié trois fois.
   - **Solution de repli : EUIPO eSearch plus.** J'ai utilisé l'API interne du site (`POST https://euipo.europa.eu/copla/ctmsearch/json`, critère `MarkVerbalElementText`, condition `CONTAINS`). Elle couvre les **marques de l'UE (EM)** et les **enregistrements internationaux qui désignent l'UE**. Contrôle : MATTERPORT remonte bien (EUTM 012087409, classes 9, 35 et 42, plus trois enregistrements internationaux).
   - **Pas couvert** : les marques **françaises (INPI)** et les enregistrements internationaux qui ne visent pas l'UE. data.inpi.fr répond 403, et la WIPO Global Brand Database impose un captcha (Altcha) et un jeton d'API. **C'est à faire à la main (§5).**
   - Pour chaque finaliste, j'ai cherché le nom exact, puis trois à cinq variantes : orthographe voisine, mots séparés, avec ou sans « e » final. J'ai gardé les marques vivantes en classes 9, 35, 36 ou 42.
6. **Homonymes** : une recherche web par finaliste (moteur américain), plus les pages des `.com` pris.
7. **Notation** : six critères notés de 1 à 5, total sur 30 :
   - sonorité ;
   - mémorisation ;
   - international (prononciation et sens dans les langues visées) ;
   - évocation ;
   - domaines ;
   - risque (5 = aucun conflit trouvé).

   Les sens gênants sont vérifiés d'après mes connaissances, pas auprès de locuteurs natifs : **non vérifié** pour l'arabe en particulier.

---

## 2. Candidats testés

### 2.1 Disponibilité du `.com` (Verisign, 29/09/2026)

704 noms, dont 122 `.com` libres (en gras) : 96 dans la famille A et 26 dans la famille B.

#### Famille A — mots inventés

| Angle | Testés | `.com` libres | `.com` pris |
|---|---:|---|---|
| hab- / dwell / loge | 19 | **dwelvu**, **lojvu** | abiko, abivu, abizo, dwella, dwelo, dwelzo, habiko, habka, hably, haboo, habvia, habvu, habyo, habzo, logio, logvu, lojo |
| sonorités pures (k, z, x, y, doubles lettres) | 40 | — | alvu, avvu, elvu, evvu, ivvo, kavo, kavu, kivvu, kovu, kuvo, kyvo, laxo, lixo, luxvu, novio, novu, novza, novzo, olvo, olvu, ovvu, vexo, vokka, voky, voxo, vuxo, xavo, xavu, yavo, yavu, yevo, yuzo, zavo, zavu, zeevu, zevo, zevvo, zivo, zoovu, zuvo |
| arch- / ark- | 9 | **arkvu** | arkea, arkeo, arkiko, arkly, arkoo, arkvia, arkyo, arkzo |
| suffixes -ify, -ly, -io | 10 | — | casaly, casify, domify, keyify, lumio, nidio, plandly, planify, roomify, vizify |
| cote (plan coté) | 5 | **cotvu**, **kotvu** | cotzo, kotyo, kotzo |
| cube / volume / dimension | 14 | **kubvu** | dimka, dimvu, dimzo, kubea, kubio, kubly, kubo, kubzo, voloo, volvu, voly, volya, volzo |
| dom- (maison) | 28 | **domazu** | domaxo, domeka, domeya, domiko, domiku, domixo, domiza, domka, domkai, domkee, domko, domlee, domlio, domly, domoo, domoza, domsy, domuzo, domvi, domvia, domvo, domya, domyo, domyx, domzi, domzo, domzy |
| terminaisons -ea, -oo, -ee | 10 | **nidzee** | domea, domzoo, dooroo, kazea, lumea, plazea, plazoo, roomoo, rumea |
| porta / door | 16 | — | doorly, doorvu, doorzo, dorako, dorio, dorvia, dorvu, dorzo, porteo, portly, portoo, portvu, portyo, portzo, porvu, porzo |
| entrer / intra | 8 | **entvu** | entrezo, entvo, entzo, intravo, intravu, introo, intzo |
| espace / spazio | 9 | **espavu**, **spaziko** | spaco, spakko, spavu, spaze, spazly, spazo, spazu |
| home / oikos | 15 | **hoomvu**, **oikvu**, **oikzo**, **oykvu** | homeo, homka, homly, homvia, homvu, homyo, homzo, hoomo, hozo, oiky, oyko |
| room / pièce / stanza | 18 | — | kamvu, kamzo, pyezo, roomea, roomeo, roomka, roomly, roomvi, roomvu, roomzu, rumo, rumvu, rumyo, rumza, stanka, stanvu, stanyo, stanzo |
| key / clé / clav- | 26 | — | keeva, keevu, keezo, keyla, keylo, keyoo, keyvo, keyzo, keyzu, kiveo, kivvo, kiyo, klavia, klavo, klavu, klavy, klayo, kleeo, kleeva, klevia, klevo, klevu, klevy, kleya, kleyo, klezo |
| lum- (lumière) | 17 | — | lumeo, lumika, lumiko, lumiya, lumka, lumly, lumoo, lumvi, lumvu, lumya, lumza, lumzo, lumzy, luvia, luvo, luzka, luzo |
| maquette | 5 | **makvu** | maketa, maketo, makvo, makzo |
| nid / nest | 15 | **nidvu** | nesko, nestly, nestoo, nestvu, nestzo, nidea, nidiko, nidka, nidly, nidoo, nidova, nidvo, nidyo, nidzo |
| pla- / plan- | 28 | — | plakko, plako, plaku, planeka, planika, planko, planly, planoo, planvo, planvy, planyo, planzo, planzu, plaoo, plavia, plavio, plavo, plavu, plavy, plaxy, plaza, plazi, plazo, plazu, plazy, pleko, plizo, plozo |
| vu / viz- (voir) | 33 | — | veyo, viska, visko, visoo, viyo, vizdo, vizea, vizeo, vizka, vizko, vizly, vizmo, vizoo, vizu, vizvu, vizy, vuedo, vueko, vueza, vuka, vuko, vuly, vumo, vuvio, vuvo, vuvu, vuyo, vuza, vuzi, vuzo, vuzy, vyka, vyzo |
| racine + vu (vague 2 : lot, loft, haus, heim, bayt…) | 31 | **lotvu**, **loftvu**, **kodvu**, **hausvu**, **hofvu**, **sejvu**, **heimvu**, **eccovu**, **baytvu**, **nidavu**, **domavu** | tekvu, celvu, mazvu, vilvu, kayvu, darvu, mezvu, patvu, balvu, hemvu, jiavu, odavu, salavu, zimvu, okovu, locvu, lokvu, kotivu, terravu, lumavu |
| dar (maison en arabe) | 7 | — | darzo, darko, daryo, darly, darea, daroo, darvia |
| « maison » dans d'autres langues (hem, ev, jia, oda, zimmer…) | 15 | — | hemzo, hemly, hemio, evzo, jiazo, bayto, odazo, zimzo, zimo, zimka, zimly, okozo, lokzo, lokaa, salzo |
| sonorités pures (vague 2) | 37 | **dozvu** | zumvi, kivza, voxi, yumvi, zolvu, kazmi, vumzi, plumi, luzvo, vizmi, kovza, zimvo, myvu, yovu, kyzo, vyko, zyvo, xivu, vooma, zooka, kooza, vooza, dooza, plooza, loova, kaavu, vaako, vuumi, vuuzo, plaavo, kooma, dooma, dooka, zovu, zivu, hivu |
| combinaisons racine + a/i + vu/zu/via/vo/zo (vague 3) | 171 | **kazizu**, **kazivia**, **nidazu**, **nidivu**, **nidizu**, **nidivia**, **nidizo**, **nidvia**, **lumazu**, **plaivu**, **plaivia**, **kleavu**, **kleazu**, **kleavia**, **kleazo**, **kleivu**, **kleizu**, **kleivia**, **rumavu**, **rumazu**, **rumavia**, **rumivu**, **rumizu**, **rumivia**, **vizavu**, **vizazu**, **vizazo**, **vizizu**, **vizizo**, **arkivu**, **arkizu**, **darivu**, **darizu**, **loftavu**, **loftazu**, **loftavia**, **loftavo**, **loftazo**, **loftivu**, **loftizu**, **loftivia**, **lotavu**, **lotazu**, **lotivu**, **lotizu**, **zimazu**, **zimivu**, **zimivia**, **habavu**, **habazu**, **habavia**, **habavo**, **habivu**, **mezavu**, **mezazu**, **mezavia**, **mezivu**, **mezizu**, **mezivia**, **mezizo**, **mezvia**, **vilazu**, **vilivu**, **vilizu**, **kasazu**, **kasizu**, **kasivia** | domavia, domavo, domazo, domivu, domizu, domivia, domivo, domizo, kazavu, kazazu, kazavia, kazavo, kazazo, kazivu, kazivo, kazizo, nidavia, nidavo, nidazo, nidivo, lumavia, lumavo, lumazo, lumivu, lumizu, lumivia, lumivo, lumizo, lumvia, plaizu, plaivo, plaizo, kleavo, kleivo, kleizo, rumavo, rumazo, rumivo, rumizo, rumvia, vizavia, vizavo, vizivu, vizivia, vizivo, vizvia, arkavu, arkazu, arkavia, arkavo, arkazo, arkivia, arkivo, arkizo, daravu, darazu, daravia, daravo, darazo, darivia, darivo, darizo, loftivo, loftizo, loftvia, lotavia, lotavo, lotazo, lotivia, lotivo, lotizo, lotvia, zimavu, zimavia, zimavo, zimazo, zimizu, zimivo, zimizo, zimvia, habazo, habizu, habivia, habivo, habizo, mezavo, mezazo, mezivo, vilavu, vilavia, vilavo, vilazo, vilivia, vilivo, vilizo, vilvia, kasavu, kasavia, kasavo, kasazo, kasivu, kasivo, kasizo, kasvia |
| variante domavue | 1 | — | domavue |

#### Famille B — jeux de mots

| Mécanique | Testés | `.com` libres | `.com` pris |
|---|---:|---|---|
| appartement témoin | 3 | **appartemoin**, **montemoin** | temoin |
| vocabulaire du cinéma (plan-séquence, gros plan…) | 5 | — | arriereplan, grosplan, planlarge, plansequence, premierplan |
| avant-première | 2 | — | avantpremiere, premierevisite |
| bien vu ! | 2 | — | bienvu, bienvue |
| blueprint → bleu (charte) | 3 | — | bleuplan, bleuprint, bleuprints |
| casa / kaz- (maison) | 22 | **kazvia** | casiko, casoo, casvu, kaseo, kasoo, kasvu, kasyo, kazee, kazeo, kazio, kazka, kazlo, kazly, kazmo, kazoa, kazoo, kazvi, kazvo, kazvu, kazy, kazyo |
| « Chambre avec vue / A Room with a View » | 4 | **planavecvue**, **planwithaview** | chambreavecvue, roomwithaview |
| chez-vous → chez vu | 5 | **chezmoiplan** | chezsoi, chezvoo, chezvu, chezvue |
| clé de voûte → clé de vue ; clic/clé | 6 | **cledevue**, **clefdevue**, **clicles** | cleclic, clickey, clickles |
| toc toc, dring, tadam | 8 | **tadamplan**, **toctocplan** | dring, dringdring, tadaam, tadam, toctoc, toktok |
| planète, plan B, Home sweet home | 5 | **homesweetplan** | planbee, planmagic, plannet, plantastic |
| hop ! | 5 | **hopchez**, **hopvisit** | hopinside, hopplan, planhop |
| off-plan / sur plan | 3 | — | offplanner, planmyplan, surplan |
| plan + panorama | 4 | **plannorama** | panoplan, planarama, planorama |
| rendez-vous → rendez-vu | 3 | — | rendevu, rendezvu, rendezvue |
| Sésame, ouvre-toi | 4 | **sesamplan** | sesamo, sezam, sezamo |
| prévu / vu d'avance | 3 | **vudavance** | toutprevu, toutvu |
| villa + vue | 3 | — | villavista, villavu, villavue |
| vis-à-vis → visavu | 2 | — | visavu, visavue |
| voilà | 4 | **voilavilla**, **voilavu**, **voillaplan** | voilla |
| divers (tour de clé, pied-à-terre…) | 14 | **tourdecle**, **piedavue**, **pleinplan**, **pieceavue** | roomzoom, dreamplan, planmoi, miseenplan, dejala, vudici, cineplan, sweetplan, chezkey, keyzoom |
| variantes vis-à-vis / voilà / entrevu / aperçu | 7 | **vizavue**, **voilavue** | entrevu, apercu, vizavi, vizavee, pourvu |

### 2.2 Autres extensions

« pris » veut dire enregistré. Pour `.fr`, `.io` et `.co`, toute réponse autre que « non trouvé » compterait comme « pris », par prudence ; aucun cas ambigu ne s'est présenté.

| Nom | .com | .fr | .app | .io | .co | Note sur le `.com` |
|---|---|---|---|---|---|---|
| **vizavu** | libre | libre | libre | libre | libre | — |
| **kazvia** | libre | libre | libre | libre | libre | — |
| **loftvu** | libre | libre | libre | libre | libre | — |
| **domavu** | libre | libre | libre | libre | libre | — |
| **nidvu** | libre | libre | libre | libre | libre | — |
| **arkvu** | libre | libre | libre | libre | libre | — |
| **voilavu** | libre | libre | libre | libre | libre | `voilavue.com` libre aussi |
| **planavecvue** | libre | libre | libre | libre | libre | — |
| **planwithaview** | libre | libre | libre | libre | libre | — |
| **tourdecle** | libre | libre | libre | libre | libre | — |
| **homesweetplan** | libre | libre | libre | libre | libre | — |
| domazu | libre | libre | libre | libre | libre | — |
| nidavu | libre | libre | libre | libre | libre | — |
| lumazu | libre | libre | libre | libre | libre | — |
| zimazu | libre | libre | libre | libre | libre | — |
| espavu | libre | libre | libre | libre | libre | — |
| cledevue | libre | libre | libre | libre | libre | `clefdevue` : idem |
| toctocplan | libre | libre | libre | libre | libre | — |
| montemoin | libre | libre | libre | libre | libre | — |
| sesamplan | libre | libre | libre | libre | libre | — |
| pieceavue | libre | libre | libre | libre | libre | — |
| chezvu | pris | libre | libre | libre | libre | créé le 01/10/2020 chez GoDaddy, expire en 2030, page vide |
| visavu | pris | libre | libre | libre | libre | créé le 11/05/2026 chez GoDaddy, réponse 404 |
| planhop | pris | libre | libre | libre | libre | créé en 2016, page « Coming Soon » |
| rendezvu | pris | libre | pris | libre | pris | créé en 2004, page « This domain may be for sale » (prix non affiché) |
| voilla | pris | pris | libre | libre | libre | à vendre, « offres sous 1 000 $ généralement pas considérées » (hors budget probable) |
| bleuprint | pris | libre | libre | pris | pris | créé en 2005, page vide |
| bienvu | pris | pris | pris | libre | pris | — |
| planorama | pris | pris | pris | pris | pris | — |
| toctoc | pris | pris | pris | pris | pris | — |

---

## 3. Les 12 finalistes

Six par famille. Les domaines ont tous été vérifiés le 29/09/2026 (`.com` revérifié à 10 h 25 UTC). Pour les marques, « EUIPO » signifie une recherche dans les marques de l'UE et les enregistrements internationaux qui visent l'UE. **L'INPI et l'OMPI hors UE ne sont pas vérifiés** (§1).

Remarque commune aux noms en « -vu » : un Français dit [vy], un anglophone dira « voo ». L'écart est le même que pour Domvu, l'exemple donné par l'utilisateur, et le nom reste reconnaissable. Pour la même raison, « Vizavu » se dira « vi-za-vu » en France et « vee-zah-voo » à Londres.

### Famille A — inventés

#### A1. Kazvia — 25/30
- **Prononciation** : FR « kaz-via » ; EN « kaz-VEE-uh ». Deux syllabes et demie, et aucune lettre muette.
- **Sens** : *kaz* rappelle *casa* (maison en espagnol, italien et portugais) et *via*, le chemin (latin, italien). Ensemble : « le chemin vers la maison ». Rien de gênant relevé en FR, EN, ES, DE, IT ni PT. En turc, *kaz* veut dire « oie », ce qui est neutre (le turc ne fait pas partie des langues visées). Arabe : non vérifié.
- **Domaines** : `.com`, `.fr`, `.app`, `.io` et `.co` libres.
- **Marques (EUIPO)** : rien pour « kazvia », « casavia », « kasvia » ni « casa via ». KAZVI (EUTM 017259995, AbbVie) est en classe 5, celle des médicaments, donc hors de nos classes.
- **Web** : pas d'homonyme. Kazia Therapeutics (biotech cotée au Nasdaq) est proche à l'écrit, mais d'un autre secteur.
- **Note** : sonorité 4, mémorisation 4, international 4, évocation 4, domaines 5, risque 4.

#### A2. Loftvu — 25/30
- **Prononciation** : FR « loft-vu » ; EN « loft-voo ».
- **Sens** : « loft », compris dans toutes les langues visées, puis « vu ». Rien de gênant relevé. Limite : un loft évoque un ancien local industriel réhabilité, pas un T3 neuf vendu sur plan.
- **Domaines** : tous libres.
- **Marques (EUIPO)** : rien pour « loftvu », « loft vu », « loftvue », « loftview » ni « loft view ».
- **Web** : pas d'homonyme.
- **Note** : sonorité 4, mémorisation 4, international 5, évocation 3, domaines 5, risque 4.

#### A3. Domavu — 25/30
- **Prononciation** : FR « do-ma-vu » ; EN « doh-mah-voo ». Trois syllabes ouvertes.
- **Sens** : *dom* (maison en latin et dans les langues slaves) et « vu ». *Doma* veut dire « à la maison » en russe, tchèque, slovaque et croate, ce qui est positif. C'est la variante disponible la plus proche de Domvu, l'exemple de l'utilisateur. Rien de gênant relevé.
- **Domaines** : tous libres (`domavue.com` est pris).
- **Marques (EUIPO)** : rien pour « domavu », « domavo », « domovu » ni « domavue ».
- **Web** : **domavu.de est une boutique en ligne allemande** qui vend des aspirateurs, des gourdes et des vêtements. Ce n'est pas une marque déposée dans l'UE (aucun résultat EUIPO), mais le nom est déjà utilisé dans le commerce et prend les premiers résultats de recherche.
- **Note** : sonorité 4, mémorisation 4, international 4, évocation 5, domaines 5, risque 3.

#### A4. Nidvu — 24/30
- **Prononciation** : FR « nid-vu » ; EN « nid-voo ». Deux syllabes.
- **Sens** : « nid » et « vu » : « j'ai vu mon nid ». Très parlant en français, opaque en anglais. En arabe, *nidd* signifie « égal, rival » (neutre, non vérifié).
- **Domaines** : tous libres.
- **Marques (EUIPO)** : rien pour « nidvu », « nidvue » ni « nid vu ».
- **Web** : pas d'homonyme. Nirvu (coaching sportif) et Nuvu (école) sont proches à l'écrit, mais sans rapport.
- **Note** : sonorité 3 (le « dv » accroche un peu), mémorisation 4, international 3, évocation 4, domaines 5, risque 5.

#### A5. Arkvu — 23/30
- **Prononciation** : FR « ark-vu » ; EN « ark-voo ».
- **Sens** : *ark* renvoie à « archi » et à l'arche (de Noé en anglais), puis « vu ». Rien de gênant relevé.
- **Domaines** : tous libres.
- **Marques (EUIPO)** : rien pour « arkvu » ni « arcvu ». En revanche, la recherche « arkvue » remonte **ParkVue** (EUTM 004578101, Valeo, classes 9, 11 et 12, aide au stationnement) et **SPARKvue** (EUTM 009258435, PASCO Scientific, classe 9, logiciel de sciences). Ces deux marques contiennent « arkvue » et sont en classe 9 : ce n'est pas bloquant, mais c'est à surveiller.
- **Web** : pas d'homonyme.
- **Note** : sonorité 4, mémorisation 4, international 4, évocation 3, domaines 5, risque 3.

#### A6. Domazu — 23/30 (écarté du top 5)
- **Prononciation** : FR « do-ma-zou » ; EN « doh-mah-zoo ». C'est le plus « appli » à l'oreille.
- **Sens** : *dom* plus une finale japonisante. Même remarque positive que Domavu sur *doma*.
- **Domaines** : tous libres.
- **Marques (EUIPO)** : seulement des marques expirées (DOMAZURE, DOMAZINC).
- **Web** : **Domaza**, une plateforme immobilière internationale (« 73 websites on 6 continents »), est à une lettre. Même secteur, forte proximité.
- **Note** : sonorité 5, mémorisation 4, international 4, évocation 3, domaines 5, risque 2.

### Famille B — jeux de mots

#### B1. Vizavu — 27/30
- **Prononciation** : FR « vi-za-vu » ; EN « vee-zah-voo ».
- **Jeu de mots** : sur « vis-à-vis » (face à face), expression connue en français comme en anglais (les dictionnaires anglais ont une entrée *vis-à-vis* ; non revérifié ici). Le « vu » final ajoute l'idée « déjà vu ». On le comprend sans explication : face à face avec son futur appartement. Rien de gênant relevé. En roumain et en russe, *viza* veut dire « visa », ce qui est neutre.
- **Domaines** : tous libres. **`visavu.com` est pris** (créé le 11/05/2026, GoDaddy, réponse 404) ; `visavu.fr`, `.app`, `.io` et `.co` sont libres et peuvent être pris en défense. `vizavue.com` est libre aussi.
- **Marques (EUIPO)** : rien pour « vizavu », « visavu », « vizavue » ni « vis a vu ». VIZAVI (Majencia, mobilier) est expirée. Famille « vis-à-vis » vivante :
  - **VISAVIS** : EUTM 018236539, WITA S.R.L., classes 9, 35, 38 et 45 ;
  - **MAISON VISAVIS** : EUTM 018935522, classes 16, 35, 36, 41 et 43 ;
  - **VIS-A-VIS** : EUTM 016763021, classes 20 et 35.

  Le nom se prononce presque comme ces marques. Un juriste doit trancher sur les classes 35 et 36.
- **Web** : pas d'homonyme exact.
- **Note** : sonorité 5, mémorisation 5, international 4, évocation 5, domaines 5, risque 3.

#### B2. Plan avec vue / Plan with a View — 25/30
- **Prononciation** : identique à l'écrit, une version par langue.
- **Jeu de mots** : sur *A Room with a View* (E. M. Forster, 1908 ; le film de James Ivory, 1985), traduit en français par « Chambre avec vue ». Les deux titres sont connus. « Plan avec vue », c'est un plan qui donne à voir.
- **Domaines** : `planavecvue` et `planwithaview` sont libres dans les cinq extensions.
- **Marques (EUIPO)** : rien pour « plan avec vue » ni « plan with a view ». « UNE CHAMBRE AVEC VUE A ROOM WITH A VIEW » (EUTM 018204401) est en classes 3, 14, 24, 25 et 26, donc hors des nôtres.
- **Web** : l'expression apparaît seulement comme formule d'annonce immobilière (« plan de maison avec vue »), pas comme marque.
- **Limites** : 11 et 13 lettres, pas du tout « appli ». En France, on écrira « planavecvue » en minuscules collées.
- **Note** : sonorité 3, mémorisation 4, international 4, évocation 5, domaines 5, risque 4.

#### B3. Voilavu — 24/30
- **Prononciation** : FR « voi-la-vu » ; EN « vwah-lah-voo ».
- **Jeu de mots** : « voilà », connu partout, avec « vu » : « voilà, c'est vu ». Rien de gênant relevé.
- **Domaines** : tous libres, et `voilavue.com` aussi.
- **Marques (EUIPO)** : rien pour « voilavu », « voila vu » ni « voilavue ». En revanche, **83 marques contiennent « voila »**. Parmi les vivantes dans nos classes :
  - VOILÀ : EUTM 018211931, Vanbreda Risk & Benefits, classes 35, 36 et 42 ;
  - ET VOILA : EUTM 014906821, classes 9 et 42 ;
  - evoilà : EUTM 017914980, classes 9, 36 et 42 ;
  - Voilā : EUTM 018892887, Boku Labs, classe 36.

  Le terrain est encombré.
- **Web** : des applis « Voilà » connues (Voilà AI, Voilà, l'épicerie en ligne de Sobeys au Canada), mais aucune « Voilavu ».
- **Note** : sonorité 4, mémorisation 4, international 4, évocation 4, domaines 5, risque 3.

#### B4. Tour de clé — 24/30
- **Prononciation** : FR « tour-de-clé » ; EN « tour-duh-clay ».
- **Jeu de mots** : en français, un « tour de clé » est le geste qui ferme ou ouvre une porte. En anglais, *tour* veut dire visite (*virtual tour*). Le nom dit donc à la fois « visite » et « clé ». Aucun sens gênant.
- **Domaines** : `tourdecle` libre dans les cinq extensions.
- **Marques (EUIPO)** : rien pour « tour de cle », « tour de clé », « tourdecle » ni « tour de clef ».
- **Web** : aucun homonyme. La recherche remonte des start-up de gestion de clés (Myloby, SecurClés), mais sous d'autres noms.
- **Limites** : 9 lettres et un accent. C'est une expression, pas un mot d'appli.
- **Note** : sonorité 3, mémorisation 4, international 2, évocation 5, domaines 5, risque 5.

#### B5. Home Sweet Plan — 24/30
- **Prononciation** : identique en français et en anglais (« home sweet home » est passé dans la langue).
- **Jeu de mots** : « Home sweet home » avec *plan* à la place du second *home*.
- **Domaines** : `homesweetplan` libre dans les cinq extensions.
- **Marques (EUIPO)** : rien pour « home sweet plan ». La recherche « sweet plan » ne remonte que SWEET PLANET et SWEET PLANTS (jeux vidéo, confiserie).
- **Web** : **Sweet Home 3D**, un logiciel libre très connu pour dessiner un plan et le visiter en 3D, occupe toute la page de résultats. C'est la même fonction, avec presque les mêmes mots : risque de confusion et référencement difficile.
- **Note** : sonorité 4, mémorisation 5, international 4, évocation 4, domaines 5, risque 2.

#### B6. Chezvu — 22/30 (écarté du top 5)
- **Prononciation** : FR « ché-vu » (comme « chez vous ») ; EN « shay-voo ».
- **Jeu de mots** : « chez vous » écrit « chez vu ». C'est le plus naturel à l'oreille des jeux de mots testés.
- **Domaines** : **`chezvu.com` est pris** (01/10/2020, GoDaddy, expire en 2030) ; `.fr`, `.app`, `.io` et `.co` sont libres.
- **Marques (EUIPO)** : rien pour « chezvu » ni « chez vu ».
- **Web** : **ChezVuDecor** est un compte de décoration et de rénovation d'appartements à Paris, suivi par 85 000 personnes sur Instagram, avec une chaîne YouTube et un TikTok. Même univers, même nom : conflit direct probable.
- **Note** : sonorité 5, mémorisation 5, international 3, évocation 5, domaines 3, risque 1.

### Autres jeux de mots notés mais non retenus
- **Clé de vue** (sur « clé de voûte ») : libre dans les cinq extensions. Très bon en français, mais intraduisible.
- **Rendez-vu** (rendez-vous + rendu + vu) : triple sens, le meilleur des jeux de mots. Mais `rendezvu.com` est à vendre sans prix affiché, et le `.app` et le `.co` sont pris.
- **Bleuprint** (blueprint + le bleu de la charte) : le `.com`, le `.io` et le `.co` sont pris.
- **Planorama**, **Toctoc**, **Bien vu** : pris presque partout.

---

## 4. Top 5 par famille, avec signatures

Les signatures sont des propositions : je ne les ai pas vérifiées dans les bases de marques. À éviter aux États-Unis : « WALK INSIDE BEFORE YOU BREAK GROUND » et « SEE IT BEFORE YOU BUILD IT », déjà déposées (voir `nom-international.md`).

### Famille A — inventés

| # | Nom | Signature FR | Signature EN |
|---|---|---|---|
| 1 | **Kazvia** | Le chemin vers chez vous, avant les clés. | Your way home, before the keys. |
| 2 | **Loftvu** | Votre appartement, vu avant d'exister. | See your home before it exists. |
| 3 | **Domavu** | Votre futur chez-vous, déjà vu. | Your future home, already seen. |
| 4 | **Nidvu** | Voyez votre nid avant qu'il soit bâti. | See your nest before it's built. |
| 5 | **Arkvu** | Du plan à la visite, en quelques minutes. | From floor plan to walkthrough, in minutes. |

### Famille B — jeux de mots

| # | Nom | Signature FR | Signature EN |
|---|---|---|---|
| 1 | **Vizavu** | Face à face avec votre futur chez-vous. | Face to face with your future home. |
| 2 | **Plan avec vue** | Le plan, et la vue qui va avec. | The plan, and the view that comes with it. |
| 3 | **Voilavu** | Déposez le plan. Voilà, vu. | Drop the plan. Voilà, seen. |
| 4 | **Tour de clé** | Faites le tour avant la clé. | Take the tour before the key. |
| 5 | **Home Sweet Plan** | Votre futur chez-vous, bien avant les clés. | Your future home, long before the keys. |

### Top 8, toutes familles

Classement par note, puis par le critère « risque » en cas d'égalité : Vizavu (27), Kazvia (25), Loftvu (25), Domavu (25), Plan avec vue (25), Voilavu (24), Nidvu (24), Tour de clé (24). Le tableau du §0 donne le risque principal de chacun.

---

## 5. À vérifier à la main

1. **TMview**, dès que le pare-feu le permet, depuis un navigateur : Vizavu, Kazvia, Loftvu, Domavu, Nidvu, Arkvu, Voilavu, « plan avec vue », « tour de clé », avec les offices FR, EM, WO, US, GB, ES, DE, IT et PT, en classes 9, 35, 36 et 42. La recherche EUIPO faite ici ne couvre **ni l'INPI ni les enregistrements internationaux qui ne visent pas l'UE**.
2. **Base INPI** ([data.inpi.fr](https://data.inpi.fr)), qui a refusé l'accès automatisé (403) : les mêmes noms, plus « vis-à-vis » et « visavis » en classes 35 et 36.
3. **Avis d'un conseil en propriété industrielle** sur Vizavu face à VISAVIS (EUTM 018236539) et MAISON VISAVIS (EUTM 018935522). Les noms sont proches à l'oreille.
4. **Prix réels au panier** chez un registrar : `.app`, `.io` et `.co` peuvent être classés « premium » même s'ils ne sont pas enregistrés.
5. **Contacter le titulaire de `visavu.com`** (enregistré en mai 2026) si Vizavu est retenu, ou au minimum prendre `visavu.fr` et `visavu.app` en défense.
6. **Test oral** auprès de 5 à 10 personnes, dont des anglophones et des arabophones : sens gênant éventuel en arabe (non vérifié), et prononciation spontanée de « Vizavu » et « Kazvia » après une seule écoute.
7. **Réseaux sociaux** : disponibilité des identifiants @vizavu, @kazvia, etc. sur Instagram, LinkedIn et TikTok (non vérifiée).
8. **Refaire la vérification des domaines** le jour de l'achat. La disponibilité ne vaut qu'à 10 h 25 UTC le 29/09/2026.

---

## 6. Sources

**Domaines** (29/09/2026)
- Verisign whois `.com` : `whois.verisign-grs.com`
- AFNIC whois `.fr` : `whois.nic.fr`
- Google Registry RDAP `.app` : `https://pubapi.registry.google/rdap/domain/X.app`
- `.io` : `whois.nic.io` ; `.co` : `whois.registry.co`
- Pages visitées : [chezvu.com](http://chezvu.com), [visavu.com](https://visavu.com), [rendezvu.com](http://rendezvu.com), [planhop.com](https://planhop.com), [voilla.com](http://voilla.com), [bleuprint.com](http://bleuprint.com)

**Marques** : EUIPO eSearch plus ([euipo.europa.eu/eSearch](https://euipo.europa.eu/eSearch/)), API `copla/ctmsearch/json`
- Contrôle : [EUTM 012087409 MATTERPORT](https://euipo.europa.eu/eSearch/#details/trademarks/012087409)
- [EUTM 018236539 VISAVIS](https://euipo.europa.eu/eSearch/#details/trademarks/018236539)
- [EUTM 018935522 MAISON VISAVIS](https://euipo.europa.eu/eSearch/#details/trademarks/018935522)
- [EUTM 016763021 VIS-A-VIS](https://euipo.europa.eu/eSearch/#details/trademarks/016763021)
- [EUTM 011619491 VIZAVI (expirée)](https://euipo.europa.eu/eSearch/#details/trademarks/011619491)
- [EUTM 004578101 ParkVue](https://euipo.europa.eu/eSearch/#details/trademarks/004578101)
- [EUTM 009258435 SPARKvue](https://euipo.europa.eu/eSearch/#details/trademarks/009258435)
- [EUTM 017259995 KAZVI](https://euipo.europa.eu/eSearch/#details/trademarks/017259995)
- [EUTM 018211931 VOILÀ](https://euipo.europa.eu/eSearch/#details/trademarks/018211931)
- [EUTM 014906821 ET VOILA](https://euipo.europa.eu/eSearch/#details/trademarks/014906821)
- [EUTM 017914980 evoilà](https://euipo.europa.eu/eSearch/#details/trademarks/017914980)
- [EUTM 018892887 Voilā](https://euipo.europa.eu/eSearch/#details/trademarks/018892887)
- [EUTM 018204401 UNE CHAMBRE AVEC VUE A ROOM WITH A VIEW](https://euipo.europa.eu/eSearch/#details/trademarks/018204401)
- [EUTM 002354538 DOMAZURE (expirée)](https://euipo.europa.eu/eSearch/#details/trademarks/002354538)

TMview ([tmdn.org/tmview](https://www.tmdn.org/tmview/)) : inaccessible, redirigé vers `tmdn.org/error/revise.html`.

**Homonymes** (recherche web)
- [domavu.de](https://www.domavu.de/) et [mentions légales](https://www.domavu.de/pages/impressum)
- [Domaza sur LinkedIn](https://www.linkedin.com/company/domaza)
- [ChezVuDecor sur Instagram](https://www.instagram.com/chezvudecor/), [sur YouTube](https://www.youtube.com/@chezvu)
- [Sweet Home 3D](https://www.sweethome3d.com/)
- [Kazia Therapeutics](https://www.kaziatherapeutics.com/)
- [Nirvu (Tracxn)](https://tracxn.com/d/companies/nirvu/__BIt7H-4u_r3LxvqxmnWJVYUuuhpjklYsA3UPI070o-A)
- [Voilà AI](https://www.getvoila.ai/app)
- [Myloby (Immo Matin)](https://www.immomatin.com/logiciels/logiciels-gestion/la-plateforme-de-gestion-de-cles-myloby-leve-1-3-million-d-euros.html), [SecurClés (Journal de l'Agence)](https://www.journaldelagence.com/1202844-securcles-lapplication-qui-digitalise-les-armoires-a-cles-des-pros-de-limmobilier)

**Recherches précédentes** : `nom.md` et `nom-international.md`, dans ce dossier.
