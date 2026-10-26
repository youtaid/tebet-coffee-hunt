import * as THREE from 'three';

export const PALETTE = {
  teal: 0x1fb8a6, teal2: 0x2ad1c9, navy: 0x15213a, navy2: 0x1c2b4a, orange: 0xf28c38,
  cream: 0xf6efe3, yellow: 0xf7c948, white: 0xffffff, black: 0x1a1a1a, wood: 0xb98755,
  woodDark: 0x6b4a2b, plywood: 0xd9b07a, grass: 0x6cc26b, grass2: 0x5ab35a, road: 0x3c4150,
  roadLine: 0xe8e4d6, concrete: 0xb8b9bd, gravel: 0xcfcac0, glass: 0x9fdcf0, gold: 0xf2c14e,
  leaf: 0x58b65c, leaf2: 0x3f9a4b, trunk: 0x7a5236, terracotta: 0xb55a3c, skin: 0xf5c89a,
  red: 0xe05252, green: 0x4caf50,
};

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshLambertMaterial({ color, ...opts });
  matCache.set(key, m);
  return m;
}
export function emissive(color, intensity = 1, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: intensity, ...opts });
}

/** Kotak gaya Roblox: tajam, flat, warna solid. */
export function box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || mat(color, opts.matOpts || {}));
  m.position.set(x, y + h / 2, z); // y = alas
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = true;
  return m;
}
export function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 16, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), opts.material || mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
/** Prisma segitiga (atap pelana / A-frame) dari silinder 3 segmen. */
export function prism(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, opts.material || mat(color, opts.matOpts || {}));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Teks sebagai tekstur kanvas untuk papan nama. */
export function textPlane(text, { w = 6, h = 1.5, color = '#1fb8a6', bg = null, font = 'bold 110px "Space Grotesk", Arial, sans-serif', align = 'center' } = {}) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = Math.round(1024 * (h / w));
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, align === 'center' ? c.width / 2 : 20, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  return m;
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
export const easeOutBack = (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tween sederhana (tanpa GSAP). */
const tweens = new Set();
export function tween({ from, to, duration = 1, ease = easeOutCubic, onUpdate, onComplete }) {
  const t0 = performance.now();
  const obj = { done: false, cancel() { this.done = true; tweens.delete(this); } };
  obj.tick = (now) => {
    const t = Math.min(1, (now - t0) / (duration * 1000));
    const v = ease(t);
    onUpdate(from + (to - from) * v, v);
    if (t >= 1) { obj.done = true; tweens.delete(obj); onComplete && onComplete(); }
  };
  tweens.add(obj);
  return obj;
}
export function updateTweens(now) { for (const t of [...tweens]) t.tick(now); }
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
