# -*- coding: utf-8 -*-
"""Generate the ROVARD STUDIOS static site into the repo root.

    npm run build      (bundles src/ with esbuild, then runs this file)
    python tools/build.py

Pages: / , /services/ + 9 service pages , /work/ + 22 project pages , /about/ , /pricing/ , /blog/ + posts , /dimension/ ,
/start/ , /contact/ , legal , 404 , sitemap , robots , and a French copy of each under /fr/.
Env: NOLAZY=1 renders images eagerly (for review screenshots only).
"""
import html, json, os, re, sys, time, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import *  # noqa
from content_v3 import *  # noqa
from blogdata import with_more
from landing import LANDING
from legal import PAGES as LEGAL, UPDATED as LEGAL_UPDATED, ANALYTICS_NOTE

POSTS = with_more()
VERSION = time.strftime('%Y%m%d%H%M')
MANIFEST = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json')))
PROJECTS = load_projects()
BY = {p['slug']: p for p in PROJECTS}
PK = {p['id']: p for p in PACKAGES}
LOGO_WHITE = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20White.svg'
esc = html.escape

ARROW = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.500v15l13-7.500z"/></svg>'
UP = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>'
# The R from the logo file, unchanged.
R_PATH = 'M60.24 130V40.4H96.464C102.011 40.4 106.875 41.3813 111.056 43.344C115.323 45.2213 118.651 47.952 121.04 51.536C123.429 55.0347 124.624 59.2587 124.624 64.208V65.616C124.624 71.504 123.216 76.1547 120.4 79.568C117.584 82.9813 114.256 85.2853 110.416 86.48V88.272C113.488 88.3573 116.005 89.3813 117.968 91.344C120.016 93.2213 121.04 96.08 121.04 99.92V130H110.416V101.2C110.416 98.64 109.691 96.6773 108.24 95.312C106.875 93.9467 104.784 93.264 101.968 93.264H70.992V130H60.24ZM70.992 83.536H95.44C101.328 83.536 105.851 82.128 109.008 79.312C112.251 76.4107 113.872 72.4 113.872 67.28V66.384C113.872 61.264 112.293 57.296 109.136 54.48C105.979 51.5787 101.413 50.128 95.44 50.128H70.992V83.536Z'


def added_date(rel):
    """Date a file was first committed (for VideoObject.uploadDate)."""
    import subprocess
    try:
        out = subprocess.run(['git', 'log', '--diff-filter=A', '--format=%aI', '--', rel], cwd=ROOT, capture_output=True, text=True).stdout.split()
        if out:
            return out[-1]
    except OSError:
        pass
    return time.strftime('%Y-%m-%d')


def q(path):
    return urllib.parse.quote(path, safe='/')


# ── helpers ───────────────────────────────────────────────────────────────
def img(slug, idx, alt, base, sizes='100vw', cls='', eager=False, want=None, extra=''):
    m = MANIFEST[slug][str(idx)]
    ws = m['sizes']
    srcset = ', '.join(f'{base}img/{slug}/{idx:02d}-{w}.webp {w}w' for w in ws)
    mid = next((w for w in ws if w >= (want or 1100)), ws[-1])
    wmax = ws[-1]
    h = round(m['h'] * wmax / m['w'])
    load = 'fetchpriority="high"' if eager else ('decoding="async"' if os.environ.get('NOLAZY') else 'loading="lazy" decoding="async"')
    c = f' class="{cls}"' if cls else ''
    return (f'<img{c} src="{base}img/{slug}/{idx:02d}-{mid}.webp" srcset="{srcset}" sizes="{sizes}" '
            f'width="{wmax}" height="{h}" alt="{esc(alt)}" {load}{extra}>')


def ref_img(ref, alt, base, **kw):
    return img(ref[0], find_img(PROJECTS, ref[0], ref[1]), alt, base, **kw)


def btn(label, href, cls=''):
    return f'<a class="btn {cls}" href="{href}"><span>{label}</span><i class="btn-a">{ARROW}</i></a>'


def tag(p):
    s = status_of(p['slug'])
    return f'<span class="st st-{s}">{esc(STATUS_LABEL[s])}</span>' if s != 'brand' else ''


def eyebrow(text, n=None):
    num = f'<i class="tick">{n}</i>' if n else '<i class="tick"></i>'
    return f'<p class="eyebrow">{num}<span>{text}</span></p>'


def clip(t, n=158):
    t = ' '.join(t.split())
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0].rstrip(',;:·—-') + '…'


ORG_ID = SITE['url'] + '/#organization'


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


_DESC_RE = re.compile(r'(<meta (?:name="description"|property="og:description") content=")([^"]*)(">)')


def clip_meta(h):
    """Trim meta/og descriptions to search-result length (run after translation)."""
    return _DESC_RE.sub(lambda m: m.group(1) + esc(clip(html.unescape(m.group(2)))) + m.group(3), h)


def crumbs(items):
    """items: [(name, path)] after Home. Path is relative to the site root."""
    full = [('Home', '')] + items
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': f"{SITE['url']}/{u}"} for i, (n, u) in enumerate(full)]}


def head(title, desc, path, base, extra_ld=(), intro=False):
    url = f"{SITE['url']}/{path}"
    ld = json.dumps(site_ld(), ensure_ascii=False)
    ld += ''.join(f'</script>\n<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}' for x in extra_ld)
    analytics = f'<script defer data-domain="{SITE["plausible"]}" src="https://plausible.io/js/script.js"></script>' + chr(10) if SITE.get('plausible') else ''
    # Runs before first paint: decides motion, the opening sequence (first visit only) and the page-wipe landing.
    boot = ("(function(d){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('mo');"
            "if(sessionStorage.getItem('rv-pt')){sessionStorage.removeItem('rv-pt');d.classList.add('pt-in')}"
            + (("if(!localStorage.getItem('rv-seen')){d.classList.add('is-intro');localStorage.setItem('rv-seen','1')}") if intro else '')
            + "}catch(e){}})(document.documentElement)")
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#101116">
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
<meta property="og:image" content="{SITE['url']}/assets/og-cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{BRAND}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="{base}assets/favicon/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="{base}assets/favicon/icon-192.png">
<link rel="apple-touch-icon" href="{base}assets/favicon/icon-180.png">
{analytics}<link rel="preload" href="{base}css/fonts/Syne.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{base}css/fonts/SpaceGrotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}css/rovard.css?v={VERSION}">
<script>{boot}</script>
<script type="application/ld+json">{ld}</script>
</head>'''


MAIN_NAV = [('services', 'Services'), ('work', 'Work'), ('about', 'About'), ('contact', 'Contact')]
MENU = MAIN_NAV + [('pricing', 'Pricing'), ('blog', 'Insights'), ('dimension', 'Creative Dimension')]


def header(base, path):
    top = path.split('/')[0] if path else ''
    cur = lambda k: ' aria-current="page"' if k == top else ''
    links = ''.join(f'<a class="nav-a"{cur(k)} href="{base}{k}/">{t}</a>' for k, t in MAIN_NAV)
    items = ''.join(f'<a class="m-link"{cur(k)} href="{base}{k}/"><small>{i + 1:02d}</small><b><span>{t}</span></b></a>' for i, (k, t) in enumerate(MENU))
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="hdr" data-header>
  <a class="logo" href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_WHITE}" alt="{BRAND}" width="124" height="47"></a>
  <nav class="nav" aria-label="Main">{links}</nav>
  <a class="btn btn-sm hdr-cta" href="{base}start/"><span>Start a project</span><i class="btn-a">{ARROW}</i></a>
  <button class="menu-btn" type="button" data-menu-btn aria-expanded="false" aria-controls="menu" aria-label="Open menu"><i></i><i></i></button>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <nav aria-label="Menu">{items}</nav>
  <div class="menu-foot"><a href="mailto:{SITE['email']}">{SITE['email']}</a><span>{SITE['location']}</span>{btn('Start a project', base + 'start/', 'btn-y')}</div>
</div>'''


