// Game state — satu sumber kebenaran, dengan event emitter sederhana.
import { MISSIONS } from '../config/gameConfig.js';

const SAVE_KEY = 'tch3d.save.v1';

export function freshState() {
  return {
    teamName: '',
    phase: 'landing', // landing | howto | map | mission | vault | reward | result
    currentMission: 0, // index 0..3, 4 = vault
    missionStatus: MISSIONS.map((_, i) => (i === 0 ? 'active' : 'locked')), // locked|active|completed
    stepIndex: 0,
    digits: { A: null, B: null, C: null, D: null },
    baseTime: 0, // detik berjalan (tanpa penalti)
    penaltyTime: 0,
    timerRunning: false,
    hintCount: 0,
    hintsUsed: MISSIONS.map(() => 0), // per mission (0..3)
    wrongAnswers: MISSIONS.map(() => 0),
    wrongStreak: 0,
    attemptCount: 0,
    vaultAttempts: 0,
    achievements: [],
    gameCompleted: false,
    doorprize: null,
    savedAt: null,
  };
}

class Store {
  constructor() {
    this.state = freshState();
    this.listeners = new Set();
  }
  get() { return this.state; }
  set(patch) {
    Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
    this.emit();
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(this.state); }

  reset() { this.state = freshState(); this.emit(); }

  save() {
    try {
      this.state.savedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch { /* storage unavailable */ }
  }
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.gameCompleted || !['map', 'mission', 'vault'].includes(data.phase)) return false;
      this.state = { ...freshState(), ...data, timerRunning: false };
      this.emit();
      return true;
    } catch { return false; }
  }
  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
}

export const store = new Store();

export const pinString = (s) => ['A', 'B', 'C', 'D'].map((k) => (s.digits[k] ?? '?')).join('');
export const finalTime = (s) => s.baseTime + s.penaltyTime;
export const fmtTime = (sec) => {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60); const r = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};
