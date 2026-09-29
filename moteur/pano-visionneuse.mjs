/* Contrôles de la visionneuse 360° (appelés par moteur/pano.mjs, résultats dans pano/controle.json), sur le dossier pano/ servi avec
   une politique de contenu stricte, comme en ligne :
   - ordinateur 1440 × 900 : image jamais noire, points de passage au bon endroit, regard d'arrivée de chaque lien appliqué, champ par
     défaut ≥ 100° en largeur, aucune requête hors du dossier ni sans version (?v=), aucun avertissement ni erreur de console, aucune
     violation de la politique de contenu, moteur absent, aucun élément caché affiché, mention lisible (contraste ≥ 4,5:1) ;
   - ordinateur rétine (densité 2) et téléphone (390 × 844, densité 3, tactile) : image assez définie (agrandissement ≤ 1,5), canevas à
     la densité de l'écran ; téléphone : champ ≥ 65° en largeur, cercles de 14 px de haut au moins, écran tourné (champ gardé, entre 60 et
     125°, retour à 1° près ; plan dans l'écran et sur 30 % de sa surface au plus), bouton plein écran caché sans l'API (Safari iPhone) ;
   - vrais gestes au téléphone (événements tactiles) : glisser tourne la vue, pincer ×2 zoome ×2 (±0,2), toucher un cercle y mène,
     toucher à côté ne fait rien ;
   - robustesse : images absentes au départ (message, pas d'écran noir), voisin absent (on reste, message), perte du contexte WebGL (image
     revenue en 3 s), adresse mal encodée ou inconnue (départ), visite à un seul arrêt (aide sans cercle), plan absent (caché), retour du
     navigateur (pièce précédente), réseau lent (image ≥ 2048 en moins de 10 s) ;
   - ouverte depuis la visite 3D (?depuis=visite&cap=, bouton 360°) : regard transmis, bouton « Visite 3D » vers le point de vue courant
     (pos de visite.json) et le regard courant ; ce bouton est absent hors visite. */
