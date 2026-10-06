# -*- coding: utf-8 -*-
"""ROVARD STUDIOS V2 — all site copy and project enrichment in one place.

Voice rules: warm, plain, direct. No invented clients, awards, statistics or results.
The written brand name is always ROVARD STUDIOS.
"""
import json, os, re, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = 'ROVARD STUDIOS'
SITE = {
    'url': 'https://rovardstudios.com',          # change in one place if the final domain differs
    'email': 'hello@rovardstudios.com',
    'whatsapp': '15878936078',     # digits only with country code, e.g. 15145550123. Empty = no WhatsApp button
    'booking': '',      # full URL of your booking page (Calendly, Cal.com...). Empty = no "Book a call"
    'plausible': '',    # your site domain as set up in Plausible, e.g. rovardstudios.com. Empty = no analytics
    'location': 'Canada · Worldwide',
    'formspree': 'https://formspree.io/f/xvkgepeo',
    'year': 2026,
}

# ── "What do you need help with?" ─────────────────────────────────────────
NEEDS = [
    ('brand', 'A logo or a whole brand'),
    ('design', 'A flyer, poster or invitation'),
    ('social', 'Social media graphics'),
    ('website', 'A website or landing page'),
    ('ads', 'A billboard, banner or sign'),
    ('vehicle', 'My vehicle branded'),
    ('print', 'Business cards or stationery'),
    ('docs', 'A presentation or document'),
    ('packaging', 'Packaging'),
    ('media', 'Photo or video editing'),
    ('unsure', "I'm not sure. I just have an idea."),
]

# ── Services (what we can design for you) ─────────────────────────────────
PRODUCTION_NOTE = ("We design it and prepare print-ready files. Printing and production are done by a printer "
                   "or installer, and we're happy to point you in the right direction.")

