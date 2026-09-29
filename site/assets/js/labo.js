/* « Labo de contrôle » : quatre des contrôles automatiques réels passés avant chaque envoi (moteur/controle.mjs, relecture de
   lire.py, surfaces écrites sur le plan), mis en scène sur le logement de démonstration (demo/geo.json, demo/avant.jpg, apres.jpg).
   - Eau : étanchéité (test d'immersion) ; à gauche un plan mal lu (un mur de façade manque), à droite le logement bien lu.
   - Boîte noire : fentes (le jour du dehors cherché depuis chaque bord de pièce) ; logement dans le noir, soleil rasant dehors.
   - Superposition : plan redessiné posé sur le plan d'origine, relu pièce par pièce à la loupe.
   - Parcours : chaque pièce atteinte depuis l'entrée, par ses portes.
   - Surfaces : chaque pièce comparée à la surface écrite sur le plan.
   Ouvert par tout élément [data-labo="eau|noir|sup|parcours|surf"]. */
(function () {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = k => 1 - Math.pow(1 - k, 3);
  const R = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let G = null, base = (window.SITE_BASE || '') + 'demo/', modal = null, courant = null, texA = null;

  const TESTS = {
    eau: { t: 'L’eau', h: 'Le test de l’eau', p: 'On remplit virtuellement le logement d’eau. Au moindre jour dans un mur ou une fenêtre, ça fuit, et on corrige avant de vous l’envoyer.', duo: ['Si un mur était oublié', 'Votre logement, bien lu'] },
    noir: { t: 'La boîte noire', h: 'Le test de la boîte noire', p: 'On plonge le logement dans le noir, soleil rasant dehors. La lumière ne doit entrer que par les fenêtres : depuis chaque bord de pièce, on cherche le moindre jour, jusqu’aux fentes de moins de 4 mm.', duo: ['Si un mur était oublié', 'Votre logement, bien lu'] },
    sup: { t: 'La superposition', h: 'La superposition', p: 'Le plan redessiné est posé sur votre plan d’origine, trait pour trait, puis relu pièce par pièce en zoom. Chaque correction est vérifiée deux fois.' },
    parcours: { t: 'Le parcours', h: 'Le parcours', p: 'On parcourt le logement depuis l’entrée : chaque pièce doit être atteinte, chaque porte franchissable, chaque fenêtre dégagée.' },
  };

  /* ---------- outils 3D ---------- */
  const dansP = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  function mur_fautif() {
    // un vrai mur de façade (une pièce d'un côté, le dehors de l'autre), de préférence en bordure de la plus grande pièce
    const piece = (x, z) => G.rooms.findIndex(r => dansP(r.p, x, z));
    let best = null;
    G.walls.forEach((w, i) => {
      if (w.k !== 'beton') return;
      const xs = w.p.map(p => p[0]), zs = w.p.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const dedans = piece(cx + dx * .45, cz + dz * .45), dehors = piece(cx - dx * .45, cz - dz * .45);
        if (dedans < 0 || dehors >= 0 || /loggia|balcon|terrasse/i.test(G.rooms[dedans].id)) continue;
        const L = dx ? Math.max(...zs) - Math.min(...zs) : Math.max(...xs) - Math.min(...xs);
        const note = (dedans === 0 ? 10 : 0) - Math.abs(L - 2.2);
        if (L > .8 && (!best || note > best.note)) best = { i, x: cx, z: cz, ox: -dx, oz: -dz, note };
      }
    });
    return best || { i: 0, x: G.walls[0].p[0][0], z: G.walls[0].p[0][1], ox: -1, oz: 0 };
  }
  const extrude = (pts, h) => { const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g; };
  function vagues() { // carte de normales procédurale pour les reflets de l'eau
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const a = Math.sin(i / 256 * Math.PI * 8 + Math.sin(j / 256 * Math.PI * 4) * 1.6), b = Math.cos(j / 256 * Math.PI * 6 + Math.sin(i / 256 * Math.PI * 6) * 1.2);
      const k = (j * 256 + i) * 4; d.data[k] = 128 + a * 40; d.data[k + 1] = 128 + b * 40; d.data[k + 2] = 255; d.data[k + 3] = 255;
    }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.35, .35); return t;
  }
  function base3d(canvas, opt) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true }); r.outputEncoding = THREE.sRGBEncoding; r.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (opt.shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
    const s = new THREE.Scene(); s.background = new THREE.Color(opt.bg || '#EDEFEA');
    const [X0, X1, Z0, Z1] = G.frame, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2, tgt = new THREE.Vector3(cx, 0, cz);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 300);
    const h = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), .55);
    cam.position.copy(tgt).addScaledVector(h, -Math.cos(.8) * 60).add(new THREE.Vector3(0, Math.sin(.8) * 60, 0)); cam.lookAt(tgt);
    const size = () => { const W = canvas.clientWidth, H = canvas.clientHeight; if (!W) return; r.setSize(W, H, false); const a = W / H, v = (Z1 - Z0) * .44 / Math.min(a, 1.5);
      cam.left = -v * a; cam.right = v * a; cam.top = v; cam.bottom = -v; cam.updateProjectionMatrix(); };
    size(); const ro = new ResizeObserver(size); ro.observe(canvas);
    return { r, s, cam, cx, cz, dispose() { ro.disconnect(); r.dispose(); } };
  }
  function sol(s, map) { // le plan réel au sol (parquet, carrelage), recalé en mètres
    const [X0, X1, Z0, Z1] = G.frame;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshLambertMaterial({ map }));
    m.rotation.x = -Math.PI / 2; m.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2); m.receiveShadow = true; s.add(m);
    const tour = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: '#E4E7E1' })); tour.rotation.x = -Math.PI / 2; tour.position.y = -.01; tour.receiveShadow = true; s.add(tour);
  }
  function murs(s, sauf, h, sombre) {
    const cap = new THREE.MeshBasicMaterial({ color: '#161918' }), side = sombre ? new THREE.MeshBasicMaterial({ color: '#0E1110' }) : new THREE.MeshLambertMaterial({ color: '#F4F5F1' });
    const edge = new THREE.LineBasicMaterial({ color: sombre ? '#3A403D' : '#161918', transparent: true, opacity: sombre ? .9 : .35 });
    G.walls.forEach((w, i) => { if (i === sauf) return; const g = extrude(w.p, h), m = new THREE.Mesh(g, [cap, side]); m.castShadow = true; m.receiveShadow = true; s.add(m); s.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edge)); });
  }
  function anneau(s, f, y) { const a = new THREE.Mesh(new THREE.RingGeometry(.55, .72, 48), new THREE.MeshBasicMaterial({ color: '#E0582A', transparent: true })); a.rotation.x = -Math.PI / 2; a.position.set(f.x, y, f.z); s.add(a); return a; }

  /* ---------- l'eau ---------- */
  function eau(canvas, fuite) {
    const B = base3d(canvas, {}), { s } = B;
    s.add(new THREE.HemisphereLight(0xffffff, 0xcfd6d2, .85)); const sun = new THREE.DirectionalLight(0xffffff, .7); sun.position.set(-5, 10, 6); s.add(sun);
    sol(s, texA); const f = mur_fautif(); murs(s, fuite ? f.i : -1, 1.25);
    const nrm = vagues();
    const mat = new THREE.MeshPhongMaterial({ color: '#2F6FD6', transparent: true, opacity: .52, shininess: 140, specular: new THREE.Color('#E8F0FF'), normalMap: nrm, normalScale: new THREE.Vector2(.55, .55), depthWrite: false });
    const vol = new THREE.Group(); s.add(vol);
    for (const rm of G.rooms) if (!/loggia|balcon|terrasse/i.test(rm.id + rm.n)) vol.add(new THREE.Mesh(extrude(rm.p, 1), mat));
    vol.position.y = .005; vol.scale.y = .001;
    let flaque, ronds = [], a;
    if (fuite) {
      flaque = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat); flaque.rotation.x = -Math.PI / 2; flaque.position.set(f.x + f.ox * .5, .012, f.z + f.oz * .5); s.add(flaque);
      const rm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
      for (let i = 0; i < 3; i++) { const o = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 64), rm.clone()); o.rotation.x = -Math.PI / 2; o.position.set(f.x + f.ox * .5, .02, f.z + f.oz * .5); s.add(o); ronds.push(o); }
      a = anneau(s, f, 1.32);
    }
    return { ...B, draw(k, t) {
      nrm.offset.set(t * .00004, t * .000025);
      if (fuite) {
        vol.scale.y = Math.max(.001, .14 * ease(clamp(k / .3, 0, 1)));
        const rr = .15 + 4.4 * ease(clamp((k - .06) / .94, 0, 1)); flaque.scale.set(rr * 1.2, rr, 1);
        ronds.forEach((o, i) => { const ph = ((t / 1600) + i / 3) % 1; o.scale.setScalar(.2 + ph * rr * .9); o.material.opacity = k > .1 ? (1 - ph) * .5 : 0; });
        a.material.opacity = k > .25 ? .6 + .4 * Math.sin(t / 170) : 0;
      } else vol.scale.y = Math.max(.001, .95 * ease(clamp(k, 0, 1)));
      B.r.render(s, B.cam);
    } };
  }

  /* ---------- la boîte noire ---------- */
  function noir(canvas, fuite) {
    const B = base3d(canvas, { shadows: true, bg: '#050606' }), { s } = B; B.r.outputEncoding = THREE.LinearEncoding;
    const amb = new THREE.AmbientLight(0xffffff, .04); s.add(amb);
    const [X0, X1, Z0, Z1] = G.frame;
    const f0 = mur_fautif();
    const soleil = (x, y, z) => { const l = new THREE.DirectionalLight('#FFE3B0', 0); l.position.set(x, y, z); l.target.position.set(B.cx, 0, B.cz); s.add(l, l.target);
      l.castShadow = true; l.shadow.mapSize.set(2048, 2048); const c = l.shadow.camera; c.left = -12; c.right = 12; c.top = 12; c.bottom = -12; c.near = .5; c.far = 60; l.shadow.bias = -.0005; return l; };
    // un soleil rasant face à la façade du mur fautif, un autre côté loggia : la lumière n'entre que par les baies
    const sun = soleil(f0.x + f0.ox * 10 + f0.oz * 2, 3.2, f0.z + f0.oz * 10 + f0.ox * 2), sun2 = soleil(B.cx - 1.5, 3.4, B.cz + 11);
    // dehors éteint (le noir ne reçoit pas la lumière) ; seuls les sols du logement la montrent
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#070808' })); g.rotation.x = -Math.PI / 2; g.position.y = -.02; s.add(g);
    const solM = new THREE.MeshLambertMaterial({ color: '#EDE7DA' });
    for (const rm of G.rooms) { const m = new THREE.Mesh(extrude(rm.p, .01), solM); m.receiveShadow = true; s.add(m); }
    const f = mur_fautif(); murs(s, fuite ? f.i : -1, 2.5, true);
    // plafond : invisible depuis la caméra, mais il fait de l'ombre (la boîte est fermée)
    const outline = G.rooms.filter(r => !/loggia|balcon|terrasse/i.test(r.id + r.n)).map(r => r.p);
    for (const p of outline) { const c = new THREE.Mesh(extrude(p, .05), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); c.position.y = 2.5; c.castShadow = true; s.add(c); }
    const a = fuite ? anneau(s, f, 2.58) : null;
    return { ...B, draw(k, t) {
      const on = ease(clamp(k / .45, 0, 1)); sun.intensity = 2.4 * on; sun2.intensity = 1.8 * on; amb.intensity = .03;
      if (a) a.material.opacity = k > .5 ? .6 + .4 * Math.sin(t / 170) : 0;
      B.r.render(s, B.cam);
    } };
  }

  /* ---------- 2D : superposition, parcours ---------- */
  function svgPlan(box, withImg) {
    const [FX0, FX1, FZ0, FZ1] = G.frame, all = G.walls.flatMap(w => w.p);
    const X0 = Math.min(...all.map(p => p[0])) - .7, X1 = Math.max(...all.map(p => p[0])) + .7, Z0 = Math.min(...all.map(p => p[1])) - .7, Z1 = Math.max(...all.map(p => p[1])) + .7;
    const walls = G.walls.map(w => `<polygon points="${w.p.map(p => p.join(',')).join(' ')}"/>`).join('');
    box.innerHTML = `<svg class="lab2d" viewBox="${X0} ${Z0} ${X1 - X0} ${Z1 - Z0}" preserveAspectRatio="xMidYMid meet">
      <defs><clipPath id="lens"><circle r="1.25" cx="0" cy="0"/></clipPath></defs>
      ${withImg ? `<image href="${base}avant.jpg" x="${FX0}" y="${FZ0}" width="${FX1 - FX0}" height="${FZ1 - FZ0}"/>` : `<rect x="${X0}" y="${Z0}" width="${X1 - X0}" height="${Z1 - Z0}" fill="#fff"/>`}
      <g class="w">${walls}</g><g class="extra"></g></svg>`;
    return box.querySelector('svg');
  }
  function sup(box) {
    const svg = svgPlan(box, true), extra = svg.querySelector('.extra'), W = svg.querySelector('.w');
    W.setAttribute('class', 'w trace');
    const [X0, X1, Z0, Z1] = G.frame, rooms = G.rooms.filter(r => !/placard/i.test(r.n));
    extra.innerHTML = `<g class="lensg"><g clip-path="url(#lens)" class="lz"><rect x="-50" y="-50" width="100" height="100" fill="#fff"/><g class="lzi"><image href="${base}avant.jpg" x="${X0}" y="${Z0}" width="${X1 - X0}" height="${Z1 - Z0}"/>${svg.querySelector('.w').outerHTML.replace('class="w trace"', 'class="w on"')}</g></g><circle r="1.25" class="lensc"/><text class="lenst" y="1.75" text-anchor="middle"></text></g>`;
    const lens = extra.querySelector('.lensg'), lzi = extra.querySelector('.lzi'), lt = extra.querySelector('.lenst');
    return { draw(k, t) {
      W.classList.toggle('on', k > .02);
      if (k < .3) { lens.style.opacity = 0; return; }
      lens.style.opacity = 1;
      const n = rooms.length, u = clamp((k - .3) / .7, 0, .999) * n, i = Math.floor(u), fr = u - i;
      const a = rooms[i].at, b = rooms[Math.min(i + 1, n - 1)].at, m = fr < .7 ? 0 : ease((fr - .7) / .3);
      const x = a[0] + (b[0] - a[0]) * m, z = a[1] + (b[1] - a[1]) * m;
      lens.setAttribute('transform', `translate(${x} ${z})`);
      lzi.setAttribute('transform', `scale(2.2) translate(${-x} ${-z})`);
      const txt = rooms[m > .5 ? Math.min(i + 1, n - 1) : i].n + '  ✓'; if (lt.textContent !== txt) lt.textContent = txt;
    } };
  }
  function parcours(box) {
    const svg = svgPlan(box, false), extra = svg.querySelector('.extra');
    svg.querySelector('.w').setAttribute('class', 'w poche');
    // graphe pièces ↔ portes : une ouverture relie les deux pièces de part et d'autre de son milieu
    const dans = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const rooms = G.rooms, piece = (x, z) => rooms.findIndex(r => dans(r.p, x, z));
    const liens = [];
    const lie = (a, b, m) => { if (a >= 0 && b >= 0 && a !== b && !liens.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a))) liens.push({ a, b, m }); };
    for (const o of G.open) {
      const [[x1, z1], [x2, z2]] = o.p, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1) || 1, nx = -(z2 - z1) / L, nz = (x2 - x1) / L;
      for (const d of [.35, .6]) lie(piece(mx + nx * d, mz + nz * d), piece(mx - nx * d, mz - nz * d), [mx, mz]);
    }
    // passage ouvert : deux pièces qui se touchent sans cloison (3 cm de part et d'autre du bord, moins qu'une cloison)
    rooms.forEach((r, i) => r.p.forEach((q, k) => { const w = r.p[(k + 1) % r.p.length], mx = (q[0] + w[0]) / 2, mz = (q[1] + w[1]) / 2, L = Math.hypot(w[0] - q[0], w[1] - q[1]);
      if (L < .5) return; const nx = -(w[1] - q[1]) / L, nz = (w[0] - q[0]) / L;
      for (const sg of [1, -1]) { const j = piece(mx + nx * .03 * sg, mz + nz * .03 * sg); if (j >= 0 && j !== i && piece(mx - nx * .03 * sg, mz - nz * .03 * sg) === i) lie(i, j, [mx, mz]); } }));
    const dep = Math.max(0, rooms.findIndex(r => /entr/i.test(r.id + r.n)));
    const ent = G.open.find(o => o.k === 'entry'), pts = [];
    if (ent) { const [[x1, z1], [x2, z2]] = ent.p; pts.push([(x1 + x2) / 2, (z1 + z2) / 2]); }
    pts.push(rooms[dep].at); const vu = new Set([dep]), ordre = [dep];
    // chaque porte et chaque passage franchis au moins une fois : on entre dans la pièce voisine, on la visite si elle est nouvelle, on revient
    const pris = new Set();
    (function dfs(i) { liens.forEach((l, n) => { const j = l.a === i ? l.b : l.b === i ? l.a : -1; if (j < 0 || pris.has(n)) return; pris.add(n);
      pts.push(l.m, rooms[j].at); if (!vu.has(j)) { vu.add(j); ordre.push(j); dfs(j); } pts.push(l.m, rooms[i].at); }); })(dep);
    const d = 'M' + pts.map(p => p.join(' ')).join(' L');
    extra.innerHTML = `<path class="route" d="${d}" pathLength="1"/>` + rooms.map((r, i) => `<g class="stop" data-i="${i}"><circle cx="${r.at[0]}" cy="${r.at[1]}" r=".28"/><text x="${r.at[0]}" y="${r.at[1] + .7}" text-anchor="middle">${r.n}</text></g>`).join('') + `<circle class="walker" r=".22"/>`;
    const route = extra.querySelector('.route'), walker = extra.querySelector('.walker'), stops = [...extra.querySelectorAll('.stop')], len = route.getTotalLength();
    return { draw(k) {
      const u = clamp(k, 0, 1); route.style.strokeDashoffset = 1 - u;
      const P = route.getPointAtLength(len * u); walker.setAttribute('cx', P.x); walker.setAttribute('cy', P.y);
      stops.forEach(g => { const r = rooms[+g.dataset.i]; if (Math.hypot(r.at[0] - P.x, r.at[1] - P.y) < .3) g.classList.add('ok'); });
      if (u >= 1) stops.forEach(g => g.classList.add('ok'));
    }, reset() { stops.forEach(g => g.classList.remove('ok')); } };
  }
  function surf(box) {
    const rows = G.rooms.filter(r => !/placard/i.test(r.n));
    box.innerHTML = `<div class="labsurf"><div class="lh"><span>Pièce</span><span>Lu dans le plan</span><span>Écrit sur le plan</span><span></span></div>${rows.map((r, i) => `<div class="lr" style="--i:${i}"><span>${r.n}</span><span class="num">${r.a} m²</span><span class="num">${r.a} m²</span><span class="ck">Identique</span></div>`).join('')}<div class="lr tot" style="--i:${rows.length}"><span>Surface habitable</span><span class="num">${G.facts.surface} m²</span><span class="num">${G.facts.surface} m²</span><span class="ck">Identique</span></div></div>`;
    const lr = [...box.querySelectorAll('.lr')];
    return { draw(k) { lr.forEach((e, i) => e.classList.toggle('on', k * (lr.length + 1) > i + .5)); } };
  }

  /* ---------- fenêtre ---------- */
  async function ouvrir(id) {
    if (!window.THREE) return;
    G = G || await (await fetch(base + 'geo.json')).json();
    texA = texA || await new Promise(res => new THREE.TextureLoader().load(base + 'apres.jpg', t => { t.encoding = THREE.sRGBEncoding; res(t); }, undefined, () => res(null)));
    modal = document.createElement('div'); modal.className = 'labo'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Labo de contrôle');
    modal.innerHTML = `<div class="labo-box">
      <button class="labo-x" type="button" aria-label="Fermer">×</button>
      <div class="labo-top"><span class="labo-k">Labo de contrôle</span><p>Avant de vous être envoyé, chaque logement passe des dizaines de contrôles automatiques. En voici cinq, sur notre logement de démonstration.</p></div>
      <div class="labo-tabs" role="tablist">${Object.entries(TESTS).map(([k, v]) => `<button role="tab" data-k="${k}">${v.t}</button>`).join('')}</div>
      <div class="labo-body"></div>
      <div class="labo-foot"><button class="btn" type="button" data-rejouer>Rejouer</button><span class="labo-note">Illustration des contrôles réellement passés par chaque visite, sur un vrai logement.</span></div>
    </div>`;
    document.body.appendChild(modal); document.body.style.overflow = 'hidden';
    const body = modal.querySelector('.labo-body');
    let parts = [], t0 = 0, raf = 0, dur = 4200;
    const stop = () => { cancelAnimationFrame(raf); parts.forEach(p => p.dispose && p.dispose()); parts = []; };
    function show(k) {
      stop(); courant = k; const T = TESTS[k];
      modal.querySelectorAll('.labo-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
      const duo = !!T.duo;
      body.innerHTML = `<div class="labo-head"><h2>${T.h}</h2><p>${T.p}</p></div>` + (duo
        ? `<div class="labo-duo"><figure class="bad"><canvas></canvas><figcaption><b>${T.duo[0]}</b><span class="st">En cours…</span></figcaption></figure><figure class="good"><canvas></canvas><figcaption><b>${T.duo[1]}</b><span class="st">En cours…</span></figcaption></figure></div>`
        : `<figure class="labo-one"><div class="stage"></div><figcaption><b>${k === 'surf' ? 'Surfaces écrites sur le plan' : 'Logement de démonstration'}</b><span class="st">En cours…</span></figcaption></figure>`);
      const sts = [...body.querySelectorAll('.st')];
      if (duo) { const [a, b] = body.querySelectorAll('canvas'); const mk = k === 'eau' ? eau : noir; parts = [mk(a, true), mk(b, false)]; dur = k === 'noir' ? 3600 : 4200; }
      else { const st = body.querySelector('.stage'); parts = [(k === 'sup' ? sup : parcours)(st)]; dur = k === 'sup' ? 9000 : k === 'parcours' ? 8000 : 3500; }
      const fin = { eau: ['Fuite détectée : à corriger', 'Aucune fuite : validé'], noir: ['Lumière parasite : à corriger', 'Aucune lumière parasite : validé'],
        sup: [null, 'Superposition conforme, pièce par pièce'], parcours: [null, 'Toutes les pièces atteintes'], surf: [null, 'Surfaces identiques au tableau'] }[k];
      const seuil = { eau: .28, noir: .55 }[k] || 1;
      t0 = performance.now(); parts.forEach(p => p.reset && p.reset());
      (function frame(now) {
        const kk = R ? 1 : clamp((now - t0) / dur, 0, 1);
        parts.forEach(p => p.draw(kk, now));
        const set = (el, txt, c) => { if (el && el.textContent !== txt) { el.textContent = txt; el.className = 'st ' + c; } };
        if (duo) { set(sts[0], kk < seuil ? 'En cours…' : fin[0], kk < seuil ? '' : 'ko'); set(sts[1], kk < 1 ? 'En cours…' : fin[1], kk < 1 ? '' : 'ok'); }
        else set(sts[0], kk < 1 ? 'En cours…' : fin[1], kk < 1 ? '' : 'ok');
        raf = requestAnimationFrame(frame);
      })(performance.now());
    }
    const fermer = () => { stop(); modal.remove(); modal = null; document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', esc);
    modal.querySelector('.labo-x').addEventListener('click', fermer);
    modal.addEventListener('click', e => { if (e.target === modal) fermer(); });
    modal.querySelector('[data-rejouer]').addEventListener('click', () => show(courant));
    modal.querySelectorAll('.labo-tabs button').forEach(b => b.addEventListener('click', () => show(b.dataset.k)));
    show(id in TESTS ? id : 'eau'); modal.querySelector('.labo-x').focus();
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-labo]'); if (!a) return;
    e.preventDefault(); if (a.dataset.base) base = a.dataset.base; if (!modal) ouvrir(a.dataset.labo);
  });
})();
