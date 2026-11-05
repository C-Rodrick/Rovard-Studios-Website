# -*- coding: utf-8 -*-
"""Creative Edition: generates every page of the editorial site.

    python tools/edition/build.py

Writes index.html, fr/index.html, work/index.html, fr/work/index.html and
work/<slug>/index.html + fr/work/<slug>/index.html for every project.
Copy lives in words.py, project data in projects.json (run images.py after
adding project pictures). Styles: edition/edition.css. Script: edition/edition.js.
"""
import html, json, os, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import words as C  # noqa: E402

SITE, T, CAT = C.SITE, C.T, C.CATEGORY
PROJECTS = json.load(open(os.path.join(HERE, 'projects.json'), encoding='utf-8'))
BY = {p['slug']: p for p in PROJECTS}
FR = json.load(open(os.path.join(HERE, 'fr_projects.json'), encoding='utf-8'))
FR.update(C.FR_EXTRA)
FR.update({'Cinematic Film': 'Film cinématographique', 'Product Film': 'Film produit'})
CAT_KEY = {'Brand Identity Design': 'brand', 'Social Media Design': 'social', 'UI Design': 'ui',
           'Packaging': 'packaging', 'Motion Design': 'motion'}
VERSION = '1'

for i, p in enumerate(PROJECTS, 1):
    p['no'] = f'{i:02d}'
    p['concept'] = p['slug'] in C.CONCEPT
    p['cats'] = [CAT_KEY[p['category']]] + (['web'] if p.get('liveUrl') else [])

e = html.escape


def tr(lang, s):
    if not s or lang == 'en':
        return s
    return FR.get(s, s)


def url(path):
    """Site-absolute URL for a repo path (keeps spaces etc. safe)."""
    return '/' + urllib.parse.quote(urllib.parse.unquote(path.lstrip('/')))


def home(lang):
    return '/' if lang == 'en' else '/fr/'


def work_url(lang, slug=None):
    base = '/work/' if lang == 'en' else '/fr/work/'
    return base + (slug + '/' if slug else '')


def pic(p, n):
    """n = 0 for the cover, otherwise gallery number (1-based)."""
    return p['cover'] if n == 0 else p['gallery'][n - 1]


def img(im, alt, cls='', sizes='100vw', eager=False, attrs=''):
    w, h = im['size']
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    c = f' class="{cls}"' if cls else ''
    return (f'<img{c} src="{url(im["src"])}" width="{w}" height="{h}" alt="{e(alt)}" '
            f'{load} decoding="async" sizes="{sizes}"{(" " + attrs) if attrs else ""}>')


def label(t, text):
    return f'<span class="lbl">{text}</span>'


# ───────────────────────────── shared chrome ─────────────────────────────

LOGO_SVG = ('<svg class="mark" viewBox="0 0 181 171" aria-hidden="true"><rect width="181" height="171" fill="currentColor"/>'
            '<path fill="var(--mark-r)" d="M60.24 130V40.4H96.464C102.011 40.4 106.875 41.3813 111.056 43.344C115.323 45.2213 118.651 47.952 121.04 51.536C123.429 55.0347 124.624 59.2587 124.624 64.208V65.616C124.624 71.504 123.216 76.1547 120.4 79.568C117.584 82.9813 114.256 85.2853 110.416 86.48V88.272C113.488 88.3573 116.005 89.3813 117.968 91.344C120.016 93.2213 121.04 96.08 121.04 99.92V130H110.416V101.2C110.416 98.64 109.691 96.6773 108.24 95.312C106.875 93.9467 104.784 93.264 101.968 93.264H70.992V130H60.24ZM70.992 83.536H95.44C101.328 83.536 105.851 82.128 109.008 79.312C112.251 76.4107 113.872 72.4 113.872 67.28V66.384C113.872 61.264 112.293 57.296 109.136 54.48C105.979 51.5787 101.413 50.128 95.44 50.128H70.992V83.536Z"/></svg>')


def head(t, title, desc, path, alt_path, og_image='/assets/og-cover.jpg', extra=''):
    lang = t['lang']
    other = t['other']
    en_path = path if lang == 'en' else alt_path
    fr_path = path if lang == 'fr' else alt_path
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{SITE['url']}{path}">
<link rel="alternate" hreflang="en" href="{SITE['url']}{en_path}">
<link rel="alternate" hreflang="fr" href="{SITE['url']}{fr_path}">
<link rel="alternate" hreflang="x-default" href="{SITE['url']}{en_path}">
<meta name="theme-color" content="#F3F0E9">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Rovard Studios">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{SITE['url']}{path}">
<meta property="og:image" content="{SITE['url']}{og_image}">
<meta property="og:locale" content="{'en_CA' if lang == 'en' else 'fr_CA'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/edition/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/edition/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/edition/edition.css?v={VERSION}">
<script>document.documentElement.classList.add('js');</script>
<script src="/edition/edition.js?v={VERSION}" defer></script>
{extra}</head>
'''


def masthead(t, on_home, alt_path):
    lang = t['lang']
    pre = '' if on_home else home(lang)
    nav = ''.join(f'<a href="{pre}#{i}">{e(n)}</a>' for i, n in t['nav'])
    return f'''<a class="skip" href="#main">{t['skip']}</a>
