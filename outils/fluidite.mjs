/* Banc de fluidité de la visite (L1-14). Rejoue des parcours fixes dans la vraie visite (sans ?shoot=1 : régulateur, chaînes de
   mouvement, barrière GPU et culling actifs), par les vraies entrées de Chrome (clavier, souris, doigt) et les poignées du moteur
   (window.__v, App.set, App.goStop), et sort un tableau par plan × profil × rendu (simple, ultra réaliste) :
   - chargement : visite prête (moteur démarré), première image de la 3D, entrée en visite, démarrage (entrée et premier tour) ;
   - intervalles entre images mesurés par une boucle requestAnimationFrame indépendante du moteur (p50, p95, max), images réellement
     rendues par le moteur (intervalles, temps processeur, temps GPU par requête de chronométrage), en mouvement : clavier (ou manette
     au doigt), regard (souris ou doigt), clics au sol, trajets de l'entrée à chaque arrêt (itinéraires d'outils/trajets.mjs, portes des
     pièces ouvertes), escaliers ; à part : arrêts de la visite guidée, maquette ;
   - latences jusqu'à l'image finie par le GPU (lecture d'un pixel sur l'image qui montre l'effet de l'entrée) : clavier, manette,
     glisser continu (chaque image comparée au regard que demandait la main : saisie 1:1), premier mouvement après un clic au sol, porte
     cliquée, entrée en visite ;
   - retour en pleine qualité après un trajet, un glisser, un survol, une touche (de la dernière image qui bouge à l'image pleine
     qualité finie) ;
   - temps d'image forcé à chaque arrêt (pleine qualité et chaque palier de mouvement, image finie), appels de dessin, triangles, palier
     retenu, mémoire GPU estimée (textures, cibles de rendu des chaînes vues, ombres, sondes, géométrie, écran) ;
   - clic : part de l'écran où un clic agit, à chaque arrêt intérieur (grille 32 × 20, moteur clickPlan), arrivées dans un placard.
   Cas de banc des défauts de L1-15 (point 3 de son À faire), chacun vérifié en échec sur une version fautive (--mutation) :
   artefacts du palier bas (image de chaque palier contre l'image d'arrêt), latence du glisser continu, retour en pleine qualité après un
   trajet, survol en palier bas (survol d'une porte : aucune image de mouvement), porte de placard sans « placard » dans l'identifiant
   (aucune porte ne bouge sans clic, portes de placard ou de coffret comprises, pendant tout le parcours).
   Test négatif : --ralenti <ms> ajoute une attente active à chaque image du moteur ; le banc doit échouer.
   Serveur et Chrome : moteur/chrome.mjs (127.0.0.1, liste blanche, environnement sans secret). Un Chrome neuf par mesure, profil
   temporaire dont le fichier Local State coupe l'économiseur d'énergie (il plafonne à 30 i/s sous 20 % de batterie). Polices Google
   bloquées (réseau hors mesure). Vérifier avant de mesurer : sur secteur (pmset -g batt), aucun autre Chrome qui travaille.
   Usage : node outils/fluidite.mjs [--plans d201,3081,...] [--profils mac,modeste,telephone,telephone6,swiftshader]
             [--rendus simple,ultra] [--passages 2] [--json sortie.json] [--mutation <nom>] [--ralenti <ms>] [--rapide]
   Par défaut : les 5 plans de plans/, profils mac, modeste et telephone, rendus simple et ultra, un passage.
   Mutations (copie du moteur dans un dossier temporaire, jamais moteur/) : artefacts, glisser, pleine, survol, placard.
   Code de sortie : 0 si tout tient, 1 si un seuil ou un cas échoue, 2 si une mesure n'a pas pu se faire. */
import { serveurStatique, envSansSecret } from '../moteur/chrome.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/* ---------- Seuils ----------
   Seuils délégués par l'utilisateur (« L1-14 ok », 29/09/2026, soir), fixés le 29/09/2026 sur les mesures acceptées dans les critères
   de L1-15 (validé le 29/09/2026) avec une marge pour le bruit de mesure. Profils émulés sur un Mac M3 : l'émulation ralentit le
   processeur, jamais le GPU. Ils valent pour le rendu simple (par défaut) et pour l'ultra réaliste (les mesures acceptées de L1-15 ont été
   faites sur le rendu complet d'alors, devenu l'ultra réaliste). Appareils réels (portable d'entrée de gamme, téléphone Android de 2 à
   3 Go, iPhone ancien) : à venir, les seuils absolus se vérifient sur eux. Téléphone ×6 (profil nouveau) et rendu logiciel (SwiftShader,
   jamais seul profil) : aucune mesure acceptée, mesurés sans seuil ; seuls les contrôles de fonctionnement (escalier, portes, erreurs)
   y valent. */
const DATE_SEUILS = '29/09/2026';
const COMMUN = {
  rafP50: 17.5,        // intervalle rAF en mouvement, médiane : accepté 16,7 ms (60 i/s)
  rafP95: 20,          // accepté ≤ 16,8 ms
  rafLong: 0.003,      // part des intervalles rAF en mouvement de plus de 50 ms : accepté max ≤ 29,2 (Mac), 33,4 (modeste), 33,3 ms
                       // (téléphone), donc aucun ; ≤ 0,3 % pour le bruit de la machine partagée (le maximum reste relevé)
  imgP95: 21,          // images rendues par le moteur en mouvement : accepté p95 ≤ 19 ms (27/09/2026)
  imgLong: 0.003,      // part des images rendues en mouvement de plus de 67 ms : accepté 35 à 48 ms au plus en trajet (barrière GPU)
  demarrageMax: 67,    // entrée en visite et premier tour : accepté 0 image > 50 ms (26 exécutions sur 27, une à 50,1)
  clavierP50: 60,      // latence clavier jusqu'à l'image finie : seuils de L1-15 55 et 70 ms
  clavierP95: 75,
  glisserP50: 50,      // glisser continu : accepté ≤ 45 ms (Mac), 46,1 ms (modeste, duplex, reste accepté)
  clicP50: 55,         // premier mouvement après un clic au sol : seuil de L1-15 50 ms
  pleineMax: 330,      // pleine qualité après trajet, glisser, touche ou survol : seuil de L1-15 300 ms
  sautMax: 0.015,      // escalier : ressaut par image au-delà de la pente sur le chemin parcouru, critère du contrôle escalier (1 cm) + marge
  clicCouverture: 1,   // part de l'écran où un clic agit, à chaque arrêt intérieur : 100 % accepté sur Mac
  artefactMediane: 4,  // palier de mouvement contre image d'arrêt : médiane des écarts de zone ≤ 4/255 (contrôle sautMouvement)
  artefactSombre: 0.01 // part des zones plus sombres de plus de 16/255 en mouvement qu'à l'arrêt (grain d'occlusion) : ≤ 1 %
};
const SEUILS = {
  mac: COMMUN,
  modeste: COMMUN,
  telephone: Object.assign({}, COMMUN, { clicCouverture: 0.96 }), // accepté 96,8 à 100 % au téléphone
  telephone6: null,
  swiftshader: null,
};

const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const PROFILS = {
  mac: { nom: 'Mac', vp: { width: 1440, height: 862, deviceScaleFactor: 2 }, cpu: 1, args: GPU },
  modeste: { nom: 'modeste', vp: { width: 1920, height: 1080, deviceScaleFactor: 1 }, cpu: 4, args: GPU },
  telephone: { nom: 'téléphone', vp: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, cpu: 4, args: GPU, doigt: true },
  telephone6: { nom: 'téléphone ×6', vp: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, cpu: 6, args: GPU, doigt: true },
  swiftshader: { nom: 'SwiftShader', vp: { width: 1280, height: 720, deviceScaleFactor: 1 }, cpu: 1, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], rapide: true, lent: 4 },
};
const COMMUNS = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
const ABREGE = { '3081-613-ef700f1f': 'duplex', 'd201-f14b3e4b': 'd201', 'plan-du-lot-c02f7fc8': 'lot', 'plans-du-lot-3124-6e1a90c9': '3124', 't2-432-21258e6e': 't2' };
// débit en mouvement : clavier, manette, regard (glisser sans sonde de latence), clics au sol, trajets, escaliers ; le glisser qui mesure la
// latence lit un pixel toutes les deux images (image finie) et n'entre pas dans le débit
const MOUV = ['clavier', 'manette', 'regard', 'clic-sol', 'trajet', 'escalier'];

/* ---------- Mutations : défauts de L1-15 remis dans une copie du moteur ---------- */
const MUTATIONS = {
  // artefacts du palier bas : occlusion ambiante d'écran (GTAO, 4 échantillons) dans les chaînes de mouvement, en basse résolution
  artefacts: [['if (!c) { c = makeChain(0);', 'if (!c) { c = makeChain(4);']],
  // latence du glisser continu : regard lissé (la vue rattrape la main de 12 % par événement, retard de l'ordre de 70 ms comme les 61
  // à 97 ms de la réception de L1-15) au lieu d'être saisi 1:1 ; à 30 % par événement, le retard (33 ms) restait sous le seuil
  glisser: [['walk.yaw = drag.yaw + Math.atan((e.clientX - cx) / f) - Math.atan((drag.x - cx) / f);',
    'walk.yaw += (drag.yaw + Math.atan((e.clientX - cx) / f) - Math.atan((drag.x - cx) / f) - walk.yaw) * 0.12;']],
  // pleine qualité tardive après un trajet (1,44 s à la réception de L1-15)
  pleine: [['const AQ_HOLD = 180,', 'const AQ_HOLD = 1440,']],
  // survol qui passe l'image en palier bas : chaque mouvement de souris compte comme un mouvement
  survol: [["if (S.mode === 'walk' && e.pointerType === 'mouse') { // anneau posé là où le clic mènera",
    "if (S.mode === 'walk' && e.pointerType === 'mouse') { aqMove(); invalidate(); // anneau posé là où le clic mènera"]],
  // ouverture anticipée à 1,3 m (moteur d'avant le 29/09/2026), qui n'écartait que l'identifiant « placard »
  placard: [["if (S.mode === 'plan') return;\n  let opMove = false, opEnd = false;",
    "if (S.mode === 'plan') return;\n  if (S.mode === 'walk') for (const op of operables) { if (op.id === 'placard' || op.target > 0.5 || (MULTI && op.lv !== walk.lv)) continue; const c = GEO.centroid(op.rect); if (Math.hypot(c[0] - walk.x, c[1] - walk.z) < 1.3) op.target = 1; }\n  let opMove = false, opEnd = false;"]],
};

