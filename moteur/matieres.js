/* Matières procédurales du moteur (parquet, carrelages, enduits, façades, abords) : bruit calculé pixel par pixel, sans fichier ni
   réseau. Module partagé : chargé en worker (plusieurs en parallèle, le fil principal reste libre) ou, à défaut, dans la page.
   genere(gen, p, q, [i, n]) → { W, H, y0, y1, col, rou, nor } : couleur, rugosité, normale (RGBA 8 bits) des lignes [y0, y1). p.q : résolution relative (1 = celle d'origine,
   0,5 = moitié : appareils modestes) ; à q = 1, les pixels sont exactement ceux d'avant. Aucune donnée ne dépend du plan sauf le
   carreau de loggia (p.lg) et la hauteur d'étage des façades (p.level). */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function Noise(seed) {
  const R = rng(seed), N = 512, t = new Float32Array(N * N); for (let i = 0; i < t.length; i++) t[i] = R();
  return (x, y, px, py) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = t[y0 * N + x0], b = t[y0 * N + x1], c = t[y1 * N + x0], d = t[y1 * N + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}
function fbm(n, x, y, px, py, oct) { let s = 0, a = 0.5, f = 1, w = 0; for (let o = 0; o < oct; o++) { s += a * n(x * f, y * f, px * f, py * f); w += a; a *= 0.5; f *= 2; } return s / w; }
const hash2 = (i, j, s = 0) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/* bande i sur n d'une matière ([i, n] : lignes [y0, y1) ; toute la matière par défaut) : couleur et rugosité des lignes de la bande, relief aussi sur
   la ligne d'au-dessus et d'en dessous (bords raccordés), pour la normale. Mêmes pixels, que la matière soit faite d'un coup ou par bandes */
let bande = null;
function genRaw(W, Hh, f, ns = 2) {
  const y0 = bande ? Math.floor(Hh * bande[0] / bande[1]) : 0, y1 = bande ? Math.floor(Hh * (bande[0] + 1) / bande[1]) : Hh, n = y1 - y0, o = [0, 0, 0, 0, 0];
  const col = new Uint8ClampedArray(W * n * 4), rou = new Uint8ClampedArray(W * n * 4), hgt = new Float32Array(W * (n + 2));
  for (let yy = -1; yy <= n; yy++) {
    const y = ((y0 + yy) % Hh + Hh) % Hh, inside = yy >= 0 && yy < n;
    for (let x = 0; x < W; x++) {
      f(x, y, o); hgt[(yy + 1) * W + x] = o[4]; if (!inside) continue;
      const j = (yy * W + x) * 4;
      col[j] = o[0] * 255; col[j + 1] = o[1] * 255; col[j + 2] = o[2] * 255; col[j + 3] = 255;
      const r = o[3] * 255; rou[j] = r; rou[j + 1] = r; rou[j + 2] = r; rou[j + 3] = 255;
    }
  }
  const nor = new Uint8ClampedArray(W * n * 4);
  for (let yy = 0; yy < n; yy++) for (let x = 0; x < W; x++) {
    const c = (yy + 1) * W, l = hgt[c + (x + W - 1) % W], r = hgt[c + (x + 1) % W], u = hgt[c - W + x], d = hgt[c + W + x];
    let nx = (l - r) * ns, ny = (d - u) * ns, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const j = (yy * W + x) * 4; nor[j] = (nx * 0.5 + 0.5) * 255; nor[j + 1] = (ny * 0.5 + 0.5) * 255; nor[j + 2] = (nz * 0.5 + 0.5) * 255; nor[j + 3] = 255;
  }
  return { W, H: Hh, y0, y1, col, rou, nor };
}
// résolution réduite : mêmes dimensions en mètres ; relief rapporté au pixel d'origine (même force de normale)
const GEN = {
  oak(q) { // stratifié chêne, lames 1,20 × 0,20 m
    const W = Math.round(1024 * q), n = Noise(11), n2 = Noise(12), R = rng(5), cols = 6, cw = W / cols, off = [], tone = [];
    for (let c = 0; c < cols; c++) { off.push(Math.floor(R() * W)); tone.push([0.9 + R() * 0.2, 0.9 + R() * 0.2, R(), R()]); }
    const Hh = 2 * W;
    return genRaw(W, Hh, (x, y, o) => {
      const c = Math.floor(x / cw), lx = x - c * cw, yy = (y - off[c] + Hh) % Hh, seg = yy < W ? 0 : 1, yl = yy - seg * W, t = tone[c][seg], sh = tone[c][2 + seg] * 7;
      const g = fbm(n, x / W * 48, yl / W * 2 + sh, 48, 2, 4);
      const ring = Math.pow(0.5 + 0.5 * Math.sin((lx / cw * 5 + 4 * fbm(n2, x / W * 6, yl / W * 1 + sh, 6, 1, 3) + c * 1.7) * Math.PI * 2), 5);
      const fine = n2(x / W * 256, yl / W * 16, 256, 16), dj = Math.min(lx, cw - lx), dy = Math.min(yl, W - yl), e = Math.min(dj, dy) / q;
      let k = t * (0.9 + 0.2 * (g - 0.5)) * (1 - 0.12 * ring) * (0.97 + 0.06 * fine); if (e < 1.4) k *= 0.55;
      o[0] = 0.80 * k; o[1] = 0.665 * k; o[2] = 0.50 * k; o[3] = e < 1.4 ? 0.85 : 0.48 + 0.18 * g; o[4] = smooth(0, 3, e) * (0.9 + 0.1 * g) - 0.04 * ring;
    }, 3 * q);
  },
  tiles(q, p) {
    const n = Noise(p.seed), W = Math.round(p.W * q), Hh = Math.round(W * p.rep[1] / p.rep[0]), ni = Math.round(p.rep[0] / p.tile[0]), nj = Math.round(p.rep[1] / p.tile[1]);
    return genRaw(W, Hh, (x, y, o) => {
      const xm = x / W * p.rep[0], ym = y / Hh * p.rep[1], j = Math.floor(ym / p.tile[1]), xs = xm + (p.stagger && j % 2 ? p.tile[0] / 2 : 0);
      const i = Math.floor(xs / p.tile[0]), lx = xs - i * p.tile[0], ly = ym - j * p.tile[1], e = Math.min(lx, p.tile[0] - lx, ly, p.tile[1] - ly), g2 = p.grout / 2;
      const h = hash2(((i % ni) + ni) % ni, ((j % nj) + nj) % nj, p.seed), spk = fbm(n, x / W * 64, y / Hh * 64 * p.rep[1] / p.rep[0], 64, Math.round(64 * p.rep[1] / p.rep[0]), 3);
      if (e < g2) { o[0] = p.groutC[0]; o[1] = p.groutC[1]; o[2] = p.groutC[2]; o[3] = p.rG; o[4] = 0; }
      else { const k = (1 + p.varA * (h - 0.5)) * (1 + p.speck * (spk - 0.5)); o[0] = p.base[0] * k; o[1] = p.base[1] * k; o[2] = p.base[2] * k; o[3] = p.rT + 0.08 * (spk - 0.5); o[4] = smooth(g2, g2 + 0.0025, e); }
    }, (p.ns || 2.5) * q);
  },
  render(q) { // enduit de façade, grain fin
    const W = Math.round(512 * q), n = Noise(21), n2 = Noise(22);
    return genRaw(W, W, (x, y, o) => {
      const big = fbm(n, x / W * 4, y / W * 4, 4, 4, 5), fine = n2(x / W * 180, y / W * 180, 180, 180);
      const k = 0.93 + 0.05 * (big - 0.5) + 0.05 * (fine - 0.5);
      o[0] = k; o[1] = k * 0.985; o[2] = k * 0.955; o[3] = 0.88 + 0.08 * (fine - 0.5); o[4] = 0.5 * fine + 0.2 * big;
    }, 1.6 * q);
  },
  paint(q) {
    const W = Math.round(512 * q), n = Noise(41);
    return genRaw(W, W, (x, y, o) => {
      const a = n(x / W * 64, y / W * 64, 64, 64), b = n(x / W * 128, y / W * 128, 128, 128), c = fbm(n, x / W * 4, y / W * 4, 4, 4, 3);
      const k = 0.985 + 0.02 * (c - 0.5) + 0.006 * (a - 0.5); o[0] = o[1] = o[2] = k; o[3] = 0.86 + 0.06 * (a - 0.5); o[4] = 0.5 * a + 0.5 * b;
    }, 0.9 * q);
  },
  facade(q, p) { // façades : modules de 3,00 m, une fenêtre par module et par niveau
    const LEVEL = p.level, W = Math.round(1024 * q), rw = 6.0, rh = LEVEL * 2, Hh = Math.round(W * rh / rw), n = Noise(71);
    return genRaw(W, Hh, (x, y, o) => {
      const xm = x / W * rw, ym = (1 - y / Hh) * rh, mod = Math.floor(xm / 3), lxm = xm - mod * 3, lev = Math.floor(ym / LEVEL), ly = ym - lev * LEVEL;
      const c = fbm(n, x / W * 16, y / Hh * 8, 16, 8, 3);
      let r = 0.86 + 0.05 * (c - 0.5), g = r * 0.98, b = r * 0.95, rough = 0.85;
      if (ly > 2.50) { r *= 0.9; g *= 0.9; b *= 0.9; }
      const a0 = 0.8, a1 = 2.2;
      if (lxm > a0 && lxm < a1 && ly > 0.6 && ly < 2.2) {
        const e = Math.min(lxm - a0, a1 - lxm, 2.2 - ly, ly - 0.6), hsh = hash2(mod, lev, 7), drop = hsh < 0.5 ? 0 : hsh < 0.75 ? 0.5 : 0.9;
        if (e < 0.05 || Math.abs(lxm - 1.5) < 0.025) { r = 0.8; g = 0.8; b = 0.79; rough = 0.45; }
        else if ((2.2 - ly) < drop * 1.6) { const s = (ly * 14) % 1, k = s < 0.8 ? 0.58 : 0.4; r = k; g = k * 1.01; b = k * 1.03; rough = 0.4; }
        else { const k = 0.08 + 0.07 * ((ly - 0.6) / 1.6) + 0.05 * hsh; r = k * 0.9; g = k; b = k * 1.12; rough = 0.08; }
      }
      o[0] = r; o[1] = g; o[2] = b; o[3] = rough; o[4] = 0.5;
    }, 0.5 * q);
  },
  foliage(q) { // feuillage : taches claires et sombres, relief de feuilles
    const W = Math.round(512 * q), n = Noise(91), n2 = Noise(92);
    return genRaw(W, W, (x, y, o) => {
      const a = fbm(n, x / W * 24, y / W * 24, 24, 24, 4), b = n2(x / W * 90, y / W * 90, 90, 90), c = smooth(0.35, 0.75, a) * 0.6 + b * 0.4;
      const k = 0.55 + 0.75 * c; o[0] = o[1] = o[2] = Math.min(1, k); o[3] = 0.9; o[4] = c;
    }, 4 * q);
  },
  grass(q) {
    const W = Math.round(512 * q), n = Noise(81), n2 = Noise(82);
    return genRaw(W, W, (x, y, o) => {
      const a = fbm(n, x / W * 8, y / W * 8, 8, 8, 5), b = n2(x / W * 96, y / W * 96, 96, 96), dirt = smooth(0.58, 0.72, a), k = 0.8 + 0.4 * b;
      o[0] = (0.20 * (1 - dirt) + 0.36 * dirt) * k; o[1] = (0.29 * (1 - dirt) + 0.31 * dirt) * k; o[2] = (0.13 * (1 - dirt) + 0.24 * dirt) * k; o[3] = 0.96; o[4] = b;
    }, 1.5 * q);
  },
};
/* liste des matières : clé, générateur, paramètres, répétition en mètres */
export function listeMatieres(lg, level) {
  return [
    ['oak', 'oak', {}, [1.2, 2.4]],
    ['gres', 'tiles', { W: 1024, rep: [0.9, 0.9], tile: [0.45, 0.45], grout: 0.003, base: [0.80, 0.78, 0.74], varA: 0.05, speck: 0.10, groutC: [0.62, 0.60, 0.57], rT: 0.42, rG: 0.9, seed: 3 }],
    ['faience', 'tiles', { W: 1024, rep: [0.6, 1.2], tile: [0.30, 0.60], grout: 0.002, base: [0.95, 0.95, 0.94], varA: 0.015, speck: 0.02, groutC: [0.86, 0.86, 0.85], rT: 0.14, rG: 0.8, seed: 4, ns: 4 }],
    ['loggia', 'tiles', { W: 1024, rep: [lg * 2, lg * 2], tile: [lg, lg], grout: 0.006, base: [0.66, 0.65, 0.62], varA: 0.08, speck: 0.35, groutC: [0.30, 0.30, 0.29], rT: 0.86, rG: 0.95, seed: 5, ns: 3 }],
    ['paving', 'tiles', { W: 512, rep: [1.2, 1.2], tile: [0.6, 0.3], grout: 0.006, base: [0.60, 0.59, 0.56], varA: 0.12, speck: 0.3, groutC: [0.3, 0.3, 0.29], rT: 0.9, rG: 1, seed: 6, stagger: true }],
    ['ext', 'render', {}, [2.0, 2.0]],
    ['paint', 'paint', {}, [0.5, 0.5]],
    ['facade', 'facade', { level }, [6.0, level * 2]],
    ['grass', 'grass', {}, [6, 6]],
    ['foliage', 'foliage', {}, [1.2, 1.2]],
  ].map(([cle, gen, p, rep]) => ({ cle, gen, p, rep: rep || p.rep, parts: { oak: 6, gres: 2, faience: 3, loggia: 2, facade: 2 }[cle] || 1 }));
}
export function genere(gen, p, q = 1, b = null) { bande = b; try { return GEN[gen](q, p); } finally { bande = null; } }
export { rng, hash2 }; // arbres du contexte (moteur)
// worker : { id, gen, p, q } → { id, W, H, col, rou, nor } (tableaux transférés, sans copie)
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = e => { const { id, gen, p, q, b } = e.data, r = genere(gen, p, q, b); self.postMessage({ id, ...r }, [r.col.buffer, r.rou.buffer, r.nor.buffer]); };
}