<header class="mast" id="mast">
  <a class="mast-logo" href="{home(lang)}" aria-label="Rovard Studios">{LOGO_SVG}<span>Rovard Studios</span></a>
  <p class="mast-issue lbl" aria-hidden="true"><span>{t['issue']} {SITE['issue']}</span><span class="mast-sep">—</span><span class="mast-now" id="now">{t['edition']}</span></p>
  <nav class="mast-nav lbl" aria-label="Main">{nav}</nav>
  <div class="mast-tools lbl">
    <a class="mast-lang" href="{alt_path}" hreflang="{t['other']}" lang="{t['other']}" title="{t['other_label']}"><span aria-hidden="true">{t['short']} / </span><b>{t['other_short']}</b></a>
    <button class="mast-toc" type="button" aria-expanded="false" aria-controls="toc"><i aria-hidden="true"></i>{t['contents']}</button>
  </div>
</header>
'''


def toc(t, on_home):
    lang = t['lang']
    pre = '' if on_home else home(lang)
    items = []
    for n, (sid, name, sub) in enumerate(t['toc'], 1):
        items.append(f'<li><a href="{pre}#{sid}"><span class="toc-no">{n:02d}</span>'
                     f'<span class="toc-name">{e(name)}</span><span class="toc-sub">{e(sub)}</span></a></li>')
    items.append(f'<li><a href="{work_url(lang)}"><span class="toc-no">→</span>'
                 f'<span class="toc-name">{e(t["all_works"])}</span><span class="toc-sub">{len(PROJECTS)} {t["projects"]}</span></a></li>')
    return f'''<div class="toc" id="toc" hidden>
  <div class="toc-in">
    <p class="lbl toc-head"><span>{t['toc_title']}</span><span>{t['issue']} {SITE['issue']} · {SITE['year']}</span></p>
    <ol class="toc-list">{''.join(items)}</ol>
    <p class="lbl toc-foot"><a href="mailto:{SITE['email']}">{SITE['email']}</a><button type="button" class="toc-close">{t['close']} ✕</button></p>
  </div>
</div>
'''


def footer(t, on_home):
    lang = t['lang']
    pre = '' if on_home else home(lang)
    idx = ''.join(f'<li><a href="{pre}#{i}">{e(n)}</a></li>' for i, n in t['nav'])
    return f'''<footer class="colophon" id="colophon">
  <div class="col-grid">
    <div class="col-a"><p class="lbl">{t['colophon']}</p><p class="col-text">{t['colophon_text']}</p></div>
    <div><p class="lbl">{t['f_index']}</p><ul class="col-list">{idx}<li><a href="{work_url(lang)}">{t['all_works']} →</a></li></ul></div>
    <div><p class="lbl">{t['f_contact']}</p><ul class="col-list"><li><a href="mailto:{SITE['email']}">{SITE['email']}</a></li><li>{t['cover_where']}</li></ul></div>
    <div><p class="lbl">{t['f_lang']}</p><ul class="col-list"><li><a href="{'/' if lang == 'fr' else '#'}" {'aria-current="true"' if lang == 'en' else ''} lang="en">English</a></li><li><a href="{'/fr/' if lang == 'en' else '#'}" {'aria-current="true"' if lang == 'fr' else ''} lang="fr">Français</a></li></ul></div>
  </div>
  <p class="col-word" aria-hidden="true"><span data-fit>ROVARD</span></p>
  <p class="lbl col-base"><span>© <span data-year>{SITE['year']}</span> Rovard Studios. {t['rights']}</span><span>{t['issue']} {SITE['issue']} — {t['edition']}</span><a href="{pre}#cover">{t['back_top']} ↑</a></p>