/* ---------- Arguments ---------- */
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2), opt = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith('--')) continue; const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; opt[k] = v; }
const liste = (v, def) => (typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : def);
const tousPlans = fs.readdirSync(path.join(ROOT, 'plans')).filter(d => !d.startsWith('_') && fs.existsSync(path.join(ROOT, 'plans', d, 'plan.json'))).sort();
const PLANS = liste(opt.plans, tousPlans).map(p => { const m = tousPlans.filter(d => d === p || d.startsWith(p) || ABREGE[d] === p); if (m.length !== 1) { console.error(`Plan inconnu ou ambigu : « ${p} ».`); process.exit(2); } return m[0]; });
const PROFS = liste(opt.profils, ['mac', 'modeste', 'telephone']); for (const p of PROFS) if (!PROFILS[p]) { console.error(`Profil inconnu : « ${p} » (${Object.keys(PROFILS).join(', ')}).`); process.exit(2); }
const RENDUS = liste(opt.rendus, ['simple', 'ultra']); for (const r of RENDUS) if (!['simple', 'ultra'].includes(r)) { console.error(`Rendu inconnu : « ${r} » (simple, ultra).`); process.exit(2); }
const PASSAGES = Math.max(1, parseInt(opt.passages || '1', 10));
const RALENTI = opt.ralenti ? parseFloat(opt.ralenti) : 0;
if (opt.mutation && !MUTATIONS[opt.mutation]) { console.error(`Mutation inconnue : « ${opt.mutation} » (${Object.keys(MUTATIONS).join(', ')}).`); process.exit(2); }

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }

/* copie du moteur et des fichiers de visite des plans, mutée ; moteur/ n'est jamais touché */
function copieMutee(nom) {
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), `banc-mutation-${nom}-`));
  fs.cpSync(path.join(ROOT, 'moteur'), path.join(dst, 'moteur'), { recursive: true });
  const f = path.join(dst, 'moteur', 'engine.js'); let s = fs.readFileSync(f, 'utf8');
  for (const [a, b] of MUTATIONS[nom]) { if (!s.includes(a)) { console.error(`Mutation « ${nom} » : texte introuvable dans engine.js, le moteur a changé.`); process.exit(2); } s = s.replace(a, b); }
  fs.writeFileSync(f, s);
  for (const p of PLANS) { const d = path.join(dst, 'plans', p); fs.mkdirSync(d, { recursive: true }); for (const n of ['index.html', 'plan.json', `plan-${p}.png`]) if (fs.existsSync(path.join(ROOT, 'plans', p, n))) fs.copyFileSync(path.join(ROOT, 'plans', p, n), path.join(d, n)); }
  return dst;
}

