// One-time: the channel owner allows uploads; saves a refresh token to the private env file.
//   node scripts/youtube/authorize.js <path-to-youtube.env>
// Opens the browser on Google's consent page and listens on localhost for the answer (Desktop-app loopback flow).
const fs = require('fs');
const http = require('http');
const { execFile } = require('child_process');

const envFile = process.argv[2];
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const code = url.searchParams.get('code');
  if (!code) { res.end('Waiting for Google...'); return; }
  const redirect = 'http://127.0.0.1:' + server.address().port;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.YT_CLIENT_ID, client_secret: env.YT_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' }),
  });
  const tok = await r.json();
  if (!tok.refresh_token) { res.end('Something went wrong: ' + (tok.error_description || tok.error || 'no refresh token')); console.error('FAILED', tok.error, tok.error_description); process.exit(1); }
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('YT_REFRESH_TOKEN='));
  fs.writeFileSync(envFile, lines.concat('YT_REFRESH_TOKEN=' + tok.refresh_token).join('\n') + '\n');
  // which channel did we get?
  const ch = await (await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: 'Bearer ' + tok.access_token } })).json();
  const name = ch.items?.[0]?.snippet?.title || '(unknown channel)';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h2 style="font-family:sans-serif">Done! Kitty Party can now upload Shorts to: ' + name + '. You can close this tab.</h2>');
  console.log('OK channel:', name);
  setTimeout(() => process.exit(0), 300);
});
server.listen(0, '127.0.0.1', () => {
  const redirect = 'http://127.0.0.1:' + server.address().port;
  const auth = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: env.YT_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent' });
  console.log('Open this link if the browser did not open:\n' + auth);
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', auth.replace(/&/g, '^&')]);
});
setTimeout(() => { console.error('Timed out waiting for consent'); process.exit(1); }, 15 * 60 * 1000);
