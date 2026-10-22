// Group reactions in Hindi ("Ohho!", "Haaye!", "Waah!", "Hawww!") made from the cast's chorus voices, slightly offset so
// they sound like a room full of ladies. Saved as sound effects in public/sfx/.
//   node scripts/sfx-voices.js        (needs uvx edge-tts locally, or EDGE_TTS_BIN)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CAST = JSON.parse(fs.readFileSync(path.join(ROOT, 'autopilot', 'cast.json'), 'utf8'));
const TMP = path.join(ROOT, 'out', 'sfxv');
fs.mkdirSync(TMP, { recursive: true });
const REACTIONS = { ohho: 'ओहोऽ!', haaye: 'हाये!', waah: 'वाह!', haww: 'हॉ!', laughv: 'हाहाहाहा... हाहा!' };
const cmd = process.env.EDGE_TTS_BIN ? [process.env.EDGE_TTS_BIN] : ['uvx', 'edge-tts'];
for (const [name, text] of Object.entries(REACTIONS)) {
  const parts = [];
  CAST.chorus.filter((v) => v.script !== 'en').forEach((v, j) => {
    const mp3 = path.join(TMP, name + j + '.mp3');
    const pitch = (Number(String(v.pitch).replace('%', '')) * 1.5) | 0;
    execFileSync(cmd[0], [...cmd.slice(1), '--voice', v.voice, '--rate=+10%', '--pitch=' + (pitch >= 0 ? '+' : '') + pitch + 'Hz', '--text', text, '--write-media', mp3], { stdio: 'ignore' });
    parts.push(mp3);
  });
  const ins = parts.flatMap((f) => ['-i', f]);
  const fc = parts.map((_, j) => '[' + j + ']silenceremove=start_periods=1:start_threshold=-45dB,adelay=' + (j * 53) % 160 + '|' + (j * 53) % 160 + ',volume=' + (0.7 + (j % 3) * 0.15) + '[a' + j + ']').join(';') + ';' + parts.map((_, j) => '[a' + j + ']').join('') + 'amix=inputs=' + parts.length + ':normalize=0,aecho=0.6:0.4:40:0.25,loudnorm=I=-16:TP=-1.5';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, '-ar', '44100', '-ac', '2', path.join(ROOT, 'public', 'sfx', name + '.wav')]);
  console.log('made', name);
}
fs.rmSync(TMP, { recursive: true, force: true });
