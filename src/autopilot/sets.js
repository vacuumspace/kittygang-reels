// Dressed sets, costumes and story props shared by the storyboard and the video, so the reel looks exactly
// like the approved board. A set is a full room with real furniture and props, never a bare colour card.
import { PROPS } from '../kg/props';

const PLUM = '#3A0B30', PINK = '#E85D8A', YEL = '#FFD166';
const ALL = Object.fromEntries(Object.values(PROPS).flat());

// ---------- story props drawn for reels (120 x 120 box, standing on y = 108) ----------
const STORY = {
  Clapboard: '<rect x="14" y="44" width="92" height="64" rx="6" fill="' + PLUM + '"></rect><g transform="rotate(-14 14 44)"><rect x="14" y="26" width="92" height="18" rx="4" fill="#FFFFFF"></rect>' + [0, 1, 2, 3].map((i) => '<path d="M' + (22 + i * 22) + ' 26 L' + (34 + i * 22) + ' 26 L' + (26 + i * 22) + ' 44 L' + (14 + i * 22) + ' 44 Z" fill="' + PLUM + '"></path>').join('') + '</g><rect x="22" y="58" width="76" height="6" rx="3" fill="#FFFFFF" opacity="0.7"></rect><rect x="22" y="74" width="50" height="6" rx="3" fill="#FFFFFF" opacity="0.7"></rect><rect x="22" y="90" width="64" height="6" rx="3" fill="#FFFFFF" opacity="0.7"></rect>',
  Popcorn: '<path d="M30 40 C26 22 46 14 54 24 C58 10 78 12 80 26 C92 18 104 32 92 42 Z" fill="#FFF3D1"></path><path d="M28 40 L92 40 L84 108 L36 108 Z" fill="#FFFFFF"></path>' + [0, 1, 2].map((i) => '<path d="M' + (38 + i * 18) + ' 40 L' + (46 + i * 18) + ' 40 L' + (44 + i * 16) + ' 108 L' + (38 + i * 16) + ' 108 Z" fill="#E8458B"></path>').join(''),
  'Horse stick': '<path d="M40 118 L66 20" stroke="#A86E44" stroke-width="7" stroke-linecap="round"></path><g transform="translate(70 18) scale(0.5)"><path d="M-30 30 C-40 -10 -10 -40 20 -40 C50 -40 64 -20 60 0 L40 6 C30 20 10 30 -30 30 Z" fill="#FFFFFF" stroke="' + PLUM + '" stroke-width="5"></path><path d="M-10 -36 C0 -60 30 -60 40 -40" stroke="#C42F72" stroke-width="10" fill="none"></path><rect x="20" y="-24" width="8" height="8" rx="4" fill="' + PLUM + '"></rect></g>',
  'Mocktail tray': '<rect x="4" y="96" width="112" height="10" rx="5" fill="#C98A5C"></rect><g transform="translate(15 6) scale(0.75)">' + (ALL['Mocktail glasses'] || '') + '</g>',
  'Lightning': '<path d="M70 4 L30 62 L56 62 L40 116 L92 46 L64 46 L82 4 Z" fill="' + YEL + '"></path>',
};
export const propSvg = (name) => STORY[name] || ALL[name] || '';
// prop centred at cx, standing on by, w px wide
export const put = (n, cx, by, w, rot = 0) => '<g transform="translate(' + (cx - w / 2) + ' ' + (by - w * 0.9) + ') scale(' + (w / 120) + ')' + (rot ? ' rotate(' + rot + ' 60 108)' : '') + '">' + propSvg(n) + '</g>';