SERVICES = [
    dict(id='brand', need='brand', title='Logos & brands', kind='brand',
         line="Starting something? Let's give it a proper face.",
         intro="A logo is where it starts. We also make the colours, the lettering and the look that make your idea feel like a real brand, and we write it all down so you can keep it consistent.",
         asks=['Logo design', 'Brand refresh', 'Personal branding', 'Business branding', 'Brand guidelines', 'Business cards',
               'Letterheads and envelopes', 'Company stationery', 'Social media profile and banner designs', 'Company profiles', 'Brand assets and templates'],
         production=True, cta="Need this? Let's talk.",
         work=['linkrithm', 'design-eigen', 'vita-house']),
    dict(id='design', need='design', title='Flyers, posters & invitations', kind='social',
         line="Need a flyer? We've got you.",
         intro="You don't need a big project to come to us. One flyer, one poster, one invitation is a real job and we're glad to do it.",
         asks=['Flyers', 'Event flyers', 'Posters', 'Invitations', 'Brochures', 'Catalogues', 'Menus', 'Certificates',
               'Church and ministry graphics', 'Campaign and promotional graphics', 'Announcement graphics', 'Presentation graphics'],
         production=True, cta="Need a flyer? Let's talk.",
         work=['dress-doctor', 'pdoca', 'kymela-2026']),
    dict(id='social', need='social', title='Social media graphics', kind='social',
         line="Posts people actually stop for.",
         intro="One post or a whole month of them. We make graphics that look like they belong together, so your page looks like a proper brand.",
         asks=['Social media posts', 'Instagram, Facebook and LinkedIn graphics', 'YouTube thumbnails', 'Launch and promotional campaigns',
               'Templates you can reuse', 'Social media branding', 'Event campaigns'],
         production=False, cta="Need this? Let's talk.",
         work=['shorteeme', 'gce-study-app', 'pdoca']),
    dict(id='website', need='website', title='Websites & apps', kind='web',
         line="A website people can actually understand.",
         intro="For a business, an organization or just you. We design the pages, and build them so they work well on a phone.",
         asks=['Business websites', 'Personal and portfolio websites', 'Organization websites', 'Landing pages', 'Website design',
               'Website development', 'App and mobile screens (UI)', 'Email graphics', 'Digital advertisements'],
         production=False, cta="Need a website? Let's talk.",
         work=['mason-and-rowe-residences', 'northstar-capital-website', 'afaa-pay']),
    dict(id='ads', need='ads', title='Billboards, banners & signs', kind='brand',
         line="Big, bold and hard to miss.",
         intro="Anything that has to be read from across the road or across the room. We make the design to the right size and shape for where it's going.",
         asks=['Billboards', 'Outdoor advertising', 'Posters', 'Banners', 'Roll-up banners', 'Shop and building signage', 'Directional signs',
               'Event backdrops', 'Stage branding', 'Wall and office branding'],
         production=True, cta="Need this? Let's talk.",
         work=['green-blueprint', 'linkrithm', 'bitefort']),
    dict(id='vehicle', need='vehicle', title='Vehicle branding', kind='brand',
         line="Your vehicle is already moving around the city. Make it work for you.",
         intro="Not a small logo on a door. A full design that wraps the whole vehicle, so people notice it and remember it.",
         asks=['Full vehicle wraps', 'Cars', 'Vans', 'Delivery vehicles', 'Company and commercial vehicles'],
         production=True, cta="Want your vehicle to look like this?",
         work=[], note="Vehicle mockups are coming soon."),
    dict(id='docs', need='docs', title='Presentations & documents', kind='brand',
         line="Make the important papers look important.",
         intro="The things people read, sign or present from. We make them clear, tidy and good-looking.",
         asks=['Pitch decks', 'Presentations', 'Company profiles', 'Proposals', 'Reports and publications', 'CV and resume design',
               'Digital brochures', 'Certificates', 'Professional documents'],
         production=False, cta="Need this? Let's talk.",
         work=['vita-house', 'northstar-capital', 'mason-and-rowe']),
    dict(id='packaging', need='packaging', title='Packaging', kind='print',
         line="Something people want to pick up.",
         intro="Pouches, boxes, labels and book covers. We design how your product looks on the shelf, from the logo to the last detail.",
         asks=['Product packaging', 'Labels', 'Pouches and boxes', 'Book covers'],
         production=True, cta="Need this? Let's talk.",
         work=['jojo-foods', 'book-cover-design']),
    dict(id='media', need='media', title='Photo & video', kind='motion',
         line="Make it look right on screen.",
         intro="Photos that need a clean-up, videos that need cutting together, or a short animated piece to launch something.",
         asks=['Photo editing and retouching', 'Image enhancement', 'Video editing', 'Motion graphics', 'Short promotional videos'],
         production=False, cta="Need this? Let's talk.",
         work=['rovard-studios-brand-film', 'northstar-capital-ad', 'proxima-exchange-films']),
]

# ── Home: "We do ___ for your ___" ────────────────────────────────────────
# (verb, thing, for-your, project slug, filename-fragment, caption, need)
WEDO = [
    ('design', 'logos', 'new business', 'design-eigen', 'imgi_200', 'Logo, Design Eigen', 'brand'),
    ('create', 'flyers', 'next event', 'dress-doctor', 'BOOK PICKUP_DD.jpg', 'Flyer, Dress Doctor', 'design'),
    ('design', 'social media graphics', 'brand', 'shorteeme', 'Make something amazing', 'Social post, ShorteeMe', 'social'),
    ('build', 'websites', 'business, organization or personal brand', 'mason-and-rowe-residences', 'mr-ui-04-home', 'Website design, Mason & Rowe Residences', 'website'),
    ('design', 'business cards and stationery', 'company', 'linkrithm', 'gallery-02', 'Business cards, LinkRithm', 'print'),
    ('design', 'billboards and banners', 'campaign', 'green-blueprint', 'Cover 7 - Copy', 'Billboard mockup, Green Blueprint', 'ads'),
    ('brand', 'vehicles', 'business', None, None, None, 'vehicle'),
    ('design', 'presentations and documents', 'big idea', 'northstar-capital', 'northstar-brand-02-strategy', 'Brand guidelines, Northstar Capital', 'docs'),
    ('design', 'packaging', 'product', 'jojo-foods', None, 'Packaging, JoJo Foods', 'packaging'),
    ('edit', 'photos and videos', 'launch', 'rovard-studios-brand-film', 'film-09', 'Film, ROVARD STUDIOS', 'media'),
]
HERO_ROTATION = [0, 1, 3, 4, 5, 8]          # indices into WEDO that have an image