/* ---------- Sonde injectée dans la page (avant tout script) ---------- */
export function sonde(opts) {
  const B = window.__banc = { tags: ['chargement'], tag: 0, raf: [], draws: [], lat: [], pleines: [], portes: [], drags: [], expect: null, allow: {}, pret: null, img1: null,
    probe: null, pleine: null, sauts: [], prevY: null, drag: null, steer: null, trajet: null, survol: false, lastChange: 0, composers: new Set(), ralenti: opts.ralenti || 0, err: null, sync: 0, lastDraw: 0 };
  const now = () => performance.now();
  let V = null, gl = null, tq = null, cur = null, prevPose = null, prevDrawPose = null, reset0 = null;
  const px = new Uint8Array(4), gpuQ = [];
  B.setTag = n => { let i = B.tags.indexOf(n); if (i < 0) { B.tags.push(n); i = B.tags.length - 1; } B.tag = i; };
  const poseCam = () => { const c = V.camera, p = c.position, q = c.quaternion; return [p.x, p.y, p.z, q.x, q.y, q.z, q.w]; };
  const differe = (a, b) => { if (!a || !b) return true; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-7) return true; return false; };
  const opDe = id => V.operables.find(o => o.id === id);
  // image finie par le GPU : lecture d'un pixel de l'écran (lecture synchrone ; cadre de lecture remis tel que three.js l'a laissé)
  const finGPU = () => { const fb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING); if (fb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (fb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb); B.sync++; return now(); };
  function installer() {
    V = window.__v; gl = V.renderer.getContext(); tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const info = V.renderer.info; reset0 = info.reset.bind(info); B.reset0 = reset0;
    // début d'une image de la boucle du moteur (draw() commence par info.reset)
    info.reset = function () {
      if (B.ralenti) { const f = now() + B.ralenti; while (now() < f); } // test négatif : rendu volontairement ralenti
      cur = { s: now(), low: V.aq.low ? 1 : 0, lvl: V.aq.lvl, tag: B.tag, q: null };
      if (tq && !gpuQ.some(x => x.actif)) { const q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); cur.q = { q, actif: true, i: -1 }; gpuQ.push(cur.q); }
      return reset0();
    };
    // fin d'une image : draw() pose sa barrière GPU (fenceSync) juste après le rendu
    const fence0 = gl.fenceSync.bind(gl);
    gl.fenceSync = function (a, b) { if (cur && cur.q && cur.q.actif) { gl.endQuery(tq.TIME_ELAPSED_EXT); cur.q.actif = false; } const r = fence0(a, b); try { finImage(); } catch (e) { B.err = String(e && e.stack || e); } return r; };
    B.pret = now();
  }
  function finImage() {
    if (!cur) return;
    const e = now(), p = poseCam(), bouge = differe(p, prevDrawPose); prevDrawPose = p;
    if (bouge) B.lastChange = Math.max(B.lastChange, cur.s);
    const ri = V.renderer.info.render, d = [cur.s, e, cur.low, cur.lvl, cur.tag, ri.calls, ri.triangles, bouge ? 1 : 0, 0, -1, V.walk.y, V.walk.x, V.walk.z];
    if (cur.q) cur.q.i = B.draws.length;
    if (!B.img1) B.img1 = e;
    if (V.composerM) B.composers.add(V.composerM);
    const P = B.probe; // latence : première image qui montre l'effet de l'entrée, finie par le GPU
    if (P && P.tIn != null) {
      const vu = P.op ? Math.abs(opDe(P.op).t - P.op0) > 1e-6 : differe(p, P.p0);
      if (vu) { const t = finGPU(); d[8] = t; B.lat.push({ nom: P.nom, ms: t - P.tIn, bas: cur.low }); B.probe = null; }
    }
    const Q = B.pleine; // retour en pleine qualité : première image pleine qualité après des images de mouvement
    if (Q) { if (cur.low) Q.bas = true; else if (Q.bas && B.lastChange > Q.t0) { const t = d[8] || finGPU(); d[8] = t; B.pleines.push({ nom: Q.nom, ms: t - B.lastChange }); B.pleine = null; } }
    const G = B.drag; // glisser continu : regard affiché par image finie
    if (G && G.actif && V.drag && V.drag.look && (++G.n % 2 === 0)) { const t = d[8] || finGPU(); d[8] = t; G.images.push([t, V.walk.yaw]); }
    B.draws.push(d); B.lastDraw = e; cur = null;
  }
  function releverGPU() {
    for (let k = gpuQ.length - 1; k >= 0; k--) {
      const x = gpuQ[k]; if (x.actif) continue;
      if (!gl.getQueryParameter(x.q, gl.QUERY_RESULT_AVAILABLE)) continue;
      const ns = gl.getQueryParameter(x.q, gl.QUERY_RESULT), dj = gl.getParameter(tq.GPU_DISJOINT_EXT);
      if (!dj && x.i >= 0 && B.draws[x.i]) B.draws[x.i][9] = ns / 1e6;
      gl.deleteQuery(x.q); gpuQ.splice(k, 1);
    }
  }
  // regard guidé sur la ligne de foulée d'un escalier (la main qui oriente la vue pendant qu'on avance)
  const proj = (s, p) => { let acc = 0, best = null;
    for (let i = 1; i < s.line.length; i++) {
      const a = s.line[i - 1], b = s.line[i], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); if (L < 1e-9) continue;
      let t = ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / L; if (i > 1) t = Math.max(0, t); if (i < s.line.length - 1) t = Math.min(L, t);
      const d = Math.hypot(p[0] - a[0] - ex / L * t, p[1] - a[1] - ez / L * t); if (!best || d < best.d) best = { d, t: acc + t }; acc += L;
    }
    return best ? best.t : 0; };
  B.proj = proj;
  function guider() { const S = B.steer, w = V.walk, t = proj(S.s, [w.x, w.z]), g = App.stairPt(S.s, t + S.dir * 0.45, 0), dx = g[0] - w.x, dz = g[1] - w.z; if (Math.hypot(dx, dz) > 0.05) w.yaw = Math.atan2(-dx, -dz); }
  function surveillerPortes(t) {
    if (!B.expect) return;
    for (const op of V.operables) {
      const ex = B.expect[op.id]; if (ex === undefined) { B.expect[op.id] = op.target; continue; }
      if (op.target !== ex) { if (!(B.allow[op.id] > now())) B.portes.push({ id: op.id, t, cible: op.target, tag: B.tags[B.tag], x: +V.walk.x.toFixed(2), z: +V.walk.z.toFixed(2) }); B.expect[op.id] = op.target; }
    }
  }
  function tour(t) {
    try {
      if (!V && window.__v && window.__v.renderer) installer();
      if (V) {
        const p = poseCam(), bouge = differe(p, prevPose) ? 1 : 0, w = V.walk; prevPose = p;
        if (B.prevY != null && Math.abs(w.y - B.prevY) > 0.3 && B.tags[B.tag] !== 'banc' && B.sauts.length < 20) B.sauts.push({ t: Math.round(t), tag: B.tags[B.tag], y0: B.prevY, y1: w.y, lv: w.lv, x: +w.x.toFixed(2), z: +w.z.toFixed(2), anim: !!w.anim, touches: [...w.keys].join(','), st: w.st ? w.st.id : null, mode: App.state.mode });
        B.prevY = w.y;
        B.raf.push(t, B.tag, bouge, V.aq.low ? 1 : 0, V.aq.lvl, w.y, w.lv);
        if (B.steer) guider();
        surveillerPortes(t);
        const T = B.trajet; if (T && !T.fin) { if (w.anim) { T.vu = true; T.len = w.anim.len; } else if (T.vu) T.fin = t; }
        if (tq) releverGPU();
      } else B.raf.push(t, B.tag, 0, 0, 0, 0, 0);
    } catch (e) { B.err = String(e && e.stack || e); }
    requestAnimationFrame(tour);
  }
  requestAnimationFrame(tour);
  // images longues (API Long Animation Frames) : scripts responsables, pour attribuer chaque à-coup au moteur ou au banc
  B.loaf = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.duration >= 45) B.loaf.push({ t: Math.round(e.startTime), ms: Math.round(e.duration), bloc: Math.round(e.blockingDuration || 0), tag: B.tags[B.tag],
    scripts: (e.scripts || []).filter(x => x.duration >= 5).slice(0, 4).map(x => ({ ms: Math.round(x.duration), f: `${x.sourceFunctionName || '?'}@${(x.sourceURL || '').split('/').pop()}:${x.sourceCharPosition ?? ''}`, par: String(x.invoker || '').slice(0, 60), mise: Math.round(x.forcedStyleAndLayoutDuration || 0) })),
    rendu: e.renderStart ? Math.round(e.startTime + e.duration - e.renderStart) : 0, style: e.styleAndLayoutStart ? Math.round(e.startTime + e.duration - e.styleAndLayoutStart) : 0 }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  // entrées réelles (événements de confiance), vues avant le moteur (capture sur window)
  const armer = e => { if (!e.isTrusted) return; const P = B.probe; if (P && P.ev === e.type && P.tIn == null) { P.tIn = e.timeStamp; P.p0 = V ? poseCam() : null; if (P.op) P.op0 = opDe(P.op).t; } };
  for (const ty of ['keydown', 'pointerdown', 'pointerup']) addEventListener(ty, armer, true);
  addEventListener('pointerdown', e => { if (!e.isTrusted || !V) return; const G = B.drag; if (!G || !G.arme) return;
    const r = V.renderer.domElement.getBoundingClientRect(); Object.assign(G, { arme: false, actif: true, x0: e.clientX, yaw0: V.walk.yaw, f: (r.height / 2) / Math.tan(V.camera.fov * Math.PI / 360), cx: r.left + r.width / 2, ent: [[e.timeStamp, e.clientX]] }); }, true);
  addEventListener('pointermove', e => { if (!e.isTrusted) return; const G = B.drag;
    if (B.survol || (G && G.actif)) B.lastChange = Math.max(B.lastChange, e.timeStamp);
    if (G && G.actif) { const L = e.getCoalescedEvents ? e.getCoalescedEvents() : []; for (const c of (L.length ? L : [e])) G.ent.push([c.timeStamp, c.clientX]); } }, true);
  addEventListener('pointerup', e => { if (!e.isTrusted) return; const G = B.drag; if (G && G.actif) { G.actif = false; G.tUp = e.timeStamp; B.drags.push(G); B.drag = null; } }, true);

  /* ---------- aides appelées par le banc ---------- */
  const D = () => App.D, M = () => !!App.D.multi;
  const rAt = (x, z, k) => (M() ? App.roomAt(x, z, k) : App.roomAt(x, z));
  B.interieurs = () => D().stops.filter(s => { const r = rAt(s.p[0], s.p[1], s.level || 0); return r && !App.isExt(r); }).map(s => s.id);
  B.arrets = () => D().stops.map(s => s.id);
  // travail du banc (poses, recherches à l'écran, images forcées) : étiquette « banc », jamais comptée dans les mesures
  const banc = () => B.setTag('banc');
  B.poser = id => { banc(); B.poseT = now(); const s = D().stops.find(q => q.id === id); V.placeAt(s.p[0], s.p[1], s.level || 0, s.yaw, s.pitch ?? -0.06); V.invalidate(4); };
  B.calme = () => { const w = V.walk, f = document.getElementById('fadeEl');
    return B.lastDraw > (B.poseT || 0) && B.lastDraw > (B.calmeT || 0) && !w.anim && !w.glide && !V.lookVel && !V.drag && !w.keys.size && !w.joy.x && !w.joy.y && !V.aq.low && !(f && f.style.opacity === '1')
      && !V.operables.some(o => Math.abs(o.t - o.target) > 1e-4) && now() - B.lastDraw > 120 && !(V.probe && V.probe.queue.length); };
  const surCanevas = (x, y) => document.elementFromPoint(x, y) === V.renderer.domElement;
  // visibilité du culling refaite pour la pose actuelle (sinon celle de la dernière image dessinée, ailleurs)
  const vueAJour = () => { V.camera.updateMatrixWorld(); V.scene.updateMatrixWorld(true); if (App.state.mode === 'walk') V.cullUpdate(); };
  // point de sol à viser depuis la pose actuelle : 1,5 à 4 m devant, au plus près du centre de l'écran
  B.solVise = () => { banc(); vueAJour(); let best = null;
    for (let y = 0.92; y > 0.45; y -= 0.02) for (let x = 0.25; x <= 0.75; x += 0.025) {
      const cx = Math.round(x * innerWidth), cy = Math.round(y * innerHeight); if (!surCanevas(cx, cy)) continue;
      const c = V.clickPlan(cx, cy); if (!c.h || !c.P || !c.tg || c.tg.kind !== 'sol') continue;
      const d = Math.hypot(c.h.point.x - V.walk.x, c.h.point.z - V.walk.z); if (d < 1.0 || d > 4) continue;
      const sc = Math.abs(x - 0.5) + Math.abs(y - 0.7) * 0.5; if (!best || sc < best.sc) best = { x: cx, y: cy, sc, d };
    }
    return best; };
  // vantail de porte visible (porte d'une pièce), au plus près du centre
  B.porteVisee = (id, tourner) => { banc(); const w = V.walk, y0 = w.yaw;
    for (const dy of tourner ? [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, Math.PI] : [0]) {
      w.yaw = y0 + dy; V.setWalkCamera(); const b = porteIci(id);
      if (b) { if (dy) { V.placeAt(w.x, w.z, w.lv, w.yaw, w.pitch); V.invalidate(4); } return b; }
    }
    w.yaw = y0; V.setWalkCamera(); V.invalidate(2); return null; };
  const porteIci = id => { vueAJour(); let best = null;
    for (let j = 0; j < 30; j++) for (let i = 0; i < 48; i++) {
      // pixel entier (Chrome livre le toucher arrondi au pixel) et vantail tout autour à 3 px (vantail vu de biais : quelques pixels)
      const cx = Math.round((i + 0.5) / 48 * innerWidth), cy = Math.round((j + 0.5) / 30 * innerHeight); if (!surCanevas(cx, cy)) continue;
      const h = V.pick({ clientX: cx, clientY: cy }), op = h && h.object.userData.op; if (!op) continue;
      const o = D().openings[op.id]; if (!o || o.kind !== 'door' || (id && op.id !== id)) continue;
      if (Math.hypot(h.point.x - V.walk.x, h.point.z - V.walk.z) > 4.5) continue;
      if ([[3, 0], [-3, 0], [0, 3], [0, -3]].some(([a, b]) => { const g = V.pick({ clientX: cx + a, clientY: cy + b }); return !g || !g.object.userData.op || g.object.userData.op.id !== op.id; })) continue;
      const sc = Math.hypot(cx / innerWidth - 0.5, cy / innerHeight - 0.5); if (!best || sc < best.sc) best = { x: cx, y: cy, id: op.id, sc };
    }
    return best; };
  // points de l'écran autour de (x, y) qui touchent encore le vantail id (survol sans sortir du vantail)
  B.surPorte = (x, y, id) => { banc(); vueAJour(); const out = [];
    for (let r = 0; r <= 14; r += 2) for (let a = 0; a < 8; a++) { const px = Math.round(x + r * Math.cos(a * Math.PI / 4)), py = Math.round(y + r * Math.sin(a * Math.PI / 4)); if (!surCanevas(px, py)) continue; const h = V.pick({ clientX: px, clientY: py }); if (h && h.object.userData.op && h.object.userData.op.id === id && !V.clickTarget(h)) out.push([px, py]); }
    return out; };
  // portes de placard ou de coffret : un côté sans pièce où l'on se tient, ou une pièce de rangement
  B.portesInfo = () => V.operables.map(op => { const o = D().openings[op.id]; if (!o) return { id: op.id, kind: '?', placard: op.id === 'placard' };
    const m = o.s ? (o.s[0] + o.s[1]) / 2 : 0, k = o.level || 0, cote = sg => { if (!o.pt) return null; for (let d = 0.05; d <= 0.3; d += 0.05) { const r = rAt(...o.pt(m, sg < 0 ? -d : o.depth + d), k); if (r) return r; } return null; };
    const a = cote(-1), b = cote(1), rang = r => !r || /placard|rangement|dressing|penderie|tableau/i.test(`${r.id} ${r.name || ''}`) || (r.hidden && !r.of);
    return { id: op.id, kind: o.kind, placard: op.id === 'placard' || ((o.kind === 'door') && (rang(a) || rang(b))) }; });
  // portes des pièces et portes-fenêtres ouvertes (clics simulés), portes de placard et d'entrée fermées : les trajets de l'entrée à chaque arrêt
  B.ouvrirPieces = () => { banc(); const P = B.portesInfo(), ouv = [];
    for (const op of V.operables) { const i = P.find(q => q.id === op.id), o = D().openings[op.id]; if (!o || !['door', 'french'].includes(o.kind) || i.placard) continue; op.target = op.t = 1; op.apply(1); if (B.expect) B.expect[op.id] = 1; ouv.push(op.id); }
    V.markShadows(); V.invalidate(4); return ouv; };
  // clic partout : part de l'écran où un clic agit (déplacement ou porte), à chaque arrêt intérieur, portes dans l'état de la visite
  B.clicGrille = () => { banc(); const out = [], isPl = r => !!r && /placard/i.test(r.id);
    for (const id of B.interieurs()) {
      B.poser(id); vueAJour(); let n = 0, act = 0, dep = 0, hors = 0; const rien = [];
      for (let j = 0; j < 20; j++) for (let i = 0; i < 32; i++) {
        const cx = (i + 0.5) / 32 * innerWidth, cy = (j + 0.5) / 20 * innerHeight; if (!surCanevas(cx, cy)) continue;
        n++; const c = V.clickPlan(cx, cy); if (c.bascule) { act++; continue; }
        if (!c.P) { if (rien.length < 4) rien.push({ x: Math.round(cx), y: Math.round(cy), vise: c.h ? `${c.h.object.material && c.h.object.material.name || c.h.object.name || '?'}${c.h.object.userData.walk ? ' (sol)' : ''}${c.h.object.userData.op ? ' (ouvrant ' + c.h.object.userData.op.id + ')' : ''} y=${c.h.point.y.toFixed(2)} à ${Math.hypot(c.h.point.x - V.walk.x, c.h.point.z - V.walk.z).toFixed(1)} m` : 'rien', cible: c.tg ? c.tg.kind : null }); continue; }
        act++;
        const P = c.P, e = P[P.length - 1], ye = P.ys ? P.ys[P.ys.length - 1] : 0, le = M() ? V.levelOfY(ye) : 0; let len = 0;
        for (let q = 1; q < P.length; q++) len += Math.hypot(P[q][0] - P[q - 1][0], P[q][1] - P[q - 1][1]); if (len > 0.05) dep++;
        const re = rAt(e[0], e[1], le); if (isPl(re) || (!re && !(M() && V.surfacesAt(e[0], e[1]).some(f => f.st)))) hors++;
      }
      out.push({ id, n, act: n ? act / n : null, dep: n ? dep / n : null, hors, rien });
    }
    return out; };
  // temps d'image forcé à l'arrêt (image finie) : pleine qualité, puis chaque palier de mouvement
  B.tempsImage = (paliers) => { banc(); const med = a => a.sort((x, y) => x - y)[a.length >> 1], mes = f => { const t = now(); f(); return finGPU() - t; };
    finGPU(); const pleine = []; for (let i = 0; i < 5; i++) pleine.push(mes(() => V.renderFull()));
    reset0(); V.renderFull(); const appels = V.renderer.info.render.calls, triangles = V.renderer.info.render.triangles;
    const bas = []; if (paliers) for (let l = 0; l < V.AQ_STEPS.length; l++) { const a = []; for (let i = 0; i < 3; i++) a.push(mes(() => V.renderLow(l))); bas.push(+med(a).toFixed(2)); }
    V.invalidate(3); return { pleine: +med(pleine).toFixed(2), paliers: bas, appels, triangles }; };
  // artefacts du palier bas : image d'arrêt contre l'image de chaque palier, luminance moyenne de 64 × 40 zones
  B.artefacts = () => { banc(); const c = V.renderer.domElement, W = c.width, H = c.height, a = new Uint8Array(W * H * 4), NX = 64, NY = 40;
    const lire = () => { const fb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING); if (fb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, a); if (fb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
      const z = new Float64Array(NX * NY), n = new Float64Array(NX * NY);
      for (let y = 0; y < H; y++) { const zy = Math.min(NY - 1, Math.floor(y / H * NY)) * NX; for (let x = 0; x < W; x++) { const k = (y * W + x) * 4, zi = zy + Math.min(NX - 1, Math.floor(x / W * NX)); z[zi] += 0.2126 * a[k] + 0.7152 * a[k + 1] + 0.0722 * a[k + 2]; n[zi]++; } }
      for (let i = 0; i < z.length; i++) z[i] /= n[i] || 1; return z; };
    V.renderFull(); const Z0 = lire(), out = [];
    for (let l = 0; l < V.AQ_STEPS.length; l++) { V.renderLow(l); const Z = lire(), e = [], s = []; for (let i = 0; i < Z.length; i++) { e.push(Math.abs(Z[i] - Z0[i])); s.push(Z0[i] - Z[i]); }
      e.sort((x, y) => x - y); out.push({ l, mediane: +e[e.length >> 1].toFixed(2), sombre: +(s.filter(v => v > 16).length / s.length).toFixed(4), pireSombre: +Math.max(...s).toFixed(1) }); }
    V.invalidate(3); return out; };
  // mémoire GPU estimée : textures, cibles de rendu (chaîne d'arrêt et chaînes de mouvement vues, ombres, sondes), géométrie, écran
  B.memoire = () => { const T = V.THREE, vus = new Set(); let tex = 0, cibles = 0, geo = 0;
    const bpp = t => (t.type === T.FloatType ? 16 : t.type === T.HalfFloatType ? 8 : 4) * (t.format === T.RedFormat ? 0.25 : 1);
    const texO = t => { if (!t || !t.isTexture || vus.has(t) || t.isRenderTargetTexture) return; vus.add(t); const im = t.image || {};
      let w = im.width || 0, h = im.height || 0, d = im.depth || 1; if (Array.isArray(im)) { w = im[0] && im[0].width || 0; h = im[0] && im[0].height || 0; d = im.length; }
      tex += w * h * d * bpp(t) * (t.generateMipmaps ? 4 / 3 : 1); };
    const rtO = r => { if (!r || vus.has(r)) return; vus.add(r); const tx = r.textures || [r.texture], d = r.isWebGLCubeRenderTarget ? 6 : (r.depth || 1), s = r.samples || 0, b = tx.reduce((q, t) => q + bpp(t), 0);
      cibles += r.width * r.height * d * (b * (r.texture.generateMipmaps ? 4 / 3 : 1) + (s ? s * (b + 4) : 0) + (r.depthBuffer ? 4 : 0)); };
    const geoO = g => { if (!g || vus.has(g)) return; vus.add(g); for (const at of Object.values(g.attributes)) geo += at.array ? at.array.byteLength : 0; if (g.index) geo += g.index.array.byteLength; };
    V.scene.traverse(o => { if (o.geometry) geoO(o.geometry); for (const m of o.material ? [].concat(o.material) : []) { for (const v of Object.values(m)) texO(v); for (const u of Object.values(m.uniforms || {})) texO(u && u.value); } if (o.shadow && o.shadow.map) rtO(o.shadow.map); });
    texO(V.scene.environment); texO(V.scene.background);
    const passes = cc => { if (!cc) return; rtO(cc.renderTarget1); rtO(cc.renderTarget2); for (const p of cc.passes) for (const v of Object.values(p)) { if (v && v.isWebGLRenderTarget) rtO(v); else if (Array.isArray(v)) v.forEach(x => x && x.isWebGLRenderTarget && rtO(x)); } };
    passes(V.composer); for (const cc of B.composers) passes(cc);
    if (V.probe) { rtO(V.probe.rt); for (const e of Object.values(V.probe.cache || {})) if (e && e.env) { if (e.env.isWebGLRenderTarget) rtO(e.env); else texO(e.env.texture || e.env); } }
    if (V.AO && V.AO.tex) texO(V.AO.tex.value);
    const c = V.renderer.domElement, ecran = c.width * c.height * 4 * 3; // tampon de dessin, tampon de profondeur et image affichée
    return { mo: +((tex + cibles + geo + ecran) / 1048576).toFixed(1), textures: +(tex / 1048576).toFixed(1), cibles: +(cibles / 1048576).toFixed(1), geometrie: +(geo / 1048576).toFixed(1), ecran: +(ecran / 1048576).toFixed(1), chaines: B.composers.size + 1, info: Object.assign({}, V.renderer.info.memory) }; };
  // escaliers : départ au pied (montée) ou à l'arrivée (descente), regard le long de la volée
  B.escalierDepart = (i, up, recul = 0.6) => { banc(); const s = V.stairs[i], t = up ? -recul : s.len + recul, lv = up ? s.from : s.to, p = App.stairPt(s, t, 0), f = App.stairAt(s, up ? 0 : s.len), [x, z] = V.freeSpot(p[0], p[1], lv);
    const u = up ? f.u : [-f.u[0], -f.u[1]]; V.placeAt(x, z, lv, Math.atan2(-u[0], -u[1]), up ? 0.05 : -0.3); V.invalidate(4); return { lv, cible: up ? s.to : s.from }; };
  B.escalierFini = (i, up) => { const s = V.stairs[i], w = V.walk, c = up ? s.to : s.from, t = proj(s, [w.x, w.z]); return w.lv === c && Math.abs(w.y - V.levels[c].y) < 0.005 && (up ? t >= s.len + 0.2 : t <= -0.2); };
  // escalier au clic ou au doigt : point de l'écran qui mène au sol de l'autre niveau
  // (volée tournante : l'autre niveau n'est pas toujours visible d'un bout ; sinon la marche la plus avancée dans le sens voulu)
  B.escalierVise = (i, up) => { banc(); const s = V.stairs[i], c = up ? s.to : s.from, Y = V.levels[c].y, y0 = V.walk.y; let best = null, marche = null;
    for (const pitch of up ? [0.05, 0.25, 0.4, -0.2] : [-0.3, -0.5, -0.7, -0.15]) {
      V.walk.pitch = pitch; V.setWalkCamera(); vueAJour();
      for (let j = 0; j < 24; j++) for (let k = 0; k < 24; k++) {
        const cx = Math.round((k + 0.5) / 24 * innerWidth), cy = Math.round((j + 0.5) / 24 * innerHeight); if (!surCanevas(cx, cy)) continue;
        const q = V.clickPlan(cx, cy); if (!q.P || !q.P.ys) continue; const ye = q.P.ys[q.P.ys.length - 1];
        const sc = Math.hypot(cx / innerWidth - 0.5, cy / innerHeight - 0.55);
        if (Math.abs(ye - Y) <= 0.005) { if (!best || sc < best.sc) best = { x: cx, y: cy, sc, pitch, sol: true }; continue; }
        const g = up ? ye - y0 : y0 - ye; if (g > 0.3 && (!marche || g > marche.g + 1e-3 || (Math.abs(g - marche.g) <= 1e-3 && sc < marche.sc))) marche = { x: cx, y: cy, sc, pitch, g, sol: false };
      }
      if (best) break;
    }
    const r = best || marche; if (r) { V.walk.pitch = r.pitch; V.setWalkCamera(); V.invalidate(4); } return r; };
}

