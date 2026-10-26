// Set kafe nyata (Orka, Kopi Nako, Kopikina) + plaza ranking, dalam gaya blok ala Roblox.
import * as THREE from 'three';
import { PALETTE as P, box, cyl, prism, mat, emissive, textPlane } from './util.js';

function tree(x, z, scale = 1, leaf = P.leaf) {
  const g = new THREE.Group();
  g.add(box(0.6 * scale, 2.2 * scale, 0.6 * scale, P.trunk));
  g.add(box(2.6 * scale, 2.0 * scale, 2.6 * scale, leaf, 0, 1.9 * scale));
  g.add(box(1.8 * scale, 1.4 * scale, 1.8 * scale, P.leaf2, 0, 3.8 * scale));
  g.position.set(x, 0, z);
  return g;
}
function chair(x, z, color = P.wood, rot = 0) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.12, 0.9, color, 0, 0.9));
  g.add(box(0.9, 1.0, 0.12, color, 0, 1.0, -0.4));
  [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(([a, b]) => g.add(box(0.12, 0.9, 0.12, color, a, 0, b)));
  g.position.set(x, 0, z); g.rotation.y = rot;
  return g;
}
function table(x, z, w = 1.6, d = 1.6, color = P.white, legColor = P.wood) {
  const g = new THREE.Group();
  g.add(box(w, 0.15, d, color, 0, 1.4));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(0.15, 1.4, 0.15, legColor, a * (w / 2 - 0.15), 0, b * (d / 2 - 0.15))));
  g.position.set(x, 0, z);
  return g;
}
function stool(x, z) {
  const g = new THREE.Group();
  g.add(cyl(0.45, 0.45, 0.12, P.wood, 0, 0.9, 0, 10));
  g.add(cyl(0.08, 0.1, 0.9, P.woodDark, 0, 0, 0, 6));
  g.position.set(x, 0, z);
  return g;
}
function pendant(x, y, z, color = P.black) {
  const g = new THREE.Group();
  g.add(cyl(0.02, 0.02, 3, P.black, 0, 0, 0, 4));
  g.add(cyl(0.6, 0.35, 0.5, color, 0, -0.5, 0, 12));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), emissive(0xfff0c0, 1.2));
  bulb.position.y = -0.5; g.add(bulb);
  const light = new THREE.PointLight(0xffe2b0, 0, 8, 2); light.position.y = -0.6; g.add(light);
  g.userData.light = light;
  g.position.set(x, y, z);
  return g;
}
function glassWall(w, h, x, y, z, cols = 3, rows = 2, frame = P.black) {
  const g = new THREE.Group();
  g.add(box(w, h, 0.08, P.glass, 0, 0, 0, { matOpts: { transparent: true, opacity: 0.35 }, shadow: false }));
  for (let i = 0; i <= cols; i++) g.add(box(0.1, h, 0.14, frame, -w / 2 + (w / cols) * i, 0, 0));
  for (let j = 0; j <= rows; j++) g.add(box(w, 0.1, 0.14, frame, 0, (h / rows) * j - 0.05, 0));
  g.position.set(x, y, z);
  return g;
}