def footer(base, path=''):
    caps = ''.join(f'<a href="{base}services/#{c["id"]}">{esc(c["title"])}</a>' for c in CAPABILITIES)
    return f'''<footer class="ftr">
  <div class="wrap ftr-top">
    <p class="ftr-say">Make ideas matter.</p>
    <button class="to-top" type="button" data-to-top><span>Back to top</span><i class="btn-a">{UP}</i></button>
  </div>
  <div class="wrap ftr-grid">
    <div class="ftr-brand"><a href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_WHITE}" alt="{BRAND}" width="168" height="64" loading="lazy"></a>
      <p><a class="ftr-mail" href="mailto:{SITE['email']}">{SITE['email']}</a></p><p class="mono dim">{SITE['location']}</p></div>
    <nav class="ftr-col" aria-label="Studio"><h2>Studio</h2><a href="{base}work/">Work</a><a href="{base}services/">Services</a><a href="{base}about/">About</a><a href="{base}pricing/">Pricing</a><a href="{base}blog/">Insights</a><a href="{base}dimension/">Creative Dimension</a><a href="{base}contact/">Contact</a><a href="{base}start/">Start a project</a></nav>
    <nav class="ftr-col" aria-label="Services"><h2>Services</h2>{caps}</nav>
  </div>
  <div class="wrap ftr-base"><span>© {SITE['year']} {BRAND}. All rights reserved.</span>
    <span class="lang" data-lang aria-label="Language"><a href="{base}{path}" aria-current="true">EN</a><a href="{base}fr/{path}" hreflang="fr" lang="fr">FR</a></span>
    <button class="motion-btn" type="button" data-motion-toggle aria-pressed="false"><i></i><span>Pause motion</span></button>
    <nav class="ftr-legal" aria-label="Legal"><a href="{base}privacy/">Privacy Policy</a><a href="{base}cookies/">Cookie Preferences</a><a href="{base}terms/">Terms</a></nav></div>
</footer>
{wa_fab()}
<div class="veil" data-veil aria-hidden="true"></div>
<div class="cursor-tag" data-cursor aria-hidden="true"></div>'''


WA_ICON = '<svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M5 4h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H15l-7 5v-5H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/></svg>'
WA_MSG = "Hi ROVARD STUDIOS, I'd like to talk about a project."


def wa_href():
    return f"https://wa.me/{SITE['whatsapp']}?text={urllib.parse.quote(WA_MSG)}" if SITE.get('whatsapp') else ''


def wa_fab():
    h = wa_href()
    return f'<a class="wa-fab" href="{h}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">{WA_ICON}</a>' if h else ''


# Opening sequence: the logo's own artwork, unskewed, drawn in pieces.
INTRO = f'''<div class="intro" data-intro aria-hidden="true"><div class="intro-mark">
  <span class="i-block"></span>
  <svg class="i-r" viewBox="0 0 181 171" width="181" height="171"><path d="{R_PATH}" fill="#EBEBEB"/></svg>
  <span class="i-tick"></span>
  <p class="i-word"><b><span class="i-w">ROVARD</span></b><b><span class="i-w">STUDIOS</span></b></p>
</div></div>
'''

BUILT = []
_MEDIA_RE = re.compile(r'''(?<=["'(, ])(?:\.\./)*((?:img|video)/(?!mp4)|assets/Motion%20Design/)''')


def media_urls(html_text):
    """Point every image and video at the media host (Cloudflare R2) when SITE['media'] is set."""
    m = (SITE.get('media') or '').rstrip('/')
    return _MEDIA_RE.sub(lambda x: m + '/' + x.group(1), html_text) if m else html_text


SECTION_NAME = {'services': 'Services', 'work': 'Work', 'blog': 'Insights', 'pricing': 'Pricing', 'about': 'About', 'start': 'Start a project', 'contact': 'Contact',
                'dimension': 'Creative Dimension', 'privacy': 'Privacy', 'cookies': 'Cookies', 'terms': 'Terms'}


def page(path, key, body, title=None, desc=None, body_class='', ld=()):
    depth = 0 if not path else path.count('/')
    base = '../' * depth
    t, d = (title, desc) if title else META[key]
    ld = list(ld)
    if path:
        top = path.split('/')[0]
        trail = [(SECTION_NAME.get(top, top.title()), top + '/')]
        if path.count('/') > 1:
            trail.append((t.rsplit(' | ', 1)[0].split(' — ')[0], path))
        ld.append(crumbs(trail))
    is_home = 'home' in body_class.split()
    out = head(t, d or META[key][1], path, base, ld, intro=is_home) + f'''
<body class="{body_class}">
{INTRO if is_home else ''}{header(base, path)}
<main id="main">
{body}
</main>
{footer(base, path)}
<script type="module" src="{base}js/dist/main.js?v={VERSION}"></script>
</body>
</html>
'''
    out = media_urls(out)
    BUILT.append((path, out))
    out = clip_meta(out)
    dest = os.path.join(ROOT, path, 'index.html') if path else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)


def poster(name, base, alt='', cls='core-still', w=900, h=900, lazy=True):
    load = 'loading="lazy" decoding="async"' if lazy else 'fetchpriority="low"'
    return f'<img class="{cls}" src="{base}img/core/{name}.webp" width="{w}" height="{h}" alt="{esc(alt)}" {load}>'


def closing(base, headline="Have an idea? Let's make it impossible to ignore.", sub="Whether you're starting from a blank page or ready to take an existing idea further, we'd love to explore what we can create together.", label="Let's start something", href=None):
    return f'''<section class="close env-yellow"><div class="wrap close-in">
  <h2 class="d-xl" data-split="lines">{headline}</h2>
  <p class="close-sub" data-reveal>{sub}</p>
  <div class="row" data-reveal>{btn(label, href or base + 'start/', 'btn-ink btn-lg')}</div>
</div></section>'''


def page_head(eyebrow_text, h1, lead='', extra='', cls=''):
    lead_html = f'<p class="lead" data-reveal>{lead}</p>' if lead else ''
    return f'''<section class="ph env-ink {cls}"><div class="wrap ph-in">
  {eyebrow(eyebrow_text)}
  <h1 class="d-xl" data-split="lines">{h1}</h1>
  {lead_html}{extra}
</div></section>'''


