# -*- coding: utf-8 -*-
"""All new copy for the Obsidian Architecture edition. Facts stay in tools/content.py.

Headlines, the five disciplines and the five stages are the master brief's own words.
Nothing here names a client, a result, an award or a statistic that the repository cannot back up.
Wording marked OWNER needs the studio owner's confirmation before publication.
"""
BRAND = 'ROVARD STUDIOS'

META = {
    'home': (f"{BRAND} | A multidisciplinary creative studio",
             f"{BRAND} turns ideas into extraordinary visual experiences: brand worlds, digital experiences, motion and visual stories, creative communication and creative direction."),
    'capabilities': (f"Capabilities | {BRAND}",
                     f"Brand worlds, digital experiences, motion and visual stories, creative communication and creative direction, for individuals, entrepreneurs, businesses and organizations."),
    'work': (f"Work | {BRAND}", f"Brand identities, websites, campaigns, packaging and films from {BRAND}. Concept projects are labelled as concepts."),
    'studio': (f"Studio | {BRAND}", f"{BRAND} is a multidisciplinary creative studio based in Canada and working worldwide. Our vision, mission, creative philosophy and process."),
    'pricing': (f"Pricing | {BRAND}", f"What each kind of project with {BRAND} usually includes, how estimates are worked out, and how to request a written quote."),
    'blog': (f"Insights | {BRAND}", f"Plain advice from {BRAND}: how to brief a designer, what a flyer needs, logo or full brand, and more."),
    'start': (f"Start a project | {BRAND}", f"Tell {BRAND} what you're working on. A few words is plenty, and you get a written quote before any work starts."),
    'contact': (f"Contact | {BRAND}", f"Contact {BRAND}. Based in Canada and working worldwide, in English and French."),
}

# --k: font size for that line, in units of the headline width. Measured by tools/oa/fit.py so each line fills the block.
HERO_H1 = ('<span class="ln" style="--k:.0563;--i:0">We turn ideas into</span> '
           '<span class="ln ln-b" style="--k:.0686;--i:1">extraordinary</span> '
           '<span class="ln" style="--k:.0537;--i:2">visual experiences.</span>')
HERO_SUB = "We bring creativity, strategy and technology together to transform ideas into powerful visual identities, digital experiences and visual stories."
CTA_SUB = "Whether you're starting something new, building a brand or looking for a fresh creative perspective, let's explore what we can create together."

PHILOSOPHY = [
    "A logo, a film and a website are not three separate problems. They are one idea, seen from different angles.",
    "So we don't start with a format. We start with what you want people to feel, understand and do. Then design, technology and communication work on it together, until the idea is clear enough to go anywhere it needs to go.",
]

# (slug, layout class, sizes)
HOME_WORK = [
    ('linkrithm', 'x-wide', '(min-width: 900px) 74vw, 100vw'),
    ('jojo-foods', 'x-a', '(min-width: 900px) 34vw, 100vw'),
    ('mason-and-rowe-residences', 'x-b', '(min-width: 900px) 50vw, 100vw'),
    ('shorteeme', 'x-c', '(min-width: 900px) 32vw, 100vw'),
    ('design-eigen', 'x-d', '(min-width: 900px) 58vw, 100vw'),
    ('book-cover-design', 'x-e', '(min-width: 900px) 50vw, 100vw'),
    ('bitefort', 'x-f', '(min-width: 900px) 36vw, 100vw'),
    ('rovard-studios-brand-film', 'x-wide x-end', '(min-width: 900px) 74vw, 100vw'),
]

# The strongest real image from each project, used for its card and page opening. Indices into its images.
KEY_IMAGE = {
    'linkrithm': 9, 'jojo-foods': 1, 'mason-and-rowe-residences': 5, 'shorteeme': 0, 'design-eigen': 6, 'book-cover-design': 1, 'bitefort': 4,
    'rovard-studios-brand-film': 1, 'green-blueprint': 9, 'vita-house': 1, 'northstar-capital': 1, 'mason-and-rowe': 1, 'proxima-exchange': 1,
    'afaa-pay': 1, 'vita-house-care': 1, 'northstar-capital-website': 1, 'gce-study-app': 1, 'dress-doctor': 1, 'pdoca': 2,
    'proxima-exchange-films': 7, 'northstar-capital-ad': 7,
}
# Projects whose cover is a smaller copy of a gallery image: {slug: that gallery index}. The cover is then not shown again.
COVER_DUPLICATE = {'green-blueprint': 9, 'vita-house': 1, 'northstar-capital': 1, 'mason-and-rowe': 1, 'vita-house-care': 1, 'northstar-capital-website': 1,
                   'mason-and-rowe-residences': 1, 'book-cover-design': 1, 'gce-study-app': 4, 'dress-doctor': 3, 'jojo-foods': 1}
WORK_ORDER = ['linkrithm', 'jojo-foods', 'mason-and-rowe-residences', 'shorteeme', 'design-eigen', 'book-cover-design', 'bitefort', 'rovard-studios-brand-film',
              'green-blueprint', 'northstar-capital-website', 'pdoca', 'vita-house', 'proxima-exchange', 'gce-study-app', 'mason-and-rowe', 'northstar-capital-ad',
              'dress-doctor', 'afaa-pay', 'northstar-capital', 'proxima-exchange-films', 'vita-house-care', 'kymela-2026']
# The stored story text for these does not describe what was actually made, so only the factual line is shown.
NO_STORY = {'kymela-2026'}
KIND_NEED = {'brand': 'brand', 'web': 'website', 'social': 'design', 'print': 'packaging', 'motion': 'media'}

