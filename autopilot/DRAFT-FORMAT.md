# Reel draft format (autopilot/drafts/<id>.json)

One JSON file per reel. The render workflow voices it, animates it, uploads it and books its posting slot.
`id`: `KG-YYYY-MM-DD-a` (first reel of the day) or `-b`. Never reuse an id.

```json
{
  "id": "KG-2026-10-22-a",
  "title": "Next kitty kiske ghar?",
  "format": "Living-room sitcom",
  "idea": "Everyone dodges hosting; the new girl agrees, then makes it a potluck.",
  "beats": "hook: hosting dread / esc x3: painting, Dubai, gym / turn: potluck / button: Ruhi repeats excuse",
  "caption": "Har kitty group mein ek Myra hoti hai. Tag yours.",
  "hashtags": ["#kittyparty", "#kittygang", "#kittypartygames", "#ladieskitty", "#housie"],
  "shots": [
    { "kit": "room", "hook": ["Jab next kitty", "kiske ghar?"], "chars": [{ "name": "Ruhi" }, { "name": "Tanya", "pose": "talkR" }, { "name": "Shruti" }], "dur": 1.6 },
    { "kit": "solo", "char": { "name": "Tanya", "pose": "talkR" },
      "lines": [{ "who": "Tanya", "text": "Achha suno! Next kitty... kiske ghar?", "say": "अच्छा सुनो! नेक्स्ट किटी... किसके घर?", "beat": "setup" }] }
  ]
}
```

## Shot fields
- `kit` (required): `hook` | `solo` | `duo` | `room` | `phone` | `camera` | `map` | `door` | `card`
- `lines`: spoken lines in order. The shot lasts as long as its lines (+ `hold`, default 0.6 s). No lines: set `dur` (seconds).
  - `who`: Tanya, Ruhi, Shruti, Myra, Tash, Megha, Avika, Ishita, Zoya, Aditi, or `ALL` (chorus)
  - `text`: Hinglish in Roman script = the on-screen caption (max ~60 characters)
  - `say`: the same line in Devanagari for the voice (required for everyone except Tash and Zoya, who read `text`)
  - `punch: true` on the punchline (zoom punch + pop), `silenceBefore: true` for a comic pause (cricket), `gap` seconds after the line (default 0.35), `beat`: hook/setup/escalation/turn/button
- `hook`: ["line 1", "line 2"] big text banner (first shot only, ≤ 6 words a line, simple Hindi/Hinglish, no jargon). Captions are hidden while a hook shows.
- `chip`: short label pill (e.g. "attempt 9", "pink #3")
- `stickers`: [{ "kind": "sweat|spark|question|exclaim|heart|bulb|car|plane|palace|home", "x": 820, "y": 420, "at": 0.3, "s": 1 }] (x 0-1080, y 0-1920; keep y between 380 and 1300)
- `props`: [{ "name": "Samosa plate", "x": 300, "y": 1650, "s": 2 }] (x,y = where the prop's base sits)
- `clock`: { "h": 4, "m": 30 } small wall clock top right
- `camera`: "still" to stop the slow push-in
- `sfx`: [{ "at": 0.1, "name": "doorbell", "vol": 0.5 }] seconds after the shot starts. Names: whoosh, whip, pop, cricket, shutter, ping, scratch, sting, boing, slurp, thud, heartbeat, calc, doorbell, creak, clap, chimes, sparkle, impact, riser, ballpop, tick, flatline, rip, slap, swish, crowd
  (Automatic already: whip on every cut, pop on stickers and punchlines, ping on chat messages, shutter on camera flash, whoosh on hooks, cricket on silenceBefore.)

## Kits
- `solo`: `char` {name, pose, eyes, mouth, turn, ...outfit colours}. One friend on her own colour card.
- `duo`: `chars` [a, b]. Split screen for a comeback (they face each other automatically).
- `room`: `chars` 1 to 4 on the sofa.
- `door`: `chars` up to 3; `"at": "door"` puts one in the doorway. `night` / `sunrise` true for time jumps.
- `phone`: `chat` [[who, text, me(0|1), "time", appearAtSeconds]], `title`, `typing`: "Avika". Chat bubbles show the text, so no caption.
- `camera`: `chars` up to 4 framed in a camera app; `attempt` number, `label`, `flash` true, `front` true (selfie, first char).
- `map`: live location: `from` [x,y], `to` [x,y] (dot moves). Add `clock`.
- `hook`: optional `char`; pure hook card.
- `card`: plain colour (`bg`).

## Character options
- `pose`: relaxed, wave, hold (+ `prop`: phone|calc|keys|bottle), phone2, hips, cup, talkR, talkL, clapR, clapL, twirl, laughs
- `eyes`: open, laugh, half, side · `mouth`: smile, laugh, smirk, o, flat (mouths move automatically while she talks)
- `turn`: -1 (looks left) to 1 (looks right). Face whoever is talking.
- `hop`: true (bouncing), outfit overrides: `main`, `mainSh` colours (e.g. a pink outfit).

## Props library (names)
- Home: Sofa, Armchair, Tea table, Floor lamp, Indoor plant, Wall clock, TV unit, Rug, Window with curtains, Bookshelf
- Kitchen and food: Chai kettle, Cutting chai, Samosa plate, Fafda jalebi, Celebration cake, Thali, Mithai box, Pressure cooker
- Nature: Tree, Palm, Flower bush, Sun, Moon and stars, Cloud, Hills, Marigold
- Festival: Dandiya sticks, Garbo lamp, Diya, Rangoli, Mata ki chowki, Fairy lights, Dhol, Kalash
- Kitty party: Balloons, Gift box, Group chat phone, Housie ticket, Housie ball, Trophy, Party hat, Kitty pot
- City and outside: Car, Auto rickshaw, Scooty, Apartment building, Cafe umbrella, Shopping bags
- Living room extras: Coffee mug, Cushions, Ceiling fan, Wall shelf, Side table + lamp, Wall photo frames, Curtain tie-back, Door mat
- Kitty party table: Pakora plate, Dhokla, Pani puri, Paneer tikka, Mocktail glasses, Cold drink bottles, Chips bowl, Cake slice
- Dressing and style: Saree on hanger, Jewellery box, Lipstick, Hand mirror, Handbag, Heels, Bangles stack, Sunglasses
- Phone and gadgets: Phone + notification, Laptop, Ring light, Camera, Selfie stick, Earbuds case
- Housie and games: Housie cage, Dabber marker, Prize envelope, Scoreboard, Dice, Playing cards
- Time and mood: Alarm clock, Calendar page, Hourglass, Idea bulb, Speech bubble, Heart
- Entrance and outside: Front door, Doorbell, Shoe rack, Lift doors, Balcony plants, Street lamp

Need something that is not here? Use the nearest prop or a sticker, and add the wish to `autopilot/WISHLIST.md` so it gets drawn.

## Clarity fields (required, QA fails without them)
- `logline`: the whole story in one plain sentence a stranger understands.
- `game`: the one repeating funny pattern, e.g. "every excuse gets busted".
- `mute`: array, one entry per beat: what a viewer understands from pictures and captions alone.
- `review.clarity`: must be 5. Total is out of 55 (11 scores).
