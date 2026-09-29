/* Import de plans dans l'outil local, depuis :
   - une archive faite par outils/exporter.mjs (.tar.gz) ;
   - une copie partagée faite par outils/publier.mjs : son dossier, ou son adresse en ligne (https://…/, lue par plans.json) ;
   - un dossier de plans (plans/<id>/ avec plan.json).
   Chaque plan retrouve son dossier plans/<id> complet (fichier déposé, lecture gardée, plan.json, photos, 360°, contrôles) et marche
   comme les autres : visite, 360°, mode admin, et réassemblage sans IA (outils/finalise.sh). La page de visite est reprise du moteur
   actuel. Un plan par fichier : un plan dont le fichier déposé est déjà là (même empreinte) ou dont l'identifiant existe n'est pas
   importé, sauf avec --remplacer (il remplace alors le plan local de même identifiant).
   Usage : node outils/importer.mjs <archive | dossier | adresse> [--remplacer] [--vers <dossier des plans>] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2), remplacer = args.includes('--remplacer'), iv = args.indexOf('--vers');
const PLANS = iv >= 0 ? path.resolve(args[iv + 1]) : path.join(root, 'plans');
const src = args.find((a, i) => !a.startsWith('--') && !(iv >= 0 && i === iv + 1));
if (!src) { console.error('Usage : node outils/importer.mjs <archive.tar.gz | dossier | https://…> [--remplacer] [--vers <dossier des plans>]'); process.exit(1); }
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/, SUR = /^[A-Za-z0-9._-]+$/; // identifiants et noms de fichiers acceptés (pas de .., pas de chemin absolu)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'import-plans-'));
const copie = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };

// copie partagée (publier.mjs) → dossiers au format local : admin/<f> → <f>, admin/pano/controle.json → pano/controle.json
function depuisPartage(lire, man) {
  const dirs = [];
  return (async () => {
    for (const p of man.plans || []) {
      if (!ID.test(p.id)) { console.error(`plan ignoré (identifiant refusé) : ${p.id}`); continue; }
      const D = path.join(tmp, 'plans', p.id);
      for (const f of p.fichiers || []) {
        const s = f.split('/'); if (!s.every(x => SUR.test(x) && x !== '..' && x !== '.')) continue;
        if (f === 'index.html' || f === 'admin/fichiers.json') continue;
        const cible = s[0] === 'admin' ? s.slice(1).join('/') : f;
        const b = await lire(`plans/${p.id}/${f}`); if (b == null) { console.error(`  fichier absent : ${p.id}/${f}`); continue; }
        fs.mkdirSync(path.dirname(path.join(D, cible)), { recursive: true }); fs.writeFileSync(path.join(D, cible), b);
      }
      dirs.push(D);
    }
    return dirs;
  })();
}

let dirs = [];
if (/^https?:\/\//.test(src)) {
  const base = src.replace(/\/?$/, '/'), r = await fetch(base + 'plans.json');
  if (!r.ok) { console.error(`${base}plans.json introuvable (${r.status}) : est-ce une copie faite par outils/publier.mjs ?`); process.exit(1); }
  dirs = await depuisPartage(async f => { const q = await fetch(base + f.split('/').map(encodeURIComponent).join('/')); return q.ok ? Buffer.from(await q.arrayBuffer()) : null; }, await r.json());
} else if (/\.(tar\.gz|tgz)$/.test(src) && fs.existsSync(src)) {
  // archive : membres vérifiés avant extraction (ni chemin absolu, ni .., ni lien)
  const noms = execFileSync('tar', ['-tzf', src]).toString().trim().split('\n'), types = execFileSync('tar', ['-tzvf', src]).toString().trim().split('\n');
  if (types.some(m => /^[lh]/.test(m))) { console.error('archive refusée : elle contient un lien'); process.exit(1); }
  for (const nom of noms) if (nom.startsWith('/') || nom.split('/').includes('..')) { console.error(`archive refusée : membre « ${nom} »`); process.exit(1); }
  execFileSync('tar', ['-xzf', src, '-C', tmp]);
  dirs = fs.readdirSync(tmp).filter(d => ID.test(d) && fs.statSync(path.join(tmp, d)).isDirectory()).map(d => path.join(tmp, d));
} else if (fs.existsSync(src) && fs.statSync(src).isDirectory()) {
  if (fs.existsSync(path.join(src, 'plans.json'))) dirs = await depuisPartage(async f => { const a = path.join(src, f); return fs.existsSync(a) ? fs.readFileSync(a) : null; }, JSON.parse(fs.readFileSync(path.join(src, 'plans.json'), 'utf8')));
  else { const base = fs.existsSync(path.join(src, 'plan.json')) ? [src] : fs.readdirSync(src).map(d => path.join(src, d)).filter(d => ID.test(path.basename(d)) && fs.existsSync(path.join(d, 'plan.json'))); dirs = base; }
} else { console.error(`Source introuvable : ${src}`); process.exit(1); }

const empreinte = d => { const s = fs.existsSync(d) && fs.readdirSync(d).find(f => /^source\./.test(f)); return s ? crypto.createHash('sha256').update(fs.readFileSync(path.join(d, s))).digest('hex') : null; };
fs.mkdirSync(PLANS, { recursive: true });
const locaux = () => fs.readdirSync(PLANS).filter(d => !/^[_.]/.test(d) && fs.statSync(path.join(PLANS, d)).isDirectory());
let n = 0;
for (const D of dirs) {
  const id = path.basename(D);
  let P; try { P = JSON.parse(fs.readFileSync(path.join(D, 'plan.json'), 'utf8')); if (!Array.isArray(P.rooms) || !P.rooms.length) throw new Error('sans pièces'); }
  catch (e) { console.error(`${id} : ignoré, plan.json illisible (${e.message})`); continue; }
  const h = empreinte(D), meme = h && locaux().find(l => l !== id && empreinte(path.join(PLANS, l)) === h);
  if (meme) { console.log(`${id} : déjà présent sous ${meme} (même fichier déposé), non importé`); continue; }
  const O = path.join(PLANS, id);
  if (fs.existsSync(O) && !remplacer) { console.log(`${id} : existe déjà, non importé (option « remplacer » pour l'écraser)`); continue; }
  fs.rmSync(O, { recursive: true, force: true });
  const tout = (a, b) => { for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.name.startsWith('.')) continue; const x = path.join(a, e.name), y = path.join(b, e.name); if (e.isDirectory()) tout(x, y); else if (e.isFile()) copie(x, y); } };
  tout(D, O);
  copie(path.join(root, 'moteur', 'modele.html'), path.join(O, 'index.html')); // page de visite du moteur actuel
  if (!fs.existsSync(path.join(O, 'etat.json'))) fs.writeFileSync(path.join(O, 'etat.json'), JSON.stringify({ statut: 'fini', etape: 'fini', pct: 100, lien: `/plans/${id}/` }));
  n++; console.log(`${id} : importé (${P.titre || ''})`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`import : ${n} plan(s) ajouté(s) dans ${PLANS}`);
