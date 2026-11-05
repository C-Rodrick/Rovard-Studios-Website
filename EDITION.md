# ROVARD STUDIOS — The Creative Edition (alternative V2)

An editorial direction for the site: the website as a living publication. Separate from the
3D V2 on `claude/project-thread-uaatb2`. Built from `main`; nothing here is deployed.

## Preview

```
python -m http.server 8000
```
Open http://localhost:8000 (English) and http://localhost:8000/fr/ (French).
Pages use site-absolute paths, so serve from the repository root.

## What is in it

| Page | Path |
|---|---|
| Home (8 sections: cover, the idea, selected works, studio, departments, archive, field notes, open projects) | `/`, `/fr/` |
| The archive (filters, Index and Contact sheet views; `?d=brand`, `?v=sheet`) | `/work/`, `/fr/work/` |
| 22 project pages | `/work/<slug>/`, `/fr/work/<slug>/` |

## Edit and rebuild

```
python tools/edition/build.py      # regenerates all 48 pages
python tools/edition/images.py     # only after adding project pictures (needs Pillow)
```
- Words, English and French: `tools/edition/words.py` (featured projects, hero pictures, concept list too)
- Project data: `tools/edition/projects.json` (copied from `caseData` in script.js)
- French project text: `tools/edition/fr_projects.json` (from the earlier V2 translations) plus `FR_EXTRA` in words.py
- Styles: `edition/edition.css` (tokens at the top). Script: `edition/edition.js` (no libraries)
- Web-sized WebP pictures: `edition/img/`. Originals in `assets/` are untouched.

## Design system

- Colour: Paper `#F3F0E9`, Near Black `#171717`, Cobalt `#162DAF` (the logo's own blue, used instead of the
  brief's `#244BFF`, which stays only as a hover light on dark), Signal Red `#E94735` (section marks, the sticker,
  the strike-through, nothing else), Warm Grey `#BDBBB5`.
- Type, three families, all SIL Open Font License, self-hosted in `edition/fonts/`:
  Archivo (variable width 62–125 and weight, display and body), Instrument Serif (italic statements),
  DM Mono (labels and metadata).
- Grid: 12 columns, margin `--m`, gutter `--gut`. Each selected work uses a different composition
  (full bleed, offset, film, split, interrupted word, triptych).
- Motion: the wordmark opens from condensed to wide, headline width follows the pointer in the hero,
  pictures arrive behind a cobalt block, the strike-through draws itself, the band and footer word move
  with scroll, list titles show a floating preview, and pages change with a cross-document View Transition
  (the project picture morphs into the project page in Chrome and Edge). All of it switches off with
  reduced motion.

## Kept from the current site

Project text and pictures, the Formspree endpoint (`xvkgepeo`) and field names (`name`, `email`, `company`,
`services`, `budget`, `timeline`, `goals`, `website`), plus a `language` field and a subject line ending in
"Creative Edition" so you can tell which site an enquiry came from.

## Assumptions to check

1. Concepts: Vita House, Northstar Capital, Mason & Rowe, Proxima Exchange, Afa'a Pay and their websites and films
   are labelled "Self-initiated concept" (same list as the 3D V2). Every other project carries no label.
2. No numbers or testimonials: "7+ years", "200+ projects" and the placeholder testimonials are left out.
   Project counts shown are real counts from the archive.
3. The brief stopped in the hero section. Everything after it (sections 03 to 08, the archive and project
   pages) follows the brief's direction but is my interpretation.
4. Old pages: `services/*` still use the current design and are not linked from this version.
   `styles.css`, `script.js` and the other old scripts stay in the repo for them.
5. A 0.5 MB silent loop of the Proxima film (`edition/video/`) plays in the film spread; the full films
   stay on the project page.
