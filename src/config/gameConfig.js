// =====================================================================
//  TEBET COFFEE HUNT 3D — GAME CONFIG
//  Semua konten (narasi, soal, hint, penalti, threshold) ada di sini.
//  Jawaban TIDAK disimpan di file ini — lihat src/config/answers.js
//  (ter-obfuscate) dan src/game/validation.js.
//  Placeholder {A}, {B}, {C}, {D} akan diganti dengan digit yang sudah
//  diperoleh tim pada saat runtime.
// =====================================================================

export const GAME = {
  title: 'TEBET COFFEE HUNT',
  subtitle: 'SECRET PIN CHALLENGE',
  tagline: ['FOUR PLACES.', 'FOUR MISSIONS.', 'ONE SECRET PIN.'],
  version: '1.0.0',
  // Penalti (detik)
  penalties: { hint: [15, 30, 60], wrongVault: 30 },
  // Rating bintang (detik) — mudah diubah
  stars: { three: { maxTime: 10 * 60, maxHints: 1 }, two: { maxTime: 13 * 60 } },
  // Skor
  score: { base: 10000, perSecond: 10, perHint: 200, perWrongVault: 300, min: 500 },
  // Achievement thresholds
  achievements: { speedBrewerMax: 8 * 60 },
  // Hadiah virtual (easter egg dari PIN)
  jackpot: {
    final: 1_870_000_000,
    ladder: [10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000],
    label: 'VIRTUAL JACKPOT',
  },
  doorprize: [
    'Golden Tumbler', 'Free Coffee', 'Mystery Box', 'Study Pass',
    'Bonus Score', 'Golden Ticket', 'Virtual Cash', 'Mega Jackpot',
  ],
  audio: { music: 0.25, sfx: 0.6 },
  loadingLines: [
    'Brewing the challenge...',
    'Preparing Tebet...',
    'Hiding the secret digits...',
    'Locking the Coffee Vault...',
  ],
  introLines: [
    'Sebuah Coffee Vault tersembunyi di Tebet.',
    'Untuk membukanya, kalian harus menemukan empat digit rahasia.',
    'Setiap lokasi menyimpan satu tantangan.',
    'Pecahkan puzzle. Temukan digitnya. Buka lokasi berikutnya.',
    'Dan buka Coffee Vault sebelum waktu habis.',
  ],
  howToPlay: [
    { icon: '🎯', title: 'FIND 4 DIGITS', text: 'Setiap Mission menyimpan satu digit.' },
    { icon: '🧩', title: 'SOLVE THE PUZZLE', text: 'Diskusikan jawabannya bersama tim.' },
    { icon: '🔓', title: 'UNLOCK THE NEXT LOCATION', text: 'Jawaban benar membuka Mission berikutnya.' },
    { icon: '💡', title: 'USE HINTS WISELY', text: 'Hint membantu, tetapi memberikan penalti waktu.' },
    { icon: '⏱️', title: 'BE FAST', text: 'Kejar waktu terbaik.' },
    { icon: '🔐', title: 'OPEN THE VAULT', text: 'Gabungkan empat digit menjadi PIN.' },
  ],
};

// ---------------------------------------------------------------------
//  LOKASI (urutan = urutan mission; index 4 = vault)
// ---------------------------------------------------------------------
export const LOCATIONS = [
  { id: 'orka', name: 'Orka Coffee', short: 'ORKA' },
  { id: 'nako', name: 'Kopi Nako', short: 'NAKO' },
  { id: 'kopikina', name: 'Kopikina', short: 'KOPIKINA' },
  { id: 'ranking', name: 'Tebet Coffee Ranking', short: 'RANKING' },
  { id: 'vault', name: 'Coffee Vault', short: 'VAULT' },
];

