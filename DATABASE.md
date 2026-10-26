# 📊 Panduan Database & Leaderboard — Tebet Coffee Hunt

Dokumen ini menjelaskan struktur data (skema database) dan panduan praktis untuk mengelola atau menghubungkan leaderboard game **Tebet Coffee Hunt** ke berbagai jenis database yang mudah dipahami.

---

## 1. Skema Data (Database Schema)

Setiap data tim yang menyelesaikan tantangan disimpan dengan struktur JSON berikut:

| Kolom / Field   | Tipe Data | Keterangan                                                      | Contoh Nilai                   |
| --------------- | --------- | --------------------------------------------------------------- | ------------------------------ |
| `id`            | `string`  | Identitas unik untuk setiap sesi permainan                      | `"tch_1730000000_a1b2"`        |
| `team`          | `string`  | Nama tim atau peserta                                           | `"Espresso Hunters Tebet"`     |
| `score`         | `number`  | Skor akhir (berdasarkan kecepatan, penalti hint, & vault)       | `9550`                         |
| `time`          | `number`  | Total waktu bermain dalam detik (waktu berjalan + total penalti)| `395` *(artinya 06 menit 35 dtk)*|
| `stars`         | `number`  | Perolehan rating bintang (`1`, `2`, atau `3`)                   | `3`                            |
| `hints`         | `number`  | Jumlah petunjuk (hint) yang digunakan (0 s/d 3)                 | `0`                            |
| `attempts`      | `number`  | Jumlah percobaan memasukkan PIN ke Coffee Vault                 | `1`                            |
| `doorprize`     | `string`  | Hadiah virtual dari putaran roulette Coffee Vault               | `"Mega Jackpot"`               |
| `achievements`  | `array`   | Daftar ID pencapaian khusus yang diraih tim                     | `["zero-hint", "first-try"]`   |
| `date`          | `string`  | Waktu penyelesaian dalam format standar ISO 8601                | `"2026-10-26T14:15:00.000Z"`   |

### Contoh Dokumen / Entri Data Lengkap:
```json
{
  "id": "tch_1730000000_a1b2",
  "team": "Espresso Hunters Tebet",
  "score": 9550,
  "time": 395,
  "stars": 3,
  "hints": 0,
  "attempts": 1,
  "doorprize": "Mega Jackpot",
  "achievements": ["zero-hint", "first-try", "speed"],
  "date": "2026-10-26T14:15:00.000Z"
}
```

---

## 2. Penyimpanan Bawaan: LocalStorage (Offline-First)

Secara default, game menggunakan **`LocalStorageProvider`**:
- **Kelebihan**: Berjalan langsung tanpa server/backend apa pun, cepat, bekerja offline, dan data tersimpan di browser.
- **Key LocalStorage**: `tch3d.leaderboard.v2`
- **Fitur Tersedia**:
  - 🔍 **Live Search**: Pencarian nama tim secara instan.
  - 🏆 **Filter Tab**: Tampilan `Top 10` atau `Semua Tim`.
  - 📥 **Export CSV**: Download langsung file `.csv` yang bisa dibuka di Microsoft Excel atau Google Sheets.
  - 💾 **Export/Import JSON**: Backup dan restore data peserta kapan saja.
  - 🔄 **Seed Data**: Dilengkapi data contoh tim Tebet sehingga leaderboard tidak kosong saat pertama kali dibuka.

---

## 3. Opsi Integrasi Database Online

Jika Anda mengadakan event bersama dan ingin **semua peserta dari perangkat/HP yang berbeda** masuk ke **satu database online terpusat**, Anda bisa memilih salah satu metode di bawah ini:

### Opsi A: Google Sheets (Paling Mudah, Gratis, & Tanpa Server)
Google Sheets sangat cocok untuk panitia lomba atau event komunitas karena hasilnya langsung muncul dalam baris spreadsheet secara real-time.

#### Langkah Pemasangan:
1. Buat Google Spreadsheet baru di [Google Sheets](https://sheets.google.com).
2. Beri nama kolom di Baris 1:
   `ID | Team | Score | Time | Stars | Hints | Attempts | Doorprize | Date`
3. Klik menu **Extensions** > **Apps Script**, lalu salin dan tempel kode berikut:

```javascript
const SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sheet.appendRow([
      data.id || '',
      data.team || 'Anonim',
      data.score || 0,
      data.time || 0,
      data.stars || 1,
      data.hints || 0,
      data.attempts || 1,
      data.doorprize || '',
      data.date || new Date().toISOString()
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift(); // Ambil header
  const limit = parseInt(e.parameter.limit || 50, 10);
  
  const results = rows.map(r => ({
    id: r[0],
    team: r[1],
    score: Number(r[2]),
    time: Number(r[3]),
    stars: Number(r[4]),
    hints: Number(r[5]),
    attempts: Number(r[6]),
    doorprize: r[7],
    date: r[8]
  }));
  
  // Urutkan skor tertinggi
  results.sort((a, b) => b.score - a.score || a.time - b.time);
  
  return ContentService.createTextOutput(JSON.stringify(results.slice(0, limit)))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Klik **Deploy** > **New deployment** > pilih jenis **Web app**.
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. Salin URL Web App yang dihasilkan.
6. Di kode game (`src/main.js`), aktifkan provider:
```javascript
import { setLeaderboardProvider, GoogleSheetsProvider } from './game/leaderboard.js';

// Ganti URL dengan Web App URL Google Sheets Anda:
setLeaderboardProvider(new GoogleSheetsProvider('https://script.google.com/macros/s/.../exec'));
```

---

### Opsi B: Supabase (PostgreSQL Cloud)
Jika Anda menginginkan database SQL modern dengan performa tinggi:

#### 1. Jalankan SQL ini di Supabase SQL Editor:
```sql
create table leaderboard (
  id text primary key,
  team text not null,
  score integer not null,
  time integer not null,
  stars smallint default 1,
  hints smallint default 0,
  attempts smallint default 1,
  doorprize text,
  achievements text[],
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Buka izin akses baca dan tulis untuk game (anon public)
alter table leaderboard enable row level security;

create policy "Allow public read"
on leaderboard for select
using (true);

create policy "Allow public insert"
on leaderboard for insert
with check (true);
```

#### 2. Hubungkan di `src/main.js`:
```javascript
import { setLeaderboardProvider, SupabaseProvider } from './game/leaderboard.js';

setLeaderboardProvider(new SupabaseProvider({
  url: 'https://xyzcompany.supabase.co',
  anonKey: 'eyJh......'
}));
```

---

### Opsi C: Backend REST API Kustom
Jika Anda sudah punya server Express.js, Next.js API, atau framework lainnya:

```javascript
import { setLeaderboardProvider, RestProvider } from './game/leaderboard.js';

setLeaderboardProvider(new RestProvider('https://api.domainanda.com/api/leaderboard'));
```
Endpoint hanya perlu merespons:
- `GET /?limit=10` -> Mengembalikan array JSON daftar tim.
- `POST /` -> Menerima body JSON entri tim baru.

---

## 4. Fitur Game Master untuk Panitia
Saat dalam permainan, tekan tombol bundar kecil di pojok kiri bawah untuk membuka **Game Master Mode**:
- **EXPORT CSV**: Unduh langsung seluruh data permainan peserta dalam format spreadsheet.
- **RESET SEED**: Kembalikan data leaderboard ke tim awal default.
- **CLEAR LB**: Bersihkan semua data leaderboard sebelum memulai perlombaan baru.
