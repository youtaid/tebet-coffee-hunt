import { store } from './state.js';

let interval = null;
let lastTick = 0;

export function startTimer() {
  if (interval) return;
  lastTick = performance.now();
  store.set({ timerRunning: true });
  interval = setInterval(() => {
    const now = performance.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const s = store.get();
    s.baseTime += dt;
    store.emit();
  }, 250);
}

export function stopTimer() {
  if (interval) clearInterval(interval);
  interval = null;
  store.set({ timerRunning: false });
}

export function addPenalty(seconds) {
  const s = store.get();
  s.penaltyTime += seconds;
  store.emit();
}
