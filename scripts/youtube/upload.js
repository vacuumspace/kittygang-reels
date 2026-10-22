// Uploads a reel to our YouTube channel as a Short, scheduled for the same time it goes out on Instagram.
// Needs YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (from scripts/youtube/authorize.js).
//   node scripts/youtube/upload.js <video.mp4> "<title>" "<description>" [publishAtISO]
// Note: until the Google project passes YouTube's API audit, YouTube keeps API uploads private; publishAt then
// has no effect and the Short must be made public in YouTube Studio.
const fs = require('fs');

async function accessToken() {
  const e = process.env;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: e.YT_CLIENT_ID, client_secret: e.YT_CLIENT_SECRET, refresh_token: e.YT_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error('youtube token: ' + (t.error_description || t.error));
  return t.access_token;
}

async function uploadShort({ file, title, description, tags = [], publishAt }) {
  const token = await accessToken();
  const t = title.includes('#Shorts') ? title : (title + ' #Shorts');
  const meta = {
    snippet: { title: t.slice(0, 100), description: description.slice(0, 4900), tags: tags.slice(0, 15), categoryId: '23', defaultLanguage: 'hi', defaultAudioLanguage: 'hi' },
    status: { privacyStatus: publishAt && new Date(publishAt) > new Date(Date.now() + 15 * 60000) ? 'private' : 'public', ...(publishAt && new Date(publishAt) > new Date(Date.now() + 15 * 60000) ? { publishAt } : {}), selfDeclaredMadeForKids: false },
  };
  const size = fs.statSync(file).size;
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
    body: JSON.stringify(meta),
  });
  const loc = init.headers.get('location');
  if (!init.ok || !loc) throw new Error('youtube init ' + init.status + ': ' + (await init.text()).slice(0, 300));
  const put = await fetch(loc, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) }, body: fs.readFileSync(file) });
  const out = await put.json();
  if (!put.ok || !out.id) throw new Error('youtube upload ' + put.status + ': ' + JSON.stringify(out).slice(0, 300));
  if (process.env.YT_PLAYLIST_ID) await addToPlaylist(out.id, token).catch((e) => console.warn('playlist', e.message));
  return { id: out.id, url: 'https://youtube.com/shorts/' + out.id, privacy: out.status?.privacyStatus, publishAt: out.status?.publishAt };
}

// every Short also goes into the public "Kitty Gang Reels" playlist (YT_PLAYLIST_ID)
async function addToPlaylist(videoId, token, playlistId = process.env.YT_PLAYLIST_ID) {
  token = token || await accessToken();
  const r = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }),
  });
  const out = await r.json();
  if (!r.ok) throw new Error('playlist ' + r.status + ': ' + (out.error?.message || ''));
  return out.id;
}
module.exports = { uploadShort, addToPlaylist, accessToken };

if (require.main === module) {
  const [file, title, description, publishAt] = process.argv.slice(2);
  uploadShort({ file, title, description: description || '', publishAt }).then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e.message); process.exit(1); });
}
