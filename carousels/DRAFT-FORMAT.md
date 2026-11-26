# Kitty Game Ideas draft format (carousels/drafts/KGI-NNN.json)

See `drafts/KGI-002.json` (Newspaper Dance) for a complete example. Slides are built by `carousels/build.js` in the
locked template: cover (Kitty Game Ideas #N + game name), Kya chahiye, 3 to 5 steps, Rules, Level up, sign-off.
The top bar shows the game name; Instagram numbers the slides itself.

```
{
  "id": "KGI-003", "n": 3,                         // next number after the last draft
  "slug": "chopstick-rasgulla-race-kitty-game",   // url: kittyparty.club/kitty-game-ideas/<slug>
  "game": "Chopstick Race",                         // 2-4 words, fits the cover card
  "tagline": "Short Hinglish hook, max 30 chars",
  "cover_art": [ ...drawing ],                      // the game in one picture
  "need":  { "title": "...", "body": "optional", "items": [ { "label": "Paper cups", "sub": "10 per team", "draw": [ ... ] } ] },  // 2-6 items
  "steps": [ { "title": "max 6 words", "body": "one line, max 14 words", "draw": [ ... ] } ],  // 3-5 steps
  "rules": { "title": "how you win, max 6 words", "items": [ { "ok": false, "text": ["line 1", "line 2"] } ] },  // 3-4, last one usually ok:true
  "levels": { "title": "Aur mazedaar banao", "items": [ ["line 1", "line 2"] ], "tip": "one practical tip" },     // 3 twists
  "comment_hint": "2-3 words for the Comment icon, e.g. kaun jeeta?",
  "caption": "1-2 Hinglish lines + a question for comments. No app mention.",
  "hashtags": ["#kittyparty", "#kittypartygames", "#kittypartyideas", "#ladieskitty", "#partygames", "#<game>"],
  "web": {
    "title": "<Game>: Kitty Party Game Rules, How to Play and Fun Twists",   // under 70 chars ideally
    "description": "150-160 chars, says what the game is and what the page covers",
    "intro": "2-4 sentences. First sentence answers what the game is; second says how you win.",
    "players": "8 to 20", "time": "10 to 15 minutes",
    "materials": ["..."], "steps": ["full sentence per step"], "rules": ["..."],
    "variations": ["..."], "tips": ["..."],
    "faq": [ { "q": "How many players do you need for <game>?", "a": "..." } ]   // 5 questions
  }
}
```

## Drawing (`draw` lists)
A drawing is a list of primitives `{ "k": "<name>", ...params }`. Coordinates are free: the builder measures the
drawing and scales it to fill its panel, so design each picture on roughly a 960 x 700 canvas (steps), 300 x 220
(need items) or 1080 x 360 (cover art). Keep everything you draw for one picture in one consistent coordinate space.
Colours: "pink", "yel", "green", "ink", "mute", "white", "blue" or any "#hex".

| k | params | what |
|---|---|---|
| person | x, y (centre of body), s, color, label | player from the waist up; feet line is y + 80*s |
| blindfold | x, y, s | player with a blindfold |
| hand | x, y, rot, s | hand holding something (rot to aim it) |
| cup | x, y (bottom centre), s, color, rot | paper cup mouth-down |
| cupTop | x, y, r | cup seen from above |
| pyramid | x, y (base), rows [4,3,2,1], s, hi (row to highlight) | cup tower |
| band | x, y, rx, ry, w | rubber band / ring |
| string | x1, y1, x2, y2, bend, color | thread, rope, dupatta line |
| arrow | x1, y1, x2, y2, color, w | movement or sequence |
| paper | x, y, w, fold (1, 0.5, 0.25) | newspaper on the floor |
| chit | x, y, s, text, rot | paper slip with a word |
| bowl | x, y, s, color | bowl for chits / sweets |
| plate | x, y, s | plate |
| spoon | x, y, s, rot, lemon (true) | spoon (with lemon) |
| bottle | x, y, s, rot, color | bottle |
| balloon | x, y, s, color | balloon |
| dice | x, y, s, rot, n (1-6) | dice |
| card | x, y, s, rot, text, color | playing card / word card |
| timer | x, y, s, text | phone showing a timer |
| clock | x, y, r | wall clock |
| speaker | x, y, s | music speaker |
| note | x, y, s, color | music note |
| spool | x, y, s | thread spool |
| table | x, y, w, h, top (true = seen from above) | table |
| box | x, y, w, h, color, text | anything else: a labelled box ("mehendi cone", "saree") |
| cross / tick | x, y, s | wrong / right mark |
| text | x, y, text, size, color, a ("start"/"middle"), rot | label or callout |
| svg | markup | raw SVG shapes (rect, path, ellipse, line, polygon) when nothing else fits |

## The reel (required): a SIMPLE step-by-step explainer, PLAYED OUT by the Kitty Gang (no whiteboard)
The game is posted as a REEL (Instagram, Facebook, YouTube "Kitty Game Ideas" playlist). The slides above are only for
the website page. The user's rules (2026-11-26): a simple, clear script; NO whiteboard; show the characters playing;
superb animation. Copy `carousels/examples/KGI-037-play-scenes.json` (Ghanti Pakdo): its shots, layout and timing.

Automatic (never write them): the "Kitty Game Ideas #N" title card first (read out, also the cover; give `"gameSay"`, the
game name in Devanagari), the day's app theme music low underneath, pink wipe transitions, slower calm voices with
~0.7 s between speakers.

### The script (about 70-90 words, 50-60 s)
One explainer (Tanya, Ruhi, Shruti...) and one friend (Myra, Avika, Zoya...). The friend asks for a new game, the
explainer says "main step by step batati hun", then ONE line per step, in the order you play it: what you need, how
everyone sits, the main rule, the twist, how you win. The friend asks at most one simple question, and ends with "is
Sunday ki kitty mein yahi khelenge". Every line is a complete, plain sentence (6-16 words). No jokes inside the rules,
no fake-outs, no slang a 50-year-old would not use. Show it, then say it once.

### The shots (8-11)
1. Friend + explainer standing in the party room (2 lines).
2. KYA CHAHIYE: the explainer alone; the props DROP IN one by one (`game` items with `at`), the main prop rings or pops.
3. One shot per step with `label: { kicker: "STEP 1", text: "<6 words>" }`; the explainer's line is the voice-over while
   the gang does it (players walk in with `from`, the host sits on the sofa reading, etc.).
4. After the main rule and after the twist: a silent ACTION shot (`dur` 2.4-2.8, no lines): a player grabs / throws /
   does the move (`game` item with `grab: { who, at }` + that player's `poseAt: { at, pose: "wave" }`), `ring`, a
   floating score (`pops: [{ text: "+1", x, y, at, color: "green" }]` or "-1" red), camera `focus: { x, y, z: 1.25, at: 0.2 }`,
   and sfx (whoosh, chimes, boing, waah, haww, clap).
5. JEET: `label` with the win rule, winner holding the prop, `confetti: 0.3`, score `chip`.
6. Friend + explainer: the friend says she will play it at her kitty.
Layout that works: host on the sofa (x 540, y 1330, s 1.25, pose "hold" + prop "phone"); two players standing at
x 230 and x 800 (y 1760, s 2), the game props between them (box about x 365-715, y 1200-1620). The raised "wave" hand is
always her screen-right hand, so the grabbed prop flies to (x + 150, y - 520) for s 2. Keep `label` text short.

### Shot fields
- `kit: "scene"`, `set: "living"`, `decor: true`, `chars` [{ name, x, y, s, turn, pose, mouth, eyes, prop, from, moveAt,
  moveDur, hop, poseAt }] (max 3), `lines`, `label`, `chip` + `chipY` (600-640), `game` (list of { need: <Kya chahiye index>,
  box: [x, y, w, h], at, ring: { at }, grab: { who, at, dur } }), `pops`, `focus`, `confetti`, `sfx`, `stickers`, `dur`, `hold`.
- Draw each `need` item so it stands alone in a scene: one clear real object, real colours, no stick figures.
- `rev`: bump it (2, 3...) to remake a reel that is booked but not posted yet. `experiment`: { hook, variable, hypothesis }.
- Lines: `who`, `text` (Roman Hinglish caption), `say` (Devanagari; ai sound as े: है -> हे, मैं -> में), optional `gap`, `beat`.

### Poses (make new ones whenever a game needs them)
Poses: relaxed, wave, hold (+ prop phone|calc|keys|bottle), phone2, hips, cup, talkR, talkL, clapR, clapL, twirl, laughs,
and (src/kg/poses2.js) cheer, reach, pointUp, shrug, thinking, facepalm, present. Seated on a chair: `seated: true`, or
`sitAt` / `standAt` (seconds into the shot) to sit down / stand up; seated hands should be above the lap (clapR, laughs,
cheer, thinking, hold, shrug). Mid-shot change: `poseAt: [{ at, pose, mouth, eyes }]`. A grabbed prop lands in the
screen-right hand of the pose she has at that moment (or `grab.pose`).
If the game needs a move no pose shows (throwing, holding a ball up with both hands, covering eyes, passing something...),
ADD the pose: a new entry in `src/kg/poses2.js` (elbow + hand per arm in the 240 x 400 character frame, hands from the
existing hand library), then run `node scripts/kg/pose-sheet.js <name>` and look at out/pose-sheet.jpg: every character
must read clearly (hands at the wrist, nothing crossing the face oddly). Fix and re-check, then use it. Never change the
existing poses or the character look.
