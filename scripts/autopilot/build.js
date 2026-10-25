// Voices a reel draft and writes the timed spec for the AutoReel composition.
//   node scripts/autopilot/build.js autopilot/drafts/<id>.json
// Draft: { id, title, caption, music:"quirky", shots:[{ kit, ..., dur?, hold?, lines:[{ who, text, say?, punch?, silenceBefore?, gap? }], sfx:[{at,name,vol}] }] }
// Output: public/autopilot/<id>/NN.wav + music.wav, autopilot/timed/<id>.json ({ spec }).
// Theme reels (draft.theme = { id, pack, sounds, day, times, seed }, set by scripts/theme/daily.js): the theme's
// music instead of the quirky track, `call: N` on a shot plays the theme's own call for number N, and the
// times card + Download app card are added at the end. spec.T carries the theme for the engine's theme kits.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const CAST = JSON.parse(fs.readFileSync(path.join(ROOT, 'autopilot', 'cast.json'), 'utf8'));
const FPS = 30;
// crowd laugh used after the last punchline and as a giggle between punches (style picked by the team)
const LAUGH = 'laughv', GIGGLE = 'laughv';
// Pace: every voice a little faster than its base setting (comedy needs speed).
const boost = (r) => { const m = String(r || '+0%').match(/^([+-]?\d+)/); const v = (m ? Number(m[1]) : 0) + (D.pace ?? 18); return (v >= 0 ? '+' : '') + v + '%'; };
const draftFile = process.argv[2];
const D = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const OUT = path.join(ROOT, 'public', 'autopilot', D.id);
const TMP = path.join(OUT, '_tmp');
fs.mkdirSync(TMP, { recursive: true });

// Free Microsoft neural voices through the edge-tts Python tool (uvx edge-tts, or edge-tts on PATH in CI).
const hz = (p) => { const m = String(p || '+0%').match(/^([+-]?\d+)/); const v = m ? Math.round(Number(m[1]) * 1.5) : 0; return (v >= 0 ? '+' : '') + v + 'Hz'; };
// North Indian pronunciation. The voices read the ऐ vowel (ै) as a long south-style "aai": मैं -> "maaai",
// है -> "haaai". In everyday Hindi it is a short "e" (main = "meh", hai = "hae"), so every ै / ऐ is respelled
// as े / ए before voicing. Words where the "ai" is really said (भैया, मैया) keep it: ै before य is left alone.
const SAY_AS = [[/ै(?!य)/g, 'े'], [/ऐ(?!य)/g, 'ए']];
const sayAs = (t) => SAY_AS.reduce((x, [re, to]) => x.replace(re, to), t);
async function speak(voice, text, rate, pitch, file) {
  text = sayAs(text);
  const mp3 = path.join(TMP, 'audio.mp3');
  const cmd = process.env.EDGE_TTS_BIN ? [process.env.EDGE_TTS_BIN] : ['uvx', 'edge-tts'];
  for (let tries = 0; ; tries++) {
    try {
      execFileSync(cmd[0], [...cmd.slice(1), '--voice', voice, '--rate=' + boost(rate), '--pitch=' + hz(pitch), '--text', text, '--write-media', mp3], { stdio: 'ignore' });
      break;
    } catch (e) { if (tries >= 3) throw e; await new Promise((r) => setTimeout(r, 3000 * (tries + 1))); }
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', file]);
}
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
function envelope(file) {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 26 });
  const out = [];
  for (let k = 0; ; k++) {
    const i = Math.round((k * 16000) / FPS), per = Math.round(((k + 1) * 16000) / FPS) - i;
    if ((i + per) * 2 > raw.length) break;
    let s = 0; for (let j = 0; j < per; j++) { const v = raw.readInt16LE((i + j) * 2) / 32768; s += v * v; }
    out.push(Math.sqrt(s / per));
  }
  const pk = Math.max(...out) || 1;
  return out.map((v) => Math.round((v / pk) * 100) / 100);
}