import { envSansSecret } from './chrome.mjs';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const PROFILS = {
  ordinateur: { viewport: { width: 1440, height: 900, deviceScaleFactor: 1 } },
  retine: { viewport: { width: 1440, height: 900, deviceScaleFactor: 2 } },
  iphone: { viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ua: IPHONE, sansPleinEcran: true },
  android: { viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, ua: ANDROID },
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const DEG = Math.PI / 180, angD = a => Math.atan2(Math.sin(a), Math.cos(a));

export async function verifierVisionneuse({ puppeteer, port, dir, visite, pb, mesures, ancres, stops, angles }) {
  const base = `http://localhost:${port}/${dir}/pano/`, M = mesures.visionneuse = {};
  const b2 = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], env: envSansSecret() });
  const parId = Object.fromEntries(visite.arrets.map(a => [a.id, a])), depart = visite.depart;
  const ouvertes = [];
  async function ouvrir(nom, { hash = '', bloque = null, remplace = null, attendre = true } = {}) {
    const P = PROFILS[nom], pg = await b2.newPage(); ouvertes.push(pg);
    if (P.ua) await pg.setUserAgent(P.ua);
    await pg.setViewport(P.viewport);
    const o = { pg, requetes: [], console: [], erreurs: [] };
    pg.on('request', r => o.requetes.push(r.url()));
    pg.on('pageerror', e => o.erreurs.push(e.message));
    pg.on('console', m => { if (['error', 'warn', 'warning'].includes(m.type())) o.console.push(`${m.type()} ${m.text()}`); });
    await pg.evaluateOnNewDocument(sans => {
      window.__csp = []; addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      if (sans) for (const [o, k] of [[Element.prototype, 'requestFullscreen'], [Element.prototype, 'webkitRequestFullscreen'], [Document.prototype, 'exitFullscreen'], [Document.prototype, 'webkitExitFullscreen']]) try { delete o[k]; } catch (e) {}
    }, !!P.sansPleinEcran);
    if (bloque || remplace) {
      await pg.setRequestInterception(true);
      pg.on('request', r => {
        const u = r.url();
        if (remplace && remplace.test(u)) return r.respond(remplace.reponse);
        if (bloque && bloque(u)) return r.abort('failed');
        r.continue();
      });
    }
    await pg.goto(base + hash);
    if (attendre) await pg.waitForFunction(() => window.__visionneuse && __visionneuse.pret(), { timeout: 60000 });
    return o;
  }
  const fermer = async o => { await o.pg.close(); ouvertes.splice(ouvertes.indexOf(o.pg), 1); };
  // état de la visionneuse (champ en largeur recalculé si elle ne le donne pas : ancienne version, essai négatif)
  const etat = o => o.pg.evaluate(() => { const e = __visionneuse.etat(); if (e.h == null) e.h = 2 * Math.atan(Math.tan(e.fov * Math.PI / 360) * e.W / e.H) * 180 / Math.PI; return e; });
  const pret = o => o.pg.waitForFunction(() => __visionneuse.pret(), { timeout: 60000 });
  // éléments marqués « hidden » mais affichés quand même (règle display d'une classe)
  const caches = o => o.pg.evaluate(() => [...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.className));
  // image nette de l'arrêt courant chargée (la taille que demande l'écran)
  const nette = o => o.pg.waitForFunction(() => { const e = __visionneuse.etat(); return e.cible == null || e.L >= e.cible; }, { timeout: 60000 }).catch(() => null);
  try {
    /* ---------- ordinateur : chaque arrêt, chaque lien ---------- */
    const o = await ouvrir('ordinateur');
    const e0 = await etat(o);
    M.champ_ordinateur = +e0.h.toFixed(1);
    if (e0.h < 100) pb(`Visionneuse : champ par défaut de ${e0.h.toFixed(0)}° en largeur sur ordinateur (100° au moins)`);
    let pire = 0, vus = 0, arrivees = 0;
    for (const a of visite.arrets) {
      await o.pg.evaluate(id => __visionneuse.aller(id, true), a.id); await pret(o);
      const lum = await o.pg.evaluate(() => __visionneuse.luminance());
      if (lum < 0.04) pb(`Visionneuse : image noire à l'arrêt ${a.nom}`);
      for (const l of a.liens) {
        // cible attendue, tirée de la géométrie (plan.json) : direction de l'œil de l'arrêt vers le point visé
        const P = ancres.get(a.id + '>' + l.vers), att = angles(stops[a.id].oeil, P);
        const r = await o.pg.evaluate((v, l, t) => __visionneuse.verifierPoint(v, l, t), l.vers, att.lacet, att.tangage);
        if (!r) { pb(`Visionneuse : point vers ${parId[l.vers].nom} absent à l'arrêt ${a.nom}`); continue; }
        vus++; pire = Math.max(pire, r.ecart);
        if (r.ecart > 3) pb(`Visionneuse : point vers ${parId[l.vers].nom} décalé de ${r.ecart.toFixed(1)} px à l'arrêt ${a.nom}`);
      }
    }
    // transitions réelles (animées) : on arrive au regard prévu (lien.arrivee), sans rester entre deux
    const aSuivre = await o.pg.evaluate(() => typeof __visionneuse.suivre === 'function');
    if (!aSuivre) pb('Visionneuse : poignée de contrôle « suivre » absente (transitions non vérifiées)');
    let pireSaut = 0, pireVit = 0;
    if (aSuivre) for (const a of visite.arrets) for (const l of a.liens) {
      await o.pg.evaluate(id => __visionneuse.aller(id, true), a.id); await pret(o);
      // regard suivi image par image pendant la transition (constat du 28/09/2026 : saut de 110° en 220 ms au milieu du fondu)
      await o.pg.evaluate(v => { window.__trace = []; const f = () => { const e = __visionneuse.etat(); __trace.push([performance.now(), e.lacet]); if (__trace.length < 3000 && !(e.cur === v && __visionneuse.pret())) requestAnimationFrame(f); }; requestAnimationFrame(f); }, l.vers);
      const ok = await o.pg.evaluate(v => __visionneuse.suivre(v), l.vers); if (!ok) continue;
      await o.pg.waitForFunction(v => __visionneuse.pret() && __visionneuse.etat().cur === v, { timeout: 30000 }, l.vers).catch(() => null);
      const tr = await o.pg.evaluate(() => window.__trace);
      let saut = 0, vit = 0;
      for (let i = 1; i < tr.length; i++) saut = Math.max(saut, Math.abs(angD(tr[i][1] - tr[i - 1][1])));
      for (let i = 0, j = 0; i < tr.length; i++) { while (tr[i][0] - tr[j][0] > 150) j++; if (tr[i][0] - tr[j][0] >= 100) { let s = 0; for (let q = j + 1; q <= i; q++) s += angD(tr[q][1] - tr[q - 1][1]); vit = Math.max(vit, Math.abs(s) / ((tr[i][0] - tr[j][0]) / 1000)); } }
      pireSaut = Math.max(pireSaut, saut); pireVit = Math.max(pireVit, vit);
      if (saut > 10 * DEG) pb(`Visionneuse : ${a.nom} → ${parId[l.vers].nom} : le regard saute de ${(saut / DEG).toFixed(0)}° d'une image à l'autre pendant la transition`);
      else if (vit > 160 * DEG) pb(`Visionneuse : ${a.nom} → ${parId[l.vers].nom} : le regard tourne à ${(vit / DEG).toFixed(0)}°/s pendant la transition`);
      const e = await etat(o);
      if (e.cur !== l.vers) { pb(`Visionneuse : ${a.nom} → ${parId[l.vers].nom} n'arrive pas`); continue; }
      arrivees++;
      if (Math.abs(angD(e.lacet - (l.arrivee ?? l.lacet))) > 2 * DEG) pb(`Visionneuse : ${a.nom} → ${parId[l.vers].nom} : regard d'arrivée à ${(Math.abs(angD(e.lacet - l.arrivee)) / DEG).toFixed(0)}° du regard prévu`);
    }
    const textes = await o.pg.evaluate(() => document.body.innerText);
    if (/[_{}]|undefined|null|NaN|\.(jpg|png|json)|Error/i.test(textes)) pb('Visionneuse : texte technique affiché');
    for (const c of await caches(o)) pb(`Visionneuse (ordinateur) : élément caché affiché (${c})`);
    // mention « Illustration non contractuelle » : contraste du texte sur son fond posé sur blanc (le pire)
    const contraste = await o.pg.evaluate(() => {
      const el = document.querySelector('.mention'), cs = getComputedStyle(el), rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
      const [r, g, b] = rgb(cs.color), f = rgb(cs.backgroundColor), a = f.length > 3 ? f[3] : f.length === 3 ? 1 : 0;
      const sur = v => v * a + 255 * (1 - a), lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      const Lm = (x, y, z) => 0.2126 * lin(x) + 0.7152 * lin(y) + 0.0722 * lin(z);
      const L1 = Lm(r, g, b), L2 = Lm(sur(f[0] || 0), sur(f[1] || 0), sur(f[2] || 0));
      return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    });
    M.contraste_mention = +contraste.toFixed(2);
    if (contraste < 4.5) pb(`Visionneuse : mention peu lisible (contraste ${contraste.toFixed(1)}:1, 4,5:1 au moins)`);
    // retour du navigateur : la pièce précédente
    if (aSuivre) {
      const a = visite.arrets.find(x => x.liens.length); await o.pg.evaluate(id => __visionneuse.aller(id, true), a.id); await pret(o);
      const v = a.liens[0].vers; await o.pg.evaluate(v => __visionneuse.suivre(v, true), v);
      await o.pg.waitForFunction(v => __visionneuse.pret() && __visionneuse.etat().cur === v, { timeout: 30000 }, v).catch(() => null);
      await o.pg.goBack({ timeout: 5000 }).catch(() => null);
      await o.pg.waitForFunction(id => __visionneuse.pret() && __visionneuse.etat().cur === id, { timeout: 15000 }, a.id).catch(() => null);
      const e = await etat(o).catch(() => ({}));
      if (e.cur !== a.id) pb('Visionneuse : le retour du navigateur ne ramène pas à la pièce précédente');
    }
    const versionManque = o.requetes.filter(u => /\.(jpg|png|json|js)(\?|$)/.test(u) && !/[?&]v=/.test(u));
    for (const u of versionManque) pb(`Visionneuse : adresse sans version (le navigateur pourrait montrer une ancienne image) : ${new URL(u).pathname}`);
    const hors = o.requetes.filter(u => !u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:'));
    for (const u of hors) pb(`Visionneuse : requête hors du dossier du 360° ${u.slice(0, 120)}`);
    if (await o.pg.evaluate(() => typeof window.App !== 'undefined')) pb('Visionneuse : le moteur est chargé');
    for (const v of await o.pg.evaluate(() => window.__csp)) pb(`Visionneuse : politique de contenu enfreinte (${v})`);
    for (const e of [...o.erreurs, ...o.console]) pb(`Visionneuse : console ${e.slice(0, 140)}`);
    Object.assign(M, { points_verifies: vus, ecart_max_px: +pire.toFixed(2), transitions: arrivees, requetes: o.requetes.length, saut_max_deg: +(pireSaut / DEG).toFixed(1), rotation_max_deg_s: +(pireVit / DEG).toFixed(0) });
    if (await o.pg.evaluate(() => !document.getElementById('retour').hidden)) pb('Visionneuse : bouton de retour à la visite 3D montré sans venir de la visite');
    await fermer(o);

    /* ---------- ouverte depuis la visite 3D (bouton 360°, retour R4) : regard transmis, bouton « Visite 3D » vers le même endroit ---------- */
    {
      const a = parId[depart], cap = +(a.cap + 0.7).toFixed(3), r = await ouvrir('ordinateur', { hash: `?depuis=visite&cap=${cap}#${encodeURIComponent(depart)}` });
      const e = await etat(r), vu = await r.pg.evaluate(() => !document.getElementById('retour').hidden);
      if (Math.abs(angD(e.lacet - cap)) > 0.01) pb('Visionneuse ouverte depuis la visite 3D : le regard transmis (&cap=) n\'est pas appliqué');
      if (!vu) pb('Visionneuse ouverte depuis la visite 3D : pas de bouton de retour à la visite 3D');
      else {
        await r.pg.evaluate(() => __visionneuse.regarder(1.234, 0));
        const u = await r.pg.evaluate(() => __visionneuse.urlRetour()), q = new URL(u, base).searchParams.get('vue'), n = q ? q.split(',').map(Number) : [];
        if (!Array.isArray(a.pos)) pb('Visionneuse : visite.json sans position des points de vue (retour à la visite 3D au même endroit impossible)');
        else if (n.length !== 4 || Math.hypot(n[0] - a.pos[0], n[1] - a.pos[1]) > 0.01 || n[2] !== (a.niveau ?? 0) || Math.abs(n[3] - 1.234) > 0.002)
          pb(`Visionneuse : le retour à la visite 3D ne vise pas le point de vue courant (${u})`);
        M.retour_visite = u;
      }
      for (const c of await caches(r)) pb(`Visionneuse (depuis la visite) : élément caché affiché (${c})`);
      await fermer(r);
    }

    /* ---------- définition : ordinateur rétine et téléphone ---------- */
    for (const nom of ['retine', 'iphone']) {
      const p = await ouvrir(nom); await nette(p); await wait(1500); const e = await etat(p);
      const cw = await p.pg.evaluate(() => document.getElementById('vue').width);
      const besoin = e.besoin ?? cw / e.h * 360, agr = besoin / e.L; M[`agrandissement_${nom}`] = +agr.toFixed(2); M[`panorama_${nom}`] = e.L;
      if (agr > 1.5) pb(`Visionneuse (${nom}) : image agrandie ${agr.toFixed(2)} fois (1,5 au plus)`);
      if (cw !== Math.round(e.W * PROFILS[nom].viewport.deviceScaleFactor)) pb(`Visionneuse (${nom}) : canevas de ${cw} px pour ${e.W} px à la densité ${PROFILS[nom].viewport.deviceScaleFactor}`);
      await fermer(p);
    }

    /* ---------- téléphone : champ, cercles, écran tourné, boutons ---------- */
    for (const nom of ['iphone', 'android']) {
      const p = await ouvrir(nom), e = await etat(p);
      M[`champ_${nom}`] = +e.h.toFixed(1);
      if (e.h < 65) pb(`Visionneuse (${nom}) : champ par défaut de ${e.h.toFixed(0)}° en largeur (65° au moins)`);
      for (const c of await caches(p)) pb(`Visionneuse (${nom}) : élément caché affiché (${c})`);
      if (nom === 'iphone') {
        let petit = 99;
        for (const a of visite.arrets) {
          await p.pg.evaluate(id => __visionneuse.aller(id, true), a.id); await pret(p);
          for (const l of a.liens) {
            const r = await p.pg.evaluate((v, l, t) => __visionneuse.verifierPoint(v, l, t), l.vers, l.lacet, l.tangage);
            if (!r) continue; petit = Math.min(petit, r.boite[3]);
            if (r.boite[3] < 13.5) pb(`Visionneuse (téléphone) : cercle vers ${parId[l.vers].nom} de ${r.boite[3].toFixed(0)} px de haut à l'arrêt ${a.nom}`);
          }
        }
        M.cercle_min_px = +petit.toFixed(1);
        // écran tourné : portrait → paysage → portrait
        await p.pg.evaluate(id => __visionneuse.aller(id, true), depart); await pret(p);
        const h0 = (await etat(p)).h;
        await p.pg.setViewport({ ...PROFILS.iphone.viewport, width: 844, height: 390 }); await wait(400);
        const h1 = (await etat(p)).h;
        const carte = await p.pg.evaluate(() => { const r = document.getElementById('carte').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, W: innerWidth, H: innerHeight, vu: getComputedStyle(document.getElementById('carte')).visibility }; });
        await p.pg.setViewport(PROFILS.iphone.viewport); await wait(400);
        const h2 = (await etat(p)).h;
        M.rotation = { portrait: +h0.toFixed(1), paysage: +h1.toFixed(1), retour: +h2.toFixed(1) };
        if (h1 < 60 || h1 > 125) pb(`Visionneuse (téléphone tourné) : champ de ${h1.toFixed(0)}° en largeur en paysage`);
        if (Math.abs(h2 - h0) > 1) pb(`Visionneuse (téléphone tourné) : champ de ${h0.toFixed(0)}° devenu ${h2.toFixed(0)}° après un aller-retour portrait / paysage`);
        if (carte.x < -1 || carte.y < -1 || carte.x + carte.w > carte.W + 1 || carte.y + carte.h > carte.H + 1) pb('Visionneuse (téléphone en paysage) : plan hors de l\'écran');
        if (carte.w * carte.h > 0.3 * carte.W * carte.H) pb(`Visionneuse (téléphone en paysage) : plan sur ${Math.round(100 * carte.w * carte.h / carte.W / carte.H)} % de l'écran`);
      }
      if (nom === 'android') {
        /* vrais gestes (événements tactiles du navigateur, pas les poignées de contrôle) : glisser tourne la vue, pincer zoome comme
           l'écartement des doigts (tangente du demi-champ ; un zoom sur l'angle fuyait sous les doigts : ×3,4 pour ×2,3), toucher un
           cercle mène à son arrêt, toucher à côté ne fait rien */
        const cdp = await p.pg.createCDPSession();
        const touche = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ x: q[0], y: q[1], id: i })) });
        await p.pg.evaluate(id => __visionneuse.aller(id, true), depart); await pret(p);
        const g0 = await etat(p);
        await touche('touchStart', [[200, 420]]); for (let i = 1; i <= 10; i++) { await touche('touchMove', [[200 - 12 * i, 420]]); await wait(16); } await touche('touchEnd', []); await wait(700);
        const g1 = await etat(p), tourne = Math.abs(angD(g1.lacet - g0.lacet)) / DEG;
        if (tourne < 10) pb(`Visionneuse (téléphone) : glisser le doigt ne tourne pas la vue (${tourne.toFixed(0)}°)`);
        await touche('touchStart', [[150, 420], [240, 420]]); for (let i = 1; i <= 10; i++) { await touche('touchMove', [[150 - 4.5 * i, 420], [240 + 4.5 * i, 420]]); await wait(16); } await touche('touchEnd', []); await wait(300);
        const g2 = await etat(p), k = Math.tan(g1.fov * Math.PI / 360) / Math.tan(g2.fov * Math.PI / 360);
        M.pincement = { doigts: 2, image: +k.toFixed(2) };
        if (Math.abs(k - 2) > 0.2) pb(`Visionneuse (téléphone) : pincer ×2 zoome ×${k.toFixed(2)} (l'image doit suivre les doigts)`);
        await p.pg.evaluate(() => { const e = __visionneuse.etat(); __visionneuse.regarder(e.lacet, e.tangage); });
        await p.pg.evaluate(id => __visionneuse.aller(id, true), depart); await pret(p);
        const l0 = parId[depart].liens[0];
        if (l0) {
          await p.pg.evaluate(l => __visionneuse.regarder(l.lacet, Math.max(-0.6, l.tangage)), l0); await wait(200);
          const c = await p.pg.evaluate(v => { const g = [...document.querySelectorAll('#points g.pt')].find(g => g.getAttribute('aria-label').includes(v) && g.style.display !== 'none'); if (!g) return null; const x = +g.dataset.x, y = +g.dataset.y; return x > 5 && x < innerWidth - 5 && y > 5 && y < innerHeight - 5 ? { x, y } : null; }, parId[l0.vers].nom);
          const avant = (await etat(p)).cur;
          await p.pg.touchscreen.tap(20, 200); await wait(900);
          if ((await etat(p)).cur !== avant) pb('Visionneuse (téléphone) : toucher l\'image hors d\'un cercle change de pièce');
          if (!c) pb(`Visionneuse (téléphone) : cercle vers ${parId[l0.vers].nom} hors de l'écran quand on le regarde`);
          else {
            await p.pg.touchscreen.tap(c.x, c.y);
            await p.pg.waitForFunction(v => __visionneuse.pret() && __visionneuse.etat().cur === v, { timeout: 20000 }, l0.vers).catch(() => null);
            if ((await etat(p)).cur !== l0.vers) pb(`Visionneuse (téléphone) : toucher le cercle vers ${parId[l0.vers].nom} n'y mène pas`);
          }
        }
      }
      for (const x of [...p.erreurs, ...p.console]) pb(`Visionneuse (${nom}) : console ${x.slice(0, 140)}`);
      await fermer(p);
    }

    /* ---------- robustesse ---------- */
    // toutes les images absentes : message, pas d'écran noir sans explication
    {
      const p = await ouvrir('ordinateur', { bloque: u => /\.jpg(\?|$)/.test(u), attendre: false });
      await p.pg.waitForFunction(() => getComputedStyle(document.getElementById('erreur')).display !== 'none', { timeout: 20000 }).catch(() => null);
      const vu = await p.pg.evaluate(() => getComputedStyle(document.getElementById('erreur')).display !== 'none' && !document.getElementById('reessayer').hidden);
      if (!vu) pb('Visionneuse : images absentes au départ sans message ni bouton pour réessayer');
      await fermer(p);
    }
    // voisin absent : on reste à l'arrêt courant, message
    {
      const a = parId[depart], v = a.liens[0] && a.liens[0].vers;
      if (v && aSuivre) {
        const p = await ouvrir('ordinateur', { bloque: u => u.includes(`/${encodeURIComponent(v)}-`) });
        await p.pg.evaluate(v => __visionneuse.suivre(v), v); await wait(6500);
        const e = await etat(p);
        if (e.cur !== depart || !e.reseau) pb('Visionneuse : image d\'un voisin absente, la pièce change quand même ou sans message');
        if (await p.pg.evaluate(() => __visionneuse.luminance()) < 0.04) pb('Visionneuse : écran noir quand l\'image d\'un voisin manque');
        await fermer(p);
      }
    }
    // perte du contexte WebGL puis retour
    {
      const p = await ouvrir('ordinateur');
      await p.pg.evaluate(async () => { const x = document.getElementById('vue').getContext('webgl').getExtension('WEBGL_lose_context'); x.loseContext(); await new Promise(r => setTimeout(r, 300)); x.restoreContext(); });
      const t0 = Date.now(); let lum = 0;
      while (Date.now() - t0 < 3000) { await wait(200); lum = await p.pg.evaluate(() => __visionneuse.luminance()).catch(() => 0); if (lum > 0.04) break; }
      M.contexte_retour_ms = Date.now() - t0;
      if (lum <= 0.04) pb('Visionneuse : image perdue après une perte du contexte WebGL');
      await fermer(p);
    }
    // adresse mal encodée ou inconnue : départ normal ; lien direct vers une pièce : aucun avertissement (préchargement utilisé)
    for (const h of ['#%E0%A4%A', '#inconnu']) {
      const p = await ouvrir('ordinateur', { hash: h }).catch(() => null);
      const e = p && await etat(p);
      if (!e || e.cur !== depart) pb(`Visionneuse : l'adresse ${h} ne démarre pas la visite`);
      if (p) await fermer(p);
    }
    {
      const autre = visite.arrets.find(a => a.id !== depart);
      if (autre) {
        const p = await ouvrir('ordinateur', { hash: '#' + encodeURIComponent(autre.id) }); await wait(3500);
        if ((await etat(p)).cur !== autre.id) pb('Visionneuse : un lien vers une pièce ne l\'ouvre pas');
        for (const x of [...p.erreurs, ...p.console]) pb(`Visionneuse (lien vers une pièce) : console ${x.slice(0, 140)}`);
        await fermer(p);
      }
    }
    // visite à un seul arrêt : l'aide ne parle pas de cercle
    {
      const un = { ...visite, arrets: [{ ...parId[depart], liens: [] }] };
      const p = await ouvrir('ordinateur', { remplace: Object.assign(/visite\.json/, { reponse: { status: 200, contentType: 'application/json', body: JSON.stringify(un) } }) });
      if (/cercle/i.test(await p.pg.evaluate(() => document.getElementById('aide').textContent))) pb('Visionneuse : une visite à un seul arrêt parle de cercles');
      await fermer(p);
    }
    // plan absent : caché, pas d'icône cassée
    {
      const p = await ouvrir('ordinateur', { bloque: u => /niveau-\d+\.png/.test(u) }); await wait(800);
      if (!(await p.pg.evaluate(() => document.getElementById('carte').hidden))) pb('Visionneuse : plan absent montré comme une image cassée');
      await fermer(p);
    }
    // réseau lent (téléphone, 780 kbit/s, 300 ms) : une image d'au moins 2048 en moins de 10 s
    {
      const pg = await b2.newPage(); ouvertes.push(pg); await pg.setUserAgent(IPHONE); await pg.setViewport(PROFILS.iphone.viewport);
      const cdp = await pg.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 780 * 1024 / 8, uploadThroughput: 330 * 1024 / 8 });
      const t0 = Date.now(); await pg.goto(base);
      const ok = await pg.waitForFunction(() => window.__visionneuse && (__visionneuse.etat().L || 0) >= 2048, { timeout: 20000, polling: 100 }).then(() => true).catch(() => false);
      M.reseau_lent_2048_s = ok ? +((Date.now() - t0) / 1000).toFixed(1) : null;
      if (!ok || Date.now() - t0 > 10000) pb(`Visionneuse (réseau lent) : image de 2048 px ${ok ? `en ${((Date.now() - t0) / 1000).toFixed(1)} s` : 'pas arrivée en 20 s'} (10 s au plus)`);
      await pg.close(); ouvertes.splice(ouvertes.indexOf(pg), 1);
    }
    // gel à l'arrivée au téléphone (processeur ralenti 4 fois) : plus longue image des 3 s qui suivent (mesure, machine partagée)
    {
      const p = await ouvrir('android'); const cdp = await p.pg.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const v = parId[depart].liens[0] && parId[depart].liens[0].vers;
      if (v && aSuivre) {
        const max = await p.pg.evaluate(async v => {
          let prec = performance.now(), m = 0, fin = prec + 3000; __visionneuse.suivre(v);
          await new Promise(res => { const f = t => { m = Math.max(m, t - prec); prec = t; if (t < fin) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
          return m;
        }, v);
        M.gel_arrivee_ms = Math.round(max);
        if (max > 250) pb(`Visionneuse (téléphone) : l'écran se fige ${Math.round(max)} ms à l'arrivée dans une pièce`);
      }
      await fermer(p);
    }
  } catch (e) {
    pb(`Visionneuse : contrôle interrompu (${String(e.message || e).slice(0, 120)})`);
  } finally {
    await b2.close();
  }
}
