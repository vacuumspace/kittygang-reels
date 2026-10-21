// Light, quirky background loop (pizzicato bass, marimba hook, snaps, shaker) in C major, 104 bpm.
//   node scripts/music-quirky.js public/anatomy/music.wav 56
const fs = require('fs');
const SR = 44100, TAU = Math.PI * 2;
const [out, secs = '64'] = process.argv.slice(2);
const BPM = 104, B = 60 / BPM, N = Math.round(Number(secs) * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const add = (at, len, pan, fn) => { const s0 = Math.round(at * SR); for (let i = 0; i < len * SR && s0 + i < N; i++) { const v = fn(i / SR); L[s0 + i] += v * (1 - pan); R[s0 + i] += v * (1 + pan); } };
const marimba = (at, m, a = 0.22, pan = 0.2) => { const f = midi(m); add(at, 0.9, pan, (t) => a * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 4 * t) * Math.exp(-t * 30)) * Math.exp(-t * 6)); };
const pizz = (at, m, a = 0.3) => { const f = midi(m); add(at, 0.5, -0.1, (t) => a * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2 * t)) * Math.exp(-t * 9) * Math.min(1, t * 400)); };
const snap = (at, a = 0.25) => add(at, 0.06, 0.3, (t) => a * rnd() * Math.exp(-t * 90));
const shaker = (at, a = 0.05) => add(at, 0.05, -0.3, (t) => a * rnd() * Math.sin((Math.PI * t) / 0.05));
const kick = (at, a = 0.5) => add(at, 0.25, 0, (t) => a * Math.sin(TAU * (50 * t + 2.5 * (1 - Math.exp(-t * 25)))) * Math.exp(-t * 14));
// 4-bar loop C - Am - F - G; hook melody over it (beat numbers within the 16-beat phrase)
const chords = [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [59, 62, 67]]];
const hook = [[0, 72], [0.75, 76], [1.5, 79], [2, 76], [2.5, 74], [3, 72], [3.5, 74], [4, 69], [4.75, 72], [5.5, 76], [6, 74], [7, 72], [8, 77], [8.75, 76], [9.5, 74], [10, 72], [10.5, 69], [12, 71], [12.75, 74], [13.5, 79], [14, 77], [14.5, 76], [15, 74]];
const bars = Math.ceil(Number(secs) / (4 * B));
for (let bar = 0; bar < bars; bar++) {
  const t0 = bar * 4 * B, [bass, ch] = chords[bar % 4];
  pizz(t0, bass); pizz(t0 + 1.5 * B, bass + 7, 0.22); pizz(t0 + 2 * B, bass + 12, 0.2); pizz(t0 + 3 * B, bass + 7, 0.2);
  for (let k = 0; k < 8; k++) shaker(t0 + (k * B) / 2, k % 2 ? 0.035 : 0.05);
  snap(t0 + B); snap(t0 + 3 * B);
  if (bar >= 2) { kick(t0); kick(t0 + 2 * B, 0.35); }
  ch.forEach((m, k) => marimba(t0 + 0.5 * B + k * 0.02, m, 0.06, -0.4));
  if (bar >= 1 && bar % 8 !== 7) for (const [beat, m] of hook.filter(([b]) => b >= (bar % 4) * 4 && b < (bar % 4) * 4 + 4)) marimba(t0 + (beat - (bar % 4) * 4) * B, m, 0.16);
}
let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.85 / pk, b = Buffer.alloc(44 + N * 4);
b.write('RIFF', 0); b.writeUInt32LE(36 + N * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { b.writeInt16LE(Math.round(Math.tanh(L[i] * g) * 30000), 44 + i * 4); b.writeInt16LE(Math.round(Math.tanh(R[i] * g) * 30000), 46 + i * 4); }
fs.writeFileSync(out, b);
console.log('music', secs + 's');
