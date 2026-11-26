// Daily leaderboard story (6 PM IST, Instagram Story + Facebook Page story).
// Today's top 10 from the app's public board (leaderboardPublic/<IST date>: first names, avatars, points, the same
// board every player already sees in the app), on the day's theme art with the theme's music, then the times card
// (today's games) and the Download app card.
//   node scripts/leaderboard/story.js [YYYY-MM-DD] [--dry]
// CI env: FIREBASE_SA, AGENT_KEY, R2_*. Started by the messaging Worker at 5:35 PM IST (backup 5:50); it renders,
// waits for 6:00 PM, posts, and writes a marker so a second run the same day does nothing.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const T = require('../autopilot/tracker');
const { today, token, fields } = require('../theme/today');
const { R2 } = require('../theme/build');

const ROOT = T.ROOT;
const DRY = process.argv.includes('--dry');
const IST = 5.5 * 3600e3;
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Firestore REST value -> plain JS, including arrays (today.js only needs maps)
const val = (v) => (v.arrayValue ? (v.arrayValue.values || []).map(val) : v.mapValue ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)])) : fields({ x: v }).x);
const firstName = (n) => String(n || '').trim().split(/\s+/)[0].replace(/[^\p{L}\p{N}.'-]/gu, '').slice(0, 14) || 'Player';
// "6:30 PM" -> minutes after midnight
const mins = (s) => { const m = String(s).match(/^(\d+)(?::(\d+))?\s*(AM|PM)$/i); if (!m) return -1; let h = Number(m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + Number(m[2] || 0); };

(async () => {
  const dateArg = process.argv.slice(2).find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  if (!DRY && !(await T.status('leaderboard-story', 'running'))) return console.log('Leaderboard Story is paused in admin');
  const d = await today(dateArg);
  const id = 'LB-' + d.date, marker = 'stories/leaderboard/' + id + '.json';
  if (!DRY) {
    const seen = await fetch(R2 + '/' + marker + '?t=' + Date.now()).then((r) => r.ok).catch(() => false);
    if (seen) { console.log('already posted today'); return; }
  }
  if (!d.theme) throw new Error('no theme booked for ' + d.date);

  // today's public board (written by the app every time a public game finishes)
  const sa = JSON.parse(process.env.FIREBASE_SA);
  const tok = await token(sa);
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/leaderboardPublic/${d.date}`, { headers: { Authorization: 'Bearer ' + tok } });
  if (r.status === 404) { await T.status('leaderboard-story', 'ok', 'No public game finished yet today, no story'); return console.log('no board yet'); }
  const doc = await r.json();
  if (!r.ok) throw new Error('firestore ' + r.status + ' ' + JSON.stringify(doc).slice(0, 200));
  const top = (doc.fields?.top ? val(doc.fields.top) : []).filter((e) => e && e.points > 0).slice(0, 10);
  if (top.length < 3) { await T.status('leaderboard-story', 'ok', 'Fewer than 3 players on today\'s board, no story'); return console.log('board too small'); }

  // avatars: the app's own pack on R2 (av-NNN); anything else falls back to the default
  const avs = {};
  for (const e of top) {
    const a = /^av-\d{3,}$/.test(String(e.emoji)) ? e.emoji : 'av-018';
    if (!avs[a]) avs[a] = await fetch(`${R2}/avatars/v1/${a}.svg`).then((x) => (x.ok ? x.text() : '')).catch(() => '');
    e.av = avs[a] || avs['av-018'] || '';
  }
  const rows = top.map((e, i) => ({ rank: e.rank || i + 1, name: firstName(e.name), points: Math.round(e.points), av: e.av }));

  // games still to come today (after 6 PM)
  const left = d.times.filter((s) => mins(s) > 18 * 60);
  const foot = left.length ? 'Abhi baaki: ' + left.slice(0, 3).join(', ') : 'Kal phir milte hain!';

  const draft = {
    id, title: 'Aaj ka Leaderboard ' + d.date, pace: 0,
    theme: { id: d.theme.id, pack: d.theme.pack, sounds: d.theme.sounds, day: d.day, times: d.times, seed: Number(d.date.replace(/-/g, '')) % 97 },
    shots: [{ kit: 'tleader', dur: 9, rows, title: 'Aaj ka Leaderboard', sub: d.theme.name + ' Housie · ' + d.day, foot }],
  };
  const df = path.join(ROOT, 'autopilot', 'wip', id + '.json');
  fs.mkdirSync(path.dirname(df), { recursive: true });
  fs.writeFileSync(df, JSON.stringify(draft));
  run('node', ['scripts/autopilot/build.js', path.relative(ROOT, df)]);
  const mp4 = 'out/' + id + '.mp4';
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  run('npx', ['remotion', 'render', 'AutoReel', mp4, '--props=autopilot/timed/' + id + '.json', '--log=error']);
  if (DRY) return console.log('dry run: rendered', mp4);

  const video_url = T.r2put(path.join(ROOT, mp4), 'stories/leaderboard/' + id + '.mp4', 'video/mp4');
  // post at 6:00 PM IST sharp (the Worker starts this around 5:35)
  const six = Date.parse(d.date + 'T18:00:00Z') - IST, wait = six - Date.now();
  if (wait > 0 && wait < 40 * 60000) { console.log('waiting', Math.round(wait / 1000), 's for 6 PM'); await sleep(wait); }
  const out = { id, date: d.date, video_url, rows: rows.map(({ av, ...x }) => x) };
  const errs = [];
  try { out.ig = await T.agent('ig/publish', { video_url, story: true }); } catch (e) { errs.push('Instagram: ' + e.message); }
  try { out.fb = await T.agent('fb/story', { video_url }); if (out.fb.status !== 'posted') errs.push('Facebook: ' + (out.fb.error || out.fb.status)); } catch (e) { errs.push('Facebook: ' + e.message); }
  if (out.ig || out.fb?.status === 'posted') {
    const mf = path.join(ROOT, 'out', id + '.json');
    fs.writeFileSync(mf, JSON.stringify(out));
    T.r2put(mf, marker, 'application/json');
  }
  console.log(JSON.stringify({ ...out, errs }, null, 1));
  const summary = `Posted ${d.theme.name} leaderboard story (top: ${rows.slice(0, 3).map((x) => x.name).join(', ')})`;
  await T.status('leaderboard-story', errs.length ? 'failed' : 'ok', out.ig || out.fb ? summary : null, errs.length ? errs.join(' | ') : undefined);
  if (errs.length && !out.ig && out.fb?.status !== 'posted') process.exit(1);
})().catch(async (e) => { console.error(e); if (!DRY) await T.status('leaderboard-story', 'failed', null, e.message); process.exit(1); });
