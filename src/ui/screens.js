import { el, app, mount, remove, sleep } from './dom.js';
import { GAME, LOCATIONS, ACHIEVEMENTS } from '../config/gameConfig.js';
import { store, fmtTime, finalTime, pinString } from '../game/state.js';
import { sfx } from '../audio/audio.js';
import { leaderboard } from '../game/leaderboard.js';

// ------------------------------------------------------------ LOADING
export async function loadingScreen(minMs = 1800) {
  const bar = el('i');
  const line = el('p.sub', {}, GAME.loadingLines[0]);
  const scr = mount(el('div.screen.solid', el('div.loading',
    el('div.cup', el('i.steam'), el('i.steam'), el('i.steam'), el('div.body'), el('div.handle')),
    el('div', { style: 'display:flex;justify-content:center;align-items:center;gap:6px' }, el('h2', { style: 'font-size:22px;letter-spacing:.2em' }, 'TEBET COFFEE HUNT'), el('i.bean')),
    el('div.bar', bar), line,
  )));
  const t0 = performance.now();
  await new Promise((res) => {
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / minMs);
      bar.style.width = `${Math.round(p * 100)}%`;
      line.textContent = p >= 1 ? 'READY!' : GAME.loadingLines[Math.min(GAME.loadingLines.length - 1, Math.floor(p * GAME.loadingLines.length))];
      if (p >= 1) setTimeout(res, 350); else requestAnimationFrame(tick);
    };
    tick();
  });
  remove(scr);
}

// ------------------------------------------------------------ LANDING
export function landingScreen({ hasSave }) {
  return new Promise((resolve) => {
    const input = el('input', { type: 'text', placeholder: 'Nama tim', maxlength: 24, 'aria-label': 'Nama tim', value: store.get().teamName || '' });
    const btn = el('button.btn', { onclick: () => { sfx.click(); resolve({ action: 'new', team: input.value.trim() || 'TEAM TEBET' }); } }, 'START THE HUNT');
    const cont = hasSave ? el('button.btn.ghost', { onclick: () => { sfx.click(); resolve({ action: 'continue' }); } }, 'CONTINUE GAME') : null;
    const lb = el('button.btn.ghost.sm', { onclick: () => { sfx.click(); resolve({ action: 'leaderboard' }); } }, 'LEADERBOARD');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    mount(el('div.screen', el('div.landing',
      el('div.eyebrow', {}, 'KONSTANTA EDUCATION × TEBET'),
      el('h1.title', {}, 'TEBET COFFEE HUNT'),
      el('div.eyebrow', { style: 'font-size:16px;margin-top:4px' }, GAME.subtitle),
      el('div.tag', ...GAME.tagline.map((t) => el('span', {}, t))),
      el('div.row.center', input, btn, cont),
      el('div.row.center.mt', lb),
    )));
    setTimeout(() => input.focus(), 50);
  });
}

// ------------------------------------------------------------ HOW TO PLAY
export function howToPlayScreen() {
  return new Promise((resolve) => {
    mount(el('div.screen.dim', el('div.panel.wide',
      el('div.eyebrow', {}, 'HOW TO PLAY'),
      el('h2.title', { style: 'font-size:30px' }, 'SIX THINGS TO KNOW'),
      el('div.cards', ...GAME.howToPlay.map((c, i) => el('div.card', { style: `animation-delay:${i * 90}ms` }, el('div.ic', {}, c.icon), el('h3', {}, c.title), el('p', {}, c.text)))),
      el('div.row.center', el('button.btn', { onclick: () => { sfx.click(); resolve(); } }, "GOT IT — LET'S GO!")),
    )));
  });
}

// ------------------------------------------------------------ INTRO CINEMATIC OVERLAY
export function cinematicOverlay() {
  const line = el('div.line', {}, '');
  const wrap = el('div.cine', line);
  let skipped = false;
  const skip = el('button.btn.ghost.sm.skip', { onclick: () => { skipped = true; } }, 'SKIP ▸');
  mount(el('div', { style: 'position:absolute;inset:0' }, wrap, skip));
  return {
    setLine(t) { line.textContent = t; line.style.animation = 'none'; void line.offsetWidth; line.style.animation = ''; },
    get skipped() { return skipped; },
    async countdown() {
      remove(wrap); remove(skip);
      for (const n of ['3', '2', '1']) { sfx.countdown(); const c = el('div.count', {}, n); app().append(c); await sleep(900); remove(c); }
      sfx.go();
      const c = el('div.count', { style: 'font-size:clamp(34px,7vw,80px);letter-spacing:.1em' }, 'COFFEE HUNT START!'); app().append(c); await sleep(1100); remove(c);
    },
  };
}

