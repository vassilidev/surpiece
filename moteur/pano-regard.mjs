/* Regards de la visite à 360° (appelé par moteur/pano.mjs) : vue de départ de chaque arrêt, regard d'arrivée de chaque lien, et leurs
   contrôles. Retour R1 de l'utilisateur (28/09/2026) : « on finit la tête dans le mur ». Une première version ne regardait que la
   profondeur libre au centre (±25°) : on arrivait encore face à un mur nu à 2 m (chambre 2 du duplex), face à la porte palière à 40 cm
   sur le bord de l'image (entrée du D201), ou face au mur du fond d'un WC. Ce qui est vu, c'est tout le champ de l'écran.
   Données d'un arrêt (360 rayons horizontaux, lacet ψ = k°, avant = (−sin ψ, −cos ψ), mesurés par pano.mjs, portes dans l'état du panorama) :
     prof  : distance du premier obstacle (verre compris), la plus courte à hauteur d'œil et 55 cm plus bas ;
     dans  : distance parcourue dans la pièce de l'arrêt (un couloir qui s'ouvre au loin ne compte pas) ;
     verre : 1 si le rayon à hauteur d'œil s'arrête sur un vitrage (le jour, la vue dehors).
   Note d'une direction (ce que l'on voit dans le champ du téléphone en portrait, 72° de large, et, pour les obstacles proches, dans celui
   de l'ordinateur, 105°) :
     ouverture : profondeur moyenne sur le champ du téléphone, la part hors de la pièce comptée pour moitié (bornée à 6 m) ;
     mur nu    : le champ est un seul mur plan, face à soi (profondeur × cos de l'écart constante à 6 % près), sans fenêtre : la note
                 d'ouverture est réduite de moitié (un mur à 2,5 m remplit l'écran : c'est « la tête dans le mur ») ;
     jour      : part du champ qui donne sur un vitrage (fenêtre, porte-fenêtre : la pièce avec sa lumière) ; pas dehors : depuis la
                 loggia, le vitrage est la porte-fenêtre par où l'on vient (3124 : on arrivait face à elle), la vue dehors est déjà profonde ;
     équipement: part du champ où un rayon à 60 cm du sol touche un équipement (baignoire, vasque, cuvette, cuisine), comptée jusqu'à
                 la moitié du champ : une salle de bains se reconnaît à sa baignoire, pas à un pan de mur (D201 : on arrivait face au vantail) ;
     proche    : part du champ de l'ordinateur (±48°) où un obstacle est à moins de 75 cm (porte palière, jambage, angle).
   Pièces exiguës et petites : regard baissé (voir tangage). */
export const DEMI_TEL = 36, DEMI_ORDI = 48;           // demi-champs horizontaux vérifiés (72° et 105° − une marge)
export const PROCHE = 0.75;                            // obstacle proche (m)
// regard d'arrivée à 135° au plus du regard vers le cercle touché (le cap du visiteur) : jamais face à la porte d'où l'on vient. Le « sens de
// la marche » (du cercle à l'arrêt) n'est pas vu par le visiteur (le passage est un fondu) et s'écarte souvent du cap : cercle posé au seuil
// d'une chambre dont l'arrêt est sur le côté (D201, salle de bain → chambre : 139° entre les deux)
export const ECART_CAP = 135;
export const EXIGUE = 1.5, TANGAGE_EXIGUE = -0.3, PETITE = 1.95, TANGAGE_PETITE = -0.18;
const DEG = Math.PI / 180;
const angD = a => Math.atan2(Math.sin(a), Math.cos(a));
const k360 = a => ((Math.round(a / DEG) % 360) + 360) % 360;

