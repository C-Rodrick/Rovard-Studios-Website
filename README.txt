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
    js/site.js            Menu, reveals, hero rotator, filters, lightbox, start form

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

Preview locally:  python -m http.server 8000   then open http://localhost:8000