# ── Idea → design → application stories (only where we have the material) ──
STORIES = {
    'linkrithm': dict(
        kicker='Brand identity', line='From a logo to a business card, a building and a phone.',
        big=('linkrithm', 'gallery-09', 'The logo'),
        small=[('linkrithm', 'gallery-02', 'On business cards'), ('linkrithm', 'gallery-06', 'On a building')]),
    'green-blueprint': dict(
        kicker='Brand identity', line='From a logo on a hard hat to a billboard and a banner.',
        big=('green-blueprint', 'Cover 1.jpg', 'The logo, on a hard hat'),
        small=[('green-blueprint', 'Cover 7 - Copy', 'On a billboard'), ('green-blueprint', 'Cover 6.2', 'On a roll-up banner')]),
    'mason-and-rowe-residences': dict(
        kicker='Website design', line='From the homepage to a phone and a booking flow.',
        big=('mason-and-rowe-residences', 'mr-ui-04-home', 'The homepage'),
        small=[('mason-and-rowe-residences', 'mr-ui-09-mobile', 'On a phone'), ('mason-and-rowe-residences', 'mr-ui-08-viewing', 'Booking a viewing')]),
    'design-eigen': dict(
        kicker='Brand identity', line='From a logo to an ID card and a T-shirt.',
        big=('design-eigen', 'imgi_200', 'The logo'),
        small=[('design-eigen', 'ID Card', 'On an ID card'), ('design-eigen', 'Tshirt Mockup', 'On a T-shirt')]),
}
HOME_STORIES = ['linkrithm', 'green-blueprint', 'mason-and-rowe-residences']

LARGE_FORMAT = [
    ('green-blueprint', 'Cover 7 - Copy', 'Billboard mockup, Green Blueprint'),
    ('green-blueprint', 'Cover 6.2', 'Roll-up banner mockup, Green Blueprint'),
    ('linkrithm', 'gallery-06', 'Building billboard mockup, LinkRithm'),
]

AUDIENCES = [
    ('Individuals & personal brands', 'A logo, a sharp profile, a CV that gets noticed.'),
    ('Small businesses & startups', 'From your very first logo to the sign above the shop.'),
    ('Established companies', 'A fresh look, a campaign, a website that finally explains what you do.'),
    ('Churches & ministries', 'Event graphics, banners, backdrops and announcements.'),
    ('Organizations & institutions', 'Programs, reports, certificates and campaigns.'),
    ('Events', 'Flyers, invitations, signage, stage and social.'),
    ('Creators & professionals', 'Thumbnails, portfolios, decks and personal sites.'),
    ('Anyone with an idea', "Not sure what you need? Start right there."),
]

STEPS = [
    ('You tell us what you need.', "In your own words. No design brief needed."),
    ('We make sure we get it.', "We ask a few simple questions so we understand the idea."),
    ('We create.', "You'll see real design, not just a description of one."),
    ('We refine it with you.', "Your feedback shapes it until it's right."),
    ("You get something you're proud of.", "Ready to put out there, with the files you need."),
]

WHY = [
    ('You can talk to us like a person.', "Tell us what you're trying to do, in whatever words you have."),
    ('No project is too small.', "One flyer, one logo, one card. They all count here."),
    ('We think about where it will live.', "A design isn't finished until it works on the phone, the poster, the wall and the vehicle."),
]

# ── Page meta ─────────────────────────────────────────────────────────────
META = {
    'home': (f"{BRAND} | Logos, flyers, websites & more for your ideas",
             f"{BRAND} designs logos, flyers, websites, billboards, vehicle branding and more for people, businesses, churches, organizations and events. Tell us what you need."),
    'services': (f"What we can design for you | {BRAND}",
                 f"Logos, flyers, social media graphics, websites, billboards, banners, vehicle branding, presentations, packaging, photo and video. See what {BRAND} can design for you."),
    'work': (f"Our work | {BRAND}",
             f"Logos, brand identities, websites, social media graphics, packaging and films made by {BRAND}."),
    'blog': (f"Blog | {BRAND}", f"Plain advice from {BRAND}: how to brief a designer, what a flyer needs, logo or full brand, and more."),
    'pricing': (f"Pricing | {BRAND}", f"What each kind of project with {BRAND} usually includes, how quotes work, and answers to common questions."),
    'about': (f"About | {BRAND}",
              f"{BRAND} helps people turn their ideas into things that look professional, memorable and ready to be seen."),
    'start': (f"Start a project | {BRAND}",
              f"Tell {BRAND} what you're working on. A few words is plenty. We'll take it from there."),
}

