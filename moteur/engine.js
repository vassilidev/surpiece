/* Moteur 3D générique : construit le logement décrit par plan.json (murs à tout angle, pièces polygonales). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const App = window.App;
App.engineStarting = true;
const D = await App.ready, S = App.state, GEO = App.geo, VV = GEO.V;
const H = D.H, EYE = 1.60;
const CTX = D.context || {}, LEVEL = CTX.level || 2.8;
const GROUND = -(D.etage || 0) * LEVEL - 0.15, ROOF = ((CTX.above ?? 1) + 1) * LEVEL - 0.02;
const [BX0, BX1, BZ0, BZ1] = GEO.bbox(D.outline);
// cadrage de la maquette, du soleil et du sol : le logement et ses loggias (le contour, lui, exclut la loggia)
const FR = GEO.bbox(D.outline.concat(...(D.loggias || []).map(l => l.slab)));
const CEN = [(FR[0] + FR[1]) / 2, (FR[2] + FR[3]) / 2], SPAN = Math.max(FR[1] - FR[0], FR[3] - FR[2]);
const sleep = () => new Promise(r => setTimeout(r, 0));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- Rendu ---------- */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: /shoot/.test(location.search) }); }
catch (e) { App.fail('WebGL n\'est pas disponible sur cet appareil.'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, App.coarse ? 1.5 : 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
const markShadows = () => { renderer.shadowMap.needsUpdate = true; };
renderer.toneMapping = THREE.AgXToneMapping;
RectAreaLightUniformsLib.init();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 600);
camera.rotation.order = 'YXZ';

/* ---------- Bruit et textures procédurales ---------- */
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
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texFrom(c, srgb, rep) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = maxAniso; t.repeat.set(1 / rep[0], 1 / rep[1]); return t; }
function genTex(W, Hh, rep, f, ns = 2, post) {
  const col = new Uint8ClampedArray(W * Hh * 4), rou = new Uint8ClampedArray(W * Hh * 4), hgt = new Float32Array(W * Hh), o = [0, 0, 0, 0, 0];
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    f(x, y, o); const i = y * W + x, j = i * 4;
    col[j] = o[0] * 255; col[j + 1] = o[1] * 255; col[j + 2] = o[2] * 255; col[j + 3] = 255;
    const r = o[3] * 255; rou[j] = r; rou[j + 1] = r; rou[j + 2] = r; rou[j + 3] = 255; hgt[i] = o[4];
  }
  if (post) post(col, rou, hgt, W, Hh);
  const nor = new Uint8ClampedArray(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const l = hgt[y * W + (x + W - 1) % W], r = hgt[y * W + (x + 1) % W], u = hgt[((y + Hh - 1) % Hh) * W + x], d = hgt[((y + 1) % Hh) * W + x];
    let nx = (l - r) * ns, ny = (d - u) * ns, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const j = (y * W + x) * 4; nor[j] = (nx * 0.5 + 0.5) * 255; nor[j + 1] = (ny * 0.5 + 0.5) * 255; nor[j + 2] = (nz * 0.5 + 0.5) * 255; nor[j + 3] = 255;
  }
  const put = arr => { const c = makeCanvas(W, Hh); c.getContext('2d').putImageData(new ImageData(arr, W, Hh), 0, 0); return c; };
  return { map: texFrom(put(col), true, rep), rough: texFrom(put(rou), false, rep), normal: texFrom(put(nor), false, rep) };
}
const T = {};
const GEN = {
  oak() { // stratifié chêne, lames 1,20 × 0,20 m
    const W = 1024, n = Noise(11), n2 = Noise(12), R = rng(5), cols = 6, cw = W / cols, off = [], tone = [];
    for (let c = 0; c < cols; c++) { off.push(Math.floor(R() * W)); tone.push([0.9 + R() * 0.2, 0.9 + R() * 0.2, R(), R()]); }
    const Hh = 2 * W;
    T.oak = genTex(W, Hh, [1.2, 2.4], (x, y, o) => {
      const c = Math.floor(x / cw), lx = x - c * cw, yy = (y - off[c] + Hh) % Hh, seg = yy < W ? 0 : 1, yl = yy - seg * W, t = tone[c][seg], sh = tone[c][2 + seg] * 7;
      const g = fbm(n, x / W * 48, yl / W * 2 + sh, 48, 2, 4);
      const ring = Math.pow(0.5 + 0.5 * Math.sin((lx / cw * 5 + 4 * fbm(n2, x / W * 6, yl / W * 1 + sh, 6, 1, 3) + c * 1.7) * Math.PI * 2), 5);
      const fine = n2(x / W * 256, yl / W * 16, 256, 16), dj = Math.min(lx, cw - lx), dy = Math.min(yl, W - yl), e = Math.min(dj, dy);
      let k = t * (0.9 + 0.2 * (g - 0.5)) * (1 - 0.12 * ring) * (0.97 + 0.06 * fine); if (e < 1.4) k *= 0.55;
      o[0] = 0.80 * k; o[1] = 0.665 * k; o[2] = 0.50 * k; o[3] = e < 1.4 ? 0.85 : 0.48 + 0.18 * g; o[4] = smooth(0, 3, e) * (0.9 + 0.1 * g) - 0.04 * ring;
    }, 3);
  },
  tiles(key, p) {
    const n = Noise(p.seed), W = p.W, Hh = Math.round(W * p.rep[1] / p.rep[0]), ni = Math.round(p.rep[0] / p.tile[0]), nj = Math.round(p.rep[1] / p.tile[1]);
    T[key] = genTex(W, Hh, p.rep, (x, y, o) => {
      const xm = x / W * p.rep[0], ym = y / Hh * p.rep[1], j = Math.floor(ym / p.tile[1]), xs = xm + (p.stagger && j % 2 ? p.tile[0] / 2 : 0);
      const i = Math.floor(xs / p.tile[0]), lx = xs - i * p.tile[0], ly = ym - j * p.tile[1], e = Math.min(lx, p.tile[0] - lx, ly, p.tile[1] - ly), g2 = p.grout / 2;
      const h = hash2(((i % ni) + ni) % ni, ((j % nj) + nj) % nj, p.seed), spk = fbm(n, x / W * 64, y / Hh * 64 * p.rep[1] / p.rep[0], 64, Math.round(64 * p.rep[1] / p.rep[0]), 3);
      if (e < g2) { o[0] = p.groutC[0]; o[1] = p.groutC[1]; o[2] = p.groutC[2]; o[3] = p.rG; o[4] = 0; }
      else { const k = (1 + p.varA * (h - 0.5)) * (1 + p.speck * (spk - 0.5)); o[0] = p.base[0] * k; o[1] = p.base[1] * k; o[2] = p.base[2] * k; o[3] = p.rT + 0.08 * (spk - 0.5); o[4] = smooth(g2, g2 + 0.0025, e); }
    }, p.ns || 2.5);
  },
  render() { // enduit de façade, grain fin
    const W = 512, n = Noise(21), n2 = Noise(22);
    T.ext = genTex(W, W, [2.0, 2.0], (x, y, o) => {
      const big = fbm(n, x / W * 4, y / W * 4, 4, 4, 5), fine = n2(x / W * 180, y / W * 180, 180, 180);
      const k = 0.93 + 0.05 * (big - 0.5) + 0.05 * (fine - 0.5);
      o[0] = k; o[1] = k * 0.985; o[2] = k * 0.955; o[3] = 0.88 + 0.08 * (fine - 0.5); o[4] = 0.5 * fine + 0.2 * big;
    }, 1.6);
  },
  paint() {
    const W = 512, n = Noise(41);
    T.paint = genTex(W, W, [0.5, 0.5], (x, y, o) => {
      const a = n(x / W * 64, y / W * 64, 64, 64), b = n(x / W * 128, y / W * 128, 128, 128), c = fbm(n, x / W * 4, y / W * 4, 4, 4, 3);
      const k = 0.985 + 0.02 * (c - 0.5) + 0.006 * (a - 0.5); o[0] = o[1] = o[2] = k; o[3] = 0.86 + 0.06 * (a - 0.5); o[4] = 0.5 * a + 0.5 * b;
    }, 0.9);
  },
  facade() { // façades : modules de 3,00 m, une fenêtre par module et par niveau
    const W = 1024, rw = 6.0, rh = LEVEL * 2, Hh = Math.round(W * rh / rw), n = Noise(71);
    T.facade = genTex(W, Hh, [rw, rh], (x, y, o) => {
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
    }, 0.5);
  },
  foliage() { // feuillage : taches claires et sombres, relief de feuilles
    const W = 512, n = Noise(91), n2 = Noise(92);
    T.foliage = genTex(W, W, [1.2, 1.2], (x, y, o) => {
      const a = fbm(n, x / W * 24, y / W * 24, 24, 24, 4), b = n2(x / W * 90, y / W * 90, 90, 90), c = smooth(0.35, 0.75, a) * 0.6 + b * 0.4;
      const k = 0.55 + 0.75 * c; o[0] = o[1] = o[2] = Math.min(1, k); o[3] = 0.9; o[4] = c;
    }, 4);
  },
  ground() {
    const W = 512, n = Noise(81), n2 = Noise(82);
    T.grass = genTex(W, W, [6, 6], (x, y, o) => {
      const a = fbm(n, x / W * 8, y / W * 8, 8, 8, 5), b = n2(x / W * 96, y / W * 96, 96, 96), dirt = smooth(0.58, 0.72, a), k = 0.8 + 0.4 * b;
      o[0] = (0.20 * (1 - dirt) + 0.36 * dirt) * k; o[1] = (0.29 * (1 - dirt) + 0.31 * dirt) * k; o[2] = (0.13 * (1 - dirt) + 0.24 * dirt) * k; o[3] = 0.96; o[4] = b;
    }, 1.5);
  },
};
async function buildTextures() {
  const lg = (D.loggia && D.loggia.tile) || 0.5;
  const steps = [
    ['Parquet', () => GEN.oak()],
    ['Carrelage et faïence', () => {
      GEN.tiles('gres', { W: 1024, rep: [0.9, 0.9], tile: [0.45, 0.45], grout: 0.003, base: [0.80, 0.78, 0.74], varA: 0.05, speck: 0.10, groutC: [0.62, 0.60, 0.57], rT: 0.42, rG: 0.9, seed: 3 });
      GEN.tiles('faience', { W: 1024, rep: [0.6, 1.2], tile: [0.30, 0.60], grout: 0.002, base: [0.95, 0.95, 0.94], varA: 0.015, speck: 0.02, groutC: [0.86, 0.86, 0.85], rT: 0.14, rG: 0.8, seed: 4, ns: 4 });
      GEN.tiles('loggia', { W: 1024, rep: [lg * 2, lg * 2], tile: [lg, lg], grout: 0.006, base: [0.66, 0.65, 0.62], varA: 0.08, speck: 0.35, groutC: [0.30, 0.30, 0.29], rT: 0.86, rG: 0.95, seed: 5, ns: 3 });
      GEN.tiles('paving', { W: 512, rep: [1.2, 1.2], tile: [0.6, 0.3], grout: 0.006, base: [0.60, 0.59, 0.56], varA: 0.12, speck: 0.3, groutC: [0.3, 0.3, 0.29], rT: 0.9, rG: 1, seed: 6, stagger: true });
    }],
    ['Enduits et peintures', () => { GEN.render(); GEN.paint(); }],
    ['Façades et abords', () => { GEN.facade(); GEN.ground(); GEN.foliage(); }],
  ];
  for (let i = 0; i < steps.length; i++) { App.loader(`Matières : ${steps[i][0]}…`, 0.1 + 0.7 * i / steps.length); await sleep(); steps[i][1](); }
}

/* ---------- Matériaux (finitions de livraison supposées) ---------- */
const M = {};
const mk = (k, p = {}) => (M[k] = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0 }, p)));
function setTex(m, t, ns = 1, rough = 1) { m.map = t.map; m.roughnessMap = t.rough; m.normalMap = t.normal; m.normalScale.set(ns, ns); m.roughness = rough; }
function makeMaterials() {
  mk('wall_b', { color: 0xf2f2ef }); setTex(M.wall_b, T.paint, 0.25);
  mk('wall_c', { color: 0xf2f2ef }); setTex(M.wall_c, T.paint, 0.25);
  mk('ceiling', { color: 0xf8f7f3 }); setTex(M.ceiling, T.paint, 0.15);
  mk('floor_dry'); setTex(M.floor_dry, T.oak, 0.5);
  mk('floor_wet'); setTex(M.floor_wet, T.gres, 0.6);
  mk('faience'); setTex(M.faience, T.faience, 0.5);
  mk('plinthe', { color: 0xf4f3ef, roughness: 0.4 });
  mk('door_leaf', { color: 0xf2f1ed, roughness: 0.42 });
  mk('door_frame', { color: 0xf2f1ed, roughness: 0.42 });
  mk('frame', { color: 0xf0f0ee, roughness: 0.38 });
  mk('loggia_floor'); setTex(M.loggia_floor, T.loggia, 1.2);
  mk('ext', { color: 0xe8e4dc }); setTex(M.ext, T.ext, 0.4);
  mk('slab', { color: 0xc9c7c1 }); setTex(M.slab, T.ext, 0.5);
  mk('seuil', { color: 0x9a9c9c, metalness: 0.7, roughness: 0.35 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 1.4, ior: 1.5, thickness: 0.006 });
  mk('darkglass', { color: 0x1d2328, roughness: 0.06, metalness: 0.2 });
  mk('entry_leaf', { color: 0x4a4f53, roughness: 0.5 });
  mk('steel', { color: 0xbfc2c4, metalness: 1, roughness: 0.28 });
  mk('chrome', { color: 0xeeeeee, metalness: 1, roughness: 0.06, envMapIntensity: 4 }); M.steel.envMapIntensity = 3.5;
  M.ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f3, roughness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.06 });
  mk('tray', { color: 0xf2f1ee, roughness: 0.55 });
  mk('lacquer', { color: 0xecebe7, roughness: 0.35 });
  mk('mirror', { color: 0xffffff, metalness: 1, roughness: 0.015 });
  mk('bso', { color: 0x8f9396, metalness: 0.15, roughness: 0.55 });
  mk('rail', { color: 0x3a3d40, metalness: 0.6, roughness: 0.45 });
  mk('pvc', { color: 0x8c8f91, roughness: 0.6 });
  mk('facade'); setTex(M.facade, T.facade, 0.2);
  mk('ground', { color: 0xffffff }); setTex(M.ground, T.grass, 0.6);
  mk('paving'); setTex(M.paving, T.paving, 0.8);
  mk('palier_floor', { color: 0xb9b6ae }); setTex(M.palier_floor, T.gres, 0.5);
  mk('trunk', { color: 0x4a3b2c, roughness: 0.9 });
  mk('leaf', { color: 0x5a7439, roughness: 0.85 }); setTex(M.leaf, T.foliage, 1.6, 0.9); mk('leaf2', { color: 0x40592d, roughness: 0.8 }); setTex(M.leaf2, T.foliage, 1.6, 0.85);
  M.bulb = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.3 });
  M.bulbOn = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, emissiveIntensity: 5, roughness: 0.3 });
  mk('dcl', { color: 0xf2f2f0, roughness: 0.5 });
  mk('cable', { color: 0x1a1a1a, roughness: 0.6 });
  mk('cap', { color: 0x1c1e1d, roughness: 0.95 });
  mk('orbit_ground', { color: 0xc9ccc6, roughness: 1 });
  mk('tableau', { color: 0xf2f2ef, roughness: 0.4 });
  mk('towel', { color: 0xf3f3f1, roughness: 0.25, metalness: 0.1 });
  M.hover = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false });
}