// ------------------------------------------------------------ MAP BAR
export function mapBar(statuses, onEnter) {
  const icons = { locked: '🔒', active: '✨', completed: '✅' };
  const bar = el('div.mapbar', ...LOCATIONS.slice(0, 4).map((l, i) => {
    const st = statuses[i];
    return el('button.loc', { class: st, disabled: st !== 'active', onclick: () => { sfx.click(); onEnter(i); } }, `${icons[st]} ${l.name}`);
  }), el('button.loc', { class: statuses.every((s) => s === 'completed') ? 'active' : 'locked', disabled: !statuses.every((s) => s === 'completed'), onclick: () => { sfx.click(); onEnter(4); } }, `${statuses.every((s) => s === 'completed') ? '🔐' : '🔒'} Coffee Vault`));
  app().append(bar);
  return bar;
}

// ------------------------------------------------------------ TOASTS
let toastEl = null;
export function toast({ title, text, kind = 'ok', ms = 1800 }) {
  remove(toastEl);
  toastEl = el('div.toast', { class: kind, role: 'status' }, el('h3', {}, `${kind === 'ok' ? '✔ ' : '✖ '}${title}`), text ? el('p', {}, text) : null);
  app().append(toastEl);
  const mine = toastEl;
  setTimeout(() => { if (toastEl === mine) { remove(mine); toastEl = null; } }, ms);
}
export function flash(color = 'rgba(31,184,166,.7)') {
  const f = el('div.flash', { style: `background:${color}` }); app().append(f); setTimeout(() => remove(f), 700);
}

export async function bigDigit(digit, title) {
  const w = el('div.bigdigit', el('div.t', {}, title), el('div.d', {}, digit));
  app().append(w); sfx.digit();
  await sleep(1700); remove(w);
}

export async function nextStop(name, ms = 1600) {
  const n = el('div.nextstop', el('small', {}, 'NEXT STOP'), name);
  app().append(n); await sleep(ms); remove(n);
}

export function stageText(text, { small = '', gold = false, ms = 1400 } = {}) {
  const s = el('div.stage', { class: gold ? 'gold' : '' }, small ? el('small', {}, small) : null, text);
  app().append(s);
  if (ms) setTimeout(() => remove(s), ms);
  return s;
}

// ------------------------------------------------------------ HINT MODAL
export function hintModal(mission, usedCount, onUse) {
  return new Promise((resolve) => {
    const next = usedCount;
    const scr = el('div.screen.dim');
    const list = el('div.hintlist', ...mission.hints.map((h, i) => el('div.hintitem', { class: i < usedCount ? 'used' : '' },
      el('span', {}, i < usedCount ? h : `Hint ${i + 1}: ${['clue kecil', 'langkah berikutnya', 'metode penyelesaian'][i]}`),
      el('span.pen', {}, `+${GAME.penalties.hint[i]}s`))));
    const canUse = next < mission.hints.length;
    const close = () => { remove(scr); resolve(false); };
    scr.append(el('div.modal',
      el('h3', {}, `💡 HINT — ${mission.title}`),
      list,
      canUse ? el('p', {}, `Hint ${next + 1} menambah penalti +${GAME.penalties.hint[next]} detik.`) : el('p', {}, 'Semua hint sudah dipakai.'),
      el('div.row', canUse ? el('button.btn.gold', { onclick: () => { sfx.hint(); onUse(next); remove(scr); resolve(true); } }, 'USE HINT') : null, el('button.btn.ghost', { onclick: close }, 'CANCEL')),
    ));
    scr.addEventListener('click', (e) => { if (e.target === scr) close(); });
    app().append(scr);
  });
}

// ------------------------------------------------------------ VAULT PANEL
export function vaultPanel(onSubmit) {
  const inputs = [0, 1, 2, 3].map((i) => el('input', { type: 'text', inputmode: 'numeric', maxlength: 1, 'aria-label': `PIN digit ${i + 1}`, autocomplete: 'off' }));
  const wrap = el('div.pininputs', ...inputs);
  const btn = el('button.btn.gold', { onclick: () => submit() }, 'UNLOCK');
  const msg = el('p.sub', {}, 'Pemain harus mengingat digit yang dikumpulkan.');
  const panel = el('div.vaultpanel', el('div.eyebrow', {}, 'COFFEE VAULT'), el('h2.title', { style: 'font-size:26px' }, 'ENTER THE SECRET PIN'), wrap, msg, btn);
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && i < 3) inputs[i + 1].focus(); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus(); if (e.key === 'Enter') submit(); });
  });
  const submit = () => { const pin = inputs.map((x) => x.value).join(''); if (pin.length < 4) { wrap.classList.add('deny'); setTimeout(() => wrap.classList.remove('deny'), 500); return; } onSubmit(pin); };
  app().append(panel); setTimeout(() => inputs[0].focus(), 50);
  return {
    deny() { wrap.classList.add('deny'); btn.disabled = true; setTimeout(() => { wrap.classList.remove('deny'); inputs.forEach((x) => { x.value = ''; }); inputs[0].focus(); btn.disabled = false; }, 1100); },
    grant() { wrap.classList.add('grant'); btn.disabled = true; inputs.forEach((x) => { x.disabled = true; }); },
    remove() { remove(panel); },
  };
}

