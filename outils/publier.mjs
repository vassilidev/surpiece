/* Copie statique à partager (GitHub Pages ou tout hébergement de fichiers), sans Python, sans dépôt de plan ni mode admin.
   Usage : node outils/publier.mjs <dossier de sortie> [id…]   (par défaut : tous les plans finis qui ont photos et 360°)
   Contenu : moteur de visite (moteur/*.js et .css, three.js embarqué, mode admin compris), et pour chaque plan sa visite (index.html,
   plan.json), ses photos, son 360° et, pour le mode admin (décision du 29/09/2026 : « je dois toujours voir les fichiers et le moteur
   eau etc. en prod pour l'instant »), ses fichiers dans admin/ (fichier déposé, page et plan du promoteur, lecture de l'IA, contrôles),
   listés dans admin/fichiers.json ; une page d'accueil qui liste les plans. Jamais copiés : .env, scripts Python et node.
   Le dossier de sortie est vidé puis refait (hors .git). */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [dest, ...ids] = process.argv.slice(2);
if (!dest) { console.error('Usage : node outils/publier.mjs <dossier de sortie> [id…]'); process.exit(1); }
const out = path.resolve(dest);
if (out === root || out.startsWith(root + path.sep)) { console.error('Le dossier de sortie doit être hors du dépôt visite-plans.'); process.exit(1); }
const PLANS = path.join(root, 'plans');
const liste = ids.length ? ids : fs.readdirSync(PLANS).filter(d => !/^([_.]|bout-en-bout-)/.test(d) && fs.existsSync(path.join(PLANS, d, 'plan.json')) && fs.existsSync(path.join(PLANS, d, 'photos')) && fs.existsSync(path.join(PLANS, d, 'pano', 'visite.json')));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// sortie vidée (sauf .git : le dossier peut être un clone du dépôt de partage)
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f !== '.git') fs.rmSync(path.join(out, f), { recursive: true, force: true });
const copie = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };

// moteur : premier niveau (.js sauf admin, .css) et three.js embarqué
const M = path.join(root, 'moteur');
for (const f of fs.readdirSync(M)) if (/\.(js|css)$/.test(f)) copie(path.join(M, f), path.join(out, 'moteur', f));
const vendor = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) vendor(p); else if (/\.js$|^LICENSE$/.test(e.name)) copie(p, path.join(out, path.relative(root, p))); } };
vendor(path.join(M, 'vendor'));

// plans
const cartes = [];
const parDate = () => cartes.sort((a, b) => b.date - a.date);
for (const id of liste) {
  const D = path.join(PLANS, id), O = path.join(out, 'plans', id);
  if (!/^[A-Za-z0-9_-]+$/.test(id) || !fs.existsSync(path.join(D, 'plan.json'))) { console.error(`plan ignoré : ${id} (introuvable)`); continue; }
  copie(path.join(M, 'modele.html'), path.join(O, 'index.html'));
  copie(path.join(D, 'plan.json'), path.join(O, 'plan.json'));
  const photos = fs.existsSync(path.join(D, 'photos')) ? fs.readdirSync(path.join(D, 'photos')).filter(f => /^[A-Za-z0-9_-]+\.jpg$/.test(f)) : [];
  for (const f of photos) copie(path.join(D, 'photos', f), path.join(O, 'photos', f));
  const pano = fs.existsSync(path.join(D, 'pano')) ? fs.readdirSync(path.join(D, 'pano')).filter(f => /^(index\.html|visite\.json|visionneuse\.js|[a-z0-9_-]+-(?:512|2048|4096|8192)\.jpg|niveau-\d{1,2}\.png)$/.test(f)) : [];
  for (const f of pano) copie(path.join(D, 'pano', f), path.join(O, 'pano', f));
  // fichiers du mode admin (mêmes règles que /api/admin/<id>, pipeline/serveur.py)
  const ADM = /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.(?:json|txt|png|jpg|jpeg|webp|pdf)$/, adm = [];
  for (const f of [...fs.readdirSync(D), 'pano/controle.json']) { const a = path.join(D, f); if (fs.existsSync(a) && fs.statSync(a).isFile() && ADM.test(path.basename(f))) { copie(a, path.join(O, 'admin', f)); const st = fs.statSync(a); adm.push({ nom: f, taille: st.size, date: Math.floor(st.mtimeMs / 1000) }); } }
  fs.writeFileSync(path.join(O, 'admin', 'fichiers.json'), JSON.stringify(adm));
  const P = JSON.parse(fs.readFileSync(path.join(D, 'plan.json'), 'utf8'));
  const ordre = (P.photos || []).filter(p => !p.orbit).map(p => p.id), vignette = ordre.map(i => `${i}-jour.jpg`).find(f => photos.includes(f)) || photos[0];
  cartes.push({ id, titre: P.titre || (P.cartouche || {}).l1 || id, photo: vignette ? `plans/${id}/photos/${vignette}` : null, pano: pano.includes('visite.json'), date: Math.floor(fs.statSync(D).mtimeMs / 1000) });
  console.log(`${id} : visite, ${photos.length} photos, ${pano.filter(f => f.endsWith('.jpg')).length} images 360°, ${adm.length} fichiers d'admin`);
}

parDate(); // plus récent d'abord, comme dans l'outil local
// accueil : la page des plans de l'outil local (pipeline/accueil.html), en lecture seule ici (pas de serveur : dépôt désactivé, liste
// lue dans plans.json, documents dans plans/<id>/admin/)
copie(path.join(root, 'pipeline', 'accueil.html'), path.join(out, 'index.html'));
// liste des plans et de leurs fichiers : la copie se réimporte dans l'outil local (outils/importer.mjs <adresse ou dossier>)
const fichiersDe = d => { const L = []; const t = (x, r) => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { const q = path.join(x, e.name), rr = r ? `${r}/${e.name}` : e.name; if (e.isDirectory()) t(q, rr); else L.push(rr); } }; t(d, ''); return L.sort(); };
fs.writeFileSync(path.join(out, 'plans.json'), JSON.stringify({ format: 'visite-plans/partage', version: 1, date: new Date().toISOString(), plans: cartes.map(c => ({ ...c, fichiers: fichiersDe(path.join(out, 'plans', c.id)) })) }));
fs.writeFileSync(path.join(out, 'README.md'), '# Sur Pièce (nom provisoire)\n\nCopie partagée des visites 3D générées par l’outil local (`outils/publier.mjs` du projet visite-plans). Site statique : visite, maquette, plan 2D, 360° et mode admin, sans dépôt de plan.\n\nRefaite à chaque publication : ne pas modifier à la main.\n');
fs.writeFileSync(path.join(out, '.nojekyll'), ''); // GitHub Pages : servir les fichiers tels quels
fs.writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
// vérification : aucun fichier interdit dans la copie
const interdits = [];
const tour = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === '.git') continue; const p = path.join(d, e.name); if (e.isDirectory()) tour(p); else if (/^(\.env.*|.*\.(py|mjs|sh))$/.test(e.name) || (/\.pdf$/.test(e.name) && !/[\\/]admin[\\/]/.test(p))) interdits.push(path.relative(out, p)); } };
tour(out);
if (interdits.length) { console.error('Fichiers interdits dans la copie :', interdits.join(', ')); process.exit(1); }
let n = 0, o = 0; const somme = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === '.git') continue; const p = path.join(d, e.name); if (e.isDirectory()) somme(p); else { n++; o += fs.statSync(p).size; } } }; somme(out);
console.log(`copie prête : ${out} (${cartes.length} plans, ${n} fichiers, ${(o / 1048576).toFixed(1)} Mo)`);
