// node trajets.mjs <plan> : pour chaque paire d'arrêts, le trajet traverse-t-il un vantail ouvert ?
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const req = createRequire(execSync('npm root -g').toString().trim() + '/noop.js');
const puppeteer = (await import(req.resolve('puppeteer'))).default;
const [plan] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport({ width: 400, height: 300 });
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`http://localhost:8780/plans/${plan}/?shoot=1`);
await page.waitForFunction(() => window.App && window.App.engine && window.__v, { timeout: 180000 });
const r = await page.evaluate(() => {
  const V = __v, D = App.D, S = D.stops, out = { paires: 0, avant: 0, apres: 0, detail: [] };
  const segD = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2)); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
  const coupe = (P, ops) => { const pts = []; for (let i = 1; i < P.length; i++) for (let t = 0; t <= 1; t += 0.05) pts.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]);
    return ops.filter(op => { const o = D.openings[op.id]; if (!o || (o.kind !== 'door' && o.kind !== 'entry') || op.target < 0.5) return false; const lf = App.doorLeaves(op.id)[0]; return pts.some(p => segD(p, lf.h, lf.op) < 0.12); }).map(op => op.id); };
  for (const a of S) for (const b of S) {
    if (a === b) continue; const P = V.findPath(a.p[0], a.p[1], b.p[0], b.p[1]); if (!P || P.length < 2) continue;
    out.paires++;
    V.operables.forEach(op => { const o = D.openings[op.id]; op.target = o && o.kind === 'door' && !o.closed ? 1 : 0; });  // état par défaut : portes ouvertes
    const av = coupe(P, V.operables); if (av.length) out.avant++;
    V.openDoorsOnPath(P); const ap = coupe(P, V.operables); if (ap.length) { out.apres++; out.detail.push(`${a.id}→${b.id} : ${ap.join(', ')}`); }
  }
  return out;
});
console.log(plan, JSON.stringify(r));
await browser.close();
