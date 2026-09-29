/* Panoramas 360° sans IA : à chaque arrêt de la visite guidée, six vues du moteur (mode photo ?shoot=1) à hauteur d'œil du niveau
   de l'arrêt, une seule exposition pour tout le panorama, puis projection équirectangulaire (fondu de ±3,4° aux bords des faces : pas
   de couture). Plus une image du plan de chaque niveau (sans texte) et pano/visite.json : arrêts, niveaux, liens entre arrêts qui se
   voient (ligne de vue libre, porte ouverte, escalier pour changer de niveau), regard d'arrivée de chaque lien. Ni murs, ni pièces, ni
   plan.json : la visionneuse (moteur/pano.html, copiée en pano/index.html, et moteur/pano.js, copiée en pano/visionneuse.js) n'a
   besoin que du dossier pano/, sans rien d'autre (ni moteur, ni police tierce).
   Point de vue : dans la pièce de l'arrêt, le point le plus éloigné des murs, équipements et gaines (1,2 m suffit ; près de l'arrêt à
   dégagement presque égal : retour R1, l'arrêt de la visite est dans un angle pour la photo, deux murs à 50 cm remplissaient la moitié du
   tour), hors du débattement d'une porte (le vantail ouvert boucherait un quart du panorama), à 0,7 m au moins du vantail ouvert, et hors
   de la cuisine indicative (kitchenHint : elle n'est pas construite, mais elle occupera cet endroit).
   Portes : état de la visite guidée (ouvertes, sauf celles que l'arrêt ferme) ; jamais ouverte une porte qui ne relie pas deux pièces
   ayant un arrêt (placard, tableau, gaine) ; puis chaque porte est basculée si cela montre plus d'arrêts voisins. Derrière une porte
   fermée, le point de passage est au sol devant elle ; la porte palière reste fermée.
   Occlusion ambiante (ombre des angles, des marches ; sans elle, les contremarches se confondaient avec le mur et les pièces étaient
   plates) : chaque face est rendue sans puis avec, et le rapport des deux est appliqué au panorama, fondu d'une face à l'autre sur ±4°.
   Vérifié en tournant le cube de 45° (--rotation=45) : 1 à 2 sur 255 d'écart en plus près des arêtes, invisible.
   Regards (vue de départ de chaque arrêt, regard d'arrivée de chaque lien, tangage des petites pièces) : moteur/pano-regard.mjs, sur tout
   le champ de l'écran (profondeur, mur nu, fenêtres, équipements, obstacles proches).
   Contrôles écrits dans pano/controle.json (bloquants pour la publication) : voir la liste en fin de fichier, le contrôle des placards et du
   tableau électrique (avant les regards), moteur/pano-regard.mjs et moteur/pano-visionneuse.mjs.
   Usage : node moteur/pano.mjs plans/<id> [--standard] [--logiciel] [--arrets=a,b] [--sans-visionneuse] [--essai=<défaut>] [--regards=<fichier>]
     --regards=<fichier> : arrêts, liens et anneaux de profondeur écrits pour les essais des regards, sans rendu (et les contrôles déjà faits)
     --standard : 2048 × 1024 au plus (faces de 1 024 px) au lieu de 8192 × 4096 ; --logiciel : rendu SwiftShader (sans carte graphique)
     --essai=<défaut> : test négatif, le défaut est réintroduit et le contrôle correspondant doit le refuser :
       couture (une face surexposée de 15 %), arrivee (un lien arrive face à l'obstacle le plus proche), vantail (point de vue gardé dans le
       débattement, porte ouverte), confondus (cercles superposés gardés), disque (cercle posé sans tester son bord), traversee (cercle
       vu à travers la pièce d'un autre arrêt), porte-sans-arret (porte d'un placard ouverte), exposition (borne basse d'exposition à 0,5),
       sans-occlusion (panoramas sans occlusion ambiante : contremarches et angles), noms (nom en capitales), separateur (« Séjour Cuisine »)
   Une ligne « PANO {json} » par panorama terminé (progression du serveur). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { verifierVisionneuse } from './pano-visionneuse.mjs';
import * as RG from './pano-regard.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--')) || 'plans/432';
const opt = k => { const a = args.find(x => x === `--${k}` || x.startsWith(`--${k}=`)); return a == null ? null : a.includes('=') ? a.split('=')[1] : true; };
const STANDARD = !!opt('standard'), LOGICIEL = !!opt('logiciel'), ONLY = opt('arrets') ? String(opt('arrets')).split(',') : null;
const ESSAI = opt('essai-couture') ? 'couture' : (opt('essai') || null);
// largeurs des panoramas écrits (plus un aperçu de 512 px) ; 8192 : 22,8 px par degré, la définition des faces (CORE 2048 pour 90°) ;
// la visionneuse ne le charge que sur ordinateur quand l'écran le demande (rétine), le 4096 et le 2048 sinon
const TAILLES = STANDARD ? [2048] : [8192, 4096, 2048];
const CORE = STANDARD ? 1024 : 2048;                          // pixels d'une face sur ses 90°
const MARGE = 50;                                              // demi-champ rendu : 5° de marge autour des 90° (fondu, effets d'écran)
const FACE = Math.round(CORE * Math.tan(MARGE * Math.PI / 180));
// écart moyen de luminance (sur 255) d'une même direction vue par deux faces voisines, avant fondu : 1,4 au plus mesuré sur les 5 plans
// en 4096 (2,1 en 2048, crénelage plus marqué) ; une face exposée 15 % plus fort donne 6,6 (essai négatif : --essai=couture)
const SEUIL_COUTURE = 3;
// occlusion ambiante : écart moyen (sur 255) du rapport « avec / sans » entre deux faces voisines, avant fondu : 7 à 28 mesuré (D201).
// Vérifié en tournant le cube de 45° (--rotation=45) : l'image finale ne s'écarte de la version tournée que de 1 à 2 sur 255 de plus
// près des bords des faces que loin d'eux (fondu sur ±4°), invisible. Au-delà du seuil, l'occlusion d'une face est fausse
const SEUIL_COUTURE_AO = 40;
// regards (vue de départ, arrivée, tangage) : moteur/pano-regard.mjs
const ARRETS_MIN = 1.2;                   // deux arrêts d'un même niveau jamais plus près (panoramas presque identiques)
const VANTAIL_MIN = 0.7;                  // œil à 0,7 m au moins d'un vantail ouvert (à 0,6 m, un vantail de 83 cm masque 70° de la vue)
const R_CERCLE = 0.3, R_CERCLE_ESC = 0.22;
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { const req = createRequire(path.join(execSync('npm root -g').toString().trim(), 'noop.js')); puppeteer = (await import(req.resolve('puppeteer'))).default; }

// serveur statique minimal sur la racine du dépôt ; le 360° est servi comme en ligne : politique de contenu stricte (rien hors de son dossier)
const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((q, r) => {
  let p; try { p = decodeURIComponent(new URL(q.url, 'http://x').pathname); } catch { r.writeHead(400); r.end(); return; }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); r.end(); return; }
  const h = { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' };
  if (p.includes('/pano/')) Object.assign(h, { 'content-security-policy': CSP, 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' });
  r.writeHead(200, h); fs.createReadStream(f).pipe(r);
}).listen(0);
const port = server.address().port;

const plan = JSON.parse(fs.readFileSync(path.join(root, dir, 'plan.json'), 'utf8'));
const outDir = path.join(root, dir, 'pano'); fs.mkdirSync(outDir, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now(), mesures = { rendu: LOGICIEL ? 'logiciel' : 'gpu', face: FACE, tailles: TAILLES, panoramas: [], essai: ESSAI };
const problemes = [];
const pb = t => { problemes.push(t); console.log('[contrôle]', t); };
const r3 = v => Math.round(v * 1000) / 1000;
const DEG = Math.PI / 180;
const angD = a => Math.atan2(Math.sin(a), Math.cos(a));

const flags = LOGICIEL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await puppeteer.launch({ headless: 'new', args: flags, protocolTimeout: 3600000 });
const page = await browser.newPage(); await page.setViewport({ width: FACE, height: FACE, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('[erreur page]', e.message));
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`http://localhost:${port}/${dir}/?shoot=1`);
await page.waitForFunction(() => window.App && window.App.engine, { timeout: 600000 });
await page.addStyleTag({ content: '.ui, #gallery, #lightbox, #pt { display:none !important }' });
mesures.chargement_s = +((Date.now() - T0) / 1000).toFixed(1);

/* ---------- réglages de rendu : ceux des photos (lumières du premier moment), sans vignettage ni grain ; l'occlusion ambiante est
   allumée face par face (voir plus bas) ---------- */
const m0 = (plan.moments || [{ season: 'automne', hour: 14.5 }])[0];
await page.evaluate((m, simple) => {
  App.set('ao', false); App.set('season', m.season); App.set('hour', m.hour);
  App.set('lights', simple ? 'on' : (m.hour > 19 || m.hour < 7 ? 'auto' : 'off'));
  if (App.state.mode !== 'walk') App.set('mode', 'walk');
  const ph = __v.composer.passes[__v.composer.passes.length - 1]; if (ph.uniforms && ph.uniforms.vig) { ph.uniforms.vig.value = 0; ph.uniforms.grain.value = 0; }
}, m0, !!plan.simple);
const setPR = pr => page.evaluate(pr => { __v.renderer.setPixelRatio(pr); __v.composer.setPixelRatio(pr); dispatchEvent(new Event('resize')); __v.invalidate(3); }, pr);
const setAO = on => page.evaluate(on => { if (App.state.ao !== on) App.set('ao', on); }, on);

