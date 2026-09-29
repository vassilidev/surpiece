/* Serveur local des scripts qui pilotent Chrome (visite de contrôle, photos, 360°) et environnement de Chrome sans secret (L1-01).
   - serveurStatique(root, dir, { entetes }) : écoute sur 127.0.0.1 seulement (port libre), ne sert que ce que la visite charge :
     dans plans/<id>/ : index.html, plan.json, plan-<id>.png (superposition), photos/*.jpg, pano/ (page, visite.json, visionneuse.js,
     panoramas, vues des niveaux) ; dans moteur/ : les .js et .css du premier niveau et three.js (moteur/vendor/**.js). Tout le reste,
     dont .env, les autres plans, le PDF et les images du promoteur, les réponses de l'IA et tout segment qui commence par un point :
     404. Chemin décodé, résolu, liens suivis, comparé par path.relative. Pas de liste de répertoire.
   - envSansSecret() : copie de l'environnement sans OPENROUTER_API_KEY, ANTHROPIC_API_KEY ni variable en *_API_KEY, *_SECRET,
     *_TOKEN ; au chargement de ce module, ces variables sont aussi retirées du processus node lui-même. À passer à puppeteer.launch. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SECRET = /^(OPENROUTER_API_KEY|ANTHROPIC_API_KEY)$|_API_KEY$|_SECRET$|_TOKEN$/i;
for (const k of Object.keys(process.env)) if (SECRET.test(k)) delete process.env[k];
export function envSansSecret() {
  const e = {}; for (const [k, v] of Object.entries(process.env)) if (!SECRET.test(k)) e[k] = v; return e;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const DIR = /^plans\/[A-Za-z0-9_-]+$/;
const PANO = /^(index\.html|visite\.json|visionneuse\.js|[a-z0-9_-]+-(?:512|2048|4096|8192)\.jpg|niveau-\d{1,2}\.png)$/;

/* chemin relatif à la racine (segments séparés par /) : servi ? */
export function servable(rel, dir) {
  const s = rel.split('/');
  if (!s.length || s.some(x => !x || x.startsWith('.'))) return false;
  if (s[0] === 'moteur') return (s.length === 2 && /\.(js|css)$/.test(s[1])) || (s.length >= 3 && s[1] === 'vendor' && s[s.length - 1].endsWith('.js'));
  const d = dir.split('/'); if (s[0] !== d[0] || s[1] !== d[1]) return false; // seulement le plan du script
  const r = s.slice(2);
  if (r.length === 1) return r[0] === 'index.html' || r[0] === 'plan.json' || r[0] === `plan-${d[1]}.png`;
  if (r.length === 2 && r[0] === 'photos') return /^[A-Za-z0-9_-]+\.jpg$/.test(r[1]);
  if (r.length === 2 && r[0] === 'pano') return PANO.test(r[1]);
  return false;
}

export function serveurStatique(root, dir, { entetes } = {}) {
  if (!DIR.test(dir || '')) { console.error(`Dossier de plan invalide : « ${dir} » (attendu : plans/<identifiant>).`); process.exit(1); }
  const racine = fs.realpathSync(root);
  const non = r => { r.writeHead(404); r.end(); };
  return new Promise(ok => {
    const server = http.createServer((q, r) => {
      let p; try { p = decodeURIComponent(new URL(q.url, 'http://x').pathname); } catch { r.writeHead(400); r.end(); return; }
      if (p.endsWith('/')) p += 'index.html';
      let f; try { f = fs.realpathSync(path.resolve(racine, '.' + p)); } catch { return non(r); }
      const rel = path.relative(racine, f);
      if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || !servable(rel.split(path.sep).join('/'), dir)) return non(r);
      let st; try { st = fs.statSync(f); } catch { return non(r); } if (!st.isFile()) return non(r);
      const h = Object.assign({ 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }, entetes ? entetes(p) : {});
      r.writeHead(200, h); fs.createReadStream(f).pipe(r);
    });
    server.listen(0, '127.0.0.1', () => ok(server));
  });
}
