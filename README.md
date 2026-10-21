# Kitty Gang reels

Funny reels about kitty parties, starring the Kitty Gang, made automatically.

- `autopilot/ROUTINE.md`: the writer (a scheduled Claude routine, twice a day) writes one draft per run.
- `autopilot/drafts/*.json`: reel drafts. A push renders them (`.github/workflows/render.yml`): free voices, Remotion
  animation, upload, and a booked posting slot (one post a day, extra reels wait).
- `autopilot/tracker.json`: every reel, its script, posting time and stats. A spreadsheet copy is published with each run.
- `.github/workflows/sync.yml`: pulls stats and hashtag trends three times a day so the writer learns.
