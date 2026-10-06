# -*- coding: utf-8 -*-
"""Generate the ROVARD STUDIOS V2 static site into the repo root.

    python tools/build.py

Pages: / , /services/ , /work/ , /work/<slug>/ (x22) , /about/ , /start/ , 404.html , sitemap.xml , robots.txt
Env: NOLAZY=1 renders images eagerly (for review screenshots only).
"""
import html, json, os, sys, time, urllib.parse
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import *  # noqa
from blogdata import POSTS
from legal import PAGES as LEGAL, UPDATED as LEGAL_UPDATED

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


def head(title, desc, path, base):
    url = f"{SITE['url']}/{path}"
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'ProfessionalService', 'name': BRAND, 'url': SITE['url'] + '/',
        'logo': f"{SITE['url']}/{LOGO_BLUE}", 'email': SITE['email'], 'areaServed': 'Worldwide', 'description': META['home'][1],
    }, ensure_ascii=False)
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
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE['url']}/assets/og-cover.jpg">
<meta property="og:image:alt" content="{BRAND}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="{base}assets/favicon/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="{base}assets/favicon/icon-192.png">
<link rel="apple-touch-icon" href="{base}assets/favicon/icon-180.png">
<link rel="preload" href="{base}css/fonts/Syne.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{base}css/fonts/SpaceGrotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}css/site.css?v={VERSION}">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">{ld}</script>
</head>'''


MENU = [('services', 'Services'), ('work', 'Work'), ('blog', 'Blog'), ('about', 'About'), ('start', 'Contact')]


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


def footer(base, path=''):
    pick = ['Logo design', 'Brand refresh', 'Brand guidelines', 'Business cards', 'Flyers', 'Posters', 'Invitations', 'Brochures', 'Social media posts', 'Church and ministry graphics',
            'Business websites', 'Landing pages', 'Billboards', 'Banners', 'Full vehicle wraps', 'Product packaging', 'Pitch decks', 'Presentations', 'Photo editing and retouching', 'Video editing']
    where = {ask: g['id'] for g in SERVICES for ask in g['asks']}
    svc = [f'<a href="{base}services/#{where[a]}">{esc(a)}</a>' for a in pick if a in where]
    return f'''<footer class="site-footer">
  <div class="wrap foot">
    <div class="foot-brand">
      <a href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_BLUE}" alt="{BRAND}" width="150" height="57" loading="lazy"></a>
      <p>Whatever you're putting out there, we'll make it look right.</p>
      <a class="pill pill-outline" href="{base}start/"><span>Say hello</span></a>
      <p class="foot-contact"><a href="mailto:{SITE['email']}">{SITE['email']}</a><br>{SITE['location']}</p>
    </div>
    <nav class="foot-col" aria-label="Company"><h2>Company</h2>
      <a href="{base or './'}">Home</a><a href="{base}services/">Services</a><a href="{base}work/">Our work</a><a href="{base}blog/">Blog</a><a href="{base}about/">About</a><a href="{base}start/">Start a project</a></nav>
    <nav class="foot-col foot-svc" aria-label="Services"><h2>Services</h2><div class="svc-cols">{''.join(svc)}</div></nav>
  </div>
  <div class="wrap foot-base"><span>© {SITE['year']} {BRAND}. All rights reserved.</span>
    <span class="lang" data-lang aria-label="Language"><a href="{base}{path}" aria-current="true">EN</a><a href="{base}fr/{path}" hreflang="fr" lang="fr">FR</a></span>
    <nav class="foot-legal" aria-label="Legal"><a href="{base}privacy/">Privacy Policy</a><a href="{base}cookies/">Cookie Preferences</a><a href="{base}terms/">Terms</a></nav></div>
</footer>
{pill('Start a project', base + 'start/', 'sticky-cta pill-lg')}'''


BUILT = []


def page(path, key, body, title=None, desc=None, body_class=''):
    depth = 0 if not path else path.count('/')
    base = '../' * depth
    t, d = (title, desc) if title else META[key]
    out = head(t, d or META[key][1], path, base) + f'''
