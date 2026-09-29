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
import { listeMatieres, genere, rng, hash2 } from './matieres.js';

const App = window.App;
App.engineStarting = true;
const D = await App.ready, S = App.state, GEO = App.geo, VV = GEO.V;
const H = D.H, EYE = 1.60;
// niveaux (un niveau implicite si plan.json n'en décrit pas) : sol du niveau k à LV[k].y, hauteur sous plafond LV[k].H
const LV = D.levels, NL = LV.length, MULTI = !!D.multi, TOP = NL - 1, STAIRS = D.stairs || [], YTOP = LV[TOP].y, HTOP = LV[TOP].H;
const CTX = D.context || {}, LEVEL = CTX.level || 2.8;
const GROUND = -(D.etage || 0) * LEVEL - 0.15, ROOF = YTOP + ((CTX.above ?? 1) + 1) * LEVEL - 0.02;
const OUTS = [].concat(...LV.map(l => l.outline));
const [BX0, BX1, BZ0, BZ1] = GEO.bbox(OUTS);
// cadrage de la maquette, du soleil et du sol : le logement et ses loggias (le contour, lui, exclut la loggia)
const FR = GEO.bbox(OUTS.concat(...(D.loggias || []).map(l => l.slab)));
const CEN = [(FR[0] + FR[1]) / 2, (FR[2] + FR[3]) / 2], SPAN = Math.max(FR[1] - FR[0], FR[3] - FR[2]);
const sleep = () => new Promise(r => setTimeout(r, 0));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- Rendu ---------- */
const canvas = document.getElementById('gl');
// mode photo et contrôle (?shoot=1 : photos.mjs, controle.mjs, trajets.mjs, marche.mjs) : rendu toujours en pleine qualité, sondes,
// ombres et champ de vision comme avant, pour des photos et des contrôles identiques
const SHOOT = /shoot/.test(location.search);
/* rendu « simple » (par défaut, retour R4 du 29/09/2026 : « une lumière simple, efficace, qui montre bien les murs ») : éclairage fixe,
   sans aucun calcul qui dépende de la scène (ni ombre, ni occlusion ambiante, ni sonde, ni exposition automatique, ni bloom, ni lampe
   calculée) : un ciel de jour figé, un environnement neutre et deux directionnelles sans ombre d'orientation fixe, qui donnent à chaque
   orientation de mur, au sol et au plafond une valeur différente. Rien ne dépend de l'heure, de la pièce ni de la position : aucune fuite
   à travers un mur, aucun saut au passage d'une porte, aucune lampe qui s'allume ou s'éteint, par construction. « Ultra réaliste »
   (réglage S.rendu = 'ultra') : le rendu complet d'avant, à l'identique. Mode photo (?shoot=1 : photos, panoramas, contrôle) : ultra
   réaliste par défaut (?rendu=simple le force) */
const simple = () => S.rendu !== 'ultra';
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: SHOOT }); }
catch (e) { App.fail('WebGL n\'est pas disponible sur cet appareil.'); throw e; }
const PR_FULL = Math.min(devicePixelRatio, App.coarse ? 1.5 : 1.75); // pixel ratio de l'image à l'arrêt
renderer.setPixelRatio(PR_FULL);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
let shadowAll = true;
const markShadows = () => { renderer.shadowMap.needsUpdate = true; shadowAll = true; }; // hors mode photo : voir shadowPass()
renderer.toneMapping = THREE.AgXToneMapping;
/* rendu simple : les deux directionnelles, sans ombre, éclairent aussi l'intérieur à travers murs et plafonds ; leur reflet direct faisait
   une tache blanche sur les surfaces lisses (porte, façade de placard, faïence : tache à 246 sur 255 en haut de l'entrée du 3124). Reflet
   direct (spéculaire, vernis, lustre) retiré pour toute directionnelle sans carte d'ombre, donc seulement en rendu simple : en ultra
   réaliste et en mode photo le soleil porte ombre, son reflet reste. Contrôlé par moteur/controle.mjs (aucune tache de reflet en rendu
   simple) */
{
  const RD = '\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t}\n\t#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 )';
  const c = THREE.ShaderChunk.lights_fragment_begin;
  if (!c.includes(RD)) console.warn('three.js : bloc des directionnelles introuvable, reflets du rendu simple gardés');
  else THREE.ShaderChunk.lights_fragment_begin = c.replace(RD, `\t\t#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
\t\t#else
\t\t{ vec3 specAvant = reflectedLight.directSpecular;
\t\t#ifdef USE_CLEARCOAT
\t\tvec3 ccAvant = clearcoatSpecularDirect;
\t\t#endif
\t\t#ifdef USE_SHEEN
\t\tvec3 shAvant = sheenSpecularDirect;
\t\t#endif
\t\tRE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
\t\treflectedLight.directSpecular = specAvant;
\t\t#ifdef USE_CLEARCOAT
\t\tclearcoatSpecularDirect = ccAvant;
\t\t#endif
\t\t#ifdef USE_SHEEN
\t\tsheenSpecularDirect = shAvant;
\t\t#endif
\t\t}
\t\t#endif` + RD.slice(RD.indexOf('\n\t}')));
}
RectAreaLightUniformsLib.init();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 600);
camera.rotation.order = 'YXZ';

/* ---------- Textures procédurales (moteur/matieres.js) ----------
   Générées au chargement, sans fichier ni réseau, par des workers en parallèle (le fil principal reste libre pour l'écran de
   chargement) ; mêmes calculs, donc mêmes pixels, que la génération d'avant dans la page, qui sert de repli. Résolution selon
   l'appareil : moitié (mémoire des textures divisée par 4, génération 4 fois plus courte) sur écran tactile, sur un appareil à 4 Go
   de mémoire ou moins et en rendu logiciel ; pleine ailleurs, et toujours en mode photo et contrôle. ?matieres=0.5 ou 1 la force.
   Mipmaps générées par le GPU ; anisotropie au maximum à l'arrêt, réduite selon le palier en mouvement (setAniso) */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texFrom(c, srgb, rep) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = maxAniso; t.repeat.set(1 / rep[0], 1 / rep[1]); return t; }
function texRaw(r, rep) { // couleur, rugosité, normale d'une matière générée → textures (canevas, comme avant)
  const put = arr => { const c = makeCanvas(r.W, r.H); c.getContext('2d').putImageData(new ImageData(arr, r.W, r.H), 0, 0); return c; };
  return { map: texFrom(put(r.col), true, rep), rough: texFrom(put(r.rou), false, rep), normal: texFrom(put(r.nor), false, rep) };
}
const T = {};
const SOFTGL = (() => { try { const gl = renderer.getContext(), x = gl.getExtension('WEBGL_debug_renderer_info'); return /swiftshader|llvmpipe|software/i.test(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return false; } })();
const TEXQ = SHOOT ? 1 : (() => { const q = parseFloat(new URLSearchParams(location.search).get('matieres')); if (q === 0.5 || q === 1) return q;
  return App.coarse || (navigator.deviceMemory && navigator.deviceMemory <= 4) || SOFTGL ? 0.5 : 1; })();
async function buildTextures() {
  const lg = (D.loggia && D.loggia.tile) || 0.5, mats = listeMatieres(lg, LEVEL), t0 = performance.now();
  // tâches : une matière, ou une bande de ses lignes (parquet en 6, carrelages en 2 ou 3) ; les plus grosses d'abord
  const jobs = [], acc = {};
  for (const m of mats) for (let i = 0; i < m.parts; i++) jobs.push({ m, i });
  const nw = Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 2) - 1)); let done = 0;
  const recu = (jb, r) => {
    const m = jb.m, a = acc[m.cle] || (acc[m.cle] = { n: 0, W: r.W, H: r.H, col: new Uint8ClampedArray(r.W * r.H * 4), rou: new Uint8ClampedArray(r.W * r.H * 4), nor: new Uint8ClampedArray(r.W * r.H * 4) });
    const o = r.y0 * r.W * 4; a.col.set(r.col, o); a.rou.set(r.rou, o); a.nor.set(r.nor, o); a.n++;
    if (a.n === m.parts) { T[m.cle] = texRaw(a, m.rep); done++; App.loader(`Matières : ${done} sur ${mats.length}…`, 0.1 + 0.7 * done / mats.length); }
  };
  let workers = [];
  try {
    workers = Array.from({ length: nw }, () => new Worker(new URL('./matieres.js', import.meta.url), { type: 'module' }));
    const queue = jobs.slice();
    // chien de garde : aucune réponse d'aucun worker pendant 20 s (worker muet, arrêté par le navigateur) → repli dans la page, jamais
    // de chargement sans fin
    let veille = null; const garde = rej => { clearTimeout(veille); veille = setTimeout(() => rej(new Error('matières : workers muets')), 20000); };
    await new Promise((fin, echec) => {
      garde(echec);
      Promise.all(workers.map(w => new Promise((res, rej) => {
        const next = () => { const jb = queue.shift(); if (!jb) { w.terminate(); res(); return; } w.onmessage = e => { garde(echec); recu(jb, e.data); next(); }; w.onerror = e => { e.preventDefault(); rej(e); }; w.onmessageerror = () => rej(new Error('matières : message illisible'));
          w.postMessage({ gen: jb.m.gen, p: jb.m.p, q: TEXQ, b: jb.m.parts > 1 ? [jb.i, jb.m.parts] : null }); };
        next();
      }))).then(fin, echec);
    }).finally(() => clearTimeout(veille));
  } catch (e) { // worker impossible (navigateur, politique de sécurité) ou muet : dans la page, comme avant
    for (const w of workers) w.terminate();
    for (const m of mats) if (!T[m.cle]) { await sleep(); T[m.cle] = texRaw(genere(m.gen, m.p, TEXQ), m.rep); done++; App.loader(`Matières : ${done} sur ${mats.length}…`, 0.1 + 0.7 * done / mats.length); }
  }
  App.texMs = Math.round(performance.now() - t0);
}
/* anisotropie des textures des matières, sans les renvoyer au GPU (paramètre de la texture seulement) */
let anisoCur = maxAniso;
function setAniso(a) {
  a = Math.max(1, Math.min(maxAniso, a)); if (a === anisoCur) return; anisoCur = a;
  const gl = renderer.getContext(), ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (!ext) return;
  for (const t of Object.values(T)) for (const tx of [t.map, t.rough, t.normal]) {
    const w = renderer.properties.get(tx).__webglTexture; if (!w) continue;
    renderer.state.bindTexture(gl.TEXTURE_2D, w); gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, a);
  }
}

/* ---------- Matériaux (finitions de livraison supposées) ---------- */
const M = {};
const mk = (k, p = {}) => (M[k] = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0 }, p)));
function setTex(m, t, ns = 1, rough = 1) { m.map = t.map; m.roughnessMap = t.rough; m.normalMap = t.normal; m.normalScale.set(ns, ns); m.roughness = rough; }
function makeMaterials() {
  mk('wall_b', { color: 0xf2f2ef }); setTex(M.wall_b, T.paint, 0.25);
  mk('wall_c', { color: 0xf2f2ef }); setTex(M.wall_c, T.paint, 0.25);
  // ombre du soleil : les murs s'y inscrivent par leurs deux faces. Par la face arrière seule (réglage de three.js), le biais d'ombre
  // éclaire 2 à 3 cm derrière le nu intérieur d'un mur de façade ensoleillé : fente de lumière dans l'angle d'une pièce (WC du 3081 à 10 h)
  M.wall_b.shadowSide = M.wall_c.shadowSide = THREE.DoubleSide;
  mk('ceiling', { color: 0xf8f7f3 }); setTex(M.ceiling, T.paint, 0.15);
  // plafond sous un niveau et dalle portant un niveau : leurs chants sont dans le plan de la façade des murs superposés ; repoussés
  // en profondeur, le mur l'emporte (sinon bande qui scintille en façade au raccord des niveaux)
  mk('ceiling_j', { color: 0xf8f7f3, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }); setTex(M.ceiling_j, T.paint, 0.15);
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
  mk('slab_j', { color: 0xc9c7c1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }); setTex(M.slab_j, T.ext, 0.5);
  mk('seuil', { color: 0x9a9c9c, metalness: 0.7, roughness: 0.35 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 1.4, ior: 1.5, thickness: 0.006 });
  // vitrage : ni plafonnier ni soleil en reflet ponctuel (« yeux dans les arbres », fiche C6) ; le reflet du ciel et de la pièce reste
  M.glass.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n\treflectedLight.directSpecular = vec3( 0.0 );'); };
  M.glass.customProgramCacheKey = () => 'verre-sans-reflet-direct';
  mk('darkglass', { color: 0x1d2328, roughness: 0.06, metalness: 0.2 });
  mk('entry_leaf', { color: 0x4a4f53, roughness: 0.5 }); // éclaircie en rendu simple (ENTRY_LEAF)
  mk('steel', { color: 0xbfc2c4, metalness: 1, roughness: 0.28 });
  mk('chrome', { color: 0xeeeeee, metalness: 1, roughness: 0.06, envMapIntensity: 4 }); M.steel.envMapIntensity = 3.5;
  M.ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f3, roughness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.06 });
  mk('tray', { color: 0xf2f1ee, roughness: 0.55 });
  mk('lacquer', { color: 0xecebe7, roughness: 0.35 });
  mk('mirror', { color: 0xffffff, metalness: 1, roughness: 0.015 });
  mk('bso', { color: 0x8f9396, metalness: 0.15, roughness: 0.55 });
  mk('rail', { color: 0x3a3d40, metalness: 0.6, roughness: 0.45 });
  // barreaux intérieurs (escalier, trémie) : même matière, clé à part pour leur retirer l'ombre sans l'ôter aux garde-corps des loggias
  // (fusionnés par matière dans le même lot, ceux-ci perdaient leur ombre au soleil : constat du 28/09/2026)
  mk('rail_int', { color: 0x3a3d40, metalness: 0.6, roughness: 0.45 });
  mk('pvc', { color: 0x8c8f91, roughness: 0.6 });
  mk('facade'); setTex(M.facade, T.facade, 0.2);
  mk('ground', { color: 0xffffff }); setTex(M.ground, T.grass, 0.6);
  mk('paving'); setTex(M.paving, T.paving, 0.8);
  mk('palier_floor', { color: 0xb9b6ae }); setTex(M.palier_floor, T.gres, 0.5);
  mk('trunk', { color: 0x4a3b2c, roughness: 0.9 });
  mk('leaf', { color: 0x5a7439, roughness: 0.85 }); setTex(M.leaf, T.foliage, 1.6, 0.9); mk('leaf2', { color: 0x40592d, roughness: 0.8 }); setTex(M.leaf2, T.foliage, 1.6, 0.85);
  M.bulb = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.3 });
  M.bulbOn = new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xffd9a0, emissiveIntensity: 5, roughness: 0.3 });
  for (const m of [M.bulb, M.bulbOn]) lampesSeules(m);
  mk('dcl', { color: 0xf2f2f0, roughness: 0.5 });
  mk('cable', { color: 0x1a1a1a, roughness: 0.6 });
  mk('cap', { color: 0x1c1e1d, roughness: 0.95 });
  mk('orbit_ground', { color: 0xc9ccc6, roughness: 1 });
  mk('tableau', { color: 0xf2f2ef, roughness: 0.4 });
  mk('towel', { color: 0xf3f3f1, roughness: 0.25, metalness: 0.1 });
  M.hover = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false });
}

/* ampoules : en visite, elles reçoivent l'ombre des lampes, jamais celle du soleil (voir reglagesVisite ; en mode photo, aucune ombre
   reçue : même rendu qu'avant) */
const LFB_LAMPES = THREE.ShaderChunk.lights_fragment_begin.replace('directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap', 'directLight.color *= ( directLight.visible && false ) ? getShadow( directionalShadowMap');
function lampesSeules(m) {
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', LFB_LAMPES); };
  m.customProgramCacheKey = () => 'lampes-seules';
}

/* ---------- Miroirs ---------- */
const mirrors = [];
function makeMirror(parent, w, h, x, y, z, rotY) {
  const ppm = App.coarse ? 300 : 600, g = new THREE.Group();
  const refl = new Reflector(new THREE.PlaneGeometry(w, h), { textureWidth: Math.min(1024, Math.round(w * ppm)), textureHeight: Math.min(1024, Math.round(h * ppm)), clipBias: 0.003, color: 0xc9cccc, multisample: 0 });
  const std = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.mirror); std.visible = false;
  const obr = refl.onBeforeRender; refl.onBeforeRender = function (r, sc, cam) { if (sc.overrideMaterial || cam.isCubeCamera || cam.parent?.isCubeCamera) return; obr.call(this, r, sc, cam); };
  const edge = new THREE.Mesh(prep(boxG(-w / 2 - 0.004, w / 2 + 0.004, -h / 2 - 0.004, h / 2 + 0.004, -0.006, -0.0005)), M.steel);
  RECOIT.push(edge); g.add(refl, std, edge); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
  g.userData.cells = cellsOfObject(std);
  mirrors.push({ refl, std, g, h }); return g;
}
function mirrorsForPT(on) { for (const m of mirrors) { m.refl.visible = !on; m.std.visible = on; } }
/* coupe : un miroir (Reflector, sans plans de coupe dans son shader) traversé par le plan de coupe est retiré, sinon il flotte au-dessus des murs coupés */
function mirrorsForCut() { const v = new THREE.Vector3(); for (const m of mirrors) { m.g.getWorldPosition(v); m.g.visible = !(S.cut && v.y + m.h / 2 > cutPlane.constant && v.y - m.h / 2 < cutPlane.constant); } }

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
/* découpe d'un maillage fusionné : triangles regroupés par clé (pièces dont ils touchent l'air, case du contexte), mêmes sommets, même
   ordre dans chaque groupe. keyOf(A, B, C) reçoit les sommets (vecteurs de travail, modifiables) ; null : même clé que le précédent */
const _ta = new THREE.Vector3(), _tb = new THREE.Vector3(), _tc = new THREE.Vector3();
function splitGeometry(g, keyOf) {
  const pos = g.attributes.position.array, n = pos.length / 9, keys = new Array(n), count = new Map(); let prev = null;
  for (let t = 0; t < n; t++) {
    _ta.fromArray(pos, t * 9); _tb.fromArray(pos, t * 9 + 3); _tc.fromArray(pos, t * 9 + 6);
    const k = keyOf(_ta, _tb, _tc) ?? prev ?? '*'; keys[t] = prev = k; count.set(k, (count.get(k) || 0) + 1);
  }
  if (count.size <= 1) return [[keys[0] ?? '*', g]];
  const out = [];
  for (const [k, c] of count) {
    const ng = new THREE.BufferGeometry();
    for (const [name, att] of Object.entries(g.attributes)) {
      const s = att.itemSize * 3, src = att.array, dst = new Float32Array(c * s); let o = 0;
      for (let t = 0; t < n; t++) if (keys[t] === k) { dst.set(src.subarray(t * s, t * s + s), o); o += s; }
      ng.setAttribute(name, new THREE.BufferAttribute(dst, att.itemSize));
    }
    out.push([k, ng]);
  }
  return out;
}
/* petits morceaux (moins de 0,25 m² : rebords, poteaux, bouts de plinthe, tranches) réunis en un seul maillage par matériau, vu dès
   que l'une de leurs pièces l'est : moins d'appels de dessin, presque rien à rastériser en plus ; les autres gardent leurs pièces et leurs
   ciseaux exacts (mesuré : réunir de grandes faces de pièces différentes élargit les ciseaux et coûte jusqu'à 50 % d'image en rendu
   logiciel) */