(async () => {
  const TH = D.theme ? require('../theme/build') : null;
  const TS = TH ? await TH.loadTheme(D.theme) : null;
  const calls = [], callFiles = {};
  const callFile = async (n) => {
    const file = TH.call(n);
    if (!callFiles[file]) { fs.writeFileSync(path.join(OUT, file), await TH.get(`${TH.R2}/${D.theme.sounds}/${file}`)); callFiles[file] = dur(path.join(OUT, file)); }
    return { file, d: callFiles[file] };
  };
  // the first frame is the reel's first shot (Instagram picks covers from it), so no lead-in
  let t = 0, n = 0, punchN = 0;
  const lines = [], shots = [], sfx = [];
  for (const [si, s] of D.shots.entries()) {
    const shot = { ...s, start: t };
    delete shot.lines; delete shot.sfx;
    // cuts: vary the transition sound so it never feels like the same whoosh on repeat
    if (si > 0) sfx.push({ at: t, name: ['whip', 'swish', 'whoosh'][si % 3], vol: 0.2 });
    let lt = t + (s.lead ?? 0.1);
    // the theme's number call plays first, then any lines
    let callEnd = 0;
    if (TS && s.call != null) {
      const c = await callFile(s.call);
      calls.push({ at: +(t + 0.3).toFixed(2), until: +(t + 0.45 + c.d).toFixed(2), file: c.file });
      sfx.push({ at: t + 0.25, name: 'ballpop', vol: 0.5 });
      callEnd = t + 0.45 + c.d; lt = Math.max(lt, callEnd + 0.1);
    }
    for (const L of s.lines || []) {
      if (L.silenceBefore) { lt += 0.7; sfx.push({ at: lt - 0.8, name: 'cricket', vol: 0.5 }); }
      const file = String(n++).padStart(2, '0') + '.wav', dest = path.join(OUT, file);
      const text = L.say || L.text;
      if (L.who === 'ALL') {
        const parts = [];
        for (const [j, v] of CAST.chorus.entries()) { const f = path.join(TMP, 'c' + j + '.wav'); await speak(v.voice, v.script === 'en' ? L.text : text, v.rate, v.pitch, f); parts.push(f); }
        const ins = parts.flatMap((f) => ['-i', f]);
        const fc = parts.map((_, j) => '[' + j + ']adelay=' + ((j * 37) % 120) + '|' + ((j * 37) % 120) + '[a' + j + ']').join(';') + ';' + parts.map((_, j) => '[a' + j + ']').join('') + 'amix=inputs=' + parts.length + ':normalize=0,loudnorm=I=-15:TP=-1.5';
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, '-ar', '44100', dest]);
      } else {
        const v = CAST.voices[L.who] || CAST.voices.Tanya;
        await speak(v.voice, v.script === 'en' ? L.text : text, L.rate || v.rate, L.pitch || v.pitch, path.join(TMP, 'one.wav'));
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(TMP, 'one.wav'), '-af', 'loudnorm=I=-15:TP=-1.5', '-ar', '44100', dest]);
      }
      const d = dur(dest);
      lines.push({ id: 'l' + n, who: L.who, text: L.text, file, start: +lt.toFixed(2), dur: +d.toFixed(2), env: envelope(dest), punch: !!L.punch, silenceBefore: !!L.silenceBefore });
      // punchlines: a hit on the line, then the room reacts (twist: boom + "Ohho!", button: tabla, others: a quick gasp)
      if (L.punch) {
        if (L.beat === 'twist') { sfx.push({ at: lt, name: 'boom', vol: 0.45 }); sfx.push({ at: lt + d + 0.05, name: 'ohho', vol: 0.45 }); }
        else if (L.beat === 'button') { sfx.push({ at: lt + d + 0.05, name: 'tabla', vol: 0.55 }); sfx.push({ at: lt + d + 0.35, name: LAUGH, vol: 0.4 }); }
        else { sfx.push({ at: lt, name: 'pop', vol: 0.3 }); sfx.push({ at: lt + d + 0.02, name: ['haww', GIGGLE, 'haaye'][punchN++ % 3], vol: 0.35 }); }
      }
      lt += d + (L.gap ?? 0.12);
      console.log(L.who.padEnd(7), d.toFixed(2), L.text);
    }
    let end = (s.lines?.length ? lt - (s.lines[s.lines.length - 1].gap ?? 0.12) + (s.hold ?? 0.3) : t + (s.dur ?? 1.5));
    end = Math.max(end, callEnd + 0.4);
    // theme kit sounds: the ball pops, dabs, the 3-2-1 before a reveal, Full House
    if (TS) {
      if (s.kit === 'tgame' && s.ball != null && s.call == null) sfx.push({ at: t + 0.3, name: 'ballpop', vol: 0.5 });
      if (s.kit === 'tgame' && s.dab) sfx.push({ at: t + 1.0, name: 'pop', vol: 0.55 });
      if (s.full) sfx.push({ at: t + 1.0, name: 'impact', vol: 0.5 }, { at: t + 1.05, name: 'crowd', vol: 0.45 }, { at: t + 1.2, name: 'waah', vol: 0.5 }, { at: t + 1.4, name: 'clap', vol: 0.45 });
      if (s.kit === 'tball') { const rv = s.revealAt ?? 3; [3, 2, 1].forEach((k) => rv - k > 0.5 && sfx.push({ at: t + rv - k, name: 'tick', vol: 0.4 })); sfx.push({ at: t + rv, name: 'ballpop', vol: 0.6 }, { at: t + rv + 0.15, name: 'ding', vol: 0.45 }); end = Math.max(end, t + rv + 1.2); }
      if (s.burst) sfx.push({ at: t + 0.4, name: 'sparkle', vol: 0.35 });
    }
    shot.end = +end.toFixed(2);
    const STICK = { sweat: 'drip', question: 'slideup', exclaim: 'sting', bulb: 'ding', spark: 'sparkle', heart: 'pop', bolt: 'pop' };
    for (const st of s.stickers || []) sfx.push({ at: t + (st.at || 0.3), name: STICK[st.kind] || 'pop', vol: 0.3 });
    for (const p of s.props || []) if (p.at != null) sfx.push({ at: t + p.at, name: 'zip', vol: 0.3 });
    for (const c of s.chars || []) if (c.from) sfx.push({ at: t + (c.moveAt || 0), name: 'footsteps', vol: 0.35 });
    if (s.chip) sfx.push({ at: t + 0.2, name: 'pop', vol: 0.25 });
    if (s.kit === 'phone') (s.chat || []).forEach((m, i) => sfx.push({ at: t + (m[4] ?? i * 0.9), name: 'ping', vol: 0.35 }));
    if (s.kit === 'camera' && s.flash) sfx.push({ at: t + 0.6, name: 'shutter', vol: 0.55 });
    if (s.hook) sfx.push({ at: t + 0.05, name: 'whoosh', vol: 0.4 });
    for (const x of s.sfx || []) sfx.push({ ...x, at: t + x.at });
    shots.push(shot);
    t = end;
  }
  // theme reels always close on the times card, then the Download app card (team rule)
  if (TS) {
    shots.push({ kit: 'ttimes', start: +t.toFixed(2), end: +(t + 3).toFixed(2) }, { kit: 'tapp', start: +(t + 3).toFixed(2), end: +(t + 6.8).toFixed(2) });
    sfx.push({ at: t, name: 'whoosh', vol: 0.45 }, { at: t + 0.6, name: 'ding', vol: 0.35 }, { at: t + 1.2, name: 'sparkle', vol: 0.35 }, { at: t + 3, name: 'whoosh', vol: 0.45 }, { at: t + 3.1, name: 'pop', vol: 0.5 }, { at: t + 3.8, name: 'ding', vol: 0.4 }, { at: t + 4, name: 'slideup', vol: 0.4 });
    t += 6.8;
  }
  const total = +(t + (TS ? 0 : D.tail ?? 0.6)).toFixed(2);
  if (TS) fs.writeFileSync(path.join(OUT, 'music.m4a'), await TH.get(`${TH.R2}/${D.theme.sounds}/music.m4a`));
  else execFileSync('node', [path.join(ROOT, 'scripts', 'music-quirky.js'), path.join(OUT, 'music.wav'), String(Math.ceil(total + 1))], { stdio: 'ignore' });
  fs.rmSync(TMP, { recursive: true, force: true });
  const spec = { id: D.id, title: D.title, total, lines, shots, sfx, music: D.music || 'quirky', musicFile: TS ? 'music.m4a' : 'music.wav', calls, frames: Math.round(total * FPS), cover: D.cover, ambience: D.ambience };
  if (TS) spec.T = { ...TS, total };
  fs.mkdirSync(path.join(ROOT, 'autopilot', 'timed'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'autopilot', 'timed', D.id + '.json'), JSON.stringify({ spec }));
  console.log('total', total, 's');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