// ---------------------------------------------------------------------
//  MISSIONS
//  step.inputs: [{ name, label, width, digits }]
//  Jawaban dicek dengan key `${mission.id}.${step.id}.${input.name}`
// ---------------------------------------------------------------------
export const MISSIONS = [
  // ================= MISSION 1 =================
  {
    id: 'm1',
    location: 'orka',
    title: 'ORKA COFFEE',
    subtitle: 'FIND THE QUIET TIME',
    digit: 'A',
    objective: 'Mengenali pola bilangan dan menentukan nilai pertama yang muncul pada dua pola.',
    intro: [
      'Kalian ingin mulai belajar di Orka Coffee.',
      'Kalian hanya ingin masuk saat ada meja kosong dan grinder sedang berhenti.',
    ],
    steps: [
      {
        id: 'q1',
        context: [],
        data: [
          { label: 'CLUE 1', text: 'Meja tersedia pada menit:', value: '3, 8, 13, 18, 23, ...' },
          { label: 'CLUE 2', text: 'Grinder berhenti pada menit:', value: '4, 11, 18, 25, 32, ...' },
        ],
        question: 'Pada menit ke berapa kedua kondisi tersebut pertama kali terjadi bersamaan?',
        inputs: [{ name: 't', label: 't =', suffix: 'menit', width: 5 }],
        success: { title: 'NICE!', text: 'Kedua kondisi pertama kali terjadi pada menit ke-18.' },
      },
      {
        id: 'digit',
        context: ['Digit A adalah angka puluhan dari 18.'],
        data: [],
        question: 'Berapa nilai A?',
        inputs: [{ name: 'A', label: 'A =', width: 1, digits: 1 }],
        success: { title: 'FIRST DIGIT FOUND!', text: '' },
        isDigit: true,
      },
    ],
    hints: [
      'Tulis beberapa bilangan lagi dari kedua pola. Cari bilangan yang muncul di keduanya.',
      'Pola 1 bertambah 5 (3, 8, 13, ...). Pola 2 bertambah 7 (4, 11, 18, ...). Perpanjang sampai ada yang sama.',
      'Lanjutkan Pola 1 sampai 30-an dan Pola 2 sampai 30-an, lalu lingkari bilangan yang ada di kedua daftar. Itulah menit pertamanya.',
    ],
    reward: { title: 'FIRST DIGIT FOUND!', next: 'KOPI NAKO' },
  },

  // ================= MISSION 2 =================
  {
    id: 'm2',
    location: 'nako',
    title: 'KOPI NAKO',
    subtitle: 'CRACK THE PROMO CODE',
    digit: 'B',
    objective: 'Menggunakan identitas aljabar untuk menentukan xyz.',
    intro: [
      'Kasir memberikan sebuah Promo Code Puzzle.',
      'Gunakan Digit A untuk menentukan nilai xyz.',
    ],
    chips: [{ label: 'A', value: '{A}' }],
    steps: [
      {
        id: 'q1',
        context: [],
        data: [
          { label: 'DATA', text: '', value: 'x + y + z = 18A + 2' },
          { label: '', text: '', value: 'xy + yz + zx = 120A + 11' },
          { label: '', text: '', value: 'x³ + y³ + z³ = 1600A + 76' },
        ],
        formula: {
          label: 'FORMULA KEY',
          lines: ['x³ + y³ + z³ − 3xyz', '= (x + y + z) · [ (x + y + z)² − 3(xy + yz + zx) ]'],
        },
        question: 'Tentukan nilai xyz.',
        inputs: [{ name: 'xyz', label: 'xyz =', width: 6 }],
        success: { title: 'CODE PART 1 ACCEPTED', text: 'Digit B memenuhi: B³ = 512' },
      },
      {
        id: 'digit',
        context: ['Digit B memenuhi:'],
        data: [{ label: '', text: '', value: 'B³ = 512' }],
        question: 'Berapa nilai B?',
        inputs: [{ name: 'B', label: 'B =', width: 1, digits: 1 }],
        success: { title: 'PROMO CODE CRACKED!', text: '' },
        isDigit: true,
      },
    ],
    hints: [
      'Ganti A dengan nilainya dulu: x+y+z = 20, xy+yz+zx = 131, x³+y³+z³ = 1676.',
      'Hitung (x+y+z)² − 3(xy+yz+zx) = 400 − 393 = 7. Masukkan ke Formula Key.',
      'Formula: 1676 − 3xyz = 20 × 7 = 140. Selesaikan untuk xyz.',
    ],
    reward: { title: 'PROMO CODE CRACKED!', next: 'KOPIKINA' },
  },

  // ================= MISSION 3 (FUNGSI KOMPOSISI) =================
  {
    id: 'm3',
    location: 'kopikina',
    title: 'KOPIKINA',
    subtitle: 'STACK THE STAMPS',
    digit: 'C',
    objective: 'Menyusun fungsi komposisi (g∘f)(x), mengevaluasinya, dan menyelesaikan persamaan sederhana dari komposisi tersebut.',
    intro: [
      'Kopikina punya program Kina Stamps: beli kopi, kumpulkan stempel, tukar tumbler.',
      'Masalahnya, stempel dihitung lewat DUA mesin berurutan.',
    ],
    chips: [{ label: 'B', value: '{B}' }],
    scaffold: {
      type: 'machine',
      title: 'ALUR KINA STAMPS',
      nodes: [
        { label: 'CUP', sub: 'x cup dibeli', kind: 'start' },
        { label: 'MESIN KASIR', sub: 'f(x) = 3x + B', kind: 'fn' },
        { label: 'POIN', sub: 'f(x) poin', kind: 'mid' },
        { label: 'APLIKASI KINA', sub: 'g(x) = 2x − 5', kind: 'fn' },
        { label: 'STEMPEL', sub: 'g(f(x)) stempel', kind: 'end' },
      ],
      note: 'Stempel langsung dari jumlah cup adalah fungsi komposisi (g∘f)(x) = g(f(x)).',
    },
    steps: [
      {
        id: 'q1',
        context: [
          'Mesin kasir memberi poin dari jumlah cup: f(x) = 3x + B.',
          'Aplikasi Kina mengubah poin menjadi stempel: g(x) = 2x − 5.',
        ],
        data: [
          { label: 'DATA', text: '', value: 'f(x) = 3x + B  →  dengan B = {B}:  f(x) = 3x + 8' },
          { label: '', text: '', value: 'g(x) = 2x − 5' },
        ],
        question: 'Tulis rumus stempel langsung dari jumlah cup, yaitu (g∘f)(x) = ax + b.',
        inputs: [
          { name: 'a', label: 'a =', width: 3 },
          { name: 'b', label: 'b =', width: 3 },
        ],
        success: { title: 'FORMULA ACCEPTED', text: '(g∘f)(x) = 6x + 11' },
      },
      {
        id: 'q2',
        context: ['Rumus kalian: (g∘f)(x) = 6x + 11.'],
        data: [{ label: 'DATA', text: 'Tim kalian membeli', value: '4 cup' }],
        question: 'Berapa stempel yang didapat tim kalian?',
        inputs: [{ name: 's', label: 'stempel =', width: 4 }],
        success: { title: 'STAMPS COUNTED', text: '(g∘f)(4) = 6(4) + 11 = 35 stempel' },
      },
      {
        id: 'q3',
        context: ['Tumbler gratis bisa ditukar jika stempel tepat 53.'],
        data: [{ label: 'DATA', text: '', value: '6x + 11 = 53' }],
        question: 'Berapa cup yang harus dibeli agar stempel tepat 53?',
        inputs: [{ name: 'x', label: 'x =', suffix: 'cup', width: 3 }],
        success: { title: 'YOU WON THE TUMBLER!', text: '6x + 11 = 53  →  x = 7 cup' },
      },
      {
        id: 'digit',
        context: ['Digit C adalah jumlah cup yang harus dibeli.'],
        data: [],
        question: 'Berapa nilai C?',
        inputs: [{ name: 'C', label: 'C =', width: 1, digits: 1 }],
        success: { title: 'BONUS DIGIT!', text: '' },
        isDigit: true,
      },
    ],
    hints: [
      'Komposisi (g∘f)(x) artinya hasil f dimasukkan ke g: g(f(x)) = 2·f(x) − 5.',
      'Ganti f(x) dengan 3x + 8: 2(3x + 8) − 5. Kalikan ke dalam, lalu gabungkan konstanta.',
      'Untuk cup: selesaikan 6x + 11 = 53 → kurangi 11 di kedua ruas, lalu bagi 6.',
    ],
    reward: { title: 'YOU WON THE TUMBLER!', next: 'TEBET COFFEE RANKING' },
  },

  // ================= MISSION 4 =================
  {
    id: 'm4',
    location: 'ranking',
    title: 'TEBET COFFEE RANKING',
    subtitle: 'FIND THE BEST PAIR',
    digit: 'D',
    objective: 'Menggunakan rata-rata, jumlah data, urutan data, dan nilai selisih minimum.',
    intro: [
      'Tujuh coffee shop Tebet dinilai. Dua skor belum terbaca.',
      'Temukan pasangan skor terbaik.',
    ],
    steps: [
      {
        id: 'q1',
        context: [],
        data: [
          { label: 'DATA', text: 'Tujuh skor:', value: '4, 7, 10, 11, x, y, 30' },
          { label: '', text: 'Rata-rata:', value: '16' },
        ],
        question: 'Berapa jumlah seluruh skor?',
        inputs: [{ name: 'sum', label: '7 × 16 =', width: 5 }],
        success: { title: 'TOTAL FOUND', text: 'Jumlah seluruh skor = 112' },
      },
      {
        id: 'q2',
        context: [],
        data: [{ label: 'DATA', text: '', value: '4 + 7 + 10 + 11 + x + y + 30 = 112' }],
        question: 'Tentukan x + y.',
        inputs: [{ name: 'xy', label: 'x + y =', width: 4 }],
        success: { title: 'PAIR SUM FOUND', text: 'x + y = 50' },
      },
      {
        id: 'q3',
        context: ['x + y = 50'],
        data: [{ label: 'KONDISI', text: '', value: '11 ≤ x ≤ y ≤ 30' }],
        question: 'Tentukan x dan y sehingga selisih y − x sekecil mungkin.',
        inputs: [
          { name: 'x', label: 'x =', width: 3 },
          { name: 'y', label: 'y =', width: 3 },
        ],
        success: { title: 'PERFECT BALANCE!', text: 'x = 25 dan y = 25' },
      },
      {
        id: 'digit',
        context: ['D = y − x'],
        data: [],
        question: 'Tentukan D.',
        inputs: [{ name: 'D', label: 'D =', width: 1, digits: 1 }],
        success: { title: 'FINAL DIGIT FOUND', text: '' },
        isDigit: true,
      },
    ],
    hints: [
      'Rata-rata = jumlah ÷ banyak data. Jadi jumlah = rata-rata × 7.',
      'Jumlahkan skor yang diketahui (4+7+10+11+30), lalu kurangkan dari total untuk mendapatkan x + y.',
      'Dua bilangan dengan jumlah tetap punya selisih terkecil saat keduanya sama besar (atau sedekat mungkin).',
    ],
    reward: { title: 'SECRET PIN COMPLETE!', next: 'COFFEE VAULT' },
  },
];

