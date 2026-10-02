const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const body = document.body;
const header = $('#site-header');
const menuToggle = $('.menu-toggle');
const mobileMenu = $('.mobile-menu');
const themeToggle = $('.theme-toggle');
const themeColorMeta = $('meta[name="theme-color"]');

/* Always start back at the homepage top on refresh — never restore the
   previous scroll position or a leftover section hash (#work, #services…). */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
window.addEventListener('load', () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
});

const setTheme = theme => {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle?.setAttribute('aria-checked', String(isDark));
  themeToggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  themeToggle?.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  $('.theme-toggle-icon', themeToggle)?.replaceChildren(document.createTextNode(isDark ? '☀' : '☾'));
  $('.theme-toggle-label', themeToggle)?.replaceChildren(document.createTextNode(isDark ? 'Light' : 'Dark'));
  themeColorMeta?.setAttribute('content', isDark ? '#111318' : '#F7F7F5');
  try {
    localStorage.setItem('rovard-theme', isDark ? 'dark' : 'light');
  } catch { }
};

setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
themeToggle?.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* Loader */
window.addEventListener('load', () => {
  setTimeout(() => $('.page-loader')?.classList.add('done'), 450);
});

/* Header */
const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 40);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

/* Mobile navigation */
menuToggle?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
  mobileMenu.setAttribute('aria-hidden', !open);
  body.classList.toggle('no-scroll', open);
});
const closeMobileMenu = () => {
  mobileMenu.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  body.classList.remove('no-scroll');
};
$$('.mobile-menu a').forEach(a => a.addEventListener('click', closeMobileMenu));

/* Reveal on scroll */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0, rootMargin: '0px 0px 12% 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

/* Cursor, magnetic buttons and scroll effects are handled by motion.js */

