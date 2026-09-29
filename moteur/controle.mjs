/* Visite de contrôle, sans IA : ouvre la visite d'un plan dans Chrome et vérifie avec le vrai moteur
   que chaque pièce est accessible depuis l'entrée, que chaque porte se franchit au clavier, que chaque baie est dégagée, que chaque vue
   est prise dans une zone libre et ne fixe pas un mur à bout portant, que rien ne dépasse des murs dans la maquette et qu'aucune cloison du
   plan de vente n'est dessinée en voile. Plan sur plusieurs niveaux : les mêmes contrôles niveau par niveau,
   plus escaliers (montée et descente au clavier, marches, échappée, arrivée), vides (garde-corps, rien dedans), dalles (ni trou ni face
   superposée), niveaux (vues au bon étage, ids uniques, aucun appel sans niveau) et lampes. Navigation : depuis chaque arrêt intérieur,
   un clic mène toujours quelque part (jamais dans un placard, hors des pièces ou sur un autre niveau, au point visé s'il est libre), et à
   la souris le regard suit la main, un geste n'a qu'un effet, le clic droit ne fait rien. Rendu : matières jamais noires ni uniformes ;
   dans une vraie visite (sans ?shoot=1), de jour et de nuit, l'image avec culling est celle sans culling, et le rendu photoréaliste
   lancé en marchant reçoit la scène entière.
   Fentes : dehors vu depuis un bord de pièce (rayons doublés à ±2 mm, jamais une arête commune sans largeur), fentes fines de 1 cm le
   long des bords sans pièce voisine, fentes aux jambages des baies vues en biais (dalle brute, vide, placard ou pièce voisine au-delà du
   nu). Placards fermés sur tous leurs côtés sauf la façade (intérieur jamais vu depuis où l'on se tient), coffret du tableau adossé à un
   mur, plinthe jamais en travers d'un passage, arrêts et photos hors du débattement des portes et de la cuisine indicative, noms de pièces
   sans capitales ni abréviation, vitrages sans reflet ponctuel des lampes, portes conformes à leur arc sur le plan de vente (vectoriel ou
   image), moteur servi avec la visite (aucun script chargé depuis le réseau).
   Constats du 28/09/2026 : tableau électrique vu d'un point où l'on se tient (ou derrière une porte, vantail conforme au dessin d'un plan
   en image), gaine au symbole de la légende présente, descente d'eaux pluviales écrite ou dessinée présente, soffites (plafond abaissé,
   jamais la hauteur générale écrite), vasque et sèche-serviettes conformes à leur rectangle, aucun mur sur une partie d'aplat masquée
   par la découpe du PDF, voiles du plan couverts, nus d'une même paroi sans marche, emplacements d'appareils en pointillés repris, pas
   d'arrêt dans un réduit de moins de 2 m², photos qui cadrent une baie ou un passage, ombres des garde-corps de loggia, plan 2D sans texte
   technique et dessins d'équipement dans leur rectangle, et au rendu : raccords (face prise entre deux faces d'un mur) et fentes fines
   (moins de 4 mm, jour d'une coulisse de brise-soleil) vus depuis chaque arrêt.
   Rendu simple (retour R4 du 29/09/2026) : bascule vers l'ultra réaliste et retour sans reste, nuit sans effet, pièces ni sombres ni
   brûlées, matières peintes lisibles et sans tache de reflet ; bouton 360° vers le bon point de vue et aller-retour.
   Usage : node moteur/controle.mjs plans/<id>   → écrit plans/<id>/controle.json, code 0 si tout passe. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = process.argv[2];
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const port = server.address().port;

// plan brut : ids en double et éléments écartés au chargement ne se voient plus dans App.D
let brut = null; try { brut = JSON.parse(fs.readFileSync(path.join(root, dir, 'plan.json'), 'utf8')); } catch (e) {}
const MULTI = !!(brut && Array.isArray(brut.levels) && brut.levels.length > 1);

const problems = [], errors = [], manque = new Set(), avert = new Set();
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const page = await browser.newPage(); await page.setViewport({ width: 480, height: 300 });
page.on('pageerror', e => errors.push(e.message));
// moteur servi avec la visite (fiche C9 : three.js depuis cdn.jsdelivr.net, une coupure du réseau faisait échouer la visite de contrôle)
const scriptsReseau = new Set();
page.on('request', r => { const u = r.url(); if (['script', 'fetch', 'xhr'].includes(r.resourceType()) && /^https?:/.test(u) && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(u)) scriptsReseau.add(new URL(u).host); });
// appel d'une API spatiale sans niveau sur un plan à plusieurs niveaux : le moteur l'écrit dans la console
page.on('console', m => { const t = m.text(); if (t.startsWith('immersion') || t.startsWith('visibilité')) console.error(t);
  if (m.type() === 'error' && t.includes('niveau manquant')) manque.add(t.replace(/^.*niveau manquant\s*:\s*/, ''));
  if (MULTI && (m.type() === 'warning' || m.type() === 'warn') && /niveau inconnu|écarté \(hors format\) : (escalier|vide)/.test(t)) avert.add(t.replace(/^plan\.json : /, '')); });
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
try {
  await page.goto(`http://localhost:${port}/${dir}/?shoot=1`);
  await page.waitForFunction(() => window.App && (window.App.engine || document.getElementById('err')), { timeout: 180000 });
} catch (e) { errors.push('La visite ne se charge pas : ' + e.message); }
if (!errors.length && await page.evaluate(() => !window.App.engine)) errors.push(await page.evaluate(() => document.getElementById('err')?.textContent || 'moteur 3D non démarré'));

