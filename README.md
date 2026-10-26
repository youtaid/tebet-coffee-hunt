# Tebet Coffee Hunt 3D — Secret PIN Challenge

Game edukasi matematika berbasis web (HTML5 + Three.js) untuk siswa SMA, dimainkan per kelompok.
Empat kafe Tebet (Orka Coffee, Kopi Nako, Kopikina, Tebet Coffee Ranking) → empat puzzle → empat digit → buka Coffee Vault.

Gaya visual: **blok ala Roblox** (procedural, tanpa aset eksternal) dengan set yang mengacu pada foto kafe aslinya.
UI/UX: minimalis — 3D world + HUD 2D (soal selalu berupa teks HTML yang mudah dibaca).

## Menjalankan

```sh
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # hasil statis di dist/ — bisa di-host di mana saja (Netlify, Vercel, GitHub Pages, LMS)
npm run preview    # mencoba hasil build
```

Tidak butuh backend. Progress dan leaderboard disimpan di `localStorage`.

## Mode & parameter URL

| URL | Fungsi |
|---|---|
| `?mode=host` | **Game Master Mode** terbuka otomatis (juga: tombol kecil kiri-bawah atau `Ctrl+Shift+G`) |
| `?quality=low` | Matikan shadow & turunkan resolusi untuk laptop lemah |
| (WebGL gagal) | **Lite Mode** otomatis: game tetap bisa dimainkan tanpa 3D |

Game Master dapat melihat kunci jawaban & PIN, status tim, pause/resume timer, menambah penalti, lock/unlock/skip mission, lompat ke Vault, dan menghapus leaderboard.

## Struktur

```
src/
  config/gameConfig.js   ← SEMUA konten: narasi, soal, hint, penalti, bintang, jackpot
  config/answers.js      ← kunci jawaban ter-obfuscate (generated)
  game/     state, timer, validation, scoring, leaderboard (abstraction)
  missions/ missionEngine.js (render soal dari config, validasi, step)
  scenes/   world.js (map, kamera, efek), cafes.js (Orka, Nako, Kopikina, Ranking), vault.js, avatar.js, effects.js
  ui/       styles.css, hud.js, screens.js, gameMaster.js
  audio/    audio.js (SFX & musik sintetis Web Audio — tanpa file)
tools/
  encode-answers.mjs     ← ubah kunci jawaban: edit PLAIN lalu `npm run answers`
  test-logic.mjs         ← uji validasi: `node tools/test-logic.mjs`
```

### Mengubah soal / jawaban
1. Edit teks soal di `src/config/gameConfig.js`.
2. Edit nilai jawaban di `tools/encode-answers.mjs` (key: `mission.step.input`), lalu `npm run answers`.
3. `node tools/test-logic.mjs` untuk memastikan.

### Mengganti leaderboard ke server
Implementasikan `list(limit)` dan `submit(entry)` (lihat `RestProvider` di `src/game/leaderboard.js`), lalu panggil
`setLeaderboardProvider(new RestProvider('https://…'))` di `src/main.js`.

## Misi & kunci (hanya untuk guru)

| Mission | Materi | Jawaban |
|---|---|---|
| 1 Orka Coffee | pola bilangan | t = 18 → **A = 1** |
| 2 Kopi Nako | identitas aljabar | xyz = 512 → **B = 8** |
| 3 Kopikina | **fungsi komposisi** (g∘f)(x) = 2(3x+8)−5 = 6x+11; (g∘f)(4)=35; 6x+11=53 → x=7 | **C = 7** |
| 4 Tebet Coffee Ranking | rata-rata & selisih minimum | 112, x+y=50, x=y=25 → **D = 0** |
| Vault | | **PIN 1870** → Virtual Jackpot Rp 1.870.000.000 (hadiah virtual, bukan uang sungguhan) |

Penalti: hint +15/+30/+60 s, PIN salah +30 s. Bintang: ⭐⭐⭐ < 10 menit & ≤ 1 hint; ⭐⭐ ≤ 13 menit; ⭐ selebihnya (ubah di `GAME.stars`).
