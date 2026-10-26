// Audio controller murni HTML5 Audio — fokus pada lagu JVKE (golden hour instrumental).
import { GAME } from '../config/gameConfig.js';
import bgmUrl from '../assets/audio/bgm.mp3';

let bgmAudio = null;

const prefs = { music: true, sfx: false };
try {
  const p = JSON.parse(localStorage.getItem('tch3d.audio') || '{}');
  Object.assign(prefs, p);
} catch { /* ignore */ }

function savePrefs() {
  try {
    localStorage.setItem('tch3d.audio', JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export function ensureAudio() {
  if (!bgmAudio) {
    bgmAudio = new Audio(bgmUrl);
    bgmAudio.loop = true;
    bgmAudio.preload = 'auto';
    bgmAudio.volume = prefs.music ? (GAME?.audio?.music ?? 0.35) : 0;
  }
  return bgmAudio;
}

export const audioPrefs = () => ({ ...prefs });

export function toggleMusic() {
  prefs.music = !prefs.music;
  savePrefs();

  const audio = ensureAudio();
  audio.volume = prefs.music ? (GAME?.audio?.music ?? 0.35) : 0;

  if (prefs.music) {
    startMusic();
  } else {
    stopMusic();
  }
  return prefs.music;
}

export function toggleSfx() {
  prefs.sfx = !prefs.sfx;
  savePrefs();
  return prefs.sfx;
}

export function startMusic() {
  if (!prefs.music) return;
  const audio = ensureAudio();
  audio.volume = GAME?.audio?.music ?? 0.35;
  if (audio.paused) {
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        // Otomatis ter-play saat interaksi klik/tap pertama
      });
    }
  }
}

export function stopMusic() {
  if (bgmAudio) {
    bgmAudio.pause();
  }
}

// Web Audio API dilepas — sfx noop proxy agar pemanggilan sfx.* di UI/game tetap aman tanpa suara sintetis
const noop = () => {};
export const sfx = new Proxy({}, {
  get: () => noop,
});