# ── HOME ──────────────────────────────────────────────────────────────────
def home():
    base = ''
    lines = ''.join(f'<span class="hl hl-{i}" data-split="chars">{esc(t)}</span> ' for i, t in enumerate(HERO_LINES))
    hero = f'''<section class="hero" data-sec="hero" data-core-zone aria-labelledby="hero-title">
  {poster('hero', base, cls='core-still hero-still', lazy=False)}
  <div class="hero-in">
    <h1 class="hero-h" id="hero-title">{lines}</h1>
    <div class="hero-foot">
      <p class="hero-sub" data-hero-after>From the first spark of an idea to the final detail, we create visual experiences that make people look twice.</p>
      <div class="row" data-hero-after>{btn('Start a project', 'start/', 'btn-y btn-lg')}{btn('Explore our work', '#work', 'btn-line btn-lg')}</div>
      <p class="hero-meta mono" data-hero-after>{BRAND}<br>{SITE['location']}</p>
    </div>
  </div>
</section>'''

    statement = f'''<section class="stmt" data-sec="statement" data-core-zone><div class="wrap stmt-in">
  <div class="stmt-txt">{eyebrow('Why we do this')}
    <h2 class="d-xl" data-read>Good ideas deserve more than ordinary execution.</h2>
    <p class="lead" data-reveal>We believe creative work should do more than look good. It should communicate clearly, create recognition, build connections and make ideas matter.</p>
  </div>
</div></section>'''

    items = ''
    for n, s in enumerate(SELECTED):
        p = BY[s['slug']]
        idx = find_img(PROJECTS, s['slug'], s['img'])
        sizes = '100vw' if s['layout'] == 'full' else '(min-width: 900px) 60vw, 94vw'
        heading = f'<h3 class="sel-t"><a href="work/{p["slug"]}/">{esc(p["title"])}</a></h3>'
        items += f'''<article class="sel sel-{s['layout']}" data-shared>
  <a class="frame" href="work/{p['slug']}/" data-wipe data-cursor-label="" tabindex="-1" aria-hidden="true">{img(p['slug'], idx, '', base, sizes=sizes, want=1600 if s['layout'] == 'full' else 1100)}</a>
  <div class="sel-meta"><span class="mono idx">{n + 1:02d}</span>{heading}
    <p class="sel-d">{esc(p['plain'])}.</p>
    <p class="mono meta"><span>{esc(KIND[p['kind']])}</span><span>{esc(str(p['year']))}</span>{tag(p)}</p></div>
</article>'''
    film_idx = find_img(PROJECTS, FILM['slug'], FILM['poster'])
    film = f'''<section class="film" data-film data-shared aria-label="The {BRAND} film"><div class="film-frame" data-film-frame>
  {img(FILM['slug'], film_idx, '', base, sizes='100vw', want=1600, cls='film-poster')}
  <video preload="none" playsinline poster="{base}img/{FILM['slug']}/{film_idx:02d}-1100.webp"><source src="{base}{FILM['src']}" type="video/mp4"></video>
  <button class="play" type="button" data-play aria-label="Play the {BRAND} film">{PLAY}</button>
  <p class="film-cap mono"><span>The film · 1:30</span><span>{BRAND} in 90 seconds</span></p>
</div></section>'''
    work = f'''<section class="work env-paper" id="work"><div class="wrap">
  <div class="sec-head">{eyebrow('Selected work')}<h2 class="d-l" data-split="lines">Look at the work.</h2>
    <p class="sec-note" data-reveal>Brands, websites, campaigns and packaging, for real businesses and as independent concepts. Concepts are always labelled.</p></div>
  <div class="sel-grid">{items}</div>
  <div class="row sel-all" data-reveal>{btn('View all projects', 'work/', 'btn-blue btn-lg')}</div>
</div>{film}</section>'''

    rows = ''
    frames = ''
    for i, c in enumerate(CAPABILITIES):
        rows += f'''<a class="cap" href="services/#{c['id']}" data-cap><span class="mono idx">{i + 1:02d}</span><span class="cap-b"><span class="cap-t">{esc(c['title'])}</span>
    <span class="cap-d">{esc(c['does'])}</span></span><i class="btn-a">{ARROW}</i></a>'''
        frames += f'<figure class="cap-frame" data-cap-frame>{ref_img(c["img"], "", base, sizes="(min-width: 1000px) 38vw, 1px", want=1100)}</figure>'
    caps = f'''<section class="caps env-blue" id="services"><div class="wrap caps-in">
  <div class="caps-l">{eyebrow('Capabilities')}<h2 class="d-l" data-split="lines">What we make, and why it matters.</h2>
    <div class="cap-list" data-reveal>{rows}</div>
    <div class="row" data-reveal>{btn('All services', 'services/', 'btn-y')}{btn('See pricing', 'pricing/', 'btn-line')}</div></div>
  <div class="caps-r" aria-hidden="true"><div class="cap-pane">{frames}</div></div>
</div></section>'''

    stages = ''
    dots = ''
    for i, s in enumerate(PROCESS):
        stages += f'''<article class="stage" data-stage-item><div class="stage-txt"><p class="mono stage-n">{i + 1:02d} / {len(PROCESS):02d}</p><h3 class="stage-w">{esc(s['word'])}</h3><p class="stage-c">{esc(s['copy'])}</p></div>
    <div class="stage-img">{poster(s['key'], base)}</div></article>'''
        dots += f'<li data-stage-dot class="{"on" if i == 0 else ""}"><span>{esc(s["word"])}</span></li>'
    process = f'''<section class="proc" data-sec="process" data-core-zone id="process"><div class="proc-frame" data-process-frame><div class="wrap proc-in">
  <div class="proc-head">{eyebrow('From idea to reality')}<ol class="stage-dots" aria-hidden="true">{dots}</ol></div>
  <div class="stages">{stages}</div>
</div></div></section>'''

    why = ''.join(f'<li data-reveal><span class="mono idx">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(WHY_V3))
    why_sec = f'''<section class="why env-paper"><div class="wrap why-in">
  <div class="why-h">{eyebrow('Why ROVARD')}<h2 class="d-l" data-split="lines">Easy to talk to. Serious about the work.</h2>
    <p class="why-facts mono" data-reveal><span><b>7+</b> years of experience</span><span><b>200+</b> projects completed</span></p></div>
  <ol class="why-list">{why}</ol>
</div></section>'''

    tiles = ''
    for lay, s in zip(('a', 'b', 'c'), (LAB[0], LAB[3], LAB[4])):
        tiles += f'''<a class="arc arc-{lay}" href="dimension/#{s['id']}" data-cursor-label="" data-wipe><img src="img/lab/{s['id']}.webp" width="1000" height="429" alt="" loading="lazy" decoding="async">
    <span class="arc-cap"><span class="mono">Study {s['n']}</span><b>{esc(s['title'])}</b></span></a>'''
    archive = f'''<section class="arch env-ink-solid"><div class="wrap">
  <div class="sec-head">{eyebrow('Creative Dimension')}<h2 class="d-l" data-split="lines">Some of it had no client. It just had to be tried.</h2>
    <p class="sec-note" data-reveal>Shader studies, type experiments and strange objects. This is where the next idea usually comes from.</p></div>
  <div class="arc-grid">{tiles}</div>
  <div class="row" data-reveal>{btn('Enter the Creative Dimension', 'dimension/', 'btn-line btn-lg')}</div>
</div></section>'''

    cta = f'''<section class="close close-home" data-stage="yellow" data-core-zone>
  {poster('cta', base, cls='core-still close-still')}
  <div class="wrap close-in">
  <h2 class="d-xl" data-split="lines">Have an idea? Let's make it impossible to ignore.</h2>
  <p class="close-sub" data-reveal>Whether you're starting from a blank page or ready to take an existing idea further, we'd love to explore what we can create together.</p>
  <div class="row" data-reveal>{btn("Let's start something", 'start/', 'btn-ink btn-lg')}</div>
</div></section>'''

    stage = '<canvas class="core-canvas" data-core-canvas aria-hidden="true"></canvas>'
    page('', 'home', stage + hero + statement + work + caps + process + why_sec + archive + cta, body_class='home')


# ── SERVICES ──────────────────────────────────────────────────────────────
def services():
    base = '../'
    jump = ''.join(f'<a class="chip" href="#{c["id"]}">{esc(c["title"])}</a>' for c in CAPABILITIES)
    head_html = page_head('Services', 'Small requests. Big ideas. Same care.', 'From one flyer to a full launch. Here is what we make, what each thing is for, and how to start.',
                          f'<div class="chips" data-reveal>{jump}</div>')
    caps = ''
    for i, c in enumerate(CAPABILITIES):
        asks = ''.join(f'<li>{esc(a)}</li>' for a in c['asks'])
        links = ''.join(f'<a class="chip chip-d" href="{LANDING[k]["slug"]}/">{esc(LANDING[k]["title"])}</a>' for k in c['pages'])
        pic = ref_img(c['img'], '', base, sizes='(min-width: 900px) 42vw, 94vw', want=1100)
        caps += f'''<section class="svc svc-{'a' if i % 2 else 'b'}" id="{c['id']}"><div class="wrap svc-in">
  <div class="svc-num mono">{i + 1:02d}</div>
  <div class="svc-main"><h2 class="d-m" data-split="lines">{esc(c['title'])}</h2>
    <p class="svc-does" data-reveal>{esc(c['does'])}</p><p class="svc-why" data-reveal>{esc(c['why'])}</p>
    <div class="row" data-reveal>{btn('Start this', f"{base}start/?need={c['need']}", 'btn-blue')}</div></div>
  <div class="svc-side"><figure class="frame" data-wipe>{pic}</figure>
    <h3 class="mono svc-l">What this can include</h3><ul class="asks" data-reveal>{asks}</ul>
    <h3 class="mono svc-l">In detail</h3><div class="chips" data-reveal>{links}</div></div>
</div></section>'''
    index = ''
    for s in SERVICES:
        items = ''.join(f'<li>{esc(a)}</li>' for a in s['asks'])
        prod = f'<p class="note">{esc(PRODUCTION_NOTE)}</p>' if s['production'] else ''
        index += f'''<article class="idx-col" id="{s['id']}" data-reveal><h3><a href="{LANDING[s['id']]['slug']}/">{esc(s['title'])}</a></h3><p>{esc(s['line'])}</p><ul>{items}</ul>{prod}</article>'''
    full = f'''<section class="svc-index env-ink-solid"><div class="wrap"><div class="sec-head">{eyebrow('Everything you can ask for')}<h2 class="d-l" data-split="lines">Looking for one specific thing?</h2></div>
  <div class="idx-grid">{index}</div>
  <div class="unsure" data-reveal><div><h3 class="d-s">Not sure what you need?</h3><p>That is where the best conversations start. Tell us your idea in your own words and we will figure out the rest together.</p></div>{btn('I have an idea', base + 'start/?need=unsure', 'btn-y btn-lg')}</div>
</div></section>'''
    page('services/', 'services', head_html + f'<div class="env-paper">{caps}</div>' + full + closing(base, "Don't see it? Ask anyway.", "Other creative requests are welcome. Tell us what you have in mind.", 'Tell us what you need'), body_class='services')


def proj_tile(slug, base, sizes="(min-width: 900px) 30vw, 94vw", want=560):
    p = BY[slug]
    return f'''<article class="tile" data-shared><a class="frame" href="{base}work/{slug}/" aria-label="{esc(p['title'])}" data-cursor-label="">{img(slug, 0, '', base, sizes=sizes, want=want)}</a>
  <h3><a href="{base}work/{slug}/">{esc(p['title'])}</a></h3><p class="mono meta"><span>{esc(KIND[p['kind']])}</span>{tag(p)}</p></article>'''


def steps_list(items=None):
    src = items or ENGAGEMENT
    return ''.join(f'<li data-reveal><span class="mono idx">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(src))


def service_pages():
    base = '../../'
    for s in SERVICES:
        L = LANDING[s['id']]
        asks = ''.join(f'<li>{esc(a)}</li>' for a in s['asks'])
        who = ''.join(f'<li>{esc(x)}</li>' for x in L['who'])
        get = ''.join(f'<li>{esc(x)}</li>' for x in L['get'])
        cards = ''.join(proj_tile(w, base) for w in s['work'])
        work = f'<section class="sp-work"><div class="wrap"><h2 class="d-s" data-split="lines">Some of our work</h2><div class="tile-row">{cards}</div></div></section>' if cards else ''
        others = ''.join(f'<a class="chip chip-d" href="{base}services/{LANDING[o["id"]]["slug"]}/">{esc(o["title"])}</a>' for o in SERVICES if o['id'] != s['id'])
        ld = json.dumps({'@context': 'https://schema.org', '@type': 'Service', 'name': L['title'], 'description': L['desc'],
                         'serviceType': L['title'], 'url': f"{SITE['url']}/services/{L['slug']}/",
                         'provider': {'@id': ORG_ID, 'name': BRAND}, 'areaServed': [{'@type': 'Country', 'name': 'Canada'}, 'Worldwide']}, ensure_ascii=False)
        prod = f'<p class="note" data-reveal>{esc(PRODUCTION_NOTE)}</p>' if s['production'] else ''
        h1 = L['h1'].replace('<span class="grad">', '<em>').replace('</span>', '</em>')
        crumb = f'<a href="{base}services/">Services</a> / {esc(s["title"])}'
        body = page_head(crumb, h1, esc(L['lead']), f'<div class="row" data-reveal>{btn("Start a project", f"{base}start/?need={s["need"]}", "btn-y btn-lg")}{btn("See our work", base + "work/", "btn-line btn-lg")}</div>') + f'''
<div class="env-paper"><section class="sp-two"><div class="wrap sp-grid">
  <div data-reveal><h2 class="d-s">Who it's for</h2><ul class="ticks">{who}</ul></div>
  <div data-reveal><h2 class="d-s">What you get</h2><ul class="ticks">{get}</ul></div>
  <div data-reveal><h2 class="d-s">What people ask us for</h2><ul class="asks">{asks}</ul>{prod}</div>
</div></section>
{work}
{faq_section(L['faq'], base, heading='Good to know', eyebrow_text='Questions')}
<section class="sp-other"><div class="wrap"><h2 class="mono svc-l">Other things we design</h2><div class="chips">{others}</div></div></section></div>
<script type="application/ld+json">{ld}</script>
{closing(base, "Let's talk about your project.", "A few words is enough to start.", 'Start a project', f"{base}start/?need={s['need']}")}'''
        page(f"services/{L['slug']}/", 'services', body, title=f"{L['title']} | {BRAND}", desc=L['desc'], body_class='services svc-page')


# ── WORK INDEX ────────────────────────────────────────────────────────────
def work_index():
    base = '../'
    kinds = [('all', 'All', 'kind')] + [(k, label, 'kind') for k, label in KIND.items() if any(p['kind'] == k for p in PROJECTS)] + [('concept', 'Concepts', 'status')]
    chips = ''.join(f'<button class="chip{" on" if v == "all" else ""}" data-filter="{v}" data-axis="{ax}" type="button" aria-pressed="{"true" if v == "all" else "false"}">{esc(t)}</button>' for v, t, ax in kinds)
    chips += f'<a class="chip chip-link" href="{base}dimension/">Experiments</a>'

    wall = ''
    for slug, x, y, w, z in UNIVERSE:
        p = BY[slug]
        wall += f'''<a class="u-item" data-u data-z="{z}" href="{base}work/{slug}/" data-cursor-label="" style="--x:{x}px;--y:{y}px;--w:{w}px" data-shared>{img(slug, 0, '', base, sizes=f'{w}px', want=w)}
    <span class="u-cap"><b>{esc(p['title'])}</b><span class="mono">{esc(KIND[p['kind']])}{' · ' + esc(STATUS_LABEL['concept']) if status_of(slug) == 'concept' else ''}</span></span></a>'''
    universe = f'''<section class="uni" aria-label="Brand Universe: a selection of projects"><div class="universe" data-universe><div class="u-world" data-world>{wall}</div>
  <p class="u-hint mono" aria-hidden="true"><span class="u-drag">Drag to explore</span></p></div></section>'''

    cards = ''
    for i, p in enumerate(PROJECTS):
        s = status_of(p['slug'])
        size = 'w7' if i % 5 == 0 else ('w5' if i % 5 == 1 else 'w4')
        cards += f'''<article class="wk {size}" data-kind="{p['kind']}" data-status="{s}" data-shared>
  <a class="frame" href="{base}work/{p['slug']}/" aria-label="{esc(p['title'])}" data-cursor-label="">{img(p['slug'], 0, '', base, sizes='(min-width: 900px) 50vw, 94vw', want=1100)}</a>
  <div class="wk-meta"><h2><a href="{base}work/{p['slug']}/">{esc(p['title'])}</a></h2><p>{esc(p['plain'])}.</p><p class="mono meta"><span>{esc(KIND[p['kind']])}</span><span>{esc(str(p['year']))}</span>{tag(p)}</p></div></article>'''

    logos = ''.join(f'<li><img src="{base}img/logos/{f}-c.png" alt="{esc(n)}" height="34" loading="lazy" decoding="async"></li>' for f, n, _ in BRAND_LOGOS)
    body = page_head('Work', 'A curated exhibition of what we make.', 'Explore the wall, or use the index below it. Independent concepts are labelled, so you always know what you are looking at.', cls='ph-short') + universe + f'''
<div class="env-paper"><section class="wk-index" id="index"><div class="wrap">
  <div class="wk-bar"><h2 class="d-s">Project index <span class="mono" data-result-count>{len(PROJECTS)}</span></h2><div class="chips" role="group" aria-label="Filter projects">{chips}</div></div>
  <div class="wk-grid">{cards}</div>
</div></section>
<section class="logos-sec"><div class="wrap">{eyebrow('Identities we have designed, for clients and as concepts')}<ul class="logo-row">{logos}</ul></div></section></div>
{closing(base, "Have something like this in mind?", "Tell us what you are working on. A few words is enough.")}'''
    page('work/', 'work', body, body_class='work-page')


# ── PROJECT PAGES ─────────────────────────────────────────────────────────
KIND_NEED = {'brand': 'branding', 'web': 'website', 'social': 'graphic', 'print': 'graphic', 'motion': 'motion'}


def related(p, n=3):
    same = [x for x in PROJECTS if x['kind'] == p['kind'] and x['slug'] != p['slug']]
    i = next(k for k, x in enumerate(PROJECTS) if x['slug'] == p['slug'])
    pick = same[:n]
    for x in PROJECTS[i + 1:] + PROJECTS[:i]:
        if len(pick) >= n:
            break
        if x not in pick:
            pick.append(x)
    return pick[:n]


def gallery(p, base):
    """An editorial rhythm from each image's real proportions, so no two project pages stack the same way."""
    slug = p['slug']
    out, i, n, beat = '', 1, len(p['srcs']), 0
    def cell(k, cls, sizes):
        m = MANIFEST[slug][str(k)]
        alt = f"{p['title']} image {k}"
        return (f'<button class="g-i {cls}" type="button" data-full="{base}img/{slug}/{k:02d}-{m["sizes"][-1]}.webp" data-alt="{esc(alt)}" data-cursor-label="" aria-label="Open {esc(alt)}">'
                f'<span class="frame" data-wipe>{img(slug, k, alt, base, sizes=sizes, want=1100)}</span></button>')
    while i < n:
        m = MANIFEST[slug][str(i)]
        wide = m['w'] / m['h'] >= 1.45
        if wide and beat % 3 == 0:
            out += cell(i, 'g-full', '(min-width: 900px) 90vw, 94vw'); i += 1
        elif i + 1 < n:
            cls = ('g-7', 'g-5') if beat % 2 == 0 else ('g-4', 'g-8')
            out += cell(i, cls[0], '(min-width: 900px) 55vw, 94vw') + cell(i + 1, cls[1], '(min-width: 900px) 55vw, 94vw'); i += 2
        else:
            out += cell(i, 'g-off', '(min-width: 900px) 60vw, 94vw'); i += 1
        beat += 1
    return out


def project(p):
    base = '../../'
    slug = p['slug']
    st = status_of(slug)
    i = next(k for k, x in enumerate(PROJECTS) if x['slug'] == slug)
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    facts = []
    if p.get('client'): facts.append(('Client', p['client']))
    if p.get('industry'): facts.append(('Industry', p['industry']))
    if st == 'concept' and not p.get('type'): facts.append(('Project type', 'Independent creative exploration'))
    if p.get('type'): facts.append(('Project type', p['type']))
    facts += [('What we did', p['services']), ('Year', p['year'])]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{esc(str(v))}</dd></div>' for k, v in facts)
    concept_note = '<p class="concept-note" data-reveal><b>Independent concept.</b> A self-initiated project by the studio, not a client commission.</p>' if st == 'concept' else ''
    cols = p.get('colours') or []
    swatches = ''.join(f'<li style="--c:{esc(c)}"><span class="mono">{esc(c)}</span></li>' for c in cols)
    visual = f'<div class="pj-vis" data-reveal><h2 class="mono svc-l">Visual direction</h2><ul class="swatches">{swatches}</ul></div>' if cols else ''
    story = ''
    if slug in STORIES:
        s = STORIES[slug]
        big, (a, b) = s['big'], s['small']
        story = f'''<section class="pj-story"><div class="wrap"><h2 class="d-s" data-split="lines">From idea to the real world</h2><p class="pj-line" data-reveal>{esc(s['line'])}</p>
  <div class="story-grid"><figure class="st-1"><span class="frame" data-wipe>{ref_img(big, big[2], base, sizes='(min-width: 900px) 60vw, 94vw')}</span><figcaption class="mono">01 {esc(big[2])}</figcaption></figure>
  <figure class="st-2"><span class="frame" data-wipe>{ref_img(a, a[2], base, sizes='(min-width: 900px) 34vw, 94vw', want=560)}</span><figcaption class="mono">02 {esc(a[2])}</figcaption></figure>
  <figure class="st-3"><span class="frame" data-wipe>{ref_img(b, b[2], base, sizes='(min-width: 900px) 34vw, 94vw', want=560)}</span><figcaption class="mono">03 {esc(b[2])}</figcaption></figure></div></div></section>'''
    vids = ''
    if p['vids']:
        items = ''
        for v in p['vids']:
            pst = f' poster="{base}{q(v["poster"])}"' if v['poster'] else ''
            cap = f'<figcaption class="mono">{esc(v["title"])}</figcaption>' if v['title'] else ''
            items += f'<figure class="vid"><video controls preload="none" playsinline{pst}><source src="{base}{q(v["src"])}" type="video/mp4"></video>{cap}</figure>'
        vids = f'<section class="pj-vids"><div class="wrap"><h2 class="d-s" data-split="lines">Watch</h2><div class="vid-grid">{items}</div></div></section>'
    live = f'<div class="row" data-reveal>{btn(esc(p["live_label"]), base + q(p["live"]), "btn-blue btn-lg")}</div>' if p['live'] else ''
    items = gallery(p, base)
    gal = f'<section class="pj-gal"><div class="wrap"><h2 class="d-s" data-split="lines">Applications</h2><div class="g-grid">{items}</div></div></section>' if items else ''
    rel = ''.join(proj_tile(x['slug'], base) for x in related(p))
    brief = 'The brief' if st == 'concept' else 'The challenge'
    body = f'''<section class="pj-head env-ink"><div class="wrap">
  <a class="back mono" href="{base}work/">All work</a>
  <p class="mono meta pj-tags"><span>{esc(KIND[p['kind']])}</span><span>{esc(str(p['year']))}</span>{tag(p)}</p>
  <h1 class="d-xl" data-split="lines">{esc(p['title'])}</h1>
  <p class="lead" data-reveal>{esc(p['summary'])}</p>{concept_note}
</div></section>
<section class="pj-hero env-ink-solid"><div class="wrap"><div class="pj-hero-img">{img(slug, 0, p['title'], base, sizes='(min-width: 1280px) 1200px, 94vw', eager=True, want=1600, cls='hero-img')}</div></div></section>
<div class="env-paper">
<section class="pj-text"><div class="wrap pj-grid">
  <dl class="facts" data-reveal>{dl}</dl>
  <div class="pj-copy">
    <div data-reveal><h2 class="mono svc-l">{brief}</h2><p class="pj-big">{esc(p['challenge'])}</p></div>
    <div data-reveal><h2 class="mono svc-l">The creative thinking</h2><p>{esc(p['approach'])}</p></div>
    {visual}
    <div data-reveal><h2 class="mono svc-l">What was made</h2><p>{esc(p['made'])}</p></div>{live}
  </div>
</div></section>
{story}{vids}{gal}
<section class="pj-rel"><div class="wrap"><h2 class="d-s" data-split="lines">Related projects</h2><div class="tile-row">{rel}</div></div></section>
</div>
<a class="pj-next" href="{base}work/{nxt['slug']}/" data-shared data-cursor-label=""><span class="pj-next-img">{img(nxt['slug'], 0, '', base, sizes='100vw', want=1100)}</span><span class="pj-next-txt"><span class="mono">Next project</span><b>{esc(nxt['title'])}</b></span></a>
<div class="lightbox" hidden role="dialog" aria-modal="true" aria-label="Image viewer"><button class="lb-close" type="button" aria-label="Close">×</button>
  <button class="lb-prev" type="button" aria-label="Previous image">←</button><img alt=""><button class="lb-next" type="button" aria-label="Next image">→</button><span class="lb-count mono"></span></div>'''
    url = f"{SITE['url']}/work/{slug}/"
    cover = f"{SITE['url']}/img/{slug}/00-{MANIFEST[slug]['0']['sizes'][-1]}.webp"
    ld = [{'@context': 'https://schema.org', '@type': 'CreativeWork', '@id': url + '#work', 'name': p['title'], 'url': url,
           'description': f"{p['plain']}. {p['summary']}", 'image': cover, 'dateCreated': str(p['year']), 'genre': KIND[p['kind']],
           'creator': {'@id': ORG_ID, 'name': BRAND}, 'inLanguage': 'en'}]
    for v in p['vids']:
        ld.append({'@context': 'https://schema.org', '@type': 'VideoObject',
                   'name': f"{p['title']}: {v['title']}" if v['title'] else p['title'], 'description': f"{p['plain']}. {p['summary']}",
                   'thumbnailUrl': f"{SITE['url']}/{q(v['poster'])}" if v['poster'] else cover,
                   'contentUrl': f"{SITE['url']}/{q(v['src'])}", 'embedUrl': url, 'uploadDate': added_date(v['src']),
                   'publisher': {'@id': ORG_ID, 'name': BRAND}})
    page(f'work/{slug}/', 'work', body, title=f"{p['title']} — {KIND[p['kind']]} | {BRAND}", desc=f"{p['plain']}. {p['summary']}",
         body_class='project', ld=ld)


# ── ABOUT ─────────────────────────────────────────────────────────────────
def about():
    base = '../'
    why = ''.join(f'<li data-reveal><span class="mono idx">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(WHY_V3))
    steps = ''.join(f'<li data-reveal><span class="mono idx">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    body = page_head(f'About {BRAND}', 'We are ROVARD STUDIOS. We make ideas matter.',
                     'A creative studio exploring the space between ideas, design and digital experiences. We help turn concepts into work that communicates, connects and stands out.') + f'''
<div class="env-paper">
<section class="ab-intro"><div class="wrap ab-grid">
  <h2 class="mono svc-l">Who we are</h2>
  <div class="ab-copy" data-reveal><p class="pj-big">We work with individuals, small businesses, churches, organisations and companies. Some projects are big and some are one flyer. Same care, same questions: who is this for, and what should it do?</p>
    <p>We are based in Canada and work with people around the world, in English and French. Branding, graphic design, websites, motion, campaigns and creative direction all sit under one roof, so an idea can move between them without getting lost.</p></div>
  <p class="why-facts mono" data-reveal><span><b>7+</b> years of experience</span><span><b>200+</b> projects completed</span></p>
</div></section>
<section class="ab-how"><div class="wrap"><div class="sec-head">{eyebrow('How we approach a project')}<h2 class="d-l" data-split="lines">No mystery. Five plain steps.</h2></div><ol class="step-list">{steps}</ol></div></section>
<section class="ab-diff"><div class="wrap why-in"><div class="why-h">{eyebrow('What makes us different')}<h2 class="d-l" data-split="lines">Easy to talk to. Serious about the work.</h2></div><ol class="why-list">{why}</ol></div></section>
</div>
<section class="vm env-blue"><div class="wrap vm-in">
  <div data-reveal>{eyebrow('Vision')}<p class="d-m">A world where anyone with a good idea can put it out there looking as good as it deserves.</p></div>
  <div data-reveal>{eyebrow('Mission')}<p class="vm-m">To turn ideas into meaningful visual experiences through thoughtful design, visual storytelling and careful execution, and to give every request, big or small, the same care.</p></div>
  <div data-reveal>{eyebrow('Philosophy')}<p class="vm-m">Creative work should do more than look good. It should communicate clearly, create recognition and make an idea matter to the person it is for.</p></div>
  <div data-reveal>{eyebrow('Working together')}<p class="vm-m">You bring what you know about your world. We bring what we know about making things people notice. Honest feedback goes both ways, and you always know what happens next.</p></div>
</div></section>
{closing(base, "Let's work together.", "Tell us what you are working on. A few words is enough to start.", "Let's start something")}'''
    page('about/', 'about', body, body_class='about')


# ── BLOG ──────────────────────────────────────────────────────────────────
def bcard(b, base, cls=''):
    return f'''<article class="post {cls}" data-shared><a class="frame" href="{base}blog/{b['slug']}/" aria-label="{esc(b['title'])}" data-cursor-label="">{img(b['cover'], 0, '', base, sizes='(min-width: 900px) 40vw, 94vw', want=1100)}</a>
  <p class="mono meta"><span>{esc(b['date'])}</span><span>{esc(b['tag'])}</span></p><h2><a href="{base}blog/{b['slug']}/">{esc(b['title'])}</a></h2></article>'''


def blog():
    base = '../'
    first, rest = POSTS[0], POSTS[1:]
    cards = bcard(first, base, 'post-lead') + ''.join(bcard(b, base) for b in rest)
    body = page_head('Insights', 'Plain advice from the studio.', 'How to ask for the right thing, get it made well, and make it look right.') + f'''
<div class="env-paper"><section class="blog-sec"><div class="wrap blog-grid">{cards}</div></section></div>
{closing(base, "Have a question? Ask us.", "Tell us what you are working on. A few words is plenty.")}'''
    page('blog/', 'blog', body, body_class='blog')


def prose(blocks):
    parts = []
    for kind, val in blocks:
        if kind == 'h':
            parts.append(f'<h2>{esc(val)}</h2>')
        elif kind == 'ul':
            parts.append('<ul>' + ''.join(f'<li>{esc(x)}</li>' for x in val) + '</ul>')
        else:
            parts.append(f'<p>{esc(val)}</p>')
    return parts


def blog_post(b):
    base = '../../'
    others = [x for x in POSTS if x['slug'] != b['slug']][:3]
    rel = ''.join(bcard(x, base) for x in others)
    body = f'''<article><section class="ph env-ink post-head"><div class="wrap ph-in">
  {eyebrow(f'<a href="{base}blog/">Insights</a> / {esc(b["tag"])}')}
  <h1 class="d-l" data-split="lines">{esc(b['title'])}</h1>
  <p class="mono post-meta">{esc(b['date'])} · {b['read']} min read · by {BRAND}</p></div></section>
<div class="env-paper"><div class="wrap post-cover"><div class="frame">{img(b['cover'], 0, '', base, sizes='(min-width: 1200px) 1100px, 94vw', want=1100, eager=True)}</div></div>
<div class="wrap prose">{''.join(prose(b['body']))}</div></div></article>
<div class="env-paper"><section class="pj-rel"><div class="wrap"><h2 class="d-s">More insights</h2><div class="blog-grid blog-rel">{rel}</div></div></section></div>
{closing(base, "Let's make yours impossible to ignore.", "A few words is enough to start.")}'''
    url = f"{SITE['url']}/blog/{b['slug']}/"
    art = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': b['title'], 'description': b['excerpt'], 'url': url,
           'mainEntityOfPage': url, 'image': f"{SITE['url']}/img/{b['cover']}/00-{MANIFEST[b['cover']]['0']['sizes'][-1]}.webp",
           'datePublished': b['iso'], 'dateModified': b['iso'], 'inLanguage': 'en',
           'author': {'@id': ORG_ID, 'name': BRAND, 'url': SITE['url'] + '/'}, 'publisher': {'@id': ORG_ID, 'name': BRAND}}
    page(f'blog/{b["slug"]}/', 'blog', body, title=f"{b['title']} | {BRAND}", desc=b['excerpt'], body_class='blog', ld=[art])


# ── LEGAL ─────────────────────────────────────────────────────────────────
def legal():
    for pg in LEGAL:
        base = '../'
        parts = []
        for block in pg['body']:
            kind, val = block
            parts += prose([block])
            if SITE.get('plausible') and pg['slug'] in ('privacy', 'cookies') and kind == 'p' and val.startswith(('We do not run advertising', 'Our hosting provider')):
                parts.append(f'<p>{esc(ANALYTICS_NOTE)}</p>')
        body = page_head('Legal', esc(pg['title']), esc(pg['intro']), f'<p class="mono post-meta">Last updated: {LEGAL_UPDATED}</p>', cls='ph-short') + f'''
<div class="env-paper"><div class="wrap prose prose-legal">{''.join(parts)}</div></div>
{closing(base, "Questions? Just ask.", "We are happy to explain anything on this page.", 'Contact us', base + 'contact/')}'''
        page(f"{pg['slug']}/", 'home', body, title=f"{pg['title']} | {BRAND}", desc=pg['intro'], body_class='legal')


# ── FAQ + PRICING ─────────────────────────────────────────────────────────
def faq_section(items, base, heading='Questions you are probably asking', eyebrow_text='FAQ'):
    qa = ''.join(f'<details class="qa"><summary><span>{esc(q_)}</span><i aria-hidden="true"></i></summary><p>{esc(a)}</p></details>' for q_, a in items)
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q_, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q_, a in items]}, ensure_ascii=False)
    return f"""<section class="faq" id="faq"><div class="wrap faq-grid">
  <div>{eyebrow(eyebrow_text)}<h2 class="d-m" data-split="lines">{heading}</h2><p class="faq-sub" data-reveal>Not here? <a href="{base}contact/">Ask us.</a></p></div>
  <div class="qa-list" data-reveal>{qa}</div></div>
<script type="application/ld+json">{ld}</script></section>"""


