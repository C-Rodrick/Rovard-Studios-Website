ROVARD STUDIOS WEBSITE — V2
============================

Static site (plain HTML/CSS/JS, no framework). Hosted on GitHub Pages.

Pages
  /                       Home
  /services/              Everything we can design for you
  /work/                  Work index (filterable)
  /work/<project>/        One page per project (22)
  /about/                 About
  /start/                 Start a project (deep-linkable: /start/?need=flyer,website)

How it is built
  The pages are GENERATED. Do not edit the .html files by hand.
    tools/content.py      All copy, services, stories, project wording
    tools/projects-raw.json   Project data (titles, galleries, videos, live links)
    tools/build.py        Generates every page:   python tools/build.py
    tools/images.py       Makes responsive WebP images into img/:   python tools/images.py
    tools/fonts.py        Self-hosts Syne + Space Grotesk (css/fonts/)
    tools/og.py           Social share image (assets/og-cover.jpg)
    css/site.css          Design system
    js/site.js            Smooth scroll, reveals, word-by-word headlines, menu, parallax, carousel, panels,
                          hero rotator, filters, lightbox, start form
    js/lenis.min.js       Lenis smooth scrolling (MIT licence, v1.1.20, vendored)
    tools/cdp.py          Headless-Chrome driver for review screenshots and interaction tests

Adding or changing a project
  1. Add/edit it in tools/projects-raw.json and its entries in tools/content.py
     (PLAIN, PROJECT_KIND, CONCEPT, MADE).
  2. python tools/images.py && python tools/build.py

Rules we follow
  - The written brand name is always ROVARD STUDIOS.
  - Concept (self-initiated / fictional) projects are labelled "Concept".
  - No invented clients, testimonials, results or statistics.
  - Mockups that are not real client work are labelled as mockups or concepts.

Before launch
  - Set the final domain in tools/content.py (SITE['url']) and rebuild.
  - Confirm which projects are client work vs concept (see CONCEPT in tools/content.py).
  - Add real testimonials when available (none are shown now).

Preview locally:  double-click preview.bat   (or: python -m http.server 8000, then open http://localhost:8000)

PEOPLE PHOTOS & TESTIMONIALS
- Drop photos in assets/People/person-N.jpg, run `python tools/people.py`, then `python tools/build.py`.
  Labels/face focus live in PEOPLE in tools/content.py. They are shown as illustrative (not clients).
- Real quotes only: add entries to tools/testimonials.json, e.g.
  [{"quote": "...", "name": "Jane Doe", "role": "Owner, Acme", "photo": "img/people/jane.webp"}]
  ("photo" optional, only with the person's permission). Empty list = the section is hidden.

LEGAL PAGES (tools/legal.py) AND FRENCH (fr/)
- /privacy/, /cookies/, /terms/ come from tools/legal.py. They are a plain-language starting draft that is meant to be fair to both
  sides. Check the figures in the Terms (50% deposit, 2 revision rounds, 14-day invoices, 30-day quotes) and have a lawyer review them.
- Every page has a French copy under fr/ (same paths). `python tools/build.py` makes it from the English pages with tools/i18n.py
  and the dictionary tools/fr/dict.json. Text with no entry stays English and is listed in tools/fr-missing.json (the build prints the count).
- To change French wording: edit tools/fr_parts/p*.json (index -> French; keys in keys.json), run `python tools/fr_merge.py`, then build.
  New English copy needs new entries: add them to a new tools/fr/extra.json as {"English text": "French text"}.