if (!errors.length) {
  await page.addStyleTag({ content: '.ui, #gallery { display:none !important }' });
  const res = await page.evaluate(async (sansArret) => {
    const out = [], D = App.D, V = __v, G = App.geo, T = V.THREE;
    // plan à un niveau : appels et textes d'origine ; plusieurs niveaux : niveau explicite partout, niveau dans chaque problème
    const MULTI = !!D.multi, LV = V.levels || [{ y: 0, H: D.H }], lvOf = o => (o && o.level) || 0, Y = k => MULTI ? LV[k].y : 0;
    const roomAt = (x, z, k) => MULTI ? App.roomAt(x, z, k) : App.roomAt(x, z);
    const collide = (x, z, r, k) => MULTI ? V.collide(x, z, r, k) : V.collide(x, z, r);
    const nom = k => MULTI ? ` (${App.levelName(k)})` : '';
    const tag = (pb, k) => MULTI ? Object.assign(pb, { level: k }) : pb;
    const f2 = v => v.toFixed(2), pt = p => p.map(f2).join(' ; ');
    // niche du tableau électrique ouverte sur la pièce (façade du plan en trait fin, D201) : alcôve voulue, son fond est le coffret et la
    // cloison ; ce n'est ni une fente ni un vide derrière un jambage (le contrôle d'étanchéité, lui, vérifie qu'elle est fermée au fond)
    const nicheTab = (p, k) => (D.fixtures || []).some(f => f.type === 'tableau' && f.facade && f.x && f.z && lvOf(f) === k
      && p[0] > Math.min(...f.x) - 0.01 && p[0] < Math.max(...f.x) + 0.01 && p[1] > Math.min(...f.z) - 0.01 && p[1] < Math.max(...f.z) + 0.01);
    App.set('mode', 'walk');
    // toutes les portes ouvertes, comme pour quelqu'un qui visite
    V.operables.forEach(o => { const k = D.openings[o.id]?.kind; if (k === 'door' || k === 'french') { o.target = o.t = 1; o.apply(1); } });
    V.scene.updateMatrixWorld(true);
    const rooms = D.rooms.filter(r => !r.hidden);
    const start = D.stops[0]?.p || G.centroid(rooms[0].poly), lv0 = D.stops[0] ? lvOf(D.stops[0]) : lvOf(rooms[0]);
    // 1. chaque pièce accessible depuis l'entrée, par le vrai calcul d'itinéraire (en montant les escaliers)
    for (const r of rooms) {
      const c = G.centroid(r.poly), k = lvOf(r); let tgt = null;
      // un point libre dans la pièce, au plus près du centre
      for (let rad = 0; rad <= 2.5 && !tgt; rad += 0.1) for (let a = 0; a < 16 && !tgt; a++) {
        const x = c[0] + Math.cos(a / 16 * 6.283) * rad, z = c[1] + Math.sin(a / 16 * 6.283) * rad;
        if (G.pointInPoly(x, z, r.poly)) { const [cx, cz] = collide(x, z, 0.2, k); if (Math.hypot(cx - x, cz - z) < 0.01 && G.pointInPoly(cx, cz, r.poly)) tgt = [x, z]; }
      }
      if (!tgt) { out.push(tag({ type: 'piece', id: r.id, texte: `La pièce « ${r.name} »${nom(k)} n'a aucun endroit où se tenir debout.` }, k)); continue; }
      const P = MULTI ? V.findPath(start[0], start[1], lv0, tgt[0], tgt[1], k) : V.findPath(start[0], start[1], tgt[0], tgt[1]);
      const end = P && P[P.length - 1];
      if (!P || Math.hypot(end[0] - tgt[0], end[1] - tgt[1]) > 0.25 || (MULTI && end[2] !== k)) out.push(tag({ type: 'piece', id: r.id, texte: `La pièce « ${r.name} »${nom(k)} n'est pas accessible depuis l'entrée.` }, k));
    }
    // 1 bis. chaque porte et porte-fenêtre se franchit au clavier, pas à pas avec le vrai pas de marche du moteur
    // (1,35 m/s à 60 et 120 images/s, porte ouverte, dans les deux sens, 12 départs décalés d'une fraction de pas) :
    // l'itinéraire sur grille de 8 cm ne voit pas une fente entre un seuil et une pièce, le visiteur si.
    const isRoom = r => r && r.id !== 'placard' && !(r.hidden && !r.of);
    for (const [id, o] of Object.entries(D.openings)) {
      if (o.kind !== 'door' && o.kind !== 'french') continue;
      const k = lvOf(o), m = (o.s[0] + o.s[1]) / 2, along = (x, z) => G.V.dot(G.V.sub([x, z], o.main.a), o.T);
      const walkMove = (x, z, mx, mz) => MULTI ? V.walkMove(x, z, mx, mz, k) : V.walkMove(x, z, mx, mz); // pas enchaînés : le moteur reprend le sol du pas précédent
      // pièce contre chaque face, à 30 cm au plus : sinon la porte donne sur un placard, une niche ou le palier
      const sideRoom = sg => { for (let d = 0.02; d <= 0.3; d += 0.02) { const r = roomAt(...o.pt(m, sg < 0 ? -d : o.depth + d), k); if (r) return r; } return null; };
      if (!isRoom(sideRoom(-1)) || !isRoom(sideRoom(1))) continue;
      // porte d'un coffret de tableau (niche hors des pièces, 3124) : on ne la franchit pas, la pièce trouvée au-delà est derrière le mur du fond
      if ((D.fixtures || []).some(f => f.type === 'tableau' && f.x && f.z && lvOf(f) === k && [-0.08, o.depth + 0.08].some(d => { const p = o.pt(m, d);
        return p[0] > Math.min(...f.x) - 0.01 && p[0] < Math.max(...f.x) + 0.01 && p[1] > Math.min(...f.z) - 0.01 && p[1] < Math.max(...f.z) + 0.01; }))) continue;
      let bad = null;
      for (const dirn of [1, -1]) {
        const d0 = dirn > 0 ? -0.6 : o.depth + 0.6, goal = dirn > 0 ? o.depth + 0.3 : -0.3;
        const s = [m, m - 0.12, m + 0.12].find(ss => { const p = o.pt(ss, d0), [cx, cz] = collide(p[0], p[1], 0.18, k); return roomAt(...p, k) && Math.hypot(cx - p[0], cz - p[1]) < 0.01; });
        if (s == null) continue; // départ encombré : l'accessibilité des pièces est vérifiée plus haut
        for (const fps of [60, 120]) for (let kk = 0; kk < 12 && !bad; kk++) {
          const step = 1.35 / fps, mx = o.T[0] * step * dirn, mz = o.T[1] * step * dirn;
          let [x, z] = o.pt(s, d0 - dirn * step * kk / 12), still = 0;
          for (let f = 0; f < Math.ceil((1.3 + o.depth) / step) + 60; f++) {
            const [nx, nz, refused] = walkMove(x, z, mx, mz);
            if (refused) { bad = { d: along(x, z), fps }; break; }
            still = Math.hypot(nx - x, nz - z) < 1e-4 ? still + 1 : 0; x = nx; z = nz;
            if ((along(x, z) - goal) * dirn >= 0) break; // passé
            if (still > 20) { bad = { d: along(x, z), fps, bloque: true }; break; } // arrêté net dans la baie : garde-corps, mur, meuble
          }
        }
      }
      if (bad) out.push(tag({ type: 'passage', id, texte: bad.bloque ? `La porte « ${o.label || id} »${nom(k)} ne se franchit pas : le visiteur est arrêté à ${bad.d.toFixed(2)} m du nu du mur (obstacle dans la baie).`
        : `La porte « ${o.label || id} »${nom(k)} ne se franchit pas au clavier : le pas est refusé à ${bad.d.toFixed(2)} m du nu du mur (${bad.fps} i/s), une fente sépare le seuil de la pièce.` }, k));
    }
    // 1 ter. une porte-fenêtre qui s'ouvre sur un balcon ou une loggia n'a pas de garde-corps dans son tableau
    for (const [id, o] of Object.entries(D.openings)) {
      if (o.kind !== 'french' || !o.gc) continue;
      const k = lvOf(o), r = roomAt(...o.pt((o.s[0] + o.s[1]) / 2, o.depth + 0.35), k);
      if (App.isExt(r)) out.push(tag({ type: 'passage', id, texte: `La porte-fenêtre « ${o.label || id} »${nom(k)} a un garde-corps en travers alors qu'elle donne sur « ${r.name || r.id} ».` }, k));
    }
    // 1 quater. étanchéité : depuis chaque bord de pièce intérieure, à trois hauteurs au-dessus de son sol, un rayon vers l'extérieur doit
    // rencontrer un mur, une menuiserie ou une autre pièce dans les 60 cm ; sinon on voit dehors par une fente
    {
      const rc = new T.Raycaster(), tout = [V.G.arch, V.G.fixed, V.G.doors, V.G.windows].filter(Boolean), fuites = [];
      // les baies, elles, laissent voir dehors ou la pièce voisine : on les écarte (avec 6 cm de marge le long de la baie)
      // portes et portes-fenêtres ouvertes pour le contrôle : on voit au travers, c'est normal (au centimètre près de la
      // baie : une fente entre le jambage et le cadre, elle, est signalée). Les fenêtres restent fermées : le vitrage arrête le rayon.
      const inOp = (px, pz, k) => Object.values(D.openings).some(o => { if (o.kind === 'window' || lvOf(o) !== k) return false;
        const p0 = o.pt(0, 0), p1 = o.pt(1, 0), ux = p1[0] - p0[0], uz = p1[1] - p0[1];
        const sv = (px - p0[0]) * ux + (pz - p0[1]) * uz, dv = (px - p0[0]) * o.T[0] + (pz - p0[1]) * o.T[1];
        return sv > o.s[0] + 0.01 && sv < o.s[1] - 0.01 && dv > -0.2 && dv < o.depth + 0.2; });
      // bord sur un vide du même niveau ou sur l'emprise d'un escalier : côté ouvert voulu, garde-corps et escalier ont leurs contrôles
      const ouvert = (px, pz, k) => MULTI && ((V.voids || []).some(v => v.level === k && G.pointInPoly(px, pz, v.poly)) || (V.stairs || []).some(s => s.from === k && G.pointInPoly(px, pz, s.poly)));
      for (const r of D.rooms) {
        if (r.hidden || r.of || App.isExt(r)) continue;
        const k = lvOf(r), walls = D.walls.filter(w => lvOf(w) === k), gaines = (D.gaines || []).filter(g => lvOf(g) === k);
        const pl = r.poly, sgn = G.polyArea(pl) > 0 ? 1 : -1;
        for (let i = 0; i < pl.length; i++) {
          const a = pl[i], b = pl[(i + 1) % pl.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue;
          const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nrm = [u[1] * sgn, -u[0] * sgn];
          if (G.pointInPoly(a[0] + u[0] * L / 2 + nrm[0] * 0.05, a[1] + u[1] * L / 2 + nrm[1] * 0.05, pl)) nrm = [-nrm[0], -nrm[1]]; // vers l'extérieur de la pièce
          let run = null;
          for (let t = 0.04; t <= L - 0.04; t += 0.04) {
            const x = a[0] + u[0] * t - nrm[0] * 0.08, z = a[1] + u[1] * t - nrm[1] * 0.08; // 8 cm dans la pièce : hors des cadres et des plinthes
            // départ dans un mur ou une gaine posée dans la pièce : le rayon ne verrait rien, ce n'est pas une fente
            if (walls.some(w => !w.virtual && w.quad && G.pointInPoly(x, z, w.quad)) || gaines.some(g => G.pointInPoly(x, z, g.poly))) { if (run) { fuites.push({ r, run, nrm }); run = null; } continue; }
            const q = [x + nrm[0] * 0.4, z + nrm[1] * 0.4], voisin = roomAt(q[0], q[1], k);
            let fuit = false;
            if ((!voisin || voisin === r || App.isExt(voisin)) && !inOp(x + nrm[0] * 0.13, z + nrm[1] * 0.13, k) && !ouvert(x + nrm[0] * 0.13, z + nrm[1] * 0.13, k)) for (const y of [0.33, 1.21, 2.37]) { // jamais pile sur une arête (linteau à 2,20)
              // une vraie fente a une largeur : les rayons à 2 mm de part et d'autre passent tous les deux. Un rayon pile dans le plan où deux
              // maillages se touchent ne touche ni l'un ni l'autre (D201 : jambage de la porte palière en x = 2,550, « fente » sans largeur,
              // invisible au rendu, que repare_moteur ne pouvait pas refermer)
              const passe = dt => { rc.set(new T.Vector3(x + u[0] * dt, Y(k) + y, z + u[1] * dt), new T.Vector3(nrm[0], 0, nrm[1])); rc.far = 0.65;
                return !rc.intersectObjects(tout, true).some(h => h.object.isMesh && h.object.visible); };
              if (passe(-0.002) && passe(0.002)) { fuit = true; break; }
            }
            if (fuit) { run = run || [[x, z], [x, z]]; run[1] = [x, z]; }
            else if (run) { fuites.push({ r, run, nrm }); run = null; }
          }
          if (run) fuites.push({ r, run, nrm });
        }
      }
      for (const f of fuites) out.push(tag({ type: 'fuite', id: f.r.id, a: f.run[0], b: f.run[1], n: f.nrm, texte: `On voit dehors par une fente dans « ${f.r.name || f.r.id} »${nom(lvOf(f.r))} (${f.run[0].map(v => v.toFixed(2)).join(' ; ')}).` }, lvOf(f.r)));
    }
    // 1 quater bis. fentes fines dans les murs : le long de chaque bord de pièce intérieure qui ne donne ni sur une autre pièce (placard
    // compris), ni sur une baie, ni sur un vide ou un escalier, tous les 5 mm, deux rayons perpendiculaires (à 2 mm l'un de l'autre, à
    // 0,33, 1,21 et 2,0 m) partis à 8 cm dans la pièce doivent toucher le mur dans les 11,5 cm. Une fente de 1 cm, vers le dehors ou un vide,
    // ne passe plus (les rayons d'étanchéité, tous les 4 cm, laissent passer ce qui s'arrête à moins de 65 cm ; l'immersion, les trous de
    // moins de 4 cm). Vérifié en ouvrant une fente de 1 cm dans le mur de façade du séjour du D201.
    { V.cullRestore && V.cullRestore(); V.scene.updateMatrixWorld(true);
      const rc = new T.Raycaster(), boite = new T.Box3(), fins = [];
      const visO = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      const mailles = []; for (const g of [V.G.arch, V.G.fixed, V.G.doors, V.G.windows].filter(Boolean)) g.traverse(o => { if (o.isMesh && visO(o) && o.material && o.material.colorWrite !== false && o.material !== V.M?.hover) { boite.setFromObject(o); mailles.push({ o, b: boite.clone() }); } });
      const inOp = (px, pz, k) => Object.values(D.openings).some(o => { if (lvOf(o) !== k || !o.pt) return false;
        const p0 = o.pt(0, 0), sv = (px - p0[0]) * o.u[0] + (pz - p0[1]) * o.u[1], dv = (px - p0[0]) * o.T[0] + (pz - p0[1]) * o.T[1];
        return sv > o.s[0] - 0.005 && sv < o.s[1] + 0.005 && dv > -0.25 && dv < o.depth + 0.25; });
      for (const r of D.rooms) {
        if (r.hidden || r.of || App.isExt(r)) continue;
        const k = lvOf(r), Lk = MULTI ? D.L[k] : D, pl = r.poly, sgn = G.polyArea(pl) > 0 ? 1 : -1;
        const matiere = p => Lk.walls.some(w => !w.virtual && w.quad && G.pointInPoly(p[0], p[1], w.quad)) || (Lk.gaines || []).some(g => G.pointInPoly(p[0], p[1], g.poly));
        const ouvert = (px, pz) => MULTI && ((V.voids || []).some(v => v.level === k && G.pointInPoly(px, pz, v.poly)) || (V.stairs || []).some(s => s.from === k && G.pointInPoly(px, pz, s.poly)));
        for (let i = 0; i < pl.length; i++) {
          const a = pl[i], b = pl[(i + 1) % pl.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.03) continue;
          const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nrm = [u[1] * sgn, -u[0] * sgn];
          if (G.pointInPoly(a[0] + u[0] * L / 2 + nrm[0] * 0.02, a[1] + u[1] * L / 2 + nrm[1] * 0.02, pl)) nrm = [-nrm[0], -nrm[1]];
          const zone = new T.Box3(new T.Vector3(Math.min(a[0], b[0]) - 0.3, Y(k) - 0.1, Math.min(a[1], b[1]) - 0.3), new T.Vector3(Math.max(a[0], b[0]) + 0.3, Y(k) + 3, Math.max(a[1], b[1]) + 0.3));
          const sel = mailles.filter(m => m.b.intersectsBox(zone)).map(m => m.o);
          let run = null;
          for (let t = 0.02; t <= L - 0.02; t += 0.005) {
            const e = [a[0] + u[0] * t, a[1] + u[1] * t], x = e[0] - nrm[0] * 0.08, z = e[1] - nrm[1] * 0.08;
            let fuit = false;
            const q = [e[0] + nrm[0] * 0.02, e[1] + nrm[1] * 0.02], rq = roomAt(q[0], q[1], k);
            if ((!rq || rq === r) && !matiere([x, z]) && !inOp(e[0], e[1], k) && !ouvert(q[0], q[1]) && !nicheTab(q, k)) for (const y of [0.33, 1.21, 2.0]) {
              const passe = dt => { rc.set(new T.Vector3(x + u[0] * dt, Y(k) + y, z + u[1] * dt), new T.Vector3(nrm[0], 0, nrm[1])); rc.far = 0.115;
                return !rc.intersectObjects(sel, false).some(h => h.object.isMesh); };
              if (passe(-0.002) && passe(0.002)) { fuit = true; break; }
            }
            if (fuit) { run = run || [e, e]; run[1] = e; } else if (run) { fins.push({ r, run, nrm }); run = null; }
          }
          if (run) fins.push({ r, run, nrm });
        }
      }
      for (const f of fins) out.push(tag({ type: 'fente', id: f.r.id, a: f.run[0].map(v => +v.toFixed(3)), b: f.run[1].map(v => +v.toFixed(3)), n: f.nrm.map(v => +v.toFixed(4)),
        texte: `Fente dans un mur de « ${f.r.name || f.r.id} »${nom(lvOf(f.r))} : on voit au travers près de (${pt(f.run[0])}), sur ${Math.max(0.5, Math.hypot(f.run[1][0] - f.run[0][0], f.run[1][1] - f.run[0][1]) * 100 + 0.5).toFixed(0)} cm.` }, lvOf(f.r)));
    }
    // 1 quinquies. fentes aux jambages, regard en biais : une fente entre une huisserie et son mur (ou un mur arrêté quelques centimètres
    // avant le nu de la baie) laisse voir, en biais, l'intérieur d'une niche, la dalle brute, la pièce voisine ou le dehors. Constat du
    // 28/09/2026 (432, porte « Placard TE ») : fente sur toute la hauteur, dalle visible en bas, qu'aucun contrôle ne voyait (rayons
    // d'étanchéité tous les 4 cm, perpendiculaires au bord ; immersion : trous de 4 cm et plus). Pour chaque baie, de chaque côté où le
    // visiteur peut se tenir, on vise depuis 12 points de vue (droit, en biais des deux côtés, à 0,35 et 0,9 m, œil à 0,5 et 1,6 m) une
    // bande de 10 cm du nu du mur contre chaque jambage, tous les 4 mm, à cinq hauteurs. Le premier objet touché n'est jamais la dalle ; et
    // au-delà du nu, le rayon ne traverse pas plus de 3,5 cm (comptés perpendiculairement au mur : portes d'un placard en retrait) de vide :
    // ni l'air d'une pièce visitable (mur mince, pièce qui continue derrière le bout d'une cloison), ni la matière du plan, ni une baie.
    // Vérifié en remettant le défaut du 432 (refusé : dalle brute, intérieur du coffret).
    { V.cullRestore && V.cullRestore(); V.scene.updateMatrixWorld(true);
      const rc = new T.Raycaster(), O3 = new T.Vector3(), P3 = new T.Vector3(), d3 = new T.Vector3(), boite = new T.Box3();
      const visO = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      const arrete = m => { const ms = Array.isArray(m) ? m : [m]; return ms.some(q => q && q !== V.M?.hover && q.visible !== false && q.colorWrite !== false && !(q.transparent && q.opacity < 0.5 && q !== V.M?.glass)); };
      const mailles = []; for (const g of [V.G.arch, V.G.fixed, V.G.doors, V.G.windows].filter(Boolean)) g.traverse(o => { if (o.isMesh && visO(o) && arrete(o.material)) { boite.setFromObject(o); mailles.push({ o, b: boite.clone() }); } });
      const fentes = new Map();
      for (const [id, o] of Object.entries(D.openings)) {
        if (!o.pt || !o.s) continue;
        const k = lvOf(o), Hk = MULTI ? (LV[k].H || D.H) : D.H, Lk = MULTI ? D.L[k] : D;
        const hs = [0.03, 0.12, 0.5, 1.2, 1.9].filter(y => y < Hk - 0.05);
        const matiere = p => Lk.walls.some(w => !w.virtual && w.quad && G.pointInPoly(p[0], p[1], w.quad)) || (Lk.gaines || []).some(g => G.pointInPoly(p[0], p[1], g.poly))
          || (Lk.masses || []).some(m => G.pointInPoly(p[0], p[1], m.poly) && !(m.trous || []).some(h => G.pointInPoly(p[0], p[1], h)));
        const dansBaie = p => Object.values(D.openings).some(q => { if (!q.p0 || lvOf(q) !== k) return false; const sv = (p[0] - q.p0[0]) * q.u[0] + (p[1] - q.p0[1]) * q.u[1], dv = (p[0] - q.p0[0]) * q.T[0] + (p[1] - q.p0[1]) * q.T[1];
          return sv > -0.005 && sv < q.w + 0.005 && dv > -0.02 && dv < q.depth + 0.02; });
        const vide = p => { const r = roomAt(p[0], p[1], k); return !(r && !(r.hidden && !r.of)) && !matiere(p) && !dansBaie(p) && !nicheTab(p, k); };
        for (const [face, sg] of [[0, -1], [o.depth, 1]]) for (const [bout, sj, dir] of [['s0', o.s[0], -1], ['s1', o.s[1], 1]]) {
          // points de vue devant ce nu, où l'on peut se tenir, dans une pièce visitable
          const yeux = [];
          for (const a of [-0.45, 0.1, 0.6]) for (const b of [0.35, 0.9]) {
            const q = o.pt(sj - dir * a, face + sg * b), r = roomAt(q[0], q[1], k);
            if (!r || (r.hidden && !r.of)) continue;
            const [cx, cz] = collide(q[0], q[1], 0.15, k); if (Math.hypot(cx - q[0], cz - q[1]) > 1e-3) continue;
            for (const h of [0.5, 1.6]) yeux.push([q[0], Y(k) + h, q[1]]);
          }
          if (!yeux.length) continue;
          const c = o.pt(sj + dir * 0.05, face), zone = new T.Box3(new T.Vector3(c[0] - 1.3, Y(k) - 0.4, c[1] - 1.3), new T.Vector3(c[0] + 1.3, Y(k) + Hk + 0.4, c[1] + 1.3));
          const sel = mailles.filter(m => m.b.intersectsBox(zone)).map(m => m.o);
          for (let e = 0.003; e <= 0.1; e += 0.004) for (const y of hs) {
            const t = o.pt(sj + dir * e, face), T3 = [t[0], Y(k) + y, t[1]];
            for (const E of yeux) {
              O3.set(...E); P3.set(...T3); d3.copy(P3).sub(O3); const L = d3.length(); d3.normalize();
              rc.set(O3, d3); rc.near = 0; rc.far = L + 1.5;
              const h = rc.intersectObjects(sel, false).find(x => arrete(x.object.material));
              let quoi = h && /^slab/.test(h.object.userData.key || '') ? 'la dalle brute' : null;
              if (!quoi && (!h || h.distance > L + 0.01)) { // parcours au-delà du nu, tous les 5 mm : profondeur de vide traversée
                const fin = h ? h.distance - 0.005 : L + 1.5, dPerp = Math.abs(d3.x * o.T[0] + d3.z * o.T[1]) || 1e-6;
                let v = 0;
                for (let l = L + 0.0025; l < fin; l += 0.005) {
                  const P = [E[0] + d3.x * l, E[2] + d3.z * l];
                  if (vide(P)) { v += 0.005 * dPerp; if (v > 0.035) { quoi = !h ? 'le dehors' : 'un vide derrière le mur'; break; } }
                }
                if (quoi && h) { const P = [E[0] + d3.x * (h.distance - 0.01), E[2] + d3.z * (h.distance - 0.01)], r = roomAt(P[0], P[1], k);
                  if (r && !(r.hidden && !r.of)) quoi = 'la pièce voisine au travers du mur'; else if (r) quoi = "l'intérieur d'un placard"; }
              }
              if (!quoi) continue;
              const cle = id + bout + face; if (!fentes.has(cle)) fentes.set(cle, { id, o, k, quoi, p: t, y, E });
              break;
            }
          }
        }
      }
      for (const f of fentes.values()) out.push(tag({ type: 'fente', id: f.id, p: [+f.p[0].toFixed(3), +f.p[1].toFixed(3)], y: +f.y.toFixed(2), depuis: f.E.map(v => +v.toFixed(2)),
        texte: `Fente au jambage de « ${f.o.label || f.id} »${nom(f.k)} : en biais, on voit ${f.quoi} près de (${pt(f.p)}), à ${f.y.toFixed(2)} m du sol.` }, f.k));
    }
    // 1 sexies. pas de plinthe en travers d'un passage : le long de chaque bord de pièce ouvert sur une autre pièce visible sans mur (sondes
    // tous les 5 cm à 3 cm dehors), un rayon vertical à 6 mm dans la pièce ne touche aucune plinthe sur plus de 10 cm. Constat du
    // 28/09/2026 (D201) : plinthe de 7 cm en travers du passage de l'entrée au séjour (le bord n'était sondé qu'en son milieu, pris dans un mur).
    if (V.G.plinthes) { const rc = new T.Raycaster(), bas = new T.Vector3(0, -1, 0);
      for (const r of D.rooms) {
        if (r.hidden || r.of) continue;
        const k = lvOf(r), pl = G.polyArea(r.poly) < 0 ? r.poly.slice().reverse() : r.poly;
        for (let i = 0; i < pl.length; i++) {
          const a = pl[i], b = pl[(i + 1) % pl.length], Ln = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Ln < 0.1) continue;
          const u = [(b[0] - a[0]) / Ln, (b[1] - a[1]) / Ln], nIn = [-u[1], u[0]];
          let run = 0, pire = null;
          for (let t = 0.025; t < Ln; t += 0.05) {
            const q = [a[0] + u[0] * t - nIn[0] * 0.03, a[1] + u[1] * t - nIn[1] * 0.03], o = roomAt(q[0], q[1], k);
            const ouvert = o && !o.hidden && o !== r && !(o.of && o.of === r.id) && !(D.gaines || []).some(g => lvOf(g) === k && G.pointInPoly(q[0], q[1], g.poly));
            let touche = false;
            if (ouvert) { const p = [a[0] + u[0] * t + nIn[0] * 0.006, a[1] + u[1] * t + nIn[1] * 0.006]; rc.set(new T.Vector3(p[0], Y(k) + 0.5, p[1]), bas); rc.far = 0.47;
              touche = rc.intersectObject(V.G.plinthes, true).some(h => h.object.isMesh); }
            run = touche ? run + 0.05 : 0; if (run > 0.1 && !pire) pire = [a[0] + u[0] * t, a[1] + u[1] * t];
          }
          if (pire) out.push(tag({ type: 'plinthe', id: r.id, p: pire.map(v => +v.toFixed(2)), texte: `Une plinthe barre le passage de « ${r.name || r.id} »${nom(k)} vers une autre pièce (${pt(pire)}).` }, k));
        }
      }
    }
    // 2. baies dégagées : un rayon horizontal traverse chaque ouverture
    const ray = new T.Raycaster(), meshes = [V.G.arch, V.G.fixed].filter(Boolean);
    for (const [id, o] of Object.entries(D.openings)) {
      const k = lvOf(o), y = Y(k) + (o.sill > 0 ? (o.sill + o.head) / 2 : 1.0), mid = o.pt((o.s[0] + o.s[1]) / 2, -0.25), dir = new T.Vector3(o.T[0], 0, o.T[1]);
      ray.set(new T.Vector3(mid[0], y, mid[1]), dir); ray.far = o.depth + 0.3;
      const hit = ray.intersectObjects(meshes, true).find(h => h.object.isMesh && !h.object.userData.glass && ['wall_b', 'wall_c', 'ext', 'faience'].includes(h.object.userData.key));
      if (hit) out.push(tag({ type: 'ouverture', id, texte: `L'ouverture « ${o.label || id} »${nom(k)} est obstruée par un mur (à ${hit.distance.toFixed(2)} m).` }, k));
    }
    // 2 bis. fenêtre ou porte-fenêtre à deux vantaux, fermée : aucun jour entre les vantaux (rayon au milieu, à trois hauteurs, qui doit
    // toucher la menuiserie)
    for (const [id, o] of Object.entries(D.openings)) {
      if (!['window', 'french'].includes(o.kind) || (o.leaves || 1) < 2 || !o.pt) continue;
      const opx = V.operables.find(q => q.id === id), t0 = opx ? opx.t : 0;
      if (opx) { opx.apply(0); V.scene.updateMatrixWorld(true); }
      const k = lvOf(o), b = o.sill > 0 ? o.sill : 0, ls = o.ls || o.s, sm = (ls[0] + ls[1]) / 2, dir = new T.Vector3(o.T[0], 0, o.T[1]); // milieu des vantaux (hors partie fixe)
      const jour = [-0.003, 0, 0.003].some(ds => [b + 0.25, (b + o.head) / 2, o.head - 0.25].some(y => {
        const m = o.pt(sm + ds, -0.15); ray.set(new T.Vector3(m[0], Y(k) + y, m[1]), dir); ray.far = o.depth + 0.3;
        return !ray.intersectObject(V.G.doors, true).some(h => h.object.isMesh && h.object.userData.op && h.object.userData.op.id === id); }));
      if (opx) { opx.apply(t0); V.scene.updateMatrixWorld(true); }
      if (jour) out.push(tag({ type: 'menuiserie', id, texte: `On voit le jour entre les deux vantaux de « ${o.label || id} »${nom(k)}.` }, k));
    }
    // 2 ter. tableau électrique dans une niche ouverte d'un seul côté : sa porte (laquée) fait face à ce côté
    for (const f of D.fixtures || []) {
      if (f.type !== 'tableau' || !f.x || !f.z) continue;
      const k = lvOf(f), [x0, x1] = f.x, [z0, z1] = f.z, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, Lk = MULTI ? D.L[k] : D;
      const plein = p => Lk.walls.some(w => !w.virtual && w.quad && G.pointInPoly(p[0], p[1], w.quad)) || (Lk.gaines || []).some(g => G.pointInPoly(p[0], p[1], g.poly))
        || (Lk.masses || []).some(m => G.pointInPoly(p[0], p[1], m.poly) && !(m.trous || []).some(h => G.pointInPoly(p[0], p[1], h)));
      const cotes = [[[xm, z1], [0, 1]], [[xm, z0], [0, -1]], [[x1, zm], [1, 0]], [[x0, zm], [-1, 0]]].filter(([c, n]) => { const p = [c[0] + n[0] * 0.04, c[1] + n[1] * 0.04]; return !plein(p) && !!roomAt(p[0], p[1], k); });
      if (cotes.length !== 1) continue;
      const [c, n] = cotes[0]; ray.set(new T.Vector3(c[0] + n[0] * 0.35, Y(k) + 1.4, c[1] + n[1] * 0.35), new T.Vector3(-n[0], 0, -n[1])); ray.far = 0.7;
      const h = ray.intersectObject(V.G.fixed, true).find(q => q.object.isMesh);
      if (!h || h.object.userData.key !== 'lacquer') out.push(tag({ type: 'equipement', id: 'tableau', texte: `Le tableau électrique${nom(k)} ne fait pas face à l'ouverture de sa niche.` }, k));
    }
    // 2 quater. placards fermés et coffret du tableau adossé (retour R2, D201 : placard de l'entrée ouvert sur la niche du tableau, étagère et
    // tringle vues par le côté, coffret posé seul comme un panneau). Un placard est fermé sur tous ses côtés sauf sa façade : points à 4 cm
    // dans le placard le long de chaque autre côté (tous les 5 cm, à 0,5, 1,2 et 1,8 m), visés depuis l'œil du visiteur (1,1 et 1,6 m) en
    // tout point où il peut se tenir à moins de 4 m, devant ce côté ; un côté est ouvert si l'un de ces points se voit (rayon libre jusqu'à
    // 1 cm de lui). Le coffret du tableau est adossé à la matière (mur, cloison, gaine) sur 90 % de son côté de fond, ou dans un placard.
    { const rc = new T.Raycaster(), tout = [V.G.arch, V.G.fixed, V.G.doors, V.G.windows].filter(Boolean), O3 = new T.Vector3(), P3 = new T.Vector3(), d3 = new T.Vector3();
      const visO = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      const libre = (o, p) => { O3.set(...o); P3.set(...p); d3.copy(P3).sub(O3); const L = d3.length(); d3.normalize(); rc.set(O3, d3); rc.near = 0; rc.far = L - 0.01;
        return !rc.intersectObjects(tout, true).some(h => h.object.isMesh && visO(h.object) && h.object.material && h.object.material.visible !== false); };
      const rect = f => [Math.min(...f.x), Math.max(...f.x), Math.min(...f.z), Math.max(...f.z)];
      const groupes = new Map(); V.G.doors.traverse(o => { if (o.userData.placard) groupes.set(o.userData.placard, o); });
      for (const f of D.fixtures || []) {
        if (f.type !== 'placard' || !f.x || !f.z) continue;
        const k = lvOf(f), F = App.placardFrame(f), zb = -F.Dp, nomP = (() => { const q = F.at(F.W / 2, 0.3), r = roomAt(q[0], q[1], k), rr = r && D.rooms.find(x => x.id === (r.of || r.id)); return rr ? rr.name || rr.id : ''; })();
        if (F.Dp < 0.12 || F.W < 0.2) continue;
        const cotes = { 'gauche': [[0, zb], [0, -0.075], [1, 0]], 'droit': [[F.W, zb], [F.W, -0.075], [-1, 0]], 'du fond': [[0, zb], [F.W, zb], [0, 1]] };
        for (const [nm, [a, b, n]] of Object.entries(cotes)) {
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(2, Math.round(L / 0.05)), pts = [];
          for (let i = 1; i < m; i++) { const t = i / m, q = F.at(a[0] + (b[0] - a[0]) * t + n[0] * 0.04, a[1] + (b[1] - a[1]) * t + n[1] * 0.04); for (const h of [0.5, 1.2, 1.8]) pts.push([q[0], Y(k) + h, q[1]]); }
          // œil : devant ce côté (hors du placard, du côté opposé à n), à moins de 4 m, là où le visiteur peut se tenir
          const c0 = F.at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), no = [F.at(-n[0], -n[1])[0] - F.at(0, 0)[0], F.at(-n[0], -n[1])[1] - F.at(0, 0)[1]];
          const yeux = [];
          for (let dx = -4; dx <= 4; dx += 0.25) for (let dz = -4; dz <= 4; dz += 0.25) {
            const x = c0[0] + dx, z = c0[1] + dz; if (Math.hypot(dx, dz) > 4 || (x - c0[0]) * no[0] + (z - c0[1]) * no[1] < 0.05) continue;
            const r = roomAt(x, z, k); if (!r || (r.hidden && !r.of)) continue;
            const [cx, cz] = collide(x, z, 0.18, k); if (Math.hypot(cx - x, cz - z) > 1e-3) continue;
            yeux.push([x, Y(k) + 1.6, z], [x, Y(k) + 1.1, z]);
          }
          let vu = null;
          for (const o of yeux) { for (const p of pts) if (libre(o, p)) { vu = { o, p }; break; } if (vu) break; }
          if (vu) out.push(tag({ type: 'placard', id: 'placard', p: [+vu.p[0].toFixed(2), +vu.p[2].toFixed(2)], depuis: [+vu.o[0].toFixed(2), +vu.o[2].toFixed(2)],
            texte: `Le placard de « ${nomP} »${nom(k)} est ouvert sur son côté ${nm} : on voit son intérieur depuis (${pt([vu.o[0], vu.o[2]])}).` }, k));
        }
      }
      for (const f of D.fixtures || []) {
        if (f.type !== 'tableau' || !f.x || !f.z) continue;
        const k = lvOf(f), r = rect(f), Lk = MULTI ? D.L[k] : D;
        const dansPlacard = (D.fixtures || []).some(g => g.type === 'placard' && g.x && g.z && (q => r[0] >= q[0] - 0.02 && r[1] <= q[1] + 0.02 && r[2] >= q[2] - 0.02 && r[3] <= q[3] + 0.02)(rect(g)));
        if (dansPlacard) continue;
        const plein = p => Lk.walls.some(w => !w.virtual && w.quad && G.pointInPoly(p[0], p[1], w.quad)) || (Lk.gaines || []).some(g => G.pointInPoly(p[0], p[1], g.poly))
          || (Lk.masses || []).some(m => G.pointInPoly(p[0], p[1], m.poly) && !(m.trous || []).some(h => G.pointInPoly(p[0], p[1], h)));
        const cote = { z0: [[r[0], r[2]], [r[1], r[2]], [0, -1]], z1: [[r[0], r[3]], [r[1], r[3]], [0, 1]], x0: [[r[0], r[2]], [r[0], r[3]], [-1, 0]], x1: [[r[1], r[2]], [r[1], r[3]], [1, 0]] }[f._fond];
        let ok = false;
        if (cote) { const [a, b, n] = cote, pts = Array.from({ length: 19 }, (_, i) => [a[0] + (b[0] - a[0]) * (i + 1) / 20 + n[0] * 0.03, a[1] + (b[1] - a[1]) * (i + 1) / 20 + n[1] * 0.03]); ok = pts.filter(plein).length >= 0.9 * pts.length; }
        if (!ok) { const q = roomAt((r[0] + r[1]) / 2, (r[2] + r[3]) / 2, k), rr = q && D.rooms.find(x => x.id === (q.of || q.id));
          out.push(tag({ type: 'equipement', id: 'tableau', texte: `Le tableau électrique${rr ? ` de « ${rr.name || rr.id} »` : ''}${nom(k)} n'est adossé à rien : le coffret flotterait dans la pièce.` }, k)); }
      }
      // 2 quater bis. tableau électrique vu (constat du 28/09/2026, D201 : GTL fermée sur ses quatre côtés, façade du plan lue en cloison, le
      // tableau n'était visible de nulle part) : la face avant du coffret (6 mm devant sa porte laquée, 1,0 à 1,85 m) se voit depuis un point
      // où le visiteur peut se tenir, à moins de 5 m ; sinon une porte du logement ferme sa niche (coffret derrière une porte, plan-du-lot, 432)
      for (const f of D.fixtures || []) {
        if (f.type !== 'tableau' || !f.x || !f.z) continue;
        const k = lvOf(f), r = rect(f), dansPlacard = (D.fixtures || []).some(g => g.type === 'placard' && g.x && g.z && (q => r[0] >= q[0] - 0.02 && r[1] <= q[1] + 0.02 && r[2] >= q[2] - 0.02 && r[3] <= q[3] + 0.02)(rect(g)));
        const Lk = MULTI ? D.L[k] : D;
        const cotesR = [[[r[0], r[2]], [r[1], r[2]]], [[r[0], r[3]], [r[1], r[3]]], [[r[0], r[2]], [r[0], r[3]]], [[r[1], r[2]], [r[1], r[3]]]];
        // porte le long d'un côté du coffret : parallèle, à moins de 12 cm, sur la moitié du côté au moins
        const porte = Object.values(Lk.openings || {}).some(o => o.p0 && o.p1 && cotesR.some(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
          const Lo = Math.hypot(o.p1[0] - o.p0[0], o.p1[1] - o.p0[1]) || 1, uo = [(o.p1[0] - o.p0[0]) / Lo, (o.p1[1] - o.p0[1]) / Lo];
          if (Math.abs(u[0] * uo[1] - u[1] * uo[0]) > 0.1) return false;
          const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], off = Math.abs((m[0] - o.p0[0]) * uo[1] - (m[1] - o.p0[1]) * uo[0]); if (off > 0.12) return false;
          const s0 = (o.p0[0] - a[0]) * u[0] + (o.p0[1] - a[1]) * u[1], s1 = (o.p1[0] - a[0]) * u[0] + (o.p1[1] - a[1]) * u[1];
          return Math.min(L, Math.max(s0, s1)) - Math.max(0, Math.min(s0, s1)) >= 0.5 * L; }));
        if (dansPlacard || porte || !f._fond) continue;
        const fond = f._fond, [a0, a1] = fond[0] === 'z' ? [r[0], r[1]] : [r[2], r[3]], vf = 0.14;
        const at = (u, v) => fond === 'z0' ? [u, r[2] + v] : fond === 'z1' ? [u, r[3] - v] : fond === 'x0' ? [r[0] + v, u] : [r[1] - v, u];
        const pts = []; for (let i = 1; i < 6; i++) { const q = at(a0 + 0.08 + (a1 - a0 - 0.16) * i / 6, vf); for (const h of [1.05, 1.45, 1.8]) pts.push([q[0], Y(k) + h, q[1]]); }
        const c0 = at((a0 + a1) / 2, vf), yeux = [];
        for (let dx = -5; dx <= 5; dx += 0.25) for (let dz = -5; dz <= 5; dz += 0.25) {
          const x = c0[0] + dx, z = c0[1] + dz; if (Math.hypot(dx, dz) > 5) continue;
          const q = roomAt(x, z, k); if (!q || (q.hidden && !q.of)) continue;
          const [cx, cz] = collide(x, z, 0.18, k); if (Math.hypot(cx - x, cz - z) > 1e-3) continue;
          yeux.push([x, Y(k) + 1.6, z]);
        }
        let vu = false; for (const o of yeux) { if (pts.some(p => libre(o, p))) { vu = true; break; } }
        if (!vu) { const q = roomAt(c0[0], c0[1], k), rr = q && D.rooms.find(x => x.id === (q.of || q.id));
          out.push(tag({ type: 'equipement', id: 'tableau-vu', texte: `Le tableau électrique${rr ? ` de « ${rr.name || rr.id} »` : ''}${nom(k)} ne se voit de nulle part : sa niche est fermée sans porte (${pt([(r[0] + r[1]) / 2, (r[2] + r[3]) / 2])}).` }, k)); }
      }
    }
    // 2 quinquies. descente EP hors des murs (432, tirage « base2 » : lue dans l'épaisseur du mur, on n'en voyait que le sommet dans la
    // maquette) : son axe n'est dans aucun mur ni aucune gaine
    for (const f of D.fixtures || []) {
      if (f.type !== 'dep' || !f.p) continue;
      const k = lvOf(f), Lk = MULTI ? D.L[k] : D;
      if (Lk.walls.some(w => !w.virtual && w.quad && G.pointInPoly(f.p[0], f.p[1], w.quad)) || (Lk.gaines || []).some(g => G.pointInPoly(f.p[0], f.p[1], g.poly)))
        out.push(tag({ type: 'equipement', id: 'dep', texte: `La descente d'eaux pluviales${nom(k)} est prise dans un mur (${pt(f.p)}).` }, k));
    }
    // 3. vues de la galerie et arrêts de la visite : dans une zone libre, et un vrai regard (pas un mur à bout portant)
    const sight = (x, z, yaw, k) => { ray.set(new T.Vector3(x, Y(k) + 1.5, z), new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))); ray.far = 50; const h = ray.intersectObjects(meshes, true).find(h => h.object.isMesh && !h.object.userData.glass); return h ? h.distance : 50; };
    const view = (type, id, name, x, z, yaw, k, room) => {
      const [cx, cz] = collide(x, z, 0.15, k);
      if (Math.hypot(cx - x, cz - z) > 0.02 || !roomAt(x, z, k)) return out.push(tag({ type, id, texte: `${name}${nom(k)} est placée dans un mur ou hors du logement.` }, k));
      // niveau : la pièce de la vue est sur le niveau de la vue (sinon la photo « Chambre 2 » serait prise dans la pièce du dessous)
      if (MULTI && room) { const rr = D.rooms.find(q => q.id === room); if (!rr || lvOf(rr) !== k) out.push(tag({ type: 'niveau', id, vue: type, x, z, texte: `${name} est prise sur ${App.levelName(k)} alors que « ${rr ? rr.name || rr.id : room} » est sur ${rr ? App.levelName(lvOf(rr)) : 'aucun niveau'}.` }, k)); }
      const c = sight(x, z, yaw, k), l = sight(x, z, yaw + 0.4, k), r = sight(x, z, yaw - 0.4, k);
      // recul exigé à la mesure de la pièce : 1,8 m dans un séjour, moins dans un WC de 1,5 m de côté
      const rm = roomAt(x, z, k), bb = rm ? G.bbox(rm.poly) : [0, 9, 0, 9], diag = Math.hypot(bb[1] - bb[0], bb[3] - bb[2]);
      const need = Math.min(1.8, 0.6 * diag), needSide = Math.min(1.5, 0.5 * diag);
      if (c < need || Math.max(l, r) < needSide) out.push(tag({ type, id, texte: `${name}${nom(k)} fixe un mur (${c.toFixed(2)} m devant).` }, k));
    };
    // 3 quinquies. vitrages : pas de reflet ponctuel des plafonniers ni du soleil (« yeux dans les arbres », fiche C6) : le programme du
    // verre, compilé, annule la part spéculaire directe (le reflet du ciel et de la pièce reste)
    if (V.M && V.M.glass && Object.values(D.openings).some(o => o.kind === 'window' || o.kind === 'french')) {
      const progs = (V.renderer.info.programs || []).filter(p => String(p.cacheKey || '').includes('verre-sans-reflet-direct'));
      if (!progs.length) out.push({ type: 'rendu', id: 'verre', texte: 'Les vitrages renvoient les plafonniers en reflets ponctuels (verre sans annulation du reflet direct).' });
    }
    // 3 quinquies bis. ombres des garde-corps (constat du 28/09/2026 : barreaux de loggia fusionnés avec ceux de l'escalier et de la trémie,
    // l'ombre retirée aux seconds l'était aussi aux premiers, plus de bandes d'ombre au soleil) : un maillage de garde-corps de loggia
    // (matière rail) porte une ombre ; les barreaux intérieurs (rail_int) n'en portent pas
    if (V.M && V.M.rail) {
      const lgs = (D.loggias || []).filter(lg => lg && Array.isArray(lg.rail) && lg.rail.length >= 2);
      let ext = 0, extOmbre = 0, intOmbre = 0;
      (V.G.arch || V.scene).traverse(m => { if (!m.isMesh) return;
        if (m.material === V.M.rail) { ext++; if (m.castShadow) extOmbre++; }
        if (V.M.rail_int && m.material === V.M.rail_int && m.castShadow) intOmbre++; });
      if (lgs.length && (!ext || !extOmbre)) out.push({ type: 'rendu', id: 'ombre-garde-corps', texte: 'Les garde-corps des loggias ne portent pas d\'ombre au soleil.' });
      if (intOmbre) out.push({ type: 'rendu', id: 'ombre-barreaux', texte: 'Les barreaux de l\'escalier ou de la trémie portent une ombre (stries sous les marches).' });
    }
    // 3 ter. noms des pièces montrés (visite, photos, plan) : sans capitales ni abréviation du plan, avec le séparateur du tableau des
    // surfaces quand il donne la même pièce (fiche C5 : « Séjour Cuisine » au lieu de « Séjour / Cuisine », « SDB / WC » ; lire.nom_montre)
    { const norme = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const surf = ((D.fiche || {}).surfaces || []).map(r => Array.isArray(r) ? r[0] : r && r.nom).filter(t => typeof t === 'string');
      const ABR = new Set(['SDB', 'SDE', 'DGT', 'DEGT', 'CH', 'ENT', 'CELL', 'SEJ', 'RGT', 'PL', 'CUIS', 'BUR', 'BAL']);
      for (const r of D.rooms) {
        if (r.hidden || r.of || !r.name) continue;
        const mots = String(r.name).split(/[\s/-]+/).filter(Boolean);
        const mal = mots.find(w => (/^[A-ZÀ-Ý]{3,}$/.test(w) && w !== 'WC') || ABR.has(w.replace(/\.$/, '')));
        const sep = surf.find(x => norme(x) === norme(r.name) && /[/-]/.test(x) && !/[/-]/.test(r.name));
        if (mal || sep) out.push(tag({ type: 'nom', id: r.id, texte: `Le nom de pièce « ${r.name} »${nom(lvOf(r))} est montré ${mal ? `avec « ${mal} » (capitales ou abréviation du plan)` : `sans le séparateur du tableau des surfaces (« ${sep} »)`}.` }, lvOf(r)));
      }
    }
    // 3 bis. arrêts et photos jamais dans le débattement d'une porte, à 50 cm au moins du vantail ouvert (35 cm dans une pièce de moins de
    // 3 m²), jamais dans la cuisine indicative. La chaîne vise plus large (lire.zones_interdites : débattement agrandi de 30 cm, 70 cm du
    // vantail, cuisine agrandie de 30 cm) et ne descend à ce minimum que dans une pièce étroite. Fiche C3, 28/09/2026 : arrêts à 0,16 m du
    // vantail ouvert, arrêt du séjour du 3124 dans les plaques de cuisson.
    { const segD = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-12, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2)); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
      const gene = (x, z, k, fermees = []) => { const r = roomAt(x, z, k), petite = r && Math.abs(G.polyArea(r.poly)) < 3, m = 0, mv = petite ? 0.35 : 0.5;
        for (const o of Object.values(D.openings)) {
          if (o.kind !== 'door' || lvOf(o) !== k || !App.doorLeaves || fermees.includes(o.id)) continue; // porte palière, porte fermée sur la vue
          for (const f of App.doorLeaves(o.id) || []) {
            const p = [x, z], v = [x - f.h[0], z - f.h[1]], a = [f.c[0] - f.h[0], f.c[1] - f.h[1]], b = [f.op[0] - f.h[0], f.op[1] - f.h[1]];
            const dans = v[0] * a[0] + v[1] * a[1] >= 0 && v[0] * b[0] + v[1] * b[1] >= 0; // entre le vantail fermé et le vantail ouvert
            const dS = dans ? Math.max(0, Math.hypot(...v) - f.L) : Math.min(segD(p, f.h, f.c), segD(p, f.h, f.op));
            if (dS <= m) return `dans le débattement de la porte « ${o.label || o.id} »`;
            if (segD(p, f.h, f.op) < mv) return `à ${segD(p, f.h, f.op).toFixed(2)} m du vantail ouvert de « ${o.label || o.id} »`;
          }
        }
        for (const kh of D.kitchenHint || []) { const q = kh && kh.r; if (!Array.isArray(q) || (kh.level || 0) !== k) continue;
          if (x > Math.min(q[0], q[1]) - m && x < Math.max(q[0], q[1]) + m && z > Math.min(q[2], q[3]) - m && z < Math.max(q[2], q[3]) + m) return 'dans la cuisine indicative'; }
        return null; };
      for (const ph of D.photos || []) if (!ph.orbit) { const g = gene(ph.cam[0], ph.cam[1], lvOf(ph), ph.close || []); if (g) out.push(tag({ type: 'photo', id: ph.id, texte: `La vue « ${ph.t} »${nom(lvOf(ph))} est prise ${g}.` }, lvOf(ph))); }
      for (const st of D.stops) { const g = gene(st.p[0], st.p[1], lvOf(st), st.close || []); if (g) out.push(tag({ type: 'arret', id: st.id, texte: `L'arrêt « ${st.label} »${nom(lvOf(st))} est placé ${g}.` }, lvOf(st))); }
    }
    for (const ph of D.photos || []) if (!ph.orbit) view('photo', ph.id, `La vue « ${ph.t} »`, ...ph.cam.slice(0, 3), lvOf(ph), ph.room);
    for (const s of D.stops) view('arret', s.id, `L'arrêt « ${s.label} » de la visite guidée`, s.p[0], s.p[1], s.yaw, lvOf(s), s.room);
    // chaque pièce intérieure a son arrêt (WC compris), sauf absence voulue et dite (plan.json « sans_arret », rapport.json)
    for (const r of D.rooms) { if (r.hidden || r.of || App.isExt(r)) continue;
      if (!D.stops.some(s => (s.room || s.id) === r.id) && !sansArret.includes(r.id)) out.push(tag({ type: 'arret', id: r.id, manque: true, texte: `La pièce « ${r.name || r.id} »${nom(lvOf(r))} n'a pas d'arrêt dans la visite guidée.` }, lvOf(r))); }
    // 3 quater. caméra dans une paroi : grille de 10 cm dans chaque pièce, là où le visiteur peut se tenir (le corps n'y est repoussé
    // par rien) ; à hauteur d'œil, aucune face bâtie ou d'équipement à moins de 10 cm (plus près, le plan proche de la caméra la coupe
    // et l'on voit au travers : face d'arrivée d'un escalier sans obstacle, vue du renfoncement sous le palier)
    { const C = 0.25, cells = new Map(), A3 = new T.Vector3(), B3 = new T.Vector3(), C3 = new T.Vector3(), LVs = MULTI ? LV : [{ y: 0 }];
      const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      const put = (k, a, b) => { for (let i = Math.floor(Math.min(a[0], b[0]) / C); i <= Math.floor(Math.max(a[0], b[0]) / C); i++) for (let j = Math.floor(Math.min(a[1], b[1]) / C); j <= Math.floor(Math.max(a[1], b[1]) / C); j++) { const kk = k + '|' + i + '|' + j; if (!cells.has(kk)) cells.set(kk, []); cells.get(kk).push([a, b]); } };
      V.scene.updateMatrixWorld(true);
      for (const g of [V.G.arch, V.G.fixed]) if (g) g.traverse(o => {
        if (!o.isMesh || !vis(o)) return;
        const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count;
        for (let i = 0; i + 2 < n; i += 3) {
          A3.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld); B3.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(o.matrixWorld); C3.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(o.matrixWorld);
          LVs.forEach((l, k) => { const ye = l.y + V.EYE, P = [];
            for (const [p, q] of [[A3, B3], [B3, C3], [C3, A3]]) if ((p.y - ye) * (q.y - ye) < 0) { const t = (ye - p.y) / (q.y - p.y); P.push([p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t]); }
            if (P.length === 2) put(k, P[0], P[1]); });
        }
      });
      const segD2 = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-12, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2)); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
      for (const r of D.rooms) {
        if (r.of) continue;
        const k = lvOf(r), bb = G.bbox(r.poly); let pire = null;
        for (let x = bb[0] + 0.05; x < bb[1]; x += 0.1) for (let z = bb[2] + 0.05; z < bb[3]; z += 0.1) {
          if (roomAt(x, z, k) !== r) continue;
          const [cx, cz] = collide(x, z, 0.18, k); if (Math.hypot(cx - x, cz - z) > 1e-3) continue;
          let d = 1; const i0 = Math.floor(x / C), j0 = Math.floor(z / C);
          for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (const [a, b] of cells.get(k + '|' + i + '|' + j) || []) d = Math.min(d, segD2([x, z], a, b));
          if (d < 0.1 && (!pire || d < pire.d)) pire = { d, p: [x, z] };
        }
        if (pire) out.push(tag({ type: 'paroi', id: r.id, p: pire.p, d: pire.d, texte: `Dans « ${r.name || r.id} »${nom(k)}, le visiteur peut coller le visage à ${(pire.d * 100).toFixed(0)} cm d'une paroi (${pt(pire.p)}) : on verrait au travers.` }, k));
      }
    }
    // 3 ter. ombre du soleil : tout mur l'arrête par ses deux faces (face arrière seule : fente de lumière dans les angles derrière un mur ensoleillé)
    { const nus = new Set(); V.scene.traverse(o => { if (o.isMesh && o.castShadow && /^wall_/.test(o.userData.key || '') && o.material.shadowSide !== T.DoubleSide) nus.add(o.userData.key); });
      for (const key of nus) out.push({ type: 'lumiere', id: key, texte: `Les murs (${key}) n'arrêtent le soleil que par leur face arrière : fente de lumière dans les angles au soleil.` }); }
    // 3 bis. maquette de chaque niveau (coupe inactive) : aucun sommet visible au-dessus du haut des murs du niveau affiché, contexte
    // d'immeuble et sol de la maquette mis à part (élément d'un niveau retiré resté visible, conduit ou équipement trop haut)
    { const mode0 = App.state.mode, lvw = V.walk.lv, P3 = new T.Vector3(), hors = new Set([V.G.ctx, V.G.orbitGround].filter(Boolean));
      App.set('mode', 'orbit');
      if (!App.state.cut) for (let k = 0; k < (MULTI ? LV.length : 1); k++) {
        if (MULTI) App.set('level', k);
        V.scene.updateMatrixWorld(true);
        const top = Y(k) + (MULTI ? LV[k].H : D.H) + 0.005, trop = new Map();
        V.scene.traverse(o => {
          if (!o.isMesh || !o.layers.test(V.camera.layers)) return;
          for (let p = o; p; p = p.parent) if (!p.visible || hors.has(p)) return;
          const pos = o.geometry.attributes.position; if (!pos) return;
          for (let i = 0; i < pos.count; i++) { P3.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (P3.y <= top) continue;
            const key = o.userData.key || 'objet', b = trop.get(key) || { y: -1e9, x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 };
            b.y = Math.max(b.y, P3.y); b.x0 = Math.min(b.x0, P3.x); b.x1 = Math.max(b.x1, P3.x); b.z0 = Math.min(b.z0, P3.z); b.z1 = Math.max(b.z1, P3.z); trop.set(key, b); }
        });
        for (const [key, b] of trop) out.push(tag({ type: 'maquette', id: key, a: [b.x0, b.z0], b: [b.x1, b.z1], y: b.y, texte: `Dans la maquette${nom(k)}, un élément (${key}) dépasse de ${((b.y - top + 0.005) * 100).toFixed(0)} cm le haut des murs (${pt([b.x0, b.z0])} à ${pt([b.x1, b.z1])}).` }, k));
      }
      // vue d'ensemble d'un niveau percé d'une trémie ou d'où part une volée : on la voit (au moins un point de la trémie ou de la volée
      // que ni mur ni équipement ne cache), sinon rien n'y dit que le niveau communique par un escalier
      if (MULTI) for (let k = 0; k < LV.length; k++) {
        App.set('level', k); V.defaultOrbitView(); V.scene.updateMatrixWorld(true);
        const pts = V.orbitStairPts(k); if (!pts.length) continue;
        const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }, rc = new T.Raycaster(), cam = V.camera.position.clone();
        const vus = pts.filter(p => { const P = new T.Vector3(...p), d = P.clone().sub(cam), l = d.length(); rc.set(cam, d.normalize()); rc.far = l - 0.05;
          return !rc.intersectObjects([V.G.arch, V.G.fixed, V.G.doors].filter(Boolean), true).some(h => h.object.isMesh && vis(h.object) && h.object.userData.key !== 'rail'); }).length;
        if (!vus) out.push(tag({ type: 'maquette', id: 'tremie', texte: `La vue d'ensemble de ${App.levelName(k)} ne montre ni la trémie ni l'escalier : les murs du premier plan les cachent.` }, k));
      }
      // coupe active : un maillage dont le shader ignore le plan de coupe (miroir) ne dépasse pas la hauteur de coupe, sinon il flotte
      // au-dessus des murs coupés
      if (!App.state.cut) { App.set('cut', true);
        for (let k = 0; k < (MULTI ? LV.length : 1); k++) {
          if (MULTI) App.set('level', k);
          V.scene.updateMatrixWorld(true);
          const top = Y(k) + 1.21, trop = new Map();
          V.scene.traverse(o => {
            if (!o.isMesh || !o.layers.test(V.camera.layers) || ![].concat(o.material).some(m => m && m.isShaderMaterial && !m.clipping)) return;
            for (let p = o; p; p = p.parent) if (!p.visible || hors.has(p)) return;
            const pos = o.geometry.attributes.position; if (!pos) return;
            for (let i = 0; i < pos.count; i++) { P3.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (P3.y > top) { trop.set(o.userData.key || 'miroir', [P3.x, P3.z]); break; } }
          });
          for (const [key, p] of trop) out.push(tag({ type: 'maquette', id: key, coupe: true, p, texte: `Dans la maquette coupée${nom(k)}, un élément (${key}) n'est pas coupé et flotte au-dessus des murs (${pt(p)}).` }, k));
        }
        App.set('cut', false);
      }
      App.set('mode', mode0); if (MULTI) { V.walk.lv = lvw; App.set('level', lvw); } V.scene.updateMatrixWorld(true);
    }
    if (!MULTI) return out;

    /* ---------- plusieurs niveaux ---------- */
    const VV = G.V, pip = (p, poly) => G.pointInPoly(p[0], p[1], poly), stairs = V.stairs || [], voids = V.voids || [];
    const segD = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-12, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2)); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
    const bord = (p, poly) => { let d = Infinity; for (let i = 0; i < poly.length; i++) d = Math.min(d, segD(p, poly[i], poly[(i + 1) % poly.length])); return d; };
    const dedans = (p, poly, m) => pip(p, poly) && bord(p, poly) >= m; // à au moins m du bord
    const pres = (p, poly, m) => pip(p, poly) || bord(p, poly) < m;    // dedans ou à moins de m du bord
    const grille = (poly, st, m, f) => { const bb = G.bbox(poly); for (let x = bb[0] + st / 2; x < bb[1]; x += st) for (let z = bb[2] + st / 2; z < bb[3]; z += st) if (dedans([x, z], poly, m) && f(x, z) === false) return; };
    const matiere = (k, p) => { const L = D.L[k]; return L.walls.some(w => !w.virtual && w.quad && pip(p, w.quad)) || (L.gaines || []).some(g => pip(p, g.poly))
      || (L.masses || []).some(m => pip(p, m.poly) && !(m.trous || []).some(h => pip(p, h))); };
    const lname = k => App.levelName(k), sName = s => s.label || 'Escalier';
    // index de rayons verticaux : tous les triangles non verticaux des maillages visibles, rangés par cases de 50 cm
    const vIndex = roots => {
      const C = 0.5, cells = new Map(), A = new T.Vector3(), B = new T.Vector3(), Cc = new T.Vector3();
      const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
      for (const [tagR, g] of roots) if (g) g.traverse(o => {
        if (!o.isMesh || !vis(o) || o.userData.glass) return;
        const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count, key = o.userData.key || '';
        for (let i = 0; i + 2 < n; i += 3) {
          A.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld); B.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(o.matrixWorld); Cc.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(o.matrixWorld);
          const ny = (B.z - A.z) * (Cc.x - A.x) - (B.x - A.x) * (Cc.z - A.z); if (Math.abs(ny) < 1e-10) continue; // face verticale
          const t = { ax: A.x, ay: A.y, az: A.z, bx: B.x, by: B.y, bz: B.z, cx: Cc.x, cy: Cc.y, cz: Cc.z, up: ny > 0, key, obj: o.userData.lot ?? o.id, root: tagR }; // maillage d'origine (le moteur le découpe par pièce)
          const x0 = Math.floor(Math.min(A.x, B.x, Cc.x) / C), x1 = Math.floor(Math.max(A.x, B.x, Cc.x) / C), z0 = Math.floor(Math.min(A.z, B.z, Cc.z) / C), z1 = Math.floor(Math.max(A.z, B.z, Cc.z) / C);
          for (let i2 = x0; i2 <= x1; i2++) for (let j = z0; j <= z1; j++) { const kk = i2 + ',' + j; if (!cells.has(kk)) cells.set(kk, []); cells.get(kk).push(t); }
        }
      });
      // toutes les faces traversées par la verticale en (x, z) : hauteur, orientation, matériau, maillage
      return (x, z) => {
        const out2 = [], list = cells.get(Math.floor(x / C) + ',' + Math.floor(z / C)) || [];
        for (const t of list) {
          const d = (t.bz - t.cz) * (t.ax - t.cx) + (t.cx - t.bx) * (t.az - t.cz); if (Math.abs(d) < 1e-14) continue;
          const l1 = ((t.bz - t.cz) * (x - t.cx) + (t.cx - t.bx) * (z - t.cz)) / d, l2 = ((t.cz - t.az) * (x - t.cx) + (t.ax - t.cx) * (z - t.cz)) / d, l3 = 1 - l1 - l2;
          if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
          out2.push({ y: l1 * t.ay + l2 * t.by + l3 * t.cy, up: t.up, key: t.key, obj: t.obj, root: t.root });
        }
        return out2.sort((a, b) => a.y - b.y);
      };
    };
    const VX = vIndex([['arch', V.G.arch], ['ceil', V.G.ceil], ['fixed', V.G.fixed], ['lamps', V.G.lamps]]);
    const bati = h => h.root === 'arch' || h.root === 'ceil';

    // 4. escaliers : marches, pied et arrivée, calage sur le vide, échappée, montée et descente au clavier
    const proj = (s, p) => { let acc = 0, best = null; // abscisse sur la ligne de foulée (prolongée avant le pied et après l'arrivée)
      for (let i = 1; i < s.line.length; i++) {
        const a = s.line[i - 1], b = s.line[i], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); if (L < 1e-9) continue;
        let t = ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / L; if (i > 1) t = Math.max(0, t); if (i < s.line.length - 1) t = Math.min(L, t);
        const d = Math.hypot(p[0] - a[0] - ex / L * t, p[1] - a[1] - ez / L * t); if (!best || d < best.d) best = { d, t: acc + t }; acc += L;
      }
      return best ? best.t : 0; };
    // d'une image à l'autre, la hauteur suit la pente de la volée : au plus pas × pente + 1 cm (un ressaut au pied ou à l'arrivée, où le sol
    // de la pièce garderait le visiteur quelques centimètres sur la volée avant que la rampe prenne le relais, est un échec)
    const monte = (s, up, fps, dOff, ph) => {
      const step = 1.35 / fps, sg = up ? 1 : -1, bout = 0.35, tEnd = up ? s.len + bout : -bout, dyMax = step * (LV[s.to].y - LV[s.from].y) / s.len + 0.01, want = up ? s.to : s.from;
      let [x, z] = App.stairPt(s, (up ? -bout : s.len + bout) - sg * step * ph, dOff), lv = up ? s.from : s.to, y = LV[lv].y, still = 0;
      const [cx, cz] = V.collide(x, z, 0.18, lv); if (Math.hypot(cx - x, cz - z) > 0.01 || !App.roomAt(x, z, lv)) return { depart: true, t: proj(s, [x, z]), x, z };
      for (let f = 0, nf = Math.ceil((s.len + 2 * bout) / step) + 60; f < nf; f++) {
        const tc = proj(s, [x, z]), g = App.stairPt(s, tc + sg * 0.3, dOff), dx = g[0] - x, dz = g[1] - z, l = Math.hypot(dx, dz) || 1;
        const r = V.walkMove(x, z, dx / l * step, dz / l * step, lv); // lv renvoyé à chaque pas : le moteur reprend la hauteur du pas précédent
        if (r[2]) return { refus: true, t: tc, x, z, y };
        const dy = r[4] - y;
        if (dy * sg < -1e-4 || Math.abs(dy) > dyMax) return { saut: dy, t: tc, x, z, y };
        still = Math.hypot(r[0] - x, r[1] - z) < 1e-4 ? still + 1 : 0; x = r[0]; z = r[1]; lv = r[3]; y = r[4];
        if ((proj(s, [x, z]) - tEnd) * sg >= 0) break;
        if (still > 20) return { bloque: true, t: tc, x, z, y };
      }
      if (lv !== want || Math.abs(y - LV[want].y) > 0.01) return { arrivee: true, t: proj(s, [x, z]), x, z, y };
      return null;
    };
    for (const s of stairs) {
      const lo = LV[s.from], hi = LV[s.to], h = (hi.y - lo.y) / s.n, g = s.len / (s.n - 1), w2 = s.width / 2, k = s.from, E = (pb) => out.push(tag(Object.assign({ type: 'escalier', id: s.id }, pb), pb.level ?? k)); // arrivée, descente : niveau haut
      if (h < 0.16 - 1e-3 || h > 0.20 + 1e-3) E({ h, texte: `« ${sName(s)} » : marches de ${(h * 100).toFixed(1)} cm de haut (${s.n} contremarches pour ${f2(hi.y - lo.y)} m), hors de 16 à 20 cm.` });
      if (g < 0.21 - 1e-3 || g > 0.32 + 1e-3) E({ g, texte: `« ${sName(s)} » : giron de ${(g * 100).toFixed(1)} cm, hors de 21 à 32 cm.` });
      const F = App.stairAt(s, 0), A = App.stairAt(s, s.len), pied = VV.sub(F.p, VV.mul(F.u, 0.3)), arr = VV.add(A.p, VV.mul(A.u, 0.3));
      if (!App.roomAt(pied[0], pied[1], s.from)) E({ p: pied, texte: `Le pied de « ${sName(s)} » ne donne sur aucune pièce de ${lname(s.from)} (${pt(pied)}).` });
      if (!App.roomAt(arr[0], arr[1], s.to)) E({ p: arr, level: s.to, texte: `L'arrivée de « ${sName(s)} » ne donne sur aucune pièce de ${lname(s.to)} (${pt(arr)}).` });
      // dernière contremarche au bord d'arrivée du vide, à 1 cm près, sur toute la largeur
      const v = voids.find(q => q.id === s.void) || voids.find(q => q.level === s.to && pres(A.p, q.poly, 0.05));
      if (!v) E({ p: A.p, texte: `« ${sName(s)} » ne débouche dans aucun vide du plancher de ${lname(s.to)}.` });
      else {
        const ecart = Math.max(...[-w2 + 0.02, 0, w2 - 0.02].map(d => bord(App.stairPt(s, s.len, d), v.poly)));
        if (ecart > 0.01) E({ p: A.p, vide: v.id, ecart, texte: `La dernière marche de « ${sName(s)} » est à ${(ecart * 100).toFixed(0)} cm du bord du vide au lieu d'y être calée.` });
      }
      // échappée : depuis chaque nez de marche, au milieu et près des deux rives, rien à moins de 1,90 m au-dessus (main courante mise à part)
      let pire = null;
      for (let i = 0; i < s.n - 1; i++) for (const d of [0, w2 - 0.03, -(w2 - 0.03)]) {
        const p = App.stairPt(s, i * g + 0.02, d), y0 = lo.y + (i + 1) * h, hit = VX(p[0], p[1]).find(q => q.y > y0 + 0.005 && q.key !== 'rail');
        const e = hit ? hit.y - y0 : Infinity; if (e < 1.90 && (!pire || e < pire.e)) pire = { e, p, i };
      }
      if (pire) E({ p: pire.p, marche: pire.i + 1, e: pire.e, texte: `On se cogne la tête dans « ${sName(s)} » : ${f2(pire.e)} m d'échappée au-dessus de la marche ${pire.i + 1} (${pt(pire.p)}), il faut 1,90 m.` });
      // montée puis descente au clavier, image par image, trois lignes de marche, trois départs décalés
      for (const up of [true, false]) {
        let bad = null;
        for (const fps of [60, 120]) for (const dOff of [0, 0.15, -0.15]) for (const ph of [0, 1 / 3, 2 / 3]) { if (!bad) { const r = monte(s, up, fps, dOff, ph); if (r) bad = Object.assign(r, { fps }); } }
        if (!bad) continue;
        const verbe = up ? 'monte' : 'descend', ou = `à ${f2(bad.t)} m de la première marche`;
        E({ p: [bad.x, bad.z], t: bad.t, sens: up ? 'montee' : 'descente', level: up ? s.from : s.to, texte: bad.depart ? `On ne peut pas se tenir ${up ? 'au pied' : 'à l\'arrivée'} de « ${sName(s)} » (${pt([bad.x, bad.z])}).`
          : bad.refus ? `« ${sName(s)} » ne se ${verbe} pas au clavier : le pas est refusé ${ou} (${bad.fps} i/s).`
          : bad.bloque ? `« ${sName(s)} » ne se ${verbe} pas : le visiteur est arrêté ${ou}.`
          : bad.saut != null ? `« ${sName(s)} » : la hauteur saute de ${(bad.saut * 100).toFixed(0)} cm ${ou} en ${up ? 'montant' : 'descendant'}.`
          : `« ${sName(s)} » : en ${up ? 'montant' : 'descendant'}, on n'arrive pas au sol de ${lname(up ? s.to : s.from)}.` });
      }
    }

    // 5. vides : bords bordés d'un mur ou d'un garde-corps (sauf l'arrivée), garde-corps hors de l'arrivée, on n'y marche pas, rien dedans
    const arrivees = k => stairs.filter(s => s.to === k).map(s => [App.stairPt(s, s.len, -s.width / 2), App.stairPt(s, s.len, s.width / 2), s]);
    for (const v of voids) {
      const k = v.level, poly = G.polyArea(v.poly) < 0 ? v.poly.slice().reverse() : v.poly, arrs = arrivees(k), rails = v.rails || [];
      const surRail = p => rails.some(r => r.some((q, i) => i > 0 && segD(p, r[i - 1], q) <= 0.06));
      const surArr = p => arrs.some(([a, b]) => segD(p, a, b) <= 0.02);
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.02) continue;
        const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nOut = [u[1], -u[0]]; // polygone direct : l'extérieur du vide est à droite
        let run = null; const runs = [];
        for (let t = 0.025; t <= L - 0.025 + 1e-9; t += 0.05) {
          const p = VV.add(a, VV.mul(u, t)), libre = !matiere(k, VV.add(p, VV.mul(nOut, 0.03))) && !surRail(p) && !surArr(p);
          if (libre) { run = run || [p, p]; run[1] = p; } else if (run) { runs.push(run); run = null; }
        }
        if (run) runs.push(run);
        for (const [p0, p1] of runs) out.push(tag({ type: 'vide', id: v.id, a: p0, b: p1, texte: `Le bord du vide de ${lname(k)} n'a ni mur ni garde-corps de ${pt(p0)} à ${pt(p1)} : on peut y tomber.` }, k));
        // on ne marche pas dans le vide : départ à 40 cm du bord, pas de 1,35 m/s vers le vide (60 i/s)
        let chute = null;
        for (let t = 0.05; t <= L - 0.05 && !chute; t += 0.1) {
          const p = VV.add(a, VV.mul(u, t)); if (surArr(p) || runs.some(([p0, p1]) => segD(p, p0, p1) < 0.06)) continue;
          let [x, z] = VV.add(p, VV.mul(nOut, 0.4)); const [cx, cz] = V.collide(x, z, 0.18, k); if (Math.hypot(cx - x, cz - z) > 0.01 || !App.roomAt(x, z, k)) continue;
          const st = 1.35 / 60, mx = -nOut[0] * st, mz = -nOut[1] * st;
          for (let f = 0; f < 40; f++) { const r = V.walkMove(x, z, mx, mz, k); if (r[2]) break; x = r[0]; z = r[1]; if (dedans([x, z], v.poly, 0.005)) { chute = [x, z]; break; } }
        }
        if (chute) out.push(tag({ type: 'vide', id: v.id, p: chute, texte: `On peut marcher dans le vide de ${lname(k)} (${pt(chute)}).` }, k));
      }
      // garde-corps en travers de l'arrivée : l'escalier ne déboucherait plus
      for (const [a, b, s] of arrs) { const m = VV.mul(VV.add(a, b), 0.5); if (rails.some(r => r.some((q, i) => i > 0 && segD(m, r[i - 1], q) < 0.1))) out.push(tag({ type: 'vide', id: v.id, garde_corps: 'arrivee', p: m, texte: `Un garde-corps barre l'arrivée de « ${sName(s)} » (${pt(m)}).` }, k)); }
      // aucune pièce dans le vide, aucun équipement dedans (du sol au plafond du niveau)
      const seen = new Set(); let equip = null;
      grille(v.poly, 0.1, 0.05, (x, z) => {
        const r = App.roomAt(x, z, k); if (r && !seen.has(r.id)) { seen.add(r.id); out.push(tag({ type: 'vide', id: r.id, piece: r.id, vide: v.id, p: [x, z], texte: `La pièce « ${r.name || r.id} » de ${lname(k)} recouvre le vide (${pt([x, z])}).` }, k)); }
        if (!equip && VX(x, z).some(q => q.root === 'fixed' && q.y > LV[k].y - 0.3 && q.y < LV[k].y + LV[k].H)) equip = [x, z];
      });
      if (equip) out.push(tag({ type: 'vide', id: v.id, equipement: true, p: equip, texte: `Un équipement est posé dans le vide de ${lname(k)} (${pt(equip)}).` }, k));
    }
    // rien sur l'emprise d'un escalier au niveau bas : ni pièce, ni équipement, ni vue, ni arrêt (sauf l'arrêt de l'escalier, au pied)
    for (const s of stairs) {
      const k = s.from, seen = new Set(); let equip = null;
      grille(s.poly, 0.1, 0.05, (x, z) => {
        const r = App.roomAt(x, z, k); if (r && !seen.has(r.id)) { seen.add(r.id); out.push(tag({ type: 'vide', id: r.id, piece: r.id, escalier: s.id, p: [x, z], texte: `La pièce « ${r.name || r.id} » de ${lname(k)} recouvre « ${sName(s)} » (${pt([x, z])}).` }, k)); }
        if (!equip && VX(x, z).some(q => q.root === 'fixed' && q.y > LV[k].y && q.y < LV[k].y + LV[k].H)) equip = [x, z];
      });
      if (equip) out.push(tag({ type: 'vide', id: s.id, equipement: true, p: equip, texte: `Un équipement est posé sur « ${sName(s)} » (${pt(equip)}).` }, k));
      for (const ph of D.photos || []) if (!ph.orbit && lvOf(ph) === k && dedans(ph.cam, s.poly, 0.02)) out.push(tag({ type: 'photo', id: ph.id, texte: `La vue « ${ph.t} » est prise sur « ${sName(s)} ».` }, k));
      for (const st of D.stops) if (st.stair !== s.id && lvOf(st) === k && dedans(st.p, s.poly, 0.02)) out.push(tag({ type: 'arret', id: st.id, texte: `L'arrêt « ${st.label} » est sur « ${sName(s)} ».` }, k));
    }

    // 6. dalles : grille de 10 cm dans le contour de chaque niveau ; sol à y_k (sauf vide), plafond à y_k + H (sauf sous un vide du dessus)
    for (let k = 0; k < LV.length; k++) {
      const Lk = LV[k], ol = Lk.outline || D.outline, vk = voids.filter(v => v.level === k), vu = voids.filter(v => v.level === k + 1), sk = stairs.filter(s => s.from === k);
      const trou = { sol: [], plafond: [], pleinSol: [], pleinPlafond: [] };
      grille(ol, 0.1, 0.03, (x, z) => {
        const p = [x, z], H = VX(x, z).filter(bati), yb = Lk.y + 0.3, yc = Lk.y + Lk.H - 0.5;
        if (vk.some(v => dedans(p, v.poly, 0.03))) { if (H.some(q => q.y < yb && q.y > yb - 0.40 && q.key !== 'rail')) trou.pleinSol.push(p); }
        else if (!vk.some(v => pres(p, v.poly, 0.03)) && !sk.some(s => pres(p, s.poly, 0.03))) { if (!H.some(q => q.y < yb && q.y > yb - 0.65)) trou.sol.push(p); }
        if (vu.some(v => dedans(p, v.poly, 0.03))) { if (H.some(q => q.y > yc && q.y < yc + 0.6 && (q.key === 'ceiling' || q.key === 'slab'))) trou.pleinPlafond.push(p); }
        else if (!vu.some(v => pres(p, v.poly, 0.03))) { if (!H.some(q => q.y > yc && q.y < yc + 0.6 && q.key !== 'rail')) trou.plafond.push(p); }
      });
      const bb = ps => { const b = G.bbox(ps); return [b[0], b[2], b[1], b[3]]; };
      const T2 = { sol: `Trou dans le sol de ${lname(k)}`, plafond: `Trou dans le plafond de ${lname(k)}`, pleinSol: `Le plancher de ${lname(k)} n'est pas ouvert au-dessus de l'escalier`, pleinPlafond: `Le plafond de ${lname(k)} n'est pas ouvert sous le vide du dessus` };
      for (const [cle, ps] of Object.entries(trou)) if (ps.length) { const b = bb(ps); out.push(tag({ type: 'dalle', id: cle, p: ps[0], a: [b[0], b[1]], b: [b[2], b[3]], n: ps.length, texte: `${T2[cle]} (${pt(ps[0])}, ${ps.length} points de 10 cm).` }, k)); }
    }
    // faces superposées : deux faces horizontales de même sens à la même hauteur, dalle ou plafond, dans deux maillages différents
    { const bnd = D.bounds || G.bbox(D.outline), par = new Map();
      for (let x = bnd[0] + 0.1; x < bnd[1]; x += 0.2) for (let z = bnd[2] + 0.1; z < bnd[3]; z += 0.2) {
        const H = VX(x, z).filter(q => bati(q) && (q.key === 'slab' || q.key === 'ceiling'));
        for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length && H[j].y - H[i].y < 5e-4; j++) if (H[i].obj !== H[j].obj && H[i].up === H[j].up) {
          const k = V.levelOfY(H[i].y), c = par.get(k) || { p: [x, z], y: H[i].y, n: 0 }; c.n++; par.set(k, c);
        }
      }
      for (const [k, c] of par) out.push(tag({ type: 'dalle', id: 'superposee', p: c.p, y: c.y, n: c.n, texte: `Deux dalles se superposent à ${f2(c.y)} m (${pt(c.p)}, ${c.n} points) : la surface scintille.` }, k));
    }

    // 6 ter. façade au raccord de deux niveaux : chant de dalle ou de plafond dans le même plan qu'un mur, sans que l'un l'emporte
    // (polygonOffset) : la bande scintille. Rayons horizontaux vers la façade, dans l'épaisseur du plancher
    { const rcf = new T.Raycaster(); let pire = null, n = 0, kk = 0;
      for (let k = 1; k < LV.length; k++) {
        const lo = LV[k - 1], ol = LV[k].outline || D.outline, sg = G.polyArea(ol) > 0 ? 1 : -1;
        for (let i = 0; i < ol.length; i++) {
          const a = ol[i], b = ol[(i + 1) % ol.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.2) continue;
          const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nrm = [u[1] * sg, -u[0] * sg];
          if (pip([a[0] + u[0] * L / 2 + nrm[0] * 0.05, a[1] + u[1] * L / 2 + nrm[1] * 0.05], ol)) nrm = [-nrm[0], -nrm[1]];
          for (let t = 0.1; t < L - 0.1; t += 0.2) for (const y of [lo.y + lo.H + 0.01, LV[k].y - 0.1]) {
            const e = [a[0] + u[0] * t + nrm[0] * 0.3, a[1] + u[1] * t + nrm[1] * 0.3];
            rcf.set(new T.Vector3(e[0], y, e[1]), new T.Vector3(-nrm[0], 0, -nrm[1])); rcf.far = 0.6;
            const h = rcf.intersectObjects([V.G.arch, V.G.ceil].filter(Boolean), true).filter(q => q.object.isMesh && q.object.visible);
            if (h.length > 1 && h[1].distance - h[0].distance < 5e-4 && (h[0].object.userData.lot ?? h[0].object.id) !== (h[1].object.userData.lot ?? h[1].object.id) && !h[0].object.material.polygonOffset && !h[1].object.material.polygonOffset) { n++; pire = pire || [e[0], e[1]]; kk = k; }
          }
        }
      }
      if (n) out.push(tag({ type: 'dalle', id: 'facade', p: pire, n, texte: `Un chant de dalle et un mur sont dans le même plan en façade de ${lname(kk)} (${pt(pire)}, ${n} points) : la bande scintille.` }, kk));
    }
    // 6 bis. rebords : au raccord de deux niveaux, le haut d'un mur du dessous, une dalle ou un plafond qui dépasse de quelques
    // millimètres du nu d'un mur du dessus (dans un vide ou en façade) fait une ligne claire au soleil. Rayon vertical à 0,5 mm et à 2 cm
    // du nu : une face horizontale à la première distance et pas à la seconde est un rebord
    for (let k = 1; k < LV.length; k++) {
      const lo = LV[k - 1], y0 = lo.y + lo.H - 0.03, y1 = LV[k].y + 0.005, vk = voids.filter(v => v.level === k), ol = LV[k].outline || D.outline;
      const lg = [...(D.L[k].loggias || []), ...(D.L[k - 1].loggias || [])].map(l => l.slab);
      const face = p => VX(p[0], p[1]).some(q => bati(q) && q.up && q.y > y0 && q.y < y1 && q.key !== 'rail' && q.key !== 'ext'); // enduit de façade : 6 mm voulus, comme sous les étages voisins
      let pire = null, n = 0;
      for (const m of D.L[k].masses || []) for (const ring of [m.poly, ...(m.trous || [])]) for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nrm = [u[1], -u[0]];
        const mid = [a[0] + u[0] * L / 2, a[1] + u[1] * L / 2]; if (matiere(k, [mid[0] + nrm[0] * 0.003, mid[1] + nrm[1] * 0.003])) nrm = [-nrm[0], -nrm[1]];
        for (let t = 0.025; t < L - 0.02; t += 0.05) {
          const e = [a[0] + u[0] * t, a[1] + u[1] * t], p1 = [e[0] + nrm[0] * 0.0005, e[1] + nrm[1] * 0.0005], p2 = [e[0] + nrm[0] * 0.02, e[1] + nrm[1] * 0.02];
          if (matiere(k, p2) || lg.some(q => pip(p1, q) || pip(p2, q)) || !(vk.some(v => pip(p2, v.poly)) || !pip(p2, ol))) continue; // seulement dans un vide ou dehors
          if (face(p1) && !face(p2)) { n++; pire = pire || e; }
        }
      }
      if (n) out.push(tag({ type: 'rebord', id: 'rebord', p: pire, n, texte: `Un rebord de quelques millimètres dépasse d'un mur de ${lname(k)} (${pt(pire)}, ${n} points) : ligne claire sur le mur.` }, k));
    }

    // 6 quater. plafond d'un niveau sous un autre : grille de 5 cm dans ses pièces (hors murs, baies, vides du dessus et volées), la
    // première face bâtie au-dessus de 1,90 m est le plafond, à y + H près de 1,5 mm ; un pied de mur du dessus qui descend plus bas
    // trace au plafond le plan des cloisons du dessus (ligne claire)
    for (let k = 0; k + 1 < LV.length; k++) {
      const Lk = LV[k], yt = Lk.y + Lk.H, vu = voids.filter(v => v.level === k + 1), sk = stairs.filter(s => s.from === k || s.to === k);
      const baies = D.L[k].walls.filter(w => w.virtual && w.quad).map(w => w.quad); let pire = null, n = 0;
      // soffite voulu (plafond abaissé d'une pièce hachurée sur le plan, duplex : cellier « HSP=2.25m ») : pas un rebord
      const sof = D.rooms.filter(q => lvOf(q) === k && q.soffite && Array.isArray(q.soffite.poly) && q.soffite.poly.length >= 3).map(q => q.soffite.poly);
      for (const r of D.rooms) {
        if (lvOf(r) !== k || App.isExt(r) || r.of) continue;
        grille(r.poly, 0.05, 0.01, (x, z) => {
          const p = [x, z]; if (matiere(k, p) || baies.some(q => pres(p, q, 0.01)) || vu.some(v => pres(p, v.poly, 0.03)) || sk.some(s => pres(p, s.poly, 0.03)) || sof.some(q => pres(p, q, 0.02))) return;
          const h = VX(x, z).find(q => bati(q) && q.y > Lk.y + 1.9 && q.y < yt + 0.05);
          if (h && h.y < yt - 0.0015) { n++; pire = pire || { p, y: h.y }; }
        });
      }
      if (n) out.push(tag({ type: 'dalle', id: 'rebord-plafond', p: pire.p, y: pire.y, n, texte: `Un élément du niveau du dessus descend sous le plafond de ${lname(k)} (${pt(pire.p)}, à ${f2(pire.y)} m, ${n} points de 5 cm) : ligne visible au plafond.` }, k));
    }
    // 6 quinquies. raccord des murs de deux niveaux, dans un vide et en façade : juste sous le plafond du dessous, deux faces de mur à
    // moins de 3 mm l'une de l'autre sans être confondues se disputent le tampon de profondeur (pointillés qui scintillent)
    { const rcw = new T.Raycaster(), murK = o => /^(wall_b|wall_c|ext)$/.test(o.userData.key || '');
      for (let k = 1; k < LV.length; k++) {
        const lo = LV[k - 1], y = lo.y + lo.H - 0.005; let pire = null, n = 0;
        const bords = [...voids.filter(v => v.level === k).map(v => [v.poly, 1]), [LV[k].outline || D.outline, -1]];
        for (const [poly, sens] of bords) {
          const sg = (G.polyArea(poly) > 0 ? 1 : -1) * sens;
          for (let i = 0; i < poly.length; i++) {
            const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue;
            const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nIn = [-u[1] * sg, u[0] * sg]; // vers l'intérieur du vide, vers l'extérieur du contour
            for (let t = 0.05; t < L - 0.04; t += 0.05) {
              const e = [a[0] + u[0] * t + nIn[0] * 0.25, a[1] + u[1] * t + nIn[1] * 0.25];
              rcw.set(new T.Vector3(e[0], y, e[1]), new T.Vector3(-nIn[0], 0, -nIn[1])); rcw.far = 0.6;
              const h = rcw.intersectObjects([V.G.arch, V.G.ceil].filter(Boolean), true).filter(q => q.object.isMesh && q.object.visible);
              if (h.length > 1 && murK(h[0].object) && murK(h[1].object) && (h[0].object.userData.lot ?? h[0].object.id) !== (h[1].object.userData.lot ?? h[1].object.id) && h[1].distance - h[0].distance > 2e-4 && h[1].distance - h[0].distance < 3e-3) { n++; pire = pire || e; }
            }
          }
        }
        if (n) out.push(tag({ type: 'dalle', id: 'raccord-murs', p: pire, n, texte: `Au raccord de ${lname(k - 1)} et ${lname(k)}, deux faces de mur sont à quelques millimètres l'une de l'autre (${pt(pire)}, ${n} points) : ligne qui scintille.` }, k));
      }
    }
    // 5 bis. garde-corps : aucun tronçon de moins de 10 cm (lisse et poteaux s'empilent sur ceux de l'angle voisin)
    for (const v of voids) for (const r of v.rails || []) for (let i = 1; i < r.length; i++) { const l = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]);
      if (l > 1e-3 && l < 0.1) { out.push(tag({ type: 'vide', id: v.id, p: r[i], texte: `Le garde-corps du vide de ${lname(v.level)} a un tronçon de ${(l * 100).toFixed(0)} cm (${pt(r[i])}) : poteaux et lisse empilés à l'angle.` }, v.level)); break; } }
    // 7. lampes : au plus 8 lampes à ombre allumées, quel que soit le niveau du visiteur ; aucune lampe dans un vide ni sous un plafond ouvert
    { const w = V.walk, lights0 = App.state.lights, lvw = w.lv; App.set('lights', 'on');
      for (let k = 0; k < LV.length; k++) { w.lv = k; V.updateLamps(); const n = V.lamps.filter(l => l.castShadow && l.intensity > 0).length; if (n > 8) out.push(tag({ type: 'lampes', id: 'ombres', n, texte: `${n} lampes à ombre allumées sur ${lname(k)} : 8 au plus.` }, k)); }
      w.lv = lvw; App.set('lights', lights0); V.updateLamps();
      const P3 = new T.Vector3();
      V.lamps.forEach((l, i) => { l.getWorldPosition(P3); const k = l.userData.lv ?? 0, p = [P3.x, P3.z], v = voids.find(q => (q.level === k || q.level === k + 1) && dedans(p, q.poly, 0.02));
        if (v) out.push(tag({ type: 'lampes', id: 'lampe-' + i, p, vide: v.id, texte: `Une lampe de ${lname(k)} pend dans le vide (${pt(p)}).` }, k)); });
    }

    // 8. niveaux : pièces dans le contour de leur niveau ; caméra de chaque vue et de chaque arrêt au-dessus du sol de son niveau
    for (const r of D.rooms) {
      if (App.isExt(r) || r.of) continue; // seuil : dans l'épaisseur du mur, le contour peut s'arrêter au nu intérieur côté loggia
      const k = lvOf(r), ol = LV[k].outline || D.outline; let hors = null;
      grille(r.poly, 0.1, 0.02, (x, z) => { if (!pres([x, z], ol, 0.03)) { hors = [x, z]; return false; } });
      if (hors) out.push(tag({ type: 'niveau', id: r.id, piece: r.id, p: hors, texte: `La pièce « ${r.name || r.id} » déborde du contour de ${lname(k)} (${pt(hors)}).` }, k));
    }
    { const w = V.walk, EYE = V.EYE || 1.6;
      const cam = (type, id, name, x, z, k) => {
        if (!App.roomAt(x, z, k)) return; // déjà signalée (hors du logement)
        w.anim = null; w.glide = null; w.x = x; w.z = z; w.lv = k; w.y = LV[k].y; w.st = null; V.setWalkCamera();
        const cy = V.camera.position.y, sol = VX(x, z).filter(q => bati(q) && q.y < cy).pop();
        if (Math.abs(cy - (LV[k].y + EYE)) > 0.05 || !sol || Math.abs(sol.y - LV[k].y) > 0.06) out.push(tag({ type: 'niveau', id, vue: type, x, z, texte: `${name} n'est pas à hauteur d'œil au-dessus du sol de ${lname(k)} (œil à ${f2(cy)} m, sol à ${sol ? f2(sol.y) : 'aucun'}).` }, k));
      };
      for (const ph of D.photos || []) if (!ph.orbit) cam('photo', ph.id, `La vue « ${ph.t} »`, ph.cam[0], ph.cam[1], lvOf(ph));
      for (const s of D.stops) cam('arret', s.id, `L'arrêt « ${s.label} »`, s.p[0], s.p[1], lvOf(s));
    }
    return out;
  }, (brut && brut.sans_arret) || []);
  problems.push(...res);
}
// pas d'arrêt dans un réduit de moins de 2 m² (constat du 28/09/2026, plan-du-lot : arrêt et 360° dans le rangement de 1,17 m², quatre murs
// nus à 40 cm) : lire.ARRET_SURFACE_MIN
if (brut && !errors.length) for (const s of brut.stops || []) {
  const r = (brut.rooms || []).find(q => q.id === s.room && !q.of); if (!r || !Array.isArray(r.poly)) continue;
  let a = 0; for (let i = 0; i < r.poly.length; i++) { const p = r.poly[i], n = r.poly[(i + 1) % r.poly.length]; a += p[0] * n[1] - n[0] * p[1]; } a = Math.abs(a) / 2;
  if (a < 2.0 && !r.ext && r.floor !== 'loggia') problems.push(Object.assign({ type: 'arret', id: s.id, texte: `L'arrêt « ${s.label} » est dans un réduit de ${a.toFixed(2)} m² : quatre murs nus, pas d'arrêt ni de 360° en dessous de 2 m².` }, MULTI ? { level: s.level || 0 } : {}));
}
// photo de pièce qui montre la pièce (constat du 28/09/2026, 3124 : « Séjour/cuisine, autre angle » ne montrait plus que deux murs nus) :
// dans une pièce de 7 m² et plus, une baie (fenêtre, porte-fenêtre), une porte ouverte sur une autre pièce ou un passage se voit dans le
// cadre (champ horizontal de l'image 16:10, rayon libre depuis l'œil jusqu'à 15 cm de lui, portes dans l'état de la photo)
if (!errors.length) problems.push(...await page.evaluate(() => {
  const out = [], D = App.D, V = __v, T = V.THREE, MULTI = !!D.multi, rc = new T.Raycaster(), O3 = new T.Vector3(), P3 = new T.Vector3(), d3 = new T.Vector3();
  // murs et équipements (le vantail ou le cadre de la baie visée ne la cachent pas)
  const tout = [V.G.arch, V.G.fixed].filter(Boolean), visO = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const libre = (o, p) => { O3.set(...o); P3.set(...p); d3.copy(P3).sub(O3); const L = d3.length(); d3.normalize(); rc.set(O3, d3); rc.near = 0; rc.far = L - 0.08;
    return !rc.intersectObjects(tout, true).some(h => h.object.isMesh && visO(h.object) && h.object.material && h.object.material.visible !== false && !/glass/.test(h.object.userData.key || '')); };
  const aire = q => { let a = 0; for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; } return Math.abs(a) / 2; };
  App.set('mode', 'walk');
  for (const ph of D.photos || []) {
    if (ph.orbit || !ph.cam) continue;
    const k = ph.level || 0, [x, z, yaw, , fov] = ph.cam, r0 = App.roomAt(x, z, k), r = r0 && D.rooms.find(q => q.id === (r0.of || r0.id));
    if (!r || App.isExt(r) || aire(r.poly) < 7) continue;
    V.operables.forEach(o => { const op = D.openings[o.id], want = (ph.open || []).includes(o.id) ? 1 : (ph.close || []).includes(o.id) ? 0 : (op && !op.closed && op.kind === 'door' ? 1 : 0); o.target = o.t = want; o.apply(want); });
    V.scene.updateMatrixWorld(true);
    const y = (V.levels ? V.levels[k].y : 0), eye = [x, y + (V.EYE || 1.6), z], demi = Math.atan(Math.tan((fov || 66) * Math.PI / 360) * 1.6) - 3 * Math.PI / 180;
    const pts = [];
    for (const [id, o] of Object.entries(D.openings)) {
      if ((o.level || 0) !== k || !o.pt) continue;
      const ouvert = o.kind === 'window' || o.kind === 'french' || (o.kind === 'door' && !o.closed && V.operables.some(q => q.id === id && q.t > 0.5));
      if (!ouvert) continue;
      const hy = y + Math.min(1.2, (o.head || 2) - 0.2); // nu de la baie côté appareil, à mi-largeur et aux quarts
      for (const f of [0.25, 0.5, 0.75]) { const s_ = o.s[0] + (o.s[1] - o.s[0]) * f, a = o.pt(s_, 0), b = o.pt(s_, o.depth), m = Math.hypot(a[0] - x, a[1] - z) < Math.hypot(b[0] - x, b[1] - z) ? a : b; pts.push([m[0], hy, m[1]]); }
    }
    for (const q of D.passages || []) if (q.p && (q.level ?? k) === k && (q.a === r.id || q.b === r.id)) pts.push([q.p[0], y + 1.2, q.p[1]]);
    const vue = pts.some(p => { const a = Math.atan2(-(p[0] - x), -(p[2] - z)), da = Math.abs(Math.atan2(Math.sin(a - yaw), Math.cos(a - yaw))); return da <= demi && Math.hypot(p[0] - x, p[2] - z) > 0.3 && libre(eye, p); });
    if (!vue) out.push(Object.assign({ type: 'photo', id: ph.id, texte: `La vue « ${ph.t} » ne montre ni fenêtre, ni porte, ni passage : elle ne cadre que des murs.` }, MULTI ? { level: k } : {}));
  }
  return out;
}));
if (scriptsReseau.size) problems.push({ type: 'reseau', id: 'scripts', texte: `La visite charge ses scripts depuis le réseau (${[...scriptsReseau].join(', ')}) : elle ne démarre pas sans connexion à ce site.` });
// portes conformes au dessin (fiche C4, 28/09/2026 : porte de la chambre 1 du 3124 lue à l'envers) : charnière et sens de chaque porte
// comparés à l'arc de débattement du plan de vente. PDF vectoriel : centre de l'arc (extract.json) au bout de la baie où est la charnière,
// extrémité ouverte du côté où la porte s'ouvre. Plan en image : l'arc théorique de la porte (rayon entre la largeur du vantail et celle de
// la baie, de 10° à 40° d'ouverture) est dessiné sur 80 % des angles au moins, ou aucune autre hypothèse ne l'est nettement mieux (30 points).
// Un logement sur un niveau (le repère de la page est celui du plan).
let extr = null; try { extr = JSON.parse(fs.readFileSync(path.join(root, dir, 'extract.json'), 'utf8')); } catch (e) {}
if (!errors.length && extr && !MULTI) problems.push(...await page.evaluate(async (E, base) => {
  const out = [], D = App.D;
  const portes = Object.entries(D.openings).filter(([, o]) => (o.kind === 'door' || o.kind === 'entry') && o.pt && o.w >= 0.5);
  const hyp = (o, ch, sw) => { const face = sw > 0 ? o.depth : 0, sH = ch === 's1' ? o.s[1] - 0.04 : o.s[0] + 0.04, sT = ch === 's1' ? o.s[0] + 0.04 : o.s[1] - 0.04;
    const H = o.pt(sH, face), r = Math.abs(sT - sH), fer = [(sT - sH) / r * o.u[0], (sT - sH) / r * o.u[1]], ouv = [o.T[0] * sw, o.T[1] * sw]; return { H, r, fer, ouv }; };
  const arcs = (E.arcs || []).filter(a => Array.isArray(a) && a.length === 4);
  if (arcs.length) {
    for (const [id, o] of portes) {
      const ends = [['s0', o.pt(o.s[0], 0), o.pt(o.s[0], o.depth)], ['s1', o.pt(o.s[1], 0), o.pt(o.s[1], o.depth)]];
      let best = null;
      for (const [e1, e2, c, r] of arcs) for (const [ch, pa, pb] of ends) {
        const d = Math.min(Math.hypot(c[0] - pa[0], c[1] - pa[1]), Math.hypot(c[0] - pb[0], c[1] - pb[1]));
        if (d <= 0.15 && r >= 0.55 * o.w && r <= 1.15 * o.w && (!best || d < best.d)) best = { d, ch, e1, e2, c };
      }
      if (!best) continue;
      const nrm = e => (e[0] - best.c[0]) * o.T[0] + (e[1] - best.c[1]) * o.T[1], ouv = Math.abs(nrm(best.e1)) > Math.abs(nrm(best.e2)) ? best.e1 : best.e2, sw = nrm(ouv) > 0 ? 1 : -1;
      if (best.ch !== o.hinge || sw !== o.swing) out.push({ type: 'porte', id, texte: `La porte « ${o.label || id} » ne suit pas son arc sur le plan de vente : ${best.ch !== o.hinge ? 'charnière du mauvais côté' : ''}${best.ch !== o.hinge && sw !== o.swing ? ', ' : ''}${sw !== o.swing ? 'ouverte du mauvais côté' : ''}.` });
    }
    return out;
  }
  const im = E.image; if (!E.raster || !im || !im.file) return out;
  const img = new Image(); img.src = base + im.file; try { await img.decode(); } catch (e) { return out; }
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, cv.width, cv.height).data, k = im.px_par_m, [ox, oz] = im.origine_px;
  const sombre = (x, z) => { const u = Math.round(ox + x * k), v = Math.round(oz + z * k); let b = 255;
    for (let du = -2; du <= 2; du++) for (let dv = -2; dv <= 2; dv++) { const uu = u + du, vv = v + dv; if (uu < 0 || vv < 0 || uu >= cv.width || vv >= cv.height) continue; const i = (vv * cv.width + uu) * 4; b = Math.min(b, 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]); } return b; };
  const score = (o, ch, sw) => { const { H, r, fer, ouv } = hyp(o, ch, sw); let n = 0, vu = 0;
    for (let deg = 10; deg <= 40; deg++) { const a = deg * Math.PI / 180; n++; let ok = false;
      for (let i = 0; i < 9 && !ok; i++) { const rr = r - 0.03 + 0.015 * i; ok = sombre(H[0] + rr * (Math.cos(a) * fer[0] + Math.sin(a) * ouv[0]), H[1] + rr * (Math.cos(a) * fer[1] + Math.sin(a) * ouv[1])) < 200; }
      vu += ok; } return vu / n; };
  // porte d'un coffret de tableau (3124) : vantail dessiné entrouvert, arc très court ; l'arc essayé vers l'intérieur de la niche tomberait
  // sur ses murs, sombres. On juge le vantail : trait droit depuis la charnière, entre 15° et 70°, au-delà de l'huisserie (7 cm)
  const coffret = o => (D.fixtures || []).some(f => f.type === 'tableau' && f.x && f.z && [-0.08, o.depth + 0.08].some(d => { const p = o.pt((o.s[0] + o.s[1]) / 2, d);
    return p[0] > Math.min(...f.x) - 0.01 && p[0] < Math.max(...f.x) + 0.01 && p[1] > Math.min(...f.z) - 0.01 && p[1] < Math.max(...f.z) + 0.01; }));
  const vantail = (o, ch, sw) => { const { H, r, fer, ouv } = hyp(o, ch, sw); let best = 0;
    for (let deg = 15; deg <= 70; deg += 2) { const a = deg * Math.PI / 180, d = [Math.cos(a) * fer[0] + Math.sin(a) * ouv[0], Math.cos(a) * fer[1] + Math.sin(a) * ouv[1]]; let n = 0, v = 0;
      for (let i = 0; i <= 30; i++) { const rr = 0.9 * r * i / 30; if (rr * Math.sin(a) <= 0.07) continue; n++; v += sombre(H[0] + d[0] * rr, H[1] + d[1] * rr) < 128; }
      if (n >= 8) best = Math.max(best, v / n); } return best; };
  for (const [id, o] of portes) {
    if (coffret(o)) {
      const lu = vantail(o, o.hinge, o.swing), m = [['s0', 1], ['s0', -1], ['s1', 1], ['s1', -1]].filter(([c, s]) => c !== o.hinge || s !== o.swing).map(([c, s]) => ({ c, s, v: vantail(o, c, s) })).reduce((a, b) => (b.v > a.v ? b : a));
      if (lu < 0.8 && m.v >= 0.8 && m.v - lu >= 0.2) out.push({ type: 'porte', id, texte: `La porte « ${o.label || id} » ne suit pas le vantail dessiné sur le plan de vente : ${m.c !== o.hinge ? 'charnière du mauvais côté' : ''}${m.c !== o.hinge && m.s !== o.swing ? ', ' : ''}${m.s !== o.swing ? 'ouverte du mauvais côté' : ''} (vantail dessiné à ${Math.round(100 * lu)} % contre ${Math.round(100 * m.v)} %).` });
      continue;
    }
    const lu = score(o, o.hinge, o.swing), autres = [['s0', 1], ['s0', -1], ['s1', 1], ['s1', -1]].filter(([c, s]) => c !== o.hinge || s !== o.swing).map(([c, s]) => ({ c, s, v: score(o, c, s) }));
    const m = autres.reduce((a, b) => (b.v > a.v ? b : a));
    if (lu < 0.8 && m.v >= 0.8 && m.v - lu >= 0.3) out.push({ type: 'porte', id, texte: `La porte « ${o.label || id} » ne suit pas son arc sur le plan de vente : ${m.c !== o.hinge ? 'charnière du mauvais côté' : ''}${m.c !== o.hinge && m.s !== o.swing ? ', ' : ''}${m.s !== o.swing ? 'ouverte du mauvais côté' : ''} (arc dessiné à ${Math.round(100 * lu)} % contre ${Math.round(100 * m.v)} %).` });
  }
  return out;
}, extr, `/${dir.replace(/\/$/, '')}/`));
// plan en image : disque plein gris ou noir de 8 à 15 cm posé sur le bord d'une loggia = descente d'eaux pluviales (constat du 28/09/2026,
// 3124 : disque gris de 10 cm à l'angle de la loggia, oublié) ; une descente de la visite à 30 cm au plus. Traits fins détachés du disque
// par une ouverture de 5 px (quadrillage du dallage)
if (!errors.length && extr && extr.raster && extr.image && extr.image.file && !MULTI) problems.push(...await page.evaluate(async (E, base) => {
  const out = [], D = App.D, im = E.image, img = new Image(); img.src = base + im.file; try { await img.decode(); } catch (e) { return out; }
  const lg = D.rooms.filter(r => App.isExt(r) && !r.of && r.poly && r.poly.length >= 3); if (!lg.length) return out;
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const W = cv.width, H = cv.height, px = g.getImageData(0, 0, W, H).data, k = im.px_par_m, [ox, oz] = im.origine_px;
  const dseg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const bord = (x, z) => lg.some(r => r.poly.some((p, i) => dseg(x, z, p, r.poly[(i + 1) % r.poly.length]) <= 0.12));
  let [u0, u1, v0, v1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const r of lg) for (const p of r.poly) { u0 = Math.min(u0, ox + (p[0] - 0.3) * k); u1 = Math.max(u1, ox + (p[0] + 0.3) * k); v0 = Math.min(v0, oz + (p[1] - 0.3) * k); v1 = Math.max(v1, oz + (p[1] + 0.3) * k); }
  u0 = Math.max(0, Math.floor(u0)); v0 = Math.max(0, Math.floor(v0)); u1 = Math.min(W - 1, Math.ceil(u1)); v1 = Math.min(H - 1, Math.ceil(v1));
  const w = u1 - u0 + 1, h = v1 - v0 + 1, lum = (u, v) => { const i = (v * W + u) * 4; return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; };
  const disque = []; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(b) <= 1 || a === 0) disque.push([a, b]); // ellipse 5 × 5 d'OpenCV (murs.descentes_ep)
  for (const [lo, hi] of [[90, 210], [-1, 90]]) {
    const m = new Uint8Array(w * h); for (let v = 0; v < h; v++) for (let u = 0; u < w; u++) { const l = lum(u0 + u, v0 + v); m[v * w + u] = l > lo && l < hi ? 1 : 0; }
    const ero = new Uint8Array(w * h), op = new Uint8Array(w * h);
    for (let v = 2; v < h - 2; v++) for (let u = 2; u < w - 2; u++) ero[v * w + u] = disque.every(([a, b]) => m[(v + b) * w + u + a]) ? 1 : 0;
    for (let v = 2; v < h - 2; v++) for (let u = 2; u < w - 2; u++) if (ero[v * w + u]) for (const [a, b] of disque) op[(v + b) * w + u + a] = 1;
    const vu = new Uint8Array(w * h);
    for (let s = 0; s < w * h; s++) { if (!op[s] || vu[s]) continue; const pile = [s]; vu[s] = 1; let n = 0, su = 0, sv = 0, a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      while (pile.length) { const c = pile.pop(), u = c % w, v = (c - u) / w; n++; su += u; sv += v; a0 = Math.min(a0, u); a1 = Math.max(a1, u); b0 = Math.min(b0, v); b1 = Math.max(b1, v);
        for (const d of [1, -1, w, -w, w + 1, w - 1, -w + 1, -w - 1]) { const q = c + d; if (q >= 0 && q < w * h && op[q] && !vu[q]) { vu[q] = 1; pile.push(q); } } }
      const bw = a1 - a0 + 1, bh = b1 - b0 + 1, dm = (bw + bh) / 2 / k;
      if (dm < 0.08 || dm > 0.15 || Math.abs(bw - bh) > 0.2 * Math.max(bw, bh) || n / (bw * bh) < 0.7 || n / (bw * bh) > 0.86) continue;
      const x = (u0 + su / n - ox) / k, z = (v0 + sv / n - oz) / k; if (!bord(x, z)) continue;
      if (!(D.fixtures || []).some(f => f.type === 'dep' && f.p && Math.hypot(f.p[0] - x, f.p[1] - z) <= 0.3))
        out.push({ type: 'equipement', id: 'dep', texte: `La descente d'eaux pluviales dessinée au bord de la loggia (${x.toFixed(2)} ; ${z.toFixed(2)}) manque dans la visite.` }); }
  }
  return out;
}, extr, `/${dir.replace(/\/$/, '')}/`));
// navigation, clic : depuis chaque arrêt intérieur, une grille de 32 × 20 points sur l'écran. 90 % au moins des clics mènent quelque part
// (déplacement, ou porte et fenêtre ouvertes ou fermées), dont 60 % au moins à un déplacement ; aucune arrivée dans un placard, hors
// d'une pièce ou d'une volée (sur une marche : à la hauteur de la rampe), ni sur un autre niveau que celui de ce qu'on a touché ; un clic
// au sol arrive au point visé s'il est libre, sinon à 15 cm au plus du point libre le plus proche (même pièce, là où le visiteur tient debout)
if (!errors.length) problems.push(...await page.evaluate(async () => {
  const out = [], D = App.D, V = __v, MULTI = !!D.multi, nom = k => MULTI ? ` (${App.levelName(k)})` : '', tag = (pb, k) => MULTI ? Object.assign(pb, { level: k }) : pb;
  if (!V.clickPlan) return [{ type: 'navigation', id: 'clic', texte: 'Le moteur ne dit pas où mène un clic : la navigation au clic n\'est pas vérifiée.' }];
  App.set('mode', 'walk');
  const cv = V.renderer.domElement, isPl = r => !!r && /placard/i.test(r.id), rAt = (x, z, k) => MULTI ? App.roomAt(x, z, k) : App.roomAt(x, z);
  const rid = (x, z, k) => { const r = rAt(x, z, k); return r ? r.of || r.id : null; };
  const libre = (x, z, k, y, room) => rid(x, z, k) === room && (V.standable ? V.standable(x, z, y) : (([cx, cz]) => Math.hypot(cx - x, cz - z) < 0.005)(MULTI ? V.collide(x, z, 0.18, k, y) : V.collide(x, z, 0.18)));
  const rampe = (x, z, y) => MULTI && V.surfacesAt(x, z).some(f => f.st && Math.abs(f.y - y) < 0.1);
  const f2 = v => v.toFixed(2);
  const poser = s => { const k = s.level || 0, w = V.walk; if (V.placeAt) return V.placeAt(s.p[0], s.p[1], k, s.yaw, s.pitch ?? -0.06); Object.assign(w, { anim: null, glide: null, x: s.p[0], z: s.p[1], yaw: s.yaw, pitch: s.pitch ?? -0.06 }); if (MULTI) Object.assign(w, { lv: k, y: V.levels[k].y, st: null }); V.setWalkCamera(); };
  for (const s of D.stops) {
    const k = s.level || 0, r0 = rAt(s.p[0], s.p[1], k); if (!r0 || App.isExt(r0)) continue; // arrêts intérieurs
    // portes comme dans la visite : ouvertes (sauf porte palière et portes dites fermées), puis celles que l'arrêt ouvre ou ferme
    V.operables.forEach(o => { const op = D.openings[o.id]; let v = op && op.kind === 'door' && !op.closed ? 1 : 0; if ((s.open || []).includes(o.id)) v = 1; if ((s.close || []).includes(o.id)) v = 0; o.target = o.t = v; o.apply(v); });
    poser(s); V.scene.updateMatrixWorld(true);
    let n = 0, act = 0, dep = 0; const hors = [], niv = [], prec = [];
    for (let j = 0; j < 20; j++) for (let i = 0; i < 32; i++) {
      const cx = (i + 0.5) / 32 * innerWidth, cy = (j + 0.5) / 20 * innerHeight; if (document.elementFromPoint(cx, cy) !== cv) continue;
      n++; const c = V.clickPlan(cx, cy);
      if (c.bascule) { act++; continue; }
      if (!c.P) continue;
      act++; const P = c.P, e = P[P.length - 1], ye = P.ys ? P.ys[P.ys.length - 1] : 0, le = MULTI ? V.levelOfY(ye) : 0;
      let len = 0; for (let q = 1; q < P.length; q++) len += Math.hypot(P[q][0] - P[q - 1][0], P[q][1] - P[q - 1][1]); if (len > 0.05) dep++;
      const re = rAt(e[0], e[1], le);
      if (isPl(re) || (!re && !rampe(e[0], e[1], ye))) hors.push(e);
      // arrivée sur le niveau de la destination, et destination sur le niveau de ce qu'on a touché (sol, mur ou plafond de ce niveau)
      if (MULTI) { const L = V.levels[c.tg.lv], hy = c.h.point.y; if (le !== c.tg.lv || hy < L.y - 0.05 || hy > L.y + L.H + 0.05) niv.push(e); }
      if (c.tg.kind === 'sol') { // précision du clic au sol
        const h = c.h.point, lv = c.tg.lv, y = c.tg.y, room = rid(h.x, h.z, lv);
        if (libre(h.x, h.z, lv, y, room)) { const d = Math.hypot(e[0] - h.x, e[1] - h.z); if (d > 0.01) prec.push({ d, p: [h.x, h.z], libre: true }); continue; }
        // point libre le plus proche (à 2 cm près, dans les 60 cm) : l'arrivée n'est pas plus loin du point visé que lui, à 15 cm près
        // (un point libre enclavé, qu'aucun chemin n'atteint, ne compte pas)
        const cand = []; for (let dx = -0.6; dx <= 0.6; dx += 0.02) for (let dz = -0.6; dz <= 0.6; dz += 0.02) { const dd = Math.hypot(dx, dz); if (dd <= 0.6 && libre(h.x + dx, h.z + dz, lv, y, room)) cand.push([dd, h.x + dx, h.z + dz]); }
        cand.sort((a, b) => a[0] - b[0]); let bd = null;
        for (const [dd, x, z] of cand.slice(0, 6)) { const Q = V.planTo ? V.planTo(x, z, { y }) : [[x, z]], q = Q && Q[Q.length - 1]; if (q && Math.hypot(q[0] - x, q[1] - z) < 0.01) { bd = dd; break; } }
        if (bd != null) { const d = Math.hypot(e[0] - h.x, e[1] - h.z) - bd; if (d > 0.15) prec.push({ d, p: [h.x, h.z], libre: false }); }
      }
    }
    if (!n) continue;
    const pa = act / n, pd = dep / n, nm = `l'arrêt « ${s.label || s.id} »${nom(k)}`;
    if (pa < 0.9 || pd < 0.6) out.push(tag({ type: 'navigation', id: s.id, clic: +pa.toFixed(3), deplacement: +pd.toFixed(3), texte: `Depuis ${nm}, un clic ne mène nulle part sur ${Math.round((1 - pa) * 100)} % de l'écran et fait avancer sur ${Math.round(pd * 100)} % seulement (attendu : 90 % et 60 %).` }, k));
    if (hors.length) out.push(tag({ type: 'navigation', id: s.id, p: hors[0], texte: `Depuis ${nm}, ${hors.length} clic(s) mènent dans un placard ou hors des pièces (${f2(hors[0][0])} ; ${f2(hors[0][1])}).` }, k));
    if (niv.length) out.push(tag({ type: 'navigation', id: s.id, p: niv[0], texte: `Depuis ${nm}, ${niv.length} clic(s) mènent sur un autre niveau que celui du point visé (${f2(niv[0][0])} ; ${f2(niv[0][1])}).` }, k));
    if (prec.length) { const w = prec.sort((a, b) => b.d - a.d)[0]; out.push(tag({ type: 'navigation', id: s.id, p: w.p, texte: `Depuis ${nm}, ${prec.length} clic(s) au sol n'arrivent pas où il faut : jusqu'à ${Math.round(w.d * 100)} cm ${w.libre ? 'du point visé, pourtant libre' : 'plus loin du point visé que le point libre le plus proche'} (${f2(w.p[0])} ; ${f2(w.p[1])}).` }, k)); }
  }
  return out;
}));
// navigation, portes à la marche (aide du moteur, simulée pas à pas avec le vrai pas de marche) : qui marche droit vers le mur à côté
// d'une baie (centre du corps de 5 à 60 cm au-delà du tableau) n'est jamais rapproché d'elle ni emmené de l'autre côté ; une correction ne dépasse
// jamais la moitié du pas ; de face, décalé de 25 cm, on passe. Qualité en mouvement : un écran à 30 i/s (économiseur d'énergie de
// Chrome, batterie faible) ne fait pas baisser la qualité, une image sur deux manquée à 60 i/s la fait baisser
if (!errors.length) problems.push(...await page.evaluate(() => {
  const out = [], D = App.D, V = __v, G = App.geo, MULTI = !!D.multi, nom = k => MULTI ? ` (${App.levelName(k)})` : '', tag = (pb, k) => MULTI ? Object.assign(pb, { level: k }) : pb;
  if (!V.doorAssist) return [{ type: 'navigation', id: 'portes', texte: 'Le moteur ne dit pas comment il aide à passer les portes : l\'aide n\'est pas vérifiée.' }];
  App.set('mode', 'walk');
  const rAt = (x, z, k) => MULTI ? App.roomAt(x, z, k) : App.roomAt(x, z), W = V.walk, fps = 60, step = 1.35 / fps;
  const isRoom = r => r && !/placard/i.test(r.id) && !(r.hidden && !r.of);
  const ops = V.operables.filter(op => { const o = D.openings[op.id]; return o && op.id !== 'placard' && (o.kind === 'door' || (o.kind === 'french' && !(o.sill > 0))); });
  const save = V.operables.map(op => [op, op.t, op.target]);
  V.operables.forEach(op => { op.t = op.target = 1; op.apply(1); });
  // un pas de marche comme stepWalk : aide aux portes, puis le vrai pas du moteur (collisions, sol)
  const pas = (x, z, k, d) => { W.x = x; W.z = z; W.lv = W._lv = k; W.st = null; const [mx, mz] = V.doorAssist(d[0] * step, d[1] * step); const r = MULTI ? V.walkMove(x, z, mx, mz, k) : V.walkMove(x, z, mx, mz); return { x: r[0], z: r[1], mx, mz }; };
  for (const op of ops) {
    const o = D.openings[op.id], k = o.level || 0, y = V.levels ? V.levels[k].y : 0, m = (o.s[0] + o.s[1]) / 2, hw = (o.s[1] - o.s[0]) / 2;
    const side = sg => { for (let d = 0.02; d <= 0.3; d += 0.02) { const r = rAt(...o.pt(m, sg < 0 ? -d : o.depth + d), k); if (r) return r; } return null; };
    if (!isRoom(side(-1)) || !isRoom(side(1))) continue;
    const along = (x, z) => G.V.dot(G.V.sub([x, z], o.main.a), o.T), lat = (x, z) => G.V.dot(G.V.sub([x, z], o.main.a), o.u) - m;
    const libre = (x, z) => isRoom(rAt(x, z, k)) && (V.standable ? V.standable(x, z, y) : true);
    let asp = null, trop = null, bloque = null;
    for (const dirn of [1, -1]) {
      const T = [o.T[0] * dirn, o.T[1] * dirn], face = dirn > 0 ? 0 : o.depth;
      // vers le mur à côté de la baie : 1,2 m de marche droite, jamais de pas de côté, jamais de l'autre côté
      for (const off of [0.05, 0.2, 0.4, 0.6]) for (const sg of [1, -1]) {
        const p0 = o.pt(m + sg * (hw + off), face - dirn * 1.0); if (!libre(p0[0], p0[1])) continue;
        // chemin droit dégagé jusqu'au mur (sinon on glisse contre un meuble : ce n'est pas l'aide aux portes)
        let net = true; for (let d = 0.9; d >= 0.2 && net; d -= 0.05) { const q = o.pt(m + sg * (hw + off), face - dirn * d); net = libre(q[0], q[1]); }
        // ni un équipement posé contre le mur, au bout du chemin (descente d'eaux pluviales au pied de la façade, 3124) : on le contourne
        { const q = o.pt(m + sg * (hw + off), face - dirn * 0.1); if ((D.fixtures || []).some(f => (f.level || 0) === k && (f.p ? Math.hypot(f.p[0] - q[0], f.p[1] - q[1]) < 0.3 + (f.r || 0)
          : f.x && f.z && q[0] > Math.min(...f.x) - 0.3 && q[0] < Math.max(...f.x) + 0.3 && q[1] > Math.min(...f.z) - 0.3 && q[1] < Math.max(...f.z) + 0.3))) net = false; }
        if (!net) continue;
        let x = p0[0], z = p0[1];
        for (let f = 0; f < 1.2 / step; f++) { const r = pas(x, z, k, T); x = r.x; z = r.z; }
        // rapproché de la baie de plus de 5 cm (les collisions contre le tableau repoussent, elles ne rapprochent pas), ou passé
        const passe = (along(x, z) - (dirn > 0 ? o.depth : 0)) * dirn > 0.05 && Math.abs(lat(x, z)) < hw;
        if (passe || Math.abs(lat(...p0)) - Math.abs(lat(x, z)) > 0.05) asp = asp || { off, x, z, passe };
      }
      // de face, décalé de 25 cm (dans la baie) : on passe, et chaque correction reste sous la moitié du pas
      for (const off of [-0.25, 0.25]) {
        if (Math.abs(off) > hw - 0.05) continue;
        const p0 = o.pt(m + off, face - dirn * 1.0); if (!libre(p0[0], p0[1])) continue;
        let x = p0[0], z = p0[1], still = 0, ok = false;
        for (let f = 0; f < 3 / step; f++) {
          const r = pas(x, z, k, T); if (Math.hypot(r.mx - T[0] * step, r.mz - T[1] * step) > 0.5 * step + 1e-6) trop = trop || { off };
          still = Math.hypot(r.x - x, r.z - z) < 1e-4 ? still + 1 : 0; x = r.x; z = r.z;
          if ((along(x, z) - (dirn > 0 ? o.depth + 0.3 : -0.3)) * dirn >= 0) { ok = true; break; }
          if (still > 20) break;
        }
        if (!ok) bloque = bloque || { off, d: along(x, z) };
      }
    }
    const nm = `la porte « ${o.label || op.id} »${nom(k)}`;
    if (asp) out.push(tag({ type: 'navigation', id: op.id, texte: `En marchant droit vers le mur à ${Math.round(asp.off * 100)} cm du tableau de ${nm}, le visiteur est ${asp.passe ? 'emmené de l\'autre côté' : 'dévié vers la baie'} : il ne doit jamais être aspiré.` }, k));
    if (trop) out.push(tag({ type: 'navigation', id: op.id, texte: `À l'approche de ${nm}, la correction de trajectoire dépasse la moitié du pas : le visiteur glisse de côté.` }, k));
    if (bloque) out.push(tag({ type: 'navigation', id: op.id, texte: `De face, décalé de ${Math.round(bloque.off * 100)} cm, le visiteur ne passe pas ${nm} au clavier (arrêté à ${bloque.d.toFixed(2)} m du nu du mur).` }, k));
  }
  for (const [op, t, tg] of save) { op.t = t; op.target = tg; op.apply(t); }
  // régulateur de qualité, sur une copie de son état : 60 intervalles à la cadence de l'écran
  if (V.aqMeasure && V.aq) {
    const A = V.aq, sv = JSON.stringify({ lvl: A.lvl, ft: A.ft, miss: A.miss, skip: A.skip, stable: A.stable, upWait: A.upWait, probing: A.probing, vs: A.vs });
    const essai = (vs, ms) => { Object.assign(A, { lvl: 0, ft: [], miss: [], skip: 0, stable: 0, upWait: 1e9, probing: false, vs }); for (let i = 0; i < 60; i++) V.aqMeasure(ms); return A.lvl; };
    const l30 = essai(1000 / 30, 1000 / 30), l60 = essai(1000 / 60, 1000 / 30), l120 = essai(1000 / 120, 1000 / 60);
    Object.assign(A, JSON.parse(sv));
    if (l30 !== 0) out.push({ type: 'navigation', id: 'qualite', texte: `Sur un écran à 30 i/s, la qualité en mouvement baisse de ${l30} palier(s) alors que chaque image arrive à temps.` });
    if (l60 === 0) out.push({ type: 'navigation', id: 'qualite', texte: 'Une image sur deux manquée à 60 i/s ne fait pas baisser la qualité en mouvement.' });
    if (l120 !== 0) out.push({ type: 'navigation', id: 'qualite', texte: `Sur un écran à 120 i/s, 60 images par seconde font baisser la qualité en mouvement de ${l120} palier(s).` });
  }
  return out;
}));
// navigation, regard (souris réelle) : le point saisi reste sous le curseur (3 px près) ; un geste égale une action (glissé de 4 px :
// on avance sans tourner ; glissé de 8 px : on tourne sans avancer) ; clic lent (0,8 s) : on avance ; clic droit : rien
if (!errors.length) {
  const nav = [], wait = ms => new Promise(r => setTimeout(r, ms));
  const cible = await page.evaluate(() => {
    const D = App.D, V = __v, MULTI = !!D.multi, rAt = (x, z, k) => MULTI ? App.roomAt(x, z, k) : App.roomAt(x, z);
    const poser = s => { const k = s.level || 0, w = V.walk; if (V.placeAt) return V.placeAt(s.p[0], s.p[1], k, s.yaw, s.pitch ?? -0.06); Object.assign(w, { anim: null, glide: null, x: s.p[0], z: s.p[1], yaw: s.yaw, pitch: s.pitch ?? -0.06 }); if (MULTI) Object.assign(w, { lv: k, y: V.levels[k].y, st: null }); V.setWalkCamera(); };
    // lancer de rayon comme le clic du moteur (sol, murs, plafonds, menuiseries, équipements affichés)
    const rc = new V.THREE.Raycaster(), ndc = new V.THREE.Vector2(), vu = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    window.__pick = V.pick || (e => { V.camera.updateMatrixWorld(); ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); rc.setFromCamera(ndc, V.camera);
      return rc.intersectObjects([V.G.arch, V.G.ceil, V.G.doors, V.G.fixed].filter(Boolean), true).filter(h => h.object.isMesh && (!h.object.userData.glass || h.object.userData.op) && h.object.geometry.type !== 'RingGeometry' && vu(h.object))[0] || null; });
    window.__poser = poser;
    for (const s of D.stops) {
      const k = s.level || 0, r0 = rAt(s.p[0], s.p[1], k); if (!r0 || App.isExt(r0)) continue;
      poser(s); V.scene.updateMatrixWorld(true);
      let best = null;
      for (let y = 0.95; y > 0.4; y -= 0.025) for (let x = 0.3; x <= 0.7; x += 0.025) {
        const h = __pick({ clientX: x * innerWidth, clientY: y * innerHeight });
        if (!h || !h.object.userData.walk || !(h.face && h.face.normal.y > 0.5) || document.elementFromPoint(x * innerWidth, y * innerHeight) !== V.renderer.domElement) continue;
        const d = Math.hypot(h.point.x - V.walk.x, h.point.z - V.walk.z); if (d > 1.2 && d < 4.5 && (!best || Math.abs(x - 0.5) < Math.abs(best.fx - 0.5))) best = { x: x * innerWidth, y: y * innerHeight, fx: x };
      }
      if (best) return { stop: s.id, ...best };
    }
    return null;
  });
  if (cible) {
    const place = () => page.evaluate(id => { __poser(App.D.stops.find(q => q.id === id)); __v.invalidate(3); }, cible.stop);
    const pose = () => page.evaluate(() => ({ x: __v.walk.x, z: __v.walk.z, yaw: __v.walk.yaw }));
    const fin = async () => { for (let i = 0; i < 60; i++) { await wait(100); if (await page.evaluate(() => !__v.walk.anim && !__v.lookVel)) break; } };
    // lacet au lâcher, avant que le clic ne lance un trajet
    await page.evaluate(() => { window.__lacher = null; addEventListener('pointerup', () => { __lacher = __v.walk.yaw; }, { capture: true }); });
    const W = await page.evaluate(() => [innerWidth, innerHeight]);
    // 1. saisie : un point pris sous le curseur, glissé de 150 × 60 px
    await place(); await wait(200);
    { const x0 = W[0] / 2 - 90, y0 = W[1] / 2 - 30, P = await page.evaluate((x, y) => { const h = __pick({ clientX: x, clientY: y }); return h ? [h.point.x, h.point.y, h.point.z] : null; }, x0, y0);
      if (P) { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x0 + 150, y0 + 60, { steps: 15 }); await wait(80);
        const e = await page.evaluate((P, x, y) => { const v = new __v.THREE.Vector3(...P).project(__v.camera); return Math.hypot((v.x + 1) / 2 * innerWidth - x, (1 - v.y) / 2 * innerHeight - y); }, P, x0 + 150, y0 + 60);
        await page.mouse.up(); await fin();
        if (!(e <= 3)) nav.push({ type: 'navigation', id: 'regard', ecart: +e.toFixed(1), texte: `Le regard ne suit pas la main : le point saisi finit à ${Math.round(e)} px du curseur après un glissé de 160 px (3 px au plus).` }); } }
    // 2. glissé de 4 px sur le sol : un clic (on avance, la vue ne tourne pas) ; 3. glissé de 8 px : un regard (on tourne, on n'avance pas)
    for (const [px, clic] of [[4, true], [8, false]]) {
      await place(); await wait(200); const a = await pose();
      await page.mouse.move(cible.x, cible.y); await page.mouse.down(); await page.mouse.move(cible.x + px, cible.y, { steps: 4 }); await wait(150); await page.mouse.up();
      const yl = await page.evaluate(() => __lacher); await wait(300); await fin(); const b = await pose(), m = Math.hypot(b.x - a.x, b.z - a.z), dy = Math.abs(yl - a.yaw);
      if (clic && (m < 0.3 || dy > 1e-6)) nav.push({ type: 'navigation', id: 'geste', texte: `Un glissé de ${px} px sur le sol ${m < 0.3 ? 'ne fait pas avancer' : 'fait aussi tourner la vue'} (${m.toFixed(2)} m, ${(dy * 57.3).toFixed(1)}°) : un geste doit n'avoir qu'un effet.` });
      if (!clic && (m > 0.01 || dy < 1e-4)) nav.push({ type: 'navigation', id: 'geste', texte: `Un glissé de ${px} px ${m > 0.01 ? `fait avancer de ${m.toFixed(2)} m` : 'ne fait pas tourner la vue'} : c'est un regard, il ne doit que tourner la vue.` });
    }
    // 4. clic lent (appui de 0,8 s) : on avance ; 5. clic droit : rien
    { await place(); await wait(200); const a = await pose(); await page.mouse.move(cible.x, cible.y); await page.mouse.down(); await wait(800); await page.mouse.up(); await wait(300); await fin(); const b = await pose(), m = Math.hypot(b.x - a.x, b.z - a.z);
      if (m < 0.3) nav.push({ type: 'navigation', id: 'clic-lent', texte: `Un clic appuyé 0,8 s sur le sol ne fait pas avancer (${m.toFixed(2)} m).` }); }
    { await place(); await wait(200); const a = await pose(); await page.mouse.click(cible.x, cible.y, { button: 'right' }); await wait(300); await fin(); const b = await pose(), m = Math.hypot(b.x - a.x, b.z - a.z);
      if (m > 0.01) nav.push({ type: 'navigation', id: 'clic-droit', texte: `Un clic droit fait avancer le visiteur de ${m.toFixed(2)} m : il ne doit rien faire.` }); }
  } else problems.push({ type: 'navigation', id: 'regard', texte: 'Aucun arrêt intérieur ne montre de sol à cliquer : le regard et les gestes ne sont pas vérifiés.' });
  problems.push(...nav);
}
// plan 2D de chaque niveau : le nom et la surface d'une pièce ne recouvrent ni un autre texte ni un équipement (boîtes rendues)
if (!errors.length) problems.push(...await page.evaluate(async () => {
  const out = [], D = App.D, NL = D.multi ? D.levels.length : 1, css = [...document.styleSheets].filter(sh => sh.ownerNode && /\.ui, #gallery/.test(sh.ownerNode.textContent || ''));
  css.forEach(sh => { sh.disabled = true; }); const mode0 = App.state.mode, lv0 = App.state.level; App.set('mode', 'plan');
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const aire = a => (a.right - a.left) * (a.bottom - a.top);
  for (let k = 0; k < NL; k++) {
    if (D.multi) App.set('level', k); await new Promise(r => setTimeout(r, 200));
    const svg = document.getElementById('plan'), M = svg.getScreenCTM(); if (!M) continue;
    const scr = (x, z) => { const p = svg.createSVGPoint(); p.x = x; p.y = z; return p.matrixTransform(M); };
    const rect = b => { const a = scr(b[0], b[2]), c = scr(b[1], b[3]); return { left: Math.min(a.x, c.x), right: Math.max(a.x, c.x), top: Math.min(a.y, c.y), bottom: Math.max(a.y, c.y) }; };
    const ts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('#planTip')).map(t => ({ t: t.textContent, piece: /pl-room|pl-area/.test(t.getAttribute('class')), b: t.getBoundingClientRect() })).filter(t => aire(t.b) > 0);
    const eq = (D.fixtures || []).filter(f => (!D.multi || f.level === k) && f.x && f.z && f.type !== 'placard').map(f => ({ t: f.type, b: rect([f.x[0], f.x[1], f.z[0], f.z[1]]) }));
    // textes techniques du plan de vente (constat du 28/09/2026 : « F · OF · All. 25 », « PF + BSO », « LV », « TE », « 36/96 », « HSP ») :
    // aucun sigle en capitales (WC excepté), ni allège, seuil ou dimension de gaine recopiés
    for (const t of ts) {
      const s = t.t.trim(), sig = (s.match(/[A-ZÀ-Ý]{2,}/g) || []).filter(w => w !== 'WC');
      if (sig.length || /\bAll\.|\bSeuil\b|\bHSP\b|^\d+\s*\/\s*\d+$/.test(s))
        out.push(Object.assign({ type: 'texte', id: s, texte: `Dans le plan 2D${D.multi ? ` (${App.levelName(k)})` : ''}, le texte technique « ${s} » est montré à l'acquéreur.` }, D.multi ? { level: k } : {}));
    }
    // pièce à plafond abaissé (soffite) : jamais la hauteur générale écrite dedans (constat du 28/09/2026, D201 : « HSP 2,50 » dans l'Entrée,
    // hachurée « Soffite : 2,20m »)
    { const Hg = D.multi ? D.levels[k].H : D.H, gen = new RegExp(`(HSP|plafond)\\s*${App.fr(Hg).replace(',', '[,.]')}`);
      for (const r of D.rooms.filter(r => r.soffite && r.soffite.part >= 0.3 && !r.hidden && !r.of && (!D.multi || r.level === k)))
        for (const t of svg.querySelectorAll('text')) { if (!gen.test(t.textContent)) continue; const b = t.getBBox(), c = [b.x + b.width / 2, b.y + b.height / 2];
          const M2 = t.getCTM(), M0 = svg.getCTM(); if (!M2 || !M0) continue; const p = svg.createSVGPoint(); p.x = 0; p.y = 0; const q = p.matrixTransform(M0.inverse().multiply(M2));
          if (App.geo.pointInPoly(q.x, q.y, r.poly)) out.push(Object.assign({ type: 'texte', id: 'hauteur-' + r.id, texte: `Dans le plan 2D, « ${r.name} » porte la hauteur générale « ${t.textContent} » alors que son plafond est abaissé (soffite).` }, D.multi ? { level: k } : {})); } }
    // dessin d'un équipement dans son rectangle, à 1 cm près (constat du 28/09/2026 : éclair du tableau électrique à points fixes, sorti
    // de 20 à 25 cm d'un coffret étroit, en travers du mur ou dans la pièce voisine)
    for (const g of svg.querySelectorAll('g[data-eq]')) {
      const f = (D.fixtures || [])[+g.getAttribute('data-eq')]; if (!f || !f.x || !f.z || f.type === 'placard') continue;
      for (const el of g.querySelectorAll('rect, path, polyline, polygon, line, circle, ellipse')) {
        const b = el.getBBox(); if (!(b.width > 0 || b.height > 0)) continue;
        const d = Math.max(Math.min(...f.x) - b.x, b.x + b.width - Math.max(...f.x), Math.min(...f.z) - b.y, b.y + b.height - Math.max(...f.z));
        if (d > 0.01) { const r = D.rooms.find(q => !q.hidden && !q.of && (!D.multi || q.level === k) && App.geo.pointInPoly((f.x[0] + f.x[1]) / 2, (f.z[0] + f.z[1]) / 2, q.poly));
          out.push(Object.assign({ type: 'texte', id: 'dessin-' + f.type, texte: `Dans le plan 2D${D.multi ? ` (${App.levelName(k)})` : ''}, le dessin ${({ tableau: 'du tableau électrique', vanity: 'de la vasque', towel: 'du sèche-serviettes', bath: 'de la baignoire', shower: 'de la douche' })[f.type] || 'd\'un équipement'}${r ? ` (« ${r.name} »)` : ''} sort de son emplacement de ${Math.round(d * 100)} cm.` }, D.multi ? { level: k } : {})); break; }
      }
    }
    for (const a of ts.filter(t => t.piece)) {
      const hit = ts.find(b => b !== a && !(Math.abs(b.b.left + b.b.right - a.b.left - a.b.right) < 3) && inter(a.b, b.b) > 0.1 * Math.min(aire(a.b), aire(b.b))) || eq.find(e => inter(a.b, e.b) > 0.1 * aire(a.b));
      if (hit) out.push(Object.assign({ type: 'texte', id: a.t, texte: `Dans le plan 2D${D.multi ? ` (${App.levelName(k)})` : ''}, « ${a.t} » est écrit sur ${hit.t in { bath: 1, shower: 1, vanity: 1, wc: 1, tableau: 1, towel: 1 } ? 'un équipement' : `« ${hit.t} »`}.` }, D.multi ? { level: k } : {}));
    }
  }
  App.set('mode', mode0); if (D.multi) App.set('level', lv0); css.forEach(sh => { sh.disabled = false; });
  return out;
}));
// raccords visibles sur les murs (constats du 28/09/2026 : tirets du sol au plafond dans la chambre 1 du plan-du-lot, trait sur le mur du
// séjour du D201, raccords du 3124 ; face de 5 mm prise entre deux faces, lame, linteau en saillie) : depuis chaque arrêt, 12 caps × 3
// tangages, rendu de la profondeur, de la normale et de la classe (mur ou non). Un pixel dont la normale diffère de ses deux voisins, qui
// sont des murs, s'accordent et sont à sa profondeur (4 mm), est un raccord ; une cellule de 10 cm qui en réunit 40 sur 30 cm de haut au
// moins est un trait visible. Le détecteur de profondeur à ±2 mm ne les voit pas (ce ne sont pas des fentes traversantes)
if (!errors.length) problems.push(...await page.evaluate(async () => {
  const V = __v, T = V.THREE, D = App.D, R = V.renderer, MULTI = !!D.multi, W = 800, H = 500, out = [];
  App.set('mode', 'walk');
  V.operables.forEach(o => { const op = D.openings[o.id]; const w = op && !op.closed && op.kind === 'door' ? 1 : 0; o.target = o.t = w; o.apply(w); });
  // classes : murs et plafonds (raccords et fentes) ; brise-soleil (fentes seulement : D201, coulisse à 5 mm du jambage, bord crénelé sur
  // toute la hauteur ; leurs lames, elles, font des traits voulus)
  const MUR = new Set(['wall_b', 'wall_c', 'ext', 'facade', 'cap', 'ceiling', 'jamb']), BSO = new Set(['bso']);
  const rt = new T.WebGLRenderTarget(W, H, { type: T.FloatType, format: T.RGBAFormat });
  const mk = cl => new T.ShaderMaterial({ vertexShader: 'varying float vd; varying vec3 wn; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vd = -mv.z; wn = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*mv; }',
    fragmentShader: `varying float vd; varying vec3 wn; void main(){ vec3 n = normalize(wn); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(vd + ${cl}.0, n.x, n.y, n.z); }`, side: T.DoubleSide });
  const matA = mk(0), matM = mk(1000), matB = mk(2000), saved = [];
  V.scene.traverse(m => { if (m.isMesh) { saved.push([m, m.material, m.visible]); m.material = MUR.has(m.userData.key) ? matM : BSO.has(m.userData.key) ? matB : matA; } });
  const cam = new T.PerspectiveCamera(70, W / H, 0.05, 200), buf = new Float32Array(W * H * 4), bg = V.scene.background, fog = V.scene.fog;
  V.scene.background = null; V.scene.fog = null; R.setClearColor(0x000000, 1);
  const cell = {};
  try {
    for (const s of D.stops) {
      const k = s.level || 0; if (MULTI) V.placeAt(s.p[0], s.p[1], k, 0, 0); else V.placeAt(s.p[0], s.p[1], 0, 0, 0);
      V.scene.updateMatrixWorld(true); const y0 = V.camera.position.y;
      for (let c = 0; c < 12; c++) for (const pitch of [-0.35, 0, 0.35]) {
        cam.position.set(s.p[0], y0, s.p[1]); cam.rotation.set(pitch, c * Math.PI / 6, 0, 'YXZ'); cam.updateMatrixWorld(true);
        R.setRenderTarget(rt); R.clear(); R.render(V.scene, cam); R.readRenderTargetPixels(rt, 0, 0, W, H, buf); R.setRenderTarget(null);
        const raw = i => buf[i * 4], d = i => { const v = raw(i); return v <= 0 ? 1e4 : v >= 2000 ? v - 2000 : v >= 1000 ? v - 1000 : v; }, mur = i => raw(i) >= 1000 && raw(i) < 2000, bso = i => raw(i) >= 2000;
        const inv = cam.projectionMatrixInverse, mw = cam.matrixWorld, v3 = new T.Vector3(), fwd = new T.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
          const i = y * W + x, dc = d(i); if (dc > 8) continue;
          for (const st of [1, W]) { const a = i - st, b = i + st, fa = mur(a) || bso(a), fb = mur(b) || bso(b); if (!fa || !fb) continue;
            const da = d(a), db = d(b), tol = 0.004 * Math.max(1, dc);
            // fente : un trait plus lointain que ses deux voisins (murs presque au même plan) : on voit au travers ou derrière (fente de
            // moins de 4 mm que les rayons doublés à ±2 mm laissent passer ; jour de 5 mm entre une coulisse de brise-soleil et son jambage)
            const coplan = buf[a * 4 + 1] * buf[b * 4 + 1] + buf[a * 4 + 2] * buf[b * 4 + 2] + buf[a * 4 + 3] * buf[b * 4 + 3] > 0.995; // pas un angle rentrant
            if (coplan && dc > Math.max(da, db) + 0.01 && Math.abs(da - db) < 0.01 * Math.max(1, Math.min(da, db))) {
              v3.set((x + 0.5) / W * 2 - 1, (y + 0.5) / H * 2 - 1, 0.5).applyMatrix4(inv).applyMatrix4(mw).sub(cam.position).normalize();
              const dm = Math.min(da, db), P = cam.position.clone().addScaledVector(v3, dm / v3.dot(fwd)), key = 'f' + Math.round(P.x * 10) + ',' + Math.round(P.z * 10) + ',' + k;
              const e = cell[key] = cell[key] || { n: 0, y0: 99, y1: -99, s: s.label || s.id, k, fente: true }; e.n++; e.y0 = Math.min(e.y0, P.y); e.y1 = Math.max(e.y1, P.y); break; }
            if (!mur(a) || !mur(b) || Math.abs(da - db) > tol || Math.abs(dc - da) > tol) continue; // raccord : entre deux murs
            const na0 = buf[a * 4 + 1], na1 = buf[a * 4 + 2], na2 = buf[a * 4 + 3], nb0 = buf[b * 4 + 1], nb1 = buf[b * 4 + 2], nb2 = buf[b * 4 + 3];
            if (na0 * nb0 + na1 * nb1 + na2 * nb2 < 0.995 || na0 * buf[i * 4 + 1] + na1 * buf[i * 4 + 2] + na2 * buf[i * 4 + 3] > 0.9) continue;
            v3.set((x + 0.5) / W * 2 - 1, (y + 0.5) / H * 2 - 1, 0.5).applyMatrix4(inv).applyMatrix4(mw).sub(cam.position).normalize();
            const P = cam.position.clone().addScaledVector(v3, dc / v3.dot(fwd)), key = Math.round(P.x * 10) + ',' + Math.round(P.z * 10) + ',' + k;
            const e = cell[key] = cell[key] || { n: 0, y0: 99, y1: -99, s: s.label || s.id, k }; e.n++; e.y0 = Math.min(e.y0, P.y); e.y1 = Math.max(e.y1, P.y); break; }
        }
      }
    }
  } finally {
    for (const [m, mt, vis] of saved) { m.material = mt; m.visible = vis; } V.scene.background = bg; V.scene.fog = fog; rt.dispose(); matA.dispose(); matM.dispose();
  }
  const traits = Object.entries(cell).filter(([, e]) => e.fente ? e.n >= 15 && e.y1 - e.y0 >= 0.2 : e.n >= 40 && e.y1 - e.y0 >= 0.3).sort((a, b) => b[1].n - a[1].n).slice(0, 4);
  for (const [key0, e] of traits) { const key = key0.replace(/^f/, ''), [x, z] = key.split(',').map(Number); const Y0 = (V.levels && V.levels[e.k] ? V.levels[e.k].y : 0);
    if (e.fente) { out.push(Object.assign({ type: 'fente', id: 'fente-rendu', p: [x / 10, z / 10], n: e.n, texte: `Fente fine vue dans un mur vers (${(x / 10).toFixed(1)} ; ${(z / 10).toFixed(1)}), de ${(e.y0 - Y0).toFixed(2)} à ${(e.y1 - Y0).toFixed(2)} m, depuis l'arrêt « ${e.s} » (${e.n} points) : on voit au travers.` }, MULTI ? { level: e.k } : {})); continue; }
    out.push(Object.assign({ type: 'rendu', id: 'raccord', p: [x / 10, z / 10], n: e.n, texte: `Raccord visible sur un mur vers (${(x / 10).toFixed(1)} ; ${(z / 10).toFixed(1)}), de ${(e.y0 - Y0).toFixed(2)} à ${(e.y1 - Y0).toFixed(2)} m, vu depuis l'arrêt « ${e.s} » (${e.n} points) : trait ou tirets sur toute la hauteur.` }, MULTI ? { level: e.k } : {})); }
  return out;
}));
// titres de photos uniques (plusieurs niveaux) : deux « Loggia » dans la galerie ne disent pas laquelle est à quel étage
if (MULTI && brut && !errors.length) { const vus = new Set();
  for (const ph of brut.photos || []) { if (!ph || ph.orbit || !ph.t) continue; if (vus.has(ph.t)) problems.push({ type: 'niveau', id: String(ph.id), texte: `Deux photos portent le même titre « ${ph.t} » : le niveau n'est pas dit.` }); vus.add(ph.t); } }