function aire(g) { const p = g.attributes.position.array; let a = 0; for (let i = 0; i < p.length; i += 9) { _ta.fromArray(p, i); _tb.fromArray(p, i + 3); _tc.fromArray(p, i + 6); a += _n1.subVectors(_tb, _ta).cross(_n2.subVectors(_tc, _ta)).length() / 2; } return a; }
function mergeSmall(parts) {
  const out = [], small = [], cells = new Set();
  for (const [k, g] of parts) { if (k === '*' || aire(g) >= 0.25) { out.push([k, g]); continue; } small.push(g); for (const c of k.split(',')) cells.add(+c); }
  if (small.length) out.push([[...cells].sort((a, b) => a - b).join(','), small.length > 1 ? mergeGeometries(small) : small[0]]);
  return out;
}
let lotSeq = 0;
class Batch {
  constructor() { this.m = new Map(); }
  add(k, g) { if (!this.m.has(k)) this.m.set(k, []); this.m.get(k).push(g); return g; }
  /* opts.cells : matrice du groupe dans la scène ; chaque matériau est alors découpé par pièce vue (culling). opts.grid : découpe du
     contexte en cases de grid mètres (tout y est « dehors »). Sans l'une ni l'autre : un maillage par matériau, comme avant */
  build(group, opts = {}) {
    for (const [k, arr] of this.m) {
      const geo = mergeGeometries(arr.map(prep)), lot = ++lotSeq;
      const parts = opts.cells ? mergeSmall(splitGeometry(geo, cellKey(opts.cells))) : opts.grid ? splitGeometry(geo, (A, B, C) => Math.floor((A.x + B.x + C.x) / 3 / opts.grid) + ':' + Math.floor((A.z + B.z + C.z) / 3 / opts.grid)) : [[null, geo]];
      // découpé : le maillage entier reste, caché, pour les seules passes d'ombre (calque 2 : ni image, ni rayons, ni miroir, ni sonde), une
      // ombre à un appel de dessin par face de cube au lieu d'un par morceau
      if (parts.length > 1) { const sh = new THREE.Mesh(geo, M[k]); sh.castShadow = opts.cast !== false && !['glass', 'orbit_ground', 'hover'].includes(k); sh.layers.set(2); sh.visible = false; sh.userData.ombre = true; group.add(sh); }
      for (const [ck, g] of parts) {
        const mesh = new THREE.Mesh(g, M[k]); if (parts.length > 1) mesh.userData.decoupe = true;
        mesh.castShadow = opts.cast !== false && !['glass', 'orbit_ground', 'hover'].includes(k);
        mesh.receiveShadow = opts.receive !== false;
        mesh.userData.key = k === 'slab_j' ? 'slab' : k === 'ceiling_j' ? 'ceiling' : k === 'rail_int' ? 'rail' : k; if (opts.walk && opts.walk.includes(k)) mesh.userData.walk = true;
        mesh.userData.lot = lot; // maillage d'origine (contrôle des faces superposées)
        if (opts.cells) mesh.userData.cells = ck === '*' ? null : ck.split(',').map(Number);
        else if (opts.grid) mesh.userData.cells = [DEHORS];
        group.add(mesh);
      }
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
function prismHoles(poly, holes, y0, y1, holeSides = true) {
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
  for (const ring of holeSides ? [ext, ...hs] : [ext]) for (let i = 0; i < ring.length; i++) {
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
/* obstacle : polygone convexe du plan et étendue verticale absolue [y0, y1] */
const col = (poly, y0 = -1e9, y1 = 1e9) => ({ p: poly, bb: GEO.bbox(poly), y0, y1 });
function beamG(a, b, r) { // barre cylindrique entre deux points 3D
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), l = d.length(), g = new THREE.CylinderGeometry(r, r, l, 8);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return worldUV(g);
}
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
const winColliders = []; // parties vitrées fixes des baies
const operables = [];
const floorKey = r => r.floor === 'wet' ? 'floor_wet' : r.floor === 'loggia' ? 'loggia_floor' : r.floor === 'seuil' ? 'seuil' : 'floor_dry';

/* chaque niveau est construit dans un groupe placé à la hauteur de son sol : toutes les hauteurs restent locales */
const LVKEYS = ['arch', 'ceil', 'plinthes', 'doors', 'fixed', 'lamps', 'bso'];
function lvGroup(parent, k) { const g = new THREE.Group(); g.position.y = LV[k].y; g.userData.lv = k; parent.add(g); return g; }
const roomAtLv = (x, z, lv) => (MULTI ? App.roomAt(x, z, lv) : App.roomAt(x, z));
/* point dans la matière d'un niveau (mur, masse, gaine) */
function inMatter(L, p) {
  return L.walls.some(w => GEO.pointInPoly(p[0], p[1], w.quad)) || L.gaines.some(g => GEO.pointInPoly(p[0], p[1], g.poly))
    || (L.masses || []).some(m => GEO.pointInPoly(p[0], p[1], m.poly) && !(m.trous || []).some(h => GEO.pointInPoly(p[0], p[1], h)));
}

/* ---------- Pièces et portails : ne dessiner que ce qu'on voit (culling des jeux en intérieur, L4-17) ----------
   Cellules : une par pièce (sous-pièces « of » rattachées à leur pièce), une par escalier (volée et trémie au-dessus), et « dehors »
   (façades, loggias vues de loin, immeuble, abords). Chaque face de la maquette va aux cellules dont elle touche l'air : un mur mitoyen
   donne une face à chaque pièce, un plafond d'un seul tenant va, triangle par triangle, aux pièces qu'il couvre, l'embrasure d'une baie
   aux deux côtés. Portails : chaque baie (porte ouverte ou fermée : on voit par les jours autour du vantail), chaque bord commun à deux
   pièces sans mur, l'emprise de la volée et de la trémie (seul passage d'un niveau à l'autre), les loggias vers dehors */
const DEHORS = 0;
const CUL = { cells: [], portals: [], opens: [], items: [], lamps: [], byRoom: new Map(), dirty: true, on: false, force: null, stats: null, frame: 0 };
const NEAR8 = [[0.08, 0], [-0.08, 0], [0, 0.08], [0, -0.08], [0.056, 0.056], [-0.056, 0.056], [0.056, -0.056], [-0.056, -0.056]];
const inBB = (b, x, z, m = 0) => x >= b[0] - m && x <= b[1] + m && z >= b[2] - m && z <= b[3] + m;
function cellRoomAt(x, z, k) { for (const r of CUL.rooms[k]) if (inBB(r.bb, x, z) && GEO.pointInPoly(x, z, r.poly)) return r; return null; }
function cellMatter(k, x, z) {
  for (const q of CUL.matter[k]) if (inBB(q.bb, x, z) && GEO.pointInPoly(x, z, q.p) && !(q.h && q.h.some(h => GEO.pointInPoly(x, z, h)))) return true;
  return false;
}
/* embrasure d'une baie (jambages, allège, linteau et 6 cm de part et d'autre du mur), hauteur yl comptée depuis le sol de son niveau */
function inOpenBox(q, x, yl, z) {
  const o = q.o, a = o.main.a, dx = x - a[0], dz = z - a[1], s = dx * o.u[0] + dz * o.u[1], d = dx * o.T[0] + dz * o.T[1];
  return s >= o.s[0] - 0.03 && s <= o.s[1] + 0.03 && d >= q.d0 && d <= o.depth + 0.06 && yl >= (o.sill > 0 ? o.sill : 0) - 0.05 && yl <= o.head + 0.05;
}
/* cellules de l'air au point (x, y, z) : [] dans la matière (mur, dalle), deux cellules dans l'embrasure d'une baie */
function cellsAt(x, y, z) {
  for (const s of STAIRS) {
    const lo = LV[s.from], hi = LV[s.to];
    if (y > lo.y - 0.03 && y < hi.y + 0.02 && inBB(s.bb, x, z) && GEO.pointInPoly(x, z, s.poly)) return [s.cell];
    if (s.voidPoly && y > hi.y - 0.31 && y < hi.y + hi.H + 0.01 && GEO.pointInPoly(x, z, s.voidPoly)) return [s.cell];
  }
  let k = -1; for (let i = 0; i < NL; i++) if (y >= LV[i].y - 0.004 && y <= LV[i].y + LV[i].H + 0.004) { k = i; break; }
  if (k < 0) return D.L.some(L => GEO.pointInPoly(x, z, L.outline)) ? [] : [DEHORS]; // dalle, ou dehors au-dessus et au-dessous
  const yl = y - LV[k].y, hit = [];
  for (const q of CUL.opens) if (q.k === k && inOpenBox(q, x, yl, z)) hit.push(q.a, q.b);
  if (hit.length) return hit;
  const r = cellRoomAt(x, z, k); if (r) return [CUL.byRoom.get(r.id)];
  if (cellMatter(k, x, z)) return [];
  if (!GEO.pointInPoly(x, z, D.L[k].outline)) return [DEHORS];
  // air libre qu'aucune pièce ne couvre : interstice au nu d'un mur (pièce à 8 cm), ou renfoncement laissé hors des pièces par la
  // lecture, vu des pièces voisines : toutes les pièces à 8 cm, plus toutes celles du premier cercle (20, 40 ou 60 cm) qui en touche une
  const got = new Set();
  for (const [a, b] of NEAR8) { const q = cellRoomAt(x + a, z + b, k); if (q) got.add(CUL.byRoom.get(q.id)); }
  for (const rr of [0.2, 0.4, 0.6]) {
    let n = 0;
    for (let i = 0; i < 16; i++) { const t = i * Math.PI / 8, q = cellRoomAt(x + Math.cos(t) * rr, z + Math.sin(t) * rr, k); if (q) { got.add(CUL.byRoom.get(q.id)); n++; } }
    if (n) break;
  }
  return [...got];
}
/* cellules vues par un triangle : l'air devant lui, en son centre et près de ses sommets (grille sur les grands triangles) ; tout dans la
   matière : l'air derrière (face collée à un mur, jamais vue de face) ; rien : '*', toujours dessiné */
const _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3(), _sp = new THREE.Vector3();
function cellsOfTri(A, B, C) {
  const N = _n1.subVectors(B, A).cross(_n2.subVectors(C, A)), L = N.length(); if (L < 1e-10) return null;
  N.multiplyScalar(1 / L);
  const e = Math.max(A.distanceTo(B), B.distanceTo(C), C.distanceTo(A)), pts = [];
  const bary = (u, v) => [A.x + (B.x - A.x) * u + (C.x - A.x) * v, A.y + (B.y - A.y) * u + (C.y - A.y) * v, A.z + (B.z - A.z) * u + (C.z - A.z) * v];
  pts.push(bary(1 / 3, 1 / 3));
  if (e > 0.15) { pts.push(bary(0.1, 0.1), bary(0.8, 0.1), bary(0.1, 0.8), bary(0.45, 0.1), bary(0.45, 0.45), bary(0.1, 0.45)); }
  if (e > 0.5) { const n = Math.min(14, Math.ceil(e / 0.3)); for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) pts.push(bary((i + 1 / 3) / n, (j + 1 / 3) / n)); }
  // grand triangle : aussi une bande de 1,2 cm le long de chaque côté (bas d'un mur de l'étage qui descend dans l'épaisseur de la dalle,
  // vu d'en bas par la trémie : sans cela il n'appartient qu'à la pièce du haut, et le culling change la couture au plafond)
  if (e > 0.5) for (const [P, Q, R] of [[A, B, C], [B, C, A], [C, A, B]]) {
    const lq = P.distanceTo(Q), hR = L / Math.max(lq, 1e-6), w = Math.min(0.2, 0.012 / Math.max(hR, 1e-6)), n = Math.min(14, Math.ceil(lq / 0.3));
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; pts.push([(P.x + (Q.x - P.x) * t) * (1 - w) + R.x * w, (P.y + (Q.y - P.y) * t) * (1 - w) + R.y * w, (P.z + (Q.z - P.z) * t) * (1 - w) + R.z * w]); }
  }
  const set = new Set();
  for (const sg of [0.03, -0.03]) { for (const p of pts) for (const c of cellsAt(p[0] + N.x * sg, p[1] + N.y * sg, p[2] + N.z * sg)) set.add(c); if (set.size) break; }
  // face horizontale (sol, plafond, dalle) : un grand triangle fin traverse des pièces entre deux points ; recouvrement exact en plan avec
  // chaque pièce (et volée, trémie) dont l'air touche la face
  if (Math.abs(N.y) > 0.7 && e > 0.15) {
    const y = (A.y + B.y + C.y) / 3 + (N.y > 0 ? 0.03 : -0.03), T3 = [[A.x, A.z], [B.x, B.z], [C.x, C.z]], tb = GEO.bbox(T3);
    for (let k = 0; k < NL; k++) if (y >= LV[k].y - 0.004 && y <= LV[k].y + LV[k].H + 0.004) for (const r of CUL.rooms[k]) if (triPoly(T3, tb, r.poly, r.bb)) set.add(CUL.byRoom.get(r.id));
    for (const st of STAIRS) { if (y > LV[st.from].y - 0.03 && y < LV[st.to].y + 0.02 && triPoly(T3, tb, st.poly, st.bb)) set.add(st.cell); if (st.voidPoly && y > LV[st.to].y - 0.31 && y < LV[st.to].y + LV[st.to].H && triPoly(T3, tb, st.voidPoly, GEO.bbox(st.voidPoly))) set.add(st.cell); }
  }
  return set.size ? [...set].sort((a, b) => a - b).join(',') : '*';
}
/* un triangle et un polygone du plan se recouvrent-ils (sommet de l'un dans l'autre, ou côtés sécants) */
function triPoly(T, tb, P, pb) {
  if (tb[1] < pb[0] || tb[0] > pb[1] || tb[3] < pb[2] || tb[2] > pb[3]) return false;
  if (T.some(p => GEO.pointInPoly(p[0], p[1], P))) return true;
  const inT = (x, z) => { let s = 0; for (let i = 0; i < 3; i++) { const a = T[i], b = T[(i + 1) % 3], c = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c > 0) s |= 1; else if (c < 0) s |= 2; } return s !== 3; };
  if (P.some(p => inT(p[0], p[1]))) return true;
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < 3; i++) { const a = T[i], b = T[(i + 1) % 3]; for (let j = 0; j < P.length; j++) { const c = P[j], d = P[(j + 1) % P.length]; if (cr(a, b, c) * cr(a, b, d) < 0 && cr(c, d, a) * cr(c, d, b) < 0) return true; } }
  return false;
}
function cellKey(m) { return (A, B, C) => { A.applyMatrix4(m); B.applyMatrix4(m); C.applyMatrix4(m); return cellsOfTri(A, B, C); }; }
/* cellules d'un objet entier (équipement posé, miroir, placard) : union des cellules de ses triangles */
function cellsOfObject(obj) {
  obj.updateWorldMatrix(true, true); const set = new Set();
  obj.traverse(m => {
    if (!m.isMesh || !m.geometry.attributes.position) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, pos = g.attributes.position.array, n = pos.length / 9, step = Math.max(1, Math.floor(n / 400));
    for (let t = 0; t < n; t += step) { _ta.fromArray(pos, t * 9).applyMatrix4(m.matrixWorld); _tb.fromArray(pos, t * 9 + 3).applyMatrix4(m.matrixWorld); _tc.fromArray(pos, t * 9 + 6).applyMatrix4(m.matrixWorld); const k = cellsOfTri(_ta, _tb, _tc); if (k && k !== '*') for (const c of k.split(',')) set.add(+c); }
  });
  return set.size ? [...set] : null;
}
function polyDist(P, Q) { // distance entre deux polygones (0 s'ils se recoupent)
  if (P.some(p => GEO.pointInPoly(p[0], p[1], Q)) || Q.some(q => GEO.pointInPoly(q[0], q[1], P))) return 0;
  const ds = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-12, t = clamp(((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2, 0, 1); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
  let d = Infinity;
  for (const [A, B] of [[P, Q], [Q, P]]) for (const p of A) for (let i = 0; i < B.length; i++) d = Math.min(d, ds(p, B[i], B[(i + 1) % B.length]));
  return d;
}
function buildCells() {
  const C = CUL.cells; C.length = 0; CUL.byRoom.clear(); CUL.portals.length = 0;
  C.push({ id: 'dehors', lv: -1, portals: [] });
  for (const r of D.rooms) if (!r.of) { CUL.byRoom.set(r.id, C.length); C.push({ id: r.id, lv: r.level || 0, room: r, portals: [] }); }
  for (const r of D.rooms) if (r.of) { let c = CUL.byRoom.get(r.of); if (c == null) { c = C.length; C.push({ id: r.id, lv: r.level || 0, room: r, portals: [] }); } CUL.byRoom.set(r.id, c); }
  for (const s of STAIRS) { s.cell = C.length; C.push({ id: '~' + s.id, lv: s.from, stair: s, portals: [] }); s.bb = GEO.bbox(s.poly); s.voidPoly = ((D.voids || []).find(v => v.id === s.void) || {}).poly || null; }
  CUL.rooms = D.L.map(L => L.rooms);
  CUL.matter = D.L.map(L => [...L.walls.map(w => ({ p: w.quad })), ...L.gaines.map(g => ({ p: g.poly })), ...(Array.isArray(L.masses) ? L.masses.filter(m => Array.isArray(m.poly) && m.poly.length >= 3).map(m => ({ p: m.poly, h: m.trous })) : [])].map(q => Object.assign(q, { bb: GEO.bbox(q.p) })));
  // côtés d'une baie : pièce, escalier ou dehors
  const sideCell = (o, sg) => {
    const k = o.level || 0, L = D.L[k], m = (o.s[0] + o.s[1]) / 2;
    for (const dd of [0.25, 0.45, 0.8]) {
      const p = o.pt(m, sg < 0 ? -dd : o.depth + dd), r = cellRoomAt(p[0], p[1], k);
      if (r) return CUL.byRoom.get(r.id);
      const st = STAIRS.find(s => (s.from === k && GEO.pointInPoly(p[0], p[1], s.poly)) || (s.to === k && s.voidPoly && GEO.pointInPoly(p[0], p[1], s.voidPoly))); if (st) return st.cell;
      if (!cellMatter(k, p[0], p[1]) && !GEO.pointInPoly(p[0], p[1], L.outline)) return DEHORS;
    }
    return DEHORS;
  };
  CUL.opens = Object.values(D.openings).map(o => ({ o, k: o.level || 0, d0: o.kind === 'door' || o.kind === 'entry' ? -0.06 - Math.min(o.depth, 0.25) : -0.06, a: sideCell(o, -1), b: sideCell(o, 1) }));
  const add = (a, b, corners, op) => { if (a == null || b == null || a === b) return; const p = { a, b, corners, op, rect: null, f: -1 }; CUL.portals.push(p); C[a].portals.push(p); C[b].portals.push(p); };
  const aabb = (bb, m, y0, y1) => { const out = []; for (const x of [bb[0] - m, bb[1] + m]) for (const y of [y0, y1]) for (const z of [bb[2] - m, bb[3] + m]) out.push([x, y, z]); return out; };
  // baies : boîte de l'embrasure, jours autour du vantail compris
  for (const q of CUL.opens) {
    const o = q.o, y0 = LV[q.k].y, out = [];
    for (const s of [o.s[0] - 0.03, o.s[1] + 0.03]) for (const yy of [(o.sill > 0 ? o.sill : 0) - 0.05, o.head + 0.05]) for (const d of [q.d0, o.depth + 0.06]) { const p = o.pt(s, d); out.push([p[0], y0 + yy, p[1]]); }
    add(q.a, q.b, out, o.kind === 'door' || o.kind === 'entry' ? o.id : null);
  }
  // bords communs à deux pièces du même niveau, sans mur (entrée ouverte sur le séjour, cuisine ouverte)
  const cellRooms = C.filter(c => c.room && !c.room.of);
  for (let i = 0; i < cellRooms.length; i++) for (let j = i + 1; j < cellRooms.length; j++) {
    const A = cellRooms[i], B = cellRooms[j]; if (A.lv !== B.lv) continue;
    const P = A.room.poly, Q = B.room.poly, k = A.lv, L = D.L[k];
    if (polyDist(P, Q) > 0.03) continue;
    for (let a = 0; a < P.length; a++) {
      const p0 = P[a], p1 = P[(a + 1) % P.length], ex = p1[0] - p0[0], ez = p1[1] - p0[1], len = Math.hypot(ex, ez); if (len < 0.05) continue;
      const u = [ex / len, ez / len], nn = [-u[1], u[0]];
      for (let b = 0; b < Q.length; b++) {
        const q0 = Q[b], q1 = Q[(b + 1) % Q.length], d0 = (q0[0] - p0[0]) * nn[0] + (q0[1] - p0[1]) * nn[1], d1 = (q1[0] - p0[0]) * nn[0] + (q1[1] - p0[1]) * nn[1];
        if (Math.abs(d0) > 0.03 || Math.abs(d1) > 0.03) continue;
        const t0 = Math.max(0, Math.min((q0[0] - p0[0]) * u[0] + (q0[1] - p0[1]) * u[1], (q1[0] - p0[0]) * u[0] + (q1[1] - p0[1]) * u[1])), t1 = Math.min(len, Math.max((q0[0] - p0[0]) * u[0] + (q0[1] - p0[1]) * u[1], (q1[0] - p0[0]) * u[0] + (q1[1] - p0[1]) * u[1]));
        if (t1 - t0 < 0.05) continue;
        const out = []; for (const t of [t0 - 0.03, t1 + 0.03]) for (const yy of [-0.02, L.H + 0.02]) for (const d of [-0.06, 0.06]) out.push([p0[0] + u[0] * t + nn[0] * d, LV[k].y + yy, p0[1] + u[1] * t + nn[1] * d]);
        add(CUL.byRoom.get(A.room.id), CUL.byRoom.get(B.room.id), out, null);
      }
    }
  }
  // escaliers : pièces qui bordent la volée (niveau du pied) et la trémie (niveau d'arrivée), pièces sous la trémie
  for (const s of STAIRS) {
    const lo = LV[s.from], hi = LV[s.to], vb = s.voidPoly ? GEO.bbox(s.voidPoly) : null;
    for (const c of cellRooms) {
      if (c.lv === s.from && polyDist(c.room.poly, s.poly) < 0.1) add(CUL.byRoom.get(c.room.id), s.cell, aabb(s.bb, 0.1, lo.y - 0.02, hi.y + 0.02), null);
      if (vb && c.lv === s.to && polyDist(c.room.poly, s.voidPoly) < 0.1) add(CUL.byRoom.get(c.room.id), s.cell, aabb(vb, 0.1, hi.y - 0.31, hi.y + hi.H + 0.02), null);
      if (vb && c.lv === s.from && polyDist(c.room.poly, s.voidPoly) === 0) add(CUL.byRoom.get(c.room.id), s.cell, aabb(vb, 0.1, lo.y + lo.H - 0.1, hi.y + 0.1), null);
    }
    const f = App.stairAt(s, 0), t = App.stairAt(s, s.len), pf = VV.sub(f.p, VV.mul(f.u, 0.3)), pa = VV.add(t.p, VV.mul(t.u, 0.3)); // pied et arrivée
    const rf = cellRoomAt(pf[0], pf[1], s.from), ra = cellRoomAt(pa[0], pa[1], s.to);
    if (rf) add(CUL.byRoom.get(rf.id), s.cell, aabb(s.bb, 0.1, lo.y - 0.02, hi.y + 0.02), null);
    if (ra) add(CUL.byRoom.get(ra.id), s.cell, aabb(vb || s.bb, 0.1, hi.y - 0.31, hi.y + hi.H + 0.02), null);
  }
  // loggias et balcons : ouverts sur dehors
  for (const c of cellRooms) if (App.isExt(c.room)) add(CUL.byRoom.get(c.room.id), DEHORS, aabb(c.room.bb, 0.1, LV[c.lv].y - 0.35, LV[c.lv].y + LV[c.lv].H + 0.3), null);
}
function buildArch(cut) {
  for (const k of ['arch', 'ceil', 'plinthes']) { if (G[k]) { scene.remove(G[k]); G[k].traverse(o => o.geometry && o.geometry.dispose()); } G[k] = new THREE.Group(); scene.add(G[k]); }
  staticColliders = [];
  for (const L of D.L) buildArchLevel(L, L.k === S.level ? cut : null, cut == null); // coupe : seulement le niveau affiché (les autres sont dessous ou retirés)
  CUL.dirty = true; applyLevels();
}
const lvMat = k => new THREE.Matrix4().makeTranslation(0, LV[k].y, 0); // groupe d'un niveau dans la scène
function buildArchLevel(L, cut, split) {
  const k = L.k, HL = L.H, prev = k > 0 ? LV[k - 1] : null, e = prev ? L.y - prev.y - prev.H : 0.30;
  // pied des murs et de l'enduit : sur la dalle au niveau le plus bas, sur le haut des murs du dessous ailleurs (façade continue) ;
  // dalle d'un niveau superposé : jointive avec le plafond du dessous (aucune face coplanaire). Masses d'un niveau superposé (chaîne :
  // pieds, joints) : parties posées sur une masse du dessous avec 1 cm de recouvrement (faces confondues ; bord à bord, ligne de pixels
  // clairs dans la cage d'escalier), parties libres au bord d'un vide depuis le dessous du plafond, le reste depuis le dessus du plafond
  // du dessous (plus bas, son pied tracerait une ligne claire au plafond de la pièce du dessous)
  const WB = prev ? -e - 0.01 : -0.02, EB = prev ? -e - 0.01 : -0.30, SB = prev ? -(e - 0.02) : -0.30, MB = prev && L.pieds ? SB + 0.002 : WB;
  const ga = lvGroup(G.arch, k), gc = lvGroup(G.ceil, k), gp = lvGroup(G.plinthes, k);
  const A = new Batch(), C = new Batch(), P = new Batch(), colliders = [];
  const cy = poly => col(poly, L.y - 0.02, L.y + HL);
  const Y = y => (cut != null ? Math.min(y, cut) : y);
  const pr = (b, key, poly, y0, y1, cap) => {
    if (cut != null && y0 >= cut) return; const yy = Y(y1); b.add(key, prismG(poly, y0, yy));
    if (cap && cut != null && y1 >= cut) b.add('cap', prismG(poly, yy, yy + 0.004));
  };
  // murs d'un seul tenant (masses calculées par la chaîne) : pas de trait aux raccords des morceaux
  const masses = Array.isArray(L.masses) && L.masses.length ? L.masses.filter(m => Array.isArray(m.poly) && m.poly.length >= 3) : null;
  if (masses) for (const m of masses) {
    if (cut != null && MB >= cut) continue;
    const yy = Y(HL); A.add('wall_b', prismHoles(m.poly, m.trous, MB, yy));
    if (cut != null && HL >= cut) A.add('cap', prismHoles(m.poly, m.trous, yy, yy + 0.004));
  }
  if (masses && prev && L.pieds) for (const [list, y0] of [[L.pieds, -e - 0.01], [L.joints || [], -e + 0.001]]) for (const m of list) if (cut == null || y0 < cut) A.add('wall_b', prismHoles(m.poly, m.trous, y0, Y(SB + 0.012)));
  // murs, découpés par les ouvertures
  for (const w of L.walls) {
    const kk = w.k === 'cloison' ? 'wall_c' : 'wall_b';
    const pc = App.pieces(w);
    const inOther = (s, d) => { const p = w.pt(s, d); return L.walls.some(q => q !== w && GEO.pointInPoly(p[0], p[1], q.quad)) || L.gaines.some(g => GEO.pointInPoly(p[0], p[1], g.poly)); };
    const ext0 = !w.poly && inOther(-0.004, w.t / 2) ? 0.005 : 0, ext1 = !w.poly && inOther(w.L + 0.004, w.t / 2) ? 0.005 : 0;
    for (const sg of pc.segs) {
      if (!w.poly && (ext0 || ext1)) { const a = sg.s[0] < 1e-4 ? -ext0 : 0, b = sg.s[1] > w.L - 1e-4 ? ext1 : 0; if (a || b) sg.quad = wallQuad(w, sg.s[0] + a, sg.s[1] + b, 0, w.t); }
      if (!sg.o) { if (!masses || w.virtual) pr(A, kk, sg.quad, WB, HL, true); colliders.push(cy(sg.quad)); continue; }
      const o = sg.o;
      if (o.sill > 0) { pr(A, kk, sg.quad, WB, o.sill, true); colliders.push(cy(sg.quad)); }
      if (o.head < HL) pr(A, kk, sg.quad, o.head, HL, true);
    }
    // enduit extérieur des façades (pas sur le linteau d'une baie quand les murs sont des masses, sans enduit : il dépassait de 6 mm de la
    // façade, un trait de chaque côté au-dessus des portes-fenêtres des loggias)
    if (w.ext && !w.poly && !(masses && w.virtual)) {
      const t = w.t, ee = 0.006;
      for (const sg of pc.segs) {
        const q = wallQuad(w, sg.s[0], sg.s[1], t, t + ee);
        if (!sg.o) pr(A, 'ext', q, EB, HL, false);
        else { if (sg.o.sill > 0) pr(A, 'ext', q, EB, sg.o.sill); pr(A, 'ext', q, sg.o.head, HL); }
      }
    }
  }
  // gaines techniques, toute hauteur
  for (const g of L.gaines) { if (!masses) pr(A, 'wall_c', g.poly, WB, HL, true); colliders.push(cy(g.poly)); }
  // sols finis, seuils des portes
  for (const r of L.rooms) { if (App.isExt(r) || r.of) continue; A.add(floorKey(r), prismG(r.poly, -0.02, 0)); }
  // coffret du tableau électrique hors de toute pièce (niche fermée par sa porte, 432) : sol fini, jamais la dalle vue porte ouverte
  for (const f of L.fixtures) if (f.type === 'tableau' && f.x && f.z && !roomAtLv((f.x[0] + f.x[1]) / 2, (f.z[0] + f.z[1]) / 2, k))
    A.add('floor_dry', prismG([[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]], -0.02, 0));
  for (const o of Object.values(L.openings)) {
    if (o.sill > 0 || o.kind === 'french') continue;
    const w = o.main, rA = roomAtLv(...w.pt((o.s[0] + o.s[1]) / 2, -0.3), k), rB = roomAtLv(...w.pt((o.s[0] + o.s[1]) / 2, w.t + 0.3), k);
    const fk = [rA, rB].some(r => r && r.floor === 'wet') ? 'floor_wet' : 'floor_dry';
    A.add(o.kind === 'entry' ? 'seuil' : fk, prismG(wallQuad(w, o.s[0], o.s[1], 0, w.t), -0.02, o.kind === 'entry' ? 0.008 : 0));
  }
  // dalle porteuse (trouée par les vides, calculée par la chaîne)
  if (L.floor) for (const f of L.floor) A.add(prev ? 'slab_j' : 'slab', prismHoles(f.poly, f.trous, SB, -0.02, false));
  else A.add('slab', prismG(L.outline, -0.30, -0.02));
  // vides : tranche peinte sur chaque bord libre (du dessous du plafond inférieur au sol fini), garde-corps
  for (const v of L.voids) {
    voidBands(A, L, v, -e);
    for (const r of v.rails) {
      const rr = railOffset(r, v.poly); railing(A, rr, 0, 'rail_int');
      for (let i = 0; i < rr.length - 1; i++) if (VV.len(VV.sub(rr[i + 1], rr[i])) > 1e-3) colliders.push(col(segQuad(rr[i], rr[i + 1], 0.05), L.y, L.y + 1.02));
    }
  }
  // loggias et balcons : sol sur plots de chaque pièce extérieure, dalle, garde-corps
  for (const r of L.rooms) if (App.isExt(r) && !r.of) A.add('loggia_floor', prismG(r.poly, -0.06, -0.02));
  for (const lg of L.loggias) {
    const c = GEO.centroid(lg.slab), onRoof = prev && GEO.pointInPoly(c[0], c[1], prev.outline); // au-dessus d'un intérieur : posée sur son plafond
    A.add('slab', prismG(lg.slab, onRoof ? SB : -0.30, -0.06));
    railing(A, railHorsMurs(L, lg.rail), 0);
    for (let i = 0; i < lg.rail.length - 1; i++) { const a = lg.rail[i], b = lg.rail[i + 1]; if (VV.len(VV.sub(b, a)) > 1e-3) colliders.push(cy(segQuad(a, b, 0.05))); }
  }
  // plafonds et dalle haute (masqués en maquette) ; sous un niveau, le plafond est troué par ses vides et la dalle est celle du niveau du dessus
  if (L.ceiling) for (const c of L.ceiling) C.add(k < TOP ? 'ceiling_j' : 'ceiling', prismHoles(c.poly, c.trous, HL, HL + 0.02, false));
  else C.add('ceiling', prismG(L.outline, HL, HL + 0.02));
  // soffite sur toute une pièce (hachuré sur le plan, hauteur de la légende : Entrée du D201 à 2,20 m) : plafond abaissé, retombée aux passages
  for (const r of L.rooms) { const so = r.soffite; if (!so || !(so.y < HL - 0.05) || !Array.isArray(so.poly) || so.poly.length < 3) continue; C.add('ceiling', prismG(so.poly, so.y, HL - 0.004)); }
  if (L.roof) for (const r of L.roof) C.add('slab', prismHoles(r.poly, r.trous, HL + 0.02, HL + 0.28));
  else C.add('slab', prismG(L.outline, HL + 0.02, HL + 0.28));
  const up = k < TOP ? D.L[k + 1] : null;
  for (const lg of L.loggias) {
    const c = GEO.centroid(lg.slab);
    if (up && (up.loggias.some(q => GEO.pointInPoly(c[0], c[1], q.slab)) || GEO.pointInPoly(c[0], c[1], up.outline))) continue; // couverte par le niveau du dessus
    C.add('slab', prismG(lg.slab, HL, HL + 0.28));
  }
  // plinthes des pièces sèches
  const doorsOnEdge = (a, b) => {
    const ed = VV.sub(b, a), Ln = VV.len(ed), u = VV.mul(ed, 1 / Ln), cut2 = [];
    for (const o of Object.values(L.openings)) {
      if (o.sill > 0 && o.kind !== 'french') continue;
      const cross = Math.abs(u[0] * o.u[1] - u[1] * o.u[0]); if (cross > 0.05) continue;
      const off = Math.abs((o.mid[0] - a[0]) * u[1] - (o.mid[1] - a[1]) * u[0]); if (off > o.depth + 0.1) continue;
      const s0 = VV.dot(VV.sub(o.p0, a), u), s1 = VV.dot(VV.sub(o.p1, a), u); cut2.push([Math.min(s0, s1) - 0.01, Math.max(s0, s1) + 0.01]);
    }
    for (const f of L.fixtures) if (f.type === 'placard') { // pas de plinthe devant les portes du placard
      const F = App.placardFrame(f), q = [F.at(0, 0), F.at(F.W, 0)], cr = Math.abs(u[0] * F.ux[1] - u[1] * F.ux[0]), off = Math.abs((q[0][0] - a[0]) * u[1] - (q[0][1] - a[1]) * u[0]);
      if (cr < 0.05 && off < 0.12) { const s0 = VV.dot(VV.sub(q[0], a), u), s1 = VV.dot(VV.sub(q[1], a), u); cut2.push([Math.min(s0, s1), Math.max(s0, s1)]); }
    }
    return { L: Ln, u, cut: cut2.sort((p, q) => p[0] - q[0]) };
  };
  // bord libre (vide, emprise d'escalier) : ni plinthe, ni mur
  const openEdge = p => L.voids.some(v => GEO.pointInPoly(p[0], p[1], v.poly)) || STAIRS.some(s => s.from === k && GEO.pointInPoly(p[0], p[1], s.poly));
  for (const r of L.rooms) {
    if (r.hidden || r.floor !== 'dry') continue;
    const poly = GEO.polyArea(r.poly) < 0 ? r.poly.slice().reverse() : r.poly;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], { L: Ln, u, cut: cuts } = doorsOnEdge(a, b); if (Ln < 0.08) continue;
      const nIn = [-u[1], u[0]]; // intérieur pour un polygone direct
      const mid = VV.add(VV.mul(VV.add(a, b), 0.5), VV.mul(nIn, 0.05));
      if (!GEO.pointInPoly(mid[0], mid[1], r.poly)) continue;
      // tronçons ouverts sur une autre pièce sans mur (sondes tous les 5 cm, à 3 cm dehors) ou sur un vide : pas de plinthe ; le reste du bord
      // garde la sienne. Une seule sonde au milieu du bord ne suffisait pas : D201, bord du séjour dont le milieu est dans un mur et dont la
      // partie ouverte sur l'entrée recevait une plinthe en travers du passage
      const ouvert = t => { const q = VV.add(VV.add(a, VV.mul(u, t)), VV.mul(nIn, -0.03)), o = roomAtLv(q[0], q[1], k);
        return (o && !o.hidden && o.id !== r.id && !L.gaines.some(g => GEO.pointInPoly(q[0], q[1], g.poly))) || (MULTI && openEdge(q)); };
      const nS = Math.max(1, Math.ceil(Ln / 0.05));
      for (let j = 0, t0 = null; j <= nS; j++) { const t = j / nS * Ln, o = j < nS && ouvert(t + Ln / nS / 2);
        if (o && t0 == null) t0 = t; if (!o && t0 != null) { cuts.push([t0 - 0.005, t + 0.005]); t0 = null; } }
      cuts.sort((p, q) => p[0] - q[0]);
      let s = 0; const spans = [];
      for (const [c0, c1] of cuts) { if (c1 <= s) continue; if (c0 > s) spans.push([s, Math.min(c0, Ln)]); s = Math.max(s, c1); }
      if (s < Ln) spans.push([s, Ln]);
      for (const [s0, s1] of spans) {
        if (s1 - s0 < 0.04) continue;
        const p0 = VV.add(a, VV.mul(u, s0)), p1 = VV.add(a, VV.mul(u, s1)), q = [p0, p1, VV.add(p1, VV.mul(nIn, 0.012)), VV.add(p0, VV.mul(nIn, 0.012))];
        P.add('plinthe', prismG(q, 0, 0.07));
      }
    }
  }
  // faïence
  for (const f of L.faience) { const q = [f.a, f.b, VV.add(f.b, VV.mul(f.n, 0.008)), VV.add(f.a, VV.mul(f.n, 0.008))]; pr(A, 'faience', q, f.y[0], f.y[1]); }
  // escaliers : les marches sous le plafond du niveau bas vont avec lui, les plus hautes avec le niveau d'arrivée
  for (const s of L.stairs) buildStair(s, A, L, cut, colliders);
  // découpe par pièce vue (culling en visite) ; en coupe de maquette, un maillage par matériau
  const cells = split ? lvMat(k) : null;
  A.build(ga, { walk: ['floor_dry', 'floor_wet', 'loggia_floor', 'seuil'], cells });
  // barreaux et mains courantes intérieurs (escalier, trémie, clé rail_int) : pas d'ombre portée par les lampes (stries sous les marches
  // et le long du mur de l'escalier, fiche C6) ; les garde-corps des loggias (clé rail, même lot) gardent leur ombre au soleil
  ga.traverse(m => { if (m.isMesh && m.material === M.rail_int) { m.castShadow = false; m.userData.cs = false; } });
  C.build(gc, { cells }); P.build(gp, { cells });
  staticColliders.push(...colliders);
}
/* tranche d'un vide : bande peinte de 1 mm côté vide sur chaque bord qui ne longe pas un mur (la dalle n'a pas de face à cet endroit) */
function voidBands(A, L, v, y0) {
  const poly = GEO.polyArea(v.poly) < 0 ? v.poly.slice().reverse() : v.poly;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ed = VV.sub(b, a), l = VV.len(ed); if (l < 0.02) continue;
    const u = VV.mul(ed, 1 / l), nIn = [-u[1], u[0]], N = Math.max(1, Math.ceil(l / 0.05)), at = t => VV.add(a, VV.mul(u, t));
    const free = []; for (let j = 0; j <= N; j++) free.push(!inMatter(L, VV.add(at(j / N * l), VV.mul(nIn, -0.004))));
    let t0 = null;
    for (let j = 0; j <= N; j++) {
      const tj = j / N * l;
      if (free[j] && t0 == null) t0 = j === 0 ? 0 : tj - l / N / 2;
      if (t0 != null && (!free[j] || j === N)) {
        const t1 = free[j] ? l : tj - l / N / 2, p0 = at(t0), p1 = at(t1);
        if (t1 - t0 > 0.01) A.add('wall_b', prismG([p0, p1, VV.add(p1, VV.mul(nIn, 0.001)), VV.add(p0, VV.mul(nIn, 0.001))], y0, 0));
        t0 = null;
      }
    }
  }
}
/* garde-corps d'un vide : 3 cm en retrait sur la dalle */
function railOffset(r, vp) {
  const nr = [];
  for (let i = 0; i < r.length - 1; i++) {
    const ed = VV.sub(r[i + 1], r[i]), l = VV.len(ed) || 1, n = [-ed[1] / l, ed[0] / l], m = VV.mul(VV.add(r[i], r[i + 1]), 0.5);
    nr.push(GEO.pointInPoly(m[0] + n[0] * 0.05, m[1] + n[1] * 0.05, vp) ? VV.mul(n, -1) : n);
  }
  return r.map((p, i) => { const a = nr[Math.max(0, i - 1)], b = nr[Math.min(nr.length - 1, i)], sm = VV.add(a, b), l = VV.len(sm) || 1, c = Math.max(0.5, VV.dot(VV.mul(sm, 1 / l), a)); return VV.add(p, VV.mul(sm, 0.03 / l / c)); });
}
/* côtés longs d'un escalier : contre un mur (marches engravées de 5 mm) ou libres (joue, main courante) */
function stairSides(s) {
  if (s.sides) return s.sides;
  const Lf = D.L[s.from], side = sg => { let n = 0; for (let i = 1; i < 10; i++) if (inMatter(Lf, App.stairPt(s, s.len * i / 10, sg * (s.width / 2 + 0.01)))) n++; return n >= 5; };
  return (s.sides = { 1: side(1), '-1': side(-1) });
}
/* escalier plein : chaque marche est un bloc jusqu'au sol du niveau bas, giron bois, contremarches et joues peintes */
function buildStair(s, A, L, cut, colliders) {
  const lo = LV[s.from], hi = LV[s.to], h = s.rise, g = s.going, w2 = s.width / 2, sd = stairSides(s);
  const dl = sd[1] ? w2 + 0.005 : w2, dr = sd[-1] ? -(w2 + 0.005) : -w2, own = top => (top <= lo.y + lo.H + 1e-3 ? s.from : s.to), Y = y => y - L.y;
  const pr = (key, poly, a, b, cap) => { if (cut != null && a >= cut) return; const bb = cut != null ? Math.min(b, cut) : b; A.add(key, prismG(poly, a, bb)); if (cap && cut != null && b >= cut) A.add('cap', prismG(poly, bb, bb + 0.004)); };
  const quad = (t0, t1, d0, d1) => [App.stairPt(s, t0, d0), App.stairPt(s, t1, d0), App.stairPt(s, t1, d1), App.stairPt(s, t0, d1)];
  for (let i = 0; i < s.n - 1; i++) {
    const top = lo.y + (i + 1) * h; if (own(top) !== L.k) continue;
    const q = quad(i * g, (i + 1) * g, dr, dl);
    pr('wall_b', q, Y(lo.y - 0.02), Y(top - 0.03), true); // coupe : tranche foncée comme les murs
    pr('floor_dry', q, Y(top - 0.03), Y(top), true);
  }
  for (const sg of [1, -1]) {
    if (sd[sg]) continue;
    // main courante rampante à 0,90 m sur chaque côté libre, barreaux sur les marches, jusqu'au sol du niveau haut
    const pts = [];
    for (let i = 0; i < s.n - 1; i++) { const top = lo.y + (i + 1) * h; if (top + 0.9 > hi.y + 0.02) break; pts.push({ p: App.stairPt(s, (i + 0.5) * g, sg * (w2 - 0.04)), y: top }); }
    pts.forEach((a, j) => {
      if (own(a.y + 0.9) !== L.k) return;
      A.add('rail_int', cyl(a.p[0], Y(a.y + 0.45), a.p[1], 0.009, 0.009, 0.9, 6));
      if (j > 0) { const b = pts[j - 1]; A.add('rail_int', beamG([b.p[0], Y(b.y + 0.9), b.p[1]], [a.p[0], Y(a.y + 0.9), a.p[1]], 0.022)); }
    });
    // joue : obstacle marche par marche, du sol bas à la main courante (on ne passe ni sous la volée ni par-dessus le côté)
    if (L.k === s.from) for (let i = 0; i < s.n - 1; i++) colliders.push(col(segQuad(App.stairPt(s, i * g, sg * w2), App.stairPt(s, (i + 1) * g, sg * w2), 0.05), lo.y - 0.02, lo.y + (i + 1) * h + 1.0));
  }
  // face d'arrivée, vue du niveau bas (renfoncement sous le palier) : pleine hauteur, obstacle comme un mur (sinon on y colle le visage
  // et la caméra la traverse) ; arrêté sous la dalle, il ne gêne pas celui qui arrive en haut
  if (L.k === s.from) colliders.push(col(segQuad(App.stairPt(s, s.len, -w2), App.stairPt(s, s.len, w2), 0.05), lo.y - 0.02, hi.y - 0.30));
}
function segQuad(a, b, t) { const e = VV.sub(b, a), L = VV.len(e), n = [-e[1] / L * t / 2, e[0] / L * t / 2]; return [VV.add(a, n), VV.add(b, n), VV.sub(b, n), VV.sub(a, n)]; }
/* garde-corps à barreaudage le long d'une polyligne */
// garde-corps de loggia qui part de l'intérieur d'un poteau ou d'un mur (D201 : lisse et barreaux pris dans le poteau, un barreau à 3 mm de
// sa face, raccord visible) : chaque bout ramené au nu de la matière, le poteau d'extrémité (4 cm) à moitié dans le mur
function railHorsMurs(L, pts) {
  if (!pts || pts.length < 2) return pts;
  // coulisses des brise-soleil (buildBSO) : le poteau d'extrémité du garde-corps ne s'y encastre pas (plan-du-lot, balcon : poteau et
  // coulisse de la porte-fenêtre confondus, raccord sur toute la hauteur)
  const coul = Object.values(D.openings).filter(o => o.bso && o.level === L.k && o.pt).flatMap(o => [[-0.01, 0.035], [o.s[1] - o.s[0] - 0.035, o.s[1] - o.s[0] + 0.01]].map(([a, b]) => ({ o, a, b }))); // abscisses depuis o.p0 (s[0])
  const plein = p => inMatter(L, p) || coul.some(({ o, a, b }) => { const v = VV.sub(p, o.p0), s = v[0] * o.u[0] + v[1] * o.u[1], d = v[0] * o.T[0] + v[1] * o.T[1];
    return s > a - 0.025 && s < b + 0.025 && d > o.depth - 0.035 && d < o.depth + 0.095; });
  const q = pts.map(p => p.slice());
  for (const [i, j] of [[0, 1], [q.length - 1, q.length - 2]]) {
    const a = q[i], b = q[j], l = VV.len(VV.sub(b, a)); if (l < 0.05 || !plein(a)) continue;
    let t = 0; while (t < l - 0.05 && plein(VV.add(a, VV.mul(VV.sub(b, a), t / l)))) t += 0.005;
    if (t < l - 0.05) q[i] = VV.add(a, VV.mul(VV.sub(b, a), t / l));
  }
  return q;
}
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
function makeOperable(id, apply0, rect, opts = {}) {
  // porte posée d'un coup (photos, 360°, contrôle : t et target fixés, sans animation) : ombres à refaire, sinon celle du vantail dans sa
  // position précédente restait sur les murs (constat du 28/09/2026, plan-du-lot : panneau sombre à bord net sur la photo « Chambre 1,
  // autre angle », selon l'ordre des photos) ; en mouvement, la boucle s'en charge
  const apply = v => { if (op && v !== op._v && op.t === op.target) markShadows(); if (op) op._v = v; apply0(v); };
  const lv = opts.lv ?? 0, op = { id, t: opts.t ?? 0, target: opts.t ?? 0, apply, rect, speed: opts.speed ?? 1.7, group: opts.group, lv, y0: LV[lv].y - 0.02, y1: LV[lv].y + LV[lv].H };
  op.apply(op.t); operables.push(op); return op;
}
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
  const op = makeOperable(id, v => { piv.rotation.y = th0 + sig * maxA * v; }, rect, { t: (o.kind === 'entry' || o.closed) ? 0 : 1, group: g, lv: o.level });
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
  openCells(g, id, o.w);
}
function buildWindow(id, group) {
  const o = D.openings[id], w = o.main, sd = sideOf(w), zl = d => sd * d, fw = 0.05, dMid0 = () => zl(((o.frame || [0, 0.06])[0] + (o.frame || [0, 0.06])[1]) / 2);
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
  // partie vitrée fixe : montant de 5 cm, châssis dormant vitré sans poignée ; vantaux sur le reste de la baie
  const [l0, l1] = o.ls || [s0, s1], lw = l1 - l0, fy1 = o.head - fw - 0.003;
  let fy0 = bottom + (o.sill > 0 ? fw : 0.03) + 0.003;
  // fenêtre à allège vitrée (FA) : partie basse vitrée fixe jusqu'à o.allege, traverse, vantaux ouvrants au-dessus ; on ne passe pas
  if (o.allege > bottom + 0.3 && o.allege < o.head - 0.5) {
    const ya = o.allege, A = new Batch(), zc = dMid0(), pw = 0.068, dep = 0.058, n2 = (o.leaves || 1) === 2;
    A.add('frame', boxG(l0 + 0.05, l1 - 0.05, ya - 0.035, ya + 0.035, ...zf)); // traverse dans le dormant
    const pans = n2 ? [[l0 + 0.05, (l0 + l1) / 2], [(l0 + l1) / 2, l1 - 0.05]] : [[l0 + 0.05, l1 - 0.05]];
    for (const [p0, p1] of pans) {
      A.add('frame', boxG(p0, p1, fy0, fy0 + 0.11, zc - dep / 2, zc + dep / 2)); A.add('frame', boxG(p0, p1, ya - 0.035 - pw, ya - 0.035, zc - dep / 2, zc + dep / 2));
      A.add('frame', boxG(p0, p0 + pw, fy0, ya - 0.035, zc - dep / 2, zc + dep / 2)); A.add('frame', boxG(p1 - pw, p1, fy0, ya - 0.035, zc - dep / 2, zc + dep / 2));
      const gl = new THREE.Mesh(prep(boxG(p0 + pw, p1 - pw, fy0 + 0.11, ya - 0.035 - pw, zc - 0.012, zc + 0.012)), M.glass); gl.userData.glass = true; gl.renderOrder = 2; RECOIT.push(gl); g.add(gl);
    }
    A.build(g);
    winColliders.push(col(wallQuad(w, s0, s1, fd0 - 0.02, fd1 + 0.02), LV[o.level].y + bottom - 0.02, LV[o.level].y + ya));
    fy0 = ya + 0.035 + 0.003;
  }
  if (o.fx) {
    const fin = o.fx[1] >= s1 - 0.01, m = fin ? o.fx[0] : o.fx[1], [p0, p1] = fin ? [m + 0.025, s1 - fw] : [s0 + fw, m - 0.025], pw = 0.068, dep = 0.058;
    const P = new Batch(), zc = dMid;
    P.add('frame', boxG(m - 0.025, m + 0.025, bottom, o.head, ...zf)); // montant (F est déjà construit : il irait dans le vide)
    P.add('frame', boxG(p0, p1, fy1 - pw, fy1, zc - dep / 2, zc + dep / 2)); P.add('frame', boxG(p0, p1, fy0, fy0 + (o.sill > 0 ? pw : 0.11), zc - dep / 2, zc + dep / 2));
    P.add('frame', boxG(p0, p0 + pw / 2, fy0, fy1, zc - dep / 2, zc + dep / 2)); P.add('frame', boxG(p1 - pw / 2, p1, fy0, fy1, zc - dep / 2, zc + dep / 2));
    P.build(g);
    const gl = new THREE.Mesh(prep(boxG(p0 + pw / 2, p1 - pw / 2, fy0 + (o.sill > 0 ? pw : 0.11), fy1 - pw, zc - 0.012, zc + 0.012)), M.glass);
    gl.userData.glass = true; gl.renderOrder = 2; RECOIT.push(gl); g.add(gl);
    winColliders.push(col(wallQuad(w, o.fx[0], o.fx[1], fd0 - 0.02, fd1 + 0.02), LV[o.level].y - 0.02, LV[o.level].y + LV[o.level].H));
  }
  const leafDefs = n === 2 ? [[l0 + 0.05, l0 + 0.05 + (lw - 0.1) / 2, 1], [l1 - 0.05, l1 - 0.05 - (lw - 0.1) / 2, -1]] : [[o.hinge === 's1' ? l1 - 0.05 : l0 + 0.05, o.hinge === 's1' ? l0 + 0.05 : l1 - 0.05, o.hinge === 's1' ? -1 : 1]];
  leafDefs.forEach(([hs, other, dirS], idx) => {
    const piv = new THREE.Group(); piv.position.set(hs, 0, dMid); g.add(piv);
    const th0 = dirS > 0 ? 0 : Math.PI, sig = dirS > 0 ? -zs : zs, Lw = Math.abs(other - hs) + (n === 2 ? 0.002 : -0.004); // deux vantaux : jointifs au milieu (pas de fente de jour)
    const y0 = fy0, y1 = fy1, pw = 0.068, dep = 0.058;
    const B = new Batch();
    B.add('frame', boxG(0, pw, y0, y1, -dep / 2, dep / 2)); B.add('frame', boxG(Lw - pw, Lw, y0, y1, -dep / 2, dep / 2));
    B.add('frame', boxG(pw, Lw - pw, y1 - pw, y1, -dep / 2, dep / 2)); B.add('frame', boxG(pw, Lw - pw, y0, y0 + (o.sill > 0 ? pw : 0.11), -dep / 2, dep / 2));
    if (n === 1 || idx === 1) { const zin = zs * (dirS > 0 ? 1 : -1), zi = zin > 0 ? [dep / 2, dep / 2 + 0.02] : [-dep / 2 - 0.02, -dep / 2]; B.add('steel', boxG(Lw - 0.05, Lw - 0.03, 1.02, 1.17, ...zi)); }
    B.build(piv);
    const glass = new THREE.Mesh(prep(boxG(pw, Lw - pw, y0 + (o.sill > 0 ? pw : 0.11), y1 - pw, -0.012, 0.012)), M.glass);
    glass.userData.glass = true; glass.renderOrder = 2; RECOIT.push(glass); piv.add(glass); // ombres : voir reglagesVisite
    pivs.push({ piv, th0, sig });
  });
  const rect = wallQuad(w, l0, l1, fd0 - 0.02, fd1 + 0.02);
  const op = makeOperable(id, v => pivs.forEach(p => { p.piv.rotation.y = p.th0 + p.sig * (Math.PI / 2) * v; }), rect, { t: 0, group: g, lv: o.level });
  op.blocks = o.sill === 0;
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
  openCells(g, id, (o.ls ? o.ls[1] - o.ls[0] : o.w) / (o.leaves === 2 ? 2 : 1));
}
/* culling : une baie est vue des deux côtés ; marge du vantail qui tourne */
function openCells(g, id, pad) { const q = CUL.opens.find(x => x.o.id === id); g.userData.cells = q ? [q.a, q.b] : null; g.userData.pad = pad || 0; }
function buildPlacard(group, f) {
  // construit dans le repère de la façade (x le long des portes, z vers l'extérieur), puis tourné et posé
  const F = App.placardFrame(f), g = new THREE.Group(); group.add(g); g.position.set(F.o[0], 0, F.o[1]); g.rotation.y = F.rot;
  const x0 = 0, x1 = F.W, t0 = -0.055, t1 = 0, zb = -F.Dp, w = (x1 - x0) / 2 + 0.03, pan = [], hh = LV[f.level ?? 0].H - 0.03;
  // côtés et fond sans matière derrière (niche du tableau électrique, cloison lue trop courte, placard posé dans la pièce) : joue ou fond
  // de 19 mm dans l'emprise du placard, jamais de jour sur son intérieur (retour R2, D201 : étagère et tringle vues par le côté).
  // Sondes tous les 10 cm à 3 cm hors du côté ; un placard voisin ferme le côté. Le contrôle des placards (controle.mjs) le vérifie.
  const Lp = D.L[f.level ?? 0], rectF = q => [Math.min(...q.x), Math.max(...q.x), Math.min(...q.z), Math.max(...q.z)];
  const voisins = (Lp.fixtures || []).filter(q => q !== f && q.type === 'placard' && q.x && q.z).map(rectF);
  const plein = p => inMatter(Lp, p) || voisins.some(r => p[0] > r[0] && p[0] < r[1] && p[1] > r[2] && p[1] < r[3]);
  const ouvertCote = (a, b, n) => { const L_ = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(2, Math.ceil(L_ / 0.1)); let o = 0;
    for (let i = 0; i < k; i++) { const t = (i + 0.5) / k, p = F.at(a[0] + (b[0] - a[0]) * t + n[0] * 0.03, a[1] + (b[1] - a[1]) * t + n[1] * 0.03); if (!plein(p)) o++; }
    return o > 0; };
  const joues = R => {
    const jo = { l0: ouvertCote([x0, zb], [x0, t1], [-1, 0]), l1: ouvertCote([x1, zb], [x1, t1], [1, 0]), fond: ouvertCote([x0, zb], [x1, zb], [0, -1]) };
    if (jo.l0) R.add('lacquer', boxG(x0, x0 + 0.019, 0, hh, zb, t1 - 0.005));
    if (jo.l1) R.add('lacquer', boxG(x1 - 0.019, x1, 0, hh, zb, t1 - 0.005));
    if (jo.fond) R.add('lacquer', boxG(x0, x1, 0, hh, zb, zb + 0.019));
    return jo;
  };
  // coffret du tableau électrique dans le placard (432 : porte « Placard TE ») : ni étagère ni tringle devant lui
  const rf = rectF(f), tableau = (Lp.fixtures || []).some(q => q.type === 'tableau' && q.x && q.z && (() => { const r = rectF(q);
    return Math.min(r[1], rf[1]) - Math.max(r[0], rf[0]) > 0.05 && Math.min(r[3], rf[3]) - Math.max(r[2], rf[2]) > 0.05; })());
  const amenage = !tableau && zb < t0 - 0.12; // étagère et penderie seulement si le placard a de la profondeur
  if (f.battante) { // fermé par une porte battante (construite avec les portes) : seulement l'aménagement intérieur
    const R = new Batch(); g.userData.joues = joues(R);
    if (amenage) { R.add('lacquer', boxG(x0 + 0.01, x1 - 0.01, 1.78, 1.80, zb + 0.01, t0 - 0.02)); R.add('chrome', cyl((x0 + x1) / 2, 1.70, (zb + t0) / 2, 0.012, 0.012, x1 - x0 - 0.04, 10, 'x')); }
    R.build(g);
    g.userData.placard = f; return;
  }
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Group(); g.add(m); const B = new Batch(), z0 = i === 0 ? t1 - 0.03 : t0 + 0.012;
    B.add('door_leaf', boxG(0, w, 0.01, hh - 0.02, z0, z0 + 0.018));
    B.add('steel', boxG(i === 0 ? w - 0.04 : 0.02, i === 0 ? w - 0.02 : 0.04, 0.9, 1.3, z0 + 0.018, z0 + 0.022));
    B.build(m); pan.push(m);
  }
  const R = new Batch();
  R.add('steel', boxG(x0, x1, hh - 0.03, hh, t0, t1 - 0.005));
  g.userData.joues = joues(R); g.userData.placard = f;
  if (amenage) {
    R.add('lacquer', boxG(x0 + 0.01, x1 - 0.01, 1.78, 1.80, zb + 0.01, t0 - 0.02));
    R.add('chrome', cyl((x0 + x1) / 2, 1.70, (zb + t0) / 2, 0.012, 0.012, x1 - x0 - 0.04, 10, 'x'));
  }
  R.build(g);
  pan[1].position.x = x1 - w; pan[0].position.x = x0;
  const rect = [F.at(x0, t0), F.at(x1, t0), F.at(x1, t1), F.at(x0, t1)];
  const op = makeOperable('placard', v => { pan[0].position.x = x0 + v * (w - 0.08); }, rect, { t: 0, group: g, lv: f.level ?? 0 });
  op.blocks = false;
  g.traverse(m => { if (m.isMesh) m.userData.op = op; });
  g.userData.cells = cellsOfObject(g); g.userData.pad = 0.1;
}

