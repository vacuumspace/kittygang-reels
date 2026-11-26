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

## The reel (required since 2026-11-26): the Kitty Gang PLAYS the game, then explains it
The game is posted as a REEL (Instagram, Facebook, YouTube Shorts playlist "Kitty Game Ideas"), not a carousel. The
slides above are still built, for the website page only. The user's bar: never boring. Good visuals, a dressed party
room, the gang actually playing with the game's real props, and a funny moment. A reel that only explains is a fail.

Shape (55-70 s, 7-8 shots, about 110-130 spoken words in total). Copy `drafts/KGI-037.json` (Ghanti Pakdo) and `drafts/KGI-036.json` (rev 2).
0. TITLE CARD (automatic, never write it): the locked "Kitty Game Ideas #N" cover with the game name opens every reel and is
   its cover image; the explainer reads "Kitty Game Ideas number N: <game>". Give `"gameSay"`: the game name in Devanagari.
   Theme music (the app's booked theme of the day) plays low under the whole reel automatically.
1. HOOK SCENE (right after the card): the gang already mid-game, the funniest or most chaotic moment of the game, with the props.
   `hook` banner (2 short lines, the payoff, e.g. "1 ghanti, / poori kitty paagal!"), one shouted line, `punch: true`.
2. "WHAT IS THIS?" BOARD (show: cover): a friend who just walked in asks, the explainer names the game in one line.
3. 2-3 BOARDS, fast (need, the 1-2 steps that matter, the twist). Merge steps in speech; never one board per step if
   the reel gets long. The friend asks one naive question per board.
4. PLAY SCENE: the gang plays one round. Someone does it wrong in a very human way (overthinks, mummy ji ka rule,
   grabs too early) and gets caught. `chip` = live score or the called item ("PANEER: CHALEGA?"), `tick` sfx for a timer.
5. WINNER SCENE: `confetti: true`, the winner's line in character, then the friend decides to play it at her kitty
   (the button). Optional prize prop (`game` with the prize item).

### Shot fields for game reels
- Board shots: `{ "kit": "board", "show": "cover" | "need" | "step 2" | "rules" | "levels", "chars": [explainer, friend], "lines": [...] }`.
  The drawing builds up piece by piece while she talks. `title` overrides the heading; `draw` + `title` = a custom board.
  Chars default under the board (x 220 / 860, y 1850, s 1.5); set `name`, `x`, `turn`, `pose`, `mouth`, `eyes`, `hop`.
  No `chip`, `hook` or `banner` on boards. Fairy lights + balloons are added automatically (`"decor": false` to drop).
- Scene shots (hook, play, winner): autopilot/DRAFT-FORMAT.md scene kit (`set: "living"`, chars with x/y/s, sofa seats
  y 1330 s 1.25, standing y 1760 s 2-2.1) plus:
  - `"decor": true` party dressing (fairy lights, balloons, gift). Always on for game reels.
  - `"game"`: the game's REAL props in the room, one placement or a list: `{ "need": <index of a Kya chahiye item>, "box": [x, y, w, h] }`
    (or `"show": "step 2"` / `"draw": [...]`). Use `need` items: real objects, never the stick-figure diagrams.
    Stacking example (bell on a stool, from KGI-037): `[{ "need": 1, "box": [315, 1300, 450, 330] }, { "need": 0, "box": [315, 1112, 450, 330] }]`.
    Keep props between the two standing characters (x 300-780) and big (box 250-450 wide). Draw your need items
    so each one can stand alone in a scene (one clear object per item, real colours).
  - `"confetti": true` on the winner shot. `chip` + `chipY` 600 (or 860 on the hook shot, above heads).
- `cover`: automatic (the title card). `rev`: bump it (2, 3...) to remake a reel that is booked but not posted yet.
- `experiment`: `{ "hook", "variable", "hypothesis" }` (what this reel tests; see carousels/LEARNINGS.md).
- `pace` (optional, default 4). Lines: `who`, `text` (Roman Hinglish caption, up to ~80 characters), `say` (Devanagari,
  ai sound as े: है -> हे, मैं -> में, कैसे -> केसे), optional `gap`, `punch` (1-3 a reel), `beat`.
- Cast: rotate explainer + friend pairs (Tanya/Myra, Shruti/Avika, Ruhi/Zoya, Aditi/Megha...) and use the
  characters' real personalities in the play scene (Ishita competitive, Shruti precise, Megha + samosa, Avika late).

### How the script must sound (the user's rule: human, never robotic)
Write it like the app How-to-play reels the team loved (autopilot/HUMAN-EXAMPLES.md): friends chatting, not a teacher.
- The friend asks the naive, real questions a viewer would ask ("Ghanti? Mandir wali?"). The explainer answers
  casually, in her own words. Every line reacts to the one before. The board shows the rule; she talks around it.
- Small real details: Sunday wali kitty, mummy ji ka rule, chai, the bell from the mandir, late again.
- EVERY LINE IS A COMPLETE SENTENCE a person would say out loud (user 2026-11-26: "too fast, unfinished, robotic").
  No fragments ("Minus ek!" alone), no lines that start with "...", no clipped rule-speak. 6-14 words a line, max 2 lines
  per speaker turn, about 16-18 lines in the whole reel. "yaar", "na", "arre", "achha", "toh" where natural. Real Hinglish.
- Pace is set for you: slower voices and about 0.7 s between speakers. Do not set `pace` or `gap` except `gap: 0.3` when
  someone is cut off mid-sentence on purpose.
- Never sell: no app, no price, no "follow karo" in lines. The caption asks the comment question.
- Self-test: read it aloud. If any line sounds like an ad, a teacher or a robot, rewrite it.
