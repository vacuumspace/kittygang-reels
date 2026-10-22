// Kitty Gang autopilot engine: turns a timed reel spec into one SVG frame at time t.
// Spec (after scripts/autopilot/build.js has voiced it):
//   { total, lines:[{id, who, text, start, dur, env}], shots:[{start, end, kit, ...}] }
// Kits: scene (dressed set from sets.js, the default for story shots), hook, solo, duo, room, phone, camera, map, door, card.
// scene shot: { kit:'scene', set:'living'|'entrance'|'camera', banner, night, front, flash, focus:[x,y],
//   chars:[{ name, look, x, y, s, from:[x,y], moveAt, moveDur, twirl, ...face/pose }] }
// Common shot fields: hook:[l1,l2] text banner, chip:"text", stickers:[{kind, x, y, at}],
//   props:[{name, x, y, s}], clock:{h, m}, camera:"push"|"punch"|"still", night/sunrise (door).
import * as K from '../kg/kgkit';
import { SETS, FRONTS, WARDROBE, cameraUI, propSvg, put } from './sets';

const { stage, spark, sweat, clock, bubble, icon, BG, DOT } = K;
// new cast names drawn with an existing look (Tina wears Tash's face and build)
const ALIAS = { Tina: 'Tash' };
DOT.Tina = DOT.Tash;
const who = (n, ...a) => K.who(ALIAS[n] || n, ...a);
const PLUM = '#3A0B30', PINK = '#E85D8A', YEL = '#FFD166', BLUSH = '#FFE4EC';
const f1 = (n) => n.toFixed(1), f2 = (n) => n.toFixed(2);
const sat = (u) => Math.max(0, Math.min(1, u));
const ease = (u) => { u = sat(u); return u * u * (3 - 2 * u); };
const back = (u) => { u = sat(u); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- characters: lip sync, blink, breathing ----------
function speakingLine(spec, name, t) {
  return spec.lines.find((l) => (l.who === name || (l.who === 'ALL' && name !== l.except)) && t >= l.start && t <= l.start + l.dur);
}
function face(spec, name, t, o, i) {
  const l = speakingLine(spec, name, t);
  let mouth = o.mouth || 'smile', eyes = o.eyes || 'open';
  if (l) { const k = Math.floor((t - l.start) * 30); const v = l.env[k] ?? 0; mouth = v > 0.5 ? 'laugh' : v > 0.14 ? 'o' : (o.mouth === 'flat' ? 'flat' : 'smile'); }
  if (((t + i * 0.83) % 3.4) < 0.11 && eyes === 'open') eyes = 'laugh';
  return { mouth, eyes, talking: !!l };
}
// one character placed with feet at (x, y), scale s; breathes and tilts while talking
function char(spec, c, x, y, s, t, i, sh) {
  const { name, look, from, moveAt, moveDur, twirl, ...o0 } = c;
  const o = { ...(WARDROBE[look] || {}), ...o0 };
  const lt = sh ? t - sh.start : t;
  let walking = false;
  if (from) { const u = ease((lt - (moveAt || 0)) / (moveDur || 0.8)); walking = u > 0 && u < 1; x = from[0] + (x - from[0]) * u; y = from[1] + (y - from[1]) * u; }
  const step = walking ? 14 * Math.abs(Math.sin(lt * 14)) : 0;
  const sx = twirl ? Math.cos(Math.PI * 2 * sat(lt / 0.9)) : 1;
  const fc = face(spec, name, t, o, i);
  const tilt = fc.talking ? 1.6 * Math.sin(t * 5.3 + i) : 0;
  const br = 1 + 0.01 * Math.sin(t * 2.4 + i);
  const hop = c.hop ? 30 * Math.abs(Math.sin(t * 6)) : 0;
  const extra = ' translate(120 384) rotate(' + f2(tilt) + ') scale(' + f2(sx) + ' ' + f2(br) + ') translate(-120 -384)';
  return who(name, x, y - (hop + step) * s, s, { pose: 'relaxed', ...o, mouth: fc.mouth, eyes: fc.eyes }, extra);
}

// ---------- pieces ----------
function caption(text, t0, t) {
  const words = String(text).split(' '); const lines = ['']; for (const w of words) { if ((lines[lines.length - 1] + ' ' + w).trim().length > 30) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); }
  const s = back((t - t0) / 0.22), h = 70 + lines.length * 56, w = Math.min(1000, Math.max(...lines.map((l) => l.length)) * 25 + 100);
  return '<g transform="translate(540 ' + (230 + (lines.length - 1) * 28) + ') scale(' + f2(s) + ')"><rect x="' + -w / 2 + '" y="' + -h / 2 + '" width="' + w + '" height="' + h + '" rx="' + Math.min(52, h / 2) + '" fill="#FFFFFF" opacity="0.96"></rect>'
    + lines.map((l, i) => '<text x="0" y="' + f1(-h / 2 + 62 + i * 56) + '" text-anchor="middle" font-family="Fredoka" font-weight="500" font-size="46" fill="' + PLUM + '">' + esc(l) + '</text>').join('') + '</g>';
}
function hookBanner(lines, t0, t, y = 520) {
  return lines.map((tx, i) => { const s = back((t - t0 - i * 0.15) / 0.3); const size = tx.length > 18 ? 70 : 88, w = tx.length * size * 0.53 + 80; return '<g transform="translate(540 ' + (y + i * size * 1.3) + ') scale(' + f2(s) + ') rotate(' + (i % 2 ? 2 : -2) + ')"><rect x="' + f1(-w / 2) + '" y="' + f1(-size * 0.95) + '" width="' + f1(w) + '" height="' + f1(size * 1.25) + '" rx="22" fill="' + (i === lines.length - 1 ? PINK : PLUM) + '"></rect><text x="0" y="' + f1(size * 0.12) + '" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="' + size + '" fill="#FFFFFF">' + esc(tx) + '</text></g>'; }).join('');
}
function chip(tx, t0, t, y = 560) {
  const s = back((t - t0) / 0.25), w = tx.length * 30 + 80;
  return '<g transform="translate(540 ' + y + ') scale(' + f2(s) + ')"><rect x="' + -w / 2 + '" y="-48" width="' + w + '" height="80" rx="40" fill="' + PINK + '"></rect><text x="0" y="8" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="52" fill="#FFFFFF">' + esc(tx) + '</text></g>';
}
const STICK = {
  sweat: (s) => sweat(0, 0, s * 1.8),
  spark: (s) => spark(0, 0, 50 * s, YEL) + spark(70 * s, -50 * s, 26 * s, '#FFFFFF'),
  question: (s) => '<text x="0" y="0" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="' + 200 * s + '" fill="' + PINK + '">?</text>',
  exclaim: (s) => '<text x="0" y="0" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="' + 200 * s + '" fill="#E63946">!</text>',
  heart: (s) => '<path transform="scale(' + s + ')" d="M0 60 C-60 20 -70 -30 -35 -45 C-15 -55 0 -40 0 -25 C0 -40 15 -55 35 -45 C70 -30 60 20 0 60 Z" fill="' + PINK + '"></path>',
  bulb: (s) => '<g transform="scale(' + s + ')"><circle r="46" fill="' + YEL + '"></circle><rect x="-20" y="40" width="40" height="30" rx="8" fill="#9A8FA6"></rect></g>',
  bolt: (s) => put('Lightning', 0, 60 * s, 160 * s),
  car: (s) => icon.car(0, 0, s), plane: (s) => icon.plane(0, 0, s), palace: (s) => icon.palace(0, 0, s), home: (s) => icon.home(0, 0, s),
};
function sticker(st, shotStart, t) {
  const t0 = shotStart + (st.at || 0.3); if (t < t0) return '';
  const k = back((t - t0) / 0.3), bob = 6 * Math.sin((t - t0) * 3);
  const draw = STICK[st.kind] ? STICK[st.kind](st.s || 1) : '';
  return '<g transform="translate(' + (st.x ?? 820) + ' ' + f1((st.y ?? 520) + bob) + ') scale(' + f2(k) + ')">' + draw + '</g>';
}
function propAt(p, sh, t) {
  if (p.at != null && t < sh.start + p.at) return '';
  const svg = propSvg(p.name); if (!svg) return '';
  const s = p.s || 2, k = p.at != null ? back((t - sh.start - p.at) / 0.3) : 1;
  return '<g transform="translate(' + f1(p.x) + ' ' + f1(p.y) + ') scale(' + f2(k) + ') rotate(' + (p.rot || 0) + ') translate(' + f1(-60 * s) + ' ' + f1(-108 * s) + ') scale(' + s + ')">' + svg + '</g>';
}

