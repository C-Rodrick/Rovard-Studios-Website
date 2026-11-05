# -*- coding: utf-8 -*-
"""Generate the Obsidian Architecture edition of ROVARD STUDIOS into the repo root.

    node tools/oa/bundle.mjs     JS and CSS  (or: npm run build, for both)
    python tools/oa/build.py     every page, English and French

Facts come from the existing data modules (tools/content.py, projects-raw.json, landing.py, blogdata.py, legal.py).
New copy lives in tools/oa/oa_copy.py. French goes through tools/i18n.py with tools/fr/*.json.
"""
import html, json, os, re, shutil, sys, time, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
from content import (BRAND, SITE, ROOT, KIND, NEEDS, BUDGETS, PACKAGES, FAQ, SERVICES, load_projects)
from blogdata import with_more
from landing import LANDING
from legal import PAGES as LEGAL, UPDATED as LEGAL_UPDATED
from oa_copy import *  # noqa

POSTS = with_more()
VERSION = time.strftime('%Y%m%d%H%M')
MANIFEST = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json')))
PROJECTS = load_projects()
BY = {p['slug']: p for p in PROJECTS}
LOGO = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20White.svg'
esc = html.escape

ARROW = '<svg class="arw" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.500" stroke="currentColor" stroke-width="1.6"/></svg>'


def q(path):
    return urllib.parse.quote(path, safe='/')


def clip(t, n=158):
    t = ' '.join(t.split())
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0].rstrip(',;:·—-') + '…'


_DESC_RE = re.compile(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")([^"]*)(">)')


def clip_meta(h):
    """Trim descriptions to search-result length. Runs after translation, so the dictionary sees whole sentences."""
    return _DESC_RE.sub(lambda m: m.group(1) + esc(clip(html.unescape(m.group(2)))) + m.group(3), h)


FR_H1 = ('<span class="ln" style="--k:.0351;--i:0">Nous transformons les idées</span> '
         '<span class="ln" style="--k:.0415;--i:1">en expériences visuelles</span> '
         '<span class="ln ln-b" style="--k:.0607;--i:2">extraordinaires.</span>')


def fr_post(h):
    # The fitted headline depends on line lengths, so French has its own measured version.
    h = re.sub(r'(<h1 class="fit">).*?(</h1>)', lambda m: m.group(1) + FR_H1 + m.group(2), h, flags=re.S)
    return clip_meta(h)


def img(slug, idx, alt, base, sizes='100vw', cls='', eager=False, want=None, vt=False):
    m = MANIFEST[slug][str(idx)]
    ws = m['sizes']
    srcset = ', '.join(f'{base}img/{slug}/{idx:02d}-{w}.webp {w}w' for w in ws)
    mid = next((w for w in ws if w >= (want or 1100)), ws[-1])
    h = round(m['h'] * ws[-1] / m['w'])
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ''
    vs = f' style="view-transition-name:p-{slug}"' if vt else ''
    return (f'<img{c}{vs} src="{base}img/{slug}/{idx:02d}-{mid}.webp" srcset="{srcset}" sizes="{sizes}" '
            f'width="{ws[-1]}" height="{h}" alt="{esc(alt)}" {load}>')


def key_img(slug):
    return KEY_IMAGE.get(slug, 0)


def still(name, base, cls='scene-still', eager=False):
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    return (f'<picture class="{cls}" aria-hidden="true"><source media="(max-aspect-ratio: 1/1)" srcset="{base}img/core/{name}-tall.webp" width="780" height="1250">'
            f'<img src="{base}img/core/{name}-wide.webp" width="1680" height="1050" alt="" {load}></picture>')


def btn(label, href, kind='line', attrs=''):
    return f'<a class="btn btn--{kind}" href="{href}"{attrs}><span>{label}</span>{ARROW}</a>'


def badge(p):
    return '<span class="tag tag--concept">Concept</span>' if p['concept'] else ''


# ── Chrome ────────────────────────────────────────────────────────────────
ORG_ID = SITE['url'] + '/#organization'
NAV = [('work', 'Work', 'work/'), ('capabilities', 'Capabilities', 'capabilities/'), ('studio', 'Studio', 'studio/'), ('contact', 'Contact', 'contact/')]
TOPS = {'services': 'capabilities', 'blog': 'blog', 'pricing': 'pricing', 'start': 'start'}


def site_ld():
    return {'@context': 'https://schema.org', '@graph': [
        {'@type': ['Organization', 'ProfessionalService'], '@id': ORG_ID, 'name': BRAND, 'url': SITE['url'] + '/',
         'logo': {'@type': 'ImageObject', 'url': f"{SITE['url']}/assets/favicon/icon-512.png", 'width': 512, 'height': 512},
         'image': f"{SITE['url']}/assets/og-cover.jpg", 'email': SITE['email'],
         'address': {'@type': 'PostalAddress', 'addressCountry': 'CA'},
         'areaServed': [{'@type': 'Country', 'name': 'Canada'}, 'Worldwide'],
         'knowsLanguage': ['en', 'fr'], 'description': META['home'][1]},
        {'@type': 'WebSite', '@id': SITE['url'] + '/#website', 'url': SITE['url'] + '/', 'name': BRAND,
         'publisher': {'@id': ORG_ID}, 'inLanguage': ['en', 'fr']},
    ]}


def crumbs(items):
    full = [('Home', '')] + items
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': f"{SITE['url']}/{u}"} for i, (n, u) in enumerate(full)]}


def head(title, desc, path, base, ld=(), preload='', og_image=None):
    url = f"{SITE['url']}/{path}"
    blocks = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in [site_ld(), *ld])
    og = og_image or f"{SITE['url']}/assets/og-cover.jpg"
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#080A10">
<meta name="color-scheme" content="dark">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{url}">
<link rel="alternate" hreflang="fr" href="{SITE['url']}/fr/{path}">
<link rel="alternate" hreflang="x-default" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_CA">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{base}favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="{base}assets/favicon/icon-32.png">
<link rel="apple-touch-icon" href="{base}assets/favicon/icon-180.png">
<link rel="preload" href="{base}css/fonts/Syne.woff2" as="font" type="font/woff2" crossorigin>
{preload}<link rel="stylesheet" href="{base}css/oa.css?v={VERSION}">
<script>(function(d){{d.className='js';try{{if(sessionStorage.getItem('oa-seen'))d.className+=' seen';sessionStorage.setItem('oa-seen','1')}}catch(e){{}}}})(document.documentElement)</script>
{blocks}<script type="module" src="{base}js/oa/site.js?v={VERSION}"></script>
</head>
'''


def header(base, current):
    links = ''.join(
        f'<li><a href="{base}{u}"{" aria-current=\"page\"" if k == current else ""}>{t}</a></li>' for k, t, u in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="top" data-top>
  <a class="top-logo" href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO}" width="450" height="171" alt="{BRAND}"></a>
  <nav class="top-nav" aria-label="Main"><ul>{links}</ul></nav>
  <a class="top-cta" href="{base}start/"{' aria-current="page"' if current == 'start' else ''}><i aria-hidden="true"></i><span>Start a project</span></a>
  <button class="top-menu" type="button" aria-expanded="false" aria-controls="menu" data-menu-open><span class="sr">Open menu</span><i aria-hidden="true"></i><i aria-hidden="true"></i></button>
</header>
<dialog class="menu" id="menu" aria-label="Menu">
  <div class="menu-head"><img src="{base}{LOGO}" width="450" height="171" alt=""><button class="menu-close" type="button" data-menu-close>Close</button></div>
  <nav aria-label="Menu"><ol>
    <li><a href="{base or './'}"><small>00</small>Home</a></li>
    <li><a href="{base}work/"><small>01</small>Work</a></li>
    <li><a href="{base}capabilities/"><small>02</small>Capabilities</a></li>
    <li><a href="{base}studio/"><small>03</small>Studio</a></li>
    <li><a href="{base}pricing/"><small>04</small>Pricing</a></li>
    <li><a href="{base}blog/"><small>05</small>Insights</a></li>
    <li><a href="{base}contact/"><small>06</small>Contact</a></li>
  </ol></nav>
  <div class="menu-foot">{btn('Start a project', base + 'start/', 'yellow')}<a href="mailto:{SITE['email']}">{SITE['email']}</a></div>
</dialog>'''