/* ---------- Brise-soleil orientables ---------- */
function buildBSO() {
  if (G.bso) { scene.remove(G.bso); G.bso.traverse(o => o.geometry && o.geometry.dispose()); }
  G.bso = new THREE.Group(); scene.add(G.bso); const gb = LV.map((l, k) => lvGroup(G.bso, k));
  const drop = S.bsoDrop / 100, tilt = S.bsoTilt * Math.PI / 180;
  for (const o of Object.values(D.openings)) {
    if (!o.bso) continue;
    const w = o.main, sd = sideOf(w), zl = d => sd * d, gw = new THREE.Group(); gw.matrixAutoUpdate = false; gw.matrix.copy(wallMatrix(w)); gb[o.level].add(gw);
    const B = new Batch(), zc = zl(o.depth + 0.05), x0 = o.s[0] + 0.035, x1 = o.s[1] - 0.035, top = o.head - 0.04, bottom = o.sill + 0.01, pitch = 0.072;
    const n = Math.floor((top - bottom) / pitch), nd = Math.round(n * drop), pk = n - nd;
    B.add('bso', boxG(o.s[0] + 0.005, o.s[1] - 0.005, top, o.head + 0.02, Math.min(zl(o.depth), zl(o.depth + 0.11)), Math.max(zl(o.depth), zl(o.depth + 0.11))));
    // coulisses encastrées dans le tableau : 1 cm dans le jambage et 1 cm en deçà du nu de façade (à 5 mm du jambage et 3 cm devant la façade,
    // la fente d'ombre qui les séparait crénelait leur bord : constat du 28/09/2026, loggia du D201)
    const zq = [Math.min(zl(o.depth - 0.01), zc + 0.022 * sd), Math.max(zl(o.depth - 0.01), zc + 0.022 * sd)];
    for (const [xa, xb] of [[o.s[0] - 0.01, o.s[0] + 0.035], [o.s[1] - 0.035, o.s[1] + 0.01]]) B.add('bso', boxG(xa, xb, bottom, top, zq[0], zq[1]));
    let y = top - 0.006;
    for (let i = 0; i < pk; i++) { B.add('bso', boxG(x0, x1, y - 0.004, y, zc - 0.041, zc + 0.041)); y -= 0.0062; }
    if (nd > 0) { y -= 0.03; for (let i = 0; i < nd; i++) { const gg = new THREE.BoxGeometry(x1 - x0, 0.0035, 0.082); gg.rotateX(-tilt * sd); gg.translate((x0 + x1) / 2, y, zc); B.add('bso', worldUV(gg)); y -= pitch; } }
    const yb = Math.max(bottom, y + pitch - 0.05);
    B.add('bso', boxG(x0, x1, yb - 0.02, yb, zc - 0.045, zc + 0.045));
    B.build(gw); gw.userData.cells = [DEHORS];
  }
  markShadows();
  if (S.cut) G.bso.visible = false;
  CUL.dirty = true; applyLevels();
}