<body class="{body_class}">
{header(base)}
<main id="main">
{body}
</main>
{footer(base, path)}
<script src="{base}js/lenis.min.js" defer></script>
<script src="{base}js/site.js?v={VERSION}" defer></script>
</body>
</html>
'''
    BUILT.append((path, out))
    dest = os.path.join(ROOT, path, 'index.html') if path else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)


def faces(base):
    return ''.join(f'<i style="background-image:url({base}img/people/{n:02d}-560.webp);background-size:230% auto;background-position:50% 9%"></i>' for n in HERO_FACES)


CTA_POOL = ['linkrithm', 'green-blueprint', 'design-eigen', 'jojo-foods', 'bitefort', 'shorteeme']


def close_cta(base, headline="Have an idea? Let's make it <span class=\"grad\">real</span>.", sub="Tell us what you're working on. A few words is plenty.", href=None, label='Start a Project'):
    slug = CTA_POOL[len(headline) % len(CTA_POOL)]
    return f'''<section class="sec close"><div class="wrap close-grid">
  <div class="close-l"><h2 class="big" data-r="words">{headline}</h2><p class="sub" data-r data-d=".25">{sub}</p>
  <div class="cta-row" data-r data-d=".35"><a class="pill pill-talk" href="{href or base + 'start/'}"><span>{label}</span><span class="thumbs" aria-hidden="true">{faces(base)}</span></a>{pill('See our work', base + 'work/', 'pill-outline pill-sm', ico=False)}</div>
  <p class="close-note" data-r="fade" data-d=".5">*A few words is plenty. Even one flyer is a real project.</p></div>
  <div class="close-r" data-r="fade" data-d=".2"><div class="wc-media reel"><video src="{base}video/showreel.mp4" poster="{base}video/showreel-poster.webp" autoplay muted loop playsinline preload="metadata" aria-label="A short reel of recent ROVARD STUDIOS work" data-reel></video></div></div>
</div></section>'''


# ── HOME ──────────────────────────────────────────────────────────────────
def home():
    base = ''
    rot = [{'verb': WEDO[i][0], 'thing': WEDO[i][1], 'for': WEDO[i][2]} for i in HERO_ROTATION]
    f0 = rot[0]
    all_things = ', '.join(w[1] for w in WEDO)
    thumbs = faces(base)
    hero = f'''<section class="hero" aria-labelledby="hero-title">
  <div class="hero-l">
    <p class="eyebrow" data-r="fade" data-intro>{BRAND}</p>
    <h1 class="h1" id="hero-title" data-r="words" data-intro>Whatever you're putting out there, we'll make it <span class="grad">look right.</span></h1>
  </div>
  <div class="hero-r">
    <p class="hero-we" data-rotator='{esc(json.dumps(rot, ensure_ascii=False))}' data-r data-intro data-d=".45">
      <span class="sr-only">We design {all_things} for your ideas.</span>
      <span aria-hidden="true">We <span class="rv">{f0['verb']}</span> <b class="rt grad">{f0['thing']}</b> for your <span class="rf">{f0['for']}</span>.</span></p>
    <p class="lead" data-r data-intro data-d=".55">{BRAND} designs logos, flyers, websites, billboards, vehicle branding and everything in between, for people, businesses, churches, organizations and events.</p>
    <div class="hero-cta" data-r data-intro data-d=".65"><a class="pill pill-talk" href="start/"><span>Let's talk</span><span class="thumbs" aria-hidden="true">{thumbs}</span></a>
      <span class="hand" aria-hidden="true"><svg viewBox="0 0 70 40" width="56" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M66 30C48 36 24 30 8 12"/><path d="M7 21L7 11L17 13"/></svg><span>Tell us what you're making</span></span></div>
    <p class="hero-proof" data-r="fade" data-intro data-d=".75"><b>7+ years</b> of experience <i></i> <b>200+ projects</b> completed</p>
    <p class="hero-note" data-r="fade" data-intro data-d=".8">Need just one thing? That's fine. One flyer is a real project.</p>
  </div>
