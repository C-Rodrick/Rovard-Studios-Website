# -*- coding: utf-8 -*-
"""Generate the ROVARD STUDIOS V2 static site into the repo root.

    python tools/build.py

Pages: / , /services/ , /work/ , /work/<slug>/ (x22) , /about/ , /start/ , 404.html , sitemap.xml , robots.txt
"""
import html, json, os, sys, time, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import *  # noqa

VERSION = time.strftime('%Y%m%d%H%M')
MANIFEST = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json')))
PROJECTS = load_projects()
BY = {p['slug']: p for p in PROJECTS}
LOGO_BLUE = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20Blue.svg'
LOGO_WHITE = 'assets/Combined%20Logo%20-%20Rovard%20Studios%20-%20White.svg'

esc = html.escape


def q(path):
    return urllib.parse.quote(path, safe='/')


# ── helpers ───────────────────────────────────────────────────────────────
def img(slug, idx, alt, base, sizes='100vw', cls='', eager=False, want=None):
    m = MANIFEST[slug][str(idx)]
    ws = m['sizes']
    srcset = ', '.join(f'{base}img/{slug}/{idx:02d}-{w}.webp {w}w' for w in ws)
    mid = next((w for w in ws if w >= (want or 1100)), ws[-1])
    wmax = ws[-1]
    h = round(m['h'] * wmax / m['w'])
    load = 'fetchpriority="high"' if eager else ('decoding="async"' if os.environ.get('NOLAZY') else 'loading="lazy" decoding="async"')
    c = f' class="{cls}"' if cls else ''
    return (f'<img{c} src="{base}img/{slug}/{idx:02d}-{mid}.webp" srcset="{srcset}" sizes="{sizes}" '
            f'width="{wmax}" height="{h}" alt="{esc(alt)}" {load}>')


def ref_img(ref, alt, base, **kw):
    slug, frag, _label = ref[:3]
    return img(slug, find_img(PROJECTS, slug, frag), alt, base, **kw)


def concept_chip(p):
    return '<span class="chip-concept">Concept</span>' if p['concept'] else ''


