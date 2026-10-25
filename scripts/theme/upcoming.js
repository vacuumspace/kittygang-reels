// Writes theme/data/upcoming.json: the booked theme and public game times for the next 3 IST days, with a
// short summary of each pack (colours, reactions, ticket prize groups, what the art shows), so the Theme
// Reel Writer routine (theme/WRITER.md) can script tomorrow's reel without Firestore access.
//   node scripts/theme/upcoming.js   (needs FIREBASE_SA; run by the sync workflow)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { today } = require('./today');
const { R2, get } = require('./build');

const ROOT = path.join(__dirname, '..', '..');
const IST = 5.5 * 3600e3;

async function summary(pack) {
  const dir = path.join(ROOT, '.remotion', 'upcoming'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'p.zip'), await get(`${R2}/${pack}.zip`));
  execFileSync('unzip', ['-q', '-o', path.join(dir, 'p.zip'), '-d', dir]);
  const mf = execFileSync('find', [dir, '-name', 'manifest.json']).toString().trim().split('\n')[0];
  const M = JSON.parse(fs.readFileSync(mf, 'utf8'));
  const names = (layers) => (layers || []).map((l) => l.art.replace(/\.svg$/, ''));
  return {
    name: M.name, colors: { accent: M.colors.accent, accentDeep: M.colors.accentDeep, gameInk: M.colors.gameInk },
    reactions: Object.keys(M.reactions || {}),
    ticketGroups: (M.ticketLayout?.groups || []).map((g) => ({ name: g.name, points: g.points, numbers: g.slots.length })),
    art: { home: names(M.ground?.layers), housie: names(M.groundHousie?.layers), mascotBall: names(M.scene?.layers), particles: [...new Set([...(M.ground?.particles || []), ...(M.fx?.particles || [])].flatMap((p) => p.art.map((a) => a.replace(/\.svg$/, ''))))] },
  };
}

(async () => {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(Date.now() + IST + i * 86400e3).toISOString().slice(0, 10);
    const d = await today(date);
    out.push({ date, day: d.day, times: d.times, theme: d.theme ? { ...d.theme, ...(await summary(d.theme.pack).catch((e) => ({ error: e.message }))) } : null });
  }
  fs.mkdirSync(path.join(ROOT, 'theme', 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'theme', 'data', 'upcoming.json'), JSON.stringify({ updated: new Date().toISOString(), days: out }, null, 1));
  console.log('upcoming:', out.map((x) => x.date + ' ' + (x.theme ? x.theme.name : 'none')).join(', '));
})().catch((e) => { console.error(e); process.exit(1); });