// mesures d'une direction a (radians) pour un arrêt R = { prof, dans, verre }
export function mesure(R, a) {
  const k = k360(a), at = (t, i) => t[(k + i + 720) % 360];
  let ouv = 0, jour = 0, nt = 0;
  // au-delà de la pièce (porte ouverte, passage, couloir), la vue compte pour moitié : elle montre la pièce voisine, pas celle-ci
  let equip = 0;
  for (let i = -DEMI_TEL; i <= DEMI_TEL; i++) { const d = at(R.dans, i); ouv += Math.min(6, d + 0.5 * Math.max(0, at(R.prof, i) - d)); jour += at(R.verre, i) && !R.dehors ? 1 : 0; equip += R.equip && at(R.equip, i) ? 1 : 0; nt++; }
  ouv /= nt; jour /= nt; equip /= nt;
  // obstacles proches : poids plein dans le champ du téléphone (le centre de l'écran), moitié sur les bords de l'ordinateur (un mur
  // latéral vu en fuite y gêne moins qu'une surface en face)
  let proche = 0, no = 0;
  for (let i = -DEMI_ORDI; i <= DEMI_ORDI; i++) { const w = Math.abs(i) <= DEMI_TEL ? 1 : 0.5; if (at(R.prof, i) < PROCHE) proche += w; no += w; }
  proche /= no;
  // mur plan face à soi : d(i)·cos(i) constant sur ±30° (écart relatif), mesuré sur les obstacles réels (la limite d'une pièce ouverte
  // sur un couloir n'est pas un mur)
  const v = []; for (let i = -30; i <= 30; i += 2) v.push(Math.min(8, at(R.prof, i)) * Math.cos(i * DEG));
  const m = v.reduce((s, x) => s + x, 0) / v.length, sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
  const cv = sd / Math.max(m, 1e-3), plat = cv <= 0.06 ? 1 : cv >= 0.2 ? 0 : (0.2 - cv) / 0.14;
  const nu = plat * (1 - Math.min(1, 4 * (jour + equip))); // mur nu : plan, sans fenêtre ni équipement
  const note = ouv * (1 - 0.5 * nu) + 2 * jour + 1.5 * Math.min(0.5, equip) - 8 * Math.max(0, proche - 0.06);
  return { ouv, jour, equip, proche, plat, nu, note, face: at(R.prof, 0) };
}

// meilleure direction (radians) parmi celles que « permis » accepte, et sa note ; bonus(a) ajouté à la note
export function meilleure(R, permis = () => true, bonus = () => 0) {
  let best = null;
  for (let k = 0; k < 360; k++) { const a = angD(k * DEG); if (!permis(a)) continue; const n = mesure(R, a).note + bonus(a); if (!best || n > best.n) best = { a, n }; }
  return best;
}

// tangage des regards d'un arrêt : baissé dans une pièce exiguë (profondeur moyenne dans la pièce, sur le champ du téléphone, de moins
// de 1,5 m dans la meilleure direction : WC, cellier, rangement), un peu baissé dans une petite pièce (moins de 1,95 m : salle de bains,
// dégagement) ; null sinon (le tangage prévu de l'arrêt est gardé). On voit la cuvette, la baignoire et le sol plutôt qu'un pan de mur.
export function tangage(R) {
  let m = 0;
  for (let k = 0; k < 360; k++) { let s = 0; for (let i = -DEMI_TEL; i <= DEMI_TEL; i++) s += Math.min(6, R.dans[(k + i + 720) % 360]); m = Math.max(m, s / (2 * DEMI_TEL + 1)); }
  return m < EXIGUE ? TANGAGE_EXIGUE : m < PETITE ? TANGAGE_PETITE : null;
}

/* vue de départ : la meilleure direction ; la vue prévue de l'arrêt (cadrée pour la photo de la pièce) est préférée à note presque égale.
   Regard d'arrivée d'un lien : la meilleure direction à ECART_CAP au plus du cap (regard vers le cercle) ; à note presque égale, près de
   la vue de départ (même image qu'en arrivant par la liste des pièces) et en tournant peu */