/* ---------- conversion dans la page : faces (tableau de textures) → équirectangulaire, et mesure des coutures ---------- */
await page.evaluate((FACE, MARGE) => {
  const cv = document.createElement('canvas'), gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
  const tanM = Math.tan(MARGE * Math.PI / 180);
  const VS = `#version 300 es
    in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const COMMUN = `#version 300 es
    precision highp float; precision highp sampler2DArray;
    uniform sampler2DArray faces, occl; uniform vec3 R[6], U[6], F[6]; uniform float tanM;
    out vec4 o;
    // couleur d'une direction : faces qui la voient, pondérées par leur distance au bord des 90° (fondu de ±6 %, soit ±3,4°, autour du bord)
    vec3 couleur(vec3 d){
      vec3 acc = vec3(0.0); float ws = 0.0;
      for (int i = 0; i < 6; i++) {
        float z = dot(d, F[i]); if (z <= 1e-4) continue;
        float x = dot(d, R[i]) / z, y = dot(d, U[i]) / z, a = max(abs(x), abs(y));
        float w = 1.0 - smoothstep(0.94, 1.06, a); if (w <= 0.0) continue;
        acc += w * texture(faces, vec3(vec2(x, y) / tanM * 0.5 + 0.5, float(i))).rgb; ws += w;
      }
      return acc / max(ws, 1e-5);
    }
    // occlusion ambiante d'une direction (rapport « avec / sans ») : même principe, poids nul à 2° du bord rendu (l'occlusion calculée à
    // l'écran y manque d'échantillons) ; le passage d'une face à l'autre se fait sur ±4° autour de l'arête
    float occlusion(vec3 d){
      float acc = 0.0, ws = 0.0;
      for (int i = 0; i < 6; i++) {
        float z = dot(d, F[i]); if (z <= 1e-4) continue;
        float x = dot(d, R[i]) / z, y = dot(d, U[i]) / z, a = max(abs(x), abs(y));
        float w = 1.0 - smoothstep(0.5, tanM * 0.96, a); if (w <= 0.0) continue;
        acc += w * texture(occl, vec3(vec2(x, y) / tanM * 0.5 + 0.5, float(i))).r; ws += w;
      }
      return ws > 0.0 ? acc / ws : 1.0;
    }
    vec3 face(vec3 d, int i){ float z = dot(d, F[i]); return texture(faces, vec3(vec2(dot(d, R[i]), dot(d, U[i])) / z / tanM * 0.5 + 0.5, float(i))).rgb; }
    float faceAO(vec3 d, int i){ float z = dot(d, F[i]); return texture(occl, vec3(vec2(dot(d, R[i]), dot(d, U[i])) / z / tanM * 0.5 + 0.5, float(i))).r; }`;
  const FS_EQ = COMMUN + `
    uniform vec2 taille, decale; uniform int N;
    float bruit(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec3 acc = vec3(0.0);
      for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) { if (i >= N || j >= N) continue;
        vec2 q = (gl_FragCoord.xy + decale - 0.5 + (vec2(i, j) + 0.5) / float(N)) / taille;
        float lacet = (0.5 - q.x) * 6.28318530718, tangage = (q.y - 0.5) * 3.14159265359; // q.y = 0 en bas de l'image
        vec3 d = vec3(-sin(lacet) * cos(tangage), sin(tangage), -cos(lacet) * cos(tangage));
        acc += pow(pow(couleur(d), vec3(2.2)) * occlusion(d), vec3(1.0 / 2.2));
      }
      // tramage de ±0,5 niveau : pas d'anneaux dans le halo des plafonniers (dégradé très doux sur 8 bits, puis JPEG)
      o = vec4(acc / float(N * N) + (bruit(gl_FragCoord.xy + decale) - 0.5) / 255.0, 1.0);
    }`;
  // coutures : pour chaque arête du cube (ligne), 256 directions sur l'arête vues par chacune des deux faces ; une couture est un écart
  // de luminance de même signe tout le long de l'arête (occlusion, halo), pas les écarts de détail d'un bord d'objet, qui se compensent.
  // mode 0 : couleur (sans occlusion) ; mode 1 : rapport d'occlusion ambiante
  const FS_COUT = COMMUN + `
    uniform ivec2 paires[12]; uniform int mode;
    void main(){
      int e = int(gl_FragCoord.y), k = int(gl_FragCoord.x); ivec2 pr = ivec2(0);
      for (int i = 0; i < 12; i++) if (i == e) pr = paires[i];
      vec3 c = normalize(cross(F[pr.x], F[pr.y])); float t = -0.95 + 1.9 * (float(k) + 0.5) / 256.0;
      vec3 d0 = normalize(F[pr.x] + F[pr.y] + t * c), n = normalize(F[pr.x] - F[pr.y]);
      // écart signé en 5 points de part et d'autre de l'arête (±1,7°), médiane : un bord d'objet posé sur l'arête ne compte pas
      float v[5];
      for (int i = 0; i < 5; i++) { vec3 d = normalize(d0 + (float(i) - 2.0) * 0.015 * n);
        v[i] = mode == 1 ? faceAO(d, pr.x) - faceAO(d, pr.y) : dot(face(d, pr.x) - face(d, pr.y), vec3(0.2126, 0.7152, 0.0722)); }
      for (int i = 0; i < 5; i++) for (int j = 0; j < 4; j++) if (v[j] > v[j + 1]) { float x = v[j]; v[j] = v[j + 1]; v[j + 1] = x; }
      o = vec4(clamp(v[2] * 4.0 + 0.5, 0.0, 1.0), 0.0, 0.0, 1.0); // écart signé médian (×4, décalé)
    }`;
  // rapport d'occlusion d'une face : luminance (linéaire) avec occlusion / sans ; 1 où elle n'assombrit rien
  const FS_AO = `#version 300 es
    precision highp float; precision highp sampler2DArray;
    uniform sampler2DArray faces; uniform sampler2D avec; uniform int couche; uniform vec2 taille; out vec4 o;
    void main(){
      vec2 uv = gl_FragCoord.xy / taille; const vec3 W = vec3(0.2126, 0.7152, 0.0722);
      float a = dot(pow(texture(faces, vec3(uv, float(couche))).rgb, vec3(2.2)), W), b = dot(pow(texture(avec, uv).rgb, vec3(2.2)), W);
      o = vec4(clamp((b + 0.004) / (a + 0.004), 0.0, 1.0), 0.0, 0.0, 1.0);
    }`;
  const prog = fs => { const p = gl.createProgram(); for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); } gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  const pEq = prog(FS_EQ), pCout = prog(FS_COUT), pAO = prog(FS_AO);
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const param = t => { for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(t, k, v); };
  gl.activeTexture(gl.TEXTURE0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, FACE, FACE, 6); param(gl.TEXTURE_2D_ARRAY);
  gl.activeTexture(gl.TEXTURE1);
  const texAO = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAO); gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.R8, FACE, FACE, 6); param(gl.TEXTURE_2D_ARRAY);
  gl.activeTexture(gl.TEXTURE2);
  const texAvec = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texAvec); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, FACE, FACE); param(gl.TEXTURE_2D);
  const fb = gl.createFramebuffer();
  const bases = [];
  const uniformes = p => {
    gl.useProgram(p); gl.uniform1i(gl.getUniformLocation(p, 'faces'), 0); gl.uniform1i(gl.getUniformLocation(p, 'occl'), 1); gl.uniform1f(gl.getUniformLocation(p, 'tanM'), tanM);
    for (const [n, k] of [['R', 0], ['U', 1], ['F', 2]]) gl.uniform3fv(gl.getUniformLocation(p, n), bases.flatMap(b => b[k]));
  };
  const CORE_L = () => FACE / tanM; // pixels d'une face sur ses 90°
  window.__pano = {
    // face i : image courante du canevas du moteur, et repère de la caméra (droite, haut, avant) lu sur sa matrice ; avecAO : la même
    // vue avec occlusion ambiante, dont on garde le rapport à la première
    face(i, avecAO) {
      const src = document.getElementById('gl'), c = __v.camera; c.updateMatrixWorld(true); const e = c.matrixWorld.elements;
      bases[i] = [[e[0], e[1], e[2]], [e[4], e[5], e[6]], [-e[8], -e[9], -e[10]]];
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      if (!avecAO) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, FACE, FACE, 1, gl.RGBA, gl.UNSIGNED_BYTE, src); return; }
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texAvec); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FACE, FACE, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texAO, 0, i);
      gl.viewport(0, 0, FACE, FACE); gl.useProgram(pAO);
      gl.uniform1i(gl.getUniformLocation(pAO, 'faces'), 0); gl.uniform1i(gl.getUniformLocation(pAO, 'avec'), 2); gl.uniform1i(gl.getUniformLocation(pAO, 'couche'), i); gl.uniform2f(gl.getUniformLocation(pAO, 'taille'), FACE, FACE);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D_ARRAY, null); // pas de boucle lecture / écriture sur texAO
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAO);
    },
    // sans occlusion (--essai, ou plan simple) : rapport 1 partout
    sansAO() { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D_ARRAY, texAO); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); const un = new Uint8Array(FACE * FACE).fill(255); for (let i = 0; i < 6; i++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, FACE, FACE, 1, gl.RED, gl.UNSIGNED_BYTE, un); },
    // équirectangulaire de largeur L : JPEG en base64 (qualité q) ; au-delà de 4096, rendu en bandes verticales (tampon WebGL limité)
    equi(L, q) {
      const N = Math.min(4, Math.max(2, Math.ceil(CORE_L() / (L / 4) - 0.01))), B = Math.min(L, 4096), H = L / 2;
      const out = L > B ? Object.assign(document.createElement('canvas'), { width: L, height: H }) : null;
      cv.width = B; cv.height = H; gl.viewport(0, 0, B, H); uniformes(pEq);
      gl.uniform2f(gl.getUniformLocation(pEq, 'taille'), L, H); gl.uniform1i(gl.getUniformLocation(pEq, 'N'), N);
      for (let x = 0; x < L; x += B) {
        gl.uniform2f(gl.getUniformLocation(pEq, 'decale'), x, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (out) out.getContext('2d').drawImage(cv, x, 0);
      }
      return (out || cv).toDataURL('image/jpeg', q);
    },
    // luminance de directions (lacet, tangage) dans la dernière image équirectangulaire rendue (mesures des arêtes et des marches)
    lire(dirs, r = 2) {
      const W = cv.width, H = cv.height, L = H * 2, px = new Uint8Array((2 * r + 1) * (2 * r + 1) * 4);
      return dirs.map(([lacet, tangage]) => {
        const x = Math.round(((0.5 - lacet / (2 * Math.PI)) % 1 + 1) % 1 * L), y = Math.round((tangage / Math.PI + 0.5) * H); // y compté du bas
        if (x - r < 0 || x + r >= W || y - r < 0 || y + r >= H) return null;
        gl.readPixels(x - r, y - r, 2 * r + 1, 2 * r + 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let s = 0; for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
        return s / (px.length / 4);
      });
    },
    // aperçu de 512 px tiré de l'image courante, et luminance moyenne, écart-type, part de noir
    apercu(q) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, 512, 256);
      const d = g.getImageData(0, 0, 512, 256).data; let s = 0, s2 = 0, noir = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; s += l; s2 += l * l; if (l < 0.02) noir++; n++; }
      const m = s / n; return { url: c.toDataURL('image/jpeg', q), moyenne: m, ecart: Math.sqrt(Math.max(0, s2 / n - m * m)), noir: noir / n };
    },
    // coutures : écart moyen (sur 255, en valeur absolue) par arête du cube, avant fondu ; mode 0 couleur, 1 occlusion
    coutures(mode = 0) {
      const paires = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const a = bases[i][2], b = bases[j][2]; if (Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) < 0.1) paires.push(i, j); }
      cv.width = 256; cv.height = 12; gl.viewport(0, 0, 256, 12); uniformes(pCout); gl.uniform2iv(gl.getUniformLocation(pCout, 'paires'), paires); gl.uniform1i(gl.getUniformLocation(pCout, 'mode'), mode);
      gl.drawArrays(gl.TRIANGLES, 0, 3); const px = new Uint8Array(256 * 12 * 4); gl.readPixels(0, 0, 256, 12, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const out = []; for (let e = 0; e < 12; e++) { let s = 0; for (let k = 0; k < 256; k++) s += (px[(e * 256 + k) * 4] - 127.5) / 4; out.push(Math.abs(s / 256)); }
      return out;
    },
  };
}, FACE, MARGE);

/* ---------- images du plan de chaque niveau : le plan réduit de la visite (sans texte), couleurs résolues, en PNG ---------- */
const D = await page.evaluate(() => ({ bounds: App.D.bounds, levels: App.D.levels.map(l => ({ name: App.levelName(App.D.levels.indexOf(l)), y: l.y })), multi: !!App.D.multi,
  stops: App.D.stops.map(s => ({ id: s.id, label: s.label, room: s.room, p: s.p, yaw: s.yaw, pitch: s.pitch, level: s.level ?? 0, open: s.open || [], close: s.close || [], stair: s.stair || null })),
  stairs: (App.D.stairs || []).map(s => ({ id: s.id, from: s.from, to: s.to, line: s.line, n: s.n, rise: s.rise, width: s.width })), titre: App.D.titre || '',
  cuisine: (App.D.kitchenHint || []).map(k => ({ r: k.r, level: k.level ?? 0 })) }));
const [bx0, bx1, bz0, bz1] = D.bounds, BW = bx1 - bx0, BH = bz1 - bz0;
const PLAN_W = BW >= BH ? 1200 : Math.round(1200 * BW / BH), PLAN_H = BW >= BH ? Math.round(1200 * BH / BW) : 1200;
for (let k = 0; k < D.levels.length; k++) {
  const url = await page.evaluate(async (k, W, H) => {
    App.set('level', k); await new Promise(r => requestAnimationFrame(r));
    const cs = getComputedStyle(document.documentElement), svg = document.getElementById('miniSvg').cloneNode(true);
    svg.querySelector('#mmk')?.remove(); // marqueur du visiteur de la visite : la visionneuse dessine le sien
    const corps = svg.innerHTML.replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => cs.getPropertyValue(n).trim());
    const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svg.getAttribute('viewBox')}" width="${W}" height="${H}">${corps}</svg>`;
    const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src); await im.decode();
    const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(im, 0, 0, W, H);
    // sans texte : le plan réduit n'en contient pas ; on le vérifie quand même
    if (/<text/.test(corps)) return null;
    return c.toDataURL('image/png');
  }, k, PLAN_W, PLAN_H);
  if (!url) { pb(`Plan du niveau ${k + 1} : texte présent dans l'image`); continue; }
  fs.writeFileSync(path.join(outDir, `niveau-${k}.png`), Buffer.from(url.split(',')[1], 'base64'));
}

