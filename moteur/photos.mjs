/* Photos de galerie sans IA : pour chaque vue de plan.json et chaque moment, place la caméra,
   attend la lumière d'ambiance, règle l'exposition sur l'histogramme, capture en suréchantillonné.
   Usage : node moteur/photos.mjs plans/432 [ids séparés par des virgules] */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = process.argv[2] || 'plans/432', only = process.argv[3] ? process.argv[3].split(',') : null;
const W = 1600, Hh = 1000, SS = 2;
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }

// serveur statique minimal sur la racine du dépôt
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const port = server.address().port;

const plan = JSON.parse(fs.readFileSync(path.join(root, dir, 'plan.json'), 'utf8'));
const outDir = path.join(root, dir, 'photos'); fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 900000 });
const page = await browser.newPage(); await page.setViewport({ width: W, height: Hh, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('[erreur page]', e.message));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`http://localhost:${port}/${dir}/?shoot=1`);
await page.waitForFunction(() => window.App && window.App.engine, { timeout: 180000 });
await page.addStyleTag({ content: '.ui, #gallery, #lightbox, #pt { display:none !important }' });
const wait = ms => new Promise(r => setTimeout(r, ms));
await page.evaluate(ss => { App.set('ao', true); App.set('lights', 'auto'); __v.renderer.setPixelRatio(ss); dispatchEvent(new Event('resize')); }, SS);

// capture du canevas, réduite de moitié (suréchantillonnage), et luminance moyenne
const grab = (q) => page.evaluate((w, h, q) => new Promise(res => {
  __v.invalidate(3);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const src = document.getElementById('gl'), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data; let s = 0, n = 0, hi = 0;
    for (let i = 0; i < d.length; i += 4 * 37) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; s += l; n++; if (l > 0.97) hi++; }
    // détail : part des pixels où la luminance change nettement (sur une image réduite) ; écart : contraste global
    const sw = 240, sh = 150, sc = document.createElement('canvas'); sc.width = sw; sc.height = sh; const sg = sc.getContext('2d'); sg.drawImage(c, 0, 0, sw, sh);
    const e = sg.getImageData(0, 0, sw, sh).data, L = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) L[i] = (0.2126 * e[i * 4] + 0.7152 * e[i * 4 + 1] + 0.0722 * e[i * 4 + 2]) / 255;
    let det = 0, m2 = 0, mm = 0;
    for (let y = 0; y < sh - 1; y++) for (let x = 0; x < sw - 1; x++) { const k = y * sw + x, gg = Math.max(Math.abs(L[k + 1] - L[k]), Math.abs(L[k + sw] - L[k])); if (gg > 0.06) det++; }
    for (let i = 0; i < sw * sh; i++) { mm += L[i]; m2 += L[i] * L[i]; } mm /= sw * sh;
    res({ mean: s / n, clip: hi / n, detail: det / ((sw - 1) * (sh - 1)), ecart: Math.sqrt(Math.max(0, m2 / (sw * sh) - mm * mm)), url: q ? c.toDataURL('image/jpeg', q) : null });
  }));
}), W, Hh, q);

const moments = plan.moments || [{ id: 'jour', season: 'automne', hour: 14.5 }];
const rejected = new Set();
const TARGET = plan.simple ? 0.56 : 0.50;
for (const m of moments) {
  await page.evaluate(m => { App.set('season', m.season); App.set('hour', m.hour); }, m);
  for (const p of plan.photos) {
    if (only && !only.includes(p.id)) continue;
    const t0 = Date.now();
    await page.evaluate(l => App.set('lights', l), plan.simple ? 'on' : p.lights || (m.hour > 19 || m.hour < 7 ? 'auto' : 'off'));
    if (p.orbit) {
      await page.evaluate(() => { App.set('mode', 'orbit'); __v.defaultOrbitView(); __v.invalidate(6); });
      await wait(2500);
    } else {
      await page.evaluate(p => {
        if (App.state.mode !== 'walk') App.set('mode', 'walk');
        const [x, z, yaw, pitch, fov] = p.cam, w = __v.walk;
        __v.operables.forEach(o => { const op = App.D.openings[o.id], want = (p.open || []).includes(o.id) ? 1 : (p.close || []).includes(o.id) ? 0 : (op && !op.closed && op.kind === 'door' ? 1 : 0); o.target = o.t = want; o.apply(want); });
        w.anim = null; w.userFov = true; w.fov = fov; w.x = x; w.z = z; w.yaw = yaw; w.pitch = pitch;
        __v.camera.fov = fov; __v.camera.updateProjectionMatrix(); __v.setWalkCamera(); __v.queueProbes(); __v.invalidate(4);
      }, p);
      for (let i = 0; i < 80; i++) { await wait(250); if (!(await page.evaluate(() => __v.probe.queue.length))) break; }
      await page.evaluate(() => { __v.autoExp.k = __v.autoExp.target; __v.applyEnv(); });
    }
    await wait(1800);
    // exposition : on vise une luminance moyenne donnée, sans brûler plus de 3 % de l'image
    let base = await page.evaluate(() => __v.autoExp.k), k = 1, r = await grab(0);
    for (let it = 0; it < 4; it++) {
      const f = Math.pow(TARGET / Math.max(0.02, r.mean), 1.3) * (r.clip > 0.03 ? 0.85 : 1);
      if (Math.abs(f - 1) < 0.04) break;
      k = Math.min(2.4, Math.max(0.35, k * f));
      await page.evaluate((v, orbit) => { if (orbit) { App.set('exposure', Math.min(2.5, Math.max(0.4, v))); __v.invalidate(4); return; } const a = __v.autoExp; a.target = a.k = v; __v.renderer.toneMappingExposure = App.state.exposure * v; __v.invalidate(4); }, p.orbit ? k : base * k, !!p.orbit);
      await wait(700); r = await grab(0);
    }
    const shot = await grab(0.9);
    // filet de sécurité : une vue qui ne montre qu'un mur n'entre pas dans la galerie
    if (!p.orbit && shot.detail < 0.012 && shot.ecart < 0.06) { rejected.add(p.id); fs.rmSync(path.join(outDir, `${p.id}-${m.id}.jpg`), { force: true }); console.log(`${p.id}-${m.id}`, 'écartée (vue sans intérêt)'); continue; }
    fs.writeFileSync(path.join(outDir, `${p.id}-${m.id}.jpg`), Buffer.from(shot.url.split(',')[1], 'base64'));
    if (p.orbit) await page.evaluate(() => App.set('exposure', 1));
    console.log(`${p.id}-${m.id}`, `luminance ${shot.mean.toFixed(2)}`, `correction ×${k.toFixed(2)}`, `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
if (rejected.size) {  // la galerie ne présente que les vues retenues
  const pl = JSON.parse(fs.readFileSync(path.join(root, dir, 'plan.json'), 'utf8'));
  pl.photos = pl.photos.filter(p => !rejected.has(p.id));
  fs.writeFileSync(path.join(root, dir, 'plan.json'), JSON.stringify(pl, null, 1));
}
await browser.close(); server.close();
