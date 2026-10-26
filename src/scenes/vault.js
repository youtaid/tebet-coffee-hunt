import * as THREE from 'three';
import { PALETTE as P, box, cyl, mat, emissive } from './util.js';

/** Coffee Vault: brankas navy besar, trim emas, glow teal, pintu bundar yang bisa terbuka. */
export function buildVault() {
  const g = new THREE.Group();
  // Bukit kecil + plaza
  g.add(cyl(11, 13, 1.2, P.grass2, 0, -0.9, 0, 10));
  g.add(cyl(8.5, 9, 0.4, P.navy2, 0, 0.3, 0, 10));
  // Badan brankas
  const body = box(10, 8, 7, P.navy, 0, 0.7, -2);
  g.add(body);
  g.add(box(10.6, 0.5, 7.6, P.gold, 0, 8.7, -2));
  g.add(box(10.6, 0.5, 7.6, P.gold, 0, 0.5, -2));
  // Glow teal di tepi
  const glowMat = emissive(P.teal2, 1.4);
  for (const x of [-5.1, 5.1]) g.add(box(0.2, 7.6, 0.2, P.teal2, x, 1.1, 1.6, { material: glowMat, shadow: false }));
  g.add(box(10.4, 0.2, 0.2, P.teal2, 0, 8.3, 1.6, { material: glowMat, shadow: false }));
  const glowLight = new THREE.PointLight(P.teal2, 2, 25, 2); glowLight.position.set(0, 5, 6); g.add(glowLight);
  // Lubang pintu (ring emas)
  const ringFrame = cyl(3.3, 3.3, 0.4, P.gold, 0, 0, 0, 24); ringFrame.position.set(0, 4.6, 1.5); ringFrame.rotation.x = Math.PI / 2; g.add(ringFrame);
  // Pintu bundar (pivot di kiri)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-3.1, 4.6, 1.7);
  const door = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.6, 24), mat(0x24365e));
  disc.rotation.x = Math.PI / 2; disc.castShadow = true; door.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 8, 24), mat(P.gold)); ring.position.z = 0.32; door.add(ring);
  // Roda kemudi
  const wheel = new THREE.Group();
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 20), mat(P.gold)));
  for (let i = 0; i < 3; i++) { const sp = box(0.16, 2.2, 0.16, P.gold, 0, -1.1, 0); sp.rotation.z = (i * Math.PI) / 3; wheel.add(sp); }
  const hub = cyl(0.3, 0.3, 0.3, P.gold, 0, 0, 0, 12); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0, 0); wheel.add(hub);
  wheel.position.z = 0.5; door.add(wheel);
  // 4 bolt
  const bolts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const b = cyl(0.2, 0.2, 0.9, P.gold, 0, 0, 0, 10);
    b.rotation.z = a - Math.PI / 2;
    b.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0.1);
    b.userData.angle = a; bolts.push(b); door.add(b);
  }
  // Keypad di kanan pintu
  const keypad = box(1.2, 1.5, 0.2, P.black, 4.2, 3.9, 1.6);
  const keyScreen = box(0.9, 0.4, 0.05, P.teal2, 4.2, 4.9, 1.72, { material: emissive(P.teal2, 1), shadow: false });
  g.add(keypad, keyScreen);
  door.position.x = 3.1;
  doorPivot.add(door);
  g.add(doorPivot);
  // Isi brankas (gold bars, koin) — terlihat ketika pintu terbuka
  const inside = new THREE.Group();
  for (let i = 0; i < 6; i++) inside.add(box(1.0, 0.5, 0.6, P.gold, -2 + (i % 3) * 2, 1.2 + Math.floor(i / 3) * 0.5, -1.5));
  inside.add(box(5, 0.3, 3, P.navy2, 0, 0.9, -1.5));
  inside.position.set(0, 0.2, 0); g.add(inside);
  // Steam emitters positions
  g.userData = { doorPivot, wheel, bolts, keyScreen, glowLight, inside, focus: new THREE.Vector3(0, 4, 1), camOffset: new THREE.Vector3(0, 5, 19) };
  return g;
}