def pricing():
    base = '../'
    groups = ''
    for i, g in enumerate(PRICE_GROUPS):
        rows = ''
        for pid in g['ids']:
            pk = PK[pid]
            price = f'From <b>${pk["price"]:,}</b>' if pk.get('price') else '<b>Quote</b>'
            lis = ''.join(f'<li>{esc(x)}</li>' for x in pk['includes'])
            rows += f'''<article class="pk" data-reveal><div class="pk-a"><h3>{esc(pk['name'])}</h3><p>{esc(pk['who'])}</p></div><ul class="pk-b">{lis}</ul>
  <div class="pk-c"><p class="pk-price">{price}</p><a class="link" href="{base}start/?package={pk['id']}">Choose this package</a></div></article>'''
        if not g['ids']:
            rows = f'<article class="pk pk-open" data-reveal><div class="pk-a"><h3>Films and motion</h3><p>{esc(g["note"])}</p></div><div class="pk-c"><p class="pk-price"><b>Quote</b></p><a class="link" href="{base}start/?need={g["need"]}">Ask about this</a></div></article>'
            note = ''
        else:
            note = f'<p>{esc(g["note"])}</p>' if g.get('note') else ''
        groups += f'<section class="pg"><div class="pg-h"><span class="mono idx">{i + 1:02d}</span><h2 class="d-s">{esc(g["title"])}</h2>{note}</div>{rows}</section>'
    body = page_head('Pricing', 'Clear, with no surprises.', "Every project gets a written quote before any work starts. Requirements, complexity and deliverables set the final price. Here is what each kind of project usually includes, so you know what to ask for.") + f"""
<div class="env-paper">
<section class="prices"><div class="wrap">{groups}
  <p class="note pk-note" data-reveal>These are starting points, in US dollars, before taxes. Not sure which fits? Choose a budget range on the form and we'll tell you honestly what it can cover.</p></div></section>
<section class="engage"><div class="wrap"><div class="sec-head">{eyebrow('How it works')}<h2 class="d-l" data-split="lines">From first message to final file.</h2></div><ol class="step-list step-4">{steps_list()}</ol></div></section>
{faq_section(FAQ, base)}
</div>
{closing(base, "Ready when you are.", "Tell us what you are working on, and we will send a written quote.")}"""
    page('pricing/', 'pricing', body, body_class='pricing')