</section>'''

    def logo_item(f, name, h, first):
        w, hh = Image.open(os.path.join(ROOT, 'img', 'logos', f + '-c.png')).size
        return (f'<span class="lg-item{" on" if first else ""}"><img class="lg" src="{base}img/logos/{f}-c.png" alt="{esc(name)}" '
                f'width="{round(h * w / hh)}" height="{h}" loading="eager" decoding="async"></span>')
    slots = ''.join('<div class="lg-slot">' + ''.join(logo_item(*b, i == 0) for i, b in enumerate(BRAND_LOGOS[k::4])) + '</div>' for k in range(4))
    logos = f'''<section class="logos" aria-label="Brands we have designed"><p class="eyebrow" data-r="fade">Brands we've designed</p>
  <div class="lg-band" data-r><div class="wrap lg-slots" data-logo-slots>{slots}</div></div></section>'''

    film_idx = find_img(PROJECTS, FILM['slug'], FILM['poster'])
    film = f'''<section class="showcase wide"><div class="film" data-r>
  {img(FILM['slug'], film_idx, f'A still from the {BRAND} film', base, sizes='(min-width: 1280px) 1160px, 94vw', eager=True, want=1600, cls='poster', extra=' data-par=".06"')}
  <video preload="none" playsinline poster="{base}img/{FILM['slug']}/{film_idx:02d}-1100.webp"><source src="{base}{FILM['src']}" type="video/mp4"></video>
  <div class="film-ui"><div><small>The film · 1:30</small><p>{BRAND} in 90 seconds: what we do, and what it looks like.</p></div>
  <button class="play" type="button" aria-label="Play the {BRAND} film">{PLAY}</button></div></div></section>'''

    track = ''.join(f'<span>{esc(w)}</span>' for w in MARQUEE)
    marquee = f'<div class="marquee" aria-hidden="true"><div class="marquee-track">{track}</div><div class="marquee-track">{track}</div></div>'

    need_rows = ''.join(
        f'<a class="row{" hl" if k == "unsure" else ""}" href="start/?need={k}"><span>{esc(t)}</span><i class="arrow-c">{ARROW}</i></a>' for k, t in NEEDS)
    need = f'''<section class="sec" id="need"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Start here</p><h2 class="h2" data-r="words">What do you <span class="grad">need</span> help with?</h2></div>
  <div class="sh-r"><p class="sub" data-r>Pick the closest one. You can add more, or change your mind, on the next screen.</p></div></div>
  <div class="rows" data-stagger="45">{need_rows}</div>
  <div class="cta-row" data-r>{pill('See everything we design', 'services/', 'pill-ghost')}</div>
</div></section>'''

    cards = ''
    for s in FEATURED:
        p = BY[s]
        cards += f'''<a class="pcard" href="work/{s}/" aria-label="{esc(p['title'])}">{img(s, 0, p['title'], base, sizes='(min-width: 1100px) 480px, 82vw', want=1100, extra=' data-par=".05"')}
  <span class="pc-top"><span class="tagc">{esc(KIND[p['kind']])}</span><i class="arrow-c">{ARROW}</i></span>
  <span class="pc-body"><h3>{esc(p['title'])}</h3><p>{esc(p['plain'])}</p></span></a>'''
    work = f'''<section class="sec" id="work" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Selected work</p><h2 class="h2" data-r="words">Recent <span class="grad">work</span></h2></div>
  <div class="sh-r"><p class="sub" data-r>A selection of logos, brands, websites, graphics, packaging and films. Drag to explore.</p></div></div></div>
  <div class="car" data-car data-r><div class="car-track">{cards}</div></div>
  <div class="wrap car-ctl" data-r><button class="car-btn" type="button" data-prev aria-label="Previous projects">{LEFT}</button><div class="car-bar"><i></i></div><button class="car-btn" type="button" data-next aria-label="Next projects">{RIGHT}</button>{pill('See all work', 'work/', 'pill-ghost')}</div>
