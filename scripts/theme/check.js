// Checks a Theme Reel Writer draft before it is pushed (no network needed).
//   node scripts/theme/check.js theme/drafts/TH-YYYY-MM-DD.json
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const file = process.argv[2];
const errs = [], warn = [];
let D;
try { D = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('not valid JSON:', e.message); process.exit(1); }
const id = path.basename(file, '.json');
if (!/^TH-\d{4}-\d{2}-\d{2}$/.test(id)) errs.push('file name must be TH-YYYY-MM-DD.json');
const KITS = ['tgame', 'thome', 'tball', 'scene', 'hook', 'solo', 'duo', 'room', 'phone', 'camera', 'map', 'door', 'card'];
const CAST = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'autopilot', 'cast.json'), 'utf8')).voices).concat(['ALL']);
const SFX = new Set(fs.readdirSync(path.join(ROOT, 'public', 'sfx')).map((f) => f.replace(/\.wav$/, '')));
for (const k of ['title', 'format', 'idea', 'caption', 'shots', 'experiment']) if (!D[k]) errs.push('missing ' + k);
const X = D.experiment || {};
for (const k of ['format', 'hook', 'variable', 'hypothesis']) if (!X[k]) errs.push('experiment.' + k + ' missing');
// a new format every night: not one of the last 6 theme reels
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'autopilot', 'tracker.json'), 'utf8'));
const recent = tr.reels.filter((r) => r.format === 'Theme Housie' && r.id < id).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(-6).map((r) => (r.experiment && r.experiment.format) || r.story);
if (X.format && recent.includes(X.format)) errs.push(`experiment.format "${X.format}" was used in the last 6 theme reels (${recent.join(', ')}); pick another`);
let est = 0;
(D.shots || []).forEach((s, i) => {
  const at = 'shot ' + (i + 1);
  if (!KITS.includes(s.kit)) errs.push(`${at}: unknown kit "${s.kit}"`);
  if (['ttimes', 'tapp'].includes(s.kit)) errs.push(`${at}: do not add the ending cards, the render adds them`);
  (s.lines || []).forEach((l, j) => {
    if (!CAST.includes(l.who)) errs.push(`${at} line ${j + 1}: unknown speaker "${l.who}"`);
    if (l.who !== 'Zoya' && !/[ऀ-ॿ]/.test(l.say || '')) errs.push(`${at} line ${j + 1}: needs a Devanagari "say"`);
    if (String(l.text).split(/\s+/).length > 9) warn.push(`${at} line ${j + 1}: long line (keep 7 words or less)`);
    est += String(l.text).split(/\s+/).length * 0.32 + 0.15;
  });
  (s.chars || []).forEach((c) => { if (!CAST.includes(c.name)) errs.push(`${at}: unknown character "${c.name}"`); });
  if ((s.chars || []).length > 3) errs.push(`${at}: max 3 characters`);
  (s.sfx || []).forEach((x) => { if (!SFX.has(x.name)) errs.push(`${at}: unknown sfx "${x.name}"`); });
  if (s.kit === 'tgame' && s.marked != null && s.marked !== 'all' && !(s.marked >= 0 && s.marked <= 15)) errs.push(`${at}: marked must be 0-15 or "all"`);
  if (s.kit === 'tball' && s.n == null) errs.push(`${at}: tball needs n`);
  if (s.call != null && !(s.call >= 1 && s.call <= 90)) errs.push(`${at}: call must be 1-90`);
  if (s.lines == null || !s.lines.length) est += s.dur ?? (s.kit === 'tball' ? (s.revealAt ?? 3) + 1.2 : 1.5);
  if (s.call != null) est += 2.5;
});
if (est < 10 || est > 40) warn.push(`about ${Math.round(est)} s before the ending (aim for 12-35 s)`);
const text = JSON.stringify(D);
if (/[—–]/.test(text)) errs.push('remove em/en dashes');
if (!(D.shots || [])[0] || !((D.shots[0].lines || []).length || D.shots[0].hook || D.shots[0].call != null)) warn.push('shot 1 has no hook, line or call: the first 2 s must grab');
warn.forEach((w) => console.log('warn:', w));
if (errs.length) { errs.forEach((e) => console.log('ERROR:', e)); process.exit(1); }
console.log(`ok: ${D.shots.length} shots, about ${Math.round(est)} s + 6.8 s ending, format "${X.format}"`);
