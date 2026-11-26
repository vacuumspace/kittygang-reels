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

## The reel (required since 2026-11-26): Kitty Gang explains the game
The game is posted as a REEL (Instagram, Facebook, YouTube Shorts playlist "Kitty Game Ideas"), not a carousel.
Two Kitty Gang friends stand in Tanya's living room next to a whiteboard on an easel; the whiteboard shows the
game's own drawings from this draft (cover art, Kya chahiye, each step, rules, twists). The slides above are still
built, for the website page only.

```
"reel": {
  "title": "Ghanti Pakdo",                          // YouTube title start, 2-4 words
  "logline": "Tanya teaches Myra a new kitty game at the whiteboard ...",
  "cover": { "shot": 5, "at": 0.8, "title": ["Kitty game:", "Ghanti Pakdo!"] },   // cover frame + 2 short lines
  "shots": [
    { "kit": "board", "show": "cover",
      "chars": [ { "name": "Tanya", "x": 230, "turn": 0.5, "pose": "talkR" }, { "name": "Myra", "x": 860, "turn": -0.5 } ],
      "lines": [
        { "who": "Myra", "text": "Is baar kitty mein kuch naya chahiye yaar, pichli baar sab bore ho gaye the.", "say": "इस बार किटी में कुछ नया चाहिए यार, पिछली बार सब बोर हो गए थे।" },
        { "who": "Tanya", "text": "Toh sun, Ghanti Pakdo khelte hain.", "say": "तो सुन, घंटी पकड़ो खेलते हें।", "gap": 0.3 }
      ] },
    { "kit": "board", "show": "need", "chars": [...], "lines": [...] },
    { "kit": "board", "show": "step 1", "chars": [...], "lines": [...] },
    ...
    { "kit": "board", "show": "rules", ... },
    { "kit": "board", "show": "levels", "hold": 0.8, ... }
  ]
}
```
- `show`: `cover` (game name + cover art), `need`, `step 1` ... `step 5`, `rules`, `levels`. Or give `draw` (a drawing list,
  same primitives) and `title` for a custom board. `title` also overrides the board heading.
- Usually one board per step, in order: cover, need, every step, rules, then the ending (levels or rules again).
- `chars`: always 2 (the explainer and the friend). Defaults stand them under the board (x 220 and 860, y 1850, s 1.5);
  only set `x`, `turn`, `pose`, `mouth`, `eyes`, `prop`, `hop`. Never use `chip`, `hook` or `banner` on board shots.
- Any other shot kit from autopilot/DRAFT-FORMAT.md works too (e.g. a `scene` shot of the gang trying the game), but keep
  the board shots as the spine so the viewer can learn the game.
- Lines follow autopilot/DRAFT-FORMAT.md: `who`, `text` (Roman Hinglish caption, up to ~80 characters), `say` (same line in
  Devanagari for the voice, ai sound written as े: है -> हे, मैं -> में, कैसे -> केसे), optional `gap`, `punch`, `beat`.
- `pace` (optional, default 4): voice speed boost in %. Keep it calm; this is two friends talking, not a promo.
- Length: about 35-60 seconds (the render refuses under 15 or over 90 s).

### How the script must sound (the user's rule: human, never robotic)
Write it like the app How-to-play reels the team loved (autopilot/HUMAN-EXAMPLES.md): two friends chatting, not a teacher reading slides.
- The friend (Myra, Megha, Avika...) asks the naive, real questions a viewer would ask ("Ghanti? Mandir wali?",
  "Aur hum bas sunte rahein?"). The explainer (Tanya, Ruhi, Shruti...) answers casually, in her own words.
- Every line reacts to the line before it. No line that only reads the board; the board shows it, she talks around it.
- Small real details: whose kitty is next, Sunday wali kitty, chai, the bell from the mandir, last time everyone was bored.
- Natural length lines (5-15 words), with "yaar", "na", "arre", "achha", "toh sun", a "..." pause where a person would pause.
  Mix short and long. Real Hinglish, no shuddh Hindi, no textbook English.
- One small laugh or surprise (the twist of the game, a friend wanting to cheat), and a warm ending where the friend
  decides to play it at her kitty. No forced punchline every line, no sound-effect jokes, no rhymes.
- Never sell: no app, no price, no "follow karo" in the lines. The caption asks the comment question.
- Self-test: read it aloud. If any line sounds like an ad, a teacher or a robot, rewrite it.