# ── Projects ──────────────────────────────────────────────────────────────
def slugify(t):
    t = t.lower().replace('&', 'and').replace("'", '')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

KIND = {  # filter groups on /work
    'brand': 'Logos & brands', 'web': 'Websites & apps', 'social': 'Social & flyers',
    'print': 'Packaging & print', 'motion': 'Video & motion',
}
PROJECT_KIND = {
    'green-blueprint': 'brand', 'design-eigen': 'brand', 'bitefort': 'brand', 'linkrithm': 'brand', 'vita-house': 'brand',
    'northstar-capital': 'brand', 'mason-and-rowe': 'brand',
    'shorteeme': 'social', 'kymela-2026': 'social', 'pdoca': 'social', 'dress-doctor': 'social', 'gce-study-app': 'social',
    'proxima-exchange': 'web', 'afaa-pay': 'web', 'vita-house-care': 'web', 'northstar-capital-website': 'web',
    'mason-and-rowe-residences': 'web',
    'book-cover-design': 'print', 'jojo-foods': 'print',
    'proxima-exchange-films': 'motion', 'rovard-studios-brand-film': 'motion', 'northstar-capital-ad': 'motion',
}
PLAIN = {
    'green-blueprint': 'Logo and brand look for an eco-friendly construction company',
    'design-eigen': 'Logo and brand refresh for a branding agency',
    'bitefort': 'Brand identity for a privacy software company',
    'linkrithm': 'Brand identity for an engineering platform',
    'vita-house': 'Brand identity for a fictional preventative health company',
    'northstar-capital': 'Brand identity for a fictional small-business finance app',
    'mason-and-rowe': 'Brand identity for a fictional luxury home developer',
    'shorteeme': 'Social media graphics for a financing brand',
    'kymela-2026': 'Wedding invitation and save-the-date graphics',
    'pdoca': 'Event flyers and social posts for a coaching academy',
    'dress-doctor': 'Promotional flyers for a laundry service',
    'gce-study-app': 'Launch graphics for a study app',
    'proxima-exchange': 'Website design for a trading platform',
    'afaa-pay': 'Brand and working website for a payments company',
    'vita-house-care': 'Website and booking flow for a fictional health company',
    'northstar-capital-website': 'Website and dashboard for a fictional finance app',
    'mason-and-rowe-residences': 'Website for a fictional luxury home developer',
    'book-cover-design': 'Book cover design',
    'jojo-foods': 'Potato chip packaging',
    'proxima-exchange-films': 'Two launch films for a trading platform',
    'rovard-studios-brand-film': f'A 90-second film about {BRAND}',
    'northstar-capital-ad': 'A 30-second launch ad for a fictional finance app',
}
CONCEPT = {  # self-initiated / fictional, per the project's own existing wording
    'vita-house', 'northstar-capital', 'mason-and-rowe', 'proxima-exchange', 'afaa-pay', 'vita-house-care',
    'northstar-capital-website', 'mason-and-rowe-residences', 'proxima-exchange-films', 'northstar-capital-ad',
}
# Factual "what was made" lines. Replaces older wording that implied results we can't prove.
MADE = {
    'green-blueprint': "A logo and identity applied to a billboard, a roll-up banner, hard hats, ID cards, badges, wristbands, patterned paper and a shipping container.",
    'design-eigen': "A logo, colour palette, typography and a repeating pattern, applied to a gift box, business cards, an ID card and T-shirts.",
    'bitefort': "A purple identity built around a shield mark, applied to a wall sign, a banner flag, wristbands, a T-shirt, a leaflet and a mobile screen.",
    'linkrithm': "A logo and identity system applied to business cards, stationery, apparel, an expo stand, a building billboard, a laptop screen and mobile app screens.",
    'shorteeme': "A set of social media graphics for campaigns, loans, fundraising and investors.",
    'kymela-2026': "Wedding invitation and save-the-date graphics.",
    'pdoca': "A set of flyers and social posts for online coaching sessions and events.",
    'dress-doctor': "Promotional flyers for free pickup, bulk washing and special offers.",
    'gce-study-app': "Launch and promotional graphics for the GCE Study App, including feature posts, a call for volunteers and a good-luck message.",
    'book-cover-design': "A book cover, shown in print mockups from early prototypes to final versions.",
    'jojo-foods': "A chip pouch design with a cream roundel logo, a red and orange sunburst, retro lettering and a clear window, shown in packaging mockups.",
    'rovard-studios-brand-film': f"A 90-second film with sound, built from the {BRAND} brand, services and selected work.",
}