</footer>
<div class="peek" id="peek" aria-hidden="true"><div class="peek-in"></div><span class="peek-cap lbl"></span></div>
'''


def page(t, title, desc, path, alt_path, body_cls, main, on_home=False, extra=''):
    return (head(t, title, desc, path, alt_path, extra=extra)
            + f'<body class="{body_cls}">\n' + masthead(t, on_home, alt_path) + toc(t, on_home)
            + f'<main id="main">\n{main}\n</main>\n' + footer(t, on_home) + '</body>\n</html>\n')


def meta_line(t, p):
    lang = t['lang']
    bits = [f'<span>{t["no"]} {p["no"]}</span>', f'<span>{e(CAT[lang][p["category"]])}</span>', f'<span>{p["year"]}</span>']
    if p['concept']:
        bits.append(f'<span class="tag">{t["concept"]}</span>')
    return '<p class="lbl meta">' + ''.join(bits) + '</p>'


# ───────────────────────────── home ─────────────────────────────

def sec_head(n, lbl, title, intro='', cls=''):
    return f'''<header class="sh {cls}">
  <p class="sh-no" aria-hidden="true">{n}</p>
  <p class="lbl sh-lbl"><span>§{n}</span> {lbl}</p>
  <h2 class="sh-title" data-reveal>{title}</h2>
  {f'<p class="sh-intro" data-reveal>{intro}</p>' if intro else ''}
</header>'''


def home_cover(t):
    lang = t['lang']
    slug, n = C.COVER_IMAGE
    p = BY[slug]
    inside = ''.join(f'<li><a href="#{sid}"><span>{i:02d}</span>{e(name)}</a></li>'
                     for i, (sid, name, _) in enumerate(t['toc'][1:], 2))
    return f'''<section class="cover" id="cover" data-section="01 — {e(t['toc'][0][1])}">
  <div class="cover-top lbl">
    <span>{t['cover_kicker']}</span>
    <span>{t['issue']} {SITE['issue']}</span>
    <span>{t['edition']}</span>
    <span>{t['cover_where']} — {SITE['year']}</span>
  </div>
  <h1 class="cover-word" aria-label="Rovard Studios"><span data-fit class="cw">{''.join(f'<i style="--i:{i}">{c}</i>' for i, c in enumerate('ROVARD'))}</span></h1>
  <div class="cover-grid">
    <div class="cover-inside">
      <p class="lbl">{t['cover_inside']}</p>
      <ol>{inside}</ol>
    </div>
    <figure class="cover-fig">
      <a href="{work_url(lang, slug)}" class="cover-img">{img(pic(p, n), p['title'], sizes='(max-width: 760px) 92vw, 34vw', eager=True)}</a>
      <figcaption class="lbl"><span>{t['cover_caption']}</span> {e(p['title'])}, {e(CAT[lang][p['category']])}</figcaption>
    </figure>
    <div class="cover-line">
      <p class="serif">{t['cover_line']}</p>
      <span class="sticker" aria-hidden="true"><b>{t['sticker']}</b><i>{SITE['issue']}</i></span>
    </div>
  </div>
</section>'''


def home_hero(t):
    lang = t['lang']
    w = t['hero_words']
    imgs = []
    for i, (slug, n) in enumerate(C.HERO_IMAGES):
        p = BY[slug]
        im = pic(p, n)
        imgs.append(f'<span class="hi-frame{" on" if i == 0 else ""}" data-title="{e(p["title"])}">'
                    + img(im, '' if i else p['title'], sizes='30vw', eager=(i == 0)) + '</span>')
    first = BY[C.HERO_IMAGES[0][0]]['title']
    return f'''<section class="hero" id="idea" data-section="02 — {e(t['hero_label'])}">
  <p class="lbl hero-lbl"><span>§02</span> {t['hero_label']}</p>
  <h2 class="hero-type" data-field>
    <span class="hw hw1" data-w>{e(w[0])}</span>
    <span class="hw hw2"><span data-w>{e(w[1])}</span><span class="hero-aside lbl">{t['hero_aside']}</span></span>
    <span class="hw hw3"><span data-w>{e(w[2])}</span><span class="hero-img" aria-hidden="true">{''.join(imgs)}</span></span>
    <span class="hw hw4" data-w>{e(w[3])}</span>
    <span class="hw hw5 serif">{e(w[4])}</span>
  </h2>
  <p class="lbl hero-fig" aria-live="off"><span>{t['fig']} <b id="hfn">01</b></span> <span id="hft">{e(first)}</span></p>
  <div class="hero-foot">
    <p class="hero-lede" data-reveal>{t['hero_lede']}</p>
    <p class="hero-cta" data-reveal><a class="btn" href="#works">{t['hero_cta']} <span aria-hidden="true">↓</span></a><a class="btn btn-line" href="#contact">{t['start']} <span aria-hidden="true">↗</span></a></p>
  </div>
