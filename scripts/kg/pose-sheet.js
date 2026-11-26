// Renders a check sheet of the extra poses (src/kg/poses2.js) on several characters: out/pose-sheet.jpg
//   node scripts/kg/pose-sheet.js [pose,pose...]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const K = require('../../src/kg/kgkit');
const { ADD } = require('../../src/kg/poses2');
const ROOT = path.join(__dirname, '..', '..');
const poses = (process.argv[2] || Object.keys(ADD).join(',')).split(',');
const cast = ['Tanya', 'Megha', 'Ishita', 'Myra', 'Aditi'];
const rowH = 1350 / poses.length, s = Math.min(0.62, (rowH - 30) / 400);
let svg = '<rect width="1080" height="1350" fill="#FFF4F7"></rect>';
poses.forEach((p, r) => {
  const y = rowH * (r + 1) - 10;
  svg += '<text x="16" y="' + (y - rowH / 2) + '" font-family="Fredoka" font-weight="700" font-size="30" fill="#3A0B30">' + p + '</text>';
  cast.forEach((n, i) => { svg += K.who(n, 260 + i * 190, y, s, { pose: p, mouth: 'smile' }); });
});
const props = path.join(ROOT, 'out', 'pose-sheet.json');
fs.mkdirSync(path.dirname(props), { recursive: true });
fs.writeFileSync(props, JSON.stringify({ svg }));
execFileSync('npx', ['remotion', 'still', 'Slide', 'out/pose-sheet.jpg', '--props=' + props, '--image-format=jpeg', '--log=error'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
console.log('out/pose-sheet.jpg');