# ── CREATIVE DIMENSION ────────────────────────────────────────────────────
def dimension():
    base = '../'
    studies = ''
    for s in LAB:
        extra = ''
        stage_inner = ''
        if s['id'] == 'specimen':
            btns = ''.join(f'<button class="chip{" on" if i == 0 else ""}" type="button" data-pose="{k}" aria-pressed="{"true" if i == 0 else "false"}">{t}</button>' for i, (k, t) in enumerate([('fluid', 'Fluid'), ('strata', 'Strata'), ('block', 'Block'), ('seed', 'Seed')]))
            extra = f'<div class="chips lab-ctl" role="group" aria-label="Change the object\'s state">{btns}<button class="chip" type="button" data-wire aria-pressed="false">Wireframe</button></div>'
        if s['id'] == 'weight':
            stage_inner = '<p class="w-word" data-weight-word>Matter</p>'
            extra = '<label class="lab-range"><span class="mono">Weight <output data-weight-out>600</output></span><input type="range" min="400" max="800" value="600" data-weight-slider></label>'
        attr = ' data-word="IDEAS"' if s['id'] == 'particles' else ''
        studies += f'''<article class="study study-{s['id']}" id="{s['id']}" data-study="{s['id']}"{attr}>
  <div class="study-stage" data-study-stage>{'' if stage_inner else f'<img class="study-poster" src="{base}img/lab/{s["id"]}.webp" width="1000" height="429" alt="" loading="lazy" decoding="async">'}{stage_inner}</div>
  <div class="wrap study-cap"><span class="mono idx">Study {s['n']}</span><h2 class="d-m">{esc(s['title'])}</h2><p class="mono dim">{esc(s['medium'])} · 2026</p><p class="study-note">{esc(s['note'])} <span class="study-cta">{esc(s['cta'])}.</span></p>{extra}</div>
</article>'''
    body = page_head('Creative Dimension', 'Things we tried because we wanted to know.', "This is our experimental archive. Nothing here was commissioned, and none of it is client work. It is how we find out what is possible next.", cls='ph-short') + f'''
<div class="lab" data-lab>{studies}
<article class="study study-reel" id="reel"><div class="wrap study-cap"><span class="mono idx">Motion tests</span><h2 class="d-m">Studio reel</h2><p class="study-note">A short cut assembled from the studio's films and identity work.</p></div>
  <div class="wrap"><div class="frame"><video src="{base}video/showreel.mp4" poster="{base}video/showreel-poster.webp" muted loop playsinline preload="none" data-loop aria-label="A short reel of ROVARD STUDIOS work"></video></div></div></article>
</div>
{closing(base, "Got something strange in mind?", "We like those. Tell us what you are thinking.", "Let's start something")}'''
    page('dimension/', 'dimension', body, body_class='dimension')


