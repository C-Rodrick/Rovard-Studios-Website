# -*- coding: utf-8 -*-
"""Generate the ROVARD STUDIOS V2 static site into the repo root.

    python tools/build.py

Pages: / , /services/ , /work/ , /work/<slug>/ (x22) , /about/ , /start/ , 404.html , sitemap.xml , robots.txt
Env: NOLAZY=1 renders images eagerly (for review screenshots only).
"""
import html, json, os, re, sys, time, urllib.parse
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import *  # noqa
from blogdata import with_more
POSTS = with_more()
from landing import LANDING
from legal import PAGES as LEGAL, UPDATED as LEGAL_UPDATED, ANALYTICS_NOTE

VERSION = time.strftime('%Y%m%d%H%M')
MANIFEST = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json')))
PROJECTS = load_projects()
BY = {p['slug']: p for p in PROJECTS}
LOGO_BLUE = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20Blue.svg'
LOGO_WHITE = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20White.svg'
esc = html.escape

ARROW = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11 11 3M5 3h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CHECK = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PLUS = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>'
LEFT = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="16" height="16"><path d="M12 7H2m4-4L2 7l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
RIGHT = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="16" height="16"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'


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
    slug, frag = ref[0], ref[1]
    return img(slug, find_img(PROJECTS, slug, frag), alt, base, **kw)


def pill(label, href, cls='', ico=True):
    i = f'<i class="ico">{ARROW}</i>' if ico else ''
    return f'<a class="pill {cls}" href="{href}"><span>{label}</span>{i}</a>'


def concept(p, cls='concept'):
    return ''


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


def head(title, desc, path, base, extra_ld=()):
    url = f"{SITE['url']}/{path}"
    ld = json.dumps(site_ld(), ensure_ascii=False)
    ld += ''.join(f'</script>\n<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}' for x in extra_ld)
    analytics = f'<script defer data-domain="{SITE["plausible"]}" src="https://plausible.io/js/script.js"></script>' + chr(10) if SITE.get('plausible') else ''
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFFFFF">
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
<link rel="stylesheet" href="{base}css/site.css?v={VERSION}">
<link rel="stylesheet" href="{base}css/theme.css?v={VERSION}">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">{ld}</script>
</head>'''


MENU = [('services', 'Services'), ('work', 'Work'), ('pricing', 'Pricing'), ('blog', 'Blog'), ('about', 'About'), ('start', 'Contact')]


def header(base):
    links = ''.join(f'<a class="m" href="{base}{k}/"><small>{i + 1:02d}</small><span>{t}</span></a>' for i, (k, t) in enumerate(MENU))
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="wrap bar">
    <a class="logo" href="{base or './'}" aria-label="{BRAND} home"><img class="lg-b" src="{base}{LOGO_BLUE}" alt="{BRAND}" width="132" height="50"><img class="lg-w" src="{base}{LOGO_WHITE}" alt="" aria-hidden="true" width="132" height="50"></a>
    {pill('Start a project', base + 'start/', 'bar-cta')}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
  </div>
</header>
<div class="menu-panel" id="menu" aria-hidden="true">
  <nav aria-label="Menu">{links}</nav>
  <div class="menu-foot"><span>{SITE['location']}</span><a href="mailto:{SITE['email']}">{SITE['email']}</a>{pill('Start a project', base + 'start/', 'pill-yellow')}</div>
</div>'''


def wa_fab():
    h = wa_href()
    return f'<a class="wa-fab" href="{h}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">{WA_ICON}<span>WhatsApp</span></a>' if h else ''


def footer(base, path=''):
    pick = ['Logo design', 'Brand refresh', 'Brand guidelines', 'Business cards', 'Flyers', 'Posters', 'Invitations', 'Brochures', 'Social media posts', 'Church and ministry graphics',
            'Business websites', 'Landing pages', 'Billboards', 'Banners', 'Full vehicle wraps', 'Product packaging', 'Pitch decks', 'Presentations', 'Photo editing and retouching', 'Video editing']
    where = {ask: g['id'] for g in SERVICES for ask in g['asks']}
    svc = [f'<a href="{base}services/{LANDING[where[a]]["slug"]}/">{esc(a)}</a>' for a in pick if a in where]
    return f'''<footer class="site-footer">
  <div class="wrap foot-top"><h2 class="foot-big">Let's make it <span class="grad">look right.</span></h2>
    <div class="foot-top-r"><a class="foot-mail" href="mailto:{SITE['email']}">{SITE['email']}</a>{pill('Start a project', base + 'start/')}</div></div>
  <div class="wrap foot">
    <div class="foot-brand">
      <a href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_WHITE}" alt="{BRAND}" width="150" height="57" loading="lazy"></a>
      <p class="foot-contact">{SITE['location']}</p>
    </div>
    <nav class="foot-col" aria-label="Company"><h2>Company</h2>
      <a href="{base or './'}">Home</a><a href="{base}services/">Services</a><a href="{base}work/">Our work</a><a href="{base}pricing/">Pricing</a><a href="{base}blog/">Blog</a><a href="{base}about/">About</a><a href="{base}start/">Start a project</a></nav>
    <nav class="foot-col foot-svc" aria-label="Services"><h2>Services</h2><div class="svc-cols">{''.join(svc)}</div><a class="svc-all" href="{base}services/">See all services</a></nav>
  </div>
  <div class="wrap foot-base"><span>© {SITE['year']} {BRAND}. All rights reserved.</span>
    <span class="lang" data-lang aria-label="Language"><a href="{base}{path}" aria-current="true">EN</a><a href="{base}fr/{path}" hreflang="fr" lang="fr">FR</a></span>
    <nav class="foot-legal" aria-label="Legal"><a href="{base}privacy/">Privacy Policy</a><a href="{base}cookies/">Cookie Preferences</a><a href="{base}terms/">Terms</a></nav></div>
</footer>
{pill('Start a project', base + 'start/', 'sticky-cta pill-lg')}
{wa_fab()}'''


BUILT = []
_MEDIA_RE = re.compile(r'''(?<=["'(, ])(?:\.\./)*((?:img|video)/(?!mp4)|assets/Motion%20Design/)''')


