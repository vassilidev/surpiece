/* Visionneuse 360° : panoramas équirectangulaires rendus par moteur/pano.mjs, navigation d'arrêt en arrêt. Sans moteur 3D ni plan.json :
   elle ne lit que visite.json (arrêts, niveaux, liens) et des images, toutes dans son dossier (pano.mjs la copie en pano/visionneuse.js).
   WebGL minimal : un triangle plein écran, la direction de chaque pixel lue dans le panorama (deux panoramas mêlés pendant une transition).
   Conventions (celles du moteur) : lacet ψ, avant = (−sin ψ, 0, −cos ψ), ψ croît vers la gauche ; tangage φ positif vers le haut.
   Panorama : colonne u = 0,5 − ψ / 2π, ligne v = 0,5 − φ / π (haut de l'image en v = 0).
   Champ de vision par défaut : 105° en largeur sur un écran en paysage (ordinateur), 115° en hauteur en portrait (72° en largeur sur un
   téléphone de 390 × 844) ; repères : Pannellum, la visionneuse libre la plus répandue, ouvre à 100° en largeur (bornes 50 à 120°), et les
   visites des sites d'annonces montrent la pièce entière plutôt qu'un pan de mur. Déformation des bords acceptée à ce prix. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const cv = $('#vue'), svgPts = $('#points'), etq = $('#etq');
  const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TACTILE = matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angD = a => Math.atan2(Math.sin(a), Math.cos(a));
  const DEG = Math.PI / 180;
  const lisse = t => t * t * (3 - 2 * t);
  const T0 = 0, temps = {}; // temps comptés depuis le début de la navigation
  const VERSION = document.documentElement.dataset.version || '';
  const avecV = u => VERSION ? `${u}?v=${VERSION}` : u;

  /* ---------- WebGL (recréé après une perte du contexte : téléphone qui change d'application) ---------- */
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  function erreur(texte, reessayer) {
    $('#erreurTexte').textContent = texte; $('#reessayer').hidden = !reessayer; $('#erreur').style.display = 'grid';
    const a = $('#attente'); if (a) a.remove();
  }
  if (!gl) { erreur('La visite à 360° ne peut pas s’afficher sur cet appareil.', false); return; }
  const VS = 'attribute vec2 p; varying vec2 q; void main(){ q = p; gl_Position = vec4(p, 0.0, 1.0); }';
  const FS = `precision highp float;
    varying vec2 q; uniform sampler2D tA, tB; uniform mat3 rA, rB; uniform vec2 kA, kB; uniform float m;
    vec3 lit(sampler2D t, mat3 r, vec2 k){
      vec3 d = normalize(r * vec3(q * k, -1.0));
      vec2 uv = vec2(0.5 - atan(-d.x, -d.z) / 6.2831853, 0.5 - asin(clamp(d.y, -1.0, 1.0)) / 3.1415927);
      return texture2D(t, uv).rgb;
    }
    void main(){
      vec3 c = lit(tA, rA, kA);
      if (m > 0.0) c = mix(c, lit(tB, rB, kB), m);
      gl_FragColor = vec4(c, 1.0);
    }`;
  let urA, urB, ukA, ukB, um, perdu = false;
  function initGL() {
    const prog = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); gl.attachShader(prog, sh); }
    gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n); urA = U('rA'); urB = U('rB'); ukA = U('kA'); ukB = U('kB'); um = U('m');
    gl.uniform1i(U('tA'), 0); gl.uniform1i(U('tB'), 1);
    gl.viewport(0, 0, cv.width, cv.height);
  }
  initGL();
  const MAXTEX = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const pot = n => (n & (n - 1)) === 0;
  const regle = w => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot(w) ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  const image1 = () => new Promise(r => requestAnimationFrame(r));
  // texture d'une image ; au-delà de 2048 px, envoyée au processeur graphique par bandes de 256 lignes, une par image affichée : l'envoi
  // d'un 4096 d'un seul bloc gelait l'écran de 70 à 700 ms au téléphone. La texture n'est échangée qu'une fois complète.
  async function texture(img) {
    const w = img.width, h = img.height, t = gl.createTexture(), bandes = w > 2048 && typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap;
    gl.bindTexture(gl.TEXTURE_2D, t); regle(w);
    if (!bandes) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); if (img.close) img.close(); return t; }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    const B = 256;
    for (let y = 0; y < h; y += B) {
      const b = await createImageBitmap(img, 0, y, w, Math.min(B, h - y));
      if (perdu || gl.isContextLost()) { b.close(); img.close(); return null; }
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, gl.RGB, gl.UNSIGNED_BYTE, b); b.close();
      await image1();
    }
    img.close();
    return t;
  }

  /* ---------- état ---------- */
  let V = null, parId = {}, niveaux = [], tailles = [2048];
  const vue = { lacet: 0, tangage: 0, fov: 80 };       // fov : champ vertical, en degrés
  let cur = null, trans = null, sale = true, carteNiv = 0, gyro = null;
  const TEX = new Map();                                // id → { t : texture, L : largeur chargée, att : { L : promesse } }
  let W = 1, H = 1, DPR = 1;
  // champ par défaut, en largeur : 72° pour un rapport largeur / hauteur de 0,5 ou moins (téléphone en portrait), 105° à partir de 1,3
  // (ordinateur, téléphone en paysage), entre les deux proportionnellement ; converti en champ vertical (celui que garde « vue »)
  const hDef = a => a <= 0.5 ? 72 : a >= 1.3 ? 105 : 72 + 33 * (a - 0.5) / 0.8;
  const vDeH = (h, a) => 2 * Math.atan(Math.tan(h * DEG / 2) / a) / DEG;
  const hDeV = (v, a) => 2 * Math.atan(Math.tan(v * DEG / 2) * a) / DEG;
  const fovDefaut = (a = W / H) => Math.min(118, vDeH(hDef(a), a));
  // dézoom : 20° de plus en largeur au plus (120° sur ordinateur, 125° au plus, 135° en hauteur au plus en portrait)
  const fovMax = (a = W / H) => Math.min(135, vDeH(Math.min(125, hDef(a) + 20), a));
  const tailleOk = () => tailles.filter(L => L <= MAXTEX && (L <= 4096 || !TACTILE)); // 8192 : ordinateur seulement (mémoire du téléphone)
  // zoom borné par la netteté : un pixel du plus grand panorama couvre au plus 2,2 pixels d'écran (CSS), au-delà l'image est floue
  const fovBornes = () => {
    const L = Math.max(...tailleOk(), 2048), hMin = W / (2.2 * L / 360) * DEG;
    const vMin = 2 * Math.atan(Math.tan(hMin / 2) * H / W) / DEG;
    return [clamp(vMin, 20, fovDefaut()), fovMax()];
  };
  function taille() {
    const a0 = W / H, k = Math.tan(vue.fov * DEG / 2) / Math.tan(fovDefaut(a0) * DEG / 2); // zoom relatif, gardé quand l'écran tourne
    DPR = Math.min(devicePixelRatio || 1, 3); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); if (!perdu) gl.viewport(0, 0, cv.width, cv.height);
    if (V) vue.fov = clamp(2 * Math.atan(k * Math.tan(fovDefaut() * DEG / 2)) / DEG, ...fovBornes());
    sale = true;
  }

  /* ---------- géométrie de la vue ---------- */
  // rotation caméra → monde : Ry(ψ) · Rx(φ) (colonnes, pour mat3 de GLSL)
  function rot(psi, phi) {
    const cy = Math.cos(psi), sy = Math.sin(psi), cp = Math.cos(phi), sp = Math.sin(phi);
    return new Float32Array([cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp]);
  }
  const kvue = fov => { const t = Math.tan(fov * DEG / 2); return [t * W / H, t]; };
  const dir = (psi, phi) => [-Math.sin(psi) * Math.cos(phi), Math.sin(phi), -Math.cos(psi) * Math.cos(phi)];
  // point du monde (relatif à l'œil) → écran (px CSS), ou null derrière la caméra
  function proj(P, v = vue) {
    const cy = Math.cos(v.lacet), sy = Math.sin(v.lacet), cp = Math.cos(v.tangage), sp = Math.sin(v.tangage);
    const x1 = P[0] * cy - P[2] * sy, z1 = P[0] * sy + P[2] * cy;          // Ry(−ψ)
    const y2 = P[1] * cp + z1 * sp, z2 = z1 * cp - P[1] * sp;             // Rx(−φ)
    if (z2 > -0.05) return null;
    const [kx, ky] = kvue(v.fov);
    return [W / 2 + (x1 / -z2) / kx * W / 2, H / 2 - (y2 / -z2) / ky * H / 2];
  }
  // écran → direction du monde
  function deproj(x, y, v = vue) {
    const [kx, ky] = kvue(v.fov), r = rot(v.lacet, v.tangage), c = [(x / W * 2 - 1) * kx, (1 - y / H * 2) * ky, -1];
    const d = [r[0] * c[0] + r[3] * c[1] + r[6] * c[2], r[1] * c[0] + r[4] * c[1] + r[7] * c[2], r[2] * c[0] + r[5] * c[1] + r[8] * c[2]], n = Math.hypot(...d);
    return d.map(e => e / n);
  }

  /* ---------- chargement des images : adresses versionnées, deux nouveaux essais en cas de coupure ---------- */
  const url = (id, L) => avecV(`${encodeURIComponent(id)}-${L}.jpg`);
  const attendre = ms => new Promise(r => setTimeout(r, ms));
  async function image(src) {
    let r = null;
    for (const pause of [0, 1000, 3000]) {
      if (pause) await attendre(pause);
      try { r = await fetch(src); } catch (e) { r = null; continue; }   // réseau coupé : on réessaie
      if (r.ok || r.status < 500) break;                               // introuvable : inutile d'insister
    }
    if (!r || !r.ok) throw new Error('image');
    const b = await r.blob();
    if (window.createImageBitmap) try { return await createImageBitmap(b); } catch (e) { /* repli ci-dessous */ }
    const im = new Image(); im.src = URL.createObjectURL(b); await im.decode(); return im;
  }
  // largeur utile à l'écran : pixels (physiques) de la vue ramenés à 360°
  const besoin = () => cv.width / hDeV(vue.fov, W / H) * 360;
  // plus petit panorama qui ne soit pas agrandi plus de 1,25 fois ; sinon le plus grand permis
  const tailleMax = () => { const ok = tailleOk(), b = besoin(); return ok.find(L => L * 1.25 >= b) ?? ok[ok.length - 1]; };
  function charge(id, L) {
    let e = TEX.get(id); if (!e) { e = { t: null, L: 0, att: {} }; TEX.set(id, e); }
    if (e.L >= L) return Promise.resolve(e);
    if (!e.att[L]) e.att[L] = image(url(id, L)).then(async im => {
      if (e.L >= L || perdu) { if (im.close) im.close(); return e; }
      const t = await texture(im); if (!t) return e;
      // image plus nette : redessinée tout de suite (la boucle est à l'arrêt quand personne ne bouge)
      if (e.L < L && TEX.get(id) === e) { if (e.t) gl.deleteTexture(e.t); e.t = t; e.L = L; sale = true; boucle(); } else gl.deleteTexture(t);
      return e;
    }).catch(() => { delete e.att[L]; return e; });
    return e.att[L];
  }
  // étapes : aperçu 512, puis 2048, puis la taille que demande l'écran (réseau lent : une image correcte vers 8 s au lieu de 18)
  const echelle = (id, L) => { const pas = tailles.filter(x => x < L && x >= 2048); return pas.reduce((p, x) => p.then(() => charge(id, x)), Promise.resolve()).then(() => charge(id, L)); };
  // mémoire : panoramas gardés = arrêt courant (net), voisins (2048 au plus) et arrivée d'une transition ; les autres libérés
  function menage() {
    const voisins = new Set(parId[cur] ? parId[cur].liens.map(l => l.vers) : []), garde = new Set([cur, trans && trans.vers, ...voisins]);
    for (const [id, e] of TEX) {
      if (!garde.has(id)) { if (e.t) gl.deleteTexture(e.t); TEX.delete(id); }
      else if (voisins.has(id) && id !== cur && !(trans && trans.vers === id) && e.L > 2048) { if (e.t) gl.deleteTexture(e.t); TEX.delete(id); }
    }
  }
  function prechargeVoisins() {
    const a = parId[cur]; if (!a) return;
    const moy = Math.min(tailles.includes(2048) ? 2048 : tailles[0], tailleMax());
    for (const l of a.liens) charge(l.vers, 512);
    for (const l of a.liens) charge(l.vers, moy);
  }

  /* ---------- rendu ---------- */
  let images = 0;
  function dessine() {
    if (perdu) return;
    const e = TEX.get(cur); if (!e || !e.t) return;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.t);
    gl.uniformMatrix3fv(urA, false, rot(vue.lacet, vue.tangage)); gl.uniform2fv(ukA, kvue(vue.fov));
    let m = 0;
    if (trans && trans.m > 0) {
      const eb = TEX.get(trans.vers);
      if (eb && eb.t) { m = trans.m; gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, eb.t); gl.uniformMatrix3fv(urB, false, rot(trans.vB.lacet, trans.vB.tangage)); gl.uniform2fv(ukB, kvue(trans.vB.fov)); }
      if (trans.vA) { gl.uniformMatrix3fv(urA, false, rot(trans.vA.lacet, trans.vA.tangage)); gl.uniform2fv(ukA, kvue(trans.vA.fov)); }
    }
    gl.uniform1f(um, m); gl.drawArrays(gl.TRIANGLES, 0, 3); images++;
  }

  /* ---------- points de passage : cercles au sol, projetés en perspective ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  let ptsEl = [];
  function construitPoints() {
    svgPts.innerHTML = ''; ptsEl = [];
    const a = parId[cur]; if (!a) return;
    for (const l of a.liens) {
      const b = parId[l.vers], g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pt'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Aller : ${b.nom}${l.escalier ? ' (' + b.nomNiveau + ')' : ''}`);
      const d1 = document.createElementNS(NS, 'path'), d2 = document.createElementNS(NS, 'path'); d1.setAttribute('class', 'disque'); d2.setAttribute('class', 'coeur');
      g.append(d1, d2); svgPts.append(g);
      const P = dir(l.lacet, l.tangage).map(c => c * l.d), o = { l, b, g, d1, d2, P, c: null };
      g.addEventListener('pointerenter', () => montreEtq(o)); g.addEventListener('pointerleave', () => montreEtq(null));
      g.addEventListener('focus', () => montreEtq(o)); g.addEventListener('blur', () => montreEtq(null));
      g.addEventListener('click', ev => { ev.stopPropagation(); aller(l.vers, l); });
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); aller(l.vers, l); } });
      g.addEventListener('pointerdown', ev => ev.stopPropagation());
      ptsEl.push(o);
    }
  }
  const cercle = (P, r, n = 28) => { const pts = []; for (let i = 0; i < n; i++) { const t = i / n * 2 * Math.PI, q = proj([P[0] + r * Math.cos(t), P[1], P[2] + r * Math.sin(t)]); if (!q) return null; pts.push(q); } return pts; };
  const chemin = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  const HAUT_MIN = 14; // un cercle lointain (7 m, à travers une porte-fenêtre) garde au moins 14 px de haut : on le voit et on le touche
  let etqDe = null;
  function placePoints() {
    const cache = !!(trans && trans.m > 0);
    for (const o of ptsEl) {
      let ext = o.l.escalier ? 0.22 : 0.3, c = cache ? null : cercle(o.P, ext);
      if (c) { const hh = Math.max(...c.map(p => p[1])) - Math.min(...c.map(p => p[1])); if (hh < HAUT_MIN) { ext *= Math.min(6, 1.04 * HAUT_MIN / Math.max(hh, 1)); c = cercle(o.P, ext); } }
      const ci = c && cercle(o.P, ext * 0.34, 18);
      o.c = c && proj(o.P);
      if (!c || !ci) { o.g.style.display = 'none'; continue; }
      o.g.style.display = ''; o.d1.setAttribute('d', chemin(c)); o.d2.setAttribute('d', chemin(ci));
      o.g.dataset.x = o.c[0].toFixed(2); o.g.dataset.y = o.c[1].toFixed(2);
    }
    placeEtq();
  }
  function montreEtq(o) { etqDe = o; for (const p of ptsEl) p.g.classList.toggle('actif', p === o); placeEtq(); }
  const FLECHE = { monter: '<svg viewBox="0 0 12 12"><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>', descendre: '<svg viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>' };
  function placeEtq() {
    // sur écran tactile, sans survol : le nom du point le plus proche du centre de la vue
    let o = etqDe && ptsEl.includes(etqDe) ? etqDe : null;
    if (!o && TACTILE) { let bd = 0.45 * Math.min(W, H); for (const p of ptsEl) if (p.c && p.g.style.display !== 'none') { const d = Math.hypot(p.c[0] - W / 2, p.c[1] - H / 2); if (d < bd) { bd = d; o = p; } } }
    if (!o || !o.c || o.g.style.display === 'none') { etq.classList.remove('vue'); return; }
    const txt = `${o.l.escalier ? FLECHE[o.l.escalier] : ''}<span>${esc(o.b.nom)}</span>${o.l.escalier ? `<small>${esc(o.b.nomNiveau)}</small>` : ''}`;
    if (etq.dataset.k !== o.b.id) { etq.innerHTML = txt; etq.dataset.k = o.b.id; }
    const bb = o.d1.getBBox ? o.d1.getBBox() : { y: o.c[1] };
    etq.style.transform = `translate(${o.c[0].toFixed(1)}px, ${(bb.y - 8).toFixed(1)}px) translate(-50%, -100%)`; etq.classList.add('vue');
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- mini-plan (montré une fois son image chargée ; caché si elle manque) ---------- */
  const planImg = $('#planImg'), planSvg = $('#planSvg'), carte = $('#carte');
  planImg.addEventListener('load', () => carte.classList.remove('attente'));
  planImg.addEventListener('error', () => { carte.hidden = true; });
  function dessineCarte() {
    const n = niveaux[carteNiv]; if (!n) return;
    const Wc = 1000 * n.ratio, Hc = 1000;
    carte.classList.toggle('large', n.ratio > 1.2);
    if (planImg.dataset.niv !== String(carteNiv)) { planImg.src = avecV(n.plan); planImg.dataset.niv = String(carteNiv); planImg.alt = `Plan${n.nom ? ' ' + n.nom : ''}`; }
    planSvg.setAttribute('viewBox', `0 0 ${Wc} ${Hc}`);
    const a = parId[cur], ici = a && a.niveau === carteNiv;
    let s = '';
    if (ici) {
      const [x, y] = [a.carte[0] * Wc, a.carte[1] * Hc], R = 0.16 * Math.max(Wc, Hc), hf = Math.atan(Math.tan(vue.fov * DEG / 2) * W / H);
      const p = t => [x - Math.sin(vue.lacet + t) * R, y - Math.cos(vue.lacet + t) * R];
      const [p1, p2] = [p(hf), p(-hf)];
      s += `<path class="cone" d="M${x} ${y}L${p1[0]} ${p1[1]}A${R} ${R} 0 0 1 ${p2[0]} ${p2[1]}Z"/>`;
    }
    const r = 0.022 * Math.max(Wc, Hc);
    for (const b of V.arrets) if (b.niveau === carteNiv) {
      const [x, y] = [b.carte[0] * Wc, b.carte[1] * Hc];
      s += `<g data-id="${esc(b.id)}" aria-label="${esc(b.nom)}"><circle class="dot-z" cx="${x}" cy="${y}" r="${r * 2.4}"/><circle class="dot${b.id === cur ? ' ici' : ''}" cx="${x}" cy="${y}" r="${b.id === cur ? r * 1.25 : r}"/></g>`;
    }
    planSvg.innerHTML = s;
  }
  // petit écran : le premier toucher agrandit le plan, le suivant choisit un arrêt (ou referme le plan)
  $('#plan').addEventListener('click', ev => {
    const g = ev.target.closest('g[data-id]'), petit = innerWidth <= 760 || innerHeight <= 500;
    if (petit && !carte.classList.contains('grand')) { carte.classList.add('grand'); return; }
    carte.classList.remove('grand');
    if (g) aller(g.dataset.id);
  });
  function niveauxUI() {
    const nv = $('#niv'); if (niveaux.length < 2) return;
    nv.hidden = false; nv.innerHTML = niveaux.map((n, k) => `<button type="button" data-k="${k}" aria-pressed="false">${esc(n.nom || 'Niveau ' + (k + 1))}</button>`).join('');
    nv.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation(); carteNiv = +b.dataset.k; syncNiv(); dessineCarte(); });
  }
  const syncNiv = () => { for (const b of document.querySelectorAll('#niv button')) b.setAttribute('aria-pressed', String(+b.dataset.k === carteNiv)); };

  /* ---------- liste des pièces ---------- */
  function chipsUI() {
    const multi = niveaux.length > 1;
    $('#chips').innerHTML = V.arrets.map(a => `<button type="button" class="chip" data-id="${esc(a.id)}">${esc(a.nom)}${multi || a.surface ? `<small>${esc([multi ? a.nomNiveau : '', a.surface || ''].filter(Boolean).join(' · '))}</small>` : ''}</button>`).join('');
    $('#chips').addEventListener('click', ev => { const b = ev.target.closest('.chip'); if (b) aller(b.dataset.id); });
  }
  function syncChips() {
    for (const b of document.querySelectorAll('.chip')) { const on = b.dataset.id === cur; b.setAttribute('aria-current', String(on)); if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' }); }
  }

  /* ---------- navigation d'arrêt en arrêt ---------- */
  const roue = $('#roue'), reseau = $('#reseau');
  let attenteRoue = null, relance = null;
  reseau.addEventListener('click', () => { reseau.hidden = true; if (relance) relance(); });
  async function aller(id, lien, instant, depuisHistorique) {
    const b = parId[id]; if (!b || id === cur || (trans && trans.vers === id)) return;
    masqueAide(); reseau.hidden = true;
    if (trans) finTransition();
    const tangB = b.tangage ?? -0.06;
    const vers = { lacet: lien ? (lien.arrivee ?? lien.lacet) : b.cap, tangage: tangB, fov: vue.fov };
    trans = { vers: id, m: 0, t0: 0, vA: { ...vue }, vB: { ...vers }, lien, pret: false, histo: !!depuisHistorique };
    attenteRoue = setTimeout(() => roue.classList.add('vue'), 250);
    // au moins l'aperçu ; l'image nette si elle arrive vite
    await charge(id, 512);
    if (!trans || trans.vers !== id) return;
    if (!(TEX.get(id) || {}).t) {
      // image absente (réseau coupé) : on reste où l'on est, avec un message
      clearTimeout(attenteRoue); roue.classList.remove('vue'); trans = null; sale = true; boucle();
      relance = () => aller(id, lien, instant, depuisHistorique); reseau.hidden = false; return;
    }
    const moy = Math.min(tailles.includes(2048) ? 2048 : tailles[0], tailleMax());
    await Promise.race([charge(id, moy), attendre(900)]);
    if (!trans || trans.vers !== id) return;
    clearTimeout(attenteRoue); roue.classList.remove('vue');
    // rotation vers le regard d'arrivée après le fondu, à 60°/s en moyenne (90°/s au plus, jamais de saut)
    const tour = lien ? Math.abs(angD(vers.lacet - lien.lacet)) : 0, vers0 = lien ? Math.abs(angD(lien.lacet - vue.lacet)) : 0;
    // on se tourne vers le cercle en 340 ms, plus longtemps s'il est loin du centre de l'écran (140°/s au plus)
    trans.P = Math.max(340, 1500 * vers0 / (140 * DEG)); trans.A0 = Math.max(0, trans.P - 0.4 * BASE_LIEN);
    trans.pret = true; trans.t0 = performance.now(); trans.dur = instant || REDUIT ? 0 : lien ? trans.A0 + BASE_LIEN + 1000 * tour / VIT_TOUR : 480;
    trans.depart = { ...vue };
    boucle();
  }
  /* transition le long d'un lien : on se tourne vers le cercle (40 % des 850 premières ms), on avance d'un zoom léger (20 % au plus, en
     visant l'horizon et non le sol : on ne fonce pas dans la porte), le panorama suivant apparaît en fondu (de 20 à 70 %) en regardant la
     même direction, puis tourne vers le regard d'arrivée (lien.arrivee : la pièce, jamais un mur, dans le sens de la marche) */
  // les deux panoramas regardent la même direction pendant tout le fondu (celle du cercle, où l'on va) : pas de double image ni de saut
  // (constat du 28/09/2026 : le panorama d'arrivée était posé d'un coup à 40° de son regard, saut de 110° en 220 ms au milieu du fondu) ;
  // puis on tourne vers le regard d'arrivée (60° au plus du sens de la marche, pano-regard.mjs) à 60°/s en moyenne
  const BASE_LIEN = 850, VIT_TOUR = 60 * DEG;
  function pasTransition(now) {
    const T = trans, ms = now - T.t0, t = T.dur ? clamp(ms / T.dur, 0, 1) : 1;
    const d = T.depart;
    if (T.lien) {
      const L = T.lien, vise = clamp(L.tangage * 0.25, -0.2, 0.05), arr = L.arrivee ?? L.lacet;
      const A0 = T.A0 || 0, fin = A0 + BASE_LIEN, ta = T.dur ? clamp((ms - A0) / BASE_LIEN, 0, 1) : 1, tb = T.dur > fin ? clamp((ms - fin) / (T.dur - fin), 0, 1) : 1;
      const er = T.dur ? lisse(clamp(ms / (T.P || 340), 0, 1)) : 1, ez = lisse(clamp(ta / 0.7, 0, 1)), eb = lisse(clamp((ta - 0.2) / 0.8, 0, 1));
      T.vA = { lacet: d.lacet + angD(L.lacet - d.lacet) * er, tangage: d.tangage + (vise - d.tangage) * er, fov: d.fov * (1 - 0.2 * ez) };
      T.m = lisse(clamp((ta - 0.2) / 0.5, 0, 1));
      T.vB = { lacet: T.vA.lacet + angD(arr - L.lacet) * lisse(tb), tangage: vise + (T.vB0 ?? (T.vB0 = T.vB.tangage)) * eb - vise * eb, fov: d.fov * (0.9 + 0.1 * eb) };
      // le nom de la pièce change au milieu du fondu, pas à la fin (l'étiquette « Salon » restait sur l'image de la chambre)
      if (T.m >= 0.5 && !T.etq) { T.etq = true; const b = parId[T.vers]; if (b) $('#piece').textContent = b.nom; }
    } else {
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      T.vA = { ...d, fov: d.fov * (1 - 0.12 * e) }; T.m = e;
      T.vB = { ...T.vB, fov: d.fov * (1.06 - 0.06 * e) };
    }
    Object.assign(vue, T.m < 0.5 ? T.vA : T.vB);
    if (t >= 1) finTransition();
  }
  function finTransition() {
    const T = trans; trans = null; if (!T) return;
    const arr = T.lien ? (T.lien.arrivee ?? T.lien.lacet) : T.vB.lacet;
    Object.assign(vue, { lacet: arr, tangage: T.vB0 ?? T.vB.tangage, fov: T.depart ? T.depart.fov : vue.fov });
    arrive(T.vers, T.histo);
  }
  let premiere = true;
  function arrive(id, depuisHistorique) {
    cur = id; const a = parId[id];
    $('#piece').textContent = a.nom;
    const n = [niveaux.length > 1 ? a.nomNiveau : '', a.surface || ''].filter(Boolean).join(' · ');
    $('#niveau').textContent = n; $('#niveau').hidden = !n;
    document.title = `${a.nom} · Visite à 360°`;
    carteNiv = a.niveau; syncNiv(); syncChips(); construitPoints(); dessineCarte(); montreEtq(null);
    if (gyro) gyro.off = vue.lacet - gyro.lacet; // le téléphone garde la direction d'arrivée
    // l'image nette de l'arrêt d'abord (par paliers), puis seulement les voisins (réseau lent : ils ne lui prennent pas la bande passante)
    echelle(id, tailleMax()).then(() => { temps.nette ??= performance.now() - T0; sale = true; if (cur === id) prechargeVoisins(); });
    menage();
    sale = true;
    // historique : un pas par pièce (le retour du navigateur ramène à la pièce précédente, pas hors de la visite)
    const h = '#' + encodeURIComponent(id);
    try { if (premiere) history.replaceState(null, '', h); else if (!depuisHistorique && location.hash !== h) history.pushState(null, '', h); } catch (e) {}
    premiere = false;
    dispatchEvent(new CustomEvent('visite:evenement', { detail: { type: 'piece', piece: a.nom } }));
  }
  const lireHash = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } };
  addEventListener('popstate', () => { const id = lireHash(); if (parId[id] && id !== cur) aller(id, null, false, true); });

  /* ---------- regard : glisser (collé à la main), inertie courte, pincement, molette, clavier ---------- */
  const doigts = new Map();
  let drag = null, pinch = null, inert = null, touche = new Set(), zoomAttente = null;
  const focale = () => (H / 2) / Math.tan(vue.fov * DEG / 2);
  // zoom d'un facteur k sur la taille de l'image (tangente du demi-champ) : sous les doigts, l'image suit l'écartement ; en changeant l'angle
  // lui-même, un pincement de ×2,3 zoomait ×3,4 à 115° (l'image fuyait sous les doigts)
  const zoome = (fov, k) => 2 * Math.atan(Math.tan(fov * DEG / 2) * k) / DEG;
  // après un zoom : image plus nette si l'écran la demande
  const apresZoom = () => { clearTimeout(zoomAttente); zoomAttente = setTimeout(() => { if (cur) charge(cur, tailleMax()); }, 250); };
  cv.addEventListener('pointerdown', ev => {
    cv.setPointerCapture(ev.pointerId); doigts.set(ev.pointerId, [ev.clientX, ev.clientY]); inert = null; masqueAide();
    if (doigts.size === 1) drag = { x: ev.clientX, y: ev.clientY, lacet: vue.lacet, tangage: vue.tangage, hist: [], dist: 0, t: performance.now() };
    if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), fov: vue.fov }; drag = null; }
    cv.classList.add('tire');
  });
  cv.addEventListener('pointermove', ev => {
    if (!doigts.has(ev.pointerId)) { survol(ev); return; }
    doigts.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (pinch && doigts.size >= 2) { const [a, b] = [...doigts.values()]; vue.fov = clamp(zoome(pinch.fov, pinch.d / Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1]))), ...fovBornes()); sale = true; apresZoom(); return; }
    if (!drag || trans) return;
    const f = focale(), cx = W / 2, cy = H / 2;
    const dl = Math.atan((ev.clientX - cx) / f) - Math.atan((drag.x - cx) / f), dt = Math.atan((ev.clientY - cy) / f) - Math.atan((drag.y - cy) / f);
    drag.dist = Math.max(drag.dist, Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y));
    vue.lacet = drag.lacet + dl; vue.tangage = clamp(drag.tangage + dt, -1.45, 1.45);
    if (gyro) gyro.off = vue.lacet - gyro.lacet;
    const now = performance.now(); drag.hist.push([now, vue.lacet, vue.tangage]); while (drag.hist.length > 2 && now - drag.hist[0][0] > 90) drag.hist.shift();
    sale = true;
  });
  const lache = ev => {
    if (!doigts.has(ev.pointerId)) return;
    doigts.delete(ev.pointerId); cv.classList.remove('tire');
    if (pinch && doigts.size < 2) { pinch = null; if (doigts.size === 1) { const [p] = doigts.values(); drag = { x: p[0], y: p[1], lacet: vue.lacet, tangage: vue.tangage, hist: [], dist: 99, t: performance.now() }; } return; }
    if (!drag) return;
    const d = drag; drag = null;
    if (ev.type === 'pointerup' && d.dist < (ev.pointerType === 'mouse' ? 4 : 10) && performance.now() - d.t < 500) { clic(ev.clientX, ev.clientY); return; }
    const h = d.hist; if (REDUIT || h.length < 2) return;
    const [t0, l0, p0] = h[0], [t1, l1, p1] = h[h.length - 1], dt = (t1 - t0) / 1000;
    if (dt <= 0 || performance.now() - t1 > 60) return;
    const vl = (l1 - l0) / dt, vp = (p1 - p0) / dt;
    if (Math.hypot(vl, vp) > 0.15) { inert = { vl, vp, t: performance.now() }; boucle(); }
  };
  cv.addEventListener('pointerup', lache); cv.addEventListener('pointercancel', lache);
  cv.addEventListener('wheel', ev => { ev.preventDefault(); vue.fov = clamp(zoome(vue.fov, Math.exp(ev.deltaY * (ev.deltaMode ? 0.05 : 0.0012))), ...fovBornes()); sale = true; masqueAide(); apresZoom(); }, { passive: false });
  // un clic sur l'image : le point de passage le plus proche de cette direction (à moins de 17°)
  function clic(x, y) {
    const d = deproj(x, y); let best = null, bd = 0.3;
    for (const o of ptsEl) { const q = o.P, n = Math.hypot(...q), a = Math.acos(clamp((q[0] * d[0] + q[1] * d[1] + q[2] * d[2]) / n, -1, 1)); if (a < bd) { bd = a; best = o; } }
    if (best) aller(best.l.vers, best.l);
  }
  function survol(ev) {
    if (TACTILE) return;
    const d = deproj(ev.clientX, ev.clientY); let best = null, bd = 0.3;
    for (const o of ptsEl) { const q = o.P, n = Math.hypot(...q), a = Math.acos(clamp((q[0] * d[0] + q[1] * d[1] + q[2] * d[2]) / n, -1, 1)); if (a < bd) { bd = a; best = o; } }
    if (best !== etqDe) montreEtq(best);
    cv.style.cursor = best ? 'pointer' : '';
  }
  addEventListener('keydown', ev => {
    if (ev.target.closest && ev.target.closest('button,[role=button]') && (ev.key === 'Enter' || ev.key === ' ')) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(ev.key)) { touche.add(ev.key); ev.preventDefault(); masqueAide(); boucle(); }
    else if (ev.key === '+' || ev.key === '=') { vue.fov = clamp(zoome(vue.fov, 1 / 1.15), ...fovBornes()); sale = true; apresZoom(); }
    else if (ev.key === '-') { vue.fov = clamp(zoome(vue.fov, 1.15), ...fovBornes()); sale = true; }
  });
  addEventListener('keyup', ev => touche.delete(ev.key));
  addEventListener('blur', () => touche.clear());

  /* ---------- gyroscope (téléphone) ---------- */
  const bGyro = $('#gyro');
  if (TACTILE && 'ontouchstart' in window && 'DeviceOrientationEvent' in window) bGyro.hidden = false;
  function quatOrient(a, b, g, o) { // orientation du téléphone → direction regardée (dos de l'écran) ; méthode de DeviceOrientationControls
    const [x, y, z] = [b * DEG, a * DEG, -g * DEG], c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
    let q = [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3]; // YXZ
    const mul = (p, r) => [p[3] * r[0] + p[0] * r[3] + p[1] * r[2] - p[2] * r[1], p[3] * r[1] - p[0] * r[2] + p[1] * r[3] + p[2] * r[0], p[3] * r[2] + p[0] * r[1] - p[1] * r[0] + p[2] * r[3], p[3] * r[3] - p[0] * r[0] - p[1] * r[1] - p[2] * r[2]];
    q = mul(q, [-Math.SQRT1_2, 0, 0, Math.SQRT1_2]); q = mul(q, [0, 0, Math.sin(-o * DEG / 2), Math.cos(-o * DEG / 2)]);
    const [qx, qy, qz, qw] = q, v = [0, 0, -1];      // q · (0, 0, −1)
    const ix = qw * v[0] + qy * v[2] - qz * v[1], iy = qw * v[1] + qz * v[0] - qx * v[2], iz = qw * v[2] + qx * v[1] - qy * v[0], iw = -qx * v[0] - qy * v[1] - qz * v[2];
    const f = [ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx];
    return { lacet: Math.atan2(-f[0], -f[2]), tangage: Math.asin(clamp(f[1], -1, 1)) };
  }
  function surOrient(ev) {
    if (ev.alpha == null) return;
    const o = (screen.orientation && screen.orientation.angle) || window.orientation || 0, r = quatOrient(ev.alpha, ev.beta, ev.gamma, o);
    if (gyro.lacet == null) gyro.off = vue.lacet - r.lacet;
    gyro.lacet = r.lacet; if (drag) return;
    vue.lacet = r.lacet + gyro.off; vue.tangage = clamp(r.tangage, -1.45, 1.45); sale = true; boucle();
  }
  bGyro.addEventListener('click', async () => {
    if (gyro) { removeEventListener('deviceorientation', surOrient); gyro = null; bGyro.setAttribute('aria-pressed', 'false'); return; }
    try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return; } catch (e) { return; }
    gyro = { lacet: null, off: 0 }; addEventListener('deviceorientation', surOrient); bGyro.setAttribute('aria-pressed', 'true'); masqueAide();
  });

  /* ---------- retour à la visite 3D (ouverte depuis le bouton 360° de la visite : ?depuis=visite) ----------
     Même endroit : le point de vue de l'arrêt courant (pos, coordonnées du plan) et le regard courant ; un 360° sans pos ramène à l'arrêt.
     Sans ?depuis=visite (360° publié seul), pas de bouton : la visite 3D peut ne pas être à côté */
  const QS = new URLSearchParams(location.search), bRetour = $('#retour');
  const urlRetour = () => { const a = parId && parId[cur]; if (!a) return '../index.html';
    return Array.isArray(a.pos) ? `../index.html?vue=${a.pos[0]},${a.pos[1]},${a.niveau ?? 0},${(+vue.lacet).toFixed(3)}` : `../index.html?arret=${encodeURIComponent(a.id)}`; };
  if (QS.get('depuis') === 'visite') { bRetour.hidden = false; document.body.classList.add('avec-retour'); bRetour.addEventListener('click', () => { location.href = urlRetour(); }); }

  /* ---------- plein écran (absent de Safari sur iPhone : le bouton reste caché) ---------- */
  const bPlein = $('#plein'), racine = document.documentElement;
  const entrer = racine.requestFullscreen || racine.webkitRequestFullscreen, sortir = document.exitFullscreen || document.webkitExitFullscreen;
  if (typeof entrer === 'function' && typeof sortir === 'function') bPlein.hidden = false;
  bPlein.addEventListener('click', () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) sortir.call(document);
      else { const p = entrer.call(racine); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* refusé par le navigateur */ }
  });
  document.addEventListener('fullscreenchange', () => bPlein.setAttribute('aria-pressed', String(!!document.fullscreenElement)));

  /* ---------- aide ---------- */
  const aide = $('#aide');
  let aideCachee = false;
  function masqueAide() { if (!aideCachee) { aideCachee = true; aide.classList.add('cache'); aide.setAttribute('aria-hidden', 'true'); } }
  setTimeout(masqueAide, 7000);

  /* ---------- perte du contexte WebGL : textures recréées, rien à recharger du réseau (cache du navigateur) ---------- */
  cv.addEventListener('webglcontextlost', ev => { ev.preventDefault(); perdu = true; TEX.clear(); });
  cv.addEventListener('webglcontextrestored', () => {
    perdu = false; initGL(); taille();
    if (cur) charge(cur, 512).then(() => { sale = true; boucle(); echelle(cur, tailleMax()).then(prechargeVoisins); });
  });

  /* ---------- boucle : une image seulement quand la vue change ---------- */
  let enBoucle = false, tPrec = 0, carteSale = 0;
  function boucle() { if (!enBoucle) { enBoucle = true; tPrec = performance.now(); requestAnimationFrame(pas); } }
  function pas(now) {
    const dt = Math.min(0.05, (now - tPrec) / 1000); tPrec = now;
    if (inert) {
      const k = Math.exp(-(now - inert.t) / 1000 / 0.22); // inertie courte : 0,22 s
      vue.lacet += inert.vl * k * dt; vue.tangage = clamp(vue.tangage + inert.vp * k * dt, -1.45, 1.45); sale = true;
      if (k < 0.03) inert = null;
    }
    if (touche.size) {
      const v = 1.4 * vue.fov / 80;
      if (touche.has('ArrowLeft')) vue.lacet += v * dt; if (touche.has('ArrowRight')) vue.lacet -= v * dt;
      if (touche.has('ArrowUp')) vue.tangage = clamp(vue.tangage + v * dt, -1.45, 1.45); if (touche.has('ArrowDown')) vue.tangage = clamp(vue.tangage - v * dt, -1.45, 1.45);
      sale = true;
    }
    if (trans && trans.pret) { pasTransition(now); sale = true; }
    if (sale) {
      sale = false; dessine(); placePoints();
      if (++carteSale % 2 === 0 || !trans) dessineCarte();
    }
    if (inert || touche.size || (trans && trans.pret) || drag || pinch || gyro || sale) requestAnimationFrame(pas); else enBoucle = false;
  }
  // tout changement de vue relance la boucle
  for (const t of ['pointerdown', 'pointermove', 'wheel', 'keydown']) addEventListener(t, () => boucle(), { passive: true });
  addEventListener('resize', () => { taille(); boucle(); });

  /* ---------- démarrage ---------- */
  async function demarre() {
    const barre = $('#barre');
    barre.style.width = '15%';
    let r = null;
    try { r = await fetch(avecV('visite.json')); } catch (e) { r = null; }
    if (!r || !r.ok) throw new Error('visite');
    V = await r.json(); if (!V || !Array.isArray(V.arrets) || !V.arrets.length) throw new Error('visite');
    parId = Object.fromEntries(V.arrets.map(a => [a.id, a])); niveaux = V.niveaux || []; tailles = (V.tailles || [2048]).slice().sort((a, b) => a - b);
    if (V.titre) document.title = `${V.titre} · Visite à 360°`;
    barre.style.width = '45%';
    const h = lireHash(), dep = parId[h] ? h : (parId[V.depart] ? V.depart : V.arrets[0].id), a = parId[dep];
    // regard demandé par la visite 3D (&cap=, lacet du visiteur) : gardé pour l'arrêt demandé
    const capQ = parseFloat(QS.get('cap')), capOk = dep === h && Number.isFinite(capQ);
    taille(); vue.fov = clamp(fovDefaut(), ...fovBornes()); vue.lacet = capOk ? capQ : a.cap; vue.tangage = a.tangage ?? -0.06;
    niveauxUI(); chipsUI();
    if (V.arrets.length === 1 || !V.arrets.some(x => x.liens && x.liens.length)) aide.textContent = 'Glissez pour regarder autour de vous';
    else if (!TACTILE) aide.textContent = 'Glissez pour regarder autour de vous · cliquez sur un cercle pour avancer';
    // aperçu du départ demandé par la page (préchargement) : pris même si l'on commence ailleurs (lien vers une pièce)
    if (dep !== V.depart && parId[V.depart]) charge(V.depart, 512);
    await charge(dep, 512); temps.apercu = performance.now() - T0;
    if (!(TEX.get(dep) || {}).t) throw new Error('image');
    barre.style.width = '100%';
    arrive(dep); dessine(); placePoints(); dessineCarte();
    temps.premiere = performance.now() - T0;
    $('#attente').classList.add('fini'); setTimeout(() => { const x = $('#attente'); if (x) x.remove(); }, 400);
    boucle();
  }
  $('#reessayer').addEventListener('click', () => location.reload());
  demarre().catch(() => erreur('La visite n’a pas pu être chargée. Vérifiez votre connexion.', true));

  /* ---------- poignées de contrôle (pano.mjs, mesures) ---------- */
  window.__visionneuse = {
    pret: () => !!cur && !trans && !!(TEX.get(cur) || {}).t,
    aller: (id, instant) => aller(id, null, instant),
    // suit le lien de l'arrêt courant vers « vers », comme un toucher sur son cercle
    suivre: (vers, instant) => { const l = parId[cur] && parId[cur].liens.find(x => x.vers === vers); if (l) aller(vers, l, instant); return !!l; },
    etat: () => ({ cur, ...vue, h: hDeV(vue.fov, W / H), L: (TEX.get(cur) || {}).L, besoin: besoin(), cible: tailleMax(), temps, images, W, H, DPR, perdu, reseau: !reseau.hidden }),
    luminance() { dessine(); const px = new Uint8Array(64 * 64 * 4); gl.readPixels(Math.max(0, (cv.width >> 1) - 32), Math.max(0, (cv.height >> 1) - 32), 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let s = 0; for (let i = 0; i < px.length; i += 4) s += (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255; return s / (px.length / 4); },
    // regarde dans la direction attendue et rend la position à l'écran du point de passage vers « vers » (écart au centre en px, boîte)
    verifierPoint(vers, lacet, tangage) {
      Object.assign(vue, { lacet, tangage, fov: clamp(fovDefaut(), ...fovBornes()) }); dessine(); placePoints();
      const o = ptsEl.find(p => p.l.vers === vers); if (!o || !o.c || o.g.style.display === 'none') return null;
      const r = o.g.getBoundingClientRect(); if (!r.width) return null;
      return { x: o.c[0], y: o.c[1], ecart: Math.hypot(o.c[0] - W / 2, o.c[1] - H / 2), boite: [r.left, r.top, r.width, r.height] };
    },
    urlRetour: () => (bRetour.hidden ? null : urlRetour()),
    regarder(l, t, f) { Object.assign(vue, { lacet: l, tangage: t, fov: f || vue.fov }); sale = true; boucle(); },
    // images par seconde d'un regard continu (n images, tour complet)
    async fps(n = 240) {
      const t0 = performance.now(), i0 = images;
      await new Promise(res => { let k = 0; const f = () => { vue.lacet += 2 * Math.PI / n; sale = true; dessine(); placePoints(); if (++k < n) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      return (images - i0) / ((performance.now() - t0) / 1000);
    },
  };
})();
