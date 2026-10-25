// Theme Housie reel ("POV: game night"): one SVG frame at time t, built from a theme pack.
// spec: { theme: {id, name, manifest}, art: {file: svgString}, avatars: [svgString], day, times: [..],
//         numbers: { first, second, last }, total }
// The game screen is drawn in app units (390 x 844) and placed in a phone or filled to the frame by a camera.
const W = 1080, H = 1920, PW = 390, PH = 844, S = W / PW;
const f1 = (n) => (+n).toFixed(1), f3 = (n) => (+n).toFixed(3);
const sat = (u) => Math.max(0, Math.min(1, u));
const ease = (u) => { u = sat(u); return u * u * (3 - 2 * u); };
const back = (u) => { u = sat(u); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const lerp = (a, b, u) => a + (b - a) * u;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- timeline (seconds) ----------
export const TL = { hook: 2.2, dive: 4.4, call1: 5.6, pan: 8.6, react: 11.6, tense: 14, full: 16.6, end: 19.6, app: 22.6, total: 26.4 };

let uid = 0;
const cache = {};
function inline(spec, file, x, y, w, h, extra = '', stretch = false) {
  const src = spec.art[file]; if (!src) return '';
  let c = cache[file];
  if (!c) { const vb = (src.match(/viewBox="([^"]+)"/) || [])[1] || ('0 0 ' + ((src.match(/width="([\d.]+)"/) || [0, 100])[1]) + ' ' + ((src.match(/height="([\d.]+)"/) || [0, 100])[1])); c = cache[file] = { vb, inner: src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') }; }
  const p = 'k' + (uid++) + '_';
  const inner = c.inner.replace(/id="([^"]+)"/g, 'id="' + p + '$1"').replace(/url\(#([^)]+)\)/g, 'url(#' + p + '$1)').replace(/href="#([^"]+)"/g, 'href="#' + p + '$1"');
  return '<svg x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" viewBox="' + c.vb + '" preserveAspectRatio="' + (stretch ? 'none' : 'xMidYMid meet') + '"' + extra + '>' + inner + '</svg>';
}
const raw = (svg, x, y, w, h) => { const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 100 100'; return '<svg x="' + f1(x) + '" y="' + f1(y) + '" width="' + w + '" height="' + h + '" viewBox="' + vb + '">' + svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + '</svg>'; };
const T = (x, y, t, size, fill, o = {}) => '<text x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + (o.a || 'middle') + '" font-family="Fredoka" font-weight="' + (o.w || 700) + '" font-size="' + f1(size) + '" fill="' + fill + '"' + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + o.sw + '" paint-order="stroke" stroke-linejoin="round"' : '') + (o.op != null ? ' opacity="' + f3(o.op) + '"' : '') + '>' + esc(t) + '</text>';

// layer with the app's own motion (wave = drifts across, bob = floats, sway = rocks)
function layer(spec, l, t, X = 0, Y = 0, k = 1) {
  let [x, y, w, h] = l.box; let tr = '';
  const ph = l.period ? ((t + (l.delay || 0)) / l.period) : 0;
  if (l.motion === 'wave') x = x - ((ph % 1) * (l.amount || 560));
  if (l.motion === 'bob') tr = ' transform="translate(0 ' + f1(Math.sin(ph * 2 * Math.PI) * (l.amount || 6)) + ')"';
  if (l.motion === 'sway') { const px = x + w * (l.pivot ? l.pivot[0] : 0.5), py = y + h * (l.pivot ? l.pivot[1] : 0.5); tr = ' transform="rotate(' + f1(Math.sin(ph * 2 * Math.PI) * (l.amount || 5)) + ' ' + f1(px) + ' ' + f1(py) + ')"'; }
  return '<g' + tr + '>' + inline(spec, l.art, X + x * k, Y + y * k, w * k, h * k, '', true) + '</g>';
}
// drifting particles (rise / fall / twinkle) in a w x h area
function particles(spec, list, t, w, h, X = 0, Y = 0, k = 1) {
  let o = '';
  (list || []).forEach((p, pi) => { for (let i = 0; i < p.count; i++) {
    const seed = (i * 7919 + pi * 104729) % 1000 / 1000, per = p.period[0] + seed * (p.period[1] - p.period[0]), u = ((t / per) + seed) % 1, sz = p.size[0] + seed * (p.size[1] - p.size[0]);
    let x = (seed * 997 % 1) * w, y;
    if (p.kind === 'rise') y = h * (1 - u); else if (p.kind === 'fall') y = h * u; else { const a = p.area || [0, 0, 1, 1]; x = (a[0] + (seed * 613 % 1) * (a[2] - a[0])) * w; y = (a[1] + (seed * 331 % 1) * (a[3] - a[1])) * h; }
    x += Math.sin((t + seed * 9) * 1.3) * (p.sway || 0);
    const op = p.kind === 'twinkle' ? (0.3 + 0.7 * Math.abs(Math.sin((t / per + seed) * Math.PI))) * (p.opacity || 1) : (p.opacity || 1);
    o += '<g opacity="' + f3(op) + '"' + (p.spin ? ' transform="rotate(' + f1(u * 360) + ' ' + f1(X + x * k) + ' ' + f1(Y + y * k) + ')"' : '') + '>' + inline(spec, p.art[i % p.art.length], X + (x - sz / 2) * k, Y + (y - sz / 2) * k, sz * k, sz * k) + '</g>';
  } });
  return o;
}

// ---------- the game screen in app units ----------
function screen(spec, t, st) {
  const M = spec.theme.manifest, C = M.colors, TK = M.ticket;
  const { called = [], ball = '', ballAt = 0, marked = [], markAt = {}, reacts = [], full = false, joined = 5, spin = false } = st;
  let o = '<rect width="' + PW + '" height="' + PH + '" fill="' + C.gameGradient[1] + '"></rect>';
  o += (M.groundHousie.layers || []).map((l) => layer(spec, l, t)).join('') + particles(spec, M.groundHousie.particles, t, PW, PH) + particles(spec, M.fx.particles, t, PW, PH);
  o += '<path d="M24 58 l18 18 M42 58 l-18 18" stroke="' + C.gameInk + '" stroke-width="3.5" stroke-linecap="round"></path>';
  called.slice(0, 4).forEach((n, i) => { const x = 112 + i * 41; o += '<circle cx="' + x + '" cy="68" r="17" fill="' + (i ? '#FFFFFF' : C.dial) + '"></circle>' + T(x, 74, n, 15, C.boxInk); });
  o += '<rect x="298" y="50" width="76" height="36" rx="18" fill="#FFFFFF"></rect><circle cx="318" cy="68" r="10" fill="' + C.accent + '"></circle>' + T(352, 74, '40', 16, C.boxInk);
  // mascot ball: pops in when a number is drawn, spins while waiting
  const [dx, dy, r] = M.scene.disc, size = 150, bx = 195 - size / 2, by = 118;
  const pop = ballAt ? back((t - ballAt) / 0.35) : 1, rot = spin ? Math.sin(t * 9) * 8 : 0;
  o += '<g transform="translate(195 193) scale(' + f3(0.85 + 0.15 * pop) + ') rotate(' + f1(rot) + ') translate(-195 -193)">' + M.scene.layers.map((l) => layer(spec, { ...l, box: [0, 0, 170, 170] }, t, bx, by, size / 170)).join('');
  if (ball !== '') o += '<g transform="translate(' + f1(bx + dx * size / 170) + ' ' + f1(by + dy * size / 170) + ') scale(' + f3(pop) + ')">' + T(0, r * size / 170 * 0.36, ball, r * size / 170 * 1.05, C.boxInk) + '</g>';
  o += '</g><circle cx="48" cy="160" r="26" fill="#FFFFFF" opacity="0.25"></circle>' + T(48, 210, (called.length ? 30 + called.length * 3 : 0) + '/90', 13, C.gameInk) + '<circle cx="342" cy="160" r="26" fill="#FFFFFF" opacity="0.25"></circle>' + T(342, 210, 'next', 13, C.gameInk);
  // players: appear one by one, reactions float up from them
  ['Sunita', 'Meera', 'Anjali', 'Kavya', 'You'].forEach((nm, i) => { const x = 50 + i * 72, on = i < joined;
    if (!on) { o += '<circle cx="' + x + '" cy="282" r="24" fill="#FFFFFF" opacity="0.2"></circle>'; return; }
    o += '<circle cx="' + x + '" cy="282" r="24" fill="#FFF4F8"></circle>' + (spec.avatars[i] ? raw(spec.avatars[i], x - 22, 260, 44, 44) : '') + T(x, 324, nm, 12, C.gameInk) + T(x, 340, (9 - i) + '/15', 10, C.gameInk, { w: 500, op: 0.8 }); });
  reacts.forEach(([rk, i, at]) => { const r0 = M.reactions[rk]; const u = (t - at) / 1.6; if (!r0 || u < 0 || u > 1) return; o += '<g opacity="' + f3(1 - u * u) + '">' + inline(spec, r0.art, 50 + i * 72 - 20, 236 - u * 120, 40, 40) + '</g>'; });
  // ticket
  o += '<rect x="16" y="364" width="358" height="330" rx="22" fill="' + TK.frame + '"></rect><rect x="22" y="370" width="346" height="318" rx="18" fill="' + TK.card + '"></rect>';
  const tx = 28, ty = 380; o += inline(spec, M.ticketLayout.art, tx, ty, 334, 300, '', true);
  M.ticketLayout.groups.forEach((g, gi) => g.slots.forEach(([sx, sy], i) => { const n = (spec.ticket[gi] || [])[i]; if (n == null) return; const on = marked.includes(n), k = on && markAt[n] ? back((t - markAt[n]) / 0.3) : 1;
    o += '<rect x="' + (tx + sx - 21) + '" y="' + (ty + sy - 21) + '" width="42" height="42" rx="10" fill="' + TK.open + '" stroke="' + C.markEdge + '" stroke-width="2"></rect>';
    if (on) o += '<g transform="translate(' + (tx + sx) + ' ' + (ty + sy) + ') scale(' + f3(k) + ')"><rect x="-21" y="-21" width="42" height="42" rx="10" fill="' + TK.mark + '"></rect></g>';
    o += T(tx + sx, ty + sy + 7, n, 19, on && k > 0.6 ? TK.markInk : TK.ink); }));
  M.ticketLayout.groups.forEach((g) => { const w = g.name.length * 8 + 22; o += '<rect x="' + (tx + g.label.x - w / 2) + '" y="' + (ty + g.label.y - 13) + '" width="' + w + '" height="20" rx="10" fill="#FFE58A"></rect>' + T(tx + g.label.x, ty + g.label.y + 2, g.name, 11, C.boxInk, { w: 600 }); });
  M.ticketLayout.groups.slice(0, 3).forEach((g, i) => { const x = 16 + i * 122; o += '<rect x="' + x + '" y="712" width="112" height="44" rx="12" fill="#FFFFFF"></rect>' + T(x + 56, 731, g.name, 11, C.boxInk) + T(x + 56, 748, g.points + ' pts', 10, C.accent, { w: 600 }); });
  Object.values(M.reactions).forEach((r0, i) => { o += '<circle cx="' + (50 + i * 72) + '" cy="800" r="26" fill="#FFFFFF" opacity="0.18"></circle>' + inline(spec, r0.art, 50 + i * 72 - 20, 780, 40, 40); });
  if (full) { const u = t - full; for (let i = 0; i < 46; i++) { const x = (i * 53) % 390, y = ((i * 89) % 300) - 60 + u * (120 + (i % 5) * 30); o += '<rect x="' + x + '" y="' + f1(y % 860) + '" width="9" height="5" rx="2" fill="' + C.confetti[i % C.confetti.length] + '" transform="rotate(' + f1((i * 37 + u * 200) % 360) + ' ' + x + ' ' + f1(y % 860) + ')"></rect>'; } }
  return o;
}

// ---------- frame-level pieces ----------
function homeBg(spec, t) {
  const M = spec.theme.manifest; const DY = -(PH * S - H) / 2;
  return '<rect width="1080" height="1920" fill="' + M.colors.gameGradient[1] + '"></rect><g transform="translate(0 ' + f1(DY) + ') scale(' + f3(S) + ')">' + (M.ground.layers || []).map((l) => layer(spec, l, t)).join('') + particles(spec, M.ground.particles, t, PW, PH) + particles(spec, M.fx.particles, t, PW, PH) + (M.overlay.layers || []).map((l) => layer(spec, l, t)).join('') + '</g>';
}
const pill = (spec, y, txt, size, bg, fg, rot, at, t) => { const k = back((t - at) / 0.35); if (k <= 0.01) return ''; const w = txt.length * size * 0.56 + 90; return '<g transform="translate(540 ' + y + ') rotate(' + rot + ') scale(' + f3(k) + ')"><rect x="' + f1(-w / 2) + '" y="' + f1(-size) + '" width="' + f1(w) + '" height="' + f1(size * 1.36) + '" rx="' + f1(size * 0.4) + '" fill="' + bg + '"></rect>' + T(0, size * 0.12, txt, size, fg) + '</g>'; };
function timeChips(spec, y, size, at, t) {
  const C = spec.theme.manifest.colors, per = Math.min(3, spec.times.length);
  return spec.times.map((tm, i) => { const row = Math.floor(i / per), col = i % per, n = Math.min(per, spec.times.length - row * per), w = 290, x = 540 + (col - (n - 1) / 2) * (w + 24), k = back((t - at - i * 0.08) / 0.3); if (k <= 0.01) return '';
    return '<g transform="translate(' + f1(x) + ' ' + (y + row * 120) + ') scale(' + f3(k) + ')"><rect x="' + (-w / 2) + '" y="' + (-size) + '" width="' + w + '" height="' + size * 1.6 + '" rx="' + size * 0.8 + '" fill="#FFFFFF"></rect>' + T(0, size * 0.22, tm, size, C.accentDeep) + '</g>'; }).join('');
}
const mascot = (spec, x, y, size, t) => spec.theme.manifest.scene.layers.map((l) => layer(spec, { ...l, box: [0, 0, 170, 170] }, t, x, y, size / 170)).join('');
const caption = (spec, y, txt, at, t) => { const k = back((t - at) / 0.25); if (k <= 0.01) return ''; const w = Math.min(1000, txt.length * 27 + 110); return '<g transform="translate(540 ' + y + ') scale(' + f3(k) + ')"><rect x="' + (-w / 2) + '" y="-60" width="' + w + '" height="100" rx="50" fill="#FFFFFF" opacity="0.96"></rect>' + T(0, 6, txt, 48, spec.theme.manifest.colors.boxInk, { w: 600 }) + '</g>'; };
const band = (spec, op = 0.55) => '<rect x="0" y="1700" width="1080" height="220" fill="' + spec.theme.manifest.colors.accentDeep + '" opacity="' + op + '"></rect>';
// camera: screen centre (cx, cy) in app units, zoom z (1 = screen width fills the frame)
const camT = (cx, cy, z) => { const s = S * z; return [540 - cx * s, 960 - cy * s, s]; };
const view = (spec, t, st, [x, y, s]) => '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + f3(s) + ')">' + screen(spec, t, st) + '</g>';

export function frameAt(spec, t) {
  uid = 0;
  const L = spec.tl || TL;
  if (t < L.hook) return coverFrame(spec, t);
  if (spec.story === 'guess') return guessFrame(spec, t, L);
  if (spec.story === 'race') return raceFrame(spec, t, L);
  const M = spec.theme.manifest, C = M.colors, N = spec.numbers, X = spec.copy || {};
  const ink = C.boxInk, deep = C.accentDeep;
  const g0 = M.ticketLayout.groups[0].name, seq = N.seq, all = spec.ticket.flat(), rk = Object.keys(M.reactions);
  const say = (s) => String(s).replace('{group}', g0).replace('{n}', N.last).replace('{theme}', M.name);
  // cover / opening
  // hook: phone rises, friends join
  if (t < L.dive) { const u = ease((t - L.hook) / 0.6), py = lerp(1900, 560, u), joined = Math.max(0, Math.min(5, Math.floor((t - L.hook - 0.5) / 0.28)));
    return homeBg(spec, t) + pill(spec, 300, X.hook || 'POV: kitty group online', 66, '#FFE58A', ink, -2, L.hook + 0.1, t) + pill(spec, 440, say(X.hook2 || 'aaj ki theme: {theme}'), 50, '#FFFFFF', deep, 1, L.hook + 0.3, t)
      + '<rect x="258" y="' + f1(py - 12) + '" width="564" height="' + f1(540 * PH / PW + 24) + '" rx="54" fill="#2A0E22"></rect><clipPath id="phc"><rect x="270" y="' + f1(py) + '" width="540" height="' + f1(540 * PH / PW) + '" rx="44"></rect></clipPath><g clip-path="url(#phc)">' + view(spec, t, { joined }, [270, py, 540 / PW]) + '</g>'; }
  // dive into the phone
  if (t < L.call1) { const u = ease((t - L.dive) / 0.9), a = [270, 560, 540 / PW], b = camT(195, 300, 1.15), tr = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    return homeBg(spec, t) + '<g opacity="' + f3(1 - u) + '"><rect x="' + f1(tr[0] - 12) + '" y="' + f1(tr[1] - 12) + '" width="' + f1(PW * tr[2] + 24) + '" height="' + f1(PH * tr[2] + 24) + '" rx="' + f1(46 * tr[2]) + '" fill="#2A0E22"></rect></g>' + view(spec, t, { joined: 5, spin: true }, tr) + (t > L.dive + 0.5 ? band(spec) + pill(spec, 1840, X.start || 'Game shuru!', 90, '#FFE58A', ink, -3, L.dive + 0.5, t) : ''); }
  // first number: ball pops, dab
  const a1 = L.call1 + 0.4, d1 = L.call1 + 1.4;
  if (t < L.pan) return view(spec, t, { called: [N.first, 86, 60, 8], ball: N.first, ballAt: a1, marked: t > d1 ? [N.first] : [], markAt: { [N.first]: d1 } }, camT(195, 330, 1.05)) + caption(spec, 1780, 'Number ' + N.first + '!', a1 + 0.2, t);
  // camera pans to the ticket; quick calls fill the first prize group except one number
  if (t < L.react) { const u = ease((t - L.pan) / 0.8), c = camT(195, lerp(330, 520, u), lerp(1.05, 1.35, u)), a2 = L.pan + 0.3;
    const marks = [N.first]; const markAt = { [N.first]: 0 }; seq.slice(1).forEach((n, i) => { const at = L.pan + 1.0 + i * Math.min(0.65, 1.5 / Math.max(1, seq.length - 1)); if (t > at) { marks.push(n); markAt[n] = at; } });
    return view(spec, t, { called: [N.second, N.first, 86, 60], ball: N.second, ballAt: a2, marked: marks, markAt }, c) + caption(spec, 170, say(X.almostGroup || '{group}: bas ek aur!'), L.pan + 2.4, t); }
  // reactions fly from the players
  const done = seq.concat([N.react]);
  if (t < L.tense) { const u = ease((t - L.react) / 0.6), c = camT(195, lerp(520, 300, u), lerp(1.35, 1.1, u)), R = L.react;
    let o = view(spec, t, { called: [N.react, N.second, N.first, 86], ball: N.react, ballAt: R + 0.1, marked: done, markAt: { [N.react]: R + 0.5 }, reacts: [0, 1, 2, 3, 4].map((i) => [rk[(i * 2) % rk.length], i, R + 0.6 + i * 0.2]) }, c);
    Object.values(M.reactions).forEach((r0, i) => { const v = (t - R - 0.4 - i * 0.18) / 1.8; if (v > 0 && v < 1) o += '<g opacity="' + f3(1 - v * v) + '">' + inline(spec, r0.art, 120 + i * 180, 1750 - v * 900, 150, 150) + '</g>'; });
    return o; }
  // tension: one number left
  const almost = all.filter((n) => n !== N.last);
  if (t < L.full) return view(spec, t, { called: [N.react, N.second, N.first, 8], ball: '?', marked: almost, spin: true }, camT(195, 300, 1.1)) + caption(spec, 1780, say(X.tense || 'Bas {n} chahiye!'), L.tense + 0.2, t);
  // full house
  if (t < L.end) { const a3 = L.full + 0.1, d3 = L.full + 0.8;
    return view(spec, t, { called: [N.last, N.react, N.second, N.first], ball: N.last, ballAt: a3, marked: t > d3 ? all : almost, markAt: { [N.last]: d3 }, full: t > d3 ? d3 : false }, camT(195, 422, 1.0)) + (t > d3 + 0.2 ? band(spec, 0.6) + pill(spec, 1840, X.full || 'FULL HOUSE!', 110, '#FFE58A', ink, -3, d3 + 0.2, t) : ''); }
  // closing: download the app, after the times card
  if (t >= L.app) return appCard(spec, t, L.app);
  return timesCard(spec, t, L.end);
}
// opening cover, same for every story: theme, date, all of the day's game times
function coverFrame(spec, t) {
  const M = spec.theme.manifest, C = M.colors, ink = C.boxInk, deep = C.accentDeep;
  return homeBg(spec, t) + pill(spec, 380, (spec.copy || {}).cover || 'AAJ KI HOUSIE THEME', 60, deep, '#FFFFFF', -2, 0.05, t) + '<g transform="translate(540 600) scale(' + f3(back((t - 0.2) / 0.4)) + ')">' + T(0, 0, M.name, 130, '#FFFFFF', { stroke: deep, sw: 18 }) + '</g>' + mascot(spec, 290, 700, 500, t) + pill(spec, 1300, spec.day, 64, '#FFE58A', ink, 2, 0.5, t) + timeChips(spec, 1470, 50, 0.8, t);
}
// times card before the app card, same for every story
function timesCard(spec, t, at) {
  const M = spec.theme.manifest, C = M.colors, ink = C.boxInk, deep = C.accentDeep;
  return homeBg(spec, t) + pill(spec, 520, 'Aaj ki theme', 62, '#FFFFFF', deep, 0, at + 0.05, t) + '<g transform="translate(540 730) scale(' + f3(back((t - at - 0.2) / 0.4)) + ')">' + T(0, 0, M.name, 120, '#FFFFFF', { stroke: deep, sw: 16 }) + '</g>' + pill(spec, 880, spec.day + ' · Public Housie', 56, '#FFE58A', ink, -2, at + 0.4, t) + timeChips(spec, 1030, 46, at + 0.6, t) + pill(spec, 1330, (spec.copy || {}).play || 'Kitty Party app pe khelo', 54, deep, '#FFFFFF', 1, at + 1.2, t) + mascot(spec, 390, 1420, 300, t) + T(540, 1820, '@kittyparty.app', 44, '#FFFFFF', { w: 600 });
}
// big mascot ball on the theme background with a number (or ?) on its disc
function bigBall(spec, t, cx, cy, size, label, popAt, spin) {
  const [dx, dy, r] = spec.theme.manifest.scene.disc, k = size / 170, x = cx - size / 2, y = cy - size / 2;
  const pop = popAt ? back((t - popAt) / 0.35) : 1, rot = spin ? Math.sin(t * 9) * 7 : 0, big = String(label).length > 1;
  const num = label !== '' ? '<g transform="translate(' + f1(x + dx * k) + ' ' + f1(y + dy * k) + ') scale(' + f3(pop) + ')">' + T(0, r * k * 0.36, label, r * k * (big ? 0.95 : 1.1), spec.theme.manifest.colors.boxInk) + '</g>' : '';
  return '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + f1(rot) + ') translate(' + (-cx) + ' ' + (-cy) + ')">' + mascot(spec, x, y, size, t) + num + '</g>';
}
function confetti(spec, t, at) {
  if (t < at) return '';
  const u = t - at, C = spec.theme.manifest.colors; let o = '';
  for (let i = 0; i < 70; i++) { const x = (i * 157) % 1080, y = (((i * 263) % 700) - 300 + u * (380 + (i % 5) * 90)) % 1960; o += '<rect x="' + x + '" y="' + f1(y) + '" width="24" height="13" rx="5" fill="' + C.confetti[i % C.confetti.length] + '" transform="rotate(' + f1((i * 37 + u * 220) % 360) + ' ' + x + ' ' + f1(y) + ')"></rect>'; }
  return o;
}

