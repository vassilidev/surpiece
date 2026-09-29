/* Test de bout en bout par le site (L4-19) : pour chaque plan de référence, dépôt de son fichier d'origine sur la page d'accueil, suivi de
   l'avancement jusqu'au bout, visite ouverte, bouton 360° et retour, photos de la galerie, comme un utilisateur (Chrome, clics).
   Sans appel payant : un second serveur (port 8791) tourne sans clé, avec PLAN_REJEU=1 (la lecture gardée du plan déposé avec le même
   fichier est reprise, pipeline/serveur.py rejouer_lecture). Le plan obtenu doit être celui de la référence (murs, pièces, ouvertures,
   équipements, arrêts). Chaque dossier créé est supprimé à la fin.
   Échec au moindre écran d'erreur, étape bloquée, erreur de page, plan différent, visite, 360° ou photo absents.
   Usage : node outils/bout_en_bout.mjs [id…]   (par défaut les 5 plans de référence ; code 0 : tout passe) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REFS = process.argv.slice(2).length ? process.argv.slice(2) : ['d201-f14b3e4b', 't2-432-21258e6e', '3081-613-ef700f1f', 'plans-du-lot-3124-6e1a90c9', 'plan-du-lot-c02f7fc8'];
const PORT = +(process.env.PORT_TEST || 8791), BASE = `http://localhost:${PORT}`, DUREE_MAX = 45 * 60e3;
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }
const wait = ms => new Promise(r => setTimeout(r, ms));

// serveur de test : sans clé (aucun appel payant possible), lecture rejouée
const env = { ...process.env, PORT: String(PORT), OPENROUTER_API_KEY: '', ANTHROPIC_API_KEY: '', PLAN_PROVIDER: '', PLAN_REJEU: '1', PLAN_DOUBLONS: '1' };
const srv = spawn('python3', ['-W', 'ignore', path.join(root, 'pipeline', 'serveur.py')], { env, cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let journal = ''; srv.stdout.on('data', d => { journal += d; }); srv.stderr.on('data', d => { journal += d; });
const arret = () => { try { srv.kill(); } catch (e) {} };
process.on('exit', arret);
for (let i = 0; i < 40; i++) { try { const r = await fetch(BASE + '/api/plans'); if (r.ok) break; } catch (e) {} await wait(250); }

const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const bilan = [], crees = [];
const cle = P => JSON.stringify({ walls: P.walls, rooms: (P.rooms || []).map(r => ({ ...r, name: undefined })), openings: P.openings, fixtures: P.fixtures, stops: (P.stops || []).map(s => ({ id: s.id, p: s.p, level: s.level })), levels: P.levels });
try {
  for (const ref of REFS) {
    const t0 = Date.now(), echecs = [], D = path.join(root, 'plans', ref);
    const src = fs.readdirSync(D).find(f => /^source\./.test(f));
    if (!src) { bilan.push({ ref, ok: false, echecs: ['pas de fichier d’origine gardé (source.*)'] }); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bout-en-bout-')), fichier = path.join(tmp, `bout-en-bout-${ref}${path.extname(src)}`);
    fs.copyFileSync(path.join(D, src), fichier);
    const pg = await browser.newPage(); await pg.setViewport({ width: 1280, height: 860 });
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    let id = null;
    try {
      await pg.goto(BASE + '/'); await pg.waitForSelector('#file');
      await (await pg.$('#file')).uploadFile(fichier);
      // identifiant du plan suivi par la page (variable cur de pipeline/accueil.html), ou message de refus
      await pg.waitForFunction(() => (typeof cur !== 'undefined' && cur) || /refus/.test(document.querySelector('#msg').className), { timeout: 60000 });
      id = await pg.evaluate(() => (typeof cur !== 'undefined' && cur) || null); if (id) crees.push(id);
      if (!id) throw new Error(`dépôt refusé : ${await pg.evaluate(() => document.querySelector('#msg').textContent)}`);
      // avancement : jusqu'au bout, sans erreur ni attente
      let fin = null, derniere = '';
      while (Date.now() - t0 < DUREE_MAX) {
        await wait(2000);
        const e = await pg.evaluate(() => ({ msg: document.querySelector('#msg').className + ' ' + document.querySelector('#msg').textContent, detail: document.querySelector('#detail').hidden ? '' : document.querySelector('#detail').textContent,
          fini: !document.querySelector('#result').hidden, calib: !document.querySelector('#calib').hidden, etapes: [...document.querySelectorAll('#steps li')].map(li => li.className + ':' + li.textContent.trim().slice(0, 40)).join(' | ') }));
        derniere = e.etapes;
        if (/refus|erreur/.test(e.msg)) { fin = `arrêt : ${e.msg.trim()} ${e.detail}`; break; }
        if (e.calib) { fin = 'échelle demandée alors que le fichier est un PDF vectoriel'; break; }
        if (e.fini) { fin = 'ok'; break; }
      }
      if (fin !== 'ok') throw new Error(fin || `bloqué après ${Math.round(DUREE_MAX / 60e3)} min (${derniere})`);
      const tFin = Math.round((Date.now() - t0) / 1000);
      // plan obtenu = plan de référence
      const P = JSON.parse(fs.readFileSync(path.join(root, 'plans', id, 'plan.json'), 'utf8')), R = JSON.parse(fs.readFileSync(path.join(D, 'plan.json'), 'utf8'));
      if (cle(P) !== cle(R)) echecs.push('plan obtenu différent du plan de référence (murs, pièces, ouvertures, équipements, arrêts ou niveaux)');
      // visite
      await Promise.all([pg.waitForNavigation({ waitUntil: 'load' }), pg.click('#open')]);
      await pg.waitForFunction(() => window.App && App.engine, { timeout: 180000 });
      await pg.evaluate(() => { document.getElementById('gallery').hidden = true; App.set('mode', 'walk'); }); await wait(800);
      // photos de la galerie : toutes chargées
      const photos = await pg.evaluate(async () => { const L = (App.D.photos || []).filter(p => !p.orbit).map(p => `photos/${encodeURIComponent(p.id)}-jour.jpg`); const ok = await Promise.all(L.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = u; }))); return { n: L.length, ko: L.filter((u, k) => !ok[k]) }; });
      if (!photos.n) echecs.push('aucune photo dans la galerie'); if (photos.ko.length) echecs.push(`photos absentes : ${photos.ko.join(', ')}`);
      // 360° et retour
      const b360 = await pg.$('#btn360'), vis = b360 && await pg.evaluate(b => !b.hidden, b360);
      if (!vis) echecs.push('bouton 360° absent de la visite');
      else {
        await Promise.all([pg.waitForNavigation({ waitUntil: 'load' }), pg.click('#btn360')]);
        await pg.waitForFunction(() => document.querySelector('canvas') && !/erreur/i.test(document.body.innerText.slice(0, 200)), { timeout: 60000 });
        await wait(1500);
        const retour = await pg.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find(x => /Visite 3D/.test(x.textContent)); return !!b; });
        if (!retour) echecs.push('360° : bouton « Visite 3D » absent');
        else {
          await Promise.all([pg.waitForNavigation({ waitUntil: 'load' }), pg.evaluate(() => [...document.querySelectorAll('button, a')].find(x => /Visite 3D/.test(x.textContent)).click())]);
          await pg.waitForFunction(() => window.App && App.engine, { timeout: 180000 });
          if (await pg.evaluate(() => App.state.mode) !== 'walk') echecs.push('retour du 360° : la visite ne reprend pas en marche');
        }
      }
      if (errs.length) echecs.push(`erreurs de page : ${errs.slice(0, 3).join(' | ')}`);
      bilan.push({ ref, id, ok: !echecs.length, secondes: tFin, photos: photos.n, echecs });
    } catch (e) { bilan.push({ ref, id, ok: false, echecs: [e.message, ...echecs, ...(errs.length ? [`erreurs de page : ${errs.slice(0, 3).join(' | ')}`] : [])] }); }
    await pg.close(); fs.rmSync(tmp, { recursive: true, force: true });
    const b = bilan[bilan.length - 1]; console.log(`${b.ok ? 'ok ' : 'ÉCHEC'} ${ref}${b.secondes ? ` (${b.secondes} s, ${b.photos} photos)` : ''}${b.echecs.length ? ' : ' + b.echecs.join(' ; ') : ''}`);
  }
} finally {
  await browser.close(); arret();
  // serveur arrêté d'abord (une étape en cours écrirait encore dans le dossier), puis toutes les copies du test supprimées
  await new Promise(r => { if (srv.exitCode !== null) return r(); srv.once('exit', r); setTimeout(r, 5000); }); await wait(500);
  for (const d of fs.readdirSync(path.join(root, 'plans'))) if (/^bout-en-bout-/.test(d)) fs.rmSync(path.join(root, 'plans', d), { recursive: true, force: true });
}
const ok = bilan.length === REFS.length && bilan.every(b => b.ok);
if (!ok && /Traceback/.test(journal)) console.log('journal du serveur :\n' + journal.split('\n').slice(-25).join('\n'));
console.log(ok ? `bout en bout : ${REFS.length}/${REFS.length} plans` : `bout en bout : ÉCHEC (${bilan.filter(b => b.ok).length}/${REFS.length})`);
process.exit(ok ? 0 : 1);
