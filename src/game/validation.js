import { ANSWER_TABLE } from '../config/answers.js';

const KEY = 'tebet-coffee-vault';

function enc(s) {
  const bytes = [...s].map((ch, i) => ch.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length));
  return btoa(String.fromCharCode(...bytes));
}
function dec(b64) {
  const bytes = atob(b64);
  return [...bytes].map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length))).join('');
}

/** Normalisasi input siswa: trim, hapus spasi, koma desimal → titik, "+7" → "7" */
export function normalize(raw) {
  let s = String(raw ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  if (s.startsWith('+')) s = s.slice(1);
  if (s === '') return '';
  const n = Number(s);
  if (!Number.isNaN(n)) return String(n); // "025" → "25", "7.0" → "7"
  return s.toLowerCase();
}

/** @returns {boolean} apakah jawaban untuk key tertentu benar */
export function check(key, raw) {
  const stored = ANSWER_TABLE[enc(key)];
  if (stored === undefined) return false;
  return normalize(raw) === normalize(dec(stored));
}

/** Hanya untuk Game Master Mode. */
export function revealAnswer(key) {
  const stored = ANSWER_TABLE[enc(key)];
  return stored === undefined ? null : dec(stored);
}
