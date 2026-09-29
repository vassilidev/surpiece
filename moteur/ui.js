/* Visite d'un logement à partir de son plan.json : interface, plan 2D et galerie (sans dépendance).
   Repère : x vers l'est, z vers le sud (bas du plan), y vers le haut, en mètres. */
const App = window.App = {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
App.coarse = matchMedia('(pointer: coarse)').matches;
let readyResolve; App.ready = new Promise(r => { readyResolve = r; });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fr = (n, d = 2) => n.toFixed(d).replace('.', ',');
const fmtHour = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
App.fmtHour = fmtHour; App.fr = fr;

/* ---------- Géométrie plane ---------- */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, k) => [a[0] * k, a[1] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1], len: a => Math.hypot(a[0], a[1]),
};
function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function polyArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function centroid(p) {
  let cx = 0, cz = 0, A = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], f = a[0] * b[1] - b[0] * a[1]; A += f; cx += (a[0] + b[0]) * f; cz += (a[1] + b[1]) * f; }
  return A ? [cx / (3 * A), cz / (3 * A)] : p[0];
}
function bbox(p) { const xs = p.map(q => q[0]), zs = p.map(q => q[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]; }
/* Sutherland–Hodgman : partie du polygone où f(p) >= 0 */
function clipHalf(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
App.geo = { V, pointInPoly, polyArea, centroid, bbox };
App.isExt = r => !!r && (!!r.ext || r.floor === 'loggia');
/* niveaux : appel sans niveau sur un plan à plusieurs niveaux → une erreur par fonction, repli sur le niveau courant */
const manque = new Set();
App.levelMissing = f => { if (!manque.has(f)) { manque.add(f); console.error('niveau manquant : ' + f); } };
App.curLevel = () => (App.viewer && App.viewer.show && Number.isInteger(App.viewer.lv) ? App.viewer.lv : App.state && Number.isInteger(App.state.level) ? App.state.level : 0);
App.levelName = k => { const l = App.D && App.D.levels && App.D.levels[k]; return (l && l.name) || `Niveau ${k + 1}`; };

/* ---------- Contrôle du plan : ce qui est hors format est complété ou écarté, jamais bloquant ---------- */
const num = v => typeof v === 'number' && Number.isFinite(v);
const pt2 = v => Array.isArray(v) && v.length >= 2 && num(v[0]) && num(v[1]);
const polyOk = p => Array.isArray(p) && p.length >= 3 && p.every(pt2);
const warn = (...a) => console.warn('plan.json :', ...a);
function keep(list, ok, what) { return (Array.isArray(list) ? list : []).filter(x => { let v = false; try { v = !!x && ok(x); } catch (e) {} if (!v) warn('écarté (hors format) :', what, x && x.id || ''); return v; }); }
/* placard : la façade (côté des portes) est au nord, au sud, à l'est ou à l'ouest du rectangle x × z.
   Repère local : l le long de la façade, d vers l'extérieur (d < 0 dans le placard) ; rot pour un groupe three.js. */
const PLACARD_OUT = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] };
function placardFrame(f) {
  const [x0, x1] = f.x, [z0, z1] = f.z, face = f.face in PLACARD_OUT ? f.face : 's';
  const F = { s: { o: [x0, z1], ux: [1, 0], rot: 0, W: x1 - x0, Dp: z1 - z0 }, n: { o: [x1, z0], ux: [-1, 0], rot: Math.PI, W: x1 - x0, Dp: z1 - z0 },
    e: { o: [x1, z1], ux: [0, -1], rot: Math.PI / 2, W: z1 - z0, Dp: x1 - x0 }, w: { o: [x0, z0], ux: [0, 1], rot: -Math.PI / 2, W: z1 - z0, Dp: x1 - x0 } }[face];
  const out = PLACARD_OUT[face];
  return Object.assign(F, { face, out, at: (l, d) => [F.o[0] + F.ux[0] * l + out[0] * d, F.o[1] + F.ux[1] * l + out[1] * d] });
}
App.placardFrame = placardFrame;
/* façade d'un placard sans « face » : ancien rail mince (nord ou sud), sinon le plus long côté qui donne sur une pièce */
function placardFace(f, D) {
  if (f.face in PLACARD_OUT) return f.face;
  const [x0, x1] = f.x, [z0, z1] = f.z;
  if (pt2(f.track) && Math.abs(f.track[1] - f.track[0]) < 0.2) return Math.abs(Math.max(...f.track) - z1) <= Math.abs(Math.min(...f.track) - z0) ? 's' : 'n';
  const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, vis = D.rooms.filter(r => !r.hidden && !r.of && polyOk(r.poly) && (r.level ?? 0) === (f.level ?? 0));
  const cand = [['s', [xm, z1 + 0.15], x1 - x0], ['n', [xm, z0 - 0.15], x1 - x0], ['e', [x1 + 0.15, zm], z1 - z0], ['w', [x0 - 0.15, zm], z1 - z0]]
    .filter(([, p]) => vis.some(r => pointInPoly(p[0], p[1], r.poly))).sort((a, b) => b[2] - a[2]);
  return cand.length ? cand[0][0] : 's';
}
/* équipements : champs facultatifs complétés (évacuation, sens, façade), équipement inutilisable écarté */
function normFixtures(D) {
  const span = (a, m = 0.02) => pt2(a) && Math.abs(a[1] - a[0]) >= m ? [Math.min(a[0], a[1]), Math.max(a[0], a[1])] : null;
  const toward = (p, axis, lv = 0) => { // vers le centre de la pièce qui contient p, sur un axe
    const r = D.rooms.find(q => (q.level ?? 0) === lv && pointInPoly(p[0], p[1], q.poly)), c = r ? centroid(r.poly) : p, dx = c[0] - p[0], dz = c[1] - p[1];
    return (axis ?? (Math.abs(dx) >= Math.abs(dz) ? 'x' : 'z')) === 'x' ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dz) || 1];
  };
  const unit = d => { const l = pt2(d) ? Math.hypot(d[0], d[1]) : 0; return l > 1e-6 ? [d[0] / l, d[1] / l] : null; };
  const axisDir = d => { const u = unit(d); return u && (Math.abs(u[0]) >= Math.abs(u[1]) ? [Math.sign(u[0]), 0] : [0, Math.sign(u[1])]); };
  return keep(D.fixtures, f => {
    const x = span(f.x), z = span(f.z), mid = x && z ? [(x[0] + x[1]) / 2, (z[0] + z[1]) / 2] : null;
    if ('x' in f || 'z' in f) { if (!mid) return false; f.x = x; f.z = z; }
    switch (f.type) {
      case 'shower': if (!mid) return false; if (!pt2(f.drain)) f.drain = mid; if (f.valve && !(pt2(f.valve.wall) && unit(f.valve.dir))) delete f.valve; return true;
      case 'bath': case 'tableau': return !!mid;
      case 'wc': if (!pt2(f.p)) return false; f.dir = unit(f.dir) || toward(f.p, undefined, f.level); return true;
      case 'vanity': if (!mid) return false; f.dir = axisDir(f.dir) || toward(mid, undefined, f.level); return true;
      case 'towel': if (!mid) return false; f.dir = axisDir(f.dir) || toward(mid, x[1] - x[0] < z[1] - z[0] ? 'x' : 'z', f.level); return true;
      case 'placard': if (!mid) return false; f.face = placardFace(f, D); delete f.track; return true;
      case 'dep': if (!pt2(f.p)) return false; if (!(num(f.r) && f.r > 0)) f.r = 0.05; return true;
      default: return true; // type inconnu : ignoré par le dessin
    }
  }, 'équipement');
}
/* niveaux : levels absent = un niveau implicite ; level absent = 0 ; éléments rattachés à une pièce = niveau de la pièce */
const parts = v => Array.isArray(v) ? v.filter(p => p && polyOk(p.poly)).map(p => ({ poly: p.poly, trous: Array.isArray(p.trous) ? p.trous.filter(polyOk) : [] })) : null;
function normLevels(D) {
  const src = Array.isArray(D.levels) ? D.levels.filter(l => l && typeof l === 'object') : [];
  D.levels = src.length ? src.map((l, k) => Object.assign(l, { y: num(l.y) ? l.y : k * 2.8, H: num(l.H) && l.H > 0 ? l.H : D.H, offset: pt2(l.offset) ? l.offset : [0, 0],
    floor: parts(l.floor), ceiling: parts(l.ceiling), roof: parts(l.roof), pieds: parts(l.pieds), joints: parts(l.joints), zone: Array.isArray(l.zone) && l.zone.length === 4 && l.zone.every(num) ? l.zone : null }))
    : [{ id: 'n0', name: null, y: 0, H: D.H, entry: true, offset: [0, 0], floor: null, ceiling: null, roof: null, zone: null, implicit: true }];
  D.multi = D.levels.length > 1;
  D.entry = Math.max(0, D.levels.findIndex(l => l.entry));
  const n = D.levels.length, ok = v => Number.isInteger(v) && v >= 0 && v < n;
  D.lvOk = ok;
  return (x, def = 0, what = '') => { if (!x || typeof x !== 'object') return x; if (!ok(x.level)) { if (x.level != null) warn('niveau inconnu :', what, x.id || ''); x.level = ok(def) ? def : 0; } return x; };
}
function levelsAfter(D, setLv) {
  const roomLv = id => { const r = D.rooms.find(q => q.id === id); return r ? r.level : undefined; };
  for (const s of D.stops) setLv(s, roomLv(s.room) ?? roomLv(s.id), 'arrêt');
  for (const p of D.photos) setLv(p, p.orbit ? D.entry : roomLv(p.room) ?? roomLv(p.id), 'vue');
  for (const p of D.passages) setLv(p, roomLv(p.a) ?? roomLv(p.b), 'passage');
  if (D.multi) D.dims = D.dims.map(d => (D.lvOk(d[5]) ? d : d.slice(0, 5).concat([0]))); // cote : niveau en 6e élément
  if (D.context && D.context.palier && typeof D.context.palier === 'object') setLv(D.context.palier, D.entry, 'palier');
  D.masses = Array.isArray(D.masses) ? D.masses.filter(m => m && polyOk(m.poly)).map(m => setLv(m, 0, 'masse')) : D.masses;
  // vides et escaliers : seulement sur un plan à plusieurs niveaux
  D.voids = D.multi ? keep(D.voids, v => polyOk(v.poly), 'vide').map(v => Object.assign(setLv(v, 1, 'vide'), { rails: Array.isArray(v.rails) ? v.rails.map(r => Array.isArray(r) ? r.filter(pt2) : []).filter(r => r.length >= 2) : [] })) : [];
  const Y = k => D.levels[k].y;
  D.stairs = D.multi ? keep(D.stairs, s => D.lvOk(s.from) && D.lvOk(s.to) && Y(s.to) > Y(s.from) + 0.5 && Array.isArray(s.line) && s.line.length >= 2 && s.line.every(pt2)
    && Number.isInteger(s.n) && s.n >= 2 && num(s.width) && s.width > 0.3, 'escalier') : [];
  for (const s of D.stairs) {
    let L = 0; for (let i = 1; i < s.line.length; i++) L += V.len(V.sub(s.line[i], s.line[i - 1]));
    s.len = L; s.rise = (Y(s.to) - Y(s.from)) / s.n; s.going = L / (s.n - 1);
    if (!polyOk(s.poly)) { const a = s.line[0], b = s.line[s.line.length - 1], u = V.mul(V.sub(b, a), 1 / V.len(V.sub(b, a))), v = V.mul([-u[1], u[0]], s.width / 2); s.poly = [V.add(a, v), V.add(b, v), V.sub(b, v), V.sub(a, v)]; }
    if (typeof s.label !== 'string' || !s.label) s.label = 'Escalier';
  }
  // ids uniques sur tout le plan
  for (const [what, list] of [['pièce', D.rooms], ['arrêt', D.stops], ['vue', D.photos]]) { const seen = new Set(); for (const x of list) { if (seen.has(x.id)) warn('id en double :', what, x.id); seen.add(x.id); } }
}
function valide(D) {
  const setLv = normLevels(D);
  D.walls = keep(D.walls, w => w.poly ? polyOk(w.poly) : pt2(w.a) && pt2(w.b) && num(w.t) && w.t > 0 && V.len(V.sub(w.b, w.a)) > 1e-3, 'mur').map(w => setLv(w, 0, 'mur'));
  D.rooms = keep(D.rooms, r => polyOk(r.poly), 'pièce');
  for (const r of D.rooms) if (!D.lvOk(r.level) && r.of) { const p = D.rooms.find(q => q.id === r.of); if (p && D.lvOk(p.level)) r.level = p.level; }
  D.rooms.forEach(r => setLv(r, 0, 'pièce'));
  D.gaines = keep(D.gaines, g => polyOk(g.poly), 'gaine').map(g => setLv(g, 0, 'gaine'));
  if (Array.isArray(D.fixtures)) D.fixtures.forEach(f => setLv(f, 0, 'équipement'));
  const W = new Set(D.walls.filter(w => !w.poly).map(w => w.id)), KINDS = ['entry', 'door', 'window', 'french'];
  for (const [id, o] of Object.entries(D.openings && typeof D.openings === 'object' ? D.openings : (D.openings = {}))) {
    if (o && o.wall && !(W.has(o.wall) && pt2(o.s) && o.s[1] - o.s[0] > 0.05)) delete o.wall; // mur inconnu ou polygonal : on se rabat sur p
    const ok = o && KINDS.includes(o.kind) && (o.wall || Array.isArray(o.p) && pt2(o.p[0]) && pt2(o.p[1]) && V.len(V.sub(o.p[1], o.p[0])) > 0.05);
    if (!ok) { warn('écarté (hors format) :', 'ouverture', id); delete D.openings[id]; continue; }
    setLv(o, 0, 'ouverture');
    if (!(num(o.depth) && o.depth > 0)) delete o.depth;
    if (!num(o.sill)) o.sill = o.kind === 'window' ? 1 : 0;
    if (!num(o.head)) o.head = o.kind === 'entry' ? 2.15 : o.kind === 'door' ? 2.04 : 2.2;
    if (o.kind === 'door' || o.kind === 'entry') { if (o.swing !== 1 && o.swing !== -1) o.swing = 1; }
  }
  D.fixtures = normFixtures(D);
  D.faience = keep(D.faience, f => pt2(f.a) && pt2(f.b) && pt2(f.n) && pt2(f.y), 'faïence').map(f => setLv(f, 0, 'faïence'));
  D.kitchenHint = keep(D.kitchenHint, k => Array.isArray(k.r) && k.r.length === 4 && k.r.every(num), 'cuisine indicative').map(k => setLv(k, 0, 'cuisine indicative'));
  D.dims = keep(D.dims, d => Array.isArray(d) && d.length >= 4 && d.slice(0, 4).every(num), 'cote');
  D.loggias = keep([].concat(D.loggia || []), l => polyOk(l.slab), 'loggia').map(l => Object.assign(setLv(l, 0, 'loggia'), { rail: Array.isArray(l.rail) ? l.rail.filter(pt2) : [] }));
  D.loggia = D.loggias[0] || null;
  D.lamps = keep(D.lamps, l => l.wall ? pt2(l.wall) && pt2(l.n) : pt2(l.p), 'lampe').map(l => setLv(l, 0, 'lampe'));
  D.passages = keep(D.passages, p => pt2(p.p) && num(p.r), 'passage');
  D.probes = Object.fromEntries(Object.entries(D.probes || {}).filter(([, p]) => pt2(p)));
  D.stops = keep(D.stops, s => pt2(s.p) && (num(s.yaw) || !(s.yaw = 0)), 'arrêt');
  D.photos = keep(D.photos, p => p.orbit || Array.isArray(p.cam) && p.cam.slice(0, 3).every(num), 'vue');
  if ('moments' in D) { D.moments = keep(D.moments, m => typeof m.id === 'string', 'moment'); if (!D.moments.length) delete D.moments; }
  levelsAfter(D, setLv);
  const all = D.rooms.flatMap(r => r.poly).concat(D.walls.flatMap(w => w.poly || [w.a, w.b]));
  if (!polyOk(D.outline)) {
    const lo = D.levels[D.entry].outline;
    if (polyOk(lo)) D.outline = lo; else { const [x0, x1, z0, z1] = all.length ? bbox(all) : [0, 5, 0, 5]; D.outline = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
  }
  for (const l of D.levels) if (!polyOk(l.outline)) l.outline = D.outline;
  if (!(Array.isArray(D.bounds) && D.bounds.length === 4 && D.bounds.every(num))) { const [x0, x1, z0, z1] = bbox([].concat(...D.levels.map(l => l.outline), ...D.loggias.map(l => l.slab))); D.bounds = [x0 - 0.8, x1 + 0.8, z0 - 0.8, z1 + 0.8]; }
}
/* filet de sécurité (plan lu sans découpe des murs) : un mur plein qui traverse une baie est ouvert ici.
   Mur a/b parallèle : la baie s'ajoute à ses ouvertures. Autre mur : découpé en morceaux autour de la baie. */
function openCrossingWalls(D) {
  const E = 0.04, cut = new Map();
  for (const o of Object.values(D.openings)) {
    const w0 = o.main, sOf = p => V.dot(V.sub(p, w0.a), w0.u), dOf = p => V.dot(V.sub(p, w0.a), w0.T), [s0, s1] = o.s;
    const d0 = (o.kind === 'door' || o.kind === 'entry' ? -Math.min(o.depth, 0.25) : 0) - E, d1 = o.depth + E; // une porte peut être posée sur la mauvaise face du mur
    const inHole = poly => [q => sOf(q) - s0, q => s1 - sOf(q), q => dOf(q) - d0, q => d1 - dOf(q)].reduce(clipHalf, poly);
    for (const w of D.walls) {
      if (w.virtual || o.hosts.includes(w.id) || w.level !== o.level) continue; // une baie n'ouvre que les murs de son niveau
      const pieces = cut.get(w) || [{ quad: w.poly || w.quad, o: null }];
      if (!pieces.some(pc => !pc.o && Math.abs(polyArea(inHole(pc.quad))) > 0.002)) continue;
      if (!w.poly && !cut.has(w)) {
        if (Math.abs(w.u[0] * o.u[1] - w.u[1] * o.u[0]) < 0.05) { o.hosts.push(w.id); warn(`mur ${w.id} ouvert au droit de ${o.id}`); continue; }
        if (Object.values(D.openings).some(q => q.level === w.level && q.hosts.includes(w.id))) continue; // il porte déjà ses baies : on ne le transforme pas
      }
      const next = [];
      for (const pc of pieces) {
        if (pc.o) { next.push(pc); continue; }
        const L = clipHalf(pc.quad, q => s0 - sOf(q)), R = clipHalf(pc.quad, q => sOf(q) - s1), M = clipHalf(clipHalf(pc.quad, q => sOf(q) - s0), q => s1 - sOf(q));
        for (const [q, oo] of [[L], [R], [clipHalf(M, q => d0 - dOf(q))], [clipHalf(M, q => dOf(q) - d1)], [inHole(pc.quad), o]]) if (q.length >= 3 && Math.abs(polyArea(q)) > 2e-4) next.push({ quad: q, o: oo || null });
      }
      cut.set(w, next);
    }
  }
  for (const [w, pieces] of cut) { if (!w.poly) w.poly = w.quad; w.cut = pieces.map(pc => ({ s: [0, 1], o: pc.o, quad: pc.quad })); warn(`mur ${w.id} ouvert au droit de ${[...new Set(pieces.filter(pc => pc.o).map(pc => pc.o.id))].join(', ')}`); }
}

/* Mur : ligne de référence a → b (une face), épaisseur t vers side × normale gauche */
function prepare(P) {
  const D = P;
  D.H = D.H || 2.5; D.HS = D.HS || D.H;
  valide(D);
  for (const w of D.walls) {
    if (w.poly) { w.quad = w.poly; continue; }
    const d = V.sub(w.b, w.a), L = V.len(d), u = V.mul(d, 1 / L), n = [-u[1], u[0]], T = V.mul(n, w.side || 1);
    Object.assign(w, { L, u, n, T });
    w.pt = (s, dd) => V.add(V.add(w.a, V.mul(u, s)), V.mul(T, dd));
    w.quad = [w.pt(0, 0), w.pt(L, 0), w.pt(L, w.t), w.pt(0, w.t)];
  }
  // ouvertures décrites par deux points (plans lus automatiquement) : un mur fictif porte la baie
  for (const [id, o] of Object.entries(D.openings)) {
    if (o.wall || !o.p) continue;
    const w = { id: '_' + id, k: o.kind === 'door' ? 'cloison' : 'beton', a: o.p[0], b: o.p[1], t: o.depth ?? 0.2, side: o.side || 1, ext: !!o.ext, virtual: true, level: o.level };
    const d = V.sub(w.b, w.a), L = V.len(d), u = V.mul(d, 1 / L), n = [-u[1], u[0]], T = V.mul(n, w.side);
    Object.assign(w, { L, u, n, T }); w.pt = (s, dd) => V.add(V.add(w.a, V.mul(u, s)), V.mul(T, dd)); w.quad = [w.pt(0, 0), w.pt(L, 0), w.pt(L, w.t), w.pt(0, w.t)];
    D.walls.push(w); o.wall = w.id; o.s = [0, L];
  }
  const W = Object.fromEntries(D.walls.map(w => [w.id, w]));
  D.W = W;
  for (const [id, o] of Object.entries(D.openings)) {
    const w = D.walls.find(q => q.id === o.wall && q.level === o.level) || W[o.wall]; o.id = id; o.w = o.s[1] - o.s[0];
    o.p0 = w.pt(o.s[0], 0); o.p1 = w.pt(o.s[1], 0); o.u = w.u; o.T = w.T; o.t = w.t; o.depth = o.depth ?? w.t;
    o.pt = (s, dd) => w.pt(s, dd); o.main = w;
    // partie vitrée fixe [a, b] (depuis le début de la baie, contre un jambage) : vantaux sur le reste, jusqu'au milieu du montant (5 cm)
    o.ls = o.s; o.fx = null;
    if ((o.kind === 'window' || o.kind === 'french') && pt2(o.fixe)) {
      const [a, b] = o.fixe;
      if (b - a >= 0.15 && o.w - (b - a) >= 0.4 && a >= -0.02 && b <= o.w + 0.02 && (a <= 0.02 || b >= o.w - 0.02)) {
        if (a <= 0.02) { o.fx = [o.s[0], o.s[0] + b]; o.ls = [o.s[0] + b - 0.025, o.s[1]]; } else { o.fx = [o.s[0] + a, o.s[1]]; o.ls = [o.s[0], o.s[0] + a + 0.025]; }
      } else warn('partie fixe ignorée (hors format) :', 'ouverture', id);
    }
    o.hosts = D.walls.filter(q => q.level === o.level && (q.id === o.wall || (q.open || []).includes(id))).map(q => q.id);
    o.mid = V.mul(V.add(o.p0, o.p1), 0.5);
  }
  openCrossingWalls(D);
  for (const r of D.rooms) { r.c = pt2(r.label) ? r.label : centroid(r.poly); r.bb = bbox(r.poly); }
  // vues par niveau : chaque constructeur du moteur travaille sur la vue de son niveau (hauteurs locales)
  const of = (list, k) => (list || []).filter(x => x.level === k);
  D.L = D.levels.map((l, k) => ({ k, y: l.y, H: l.H, outline: l.outline, floor: l.floor, ceiling: l.ceiling, roof: l.roof, pieds: l.pieds, joints: l.joints,
    walls: of(D.walls, k), rooms: of(D.rooms, k), gaines: of(D.gaines, k), fixtures: of(D.fixtures, k), loggias: of(D.loggias, k), lamps: of(D.lamps, k), faience: of(D.faience, k),
    masses: Array.isArray(D.masses) ? of(D.masses, k) : null, openings: Object.fromEntries(Object.entries(D.openings).filter(([, o]) => o.level === k)),
    voids: of(D.voids, k), stairs: D.stairs.filter(s => s.from === k || s.to === k) }));
  return D;
}
/* segments d'un mur, découpé par les ouvertures qu'il porte (projetées sur son axe) */
App.pieces = function (w) {
  const D = App.D;
  if (w.poly) return { segs: w.cut || [{ s: [0, 1], o: null, quad: w.poly }] };
  const ops = Object.values(D.openings).filter(o => o.level === w.level && o.hosts.includes(w.id)).map(o => {
    const s0 = V.dot(V.sub(o.p0, w.a), w.u), s1 = V.dot(V.sub(o.p1, w.a), w.u);
    return { o, s: [Math.max(0, Math.min(s0, s1)), Math.min(w.L, Math.max(s0, s1))] }; // limité au mur
  }).filter(q => q.s[1] - q.s[0] > 1e-4).sort((p, q) => p.s[0] - q.s[0]);
  const segs = []; let cur = 0;
  for (const q of ops) { if (q.s[0] > cur + 1e-4) segs.push({ s: [cur, q.s[0]], o: null }); segs.push({ s: q.s, o: q.o }); cur = q.s[1]; }
  if (cur < w.L - 1e-4) segs.push({ s: [cur, w.L], o: null });
  for (const sg of segs) sg.quad = [w.pt(sg.s[0], 0), w.pt(sg.s[1], 0), w.pt(sg.s[1], w.t), w.pt(sg.s[0], w.t)];
  return { segs };
};
/* pièce contenant (x, z) au niveau lv ; plan à un niveau : lv facultatif */
App.roomAt = function (x, z, lv) {
  const D = App.D;
  if (lv == null) {
    if (!D.multi) { for (const r of D.rooms) if (pointInPoly(x, z, r.poly)) return r; return null; }
    App.levelMissing('roomAt'); lv = App.curLevel();
  }
  for (const r of D.rooms) if (r.level === lv && pointInPoly(x, z, r.poly)) return r;
  return null;
};
App.levelH = lv => App.D.levels[lv ?? 0].H;
App.inSoffite = () => false;
/* battants : charnière h, extrémité fermée c, extrémité ouverte op, longueur L */
function doorLeaves(id) {
  const o = App.D.openings[id];
  if (o.kind === 'window' || o.kind === 'french') {
    const n = o.leaves || 1, f = (o.frame ? o.frame[0] + o.frame[1] : 0) / 2, [s0, s1] = o.ls || o.s; // vantaux hors partie fixe
    if (n === 2) {
      const L = (s1 - s0 - 0.1) / 2;
      return [{ h: o.pt(s0 + 0.05, f), c: o.pt(s0 + 0.05 + L, f), op: V.add(o.pt(s0 + 0.05, f), V.mul(o.T, -L)), L },
              { h: o.pt(s1 - 0.05, f), c: o.pt(s1 - 0.05 - L, f), op: V.add(o.pt(s1 - 0.05, f), V.mul(o.T, -L)), L }];
    }
    const L = s1 - s0 - 0.1, sh = o.hinge === 's1' ? s1 - 0.05 : s0 + 0.05, st = o.hinge === 's1' ? s0 + 0.05 : s1 - 0.05;
    return [{ h: o.pt(sh, f), c: o.pt(st, f), op: V.add(o.pt(sh, f), V.mul(o.T, -L)), L }];
  }
  const jw = o.jamb ?? 0.04, face = o.swing > 0 ? o.t : 0;
  const sH = o.hinge === 's1' ? o.s[1] - jw : o.s[0] + jw, sT = o.hinge === 's1' ? o.s[0] + jw : o.s[1] - jw, L = Math.abs(sT - sH);
  const h = o.pt(sH, face);
  return [{ h, c: o.pt(sT, face), op: V.add(h, V.mul(o.T, o.swing * L)), L }];
}
App.doorLeaves = doorLeaves;
/* escalier : point de la ligne de foulée à l'abscisse t (0 = première contremarche), direction u, normale gauche v */
App.stairAt = function (s, t) {
  let acc = 0;
  for (let i = 1; i < s.line.length; i++) {
    const a = s.line[i - 1], b = s.line[i], e = V.sub(b, a), L = V.len(e); if (L < 1e-9) continue;
    if (t <= acc + L || i === s.line.length - 1) { const u = V.mul(e, 1 / L), k = t - acc; return { p: V.add(a, V.mul(u, k)), u, v: [-u[1], u[0]] }; }
    acc += L;
  }
  const a = s.line[0], b = s.line[1], u = V.mul(V.sub(b, a), 1 / (V.len(V.sub(b, a)) || 1)); return { p: a, u, v: [-u[1], u[0]] };
};
App.stairPt = (s, t, d) => { const f = App.stairAt(s, t); return V.add(f.p, V.mul(f.v, d)); };

/* ---------- Page ---------- */
function pageHTML(D) {
  const c = D.cartouche || {};
  return `<div id="app">
  <canvas id="gl" tabindex="0" aria-label="Vue 3D du logement"></canvas>
  <div id="planWrap" hidden>
    <svg id="plan" role="img" aria-label="Plan 2D coté du logement" xmlns="http://www.w3.org/2000/svg"></svg>
    <div class="plan-tools ui"><div class="zoom" role="group" aria-label="Zoom du plan">
      <button id="zIn" aria-label="Zoomer">+</button><button id="zOut" aria-label="Dézoomer">−</button><button id="zFit" aria-label="Recadrer" style="font-size:13px">⤢</button></div></div>
    <div class="legend ui" id="legend">
      <div class="lg-title">Légende</div>
      <div><svg viewBox="0 0 22 12"><rect x="1" y="1" width="20" height="10" style="fill:var(--poche)"/></svg>Voile et doublage</div>
      <div><svg viewBox="0 0 22 12"><rect x="1" y="3" width="20" height="6" style="fill:var(--plan-bg);stroke:var(--ink)"/></svg>Cloison</div>
      <div><svg viewBox="0 0 22 12"><rect x="2" y="1" width="18" height="10" style="fill:none;stroke:var(--ink)"/><path d="M5 9L5 4L17 9" style="fill:none;stroke:var(--ink)" stroke-width=".8"/></svg>Gaine technique</div>
      <div><svg viewBox="0 0 22 12"><rect x="1" y="2" width="20" height="8" style="fill:none;stroke:var(--dash)" stroke-dasharray="3 2"/></svg>Cuisine indicative</div>
      ${D.stairs.length ? '<div><svg viewBox="0 0 22 12"><path d="M2 2H20V10H2Z M6 2V10 M10 2V10 M14 2V10" style="fill:none;stroke:var(--ink)" stroke-width=".8"/><path d="M3 6H18 M15 4L18 6L15 8" style="fill:none;stroke:var(--ink)" stroke-width="1"/></svg>Escalier (flèche : montée)</div>' : ''}
      <div><svg viewBox="0 0 22 12"><circle cx="11" cy="6" r="4" style="fill:var(--accent)"/></svg>Cliquer : entrer ici</div>
    </div>
  </div>
  <div id="compass" class="ui" aria-hidden="true"><svg viewBox="-30 -30 60 60"><g id="compassRot"><path d="M0 -24L6 0L0 24L-6 0Z" style="fill:none;stroke:var(--ink)"/><path d="M0 -24L6 0L-6 0Z" style="fill:var(--ink)"/><text x="0" y="-12" text-anchor="middle" dominant-baseline="middle" style="font:700 9px var(--ui);fill:var(--panel)">N</text></g></svg></div>
  <header class="cartouche ui">
    <div class="cart-id">${esc(c.id || '')}</div>
    <div class="cart-body"><div class="cart-l1">${esc(c.l1 || '')}</div><div class="cart-l2 mono">${esc(c.l2 || '')}</div><div class="cart-l3">${esc(c.l3 || '')}</div></div>
  </header>
  ${D.multi ? `<div id="levels" class="seg ui" data-key="level" role="group" aria-label="Niveau affiché">${D.levels.map((l, k) => `<button data-v="${k}">${esc(App.levelName(k))}</button>`).join('')}</div>` : ''}
  <div class="topbar ui">
    <div class="seg modes" role="tablist" aria-label="Mode d'affichage">
      <button role="tab" data-mode="plan" aria-selected="false"><span class="lg">Plan 2D</span><span class="sm">Plan</span></button>
      <button role="tab" data-mode="orbit" aria-selected="true"><span class="lg">Maquette 3D</span><span class="sm">3D</span></button>
      <button role="tab" data-mode="walk" aria-selected="false">Visite</button>
      <button id="btn360" type="button" hidden title="Visite à 360°, depuis le point de vue le plus proche">360°</button>
    </div>
    <button id="btnSettings" class="btn" aria-expanded="false" aria-controls="settings"><span class="lg">Réglages</span><span class="sm">Régl.</span></button>
    <button id="btnPhotos" class="btn">Photos</button>
    <button id="btnFiche" class="btn">Fiche</button>
  </div>
  <aside id="settings" class="panel ui" hidden aria-label="Réglages">
    <section>
      <h3>Rendu</h3>
      <label class="tog"><input type="checkbox" id="optUltra">Ultra réaliste : soleil, ombres, lampes (plus lourd)</label>
    </section>
    <div id="ultraOpts" hidden>
    <section>
      <h3>Soleil</h3>
      <div class="row"><label for="optSeason">Date</label>
        <select id="optSeason"><option value="hiver">21 décembre</option><option value="printemps">20 mars</option><option value="ete">21 juin</option><option value="automne">22 septembre</option></select></div>
      <div class="row"><label for="optHour">Heure légale</label><output id="outHour" class="mono" for="optHour">11:00</output></div>
      <input type="range" id="optHour" min="5" max="22" step="0.25">
      <div class="sunline mono" id="sunInfo"></div>
    </section>
    ${Object.values(D.openings || {}).some(o => o && o.bso) ? `<section>
      <h3>Brise-soleil orientables</h3>
      <div class="row"><label for="optBsoDrop">Descente</label><output id="outDrop" class="mono">0 %</output></div>
      <input type="range" id="optBsoDrop" min="0" max="100" step="1">
      <div class="row"><label for="optBsoTilt">Inclinaison des lames</label><output id="outTilt" class="mono">0°</output></div>
      <input type="range" id="optBsoTilt" min="0" max="80" step="1">
    </section>` : ''}
    <section>
      <h3>Lumière</h3>
      <div class="row"><label for="optExposure">Exposition</label><output id="outExp" class="mono">1,00</output></div>
      <input type="range" id="optExposure" min="0.4" max="2.5" step="0.05">
      <p class="sub">Lampes</p>
      <div class="seg" data-key="lights"><button data-v="auto">Auto</button><button data-v="on">Allumées</button><button data-v="off">Éteintes</button></div>
      <label class="tog"><input type="checkbox" id="optAO">Occlusion ambiante (plus réaliste, plus lourd)</label>
    </section>
    <section>
      <button id="btnPhoto" class="btn primary">Rendu photoréaliste de la vue</button>
      <p class="sub">Lancer de rayons sur la vue actuelle : lumière réelle, reflets, rebonds. Reste immobile, l'image s'affine en quelques secondes. Bouger reprend la navigation.</p>
    </section>
    </div>
    <section>
      <h3>Maquette</h3>
      <label class="tog"><input type="checkbox" id="optCut">Coupe horizontale à 1,20 m</label>
      <label class="tog"><input type="checkbox" id="optUnderlay">Plan 2D : superposer le plan du promoteur</label>
      <label class="tog"><input type="checkbox" id="optDims">Plan 2D : afficher les cotes</label>
    </section>
  </aside>
  <div id="leftCol" class="ui"><div id="hud" hidden aria-live="polite"><b id="hudRoom"></b><span id="hudInfo" class="mono"></span></div><div id="railP" class="rail" role="group" aria-label="Préréglages" hidden></div></div>
  <div id="railR" class="rail ui" role="group" aria-label="Préréglages de lumière"></div>
  <div id="railM" class="ui" role="group" aria-label="Préréglages"></div>
  <nav id="tour" class="ui" aria-label="Visite guidée"><span class="tour-label">Visite guidée</span><div class="chips" id="chips"></div></nav>
  <div id="mini" class="ui" hidden title="Cliquer pour s'y rendre"><svg id="miniSvg" xmlns="http://www.w3.org/2000/svg"></svg></div>
  <div id="joy" class="ui" hidden aria-hidden="true"><div class="knob"></div></div>
  <div id="hint" class="ui"></div>
  <div id="pt" class="ui" hidden><span id="ptMsg">Rendu photo</span><button id="ptStop">Reprendre</button></div>
  <section id="gallery" aria-label="Galerie photos">
    <div class="g-wrap">
      <header class="g-head">
        <div class="g-kicker">${esc(D.kicker || '')}</div>
        <h1>${esc(D.titre || '')}</h1>
        <div class="g-facts mono">${(D.facts || []).map(f => `<span>${esc(f)}</span>`).join('')}</div>
      </header>
      <div class="g-main">
        <figure class="g-hero" id="gHeroBox"><img id="gHero" alt=""><figcaption><span><b id="gCapT"></b><br><span id="gCapS"></span></span><span class="mono" id="gCount"></span></figcaption>
          <button class="g-nav prev" id="gPrev" aria-label="Photo précédente">‹</button><button class="g-nav next" id="gNext" aria-label="Photo suivante">›</button></figure>
        <aside class="g-side">
          ${(D.moments || []).length > 1 ? `<h2>Lumière</h2>
          <div class="g-filter"><span>Moment de la journée</span><div class="seg" data-key="moment">${D.moments.map(m => `<button data-v="${esc(m.id)}">${esc(m.t)}</button>`).join('')}</div></div>` : `<h2>Le logement</h2><ul class="g-note" style="margin:0;padding-left:16px;display:grid;gap:3px">${D.levels.map((l, k) => (D.multi ? `<li class="g-lv">${esc(App.levelName(k))}</li>` : '') + (D.rooms || []).filter(r => r.area && !r.hidden && !r.of && r.level === k).map(r => `<li>${esc(r.name)} · ${esc(r.area)} m²</li>`).join('')).join('')}</ul>`}
          <button class="g-cta" id="gStart" disabled>Lancer la visite 3D<small id="gLoad">Chargement de la 3D…</small></button>
          <div class="g-links"><button class="btn" id="gOrbit">Maquette 3D</button><button class="btn" id="gPlan">Plan 2D</button></div>
          <p class="g-note">${esc(D.note || '')}</p>
        </aside>
      </div>
      <div class="g-thumbs" id="gThumbs" role="list" style="grid-template-columns:repeat(${Math.min(9, (D.photos || []).length)},minmax(0,1fr))"></div>
    </div>
  </section>
  <div id="lightbox" hidden><img id="lbImg" alt=""><button class="g-nav prev" id="lbPrev" aria-label="Photo précédente">‹</button><button class="g-nav next" id="lbNext" aria-label="Photo suivante">›</button><button id="lbClose">Fermer</button><div id="lbCap"></div></div>
  <div id="loader" class="ui"><div class="load-box"><b>${esc(c.id || D.titre || '')}</b><div class="load-bar"><i id="loadBar"></i></div><span id="loadMsg">Chargement du moteur 3D…</span></div></div>
  <dialog id="fiche" aria-labelledby="ficheTitle">
    <div class="fiche-head"><h2 id="ficheTitle">${esc(D.titre || 'Fiche du logement')}</h2><button class="btn" id="ficheClose">Fermer</button></div>
    <div class="fiche-body">${ficheHTML(D)}</div>
  </dialog>
</div>`;
}
function ficheHTML(D) {
  const F = D.fiche && typeof D.fiche === 'object' ? D.fiche : {}, flag = { ok: ['ok', 'Plan'], w: ['w', 'À vérifier'], h: ['h', 'Hypothèse'] };
  const list = v => Array.isArray(v) ? v : v == null ? [] : [v];
  // un point de la fiche : [drapeau, texte], texte seul ou objet ; drapeau inconnu → hypothèse
  const item = it => { const [k, t] = Array.isArray(it) ? (it.length > 1 ? it : ['h', it[0]]) : it && typeof it === 'object' ? [it.k ?? it.flag, it.t ?? it.texte ?? it.text] : ['h', it]; return [Object.hasOwn(flag, k) ? flag[k] : flag.h, t]; };
  let h = '';
  const rows = list(F.surfaces).map(r => Array.isArray(r) ? r : [r]);
  if (rows.length) {
    h += `<h3>Surfaces du plan de vente</h3><div class="tbl"><table><thead><tr><th>Pièce</th><th style="text-align:right">Surface</th><th style="text-align:right">Cotes du plan</th></tr></thead><tbody>`;
    const sec = r => D.multi && !r[1] && !r[2] && D.levels.some((l, k) => App.levelName(k) === r[0]); // en-tête de niveau du tableau
    h += rows.map(r => sec(r) ? `<tr class="sec"><td colspan="3">${esc(r[0])}</td></tr>` : `<tr${r[3] === 'tot' ? ' class="tot"' : ''}><td>${esc(r[0])}</td><td class="n">${esc(r[1])}</td><td class="n">${esc(r[2] || '')}</td></tr>`).join('');
    h += `</tbody></table></div>`;
  }
  for (const s of list(F.sections)) {
    if (!s || typeof s !== 'object') continue;
    h += `<h3>${esc(s.h ?? s.titre ?? '')}</h3><ul>${list(s.items).map(item).map(([f, t]) => `<li><span class="flag ${f[0]}">${f[1]}</span>${esc(t)}</li>`).join('')}</ul>`;
  }
  if (D.source) h += `<h3>Source et méthode</h3><ul><li>${esc(D.source.document)}</li><li>${esc(D.source.methode)}</li></ul>`;
  return h;
}

/* ---------- État ---------- */
const DEF = { v: 1, mode: 'orbit', season: 'automne', hour: 14.5, bsoDrop: 0, bsoTilt: 0, exposure: 1, lights: 'auto', ao: !App.coarse, cut: false, underlay: false, dims: true, moment: 'jour', furniture: false, level: 0, rendu: 'simple' };
// rendu : 'simple' (lumière fixe, par défaut) ou 'ultra' (rendu complet : soleil, ombres, sondes, lampes ; moteur/engine.js)
const ENUM = { mode: ['plan', 'orbit', 'walk'], season: ['hiver', 'printemps', 'ete', 'automne'], lights: ['auto', 'on', 'off'], rendu: ['simple', 'ultra'] };
const RANGE = { hour: [5, 22], bsoDrop: [0, 100], bsoTilt: [0, 80], exposure: [0.4, 2.5] };
const S = App.state = Object.assign({}, DEF);
App.listeners = [];
App.on = f => App.listeners.push(f);

async function boot() {
  let P;
  try { const r = await fetch('plan.json', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); P = await r.json(); }
  catch (e) { document.body.innerHTML = '<p style="padding:24px;font:15px system-ui">Plan introuvable : ce dossier doit contenir un fichier plan.json.</p>'; return; }
  let D;
  try { D = App.D = prepare(P); document.body.insertAdjacentHTML('afterbegin', pageHTML(D)); }
  catch (e) { console.error(e); document.body.innerHTML = `<p id="err" style="padding:24px;font:15px system-ui">Ce plan.json est hors format (${esc(e.message)}) : la visite ne peut pas être construite.</p>`; return; }
  document.title = `Visite 3D · ${D.titre || (D.cartouche || {}).l1 || 'logement'}`;
  armLoader();
  try { // une erreur ici s'affiche (App.fail) au lieu d'un chargement sans fin
    const KEY = `visite-${D.id}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
    ENUM.moment = (D.moments || [{ id: 'jour' }]).map(m => m.id);
    if (!ENUM.moment.includes(S.moment)) S.moment = ENUM.moment[0];
    DEF.level = S.level = D.entry; RANGE.level = [0, D.levels.length - 1]; // niveau affiché : celui de l'entrée par défaut
    for (const [k, v] of Object.entries(saved)) {
      if (!(k in DEF) || k === 'furniture') continue;
      if (ENUM[k]) { if (ENUM[k].includes(v)) S[k] = v; }
      else if (RANGE[k]) { const n = +v; if (Number.isFinite(n)) S[k] = Math.min(RANGE[k][1], Math.max(RANGE[k][0], n)); }
      else if (typeof v === typeof DEF[k]) S[k] = v;
    }
    S.level = Math.round(S.level);
    // ?rendu=simple|ultra le force ; mode photo (?shoot=1 : photos, panoramas, contrôle) : ultra réaliste par défaut
    { const q = new URLSearchParams(location.search), r = q.get('rendu'); if (ENUM.rendu.includes(r)) S.rendu = r; else if (q.has('shoot')) S.rendu = 'ultra'; }
    App.set = function (k, v) {
      if (S[k] === v) return;
      S[k] = v;
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      syncUI(); App.listeners.forEach(f => f(k, v));
    };
    if (D.simple) { const m = (D.moments || [])[0] || {}; Object.assign(S, { lights: 'on', season: m.season || 'automne', hour: m.hour ?? 13, bsoDrop: 0, bsoTilt: 0, exposure: 1 }); }
    initUI(D);
  } catch (e) { console.error(e); App.fail('Erreur de l\'interface : ' + (e && e.message || e)); return; }
  readyResolve(D);
}

/* ---------- Plan 2D en SVG (mètres) ---------- */
// textes du plan 2D écrits pour l'acquéreur (constat du 28/09/2026 : « F · OF · All. 25 », « PF + BSO », « LV », « 36/96 » recopiés du plan
// de vente) : sigles développés, étiquettes techniques remplacées par le nom de l'élément ; un sigle inconnu n'est pas montré
const SIGLES = { LV: 'lave-vaisselle', LL: 'lave-linge', SL: 'sèche-linge', LS: 'lave-linge séchant', R: 'réfrigérateur', FR: 'réfrigérateur', F: 'réfrigérateur', REF: 'réfrigérateur', C: 'cuisson', CU: 'cuisson', CUI: 'cuisson', PL: 'plaques', P: 'plaques', TRI: 'tri sélectif', FO: 'four', MO: 'micro-ondes', HOTTE: 'hotte', CE: 'chauffe-eau', BAL: 'ballon d’eau chaude', NOURRICES: 'nourrices', NOURICES: 'nourrices' };
function motPlan(t) {
  if (typeof t !== 'string' || !t.trim()) return '';
  const parts = t.split(/\s*[·+,]\s*/).map(w => w.trim()).filter(Boolean).map(w => { const k = w.replace(/\.$/, '').toUpperCase();
    if (SIGLES[k] && (/^[A-Z.]+$/.test(w) || /^nour/i.test(w))) return SIGLES[k];
    if (/^\d+\s*\/\s*\d+$/.test(w) || /^[A-Z][A-Z.]{1,5}$/.test(w) || /\b(?:All|Seuil|HSP)\b/i.test(w)) return '';
    return w; }).filter(Boolean);
  return [...new Set(parts)].join(' · ');
}
function nomBaie(op) {
  if (op.kind === 'entry') return 'entrée';
  if (op.kind === 'french') return 'porte-fenêtre';
  return op.allege > 0 ? 'fenêtre, allège vitrée' : 'fenêtre';
}
App.notePlafond = (r, lv = 0) => {
  const so = r && r.soffite, H = D0().multi ? D0().levels[lv].H : D0().H;
  if (so && so.part >= 0.3) return so.y ? `${so.part >= 0.9 ? 'plafond' : 'soffite'} ${fr(so.y)} m` : 'faux plafond';
  return D0().hspLue ? `plafond ${fr(H)} m` : '';
};
function D0() { return App.D; }
function planMarkup(P, opt) {
  const D = App.D, o = [], lv = opt.level ?? 0, on = x => !D.multi || x.level === lv; // un seul niveau dessiné à la fois
  const pts = q => q.map(p => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');
  const PG = (q, a) => `<polygon points="${pts(q)}" ${a}/>`;
  const PL = (q, a) => `<polyline points="${pts(q)}" ${a}/>`;
  const R = (q, a) => `<rect x="${q[0]}" y="${q[2]}" width="${(q[1] - q[0]).toFixed(4)}" height="${(q[3] - q[2]).toFixed(4)}" ${a}/>`;
  // textes : chacun laisse sa boîte (approchée, en mètres) pour que les noms de pièces évitent de s'y poser
  const TXT = { 'pl-room': [0.22, 0.6], 'pl-area': [0.17, 0.62], 'pl-note': [0.13, 0.62], 'pl-small': [0.125, 0.58], 'pl-dim': [0.12, 0.62] }, boxes = [];
  const tbox = (x, z, s, cls, rot = 0, anchor = 'middle', k = 1) => { const [h, cw] = TXT[cls] || [0.13, 0.6], w = String(s).length * h * cw * k, hh = h * k, v = Math.abs(rot) === 90;
    const [bw, bh] = v ? [hh, w] : [w, hh], x0 = anchor === 'start' && !v ? x : anchor === 'end' && !v ? x - bw : x - bw / 2; return [x0, x0 + bw, z - bh / 2, z + bh / 2]; };
  const T = (x, z, s, cls, rot = 0, anchor = 'middle', k = 1) => { if (s) boxes.push(tbox(x, z, s, cls, rot, anchor, k)); return `<text transform="translate(${x.toFixed(3)} ${z.toFixed(3)}) rotate(${rot}) scale(${(0.01 * k).toFixed(4)})" class="${cls}" text-anchor="${anchor}" dominant-baseline="middle">${esc(s)}</text>`; };
  const L = (x1, z1, x2, z2, a) => `<line x1="${x1.toFixed(3)}" y1="${z1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${z2.toFixed(3)}" ${a}/>`;
  const ink = 'style="fill:none;stroke:var(--ink)" stroke-width=".012"';
  const thin = 'style="fill:none;stroke:var(--ink)" stroke-width=".008"';
  const dash = 'style="fill:none;stroke:var(--dash)" stroke-width=".01" stroke-dasharray=".07 .045"';
  const lg = D.loggias.filter(on)[0];
  o.push(`<defs>
    <pattern id="${P}h" width=".1" height=".1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2=".1" style="stroke:var(--hatch)" stroke-width=".008"/></pattern>
    <pattern id="${P}g" x="${lg ? lg.slab[0][0] : 0}" y="${lg ? lg.slab[0][1] : 0}" width="${lg ? lg.tile || 0.5 : 0.5}" height="${lg ? lg.tile || 0.5 : 0.5}" patternUnits="userSpaceOnUse"><path d="M${lg ? lg.tile || 0.5 : 0.5} 0V${lg ? lg.tile || 0.5 : 0.5}H0" style="fill:none;stroke:var(--grid)" stroke-width=".008"/></pattern>
    <filter id="${P}tint" x="0" y="0" width="1" height="1"><feFlood style="flood-color:var(--accent)"/><feComposite in2="SourceAlpha" operator="in"/></filter>
  </defs>`);
  o.push(`<rect x="-60" y="-60" width="140" height="140" style="fill:var(--plan-bg)"/>`);
  // palier
  const pal = D.context && D.context.palier;
  if (pal && !opt.mini && on(pal)) { o.push(PG(pal.poly, 'style="fill:var(--panel-2)"')); const c = centroid(pal.poly); o.push(T(c[0], c[1], 'palier', 'pl-note', -90)); }
  // loggias et balcons : dalle, dallage des pièces extérieures, garde-corps
  for (const l of D.loggias.filter(on)) o.push(PG(l.slab, 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".01"'));
  for (const r of D.rooms) if (App.isExt(r) && !r.of && on(r)) o.push(PG(r.poly, `fill="url(#${P}g)"`));
  for (const l of D.loggias.filter(on)) if (l.rail.length > 1) { o.push(PL(l.rail, 'style="fill:none;stroke:var(--ink)" stroke-width=".05" stroke-linejoin="round"')); o.push(PL(l.rail, 'style="fill:none;stroke:var(--plan-bg)" stroke-width=".026" stroke-linejoin="round"')); }
  // cuisine indicative (non fournie)
  if (!opt.mini) for (const k0 of (D.kitchenHint || []).filter(on)) { const k = Object.assign({}, k0, { t: motPlan(k0.t) }); o.push(R(k.r, dash)); if (k.t) { const tp = k.tp || [(k.r[0] + k.r[1]) / 2, (k.r[2] + k.r[3]) / 2], rot = k.rot ?? ((k.r[3] - k.r[2]) > (k.r[1] - k.r[0]) * 1.5 ? -90 : 0); const long = Math.abs(rot) === 90 ? k.r[3] - k.r[2] : k.r[1] - k.r[0], fit = Math.min(1, (long - 0.08) / Math.max(0.1, k.t.length * 0.075)); o.push(`<g transform="translate(${tp[0].toFixed(3)} ${tp[1].toFixed(3)}) scale(${fit.toFixed(3)}) translate(${(-tp[0]).toFixed(3)} ${(-tp[1]).toFixed(3)})">` + T(tp[0], tp[1], k.t, 'pl-note', rot) + '</g>'); } }
  // équipements
  for (const f of (D.fixtures || []).filter(on)) try {
    o.push(`<g data-eq="${(D.fixtures || []).indexOf(f)}">`);
    if (f.type === 'shower') {
      o.push(R([f.x[0], f.x[1], f.z[0], f.z[1]], ink));
      o.push(`<rect x="${f.x[0] + 0.05}" y="${f.z[0] + 0.05}" width="${(f.x[1] - f.x[0] - 0.1).toFixed(3)}" height="${(f.z[1] - f.z[0] - 0.1).toFixed(3)}" rx=".1" ${thin}/>`);
      o.push(`<circle cx="${f.drain[0]}" cy="${f.drain[1]}" r=".03" ${thin}/>`);
      o.push(L(f.drain[0] + 0.07, f.drain[1] + 0.1, f.x[1] - 0.15, f.z[1] - 0.15, thin));
      if (!opt.mini) o.push(T((f.x[0] + f.x[1]) / 2 + 0.1, (f.z[0] + f.z[1]) / 2 - 0.12, 'douche', 'pl-note', -90));
    } else if (f.type === 'bath') {
      o.push(R([f.x[0] + 0.01, f.x[1] - 0.01, f.z[0] + 0.01, f.z[1] - 0.01], ink));
      o.push(`<rect x="${f.x[0] + 0.07}" y="${f.z[0] + 0.07}" width="${(f.x[1] - f.x[0] - 0.14).toFixed(3)}" height="${(f.z[1] - f.z[0] - 0.14).toFixed(3)}" rx=".18" ${thin}/>`);
      if (!opt.mini) o.push(T((f.x[0] + f.x[1]) / 2, (f.z[0] + f.z[1]) / 2, 'baignoire', 'pl-note', (f.z[1] - f.z[0]) > (f.x[1] - f.x[0]) ? -90 : 0));
    } else if (f.type === 'wc') {
      const [bx, bz] = f.p, d = f.dir, s = [-d[1], d[0]];
      const at = (a, b) => [bx + d[0] * a + s[0] * b, bz + d[1] * a + s[1] * b];
      o.push(PG([at(0, -0.21), at(0.18, -0.21), at(0.18, 0.21), at(0, 0.21)], ink));
      const c = at(0.43, 0), ang = Math.atan2(d[1], d[0]) * 180 / Math.PI;
      o.push(`<ellipse cx="${c[0].toFixed(3)}" cy="${c[1].toFixed(3)}" rx=".25" ry=".18" transform="rotate(${ang.toFixed(1)} ${c[0].toFixed(3)} ${c[1].toFixed(3)})" ${ink}/>`);
      o.push(`<ellipse cx="${c[0].toFixed(3)}" cy="${c[1].toFixed(3)}" rx=".15" ry=".1" transform="rotate(${ang.toFixed(1)} ${c[0].toFixed(3)} ${c[1].toFixed(3)})" ${thin}/>`);
    } else if (f.type === 'vanity') {
      o.push(R([f.x[0], f.x[1], f.z[0], f.z[1]], ink));
      o.push(`<rect x="${f.x[0] + 0.06}" y="${f.z[0] + 0.1}" width="${(f.x[1] - f.x[0] - 0.14).toFixed(3)}" height="${(f.z[1] - f.z[0] - 0.2).toFixed(3)}" rx=".05" ${thin}/>`);
    } else if (f.type === 'towel') {
      o.push(R([f.x[0], f.x[1], f.z[0] + 0.02, f.z[1]], ink));
    } else if (f.type === 'tableau') {
      // coffret dans son rectangle, éclair en dents le long de sa grande dimension, quelle que soit sa taille (constat du 28/09/2026 : points
      // fixes à 6, 16… 46 cm de x0, le symbole débordait de 20 à 25 cm d'un coffret de 25 cm, en travers du mur) ; sans le sigle « TE »
      const [x0, x1] = f.x, [z0, z1] = f.z, hz = x1 - x0 >= z1 - z0, lo = hz ? x1 - x0 : z1 - z0, co = hz ? z1 - z0 : x1 - x0;
      const m = Math.min(0.02, co * 0.12), a0 = (hz ? x0 : z0) + m + 0.02, a1 = (hz ? x1 : z1) - m - 0.02, c = (hz ? z0 + z1 : x0 + x1) / 2, amp = Math.max(0, co / 2 - m - 0.02) * 0.7;
      o.push(R([x0 + m, x1 - m, z0 + m, z1 - m], thin));
      if (a1 > a0 && amp > 0) { const n = 5, q = []; for (let i = 0; i <= n; i++) { const u = a0 + (a1 - a0) * i / n, v = c + (i === 0 || i === n ? 0 : i % 2 ? -amp : amp); q.push(hz ? [u, v] : [v, u]); } o.push(PL(q, thin)); }
    } else if (f.type === 'placard') { // deux vantaux coulissants qui se chevauchent, le long de la façade (sauf porte battante)
      const F = placardFrame(f), m = F.W / 2, a = F.at(0, -0.045), b = F.at(m + 0.04, -0.045), c = F.at(m - 0.04, -0.02), d = F.at(F.W, -0.02), t = F.at(m, -Math.min(F.Dp / 2, 0.3));
      if (!f.battante) { o.push(L(a[0], a[1], b[0], b[1], ink)); o.push(L(c[0], c[1], d[0], d[1], ink)); }
      if (!opt.mini) o.push(T(t[0], t[1], 'placard', 'pl-small', F.face === 'e' || F.face === 'w' ? -90 : 0));
    } else if (f.type === 'dep') {
      o.push(`<circle cx="${f.p[0]}" cy="${f.p[1]}" r="${f.r}" ${ink}/>`);
      if (!opt.mini) o.push(T(f.p[0] + f.r + 0.04, f.p[1], 'eaux pluviales', 'pl-note', 0, 'start'));
    }
    o.push('</g>');
  } catch (e) { o.push('</g>'); warn('équipement non dessiné', f.type, e.message); }
  // gaines
  for (const g of (D.gaines || []).filter(on)) {
    const [x0, x1, z0, z1] = bbox(g.poly);
    if (g.style === 'conduit') {
      o.push(PG(g.poly, 'style="fill:var(--plan-bg);stroke:var(--poche)" stroke-width=".05"'));
      o.push(R([x0 + 0.08, x1 - 0.08, z0 + 0.08, z1 - 0.08], thin));
      if (!opt.mini) o.push(T((x0 + x1) / 2, (z0 + z1) / 2, motPlan(g.label) || 'conduit', 'pl-note'));
    } else {
      o.push(PG(g.poly, 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".012"'));
      o.push(`<path d="M${x0 + 0.05} ${z1 - 0.05}L${x0 + 0.05} ${z0 + 0.08}L${x1 - 0.05} ${z1 - 0.05}Z" style="fill:var(--hatch)" opacity=".55"/>`);
    }
  }
  // vides et escaliers (plan à plusieurs niveaux)
  if (D.multi) {
    const arrow = (a, b, st) => { const e = V.sub(b, a), l = V.len(e) || 1, u = V.mul(e, 1 / l), n = [-u[1], u[0]]; o.push(L(a[0], a[1], b[0], b[1], st)); o.push(PG([b, V.add(V.sub(b, V.mul(u, 0.18)), V.mul(n, 0.07)), V.sub(V.sub(b, V.mul(u, 0.18)), V.mul(n, 0.07))], 'style="fill:var(--ink)"')); };
    const line = 'style="stroke:var(--ink)" stroke-width=".008"', lineD = 'style="stroke:var(--ink)" stroke-width=".008" stroke-dasharray=".05 .035"';
    for (const v of D.voids.filter(on)) o.push(PG(v.poly, 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".01"'));
    for (const s of D.stairs) {
      const w2 = s.width / 2, g = s.going, P2 = (t, d) => App.stairPt(s, t, d);
      if (s.from === lv) { // niveau bas : girons, coupe à 1 m, flèche de montée
        const ic = Math.max(1, Math.ceil(1.0 / s.rise) - 1), tc = (ic + 0.5) * g;
        o.push(PG(s.poly, thin));
        for (let i = 0; i < s.n; i++) { const a = P2(i * g, -w2), b = P2(i * g, w2); o.push(L(a[0], a[1], b[0], b[1], i <= ic ? line : lineD)); }
        const c0 = P2(tc - 0.12, -w2), c1 = P2(tc + 0.12, w2); o.push(L(c0[0], c0[1], c1[0], c1[1], 'style="stroke:var(--ink)" stroke-width=".014"'));
        const a0 = P2(0.12, 0), am = P2(tc, 0); o.push(`<circle cx="${a0[0].toFixed(3)}" cy="${a0[1].toFixed(3)}" r=".04" style="fill:var(--ink)"/>`); o.push(L(a0[0], a0[1], am[0], am[1], line));
        arrow(am, P2(s.len - 0.06, 0), lineD);
      }
      if (s.to === lv) { // niveau haut : girons vus d'en haut dans le vide, fin de la flèche
        const vs = D.voids.filter(v => v.level === lv), inV = p => vs.some(v => pointInPoly(p[0], p[1], v.poly));
        let t0 = null;
        for (let i = 0; i < s.n; i++) { const m = P2(i * g, 0); if (!inV(V.add(m, V.mul(App.stairAt(s, i * g).u, -0.02)))) continue; if (t0 == null) t0 = i * g; const a = P2(i * g, -w2), b = P2(i * g, w2); o.push(L(a[0], a[1], b[0], b[1], line)); }
        if (t0 != null) arrow(P2(t0 + 0.1, 0), P2(s.len - 0.06, 0), line);
      }
    }
    for (const v of D.voids.filter(on)) for (const r of v.rails) { o.push(PL(r, 'style="fill:none;stroke:var(--ink)" stroke-width=".05" stroke-linejoin="round"')); o.push(PL(r, 'style="fill:none;stroke:var(--plan-bg)" stroke-width=".026" stroke-linejoin="round"')); }
  }
  // murs
  for (const w of D.walls.filter(on)) {
    const pc = App.pieces(w), beton = w.k === 'beton' || w.k === 'doublage';
    for (const sg of pc.segs) {
      if (!sg.o) { o.push(PG(sg.quad, beton ? 'style="fill:var(--poche)"' : 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".012"')); continue; }
      const op = sg.o;
      if (op.kind === 'window' || op.kind === 'french') {
        if (op.wall !== w.id) continue;
        const q = [op.pt(op.s[0], 0), op.pt(op.s[1], 0), op.pt(op.s[1], op.depth), op.pt(op.s[0], op.depth)];
        o.push(PG(q, 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".01"'));
        const f = op.frame || [0, 0.06];
        o.push(PG([op.pt(op.s[0], f[0]), op.pt(op.s[1], f[0]), op.pt(op.s[1], f[1]), op.pt(op.s[0], f[1])], thin));
        if (op.fx) { const m = op.fx[0] > op.s[0] + 0.01 ? op.fx[0] : op.fx[1], a = op.pt(m, f[0]), b = op.pt(m, f[1]); o.push(L(a[0], a[1], b[0], b[1], 'style="stroke:var(--ink)" stroke-width=".02"')); }
        if (op.gc) { const a = op.pt(op.s[0] + 0.02, (op.gc[0] + op.gc[1]) / 2), b = op.pt(op.s[1] - 0.02, (op.gc[0] + op.gc[1]) / 2); o.push(L(a[0], a[1], b[0], b[1], 'style="stroke:var(--ink)" stroke-width=".02"')); }
        if (op.bso) { const a = op.pt(op.s[0], op.depth + 0.05), b = op.pt(op.s[1], op.depth + 0.05); o.push(L(a[0], a[1], b[0], b[1], 'style="stroke:var(--ink)" stroke-width=".008" stroke-dasharray=".03 .02"')); }
        if (op.vr) o.push(PG([op.pt(op.s[0] + 0.05, 0.08), op.pt(op.s[1] - 0.05, 0.08), op.pt(op.s[1] - 0.05, op.depth - 0.02), op.pt(op.s[0] + 0.05, op.depth - 0.02)], dash));
      } else if (op.kind === 'entry' && beton) {
        const j = op.jamb ?? 0.04;
        o.push(PG([op.pt(op.s[0], 0), op.pt(op.s[0] + j, 0), op.pt(op.s[0] + j, op.t), op.pt(op.s[0], op.t)], 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".008"'));
        o.push(PG([op.pt(op.s[1] - j, 0), op.pt(op.s[1], 0), op.pt(op.s[1], op.t), op.pt(op.s[1] - j, op.t)], 'style="fill:var(--plan-bg);stroke:var(--ink)" stroke-width=".008"'));
      }
    }
  }
  // battants
  for (const id of Object.keys(D.openings)) {
    if (!on(D.openings[id])) continue;
    for (const lf of doorLeaves(id)) {
      const [hx, hz] = lf.h, [cx, cz] = lf.c, [ox, oz] = lf.op;
      const a1 = Math.atan2(oz - hz, ox - hx), a2 = Math.atan2(cz - hz, cx - hx);
      let dlt = a2 - a1; while (dlt > Math.PI) dlt -= 2 * Math.PI; while (dlt < -Math.PI) dlt += 2 * Math.PI;
      o.push(L(hx, hz, ox, oz, 'style="stroke:var(--ink)" stroke-width=".018"'));
      o.push(`<path d="M${ox.toFixed(3)} ${oz.toFixed(3)}A${lf.L.toFixed(3)} ${lf.L.toFixed(3)} 0 0 ${dlt > 0 ? 1 : 0} ${cx.toFixed(3)} ${cz.toFixed(3)}" style="fill:none;stroke:var(--ink)" stroke-width=".007"/>`);
    }
  }
  // étiquettes de baies
  if (!opt.mini) for (const op of Object.values(D.openings)) {
    if (!['window', 'french', 'entry'].includes(op.kind) || !on(op)) continue;
    const p = op.pt((op.s[0] + op.s[1]) / 2, op.labelD ?? (op.kind === 'entry' ? op.t + 0.3 : op.depth + 0.22));
    let ang = Math.atan2(op.u[1], op.u[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    o.push(T(p[0], p[1], nomBaie(op), 'pl-small', ang));
  }
  // cotes
  if (opt.dims && !opt.mini) for (const [x1, z1, x2, z2, t, dl] of D.dims || []) {
    if (D.multi && (dl ?? 0) !== lv) continue;
    const tk = 0.05;
    o.push(L(x1, z1, x2, z2, 'style="stroke:var(--accent)" stroke-width=".006"'));
    for (const [x, z] of [[x1, z1], [x2, z2]]) o.push(L(x - tk, z + tk, x + tk, z - tk, 'style="stroke:var(--accent)" stroke-width=".01"'));
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, vert = Math.abs(x2 - x1) < Math.abs(z2 - z1);
    o.push(`<rect x="${(vert ? mx - 0.09 : mx - 0.23).toFixed(3)}" y="${(vert ? mz - 0.23 : mz - 0.09).toFixed(3)}" width="${vert ? 0.18 : 0.46}" height="${vert ? 0.46 : 0.18}" style="fill:var(--plan-bg)"/>`);
    o.push(T(mx, mz, t, 'pl-dim', vert ? -90 : 0));
  }
  // pièces : nom, surface et note à leur place, ou, s'ils y recouvrent un texte, un équipement ou un débattement de porte, au point
  // de la pièce le plus proche où ils ne recouvrent rien (au besoin en plus petit)
  if (!opt.mini) {
    const eqp = [], arcs = [];
    for (const f of (D.fixtures || []).filter(on)) {
      if (f.x && f.z && f.type !== 'placard') eqp.push([f.x[0], f.x[1], f.z[0], f.z[1]]);
      else if (f.type === 'wc' && f.p && f.dir) { const d = f.dir, sd = [-d[1], d[0]], q = [[0, -0.25], [0.68, -0.25], [0.68, 0.25], [0, 0.25]].map(([a, b]) => [f.p[0] + d[0] * a + sd[0] * b, f.p[1] + d[1] * a + sd[1] * b]); const b = bbox(q); eqp.push(b); }
    }
    for (const k of (D.kitchenHint || []).filter(on)) arcs.push(k.r);
    for (const id of Object.keys(D.openings)) if (on(D.openings[id])) for (const lf of doorLeaves(id)) { const q = [lf.h, lf.c, lf.op, V.add(lf.c, V.sub(lf.op, lf.h))]; arcs.push(bbox(q)); }
    const inter = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
    for (const r of D.rooms) {
      if (r.hidden || !on(r)) continue;
      const note = r.ext ? 'extérieur' : r.areaNote || App.notePlafond(r, lv), cls = r.small ? 'pl-small' : 'pl-room';
      const bloc = (x, z, k) => [tbox(x, z, r.name, cls, 0, 'middle', k), ...(r.area ? [tbox(x, z + 0.24 * k, `${r.area} m²`, 'pl-area', 0, 'middle', k)] : []), ...(note ? [tbox(x, z + (r.area ? 0.44 : 0.2) * k, note, 'pl-note', 0, 'middle', k)] : [])];
      const dur = bl => bl.reduce((c, b) => c + 10 * boxes.reduce((a, q) => a + inter(b, q), 0) + 3 * eqp.reduce((a, q) => a + inter(b, q), 0), 0);
      const cout = bl => dur(bl) + bl.reduce((c, b) => c + arcs.reduce((a, q) => a + inter(b, q), 0), 0);
      let [lx, lz] = r.c, k = 1;
      if (dur(bloc(lx, lz, 1)) > 1e-4) { // déplacé seulement s'il recouvre un texte ou un équipement
        const bb = bbox(r.poly), dedans = bl => bl.every(b => [[b[0], b[2]], [b[1], b[2]], [b[1], b[3]], [b[0], b[3]]].every(p => pointInPoly(p[0], p[1], r.poly)));
        let best = null;
        for (const kk of [1, 0.85, 0.7]) {
          for (let x = bb[0] + 0.05; x < bb[1]; x += 0.05) for (let z = bb[2] + 0.05; z < bb[3]; z += 0.05) {
            const bl = bloc(x, z, kk); if (!dedans(bl)) continue;
            const c = cout(bl), d = Math.hypot(x - r.c[0], z - r.c[1]), sc = c * 100 + d + (1 - kk) * 2;
            if (!best || sc < best.sc) best = { sc, c, x, z, k: kk };
          }
          if (best && best.c <= 1e-4) break;
        }
        if (best) ({ x: lx, z: lz, k } = best);
      }
      o.push(T(lx, lz, r.name, cls, 0, 'middle', k));
      if (r.area) o.push(T(lx, lz + 0.24 * k, `${r.area} m²`, 'pl-area', 0, 'middle', k));
      o.push(T(lx, lz + (r.area ? 0.44 : 0.2) * k, note, 'pl-note', 0, 'middle', k));
    }
  }
  if (opt.underlay && D.underlay) {
    const u = D.underlay;
    if (!D.multi) o.push(`<image href="${esc(u.file)}" x="${u.x}" y="${u.z}" width="${u.w}" height="${u.h}" filter="url(#${P}tint)" opacity=".55" preserveAspectRatio="none"/>`);
    else { // calque de la page : décalé vers le repère commun et découpé au dessin du niveau
      const l = D.levels[lv], off = l.offset || [0, 0], zn = l.zone;
      if (zn) o.push(`<clipPath id="${P}uc"><rect x="${zn[0]}" y="${zn[1]}" width="${(zn[2] - zn[0]).toFixed(4)}" height="${(zn[3] - zn[1]).toFixed(4)}"/></clipPath>`);
      o.push(`<image href="${esc(u.file)}" x="${(u.x - off[0]).toFixed(4)}" y="${(u.z - off[1]).toFixed(4)}" width="${u.w}" height="${u.h}" filter="url(#${P}tint)" opacity=".55" preserveAspectRatio="none"${zn ? ` clip-path="url(#${P}uc)"` : ''}/>`);
    }
  }
  o.push(`<g id="${P}mk" style="display:none"><path d="M0 0L-0.62 -1.07A1.24 1.24 0 0 1 0.62 -1.07Z" style="fill:var(--accent)" opacity=".22"/><circle r=".13" style="fill:var(--accent);stroke:var(--plan-bg)" stroke-width=".04"/></g>`);
  if (!opt.mini) o.push(`<g id="planTip" style="display:none"><circle r=".16" style="fill:none;stroke:var(--accent)" stroke-width=".03"/><circle r=".05" style="fill:var(--accent)"/><g transform="translate(.22 -.2) scale(.01)"><text class="pl-tip" dominant-baseline="middle">Entrer ici</text></g></g>`);
  return o.join('');
}

/* ---------- Interface ---------- */
let syncUI = () => {};
function initUI(D) {
  const planSvg = $('#plan'), miniSvg = $('#miniSvg');
  const [bx0, bx1, bz0, bz1] = D.bounds;
  let vb = null;
  const walkable = r => r && !(r.id === 'placard');
  function drawPlan() {
    planSvg.innerHTML = planMarkup('p', { dims: S.dims, underlay: S.underlay, level: S.level });
    miniSvg.innerHTML = planMarkup('m', { mini: true, level: S.level });
    miniSvg.setAttribute('viewBox', `${bx0} ${bz0} ${bx1 - bx0} ${bz1 - bz0}`);
    if (!vb) fitPlan(); else applyVB();
    updateMarker();
  }
  function fitPlan() {
    const el = planSvg.getBoundingClientRect();
    const W = el.width || innerWidth, Hh = el.height || innerHeight, narrow = W < 900;
    const padT = narrow ? 70 : 84, padB = narrow ? 130 : 96, padL = narrow ? 12 : 250, padR = narrow ? 12 : 80;
    const s = Math.min((W - padL - padR) / (bx1 - bx0), (Hh - padT - padB) / (bz1 - bz0));
    const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, offX = (padL - padR) / 2 / s, offZ = (padT - padB) / 2 / s;
    vb = { x: cx - W / 2 / s - offX, y: cz - Hh / 2 / s - offZ, w: W / s, h: Hh / s }; applyVB();
  }
  function applyVB() { planSvg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
  function svgPoint(e) { const r = planSvg.getBoundingClientRect(); return { x: vb.x + (e.clientX - r.left) / r.width * vb.w, z: vb.y + (e.clientY - r.top) / r.height * vb.h }; }
  function zoomAt(f, cx, cz) { const nw = Math.min(60, Math.max(1.2, vb.w * f)), k = nw / vb.w; vb = { x: cx - (cx - vb.x) * k, y: cz - (cz - vb.y) * k, w: vb.w * k, h: vb.h * k }; applyVB(); }
  const ptrs = new Map(); let pan = null, pinch = null;
  planSvg.addEventListener('pointerdown', e => {
    planSvg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) pan = { x: e.clientX, y: e.clientY, vb: { ...vb }, moved: 0, t: performance.now() };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), vb: { ...vb } }; pan = null; }
  });
  planSvg.addEventListener('pointermove', e => {
    const r = planSvg.getBoundingClientRect();
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cx = pinch.vb.x + (mx - r.left) / r.width * pinch.vb.w, cz = pinch.vb.y + (my - r.top) / r.height * pinch.vb.h;
      vb = { ...pinch.vb }; zoomAt(pinch.d / d, cx, cz); return;
    }
    if (pan) { const dx = e.clientX - pan.x, dy = e.clientY - pan.y; pan.moved = Math.max(pan.moved, Math.hypot(dx, dy)); if (pan.moved > 4) { vb = { ...pan.vb, x: pan.vb.x - dx / r.width * vb.w, y: pan.vb.y - dy / r.height * vb.h }; applyVB(); } }
    const tip = $('#planTip'); if (!tip) return;
    const p = svgPoint(e), room = App.roomAt(p.x, p.z, S.level);
    if (!pan && e.pointerType === 'mouse' && walkable(room) && App.engine) { tip.style.display = ''; tip.setAttribute('transform', `translate(${p.x} ${p.z})`); planSvg.style.cursor = 'pointer'; }
    else if (!pan) { tip.style.display = 'none'; planSvg.style.cursor = 'grab'; }
  });
  const endPtr = e => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (pan && e.type === 'pointerup' && pan.moved <= 4 && performance.now() - pan.t < 600) { const p = svgPoint(e), room = App.roomAt(p.x, p.z, S.level); if (walkable(room) && App.engine) App.enterWalkAt(p.x, p.z, undefined, S.level); }
    if (ptrs.size === 0) pan = null;
  };
  planSvg.addEventListener('pointerup', endPtr); planSvg.addEventListener('pointercancel', endPtr);
  planSvg.addEventListener('wheel', e => { e.preventDefault(); const p = svgPoint(e); zoomAt(Math.exp(e.deltaY * 0.0015), p.x, p.z); }, { passive: false });
  $('#zIn').onclick = () => zoomAt(0.75, vb.x + vb.w / 2, vb.y + vb.h / 2);
  $('#zOut').onclick = () => zoomAt(1.33, vb.x + vb.w / 2, vb.y + vb.h / 2);
  $('#zFit').onclick = fitPlan;
  const s0 = D.stops[0] || { p: [0, 0], yaw: 0 };
  App.viewer = { x: s0.p[0], z: s0.p[1], yaw: s0.yaw, show: false, lv: s0.level ?? D.entry };
  function updateMarker() {
    for (const id of ['pmk', 'mmk']) {
      const g = document.getElementById(id); if (!g) continue; const v = App.viewer;
      g.style.display = v.show && (!D.multi || v.lv === S.level) ? '' : 'none'; // marqueur seulement sur le niveau du visiteur
      g.setAttribute('transform', `translate(${v.x.toFixed(3)} ${v.z.toFixed(3)}) rotate(${(-v.yaw * 180 / Math.PI).toFixed(1)})`);
    }
  }
  App.updateMarker = updateMarker;
  $('#mini').addEventListener('click', e => {
    const r = miniSvg.getBoundingClientRect(), w = bx1 - bx0, h = bz1 - bz0, s = Math.min(r.width / w, r.height / h);
    const ox = (r.width - w * s) / 2, oz = (r.height - h * s) / 2, x = bx0 + (e.clientX - r.left - ox) / s, z = bz0 + (e.clientY - r.top - oz) / s;
    if (walkable(App.roomAt(x, z, S.level)) && App.engine) App.enterWalkAt(x, z, App.viewer.yaw, S.level);
  });

  const chips = $('#chips');
  const dup = s => D.multi && D.stops.some(q => q !== s && q.label === s.label); // même nom sur deux niveaux : niveau en suffixe discret
  chips.innerHTML = D.stops.map(s => { const r = D.rooms.find(q => q.id === s.id); return `<button class="chip" data-stop="${esc(s.id)}">${esc(s.label)}${dup(s) ? ` · ${esc(App.levelName(s.level))}` : ''}${r && r.area ? `<small>${esc(r.area)}</small>` : ''}</button>`; }).join('');
  chips.addEventListener('click', e => { const b = e.target.closest('[data-stop]'); if (b) App.goStop(b.dataset.stop); });
  App.goStop = id => { if (App.engine) App.engine.goStop(id); };
  App.enterWalkAt = (x, z, yaw, lv) => { if (App.engine) App.engine.enterWalkAt(x, z, yaw, lv); };

  $$('.modes button[data-mode]').forEach(b => b.addEventListener('click', () => App.set('mode', b.dataset.mode)));
  $('#optUltra').addEventListener('change', e => App.set('rendu', e.target.checked ? 'ultra' : 'simple'));
  init360(D);
  $$('.seg[data-key]').forEach(seg => seg.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) App.set(seg.dataset.key, seg.dataset.key === 'level' ? +b.dataset.v : b.dataset.v); }));
  const bind = (id, key, parse = v => v) => { const el = $(id); if (!el) return; el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => App.set(key, el.type === 'checkbox' ? el.checked : parse(el.value))); };
  bind('#optAO', 'ao'); bind('#optCut', 'cut'); bind('#optUnderlay', 'underlay'); bind('#optDims', 'dims');
  bind('#optSeason', 'season'); bind('#optHour', 'hour', parseFloat); bind('#optBsoDrop', 'bsoDrop', parseFloat); bind('#optBsoTilt', 'bsoTilt', parseFloat); bind('#optExposure', 'exposure', parseFloat);
  const settings = $('#settings'), btnSet = $('#btnSettings');
  btnSet.addEventListener('click', () => { settings.hidden = !settings.hidden; btnSet.setAttribute('aria-expanded', String(!settings.hidden)); syncUI(); });
  const fiche = $('#fiche');
  $('#btnFiche').addEventListener('click', () => { try { fiche.showModal(); } catch (e) { fiche.setAttribute('open', ''); } });
  fiche.addEventListener('click', e => { if (e.target === fiche) { try { fiche.close(); } catch (er) { fiche.removeAttribute('open'); } } });
  $('#ficheClose').addEventListener('click', () => { try { fiche.close(); } catch (e) { fiche.removeAttribute('open'); } });

  /* préréglages de lumière autour de la vue */
  const RAILS = { lumiere: { title: 'Lumière', rows: [
    { label: 'Moment', opts: [{ t: 'Matin', set: { hour: 9 }, test: s => s.hour < 11.5 }, { t: 'Midi', set: { hour: 13 }, test: s => s.hour >= 11.5 && s.hour < 16 }, { t: 'Soir', set: { hour: 18.5 }, test: s => s.hour >= 16 && s.hour < 21 }, { t: 'Nuit', set: { hour: 22 }, test: s => s.hour >= 21 }] },
    { label: 'Saison', opts: [{ t: 'Hiver', set: { season: 'hiver' } }, { t: 'Print.', set: { season: 'printemps' } }, { t: 'Été', set: { season: 'ete' } }, { t: 'Aut.', set: { season: 'automne' } }] },
    { label: 'BSO', opts: [{ t: 'Ouverts', set: { bsoDrop: 0, bsoTilt: 0 }, match: { bsoDrop: 0 } }, { t: 'Inclinés', set: { bsoDrop: 100, bsoTilt: 45 } }, { t: 'Fermés', set: { bsoDrop: 100, bsoTilt: 78 } }] },
  ] } };
  const rowHTML = (gk, r, ri) => `<div class="rrow" data-g="${gk}" data-r="${ri}"><span>${r.label}</span><div class="seg mini">${r.opts.map((o, oi) => `<button data-g="${gk}" data-r="${ri}" data-o="${oi}">${o.t}</button>`).join('')}</div></div>`;
  let railsNarrow = null;
  function renderRails() {
    const narrow = innerWidth < 900; if (narrow === railsNarrow) return; railsNarrow = narrow;
    if (D.simple) { $('#railM').innerHTML = ''; $('#railR').innerHTML = ''; $('#railR').hidden = true; return; }
    const grp = gk => RAILS[gk].rows.map((r, ri) => rowHTML(gk, r, ri)).join('');
    if (narrow) { $('#railM').innerHTML = grp('lumiere'); $('#railR').innerHTML = ''; }
    else { $('#railM').innerHTML = ''; $('#railR').innerHTML = `<div class="rail-h">${RAILS.lumiere.title}</div>` + grp('lumiere') + '<div class="sun-cap mono" id="sunCap"></div>'; }
    App.sunText && App.sunText(); updateRails();
  }
  function updateRails() {
    $$('.rrow[data-g]').forEach(row => {
      const r = RAILS[row.dataset.g].rows[+row.dataset.r];
      $$('button', row).forEach(b => { const o = r.opts[+b.dataset.o], m = o.match || o.set; b.setAttribute('aria-pressed', String(o.test ? o.test(S) : Object.entries(m).every(([k, v]) => S[k] === v))); });
    });
  }
  document.addEventListener('click', e => { const b = e.target.closest('.rrow button[data-g]'); if (!b) return; const o = RAILS[b.dataset.g].rows[+b.dataset.r].opts[+b.dataset.o]; for (const [k, v] of Object.entries(o.set)) App.set(k, v); });
  App.sunText = t => { if (t != null) App._sun = t; const c = document.getElementById('sunCap'); if (c) c.textContent = App._sun || ''; };

  syncUI = function () {
    if (railsNarrow !== null) updateRails();
    document.body.classList.toggle('set-open', !$('#settings').hidden);
    $('#railR').hidden = S.mode === 'plan' || !!D.simple || S.rendu !== 'ultra';
    document.body.dataset.mode = S.mode;
    $$('.modes button[data-mode]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === S.mode)));
    $('#optUltra').checked = S.rendu === 'ultra'; $('#ultraOpts').hidden = S.rendu !== 'ultra';
    $('#railM').hidden = S.rendu !== 'ultra';
    $$('.seg[data-key]').forEach(seg => $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(String(S[seg.dataset.key]) === b.dataset.v))));
    if ($('#levels')) $('#levels').hidden = S.mode === 'walk';
    $('#optCut').checked = S.cut; $('#optUnderlay').checked = S.underlay; $('#optDims').checked = S.dims;
    { $('#optAO').checked = S.ao;
      $('#optSeason').value = S.season; $('#optHour').value = S.hour; $('#outHour').textContent = fmtHour(S.hour);
      if ($('#optBsoDrop')) { $('#optBsoDrop').value = S.bsoDrop; $('#outDrop').textContent = `${Math.round(S.bsoDrop)} %`;
        $('#optBsoTilt').value = S.bsoTilt; $('#outTilt').textContent = `${Math.round(S.bsoTilt)}°`; }
      $('#optExposure').value = S.exposure; $('#outExp').textContent = fr(S.exposure); }
    const plan = S.mode === 'plan';
    $('#planWrap').hidden = !plan; $('#compass').hidden = !plan;
    $('#hud').hidden = S.mode !== 'walk'; $('#mini').hidden = S.mode !== 'walk';
    $('#joy').hidden = !(S.mode === 'walk' && App.coarse);
    $('#tour').hidden = plan && innerWidth < 900;
    $('#compassRot').setAttribute('transform', `rotate(${-(D.geo && D.geo.nord) || 0})`);
    $('#hint').textContent = S.mode === 'walk'
      ? (App.coarse ? 'Glisser pour regarder · toucher un endroit pour y aller, une porte pour passer' : 'Glisser pour regarder · cliquer un endroit pour y aller, une porte pour passer · ZQSD ou flèches · E pour ouvrir une porte')
      : S.mode === 'orbit' ? (App.coarse ? 'Un doigt pour tourner, deux pour zoomer · double-toucher le sol pour entrer' : 'Glisser pour tourner · clic droit pour déplacer · molette pour zoomer · double-clic au sol pour entrer')
      : 'Glisser pour déplacer · molette ou pincer pour zoomer · cliquer dans une pièce pour y entrer';
  };
  App.on(k => { if (['dims', 'underlay', 'level'].includes(k)) drawPlan(); if (k === 'mode' && S.mode === 'plan') requestAnimationFrame(() => { fitPlan(); updateMarker(); }); });
  addEventListener('resize', () => { renderRails(); if (S.mode === 'plan') fitPlan(); syncUI(); });
  renderRails(); syncUI(); drawPlan();
  if (S.mode === 'plan') requestAnimationFrame(fitPlan);

  /* ---------- Galerie ---------- */
  const PHOTOS = D.photos || [];
  const photoFile = p => `photos/${p.id}-${S.moment}.jpg`;
  const momentT = () => ((D.moments || []).find(m => m.id === S.moment) || {}).t || '';
  const photoSub = p => [p.a, momentT().toLowerCase()].filter(Boolean).join(' · ');
  let gi = 0;
  function renderGallery() {
    if (!PHOTOS.length) return;
    const p = PHOTOS[gi], img = $('#gHero'), src = photoFile(p);
    if (!img.src.endsWith(src)) { img.style.opacity = '0.2'; const pre = new Image(); pre.onload = () => { img.src = src; img.style.opacity = '1'; }; pre.onerror = () => { img.style.opacity = '1'; }; pre.src = src; }
    img.alt = `${p.t}, ${photoSub(p)}`;
    $('#gCapT').textContent = p.t; $('#gCapS').textContent = photoSub(p); $('#gCount').textContent = `${gi + 1} / ${PHOTOS.length}`;
    $('#gThumbs').innerHTML = PHOTOS.map((q, i) => `<button role="listitem" data-i="${i}" aria-current="${i === gi}" aria-label="${esc(q.t)}"><img src="${photoFile(q)}" alt="" loading="lazy"><span>${esc(q.t)}</span></button>`).join('');
    if (!$('#lightbox').hidden) { $('#lbImg').src = src; $('#lbCap').textContent = `${p.t} · ${photoSub(p)}`; }
  }
  const gStep = d => { gi = (gi + d + PHOTOS.length) % PHOTOS.length; renderGallery(); };
  $('#gPrev').addEventListener('click', e => { e.stopPropagation(); gStep(-1); });
  $('#gNext').addEventListener('click', e => { e.stopPropagation(); gStep(1); });
  $('#gThumbs').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) { gi = +b.dataset.i; renderGallery(); } });
  $('#gHeroBox').addEventListener('click', () => { $('#lightbox').hidden = false; renderGallery(); });
  $('#lbPrev').addEventListener('click', () => gStep(-1)); $('#lbNext').addEventListener('click', () => gStep(1));
  $('#lbClose').addEventListener('click', () => { $('#lightbox').hidden = true; });
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') $('#lightbox').hidden = true; });
  addEventListener('keydown', e => { if ($('#gallery').hidden) return; if (e.key === 'ArrowRight') gStep(1); else if (e.key === 'ArrowLeft') gStep(-1); else if (e.key === 'Escape') $('#lightbox').hidden = true; });
  const leaveGallery = mode => {
    if (!App.engine && mode !== 'plan') return;
    $('#gallery').hidden = true; $('#lightbox').hidden = true;
    if (mode === 'walk') { if (S.mode !== 'walk') App.set('mode', 'walk'); else if (D.stops[0]) App.goStop(D.stops[0].id); } else App.set('mode', mode);
    syncUI();
  };
  $('#gStart').addEventListener('click', () => leaveGallery('walk'));
  $('#gOrbit').addEventListener('click', () => leaveGallery('orbit'));
  $('#gPlan').addEventListener('click', () => leaveGallery('plan'));
  $('#btnPhotos').addEventListener('click', () => { $('#gallery').hidden = false; renderGallery(); });
  App.on(k => { if (k === 'moment') renderGallery(); });
  renderGallery();
  if (/[?&](vue|arret)=/.test(location.search)) $('#gallery').hidden = true; // retour du 360° : pas de galerie avant la visite
}
/* ---------- Visite à 360° : bouton des modes et retour ----------
   Le bouton 360° ouvre la visionneuse du plan (pano/, faite par moteur/pano.mjs) au point de vue de la pièce où l'on se tient, sinon au
   plus proche du même niveau ; en visite, le regard est gardé (&cap=). Il n'est montré que si le 360° de ce plan existe. La visionneuse
   ramène à la visite 3D au même endroit (?vue=x,z,niveau,lacet ; ?arret=<id> depuis un 360° plus ancien sans position), traité une fois
   le moteur prêt (retour360). Contrôlé par moteur/controle.mjs et moteur/pano-visionneuse.mjs */
function init360(D) {
  const b = $('#btn360'); let V = null;
  fetch('pano/visite.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null))
    .then(v => { if (v && Array.isArray(v.arrets) && v.arrets.length) { V = App.pano = v; b.hidden = false; } }).catch(() => {});
  const pos = a => (Array.isArray(a.pos) ? a.pos : (D.stops.find(s => s.id === a.id) || {}).p);
  const piece = (x, z, lv) => { const r = App.roomAt(x, z, lv); return r ? (r.of || r.id) : null; };
  App.cible360 = () => {
    if (!V) return null;
    const v = App.viewer || {}, lv = Number.isInteger(v.lv) ? v.lv : (D.multi ? S.level : 0), enVisite = S.mode === 'walk' && !!v.show;
    const avec = V.arrets.filter(a => pos(a)), meme = avec.filter(a => (a.niveau ?? 0) === lv), L = meme.length ? meme : avec;
    let best = null;
    if (Number.isFinite(v.x) && L.length) {
      const ici = piece(v.x, v.z, lv), dans = ici ? L.filter(a => piece(pos(a)[0], pos(a)[1], a.niveau ?? 0) === ici) : [];
      for (const a of dans.length ? dans : L) { const p = pos(a), d = Math.hypot(p[0] - v.x, p[1] - v.z); if (!best || d < best.d) best = { a, d }; }
    }
    const a = best ? best.a : (V.arrets.find(x => x.id === V.depart) || V.arrets[0]);
    return { id: a.id, url: `pano/?depuis=visite${enVisite && Number.isFinite(v.yaw) ? `&cap=${v.yaw.toFixed(3)}` : ''}#${encodeURIComponent(a.id)}` };
  };
  b.addEventListener('click', () => { const c = App.cible360(); if (c) location.href = c.url; });
}
function retour360() {
  const q = new URLSearchParams(location.search), v = q.get('vue'), arret = q.get('arret'), D = App.D;
  if ((!v && !arret) || !App.engine) return false;
  const n = v ? v.split(',').map(Number) : [];
  if (v && !(n.length === 4 && n.every(Number.isFinite))) return false;
  const s = v ? null : D.stops.find(x => x.id === arret); if (!v && !s) return false;
  $('#gallery').hidden = true; $('#lightbox').hidden = true;
  if (S.mode === 'walk') App.set('mode', 'plan'); // posé d'un coup au point de vue, sans marcher depuis l'arrêt de départ
  if (v) App.enterWalkAt(n[0], n[1], n[3], Math.max(0, Math.min(D.levels.length - 1, Math.round(n[2]))));
  else App.enterWalkAt(s.p[0], s.p[1], s.yaw, s.level ?? 0);
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  syncUI(); return true;
}
/* chargement et échec : armés avant initUI, pour qu'une erreur de l'interface s'affiche au lieu d'un chargement sans fin */
function armLoader() {
  App.loader = (msg, frac) => { $('#loadMsg').textContent = msg; if (frac != null) { $('#loadBar').style.width = `${Math.round(frac * 100)}%`; $('#gLoad').textContent = `Chargement de la 3D… ${Math.round(frac * 100)} %`; } };
  App.loaded = () => { $('#loader').classList.add('done'); $('#gStart').disabled = false; $('#gLoad').textContent = 'Visite à la première personne, pièce par pièce'; retour360(); };
  App.fail = msg => {
    $('#loader').classList.add('done');
    if (!$('#err')) { const d = document.createElement('div'); d.id = 'err'; d.className = 'ui'; d.innerHTML = `<p><b>La 3D n'a pas pu démarrer.</b><br>${esc(msg)}<br>Le plan 2D reste disponible.</p>`; $('#app').appendChild(d); }
    $$('.modes button[data-mode]').forEach(b => { if (b.dataset.mode !== 'plan') b.disabled = true; });
    $('#gLoad').textContent = 'La 3D ne démarre pas sur cet appareil. Le plan 2D reste disponible.'; $('#gOrbit').disabled = true;
    try { App.set('mode', 'plan'); syncUI(); } catch (e) { console.error(e); }
  };
  setTimeout(() => { if (!App.engine && !App.engineStarting) App.fail('Le chargement a été interrompu : rechargez la page.'); }, 45000);
}
boot();
