/* Vue du dessus d'un logement, murs coupés à 1,20 m, cadrée sur un rectangle en mètres du repère du plan, pour l'animation du site
   (outils/site_demo.py). La caméra est placée à la verticale avec un champ de 2° : la vue est quasi orthogonale et se superpose au
   plan du promoteur recalé dans le même rectangle.
   Usage : node outils/site_rendu.mjs <racine> <plans/id> <sortie.png> <x0> <x1> <z0> <z1> [largeur px, défaut 900]
   <racine> contient moteur/ et plans/ (copie publiée ou dépôt). Chrome est lancé sans secret, fichiers servis en liste blanche. */
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { serveurStatique, envSansSecret } from '../moteur/chrome.mjs';

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }

const [root, dir, out, ...n] = process.argv.slice(2);
const [x0, x1, z0, z1] = n.slice(0, 4).map(Number), w = Number(n[4] || 900), h = Math.round(w * (z1 - z0) / (x1 - x0));
if (!root || !dir || !out || [x0, x1, z0, z1].some(Number.isNaN)) { console.error('Usage : node outils/site_rendu.mjs <racine> <plans/id> <sortie.png> <x0> <x1> <z0> <z1> [largeur]'); process.exit(1); }

const server = await serveurStatique(root, dir);
const b = await puppeteer.launch({ headless: 'new', env: envSansSecret(), args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(`http://127.0.0.1:${server.address().port}/${dir}/index.html`, { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => window.App && window.__v, { timeout: 30000 });
  await p.evaluate(async (x0, x1, z0, z1) => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    App.leaveGallery && App.leaveGallery(); await wait(1500);
    App.set('rendu', 'ultra'); App.set('cut', true); App.set('dims', false); App.set('underlay', false); await wait(2500);
    const v = __v, c = v.camera, cv = v.renderer.domElement;
    document.querySelectorAll('body *').forEach(e => { if (e !== cv && !e.contains(cv)) e.style.visibility = 'hidden'; });
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, f = 2, D = (z1 - z0) / (2 * Math.tan(f * Math.PI / 360));
    const cache = () => { for (const k of ['ctx', 'shadowRoof', 'ceil', 'lamps', 'orbitGround']) if (v.G[k]) v.G[k].visible = false; v.scene.fog = null; v.scene.background = new v.THREE.Color(0xEDEFEA); };
    const pose = () => { c.fov = f; c.near = D - 60; c.far = D + 60; c.up.set(0, 0, -1); c.position.set(cx, D, cz); c.lookAt(cx, 0, cz); c.updateProjectionMatrix(); v.orbit.target.set(cx, 0, cz); };
    v.orbit.enabled = false; pose(); v.orbit.update = () => { pose(); return false; };
    const r = v.renderer.render.bind(v.renderer); v.renderer.render = (s, k) => { cache(); return r(s, k); };
    v.invalidate(); await wait(3500); v.invalidate(); await wait(800);
  }, x0, x1, z0, z1);
  await p.screenshot({ path: out });
  if (errs.length) console.error(errs.join('\n'));
} finally { await b.close(); server.close(); }