// ids uniques sur tout le plan (plan brut) : sinon une photo en écrase une autre, un arrêt en masque un autre
if (MULTI && brut) for (const [cle, quoi] of [['rooms', 'pièce'], ['stops', 'arrêt'], ['photos', 'vue'], ['stairs', 'escalier'], ['voids', 'vide'], ['walls', 'mur']]) {
  const vus = new Set();
  for (const e of brut[cle] || []) { if (!e || e.id == null) continue; if (vus.has(e.id)) problems.push({ type: 'niveau', id: String(e.id), liste: cle, texte: `Deux éléments (${quoi}) portent le même identifiant « ${e.id} ».` }); vus.add(e.id); }
}
// cloison dessinée comme un voile : un mur « beton » mince (8 cm au plus) posé sur les aplats blancs minces du plan de vente (le tracé
// d'une cloison) et sur aucun aplat noir se dessine en noir dans le plan 2D. Comparé au relevé du PDF (extract.json, repère de la page)
if (brut && !errors.length) {
  let E = null; try { E = JSON.parse(fs.readFileSync(path.join(root, dir, 'extract.json'), 'utf8')); } catch (e) {}
  const pip = (x, z, q) => { let c = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) if ((q[i][1] > z) !== (q[j][1] > z) && x < (q[j][0] - q[i][0]) * (z - q[i][1]) / (q[j][1] - q[i][1]) + q[i][0]) c = !c; return c; };
  const larg = q => { let m = Infinity; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-6) continue;
    m = Math.min(m, Math.max(...q.map(p => Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / l))); } return m; };
  const bb = q => [Math.min(...q.map(p => p[0])), Math.max(...q.map(p => p[0])), Math.min(...q.map(p => p[1])), Math.max(...q.map(p => p[1]))];
  const polys = l => (l || []).filter(q => Array.isArray(q) && q.length >= 3).map(q => ({ q, b: bb(q) }));
  const blancs = E ? polys(E.remplissages_blancs).filter(p => larg(p.q) <= 0.08) : [], noirs = E ? polys(E.murs_noirs) : [];
  const dans = (l, x, z) => l.some(p => x >= p.b[0] && x <= p.b[1] && z >= p.b[2] && z <= p.b[3] && pip(x, z, p.q));
  if (blancs.length) for (const w of brut.walls || []) {
    if (!['beton', 'doublage'].includes(w.k) || !Array.isArray(w.poly) || w.poly.length < 3) continue;
    const t = larg(w.poly), b = bb(w.poly); if (t > 0.08 || Math.hypot(b[1] - b[0], b[3] - b[2]) < 0.25) continue;
    const k = w.level || 0, off = (MULTI && brut.levels[k] && brut.levels[k].offset) || [0, 0]; let n = 0, c = 0;
    for (let x = b[0] + 0.005; x < b[1]; x += 0.01) for (let z = b[2] + 0.005; z < b[3]; z += 0.01) if (pip(x, z, w.poly)) { n++; if (dans(blancs, x + off[0], z + off[1]) && !dans(noirs, x + off[0], z + off[1])) c++; }
    if (n && c / n >= 0.8) { const pb = { type: 'cloison', id: w.id, a: [b[0], b[2]], b: [b[1], b[3]], texte: `Une cloison de ${(t * 100).toFixed(0)} cm est dessinée en noir comme un voile dans le plan 2D${MULTI ? ` (${(brut.levels[k].name || 'Niveau ' + (k + 1))})` : ''} (${b[0].toFixed(2)} ; ${b[2].toFixed(2)} à ${b[1].toFixed(2)} ; ${b[3].toFixed(2)}).` }; if (MULTI) pb.level = k; problems.push(pb); }
  }
  // sigle écrit près de chaque baie, lu dans la légende de CE plan (un sigle ne vaut que par sa légende : FA = « fenêtre allège vitrée »
  // chez un promoteur, « fenêtre sur allège » chez un autre) : porte-fenêtre → baie où l'on passe ; allège vitrée → partie basse vitrée
  // fixe ; fenêtre sur allège → fenêtre sur un mur bas. Une baie construite autrement que sa légende est une erreur de lecture.
  // descente d'eaux pluviales écrite sur le plan (constat du 28/09/2026, T2 432 : « DEP » et son cercle dans l'angle de la loggia, absents
  // de la visite) : une descente à 30 cm au plus de chaque texte « DEP » ou « EP » accompagné d'un cercle de 6 à 16 cm
  if (E) for (const t of (E.textes || []).filter(t => Array.isArray(t) && t.length >= 3 && /^D?\.?E\.?P\.?$/.test(String(t[2]).trim().toUpperCase()))) {
    const c = (E._cercles || []).filter(c => c[2] >= 0.03 && c[2] <= 0.08 && Math.hypot(c[0] - t[0], c[1] - t[1]) <= 0.3).sort((a, b) => Math.hypot(a[0] - t[0], a[1] - t[1]) - Math.hypot(b[0] - t[0], b[1] - t[1]))[0];
    const p = c || t;
    const vu = (brut.fixtures || []).some(f => { if (f.type !== 'dep' || !Array.isArray(f.p)) return false; const off = (MULTI && brut.levels[f.level || 0] && brut.levels[f.level || 0].offset) || [0, 0];
      return Math.hypot(f.p[0] + off[0] - p[0], f.p[1] + off[1] - p[1]) <= 0.3; });
    if (!vu && (c || !(E._cercles))) problems.push({ type: 'equipement', id: 'dep', texte: `La descente d'eaux pluviales écrite « ${String(t[2]).trim()} » sur le plan (${p[0].toFixed(2)} ; ${p[1].toFixed(2)}) manque dans la visite.` });
  }
  // marche de moins d'1 cm entre deux faces d'une même paroi, vue d'une pièce (constats du 28/09/2026 : plan-du-lot, chambre 1, voile en
  // saillie de 5 mm sur la cloison ; D201, séjour, béton à 3,570 entre des cloisons à 3,575) : trait du sol au plafond, plinthe cassée.
  // Faces des masses murales (ce que le moteur dessine) de 5 cm et plus, parallèles à 4° près, tournées vers la même pièce, bout à bout
  // (2 cm au plus) et décalées de 0,5 mm à 1 cm, bords des baies compris (plan-du-lot : jambage du rangement) ; hors des placards
  { const pieces = (brut.rooms || []).filter(r => !r.hidden && !r.of && Array.isArray(r.poly) && r.poly.length >= 3);
    const dseg2 = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
    const lvs = MULTI ? brut.levels.map((l, k) => k) : [0];
    for (const k of lvs) {
      const src = MULTI ? (brut.levels[k].masses || []) : (brut.masses || []);
      const rings = src.flatMap(m => [m.poly, ...(m.trous || [])]).filter(q => Array.isArray(q) && q.length >= 3);
      const dansMasse = (x, z) => src.some(m => Array.isArray(m.poly) && pip(x, z, m.poly) && !(m.trous || []).some(h => pip(x, z, h)));
      const pk = pieces.filter(r => (r.level || 0) === k), ops = Object.values(brut.openings || {}).filter(o => (o.level || 0) === k && Array.isArray(o.p));
      const pl = (brut.fixtures || []).filter(f => (f.level || 0) === k && f.type === 'placard' && f.x && f.z);
      const gk = (brut.gaines || []).filter(g => (g.level || 0) === k && Array.isArray(g.poly) && g.poly.length >= 3).map(g => g.poly); // face cachée par une gaine
      const fa = [];
      for (const q of rings) for (let i = 0; i < q.length; i++) {
        const a = q[i], b = q[(i + 1) % q.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
        const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const n = [[u[1], -u[0]], [-u[1], u[0]]].find(n => pk.some(r => pip(m[0] + n[0] * 0.03, m[1] + n[1] * 0.03, r.poly)) && !dansMasse(m[0] + n[0] * 0.003, m[1] + n[1] * 0.003)
          && !gk.some(g => pip(m[0] + n[0] * 0.03, m[1] + n[1] * 0.03, g)));
        if (!n) continue;
        const pts = [0, 0.25, 0.5, 0.75, 1].map(t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        const excl = pl.some(f => pts.some(p => p[0] > Math.min(...f.x) - 0.03 && p[0] < Math.max(...f.x) + 0.03 && p[1] > Math.min(...f.z) - 0.03 && p[1] < Math.max(...f.z) + 0.03));
        fa.push({ a, b, L, u, n, m, excl });
      }
      const marches = [];
      for (const e of fa) for (const f of fa) {
        if (e.excl || f.L <= e.L || f.n[0] * e.n[0] + f.n[1] * e.n[1] < Math.cos(4 * Math.PI / 180)) continue;
        const d = p => (p[0] - f.a[0]) * f.n[0] + (p[1] - f.a[1]) * f.n[1], da = d(e.a), db = d(e.b), dm = Math.max(Math.abs(da), Math.abs(db));
        if (dm > 0.01 || dm < 5e-4) continue;
        const s = p => (p[0] - f.a[0]) * f.u[0] + (p[1] - f.a[1]) * f.u[1], s0 = Math.min(s(e.a), s(e.b)), s1 = Math.max(s(e.a), s(e.b));
        if (s0 > f.L + 0.02 || s1 < -0.02) continue;
        if (!marches.some(q => Math.hypot(q.m[0] - e.m[0], q.m[1] - e.m[1]) < 0.3)) marches.push({ dm, m: e.m });
      }
      for (const q of marches.sort((a, b) => b.dm - a.dm).slice(0, 3)) problems.push(Object.assign({ type: 'mur', id: 'nu', texte: `Deux faces d'un même mur sont décalées de ${(q.dm * 1000).toFixed(0)} mm${MULTI ? ` (${brut.levels[k].name || 'niveau ' + (k + 1)})` : ''} vers (${q.m[0].toFixed(2)} ; ${q.m[1].toFixed(2)}) : trait du sol au plafond et plinthe cassée.` }, MULTI ? { level: k } : {}));
    } }
  // emplacement d'appareil dessiné en pointillés avec son sigle (constat du 28/09/2026, D201 : lave-linge « LL » du WC absent du plan 2D) :
  // un emplacement indicatif (kitchenHint) contient le sigle (murs.emplacements)
  if (E && Array.isArray(E.pointilles)) {
    const SIG = new Set(['LL', 'LV', 'SL', 'LS', 'R', 'F', 'FR', 'REF', 'C', 'CU', 'CUI', 'TRI', 'CE', 'BAL', 'NOURRICES', 'NOURICES']);
    const pts = E.pointilles.flatMap(l => Array.isArray(l) ? l : []).filter(q => Array.isArray(q) && q.length === 2);
    const kh = (brut.kitchenHint || []).filter(k => k && Array.isArray(k.r)).map(k => { const off = (MULTI && brut.levels[k.level || 0] && brut.levels[k.level || 0].offset) || [0, 0]; return [k.r[0] + off[0], k.r[1] + off[0], k.r[2] + off[1], k.r[3] + off[1]]; });
    const pieces = (brut.rooms || []).filter(r => !r.of && Array.isArray(r.poly) && r.poly.length >= 3).map(r => { const off = (MULTI && brut.levels[r.level || 0] && brut.levels[r.level || 0].offset) || [0, 0]; return r.poly.map(p => [p[0] + off[0], p[1] + off[1]]); });
    for (const t of E.textes || []) {
      if (!Array.isArray(t) || t.length < 3 || !SIG.has(String(t[2]).trim().toUpperCase().replace(/\./g, '')) || !pieces.some(q => pip(t[0], t[1], q))) continue;
      if (kh.some(r => t[0] >= r[0] - 0.05 && t[0] <= r[1] + 0.05 && t[1] >= r[2] - 0.05 && t[1] <= r[3] + 0.05)) continue;
      const pr = pts.filter(q => Math.abs(q[0] - t[0]) < 0.7 && Math.abs(q[1] - t[1]) < 0.7); if (pr.length < 3) continue;
      const x0 = Math.min(...pr.map(q => q[0])), x1 = Math.max(...pr.map(q => q[0])), z0 = Math.min(...pr.map(q => q[1])), z1 = Math.max(...pr.map(q => q[1]));
      if (x1 - x0 < 0.4 || x1 - x0 > 1.2 || z1 - z0 < 0.4 || z1 - z0 > 1.2 || t[0] < x0 - 0.02 || t[0] > x1 + 0.02 || t[1] < z0 - 0.02 || t[1] > z1 + 0.02) continue;
      const aireI = r => Math.max(0, Math.min(r[1], x1) - Math.max(r[0], x0)) * Math.max(0, Math.min(r[3], z1) - Math.max(r[2], z0));
      if (kh.some(r => aireI(r) > 0.1 * (x1 - x0) * (z1 - z0))) continue;
      problems.push({ type: 'equipement', id: 'emplacement', texte: `L'emplacement « ${String(t[2]).trim()} » dessiné en pointillés sur le plan de vente (${t[0].toFixed(2)} ; ${t[1].toFixed(2)}) manque dans le plan 2D.` });
    }
  }
  // mur posé sur une partie d'aplat que la découpe du PDF cache (constat du 28/09/2026, D201 : trois bouts de 30 cm hors du logement, blancs
  // au rendu, pris pour des murs) : aucune masse murale sur la partie masquée d'un aplat (hors de ses morceaux visibles et de tout autre aplat
  // noir ou blanc), au-delà de 0,01 m²
  if (E && E._murs_decoupes && Object.keys(E._murs_decoupes).length) {
    const cache = Object.entries(E._murs_decoupes).map(([i, vis]) => ({ q: E.murs_noirs[+i], b: bb(E.murs_noirs[+i] || [[0, 0]]), vis: polys(vis) })).filter(c => Array.isArray(c.q) && c.q.length >= 3);
    const autres = polys((E.murs_noirs || []).filter((q, i) => !(String(i) in E._murs_decoupes))).concat(polys(E.remplissages_blancs || []));
    let n = 0; const ou = [];
    for (const w of brut.walls || []) {
      if (!Array.isArray(w.poly) || w.poly.length < 3 || w.virtual || w.suppose) continue;
      const k = w.level || 0, off = (MULTI && brut.levels[k] && brut.levels[k].offset) || [0, 0], b = bb(w.poly);
      for (let x = b[0] + 0.005; x < b[1]; x += 0.01) for (let z = b[2] + 0.005; z < b[3]; z += 0.01) {
        if (!pip(x, z, w.poly)) continue; const X = x + off[0], Z = z + off[1];
        if (!cache.some(c => X >= c.b[0] && X <= c.b[1] && Z >= c.b[2] && Z <= c.b[3] && pip(X, Z, c.q) && !dans(c.vis, X, Z))) continue;
        if (dans(autres, X, Z) || cache.some(c => dans(c.vis, X, Z))) continue;
        n++; if (ou.length < 1) ou.push([x, z]);
      }
    }
    if (n * 1e-4 > 0.01) problems.push({ type: 'mur', id: 'decoupe', texte: `${(n * 1e-4).toFixed(2)} m² de mur posés là où le plan de vente est blanc (partie d'aplat masquée par la découpe du PDF), vers (${ou[0][0].toFixed(2)} ; ${ou[0][1].toFixed(2)}).` });
  }
  // voile du plan écarté (constat du 28/09/2026, plan-du-lot : façade sud de la chambre 2 écartée comme élément isolé, un mur supposé posé
  // 12 cm en retrait faisait une marche en façade) : chaque aplat noir de 0,2 m² et plus, que la lecture n'a pas écarté, à moins de 30 cm
  // d'une pièce, est couvert à 90 % par les murs (partie visible de l'aplat seulement, découpe du PDF)
  { let lu = null; try { lu = JSON.parse(fs.readFileSync(path.join(root, dir, 'reponse-ia.json'), 'utf8')); } catch (e) {}
    if (E && lu && !MULTI && Array.isArray(E.murs_noirs)) {
      const excl = new Set(lu.murs_exclus || []), aire = q => { let a = 0; for (let i = 0; i < q.length; i++) { const p = q[i], r = q[(i + 1) % q.length]; a += p[0] * r[1] - r[0] * p[1]; } return Math.abs(a) / 2; };
      const murs = polys((brut.walls || []).filter(w => !w.virtual && Array.isArray(w.poly)).map(w => w.poly)), pieces = (brut.rooms || []).filter(r => !r.of && Array.isArray(r.poly) && r.poly.length >= 3);
      const dseg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
      const pres = (x, z) => pieces.some(r => pip(x, z, r.poly) || r.poly.some((p, i) => dseg(x, z, p, r.poly[(i + 1) % r.poly.length]) < 0.3));
      // baies (aplat recouvert de blanc au droit d'une baie) et aplats blancs posés par-dessus : pas du mur
      const baies = polys(Object.values(brut.openings || {}).filter(o => Array.isArray(o.p) && o.p.length === 2).map(o => { const [a, b2] = o.p, L = Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1, sd = o.side || 1;
        const u = [(b2[0] - a[0]) / L, (b2[1] - a[1]) / L], T = [-u[1] * sd, u[0] * sd], d = o.depth || 0.2, e = 0.02;
        return [[a[0] - u[0] * e - T[0] * e, a[1] - u[1] * e - T[1] * e], [b2[0] + u[0] * e - T[0] * e, b2[1] + u[1] * e - T[1] * e], [b2[0] + u[0] * e + T[0] * (d + e), b2[1] + u[1] * e + T[1] * (d + e)], [a[0] - u[0] * e + T[0] * (d + e), a[1] - u[1] * e + T[1] * (d + e)]]; }));
      const blancs2 = polys(E.remplissages_blancs || []);
      E.murs_noirs.forEach((q, i) => {
        if (excl.has(i) || !Array.isArray(q) || q.length < 3) return;
        const vis = (E._murs_decoupes && E._murs_decoupes[String(i)]) ? polys(E._murs_decoupes[String(i)]) : [{ q, b: bb(q) }];
        if (vis.reduce((s, v) => s + aire(v.q), 0) < 0.2) return;
        let n = 0, c = 0;
        for (const v of vis) for (let x = v.b[0] + 0.01; x < v.b[1]; x += 0.02) for (let z = v.b[2] + 0.01; z < v.b[3]; z += 0.02) { if (!pip(x, z, v.q) || !pres(x, z) || dans(baies, x, z) || dans(blancs2, x, z)) continue; n++; if (dans(murs, x, z)) c++; }
        if (n >= 50 && c / n < 0.9) problems.push({ type: 'mur', id: 'aplat-' + i, texte: `Un voile du plan de vente (${(n * 4e-4).toFixed(2)} m² près des pièces) n'est couvert qu'à ${Math.round(100 * c / n)} % par les murs de la visite (vers ${vis[0].b[0].toFixed(2)} ; ${vis[0].b[2].toFixed(2)}).` });
      });
    } }
  // équipement conforme à son dessin (constat du 28/09/2026, D201 : vasque de 0,59 m au lieu de 0,80, sèche-serviettes décalé de 21 cm) :
  // le rectangle que le plan trace pour lui (trait fin, centre à 25 cm au plus, dimensions de 0,5 à 2 fois) le recouvre à 80 % (intersection
  // sur union ; sèche-serviettes : le long de son mur)
  if (E && E._quads) {
    const rects = []; for (const q of E._quads) { if (!Array.isArray(q) || !Array.isArray(q[0]) || (q[1] || 0) > 0.5) continue; const b = bb(q[0]);
      if (!q[0].every(p => (Math.abs(p[0] - b[0]) < 2e-3 || Math.abs(p[0] - b[1]) < 2e-3) && (Math.abs(p[1] - b[2]) < 2e-3 || Math.abs(p[1] - b[3]) < 2e-3))) continue;
      if (Math.min(b[1] - b[0], b[3] - b[2]) >= 0.02 && (b[1] - b[0]) * (b[3] - b[2]) >= 0.005 && (b[1] - b[0]) * (b[3] - b[2]) <= 3) rects.push(b); }
    const NOMS = { vanity: 'La vasque', towel: 'Le sèche-serviettes', bath: 'La baignoire', shower: 'La douche' };
    for (const f of brut.fixtures || []) {
      if (!NOMS[f.type] || !Array.isArray(f.x) || !Array.isArray(f.z)) continue;
      const off = (MULTI && brut.levels[f.level || 0] && brut.levels[f.level || 0].offset) || [0, 0];
      const a = [Math.min(...f.x) + off[0], Math.max(...f.x) + off[0], Math.min(...f.z) + off[1], Math.max(...f.z) + off[1]], w = a[1] - a[0], h = a[3] - a[2];
      let best = null;
      for (const r of rects) { const rw = r[1] - r[0], rh = r[3] - r[2]; let sc;
        if (f.type === 'towel') { const lz = w < h, la = lz ? [a[2], a[3]] : [a[0], a[1]], lr = lz ? [r[2], r[3]] : [r[0], r[1]], ta = lz ? [a[0], a[1]] : [a[2], a[3]], tr = lz ? [r[0], r[1]] : [r[2], r[3]];
          if ((rh < rw) === lz || Math.min(ta[1], tr[1]) - Math.max(ta[0], tr[0]) < -0.02 || (lr[1] - lr[0]) / (la[1] - la[0]) < 0.5 || (lr[1] - lr[0]) / (la[1] - la[0]) > 2 || Math.abs((la[0] + la[1]) / 2 - (lr[0] + lr[1]) / 2) > 0.25) continue;
          sc = Math.max(0, Math.min(la[1], lr[1]) - Math.max(la[0], lr[0])) / (Math.max(la[1], lr[1]) - Math.min(la[0], lr[0])); }
        else { if (rw / w < 0.5 || rw / w > 2 || rh / h < 0.5 || rh / h > 2 || Math.hypot((a[0] + a[1] - r[0] - r[1]) / 2, (a[2] + a[3] - r[2] - r[3]) / 2) > 0.25) continue;
          const i = Math.max(0, Math.min(a[1], r[1]) - Math.max(a[0], r[0])) * Math.max(0, Math.min(a[3], r[3]) - Math.max(a[2], r[2])); sc = i / (w * h + rw * rh - i); }
        if (sc >= 0.25 && (!best || sc > best)) best = sc; }
      if (best != null && best < 0.8) problems.push({ type: 'equipement', id: f.type, texte: `${NOMS[f.type]} ne suit pas son dessin sur le plan de vente (recouvrement ${Math.round(best * 100)} %) : place ou dimensions à revoir.` });
    }
  }
  // soffite ou faux plafond hachuré que la légende nomme (constat du 28/09/2026, D201 : Entrée et salle de bains hachurées « Soffite : 2,20m
  // HSP environ », le plan 2D y écrivait « HSP 2,50 ») : une pièce couverte à 30 % au moins par les zones hachurées de 0,3 m² et plus porte
  // son plafond abaissé (soffite), que le plan 2D écrit à la place de la hauteur générale (vérifié plus bas, sur le rendu)
  if (E && [...(E.textes_hors_plan || []), ...(E.textes || [])].some(t => Array.isArray(t) && /soffite|faux[- ]?plafond/i.test(String(t[2])))) {
    const aire = q => { let a = 0; for (let i = 0; i < q.length; i++) { const p = q[i], r = q[(i + 1) % q.length]; a += p[0] * r[1] - r[0] * p[1]; } return Math.abs(a) / 2; };
    const H = (E.hachures || []).filter(h => h && Array.isArray(h.poly) && h.poly.length >= 3 && aire(h.poly) >= 0.3).map(h => ({ q: h.poly, b: bb(h.poly) }));
    for (const r of brut.rooms || []) {
      if (r.hidden || r.of || r.ext || r.floor === 'loggia' || !Array.isArray(r.poly) || r.poly.length < 3) continue;
      const off = (MULTI && brut.levels[r.level || 0] && brut.levels[r.level || 0].offset) || [0, 0], b = bb(r.poly); let n = 0, c = 0;
      for (let x = b[0] + 0.02; x < b[1]; x += 0.04) for (let z = b[2] + 0.02; z < b[3]; z += 0.04) if (pip(x, z, r.poly)) { n++; if (dans(H, x + off[0], z + off[1])) c++; }
      if (n && c / n >= 0.33 && !(r.soffite && r.soffite.part >= 0.3)) problems.push({ type: 'hauteur', id: r.id, texte: `« ${r.name || r.id} » est hachurée comme un soffite ou un faux plafond (${Math.round(100 * c / n)} %) : son plafond abaissé manque.` });
    }
  }
  // gaine technique dessinée avec le symbole de la légende (constat du 28/09/2026, D201 : gaine du coin cuisine, carré et triangle, oubliée ;
  // le séjour la recouvrait) : dans un même tracé, un rectangle de 20 cm à 1,5 m et un triangle qui partage trois de ses coins, le quatrième
  // à l'intérieur ; une gaine du plan en couvre la moitié au moins
  if (E && E._quads) {
    const par = {}; for (const q of E._quads) if (Array.isArray(q) && q.length >= 3) (par[q[2]] = par[q[2]] || []).push(q[0]);
    const gs = (brut.gaines || []).filter(g => Array.isArray(g.poly) && g.poly.length >= 3).map(g => { const off = (MULTI && brut.levels[g.level || 0] && brut.levels[g.level || 0].offset) || [0, 0]; return g.poly.map(p => [p[0] + off[0], p[1] + off[1]]); });
    for (const qs of Object.values(par)) {
      if (qs.length !== 2) continue;
      for (const R of qs) {
        const b = bb(R), [x0, x1, z0, z1] = b, T2 = qs.find(q => q !== R);
        const rect = R.every(p => (Math.abs(p[0] - x0) < 1e-3 || Math.abs(p[0] - x1) < 1e-3) && (Math.abs(p[1] - z0) < 1e-3 || Math.abs(p[1] - z1) < 1e-3));
        if (!rect || x1 - x0 < 0.2 || x1 - x0 > 1.5 || z1 - z0 < 0.2 || z1 - z0 > 1.5) continue;
        const coins = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], sur = T2.filter(p => coins.some(c => Math.hypot(p[0] - c[0], p[1] - c[1]) < 0.005)), m = 0.15 * Math.min(x1 - x0, z1 - z0);
        const dd = T2.filter(p => !coins.some(c => Math.hypot(p[0] - c[0], p[1] - c[1]) < 0.005));
        if (sur.length !== 3 || dd.length !== 1 || !(dd[0][0] > x0 + m && dd[0][0] < x1 - m && dd[0][1] > z0 + m && dd[0][1] < z1 - m)) continue;
        let n = 0, c = 0; for (let x = x0 + 0.01; x < x1; x += 0.02) for (let z = z0 + 0.01; z < z1; z += 0.02) { n++; if (gs.some(g => pip(x, z, g))) c++; }
        if (n && c / n < 0.5) problems.push({ type: 'gaine', id: 'symbole', texte: `La gaine technique dessinée sur le plan (${x0.toFixed(2)} ; ${z0.toFixed(2)} à ${x1.toFixed(2)} ; ${z1.toFixed(2)}) manque dans la visite.` });
        break;
      }
    }
  }
  if (E) {
    const T = (E.textes_hors_plan || []).filter(t => Array.isArray(t) && t.length >= 3), code = w => /^[A-Z][A-Z.]{0,4}$/.test(String(w).trim()), leg = {};
    for (const c of T) { if (!code(c[2])) continue; const d = [];
      for (const t of T.filter(t => Math.abs(t[1] - c[1]) <= 3 && t[0] - c[0] > 0 && t[0] - c[0] < 220).sort((p, q) => p[0] - q[0])) { const w = String(t[2]).trim(); if (d.length && code(w)) break; if (![':', '-', '–'].includes(w)) d.push(w); }
      const k = String(c[2]).trim().replace(/\.$/, ''); if (d.length && !(k in leg)) leg[k] = d.join(' ').toLowerCase(); }
    const sig = (E.textes || []).filter(t => Array.isArray(t) && leg[String(t[2]).trim()]);
    for (const [oid, o] of Object.entries(brut.openings || {})) {
      if (!['window', 'french'].includes(o.kind) || !Array.isArray(o.p) || o.p.length !== 2) continue;
      const k = o.level || 0, off = (MULTI && brut.levels[k] && brut.levels[k].offset) || [0, 0];
      const a = [o.p[0][0] + off[0], o.p[0][1] + off[1]], b = [o.p[1][0] + off[0], o.p[1][1] + off[1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const dist = t => { const u = Math.max(0, Math.min(1, ((t[0] - a[0]) * (b[0] - a[0]) + (t[1] - a[1]) * (b[1] - a[1])) / L / L)); return Math.hypot(t[0] - a[0] - u * (b[0] - a[0]), t[1] - a[1] - u * (b[1] - a[1])); };
      const t = sig.map(t => [t, dist(t)]).filter(x => x[1] < 0.6).sort((p, q) => p[1] - q[1])[0];
      if (!t) continue;
      const c = String(t[0][2]).trim(), d = leg[c], nomNiv = MULTI ? ` (${brut.levels[k].name || 'Niveau ' + (k + 1)})` : '';
      let faux = null;
      if (/porte[- ]?fen/.test(d) && o.kind !== 'french') faux = `porte-fenêtre (« ${c} » : ${d}) mais n'est pas construite en porte-fenêtre`;
      else if (/all[èe]ge\s+vitr/.test(d) && !(o.kind === 'window' && o.allege > 0)) faux = `« ${c} » (${d}) : elle doit avoir sa partie basse vitrée fixe, ce n'est pas une porte-fenêtre`;
      else if (/fen[êe]tre\s+sur\s+all[èe]ge/.test(d) && !(o.kind === 'window' && (o.sill || 0) >= 0.3 && !(o.allege > 0))) faux = `« ${c} » (${d}) : c'est une fenêtre sur un mur bas`;
      if (faux) { const pb = { type: 'baie', id: oid, texte: `La baie « ${oid} »${nomNiv} porte le sigle ${faux}.` }; if (MULTI) pb.level = k; problems.push(pb); }
    }
  }
  // garde-corps de trémie posé sur un tracé de cloison : le plan dessine ce bord avec les mêmes aplats (même largeur) que les
  // cloisons retenues (murs c<i> = remplissages_blancs[i]) ; c'est une cloison pleine. Un bord marqué « GC » reste un garde-corps.
  if (MULTI && E) {
    const ids = new Set((brut.walls || []).map(w => /(?:^|-)c(\d+)'*$/.exec(String(w.id))).filter(Boolean).map(m => +m[1]));
    const sign = [...ids].map(i => E.remplissages_blancs[i]).filter(q => Array.isArray(q) && q.length >= 3).map(larg);
    const trace = polys(E.remplissages_blancs).filter(p => { const l = larg(p.q); return l <= 0.08 && sign.some(s => Math.abs(s - l) <= 0.003); });
    const gc = (E.textes || []).filter(t => Array.isArray(t) && /^G\.?-?C\.?$/i.test(String(t[2]).trim()));
    for (const v of brut.voids || []) {
      const k = v.level || 0, off = (brut.levels[k] && brut.levels[k].offset) || [0, 0];
      for (const r of v.rails || []) for (let i = 0; i + 1 < (r || []).length; i++) {
        const a = r[i], b2 = r[i + 1], L = Math.hypot(b2[0] - a[0], b2[1] - a[1]); if (L < 0.2) continue;
        const u = [(b2[0] - a[0]) / L, (b2[1] - a[1]) / L], nn = [-u[1], u[0]]; let best = 0;
        for (let d = -0.04; d <= 0.0401; d += 0.01) { let n = 0, c = 0;
          for (let s = 0.01; s < L; s += 0.02) { n++; const x = a[0] + u[0] * s + nn[0] * d + off[0], z = a[1] + u[1] * s + nn[1] * d + off[1]; if (dans(trace, x, z)) c++; }
          best = Math.max(best, n ? c / n : 0); }
        const m = [(a[0] + b2[0]) / 2 + off[0], (a[1] + b2[1]) / 2 + off[1]];
        if (best >= 0.8 && !gc.some(t => Math.hypot(t[0] - m[0], t[1] - m[1]) < 0.35 + L / 2))
          problems.push({ type: 'garde-corps', id: v.id, level: k, a, b: b2, texte: `Un garde-corps de la trémie (${brut.levels[k].name || 'Niveau ' + (k + 1)}) est posé sur un tracé de cloison du plan de vente : ce bord est une cloison pleine.` });
      }
    }
  }
}
// baignoire : robinetterie du petit côté où le plan de vente dessine son repère « + » (deux traits courts croisés, relevé du PDF)
if (brut && !errors.length) {
  let E = null; try { E = JSON.parse(fs.readFileSync(path.join(root, dir, 'extract.json'), 'utf8')); } catch (e) {}
  const tr = ((E && E.traits) || []).filter(t => Array.isArray(t) && t.length === 2 && t.every(p => Array.isArray(p) && p.length === 2)).filter(t => { const l = Math.hypot(t[1][0] - t[0][0], t[1][1] - t[0][1]); return l > 0.02 && l < 0.3; });
  const cx = []; for (let i = 0; i < tr.length; i++) for (let j = i + 1; j < tr.length; j++) { const a = tr[i], b = tr[j], ma = [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2], mb = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
    const la = Math.hypot(a[1][0] - a[0][0], a[1][1] - a[0][1]), lb = Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]), dot = ((a[1][0] - a[0][0]) * (b[1][0] - b[0][0]) + (a[1][1] - a[0][1]) * (b[1][1] - b[0][1])) / la / lb;
    if (Math.hypot(ma[0] - mb[0], ma[1] - mb[1]) < 0.03 && Math.abs(dot) < 0.2) cx.push([(ma[0] + mb[0]) / 2, (ma[1] + mb[1]) / 2]); }
  for (const f of brut.fixtures || []) {
    if (f.type !== 'bath' || !Array.isArray(f.x) || !Array.isArray(f.z)) continue;
    const k = f.level || 0, off = (MULTI && brut.levels[k] && brut.levels[k].offset) || [0, 0], lx = f.x[1] - f.x[0] >= f.z[1] - f.z[0];
    for (const [px, pz] of cx) { const x = px - off[0], z = pz - off[1]; if (x < f.x[0] || x > f.x[1] || z < f.z[0] || z > f.z[1]) continue;
      const t = lx ? (x - f.x[0]) / (f.x[1] - f.x[0]) : (z - f.z[0]) / (f.z[1] - f.z[0]); if (t >= 0.25 && t <= 0.75) continue;
      const c = (lx ? 'x' : 'z') + (t < 0.25 ? '0' : '1'), tap = f.tap || (lx ? 'x0' : 'z0');
      if (c !== tap) { const pb = { type: 'equipement', id: 'bath', texte: `La robinetterie de la baignoire${MULTI ? ` (${brut.levels[k].name || 'Niveau ' + (k + 1)})` : ''} est à l'opposé du repère dessiné sur le plan.` }; if (MULTI) pb.level = k; problems.push(pb); }
      break; }
  }
}
// test d'immersion : portes et fenêtres fermées, on remplit d'eau chaque pièce du logement (grille de cubes de 2 cm posée sur
// les maillages réellement affichés : murs, sols, plafonds, dalles, menuiseries, vitrages, portes, équipements ; ni contexte ni
// volets). Si l'eau sort du contour du logement, ou passe sous la dalle basse ou au-dessus de la dalle haute, il y a un trou :
// fente dans un mur, montant ou traverse de menuiserie absent, raccord de dalle ou de plafond. Trous de 4 cm et plus toujours vus.
if (!errors.length) problems.push(...await page.evaluate(async () => {
  const D = App.D, V = __v, T = V.THREE, MULTI = !!D.multi, LV = V.levels || [{ y: 0, H: D.H }], R = 0.02;
  App.set('mode', 'walk');
  V.operables.forEach(o => { o.target = o.t = 0; o.apply(0); });
  V.scene.updateMatrixWorld(true);
  const outl = k => (MULTI ? D.levels[k].outline : D.outline) || D.outline;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  LV.forEach((l, k) => { for (const [x, z] of outl(k)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } });
  const yb = Math.min(...LV.map(l => l.y)) - 0.30, yh = Math.max(...LV.map(l => l.y + l.H)) + 0.30;
  // grille décalée d'une valeur non ronde : une face posée pile sur une frontière de cubes (murs à z = 0, x = 3,50…) passerait sinon
  // entre les deux cubes voisins par erreur d'arrondi, et l'eau traverserait un mur plein
  x0 -= 0.3037; x1 += 0.3; z0 -= 0.3029; z1 += 0.3; const y0 = yb - 0.1031, y1 = yh + 0.1;
  const nx = Math.ceil((x1 - x0) / R), ny = Math.ceil((y1 - y0) / R), nz = Math.ceil((z1 - z0) / R), N = nx * ny * nz;
  const vox = new Uint8Array(N), id = (i, j, k) => (j * nz + k) * nx + i;
  // intersection triangle / cube (axes séparateurs), cube de centre c et de demi-côté h
  const tb = (cx, cy, cz, h, A, B, C) => {
    const a0 = A[0] - cx, a1 = A[1] - cy, a2 = A[2] - cz, b0 = B[0] - cx, b1 = B[1] - cy, b2 = B[2] - cz, d0 = C[0] - cx, d1 = C[1] - cy, d2 = C[2] - cz;
    if (Math.min(a0, b0, d0) > h || Math.max(a0, b0, d0) < -h || Math.min(a1, b1, d1) > h || Math.max(a1, b1, d1) < -h || Math.min(a2, b2, d2) > h || Math.max(a2, b2, d2) < -h) return false;
    const E = [[b0 - a0, b1 - a1, b2 - a2], [d0 - b0, d1 - b1, d2 - b2], [a0 - d0, a1 - d1, a2 - d2]];
    const sep = (u0, u1, u2) => { const p = u0 * a0 + u1 * a1 + u2 * a2, q = u0 * b0 + u1 * b1 + u2 * b2, s = u0 * d0 + u1 * d1 + u2 * d2, r = h * (Math.abs(u0) + Math.abs(u1) + Math.abs(u2)); return Math.min(p, q, s) > r || Math.max(p, q, s) < -r; };
    for (const e of E) if (sep(0, -e[2], e[1]) || sep(e[2], 0, -e[0]) || sep(-e[1], e[0], 0)) return false;
    const n0 = E[0][1] * E[1][2] - E[0][2] * E[1][1], n1 = E[0][2] * E[1][0] - E[0][0] * E[1][2], n2 = E[0][0] * E[1][1] - E[0][1] * E[1][0];
    return Math.abs(n0 * a0 + n1 * a1 + n2 * a2) <= h * (Math.abs(n0) + Math.abs(n1) + Math.abs(n2));
  };
  const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const roots = [V.G.arch, V.G.ceil, V.G.doors, V.G.windows, V.G.fixed].filter(Boolean), v = new T.Vector3(), P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  let tris = 0;
  for (const g of roots) g.traverse(m => {
    if (!m.isMesh || !shown(m) || !m.geometry?.attributes?.position) return;
    const pos = m.geometry.attributes.position, ix = m.geometry.index, n = ix ? ix.count : pos.count;
    for (let t = 0; t + 2 < n; t += 3) {
      for (let q = 0; q < 3; q++) { v.fromBufferAttribute(pos, ix ? ix.getX(t + q) : t + q).applyMatrix4(m.matrixWorld); P[q][0] = v.x; P[q][1] = v.y; P[q][2] = v.z; }
      const lo = [0, 1, 2].map(a => Math.min(P[0][a], P[1][a], P[2][a])), hi = [0, 1, 2].map(a => Math.max(P[0][a], P[1][a], P[2][a]));
      const i0 = Math.max(0, Math.floor((lo[0] - x0) / R)), i1 = Math.min(nx - 1, Math.floor((hi[0] - x0) / R)), j0 = Math.max(0, Math.floor((lo[1] - y0) / R)), j1 = Math.min(ny - 1, Math.floor((hi[1] - y0) / R));
      const k0 = Math.max(0, Math.floor((lo[2] - z0) / R)), k1 = Math.min(nz - 1, Math.floor((hi[2] - z0) / R)); tris++;
      for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) {
        const c = id(i, j, k); if (vox[c]) continue;
        if (tb(x0 + (i + 0.5) * R, y0 + (j + 0.5) * R, z0 + (k + 0.5) * R, R / 2 + 0.0002, P[0], P[1], P[2])) vox[c] = 1;
      }
    }
  });
  // contour de chaque niveau à 3 cm près, sur la grille
  const pip = (x, z, q) => { let c = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) if ((q[i][1] > z) !== (q[j][1] > z) && x < (q[j][0] - q[i][0]) * (z - q[i][1]) / (q[j][1] - q[i][1]) + q[i][0]) c = !c; return c; };
  const dseg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
  const masques = LV.map((l, k) => { const q = outl(k), m = new Uint8Array(nx * nz);
    for (let kk = 0; kk < nz; kk++) for (let i = 0; i < nx; i++) { const x = x0 + (i + 0.5) * R, z = z0 + (kk + 0.5) * R; let d = Infinity; for (let s = 0; s < q.length; s++) d = Math.min(d, dseg(x, z, q[s], q[(s + 1) % q.length])); m[kk * nx + i] = pip(x, z, q) || d < 0.03 ? 1 : 0; }
    return m; });
  const dedans = (i, j, k) => { const y = y0 + (j + 0.5) * R; if (y < yb - 0.01 || y > yh + 0.01) return false;
    for (let l = 0; l < LV.length; l++) if (y >= LV[l].y - 0.31 && y <= LV[l].y + LV[l].H + 0.31 && masques[l][k * nx + i]) return true; return false; };
  // eau versée au milieu de chaque pièce intérieure, à 1,20 m du sol
  let q = new Int32Array(1 << 22), qh = 0, qt = 0; const push = c => { vox[c] = 2; q[qt] = c; qt = (qt + 1) & (q.length - 1); if (qt === qh) { const g = new Int32Array(q.length * 2); for (let s = 0; s < q.length; s++) g[s] = q[(qh + s) & (q.length - 1)]; qh = 0; qt = q.length; q = g; } };
  for (const r of D.rooms) {
    if (r.hidden || r.of || App.isExt(r)) continue;
    const k = r.level || 0, p = D.probes?.[r.id] || GEO_c(r.poly); const j = Math.floor((LV[k].y + 1.2 - y0) / R);
    let c = -1; for (let d = 0; d < 8 && c < 0; d++) for (let a = -d; a <= d && c < 0; a++) for (let b = -d; b <= d && c < 0; b++) { const i = Math.floor((p[0] - x0) / R) + a, kk = Math.floor((p[1] - z0) / R) + b; if (i >= 0 && i < nx && kk >= 0 && kk < nz && !vox[id(i, j, kk)]) c = id(i, j, kk); }
    if (c >= 0 && vox[c] === 0) push(c);
  }
  function GEO_c(poly) { let x = 0, z = 0; for (const p of poly) { x += p[0]; z += p[1]; } return [x / poly.length, z / poly.length]; }
  const sorties = [];
  while (qh !== qt && sorties.length < 400) {
    const c = q[qh]; qh = (qh + 1) & (q.length - 1);
    const i = c % nx, k = Math.floor(c / nx) % nz, j = Math.floor(c / (nx * nz));
    if (!dedans(i, j, k)) { sorties.push([x0 + (i + 0.5) * R, y0 + (j + 0.5) * R, z0 + (k + 0.5) * R]); continue; }
    if (i > 0 && !vox[c - 1]) push(c - 1); if (i < nx - 1 && !vox[c + 1]) push(c + 1);
    if (k > 0 && !vox[c - nx]) push(c - nx); if (k < nz - 1 && !vox[c + nx]) push(c + nx);
    if (j > 0 && !vox[c - nx * nz]) push(c - nx * nz); if (j < ny - 1 && !vox[c + nx * nz]) push(c + nx * nz);
  }
  const out = [], vus = [];
  for (const s of sorties) { if (vus.some(u => Math.hypot(u[0] - s[0], u[1] - s[1], u[2] - s[2]) < 0.6)) continue; vus.push(s); if (vus.length > 3) break;
    let l = 0; for (let m = 0; m < LV.length; m++) if (s[1] >= LV[m].y - 0.31) l = m;
    const pb = { type: 'etancheite', id: 'eau', p: s.map(x => +x.toFixed(2)), texte: `Test d'immersion : l'eau sort du logement${MULTI ? ` (${App.levelName(l)})` : ''} près de (${s[0].toFixed(2)} ; ${s[2].toFixed(2)}) à ${(s[1] - LV[l].y).toFixed(2)} m du sol : trou dans un mur, une menuiserie, une dalle ou un plafond.` };
    if (MULTI) pb.level = l; out.push(pb); }
  console.log(`immersion : ${tris} triangles, ${nx}×${ny}×${nz} cubes de ${R * 100} cm`);
  return out;
}));
// matières : aucune texture noire (couleur, rugosité, relief) ni couleur uniforme, à la résolution des photos comme à la moitié (appareils
// modestes : écran tactile, 4 Go de mémoire ou moins, rendu logiciel). Luminance moyenne au-dessus de 3 %, couleur d'écart type non nul
// (un relief ou une rugosité constants sont voulus : façade, feuillage)
if (!errors.length) problems.push(...await page.evaluate(async () => {
  const out = [], V = __v, stat = (d, W, H) => { let s = 0, s2 = 0, n = 0; const st = Math.max(4, ((W * H) >> 14) << 2); for (let i = 0; i < d.length; i += st) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; s += l; s2 += l * l; n++; } const m = s / n; return { m, e: Math.sqrt(Math.max(0, s2 / n - m * m)) }; };
  const juge = (nom, q, canal, d, W, H) => { const r = stat(d, W, H); if (r.m < 0.03 || (canal === 'couleur' && r.e < 1e-4)) out.push({ type: 'matiere', id: nom, texte: `La matière « ${nom} » (${canal}${q < 1 ? ', résolution réduite' : ''}) est ${r.m < 0.03 ? 'noire' : 'uniforme'} : surface sans texture dans la visite.` }); };
  const vus = new Set();
  for (const m of Object.values(V.M)) for (const [k, canal] of [['map', 'couleur'], ['roughnessMap', 'rugosité'], ['normalMap', 'relief']]) {
    const t = m[k]; if (!t || !t.image || !t.image.getContext || vus.has(t.image)) continue; vus.add(t.image);
    const c = t.image; juge(m.name || Object.keys(V.M).find(x => V.M[x] === m), 1, canal, c.getContext('2d').getImageData(0, 0, c.width, c.height).data, c.width, c.height);
  }
  try { // moitié de la résolution, générée ici comme dans la visite
    const mod = await import(new URL('../../moteur/matieres.js', location.href).href), D = App.D;
    for (const j of mod.listeMatieres((D.loggia && D.loggia.tile) || 0.5, (D.context || {}).level || 2.8)) { const r = mod.genere(j.gen, j.p, 0.5); juge(j.cle, 0.5, 'couleur', r.col, r.W, r.H); juge(j.cle, 0.5, 'rugosité', r.rou, r.W, r.H); juge(j.cle, 0.5, 'relief', r.nor, r.W, r.H); }
  } catch (e) { out.push({ type: 'matiere', id: 'moitie', texte: 'Matières à résolution réduite impossibles à générer : ' + e.message }); }
  return out;
}));
/* rendu simple (retour R4 du 29/09/2026), dans la vraie visite déjà ouverte (pv) :
   - bascule sans reste : état des lumières et des passes attendu dans chaque mode (aucune ombre, lampe, lumière de fenêtre, sonde,
     occlusion, bloom ni vignettage en simple, exposition 1 ; tout rétabli en ultra réaliste), et image simple identique (2 sur 255 au
     plus) avant et après un passage en ultra réaliste ;
   - la nuit ne change rien : même image à 21 h 30 lampes éteintes qu'à midi ;
   - aucune pièce trop sombre ni brûlée : vue de chaque arrêt, luminance moyenne et médiane entre LUM_MIN et LUM_MAX (sur 255), pixels
     brûlés (≥ 253) sur 4 % de l'image au plus, presque noirs (< 30) sur 10 % au plus (image de 480 × 300, textes de l'interface masqués ;
     un garde-corps noir de loggia fait 5 % de la vue du T2 : matière sombre voulue, pas un manque de lumière) */
