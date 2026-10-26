// Leaderboard abstraction.
// Default: LocalStorageProvider. Ganti dengan provider lain (Google Sheets,
// Firebase, Supabase, REST API) dengan mengimplementasikan interface yang sama:
//   async list(limit) -> [{ team, time, hints, attempts, score, stars, date }]
//   async submit(entry) -> void

const LB_KEY = 'tch3d.leaderboard.v1';

export class LocalStorageProvider {
  async list(limit = 10) {
    let rows = [];
    try { rows = JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch { rows = []; }
    return rows.sort((a, b) => b.score - a.score || a.time - b.time).slice(0, limit);
  }
  async submit(entry) {
    let rows = [];
    try { rows = JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch { rows = []; }
    rows.push(entry);
    try { localStorage.setItem(LB_KEY, JSON.stringify(rows.slice(-200))); } catch { /* ignore */ }
  }
  async clear() { try { localStorage.removeItem(LB_KEY); } catch { /* ignore */ } }
}

/** Contoh adapter REST — isi endpoint lalu pakai `setLeaderboardProvider(new RestProvider(url))`. */
export class RestProvider {
  constructor(baseUrl) { this.baseUrl = baseUrl; }
  async list(limit = 10) {
    const r = await fetch(`${this.baseUrl}?limit=${limit}`);
    return r.ok ? r.json() : [];
  }
  async submit(entry) {
    await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
  }
}

let provider = new LocalStorageProvider();
export const setLeaderboardProvider = (p) => { provider = p; };
export const leaderboard = {
  list: (n) => provider.list(n),
  submit: (e) => provider.submit(e),
  clear: () => (provider.clear ? provider.clear() : Promise.resolve()),
};