// ------------------------------------------------------------ JACKPOT
export async function jackpotOverlay() {
  const amt = el('div.amt', {}, 'Rp 0');
  const glow = el('div.glow'); app().append(glow);
  const box = el('div.jackpot',
    el('div.congrats', {}, 'CONGRATULATIONS!'),
    el('div.cheque', el('div.lab', {}, GAME.jackpot.label), amt, el('div.tag', {}, 'IN-GAME REWARD · BUKAN UANG SUNGGUHAN')),
  );
  app().append(box);
  const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID');
  for (const v of GAME.jackpot.ladder) { amt.textContent = fmt(v); sfx.tick(); await sleep(380); }
  amt.textContent = fmt(GAME.jackpot.final); sfx.jackpot();
  box.append(el('div.big', {}, 'JACKPOT!'));
  fireworks(14);
  await sleep(2600);
  box.append(el('div.congrats', { style: 'margin-top:10px;color:var(--teal2)' }, 'YOU CRACKED THE COFFEE VAULT!'));
  await sleep(2200);
  return () => { remove(box); remove(glow); };
}

function fireworks(n) {
  const cols = ['#f7c948', '#1fb8a6', '#f28c38', '#fff', '#e05252', '#2ad1c9'];
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const cx = 10 + Math.random() * 80, cy = 10 + Math.random() * 50;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2; const r = 60 + Math.random() * 80;
        const f = el('div.fire', { style: `left:${cx}vw;top:${cy}vh;background:${cols[k % cols.length]};--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px` });
        app().append(f); setTimeout(() => remove(f), 1300);
      }
    }, i * 220);
  }
}

export async function doorprizeOverlay(name) {
  const s1 = stageText('BONUS DOORPRIZE!', { small: 'SPIN THE WHEEL', gold: true, ms: 0 });
  return {
    async result() {
      remove(s1);
      const isMoney = /cash|jackpot/i.test(name);
      const s2 = stageText(`YOU GOT ${name.toUpperCase()}!`, { small: isMoney ? 'VIRTUAL PRIZE / IN-GAME REWARD' : 'IN-GAME REWARD', gold: true, ms: 0 });
      fireworks(6); sfx.jackpot();
      await sleep(2800); remove(s2);
    },
  };
}

// ------------------------------------------------------------ RESULT
export function resultScreen({ stars, score, achievements, onLeaderboard, onRestart }) {
  const s = store.get();
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  const wrongPen = Math.max(0, s.vaultAttempts - 1) * GAME.penalties.wrongVault;
  const hintPenalty = s.penaltyTime - wrongPen;
  const row = (k, v, cls = '') => [el('div.k', {}, k), el('div.v', { class: cls }, v)];
  mount(el('div.screen.dim', el('div.panel',
    el('div.eyebrow', {}, 'MISSION COMPLETE'),
    el('h2.title', { style: 'font-size:34px' }, s.teamName),
    el('div.stars', { 'aria-label': `${stars} bintang` }, starStr),
    el('div.stats',
      ...row('Base Time', fmtTime(s.baseTime)),
      ...row('Hint Penalty', `+${fmtTime(Math.max(0, hintPenalty))}`),
      ...row('Wrong PIN Penalty', `+${fmtTime(wrongPen)}`),
      ...row('Final Time', fmtTime(finalTime(s)), 'final'),
      ...row('Hints Used', String(s.hintCount)),
      ...row('Vault Attempts', String(s.vaultAttempts)),
      ...row('Doorprize', s.doorprize || '—'),
      ...row('Score', score.toLocaleString('id-ID'), 'final'),
    ),
    achievements.length ? el('div.eyebrow', {}, 'ACHIEVEMENTS') : null,
    el('div.badges', ...achievements.map((a) => el('div.badge', {}, a.name, el('span', {}, a.desc)))),
    el('div.row', el('button.btn', { onclick: () => { sfx.click(); onLeaderboard(); } }, 'LEADERBOARD'), el('button.btn.ghost', { onclick: () => { sfx.click(); onRestart(); } }, 'PLAY AGAIN')),
  )));
}

