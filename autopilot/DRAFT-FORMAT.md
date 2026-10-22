# Reel draft format (autopilot/drafts/<id>.json)

One JSON file per reel. The render workflow voices it, animates it, uploads it and books its posting slot.
**Best example to copy: `autopilot/drafts/KG-2026-10-22-c.json` (Diwali safai wali Housie): dressed sets, props, flow,
room tone, cover.** Use the `scene` kit for almost every shot; the older kits are only for phone chats, camera apps, maps.
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
- `kit` (required): `scene` (default) | `phone` | `camera` | `map` | `hook` | `solo` | `duo` | `room` | `door` | `card`
- `lines`: spoken lines in order. The shot lasts as long as its lines (+ `hold`, default 0.6 s). No lines: set `dur` (seconds).
  - `who`: Tanya, Ruhi, Shruti, Myra, Tina, Megha, Avika, Ishita, Zoya, Aditi, or `ALL` (chorus)
  - `text`: Hinglish in Roman script = the on-screen caption (max ~60 characters)
  - `say`: the same line in Devanagari for the voice (required for everyone except Zoya, who reads `text`)
  - `punch: true` on the punchline (zoom punch + pop), `silenceBefore: true` for a comic pause (cricket), `gap` seconds after the line (default 0.12; 0.03-0.05 for quick overlapping replies), `beat`: hook/setup/escalation/turn/button
- `hook`: ["line 1", "line 2"] big text banner (first shot only, ≤ 6 words a line, simple Hindi/Hinglish, no jargon). Captions are hidden while a hook shows.
- `chip`: short label pill (e.g. "attempt 9", "pink #3")
- `stickers`: [{ "kind": "sweat|spark|question|exclaim|heart|bulb|bolt|car|plane|palace|home", "x": 820, "y": 420, "at": 0.3, "s": 1 }] (x 0-1080, y 0-1920; keep y between 380 and 1300)
- `props`: [{ "name": "Samosa plate", "x": 300, "y": 1650, "s": 2 }] (x,y = where the prop's base sits)
- `clock`: { "h": 4, "m": 30 } small wall clock top right
- `camera`: "still" to stop the slow push-in, "punch" / "push" for energy
- `music`: false on a shot to cut the party music (e.g. before a reveal; the villain riff or thunder carries it)
- `sfx`: [{ "at": 0.1, "name": "doorbell", "vol": 0.5 }] seconds after the shot starts. Names: whoosh, whip, pop, cricket, shutter, ping, scratch, sting, boing, slurp, thud, heartbeat, calc, doorbell, creak, clap, chimes, thunder, villain, sitar, gasp, cage (Housie balls tumbling), ballpop, swish, sparkle, crowd, rip, riser, tick, sparkle, impact, riser, ballpop, tick, flatline, rip, slap, swish, crowd
  (Automatic already: whip on every cut, pop on stickers and punchlines, ping on chat messages, shutter on camera flash, whoosh on hooks, cricket on silenceBefore.)

## Top-level extras
- `ambience`: { "name": "crowd", "vol": 0.1 } soft party chatter under the whole reel (use it for every party scene).
- `pace`: voice speed boost in % (default 18; 24 for snappy comedy).

## The scene kit (dressed sets; use for almost every shot)
`{ "kit": "scene", "set": "living" | "entrance" | "camera", "banner": "DIWALI HOUSIE", "front": true, "night": true, "flash": true, "focus": [540, 910], "chars": [...] }`
- `living`: Tanya's living room (window, frames, sofa, lamp, plant, rug, wooden floor). `banner` adds a theme film-strip banner,
  `front: true` adds the snack table in the foreground. Sofa seats: y 1330, s 1.25. Standing: y 1700-1760, s 1.9-2.3.
- `entrance`: inside the front door (B-204 plate, shoe rack, doorbell). Guest in the doorway: x 790, y 1460, s 2.15; host in
  front: x 290, y 1800, s 2.0. `night: true` makes the doorway dark (villain entry).
- `camera`: a real phone camera screen around the living room; `flash` true, `focus` [x,y] draws the yellow focus box.
- `chars`: each { name, x, y (feet), s (scale), pose, eyes, mouth, turn, prop, look, from, moveAt, moveDur, twirl, hop }.
  Max 3 per shot. `look`: chandni | geet | basanti | gabbar (costumes). `from`: [x, y] walks her in from there over `moveDur` s
  (starting at `moveAt`). `twirl`: true spins her once.
- `props` here also accept story props: Clapboard, Popcorn, Horse stick, Mocktail tray, Lightning, Ladder, Jhaadu, Duster,
  Bucket, Clothes pile, Cobweb, and "Ball 7" / "Ball 45" (a Housie ball with that number). Props take `rot` and `at` (pops in).
- `chip` with `chipY` (e.g. 1560 low, 600 high): the mute-proof label, e.g. "7 = PANKHA SAAF".

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

## Cover (required)
- `cover`: { "shot": index of the strongest shot (usually the twist), "at": seconds into that shot, "title": ["short line 1", "short line 2"] }.
  The title is the premise in under 25 characters per line (e.g. "Kitty theme: BOLLYWOOD", "Tina aayi Gabbar banke!"). It is posted as the reel cover.