// ---------- kits ----------
const sofa = '<rect x="30" y="1080" width="1020" height="330" rx="110" fill="' + PINK + '"></rect>';
const sofaFront = '<rect x="10" y="1380" width="1060" height="190" rx="70" fill="#D9487A"></rect>';
function roomBg() { return K.stage(null).replace(/fill="#FFE4EC"/, 'fill="' + BLUSH + '"'); }
const KITS = {
  scene(spec, sh, t) {
    const people = (sh.chars || []).map((c, i) => char(spec, c, c.x ?? 540, c.y ?? 1760, c.s ?? 2, t, i, sh)).join('');
    if (sh.set === 'camera') { const flash = sh.flash && t - sh.start > 0.6 && t - sh.start < 0.9; return cameraUI(SETS.living({ banner: sh.banner }) + people, { flash, focus: sh.focus }); }
    return (SETS[sh.set] || SETS.living)({ banner: sh.banner, night: sh.night }) + people;
  },
  hook(spec, sh, t) { const c = sh.char; return (c ? stage(c.name) + char(spec, c, 540, 1760, 2.6, t, 0, sh) : stage(null)); },
  solo(spec, sh, t) { const c = sh.char; return stage(c.name) + '<ellipse cx="540" cy="1695" rx="300" ry="34" fill="' + PLUM + '" opacity="0.08"></ellipse>' + char(spec, c, 540, 1700, 3.0, t, 0, sh); },
  duo(spec, sh, t) {
    const [a, b] = sh.chars;
    return '<rect width="540" height="1920" fill="' + BG[a.name][0] + '"></rect><rect x="540" width="540" height="1920" fill="' + BG[b.name][0] + '"></rect><rect x="532" width="16" height="1920" fill="#FFFFFF"></rect>'
      + char(spec, { turn: 0.6, ...a }, 280, 1650, 2.05, t, 0, sh) + char(spec, { turn: -0.6, ...b }, 800, 1650, 2.05, t, 1, sh);
  },
  room(spec, sh, t) {
    const cs = sh.chars || []; const n = cs.length; const xs = n === 1 ? [540] : n === 2 ? [340, 740] : n === 3 ? [230, 540, 850] : [180, 410, 670, 900];
    const s = n <= 2 ? 2.2 : n === 3 ? 1.9 : 1.6;
    return roomBg() + sofa + cs.map((c, i) => char(spec, c, xs[i], 1520, s, t, i, sh)).join('') + sofaFront;
  },
  phone(spec, sh, t) {
    const shown = (sh.chat || []).filter((m, i) => t >= sh.start + (m[4] ?? i * 0.9));
    let o = K.phone(shown.map((m) => m.slice(0, 4)), sh.title || 'Kitty Gang');
    // phone held over the real room, never a bare colour card
    if (sh.set) o = '<g opacity="0.55">' + (SETS[sh.set] || SETS.living)({ banner: sh.banner }) + '</g>' + o.replace(/^<rect width="1080" height="1920" fill="[^"]*"><\/rect>/, '');
    if (sh.typing) o += '<text x="540" y="1640" text-anchor="middle" font-family="Fredoka" font-size="40" fill="#9A7A8E">' + esc(sh.typing) + ' is typing' + '.'.repeat(1 + (Math.floor(t * 3) % 3)) + '</text>';
    return o;
  },
  camera(spec, sh, t) {
    const cs = sh.chars || [];
    const inner = sh.front ? who(cs[0].name, 540, 2150, 3.8, { pose: 'phone2', ...cs[0], ...face(spec, cs[0].name, t, cs[0], 0) })
      : roomBg() + sofa + cs.map((c, i) => char(spec, c, 190 + i * 233 + (4 - cs.length) * 116, 1600, 2.05, t, i, sh)).join('');
    const flash = sh.flash && t - sh.start > 0.6 && t - sh.start < 0.9;
    return '<rect width="1080" height="1920" fill="#0D0B10"></rect><clipPath id="vf"><rect x="40" y="260" width="1000" height="1300" rx="30"></rect></clipPath><g clip-path="url(#vf)">' + inner + (flash ? '<rect x="40" y="260" width="1000" height="1300" fill="#FFFFFF" opacity="0.7"></rect>' : '') + '</g>'
      + '<text x="90" y="196" font-family="Fredoka" font-weight="600" font-size="38" fill="#FFFFFF">HDR</text><text x="990" y="196" text-anchor="end" font-family="Fredoka" font-weight="600" font-size="38" fill="#FFFFFF">3s</text>'
      + '<text x="540" y="1630" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="34" fill="#8A8590">VIDEO      <tspan fill="' + YEL + '">PHOTO</tspan>      PORTRAIT</text>'
      + '<rect x="110" y="1700" width="120" height="120" rx="24" fill="#F7A8C6"></rect><rect x="440" y="1660" width="200" height="200" rx="100" fill="none" stroke="#FFFFFF" stroke-width="12"></rect><rect x="465" y="1685" width="150" height="150" rx="75" fill="#FFFFFF"></rect>'
      + '<rect x="850" y="1700" width="120" height="120" rx="60" fill="' + (sh.front ? YEL : '#333') + '"></rect>'
      + (sh.attempt ? '<rect x="340" y="290" width="400" height="70" rx="35" fill="rgba(0,0,0,.55)"></rect><text x="540" y="338" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="38" fill="#FFFFFF">' + esc((sh.label || 'Group photo') + ' · attempt ' + sh.attempt) + '</text>' : '');
  },
  map(spec, sh, t) {
    const [fx, fy] = sh.from || [260, 600], [tx, ty] = sh.to || sh.from || [260, 600];
    const u = ease((t - sh.start) / Math.max(0.5, sh.end - sh.start - 0.3));
    const x = fx + (tx - fx) * u, y = fy + (ty - fy) * u;
    const trail = '<path d="M' + fx + ' ' + fy + ' L' + f1(x) + ' ' + f1(y) + '" stroke="#F2B233" stroke-width="14" stroke-dasharray="20 18" fill="none"></path>';
    return K.map(x, y, trail);
  },
  door(spec, sh, t) {
    const cs = sh.chars || []; const xs = [330, 560, 790];
    return K.doorScene(cs.map((c, i) => char(spec, c, xs[i], c.at === 'door' ? 1450 : 1700, 1.5, t, i, sh)).join(''), !!sh.night, !!sh.sunrise);
  },
  card(spec, sh, t) { return '<rect width="1080" height="1920" fill="' + (sh.bg || BLUSH) + '"></rect>'; },
};

