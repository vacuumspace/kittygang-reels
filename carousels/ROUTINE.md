# Kitty Game Ideas writer (runs once a day in the cloud)

You write ONE new "Kitty Game Ideas #N" game per run: a fun, slightly crazy party game that a kitty group
(Indian women, 30 to 55, 8 to 20 ladies at someone's home) can actually play today with things already in the house.
The GitHub workflow publishes a page on www.kittyparty.club/kitty-game-ideas/<slug> (from the slides and the web block)
and posts a REEL where two Kitty Gang friends explain the game step by step while the gang plays it with the real props (Instagram +
Facebook at a random slot, plus a YouTube Short in the "Kitty Game Ideas" playlist). Since 2026-11-26 the game goes
out as this reel, not as a carousel.

## Every run
0. Check in with admin Misc > Agents: `curl -s -X POST https://kittyparty-messaging.rahul-89e.workers.dev/agent/status -H 'Content-Type: application/json' -d '{"id":"carousel-writer","status":"running"}'`. If the reply has `"active":false` the Game Ideas Writer is paused in admin: stop now and change nothing. If the run cannot finish (nothing pushed), report it the same way with `{"id":"carousel-writer","status":"failed","error":"<one line why>"}`. A successful run is reported by the render workflow, so do nothing more on success.
1. `git pull`. Read `carousels/LEARNINGS.md` FIRST (what works and what flops, the learning loop), then
   `carousels/DRAFT-FORMAT.md` (file format, drawing kit, the reel), `autopilot/HUMAN-EXAMPLES.md`, `carousels/drafts/`
   (every game already made: never repeat a game or a near-copy; carousels/examples/KGI-037-play-scenes.json is the reel example),
   `autopilot/tracker.json` -> `carousels` (stats per game: views, saves, shares, comments, skip %, watched %, and each
   reel's `experiment`), `autopilot/data/trends.json` (top kitty party hashtag posts) and the content bank
   (`autopilot/tracker.json` -> `ideas` with `type: "game"`, filled daily by the researcher).
2. Pick the game. The user's bar: SUPER GOOD ideas, never boring. Research every run:
   - a web search for what kitty party / ladies party / one minute games are trending right now (YouTube, Instagram,
     Pinterest titles; "viral kitty party game 2026", "new tambola twist", festival in the next 10 days + "kitty game"),
   - the top game posts in trends.json, and our own winners and flops in tracker.json + LEARNINGS.md.
   Learn the pattern, then make it our own; never copy a creator's post.
   Collect 5 candidates and score each 1-5 on: watchable payoff (is the funny moment visible on video?), laugh (does
   someone fail in a human way?), easy (household items, 2 min to explain), fresh (not a near-copy of ours or a cliche),
   fits the gang (a real kitty moment). Pick the best total; a candidate under 18/25 is dropped. Put the 5 candidates
   with scores in the draft as `"candidates": [...]`.
   Good game = 1) real and playable, 2) one surprising or crazy twist (blindfold, no hands, saree rule, mother-in-law
   rule, balloon, chopsticks, mehendi, bindi, dupatta...), 3) cheap household items only, 4) safe (nothing hot, sharp,
   no food wastage, nothing embarrassing about bodies, money or religion), 5) works for 8 to 20 ladies in 10 to 20 min.
   Every 3rd game is a Housie/tambola twist (our best performer). Follow what LEARNINGS.md says to do more and less of.
   LEARNING LOOP: every game reel is an experiment. Set `reel.experiment` { hook, variable, hypothesis }: change ONE
   thing vs recent reels (hook type, length, number of action shots, cast, game type, prize, festival tie-in).
   On Mondays (IST) first update `carousels/LEARNINGS.md`: compare the last 2 weeks of game reels by views, skip %,
   watched %, saves, shares, comments and their experiment; write what to do more and less of (newest first, under 60
   lines), and apply it to today's pick.
3. Write `carousels/drafts/KGI-<NNN>.json` (next number) exactly as DRAFT-FORMAT.md says, INCLUDING the `reel` block
   (read "The reel" and "How the script must sound" there; pick a different explainer + friend pair than the last 2 games). Slides are Hinglish
   (Roman script, short); the `web` block is English for search engines and AI answers, with Hindi words where natural.
4. Self-check before saving (fix and re-check until all pass):
   - A stranger can play the game from the slides alone. Every step has a diagram that SHOWS the action.
   - Titles 6 words max, body lines 14 words max, rules and levels 2 short lines each.
   - Diagrams use the kit primitives; nothing overlaps the wrong thing; people stand on the floor, objects are in hands.
   - web.intro answers "what is <game> and how do you play it" in the first 2 sentences. web.faq has 5 real questions
     people search ("How many players...", "What do you need...", "Is it good for..."), each answered in 1 to 3 lines.
   - No em dashes anywhere. No app mention in slides, reel lines or caption.
   - The reel: every step has a play shot with a STEP label; every Hindi line has `say` in Devanagari; read the script aloud in your head:
     two friends chatting, each line answers the last, no ad or teacher voice. About 50-60 s, 70-90 words, simple step-by-step lines, no whiteboard, play + action shots like carousels/examples/KGI-037-play-scenes.json, gameSay set.
5. In the bank mark the idea `used: "KGI-NNN"` (or add it as used if it was your own), commit
   "game carousel KGI-NNN: <game>" and `git push`. The push starts the render. Only touch files under `carousels/`
   (drafts, LEARNINGS.md) and the `ideas` list in `autopilot/tracker.json`.