</section>
<div class="band" aria-hidden="true"><div class="band-track" data-drift>{''.join(f'<span class="{"serif" if i % 2 else ""}">{e(b)}</span><b>✦</b>' for i, b in enumerate(t['band'] * 3))}</div></div>'''


def feature(t, f, k):
    lang = t['lang']
    p = BY[f['slug']]
    href = work_url(lang, p['slug'])
    lead = pic(p, f['img'])
    extras = [pic(p, n) for n in f.get('extra', [])]
    summary = e(tr(lang, p['summary']))
    title = e(p['title'])
    vt = f'style="view-transition-name: p-{p["slug"]}"'
    lay = f['layout']
    read = f'<a class="more" href="{href}">{t["read_story"]} <span aria-hidden="true">→</span></a>'
    services = e(tr(lang, p['services']))
    if lay == 'bleed':
        return f'''<article class="ft ft-bleed" data-reveal>
  <a class="ft-media" href="{href}" data-cursor="{t['cursor_read']}" aria-label="{title}"><span class="wipe">{img(lead, p['title'], sizes='100vw', attrs=vt)}</span></a>
  <h3 class="ft-title ft-over"><a href="{href}">{title}</a></h3>
  <div class="ft-row">{meta_line(t, p)}<p class="ft-sum serif">{summary}</p><p class="lbl ft-svc">{services}</p>{read}</div>
</article>'''
    if lay == 'offset':
        return f'''<article class="ft ft-offset" data-reveal>
  <p class="ft-vert lbl" aria-hidden="true">{e(CAT[lang][p['category']])} — {t['no']} {p['no']}</p>
  <div class="ft-text">
    {meta_line(t, p)}
    <h3 class="ft-title ft-stack"><a href="{href}">{'<br>'.join(e(w) for w in p['title'].split(' '))}</a></h3>
    <p class="ft-sum">{summary}</p>{read}
  </div>
  <a class="ft-media ft-main" href="{href}" data-cursor="{t['cursor_read']}" aria-label="{title}"><span class="wipe">{img(lead, p['title'], sizes='(max-width: 760px) 100vw, 55vw', attrs=vt)}</span></a>
  <span class="ft-media ft-small wipe" aria-hidden="true">{img(extras[0], '', sizes='22vw')}</span>
</article>'''
    if lay == 'film':
        return f'''<article class="ft ft-film env-ink" data-reveal>
  <div class="ft-film-head">{meta_line(t, p)}<h3 class="ft-title"><a href="{href}">Proxima <em class="serif">Exchange</em> {t['films']}</a></h3></div>
  <a class="ft-media ft-screen" href="{href}" data-cursor="{t['cursor_read']}" aria-label="{title}">
    <video class="loop" muted loop playsinline preload="none" poster="/edition/video/proxima-loop.webp" {vt}><source src="/edition/video/proxima-loop.mp4" type="video/mp4"></video>
  </a>
  <p class="ft-side ft-side-l lbl">{services}</p>
  <div class="ft-side ft-side-r"><p class="ft-sum">{summary}</p>{read}</div>
</article>'''
    if lay == 'split':
        return f'''<article class="ft ft-split" data-reveal>
  <a class="ft-media ft-a" href="{href}" data-cursor="{t['cursor_read']}" aria-label="{title}"><span class="wipe">{img(lead, p['title'], sizes='(max-width: 760px) 100vw, 56vw', attrs=vt)}</span></a>
  <div class="ft-text">{meta_line(t, p)}<h3 class="ft-title"><a href="{href}">Mason <em class="serif">&amp;</em> Rowe</a></h3><p class="ft-sum">{summary}</p>{read}</div>
  <span class="ft-media ft-b wipe" aria-hidden="true">{img(extras[0], '', sizes='(max-width: 760px) 60vw, 30vw')}</span>
</article>'''
    if lay == 'interrupt':
        return f'''<article class="ft ft-int" data-reveal>
  <h3 class="ft-title ft-word"><a href="{href}" aria-label="{title}" data-fit data-cursor="{t['cursor_read']}"><span>Bite</span><span class="ft-in wipe">{img(lead, '', sizes='30vw', attrs=vt)}</span><span>fort</span></a></h3>
  <div class="ft-row">{meta_line(t, p)}<p class="ft-sum serif">{summary}</p><span class="ft-media ft-small wipe" aria-hidden="true">{img(extras[0], '', sizes='20vw')}</span>{read}</div>
