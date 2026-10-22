// Storyboard straight from the video engine: voices the draft, then renders the middle of every shot.
// What gets approved is exactly what the video will look like.
//   node scripts/autopilot/preview.js autopilot/drafts/<id>.json   -> out/<id>-board.jpg
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
const draft = process.argv[2];
const D = JSON.parse(fs.readFileSync(path.join(ROOT, draft), 'utf8'));
run('node', ['scripts/autopilot/build.js', draft]);
const props = `autopilot/timed/${D.id}.json`;
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, props), 'utf8')).spec;
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
// one still per shot, taken late enough that entrances and pop-ins have landed
const frames = spec.shots.map((s, i) => {
  const at = Math.min(s.end - 0.1, s.start + Math.max(0.9, (s.end - s.start) * 0.6));
  const o = `out/${D.id}-s${i}.jpg`;
  run('npx', ['remotion', 'still', 'AutoReel', o, `--props=${props}`, `--frame=${Math.round(at * 30)}`, '--image-format=jpeg', '--scale=0.3', '--log=error']);
  return o;
});
const rows = [];
for (let i = 0; i < frames.length; i += 5) rows.push(frames.slice(i, i + 5));
const board = `out/${D.id}-board.jpg`;
const ins = frames.flatMap((x) => ['-i', x]);
const pad = rows.map((r, ri) => r.map((_, j) => `[${ri * 5 + j}]`).join('') + (r.length > 1 ? `hstack=${r.length}` : 'null') + (r.length < 5 ? `,pad=${324 * 5}:576:0:0:white` : '') + `[r${ri}]`).join(';');
const fc = pad + ';' + rows.map((_, ri) => `[r${ri}]`).join('') + (rows.length > 1 ? `vstack=${rows.length}` : 'null');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, board], { cwd: ROOT });
console.log('board', board, spec.total + ' s', spec.shots.length + ' shots');