def footer(base, path):
    return f'''<footer class="foot">
  <div class="foot-top">
    <p class="foot-line">Beyond the frame.</p>
    <a class="foot-mail" href="mailto:{SITE['email']}">{SITE['email']}</a>
  </div>
  <div class="foot-grid">
    <nav aria-label="Footer"><h2 class="meta">Studio</h2><ul>
      <li><a href="{base}work/">Work</a></li><li><a href="{base}capabilities/">Capabilities</a></li><li><a href="{base}studio/">Studio</a></li>
      <li><a href="{base}pricing/">Pricing</a></li><li><a href="{base}blog/">Insights</a></li><li><a href="{base}contact/">Contact</a></li><li><a href="{base}start/">Start a project</a></li></ul></nav>
    <nav aria-label="Services"><h2 class="meta">What we make</h2><ul>
      {''.join(f'<li><a href="{base}services/{LANDING[s["id"]]["slug"]}/">{esc(s["title"])}</a></li>' for s in SERVICES)}</ul></nav>
    <div><h2 class="meta">Where</h2><p>{esc(SITE['location'])}</p><p class="foot-lang"><span data-lang><a href="./" aria-current="true">EN</a><a href="{base}fr/{path}" hreflang="fr" lang="fr">FR</a></span></p></div>
  </div>
  <div class="foot-base"><span>© {SITE['year']} {BRAND}. All rights reserved.</span>
    <span class="foot-legal"><a href="{base}privacy/">Privacy Policy</a><a href="{base}cookies/">Cookie Preferences</a><a href="{base}terms/">Terms</a></span>
    <button class="totop" type="button" data-totop><span>Back to top</span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="16" height="16"><path d="M8 14V3M3.500 7 8 2.500 12.500 7" stroke="currentColor" stroke-width="1.6"/></svg></button></div>
</footer>'''


BUILT = []
SECTION_NAME = {'capabilities': 'Capabilities', 'services': 'Capabilities', 'work': 'Work', 'blog': 'Insights', 'pricing': 'Pricing', 'studio': 'Studio', 'start': 'Start a project',
                'contact': 'Contact', 'privacy': 'Privacy', 'cookies': 'Cookies', 'terms': 'Terms'}


def page(path, key, body, title=None, desc=None, cls='', ld=(), stage=None, preload='', current=None):
    depth = path.count('/') if path else 0
    base = '../' * depth
    t, d = (title, desc) if title else META[key]
    ld = list(ld)
    if path:
        top = path.split('/')[0]
        trail = [(SECTION_NAME.get(top, top.title()), top + '/')]
        if path.count('/') > 1:
            trail.append((t.rsplit(' | ', 1)[0].split(' — ')[0], path))
        ld.append(crumbs(trail))
    st = f'<div class="stage" data-stage="{stage}" aria-hidden="true"><canvas></canvas></div>\n' if stage else ''
    out = head(t, d, path, base, ld, preload) + f'''<body class="{cls}">
{st}{header(base, current if current is not None else key)}
<main id="main">
{body}
</main>
{footer(base, path)}
<dialog class="lb" aria-label="Image viewer"><button class="lb-x" type="button" data-lb-close>Close</button><img alt=""><div class="lb-nav"><button type="button" data-lb-prev>Previous</button><span data-lb-count></span><button type="button" data-lb-next>Next</button></div></dialog>
</body>
</html>
'''
    BUILT.append((path, out))
    out = clip_meta(out)
    dest = os.path.join(ROOT, path, 'index.html') if path else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8', newline='\n').write(out)


def poster_preload(name, base=''):
    return (f'<link rel="preload" as="image" href="{base}img/core/{name}-wide.webp" media="(min-aspect-ratio: 1/1)" fetchpriority="high">\n'
            f'<link rel="preload" as="image" href="{base}img/core/{name}-tall.webp" media="(max-aspect-ratio: 1/1)" fetchpriority="high">\n')


def closing_cta(base, head_html=None, sub=None, href=None):
    head_html = head_html or "Have an idea? Let's make it matter."
    sub = sub or CTA_SUB
    return f'''<section class="cta-band plate"><div class="cta-band-in"><h2 class="d2" data-rv>{head_html}</h2><div data-rv><p class="lead">{sub}</p>{btn('Start a project', href or base + 'start/', 'yellow')}</div></div></section>'''