export const FEEDBACK = {
  wrong: [
    { title: 'CODE REJECTED', text: 'Jawaban belum tepat. Periksa kembali langkah kalian.' },
    { title: 'CODE REJECTED', text: 'Coba gunakan informasi yang sudah tersedia.' },
    { title: 'CODE REJECTED', text: 'Belum tepat. NEED A HINT? Tekan tombol 💡 di kanan atas.' },
  ],
  correct: { title: 'CODE ACCEPTED' },
  vaultWrong: { title: 'ACCESS DENIED', text: 'PIN belum tepat. Periksa kembali digit yang kalian kumpulkan.' },
  vaultRight: { title: 'ACCESS GRANTED' },
};

export const ACHIEVEMENTS = [
  { id: 'zero-hint', name: 'ZERO HINT HERO', desc: 'Tidak menggunakan hint.' },
  { id: 'first-try', name: 'FIRST TRY', desc: 'PIN benar pada percobaan pertama.' },
  { id: 'speed', name: 'SPEED BREWER', desc: 'Selesai di bawah 8 menit.' },
  { id: 'algebra', name: 'ALGEBRA CRACKER', desc: 'Mission 2 tanpa hint.' },
  { id: 'composer', name: 'COMPOSITION MASTER', desc: 'Mission 3 benar tanpa kesalahan.' },
  { id: 'balance', name: 'PERFECT BALANCE', desc: 'Mission 4 benar tanpa kesalahan.' },
];
