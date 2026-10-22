// Quality gate for a rendered reel. A reel that fails is NOT queued for posting.
//   node scripts/autopilot/qa.js <draft.json> <timed.json> <video.mp4>  -> prints JSON { pass, checks: [...] }
const fs = require('fs');
const { execFileSync } = require('child_process');

function loud(file, from, to) {
  const args = ['-hide_banner', '-nostats', ...(from != null ? ['-ss', String(from), '-t', String(Math.max(0.2, to - from))] : []), '-i', file, '-filter_complex', 'ebur128', '-f', 'null', '-'];
  const out = execFileSync('ffmpeg', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return out;
}
function lufs(file, from, to) {
  try { execFileSync('ffmpeg', ['-hide_banner', '-nostats', ...(from != null ? ['-ss', String(from), '-t', String(Math.max(0.4, to - from))] : []), '-i', file, '-filter_complex', 'ebur128', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch (e) { return NaN; }
  return NaN;
}
function measure(file, from, to) {
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...(from != null ? ['-ss', String(from), '-t', String(Math.max(0.4, to - from))] : []), '-i', file, '-filter_complex', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...String(r.stderr).matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? Number(m[1]) : NaN;
}

function qa(draft, spec, video) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });
  const words = spec.lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
  const spoken = spec.lines.reduce((n, l) => n + l.dur, 0);
  add('length 15-32 s', spec.total >= 15 && spec.total <= 32, spec.total + ' s');
  add('words <= 70', words <= 70, words + ' words');
  add('voice pace >= 2.3 words/s', words / spoken >= 2.3, (words / spoken).toFixed(2) + ' w/s');
  const longest = Math.max(...spec.shots.map((s) => s.end - s.start));
  add('no shot over 4.5 s', longest <= 4.5, longest.toFixed(1) + ' s');
  const dead = spec.shots.reduce((m, s, i) => Math.max(m, s.start - (spec.shots[i - 1]?.end ?? 0)), 0);
  add('script scorecard >= 44/55', (draft.review?.total ?? 0) >= 44, (draft.review?.total ?? 'missing') + '/55');
  add('clarity scored 5 with logline and mute test', draft.review?.clarity === 5 && !!draft.logline && Array.isArray(draft.mute), 'clarity ' + (draft.review?.clarity ?? 'missing'));
  add('has a hook in the first shot', !!(draft.shots[0]?.hook || draft.shots[0]?.lines?.length), '');
  add('has a punchline', spec.lines.some((l) => l.punch), '');
  add('has a cover with a title', !!(draft.cover && draft.cover.title && draft.cover.title.length), '');
  if (video) add('video file exists', fs.existsSync(video), video);
  if (video && fs.existsSync(video)) {
    const all = measure(video);
    add('overall loudness -18 to -10 LUFS', all >= -18 && all <= -10, all + ' LUFS');
    // music must be clearly audible where nobody talks (the hook card or a gap)
    const gaps = []; let prev = 0; for (const l of spec.lines) { if (l.start - prev > 0.8) gaps.push([prev + 0.1, l.start - 0.1]); prev = l.start + l.dur; }
    if (spec.total - prev > 0.8) gaps.push([prev + 0.1, spec.total - 0.4]);
    const g = gaps.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
    if (g) { const m = measure(video, g[0], g[1]); add('music audible between lines (>= -30 LUFS)', m >= -30, m + ' LUFS'); }
  }
  void dead; void loud; void lufs;
  return { pass: checks.every((c) => c.ok), checks };
}
module.exports = { qa };
if (require.main === module) {
  const [d, t, v] = process.argv.slice(2);
  console.log(JSON.stringify(qa(JSON.parse(fs.readFileSync(d, 'utf8')), JSON.parse(fs.readFileSync(t, 'utf8')).spec, v), null, 1));
}
