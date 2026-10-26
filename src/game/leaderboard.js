// =====================================================================
//  TEBET COFFEE HUNT — LEADERBOARD & DATABASE SYSTEM
//  Mendukung penyimpanan data terstruktur:
//  - LocalStorageProvider (default, offline-first, auto-seed)
//  - GoogleSheetsProvider (mudah untuk event komunitas)
//  - SupabaseProvider (PostgreSQL modern via REST)
//  - RestProvider (Custom backend API)
// =====================================================================

export const LB_STORAGE_KEY = 'tch3d.leaderboard.v2';

/**
 * SKEMA DATA LEADERBOARD (Database Schema):
 * -------------------------------------------------------------
 * id           : string   - ID unik entri (cth: "tch_1730000000_a1b2")
 * team         : string   - Nama tim / peserta
 * score        : number   - Skor akhir (dihitung dari waktu + hint + penalti)
 * time         : number   - Durasi total dalam detik (base + penalty)
 * stars        : number   - Bintang rating (1, 2, atau 3)
 * hints        : number   - Jumlah hint yang digunakan (0..3)
 * attempts     : number   - Jumlah percobaan tebak PIN vault
 * doorprize    : string   - Hadiah virtual roulette yang dimenangkan
 * achievements : string[] - Daftar ID achievement yang diraih
 * date         : string   - Waktu penyelesaian ISO 8601
 * -------------------------------------------------------------
 */

/** Data contoh awal (Seed) untuk Tebet Coffee Hunt agar leaderboard langsung hidup */
export const DEFAULT_LEADERBOARD_SEEDS = [
  {
    id: 'seed-1',
    team: 'Espresso Hunters Tebet',
    score: 9550,
    time: 395,
    stars: 3,
    hints: 0,
    attempts: 1,
    doorprize: 'Mega Jackpot',
    achievements: ['zero-hint', 'first-try', 'speed'],
    date: '2026-10-25T14:15:00.000Z',
  },
  {
    id: 'seed-2',
    team: 'Barista Squad Orka',
    score: 9100,
    time: 440,
    stars: 3,
    hints: 1,
    attempts: 1,
    doorprize: 'Golden Ticket',
    achievements: ['first-try', 'speed'],
    date: '2026-10-25T16:30:00.000Z',
  },
  {
    id: 'seed-3',
    team: 'Kopikina Mystery Solvers',
    score: 8650,
    time: 510,
    stars: 3,
    hints: 1,
    attempts: 1,
    doorprize: 'Free Coffee',
    achievements: ['speed'],
    date: '2026-10-25T18:45:00.000Z',
  },
  {
    id: 'seed-4',
    team: 'Slow Pour V60',
    score: 7900,
    time: 615,
    stars: 2,
    hints: 2,
    attempts: 1,
    doorprize: 'Golden Tumbler',
    achievements: ['first-try'],
    date: '2026-10-26T09:20:00.000Z',
  },
  {
    id: 'seed-5',
    team: 'Kopi Nako Explorers',
    score: 7350,
    time: 680,
    stars: 2,
    hints: 2,
    attempts: 2,
    doorprize: 'Mystery Box',
    achievements: [],
    date: '2026-10-26T10:50:00.000Z',
  },
  {
    id: 'seed-6',
    team: 'Cold Brew Detectives',
    score: 6600,
    time: 760,
    stars: 2,
    hints: 3,
    attempts: 1,
    doorprize: 'Study Pass',
    achievements: [],
    date: '2026-10-26T12:15:00.000Z',
  },
];

/** Utility helper: Download string sebagai file di browser */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Formatter durasi waktu ramah mm:ss */
export function formatTime(seconds = 0) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------
// 1. PROVIDER DEFAULT: LOCAL STORAGE (OFFLINE-FIRST)
// ---------------------------------------------------------------------
export class LocalStorageProvider {
  constructor(storageKey = LB_STORAGE_KEY) {
    this.key = storageKey;
    this._ensureInitialData();
  }

