/* Visite de contrôle, sans IA : ouvre la visite d'un plan dans Chrome et vérifie avec le vrai moteur
   que chaque pièce est accessible depuis l'entrée, que chaque porte se franchit au clavier, que chaque baie est dégagée, que chaque vue
   est prise dans une zone libre et ne fixe pas un mur à bout portant.
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

const problems = [], errors = [];
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const page = await browser.newPage(); await page.setViewport({ width: 480, height: 300 });
page.on('pageerror', e => errors.push(e.message));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
try {
  await page.goto(`http://localhost:${port}/${dir}/?shoot=1`);
  await page.waitForFunction(() => window.App && (window.App.engine || document.getElementById('err')), { timeout: 180000 });
} catch (e) { errors.push('La visite ne se charge pas : ' + e.message); }
if (!errors.length && await page.evaluate(() => !window.App.engine)) errors.push(await page.evaluate(() => document.getElementById('err')?.textContent || 'moteur 3D non démarré'));

if (!errors.length) {
  await page.addStyleTag({ content: '.ui, #gallery { display:none !important }' });
  const res = await page.evaluate(async () => {
    const out = [], D = App.D, V = __v, G = App.geo, T = V.THREE;
    App.set('mode', 'walk');
    // toutes les portes ouvertes, comme pour quelqu'un qui visite
    V.operables.forEach(o => { const k = D.openings[o.id]?.kind; if (k === 'door' || k === 'french') { o.target = o.t = 1; o.apply(1); } });
    V.scene.updateMatrixWorld(true);
    const rooms = D.rooms.filter(r => !r.hidden);
    const start = D.stops[0]?.p || G.centroid(rooms[0].poly);
    // 1. chaque pièce accessible depuis l'entrée, par le vrai calcul d'itinéraire
    for (const r of rooms) {
      const c = G.centroid(r.poly); let tgt = null;
      // un point libre dans la pièce, au plus près du centre
      for (let rad = 0; rad <= 2.5 && !tgt; rad += 0.1) for (let a = 0; a < 16 && !tgt; a++) {
        const x = c[0] + Math.cos(a / 16 * 6.283) * rad, z = c[1] + Math.sin(a / 16 * 6.283) * rad;
        if (G.pointInPoly(x, z, r.poly)) { const [cx, cz] = V.collide(x, z, 0.2); if (Math.hypot(cx - x, cz - z) < 0.01 && G.pointInPoly(cx, cz, r.poly)) tgt = [x, z]; }
      }
      if (!tgt) { out.push({ type: 'piece', id: r.id, texte: `La pièce « ${r.name} » n'a aucun endroit où se tenir debout.` }); continue; }
      const P = V.findPath(start[0], start[1], tgt[0], tgt[1]);
      const end = P && P[P.length - 1];
      if (!P || Math.hypot(end[0] - tgt[0], end[1] - tgt[1]) > 0.25) out.push({ type: 'piece', id: r.id, texte: `La pièce « ${r.name} » n'est pas accessible depuis l'entrée.` });
    }
    // 1 bis. chaque porte et porte-fenêtre se franchit au clavier, pas à pas avec le vrai pas de marche du moteur
    // (1,35 m/s à 60 et 120 images/s, porte ouverte, dans les deux sens, 12 départs décalés d'une fraction de pas) :
    // l'itinéraire sur grille de 8 cm ne voit pas une fente entre un seuil et une pièce, le visiteur si.
    const isRoom = r => r && r.id !== 'placard' && !(r.hidden && !r.of);
    for (const [id, o] of Object.entries(D.openings)) {
      if (o.kind !== 'door' && o.kind !== 'french') continue;
      const m = (o.s[0] + o.s[1]) / 2, along = (x, z) => G.V.dot(G.V.sub([x, z], o.main.a), o.T);
      // pièce contre chaque face, à 30 cm au plus : sinon la porte donne sur un placard, une niche ou le palier
      const sideRoom = sg => { for (let k = 0.02; k <= 0.3; k += 0.02) { const r = App.roomAt(...o.pt(m, sg < 0 ? -k : o.depth + k)); if (r) return r; } return null; };
      if (!isRoom(sideRoom(-1)) || !isRoom(sideRoom(1))) continue;
      let bad = null;
      for (const dirn of [1, -1]) {
        const d0 = dirn > 0 ? -0.6 : o.depth + 0.6, goal = dirn > 0 ? o.depth + 0.3 : -0.3;
        const s = [m, m - 0.12, m + 0.12].find(ss => { const p = o.pt(ss, d0), [cx, cz] = V.collide(p[0], p[1], 0.18); return App.roomAt(...p) && Math.hypot(cx - p[0], cz - p[1]) < 0.01; });
        if (s == null) continue; // départ encombré : l'accessibilité des pièces est vérifiée plus haut
        for (const fps of [60, 120]) for (let k = 0; k < 12 && !bad; k++) {
          const step = 1.35 / fps, mx = o.T[0] * step * dirn, mz = o.T[1] * step * dirn;
          let [x, z] = o.pt(s, d0 - dirn * step * k / 12), still = 0;
          for (let f = 0; f < Math.ceil((1.3 + o.depth) / step) + 60; f++) {
            const [nx, nz, refused] = V.walkMove(x, z, mx, mz);
            if (refused) { bad = { d: along(x, z), fps }; break; }
            still = Math.hypot(nx - x, nz - z) < 1e-4 ? still + 1 : 0; x = nx; z = nz;
            if ((along(x, z) - goal) * dirn >= 0) break; // passé
            if (still > 20) { bad = { d: along(x, z), fps, bloque: true }; break; } // arrêté net dans la baie : garde-corps, mur, meuble
          }
        }
      }
      if (bad) out.push({ type: 'passage', id, texte: bad.bloque ? `La porte « ${o.label || id} » ne se franchit pas : le visiteur est arrêté à ${bad.d.toFixed(2)} m du nu du mur (obstacle dans la baie).`
        : `La porte « ${o.label || id} » ne se franchit pas au clavier : le pas est refusé à ${bad.d.toFixed(2)} m du nu du mur (${bad.fps} i/s), une fente sépare le seuil de la pièce.` });
    }
    // 1 ter. une porte-fenêtre qui s'ouvre sur un balcon ou une loggia n'a pas de garde-corps dans son tableau
    for (const [id, o] of Object.entries(D.openings)) {
      if (o.kind !== 'french' || !o.gc) continue;
      const r = App.roomAt(...o.pt((o.s[0] + o.s[1]) / 2, o.depth + 0.35));
      if (App.isExt(r)) out.push({ type: 'passage', id, texte: `La porte-fenêtre « ${o.label || id} » a un garde-corps en travers alors qu'elle donne sur « ${r.name || r.id} ».` });
    }
    // 1 quater. étanchéité : depuis chaque bord de pièce intérieure, à trois hauteurs, un rayon vers l'extérieur doit
    // rencontrer un mur, une menuiserie ou une autre pièce dans les 60 cm ; sinon on voit dehors par une fente
    {
      const rc = new T.Raycaster(), tout = [V.G.arch, V.G.fixed, V.G.doors, V.G.windows].filter(Boolean), fuites = [];
      // les baies, elles, laissent voir dehors ou la pièce voisine : on les écarte (avec 6 cm de marge le long de la baie)
      // portes et portes-fenêtres ouvertes pour le contrôle : on voit au travers, c'est normal (au centimètre près de la
      // baie : une fente entre le jambage et le cadre, elle, est signalée). Les fenêtres restent fermées : le vitrage arrête le rayon.
      const inOp = (px, pz) => Object.values(D.openings).some(o => { if (o.kind === 'window') return false;
        const p0 = o.pt(0, 0), p1 = o.pt(1, 0), ux = p1[0] - p0[0], uz = p1[1] - p0[1];
        const sv = (px - p0[0]) * ux + (pz - p0[1]) * uz, dv = (px - p0[0]) * o.T[0] + (pz - p0[1]) * o.T[1];
        return sv > o.s[0] + 0.01 && sv < o.s[1] - 0.01 && dv > -0.2 && dv < o.depth + 0.2; });
      for (const r of D.rooms) {
        if (r.hidden || r.of || App.isExt(r)) continue;
        const pl = r.poly, sgn = G.polyArea(pl) > 0 ? 1 : -1;
        for (let i = 0; i < pl.length; i++) {
          const a = pl[i], b = pl[(i + 1) % pl.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) continue;
          const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; let nrm = [u[1] * sgn, -u[0] * sgn];
          if (G.pointInPoly(a[0] + u[0] * L / 2 + nrm[0] * 0.05, a[1] + u[1] * L / 2 + nrm[1] * 0.05, pl)) nrm = [-nrm[0], -nrm[1]]; // vers l'extérieur de la pièce
          let run = null;
          for (let t = 0.04; t <= L - 0.04; t += 0.04) {
            const x = a[0] + u[0] * t - nrm[0] * 0.08, z = a[1] + u[1] * t - nrm[1] * 0.08; // 8 cm dans la pièce : hors des cadres et des plinthes
            // départ dans un mur ou une gaine posée dans la pièce : le rayon ne verrait rien, ce n'est pas une fente
            if (D.walls.some(w => !w.virtual && w.quad && G.pointInPoly(x, z, w.quad)) || (D.gaines || []).some(g => G.pointInPoly(x, z, g.poly))) { if (run) { fuites.push({ r, run, nrm }); run = null; } continue; }
            const q = [x + nrm[0] * 0.4, z + nrm[1] * 0.4], voisin = App.roomAt(q[0], q[1]);
            let fuit = false;
            if ((!voisin || voisin === r || App.isExt(voisin)) && !inOp(x + nrm[0] * 0.13, z + nrm[1] * 0.13)) for (const y of [0.33, 1.21, 2.37]) { // jamais pile sur une arête (linteau à 2,20)
              rc.set(new T.Vector3(x, y, z), new T.Vector3(nrm[0], 0, nrm[1])); rc.far = 0.65;
              if (!rc.intersectObjects(tout, true).some(h => h.object.isMesh && h.object.visible)) { fuit = true; break; }
            }
            if (fuit) { run = run || [[x, z], [x, z]]; run[1] = [x, z]; }
            else if (run) { fuites.push({ r, run, nrm }); run = null; }
          }
          if (run) fuites.push({ r, run, nrm });
        }
      }
      for (const f of fuites) out.push({ type: 'fuite', id: f.r.id, a: f.run[0], b: f.run[1], n: f.nrm, texte: `On voit dehors par une fente dans « ${f.r.name || f.r.id} » (${f.run[0].map(v => v.toFixed(2)).join(' ; ')}).` });
    }
    // 2. baies dégagées : un rayon horizontal traverse chaque ouverture
    const ray = new T.Raycaster(), meshes = [V.G.arch, V.G.fixed].filter(Boolean);
    for (const [id, o] of Object.entries(D.openings)) {
      const y = o.sill > 0 ? (o.sill + o.head) / 2 : 1.0, mid = o.pt((o.s[0] + o.s[1]) / 2, -0.25), dir = new T.Vector3(o.T[0], 0, o.T[1]);
      ray.set(new T.Vector3(mid[0], y, mid[1]), dir); ray.far = o.depth + 0.3;
      const hit = ray.intersectObjects(meshes, true).find(h => h.object.isMesh && !h.object.userData.glass && ['wall_b', 'wall_c', 'ext', 'faience'].includes(h.object.userData.key));
      if (hit) out.push({ type: 'ouverture', id, texte: `L'ouverture « ${o.label || id} » est obstruée par un mur (à ${hit.distance.toFixed(2)} m).` });
    }
    // 3. vues de la galerie et arrêts de la visite : dans une zone libre, et un vrai regard (pas un mur à bout portant)
    const sight = (x, z, yaw) => { ray.set(new T.Vector3(x, 1.5, z), new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))); ray.far = 50; const h = ray.intersectObjects(meshes, true).find(h => h.object.isMesh && !h.object.userData.glass); return h ? h.distance : 50; };
    const view = (type, id, name, x, z, yaw) => {
      const [cx, cz] = V.collide(x, z, 0.15);
      if (Math.hypot(cx - x, cz - z) > 0.02 || !App.roomAt(x, z)) return out.push({ type, id, texte: `${name} est placée dans un mur ou hors du logement.` });
      const c = sight(x, z, yaw), l = sight(x, z, yaw + 0.4), r = sight(x, z, yaw - 0.4);
      // recul exigé à la mesure de la pièce : 1,8 m dans un séjour, moins dans un WC de 1,5 m de côté
      const rm = App.roomAt(x, z), bb = rm ? G.bbox(rm.poly) : [0, 9, 0, 9], diag = Math.hypot(bb[1] - bb[0], bb[3] - bb[2]);
      const need = Math.min(1.8, 0.6 * diag), needSide = Math.min(1.5, 0.5 * diag);
      if (c < need || Math.max(l, r) < needSide) out.push({ type, id, texte: `${name} fixe un mur (${c.toFixed(2)} m devant).` });
    };
    for (const ph of D.photos || []) if (!ph.orbit) view('photo', ph.id, `La vue « ${ph.t} »`, ...ph.cam.slice(0, 3));
    for (const s of D.stops) view('arret', s.id, `L'arrêt « ${s.label} » de la visite guidée`, s.p[0], s.p[1], s.yaw);
    return out;
  });
  problems.push(...res);
}
for (const e of errors) problems.unshift({ type: 'moteur', id: '', texte: 'Erreur du moteur : ' + e });
const out = { ok: problems.length === 0, problemes: problems };
fs.writeFileSync(path.join(root, dir, 'controle.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close(); server.close();
process.exit(out.ok ? 0 : 2);