</section>'''

    ways = ''
    for w in TWO_WAYS:
        ticks = ''.join(f'<li>{CHECK}<span>{esc(i)}</span></li>' for i in w['items'])
        ways += f'''<div class="way"><span class="chip" data-r><i></i>{esc(w['tag'])}</span>
  <h3 class="h3" data-r data-d=".08">{esc(w['title'])}</h3><ul class="ticks" data-stagger="70">{ticks}</ul>
  <div data-r data-d=".3">{pill(esc(w['cta']), w['href'])}</div>
  <div class="way-img">{ref_img(w['img'], w['img'][0], base, sizes='(min-width: 900px) 580px, 94vw', want=1100, extra=' data-par=".05"')}</div></div>'''
    two = f'''<section class="sec" id="ways" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Where to begin</p><h2 class="h2" data-r="words"><span class="grad">Starting</span> or growing, we've got you</h2></div></div>
  <div class="two" data-r>{ways}</div></div></section>'''

    stories = ''
    for slug in HOME_STORIES:
        st, p = STORIES[slug], BY[slug]
        big, (a, b) = st['big'], st['small']
        stories += f'''<article class="story"><div class="story-head" data-r><div><p class="eyebrow">{st['kicker']} {concept(p)}</p>
    <h3 class="h3"><a href="work/{slug}/">{esc(p['title'])}</a></h3><p>{esc(st['line'])}</p></div>{pill('View the project', f'work/{slug}/', 'pill-ghost')}</div>
  <div class="story-grid" data-r data-d=".1">
    <figure class="s-big"><span class="s-n">1</span>{ref_img(big, big[2], base, sizes='(min-width: 900px) 640px, 94vw')}<figcaption>{esc(big[2])}</figcaption></figure>
    <figure class="s-a"><span class="s-n">2</span>{ref_img(a, a[2], base, sizes='(min-width: 900px) 460px, 46vw', want=560)}<figcaption>{esc(a[2])}</figcaption></figure>
    <figure class="s-b"><span class="s-n">3</span>{ref_img(b, b[2], base, sizes='(min-width: 900px) 460px, 46vw', want=560)}<figcaption>{esc(b[2])}</figcaption></figure></div></article>'''
    story = f'''<section class="sec" id="stories" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Idea → design → real world</p><h2 class="h2" data-r="words">From an idea to <span class="grad">the real world</span></h2></div>
  <div class="sh-r"><p class="sub" data-r>A design isn't finished until you can see where it goes. Here's what a few projects became.</p></div></div>
  {stories}</div></section>'''

    def acard(i):
        t, d = AUDIENCES[i]
        return f'<div class="acard"><h3>{esc(t)}</h3><p>{esc(d)}</p></div>'

    def person(n):
        label, pos = PEOPLE[n]
        return (f'<figure class="acard photo">{img("people", n, label, base, sizes="360px", want=560, extra=f" style=\"object-position:{pos}\"")}'
                f'<figcaption>{esc(label)}</figcaption></figure>')
    blue = '<div class="acard blue"><h3>No project is too small.</h3><p>One flyer, one logo, one card. They all count here.</p></div>'
    r1 = [person(1), acard(0), acard(1), person(4), person(8), acard(2), person(3), acard(3), person(10), blue]
    r2 = [person(6), acard(4), person(5), acard(5), person(9), person(2), acard(6), person(7), acard(7)]
    row = lambda items, cls='': f'<div class="cards-row {cls}">{"".join(items)}{"".join(items)}</div>'
    who = f'''<section class="sec" id="who" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Who we work with</p><h2 class="h2" data-r="words">Big idea or small one, <span class="grad">we're glad you're here</span></h2></div>
  <div class="sh-r"><p class="sub" data-r>You don't need to know design words. You just need something you want people to see.</p></div></div></div>
  <div class="cards-wrap" data-r aria-label="Who we work with">{row(r1)}{row(r2, 'rev')}</div>
  <p class="small muted illus" data-r>{PEOPLE_NOTE}</p></section>'''

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

    pans = ''
    for n, ((t, d), ref) in enumerate(zip(WHY, WHY_IMGS)):
        pans += f'''<article class="pan" tabindex="0">{ref_img(ref, '', base, sizes='(min-width: 900px) 640px, 94vw', want=1100, extra=f' style="object-position:{ref[2]}"')}
  <span class="pn">{n + 1:02d}</span><span class="pp">{PLUS}</span><div class="pbd"><h3>{esc(t)}</h3><p>{esc(d)}</p></div></article>'''
    n_asks = len({a for s in SERVICES for a in s['asks']})
    stats = [(7, '+', 'years of experience'), (200, '+', 'projects completed'),
             (len(SERVICES), '', 'kinds of work you can ask for'), (3, '', 'short steps to get started')]
    stat_html = ''.join(f'<div class="stat"><b data-count="{n}" data-suffix="{s}">{n}{s}</b><span>{esc(l)}</span></div>' for n, s, l in stats)
    why = f'''<section class="sec" id="why" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Why {BRAND}</p><h2 class="h2" data-r="words">Easy to talk to. <span class="grad">Serious about the work.</span></h2></div></div>
  <div class="acc" data-r>{pans}</div><div class="stats" data-r>{stat_html}</div></div></section>'''

    lf = ''.join(f'<figure class="lf-{i}" data-r data-d="{i * .1:.1f}">{ref_img(r, r[2], base, sizes="(min-width: 900px) 600px, 94vw")}<figcaption>{esc(r[2])}</figcaption></figure>' for i, r in enumerate(LARGE_FORMAT))
    large = f'''<section class="sec dark" id="large-format"><div class="wrap large-grid">
  <div><p class="eyebrow" data-r="fade">Billboards, banners and vehicles</p>
    <h2 class="big" data-r="words">Your vehicle is already moving around the city. <span class="grad">Make it work for you.</span></h2>
    <p class="sub" data-r data-d=".2" style="margin-top:24px">Not a small logo on a door. A design that works at the size of a billboard, a banner or a whole van, so people notice it and remember it.</p>
    <div class="cta-row" data-r data-d=".3">{pill('Get my vehicle branded', 'start/?need=vehicle', 'pill-yellow pill-lg')}{pill('Billboards and banners', 'services/#ads', 'pill-line pill-lg')}</div>
    <p class="small muted" data-r data-d=".4" style="margin-top:20px">We design it and prepare the files. Printing and fitting are done by a printer or installer.</p></div>
  <div class="collage">{lf}<div class="soon lf-soon" data-r data-d=".3"><b>Vehicles</b><span>Full wraps for cars, vans and delivery vehicles. Mockups coming soon.</span></div></div>