/* Case studies */
const makeGalleryAsset = (title, colors = ['#162daf', '#f7f7f5', '#f5cc00']) => {
  const fontSize = Math.min(128, Math.floor(960 / (title.length * 0.62)));
  const fg = colors[1] || '#f7f7f5';
  const bg1 = colors[0] || '#162daf';
  const bg2 = colors[2] || '#f5cc00';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bg1}" />
          <stop offset="100%" stop-color="${bg2}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)"/>
      <rect x="90" y="90" width="1020" height="720" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="6"/>
      <text x="600" y="470" text-anchor="middle" font-family="'Syne', sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${-Math.round(fontSize * 0.06)}" fill="${fg}">${title.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const caseData = [
  {
    title: 'Green Blueprint',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Identity / Art Direction / Packaging',
    summary: 'An eco-conscious construction brand built around a clear vision for sustainable urban design.',
    challenge: 'The company needed a more confident visual language that could work across digital and physical touchpoints.',
    approach: 'We developed a flexible identity system with sharp typography, a memorable symbol and a disciplined visual rhythm.',
    outcome: 'A cohesive, recognizable identity system that brings Green Blueprint’s sustainable construction vision to life across digital and physical touchpoints.',
    colours: ['#1B4839', '#EBEBEB', '#5CAD8D', '#f5cc00'],
    coverImage: 'assets/thumbs/1-green-blueprint-cover-7.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%201.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%201.2.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%202.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%203.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%204.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%205.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%206.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%206.2.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%207%20-%20Copy.jpg',
      'assets/Brand%20Identitities/1_Green%20Blueprint/Cover%208.jpg'
    ]
  },
  {
    title: 'Design Eigen',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Identity / Positioning / Direction',
    summary: 'An identity refresh designed to sharpen the brand story and improve recognition across channels.',
    challenge: 'The business had strong fundamentals but an outdated system that no longer reflected the level of ambition behind it.',
    approach: 'We simplified the visual language, refined the positioning and built a more consistent brand system from the inside out.',
    outcome: 'A cleaner and more premium identity that creates stronger recall and better internal alignment.',
    colours: ['#162daf', '#f7f7f5', '#f5cc00', '#000985'],
    coverImage: 'assets/thumbs/2-design-eigen-imgi-157-c7b3d4219180769-67b0aff187b1c.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_200_f1f03a219180769.67ada23ebe1ae.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_201_4a6fc4219180769.67ada43c328d1.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_202_9c26c3219180769.67ada43c31bdc.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_203_0ff659219180769.67ada43c335f3.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_204_b3790b219180769.67ada43c32396.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_205_0ce546219180769.67ada43c32e22.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_206_f968cf219180769.67ada43c313fb.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_207_14d98e219180769.67ada43c30ba9.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/imgi_209_9414ab219180769.67b0aff187247.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/ID%20Card.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/psd%20copy.jpg',
      'assets/Brand%20Identitities/2_Design%20Eigen/Tshirt%20Mockup.jpg'
    ]
  },
  {
    title: 'Bitefort',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Art Direction / Identity / Messaging',
    summary: 'A confident identity and digital direction for a privacy-first cookie management platform.',
    challenge: 'Bitefort needed a distinctive brand system that could make complex privacy and compliance feel clear, credible and approachable.',
    approach: 'We built a dark, high-contrast visual language around the Bitefort shield and cookie motif, extending it across campaigns, digital touchpoints and branded merchandise.',
    outcome: 'A memorable purple identity that makes trust, privacy and effortless cookie management feel immediate across every touchpoint.',
    colours: ['#21003F', '#F7F4F1', '#6B2FB3', '#0D0616'],
    coverImage: 'assets/thumbs/3-bitefort-1.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/3_Bitefort/2.jpg',
      'assets/Brand%20Identitities/3_Bitefort/3.jpg',
      'assets/Brand%20Identitities/3_Bitefort/4.jpg',
      'assets/Brand%20Identitities/3_Bitefort/5.jpg',
      'assets/Brand%20Identitities/3_Bitefort/6.jpg',
      'assets/Brand%20Identitities/3_Bitefort/7.jpg',
      'assets/Brand%20Identitities/3_Bitefort/8.jpg'
    ]
  },
  {
    title: 'LinkRithm',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Identity / Packaging / Positioning',
    summary: 'A connected brand identity system built for engineering teams, technical knowledge and digital collaboration.',
    challenge: 'LinkRithm needed a distinctive visual system that could make complex technical relationships feel clear, connected and human.',
    approach: 'We developed a modular identity around linked forms, a deep navy foundation and a violet gradient accent that moves naturally across digital and physical applications.',
    outcome: 'A confident technology brand that gives engineering knowledge a memorable visual rhythm across products, spaces and culture.',
    colours: ['#07112F', '#F7F8FC', '#8B5CF6', '#101A3D'],
    coverImage: 'assets/thumbs/linkrithm-tshirt-cover.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-01.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-02.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-03.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-04.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-05.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-06.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-07.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-08.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-09.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-10.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-11.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-12.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-13.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-14.jpg',
      'assets/Brand%20Identitities/4_Linkrithm/linkrithm-gallery-15.jpg'
    ]
  },
  {
    title: 'Vita House',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Brand Strategy / Visual Identity / Brand Guidelines',
    client: 'Vita House (fictional)',
    industry: 'Healthcare / Preventative Wellness',
    type: 'Self-initiated concept project',
    summary: 'A warm, human brand identity for a fictional U.S. preventative healthcare company, built to feel like coming home rather than going to a clinic.',
    challenge: 'Healthcare brands default to cold clinical blue and institutional language. Vita House needed to communicate trust, warmth, professionalism and accessibility to young professionals and families, without looking or sounding like a hospital.',
    approach: 'The identity rests on one idea: care that feels like coming home. The symbol, The Open Door, joins an arch (the house), a V (Vita: open arms and a rising shoot) and a honey sun. Warm neutrals, sage and deep moss carry the system, with clay and honey as quiet accents and no blue at all. Fraunces gives the voice warmth, Figtree keeps it clear, and every colour pairing is checked for accessible contrast. An arch-based graphic language, a custom icon set, illustrated portraits and photography direction complete the guidelines.',
    outcome: 'A complete brand system: positioning and voice, logo and lockups, colour, typography, photography direction, graphic language, iconography and applications from membership cards to signage. Self-initiated concept; Vita House is fictional and nothing shown is medical advice.',
    colours: ['#20352A', '#FBF8F2', '#3F5C47', '#E8BC5E'],
    coverImage: 'assets/thumbs/vita-house-brand-cover.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-01-cover.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-02-strategy.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-03-personality.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-04-voice.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-05-logo.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-06-lockups.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-07-usage.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-08-colour.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-09-accessibility.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-10-typography.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-11-photography.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-12-graphic-system.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-13-iconography.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-14-applications-a.jpg',
      'assets/Brand%20Identitities/5_Vita%20House/vita-brand-15-applications-b.jpg'
    ]
  },
  {
    title: 'Northstar Capital',
    category: 'Brand Identity Design',
    year: '2026',
    services: 'Brand Strategy / Visual Identity / Brand Guidelines',
    client: 'Northstar Capital (fictional)',
    industry: 'Financial Technology / SaaS',
    type: 'Self-initiated concept project',
    summary: 'An editorial-tech brand identity for a fictional U.S. fintech that helps small businesses understand cash flow, built on one idea: a fixed point to steer by.',
    challenge: 'Fintech brands default to padlocks, dollar signs and teal gradients, and speak in jargon. Northstar needed to feel confident, intelligent and credible to owners who are not finance people, without looking like a bank or a generic SaaS template.',
    approach: 'The mark is a bold, geometric N with a blue wedge inlaid in its counter: a compass needle, a sail, an arrow pointing north. Traced, the N is also a cash-flow line (up, down, up). Night Ink, Paper and Slate carry the system, Polaris Blue is the single accent, and Surplus green is reserved for positive money. Geist and Geist Mono set the tone, and four graphic devices (the north wedge, a meridian grid, the rise-dip-rise line and a data constellation) are all derived from the mark.',
    outcome: 'A complete brand system: strategy and voice, logo suite and usage rules, colour with contrast ratios, typography, graphic language, a custom icon set and applications from business cards to out-of-home. Self-initiated concept; Northstar Capital is fictional and nothing here is a real financial service.',
    colours: ['#0B0D12', '#F6F5F1', '#2B5BFF', '#14A06F'],
    coverImage: 'assets/thumbs/northstar-brand-cover.jpg',
    galleryImages: [
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-01-cover.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-02-strategy.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-03-personality-voice.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-04-logo-concept.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-05-logo-suite.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-06-logo-usage.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-07-colour.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-08-typography.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-09-graphic-language.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-10-applications-a.jpg',
      'assets/Brand%20Identitities/6_Northstar%20Capital/northstar-brand-11-applications-b.jpg'
    ]
  },
  {
    title: 'ShorteeMe',
    category: 'Social Media Design',
    year: '2026',
    services: 'Campaign System / Content Direction',
    summary: 'A bright, human social campaign system helping ShorteeMe make financing feel clear, accessible and full of possibility.',
    challenge: 'ShorteeMe needed a consistent content system that could communicate funding opportunities while keeping people and optimism at the centre.',
    approach: 'We created a flexible campaign language built from bold blue fields, energetic orange accents, expressive headlines and real human stories.',
    outcome: 'A recognizable social presence that makes ShorteeMe’s message easy to understand, share and remember across every campaign format.',
    colours: ['#0057B8', '#F7F7F5', '#FF9700', '#003B7A'],
    coverImage: 'assets/thumbs/1-shorteeme-make-something-amazing-1.jpg',
    galleryImages: [
      'assets/Social%20Media/1_ShorteeMe/Extend%20your%20reach%20today%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Did%20you%20know,%20raise%20money%20for%20what%20matters%20copy%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Fund%20your%20student%20career%20abroad%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Get%20an%20instant%20loan%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Get%20your%20support%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Raise%20money%20for%20free%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Put%20a%20smile%20on%20someone%27s%20face%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Make%20life%20better%20for%20every%20student%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Join%20our%20affiliate%20program%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Come%20get%20funds%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Become%20an%20investor%20today%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Free%20fundraising%20no%20platform%20fee%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Start%20your%20fund%20raising%20campaign%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Your%20Number%201',
      'assets/Social%20Media/1_ShorteeMe/We%20rise%20by%20lifting%20others%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Helping%20each%20other%20can%20make%20the%20world%20better%201.jpg',
      'assets/Social%20Media/1_ShorteeMe/Join%20your%20hand%20with%20us%201.jpg'
    ]
  },
  {
    title: 'Kymela 2026',
    category: 'Social Media Design',
    year: '2026',
    services: 'Social Content / Campaign / Art Direction',
    summary: 'A content system designed to make the brand feel active, intentional and easy to recognize.',
    challenge: 'The brand had strong messages but inconsistent creative execution across channels.',
    approach: 'We built a clear visual format across several campaign stories, each built to feel consistent without becoming repetitive.',
    outcome: 'A social set that improved recognition, helped the team move faster and supported story clarity.',
    colours: ['#2A363B', '#E8D5B5', '#99B898', '#E84A5F'],
    coverImage: 'assets/thumbs/kymela-cover.jpg',
    galleryImages: [
      'assets/Social%20Media/Kymela/img1.jpg',
      'assets/Social%20Media/Kymela/img2.jpg',
      'assets/Social%20Media/Kymela/img3.jpg'
    ]
  },
  {
    title: 'PDOCA',
    category: 'Social Media Design',
    year: '2026',
    services: 'Campaign Art / Social Stories',
    summary: 'A bold campaign identity for PDOCA\u2019s coaching academy, built to create consistent brand presence across multiple formats.',
    challenge: 'The brand needed a clearer, more premium visual rhythm across posts, stories and supporting assets.',
    approach: 'We designed a flexible template system with distinctive crop language, bold type and consistent campaign framing.',
    outcome: 'A consistent media system with stronger visual recall and clearer campaign storytelling.',
    colours: ['#0C0CB4', '#FCFCFC', '#FDCF09', '#0507B0'],
    coverImage: 'assets/thumbs/3-pdoca-layer-5.jpg',
    galleryImages: [
      'assets/Social%20Media/3_PDOCA/RML%20-%20Dealing%20copy%201.jpg',
      'assets/Social%20Media/3_PDOCA/WhatsApp%20Image%202025-02-08%20at%201.27.27%20PM%20(2).jpg',
      'assets/Social%20Media/3_PDOCA/WhatsApp%20Image%202025-02-08%20at%201.27.28%20PM%20-%20Copy.jpg',
      'assets/Social%20Media/3_PDOCA/WhatsApp%20Image%202025-02-08%20at%201.27.28%20PM.jpg',
      'assets/Social%20Media/3_PDOCA/PDOCA%20_June_V2.jpg',
      'assets/Social%20Media/3_PDOCA/August.jpg',
      'assets/Social%20Media/3_PDOCA/September.jpg',
      'assets/Social%20Media/3_PDOCA/October.jpg'
    ]
  },
  {
    title: 'Dress Doctor',
    category: 'Social Media Design',
    year: '2026',
    services: 'Campaign Art / Social Stories',
    summary: 'A bright, service-led campaign system for Dress Doctor Laundry, built to make free pickup and promo offers read at a glance.',
    challenge: 'A growing laundry brand needed its services, promos and booking flow to read instantly across busy social feeds.',
    approach: 'We built a bold, reusable campaign language around cyan panels, orange call-to-actions, playful headlines and clean offer layouts.',
    outcome: 'A recognizable social presence with clearer offers, stronger recall and a consistent publishing rhythm.',
    colours: ['#FF6801', '#162336', '#0CE4FC', '#162336'],
    coverImage: 'assets/thumbs/4-dress-doctor-book-pickup-dd.jpg',
    galleryImages: [
      'assets/Social%20Media/4_Dress%20Doctor/Dress%20Doctor%201.jpg',
      'assets/Social%20Media/4_Dress%20Doctor/Wash%20in%20Bulk.jpg',
      'assets/Social%20Media/4_Dress%20Doctor/BOOK%20PICKUP_DD%20-%20Copy.jpg'
    ]
  },
  {
    title: 'GCE Study App',
    category: 'Social Media Design',
    year: '2026',
    services: 'Campaign Art / Product Promotion',
    summary: 'A fresh, energetic campaign identity introducing the GCE Study App to Cameroonian students.',
    challenge: 'A new edtech brand needed to explain its features quickly and feel trustworthy to students and parents.',
    approach: 'We designed a bold green campaign language with playful type, clear feature call-outs and product mockups.',
    outcome: 'A recognizable launch presence with clearer feature storytelling and stronger engagement across socials.',
    colours: ['#016B29', '#FCFCFC', '#00F4A6', '#004F39'],
    coverImage: 'assets/thumbs/6-gce-study-app-3.jpg',
    galleryImages: [
      'assets/Social%20Media/6_GCE%20Study%20App/2.jpg',
      'assets/Social%20Media/6_GCE%20Study%20App/1.jpg',
      'assets/Social%20Media/6_GCE%20Study%20App/3.2.jpg',
      'assets/Social%20Media/6_GCE%20Study%20App/3%20-%20Copy.jpg'
    ]
  },
  {
    title: 'Proxima Exchange',
    category: 'UI Design',
    year: '2026',
    services: 'Website UI / Interaction Design / 3D / Front-end Build',
    summary: 'A premium website and interface for a crypto and forex trading platform, built directly from the Proxima identity.',
    challenge: 'Trading platforms often feel cold, cluttered and untrustworthy. Proxima needed one calm, credible interface that handles crypto and forex side by side and carries its royal blue, navy and gold identity.',
    approach: 'We turned the logo into the interface: its three colours drive the palette, and the mark itself is rebuilt as a layered 3D object. Bricolage Grotesque, Onest and Geist Mono give a confident, technical tone, with live market data, glass surfaces and fully responsive layouts.',
    outcome: 'A fast, responsive website that feels premium and trustworthy, with a live trading terminal, a unified markets view and a clear path from sign-up to first trade. Concept project; figures shown are illustrative.',
    colours: ['#000081', '#ffffff', '#1C39BB', '#FFC000'],
    coverImage: 'assets/thumbs/proxima-exchange-cover.jpg',
    galleryImages: [
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-01-cover.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-02-showcase.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-03-hero.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-04-mobile.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-05-security-3d.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-06-markets.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-07-platform.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-08-fees.jpg',
      'assets/UI%20Design/1_Proxima%20Exchange/proxima-09-brand-board.jpg'
    ]
  },
  {
    title: 'Afa\'a Pay',
    category: 'UI Design',
    year: '2026',
    services: 'Brand Identity / Fintech Website / Dashboard UI / Product Build',
    summary: 'A brand identity, fintech website and working escrow platform for a modern African payment network, built around one promise: building trust into every transaction.',
    challenge: 'Informal commerce across Africa runs on "trust me": buyers pay strangers up front, sellers chase invoices, and disputes have no referee. A payment brand here has to feel safe before it feels fast.',
    approach: 'We built the identity on one idea: two sides meeting at a verified point. The logo is an open A whose strokes converge on a green dot, the same dot that becomes the apostrophe in the wordmark. Black, white and electric blue carry the interface, and green is reserved for money that is verified or released. From there we designed the landing, pricing and security pages and a functional platform with milestone escrow, signed contracts, a wallet, disputes and an explainable trust score, thumb-first for mobile-money users.',
    outcome: 'A complete brand and product system, from logo to ledger: a website that explains escrow in one scroll, and a platform you can sign in to and try as buyer, seller or mediator. Concept project; payments are simulated and all figures are illustrative.',
    colours: ['#05060A', '#FFFFFF', '#2F5BFF', '#2EE59D'],
    liveUrl: 'afaa-pay/index.html',
    liveLabel: 'Explore the live concept ↗',
    coverImage: 'assets/thumbs/afaa-pay-cover.jpg',
    galleryImages: [
      'assets/UI%20Design/2_Afaa%20Pay/afaa-01-cover.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-02-logo.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-03-colour-type.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-04-website.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-05-platform.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-06-mobile.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-07-system.jpg',
      'assets/UI%20Design/2_Afaa%20Pay/afaa-08-voice.jpg'
    ]
  },
  {
    title: 'Vita House Care',
    category: 'UI Design',
    year: '2026',
    services: 'UX/UI Design / Website Design / Digital Product Design',
    client: 'Vita House (fictional)',
    industry: 'Healthcare / Preventative Wellness',
    type: 'Self-initiated concept project',
    summary: 'A responsive healthcare website, a six-step booking flow and a patient dashboard that make preventative care feel clear, calm and easy to use.',
    challenge: 'Healthcare interfaces tend to be dense, jargon-heavy and hidden behind logins. The brief was to reimagine the digital front door for young professionals and families, with a clear information hierarchy, accessibility built in, and kind error, empty and confirmation states.',
    approach: 'We designed ten website pages, a booking journey with one decision per step, and a dashboard for appointments, care team, messages, documents, membership and settings, all on one design system. WCAG AA contrast, 44px targets, error summaries, text-size and reduced-motion settings, and mobile versions of the booking flow and dashboard with a bottom tab bar and sticky actions.',
    outcome: 'A working front-end you can explore: book an appointment end to end and watch it appear in the dashboard. Self-initiated concept; every provider, location, price and article is fictional.',
    colours: ['#20352A', '#FBF8F2', '#3F5C47', '#E8BC5E'],
    liveUrl: 'vita-house/site/index.html',
    liveLabel: 'Explore the live concept ↗',
    coverImage: 'assets/thumbs/vita-house-ui-cover.jpg',
    galleryImages: [
      'assets/UI%20Design/3_Vita%20House/vita-ui-01-cover.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-02-journey.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-03-sitemap.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-04-components.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-05-website.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-06-pages.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-07-booking.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-08-states.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-09-dashboard.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-10-sections.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-11-mobile-booking.jpg',
      'assets/UI%20Design/3_Vita%20House/vita-ui-12-mobile-dashboard.jpg'
    ]
  },
  {
    title: 'Northstar Capital Website',
    category: 'UI Design',
    year: '2026',
    services: 'UX/UI Design / Website Design / Product Design',
    client: 'Northstar Capital (fictional)',
    industry: 'Financial Technology / SaaS',
    type: 'Self-initiated concept project',
    summary: 'A responsive eight-page website for a fictional U.S. fintech, with a working product dashboard behind it. The hero is the product itself, not a stock photo.',
    challenge: 'Small-business finance sites tend to lean on stock photography, vague claims and jargon. The brief was a site that proves the product in the first scroll, stays honest about what it is, and works as well on a phone as on a desktop.',
    approach: 'The homepage tells the story in eleven beats: a live cash-flow chart, a self-playing product tour, plain-English insights, an interactive what-if forecast, invoicing, security, testimonials and pricing. Everything is built from one design system with light and dark themes, a validated chart palette and a custom icon set. Behind the site sits a nine-view dashboard on realistic, fictional data: scenario planning, an invoice drawer and builder, reports, notifications and a command palette.',
    outcome: 'A working front-end you can explore: run a forecast scenario on the homepage, switch pricing plans, then open the demo workspace and send a reminder. Self-initiated concept; every customer, figure and testimonial is fictional.',
    colours: ['#0B0D12', '#F6F5F1', '#2B5BFF', '#14A06F'],
    liveUrl: 'northstar-capital/site/index.html',
    liveLabel: 'Explore the live website ↗',
    coverImage: 'assets/thumbs/northstar-ui-cover.jpg',
    galleryImages: [
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-01-cover.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-02-homepage.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-03-tour-insights.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-04-forecast-invoicing.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-05-pricing-features.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-06-supporting-pages.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-07-dashboard-overview.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-08-dashboard-detail.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-09-mobile.jpg',
      'assets/UI%20Design/4_Northstar%20Capital/northstar-ui-10-design-system.jpg'
    ]
  },
  {
    title: 'Book Cover Design',
    category: 'Packaging',
    year: '2026',
    services: 'Book Design / Art Direction / Print',
    summary: 'A premium book cover system built to make the title feel authoritative, desirable and impossible to shelve away.',
    challenge: 'The book needed a cover that could carry its message with weight and elegance across print and digital listings.',
    approach: 'We explored bold typographic structures, gold foil accents and disciplined mockup rounds from prototype to final press.',
    outcome: 'A striking black-and-gold cover family that reads powerfully at thumbnail size and feels premium in hand.',
    colours: ['#141414', '#F5F1E6', '#C9A24B', '#8B6B2A'],
    coverImage: 'assets/thumbs/1-book-cover-design-book-cover-mockup-3-1-1.jpg',
    galleryImages: [
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%203.1%201%20-%20Copy.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%204%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%204.1%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%205.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20Prototype%201%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20Prototype%202%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%201%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%202%201.jpg',
      'assets/Packaging%20Design/1_Book%20Cover%20Design/Book%20Cover%20mockup%203%201.jpg'
    ]
  },
  {
    title: 'JoJo Foods',
    category: 'Packaging',
    year: '2026',
    services: 'Packaging Design / Logo & Lettering / Mockups',
    summary: 'Retro-bright potato chip packaging built around a cream roundel mark, a red and orange sunburst and a clear window that lets the chips do the selling.',
    challenge: 'The snack aisle is loud. JoJo Foods needed a pouch that reads from across the shop, feels friendly rather than corporate, and still shows off the product inside.',
    approach: 'We put the JoJo Foods wordmark on a cream roundel so it holds its own against a high-energy red and orange sunburst. A chunky retro script carries "Crispy Snack" and the "Potato Chips" tag, and a clear window shows the product through the middle of the pack.',
    outcome: 'A bold, shelf-ready pouch with one clear focal point, a warm colour palette that suits the product and lettering that stays legible at a glance.',
    colours: ['#EC2934', '#EBE9E9', '#EE5930', '#FFDF56'],
    coverImage: 'assets/thumbs/jojo-foods-cover.jpg',
    galleryImages: [
      'assets/Packaging%20Design/2_JoJo%20Foods/jojo-01-hero.jpg',
      'assets/Packaging%20Design/2_JoJo%20Foods/jojo-02-pair.jpg',
      'assets/Packaging%20Design/2_JoJo%20Foods/jojo-03-mark.jpg',
      'assets/Packaging%20Design/2_JoJo%20Foods/jojo-04-colour.jpg',
      'assets/Packaging%20Design/2_JoJo%20Foods/jojo-05-detail.jpg'
    ]
  },
  {
    title: 'Proxima Exchange Films',
    category: 'Motion Design',
    year: '2026',
    services: 'Motion Design / 3D / Cinematic Direction / Sound Design',
    summary: 'Two launch films for a crypto and forex trading platform: a cinematic 3D brand film and a precise product film built from the real interface.',
    challenge: 'Proxima Exchange needed to feel trustworthy and premium in a category full of noise, and to show both the emotion of the brand and the real product in motion.',
    approach: 'We built the logo as a layered 3D object and shot it with a virtual camera: rack focus, light rays and lens streaks, a deep blue and gold grade, and a score cut to every hit. A second, frame-accurate film runs the actual website UI, live chart and markets table on the same timeline.',
    outcome: 'Two films that work together: a 40-second cinematic hook for campaigns and social, and a 30-second product film for the website and case studies. Concept project; figures shown are illustrative.',
    colours: ['#000081', '#ffffff', '#1C39BB', '#FFC000'],
    coverImage: 'assets/thumbs/proxima-exchange-films-cover.jpg',
    videos: [
      { title: 'Cinematic Film', src: 'assets/Motion%20Design/2_Proxima%20Exchange%20Films/proxima-exchange-cinematic.mp4', poster: 'assets/Motion%20Design/2_Proxima%20Exchange%20Films/poster-cinematic.jpg' },
      { title: 'Product Film', src: 'assets/Motion%20Design/2_Proxima%20Exchange%20Films/proxima-exchange-film.mp4', poster: 'assets/Motion%20Design/2_Proxima%20Exchange%20Films/poster-film.jpg' }
    ],
    galleryImages: [
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-01-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-02-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-03-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-04-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-05-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-06-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-07-cinematic.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-08-film.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-09-film.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-10-film.jpg',
      'assets/Motion%20Design/2_Proxima%20Exchange%20Films/still-11-film.jpg'
    ]
  },
  {
    title: 'Rovard Studios Brand Film',
    category: 'Motion Design',
    year: '2026',
    services: 'Motion Design / Kinetic Typography / Sound Design',
    summary: 'A 90-second brand film that turns the Rovard identity, services and selected work into one continuous piece of motion.',
    challenge: 'The studio needed a single film that could introduce who Rovard is, what it does and the quality of its work in under two minutes.',
    approach: 'We built every frame from the brand system itself: Syne and Space Grotesk kinetic type, the blue and yellow palette, real project work and a soundtrack composed to cut on every bar.',
    outcome: 'A premium, on-brand film ready for the website, social channels and pitch presentations.',
    colours: ['#000985', '#ffffff', '#162DAF', '#F5CC00'],
    coverImage: 'assets/thumbs/rovard-brand-film-cover.jpg',
    video: 'assets/Motion%20Design/1_Rovard%20Brand%20Film/rovard-brand-film.mp4',
    poster: 'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-01.jpg',
    galleryImages: [
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-02.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-03.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-04.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-05.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-06.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-07.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-08.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-09.jpg',
      'assets/Motion%20Design/1_Rovard%20Brand%20Film/film-10.jpg'
    ]
  },
  {
    title: 'Motion Project 03',
    category: 'Motion Design',
    year: '2026',
    services: 'Campaign Asset / Motion Identity',
    summary: 'A motion-led identity system designed to create tempo and presence without excess.',
    challenge: 'The brand needed motion assets that could feel modern and premium while still matching the broader visual discipline.',
    approach: 'We created a set of modular motion frames and transitions that could be reused across digital campaign moments.',
    outcome: 'A flexible motion toolkit that makes the brand feel more alive across digital channels.',
    colours: ['#162daf', '#f7f7f5', '#f5cc00', '#000985'],
    galleryImages: [
      makeGalleryAsset('Motion Project 03', ['#162daf', '#f7f7f5', '#f5cc00']),
      makeGalleryAsset('Transition', ['#162daf', '#f7f7f5', '#f5cc00']),
      makeGalleryAsset('Teaser', ['#162daf', '#f7f7f5', '#f5cc00']),
      makeGalleryAsset('Campaign', ['#162daf', '#f7f7f5', '#f5cc00']),
      makeGalleryAsset('Final Frame', ['#162daf', '#f7f7f5', '#f5cc00'])
    ]
  }
];