// Story "guess": the theme's own number calls are the quiz. Hear the call, guess, then the ball shows it.
function guessFrame(spec, t, L) {
  const M = spec.theme.manifest, C = M.colors, ink = C.boxInk, deep = C.accentDeep, X = spec.copy || {}, Q = spec.numbers.quiz;
  if (t >= L.app) return appCard(spec, t, L.app);
  if (t >= L.end) return timesCard(spec, t, L.end);
  let o = homeBg(spec, t) + '<rect width="1080" height="1920" fill="' + deep + '" opacity="0.18"></rect>';
  if (t < L.q[0]) return o + pill(spec, 330, X.hook || 'Number call suno', 70, '#FFE58A', ink, -2, L.hook + 0.1, t) + pill(spec, 470, X.hook2 || 'Guess karo kaunsa number!', 54, '#FFFFFF', deep, 1.5, L.hook + 0.4, t) + bigBall(spec, t, 540, 1050, 600, '?', 0, true) + pill(spec, 1560, X.sound || 'Sound ON karo', 50, deep, '#FFFFFF', -1, L.hook + 0.9, t);
  if (t < L.tally) {
    const i = L.q.filter((q) => t >= q).length - 1, q = L.q[i], rv = q + (L.reveal || 3.6), shown = t >= rv;
    o += pill(spec, 250, (X.round || 'Guess {i}/3').replace('{i}', i + 1), 62, '#FFE58A', ink, -2, q + 0.05, t);
    o += bigBall(spec, t, 540, 860, 640, shown ? Q[i] : '?', shown ? rv : 0, !shown);
    if (!shown) {
      const left = Math.ceil(rv - t);
      if (t > q + 0.9 && left <= 3) { const k = back((t - (rv - left)) / 0.25); o += '<g transform="translate(540 1420) scale(' + f3(k) + ')"><circle r="120" fill="#FFFFFF" opacity="0.95"></circle>' + T(0, 44, left, 130, deep) + '</g>'; }
      o += pill(spec, 1700, i === 2 ? (X.last || 'Last one! Dhyan se suno') : (X.listen || 'Call suno...'), 52, deep, '#FFFFFF', 1, q + 0.3, t);
    } else o += caption(spec, 1420, 'Number ' + Q[i] + '!', rv + 0.15, t) + pill(spec, 1640, ['Sahi tha?', 'Ab batao!', 'Kitne sahi?'][i], 56, '#FFE58A', ink, -2, rv + 0.5, t);
    return o;
  }
  // tally: all three numbers, comment ask
  o += pill(spec, 420, X.tally || 'Kitne sahi hue?', 76, '#FFE58A', ink, -2, L.tally + 0.05, t);
  Q.forEach((n, i) => { o += bigBall(spec, t, 230 + i * 310, 860, 300, n, L.tally + 0.3 + i * 0.2, false); });
  return o + pill(spec, 1300, X.comment || '3/3 wale comment karo', 56, '#FFFFFF', deep, 1.5, L.tally + 1.0, t) + pill(spec, 1440, M.name + ' ki calls, sirf app pe', 46, deep, '#FFFFFF', -1, L.tally + 1.4, t);
}