/* ---------- Miroirs ---------- */
const mirrors = [];
function makeMirror(parent, w, h, x, y, z, rotY) {
  const ppm = App.coarse ? 300 : 600, g = new THREE.Group();
  const refl = new Reflector(new THREE.PlaneGeometry(w, h), { textureWidth: Math.min(1024, Math.round(w * ppm)), textureHeight: Math.min(1024, Math.round(h * ppm)), clipBias: 0.003, color: 0xc9cccc, multisample: 0 });
  const std = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.mirror); std.visible = false;
  const obr = refl.onBeforeRender; refl.onBeforeRender = function (r, sc, cam) { if (sc.overrideMaterial || cam.isCubeCamera || cam.parent?.isCubeCamera) return; obr.call(this, r, sc, cam); };
  const edge = new THREE.Mesh(prep(boxG(-w / 2 - 0.004, w / 2 + 0.004, -h / 2 - 0.004, h / 2 + 0.004, -0.006, -0.0005)), M.steel);
  g.add(refl, std, edge); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
  mirrors.push({ refl, std }); return g;
}
function mirrorsForPT(on) { for (const m of mirrors) { m.refl.visible = !on; m.std.visible = on; } }

/* ---------- Géométrie ---------- */
function worldUV(g) {
  const p = g.attributes.position, n = g.attributes.normal;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    let u, v;
    if (Math.abs(ny) < 0.7) { const h = Math.hypot(nx, nz) || 1; u = p.getX(i) * (-nz / h) + p.getZ(i) * (nx / h); v = p.getY(i); }
    else { u = p.getX(i); v = -p.getZ(i) * (ny > 0 ? 1 : -1); }
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true; return g;
}
function prep(g) { const q = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(q.attributes)) if (!['position', 'normal', 'uv'].includes(a)) q.deleteAttribute(a); return q; }
class Batch {
  constructor() { this.m = new Map(); }
  add(k, g) { if (!this.m.has(k)) this.m.set(k, []); this.m.get(k).push(g); return g; }
  build(group, opts = {}) {
    for (const [k, arr] of this.m) {
      const mesh = new THREE.Mesh(mergeGeometries(arr.map(prep)), M[k]);
      mesh.castShadow = opts.cast !== false && !['glass', 'orbit_ground', 'hover'].includes(k);
      mesh.receiveShadow = opts.receive !== false;
      mesh.userData.key = k; if (opts.walk && opts.walk.includes(k)) mesh.userData.walk = true;
      group.add(mesh);
    }
    this.m.clear(); return group;
  }
}
function boxG(x0, x1, y0, y1, z0, z1) {
  const g = new THREE.BoxGeometry(Math.max(1e-4, x1 - x0), Math.max(1e-4, y1 - y0), Math.max(1e-4, z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return worldUV(g);
}
function rbox(cx, cy, cz, w, h, d, r, rotY = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
  if (rotY) g.rotateY(rotY); g.translate(cx, cy, cz); return worldUV(g);
}
function cyl(cx, cy, cz, rt, rb, h, seg = 20, axis = 'y') {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(cx, cy, cz); return worldUV(g);
}
/* prisme vertical : polygone du plan (x, z) extrudé de y0 à y1 */
/* prisme d'un polygone à trous (masse de murs d'un seul tenant) */
function prismHoles(poly, holes, y0, y1) {
  const pos = [], nor = [];
  const tri = (A, B, C, N) => {
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2] < 0) [B, C] = [C, B];
    pos.push(...A, ...B, ...C); nor.push(...N, ...N, ...N);
  };
  const ext = GEO.polyArea(poly) < 0 ? poly.slice().reverse() : poly.slice();
  const hs = (holes || []).map(h => (GEO.polyArea(h) > 0 ? h.slice().reverse() : h.slice()));
  const c2 = ext.map(p => new THREE.Vector2(p[0], p[1])), h2 = hs.map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
  const tris = THREE.ShapeUtils.triangulateShape(c2, h2), all = c2.concat(...h2);
  for (const [a, b, c] of tris) {
    tri([all[a].x, y1, all[a].y], [all[b].x, y1, all[b].y], [all[c].x, y1, all[c].y], [0, 1, 0]);
    tri([all[a].x, y0, all[a].y], [all[b].x, y0, all[b].y], [all[c].x, y0, all[c].y], [0, -1, 0]);
  }
  for (const ring of [ext, ...hs]) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); if (L < 1e-6) continue;
    const N = [ez / L, 0, -ex / L];
    tri([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], N); tri([a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], N);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return worldUV(g);
}
function prismG(poly, y0, y1, faces = { top: true, bottom: true }) {
  const pos = [], nor = [];
  const tri = (A, B, C, N) => {
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2] < 0) [B, C] = [C, B];
    pos.push(...A, ...B, ...C); nor.push(...N, ...N, ...N);
  };
  const pts = GEO.polyArea(poly) < 0 ? poly.slice().reverse() : poly.slice();
  const tris = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [a, b, c] of tris) {
    if (faces.top !== false) tri([pts[a][0], y1, pts[a][1]], [pts[b][0], y1, pts[b][1]], [pts[c][0], y1, pts[c][1]], [0, 1, 0]);
    if (faces.bottom !== false) tri([pts[a][0], y0, pts[a][1]], [pts[b][0], y0, pts[b][1]], [pts[c][0], y0, pts[c][1]], [0, -1, 0]);
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez); if (L < 1e-6) continue;
    const N = [ez / L, 0, -ex / L];
    tri([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], N); tri([a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], N);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return worldUV(g);
}
/* repère d'un mur : X le long du mur, Z = normale gauche, origine en a (repère direct) */
function wallMatrix(w) { return new THREE.Matrix4().makeBasis(new THREE.Vector3(w.u[0], 0, w.u[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(w.n[0], 0, w.n[1])).setPosition(w.a[0], 0, w.a[1]); }
const sideOf = w => w.side || 1;
function wallQuad(w, s0, s1, d0, d1) { return [w.pt(s0, d0), w.pt(s1, d0), w.pt(s1, d1), w.pt(s0, d1)]; }
/* repère d'un équipement tourné vers dir */
function dirMatrix(p, dir) { return new THREE.Matrix4().makeBasis(new THREE.Vector3(dir[0], 0, dir[1]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-dir[1], 0, dir[0])).setPosition(p[0], 0, p[1]); }

/* ---------- Collisions sur polygones convexes ---------- */
const col = poly => ({ p: poly, bb: GEO.bbox(poly) });
function closestOnPoly(p, x, z) {
  let inside = true, sign = 0, best = Infinity, bx = 0, bz = 0, nx = 0, nz = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-12;
    const cr = ex * (z - a[1]) - ez * (x - a[0]);
    if (Math.abs(cr) > 1e-12) { const s = Math.sign(cr); if (!sign) sign = s; else if (s !== sign) inside = false; }
    const t = clamp(((x - a[0]) * ex + (z - a[1]) * ez) / l2, 0, 1), cx = a[0] + ex * t, cz = a[1] + ez * t, d2 = (x - cx) ** 2 + (z - cz) ** 2;
    if (d2 < best) { best = d2; bx = cx; bz = cz; const l = Math.sqrt(l2); nx = ez / l; nz = -ex / l; }
  }
  if (sign < 0) { nx = -nx; nz = -nz; }
  return { inside, d: Math.sqrt(best), cx: bx, cz: bz, nx, nz };
}

/* ---------- Construction du logement ---------- */
const G = {};
const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.205);
let staticColliders = [], fixedColliders = [];
const operables = [];
const floorKey = r => r.floor === 'wet' ? 'floor_wet' : r.floor === 'loggia' ? 'loggia_floor' : r.floor === 'seuil' ? 'seuil' : 'floor_dry';

function buildArch(cut) {
  for (const k of ['arch', 'ceil', 'plinthes']) { if (G[k]) { scene.remove(G[k]); G[k].traverse(o => o.geometry && o.geometry.dispose()); } G[k] = new THREE.Group(); scene.add(G[k]); }
  const A = new Batch(), C = new Batch(), P = new Batch(), colliders = [];
  const Y = y => (cut != null ? Math.min(y, cut) : y);
  const pr = (b, k, poly, y0, y1, cap) => {
    if (cut != null && y0 >= cut) return; const yy = Y(y1); b.add(k, prismG(poly, y0, yy));
    if (cap && cut != null && y1 >= cut) b.add('cap', prismG(poly, yy, yy + 0.004));
  };
  // murs d'un seul tenant (masses calculées par la chaîne) : pas de trait aux raccords des morceaux
  const masses = Array.isArray(D.masses) && D.masses.length ? D.masses.filter(m => Array.isArray(m.poly) && m.poly.length >= 3) : null;
  if (masses) for (const m of masses) {
    if (cut != null && -0.02 >= cut) continue;
    const yy = Y(H); A.add('wall_b', prismHoles(m.poly, m.trous, -0.02, yy));
    if (cut != null && H >= cut) A.add('cap', prismHoles(m.poly, m.trous, yy, yy + 0.004));
  }
  // murs, découpés par les ouvertures
  for (const w of D.walls) {
    const k = w.k === 'cloison' ? 'wall_c' : 'wall_b';
    const pc = App.pieces(w);
    const inOther = (s, d) => { const p = w.pt(s, d); return D.walls.some(q => q !== w && GEO.pointInPoly(p[0], p[1], q.quad)) || (D.gaines || []).some(g => GEO.pointInPoly(p[0], p[1], g.poly)); };
    const ext0 = !w.poly && inOther(-0.004, w.t / 2) ? 0.005 : 0, ext1 = !w.poly && inOther(w.L + 0.004, w.t / 2) ? 0.005 : 0;
    for (const sg of pc.segs) {
      if (!w.poly && (ext0 || ext1)) { const a = sg.s[0] < 1e-4 ? -ext0 : 0, b = sg.s[1] > w.L - 1e-4 ? ext1 : 0; if (a || b) sg.quad = wallQuad(w, sg.s[0] + a, sg.s[1] + b, 0, w.t); }
      if (!sg.o) { if (!masses || w.virtual) pr(A, k, sg.quad, -0.02, H, true); colliders.push(col(sg.quad)); continue; }
      const o = sg.o;
      if (o.sill > 0) { pr(A, k, sg.quad, -0.02, o.sill, true); colliders.push(col(sg.quad)); }
      if (o.head < H) pr(A, k, sg.quad, o.head, H, true);
    }
    // enduit extérieur des façades
    if (w.ext && !w.poly) {
      const t = w.t, e = 0.006;
      for (const sg of pc.segs) {
        const q = wallQuad(w, sg.s[0], sg.s[1], t, t + e);
        if (!sg.o) pr(A, 'ext', q, -0.30, H, false);
        else { if (sg.o.sill > 0) pr(A, 'ext', q, -0.30, sg.o.sill); pr(A, 'ext', q, sg.o.head, H); }
      }
    }
  }
  // gaines techniques, toute hauteur
  for (const g of D.gaines || []) { if (!masses) pr(A, 'wall_c', g.poly, -0.02, H, true); colliders.push(col(g.poly)); }
  // sols finis, seuils des portes
  for (const r of D.rooms) { if (App.isExt(r) || r.of) continue; A.add(floorKey(r), prismG(r.poly, -0.02, 0)); }
  for (const o of Object.values(D.openings)) {
    if (o.sill > 0 || o.kind === 'french') continue;
    const w = o.main, rA = App.roomAt(...w.pt((o.s[0] + o.s[1]) / 2, -0.3)), rB = App.roomAt(...w.pt((o.s[0] + o.s[1]) / 2, w.t + 0.3));
    const fk = [rA, rB].some(r => r && r.floor === 'wet') ? 'floor_wet' : 'floor_dry';
    A.add(o.kind === 'entry' ? 'seuil' : fk, prismG(wallQuad(w, o.s[0], o.s[1], 0, w.t), -0.02, o.kind === 'entry' ? 0.008 : 0));
  }
  // dalle porteuse
  A.add('slab', prismG(D.outline, -0.30, -0.02));
  // loggias et balcons : sol sur plots de chaque pièce extérieure, dalle, garde-corps
  for (const r of D.rooms) if (App.isExt(r) && !r.of) A.add('loggia_floor', prismG(r.poly, -0.06, -0.02));
  for (const lg of D.loggias) {
    A.add('slab', prismG(lg.slab, -0.30, -0.06));
    railing(A, lg.rail, 0);
    for (let i = 0; i < lg.rail.length - 1; i++) { const a = lg.rail[i], b = lg.rail[i + 1]; if (VV.len(VV.sub(b, a)) > 1e-3) colliders.push(col(segQuad(a, b, 0.05))); }
  }
  // plafonds et dalle haute (masqués en maquette)
  C.add('ceiling', prismG(D.outline, H, H + 0.02));
  C.add('slab', prismG(D.outline, H + 0.02, H + 0.28));
  for (const lg of D.loggias) C.add('slab', prismG(lg.slab, H, H + 0.28));
  // plinthes des pièces sèches
  const doorsOnEdge = (a, b) => {
    const e = VV.sub(b, a), L = VV.len(e), u = VV.mul(e, 1 / L), cut2 = [];
    for (const o of Object.values(D.openings)) {
      if (o.sill > 0 && o.kind !== 'french') continue;
      const cross = Math.abs(u[0] * o.u[1] - u[1] * o.u[0]); if (cross > 0.05) continue;
      const off = Math.abs((o.mid[0] - a[0]) * u[1] - (o.mid[1] - a[1]) * u[0]); if (off > o.depth + 0.1) continue;
      const s0 = VV.dot(VV.sub(o.p0, a), u), s1 = VV.dot(VV.sub(o.p1, a), u); cut2.push([Math.min(s0, s1) - 0.01, Math.max(s0, s1) + 0.01]);
    }
    for (const f of D.fixtures || []) if (f.type === 'placard') { // pas de plinthe devant les portes du placard
      const F = App.placardFrame(f), q = [F.at(0, 0), F.at(F.W, 0)], cr = Math.abs(u[0] * F.ux[1] - u[1] * F.ux[0]), off = Math.abs((q[0][0] - a[0]) * u[1] - (q[0][1] - a[1]) * u[0]);
      if (cr < 0.05 && off < 0.12) { const s0 = VV.dot(VV.sub(q[0], a), u), s1 = VV.dot(VV.sub(q[1], a), u); cut2.push([Math.min(s0, s1), Math.max(s0, s1)]); }
    }
    return { L, u, cut: cut2.sort((p, q) => p[0] - q[0]) };
  };
  for (const r of D.rooms) {
    if (r.hidden || r.floor !== 'dry') continue;
    const poly = GEO.polyArea(r.poly) < 0 ? r.poly.slice().reverse() : r.poly;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], { L, u, cut: cuts } = doorsOnEdge(a, b); if (L < 0.08) continue;
      const nIn = [-u[1], u[0]]; // intérieur pour un polygone direct
      const mid = VV.add(VV.mul(VV.add(a, b), 0.5), VV.mul(nIn, 0.05));
      if (!GEO.pointInPoly(mid[0], mid[1], r.poly)) continue;
      // bord ouvert sur une autre pièce sans mur : pas de plinthe
      const probeP = VV.add(VV.mul(VV.add(a, b), 0.5), VV.mul(nIn, -0.03)), other = App.roomAt(probeP[0], probeP[1]);
      if (other && !other.hidden && other.id !== r.id && !(D.gaines || []).some(g => GEO.pointInPoly(probeP[0], probeP[1], g.poly))) continue;
      let s = 0; const spans = [];
      for (const [c0, c1] of cuts) { if (c1 <= s) continue; if (c0 > s) spans.push([s, Math.min(c0, L)]); s = Math.max(s, c1); }
      if (s < L) spans.push([s, L]);
      for (const [s0, s1] of spans) {
        if (s1 - s0 < 0.04) continue;
        const p0 = VV.add(a, VV.mul(u, s0)), p1 = VV.add(a, VV.mul(u, s1)), q = [p0, p1, VV.add(p1, VV.mul(nIn, 0.012)), VV.add(p0, VV.mul(nIn, 0.012))];
        P.add('plinthe', prismG(q, 0, 0.07));
      }
    }
  }
  // faïence
  for (const f of D.faience || []) { const q = [f.a, f.b, VV.add(f.b, VV.mul(f.n, 0.008)), VV.add(f.a, VV.mul(f.n, 0.008))]; pr(A, 'faience', q, f.y[0], f.y[1]); }
  A.build(G.arch, { walk: ['floor_dry', 'floor_wet', 'loggia_floor', 'seuil'] });
  C.build(G.ceil); P.build(G.plinthes);
  staticColliders = colliders;
}
function segQuad(a, b, t) { const e = VV.sub(b, a), L = VV.len(e), n = [-e[1] / L * t / 2, e[0] / L * t / 2]; return [VV.add(a, n), VV.add(b, n), VV.sub(b, n), VV.sub(a, n)]; }
/* garde-corps à barreaudage le long d'une polyligne */
function railing(B, pts, y0, k = 'rail') {
  if (!pts || pts.length < 2) return;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], e = VV.sub(b, a), L = VV.len(e); if (L < 1e-3) continue;
    B.add(k, prismG(segQuad(a, b, 0.05), y0 + 0.98, y0 + 1.02)); B.add(k, prismG(segQuad(a, b, 0.03), y0 + 0.08, y0 + 0.11));
    const n = Math.max(1, Math.round(L / 0.11));
    for (let j = 1; j < n; j++) { const p = VV.add(a, VV.mul(e, j / n)); B.add(k, cyl(p[0], y0 + 0.53, p[1], 0.008, 0.008, 0.9, 6)); }
    B.add(k, boxG(a[0] - 0.02, a[0] + 0.02, y0, y0 + 1.0, a[1] - 0.02, a[1] + 0.02));
  }
  const z = pts[pts.length - 1]; B.add(k, boxG(z[0] - 0.02, z[0] + 0.02, y0, y0 + 1.0, z[1] - 0.02, z[1] + 0.02));
}