</article>'''
    # triptych
    return f'''<article class="ft ft-tri env-cobalt" data-reveal>
  <h3 class="ft-title ft-vertical"><a href="{href}">{title}</a></h3>
  <a class="ft-media t1" href="{href}" data-cursor="{t['cursor_read']}" aria-label="{title}"><span class="wipe">{img(lead, p['title'], sizes='(max-width: 760px) 100vw, 44vw', attrs=vt)}</span></a>
  <span class="ft-media t2 wipe" aria-hidden="true">{img(extras[0], '', sizes='(max-width: 760px) 50vw, 26vw')}</span>
  <span class="ft-media t3 wipe" aria-hidden="true">{img(extras[1], '', sizes='(max-width: 760px) 50vw, 22vw')}</span>
  <div class="ft-text">{meta_line(t, p)}<p class="ft-sum">{summary}</p>{read}</div>
</article>'''


def home_works(t):
    lang = t['lang']
    fts = ''.join(feature(t, f, k) for k, f in enumerate(C.FEATURES))
    return f'''<section class="works" id="works" data-section="03 — {e(t['works_label'])}">
  {sec_head('03', t['works_label'], t['works_title'], t['works_intro'])}
  {fts}
  <p class="works-all"><a class="btn btn-big" href="{work_url(lang)}">{t['all_works']} <span class="lbl">{len(PROJECTS)} {t['projects']}</span> <span aria-hidden="true">→</span></a></p>
</section>'''


def home_studio(t):
    gl = ''.join(f'''<li data-reveal><p class="gl-word"><span class="serif">{e(w)}</span> <i class="lbl">{e(g)}</i></p><p class="gl-num lbl">{i:02d}</p><p class="gl-def">{e(d)}</p></li>'''
                 for i, (w, g, d) in enumerate(t['principles'], 1))
    return f'''<section class="studio" id="studio" data-section="04 — {e(t['studio_label'])}">
  <p class="lbl sh-lbl"><span>§04</span> {t['studio_label']}</p>
  <p class="studio-st" data-reveal>{t['studio_statement']}</p>
  <div class="studio-cols">
    <p class="dropcap" data-reveal>{t['studio_p1']}</p>
    <p data-reveal>{t['studio_p2']}</p>
    <p class="lbl studio-note" data-reveal>{e(t['band'][0])} {e(t['band'][1])}.</p>
  </div>
  <p class="lbl gl-head">{t['principles_label']}</p>
  <ol class="glossary">{gl}</ol>
</section>'''


def home_departments(t):
    lang = t['lang']
    rows = []
    for i, (name, cat, desc) in enumerate(t['departments'], 1):
        if cat == 'web':
            ps = [p for p in PROJECTS if p.get('liveUrl')]
            key, count_lbl = 'web', t['live_sites']
        else:
            ps = [p for p in PROJECTS if p['category'] == cat]
            key, count_lbl = CAT_KEY[cat], t['in_archive']
        peek = ','.join(url(p['cover']['src']) for p in ps[:4])
        rows.append(f'''<li><a class="dept" href="{work_url(lang)}?d={key}" data-peek="{peek}" data-cap="{e(name)}">
  <span class="dept-no lbl">{i:02d}</span><span class="dept-name">{e(name)}</span>
  <span class="dept-desc">{e(desc)}</span><span class="dept-count lbl">{len(ps):02d} {count_lbl} →</span></a></li>''')
    return f'''<section class="depts env-ink" id="departments" data-section="05 — {e(t['dept_label'])}">
  {sec_head('05', t['dept_label'], t['dept_title'], t['dept_intro'])}
  <ol class="dept-list">{''.join(rows)}</ol>
</section>'''


def home_archive(t):
    lang = t['lang']
    runs = []
    for p in PROJECTS:
        runs.append(f'<a class="arun" href="{work_url(lang, p["slug"])}" data-peek="{url(p["cover"]["src"])}" data-cap="{t["no"]} {p["no"]} — {e(CAT[lang][p["category"]])}">'
                    f'<span>{e(p["title"])}</span><sup class="lbl">{p["no"]}</sup></a>')
    return f'''<section class="archive" id="archive" data-section="06 — {e(t['archive_label'])}">
  {sec_head('06', t['archive_label'], t['archive_title'], t['archive_hint'])}
  <p class="arun-wrap">{' <span class="sl" aria-hidden="true">/</span> '.join(runs)}</p>
  <p class="archive-open"><a class="btn btn-line" href="{work_url(lang)}">{t['archive_open']} <span aria-hidden="true">→</span></a></p>
