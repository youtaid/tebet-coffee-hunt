import { GAME, ACHIEVEMENTS } from '../config/gameConfig.js';
import { finalTime } from './state.js';

export function computeStars(s) {
  const t = finalTime(s);
  if (t < GAME.stars.three.maxTime && s.hintCount <= GAME.stars.three.maxHints) return 3;
  if (t <= GAME.stars.two.maxTime) return 2;
  return 1;
}

export function computeScore(s) {
  const c = GAME.score;
  const raw = c.base - finalTime(s) * c.perSecond - s.hintCount * c.perHint - Math.max(0, s.vaultAttempts - 1) * c.perWrongVault;
  return Math.max(c.min, Math.round(raw));
}

export function computeAchievements(s) {
  const got = [];
  if (s.hintCount === 0) got.push('zero-hint');
  if (s.vaultAttempts === 1) got.push('first-try');
  if (finalTime(s) < GAME.achievements.speedBrewerMax) got.push('speed');
  if (s.hintsUsed[1] === 0) got.push('algebra');
  if (s.wrongAnswers[2] === 0) got.push('composer');
  if (s.wrongAnswers[3] === 0) got.push('balance');
  return ACHIEVEMENTS.filter((a) => got.includes(a.id));
}