def head(title, desc, path, base, og_title=None):
    url = f"{SITE['url']}/{path}"
    canon = f'<link rel="canonical" href="{url}">'
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'ProfessionalService', 'name': BRAND, 'url': SITE['url'] + '/',
        'logo': f"{SITE['url']}/{LOGO_BLUE}", 'email': SITE['email'], 'areaServed': 'Worldwide',
        'description': META['home'][1],
    }, ensure_ascii=False)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F6F2EA">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
{canon}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{esc(og_title or title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE['url']}/assets/og-cover.jpg">
<meta property="og:image:alt" content="{BRAND}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}assets/rovard-mark.svg">
<link rel="preload" href="{base}css/fonts/Syne.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{base}css/fonts/SpaceGrotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}css/site.css?v={VERSION}">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">{ld}</script>
</head>'''


NAV = [('services', 'Services'), ('work', 'Work'), ('about', 'About'), ('start', 'Contact')]


def header(base, active):
    links = ''.join(f'<a href="{base}{k}/"{" aria-current=\"page\"" if k == active else ""}>{t}</a>' for k, t in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="container bar">
    <a class="logo" href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_BLUE}" alt="{BRAND}" width="150" height="57"></a>
    <nav class="nav" aria-label="Primary">{links}</nav>
    <a class="btn btn-primary btn-sm bar-cta" href="{base}start/">Start a Project</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
  </div>
  <div class="mobile-menu" id="menu" hidden>
    <nav class="container" aria-label="Mobile">{''.join(f'<a href="{base}{k}/">{t}</a>' for k, t in [('services','Services'),('work','Work'),('about','About'),('start','Contact')])}
      <a class="btn btn-yellow btn-lg" href="{base}start/">Start a Project</a></nav>
  </div>
</header>'''


def footer(base):
    return f'''<footer class="site-footer">
  <div class="container foot-grid">
    <div class="foot-brand">
      <a href="{base or './'}" aria-label="{BRAND} home"><img src="{base}{LOGO_BLUE}" alt="{BRAND}" width="170" height="65" loading="lazy"></a>
      <p>Whatever you're putting out there, we'll make it look right.</p>
      <a class="btn btn-primary" href="{base}start/">Start a Project</a>
    </div>
    <nav class="foot-col" aria-label="Footer">
      <h2>Explore</h2>
      <a href="{base}services/">Services</a><a href="{base}work/">Work</a><a href="{base}about/">About</a><a href="{base}start/">Start a project</a>
    </nav>
    <div class="foot-col">
      <h2>Say hello</h2>
      <a href="mailto:{SITE['email']}">{SITE['email']}</a>
      <p>{SITE['location']}</p>
    </div>
  </div>
  <div class="container foot-base"><span>© {SITE['year']} {BRAND}. All rights reserved.</span><span>Concept projects are labelled Concept.</span></div>
</footer>
<a class="sticky-cta" href="{base}start/">Start a Project</a>'''


def page(path, key, body, active=None, title=None, desc=None, body_class='', scripts=''):
    depth = 0 if not path else path.count('/')
    base = '../' * depth
    t, d = (title, desc) if title else META[key]
    out = head(t, d or META[key][1], path, base) + f'''
<body class="{body_class}">
{header(base, active)}
<main id="main">
{body.replace('{{BASE}}', base)}
</main>
{footer(base)}
{scripts}<script src="{base}js/site.js?v={VERSION}" defer></script>
</body>
</html>
'''
    dest = os.path.join(ROOT, path, 'index.html') if path else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write(out)


def cta_band(base, headline, sub, label='Start a Project', href=None, dark=False):
    href = href or f'{base}start/'
    cls = 'cta-band dark' if dark else 'cta-band'
    return f'''<section class="{cls} reveal"><div class="container">
  <h2 class="h2">{headline}</h2><p class="lead">{sub}</p>
  <a class="btn {'btn-yellow' if dark else 'btn-primary'} btn-lg" href="{href}">{label}</a></div></section>'''


# ── HOME ──────────────────────────────────────────────────────────────────
def home():
    base = ''
    # hero stage
    stage, rot = [], []
    for n, wi in enumerate(HERO_ROTATION):
        verb, thing, fory, slug, frag, cap, need = WEDO[wi]
        idx = find_img(PROJECTS, slug, frag)
        stage.append(f'<figure class="stage-item{" is-on" if n == 0 else ""}">'
                     f'{img(slug, idx, cap, base, sizes="(min-width: 900px) 42vw, 92vw", eager=(n == 0), want=1100)}'
                     f'<figcaption>{esc(cap)}</figcaption></figure>')
        rot.append({'verb': verb, 'thing': thing, 'for': fory})
    first = rot[0]
    rotdata = esc(json.dumps(rot, ensure_ascii=False))
    all_things = ', '.join(w[1] for w in WEDO)
    hero = f'''<section class="hero container" aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="eyebrow">{BRAND}</p>
    <h1 id="hero-title" class="display">Whatever you're putting out there, we'll make it <mark>look right.</mark></h1>
    <p class="lead">{BRAND} designs logos, flyers, websites, billboards, vehicle branding and everything in between, for people, businesses, churches, organizations and events.</p>
    <div class="cta-row"><a class="btn btn-primary btn-lg" href="start/">Start a Project</a><a class="btn btn-ghost btn-lg" href="work/">See what we've made</a></div>
    <p class="hint">Need just one thing? That's fine. One flyer is a real project.</p>
    <p class="hero-we" data-rotator='{rotdata}'>
      <span class="sr-only">We design {all_things} for your ideas.</span>
      <span aria-hidden="true">We <span class="r-verb">{first['verb']}</span> <b class="r-thing">{first['thing']}</b> for your <span class="r-for">{first['for']}</span>.</span>
    </p>
  </div>
  <div class="hero-stage" role="group" aria-label="Examples of our work">{''.join(stage)}</div>
</section>'''

    need = '''<section class="section need" id="need"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">Start here</p><h2 class="h2">What do you need help with?</h2>
  <p class="lead">Pick the closest one. You can add more, or change your mind, on the next screen.</p></div>
  <ul class="chips reveal">''' + ''.join(
        f'<li><a class="chip{" chip-yellow" if k == "unsure" else ""}" href="start/?need={k}">{esc(t)}<span aria-hidden="true">→</span></a></li>' for k, t in NEEDS) + '''</ul>
  <p class="more reveal"><a class="link-arrow" href="services/">See everything we can design for you</a></p>
</div></section>'''

    # we do ___ for your ___
    rows, panel = [], []
    for i, (verb, thing, fory, slug, frag, cap, need_k) in enumerate(WEDO):
        sid = next((s['id'] for s in SERVICES if s['need'] == need_k), 'brand')
        if slug:
            idx = find_img(PROJECTS, slug, frag)
            panel.append(f'<figure class="wp-item{" is-on" if i == 0 else ""}" data-i="{i}">'
                         f'{img(slug, idx, cap, base, sizes="(min-width: 900px) 40vw, 0px", want=1100)}<figcaption>{esc(cap)}</figcaption></figure>')
        else:
            panel.append(f'<figure class="wp-item wp-soon" data-i="{i}"><div><b>Vehicle branding</b><span>Full wraps for cars, vans and delivery vehicles. Concept mockups coming soon.</span></div></figure>')
        rows.append(f'<li><a class="wedo-row" href="services/#{sid}" data-i="{i}">'
                    f'<span class="w-line">We {verb} <b>{thing}</b> for your {fory}.</span></a></li>')
    wedo = f'''<section class="section wedo sand" id="what-we-do"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">What we do</p><h2 class="h2">We design it. You put it out there.</h2>
  <p class="lead">A few of the things people ask us for. If it's not on the list, ask anyway.</p></div>
  <div class="wedo-grid">
    <ol class="wedo-list reveal">{''.join(rows)}</ol>
    <div class="wedo-panel" aria-hidden="true">{''.join(panel)}</div>
  </div>
  <p class="more reveal"><a class="link-arrow" href="services/">See everything we can design for you</a></p>
</div></section>'''

    # stories
    stories = []
    for n, slug in enumerate(HOME_STORIES):
        st, p = STORIES[slug], BY[slug]
        big, (a, b) = st['big'], st['small']
        flip = ''
        stories.append(f'''<article class="story reveal{flip}">
  <header class="story-head"><p class="eyebrow">{st['kicker']} {concept_chip(p)}</p>
    <h3 class="h3"><a href="work/{slug}/">{esc(p['title'])}</a></h3><p>{esc(st['line'])}</p>
    <a class="link-arrow" href="work/{slug}/">View the project</a></header>
  <div class="story-grid">
    <figure class="s-big"><span class="s-n">1</span>{ref_img(big, big[2], base, sizes='(min-width: 900px) 56vw, 92vw')}<figcaption>{esc(big[2])}</figcaption></figure>
    <figure class="s-a"><span class="s-n">2</span>{ref_img(a, a[2], base, sizes='(min-width: 900px) 30vw, 46vw', want=560)}<figcaption>{esc(a[2])}</figcaption></figure>
    <figure class="s-b"><span class="s-n">3</span>{ref_img(b, b[2], base, sizes='(min-width: 900px) 30vw, 46vw', want=560)}<figcaption>{esc(b[2])}</figcaption></figure>
  </div></article>''')
    work = f'''<section class="section work-home" id="work"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">Selected work</p><h2 class="h2">From an idea to the real world.</h2>
  <p class="lead">A design isn't finished until you can see where it goes. Here's what a few projects became.</p></div>
  {''.join(stories)}
  <div class="work-cta reveal"><p class="h4">Have something like this in mind?</p>
    <div class="cta-row"><a class="btn btn-primary btn-lg" href="start/">Tell us about it</a><a class="btn btn-ghost btn-lg" href="work/">See all {len(PROJECTS)} projects</a></div></div>
</div></section>'''

    aud = f'''<section class="section who" id="who"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">Who we work with</p><h2 class="h2">Big idea or small one, we're glad you're here.</h2>
  <p class="lead">You don't need to know design words. You just need something you want people to see.</p></div>
  <ul class="aud reveal">{''.join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in AUDIENCES)}</ul>
  <!-- photo-slot: optional editorial photography can be placed here later -->
</div></section>'''

    lf = ''.join(
        f'<figure class="lf-{i}">{ref_img(r, r[2], base, sizes="(min-width: 900px) 34vw, 92vw")}<figcaption>{esc(r[2])}</figcaption></figure>'
        for i, r in enumerate(LARGE_FORMAT))
    large = f'''<section class="section large dark" id="large-format"><div class="container large-grid">
  <div class="large-copy reveal"><p class="eyebrow">Billboards, banners and vehicles</p>
    <h2 class="h2">Your vehicle is already moving around the city. Make it work for you.</h2>
    <p class="lead">Not a small logo on a door. A design that works at the size of a billboard, a banner or a whole van, so people notice it and remember it.</p>
    <div class="cta-row"><a class="btn btn-yellow btn-lg" href="start/?need=vehicle">Get my vehicle branded</a><a class="btn btn-ghost-light btn-lg" href="services/#ads">Billboards and banners</a></div>
    <p class="hint">We design it and prepare the files. Printing and fitting are done by a printer or installer.</p></div>
  <div class="large-collage reveal">{lf}
    <div class="lf-soon"><b>Vehicles</b><span>Full wraps for cars, vans and delivery vehicles. Concept mockups coming soon.</span></div></div>
</div></section>'''

    steps = f'''<section class="section how" id="how"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">How it works</p><h2 class="h2">Simple, from the first message.</h2></div>
  <ol class="steps reveal">{''.join(f'<li><span class="n">{i + 1}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))}</ol>
  <p class="more reveal"><a class="btn btn-primary btn-lg" href="start/">Start a Project</a></p>
</div></section>'''

    why = f'''<section class="section why sand" id="why"><div class="container">
  <div class="section-head reveal"><p class="eyebrow">Why {BRAND}</p><h2 class="h2">Easy to talk to. Serious about the work.</h2></div>
  <ul class="why-grid reveal">{''.join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in WHY)}</ul>
</div></section>'''

    close = cta_band(base, "Have an idea? Let's make it real.", "Tell us what you're working on. A few words is plenty.", dark=True)
    page('', 'home', hero + need + wedo + work + aud + large + steps + why + close, body_class='home')


# ── SERVICES ──────────────────────────────────────────────────────────────
def services():
    base = '../'
    jump = ''.join(f'<li><a class="chip" href="#{s["id"]}">{esc(s["title"])}</a></li>' for s in SERVICES)
    intro = f'''<section class="page-hero container"><p class="eyebrow">What we can design for you</p>
  <h1 class="display-md">Whatever you need designed, just ask.</h1>
  <p class="lead">Big project or small, brand new or a refresh. If it needs to look good, it's something we can talk about. Jump to what you need:</p>
  <ul class="chips jump">{jump}</ul>
  <div class="unsure-box"><div><h2 class="h3">Not sure what you need?</h2><p>That's a very normal place to start. Tell us your idea in your own words and we'll work out the rest together.</p></div>
  <a class="btn btn-yellow btn-lg" href="{base}start/?need=unsure">I have an idea</a></div></section>'''
    groups = []
    for n, s in enumerate(SERVICES):
        asks = ''.join(f'<li>{esc(a)}</li>' for a in s['asks'])
        prod = f'<p class="prod-note">{esc(PRODUCTION_NOTE)}</p>' if s['production'] else ''
        strip = ''
        if s['work']:
            cards = ''.join(f'<a class="mini" href="{base}work/{w}/">{img(w, 0, BY[w]["title"], base, sizes="(min-width: 900px) 26vw, 46vw", want=560)}'
                            f'<span>{esc(BY[w]["title"])}{" · Concept" if BY[w]["concept"] else ""}</span></a>' for w in s['work'])
            strip = f'<div class="mini-row">{cards}</div>'
        else:
            strip = f'<div class="mini-row"><div class="mini soon"><b>{esc(s["title"])}</b><span>{esc(s.get("note", "Examples coming soon."))}</span></div></div>'
        groups.append(f'''<section class="svc{' sand' if n % 2 == 0 else ''}" id="{s['id']}"><div class="container">
  <div class="svc-grid">
    <div class="svc-head reveal"><p class="eyebrow">{n + 1:02d}</p><h2 class="h2">{esc(s['title'])}</h2><p class="svc-line">{esc(s['line'])}</p><p>{esc(s['intro'])}</p></div>
    <div class="svc-body reveal"><h3 class="small-h">What people ask us for</h3><ul class="asks">{asks}</ul>{prod}
      <a class="btn btn-primary btn-lg" href="{base}start/?need={s['need']}">{esc(s['cta'])}</a></div>
  </div>{strip}</div></section>''')
    end = cta_band(base, "Don't see it? Ask anyway.", "Other creative requests are welcome. Tell us what you have in mind.", 'Tell Us What You Need', dark=False)
    page('services/', 'services', intro + ''.join(groups) + end, active='services', body_class='services')


# ── WORK INDEX ────────────────────────────────────────────────────────────
def work_index():
    base = '../'
    chips = '<li><button class="chip is-on" data-filter="all" type="button">All <span class="count">%d</span></button></li>' % len(PROJECTS)
    for k, label in KIND.items():
        n = sum(1 for p in PROJECTS if p['kind'] == k)
        chips += f'<li><button class="chip" data-filter="{k}" type="button">{esc(label)} <span class="count">{n}</span></button></li>'
    cards = []
    for p in PROJECTS:
        cards.append(f'''<article class="wcard reveal" data-kind="{p['kind']}"><a class="wc-media" href="{p['slug']}/" aria-label="{esc(p['title'])}">
  {img(p['slug'], 0, p['title'], base, sizes='(min-width: 900px) 46vw, 92vw', want=1100)}{concept_chip(p)}</a>
  <div class="wc-meta"><h2 class="h4"><a href="{p['slug']}/">{esc(p['title'])}</a></h2><p>{esc(p['plain'])}</p><span class="kindtag">{esc(KIND[p['kind']])}</span></div></article>''')
    body = f'''<section class="page-hero container"><p class="eyebrow">Our work</p>
  <h1 class="display-md">Things we've made.</h1>
  <p class="lead">Logos, brands, websites, social graphics, packaging and films. Projects marked <span class="chip-concept inline">Concept</span> are self-initiated and fictional. Click any project to see it up close.</p>
  <ul class="chips filters" role="group" aria-label="Filter projects">{chips}</ul></section>
<section class="container work-grid" id="grid">{''.join(cards)}</section>
{cta_band(base, "Have something like this in mind?", "Tell us what you're working on. We'll take it from there.", 'Start a Project')}'''
    page('work/', 'work', body, active='work', body_class='work')


# ── PROJECT PAGES ─────────────────────────────────────────────────────────
KIND_NEED = {'brand': 'brand', 'web': 'website', 'social': 'design', 'print': 'packaging', 'motion': 'media'}


def related(p, n=3):
    same = [x for x in PROJECTS if x['kind'] == p['kind'] and x['slug'] != p['slug']]
    i = next(k for k, x in enumerate(PROJECTS) if x['slug'] == p['slug'])
    rest = PROJECTS[i + 1:] + PROJECTS[:i]
    pick = same[:n]
    for x in rest:
        if len(pick) >= n:
            break
        if x not in pick and x['slug'] != p['slug']:
            pick.append(x)
    return pick[:n]


def project(p):
    base = '../../'
    slug = p['slug']
    facts = []
    if p.get('client'): facts.append(('Client', p['client']))
    if p.get('industry'): facts.append(('Industry', p['industry']))
    if p.get('type'): facts.append(('Project type', p['type']))
    facts.append(('What we did', p['services']))
    facts.append(('Year', p['year']))
    dl = ''.join(f'<div><dt>{k}</dt><dd>{esc(str(v))}</dd></div>' for k, v in facts)
    note = ''
    if p['concept']:
        note = f'<p class="concept-note"><span class="chip-concept">Concept</span> A self-initiated project. It was made to show what {BRAND} can do, not for a paying client.</p>'
    story = ''
    if slug in STORIES:
        st = STORIES[slug]
        big, (a, b) = st['big'], st['small']
        story = f'''<section class="proj-story container reveal"><h2 class="h3">From idea to the real world</h2>
  <div class="story-grid"><figure class="s-big"><span class="s-n">1</span>{ref_img(big, big[2], base, sizes='(min-width: 900px) 56vw, 92vw')}<figcaption>{esc(big[2])}</figcaption></figure>
  <figure class="s-a"><span class="s-n">2</span>{ref_img(a, a[2], base, sizes='(min-width: 900px) 30vw, 46vw', want=560)}<figcaption>{esc(a[2])}</figcaption></figure>
  <figure class="s-b"><span class="s-n">3</span>{ref_img(b, b[2], base, sizes='(min-width: 900px) 30vw, 46vw', want=560)}<figcaption>{esc(b[2])}</figcaption></figure></div></section>'''
    vids = ''
    if p['vids']:
        items = ''
        for v in p['vids']:
            poster = f' poster="{base}{q(v["poster"])}"' if v['poster'] else ''
            cap = f'<h3 class="h4">{esc(v["title"])}</h3>' if v['title'] else ''
            items += f'<figure class="vid">{cap}<video controls preload="none" playsinline{poster}><source src="{base}{q(v["src"])}" type="video/mp4"></video></figure>'
        vids = f'<section class="proj-videos container reveal"><h2 class="h3">Watch</h2><div class="vid-grid">{items}</div></section>'
    live = ''
    if p['live']:
        live = f'<p class="live reveal"><a class="btn btn-yellow btn-lg" href="{base}{q(p["live"])}" target="_blank" rel="noopener">{esc(p["live_label"])} <span aria-hidden="true">↗</span></a></p>'
    n_img = len(p['srcs'])
    gal = ''
    full_idx = range(1, n_img)  # cover (idx 0) is shown as hero; gallery = rest
    items = ''.join(
        f'<button class="g-item" type="button" data-full="{base}img/{slug}/{i:02d}-{MANIFEST[slug][str(i)]["sizes"][-1]}.webp" data-alt="{esc(p["title"])} image {i}">'
        f'{img(slug, i, f"{p["title"]} image {i}", base, sizes="(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 92vw", want=560)}</button>' for i in full_idx)
    if items:
        gal = f'<section class="proj-gallery container"><h2 class="h3">The work</h2><div class="g-grid">{items}</div></section>'
    rel = ''.join(f'''<article class="wcard"><a class="wc-media" href="{base}work/{x['slug']}/" aria-label="{esc(x['title'])}">{img(x['slug'], 0, x['title'], base, sizes='(min-width: 900px) 30vw, 92vw', want=560)}{concept_chip(x)}</a>
  <div class="wc-meta"><h3 class="h4"><a href="{base}work/{x['slug']}/">{esc(x['title'])}</a></h3><p>{esc(x['plain'])}</p></div></article>''' for x in related(p))
    body = f'''<section class="proj-head container"><a class="back" href="{base}work/">← All work</a>
  <p class="eyebrow">{esc(KIND[p['kind']])} {concept_chip(p)}</p>
  <h1 class="display-md">{esc(p['title'])}</h1><p class="lead">{esc(p['plain'])}.</p>{note}
  <dl class="facts">{dl}</dl></section>
<section class="proj-hero container">{img(slug, 0, p['title'], base, sizes='(min-width: 1320px) 1240px, 94vw', eager=True, want=1600, cls='hero-img')}</section>
<section class="proj-body container reveal"><div class="pb-grid">
  <div><h2 class="small-h">The challenge</h2><p>{esc(p['challenge'])}</p></div>
  <div><h2 class="small-h">What we did</h2><p>{esc(p['approach'])}</p></div>
  <div><h2 class="small-h">What was made</h2><p>{esc(p['made'])}</p></div></div>{live}</section>
{story}{vids}{gal}
{cta_band(base, "Have something like this in mind?", "Tell us what you're working on. A few words is plenty.", 'Start a Project', href=f"{base}start/?need={KIND_NEED[p['kind']]}")}
<section class="section more-proj"><div class="container"><h2 class="h3">More projects</h2><div class="rel-grid">{rel}</div></div></section>
<div class="lightbox" hidden role="dialog" aria-modal="true" aria-label="Image viewer"><button class="lb-close" type="button" aria-label="Close">×</button>
  <button class="lb-nav lb-prev" type="button" aria-label="Previous image">←</button><img alt=""><button class="lb-nav lb-next" type="button" aria-label="Next image">→</button><span class="lb-count"></span></div>'''
    title = f"{p['title']} | {BRAND}"
    desc = f"{p['plain']}. {p['summary']}"[:300]
    page(f'work/{slug}/', 'work', body, active='work', title=title, desc=desc, body_class='project')


# ── ABOUT ─────────────────────────────────────────────────────────────────
def about():
    base = '../'
    steps = ''.join(f'<li><span class="n">{i + 1}</span><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for i, (t, d) in enumerate(STEPS))
    why = ''.join(f'<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>' for t, d in WHY)
    body = f'''<section class="page-hero container"><p class="eyebrow">About {BRAND}</p>
  <h1 class="display-md">We help ideas look like they deserve to be seen.</h1></section>
<section class="section container about-who reveal"><div class="two"><h2 class="h3">Who we are</h2>
  <div class="prose"><p>{BRAND} is a design studio. We help people turn their ideas into things that look professional, memorable and ready to be seen: logos, flyers, social media graphics, websites, campaigns, vehicle branding and more.</p>
  <p>We work with individuals, small businesses, churches, organizations and companies. We're based in Canada and work with people around the world. Some of what we do is big and some of it is one flyer. We treat them with the same care.</p></div></div></section>
<section class="section sand"><div class="container two about-vm reveal"><div><p class="eyebrow">Our vision</p>
  <p class="statement">A world where anyone with a good idea can put it out there looking as good as it deserves.</p></div>
  <div><p class="eyebrow">Our mission</p><p class="statement sm">To make professional design easy to ask for, by bringing together creativity, careful design, technology and honest collaboration, and by giving every request, big or small, the same care.</p></div></div></section>
<section class="section container reveal"><div class="section-head"><p class="eyebrow">How we work</p><h2 class="h2">Simple, from the first message.</h2></div><ol class="steps">{steps}</ol></section>
<section class="section sand"><div class="container reveal"><div class="section-head"><p class="eyebrow">Why {BRAND}</p><h2 class="h2">Easy to talk to. Serious about the work.</h2></div><ul class="why-grid">{why}</ul></div></section>
{cta_band(base, "Let's work together.", "Tell us what you're working on. A few words is plenty.", 'Start a Project', dark=True)}'''
    page('about/', 'about', body, active='about', body_class='about')


# ── START ─────────────────────────────────────────────────────────────────
def start():
    base = '../'
    chips = ''.join(
        f'<label class="pick"><input type="checkbox" name="need" value="{k}"><span>{esc(t)}</span></label>' for k, t in NEEDS)
    body = f'''<section class="page-hero container start-hero"><p class="eyebrow">Start a project</p>
  <h1 class="display-md">Tell us what you're working on.</h1>
  <p class="lead">No brief needed. A few words is plenty. We'll take it from there.</p></section>
<section class="container start-wrap">
  <form id="start-form" class="start-form" action="{SITE['formspree']}" method="POST" novalidate>
    <input type="hidden" name="_subject" value="New project enquiry from the {BRAND} website">
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="trap" aria-hidden="true">
    <ol class="progress" aria-hidden="true"><li class="on"><i>1</i> What you need</li><li><i>2</i> Your idea</li><li><i>3</i> How to reach you</li></ol>
    <fieldset class="step is-on" data-step="1"><legend class="h3">What do you need?</legend>
      <p class="hint">Tick everything that applies.</p><div class="picks">{chips}</div></fieldset>
    <fieldset class="step" data-step="2"><legend class="h3">Tell us a little about it.</legend>
      <label class="field"><span>What's the idea?</span><textarea name="idea" rows="6" placeholder="For example: I'm starting a bakery and need a logo and a flyer for the opening. Messy is fine."></textarea></label>
      <label class="field"><span>A link to anything that helps (optional)</span><input type="url" name="link" placeholder="https://"></label></fieldset>
    <fieldset class="step" data-step="3"><legend class="h3">How can we reach you?</legend>
      <label class="field"><span>Your name</span><input type="text" name="name" autocomplete="name" required></label>
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="field"><span>Phone or WhatsApp (optional)</span><input type="tel" name="phone" autocomplete="tel"></label>
      <label class="field"><span>Is there a date you need it by? (optional)</span><input type="text" name="deadline" placeholder="For example: end of next month"></label></fieldset>
    <p class="form-error" role="alert" aria-live="assertive"></p>
    <div class="form-actions"><button type="button" class="btn btn-ghost" data-back hidden>← Back</button>
      <button type="button" class="btn btn-primary btn-lg" data-next>Continue</button>
      <button type="submit" class="btn btn-primary btn-lg" data-submit>Send it to us</button></div>
    <p class="hint small">Prefer email? <a href="mailto:{SITE['email']}">{SITE['email']}</a></p>
  </form>
  <div class="form-done" hidden><h2 class="h2">Thank you. We've got it.</h2><p class="lead">We'll read what you sent and get back to you.</p>
    <a class="btn btn-primary btn-lg" href="{base}work/">See some of our work</a></div>
</section>'''
    page('start/', 'start', body, active='start', body_class='start')


# ── 404, sitemap, robots ──────────────────────────────────────────────────
def extras():
    open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8').write(f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | {BRAND}</title><meta name="robots" content="noindex">
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#F6F2EA;color:#17140F;font-family:system-ui,sans-serif;text-align:center;padding:24px}}
h1{{font-size:clamp(2.2rem,6vw,4rem);margin:0 0 12px}}p{{margin:0 0 24px;color:#6B655A;font-size:1.1rem}}a{{display:inline-block;background:#162DAF;color:#fff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:600}}</style></head>
<body><main><h1>That page isn't here.</h1><p>But we can help you find what you need.</p><a id="home" href="/">Back to {BRAND}</a></main>
<script>var p=location.pathname.split('/');document.getElementById('home').href=(location.hostname.indexOf('github.io')>-1?'/'+p[1]:'')+'/';</script></body></html>''')
    urls = ['', 'services/', 'work/', 'about/', 'start/'] + [f'work/{p["slug"]}/' for p in PROJECTS]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        f'  <url><loc>{SITE["url"]}/{u}</loc></url>\n' for u in urls) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE["url"]}/sitemap.xml\n')


if __name__ == '__main__':
    home(); services(); work_index(); about(); start()
    for p in PROJECTS:
        project(p)
    extras()
    print('built', 5 + len(PROJECTS), 'pages, version', VERSION)
