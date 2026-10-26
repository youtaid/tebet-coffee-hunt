// TEBET COFFEE HUNT 3D — orkestrasi alur game.
import { World } from './scenes/world.js';
import { GAME, MISSIONS } from './config/gameConfig.js';
import { store, pinString } from './game/state.js';
import { startTimer, stopTimer, addPenalty } from './game/timer.js';
import { check, revealAnswer } from './game/validation.js';
import { computeStars, computeScore, computeAchievements } from './game/scoring.js';
import { leaderboard } from './game/leaderboard.js';
import { ensureAudio, startMusic, sfx } from './audio/audio.js';
import { clearApp, sleep, remove } from './ui/dom.js';
import { showHud, hideHud, setHintHandler, glowSlot, glowAllSlots, setHintEnabled } from './ui/hud.js';
import * as S from './ui/screens.js';
import { runMission } from './missions/missionEngine.js';
import { installGmTriggers, setGmActions } from './ui/gameMaster.js';

// ------------------------------------------------------------ 3D world (atau Lite Mode)
const world = new World();
const nullWorld = new Proxy({}, { get: () => () => Promise.resolve() });
const W = world.init(document.getElementById('world')) ? world : nullWorld;
window.__tch = { world: W, store };
if (W === nullWorld) { document.body.classList.add('lite'); }

// Unlock audio pada interaksi pertama
window.addEventListener('pointerdown', () => { ensureAudio(); startMusic(); }, { once: true });
window.addEventListener('keydown', () => { ensureAudio(); startMusic(); }, { once: true });

let mapBarEl = null;

// ------------------------------------------------------------ BOOT
async function boot() {
  installGmTriggers();
  setGmActions(gmActions);
  await S.loadingScreen(W === nullWorld ? 600 : 1800);
  if (W === nullWorld) S.liteBanner();
  landing();
}

async function landing() {
  W.startLandingOrbit();
  const r = await S.landingScreen({ hasSave: store.hasSave() });
  if (r.action === 'continue') return continueGame();
  if (r.action === 'leaderboard') return S.leaderboardScreen({ onBack: landing });
  return startNewGame(r.team);
}

async function startNewGame(team) {
  store.reset(); store.clearSave();
  store.set({ teamName: team, phase: 'howto' });
  await S.howToPlayScreen();
  clearApp();
  // Intro cinematic
  const ov = S.cinematicOverlay();
  const map = [0, 1, 2, 2, 3, 4];
  await Promise.race([
    W.introCinematic((i) => ov.setLine(GAME.introLines[map[i]])),
    (async () => { while (!ov.skipped) await sleep(100); })(),
  ]);
  if (W === nullWorld) { for (const l of GAME.introLines) { if (ov.skipped) break; ov.setLine(l); await sleep(1300); } }
  await ov.countdown();
  clearApp();
  showHud(); setHintHandler(onHintRequest);
  startTimer();
  goMap();
}

function continueGame() {
  if (!store.load()) return startNewGame('TEAM TEBET');
  clearApp();
  showHud(); setHintHandler(onHintRequest);
  startTimer();
  const s = store.get();
  s.missionStatus.forEach((st, i) => W.setLocationStatus(i, st));
  if (s.phase === 'vault' || s.missionStatus.every((x) => x === 'completed')) return vault(false);
  goMap();
}

// ------------------------------------------------------------ MAP
async function goMap() {
  const s = store.get();
  store.set({ phase: 'map' });
  store.save();
  s.missionStatus.forEach((st, i) => W.setLocationStatus(i, st));
  setHintEnabled(false);
  remove(mapBarEl);
  mapBarEl = S.mapBar(s.missionStatus, (i) => { remove(mapBarEl); mapBarEl = null; if (i === 4) vault(true); else startMission(i); });
  await W.mapView(1.4);
}

// ------------------------------------------------------------ MISSION
async function startMission(i) {
  const s = store.get();
  if (s.missionStatus[i] !== 'active') return goMap();
  if (s.currentMission !== i || s.phase !== 'mission') store.set({ currentMission: i, stepIndex: 0 });
  store.set({ phase: 'mission', currentMission: i });
  store.save();
  setHintEnabled(true);
  W.walkAvatarTo(i);
  await W.locationView(i, 1.6);
  const res = await runMission(i, {
    onWrong: () => W.shake(0.15),
    onStepCorrect: (m, step) => { if (!step.isDigit) W.burstAt(i, { count: 30, speed: 4, up: 5, size: [0.1, 0.2] }); },
  });
  await missionComplete(i, res);
}

async function missionComplete(i, res) {
  const s = store.get();
  const m = MISSIONS[i];
  setHintEnabled(false);
  if (res.skipped) s.digits[m.digit] = revealAnswer(`${m.id}.digit.${m.digit}`);
  s.missionStatus[i] = 'completed';
  if (i < 3) s.missionStatus[i + 1] = 'active';
  s.stepIndex = 0; s.wrongStreak = 0;
  store.emit(); store.save();
  // Efek keberhasilan (skala meningkat per mission)
  S.flash(i === 3 ? 'rgba(242,193,78,.7)' : 'rgba(31,184,166,.6)');
  if (i === 1) sfx.cash();
  W.missionSuccess(i);
  await sleep(i === 2 ? 1600 : 700);
  const titles = ['FIRST DIGIT FOUND!', 'PROMO CODE CRACKED!', 'BONUS! DIGIT C', 'FINAL DIGIT FOUND'];
  await S.bigDigit(s.digits[m.digit], titles[i]);
  glowSlot(m.digit); sfx.unlock();
  W.setLocationStatus(i, 'completed');
  if (i < 3) {
    W.setLocationStatus(i + 1, 'active');
    await S.nextStop(m.reward.next);
    goMap();
  } else {
    glowAllSlots();
    S.stageText('SECRET PIN COMPLETE!', { small: pinString(s).split('').join(' · '), gold: true, ms: 2200 });
    await sleep(2200);
    vault(true);
  }
}

