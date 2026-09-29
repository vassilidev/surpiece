/* Animation « du plan de vente à la visite », jouée sur un vrai logement (demo/geo.json, repère du plan.json en mètres).
   Étapes : dépôt du PDF, analyse (balayage, murs, ouvertures, pièces, cotes), plan 2D redessiné, murs qui montent du plan
   pendant que la caméra bascule, descente dans le séjour jusqu'au cadrage exact de la photo du moteur, fondu sur la photo.
   Tout l'état est calculé à partir du temps écoulé : on peut rejouer, sauter à la fin (mouvement réduit), sans dérive. */
(function () {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const fr = (v, d) => v.toFixed(d).replace('.', ',');

  // temps clés (ms) ; le dépôt dure DND ms quand il est joué
  const DND = 2600;
  const K = {
    plan: 0, scan: 400, walls: 400, open: 1500, rooms: 2500, dims: 3700, redraw: 4700, poche: 4900,
    rise0: 6000, rise1: 8000, floor0: 6600, floor1: 7900, drift1: 9600, fly0: 9700, fly1: 12200, photo0: 11600, photo1: 12500, end: 14600,
  };

  async function Cinema(el, opt) {
    opt = opt || {};
    const base = opt.base || (window.SITE_BASE || '') + 'demo/';
    const R = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const G = await (await fetch(base + 'geo.json')).json();
    const [X0, X1, Z0, Z1] = G.frame, FW = Z1 - Z0, FH = X1 - X0; // à l'écran : l'axe z du plan va vers la droite, x vers le haut
    const S = (x, z) => [(z - Z0).toFixed(3), (X1 - x).toFixed(3)]; // point du plan → repère de l'écran (plan tourné d'un quart de tour)
    const P = pts => pts.map(p => S(p[0], p[1]).join(',')).join(' ');

    /* ---------- calques du DOM ---------- */
    const walls = G.walls.map(w => `<polygon class="w" pathLength="3" points="${P(w.p)}"/>`).join('');
    const rooms = G.rooms.map((r, i) => `<polygon class="r" style="--i:${i}" points="${P(r.p)}"/>`).join('');
    const labels = G.rooms.map((r, i) => { const [u, v] = S(r.at[0], r.at[1]);
      return `<g class="lab" style="--i:${i}"><text x="${u}" y="${v}" class="ln">${r.n}</text><text x="${u}" y="${(+v + .42).toFixed(3)}" class="la">${r.a} m²</text></g>`; }).join('');
    const opens = G.open.map((o, i) => { const [a, b] = [S(o.p[0][0], o.p[0][1]), S(o.p[1][0], o.p[1][1])];
      return `<line class="o" style="--i:${i}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }).join('');
    const dims = G.dims.filter(d => ['6.47', '2.80', '3.38', '4.46', '2.90'].includes(d[4])).map(d => {
      const [a, b] = [S(d[0], d[1]), S(d[2], d[3])], mu = (+a[0] + +b[0]) / 2, mv = (+a[1] + +b[1]) / 2, vert = Math.abs(a[0] - b[0]) < .01;
      return `<g class="d"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><text x="${mu}" y="${mv}" dy="-.07"${vert ? ` transform="rotate(-90 ${mu} ${mv})"` : ''}>${d[4].replace('.', ',')}</text></g>`; }).join('');
    el.classList.add('cine');
    el.innerHTML = `
      <canvas></canvas>
      <svg class="ov" viewBox="0 0 ${FW} ${FH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g class="rs">${rooms}</g><g class="ws">${walls}</g><g class="os">${opens}</g><g class="ds">${dims}</g><g class="ls">${labels}</g>
      </svg>
      <div class="scan"></div>
      <img class="photo" src="${base}visite.jpg" alt="">
      <div class="zone"><b>Glissez votre plan de vente ici</b><small>PDF ou image</small></div>
      <div class="file"><img src="${base}avant.jpg" alt=""><span>plan-de-vente-${G.facts.type}.pdf</span></div>
      <svg class="cursor" viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.3 L17.5 13.3 Z"/></svg>
      <div class="chip"></div><div class="clock">0:00</div>
      <div class="meter" aria-hidden="true">
        <div><span>Échelle</span><b data-m="ech">—</b></div><div><span>Murs</span><b data-m="walls">0</b></div>
        <div><span>Portes et fenêtres</span><b data-m="open">0</b></div><div><span>Cotes lues</span><b data-m="dims">0</b></div>
        <div><span>Surfaces</span><b data-m="rooms">0/${G.rooms.length}</b></div>
      </div>
      <div class="hud"><span>Dépôt</span><span>Analyse</span><span>Plan 2D</span><span>Maquette 3D</span><span>Visite</span></div>
      <button class="replay" type="button">Rejouer</button>
      <div class="end"><b>Votre visite est prête.</b>${opt.endHtml || ''}</div>`;
    const q = s => el.querySelector(s);
    const canvas = q('canvas'), ov = q('.ov'), scan = q('.scan'), photo = q('.photo'), zone = q('.zone'), file = q('.file'), cur = q('.cursor');
    const chip = q('.chip'), clock = q('.clock'), meter = q('.meter'), end = q('.end'), hud = [...el.querySelectorAll('.hud span')];
    const M = n => q(`[data-m="${n}"]`);

    /* ---------- scène 3D ---------- */
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { renderer = null; }
    if (!renderer) { el.classList.add('no3d'); }
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#EDEFEA');
    if (renderer) { renderer.outputEncoding = THREE.sRGBEncoding; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); }
    const tl = new THREE.TextureLoader();
    const tex = src => new Promise(res => tl.load(src, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; res(t); }, undefined, () => res(null)));
    const [tA, tB] = await Promise.all([tex(base + 'avant.jpg'), tex(base + 'apres.jpg')]);
    const cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
    const sheet = (map, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(FH, FW), new THREE.MeshBasicMaterial({ map, color: map ? 0xffffff : 0xffffff, transparent: true }));
      m.rotation.x = -Math.PI / 2; m.position.set(cx, y, cz); scene.add(m); return m; };
    const fA = sheet(tA, 0), fW = sheet(null, .002), fB = sheet(tB, .004);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd9dcd6, .95); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, .45); sun.position.set(-8, 14, -5); scene.add(sun);
    const wallG = new THREE.Group(); scene.add(wallG);
    const capM = new THREE.MeshBasicMaterial({ color: '#161918' }), sideM = new THREE.MeshLambertMaterial({ color: '#F4F5F1' });
    const edgeM = new THREE.LineBasicMaterial({ color: '#161918', transparent: true, opacity: .35 });
    for (const w of G.walls) {
      const sh = new THREE.Shape(w.p.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: G.H, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      wallG.add(new THREE.Mesh(g, [capM, sideM]));
      wallG.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edgeM));
    }
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 400), persp = new THREE.PerspectiveCamera(8, 1, .05, 400);
    const target = new THREE.Vector3(cx, 0, cz);
    const [ex, ez, yaw, pitch, fov] = G.cam, eye = new THREE.Vector3(ex, 1.55, ez);
    const look = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    let W = 1, H = 1, visH = FH;
    function size() {
      W = el.clientWidth; H = el.clientHeight; if (!renderer || !W || !H) return;
      renderer.setSize(W, H, false); const a = W / H;
      // couvre le cadre comme l'image et le calque SVG (preserveAspectRatio slice)
      visH = a > FW / FH ? FW / a : FH; const visW = visH * a;
      ortho.left = -visW / 2; ortho.right = visW / 2; ortho.top = visH / 2; ortho.bottom = -visH / 2; ortho.updateProjectionMatrix();
      persp.aspect = a; persp.updateProjectionMatrix();
    }
    new ResizeObserver(size).observe(el); size();

    // caméra en vue d'en haut puis basculée : l'écran garde « +x du plan vers le haut », comme le calque SVG
    const orthoPose = (el_, az, zoom) => {
      const d = 60, h = new THREE.Vector3(Math.cos(az), 0, Math.sin(az)); // direction « avant » horizontale (az = 0 : +x)
      ortho.position.copy(target).addScaledVector(h, -Math.cos(el_) * d).addScaledVector(new THREE.Vector3(0, 1, 0), Math.sin(el_) * d);
      ortho.up.set(0, 1, 0); if (el_ > 1.5705) ortho.up.copy(h);
      ortho.zoom = zoom; ortho.updateProjectionMatrix(); ortho.lookAt(target);
    };

    /* ---------- chronologie ---------- */
    let t0 = 0, raf = 0, dnd = opt.dnd !== false, done = false;
    const step = i => hud.forEach((h, k) => h.className = k < i ? 'done' : k === i ? 'now' : '');
    const cls = (c, on) => el.classList.toggle(c, on);
    const setChip = (h, s) => { const html = `${h}<small>${s}</small>`; if (chip.dataset.h !== html) { chip.dataset.h = html; chip.innerHTML = html; } };
    const count = (n, v) => { const s = String(v); if (M(n).textContent !== s) M(n).textContent = s; };

    function frame(now) {
      const T = R ? 1e9 : now - t0, d = dnd ? DND : 0, t = T - d;
      // dépôt
      cls('s-zone', t < 150); cls('s-file', dnd && T < DND - 100); cls('s-drag', dnd && T > 1300); cls('s-cursor', dnd && T > 300 && T < DND - 100); cls('s-hot', dnd && T > 1300 && t < 0); cls('s-drop', dnd && T > DND - 300);
      // analyse
      cls('s-plan', t >= K.plan); cls('s-scan', t >= K.scan && t < K.rooms); cls('s-walls', t >= K.walls); cls('s-open', t >= K.open);
      cls('s-rooms', t >= K.rooms && t < K.redraw + 600); cls('s-labels', t >= K.rooms && t < K.rise0 + 400); cls('s-dims', t >= K.dims && t < K.rise0);
      cls('s-poche', t >= K.poche); cls('s-ovoff', t >= K.rise0 + 200); cls('s-meter', t >= K.scan && t < K.redraw + 900);
      cls('s-photo', t >= K.photo0); cls('s-end', !opt.onEnd && t >= K.end);
      count('walls', Math.round(G.walls.length * ramp(t, K.walls, K.open)));
      count('open', Math.round(G.open.length * ramp(t, K.open, K.rooms)));
      count('dims', Math.round(G.dims.length * ramp(t, K.dims, K.redraw)));
      count('rooms', Math.round(G.rooms.length * ramp(t, K.rooms, K.dims)) + '/' + G.rooms.length);
      if (t >= K.scan + 300) count('ech', G.facts.ech);
      el.classList.toggle('s-okrooms', t >= K.dims);
      // puce et étapes
      if (t < 0) { step(0); setChip('Dépôt du plan', 'PDF ou image'); }
      else if (t < K.rooms) { step(1); setChip('Analyse du plan', `${G.facts.type} · échelle ${G.facts.ech}`); }
      else if (t < K.redraw) { step(1); setChip('Surfaces vérifiées', `${G.facts.surface} m² · comme écrit sur le plan`); }
      else if (t < K.rise0) { step(2); setChip('Plan 2D redessiné', 'coté, surfaces par pièce'); }
      else if (t < K.fly0) { step(3); setChip('Maquette 3D', 'les murs sortent du plan'); }
      else { step(4); setChip(G.rooms[0].n, `${G.rooms[0].a} m² · à hauteur d’yeux`); }
      const sec = Math.round(271 * ramp(t, 0, K.photo0)); clock.textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      // 3D
      if (renderer) {
        fW.material.opacity = ramp(t, K.redraw, K.redraw + 700);
        fB.material.opacity = ease(ramp(t, K.floor0, K.floor1));
        const rise = ease(ramp(t, K.rise0, K.rise1)), fly = ease(ramp(t, K.fly0, K.fly1));
        wallG.visible = t >= K.rise0 - 50;
        wallG.scale.y = Math.max(.002, lerp(.002, .48, rise) + (1 - .48) * ease(ramp(t, K.fly0 + 600, K.fly1)));
        const elev = lerp(Math.PI / 2, .66, rise), az = lerp(0, -.5, rise) - .22 * ramp(t, K.rise1, K.drift1), zoom = lerp(1, 1.12, rise);
        orthoPose(elev, az, zoom);
        let cam = ortho;
        if (fly > 0) {
          // passage en perspective : téléobjectif sur l'axe de la vue orthogonale, puis plongée vers la pièce de la photo,
          // en restant au-dessus des murs ; la vraie photo prend le relais en fondu (la maquette simplifiée n'a pas de plafond)
          const dir = ortho.position.clone().sub(target).normalize();
          const f0 = 6, far = (visH / zoom) / (2 * Math.tan(f0 * Math.PI / 360));
          const p0 = target.clone().addScaledVector(dir, far);
          const lh = new THREE.Vector3(look.x, 0, look.z).normalize();
          const p1 = eye.clone().addScaledVector(lh, -1.6).setY(4.2), t1 = eye.clone().addScaledVector(lh, 3.2).setY(.3);
          persp.fov = lerp(f0, 52, Math.pow(fly, .6)); persp.updateProjectionMatrix();
          persp.position.copy(p1).addScaledVector(p0.clone().sub(p1), Math.pow(1 - fly, 3));
          persp.up.set(0, 1, 0); persp.lookAt(target.clone().lerp(t1, Math.pow(fly, .8))); cam = persp;
        }
        renderer.render(scene, cam);
      }
      if (!R && t < K.end + 400) raf = requestAnimationFrame(frame);
      else if (!done) { done = true; if (opt.onEnd) opt.onEnd(); if (opt.loop && !R) setTimeout(run, 4500); }
    }
    function run() { cancelAnimationFrame(raf); done = false; t0 = performance.now(); raf = requestAnimationFrame(frame); }
    q('.replay').addEventListener('click', run);
    return { run, stop: () => cancelAnimationFrame(raf) };
  }
  window.Cinema = Cinema;
})();
