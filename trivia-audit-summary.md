# Trivia audit — updated format rules

Screened all 10,956 entries across 41 files under the user’s required format.

**2,988 questions have P0 maximum-severity violations.**

- Multiple answer-list entries: **2,890 questions**.
- Multiple-choice prompts: **139 questions**, including explicit binary choices and prompts referring to absent choices.
- A question can violate both rules. Equivalent aliases still count as multiple answer entries.
- Original files remain unchanged; this update flags issues only.
- Existing finding IDs are preserved. The HTML report shows P0 issues first and includes a severity filter.

Current user rules: P0 (maximum severity) for any multiple-choice prompt, including explicit binary choices, and any answer list with more than one entry—even equivalent spellings, capitalization variants or number/word aliases. Prior suggestions to add or retain aliases are superseded: keep one canonical answer only. Existing finding IDs remain stable; new format findings have new IDs.

## All findings

4,444 findings/candidates across 3,849 flagged entries. Factual verification remains selective; all 1,563 image questions remain visually unverified.

## File coverage

| File | Entries | Findings/candidates | P0 findings |
|---|---:|---:|---:|
| anime.yaml | 535 | 249 | 186 |
| artandliterature.yaml | 434 | 222 | 142 |
| chemistry.yaml | 214 | 128 | 80 |
| computers.yaml | 164 | 68 | 32 |
| disney.yaml | 1003 | 292 | 142 |
| elements.yaml | 118 | 1 | 0 |
| entertainment.yaml | 654 | 164 | 45 |
| finalfantasy.yaml | 670 | 349 | 306 |
| gameofthrones.yaml | 60 | 23 | 23 |
| games.yaml | 249 | 104 | 64 |
| general.yaml | 709 | 256 | 151 |
| geography.yaml | 93 | 43 | 21 |
| greekmyth.yaml | 190 | 26 | 8 |
| harrypotter.yaml | 251 | 138 | 94 |
| hockey.yaml | 740 | 836 | 680 |
| lotr.yaml | 213 | 53 | 33 |
| mlb.yaml | 51 | 96 | 79 |
| music.yaml | 248 | 68 | 37 |
| nba.yaml | 266 | 173 | 110 |
| pokemon.yaml | 388 | 229 | 163 |
| slogans.yaml | 248 | 55 | 43 |
| sports.yaml | 228 | 71 | 41 |
| startrek.yaml | 837 | 339 | 200 |
| starwars.yaml | 286 | 212 | 152 |
| uscapitals.yaml | 55 | 4 | 1 |
| usflags.yaml | 55 | 5 | 2 |
| usmap.yaml | 55 | 2 | 2 |
| usstateabbreviations.yaml | 100 | 0 | 0 |
| whosthatpokemon.yaml | 151 | 2 | 0 |
| whosthatpokemon2.yaml | 100 | 0 | 0 |
| whosthatpokemon3.yaml | 135 | 0 | 0 |
| whosthatpokemon4.yaml | 107 | 2 | 2 |
| whosthatpokemon5.yaml | 156 | 0 | 0 |
| whosthatpokemon6.yaml | 72 | 1 | 1 |
| whosthatpokemon7.yaml | 88 | 1 | 0 |
| whosthatpokemon8.yaml | 96 | 1 | 0 |
| whosthatpokemon9.yaml | 120 | 4 | 4 |
| worldcapitals.yaml | 197 | 51 | 37 |
| worldcup.yaml | 228 | 113 | 89 |
| worldflags.yaml | 196 | 33 | 29 |
| worldmap.yaml | 196 | 30 | 30 |