  _readRaw() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return [];
      return JSON.parse(data) || [];
    } catch {
      return [];
    }
  }

  _writeRaw(rows) {
    try {
      localStorage.setItem(this.key, JSON.stringify(rows));
    } catch (e) {
      console.warn('LocalStorage leaderboard gagal menyimpan:', e);
    }
  }

  _ensureInitialData() {
    try {
      const existing = localStorage.getItem(this.key);
      if (!existing || existing === '[]') {
        // Cek migrasi dari key v1 lama jika ada
        const oldV1 = localStorage.getItem('tch3d.leaderboard.v1');
        if (oldV1) {
          try {
            const parsed = JSON.parse(oldV1);
            if (Array.isArray(parsed) && parsed.length) {
              this._writeRaw(parsed);
              return;
            }
          } catch { /* ignore */ }
        }
        // Pasang seed data contoh
        this._writeRaw(DEFAULT_LEADERBOARD_SEEDS);
      }
    } catch { /* ignore */ }
  }

  /**
   * Mengambil daftar tim dengan filter dan sorting
   * @param {Object} options { limit, search, sortBy: 'score'|'time'|'date' }
   */
  async list(options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 100);
    const search = typeof options === 'object' && options.search ? options.search.trim().toLowerCase() : '';
    const sortBy = (typeof options === 'object' && options.sortBy) || 'score';

    let rows = this._readRaw();

    // Filter pencarian nama tim
    if (search) {
      rows = rows.filter((r) => (r.team || '').toLowerCase().includes(search));
    }

    // Pengurutan
    rows.sort((a, b) => {
      if (sortBy === 'time') return (a.time || 0) - (b.time || 0) || (b.score || 0) - (a.score || 0);
      if (sortBy === 'date') return new Date(b.date || 0) - new Date(a.date || 0);
      // Default: skor tertinggi, lalu waktu tercepat
      return (b.score || 0) - (a.score || 0) || (a.time || 0) - (b.time || 0);
    });

    return rows.slice(0, limit);
  }

  /**
   * Submit entri baru dan kembalikan peringkat yang dicapai
   */
  async submit(entry) {
    const sanitized = {
      id: entry.id || `tch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      team: (entry.team || 'Anonim').trim(),
      score: Number(entry.score) || 0,
      time: Math.round(Number(entry.time) || 0),
      stars: Math.max(1, Math.min(3, Number(entry.stars) || 1)),
      hints: Number(entry.hints) || 0,
      attempts: Number(entry.attempts) || 1,
      doorprize: entry.doorprize || 'Coffee Finisher',
      achievements: Array.isArray(entry.achievements) ? entry.achievements : [],
      date: entry.date || new Date().toISOString(),
    };

    const rows = this._readRaw();
    rows.push(sanitized);

    // Sort untuk mengetahui peringkat
    rows.sort((a, b) => (b.score || 0) - (a.score || 0) || (a.time || 0) - (b.time || 0));
    this._writeRaw(rows.slice(0, 500)); // Simpan hingga 500 entri

    const rank = rows.findIndex((r) => r.id === sanitized.id) + 1;
    return { ...sanitized, rank };
  }

  /**
   * Statistik ringkas leaderboard untuk dashboard
   */
  async getStats() {
    const rows = this._readRaw();
    if (!rows.length) {
      return { totalTeams: 0, topScore: 0, fastestTime: 0, avgTime: 0, avgScore: 0 };
    }
    const topScore = Math.max(...rows.map((r) => r.score || 0));
    const fastestTime = Math.min(...rows.map((r) => r.time || 999999));
    const totalScore = rows.reduce((acc, r) => acc + (r.score || 0), 0);
    const totalTime = rows.reduce((acc, r) => acc + (r.time || 0), 0);
    return {
      totalTeams: rows.length,
      topScore,
      fastestTime,
      avgScore: Math.round(totalScore / rows.length),
      avgTime: Math.round(totalTime / rows.length),
    };
  }

  /**
   * Export leaderboard ke format CSV untuk Excel / Google Sheets
   */
  exportCSV() {
    const rows = this._readRaw();
    rows.sort((a, b) => (b.score || 0) - (a.score || 0) || (a.time || 0) - (b.time || 0));

    const headers = ['Peringkat', 'ID', 'Nama Tim', 'Skor', 'Waktu Detik', 'Format Waktu', 'Bintang', 'Hint', 'Percobaan PIN', 'Hadiah Doorprize', 'Pencapaian', 'Tanggal Selesai'];
    const csvLines = [headers.join(',')];

    rows.forEach((r, idx) => {
      const line = [
        idx + 1,
        `"${r.id || ''}"`,
        `"${(r.team || '').replace(/"/g, '""')}"`,
        r.score || 0,
        r.time || 0,
        `"${formatTime(r.time)}"`,
        r.stars || 1,
        r.hints || 0,
        r.attempts || 1,
        `"${(r.doorprize || '').replace(/"/g, '""')}"`,
        `"${(r.achievements || []).join(';')}"`,
        `"${r.date || ''}"`,
      ];
      csvLines.push(line.join(','));
    });

    const csvContent = csvLines.join('\r\n');
    downloadFile(csvContent, `tebet-coffee-hunt-leaderboard-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    return csvContent;
  }

  /**
   * Export JSON untuk backup database
   */
  exportJSON() {
    const rows = this._readRaw();
    const content = JSON.stringify(rows, null, 2);
    downloadFile(content, `tebet-coffee-hunt-backup-${Date.now()}.json`, 'application/json');
    return content;
  }

  /**
   * Import data JSON dari file backup
   */
  importJSON(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (Array.isArray(parsed)) {
        this._writeRaw(parsed);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  /** Reset data ke data awal / seed */
  reset() {
    this._writeRaw(DEFAULT_LEADERBOARD_SEEDS);
  }

  /** Hapus seluruh data leaderboard */
  clear() {
    try {
      localStorage.removeItem(this.key);
      this._writeRaw([]);
    } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------
// 2. PROVIDER: GOOGLE SHEETS (Via Google Apps Script Web App)
// ---------------------------------------------------------------------
export class GoogleSheetsProvider {
  constructor(webAppUrl) {
    this.url = webAppUrl;
    this.fallback = new LocalStorageProvider();
  }

  async list(options = {}) {
    if (!this.url) return this.fallback.list(options);
    try {
      const limit = typeof options === 'number' ? options : (options.limit || 50);
      const res = await fetch(`${this.url}?action=list&limit=${limit}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      return Array.isArray(data) ? data : this.fallback.list(options);
    } catch {
      return this.fallback.list(options);
    }
  }

  async submit(entry) {
    await this.fallback.submit(entry);
    if (!this.url) return;
    try {
      await fetch(this.url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      console.warn('Gagal kirim ke Google Sheets:', e);
    }
  }

  exportCSV() { return this.fallback.exportCSV(); }
  exportJSON() { return this.fallback.exportJSON(); }
  getStats() { return this.fallback.getStats(); }
  clear() { return this.fallback.clear(); }
  reset() { return this.fallback.reset(); }
}