// Story "race": five friends on one game, their tickets race to Full House, you win at the end.
const RACE = { names: ['Sunita', 'Meera', 'Anjali', 'Kavya', 'You'], steps: [[9, 8, 7, 6, 8], [11, 9, 8, 8, 10], [12, 11, 9, 10, 12], [13, 12, 10, 12, 13], [13, 14, 11, 12, 14], [13, 14, 11, 12, 15]] };
function raceFrame(spec, t, L) {
  const M = spec.theme.manifest, C = M.colors, ink = C.boxInk, deep = C.accentDeep, X = spec.copy || {}, N = spec.numbers.race;
  if (t >= L.app) return appCard(spec, t, L.app);
  if (t >= L.end) return timesCard(spec, t, L.end);
  // each number lands, then the bars grow
  const marks = L.calls.concat([L.full]); let si = 0; marks.forEach((m, i) => { if (t >= m + 0.9) si = i + 1; });
  const prev = RACE.steps[Math.max(0, si - 1)], cur = RACE.steps[Math.min(si, RACE.steps.length - 1)], at = si ? marks[si - 1] + 0.9 : 0, u = si ? ease((t - at) / 0.5) : 1;
  const called = L.calls.filter((c) => t >= c).length;
  const ballN = t >= L.full ? 90 : called ? N[called - 1] : '?', popAt = t >= L.full ? L.full : called ? L.calls[called - 1] : 0;
  let o = homeBg(spec, t) + '<rect width="1080" height="1920" fill="' + deep + '" opacity="0.22"></rect>';
  o += t < L.race ? pill(spec, 200, X.hook || '5 saheliyan, 1 Full House', 62, '#FFE58A', ink, -2, L.hook + 0.1, t) : pill(spec, 200, X.hook2 || 'Kaun jeetega?', 70, '#FFE58A', ink, -2, L.race, t);
  o += bigBall(spec, t, 540, 470, 330, ballN, popAt, ballN === '?');
  RACE.names.forEach((nm, i) => {
    const y = 760 + i * 190, k = back((t - L.hook - 0.3 - i * 0.12) / 0.35); if (k <= 0.01) return;
    const v = lerp(prev[i], cur[i], u), w = 640 * v / 15, me = i === 4, win = me && t >= L.full + 0.9;
    o += '<g transform="translate(0 ' + y + ') scale(1 ' + f3(k) + ')"><rect x="40" y="-78" width="1000" height="156" rx="40" fill="#FFFFFF" opacity="' + (me ? 0.98 : 0.86) + '"' + (me ? ' stroke="' + C.cta + '" stroke-width="8"' : '') + '></rect>';
    o += '<circle cx="130" cy="0" r="58" fill="' + C.chip + '"></circle>' + (spec.avatars[i] ? raw(spec.avatars[i], 76, -54, 108, 108) : '') + T(250, -22, nm, 40, ink, { a: 'start' });
    o += '<rect x="250" y="8" width="640" height="40" rx="20" fill="' + C.line + '"></rect><rect x="250" y="8" width="' + f1(Math.max(40, w)) + '" height="40" rx="20" fill="' + (win ? C.cta : C.mark) + '"></rect>' + T(965, 40, Math.round(v) + '/15', 38, deep) + '</g>';
  });
  if (t >= L.tense && t < L.full) o += band(spec, 0.62) + pill(spec, 1820, X.tense || 'Meera aur aap, dono ko 1 chahiye!', 52, '#FFE58A', ink, -2, L.tense + 0.1, t);
  if (t >= L.full + 0.9) o += confetti(spec, t, L.full + 0.9) + band(spec, 0.62) + pill(spec, 1820, X.full || 'FULL HOUSE! Aap jeet gaye!', 66, '#FFE58A', ink, -2, L.full + 1.0, t);
  return o;
}