def media_urls(html_text):
    """Point every image and video at the media host (Cloudflare R2) when SITE['media'] is set."""
    m = (SITE.get('media') or '').rstrip('/')
    return _MEDIA_RE.sub(lambda x: m + '/' + x.group(1), html_text) if m else html_text




SECTION_NAME = {'services': 'Services', 'work': 'Work', 'blog': 'Blog', 'pricing': 'Pricing', 'about': 'About', 'start': 'Start a project',
                'privacy': 'Privacy', 'cookies': 'Cookies', 'terms': 'Terms'}


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
    out = head(t, d or META[key][1], path, base, ld) + f'''
<body class="{body_class}">
{header(base)}
<main id="main">
{body}
</main>
{footer(base, path)}
<script src="{base}js/lenis.min.js" defer></script>
<script src="{base}js/site.js?v={VERSION}" defer></script>
{('<script src="' + base + 'js/hero-3d.js?v=' + VERSION + '" defer></script>') if body_class == 'home' else ''}
</body>
</html>
'''
    out = media_urls(out)
    BUILT.append((path, out))
    out = clip_meta(out)
    dest = os.path.join(ROOT, path, 'index.html') if path else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)


WA_ICON = '<svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M5 4h22a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H15l-7 5v-5H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><circle cx="10" cy="14.500" r="1.800" fill="#1FAF53"/><circle cx="16" cy="14.500" r="1.800" fill="#1FAF53"/><circle cx="22" cy="14.500" r="1.800" fill="#1FAF53"/></svg>'
WA_MSG = "Hi ROVARD STUDIOS, I'd like to talk about a project."


def wa_href():
    return f"https://wa.me/{SITE['whatsapp']}?text={urllib.parse.quote(WA_MSG)}" if SITE.get('whatsapp') else ''


def faces(base):
    return ''.join(f'<i style="background-image:url({base}img/people/{n:02d}-560.webp);background-size:230% auto;background-position:50% 9%"></i>' for n in HERO_FACES)


CTA_POOL = ['linkrithm', 'green-blueprint', 'design-eigen', 'jojo-foods', 'bitefort', 'shorteeme']


def close_cta(base, headline="Ready to make it <span class=\"grad\">real?</span>", sub="Tell us what you're working on. A few words is enough to start.", href=None, label='Start a Project'):
    slug = CTA_POOL[len(headline) % len(CTA_POOL)]
    return f'''<section class="sec close"><div class="wrap close-grid">
  <div class="close-l"><h2 class="big" data-r="words">{headline}</h2><p class="sub" data-r data-d=".25">{sub}</p>
  <div class="cta-row" data-r data-d=".35">{pill(label, href or base + 'start/')}{pill('See our work', base + 'work/', 'pill-outline pill-sm', ico=False)}</div>
  <p class="close-note" data-r="fade" data-d=".5">*No brief needed. Start with one sentence.</p></div>
  <div class="close-r" data-r="fade" data-d=".2"><div class="wc-media reel"><video src="{base}video/showreel.mp4" poster="{base}video/showreel-poster.webp" muted loop playsinline preload="none" aria-label="A short reel of recent ROVARD STUDIOS work" data-reel></video></div></div>
</div></section>'''


