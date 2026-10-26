// Dunia 3D Tebet (gaya blok ala Roblox) + kamera + efek. API dipakai oleh UI.
import * as THREE from 'three';
import { PALETTE as P, box, cyl, mat, emissive, textPlane, tween, updateTweens, easeInOutQuart, easeOutCubic, easeOutBack, reducedMotion, wait } from './util.js';
import { buildOrka, buildNako, buildKopikina, buildRanking, tree } from './cafes.js';
import { buildVault } from './vault.js';
import { buildAvatar, updateAvatar, walkTo } from './avatar.js';
import { ParticleSystem } from './effects.js';
import { LOCATIONS, GAME } from '../config/gameConfig.js';

export const LOC_POS = [
  new THREE.Vector3(-22, 0, -14),
  new THREE.Vector3(22, 0, -14),
  new THREE.Vector3(-22, 0, 16),
  new THREE.Vector3(22, 0, 16),
  new THREE.Vector3(0, 0, -44),
];

export class World {
  constructor() {
    this.ok = false;
    this.mode = 'landing';
    this.t = 0;
    this.shakeAmt = 0;
    this.locs = [];
    this.markers = [];
    this.cars = [];
    this.camTarget = new THREE.Vector3(0, 0, 0);
    this.camPos = new THREE.Vector3(0, 30, 40);
    this.orbit = { on: true, angle: 0, radius: 48, height: 26, speed: 0.08 };
  }