const portfolioGroupsData = [
  { key: 'Brand Identity Design', label: 'Brand Identity', id: 'brand-identity' },
  { key: 'Social Media Design', label: 'Social Media Design', id: 'social-media' },
  { key: 'UI Design', label: 'UI Design', id: 'ui-design' },
  { key: 'Packaging', label: 'Packaging', id: 'packaging' },
  { key: 'Motion Design', label: 'Motion Design', id: 'motion-design' }
];

const portfolioGroupsRoot = $('#portfolioGroups');

const getFilteredProjects = category => caseData
  .map((project, index) => ({ ...project, originalIndex: index }))
  .filter(project => project.category === category);

const formatSliderProgress = (stage, fill) => {
  const maxScroll = stage.scrollWidth - stage.clientWidth;
  if (!maxScroll) {
    fill.style.width = '100%';
    return;
  }

  const progress = (stage.scrollLeft / maxScroll) * 100;
  fill.style.width = `${Math.min(Math.max(progress, 8), 100)}%`;
};

/* Shared slider helpers. Sliders start flush left and end flush right (no empty
   lead-in space); the active card is the one nearest the centre, except at the
   two ends where the first / last card is always active. */
const pickActiveCard = (stage, cards) => {
  const maxScroll = stage.scrollWidth - stage.clientWidth;
  if (stage.scrollLeft <= 24) return cards[0];
  if (maxScroll > 0 && stage.scrollLeft >= maxScroll - 24) return cards[cards.length - 1];

  const stageRect = stage.getBoundingClientRect();
  const center = stageRect.left + stageRect.width / 2;
  let closest = cards[0];
  let closestDistance = Infinity;
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = card;
    }
  });
  return closest;
};