# ── HOME ──────────────────────────────────────────────────────────────────
def home():
    base = ''
    rot = [{'verb': WEDO[i][0], 'thing': WEDO[i][1], 'for': WEDO[i][2]} for i in HERO_ROTATION]
    f0 = rot[0]
    all_things = ', '.join(w[1] for w in WEDO)
    thumbs = faces(base)
    def rcard(slug):
        p = BY[slug]
        return f'<a class="rcard" href="work/{slug}/" tabindex="-1" aria-label="{esc(p["title"])}">{img(slug, 0, p["title"], base, sizes="300px", want=560)}<span>{esc(p["title"])}</span></a>'
    reel_a = [x for x in FEATURED]
    reel_b = [p['slug'] for p in PROJECTS if p['slug'] not in FEATURED and p['kind'] != 'motion'][:10]
    reel_b = reel_b + [x for x in reversed(FEATURED)][:max(0, 8 - len(reel_b))]
    def reel_row(items, cls=''):
        one = ''.join(rcard(x) for x in items)
        two = one.replace('<a class="rcard"', '<a aria-hidden="true" class="rcard"')
        return f'<div class="reel-row {cls}">{one}{two}</div>'
    hero = f'''<section class="hero2 hero-orig" aria-labelledby="hero-title">
  <div class="hero2-stage"><canvas id="heroCanvas" class="hero-3d-canvas" aria-hidden="true"></canvas>
  <div class="wrap hero-orig-in">
    <div class="hero-kicker" data-r="fade" data-intro>Canada · Worldwide <span></span> Independent design studio</div>
    <div class="hero-title-wrap">
      <p class="eyebrow" data-r="fade" data-intro>{BRAND}</p>
      <h1 class="h1 hero-title" id="hero-title" data-r="words" data-intro>Whatever you're<br>putting out there,<br>we'll make it <span class="grad">look right.</span></h1>
    </div>
    <div class="hero-bottom">
      <div class="hero-copy-col">
        <p class="hero-we" data-rotator='{esc(json.dumps(rot, ensure_ascii=False))}' data-r data-intro data-d=".45">
          <span class="sr-only">We design {all_things} for your ideas.</span>
          <span aria-hidden="true">We <span class="rv">{f0['verb']}</span> <b class="rt grad">{f0['thing']}</b> for your <span class="rf">{f0['for']}</span>.</span></p>
        <p class="lead" data-r data-intro data-d=".55">{BRAND} designs logos, flyers, websites, billboards, vehicle branding and everything in between. People decide what they think of you in seconds. We make sure that first look says the right thing.</p>
        <div class="cta-row" data-r data-intro data-d=".65">{pill('Start a project', 'start/', 'pill-lg')}</div>
        <p class="hero-proof" data-r="fade" data-intro data-d=".75"><b>7+ years</b> of experience <i></i> <b>200+ projects</b> completed</p>
      </div>
      <a class="round-link" href="#work" aria-label="Explore selected work" data-r="fade" data-intro data-d=".8"><span>Explore<br>the work</span><b>↓</b></a>
    </div>
    <div class="hero-scroll" aria-hidden="true"><span></span></div>
  </div></div>
  <div class="hero-reel" aria-hidden="true">{reel_row(reel_a)}{reel_row(reel_b, 'rev')}</div>
</section>'''

    def logo_item(f, name, h, first):
        w, hh = Image.open(os.path.join(ROOT, 'img', 'logos', f + '-c.png')).size
        k = min(h, 44)
        return (f'<li class="lg-tile"><img class="lg" src="{base}img/logos/{f}-c.png" alt="{esc(name)}" '
                f'width="{round(k * w / hh)}" height="{k}" loading="lazy" decoding="async"></li>')
    one = ''.join(logo_item(*b, False) for b in BRAND_LOGOS)
    two = one.replace('<li class="lg-tile">', '<li class="lg-tile" aria-hidden="true">').replace(' alt="', ' data-a="').replace('<img class="lg"', '<img alt="" class="lg"')
    logos = f'''<section class="logos" aria-label="Brands we have designed"><div class="wrap"><p class="eyebrow" data-r="fade">Brands we've designed</p></div>
  <div class="logo-marq" data-r><ul class="logo-track">{one}{two}</ul></div></section>'''

    film_idx = find_img(PROJECTS, FILM['slug'], FILM['poster'])
    film = f'''<section class="showcase wide"><div class="film" data-r>
  {img(FILM['slug'], film_idx, f'A still from the {BRAND} film', base, sizes='(min-width: 1280px) 1160px, 94vw', eager=True, want=1600, cls='poster', extra=' data-par=".06"')}
  <video preload="none" playsinline poster="{base}img/{FILM['slug']}/{film_idx:02d}-1100.webp"><source src="{base}{FILM['src']}" type="video/mp4"></video>
  <div class="film-ui"><div><small>The film · 1:30</small><p>{BRAND} in 90 seconds: what we do, and what it looks like.</p></div>
  <button class="play" type="button" aria-label="Play the {BRAND} film">{PLAY}</button></div></div></section>'''

    cards = ''
    for s in FEATURED:
        p = BY[s]
        cards += f'''<a class="pcard" href="work/{s}/" aria-label="{esc(p['title'])}">{img(s, 0, p['title'], base, sizes='(min-width: 1100px) 480px, 82vw', want=1100, extra=' data-par=".05"')}
  <span class="pc-top"><span class="tagc">{esc(KIND[p['kind']])}</span><i class="arrow-c">{ARROW}</i></span>
  <span class="pc-body"><h3>{esc(p['title'])}</h3><p>{esc(p['plain'])}</p></span></a>'''
    work = f'''<section class="sec" id="work"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Selected work</p><h2 class="h2" data-r="words">Don't take our word for it. <span class="grad">Look at the work.</span></h2></div>
  <div class="sh-r"><p class="sub" data-r>Logos, brands, websites, graphics, packaging and films. Drag to explore, and ask yourself: could this be my business?</p></div></div></div>
  <div class="car" data-car data-r><div class="car-track">{cards}</div></div>
  <div class="wrap car-ctl" data-r><button class="car-btn" type="button" data-prev aria-label="Previous projects">{LEFT}</button><div class="car-bar"><i></i></div><button class="car-btn" type="button" data-next aria-label="Next projects">{RIGHT}</button>{pill('See all work', 'work/', 'pill-ghost')}</div>
</section>'''

    row = lambda items, cls='': f'<div class="cards-row {cls}">{"".join(items)}{"".join(items)}</div>'
    tms = load_testimonials()
    if tms:
        def tcard(t):
            who_ = esc(t['name']) + (f', {esc(t["role"])}' if t.get('role') else '')
            av = f'<img class="tav" src="{base}{t["photo"]}" alt="" width="36" height="36" loading="lazy">' if t.get('photo') else ''
            return f'<figure class="acard tcard"><blockquote>{esc(t["quote"])}</blockquote><figcaption>{av}<span>{who_}</span></figcaption></figure>'
        cards_t = [tcard(t) for t in tms]
        while len(cards_t) < 6:
            cards_t = cards_t + cards_t
        half = len(cards_t) // 2
        reviews = f'''<section class="sec" id="reviews" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Word on the street</p><h2 class="h2" data-r="words">What people <span class="grad">say</span></h2></div></div></div>
  <div class="cards-wrap" data-r>{row(cards_t[:half])}{row(cards_t[half:], 'rev')}</div></section>'''
    else:
        reviews = ''

    lf = ''.join(f'<figure class="lf-{i}" data-r data-d="{i * .1:.1f}">{ref_img(r, r[2], base, sizes="(min-width: 900px) 600px, 94vw")}<figcaption>{esc(r[2])}</figcaption></figure>' for i, r in enumerate(LARGE_FORMAT))
    large = f'''<section class="sec dark" id="large-format"><div class="wrap large-grid">
  <div><p class="eyebrow" data-r="fade">Billboards, banners and vehicles</p>
    <h2 class="big" data-r="words">Your vehicle is already moving around the city. <span class="grad">Make it work for you.</span></h2>
    <p class="sub" data-r data-d=".2" style="margin-top:24px">Think about it: your vehicle advertises you all day, whether you designed it or not. So make it count. We design at billboard, banner and van scale, so people notice you and remember you.</p>
    <div class="cta-row" data-r data-d=".3">{pill('Get my vehicle branded', 'start/?need=vehicle', 'pill-yellow pill-lg')}{pill('Billboards and banners', 'services/#ads', 'pill-line pill-lg')}</div>
    <p class="small muted" data-r data-d=".4" style="margin-top:20px">We design it and prepare the files. Printing and fitting are done by a printer or installer.</p></div>
  <div class="collage">{lf}<div class="soon lf-soon" data-r data-d=".3"><b>Vehicles</b><span>Full wraps for cars, vans and delivery vehicles. Mockups coming soon.</span></div></div>
</div></section>'''

    steps = ''.join(f'<li><span class="n grad">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    how = f'''<section class="sec" id="how"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">How it works</p><h2 class="h2" data-r="words">No mystery. <span class="grad">Here's how it works.</span></h2></div>
  <div class="sh-r" data-r>{pill('Start a project', 'start/')}</div></div>
  <ol class="steps" data-stagger="90">{steps}</ol></div></section>'''

    srows = ''.join(f'<a class="row" href="services/#{s["id"]}"><span>{esc(s["title"])}</span><i class="arrow-c">{ARROW}</i></a>' for s in SERVICES)
    serv = f'''<section class="sec" id="services" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Services</p><h2 class="h2" data-r="words">What we can <span class="grad">design for you</span></h2></div>
  <div class="sh-r" data-r>{pill('See all services', 'services/', 'pill-ghost')}</div></div>
  <div class="rows" data-stagger="45">{srows}</div></div></section>'''

    page('', 'home', hero + logos + film + work + serv + reviews + large + how + faq_section(base, FAQ[:5]) + close_cta(base), body_class='home')


# ── SERVICES ──────────────────────────────────────────────────────────────
def services():
    base = '../'
    jump = ''.join(f'<a class="pf" href="#{s["id"]}">{esc(s["title"])}</a>' for s in SERVICES)
    intro = f'''<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>What we can design for you</p>
  <h1 class="h1" data-r="words" data-intro>Whatever you need designed, <span class="grad">just ask.</span></h1>
  <p class="lead" data-r data-intro data-d=".3">Big project or small, brand new or a refresh. If it needs to look right, we can talk about it. Jump to what you need:</p>
  <div class="pills" data-r data-intro data-d=".4">{jump}</div>
  <div class="unsure" data-r><div><h2 class="h3">Not sure what you need?</h2><p>Good. That's where the best conversations start. Tell us your idea in your own words and we'll figure out the rest together.</p></div>
  {pill('I have an idea', base + 'start/?need=unsure', 'pill-yellow pill-lg')}</div></div></section>'''
    groups = []
    for n, s in enumerate(SERVICES):
        asks = ''.join(f'<li>{esc(a)}</li>' for a in s['asks'])
        prod = f'<p class="prod">{esc(PRODUCTION_NOTE)}</p>' if s['production'] else ''
        if s['work']:
            cards = ''.join(f'<a class="mini" href="{base}work/{w}/"><div class="mi">{img(w, 0, BY[w]["title"], base, sizes="(min-width: 900px) 26vw, 94vw", want=560)}</div>'
                            f'<span>{esc(BY[w]["title"])}</span></a>' for w in s['work'])
        else:
            cards = f'<div class="mini soon"><b>{esc(s["title"])}</b><span>{esc(s.get("note", "Examples coming soon."))}</span></div>'
        groups.append(f'''<section class="svc" id="{s['id']}"><div class="wrap">
  <div class="svc-grid"><div class="svc-head"><span class="svc-n">{n + 1:02d}</span><h2 class="h2" data-r="words">{esc(s['title'])}</h2>
    <p class="svc-line" data-r>{esc(s['line'])}</p><p class="muted" data-r>{esc(s['intro'])}</p></div>
  <div class="svc-body" data-r><h3 class="eyebrow">What people ask us for</h3><ul class="asks">{asks}</ul>{prod}{pill(esc(s['cta']), f"{base}start/?need={s['need']}")}<a class="more" href="{LANDING[s['id']]['slug']}/">Learn more</a></div></div>
  <div class="mini-row" data-r>{cards}</div></div></section>''')
    page('services/', 'services', intro + ''.join(groups) + close_cta(base, "Don't see it? <span class=\"grad\">Ask anyway.</span>", "Other creative requests are welcome. Tell us what you have in mind.", label='Tell Us What You Need'), body_class='services')


# ── SERVICE PAGES ─────────────────────────────────────────────────────────
def service_pages():
    base = '../../'
    for s in SERVICES:
        L = LANDING[s['id']]
        asks = ''.join(f'<li>{esc(a)}</li>' for a in s['asks'])
        who = ''.join(f'<li>{esc(x)}</li>' for x in L['who'])
        get = ''.join(f'<li>{esc(x)}</li>' for x in L['get'])
        cards = ''.join(f'<a class="mini" href="{base}work/{w}/"><div class="mi">{img(w, 0, BY[w]["title"], base, sizes="(min-width: 900px) 26vw, 94vw", want=560)}</div>'
                        f'<span>{esc(BY[w]["title"])}</span></a>' for w in s['work']) if s['work'] else ''
        work = f'<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="h3" data-r style="margin-bottom:28px">Some of our work</h2><div class="mini-row" data-r>{cards}</div></div></section>' if cards else ''
        steps = ''.join(f'<li><span class="n grad">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
        others = ''.join(f'<a class="pf" href="{base}services/{LANDING[o["id"]]["slug"]}/">{esc(o["title"])}</a>' for o in SERVICES if o['id'] != s['id'])
        ld = json.dumps({'@context': 'https://schema.org', '@type': 'Service', 'name': L['title'], 'description': L['desc'],
                         'serviceType': L['title'], 'url': f"{SITE['url']}/services/{L['slug']}/",
                         'provider': {'@id': ORG_ID, 'name': BRAND}, 'areaServed': [{'@type': 'Country', 'name': 'Canada'}, 'Worldwide']}, ensure_ascii=False)
        body = f"""<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro><a href="{base}services/">Services</a> · {esc(s['title'])}</p>
  <h1 class="h1" data-r="words" data-intro>{L['h1']}</h1>
  <p class="lead" data-r data-intro data-d=".3">{esc(L['lead'])}</p>
  <div class="cta-row" data-r data-intro data-d=".4">{pill('Start a project', f"{base}start/?need={s['need']}", 'pill-lg')}{pill('See our work', base + 'work/', 'pill-outline pill-sm', ico=False)}</div></div></section>
<section class="sec"><div class="wrap sv-two">
  <div data-r><h2 class="h3">Who it's for</h2><ul class="tick">{who}</ul></div>
  <div data-r data-d=".1"><h2 class="h3">What you get</h2><ul class="tick">{get}</ul></div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="h3" data-r style="margin-bottom:20px">What people ask us for</h2><ul class="asks asks-wide" data-r>{asks}</ul></div></section>
{work}
<section class="sec" style="padding-top:0"><div class="wrap"><div class="sh"><div><p class="eyebrow" data-r="fade">How we work</p><h2 class="h2" data-r="words">Simple, <span class="grad">from the first message</span></h2></div></div>
  <ol class="steps" data-stagger="90">{steps}</ol></div></section>
{faq_section(base, L['faq'], heading='Good to <span class="grad">know</span>', eyebrow='Questions')}
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="h3" data-r style="margin-bottom:20px">Other things we design</h2><div class="pills" data-r>{others}</div></div></section>
<script type="application/ld+json">{ld}</script>
{close_cta(base, "Let's talk about <span class=\"grad\">your project.</span>", href=f"{base}start/?need={s['need']}")}"""
        page(f"services/{L['slug']}/", 'services', body, title=f"{L['title']} | {BRAND}", desc=L['desc'], body_class='services svc-page')



# ── WORK INDEX ────────────────────────────────────────────────────────────
def work_index():
    base = '../'
    chips = f'<button class="pf is-on" data-filter="all" type="button" aria-pressed="true">All</button>'
    for k, label in KIND.items():
        n = sum(1 for p in PROJECTS if p['kind'] == k)
        chips += f'<button class="pf" data-filter="{k}" type="button" aria-pressed="false">{esc(label)}</button>'
    cards = ''.join(f'''<article class="wcard" data-kind="{p['kind']}" data-r><a class="wc-media" href="{p['slug']}/" aria-label="{esc(p['title'])}">{img(p['slug'], 0, p['title'], base, sizes='(min-width: 900px) 580px, 94vw', want=1100)}{concept(p)}</a>
  <div class="wc-meta"><h2><a href="{p['slug']}/">{esc(p['title'])}</a></h2><p>{esc(p['plain'])}</p><span class="kt">{esc(KIND[p['kind']])}</span></div></article>''' for p in PROJECTS)
    body = f'''<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>Selected work</p>
  <h1 class="h1" data-r="words" data-intro>Things <span class="grad">we've made</span></h1>
  <p class="lead" data-r data-intro data-d=".3">Logos, brands, websites, social graphics, packaging and films. Click any project to see it up close.</p>
  <div class="pills" role="group" aria-label="Filter projects" data-r data-intro data-d=".4">{chips}</div></div></section>
<section class="wrap work-grid" id="grid">{cards}</section>
{close_cta(base, 'Have something like this <span class="grad">in mind?</span>')}'''
    page('work/', 'work', body, body_class='work')


# ── PROJECT PAGES ─────────────────────────────────────────────────────────
KIND_NEED = {'brand': 'brand', 'web': 'website', 'social': 'design', 'print': 'packaging', 'motion': 'media'}


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


def project(p):
    base = '../../'
    slug = p['slug']
    facts = []
    if p.get('client'): facts.append(('Client', p['client']))
    if p.get('industry'): facts.append(('Industry', p['industry']))
    if p.get('type'): facts.append(('Project type', p['type']))
    facts += [('What we did', p['services']), ('Year', p['year'])]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{esc(str(v))}</dd></div>' for k, v in facts)
    note = ''
    story = ''
    if slug in STORIES:
        st = STORIES[slug]
        big, (a, b) = st['big'], st['small']
        story = f'''<section class="wrap blk"><h2 class="h3" data-r>From idea to the real world</h2>
  <div class="story-grid" data-r><figure class="s-big"><span class="s-n">1</span>{ref_img(big, big[2], base, sizes='(min-width: 900px) 640px, 94vw')}<figcaption>{esc(big[2])}</figcaption></figure>
  <figure class="s-a"><span class="s-n">2</span>{ref_img(a, a[2], base, sizes='(min-width: 900px) 460px, 46vw', want=560)}<figcaption>{esc(a[2])}</figcaption></figure>
  <figure class="s-b"><span class="s-n">3</span>{ref_img(b, b[2], base, sizes='(min-width: 900px) 460px, 46vw', want=560)}<figcaption>{esc(b[2])}</figcaption></figure></div></section>'''
    vids = ''
    if p['vids']:
        items = ''
        for v in p['vids']:
            poster = f' poster="{base}{q(v["poster"])}"' if v['poster'] else ''
            cap = f'<h3 class="h4">{esc(v["title"])}</h3>' if v['title'] else ''
            items += f'<figure class="vid">{cap}<video controls preload="none" playsinline{poster}><source src="{base}{q(v["src"])}" type="video/mp4"></video></figure>'
        vids = f'<section class="wrap blk" data-r><h2 class="h3">Watch</h2><div class="vid-grid">{items}</div></section>'
    live = ''
    if p['live']:
        live = f'<div class="live" data-r>{pill(esc(p["live_label"]), base + q(p["live"]))}</div>'
    n_img = len(p['srcs'])
    items = ''.join(
        f'<button class="g-item" type="button" data-full="{base}img/{slug}/{i:02d}-{MANIFEST[slug][str(i)]["sizes"][-1]}.webp" data-alt="{esc(p["title"])} image {i}">'
        f'{img(slug, i, f"{p["title"]} image {i}", base, sizes="(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 94vw", want=560)}</button>' for i in range(1, n_img))
    gal = f'<section class="wrap blk"><h2 class="h3" data-r>The work</h2><div class="g-grid">{items}</div></section>' if items else ''
    rel = ''.join(f'''<article class="wcard" data-r><a class="wc-media" href="{base}work/{x['slug']}/" aria-label="{esc(x['title'])}">{img(x['slug'], 0, x['title'], base, sizes='(min-width: 900px) 30vw, 94vw', want=560)}{concept(x)}</a>
  <div class="wc-meta"><h3><a href="{base}work/{x['slug']}/">{esc(x['title'])}</a></h3><p>{esc(x['plain'])}</p></div></article>''' for x in related(p))
    body = f'''<section class="proj-head"><div class="wrap"><a class="back" href="{base}work/">← All work</a>
  <p class="eyebrow">{esc(KIND[p['kind']])} {concept(p)}</p>
  <h1 class="h1" data-r="words" data-intro>{esc(p['title'])}</h1><p class="lead" data-r data-intro data-d=".2">{esc(p['plain'])}.</p>{note}
  <dl class="facts" data-r data-intro data-d=".3">{dl}</dl></div></section>
<section class="wrap proj-hero" data-r data-intro data-d=".25">{img(slug, 0, p['title'], base, sizes='(min-width: 1280px) 1160px, 94vw', eager=True, want=1600, cls='hero-img')}</section>
<section class="wrap"><div class="pb" data-r>
  <div><h2>The challenge</h2><p>{esc(p['challenge'])}</p></div>
  <div><h2>What we did</h2><p>{esc(p['approach'])}</p></div>
  <div><h2>What was made</h2><p>{esc(p['made'])}</p></div></div>{live}</section>
{story}{vids}{gal}
{close_cta(base, 'Have something like this <span class="grad">in mind?</span>', href=f"{base}start/?need={KIND_NEED[p['kind']]}")}
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="h3" data-r style="margin-bottom:28px">More projects</h2><div class="rel">{rel}</div></div></section>
<div class="lightbox" hidden role="dialog" aria-modal="true" aria-label="Image viewer"><button class="lb-close" type="button" aria-label="Close">×</button>
  <button class="lb-nav lb-prev" type="button" aria-label="Previous image">←</button><img alt=""><button class="lb-nav lb-next" type="button" aria-label="Next image">→</button><span class="lb-count"></span></div>'''
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
    steps = ''.join(f'<li><span class="n grad">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    why = ''.join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in WHY)
    body = f'''<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>About {BRAND}</p>
  <h1 class="h1" data-r="words" data-intro>Your idea deserves to be <span class="grad">seen properly.</span></h1></div></section>
<section class="sec" style="padding-bottom:70px"><div class="wrap about-grid"><h2 class="h3" data-r>Who we are</h2>
  <div class="prose" data-r data-d=".1"><p>{BRAND} is a design studio. Our job is simple: help people put their ideas out there in a way that looks professional, feels memorable and does its job. Logos, flyers, social media graphics, websites, campaigns, vehicle branding and more.</p>
  <p>We work with individuals, small businesses, churches, organizations and companies. We're based in Canada and work with people around the world. Some projects are big and some are one flyer. Same care, same questions: who is this for, and what should it do?</p></div></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="stats" data-r><div class="stat"><b data-count="7" data-suffix="+">7+</b><span>years of experience</span></div><div class="stat"><b data-count="200" data-suffix="+">200+</b><span>projects completed</span></div><div class="stat"><b data-count="{len(SERVICES)}" data-suffix="">{len(SERVICES)}</b><span>kinds of work you can ask for</span></div><div class="stat"><b data-count="3" data-suffix="">3</b><span>short steps to get started</span></div></div></div></section>
<section class="sec dark"><div class="wrap vm"><div data-r><p class="eyebrow">Our vision</p><p class="statement">A world where anyone with a good idea can put it out there looking <span class="grad">as good as it deserves.</span></p></div>
  <div data-r data-d=".15"><p class="eyebrow">Our mission</p><p class="statement sm">To make professional design easy to ask for, by bringing together creativity, careful design, technology and honest collaboration, and by giving every request, big or small, the same care.</p></div></div></section>
<section class="sec"><div class="wrap"><div class="sh"><div><p class="eyebrow" data-r="fade">How we work</p><h2 class="h2" data-r="words">Simple, <span class="grad">from the first message</span></h2></div></div>
  <ol class="steps" data-stagger="90">{steps}</ol></div></section>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="sh"><div><p class="eyebrow" data-r="fade">Why {BRAND}</p><h2 class="h2" data-r="words">Easy to talk to. <span class="grad">Serious about the work.</span></h2></div></div>
  <ul class="why-cards" data-stagger="90">{why}</ul></div></section>
{close_cta(base, "Let's work <span class=\"grad\">together.</span>")}'''
    page('about/', 'about', body, body_class='about')


# ── BLOG ──────────────────────────────────────────────────────────────────
def bcard(b, base):
    return f'''<article class="bcard" data-r><a class="wc-media" href="{base}blog/{b['slug']}/" aria-label="{esc(b['title'])}">{img(b['cover'], 0, '', base, sizes='(min-width: 900px) 380px, 94vw', want=560)}</a>
  <div class="bmeta"><p>{esc(b['date'])} · {esc(b['tag'])}</p><h2><a href="{base}blog/{b['slug']}/">{esc(b['title'])}</a></h2></div></article>'''


def blog():
    base = '../'
    cards = [bcard(b, base) for b in POSTS]
    band = f'''<aside class="bband" data-r><div><h2 class="h3">Need something designed?</h2><p>A few words about your idea is plenty. We'll take it from there.</p></div>{pill("Start a project", base + "start/")}</aside>'''
    grid = ''.join(cards[:3]) + band + ''.join(cards[3:])
    body = f'''<section class="ph blog-ph"><div class="wrap blog-hd"><h1 class="h1" data-r="words" data-intro>Studio <span class="grad">notes</span></h1>
  <p class="lead" data-r data-intro data-d=".3">Plain advice from the studio: how to ask for the right thing, get it made well, and make it look right.</p></div></section>
<section class="wrap blog-grid">{grid}</section>
{close_cta(base, "Have a question? <span class=\"grad\">Ask us.</span>", "Tell us what you're working on. A few words is plenty.")}'''
    page('blog/', 'blog', body, body_class='blog')


def blog_post(b):
    base = '../../'
    parts = []
    for kind, val in b['body']:
        if kind == 'h':
            parts.append(f'<h2>{esc(val)}</h2>')
        elif kind == 'ul':
            parts.append('<ul>' + ''.join(f'<li>{esc(x)}</li>' for x in val) + '</ul>')
        else:
            parts.append(f'<p>{esc(val)}</p>')
    rel = ''.join(bcard(x, base) for x in POSTS if x['slug'] != b['slug'])[:0]
    others = [x for x in POSTS if x['slug'] != b['slug']][:3]
    rel = ''.join(bcard(x, base) for x in others)
    body = f'''<article><section class="ph post-ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro><a href="{base}blog/">Blog</a> · {esc(b['tag'])}</p>
  <h1 class="h1" data-r="words" data-intro>{esc(b['title'])}</h1>
  <p class="post-meta" data-r="fade" data-intro data-d=".3">{esc(b['date'])} · {b['read']} min read · by {BRAND}</p></div></section>
<div class="wrap post-cover" data-r><div class="wc-media">{img(b['cover'], 0, '', base, sizes='(min-width: 1200px) 1100px, 94vw', want=1100, eager=True)}</div></div>
<div class="wrap post-body" data-r>{''.join(parts)}</div></article>
<section class="sec" style="padding-top:0"><div class="wrap"><h2 class="h3" data-r style="margin-bottom:28px">More from the blog</h2><div class="blog-grid blog-rel">{rel}</div></div></section>
{close_cta(base, "Let's make yours <span class=\"grad\">look right.</span>")}'''
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
        for kind, val in pg['body']:
            if kind == 'h':
                parts.append(f'<h2>{esc(val)}</h2>')
            elif kind == 'ul':
                parts.append('<ul>' + ''.join(f'<li>{esc(x)}</li>' for x in val) + '</ul>')
            else:
                parts.append(f'<p>{esc(val)}</p>')
            if SITE.get('plausible') and pg['slug'] in ('privacy', 'cookies') and kind == 'p' and val.startswith(('We do not run advertising', 'Our hosting provider')):
                parts.append(f'<p>{esc(ANALYTICS_NOTE)}</p>')
        body = f'''<section class="ph post-ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>Legal</p>
  <h1 class="h1" data-r="words" data-intro>{esc(pg['title'])}</h1>
  <p class="lead" data-r data-intro data-d=".3">{esc(pg['intro'])}</p><p class="post-meta">Last updated: {LEGAL_UPDATED}</p></div></section>
<div class="wrap post-body">{''.join(parts)}</div>
{close_cta(base, "Questions? <span class=\"grad\">Just ask.</span>")}'''
        page(f"{pg['slug']}/", 'home', body, title=f"{pg['title']} | {BRAND}", desc=pg['intro'], body_class='legal')



# ── FAQ + PRICING ─────────────────────────────────────────────────────────
def faq_section(base, items=None, heading='Questions you\'re <span class="grad">probably asking</span>', eyebrow='FAQ'):
    items = items or FAQ
    qa = ''.join(f'<details class="faq-i"><summary><span>{esc(q)}</span><i class="faq-ico"></i></summary><p>{esc(a)}</p></details>' for q, a in items)
    ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in items]}, ensure_ascii=False)
    return f"""<section class="sec faq-sec" id="faq"><div class="wrap faq-grid">
  <div class="faq-head"><p class="eyebrow" data-r="fade">{eyebrow}</p><h2 class="h2" data-r="words">{heading}</h2>
    <p class="sub" data-r data-d=".2">Not here? Ask us. A few words is plenty.</p>{pill('Ask us', base + 'start/', 'pill-outline pill-sm', ico=False)}</div>
  <div class="faq-list" data-r>{qa}</div></div>
<script type="application/ld+json">{ld}</script></section>"""