// ---------------------------------------------------------------- ORKA
// Foto: dinding putih bersih, pintu lipat kaca berbingkai hitam, pendant lamp hitam,
// railing hitam, kursi kayu, pohon besar di luar jendela, signage teal "Orka".
export function buildOrka() {
  const g = new THREE.Group();
  // Lantai & bangunan utama (dinding putih, atap miring)
  g.add(box(14, 0.3, 12, P.concrete, 0, 0, 0));
  g.add(box(12, 5.5, 9, P.cream, 0, 0.3, -1.5)); // body
  const roof = prism(12.4, 2.2, 9.4, P.white, 0, 5.8, -1.5); g.add(roof);
  // Dinding depan putih dengan pintu kaca lipat hitam
  g.add(glassWall(7, 4.2, -1.5, 0.3, 3.05, 4, 3));
  g.add(box(0.5, 4.6, 0.3, P.black, 2.4, 0.3, 3.05)); // tiang hitam
  // Signage Orka di dinding kanan
  const sign = textPlane('Orka', { w: 3.4, h: 1.4, color: '#1fb8a6', font: 'bold 330px "Space Grotesk", Arial, sans-serif' });
  sign.position.set(4.3, 3.2, 3.12); g.add(sign);
  // Pendant lamps
  const p1 = pendant(-3, 7.2, 1.2); const p2 = pendant(3.5, 7.2, 1.2); g.add(p1, p2);
  // Railing hitam di depan (mezzanine feel)
  for (let i = 0; i < 9; i++) g.add(box(0.1, 1.1, 0.1, P.black, -6 + i * 0.8, 0.3, 5.3));
  g.add(box(6.6, 0.1, 0.12, P.wood, -2.8, 1.35, 5.3));
  // Kursi & meja kayu di dalam (terlihat lewat kaca)
  g.add(table(-2.5, 0.3, 1.6, 1.2, P.white, P.wood));
  g.add(chair(-3.6, 0.3, P.wood, Math.PI / 2)); g.add(chair(-1.4, 0.3, P.wood, -Math.PI / 2));
  g.add(table(1.2, 0.3, 1.4, 1.2, P.white, P.wood));
  g.add(chair(2.3, 0.3, P.wood, -Math.PI / 2));
  // Grinder (mesin) di counter kiri + pohon besar di belakang kaca
  g.add(box(3, 1.2, 1.2, P.cream, -4.5, 0.3, -3.5));
  const grinder = new THREE.Group();
  grinder.add(box(0.5, 0.9, 0.5, P.black, 0, 0, 0));
  grinder.add(cyl(0.3, 0.3, 0.4, P.black, 0, 0.9, 0, 10));
  grinder.position.set(-4.5, 1.5, -3.5); g.add(grinder);
  g.add(tree(-2, -1.5, 1.4, P.leaf));
  g.add(tree(-8.5, 4.5, 1.0)); g.add(tree(8.5, 4.5, 0.9, P.leaf2));
  // Pintu (dua panel yang bisa terbuka)
  const doorL = box(1.6, 4.0, 0.12, P.glass, 0, 0, 0, { matOpts: { transparent: true, opacity: 0.4 }, shadow: false });
  const doorR = doorL.clone();
  const dL = new THREE.Group(); dL.add(doorL); doorL.position.x = 0.8; dL.position.set(-3.3, 0.4, 3.3);
  const dR = new THREE.Group(); dR.add(doorR); doorR.position.x = -0.8; dR.position.set(0.1, 0.4, 3.3);
  g.add(dL, dR);
  g.userData = { lights: [p1.userData.light, p2.userData.light], grinder, doors: [dL, dR], focus: new THREE.Vector3(0, 2.5, 2), camOffset: new THREE.Vector3(0, 7, 19) };
  return g;
}