/* ---------- Équipements fournis ---------- */
function buildFixed() {
  G.fixed = new THREE.Group(); scene.add(G.fixed); const cols = [];
  for (const L of D.L) buildFixedLevel(L, lvGroup(G.fixed, L.k), cols);
  fixedColliders = cols;
}
function buildFixedLevel(L, gf, cols0) {
  const B = new Batch(), cols = [], H = L.H; // hauteur sous plafond du niveau
  const inFrame = (Mx, add) => { const b = new Batch(); add(b); const gr = new THREE.Group(); gr.matrixAutoUpdate = false; gr.matrix.copy(Mx); b.build(gr); gf.add(gr); gr.userData.cells = cellsOfObject(gr); return gr; };
  for (const f of L.fixtures) try { // un équipement défectueux n'empêche pas les autres
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
      const e = Math.min(0.06, (x1 - x0) / 5, (z1 - z0) / 5), eT = Math.min(0.15, (alongX ? x1 - x0 : z1 - z0) / 6), fin = f.tap === 'x1' || f.tap === 'z1'; // côté de la robinetterie
      const ix0 = x0 + (alongX && !fin ? eT : e), ix1 = x1 - (alongX && fin ? eT : e), iz0 = z0 + (!alongX && !fin ? eT : e), iz1 = z1 - (!alongX && fin ? eT : e), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      B.add('ceramic', rbox(cx, bot / 2, cz, x1 - x0, bot, z1 - z0, 0.006));
      for (const [a0, a1, b0, b1] of [[x0, x1, z0, iz0], [x0, x1, iz1, z1], [x0, ix0, iz0, iz1], [ix1, x1, iz0, iz1]]) B.add('ceramic', boxG(a0, a1, bot - 0.01, h, b0, b1));
      const sg = fin ? -1 : 1; // vers la cuve
      B.add('chrome', cyl(alongX ? (fin ? ix1 : ix0) + sg * 0.09 : cx, bot + 0.002, alongX ? cz : (fin ? iz1 : iz0) + sg * 0.09, 0.024, 0.024, 0.004, 20)); // bonde
      const tx = alongX ? (fin ? x1 - eT / 2 : x0 + eT / 2) : cx, tz = alongX ? cz : (fin ? z1 - eT / 2 : z0 + eT / 2);
      B.add('chrome', cyl(tx, h + 0.05, tz, 0.02, 0.02, 0.1)); B.add('chrome', cyl(tx + (alongX ? sg * 0.06 : 0), h + 0.09, tz + (alongX ? 0 : sg * 0.06), 0.012, 0.012, 0.12, 10, alongX ? 'x' : 'z'));
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
      makeMirror(gf, Math.min(0.8, wid - 0.02), 0.72, p[0] + f.dir[0] * 0.009, 1.45, p[1] + f.dir[1] * 0.009, rot);
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
      // coffret contre le fond de la gaine technique : le côté opposé au seul côté ouvert sur une pièce (face z[0] si le doute demeure)
      const [x0, x1] = f.x, [z0, z1] = f.z, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
      const ouvert = p => !inMatter(L, p) && !!roomAtLv(p[0], p[1], L.k);
      // côté ouvert : sur une pièce, ou fermé par la porte du coffret (plan-du-lot, 432)
      const porte = p => Object.values(L.openings).some(o => { if (!o.p0 || !o.u || !o.T) return false; const sv = (p[0] - o.p0[0]) * o.u[0] + (p[1] - o.p0[1]) * o.u[1], dv = (p[0] - o.p0[0]) * o.T[0] + (p[1] - o.p0[1]) * o.T[1];
        return sv > 0 && sv < o.w && dv > -0.02 && dv < o.depth + 0.02; });
      const cotes = [['z0', [xm, z1 + 0.04]], ['z1', [xm, z0 - 0.04]], ['x0', [x1 + 0.04, zm]], ['x1', [x0 - 0.04, zm]]].filter(([, p]) => ouvert(p) || porte(p));
      // côtés adossés à la matière (mur, cloison, gaine) : le coffret ne se pose que contre l'un d'eux, jamais dans le vide (retour R2) ;
      // de préférence face à l'ouverture, contre le plus long (plan-du-lot : contre le mur du fond de la niche, pas de chant contre sa cloison)
      const dos = [['z0', [xm, z0 - 0.04]], ['z1', [xm, z1 + 0.04]], ['x0', [x0 - 0.04, zm]], ['x1', [x1 + 0.04, zm]]].filter(([, p]) => inMatter(L, p)).map(c => c[0]);
      const long = c => c[0] === 'z' ? x1 - x0 : z1 - z0, face = cotes.map(c => c[0]).filter(c => dos.includes(c));
      const fond = (face.length ? face : dos).slice().sort((a, b) => long(b) - long(a) || (a === 'z0' ? -1 : b === 'z0' ? 1 : 0))[0];
      if (!fond) { console.warn('plan.json : tableau électrique sans mur où s\'adosser, non dessiné', f.x, f.z); continue; }
      f._fond = fond; // pour le contrôle du coffret adossé
      // repère local : u le long du fond, v depuis le fond vers la pièce
      const bx = (u0, u1, y0, y1, v0, v1) => fond === 'z0' ? boxG(u0, u1, y0, y1, z0 + v0, z0 + v1) : fond === 'z1' ? boxG(u0, u1, y0, y1, z1 - v1, z1 - v0)
        : fond === 'x0' ? boxG(x0 + v0, x0 + v1, y0, y1, u0, u1) : boxG(x1 - v1, x1 - v0, y0, y1, u0, u1);
      const [a0, a1] = fond[0] === 'z' ? [x0, x1] : [z0, z1], am = (a0 + a1) / 2;
      B.add('tableau', bx(a0 + 0.05, a1 - 0.05, 0.95, 1.90, 0.005, 0.13));
      { const cb = new THREE.Box3().setFromBufferAttribute(bx(a0 + 0.05, a1 - 0.05, 0.95, 1.90, 0.005, 0.134).attributes.position); // coffret à hauteur d'œil : un obstacle
        cols.push(col([[cb.min.x, cb.min.z], [cb.max.x, cb.min.z], [cb.max.x, cb.max.z], [cb.min.x, cb.max.z]]));
        // niche ouverte sur la pièce (façade en trait fin, D201) : trop peu profonde pour y entrer, elle arrête le visiteur à son ouverture
        // comme un mur (sinon il s'y engageait et ses joues le déviaient vers la porte voisine)
        if (f.facade) cols.push(col([[x0, z0], [x1, z0], [x1, z1], [x0, z1]])); }
      B.add('lacquer', bx(a0 + 0.052, a1 - 0.052, 0.96, 1.89, 0.13, 0.134));
      B.add('pvc', bx(am - 0.06, am + 0.06, 1.90, H, 0.005, 0.06));
      B.add('pvc', bx(am - 0.06, am + 0.06, 0, 0.95, 0.005, 0.06));
    } else if (f.type === 'placard') {
      buildPlacard(G.doorsLv[L.k], f);
      cols.push(col([[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]]));
    } else if (f.type === 'dep') {
      // du sol fini au plafond (fiche M1 : avec H + 0,3, la descente dépassait de 15 cm au-dessus des murs de la maquette)
      B.add('pvc', cyl(f.p[0], H / 2, f.p[1], f.r, f.r, H, 16));
      cols.push(col([[f.p[0] - f.r, f.p[1] - f.r], [f.p[0] + f.r, f.p[1] - f.r], [f.p[0] + f.r, f.p[1] + f.r], [f.p[0] - f.r, f.p[1] + f.r]]));
    }
  } catch (e) { console.warn('plan.json : équipement non construit', f.type, e); }
  // interrupteurs à 1,10 m côté gâche (hypothèse de pose courante)
  for (const o of Object.values(L.openings)) {
    if (!(o.kind === 'door' || o.kind === 'entry') || o.jamb === 0.02) continue;
    const w = o.main, side = o.kind === 'entry' ? o.swing : -o.swing, d = side > 0 ? w.t + 0.006 : -0.006, latchS1 = o.hinge !== 's1';
    const s = latchS1 ? o.s[1] + 0.13 : o.s[0] - 0.13; if (s < 0.05 || s > w.L - 0.05) continue;
    const c = w.pt(s, d), nrm = VV.mul(o.T, side > 0 ? 1 : -1), tg = w.u;
    const q = [VV.add(c, VV.mul(tg, -0.04)), VV.add(c, VV.mul(tg, 0.04)), VV.add(VV.add(c, VV.mul(tg, 0.04)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, -0.04)), VV.mul(nrm, 0.009))];
    B.add('lacquer', prismG(q, 1.06, 1.14));
    const q2 = [VV.add(VV.add(c, VV.mul(tg, -0.022)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, 0.022)), VV.mul(nrm, 0.009)), VV.add(VV.add(c, VV.mul(tg, 0.022)), VV.mul(nrm, 0.013)), VV.add(VV.add(c, VV.mul(tg, -0.022)), VV.mul(nrm, 0.013))];
    B.add('lacquer', prismG(q2, 1.078, 1.122));
  }
  B.build(gf, { walk: ['tray'], cells: lvMat(L.k) });
  for (const c of cols) { c.y0 = L.y - 0.02; c.y1 = L.y + H; cols0.push(c); }
}
function rectDir(p, dir, a0, a1, hw) { const s = [-dir[1], dir[0]], at = (a, b) => [p[0] + dir[0] * a + s[0] * b, p[1] + dir[1] * a + s[1] * b]; return [at(a0, -hw), at(a1, -hw), at(a1, hw), at(a0, hw)]; }

/* ---------- Luminaires ---------- */
function lampShadow(l) { const r = App.coarse ? 256 : 512; l.shadow.mapSize.set(r, r); l.shadow.bias = -0.003; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.05; l.shadow.camera.far = 12; if (!SHOOT) l.shadow.autoUpdate = false; }
/* réglages de la visite (hors mode photo) : les ampoules reçoivent l'ombre des lampes (allumées, elles restent blanches : aspect
   inchangé ; une lampe cachée derrière un mur ne les éclaire plus). Le verre et le cadre des miroirs ne reçoivent aucune ombre, comme
   avant : une lampe éclaire toutes les vitres, même à travers les murs, et le culling la garde allumée dès qu'une vitre ou un miroir
   est vu (CUL.verre). L'ombre d'une lampe porte à 12 m, comme avant : au-delà, sa lumière traverse les murs (de nuit, abords et
   immeuble d'en face éclairés par le logement) ; le culling garde alors la lampe allumée (portée lointaine). Ces deux fuites de
   lumière sont connues ; les corriger (verre qui reçoit l'ombre des lampes, ombre portée à 40 m) change l'aspect de la visite et des
   photos : à décider avec l'utilisateur. Mode photo : rendu d'avant, à l'identique */
const RECOIT = [];
function reglagesVisite(on) {
  for (const m of RECOIT) m.receiveShadow = on && (m.material === M.bulb || m.material === M.bulbOn);
  markShadows(); invalidate(2);
}
const lamps = [];
function buildLamps() {
  G.lamps = new THREE.Group(); scene.add(G.lamps);
  for (const Lv of D.L) buildLampsLevel(Lv, lvGroup(G.lamps, Lv.k));
}
function buildLampsLevel(Lv, gl) {
  const B = new Batch();
  for (const L of Lv.lamps) {
    if (L.wall) { // applique
      const [x, z] = L.wall, [nx, nz] = L.n, y = L.y || 2.0;
      B.add('rail', boxG(x - 0.07 + nx * 0.0, x + 0.07, y - 0.05, y + 0.05, Math.min(z, z + nz * 0.08), Math.max(z, z + nz * 0.08)));
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.05), M.bulb); bulb.position.set(x + nx * 0.05, y - 0.055, z + nz * 0.05); RECOIT.push(bulb); gl.add(bulb); bulb.userData.cells = cellsOfObject(bulb);
      const l = new THREE.PointLight(0xffd8a8, 0, 0, 2); l.position.set(x + nx * 0.18, y - 0.1, z + nz * 0.18); lampShadow(l); l.userData.bulb = bulb; l.userData.ext = true; l.userData.lv = Lv.k; gl.add(l); lamps.push(l);
      continue;
    }
    // sous un soffite : plafonnier à la hauteur du soffite, suspension raccourcie
    const [x, z] = L.p, rs = roomAtLv(x, z, Lv.k), so = rs && rs.soffite && Array.isArray(rs.soffite.poly) && rs.soffite.y < Lv.H - 0.05 ? rs.soffite : null;
    const H = so ? so.y : Lv.H, drop = so ? Math.min(L.drop ?? 0.30, 0.12) : L.drop ?? 0.30;
    B.add('dcl', cyl(x, H - 0.012, z, 0.045, 0.045, 0.025, 16));
    if (drop > 0.1) { B.add('cable', cyl(x, H - drop / 2, z, 0.003, 0.003, drop - 0.03, 6)); B.add('dcl', cyl(x, H - drop + 0.045, z, 0.018, 0.018, 0.05, 12)); }
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), M.bulb); bulb.position.set(x, H - drop, z); RECOIT.push(bulb); gl.add(bulb); bulb.userData.cells = cellsOfObject(bulb);
    const wet = roomAtLv(x, z, Lv.k)?.floor === 'wet', l = new THREE.PointLight(wet ? 0xfff1e2 : 0xffe6c8, 0, 0, 2); l.position.set(x, H - Math.max(drop + 0.03, 0.11), z); lampShadow(l); l.userData.blind = !!L.blind; l.userData.bulb = bulb; l.userData.lv = Lv.k; gl.add(l); lamps.push(l);
  }
  B.build(gl, { cells: lvMat(Lv.k) });
}