/* ---------- outils de géométrie dans la page : rayons (verre compris ou non), disque de cercle, anneau de profondeur ---------- */
await page.evaluate(() => {
  const { THREE, scene, M } = __v;
  const vis = ob => { for (let x = ob; x; x = x.parent) if (!x.visible) return false; return true; };
  // matière qui arrête le regard ; le verre ne l'arrête pas pour voir une pièce voisine, il l'arrête pour mesurer la place devant soi
  const bloque = (m, verre) => { const ms = Array.isArray(m) ? m : [m]; return ms.some(q => q && q !== M.hover && q.visible !== false && q.colorWrite !== false && (q === M.glass ? verre : !(q.transparent && q.opacity < 0.5))); };
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), P = new THREE.Vector3(), d = new THREE.Vector3();
  const touche = (o, p, verre) => { O.set(...o); P.set(...p); d.copy(P).sub(O); const L = d.length(); d.normalize(); rc.set(O, d); rc.near = 0.05; rc.far = L - 0.04;
    return rc.intersectObjects(scene.children, true).some(h => (h.object.isMesh || h.object.isInstancedMesh) && vis(h.object) && bloque(h.object.material, verre)); };
  const id = r => r && (r.of || r.id);
  window.__pz = {
    prep() { __v.cullRestore && __v.cullRestore(); scene.updateMatrixWorld(true); },
    // premier point visible parmi des cibles [x, y, z] depuis l'œil [x, y, z] ; null sinon
    visible(o, cibles) { this.prep(); for (const c of cibles) if (!touche(o, c, false)) return c; return null; },
    // pour chaque cible : vue depuis l'œil (rayon libre jusqu'à 4 cm d'elle)
    vus(o, cibles) { this.prep(); return cibles.map(c => !touche(o, c, false)); },
    // premier cercle entièrement visible : son centre, puis n points de son bord (rayon r) ; bord : [[dx, dz], …] relatifs au centre
    disque(o, cibles, bord) {
      this.prep();
      for (const c of cibles) { if (touche(o, c, false)) continue; if (bord.every(([dx, dz]) => !touche(o, [c[0] + dx, c[1], c[2] + dz], false))) return c; }
      return null;
    },
    // points du bord cachés, pour le contrôle
    bordCache(o, c, bord) { this.prep(); return bord.filter(([dx, dz]) => touche(o, [c[0] + dx, c[1], c[2] + dz], false)).length; },
    // profondeur libre autour de l'œil : 360 rayons horizontaux (1°, lacet ψ = k°, avant = (−sin ψ, −cos ψ)) à hauteur d'œil et 55 cm plus
    // bas, verre compris ; la plus courte des deux, 25 m au plus
    // verre : 1 si le rayon à hauteur d'œil s'arrête sur un vitrage (fenêtre, porte-fenêtre : le jour, la vue dehors) ; equip : 1 si le
    // rayon à 60 cm du sol touche d'abord un équipement (ce qui fait reconnaître une salle de bains, une cuisine)
    anneau(o) {
      this.prep(); const out = [], verre = [], equip = [];
      for (let k = 0; k < 360; k++) {
        const a = k * Math.PI / 180, dir = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)); let m = 25, v = 0;
        for (const dy of [0, -0.55]) { rc.set(new THREE.Vector3(o[0], o[1] + dy, o[2]), dir); rc.near = 0.02; rc.far = 25;
          const h = rc.intersectObjects(scene.children, true).find(h => (h.object.isMesh || h.object.isInstancedMesh) && vis(h.object) && bloque(h.object.material, true));
          if (h && h.distance < m) { m = h.distance; if (dy === 0) v = (Array.isArray(h.object.material) ? h.object.material : [h.object.material]).includes(M.glass) ? 1 : 0; } }
        // équipement : à 60 cm du sol (baignoire, vasque, cuvette, cuisine, meuble), premier objet touché dans la pièce, hors placard
        rc.set(new THREE.Vector3(o[0], o[1] - __v.EYE + 0.6, o[2]), dir); rc.near = 0.02; rc.far = Math.min(m, 6) + 0.3;
        const he = rc.intersectObjects(scene.children, true).find(h => (h.object.isMesh || h.object.isInstancedMesh) && vis(h.object) && bloque(h.object.material, true));
        let eq = 0; if (he) for (let x = he.object; x; x = x.parent) { if (x.userData && x.userData.op) break; if (x === __v.G.fixed) { eq = 1; break; } }
        out.push(Math.round(m * 1000) / 1000); verre.push(v); equip.push(eq);
      }
      return { prof: out, verre, equip };
    },
    // profondeur dans la pièce : le long de chaque rayon de l'anneau, jusqu'à ce qu'il en sorte (porte, passage, fenêtre) ou touche
    dansPiece(o, lv, piece, prof) {
      return prof.map((d, k) => { const a = k * Math.PI / 180, sx = -Math.sin(a), sz = -Math.cos(a);
        for (let t = 0.05; t < d; t += 0.05) if (id(__v.roomAtLv(o[0] + sx * t, o[2] + sz * t, lv)) !== piece) return Math.round(t * 1000) / 1000;
        return d; });
    },
    // longueur (m) du segment a → b, au sol du niveau lv, dans des pièces autres que celles d'« exclues » qui ont un arrêt (pieces)
    traverse(a, b, lv, pieces, exclues) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.05)); let s = 0;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = id(__v.roomAtLv(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, lv)); if (r && pieces.includes(r) && !exclues.includes(r)) s += L / n; }
      return s;
    },
    traverses(a, pts, lv, pieces, exclues) { return pts.map(b => this.traverse(a, b, lv, pieces, exclues)); },
    piece: (x, z, lv) => id(__v.roomAtLv(x, z, lv)),
  };
});
const visible = (o, cibles) => page.evaluate((o, c) => __pz.visible(o, c), o, cibles);
const BORD = (r, n = 8) => Array.from({ length: n }, (_, i) => [r * Math.cos(i / n * 2 * Math.PI), r * Math.sin(i / n * 2 * Math.PI)].map(r3));
const disque = (o, cibles, bord = BORD(R_CERCLE, 12)) => page.evaluate((o, c, b) => __pz.disque(o, c, b), o, cibles, ESSAI === 'disque' ? [] : bord);
const angles = (o, P) => { const dx = P[0] - o[0], dy = P[1] - o[1], dz = P[2] - o[2], h = Math.hypot(dx, dz); return { lacet: Math.atan2(-dx, -dz), tangage: Math.atan2(dy, h), d: Math.hypot(h, dy) }; };
const cap2 = (a, b) => Math.atan2(-(b[0] - a[0]), -(b[1] - a[1])); // lacet de a vers b (plan)
const segDist = (p, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx * vx + vz * vz, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / L2)) : 0; return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vz * t); };

/* ---------- vantaux des portes : charnière et bout du vantail fermé et ouvert, lus sur la scène (le moteur fait foi) ---------- */
const VANTAUX = await page.evaluate(() => {
  const { THREE, scene } = __v, out = [];
  for (const o of __v.operables) {
    const op = App.D.openings[o.id]; if (!op || op.kind !== 'door' || !o.group) continue;
    let leaf = null, best = 0;
    o.group.traverse(m => { if (m.isMesh && m.userData.op === o && m.parent !== o.group) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, s = b.max.x - b.min.x; if (s > best) { best = s; leaf = m; } } });
    if (!leaf) continue;
    const piv = leaf.parent, bx = leaf.geometry.boundingBox.max.x, t0 = o.t;
    const pos = v => { o.apply(v); scene.updateMatrixWorld(true); const H = new THREE.Vector3(0, 0, 0).applyMatrix4(piv.matrixWorld), E = new THREE.Vector3(bx, 0, 0).applyMatrix4(piv.matrixWorld); return [[H.x, H.z], [E.x, E.z]]; };
    const [h, ferme] = pos(0), [, ouvert] = pos(1); o.apply(t0); scene.updateMatrixWorld(true);
    out.push({ id: o.id, charniere: h, ferme, ouvert, L: Math.hypot(ouvert[0] - h[0], ouvert[1] - h[1]), lv: op.level ?? 0 });
  }
  return out;
});
const parVantail = Object.fromEntries(VANTAUX.map(v => [v.id, v]));
// dans le quart de disque que balaie le vantail (agrandi de « marge »)
const debattement = (V, p, marge) => {
  const v = [p[0] - V.charniere[0], p[1] - V.charniere[1]], a = [V.ferme[0] - V.charniere[0], V.ferme[1] - V.charniere[1]], b = [V.ouvert[0] - V.charniere[0], V.ouvert[1] - V.charniere[1]];
  if (Math.hypot(...v) > V.L + marge) return false;
  return (v[0] * a[0] + v[1] * a[1]) / V.L >= -marge && (v[0] * b[0] + v[1] * b[1]) / V.L >= -marge;
};
const dVantail = (V, p) => segDist(p, V.charniere, V.ouvert);

let tP = Date.now(); const tPhase = n => { (mesures.phases_s ||= {})[n] = +((Date.now() - tP) / 1000).toFixed(1); tP = Date.now(); };
const stops = D.stops.filter(s => !ONLY || ONLY.includes(s.id));
const piecesArret = [...new Set(stops.map(s => s.room))];

/* ---------- point de vue de chaque arrêt : celui de l'arrêt, sinon le plus proche qui soit hors du débattement des portes (agrandi de
   30 cm), à VANTAIL_MIN au moins de tout vantail ouvert, hors de la cuisine indicative (agrandie de 30 cm), à 30 cm des murs et des
   équipements, dans la même pièce ; reculer (dos à la vue prévue) coûte un peu moins qu'avancer ---------- */