/* ---------- Portes et fenêtres ouvrantes ---------- */
function makeOperable(id, apply, rect, opts = {}) { const op = { id, t: opts.t ?? 0, target: opts.t ?? 0, apply, rect, speed: opts.speed ?? 1.7, group: opts.group }; op.apply(op.t); operables.push(op); return op; }
function buildDoor(id, group) {
  const o = D.openings[id], w = o.main, sd = sideOf(w), zl = d => sd * d;
  const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(wallMatrix(w)); group.add(g);
  const F = new Batch(), jw = o.jamb ?? 0.04, ov = o.kind === 'entry' ? 0.012 : 0.012, t = w.t;
  const zz = (d0, d1) => [Math.min(zl(d0), zl(d1)), Math.max(zl(d0), zl(d1))];
  const [fz0, fz1] = zz(-ov, t + ov);
  F.add('door_frame', boxG(o.s[0], o.s[0] + jw, 0, o.head, fz0, fz1));
  F.add('door_frame', boxG(o.s[1] - jw, o.s[1], 0, o.head, fz0, fz1));
  F.add('door_frame', boxG(o.s[0], o.s[1], o.head - jw, o.head, fz0, fz1));
  F.build(g);
  const L = o.w - 2 * jw - 0.006, th = 0.04, hh = o.head - jw - 0.008;
  const face = o.swing > 0 ? t : 0, dLeaf = face - o.swing * (th / 2 + 0.004);
  const hingeS0 = o.hinge !== 's1', sH = hingeS0 ? o.s[0] + jw + 0.003 : o.s[1] - jw - 0.003;
  const piv = new THREE.Group(); piv.position.set(sH, 0, zl(dLeaf)); g.add(piv);
  const zs = sd * o.swing, th0 = hingeS0 ? 0 : Math.PI, sig = hingeS0 ? -zs : zs;
  const LB = new Batch(), leafKey = o.kind === 'entry' ? 'entry_leaf' : 'door_leaf';
  LB.add(leafKey, boxG(0, L, 0.008, hh, -th / 2, th / 2));
  if (L > 0.5) for (const s of [-1, 1]) {
    const zr = (a, b) => [Math.min(s * a, s * b), Math.max(s * a, s * b)];
    LB.add('steel', boxG(L - 0.085, L - 0.045, 0.96, 1.12, ...zr(th / 2, th / 2 + 0.008)));
    LB.add('steel', cyl(L - 0.065, 1.035, s * (th / 2 + 0.032), 0.009, 0.009, 0.05, 10, 'z'));
    LB.add('steel', boxG(L - 0.20, L - 0.065, 1.027, 1.043, ...zr(th / 2 + 0.05, th / 2 + 0.066)));
  } else LB.add('steel', cyl(L - 0.05, 1.10, zs * (hingeS0 ? 1 : -1) * (th / 2 + 0.01), 0.012, 0.012, 0.02, 10, 'z'));
  LB.build(piv);
  const rect = wallQuad(w, o.s[0], o.s[1], -0.02, t + 0.02);
  const maxA = o.maxA ?? Math.PI / 2;
  const op = makeOperable(id, v => { piv.rotation.y = th0 + sig * maxA * v; }, rect, { t: (o.kind === 'entry' || o.closed) ? 0 : 1, group: g });
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
}
function buildWindow(id, group) {
  const o = D.openings[id], w = o.main, sd = sideOf(w), zl = d => sd * d, fw = 0.05;
  const [fd0, fd1] = o.frame || [0, 0.06], zf = [Math.min(zl(fd0), zl(fd1)), Math.max(zl(fd0), zl(fd1))];
  const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(wallMatrix(w)); group.add(g);
  const F = new Batch(), bottom = o.sill > 0 ? o.sill : 0, s0 = o.s[0], s1 = o.s[1];
  F.add('frame', boxG(s0 - 0.004, s0 + fw, bottom, o.head + 0.004, ...zf));
  F.add('frame', boxG(s1 - fw, s1 + 0.004, bottom, o.head + 0.004, ...zf));
  F.add('frame', boxG(s0 - 0.004, s1 + 0.004, o.head - fw, o.head + 0.004, ...zf));
  F.add('frame', boxG(s0, s1, bottom, bottom + (o.sill > 0 ? fw : 0.03), ...zf));
  // appui extérieur ou seuil de porte-fenêtre
  const zr = (a, b) => [Math.min(zl(a), zl(b)), Math.max(zl(a), zl(b))];
  if (o.sill > 0) F.add('seuil', boxG(s0 - 0.01, s1 + 0.01, o.sill - 0.03, o.sill + 0.004, ...zr(fd1, o.depth + 0.04)));
  else F.add('seuil', boxG(s0, s1, -0.03, o.seuil ?? 0.012, ...zr(fd0, o.depth)));
  // garde-corps dans le tableau
  if (o.gc) {
    const zg = zr(o.gc[0], o.gc[1]), zc = (zg[0] + zg[1]) / 2;
    F.add('rail', boxG(s0 + 0.01, s1 - 0.01, 0.98, 1.02, zg[0], zg[1])); F.add('rail', boxG(s0 + 0.01, s1 - 0.01, o.sill + 0.06, o.sill + 0.09, zc - 0.012, zc + 0.012));
    const n = Math.max(2, Math.round((s1 - s0) / 0.11));
    for (let i = 1; i < n; i++) { const x = s0 + (s1 - s0) * i / n; F.add('rail', boxG(x - 0.007, x + 0.007, o.sill + 0.06, 0.98, zc - 0.007, zc + 0.007)); }
  }
  // volet roulant : coulisses dans le tableau et lame finale
  if (o.vr) { const zv = zr(o.depth - 0.11, o.depth - 0.05); for (const [a, b] of [[s0, s0 + 0.035], [s1 - 0.035, s1]]) F.add('bso', boxG(a, b, 0, o.head, ...zv)); F.add('bso', boxG(s0 + 0.035, s1 - 0.035, o.head - 0.055, o.head, ...zv)); }
  F.build(g);
  const dMid = zl((fd0 + fd1) / 2), n = o.leaves || 1, pivs = [], zs = -sd; // ouverture vers l'intérieur
  const leafDefs = n === 2 ? [[s0 + 0.05, s0 + 0.05 + (o.w - 0.1) / 2, 1], [s1 - 0.05, s1 - 0.05 - (o.w - 0.1) / 2, -1]] : [[o.hinge === 's1' ? s1 - 0.05 : s0 + 0.05, o.hinge === 's1' ? s0 + 0.05 : s1 - 0.05, o.hinge === 's1' ? -1 : 1]];
  leafDefs.forEach(([hs, other, dirS], idx) => {
    const piv = new THREE.Group(); piv.position.set(hs, 0, dMid); g.add(piv);
    const th0 = dirS > 0 ? 0 : Math.PI, sig = dirS > 0 ? -zs : zs, Lw = Math.abs(other - hs) - 0.004;
    const y0 = bottom + (o.sill > 0 ? fw : 0.03) + 0.003, y1 = o.head - fw - 0.003, pw = 0.068, dep = 0.058;
    const B = new Batch();
    B.add('frame', boxG(0, pw, y0, y1, -dep / 2, dep / 2)); B.add('frame', boxG(Lw - pw, Lw, y0, y1, -dep / 2, dep / 2));
    B.add('frame', boxG(pw, Lw - pw, y1 - pw, y1, -dep / 2, dep / 2)); B.add('frame', boxG(pw, Lw - pw, y0, y0 + (o.sill > 0 ? pw : 0.11), -dep / 2, dep / 2));
    if (n === 1 || idx === 1) { const zin = zs * (dirS > 0 ? 1 : -1), zi = zin > 0 ? [dep / 2, dep / 2 + 0.02] : [-dep / 2 - 0.02, -dep / 2]; B.add('steel', boxG(Lw - 0.05, Lw - 0.03, 1.02, 1.17, ...zi)); }
    B.build(piv);
    const glass = new THREE.Mesh(prep(boxG(pw, Lw - pw, y0 + (o.sill > 0 ? pw : 0.11), y1 - pw, -0.012, 0.012)), M.glass);
    glass.userData.glass = true; glass.renderOrder = 2; piv.add(glass);
    pivs.push({ piv, th0, sig });
  });
  const rect = wallQuad(w, s0, s1, fd0 - 0.02, fd1 + 0.02);
  const op = makeOperable(id, v => pivs.forEach(p => { p.piv.rotation.y = p.th0 + p.sig * (Math.PI / 2) * v; }), rect, { t: 0, group: g });
  op.blocks = o.sill === 0;
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
}
function buildPlacard(group, f) {
  // construit dans le repère de la façade (x le long des portes, z vers l'extérieur), puis tourné et posé
  const F = App.placardFrame(f), g = new THREE.Group(); group.add(g); g.position.set(F.o[0], 0, F.o[1]); g.rotation.y = F.rot;
  const x0 = 0, x1 = F.W, t0 = -0.055, t1 = 0, zb = -F.Dp, w = (x1 - x0) / 2 + 0.03, pan = [], hh = H - 0.03;
  if (f.battante) { // fermé par une porte battante (construite avec les portes) : seulement l'aménagement intérieur
    const R = new Batch();
    if (zb < t0 - 0.12) { R.add('lacquer', boxG(x0 + 0.01, x1 - 0.01, 1.78, 1.80, zb + 0.01, t0 - 0.02)); R.add('chrome', cyl((x0 + x1) / 2, 1.70, (zb + t0) / 2, 0.012, 0.012, x1 - x0 - 0.04, 10, 'x')); }
    R.build(g); return;
  }
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Group(); g.add(m); const B = new Batch(), z0 = i === 0 ? t1 - 0.03 : t0 + 0.012;
    B.add('door_leaf', boxG(0, w, 0.01, hh - 0.02, z0, z0 + 0.018));
    B.add('steel', boxG(i === 0 ? w - 0.04 : 0.02, i === 0 ? w - 0.02 : 0.04, 0.9, 1.3, z0 + 0.018, z0 + 0.022));
    B.build(m); pan.push(m);
  }
  const R = new Batch();
  R.add('steel', boxG(x0, x1, hh - 0.03, hh, t0, t1 - 0.005));
  if (zb < t0 - 0.12) { // étagère et penderie seulement si le placard a de la profondeur
    R.add('lacquer', boxG(x0 + 0.01, x1 - 0.01, 1.78, 1.80, zb + 0.01, t0 - 0.02));
    R.add('chrome', cyl((x0 + x1) / 2, 1.70, (zb + t0) / 2, 0.012, 0.012, x1 - x0 - 0.04, 10, 'x'));
  }
  R.build(g);
  pan[1].position.x = x1 - w; pan[0].position.x = x0;
  const rect = [F.at(x0, t0), F.at(x1, t0), F.at(x1, t1), F.at(x0, t1)];
  const op = makeOperable('placard', v => { pan[0].position.x = x0 + v * (w - 0.08); }, rect, { t: 0, group: g });
  op.blocks = false;
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
}

