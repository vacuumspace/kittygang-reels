// Comedy / notebook sound effects, synthesised (no downloads, no licences). Adds to public/sfx/.
//   node scripts/sfx-comedy.js
const fs = require('fs');
const path = require('path');
const SR = 44100, TAU = Math.PI * 2;
const OUT = path.join(__dirname, '..', 'public', 'sfx');
let seed = 13; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const buf = (s) => new Float32Array(Math.round(s * SR));
const add = (A, at, len, fn) => { const s0 = Math.round(at * SR); for (let i = 0; i < len * SR && s0 + i < A.length; i++) A[s0 + i] += fn(i / SR); return A; };
const sine = (f) => { let ph = 0; return (t, ff = f) => { ph += (TAU * ff) / SR; return Math.sin(ph); }; };
function bp(fc, q) { let lo = 0, b = 0; return (x, f = fc) => { const k = 2 * Math.sin((Math.PI * f) / SR); const hp = x - lo - b / q; b += k * hp; lo += k * b; return b; }; }
function wav(name, L, R = L) {
  let pk = 0; for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = pk ? 0.9 / pk : 1, n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); b.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
  fs.writeFileSync(path.join(OUT, name + '.wav'), b);
}
// cricket: two little chirp groups
{ const A = buf(1.2); for (const at of [0, 0.32]) for (let k = 0; k < 3; k++) { const o = sine(4300); add(A, at + k * 0.045, 0.035, (t) => o(t) * Math.sin((Math.PI * t) / 0.035) * 0.6); } wav('cricket', A); }
// doorbell: ding-dong
{ const A = buf(1.6); for (const [at, f] of [[0, 784], [0.45, 622]]) { const o1 = sine(f), o2 = sine(f * 2.76); add(A, at, 1.1, (t) => (o1(t) + 0.3 * o2(t)) * Math.exp(-t * 3.2) * 0.5); } wav('doorbell', A); }
// shutter: camera click
{ const A = buf(0.25), f = bp(3000, 1.2); add(A, 0, 0.03, (t) => f(rnd()) * Math.exp(-t * 200)); const g = bp(1800, 1.5); add(A, 0.07, 0.05, (t) => g(rnd()) * Math.exp(-t * 120) * 0.8); wav('shutter', A); }
// paper rip
{ const A = buf(0.7), f = bp(2500, 0.7); add(A, 0, 0.6, (t) => f(rnd() * (0.5 + 0.5 * Math.abs(Math.sin(t * 180)))) * Math.min(1, t * 30) * Math.exp(-t * 3)); wav('rip', A); }
// heartbeat: lub-dub
{ const A = buf(0.9); for (const [at, g] of [[0, 1], [0.18, 0.7]]) { const o = sine(55); add(A, at, 0.25, (t) => o(t, 55 + 40 * Math.exp(-t * 30)) * Math.exp(-t * 18) * g); } wav('heartbeat', A); }
// flatline: long monitor beep
{ const A = buf(1.8), o = sine(1000); add(A, 0, 1.8, (t) => o(t) * 0.35 * Math.min(1, t * 40) * Math.min(1, (1.8 - t) * 8)); wav('flatline', A); }
// record scratch
{ const A = buf(0.6), f = bp(1200, 2); add(A, 0, 0.55, (t) => (t < 0.5 ? f(rnd(), 400 + 2600 * Math.abs(Math.sin(t * 14))) : 0)); wav('scratch', A); }
// notification ping
{ const A = buf(0.8); for (const [at, fr] of [[0, 1318], [0.09, 1760]]) { const o = sine(fr); add(A, at, 0.6, (t) => o(t) * Math.exp(-t * 7) * 0.5); } wav('ping', A); }
// calculator beeps
{ const A = buf(0.9); [1400, 1600, 1300, 1700, 1500].forEach((fr, k) => { const o = sine(fr); add(A, k * 0.15, 0.07, (t) => o(t) * 0.4); }); wav('calc', A); }
// marker scribble (loopable 1.5 s)
{ const A = buf(1.5), f = bp(3200, 0.9); add(A, 0, 1.5, (t) => f(rnd()) * (0.35 + 0.65 * Math.abs(Math.sin(t * 23))) * 0.6); wav('scribble', A); }
// sticky-note slap
{ const A = buf(0.3), f = bp(900, 0.8); add(A, 0, 0.12, (t) => f(rnd()) * Math.exp(-t * 60)); const o = sine(180); add(A, 0, 0.1, (t) => o(t) * Math.exp(-t * 50) * 0.6); wav('slap', A); }
// sparkly chimes run
{ const A = buf(1.4); [1047, 1319, 1568, 2093, 2637].forEach((fr, k) => { const o = sine(fr); add(A, k * 0.07, 0.8, (t) => o(t) * Math.exp(-t * 6) * 0.35); }); wav('chimes', A); }
// slide whistle up
{ const A = buf(0.9), o = sine(400); add(A, 0, 0.85, (t) => o(t, 400 + 1500 * Math.pow(t / 0.85, 1.4)) * 0.45 * Math.min(1, t * 20) * Math.min(1, (0.85 - t) * 20)); wav('whistle', A); }
// dramatic sting: low hit + dissonant chord
{ const A = buf(2.0); for (const fr of [110, 116.5, 164.8, 233]) { let ph = 0; add(A, 0, 1.9, (t) => { ph += (TAU * fr) / SR; const s = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph); return s * 0.18 * Math.min(1, t * 25) * Math.exp(-t * 1.6); }); } const o = sine(45); add(A, 0, 1, (t) => o(t) * Math.exp(-t * 4) * 0.8); wav('sting', A); }
// soft clock tick
{ const A = buf(0.1), f = bp(5000, 3); add(A, 0, 0.02, (t) => f(rnd()) * Math.exp(-t * 300)); wav('tick', A); }
// housie ball pop
{ const A = buf(0.3), o = sine(500); add(A, 0, 0.18, (t) => o(t, 900 * Math.exp(-t * 18) + 300) * Math.exp(-t * 22)); wav('ballpop', A); }
// chai slurp: bubbly noise sweep
{ const A = buf(0.9), f = bp(900, 3); add(A, 0, 0.85, (t) => f(rnd() * (0.4 + 0.6 * Math.abs(Math.sin(t * 90))), 600 + 900 * t) * Math.sin((Math.PI * t) / 0.85) * 0.8); wav('slurp', A); }
// door creak
{ const A = buf(0.8), f = bp(500, 6); add(A, 0, 0.75, (t) => f((Math.sin(TAU * 38 * t) > 0.6 ? 1 : 0) * rnd(), 420 + 200 * t) * Math.sin((Math.PI * t) / 0.75) * 1.2); wav('creak', A); }
// soft thud
{ const A = buf(0.4), o = sine(70); add(A, 0, 0.35, (t) => o(t, 70 + 50 * Math.exp(-t * 30)) * Math.exp(-t * 12)); const f = bp(400, 1); add(A, 0, 0.06, (t) => f(rnd()) * Math.exp(-t * 80) * 0.6); wav('thud', A); }
// hand clap (two quick claps)
{ const A = buf(0.5); for (const at of [0, 0.16]) { const f = bp(1300, 0.9); add(A, at, 0.08, (t) => f(rnd()) * Math.exp(-t * 70)); } wav('clap', A); }
// quick whip (head turn)
{ const A = buf(0.3), f = bp(800, 1.5); add(A, 0, 0.25, (t) => f(rnd(), 600 + 5000 * (t / 0.25)) * Math.sin((Math.PI * t) / 0.25) ** 2); wav('whip', A); }
console.log('comedy sfx done:', fs.readdirSync(OUT).length, 'files');
