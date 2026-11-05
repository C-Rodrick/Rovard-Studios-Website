# -*- coding: utf-8 -*-
"""Copy and structure for the immersive redesign. Extends tools/content.py, which still holds projects, packages and FAQ."""
from content import BRAND, CONCEPT, KIND, META

# Filter labels on /work and category labels on project pages.
KIND.update({'brand': 'Branding', 'web': 'Digital', 'social': 'Campaigns & social', 'print': 'Packaging & print', 'motion': 'Motion'})

# What each project is. Only the projects in CONCEPT are called concepts, because their own text says so.
# 'brand' makes no claim about who commissioned it. See the open questions in docs/REDESIGN.md.
STUDIO_OWN = {'rovard-studios-brand-film'}


def status_of(slug):
    if slug in CONCEPT:
        return 'concept'
    return 'studio' if slug in STUDIO_OWN else 'brand'


STATUS_LABEL = {'concept': 'Independent concept', 'studio': 'Studio film', 'brand': 'Brand project'}

HERO_LINES = ['We turn', 'ideas into', 'extraordinary', 'visual', 'experiences.']

CAPABILITIES = [
    dict(id='identity', need='branding', title='Brand Identity & Strategy', img=('linkrithm', 'gallery-02'),
         does="We work out what makes you different, then build the mark, colour and type that make people recognise it.",
         why="A brand is what people remember when you are not in the room. It should be yours, and hard to confuse.",
         asks=['Brand discovery', 'Creative direction', 'Brand positioning', 'Visual identity', 'Logo development', 'Colour systems', 'Typography systems', 'Brand guidelines', 'Brand applications'],
         pages=['brand', 'packaging']),
    dict(id='graphic', need='graphic', title='Graphic & Visual Communication', img=('dress-doctor', 'BOOK PICKUP_DD.jpg'),
         does="Posters, flyers, social posts, documents and signs that say one thing clearly and look good doing it.",
         why="Most people decide in seconds whether to keep reading. One flyer gets the same care as a full launch.",
         asks=['Posters', 'Campaign graphics', 'Social media design', 'Editorial design', 'Promotional materials', 'Corporate communication', 'Event graphics', 'Print design'],
         pages=['design', 'social', 'ads', 'vehicle', 'docs']),
    dict(id='digital', need='website', title='Digital Experiences', img=('mason-and-rowe-residences', 'mr-ui-04-home'),
         does="Websites and interfaces designed and built together, so the idea survives contact with a real screen.",
         why="Your site is often the first conversation you have with someone. It has to explain you fast, on a phone.",
         asks=['Website design', 'Website development', 'Landing pages', 'Digital interfaces', 'Interactive experiences', 'Digital brand systems', 'Responsive experiences'],
         pages=['website']),
    dict(id='motion', need='motion', title='Motion Design & Visual Storytelling', img=('rovard-studios-brand-film', 'film-02'),
         does="Films, animated identities and motion graphics that give an idea timing, rhythm and a point of view.",
         why="Movement holds attention longer than a still image, and some ideas only make sense once they move.",
         asks=['Motion graphics', 'Animated branding', 'Logo animation', 'Promotional videos', 'Explainer visuals', 'Visual storytelling', 'Animated social content', 'Presentation animation'],
         pages=['media']),
    dict(id='campaigns', need='campaign', title='Creative Campaigns', img=('green-blueprint', 'Cover 7 - Copy'),
         does="One idea carried across every place it needs to appear, from the billboard to the phone screen.",
         why="A campaign works when people meet the same idea three times and know it is the same idea.",
         asks=['Campaign concepts', 'Campaign visual systems', 'Advertising design', 'Promotional communication', 'Creative direction', 'Multi-platform campaign assets'],
         pages=['social', 'ads']),
    dict(id='direction', need='direction', title='Creative Direction & Art Direction', img=('mason-and-rowe', None),
         does="We set the look, the references and the standard, then keep every piece of the work pointed the same way.",
         why="Good work gets diluted one small decision at a time. Direction is what keeps it from happening.",
         asks=['Visual concepts', 'Art direction', 'Creative development', 'Visual research', 'Campaign direction', 'Creative supervision'],
         pages=['brand']),
]

PROCESS = [
    dict(word='The idea', key='idea', copy="It starts as a sentence. A business about to open, a problem worth solving, a feeling you want people to have. Rough is fine."),
    dict(word='The thinking', key='thinking', copy="Who is it for, and what does it have to do? The answers shape everything that follows, before anything gets designed."),
    dict(word='The design', key='design', copy="The thinking becomes a system of marks, colour, type and movement. You see real work and react to it, and we refine it together."),
    dict(word='The experience', key='experience', copy="The idea goes out into the world, on a phone, a wall, a shelf or a street, and holds together wherever people meet it."),
]

WHY_V3 = [
    ('We think first.', "Before we open a design file, we ask what this has to do and who it is for. Good design starts there."),
    ('Small jobs get real attention.', "One flyer, one logo, one card. If it carries your name, it matters."),
    ('It has to work out there.', "On the phone, the poster, the wall and the vehicle. We design for where people will actually see it."),
    ('We keep experimenting.', "We try things nobody asked for, so the next idea has somewhere new to go. This website is one of them."),
]

