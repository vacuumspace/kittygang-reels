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

// Storylines. Every night uses a different one (scripts/theme/daily.js), so two days never look alike.
// Each has its own timeline (seconds); the engine draws it from spec.tl. All share the cover, times card and app card.
const STORIES = {
  pov: { hook: 2.2, dive: 4.4, call1: 5.6, pan: 8.6, react: 11.6, tense: 14, full: 16.6, end: 19.6, app: 22.6, total: 26.4 },
  guess: { hook: 2.2, q: [4.4, 10.4, 16.4], reveal: 4.4, tally: 22.4, end: 24.6, app: 27.6, total: 31.4 },
  race: { hook: 2.2, race: 4.4, calls: [4.6, 7.1, 9.6, 12.1], tense: 14.6, full: 16.8, end: 19.8, app: 22.8, total: 26.6 },
};
const AVATARS = ['av-005', 'av-022', 'av-031', 'av-047', 'av-063'];
const call = (n) => 'call_' + String(n).padStart(2, '0') + '.m4a';
// numbers change every day (seeded by the date), so the calls heard are different too
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const shuffled = (r) => { const a = Array.from({ length: 89 }, (_, i) => i + 1); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function plan(story, manifest, seed) {
  const r = rng(seed), pool = shuffled(r), L = STORIES[story];
  // numbers on the theme's own ticket: the first prize group fills up to "bas ek aur", 90 is the last one needed
  let p = 0; const ticket = manifest.ticketLayout.groups.map((g) => g.slots.map(() => pool[p++ % pool.length]));
  const lastG = ticket.length > 1 ? ticket.length - 1 : 0; ticket[lastG][ticket[lastG].length - 1] = 90;
  const open = [{ at: 0.15, name: 'riser', vol: 0.35 }, { at: 0.55, name: 'pop', vol: 0.5 }, { at: 0.85, name: 'ding', vol: 0.4 }, { at: L.hook, name: 'whoosh', vol: 0.5 }];
  const close = [
    { at: L.end, name: 'whoosh', vol: 0.45 }, { at: L.end + 0.6, name: 'ding', vol: 0.35 }, { at: L.end + 1.2, name: 'sparkle', vol: 0.35 },
    { at: L.app, name: 'whoosh', vol: 0.45 }, { at: L.app + 0.1, name: 'pop', vol: 0.5 }, { at: L.app + 0.8, name: 'ding', vol: 0.4 }, { at: L.app + 1.0, name: 'slideup', vol: 0.4 },
  ];
  if (story === 'guess') {
    const quiz = pool.slice(40, 43);
    const calls = L.q.map((q, i) => ({ at: q + 0.4, until: q + L.reveal + 1.3, file: call(quiz[i]) }));
    const sfx = [...open, { at: L.hook + 0.9, name: 'sparkle', vol: 0.35 },
      ...L.q.flatMap((q, i) => [{ at: q, name: 'swish', vol: 0.45 }, ...[3, 2, 1].map((k) => ({ at: q + L.reveal - k, name: 'tick', vol: 0.4 })), { at: q + L.reveal, name: 'ballpop', vol: 0.6 }, { at: q + L.reveal + 0.15, name: 'ding', vol: 0.45 }, { at: q + L.reveal + 0.5, name: ['ohho', 'haaye', 'waah'][i], vol: 0.5 }]),
      { at: L.tally, name: 'whoosh', vol: 0.45 }, ...[0, 1, 2].map((i) => ({ at: L.tally + 0.3 + i * 0.2, name: 'pop', vol: 0.5 })), { at: L.tally + 1.0, name: 'laughv', vol: 0.45 }, ...close];
    return { tl: L, ticket, numbers: { quiz }, calls, sfx };
  }
  if (story === 'race') {
    const race = pool.slice(50, 54);
    const calls = [...L.calls.map((c, i) => ({ at: c, until: (L.calls[i + 1] ?? L.tense) - 0.1, file: call(race[i]) })), { at: L.full, until: L.end + 0.3, file: call(90) }];
    const sfx = [...open, ...[0, 1, 2, 3, 4].map((i) => ({ at: L.hook + 0.3 + i * 0.12, name: 'ping', vol: 0.3 })), { at: L.race, name: 'sting', vol: 0.4 },
      ...L.calls.flatMap((c) => [{ at: c, name: 'ballpop', vol: 0.5 }, { at: c + 0.9, name: 'slideup', vol: 0.35 }]),
      { at: L.tense, name: 'heartbeat', vol: 0.7 }, { at: L.tense + 1.1, name: 'heartbeat', vol: 0.75 },
      { at: L.full, name: 'ballpop', vol: 0.6 }, { at: L.full + 0.9, name: 'impact', vol: 0.55 }, { at: L.full + 0.95, name: 'crowd', vol: 0.45 }, { at: L.full + 1.1, name: 'waah', vol: 0.55 }, { at: L.full + 1.3, name: 'clap', vol: 0.5 }, ...close];
    return { tl: L, ticket, numbers: { race }, calls, sfx };
  }
  // pov: game night on a phone
  const seq = ticket[0].slice(0, -1), react = ticket.length > 1 ? ticket[1][0] : ticket[0][ticket[0].length - 1];
  const N = { first: seq[0], second: seq[1] ?? seq[0], seq, react, last: 90 };
  const calls = [
    { at: L.call1 + 0.4, until: L.pan + 0.2, file: call(N.first) },
    { at: L.pan + 0.3, until: L.react + 0.05, file: call(N.second) },
    { at: L.react + 0.1, until: L.tense, file: call(N.react) },
    { at: L.full + 0.1, until: L.end + 0.3, file: call(N.last) },
  ];
  const step = Math.min(0.65, 1.5 / Math.max(1, seq.length - 1));
  const sfx = [...open,
    ...[0, 1, 2, 3, 4].map((i) => ({ at: L.hook + 0.5 + i * 0.28 + 0.28, name: 'ping', vol: 0.3 })),
    { at: L.dive, name: 'suck', vol: 0.45 }, { at: L.dive + 0.5, name: 'tabla', vol: 0.5 },
    { at: L.call1 + 0.4, name: 'ballpop', vol: 0.55 }, { at: L.call1 + 1.4, name: 'pop', vol: 0.6 },
    { at: L.pan, name: 'swish', vol: 0.45 }, { at: L.pan + 0.3, name: 'ballpop', vol: 0.5 },
    ...seq.slice(1).map((_, i) => ({ at: L.pan + 1.0 + i * step, name: 'pop', vol: 0.55 })), { at: L.pan + 2.4, name: 'ohho', vol: 0.5 },
    { at: L.react + 0.1, name: 'ballpop', vol: 0.5 }, { at: L.react + 0.5, name: 'pop', vol: 0.55 }, { at: L.react + 0.6, name: 'sparkle', vol: 0.4 }, { at: L.react + 1.0, name: 'laughv', vol: 0.5 }, { at: L.react + 1.5, name: 'haaye', vol: 0.45 },
    { at: L.tense, name: 'heartbeat', vol: 0.7 }, { at: L.tense + 1.2, name: 'heartbeat', vol: 0.75 },
    { at: L.full + 0.1, name: 'ballpop', vol: 0.6 }, { at: L.full + 0.8, name: 'impact', vol: 0.55 }, { at: L.full + 0.85, name: 'crowd', vol: 0.45 }, { at: L.full + 1.0, name: 'waah', vol: 0.55 }, { at: L.full + 1.2, name: 'clap', vol: 0.5 }, ...close];
  return { tl: L, ticket, numbers: N, calls, sfx };
}

// The booked theme's pack (art, manifest, ticket layout) plus avatars, ready for the engines.
async function loadPack(id, pack) {
  const work = path.join(ROOT, '.remotion', 'theme-' + id); fs.rmSync(work, { recursive: true, force: true }); fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(path.join(work, 'pack.zip'), await get(`${R2}/${pack}.zip`));
  run('unzip', ['-q', '-o', path.join(work, 'pack.zip'), '-d', path.join(work, 'pack')]);
  const packDir = fs.existsSync(path.join(work, 'pack', 'manifest.json')) ? path.join(work, 'pack') : path.join(work, 'pack', fs.readdirSync(path.join(work, 'pack'))[0]);
  const manifest = JSON.parse(fs.readFileSync(path.join(packDir, 'manifest.json'), 'utf8'));
  if (!manifest.ticketLayout) throw new Error(id + ' pack has no themed ticket, the reel needs one');
  const art = Object.fromEntries(fs.readdirSync(packDir).filter((f) => f.endsWith('.svg')).map((f) => [f, fs.readFileSync(path.join(packDir, f), 'utf8')]));
  const avatars = await Promise.all(AVATARS.map(async (a) => (await get(`${R2}/avatars/v1/${a}.svg`)).toString('utf8')));
  return { manifest, art, avatars };
}
// Theme spec for the AI-written reels (Kitty Gang engine theme kits): the pack plus a date-seeded ticket.
// The music and number calls a draft uses are copied by scripts/autopilot/build.js.
async function loadTheme({ id, pack, day, times, seed = 1 }) {
  const { manifest, art, avatars } = await loadPack(id, pack);
  const pool = shuffled(rng(seed));
  let p = 0; const ticket = manifest.ticketLayout.groups.map((g) => g.slots.map(() => pool[p++ % pool.length]));
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'kp-logo.png')).toString('base64');
  return { logo, theme: { id, name: manifest.name, manifest }, art, avatars, day, times, ticket, copy: {} };
}

