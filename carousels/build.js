// Turns a Kitty Game Ideas draft (carousels/drafts/KGI-NNN.json) into slide SVGs in the locked template.
//   node carousels/build.js carousels/drafts/KGI-002.json   -> prints slide count; require() returns { slides, draft }
// Slides: cover, Kya chahiye, 3-5 steps, Rules, Level up, sign-off (max 10, Instagram's carousel limit).
const fs = require('fs');
const K = require('./kit');
const { T, wrap, lines, draw, head, panel, stepHead, panelTop, cover, signoff, D, P } = K;

// rough extent of each primitive around its anchor, so a drawing can be scaled to fill its panel
const REACH = { cup: [60, 115, 60, 10], cupTop: [40, 40, 40, 40], band: [80, 40, 80, 40], hand: [50, 30, 35, 55], spool: [55, 75, 55, 75], timer: [75, 135, 75, 135], person: [50, 80, 50, 80], chit: [85, 55, 85, 55], bowl: [125, 45, 115, 75], balloon: [65, 80, 65, 175], dice: [55, 55, 55, 55], card: [60, 82, 60, 82], spoon: [45, 85, 45, 165], bottle: [48, 125, 48, 108], plate: [115, 45, 115, 45], speaker: [65, 95, 65, 95], note: [30, 85, 50, 15], blindfold: [50, 80, 50, 80] };
function extent(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y, l = 0, t = 0, r = 0, b = 0) => { if (!isFinite(x) || !isFinite(y)) return; x0 = Math.min(x0, x - l); y0 = Math.min(y0, y - t); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + b); };
  for (const d of list) {
    const s = d.s || 1;
    if (d.k === 'arrow' || d.k === 'string') { add(d.x1, d.y1, 15, 15, 15, 15); add(d.x2, d.y2, 15, 15, 15, 15); continue; }
    if (d.k === 'text') { const w = String(d.text).length * (d.size || 40) * 0.28; add(d.x, d.y, d.a === 'start' ? 0 : w, (d.size || 40), d.a === 'start' ? w * 2 : w, 10); continue; }
    if (d.k === 'paper') { const w = (d.w || 300) * (d.fold >= 1 || !d.fold ? 1 : d.fold >= 0.5 ? 0.62 : 0.4) / 2 + 25; add(d.x, d.y, w, w * 0.45, w, w * 0.45); continue; }
    if (d.k === 'table') { add(d.x, d.y, (d.w || 580) / 2, d.top ? (d.h || 450) / 2 : 25, (d.w || 580) / 2, d.top ? (d.h || 450) / 2 : (d.h || 450) * 0.4); continue; }
    if (d.k === 'box') { add(d.x, d.y, (d.w || 200) / 2, (d.h || 120) / 2, (d.w || 200) / 2, (d.h || 120) / 2); continue; }
    if (d.k === 'pyramid') { const rows = d.rows || [4, 3, 2, 1]; add(d.x, d.y, rows[0] * 54 * s + 10, rows.length * 112 * s, rows[0] * 54 * s + 10, 10); continue; }
    if (d.k === 'cross' || d.k === 'tick') { add(d.x, d.y, 45 * s, 45 * s, 50 * s, 45 * s); continue; }
    if (d.k === 'clock') { add(d.x, d.y, d.r || 80, d.r || 80, d.r || 80, d.r || 80); continue; }
    const r = REACH[d.k]; if (r) add(d.x, d.y, r[0] * s, r[1] * s, r[2] * s, r[3] * s + (d.k === 'person' && d.label ? 50 : 0));
  }
  return isFinite(x0) ? { x0, y0, w: x1 - x0, h: y1 - y0 } : null;
}
// draw a list scaled (up or down, max 1.8x) and centred to fill the box x,y,w,h with some padding
const fit = (list, x, y, w, h, pad = 40, max = 1.8) => { const e = extent(list); if (!e) return ''; const s = Math.min(max, (w - pad * 2) / e.w, (h - pad * 2) / e.h); return '<g transform="translate(' + (x + (w - e.w * s) / 2 - e.x0 * s) + ' ' + (y + (h - e.h * s) / 2 - e.y0 * s) + ') scale(' + s + ')">' + draw(list) + '</g>'; };

function build(d) {
  const g = d.game;
  const slides = [];
  // 1 cover: art is designed in a 1080 x 360 box under the game card
  slides.push(cover(d.n, g, d.tagline, fit(d.cover_art || [], 120, 950, 840, 370, 10, 1.6)));
  // 2 kya chahiye: up to 6 items, each drawn in a 300 x 220 cell centred on (0, 0)
  { const it = d.need.items.slice(0, 6), top = panelTop(d.need.title, d.need.body), h = 1240 - top, rows = it.length > 3 ? 2 : 1, cols = Math.min(3, it.length), cw = 960 / cols, ch = h / rows;
    let o = stepHead(g, d.need.kicker || 'Kya chahiye', d.need.title, d.need.body) + panel(top, h);
    it.forEach((m, i) => { const cx = 60 + cw * (i % cols) + cw / 2, cy = top + ch * Math.floor(i / cols) + ch / 2 - 30;
      o += fit(m.draw || [], cx - 140, cy - 130, 280, 210, 10, 1.6);
      o += T(cx, cy + 120, m.label, 38) + (m.sub ? T(cx, cy + 162, m.sub, 28, { c: P.mute, w: 500 }) : ''); });
    slides.push(o); }
  // 3.. steps: diagram designed in a 960 x 700 box
  d.steps.slice(0, 5).forEach((st, i) => { const top = panelTop(st.title, st.body), h = 1240 - top;
    slides.push(stepHead(g, 'Step ' + (i + 1), st.title, st.body) + panel(top, h) + fit(st.draw || [], 60, top, 960, h)); });
  // rules: up to 4 lines with tick / cross
  { const r = d.rules, it = r.items.slice(0, 4), top = panelTop(r.title), h = 1240 - top, gap = (h - 60) / it.length;
    let o = stepHead(g, 'Rules', r.title) + panel(top, h);
    it.forEach((x, i) => { const y = top + 30 + gap * i + gap / 2; o += (x.ok ? D.tick({ x: 160, y, s: 0.8 }) : D.cross({ x: 160, y, s: 0.8 })) + lines(240, y - 8, [].concat(x.text).slice(0, 2), 42, { a: 'start', w: 600 }); });
    slides.push(o); }
  // level up: up to 3 twists + a tip
  { const l = d.levels, it = l.items.slice(0, 3), top = panelTop(l.title), h = 1240 - top, gap = (h - 160) / it.length;
    let o = stepHead(g, 'Level up', l.title) + panel(top, h);
    it.forEach((x, i) => { const y = top + 40 + gap * i + gap / 2; o += T(150, y + 30, String(i + 1), 90, { c: P.pink, w: 700 }) + lines(240, y, [].concat(x).slice(0, 2), 42, { a: 'start', w: 600 }); });
    if (l.tip) o += T(540, top + h - 50, 'Tip: ' + l.tip, 34, { c: P.mute });
    slides.push(o); }
  slides.push(signoff(g, d.comment_hint || 'kaun jeeta?'));
  return slides;
}
module.exports = { build };
if (require.main === module) { const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); console.log(build(d).length, 'slides'); }