const scrollStageToCard = (stage, card) => {
  const inset = parseFloat(getComputedStyle(stage).scrollPaddingLeft) || 0;
  const left = stage.scrollLeft + card.getBoundingClientRect().left - stage.getBoundingClientRect().left - inset;
  stage.scrollTo({ left, behavior: 'smooth' });
};

/* Arrow stepping works from the card at the slider's left edge (not the highlighted
   centre card), so Previous / Next always move by one card and never stall at the ends. */
const stepStage = (stage, cards, dir) => {
  if (!cards.length) return;
  const first = cards[0].offsetLeft;
  const starts = cards.map(card => card.offsetLeft - first);
  const x = stage.scrollLeft;
  // Cards are scaled (.94 / 1.04), so a snapped card rests up to ~13px off its layout position.
  const TOL = 24;
  let left = 0;
  starts.forEach((start, i) => { if (start <= x + TOL) left = i; });
  const target = dir > 0
    ? Math.min(left + 1, cards.length - 1)
    : (x > starts[left] + TOL ? left : Math.max(left - 1, 0));
  stage.scrollTo({ left: starts[target], behavior: 'smooth' });
};

const syncActiveCard = stage => {
  const cards = [...stage.querySelectorAll('.portfolio-card')];
  if (!cards.length) return;
  const active = pickActiveCard(stage, cards);
  cards.forEach(card => card.classList.toggle('is-active', card === active));
};

