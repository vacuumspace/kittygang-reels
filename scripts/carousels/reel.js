// Turns the `reel` block of a Kitty Game Ideas draft (carousels/drafts/KGI-NNN.json) into a normal Kitty Gang reel
// draft (autopilot format) that scripts/autopilot/build.js voices and the AutoReel composition renders.
// - Board shots ({ kit: "board", show: "cover" | "need" | "step 2" | "rules" | "levels" | draw+title }) get the game's
//   own drawing from the draft, fitted to the whiteboard as `boardParts` (pieces that appear one by one) + `boardTitle`.
// - Any shot with `game` (one placement or a list of { box: [x, y, w, h], need: <index of a Kya chahiye item> |
//   show: "step 2" | "cover" | draw: [...] }) gets those game props (bell, cups, chits...) drawn into the scene at
//   that box, behind the characters (`gameSvg`). Use `need` items for scenes: real objects, no stick figures.
//   node scripts/carousels/reel.js carousels/drafts/KGI-038.json   -> writes autopilot/wip/KGI-038-reel.json, prints its path
const fs = require('fs');
const path = require('path');
const { fit, extent } = require('../../carousels/build');
const { T, lines, D, P, draw } = require('../../carousels/kit');

const ROOT = path.join(__dirname, '..', '..');
// whiteboard drawing area (see the board kit in src/autopilot/engine.js)
const BX = 90, BY = 545, BW = 900, BH = 620;

// like fit(), but each primitive stays a separate piece so the engine can reveal them in order
function fitParts(list, x, y, w, h, pad = 40, max = 1.8) {
  const e = extent(list); if (!e) return { transform: '', parts: [] };
  const s = Math.min(max, (w - pad * 2) / e.w, (h - pad * 2) / e.h);
  return { transform: 'translate(' + (x + (w - e.w * s) / 2 - e.x0 * s).toFixed(1) + ' ' + (y + (h - e.h * s) / 2 - e.y0 * s).toFixed(1) + ') scale(' + s.toFixed(3) + ')', parts: list.map((p) => draw([p])).filter(Boolean) };
}
const listFor = (d, show) => {
  const [what, nRaw] = String(show || 'cover').trim().split(/\s+/);
  if (what === 'cover') return d.cover_art || [];
  if (what === 'step') { const st = d.steps[Math.max(1, Number(nRaw) || 1) - 1]; if (!st) throw new Error('no step ' + nRaw); return st.draw || []; }
  throw new Error('game props: show must be cover or step N');
};

function board(d, show) {
  const [what, nRaw] = String(show || 'cover').trim().split(/\s+/);
  const n = Math.max(1, Number(nRaw) || 1);
  if (what === 'cover') return { title: d.game, ...fitParts(d.cover_art || [], BX, BY, BW, BH, 20, 1.6) };
  if (what === 'need') {
    const it = (d.need?.items || []).slice(0, 6), rows = it.length > 3 ? 2 : 1, cols = Math.min(3, it.length || 1), cw = BW / cols, ch = BH / rows;
    return { title: 'Kya chahiye', transform: '', parts: it.map((m, i) => { const cx = BX + cw * (i % cols) + cw / 2, cy = BY + ch * Math.floor(i / cols) + ch / 2 - 30;
      return fit(m.draw || [], cx - 130, cy - 120, 260, 190, 10, 1.6) + T(cx, cy + 115, m.label, 34); }) };
  }
  if (what === 'step') { const st = d.steps[n - 1]; if (!st) throw new Error('board: no step ' + n); return { title: 'Step ' + n + ': ' + st.title, ...fitParts(st.draw || [], BX, BY, BW, BH) }; }
  if (what === 'rules') {
    const it = (d.rules?.items || []).slice(0, 4), gap = BH / Math.max(1, it.length);
    return { title: d.rules.title, transform: '', parts: it.map((x, i) => { const y = BY + gap * i + gap / 2; return (x.ok ? D.tick({ x: BX + 80, y, s: 0.7 }) : D.cross({ x: BX + 80, y, s: 0.7 })) + lines(BX + 160, y - 8, [].concat(x.text).slice(0, 2), 38, { a: 'start', w: 600 }); }) };
  }
  if (what === 'levels') {
    const it = (d.levels?.items || []).slice(0, 3), gap = BH / Math.max(1, it.length);
    return { title: d.levels.title || 'Aur mazedaar banao', transform: '', parts: it.map((x, i) => { const y = BY + gap * i + gap / 2; return T(BX + 70, y + 30, String(i + 1), 84, { c: P.pink, w: 700 }) + lines(BX + 150, y, [].concat(x).slice(0, 2), 38, { a: 'start', w: 600 }); }) };
  }
  throw new Error('board: unknown show "' + show + '"');
}

function toReel(d) {
  const r = d.reel;
  if (!r || !Array.isArray(r.shots) || !r.shots.length) throw new Error('draft has no reel.shots');
  const shots = r.shots.map((s0) => {
    let s = { ...s0 };
    if (s.game) {
      // one placement or a list: { need: <index into need.items> | show: "step N" | draw: [...], box: [x, y, w, h] }
      s.gameSvg = [].concat(s.game).map((g) => {
        const [x, y, w, h] = g.box || [290, 1250, 500, 360];
        const list = g.draw || (g.need != null ? (d.need?.items?.[g.need]?.draw || []) : listFor(d, g.show));
        return fit(list, x, y, w, h, 0, 4);
      }).join('');
      delete s.game;
    }
    if (s.kit !== 'board') return s;
    const b = s.draw ? { title: s.title || '', ...fitParts(s.draw, BX, BY, BW, BH) } : board(d, s.show);
    const { show, draw: _d, title, ...rest } = s;
    return { ...rest, boardTitle: title || b.title, boardParts: { transform: b.transform, parts: b.parts } };
  });
  return {
    id: d.id + '-reel', title: r.title || d.game, format: 'Game idea explainer', idea: d.tagline, logline: r.logline,
    caption: d.caption, hashtags: d.hashtags, ambience: r.ambience || { name: 'crowd', vol: 0.07 }, pace: r.pace ?? 4,
    cover: r.cover, shots,
  };
}
module.exports = { toReel, board };

if (require.main === module) {
  const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const out = path.join(ROOT, 'autopilot', 'wip', d.id + '-reel.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(toReel(d), null, 1));
  console.log(path.relative(ROOT, out));
}
