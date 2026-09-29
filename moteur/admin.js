/* Mode admin de la visite (outil local, L4-19 ; retours du 29/09/2026 : « on prépare l'interface admin, pas l'interface finale ; toutes les
   features doivent être dispo pour que je puisse déboguer », « afficher le plan 2D original et le fichier JSON généré »).
   Bouton « Admin » à côté des Réglages : bandeau de débogage (i/s, temps d'image, palier, dessin, mémoire ; aussi ?debug=1), vues rayons
   X et eau (moteur/engine.js), plan déposé à côté du plan 2D, verdict des contrôles, tous les fichiers du plan lisibles dans la page
   (plan.json, lecture de l'IA, relecture, rapport, contrôles, images de lecture). Les fichiers viennent de /api/admin/<id>
   (pipeline/serveur.py, local seulement) ; ailleurs (serveur des rendus), la section dit qu'ils ne sont pas disponibles. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const taille = n => n < 1024 ? `${n} o` : n < 1048576 ? `${(n / 1024).toFixed(0)} Ko` : `${(n / 1048576).toFixed(1).replace('.', ',')} Mo`;
const nb = n => n == null ? '–' : n >= 1e6 ? `${(n / 1e6).toFixed(2).replace('.', ',')} M` : n >= 1e4 ? `${Math.round(n / 1e3)} k` : String(n);
// rôle de chaque fichier du dossier d'un plan (ordre d'affichage)
const ROLES = [
  [/^source\.pdf$/, 'Plan déposé (PDF d’origine)'], [/^source\.(png|jpe?g|webp)$/, 'Plan déposé (image d’origine)'], [/^page\.png$/, 'Page déposée (image)'], [/^plan-src\.png$/, 'Plan recadré, lu par l’IA'],
  [/^calibration\.png$/, 'Image de calibration (échelle)'], [/^plan-.+\.png$/, 'Plan superposable au plan 2D'],
  [/^plan\.json$/, 'Plan généré (moteur de visite)'], [/^extract\.json$/, 'Analyse du fichier, sans IA'], [/^reponse-ia\.json$/, 'Lecture de l’IA (gardée, rejouable)'],
  [/^relecture-ia\.json$/, 'Relecture de l’IA'], [/^reponse-brute.*\.txt$/, 'Réponse brute de l’IA'], [/^appels-ia\.json$/, 'Appels à l’IA (durées, coûts)'],
  [/^rapport\.json$/, 'Rapport d’assemblage'], [/^controle\.json$/, 'Visite de contrôle'], [/^pano\/controle\.json$/, 'Contrôle du 360°'], [/^etat\.json$/, 'Avancement'],
  [/^relecture\.png$/, 'Image de relecture'], [/^zoom-.+\.png$/, 'Zoom de relecture'], [/^duel-.+\.png$/, 'Arbitrage (image posée à l’IA)'],
];
// JSON lisible : objets en retrait, petits tableaux (coordonnées, listes courtes) sur une ligne
const joli = (v, ind = '') => {
  if (Array.isArray(v)) {
    if (v.every(x => x === null || typeof x !== 'object' || (Array.isArray(x) && x.every(y => y === null || typeof y !== 'object')))) { const t = JSON.stringify(v); if (t.length <= 110) return t; }
    const i2 = ind + '  '; return v.length ? '[\n' + v.map(x => i2 + joli(x, i2)).join(',\n') + '\n' + ind + ']' : '[]';
  }
  if (v && typeof v === 'object') { const i2 = ind + '  ', k = Object.keys(v); return k.length ? '{\n' + k.map(x => i2 + JSON.stringify(x) + ': ' + joli(v[x], i2)).join(',\n') + '\n' + ind + '}' : '{}'; }
  return JSON.stringify(v);
};
const role = n => { for (const [re, t] of ROLES) if (re.test(n)) return t; return ''; };
const rang = n => { const i = ROLES.findIndex(([re]) => re.test(n)); return i < 0 ? 99 : i; };

export function initAdmin(App, D) {
  const S = App.state, pid = (location.pathname.match(/\/plans\/([^/]+)\//) || [])[1] || '';
  // fichiers : outil local (/api/admin/<id>), sinon copie partagée (admin/fichiers.json et admin/<fichier>, outils/publier.mjs)
  let api = pid ? `/api/admin/${encodeURIComponent(pid)}` : null, statique = false;
  const url = n => `${statique ? 'admin' : api}/${n.split('/').map(encodeURIComponent).join('/')}`;
  const app = $('#app'), top = $('.topbar'), btnSet = $('#btnSettings'), settings = $('#settings');
  // bouton, panneau, visionneuse, bandeau, plan déposé à côté du plan 2D
  const btn = document.createElement('button'); btn.id = 'btnAdmin'; btn.className = 'btn'; btn.textContent = 'Admin'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'admin');
  top.insertBefore(btn, btnSet);
  app.insertAdjacentHTML('beforeend', `
  <aside id="admin" class="panel ui" hidden aria-label="Admin">
    <section><h3>Débogage</h3>
      <label class="tog"><input type="checkbox" id="admDbg">Bandeau de débogage (i/s, temps d’image, dessin)</label>
      <label class="tog"><input type="checkbox" id="admXray">Rayons X : murs et plafonds transparents</label>
      <label class="tog"><input type="checkbox" id="admEau">Eau : pièces remplies, fuites du contrôle en rouge</label>
      <p class="sub" id="admEauTxt"></p></section>
    <section><h3>Plan déposé</h3>
      <label class="tog"><input type="checkbox" id="admOrig">À côté du plan 2D</label>
      <div class="adm-row" id="admOrigBtns"></div></section>
    <section><h3>Contrôles</h3><div id="admCtl" class="adm-ctl">…</div></section>
    <section><h3>Fichiers du plan</h3><ul id="admFiles" class="adm-files"><li>…</li></ul></section>
    <section><h3>Liens</h3><div class="adm-row"><a class="btn" href="../../">Tous les plans</a><a class="btn" id="admPano" href="pano/" hidden>360°</a><a class="btn" href="?rendu=ultra">Ouvrir en ultra réaliste</a></div>
      <p class="sub mono" id="admId"></p></section>
  </aside>
  <div id="origWrap" hidden><img id="origImg" alt="Plan déposé"><div class="orig-cap mono" id="origCap"></div></div>
  <div id="dbg" class="mono" hidden aria-hidden="true"></div>
  <dialog id="admView" aria-labelledby="admViewT"><div class="adm-vhead"><b id="admViewT"></b><span class="mono" id="admViewS"></span>
    <a class="btn" id="admViewRaw" target="_blank" rel="noopener">Ouvrir brut</a><button class="btn" id="admViewCopy">Copier</button><button class="btn" id="admViewClose">Fermer</button></div>
    <div class="adm-vbody" id="admViewB"></div></dialog>`);
  $('#admId').textContent = `${pid || 'plan'} · ${D.rooms.length} pièces · ${Object.keys(D.openings || {}).length} ouvertures · ${D.stops.length} arrêts${D.multi ? ` · ${D.levels.length} niveaux` : ''}`;
  const panel = $('#admin');
  const ouvrir = on => { panel.hidden = !on; btn.setAttribute('aria-expanded', String(on)); if (on && !settings.hidden) btnSet.click(); document.body.classList.toggle('adm-open', on); };
  btn.addEventListener('click', () => ouvrir(panel.hidden));
  btnSet.addEventListener('click', () => { if (!settings.hidden) ouvrir(false); });
  addEventListener('keydown', e => { if (e.code === 'Escape' && !panel.hidden) ouvrir(false); });
  // lien « Admin » de la liste des plans : galerie quittée (elle recouvre tout), maquette 3D dès que le moteur est prêt, panneau ouvert
  if (location.hash === '#admin') { const go = () => { if (!App.engine) return setTimeout(go, 200); if (App.leaveGallery) App.leaveGallery(S.mode === 'plan' ? 'plan' : 'orbit'); ouvrir(true); }; go(); }
  const lier = (id, k) => { const el = $(id); el.checked = !!S[k]; el.addEventListener('change', () => App.set(k, el.checked)); App.on(kk => { if (kk === k) el.checked = !!S[k]; }); };
  lier('#admDbg', 'debug'); lier('#admXray', 'xray'); lier('#admEau', 'eau'); lier('#admOrig', 'orig');

  // plan déposé à côté du plan 2D (mode Plan 2D)
  const origWrap = $('#origWrap'), origImg = $('#origImg');
  let origSrc = null;
  const majOrig = () => {
    const on = !!S.orig && S.mode === 'plan' && !!origSrc;
    origWrap.hidden = !on; document.body.classList.toggle('orig', on);
    if (on && origImg.getAttribute('src') !== origSrc) origImg.src = origSrc;
    dispatchEvent(new Event('resize')); // le plan 2D se recadre dans sa moitié
  };
  App.on(k => { if (k === 'orig' || k === 'mode') majOrig(); });
  origImg.addEventListener('click', () => { if (origSrc) window.open(origSrc, '_blank', 'noopener'); });

  // bandeau de débogage
  const dbg = $('#dbg');
  if (new URLSearchParams(location.search).has('debug') && !S.debug) App.set('debug', true);
  const majDbg = () => {
    dbg.hidden = !S.debug; if (!S.debug || !App.debugInfo) return;
    const i = App.debugInfo();
    dbg.textContent = [i.fps ? `${i.fps} i/s` : '0 i/s (repos : rien ne bouge, rien n’est redessiné)', i.fps && i.ms != null ? `${String(i.ms).replace('.', ',')} ms par image` : null, `palier ${i.palier}${i.mouvement ? ' (mouvement)' : ''}`, `×${String(i.pixelRatio).replace('.', ',')}`,
      i.rendu === 'ultra' ? 'ultra réaliste' : 'simple', { plan: 'plan 2D', orbit: 'maquette', walk: 'visite' }[i.mode] || i.mode, i.piece, i.niveau != null ? `niveau ${i.niveau}` : null,
      i.mode === 'walk' ? `x ${i.x} z ${i.z} cap ${i.cap}°` : null, `${i.appels} appels`, `${nb(i.triangles)} tri`, `${i.textures} tex · ${i.geometries} géo`,
      `culling ${i.culling}`, `occlusion ${i.occlusion}`, i.sondes ? `${i.sondes} sondes en attente` : null, i.logiciel ? 'rendu logiciel' : null].filter(Boolean).join(' · ');
  };
  setInterval(majDbg, 250); App.on(k => { if (k === 'debug') majDbg(); });

  // visionneuse de fichiers
  const view = $('#admView'), vb = $('#admViewB');
  let texte = '';
  const fermer = () => { try { view.close(); } catch (e) { view.removeAttribute('open'); } vb.innerHTML = ''; };
  $('#admViewClose').addEventListener('click', fermer);
  view.addEventListener('click', e => { if (e.target === view) fermer(); });
  $('#admViewCopy').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(texte).catch(() => {}); });
  async function voir(nom, t) {
    const u = url(nom); $('#admViewT').textContent = role(nom) || nom; $('#admViewS').textContent = `${nom}${t ? ` · ${taille(t)}` : ''}`; $('#admViewRaw').href = u; texte = '';
    vb.innerHTML = '<p class="sub">Chargement…</p>'; try { view.showModal(); } catch (e) { view.setAttribute('open', ''); }
    $('#admViewCopy').hidden = !/\.(json|txt)$/.test(nom);
    if (/\.(png|jpe?g|webp)$/.test(nom)) { vb.innerHTML = `<img src="${esc(u)}" alt="${esc(nom)}">`; return; }
    if (/\.pdf$/.test(nom)) { vb.innerHTML = `<iframe src="${esc(u)}" title="${esc(nom)}"></iframe>`; return; }
    try {
      const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); let s = await r.text();
      if (nom.endsWith('.json')) { try { s = joli(JSON.parse(s)); } catch (e) {} }
      texte = s; const MAX = 1.5e6;
      vb.innerHTML = `${s.length > MAX ? `<p class="sub">Fichier long : ${taille(s.length)}, début seulement (« Ouvrir brut » pour tout voir).</p>` : ''}<pre>${esc(s.slice(0, MAX))}</pre>`;
    } catch (e) { vb.innerHTML = `<p class="sub">Fichier illisible (${esc(e.message)}).</p>`; }
  }

  // fichiers et contrôles
  const liste = $('#admFiles'), ctl = $('#admCtl');
  async function charger() {
    if (!api) { liste.innerHTML = '<li class="sub">Dossier du plan inconnu.</li>'; ctl.textContent = '–'; return; }
    let F;
    try { const r = await fetch(api, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); F = await r.json(); }
    catch (e) { try { const r = await fetch('admin/fichiers.json', { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); F = await r.json(); statique = true; } catch (e2) { F = null; } }
    if (!F) { liste.innerHTML = '<li class="sub">Fichiers du plan indisponibles ici.</li>'; ctl.textContent = 'Indisponible ici.'; $('#admOrigBtns').innerHTML = '<span class="sub">Indisponible ici.</span>'; return; }
    F.sort((a, b) => rang(a.nom) - rang(b.nom) || a.nom.localeCompare(b.nom));
    liste.innerHTML = F.map(f => `<li><button type="button" data-f="${esc(f.nom)}" data-t="${f.taille}"><span>${esc(role(f.nom) || f.nom)}</span><small class="mono">${esc(f.nom)} · ${taille(f.taille)}</small></button></li>`).join('') || '<li class="sub">Aucun fichier.</li>';
    liste.addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) voir(b.dataset.f, +b.dataset.t); });
    const a = n => F.find(f => f.nom === n);
    // plan déposé à côté du plan 2D : le plan recadré (même cadrage), sinon la page entière
    const pg = a('plan-src.png') || a('page.png'); origSrc = pg ? url(pg.nom) : null;
    $('#origCap').textContent = pg ? `${role(pg.nom)} · cliquer pour l’ouvrir en grand` : '';
    $('#admOrigBtns').innerHTML = [...F.filter(f => /^source\./.test(f.nom)), a('page.png'), a('plan-src.png')].filter(Boolean).map(f => `<button class="btn" type="button" data-f="${esc(f.nom)}" data-t="${f.taille}">${esc(/^source\./.test(f.nom) ? `Source ${f.nom.split('.').pop().toUpperCase()}` : f.nom === 'page.png' ? 'Page' : 'Plan recadré')}</button>`).join('') || '<span class="sub">Aucun fichier déposé gardé.</span>';
    $('#admOrigBtns').addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (b) voir(b.dataset.f, +b.dataset.t); });
    if (!pg) $('#admOrig').disabled = true;
    majOrig();
    // contrôles : verdict, problèmes ; fuites du test d'immersion pour la vue eau
    const lire = async n => { if (!a(n)) return null; try { const r = await fetch(url(n), { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
    const [c, cp] = await Promise.all([lire('controle.json'), lire('pano/controle.json')]);
    const bloc = (t, c) => {
      if (!c) return `<p><b>${t}</b> : pas de résultat.</p>`;
      const pb = c.problemes || c.problems || [];
      return `<p><b>${t}</b> : ${c.ok ? '<span class="adm-ok">réussi</span>' : `<span class="adm-ko">${pb.length} problème${pb.length > 1 ? 's' : ''}</span>`}</p>` + (pb.length ? `<ul>${pb.slice(0, 40).map(q => `<li>${esc(typeof q === 'string' ? q : q.texte || JSON.stringify(q))}</li>`).join('')}</ul>` : '');
    };
    ctl.innerHTML = bloc('Visite de contrôle', c) + bloc('360°', cp);
    const fuites = ((c && c.problemes) || []).filter(q => q && q.type === 'etancheite' && Array.isArray(q.p) && q.p.length === 3).map(q => q.p);
    App.fuitesEau && App.fuitesEau(fuites);
    $('#admEauTxt').textContent = c ? (fuites.length ? `${fuites.length} fuite${fuites.length > 1 ? 's' : ''} relevée${fuites.length > 1 ? 's' : ''} par le test d’immersion.` : 'Test d’immersion réussi : aucune fuite.') : 'Pas encore de visite de contrôle.';
    $('#admPano').hidden = !F.some(f => f.nom === 'pano/controle.json');
  }
  charger();
}