const updateSliderEdgeSpace = () => { /* intentionally empty: no centred lead-in padding */ };

const renderPortfolioGroups = () => {
  if (!portfolioGroupsRoot) return;

  portfolioGroupsRoot.innerHTML = portfolioGroupsData.map(group => {
    const projects = getFilteredProjects(group.key);
    return `
      <div class="portfolio-group" data-group="${group.key}">
        <div class="portfolio-group-top">
          <span class="group-type">${group.label}</span>
        </div>

        <div class="portfolio-slider">
          <button class="slider-arrow prev" type="button" data-target="${group.key}" aria-label="Previous ${group.label} projects">←</button>

          <div class="slider-stage" data-stage="${group.key}" tabindex="0" aria-label="${group.label} project slider">
            <div class="slider-track" data-track="${group.key}">
              ${projects.map(project => {
      const image = project.coverImage || (project.galleryImages && project.galleryImages[0]) || '#';
      return `
                  <button
                    type="button"
                    class="portfolio-card"
                    data-original-index="${project.originalIndex}"
                    data-cursor-label="View case study"
                    aria-label="Open ${project.title} case study"
                  >
                    <span class="portfolio-card-media" data-bg="${image}"></span>
                    <span class="portfolio-card-copy">
                      <span class="portfolio-card-kicker">${project.category}</span>
                      <h3>${project.title}</h3>
                      <p>${project.summary}</p>
                      <span class="portfolio-card-meta">
                        <span>${project.year}</span>
                        <span>View case study</span>
                      </span>
                    </span>
                  </button>
                `;
    }).join('')}
            </div>
          </div>

          <button class="slider-arrow next" type="button" data-target="${group.key}" aria-label="Next ${group.label} projects">→</button>
        </div>

        <div class="slider-bar" aria-hidden="true">
          <span class="slider-fill" data-fill="${group.key}"></span>
        </div>
      </div>
    `;
  }).join('');

  // Only fetch a card's cover once it is near the viewport (or its slider's visible area).
  const mediaObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      mediaObserver.unobserve(el);
    });
  }, { rootMargin: '600px 300px' });
  $$('.portfolio-card-media[data-bg]').forEach(el => mediaObserver.observe(el));

  $$('.portfolio-card').forEach(card => {
    const index = Number(card.dataset.originalIndex);
    card.addEventListener('click', () => {
      const colours = caseData[index] && caseData[index].colours;
      if (window.RovardMotion) RovardMotion.curtainTo(() => openCase(index), colours);
      else openCase(index);
    });
  });

  $$('.slider-arrow').forEach(button => {
    button.addEventListener('click', () => {
      const stage = document.querySelector(`[data-stage="${button.dataset.target}"]`);
      if (!stage) return;

      stepStage(stage, [...stage.querySelectorAll('.portfolio-card')], button.classList.contains('next') ? 1 : -1);
    });
  });

  $$('.slider-stage').forEach(stage => {
    const fill = document.querySelector(`[data-fill="${stage.dataset.stage}"]`);
    updateSliderEdgeSpace(stage);
    if (fill) formatSliderProgress(stage, fill);
    syncActiveCard(stage);

    stage.addEventListener('scroll', () => {
      const progressFill = document.querySelector(`[data-fill="${stage.dataset.stage}"]`);
      if (progressFill) formatSliderProgress(stage, progressFill);
      syncActiveCard(stage);
    }, { passive: true });
  });

  window.addEventListener('resize', () => {
    $$('.slider-stage').forEach(stage => {
      updateSliderEdgeSpace(stage);
      syncActiveCard(stage);
    });
  }, { passive: true });
};

renderPortfolioGroups();

const caseModal = $('#caseModal');
const caseHero = $('#caseHero');

/* ── Bento layout engine ─────────────────────────────────────────────
   Every gallery image is measured first, each tile takes the slot
   shape whose proportions best match its aspect ratio, and the
   trailing tiles are re-shaped so the grid always closes cleanly
   (no holes, no ragged last row). First image always leads as the
   feature tile.                                                                              */