</div></section>'''

    steps = ''.join(f'<li><span class="n grad">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    how = f'''<section class="sec" id="how"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">How it works</p><h2 class="h2" data-r="words">Simple, <span class="grad">from the first message</span></h2></div>
  <div class="sh-r" data-r>{pill('Start a project', 'start/')}</div></div>
  <ol class="steps" data-stagger="90">{steps}</ol></div></section>'''

    srows = ''.join(f'<a class="row" href="services/#{s["id"]}"><span>{esc(s["title"])}</span><i class="arrow-c">{ARROW}</i></a>' for s in SERVICES)
    small = [a for s in SERVICES for a in s['asks'][:3]][:23]
    asks = ''.join(f'<li>{esc(a)}</li>' for a in small) + f'<li><a href="start/?need=unsure">Don\'t see it? Ask us →</a></li>'
    serv = f'''<section class="sec" id="services" style="padding-top:0"><div class="wrap">
  <div class="sh"><div><p class="eyebrow" data-r="fade">Services</p><h2 class="h2" data-r="words">What we can <span class="grad">design for you</span></h2></div>
  <div class="sh-r" data-r>{pill('See all services', 'services/', 'pill-ghost')}</div></div>
  <div class="rows" data-stagger="45">{srows}</div><ul class="asks-list" data-r>{asks}</ul></div></section>'''

    page('', 'home', hero + logos + film + marquee + need + work + two + story + who + reviews + why + large + how + serv + close_cta(base), body_class='home')


# ── SERVICES ──────────────────────────────────────────────────────────────
def services():
    base = '../'
    jump = ''.join(f'<a class="pf" href="#{s["id"]}">{esc(s["title"])}</a>' for s in SERVICES)
    intro = f'''<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>What we can design for you</p>
  <h1 class="h1" data-r="words" data-intro>Whatever you need designed, <span class="grad">just ask.</span></h1>
  <p class="lead" data-r data-intro data-d=".3">Big project or small, brand new or a refresh. If it needs to look good, it's something we can talk about. Jump to what you need:</p>
  <div class="pills" data-r data-intro data-d=".4">{jump}</div>
  <div class="unsure" data-r><div><h2 class="h3">Not sure what you need?</h2><p>That's a very normal place to start. Tell us your idea in your own words and we'll work out the rest together.</p></div>
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
  <div class="svc-body" data-r><h3 class="eyebrow">What people ask us for</h3><ul class="asks">{asks}</ul>{prod}{pill(esc(s['cta']), f"{base}start/?need={s['need']}")}</div></div>
  <div class="mini-row" data-r>{cards}</div></div></section>''')
    page('services/', 'services', intro + ''.join(groups) + close_cta(base, "Don't see it? <span class=\"grad\">Ask anyway.</span>", "Other creative requests are welcome. Tell us what you have in mind.", label='Tell Us What You Need'), body_class='services')


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
    page(f'work/{slug}/', 'work', body, title=f"{p['title']} | {BRAND}", desc=f"{p['plain']}. {p['summary']}"[:300], body_class='project')


# ── ABOUT ─────────────────────────────────────────────────────────────────
def about():
    base = '../'
    steps = ''.join(f'<li><span class="n grad">{i + 1:02d}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    why = ''.join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in WHY)
    body = f'''<section class="ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>About {BRAND}</p>
  <h1 class="h1" data-r="words" data-intro>We help ideas look like <span class="grad">they deserve to be seen.</span></h1></div></section>