# ── HOME ──────────────────────────────────────────────────────────────────
def home():
    base = ''
    work = ''
    for i, (slug, cls, sizes) in enumerate(HOME_WORK):
        p = BY[slug]
        work += f'''<article class="ex {cls}" data-ex>
  <a class="ex-media" href="work/{slug}/" aria-label="{esc(p['title'])}: {esc(p['plain'])}" data-px="14">{img(slug, key_img(slug), f"{p['title']}: {p['plain']}", base, sizes=sizes, want=1100, vt=True)}</a>
  <div class="ex-meta"><span class="ex-n">{i + 1:02d}</span><h3 class="ex-title"><a href="work/{slug}/">{esc(p['title'])}<i aria-hidden="true">{ARROW}</i></a></h3>
    <p>{esc(KIND[p['kind']])} · {p['year']}{' · <span class="tag-t">Concept</span>' if p['concept'] else ''}</p></div>
</article>'''
    rows = ''
    for i, d in enumerate(DISCIPLINES):
        ex = ', '.join(f'<a href="work/{s}/">{esc(BY[s]["title"])}</a>' for s in d['work'][:3])
        rows += f'''<li class="cap-row" data-rv data-cap>
  <span class="cap-n">{i + 1:02d}</span>
  <div class="cap-b"><h3 class="cap-t"><a href="capabilities/#{d['id']}">{esc(d['title'])}</a></h3>
    <p class="cap-list">{esc(d['list'])}</p>
    <p>{esc(d['does'])} {esc(d['who'])}</p>
    <p class="cap-ex"><span class="meta">See</span> {ex}</p></div></li>'''
    stairs = ''.join(f'''<li class="stair" style="--i:{i}" data-rv><span class="stair-n">{i + 1:02d}</span><h3>{t}</h3><p>{esc(d)}</p></li>''' for i, (t, d) in enumerate(PROCESS))
    body = f'''<section class="s-hero" data-scene>
  {still('hero', base, eager=True)}
  <div class="hero-grid">
    <p class="hero-eyebrow meta enter" style="--at:650ms">{BRAND}<br>A multidisciplinary creative studio</p>
    <h1 class="fit">{HERO_H1}</h1>
    <div class="hero-foot">
      <p class="hero-sub enter" style="--at:1100ms">{HERO_SUB}</p>
      <div class="hero-cta enter" style="--at:1160ms">{btn('Explore our work', '#selected-work', 'blue')}{btn('Start a project', 'start/', 'line')}</div>
    </div>
  </div>
  <a class="scroll-cue enter" style="--at:1300ms" href="#philosophy"><span>Scroll</span><i aria-hidden="true"></i></a>
</section>

<section class="s-phil" id="philosophy" data-scene>
  {still('recede', base)}
  <h2 class="phil-h" aria-label="Creativity has no fixed dimensions.">
    <span class="phil-ghost" aria-hidden="true" data-px="-26">Creativity</span>
    <span class="phil-l" aria-hidden="true" data-rv style="--x:0">Creativity</span>
    <span class="phil-l" aria-hidden="true" data-rv style="--x:2">has no</span>
    <span class="phil-l" aria-hidden="true" data-rv style="--x:5">fixed</span>
    <span class="phil-l" aria-hidden="true" data-rv style="--x:1">dimensions.</span>
  </h2>
  <div class="phil-copy" data-rv>{''.join(f'<p>{esc(x)}</p>' for x in PHILOSOPHY)}</div>
</section>

<section class="s-work plate" id="selected-work" data-plate>
  <header class="sec-head"><h2 class="d2" data-rv>Selected work.<br><span class="soft">Distinctive perspectives.</span></h2>
    <div class="sec-side" data-rv><p>Brand worlds, websites, campaigns, packaging and films from the studio. Concept projects are labelled as concepts.</p>{btn('See all work', 'work/', 'line')}</div></header>
  <div class="ex-wall">{work}</div>
</section>

<section class="s-cap" id="capabilities" data-scene>
  {still('capabilities', base)}
  <div class="cap-in"><h2 class="d2" data-rv>One studio.<br><span class="soft">Multiple creative dimensions.</span></h2>
  <ol class="cap-list-wrap">{rows}</ol>
  <div data-rv>{btn('All capabilities', 'capabilities/', 'line')}</div></div>
</section>

<section class="s-proc plate" id="process" data-plate>
  <h2 class="d2" data-rv>From first thought<br><span class="soft">to final experience.</span></h2>
  <div class="stairs-wrap" data-stairs><div class="stairs-line" aria-hidden="true"><i></i></div><ol class="stairs">{stairs}</ol></div>
</section>

<section class="s-studio plate" id="studio" data-plate>
  <svg class="studio-r" viewBox="56 36 72 98" aria-hidden="true"><path d="{R_PATH}"/></svg>
  <h2 class="d2" data-rv>Thoughtful by design.<br>Bold by nature.</h2>
  <div class="studio-cols">
    <div class="studio-story" data-rv>{''.join(f'<p>{esc(x)}</p>' for x in STUDIO_INTRO)}{btn('About the studio', 'studio/', 'dark')}</div>
    <dl class="studio-vm" data-rv><div><dt class="meta">Vision</dt><dd>{esc(VISION)}</dd></div><div><dt class="meta">Mission</dt><dd>{esc(MISSION)}</dd></div></dl>
  </div>
</section>

<section class="s-close" data-scene>
  {still('closing', base)}
  <div class="close-in"><h2 class="d1-close"><span class="ln" data-rv>Have an idea?</span> <span class="ln" data-rv>Let's make it matter.</span></h2>
    <p class="lead" data-rv>{CTA_SUB}</p>
    <div data-rv>{btn('Start a project', 'start/', 'yellow')}</div></div>
</section>'''
    page('', 'home', body, cls='home', stage='hero', preload=poster_preload('hero'), current='')


# ── WORK ──────────────────────────────────────────────────────────────────
def work_index():
    base = '../'
    btns = '<button type="button" class="flt" data-filter="all" aria-pressed="true">All <small>' + str(len(PROJECTS)) + '</small></button>'
    for k, label in KIND.items():
        n = sum(1 for p in PROJECTS if p['kind'] == k)
        btns += f'<button type="button" class="flt" data-filter="{k}" aria-pressed="false">{esc(label)} <small>{n}</small></button>'
    n = sum(1 for p in PROJECTS if p['concept'])
    btns += f'<button type="button" class="flt" data-filter="concept" aria-pressed="false">Concepts <small>{n}</small></button>'
    order = sorted(PROJECTS, key=lambda p: (WORK_ORDER.index(p['slug']) if p['slug'] in WORK_ORDER else 99))
    items = ''
    for i, p in enumerate(order):
        s = p['slug']
        items += f'''<article class="wk" data-kind="{p['kind']}"{' data-concept="1"' if p['concept'] else ''} data-ex>
  <a class="wk-media" href="{base}work/{s}/" tabindex="-1" aria-hidden="true">{img(s, key_img(s), f"{p['title']}: {p['plain']}", base, sizes='(min-width: 900px) 58vw, 100vw', want=1100, vt=True)}</a>
  <div class="wk-meta"><h2 class="ex-title"><a href="{base}work/{s}/">{esc(p['title'])}<i aria-hidden="true">{ARROW}</i></a></h2>
    <p class="wk-plain">{esc(p['plain'])}</p><p class="meta wk-cat">{esc(KIND[p['kind']])} · {p['year']}{' · <span class="tag-t">Concept</span>' if p['concept'] else ''}</p></div>
</article>'''
    body = f'''<section class="ph ph--work plate"><h1 class="d2 enter-lines"><span class="ln">Work</span></h1>
  <p class="lead enter" style="--at:300ms">Real project imagery from the studio, from one flyer to a complete brand. Concept projects are self-initiated work and are labelled as concepts.</p></section>
<section class="wk-wrap plate"><div class="flts" role="group" aria-label="Filter projects">{btns}</div>
  <p class="sr" role="status" data-filter-status></p>
  <div class="wk-wall" data-wall>{items}</div></section>
{closing_cta(base)}'''
    page('work/', 'work', body, cls='work', current='work')


