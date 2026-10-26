// node tools/test-logic.mjs — uji kunci jawaban & normalisasi (tanpa browser)
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
const { check, normalize } = await import('../src/game/validation.js');
const cases = [
  ['m1.q1.t', '18', true], ['m1.q1.t', '17', false], ['m1.q1.t', ' 18 ', true], ['m1.digit.A', '1', true],
  ['m2.q1.xyz', '512', true], ['m2.q1.xyz', '512.0', true], ['m2.digit.B', '8', true], ['m2.digit.B', '2', false],
  ['m3.q1.a', '6', true], ['m3.q1.b', '11', true], ['m3.q1.b', '13', false], ['m3.q2.s', '35', true], ['m3.q3.x', '7', true], ['m3.q3.x', '07', true], ['m3.digit.C', '7', true],
  ['m4.q1.sum', '112', true], ['m4.q2.xy', '50', true], ['m4.q3.x', '25', true], ['m4.q3.y', '25', true], ['m4.digit.D', '0', true], ['m4.digit.D', '-0', true],
  ['vault.pin', '1870', true], ['vault.pin', '1234', false], ['vault.pin', '0187', false], ['nope.key', '1', false],
];
let fail = 0;
for (const [k, v, exp] of cases) { const got = check(k, v); if (got !== exp) { fail++; console.log('FAIL', k, v, 'expected', exp); } }
console.log(fail ? `${fail} failures` : `all ${cases.length} validation cases pass`);
// Verifikasi matematika Mission 3 (komposisi) secara numerik
const f = (x) => 3 * x + 8, g = (x) => 2 * x - 5;
console.assert(g(f(0)) === 11 && g(f(1)) - g(f(0)) === 6, 'g∘f = 6x+11');
console.assert(g(f(4)) === 35, '(g∘f)(4)=35'); console.assert(g(f(7)) === 53, '(g∘f)(7)=53');
// Mission 2: x+y+z=20, xy+yz+zx=131, x³+y³+z³=1676 → xyz = (1676 - 20*(400-393))/3 = 512
console.assert((1676 - 20 * (400 - 3 * 131)) / 3 === 512, 'xyz=512');
console.log('math checks ok');
process.exit(fail ? 1 : 0);