DISCIPLINES = [
    dict(id='brand-worlds', title='Brand Worlds',
         list="Brand strategy, identity systems, logo design, typography and visual language.",
         does="A complete way of looking and sounding, written down so anyone can keep using it.",
         who="For new businesses, people building a personal brand, and established companies that want to look the part again.",
         work=['linkrithm', 'green-blueprint', 'vita-house'], landing=['brand']),
    dict(id='digital-experiences', title='Digital Experiences',
         list="Website design, digital interfaces, interactive experiences and digital environments.",
         does="Websites and interfaces that people understand quickly, built to work well on a phone.",
         who="For businesses, organizations and individuals who need to explain what they do online.",
         work=['mason-and-rowe-residences', 'northstar-capital-website', 'afaa-pay'], landing=['website']),
    dict(id='motion-visual-stories', title='Motion & Visual Stories',
         list="Motion graphics, animated identities, promotional videos and visual storytelling.",
         does="Moving work that explains an idea quickly and stays with people.",
         who="For launches, campaigns and anyone with a story that reads better in motion.",
         work=['rovard-studios-brand-film', 'northstar-capital-ad', 'proxima-exchange-films'], landing=['media']),
    dict(id='creative-communication', title='Creative Communication',
         list="Graphic design, campaigns, promotional materials and advertising visuals.",
         does="Flyers, posters, social media, billboards, banners, packaging and vehicle graphics that say one thing clearly.",
         who="For events, churches and ministries, small businesses and campaigns. One flyer is a real project here.",
         work=['shorteeme', 'jojo-foods', 'pdoca'], landing=['design', 'social', 'ads', 'vehicle', 'packaging', 'docs']),
    dict(id='creative-direction', title='Creative Direction',
         list="Concept development, art direction, visual strategy and creative problem-solving.",
         does="The thinking that holds everything together, and a clear direction before anything gets made.",
         who="For founders and teams with many moving parts, or a good idea that hasn't found its shape yet.",
         work=['mason-and-rowe', 'northstar-capital', 'vita-house'], landing=[]),
]

PROCESS = [
    ('Discover', "You tell us what's going on, in your own words. We ask who this is for and what it should do."),
    ('Define', "We agree on the direction and the scope, and you get a written quote before any work starts."),
    ('Design', "You see real work, not a pitch about work."),
    ('Develop', "Your feedback sharpens it. We refine it and build it out to everything it needs to become."),
    ('Deliver', "You get the final files, ready for print or screen, and everything you need to use them."),
]

STUDIO_INTRO = [
    f"{BRAND} is a multidisciplinary creative studio, based in Canada and working with people around the world.",
    "We work with individuals, small businesses, churches, organizations and companies. Some projects are big and some are one flyer. Same care, same questions: who is this for, and what should it do?",
]
# OWNER: proposed wording from the master brief, to be confirmed before publication.
VISION = "To create meaningful visual experiences that expand the possibilities of communication, creativity and design."
MISSION = "To help individuals, brands and organisations express their ideas through thoughtful design, creative technology and exceptional visual storytelling."
# OWNER: carried over from the live site. Please confirm.
STUDIO_FACTS = [('7+', 'years of experience'), ('200+', 'projects completed'), ('2', 'working languages')]
PRINCIPLES = [
    ('We start with the why.', "Before we open a design file, we ask what this needs to do and who it's for. Good design starts there."),
    ('Small jobs get real attention.', "One flyer, one logo, one card. If it carries your name, it matters."),
    ('Design is a job, not decoration.', "It has to work on the phone, the poster, the wall and the vehicle. We design for where people will actually see it."),
]
MULTI = "Most ideas don't stay in one format. A name becomes a logo, the logo becomes a sign, the sign needs a website, and the launch needs a film. Keeping that work in one studio means it all looks and sounds like it came from the same place."

ENGAGEMENT = [
    ('One piece', "One flyer, one logo, one set of posts. A clear job with a clear end."),
    ('A project', "A brand identity or a website, taken from first conversation to final files."),
    ('A launch', "A brand, a website and everything around them, designed to go out together."),
    ('Something else', "A bigger project, a mix of things, or something not listed here. We build a plan around your idea."),
]
ESTIMATE = [
    "What you need made, and how many pieces there are.",
    "How much is already in place, such as a logo, words or photos.",
    "When you need it, and how quickly feedback can move.",
    "Your budget range, if you share one. We'll tell you honestly what it can cover.",
]
TIMELINES = ['As soon as possible', 'Within a month', 'One to three months', 'More than three months', 'Flexible or not sure']
PRODUCTION_NOTE_SHORT = "We design it and prepare print-ready files. Printing and installation are done by a printer or installer, and we're happy to point you in the right direction."

# The R from the official logo file (assets/rovard-logo.svg), used as a large cropped form.
R_PATH = "M60.24 130V40.4H96.464C102.011 40.4 106.875 41.3813 111.056 43.344C115.323 45.2213 118.651 47.952 121.04 51.536C123.429 55.0347 124.624 59.2587 124.624 64.208V65.616C124.624 71.504 123.216 76.1547 120.4 79.568C117.584 82.9813 114.256 85.2853 110.416 86.48V88.272C113.488 88.3573 116.005 89.3813 117.968 91.344C120.016 93.2213 121.04 96.08 121.04 99.92V130H110.416V101.2C110.416 98.64 109.691 96.6773 108.24 95.312C106.875 93.9467 104.784 93.264 101.968 93.264H70.992V130H60.24ZM70.992 83.536H95.44C101.328 83.536 105.851 82.128 109.008 79.312C112.251 76.4107 113.872 72.4 113.872 67.28V66.384C113.872 61.264 112.293 57.296 109.136 54.48C105.979 51.5787 101.413 50.128 95.44 50.128H70.992V83.536Z"