  init(canvas) {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      const low = new URLSearchParams(location.search).get('quality') === 'low';
      this.renderer.setPixelRatio(low ? 0.75 : Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = !low;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch (e) {
      console.warn('WebGL tidak tersedia', e);
      return false;
    }
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fdcf0);
    this.scene.fog = new THREE.Fog(0x9fdcf0, 90, 190);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    this.camera.position.copy(this.camPos);

    // Cahaya
    this.scene.add(new THREE.HemisphereLight(0xdff5ff, 0x6a8f5a, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = 60; Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 160 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.sun = sun;

    this.buildMap();
    this.particles = new ParticleSystem(this.scene, { max: reducedMotion() ? 150 : 700 });
    this.avatar = buildAvatar();
    this.avatar.position.set(0, 0.3, -4);
    this.scene.add(this.avatar);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.ok = true;
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    return true;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ MAP
  buildMap() {
    const s = this.scene;
    const ground = box(320, 1, 320, P.grass, 0, -1.3, -10); ground.receiveShadow = true; s.add(ground);
    // Petak rumput variasi
    for (let i = 0; i < 24; i++) s.add(box(6 + Math.random() * 10, 0.05, 6 + Math.random() * 10, P.grass2, (Math.random() - 0.5) * 140, -0.3, -10 + (Math.random() - 0.5) * 140, { shadow: false }));
    // Jalan: dua horizontal (z=0, z=-30), satu vertikal (x=0), ring
    const road = (w, d, x, z) => { s.add(box(w, 0.1, d, P.road, x, -0.3, z, { shadow: false })); };
    road(80, 6, 0, 0); road(6, 80, 0, -10); road(60, 6, 0, -30); road(6, 50, -40, -8); road(6, 50, 40, -8); road(80, 6, 0, 32);
    // Garis putus-putus jalan
    for (let x = -36; x <= 36; x += 6) { s.add(box(2.5, 0.12, 0.3, P.roadLine, x, -0.3, 0, { shadow: false })); s.add(box(2.5, 0.12, 0.3, P.roadLine, x, -0.3, 32, { shadow: false })); }
    for (let z = -46; z <= 28; z += 6) s.add(box(0.3, 0.12, 2.5, P.roadLine, 0, -0.3, z, { shadow: false }));
    // Trotoar tiap lokasi
    // Bangunan latar (blok kota)
    const bgCols = [0xd7cbb8, 0xb9c4cc, 0xe6d3bf, 0xc2b2a3, 0xdedede];
    for (let i = 0; i < 26; i++) {
      const x = (Math.random() - 0.5) * 150, z = -10 + (Math.random() - 0.5) * 150;
      if (Math.abs(x) < 42 && z > -58 && z < 32) continue;
      const h = 4 + Math.random() * 9;
      s.add(box(5 + Math.random() * 6, h, 5 + Math.random() * 6, bgCols[i % bgCols.length], x, -0.3, z));
    }
    // Pohon di sepanjang jalan
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 120, z = -10 + (Math.random() - 0.5) * 120;
      if (Math.abs(x) < 5 || Math.abs(z) < 5 || Math.abs(z + 30) < 5 || Math.abs(z - 32) < 5) continue;
      if (LOC_POS.some((p) => p.distanceTo(new THREE.Vector3(x, 0, z)) < 11)) continue;
      s.add(tree(x, z, 0.8 + Math.random() * 0.8, Math.random() > 0.5 ? P.leaf : P.leaf2));
    }
    // Lampu jalan
    for (let x = -30; x <= 30; x += 15) for (const z of [4, -4]) { s.add(cyl(0.1, 0.12, 5, P.black, x, -0.3, z, 6)); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), emissive(0xfff0c0, 1)); bulb.position.set(x, 5, z); s.add(bulb); }
    // Mobil blok
    const carCols = [P.red, P.yellow, P.teal, P.white, P.orange];
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group();
      const col = carCols[i % carCols.length];
      c.add(box(2.4, 0.8, 1.2, col, 0, 0.4)); c.add(box(1.4, 0.6, 1.1, 0x6fb8d8, -0.1, 1.2));
      [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]].forEach(([a, b]) => { const wh = cyl(0.3, 0.3, 0.2, P.black, a, 0.1, b, 8); wh.rotation.x = Math.PI / 2; c.add(wh); });
      const lane = i % 3; const z = [0, 32, -30][lane] + (i % 2 ? 1.6 : -1.6);
      c.position.set(-40 + i * 13, -0.3, z); c.userData = { dir: i % 2 ? 1 : -1, z, speed: 5 + Math.random() * 4 };
      c.rotation.y = c.userData.dir > 0 ? 0 : Math.PI;
      s.add(c); this.cars.push(c);
    }
    // Lokasi
    const builders = [buildOrka, buildNako, buildKopikina, buildRanking, buildVault];
    builders.forEach((b, i) => {
      const g = b(); g.position.copy(LOC_POS[i]);
      if (i === 1) g.rotation.y = 0;
      s.add(g); this.locs.push(g);
      // Marker status di atas lokasi
      const mk = new THREE.Group();
      const pin = box(1.6, 1.6, 1.6, P.concrete, 0, 0);
      const label = textPlane(LOCATIONS[i].name, { w: 9, h: 1.6, color: '#ffffff', bg: 'rgba(21,33,58,0.85)', font: 'bold 80px "Space Grotesk", Arial, sans-serif' });
      label.position.y = -1.6;
      const icon = textPlane('🔒', { w: 1.6, h: 1.6, font: '110px sans-serif' }); icon.position.z = 0.9;
      mk.add(pin, label, icon);
      mk.position.set(LOC_POS[i].x, 14, LOC_POS[i].z);
      mk.userData = { pin, icon, status: 'locked', label };
      s.add(mk); this.markers.push(mk);
    });
    // Garis cahaya (untuk transisi vault)
    const pts = [...LOC_POS.slice(0, 4), LOC_POS[4]].map((p) => p.clone().setY(3));
    const geo = new THREE.BufferGeometry().setFromPoints(this.densify(pts, 120));
    this.lightLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: P.teal2 }));
    this.lightLine.geometry.setDrawRange(0, 0); this.lightLine.visible = false; s.add(this.lightLine);
    // Roulette (disembunyikan)
    this.roulette = this.buildRoulette(); this.roulette.visible = false; s.add(this.roulette);
  }

  densify(pts, n) {
    const out = [];
    const total = pts.length - 1;
    for (let i = 0; i <= n; i++) { const f = (i / n) * total; const k = Math.min(total - 1, Math.floor(f)); out.push(pts[k].clone().lerp(pts[k + 1], f - k)); }
    return out;
  }

  buildRoulette() {
    const g = new THREE.Group();
    const cols = [0xf28c38, 0x1fb8a6, 0xf7c948, 0xe05252, 0x8e6cf0, 0x2ad1c9, 0xf6efe3, 0xf2c14e];
    const n = GAME.doorprize.length;
    const wheel = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const sec = new THREE.Mesh(new THREE.CircleGeometry(5, 12, (i * Math.PI * 2) / n, (Math.PI * 2) / n), mat(cols[i % cols.length], { side: THREE.DoubleSide }));
      wheel.add(sec);
      const a = ((i + 0.5) * Math.PI * 2) / n;
      const lab = textPlane(GAME.doorprize[i], { w: 3.2, h: 0.7, color: '#15213a', font: 'bold 70px "Space Grotesk", Arial, sans-serif' });
      lab.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0.05); lab.rotation.z = a; wheel.add(lab);
    }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5, 0.25, 8, 40), mat(P.navy)); rim.position.z = 0.05; wheel.add(rim);
    const hub = cyl(0.6, 0.6, 0.4, P.navy, 0, 0, 0, 16); hub.rotation.x = Math.PI / 2; hub.position.set(0, 0, 0); wheel.add(hub);
    g.add(wheel);
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 4), mat(P.red)); pointer.position.set(0, 5.6, 0.3); pointer.rotation.z = Math.PI; g.add(pointer);
    g.userData = { wheel, n };
    return g;
  }

  // ------------------------------------------------------------ STATUS
  setLocationStatus(i, status) {
    const mk = this.markers[i]; if (!mk) return;
    mk.userData.status = status;
    const colors = { locked: P.concrete, active: P.teal2, completed: P.green };
    mk.userData.pin.material = status === 'active' ? emissive(P.teal2, 0.9) : mat(colors[status]);
    mk.remove(mk.userData.icon);
    const icon = textPlane(status === 'locked' ? '🔒' : status === 'active' ? '✨' : '✅', { w: 1.6, h: 1.6, font: '110px sans-serif' }); icon.position.z = 0.9;
    mk.add(icon); mk.userData.icon = icon;
  }

  // ------------------------------------------------------------ CAMERA
  flyCamera(pos, target, duration = 1.6, ease = easeInOutQuart) {
    this.orbit.on = false;
    const p0 = this.camPos.clone(), t0 = this.camTarget.clone();
    // Hanya satu tween kamera yang boleh aktif: batalkan yang sebelumnya (mis. intro yang di-skip)
    if (this.camTween && !this.camTween.done) { this.camTween.cancel(); this.camTweenResolve && this.camTweenResolve(); }
    this.cameraToken = (this.cameraToken || 0) + 1;
    return new Promise((res) => {
      if (reducedMotion()) duration = Math.min(duration, 0.4);
      this.camTweenResolve = res;
      this.camTween = tween({ from: 0, to: 1, duration, ease, onUpdate: (v) => { this.camPos.lerpVectors(p0, pos, v); this.camTarget.lerpVectors(t0, target, v); }, onComplete: res });
    });
  }
  setMarkersVisible(v) { this.markers.forEach((m) => { m.visible = v; }); }
  mapView(duration = 1.6) { this.setMarkersVisible(true); return this.flyCamera(new THREE.Vector3(0, 74, 50), new THREE.Vector3(0, 0, -6), duration); }
  locationView(i, duration = 1.6) {
    const g = this.locs[i]; const u = g.userData;
    this.setMarkersVisible(false);
    // Geser kamera ke kanan agar bangunan tampil di kiri (panel soal ada di kanan)
    const shift = new THREE.Vector3(window.innerWidth > 760 ? 3.5 : 0, 0, 0);
    const target = g.position.clone().add(u.focus).add(shift);
    const pos = g.position.clone().add(u.camOffset).add(shift);
    return this.flyCamera(pos, target, duration);
  }
  startLandingOrbit() { this.orbit.on = true; }

  async introCinematic(onLine) {
    this.orbit.on = false;
    const path = [
      [new THREE.Vector3(0, 10, 50), new THREE.Vector3(0, 2, 0)],
      [new THREE.Vector3(-26, 8, -2), new THREE.Vector3(-22, 2, -14)],
      [new THREE.Vector3(26, 8, -2), new THREE.Vector3(22, 2, -14)],
      [new THREE.Vector3(-26, 8, 28), new THREE.Vector3(-22, 2, 16)],
      [new THREE.Vector3(26, 8, 28), new THREE.Vector3(22, 2, 16)],
      [new THREE.Vector3(0, 12, -22), new THREE.Vector3(0, 5, -44)],
    ];
    for (let i = 0; i < path.length; i++) {
      onLine && onLine(i);
      const p = this.flyCamera(path[i][0], path[i][1], reducedMotion() ? 0.5 : 1.8, easeInOutQuart);
      const token = this.cameraToken; // token milik tween ini
      await p;
      if (token !== this.cameraToken) return; // di-skip / diambil alih kamera lain
      if (!reducedMotion()) await wait(400);
      if (token !== this.cameraToken) return;
    }
  }

  shake(amount = 0.4) { if (!reducedMotion()) this.shakeAmt = amount; }

  // ------------------------------------------------------------ AVATAR
  walkAvatarTo(i) {
    const p = LOC_POS[i].clone(); p.y = 0.3; p.z += 8; p.x += (i === 4 ? 7 : 8);
    return new Promise((res) => walkTo(this.avatar, p, res));
  }

  // ------------------------------------------------------------ MISSION FX
  burstAt(i, opts = {}) {
    const g = this.locs[i]; const o = g.position.clone().add(g.userData.focus);
    this.particles.burst({ origin: o, ...opts });
  }

  async missionSuccess(i) {
    const g = this.locs[i]; const u = g.userData;
    if (i === 0) {
      // Orka: lampu dari redup ke terang, grinder berhenti, pintu terbuka, biji kopi terbang
      u.lights.forEach((l) => tween({ from: 0, to: 2.5, duration: 0.8, onUpdate: (v) => { l.intensity = v; } }));
      u.doors[0] && tween({ from: 0, to: -1.4, duration: 1.0, ease: easeOutBack, onUpdate: (v) => { u.doors[0].rotation.y = v; u.doors[1].rotation.y = -v; } });
      u.grinderSpin = false;
      this.burstAt(i, { count: 60, colors: [0x5a3a1e, 0x3b2314, 0x8a5a2b], speed: 5, up: 7, size: [0.15, 0.3], flat: false });
      this.burstAt(i, { count: 60, colors: [0x1fb8a6, 0xffffff, 0xf7c948], speed: 6, up: 8 });
    } else if (i === 1) {
      // Nako: kasir berbunyi, tiket keluar jadi golden ticket, percikan
      u.ticket.visible = true; u.ticket.material = mat(P.white);
      tween({ from: -1.2, to: 0.4, duration: 0.8, onUpdate: (v) => { u.ticket.position.z = v; } });
      setTimeout(() => { u.ticket.material = emissive(P.gold, 0.8); }, 900);
      this.burstAt(i, { count: 120, colors: [0xf2c14e, 0xffd700, 0xfff1a8, 0xffa23d], speed: 7, up: 10, size: [0.12, 0.3] });
      tween({ from: 1.6, to: 3.5, duration: 0.5, onUpdate: (v) => { u.neonLight.intensity = v; } });
    } else if (i === 2) {
      // Kopikina: kotak hadiah terbuka, tumbler berputar keluar, confetti + spotlight
      u.giftBox.visible = true;
      await wait(300);
      tween({ from: 0, to: 1, duration: 0.7, ease: easeOutBack, onUpdate: (v) => { u.lid.position.y = 1.35 + v * 1.4; u.lid.rotation.z = v * 0.9; } });
      await wait(400);
      u.tumbler.visible = true; u.tumbler.scale.setScalar(0.01);
      tween({ from: 0, to: 1, duration: 1.2, ease: easeOutBack, onUpdate: (v) => { u.tumbler.scale.setScalar(v); u.tumbler.position.y = 1.9 + v * 1.6; u.tumbler.rotation.y = v * Math.PI * 4; } });
      this.burstAt(i, { count: 160, speed: 8, up: 11, size: [0.15, 0.35] });
      this.spotlight(i, 0xffffff);
      this.orbitAround(i, 2.4);
    } else if (i === 3) {
      // Ranking: semua bar naik, dua bar atas jadi emas, beam cahaya
      u.bars.forEach((b, k) => tween({ from: 0.05, to: 1, duration: 1.2, ease: easeOutBack, onUpdate: (v) => { b.scale.y = v; b.position.y = 0.6 + (b.userData.h * v) / 2; } }));
      await wait(1200);
      u.bars.filter((b) => b.userData.unknown).forEach((b) => { b.material = emissive(P.gold, 0.7); });
      this.burstAt(i, { count: 200, colors: [0xf2c14e, 0xffffff, 0x1fb8a6], speed: 9, up: 12 });
      this.spotlight(i, 0xffe9a8);
    }
  }

  spotlight(i, color) {
    const g = this.locs[i];
    const sl = new THREE.SpotLight(color, 0, 40, 0.5, 0.5, 1);
    sl.position.copy(g.position).add(new THREE.Vector3(0, 18, 6));
    sl.target.position.copy(g.position).add(g.userData.focus); this.scene.add(sl, sl.target);
    tween({ from: 0, to: 60, duration: 0.5, onUpdate: (v) => { sl.intensity = v; } });
    setTimeout(() => { tween({ from: 60, to: 0, duration: 1, onUpdate: (v) => { sl.intensity = v; }, onComplete: () => { this.scene.remove(sl, sl.target); } }); }, 3500);
  }

  orbitAround(i, duration = 2) {
    if (reducedMotion()) return;
    const g = this.locs[i]; const u = g.userData;
    const center = g.position.clone().add(u.focus); const start = this.camPos.clone();
    const r = new THREE.Vector2(start.x - center.x, start.z - center.z); const len = r.length(); const a0 = Math.atan2(r.y, r.x);
    tween({ from: 0, to: Math.PI * 2, duration, ease: easeInOutQuart, onUpdate: (v) => { this.camPos.set(center.x + Math.cos(a0 + v) * len, start.y, center.z + Math.sin(a0 + v) * len); this.camTarget.copy(center); } });
  }

  // ------------------------------------------------------------ VAULT
  async vaultTransition(onStage) {
    // kamera terbang melewati map; lokasi menyala; garis cahaya menuju vault
    this.lightLine.visible = true;
    for (let i = 0; i < 4; i++) this.markers[i].userData.pin.material = emissive(P.teal2, 1.2);
    await this.flyCamera(new THREE.Vector3(0, 70, 20), new THREE.Vector3(0, 0, -10), 1.4);
    onStage && onStage(0);
    const total = this.lightLine.geometry.attributes.position.count;
    await new Promise((res) => tween({ from: 0, to: total, duration: reducedMotion() ? 0.5 : 2.4, onUpdate: (v) => this.lightLine.geometry.setDrawRange(0, Math.floor(v)), onComplete: res }));
    onStage && onStage(1);
    await this.locationView(4, 1.8);
  }

  vaultDeny() {
    const u = this.locs[4].userData;
    u.keyScreen.material = emissive(P.red, 1.2);
    this.shake(0.35);
    setTimeout(() => { u.keyScreen.material = emissive(P.teal2, 1); }, 900);
  }

  async vaultOpen(onStage) {
    const u = this.locs[4].userData; const g = this.locs[4];
    u.keyScreen.material = emissive(P.green, 1.3); onStage && onStage('granted');
    await wait(700);
    // bolt bergerak
    u.bolts.forEach((b) => tween({ from: 2.2, to: 1.5, duration: 0.6, onUpdate: (v) => { b.position.set(Math.cos(b.userData.angle) * v, Math.sin(b.userData.angle) * v, 0.1); } }));
    onStage && onStage('bolts');
    await wait(700);
    // roda berputar + shake halus + steam
    tween({ from: 0, to: Math.PI * 4, duration: 2.0, ease: easeInOutQuart, onUpdate: (v) => { u.wheel.rotation.z = v; } });
    this.shake(0.25); onStage && onStage('wheel');
    const steamOrigin = g.position.clone().add(new THREE.Vector3(0, 2, 2.5));
    this.particles.burst({ origin: steamOrigin, count: 60, colors: [0xffffff, 0xe8f6ff], speed: 1.5, up: 3, size: [0.3, 0.7], flat: false, gravity: -1.2, life: 2.2 });
    await wait(1600);
    // cahaya emas dari celah + pintu terbuka perlahan
    tween({ from: 2, to: 12, duration: 1.5, onUpdate: (v) => { u.glowLight.intensity = v; u.glowLight.color.set(P.gold); } });
    onStage && onStage('light');
    await new Promise((res) => tween({ from: 0, to: -1.9, duration: reducedMotion() ? 0.6 : 2.6, ease: easeInOutQuart, onUpdate: (v) => { u.doorPivot.rotation.y = v; }, onComplete: res }));
    onStage && onStage('open');
  }

  async jackpot() {
    const g = this.locs[4]; const center = g.position.clone().add(new THREE.Vector3(0, 0, 4));
    const burst = () => this.particles.burst({ origin: center.clone().add(new THREE.Vector3(0, 4, 0)), count: 150, colors: [0xf2c14e, 0xffd700, 0x1fb8a6, 0xffffff, 0xf28c38], speed: 12, up: 14, size: [0.15, 0.4] });
    burst();
    this.particles.rain({ center, count: 160, colors: [0x4caf50, 0x9ccc65, 0xf2c14e, 0xe8f4c0], width: 20, height: 16, size: [0.35, 0.6], life: 7 });
    this.particles.burst({ origin: center.clone().add(new THREE.Vector3(0, 2, 0)), count: 120, colors: [0xf2c14e, 0xffd700], speed: 7, up: 10, size: [0.2, 0.35], flat: false, life: 4 });
    this.orbitAround(4, reducedMotion() ? 0.1 : 7);
    for (let k = 1; k < 6; k++) setTimeout(burst, k * 700);
    for (let k = 0; k < 4; k++) setTimeout(() => this.particles.rain({ center, count: 80, colors: [0x4caf50, 0x9ccc65, 0xf2c14e], width: 20, height: 16, size: [0.35, 0.6], life: 7 }), 1500 + k * 1500);
  }

  async spinRoulette(resultIndex) {
    const r = this.roulette; const g = this.locs[4];
    r.position.copy(g.position).add(new THREE.Vector3(0, 7, 9));
    r.visible = true; r.scale.setScalar(0.01);
    await this.flyCamera(r.position.clone().add(new THREE.Vector3(0, 0.5, 16)), r.position.clone(), 1.2);
    await new Promise((res) => tween({ from: 0, to: 1, duration: 0.6, ease: easeOutBack, onUpdate: (v) => r.scale.setScalar(v), onComplete: res }));
    // sudut agar sektor resultIndex berada di bawah pointer (atas, +Y)
    const n = r.userData.n; const sectorCenter = ((resultIndex + 0.5) * Math.PI * 2) / n;
    const finalRot = Math.PI / 2 - sectorCenter + Math.PI * 2 * 6;
    await new Promise((res) => tween({ from: 0, to: finalRot, duration: reducedMotion() ? 0.8 : 4.5, ease: easeOutCubic, onUpdate: (v) => { r.userData.wheel.rotation.z = v; }, onComplete: res }));
    this.particles.burst({ origin: r.position.clone(), count: 150, speed: 9, up: 8, gravity: 10 });
  }

  hideRoulette() { this.roulette.visible = false; }

  // ------------------------------------------------------------ LOOP
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    updateTweens(now);
    if (this.orbit.on) {
      this.orbit.angle += dt * this.orbit.speed;
      this.camPos.set(Math.cos(this.orbit.angle) * this.orbit.radius, this.orbit.height, Math.sin(this.orbit.angle) * this.orbit.radius - 8);
      this.camTarget.set(0, 2, -10);
    }
    this.camera.position.copy(this.camPos);
    if (this.shakeAmt > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmt; this.camera.position.y += (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt *= 0.92;
    }
    this.camera.lookAt(this.camTarget);
    // marker mengambang + menghadap kamera
    this.markers.forEach((m, i) => { m.position.y = 13.5 + Math.sin(this.t * 2 + i) * 0.4; m.quaternion.copy(this.camera.quaternion); m.userData.pin.rotation.set(0, this.t * (m.userData.status === 'active' ? 2 : 0.4), 0); });
    // mobil
    for (const c of this.cars) { c.position.x += c.userData.dir * c.userData.speed * dt; if (c.position.x > 44) c.position.x = -44; if (c.position.x < -44) c.position.x = 44; }
    // grinder Orka berputar sampai mission 1 selesai
    const orka = this.locs[0]?.userData; if (orka && orka.grinderSpin !== false) orka.grinder.rotation.y += dt * 6;
    // neon Nako berkedip lembut
    const nako = this.locs[1]?.userData; if (nako) nako.neonLight.intensity = Math.max(nako.neonLight.intensity, 1.2 + Math.sin(this.t * 6) * 0.3);
    // mesin Kopikina
    const kina = this.locs[2]?.userData; if (kina) kina.machine.rotation.y = Math.sin(this.t) * 0.1;
    updateAvatar(this.avatar, dt);
    this.particles.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