</section>'''


def home_notes(t):
    notes = ''.join(f'''<li data-reveal><p class="note-no lbl">{t['notes_label']} — {i:02d}</p><h3 class="note-h">{e(a)}</h3><p class="note-t serif">{e(b)}</p><p class="note-p">{e(c)}</p></li>'''
                    for i, (a, b, c) in enumerate(t['notes'], 1))
    return f'''<section class="notes" id="notes" data-section="07 — {e(t['notes_label'])}">
  {sec_head('07', t['notes_label'], t['notes_title'])}
  <ol class="note-list">{notes}</ol>
</section>'''


def contact_form(t):
    svc = ''.join(f'<label class="chip"><input type="checkbox" name="services" value="{e(v)}"><span>{e(l)}</span></label>'
                  for v, l in t['f_services_list'])
    bud = ''.join(f'<option>{e(b)}</option>' for b in t['f_budgets'])
    tim = ''.join(f'<option>{e(b)}</option>' for b in t['f_timelines'])
    return f'''<form class="brief" id="brief" action="{SITE['formspree']}" method="POST" novalidate
  data-sending="{e(t['f_sending'])}" data-err="{e(t['f_err'])}" data-need="{e(t['f_need'])}" data-ok-title="{e(t['f_ok_title'])}" data-ok-text="{e(t['f_ok_text'])}">
  <input type="hidden" name="language" value="{t['lang']}">
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
  <label class="fld"><span class="lbl">01 — {t['f_name']}</span><input name="name" type="text" autocomplete="name" required></label>
  <label class="fld"><span class="lbl">02 — {t['f_email']}</span><input name="email" type="email" autocomplete="email" required></label>
  <label class="fld fld-wide"><span class="lbl">03 — {t['f_company']}</span><input name="company" type="text" autocomplete="organization"></label>
  <fieldset class="fld fld-wide"><legend class="lbl">04 — {t['f_services']}</legend><div class="chips">{svc}</div></fieldset>
  <label class="fld"><span class="lbl">05 — {t['f_budget']}</span><select name="budget"><option value="">{t['f_select']}</option>{bud}</select></label>
  <label class="fld"><span class="lbl">06 — {t['f_timeline']}</span><select name="timeline"><option value="">{t['f_select']}</option>{tim}</select></label>
  <label class="fld fld-wide"><span class="lbl">07 — {t['f_goals']}</span><textarea name="goals" rows="3" required></textarea></label>
  <label class="fld fld-wide"><span class="lbl">08 — {t['f_website']}</span><input name="website" type="url" inputmode="url" placeholder="https://"></label>
  <p class="brief-err" role="alert" aria-live="polite"></p>
  <button class="btn btn-paper" type="submit">{t['f_send']} <span aria-hidden="true">↗</span></button>
</form>'''


def home_contact(t):
    return f'''<section class="contact env-cobalt" id="contact" data-section="08 — {e(t['contact_label'])}">
  <p class="lbl sh-lbl"><span>§08</span> {t['contact_label']}</p>
  <h2 class="contact-h" data-reveal>{t['contact_title']}</h2>
  <div class="contact-grid">
    <div class="contact-side">
      <p class="contact-intro">{t['contact_intro']}</p>
      <p class="lbl">{t['or_write']}</p>
      <p class="contact-mail"><a href="mailto:{SITE['email']}">{SITE['email']}</a></p>
    </div>
    {contact_form(t)}
  </div>
