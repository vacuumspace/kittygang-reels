// Renders every draft that is not in the tracker yet, uploads it, and books its posting slot.
//   node scripts/autopilot/render-new.js        (CI: needs R2_* and AGENT_KEY env)
//   node scripts/autopilot/render-new.js --dry  (render only, no upload, no queue)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const T = require('./tracker');

const DRY = process.argv.includes('--dry');
const ROOT = T.ROOT;
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
const ist = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

(async () => {
  const tr = T.load();
  const done = new Set(tr.reels.filter((r) => r.status !== 'failed').map((r) => r.id));
  const drafts = fs.readdirSync(path.join(ROOT, 'autopilot', 'drafts')).filter((f) => f.endsWith('.json')).sort();
  for (const f of drafts) {
    const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'autopilot', 'drafts', f), 'utf8'));
    if (done.has(D.id) || D.skip) continue;
    console.log('\n=== ' + D.id + ' · ' + D.title);
    const rec = { id: D.id, created: ist(), title: D.title, format: D.format, hook: (D.shots[0]?.hook || []).join(' '), cast: [...new Set(D.shots.flatMap((s) => [s.char?.name, ...(s.chars || []).map((c) => c.name), ...(s.lines || []).map((l) => l.who)]).filter((x) => x && x !== 'ALL'))], caption: D.caption, status: 'rendering', idea: D.idea, beats: D.beats };
    rec.script = D.shots.flatMap((s, i) => (s.lines || []).map((l) => ({ shot: i + 1, kit: s.kit, who: l.who, line: l.text, beat: l.beat || '' })));
    try {
      run('node', ['scripts/autopilot/build.js', `autopilot/drafts/${f}`]);
      const props = `autopilot/timed/${D.id}.json`;
      const spec = JSON.parse(fs.readFileSync(path.join(ROOT, props), 'utf8')).spec;
      const mp4 = `out/${D.id}.mp4`;
      run('npx', ['remotion', 'render', 'AutoReel', mp4, `--props=${props}`, '--log=error']);
      // cover = hook frame; storyboard = the middle of every shot side by side
      run('npx', ['remotion', 'still', 'AutoReel', `out/${D.id}-cover.jpg`, `--props=${props}`, '--frame=24', '--image-format=jpeg', '--log=error']);
      const frames = spec.shots.map((s, i) => { const fr = Math.round(((s.start + s.end) / 2) * 30); const o = `out/${D.id}-s${i}.jpg`; run('npx', ['remotion', 'still', 'AutoReel', o, `--props=${props}`, `--frame=${fr}`, '--image-format=jpeg', '--scale=0.3', '--log=error']); return o; });
      const board = `out/${D.id}-board.jpg`;
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...frames.flatMap((x) => ['-i', x]), '-filter_complex', frames.map((_, i) => `[${i}]`).join('') + `hstack=${frames.length}`, board], { cwd: ROOT });
      rec.duration = spec.total;
      if (DRY) { rec.status = 'rendered'; console.log('dry run: rendered only'); }
      else {
        rec.video_url = T.r2put(path.join(ROOT, mp4), `reels/autopilot/${D.id}.mp4`, 'video/mp4');
        rec.cover_url = T.r2put(path.join(ROOT, `out/${D.id}-cover.jpg`), `reels/autopilot/${D.id}-cover.jpg`, 'image/jpeg');
        rec.board_url = T.r2put(path.join(ROOT, board), `reels/autopilot/${D.id}-board.jpg`, 'image/jpeg');
        const caption = [D.caption, (D.hashtags || ['#kittyparty', '#kittygang', '#kittypartygames', '#ladieskitty', '#housie']).join(' ')].filter(Boolean).join('\n\n');
        const q = await T.agent('reels/queue', { video_url: rec.video_url, caption, title: D.title, local_id: D.id });
        Object.assign(rec, { status: 'queued', queue_id: q.id, scheduled_ist: q.scheduled_ist });
        console.log('queued for', q.scheduled_ist, 'IST');
      }
    } catch (e) {
      console.error('FAILED', D.id, e.message);
      Object.assign(rec, { status: 'failed', error: String(e.message).slice(0, 300) });
    }
    tr.reels = tr.reels.filter((r) => r.id !== rec.id).concat(rec);
    T.save(tr);
  }
  if (!DRY) console.log('tracker:', await T.publishTracker(tr));
})().catch((e) => { console.error(e); process.exit(1); });
