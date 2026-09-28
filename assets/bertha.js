// Bertha site -- shared data loading + helpers for every page.
// All data is static JSON the bot publishes into this repo every 30 minutes
// (cogs/site_export.py in the bot repo): players.json, stats/leaderboard.json,
// stats/users/<id>.json, matches/index*.json, matches/detail/*.json,
// plus the bug tracker's own bug-reports.json.
"use strict";

const B = (() => {
  const RANK_COLORS = ["#ffd23f", "#5ef2ff", "#ff4fa3", "#7cff6b", "#c79bff"];
  const MODE_LABELS = { standard: "TRIVIA", quickfire: "QUICKFIRE", hardcore: "HARDCORE", daily: "DAILY TRIVIA" };
  const MODE_COLORS = { standard: "#5ef2ff", quickfire: "#7cff6b", hardcore: "#ff4fa3", daily: "#ffd23f", duel: "#c79bff" };
  const NAV = [
    ["index.html", "HOME"], ["scores.html", "SCORES"], ["replays.html", "REPLAYS"], ["bugs.html", "BUGS"],
  ];

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
      }
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
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

  // ---------- formatting ----------
  const fmt = n => (n == null ? "—" : Number(n).toLocaleString("en-US"));
  const secs = ms => (ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`);
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "—");
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
  const ET_DATE = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });
  const when = s => { const d = ts(s); return d ? ET.format(d) : "—"; };
  const day = s => { const d = ts(s); return d ? ET_DATE.format(d) : "—"; };
  function dur(ms) {
    if (ms == null || ms < 0) return "—";
    const m = Math.round(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
  }
  const ordinal = n => `${n}${["TH", "ST", "ND", "RD"][(n % 100 >= 11 && n % 100 <= 13) || n % 10 > 3 ? 0 : n % 10]}`;
  const rankColor = i => RANK_COLORS[i % RANK_COLORS.length];

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
    const box = el("span", { class: `av ${size}`, style: { background: colorFor(id) }, "aria-hidden": "true" });
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
  const playerLink = (id, text) => el("a", { href: `player.html?id=${encodeURIComponent(id)}` }, text ?? name(id));

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

  // ---------- spoiler lock (same gate + storage key as the bug tracker; see bot utils/answer_lock.py) ----------
  const PASSWORD_HASH = "cf589f9995ede78a78ab4686b0cb8c762ba4d60b27ddde05076e98d1f8b601bc";
  let keyBytes = null;
  const listeners = [];
  async function sha256(str) { return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))); }
  const hex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  async function tryUnlock(pw, remember = true) {
    const d = await sha256(pw);
    if (hex(d) !== PASSWORD_HASH) return false;
    keyBytes = d;
    if (remember) { try { localStorage.setItem("audit-password", pw); } catch (e) { /* storage blocked */ } }
    listeners.forEach(f => f());
    return true;
  }
  function relock() {
    keyBytes = null;
    try { localStorage.removeItem("audit-password"); } catch (e) { /* storage blocked */ }
    listeners.forEach(f => f());
  }
  async function restoreLock() {
    let saved = null;
    try { saved = localStorage.getItem("audit-password"); } catch (e) { /* storage blocked */ }
    if (saved) await tryUnlock(saved, false);
  }
  const unlocked = () => !!keyBytes;
  function unscramble(b64) {
    if (!keyBytes || b64 == null) return null;
    try {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]));
    } catch (e) { return "(unreadable)"; }
  }
  function answerNode(list) {
    if (!list || !list.length) return el("span", { class: "hidden-ans" }, "—");
    if (!unlocked()) return el("span", { class: "hidden-ans", title: "Unlock answers to reveal" }, "▒▒▒▒▒▒ HIDDEN");
    return el("span", {}, unscramble(list[0]));
  }
  function lockBar() {
    const box = el("div", { class: "lockbar" });
    function render() {
      box.replaceChildren();
      if (unlocked()) {
        box.append(el("span", {}, "ANSWERS SHOWN ON THIS DEVICE."), el("button", { class: "btn", type: "button", onclick: relock }, "HIDE ANSWERS"));
        return;
      }
      const input = el("input", { type: "password", placeholder: "Password", "aria-label": "Answer password", autocomplete: "off" });
      const err = el("span", { style: { color: "var(--pink)" }, hidden: true }, "WRONG PASSWORD");
      const form = el("form", {
        onsubmit: async e => { e.preventDefault(); if (!(await tryUnlock(input.value))) err.hidden = false; },
      }, input, el("button", { class: "btn", type: "submit" }, "SHOW ANSWERS"));
      box.append(el("span", {}, "Answers are hidden so replays don't spoil questions."), form, err);
    }
    listeners.push(render);
    render();
    return box;
  }
  const onLockChange = f => listeners.push(f);

  // ---------- chrome ----------
  function topbar(active, hiscore) {
    const nav = el("nav", { "aria-label": "Site" },
      NAV.map(([href, label]) => el("a", { href, "aria-current": href === active ? "page" : null }, label)));
    const bar = el("header", { class: "topbar" }, nav, el("span", { class: "hiscore", id: "hiscore" }, hiscore || ""));
    document.querySelector(".wrap").prepend(bar);
  }
  function setHiscore(xp) { const h = $("#hiscore"); if (h) h.textContent = `HI-SCORE ${xp}`; }
  function footer(text) {
    document.querySelector(".wrap").append(el("footer", { class: "site" },
      el("span", {}, text || "BERTHA · THE TRIVIA MACHINE"),
      el("span", {}, "DATA REFRESHES EVERY 30 MINUTES")));
  }
  function fail(container, err) {
    container.replaceChildren(el("div", { class: "error" }, `GAME OVER · couldn't load data (${err.message || err})`));
  }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  // Seconds until the next Daily Trivia (14:00 America/New_York).
  function secondsToDaily() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const now = (+parts.hour) * 3600 + (+parts.minute) * 60 + (+parts.second);
    return ((14 * 3600 - now) % 86400 + 86400) % 86400;
  }

  return {
    json, el, $, fmt, secs, pct, ts, when, day, dur, ordinal, rankColor, loadPlayers, name, avatar, playerLink,
    colorFor, allMatches, matchHref, matchKind, matchTitle, fightCard, restoreLock, unlocked, unscramble, answerNode,
    lockBar, onLockChange, topbar, setHiscore, footer, fail, param, secondsToDaily, MODE_COLORS,
  };
})();