/* ---------- Brise-soleil orientables ---------- */
function buildBSO() {
  if (G.bso) { scene.remove(G.bso); G.bso.traverse(o => o.geometry && o.geometry.dispose()); }
  G.bso = new THREE.Group(); scene.add(G.bso);
  const drop = S.bsoDrop / 100, tilt = S.bsoTilt * Math.PI / 180;
  for (const o of Object.values(D.openings)) {
    if (!o.bso) continue;
    const w = o.main, sd = sideOf(w), zl = d => sd * d, gw = new THREE.Group(); gw.matrixAutoUpdate = false; gw.matrix.copy(wallMatrix(w)); G.bso.add(gw);
    const B = new Batch(), zc = zl(o.depth + 0.05), x0 = o.s[0] + 0.035, x1 = o.s[1] - 0.035, top = o.head - 0.04, bottom = o.sill + 0.01, pitch = 0.072;
    const n = Math.floor((top - bottom) / pitch), nd = Math.round(n * drop), pk = n - nd;
    B.add('bso', boxG(o.s[0] + 0.005, o.s[1] - 0.005, top, o.head + 0.02, Math.min(zl(o.depth), zl(o.depth + 0.11)), Math.max(zl(o.depth), zl(o.depth + 0.11))));
    for (const xx of [o.s[0] + 0.005, o.s[1] - 0.035]) B.add('bso', boxG(xx, xx + 0.03, bottom, top, zc - 0.022, zc + 0.022));
    let y = top - 0.006;
    for (let i = 0; i < pk; i++) { B.add('bso', boxG(x0, x1, y - 0.004, y, zc - 0.041, zc + 0.041)); y -= 0.0062; }
    if (nd > 0) { y -= 0.03; for (let i = 0; i < nd; i++) { const gg = new THREE.BoxGeometry(x1 - x0, 0.0035, 0.082); gg.rotateX(-tilt * sd); gg.translate((x0 + x1) / 2, y, zc); B.add('bso', worldUV(gg)); y -= pitch; } }
    const yb = Math.max(bottom, y + pitch - 0.05);
    B.add('bso', boxG(x0, x1, yb - 0.02, yb, zc - 0.045, zc + 0.045));
    B.build(gw);
  }
  markShadows();
  if (S.cut) G.bso.visible = false;
}

/* ---------- Équipements fournis ---------- */
function buildFixed() {
  G.fixed = new THREE.Group(); scene.add(G.fixed);
  const B = new Batch(), cols = [];
  const inFrame = (Mx, add) => { const b = new Batch(); add(b); const gr = new THREE.Group(); gr.matrixAutoUpdate = false; gr.matrix.copy(Mx); b.build(gr); G.fixed.add(gr); return gr; };
  for (const f of D.fixtures || []) try { // un équipement défectueux n'empêche pas les autres
    if (f.type === 'shower') {
      const [x0, x1] = f.x, [z0, z1] = f.z;
      B.add('tray', rbox((x0 + x1) / 2, 0.015, (z0 + z1) / 2, x1 - x0 - 0.004, 0.03, z1 - z0 - 0.004, 0.006));
      B.add('chrome', cyl(f.drain[0], 0.031, f.drain[1], 0.045, 0.045, 0.002, 24));
      if (f.valve) {
        const [vx, vz] = f.valve.wall, [dx, dz] = f.valve.dir, at = (a) => [vx + dx * a, vz + dz * a];
        const p1 = at(0.04), p2 = at(0.035);
        B.add('chrome', boxG(p1[0] - 0.14, p1[0] + 0.14, 1.02, 1.08, Math.min(p1[1], vz), Math.max(p1[1], vz) + 0.02));
        B.add('chrome', cyl(p2[0], 1.52, p2[1] + dz * 0.01, 0.011, 0.011, 0.95, 12));
        B.add('chrome', boxG(p2[0] - 0.03, p2[0] + 0.03, 1.86, 1.90, Math.min(vz, p2[1]), Math.max(vz, p2[1]) + 0.03));
        B.add('chrome', cyl(p2[0] + 0.02, 1.80, p2[1] + dz * 0.06, 0.035, 0.018, 0.10, 16));
      }
    } else if (f.type === 'bath') {
      // baignoire creuse : socle, tablier et rebords autour d'une cuve dont le fond est à 15 cm ; robinetterie sur le rebord élargi du petit côté
      const [x0, x1] = [f.x[0] + 0.002, f.x[1] - 0.002], [z0, z1] = [f.z[0] + 0.002, f.z[1] - 0.002], h = 0.56, bot = 0.15, alongX = (x1 - x0) >= (z1 - z0);
      const e = Math.min(0.06, (x1 - x0) / 5, (z1 - z0) / 5), eT = Math.min(0.15, (alongX ? x1 - x0 : z1 - z0) / 6);
      const ix0 = x0 + (alongX ? eT : e), ix1 = x1 - e, iz0 = z0 + (alongX ? e : eT), iz1 = z1 - e, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      B.add('ceramic', rbox(cx, bot / 2, cz, x1 - x0, bot, z1 - z0, 0.006));
      for (const [a0, a1, b0, b1] of [[x0, x1, z0, iz0], [x0, x1, iz1, z1], [x0, ix0, iz0, iz1], [ix1, x1, iz0, iz1]]) B.add('ceramic', boxG(a0, a1, bot - 0.01, h, b0, b1));
      B.add('chrome', cyl(alongX ? ix0 + 0.09 : cx, bot + 0.002, alongX ? cz : iz0 + 0.09, 0.024, 0.024, 0.004, 20)); // bonde
      const tx = alongX ? x0 + eT / 2 : cx, tz = alongX ? cz : z0 + eT / 2;
      B.add('chrome', cyl(tx, h + 0.05, tz, 0.02, 0.02, 0.1)); B.add('chrome', cyl(tx + (alongX ? 0.06 : 0), h + 0.09, tz + (alongX ? 0 : 0.06), 0.012, 0.012, 0.12, 10, alongX ? 'x' : 'z'));
      cols.push(col([[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]]));
    } else if (f.type === 'wc') {
      inFrame(dirMatrix(f.p, f.dir), b => {
        b.add('ceramic', rbox(0.09, 0.60, 0, 0.18, 0.40, 0.36, 0.03));
        b.add('ceramic', rbox(0.40, 0.20, 0, 0.44, 0.40, 0.36, 0.08));
        b.add('ceramic', rbox(0.42, 0.415, 0, 0.46, 0.03, 0.38, 0.012));
        b.add('chrome', cyl(0.09, 0.81, 0, 0.025, 0.025, 0.01));
      });
      cols.push(col(rectDir(f.p, f.dir, 0, 0.66, 0.20)));
    } else if (f.type === 'vanity') {
      const back = f.dir[0] < 0 ? f.x[1] : f.dir[0] > 0 ? f.x[0] : null, bz = f.dir[1] < 0 ? f.z[1] : f.dir[1] > 0 ? f.z[0] : null;
      const p = [back ?? (f.x[0] + f.x[1]) / 2, bz ?? (f.z[0] + f.z[1]) / 2], dep = f.dir[0] ? f.x[1] - f.x[0] : f.z[1] - f.z[0], wid = f.dir[0] ? f.z[1] - f.z[0] : f.x[1] - f.x[0];
      inFrame(dirMatrix(p, f.dir), b => {
        b.add('lacquer', boxG(0.008, dep - 0.01, 0.44, 0.82, -wid / 2 + 0.01, wid / 2 - 0.01));
        b.add('ceramic', rbox(dep / 2, 0.84, 0, dep, 0.04, wid, 0.01));
        b.add('ceramic', rbox(dep / 2 + 0.02, 0.862, 0, dep - 0.16, 0.006, wid - 0.22, 0.03));
        b.add('chrome', cyl(0.07, 0.92, 0, 0.018, 0.022, 0.12)); b.add('chrome', cyl(0.13, 0.975, 0, 0.012, 0.012, 0.12, 12, 'x')); b.add('chrome', cyl(0.07, 0.99, 0, 0.006, 0.006, 0.07, 8, 'x'));
        b.add('steel', boxG(0.004, 0.03, 1.86, 1.89, -0.28, 0.28));
      });
      const rot = Math.atan2(f.dir[0], f.dir[1]);
      makeMirror(G.fixed, Math.min(0.8, wid - 0.02), 0.72, p[0] + f.dir[0] * 0.009, 1.45, p[1] + f.dir[1] * 0.009, rot);
      cols.push(col([[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]]));
    } else if (f.type === 'towel') {
      const vert = f.dir[0] !== 0, zc = (f.z[0] + f.z[1]) / 2 + 0.01, xc = (f.x[0] + f.x[1]) / 2;
      if (!vert) {
        for (const xx of [f.x[0] + 0.02, f.x[1] - 0.02]) B.add('towel', cyl(xx, 0.95, zc, 0.014, 0.014, 1.10, 12));
        for (let i = 0; i < 15; i++) B.add('towel', cyl(xc, 0.46 + i * 0.066, zc, 0.009, 0.009, f.x[1] - f.x[0] - 0.04, 10, 'x'));
      } else {
        const xw = f.dir[0] > 0 ? f.x[0] + 0.055 : f.x[1] - 0.055, zm = (f.z[0] + f.z[1]) / 2;
        for (const zz of [f.z[0] + 0.02, f.z[1] - 0.02]) B.add('towel', cyl(xw, 0.95, zz, 0.014, 0.014, 1.10, 12));
        for (let i = 0; i < 15; i++) B.add('towel', cyl(xw, 0.46 + i * 0.066, zm, 0.009, 0.009, f.z[1] - f.z[0] - 0.04, 10, 'z'));
      }
    } else if (f.type === 'tableau') {
      B.add('tableau', boxG(f.x[0] + 0.05, f.x[1] - 0.05, 0.95, 1.90, f.z[0] + 0.005, f.z[0] + 0.13));
      B.add('lacquer', boxG(f.x[0] + 0.052, f.x[1] - 0.052, 0.96, 1.89, f.z[0] + 0.13, f.z[0] + 0.134));
      B.add('pvc', boxG((f.x[0] + f.x[1]) / 2 - 0.06, (f.x[0] + f.x[1]) / 2 + 0.06, 1.90, H, f.z[0] + 0.005, f.z[0] + 0.06));
      B.add('pvc', boxG((f.x[0] + f.x[1]) / 2 - 0.06, (f.x[0] + f.x[1]) / 2 + 0.06, 0, 0.95, f.z[0] + 0.005, f.z[0] + 0.06));
    } else if (f.type === 'placard') {
      buildPlacard(G.doors, f);
      cols.push(col([[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]]));
    } else if (f.type === 'dep') {
      B.add('pvc', cyl(f.p[0], H / 2, f.p[1], f.r, f.r, H + 0.3, 16));
      cols.push(col([[f.p[0] - f.r, f.p[1] - f.r], [f.p[0] + f.r, f.p[1] - f.r], [f.p[0] + f.r, f.p[1] + f.r], [f.p[0] - f.r, f.p[1] + f.r]]));
    }
  } catch (e) { console.warn('plan.json : équipement non construit', f.type, e); }
  // interrupteurs à 1,10 m côté gâche (hypothèse de pose courante)
  for (const o of Object.values(D.openings)) {
    if (!(o.kind === 'door' || o.kind === 'entry') || o.jamb === 0.02) continue;
    const w = o.main, side = o.kind === 'entry' ? o.swing : -o.swing, d = side > 0 ? w.t + 0.006 : -0.006, latchS1 = o.hinge !== 's1';
    const s = latchS1 ? o.s[1] + 0.13 : o.s[0] - 0.13; if (s < 0.05 || s > w.L - 0.05) continue;
    const c = w.pt(s, d), nrm = VV.mul(o.T, side > 0 ? 1 : -1), tg = w.u;
    const q = [VV.add(c, VV.mul(tg, -0.04)), VV.add(c, VV.mul(tg, 0.04)), VV.add(VV.add(c, VV.mul(tg, 0.04)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, -0.04)), VV.mul(nrm, 0.009))];
    B.add('lacquer', prismG(q, 1.06, 1.14));
    const q2 = [VV.add(VV.add(c, VV.mul(tg, -0.022)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, 0.022)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, 0.022)), VV.mul(nrm, 0.013)), VV.add(VV.add(c, VV.mul(tg, -0.022)), VV.mul(nrm, 0.013))];
    B.add('lacquer', prismG(q2, 1.078, 1.122));
  }
  B.build(G.fixed, { walk: ['tray'] });
  fixedColliders = cols;
}
function rectDir(p, dir, a0, a1, hw) { const s = [-dir[1], dir[0]], at = (a, b) => [p[0] + dir[0] * a + s[0] * b, p[1] + dir[1] * a + s[1] * b]; return [at(a0, -hw), at(a1, -hw), at(a1, hw), at(a0, hw)]; }

