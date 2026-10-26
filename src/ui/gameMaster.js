// Game Master Mode — tersembunyi. Akses: ?mode=host, tombol kecil kiri-bawah, atau Ctrl+Shift+G.
import { el, app, remove } from './dom.js';
import { MISSIONS, GAME } from '../config/gameConfig.js';
import { store, fmtTime, finalTime } from '../game/state.js';
import { revealAnswer } from '../game/validation.js';
import { leaderboard } from '../game/leaderboard.js';

let panel = null;
let actions = {};

export function setGmActions(a) { actions = a; }

export function isHostMode() {
  return new URLSearchParams(location.search).get('mode') === 'host';
}

export function installGmTriggers() {
  const b = el('button.gmbtn', { 'aria-label': 'Game Master Mode', title: 'Game Master', onclick: toggleGm });
  app().append(b);
  window.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') toggleGm(); });
  // Pastikan tombol tetap ada meski app di-replace
  const obs = new MutationObserver(() => { if (!document.body.contains(b)) app().append(b); if (panel && !document.body.contains(panel)) app().append(panel); });
  obs.observe(app(), { childList: true });
  if (isHostMode()) toggleGm(true);
}

export function toggleGm(force) {
  const want = force === undefined ? !panel : force;
  if (!want) { remove(panel); panel = null; return; }
  if (panel) return;
  render();
}

function render() {
  const s = store.get();
  const answersTable = el('table', ...MISSIONS.flatMap((m) => m.steps.flatMap((st) => st.inputs.map((inp) => el('tr', el('td', {}, `${m.id.toUpperCase()} ${st.id} · ${inp.label}`), el('td', {}, revealAnswer(`${m.id}.${st.id}.${inp.name}`) ?? '?'))))), el('tr', el('td', {}, 'FINAL PIN'), el('td', {}, revealAnswer('vault.pin'))));
  let status = statusOf(s);
  const btn = (t, fn, cls = 'btn ghost sm') => el('button', { class: cls, onclick: () => { fn(); refresh(); } }, t);
  const missionBtns = MISSIONS.map((m, i) => el('div.row', el('span', { style: 'min-width:110px' }, `${i + 1}. ${m.title}`),
    btn('UNLOCK', () => actions.unlock && actions.unlock(i)), btn('LOCK', () => actions.lock && actions.lock(i)), btn('SKIP', () => actions.skip && actions.skip(i))));
  panel = el('div.gm', { role: 'dialog', 'aria-label': 'Game Master' },
    el('div.row', { style: 'justify-content:space-between' }, el('h3', {}, '🎛 GAME MASTER MODE'), el('button.btn.ghost.sm', { onclick: () => toggleGm(false) }, '✕')),
    el('div.eyebrow', {}, 'STATUS TIM'), status,
    el('div.row', btn(s.timerRunning ? 'PAUSE TIMER' : 'RESUME TIMER', () => actions.toggleTimer && actions.toggleTimer()), btn('+30s PENALTY', () => actions.penalty && actions.penalty(30)), btn('RESTART GAME', () => actions.restart && actions.restart(), 'btn sm')),
    el('div.eyebrow.mt', {}, 'MISSION CONTROL'), ...missionBtns,
    el('div.row.mt',
      btn('GO TO VAULT', () => actions.gotoVault && actions.gotoVault()),
      btn('EXPORT CSV', () => leaderboard.exportCSV()),
      btn('RESET SEED', () => leaderboard.reset()),
      btn('CLEAR LB', () => leaderboard.clear())
    ),
    el('div.eyebrow.mt', {}, 'KUNCI JAWABAN'), answersTable,
    el('p.note', {}, `Penalti hint: +${GAME.penalties.hint.join(' / +')}s · PIN salah: +${GAME.penalties.wrongVault}s`),
  );
  app().append(panel);
  const unsub = store.subscribe(() => { if (!panel) { unsub(); return; } refreshStatus(); });
  function refreshStatus() { const n = statusOf(store.get()); status.replaceWith(n); status = n; }
  function statusOf(ns) {
    return el('table',
      el('tr', el('td', {}, 'Team'), el('td', {}, ns.teamName || '—')),
      el('tr', el('td', {}, 'Phase'), el('td', {}, `${ns.phase} / step ${ns.stepIndex + 1}`)),
      el('tr', el('td', {}, 'Mission status'), el('td', {}, ns.missionStatus.map((x) => x[0].toUpperCase()).join(' '))),
      el('tr', el('td', {}, 'Digits'), el('td', {}, ['A', 'B', 'C', 'D'].map((k) => `${k}=${ns.digits[k] ?? '?'}`).join(' '))),
      el('tr', el('td', {}, 'Time (base / penalty)'), el('td', {}, `${fmtTime(ns.baseTime)} / +${fmtTime(ns.penaltyTime)} = ${fmtTime(finalTime(ns))}`)),
      el('tr', el('td', {}, 'Hints'), el('td', {}, `${ns.hintCount} (${ns.hintsUsed.join(',')})`)),
      el('tr', el('td', {}, 'Wrong answers / Vault attempts'), el('td', {}, `${ns.wrongAnswers.join(',')} / ${ns.vaultAttempts}`)),
    );
  }
  function refresh() { const p = panel; panel = null; remove(p); render(); }
}