// pièces minuscules (cellier de 1,2 m²) : exigences relâchées par paliers ; le palier retenu fixe le seuil du contrôle de l'arrêt
const PALIERS = [{ vmin: VANTAIL_MIN, bord: 0.3, deb: 0.3, cuis: 0.3 }, { vmin: 0.5, bord: 0.25, deb: 0.15, cuis: 0 }, { vmin: 0.4, bord: 0.2, deb: 0.05, cuis: 0 }];
for (const s of stops) {
  let r = null;
  if (ESSAI === 'vantail') r = { p: s.p, deplace: 0, k: 0 };
  else for (let k = 0; k < PALIERS.length && (!r || r.deplace < 0); k++) r = { ...await page.evaluate((s, VANT, K, C) => {
    const lv = s.level, y = __v.levels[lv].y, id = r => r && (r.of || r.id), dansP = (x, z) => id(__v.roomAtLv(x, z, lv)) === s.room;
    const seg = (p, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx * vx + vz * vz, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / L2)); return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vz * t); };
    const deb = (V, p, m) => { const v = [p[0] - V.charniere[0], p[1] - V.charniere[1]], a = [V.ferme[0] - V.charniere[0], V.ferme[1] - V.charniere[1]], b = [V.ouvert[0] - V.charniere[0], V.ouvert[1] - V.charniere[1]];
      return Math.hypot(...v) <= V.L + m && (v[0] * a[0] + v[1] * a[1]) / V.L >= -m && (v[0] * b[0] + v[1] * b[1]) / V.L >= -m; };
    const e = C.bord, f = e * 0.7, autour = [[e, 0], [-e, 0], [0, e], [0, -e], [f, f], [-f, f], [f, -f], [-f, -f]];
    const ok = (x, z) => {
      if (!dansP(x, z) || autour.some(([dx, dz]) => !dansP(x + dx, z + dz))) return false;
      if (VANT.some(V => V.lv === lv && (deb(V, [x, z], C.deb) || seg([x, z], V.charniere, V.ouvert) < C.vmin))) return false;
      if (K.some(k => k.level === lv && x > k.r[0] - C.cuis && x < k.r[1] + C.cuis && z > k.r[2] - C.cuis && z < k.r[3] + C.cuis)) return false;
      return __v.standable(x, z, y, Math.min(0.3, e));
    };
    // dégagement d'un point : distance aux bords de la pièce (murs), à ses équipements et à ses gaines. Le 360° se regarde tout autour :
    // l'arrêt, placé dans un angle pour la photo, mettait deux murs à 50 cm sur la moitié du tour (retour R1, « la tête dans le mur ») ;
    // le point de vue est celui qui s'écarte le plus des murs (1,2 m suffit), près de l'arrêt à dégagement presque égal
    const piece = App.D.rooms.filter(r => (r.level || 0) === lv && id(r) === s.room && r.poly && r.poly.length >= 3);
    const obst = [...(App.D.fixtures || []).filter(f => (f.level || 0) === lv && f.x && f.z && f.type !== 'placard').map(f => [[f.x[0], f.z[0]], [f.x[1], f.z[0]], [f.x[1], f.z[1]], [f.x[0], f.z[1]]]),
      ...(App.D.gaines || []).filter(g => (g.level || 0) === lv && g.poly).map(g => g.poly)];
    const bords = [...piece.map(r => r.poly), ...obst];
    const degage = (x, z) => { let m = Infinity; for (const q of bords) for (let i = 0; i < q.length; i++) m = Math.min(m, seg([x, z], q[i], q[(i + 1) % q.length])); return m; };
    // le point de vue garde en vue chaque passage vers une pièce voisine que l'arrêt voyait (sinon le lien du 360° vers elle disparaît :
    // D201, chambre recentrée, le séjour n'était plus visible par la porte)
    const T = __v.THREE, rc = new T.Raycaster(), murs3 = [__v.G.arch, __v.G.fixed].filter(Boolean), yo = y + 1.5;
    const voit = (x, z, q) => { const o = new T.Vector3(x, yo, z), d = new T.Vector3(q[0] - x, 0, q[1] - z), L = d.length(); if (L < 0.05) return true; d.normalize(); rc.set(o, d); rc.near = 0; rc.far = L - 0.1; return !rc.intersectObjects(murs3, true).some(h => h.object.isMesh && h.object.visible); };
    // cibles gardées en vue : passages de la pièce, arrêts voisins du même niveau, marches de l'escalier (liens du 360° : sans elles, le
    // séjour du 3124 et le R+2 du duplex devenaient inatteignables)
    const pass = (App.D.passages || []).filter(q => q.p && (q.level ?? lv) === lv && (q.a === s.room || q.b === s.room)).map(q => q.p);
    const marches = (App.D.stairs || []).filter(q => q.from === lv || q.to === lv).flatMap(q => { const pts = []; for (let t = 0.1; t < q.len; t += 0.25) pts.push(App.stairPt(q, t, 0)); return pts; });
    const vus0 = [...pass, ...marches].filter(q => voit(s.p[0], s.p[1], q));
    // pièces des autres arrêts du niveau vues depuis l'arrêt (un point de leur sol, grille de 30 cm) : le point de vue en voit toujours un
    const salles = (App.D.stops || []).filter(q => q.id !== s.id && (q.level || 0) === lv && q.room !== s.room).map(q => {
      const R = App.D.rooms.find(r => r.id === q.room); if (!R || !R.poly) return [];
      const xs = R.poly.map(p => p[0]), zs = R.poly.map(p => p[1]), pts = [];
      for (let x = Math.min(...xs) + 0.15; x < Math.max(...xs); x += 0.3) for (let z = Math.min(...zs) + 0.15; z < Math.max(...zs); z += 0.3) if (id(__v.roomAtLv(x, z, lv)) === q.room) pts.push([x, z]);
      return pts;
    }).filter(pts => pts.some(q => voit(s.p[0], s.p[1], q)));
    // dégagement visé : 1 m (le quart du tour au plus à moins d'1 m), ou le plus grand possible ; puis le point le plus proche de l'arrêt
    const cands = [];
    for (let dx = -4; dx <= 4.001; dx += 0.05) for (let dz = -4; dz <= 4.001; dz += 0.05) {
      const x = s.p[0] + dx, z = s.p[1] + dz; if (!dansP(x, z)) continue;
      cands.push({ p: [x, z], g: degage(x, z), d: Math.hypot(dx, dz) });
    }
    const valide = c => ok(c.p[0], c.p[1]) && vus0.every(q => voit(c.p[0], c.p[1], q)) && salles.every(pts => pts.some(q => voit(c.p[0], c.p[1], q)));
    const g0 = degage(s.p[0], s.p[1]);
    let gmax = 0; for (const c of cands.slice().sort((a, b) => b.g - a.g)) { if (c.g <= gmax) break; if (valide(c)) { gmax = c.g; break; } }
    // paliers : 1 m (ou le plus grand possible), puis moins ; sinon l'arrêt lui-même, sinon le point permis le plus proche
    const okS = ok(s.p[0], s.p[1]); let best = null;
    cands.sort((a, b) => a.d - b.d);
    for (const cible of [Math.min(1.0, gmax) - 0.02, 0.8, 0.6]) {
      if (okS && g0 >= cible) return { p: s.p, deplace: 0, g: g0, gmax };
      best = cands.find(c => c.g >= cible && c.g > g0 + 0.05 && valide(c)) || null; if (best) break;
    }
    if (!best && okS) return { p: s.p, deplace: 0, g: g0, gmax };
    if (!best) best = cands.find(c => ok(c.p[0], c.p[1])) || null;
    if (best) { best.gmax = gmax; }
    return best ? { p: best.p.map(v => Math.round(v * 1000) / 1000), deplace: Math.round(best.d * 100) / 100, g: best.g, gmax } : { p: s.p, deplace: -1, g: g0, gmax };
  }, s, VANTAUX, D.cuisine, PALIERS[k]), k };
  s.pe = r.p; s.palier = PALIERS[r.k]; s.degage = r.g; s.degageMax = r.gmax;
  if (r.deplace < 0) pb(`${s.label} : aucun point de vue hors du débattement des portes et de la cuisine`);
  else if (r.deplace > 0 || r.k) console.log(`point de vue de « ${s.label} » déplacé de ${r.deplace} m (loin des murs, hors du débattement des portes et de la cuisine${r.k ? `, pièce exiguë : palier ${r.k}` : ''})`);
  (mesures.deplacements ||= {})[s.id] = r.deplace;
}
// œil d'un arrêt (même règle que la visite : 4 cm plus bas dehors)
for (const s of stops) Object.assign(s, await page.evaluate(s => { const lv = s.level, r = __v.roomAtLv(s.pe[0], s.pe[1], lv); return { oeil: __v.levels[lv].y + __v.EYE + (App.isExt(r) ? -0.04 : 0), dehors: !!App.isExt(r) }; }, s));
const O3 = s => [s.pe[0], s.oeil, s.pe[1]];

/* ---------- portes : réglées pour chaque arrêt, appliquées avant ses rayons et son rendu ---------- */
const etats = new Map(); // arrêt → { porte : 0 ou 1 }
const portes = s => page.evaluate(e => {
  for (const o of __v.operables) { const want = e[o.id] ?? 0; o.target = o.t = want; o.apply(want); }
  __v.markShadows(); __v.scene.updateMatrixWorld(true);
}, etats.get(s.id) || {});
const PORTES = await page.evaluate(() => __v.operables.map(o => {
  const op = App.D.openings[o.id]; if (!op || op.kind !== 'door' || op.closed) return { id: o.id, porte: false };
  const [a, b] = op.p, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L], lv = op.level ?? 0;
  const cote = k => { const r = __v.roomAtLv(m[0] + n[0] * k, m[1] + n[1] * k, lv); return r ? (r.of || r.id) : null; };
  return { id: o.id, porte: true, pieces: [cote(0.35), cote(-0.35)], m, n, lv, label: op.label || o.id };
}));
// une porte ne s'ouvre que si elle relie deux pièces qui ont chacune un arrêt (jamais celle d'un placard, d'un tableau, d'une gaine)
const ouvrable = P => P.porte && P.pieces.every(r => r && piecesArret.includes(r));
// vantaux ouverts dans l'état d'un arrêt (segments charnière → bout ouvert)
const vantauxOuverts = s => { const e = etats.get(s.id) || {}; return VANTAUX.filter(V => e[V.id] && V.lv === s.level); };
// œil trop près du vantail ouvert de cette porte (ou dans son débattement) : elle reste fermée
const genant = (A, P) => { const V = parVantail[P.id]; return V && V.lv === A.level && (debattement(V, A.pe, A.palier.deb) || dVantail(V, A.pe) < A.palier.vmin); };