# What a visitor can pick on step 1 of the form. The values are what arrives in the enquiry email.
NEEDS_V3 = [('branding', 'Branding'), ('graphic', 'Graphic design'), ('website', 'Website or digital experience'), ('motion', 'Motion design'),
            ('video', 'Video or visual storytelling'), ('campaign', 'Campaign design'), ('direction', 'Creative direction'), ('else', 'Something else')]
STAGES_V3 = ['Just exploring an idea', 'Ready to begin', 'Developing an existing project', 'Looking to improve something already launched']
TIMING_V3 = ['As soon as possible', 'Within a month', 'In one to three months', 'No fixed date yet']
STEP_TITLES = ['What do you need?', 'Tell us about your project.', 'Where are you in the process?', 'Budget and timing.', 'Where should we reply?']

PRICE_GROUPS = [
    dict(title='Essential creative projects', note="One piece of work, done properly.", ids=['flyer', 'big', 'logo']),
    dict(title='Brand development', note="Everything you make starts to look like it belongs together.", ids=['brand']),
    dict(title='Digital experiences', note="A site on its own, or a brand and site launched as one.", ids=['web', 'bw', 'launch', 'scale']),
    dict(title='Motion and visual storytelling', note="Films, animated branding and motion graphics are scoped to the idea, so we quote them individually.", ids=[], need='motion'),
    dict(title='Custom creative engagements', note='', ids=['custom']),
]

ENGAGEMENT = [
    ('You tell us what is going on.', "A few words on the form or by email. No brief needed."),
    ('We ask a few questions.', "So we understand who it is for and what it has to do."),
    ('You get a written quote.', "The final price, the timeline and exactly what is included, before any work starts."),
    ('We make it together.', "Two rounds of changes are included with each piece of work."),
]

# Selected work on the home page. layout = how it sits on the grid; they are deliberately not the same.
SELECTED = [
    dict(slug='linkrithm', img='gallery-06', layout='full'),
    dict(slug='mason-and-rowe-residences', img='mr-ui-04-home', layout='left'),
    dict(slug='jojo-foods', img=None, layout='right-tall'),
    dict(slug='green-blueprint', img='Cover 7 - Copy', layout='wide-offset'),
    dict(slug='northstar-capital-website', img=None, layout='left-small'),
]

# Brand Universe wall: (slug, x, y, width in px, depth) on a 2400 x 1500 world.
UNIVERSE = [
    ('linkrithm', 780, 480, 640, .12), ('mason-and-rowe', 120, 120, 430, -.1), ('jojo-foods', 1480, 70, 380, .05), ('green-blueprint', 1520, 600, 560, .16),
    ('vita-house', 110, 640, 480, .08), ('northstar-capital-website', 680, 50, 540, -.14), ('shorteeme', 1960, 150, 340, -.08), ('design-eigen', 660, 1000, 480, -.1),
    ('afaa-pay', 1220, 1040, 430, .1), ('bitefort', 90, 1110, 420, -.06), ('proxima-exchange', 1760, 1090, 520, -.05),
]

LAB = [
    dict(id='field', n='01', title='Cobalt Field', medium='Fragment shader', note="Noise folded into itself, then quantised into the logo's square near your pointer. One shader, no images.", cta='Move across it'),
    dict(id='specimen', n='02', title='Core Specimen', medium='Three.js', note="The object from our homepage, out of its story. One shape, four states, all computed on the graphics card.", cta='Change its state'),
    dict(id='particles', n='03', title='Ink Type', medium='Canvas', note="A word rendered in Syne, sampled into squares that remember where they belong.", cta='Disturb it'),
    dict(id='weight', n='04', title='Weight', medium='Variable font', note="Syne's weight axis used as an instrument. No canvas, just type doing what type can do.", cta='Sweep across it'),
    dict(id='blocks', n='05', title='Block System', medium='Canvas', note="The R from our logo rebuilt from a grid of its own square. A study for a pattern system.", cta='Push through it'),
]

META.update({
    'home': (f"{BRAND} | Creative studio for branding, design, motion and websites",
             f"{BRAND} is a creative studio in Canada. We design brands, logos, flyers, campaigns, websites and films, for people with one idea and companies with many."),
    'services': (f"Services | {BRAND}",
                 f"Brand identity, graphic design, websites, motion, campaigns and creative direction, from one flyer to a full launch. See what {BRAND} can make for you."),
    'work': (f"Work | {BRAND}", f"Brand identities, websites, campaigns, packaging and films by {BRAND}, including independent concepts, each clearly labelled."),
    'blog': (f"Insights | {BRAND}", f"Plain advice from {BRAND}: how to brief a designer, what a flyer needs, logo or full brand, and more."),
    'about': (f"About | {BRAND}", f"{BRAND} is a creative studio exploring the space between ideas, design and digital experiences. Based in Canada, working worldwide."),
    'start': (f"Start a project | {BRAND}", f"Tell {BRAND} about your idea, your goals and what you would like to create. A few words is plenty."),
    'contact': (f"Contact | {BRAND}", f"Email {BRAND}, or start a project with a short form. Based in Canada, working worldwide, in English and French."),
    'dimension': (f"Creative Dimension | {BRAND}", f"Experiments from {BRAND}: shaders, variable type, particles and 3D studies, made to find out what is possible next. Not client work."),
})