</section>'''


def build_home(lang):
    t = T[lang]
    main = '\n'.join([home_cover(t), home_hero(t), home_works(t), home_studio(t), home_departments(t),
                      home_archive(t), home_notes(t), home_contact(t)])
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Organization', 'name': 'Rovard Studios',
        'url': SITE['url'] + home(lang), 'logo': SITE['url'] + '/assets/rovard-logo.svg', 'email': SITE['email'],
        'description': t['home_desc'], 'areaServed': 'Worldwide', 'address': {'@type': 'PostalAddress', 'addressCountry': 'CA'},
    }, ensure_ascii=False)
    out = page(t, t['home_title'], t['home_desc'], home(lang), home(t['other']), 'home', main, on_home=True,
               extra=f'<script type="application/ld+json">{ld}</script>\n')
    write(('' if lang == 'en' else 'fr/') + 'index.html', out)


# ───────────────────────────── archive ─────────────────────────────

def build_archive(lang):
    t = T[lang]
    filters = [('all', t['filter_all'], len(PROJECTS))]
    for cat in C.CATEGORY_ORDER:
        filters.append((CAT_KEY[cat], CAT[lang][cat], sum(p['category'] == cat for p in PROJECTS)))
    filters.append(('web', t['departments'][5][0], sum(bool(p.get('liveUrl')) for p in PROJECTS)))
    fbtn = ''.join(f'<button type="button" class="flt" data-f="{k}" aria-pressed="{"true" if k == "all" else "false"}">{e(n)} <sup>{c:02d}</sup></button>'
                   for k, n, c in filters)
    rows, sheet = [], []
    for p in PROJECTS:
        href = work_url(lang, p['slug'])
        cats = ' '.join(p['cats'])
        status = f'<span class="tag">{t["concept"]}</span>' if p['concept'] else ''
        rows.append(f'''<li data-cats="{cats}"><a class="ix" href="{href}" data-peek="{url(p['cover']['src'])}" data-cap="{e(p['title'])}">
  <span class="ix-no lbl">{p['no']}</span><span class="ix-title">{e(p['title'])} {status}</span>
  <span class="ix-cat lbl">{e(CAT[lang][p['category']])}</span><span class="ix-svc">{e(tr(lang, p['services']))}</span><span class="ix-yr lbl">{p['year']}</span></a></li>''')
        sheet.append(f'''<li data-cats="{cats}"><a href="{href}" class="cs" data-cursor="{t['cursor_open']}">
  <span class="cs-img">{img(p['cover'], p['title'], sizes='(max-width: 760px) 50vw, 24vw', attrs=f'style="view-transition-name: p-{p["slug"]}"')}</span>
  <span class="cs-cap lbl"><b>{p['no']}A</b> {e(p['title'])}</span></a></li>''')
    main = f'''<section class="arch-top" data-section="{e(t['arch_h'])}">
  <p class="lbl sh-lbl"><span>{t['issue']} {SITE['issue']}</span> {len(PROJECTS)} {t['projects']} · {SITE['year']}</p>
  <h1 class="arch-h"><span data-fit>{e(t['arch_h'])}</span></h1>
  <p class="arch-intro serif">{t['arch_intro']}</p>
  <div class="arch-bar">
    <div class="flts" role="group" aria-label="{t['discipline']}">{fbtn}</div>
    <div class="views lbl" role="group"><button type="button" class="vw" data-v="index" aria-pressed="true">{t['view_index']}</button><button type="button" class="vw" data-v="sheet" aria-pressed="false">{t['view_sheet']}</button></div>
  </div>
</section>
<section class="arch-body" data-view="index">
  <p class="ix-head lbl" aria-hidden="true"><span>{t['col_no']}</span><span>{t['col_title']}</span><span>{t['col_disc']}</span><span>{t['col_services']}</span><span>{t['col_year']}</span></p>
  <ol class="ix-list">{''.join(rows)}</ol>
  <ol class="cs-list">{''.join(sheet)}</ol>
</section>'''
    out = page(t, t['arch_title'], t['arch_desc'], work_url(lang), work_url(t['other']), 'archive-page', main)
    write(('' if lang == 'en' else 'fr/') + 'work/index.html', out)


# ───────────────────────────── case pages ─────────────────────────────

def gallery(p, t):
    items = p['gallery']
    out, i, k = [], 0, 0
    modes = ['full', 'pair', 'right', 'pair', 'left']
    while i < len(items):
        mode = modes[k % len(modes)]
        k += 1
        if mode == 'pair' and i + 1 >= len(items):
            mode = 'right'
        take = 2 if mode == 'pair' else 1
        grp = items[i:i + take]
        figs = ''.join(f'<figure class="pl" data-reveal><span class="wipe">{img(im, f"{p["title"]}, {t["plate"].lower()} {i + j + 1:02d}", sizes="(max-width: 760px) 100vw, " + ("100vw" if mode == "full" else "60vw"))}</span>'
                       f'<figcaption class="lbl">{t["plate"]} {i + j + 1:02d}</figcaption></figure>' for j, im in enumerate(grp))
        out.append(f'<div class="plates plates-{mode}">{figs}</div>')
        i += take
    return ''.join(out)


def films(p, t, lang):
    vids = p.get('videos') or ([{'title': '', 'src': p['video'], 'poster': p.get('poster', '')}] if p.get('video') else [])
    if not vids:
        return ''
    v = ''.join(f'''<figure class="film"><video controls preload="none" playsinline poster="{url(x.get('poster') or p['coverImage'])}"><source src="{url(x['src'])}" type="video/mp4"></video>