# ── START + CONTACT ───────────────────────────────────────────────────────
def start():
    base = '../'
    def bucket(price):
        for b, top in zip(BUDGETS, [250, 1000, 3000, 5000, 10000, float('inf')]):
            if price is not None and price < top:
                return b
        return BUDGETS[-1]
    PK_NEED = {'brand': 'branding', 'design': 'graphic', 'website': 'website', 'ads': 'campaign', 'unsure': 'else'}
    pk_opts = ''
    for pk in sorted(PACKAGES, key=lambda x: (x.get('price') is None, x.get('price') or 0)):
        label = esc(pk['name']) + (f" · from ${pk['price']:,}" if pk.get('price') else '')
        pk_opts += f'<option value="{esc(pk["name"])}" data-pk="{pk["id"]}" data-need="{PK_NEED.get(pk["need"], "else")}" data-budget="{esc(bucket(pk.get("price")))}">{label}</option>'
    needs = ''.join(f'<label class="opt"><input type="checkbox" name="need" value="{esc(t)}" data-v="{k}"><span>{esc(t)}</span></label>' for k, t in NEEDS_V3)
    needs = re.sub(r'value="[^"]*" data-v="([^"]+)"', r'value="\1"', needs)
    stages = ''.join(f'<label class="opt opt-r"><input type="radio" name="stage" value="{esc(s)}"><span>{esc(s)}</span></label>' for s in STAGES_V3)
    budget_opts = ''.join(f'<option value="{esc(b)}">{esc(b)}</option>' for b in BUDGETS)
    timing_opts = ''.join(f'<option value="{esc(b)}">{esc(b)}</option>' for b in TIMING_V3)
    prog = ''.join(f'<li><i></i><span>{esc(t)}</span></li>' for t in STEP_TITLES)
    alt = f'<a href="mailto:{SITE["email"]}">{SITE["email"]}</a>'
    if wa_href():
        alt += f' · <a href="{wa_href()}" target="_blank" rel="noopener">WhatsApp</a>'
    T = STEP_TITLES
    body = page_head('Start a project', "Let's create something meaningful.", "Tell us a little about your idea, your goals and what you would like to create. We'll use that to understand your needs and explore the best way forward.", cls='ph-short') + f"""
<section class="start env-paper"><div class="wrap start-in">
  <aside class="start-side">
    <ol class="progress" data-progress data-form-head aria-label="Form steps">{prog}</ol>
    <a class="side-link" href="{base}pricing/"><span class="mono">Know what you want?</span><b>Compare our packages</b></a>
    <p class="side-alt">Prefer to write? {alt}</p>
  </aside>
  <div class="start-main">
    <div class="start-top" data-form-head><p class="mono" data-count aria-live="polite">Five short steps</p><span class="bar"><i data-progress-bar></i></span></div>
    <form id="start-form" class="form" action="{SITE['formspree']}" method="POST">
      <input type="hidden" name="_subject" value="New project enquiry from the {BRAND} website">
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
      <fieldset class="step" data-step><legend class="d-s" data-step-title>{T[0]}</legend><p class="hint">Choose as many as you like.</p>
        <div class="opts">{needs}</div><p class="f-err" role="alert"></p></fieldset>
      <div class="step" data-step><h2 class="d-s" data-step-title>{T[1]}</h2>
        <div class="f"><label for="f-idea">Explain the idea in your own words</label><textarea id="f-idea" name="idea" rows="6" required placeholder="For example: a logo and an opening flyer for my bakery, by next month."></textarea><p class="f-err" role="alert"></p></div></div>
      <fieldset class="step" data-step><legend class="d-s" data-step-title>{T[2]}</legend><p class="hint">Optional.</p><div class="opts opts-1">{stages}</div></fieldset>
      <div class="step" data-step><h2 class="d-s" data-step-title>{T[3]}</h2><p class="hint">All optional. It just helps us suggest what fits.</p>
        <div class="f"><label for="f-package">Package</label><select id="f-package" name="package"><option value="">No package, just a quote</option>{pk_opts}</select><a class="link-sm" href="{base}pricing/">See what each package includes</a></div>
        <div class="f-row"><div class="f"><label for="f-budget">Budget (USD)</label><select id="f-budget" name="budget"><option value="">Choose a range</option>{budget_opts}</select></div>
        <div class="f"><label for="f-timing">Timing</label><select id="f-timing" name="timing"><option value="">Choose one</option>{timing_opts}</select></div></div></div>
      <div class="step" data-step><h2 class="d-s" data-step-title>{T[4]}</h2>
        <div class="f-row"><div class="f"><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" required><p class="f-err" role="alert"></p></div>
        <div class="f"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required><p class="f-err" role="alert"></p></div></div>
        <div class="f-row"><div class="f"><label for="f-org">Organisation <em>(optional)</em></label><input id="f-org" name="organisation" type="text" autocomplete="organization"></div>
        <div class="f"><label for="f-other">Phone or other contact <em>(optional)</em></label><input id="f-other" name="other_contact" type="text"></div></div></div>
      <p class="form-error" role="alert" aria-live="assertive"></p>
      <div class="f-nav"><button class="btn btn-line-d" type="button" data-back hidden><span>Back</span></button><button class="btn btn-blue" type="button" data-next><span>Continue</span><i class="btn-a">{ARROW}</i></button>
        <button class="btn btn-blue btn-lg" type="submit" data-submit><span>Send it to us</span><i class="btn-a">{ARROW}</i></button></div>
    </form>
    <div class="form-done" hidden><h2 class="d-l">Thank you. We've got it.</h2><p class="lead">We'll read what you sent and get back to you with next steps.</p><div class="row">{btn('See some of our work', base + 'work/', 'btn-blue')}</div></div>
  </div>
</div></section>"""
    page('start/', 'start', body, body_class='start-page')