export function vueDepart(R, yaw) {
  return meilleure(R, () => true, a => (Math.abs(angD(a - yaw)) < 20 * DEG ? 0.35 : 0)).a;
}
export const permisCap = lacet => a => Math.abs(angD(a - lacet)) <= ECART_CAP * DEG + 1e-9;
// arrivée dans le sens de la marche (constat du 28/09/2026 : jusqu'à 135° de rotation à l'arrivée, un saut de 110° pendant le fondu, et
// des arrivées face à un mur à 0,8 m) : la meilleure direction à 60° au plus du cap, si elle est dégagée (1,5 m devant, 1 m sur ±30°) ;
// sinon à 90°, puis à ECART_CAP
// petites pièces (salle de bains, WC) : dégagement réduit (1 m devant, 60 cm sur ±30°) avant d'élargir le cône
export const CONE_ARRIVEE = 60, DEGAGE_FACE = 1.5, DEGAGE_COTES = 1.0, DEGAGES = [[1.5, 1.0], [1.0, 0.6]];
export const degagee = (R, a, [f, c] = DEGAGES[0]) => { const k = k360(a); let m = Infinity; for (let i = -30; i <= 30; i++) m = Math.min(m, R.prof[(k + i + 720) % 360]); return R.prof[k] >= f && m >= c; };
export const permisCone = (lacet, c) => a => Math.abs(angD(a - lacet)) <= c * DEG + 1e-9;
// paliers (cône, dégagement) essayés dans l'ordre
const PALIERS_ARRIVEE = [[CONE_ARRIVEE, DEGAGES[0]], [CONE_ARRIVEE, DEGAGES[1]], [90, DEGAGES[0]], [90, DEGAGES[1]]];
export function arrivee(R, { lacet, vue }) {
  const bonus = a => (Math.abs(angD(a - vue)) < 15 * DEG ? 0.25 : 0) - 0.005 * Math.max(0, Math.abs(angD(a - lacet)) / DEG - 20);
  for (const [c, dg] of PALIERS_ARRIVEE) {
    const b = meilleure(R, a => permisCone(lacet, c)(a) && degagee(R, a, dg), bonus);
    if (b) return b.a;
  }
  return meilleure(R, permisCap(lacet), bonus).a;
}
// palier d'arrivée attendu pour un lien : { cone, degage } du premier palier possible, sinon ECART_CAP sans exigence de dégagement
export function palierArrivee(R, lacet) {
  for (const [c, dg] of PALIERS_ARRIVEE) for (let k = -c; k <= c; k++) if (degagee(R, lacet + k * DEG, dg)) return { cone: c, degage: dg };
  return { cone: ECART_CAP, degage: null };
}
export const coneAttendu = (R, lacet) => palierArrivee(R, lacet).cone;

/* contrôles d'un regard (vue de départ ou arrivée) : rend la liste des défauts (textes sans nom d'arrêt, pano.mjs les préfixe)
   - obstacles à moins de 75 cm sur plus de 12 % du champ de l'ordinateur ;
   - mur nu face à soi alors qu'une direction permise montre la pièce (note inférieure aux trois quarts de la meilleure) ;
   - note inférieure aux trois quarts de la meilleure direction permise (on pouvait voir bien mieux la pièce). */
export function defauts(R, a, permis = () => true) {
  const m = mesure(R, a), b = meilleure(R, permis), mb = mesure(R, b.a), out = [];
  if (m.proche > 0.12 && m.proche > mb.proche + 0.04) out.push(`obstacle à moins de ${Math.round(PROCHE * 100)} cm sur ${Math.round(m.proche * 100)} % du champ`);
  if (m.nu > 0.5 && mb.nu < 0.5 && m.note < 0.75 * mb.note) out.push(`face à un mur nu (${m.face.toFixed(2)} m devant)`);
  else if (m.note < 0.75 * mb.note) out.push(`la pièce se voit mal (note ${m.note.toFixed(2)}, ${mb.note.toFixed(2)} possible)`);
  return out;
}
