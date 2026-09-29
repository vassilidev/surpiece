/* Test du serveur local des scripts Chrome et du filtre des secrets (moteur/chrome.mjs, L1-01), sans navigateur ni réseau.
   Dossier factice plans/_test-statique/ (retiré à la fin) ; ne lit jamais le contenu de .env : le refus est vérifié sur un leurre.
   Usage : node outils/test_statique.mjs   (code 0 : tout passe) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

process.env.OPENROUTER_API_KEY = 'leurre'; process.env.MON_SERVICE_TOKEN = 'leurre';
const { serveurStatique, envSansSecret } = await import('../moteur/chrome.mjs');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = 'plans/_test-statique', D = path.join(root, dir), L = path.join(root, 'plans', '_test-statique-leurre');
const t0 = Date.now(), echecs = [];
fs.rmSync(D, { recursive: true, force: true }); fs.rmSync(L, { recursive: true, force: true });
fs.mkdirSync(path.join(D, 'photos'), { recursive: true }); fs.mkdirSync(path.join(D, 'pano'), { recursive: true }); fs.mkdirSync(L, { recursive: true });
for (const f of ['index.html', 'plan.json', 'reponse-ia.json', 'source.pdf', 'page.png', 'calibration.png', '.etat.json.tmp', 'plan-_test-statique.png', 'photos/sejour.jpg', 'pano/index.html', 'pano/visite.json', 'pano/entree-2048.jpg', 'pano/controle.json'])
  fs.writeFileSync(path.join(D, f), 'x');
fs.writeFileSync(path.join(L, 'secret.txt'), 'leurre');
fs.symlinkSync(path.join(L, 'secret.txt'), path.join(D, 'photos', 'lien.jpg'));
fs.symlinkSync(path.join(root, '.env'), path.join(D, 'pano', 'env-2048.jpg')); // lien vers .env : refusé sans être lu

const server = await serveurStatique(root, dir), port = server.address().port;
const code = p => new Promise(ok => { http.get({ host: '127.0.0.1', port, path: p }, r => { r.resume(); ok(r.statusCode); }).on('error', () => ok(0)); });
const attend = async (p, c) => { const r = await code(p); if (r !== c) echecs.push(`${p} : ${r} au lieu de ${c}`); };
try {
  if (server.address().address !== '127.0.0.1') echecs.push(`écoute sur ${server.address().address} au lieu de 127.0.0.1`);
  for (const p of ['/.env', '/pipeline/serveur.py', '/references/432.plan.json', '/plans/d201-f14b3e4b/plan.json', `/${dir}/../../.env`, '/%2e%2e/.env', `/${dir}/%2e%2e/%2e%2e/.env`,
    `/${dir}/.etat.json.tmp`, `/${dir}/reponse-ia.json`, `/${dir}/source.pdf`, `/${dir}/page.png`, `/${dir}/calibration.png`, `/${dir}/pano/controle.json`, '/moteur/chrome.mjs',
    '/moteur/controle.mjs', `/${dir}/photos/lien.jpg`, `/${dir}/pano/env-2048.jpg`, '/plans/_test-statique-leurre/secret.txt', '/', '/moteur/', '/.git/config', '/produit/PLAN.md'])
    await attend(p, 404);
  for (const p of [`/${dir}/`, `/${dir}/index.html`, `/${dir}/plan.json`, `/${dir}/plan-_test-statique.png`, `/${dir}/photos/sejour.jpg`, `/${dir}/pano/`, `/${dir}/pano/visite.json`, `/${dir}/pano/entree-2048.jpg`,
    '/moteur/ui.js', '/moteur/engine.js', '/moteur/visite.css', '/moteur/ao.js', '/moteur/vendor/three/build/three.module.js'])
    await attend(p, 200);
  const e = envSansSecret();
  if ('OPENROUTER_API_KEY' in e || 'MON_SERVICE_TOKEN' in e || 'OPENROUTER_API_KEY' in process.env) echecs.push('une clé leurre reste dans l\'environnement');
  if (!e.PATH || !e.HOME) echecs.push('PATH ou HOME retiré de l\'environnement');
} finally {
  server.close(); fs.rmSync(D, { recursive: true, force: true }); fs.rmSync(L, { recursive: true, force: true });
}
const ms = Date.now() - t0;
if (ms > 5000) echecs.push(`test trop long : ${ms} ms`);
console.log(echecs.length ? `ÉCHEC\n- ${echecs.join('\n- ')}` : `ok : serveur limité à 127.0.0.1, 22 refus, 13 accès, secrets retirés (${ms} ms)`);
process.exit(echecs.length ? 1 : 0);