def contact():
    base = '../'
    alt = f'<p><a class="ct-wa link" href="{wa_href()}" target="_blank" rel="noopener">Message us on WhatsApp</a></p>' if wa_href() else ''
    body = page_head('Contact', 'Say hello.', "The quickest way to reach us is by email. If you have a project in mind, the short form gives us what we need to reply properly.") + f"""
<div class="env-paper"><section class="ct"><div class="wrap ct-in">
  <div data-reveal><h2 class="mono svc-l">Email</h2><a class="ct-mail" href="mailto:{SITE['email']}">{SITE['email']}</a>{alt}</div>
  <div data-reveal><h2 class="mono svc-l">Have a project?</h2><p class="pj-big">Five short steps, and most of them are optional.</p><div class="row">{btn('Start a project', base + 'start/', 'btn-blue btn-lg')}</div></div>
  <div data-reveal><h2 class="mono svc-l">Where we are</h2><p>Based in Canada, working with people worldwide, in English and French.</p></div>
</div></section>
{faq_section(FAQ[:5], base)}</div>"""
    page('contact/', 'contact', body, body_class='contact-page')


# ── 404, sitemap, robots ──────────────────────────────────────────────────
def extras():
    open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8').write(f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | {BRAND}</title><meta name="robots" content="noindex">
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#101116;color:#F7F6F2;font-family:system-ui,sans-serif;text-align:center;padding:24px}}
h1{{font-size:clamp(2.2rem,6vw,4rem);margin:0 0 12px;letter-spacing:-.02em}}p{{margin:0 0 24px;color:#B4B6BE;font-size:1.1rem}}a{{display:inline-block;background:#FFD83D;color:#101116;padding:16px 28px;text-decoration:none;font-weight:600}}</style></head>
<body><main><h1>That page isn't here.</h1><p>But we can help you find what you need.</p><a id="home" href="/">Back to {BRAND}</a></main>
<script>var p=location.pathname.split('/');document.getElementById('home').href=(location.hostname.indexOf('github.io')>-1?'/'+p[1]:'')+'/';</script></body></html>''')
    urls = ['', 'services/'] + [f'services/{v["slug"]}/' for v in LANDING.values()] + ['work/', 'pricing/', 'blog/', 'about/', 'start/', 'contact/', 'dimension/', 'privacy/', 'cookies/', 'terms/'] + [f'work/{p["slug"]}/' for p in PROJECTS] + [f'blog/{b["slug"]}/' for b in POSTS]
    today = time.strftime('%Y-%m-%d')
    imgs = {f'work/{p["slug"]}/': [f'img/{p["slug"]}/{i:02d}-{MANIFEST[p["slug"]][str(i)]["sizes"][-1]}.webp'
                                   for i in range(min(len(p['srcs']), 10))] for p in PROJECTS}
    rows = []
    for u in urls:
        alts = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{SITE["url"]}/{pre}{u}"/>'
                       for l, pre in (('en', ''), ('fr', 'fr/'), ('x-default', '')))
        for pre in ('', 'fr/'):
            im = ''.join(f'\n    <image:image><image:loc>{SITE["url"]}/{q(i)}</image:loc></image:image>' for i in imgs.get(u, []))
            rows.append(f'  <url>\n    <loc>{SITE["url"]}/{pre}{u}</loc>\n    <lastmod>{today}</lastmod>{alts}{im}\n  </url>\n')
    sm = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
          'xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + ''.join(rows) + '</urlset>\n')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE["url"]}/sitemap.xml\n')

    # Netlify response headers: security, long caching for static files, and keep the concept demo sites out of search.
    concept_dirs = ['afaa-pay', 'northstar-capital', 'vita-house', 'mason-rowe', 'flyer', 'motion-video']
    open(os.path.join(ROOT, '_headers'), 'w', encoding='utf-8').write(
        '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n'
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n'
        '/img/*\n  Cache-Control: public, max-age=31536000, immutable\n\n'
        '/css/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n\n'
        '/css/*\n  Cache-Control: public, max-age=604800\n\n/js/*\n  Cache-Control: public, max-age=604800\n\n'
        '/assets/*\n  Cache-Control: public, max-age=2592000\n\n/video/*\n  Cache-Control: public, max-age=2592000\n\n'
        + ''.join(f'/{d}/*\n  X-Robots-Tag: noindex, follow\n\n' for d in concept_dirs))

    open(os.path.join(ROOT, 'llms.txt'), 'w', encoding='utf-8').write(
        f"# {BRAND}\n\n> {META['home'][1]} Based in Canada, working worldwide, in English and French.\n\n"
        f"Contact: {SITE['email']} · Start a project: {SITE['url']}/start/\n\n## Services\n\n"
        + ''.join(f"- [{v['title']}]({SITE['url']}/services/{v['slug']}/): {v['desc']}\n" for v in LANDING.values())
        + "\n## Work\n\n" + ''.join(f"- [{p['title']}]({SITE['url']}/work/{p['slug']}/) ({KIND[p['kind']]}{', independent concept' if p['concept'] else ''}): {p['plain']}.\n" for p in PROJECTS)
        + "\n## Guides\n\n" + ''.join(f"- [{b['title']}]({SITE['url']}/blog/{b['slug']}/): {b['excerpt']}\n" for b in POSTS)
        + f"\n## More\n\n- [Pricing]({SITE['url']}/pricing/)\n- [About]({SITE['url']}/about/)\n- [Creative Dimension]({SITE['url']}/dimension/)\n- [Français]({SITE['url']}/fr/)\n")


if __name__ == '__main__':
    home(); services(); work_index(); about(); start(); contact(); blog(); legal(); pricing(); service_pages(); dimension()
    for b in POSTS:
        blog_post(b)
    for p in PROJECTS:
        project(p)
    extras()
    import i18n
    n, miss = i18n.run(BUILT, SITE['url'], post=clip_meta)
    print('built', len(BUILT), 'English pages +', n, 'French pages, version', VERSION, '| untranslated strings:', miss)