def project(p, nxt):
    base = '../../'
    s = p['slug']
    n = len(p['srcs'])
    key = key_img(s)
    others = [i for i in range(n) if i != key and not (i == 0 and same_as_key(s, key))]
    facts = [('Category', esc(KIND[p['kind']])), ('Year', str(p['year'])), ('Services', esc(p['services']))]
    if p.get('industry'): facts.append(('Industry', esc(p['industry'])))
    facts.append(('Project type', esc(p.get('type') or ('Concept' if p['concept'] else 'Studio project'))))
    dl = ''.join(f'<div><dt class="meta">{k}</dt><dd>{v}</dd></div>' for k, v in facts)

    def figure(i, sizes, cls=''):
        m = MANIFEST[s][str(i)]
        return (f'<button class="gi {cls}" type="button" data-lb="{base}img/{s}/{i:02d}-{m["sizes"][-1]}.webp" aria-label="View {esc(p["title"])} image {i + 1}, larger">'
                f'{img(s, i, f"{p["title"]} image {i + 1}", base, sizes=sizes, want=1100)}</button>')

    # Split the real gallery into the three parts of the page. Short sets become one showcase.
    last = others[-1] if others else None
    rest = others[:-1] if others else []
    dev, apps = ([], rest) if len(others) < 6 or p['kind'] in ('social', 'motion') else (rest[:len(rest) // 2], rest[len(rest) // 2:])
    pattern = ['g-a', 'g-b', 'g-c', 'g-d', 'g-b', 'g-a', 'g-d', 'g-c']
    sz = {'g-a': '(min-width: 900px) 66vw, 100vw', 'g-b': '(min-width: 900px) 30vw, 100vw', 'g-c': '(min-width: 900px) 42vw, 100vw', 'g-d': '(min-width: 900px) 50vw, 100vw'}
    grid = lambda ids: ''.join(figure(i, sz[pattern[j % 8]], pattern[j % 8]) for j, i in enumerate(ids))
    show_story = s not in NO_STORY

    sections = ''
    sections += f'''<section class="pj-sec plate"><h2 class="meta pj-l">Overview</h2><div class="pj-r"><p class="pj-lead" data-rv>{esc(p['summary'] if show_story else p['made'])}</p><dl class="facts" data-rv>{dl}</dl></div></section>'''
    if show_story:
        sections += f'''<section class="pj-sec plate"><h2 class="meta pj-l">Challenge</h2><div class="pj-r"><p class="pj-text" data-rv>{esc(p['challenge'])}</p></div></section>
<section class="pj-sec plate"><h2 class="meta pj-l">Creative direction</h2><div class="pj-r"><p class="pj-text" data-rv>{esc(p['approach'])}</p></div></section>'''
    if dev:
        sections += f'<section class="pj-gal plate"><h2 class="meta pj-l">Development</h2><div class="g-grid">{grid(dev)}</div></section>'
    if apps:
        lead = f'<p class="pj-text pj-gl" data-rv>{esc(p["made"])}</p>' if show_story else ''
        sections += f'<section class="pj-gal plate"><h2 class="meta pj-l">{"Applications" if dev else "The work"}</h2>{lead}<div class="g-grid">{grid(apps)}</div></section>'
    if p['vids']:
        vids = ''
        for v in p['vids']:
            poster = f' poster="{base}{q(v["poster"])}"' if v['poster'] else ''
            cap = f'<figcaption class="meta">{esc(v["title"])}</figcaption>' if v['title'] else ''
            vids += f'<figure class="vid"><video controls preload="none" playsinline{poster}><source src="{base}{q(v["src"])}" type="video/mp4"></video>{cap}</figure>'
        sections += f'<section class="pj-gal plate"><h2 class="meta pj-l">Watch</h2><div class="vids">{vids}</div></section>'
    live = ''
    if p['live']:
        live = f'<div class="pj-live">{btn(esc(p["live_label"]), base + q(p["live"]), "blue")}</div>'
    if last is not None or live:
        final = figure(last, '100vw', 'g-full') if last is not None else ''
        sections += f'<section class="pj-final plate"><h2 class="meta pj-l">Final showcase</h2>{final}{live}</section>'
    credits_ = f'''<div><dt class="meta">Studio</dt><dd>{BRAND}</dd></div><div><dt class="meta">Work</dt><dd>{esc(p['services'])}</dd></div>'''
    if p['concept']:
        credits_ += '<div><dt class="meta">Note</dt><dd>Self-initiated concept project. Not client work.</dd></div>'
    sections += f'<section class="pj-sec plate"><h2 class="meta pj-l">Credits</h2><div class="pj-r"><dl class="facts">{credits_}</dl></div></section>'
    nk = key_img(nxt['slug'])
    body = f'''<section class="pj-open plate">
  <p class="meta pj-crumb enter" style="--at:100ms"><a href="../">Work</a> / {esc(KIND[p['kind']])} {badge(p)}</p>
  <h1 class="d-pj enter" style="--at:150ms">{esc(p['title'])}</h1>
  <p class="lead enter" style="--at:300ms">{esc(p['plain'])}.</p>
</section>
<div class="pj-hero">{img(s, key, p['title'], base, sizes='100vw', eager=True, want=1600, vt=True)}</div>
{sections}
<section class="pj-next plate"><a href="{base}work/{nxt['slug']}/" class="next-a"><span class="meta">Next project</span><span class="next-t">{esc(nxt['title'])}{ARROW}</span>
  <span class="next-img">{img(nxt['slug'], nk, '', base, sizes='(min-width: 900px) 40vw, 100vw', want=1100, vt=True)}</span></a></section>
{closing_cta(base, 'Have something like this in mind?', href=f"{base}start/?need={KIND_NEED[p['kind']]}")}'''
    url = f"{SITE['url']}/work/{s}/"
    cover = f"{SITE['url']}/img/{s}/{key:02d}-{MANIFEST[s][str(key)]['sizes'][-1]}.webp"
    ld = [{'@context': 'https://schema.org', '@type': 'CreativeWork', '@id': url + '#work', 'name': p['title'], 'url': url,
           'description': f"{p['plain']}. {p['summary']}", 'image': cover, 'dateCreated': str(p['year']), 'genre': KIND[p['kind']],
           'creator': {'@id': ORG_ID, 'name': BRAND}, 'inLanguage': 'en'}]
    for v in p['vids']:
        ld.append({'@context': 'https://schema.org', '@type': 'VideoObject', 'name': f"{p['title']}: {v['title']}" if v['title'] else p['title'],
                   'description': f"{p['plain']}. {p['summary']}", 'thumbnailUrl': f"{SITE['url']}/{q(v['poster'])}" if v['poster'] else cover,
                   'contentUrl': f"{SITE['url']}/{q(v['src'])}", 'embedUrl': url, 'uploadDate': f"{p['year']}-01-01",
                   'publisher': {'@id': ORG_ID, 'name': BRAND}})
    page(f'work/{s}/', 'work', body, title=f"{p['title']} — {KIND[p['kind']]} | {BRAND}", desc=f"{p['plain']}. {p['summary']}", cls='project', ld=ld, current='work')


def same_as_key(slug, key):
    """Many projects' covers are smaller copies of a gallery image. Do not show them twice."""
    return key != 0 and key == COVER_DUPLICATE.get(slug)


# ── CAPABILITIES ──────────────────────────────────────────────────────────
def capabilities():
    base = '../'
    blocks = ''
    for i, d in enumerate(DISCIPLINES):
        lands = ''.join(f'<li><a href="{base}services/{LANDING[k]["slug"]}/">{esc(LANDING[k]["title"])}{ARROW}</a></li>' for k in d['landing'])
        ex = ''
        for j, w in enumerate(d['work'][:3]):
            cls = 'c-big' if j == 0 else 'c-small'
            ex += f'<a class="c-ex {cls}" href="{base}work/{w}/">{img(w, key_img(w), f"{BY[w]["title"]}: {BY[w]["plain"]}", base, sizes="(min-width: 900px) 34vw, 100vw" if j == 0 else "(min-width: 900px) 16vw, 50vw", want=1100 if j == 0 else 560)}<span class="meta">{esc(BY[w]["title"])}{" · Concept" if BY[w]["concept"] else ""}</span></a>'
        blocks += f'''<section class="disc" id="{d['id']}"><header class="disc-h"><span class="cap-n">{i + 1:02d}</span><h2 class="d3" data-rv>{esc(d['title'])}</h2></header>
  <div class="disc-b"><div class="disc-t" data-rv><p class="pj-lead">{esc(d['does'])}</p>
    <h3 class="meta">What it covers</h3><p>{esc(d['list'])}</p>
    <h3 class="meta">Who it helps</h3><p>{esc(d['who'])}</p>
    {f'<h3 class="meta">Go deeper</h3><ul class="land">{lands}</ul>' if lands else ''}</div>
  <div class="disc-ex">{ex}</div></div></section>'''
    asks = ''.join(f'<li><a href="{base}services/{LANDING[s["id"]]["slug"]}/"><b>{esc(s["title"])}</b><span>{esc(s["line"])}</span></a></li>' for s in SERVICES)
    body = f'''<section class="ph ph--scene" data-scene>{still('capabilities', base, eager=True)}
  <div class="ph-in"><p class="meta enter" style="--at:100ms">Capabilities</p><h1 class="d2 enter-lines"><span class="ln">One studio.</span><br><span class="ln soft">Multiple creative dimensions.</span></h1>
  <p class="lead enter" style="--at:420ms">Five ways of working on one idea, for individuals, entrepreneurs, businesses and established organizations. Start with any of them.</p></div></section>
<div class="plate discs" data-plate>{blocks}</div>
<section class="plate make"><h2 class="d3" data-rv>Everything we make</h2><p class="lead" data-rv>The specific things people ask us for, big and small.</p><ul class="make-list" data-rv>{asks}</ul>
  <p class="make-note" data-rv>{esc(PRODUCTION_NOTE_SHORT)}</p></section>
{closing_cta(base)}'''
    page('capabilities/', 'capabilities', body, cls='capabilities', stage='capabilities', preload=poster_preload('capabilities', base))


def service_pages():
    base = '../../'
    for s in SERVICES:
        L = LANDING[s['id']]
        li = lambda xs: ''.join(f'<li>{esc(x)}</li>' for x in xs)
        cards = ''.join(f'<a class="c-ex" href="{base}work/{w}/">{img(w, key_img(w), BY[w]["title"], base, sizes="(min-width: 900px) 30vw, 100vw", want=560)}<span class="meta">{esc(BY[w]["title"])}{" · Concept" if BY[w]["concept"] else ""}</span></a>' for w in s['work'])
        work = f'<section class="plate lp-sec"><h2 class="d3" data-rv>Some of our work</h2><div class="lp-work" data-rv>{cards}</div></section>' if cards else ''
        others = ''.join(f'<li><a href="{base}services/{LANDING[o["id"]]["slug"]}/">{esc(o["title"])}</a></li>' for o in SERVICES if o['id'] != s['id'])
        faqs = ''.join(f'<details class="qa"><summary>{esc(a)}</summary><p>{esc(b)}</p></details>' for a, b in L['faq'])
        ld = [{'@context': 'https://schema.org', '@type': 'Service', 'name': L['title'], 'description': L['desc'], 'serviceType': L['title'],
               'url': f"{SITE['url']}/services/{L['slug']}/", 'provider': {'@id': ORG_ID, 'name': BRAND}, 'areaServed': [{'@type': 'Country', 'name': 'Canada'}, 'Worldwide']},
              {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': a, 'acceptedAnswer': {'@type': 'Answer', 'text': b}} for a, b in L['faq']]}]
        body = f'''<section class="ph plate"><p class="meta enter" style="--at:100ms"><a href="{base}capabilities/">Capabilities</a> / {esc(s['title'])}</p>
  <h1 class="d-lp enter" style="--at:150ms">{L['h1']}</h1>
  <p class="lead enter" style="--at:300ms">{esc(L['lead'])}</p>
  <div class="row-cta enter" style="--at:400ms">{btn('Start a project', f"{base}start/?need={s['need']}", 'blue')}{btn('See our work', base + 'work/', 'line')}</div></section>
<section class="plate lp-two"><div data-rv><h2 class="meta">Who it's for</h2><ul class="ticks">{li(L['who'])}</ul></div><div data-rv><h2 class="meta">What you get</h2><ul class="ticks">{li(L['get'])}</ul></div></section>
<section class="plate lp-sec"><h2 class="d3" data-rv>What people ask us for</h2><ul class="chips" data-rv>{li(s['asks'])}</ul>{f'<p class="make-note">{esc(PRODUCTION_NOTE_SHORT)}</p>' if s.get('production') else ''}</section>
{work}
<section class="plate lp-sec"><h2 class="d3" data-rv>Good to know</h2><div data-rv>{faqs}</div></section>
<section class="plate lp-sec"><h2 class="meta">Other things we make</h2><ul class="other" data-rv>{others}</ul></section>
{closing_cta(base, href=f"{base}start/?need={s['need']}")}'''
        page(f"services/{L['slug']}/", 'capabilities', body, title=f"{L['title']} | {BRAND}", desc=L['desc'], cls='service', ld=ld, current='capabilities')


# ── STUDIO ────────────────────────────────────────────────────────────────
def studio():
    base = '../'
    steps = ''.join(f'<li data-rv><span class="cap-n">{i + 1:02d}</span><div><h3 class="d4">{t}</h3><p>{esc(d)}</p></div></li>' for i, (t, d) in enumerate(PROCESS))
    why = ''.join(f'<li data-rv><h3 class="d4">{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in PRINCIPLES)
    disc = ''.join(f'<li><a href="{base}capabilities/#{d["id"]}">{esc(d["title"])}</a></li>' for d in DISCIPLINES)
    facts = ''.join(f'<div data-rv><dd class="d3">{a}</dd><dt class="meta">{b}</dt></div>' for a, b in STUDIO_FACTS)
    body = f'''<section class="ph ph--scene" data-scene>{still('studio', base, eager=True)}
  <div class="ph-in"><p class="meta enter" style="--at:100ms">Studio</p><h1 class="d2 enter-lines"><span class="ln">Thoughtful by design.</span><br><span class="ln soft">Bold by nature.</span></h1>
  <p class="lead enter" style="--at:420ms">{esc(STUDIO_INTRO[0])}</p></div></section>
<section class="plate st-intro" data-plate><div class="st-l"><h2 class="meta">Who we are</h2></div><div class="st-r"><p class="pj-lead" data-rv>{esc(STUDIO_INTRO[1])}</p><dl class="st-facts">{facts}</dl></div></section>
<section class="s-studio st-vm plate"><svg class="studio-r" viewBox="56 36 72 98" aria-hidden="true"><path d="{R_PATH}"/></svg>
  <dl class="studio-vm" data-rv><div><dt class="meta">Vision</dt><dd>{esc(VISION)}</dd></div><div><dt class="meta">Mission</dt><dd>{esc(MISSION)}</dd></div></dl></section>
<section class="plate st-sec"><h2 class="d3" data-rv>Creative philosophy</h2><div class="st-r">{''.join(f'<p class="pj-text" data-rv>{esc(x)}</p>' for x in PHILOSOPHY)}<ul class="why">{why}</ul></div></section>
<section class="plate st-sec"><h2 class="d3" data-rv>Multidisciplinary, on purpose</h2><div class="st-r"><p class="pj-text" data-rv>{esc(MULTI)}</p><ul class="other" data-rv>{disc}</ul></div></section>
<section class="plate st-sec"><h2 class="d3" data-rv>How a project moves</h2><ol class="st-steps">{steps}</ol></section>
{closing_cta(base)}'''
    page('studio/', 'studio', body, cls='studio', stage='studio', preload=poster_preload('studio', base))


# ── PRICING ───────────────────────────────────────────────────────────────
def pricing():
    base = '../'
    rows = ''
    for pk in sorted(PACKAGES, key=lambda x: (x.get('price') is None, x.get('price') or 0)):
        price = f'<span class="meta">From</span> <b>${pk["price"]:,}</b>' if pk.get('price') else '<b class="pr-ask">Tell us your budget</b>'
        rows += f'''<article class="pr{' pr--f' if pk.get('featured') else ''}" data-rv><h3 class="d4">{esc(pk['name'])}</h3><p class="pr-who">{esc(pk['who'])}</p>
  <ul class="ticks">{''.join(f'<li>{esc(x)}</li>' for x in pk['includes'])}</ul>
  <div class="pr-end"><p class="pr-price">{price}</p><a class="lnk" href="{base}start/?package={pk['id']}&amp;need={pk['need']}">Request a quote{ARROW}</a></div></article>'''
    ways = ''.join(f'<li data-rv><h3 class="d4">{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in ENGAGEMENT)
    est = ''.join(f'<li data-rv><span class="cap-n">{i + 1:02d}</span><p>{esc(x)}</p></li>' for i, x in enumerate(ESTIMATE))
    faqs = ''.join(f'<details class="qa"><summary>{esc(a)}</summary><p>{esc(b)}</p></details>' for a, b in FAQ)
    ld = [{'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': a, 'acceptedAnswer': {'@type': 'Answer', 'text': b}} for a, b in FAQ]}]
    body = f'''<section class="ph plate"><p class="meta enter" style="--at:100ms">Pricing</p><h1 class="d2 enter-lines"><span class="ln">Clear, no surprises.</span></h1>
  <p class="lead enter" style="--at:300ms">Every project gets a written quote before any work starts. Here's what each kind of project usually includes, so you know what to ask for.</p></section>
<section class="plate pr-wrap"><h2 class="sr">Packages</h2>{rows}
  <p class="make-note" data-rv>These are starting points, in US dollars, before taxes. Your written quote has the final price, the timeline and exactly what's included.</p></section>
<section class="plate st-sec"><h2 class="d3" data-rv>Ways to work with us</h2><ul class="why">{ways}</ul></section>
<section class="plate st-sec"><h2 class="d3" data-rv>How an estimate is worked out</h2><ol class="est">{est}</ol></section>
<section class="plate st-sec"><h2 class="d3" data-rv>Questions</h2><div data-rv>{faqs}</div></section>
{closing_cta(base, 'Ask for a quote.', 'A few words about your idea is plenty. We reply with a written quote before any work starts.')}'''
    page('pricing/', 'pricing', body, cls='pricing', ld=ld, current='pricing')


# ── START ─────────────────────────────────────────────────────────────────
def start():
    base = '../'
    need_opts = ''.join(f'<option value="{k}">{esc(t)}</option>' for k, t in NEEDS)
    pk_opts = ''.join(f'<option value="{pk["id"]}">{esc(pk["name"])}{" · from $" + format(pk["price"], ",") if pk.get("price") else ""}</option>'
                      for pk in sorted(PACKAGES, key=lambda x: (x.get('price') is None, x.get('price') or 0)))
    bud = ''.join(f'<option value="{esc(b)}">{esc(b)}</option>' for b in BUDGETS)
    tim = ''.join(f'<option value="{esc(b)}">{esc(b)}</option>' for b in TIMELINES)
    svc = ''.join(f'<label class="chk"><input type="checkbox" name="services" value="{esc(d["title"])}"><span><b>{esc(d["title"])}</b><small>{esc(d["list"])}</small></span></label>' for d in DISCIPLINES)
    steps = ['About you', 'Your project', 'Services', 'Scope', 'Review and submit']
    prog = ''.join(f'<li data-prog="{i}"><span>{i + 1:02d}</span><b>{s}</b></li>' for i, s in enumerate(steps))
    nav = lambda back=True, nxt='Next': f'<div class="st-nav">{"<button type=button class=&quot;btn btn--line&quot; data-back><span>Back</span></button>".replace("&quot;", chr(34)) if back else ""}<button type="button" class="btn btn--blue" data-next><span>{nxt}</span>{ARROW}</button></div>'
    def f(id_, label, ctrl, opt=False, hint=''):
        o = ' <em>(optional)</em>' if opt else ''
        h = f'<small class="hint" id="{id_}-h">{hint}</small>' if hint else ''
        return f'<div class="f"><label for="{id_}">{label}{o}</label>{ctrl}{h}<p class="f-err" id="{id_}-e" hidden></p></div>'
    body = f'''<section class="start plate">
  <aside class="start-side"><p class="meta enter" style="--at:100ms">Start a project</p>
    <h1 class="d2 enter-lines"><span class="ln">Have an idea?</span></h1>
    <p class="lead enter" style="--at:300ms">Tell us what you're working on. A few words is plenty, and you get a written quote before any work starts.</p>
    <p class="start-alt enter" style="--at:360ms">Prefer to write? <a href="mailto:{SITE['email']}">{SITE['email']}</a></p>
    <ol class="prog" aria-hidden="true" data-prog-list>{prog}</ol></aside>
  <div class="start-main">
  <form id="start-form" action="{SITE['formspree']}" method="POST" novalidate data-steps>
    <input type="hidden" name="_subject" value="New project enquiry from the {BRAND} website">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
    <p class="st-count meta" role="status" data-step-status></p>
    <fieldset class="step" data-step="0"><legend class="d3">About you</legend>
      {f('f-name', 'Name', '<input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-e">')}
      {f('f-email', 'Email', '<input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="f-email-e">')}
      <div class="f-row">{f('f-company', 'Company or organization', '<input id="f-company" name="company" type="text" autocomplete="organization">', True)}
      {f('f-location', 'Location', '<input id="f-location" name="location" type="text" autocomplete="country-name">', True)}</div>
      {nav(False)}</fieldset>
    <fieldset class="step" data-step="1"><legend class="d3">Your project</legend>
      {f('f-type', 'Project type', f'<select id="f-type" name="project_type" required aria-describedby="f-type-e"><option value="" selected disabled>Choose one</option>{need_opts}</select>')}
      {f('f-desc', 'Tell us about it', '<textarea id="f-desc" name="description" rows="5" required aria-describedby="f-desc-e" placeholder="For example: a logo and an opening flyer for my bakery, by next month."></textarea>')}
      {f('f-obj', 'What should it achieve?', '<textarea id="f-obj" name="objectives" rows="3"></textarea>', True)}
      {nav()}</fieldset>
    <fieldset class="step" data-step="2"><legend class="d3">Services</legend>
      <p class="st-help">Choose any that apply. Not sure? Skip this step and we'll work it out together.</p>
      <div class="chks">{svc}</div>
      {nav()}</fieldset>
    <fieldset class="step" data-step="3"><legend class="d3">Scope</legend>
      {f('f-package', 'Package', f'<select id="f-package" name="package"><option value="">No package, just a quote</option>{pk_opts}</select>', True, f'<a href="{base}pricing/">See what each package includes</a>')}
      <div class="f-row">{f('f-budget', 'Budget, in USD', f'<select id="f-budget" name="budget"><option value="">Choose a range</option>{bud}</select>', True)}
      {f('f-time', 'Timeline', f'<select id="f-time" name="timeline"><option value="">Choose one</option>{tim}</select>', True)}</div>
      {f('f-add', 'Anything else?', '<textarea id="f-add" name="additional" rows="3"></textarea>', True)}
      {nav(True, 'Review')}</fieldset>
    <fieldset class="step" data-step="4"><legend class="d3">Review and submit</legend>
      <div class="review" data-review></div>
      <p class="form-error" role="alert" hidden data-form-error></p>
      <div class="st-nav"><button type="button" class="btn btn--line" data-back><span>Back</span></button><button type="submit" class="btn btn--yellow" data-submit><span>Send it to us</span>{ARROW}</button></div></fieldset>
  </form>
  <div class="form-done" hidden tabindex="-1" data-form-done><h2 class="d2">Thank you.<br>We've got it.</h2><p class="lead">We'll read what you sent and get back to you with a written quote.</p>{btn('See some of our work', base + 'work/', 'line')}</div>
  </div>
</section>'''
    page('start/', 'start', body, cls='startp', current='start')


def contact():
    base = '../'
    body = f'''<section class="ph ph--scene ph--contact" data-scene>{still('contact', base, eager=True)}
  <div class="ph-in"><p class="meta enter" style="--at:100ms">Contact</p><h1 class="d2 enter-lines"><span class="ln">Let's talk.</span></h1>
  <p class="lead enter" style="--at:300ms">Write to us about anything. For a new project, the project form is the quickest way to a written quote.</p>
  <div class="row-cta enter" style="--at:400ms">{btn('Start a project', base + 'start/', 'yellow')}</div></div></section>
<section class="plate ct" data-plate>
  <div class="ct-info"><div data-rv><h2 class="meta">Email</h2><a class="ct-mail" href="mailto:{SITE['email']}">{SITE['email']}</a></div>
    <div data-rv><h2 class="meta">Where</h2><p>{esc(SITE['location'])}</p></div>
    <div data-rv><h2 class="meta">Languages</h2><p>English and French</p></div></div>
  <div class="ct-form"><form id="contact-form" action="{SITE['formspree']}" method="POST" novalidate data-simple>
    <h2 class="d3">Send a message</h2>
    <input type="hidden" name="_subject" value="New message from the {BRAND} website">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
    <div class="f"><label for="c-name">Name</label><input id="c-name" name="name" type="text" autocomplete="name" required aria-describedby="c-name-e"><p class="f-err" id="c-name-e" hidden></p></div>
    <div class="f"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required aria-describedby="c-email-e"><p class="f-err" id="c-email-e" hidden></p></div>
    <div class="f"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="5" required aria-describedby="c-msg-e"></textarea><p class="f-err" id="c-msg-e" hidden></p></div>
    <p class="form-error" role="alert" hidden data-form-error></p>
    <button type="submit" class="btn btn--blue" data-submit><span>Send message</span>{ARROW}</button></form>
    <div class="form-done" hidden tabindex="-1" data-form-done><h2 class="d3">Thank you. We've got it.</h2><p>We'll read what you sent and get back to you.</p></div></div>
</section>'''
    page('contact/', 'contact', body, cls='contactp', stage='contact', preload=poster_preload('contact', base))


# ── INSIGHTS ──────────────────────────────────────────────────────────────
def blog():
    base = '../'
    first, rest = POSTS[0], POSTS[1:]
    lead = f'''<a class="in-lead" href="{first['slug']}/" data-rv><span class="in-img">{img(first['cover'], key_img(first['cover']), '', base, sizes='(min-width: 900px) 58vw, 100vw', want=1100)}</span>
  <span class="in-t"><span class="meta">{esc(first['tag'])} · {first['read']} min read</span><span class="d3">{esc(first['title'])}</span><span>{esc(first['excerpt'])}</span></span></a>'''
    rows = ''.join(f'''<li data-rv><a href="{b['slug']}/"><span class="meta">{esc(b['tag'])}</span><span class="d4">{esc(b['title'])}</span><span class="in-ex">{esc(b['excerpt'])}</span>{ARROW}</a></li>''' for b in rest)
    body = f'''<section class="ph plate"><p class="meta enter" style="--at:100ms">Insights</p><h1 class="d2 enter-lines"><span class="ln">Studio notes.</span></h1>
  <p class="lead enter" style="--at:300ms">Plain advice from the studio: how to ask for the right thing, get it made well, and make it look right.</p></section>
<section class="plate in-wrap">{lead}<ul class="in-list">{rows}</ul></section>
{closing_cta(base, 'Have a question? Ask us.', "Tell us what you're working on. A few words is plenty.")}'''
    page('blog/', 'blog', body, cls='insights', current='blog')


def blocks(body):
    parts = []
    for kind, val in body:
        if kind == 'h':
            parts.append(f'<h2>{esc(val)}</h2>')
        elif kind == 'ul':
            parts.append('<ul>' + ''.join(f'<li>{esc(x)}</li>' for x in val) + '</ul>')
        else:
            parts.append(f'<p>{esc(val)}</p>')
    return ''.join(parts)


def blog_post(b):
    base = '../../'
    others = [x for x in POSTS if x['slug'] != b['slug']][:3]
    rel = ''.join(f'''<li><a href="../{x['slug']}/"><span class="meta">{esc(x['tag'])}</span><span class="d4">{esc(x['title'])}</span>{ARROW}</a></li>''' for x in others)
    body = f'''<article><section class="ph plate"><p class="meta enter" style="--at:100ms"><a href="../">Insights</a> / {esc(b['tag'])}</p>
  <h1 class="d-lp enter" style="--at:150ms">{esc(b['title'])}</h1>
  <p class="meta post-meta enter" style="--at:300ms">{esc(b['date'])} · {b['read']} min read · by {BRAND}</p></section>
<div class="post-cover plate">{img(b['cover'], key_img(b['cover']), '', base, sizes='(min-width: 1200px) 1100px, 100vw', want=1100, eager=True)}</div>
<div class="prose plate">{blocks(b['body'])}</div></article>
<section class="plate in-wrap"><h2 class="d3" data-rv>More from the studio</h2><ul class="in-list">{rel}</ul></section>
{closing_cta(base)}'''
    url = f"{SITE['url']}/blog/{b['slug']}/"
    art = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': b['title'], 'description': b['excerpt'], 'url': url, 'mainEntityOfPage': url,
           'image': f"{SITE['url']}/img/{b['cover']}/00-{MANIFEST[b['cover']]['0']['sizes'][-1]}.webp", 'datePublished': b['iso'], 'dateModified': b['iso'], 'inLanguage': 'en',
           'author': {'@id': ORG_ID, 'name': BRAND, 'url': SITE['url'] + '/'}, 'publisher': {'@id': ORG_ID, 'name': BRAND}}
    page(f'blog/{b["slug"]}/', 'blog', body, title=f"{b['title']} | {BRAND}", desc=b['excerpt'], cls='post', ld=[art], current='blog')


def legal():
    base = '../'
    for pg in LEGAL:
        body = f'''<section class="ph plate"><p class="meta enter" style="--at:100ms">Legal</p><h1 class="d-lp enter" style="--at:150ms">{esc(pg['title'])}</h1>
  <p class="lead enter" style="--at:300ms">{esc(pg['intro'])}</p><p class="meta post-meta">Last updated: {LEGAL_UPDATED}</p></section>
<div class="prose plate">{blocks(pg['body'])}</div>'''
        page(f"{pg['slug']}/", 'home', body, title=f"{pg['title']} | {BRAND}", desc=pg['intro'], cls='legal', current='none')


# ── 404, sitemap, redirects, headers, llms.txt ───────────────────────────
def extras():
    b404 = f'''<section class="s-404" data-scene><picture class="scene-still" aria-hidden="true"><img src="/img/core/recede-wide.webp" width="1680" height="1050" alt=""></picture>
  <div class="ph-in"><p class="meta">404</p><h1 class="d2">Beyond the frame,<br><span class="soft">and off the map.</span></h1><p class="lead">That page isn't here. The way back is.</p><div class="row-cta">{btn('Back to the start', '/', 'blue')}{btn('See our work', '/work/', 'line')}</div></div></section>'''
    h = head(f'Page not found | {BRAND}', "That page isn't here.", '404', '/', ()).replace('<meta name="description"', '<meta name="robots" content="noindex"><meta name="description"')
    h = re.sub(r'<link rel="(canonical|alternate)"[^>]*>\n', '', h)
    open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8', newline='\n').write(h + f'<body class="p404">{header("/", "none")}<main id="main">{b404}</main>{footer("/", "")}</body></html>')

    urls = [''] + ['capabilities/', 'studio/', 'contact/', 'work/', 'pricing/', 'blog/', 'start/', 'privacy/', 'cookies/', 'terms/'] \
        + [f'services/{v["slug"]}/' for v in LANDING.values()] + [f'work/{p["slug"]}/' for p in PROJECTS] + [f'blog/{b["slug"]}/' for b in POSTS]
    today = time.strftime('%Y-%m-%d')
    imgs = {f'work/{p["slug"]}/': [f'img/{p["slug"]}/{i:02d}-{MANIFEST[p["slug"]][str(i)]["sizes"][-1]}.webp' for i in range(min(len(p['srcs']), 10))] for p in PROJECTS}
    rows = []
    for u in urls:
        alts = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{SITE["url"]}/{pre}{u}"/>' for l, pre in (('en', ''), ('fr', 'fr/'), ('x-default', '')))
        for pre in ('', 'fr/'):
            im = ''.join(f'\n    <image:image><image:loc>{SITE["url"]}/{q(i)}</image:loc></image:image>' for i in imgs.get(u, []))
            rows.append(f'  <url>\n    <loc>{SITE["url"]}/{pre}{u}</loc>\n    <lastmod>{today}</lastmod>{alts}{im}\n  </url>\n')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + ''.join(rows) + '</urlset>\n')
    open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n').write(f'User-agent: *\nAllow: /\nDisallow: /tools/\n\nSitemap: {SITE["url"]}/sitemap.xml\n')
    # Old addresses keep working and keep their search ranking.
    open(os.path.join(ROOT, '_redirects'), 'w', encoding='utf-8', newline='\n').write(
        '/about/ /studio/ 301\n/about /studio/ 301\n/services/ /capabilities/ 301\n/services /capabilities/ 301\n'
        '/fr/about/ /fr/studio/ 301\n/fr/about /fr/studio/ 301\n/fr/services/ /fr/capabilities/ 301\n/fr/services /fr/capabilities/ 301\n')
    concept_dirs = ['afaa-pay', 'northstar-capital', 'vita-house', 'mason-rowe', 'flyer', 'motion-video', 'tools']
    open(os.path.join(ROOT, '_headers'), 'w', encoding='utf-8', newline='\n').write(
        '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n'
        '/img/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/css/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n\n'
        '/js/oa/c-*\n  Cache-Control: public, max-age=31536000, immutable\n\n/css/*\n  Cache-Control: public, max-age=604800\n\n/js/*\n  Cache-Control: public, max-age=604800\n\n'
        '/assets/*\n  Cache-Control: public, max-age=2592000\n\n/video/*\n  Cache-Control: public, max-age=2592000\n\n'
        + ''.join(f'/{d}/*\n  X-Robots-Tag: noindex, follow\n\n' for d in concept_dirs))
    open(os.path.join(ROOT, 'llms.txt'), 'w', encoding='utf-8', newline='\n').write(
        f"# {BRAND}\n\n> {META['home'][1]} Based in Canada, working worldwide, in English and French.\n\n"
        f"Contact: {SITE['email']} · Start a project: {SITE['url']}/start/\n\n## Capabilities\n\n"
        + ''.join(f"- {d['title']}: {d['list']}\n" for d in DISCIPLINES) + "\n## What we make\n\n"
        + ''.join(f"- [{v['title']}]({SITE['url']}/services/{v['slug']}/): {v['desc']}\n" for v in LANDING.values())
        + "\n## Work\n\n" + ''.join(f"- [{p['title']}]({SITE['url']}/work/{p['slug']}/) ({KIND[p['kind']]}{', concept' if p['concept'] else ''}): {p['plain']}.\n" for p in PROJECTS)
        + "\n## Insights\n\n" + ''.join(f"- [{b['title']}]({SITE['url']}/blog/{b['slug']}/): {b['excerpt']}\n" for b in POSTS)
        + f"\n## More\n\n- [Pricing]({SITE['url']}/pricing/)\n- [Studio]({SITE['url']}/studio/)\n- [Contact]({SITE['url']}/contact/)\n- [Français]({SITE['url']}/fr/)\n")


def cleanup():
    """Old generated folders this edition replaces. Handled by _redirects."""
    for d in ['about', 'fr/about']:
        shutil.rmtree(os.path.join(ROOT, d), ignore_errors=True)
    for f in ['services/index.html', 'fr/services/index.html']:
        try:
            os.remove(os.path.join(ROOT, f))
        except OSError:
            pass


if __name__ == '__main__':
    cleanup()
    home(); work_index(); capabilities(); service_pages(); studio(); pricing(); start(); contact(); blog(); legal()
    for b in POSTS:
        blog_post(b)
    for i, p in enumerate(PROJECTS):
        order = [x for x in sorted(PROJECTS, key=lambda v: (WORK_ORDER.index(v['slug']) if v['slug'] in WORK_ORDER else 99))]
        j = order.index(p)
        project(p, order[(j + 1) % len(order)])
    extras()
    import i18n
    n, miss = i18n.run(BUILT, SITE['url'], post=fr_post)
    print('built', len(BUILT), 'English pages +', n, 'French pages, version', VERSION, '| untranslated strings:', miss)
