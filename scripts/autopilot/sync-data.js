// Pulls trends, our post stats and the posting queue into autopilot/data, and copies the
// numbers into the tracker so the writing routine can learn from them.
//   node scripts/autopilot/sync-data.js   (needs AGENT_KEY; R2_* to publish the xlsx)
const fs = require('fs');
const path = require('path');
const T = require('./tracker');

(async () => {
  if (!(await T.status('reels-sync', 'running'))) return console.log('Content Stats Sync is paused in admin');
  const dir = path.join(T.ROOT, 'autopilot', 'data');
  fs.mkdirSync(dir, { recursive: true });
  const [trends, content, queue] = await Promise.all([T.agent('trends?days=21'), T.agent('content?days=120'), T.agent('reels/queue')]);
  fs.writeFileSync(path.join(dir, 'trends.json'), JSON.stringify(trends, null, 1));
  fs.writeFileSync(path.join(dir, 'our-posts.json'), JSON.stringify(content.posts, null, 1));
  fs.writeFileSync(path.join(dir, 'queue.json'), JSON.stringify(queue.reels, null, 1));
  const tr = T.load();
  // reels and game carousels share the posting queue and the stats source
  for (const r of [...tr.reels, ...(tr.carousels || [])]) {
    const q = queue.reels.find((x) => x.local_id === r.id);
    if (q) Object.assign(r, { status: q.status === 'publishing' ? 'queued' : q.status, permalink: q.permalink || r.permalink, media_id: q.media_id || r.media_id, error: q.error || undefined });
    const p = content.posts.find((x) => (r.media_id && x.media_id === r.media_id) || (r.permalink && x.permalink === r.permalink));
    // reels also carry skip rate (% who swipe away in the first 3 s) and average watch time
    const watch = p && p.avg_watch_ms != null ? Math.round(p.avg_watch_ms / 100) / 10 : undefined;
    if (p) r.stats = { views: p.views, reach: p.reach, likes: p.likes, comments: p.comments, saves: p.saves, shares: p.shares, score: p.score, skip: p.skip_rate ?? undefined, watch_s: watch, watched_pct: watch != null && r.duration ? Math.round((watch / r.duration) * 100) : undefined, as_of: p.day };
  }
  T.save(tr);
  if (process.env.R2_ACCESS_KEY_ID) console.log('tracker:', await T.publishTracker(tr));
  console.log('synced', trends.posts.length, 'trend posts,', content.posts.length, 'our posts,', queue.reels.length, 'queued');
  await T.status('reels-sync', 'ok', `Synced ${trends.posts.length} trend posts, ${content.posts.length} of our posts, ${queue.reels.length} in the queue`);
})().catch(async (e) => { console.error(e); await T.status('reels-sync', 'failed', null, e.message); process.exit(1); });