export async function leaderboardScreen({ me, onBack }) {
  let currentFilter = 'top10';
  let searchQuery = '';

  const stats = await leaderboard.getStats();

  const statsBar = el('div.lb-stats',
    el('div.lb-stat-item',
      el('span.k', {}, '👥 TOTAL TIM'),
      el('span.v', {}, String(stats.totalTeams || 0))
    ),
    el('div.lb-stat-item',
      el('span.k', {}, '⚡ TERCEPAT'),
      el('span.v', {}, stats.fastestTime ? fmtTime(stats.fastestTime) : '—')
    ),
    el('div.lb-stat-item',
      el('span.k', {}, '🏆 SKOR TERTINGGI'),
      el('span.v.gold', {}, stats.topScore ? stats.topScore.toLocaleString('id-ID') : '—')
    )
  );

  const searchInput = el('input.lb-search', {
    type: 'text',
    placeholder: '🔍 Cari nama tim...',
    value: '',
    oninput: (e) => {
      searchQuery = e.target.value;
      updateTable();
    }
  });

  const btnTop10 = el('button.btn.sm', {
    class: 'on',
    onclick: () => {
      currentFilter = 'top10';
      btnTop10.classList.add('on');
      btnAll.classList.remove('on');
      updateTable();
    }
  }, 'TOP 10');

  const btnAll = el('button.btn.ghost.sm', {
    onclick: () => {
      currentFilter = 'all';
      btnAll.classList.add('on');
      btnTop10.classList.remove('on');
      updateTable();
    }
  }, 'SEMUA TIM');

  const btnExport = el('button.btn.ghost.sm.lb-export', {
    onclick: () => {
      sfx.click();
      leaderboard.exportCSV();
    },
    title: 'Download file CSV untuk Excel atau Google Sheets'
  }, '📥 EXPORT CSV');

  const tableContainer = el('div.lb-table-wrap');

  async function updateTable() {
    const limit = currentFilter === 'top10' ? 10 : 200;
    const rows = await leaderboard.list({ limit, search: searchQuery });
    const medal = ['🥇', '🥈', '🥉'];

    if (!rows.length) {
      tableContainer.replaceChildren(
        el('div.lb-empty', {}, searchQuery ? `Tidak ditemukan tim dengan kata kunci "${searchQuery}"` : 'Belum ada data tim.')
      );
      return;
    }

    const starIcons = (num) => '⭐'.repeat(Math.max(1, Math.min(3, num || 1)));

    const trs = rows.map((r, i) => {
      const isMe = me && r.id === me;
      const rankBadge = medal[i] || `#${i + 1}`;
      return el('tr', { class: isMe ? 'me' : '' },
        el('td.td-rank', {}, rankBadge),
        el('td.td-team', {},
          el('span.team-name', {}, r.team || 'Anonim'),
          isMe ? el('span.badge-you', {}, 'KAMU') : null
        ),
        el('td.td-stars', {}, starIcons(r.stars)),
        el('td.td-time', {}, fmtTime(r.time)),
        el('td.td-hints', {}, String(r.hints ?? 0)),
        el('td.td-doorprize', {}, r.doorprize ? `🎁 ${r.doorprize}` : '—'),
        el('td.td-score', {}, el('strong', {}, (r.score || 0).toLocaleString('id-ID')))
      );
    });

    const table = el('table.lb',
      el('thead', el('tr',
        el('th', {}, 'RANK'),
        el('th', {}, 'TIM'),
        el('th', {}, 'RATING'),
        el('th', {}, 'WAKTU'),
        el('th', {}, 'HINT'),
        el('th', {}, 'HADIAH'),
        el('th', { style: 'text-align:right' }, 'SKOR')
      )),
      el('tbody', ...trs)
    );

    tableContainer.replaceChildren(table);

    if (me) {
      setTimeout(() => {
        const myRow = table.querySelector('tr.me');
        if (myRow) myRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  updateTable();

  mount(el('div.screen.dim', el('div.panel.wide.lb-panel',
    el('div.eyebrow', {}, '🏆 LEADERBOARD'),
    el('h2.title', { style: 'font-size:28px' }, 'TEBET COFFEE HUNT'),
    el('p.sub', { style: 'margin-bottom:12px' }, 'Peringkat Tim & Catatan Waktu Tercepat'),
    statsBar,
    el('div.lb-toolbar',
      searchInput,
      el('div.lb-filter-group', btnTop10, btnAll),
      btnExport
    ),
    tableContainer,
    el('div.row.lb-footer',
      el('button.btn', { onclick: () => { sfx.click(); onBack(); } }, 'PLAY AGAIN'),
      el('button.btn.ghost.sm', { onclick: () => { sfx.click(); updateTable(); } }, '🔄 REFRESH')
    )
  )));
}

export function liteBanner() { document.body.append(el('div.litebar', { style: 'position:fixed;z-index:3' }, 'LITE MODE — perangkat ini tidak dapat menjalankan tampilan 3D penuh. Game tetap bisa dimainkan.')); }

export const achievementList = ACHIEVEMENTS;
export { pinString };
