/* Occlusion ambiante précalculée (ultra réaliste) : champ de distance aux surfaces du logement, dans une grille de cubes, calculé une
   fois au chargement (worker, sinon dans la page). Le moteur l'échantillonne dans ses matières (quelques lectures de texture 3D par
   pixel) : les angles, les contacts et les renfoncements sont assombris de la même façon en mouvement et à l'arrêt. L'occlusion
   calculée à chaque image (GTAO, écran) n'existait qu'à l'arrêt : elle apparaissait et disparaissait à chaque pas (retour du
   29/09/2026 : « les lumières sur les murs clignotent »).
   Entrée : tri (Float32Array, 9 nombres par triangle, coordonnées du monde), box [x0, y0, z0, x1, y1, z1], c (côté d'un cube, m),
   dmax (distance au-delà de laquelle rien n'occulte, m). Sortie : Uint8Array nx × ny × nz (x le plus rapide), distance / dmax × 255.
   Surfaces : cubes dont le centre est à moins de 0,6 c d'un triangle ; distance : transformée exacte (Felzenszwalb) sur les trois axes. */
export function champAO({ tri, box, c, dmax }) {
  const [x0, y0, z0, x1, y1, z1] = box, nx = Math.max(2, Math.ceil((x1 - x0) / c)), ny = Math.max(2, Math.ceil((y1 - y0) / c)), nz = Math.max(2, Math.ceil((z1 - z0) / c));
  const N = nx * ny * nz, INF = 1e20, f = new Float32Array(N).fill(INF), r2 = (0.6 * c) ** 2;
  const ix = x => Math.floor((x - x0) / c), iy = y => Math.floor((y - y0) / c), iz = z => Math.floor((z - z0) / c);
  for (let t = 0; t < tri.length; t += 9) {
    const ax = tri[t], ay = tri[t + 1], az = tri[t + 2], bx = tri[t + 3], by = tri[t + 4], bz = tri[t + 5], cx = tri[t + 6], cy = tri[t + 7], cz = tri[t + 8];
    const i0 = Math.max(0, ix(Math.min(ax, bx, cx)) - 1), i1 = Math.min(nx - 1, ix(Math.max(ax, bx, cx)) + 1);
    const j0 = Math.max(0, iy(Math.min(ay, by, cy)) - 1), j1 = Math.min(ny - 1, iy(Math.max(ay, by, cy)) + 1);
    const k0 = Math.max(0, iz(Math.min(az, bz, cz)) - 1), k1 = Math.min(nz - 1, iz(Math.max(az, bz, cz)) + 1);
    if (i0 > i1 || j0 > j1 || k0 > k1) continue;
    // plan du triangle : on ne teste que les cubes à moins de 0,6 c de ce plan
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    let px = uy * vz - uz * vy, py = uz * vx - ux * vz, pz = ux * vy - uy * vx; const pl = Math.hypot(px, py, pz); if (pl < 1e-12) continue; px /= pl; py /= pl; pz /= pl;
    for (let k = k0; k <= k1; k++) { const z = z0 + (k + 0.5) * c;
      for (let j = j0; j <= j1; j++) { const y = y0 + (j + 0.5) * c;
        for (let i = i0; i <= i1; i++) { const x = x0 + (i + 0.5) * c;
          const h = (x - ax) * px + (y - ay) * py + (z - az) * pz; if (h * h >= r2) continue;
          const q = k * nx * ny + j * nx + i; if (f[q] === 0) continue;
          if (distTri2(x, y, z, ax, ay, az, bx, by, bz, cx, cy, cz) < r2) f[q] = 0;
        }
      }
    }
  }
  // transformée de distance euclidienne exacte, axe par axe (distances au carré, en cubes)
  const n = Math.max(nx, ny, nz), g = new Float32Array(n), d = new Float32Array(n), v = new Int32Array(n), zb = new Float32Array(n + 1);
  const passe = (len, idx) => { // enveloppe basse des paraboles des cubes déjà atteints
    let k = -1;
    for (let q = 0; q < len; q++) {
      const gq = g[q] = f[idx(q)]; if (gq >= INF) continue;
      let s = 0;
      while (k >= 0) { const p = v[k]; s = ((gq + q * q) - (g[p] + p * p)) / (2 * q - 2 * p); if (s <= zb[k]) k--; else break; }
      k++; v[k] = q; zb[k] = k === 0 ? -INF : s; zb[k + 1] = INF;
    }
    if (k < 0) return; // aucun cube atteint sur cette ligne
    let j = 0; for (let q = 0; q < len; q++) { while (zb[j + 1] < q) j++; const p = v[j]; d[q] = (q - p) * (q - p) + g[p]; }
    for (let q = 0; q < len; q++) f[idx(q)] = d[q];
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) { const b = k * nx * ny + j * nx; passe(nx, q => b + q); }
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const b = k * nx * ny + i; passe(ny, q => b + q * nx); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const b = j * nx + i; passe(nz, q => b + q * nx * ny); }
  const out = new Uint8Array(N), s = c / dmax * 255;
  for (let q = 0; q < N; q++) out[q] = f[q] >= INF ? 255 : Math.min(255, Math.round(Math.sqrt(f[q]) * s));
  return { data: out, nx, ny, nz };
}
/* distance au carré d'un point à un triangle (Ericson, Real-Time Collision Detection § 5.1.5) */
function distTri2(px, py, pz, ax, ay, az, bx, by, bz, cx, cy, cz) {
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  const sq = (x, y, z) => x * x + y * y + z * z;
  if (d1 <= 0 && d2 <= 0) return sq(apx, apy, apz);
  const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) return sq(bpx, bpy, bpz);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const t = d1 / (d1 - d3); return sq(apx - t * abx, apy - t * aby, apz - t * abz); }
  const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) return sq(cpx, cpy, cpz);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const t = d2 / (d2 - d6); return sq(apx - t * acx, apy - t * acy, apz - t * acz); }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const t = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return sq(bpx - t * (cx - bx), bpy - t * (cy - by), bpz - t * (cz - bz)); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return sq(apx - abx * v - acx * w, apy - aby * v - acy * w, apz - abz * v - acz * w);
}
// worker : un message { tri, box, c, dmax } → { data, nx, ny, nz } (tampon transféré)
if (typeof self !== 'undefined' && typeof window === 'undefined') self.onmessage = e => { const r = champAO(e.data); self.postMessage(r, [r.data.buffer]); };