/* ---------- liens entre arrêts : ligne de vue de l'œil d'un arrêt vers le sol de l'autre (verre compris), escalier entre niveaux ---------- */
// cercle posé : disque entier visible, hors d'un vantail ouvert, ligne de vue qui ne traverse pas la pièce d'un autre arrêt
const premierPropre = async (A, B, cands, bord) => {
  const VO = vantauxOuverts(A); let ok = cands.filter(q => !VO.some(V => dVantail(V, [q[0], q[2]]) < R_CERCLE + 0.05));
  if (ESSAI !== 'traversee' && ok.length) { const t = await page.evaluate((a, pts, lv, P, X) => __pz.traverses(a, pts, lv, P, X), A.pe, ok.map(q => [q[0], q[2]]), A.level, piecesArret, [A.room, B.room]); ok = ok.filter((q, i) => t[i] <= 0.15); }
  return ok.length ? disque(O3(A), ok, bord) : null;
};
// point du sol de la pièce de B vu de l'œil de A, le plus proche de B (grille de 20 cm dans la pièce, à 35 cm des murs au moins, à 90 cm
// de A au moins : jamais sous ses pieds) : le point de passage est posé là où l'on voit le sol de la pièce voisine
const candPointe = async (A, B) => {
  const c = await page.evaluate((A, B, y) => {
    const id = r => r && (r.of || r.id), R = App.D.rooms.find(r => r.id === B.room); if (!R) return [];
    const xs = R.poly.map(p => p[0]), zs = R.poly.map(p => p[1]), out = [], ok = (x, z) => id(__v.roomAtLv(x, z, B.level)) === B.room;
    for (let x = Math.min(...xs) + 0.1; x < Math.max(...xs); x += 0.2) for (let z = Math.min(...zs) + 0.1; z < Math.max(...zs); z += 0.2)
      if (Math.hypot(x - A.pe[0], z - A.pe[1]) >= 0.9 && ok(x, z) && ok(x + 0.35, z) && ok(x - 0.35, z) && ok(x, z + 0.35) && ok(x, z - 0.35) && ok(x + 0.25, z + 0.25) && ok(x - 0.25, z + 0.25) && ok(x + 0.25, z - 0.25) && ok(x - 0.25, z - 0.25)) out.push([x, y, z, Math.hypot(x - B.pe[0], z - B.pe[1])]);
    return out.sort((p, q) => p[3] - q[3]).slice(0, 400).map(p => p.slice(0, 3));
  }, A, B, D.levels[B.level].y + 0.03);
  return [...(Math.hypot(B.pe[0] - A.pe[0], B.pe[1] - A.pe[1]) >= 0.9 ? [[B.pe[0], D.levels[B.level].y + 0.03, B.pe[1]]] : []), ...c];
};
const pointe = async (A, B) => premierPropre(A, B, await candPointe(A, B));
// B caché pour A derrière une porte (fermée, ou vue trop rasante) : point de passage au sol devant cette porte, du côté de A (à « dists »
// d'elle, décalé de « lats » le long d'elle), jamais dans la pièce d'un troisième arrêt
const candPorte = (A, B, dists = [0.45], lats = [0]) => {
  const c = [];
  for (const P of PORTES) if (P.porte && P.lv === A.level && P.pieces.includes(B.room) && !P.pieces.every(x => x === B.room)) {
    const k = P.pieces[0] === B.room ? -1 : 1, cote = P.pieces[P.pieces[0] === B.room ? 1 : 0], y = D.levels[A.level].y + 0.03, u = [P.n[1], -P.n[0]];
    if (cote !== A.room && piecesArret.includes(cote)) continue;
    for (const d of dists) for (const t of lats) { const q = [P.m[0] + P.n[0] * d * k + u[0] * t, y, P.m[1] + P.n[1] * d * k + u[1] * t]; if (Math.hypot(q[0] - A.pe[0], q[2] - A.pe[1]) >= 0.9) c.push(q); }
  }
  return c;
};
const parPorte = async (A, B) => { const c = candPorte(A, B); return c.length ? premierPropre(A, B, c) : null; };
/* cercles confondus : l'un sur l'autre dans la pièce (centres à moins de 65 cm), ou collés l'un à l'autre à l'écran (D201 : le cercle
   « Loggia » juste au-dessus du cercle « Chambre », plus loin dans la même direction). Deux disques disjoints du sol restent disjoints à
   l'écran ; on mesure l'écart angulaire entre leurs contours (24 points chacun) vus de l'œil : moins de 2°, on ne sait plus lequel on touche */
const CONFONDUS = 0.65, ECART_ECRAN = 2 * DEG;
const contour = (A, p, r) => Array.from({ length: 24 }, (_, i) => { const t = i / 24 * 2 * Math.PI, a = angles(O3(A), [p[0] + r * Math.cos(t), p[1], p[2] + r * Math.sin(t)]); return [Math.cos(a.tangage) * -Math.sin(a.lacet), Math.sin(a.tangage), Math.cos(a.tangage) * -Math.cos(a.lacet)]; });
const confondusPts = (A, p, q, escP, escQ) => {
  if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < CONFONDUS) return true;
  const cp = contour(A, p, escP ? R_CERCLE_ESC : R_CERCLE), cq = contour(A, q, escQ ? R_CERCLE_ESC : R_CERCLE); let m = 1;
  for (const u of cp) for (const v of cq) m = Math.min(m, Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
  return m < ECART_ECRAN;
};
const lienDirect = async (A, B) => await pointe(A, B) || await parPorte(A, B);
// arrêts voisins vus depuis A dans l'état courant des portes, et paires de cercles confondus parmi eux (moins il y en a, mieux c'est)
const voisins = async A => {
  const pts = []; for (const B of stops) if (B !== A && B.level === A.level) { const P = await lienDirect(A, B); if (P) pts.push(P); }
  let c = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (confondusPts(A, pts[i], pts[j])) c++;
  return { n: pts.length, c };
};
const mieux = (m, n) => m.n > n.n || (m.n === n.n && m.c < n.c);
for (const A of stops) {
  const e = {};
  for (const P of PORTES) e[P.id] = !ouvrable(P) || genant(A, P) ? 0 : A.open.includes(P.id) ? 1 : A.close.includes(P.id) ? 0 : 1;
  if (ESSAI === 'vantail') for (const P of PORTES) if (ouvrable(P) && parVantail[P.id] && debattement(parVantail[P.id], A.pe, 0)) e[P.id] = 1;
  if (ESSAI === 'porte-sans-arret') for (const P of PORTES) if (P.porte && !ouvrable(P)) e[P.id] = 1;
  etats.set(A.id, e); await portes(A);
  let n = await voisins(A);
  for (const P of PORTES) {
    if (!ouvrable(P) || genant(A, P) || ESSAI === 'vantail') continue;
    e[P.id] = 1 - e[P.id]; await portes(A); const m = await voisins(A);
    if (mieux(m, n)) n = m; else { e[P.id] = 1 - e[P.id]; await portes(A); }
  }
}

tPhase('portes');
const liens = new Map(stops.map(s => [s.id, []]));
const ancres = new Map(); // « A>B » → point du monde visé par le point de passage
const lie = (A, B, P, extra = {}) => { ancres.set(A.id + '>' + B.id, P); const a = angles(O3(A), P); liens.get(A.id).push({ vers: B.id, lacet: r3(a.lacet), tangage: r3(a.tangage), d: r3(a.d), ...extra }); };
const lies = (A, B) => liens.get(A.id).some(l => l.vers === B.id), aTerminer = [];
for (let i = 0; i < stops.length; i++) for (let j = i + 1; j < stops.length; j++) {
  const A = stops[i], B = stops[j]; if (A.level !== B.level) continue;
  await portes(A); const pAB = await lienDirect(A, B);
  await portes(B); const pBA = await lienDirect(B, A);
  if (pAB && pBA) { lie(A, B, pAB); lie(B, A, pBA); }
  else if (pAB || pBA) aTerminer.push([A, B, pAB, pBA]); // un sens seulement : l'autre sera cherché le long du chemin de marche
}
tPhase('liens directs');
// arrêts d'un même niveau qui ne se voient pas du tout (séjour au bout d'un couloir) : chemin de marche le plus court, jamais à travers la
// pièce d'un autre arrêt ; le point de passage est le point de ce chemin le plus avancé dont on voit le disque entier (l'entrée du couloir)
// via : point de passage imposé (passage entre les deux pièces : le chemin le plus court passerait par une troisième)
const chemin = (A, B, via = null) => page.evaluate((A, B, via) => {
  let P;
  if (via) { const P1 = __v.findPath(A.pe[0], A.pe[1], A.level, via[0], via[1], A.level), P2 = __v.findPath(via[0], via[1], A.level, B.pe[0], B.pe[1], B.level); P = P1 && P2 ? [...P1, ...P2.slice(1)] : null; }
  else P = __v.findPath(A.pe[0], A.pe[1], A.level, B.pe[0], B.pe[1], B.level);
  if (!P || P.length < 2) return null;
  const pts = [], pieces = new Set(); let L = 0;
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); for (let t = 0; t < d; t += 0.2) pts.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t / d, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t / d]); L += d; }
  for (const q of pts) { const r = __v.roomAtLv(q[0], q[1], A.level); if (r) pieces.add(r.of || r.id); }
  return { L, pts, pieces: [...pieces] };
}, A, B, via);
const parChemin = async (A, B, ch) => {
  const y = D.levels[A.level].y + 0.03, c = ch.pts.filter(p => Math.hypot(p[0] - A.pe[0], p[1] - A.pe[1]) >= 0.9).reverse().map(p => [p[0], y, p[1]]);
  return c.length ? premierPropre(A, B, c) : null;
};
const honnete = (ch, A, B) => ch && !ch.pieces.some(r => r !== A.room && r !== B.room && piecesArret.includes(r));
const relieParChemin = async (A, B, via = null) => {
  const ch = await chemin(A, B, via); if (!honnete(ch, A, B)) return false;
  // chaque sens : le long du chemin, sinon en vue directe (le séjour voit la porte de la salle de bains ; la salle de bains, le couloir)
  await portes(A); const pAB = await parChemin(A, B, ch) || await lienDirect(A, B);
  await portes(B); const pBA = await parChemin(B, A, { pts: ch.pts.slice().reverse() }) || await lienDirect(B, A);
  if (pAB && pBA) { lie(A, B, pAB); lie(B, A, pBA); return true; }
  return false;
};
for (const [A, B] of aTerminer) if (!lies(A, B)) await relieParChemin(A, B);
for (let k = 0; k < D.levels.length; k++) {
  const S = stops.filter(s => s.level === k), essais = new Set();
  for (;;) {
    const grp = new Map(S.map(s => [s.id, s.id])), f = x => grp.get(x) === x ? x : f(grp.get(x));
    for (const s of S) for (const l of liens.get(s.id)) if (grp.has(l.vers)) grp.set(f(s.id), f(l.vers));
    let best = null;
    for (const A of S) for (const B of S) if (A.id < B.id && f(A.id) !== f(B.id) && !essais.has(A.id + '>' + B.id)) {
      const ch = await chemin(A, B); if (!honnete(ch, A, B)) { essais.add(A.id + '>' + B.id); continue; }
      if (!best || ch.L < best.ch.L) best = { A, B, ch };
    }
    if (!best) break;
    essais.add(best.A.id + '>' + best.B.id); await relieParChemin(best.A, best.B);
  }
}
tPhase('chemins');
// deux pièces qui communiquent directement (passage ou porte) et qui ont chacune un arrêt : lien direct entre ces arrêts
const passages = (plan.passages || []).map(p => ({ a: p.a, b: p.b, level: p.level ?? 0, p: p.p }));
for (const p of passages) {
  const A = stops.find(s => s.room === p.a && s.level === p.level), B = stops.find(s => s.room === p.b && s.level === p.level);
  if (A && B && !lies(A, B) && !await relieParChemin(A, B) && p.p) await relieParChemin(A, B, p.p);
}
tPhase('passages');
// escaliers : l'arrêt de chaque niveau qui voit le mieux la volée (celui qui en a le rôle, sinon le plus proche du bout de la volée de son
// niveau qui en voit une marche) ; point sur la volée, disque vu en entier en travers de la marche
for (const st of D.stairs) {
  const [a, b] = [st.line[0], st.line[st.line.length - 1]], haut = (st.n || 15) * (st.rise || 0.18), y0 = D.levels[st.from].y;
  const u = [(b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]), (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1])], nrm = [-u[1], u[0]];
  const pt = f => [a[0] + (b[0] - a[0]) * f, y0 + f * haut + 0.06, a[1] + (b[1] - a[1]) * f];
  const bordEsc = [[nrm[0] * 0.18, nrm[1] * 0.18], [-nrm[0] * 0.18, -nrm[1] * 0.18]].map(v => v.map(r3));
  const cherche = async (lv, fs, bout) => {
    const cands = stops.filter(s => s.level === lv).sort((p, q) => (q.stair === st.id) - (p.stair === st.id) || Math.hypot(p.pe[0] - bout[0], p.pe[1] - bout[1]) - Math.hypot(q.pe[0] - bout[0], q.pe[1] - bout[1]));
    for (const s of cands) {
      // disque sur la marche (±18 cm en travers), sinon son centre (vue plongeante d'en haut : la marche suivante cache ses bords)
      await portes(s); const P = await disque(O3(s), fs.map(pt), bordEsc) || await visible(O3(s), fs.map(pt)); if (P) return { s, P };
    }
    return null;
  };
  const bas = await cherche(st.from, [0.3, 0.2, 0.4, 0.1, 0.5], a), hautS = await cherche(st.to, [0.8, 0.7, 0.9, 0.6, 0.5], b);
  if (!bas || !hautS) { pb(`Escalier : aucun arrêt ne voit la volée depuis le niveau ${!bas ? D.levels[st.from].name : D.levels[st.to].name}`); continue; }
  lie(bas.s, hautS.s, bas.P, { escalier: 'monter' }); lie(hautS.s, bas.s, hautS.P, { escalier: 'descendre' });
}
/* cercles confondus (voir confondusPts) : on déplace d'abord l'un des deux ; sinon un seul est gardé, le plus proche (le plus lointain
   reste atteignable par lui), jamais celui de l'escalier, jamais si un arrêt devient inatteignable. */