def pricing():
    base = '../'
    cards = ''
    for pk in sorted(PACKAGES, key=lambda x: (x.get('price') is None, x.get('price') or 0)):
        price = f'From <b>${pk["price"]:,}</b>' if pk.get('price') else '<b>Tell us your budget</b>'
        feat = ''
        lis = ''.join(f'<li>{esc(x)}</li>' for x in pk['includes'])
        btn = pill('Get a quote', f"{base}start/?need={pk['need']}", 'pill-outline pill-sm', ico=False)
        cards += f"""<article class="pk{feat}" data-r>
  <h2>{esc(pk['name'])}</h2><p class="pk-who">{esc(pk['who'])}</p>
  <ul>{lis}</ul>
  <p class="pk-price">{price}</p>{btn}</article>"""
    body = f"""<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>Pricing</p>
  <h1 class="h1" data-r="words" data-intro>Clear, <span class="grad">no surprises</span></h1>
  <p class="lead" data-r data-intro data-d=".3">Price should come from value, so every project gets a written quote before any work starts. Here's what each kind of project usually includes, so you know what to ask for.</p></div></section>
<section class="wrap pk-grid">{cards}</section>
<section class="wrap pk-note" data-r><p>These are starting points, in US dollars, before taxes. Not sure which fits? Choose a budget range on the form and we'll tell you honestly what it can cover. Your written quote has the final price, the timeline and exactly what's included.</p></section>
{faq_section(base)}
{close_cta(base, "Ready when <span class=\"grad\">you are.</span>")}"""
    page('pricing/', 'pricing', body, body_class='pricing')



