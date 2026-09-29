/* Mesures sur les panoramas (appelées par moteur/pano.mjs) : ce que l'occlusion ambiante doit montrer, lu dans l'image rendue.
   - Escaliers : chaque contremarche vue d'un arrêt se distingue du mur voisin (8 % d'écart de luminance au moins). Sans occlusion, les
     contremarches blanches se confondaient avec le mur blanc et les girons semblaient flotter (duplex 3081 : 2 % d'écart).
   - Angles des pièces : chaque angle rentrant vu à moins de 4 m se voit, par un saut de luminance d'un mur à l'autre (5 sur 255) ou par
     l'ombre du coin (3 sur 255 plus sombre au ras de l'angle qu'à 15 cm) ; sans occlusion, une pièce était un aplat sans arête.
   Les points sont projetés dans l'équirectangulaire (lacet, tangage depuis l'œil) et lus sur 5 × 5 pixels du rendu de 2048. */
export async function preparer({ page, D, stops, O3, angles, portes }) {
  // points à lire, par arrêt : { type, groupe, P (monde) } ; seuls ceux que l'œil voit vraiment (le rayon s'arrête à 3 cm du point visé)
  const parArret = {};
  for (const s of stops) {
    await portes(s);
    const pts = await page.evaluate((s, o) => {
      const { THREE, scene } = __v, out = [], lv = s.level, y0 = __v.levels[lv].y, id = r => r && (r.of || r.id);
      const vis = ob => { for (let x = ob; x; x = x.parent) if (!x.visible) return false; return true; };
      const rc = new THREE.Raycaster(), O = new THREE.Vector3(...o);
      // le point P est-il la première surface rencontrée (à 4 cm près) depuis l'œil, en direction de C (C : P décalé vers la surface) ?
      const surface = (P, C) => { const d = new THREE.Vector3(...C).sub(O), L = new THREE.Vector3(...P).sub(O).length(); d.normalize(); rc.set(O, d); rc.near = 0.05; rc.far = L + 0.3;
        const h = rc.intersectObjects(scene.children, true).find(h => (h.object.isMesh || h.object.isInstancedMesh) && vis(h.object) && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5));
        return h && Math.abs(h.distance - L) < 0.04; };
      __v.cullRestore && __v.cullRestore(); scene.updateMatrixWorld(true);
      // escaliers du niveau (volée qui part de ce niveau) : contremarche i, mur contre lequel la volée est posée
      for (const st of App.D.stairs || []) {
        if (st.from !== lv || !st.sides) continue;
        const g = st.going, h = st.rise, w2 = st.width / 2;
        for (const sg of [1, -1]) if (st.sides[sg]) for (let i = 2; i < st.n - 1; i++) {
          const y = y0 + (i + 0.5) * h, r = App.stairPt(st, i * g - 0.002, sg * (w2 - 0.2)), m = App.stairPt(st, i * g - g / 2, sg * (w2 + 0.004));
          const R = [r[0], y, r[1]], Mw = [m[0], y, m[1]];
          if (Math.hypot(R[0] - o[0], R[2] - o[2]) > 6) continue;
          const Rc = App.stairPt(st, i * g + 0.02, sg * (w2 - 0.2)), Mc = App.stairPt(st, i * g - g / 2, sg * (w2 + 0.05));
          if (surface(R, [Rc[0], y, Rc[1]]) && surface(Mw, [Mc[0], y, Mc[1]])) out.push({ type: 'marche', groupe: `${st.id}-${i}`, P: R }, { type: 'mur', groupe: `${st.id}-${i}`, P: Mw });
        }
      }
      // angles rentrants de la pièce de l'arrêt (sommets à 90° du polygone, côtés de 40 cm au moins), à moins de 4 m
      const R = App.D.rooms.find(r => r.id === s.room);
      if (R && R.poly.length >= 4) {
        const P = R.poly, n = P.length; let aire = 0; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; aire += a[0] * b[1] - b[0] * a[1]; }
        for (let i = 0; i < n; i++) {
          const a = P[(i + n - 1) % n], c = P[i], b = P[(i + 1) % n], e1 = [a[0] - c[0], a[1] - c[1]], e2 = [b[0] - c[0], b[1] - c[1]], l1 = Math.hypot(...e1), l2 = Math.hypot(...e2);
          if (l1 < 0.4 || l2 < 0.4) continue;
          const u1 = [e1[0] / l1, e1[1] / l1], u2 = [e2[0] / l2, e2[1] / l2], cr = u1[0] * u2[1] - u1[1] * u2[0];
          if (Math.abs(u1[0] * u2[0] + u1[1] * u2[1]) > 0.2 || cr * aire > 0) continue; // angle droit, rentrant (vu de l'intérieur)
          if (Math.hypot(c[0] - o[0], c[1] - o[2]) > 4) continue;
          const pt = (d1, d2, y) => [c[0] + u1[0] * d1 + u2[0] * d2, y, c[1] + u1[1] * d1 + u2[1] * d2];
          for (const hy of [1.0, 1.3]) {
            const y = y0 + hy, A1 = pt(0.15, 0.003, y), A2 = pt(0.003, 0.15, y), C = pt(0.02, 0.02, y);
            const ok = [[A1, pt(0.15, -0.05, y)], [A2, pt(-0.05, 0.15, y)], [C, pt(-0.03, -0.03, y)]].every(([p, q]) => surface(p, q));
            if (ok && id(__v.roomAtLv(c[0] + (u1[0] + u2[0]) * 0.1, c[1] + (u1[1] + u2[1]) * 0.1, lv)) === s.room) out.push({ type: 'mur1', groupe: `coin-${i}-${hy}`, P: A1 }, { type: 'mur2', groupe: `coin-${i}-${hy}`, P: A2 }, { type: 'coin', groupe: `coin-${i}-${hy}`, P: C });
          }
        }
      }
      return out;
    }, s, O3(s));
    parArret[s.id] = pts;
  }
  return {
    async mesurer(s, pb, mesures) {
      const pts = parArret[s.id]; if (!pts || !pts.length) return;
      const L = await page.evaluate(d => __pano.lire(d), pts.map(p => { const a = angles(O3(s), p.P); return [a.lacet, a.tangage]; }));
      const grp = {}; pts.forEach((p, i) => { if (L[i] != null) (grp[p.groupe] ||= {})[p.type] = L[i]; });
      const marches = [], coins = [];
      for (const [g, v] of Object.entries(grp)) {
        if (v.marche != null && v.mur != null) marches.push({ g, e: Math.abs(v.marche - v.mur) / Math.max(v.marche, v.mur, 1) });
        if (v.mur1 != null && v.mur2 != null && v.coin != null) coins.push({ g, saut: Math.abs(v.mur1 - v.mur2), creux: (v.mur1 + v.mur2) / 2 - v.coin });
      }
      const m = (mesures.image ||= {})[s.id] = {};
      if (marches.length) {
        const ecarts = marches.map(x => x.e).sort((a, b) => a - b), med = ecarts[ecarts.length >> 1];
        m.contremarches = { n: marches.length, ecart_median: +med.toFixed(3), ecart_min: +ecarts[0].toFixed(3) };
        if (med < 0.08) pb(`${s.label} : contremarches confondues avec le mur (écart de luminance médian ${(med * 100).toFixed(0)} %, 8 % au moins)`);
      }
      if (coins.length) {
        const ratés = coins.filter(c => c.saut < 5 && c.creux < 3);
        m.angles = { n: coins.length, sans_arete: ratés.length, saut_median: +coins.map(c => c.saut).sort((a, b) => a - b)[coins.length >> 1].toFixed(1), creux_median: +coins.map(c => c.creux).sort((a, b) => a - b)[coins.length >> 1].toFixed(1) };
        if (ratés.length > coins.length / 3) pb(`${s.label} : angles des murs invisibles (${ratés.length} sur ${coins.length} sans arête ni ombre)`);
      }
    },
  };
}
