# Theme Reel Writer (runs every evening in the cloud)

Every night at 12:20 AM IST `.github/workflows/theme.yml` posts a reel about that day's booked Housie theme on
Instagram and YouTube Shorts. You write tonight's reel as a draft. **Every night is a new experiment**: a different
format, so after a couple of weeks the stats tell us what works. The old built-in storylines (POV phone, guess, race)
got 67 to 89% skip and 0 shares; the Kitty Gang sitcom "Diwali safai wali Housie" got 5x the views and 5 shares.
Faces, a story and a payoff beat an app screen.

## Every run
1. `git pull`. Read `theme/data/upcoming.json` (the next 3 days: theme name, colours, reactions, ticket prize groups,
   game times). Tonight's reel is for **tomorrow's IST date** (the reel posts just after midnight): pick the day in
   `days` whose `date` is tomorrow (`TZ=Asia/Kolkata date -d tomorrow +%F`). No theme booked: stop.
2. Read `theme/LEARNINGS.md`, then every reel in `autopilot/tracker.json` with `format: "Theme Housie"` (newest last):
   its `experiment`, `stats.skip` (% who swipe away in the first 3 s: judges the hook, lower is better),
   `stats.watched_pct` (judges the middle), shares, saves, views. Also skim `autopilot/PLAYBOOK.md` (cast, looks,
   humour rules) and `autopilot/DRAFT-FORMAT.md` (shot fields, voices, sfx names).
3. Pick tonight's format from the menu below (or invent one). It must differ from the `experiment.format` of the last
   6 theme reels. Name ONE thing you are testing (`variable`) and what you expect (`hypothesis`). Once LEARNINGS
   shows a clear winner, re-use the winning format at most every 3rd night and keep testing new ones in between.
4. Write `theme/drafts/TH-<date>.json` (format below). Run `node scripts/theme/check.js theme/drafts/TH-<date>.json`
   and fix everything it reports. Then commit "theme reel draft TH-<date>: <title>" and `git push`. Only touch
   `theme/drafts/` and `theme/LEARNINGS.md`.
5. On Sundays also add a dated block to `theme/LEARNINGS.md`: which formats/hooks won and lost this week, with numbers.

## Formats menu (rotate; invent new ones too)
- **sitcom**: two of the gang both need the same last number; calls come; one wins, the other's excuse is the button.
- **guess-the-call**: `tball` quiz rounds with the theme's own number calls (`call`), viewers guess before the reveal; ask for score in comments.
- **types-of-players**: "Har Housie mein 4 log" (the one who checks twice, the one who claims early...), one gang member each, theme art behind.
- **POV-host**: "POV: aap host ho aur 7 baj gaye" chaos before the theme game, payoff on the game screen.
- **countdown**: "3 second mein Full House" fast cuts on `tgame`, the ticket filling, heartbeat, 3-2-1 reveal.
- **expectation-vs-reality**: split with `duo` or back-to-back shots (dressed up for the theme vs playing in pyjamas).
- **challenge**: "Sirf 5 number, ek ticket" or "Spider Web line pehle kaun?" with the theme's prize group names.
- **story-time**: one character tells a 15 s story of last night's game; cut to the moment on the game screen.
- **reaction-chain**: one number called, every member reacts with the theme's reactions (`burst`) and a line each.
- **ASMR / sound-on**: the theme's music and calls carry it, almost no words; hook "Sound ON karo".
- **meme-format**: a known Indian reel pattern (e.g. "Mummy ko pata chal gaya") played with the gang and the theme.

## Draft format
Same as Kitty Gang drafts (`autopilot/DRAFT-FORMAT.md`: shots, lines with Devanagari `say`, chars, stickers, chip,
sfx, `ambience`, `pace`), plus `experiment` and the theme kits. Do NOT add a cover, times card or download card: the
render adds them (cover = theme name + date + all game times; ending = times card, then Download "Kitty Party" app).
```json
{ "title": "...", "format": "...", "idea": "one line", "beats": "hook / setup / ... / button",
  "experiment": { "format": "sitcom", "hook": "what the first 2 s do", "variable": "the one thing tested", "hypothesis": "what we expect, with a number" },
  "caption": "one line, {theme} allowed (times and download line are added automatically)",
  "hashtags": ["#kittyparty", "#housie", "#tambola", "..."], "ambience": { "name": "crowd", "vol": 0.08 }, "pace": 22,
  "shots": [ ... ] }
```
Theme kits (they draw the day's real theme art, ticket, mascot ball and reactions; use them in most shots):
- `tgame`: the app's game screen. `view`: `full` | `ticket` | `ball` | `players` | `phone` (a phone held over the
  theme's home art; place chars beside it, e.g. x 880, y 1900, s 1.6; `py`, `pw` move/size the phone).
  `marked`: how many ticket numbers are already marked (0 to 15, or "all"). `ball`: number or "?" (spinning).
  `call`: N plays the theme's own voice call for N first (and shows N on the ball). `dab: true` marks the ball
  number 1 s in. `full: true` = Full House (confetti, crowd). `reacts: true` reactions float from the players.
  `joined: true` players appear one by one.
- `thome`: the theme's animated home scene with up to 3 gang members (`chars`, feet y about 1780, s about 2.0).
  `ball`: { "n": 44, "x": 540, "y": 760, "size": 420, "revealAt": 1.5 } the mascot ball; `confetti: true`.
- `tball`: big mascot ball, "?" spinning with a 3-2-1 until `revealAt` (s), then number `n` pops. Lines start at
  `lead` (set it past `revealAt`). Good for quiz and countdown formats.
- `burst: true | seconds` on any theme kit: the theme's 5 reaction stickers fly up.
- Plain Kitty Gang kits (`scene`, `duo`, `phone`, `camera`, `door`, ...) work too; `"banner": true` on a scene puts
  "<THEME> HOUSIE" on the living-room banner.

## Rules (never break)
- 0-2 s: motion, a face or a sound hook, never a still title card. Pin the stake with a `chip` if the reel has a question.
- 12 to 35 s before the auto ending. No shot over 4 s. Lines 7 words or less. Hinglish captions, Devanagari `say`.
- Only real app things: public Housie games at the listed times, tickets, the theme's prize groups and points,
  reactions, the theme's number calls. Never invent prizes, money, features or offers.
- Cast, looks and humour rules from `autopilot/PLAYBOOK.md`. Kind humour. No em dashes. No app selling in the lines
  (the ending card does that).
- Never copy another creator's video or script; patterns only.