# ── START ─────────────────────────────────────────────────────────────────
def start():
    base = '../'
    extra_alt = ''
    if wa_href():
        extra_alt += f'<a class="alt-card" href="{wa_href()}" target="_blank" rel="noopener"><small>Prefer to chat?</small><b>Message us on WhatsApp</b><i class="arrow-c">{ARROW}</i></a>'
    if SITE.get('booking'):
        extra_alt += f'<a class="alt-card" href="{SITE["booking"]}" target="_blank" rel="noopener"><small>Prefer to talk?</small><b>Book a call</b><i class="arrow-c">{ARROW}</i></a>'
    budgets = ''.join(f'<label class="pick"><input type="radio" name="budget" value="{esc(b)}"><span>{esc(b)}</span></label>' for b in BUDGETS)
    picks = ''.join(f'<label class="pick"><input type="checkbox" name="need" value="{k}"><span>{esc(t)}</span></label>' for k, t in NEEDS)
    arc = ''.join(f'<i style="background-image:url({base}img/people/{n:02d}-560.webp);background-size:230% auto;background-position:50% 9%"></i>' for n in HERO_FACES)
    steps = ''.join(f'<li><span class="n">{i + 1:02d}</span><div><h3>{esc(t)}</h3><p>{esc(d)}</p></div></li>' for i, (t, d) in enumerate(STEPS[:3]))
    body = f"""<section class="talk2"><div class="wrap talk2-grid">
  <aside class="talk2-side">
    <p class="nrf" data-r data-intro>Not sure how to put it? <b>Messy is fine.</b></p>
    <h1 class="big" data-r="words" data-intro data-d=".1">Tell us <span class="grad">what you need</span></h1>
    <p class="talk-sub" data-r data-intro data-d=".3">Share what you're working on, or email us at <a href="mailto:{SITE['email']}">{SITE['email']}</a>. Tell us who it's for and what it needs to do. If you don't know yet, say that.</p>
    <div class="alt" data-r data-d=".35"><a class="alt-card" href="mailto:{SITE['email']}"><small>Email us</small><b>{SITE['email']}</b><i class="arrow-c">{ARROW}</i></a>{extra_alt}
      <a class="alt-card" href="{base}work/"><small>Not ready yet?</small><b>See what we've made</b><i class="arrow-c">{ARROW}</i></a></div>
    <h2 class="side-h" data-r>How it works</h2>
    <ol class="side-steps" data-r data-d=".1">{steps}</ol>
  </aside>
  <div class="talk2-main">
  <form id="start-form" class="tform" action="{SITE['formspree']}" method="POST" novalidate data-r data-intro data-d=".25">
    <input type="hidden" name="_subject" value="New project enquiry from the {BRAND} website">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
    <div class="f"><label for="f-name">Name &amp; company</label><input id="f-name" name="name" type="text" autocomplete="name" placeholder="Your name, and your business if you have one" required></div>
    <div class="f-row">
      <div class="f"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
      <div class="f"><label for="f-phone">Phone <em>(optional)</em></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+1 555 555 5555"></div>
    </div>
    <div class="f"><span class="lab" id="needs-l">What do you need? <em>Tick everything that applies</em></span><div class="seg" role="group" aria-labelledby="needs-l">{picks}</div></div>
    <div class="f"><label for="f-idea">Tell us a little about it</label><textarea id="f-idea" name="idea" rows="4" placeholder="For example: I'm starting a bakery and need a logo and a flyer for the opening."></textarea></div>
    <div class="f"><span class="lab" id="budget-l">Roughly what's your budget? <em>(optional, in USD)</em></span><div class="seg" role="radiogroup" aria-labelledby="budget-l">{budgets}</div></div>
    <div class="f"><label for="f-date">Is there a date you need it by? <em>(optional)</em></label><input id="f-date" name="deadline" type="text" placeholder="For example: end of next month"></div>
    <p class="form-error" role="alert" aria-live="assertive"></p>
    <div class="tform-foot"><p class="small muted">One flyer is a real project. No brief needed.</p>
      <button type="submit" class="pill pill-lg" data-submit><span>Send it to us</span><i class="ico">{ARROW}</i></button></div>
  </form>
  <div class="form-done" hidden><h2 class="h2">Thank you. <span class="grad">We've got it.</span></h2><p class="lead">We'll read what you sent and get back to you.</p>
    <div class="cta-row">{pill('See some of our work', base + 'work/')}</div></div>
  </div>
</div></section>"""
    page('start/', 'start', body, body_class='start')