def brandfix(v):
    """Write the brand name exactly as ROVARD STUDIOS wherever older project text used another form."""
    if isinstance(v, str):
        return re.sub(r'(?<![\w-])Rovar[dD](?:\s+Studios?)?(?![\w-])', BRAND, v, flags=re.I)
    if isinstance(v, list):
        return [brandfix(x) for x in v]
    if isinstance(v, dict):
        return {k: brandfix(x) if k not in ('coverImage', 'galleryImages', 'video', 'videos', 'poster', 'liveUrl') else x for k, x in v.items()}
    return v


def load_projects():
    raw = json.load(open(os.path.join(ROOT, 'tools', 'projects-raw.json'), encoding='utf-8'))
    out = []
    for p in raw:
        slug = slugify(p['title'])          # slug from the original title, before brand normalising
        p = brandfix(p)
        q = dict(p)
        q['slug'] = slug
        q['kind'] = PROJECT_KIND[slug]
        q['plain'] = PLAIN[slug]
        q['concept'] = slug in CONCEPT
        q['made'] = MADE.get(slug, p['outcome'])
        # normalise videos
        vids = []
        if p.get('videos'):
            vids = [dict(title=v['title'], src=urllib.parse.unquote(v['src']), poster=urllib.parse.unquote(v.get('poster', ''))) for v in p['videos']]
        elif p.get('video'):
            vids = [dict(title='', src=urllib.parse.unquote(p['video']), poster=urllib.parse.unquote(p.get('poster', '')))]
        q['vids'] = vids
        q['live'] = p.get('liveUrl')
        q['live_label'] = (p.get('liveLabel') or 'Explore the live site').replace(' ↗', '').strip()
        srcs = [urllib.parse.unquote(p['coverImage'])] + [urllib.parse.unquote(g) for g in p.get('galleryImages', [])]
        q['srcs'] = srcs
        out.append(q)
    return out


def _norm(t):
    return re.sub(r'[^a-z0-9]+', '', t.lower())


def find_img(projects, slug, fragment):
    """Index within a project (0 = cover, 1.. = gallery) whose source path contains fragment (spaces/punctuation ignored)."""
    p = next(x for x in projects if x['slug'] == slug)
    if fragment is None:
        return 0
    f = _norm(fragment)
    for i, s in enumerate(p['srcs']):
        if f in _norm(s):
            return i
    raise KeyError(f'{slug}: no image matching {fragment!r}')


# ── V2.1 (Orizon-feel restyle): extra home content ────────────────────────
MARQUEE = ['Logos', 'Flyers', 'Websites', 'Billboards', 'Vehicle branding', 'Social media graphics', 'Business cards', 'Packaging',
           'Presentations', 'Posters', 'Banners', 'Invitations', 'Brand guidelines', 'Photo editing', 'Motion graphics']

FEATURED = ['linkrithm', 'green-blueprint', 'mason-and-rowe-residences', 'shorteeme', 'design-eigen', 'jojo-foods',
            'northstar-capital-website', 'rovard-studios-brand-film']