/* ---------- Luminaires ---------- */
function lampShadow(l) { const r = App.coarse ? 256 : 512; l.shadow.mapSize.set(r, r); l.shadow.bias = -0.003; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.05; l.shadow.camera.far = 12; }
const lamps = [];
function buildLamps() {
  G.lamps = new THREE.Group(); scene.add(G.lamps);
  const B = new Batch();
  for (const L of D.lamps || []) {
    if (L.wall) { // applique
      const [x, z] = L.wall, [nx, nz] = L.n, y = L.y || 2.0;
      B.add('rail', boxG(x - 0.07 + nx * 0.0, x + 0.07, y - 0.05, y + 0.05, Math.min(z, z + nz * 0.08), Math.max(z, z + nz * 0.08)));
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.05), M.bulb); bulb.position.set(x + nx * 0.05, y - 0.055, z + nz * 0.05); G.lamps.add(bulb);
      const l = new THREE.PointLight(0xffd8a8, 0, 0, 2); l.position.set(x + nx * 0.18, y - 0.1, z + nz * 0.18); lampShadow(l); l.userData.bulb = bulb; l.userData.ext = true; G.lamps.add(l); lamps.push(l);
      continue;
    }
    const [x, z] = L.p, drop = L.drop ?? 0.30;
    B.add('dcl', cyl(x, H - 0.012, z, 0.045, 0.045, 0.025, 16));
    if (drop > 0.1) { B.add('cable', cyl(x, H - drop / 2, z, 0.003, 0.003, drop - 0.03, 6)); B.add('dcl', cyl(x, H - drop + 0.045, z, 0.018, 0.018, 0.05, 12)); }
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), M.bulb); bulb.position.set(x, H - drop, z); G.lamps.add(bulb);
    const wet = App.roomAt(x, z)?.floor === 'wet', l = new THREE.PointLight(wet ? 0xfff1e2 : 0xffe6c8, 0, 0, 2); l.position.set(x, H - Math.max(drop + 0.03, 0.11), z); lampShadow(l); l.userData.blind = !!L.blind; l.userData.bulb = bulb; G.lamps.add(l); lamps.push(l);
  }
  B.build(G.lamps);
}

/* ---------- Contexte : immeuble, étages voisins, abords ---------- */
const ctxColliders = [];
function buildContext() {
  G.ctx = new THREE.Group(); scene.add(G.ctx);
  const A = new Batch(), NS = new Batch();
  const below = CTX.below ?? 0, above = CTX.above ?? 0;
  // masses de l'immeuble autour du logement
  for (const m of CTX.masses || []) {
    if (m.notAt0) { A.add('facade', prismG(m.poly, GROUND, -0.30)); A.add('facade', prismG(m.poly, H + 0.28, ROOF)); }
    else A.add('facade', prismG(m.poly, GROUND, ROOF));
  }
  // étages au-dessus et en dessous : même enveloppe, vitrages sombres
  for (let lv = -below; lv <= above; lv++) {
    if (lv === 0) continue;
    const y0 = lv * LEVEL;
    if (lv !== 1) A.add('slab', prismG(D.outline, y0 - 0.30, y0 - 0.02));
    for (const w of D.walls) {
      if (w.poly) { // mur polygonal, éventuellement ouvert au droit d'une baie (voir openCrossingWalls)
        if (w.k !== 'cloison') for (const sg of App.pieces(w).segs) { if (!sg.o) A.add('ext', prismG(sg.quad, y0 - 0.02, y0 + H)); else { if (sg.o.sill > 0) A.add('ext', prismG(sg.quad, y0 - 0.02, y0 + sg.o.sill)); A.add('ext', prismG(sg.quad, y0 + sg.o.head, y0 + H)); } }
        continue;
      }
      if (!w.ext) continue;
      for (const sg of App.pieces(w).segs) {
        const q = wallQuad(w, sg.s[0], sg.s[1], 0, w.t + 0.006);
        if (!sg.o) { A.add('ext', prismG(q, y0 - 0.02, y0 + H)); continue; }
        const o = sg.o;
        if (o.sill > 0) A.add('ext', prismG(q, y0 - 0.02, y0 + o.sill)); A.add('ext', prismG(q, y0 + o.head, y0 + H));
        A.add('darkglass', prismG(wallQuad(w, sg.s[0], sg.s[1], 0.02, 0.05), y0 + o.sill, y0 + o.head));
      }
    }
    for (const lg of D.loggias) {
      if (lv !== 1) A.add('slab', prismG(lg.slab, y0 - 0.30, y0 - 0.02));
      railing(A, lg.rail, y0);
    }
  }
  for (const lg of D.loggias) A.add('slab', prismG(lg.slab, (above + 1) * LEVEL - 0.30, (above + 1) * LEVEL - 0.02));
  A.add('slab', prismG(D.outline, (above + 1) * LEVEL - 0.30, ROOF + 0.02));
  for (const m of CTX.masses || []) A.add('ext', prismG(m.poly, ROOF, ROOF + 0.5));
  A.add('ext', prismG(D.outline, ROOF, ROOF + 0.5));
  // palier devant l'entrée
  if (CTX.palier) {
    const p = CTX.palier.poly;
    A.add('palier_floor', prismG(p, -0.30, 0)); A.add('ceiling', prismG(p, H, H + 0.3));
    const pp = GEO.polyArea(p) < 0 ? p.slice().reverse() : p;
    for (let i = 0; i < pp.length; i++) {
      const a = pp[i], b = pp[(i + 1) % pp.length], e = VV.sub(b, a), L = VV.len(e), nIn = [-e[1] / L, e[0] / L];
      const mid = VV.mul(VV.add(a, b), 0.5); if (Math.abs(mid[0] - BX0) < 0.05 || GEO.pointInPoly(mid[0] + nIn[0] * -0.1, mid[1] + nIn[1] * -0.1, D.outline)) continue;
      A.add('wall_b', prismG([a, b, VV.add(b, VV.mul(nIn, 0.01)), VV.add(a, VV.mul(nIn, 0.01))], 0, H));
    }
    const c = GEO.centroid(p); const pl = new THREE.PointLight(0xfff0dd, 3, 0, 2); pl.position.set(c[0], H - 0.2, c[1]); G.ctx.add(pl);
  }
  // sol, parvis, voisinage schématique, arbres
  NS.add('ground', new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2).translate(CEN[0], GROUND - 0.02, CEN[1]));
  NS.add('paving', prismG([[BX0 - 22, BZ0 - 12], [BX1 + 10, BZ0 - 12], [BX1 + 10, BZ1 + 6], [BX0 - 22, BZ1 + 6]], GROUND - 0.02, GROUND));
  for (const [x0, x1, z0, z1, h] of CTX.blocks || []) NS.add('facade', boxG(x0, x1, GROUND, GROUND + h, z0, z1));
  // arbres : tronc, charpentières et houppier fait de nombreuses touffes irrégulières
  const R = rng(77), lump = (r, d) => { const gg = new THREE.IcosahedronGeometry(r, d), p = gg.attributes.position, s = Math.floor(R() * 1e6); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hash2(Math.round(x * 97 + y * 13), Math.round(z * 97 - y * 29), s) - 0.5) * 0.4; p.setXYZ(i, x * k, y * k * 0.85, z * k); } gg.deleteAttribute('uv'); gg.deleteAttribute('normal'); const m = mergeVertices(gg, 1e-4); m.computeVertexNormals(); return m.toNonIndexed(); };
  for (const [x, z] of CTX.trees || []) {
    const h = 4 + R() * 3.5, cw = 2.2 + R() * 1.6, ch = 2.6 + R() * 2.2, lean = (R() - 0.5) * 0.4;
    NS.add('trunk', cyl(x, GROUND + h / 2, z, 0.12, 0.2, h, 10));
    for (let b = 0; b < 3; b++) { const a = R() * Math.PI * 2, gg = new THREE.CylinderGeometry(0.04, 0.08, 2.2, 6); gg.translate(0, 1.1, 0); gg.rotateZ(0.6); gg.rotateY(a); gg.translate(x, GROUND + h - 0.8, z); NS.add('trunk', worldUV(gg)); }
    const n = 34 + Math.floor(R() * 16);
    for (let k = 0; k < n; k++) {
      const u = R() * Math.PI * 2, v = Math.acos(2 * R() - 1), rr = Math.cbrt(R());
      const px = x + Math.sin(v) * Math.cos(u) * cw * rr + lean, py = GROUND + h + ch * 0.5 + Math.cos(v) * ch * 0.5 * rr, pz = z + Math.sin(v) * Math.sin(u) * cw * rr;
      const gg = lump(0.45 + R() * 0.55, 1); gg.translate(px, py, pz); NS.add(R() < 0.5 ? 'leaf' : 'leaf2', worldUV(gg));
    }
  }
  A.build(G.ctx, { walk: [] });
  const ns = new THREE.Group(); NS.build(ns, { cast: false }); G.ctx.add(ns);
  G.orbitGround = new THREE.Mesh(new THREE.CircleGeometry(SPAN * 1.2, 64).rotateX(-Math.PI / 2), M.orbit_ground);
  G.orbitGround.position.set(CEN[0], -0.305, CEN[1]); G.orbitGround.receiveShadow = true; scene.add(G.orbitGround);
}

/* ---------- Ciel et soleil ---------- */
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true; sun.shadow.mapSize.set(App.coarse ? 2048 : 4096, App.coarse ? 2048 : 4096);
const SH = SPAN / 2 + 10;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 0.5, far: 90 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025;
sun.target.position.set(CEN[0], 0, CEN[1]); scene.add(sun, sun.target);
const portals = [];
function buildShadowRoof() {
  const parts = [prismG(D.outline, H, H + 0.28)];
  for (const lg of D.loggias) parts.push(prismG(lg.slab, H, H + 0.28));
  for (const m of CTX.masses || []) parts.push(prismG(m.poly, -0.30, Math.min(ROOF, H + LEVEL * 2)));
  G.shadowRoof = new THREE.Mesh(mergeGeometries(parts.map(prep)), new THREE.MeshBasicMaterial()); G.shadowRoof.castShadow = true; G.shadowRoof.layers.set(1);
  sun.shadow.camera.layers.enable(1); scene.add(G.shadowRoof);
}
function buildPortals() {
  for (const o of Object.values(D.openings)) {
    if (o.kind !== 'window' && o.kind !== 'french') continue;
    const wdt = o.w - 0.1, h = o.head - o.sill - 0.08, l = new THREE.RectAreaLight(0xdfe8ff, 0, wdt, h);
    const c = o.pt((o.s[0] + o.s[1]) / 2, (o.frame ? o.frame[0] : 0) - 0.01), inn = VV.mul(o.T, -5);
    l.position.set(c[0], o.sill + 0.04 + h / 2, c[1]); l.lookAt(c[0] + inn[0], l.position.y, c[1] + inn[1]);
    l.userData.id = o.id; scene.add(l); portals.push(l);
  }
}
const SEASON = { hiver: { N: 355, utc: 1, label: '21 déc.' }, printemps: { N: 79, utc: 1, label: '20 mars' }, ete: { N: 172, utc: 2, label: '21 juin' }, automne: { N: 265, utc: 2, label: '22 sept.' } };
function sunPos() {
  const s = SEASON[S.season], D2R = Math.PI / 180, lat = (D.geo?.lat ?? 45.75) * D2R, lon = D.geo?.lon ?? 4.85;
  const decl = 23.44 * D2R * Math.sin(2 * Math.PI * (284 + s.N) / 365), B = 2 * Math.PI * (s.N - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solar = S.hour - s.utc + lon / 15 + eot / 60, ha = (solar - 12) * 15 * D2R;
  const alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha));
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
  return { alt, az };
}
let skyTex = null, skyInfo = null;
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const EXT_MATS = ['ext', 'slab', 'loggia_floor', 'rail', 'bso', 'facade', 'ground', 'paving', 'pvc'];
function updateSun() {
  const { alt, az } = sunPos(), azPlan = az + (D.geo?.nord || 0) * Math.PI / 180;
  const dir = new THREE.Vector3(Math.cos(alt) * Math.sin(azPlan), Math.sin(alt), -Math.cos(alt) * Math.cos(azPlan));
  const sa = Math.sin(alt), day = smooth(-0.1, 0.3, sa), golden = Math.max(0, 1 - Math.abs(sa - 0.05) / 0.2) * smooth(-0.12, 0.0, sa);
  const zen = mix3([0.003, 0.005, 0.012], [0.16, 0.30, 0.62], day);
  let hor = mix3([0.010, 0.012, 0.022], [0.66, 0.73, 0.80], day); hor = mix3(hor, [1.0, 0.56, 0.30], golden * 0.65);
  const sunc = mix3([1.0, 0.42, 0.16], [1.0, 0.94, 0.85], smooth(0.0, 0.45, sa)), gnd = [0.17 * (0.04 + 0.96 * day), 0.16 * (0.04 + 0.96 * day), 0.14 * (0.04 + 0.96 * day)];
  const W = 256, Hh = 128, arr = new Uint16Array(W * Hh * 4), toH = THREE.DataUtils.toHalfFloat, glowK = sa > -0.12 ? (0.25 + 0.75 * day) : 0;
  for (let j = 0; j < Hh; j++) {
    const el = ((j + 0.5) / Hh - 0.5) * Math.PI, ce = Math.cos(el), dy = Math.sin(el);
    for (let i = 0; i < W; i++) {
      const ph = ((i + 0.5) / W - 0.5) * 2 * Math.PI, dx = Math.cos(ph) * ce, dz = Math.sin(ph) * ce; let c;
      if (dy >= 0) { const t = Math.pow(dy, 0.45); c = mix3(hor, zen, t); const mu = Math.max(0, dx * dir.x + dy * dir.y + dz * dir.z), gl = (0.32 * Math.pow(mu, 8) + 1.6 * Math.pow(mu, 90)) * glowK; c = [c[0] + sunc[0] * gl, c[1] + sunc[1] * gl, c[2] + sunc[2] * gl]; }
      else c = mix3([hor[0] * 0.75, hor[1] * 0.75, hor[2] * 0.75], gnd, smooth(0, 0.1, -dy));
      const k = (j * W + i) * 4; arr[k] = toH(c[0]); arr[k + 1] = toH(c[1]); arr[k + 2] = toH(c[2]); arr[k + 3] = toH(1);
    }
  }
  const tex = new THREE.DataTexture(arr, W, Hh, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.LinearSRGBColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  if (skyTex) skyTex.dispose(); skyTex = tex;
  scene.environment = tex; scene.background = tex;
  for (const k of EXT_MATS) if (M[k]) { M[k].envMap = tex; M[k].needsUpdate = true; }
  invalidateProbes();
  sun.intensity = 8.0 * smooth(-0.015, 0.22, sa); sun.color.setRGB(sunc[0], sunc[1], sunc[2]);
  sun.position.copy(sun.target.position).addScaledVector(dir, 50); markShadows();
  skyInfo = { alt, az, day, hor };
  const bso = 1 - (S.bsoDrop / 100) * (0.35 + 0.6 * S.bsoTilt / 80);
  for (const l of portals) { l.userData.i = 2.6 * day * (D.openings[l.userData.id].bso ? bso : 1); l.color.setRGB(0.8 + hor[0] * 0.2, 0.82 + hor[1] * 0.18, 0.85 + hor[2] * 0.15); }
  const night = sa < 0.06;
  lamps.forEach(l => {
    const on = S.lights === 'on' || (S.lights === 'auto' && (night || l.userData.blind));
    l.intensity = on ? (night ? 10 : 2.4) * (l.userData.ext ? 0.6 : 1) : 0; l.castShadow = on && !l.userData.ext; l.userData.bulb.material = on ? M.bulbOn : M.bulb;
  });
  scene.fog = new THREE.Fog(new THREE.Color(hor[0], hor[1], hor[2]), 110, 480);
  applyEnv();
  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((az * 180 / Math.PI) % 360) / 45) % 8];
  const sunTxt = sa > 0 ? `Soleil à ${Math.round(alt * 180 / Math.PI)}° · ${cardinal} ${Math.round(az * 180 / Math.PI)}°` : 'Soleil couché';
  const si = document.getElementById('sunInfo'); if (si) si.textContent = sunTxt;
  App.sunText(`${SEASON[S.season].label} · ${App.fmtHour(S.hour)} · ${sunTxt}`);
  invalidate();
}

