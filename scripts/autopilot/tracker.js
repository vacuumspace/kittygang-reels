// Tracker: autopilot/tracker.json is the source of truth; tracker.xlsx is generated for people.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ExcelJS = require('exceljs');

const ROOT = path.join(__dirname, '..', '..');
const FILE = path.join(ROOT, 'autopilot', 'tracker.json');
const PUBLIC_BASE = 'https://kittyparty-themes.rahul-89e.workers.dev';

function load() {
  if (!fs.existsSync(FILE)) return { reels: [], ideas: [] };
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(tr) { fs.writeFileSync(FILE, JSON.stringify(tr, null, 2)); }

async function writeXlsx(tr, out) {
  const wb = new ExcelJS.Workbook();
  const head = (ws, cols) => { ws.columns = cols; ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE85D8A' } }; ws.views = [{ state: 'frozen', ySplit: 1 }]; };
  const r = wb.addWorksheet('Reels');
  head(r, [
    { header: 'ID', key: 'id', width: 22 }, { header: 'Created', key: 'created', width: 12 }, { header: 'Title', key: 'title', width: 28 },
    { header: 'Format', key: 'format', width: 18 }, { header: 'Hook', key: 'hook', width: 30 }, { header: 'Characters', key: 'cast', width: 22 },
    { header: 'Status', key: 'status', width: 11 }, { header: 'Posted / slot (IST)', key: 'scheduled', width: 18 }, { header: 'Post link', key: 'permalink', width: 40 },
    { header: 'Views', key: 'views', width: 8 }, { header: 'Reach', key: 'reach', width: 8 }, { header: 'Likes', key: 'likes', width: 7 }, { header: 'Comments', key: 'comments', width: 9 },
    { header: 'Saves', key: 'saves', width: 7 }, { header: 'Shares', key: 'shares', width: 7 }, { header: 'Score', key: 'score', width: 7 },
    { header: 'Video', key: 'video', width: 40 }, { header: 'Storyboard', key: 'board', width: 40 }, { header: 'Caption', key: 'caption', width: 50 },
  ]);
  for (const x of [...tr.reels].reverse()) r.addRow({ id: x.id, created: x.created, title: x.title, format: x.format, hook: x.hook, cast: (x.cast || []).join(', '), status: x.status, scheduled: x.scheduled_ist, permalink: x.permalink, ...(x.stats || {}), video: x.video_url, board: x.board_url, caption: x.caption });
  const s = wb.addWorksheet('Scripts');
  head(s, [{ header: 'ID', key: 'id', width: 22 }, { header: 'Shot', key: 'shot', width: 6 }, { header: 'Format/kit', key: 'kit', width: 10 }, { header: 'Who', key: 'who', width: 10 }, { header: 'Line', key: 'line', width: 60 }, { header: 'Beat', key: 'beat', width: 12 }]);
  for (const x of [...tr.reels].reverse()) for (const row of x.script || []) s.addRow({ id: x.id, ...row });
  const i = wb.addWorksheet('Ideas');
  head(i, [{ header: 'Added', key: 'added', width: 12 }, { header: 'Idea', key: 'idea', width: 70 }, { header: 'Format', key: 'format', width: 20 }, { header: 'Source', key: 'source', width: 30 }, { header: 'Score', key: 'score', width: 7 }, { header: 'Used in', key: 'used', width: 22 }]);
  for (const x of [...(tr.ideas || [])].reverse()) i.addRow(x);
  const l = wb.addWorksheet('Learnings');
  head(l, [{ header: 'Learnings', key: 'line', width: 140 }]);
  const lf = path.join(ROOT, 'autopilot', 'LEARNINGS.md');
  if (fs.existsSync(lf)) for (const line of fs.readFileSync(lf, 'utf8').split(/\r?\n/)) if (line.trim() && !line.startsWith('# ')) l.addRow({ line: line.replace(/^#+\s*/, '').replace(/^- /, '') });
  await wb.xlsx.writeFile(out);
}

// Upload a file to R2 (served publicly through the themes Worker).
function r2put(file, key, type) {
  const e = process.env;
  execFileSync('curl', ['-sf', '--aws-sigv4', 'aws:amz:auto:s3', '--user', `${e.R2_ACCESS_KEY_ID}:${e.R2_SECRET_ACCESS_KEY}`, '-X', 'PUT', '-H', `Content-Type: ${type}`, '--data-binary', `@${file}`, `${e.R2_ENDPOINT}/${e.R2_BUCKET}/${key}`], { stdio: 'inherit' });
  return `${PUBLIC_BASE}/${key}`;
}
async function agent(p, body) {
  const res = await fetch(`${process.env.MESSAGING_URL || 'https://kittyparty-messaging.rahul-89e.workers.dev'}/agent/${p}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.AGENT_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json();
  if (!res.ok || out.error) throw new Error(out.error ?? `agent ${res.status}`);
  return out;
}
async function publishTracker(tr) {
  const out = path.join(ROOT, 'out', 'tracker.xlsx');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await writeXlsx(tr, out);
  if (process.env.R2_ACCESS_KEY_ID) return r2put(out, 'reels/autopilot/Kitty-Gang-Reels-Tracker.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return out;
}
module.exports = { load, save, writeXlsx, r2put, agent, publishTracker, ROOT };
