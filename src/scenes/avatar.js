import * as THREE from 'three';
import { PALETTE as P, box, mat } from './util.js';

/** Avatar blok ala Roblox (R6): kepala, badan, dua lengan, dua kaki. */
export function buildAvatar({ shirt = P.teal, pants = P.navy, skin = P.skin, hair = 0x3b2a1e } = {}) {
  const g = new THREE.Group();
  const torso = box(1.0, 1.0, 0.5, shirt, 0, 1.0);
  const head = box(0.8, 0.8, 0.8, skin, 0, 2.05);
  const hairB = box(0.86, 0.3, 0.86, hair, 0, 2.7);
  // wajah: dua mata + senyum (kotak kecil)
  const eyeM = mat(P.black);
  const e1 = box(0.1, 0.14, 0.05, P.black, -0.18, 2.5, 0.4, { material: eyeM, shadow: false });
  const e2 = box(0.1, 0.14, 0.05, P.black, 0.18, 2.5, 0.4, { material: eyeM, shadow: false });
  const smile = box(0.3, 0.06, 0.05, P.black, 0, 2.28, 0.4, { material: eyeM, shadow: false });
  const armL = new THREE.Group(); armL.add(box(0.4, 1.0, 0.4, skin, 0, -1.0)); armL.position.set(-0.7, 2.0, 0);
  const armR = new THREE.Group(); armR.add(box(0.4, 1.0, 0.4, skin, 0, -1.0)); armR.position.set(0.7, 2.0, 0);
  const legL = new THREE.Group(); legL.add(box(0.46, 1.0, 0.46, pants, 0, -1.0)); legL.position.set(-0.26, 1.0, 0);
  const legR = new THREE.Group(); legR.add(box(0.46, 1.0, 0.46, pants, 0, -1.0)); legR.position.set(0.26, 1.0, 0);
  g.add(torso, head, hairB, e1, e2, smile, armL, armR, legL, legR);
  g.userData = { armL, armR, legL, legR, walking: false, phase: 0, target: null, speed: 6, onArrive: null, bob: head };
  g.scale.setScalar(0.9);
  return g;
}

export function updateAvatar(av, dt) {
  const u = av.userData;
  if (u.target) {
    const dir = new THREE.Vector3().subVectors(u.target, av.position); dir.y = 0;
    const dist = dir.length();
    if (dist < 0.1) {
      av.position.copy(u.target); u.target = null; u.walking = false;
      const cb = u.onArrive; u.onArrive = null; cb && cb();
    } else {
      dir.normalize();
      av.position.addScaledVector(dir, Math.min(dist, u.speed * dt));
      av.rotation.y = Math.atan2(dir.x, dir.z);
      u.walking = true;
    }
  }
  if (u.walking) {
    u.phase += dt * 10;
    const s = Math.sin(u.phase) * 0.7;
    u.armL.rotation.x = s; u.armR.rotation.x = -s; u.legL.rotation.x = -s; u.legR.rotation.x = s;
  } else {
    u.armL.rotation.x *= 0.8; u.armR.rotation.x *= 0.8; u.legL.rotation.x *= 0.8; u.legR.rotation.x *= 0.8;
    u.phase += dt * 2;
  }
}

export function walkTo(av, target, onArrive) {
  av.userData.target = target.clone();
  av.userData.onArrive = onArrive || null;
}
