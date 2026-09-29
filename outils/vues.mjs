// node vues.mjs port plan prefixe : maquette (vue par défaut + dessus coupée) et plan 2D.
// Plusieurs niveaux : les trois vues pour chaque niveau (niveaux du dessus retirés), <prefixe>-n<niveau>-orbit|dessus|plan.png
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(execSync('npm root -g').toString().trim() + '/noop.js');
const puppeteer = (await import(req.resolve('puppeteer'))).default;
const [port, plan, pre] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'], protocolTimeout: 600000 });
const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 750 });
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`http://localhost:${port}/plans/${plan}/?shoot=1`);
await page.waitForFunction(() => window.App && window.App.engine && window.__v, { timeout: 180000 });
await page.addStyleTag({ content: '.ui, #gallery { display:none !important }' });
const NL = await page.evaluate(() => App.D.multi ? App.D.levels.length : 0);
for (let k = 0; k < Math.max(1, NL); k++) {
  const pk = NL ? `${pre}-n${k}` : pre;
  await page.evaluate(k => { App.set('mode', 'orbit'); if (App.D.multi) { App.set('level', k); __v.defaultOrbitView(); } __v.invalidate(20); }, k);
  await new Promise(r => setTimeout(r, 9000));
  await page.screenshot({ path: `${pk}-orbit.png` });
  await page.evaluate(k => { const V = __v, b = App.D.bounds || [0, 8, 0, 8], y = App.D.multi ? V.levels[k].y : 0; const cx = (b[0] + b[1]) / 2, cz = (b[2] + b[3]) / 2; V.orbit.target.set(cx, y, cz); V.camera.position.set(cx + 0.01, y + 14, cz + 0.01); V.orbit.update(); V.invalidate(20); }, k);
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: `${pk}-dessus.png` });
  await page.evaluate(k => { App.set('mode', 'plan'); if (App.D.multi) App.set('level', k); }, k);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `${pk}-plan.png` });
}
console.log(JSON.stringify(errs.slice(0, 20)));
await browser.close();
