# Custom question audit

Local source review — updated 2026-09-08

3,386 custom entries across 27 categories; 482 existing findings and review tasks affecting 454 source entries.

Category review adds 1,123 P1 proposals after screening 14,342 entries (3,386 custom + 10,956 original YAML). Includes all 101 insane rounds. Open the Category review tab for current and suggested destinations. Dorothy’s heel-click question is proposed for Entertainment, with Movies noted as a narrower alternative.

| Category | Standard | Insane | Findings / tasks |
|---|---:|---:|---:|
| A Knight of the Seven Kingdoms | 100 | 0 | 3 |
| Acronyms and Abbreviations | 100 | 0 | 3 |
| Chemistry | 0 | 1 | 0 |
| Computers | 0 | 1 | 1 |
| Disney | 0 | 6 | 0 |
| Family Guy | 100 | 1 | 18 |
| Game of Thrones | 187 | 3 | 17 |
| General Knowledge | 0 | 22 | 24 |
| Geography | 153 | 13 | 34 |
| Greek Mythology | 0 | 1 | 1 |
| Harry Potter | 0 | 5 | 4 |
| Hockey | 0 | 2 | 1 |
| House of the Dragon | 250 | 0 | 18 |
| Logos | 99 | 0 | 0 |
| MLB | 47 | 2 | 8 |
| Marvel | 500 | 3 | 42 |
| Movies | 500 | 0 | 36 |
| Music | 0 | 3 | 4 |
| NBA | 0 | 2 | 1 |
| Sports | 172 | 1 | 18 |
| Star Wars | 0 | 1 | 2 |
| Stranger Things | 100 | 0 | 2 |
| The Simpsons | 100 | 0 | 13 |
| Video Games | 251 | 7 | 47 |
| What Links | 100 | 0 | 0 |
| World Cup | 0 | 4 | 5 |
| Wrestling | 526 | 23 | 180 |

## Scope and limitations

- This is an audit of local import sources, not an export of the live PostgreSQL database. Live category membership, imported counts, removals, and later corrections remain unverified because SSH access failed.
- All 3,386 custom-source entries, including 101 insane rounds with 6,719 raw answer entries, were read and screened. External fact-checking was selective; unverified P0 candidates are labeled. No finding is not a correctness certification.
- Logos remain in the inventory. Logo-image verification tasks were removed at the user’s request.
- Standard mode: multiple choice, multiple answers, duplicate questions, answer leakage and redundancy receive P0. Insane mode permits multiple answers: incorrect, missing or misspelled answers receive P0; wording, grammar and redundancy receive P1. Priority does not imply certainty.
- Scope covers all nonempty manually authored db batches and raw import banks, regardless of category. Original YAML banks are included in the category-fit screen and as duplicate comparison references; they are excluded from custom-entry counts.
- Prefer an existing category that describes the fact being tested. Preserve broad or cross-domain placement when no clearly better existing category fits. Category proposals are P1 editorial decisions, not factual errors or automatic moves.
- All local custom entries and original YAML entries passed the category screen. Keyword candidates were supplemented and corrected through editorial review of broad banks, titles and named entities. This is not a new blanket factual verification; unflagged items and ambiguous overlaps can still merit review. Image URL prompts retain their identification-bank category; images were not reverified.
- Source overlap does not establish live duplicates. Minecraft’s large list explicitly supersedes the smaller source. Exact and same-answer similarity comparisons are supplemented by manual review; no method guarantees detection of every paraphrase.
- Review status is local to this report/browser. Marking an item resolved does not edit the bot or update its Discord /fixed tracker. Export progress to keep a portable backup.
- 6 redundant reports were consolidated into their retained findings. Old finding IDs remain searchable and saved reviews migrate to the retained item; conflicting statuses and notes are preserved in merged review history.
- N- codes identify findings in this new audit; Q codes identify source questions. They are not database IDs, severity levels, or original F-series findings.

## Use the tracker

Open `other-categories-audit.html`. Filter by category, priority, evidence, mode, or review status. Status and notes save in browser storage when available. Use Export progress / Import progress to transfer or back up your review. All source snapshots, scripts, and outputs are in this Codex workspace; the bot folder was read only.
