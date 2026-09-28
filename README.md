# Bertha

The website for Bertha, the Discord trivia bot: high scores, player profiles,
round-by-round match replays, and the question bug tracker.

Static pages, no build step. Every data file (`players.json`, `stats/`,
`matches/`, `bug-reports.json`, `fixed-findings.json`) is published into this
repo by the bot itself every 30 minutes (`cogs/site_export.py` and
`utils/github_reports.py` in the bot repo), so a local clone is usually behind:
pull before trusting it.

- `index.html` home · `scores.html` scoreboards · `player.html?id=` profiles
- `replays.html` match list · `replay.html?game=` / `?duel=` replays
- `bugs.html` the bug tracker (formerly `index.html`)
- `assets/arcade.css` shared theme · `assets/bertha.js` shared data/helpers

Answers are published scrambled; the password gate (shared by the tracker and
replays) unscrambles them in the browser. It stops accidental spoilers, not
someone who goes looking.

Preview locally with `python -m http.server` from this folder.