// ---------------------------------------------------------------------
// 3. PROVIDER: SUPABASE (PostgreSQL Cloud via REST)
// ---------------------------------------------------------------------
export class SupabaseProvider {
  constructor({ url, anonKey, tableName = 'leaderboard' }) {
    this.url = url?.replace(/\/$/, '');
    this.key = anonKey;
    this.tableName = tableName;
    this.fallback = new LocalStorageProvider();
  }

  async list(options = {}) {
    if (!this.url || !this.key) return this.fallback.list(options);
    try {
      const limit = typeof options === 'number' ? options : (options.limit || 50);
      const res = await fetch(`${this.url}/rest/v1/${this.tableName}?select=*&order=score.desc,time.asc&limit=${limit}`, {
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
        },
      });
      if (!res.ok) throw new Error('Supabase error');
      return await res.json();
    } catch {
      return this.fallback.list(options);
    }
  }

  async submit(entry) {
    await this.fallback.submit(entry);
    if (!this.url || !this.key) return;
    try {
      await fetch(`${this.url}/rest/v1/${this.tableName}`, {
        method: 'POST',
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      console.warn('Gagal submit ke Supabase:', e);
    }
  }

  exportCSV() { return this.fallback.exportCSV(); }
  exportJSON() { return this.fallback.exportJSON(); }
  getStats() { return this.fallback.getStats(); }
  clear() { return this.fallback.clear(); }
  reset() { return this.fallback.reset(); }
}

// ---------------------------------------------------------------------
// 4. PROVIDER: REST API KUSTOM
// ---------------------------------------------------------------------
export class RestProvider {
  constructor(baseUrl) {
    this.baseUrl = baseUrl?.replace(/\/$/, '');
    this.fallback = new LocalStorageProvider();
  }

  async list(options = {}) {
    if (!this.baseUrl) return this.fallback.list(options);
    try {
      const limit = typeof options === 'number' ? options : (options.limit || 50);
      const res = await fetch(`${this.baseUrl}?limit=${limit}`);
      return res.ok ? await res.json() : this.fallback.list(options);
    } catch {
      return this.fallback.list(options);
    }
  }

  async submit(entry) {
    await this.fallback.submit(entry);
    if (!this.baseUrl) return;
    try {
      await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch { /* ignore */ }
  }

  exportCSV() { return this.fallback.exportCSV(); }
  exportJSON() { return this.fallback.exportJSON(); }
  getStats() { return this.fallback.getStats(); }
  clear() { return this.fallback.clear(); }
  reset() { return this.fallback.reset(); }
}

// ---------------------------------------------------------------------
// SINGLETON INSTANCE
// ---------------------------------------------------------------------
let activeProvider = new LocalStorageProvider();

export const setLeaderboardProvider = (p) => { activeProvider = p; };
export const getLeaderboardProvider = () => activeProvider;

export const leaderboard = {
  list: (opts) => activeProvider.list(opts),
  submit: (entry) => activeProvider.submit(entry),
  getStats: () => (activeProvider.getStats ? activeProvider.getStats() : Promise.resolve({})),
  exportCSV: () => (activeProvider.exportCSV ? activeProvider.exportCSV() : null),
  exportJSON: () => (activeProvider.exportJSON ? activeProvider.exportJSON() : null),
  importJSON: (data) => (activeProvider.importJSON ? activeProvider.importJSON(data) : false),
  reset: () => (activeProvider.reset ? activeProvider.reset() : Promise.resolve()),
  clear: () => (activeProvider.clear ? activeProvider.clear() : Promise.resolve()),
};