const BENTO_COLS = 4;
const BENTO_SHAPES = [
  { c: 2, r: 2, aspect: 1.35 }, // feature
  { c: 1, r: 1, aspect: 1.3 },  // standard
  { c: 2, r: 1, aspect: 2.7 },  // wide
  { c: 1, r: 2, aspect: 0.68 }  // tall
];

const shapeCost = (imageAspect, shape) => Math.abs(Math.log(imageAspect / shape.aspect));

const candidateShapes = imageAspect => {
  const ranked = BENTO_SHAPES
    .map(shape => ({ shape, cost: shapeCost(imageAspect, shape) }))
    .sort((a, b) => a.cost - b.cost || (b.shape.c * b.shape.r) - (a.shape.c * a.shape.r))
    .map(entry => entry.shape);
  // The feature and standard slots crop almost identically, so prefer the
  // standard tile as the default fit — features stay deliberate, which keeps
  // the grid varied instead of a wall of identical big tiles.
  if (ranked[0] === BENTO_SHAPES[0]) {
    const standard = BENTO_SHAPES[1];
    if (ranked.includes(standard) && shapeCost(imageAspect, standard) - shapeCost(imageAspect, ranked[0]) <= 0.1) {
      return [standard, ...ranked.filter(shape => shape !== standard)];
    }
  }
  return ranked;
};

function packBento(shapes) {
  const occupied = new Set();
  let placed = 0;
  let rows = 0;
  const isFree = (x, y, c, r) => {
    for (let dy = 0; dy < r; dy++) for (let dx = 0; dx < c; dx++) {
      if (x + dx >= BENTO_COLS || occupied.has(`${x + dx}:${y + dy}`)) return false;
    }
    return true;
  };
  shapes.forEach(shape => {
    for (let y = 0; y < 400; y++) {
      let done = false;
      for (let x = 0; x <= BENTO_COLS - shape.c; x++) {
        if (!isFree(x, y, shape.c, shape.r)) continue;
        for (let dy = 0; dy < shape.r; dy++) for (let dx = 0; dx < shape.c; dx++) occupied.add(`${x + dx}:${y + dy}`);
        placed++;
        rows = Math.max(rows, y + shape.r);
        done = true;
        break;
      }
      if (done) break;
    }
  });
  const area = shapes.reduce((sum, s) => sum + s.c * s.r, 0);
  return { rows, empty: rows * BENTO_COLS - area, unplaced: shapes.length - placed };
}

function composeBentoLayout(aspects) {
  const candidates = aspects.map((a, idx) => {
    const list = candidateShapes(a);
    // Deliberate rhythm: every fifth tile is promoted to a feature tile so
    // larger galleries breathe instead of collapsing into uniform grids.
    if (idx > 0 && idx % 5 === 0 && shapeCost(a, BENTO_SHAPES[0]) <= 0.5) {
      return [BENTO_SHAPES[0], ...list.filter(shape => shape !== BENTO_SHAPES[0])];
    }
    return list;
  });
  candidates[0] = [BENTO_SHAPES[0]]; // the lead image is always the feature tile

  let best = null;
  const maxTail = Math.min(3, candidates.length);

  for (let tail = 0; tail <= maxTail; tail++) {
    const split = candidates.length - tail;
    let combos = [[]];
    for (let i = split; i < candidates.length; i++) {
      const next = [];
      candidates[i].slice(0, 3).forEach(shape => combos.forEach(combo => next.push(combo.concat(shape))));
      combos = next;
    }
    combos.forEach(combo => {
      const shapes = candidates.slice(0, split).map(list => list[0]).concat(combo);
      const result = packBento(shapes);
      const crop = combo.reduce((sum, shape, i) => sum + shapeCost(aspects[split + i], shape), 0);
      const score = result.unplaced * 1000 + result.empty * 10 + result.rows + crop;
      if (!best || score < best.score) best = { score, shapes };
    });
  }

  return best ? best.shapes : candidates.map(list => list[0]);
}

function openCase(index) {
  const d = caseData[index];
  if (!d) return;
  $('#caseCategory').textContent = d.category.toUpperCase();
  $('#caseTitle').textContent = d.title;
  $('#caseSummary').textContent = d.summary;
  $('#caseYear').textContent = d.year;
  $('#caseServices').textContent = d.services;
  const facts = $('#caseFacts');
  if (facts) {
    const rows = [['Client', d.client], ['Industry', d.industry], ['Project type', d.type]].filter(r => r[1]);
    facts.hidden = !rows.length;
    facts.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
  $('#caseChallenge').textContent = d.challenge;
  $('#caseApproach').textContent = d.approach;
  $('#caseOutcome').textContent = d.outcome;
  const live = $('#caseLive');
  if (live) {
    live.hidden = !d.liveUrl;
    if (d.liveUrl) { live.href = d.liveUrl; live.textContent = d.liveLabel || 'View live project ↗'; }
  }

  caseHero.style.background = `linear-gradient(135deg, ${d.colours[2]}, ${d.colours[0]})`;
  $('#caseTitle').style.color = d.colours[1];

  const gallery = $('#caseGallery');
  gallery.innerHTML = '';
  setCaseVideo(d);
  renderMoreProjects(index);

  const galleryImages = d.galleryImages && d.galleryImages.length ? d.galleryImages : d.colours.map((_, i) => makeGalleryAsset(d.title, d.colours));

  const galleryToken = caseModal.dataset.galleryToken = String(Date.now());

  const tiles = galleryImages.map((src, idx) => {
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'case-gallery-item is-waiting';
    box.setAttribute('aria-label', `Open ${d.title} image ${idx + 1}`);

    const img = document.createElement('img');
    img.alt = `${d.title} image ${idx + 1}`;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.decoding = 'async';

    box.appendChild(img);
    box.addEventListener('click', () => openLightbox(galleryImages, idx, d.title));
    gallery.appendChild(box);
    return { box, img, src };
  });

  // Measure every image, then compose the bento grid around the real aspect ratios.
  Promise.all(tiles.map(tile => new Promise(resolve => {
    const probe = new Image();
    probe.onload = () => resolve(probe.naturalWidth && probe.naturalHeight ? probe.naturalWidth / probe.naturalHeight : 1);
    probe.onerror = () => resolve(1);
    probe.src = tile.src;
  }))).then(aspects => {
    if (caseModal.dataset.galleryToken !== galleryToken) return; // another case study opened meanwhile

    composeBentoLayout(aspects).forEach((shape, idx) => {
      const tile = tiles[idx];
      tile.box.style.gridColumn = `span ${shape.c}`;
      tile.box.style.gridRow = `span ${shape.r}`;
      tile.box.style.animation = `bentoIn .55s var(--ease) ${idx * 60}ms backwards`;
      tile.box.classList.remove('is-waiting');
      tile.img.src = tile.src;
    });
  });

  // One history entry per open case study, so the browser Back button closes it.
  // Switching between case studies replaces the entry instead of stacking another.
  if (!caseModal.classList.contains('open')) history.pushState({ rv: 'case' }, '');
  else if (history.state?.rv === 'case') history.replaceState({ rv: 'case' }, '');

  caseModal.classList.add('open');
  caseModal.setAttribute('aria-hidden', 'false');
  body.classList.add('no-scroll');
  $('.modal-scroll', caseModal).scrollTo({ top: 0 });
}
$$('.project-trigger').forEach(el => el.addEventListener('click', () => {
  const index = Number(el.dataset.project);
  const colours = caseData[index] && caseData[index].colours;
  if (window.RovardMotion) RovardMotion.curtainTo(() => openCase(index), colours);
  else openCase(index);
}));
$('.modal-close', caseModal)?.addEventListener('click', closeCase);
function setCaseVideo(d) {
  let wrap = $('#caseVideo');
  const list = d.videos && d.videos.length ? d.videos : (d.video ? [{ src: d.video, poster: d.poster }] : []);
  if (!list.length) {
    wrap?.remove();
    return;
  }
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'caseVideo';
    $('#caseGallery').before(wrap);
  }
  wrap.className = list.length > 1 ? 'case-video-group' : 'case-video';
  wrap.innerHTML = '';
  const players = [];
  list.forEach(item => {
    const box = list.length > 1 ? document.createElement('figure') : wrap;
    if (list.length > 1) box.className = 'case-video';
    const video = document.createElement('video');
    video.src = item.src;
    if (item.poster) video.poster = item.poster;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', `${d.title}${item.title ? ' — ' + item.title : ''} video`);
    video.addEventListener('play', () => players.forEach(v => { if (v !== video) v.pause(); }));
    players.push(video);
    box.appendChild(video);
    if (list.length > 1) {
      if (item.title) {
        const cap = document.createElement('figcaption');
        cap.textContent = item.title;
        box.appendChild(cap);
      }
      wrap.appendChild(box);
    }
  });
}