/* ---------- Lumière d'ambiance en visite (sondes par pièce, mélange aux passages) ---------- */
const PROBES = D.probes || {}, PASSAGES = D.passages || [], EXPF = D.exposure || {};
const probe = { cache: {}, stamp: 1, queue: [], rt: null, cam: null, pmrem: null, timer: 0 };
const ambient = new THREE.LightProbe(); ambient.intensity = 0; scene.add(ambient);
const REFL_K = 0.25, K_OUT = 1.45, EXP_KEY = D.simple ? 0.24 : 0.19, K_REF = 4.4;
function invalidateProbes() { probe.stamp++; clearTimeout(probe.timer); probe.timer = setTimeout(() => { if (S.mode === 'walk') queueProbes(); }, 350); }
function queueProbes() {
  const cur = baseRoom(walk.x, walk.z);
  probe.queue = Object.keys(PROBES).filter(id => !probe.cache[id] || probe.cache[id].stamp !== probe.stamp).sort((a, b) => (b === cur) - (a === cur));
  invalidate(2);
}
function shFromCube(rt) {
  const N = rt.width, st = Math.max(1, Math.round(N / 32)), buf = new Uint16Array(N * N * 4), h = THREE.DataUtils.fromHalfFloat;
  const sh = new THREE.SphericalHarmonics3(), c = sh.coefficients, basis = new Array(9).fill(0), coord = new THREE.Vector3(), dir = new THREE.Vector3();
  const flip = -1, px = 2 / N; let total = 0;
  for (let f = 0; f < 6; f++) {
    renderer.readRenderTargetPixels(rt, 0, 0, N, N, buf, f);
    for (let yy = 0; yy < N; yy += st) for (let xx = 0; xx < N; xx += st) {
      const i = (yy * N + xx) * 4, r = h(buf[i]), g = h(buf[i + 1]), b = h(buf[i + 2]); if (!Number.isFinite(r + g + b)) continue;
      const cl = (1 - (xx + 0.5) * px) * flip, row = 1 - (yy + 0.5) * px;
      switch (f) { case 0: coord.set(-flip, row, cl * flip); break; case 1: coord.set(flip, row, -cl * flip); break; case 2: coord.set(cl, 1, -row); break; case 3: coord.set(cl, -1, row); break; case 4: coord.set(cl, row, 1); break; default: coord.set(-cl, row, -1); }
      const l2 = coord.lengthSq(), wgt = 4 / (Math.sqrt(l2) * l2); total += wgt;
      dir.copy(coord).normalize(); THREE.SphericalHarmonics3.getBasisAt(dir, basis);
      for (let j = 0; j < 9; j++) { c[j].x += basis[j] * r * wgt; c[j].y += basis[j] * g * wgt; c[j].z += basis[j] * b * wgt; }
    }
  }
  const norm = 4 * Math.PI / total; for (let j = 0; j < 9; j++) c[j].multiplyScalar(norm);
  return sh;
}
function captureProbe(id) {
  const p = PROBES[id]; if (!p) return;
  if (!probe.rt) { probe.rt = new THREE.WebGLCubeRenderTarget(App.coarse ? 48 : 96, { type: THREE.HalfFloatType }); probe.cam = new THREE.CubeCamera(0.05, 400, probe.rt); probe.pmrem = new THREE.PMREMGenerator(renderer); }
  const save = { env: scene.environment, ei: scene.environmentIntensity, cur: cursor.visible, clip: renderer.clippingPlanes, sh: ambient.sh.clone(), ai: ambient.intensity };
  mirrors.forEach(m => { m.v = m.refl.visible; m.refl.visible = false; m.std.visible = true; });
  const bulbs = lamps.map(l => l.userData.bulb.material); lamps.forEach(l => { l.userData.bulb.material = M.bulb; });
  const pis = portals.map(l => l.intensity); portals.forEach(l => { l.intensity = 0; });
  cursor.visible = false; renderer.clippingPlanes = [];
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  probe.cam.position.set(p[0], 1.35, p[1]);
  scene.environment = null; scene.environmentIntensity = 1; ambient.sh.zero(); ambient.intensity = 1;
  let sh = null, ok = true;
  for (let i = 0; i < (App.coarse ? 2 : 3); i++) { probe.cam.update(renderer, scene); try { sh = shFromCube(probe.rt); ambient.sh.copy(sh); } catch (e) { ok = false; break; } }
  const env = probe.pmrem.fromCubemap(probe.rt.texture);
  markShadows();
  mirrors.forEach(m => { m.refl.visible = m.v; m.std.visible = false; });
  lamps.forEach((l, i) => { l.userData.bulb.material = bulbs[i]; }); portals.forEach((l, i) => { l.intensity = pis[i]; });
  cursor.visible = save.cur; renderer.clippingPlanes = save.clip;
  scene.environment = save.env; scene.environmentIntensity = save.ei; ambient.sh.copy(save.sh); ambient.intensity = save.ai;
  let k = 3;
  if (ok && sh) { const c0 = sh.coefficients[0], avg = 0.282095 * (0.2126 * c0.x + 0.7152 * c0.y + 0.0722 * c0.z); if (avg > 1e-5) k = clamp(EXP_KEY * (EXPF[id] || 1) / avg, 0.2, 12); }
  if (probe.cache[id]) probe.cache[id].env.dispose();
  probe.cache[id] = { env, sh: ok ? sh : null, k: Math.sqrt(k * K_REF), stamp: probe.stamp };
}
function roomIdAt(x, z) { const r = App.roomAt(x, z); return r ? (r.of || r.id) : null; }
function baseRoom(x, z) {
  const id = roomIdAt(x, z);
  if (id && PROBES[id]) return id;
  if (id && App.isExt(D.rooms.find(r => r.id === id))) return id; // extérieur : pas de sonde, lumière du ciel
  let best = null, bd = 1e9; for (const P of PASSAGES) { const d = Math.hypot(x - P.p[0], z - P.p[1]); if (d < bd) { bd = d; best = P; } }
  return best ? best.a : Object.keys(PROBES)[0];
}
function blendAt(x, z) {
  const base = baseRoom(x, z), w = {}; let others = 0;
  for (const P of PASSAGES) {
    if (P.a !== base && P.b !== base) continue;
    const d = Math.hypot(x - P.p[0], z - P.p[1]); if (d >= P.r) continue;
    const other = P.a === base ? P.b : P.a, t = 0.5 * smooth(0, 1, 1 - d / P.r);
    if (t > (w[other] || 0)) { others += t - (w[other] || 0); w[other] = t; }
  }
  if (others > 0.5) { for (const k of Object.keys(w)) w[k] *= 0.5 / others; others = 0.5; }
  w[base] = 1 - others; return w;
}
const _sh = new THREE.SphericalHarmonics3();
function updateAmbient() {
  if (!(S.mode === 'walk' && !pt.active)) { ambient.intensity = 0; return false; }
  const w = blendAt(walk.x, walk.z); _sh.zero(); let logk = 0, sky = 0, best = null, bw = 0;
  for (const [id, wt] of Object.entries(w)) {
    if (!PROBES[id]) { sky += wt; logk += wt * Math.log(K_OUT); continue; }
    const c = probe.cache[id];
    if (!c || !c.sh) { sky += wt * 0.35; logk += wt * Math.log(2.5); continue; }
    for (let j = 0; j < 9; j++) _sh.coefficients[j].addScaledVector(c.sh.coefficients[j], wt);
    logk += wt * Math.log(c.k); if (wt > bw) { bw = wt; best = id; }
  }
  ambient.sh.copy(_sh); ambient.intensity = 1;
  const useSky = sky > 0.5 || !best, d = skyInfo ? skyInfo.day : 1;
  scene.environment = useSky ? skyTex : probe.cache[best].env.texture;
  scene.environmentIntensity = useSky ? 0.6 * (0.08 + 0.92 * d) * Math.min(1, sky + 0.3) : REFL_K;
  autoExp.target = Math.exp(logk);
  return true;
}
const autoExp = { k: 1, target: 1 };
function applyEnv() {
  const walkMode = S.mode === 'walk', d = skyInfo ? skyInfo.day : 1;
  if (!updateAmbient()) { scene.environment = skyTex; scene.environmentIntensity = pt.active ? 1.0 : 0.85 * (0.08 + 0.92 * d); autoExp.target = walkMode ? autoExp.target : 1; }
  for (const l of portals) l.intensity = (walkMode || pt.active) ? 0 : (l.userData.i ?? 0);
  scene.backgroundBlurriness = S.mode === 'orbit' ? 0.35 : 0; scene.backgroundIntensity = 1;
  renderer.toneMappingExposure = S.exposure * (walkMode ? autoExp.k : 1.0);
  if (bloom) bloom.threshold = 1.15 / Math.max(0.2, renderer.toneMappingExposure);
}