// ---------------------------------------------------------------- KOPI NAKO
// Foto: rumah A-frame baja hitam & kaca, neon cangkir kopi, kaktus, bangku kayu bulat,
// meja beton panjang, pohon rindang, kerikil.
export function buildNako() {
  const g = new THREE.Group();
  g.add(box(16, 0.3, 14, P.gravel, 0, 0, 0));
  // A-frame kaca
  const frameMat = mat(P.black);
  const glassMat = mat(P.glass, { transparent: true, opacity: 0.3 });
  const aframe = prism(9, 9, 8, P.glass, 0, 0.3, -2, { material: glassMat });
  aframe.castShadow = false; g.add(aframe);
  // Rangka hitam A-frame (dua sisi miring)
  const len = Math.hypot(4.5, 9);
  const ang = Math.atan2(9, 4.5);
  for (const side of [-1, 1]) {
    for (let k = 0; k <= 2; k++) {
      const beam = box(0.18, len, 0.18, P.black, 0, 0, 0, { material: frameMat });
      beam.position.set(side * 2.25, 0.3 + 4.5, -2 - 4 + k * 4);
      beam.rotation.z = side * (Math.PI / 2 - ang);
      g.add(beam);
    }
  }
  g.add(box(0.2, 0.2, 8, P.black, 0, 9.2, -2)); // bubungan
  g.add(box(9.4, 0.25, 8.4, P.black, 0, 0.3, -2)); // alas rangka
  // Panel depan: frame kotak-kotak + pintu ganda hitam
  g.add(glassWall(7, 3.6, 0, 0.3, 2.05, 4, 2));
  g.add(box(2.4, 3.6, 0.16, P.black, 0, 0.3, 2.1)); // pintu
  g.add(box(0.9, 1.6, 0.05, P.glass, -0.6, 2.0, 2.2, { shadow: false })); g.add(box(0.9, 1.6, 0.05, P.glass, 0.6, 2.0, 2.2, { shadow: false }));
  // Panel bawah hitam (pagar besi)
  g.add(box(9.4, 1.4, 0.1, P.black, 0, 0.3, 2.3));
  // Neon cangkir kopi (emissive oranye) di kaca atas
  const neon = new THREE.Group();
  const nm = emissive(0xffa23d, 1.6);
  neon.add(box(1.8, 0.14, 0.1, 0xffa23d, 0, 0, 0, { material: nm, shadow: false }));
  neon.add(box(0.14, 1.2, 0.1, 0xffa23d, -0.9, 0, 0, { material: nm, shadow: false }));
  neon.add(box(0.14, 1.2, 0.1, 0xffa23d, 0.9, 0, 0, { material: nm, shadow: false }));
  neon.add(box(1.8, 0.14, 0.1, 0xffa23d, 0, 1.15, 0, { material: nm, shadow: false }));
  neon.add(box(0.14, 0.7, 0.1, 0xffa23d, 1.25, 0.35, 0, { material: nm, shadow: false })); // gagang
  for (let i = 0; i < 3; i++) neon.add(box(0.1, 0.5, 0.08, 0xffa23d, -0.4 + i * 0.4, 1.6 + (i % 2) * 0.15, 0, { material: nm, shadow: false }));
  neon.position.set(0, 5.4, 2.2); g.add(neon);
  const neonLight = new THREE.PointLight(0xffa23d, 1.2, 10, 2); neonLight.position.set(0, 6, 3); g.add(neonLight);
  // Meja beton panjang + bangku kayu bulat
  g.add(box(3.2, 1.2, 1.3, P.concrete, 0.5, 0.3, 5.2));
  [[-1.5, 6.4], [-0.3, 6.4], [1.0, 6.4], [2.2, 6.4], [-1.5, 4.0], [2.2, 4.0]].forEach(([x, z]) => g.add(stool(x, z)));
  g.add(stool(-4.2, 3.5)); g.add(stool(-5.2, 4.3)); g.add(stool(-4.5, 5.2));
  g.add(cyl(0.5, 0.5, 1.0, P.woodDark, -4.6, 0.3, 4.3, 10)); // meja kecil
  // Kaktus & pot
  const cactus = (x, z, h) => { const c = new THREE.Group(); c.add(cyl(0.45, 0.5, 0.6, 0x7b7f86, 0, 0, 0, 10)); c.add(cyl(0.22, 0.22, h, 0x4e9a5b, 0, 0.6, 0, 8)); c.add(cyl(0.12, 0.12, h * 0.5, 0x4e9a5b, 0.3, 0.6 + h * 0.4, 0, 8)); c.position.set(x, 0.3, z); return c; };
  g.add(cactus(-3.8, 1.5, 2.2)); g.add(cactus(3.9, 1.6, 1.6)); g.add(cactus(4.6, 5.8, 2.8)); g.add(cactus(-5.8, 6.2, 1.9));
  // Pohon rindang
  g.add(tree(-6.5, -3, 1.6)); g.add(tree(6.2, 0.5, 1.1, P.leaf2)); g.add(tree(-7, 1.5, 0.9));
  // Kasir + receipt printer di dalam
  g.add(box(2.6, 1.1, 1.0, P.woodDark, 0, 0.3, -1.5));
  const register = box(0.8, 0.6, 0.6, P.black, -0.5, 1.4, -1.5);
  const printer = box(0.7, 0.4, 0.5, P.concrete, 0.6, 1.4, -1.5);
  g.add(register, printer);
  // Tiket yang keluar dari printer (disembunyikan dulu)
  const ticket = box(0.5, 0.02, 0.9, P.white, 0.6, 1.82, -1.2); ticket.visible = false; g.add(ticket);
  g.userData = { neon, neonLight, ticket, focus: new THREE.Vector3(0, 3.5, 1), camOffset: new THREE.Vector3(0, 7, 20) };
  return g;
}