# ── 404, sitemap, robots ──────────────────────────────────────────────────
def extras():
    open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8').write(f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | {BRAND}</title><meta name="robots" content="noindex">
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#0A0C24;font-family:system-ui,sans-serif;text-align:center;padding:24px}}
h1{{font-size:clamp(2.2rem,6vw,4rem);margin:0 0 12px;letter-spacing:-.03em}}p{{margin:0 0 24px;color:#5F6485;font-size:1.1rem}}a{{display:inline-block;background:#162DAF;color:#fff;padding:16px 30px;border-radius:999px;text-decoration:none;font-weight:600}}</style></head>
<body><main><h1>That page isn't here.</h1><p>But we can help you find what you need.</p><a id="home" href="/">Back to {BRAND}</a></main>
<script>var p=location.pathname.split('/');document.getElementById('home').href=(location.hostname.indexOf('github.io')>-1?'/'+p[1]:'')+'/';</script></body></html>''')
    urls = ['', 'services/'] + [f'services/{v["slug"]}/' for v in LANDING.values()] + [ 'work/', 'pricing/', 'blog/', 'about/', 'start/', 'privacy/', 'cookies/', 'terms/'] + [f'work/{p["slug"]}/' for p in PROJECTS] + [f'blog/{b["slug"]}/' for b in POSTS]
    # Every English page and its French copy, linked to each other, with the project images listed
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

    # Netlify response headers: security, long caching for fingerprinted/static files,
    # and keep the concept demo sites (fictional brands) out of search; their /work/ pages represent them.
    concept_dirs = ['afaa-pay', 'northstar-capital', 'vita-house', 'mason-rowe', 'flyer', 'motion-video']
    open(os.path.join(ROOT, '_headers'), 'w', encoding='utf-8').write(
        '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n'
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n'
        '/img/*\n  Cache-Control: public, max-age=31536000, immutable\n\n'
        '/css/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n\n'
        '/css/*\n  Cache-Control: public, max-age=604800\n\n/js/*\n  Cache-Control: public, max-age=604800\n\n'
        '/assets/*\n  Cache-Control: public, max-age=2592000\n\n/video/*\n  Cache-Control: public, max-age=2592000\n\n'
        + ''.join(f'/{d}/*\n  X-Robots-Tag: noindex, follow\n\n' for d in concept_dirs))

    # llms.txt: plain summary for AI search tools
    open(os.path.join(ROOT, 'llms.txt'), 'w', encoding='utf-8').write(
        f"# {BRAND}\n\n> {META['home'][1]} Based in Canada, working worldwide, in English and French.\n\n"
        f"Contact: {SITE['email']} · Start a project: {SITE['url']}/start/\n\n## Services\n\n"
        + ''.join(f"- [{v['title']}]({SITE['url']}/services/{v['slug']}/): {v['desc']}\n" for v in LANDING.values())
        + f"\n## Work\n\n" + ''.join(f"- [{p['title']}]({SITE['url']}/work/{p['slug']}/) ({KIND[p['kind']]}): {p['plain']}.\n" for p in PROJECTS)
        + f"\n## Guides\n\n" + ''.join(f"- [{b['title']}]({SITE['url']}/blog/{b['slug']}/): {b['excerpt']}\n" for b in POSTS)
        + f"\n## More\n\n- [Pricing]({SITE['url']}/pricing/)\n- [About]({SITE['url']}/about/)\n- [Français]({SITE['url']}/fr/)\n")


if __name__ == '__main__':
    home(); services(); work_index(); about(); start(); blog(); legal(); pricing(); service_pages()
    for b in POSTS:
        blog_post(b)
    for p in PROJECTS:
        project(p)
    extras()
    import i18n
    n, miss = i18n.run(BUILT, SITE['url'], post=clip_meta)
    print('built', len(BUILT), 'English pages +', n, 'French pages, version', VERSION, '| untranslated strings:', miss)
