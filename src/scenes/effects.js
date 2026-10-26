// Sistem partikel instanced ringan: confetti, biji kopi, koin, uang, percikan.
import * as THREE from 'three';
import { reducedMotion } from './util.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export class ParticleSystem {
  constructor(scene, { max = 600 } = {}) {
    this.scene = scene;
    this.max = max;
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: false });
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    scene.add(this.mesh);
    this.parts = [];
    for (let i = 0; i < max; i++) this.mesh.setMatrixAt(i, _m.makeScale(0, 0, 0));
    this.mesh.count = max;
  }

  /** Semburan partikel. */
  burst({ origin, count = 80, colors = [0xf7c948, 0x1fb8a6, 0xf28c38, 0xffffff], speed = 8, up = 8, size = [0.15, 0.35], spread = 1, life = 2.5, gravity = 14, flat = true, shape = 'box' }) {
    if (reducedMotion()) count = Math.ceil(count / 4);
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      if (this.parts.length >= this.max) this.parts.shift();
      const dir = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2).normalize();
      const sz = size[0] + Math.random() * (size[1] - size[0]);
      this.parts.push({
        p: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread)),
        v: dir.multiplyScalar(speed * (0.5 + Math.random())).add(new THREE.Vector3(0, up * Math.random(), 0)),
        r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        rv: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
        sz: flat ? new THREE.Vector3(sz, sz * 0.15, sz * 1.4) : new THREE.Vector3(sz, sz, sz),
        life, age: 0, g: gravity,
        c: col.set(colors[Math.floor(Math.random() * colors.length)]).clone(),
      });
    }
  }

  /** Hujan dari atas (uang/koin). */
  rain({ center, count = 60, colors = [0x4caf50, 0x9ccc65, 0xf2c14e], width = 16, height = 14, size = [0.3, 0.6], life = 5 }) {
    if (reducedMotion()) count = Math.ceil(count / 4);
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      if (this.parts.length >= this.max) this.parts.shift();
      const sz = size[0] + Math.random() * (size[1] - size[0]);
      this.parts.push({
        p: new THREE.Vector3(center.x + (Math.random() - 0.5) * width, center.y + height + Math.random() * 6, center.z + (Math.random() - 0.5) * width),
        v: new THREE.Vector3((Math.random() - 0.5) * 1.5, -1.5 - Math.random() * 2, (Math.random() - 0.5) * 1.5),
        r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        rv: new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4),
        sz: new THREE.Vector3(sz * 1.8, sz * 0.05, sz),
        life, age: 0, g: 1.5, flutter: true,
        c: col.set(colors[Math.floor(Math.random() * colors.length)]).clone(),
      });
    }
  }

  update(dt) {
    const mesh = this.mesh;
    let i = 0;
    for (let k = this.parts.length - 1; k >= 0; k--) {
      const pt = this.parts[k];
      pt.age += dt;
      if (pt.age >= pt.life) { this.parts.splice(k, 1); continue; }
      pt.v.y -= pt.g * dt;
      if (pt.flutter) { pt.v.x += Math.sin(pt.age * 5 + pt.r.x) * dt * 2; pt.v.y = Math.max(pt.v.y, -3); }
      pt.p.addScaledVector(pt.v, dt);
      if (pt.p.y < 0.05) { pt.p.y = 0.05; pt.v.y *= -0.3; pt.v.x *= 0.8; pt.v.z *= 0.8; }
      pt.r.addScaledVector(pt.rv, dt);
      const fade = pt.age > pt.life - 0.5 ? (pt.life - pt.age) / 0.5 : 1;
      _e.set(pt.r.x, pt.r.y, pt.r.z); _q.setFromEuler(_e);
      _s.copy(pt.sz).multiplyScalar(fade);
      _m.compose(pt.p, _q, _s);
      mesh.setMatrixAt(i, _m);
      mesh.setColorAt(i, pt.c);
      i++;
    }
    for (let k = i; k < this.max; k++) mesh.setMatrixAt(k, _m.makeScale(0, 0, 0));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}
