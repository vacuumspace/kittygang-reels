// Reusable sound-effects library, synthesised in code (no downloads, no licences).
//   npm run sfx   -> public/sfx/*.wav
const fs = require('fs');
const path = require('path');
const SR = 44100;
const OUT = path.join(__dirname, '..', 'public', 'sfx');
fs.mkdirSync(OUT, { recursive: true });
let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const TAU = Math.PI * 2;

function wav(name, L, R = L) {
  let pk = 0; for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = pk ? 0.9 / pk : 1, n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); b.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
  fs.writeFileSync(path.join(OUT, name + '.wav'), b);
}
// state-variable band-pass with a moving centre frequency
function sweepNoise(len, f0, f1, q, env, pan = 0) {
  const n = Math.round(len * SR), L = new Float32Array(n), R = new Float32Array(n);
  let lo = 0, bp = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, fc = f0 * Math.pow(f1 / f0, u), f = 2 * Math.sin((Math.PI * fc) / SR);
    const hp = rnd() - lo - bp / q; bp += f * hp; lo += f * bp;
    const v = bp * env(u), p = typeof pan === 'function' ? pan(u) : pan;
    L[i] = v * Math.cos(((p + 1) * Math.PI) / 4); R[i] = v * Math.sin(((p + 1) * Math.PI) / 4);
  }
  return [L, R];
}
const tone = (len, fn) => { const n = Math.round(len * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; const [f, a] = fn(t, i / n); ph += (TAU * f) / SR; o[i] = Math.sin(ph) * a; } return o; };
const addTo = (A, B, at = 0, g = 1) => { const s = Math.round(at * SR); for (let i = 0; i < B.length && s + i < A.length; i++) A[s + i] += B[i] * g; return A; };

// whoosh: camera move. Rises then falls, pans across.
wav('whoosh', ...sweepNoise(0.7, 300, 2600, 1.6, (u) => Math.sin(Math.PI * u) ** 2, (u) => -0.7 + 1.4 * u));
// swish: fabric twirl, short and bright
wav('swish', ...sweepNoise(0.45, 900, 5000, 2.2, (u) => Math.sin(Math.PI * Math.pow(u, 0.7)) ** 3, (u) => 0.5 - u));
// riser: builds tension into a line
{ const [L, R] = sweepNoise(1.4, 200, 6000, 3, (u) => u * u); const t = tone(1.4, (x, u) => [180 * Math.pow(6, u), 0.12 * u * u]); addTo(L, t); addTo(R, t); wav('riser', L, R); }
// suck: reverse whoosh straight into a hit
wav('suck', ...sweepNoise(0.35, 4000, 400, 2, (u) => Math.pow(u, 2.5)));
// pop: caption word appears
{ const p = tone(0.12, (t) => [900 * Math.exp(-t * 28) + 420, Math.exp(-t * 38)]); wav('pop', p); }
// impact: big hit on the punch line (sub drop + crack + tail)
{ const n = Math.round(1.6 * SR); const L = new Float32Array(n), R = new Float32Array(n);
  const sub = tone(1.4, (t) => [40 + 80 * Math.exp(-t * 14), Math.exp(-t * 3.2)]); addTo(L, sub); addTo(R, sub);
  const [cl, cr] = sweepNoise(0.5, 5000, 600, 0.8, (u) => Math.exp(-u * 9)); addTo(L, cl, 0, 0.8); addTo(R, cr, 0, 0.8);
  wav('impact', L, R); }
// sparkle: glittery chimes (petals, magic)
{ const n = Math.round(1.6 * SR); const L = new Float32Array(n), R = new Float32Array(n);
  for (let k = 0; k < 16; k++) { const f = 1800 + Math.abs(rnd()) * 3800, at = Math.abs(rnd()) * 0.9, ch = tone(0.6, (t) => [f, 0.3 * Math.exp(-t * 9)]); addTo(k % 2 ? L : R, ch, at); addTo(k % 2 ? R : L, ch, at, 0.35); }
  wav('sparkle', L, R); }
// boing: cartoon spring for comic beats
wav('boing', tone(0.5, (t) => [260 + 140 * Math.sin(t * 60) * Math.exp(-t * 5), Math.exp(-t * 5)]));
// crowd: garba ground ambience (murmur + distant claps), 20 s
{ const n = 20 * SR; const L = new Float32Array(n), R = new Float32Array(n);
  for (const [lc, rc, f, q, g] of [[1, 0.6, 450, 1.2, 0.5], [0.6, 1, 900, 1.5, 0.35], [0.8, 0.8, 1600, 2, 0.15]]) {
    let lo = 0, bp = 0; const ff = 2 * Math.sin((Math.PI * f) / SR);
    for (let i = 0; i < n; i++) { const hp = rnd() - lo - bp / q; bp += ff * hp; lo += ff * bp; const m = 0.6 + 0.4 * Math.sin(i / SR * 3.1 + f) * Math.sin(i / SR * 1.7); L[i] += bp * g * lc * m; R[i] += bp * g * rc * m; }
  }
  for (let k = 0; k < 120; k++) { const at = Math.abs(rnd()) * 19.8; const c = tone(0.05, () => [0, 0]); const s = Math.round(at * SR); const pan = Math.abs(rnd()); for (let i = 0; i < 0.04 * SR; i++) { const v = rnd() * Math.exp(-i / SR * 120) * 0.25; L[s + i] += v * (1 - pan); R[s + i] += v * pan; } void c; }
  wav('crowd', L, R); }
console.log('sfx:', fs.readdirSync(OUT).join(', '));
