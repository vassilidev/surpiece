/* Export complet de plans de l'outil local, pour les réimporter ailleurs ou plus tard (outils/importer.mjs) : chaque dossier plans/<id>
   tel quel (fichier déposé, lecture de l'IA gardée, plan.json, photos, 360°, contrôles), plus export.json (liste, empreintes).
   Usage : node outils/exporter.mjs <archive.tar.gz> [id…]   (par défaut : tous les plans visibles de l'outil) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), PLANS = path.join(root, 'plans');
const [dest, ...ids] = process.argv.slice(2);
if (!dest || !/\.tar\.gz$|\.tgz$/.test(dest)) { console.error('Usage : node outils/exporter.mjs <archive.tar.gz> [id…]'); process.exit(1); }
const liste = ids.length ? ids : fs.readdirSync(PLANS).filter(d => !/^([_.]|bout-en-bout-)/.test(d) && fs.existsSync(path.join(PLANS, d, 'plan.json')));
for (const id of liste) if (!/^[A-Za-z0-9_-]+$/.test(id) || !fs.existsSync(path.join(PLANS, id, 'plan.json'))) { console.error(`plan introuvable : ${id}`); process.exit(1); }
const empreinte = d => { const s = fs.readdirSync(d).find(f => /^source\./.test(f)); return s ? crypto.createHash('sha256').update(fs.readFileSync(path.join(d, s))).digest('hex') : null; };
const man = { format: 'visite-plans/export', version: 1, date: new Date().toISOString(), plans: liste.map(id => { const P = JSON.parse(fs.readFileSync(path.join(PLANS, id, 'plan.json'), 'utf8')); return { id, titre: P.titre || id, source: empreinte(path.join(PLANS, id)) }; }) };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'export-plans-'));
fs.writeFileSync(path.join(tmp, 'export.json'), JSON.stringify(man, null, 1));
// fichiers temporaires d'écriture (.etat.json.tmp…) et .DS_Store laissés de côté
execFileSync('tar', ['-czf', path.resolve(dest), '--exclude', '.*', '-C', tmp, 'export.json', '-C', PLANS, ...liste]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`export : ${path.resolve(dest)} (${liste.length} plans : ${liste.join(', ')} ; ${(fs.statSync(dest).size / 1048576).toFixed(1)} Mo)`);