/* "More projects": three other case studies at the bottom of every case study.
   Prefers projects with real cover art, starting from the one after the current. */
function renderMoreProjects(currentIndex) {
  const section = $('#caseMore');
  const grid = $('#caseMoreGrid');
  if (!section || !grid) return;
  const others = caseData.map((p, i) => ({ p, i })).filter(({ i }) => i !== currentIndex);
  const ordered = others.slice(others.findIndex(({ i }) => i > currentIndex) >= 0 ? others.findIndex(({ i }) => i > currentIndex) : 0)
    .concat(others.slice(0, Math.max(0, others.findIndex(({ i }) => i > currentIndex))));
  const picks = ordered.filter(({ p }) => p.coverImage).concat(ordered.filter(({ p }) => !p.coverImage)).slice(0, 3);
  grid.innerHTML = '';
  picks.forEach(({ p, i }) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'case-more-card';
    card.setAttribute('aria-label', `Open ${p.title} case study`);
    const media = document.createElement('span');
    media.className = 'case-more-media';
    media.style.backgroundImage = `url('${p.coverImage || (p.galleryImages && p.galleryImages[0]) || ''}')`;
    const copy = document.createElement('span');
    copy.className = 'case-more-copy';
    const kicker = document.createElement('span');
    kicker.className = 'case-more-kicker';
    kicker.textContent = p.category;
    const title = document.createElement('h4');
    title.textContent = p.title;
    const go = document.createElement('span');
    go.className = 'case-more-go';
    go.textContent = 'View case study ↗';
    copy.append(kicker, title, go);
    card.append(media, copy);
    card.addEventListener('click', () => {
      $$('#caseVideo video').forEach(v => v.pause());
      if (window.RovardMotion) RovardMotion.curtainTo(() => openCase(i), p.colours);
      else openCase(i);
    });
    grid.appendChild(card);
  });
  section.hidden = !picks.length;
}

// Visual close only (used by the Back button handler).
function hideCase() {
  $$('#caseVideo video').forEach(v => v.pause());
  caseModal.classList.remove('open');
  caseModal.setAttribute('aria-hidden', 'true');
  body.classList.remove('no-scroll');
}

// Close from the UI (X, backdrop, Escape): hide, then consume the history entry we pushed.
function closeCase() {
  if (!caseModal.classList.contains('open')) return;
  hideCase();
  if (history.state?.rv === 'case') history.back();
}
caseModal.addEventListener('click', e => { if (e.target === caseModal) closeCase(); });

const galleryLightbox = $('#galleryLightbox');
const galleryLightboxImage = $('#galleryLightboxImage');
const galleryLightboxCounter = $('#galleryLightboxCounter');
const lbPrev = $('#galleryLightboxPrev');
const lbNext = $('#galleryLightboxNext');

let lbImages = [];
let lbIndex = 0;
let lbTitle = '';

const lbUpdateNav = () => {
  lbPrev.disabled = lbIndex === 0;
  lbNext.disabled = lbIndex === lbImages.length - 1;
  galleryLightboxCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
};

const lbShowImage = (idx, direction = 0) => {
  lbIndex = Math.max(0, Math.min(idx, lbImages.length - 1));
  const src = lbImages[lbIndex];
  if (!src) return;

  galleryLightboxImage.classList.add('transitioning');
  setTimeout(() => {
    galleryLightboxImage.src = src;
    galleryLightboxImage.alt = lbTitle;
    galleryLightboxImage.classList.remove('transitioning');
    lbUpdateNav();
  }, 200);
};

const openLightbox = (images, startIndex, title) => {
  lbImages = images;
  lbIndex = startIndex;
  lbTitle = title;
  galleryLightboxImage.src = images[startIndex];
  galleryLightboxImage.alt = title;
  galleryLightboxImage.classList.remove('transitioning');
  lbUpdateNav();
  if (!galleryLightbox.classList.contains('open')) history.pushState({ rv: 'lightbox' }, '');
  galleryLightbox.classList.add('open');
  galleryLightbox.setAttribute('aria-hidden', 'false');
  body.classList.add('no-scroll');
};

const hideLightbox = () => {
  galleryLightbox.classList.remove('open');
  galleryLightbox.setAttribute('aria-hidden', 'true');
  // keep the page locked if the case study is still open underneath
  if (!caseModal.classList.contains('open')) body.classList.remove('no-scroll');
};

const closeGalleryLightbox = () => {
  if (!galleryLightbox.classList.contains('open')) return;
  hideLightbox();
  if (history.state?.rv === 'lightbox') history.back();
};

/* Browser Back / Forward: close the top-most layer (image viewer, then case study). */
window.addEventListener('popstate', e => {
  const layer = e.state?.rv;
  if (layer !== 'lightbox' && galleryLightbox.classList.contains('open')) hideLightbox();
  if (layer !== 'lightbox' && layer !== 'case' && caseModal.classList.contains('open')) hideCase();
});

lbPrev?.addEventListener('click', () => lbShowImage(lbIndex - 1, -1));
lbNext?.addEventListener('click', () => lbShowImage(lbIndex + 1, 1));
$('#galleryLightboxClose')?.addEventListener('click', closeGalleryLightbox);
galleryLightbox?.addEventListener('click', e => { if (e.target === galleryLightbox) closeGalleryLightbox(); });

document.addEventListener('keydown', e => {
  if (!galleryLightbox?.classList.contains('open')) return;
  if (e.key === 'Escape') { closeGalleryLightbox(); e.stopImmediatePropagation(); }
  if (e.key === 'ArrowLeft') lbShowImage(lbIndex - 1, -1);
  if (e.key === 'ArrowRight') lbShowImage(lbIndex + 1, 1);
});

/* Testimonials — same snap-slider behaviour as the project sliders */
const tStage = $('.t-stage');
const tCards = $$('.t-card');
const tFill = $('#quoteProgress');

const syncTestimonials = () => {
  if (!tStage || !tCards.length) return;
  const active = pickActiveCard(tStage, tCards);
  tCards.forEach(card => card.classList.toggle('is-active', card === active));
  if (tFill) formatSliderProgress(tStage, tFill);
};

const setTestimonialEdges = syncTestimonials;

const stepTestimonial = dir => stepStage(tStage, tCards, dir);