// ---------- frame ----------
export function frameAt(spec, t) {
  const sh = t < spec.shots[0].start ? spec.shots[0] : spec.shots.find((s) => t >= s.start && t < s.end) || spec.shots[spec.shots.length - 1];
  const u = t - sh.start, len = sh.end - sh.start;
  let body = (KITS[sh.kit] || KITS.card)(spec, sh, t);
  body += (sh.props || []).map((p) => propAt(p, sh, t)).join('');
  if (sh.kit === 'scene' && sh.front && FRONTS[sh.set]) body += FRONTS[sh.set]();
  if (sh.clock) body += clock(900, 300, 80, sh.clock.h, sh.clock.m || 0);
  body += (sh.stickers || []).map((st) => sticker(st, sh.start, t)).join('');
  // camera: settle-in on every cut, slow push, punch on the line marked punch
  let z = 1 + 0.035 * (1 - ease(u / 0.3));
  if (sh.camera !== 'still') z += 0.05 * ease(u / Math.max(1, len));
  let shake = '';
  const pl = spec.lines.find((l) => l.punch && t >= l.start && t < l.start + 0.6);
  if (pl) { const p = t - pl.start; z += 0.08 * Math.exp(-p * 6); shake = ' translate(' + f1(10 * Math.exp(-p * 8) * Math.sin(p * 70)) + ' ' + f1(8 * Math.exp(-p * 8) * Math.cos(p * 60)) + ')'; }
  let o = '<g transform="translate(540 1000) scale(' + z.toFixed(4) + ') translate(-540 -1000)' + shake + '">' + body + '</g>';
  if (sh.hook) o += hookBanner(sh.hook, sh.start, t, sh.hookY || 520);
  if (sh.chip) o += chip(sh.chip, sh.start + 0.2, t, sh.chipY || 560);
  if (sh.kit !== 'phone') { const l = spec.lines.find((x) => t >= x.start - 0.05 && t <= x.start + x.dur + 0.2); if (l && !sh.hook) o += caption(l.text, l.start - 0.05, t); }
  // no fade-in: frame 1 must be the real scene (it is what Instagram shows before a cover is set)
  const fadeOut = sat((t - (spec.total - 0.5)) / 0.5);
  if (fadeOut > 0) o += '<rect width="1080" height="1920" fill="#FFF4F7" opacity="' + f2(fadeOut) + '"></rect>';
  return o;
}