// ---------------------------------------------------------------- KOPIKINA
// Foto: interior plywood hangat, rak kotak-kotak, speaker oranye, piringan hitam,
// amplifier vintage, lukisan laut, lampu bola, kursi kayu gelap, lantai terakota.
export function buildKopikina() {
  const g = new THREE.Group();
  g.add(box(14, 0.3, 12, P.terracotta, 0, 0, 0));
  // Ruangan terbuka ke depan: dinding belakang + dua sisi, plafon plywood
  g.add(box(14, 6, 0.4, P.plywood, 0, 0.3, -5.8));
  g.add(box(0.4, 6, 12, P.plywood, -6.8, 0.3, 0));
  g.add(box(0.4, 6, 12, P.plywood, 6.8, 0.3, 0));
  g.add(box(14, 0.4, 12, P.plywood, 0, 6.3, 0, { shadow: false }));
  // Strip lampu plafon (emissive)
  g.add(box(12, 0.08, 0.3, 0xffd9a0, 0, 6.2, -3, { material: emissive(0xffd9a0, 1), shadow: false }));
  // Rak kotak-kotak plywood di dinding belakang kiri
  const shelf = new THREE.Group();
  shelf.add(box(6.4, 5.2, 0.9, P.plywood, 0, 0, 0));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) shelf.add(box(1.9, 1.1, 0.7, 0xc89a5e, -2.1 + c * 2.1, 0.2 + r * 1.25, 0.15));
  // speaker oranye kiri & kanan (baris atas)
  for (const x of [-2.1, 2.1]) {
    shelf.add(box(1.5, 1.0, 0.8, P.orange, x, 4.0, 0.2));
    shelf.add(cyl(0.3, 0.3, 0.1, P.black, x + 0.25, 4.45, 0.62, 12)); shelf.add(cyl(0.16, 0.16, 0.1, P.black, x - 0.38, 4.6, 0.62, 10));
  }
  // piringan hitam (kotak tipis warna-warni) baris atas tengah
  [0xd9d9d9, 0xe85d5d, 0x3b3b3b, 0xf2c14e].forEach((col, i) => shelf.add(box(0.5, 0.6, 0.05, col, -0.75 + i * 0.5, 4.3, 0.62)));
  // amplifier vintage
  [[-2.1, 2.7], [0, 2.7], [2.1, 2.7], [-2.1, 1.45], [2.1, 1.45]].forEach(([x, y]) => { shelf.add(box(1.2, 0.35, 0.6, 0xe0d8c8, x, y, 0.25)); shelf.add(box(1.0, 0.08, 0.05, P.black, x, y + 0.15, 0.56)); });
  // turntable + speaker kecil
  shelf.add(box(0.9, 0.3, 0.6, P.wood, 0, 1.45, 0.25)); shelf.add(cyl(0.3, 0.3, 0.05, P.black, 0, 1.75, 0.3, 14));
  shelf.add(box(0.35, 0.6, 0.35, P.white, -0.65, 1.45, 0.3)); shelf.add(box(0.35, 0.6, 0.35, P.white, 0.65, 1.45, 0.3));
  shelf.position.set(-3.2, 0.3, -5.1); g.add(shelf);
  // Lukisan laut (biru) berbingkai di kanan
  const paint = new THREE.Group();
  paint.add(box(2.6, 2.0, 0.12, P.woodDark, 0, 0, 0));
  paint.add(box(2.3, 1.7, 0.06, 0x2d6fa3, 0, 0.15, 0.06));
  paint.add(box(2.3, 0.5, 0.05, 0x9cc4e4, 0, 1.3, 0.09)); // langit
  paint.add(box(0.8, 0.12, 0.05, P.white, -0.4, 0.5, 0.1)); paint.add(box(0.6, 0.1, 0.05, P.white, 0.6, 0.8, 0.1)); // ombak
  paint.position.set(2.6, 2.4, -5.5); g.add(paint);
  // Lampu bola
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), emissive(0xfff3d6, 1.2)); globe.position.set(5.2, 4.8, -4.5); g.add(globe);
  g.add(cyl(0.02, 0.02, 1.2, P.black, 5.2, 5.0, -4.5, 4));
  const globeLight = new THREE.PointLight(0xffd9a0, 1.0, 12, 2); globeLight.position.set(3, 4.5, -3); g.add(globeLight);
  // Meja & kursi kayu gelap
  g.add(table(-1.0, 0.3, 2.6, 1.4, P.woodDark, P.woodDark));
  [[-2.0, -0.6, 0], [-0.4, -0.6, 0], [-2.0, 1.2, Math.PI], [-0.4, 1.2, Math.PI]].forEach(([x, z, r]) => g.add(chair(x, 0.3, P.woodDark, r)));
  g.add(table(4.3, 0.3, 1.6, 1.4, P.woodDark, P.woodDark)); g.add(chair(5.5, 0.3, P.woodDark, -Math.PI / 2)); g.add(chair(3.1, 0.3, P.woodDark, Math.PI / 2));
  // Mesin stempel / kasir (untuk Mission 3)
  const machine = new THREE.Group();
  machine.add(box(1.2, 1.0, 0.8, P.teal, 0, 0, 0));
  machine.add(box(0.8, 0.3, 0.1, 0x8af5ec, 0, 0.55, 0.42, { material: emissive(0x8af5ec, 0.8), shadow: false }));
  machine.position.set(-5.2, 1.6, 2.5); g.add(box(1.6, 1.3, 1.1, P.woodDark, -5.2, 0.3, 2.5)); g.add(machine);
  // Kotak hadiah + tumbler (disembunyikan hingga menang)
  const giftBox = new THREE.Group();
  giftBox.add(box(1.4, 1.2, 1.4, P.orange, 0, 0, 0));
  giftBox.add(box(1.5, 0.2, 0.3, P.yellow, 0, 0.5, 0)); giftBox.add(box(0.3, 0.2, 1.5, P.yellow, 0, 0.5, 0));
  const lid = box(1.5, 0.3, 1.5, P.orange, 0, 1.2, 0); giftBox.add(lid);
  giftBox.position.set(2.0, 1.55, 1.6); giftBox.visible = false; g.add(giftBox);
  const tumbler = new THREE.Group();
  tumbler.add(cyl(0.3, 0.26, 1.1, P.teal, 0, 0, 0, 14)); tumbler.add(cyl(0.32, 0.32, 0.15, P.navy, 0, 1.1, 0, 14));
  tumbler.position.set(2.0, 1.9, 1.6); tumbler.visible = false; g.add(tumbler);
  g.userData = { machine, giftBox, lid, tumbler, focus: new THREE.Vector3(0, 2.5, -1), camOffset: new THREE.Vector3(0, 5, 15) };
  return g;
}