const parArret = Object.fromEntries(stops.map(s => [s.id, s]));
const confondus = (A, l, m) => confondusPts(A, ancres.get(A.id + '>' + l.vers), ancres.get(A.id + '>' + m.vers), !!l.escalier, !!m.escalier);
const atteint = () => {
  const vu = new Set([stops[0].id]), file = [stops[0].id];
  while (file.length) for (const l of liens.get(file.shift())) if (!vu.has(l.vers)) { vu.add(l.vers); file.push(l.vers); }
  return vu.size === stops.length;
};
tPhase('escaliers');
// d'abord, déplacer l'un des deux cercles (autre point du sol de la pièce voisine, ou plus loin devant la porte, ou décalé le long d'elle)
if (ESSAI !== 'confondus') for (const A of stops) {
  await portes(A);
  for (let tour = 0; tour < 6; tour++) {
    const L = liens.get(A.id); let paire = null;
    for (let i = 0; i < L.length && !paire; i++) for (let j = i + 1; j < L.length && !paire; j++) if (confondus(A, L[i], L[j])) paire = [L[i], L[j]];
    if (!paire) break;
    let fait = false;
    for (const l of paire.filter(l => !l.escalier).sort((x, y) => x.d - y.d)) {
      const B = parArret[l.vers], autres = L.filter(m => m !== l).map(m => ({ P: ancres.get(A.id + '>' + m.vers), esc: !!m.escalier }));
      const cands = [...await candPointe(A, B), ...candPorte(A, B, [0.45, 0.7, 0.95, 1.2], [0, 0.25, -0.25, 0.45, -0.45])].filter(q => autres.every(o => !confondusPts(A, q, o.P, false, o.esc)));
      const P = cands.length ? await premierPropre(A, B, cands) : null;
      if (P) { const a = angles(O3(A), P); ancres.set(A.id + '>' + B.id, P); Object.assign(l, { lacet: r3(a.lacet), tangage: r3(a.tangage), d: r3(a.d) }); fait = true; break; }
    }
    if (!fait) break;
  }
}
if (ESSAI !== 'confondus') for (const A of stops) for (let encore = true; encore;) {
  encore = false;
  const L = liens.get(A.id);
  cherche: for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    if (!confondus(A, L[i], L[j])) continue;
    const ordre = [L[i], L[j]].filter(l => !l.escalier).sort((x, y) => y.d - x.d); // premier : à retirer
    for (const l of ordre) {
      const X = parArret[l.vers], avant = [liens.get(A.id), liens.get(X.id)];
      liens.set(A.id, avant[0].filter(m => m.vers !== X.id)); liens.set(X.id, avant[1].filter(m => m.vers !== A.id));
      if (atteint()) { encore = true; break cherche; }
      liens.set(A.id, avant[0]); liens.set(X.id, avant[1]);
    }
  }
}

if (process.env.PANO_DEBUG) for (const s of stops) console.log('liens', s.id, JSON.stringify(s.pe), JSON.stringify(etats.get(s.id)), liens.get(s.id).map(l => `${l.vers}:${l.d}${l.escalier ? '/' + l.escalier : ''}`).join(' '));
tPhase('confondus');
/* placards et tableau électrique (retour R2, D201 : placard de l'entrée ouvert sur la niche du tableau, étagère et tringle vues par le côté,
   coffret posé seul comme un panneau) : chaque côté d'un placard autre que sa façade est contre la matière (mur, cloison, gaine) ou donne
   sur un espace fermé (placard voisin) ; le coffret du tableau est adossé à la matière sur un côté au moins, ou dans un placard. Sondes
   tous les 5 cm, à 3 cm hors du côté, à 0,5, 1,2 et 1,8 m du sol ; un côté est ouvert si plus de 15 % de ses sondes sont vues depuis
   l'œil d'un arrêt (portes dans l'état de son panorama). La pièce ne suffit pas : au D201, la niche du tableau appartenait à la pièce
   masquée du placard, et se voyait pourtant depuis l'entrée. */
const PLAC = await page.evaluate(() => {
  const G = App.geo, out = [], id = r => r && (r.of || r.id);
  for (const L of App.D.L || []) {
    const mat = p => L.walls.some(w => !w.virtual && w.quad && G.pointInPoly(p[0], p[1], w.quad)) || (L.gaines || []).some(g => G.pointInPoly(p[0], p[1], g.poly))
      || (L.masses || []).some(m => G.pointInPoly(p[0], p[1], m.poly) && !(m.trous || []).some(h => G.pointInPoly(p[0], p[1], h)));
    const fx = (L.fixtures || []).filter(f => f.x && f.z), rect = f => [Math.min(...f.x), Math.max(...f.x), Math.min(...f.z), Math.max(...f.z)];
    const dansRect = (p, r) => p[0] > r[0] && p[0] < r[1] && p[1] > r[2] && p[1] < r[3];
    const cotes = r => ({ n: [[r[0], r[2]], [r[1], r[2]], [0, -1]], s: [[r[0], r[3]], [r[1], r[3]], [0, 1]], w: [[r[0], r[2]], [r[0], r[3]], [-1, 0]], e: [[r[1], r[2]], [r[1], r[3]], [1, 0]] });
    const sondes = (a, b, n) => { const L_ = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(3, Math.round(L_ / 0.05)); return Array.from({ length: k - 1 }, (_, i) => { const t = (i + 1) / k; return [a[0] + (b[0] - a[0]) * t + n[0] * 0.03, a[1] + (b[1] - a[1]) * t + n[1] * 0.03]; }); };
    // pièce d'où l'on voit l'équipement : devant la façade d'un placard, sinon au centre (le placard est souvent une pièce masquée)
    const nomPiece = f => { const r0 = rect(f), [a, b, n] = cotes(r0)[f.face] || [[(r0[0] + r0[1]) / 2, (r0[2] + r0[3]) / 2], [(r0[0] + r0[1]) / 2, (r0[2] + r0[3]) / 2], [0, 0]];
      const r = __v.roomAtLv((a[0] + b[0]) / 2 + n[0] * 0.3, (a[1] + b[1]) / 2 + n[1] * 0.3, L.k); const q = r && App.D.rooms.find(x => x.id === id(r)); return (q && (q.name || q.id)) || ''; };
    for (const f of fx) {
      const r = rect(f), autres = fx.filter(g => g !== f && g.type === 'placard').map(rect); // un placard voisin est fermé ; la niche d'un tableau, non
      if (f.type === 'placard') for (const [c, [a, b, n]] of Object.entries(cotes(r))) {
        if (c === f.face) continue;
        const S = sondes(a, b, n), libres = S.filter(p => !mat(p) && !autres.some(q => dansRect(p, q)));
        if (libres.length > 0.15 * S.length) out.push({ placard: `Placard de « ${nomPiece(f)} » ouvert sur le côté ${c}`, n: S.length, lv: L.k, pts: libres.flatMap(p => [0.5, 1.2, 1.8].map(h => [p[0], __v.levels[L.k].y + h, p[1]])) });
      }
      if (f.type === 'tableau') {
        const dans = fx.some(g => g.type === 'placard' && (() => { const q = rect(g); return r[0] >= q[0] - 0.02 && r[1] <= q[1] + 0.02 && r[2] >= q[2] - 0.02 && r[3] <= q[3] + 0.02; })());
        const adosse = Object.values(cotes(r)).some(([a, b, n]) => { const S = sondes(a, b, n); return S.filter(mat).length >= 0.8 * S.length; });
        if (!dans && !adosse) out.push({ texte: `Tableau électrique de « ${nomPiece(f)} » adossé à rien : le coffret flotte dans la pièce` });
      }
    }
  }
  return out;
});
for (const P of PLAC) {
  if (P.texte) { pb(P.texte); continue; }
  const vus = new Set();
  for (const s of stops.filter(s => s.level === P.lv)) { await portes(s); (await page.evaluate((o, c) => __pz.vus(o, c), O3(s), P.pts)).forEach((v, i) => { if (v) vus.add(Math.floor(i / 3)); }); }
  if (process.env.PANO_DEBUG) console.log('placard', P.placard, P.n, P.pts.length / 3, vus.size);
  if (vus.size > 0.15 * P.n) pb(`${P.placard} : son intérieur se voit (${Math.round(100 * vus.size / P.n)} % du côté)`);
}
/* ---------- regards (retour R1 : « on finit la tête dans le mur ») : anneau de profondeur de chaque arrêt (portes dans l'état de son
   panorama), puis vue de départ de chaque arrêt, regard d'arrivée de chaque lien et tangage, choisis et contrôlés par moteur/pano-regard.mjs
   sur tout le champ de l'écran (profondeur, mur nu, fenêtres, obstacles proches) ---------- */
const anneaux = {}, dans = {}, verres = {}, equips = {};
for (const s of stops) { await portes(s); const A = await page.evaluate(o => __pz.anneau(o), O3(s)); anneaux[s.id] = A.prof; verres[s.id] = A.verre; equips[s.id] = A.equip; dans[s.id] = await page.evaluate((o, lv, r, p) => __pz.dansPiece(o, lv, r, p), O3(s), s.level, s.room, anneaux[s.id]); }
// --regards=<fichier> : données des regards (arrêts, liens, anneaux) écrites pour les essais hors rendu, puis arrêt
if (opt('regards')) {
  fs.writeFileSync(String(opt('regards')), JSON.stringify({ stops: stops.map(s => ({ id: s.id, label: s.label, room: s.room, level: s.level, pe: s.pe, yaw: s.yaw, pitch: s.pitch, dehors: s.dehors })),
    liens: Object.fromEntries(stops.map(s => [s.id, liens.get(s.id)])), ancres: Object.fromEntries(ancres), anneaux, dans, verres, equips }));
  if (problemes.length) console.log('PROBLEMES ' + JSON.stringify(problemes));
  await browser.close(); server.close(); process.exit(0);
}
const RDA = s => ({ prof: anneaux[s.id], dans: dans[s.id], verre: verres[s.id], equip: equips[s.id], dehors: s.dehors });
for (const s of stops) { s.vue = RG.vueDepart(RDA(s), s.yaw); s.tangageVue = RG.tangage(RDA(s)); }
for (const A of stops) for (const l of liens.get(A.id)) {
  const B = parArret[l.vers], P = ancres.get(A.id + '>' + B.id);
  l.marche = r3(Math.hypot(P[0] - B.pe[0], P[2] - B.pe[1]) > 0.8 ? cap2([P[0], P[2]], B.pe) : l.lacet);
  l.arrivee = r3(RG.arrivee(RDA(B), { lacet: l.lacet, vue: B.vue }));
}
if (ESSAI === 'arrivee') { const A = stops.find(s => liens.get(s.id).length), l = liens.get(A.id)[0], B = parArret[l.vers]; let a = 0, m = 99; for (let k = 0; k < 360; k++) if (anneaux[B.id][k] < m) { m = anneaux[B.id][k]; a = k * DEG; } l.arrivee = r3(angD(a)); }