<section class="sec" style="padding-bottom:70px"><div class="wrap about-grid"><h2 class="h3" data-r>Who we are</h2>
  <div class="prose" data-r data-d=".1"><p>{BRAND} is a design studio. We help people turn their ideas into things that look professional, memorable and ready to be seen: logos, flyers, social media graphics, websites, campaigns, vehicle branding and more.</p>
  <p>We work with individuals, small businesses, churches, organizations and companies. We're based in Canada and work with people around the world. Some of what we do is big and some of it is one flyer. We treat them with the same care.</p></div></div></section>
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
    body = f'''<section class="ph blog-ph"><div class="wrap blog-hd"><h1 class="h1" data-r="words" data-intro><span class="grad">Our</span> Blog</h1>
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
    page(f'blog/{b["slug"]}/', 'blog', body, title=f"{b['title']} | {BRAND}", desc=b['excerpt'], body_class='blog')



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
        body = f'''<section class="ph post-ph"><div class="wrap"><p class="eyebrow" data-r="fade" data-intro>Legal</p>
  <h1 class="h1" data-r="words" data-intro>{esc(pg['title'])}</h1>
  <p class="lead" data-r data-intro data-d=".3">{esc(pg['intro'])}</p><p class="post-meta">Last updated: {LEGAL_UPDATED}</p></div></section>
<div class="wrap post-body">{''.join(parts)}</div>
{close_cta(base, "Questions? <span class=\"grad\">Just ask.</span>")}'''
        page(f"{pg['slug']}/", 'home', body, title=f"{pg['title']} | {BRAND}", desc=pg['intro'], body_class='legal')



# ── START ─────────────────────────────────────────────────────────────────
def start():
    base = '../'
    budgets = ''.join(f'<label class="pick"><input type="radio" name="budget" value="{esc(b)}"><span>{esc(b)}</span></label>' for b in BUDGETS)
    picks = ''.join(f'<label class="pick"><input type="checkbox" name="need" value="{k}"><span>{esc(t)}</span></label>' for k, t in NEEDS)
    arc = ''.join(f'<i style="background-image:url({base}img/people/{n:02d}-560.webp);background-size:230% auto;background-position:50% 9%"></i>' for n in HERO_FACES)
    body = f"""<section class="talk"><div class="wrap">
  <div class="talk-head">
    <div class="arc" aria-hidden="true" data-r="fade" data-intro>{arc}</div>
    <p class="nrf" data-r data-intro data-d=".1">Not sure how to put it? <b>Messy is fine.</b></p>
    <h1 class="big" data-r="words" data-intro data-d=".15">Let's <span class="grad">talk!</span></h1>
    <p class="talk-sub" data-r data-intro data-d=".35">Share what you're working on here, or send us an email at <a href="mailto:{SITE['email']}">{SITE['email']}</a>. A few words is plenty.</p>
  </div>
  <form id="start-form" class="tform" action="{SITE['formspree']}" method="POST" novalidate data-r data-intro data-d=".45">
    <input type="hidden" name="_subject" value="New project enquiry from the {BRAND} website">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
    <div class="f"><label for="f-name">Name &amp; company</label><input id="f-name" name="name" type="text" autocomplete="name" placeholder="Your name, and your business if you have one" required></div>
    <div class="f-row">
      <div class="f"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
      <div class="f"><label for="f-phone">Phone or WhatsApp <em>(optional)</em></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+1 555 555 5555"></div>
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
  <div class="or" data-r><span>or</span></div>
  <div class="alt" data-r><a class="alt-card" href="mailto:{SITE['email']}"><small>Email us</small><b>{SITE['email']}</b><i class="arrow-c">{ARROW}</i></a>
    <a class="alt-card" href="{base}work/"><small>Not ready yet?</small><b>See what we've made</b><i class="arrow-c">{ARROW}</i></a></div>
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
    urls = ['', 'services/', 'work/', 'blog/', 'about/', 'start/', 'privacy/', 'cookies/', 'terms/'] + [f'work/{p["slug"]}/' for p in PROJECTS] + [f'blog/{b["slug"]}/' for b in POSTS]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        f'  <url><loc>{SITE["url"]}/{u}</loc></url>\n' for u in urls) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE["url"]}/sitemap.xml\n')


if __name__ == '__main__':
    home(); services(); work_index(); about(); start(); blog(); legal()
    for b in POSTS:
        blog_post(b)
    for p in PROJECTS:
        project(p)
    extras()
    import i18n
    n, miss = i18n.run(BUILT, SITE['url'])
    print('built', len(BUILT), 'English pages +', n, 'French pages, version', VERSION, '| untranslated strings:', miss)