// ---------------------------------------------------------------- RANKING PLAZA
export function buildRanking() {
  const g = new THREE.Group();
  g.add(box(16, 0.3, 12, P.concrete, 0, 0, 0));
  g.add(box(14, 0.3, 4, P.navy2, 0, 0.3, -3));
  // Papan "TEBET COFFEE RANKING"
  g.add(box(10, 2.0, 0.3, P.navy, 0, 6.5, -5.5)); g.add(box(0.3, 6.5, 0.3, P.black, -4.6, 0.3, -5.5)); g.add(box(0.3, 6.5, 0.3, P.black, 4.6, 0.3, -5.5));
  const t = textPlane('TEBET COFFEE RANKING', { w: 9.6, h: 1.6, color: '#f6efe3', font: 'bold 68px "Space Grotesk", Arial, sans-serif' });
  t.position.set(0, 7.5, -5.3); g.add(t);
  // 7 bar skor (4, 7, 10, 11, x, y, 30) — dua di antaranya "?" lebih pendek dulu
  const scores = [4, 7, 10, 11, 25, 25, 30];
  const bars = [];
  scores.forEach((s, i) => {
    const h = 0.2 + s * 0.18;
    const unknown = i === 4 || i === 5;
    const b = box(1.2, h, 1.2, unknown ? P.concrete : P.teal, -6 + i * 2, 0.6, -3);
    b.scale.y = 0.05; b.position.y = 0.6 + (h * 0.05) / 2;
    b.userData = { h, unknown };
    bars.push(b); g.add(b);
    const lab = textPlane(unknown ? '?' : String(s), { w: 1.2, h: 0.6, color: '#f6efe3' });
    lab.position.set(-6 + i * 2, 0.45, -2.3); lab.rotation.x = -Math.PI / 2; g.add(lab);
  });
  // Pohon & lampu plaza
  g.add(tree(-7, 4, 1.1)); g.add(tree(7, 4, 1.1, P.leaf2));
  for (const x of [-5, 5]) { g.add(cyl(0.08, 0.1, 4.5, P.black, x, 0.3, 3.5, 6)); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), emissive(0xfff0c0, 1)); bulb.position.set(x, 5.0, 3.5); g.add(bulb); }
  g.userData = { bars, focus: new THREE.Vector3(0, 3, -2), camOffset: new THREE.Vector3(0, 7, 18) };
  return g;
}

export { tree };
