// Sistem audio: SFX sintetis via Web Audio API + BGM dari file audio (MP3).
import { GAME } from '../config/gameConfig.js';
import bgmUrl from '../assets/audio/bgm.mp3';

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let bgmAudio = null;
let bgmSourceNode = null;

const prefs = { music: true, sfx: true };
try {
  const p = JSON.parse(localStorage.getItem('tch3d.audio') || '{}');
  Object.assign(prefs, p);
} catch { /* ignore */ }

function savePrefs() { try { localStorage.setItem('tch3d.audio', JSON.stringify(prefs)); } catch { /* ignore */ } }

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = prefs.music ? GAME.audio.music : 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = prefs.sfx ? GAME.audio.sfx : 0; sfxGain.connect(master);
  } catch { ctx = null; }
  return ctx;
}

function initBgm() {
  if (bgmAudio) return bgmAudio;
  bgmAudio = new Audio(bgmUrl);
  bgmAudio.loop = true;
  bgmAudio.preload = 'auto';

  if (ctx && musicGain && !bgmSourceNode) {
    try {
      bgmSourceNode = ctx.createMediaElementSource(bgmAudio);
      bgmSourceNode.connect(musicGain);
      bgmAudio.volume = 1;
    } catch {
      bgmAudio.volume = prefs.music ? GAME.audio.music : 0;
    }
  } else {
    bgmAudio.volume = prefs.music ? GAME.audio.music : 0;
  }
  return bgmAudio;
}

export const audioPrefs = () => ({ ...prefs });
export function toggleMusic() {
  prefs.music = !prefs.music; savePrefs();
  if (musicGain && ctx) {
    musicGain.gain.setTargetAtTime(prefs.music ? GAME.audio.music : 0, ctx.currentTime, 0.05);
  }
  if (bgmAudio && !bgmSourceNode) {
    bgmAudio.volume = prefs.music ? GAME.audio.music : 0;
  }
  if (prefs.music) startMusic(); else stopMusic();
  return prefs.music;
}
export function toggleSfx() {
  prefs.sfx = !prefs.sfx; savePrefs();
  if (sfxGain) sfxGain.gain.value = prefs.sfx ? GAME.audio.sfx : 0;
  return prefs.sfx;
}

function tone({ freq = 440, type = 'sine', dur = 0.2, vol = 0.5, delay = 0, slide = 0, out = null }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(out || sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.3, vol = 0.3, delay = 0, lp = 1200 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(t0);
}

export const sfx = {
  click() { ensureAudio(); tone({ freq: 660, type: 'square', dur: 0.06, vol: 0.15 }); },
  correct() { ensureAudio(); tone({ freq: 523, dur: 0.15, vol: 0.4 }); tone({ freq: 784, dur: 0.25, vol: 0.4, delay: 0.1 }); },
  wrong() { ensureAudio(); tone({ freq: 220, type: 'triangle', dur: 0.25, vol: 0.35, slide: -80 }); },
  digit() {
    ensureAudio();
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.35, vol: 0.35, delay: i * 0.09 }));
  },
  unlock() { ensureAudio(); tone({ freq: 392, dur: 0.3, vol: 0.3 }); tone({ freq: 587, dur: 0.5, vol: 0.3, delay: 0.15 }); },
  hint() { ensureAudio(); tone({ freq: 880, type: 'triangle', dur: 0.12, vol: 0.2 }); tone({ freq: 660, type: 'triangle', dur: 0.2, vol: 0.2, delay: 0.1 }); },
  cash() { ensureAudio(); tone({ freq: 1200, type: 'square', dur: 0.05, vol: 0.2 }); tone({ freq: 1600, type: 'square', dur: 0.1, vol: 0.2, delay: 0.07 }); noise({ dur: 0.15, vol: 0.15, delay: 0.1, lp: 3000 }); },
  alarm() { ensureAudio(); for (let i = 0; i < 3; i++) tone({ freq: 330, type: 'sawtooth', dur: 0.12, vol: 0.25, delay: i * 0.18 }); },
  rumble() { ensureAudio(); noise({ dur: 1.4, vol: 0.4, lp: 160 }); tone({ freq: 55, type: 'sine', dur: 1.4, vol: 0.5 }); },
  mech() { ensureAudio(); for (let i = 0; i < 4; i++) { noise({ dur: 0.08, vol: 0.25, delay: i * 0.22, lp: 900 }); tone({ freq: 180 + i * 40, type: 'square', dur: 0.08, vol: 0.12, delay: i * 0.22 }); } },
  jackpot() {
    ensureAudio();
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    notes.forEach((f, i) => tone({ freq: f, dur: 0.3, vol: 0.3, delay: i * 0.1 }));
    for (let i = 0; i < 12; i++) tone({ freq: 2000 + Math.random() * 1500, type: 'square', dur: 0.05, vol: 0.08, delay: 0.8 + i * 0.07 });
    noise({ dur: 1.5, vol: 0.2, delay: 0.5, lp: 4000 }); // crowd-ish
  },
  coin() { ensureAudio(); tone({ freq: 1800, type: 'square', dur: 0.05, vol: 0.1 }); tone({ freq: 2400, type: 'square', dur: 0.12, vol: 0.1, delay: 0.05 }); },
  tick() { ensureAudio(); tone({ freq: 900, type: 'square', dur: 0.03, vol: 0.08 }); },
  countdown() { ensureAudio(); tone({ freq: 440, dur: 0.2, vol: 0.3 }); },
  go() { ensureAudio(); tone({ freq: 880, dur: 0.5, vol: 0.4 }); },
};

// Pemutaran musik latar belakang (BGM)
export function startMusic() {
  ensureAudio();
  if (!prefs.music) return;
  const audio = initBgm();
  if (ctx && musicGain && !bgmSourceNode) {
    try {
      bgmSourceNode = ctx.createMediaElementSource(audio);
      bgmSourceNode.connect(musicGain);
      audio.volume = 1;
    } catch {
      audio.volume = prefs.music ? GAME.audio.music : 0;
    }
  }
  if (audio.paused) {
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => { /* Akan play otomatis saat interaksi berikutnya */ });
    }
  }
}

export function stopMusic() {
  if (bgmAudio) {
    bgmAudio.pause();
  }
}