async function onHintRequest() {
  const s = store.get();
  if (s.phase !== 'mission') return;
  const i = s.currentMission; const m = MISSIONS[i];
  await S.hintModal(m, s.hintsUsed[i], (idx) => {
    addPenalty(GAME.penalties.hint[idx]);
    s.hintCount += 1; s.hintsUsed[i] += 1; store.emit(); store.save();
    S.toast({ title: `HINT ${idx + 1}`, text: m.hints[idx], kind: 'ok', ms: 9000 });
  });
}

// ------------------------------------------------------------ VAULT
async function vault(withTransition) {
  store.set({ phase: 'vault', currentMission: 4 }); store.save();
  remove(mapBarEl); mapBarEl = null;
  setHintEnabled(false);
  W.walkAvatarTo(4);
  if (withTransition) {
    let st = null;
    await W.vaultTransition((stage) => { if (stage === 0) { st = S.stageText('FINAL DESTINATION', { small: 'ALL DIGITS COLLECTED', ms: 0 }); sfx.unlock(); } if (stage === 1) { remove(st); S.stageText('COFFEE VAULT', { small: 'FINAL DESTINATION', gold: true, ms: 1800 }); } });
  } else {
    await W.locationView(4, 1.4);
  }
  const panel = S.vaultPanel(async (pin) => {
    const s = store.get();
    s.vaultAttempts += 1; store.emit();
    if (!check('vault.pin', pin)) {
      addPenalty(GAME.penalties.wrongVault); store.save();
      sfx.alarm(); W.vaultDeny(); panel.deny();
      S.flash('rgba(224,82,82,.6)');
      S.toast({ title: 'ACCESS DENIED', text: `PIN belum tepat. Periksa kembali digit yang kalian kumpulkan. (+${GAME.penalties.wrongVault}s)`, kind: 'bad', ms: 2600 });
      return;
    }
    stopTimer();
    panel.grant();
    await openSequence(panel);
  });
}

async function openSequence(panel) {
  hideHud();
  const stageMap = {
    granted: () => { sfx.correct(); S.stageText('ACCESS GRANTED', { gold: true, ms: 1400 }); },
    bolts: () => sfx.mech(),
    wheel: () => { sfx.rumble(); },
    light: () => { sfx.unlock(); },
    open: () => {},
  };
  await W.vaultOpen((st) => stageMap[st] && stageMap[st]());
  panel.remove();
  S.flash('rgba(255,244,200,.95)');
  await sleep(500);
  // Grand reward
  W.jackpot();
  const closeJackpot = await S.jackpotOverlay();
  closeJackpot();
  // Doorprize roulette
  const idx = Math.floor(Math.random() * GAME.doorprize.length);
  const dp = await S.doorprizeOverlay(GAME.doorprize[idx]);
  await W.spinRoulette(idx);
  await dp.result();
  W.hideRoulette();
  store.get().doorprize = GAME.doorprize[idx];
  await result();
}

// ------------------------------------------------------------ RESULT
async function result() {
  const s = store.get();
  s.gameCompleted = true; s.phase = 'result'; store.emit(); store.clearSave();
  const stars = computeStars(s); const score = computeScore(s); const ach = computeAchievements(s);
  s.achievements = ach.map((a) => a.id);
  await leaderboard.submit({
    id,
    team: s.teamName,
    time: Math.round(s.baseTime + s.penaltyTime),
    hints: s.hintCount,
    attempts: s.vaultAttempts,
    score,
    stars,
    doorprize: s.doorprize || 'Coffee Finisher',
    achievements: s.achievements,
    date: new Date().toISOString()
  });
  hideHud();
  S.resultScreen({ stars, score, achievements: ach, onLeaderboard: () => S.leaderboardScreen({ me: id, onBack: restart }), onRestart: restart });
}

function restart() {
  store.reset(); store.clearSave();
  location.href = location.pathname + location.search;
}

// ------------------------------------------------------------ GAME MASTER ACTIONS
const gmActions = {
  toggleTimer: () => (store.get().timerRunning ? stopTimer() : startTimer()),
  penalty: (sec) => addPenalty(sec),
  restart,
  unlock: (i) => { const s = store.get(); s.missionStatus[i] = 'active'; store.emit(); store.save(); W.setLocationStatus(i, 'active'); },
  lock: (i) => { const s = store.get(); s.missionStatus[i] = 'locked'; store.emit(); store.save(); W.setLocationStatus(i, 'locked'); },
  skip: async (i) => {
    const s = store.get();
    if (s.phase === 'mission' && s.currentMission === i && runMission.current) { runMission.current.skip(); return; }
    if (s.missionStatus[i] === 'completed') return;
    for (let k = 0; k < i; k++) if (s.missionStatus[k] !== 'completed') { s.missionStatus[k] = 'completed'; s.digits[MISSIONS[k].digit] = revealAnswer(`${MISSIONS[k].id}.digit.${MISSIONS[k].digit}`); W.setLocationStatus(k, 'completed'); }
    store.set({ currentMission: i, stepIndex: 0 });
    await missionComplete(i, { skipped: true });
  },
  gotoVault: () => {
    const s = store.get();
    MISSIONS.forEach((m, k) => { s.missionStatus[k] = 'completed'; s.digits[m.digit] = revealAnswer(`${m.id}.digit.${m.digit}`); W.setLocationStatus(k, 'completed'); });
    if (!document.getElementById('hud')) { showHud(); setHintHandler(onHintRequest); startTimer(); }
    store.emit(); clearApp(); vault(true);
  },
};

boot();