// ---------- costumes (local figure coords 240 x 384) ----------
const beard = '<g transform="translate(0 -20)"><path d="M74 150 C78 196 108 214 120 214 C132 214 162 196 166 150 C156 176 140 186 120 186 C100 186 84 176 74 150 Z" fill="#2A1E1A" opacity="0.92"></path><path d="M96 156 C104 148 114 150 120 154 C126 150 136 148 144 156 C134 160 126 160 120 158 C114 160 106 160 96 156 Z" fill="#1A1210"></path>'
  + [[92, 176], [104, 190], [120, 196], [136, 190], [148, 176], [84, 164], [156, 164]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="2.2" fill="#000"></circle>').join('') + '</g>';
const bullets = (() => { let o = '<path d="M78 200 L166 278" stroke="#5A3A1E" stroke-width="16" stroke-linecap="round"></path>'; for (let i = 0; i < 7; i++) { const t = i / 6, x = 82 + t * 80, y = 204 + t * 70; o += '<rect x="' + (x - 3) + '" y="' + (y - 11) + '" width="7" height="15" rx="3" fill="#E0B44A" transform="rotate(42 ' + x + ' ' + y + ')"></rect>'; } return o; })();
export const WARDROBE = {
  chandni: { outfit: 'saree', main: '#FFE36E', mainSh: '#E8C23E', blouse: '#FFD23F', pallu: '#FFF6C2', border: '#FFFFFF', braid: '', hairStyle: 'long', prop: '' },
  geet: { overlay: '<path d="M92 188 C86 214 88 240 94 262 M148 188 C154 214 152 240 146 262" stroke="#6E52D0" stroke-width="9" fill="none" stroke-linecap="round"></path>', outfit: 'kurta', main: '#FF8FB1', mainSh: '#E0668D', motif: '#FFFFFF', dupatta: '#7AD3B8', bottom: '#FFFFFF', bottomSh: '#E6E0E8', prop: '', specs: true },
  basanti: { outfit: 'chaniya', main: '#E8458B', alt: '#FFD166', choli: '#2FA37A', dupatta: '#FF7A6B', border: '#FFD166', accent: '#FFFFFF', shoeKind: 'jutti', shoe: '#FFD166', overlay: '', print: '' },
  gabbar: { outfit: 'shirt', main: '#8A7A4A', mainSh: '#6A5A34', bottom: '#5A5A3A', bottomSh: '#3A3A24', shades: false, ear: '', bag: '', shoe: '#3A2A1A', shoeKind: 'heel', headProp: beard, overlay: bullets, lip: '#8A2A2A' },
};

// ---------- sets ----------
const filmBanner = (y, text) => { let o = '<g transform="rotate(-2 540 ' + (y + 70) + ')"><rect x="80" y="' + y + '" width="920" height="150" rx="10" fill="' + PLUM + '"></rect>'; for (let i = 0; i < 23; i++) o += '<rect x="' + (100 + i * 40) + '" y="' + (y + 12) + '" width="22" height="16" rx="4" fill="#FFF4F7"></rect><rect x="' + (100 + i * 40) + '" y="' + (y + 122) + '" width="22" height="16" rx="4" fill="#FFF4F7"></rect>'; return o + '<text x="540" y="' + (y + 98) + '" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="64" fill="' + YEL + '" letter-spacing="6">' + text + '</text></g>'; };
const floorWood = (y) => '<rect y="' + y + '" width="1080" height="' + (1920 - y) + '" fill="#E9B98F"></rect>' + [0, 1, 2, 3, 4, 5].map((i) => '<path d="M0 ' + (y + 60 + i * 110) + ' L1080 ' + (y + 60 + i * 110) + '" stroke="#D9A57A" stroke-width="5"></path>').join('') + '<rect y="' + (y - 18) + '" width="1080" height="22" fill="#FFFFFF"></rect>';
// banner sits below the caption zone (captions live at y 170-330)
const living = ({ banner, night } = {}) => '<rect width="1080" height="1920" fill="' + (night ? '#E8C9D6' : '#FFE4EC') + '"></rect>'
  + (banner ? filmBanner(380, banner) : put('Wall clock', 590, 620, 140))
  + put('Window with curtains', 190, 900, 330) + put('Wall photo frames', 880, 860, 280)
  + floorWood(1260)
  + put('Indoor plant', 80, 1330, 230) + put('Sofa', 540, 1330, 720) + put('Floor lamp', 990, 1320, 300)
  + put('Clapboard', 870, 1060, 170) + put('Rug', 540, 1800, 1000);
const livingFront = () => put('Tea table', 540, 1930, 560) + put('Samosa plate', 440, 1770, 170) + put('Popcorn', 560, 1770, 120) + put('Mocktail glasses', 680, 1770, 140);
const entrance = ({ night } = {}) => '<rect width="1080" height="1920" fill="#FFF0E6"></rect>'
  + '<rect y="1440" width="1080" height="480" fill="#F3DCCB"></rect>' + [0, 1, 2, 3].map((i) => '<path d="M0 ' + (1520 + i * 110) + ' L1080 ' + (1520 + i * 110) + '" stroke="#E6C8B2" stroke-width="5"></path>').join('') + [1, 2, 3, 4, 5].map((i) => '<path d="M' + (i * 216) + ' 1440 L' + (i * 216 - 60) + ' 1920" stroke="#E6C8B2" stroke-width="5"></path>').join('')
  + put('Wall photo frames', 300, 800, 300) + put('Wall shelf', 300, 1010, 260)
  + '<rect x="600" y="420" width="380" height="1040" rx="14" fill="#A86E44"></rect><rect x="630" y="450" width="320" height="1000" fill="' + (night ? '#2E1B3E' : '#FFF8DE') + '"></rect>'
  + (night ? '' : '<rect x="630" y="450" width="320" height="1000" fill="#CFE8F7" opacity="0.35"></rect>' + put('Balcony plants', 790, 1120, 260) + put('Lift doors', 860, 900, 160))
  + '<path d="M630 450 L560 480 L560 1440 L630 1450 Z" fill="#C98A5C"></path><rect x="572" y="900" width="14" height="60" rx="7" fill="' + YEL + '"></rect>'
  + '<rect x="996" y="760" width="60" height="70" rx="10" fill="#FFFFFF" stroke="' + PLUM + '" stroke-width="3"></rect><rect x="1014" y="780" width="24" height="24" rx="12" fill="' + PINK + '"></rect>'
  + '<rect x="420" y="560" width="150" height="70" rx="12" fill="#C98A5C"></rect><text x="495" y="608" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="34" fill="#FFF3D1">B-204</text>'
  + put('Shoe rack', 140, 1480, 240) + put('Heels', 300, 1480, 110) + put('Handbag', 160, 1270, 110) + put('Indoor plant', 1010, 1470, 170)
  + put('Door mat', 790, 1520, 360);
export const SETS = { living, entrance };
export const FRONTS = { living: livingFront };

// real phone camera app around any inner scene (inner drawn in full-frame coords, squeezed into the viewfinder)
export const cameraUI = (inner, { flash = false, focus } = {}) => '<rect width="1080" height="1920" fill="#0D0B10"></rect><clipPath id="cvf"><rect x="40" y="260" width="1000" height="1300" rx="30"></rect></clipPath><g clip-path="url(#cvf)"><g transform="translate(40 260) scale(0.926 0.677)">' + inner + '</g>'
  + (focus ? '<path d="M' + (focus[0] - 150) + ' ' + (focus[1] - 110) + ' l0 -40 l40 0 M' + (focus[0] + 110) + ' ' + (focus[1] - 150) + ' l40 0 l0 40 M' + (focus[0] - 150) + ' ' + (focus[1] + 110) + ' l0 40 l40 0 M' + (focus[0] + 110) + ' ' + (focus[1] + 150) + ' l40 0 l0 -40" stroke="' + YEL + '" stroke-width="7" fill="none"></path>' : '')
  + '<path d="M373 260 L373 1560 M707 260 L707 1560 M40 693 L1040 693 M40 1127 L1040 1127" stroke="#FFFFFF" stroke-width="3" opacity="0.5"></path>' + (flash ? '<rect x="40" y="260" width="1000" height="1300" fill="#FFFFFF" opacity="0.7"></rect>' : '') + '</g>'
  + '<text x="110" y="196" font-family="Fredoka" font-weight="600" font-size="38" fill="#FFFFFF">HDR</text><text x="960" y="196" font-family="Fredoka" font-weight="600" font-size="38" fill="#FFFFFF">3s</text>'
  + '<text x="540" y="1640" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="34" fill="#8A8590" letter-spacing="2">VIDEO      <tspan fill="' + YEL + '">PHOTO</tspan>      PORTRAIT</text>'
  + '<rect x="110" y="1700" width="120" height="120" rx="24" fill="#F7A8C6" stroke="#FFFFFF" stroke-width="6"></rect><rect x="440" y="1660" width="200" height="200" rx="100" fill="none" stroke="#FFFFFF" stroke-width="12"></rect><rect x="465" y="1685" width="150" height="150" rx="75" fill="#FFFFFF"></rect><rect x="850" y="1700" width="120" height="120" rx="60" fill="#333"></rect>';