TWO_WAYS = [
    dict(tag='Starting something new', title='Your new business, brand or idea',
         items=['A logo and a look that feels like a real brand', 'Business cards, letterheads and stationery',
                'Social media profile and banner designs', 'A simple website or landing page'],
         cta='Start a Project', href='start/?need=brand', img=('linkrithm', 'gallery-02')),
    dict(tag='Growing something bigger', title='Your campaign, event or next big push',
         items=['Flyers, posters and invitations', 'Billboards, banners and signage',
                'Vehicle branding for cars, vans and delivery vehicles', 'Presentations, decks and company profiles'],
         cta='Tell Us What You Need', href='start/?need=ads', img=('green-blueprint', 'Cover 7 - Copy')),
]

WHY_IMGS = [('green-blueprint', 'Cover 7 - Copy', '80% 40%'), ('linkrithm', 'gallery-13', '50% 22%'), ('design-eigen', 'Tshirt Mockup', '50% 38%')]  # + focal point shown when the card is narrow
AUD_PHOTOS = [('linkrithm', 'gallery-13'), ('shorteeme', None), ('green-blueprint', 'Cover 1.jpg')]
HERO_FACES = [1, 5, 6]  # people photos used as the small round avatars (illustrative, not clients)
FILM = dict(src='assets/Motion%20Design/1_Rovard%20Brand%20Film/rovard-brand-film.mp4', slug='rovard-studios-brand-film', poster='film-02')


# ── Supplied people photography (illustrative only: these are NOT our clients or team) ──
# (photo number, audience label shown on the card, object-position of the face)
PEOPLE = {
    1: ('Founders & small businesses', '50% 26%'),
    2: ('Professionals & personal brands', '50% 18%'),
    3: ('Startups & teams', '50% 22%'),
    4: ('Creators & freelancers', '34% 28%'),
    5: ('Entrepreneurs', '50% 24%'),
    6: ('Organizations & institutions', '50% 28%'),
    7: ('Individuals with an idea', '50% 26%'),
    8: ('Companies & teams', '50% 30%'),
    9: ('Agencies & partners', '50% 35%'),
    10: ('Business owners', '58% 40%'),
}
PEOPLE_NOTE = "Photography is illustrative. It does not show our clients."


def load_testimonials():
    """Real quotes only. Add entries to tools/testimonials.json (see README). Empty file = section is not shown."""
    path = os.path.join(ROOT, 'tools', 'testimonials.json')
    try:
        data = json.load(open(path, encoding='utf-8'))
    except (OSError, ValueError):
        return []
    return [t for t in data if t.get('quote') and t.get('name')]


# Logos cut from our own project artwork (tools/logos.py). (file, brand name, display height px)
BRAND_LOGOS = [('design-eigen', 'Design Eigen', 40), ('northstar-capital', 'Northstar Capital', 36), ('bitefort', 'Bitefort', 34), ('vita-house', 'Vita House', 40),
               ('green-blueprint', 'Green Blueprint', 74), ('mason-and-rowe', 'Mason & Rowe', 22), ('linkrithm', 'LinkRithm', 30), ('proxima-exchange', 'Proxima Exchange', 36),
               ('gce-study-app', 'GCE Study App', 50), ('afaa-pay', "Afa'a Pay", 34), ('jojo-foods', 'JoJo Foods', 64), ('shorteeme', 'ShorteeMe', 58)]

# Logo colours, taken from each brand's own artwork (the logos are cut out as masks and re-coloured)
LOGO_COLOURS = {'design-eigen': '#111322', 'northstar-capital': '#0A0C24', 'bitefort': '#4A2A8F', 'vita-house': '#2F5A44', 'green-blueprint': '#1B4839',
                'mason-and-rowe': '#2A241E', 'linkrithm': '#7B4DF0', 'proxima-exchange': '#1C39BB', 'gce-study-app': '#0E9F6E', 'afaa-pay': '#2F43E8',
                'jojo-foods': '#D8352C', 'shorteeme': '#1E3FA8'}

# Budget choices on the start form: what the visitor picks from, not our prices.
BUDGETS = ['Under $250', '$250 – $1,000', '$1,000 – $3,000', '$3,000 – $5,000', '$5,000 – $10,000', '$10,000+', 'Not sure yet']