if (tStage) {
  $('#prevQuote')?.addEventListener('click', () => stepTestimonial(-1));
  $('#nextQuote')?.addEventListener('click', () => stepTestimonial(1));
  tStage.addEventListener('scroll', syncTestimonials, { passive: true });
  tStage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepTestimonial(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepTestimonial(-1); }
  });
  window.addEventListener('resize', setTestimonialEdges, { passive: true });
  window.addEventListener('load', setTestimonialEdges);
  setTestimonialEdges();
}

/* Process storytelling */
const processData = [
  ['01', 'DISCOVER', 'Start with the real problem.', 'We learn the business, audience, context and objective before we decide what the design should look like.', '#162DAF', '#000985'],
  ['02', 'DEFINE', 'Turn context into direction.', 'We clarify the opportunity, positioning, audience and creative direction so the project has a clear north star.', '#D8A901', '#162DAF'],
  ['03', 'DESIGN', 'Make the idea visible.', 'We explore, develop and execute the visual solution across the places it needs to live.', '#F5CC00', '#D8A901'],
  ['04', 'REFINE', 'Make good work better.', 'We review, test, remove what is not working and sharpen what is until the system feels inevitable.', '#162DAF', '#F5CC00'],
  ['05', 'DELIVER', 'Leave you with a system.', 'You receive organized, production-ready files and the guidance needed to use the work confidently.', '#F5CC00', '#162DAF']
];
let processIndex = -1;
const processStage = $('.process-stage');
const processCopy = $('.process-copy');
const processVisual = $('#processVisual');
const processBigNumber = processVisual ? processVisual.querySelector('span') : null;

const setProcessStep = idx => {
  if (idx === processIndex || !processData[idx]) return;
  processIndex = idx;
  const d = processData[idx];
  $('#processNumber').textContent = d[0];
  $('#processLabel').textContent = d[1];
  $('#processTitle').textContent = d[2];
  $('#processText').textContent = d[3];
  if (processBigNumber) processBigNumber.textContent = d[0];
  $$('.process-index i').forEach((i, n) => i.classList.toggle('active', n === idx));

  // Replay the swap animation so each step change feels intentional.
  if (processCopy) {
    processCopy.classList.remove('swap');
    void processCopy.offsetWidth;
    processCopy.classList.add('swap');
  }
};

// Each step gets an equal share of the scroll distance the panel is actually pinned
// for, so no step is used up while the section is still scrolling into place.
const processSticky = $('.process-sticky');
const updateProcess = () => {
  if (!processStage || !processSticky) return;
  const rect = processStage.getBoundingClientRect();
  const pinTop = parseFloat(getComputedStyle(processSticky).top) || 0;
  const travel = Math.max(1, rect.height - processSticky.offsetHeight);
  const progress = Math.min(0.9999, Math.max(0, (pinTop - rect.top) / travel));
  setProcessStep(Math.floor(progress * processData.length));
};

let processRaf = null;
window.addEventListener('scroll', () => {
  if (processRaf == null) processRaf = requestAnimationFrame(() => {
    processRaf = null;
    updateProcess();
  });
}, { passive: true });
window.addEventListener('resize', updateProcess);
updateProcess();

/* Inquiry form */
const inquiryModal = $('#inquiryModal');
const openInquiry = $('#openInquiry');
const closeInquiry = () => {
  inquiryModal.classList.remove('open');
  inquiryModal.setAttribute('aria-hidden', 'true');
  body.classList.remove('no-scroll');
};
openInquiry?.addEventListener('click', () => {
  inquiryModal.classList.add('open');
  inquiryModal.setAttribute('aria-hidden', 'false');
  body.classList.add('no-scroll');
});
$$('.inquiry-close').forEach(b => b.addEventListener('click', closeInquiry));
inquiryModal.addEventListener('click', e => { if (e.target === inquiryModal) closeInquiry(); });
$('#modalProject')?.addEventListener('click', () => {
  hideCase();
  if (history.state?.rv === 'case') history.replaceState(null, '');
  openInquiry.click();
});

let currentStep = 1;
const totalSteps = 5;
const form = $('#projectForm');
const steps = $$('.form-step', form);

function updateForm() {
  steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === currentStep));
  $('#stepCount').textContent = `0${currentStep} / 05`;
  $('#inquiryProgress').style.width = `${(currentStep / totalSteps) * 100}%`;
  $('#prevStep').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  $('#nextStep').style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
  $('#submitForm').style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
  $('#formError').textContent = '';
}

function validateStep() {
  const active = $(`.form-step[data-step="${currentStep}"]`);
  const required = $$('input[required], textarea[required], select[required]', active);
  for (const field of required) {
    if (field.type === 'radio') {
      const group = $$(`input[name="${field.name}"]`, active);
      if (!group.some(r => r.checked)) return false;
    } else if (!field.value.trim()) {
      field.focus();
      return false;
    }
  }
  if (currentStep === 2 && !$$('input[name="services"]:checked', active).length) return false;
  const email = $('input[name="email"]', active);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.focus();
    return false;
  }
  return true;
}

$('#nextStep').addEventListener('click', () => {
  if (!validateStep()) {
    $('#formError').textContent = 'Please complete the required information before continuing.';
    return;
  }
  currentStep = Math.min(totalSteps, currentStep + 1);
  updateForm();
});
$('#prevStep').addEventListener('click', () => {
  currentStep = Math.max(1, currentStep - 1);
  updateForm();
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateStep()) {
    $('#formError').textContent = 'Please complete the required information before submitting.';
    return;
  }

  const data = new FormData(form);
  const payload = {};
  data.forEach((value, key) => {
    if (payload[key]) payload[key] += `, ${value}`;
    else payload[key] = value;
  });

  /*
    PRODUCTION SETUP:
    Replace FORM_ENDPOINT below with your real endpoint.
    Recommended: Formspree, Basin, a serverless function, or your own API.
    Example:
    const FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
  */
  const FORM_ENDPOINT = "";

  const submitButton = $('#submitForm');
  submitButton.disabled = true;
  submitButton.innerHTML = 'Sending…';

  try {
    if (FORM_ENDPOINT) {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Submission failed');
    } else {
      /*
        Demo mode: saves the inquiry locally so the interface can be tested.
        Connect FORM_ENDPOINT before launch.
      */
      localStorage.setItem('rovard_last_inquiry', JSON.stringify({
        ...payload,
        submittedAt: new Date().toISOString()
      }));
    }

    form.innerHTML = `
      <div class="form-step active" style="display:block;min-height:auto;padding:80px 0;text-align:center">
        <p class="eyebrow" style="color:var(--accent)">Inquiry received</p>
        <h2 style="margin:25px 0;font:600 clamp(3rem,7vw,7rem)/.9 Syne,sans-serif;letter-spacing:-.06em">Let's build<br><em style="color:var(--accent);font-style:normal">what's next.</em></h2>
        <p style="max-width:560px;margin:0 auto;color:var(--muted);line-height:1.6">Thank you. We'll review the brief and reach out to schedule a consultation.</p>
        <button type="button" class="primary-button" style="margin-top:35px" onclick="location.reload()">Back to Rovard <span>↗</span></button>
      </div>`;
  } catch (err) {
    $('#formError').textContent = 'Something went wrong. Please try again or email hello@rovardstudios.com.';
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send inquiry <span>↗</span>';
  }
});

updateForm();

/* Keyboard accessibility */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCase();
    closeInquiry();
    if (mobileMenu.classList.contains('open')) closeMobileMenu();
  }
});

/* Dynamic year */
$$('.footer-bottom').forEach(el => {
  el.innerHTML = el.innerHTML.replace('© 2026', `© ${new Date().getFullYear()}`);
});