const LUM_MIN = 110, LUM_MAX = 225, PART_MAX = 0.04, NOIR_MAX = 0.10;
async function lumiereSimple(pv) {
  const r = await pv.evaluate(async (LUM_MIN, LUM_MAX, PART_MAX, NOIR_MAX) => {
    const D = App.D, V = __v, R = V.renderer, gl = R.getContext(), w = R.domElement.width, h = R.domElement.height, out = [], mesures = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const img = () => { V.cul.force = null; V.renderFull(); const a = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, a); return a; };
    const ecart = (a, b) => { let m = 0; for (let i = 0; i < a.length; i++) if ((i & 3) !== 3) { const d = Math.abs(a[i] - b[i]); if (d > m) m = d; } return m; };
    const portes = s => V.operables.forEach(o => { const op = D.openings[o.id], want = (s.open || []).includes(o.id) ? 1 : (s.close || []).includes(o.id) ? 0 : (op && !op.closed && op.kind === 'door' ? 1 : 0); o.target = o.t = want; o.apply(want); });
    const vues = D.stops.map(s => ({ s, lieu: `arrêt « ${s.label || s.id} »` }));
    const pose = v => { portes(v.s); V.placeAt(v.s.p[0], v.s.p[1], v.s.level || 0, v.s.yaw, v.s.pitch ?? -0.06); };
    const attendu = { simple: { ombreSoleil: false, appoint: true, lampes: 0, lampesOmbre: 0, palier: 0, fenetres: 0, sonde: false, env: 'neutre', ao: false, bloom: false, vignettage: false, exposition: 1 },
      ultra: { ombreSoleil: true, appoint: false, lampes: V.lamps.length, sonde: true, ao: !!App.state.ao, bloom: true, vignettage: true, sondesEnAttente: 0, portePaliere: 0x4a4f53 } }; // porte palière : anthracite d'origine en ultra réaliste
    const etat = mode => { const e = App.renduEtat(), a = attendu[mode]; for (const [k, v] of Object.entries(a)) if (e[k] !== v) out.push({ type: 'lumiere', id: 'bascule', texte: `Rendu ${mode === 'simple' ? 'simple' : 'ultra réaliste'} : ${k} vaut ${e[k]} au lieu de ${v} (reste de l'autre rendu).` }); };
    App.set('rendu', 'simple'); App.set('hour', 13); App.set('lights', 'on'); await wait(300); etat('simple');
    const ref = vues.map(v => { pose(v); return img(); });
    App.set('rendu', 'ultra'); await wait(300); pose(vues[0]); img(); etat('ultra');
    App.set('rendu', 'simple'); await wait(300); etat('simple');
    let pire = { d: 0 };
    vues.forEach((v, i) => { pose(v); const d = ecart(ref[i], img()); if (d > pire.d) pire = { d, lieu: v.lieu }; });
    mesures.bascule = pire.d;
    if (pire.d > 2) out.push({ type: 'lumiere', id: 'bascule', texte: `Rendu simple : l'image change après un passage en ultra réaliste (${pire.d} sur 255, ${pire.lieu}) : un réglage de l'ultra réaliste reste appliqué.` });
    App.set('hour', 21.5); App.set('lights', 'off'); await wait(300);
    let nuit = { d: 0 };
    vues.forEach((v, i) => { pose(v); const d = ecart(ref[i], img()); if (d > nuit.d) nuit = { d, lieu: v.lieu }; });
    mesures.nuit = nuit.d;
    if (nuit.d > 2) out.push({ type: 'lumiere', id: 'nuit', texte: `Rendu simple : la nuit change l'image (${nuit.d} sur 255, ${nuit.lieu}) : la visite doit rester aussi claire de nuit.` });
    App.set('hour', 13); App.set('lights', 'on');
    mesures.pieces = {};
    vues.forEach((v, i) => {
      const a = ref[i]; let t = 0, noir = 0, brule = 0; const n = w * h, hist = new Uint32Array(256);
      for (let j = 0; j < a.length; j += 4) { const l = 0.2126 * a[j] + 0.7152 * a[j + 1] + 0.0722 * a[j + 2]; t += l; hist[Math.min(255, Math.round(l))]++; if (l < 30) noir++; if (l >= 253) brule++; }
      let med = 0; for (let k = 0, c = 0; k < 256; k++) { c += hist[k]; if (c >= n / 2) { med = k; break; } }
      const m = t / n, pn = noir / n, pb = brule / n; mesures.pieces[v.s.id] = [Math.round(m), med, +(pn * 100).toFixed(1), +(pb * 100).toFixed(1)];
      if (m < LUM_MIN || med < LUM_MIN || pn > NOIR_MAX) out.push({ type: 'lumiere', id: 'sombre', texte: `Rendu simple : ${v.lieu} trop sombre (luminance moyenne ${Math.round(m)} sur 255, ${(pn * 100).toFixed(1)} % de pixels presque noirs).` });
      if (m > LUM_MAX || med > 240 || pb > PART_MAX) out.push({ type: 'lumiere', id: 'brule', texte: `Rendu simple : ${v.lieu} brûlé (luminance moyenne ${Math.round(m)} sur 255, ${(pb * 100).toFixed(1)} % de pixels blancs).` });
    });
    return { out, mesures };
  }, LUM_MIN, LUM_MAX, PART_MAX, NOIR_MAX);
  console.error(`lumière simple : bascule ${r.mesures.bascule}, nuit ${r.mesures.nuit} (écart max sur 255) ; pièces [moyenne, médiane, % noirs, % brûlés] ${JSON.stringify(r.mesures.pieces)}`);
  problems.push(...r.out);
}
/* matières en rendu simple (vérification du 29/09/2026) : l'éclairage simple est fixe, donc chaque matière peinte (sans texture) est
   essayée à part, sur un panneau de 1,6 m posé au-dessus du toit (hors brouillard, rien autour), vu de face à 1 m dans 8 orientations (et, pour la tache, agrandi à 6,4 m et vu dans la direction du reflet de chaque
   lumière directionnelle) :
   - lisible : sa valeur dans l'orientation la moins éclairée est au moins max(60, 0,45 × base) sur 255 (base : sa couleur affichée) ; la
     porte palière anthracite (base 78) sortait à 31 sur ce panneau, 45 dans l'entrée du 3124, presque noire ;
   - sans tache : sur une matière lisse (rugosité < 0,6), vue dans l'axe du reflet d'une lumière, le centre du panneau (là où serait la
     tache) ne dépasse pas sa médiane de plus de 12 sur 255 ; le reflet direct de la lumière d'appoint faisait une tache blanche à 246 en
     haut de l'entrée du 3124.
   Les matières sombres voulues (base < 70 : garde-corps, câbles, capuchons, troncs), métalliques, transparentes ou lumineuses ne sont pas jugées */
