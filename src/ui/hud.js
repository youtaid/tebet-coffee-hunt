import { el, app, remove } from './dom.js';
import { store, fmtTime, finalTime } from '../game/state.js';
import { LOCATIONS } from '../config/gameConfig.js';
import { audioPrefs, toggleMusic, toggleSfx, sfx } from '../audio/audio.js';

let hud = null;
let refs = {};
let onHint = null;

export function setHintHandler(fn) { onHint = fn; }

export function showHud() {
  if (hud) return hud;
  const prefs = audioPrefs();
  refs.mission = el('span', {}, 'MISSION 1 / 4');
  refs.timer = el('span', {}, '00:00');
  refs.pen = el('span.pen', {}, '');
  refs.hint = el('span', {}, '0');
  refs.music = el('button', { class: prefs.music ? 'on' : '', 'aria-label': 'Music on/off', title: 'Music', onclick: () => { const on = toggleMusic(); refs.music.classList.toggle('on', on); } }, '♫');
  refs.sfxb = el('button', { class: prefs.sfx ? 'on' : '', 'aria-label': 'SFX on/off', title: 'SFX', onclick: () => { const on = toggleSfx(); refs.sfxb.classList.toggle('on', on); } }, '🔊');
  refs.hintBtn = el('button.hintbtn', { 'aria-label': 'Gunakan hint', onclick: () => { sfx.click(); onHint && onHint(); } }, '💡 HINT');
  refs.slots = ['A', 'B', 'C', 'D'].map((k) => el('div.slot', { 'aria-label': `Digit ${k}`, 'data-k': k }, '?'));
  hud = el('div#hud',
    el('div.chip.left', el('small', {}, 'MISSION'), refs.mission),
    el('div.chip.center', el('small', {}, 'TIME'), refs.timer, refs.pen),
    el('div.chip.right', el('small', {}, 'HINT'), refs.hint, refs.hintBtn, refs.music, refs.sfxb),
    el('div.pinhud', { 'aria-label': 'Secret PIN' }, el('small', {}, 'SECRET PIN'), ...refs.slots),
  );
  document.body.append(hud);
  store.subscribe(render);
  render(store.get());
  return hud;
}

export function hideHud() { remove(hud); hud = null; }
export function setHintEnabled(on) { if (refs.hintBtn) refs.hintBtn.disabled = !on; }

function render(s) {
  if (!hud) return;
  const m = Math.min(s.currentMission + 1, 4);
  refs.mission.textContent = s.phase === 'vault' || s.currentMission >= 4 ? 'VAULT' : `MISSION ${m} / 4`;
  refs.timer.textContent = fmtTime(finalTime(s));
  refs.pen.textContent = s.penaltyTime ? `+${fmtTime(s.penaltyTime)}` : '';
  refs.hint.textContent = String(s.hintCount);
  refs.slots.forEach((sl) => {
    const v = s.digits[sl.dataset.k];
    const got = v !== null && v !== undefined;
    sl.textContent = got ? v : '?';
    sl.classList.toggle('got', got);
  });
}

/** Animasi digit masuk ke slot HUD. */
export function glowSlot(k) {
  const sl = refs.slots?.find((x) => x.dataset.k === k);
  if (!sl) return;
  sl.classList.add('got');
}
export function glowAllSlots() { refs.slots?.forEach((sl) => { sl.classList.add('got'); }); }

export const locationName = (i) => LOCATIONS[i].name;