tPhase('arrivees');
/* ---------- rendu des panoramas ---------- */
// avant, gauche, arrière, droite, haut, bas ; --rotation=<degrés> tourne le cube (vérification : les coutures changent de place, l'image non)
const ROT = (+opt('rotation') || 0) * DEG;
const FACES = [[ROT, 0], [ROT + Math.PI / 2, 0], [ROT + Math.PI, 0], [ROT - Math.PI / 2, 0], [ROT, Math.PI / 2], [ROT, -Math.PI / 2]];
const TARGET = plan.simple ? 0.56 : 0.50;
const EXPO = ESSAI === 'exposition' ? [0.5, 2.4] : [0.2, 2.4]; // bornes de l'exposition (0,35 bloquait WC et salles de bain, plus clairs de 15 à 20 %)
const grab = () => page.evaluate(() => new Promise(res => { __v.invalidate(3); requestAnimationFrame(() => requestAnimationFrame(() => {
  const src = document.getElementById('gl'), c = document.createElement('canvas'); c.width = 96; c.height = 96; const g = c.getContext('2d'); g.drawImage(src, 0, 0, 96, 96);
  const d = g.getImageData(0, 0, 96, 96).data; let s = 0, hi = 0; for (let i = 0; i < d.length; i += 4) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; s += l; if (l > 0.97) hi++; }
  res({ mean: s / (d.length / 4), clip: hi / (d.length / 4) });
})); }));
const vise = (s, [yaw, pitch]) => page.evaluate((s, yaw, pitch) => {
  const w = __v.walk; w.anim = null; w.glide = null; w.userFov = true; w.fov = 2 * MARGE_; w.x = s.pe[0]; w.z = s.pe[1]; w.yaw = yaw; w.pitch = pitch;
  if (App.D.multi) { w.lv = s.level; w.y = __v.levels[s.level].y; w.st = null; }
  __v.camera.fov = 2 * MARGE_; __v.camera.updateProjectionMatrix(); __v.setWalkCamera(); __v.invalidate(3);
}, s, yaw, pitch);
const cliche = i => page.evaluate(i => new Promise(res => { __v.invalidate(3); requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => { res(i); }))); }), i);
await page.evaluate(m => { window.MARGE_ = m; }, MARGE);
const AVEC_AO = ESSAI !== 'sans-occlusion';
// points de mesure dans le panorama (luminance de part et d'autre d'une arête ou d'une contremarche) : préparés par arrêt
const mesuresImage = await import('./pano-mesures.mjs').then(m => m.preparer({ page, D, stops, plan, O3, angles, visible, portes })).catch(e => { console.log('[mesures]', e.message); return null; });
const faits = [];
for (const s of stops) {
  const t0 = Date.now();
  await portes(s); await vise(s, FACES[0]);
  const bad = await page.evaluate(s => { const r = __v.roomAtLv(s.pe[0], s.pe[1], s.level); return r ? null : 'hors de toute pièce de son niveau'; }, s);
  if (bad) { pb(`${s.label} : ${bad}, panorama non rendu`); console.log('PANO ' + JSON.stringify({ arret: s.id, statut: 'echec' })); continue; }
  await page.evaluate(() => __v.queueProbes());
  for (let i = 0; i < 160; i++) { await wait(250); if (!(await page.evaluate(() => __v.probe.queue.length))) break; }
  await page.evaluate(() => { __v.autoExp.k = __v.autoExp.target; __v.applyEnv(); App.set('exposure', 1); });
  await wait(LOGICIEL ? 2500 : 1200);
  // exposition unique : luminance moyenne des quatre vues horizontales (occlusion comprise), à basse résolution
  await setAO(AVEC_AO); await setPR(0.125); let k = 1, borne = false;
  for (let it = 0; it < 5; it++) {
    let m = 0, clip = 0; for (let f = 0; f < 4; f++) { await vise(s, FACES[f]); const r = await grab(); m += r.mean / 4; clip += r.clip / 4; }
    const f = Math.pow(TARGET / Math.max(0.02, m), 1.3) * (clip > 0.03 ? 0.85 : 1);
    if (Math.abs(f - 1) < 0.04) break;
    const k2 = Math.min(EXPO[1], Math.max(EXPO[0], k * f)); borne = k2 !== k * f; k = k2; await page.evaluate(k => App.set('exposure', k), k); await wait(300);
  }
  await setPR(1); await wait(300);
  const tr = Date.now();
  // chaque face : sans occlusion, puis avec (le rapport des deux est gardé)
  for (const ao of AVEC_AO ? [false, true] : [false]) {
    await setAO(ao);
    for (let f = 0; f < 6; f++) {
      // essai négatif du contrôle des coutures : une face exposée 15 % plus fort doit être refusée
      if (ESSAI === 'couture') await page.evaluate(v => { App.set('exposure', v); }, f === 1 ? k * 1.15 : k);
      await vise(s, FACES[f]); await cliche(f); await page.evaluate((i, ao) => __pano.face(i, ao), f, ao);
    }
  }
  if (!AVEC_AO) await page.evaluate(() => __pano.sansAO());
  await setAO(false);
  const rendu = (Date.now() - tr) / 1000;
  const cout = await page.evaluate(() => __pano.coutures(0)), coutAO = AVEC_AO ? await page.evaluate(() => __pano.coutures(1)) : [0];
  for (const L of TAILLES) fs.writeFileSync(path.join(outDir, `${s.id}-${L}.jpg`), Buffer.from((await page.evaluate((L, q) => __pano.equi(L, q), L, L > 4096 ? 0.84 : L > 2048 ? 0.86 : 0.85)).split(',')[1], 'base64'));
  // mesures sur l'image (la dernière rendue : 2048 ou le plus petit) : arêtes des murs, contremarches
  if (mesuresImage) await mesuresImage.mesurer(s, pb, mesures);
  const ap = await page.evaluate(() => __pano.apercu(0.8));
  fs.writeFileSync(path.join(outDir, `${s.id}-512.jpg`), Buffer.from(ap.url.split(',')[1], 'base64'));
  const duree = (Date.now() - t0) / 1000, cmax = Math.max(...cout), cmoy = cout.reduce((a, b) => a + b, 0) / cout.length, amax = Math.max(...coutAO);
  const statut = ap.moyenne < 0.05 || ap.ecart < 0.03 || ap.noir > 0.25 ? 'ecartee' : 'ok';
  if (statut !== 'ok') pb(`${s.label} : panorama noir ou uniforme (luminance ${ap.moyenne.toFixed(2)}, écart ${ap.ecart.toFixed(3)})`);
  if (cmax > SEUIL_COUTURE) pb(`${s.label} : couture visible entre deux faces (écart ${cmax.toFixed(1)} sur 255, seuil ${SEUIL_COUTURE})`);
  if (amax > SEUIL_COUTURE_AO) pb(`${s.label} : ombre des angles très différente d'une face à l'autre (écart ${amax.toFixed(1)} sur 255, seuil ${SEUIL_COUTURE_AO})`);
  if (borne) pb(`${s.label} : exposition bloquée à sa borne (${k.toFixed(2)}) : image trop claire ou trop sombre`);
  mesures.panoramas.push({ arret: s.id, duree_s: +duree.toFixed(1), rendu_faces_s: +rendu.toFixed(1), exposition: +k.toFixed(2), luminance: +ap.moyenne.toFixed(3), couture_max: +cmax.toFixed(2), couture_moy: +cmoy.toFixed(2), couture_ao_max: +amax.toFixed(2) });
  faits.push(s.id);
  console.log('PANO ' + JSON.stringify({ arret: s.id, statut, duree: +duree.toFixed(1), luminance: +ap.moyenne.toFixed(2), couture: +cmax.toFixed(1), couture_ao: +amax.toFixed(1), exposition: +k.toFixed(2) }));
}
await page.evaluate(() => App.set('exposure', 1));
mesures.total_s = +((Date.now() - T0) / 1000).toFixed(1);

/* ---------- visite.json : le strict nécessaire pour passer d'arrêt en arrêt ---------- */
// noms montrés : ceux du tableau des surfaces quand il donne la même pièce (« Séjour Cuisine » lu sur deux lignes → « Séjour / Cuisine »),
// abréviations du plan développées (« SDB » → « Salle de bains »), capitales ramenées (« SALON / CUISINE » → « Salon / Cuisine »)
const ABREV = { SDB: 'Salle de bains', SDE: "Salle d'eau", DGT: 'Dégagement', DEGT: 'Dégagement', CH: 'Chambre', ENT: 'Entrée', CELL: 'Cellier', SEJ: 'Séjour', RGT: 'Rangement', PL: 'Placard', CUIS: 'Cuisine', BUR: 'Bureau', BAL: 'Balcon' };
const norme = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const surfaces = ((plan.fiche || {}).surfaces || []).map(r => Array.isArray(r) ? r[0] : r && r.nom).filter(t => typeof t === 'string' && t.trim());
const nom = t => {
  t = String(t || '').trim();
  // la ligne du tableau des surfaces, si elle sépare ce que le nom colle (« Séjour Cuisine » → « Séjour / Cuisine »)
  const f = ESSAI !== 'separateur' && surfaces.find(x => norme(x) === norme(t) && /[/-]/.test(x) && !/[/-]/.test(t)); if (f) t = f;
  const mots = t.split(/(\s+|\/|-)/);
  return mots.map((w, i) => {
    const A = ABREV[w.toUpperCase()]; if (A && w.length <= 4 && w === w.toUpperCase()) return i ? A.toLowerCase() : A;
    return /^[A-ZÀ-Ý]{3,}$/.test(w) && w !== 'WC' ? w[0] + w.slice(1).toLowerCase() : w;
  }).join('').replace(/\s+/g, ' ');
};
const surfaceDe = s => { const r = (plan.rooms || []).find(q => q.id === s.room), v = r && parseFloat(String(r.area || '').replace(',', '.')); return v > 0.5 ? `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m²` : null; };
const garde = new Set(faits);
const version = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const visite = {
  titre: D.titre,
  version,
  tailles: TAILLES,
  niveaux: D.levels.map((l, k) => ({ nom: l.name, plan: `niveau-${k}.png`, ratio: +(BW / BH).toFixed(4) })),
  depart: faits[0],
  arrets: stops.filter(s => garde.has(s.id)).map(s => ({
    id: s.id, nom: ESSAI === 'noms' ? String(s.label).toUpperCase() : nom(s.label), niveau: s.level, nomNiveau: D.levels[s.level].name, surface: surfaceDe(s),
    carte: [r3((s.pe[0] - bx0) / BW), r3((s.pe[1] - bz0) / BH)], pos: [r3(s.pe[0]), r3(s.pe[1])], cap: r3(s.vue), tangage: r3(s.tangageVue ?? Math.min(0.08, Math.max(-0.12, s.pitch ?? -0.06))),
    liens: liens.get(s.id).filter(l => garde.has(l.vers)).map(({ marche, ...l }) => l),
  })),
};
if (!D.multi) visite.niveaux[0].nom = '';
fs.writeFileSync(path.join(outDir, 'visite.json'), JSON.stringify(visite));
// page autonome : visionneuse copiée dans le dossier, adresses versionnées (le navigateur ne garde jamais une ancienne image) ; visite.json
// et l'aperçu du premier arrêt demandés dès la page lue, en même temps que le script (trois allers-retours de moins)
const v = `?v=${version}`;
const pre = `<link rel="preload" href="visite.json${v}" as="fetch" crossorigin="anonymous">\n<link rel="preload" href="${encodeURIComponent(visite.depart)}-512.jpg${v}" as="fetch" crossorigin="anonymous">`;
fs.copyFileSync(path.join(root, 'moteur', 'pano.js'), path.join(outDir, 'visionneuse.js'));
fs.writeFileSync(path.join(outDir, 'index.html'), fs.readFileSync(path.join(root, 'moteur', 'pano.html'), 'utf8')
  .replace('<!--prechargement-->', visite.depart ? pre : '').replace('src="visionneuse.js"', `src="visionneuse.js${v}"`)
  .replace('<html lang="fr">', `<html lang="fr" data-version="${version}">`));

