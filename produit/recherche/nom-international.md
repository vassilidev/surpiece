# Nom international

Recherche du 29/09/2026, entre 09 h 20 et 10 h 10 (UTC). Elle remplace le nom provisoire « Sur Pièce », abandonné parce que l'outil vise le monde entier. Les disponibilités de domaines changent d'une heure à l'autre. Chaque fait externe renvoie à une source (§8). La mention « non vérifié » signale ce que je n'ai pas pu confirmer.

Contraintes ajoutées par l'utilisateur en cours de recherche :
- budget domaine d'environ 500 € au maximum, donc pas de rachat de `.com` cher ;
- lancement en France d'abord (site en français, anglais juste après) : le nom doit bien sonner pour un Français et le `.fr` doit être libre ;
- le nom doit rester crédible auprès de son réseau de CGP et de conseillers.

---

## 0. En bref

**Recommandation : Dejavisit** (se dit « déjà visite », s'écrit « Déjà Visit » dans le logo).

- **L'idée.** En psychologie, le « déjà visité » est une variante du déjà-vu : on arrive dans un lieu où l'on n'est jamais allé et on a le sentiment de le connaître déjà ([New World Encyclopedia](https://www.newworldencyclopedia.org/entry/D%C3%A9j%C3%A0_vu)). C'est exactement ce que vit l'acheteur le jour de la remise des clés, s'il a utilisé le produit. Le nom raconte donc le résultat, pas la technique.
- **Pourquoi il marche à l'international.** « Déjà vu » est compris dans les six langues visées. Le Duden allemand a même l'entrée « Déjà-vu » (non revérifié ici). « Visit » se lit sans peine en français, espagnol, italien et portugais (visite, visita).
- **Domaines.** Il est libre partout : `.com`, `.fr`, `.app`, `.io`, `.co` et `.homes`. Coût : le tarif normal d'un registrar, soit quelques dizaines d'euros par an en tout (prix non relevés).
- **Marques.** Aucune marque identique ou proche dans TMview pour « dejavisit » ou « deja visit » (offices UE, France, OMPI, États-Unis, Royaume-Uni, Espagne, Allemagne, Italie, Portugal, Suisse, Benelux). La famille « Déjà vu » compte en revanche beaucoup de marques, dont plusieurs en classes 9, 35, 36 et 42.
- **Trois risques :**
  - on l'entend « déjà visite » et un Français l'écrira avec un `e` final. Il faut prendre `dejavisite.fr`, qui est libre. `dejavisite.com` est pris : une page « Launching Soon » créée le 30/09/2025, avec une date d'expiration au 30/09/2026 ;
  - pour un hispanophone qui ne reconnaît pas le « déjà », « deja » veut dire « laisse » ou « quitte » (verbe *dejar*). Ce n'est pas péjoratif, mais c'est un contresens possible ;
  - le mot compte 9 lettres, la limite haute du critère.

**Plan B : Forewalk.** Libre dans les six extensions. C'est un vrai mot anglais, rare et archaïque (« marcher devant, avant » ; [Wiktionary](https://en.wiktionary.org/wiki/forewalk)), donc déposable. Risque principal : FIREWALK, à une lettre près, est une marque de Sony en classes 9, 41 et 42, au nom du studio de jeux vidéo fermé en octobre 2024.

**Top 5**

| # | Nom | Domaines | Note /40 | Risque principal |
|---|---|---|---:|---|
| 1 | **Dejavisit** | tous libres | 33 | orthographe « dejavisite » ; « deja » en espagnol |
| 2 | **Forewalk** | tous libres | 30 | FIREWALK (Sony), classes 9 et 42 |
| 3 | **Planporta** | tous libres | 30 | PLANPORT (PlanDataAI, US, classe 42) |
| 4 | **Prewalk** | `.com` à vendre 3 995 $ (hors budget) ; `.fr`, `.app`, `.io`, `.co`, `.homes` et `getprewalk.com` libres | 29 | terme du BTP américain, donc peu distinctif |
| 5 | **Soonkeys** | tous libres | 28 | ton trop léger pour un promoteur |

**Constat de fond :** sur 587 noms testés (plus 12 variantes de domaine), **aucun nom inventé de 4 à 7 lettres n'a son `.com` libre**. Toute la série de 40 inventés latins (clavena, domira, visora, planura…) est prise. Un `.com` libre ne s'obtient qu'avec un composé de deux mots peu courant. Les noms courts « à la Figma » exigent un rachat, entre 3 000 et 30 000 $ selon les annonces relevées, hors budget, ou une autre extension.

---

## 1. Méthode

1. **Génération.** 587 noms en onze angles (tableau §2) :
   - racines latines et grecques ;
   - mots-valises ;
   - vocabulaire d'architecture ;
   - mots courts neutres ;
   - remise des clés ;
   - composés en « avant », « déjà », « voilà », « fore- », « pre- », « walk » ;
   - variantes d'orthographe.

   J'en ai écarté d'office ceux qui contiennent 3D, virtual, immersive, AI, twin ou meta. Je n'ai pas retesté la liste déjà vérifiée par l'utilisateur.
2. **`.com` en masse** : `whois -h whois.verisign-grs.com X.com`. « No match for » signifie libre. Pause de 0,4 s entre requêtes, aucune erreur ni blocage sur 599 requêtes.
3. **Autres extensions** pour 47 noms retenus, avec contrôle sur des domaines connus pour vérifier que chaque serveur répond « pris » quand il le faut :
   - `.fr` : `whois.nic.fr`, « NOT FOUND » ;
   - `.app` : RDAP Google Registry, 404 ;
   - `.homes` : RDAP CentralNic, 404 ;
   - `.io` : `whois.nic.io`, « Domain not found » ;
   - `.co` : `whois.registry.co`, serveur indiqué par `whois.iana.org`, « DOMAIN NOT FOUND ».

   Un nom non enregistré peut quand même être classé « premium » par le registre : le prix est à vérifier au panier.
4. **Prix de revente.** J'ai chargé les pages d'accueil des `.com` parqués :
   - les pages Spaceship et HugeDomains affichent un prix, que j'ai relevé ;
   - les pages Afternic (qui renvoient vers `forsale.godaddy.com`), Atom/Squadhelp et Brandsly refusent l'accès automatisé (403) : **prix non vérifié** ;
   - l'API de recherche de GoDaddy est bloquée elle aussi.
5. **Marques.** API TMview (`https://www.tmdn.org/tmview/api/search/results`), en recherche « contient » (C) et « floue » (F), sur les offices EM, FR, WO, US, GB, ES, DE, IT, PT, CH et BX. Contrôle : MATTERPORT remonte bien (EM 012087409, classes 9, 35 et 42). J'ai ensuite gardé, par script, les marques à distance d'édition ≤ 2 du nom cherché ou qui le contiennent, puis j'ai relu à la main celles qui sont vivantes en classes 9, 35, 36 ou 42.
   - **Émirats et Arabie saoudite** : un test sur EMAAR avec les offices AE et SA ne renvoie que des marques marocaines et britanniques. Ces offices ne semblent donc pas couverts par TMview (non vérifié). **La recherche aux Émirats reste à faire** (§7).
6. **Homonymes.** Recherche web (moteur américain) et visite des sites qui occupent les `.com` pris.
7. **Notation** de 1 à 5 sur les huit critères demandés, en somme sur 40. En cas d'égalité, je départage par évocation + confiance.

---

## 2. Candidats testés

### 2.1 Disponibilité du `.com` (Verisign, 29/09/2026)

599 requêtes, dont 587 noms et 12 variantes de domaine (get…, try…, …app). En gras, les `.com` libres.

| Angle | Testés | `.com` libres | `.com` pris |
|---|---:|---|---|
| Racines latines/grecques inventées (seuil, clé, maison, entrer, voir avant) | 53 | **antedom** | clavio, clavea, clavra, clavium, intrado, intrava, intravi, domivo, domiva, domura, domovi, oikova, oikio, habiro, habiva, habivo, portavo, januo, janova, limova, limeno, limenta, liminy, previo, previdi, prevista, provista, vidomo, vidoma, antevo, antevia, stanzio, salavo, planeo, planevo, planara, planora, planvue, planiva, planivo, pleniv, ingressa, introvo, entrio, entrava, entrata, entreo, visoro, vivedo, vedomo, videra, habitara |
| Mots-valises anglais clé/porte/plan/pièce | 62 | **doorahead**, **openplanhome** | keyview, keyplan, keyroom, keywalk, keyvisit, visitkey, keyvue, plankey, planhaus, stepinto, roomsight, planreel, plandoor, prehouse, planpass, roompass, homepass, entrypass, firstkey, keynest, planest, nestplan, roomsfirst, planopen, openroom, keystep, firststep, homeahead, aheadhome, keyahead, roomahead, seeahead, homesoon, soonhome, almosthome, nearlyhome, yethome, alreadyhome, keysoon, keysready, keyturn, keydrop, keysday, moveday, handkey, walkahead, walkfirst, seefirst, roomfirst, planfirst, visitfirst, preroom, prewalkthrough, blueroom, bluedoor, bluekey, bluehome, bluvisit, planvisit, doorfirst |
| Vocabulaire d'architecture international | 34 | — | pianta, planta, esquisse, croquis, alcove, oriel, loggia, cartouche, modulor, vestibul, isovist, cyano, diazo, vellum, calque, cota, kota, poche, parti, maquette, maket, grundriss, plinth, sillon, mullion, elevo, axono, isometra, oculus, pergola, portico, vestibule, entresol, atelio |
| Mots courts neutres (type Figma, Notion) | 42 | **nidovue** | prevu, kivo, plova, pleno, vuemo, domu, kaza, roomo, nolo, ovio, tolo, vayo, arko, nido, casavu, casavista, domovue, pieza, kamer, stanzi, roomi, doora, entro, ingo, vedo, vedi, visto, oda, lar, larvue, keyo, keyza, nooka, dwello, abodo, hauso, voyez, ecco, doro, lumo, veza |
| Remise des clés / handover (1re vague) | 29 | **keysafter**, **keyhanded**, **avantclef**, **clefvue**, **seuilvue**, **yetroom** | keymoment, clavo, remise, livraison, handovr, keyready, homeday, keyed, keysin, keysup, onkeys, thekeys, keysto, firstkeys, morrowhome, domani, demain, avantvue, cleview, soonroom, homeyet, tobehome, willbehome |
| Composés avant / déjà / voilà / plan / visite | 153 | **keysnear**, **soonkeys**, **avantvisit**, **avantvu**, **dejaroom**, **dejadoor**, **dejakey**, **dejavisit**, **planpiece**, **planporta**, **planstroll**, **planvrai**, **fidelplan**, **entreeplan**, **planentree**, **voilaplan**, **voilaroom**, **voiladoor**, **prothyra**, **doorsoon**, **sillplan**, **antevisit**, **dwellsoon**, **nestsoon**, **visitavant**, **vuavant**, **voirvant**, **avantlire**, **chezplan**, **chezsoon** | keysnext, keysahead, earlykey, earlykeys, earlyroom, earlydoor, earlywalk, firstdoor, firstroom, prekey, prekeys, preplan, planlive, planvivo, vivoplan, avantkey, avantroom, avantdoor, avanthome, avantplan, dejahome, dejaplan, dejavue, keyvu, clevu, homevu, homeseen, seenhome, walkvue, walkinplan, planvista, planvisio, planviso, plancasa, casaplan, casavisit, planrooms, planscene, planstage, planstep, plansteps, planpace, planfoot, planreal, realplan, trueplan, visiplan, visihome, visidom, visiroom, visikey, habiplan, habivue, habitio, voilahome, peekplan, peekhome, peekroom, lookinside, aditus, adito, aditum, ostium, janua, umbral, limiar, soglia, soleira, prentry, preentry, prentra, homeprint, roomprint, floorprint, enterable, keyline, keyvisio, doorvue, doorsight, doorkeys, keydoor, thresh, roomsoon, homeready, readyroom, previsio, previsita, previsite, antevue, planavant, planante, planpre, plansoon, plannow, nowplan, keyscene, keyaway, onplan, offplanhome, planhomes, planhabit, habitplan, plandwell, dwellplan, dwellfirst, nestfirst, nestview, nidoplan, nidora, casanova, intoplan, intohome, intoroom, stepinplan, stepintoit, walkitfirst, visitsoon, surplace, enpiece, planchez, yourplan, ownplan, myplanhome |
| Inventés latins à suffixe (-ora, -eo, -ivo, -ena) | 40 | — | clavena, clavura, claveo, clavida, domeo, domena, domira, domella, portena, portivo, portura, visora, visena, visiva, habena, habira, habeo, casena, casura, casira, nidena, clevo, cleora, entora, entira, stanzia, avanta, avantia, preva, prevena, previda, prehab, planena, planura, planira, planea, plania, planello, planetto, planio |
| Composés clés / voilà / déjà / fore- / peek | 84 | **keysward**, **keystroll**, **clefhome**, **sillvue**, **walkyplan**, **eccoplan**, **eccoroom**, **voilakeys**, **voilavue**, **dejakeys**, **dejachez**, **dejahere**, **dejalive**, **avantchez**, **avantpas**, **avantcle**, **entrepiece**, **oikoplan**, **piezaplan**, **keysvue**, **planglimpse**, **lookinplan**, **forewalk** | keysnow, keysaway, keyward, keywards, keyseen, keysplan, keyplace, clefroom, clefplan, clefs, doorwise, doorvisit, planwalks, truescale, lifescale, realscale, scaleone, cotevue, truecote, planlife, vivaplan, planviva, planvie, eccocasa, voilacasa, voilakey, avantcasa, avantkeys, entreplan, unlockhome, moveinday, movedin, visito, visitio, visiteo, keyglimpse, glimpsein, firstglance, planpeek, roompeek, keypeek, peekin, peekinside, seeinside, seeitfirst, walkitnow, inbefore, beforein, livebefore, homeprior, priorhome, foresee, foreroom, forehome, forekey, forekeys, foreview, forevisit, forestep, foreplan, foredoor |
| Composés « walk » et variantes de domaine (get…, try…, …app) | 61 | **doorthru**, **antewalk**, **antekey**, **antecasa**, **primwalk**, **forestroll**, **prestride**, **prestroll**, **planbalade**, **walkcasa**, **domwalk**, **foresill**, **walkfore**, **forewalks**, **prewalks**, **getprewalk**, **tryprewalk**, **prewalkapp**, **getforewalk**, **forewalkapp**, **getkeyday**, **keydayapp**, **getplanwalk**, **planwalkapp**, **getsoonkeys** | walkbefore, walkearly, planthru, keythru, truewalk, scalewalk, walkscale, stepplan, forehall, forenest, forestride, prestep, keystride, planstride, homestride, walktohome, aheadwalk, handkeys, strollin, paseo, flanerie, balade, casawalk, walkdom, forevue, forecasa, forelook, forelot, forestay, preamble, foretour, foreday, foretaste, prewalker, getlimen, limenapp |
| Variantes déjà / avant, fautes d'orthographe probables | 33 | **dejaseen**, **dejavoir**, **dejaplace**, **dejadom**, **dejacasa**, **dejanest**, **dejawalk**, **dejatour**, **avantwalk**, **avantseen**, **avantvisite**, **firstsill**, **keywalkin**, **walkinkeys** | forwalk, fourwalk, pretour, prestay, prelive, predwell, premove, prenest, prelook, preseen, prehabit, dejavu3d, dejalook, dejavista, dejavisite, dejahouse, avantview, avantstep, avantlook |
| Derniers composés (roam, wander, glance) | 8 | **foreroam**, **prewander**, **forewander** | preroam, roamahead, keyscape, foreglance, roamplan |

### 2.2 Autres extensions pour les noms retenus

« pris » veut dire enregistré. Pour `.fr`, `.io` et `.co`, toute réponse autre que « non trouvé » est comptée comme « pris », par prudence.

| Nom | .com | .fr | .app | .io | .co | .homes |
|---|---|---|---|---|---|---|
| forewalk | libre | libre | libre | libre | libre | libre |
| soonkeys | libre | libre | libre | libre | libre | libre |
| doorahead | libre | libre | libre | libre | libre | libre |
| voilakeys | libre | libre | libre | libre | libre | libre |
| dejakey | libre | libre | libre | libre | libre | libre |
| dejakeys | libre | libre | libre | libre | libre | libre |
| antewalk | libre | libre | libre | libre | libre | libre |
| antekey | libre | libre | libre | libre | libre | libre |
| prestroll | libre | libre | libre | libre | libre | libre |
| walkcasa | libre | libre | libre | libre | libre | libre |
| keystroll | libre | libre | libre | libre | libre | libre |
| planporta | libre | libre | libre | libre | libre | libre |
| chezplan | libre | libre | libre | libre | libre | libre |
| voilaroom | libre | libre | libre | libre | libre | libre |
| voilaplan | libre | libre | libre | libre | libre | libre |
| avantvu | libre | libre | libre | libre | libre | libre |
| keysnear | libre | libre | libre | libre | libre | libre |
| doorsoon | libre | libre | libre | libre | libre | libre |
| nestsoon | libre | libre | libre | libre | libre | libre |
| avantclef | libre | libre | libre | libre | libre | libre |
| planpiece | libre | libre | libre | libre | libre | libre |
| entrepiece | libre | libre | libre | libre | libre | libre |
| dejavisit | libre | libre | libre | libre | libre | libre |
| clefhome | libre | libre | libre | libre | libre | libre |
| keysvue | libre | libre | libre | libre | libre | libre |
| forestroll | libre | libre | libre | libre | libre | libre |
| primwalk | libre | libre | libre | libre | libre | libre |
| prewalk | pris | libre | libre | libre | libre | libre |
| keyday | pris | libre | pris | libre | libre | libre |
| planwalk | pris | libre | libre | pris | libre | libre |
| limen | pris | pris | pris | pris | pris | libre |
| lotview | pris | libre | pris | pris | libre | libre |
| planvisit | pris | libre | pris | libre | libre | libre |
| doorplan | pris | libre | libre | libre | libre | libre |
| prehome | pris | libre | libre | libre | libre | libre |
| keyvisit | pris | libre | libre | libre | libre | libre |
| unbuilt | pris | libre | pris | pris | pris | libre |
| prevu | pris | pris | pris | pris | pris | libre |
| keytour | pris | libre | libre | libre | libre | libre |
| walkplan | pris | libre | libre | libre | pris | libre |
| firstwalk | pris | libre | libre | libre | libre | libre |
| dejacasa | libre | libre | libre | libre | libre | libre |
| dejawalk | libre | libre | libre | libre | libre | libre |
| avantwalk | libre | libre | libre | libre | libre | libre |
| dejatour | libre | libre | libre | libre | libre | libre |
| prewander | libre | libre | libre | libre | libre | libre |
| forwalk | pris | libre | libre | libre | libre | libre |

### 2.3 `.com` pris : à qui, et à vendre ?

Relevé par whois (serveurs de noms) et visite de la page d'accueil.

| `.com` | Situation relevée | Prix affiché |
|---|---|---|
| prewalk | à vendre chez Spaceship (« PreWalk.com for sale ») | **3 995 $ en achat immédiat**, offres désactivées |
| keyvisit | à vendre chez HugeDomains | **4 195 $** |
| keysin | à vendre chez HugeDomains | **5 095 $** |
| prehome | à vendre chez HugeDomains | **30 195 $** |
| keytour, doorplan, limen, lotview, planvisit, planvista, avantplan, prentry (enregistré le 01/08/2026), soonhome | parqués sur Afternic | **non vérifié** (403) |
| avantkey, onkeys | Atom / Squadhelp | non vérifié (403) |
| clevu | Brandsly | non vérifié (403) |
| unbuilt, previo | Above.com, page « à vendre » | pas de prix affiché |
| roomfirst | Sedo parking | non vérifié |
| **keyday** | **site actif : « Keyday.com, Your Home, Documented – Digital Home User Guides »**, une proptech de guides du logement | pas à vendre |
| **planwalk** | **site actif, gabarit « Plan Walk »** qui vise « Builders, Architects, Homeowners », avec prise de rendez-vous | pas à vendre |
| firstwalk | site actif « FirstWalk – Building Thriving Neighborhoods Together » (immobilier, quartiers) | pas à vendre |
| walkplan | site actif « WalkPlan – Personalized Meal Plans & Walking Plans » | pas à vendre |
| dejavisite | page GoDaddy « Launching Soon » (langue en-SG), créée le 30/09/2025, expiration le 30/09/2026 | pas à vendre |

**Conséquence du budget (~500 €) : aucun `.com` parqué dont le prix a pu être lu n'entre dans le budget.** Les annonces Afternic peuvent être moins chères, mais ce n'est pas vérifié. Il faut consulter les pages à la main (§7).

---

## 3. Finalistes : vérifications

12 finalistes. Pour la prononciation, j'indique une transcription approximative à la française. Le sens négatif en arabe est mon analyse, **à faire valider par un locuteur natif**. Rappel utile pour Dubaï : l'arabe standard n'a ni /p/ ni /v/. Un arabophone qui lit à voix haute tend à dire « b » pour p et « f » pour v ([phonologie de l'arabe](https://en.wikipedia.org/wiki/Arabic_phonology), fait connu, page non relue ici). À Dubaï, l'anglais sert de langue commune, ce qui atténue le problème.

### 3.1 Dejavisit, 9 lettres

- **Sens.** « Déjà visité » : la sensation d'avoir déjà visité un lieu où l'on n'est jamais allé, variante du déjà-vu ([New World Encyclopedia](https://www.newworldencyclopedia.org/entry/D%C3%A9j%C3%A0_vu) ; [Unplugged Psych](https://www.unpluggedpsych.com/explained-deja-vu-vecu-senti-visite/)). Le jour des clés, l'acheteur entre dans un logement qu'il a déjà parcouru. Le nom évoque la projection et la décision, pas la 3D.
- **Prononciation :**
  - FR : dé-ja-vi-zit, naturel ; un Français dira souvent « déjà visite » ;
  - EN : « day-zhah-VIZ-it », « déjà » est un mot anglais courant ;
  - ES : dé-ja-bi-sit ; « déjà vu » est connu, mais un lecteur qui ne le reconnaît pas lira « dé-kha », et *deja* = « laisse, quitte » ;
  - DE : dé-ja-vi-zit, « Déjà-vu » est un mot allemand courant ;
  - IT : dé-ja-vi-zit, *visita* aide ;
  - PT : dé-ja-vi-zit(ch) ;
  - AR : « dé-ja-fi-zit », aucun sens négatif identifié.
- **Test oral :** « déjà visit » → *dejavisit* en anglais ; *dejavisite* ou *déjà-visite* en français. Parade : rediriger `dejavisite.fr`, libre.
- **Domaines :** `.com`, `.fr`, `.app`, `.io`, `.co` et `.homes` libres. `dejavisite.com` est pris (voir §2.3). `dejavisits.com` est libre.
- **Marques (TMview) :**
  - « dejavisit » : 0 résultat ;
  - « deja visit » : 1 seul résultat, une marque portugaise expirée, « DEJA VU – OBJECTOS TRADICIONAIS REVISITADOS » ;
  - la famille « Déjà vu », elle, est chargée en classes 9, 35, 36 et 42, par exemple :
    - DEJA VU, IT, classes 9 et 42 ;
    - Déjà Vu, GB 3478661, classes 9, 35, 38 et 43 ;
    - DEJAVU, EUTM 018495405, classes 3, 24, 35, 36, 41 et 43, déposée ;
    - DEJA VU, US, classe 36, déposée le 17/09/2026.

  Un dépôt à l'identique « Déjà vu » serait impossible. « Dejavisit » s'en distingue par le second élément (mon analyse, pas un avis juridique).
- **Homonymes :** aucune entreprise ou appli « Dejavisit » trouvée. Une page Facebook « Deja Visite » existe (particulier, non vérifié). Association possible avec Déjà Vu Services, une chaîne américaine de clubs de strip-tease ([Wikipédia](https://en.wikipedia.org/wiki/D%C3%A9j%C3%A0_Vu_(company))), faible pour « Dejavisit ».

### 3.2 Forewalk, 8 lettres

- **Sens.** Vieil anglais rare : « marcher devant, avant », et aussi « passerelle » ([Wiktionary](https://en.wiktionary.org/wiki/forewalk), [Wordnik](https://wordnik.com/words/forewalk)). Le préfixe *fore-* se comprend comme dans *foresee* ou *forecast* : « parcourir avant ».
- **Prononciation :**
  - EN : « FOR-wawk » ; à l'oral, on pourrait écrire *forwalk* ou *fourwalk*, tous deux pris en `.com` ;
  - FR : « for-wok », mais le « fore » ne dit rien à un Français ;
  - ES et IT : tentation de lire « fo-ré-oualk » ;
  - DE : lecture anglaise habituelle ;
  - PT : « fo-ri-wok » ;
  - AR : « fore » rappelle *fawran*, « immédiatement », neutre ou positif ; aucun sens négatif identifié.
- **Domaines :** tous libres. `forwalk` a lui aussi `.fr`, `.app`, `.io`, `.co` et `.homes` libres.
- **Marques :**
  - « forewalk » : 0 résultat ;
  - en recherche floue, **FIREWALK**, WO 1644150, classes 9, 41 et 42, Sony Interactive Entertainment ;
  - FIREWALK, US, classe 9 ;
  - FIREWALK STUDIOS, EUTM 017659591, classes 9, 35, 38, 41 et 42.

  Le studio a été fermé par Sony le 29/10/2024 ([Forbes](https://www.forbes.com/sites/paultassi/2024/10/29/sony-shuts-down-concord-developer-no-relaunch-coming/)), mais les marques restent enregistrées. Il y a une lettre d'écart et un titulaire puissant, mais le domaine est très éloigné (jeu vidéo).
- **Homonymes :** aucun dans la proptech. La recherche renvoie surtout FOREWARN, une appli de vérification d'identité pour agents immobiliers américains ([forewarn.com](https://www.forewarn.com/industries/real-estate/)), dont le nom est visuellement proche.

### 3.3 Planporta, 9 lettres

- **Sens.** *Plan* + *porta*, la porte en latin, italien, portugais et catalan : « la porte du plan ». Proche de *porte* en français et de *puerta* en espagnol.
- **Prononciation :** FR plan-por-ta (« plan » nasal) ; EN plan-POR-ta ; ES, IT, PT et DE plan-porta ; AR « blan-borta ». Aucun sens négatif identifié. **Test oral** : très bon, s'écrit comme il se dit.
- **Domaines :** tous libres.
- **Marques :** **PLANPORT**, US, classe 42, PlanDataAI LLC, déposée le 08/10/2024. C'est une plateforme d'IA qui analyse des documents de plans d'épargne retraite ([BusinessWire, 16/04/2026](https://www.businesswire.com/news/home/20260416187562/en/PlanPort-Delivers-Targeted-AI-Capability-to-Support-Ascensus-Plan-Document-Review)). Il y a une lettre d'écart, la même classe et un logiciel des deux côtés : **risque réel aux États-Unis**. Aucun conflit en UE ni en France.
- **Homonymes :** aucun « Planporta » trouvé.

### 3.4 Prewalk, 7 lettres

- **Sens.** « Pré-visite », visite préalable. Très clair.
- **Prononciation :** EN « PREE-wawk » ; FR « pri-wok » ou « pré-wok » ; ES, IT et PT « pré-oualk » ; DE sans difficulté ; AR « bri-wok ». Aucun sens négatif identifié. **Test oral** : bon.
- **Domaines :**
  - `.com` à vendre chez Spaceship, **3 995 $** en achat immédiat, offres désactivées : hors budget ;
  - libres : `.fr`, `.app`, `.io`, `.co`, `.homes` ;
  - libres aussi : `getprewalk.com`, `tryprewalk.com`, `prewalkapp.com`, `prewalks.com`.
- **Marques :** « prewalk », marque allemande (ST13 DE503020080449225), classes 35, 38 et 42, **expirée** ; MAGIC PREWALKER, US, classe 25, sans rapport. Aucune marque vivante proche dans nos classes.
- **Faiblesse :** le « pre-walk » et le « pre-construction walk-through » sont des termes courants du BTP et de la promotion immobilière aux États-Unis ([TDHCA](https://www.tdhca.texas.gov/sites/default/files/community-affairs/wap/docs/WAP-BP-PreconstructionWalkthroughs.pdf), [NewHomeSource](https://www.newhomesource.com/learn/what-to-know-about-walkthroughs/)). Le nom risque d'être jugé descriptif à l'USPTO (mon analyse).
- **Homonymes :** aucune société trouvée.

### 3.5 Soonkeys, 8 lettres

- **Sens.** « Bientôt les clés. » Chaleureux et limpide en anglais.
- **Prononciation :** EN « soon-keez » ; FR « sou-n-kiz », compris par la plupart des Français ; ES, IT, PT et DE lecture anglaise sans piège ; AR « soun-kiz ». Aucun sens négatif identifié.
- **Domaines :** tous libres.
- **Marques :**
  - SWONKEYS, GB, classes 16, 18, 21, 25, 35 et 41, **déposée le 26/09/2026** ;
  - MOON KEYS, FR 5259660, classes 35, 43 et 45 ;
  - KEYSOON, ES, classe 25.

  Rien d'identique dans nos classes.
- **Homonymes :** un compte DeviantArt « soonkeys ». Le résumé du moteur de recherche décrit soonkeys.com comme une plateforme de vente de licences logicielles, alors que le domaine est libre aujourd'hui : c'est probablement un ancien site (non vérifié).
- **Faiblesse :** le ton est grand public. Pour un promoteur ou un CGP, « Soonkeys Developers » sonne léger.

### 3.6 Dejawalk, 8 lettres (variante de 3.1)

- **Domaines :** tous libres.
- **Marques :** aucune proche.
- **Analyse :** plus court et plus « balade » que Dejavisit, mais la référence au « déjà visité » disparaît. C'est un hybride français-anglais moins naturel.

### 3.7 Keytour, 7 lettres

- **Sens :** « visite des clés ».
- **Domaines :** `.com` parqué sur Afternic, **prix non vérifié** ; `.fr`, `.app`, `.io`, `.co` et `.homes` libres.
- **Marques :** keyTOURS, CH, classes 12, 39 et 41, Swisstours Transport (voyages) ; keyfour, CH, classe 36, UBS.
- **Homonymes :** aucun dans la visite virtuelle.
- **Faiblesse :** le nom est proche du descriptif (« key » + « tour »).

### 3.8 Keyvisit, 8 lettres

- **Domaines :** `.com` à **4 195 $** chez HugeDomains, hors budget ; le reste est libre.
- **Marques :** EVISIT, US, classes 9 et 42, à deux lettres d'écart.
- **Analyse :** clair mais descriptif. « Visite réalisée avec Keyvisit » fait redondance.

### 3.9 Voilakeys, 9 lettres

- **Sens.** « Voilà, les clés » : le geste de la remise des clés, avec la touche française.
- **Prononciation :** « vwa-la-kiz ». Beaucoup d'anglophones écrivent *viola* au lieu de *voila*, un risque d'orthographe connu (non sourcé).
- **Domaines :** tous libres.
- **Marques :** 0 résultat pour « voilakeys » ou « voila keys ».
- **Homonymes :** « Voilà » est déjà très utilisé dans l'immobilier :
  - [Voilà!](https://www.appvoila.com/en/propriete/), plateforme municipale d'évaluation foncière au Québec ;
  - [Voila Residential Brokerage](https://voilare.com/) à Boston ;
  - [Voilà Real Estate](https://voilamontenegro.com/) au Monténégro.

### 3.10 Doorahead, 9 lettres

- **Domaines :** tous libres.
- **Marques :** aucune proche (0 résultat).
- **Analyse :** clair en anglais (« la porte devant vous »), obscur et difficile à prononcer pour un Français (« dor-a-hèd »). Faible en France.

### 3.11 Dejacasa, 8 lettres

- **Sens :** « déjà à la maison ».
- **Domaines :** tous libres.
- **Marques :** DELACASA, ES, classe 35.
- **Écarté du top :** en espagnol, « deja casa » se lit « (il) quitte la maison ». Contresens gênant pour Madrid.

### 3.12 Avantvu, 7 lettres

- **Sens :** « vu avant ».
- **Domaines :** tous libres.
- **Marques :** AVANT est très encombré dans nos classes, par exemple :
  - AVANT, US, classe 36, Avant LLC, un prêteur en ligne ;
  - AVANT, DE, classes 35, 36 et 42, Edding AG ;
  - AVANTE, US, classes 9, 35 et 36 notamment, déposée le 13/05/2026.
- **Analyse :** marque faible. Prononciation hésitante en anglais (« a-VAHNT-voo »).

### Éliminés en route (à connaître)

- **Keyday** : `keyday.com` est une proptech en activité (guides numériques du logement) et `.app` est pris. Conflit direct.
- **Planwalk** : `planwalk.com` est un projet « Plan Walk » qui vise constructeurs, architectes et particuliers. Conflit d'usage. `.io` pris. En plus, le service [Walk Thru Plans](https://www.walkthruplans.com/) (plans projetés à l'échelle 1:1) occupe déjà l'idée « walk your plans ».
- **Firstwalk** : `firstwalk.com` est actif dans l'immobilier (quartiers), et il existe une marque allemande FIRSTWALK (classes 10, 25 et 37).
- **Antewalk** : ANTWALK, US, classes 35, 41 et 42, Antwalk Inc.
- **Prehome** : `.com` à 30 195 $.
- **Prevu** : superbe jeu de mots (le « prévu » français sonne comme *preview*), mais pris en `.com`, `.fr`, `.app`, `.io` et `.co`.
- **Limen** : `.fr` pris.
- **Doorsoon** : DOORSON, EUTM, classe 35.
- **Chezplan** : trop français, sens flou.
- **Eccoplan / Eccoroom** : ECCO est une marque de chaussures renommée.

**Signatures à éviter aux États-Unis** : « WALK INSIDE BEFORE YOU BREAK GROUND », marque US de Resin Architecture en classe 42 ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/US500000098686902)), et « WALKTHRU SEE IT BEFORE YOU BUILD IT », US, classe 42, déposée le 08/05/2026 ([TMview](https://www.tmdn.org/tmview/#/tmview/detail/US500000099811708)).

---

## 4. Notation

Chaque critère est noté de 1 à 5 :
- **Évoc.** : évoque la projection ou la décision ;
- **Conf.** : crédible pour un promoteur ou un CGP ;
- **Oral** : on l'entend une fois, on sait l'écrire ;
- **Intl** : six langues + arabe ;
- **MB** : marche en marque blanche ;
- **Ext.** : se décline en Pro et Developers ;
- **Dom.** : domaines dans le budget ;
- **Jur.** : risque juridique (5 = faible).

| Nom | Évoc. | Conf. | Oral | Intl | MB | Ext. | Dom. | Jur. | **Total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Dejavisit** | 5 | 4 | 3 | 4 | 4 | 4 | 5 | 4 | **33** |
| **Forewalk** | 4 | 4 | 3 | 3 | 4 | 4 | 5 | 3 | **30** |
| **Planporta** | 3 | 4 | 4 | 4 | 4 | 4 | 5 | 2 | **30** |
| **Prewalk** | 4 | 4 | 4 | 4 | 4 | 4 | 2 | 3 | **29** |
| Dejawalk | 3 | 3 | 3 | 3 | 4 | 4 | 5 | 4 | 29 |
| **Soonkeys** | 4 | 2 | 4 | 3 | 3 | 3 | 5 | 4 | **28** |
| Keytour | 3 | 4 | 4 | 4 | 4 | 4 | 2 | 3 | 28 |
| Keyvisit | 4 | 4 | 4 | 4 | 3 | 4 | 1 | 4 | 28 |
| Dejacasa | 4 | 3 | 4 | 2 | 3 | 3 | 5 | 4 | 28 |
| Voilakeys | 4 | 2 | 3 | 4 | 3 | 3 | 5 | 3 | 27 |
| Doorahead | 3 | 3 | 3 | 2 | 3 | 3 | 5 | 5 | 27 |
| Avantvu | 3 | 3 | 3 | 3 | 3 | 3 | 5 | 3 | 26 |

Départages :
- **Forewalk passe devant Planporta** à 30 partout, parce que son évocation + confiance vaut 8 contre 7.
- **Dejawalk est exclu du top 5** : c'est la même piste que Dejavisit, en moins bien. Soonkeys prend sa place pour garder une piste différente. Pour la même raison, Keytour et Keyvisit, dont le `.com` est hors budget ou à prix inconnu, passent derrière.

---

## 5. Top 5

### 1. Dejavisit

| | |
|---|---|
| Signature EN | **« Been there before it's built. »** |
| Signature FR | **« Déjà chez vous, avant qu'il existe. »** |
| Variante FR, remise des clés | « Le jour des clés, vous serez déjà venu. » |

- **Particuliers** : Dejavisit.
- **Conseillers, CGP, agents** : Dejavisit Pro.
- **Promoteurs** : Dejavisit Programmes (FR) / Dejavisit for Developers (EN).
- **Marque blanche** : « Propulsé par Dejavisit » ou « Visite réalisée avec Dejavisit ». La redondance « visite… visit » est légère ; « Propulsé par » l'évite.
- **Logo** : « déjà visit » en bas de casse Archivo large. Les accents font un détail graphique, comme le È de Sur Pièce ; l'URL reste sans accent.
- **Domaines à prendre** : dejavisit `.com`, `.fr`, `.app`, `.io`, `.co` et `.homes`, plus `dejavisite.fr` et `dejavisits.com`. Tous libres le 29/09/2026.

### 2. Forewalk

| | |
|---|---|
| Signature EN | **« Walk your home before it's built. »** |
| Signature FR | **« Visitez-le avant qu'il existe. »** |

- **Gamme** : Forewalk / Forewalk Pro / Forewalk Developers (FR : Forewalk Programmes).
- **Marque blanche** : « Visite réalisée avec Forewalk ».
- **Domaines** : forewalk `.com`, `.fr` et `.app`. Prendre aussi `forwalk.fr` et `forwalk.app` pour les fautes. `forwalk.com` et `fourwalk.com` sont pris.

### 3. Planporta

| | |
|---|---|
| Signature EN | **« Step through the plan. »** |
| Signature FR | **« Entrez dans le plan. »** |

- **Gamme** : Planporta / Planporta Pro / Planporta Developers.
- **Marque blanche** : « Visite réalisée avec Planporta ». C'est le plus neutre et le plus « B2B » des cinq.
- **À ne pas oublier** : avis d'un conseil en propriété industrielle sur PLANPORT (US, classe 42) avant de viser les États-Unis.

### 4. Prewalk

| | |
|---|---|
| Signature EN | **« Every room, before the keys. »** |
| Signature FR | **« Chaque pièce, avant les clés. »** |

- **Gamme** : Prewalk / Prewalk Pro / Prewalk Developers.
- **Domaines** : `prewalk.fr` et `prewalk.app` comme adresses principales, et `getprewalk.com` en redirection. Racheter `prewalk.com` (3 995 $) plus tard, si le produit décolle.

### 5. Soonkeys

| | |
|---|---|
| Signature EN | **« Keys later. Home now. »** |
| Signature FR | **« Les clés plus tard. Chez vous, maintenant. »** |

- **Gamme** : Soonkeys / Soonkeys Pro / Soonkeys Developers, cette dernière moins convaincante.
- **Marque blanche** : « Visite réalisée avec Soonkeys ». Sympathique pour un particulier, léger pour un promoteur.

---

## 6. Recommandation

**Choisir Dejavisit.**

1. **Il porte la promesse, pas la techno.** L'utilisateur a demandé un nom qui dise « entrer chez soi avant que le logement existe ». Dejavisit nomme l'effet ressenti le jour des clés : le déjà visité. L'histoire tient en une phrase, dans toutes les langues visées, pour un acheteur comme pour un promoteur.
2. **Il est fait pour un lancement français.** Un Français le lit sans effort, et la touche française (« déjà ») est un atout à Londres, Dubaï ou Lisbonne, où « déjà vu » est courant. Les CGP y retrouvent un registre sérieux : ni gadget, ni « 3D », ni « AI ».
3. **Il tient dans le budget.** Tous les domaines utiles sont libres, pour quelques dizaines d'euros par an. Aucun autre finaliste aussi évocateur n'a son `.com` libre.
4. **Il est défendable.** Pas de marque identique ou proche dans les onze offices consultés. Il n'est pas descriptif d'un logiciel de visite, donc il est déposable (mon analyse, pas un avis juridique).

**Parades aux faiblesses :**
- redirections `dejavisite.fr` et `dejavisits.com` ;
- surveiller `dejavisite.com`, qui expire le 30/09/2026 : s'il n'est pas renouvelé, il retombera dans le domaine public après la période de rédemption (non vérifié) ;
- dans les supports espagnols, écrire toujours « déjà » avec ses accents dans le logo pour éviter la lecture *deja* = « laisse ».

**Plan B : Forewalk.** C'est le meilleur nom si l'on veut un anglais pur et un côté « marche » plus B2B. Il faut accepter l'avis d'un conseil sur FIREWALK (Sony) et une prononciation moins évidente pour un Français.

**Plan C, si la clientèle promoteurs devient prioritaire : Planporta.** Sa faiblesse est juridique, du côté américain.

**À ne pas faire** : racheter un `.com` court. Les prix relevés vont de 3 995 $ (prewalk) à 30 195 $ (prehome), soit bien au-delà des ~500 €.

**Ordre d'action proposé, aujourd'hui :**
1. Acheter dejavisit `.com`, `.fr`, `.app`, plus `dejavisite.fr`. Ajouter `.io`, `.co` et `.homes` si le budget le permet. Prendre aussi forewalk `.com` et `.fr` pour garder le plan B, pour quelques euros.
2. Faire les vérifications manuelles du §7.
3. Déposer la marque verbale « DEJAVISIT » à l'INPI, puis en marque de l'Union européenne, en classes 9, 35, 36 et 42. La marque de l'Union européenne couvre déjà l'Espagne, le Portugal, l'Italie et l'Allemagne. Étendre ensuite par le système de Madrid au Royaume-Uni et aux Émirats, dans le délai de priorité de 6 mois.

---

## 7. À vérifier à la main

1. **Base INPI** ([data.inpi.fr](https://data.inpi.fr)) et **EUIPO eSearch plus** : « dejavisit », « deja visit », « déjà visite », « forewalk », « planporta ». TMview couvre ces offices, mais les dépôts des dernières semaines peuvent manquer.
2. **Émirats arabes unis** : la base du ministère de l'Économie n'est pas dans TMview (test EMAAR). Chercher aussi dans la **WIPO Global Brand Database** (désignations Madrid AE).
3. **USPTO** (Trademark Search), pour confirmer PLANPORT et FIREWALK, et vérifier l'absence de « DEJAVISIT ».
4. **Prix Afternic** de keytour, doorplan, limen, lotview, planvisit, planvista, avantplan, prentry et soonhome : pages bloquées en automatique (403). Ouvrir `afternic.com/domain/X.com` dans un navigateur.
5. **Prix « premium » registre** de `dejavisit.app` et `.homes` : le RDAP dit « non enregistré », mais seul le panier du registrar donne le prix.
6. **Test oral réel** : faire écrire « Dejavisit » et « Forewalk » après une seule écoute à 5 personnes par langue, en particulier espagnol, portugais et arabe du Golfe. Mes transcriptions sont des estimations.
7. **Sens en arabe** : faire relire les finalistes par un locuteur natif.
8. **Recherche Google manuelle** et stores d'applis (App Store, Play) : ma recherche web passe par un moteur américain.
9. **Pseudos réseaux sociaux** (Instagram, LinkedIn, X, TikTok) : non vérifiés.
10. **Registres de sociétés** : RNE / Annuaire des entreprises (France), Companies House (Royaume-Uni), registre de Dubaï (DED). Non consultés pour ces noms.

---

## 8. Sources

**Registres de domaines** (requêtes du 29/09/2026) :
- `.com` : `whois.verisign-grs.com` ;
- `.fr` : `whois.nic.fr` (AFNIC) ;
- `.app` : `https://pubapi.registry.google/rdap/` ;
- `.homes` : `https://rdap.centralnic.com/homes/` ;
- `.io` : `whois.nic.io` ;
- `.co` : `whois.registry.co`, désigné par `whois.iana.org` ;
- amorçage RDAP : [data.iana.org/rdap/dns.json](https://data.iana.org/rdap/dns.json).

**Pages de vente** : prewalk.com (Spaceship, 3 995 $), keyvisit.com, keysin.com et prehome.com (HugeDomains), relevées le 29/09/2026.

**Sites homonymes** : keyday.com, planwalk.com, firstwalk.com, walkplan.com, dejavisite.com, visités le 29/09/2026.

**Marques** : [TMview](https://www.tmdn.org/tmview/), API `api/search/results`.
- [WO 1644150 FIREWALK](https://www.tmdn.org/tmview/#/tmview/detail/WO500000001644150)
- [EM 017659591 FIREWALK STUDIOS](https://www.tmdn.org/tmview/#/tmview/detail/EM500000017659591)
- [US PLANPORT](https://www.tmdn.org/tmview/#/tmview/detail/US500000098791267)
- [DE prewalk (expirée)](https://www.tmdn.org/tmview/#/tmview/detail/DE503020080449225)
- [US ANTWALK](https://www.tmdn.org/tmview/#/tmview/detail/US500000097311247)
- [GB SWONKEYS](https://www.tmdn.org/tmview/#/tmview/detail/GB500000004451401)
- [FR MOON KEYS](https://www.tmdn.org/tmview/#/tmview/detail/FR500000005259660)
- [EM DOORSON](https://www.tmdn.org/tmview/#/tmview/detail/EM500000018628397)
- [ES DELACASA](https://www.tmdn.org/tmview/#/tmview/detail/ES500000003597898)
- [GB Déjà Vu](https://www.tmdn.org/tmview/#/tmview/detail/GB500000003478661)
- [EM DEJAVU](https://www.tmdn.org/tmview/#/tmview/detail/EM500000018495405)
- [US AVANT (classe 36)](https://www.tmdn.org/tmview/#/tmview/detail/US500000086764046)
- [DE AVANT](https://www.tmdn.org/tmview/#/tmview/detail/DE500000002002000)
- [DE FIRSTWALK](https://www.tmdn.org/tmview/#/tmview/detail/DE503020210259447)
- [CH keyTOURS](https://www.tmdn.org/tmview/#/tmview/detail/CH502026000006639)
- [US WALK INSIDE BEFORE YOU BREAK GROUND](https://www.tmdn.org/tmview/#/tmview/detail/US500000098686902)
- [US WALKTHRU SEE IT BEFORE YOU BUILD IT](https://www.tmdn.org/tmview/#/tmview/detail/US500000099811708)
- contrôle : [EM MATTERPORT](https://www.tmdn.org/tmview/#/tmview/detail/EM500000012087409)

**Sens et usages** :
- Déjà visité : [New World Encyclopedia, « Déjà vu »](https://www.newworldencyclopedia.org/entry/D%C3%A9j%C3%A0_vu), [Unplugged Psych](https://www.unpluggedpsych.com/explained-deja-vu-vecu-senti-visite/)
- Forewalk : [Wiktionary](https://en.wiktionary.org/wiki/forewalk), [Wordnik](https://wordnik.com/words/forewalk)
- Fermeture de Firewalk Studios : [Forbes, 29/10/2024](https://www.forbes.com/sites/paultassi/2024/10/29/sony-shuts-down-concord-developer-no-relaunch-coming/), [Insider Gaming](https://insider-gaming.com/breaking-concord-developer-firewalk-studios-shut-down-by-sony/)
- PlanPort : [BusinessWire, 16/04/2026](https://www.businesswire.com/news/home/20260416187562/en/PlanPort-Delivers-Targeted-AI-Capability-to-Support-Ascensus-Plan-Document-Review)
- « Pre-walk » dans le BTP : [TDHCA](https://www.tdhca.texas.gov/sites/default/files/community-affairs/wap/docs/WAP-BP-PreconstructionWalkthroughs.pdf), [NewHomeSource](https://www.newhomesource.com/learn/what-to-know-about-walkthroughs/)
- Forewarn : [forewarn.com](https://www.forewarn.com/industries/real-estate/)
- Walk Thru Plans : [walkthruplans.com](https://www.walkthruplans.com/)
- Voilà dans l'immobilier : [appvoila.com](https://www.appvoila.com/en/propriete/), [voilare.com](https://voilare.com/), [voilamontenegro.com](https://voilamontenegro.com/)
- Soonkeys : [DeviantArt](https://www.deviantart.com/soonkeys/about)
- Déjà Vu Services : [Wikipédia](https://en.wikipedia.org/wiki/D%C3%A9j%C3%A0_Vu_(company))
- Phonologie de l'arabe : [Wikipédia](https://en.wikipedia.org/wiki/Arabic_phonology) (non relue pour cette étude)
