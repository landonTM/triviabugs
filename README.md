# Bertha

The website for Bertha, the Discord trivia bot: high scores, player profiles,
round-by-round match replays, and the question bug tracker.

Static pages, no build step. Every data file (`players.json`, `stats/`,
`matches/`, `kirkening.json`, `missions.json`, `bug-reports.json`, `fixed-findings.json`) is published into this
repo by the bot itself every 30 minutes (`cogs/site_export.py` and
`utils/github_reports.py` in the bot repo), so a local clone is usually behind:
pull before trusting it.

- `index.html` home · `leaderboard.html` every stat ranked · `stats.html?id=` everything about one player
- `replays.html` match list · `replay.html?game=` / `?duel=` replays (never show answers)
- `kirkening.html` the Kirkening · `bugs.html` the bug tracker (formerly `index.html`)
- `assets/arcade.css` shared theme · `assets/bertha.js` shared data, helpers and the stat catalog

Only the bug tracker shows answers, published scrambled and unscrambled in the
browser behind its password gate. It stops accidental spoilers, not someone
who goes looking.

Preview locally with `python -m http.server` from this folder.