async function build({ id, pack, sounds, day, times, copy = {}, story = 'pov', seed = 1, render = true }) {
  const { manifest, art, avatars } = await loadPack(id, pack);
  const P = plan(story, manifest, seed);

  const pub = path.join(ROOT, 'public', 'theme', id); fs.rmSync(pub, { recursive: true, force: true }); fs.mkdirSync(pub, { recursive: true });
  for (const f of new Set(['music.m4a', ...P.calls.map((c) => c.file)])) fs.writeFileSync(path.join(pub, f), await get(`${R2}/${sounds}/${f}`));
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'kp-logo.png')).toString('base64');
  const spec = { logo, theme: { id, name: manifest.name, manifest }, art, avatars, day, times, copy, story, tl: P.tl, ticket: P.ticket, numbers: P.numbers, total: P.tl.total, calls: P.calls, sfx: P.sfx };
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
module.exports = { build, loadTheme, STORIES, R2, get, call };

if (require.main === module) {
  const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
  const o = { story: arg('story', 'pov'), seed: Number(arg('seed', 1)), id: arg('theme'), pack: arg('pack'), sounds: arg('sounds'), day: arg('day'), times: (arg('times') || '').split(',').map((s) => s.trim()).filter(Boolean), render: !process.argv.includes('--no-render') };
  if (!o.id || !o.pack || !o.sounds || !o.day || !o.times.length) { console.error('need --theme --pack --sounds --day --times'); process.exit(1); }
  build(o).then((r) => console.log('done', r.render === false ? r.props : r.mp4)).catch((e) => { console.error(e.message); process.exit(1); });
}