/* ---------- Outils ---------- */
const dormir = ms => new Promise(r => setTimeout(r, ms));
const pct = (a, q) => { if (!a || !a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))]; };
const r1 = v => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const stats = a => (a && a.length ? { n: a.length, p50: r1(pct(a, 0.5)), p95: r1(pct(a, 0.95)), max: r1(Math.max(...a)) } : { n: 0, p50: null, p95: null, max: null });
function secteur() { try { return /AC Power/.test(execSync('pmset -g batt').toString()); } catch { return null; } }

/* ---------- Une mesure : un plan, un profil, un rendu ---------- */
async function mesurer(plan, profil, rendu, passage, racine) {
  const P = PROFILS[profil], rapide = !!(P.rapide || opt.rapide), lent = P.lent || 1;
  const server = await serveurStatique(racine, `plans/${plan}`), port = server.address().port;
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'banc-fluidite-profil-'));
  // économiseur d'énergie coupé (Local State du profil de test) : Chrome plafonne sinon à 30 i/s sous 20 % de batterie
  fs.writeFileSync(path.join(udd, 'Local State'), JSON.stringify({ performance_tuning: { battery_saver_mode: { state: 0 }, high_efficiency_mode: { state: 0 } } }));
  const R = { plan, profil, rendu, passage, secteur: secteur(), erreurs: [], notes: [] };
  const browser = await puppeteer.launch({ headless: true, userDataDir: udd, args: [...P.args, ...COMMUNS], protocolTimeout: 1800000, env: envSansSecret() });
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => R.erreurs.push(String(e.message || e).slice(0, 300)));
    page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Failed to load resource|ERR_BLOCKED/.test(t)) R.erreurs.push(t.slice(0, 300)); });
    await page.setViewport(P.vp);
    if (P.cpu > 1) await page.emulateCPUThrottling(P.cpu);
    const cdp = await page.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
    await page.evaluateOnNewDocument(sonde, { ralenti: RALENTI });
    const ev = (f, ...a) => page.evaluate(f, ...a);
    const tag = n => ev(n => __banc.setTag(n), n);
    // au repos : une image dessinée après l'appel (et après la dernière pose), rien qui bouge, 120 ms sans image
    const calme = async (ms = 12000) => { await ev(() => { __banc.calmeT = performance.now(); __v.invalidate(1); }); const ok = await page.waitForFunction(() => __banc.calme(), { polling: 50, timeout: ms * lent }).then(() => true, () => false); if (!ok) R.notes.push('pas au repos après ' + ms * lent + ' ms'); return ok; };
    const armer = (evt, nom, extra) => ev((evt, nom, extra) => { __banc.probe = Object.assign({ ev: evt, nom, tIn: null }, extra || {}); }, evt, nom, extra || null);
    const armerPleine = nom => ev(nom => { __banc.pleine = { nom, t0: performance.now(), bas: false }; }, nom);
    const sonder = () => ev(() => { const p = __banc.probe; __banc.probe = null; return p && p.tIn == null ? 'sans-entree' : p ? 'sans-image' : null; });
    const toucher = async (x, y) => { if (P.doigt) await page.touchscreen.tap(x, y); else { await page.mouse.move(x, y); await dormir(250); await page.mouse.down(); await dormir(60); await page.mouse.up(); } };

    // 1. chargement : visite prête (moteur démarré), première image de la 3D
    await page.goto(`http://127.0.0.1:${port}/plans/${plan}/?rendu=${rendu}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const pret = await page.waitForFunction(() => (window.__banc && __banc.pret && __banc.img1) || document.getElementById('err'), { polling: 100, timeout: 300000 * lent }).then(() => true, () => false);
    if (!pret || await ev(() => !window.__v)) { R.erreurs.push('La visite ne démarre pas' + (await ev(() => document.getElementById('err')?.textContent || '').catch(() => ''))); return R; }
    Object.assign(R, await ev(() => ({ pretMs: Math.round(__banc.pret), imageMs: Math.round(__banc.img1), gpu: (() => { const g = __v.renderer.getContext(), x = g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : '?'; })(),
      rendu: App.state.rendu, coarse: App.coarse, pente: Math.max(0, ...(__v.stairs || []).map(s => (__v.levels[s.to].y - __v.levels[s.from].y) / s.len)), logiciel: !!__v.SOFTGL, texq: __v.TEXQ, multi: !!App.D.multi, escaliers: (__v.stairs || []).length })));
    await dormir(1000); await tag('repos'); await dormir(1000);

    // 2. entrée en visite (bouton de la galerie) et premier tour
    await tag('demarrage');
    const g = await ev(() => { const b = document.getElementById('gStart'), r = b && b.getBoundingClientRect(); return b && !b.disabled && r.width ? [r.x + r.width / 2, r.y + r.height / 2] : null; });
    await armer('pointerup', 'entree');
    if (g) { if (P.doigt) await page.touchscreen.tap(g[0], g[1]); else await page.mouse.click(g[0], g[1]); } else { await ev(() => App.leaveGallery('walk')); R.notes.push('bouton de la galerie absent'); }
    await dormir(400);
    if (P.doigt) { const W = P.vp.width, H = P.vp.height; await page.touchscreen.touchStart(W * 0.3, H * 0.45); for (let i = 1; i <= 60; i++) { await page.touchscreen.touchMove(W * 0.3 + i * 2.5, H * 0.45); await dormir(16); } await page.touchscreen.touchEnd(); }
    else { await page.keyboard.down('ArrowLeft'); await dormir(1000); await page.keyboard.up('ArrowLeft'); }
    await calme(); await sonder();
    if (await ev(() => App.state.mode !== 'walk')) { R.erreurs.push('Pas en visite après le bouton de la galerie'); return R; }
    await ev(() => { __banc.expect = {}; });
    const interieurs = await ev(() => __banc.interieurs()), arrets = await ev(() => __banc.arrets());
    R.portesInfo = await ev(() => __banc.portesInfo());

    // 3. clic partout (portes dans l'état de la visite : fermées)
    if (!rapide) { await tag('clic-grille'); R.clicGrille = await ev(() => __banc.clicGrille()); }

    // 4. clavier (ou manette au doigt), depuis chaque arrêt intérieur
    const arr = rapide ? interieurs.slice(0, 2) : interieurs;
    let sansImage = 0;
    for (const id of arr) {
      await ev(id => __banc.poser(id), id); await calme();
      if (!P.doigt) for (const k of ['KeyW', 'ArrowLeft', 'KeyS', 'ArrowRight']) {
        await tag('clavier'); await armer('keydown', 'clavier'); await armerPleine('pleine-clavier');
        await page.keyboard.down(k); await dormir(k.startsWith('Arrow') ? 500 : 700); await page.keyboard.up(k);
        await calme(); if (await sonder()) sansImage++;
      } else {
        const j = await ev(() => { const r = document.getElementById('joy').getBoundingClientRect(); return r.width ? [r.x + r.width / 2, r.y + r.height / 2] : null; });
        if (!j) { R.notes.push('manette absente'); break; }
        for (const [dx, dy] of [[0, -56], [-56, 0]]) {
          await tag('manette'); await armer('pointerdown', 'manette'); await armerPleine('pleine-manette');
          await page.touchscreen.touchStart(j[0] + dx * 0.5, j[1] + dy * 0.5); await dormir(16); await page.touchscreen.touchMove(j[0] + dx, j[1] + dy);
          for (let t = 0; t < 700; t += 50) { await dormir(50); await page.touchscreen.touchMove(j[0] + dx, j[1] + dy + (t % 100 ? 0.5 : 0)); }
          await page.touchscreen.touchEnd(); await calme(); if (await sonder()) sansImage++;
        }
      }
    }
    if (sansImage) R.notes.push(`${sansImage} entrée(s) clavier ou manette sans image qui bouge (mur devant)`);

    // 5. regard : glisser continu (souris ou doigt), 125 événements par seconde, vers la droite, main arrêtée 150 ms avant le lâcher ;
    // les deux premiers mesurent la latence (image finie lue toutes les deux images), le dernier le débit (sans lecture)
    for (const [k, id] of arr.slice(0, rapide ? 2 : 3).entries()) {
      const sondeLat = k < (rapide ? 1 : 2);
      await ev(id => __banc.poser(id), id); await calme();
      const W = P.vp.width, H = P.vp.height, x0 = W * 0.25, y0 = H * 0.45, dx = W * 0.45, dur = 1000;
      await tag(sondeLat ? 'glisser' : 'regard'); if (sondeLat) await ev(() => { __banc.drag = { arme: true, actif: false, n: 0, images: [], ent: [] }; }); await armerPleine('pleine-glisser');
      if (P.doigt) await page.touchscreen.touchStart(x0, y0); else { await page.mouse.move(x0, y0); await dormir(300); await page.mouse.down(); }
      const t0 = Date.now();
      for (let i = 1; ; i++) { const t = i * 8; if (t > dur) break; const w = t0 + t - Date.now(); if (w > 0) await dormir(w); const x = x0 + dx * t / dur; if (P.doigt) await page.touchscreen.touchMove(x, y0); else await page.mouse.move(x, y0); }
      await dormir(150); if (P.doigt) await page.touchscreen.touchEnd(); else await page.mouse.up();
      await calme();
    }

    // 6. clics au sol (souris ou doigt) : premier mouvement, trajet, retour en pleine qualité
    R.clics = { essais: 0, reussis: 0 };
    for (const id of arr) {
      if (R.clics.essais >= (rapide ? 2 : 5)) break;
      await ev(id => __banc.poser(id), id); await calme();
      const c = await ev(() => __banc.solVise()); if (!c) continue;
      const a = await ev(() => [__v.walk.x, __v.walk.z]);
      await tag('clic-sol'); await armer('pointerup', 'clic'); await armerPleine('pleine-clic');
      await toucher(c.x, c.y); R.clics.essais++;
      await dormir(200); await calme(15000); await sonder();
      const b = await ev(() => [__v.walk.x, __v.walk.z]); if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3) R.clics.reussis++;
    }

    // 7. portes : clic sur le vantail (ouvre), second clic (ferme) ; survol d'une porte puis du sol (souris)
    R.portesClic = { essais: 0, ouvertes: 0, fermees: 0 }; const faites = new Set(); let survolFait = false;
    for (const id of rapide ? [] : interieurs) {
      if (faites.size >= 3 && (survolFait || P.doigt)) break;
      await ev(id => __banc.poser(id), id); await calme();
      let pv = await ev(() => __banc.porteVisee(null, true)); await calme(); if (!pv) { R.notes.push(`aucun vantail visé depuis ${id}`); continue; }
      if (!survolFait && !P.doigt) { // survol : d'abord sur le vantail (rien ne doit passer en palier bas), puis sur le sol
        const pts = await ev((x, y, id) => __banc.surPorte(x, y, id), pv.x, pv.y, pv.id);
        if (pts.length < 4) { R.notes.push(`survol : vantail ${pv.id} trop étroit à l’écran`); continue; }
        survolFait = true; R.survolFait = true; await page.mouse.move(pv.x, pv.y); await dormir(400); await calme();
        await ev(() => { __banc.survol = true; }); await tag('survol-porte');
        for (let i = 0; i < 60; i++) { const q = pts[i % pts.length]; await page.mouse.move(q[0], q[1]); await dormir(16); }
        await dormir(300); await tag('survol-sol');
        const sv = await ev(() => __banc.solVise());
        if (sv) { await armerPleine('pleine-survol'); for (let i = 0; i < 50; i++) { await page.mouse.move(sv.x + 40 * Math.sin(i / 5), sv.y + 15 * Math.cos(i / 6)); await dormir(16); } await calme(); }
        await ev(() => { __banc.survol = false; });
        await ev(id => __banc.poser(id), id); await calme();
        pv = await ev(() => __banc.porteVisee(null, true)); await calme(); if (!pv) continue;
      }
      if (faites.has(pv.id) || faites.size >= 3) continue;
      faites.add(pv.id); R.portesClic.essais++;
      await tag('porte'); await ev(id => { __banc.allow[id] = performance.now() + 4000; }, pv.id); await armer('pointerup', 'porte', { op: pv.id });
      await toucher(pv.x, pv.y); await dormir(700); await calme(); await sonder();
      if (await ev(id => __v.operables.find(o => o.id === id).target === 1, pv.id)) R.portesClic.ouvertes++;
      else R.notes.push(`porte ${pv.id} pas ouverte : ${await ev((x, y) => { const h = __v.pick({ clientX: x, clientY: y }), e = document.elementFromPoint(x, y); return `${e && e.id ? '#' + e.id : e && e.tagName} ; ${h ? (h.object.userData.op ? 'vantail ' + h.object.userData.op.id : h.object.material && h.object.material.name || '?') : 'rien'}`; }, pv.x, pv.y)}`);
      const pv2 = await ev(id => __banc.porteVisee(id), pv.id);
      if (pv2) { await ev(id => { __banc.allow[id] = performance.now() + 4000; }, pv.id); await toucher(pv2.x, pv2.y); await dormir(700); await calme(); if (await ev(id => __v.operables.find(o => o.id === id).target === 0, pv.id)) R.portesClic.fermees++; }
      else { await ev(id => { const o = __v.operables.find(q => q.id === id); __banc.allow[id] = performance.now() + 2000; o.target = 0; }, pv.id); await calme(); R.notes.push(`porte ${pv.id} refermée par le banc (vantail ouvert hors de vue)`); }
    }

    // 8. visite guidée : chaque arrêt dans l'ordre (App.goStop, comme une puce), portes dans l'état de la visite ; temps d'image à l'arrêt
    R.arrets = [];
    for (const id of rapide ? arrets.slice(0, 3) : arrets) {
      await tag('guidee'); const t0 = await ev(() => performance.now());
      await ev(id => App.goStop(id), id); await dormir(100); await calme(15000);
      const t1 = await ev(() => performance.now()), mode = await ev(() => (document.getElementById('fadeEl') ? 'fondu' : 'trajet'));
      await tag('arret'); const ti = await ev(p => __banc.tempsImage(p), !rapide);
      R.arrets.push(Object.assign({ id, ms: Math.round(t1 - t0), mode }, ti)); await calme();
    }

    // 9. trajets de l'entrée à chaque arrêt (itinéraires d'outils/trajets.mjs), portes des pièces ouvertes, placards fermés
    R.portesOuvertes = await ev(() => __banc.ouvrirPieces()); await calme();
    R.trajets = [];
    for (const id of (rapide ? arrets.slice(1, 3) : arrets.slice(1))) {
      await ev(id => __banc.poser(id), arrets[0]); await calme();
      await tag('trajet'); await armerPleine('pleine-trajet');
      const calc = await ev(id => { const t = performance.now(); __banc.trajet = { t0: t, fin: null, vu: false, len: 0 }; App.goStop(id); return performance.now() - t; }, id);
      await dormir(150); await calme(25000);
      const T = await ev(() => __banc.trajet); R.trajets.push({ id, t0: Math.round(T.t0), anime: !!T.vu, s: T.fin ? +((T.fin - T.t0) / 1000).toFixed(2) : null, m: +(T.len || 0).toFixed(2), calculMs: r1(calc) });
    }

    // 10. escaliers (plans à plusieurs niveaux) : montée et descente au clavier ou à la manette (regard guidé sur la volée), puis au clic ou au doigt
    R.escaliers = [];
    const nEsc = await ev(() => (App.D.multi ? __v.stairs.length : 0));
    for (let i = 0; i < nEsc; i++) for (const up of [true, false]) {
      const sens = up ? 'montee' : 'descente';
      await ev((i, up) => __banc.escalierDepart(i, up), i, up); await calme();
      const nomC = P.doigt ? 'manette' : 'clavier';
      await tag('escalier'); const t0 = await ev((i, up) => { __banc.steer = { s: __v.stairs[i], dir: up ? 1 : -1 }; return performance.now(); }, i, up);
      let j = null;
      if (P.doigt) { j = await ev(() => { const r = document.getElementById('joy').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); await page.touchscreen.touchStart(j[0], j[1] - 28); await page.touchscreen.touchMove(j[0], j[1] - 56); }
      else await page.keyboard.down('KeyW');
      const ok = await page.waitForFunction((i, up) => __banc.escalierFini(i, up), { polling: 50, timeout: 20000 * lent }, i, up).then(() => true, () => false);
      const t1 = await ev(() => performance.now());
      if (P.doigt) await page.touchscreen.touchEnd(); else await page.keyboard.up('KeyW');
      await ev(() => { __banc.steer = null; }); await calme();
      R.escaliers.push({ escalier: i, sens, par: nomC, ok, s: +((t1 - t0) / 1000).toFixed(2) });
      if (rapide) continue;
      // au clic (souris) ou au doigt : point de l'écran qui mène au sol de l'autre niveau
      await ev((i, up) => __banc.escalierDepart(i, up, up ? 1.0 : 0.6), i, up); await calme();
      let ok2 = false, n = 0, u0 = null, u1 = null;
      for (; n < 3 && !ok2; n++) {
        const v = await ev((i, up) => __banc.escalierVise(i, up), i, up); await calme(); if (!v) break;
        await tag('escalier'); if (!n) await armer('pointerup', 'clic-escalier'); await armerPleine('pleine-escalier');
        const a = await ev(() => performance.now()); u0 = u0 ?? a; await toucher(v.x, v.y); await dormir(200);
        await page.waitForFunction(() => !__v.walk.anim, { polling: 50, timeout: 20000 * lent }).catch(() => {});
        u1 = await ev(() => performance.now()); await calme(); await sonder();
        ok2 = await ev((i, up) => { const s = __v.stairs[i], c = up ? s.to : s.from; return __v.walk.lv === c && Math.abs(__v.walk.y - __v.levels[c].y) < 0.005; }, i, up);
      }
      R.escaliers.push({ escalier: i, sens, par: P.doigt ? 'doigt' : 'clic', ok: ok2, gestes: n, s: u0 != null ? +((u1 - u0) / 1000).toFixed(2) : null, note: !ok2 && !n ? 'aucun point de l’écran ne mène vers l’autre niveau' : undefined });
    }

    // 11. maquette : rotation à la souris ou au doigt
    await ev(() => App.set('mode', 'orbit')); await dormir(600); await calme();
    { const W = P.vp.width, H = P.vp.height; await tag('maquette');
      if (P.doigt) { await page.touchscreen.touchStart(W * 0.3, H * 0.5); for (let i = 1; i <= 75; i++) { await page.touchscreen.touchMove(W * 0.3 + i * 2.5, H * 0.5); await dormir(16); } await page.touchscreen.touchEnd(); }
      else { await page.mouse.move(W * 0.3, H * 0.5); await page.mouse.down(); for (let i = 1; i <= 75; i++) { await page.mouse.move(W * 0.3 + i * 6, H * 0.5); await dormir(16); } await page.mouse.up(); }
      await dormir(1500); await calme(); }
    await ev(() => App.set('mode', 'walk')); await dormir(400); await calme();

    // 11 bis. tactile (demande de l'utilisateur du 29/09/2026 : « je dois pas avoir de pb de zoom de la page sur téléphone, ça doit zoomer
    // dans le plan », « il ne faut pas qu'on puisse activer le mode sélection ») : pincement (geste synthétique de Chrome) dans chaque vue,
    // qui doit zoomer la vue et jamais la page, pincement sur l'interface (la page ne zoome pas), appui long sur les textes de
    // l'interface (aucune sélection)
    if (P.doigt && !rapide) {
      await tag('tactile'); const T = R.tactile = { vues: [], interface: [], selection: [] };
      const echelle = () => ev(() => +visualViewport.scale.toFixed(3));
      const remettre = async () => { if (await echelle() !== 1) { await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 }); await dormir(300); } };
      const pincer = async (x, y) => { await cdp.send('Input.synthesizePinchGesture', { x: Math.round(x), y: Math.round(y), scaleFactor: 2, gestureSourceType: 'touch' }); await dormir(500); };
      const mesureVue = mode => ev(mode => mode === 'plan' ? +document.getElementById('plan').viewBox.baseVal.width.toFixed(3)
        : mode === 'orbit' ? +__v.camera.position.distanceTo(__v.orbit.target).toFixed(3) : +__v.camera.fov.toFixed(3), mode);
      for (const [mode, nom] of [['plan', 'plan 2D'], ['orbit', 'maquette'], ['walk', 'visite']]) {
        await ev(m => App.set('mode', m), mode); if (mode === 'walk') await ev(id => __banc.poser(id), arrets[0]); await dormir(900); await calme();
        const c = await ev(m => { const e = m === 'plan' ? document.getElementById('plan') : __v.renderer.domElement, r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height * 0.45]; }, mode);
        const a = await mesureVue(mode); await pincer(c[0], c[1]); await calme(); const b = await mesureVue(mode), s = await echelle();
        T.vues.push({ vue: nom, avant: a, apres: b, zoome: Math.abs(b - a) > 1e-3 * Math.max(1, Math.abs(a)), pageEchelle: s }); await remettre();
      }
      // interface de la visite : barre du haut, puces de la visite guidée, nom de la pièce, boutons des modes
      await ev(() => App.set('mode', 'walk')); await ev(id => __banc.poser(id), arrets[0]); await dormir(600); await calme();
      const cibles = await ev(() => [['barre du haut', '.topbar'], ['puces de la visite guidée', '#tour'], ['nom de la pièce', '#hud'], ['boutons des modes', '.modes']].map(([n, q]) => {
        const e = document.querySelector(q), r = e && e.getBoundingClientRect(); return r && r.width && r.height ? { n, x: r.x + Math.min(r.width / 2, 60), y: r.y + r.height / 2 } : null; }).filter(Boolean));
      for (const q of cibles) { await pincer(q.x, q.y); T.interface.push({ cible: q.n, pageEchelle: await echelle() }); await remettre(); }
      // appui long (1,2 s) sur chaque texte visible de l'interface : aucune sélection de texte
      const textes = await ev(() => { const out = [], vu = new Set();
        for (const e of document.querySelectorAll('.ui button, .ui b, .ui span, .ui a, .ui h1, .ui h2, .ui p, .chip')) {
          const r = e.getBoundingClientRect(); if (!r.width || !r.height || !e.textContent.trim() || r.y < 0 || r.y > innerHeight || r.x < 0 || r.x > innerWidth) continue;
          const x = r.x + Math.min(12, r.width / 2), y = r.y + r.height / 2, k = Math.round(x / 20) + ':' + Math.round(y / 20), h = document.elementFromPoint(x, y);
          if (vu.has(k) || !h || (h !== e && !e.contains(h))) continue;
          vu.add(k); out.push({ n: (e.id ? '#' + e.id : e.className ? '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + ' « ' + e.textContent.trim().slice(0, 20) + ' »', x, y });
        }
        return out.slice(0, 8); });
      for (const q of textes) {
        await ev(() => getSelection().removeAllRanges());
        await cdp.send('Input.synthesizeTapGesture', { x: Math.round(q.x), y: Math.round(q.y), duration: 1200, tapCount: 1, gestureSourceType: 'touch' }); await dormir(400);
        T.selection.push({ cible: q.n, texte: await ev(() => String(getSelection()).slice(0, 40)) });
        await ev(() => { getSelection().removeAllRanges(); for (const d of document.querySelectorAll('dialog[open]')) d.close(); const s = document.getElementById('settings'); if (s && !s.hidden) document.getElementById('btnSettings').click(); const g = document.getElementById('gallery'); if (g && !g.hidden) g.hidden = true; if (App.state.mode !== 'walk') App.set('mode', 'walk'); });
        await dormir(300); await remettre();
      }
      await ev(id => __banc.poser(id), arrets[0]); await calme();
    }

    // 12. artefacts du palier bas : à trois arrêts intérieurs (ultra réaliste : occlusion précalculée prête)
    if (!rapide) {
      if (rendu === 'ultra') await page.waitForFunction(() => __v.AO.ready, { polling: 100, timeout: 30000 }).catch(() => R.notes.push('occlusion précalculée pas prête'));
      R.artefacts = [];
      for (const id of interieurs.slice(0, 3)) { await ev(id => __banc.poser(id), id); await calme(); await tag('artefacts'); R.artefacts.push({ id, paliers: await ev(() => __banc.artefacts()) }); await calme(); }
    }

    // 13. mémoire, palier, données brutes
    R.memoire = await ev(() => __banc.memoire());
    R.palier = await ev(() => __v.aq.lvl);
    R.sautsDetail = await ev(() => __banc.sauts);
    const brut = await ev(() => ({ loaf: __banc.loaf, tags: __banc.tags, raf: __banc.raf, draws: __banc.draws, lat: __banc.lat, pleines: __banc.pleines, portes: __banc.portes, drags: __banc.drags.map(g => ({ x0: g.x0, yaw0: g.yaw0, f: g.f, cx: g.cx, ent: g.ent, images: g.images, tUp: g.tUp })), err: __banc.err, sync: __banc.sync }));
    if (brut.err) R.erreurs.push('Sonde du banc : ' + brut.err.slice(0, 300));
    analyser(R, brut);
  } catch (e) {
    R.erreurs.push('Banc interrompu : ' + String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close().catch(() => {}); server.close();
    fs.rmSync(udd, { recursive: true, force: true });
  }
  return R;
}

/* ---------- Analyse d'une mesure ---------- */
function analyser(R, B) {
  const tagOf = i => B.tags[i] || '?';
  // intervalles rAF, par étiquette ; en mouvement : la caméra a bougé à l'un des deux tours
  const raf = {}, rafM = {}, sauts = {}, piresR = [], piresI = [], debutTag = {}; let sautPire = null;
  for (let i = 7; i < B.raf.length; i += 7) {
    const dt = B.raf[i] - B.raf[i - 7], tg = tagOf(B.raf[i + 1]); if (tg !== tagOf(B.raf[i - 6])) { debutTag[tg] = B.raf[i]; continue; }
    (raf[tg] = raf[tg] || []).push(dt);
    if (B.raf[i + 2] || B.raf[i - 5]) { (rafM[tg] = rafM[tg] || []).push(dt); if (dt > 25) piresR.push({ tag: tg, ms: r1(dt), t: Math.round(B.raf[i]), depuis: Math.round(B.raf[i - 7] - (debutTag[tg] ?? 0)), palierAvant: B.raf[i - 3], palier: B.raf[i + 4] }); }
  }
  // images rendues par le moteur : intervalles entre deux images de mouvement qui se suivent, temps processeur et GPU
  // caméra en mouvement à chaque tour rAF entre deux images : sinon l'écart n'est pas une image perdue (rien à redessiner)
  const rT = [], rM = []; for (let i = 0; i < B.raf.length; i += 7) { rT.push(B.raf[i]); rM.push(B.raf[i + 2]); }
  const bougeEntre = (a, b) => { let lo = 0, hi = rT.length; while (lo < hi) { const m = (lo + hi) >> 1; if (rT[m] <= a) lo = m + 1; else hi = m; } for (let k = lo; k < rT.length && rT[k] < b; k++) if (!rM[k]) return false; return true; };
  const img = {}, cpu = {}, gpu = {}, gpuP = {}, appels = [], tri = [];
  for (let i = 0; i < B.draws.length; i++) {
    const d = B.draws[i], tg = tagOf(d[4]); appels.push(d[5]); tri.push(d[6]);
    (cpu[tg] = cpu[tg] || []).push(d[1] - d[0]);
    if (d[9] >= 0) { (gpu[tg] = gpu[tg] || []).push(d[9]); if (!d[2]) (gpuP[tg] = gpuP[tg] || []).push(d[9]); }
    // ressaut entre deux images dessinées qui se suivent : montée ou descente au-delà de la pente de la volée sur le chemin parcouru
    // (critère du contrôle escalier de moteur/controle.mjs : pas × pente + 1 cm), indépendant de la cadence
    { const q = B.draws[i - 1]; if (q && q[4] === d[4] && d[0] - q[0] < 100) { const dh = Math.hypot(d[11] - q[11], d[12] - q[12]), dy = Math.max(0, Math.abs(d[10] - q[10]) - (R.pente || 0) * dh); (sauts[tg] = sauts[tg] || []).push(dy); if (dy > 0.005 && (!sautPire || dy > sautPire.dy)) sautPire = { tag: tg, t: Math.round(d[0]), dy: +dy.toFixed(3), y0: +q[10].toFixed(3), y1: +d[10].toFixed(3), dh: +dh.toFixed(3) }; } }
    const p = B.draws[i - 1]; if (p && d[2] && p[2] && p[4] === d[4] && d[0] - p[0] < 500 && bougeEntre(p[0], d[0])) { (img[tg] = img[tg] || []).push(d[0] - p[0]); if (d[0] - p[0] > 25) piresI.push({ tag: tg, ms: r1(d[0] - p[0]), t: Math.round(d[0]), cpuAvant: r1(p[1] - p[0]), gpuAvant: r1(p[9]), cpu: r1(d[1] - d[0]), gpu: r1(d[9]), palierAvant: p[3], palier: d[3] }); }
  }
  const cat = (o, tags) => [].concat(...tags.map(t => o[t] || []));
  const part = (a, lim) => (a.length ? +(a.filter(v => v > lim).length / a.length).toFixed(4) : null);
  const lat = n => B.lat.filter(l => l.nom === n).map(l => l.ms), pl = n => B.pleines.filter(l => l.nom === n).map(l => l.ms);
  // glisser continu : chaque image finie contre l'instant où la main demandait ce regard (saisie 1:1)
  const gl = [];
  for (const G of B.drags) {
    if (!G.ent || G.ent.length < 2) continue;
    const E = G.ent.map(([t, x]) => [t, G.yaw0 + Math.atan((x - G.cx) / G.f) - Math.atan((G.x0 - G.cx) / G.f)]).sort((a, b) => a[0] - b[0]);
    for (const [td, y] of G.images) {
      if (Math.abs(y - G.yaw0) < 1e-6) continue;
      let k = E.findIndex(e => e[1] >= y - 1e-7); if (k < 0) continue; let ti = E[k][0];
      if (k > 0 && E[k][1] > E[k - 1][1] && E[k][1] - y > 1e-7) ti = E[k - 1][0] + (y - E[k - 1][1]) / (E[k][1] - E[k - 1][1]) * (E[k][0] - E[k - 1][0]);
      if (td >= ti) gl.push(td - ti);
    }
  }
  const mv = MOUV.filter(t => t !== 'escalier' || true);
  R.mouv = { rafLong: part(cat(rafM, mv), 50), imgLong: part(cat(img, mv), 67), raf: stats(cat(rafM, mv)), img: stats(cat(img, mv)), cpu: stats(cat(cpu, mv).filter((v, i) => true)), gpu: stats(cat(gpu, mv)) };
  R.parTag = {}; for (const t of [...MOUV, 'glisser', 'guidee', 'maquette', 'demarrage', 'survol-porte', 'survol-sol', 'tactile']) R.parTag[t] = { raf: stats(rafM[t] || []), img: stats(img[t] || []), gpu: stats(gpu[t] || []) };
  R.demarrage = stats(raf.demarrage || []);
  R.guidee = stats(raf.guidee || []);
  R.maquette = { raf: stats(rafM.maquette || []), img: stats(img.maquette || []) };
  R.gpuPleine = stats(cat(gpuP, ['arret', 'guidee', 'trajet', 'clavier', 'glisser', 'clic-sol', 'escalier', 'repos']));
  R.lat = { clavier: stats(lat('clavier')), manette: stats(lat('manette')), glisser: stats(gl), clic: stats(lat('clic')), porte: stats(lat('porte')), entree: stats(lat('entree')), escalier: stats(lat('clic-escalier')) };
  R.pleine = {}; for (const n of ['trajet', 'clic', 'glisser', 'clavier', 'manette', 'survol', 'escalier']) R.pleine[n] = stats(pl('pleine-' + n));
  R.escalierSaut = +Math.max(0, ...(sauts.escalier || [0])).toFixed(3);
  R.trajetSaut = +Math.max(0, ...(sauts.trajet || [0])).toFixed(3);
  R.appels = { p50: pct(appels, 0.5), max: appels.length ? Math.max(...appels) : null }; R.triangles = { p50: pct(tri, 0.5), max: tri.length ? Math.max(...tri) : null };
  R.cadenceRepos = r1(pct(raf.repos || [], 0.5));
  // survol d'une porte : aucune image de mouvement
  R.survolBas = B.draws.filter(d => tagOf(d[4]) === 'survol-porte' && d[2]).length;
  R.survolImages = B.draws.filter(d => tagOf(d[4]) === 'survol-porte').length;
  // portes qui bougent sans clic (porte de placard ou de coffret comprise)
  const plac = new Set((R.portesInfo || []).filter(p => p.placard).map(p => p.id));
  R.portesSansClic = B.portes.map(p => Object.assign(p, { placard: plac.has(p.id) }));
  R.syncs = B.sync;
  R.sautPire = sautPire;
  // images longues du navigateur hors travail du banc et chargement : scripts responsables
  R.longues = (B.loaf || []).filter(l => !['banc', 'chargement'].includes(l.tag)).sort((a, b) => b.ms - a.ms).slice(0, 10);
  R.pires = { raf: piresR.sort((a, b) => b.ms - a.ms).slice(0, 8), img: piresI.sort((a, b) => b.ms - a.ms).slice(0, 8) };
}

/* ---------- Seuils et cas ---------- */
function verifier(R) {
  // bloquant : contrôles de fonctionnement et cas de banc qui ne dépendent pas du temps (placard, survol, artefacts, tactile), toujours ;
  // tout ce qui se chronomètre (débit, latences, retour en pleine qualité, glisser continu, ressaut d'escalier, part de l'écran qui agit)
  // en rendu simple sur les profils à seuils ; en ultra réaliste (option lourde assumée, L4-12 point 0), mêmes seuils à titre
  // indicatif. Profils sans seuil (téléphone ×6, rendu logiciel) : indicatif.
  const S = SEUILS[R.profil], T = S || COMMUN, perf = !!S && R.rendu === 'simple', out = [];
  const c = (nom, v, lim, cmp = '<=', bloquant = true) => { const ok = v == null ? null : cmp === '<=' ? v <= lim : v >= lim; out.push({ nom, v, lim, cmp, ok, bloquant }); };
  // fonctionnement (tous les profils, les deux rendus)
  c('erreurs de la page', R.erreurs.length, 0);
  if (R.escaliers) for (const e of R.escaliers) c(`escalier ${e.sens} (${e.par})`, e.ok ? 1 : 0, 1, '>=');
  if (R.clics && R.clics.essais) c('clics au sol qui font avancer (part)', R.clics.reussis / R.clics.essais, 1, '>=');
  if (R.portesClic && R.portesClic.essais) c('portes ouvertes puis fermées au clic (part)', (R.portesClic.ouvertes + R.portesClic.fermees) / (2 * R.portesClic.essais), 1, '>=');
  if (R.clicGrille) c('clic : arrivée dans un placard ou hors des pièces', R.clicGrille.reduce((a, s) => a + s.hors, 0), 0);
  // cas de banc des défauts de L1-15 (point 3) qui ne dépendent pas de la vitesse de la machine
  c('cas placard : portes qui bougent sans clic', (R.portesSansClic || []).length, 0);
  c('cas placard : portes de placard ou de coffret qui bougent sans clic', (R.portesSansClic || []).filter(p => p.placard).length, 0);
  if (!PROFILS[R.profil].doigt && R.survolFait) c('cas survol : images de mouvement pendant le survol d’une porte', R.survolBas, 0);
  if (R.artefacts && R.artefacts.length) {
    const all = [].concat(...R.artefacts.map(a => a.paliers));
    c('cas artefacts : médiane des écarts de zone, pire palier (/255)', Math.max(...all.map(p => p.mediane)), T.artefactMediane);
    c('cas artefacts : zones assombries en mouvement, pire palier (part)', Math.max(...all.map(p => p.sombre)), T.artefactSombre);
  }
  if (R.tactile) { // demande de l'utilisateur du 29/09/2026 (téléphone : zoom dans la vue, jamais de la page ; pas de sélection de texte)
    for (const v of R.tactile.vues) { c(`tactile : un pincement dans ${v.vue} zoome la vue`, v.zoome ? 1 : 0, 1, '>='); c(`tactile : échelle de la page après un pincement dans ${v.vue}`, v.pageEchelle, 1); }
    c('tactile : cibles de l’interface où un pincement zoome la page', R.tactile.interface.filter(q => q.pageEchelle > 1.001).length, 0);
    c('tactile : textes sélectionnés par un appui long', R.tactile.selection.filter(q => q.texte).length, 0);
  }
  // cas de banc liés au temps et saut d'escalier : profils à seuils, les deux rendus
  c('cas glisser : latence du glisser continu p50 (ms)', R.lat.glisser.p50, T.glisserP50, '<=', perf);
  for (const n of ['trajet', 'clic', 'glisser', 'clavier', 'manette', 'survol', 'escalier']) if (R.pleine[n] && R.pleine[n].n) c(`cas pleine qualité : après ${n}, max (ms)`, R.pleine[n].max, T.pleineMax, '<=', perf);
  if (R.escaliers && R.escaliers.length) c('escalier : ressaut par image au-delà de la pente (m)', R.escalierSaut, T.sautMax, '<=', perf);
  if (R.clicGrille && S) c('clic : part de l’écran qui agit, pire arrêt', Math.min(...R.clicGrille.map(s => s.act ?? 1)), S.clicCouverture, '>=');
  // débit et latences : bloquants en rendu simple sur les profils à seuils
  c('débit en mouvement, rAF p50 (ms)', R.mouv.raf.p50, T.rafP50, '<=', perf); c('débit en mouvement, rAF p95 (ms)', R.mouv.raf.p95, T.rafP95, '<=', perf); c('débit en mouvement, part des intervalles rAF > 50 ms', R.mouv.rafLong, T.rafLong, '<=', perf);
  c('images rendues en mouvement p95 (ms)', R.mouv.img.p95, T.imgP95, '<=', perf); c('images rendues en mouvement, part > 67 ms', R.mouv.imgLong, T.imgLong, '<=', perf);
  c('démarrage, rAF max (ms)', R.demarrage.max, T.demarrageMax, '<=', perf);
  if (!PROFILS[R.profil].doigt) { c('latence clavier p50 (ms)', R.lat.clavier.p50, T.clavierP50, '<=', perf); c('latence clavier p95 (ms)', R.lat.clavier.p95, T.clavierP95, '<=', perf); }
  c('premier mouvement après un clic p50 (ms)', R.lat.clic.p50, T.clicP50, '<=', perf);
  return out;
}

/* ---------- Affichage ---------- */
const f = (v, d = 1) => (v == null ? '–' : typeof v === 'number' ? v.toFixed(d).replace('.', ',') : String(v));
function ligne(R) {
  const n = ABREGE[R.plan] || R.plan, V = R.verifs || [], ko = V.filter(v => v.ok === false && v.bloquant).length, ind = V.filter(v => v.ok === false && !v.bloquant).length;
  if (!R.mouv) return `${n.padEnd(7)} ${R.profil.padEnd(11)} ${R.rendu.padEnd(6)} ${R.passage}  ÉCHEC : ${R.erreurs.join(' ; ')}`;
  return [n.padEnd(7), R.profil.padEnd(11), R.rendu.padEnd(6), String(R.passage),
    `${f(R.pretMs / 1000)} s`.padStart(7), `${f(R.mouv.raf.p50)}/${f(R.mouv.raf.p95)}/${f(R.mouv.raf.max, 0)}`.padStart(15), `${f(R.mouv.img.p95)}/${f(R.mouv.img.max, 0)}`.padStart(10),
    `${f(R.mouv.gpu.p50)}`.padStart(5), `${f(R.gpuPleine.p50)}`.padStart(6),
    (PROFILS[R.profil].doigt ? `m${f(R.lat.manette.p50, 0)}/${f(R.lat.manette.p95, 0)}` : `${f(R.lat.clavier.p50, 0)}/${f(R.lat.clavier.p95, 0)}`).padStart(8),
    `${f(R.lat.glisser.p50, 0)}`.padStart(4), `${f(R.lat.clic.p50, 0)}`.padStart(4), `${f(Math.max(...Object.values(R.pleine).map(s => s.max ?? 0)), 0)}`.padStart(5),
    String(R.palier).padStart(2), `${R.appels.max ?? '–'}`.padStart(5), `${f((R.triangles.max || 0) / 1000, 0)}k`.padStart(6), `${f(R.memoire && R.memoire.mo, 0)}`.padStart(5),
    (ko ? `ÉCHEC (${ko})` : 'ok') + (ind ? ` · ${ind} indicatif(s) hors seuil` : '')].join(' ');
}
const ENTETE = 'plan    profil      rendu  p  prête  rAF p50/p95/max  img p95/max gpuM gpuArr clav/man glis clic plein pl appel   tri    Mo  verdict';

/* ---------- Programme (sonde importable par un script de mise au point : rien ne se lance à l'import) ---------- */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
const racine = opt.mutation ? copieMutee(opt.mutation) : ROOT;
if (!secteur()) console.error('ATTENTION : la machine n’est pas sur secteur (pmset -g batt) : mesures non fiables.');
console.error(`Banc de fluidité : ${PLANS.length} plan(s) × ${PROFS.join(', ')} × ${RENDUS.join(', ')} × ${PASSAGES} passage(s)${opt.mutation ? ` · MUTATION « ${opt.mutation} »` : ''}${RALENTI ? ` · RALENTI ${RALENTI} ms par image` : ''} · seuils du ${DATE_SEUILS}`);
const runs = [], debut = Date.now();
console.log(ENTETE);
for (let pa = 1; pa <= PASSAGES; pa++) for (const plan of PLANS) for (const profil of PROFS) for (const rendu of RENDUS) {
  const t0 = Date.now(), R = await mesurer(plan, profil, rendu, pa, racine);
  R.duree = Math.round((Date.now() - t0) / 1000); R.verifs = R.mouv ? verifier(R) : [];
  runs.push(R); console.log(ligne(R));
  for (const v of R.verifs.filter(v => v.ok === false)) console.log(`        ${v.bloquant ? '✗' : '~'} ${v.nom} : ${typeof v.v === 'number' ? +v.v.toFixed(4) : v.v} (seuil ${v.cmp} ${v.lim}${v.bloquant ? '' : ', indicatif'})`);
  if (R.tactile) { const T = R.tactile, pz = T.interface.filter(q => q.pageEchelle > 1.001), se = T.selection.filter(q => q.texte);
    console.log(`        · tactile : ${T.vues.map(v => `${v.vue} ${v.zoome ? 'zoome' : 'ne zoome pas'}${v.pageEchelle !== 1 ? ` (page ×${v.pageEchelle})` : ''}`).join(', ')} ; page zoomée par un pincement sur ${pz.length ? pz.map(q => `${q.cible} (×${q.pageEchelle})`).join(', ') : 'rien'} ; texte sélectionné par un appui long sur ${se.length ? se.map(q => q.cible).join(', ') : 'rien'} (${T.selection.length} essais)`); }
  if (R.notes.length) console.log(`        · ${[...new Set(R.notes)].join(' ; ')}`);
  await dormir(1500);
}
// écart entre passages : même plan, profil et rendu
const ecarts = [];
if (PASSAGES > 1) {
  const cles = [['rAF p95', R => R.mouv.raf.p95], ['img p95', R => R.mouv.img.p95], ['GPU mouvement p50', R => R.mouv.gpu.p50], ['GPU arrêt p50', R => R.gpuPleine.p50], ['clavier p50', R => R.lat.clavier.p50], ['manette p50', R => R.lat.manette.p50],
    ['glisser p50', R => R.lat.glisser.p50], ['clic p50', R => R.lat.clic.p50], ['pleine trajet max', R => R.pleine.trajet.max], ['visite prête', R => R.pretMs], ['temps image arrêt', R => pct((R.arrets || []).map(a => a.pleine), 0.5)]];
  const grp = {}; for (const R of runs) if (R.mouv) (grp[`${R.plan}|${R.profil}|${R.rendu}`] = grp[`${R.plan}|${R.profil}|${R.rendu}`] || []).push(R);
  console.log('\nÉcart entre passages (passage 2 − passage 1)');
  for (const [k, L] of Object.entries(grp)) {
    if (L.length < 2) continue; const [a, b] = L, e = { cle: k };
    for (const [n, g] of cles) { const x = g(a), y = g(b); if (x == null || y == null) continue; e[n] = { a: x, b: y, d: +(y - x).toFixed(1), rel: x ? +((y - x) / x * 100).toFixed(0) : null }; }
    ecarts.push(e);
    const [pl, pr, re] = k.split('|');
    console.log(`${(ABREGE[pl] || pl).padEnd(7)} ${pr.padEnd(11)} ${re.padEnd(6)} ` + cles.map(([n]) => e[n] ? `${n} ${f(e[n].a, 0)}→${f(e[n].b, 0)}` : null).filter(Boolean).join(' · '));
  }
}
const echecs = runs.filter(R => !R.mouv).length, ko = runs.filter(R => (R.verifs || []).some(v => v.ok === false && v.bloquant)).length;
console.log(`\n${runs.length} mesure(s) en ${Math.round((Date.now() - debut) / 60000)} min : ${echecs} impossible(s), ${ko} sous un seuil bloquant ou en échec de cas.`);
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ date: new Date().toISOString(), dateSeuils: DATE_SEUILS, seuils: SEUILS, profils: PROFILS, mutation: opt.mutation || null, ralenti: RALENTI, runs, ecarts }, null, 1));
if (opt.mutation) fs.rmSync(racine, { recursive: true, force: true });
process.exit(echecs ? 2 : ko ? 1 : 0);
}
