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
