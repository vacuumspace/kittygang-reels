// Renders every Kitty Game Ideas draft that is not in the tracker yet, uploads the slides, publishes the
// website data (games/<slug>.json + games/index.json on R2) and books the Instagram posting slot.
//   node scripts/carousels/render-new.js        (CI: needs R2_* and AGENT_KEY env)
//   node scripts/carousels/render-new.js --dry  (render only, slides in out/carousels/<id>/)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderStill } = require('@remotion/renderer');
const T = require('../autopilot/tracker');
const { build } = require('../../carousels/build');

const DRY = process.argv.includes('--dry');
const ROOT = T.ROOT;
const PUBLIC = 'https://kittyparty-themes.rahul-89e.workers.dev';
const ist = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

function check(d, slides) {
  const errs = [];
  if (slides.length < 6 || slides.length > 10) errs.push('slides ' + slides.length + ' (need 6-10)');
  for (const k of ['id', 'n', 'slug', 'game', 'tagline', 'caption']) if (!d[k]) errs.push('missing ' + k);
  if (!d.steps || d.steps.length < 3) errs.push('need 3-5 steps');
  const w = d.web || {};
  for (const k of ['title', 'description', 'intro', 'steps', 'rules', 'faq']) if (!w[k] || (Array.isArray(w[k]) && !w[k].length)) errs.push('web.' + k + ' missing');
  if ((w.faq || []).length < 3) errs.push('web.faq needs 3+ questions');
  if (/—/.test(JSON.stringify(d))) errs.push('em dash found');
  return errs;
}

(async () => {
  const tr = T.load();
  tr.carousels = tr.carousels || [];
  const done = new Set(tr.carousels.filter((c) => c.status !== 'failed').map((c) => c.id));
  const dir = path.join(ROOT, 'carousels', 'drafts');
  const drafts = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter((d) => !done.has(d.id) && !d.skip);
  if (!drafts.length) return console.log('no new carousel drafts');
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src', 'index.ts') });
  let index = [];
  try { const r = await fetch(PUBLIC + '/games/index.json?t=' + Date.now()); if (r.ok) index = await r.json(); } catch (e) { /* first game */ }
  for (const d of drafts) {
    console.log('\n=== ' + d.id + ' · ' + d.game);
    const rec = { id: d.id, n: d.n, created: ist(), game: d.game, slug: d.slug, caption: d.caption, status: 'rendering' };
    try {
      const slides = build(d);
      const errs = check(d, slides);
      if (errs.length) throw new Error('QA: ' + errs.join('; '));
      const out = path.join(ROOT, 'out', 'carousels', d.id);
      fs.mkdirSync(out, { recursive: true });
      const files = [];
      for (const [i, svg] of slides.entries()) {
        const comp = await selectComposition({ serveUrl, id: 'Slide', inputProps: { svg } });
        const file = path.join(out, 's' + (i + 1) + '.jpg');
        await renderStill({ composition: comp, serveUrl, output: file, inputProps: { svg }, imageFormat: 'jpeg', jpegQuality: 92 });
        files.push(file);
      }
      // storyboard strip for the tracker
      const board = path.join(out, 'board.jpg');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex', files.map((_, i) => '[' + i + ']scale=270:-1[s' + i + ']').join(';') + ';' + files.map((_, i) => '[s' + i + ']').join('') + 'hstack=' + files.length, board]);
      rec.slides = slides.length;
      if (DRY) { rec.status = 'rendered'; console.log('dry run: slides in', out); continue; }
      const urls = files.map((f, i) => T.r2put(f, 'carousels/' + d.id + '/s' + (i + 1) + '.jpg', 'image/jpeg'));
      rec.board_url = T.r2put(board, 'carousels/' + d.id + '/board.jpg', 'image/jpeg');
      rec.image_urls = urls;
      // website: one JSON per game + the index the /kitty-game-ideas pages read
      const page = { id: d.id, n: d.n, slug: d.slug, game: d.game, tagline: d.tagline, date: ist(), images: urls, ...d.web };
      const pf = path.join(out, 'page.json');
      fs.writeFileSync(pf, JSON.stringify(page));
      T.r2put(pf, 'games/' + d.slug + '.json', 'application/json');
      index = index.filter((g) => g.slug !== d.slug).concat({ n: d.n, slug: d.slug, game: d.game, tagline: d.tagline, title: d.web.title, description: d.web.description, date: page.date, cover: urls[0] }).sort((a, b) => b.n - a.n);
      const xf = path.join(ROOT, 'out', 'carousels', 'index.json');
      fs.writeFileSync(xf, JSON.stringify(index));
      T.r2put(xf, 'games/index.json', 'application/json');
      rec.web_url = 'https://www.kittyparty.club/kitty-game-ideas/' + d.slug;
      const caption = [d.caption, (d.hashtags || ['#kittyparty', '#kittypartygames', '#kittypartyideas']).join(' ')].join('\n\n');
      const q = await T.agent('carousels/queue', { image_urls: urls, caption, title: 'Kitty Game Ideas #' + d.n + ': ' + d.game, local_id: d.id });
      Object.assign(rec, { status: 'queued', queue_id: q.id, scheduled_ist: q.scheduled_ist });
      console.log('queued for', q.scheduled_ist, 'IST');
    } catch (e) {
      console.error('FAILED', d.id, e.message);
      Object.assign(rec, { status: 'failed', error: String(e.message).slice(0, 300) });
    } finally {
      tr.carousels = tr.carousels.filter((c) => c.id !== rec.id).concat(rec);
      T.save(tr);
    }
  }
  if (!DRY) console.log('tracker:', await T.publishTracker(tr));
})().catch((e) => { console.error(e); process.exit(1); });
