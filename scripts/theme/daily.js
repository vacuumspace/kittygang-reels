// Nightly theme Housie reel: reads today's booked theme + public game times from the app, renders the
// "POV: game night" reel in that theme (its art, music and number calls), posts it on Instagram right away
// and on YouTube Shorts (Housie Themes playlist), and logs it in the tracker so the stats sync can learn.
//   node scripts/theme/daily.js [YYYY-MM-DD] [--dry]
// CI env: FIREBASE_SA, AGENT_KEY, R2_*, YT_* (YT_PLAYLIST_ID = Housie Themes playlist)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const T = require('../autopilot/tracker');
const { today } = require('./today');
const { build } = require('./build');
const { uploadShort } = require('../youtube/upload');

const DRY = process.argv.includes('--dry');
const DATE = process.argv.slice(2).find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const ROOT = T.ROOT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

// light checks before anything goes public
function qa(file) {
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
  return { dur, ok: dur > 20 && dur < 40 && fs.statSync(file).size > 1e6 };
}
// ffmpeg prints the loudness summary on stderr
const lufs = (file) => { try { return execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }) + ''; } catch (e) { return String(e.stderr || ''); } };

(async () => {
  if (!DRY && !(await T.status('theme-reel', 'running'))) return console.log('Theme Reel is paused in admin');
  const d = await today(DATE);
  if (!d.theme) { console.log('no theme booked for', d.date); if (!DRY) await T.status('theme-reel', 'ok', `No theme booked for ${d.day}, nothing posted`); return; }
  const id = 'TH-' + d.date;
  const tr = T.load();
  // backup runs: put the admin status back from "running" (no new log row)
  if (!DRY && tr.reels.some((r) => r.id === id && ['posted', 'publishing'].includes(r.status))) { await T.status('theme-reel', 'ok'); return console.log(id, 'already posted'); }
  console.log(id, d.theme.name, d.day, d.times.join(', '));

  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme', 'config.json'), 'utf8'));
  const dayN = Math.floor(Date.parse(d.date) / 86400e3);
  // a different storyline every night (never yesterday's), then the next words variant for that story
  const past = tr.reels.filter((x) => x.format === 'Theme Housie' && x.id < id && x.status !== 'failed').sort((x, y) => (x.id < y.id ? -1 : 1));
  const last = past.length ? past[past.length - 1].story || 'pov' : null;
  const order = cfg.order.filter((k) => cfg.stories[k]);
  const story = cfg.pinnedStory && cfg.pinnedStory !== last ? cfg.pinnedStory : order[(order.indexOf(last) + 1) % order.length];
  const S = cfg.stories[story], used = past.filter((x) => (x.story || 'pov') === story).length;
  const copy = S.variants.find((v) => v.id === S.pinned) || S.variants[used % S.variants.length];
  const times = d.times.length ? d.times : ['12 PM', '3 PM', '7 PM'];
  const rec = { id, created: d.date, title: `${d.theme.name} Housie night`, format: 'Theme Housie', theme: d.theme.id, story, variant: copy.id, hook: copy.hook, cast: [], status: 'rendering', idea: `Theme of the day reel: ${d.theme.name}, games ${times.join(', ')}` };
  try {
    const r = await build({ id: d.theme.id, pack: d.theme.pack, sounds: d.theme.sounds, day: d.day, times, copy, story, seed: dayN });
    const mp4 = path.join(ROOT, r.mp4), q = qa(mp4);
    const m = lufs(mp4).match(/I:\s+(-?[\d.]+) LUFS/g); const L = m ? Number(m.pop().match(/-?[\d.]+/)[0]) : null;
    rec.duration = Math.round(q.dur * 10) / 10; rec.lufs = L;
    if (!q.ok || (L != null && L < -24)) throw new Error(`QA failed: ${q.dur}s, ${L} LUFS`);
    rec.caption = [fill(S.caption || cfg.caption, { theme: d.theme.name, times: times.join(', '), day: d.day }), cfg.hashtags.join(' ')].join('\n\n');
    if (DRY) { rec.status = 'rendered'; return console.log('dry run: rendered', r.mp4); }
    rec.video_url = T.r2put(mp4, `reels/theme/${id}.mp4`, 'video/mp4');
    rec.cover_url = T.r2put(path.join(ROOT, r.cover), `reels/theme/${id}-cover.jpg`, 'image/jpeg');
    // Instagram now; the Worker finishes the upload in the background, we wait for the link
    const job = await T.agent('ig/publish', { video_url: rec.video_url, cover_url: rec.cover_url, caption: rec.caption });
    if (job.status === 'failed') throw new Error('instagram: ' + job.error);
    rec.status = 'publishing'; rec.job_id = job.jobId;
    for (let i = 0; i < 40 && rec.status === 'publishing'; i++) {
      await sleep(20000);
      const j = await T.agent('ig/publish/' + job.jobId).catch(() => null);
      if (j && j.status !== 'processing') Object.assign(rec, { status: j.status === 'failed' ? 'failed' : 'posted', permalink: j.permalink || undefined, media_id: j.media_id || undefined, error: j.error || undefined });
    }
    console.log('instagram', rec.status, rec.permalink || rec.error || '');
    // YouTube Shorts, public now (never blocks Instagram)
    if (process.env.YT_REFRESH_TOKEN) {
      try {
        const yt = await uploadShort({ file: mp4, title: `${d.theme.name} | Aaj ki Housie theme | Kitty Party`, description: rec.caption + ' #Shorts', tags: ['kitty party', 'housie', 'tambola', d.theme.name] });
        Object.assign(rec, { yt_id: yt.id, yt_url: yt.url, yt_privacy: yt.privacy });
        console.log('youtube', yt.url, yt.privacy);
      } catch (e) { rec.yt_error = String(e.message).slice(0, 200); console.error('youtube', e.message); }
    }
  } catch (e) {
    console.error('FAILED', e.message);
    Object.assign(rec, { status: 'failed', error: String(e.message).slice(0, 300) });
  } finally {
    if (!DRY) {
      tr.reels = tr.reels.filter((x) => x.id !== id).concat(rec);
      T.save(tr);
      console.log('tracker:', await T.publishTracker(tr));
      await T.status('theme-reel', rec.status === 'failed' ? 'failed' : 'ok', rec.status === 'failed' ? null : `Posted ${d.theme.name} reel (${rec.variant})${rec.yt_url ? ' + YouTube Short' : ''}`, rec.error);
    }
  }
  if (rec.status === 'failed') process.exit(1);
})().catch(async (e) => { console.error(e); if (!DRY) await T.status('theme-reel', 'failed', null, e.message); process.exit(1); });
