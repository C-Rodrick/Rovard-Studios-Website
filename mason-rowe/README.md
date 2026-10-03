# Mason & Rowe — SELF-INITIATED CONCEPT PROJECT

Mason & Rowe is a **fictional** U.S. luxury residential developer, designed by Rovard Studios as a
self-initiated concept (2026). Nothing here is a real company, property, price or offer.

| Path | What it is |
| --- | --- |
| `website/` | The live 11-page responsive website (open `website/index.html`). `index.html` in this folder just redirects there. |
| `brand/` | Shared design tokens (`tokens.css`) and the monogram + icon sprite (`mark.js`). |
| `boards-brand-1.html`, `boards-brand-2.html`, `boards-ui.html` | Render-only source pages for the portfolio gallery boards (`?only=b01` … `?only=u11`). Not a published deliverable. |
| `_art/` | Python tools: the architectural image engine, screenshot capture, and the board renderer. |

## Portfolio entries
Two entries in `../script.js`: **Mason & Rowe** (Brand Identity Design, 16 boards) and
**Mason & Rowe Residences** (UI Design, 11 boards, `liveUrl` -> `mason-rowe/website/index.html`).
Boards are 2400x1600 JPGs in `assets/Brand Identitities/7_Mason and Rowe/` and `assets/UI Design/5_Mason and Rowe/`;
covers (960 px) are `assets/thumbs/mason-rowe-brand-cover.jpg` and `mason-rowe-ui-cover.jpg`.

## Regenerating things (Windows, Python 3 with numpy, scipy, Pillow, skia-python, playwright; Chrome installed)
```
cd mason-rowe/_art
py render.py all                 # imagery -> website/img   (fictional architectural renders)
py hires.py ; py crops.py        # 1.5x sources + detail crops for the galleries
py shots.py                      # screenshots of the live site -> _art/shots (inputs to the UI boards)
py boards_render.py brand        # brand boards + cover
py boards_render.py ui           # UI boards + cover (needs shots.py first)
py flow.py ; py interact.py      # overflow/console sweep and 28 interaction checks
```
`boards_render.py` refuses to save a board unless Newsreader and Jost loaded (they come from Google Fonts),
so a dropped connection can never produce a fallback-font board.

## Notes
* All imagery is a synthetic render of a fictional building; swap the JPGs in `website/img/` for real
  photography and nothing else needs to change.
* Forms never transmit data. Availability, prices, people and places are illustrative.
* Gitignored working files: `_art/_cache`, `_art/_preview`, `_art/_shots`, `_art/shots`.