<figcaption class="lbl">{t['films']} {i:02d}{(' — ' + e(tr(lang, x['title']))) if x.get('title') else ''}</figcaption></figure>''' for i, x in enumerate(vids, 1))
    return f'<section class="films env-ink"><p class="lbl sh-lbl">{t["films"]}</p>{v}</section>'


def build_case(p, lang):
    t = T[lang]
    idx = PROJECTS.index(p)
    nxt = PROJECTS[(idx + 1) % len(PROJECTS)]
    prv = PROJECTS[idx - 1]
    href = work_url(lang, p['slug'])
    live = ''
    if p.get('liveUrl'):
        lbl = tr(lang, p.get('liveLabel') or t['view_live']).replace(' ↗', '')
        live = f'<a class="btn btn-line" href="{url(p["liveUrl"])}" target="_blank" rel="noopener">{e(lbl)} <span aria-hidden="true">↗</span></a>'
    status = f'<div><dt class="lbl">{t["status"]}</dt><dd><span class="tag">{t["concept"]}</span></dd></div>' if p['concept'] else ''
    blocks = []
    for key in ('challenge', 'approach', 'made'):
        txt = p.get(key) or (p.get('outcome') if key == 'made' else '')
        if txt:
            blocks.append(f'<div class="art-b" data-reveal><h2 class="lbl">{t[key]}</h2><p>{e(tr(lang, txt))}</p></div>')
    long_title = len(p['title']) > 16
    main = f'''<article class="case" data-section="{t['no']} {p['no']} — {e(p['title'])}">
  <header class="case-top">
    <p class="lbl crumbs"><a href="{work_url(lang)}">{t['archive']}</a> / <span>{t['no']} {p['no']}</span> / <span>{e(CAT[lang][p['category']])}</span></p>
    <h1 class="case-h{' case-h-long' if long_title else ''}" style="--lw: {max(6, max(len(w) for w in p['title'].split()))}">{e(p['title'])}</h1>
    <div class="case-intro">
      <p class="case-stand serif">{e(tr(lang, p['summary']))}</p>
      <dl class="case-meta">
        <div><dt class="lbl">{t['discipline']}</dt><dd>{e(CAT[lang][p['category']])}</dd></div>
        <div><dt class="lbl">{t['year']}</dt><dd>{p['year']}</dd></div>
        <div><dt class="lbl">{t['services']}</dt><dd>{e(tr(lang, p['services']))}</dd></div>
        {status}
      </dl>
    </div>
  </header>
  <figure class="case-cover"><span class="wipe">{img(p['cover'], p['title'], sizes='100vw', eager=True, attrs=f'style="view-transition-name: p-{p["slug"]}"')}</span></figure>
  <div class="art">{''.join(blocks)}<p class="art-cta">{live}<a class="btn" href="{home(lang)}#contact">{t['similar']} <span aria-hidden="true">↗</span></a></p></div>
  {films(p, t, lang)}
  <section class="gallery" aria-label="{t['gallery']}">{gallery(p, t)}</section>
  <nav class="case-next" aria-label="{t['next']}">
    <a class="cn-prev lbl" href="{work_url(lang, prv['slug'])}">← {t['prev']} — {e(prv['title'])}</a>
    <a class="cn-main" href="{work_url(lang, nxt['slug'])}" data-peek="{url(nxt['cover']['src'])}" data-cap="{t['no']} {nxt['no']}">
      <span class="lbl">{t['next']} — {t['no']} {nxt['no']}</span><span class="cn-title">{e(nxt['title'])} <span aria-hidden="true">→</span></span></a>
  </nav>
</article>'''
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': p['title'],
                     'description': tr(lang, p['summary']), 'genre': CAT[lang][p['category']], 'dateCreated': p['year'],
                     'image': SITE['url'] + url(p['cover']['src']), 'url': SITE['url'] + href,
                     'creator': {'@type': 'Organization', 'name': 'Rovard Studios', 'url': SITE['url']}}, ensure_ascii=False)
    title = f"{p['title']} — {CAT[lang][p['category']]} · Rovard Studios"
    out = page(t, title, tr(lang, p['summary']), href, work_url(t['other'], p['slug']), 'case-page', main,
               extra=f'<script type="application/ld+json">{ld}</script>\n')
    out = out.replace('content="/assets/og-cover.jpg"', '')
    out = out.replace(f'{SITE["url"]}/assets/og-cover.jpg', SITE['url'] + url(p['cover']['src']))
    write(('' if lang == 'en' else 'fr/') + f'work/{p["slug"]}/index.html', out)


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(text)


def main():
    missing = set()
    for lang in ('en', 'fr'):
        build_home(lang)
        build_archive(lang)
        for p in PROJECTS:
            build_case(p, lang)
    for p in PROJECTS:
        for k in ('summary', 'challenge', 'approach', 'made', 'services'):
            if p.get(k) and p[k] not in FR:
                missing.add((p['slug'], k))
    print(f'Built {2 * (2 + len(PROJECTS))} pages.', f'French missing for: {sorted(missing)}' if missing else 'French complete.')


if __name__ == '__main__':
    main()
