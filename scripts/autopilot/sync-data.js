// Pulls trends, our post stats and the posting queue into autopilot/data, and copies the
// numbers into the tracker so the writing routine can learn from them.
//   node scripts/autopilot/sync-data.js   (needs AGENT_KEY; R2_* to publish the xlsx)
const fs = require('fs');
const path = require('path');
const T = require('./tracker');

(async () => {
  const dir = path.join(T.ROOT, 'autopilot', 'data');
  fs.mkdirSync(dir, { recursive: true });
  const [trends, content, queue] = await Promise.all([T.agent('trends?days=21'), T.agent('content?days=120'), T.agent('reels/queue')]);
  fs.writeFileSync(path.join(dir, 'trends.json'), JSON.stringify(trends, null, 1));
  fs.writeFileSync(path.join(dir, 'our-posts.json'), JSON.stringify(content.posts, null, 1));
  fs.writeFileSync(path.join(dir, 'queue.json'), JSON.stringify(queue.reels, null, 1));
  const tr = T.load();
  for (const r of tr.reels) {
    const q = queue.reels.find((x) => x.local_id === r.id);
    if (q) Object.assign(r, { status: q.status === 'publishing' ? 'queued' : q.status, permalink: q.permalink || r.permalink, media_id: q.media_id || r.media_id, error: q.error || undefined });
    const p = content.posts.find((x) => (r.media_id && x.media_id === r.media_id) || (r.permalink && x.permalink === r.permalink));
    if (p) r.stats = { views: p.views, reach: p.reach, likes: p.likes, comments: p.comments, saves: p.saves, shares: p.shares, score: p.score, as_of: p.day };
  }
  T.save(tr);
  if (process.env.R2_ACCESS_KEY_ID) console.log('tracker:', await T.publishTracker(tr));
  console.log('synced', trends.posts.length, 'trend posts,', content.posts.length, 'our posts,', queue.reels.length, 'queued');
})().catch((e) => { console.error(e); process.exit(1); });