/* ---------- Contexte : immeuble, étages voisins, abords ---------- */
const ctxColliders = [], ctxLamps = [];
function buildContext() {
  G.ctx = new THREE.Group(); scene.add(G.ctx);
  const A = new Batch(), NS = new Batch();
  const below = CTX.below ?? 0, above = CTX.above ?? 0;
  // masses de l'immeuble autour du logement
  for (const m of CTX.masses || []) {
    if (m.notAt0) { A.add('facade', prismG(m.poly, GROUND, -0.30)); A.add('facade', prismG(m.poly, YTOP + HTOP + 0.28, ROOF)); } // absente sur tous les niveaux du logement
    else A.add('facade', prismG(m.poly, GROUND, ROOF));
  }
  // étages voisins : sous le niveau le plus bas et au-dessus du plus haut seulement (jamais superposés à un vrai niveau), même enveloppe, vitrages sombres
  for (let lv = -below; lv <= above; lv++) {
    if (lv === 0) continue;
    const Lg = lv < 0 ? D.L[0] : D.L[TOP], y0 = lv < 0 ? LV[0].y + lv * LEVEL : YTOP + lv * LEVEL, H = Lg.H;
    if (lv !== 1) A.add('slab', prismG(Lg.outline, y0 - 0.30, y0 - 0.02));
    for (const w of Lg.walls) {
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
    for (const lg of Lg.loggias) {
      if (lv !== 1) A.add('slab', prismG(lg.slab, y0 - 0.30, y0 - 0.02));
      railing(A, lg.rail, y0);
    }
  }
  const LT = D.L[TOP], yR = YTOP + (above + 1) * LEVEL;
  for (const lg of LT.loggias) A.add('slab', prismG(lg.slab, yR - 0.30, yR - 0.02));
  A.add('slab', prismG(LT.outline, yR - 0.30, ROOF + 0.02));
  for (const m of CTX.masses || []) A.add('ext', prismG(m.poly, ROOF, ROOF + 0.5));
  A.add('ext', prismG(LT.outline, ROOF, ROOF + 0.5));
  // palier devant l'entrée, au niveau de la porte palière
  if (CTX.palier) {
    const p = CTX.palier.poly, Lp = D.L[CTX.palier.level ?? D.entry], y = Lp.y, H = Lp.H, px0 = GEO.bbox(Lp.outline)[0];
    // 2 mm sous le sol et au-dessus du plafond du logement : là où le palier du plan le recouvre, la pièce l'emporte (sinon taches du
    // carrelage du palier dans la pièce, plan-du-lot)
    A.add('palier_floor', prismG(p, y - 0.30, y - 0.002)); A.add('ceiling', prismG(p, y + H + 0.002, y + H + 0.3));
    const pp = GEO.polyArea(p) < 0 ? p.slice().reverse() : p;
    for (let i = 0; i < pp.length; i++) {
      const a = pp[i], b = pp[(i + 1) % pp.length], e = VV.sub(b, a), L = VV.len(e), nIn = [-e[1] / L, e[0] / L];
      const mid = VV.mul(VV.add(a, b), 0.5); if (Math.abs(mid[0] - px0) < 0.05 || GEO.pointInPoly(mid[0] + nIn[0] * -0.1, mid[1] + nIn[1] * -0.1, Lp.outline)) continue;
      A.add('wall_b', prismG([a, b, VV.add(b, VV.mul(nIn, 0.01)), VV.add(a, VV.mul(nIn, 0.01))], y, y + H));
    }
    const c = GEO.centroid(p); const pl = new THREE.PointLight(0xfff0dd, 3, 0, 2); pl.position.set(c[0], y + H - 0.2, c[1]); pl.visible = !simple(); G.ctx.add(pl); ctxLamps.push(pl);
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
  A.build(G.ctx, { walk: [], grid: 6 });
  const ns = new THREE.Group(); NS.build(ns, { cast: false, grid: 6 }); G.ctx.add(ns);
  G.orbitGround = new THREE.Mesh(new THREE.CircleGeometry(SPAN * 1.2, 64).rotateX(-Math.PI / 2), M.orbit_ground);
  G.orbitGround.position.set(CEN[0], -0.305, CEN[1]); G.orbitGround.receiveShadow = true; scene.add(G.orbitGround);
}

/* ---------- Ciel et soleil ---------- */
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true; sun.shadow.mapSize.set(App.coarse ? 2048 : 4096, App.coarse ? 2048 : 4096);
const SH = SPAN / 2 + 10;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 0.5, far: 90 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; if (!SHOOT) sun.shadow.autoUpdate = false; // hors mode photo : shadowPass()
sun.target.position.set(CEN[0], 0, CEN[1]); scene.add(sun, sun.target);
/* rendu simple : le soleil sert de lumière principale (sans ombre, direction et intensité fixes), plus une lumière d'appoint du côté
   opposé ; azimuts obliques (35° et 215° des axes du plan) : deux murs d'orientations différentes ne reçoivent jamais la même lumière */
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const fill = new THREE.DirectionalLight(0xffffff, 0); fill.target.position.set(CEN[0], 0, CEN[1]); fill.visible = false; scene.add(fill, fill.target);
const SIMPLE_KEY = { dir: new THREE.Vector3(0.52, 0.72, 0.36).normalize(), i: 2.0 }, SIMPLE_FILL = { dir: new THREE.Vector3(-0.25, 0.35, -0.9).normalize(), i: 0.4 };
let SIMPLE_ENV_K = 0.5, SIMPLE_TM = THREE.NeutralToneMapping;
/* porte palière en rendu simple : sans exposition automatique, son anthracite (0x4a4f53) sortait presque noir (45 à 52 sur 255 dans
   l'entrée du 3124, du D201 et du 3081, 124 sur les photos, faites en ultra réaliste). En rendu simple, gris moyen, la valeur qu'elle a
   sur les photos ; une tonalité AgX aurait relevé les sombres mais délavé toute l'image (parquet pâle, murs gris). Contrôlé par
   moteur/controle.mjs (matières lisibles en rendu simple) */
const ENTRY_LEAF = { ultra: 0x4a4f53, simple: 0x8c9196 };
// réglage à chaud (mesures) : __v.reglageSimple({ key, fill, env, keyDir, fillDir })
function reglageSimple(o = {}) {
  if (o.key != null) SIMPLE_KEY.i = o.key; if (o.fill != null) SIMPLE_FILL.i = o.fill; if (o.env != null) SIMPLE_ENV_K = o.env;
  if (o.tm) SIMPLE_TM = THREE[o.tm + 'ToneMapping'];
  if (o.keyDir) SIMPLE_KEY.dir.set(...o.keyDir).normalize(); if (o.fillDir) SIMPLE_FILL.dir.set(...o.fillDir).normalize();
  if (simple()) { updateSun(); invalidate(4); }
  return { key: SIMPLE_KEY.i, fill: SIMPLE_FILL.i, env: SIMPLE_ENV_K, keyDir: SIMPLE_KEY.dir.toArray(), fillDir: SIMPLE_FILL.dir.toArray() };
}
/* environnement neutre du rendu simple : dégradé d'un plafond clair à un sol chaud (lumière diffuse de toutes les directions, reflets des
   métaux et des vitrages ; un métal sans environnement serait noir). Calculé une fois, 64 × 32 */
const envSimple = (() => {
  const W = 64, Hh = 32, arr = new Uint16Array(W * Hh * 4), toH = THREE.DataUtils.toHalfFloat;
  for (let j = 0; j < Hh; j++) { const dy = Math.sin(((j + 0.5) / Hh - 0.5) * Math.PI);
    for (let i = 0; i < W; i++) { const ph = (i + 0.5) / W * 2 * Math.PI, band = 0.06 * Math.max(0, Math.cos(ph * 2)) * (1 - Math.abs(dy));
      const c = dy >= 0 ? mix3([0.80, 0.80, 0.79], [0.82, 0.83, 0.84], Math.pow(dy, 0.6)) : mix3([0.80, 0.80, 0.79], [0.96, 0.93, 0.88], Math.pow(-dy, 0.6));
      const k = (j * W + i) * 4; arr[k] = toH(c[0] + band); arr[k + 1] = toH(c[1] + band); arr[k + 2] = toH(c[2] + band); arr[k + 3] = toH(1); } }
  const t = new THREE.DataTexture(arr, W, Hh, THREE.RGBAFormat, THREE.HalfFloatType);
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.LinearSRGBColorSpace; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
const portals = [];
function buildShadowRoof() { // un toit d'ombre par niveau : seul celui du niveau affiché (ou du plus haut en visite) est actif
  G.shadowRoof = new THREE.Group(); sun.shadow.camera.layers.enable(1); scene.add(G.shadowRoof);
  for (const L of D.L) {
    const y1 = L.y + L.H, parts = [prismG(L.outline, y1, y1 + 0.28)];
    for (const lg of L.loggias) parts.push(prismG(lg.slab, y1, y1 + 0.28));
    for (const m of CTX.masses || []) parts.push(prismG(m.poly, -0.30, Math.min(ROOF, y1 + LEVEL * 2)));
    const m = new THREE.Mesh(mergeGeometries(parts.map(prep)), new THREE.MeshBasicMaterial()); m.castShadow = true; m.layers.set(1); m.userData.lv = L.k; G.shadowRoof.add(m);
  }
  applyLevels();
}
/* lumières de fenêtre : éteintes en visite (la lumière du jour y vient des sondes). Hors mode photo elles y sont aussi retirées des
   shaders (visible = false) : même image, 7 à 15 % de temps d'image en moins */
function buildPortals() {
  for (const o of Object.values(D.openings)) {
    if (o.kind !== 'window' && o.kind !== 'french') continue;
    const wdt = o.w - 0.1, h = o.head - o.sill - 0.08, l = new THREE.RectAreaLight(0xdfe8ff, 0, wdt, h);
    const c = o.pt((o.s[0] + o.s[1]) / 2, (o.frame ? o.frame[0] : 0) - 0.01), inn = VV.mul(o.T, -5);
    l.position.set(c[0], LV[o.level].y + o.sill + 0.04 + h / 2, c[1]); l.lookAt(c[0] + inn[0], l.position.y, c[1] + inn[1]);
    l.userData.id = o.id; l.userData.lv = o.level; scene.add(l); portals.push(l);
  }
}
const SEASON = { hiver: { N: 355, utc: 1, label: '21 déc.' }, printemps: { N: 79, utc: 1, label: '20 mars' }, ete: { N: 172, utc: 2, label: '21 juin' }, automne: { N: 265, utc: 2, label: '22 sept.' } };
function sunPos(season = S.season, hour = S.hour) {
  const s = SEASON[season], D2R = Math.PI / 180, lat = (D.geo?.lat ?? 45.75) * D2R, lon = D.geo?.lon ?? 4.85;
  const decl = 23.44 * D2R * Math.sin(2 * Math.PI * (284 + s.N) / 365), B = 2 * Math.PI * (s.N - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const solar = hour - s.utc + lon / 15 + eot / 60, ha = (solar - 12) * 15 * D2R;
  const alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha));
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI;
  return { alt, az };
}
let skyTex = null, skyInfo = null;
/* lampes : plan à plusieurs niveaux → au plus 8 lampes à ombre en tout ; une lampe sans ombre ne s'allume que sur le niveau
   affiché (en maquette) ou du visiteur (en visite), sinon sa lumière traverserait la dalle */
function updateLamps() {
  // rendu simple : aucune lampe calculée (retirées des shaders), ampoules simplement lumineuses ; lampes du palier aussi
  if (simple()) {
    lamps.forEach(l => { l.intensity = l.userData.i0 = 0; l.castShadow = false; l.visible = false; l.userData.bulb.material = M.bulbOn; });
    for (const l of ctxLamps) l.visible = false;
    if (CUL.on) cullUpdate(); return;
  }
  for (const l of ctxLamps) l.visible = true;
  const sa = skyInfo ? Math.sin(skyInfo.alt) : 1, night = sa < 0.06, act = S.mode === 'walk' ? walk.lv : S.level;
  const allShadow = !MULTI || lamps.filter(l => !l.userData.ext).length <= 8; let nsh = 0;
  lamps.forEach(l => {
    let on = S.lights === 'on' || (S.lights === 'auto' && (night || l.userData.blind));
    if (MULTI) { if (l.userData.lv !== act && (l.userData.ext || !allShadow)) on = false; if (on && !l.userData.ext && !allShadow && ++nsh > 8) on = false; }
    l.intensity = l.userData.i0 = on ? (night ? 10 : 2.4) * (l.userData.ext ? 0.6 : 1) : 0; l.castShadow = on && !l.userData.ext; l.userData.bulb.material = on ? M.bulbOn : M.bulb; l.visible = true;
  });
  if (CUL.on) cullUpdate(); // lampes des pièces cachées éteintes à nouveau
}
/* niveaux visibles : tous en visite (on voit par le vide), en maquette le niveau affiché et ceux du dessous */
function applyLevels() {
  const top = S.mode === 'orbit' ? S.level : TOP;
  for (const key of LVKEYS) if (G[key]) for (const g of G[key].children) if (g.userData.lv != null) g.visible = g.userData.lv <= top;
  if (G.shadowRoof) for (const m of G.shadowRoof.children) m.visible = m.userData.lv === top;
  markShadows(); invalidate(3);
}
const EXT_MATS = ['ext', 'slab', 'slab_j', 'loggia_floor', 'rail', 'bso', 'facade', 'ground', 'paving', 'pvc'];
function updateSun() {
  // rendu simple : ciel d'un jour figé (22 septembre, 13 h), quelle que soit l'heure choisie : la nuit n'assombrit jamais la visite
  const SIMPLE = simple(), { alt, az } = SIMPLE ? sunPos('automne', 13) : sunPos(), azPlan = az + (D.geo?.nord || 0) * Math.PI / 180;
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
  // matières extérieures : reflet du ciel en ultra réaliste ; en rendu simple, l'environnement neutre comme partout (sous-face de la dalle
  // d'une loggia sombre sinon : elle ne voit que le sol du ciel)
  for (const k of EXT_MATS) if (M[k]) { M[k].envMap = SIMPLE ? null : tex; M[k].needsUpdate = true; }
  if (M.entry_leaf) M.entry_leaf.color.setHex(SIMPLE ? ENTRY_LEAF.simple : ENTRY_LEAF.ultra);
  invalidateProbes();
  if (SIMPLE) {
    sun.castShadow = false; sun.intensity = SIMPLE_KEY.i; sun.color.setRGB(1, 0.98, 0.95); sun.position.copy(sun.target.position).addScaledVector(SIMPLE_KEY.dir, 50);
    fill.visible = true; fill.intensity = SIMPLE_FILL.i; fill.color.setRGB(0.95, 0.97, 1); fill.position.copy(fill.target.position).addScaledVector(SIMPLE_FILL.dir, 50);
  } else {
    sun.castShadow = true; fill.visible = false; fill.intensity = 0;
    sun.intensity = 8.0 * smooth(-0.015, 0.22, sa); sun.color.setRGB(sunc[0], sunc[1], sunc[2]);
    sun.position.copy(sun.target.position).addScaledVector(dir, 50);
  }
  markShadows();
  skyInfo = { alt, az, day, hor };
  const bso = 1 - (S.bsoDrop / 100) * (0.35 + 0.6 * S.bsoTilt / 80);
  for (const l of portals) { l.userData.i = 2.6 * day * (D.openings[l.userData.id].bso ? bso : 1); l.color.setRGB(0.8 + hor[0] * 0.2, 0.82 + hor[1] * 0.18, 0.85 + hor[2] * 0.15); }
  updateLamps();
  scene.fog = new THREE.Fog(new THREE.Color(hor[0], hor[1], hor[2]), 110, 480);
  applyEnv();
  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((az * 180 / Math.PI) % 360) / 45) % 8];
  const sunTxt = sa > 0 ? `Soleil à ${Math.round(alt * 180 / Math.PI)}° · ${cardinal} ${Math.round(az * 180 / Math.PI)}°` : 'Soleil couché';
  const si = document.getElementById('sunInfo'); if (si) si.textContent = sunTxt;
  App.sunText(`${SEASON[S.season].label} · ${App.fmtHour(S.hour)} · ${sunTxt}`);
  invalidate();
}

/* ---------- Lumière d'ambiance en visite (sondes par pièce, mélange aux passages) ---------- */
const PROBES = Object.assign({}, D.probes || {}), PASSAGES = (D.passages || []).slice(), EXPF = D.exposure || {}, PROBE_Y = {};
const probeLv = id => { const st = STAIRS.find(s => '~' + s.id === id); if (st) return st.from; const r = D.rooms.find(q => q.id === id); return r ? r.level : 0; };
for (const id of Object.keys(PROBES)) PROBE_Y[id] = LV[probeLv(id)].y + 1.35; // à 1,35 m au-dessus du sol de la pièce
for (const s of STAIRS) { // une sonde à mi-volée, mêlée aux pièces du pied et de l'arrivée
  const id = '~' + s.id, f = App.stairAt(s, 0), t = App.stairAt(s, s.len), pf = VV.sub(f.p, VV.mul(f.u, 0.3)), pa = VV.add(t.p, VV.mul(t.u, 0.3));
  PROBES[id] = App.stairAt(s, s.len / 2).p; PROBE_Y[id] = (LV[s.from].y + LV[s.to].y) / 2 + 1.35;
  const rf = App.roomAt(pf[0], pf[1], s.from), ra = App.roomAt(pa[0], pa[1], s.to);
  if (rf) PASSAGES.push({ a: id, b: rf.of || rf.id, p: f.p, r: 0.9, level: s.from });
  if (ra) PASSAGES.push({ a: id, b: ra.of || ra.id, p: t.p, r: 0.9, level: s.to });
}
const probe = { cache: {}, stamp: 1, queue: [], rt: null, cam: null, pmrem: null, timer: 0 };
const ambient = new THREE.LightProbe(); ambient.intensity = 0; scene.add(ambient);
const REFL_K = 0.25, K_OUT = 1.45, EXP_KEY = D.simple ? 0.24 : 0.19, K_REF = 4.4;
// hors mode photo, les sondes sont reprises aussi en maquette (à l'arrêt, dans l'état de la visite) : elles sont prêtes à l'entrée en visite
function invalidateProbes() { probe.stamp++; clearTimeout(probe.timer); probe.timer = setTimeout(() => { if (!simple() && (S.mode === 'walk' || !SHOOT)) queueProbes(); }, 350); }
/* scène dans l'état de la visite le temps d'une capture de sonde faite hors visite : plafonds, contexte, tous les niveaux, lampes du
   niveau du visiteur, ciel net. S.mode est posé sans App.set (aucun écouteur ne doit réagir), puis tout est rétabli */
function withWalkScene(fn) {
  if (S.mode === 'walk') return fn();
  const sv = { mode: S.mode, ceil: G.ceil.visible, ctx: G.ctx.visible, og: G.orbitGround.visible, blur: scene.backgroundBlurriness, pv: portals.map(l => l.visible) };
  const restore = () => { S.mode = sv.mode; G.ceil.visible = sv.ceil; G.ctx.visible = sv.ctx; G.orbitGround.visible = sv.og; scene.backgroundBlurriness = sv.blur; portals.forEach((l, i) => { l.visible = sv.pv[i]; }); applyLevels(); updateLamps(); };
  S.mode = 'walk'; G.ceil.visible = true; G.ctx.visible = true; G.orbitGround.visible = false; scene.backgroundBlurriness = 0; portals.forEach(l => { l.visible = false; }); applyLevels(); updateLamps();
  let r; try { r = fn(); } catch (e) { restore(); throw e; }
  if (r && r.then) return r.finally(restore); // capture asynchrone (compilation des shaders)
  restore(); return r;
}
/* au chargement, derrière l'écran de chargement : toutes les sondes (≈ 20 ms chacune, GPU au repos). Plus de gel à l'entrée en visite */
function captureAllProbes() {
  if (SHOOT || S.cut || simple()) return; // rendu simple : aucune sonde (prises à la bascule en ultra réaliste, probesNow)
  withWalkScene(() => { for (const id of Object.keys(PROBES)) captureProbe(id); });
  probe.queue = [];
}
/* bascule en ultra réaliste : toutes les sondes d'un coup (≈ 20 ms chacune), pas une lumière d'attente fausse pendant qu'elles se font */
function probesNow() { if (S.cut) { queueProbes(); return; } withWalkScene(() => { for (const id of Object.keys(PROBES)) captureProbe(id); }); probe.queue = []; }
function queueProbes() {
  if (simple()) { probe.queue = []; return; }
  const cur = baseRoom(walk.x, walk.z);
  probe.queue = Object.keys(PROBES).filter(id => !probe.cache[id] || probe.cache[id].stamp !== probe.stamp).sort((a, b) => (b === cur) - (a === cur) || (MULTI ? (probeLv(b) === walk.lv) - (probeLv(a) === walk.lv) : 0));
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
  cullRestore(); shadowPass(); // hors mode photo : toute la maquette et ses ombres, comme sans culling
  if (!probe.rt) { probe.rt = new THREE.WebGLCubeRenderTarget(App.coarse ? 48 : 96, { type: THREE.HalfFloatType }); probe.cam = new THREE.CubeCamera(0.05, 400, probe.rt); probe.pmrem = new THREE.PMREMGenerator(renderer); }
  const save = { env: scene.environment, ei: scene.environmentIntensity, cur: cursor.visible, clip: renderer.clippingPlanes, sh: ambient.sh.clone(), ai: ambient.intensity };
  mirrors.forEach(m => { m.v = m.refl.visible; m.refl.visible = false; m.std.visible = true; });
  const bulbs = lamps.map(l => l.userData.bulb.material); lamps.forEach(l => { l.userData.bulb.material = M.bulb; });
  const pis = portals.map(l => l.intensity); portals.forEach(l => { l.intensity = 0; });
  cursor.visible = false; renderer.clippingPlanes = [];
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = SHOOT;
  probe.cam.position.set(p[0], PROBE_Y[id] ?? 1.35, p[1]);
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
function roomIdAt(x, z, lv) { const r = roomAtLv(x, z, lv ?? walk.lv); return r ? (r.of || r.id) : null; }
function baseRoom(x, z, lv = walk.lv, st = walk.st) {
  if (MULTI && st && !roomAtLv(x, z, lv)) return '~' + st.id; // sur la volée : sonde de l'escalier
  const id = roomIdAt(x, z, lv);
  if (id && PROBES[id]) return id;
  if (id && App.isExt(D.rooms.find(r => r.id === id))) return id; // extérieur : pas de sonde, lumière du ciel
  let best = null, bd = 1e9; for (const P of PASSAGES) { if (MULTI && P.level !== lv) continue; const d = Math.hypot(x - P.p[0], z - P.p[1]); if (d < bd) { bd = d; best = P; } }
  return best ? best.a : (MULTI && Object.keys(PROBES).find(k => probeLv(k) === lv)) || Object.keys(PROBES)[0];
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
  if (simple()) { // éclairage fixe : ni sonde, ni lumière de fenêtre, ni exposition automatique
    ambient.intensity = 0; ambient.visible = false; scene.environment = envSimple; scene.environmentIntensity = SIMPLE_ENV_K;
    for (const l of portals) { l.intensity = 0; l.visible = false; }
    scene.backgroundBlurriness = S.mode === 'orbit' ? 0.35 : 0; scene.backgroundIntensity = 1;
    autoExp.k = autoExp.target = 1; autoExp.snap = false; renderer.toneMappingExposure = 1; renderer.toneMapping = SIMPLE_TM;
    return;
  }
  ambient.visible = true; renderer.toneMapping = THREE.AgXToneMapping;
  if (!updateAmbient()) { scene.environment = skyTex; scene.environmentIntensity = pt.active ? 1.0 : 0.85 * (0.08 + 0.92 * d); autoExp.target = walkMode ? autoExp.target : 1; }
  for (const l of portals) { l.intensity = (walkMode || pt.active || (MULTI && l.userData.lv !== S.level)) ? 0 : (l.userData.i ?? 0); if (!SHOOT) l.visible = !walkMode && !pt.active; else if (!pt.active) l.visible = true; }
  scene.backgroundBlurriness = S.mode === 'orbit' ? 0.35 : 0; scene.backgroundIntensity = 1;
  renderer.toneMappingExposure = S.exposure * (walkMode ? autoExp.k : 1.0);
  setBloomThr();
}
function setBloomThr() { const t = 1.15 / Math.max(0.2, renderer.toneMappingExposure); if (bloom) bloom.threshold = t; if (bloomM) bloomM.threshold = t; }

/* ---------- Post-traitement ---------- */
/* chaînes de rendu préallouées : pleine qualité (à l'arrêt, photos) et mouvement (cibles plus petites, allégée par paliers ; une chaîne
   par pixel ratio et MSAA, gardée une fois construite). Le canevas garde sa taille : la dernière passe de la chaîne de mouvement agrandit
   son image. Aucune réallocation à la bascule entre l'arrêt et le mouvement, ni entre deux paliers déjà vus */
let composer, gtao, bloom, photoPass, composerM = null, bloomM = null; // chaîne de mouvement du palier courant
const chainsM = new Map();
function makeChain(aoSamples) { // aoSamples = 0 : sans occlusion ambiante (chaînes de mouvement)
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const C = new EffectComposer(renderer, rt);
  C.addPass(new RenderPass(scene, camera));
  let ao = null;
  if (aoSamples) {
    ao = new GTAOPass(scene, camera, 1, 1); ao.output = GTAOPass.OUTPUT.Default; ao.blendIntensity = 1.0;
    ao.updateGtaoMaterial({ radius: 0.8, distanceExponent: 2.0, thickness: 1.0, scale: 1.3, samples: aoSamples, distanceFallOff: 1, screenSpaceRadius: false });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: aoSamples });
    C.addPass(ao);
  }
  const bl = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.18, 0.5, 1.0); C.addPass(bl);
  C.addPass(new OutputPass());
  const ph = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: 0.22 }, grain: { value: 0.018 }, seed: { value: 0 }, contrast: { value: 0.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain, seed, contrast; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; col = mix(col, col * col * (3.0 - 2.0 * col), contrast);
        vec2 d = vUv - 0.5; col *= 1.0 - vig * smoothstep(0.25, 0.85, dot(d, d) * 2.2); col += (h(vUv * 1000.0) - 0.5) * grain; gl_FragColor = vec4(col, c.a); }`,
  });
  C.addPass(ph);
  return { C, ao, bl, ph };
}
function setupComposer() {
  ({ C: composer, ao: gtao, bl: bloom, ph: photoPass } = makeChain(16));
  chainRendu(); // rendu simple : ni occlusion ambiante, ni bloom, ni vignettage ni grain
}
function chainRendu() {
  const u = !simple(); gtao.enabled = S.ao && u; bloom.enabled = u; photoPass.enabled = u;
  for (const c of chainsM.values()) c.ph.enabled = u;
}

/* ---------- Qualité adaptative en mouvement (hors mode photo) ----------
   Paliers de la chaîne de mouvement, du plus fin au plus léger : [pixel ratio (jamais au-dessus de celui de l'arrêt), MSAA, bloom].
   Pas d'occlusion ambiante en mouvement : à basse résolution et peu d'échantillons, elle fait un grain sombre aux angles et dans les
   renfoncements. Un régulateur sur la médiane des 8 derniers intervalles entre deux images de mouvement (et les images manquées des
   30 dernières) vise la cadence de l'écran
   (60 i/s ; 30 i/s si l'écran ou le mode économie d'énergie n'en donne pas plus : on ne dégrade pas l'image pour rien) : il descend
   au-dessus de 1,07 fois la cible ou à 3 images manquées sur 30 (de deux paliers au-delà de 1,8 fois), remonte sous 0,72 fois, ou essaie le palier du dessus après
   1,5 s de mouvement fluide (délai doublé à chaque essai manqué). Les 3 premières images d'un mouvement ne comptent pas. Le palier
   trouvé est gardé d'une visite à l'autre sur cet appareil. Une seule image à la fois au GPU (barrière) : pas de file d'images, donc
   pas de retard du regard sur la main ; une image qui ne suit pas se voit dans l'intervalle, et le régulateur descend.
   À l'arrêt, 180 ms après le dernier mouvement : image pleine qualité, identique à celle d'avant. */
const AQ_STEPS = [[1.25, 4, 1], [1, 4, 1], [1, 0, 1], [1, 0, 0], [0.75, 0, 0], [0.6, 0, 0]];
// anisotropie des matières en mouvement, par palier (à l'arrêt : le maximum de l'appareil, comme avant)
const AQ_ANISO = [8, 4, 4, 2, 2, 1];
const AQ_HOLD = 180, AQ_KEY = 'visite.qualite-mouvement.2';
// vs : intervalle d'affichage de l'écran (médiane des intervalles entre deux tours de boucle sans rendu), lastLow : dernière image de mouvement
const aq = { lvl: 0, last: -1e9, low: false, ft: [], miss: [], skip: 0, stable: 0, upWait: 1500, probing: false, vs: 1000 / 60, idle: [], lastLow: 0, pace: true, depth: 2, fit: 0, fitNeed: 10, t1: 0, holds: [], held: 0 };
try { const v = parseInt(localStorage.getItem(AQ_KEY), 10); if (v >= 0 && v < AQ_STEPS.length) aq.lvl = v; else if (SOFTGL) aq.lvl = AQ_STEPS.length - 1; } catch (e) { if (SOFTGL) aq.lvl = AQ_STEPS.length - 1; }
// rendu logiciel (pas de carte graphique) sans palier gardé : le plus léger d'emblée (mesuré : 3 à 4 i/s au palier 0, et le régulateur
// n'a pas assez d'images pour descendre dans les premières secondes)
const aqMove = () => { aq.last = performance.now(); };
const aqTarget = () => Math.max(1000 / 60, aq.vs);
/* chaîne de mouvement du palier l, construite au besoin, à la taille du canevas et réglée pour ce palier */
function chainFor(l) {
  const [pr0, ms, bl] = AQ_STEPS[l], pr = Math.min(pr0, PR_FULL), key = pr + ':' + ms, w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  let c = chainsM.get(key);
  if (!c) { c = makeChain(0); c.C.renderTarget1.samples = c.C.renderTarget2.samples = ms; c.C.setPixelRatio(pr); chainsM.set(key, c); }
  if (c.w !== w || c.h !== h) { c.C.setSize(w, h); c.w = w; c.h = h; c.warm = false; }
  c.bl.enabled = bl > 0 && !simple(); c.ph.enabled = !simple();
  return c;
}
function aqApply() {
  if (SHOOT) return;
  ({ C: composerM, bl: bloomM } = chainFor(aq.lvl)); setBloomThr();
}
/* à l'arrêt, une image hors écran dans la chaîne d'un palier voisin encore jamais servie : ses cibles sont allouées tant que rien ne
   bouge, pas à la première image où le régulateur y passe */
function aqWarm() {
  for (const l of [aq.lvl + 1, aq.lvl - 1]) {
    if (l < 0 || l >= AQ_STEPS.length) continue;
    const c = chainFor(l); if (c.warm) continue;
    c.bl.enabled = true; c.C.renderToScreen = false; c.C.render(); c.C.renderToScreen = true; c.warm = true;
    chainFor(l); if (composerM) aqApply(); return true;
  }
  return false;
}
function aqChange(d) {
  aq.lvl = clamp(aq.lvl + d, 0, AQ_STEPS.length - 1); aq.ft.length = 0; aq.miss.length = 0; aq.skip = 2; aq.stable = 0; aqApply();
}
/* intervalle entre deux images de mouvement (images retenues par la barrière comprises) : décide des paliers */
function aqMeasure(ms) {
  if (aq.skip > 0) { aq.skip--; return; }
  const T = aqTarget(); aq.miss.push(ms > 1.5 * T ? 1 : 0); if (aq.miss.length > 30) aq.miss.shift();
  aq.ft.push(ms); if (aq.ft.length > 8) aq.ft.shift();
  if (aq.ft.length < 5) return;
  const m = aq.ft.slice().sort((a, b) => a - b)[aq.ft.length >> 1], last = AQ_STEPS.length - 1, nm = aq.miss.reduce((a, b) => a + b, 0);
  // trop lent : médiane au-dessus de la cible, ou 3 images manquées sur les 30 dernières (une image sur dix perdue se voit)
  if ((m > 1.07 * T || nm >= 3) && aq.lvl < last) { if (aq.probing) aq.upWait = Math.min(30000, aq.upWait * 2); aq.probing = false; aqChange(m > 1.8 * T ? 2 : 1); return; }
  if (m < 1.03 * T && !nm) aq.stable += ms; else aq.stable = 0;
  if (aq.probing && aq.stable > 1000) { aq.probing = false; aq.upWait = 1500; } // essai réussi
  if (aq.lvl > 0 && (m < 0.72 * T || aq.stable > aq.upWait)) { aq.probing = m >= 0.72 * T; aqChange(-1); }
}
/* cadence de l'écran : intervalle entre deux tours de boucle quand le précédent n'a rien rendu */
function aqIdle(ms) {
  if (ms < 4 || ms > 100) return; // onglet en arrière-plan, gel
  aq.idle.push(ms); if (aq.idle.length > 30) aq.idle.shift();
  if (aq.idle.length >= 8) { const s = aq.idle.slice().sort((a, b) => a - b); aq.vs = s[s.length >> 1]; }
}
/* à chaque tour de boucle : chaîne à utiliser (true : mouvement) */
function aqTick(now, motion) {
  if (SHOOT || !composerM) return false;
  if (motion) aq.last = now;
  const low = !pt.active && S.mode !== 'plan' && now - aq.last < AQ_HOLD;
  if (!low) {
    if (aq.low) { aq.low = false; invalidate(2); try { localStorage.setItem(AQ_KEY, String(aq.lvl)); } catch (e) {} }
    aq.lastLow = 0; return false;
  }
  if (!aq.low) { aq.low = true; aq.ft.length = 0; aq.miss.length = 0; aq.skip = 3; aq.lastLow = 0; aq.depth = 2; aq.fit = 0; } // chaque mouvement part à deux images d'avance au plus
  return true;
}
/* ---------- Culling par portails, en visite (hors mode photo) ----------
   À chaque image, depuis la cellule du visiteur : chaque portail est projeté à l'écran (rectangle coupé au plan proche, marge de 2 %),
   croisé avec le rectangle par lequel on voit sa cellule, et la cellule d'en face est vue dans ce rectangle, de proche en proche. Un
   objet est dessiné si l'une de ses cellules est vue et que sa boîte recoupe leur rectangle ; il est alors limité à ce rectangle
   (ciseaux : rien n'est rastérisé au-delà, gain surtout sur un GPU faible ou logiciel). Miroir vu : ce qu'il reflète est parcouru de
   la même façon depuis la caméra symétrique ; un objet vu seulement dans le miroir n'est pas rastérisé dans l'image principale.
   Lampe allumée si une vitre ou un miroir est vu, si ce que sa lumière atteint est vu (portée, lampReach), si une cellule au-delà de
   la portée de son ombre est vue, ou si sa pièce est vue ou voisine d'une pièce vue ; sinon intensité nulle (le shader saute son
   ombre, sans recompiler) et carte d'ombre gelée. Ciel non dessiné si dehors n'est pas vu. Tout est rétabli hors visite, en maquette,
   en rendu photo (et pendant sa préparation) et en mode photo */
const _vpm = new THREE.Matrix4(), FULL = [-1, -1, 1, 1], PMARGE = 0.02;
function projRect(pts) {
  const e = _vpm.elements, n = pts.length, cs = new Array(n); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) { const [x, y, z] = pts[i]; cs[i] = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[3] * x + e[7] * y + e[11] * z + e[15]]; }
  const W0 = 1e-3, put = (X, Y, w) => { X /= w; Y /= w; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; };
  for (let i = 0; i < n; i++) {
    const a = cs[i]; if (a[2] > W0) put(a[0], a[1], a[2]);
    for (let j = i + 1; j < n; j++) { const b = cs[j]; if ((a[2] > W0) !== (b[2] > W0)) { const t = (W0 - a[2]) / (b[2] - a[2]); put(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, W0); } }
  }
  if (x0 > 1 || y0 > 1 || x1 < -1 || y1 < -1 || x0 === Infinity) return null;
  return [Math.max(-1, x0), Math.max(-1, y0), Math.min(1, x1), Math.min(1, y1)];
}
const rInter = (a, b) => { const r = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]; return r[0] <= r[2] && r[1] <= r[3] ? r : null; };
const rUnion = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const rIn = (a, b) => b[0] >= a[0] && b[1] >= a[1] && b[2] <= a[2] && b[3] <= a[3]; // b dans a
const boxPts = b => { const o = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) o.push([x, y, z]); return o; };
/* porte ouverte (ou qui s'ouvre) : elle laisse passer la lumière d'une lampe */
function portalOpen(p) { if (!p.op) return true; const op = p.opRef || (p.opRef = operables.find(o => o.id === p.op)); return !op || op.t > 0.002 || op.target > 0.5; }
/* objets à cacher : maillages découpés par pièce, équipements, baies, lampes, volets, contexte */
function cullRegister() {
  // inventaire refait en visite (volets changés) : objets cachés rendus d'abord, sinon un objet gardé resterait caché pour toujours
  for (const I of CUL.items) { I.sc = null; if (I.hid) { I.hid = false; I.obj.visible = true; } }
  CUL.items = []; CUL.dirty = false; scene.updateMatrixWorld(true);
  const reg = (obj, cells) => {
    const b = new THREE.Box3().setFromObject(obj); if (b.isEmpty()) return;
    b.expandByScalar(0.02 + (obj.userData.pad || 0)); const it = { obj, cells: [...new Set(cells)], corners: boxPts(b), sc: null, hid: false };
    // ciseaux : le maillage suit toujours son objet du dernier inventaire (sinon rectangle périmé)
    obj.traverse(m => { if (!m.isMesh) return; if (m.onBeforeRender === THREE.Object3D.prototype.onBeforeRender) { m.onBeforeRender = scissorOn; m.onAfterRender = scissorOff; } if (m.onBeforeRender === scissorOn) m.userData.cul = it; });
    CUL.items.push(it);
  };
  CUL.decoupes = []; CUL.ombres = []; scene.traverse(m => { if (m.isMesh && m.userData.decoupe) { m.userData.cs = m.castShadow; CUL.decoupes.push(m); } if (m.isMesh && m.userData.ombre) CUL.ombres.push(m); });
  const visit = o => { if (o.isLight) return; if (o.userData.cells !== undefined) { if (o.userData.cells) reg(o, o.userData.cells); return; } for (const c of o.children) visit(c); };
  for (const k of ['arch', 'ceil', 'plinthes', 'fixed', 'lamps', 'doors', 'bso', 'ctx']) if (G[k]) visit(G[k]);
  const v = new THREE.Vector3();
  // cellules où l'on voit une vitre ou un miroir (verre sans ombre : toute lampe allumée l'éclaire)
  CUL.verre = new Uint8Array(CUL.cells.length);
  for (const I of CUL.items) { let g = false; I.obj.traverse(m => { if (m.isMesh && (m.material === M.glass || m.userData.glass)) g = true; }); if (g) for (const k of I.cells) CUL.verre[k] = 1; }
  for (const m of mirrors) for (const k of m.g.userData.cells || []) CUL.verre[k] = 1;
  // portée lointaine : cellules dont un objet dépasse la portée de l'ombre de la lampe (sa lumière y passe les murs sans ombre)
  CUL.lamps = lamps.map(l => { l.getWorldPosition(v); const c = cellsAt(v.x, v.y, v.z), R = l.shadow.camera.far - 0.5, loin = new Set();
    for (const I of CUL.items) if (I.corners.some(q => Math.hypot(q[0] - v.x, q[1] - v.y, q[2] - v.z) > R)) for (const k of I.cells) loin.add(k);
    return { light: l, cell: c.length ? c[0] : null, lit: lampReach(v), loin: [...loin] }; });
  CUL.mirrors = mirrors.map(m => { const b = new THREE.Box3().setFromObject(m.refl); return { m, cells: m.g.userData.cells || [], corners: boxPts(b) }; }).filter(M2 => M2.cells.length);
}
/* portée d'une lampe : cellules que sa lumière peut atteindre en ligne droite, depuis la lampe vers les 6 faces d'un cube (90° chacune).
   Parcours des portails chemin par chemin (le rectangle vu se resserre à chaque portail franchi, sans réunion entre chemins comme pour
   la caméra : sinon, par les fenêtres, dehors ramènerait la lumière dans toutes les pièces). Conservateur : un portail compte pour tout
   son rectangle (marge de 2 %), porte fermée comprise. Une lampe de l'étage qui éclaire l'escalier par la trémie, ou l'immeuble d'en face
   par sa fenêtre, reste ainsi allumée tant que ce qu'elle éclaire est vu. null : lampe dans la matière (toujours allumée) */
const _lampCam = new THREE.PerspectiveCamera(90, 1, 0.05, 200), CUBE6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function lampReach(v) {
  const start = new Set(); for (const [dx, dz] of [[0, 0], ...NEAR8]) for (const c of cellsAt(v.x + dx, v.y, v.z + dz)) start.add(c);
  if (!start.size) return null;
  const C = CUL.cells, lit = new Set(start), save = _vpm.clone(), on = new Uint8Array(C.length); let steps = 0, trop = false;
  const suit = (c, r) => {
    for (const pt of C[c].portals) {
      if (!pt.rect) continue; const n = pt.a === c ? pt.b : pt.a; if (on[n]) continue;
      const q = rInter(pt.rect, r); if (!q) continue;
      if (++steps > 200000) { trop = true; return; }
      lit.add(n); on[n] = 1; suit(n, q); on[n] = 0; if (trop) return;
    }
  };
  for (const d of CUBE6) {
    _lampCam.position.copy(v); _lampCam.up.set(0, d[1] ? 0 : 1, d[1] ? 1 : 0); _lampCam.lookAt(v.x + d[0], v.y + d[1], v.z + d[2]); _lampCam.updateMatrixWorld();
    _vpm.multiplyMatrices(_lampCam.projectionMatrix, _lampCam.matrixWorldInverse);
    for (const pt of CUL.portals) { const q = projRect(pt.corners); pt.rect = q && [q[0] - PMARGE, q[1] - PMARGE, q[2] + PMARGE, q[3] + PMARGE]; pt.f = -1; }
    for (const c of start) { on[c] = 1; suit(c, FULL); on[c] = 0; }
  }
  _vpm.copy(save); return trop ? null : [...lit]; // parcours trop long : lampe toujours allumée
}
const _sv = new THREE.Vector4();
function scissorOn(r, sc, cam) {
  const it = this.userData.cul; if (!CUL.on || cam !== camera || !it || !it.sc) return;
  const rt = r.getRenderTarget(); if (!rt) return;
  const W = rt.width, H = rt.height, s = it.sc, x = Math.max(0, Math.floor((s[0] + 1) / 2 * W) - 1), y = Math.max(0, Math.floor((s[1] + 1) / 2 * H) - 1);
  if (s === EMPTY) _sv.set(0, 0, 0, 0); else _sv.set(x, y, Math.max(0, Math.min(W, Math.ceil((s[2] + 1) / 2 * W) + 1) - x), Math.max(0, Math.min(H, Math.ceil((s[3] + 1) / 2 * H) + 1) - y));
  r.state.scissor(_sv); r.state.setScissorTest(true); this.userData.scOn = true;
}
function scissorOff(r) { if (!this.userData.scOn) return; this.userData.scOn = false; const rt = r.getRenderTarget(); if (rt) { r.state.scissor(rt.scissor); r.state.setScissorTest(rt.scissorTest); } else r.state.setScissorTest(false); }
// rendu photoréaliste en préparation (pt.busy) : toute la maquette, sinon la boucle, qui tourne encore pendant un mouvement, recacherait
// des murs avant que la scène parte au lanceur de rayons
const cullActive = () => (CUL.force ?? !SHOOT) && S.mode === 'walk' && !pt.active && !pt.busy && !S.cut;
/* parcours de proche en proche depuis les cellules start, vues dans le rectangle r0, avec la projection _vpm. Liste de travail : le
   rectangle d'une cellule ne fait que grandir (réunion), une cellule n'est reprise que si le sien a grandi ou si elle devient vue par des
   portails ouverts ; chaque portail est projeté une fois */
function cullTraverse(start, r0) {
  const C = CUL.cells, rects = new Array(C.length).fill(null), open = new Uint8Array(C.length), todo = [];
  for (const c of start) { rects[c] = r0; open[c] = 1; todo.push(c); }
  CUL.frame++; let it = 0;
  while (todo.length && it++ < 5000) {
    const c = todo.pop(), r = rects[c];
    for (const pt of C[c].portals) {
      if (pt.f !== CUL.frame) { pt.f = CUL.frame; const q = projRect(pt.corners); pt.rect = q && [q[0] - PMARGE, q[1] - PMARGE, q[2] + PMARGE, q[3] + PMARGE]; }
      if (!pt.rect) continue;
      const q = rInter(pt.rect, r); if (!q) continue;
      const n = pt.a === c ? pt.b : pt.a, op = open[c] && portalOpen(pt), cur = rects[n];
      if (cur && rIn(cur, q) && (open[n] || !op)) continue;
      rects[n] = cur ? rUnion(cur, q) : q; if (op) open[n] = 1;
      todo.push(n);
    }
  }
  return { rects, open };
}
const _mvp = new THREE.Matrix4(), _refl = new THREE.Matrix4(), _mn = new THREE.Vector3(), _mq = new THREE.Vector3(), EMPTY = [2, 2, 2, 2];
function cullUpdate() {
  if (CUL.dirty) cullRegister();
  CUL.on = true;
  camera.updateMatrixWorld(); _mvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _vpm.copy(_mvp);
  const C = CUL.cells, NC = C.length;
  // cellules du visiteur : l'air autour de l'œil et à mi-hauteur, 25 cm alentour (on passe une porte : les deux pièces)
  const p = camera.position, start = new Set();
  for (const [dx, dz] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]) for (const dy of [0, -0.8]) for (const c of cellsAt(p.x + dx, p.y + dy, p.z + dz)) start.add(c);
  if (!start.size) for (let c = 0; c < NC; c++) start.add(c); // œil dans la matière : tout
  const { rects, open } = cullTraverse([...start], FULL);
  // miroir vu : ce qu'il reflète est vu depuis la caméra symétrique, dans le rectangle du miroir (projection composée avec la symétrie)
  const vm = [];
  for (const M2 of CUL.mirrors) {
    _vpm.copy(_mvp); const q = projRect(M2.corners); if (!q) continue;
    let r0 = null; for (const c of M2.cells) if (rects[c]) { const x = rInter(q, rects[c]); if (x) r0 = r0 ? rUnion(r0, x) : x; }
    if (!r0) continue;
    M2.m.refl.updateMatrixWorld(); _mn.set(0, 0, 1).transformDirection(M2.m.refl.matrixWorld); M2.m.refl.getWorldPosition(_mq);
    const d = _mn.dot(_mq), n = _mn;
    _refl.set(1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 2 * d * n.x, -2 * n.y * n.x, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 2 * d * n.y, -2 * n.z * n.x, -2 * n.z * n.y, 1 - 2 * n.z * n.z, 2 * d * n.z, 0, 0, 0, 1);
    const vp = new THREE.Matrix4().multiplyMatrices(_mvp, _refl); _vpm.copy(vp);
    const t = cullTraverse(M2.cells, r0);
    for (let c = 0; c < NC; c++) if (t.open[c]) open[c] = 1;
    vm.push({ vp, rects: t.rects });
  }
  let nv = 0;
  for (const I of CUL.items) {
    let sc = null, vis = false, visM = false;
    for (const c of I.cells) { const r = rects[c]; if (r) sc = sc ? rUnion(sc, r) : r; }
    if (sc) { _vpm.copy(_mvp); const b = projRect(I.corners); vis = !!(b && rInter(b, sc)); }
    for (const m of vm) { if (visM) break; let rm = null; for (const c of I.cells) { const r = m.rects[c]; if (r) rm = rm ? rUnion(rm, r) : r; } if (rm) { _vpm.copy(m.vp); const b = projRect(I.corners); visM = !!(b && rInter(b, rm)); } }
    // vu seulement dans un miroir : rien à rastériser dans l'image principale (ciseaux vides)
    I.sc = !vis ? EMPTY : sc[0] <= -1 && sc[1] <= -1 && sc[2] >= 1 && sc[3] >= 1 ? null : sc;
    const v = vis || visM; if (v) nv++;
    if (v === I.hid) { I.hid = !v; I.obj.visible = v; }
  }
  _vpm.copy(_mvp);
  let nl = 0;
  const vu = new Uint8Array(NC); let verreVu = false; for (let c = 0; c < NC; c++) { vu[c] = rects[c] || open[c] || vm.some(m => m.rects[c]) ? 1 : 0; if (vu[c] && CUL.verre[c]) verreVu = true; }
  for (const L of CUL.lamps) {
    // lampe sans ombre (applique) : sa lumière traverse les murs, jamais éteinte. Sinon allumée si une vitre ou un miroir est vu, si
    // une cellule que sa lumière atteint est vue (portée, par les portails), si une cellule au-delà de la portée de son ombre est vue,
    // ou si sa pièce est vue ou voisine d'une pièce vue (porte fermée comprise : un peu de lumière passe au jambage)
    const c = L.cell; let need = c == null || !L.lit || !L.light.castShadow || !!vu[c] || verreVu;
    if (!need) for (const i of L.lit) if (vu[i]) { need = true; break; }
    if (!need) for (const i of L.loin) if (vu[i]) { need = true; break; }
    if (!need) for (const pt of C[c].portals) { const o = pt.a === c ? pt.b : pt.a; if (vu[o]) { need = true; break; } }
    const i = need ? (L.light.userData.i0 ?? L.light.intensity) : 0; if (L.light.intensity !== i) L.light.intensity = i; if (i > 0) nl++;
  }
  const bg = rects[DEHORS] || vm.some(m => m.rects[DEHORS]) ? skyTex : null; if (scene.background !== bg) scene.background = bg;
  CUL.stats = { cellules: rects.filter(Boolean).length, total: NC, miroirs: vm.length, dehors: !!bg, objets: nv, objetsTotal: CUL.items.length, lampes: nl, lampesTotal: CUL.lamps.filter(L => (L.light.userData.i0 ?? 0) > 0).length, ids: C.filter((c, i) => rects[i] || vm.some(m => m.rects[i])).map(c => c.id) };
  CUL.rects = rects;
}
function cullRestore() {
  if (!CUL.on) return; CUL.on = false;
  for (const I of CUL.items) { I.sc = null; if (I.hid) { I.hid = false; I.obj.visible = true; } }
  for (const L of CUL.lamps) if (L.light.userData.i0 != null) L.light.intensity = L.light.userData.i0;
  if (skyTex && scene.background !== skyTex) scene.background = skyTex;
}
function cullFrame() { if (cullActive()) cullUpdate(); else cullRestore(); }
/* ombres, hors mode photo : chaque lumière garde sa carte (autoUpdate coupé) ; markShadows() les marque toutes, et seules celles qui
   éclairent (soleil, lampes d'intensité non nulle) sont refaites, dans une passe à part où toute la maquette est visible (un mur caché
   par le culling arrête toujours la lumière). Une lampe éteinte reste marquée : sa carte est refaite quand elle se rallume */
const _voidCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 0.2), _tinyRT = new THREE.WebGLRenderTarget(1, 1);
_voidCam.position.set(0, -1e5, 0); _voidCam.lookAt(0, -2e5, 0); _voidCam.updateMatrixWorld(); _voidCam.layers.enable(2); // maillages d'ombre
function shadowPass() {
  if (SHOOT) return;
  if (shadowAll) { shadowAll = false; for (const l of lamps) l.userData.dirty = true; sun.userData.dirty = true; }
  let n = 0;
  for (const l of lamps) { const u = !!l.userData.dirty && l.castShadow && l.intensity > 0; l.shadow.needsUpdate = u; if (u) { l.userData.dirty = false; n++; } }
  const us = !!sun.userData.dirty && sun.castShadow; sun.shadow.needsUpdate = us; if (us) { sun.userData.dirty = false; n++; }
  if (!n) { renderer.shadowMap.needsUpdate = false; return; }
  // toute la maquette : les objets cachés par le culling projettent leur ombre ; les morceaux découpés cèdent la place à leur maillage entier
  if (CUL.dirty) cullRegister();
  const hid = CUL.items.filter(I => I.hid); for (const I of hid) I.obj.visible = true;
  for (const m of CUL.decoupes) m.castShadow = false; for (const m of CUL.ombres) m.visible = true;
  const rt = renderer.getRenderTarget(); renderer.shadowMap.needsUpdate = true; renderer.setRenderTarget(_tinyRT); renderer.render(scene, _voidCam); renderer.setRenderTarget(rt);
  for (const m of CUL.decoupes) m.castShadow = m.userData.cs; for (const m of CUL.ombres) m.visible = false;
  for (const I of hid) I.obj.visible = false;
  renderer.shadowMap.needsUpdate = false; CUL.shadowUpdates = (CUL.shadowUpdates || 0) + n;
}
function resize() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h;
  aqApply();
  // champ de vision vertical : 80° de champ horizontal sur un écran large, borné à [45°, 75°] (photos et contrôle : réglage d'avant)
  if (!walk.userFov) { walk.fov = SHOOT ? (camera.aspect >= 1 ? 58 : 72) : clamp(2 * Math.atan(Math.tan(40 * Math.PI / 180) / camera.aspect) * 180 / Math.PI, 45, 75); if (S.mode === 'walk') camera.fov = walk.zoom || walk.fov; }
  camera.updateProjectionMatrix(); if (pt.active) pt.tracer.updateCamera(); invalidate();
}

/* ---------- Navigation ---------- */
let frames = 3; const invalidate = (n = 2) => { frames = Math.max(frames, n); };
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true; orbit.dampingFactor = 0.08; orbit.rotateSpeed = App.coarse ? 0.55 : 0.9; orbit.zoomSpeed = App.coarse ? 0.7 : 1; orbit.panSpeed = App.coarse ? 0.6 : 1; orbit.maxPolarAngle = Math.PI * 0.47; orbit.minDistance = 2.5; orbit.maxDistance = 55;
orbit.target.set(CEN[0], 0.6, CEN[1]); orbit.listenToKeyEvents(canvas);
orbit.addEventListener('change', () => { invalidate(); aqMove(); if (pt.active) stopPT(); });
const s0 = D.stops[0] || { p: CEN, yaw: 0, pitch: 0, level: D.entry };
// visiteur : lv = niveau (celui dont le sol est le plus proche), y = sol sous les pieds (absolu), st = escalier emprunté
// zoom : champ de vision du pincement, temporaire (0 : champ par défaut)
const walk = { x: s0.p[0], z: s0.p[1], yaw: s0.yaw, pitch: s0.pitch || -0.06, glide: null, keys: new Set(), joy: { x: 0, y: 0 }, fov: 58, zoom: 0, stuck: 0, lv: s0.level ?? 0, y: 0, st: null };
walk.y = LV[walk.lv].y; walk._lv = walk.lv;
let savedOrbit = null;
function allColliders() {
  const list = staticColliders.concat(ctxColliders, fixedColliders, winColliders);
  if (S.bsoDrop >= 90) {} // les BSO sont à l'extérieur, hors de portée
  for (const op of operables) if (op.blocks !== false && op.t < 0.35 && op.target < 0.5) { const c = col(op.rect, op.y0, op.y1); c.op = op; list.push(c); }
  return list;
}
/* collisions d'un corps debout sur un sol à y : obstacles dont l'étendue verticale recoupe [y + 0,25, y + 1,85] */
function collide(x, z, r = 0.18, y = 0) {
  const list = allColliders(), b0 = y + 0.25, b1 = y + 1.85;
  for (let it = 0; it < 4; it++) for (const c of list) {
    if (c.y1 <= b0 || c.y0 >= b1) continue;
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
const nearRoomLv = (x, z, k) => !!roomAtLv(x, z, k) || NEAR.some(([a, b]) => roomAtLv(x + a, z + b, k));
const lvOfY = y => { let b = 0; for (let k = 1; k < NL; k++) if (Math.abs(LV[k].y - y) < Math.abs(LV[b].y - y)) b = k; return b; };
/* rampe d'un escalier : hauteur du sol sur la volée, interpolée le long de la ligne de foulée (null hors de l'emprise) */
function rampAt(s, x, z) {
  let acc = 0;
  for (let i = 1; i < s.line.length; i++) {
    const a = s.line[i - 1], b = s.line[i], e = VV.sub(b, a), l = VV.len(e); if (l < 1e-9) continue;
    const u = VV.mul(e, 1 / l), t = (x - a[0]) * u[0] + (z - a[1]) * u[1], d = -(x - a[0]) * u[1] + (z - a[1]) * u[0];
    if (Math.abs(d) <= s.width / 2 + 1e-6 && (t >= 0 || i === 1 && t >= -1e-6) && (t <= l || i === s.line.length - 1)) {
      const tt = acc + t; if (tt < -1e-6 || tt > s.len + 1e-6) return null;
      return LV[s.from].y + clamp(tt / s.len, 0, 1) * (LV[s.to].y - LV[s.from].y);
    }
    acc += l;
  }
  return null;
}
/* surfaces marchables en (x, z) : sol des pièces de chaque niveau, rampes des escaliers. Dans l'emprise d'une volée, la tolérance
   de 4 cm ne prolonge pas le sol du pied ni celui de l'arrivée : la rampe prend le relais dès la première contremarche (pas de ressaut) */
function surfacesAt(x, z) {
  const out = [], ramps = [];
  for (const s of STAIRS) { const y = rampAt(s, x, z); if (y != null) ramps.push({ y, lv: lvOfY(y), st: s }); }
  for (let k = 0; k < NL; k++) if (ramps.some(r => r.st.from === k || r.st.to === k) ? roomAtLv(x, z, k) : nearRoomLv(x, z, k)) out.push({ y: LV[k].y, lv: k, st: null });
  return out.concat(ramps);
}
function surfaceNear(x, z, y, tol = 0.25) { let best = null; for (const f of surfacesAt(x, z)) if (Math.abs(f.y - y) <= tol && (!best || Math.abs(f.y - y) < Math.abs(best.y - y))) best = f; return best; }
function floorAt(x, z, lv) {
  if (lv == null) { if (MULTI) App.levelMissing('floorAt'); lv = MULTI ? walk.lv : 0; }
  let ramp = null; for (const s of STAIRS) if (s.from === lv || s.to === lv) { const y = rampAt(s, x, z); if (y != null) { ramp = y; break; } }
  if (ramp == null ? nearRoomLv(x, z, lv) : roomAtLv(x, z, lv)) return LV[lv].y; // sur la volée : sol exact de la pièce seulement (comme surfacesAt)
  return ramp;
}
/* un pas de marche depuis un sol à y0 → [x, z, refus, lv, y, st]. Plan à un niveau : collisions, puis refus si l'on sort du logement.
   Plusieurs niveaux : à chaque pas de 5 cm, on reste sur la surface la plus proche à 0,25 m près ; aucune surface → pas refusé (jamais de chute). */
function move(x0, z0, mx, mz, y0) {
  const steps = Math.ceil(Math.hypot(mx, mz) / 0.05) || 1; let x = x0, z = z0;
  if (!MULTI) { for (let i = 0; i < steps; i++) [x, z] = collide(x + mx / steps, z + mz / steps); return nearRoom(x, z) ? [x, z, false, 0, 0, null] : [x0, z0, true, 0, 0, null]; }
  let y = y0, f = null;
  for (let i = 0; i < steps; i++) { [x, z] = collide(x + mx / steps, z + mz / steps, 0.18, y); f = surfaceNear(x, z, y); if (!f) return [x0, z0, true, lvOfY(y0), y0, null]; y = f.y; }
  return [x, z, false, lvOfY(y), y, f.st];
}
let lastMove = null;
function walkMove(x0, z0, mx, mz, lv, y) { // API : → [x, z, refus, lv, y]
  if (!MULTI) return move(x0, z0, mx, mz, 0).slice(0, 5);
  if (lv == null) { App.levelMissing('walkMove'); lv = walk.lv; if (y == null && x0 === walk.x && z0 === walk.z) y = walk.y; }
  if (y == null) y = lastMove && lastMove[0] === x0 && lastMove[1] === z0 && lastMove[3] === lv ? lastMove[4] : LV[lv].y; // suite d'un pas précédent : même sol
  return (lastMove = move(x0, z0, mx, mz, y)).slice(0, 5);
}
function collideAt(x, z, r = 0.18, lv, y) { // API
  if (!MULTI) return collide(x, z, r);
  if (lv == null && y == null) { App.levelMissing('collide'); y = walk.y; }
  return collide(x, z, r, y ?? LV[lv].y);
}
/* niveau posé de l'extérieur (photos, contrôle : walk.lv changé) → on part de son sol ; puis surface la plus proche */
function syncWalk() {
  if (walk.lv !== walk._lv) { walk.y = LV[walk.lv] ? LV[walk.lv].y : 0; walk.st = null; }
  const f = surfaceNear(walk.x, walk.z, walk.y, 0.6); if (f) { walk.y = f.y; walk.st = f.st; }
  walk.lv = walk._lv = lvOfY(walk.y);
}
function setWalkCamera() {
  if (MULTI) syncWalk();
  camera.position.set(walk.x, walk.y + EYE + (App.isExt(roomAtLv(walk.x, walk.z, walk.lv)) ? -0.04 : 0), walk.z);
  camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
  App.viewer.x = walk.x; App.viewer.z = walk.z; App.viewer.yaw = walk.yaw; App.viewer.lv = walk.lv; App.viewer.show = true;
  if (MULTI && S.mode === 'walk' && S.level !== walk.lv) App.set('level', walk.lv); // le niveau affiché suit le visiteur
  App.updateMarker();
  if (S.mode === 'walk') applyEnv();
  updateHud();
}
function placeAt(x, z, lv = MULTI ? walk.lv : 0, yaw = walk.yaw, pitch = walk.pitch) { // API : pose le visiteur au sol du niveau lv
  walk.anim = null; walk.glide = null; lookVel = null; resetZoom(); walk.x = x; walk.z = z; walk.lv = walk._lv = lv; walk.y = LV[lv].y; walk.st = null; walk.yaw = yaw; walk.pitch = pitch;
  setWalkCamera(); invalidate(4);
}
let lastRoom = null;
function updateHud() {
  let r = roomAtLv(walk.x, walk.z, walk.lv); if (r && r.of) r = D.rooms.find(q => q.id === r.of);
  const st = MULTI && !r ? walk.st : null;
  const el = document.getElementById('hudRoom'), inf = document.getElementById('hudInfo'), id = r ? r.id : st ? '~' + st.id : null;
  if (id === lastRoom) return; lastRoom = id; applyEnv(); invalidate(2); resetZoom();
  if (st) { el.textContent = st.label; inf.textContent = `${App.levelName(st.from)} · ${App.levelName(st.to)}`; document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-current', String(c.dataset.stop === st.id))); return; }
  if (MULTI && r && r.hidden && r.name) { el.textContent = r.name; inf.textContent = App.levelName(r.level); return; } // palier : son nom et le niveau
  if (!r || r.hidden) return;
  el.textContent = r.name;
  const lvTxt = MULTI && D.rooms.some(q => q !== r && !q.hidden && q.name === r.name) ? ` · ${App.levelName(r.level)}` : ''; // même nom sur deux niveaux
  inf.textContent = (r.area ? `${r.area} m²` + (r.ext ? ' · extérieur' : App.notePlafond(r, walk.lv) ? ` · ${App.notePlafond(r, walk.lv)}` : '') : (r.areaNote || '')) + lvTxt;
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-current', String(c.dataset.stop === r.id)));
}
/* champ de vision : le pincement zoome jusqu'au prochain arrêt ou changement de pièce */
function resetZoom() { if (!walk.zoom) return; walk.zoom = 0; if (S.mode === 'walk') { camera.fov = walk.fov; camera.updateProjectionMatrix(); invalidate(); } }
/* portes à la marche : le vantail s'ouvre avant qu'on l'atteigne (à 1,3 m, si l'on va vers le passage), et celui qui va vers le
   passage mais au point d'accrocher le tableau de l'épaule (un peu de biais ou un peu décalé) est redressé juste assez pour passer.
   Rien pour qui va vers le mur à côté de la baie, longe la baie ou est sur une volée : on n'est jamais aspiré. Correction latérale au
   plus la moitié du pas (27° d'écart, 0,7 m/s), à moins d'un mètre de la baie */
const funnelDoors = () => operables.filter(op => { const o = D.openings[op.id]; return o && op.id !== 'placard' && (o.kind === 'door' || (o.kind === 'french' && !(o.sill > 0))); }).map(op => {
  const o = D.openings[op.id]; let p0 = o.s[0], p1 = o.s[1];
  if (o.fx) { if (o.fx[1] >= o.s[1] - 0.01) p1 = o.fx[0] - 0.025; else p0 = o.fx[1] + 0.025; } // partie vitrée fixe : on passe à côté
  return { op, o, m: (p0 + p1) / 2, hw: (p1 - p0) / 2 };
});
let DOORS = null;
const BODY = 0.18; // rayon du visiteur (collide)
function doorAssist(mx, mz) {
  const L = Math.hypot(mx, mz); if (L < 1e-6 || (MULTI && walk.st)) return [mx, mz];
  const ux = mx / L, uz = mz / L; DOORS = DOORS || funnelDoors();
  for (const { op, o, m, hw } of DOORS) {
    if (MULTI && op.lv !== walk.lv) continue;
    const ax = walk.x - o.main.a[0], az = walk.z - o.main.a[1], lat = ax * o.u[0] + az * o.u[1] - m, dd = ax * o.T[0] + az * o.T[1];
    const ct = ux * o.T[0] + uz * o.T[1], cl = ux * o.u[0] + uz * o.u[1];
    if (Math.abs(ct) < 0.766) continue; // à plus de 40° de l'axe de la baie
    // distance (selon l'axe) jusqu'à la face d'entrée et jusqu'à la face de sortie de la baie ; écart latéral en y arrivant
    const d0 = ct > 0 ? -dd : dd - o.depth, d1 = d0 + o.depth; if (d1 < 0 || d0 > 1.0) continue; // baie derrière, ou à plus d'un mètre
    const at = d => lat + cl * Math.max(0, d) / Math.abs(ct), l0 = at(d0), l1 = at(d1), lm = Math.abs(l0) > Math.abs(l1) ? l0 : l1;
    const free = hw - BODY - 0.01;
    if (Math.abs(l0) > hw) continue; // on va vers le mur à côté de la baie : rien
    if (op.target < 0.5 && d0 < 1.3) { op.target = 1; op.fast = true; } // ouvert en 0,3 s
    if (Math.abs(lm) <= free || free <= 0) continue; // on passe sans rien toucher
    // correction : ramener l'écart au passage libre, au plus la moitié du pas
    const need = (Math.abs(lm) - free) * Math.sign(lm), k = -clamp(need, -0.5 * L, 0.5 * L);
    mx += o.u[0] * k; mz += o.u[1] * k;
  }
  return [mx, mz];
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
  if (fw || st) { const n = Math.hypot(fw, st); mx = (f[0] * fw + rt[0] * st) / Math.max(1, n) * speed * dt; mz = (f[1] * fw + rt[1] * st) / Math.max(1, n) * speed * dt; if (!SHOOT) [mx, mz] = doorAssist(mx, mz); }
  if (walk.glide) { const dx = walk.glide.x - walk.x, dz = walk.glide.z - walk.z, d = Math.hypot(dx, dz); if (d < 0.04) walk.glide = null; else { const v = Math.min(1.9, 0.6 + d * 1.6) * dt; mx = dx / d * Math.min(v, d); mz = dz / d * Math.min(v, d); } }
  if (mx || mz || turn) {
    const [x, z, , lv, y, st] = move(walk.x, walk.z, mx, mz, walk.y);
    const moved = Math.hypot(x - walk.x, z - walk.z);
    if (walk.glide && moved < 0.002) { walk.stuck += dt; if (walk.stuck > 0.25) walk.glide = null; } else walk.stuck = 0;
    walk.x = x; walk.z = z; if (MULTI) { walk.y = y; walk.lv = walk._lv = lv; walk.st = st; } setWalkCamera(); invalidate(); if (pt.active) stopPT();
  }
}
addEventListener('keydown', e => {
  if (e.code === 'Escape') { const st = document.getElementById('settings'); if (!st.hidden) { st.hidden = true; document.getElementById('btnSettings').setAttribute('aria-expanded', 'false'); document.body.classList.remove('set-open'); } }
  if (S.mode !== 'walk' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || document.getElementById('fiche').open) return;
  if (e.code === 'KeyE' || (e.code === 'Enter' && e.target === canvas)) {
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw); let best = null, bd = 1.8;
    for (const op of operables) { if (MULTI && op.lv !== walk.lv) continue; const c = GEO.centroid(op.rect), dx = c[0] - walk.x, dz = c[1] - walk.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / d > 0.5) { bd = d; best = op; } }
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
  camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); // caméra posée depuis la dernière image (contrôle) : sa matrice suit
  const roots = [G.arch, G.ceil, G.doors, G.fixed].filter(Boolean);
  const hits = ray.intersectObjects(roots, true).filter(h => h.object.isMesh && (!h.object.userData.glass || h.object.userData.op) && h.object !== cursor && isShown(h.object));
  return hits[0] || null;
}
const cursor = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.19, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
cursor.visible = false; cursor.renderOrder = 5; scene.add(cursor);
/* ---------- Clic et regard ----------
   Un geste égale une action : au-delà de 5 px (10 px au doigt), c'est un regard ; en deçà, un clic (appui de moins de 1,5 s).
   Regard saisi : le point pris sous le curseur y reste. Un geste lancé continue sur son élan (τ = 0,25 s). Clic droit : rien. */
const isPlacard = r => !!r && /placard/i.test(r.id); // « placard », « ch2-placard », « placard_entree »…
/* point d'arrivée pour un point touché qui n'est pas du sol : on revient vers le visiteur, à l'horizontale, jusqu'au premier point
   d'une pièce du niveau (hors placard) à 35 cm au moins de l'obstacle, puis au point libre le plus proche */
function backOff(px, pz, lv) {
  const dx = walk.x - px, dz = walk.z - pz, d = Math.hypot(dx, dz); if (d < 0.45) return null;
  for (let t = 0.35; t < d - 0.1; t += 0.1) {
    const x = px + dx / d * t, z = pz + dz / d * t, r = roomAtLv(x, z, lv); if (!r || isPlacard(r)) continue;
    const f = freeSpot(x, z, lv); if (!isPlacard(roomAtLv(f[0], f[1], lv))) return f;
  }
  return null;
}
/* destination d'un clic : le sol visé ; l'autre côté d'une porte ; le pied d'un mur, d'un équipement ou du plafond visé (sur le niveau
   de ce qu'on touche). null : fenêtre, porte palière, placard (on l'ouvre ou la ferme), ciel, épaisseur d'une dalle */
function clickTarget(h) {
  const op = h.object.userData.op, lv = walk.lv, Y0 = LV[lv].y;
  // sol visé : sa surface de marche (marche d'escalier : hauteur de la rampe, comme pour qui y marche) ; un sol hors des pièces et des
  // volées (seuil d'une porte palière) : au pied, dans la pièce la plus proche
  if (MULTI && h.object.userData.walk && h.face && h.face.normal.y > 0.5) {
    const f = surfaceNear(h.point.x, h.point.z, h.point.y, 0.12);
    if (!f || (!f.st && !roomAtLv(h.point.x, h.point.z, f.lv))) { const b = backOff(h.point.x, h.point.z, f ? f.lv : lvOfY(h.point.y)); return b && { x: b[0], z: b[1], lv: f ? f.lv : lvOfY(h.point.y), kind: 'pied' }; }
    if (!isPlacard(roomAtLv(h.point.x, h.point.z, f.lv))) return { x: h.point.x, z: h.point.z, y: f.y, lv: f.lv, kind: 'sol' };
  }
  if (op) {
    const o = D.openings[op.id];
    if (!o || op.id === 'placard' || !(o.kind === 'door' || (o.kind === 'french' && !(o.sill > 0))) || (MULTI && op.lv !== lv)) return null;
    const m = (o.s[0] + o.s[1]) / 2, dd = (walk.x - o.main.a[0]) * o.T[0] + (walk.z - o.main.a[1]) * o.T[1];
    const p = o.pt(m, dd < o.depth / 2 ? o.depth + 0.6 : -0.6), r = roomAtLv(p[0], p[1], lv); // 60 cm au-delà de la baie
    if (!r || isPlacard(r)) return null;
    const f = freeSpot(p[0], p[1], lv); return { x: f[0], z: f[1], lv, kind: 'porte' };
  }
  if (h.object.userData.walk && h.face && h.face.normal.y > 0.5) {
    const y = h.point.y, l2 = lvOfY(y);
    if (!isPlacard(roomAtLv(h.point.x, h.point.z, l2))) return { x: h.point.x, z: h.point.z, y, lv: l2, kind: 'sol' };
    const f = backOff(h.point.x, h.point.z, l2); return f && { x: f[0], z: f[1], lv: l2, kind: 'pied' };
  }
  // niveau de la surface touchée : celui du visiteur s'il la contient, sinon un autre (cage d'escalier vue d'en bas ou d'en haut :
  // on y monte, on y descend) ; dans l'épaisseur d'une dalle : rien
  const inLv = k => h.point.y >= LV[k].y - 0.05 && h.point.y <= LV[k].y + LV[k].H + 0.05;
  const lh = inLv(lv) ? lv : MULTI ? LV.findIndex((l, k) => inLv(k)) : -1; if (lh < 0) return null;
  const f = backOff(h.point.x, h.point.z, lh); return f && { x: f[0], z: f[1], lv: lh, kind: 'pied' };
}
const tgtOf = tg => (tg.y != null ? { y: tg.y } : { lv: tg.lv });
/* API (contrôle) : effet d'un clic en (cx, cy) sans le faire → { h, tg, P (itinéraire), bascule (ouvrant) } */
function clickPlan(cx, cy) {
  const h = pick({ clientX: cx, clientY: cy }); if (!h) return { h: null };
  const tg = clickTarget(h), P = tg ? planTo(tg.x, tg.z, tgtOf(tg)) : null;
  return { h, tg, P: P && P.length >= 2 ? P : null, bascule: !(P && P.length >= 2) && h.object.userData.op ? h.object.userData.op.id : null };
}
let drag = null, lookVel = null;
canvas.addEventListener('contextmenu', e => { if (S.mode === 'walk') e.preventDefault(); });
canvas.addEventListener('pointerdown', e => {
  if (S.mode === 'walk' && e.pointerType === 'mouse' && e.button !== 0) return; // clic droit ou milieu : rien
  canvas.focus({ preventScroll: true }); lookVel = null;
  if (drag && drag.id !== e.pointerId) { drag.multi = true; return; } // second doigt : ni clic ni regard
  if (walk.anim && S.mode === 'walk') walk.anim.pending = true; // le trajet continue : redirigé par un clic, freiné par un clic dans le vide
  drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId, yaw: walk.yaw, pitch: walk.pitch, hist: [], look: false, thr: e.pointerType === 'mouse' ? 5 : 10 };
  if (S.mode === 'walk') canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (drag && drag.id === e.pointerId) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (S.mode === 'walk' && !drag.multi && (drag.look || drag.moved > drag.thr)) {
      drag.look = true;
      const r = canvas.getBoundingClientRect(), f = (r.height / 2) / Math.tan(camera.fov * Math.PI / 360), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      walk.yaw = drag.yaw + Math.atan((e.clientX - cx) / f) - Math.atan((drag.x - cx) / f);
      walk.pitch = clamp(drag.pitch + Math.atan((e.clientY - cy) / f) - Math.atan((drag.y - cy) / f), -1.25, 1.25);
      const now = performance.now(); drag.hist.push([now, walk.yaw, walk.pitch]); while (drag.hist.length > 2 && now - drag.hist[0][0] > 100) drag.hist.shift();
      if (walk.anim) walk.anim.userLook = true; // le trajet continue, le regard est à l'utilisateur
      aqMove(); setWalkCamera(); invalidate(); hideHint(); if (pt.active) stopPT(); cursor.visible = false;
    }
    return;
  }
  if (S.mode === 'walk' && e.pointerType === 'mouse') { // anneau posé là où le clic mènera
    const was = cursor.visible, h = pick(e), tg = h ? clickTarget(h) : null;
    if (tg) { const p = cursor.position.set(tg.x, (tg.y ?? LV[tg.lv].y) + 0.004, tg.z); cursor.visible = true; canvas.style.cursor = 'pointer'; if (!was || p.distanceToSquared(cursor.userData.p || p) > 1e-6) aqMove(); cursor.userData.p = p.clone(); }
    else { cursor.visible = false; canvas.style.cursor = h && h.object.userData.op ? 'pointer' : 'grab'; }
    if (tg || was) invalidate();
  } else if (S.mode === 'orbit' && e.pointerType === 'mouse' && !e.buttons) { const h = pick(e); canvas.style.cursor = h && h.object.userData.op ? 'pointer' : 'grab'; }
});
let lastTap = 0;
canvas.addEventListener('pointercancel', e => { if (drag && drag.id === e.pointerId) drag = null; });
canvas.addEventListener('pointerup', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag, now = performance.now(); drag = null;
  if (S.mode === 'walk') {
    const pend = walk.anim && walk.anim.pending; if (walk.anim) walk.anim.pending = false;
    const brake = () => { if (pend && walk.anim) { walk.anim.brake = true; walk.anim.vb = walk.anim.v; walk.anim.redir = null; } };
    if (d.look) { // élan : vitesse des 100 dernières ms, si la main bougeait encore au lâcher
      const H = d.hist, a = H[0], b = H[H.length - 1];
      if (H.length > 1 && now - b[0] < 60) { const dt = Math.max(0.016, (b[0] - a[0]) / 1000); lookVel = { y: clamp((b[1] - a[1]) / dt, -6, 6), p: clamp((b[2] - a[2]) / dt, -3, 3) * 0.5 }; }
      return;
    }
    if (d.multi || now - d.t > 1500) return brake();
    const h = pick(e);
    if (h) {
      const tg = clickTarget(h);
      if (tg) { if (navTo(tg.x, tg.z, tgtOf(tg))) { hideHint(); return; } if (tg.kind === 'sol') { walk.glide = { x: tg.x, z: tg.z }; hideHint(); invalidate(); return; } }
      const op = h.object.userData.op;
      if (op) { op.target = op.target > 0.5 ? 0 : 1; if (pt.active) stopPT(); invalidate(); return; }
    }
    return brake();
  }
  if (!(d.moved < 6 && now - d.t < 500)) return;
  const h = pick(e); if (!h) return;
  const op = h.object.userData.op;
  if (op) { op.target = op.target > 0.5 ? 0 : 1; if (pt.active) stopPT(); invalidate(); return; }
  if (S.mode === 'orbit') { const lv = lvOfY(h.point.y); if (now - lastTap < 350 && h.object.userData.walk && roomAtLv(h.point.x, h.point.z, lv)) App.engine.enterWalkAt(h.point.x, h.point.z, undefined, lv); lastTap = now; }
});
canvas.addEventListener('pointerleave', () => { cursor.visible = false; invalidate(); });
/* molette : ni zoom ni déplacement (le défilement à deux doigts d'un pavé tactile ne change plus le champ de vision) ; pincement
   (ctrlKey) : zoom temporaire, jusqu'au prochain arrêt ou changement de pièce */
canvas.addEventListener('wheel', e => {
  if (S.mode !== 'walk') return; e.preventDefault(); if (!e.ctrlKey) return;
  walk.zoom = clamp((walk.zoom || walk.fov) + e.deltaY * 0.25, 30, walk.fov); if (walk.zoom >= walk.fov) walk.zoom = 0;
  camera.fov = walk.zoom || walk.fov; camera.updateProjectionMatrix(); aqMove(); invalidate(); if (pt.active) stopPT();
}, { passive: false });
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
  if (MULTI) { applyLevels(); updateLamps(); }
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
  const d0 = D.orbitDir || [0.35, 0.78, 0.62];
  let dir = new THREE.Vector3(...d0).normalize();
  orbit.target.set(CEN[0], LV[S.level].y + 0.3, CEN[1]);
  // niveau avec une trémie ou une volée : vue prise du côté d'où on la voit (la façade du premier plan cache une trémie qui la longe)
  const pts = MULTI ? orbitStairPts(S.level) : [];
  if (pts.length) {
    scene.updateMatrixWorld(true);
    const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }, objs = [G.arch, G.fixed, G.doors].filter(Boolean), rc = new THREE.Raycaster();
    const seen = cam => pts.filter(p => { const P = new THREE.Vector3(...p), d = P.clone().sub(cam), l = d.length(); rc.set(cam, d.normalize()); rc.far = l - 0.05;
      return !rc.intersectObjects(objs, true).some(h => h.object.isMesh && vis(h.object) && h.object.userData.key !== 'rail'); }).length;
    let best = -1;
    for (const e of [1, 2, 3]) for (const c of [[d0[0], d0[1] * e, d0[2]], [d0[0], d0[1] * e, -d0[2]], [-d0[0], d0[1] * e, d0[2]], [-d0[0], d0[1] * e, -d0[2]]]) { // plus plongeante en second choix
      const v = new THREE.Vector3(...c).normalize(), n = seen(orbit.target.clone().addScaledVector(v, dist)); if (n > best) { best = n; dir = v; }
    }
  }
  camera.position.copy(orbit.target).addScaledVector(dir, dist); orbit.update();
}
/* points à voir dans la maquette d'un niveau : fond de sa trémie (vide du niveau) et milieu de volée des escaliers qui en partent */
function orbitStairPts(k) {
  const out = [], grid = (poly, y) => { const b = GEO.bbox(poly); for (let i = 1; i < 4; i++) for (let j = 1; j < 4; j++) { const x = b[0] + (b[1] - b[0]) * i / 4, z = b[2] + (b[3] - b[2]) * j / 4; if (GEO.pointInPoly(x, z, poly)) out.push([x, y, z]); } };
  for (const v of D.voids || []) if (v.level === k) grid(v.poly, LV[k].y - 0.3);
  for (const s of STAIRS) if (s.from === k) for (let f = 0.2; f < 0.85; f += 0.15) for (const d of [-0.25, 0, 0.25]) { const p = App.stairPt(s, f * s.len, d * s.width); out.push([p[0], LV[k].y + f * (LV[s.to].y - LV[k].y) + 0.3, p[1]]); }
  return out;
}
/* le visiteur tient-il debout en (x, z) sur un sol à y : aucun obstacle à moins de r. (Le point fixe de collide() peut tromper : entre
   deux obstacles trop proches, les deux poussées se compensent et le point semble libre) */
function standable(x, z, y = 0, r = 0.18) {
  const b0 = y + 0.25, b1 = y + 1.85, hit = c => { if (c.y1 <= b0 || c.y0 >= b1 || x < c.bb[0] - r || x > c.bb[1] + r || z < c.bb[2] - r || z > c.bb[3] + r) return false; const q = closestOnPoly(c.p, x, z); return q.inside || q.d < r - 1e-4; };
  for (const L of [staticColliders, ctxColliders, fixedColliders, winColliders]) for (const c of L) if (hit(c)) return false; // mêmes obstacles que allColliders(), sans copie
  for (const op of operables) if (op.blocks !== false && op.t < 0.35 && op.target < 0.5 && hit(op.col || (op.col = col(op.rect, op.y0, op.y1)))) return false;
  return true;
}
/* point libre (où le visiteur tient debout, dans la même pièce) le plus proche de (x, z) : le point lui-même, sinon des cercles de 4 en
   4 cm (points espacés de 5 cm au plus) jusqu'au point repoussé hors des obstacles, puis au-delà */
function freeSpot(x, z, lv = 0, y = LV[lv].y) {
  const room = roomIdAt(x, z, lv), ok = (px, pz) => standable(px, pz, y) && roomIdAt(px, pz, lv) === room;
  if (ok(x, z)) return [x, z];
  const [px, pz] = collide(x, z, 0.185, y), pOk = ok(px, pz), dp = pOk ? Math.hypot(px - x, pz - z) : 1.6;
  for (let r = 0.04; r < dp - 0.02 && r <= 1.6; r += 0.04) { const n = Math.max(12, Math.ceil(2 * Math.PI * r / 0.05)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r; if (ok(qx, qz)) return [qx, qz]; } }
  return pOk ? [px, pz] : collide(x, z, 0.18, y);
}
function enterWalkAt(x, z, yaw, lv) {
  if (lv == null) { if (MULTI) App.levelMissing('enterWalkAt'); lv = MULTI ? S.level : 0; }
  if (pt.active) stopPT();
  const go = () => {
    const [cx, cz] = freeSpot(x, z, lv); walk.x = cx; walk.z = cz; walk.glide = null; walk.lv = walk._lv = lv; walk.y = LV[lv].y; walk.st = null;
    if (yaw != null) walk.yaw = yaw;
    else { const r = roomAtLv(cx, cz, lv), tgt = r ? GEO.centroid(r.poly) : CEN, dx = tgt[0] - cx, dz = tgt[1] - cz; if (Math.hypot(dx, dz) > 0.3) walk.yaw = Math.atan2(-dx, -dz); }
    walk.pitch = -0.06; lastRoom = null; autoExp.snap = true;
    if (S.mode !== 'walk') App.set('mode', 'walk'); else setWalkCamera();
  };
  if (S.mode === 'walk') { const [cx, cz] = freeSpot(x, z, lv); if (navTo(cx, cz, { lv }, yaw)) return; }
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
function findPath2(x0, z0, x1, z1) {
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
/* plusieurs niveaux : une grille par niveau et une par escalier (mêmes cases), reliées là où les sols se raccordent (0,25 m) */
function buildNavLayers() {
  const nx = NAVG.nx, nz = NAVG.nz, N = nx * nz, c = NAVG.c, r = NAVG.r, list = staticColliders.concat(ctxColliders, fixedColliders), Ls = [];
  for (let k = 0; k < NL; k++) Ls.push({ lv: k, st: null, grid: new Uint8Array(N), h: null });
  for (const s of STAIRS) Ls.push({ lv: null, st: s, grid: new Uint8Array(N), h: new Float32Array(N) });
  for (const Ly of Ls) {
    const g = Ly.grid;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = NAVG.x0 + (i + 0.5) * c, z = NAVG.z0 + (j + 0.5) * c, k = j * nx + i;
      if (Ly.st) { const y = rampAt(Ly.st, x, z); if (y == null) g[k] = 1; else Ly.h[k] = y; }
      else { const rr = roomAtLv(x, z, Ly.lv); if (rr ? /(^|-)placard$/.test(rr.id) : !nearRoomLv(x, z, Ly.lv)) g[k] = 1; }
    }
    for (const cc of list) {
      const i0 = Math.max(0, Math.floor((cc.bb[0] - r - NAVG.x0) / c)), i1 = Math.min(nx - 1, Math.floor((cc.bb[1] + r - NAVG.x0) / c));
      const j0 = Math.max(0, Math.floor((cc.bb[2] - r - NAVG.z0) / c)), j1 = Math.min(nz - 1, Math.floor((cc.bb[3] + r - NAVG.z0) / c));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const k = j * nx + i; if (g[k]) continue; const y = Ly.st ? Ly.h[k] : LV[Ly.lv].y; if (cc.y1 <= y + 0.25 || cc.y0 >= y + 1.85) continue;
        const q = closestOnPoly(cc.p, NAVG.x0 + (i + 0.5) * c, NAVG.z0 + (j + 0.5) * c); if (q.inside || q.d < r) g[k] = 1;
      }
    }
  }
  NAVG.layers = Ls; NAVG.dirty = false;
}
/* itinéraire d'un sol à un autre (y0 → y1) : A* sur (grille, case), lissage en ligne de vue dans chaque grille. Points [x, z, lv] ; P.ys = sol de chaque point */
function findPathY(x0, z0, y0, x1, z1, y1) {
  if (NAVG.dirty || !NAVG.layers) buildNavLayers();
  const Ls = NAVG.layers, NLy = Ls.length, nx = NAVG.nx, nz = NAVG.nz, N = nx * nz;
  const free = (l, i, j) => i >= 0 && j >= 0 && i < nx && j < nz && !Ls[l].grid[j * nx + i];
  const hOf = (l, k) => (Ls[l].st ? Ls[l].h[k] : LV[Ls[l].lv].y);
  const layerAt = (x, z, y) => { let best = null, bd = 1e9; Ls.forEach((Ly, l) => { const h = Ly.st ? rampAt(Ly.st, x, z) : nearRoomLv(x, z, Ly.lv) ? LV[Ly.lv].y : null; if (h != null && Math.abs(h - y) < bd) { bd = Math.abs(h - y); best = l; } }); return best ?? lvOfY(y); };
  const nearest = (l, i, j) => { if (free(l, i, j)) return [i, j]; for (let r = 1; r < 25; r++) { let best = null, bd = 1e9; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; if (free(l, i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } } } if (best) return best; } return null; };
  const l0 = layerAt(x0, z0, y0), l1 = layerAt(x1, z1, y1), s0 = nearest(l0, ...cellOf(x0, z0)), g0 = nearest(l1, ...cellOf(x1, z1)); if (!s0 || !g0) return null;
  const gs = new Float32Array(N * NLy).fill(Infinity), came = new Int32Array(N * NLy).fill(-1), closed = new Uint8Array(N * NLy);
  const start = l0 * N + s0[1] * nx + s0[0], goal = l1 * N + g0[1] * nx + g0[0];
  const h = key => { const k = key % N, di = Math.abs((k % nx) - g0[0]), dj = Math.abs(Math.floor(k / nx) - g0[1]); return Math.max(di, dj) + 0.414 * Math.min(di, dj); };
  const heap = [[h(start), start]]; gs[start] = 0;
  const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const relax = (key, nk, cost) => { const ng = gs[key] + cost; if (ng < gs[nk]) { gs[nk] = ng; came[nk] = key; push(ng + h(nk), nk); } };
  let found = false;
  while (heap.length) {
    const [, key] = pop(); if (closed[key]) continue; closed[key] = 1; if (key === goal) { found = true; break; }
    const l = Math.floor(key / N), k = key % N, ci = k % nx, cj = Math.floor(k / nx), hy = hOf(l, k);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = ci + di, nj = cj + dj, nk = nj * nx + ni;
      if ((di || dj) && free(l, ni, nj) && !(di && dj && (!free(l, ci + di, cj) || !free(l, ci, cj + dj)))) relax(key, l * N + nk, di && dj ? 1.414 : 1);
      for (let m = 0; m < NLy; m++) if (m !== l && (Ls[m].st || Ls[l].st) && free(m, ni, nj) && Math.abs(hOf(m, nk) - hy) <= 0.25) relax(key, m * N + nk, di && dj ? 1.414 : di || dj ? 1 : 0.5);
    }
  }
  if (!found) return null;
  const cells = []; for (let key = goal; key !== -1; key = came[key]) { const l = Math.floor(key / N), k = key % N; cells.unshift([NAVG.x0 + ((k % nx) + 0.5) * NAVG.c, NAVG.z0 + (Math.floor(k / nx) + 0.5) * NAVG.c, l]); }
  cells[0] = [x0, z0, cells[0][2]]; if (free(l1, ...cellOf(x1, z1))) cells[cells.length - 1] = [x1, z1, l1];
  const lineFreeL = (l, a, b) => { const [i0, j0] = cellOf(a[0], a[1]), [i1, j1] = cellOf(b[0], b[1]), n = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)) * 2 + 1; for (let q = 0; q <= n; q++) { const t = q / n, [i, j] = cellOf(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); if (!free(l, i, j)) return false; } return true; };
  const out = [cells[0]]; let a = 0;
  while (a < cells.length - 1) {
    let e = a; while (e + 1 < cells.length && cells[e + 1][2] === cells[a][2]) e++;
    if (e === a) { out.push(cells[a + 1]); a++; continue; } // changement de grille : on garde le point de raccord
    let b = e; while (b > a + 1 && !lineFreeL(cells[a][2], cells[a], cells[b])) b--; out.push(cells[b]); a = b;
  }
  const ys = out.map((p, i) => { const Ly = Ls[p[2]]; return i === 0 ? y0 : Ly.st ? rampAt(Ly.st, p[0], p[1]) ?? (i === out.length - 1 ? y1 : y0) : LV[Ly.lv].y; });
  const P = out.map((p, i) => [p[0], p[1], lvOfY(ys[i])]); P.ys = ys; return P;
}
/* API : findPath(x0, z0, lv0, x1, z1, lv1) → [[x, z, lv], …] ; plan à un niveau : findPath(x0, z0, x1, z1) comme avant */
function findPath(...a) {
  if (!MULTI) return a.length >= 6 ? findPath2(a[0], a[1], a[3], a[4]) : findPath2(a[0], a[1], a[2], a[3]);
  if (a.length < 6) { App.levelMissing('findPath'); return findPathY(a[0], a[1], walk.y, a[2], a[3], walk.y); }
  return findPathY(a[0], a[1], LV[a[2]].y, a[3], a[4], LV[a[5]].y);
}
function openDoorsOnPath(P) {
  const pts = [];
  for (let i = 1; i < P.length; i++) for (let t = 0; t <= 1; t += 0.05) pts.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t, P[i - 1][2] === P[i][2] ? P[i][2] ?? 0 : -1]);
  const segD = (p, a, b) => { const ex = b[0] - a[0], ez = b[1] - a[1], l2 = ex * ex + ez * ez || 1e-9, t = clamp(((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / l2, 0, 1); return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t); };
  for (const op of operables) {
    const o = D.openings[op.id];
    if (op.id === 'placard' || !o || o.sill > 0) continue;
    const mine = MULTI ? pts.filter(p => p[2] === op.lv) : pts; // seulement les portes du niveau traversé
    const traverse = mine.some(p => closestOnPoly(op.rect, p[0], p[1]).d < 0.12);
    if (traverse) { op.target = 1; continue; }
    if (o.kind !== 'door' && o.kind !== 'entry') continue;
    // porte que l'on longe : son vantail ouvert ne doit pas barrer le passage
    const lf = (App.doorLeaves(op.id) || [])[0];
    if (lf && mine.some(p => segD(p, lf.h, lf.op) < 0.3)) op.target = 0;
  }
}
/* itinéraire du visiteur jusqu'à (x, z) : fini exactement au point visé s'il est libre, sinon au point libre le plus proche.
   tgt : { lv } (sol d'un niveau) ou { y } (sol cliqué) ; plan à un niveau : ignoré */
function planTo(x, z, tgt) {
  const y1 = tgt && tgt.y != null ? tgt.y : LV[tgt && tgt.lv != null ? tgt.lv : walk.lv].y, l1 = lvOfY(y1), [fx, fz] = freeSpot(x, z, l1, y1);
  const P = MULTI ? findPathY(walk.x, walk.z, walk.y, fx, fz, y1) : findPath2(walk.x, walk.z, fx, fz); if (!P || P.length < 2) return null;
  // la grille (cases de 8 cm, marge de 20 cm) s'arrête au centre d'une case, parfois au-delà d'un obstacle quand le point est dans un
  // passage plus étroit qu'elle : dernier pas en ligne droite jusqu'au point, depuis le point le plus avancé du chemin d'où il est dégagé
  const e = P[P.length - 1]; if (Math.hypot(fx - e[0], fz - e[1]) < 0.005) return P;
  const clear = (ax, az) => { const n = Math.ceil(Math.hypot(fx - ax, fz - az) / 0.03); for (let i = 1; i <= n; i++) if (!standable(ax + (fx - ax) * i / n, az + (fz - az) * i / n, y1)) return false; return true; };
  for (let i = P.length - 1; i >= 1; i--) {
    const a = P[i - 1], b = P[i], ya = P.ys ? P.ys[i - 1] : y1, yb = P.ys ? P.ys[i] : y1; if (Math.abs(ya - y1) >= 0.25 && Math.abs(yb - y1) >= 0.25) break; // même sol (ou même volée)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / 0.1));
    for (let q = m; q >= 0; q--) {
      const qx = a[0] + (b[0] - a[0]) * q / m, qz = a[1] + (b[1] - a[1]) * q / m; if (Math.abs(ya + (yb - ya) * q / m - y1) >= 0.25 || Math.hypot(fx - qx, fz - qz) > 1.2 || !clear(qx, qz)) continue;
      P.length = i; if (P.ys) P.ys.length = i;
      if (q > 0) { P.push(MULTI ? [qx, qz, lvOfY(ya + (yb - ya) * q / m)] : [qx, qz]); if (P.ys) P.ys.push(ya + (yb - ya) * q / m); }
      P.push(MULTI ? [fx, fz, l1] : [fx, fz]); if (P.ys) P.ys.push(y1);
      return P;
    }
  }
  return P;
}
function navTo(x, z, tgt, yaw, pitch, onEnd) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  // les portes fermées ne bloquent pas l'itinéraire : elles s'ouvrent au passage
  const P = planTo(x, z, tgt); if (!P) return false;
  let len = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(len); }
  if (len < 0.05 && yaw == null) return true;
  // redirection d'un trajet en cours : on garde sa vitesse si la nouvelle direction s'écarte de moins de 60° de celle du moment ;
  // au-delà, on freine d'abord sur le trajet en cours (9 m/s², pas de volte-face instantanée), puis on repart d'où l'on est
  const cur = walk.anim;
  if (cur && !cur.brake && cur.v > 0.6 && !SHOOT) {
    const i = segAt(cur, cur.s), a0 = cur.P[i - 1], a1 = cur.P[i], j = P.findIndex((q, k) => k > 0 && Math.hypot(q[0] - P[0][0], q[1] - P[0][1]) > 0.02);
    if (j > 0) {
      const u = [a1[0] - a0[0], a1[1] - a0[1]], w = [P[j][0] - P[0][0], P[j][1] - P[0][1]], c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w) || 1);
      if (c < 0.5) { cur.redir = { x, z, tgt, yaw, pitch, onEnd }; cur.pending = false; invalidate(); return true; }
    }
  }
  openDoorsOnPath(P);
  const last = P[P.length - 1], prev = P[P.length - 2], endYaw = yaw ?? Math.atan2(-(last[0] - prev[0]), -(last[1] - prev[1]));
  // destination d'un clic à moins de 35° du regard : on y va sans tourner la tête
  const v = cur && !cur.brake ? cur.v : 0, dAng = Math.abs(angD(Math.atan2(-(last[0] - walk.x), -(last[1] - walk.z)) - walk.yaw));
  walk.anim = { P, ys: P.ys, cum, len, s: 0, v, t0: performance.now(), click: yaw == null, noTurn: yaw == null && dAng < 35 * Math.PI / 180, yaw1: endYaw, pitch1: pitch ?? Math.min(walk.pitch, -0.04), onEnd };
  walk.glide = null; lookVel = null; invalidate(); return true;
}
/* trajet animé, à vitesse indépendante du débit d'images : départ franc (1,35 m/s, la vitesse de marche, dès la première image), 2 m/s
   au plus (2,3 sur un trajet de plus de 5 m, 0,9 sur une volée, ralenti avant), freinage à 3,3 m/s² ; le regard suit le chemin vu 1,2 m devant, sans fouetté (115 °/s et
   55 °/s au plus), et s'aligne sur la vue d'arrêt à la fin du trajet, commencé assez tôt pour être fini à l'arrivée */
const TR = { vmax: 2.0, vStair: 0.9, v0: 1.35, acc: 4, dec: 3.33, yaw: 2.0, pitch: 0.96, align: 1.5, look: 1.2, redir: 9, brake: 0.22 };
const angD = d => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const segAt = (a, s) => { let i = 1; while (i < a.cum.length - 1 && a.cum[i] < s) i++; return i; };
const onStair = (a, i) => !!a.ys && Math.abs(a.ys[i] - a.ys[i - 1]) > 0.01;
function animKin(a, dt) {
  if (a.brake) a.v = Math.max(0, a.v - a.vb / TR.brake * dt);
  else if (a.redir) a.v = Math.max(0.6, a.v - TR.redir * dt); // freinage avant une redirection
  else {
    const i0 = segAt(a, a.s); let vmax = onStair(a, i0) ? TR.vStair : TR.vmax + clamp((a.len - 5) * 0.05, 0, 0.3); // long trajet : jusqu'à 2,3 m/s
    for (let j = i0 + 1; j < a.cum.length && a.cum[j - 1] - a.s < 1.5; j++) if (onStair(a, j)) vmax = Math.min(vmax, Math.sqrt(TR.vStair * TR.vStair + 2 * TR.dec * Math.max(0, a.cum[j - 1] - a.s)));
    a.v = a.v < TR.v0 ? Math.min(TR.v0, vmax) : a.v > vmax ? Math.max(vmax, a.v - TR.dec * dt) : Math.min(vmax, a.v + TR.acc * dt);
    a.v = Math.min(a.v, Math.max(0.3, Math.sqrt(2 * TR.dec * (a.len - a.s))));
  }
  a.s = Math.min(a.len, a.s + a.v * dt);
  const s = a.s, i = segAt(a, s), f = (s - a.cum[i - 1]) / Math.max(1e-6, a.cum[i] - a.cum[i - 1]), p0 = a.P[i - 1], p1 = a.P[i], rem = a.len - s, done = rem < 1e-3;
  walk.x = p0[0] + (p1[0] - p0[0]) * f; walk.z = p0[1] + (p1[1] - p0[1]) * f;
  if (MULTI && a.ys) { walk.y = a.ys[i - 1] + (a.ys[i] - a.ys[i - 1]) * f; walk.lv = walk._lv = lvOfY(walk.y); }
  if (a.userLook) return;
  const look = s + TR.look, j = segAt(a, look), q0 = a.P[j - 1], q1 = a.P[j], ff = Math.min(1, (look - a.cum[j - 1]) / Math.max(1e-6, a.cum[j] - a.cum[j - 1]));
  // alignement sur la vue d'arrêt : dans les 1,5 derniers mètres, plus tôt (jusqu'à 4 m) s'il reste beaucoup à tourner, pour qu'il soit
  // fini à l'arrivée (temps de rotation × vitesse du moment)
  const need = Math.abs(angD(a.yaw1 - walk.yaw)) / TR.yaw, final = !a.click && rem < Math.max(TR.align, Math.min(4, need * Math.max(1, a.v) * 1.15));
  const lx = q0[0] + (q1[0] - q0[0]) * ff - walk.x, lz = q0[1] + (q1[1] - q0[1]) * ff - walk.z;
  const ty = final ? a.yaw1 : !a.noTurn && !done && Math.hypot(lx, lz) > 0.05 ? Math.atan2(-lx, -lz) : null;
  // suivi amorti, borné ; pour finir, une vitesse minimale pour ne pas traîner sur les derniers degrés
  const turn = (d, vmax, vmin) => { let st = d * Math.min(1, 8 * dt); if (vmin) st = Math.sign(d) * Math.max(Math.abs(st), Math.min(Math.abs(d), vmin * dt)); return clamp(st, -vmax * dt, vmax * dt); };
  if (ty != null) walk.yaw += turn(angD(ty - walk.yaw), TR.yaw, final ? 1.0 : 0);
  let tp = a.pitch1;
  if (MULTI && a.ys && !done) { const yl = a.ys[j - 1] + (a.ys[j] - a.ys[j - 1]) * ff; tp += clamp(Math.atan2(yl - walk.y, 0.9) * 0.7, -0.15, 0.15); } // regard un peu levé en montée
  walk.pitch += turn(tp - walk.pitch, TR.pitch, done || final ? 0.5 : 0);
}
const animDone = a => (a.brake && a.v <= 0) || (a.len - a.s < 1e-3 && (a.click || a.userLook || (Math.abs(angD(a.yaw1 - walk.yaw)) < 0.004 && Math.abs(a.pitch1 - walk.pitch) < 0.004) || performance.now() - (a.tEnd ??= performance.now()) > 2500));
function stepAnim(dt) {
  const a = walk.anim; let t = Math.min(dt, 0.25);
  while (t > 1e-6 && !animDone(a)) {
    const h = Math.min(t, 0.05); animKin(a, h); t -= h; // pas de 50 ms au plus : même trajet à tout débit
    if (a.redir && (a.v <= 0.6 || a.len - a.s < 1e-3)) { // freiné : on repart vers la nouvelle destination, d'où l'on est
      const r = a.redir; a.redir = null;
      if (!navTo(r.x, r.z, r.tgt, r.yaw, r.pitch, r.onEnd)) { a.brake = true; a.vb = Math.max(a.v, 0.1); }
      if (walk.anim !== a) { setWalkCamera(); invalidate(); return; }
    }
  }
  if (animDone(a)) {
    if (!a.brake && !a.click && !a.userLook) { walk.yaw += angD(a.yaw1 - walk.yaw); walk.pitch = a.pitch1; } // vue d'arrêt exacte
    walk.anim = null; setWalkCamera(); invalidate(); if (!a.brake && a.onEnd) a.onEnd(); return;
  }
  setWalkCamera(); invalidate();
}
function openFor(s, instant) { // portes ouvertes pour l'arrêt, et fermées celles dont le vantail boucherait la vue
  for (const [ids, v] of [[s.open || [], 1], [s.close || [], 0]]) for (const id of ids) { const op = operables.find(o => o.id === id); if (op) { op.target = v; if (instant) { op.t = v; op.apply(v); } } }
}
function goStop(id) {
  const s = D.stops.find(q => q.id === id); if (!s) return;
  const lv = s.level ?? 0, y = LV[lv].y;
  if (S.mode === 'orbit') {
    if (MULTI && S.level !== lv) App.set('level', lv);
    const r = D.rooms.find(q => q.id === id), c = r ? GEO.centroid(r.poly) : [s.p[0] - Math.sin(s.yaw) * 1.5, s.p[1] - Math.cos(s.yaw) * 1.5];
    animOrbit(new THREE.Vector3(c[0], y + 0.4, c[1]), new THREE.Vector3(c[0] + 3.0, y + 7.5, c[1] + 5.5));
    document.querySelectorAll('.chip').forEach(ch => ch.setAttribute('aria-current', String(ch.dataset.stop === id))); return;
  }
  if (pt.active) stopPT();
  lookVel = null; resetZoom();
  if (S.mode === 'walk') { openFor(s); if (navTo(s.p[0], s.p[1], { lv }, s.yaw, s.pitch)) return; }
  const go = () => { walk.x = s.p[0]; walk.z = s.p[1]; walk.lv = walk._lv = lv; walk.y = y; walk.st = null; walk.yaw = s.yaw; walk.pitch = s.pitch ?? -0.06; walk.glide = null; lastRoom = null; openFor(s, true); autoExp.snap = true; if (S.mode !== 'walk') App.set('mode', 'walk'); else setWalkCamera(); };
  if (S.mode === 'walk') fadeTo(go); else go();
}
let orbitAnim = null;
function animOrbit(target, pos) { orbitAnim = { t0: performance.now(), dur: 900, ft: orbit.target.clone(), fp: camera.position.clone(), tt: target, tp: pos }; }

/* ---------- Rendu photoréaliste (lancer de rayons) ---------- */
const pt = { active: false, tracer: null, busy: false, max: 1500 };
const ptEl = document.getElementById('pt'), ptMsg = document.getElementById('ptMsg');
async function startPT() {
  if (pt.busy || pt.active) return;
  if (simple()) App.set('rendu', 'ultra'); // le rendu photoréaliste part de la scène complète (lampes, soleil)
  if (S.mode === 'plan') { App.set('mode', 'orbit'); await new Promise(r => setTimeout(r, 300)); }
  pt.busy = true; ptEl.hidden = false; ptMsg.textContent = 'Préparation du rendu…'; cullRestore();
  try {
    const mod = await import('three-gpu-pathtracer');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!pt.tracer) { pt.tracer = new mod.WebGLPathTracer(renderer); pt.tracer.tiles.set(2, 2); pt.tracer.bounces = 7; pt.tracer.transmissiveBounces = 6; pt.tracer.filterGlossyFactor = 0.4; pt.tracer.minSamples = 1; pt.tracer.renderDelay = 0; pt.tracer.fadeDuration = 250; pt.tracer.renderScale = App.coarse ? 0.6 : 1; }
    togglePTScene(true); cullRestore(); // scène entière, lampes comprises, au moment où elle part au lanceur de rayons
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

/* ---------- Bascule simple ↔ ultra réaliste ----------
   Tout ce que le rendu simple coupe est rétabli (et inversement) : soleil et ses ombres, lumière d'appoint, lampes, lumières de fenêtre,
   sondes, exposition automatique, occlusion ambiante, bloom, vignettage. Contrôlé par moteur/controle.mjs (image simple identique avant
   et après un passage en ultra réaliste, état des lumières et des passes dans chaque mode) */
function applyRendu() {
  if (pt.active) stopPT();
  chainRendu(); aqApply();
  updateSun(); // ciel, soleil, appoint, lampes, lumière d'ambiance
  if (!simple()) { probesNow(); autoExp.snap = true; }
  applyEnv(); markShadows(); pt.dirty = true; invalidate(4);
}
App.renduEtat = () => ({ rendu: S.rendu, ombreSoleil: sun.castShadow, appoint: fill.visible && fill.intensity > 0, lampes: lamps.filter(l => l.visible).length, lampesOmbre: lamps.filter(l => l.castShadow).length,
  palier: ctxLamps.filter(l => l.visible).length, fenetres: portals.filter(l => l.visible && l.intensity > 0).length, sonde: ambient.visible && ambient.intensity > 0, env: scene.environment === envSimple ? 'neutre' : scene.environment ? 'sonde-ou-ciel' : null,
  ao: !!gtao.enabled, bloom: !!bloom.enabled, vignettage: !!photoPass.enabled, exposition: +renderer.toneMappingExposure.toFixed(4), sondesEnAttente: probe.queue.length, sondes: Object.keys(probe.cache).length, portePaliere: M.entry_leaf ? M.entry_leaf.color.getHex() : null });

/* ---------- Réactions aux réglages ---------- */
App.on(k => {
  if (!App.engine) return;
  if (!['exposure', 'ao', 'underlay', 'dims', 'moment'].includes(k)) markShadows();
  if (['bsoDrop', 'cut'].includes(k)) { NAVG.dirty = true; scheduleNav(); }
  if (k === 'level') { // niveau affiché : visibilité, lampes, portails, coupe ; en maquette la vue suit la hauteur du niveau
    const dy = LV[S.level].y - lastLvY; lastLvY = LV[S.level].y;
    cutPlane.constant = LV[S.level].y + 1.205;
    if (S.cut) { buildArch(1.2); renderer.clippingPlanes = [cutPlane]; NAVG.dirty = true; }
    mirrorsForCut(); applyLevels(); updateLamps(); applyEnv();
    if (dy && S.mode === 'orbit') { orbitAnim = null; orbit.target.y += dy; camera.position.y += dy; orbit.update(); }
    if (dy && savedOrbit) { savedOrbit.p.y += dy; savedOrbit.t.y += dy; }
    if (pt.active) stopPT(); pt.dirty = true; invalidate(4);
  }
  if (['bsoDrop', 'bsoTilt', 'season', 'hour', 'lights', 'cut'].includes(k)) pt.dirty = true;
  if (['lights', 'bsoDrop', 'bsoTilt'].includes(k)) invalidateProbes();
  if (k === 'mode') { applyMode(); if (S.mode === 'walk') queueProbes(); }
  if (['season', 'hour', 'lights'].includes(k)) { if (pt.active) stopPT(); updateSun(); }
  if (k === 'bsoDrop' || k === 'bsoTilt') { if (pt.active) stopPT(); buildBSO(); updateSun(); }
  if (k === 'exposure') { applyEnv(); invalidate(); }
  if (k === 'ao') { chainRendu(); aqApply(); invalidate(); }
  if (k === 'rendu') applyRendu();
  if (k === 'cut') { if (pt.active) stopPT(); buildArch(S.cut ? 1.2 : null); cutPlane.constant = LV[S.level].y + 1.205; renderer.clippingPlanes = S.cut ? [cutPlane] : []; mirrorsForCut(); G.ceil.visible = S.mode !== 'orbit'; G.doors.visible = !S.cut; G.bso.visible = !S.cut; if (S.cut && S.mode === 'walk') App.set('mode', 'orbit'); invalidate(); }
});

let lastLvY = LV[S.level].y;
/* ---------- Boucle ---------- */
const clock = new THREE.Clock();
let shTick = 0;
/* élan du regard après un geste lancé : décroissance exponentielle (τ = 0,25 s), coupé par un appui, un arrêt ou une pose */
function stepLook(dt) {
  if (!lookVel) return;
  walk.yaw += lookVel.y * dt; walk.pitch = clamp(walk.pitch + lookVel.p * dt, -1.25, 1.25);
  const k = Math.exp(-dt / 0.25); lookVel.y *= k; lookVel.p *= k;
  if (Math.hypot(lookVel.y, lookVel.p) < 0.03) lookVel = null;
  setWalkCamera(); invalidate();
}
let lastT = null, rendered = false;
function loop(time) {
  // pas de temps : horloge des images (horodatage de requestAnimationFrame), le mouvement suit exactement la cadence de l'affichage,
  // sans à-coup quand un traitement retarde un tour de boucle (mode photo : réglage d'avant)
  const raw = SHOOT || time == null ? clock.getDelta() : Math.max(0, (time - (lastT ?? time)) / 1000), now = performance.now();
  if (!SHOOT && lastT != null && !rendered) aqIdle(time - lastT);
  lastT = time; rendered = false;
  // ouvrants : pas de 50 ms au plus ; marche, regard et trajets : 100 ms (move() avance par pas de 5 cm, les collisions restent sûres),
  // la vitesse ne baisse plus avec le débit d'images (mode photo : réglage d'avant)
  const dtOp = Math.min(0.05, raw), dt = SHOOT ? dtOp : Math.min(0.1, raw);
  if (S.mode === 'plan') return;
  let opMove = false, opEnd = false;
  for (const op of operables) if (Math.abs(op.t - op.target) > 1e-4) {
    op.t += Math.sign(op.target - op.t) * Math.min(Math.abs(op.target - op.t), (op.fast && !SHOOT ? 3.2 : op.speed) * dtOp); if (Math.abs(op.t - op.target) <= 1e-4) op.fast = false;
    const e = op.t < 0.5 ? 2 * op.t * op.t : 1 - Math.pow(-2 * op.t + 2, 2) / 2; op.apply(e); invalidate(); pt.dirty = true; if (pt.active) stopPT();
    if (SHOOT || Math.abs(op.t - op.target) <= 1e-4) opEnd = true; opMove = true;
  }
  if (S.mode === 'walk') {
    if (walk.anim && (walk.joy.x || walk.joy.y || [...walk.keys].some(k => !k.startsWith('Shift')))) walk.anim = null; // les touches reprennent la main
    if (walk.anim) stepAnim(dt); else stepWalk(dt);
    stepLook(dt);
  }
  if (S.mode === 'orbit') {
    if (orbitAnim) { const t = clamp((performance.now() - orbitAnim.t0) / orbitAnim.dur, 0, 1), e = 1 - Math.pow(1 - t, 3); orbit.target.lerpVectors(orbitAnim.ft, orbitAnim.tt, e); camera.position.lerpVectors(orbitAnim.fp, orbitAnim.tp, e); if (t >= 1) orbitAnim = null; invalidate(); }
    orbit.update();
  }
  if (pt.active) { const n = Math.floor(pt.tracer.samples); if (n < pt.max) pt.tracer.renderSample(); ptMsg.textContent = n < pt.max ? `Rendu photo · ${n} passes · reste immobile` : `Rendu photo terminé · ${n} passes`; return; }
  const motion = S.mode === 'walk' ? !!(walk.anim || walk.keys.size || walk.joy.x || walk.joy.y || walk.glide || lookVel || opMove) : !!(orbitAnim || opMove);
  // ombres d'un vantail qui tourne : à l'arrêt, une image sur quatre puis à la fin ; en mouvement, seulement à la fin (une mise à jour
  // des ombres coûte une image entière : à-coup visible)
  if (opEnd) markShadows(); else if (opMove && ++shTick % 4 === 0 && (SHOOT || !motion || now - aq.last > AQ_HOLD)) markShadows();
  if (SHOOT) { if (probe.queue.length && S.mode === 'walk') { captureProbe(probe.queue.shift()); applyEnv(); invalidate(2); } }
  // sondes reprises (heure, lumières, BSO) : seulement à l'arrêt, une par image, sans rendu principal cette image-là
  else if (probe.queue.length && !motion && now - aq.last > AQ_HOLD) { withWalkScene(() => captureProbe(probe.queue.shift())); applyEnv(); if (!probe.queue.length) invalidate(2); rendered = true; return; }
  if (autoExp.snap && S.mode === 'walk' && !probe.queue.length) { applyEnv(); autoExp.k = autoExp.target; autoExp.snap = false; applyEnv(); invalidate(2); }
  // exposition qui s'ajuste : en mouvement, rendue comme un mouvement ; à l'arrêt (arrivée d'un trajet), plus vite et en pleine
  // qualité, pour que l'image nette ne se fasse pas attendre (mode photo : réglage d'avant)
  const tk = S.mode === 'walk' && !simple() ? autoExp.target : 1; let easing = false;
  if (Math.abs(tk - autoExp.k) / tk > (SHOOT || motion ? 0.005 : 0.01)) { autoExp.k += (tk - autoExp.k) * Math.min(1, dt * (SHOOT || motion ? 3 : 6)); renderer.toneMappingExposure = S.exposure * (S.mode === 'walk' ? autoExp.k : 1); setBloomThr(); invalidate(); easing = SHOOT || motion; }
  else if (autoExp.k !== tk) { autoExp.k = tk; renderer.toneMappingExposure = S.exposure * (S.mode === 'walk' ? autoExp.k : 1); invalidate(); }
  const low = aqTick(now, motion || easing);
  if (!low && !frames && !SHOOT && now - aq.last > 1000 && aqWarm()) { rendered = true; return; } // palier voisin préparé à l'arrêt
  if (frames > 0) { rendered = true; if (SHOOT || !gpuBusy(low, now)) draw(low, time); } // sinon : image retenue par la barrière
}
function draw(low, time) {
  frames--; cullFrame(); shadowPass(); setAniso(low ? AQ_ANISO[aq.lvl] : maxAniso); (low ? composerM : composer).render(); gpuFence(performance.now());
  if (low) { if (aq.lastLow) aqMeasure(time - aq.lastLow); aq.lastLow = time; }
}
/* images à la fois au GPU (hors mode photo) : une seule quand c'est possible, la suivante attendant que la précédente soit finie. Sans
   file d'images, le regard ne traîne pas derrière la main (le navigateur en accepterait trois d'avance), et le premier mouvement après
   une image pleine qualité n'attend qu'elle. En mouvement, une de plus (trois au plus) quand le GPU ne suit pas (horloge du GPU qui
   remonte après un repos, glisser qui charge le compositeur : 2 images retenues en 300 ms), une de moins après 10 images où elle
   n'aurait pas servi (20, 40… jusqu'à 240 si l'essai précédent n'a pas tenu une seconde : pas d'images perdues à répétition). Chaque
   mouvement part à deux. Une image pleine qualité ne s'empile jamais. Une barrière qui ne répond pas (contexte perdu) est abandonnée
   après 250 ms */
const gpuSyncs = [];
function gpuBusy(low, now) {
  const gl = renderer.getContext();
  while (gpuSyncs.length && (gl.getSyncParameter(gpuSyncs[0].s, gl.SYNC_STATUS) === gl.SIGNALED || now - gpuSyncs[0].t > 250)) gl.deleteSync(gpuSyncs.shift().s);
  if (!aq.pace) return false;
  const n = gpuSyncs.length, depth = low ? aq.depth : 1;
  if (low) { if (n < depth - 1) { if (++aq.fit >= aq.fitNeed && aq.depth > 1) { aq.depth--; aq.fit = 0; aq.t1 = now; } } else aq.fit = 0; }
  if (n < depth) return false;
  aq.held++;
  if (low) {
    aq.holds = aq.holds.filter(t => now - t < 300); aq.holds.push(now);
    // une image de plus ; si la précédente réduction n'a pas tenu une seconde, on attendra deux fois plus longtemps avant la suivante
    if (aq.holds.length >= 2 && aq.depth < 3) { aq.depth++; aq.holds.length = 0; aq.fitNeed = now - aq.t1 < 1000 ? Math.min(240, aq.fitNeed * 2) : 10; }
  }
  return true;
}
function gpuFence(now) { const gl = renderer.getContext(); if (SHOOT || !gl.fenceSync) return; gpuSyncs.push({ s: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0), t: now }); while (gpuSyncs.length > 4) gl.deleteSync(gpuSyncs.shift().s); gl.flush(); }

/* avant la visite, derrière l'écran de chargement : grilles d'itinéraire, sondes de lumière, shaders (visite et maquette, lampes
   éteintes ou allumées) et passes des deux chaînes de rendu. Plus d'à-coup au premier clic, à l'entrée en visite, au premier tour
   ni au premier passage à l'étage */
async function prepareVisit() {
  if (MULTI) buildNavLayers(); else buildNavGrid();
  captureAllProbes();
  // compilés pour un rendu dans les cibles des chaînes (espace linéaire, sans mappage de tons), comme à l'image
  if (renderer.compileAsync) try {
    renderer.setRenderTarget(composer.renderTarget1);
    await withWalkScene(async () => { // lumière d'une sonde (pièce) ou du ciel (loggia), lampes éteintes ou allumées
      const sh = lamps.map(l => l.castShadow), env0 = scene.environment, pc = Object.values(probe.cache)[0];
      for (const env of simple() ? [envSimple] : [pc && pc.env.texture, skyTex]) for (const on of simple() ? [false] : [false, true]) {
        scene.environment = env || skyTex; portals.forEach(l => { l.visible = false; }); lamps.forEach((l, i) => { l.castShadow = on ? !l.userData.ext : sh[i]; }); await renderer.compileAsync(scene, camera);
      }
      scene.environment = env0; renderer.setRenderTarget(null);
      applyEnv(); composer.render(); // une image dans l'état de la visite : fond de ciel net, ombres des lampes
      // images depuis le premier arrêt (pleine qualité, puis mouvement dans quatre directions) : tout ce que l'on voit à l'entrée en
      // visite est déjà passé une fois dans les deux chaînes (sinon la première image du premier geste coûte deux à trois fois plus)
      const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov, k0 = s0.level ?? 0;
      aqApply(); camera.fov = walk.fov; camera.updateProjectionMatrix();
      for (let k = 0; k < 4; k++) { camera.position.set(s0.p[0], LV[k0].y + EYE, s0.p[1]); camera.rotation.set(s0.pitch || -0.06, s0.yaw + k * Math.PI / 2, 0, 'YXZ'); if (!k) composer.render(); composerM.render(); }
      camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf; camera.updateProjectionMatrix();
    });
    renderer.setRenderTarget(composer.renderTarget1);
    applyEnv(); await renderer.compileAsync(scene, camera);
  } catch (e) { console.warn(e); }
  renderer.setRenderTarget(null);
  updateLamps(); applyEnv();
  composer.render();
  // chaînes de mouvement du palier gardé et de ses voisins : construites et allouées ici, pas au premier pas
  aqApply(); composerM.render(); chainFor(aq.lvl).warm = true; while (aqWarm());
  aqApply();
  cullRegister(); // objets à cacher inventoriés ici, pas à la première image de visite
  invalidate(3);
}
/* grilles devenues fausses (BSO, coupe) : refaites dès que le navigateur est libre */
function scheduleNav() {
  if (SHOOT) return;
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => { if (NAVG.dirty) { if (MULTI) buildNavLayers(); else buildNavGrid(); } }, { timeout: 1500 });
}

/* ---------- Démarrage ---------- */
async function start() {
  App.loader('Génération des matières…', 0.08); await sleep();
  await buildTextures();
  App.loader('Construction du logement…', 0.82); await sleep();
  makeMaterials(); cursor.material = M.hover;
  cutPlane.constant = LV[S.level].y + 1.205;
  buildCells(); // pièces et portails (culling), avant la maquette qui s'y découpe
  buildArch(S.cut ? 1.2 : null); renderer.clippingPlanes = S.cut ? [cutPlane] : [];
  G.doors = new THREE.Group(); scene.add(G.doors); G.doorsLv = LV.map((l, k) => lvGroup(G.doors, k));
  for (const [id, o] of Object.entries(D.openings)) { if (o.kind === 'door' || o.kind === 'entry') buildDoor(id, G.doorsLv[o.level]); else if (o.kind === 'window' || o.kind === 'french') buildWindow(id, G.doorsLv[o.level]); }
  buildBSO(); buildFixed(); mirrorsForCut(); buildLamps(); buildContext(); buildPortals(); buildShadowRoof(); if (!SHOOT) reglagesVisite(true);
  setupComposer();
  App.loader('Lumière du jour…', 0.94); await sleep();
  updateSun(); resize(); defaultOrbitView();
  G.doors.visible = !S.cut;
  if (!SHOOT) { App.loader('Préparation de la visite…', 0.97); await sleep(); await prepareVisit(); }
  App.engine = { goStop, enterWalkAt: (x, z, yaw, lv) => enterWalkAt(x, z, yaw, lv) };
  App.curLevel = () => walk.lv; // repli d'un appel sans niveau : le niveau du visiteur
  applyMode();
  renderer.setAnimationLoop(loop);
  addEventListener('resize', resize); new ResizeObserver(resize).observe(canvas);
  App.loaded(); document.getElementById('err')?.remove();
  document.querySelectorAll('.modes button').forEach(b => { b.disabled = false; });
  window.__v = { scene, camera, renderer, walk, operables, S, startPT, stopPT, pt, M, G, invalidate, probe, captureProbe, THREE, autoExp, applyEnv, blendAt, setWalkCamera, findPath, openDoorsOnPath, defaultOrbitView, orbitStairPts, orbit, queueProbes,
    collide: collideAt, walkMove, levels: LV, stairs: STAIRS, voids: D.voids || [], floorAt, surfacesAt, levelOfY: lvOfY, placeAt, applyLevels, updateLamps, lamps, EYE,
    // navigation (contrôle et mesures) : destination d'un clic, effet d'un clic à l'écran, itinéraire, point libre, qualité en mouvement
    pick, clickTarget, clickPlan, planTo, freeSpot, standable, navTo, stepWalk, roomAtLv, MULTI, get lookVel() { return lookVel; }, get drag() { return drag; },
    aq, aqMeasure, aqTarget, AQ_STEPS, doorAssist, get composer() { return composer; }, get composerM() { return composerM; }, get frames() { return frames; },
    // culling par portails (contrôle de visibilité, mesures) : état, cellules vues, image pleine qualité ou d'un palier comme la boucle
    reglageSimple, cul: CUL, cullUpdate, cullRestore, cellsAt, markShadows, setAniso, reglagesVisite, TEXQ, SOFTGL, renderFull: () => { cullFrame(); shadowPass(); setAniso(maxAniso); composer.render(); },
    renderLow: l => { const c = chainFor(l); cullFrame(); shadowPass(); setAniso(AQ_ANISO[l]); c.C.render(); }, cullStats: () => CUL.stats && Object.assign({}, CUL.stats, { ids: undefined }) };
}
start().catch(e => { console.error(e); App.fail('Erreur : ' + (e && e.message ? e.message : e)); });
