// node marche.mjs <plan> <sortie-prefixe> : une capture à hauteur d'œil par pièce, 4 directions, depuis un point libre de chaque pièce
// (serveur : http://localhost:8780). Écrit <prefixe>-<piece>-<n|e|s|o>.png et affiche les erreurs de la page.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(execSync('npm root -g').toString().trim() + '/noop.js');
const puppeteer = (await import(req.resolve('puppeteer'))).default;
const [plan, pre] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 900000 });
const page = await browser.newPage(); await page.setViewport({ width: 800, height: 540 });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`http://localhost:8780/plans/${plan}/?shoot=1`);
await page.waitForFunction(() => window.App && window.App.engine && window.__v, { timeout: 180000 });
await page.addStyleTag({ content: '.ui, #gallery { display:none !important }' });
const rooms = await page.evaluate(() => {
  const V = __v, G = App.geo; App.set('mode', 'walk'); V.operables.forEach(o => { o.target = o.t = 1; o.apply(1); });
  return App.D.rooms.filter(r => !r.hidden && !r.of).map(r => {
    const c = G.centroid(r.poly); let p = null;
    for (let rad = 0; rad <= 2 && !p; rad += 0.1) for (let a = 0; a < 16 && !p; a++) { const x = c[0] + Math.cos(a / 16 * 6.283) * rad, z = c[1] + Math.sin(a / 16 * 6.283) * rad; if (G.pointInPoly(x, z, r.poly)) { const [cx, cz] = V.collide(x, z, 0.25); if (Math.hypot(cx - x, cz - z) < 0.01) p = [x, z]; } }
    return { id: r.id, p: p || c };
  });
});
for (const r of rooms) for (const [k, yaw] of [['n', 0], ['o', Math.PI / 2], ['s', Math.PI], ['e', -Math.PI / 2]]) {
  await page.evaluate((x, z, yaw) => { const V = __v; V.walk.x = x; V.walk.z = z; V.walk.yaw = yaw; V.walk.pitch = -0.05; V.setWalkCamera(); V.queueProbes(); V.invalidate(30); }, r.p[0], r.p[1], yaw);
  await new Promise(res => setTimeout(res, 3500));
  await page.screenshot({ path: `${pre}-${r.id}-${k}.png` });
}
console.log(JSON.stringify({ pieces: rooms, erreurs: errs }));
await browser.close();
