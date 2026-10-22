// Builds the "POV: game night" theme reel for one booked theme and renders the video + cover.
//   node scripts/theme/build.js --theme=bootiful --pack=themes/bootiful/v2 --sounds=sounds/bootiful/v3 --day="Thu, 22 Oct" --times="12 PM,3 PM" [--no-render]
// Pulls the pack zip, music and number calls from R2 (public), writes autopilot/timed/theme-<id>.json,
// audio to public/theme/<id>/, and renders out/theme-<id>.mp4 + out/theme-<id>-cover.jpg.
// The words on screen come from theme/config.json (copy), picked by the daily runner.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const R2 = 'https://kittyparty-themes.rahul-89e.workers.dev';
const ROOT = path.join(__dirname, '..', '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + url); return Buffer.from(await r.arrayBuffer()); };

// same moments as the engine timeline (src/theme/engine.js TL)
const TL = { hook: 2.2, dive: 4.4, call1: 5.6, pan: 8.6, react: 11.6, tense: 14, full: 16.6, end: 19.6, app: 22.6, total: 26.4 };
const AVATARS = ['av-005', 'av-022', 'av-031', 'av-047', 'av-063'];
const POOL = [4, 23, 45, 61, 88, 12, 37, 49, 7, 74, 28, 55, 68, 79, 11, 33, 66, 5, 50, 80, 15, 41, 57, 83, 19, 26, 38, 52, 71, 85, 2, 9, 17, 31, 44, 63, 76, 87];

// numbers on the theme's own ticket: the first prize group fills up to "bas ek aur", 90 is the last one needed
function numbersFor(manifest) {
  const groups = manifest.ticketLayout.groups; let p = 0;
  const ticket = groups.map((g) => g.slots.map(() => POOL[p++ % POOL.length]));
  const lastG = ticket.length > 1 ? ticket.length - 1 : 0; ticket[lastG][ticket[lastG].length - 1] = 90;
  const seq = ticket[0].slice(0, -1);
  const react = ticket.length > 1 ? ticket[1][0] : ticket[0][ticket[0].length - 1];
  return { ticket, numbers: { first: seq[0], second: seq[1] ?? seq[0], seq, react, last: 90 } };
}

async function build({ id, pack, sounds, day, times, copy = {}, render = true }) {
  const work = path.join(ROOT, '.remotion', 'theme-' + id); fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(path.join(work, 'pack.zip'), await get(`${R2}/${pack}.zip`));
  run('unzip', ['-q', '-o', path.join(work, 'pack.zip'), '-d', path.join(work, 'pack')]);
  const packDir = fs.existsSync(path.join(work, 'pack', 'manifest.json')) ? path.join(work, 'pack') : path.join(work, 'pack', fs.readdirSync(path.join(work, 'pack'))[0]);
  const manifest = JSON.parse(fs.readFileSync(path.join(packDir, 'manifest.json'), 'utf8'));
  if (!manifest.ticketLayout) throw new Error(id + ' pack has no themed ticket, the reel needs one');
  const art = Object.fromEntries(fs.readdirSync(packDir).filter((f) => f.endsWith('.svg')).map((f) => [f, fs.readFileSync(path.join(packDir, f), 'utf8')]));
  const avatars = await Promise.all(AVATARS.map(async (a) => (await get(`${R2}/avatars/v1/${a}.svg`)).toString('utf8')));
  const { ticket, numbers: N } = numbersFor(manifest);

  const pub = path.join(ROOT, 'public', 'theme', id); fs.rmSync(pub, { recursive: true, force: true }); fs.mkdirSync(pub, { recursive: true });
  const call = (n) => 'call_' + String(n).padStart(2, '0') + '.m4a';
  for (const f of new Set(['music.m4a', call(N.first), call(N.second), call(N.react), call(N.last)])) fs.writeFileSync(path.join(pub, f), await get(`${R2}/${sounds}/${f}`));

  // each call plays from the ball pop until just before the next beat
  const calls = [
    { at: TL.call1 + 0.4, until: TL.pan + 0.2, file: call(N.first) },
    { at: TL.pan + 0.3, until: TL.react + 0.05, file: call(N.second) },
    { at: TL.react + 0.1, until: TL.tense, file: call(N.react) },
    { at: TL.full + 0.1, until: TL.end + 0.3, file: call(N.last) },
  ];
  const step = Math.min(0.65, 1.5 / Math.max(1, N.seq.length - 1));
  const sfx = [
    { at: 0.15, name: 'riser', vol: 0.35 }, { at: 0.55, name: 'pop', vol: 0.5 }, { at: 0.85, name: 'ding', vol: 0.4 },
    { at: TL.hook, name: 'whoosh', vol: 0.5 },
    ...[0, 1, 2, 3, 4].map((i) => ({ at: TL.hook + 0.5 + i * 0.28 + 0.28, name: 'ping', vol: 0.3 })),
    { at: TL.dive, name: 'suck', vol: 0.45 }, { at: TL.dive + 0.5, name: 'tabla', vol: 0.5 },
    { at: TL.call1 + 0.4, name: 'ballpop', vol: 0.55 }, { at: TL.call1 + 1.4, name: 'pop', vol: 0.6 },
    { at: TL.pan, name: 'swish', vol: 0.45 }, { at: TL.pan + 0.3, name: 'ballpop', vol: 0.5 },
    ...N.seq.slice(1).map((_, i) => ({ at: TL.pan + 1.0 + i * step, name: 'pop', vol: 0.55 })), { at: TL.pan + 2.4, name: 'ohho', vol: 0.5 },
    { at: TL.react + 0.1, name: 'ballpop', vol: 0.5 }, { at: TL.react + 0.5, name: 'pop', vol: 0.55 }, { at: TL.react + 0.6, name: 'sparkle', vol: 0.4 }, { at: TL.react + 1.0, name: 'laughv', vol: 0.5 }, { at: TL.react + 1.5, name: 'haaye', vol: 0.45 },
    { at: TL.tense, name: 'heartbeat', vol: 0.7 }, { at: TL.tense + 1.2, name: 'heartbeat', vol: 0.75 },
    { at: TL.full + 0.1, name: 'ballpop', vol: 0.6 }, { at: TL.full + 0.8, name: 'impact', vol: 0.55 }, { at: TL.full + 0.85, name: 'crowd', vol: 0.45 }, { at: TL.full + 1.0, name: 'waah', vol: 0.55 }, { at: TL.full + 1.2, name: 'clap', vol: 0.5 },
    { at: TL.end, name: 'whoosh', vol: 0.45 }, { at: TL.end + 0.6, name: 'ding', vol: 0.35 }, { at: TL.end + 1.2, name: 'sparkle', vol: 0.35 },
    { at: TL.app, name: 'whoosh', vol: 0.45 }, { at: TL.app + 0.1, name: 'pop', vol: 0.5 }, { at: TL.app + 0.8, name: 'ding', vol: 0.4 }, { at: TL.app + 1.0, name: 'slideup', vol: 0.4 },
  ];
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'kp-logo.png')).toString('base64');
  const spec = { logo, theme: { id, name: manifest.name, manifest }, art, avatars, day, times, copy, ticket, numbers: N, total: TL.total, calls, sfx };
  fs.mkdirSync(path.join(ROOT, 'autopilot', 'timed'), { recursive: true });
  const props = path.join('autopilot', 'timed', 'theme-' + id + '.json');
  fs.writeFileSync(path.join(ROOT, props), JSON.stringify({ spec }));
  const out = { props, spec, mp4: `out/theme-${id}.mp4`, cover: `out/theme-${id}-cover.jpg` };
  if (!render) return out;
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  run('npx', ['remotion', 'render', 'ThemeReel', out.mp4, `--props=${props}`, '--log=error']);
  run('npx', ['remotion', 'still', 'ThemeCover', out.cover, `--props=${props}`, '--image-format=jpeg', '--log=error']);
  return out;
}
module.exports = { build, TL };

if (require.main === module) {
  const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
  const o = { id: arg('theme'), pack: arg('pack'), sounds: arg('sounds'), day: arg('day'), times: (arg('times') || '').split(',').map((s) => s.trim()).filter(Boolean), render: !process.argv.includes('--no-render') };
  if (!o.id || !o.pack || !o.sounds || !o.day || !o.times.length) { console.error('need --theme --pack --sounds --day --times'); process.exit(1); }
  build(o).then((r) => console.log('done', r.render === false ? r.props : r.mp4)).catch((e) => { console.error(e.message); process.exit(1); });
}