# ── Pricing packages. Leave price as None until you decide; then it shows "From $X" ──────────────────
# `price` is a number in USD, e.g. 250. None shows "Tell us your budget".
PACKAGES = [
    dict(id='logo', name='Logo', who="You're starting something and need a clean mark to begin with.",
         includes=['Logo design', 'Two rounds of changes', 'Files for print and screen', 'A short note on your colours and fonts'], need='brand', price=350),
    dict(id='flyer', name='Flyers & social', who="One flyer, one poster, one invitation, or a set of posts for your page.",
         includes=['Flyer, poster, invitation or a set of social graphics', 'Two rounds of changes', 'Print-ready and screen-ready files', 'Templates, if you will post often'], need='design', price=75),
    dict(id='brand', name='Brand identity', who="You want everything you make to look like it belongs together.",
         includes=['Logo and variations', 'Colours, fonts and how to use them', 'Brand guidelines you can hand to anyone', 'Business card and social profile designs'], need='brand', price=1200, featured=True),
    dict(id='web', name='Website', who="You need a website or landing page people can actually understand.",
         includes=['Page design that works on phones', 'Layout for your words and images', 'A contact form that reaches you', 'Files ready to publish'], need='website', price=1500),
    dict(id='big', name='Billboards & vehicles', who="Something that has to be read from across the road.",
         includes=['Billboard, banner, sign or vehicle artwork', "Made to your supplier's sizes and specs", 'Print-ready files', 'Help finding the right printer or installer'], need='ads', price=300),
    dict(id='bw', name='Brand + website', who="You're launching and want your brand and your website to match from day one.",
         includes=['Logo and brand guidelines', 'A website of several pages', 'Business card and social profile designs', 'Two rounds of changes on each piece'], need='brand', price=3000),
    dict(id='launch', name='Full launch', who="A launch or a rebrand where everything needs to look right at once.",
         includes=['Brand identity and guidelines', 'Website design', 'Launch graphics for social media and print', 'A presentation or pitch deck'], need='brand', price=5000),
    dict(id='scale', name='Complete brand & digital', who="A serious launch or rebuild where the whole look, site and rollout come together.",
         includes=['Full brand identity and guidelines', 'A larger website with custom page designs', 'Packaging, print and vehicle or signage artwork as needed', 'Launch campaign graphics and a short promo video', 'Priority scheduling and three rounds of changes'], need='brand', price=10000),
    dict(id='custom', name='Something else', who="A bigger project, a mix of things, or something not listed here.",
         includes=['Packaging, motion, books, vehicles and more', 'A plan built around your idea', 'A written quote before work starts'], need='unsure', price=None),
]

# ── FAQ (answers match the Terms page) ───────────────────────────────────────────────────────────────
FAQ = [
    ("How do I get started?", "Fill in the Start a project form, or message us. A few words about your idea is plenty. We reply with a few questions and, when we know enough, a written quote."),
    ("Do you take small jobs, like one flyer?", "Yes. One flyer, one logo or one card is a real project here."),
    ("How much will it cost?", "It depends on what you need and how big it is. We send a written quote before any work starts, so there are no surprises. If you tell us a budget range, we'll tell you honestly what it can cover."),
    ("How long does it take?", "It depends on the size of the project and how quickly we get your feedback. The timeline is written in your quote."),
    ("How many changes can I ask for?", "Two rounds of changes are included with each piece of work. If you want more, or change direction after approving a stage, we quote it separately."),
    ("What do I receive at the end?", "The final approved files, ready for print or screen. If you want the original working files too, we agree that in the quote."),
    ("Do you also print things?", "We design the artwork and prepare print-ready files. Printing, signage and vehicle wraps are made by a printer or installer, and we're happy to point you to the right one."),
    ("Who owns the design?", "You do, once the project is paid in full. The details are in our Terms."),
    ("Can you work with people outside Canada?", "Yes. We're based in Canada and work with people all over the world."),
    ("I don't know what I need. Can you still help?", "Yes. Tell us about your idea in your own words, or choose \"I'm not sure\" on the form, and we'll work out the rest together."),
]