// closing card on every reel: download the app, in the theme's colours
const playGlyph = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0 L0 40 L20 20Z" fill="#00D7FE"></path><path d="M0 0 L20 20 L27 13 L4 0Z" fill="#00F076"></path><path d="M0 40 L20 20 L27 27 L4 40Z" fill="#FF3A44"></path><path d="M20 20 L27 13 L36 18 Q38 20 36 22 L27 27Z" fill="#FFD500"></path></g>';
const appleGlyph = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#FFFFFF"><path d="M27 21c0-5 4-7 4-7-2-3-6-4-7-4-3 0-5 2-7 2s-4-2-7-2C5 10 0 14 0 22c0 8 6 18 10 18 2 0 3-1 6-1s4 1 6 1c4 0 7-7 8-10-1 0-3-3-3-9z"></path><path d="M20 7c2-2 2-5 2-6-2 0-4 1-5 3-1 1-2 4-2 5 2 0 4-1 5-2z"></path></g>';
function badge(x, y, top, big, glyph, k) {
  if (k <= 0.01) return '';
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + f3(k) + ')"><rect x="-215" y="-62" width="430" height="124" rx="30" fill="#14070F"></rect>' + glyph + T(-118, -8, top, 30, '#FFFFFF', { a: 'start', w: 500 }) + T(-118, 38, big, 50, '#FFFFFF', { a: 'start', w: 600 }) + '</g>';
}
function appCard(spec, t, at) {
  const M = spec.theme.manifest, C = M.colors, deep = C.accentDeep, ink = C.boxInk;
  const k = (d, dur = 0.4) => back((t - at - d) / dur), fade = sat((t - (spec.total - 0.5)) / 0.5);
  const phoneK = ease((t - at - 0.9) / 0.6), py = lerp(1980, 1150, phoneK), pw = 360, ph = pw * PH / PW;
  let o = homeBg(spec, t) + '<rect width="1080" height="1920" fill="' + deep + '" opacity="0.28"></rect>';
  // the app on a phone, tilted, with the theme's own game screen (Full House moment)
  o += '<g transform="rotate(-7 540 ' + f1(py + ph / 2) + ')"><rect x="' + (540 - pw / 2 - 14) + '" y="' + f1(py - 14) + '" width="' + (pw + 28) + '" height="' + f1(ph + 28) + '" rx="56" fill="#2A0E22"></rect><clipPath id="apc"><rect x="' + (540 - pw / 2) + '" y="' + f1(py) + '" width="' + pw + '" height="' + f1(ph) + '" rx="44"></rect></clipPath><g clip-path="url(#apc)">' + view(spec, t, { called: [90, 7, 61, 23], ball: 90, marked: spec.ticket.flat() }, [540 - pw / 2, py, pw / PW]) + '</g></g>';
  o += '<g opacity="' + f3(phoneK) + '">' + mascot(spec, 700, py + 120, 260, t) + '</g>';
  // app icon + name
  const ik = k(0.05, 0.45);
  if (ik > 0.01) o += '<g transform="translate(540 300) scale(' + f3(ik) + ')"><circle cx="0" cy="8" r="150" fill="' + deep + '" opacity="0.35"></circle><image href="' + spec.logo + '" x="-160" y="-160" width="320" height="320"></image></g>';
  o += pill(spec, 560, 'Download', 64, '#FFFFFF', deep, -2, at + 0.25, t);
  const nk = k(0.4);
  if (nk > 0.01) o += '<g transform="translate(540 720) scale(' + f3(nk) + ')">' + T(0, 0, '"Kitty Party" app', 108, '#FFFFFF', { stroke: deep, sw: 18 }) + '</g>';
  o += pill(spec, 850, 'Play Store ya App Store se', 50, '#FFE58A', ink, 1.5, at + 0.6, t);
  o += badge(300, 1010, 'GET IT ON', 'Google Play', playGlyph(-182, -24, 1.3), k(0.75, 0.35)) + badge(780, 1010, 'Download on the', 'App Store', appleGlyph(-180, -30, 1.45), k(0.85, 0.35));
  return o + (fade > 0 ? '<rect width="1080" height="1920" fill="' + C.gameGradient[2] + '" opacity="' + f3(fade) + '"></rect>' : '');
}
// cover image: the opening scene once everything has landed
export const coverAt = (spec) => { uid = 0; return coverFrame(spec, (spec.tl || TL).hook - 0.05); };