async function matieresSimple(pv) {
  const r = await pv.evaluate(() => {
    const V = __v, THREE = V.THREE, R = V.renderer, gl = R.getContext(), cam = V.camera, out = [], mes = {};
    App.set('rendu', 'simple');
    const sv = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, fog: V.scene.fog };
    V.scene.fog = null;
    const ymax = Math.min(Math.max(new THREE.Box3().setFromObject(V.scene).max.y, 10), 200);
    const P = new THREE.Vector3(0, ymax + 30, 0), plan = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6)); V.scene.add(plan);
    const dirs = []; V.scene.traverse(o => { if (o.isDirectionalLight && o.visible && o.intensity > 0) dirs.push(o.position.clone().sub(o.target.position).normalize()); });
    const w = R.domElement.width, h = R.domElement.height, a = new Uint8Array(w * h * 4);
    const lum = () => { R.render(V.scene, cam); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, a); const L = [];
      for (let y = Math.round(h * 0.25); y < h * 0.75; y += 2) for (let x = Math.round(w * 0.3); x < w * 0.7; x += 2) { const j = (y * w + x) * 4; L.push(0.2126 * a[j] + 0.7152 * a[j + 1] + 0.0722 * a[j + 2]); }
      let cs = 0, cn = 0; for (let y = Math.round(h * 0.45); y < h * 0.55; y++) for (let x = Math.round(w * 0.45); x < w * 0.55; x++) { const j = (y * w + x) * 4; cs += 0.2126 * a[j] + 0.7152 * a[j + 1] + 0.0722 * a[j + 2]; cn++; }
      L.sort((u, v) => u - v); return { med: L[L.length >> 1], centre: cs / cn }; };
    try {
      for (const [k, m] of Object.entries(V.M)) {
        if (!m || !m.isMeshStandardMaterial || m.map || m.transparent || m.metalness >= 0.5 || (m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex())) continue;
        const c = m.color.clone().convertLinearToSRGB(), base = 255 * (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
        if (base < 70) continue;
        plan.material = m; let pire = 1e9, tache = 0, ori = 0;
        for (let i = 0; i < 8; i++) {
          const ang = i * Math.PI / 4, n = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
          plan.position.copy(P); plan.lookAt(P.clone().add(n)); plan.updateMatrixWorld();
          cam.fov = 55; cam.updateProjectionMatrix(); cam.position.copy(P).addScaledVector(n, 1.0); cam.lookAt(P); cam.updateMatrixWorld();
          const l = lum(); if (l.med < pire) { pire = l.med; ori = i * 45; }
          // tache : caméra dans la direction du reflet de chaque lumière directionnelle allumée, grand panneau (6 m, vu en biais)
          if (m.roughness < 0.6) for (const L of dirs) { const nl = n.dot(L); if (nl < 0.1) continue;
            const rv = n.clone().multiplyScalar(2 * nl).sub(L).normalize(); plan.scale.setScalar(4);
            cam.position.copy(P).addScaledVector(rv, 1.0); cam.lookAt(P); cam.updateMatrixWorld();
            const t = lum(); tache = Math.max(tache, t.centre - t.med); plan.scale.setScalar(1); }
        }
        mes[k] = [Math.round(base), Math.round(pire), Math.round(tache)];
        if (pire < Math.max(60, 0.45 * base)) out.push({ type: 'lumiere', id: 'matiere-sombre', texte: `Rendu simple : la matière « ${k} » sort trop sombre (${Math.round(pire)} sur 255 face à ${ori}°, pour une couleur à ${Math.round(base)}) : presque noire à l'écran.` });
        if (tache > 12) out.push({ type: 'lumiere', id: 'reflet', texte: `Rendu simple : tache de reflet sur la matière lisse « ${k} » (centre ${Math.round(tache)} sur 255 au-dessus du reste d'un panneau plat) : reflet direct d'une lumière fixe.` });
      }
    } finally {
      V.scene.remove(plan); plan.geometry.dispose(); V.scene.fog = sv.fog;
      cam.position.copy(sv.p); cam.quaternion.copy(sv.q); cam.fov = sv.fov; cam.updateProjectionMatrix(); V.invalidate(3);
    }
    return { out, mes };
  });
  console.error(`matières en rendu simple [base, pire orientation, tache] : ${JSON.stringify(r.mes)}`);
  problems.push(...r.out);
}
/* bouton 360° et retour (retour R4) : si le plan a son 360° (pano/visite.json), le bouton est montré, et depuis chaque arrêt il vise le
   point de vue de la même pièce (sinon le plus proche du niveau) en gardant le regard ; un clic ouvre la visionneuse avec ce regard,
   dont le bouton « Visite 3D » ramène à la visite 3D au même endroit (point de vue du 360° à 35 cm près, regard gardé). La visionneuse
   essayée est celle du moteur (moteur/pano.html et pano.js servis à la place de la copie du dossier, qui peut dater du rendu précédent ;
   pano.mjs recopie la visionneuse et refait ce contrôle sur la sienne). Sans 360°, le bouton reste caché */
