// Reads today's (IST) booked theme and public Housie game times from the app's Firestore.
// Needs FIREBASE_SA (the service account JSON as one string). Read-only.
//   node scripts/theme/today.js [YYYY-MM-DD]   -> prints { date, day, theme, times }
const crypto = require('crypto');

const IST = 5.5 * 3600e3;
const b64 = (x) => Buffer.from(x).toString('base64url');

async function token(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + sig }) });
  const t = await r.json(); if (!t.access_token) throw new Error('firebase token: ' + (t.error_description || t.error)); return t.access_token;
}
// Firestore REST value -> plain JS
const val = (v) => v.stringValue ?? v.timestampValue ?? (v.integerValue != null ? Number(v.integerValue) : v.doubleValue ?? v.booleanValue ?? (v.mapValue ? fields(v.mapValue.fields || {}) : v.nullValue === null ? null : undefined));
const fields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, val(v)]));

async function query(sa, tok, structuredQuery) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents:runQuery`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery }) });
  const out = await r.json(); if (!r.ok) throw new Error('firestore ' + r.status + ' ' + JSON.stringify(out).slice(0, 200));
  return out.filter((x) => x.document).map((x) => ({ id: x.document.name.split('/').pop(), ...fields(x.document.fields || {}) }));
}

async function today(dateStr) {
  const sa = JSON.parse(process.env.FIREBASE_SA);
  const tok = await token(sa);
  const date = dateStr || new Date(Date.now() + IST).toISOString().slice(0, 10);
  const start = Date.parse(date + 'T00:00:00Z') - IST, end = start + 86400e3, mid = start + 12 * 3600e3;
  const ts = (ms) => ({ timestampValue: new Date(ms).toISOString() });
  // the booking that covers midday IST is the day's theme
  const bookings = await query(sa, tok, { from: [{ collectionId: 'themeSchedule' }], where: { fieldFilter: { field: { fieldPath: 'end' }, op: 'GREATER_THAN', value: ts(mid) } } });
  const b = bookings.filter((x) => Date.parse(x.start) <= mid).sort((x, y) => Date.parse(y.start) - Date.parse(x.start))[0];
  const games = await query(sa, tok, { from: [{ collectionId: 'housieGames' }], where: { compositeFilter: { op: 'AND', filters: [
    { fieldFilter: { field: { fieldPath: 'type' }, op: 'EQUAL', value: { stringValue: 'public' } } },
    { fieldFilter: { field: { fieldPath: 'startTime' }, op: 'GREATER_THAN_OR_EQUAL', value: ts(start) } },
    { fieldFilter: { field: { fieldPath: 'startTime' }, op: 'LESS_THAN', value: ts(end) } },
  ] } } });
  const fmt = (ms) => { const d = new Date(ms + IST); let h = d.getUTCHours(); const m = d.getUTCMinutes(), ap = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return h + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap; };
  const times = [...new Set(games.map((g) => Date.parse(g.startTime)).sort((x, y) => x - y).map(fmt))];
  const d = new Date(start + IST);
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }) + ', ' + d.getUTCDate() + ' ' + d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const theme = b && { id: b.themeId, name: b.name, pack: String(b.file || '').replace(/\.zip$/, ''), sounds: String(b.sounds || '').replace(/\.zip$/, '') };
  return { date, day, theme, times };
}
module.exports = { today };

if (require.main === module) today(process.argv[2]).then((x) => console.log(JSON.stringify(x, null, 1))).catch((e) => { console.error(e.message); process.exit(1); });