// Cover: the strongest frame of the reel (draft "cover": { shot: index, at: seconds into that shot, title: [line1, line2] })
// with a bold title kept inside the 3:4 grid crop (y 240-1680).
export function coverFrame(spec) {
  const c = spec.cover || {};
  const sh = spec.shots[c.shot ?? Math.floor(spec.shots.length / 2)];
  const t = sh.start + (c.at ?? Math.min(1.2, (sh.end - sh.start) * 0.7));
  let o = frameAt({ ...spec, lines: [] }, t);
  // title: one size for every line, each on its own tilted pill, well spaced
  const size = 66, gap = 150;
  (c.title || []).forEach((tx, i) => { const w = tx.length * size * 0.54 + 90; o += '<g transform="translate(540 ' + ((c.titleY || 360) + i * gap) + ') rotate(' + (i % 2 ? 2 : -2) + ')"><rect x="' + f1(-w / 2) + '" y="' + f1(-size * 0.95) + '" width="' + f1(w) + '" height="' + f1(size * 1.3) + '" rx="24" fill="' + (i === c.title.length - 1 ? PINK : PLUM) + '"></rect><text x="0" y="' + f1(size * 0.14) + '" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="' + size + '" fill="#FFFFFF">' + esc(tx) + '</text></g>'; });
  return o;
}