// Pieces the AI-written theme reels (src/autopilot/engine.js theme kits) draw with.
// `spec` here is the theme spec built by scripts/theme/build.js loadTheme().
export const themeKit = {
  home: (spec, t) => { uid = 0; return homeBg(spec, t); },
  // the game screen filling the frame (camera centre cx, cy in app units, zoom z) or held in a tilted phone
  screen: (spec, t, st, cx = 195, cy = 422, z = 1) => view(spec, t, st, camT(cx, cy, z)),
  phone: (spec, t, st, x = 540, y = 360, w = 520, rot = -4) => {
    const h = w * PH / PW, k = 'ph' + (uid++);
    return '<g transform="rotate(' + rot + ' ' + x + ' ' + f1(y + h / 2) + ')"><rect x="' + f1(x - w / 2 - 14) + '" y="' + f1(y - 14) + '" width="' + f1(w + 28) + '" height="' + f1(h + 28) + '" rx="56" fill="#2A0E22"></rect><clipPath id="' + k + '"><rect x="' + f1(x - w / 2) + '" y="' + f1(y) + '" width="' + w + '" height="' + f1(h) + '" rx="44"></rect></clipPath><g clip-path="url(#' + k + ')">' + view(spec, t, st, [x - w / 2, y, w / PW]) + '</g></g>';
  },
  ball: (spec, t, cx, cy, size, label, popAt, spin) => bigBall(spec, t, cx, cy, size, label, popAt, spin),
  confetti: (spec, t, at) => confetti(spec, t, at),
  reaction: (spec, key, x, y, size) => { const r0 = spec.theme.manifest.reactions[key] || Object.values(spec.theme.manifest.reactions)[0]; return r0 ? inline(spec, r0.art, x - size / 2, y - size / 2, size, size) : ''; },
  times: (spec, t, at) => { uid = 0; return timesCard(spec, t, at); },
  app: (spec, t, at) => { uid = 0; return appCard(spec, t, at); },
  cover: (spec) => { uid = 0; return coverFrame(spec, 2.15); },
};