/* ---------- contrôles du graphe et de la géométrie ---------- */
const ids = visite.arrets.map(a => a.id), parId = Object.fromEntries(visite.arrets.map(a => [a.id, a]));
for (const s of stops) if (!garde.has(s.id)) pb(`${s.label} : pas de panorama`);
for (const a of visite.arrets) for (const l of a.liens) if (!parId[l.vers].liens.some(m => m.vers === a.id)) pb(`${a.nom} → ${parId[l.vers].nom} : lien sans retour`);
if (ids.length) {
  const vu = new Set([ids[0]]), file = [ids[0]];
  while (file.length) for (const l of parId[file.shift()].liens) if (!vu.has(l.vers)) { vu.add(l.vers); file.push(l.vers); }
  for (const a of visite.arrets) if (!vu.has(a.id)) pb(`${a.nom}${D.multi ? ' (' + a.nomNiveau + ')' : ''} : inatteignable depuis le premier arrêt`);
  for (let k = 0; k < D.levels.length; k++) if (!visite.arrets.some(a => a.niveau === k && vu.has(a.id))) pb(`Niveau ${D.levels[k].name} : inatteignable par l'escalier`);
}
for (const a of visite.arrets) if (!a.liens.length) pb(`${a.nom} : aucun point de passage`);
const S_ = id => stops.find(s => s.id === id);
const deg = a => Math.round(a / DEG);
for (const a of visite.arrets) {
  const s = S_(a.id), e = etats.get(s.id) || {};
  // cercles l'un sur l'autre, dans la pièce ou à l'écran
  for (let i = 0; i < a.liens.length; i++) for (let j = i + 1; j < a.liens.length; j++)
    if (confondus(s, a.liens[i], a.liens[j])) pb(`${a.nom} : points de passage vers ${parId[a.liens[i].vers].nom} et ${parId[a.liens[j].vers].nom} confondus`);
  // point de vue dans le débattement ou trop près d'un vantail ouvert ; porte ouverte vers une pièce sans arrêt ; point de vue dans la cuisine
  for (const V of VANTAUX) if (V.lv === s.level && e[V.id]) {
    const dv = dVantail(V, s.pe);
    if (debattement(V, s.pe, 0) || dv < s.palier.vmin) pb(`${a.nom} : vantail de la porte « ${PORTES.find(P => P.id === V.id).label} » à ${dv.toFixed(2)} m de l'œil`);
  }
  for (const P of PORTES) if (e[P.id] && P.porte && !ouvrable(P)) pb(`${a.nom} : porte « ${P.label} » ouverte sur une pièce sans point de vue`);
  const cz = s.palier.cuis; if (D.cuisine.some(k => k.level === s.level && s.pe[0] > k.r[0] - cz && s.pe[0] < k.r[1] + cz && s.pe[1] > k.r[2] - cz && s.pe[1] < k.r[3] + cz)) pb(`${a.nom} : point de vue dans la cuisine ou sur un équipement`);
  // point de vue dégagé (constat du 28/09/2026, retour R1 : deux murs à 50 cm sur la moitié du tour) : dans une pièce de plus de 7 m²,
  // moins d'un quart du tour d'horizon à moins d'1 m
  { const piece = await page.evaluate((id, lv) => { const r = App.D.rooms.find(q => (q.of || q.id) === id && (q.level || 0) === lv && !q.of); if (!r) return 0; let a = 0; const q = r.poly; for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; } return Math.abs(a) / 2; }, s.room, s.level);
    const pres = anneaux[s.id].filter(d => d < 1).length / anneaux[s.id].length;
    // « quand la pièce le permet » : un point permis (hors débattement, cuisine, passages et arrêts voisins en vue) s'écartait nettement plus
    if (piece > 7 && pres > 0.25 && s.degage != null && s.degage < Math.min(1.0, s.degageMax ?? 0) - 0.1) pb(`${a.nom} : point de vue collé aux murs (${Math.round(pres * 100)} % du tour à moins d'1 m, ${Math.min(1, s.degageMax).toFixed(2)} m de dégagement possible)`);
    else if (piece > 7 && pres > 0.25) console.log(`${a.nom} : ${Math.round(pres * 100)} % du tour à moins d'1 m (${(s.degageMax ?? 0).toFixed(2)} m de dégagement au plus en gardant les pièces voisines en vue)`); }
  // vue de départ : tout le champ de l'écran (obstacles proches, mur nu, pièce bien montrée), et tangage des pièces exiguës
  for (const t of RG.defauts(RDA(s), a.cap)) pb(`${a.nom} : vue de départ ${t}`);
  if (RG.tangage(RDA(s)) != null && a.tangage > RG.tangage(RDA(s)) + 1e-3) pb(`${a.nom} : pièce exiguë regardée à hauteur d'œil (tangage ${a.tangage})`);
  for (const l of a.liens) {
    const B = S_(l.vers), P = ancres.get(s.id + '>' + B.id);
    // arrivée : jamais face à un mur proche ni à un mur nu, à ECART_CAP au plus du cap (regard vers le cercle touché)
    { const R = RDA(B), { cone: c, degage: dg } = RG.palierArrivee(R, l.lacet);
      for (const t of RG.defauts(R, l.arrivee, a_ => RG.permisCone(l.lacet, c)(a_) && (!dg || RG.degagee(R, a_, dg)))) pb(`${a.nom} → ${parId[l.vers].nom} : arrivée ${t}`); }
    if (Math.abs(angD(l.arrivee - l.lacet)) > RG.ECART_CAP * DEG + 1e-3) pb(`${a.nom} → ${parId[l.vers].nom} : regard d'arrivée à ${deg(Math.abs(angD(l.arrivee - l.lacet)))}° du cap`);
    // arrivée dans le sens de la marche (60° au plus quand une direction dégagée y existe) et dégagée (1,5 m devant, 1 m sur ±30°) quand la
    // pièce le permet (constat du 28/09/2026 : rotations de 135°, arrivée à 0,8 m d'un miroir)
    { const R = RDA(B), { cone: c, degage: dg } = RG.palierArrivee(R, l.lacet), e = Math.abs(angD(l.arrivee - l.lacet)) / DEG;
      if (e > c + 1e-3) pb(`${a.nom} → ${parId[l.vers].nom} : regard d'arrivée à ${e.toFixed(0)}° du sens de la marche (${c}° au plus)`);
      if (dg && !RG.degagee(R, l.arrivee, dg)) pb(`${a.nom} → ${parId[l.vers].nom} : arrivée face à un obstacle proche (${R.prof[((Math.round(l.arrivee / DEG) % 360) + 360) % 360].toFixed(2)} m devant)`); }
    // cercle : disque hors des vantaux ouverts, vu en entier, ligne de vue hors de la pièce d'un autre arrêt
    const r = l.escalier ? R_CERCLE_ESC : R_CERCLE;
    if (vantauxOuverts(s).some(V => dVantail(V, [P[0], P[2]]) < r + 0.05)) pb(`${a.nom} : cercle vers ${parId[l.vers].nom} posé sur un vantail ouvert`);
    await portes(s);
    if (!l.escalier && await page.evaluate((o, c, b) => __pz.bordCache(o, c, b), O3(s), P, BORD(R_CERCLE, 12))) pb(`${a.nom} : cercle vers ${parId[l.vers].nom} en partie derrière un mur`);
    if (!l.escalier && await page.evaluate((a, b, lv, P, X) => __pz.traverse(a, b, lv, P, X), s.pe, [P[0], P[2]], s.level, piecesArret, [s.room, B.room]) > 0.15) pb(`${a.nom} : cercle vers ${parId[l.vers].nom} vu à travers la pièce d'un autre arrêt`);
  }
}
// deux arrêts d'un même niveau trop proches (panoramas presque identiques)
// (de part et d'autre d'une cloison, ils ne se voient pas : deux panoramas différents)
for (let i = 0; i < stops.length; i++) for (let j = i + 1; j < stops.length; j++) {
  const A = stops[i], B = stops[j], d = Math.hypot(A.pe[0] - B.pe[0], A.pe[1] - B.pe[1]);
  if (A.level === B.level && d < ARRETS_MIN) { await portes(A); if (A.room === B.room || await visible(O3(A), [O3(B)])) pb(`${A.label} et ${B.label} : points de vue à ${d.toFixed(2)} m l'un de l'autre`); }
}
// pièces qui communiquent : lien direct
for (const p of passages) { const A = stops.find(s => s.room === p.a && s.level === p.level), B = stops.find(s => s.room === p.b && s.level === p.level); if (A && B && garde.has(A.id) && garde.has(B.id) && !lies(A, B)) pb(`${parId[A.id].nom} et ${parId[B.id].nom} communiquent sans point de passage direct`); }
// noms : aucun texte technique, pas de capitales ni d'abréviation, nom du tableau des surfaces quand il donne la même pièce
for (const t of [...visite.arrets.map(a => a.nom), ...visite.niveaux.map(n => n.nom), visite.titre]) if (/[_{}<>]|undefined|null|NaN|\.(jpg|png|json)/i.test(t || '')) pb(`Texte technique montré : « ${t} »`);
for (const a of visite.arrets) {
  if (a.nom.split(/[\s/-]+/).some(w => /^[A-ZÀ-Ý]{3,}$/.test(w) && w !== 'WC')) pb(`Nom en capitales ou abrégé : « ${a.nom} »`);
  if (surfaces.some(x => norme(x) === norme(a.nom) && /[/-]/.test(x) && !/[/-]/.test(a.nom))) pb(`Nom « ${a.nom} » sans le séparateur du tableau des surfaces`);
}
mesures.arrivees = Object.fromEntries(stops.flatMap(A => liens.get(A.id).map(l => { const m = RG.mesure(RDA(parArret[l.vers]), l.arrivee);
  return [`${A.id}>${l.vers}`, { devant: +m.face.toFixed(2), ouverture: +m.ouv.toFixed(2), proche: +m.proche.toFixed(2), mur_nu: +m.nu.toFixed(2), jour: +m.jour.toFixed(2), note: +m.note.toFixed(2), rotation: deg(Math.abs(angD(l.arrivee - l.lacet))), marche: deg(Math.abs(angD(l.arrivee - l.marche))) }]; })));
mesures.anneaux = Object.fromEntries(stops.map(s => [s.id, { prof: anneaux[s.id].map(v => +v.toFixed(2)), dans: dans[s.id].map(v => +v.toFixed(2)), verre: verres[s.id].join(''), equip: equips[s.id].join('') }]));
await browser.close();

/* ---------- la visionneuse : sans moteur ni plan.json, points de passage au bon endroit, robustesse, téléphone et ordinateur ---------- */
if (!opt('sans-visionneuse') && visite.arrets.length) await verifierVisionneuse({ puppeteer, port, dir, visite, pb, mesures, ancres, stops: Object.fromEntries(stops.map(s => [s.id, { oeil: O3(s) }])), angles });
server.close();
const ctrl = { ok: !problemes.length, problemes, mesures, date: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, 'controle.json'), JSON.stringify(ctrl, null, 1));
console.log(ctrl.ok ? 'Panoramas contrôlés : aucun problème.' : `Panoramas : ${problemes.length} problème(s).`, `${faits.length} panoramas en ${mesures.total_s} s`);
process.exit(0);
