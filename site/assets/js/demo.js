/* Démo du vrai moteur (demo/plans/<id>/), pilotée par les onglets de la section #demo.
   Le moteur se charge invisible dès que la section approche : il n'est montré qu'une fois sorti de sa galerie et placé dans le bon
   mode (jamais d'écran intermédiaire ni de galerie visible). Le 360° est la visionneuse légère du logement. */
(function () {
  const screen = document.getElementById('screen'); if (!screen) return;
  const PLAN = screen.dataset.plan || (window.SITE_BASE || '') + 'demo/plans/d201-f14b3e4b/';
  const poster = document.getElementById('poster'), still = document.getElementById('still'), txt = document.getElementById('demo-txt');
  const TXT = {
    source: '<b>Plan importé.</b> Le plan tel que vous l’avez, en PDF ou en image : c’est tout ce qu’il faut.',
    plan: '<b>Plan 2D.</b> Redessiné au propre, avec les cotes et la surface de chaque pièce. Cliquez dans une pièce pour y entrer.',
    maquette: '<b>Maquette 3D.</b> Faites tourner le logement, zoomez, double-cliquez dans une pièce pour y entrer.',
    visite: '<b>Visite 3D.</b> Glissez pour regarder, cliquez pour avancer, cliquez sur une porte pour l’ouvrir.',
    '360': '<b>Visite 360°.</b> Chaque pièce en panorama, d’arrêt en arrêt. Léger et fluide, même sur téléphone.',
    ultra: '<b>Ultra réaliste.</b> Matières, lumière du jour, ciel et paysage : l’ambiance la plus proche du réel.',
    ...(window.DEMO_TXT || {}),
  };
  const loader = document.createElement('div'); loader.className = 'loading'; loader.innerHTML = '<i></i>Chargement de la visite…'; loader.hidden = true; screen.appendChild(loader);
  let frame = null, pano = null, cur = 'maquette', ready = null, shown = false;

  function engine() {
    if (frame) return ready;
    frame = document.createElement('iframe'); frame.title = 'Démo de la visite'; frame.src = PLAN + 'index.html'; frame.className = 'hide'; frame.setAttribute('allow', 'fullscreen');
    screen.appendChild(frame);
    ready = new Promise(res => frame.addEventListener('load', () => {
      const w = frame.contentWindow; let n = 0;
      (function wait() {
        if (w.App && w.App.leaveGallery && w.__v) {
          // un seul menu : les onglets du site pilotent le moteur, sa propre barre d'outils est masquée
          const st = w.document.createElement('style'); st.textContent = '.topbar{display:none!important}'; w.document.head.appendChild(st);
          try { w.App.leaveGallery(); w.App.set('mode', 'orbit'); } catch (e) {} setTimeout(() => res(w), 1200);
        }
        else if (n++ < 200) setTimeout(wait, 100);
      })();
    }));
    return ready;
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { engine(); o.disconnect(); } }, { rootMargin: '900px' }).observe(screen);

  async function show(t) {
    cur = t;
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t));
    txt.innerHTML = TXT[t]; poster.hidden = true;
    still.hidden = t !== 'source'; if (t === 'source') { loader.hidden = true; return; }
    if (t === '360') {
      loader.hidden = true; if (frame) frame.hidden = true;
      if (!pano) { pano = document.createElement('iframe'); pano.title = 'Visite 360°'; pano.src = PLAN + 'pano/index.html'; screen.appendChild(pano); }
      pano.hidden = false; return;
    }
    if (pano) pano.hidden = true;
    if (!shown) loader.hidden = false;
    const w = await engine(); if (cur !== t) return;
    try {
      w.App.set('rendu', t === 'ultra' ? 'ultra' : 'simple');
      w.App.set('mode', t === 'plan' ? 'plan' : t === 'maquette' ? 'orbit' : 'walk');
    } catch (e) {}
    setTimeout(() => { if (cur !== t) return; frame.className = ''; frame.hidden = false; loader.hidden = true; shown = true; }, shown ? 0 : 600);
  }
  poster.addEventListener('click', () => show(cur));
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => show(b.dataset.t)));
  window.demoShow = show;
})();

/* Mini visualiseur 360° des cartes (.pano360[data-pano]) : sphère texturée par le panorama équirectangulaire, rotation lente,
   glisser pour regarder. Démarré quand la carte devient visible, en pause hors de l'écran. */
(function () {
  if (!window.THREE) return;
  const R = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  document.querySelectorAll('.pano360[data-pano]').forEach(box => {
    const canvas = box.querySelector('canvas');
    let visible = false, r = null, s, cam, lon = +(box.dataset.lon || 0), lat = -4, drag = null, raf = 0;
    function init() {
      r = new THREE.WebGLRenderer({ canvas, antialias: true }); r.outputEncoding = THREE.sRGBEncoding; r.setPixelRatio(Math.min(devicePixelRatio, 2));
      s = new THREE.Scene(); cam = new THREE.PerspectiveCamera(72, 1, .1, 100);
      const g = new THREE.SphereGeometry(10, 64, 40); g.scale(-1, 1, 1);
      const tex = new THREE.TextureLoader().load((window.SITE_BASE || '') + box.dataset.pano, t => { t.encoding = THREE.sRGBEncoding; });
      s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex })));
      const size = () => { const W = box.clientWidth, H = box.clientHeight; if (!W) return; r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
      size(); new ResizeObserver(size).observe(box);
      box.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, lon, lat }; box.setPointerCapture(e.pointerId); box.classList.add('grab'); });
      box.addEventListener('pointermove', e => { if (drag) { lon = drag.lon - (e.clientX - drag.x) * .18; lat = clamp(drag.lat + (e.clientY - drag.y) * .15, -60, 60); } });
      const up = () => { drag = null; box.classList.remove('grab'); };
      box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    }
    function tick() {
      if (!visible) { raf = 0; return; }
      if (!drag && !R) lon += .045;
      const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon);
      cam.lookAt(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      r.render(s, cam); raf = requestAnimationFrame(tick);
    }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { if (!r) init(); if (!raf) raf = requestAnimationFrame(tick); } }, { rootMargin: '200px' }).observe(box);
  });
})();