async function controle360() {
  const pano = path.join(root, dir, 'pano', 'visite.json'), a360 = fs.existsSync(pano);
  const pg = await browser.newPage(); await pg.setViewport({ width: 960, height: 600 });
  const err = []; pg.on('pageerror', e => err.push(e.message));
  try {
    await pg.setRequestInterception(true);
    pg.on('request', r => { const u = new URL(r.url()), f = u.pathname.endsWith('/pano/') || u.pathname.endsWith('/pano/index.html') ? 'pano.html' : u.pathname.endsWith('/pano/visionneuse.js') ? 'pano.js' : null;
      if (f) return r.respond({ status: 200, contentType: f.endsWith('.html') ? 'text/html' : 'text/javascript', body: fs.readFileSync(path.join(root, 'moteur', f)) });
      r.continue(); });
    await pg.goto(`http://localhost:${port}/${dir}/`);
    await pg.waitForFunction(() => window.App && window.App.engine, { timeout: 180000 });
    await new Promise(r => setTimeout(r, 500));
    const vis = await pg.evaluate(() => !document.getElementById('btn360').hidden);
    if (!a360) { if (vis) problems.push({ type: '360', id: 'bouton', texte: 'Bouton 360° montré alors que ce plan n\'a pas de visite à 360°.' }); return; }
    if (!vis) { problems.push({ type: '360', id: 'bouton', texte: 'Visite à 360° présente mais bouton 360° absent de la visite.' }); return; }
    const V = JSON.parse(fs.readFileSync(pano, 'utf8'));
    const cibles = await pg.evaluate(arrets => {
      const D = App.D, piece = (x, z, lv) => { const r = App.roomAt(x, z, lv); return r ? (r.of || r.id) : null; }, out = [];
      document.getElementById('gallery').hidden = true; App.set('mode', 'walk');
      for (const s of D.stops) {
        const lv = s.level || 0; __v.placeAt(s.p[0], s.p[1], lv, s.yaw, s.pitch ?? -0.06);
        const c = App.cible360(), ici = piece(s.p[0], s.p[1], lv);
        const pos = a => a.pos || (D.stops.find(q => q.id === a.id) || {}).p, attendus = arrets.filter(a => pos(a) && (a.niveau ?? 0) === lv && piece(pos(a)[0], pos(a)[1], lv) === ici).map(a => a.id);
        out.push({ id: s.id, label: s.label || s.id, yaw: s.yaw, cible: c && c.id, url: c && c.url, attendus });
      }
      return out;
    }, V.arrets);
    for (const c of cibles) {
      if (!c.cible) { problems.push({ type: '360', id: c.id, texte: `Bouton 360° sans destination depuis l'arrêt « ${c.label} ».` }); continue; }
      if (c.attendus.length && !c.attendus.includes(c.cible)) problems.push({ type: '360', id: c.id, texte: `Bouton 360° depuis l'arrêt « ${c.label} » : ouvre le point de vue « ${c.cible} » au lieu de celui de la même pièce (${c.attendus.join(', ')}).` });
      const cap = parseFloat(new URL(c.url, 'http://x/').searchParams.get('cap'));
      if (!(Math.abs(Math.atan2(Math.sin(cap - c.yaw), Math.cos(cap - c.yaw))) < 0.01)) problems.push({ type: '360', id: c.id, texte: `Bouton 360° depuis l'arrêt « ${c.label} » : le regard n'est pas transmis à la visionneuse.` });
    }
    // aller-retour réel depuis le dernier arrêt qui a son point de vue (un clic, puis « Visite 3D »)
    const c = cibles.filter(x => x.cible && x.attendus.includes(x.cible)).pop() || cibles.find(x => x.cible); if (!c) return;
    const lacet0 = c.yaw + 0.3;
    await pg.evaluate(l => { const w = __v.walk; w.yaw = l; __v.setWalkCamera(); }, lacet0);
    await Promise.all([pg.waitForNavigation({ timeout: 60000 }), pg.click('#btn360')]);
    await pg.waitForFunction(() => window.__visionneuse && __visionneuse.pret(), { timeout: 60000 });
    const e = await pg.evaluate(() => ({ ...__visionneuse.etat(), retour: !document.getElementById('retour').hidden, url: __visionneuse.urlRetour() }));
    if (e.cur !== c.cible) problems.push({ type: '360', id: 'aller', texte: `Bouton 360° : la visionneuse s'ouvre sur « ${e.cur} » au lieu de « ${c.cible} ».` });
    if (Math.abs(Math.atan2(Math.sin(e.lacet - lacet0), Math.cos(e.lacet - lacet0))) > 0.02) problems.push({ type: '360', id: 'aller', texte: 'Bouton 360° : la visionneuse ne garde pas le regard de la visite.' });
    if (!e.retour) { problems.push({ type: '360', id: 'retour', texte: 'Visionneuse ouverte depuis la visite sans bouton de retour à la visite 3D.' }); return; }
    const a = V.arrets.find(x => x.id === e.cur), cible = a && Array.isArray(a.pos) ? a.pos : null;
    await pg.evaluate(l => __visionneuse.regarder(l, 0), lacet0 + 0.5);
    await Promise.all([pg.waitForNavigation({ timeout: 60000 }), pg.click('#retour')]);
    await pg.waitForFunction(() => window.App && window.App.engine && App.state.mode === 'walk', { timeout: 180000 });
    await new Promise(r => setTimeout(r, 1200));
    const w = await pg.evaluate(() => ({ x: __v.walk.x, z: __v.walk.z, yaw: __v.walk.yaw, lv: __v.walk.lv, galerie: !document.getElementById('gallery').hidden, url: location.search, stops: App.D.stops.map(s => ({ id: s.id, p: s.p })) }));
    const P = cible || (w.stops.find(s => s.id === e.cur) || {}).p;
    if (w.galerie) problems.push({ type: '360', id: 'retour', texte: 'Retour du 360° : la galerie photo s\'affiche au lieu de la visite 3D.' });
    if (P && Math.hypot(w.x - P[0], w.z - P[1]) > 0.35) problems.push({ type: '360', id: 'retour', texte: `Retour du 360° : la visite reprend à ${Math.hypot(w.x - P[0], w.z - P[1]).toFixed(2)} m du point de vue quitté.` });
    if (cible && Math.abs(Math.atan2(Math.sin(w.yaw - lacet0 - 0.5), Math.cos(w.yaw - lacet0 - 0.5))) > 0.02) problems.push({ type: '360', id: 'retour', texte: 'Retour du 360° : le regard de la visionneuse n\'est pas gardé.' });
    if (w.url) problems.push({ type: '360', id: 'retour', texte: 'Retour du 360° : l\'adresse de la visite garde ses paramètres (un rechargement reviendrait au point de vue).' });
    console.error(`360° : bouton vers ${cibles.map(x => x.id + '→' + x.cible).join(', ')} ; aller-retour ${c.id} : ${P ? Math.hypot(w.x - P[0], w.z - P[1]).toFixed(2) : '?'} m du point de vue${cible ? '' : ' (360° sans position : arrêt)'}`);
  } catch (e) { errors.push('Visite (bouton 360°) : ' + e.message); }
  finally { for (const m of err) errors.push('Visite (bouton 360°) : ' + m); await pg.close(); }
}
// visibilité (culling par portails de la visite), dans une vraie visite (sans ?shoot=1 : passe d'ombres de la visite, cartes d'ombre
// gelées, lampes éteintes par le culling), de jour puis de nuit, lampes allumées. Depuis chaque arrêt (8 directions, plus regard en
// bas et en haut) et le long des trajets entre arrêts (escaliers compris : sur une volée, regard en bas, en haut et en arrière), l'image
// avec culling est comparée à la même image sans culling. Une pièce, un objet ou une lumière qui manque fait une tache de pixels
// différents ; un jour autour d'un vantail fermé ne fait qu'une ligne (effacée par une érosion 3×3). Échec au-delà de 4 pixels (image
// de 480×300) après érosion. Puis : volets changés en visite (inventaire refait), et rendu photoréaliste lancé pendant un mouvement
// (la scène qui part au lanceur de rayons est entière)
if (!errors.length) {
  const pv = await browser.newPage(); await pv.setViewport({ width: 480, height: 300 });
  pv.on('pageerror', e => errors.push(e.message));
  pv.on('console', m => { const t = m.text(); if (t.startsWith('visibilité')) console.error(t); });
  try {
    await pv.goto(`http://localhost:${port}/${dir}/`);
    await pv.waitForFunction(() => window.App && (window.App.engine || document.getElementById('err')), { timeout: 180000 });
    await pv.addStyleTag({ content: '.ui, #gallery { display:none !important }' });
    const attendre = async () => { await new Promise(r => setTimeout(r, 400)); await pv.waitForFunction(() => __v.probe.queue.length === 0, { timeout: 180000, polling: 100 }); };
    // culling comparé en ultra réaliste (lampes, soleil, sondes : là où une lumière écartée à tort se verrait) ; la géométrie cachée est
    // la même dans les deux rendus. Le rendu simple est contrôlé plus bas (bascule, nuit, luminosité)
    await pv.evaluate(() => { App.set('mode', 'walk'); App.set('lights', 'on'); App.set('rendu', 'ultra'); }); await attendre();
    const moments = [{ id: 'jour', hour: null }, { id: 'nuit', hour: 21.5 }];
    let pire = null, nVues = 0;
    for (const m of moments) {
      if (m.hour != null) { await pv.evaluate(h => App.set('hour', h), m.hour); await attendre(); }
      const r = await pv.evaluate(async (moment) => {
        const D = App.D, V = __v, MULTI = !!D.multi, LV = V.levels || [{ y: 0, H: D.H }], R = V.renderer, gl = R.getContext();
        if (!V.cul) return { n: 0, pire: null };
        V.walk.anim = null; V.walk.userFov = false;
        const w = R.domElement.width, h = R.domElement.height, A = new Uint8Array(w * h * 4), B = new Uint8Array(w * h * 4), mk = new Uint8Array(w * h);
        const img = (cull, buf) => { V.cul.force = cull ? null : false; V.renderFull(); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf); };
        const portes = s => V.operables.forEach(o => { const op = D.openings[o.id], want = (s.open || []).includes(o.id) ? 1 : (s.close || []).includes(o.id) ? 0 : (op && !op.closed && op.kind === 'door' ? 1 : 0); o.target = o.t = want; o.apply(want); });
        let pire = null, nVues = 0;
        const vue = (x, z, lv, y, yaw, pitch, lieu) => {
          if (y == null) V.placeAt(x, z, lv, yaw, pitch); else { const W = V.walk; W.anim = null; W.x = x; W.z = z; W.y = y; W.lv = W._lv = lv; W.st = null; W.yaw = yaw; W.pitch = pitch; V.setWalkCamera(); }
          img(false, A); img(true, B); nVues++;
          let n2 = 0, mx = 0;
          for (let i = 0, j = 0; i < mk.length; i++, j += 4) { const d = Math.max(Math.abs(A[j] - B[j]), Math.abs(A[j + 1] - B[j + 1]), Math.abs(A[j + 2] - B[j + 2])); mk[i] = d > 8 ? 1 : 0; if (d > 2) n2++; if (d > mx) mx = d; }
          let n = 0, px = null;
          for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) { const i = yy * w + xx; if (mk[i] && mk[i - 1] && mk[i + 1] && mk[i - w] && mk[i + w] && mk[i - w - 1] && mk[i - w + 1] && mk[i + w - 1] && mk[i + w + 1]) { n++; if (!px) px = [xx, h - 1 - yy]; } }
          if (!pire || n > pire.n) pire = { n, n2, mx, lieu: `${lieu} (${moment})`, px, cellules: V.cul.stats && V.cul.stats.ids };
        };
        for (const s of D.stops) {
          const lv = s.level || 0; portes(s);
          for (let k = 0; k < 8; k++) vue(s.p[0], s.p[1], lv, null, s.yaw + k * Math.PI / 4, s.pitch ?? -0.06, `arrêt « ${s.label || s.id} », regard ${k * 45}°`);
          for (let k = 0; k < 4; k++) for (const p of [-0.7, 0.45]) vue(s.p[0], s.p[1], lv, null, s.yaw + k * Math.PI / 2 + Math.PI / 4, p, `arrêt « ${s.label || s.id} », regard ${k * 90 + 45}° ${p < 0 ? 'vers le bas' : 'vers le haut'}`);
        }
        // trajets entre arrêts : un point tous les 60 cm, regard dans le sens de la marche puis de côté ; portes ouvertes sur le trajet.
        // Sur une volée (sol hors des niveaux) : aussi en bas, en haut et en arrière
        const vus = new Set();
        for (const a of D.stops) for (const b of D.stops) {
          if (a === b) continue;
          const P = MULTI ? V.findPath(a.p[0], a.p[1], a.level || 0, b.p[0], b.p[1], b.level || 0) : V.findPath(a.p[0], a.p[1], b.p[0], b.p[1]); if (!P || P.length < 2) continue;
          portes(a); V.openDoorsOnPath(P); V.operables.forEach(o => { o.t = o.target; o.apply(o.t); });
          for (let i = 1; i < P.length; i++) {
            const p0 = P[i - 1], p1 = P[i], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), yaw = Math.atan2(-(p1[0] - p0[0]), -(p1[1] - p0[1]));
            for (let t = 0; t < L; t += 0.6) {
              const x = p0[0] + (p1[0] - p0[0]) * t / L, z = p0[1] + (p1[1] - p0[1]) * t / L, key = Math.round(x / 0.4) + ',' + Math.round(z / 0.4) + ',' + Math.round(yaw / 0.8);
              let lv = 0, y = null;
              if (MULTI) { const f = V.surfacesAt(x, z).sort((m, q) => Math.abs(m.y - LV[p0[2] ?? 0].y) - Math.abs(q.y - LV[p0[2] ?? 0].y))[0]; if (!f) continue; y = f.y; lv = V.levelOfY(y); }
              if (vus.has(key + ',' + lv)) continue; vus.add(key + ',' + lv);
              if (!V.standable(x, z, y ?? LV[lv].y)) continue; // le visiteur ne s'y tient pas (coin arrondi par le lissage) : l'œil y traverserait un mur
              const lieu = dy => `trajet ${a.label || a.id} → ${b.label || b.id}, (${x.toFixed(2)} ; ${z.toFixed(2)}), regard ${Math.round((yaw + dy) * 180 / Math.PI)}°`;
              for (const dy of [0, Math.PI / 2, -Math.PI / 2]) vue(x, z, lv, y, yaw + dy, -0.06, lieu(dy));
              const volee = y != null && Math.min(...LV.map(l => Math.abs(y - l.y))) > 0.05;
              if (volee) for (const [dy, p] of [[0, -0.7], [0, 0.5], [Math.PI, -0.7], [Math.PI, 0.5], [Math.PI / 2, -0.7], [-Math.PI / 2, -0.7]]) vue(x, z, lv, y, yaw + dy, p, lieu(dy) + (p < 0 ? ' vers le bas' : ' vers le haut'));
            }
          }
        }
        // volets changés en visite, culling en cours : maquette réinventoriée ; ensuite, sans culling, aucun objet ne doit rester caché
        // ni garder les ciseaux d'un inventaire périmé
        let inv = null;
        if (moment === 'jour') {
          const s = D.stops[0]; portes(s);
          const bilan = () => { V.cul.force = false; V.renderFull(); const set = new Set(V.cul.items); let perim = 0; V.scene.traverse(m => { if (m.isMesh && m.userData.cul && !set.has(m.userData.cul)) perim++; }); return { caches: V.cul.items.filter(I => !I.obj.visible).length, perim }; };
          for (const [drop, t] of [[60, 'baissés'], [0, 'relevés']]) {
            // image culling regard en arrière, volets changés, puis image regard en avant : l'inventaire se refait sur une vue qui a changé
            V.placeAt(s.p[0], s.p[1], s.level || 0, s.yaw + Math.PI, s.pitch ?? -0.06); V.cul.force = null; V.renderFull(); App.set('bsoDrop', drop);
            V.placeAt(s.p[0], s.p[1], s.level || 0, s.yaw, s.pitch ?? -0.06); V.renderFull();
            const b = bilan(); if (!inv || b.caches + b.perim > inv.caches + inv.perim) inv = b;
            for (let k = 0; k < 8; k++) vue(s.p[0], s.p[1], s.level || 0, null, s.yaw + k * Math.PI / 4, s.pitch ?? -0.06, `volets ${t}, arrêt « ${s.label || s.id} », regard ${k * 45}°`);
          }
        }
        V.cul.force = null;
        return { n: nVues, pire, inv };
      }, m.id);
      nVues += r.n; if (r.pire && (!pire || r.pire.n > pire.n)) pire = r.pire;
      if (r.inv && (r.inv.caches || r.inv.perim)) problems.push({ type: 'visibilite', id: 'inventaire', texte: `Volets changés pendant la visite : ${r.inv.caches} objets restent cachés et ${r.inv.perim} maillages gardent un cadrage périmé (culling) : pièce ou objet qui disparaît.` });
    }
    console.error(`visibilité : ${nVues} vues comparées, pire ${pire ? pire.n : 0} pixels (${pire ? pire.lieu : ''})`);
    if (pire && pire.n > 4) problems.push({ type: 'visibilite', id: 'culling', n: pire.n, texte: `Visite : avec le culling, une partie de l'image manque ou change (${pire.n} pixels, ${pire.lieu}, près du point d'écran ${pire.px}) : pièce, objet ou lumière écartés à tort.` });
    // rendu photoréaliste lancé en marchant : lanceur de rayons remplacé par un témoin qui compte les objets cachés et les lampes éteintes
    const ph = await pv.evaluate(async () => {
      const V = __v, s = App.D.stops[0]; V.placeAt(s.p[0], s.p[1], s.level || 0, s.yaw, s.pitch ?? -0.06);
      let vu = null; const nb = () => ({ caches: V.cul.items.filter(I => I.hid).length, eteintes: V.cul.lamps.filter(L => L.light.intensity !== (L.light.userData.i0 ?? L.light.intensity)).length });
      V.pt.tracer = { tiles: { set() {} }, samples: 0, setScene() { vu = nb(); }, updateCamera() {}, reset() {}, renderSample() {} }; V.pt.dirty = true;
      V.walk.keys.add('ArrowLeft'); await new Promise(r => setTimeout(r, 300));
      const p = V.startPT(); await p; V.walk.keys.delete('ArrowLeft'); V.stopPT(); V.pt.tracer = null; V.pt.dirty = true;
      return vu;
    });
    console.error(`rendu photo lancé en marchant : ${ph ? `${ph.caches} objets cachés, ${ph.eteintes} lampes éteintes` : 'lanceur de rayons indisponible'}`);
    if (ph && (ph.caches || ph.eteintes)) problems.push({ type: 'visibilite', id: 'rendu-photo', texte: `Rendu photoréaliste lancé en marchant : la scène part incomplète (${ph.caches} objets cachés, ${ph.eteintes} lampes éteintes).` });
    await lumiereSimple(pv);
    await matieresSimple(pv);
  } catch (e) { errors.push('Visite (contrôle de visibilité) : ' + e.message); }
  await pv.close();
}
if (!errors.length) await controle360();
if (MULTI && brut && !errors.length) { // escalier ou vide écarté au chargement : il manquerait dans la visite
  for (const t of avert) problems.push({ type: 'niveau', id: '', texte: `Le plan contient un élément invalide : ${t}.` });
}
for (const f of manque) problems.push({ type: 'niveau', id: f, texte: `Le moteur a été interrogé sans niveau (${f}) : la réponse peut venir du mauvais étage.` });
for (const e of errors) problems.unshift({ type: 'moteur', id: '', texte: 'Erreur du moteur : ' + e });
const out = { ok: problems.length === 0, problemes: problems };
fs.writeFileSync(path.join(root, dir, 'controle.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close(); server.close();
process.exit(out.ok ? 0 : 2);
