// Bertha site -- shared data loading + helpers for every page.
// All data is static JSON the bot publishes into this repo every 30 minutes
// (cogs/site_export.py + utils/site_metrics.py in the bot repo): players.json,
// stats/leaderboard.json, stats/users/<id>.json, matches/index*.json,
// matches/detail/*.json, kirkening.json, missions.json, bug-reports.json.
"use strict";

const B = (() => {
  const RANK_COLORS = ["#ffd23f", "#5ef2ff", "#ff4fa3", "#7cff6b", "#c79bff"];
  const MODE_LABELS = { standard: "TRIVIA", quickfire: "QUICKFIRE", hardcore: "HARDCORE", daily: "DAILY TRIVIA" };
  const MODE_COLORS = { standard: "#5ef2ff", quickfire: "#7cff6b", hardcore: "#ff4fa3", daily: "#ffd23f", duel: "#c79bff" };
  const NAV = [
    ["index.html", "HOME"], ["leaderboard.html", "LEADERBOARD"], ["stats.html", "STATS"], ["season.html", "SEASON"],
    ["replays.html", "REPLAYS"], ["cosmetics.html", "COSMETICS"], ["kirkening.html", "KIRKENING"],
    ["changelog.html", "CHANGELOG"], ["bugs.html", "BUGS"],
  ];
  const PERIODS = [["daily", "TODAY"], ["weekly", "WEEK"], ["monthly", "MONTH"], ["yearly", "YEAR"], ["alltime", "ALL-TIME"]];

  const cache = new Map();
  function json(path) {
    if (!cache.has(path)) {
      cache.set(path, fetch(path, { cache: "no-cache" }).then(r => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
      }));
    }
    return cache.get(path);
  }

  // ---------- DOM ----------
  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "style" && typeof v === "object") {
        for (const [prop, val] of Object.entries(v)) {
          if (prop.startsWith("--")) node.style.setProperty(prop, val);
          else node.style[prop] = val;
        }
      } else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }
  const $ = sel => document.querySelector(sel);

  // Discord custom emoji markup (<:name:id>, <a:name:id>) -> images from Discord's CDN; everything else stays text.
  function emoji(text) {
    const s = String(text ?? ""), out = [], re = /<(a?):([A-Za-z0-9_~]+):(\d+)>/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      out.push(el("img", { class: "cemoji", src: `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? "gif" : "png"}?size=48`,
        alt: `:${m[2]}:`, title: `:${m[2]}:`, loading: "lazy" }));
      last = re.lastIndex;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }
  // **bold** and `code` -- the only Markdown in changelog entries and response-theme text -- as nodes, never HTML.
  function md(text) {
    return String(text ?? "").split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).flatMap(part =>
      part.length > 4 && part.startsWith("**") && part.endsWith("**") ? [el("b", {}, emoji(part.slice(2, -2)))]
        : part.length > 2 && part.startsWith("`") && part.endsWith("`") ? [el("code", {}, part.slice(1, -1))]
        : emoji(part));
  }

  // ---------- formatting ----------
  // ---------- numbers are shown exactly, never rounded ----------
  // (Landon, 2026-09-30: "2.2s" made 2.16s and 2.22s look tied.) Whole numbers and single answer times (whole
  // milliseconds) show in full. Only an endless decimal -- an average, or a percentage like 22/37 -- has to stop
  // somewhere: those keep 3 decimals of a second / 2 decimals of a percent, finer than any real difference between
  // players.
  const trim = s => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s);
  function fmt(n) {
    if (n == null) return "—";
    const [i, f] = String(Number(n)).split(".");  // String() is the shortest exact form -- no float noise, no rounding
    return Number(i).toLocaleString("en-US") + (f ? `.${f}` : "");
  }
  const secs = ms => (ms == null || ms === 0 ? "—" : `${(ms / 1000).toFixed(3)}s`);
  const pctOf = v => `${trim(Number(v).toFixed(2))}%`;
  const pct = (a, b) => (b ? pctOf((100 * a) / b) : "—");
  function ts(s) {
    if (!s) return null;
    // "2026-09-27 18:00:07.571969+00:00" -> ISO with millisecond precision (Safari rejects the raw form)
    const iso = String(s).replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }
  const ET = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const ET_TIME = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const ET_DATE = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });
  const when = s => { const d = ts(s); return d ? ET.format(d) : "—"; };
  const time = s => { const d = ts(s); return d ? ET_TIME.format(d) : "—"; };
  const day = s => { const d = ts(s); return d ? ET_DATE.format(d) : "—"; };
  // Exact to the second: "1h 04m 23s", "4m 07s", "23s" (days as hours: "31h 02m 00s").
  function dur(ms) {
    if (ms == null || ms < 0) return "—";
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60;
    const p2 = n => String(n).padStart(2, "0");
    if (h) return `${h}h ${p2(m)}m ${p2(sec)}s`;
    return m ? `${m}m ${p2(sec)}s` : `${sec}s`;
  }
  const ordinal = n => `${n}${["TH", "ST", "ND", "RD"][(n % 100 >= 11 && n % 100 <= 13) || n % 10 > 3 ? 0 : n % 10]}`;
  const rankColor = i => RANK_COLORS[i % RANK_COLORS.length];

  // xp_log / season_xp_log sources and a game's XP layers (the bot's utils/site_metrics.py::xp_breakdown)
  const XP_SOURCES = { game: "GAMES", duel: "DUELS", achievement: "ACHIEVEMENTS", mission: "MISSIONS",
    season_prize: "SEASON PRIZES", duel_prize: "DUEL RATING PRIZES", pumpkin: "FLAMING PUMPKINS", other: "OTHER" };
  const XP_LAYERS = { base: "BASE XP", daily: "DAILY TRIVIA (2×)", double_xp_weekend: "DOUBLE XP WEEKEND",
    hardcore: "HARDCORE (1.5×)", replay: "REPLAY BONUS", boost: "XP BOOST (2×)" };
  const XP_LAYERS_SHORT = { daily: "daily", double_xp_weekend: "double XP", hardcore: "hardcore", replay: "replay",
    boost: "boost" };

  // ---------- players ----------
  let players = {};
  async function loadPlayers() {
    try { players = (await json("players.json")).players || {}; } catch (e) { players = {}; }
    return players;
  }
  const name = id => (id != null && players[id] ? players[id].name : id ? `Player ${String(id).slice(-4)}` : "Nobody");
  function colorFor(id) {
    let h = 0;
    for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return RANK_COLORS[h % RANK_COLORS.length];
  }
  function avatar(id, size = "") {
    const initial = Array.from(name(id))[0] || "?";
    // The border is the player's equipped embed colour (players.json "color"), so their cosmetics show everywhere.
    const border = players[id] && players[id].color;
    const box = el("span", { class: `av ${size}`, style: { background: colorFor(id), borderColor: border || null }, "aria-hidden": "true" });
    const url = players[id] && players[id].avatar_url;
    if (url) {
      const img = el("img", { src: url, alt: "", loading: "lazy" });
      img.addEventListener("error", () => { img.remove(); box.textContent = initial; });
      box.append(img);
    } else {
      box.textContent = initial;
    }
    return box;
  }
  const playerHref = id => `stats.html?id=${encodeURIComponent(id)}`;
  const playerLink = (id, text) => el("a", { href: playerHref(id) }, text ?? name(id));

  // ---------- every stat ----------
  // Each metric: key, label, group, get(player, period) -> number, show(value) -> text,
  // period (true = has TODAY/WEEK/... values; false = one current/all-time number),
  // asc (lower is better), qualify(player, period) (minimum sample), note.
  const per = key => (p, pd) => ((p.periods[pd] || {})[key]) || 0;
  const cur = key => p => (p.current || {})[key] || 0;
  const ratio = (a, b) => (p, pd) => { const s = p.periods[pd] || {}; return s[b] ? (100 * (s[a] || 0)) / s[b] : 0; };
  const pctShow = pctOf;
  const GROUPS = [
    ["xp", "XP & LEVEL"], ["points", "POINTS & ANSWERS"], ["speed", "SPEED & ACCURACY"], ["streaks", "STREAKS"],
    ["games", "GAMES"], ["duels", "DUELS"], ["season", "SEASON"], ["progress", "MISSIONS & ACHIEVEMENTS"],
    ["community", "COMMUNITY"], ["categories", "CATEGORIES"],
  ];
  const GAMES_NOTE = "Per-mode game history starts Sep 22, 2026; all-time totals include everything before.";
  const M = (key, label, group, get, extra = {}) => ({ key, label, group, get, show: fmt, period: true, ...extra });
  const METRICS = [
    M("total_xp", "TOTAL XP", "xp", p => p.total_xp, { period: false }),
    M("level", "LEVEL", "xp", p => p.level.level, { period: false, tiebreak: p => p.total_xp }),
    M("boost_hours_banked", "XP BOOST TIME BANKED", "xp", p => (p.current || {}).boost_secs_banked ?? Math.round(3600 * ((p.current || {}).boost_hours_banked || 0)),
      { period: false, show: v => dur(v * 1000) }),

    M("points", "POINTS", "points", per("points")),
    M("correct", "CORRECT ANSWERS", "points", per("correct")),
    M("standard_correct", "STANDARD ANSWERS", "points", per("standard_correct")),
    M("insane_finds", "INSANE FINDS", "points", per("insane_finds")),
    M("best_insane_round", "BEST INSANE ROUND", "points", per("best_insane_round"), { note: "Most answers found in a single insane round." }),
    M("best_game_points", "BEST SINGLE GAME", "points", per("best_game_points"), { note: "Most points in one game.", show: v => `${fmt(v)} pts` }),
    M("categories_played", "CATEGORIES ANSWERED", "points", per("categories_played"), { note: "Different categories with at least one correct answer." }),
    M("active_days", "DAYS PLAYED", "points", per("active_days")),

    M("avg_guess_ms", "AVERAGE ANSWER TIME", "speed", per("avg_guess_ms"), { show: secs, asc: true,
      qualify: (p, pd) => ((p.periods[pd] || {}).standard_correct || 0) >= 20, note: "Standard rounds. Needs 20+ correct answers in the period." }),
    M("fastest_ms", "FASTEST ANSWER", "speed", per("fastest_ms"), { show: secs, asc: true }),
    M("under_5s", "ANSWERS UNDER 5 SECONDS", "speed", per("under_5s")),
    M("spelling_pct", "SPELLING ACCURACY", "speed", ratio("exact_spelling", "spelled"), { show: pctShow,
      qualify: (p, pd) => ((p.periods[pd] || {}).spelled || 0) >= 20, note: "Correct answers typed with no typo. Needs 20+ answers." }),
    M("exact_spelling", "PERFECT SPELLINGS", "speed", per("exact_spelling")),

    M("best_streak", "BEST ANSWER STREAK", "streaks", per("best_streak"), { note: "Most correct answers in a row." }),
    M("current_streak", "CURRENT ANSWER STREAK", "streaks", cur("current_streak"), { period: false }),
    M("day_streak", "DAY STREAK", "streaks", cur("day_streak"), { period: false, note: "Days in a row with at least one game." }),

    M("games_played", "GAMES PLAYED", "games", per("games_played"), { note: GAMES_NOTE }),
    M("game_wins", "GAME WINS", "games", per("game_wins"), { note: GAMES_NOTE }),
    M("win_rate", "WIN RATE", "games", ratio("game_wins", "games_played"), { show: pctShow,
      qualify: (p, pd) => ((p.periods[pd] || {}).games_played || 0) >= 5, note: "Needs 5+ games in the period." }),
    M("wins_standard", "TRIVIA WINS", "games", per("wins_standard"), { note: GAMES_NOTE }),
    M("wins_quickfire", "QUICKFIRE WINS", "games", per("wins_quickfire"), { note: GAMES_NOTE }),
    M("wins_hardcore", "HARDCORE WINS", "games", per("wins_hardcore"), { note: GAMES_NOTE }),
    M("wins_daily", "DAILY TRIVIA WINS", "games", per("wins_daily"), { note: GAMES_NOTE }),
    M("played_standard", "TRIVIA GAMES", "games", per("played_standard"), { note: GAMES_NOTE }),
    M("played_quickfire", "QUICKFIRE GAMES", "games", per("played_quickfire"), { note: GAMES_NOTE }),
    M("played_hardcore", "HARDCORE GAMES", "games", per("played_hardcore"), { note: GAMES_NOTE }),
    M("played_daily", "DAILY TRIVIA GAMES", "games", per("played_daily"), { note: GAMES_NOTE }),
    M("games_started", "GAMES STARTED", "games", per("games_started"), { note: GAMES_NOTE }),

    M("duel_wins", "DUEL WINS", "duels", per("duel_wins")),
    M("duels_played", "DUELS PLAYED", "duels", per("duels_played")),
    M("duel_losses", "DUEL LOSSES", "duels", per("duel_losses")),
    M("duel_ties", "DUEL TIES", "duels", per("duel_ties")),
    M("duel_win_rate", "DUEL WIN RATE", "duels", ratio("duel_wins", "duels_played"), { show: pctShow,
      qualify: (p, pd) => ((p.periods[pd] || {}).duels_played || 0) >= 3, note: "Needs 3+ duels in the period." }),
    M("duel_rounds_won", "DUEL ROUNDS WON", "duels", per("duel_rounds_won")),
    M("duel_avg_ms", "DUEL AVERAGE ANSWER", "duels", per("duel_avg_ms"), { show: secs, asc: true,
      qualify: (p, pd) => ((p.periods[pd] || {}).duel_rounds_won || 0) >= 5, note: "Needs 5+ duel rounds won." }),
    M("duel_fastest_ms", "DUEL FASTEST ANSWER", "duels", per("duel_fastest_ms"), { show: secs, asc: true }),
    M("duels_started", "DUELS STARTED", "duels", per("duels_started"), { note: "Challenges sent." }),
    M("duel_streak", "CURRENT DUEL STREAK", "duels", cur("duel_streak"), { period: false }),
    M("duel_best_streak", "BEST DUEL STREAK", "duels", cur("duel_best_streak"), { period: false }),

    M("season_xp", "SEASON XP", "season", cur("season_xp"), { period: false }),
    M("season_level", "SEASON PASS LEVEL", "season", cur("season_level"), { period: false, tiebreak: cur("season_xp") }),
    M("elo", "DUEL RATING", "season", cur("elo"), { period: false, note: "This season's duel ELO." }),
    M("elo_peak", "PEAK DUEL RATING", "season", cur("elo_peak"), { period: false }),
    M("season_podiums", "SEASON PODIUMS", "season", cur("season_podiums"), { period: false, note: "Prize finishes across every season." }),

    M("missions", "MISSIONS COMPLETED", "progress", per("missions")),
    M("achievements", "ACHIEVEMENTS UNLOCKED", "progress", per("achievements")),
    M("cosmetics_owned", "COSMETICS OWNED", "progress", cur("cosmetics_owned"), { period: false }),

    M("bug_reports", "BUG REPORTS FILED", "community", per("bug_reports")),
    M("bugs_fixed", "REPORTS THAT GOT FIXED", "community", per("bugs_fixed")),
  ];
  const METRIC = Object.fromEntries(METRICS.map(m => [m.key, m]));
  function categoryMetric(cat) {
    return M(`cat:${cat}`, cat.toUpperCase(), "categories", (p, pd) => (((p.categories || {})[pd] || {})[cat] || [0])[0],
      { note: "Correct answers in this category." });
  }
  function allCategories(lb) {
    const s = new Set();
    for (const p of lb.players) for (const c of Object.keys((p.categories || {}).alltime || {})) s.add(c);
    return [...s].sort((a, b) => a.localeCompare(b));
  }
  // Players ranked on one metric for one period; unqualified and zero values drop out.
  function ranking(lb, m, pd) {
    const period = m.period ? pd : "alltime";
    const rows = lb.players
      .filter(p => !m.qualify || m.qualify(p, period))
      .map(p => ({ p, v: m.get(p, period) }))
      .filter(r => r.v);
    rows.sort((x, y) => (m.asc ? x.v - y.v : y.v - x.v) || ((m.tiebreak ? m.tiebreak(y.p) - m.tiebreak(x.p) : 0)));
    return rows;
  }
  const rankOf = (lb, m, pd, id) => ranking(lb, m, pd).findIndex(r => r.p.user_id === id) + 1;

  // ---------- matches ----------
  async function allMatches() {
    const idx = await json("matches/index.json");
    const months = await Promise.all((idx.months || []).map(m => json(`matches/index-${m}.json`).catch(() => ({ matches: [] }))));
    return months.flatMap(m => m.matches || []).sort((a, b) => (ts(b.ended_at) || 0) - (ts(a.ended_at) || 0));
  }
  const matchHref = m => (m.kind === "duel" ? `replay.html?duel=${m.id}` : `replay.html?game=${m.id}`);
  function matchKind(m) {
    if (m.kind === "duel") return { label: `DUEL · ${(m.format_label || "").toUpperCase()}`, color: MODE_COLORS.duel };
    const cats = m.categories && m.categories.length ? ` · ${m.categories.join(", ").toUpperCase()}` : "";
    return { label: `${MODE_LABELS[m.mode] || String(m.mode).toUpperCase()}${cats}`, color: MODE_COLORS[m.mode] || "#5ef2ff" };
  }
  function matchTitle(m) {
    if (m.kind === "duel") {
      if (!m.challenger_score && !m.opponent_score) return `${name(m.challenger_id)} vs ${name(m.opponent_id)} · no contest`;
      if (m.is_tie) return `${name(m.challenger_id)} and ${name(m.opponent_id)} tie ${m.challenger_score}–${m.opponent_score}`;
      if (!m.winner_id) return `${name(m.challenger_id)} vs ${name(m.opponent_id)} · no result`;
      const loser = m.winner_id === m.challenger_id ? m.opponent_id : m.challenger_id;
      const hi = Math.max(m.challenger_score, m.opponent_score), lo = Math.min(m.challenger_score, m.opponent_score);
      return `${name(m.winner_id)} def. ${name(loser)} ${hi}–${lo}`;
    }
    if (m.winner_id) return `${name(m.winner_id)} wins · ${m.rounds_played} rounds`;
    return m.end_reason === "completed" ? `No winner · ${m.rounds_played} rounds` : `Stopped after ${m.rounds_played} rounds`;
  }

  // Fighting-game style duel header. `levels` maps user_id -> level number (optional).
  function fightCard(m, levels = {}) {
    const target = Math.max(1, m.challenger_score, m.opponent_score);
    const side = (id, score, cls, color) => {
      const won = id === m.winner_id, lost = m.winner_id && !won;
      return el("div", { class: `fighter ${cls}` },
        el("div", { class: "id" }, avatar(id, "lg"),
          el("div", { style: { display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 } },
            el("span", { class: "tag" }, `${cls.toUpperCase()}${levels[id] ? ` · LV ${levels[id]}` : ""}`),
            el("span", { class: "nm" }, playerLink(id)))),
        el("div", { class: "hp" }, el("span", { style: { width: `${(100 * score) / target}%`, background: color } })),
        el("span", { class: "pts", style: { color } }, `${score} PTS${won ? " · WINNER" : ""}`),
        lost ? el("span", { class: "ko" }, "K.O.") : null);
    };
    return el("div", { class: "fight" },
      side(m.challenger_id, m.challenger_score, "p1", "var(--cyan)"),
      el("div", { class: "vs" }, el("b", {}, "VS"), el("span", {}, (m.format_label || "").toUpperCase()), el("span", {}, when(m.ended_at))),
      side(m.opponent_id, m.opponent_score, "p2", "var(--pink)"));
  }

  // ---------- cosmetics (cosmetics.json -- the gallery and the season page's tiers) ----------
  const COSMETIC_TYPE = { footer: "FOOTER", emoji: "EMOJI PACK", theme: "RESPONSE THEME", embedcolor: "EMBED COLOR", mvp: "MVP CARD" };
  function cosmeticUnlock(u) {
    if (u.how === "level") return u.level <= 1 ? ["EVERYONE", "var(--muted)"] : [`LEVEL ${u.level}`, "var(--cyan)"];
    if (u.how === "season") return [`${u.emoji} ${u.season.toUpperCase()} · TIER ${u.tier}`, "var(--yellow)"];
    return ["SPECIAL GRANT", "var(--pink)"];
  }
  function cosmeticPreview(t, item, fill) {
    const p = item.preview || {};
    if (t === "footer") return el("div", { class: "pv" }, fill(p.template));
    if (t === "emoji") return el("div", { class: "emo" }, [["correct", "CORRECT"], ["streak", "STREAK"], ["speed", "SPEED"]].map(([k, cap]) =>
      el("figure", {}, el("span", {}, emoji(p[k])), el("figcaption", {}, cap))));
    if (t === "theme") return el("div", { class: "pv" }, (p.lines || []).map(line => el("p", {}, md(fill(line)))));
    if (t === "embedcolor") return el("div", { class: "pv", style: { "--edge": p.hex || "var(--line-dim)" } },
      p.hex ? el("span", {}, el("b", { style: { color: p.hex, fontWeight: 400 } }, "■ "), p.hex) : "Each message keeps its own colour.");
    return el("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },  // MVP card
      p.gif ? el("img", { class: "gif", src: p.gif, alt: `${item.label} GIF`, loading: "lazy" }) : null,
      el("div", { class: "pv" }, p.quote ? fill(p.quote) : "No card: the game just ends."));
  }
  // One cosmetic: name, a tag (how it unlocks, or opts.tag), its preview, and who owns / has it equipped.
  // opts.who highlights one player's collection (dims what they don't own); "{user}" in previews becomes their name.
  function cosmeticCard(t, item, opts = {}) {
    const who = opts.who || "";
    const fill = s => String(s || "").replaceAll("{user}", who ? name(who) : "you").replaceAll("{loser}", "the runner-up");
    const [how, color] = opts.tag ? [opts.tag, opts.tagColor || "var(--purple)"] : cosmeticUnlock(item.unlock);
    const owns = item.owners || [], eq = new Set(item.equipped || []);
    const everyone = item.unlock.how === "level" && item.unlock.level <= 1;
    return el("div", { class: `ccard${who ? (owns.includes(who) ? " mine" : " locked") : ""}`, style: { "--c": color } },
      el("div", { class: "top" }, el("span", { class: "nm" }, item.label), el("span", { class: "how" }, how)),
      cosmeticPreview(t, item, fill),
      el("div", { class: "owners" },
        el("span", { class: "cnt" }, everyone ? `EVERYONE HAS THIS${eq.size ? ` · ${eq.size} EQUIPPED` : ""}`
          : owns.length ? `OWNED BY ${owns.length}${eq.size ? ` · ${eq.size} EQUIPPED` : ""}` : "NOBODY HAS IT YET"),
        (everyone ? [...eq] : owns).map(id => el("a", { href: playerHref(id), class: eq.has(id) ? "eq" : "",
          title: `${name(id)}${eq.has(id) ? " (equipped)" : ""}` }, avatar(id, "sm")))));
  }

  // ---------- long lists ----------
  // Puts the first `first` nodes in `box` and returns a "SHOW ALL n <label>" button that adds the rest (or null when
  // there's nothing hidden). Keeps long pages short on phones.
  function showMore(box, nodes, first, label) {
    box.replaceChildren(...nodes.slice(0, first));
    if (nodes.length <= first) return null;
    const btn = el("button", { class: "btn more", type: "button", onclick: () => { box.append(...nodes.slice(first)); btn.remove(); } },
      `SHOW ALL ${nodes.length} ${label}`);
    return btn;
  }

  // ---------- fastest answers ----------
  // One row per answer: rank, time, category / mode / date, the question (never the answer) and its image, linking to
  // the replay when the game has one (from Sep 22 on). Used by a player's top 10 (stats.html) and the leaderboard's
  // all-time top 50, which passes withPlayer so each row also says whose answer it was.
  const FAST_MODE = { standard: "TRIVIA", quickfire: "QUICKFIRE", hardcore: "HARDCORE", daily: "DAILY TRIVIA" };
  function fastestRow(f, i, withPlayer = false) {
    const meta = `${(f.category || "").toUpperCase()} · ${f.mode ? FAST_MODE[f.mode] || f.mode.toUpperCase() : "TRIVIA · BEFORE SEP 22"} · ${day(f.answered_at)}`;
    const inner = [
      el("span", { class: "fr" }, `#${i + 1}`),
      el("span", { class: "ft" }, secs(f.ms)),
      el("span", { class: "fq" },
        withPlayer ? el("span", { class: "fwho" }, avatar(f.user_id, "sm"), name(f.user_id)) : null,
        el("span", { class: "fmeta" }, meta),
        el("span", {}, f.question_text || "")),
      f.image_url ? el("img", { class: "fimg", src: f.image_url, alt: "Question image", loading: "lazy" }) : null,
    ];
    return f.game_id ? el("a", { class: "frow", href: `replay.html?game=${f.game_id}`, style: { "--c": rankColor(i) } }, inner)
      : el("div", { class: "frow", style: { "--c": rankColor(i) } }, inner);
  }

  // ---------- tables on phones ----------
  // On narrow screens (arcade.css) each table row becomes a card; its cells need their column's name to label the
  // numbers, so every table.scores / table.grid gets data-label on each cell, and the name cell a .cell-who class.
  function labelTable(table) {
    const heads = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());
    for (const tr of table.querySelectorAll("tbody tr")) {
      [...tr.children].forEach((td, i) => {
        if (heads[i] && !td.dataset.label) td.dataset.label = heads[i];
        if (td.querySelector(".who")) td.classList.add("cell-who");
        if (td.querySelector(".bar")) td.classList.add("cell-wide");
      });
    }
  }
  new MutationObserver(() => document.querySelectorAll("table.scores, table.grid").forEach(labelTable))
    .observe(document.documentElement, { childList: true, subtree: true });

  // ---------- chrome ----------
  function topbar(active) {
    const nav = el("nav", { "aria-label": "Site", id: "sitenav" },
      NAV.map(([href, label]) => el("a", { href, "aria-current": href === active ? "page" : null }, label)));
    // Phones get a menu button (the current page's name) that opens the links as a grid; desktop shows them inline.
    const here = (NAV.find(([href]) => href === active) || [null, "MENU"])[1];
    const setOpen = open => { bar.classList.toggle("open", open); toggle.setAttribute("aria-expanded", String(open)); };
    const toggle = el("button", { class: "menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "sitenav",
      onclick: () => setOpen(!bar.classList.contains("open")) }, el("span", { "aria-hidden": "true" }, "☰"), here);
    const bar = el("header", { class: "topbar" }, toggle, nav, el("span", { class: "hiscore", id: "hiscore" }));
    document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
    document.querySelector(".wrap").prepend(bar);
    json("stats/leaderboard.json").then(lb => {
      const top = lb.players[0];
      if (top && top.total_xp) $("#hiscore").textContent = `HI-SCORE ${top.total_xp}`;
    }).catch(() => {});
  }
  function footer(text) {
    document.querySelector(".wrap").append(el("footer", { class: "site" },
      el("span", {}, text || "BERTHA · THE TRIVIA MACHINE"),
      el("span", {}, "DATA REFRESHES EVERY 30 MINUTES")));
  }
  function fail(container, err) {
    container.replaceChildren(el("div", { class: "error" }, `GAME OVER · couldn't load data (${err.message || err})`));
  }
  const param = k => new URLSearchParams(location.search).get(k);
  function periodButtons(current, onPick) {
    return el("div", { class: "btns", role: "group", "aria-label": "Period" },
      PERIODS.map(([k, label]) => el("button", { class: "btn", type: "button", "aria-pressed": String(k === current), onclick: () => onPick(k) }, label)));
  }

  // Seconds until the next Daily Trivia (14:00 America/New_York).
  function secondsToDaily() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const now = (+parts.hour) * 3600 + (+parts.minute) * 60 + (+parts.second);
    return ((14 * 3600 - now) % 86400 + 86400) % 86400;
  }
  function clock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const d = Math.floor(s / 86400), rest = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, "0")).join(":");
    return d ? `${d}D ${rest}` : rest;
  }

  return {
    json, el, $, fmt, secs, pct, ts, when, time, day, dur, ordinal, rankColor, loadPlayers, name, avatar, playerHref,
    playerLink, colorFor, emoji, md, XP_SOURCES, XP_LAYERS, XP_LAYERS_SHORT, METRICS, METRIC, GROUPS, PERIODS, categoryMetric, allCategories, ranking, rankOf,
    COSMETIC_TYPE, cosmeticCard, showMore, allMatches, matchHref, matchKind, matchTitle, fightCard, topbar, footer, fail, param, periodButtons,
    secondsToDaily, clock, MODE_COLORS, fastestRow,
  };
})();