/* ---------- Post-traitement ---------- */
let composer, gtao, bloom, photoPass;
function setupComposer() {
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  gtao = new GTAOPass(scene, camera, 1, 1); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.8, distanceExponent: 2.0, thickness: 1.0, scale: 1.3, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  composer.addPass(gtao);
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.18, 0.5, 1.0); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  photoPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: 0.22 }, grain: { value: 0.018 }, seed: { value: 0 }, contrast: { value: 0.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain, seed, contrast; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; col = mix(col, col * col * (3.0 - 2.0 * col), contrast);
        vec2 d = vUv - 0.5; col *= 1.0 - vig * smoothstep(0.25, 0.85, dot(d, d) * 2.2); col += (h(vUv * 1000.0) - 0.5) * grain; gl_FragColor = vec4(col, c.a); }`,
  });
  composer.addPass(photoPass);
  gtao.enabled = S.ao;
}
function resize() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h;
  if (!walk.userFov) { walk.fov = camera.aspect >= 1 ? 58 : 72; if (S.mode === 'walk') camera.fov = walk.fov; }
  camera.updateProjectionMatrix(); if (pt.active) pt.tracer.updateCamera(); invalidate();
}

/* ---------- Navigation ---------- */
let frames = 3; const invalidate = (n = 2) => { frames = Math.max(frames, n); };
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true; orbit.dampingFactor = 0.08; orbit.rotateSpeed = App.coarse ? 0.55 : 0.9; orbit.zoomSpeed = App.coarse ? 0.7 : 1; orbit.panSpeed = App.coarse ? 0.6 : 1; orbit.maxPolarAngle = Math.PI * 0.47; orbit.minDistance = 2.5; orbit.maxDistance = 55;
orbit.target.set(CEN[0], 0.6, CEN[1]); orbit.listenToKeyEvents(canvas);
orbit.addEventListener('change', () => { invalidate(); if (pt.active) stopPT(); });
const s0 = D.stops[0] || { p: CEN, yaw: 0, pitch: 0 };
const walk = { x: s0.p[0], z: s0.p[1], yaw: s0.yaw, pitch: s0.pitch || -0.06, glide: null, keys: new Set(), joy: { x: 0, y: 0 }, fov: 58, stuck: 0 };
let savedOrbit = null;
function allColliders() {
  const list = staticColliders.concat(ctxColliders, fixedColliders);
  if (S.bsoDrop >= 90) {} // les BSO sont à l'extérieur, hors de portée
  for (const op of operables) if (op.blocks !== false && op.t < 0.35 && op.target < 0.5) { const c = col(op.rect); c.op = op; list.push(c); }
  return list;
}
function collide(x, z, r = 0.18) {
  const list = allColliders();
  for (let it = 0; it < 4; it++) for (const c of list) {
    if (x < c.bb[0] - r || x > c.bb[1] + r || z < c.bb[2] - r || z > c.bb[3] + r) continue;
    const q = closestOnPoly(c.p, x, z);
    if (!q.inside && q.d >= r) continue;
    if (c.op && (walk.keys.size || walk.glide || walk.joy.x || walk.joy.y)) c.op.target = 1;
    if (q.inside) { const dx = q.cx - x, dz = q.cz - z, d = Math.hypot(dx, dz); if (d > 1e-9) { x = q.cx + dx / d * r; z = q.cz + dz / d * r; } else { x = q.cx + q.nx * r; z = q.cz + q.nz * r; } }
    else { const dx = x - q.cx, dz = z - q.cz; x = q.cx + dx / q.d * r; z = q.cz + dz / q.d * r; }
  }
  return [x, z];
}
/* un pas de marche : collisions, puis refus si l'on sort du logement. Tolérance de 4 cm : une fente de
   quelques millimètres entre un seuil et une pièce (cotes arrondies) ne doit pas bloquer le passage. */
const NEAR = [[0.04, 0], [-0.04, 0], [0, 0.04], [0, -0.04], [0.028, 0.028], [-0.028, 0.028], [0.028, -0.028], [-0.028, -0.028]];
const nearRoom = (x, z) => !!App.roomAt(x, z) || NEAR.some(([a, b]) => App.roomAt(x + a, z + b));
function walkMove(x0, z0, mx, mz) {
  const steps = Math.ceil(Math.hypot(mx, mz) / 0.05) || 1; let x = x0, z = z0;
  for (let i = 0; i < steps; i++) [x, z] = collide(x + mx / steps, z + mz / steps);
  return nearRoom(x, z) ? [x, z, false] : [x0, z0, true];
}
function setWalkCamera() {
  camera.position.set(walk.x, EYE + (App.isExt(App.roomAt(walk.x, walk.z)) ? -0.04 : 0), walk.z);
  camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
  App.viewer.x = walk.x; App.viewer.z = walk.z; App.viewer.yaw = walk.yaw; App.viewer.show = true; App.updateMarker();
  if (S.mode === 'walk') applyEnv();
  updateHud();
}
let lastRoom = null;
function updateHud() {
  let r = App.roomAt(walk.x, walk.z); if (r && r.of) r = D.rooms.find(q => q.id === r.of);
  const el = document.getElementById('hudRoom'), inf = document.getElementById('hudInfo'), id = r ? r.id : null;
  if (id === lastRoom) return; lastRoom = id; applyEnv(); invalidate(2);
  if (!r || r.hidden) return;
  el.textContent = r.name;
  inf.textContent = r.area ? `${r.area} m²` + (r.ext ? ' · extérieur' : D.hspLue ? ` · HSP ${App.fr(H)} m` : '') : (r.areaNote || '');
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-current', String(c.dataset.stop === r.id)));
}
function stepWalk(dt) {
  let fw = 0, st = 0, turn = 0; const k = walk.keys;
  if (k.has('KeyW') || k.has('ArrowUp')) fw += 1; if (k.has('KeyS') || k.has('ArrowDown')) fw -= 1;
  if (k.has('KeyA')) st -= 1; if (k.has('KeyD')) st += 1;
  if (k.has('ArrowLeft')) turn += 1; if (k.has('ArrowRight')) turn -= 1;
  fw += -walk.joy.y; st += walk.joy.x;
  if (fw || st || turn) { walk.glide = null; walk.anim = null; }
  walk.yaw += turn * 1.6 * dt;
  const speed = (k.has('ShiftLeft') || k.has('ShiftRight')) ? 2.6 : 1.35;
  let mx = 0, mz = 0; const f = [-Math.sin(walk.yaw), -Math.cos(walk.yaw)], rt = [Math.cos(walk.yaw), -Math.sin(walk.yaw)];
  if (fw || st) { const n = Math.hypot(fw, st); mx = (f[0] * fw + rt[0] * st) / Math.max(1, n) * speed * dt; mz = (f[1] * fw + rt[1] * st) / Math.max(1, n) * speed * dt; }
  if (walk.glide) { const dx = walk.glide.x - walk.x, dz = walk.glide.z - walk.z, d = Math.hypot(dx, dz); if (d < 0.04) walk.glide = null; else { const v = Math.min(1.9, 0.6 + d * 1.6) * dt; mx = dx / d * Math.min(v, d); mz = dz / d * Math.min(v, d); } }
  if (mx || mz || turn) {
    const [x, z] = walkMove(walk.x, walk.z, mx, mz);
    const moved = Math.hypot(x - walk.x, z - walk.z);
    if (walk.glide && moved < 0.002) { walk.stuck += dt; if (walk.stuck > 0.25) walk.glide = null; } else walk.stuck = 0;
    walk.x = x; walk.z = z; setWalkCamera(); invalidate(); if (pt.active) stopPT();
  }
}
addEventListener('keydown', e => {
  if (e.code === 'Escape') { const st = document.getElementById('settings'); if (!st.hidden) { st.hidden = true; document.getElementById('btnSettings').setAttribute('aria-expanded', 'false'); document.body.classList.remove('set-open'); } }
  if (S.mode !== 'walk' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || document.getElementById('fiche').open) return;
  if (e.code === 'KeyE' || (e.code === 'Enter' && e.target === canvas)) {
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw); let best = null, bd = 1.8;
    for (const op of operables) { const c = GEO.centroid(op.rect), dx = c[0] - walk.x, dz = c[1] - walk.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / d > 0.5) { bd = d; best = op; } }
    if (best) { best.target = best.target > 0.5 ? 0 : 1; invalidate(); e.preventDefault(); } return;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(e.code)) { walk.keys.add(e.code); e.preventDefault(); hideHint(); }
});
addEventListener('keyup', e => walk.keys.delete(e.code));
addEventListener('blur', () => walk.keys.clear());
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function isShown(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
function pick(e) {
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const roots = [G.arch, G.ceil, G.doors, G.fixed].filter(Boolean);
  const hits = ray.intersectObjects(roots, true).filter(h => h.object.isMesh && (!h.object.userData.glass || h.object.userData.op) && h.object !== cursor && isShown(h.object));
  return hits[0] || null;
}
const cursor = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.19, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
cursor.visible = false; cursor.renderOrder = 5; scene.add(cursor);
let drag = null;
canvas.addEventListener('pointerdown', e => { canvas.focus({ preventScroll: true }); if (walk.anim && S.mode === 'walk') walk.anim = null; drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId, yaw: walk.yaw, pitch: walk.pitch }; if (S.mode === 'walk') canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (drag && drag.id === e.pointerId) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (S.mode === 'walk' && drag.moved > 3) { const k = (App.coarse ? 0.0032 : 0.0042) * walk.fov / 72; walk.yaw = drag.yaw + dx * k; walk.pitch = clamp(drag.pitch + dy * k, -1.25, 1.25); setWalkCamera(); invalidate(); hideHint(); if (pt.active) stopPT(); cursor.visible = false; }
    return;
  }
  if (S.mode === 'walk' && e.pointerType === 'mouse') {
    const was = cursor.visible, h = pick(e), ok = h && h.object.userData.walk && h.face && h.face.normal.y > 0.5;
    if (ok) { cursor.position.copy(h.point).y += 0.004; cursor.visible = true; canvas.style.cursor = 'pointer'; } else { cursor.visible = false; canvas.style.cursor = h && h.object.userData.op ? 'pointer' : 'grab'; }
    if (ok || was) invalidate();
  } else if (S.mode === 'orbit' && e.pointerType === 'mouse' && !e.buttons) { const h = pick(e); canvas.style.cursor = h && h.object.userData.op ? 'pointer' : 'grab'; }
});
let lastTap = 0;
canvas.addEventListener('pointerup', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const click = drag.moved < 6 && performance.now() - drag.t < 500; drag = null; if (!click) return;
  const h = pick(e); if (!h) return;
  const op = h.object.userData.op;
  if (op) { op.target = op.target > 0.5 ? 0 : 1; if (pt.active) stopPT(); invalidate(); return; }
  if (S.mode === 'walk' && h.object.userData.walk && h.face && h.face.normal.y > 0.5) { if (navTo(h.point.x, h.point.z)) { hideHint(); return; } walk.glide = { x: h.point.x, z: h.point.z }; hideHint(); invalidate(); }
  if (S.mode === 'orbit') { const now = performance.now(); if (now - lastTap < 350 && h.object.userData.walk && App.roomAt(h.point.x, h.point.z)) App.engine.enterWalkAt(h.point.x, h.point.z); lastTap = now; }
});
canvas.addEventListener('pointerleave', () => { cursor.visible = false; invalidate(); });
canvas.addEventListener('wheel', e => { if (S.mode !== 'walk') return; e.preventDefault(); walk.userFov = true; walk.fov = clamp(walk.fov + e.deltaY * 0.03, 38, 90); camera.fov = walk.fov; camera.updateProjectionMatrix(); invalidate(); if (pt.active) stopPT(); }, { passive: false });
const joy = document.getElementById('joy'), knob = joy.querySelector('.knob'); let joyId = null;
const joyMove = e => { const r = joy.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const n = Math.hypot(x, y); if (n > 1) { x /= n; y /= n; }
  const m = Math.min(1, Math.hypot(x, y)), resp = m < 0.14 ? 0 : Math.pow((m - 0.14) / 0.86, 1.6) * 0.8; walk.joy.x = m ? x / m * resp : 0; walk.joy.y = m ? y / m * resp : 0; knob.style.transform = `translate(${x * 34}px,${y * 34}px)`; invalidate(); };
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); hideHint(); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; walk.joy.x = walk.joy.y = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
let hintTimer = null; const hideHint = () => { clearTimeout(hintTimer); hintTimer = setTimeout(() => document.getElementById('hint').classList.add('gone'), 2500); };

/* ---------- Modes et visite guidée ---------- */
let fade = null;
function fadeTo(fn) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(); invalidate(4); return; }
  let el = document.getElementById('fadeEl');
  if (!el) { el = document.createElement('div'); el.id = 'fadeEl'; el.style.cssText = 'position:absolute;inset:0;background:#0d0f0e;opacity:0;pointer-events:none;transition:opacity .28s;z-index:4'; document.getElementById('app').appendChild(el); }
  el.style.opacity = '1'; clearTimeout(fade);
  fade = setTimeout(() => { fn(); invalidate(4); requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '0'; })); }, 290);
}
function applyMode() {
  const m = S.mode, isWalk = m === 'walk', isOrbit = m === 'orbit';
  if (pt.active) stopPT();
  orbit.enabled = isOrbit;
  G.ceil.visible = !isOrbit; G.ctx.visible = !isOrbit; G.orbitGround.visible = isOrbit; G.lamps.visible = true;
  if (isWalk) {
    if (!savedOrbit) savedOrbit = { p: camera.position.clone(), t: orbit.target.clone() };
    camera.fov = walk.fov; camera.near = 0.05; camera.updateProjectionMatrix(); setWalkCamera();
    if (S.cut) App.set('cut', false);
  } else if (isOrbit) {
    cursor.visible = false; App.viewer.show = false; App.updateMarker();
    camera.fov = 40; camera.near = 0.1; camera.updateProjectionMatrix();
    if (savedOrbit) { camera.position.copy(savedOrbit.p); orbit.target.copy(savedOrbit.t); savedOrbit = null; }
    orbit.update();
  } else cursor.visible = false;
  document.getElementById('hint').classList.remove('gone'); if (!isWalk) hideHint();
  applyEnv(); invalidate(4);
}
function defaultOrbitView() {
  const a = camera.aspect || innerWidth / innerHeight, dist = SPAN * 1.45 / Math.min(1, a * 1.05); // tout le logement et sa loggia dans le cadre
  const dir = new THREE.Vector3(...(D.orbitDir || [0.35, 0.78, 0.62])).normalize();
  orbit.target.set(CEN[0], 0.3, CEN[1]); camera.position.copy(orbit.target).addScaledVector(dir, dist); orbit.update();
}
function freeSpot(x, z) {
  const room = roomIdAt(x, z), ok = (px, pz) => { const [cx, cz] = collide(px, pz); return Math.hypot(cx - px, cz - pz) < 0.005 && roomIdAt(px, pz) === room; };
  if (ok(x, z)) return [x, z];
  for (let r = 0.1; r <= 1.6; r += 0.1) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (ok(px, pz)) return [px, pz]; }
  return collide(x, z);
}
function enterWalkAt(x, z, yaw) {
  if (pt.active) stopPT();
  const go = () => {
    const [cx, cz] = freeSpot(x, z); walk.x = cx; walk.z = cz; walk.glide = null;
    if (yaw != null) walk.yaw = yaw;
    else { const r = App.roomAt(cx, cz), tgt = r ? GEO.centroid(r.poly) : CEN, dx = tgt[0] - cx, dz = tgt[1] - cz; if (Math.hypot(dx, dz) > 0.3) walk.yaw = Math.atan2(-dx, -dz); }
    walk.pitch = -0.06; lastRoom = null; autoExp.snap = true;
    if (S.mode !== 'walk') App.set('mode', 'walk'); else setWalkCamera();
  };
  if (S.mode === 'walk' && !walk.anim) { const [cx, cz] = freeSpot(x, z); if (navTo(cx, cz, yaw)) return; }
  if (S.mode === 'walk') fadeTo(go); else go();
}
/* itinéraires : grille de 8 cm, A*, lissage en ligne de vue */
const NAVG = { x0: D.bounds[0], z0: D.bounds[2], c: 0.08, nx: Math.ceil((D.bounds[1] - D.bounds[0]) / 0.08), nz: Math.ceil((D.bounds[3] - D.bounds[2]) / 0.08), grid: null, dirty: true, r: 0.20 };
function buildNavGrid() {
  const g = new Uint8Array(NAVG.nx * NAVG.nz), r = NAVG.r, list = staticColliders.concat(ctxColliders, fixedColliders);
  for (let j = 0; j < NAVG.nz; j++) for (let i = 0; i < NAVG.nx; i++) { const x = NAVG.x0 + (i + 0.5) * NAVG.c, z = NAVG.z0 + (j + 0.5) * NAVG.c, rr = App.roomAt(x, z); if (rr ? rr.id === 'placard' : !nearRoom(x, z)) g[j * NAVG.nx + i] = 1; } // même tolérance que la marche
  for (const c of list) {
    const i0 = Math.max(0, Math.floor((c.bb[0] - r - NAVG.x0) / NAVG.c)), i1 = Math.min(NAVG.nx - 1, Math.floor((c.bb[1] + r - NAVG.x0) / NAVG.c));
    const j0 = Math.max(0, Math.floor((c.bb[2] - r - NAVG.z0) / NAVG.c)), j1 = Math.min(NAVG.nz - 1, Math.floor((c.bb[3] + r - NAVG.z0) / NAVG.c));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * NAVG.nx + i; if (g[k]) continue; const q = closestOnPoly(c.p, NAVG.x0 + (i + 0.5) * NAVG.c, NAVG.z0 + (j + 0.5) * NAVG.c); if (q.inside || q.d < r) g[k] = 1; }
  }
  NAVG.grid = g; NAVG.dirty = false;
}
const cellOf = (x, z) => [Math.floor((x - NAVG.x0) / NAVG.c), Math.floor((z - NAVG.z0) / NAVG.c)];
const cellFree = (i, j) => i >= 0 && j >= 0 && i < NAVG.nx && j < NAVG.nz && !NAVG.grid[j * NAVG.nx + i];
function nearestFree(i, j) {
  if (cellFree(i, j)) return [i, j];
  for (let r = 1; r < 25; r++) { let best = null, bd = 1e9; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; if (cellFree(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } } } if (best) return best; }
  return null;
}
function lineFree(a, b) { const [i0, j0] = cellOf(a[0], a[1]), [i1, j1] = cellOf(b[0], b[1]), n = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)) * 2 + 1; for (let k = 0; k <= n; k++) { const t = k / n, [i, j] = cellOf(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); if (!cellFree(i, j)) return false; } return true; }
function findPath(x0, z0, x1, z1) {
  if (NAVG.dirty || !NAVG.grid) buildNavGrid();
  const s0 = nearestFree(...cellOf(x0, z0)), g0 = nearestFree(...cellOf(x1, z1)); if (!s0 || !g0) return null;
  const nx = NAVG.nx, N = nx * NAVG.nz, gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const start = s0[1] * nx + s0[0], goal = g0[1] * nx + g0[0];
  const h = k => { const di = Math.abs((k % nx) - g0[0]), dj = Math.abs(Math.floor(k / nx) - g0[1]); return Math.max(di, dj) + 0.414 * Math.min(di, dj); };
  const heap = [[h(start), start]]; gs[start] = 0;
  const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let found = false;
  while (heap.length) {
    const [, k] = pop(); if (closed[k]) continue; closed[k] = 1; if (k === goal) { found = true; break; }
    const ci = k % nx, cj = Math.floor(k / nx);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!cellFree(ni, nj)) continue;
      if (di && dj && (!cellFree(ci + di, cj) || !cellFree(ci, cj + dj))) continue;
      const nk = nj * nx + ni, ng = gs[k] + (di && dj ? 1.414 : 1); if (ng < gs[nk]) { gs[nk] = ng; came[nk] = k; push(ng + h(nk), nk); }
    }
  }
  if (!found) return null;
  const cells = []; for (let k = goal; k !== -1; k = came[k]) cells.unshift([NAVG.x0 + ((k % nx) + 0.5) * NAVG.c, NAVG.z0 + (Math.floor(k / nx) + 0.5) * NAVG.c]);
  cells[0] = [x0, z0]; cells[cells.length - 1] = cellFree(...cellOf(x1, z1)) ? [x1, z1] : cells[cells.length - 1];
  const out = [cells[0]]; let a = 0;
  while (a < cells.length - 1) { let b = cells.length - 1; while (b > a + 1 && !lineFree(cells[a], cells[b])) b--; out.push(cells[b]); a = b; }
  return out;
}
function openDoorsOnPath(P) {
  const pts = [];
  for (let i = 1; i < P.length; i++) for (let t = 0; t <= 1; t += 0.05) pts.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t]);
  const segD = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-9, t = clamp(((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2, 0, 1); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
  for (const op of operables) {
    const o = D.openings[op.id];
    if (op.id === 'placard' || !o || o.sill > 0) continue;
    const traverse = pts.some(p => closestOnPoly(op.rect, p[0], p[1]).d < 0.12);
    if (traverse) { op.target = 1; continue; }
    if (o.kind !== 'door' && o.kind !== 'entry') continue;
    // porte que l'on longe : son vantail ouvert ne doit pas barrer le passage
    const lf = (App.doorLeaves(op.id) || [])[0];
    if (lf && pts.some(p => segD(p, lf.h, lf.op) < 0.3)) op.target = 0;
  }
}
function navTo(x, z, yaw, pitch, onEnd) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  // les portes fermées ne bloquent pas l'itinéraire : elles s'ouvrent au passage
  const P = findPath(walk.x, walk.z, x, z); if (!P || P.length < 2) return false;
  openDoorsOnPath(P);
  let len = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(len); }
  if (len < 0.05 && yaw == null) return true;
  const last = P[P.length - 1], prev = P[P.length - 2], endYaw = yaw ?? Math.atan2(-(last[0] - prev[0]), -(last[1] - prev[1]));
  walk.anim = { P, cum, len, t: 0, dur: clamp(0.4 + len / 2.5, 0.7, 4.2), yaw0: walk.yaw, pitch0: walk.pitch, yaw1: endYaw, pitch1: pitch ?? Math.min(walk.pitch, -0.04), onEnd };
  walk.glide = null; invalidate(); return true;
}
function stepAnim(dt) {
  const a = walk.anim; a.t = Math.min(1, a.t + dt / a.dur);
  const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2, s = e * a.len;
  let i = 1; while (i < a.cum.length - 1 && a.cum[i] < s) i++;
  const f = (s - a.cum[i - 1]) / Math.max(1e-6, a.cum[i] - a.cum[i - 1]), p0 = a.P[i - 1], p1 = a.P[i];
  walk.x = p0[0] + (p1[0] - p0[0]) * f; walk.z = p0[1] + (p1[1] - p0[1]) * f;
  const look = s + 0.6; let j = 1; while (j < a.cum.length - 1 && a.cum[j] < look) j++;
  const q0 = a.P[j - 1], q1 = a.P[j], ff = Math.min(1, (look - a.cum[j - 1]) / Math.max(1e-6, a.cum[j] - a.cum[j - 1]));
  const lx = q0[0] + (q1[0] - q0[0]) * ff - walk.x, lz = q0[1] + (q1[1] - q0[1]) * ff - walk.z, travelYaw = Math.hypot(lx, lz) > 0.05 ? Math.atan2(-lx, -lz) : walk.yaw;
  const wEnd = smooth(0.6, 1, a.t), wStart = 1 - smooth(0, 0.25, a.t);
  const angLerp = (y0, y1, t) => { let d = y1 - y0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return y0 + d * t; };
  walk.yaw = angLerp(angLerp(a.yaw0, travelYaw, 1 - wStart), a.yaw1, wEnd); walk.pitch = a.pitch0 + (a.pitch1 - a.pitch0) * e;
  setWalkCamera(); invalidate();
  if (a.t >= 1) { walk.anim = null; if (a.onEnd) a.onEnd(); }
}
function openFor(s, instant) { // portes ouvertes pour l'arrêt, et fermées celles dont le vantail boucherait la vue
  for (const [ids, v] of [[s.open || [], 1], [s.close || [], 0]]) for (const id of ids) { const op = operables.find(o => o.id === id); if (op) { op.target = v; if (instant) { op.t = v; op.apply(v); } } }
}
function goStop(id) {
  const s = D.stops.find(q => q.id === id); if (!s) return;
  if (S.mode === 'orbit') {
    const r = D.rooms.find(q => q.id === id), c = r ? GEO.centroid(r.poly) : [s.p[0] - Math.sin(s.yaw) * 1.5, s.p[1] - Math.cos(s.yaw) * 1.5];
    animOrbit(new THREE.Vector3(c[0], 0.4, c[1]), new THREE.Vector3(c[0] + 3.0, 7.5, c[1] + 5.5));
    document.querySelectorAll('.chip').forEach(ch => ch.setAttribute('aria-current', String(ch.dataset.stop === id))); return;
  }
  if (pt.active) stopPT();
  if (S.mode === 'walk' && !walk.anim) { openFor(s); if (navTo(s.p[0], s.p[1], s.yaw, s.pitch)) return; }
  const go = () => { walk.x = s.p[0]; walk.z = s.p[1]; walk.yaw = s.yaw; walk.pitch = s.pitch ?? -0.06; walk.glide = null; lastRoom = null; openFor(s, true); autoExp.snap = true; if (S.mode !== 'walk') App.set('mode', 'walk'); else setWalkCamera(); };
  if (S.mode === 'walk') fadeTo(go); else go();
}
let orbitAnim = null;
function animOrbit(target, pos) { orbitAnim = { t0: performance.now(), dur: 900, ft: orbit.target.clone(), fp: camera.position.clone(), tt: target, tp: pos }; }

/* ---------- Rendu photoréaliste (lancer de rayons) ---------- */
const pt = { active: false, tracer: null, busy: false, max: 1500 };
const ptEl = document.getElementById('pt'), ptMsg = document.getElementById('ptMsg');
async function startPT() {
  if (pt.busy || pt.active) return;
  if (S.mode === 'plan') { App.set('mode', 'orbit'); await new Promise(r => setTimeout(r, 300)); }
  pt.busy = true; ptEl.hidden = false; ptMsg.textContent = 'Préparation du rendu…';
  try {
    const mod = await import('three-gpu-pathtracer');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!pt.tracer) { pt.tracer = new mod.WebGLPathTracer(renderer); pt.tracer.tiles.set(2, 2); pt.tracer.bounces = 7; pt.tracer.transmissiveBounces = 6; pt.tracer.filterGlossyFactor = 0.4; pt.tracer.minSamples = 1; pt.tracer.renderDelay = 0; pt.tracer.fadeDuration = 250; pt.tracer.renderScale = App.coarse ? 0.6 : 1; }
    togglePTScene(true);
    if (pt.dirty !== false) { pt.tracer.setScene(scene, camera); pt.dirty = false; } else { pt.tracer.updateCamera(); pt.tracer.reset(); }
    pt.active = true;
  } catch (err) { console.error(err); ptMsg.textContent = 'Rendu photo indisponible sur cet appareil.'; togglePTScene(false); setTimeout(() => { if (!pt.active) ptEl.hidden = true; }, 3500); }
  pt.busy = false;
}
const ptSaved = {};
function togglePTScene(on) {
  if (on) {
    ptSaved.fog = scene.fog; scene.fog = null; cursor.visible = false; G.shadowRoof.visible = false; mirrorsForPT(true);
    Object.assign(M.glass, { transmission: 1, opacity: 1, transparent: false, depthWrite: true }); M.glass.needsUpdate = true;
    portals.forEach(l => { l.visible = false; });
    scene.backgroundBlurriness = 0; scene.environment = skyTex; ambient.intensity = 0; scene.environmentIntensity = 1.0;
  } else {
    if ('fog' in ptSaved) scene.fog = ptSaved.fog;
    Object.assign(M.glass, { transmission: 0, opacity: 0.12, transparent: true, depthWrite: false }); M.glass.needsUpdate = true;
    portals.forEach(l => { l.visible = true; }); G.shadowRoof.visible = true; mirrorsForPT(false); applyEnv();
  }
}
function stopPT() { if (!pt.active) return; pt.active = false; togglePTScene(false); ptEl.hidden = true; invalidate(3); }
document.getElementById('btnPhoto').addEventListener('click', () => { document.getElementById('settings').hidden = true; document.getElementById('btnSettings').setAttribute('aria-expanded', 'false'); startPT(); });
document.getElementById('ptStop').addEventListener('click', stopPT);

/* ---------- Réactions aux réglages ---------- */
App.on(k => {
  if (!App.engine) return;
  if (!['exposure', 'ao', 'underlay', 'dims', 'moment'].includes(k)) markShadows();
  if (['bsoDrop', 'cut'].includes(k)) NAVG.dirty = true;
  if (['bsoDrop', 'bsoTilt', 'season', 'hour', 'lights', 'cut'].includes(k)) pt.dirty = true;
  if (['lights', 'bsoDrop', 'bsoTilt'].includes(k)) invalidateProbes();
  if (k === 'mode') { applyMode(); if (S.mode === 'walk') queueProbes(); }
  if (['season', 'hour', 'lights'].includes(k)) { if (pt.active) stopPT(); updateSun(); }
  if (k === 'bsoDrop' || k === 'bsoTilt') { if (pt.active) stopPT(); buildBSO(); updateSun(); }
  if (k === 'exposure') { applyEnv(); invalidate(); }
  if (k === 'ao') { gtao.enabled = S.ao; invalidate(); }
  if (k === 'cut') { if (pt.active) stopPT(); buildArch(S.cut ? 1.2 : null); renderer.clippingPlanes = S.cut ? [cutPlane] : []; G.ceil.visible = S.mode !== 'orbit'; G.doors.visible = !S.cut; G.bso.visible = !S.cut; if (S.cut && S.mode === 'walk') App.set('mode', 'orbit'); invalidate(); }
});

/* ---------- Boucle ---------- */
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (S.mode === 'plan') return;
  for (const op of operables) if (Math.abs(op.t - op.target) > 1e-4) {
    op.t += Math.sign(op.target - op.t) * Math.min(Math.abs(op.target - op.t), op.speed * dt);
    const e = op.t < 0.5 ? 2 * op.t * op.t : 1 - Math.pow(-2 * op.t + 2, 2) / 2; op.apply(e); invalidate(); markShadows(); pt.dirty = true; if (pt.active) stopPT();
  }
  if (S.mode === 'walk') { if (walk.anim) stepAnim(dt); else stepWalk(dt); }
  if (S.mode === 'orbit') {
    if (orbitAnim) { const t = clamp((performance.now() - orbitAnim.t0) / orbitAnim.dur, 0, 1), e = 1 - Math.pow(1 - t, 3); orbit.target.lerpVectors(orbitAnim.ft, orbitAnim.tt, e); camera.position.lerpVectors(orbitAnim.fp, orbitAnim.tp, e); if (t >= 1) orbitAnim = null; invalidate(); }
    orbit.update();
  }
  if (pt.active) { const n = Math.floor(pt.tracer.samples); if (n < pt.max) pt.tracer.renderSample(); ptMsg.textContent = n < pt.max ? `Rendu photo · ${n} passes · reste immobile` : `Rendu photo terminé · ${n} passes`; return; }
  if (probe.queue.length && S.mode === 'walk') { captureProbe(probe.queue.shift()); applyEnv(); invalidate(2); }
  if (autoExp.snap && S.mode === 'walk' && !probe.queue.length) { applyEnv(); autoExp.k = autoExp.target; autoExp.snap = false; applyEnv(); invalidate(2); }
  const tk = S.mode === 'walk' ? autoExp.target : 1;
  if (Math.abs(tk - autoExp.k) / tk > 0.005) { autoExp.k += (tk - autoExp.k) * Math.min(1, dt * 3); renderer.toneMappingExposure = S.exposure * (S.mode === 'walk' ? autoExp.k : 1); if (bloom) bloom.threshold = 1.15 / Math.max(0.2, renderer.toneMappingExposure); invalidate(); }
  else if (autoExp.k !== tk) { autoExp.k = tk; renderer.toneMappingExposure = S.exposure * (S.mode === 'walk' ? autoExp.k : 1); invalidate(); }
  if (frames > 0) { frames--; composer.render(); }
}

/* ---------- Démarrage ---------- */
async function start() {
  App.loader('Génération des matières…', 0.08); await sleep();
  await buildTextures();
  App.loader('Construction du logement…', 0.82); await sleep();
  makeMaterials(); cursor.material = M.hover;
  buildArch(S.cut ? 1.2 : null); renderer.clippingPlanes = S.cut ? [cutPlane] : [];
  G.doors = new THREE.Group(); scene.add(G.doors);
  for (const [id, o] of Object.entries(D.openings)) { if (o.kind === 'door' || o.kind === 'entry') buildDoor(id, G.doors); else if (o.kind === 'window' || o.kind === 'french') buildWindow(id, G.doors); }
  buildBSO(); buildFixed(); buildLamps(); buildContext(); buildPortals(); buildShadowRoof();
  setupComposer();
  App.loader('Lumière du jour…', 0.94); await sleep();
  updateSun(); resize(); defaultOrbitView();
  G.doors.visible = !S.cut;
  App.engine = { goStop, enterWalkAt: (x, z, yaw) => enterWalkAt(x, z, yaw) };
  applyMode();
  renderer.setAnimationLoop(loop);
  addEventListener('resize', resize); new ResizeObserver(resize).observe(canvas);
  App.loaded(); document.getElementById('err')?.remove();
  document.querySelectorAll('.modes button').forEach(b => { b.disabled = false; });
  window.__v = { scene, camera, renderer, walk, operables, S, startPT, stopPT, pt, M, G, invalidate, probe, captureProbe, THREE, autoExp, applyEnv, blendAt, setWalkCamera, findPath, openDoorsOnPath, defaultOrbitView, orbit, queueProbes, collide, walkMove };
}
start().catch(e => { console.error(e); App.fail('Erreur : ' + (e && e.message ? e.message : e)); });
