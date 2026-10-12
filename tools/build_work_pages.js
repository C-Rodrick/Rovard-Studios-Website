// Generates crawlable static pages at /work/<slug>/ from caseData in script.js,
// service landing pages at /services/<slug>/ from tools/services.js,
// the "All projects" link list in index.html, and sitemap.xml.
// Run: node tools/build_work_pages.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const SERVICES = require('./services');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://rovardstudio.com';
const TODAY = new Date().toISOString().slice(0, 10);

const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const data = eval(src.match(/const caseData = (\[[\s\S]*?\n\]);/)[1]);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const abs = p => '/' + p.replace(/^\/+/, '');
const jsonld = o => JSON.stringify(o, null, 2).replace(/</g, '\\u003c');
const clip = s => s.length > 158 ? s.slice(0, 155).replace(/\s+\S*$/, '') + '…' : s;
const localFile = webPath => path.join(ROOT, decodeURIComponent(webPath.replace(/^\/+/, '')));

// Intrinsic size of a local JPEG/PNG so each <img> gets width/height (no layout shift).
function imgSize(webPath) {
  try {
    const b = fs.readFileSync(localFile(webPath));
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch { }
  return null;
}
const dims = p => { const s = imgSize(p); return s ? ` width="${s.w}" height="${s.h}"` : ''; };

// Date a file was first committed, for VideoObject.uploadDate.
function addedDate(webPath) {
  try {
    const rel = decodeURIComponent(webPath.replace(/^\/+/, ''));
    const out = execSync(`git log --diff-filter=A --format=%aI -- "${rel}"`, { cwd: ROOT }).toString().trim().split('\n').pop();
    if (out) return out;
  } catch { }
  return TODAY;
}

const pages = data.map(d => ({ d, slug: slugify(d.title) }));
const seen = new Set();
pages.forEach(p => { if (seen.has(p.slug)) throw new Error('duplicate slug ' + p.slug); seen.add(p.slug); });

const serviceFor = d => SERVICES.find(s => s.categories.includes(d.category) && !s.liveOnly);
const projectsFor = s => pages.filter(p => s.categories.includes(p.d.category) && (!s.liveOnly || p.d.liveUrl));

const CSS = `
:root{--bg:#F7F7F5;--fg:#0b1030;--mut:#5a5d6b;--line:#dcdce0;--acc:#0b1a8a}
@media (prefers-color-scheme:dark){:root{--bg:#0a0b12;--fg:#f1f1f4;--mut:#a3a6b5;--line:#25283a;--acc:#8fa0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 "Space Grotesk",system-ui,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{padding:22px 0;border-bottom:1px solid var(--line)}header .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;justify-content:space-between}
header a{color:var(--fg);text-decoration:none}header .home{font-family:Syne,sans-serif;font-weight:700;letter-spacing:.04em}
header nav{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:15px}header nav a{color:var(--mut)}
nav.crumbs{font-size:14px;color:var(--mut);margin:28px 0 8px}nav.crumbs a{color:var(--mut)}
h1{font-family:Syne,sans-serif;font-size:clamp(34px,6vw,60px);line-height:1.05;margin:.2em 0 .3em}
h2{font-family:Syne,sans-serif;font-size:22px;margin:2em 0 .4em}h3{font-size:18px;margin:1.4em 0 .2em}
.kicker{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.lead{font-size:20px}.meta{display:flex;flex-wrap:wrap;gap:8px 28px;color:var(--mut);font-size:15px;margin:18px 0 28px}
.cover,.gallery img,.film video{width:100%;height:auto;border-radius:10px;border:1px solid var(--line);display:block}
.gallery{display:grid;gap:16px;margin-top:20px}.film{margin:20px 0}.film figcaption{color:var(--mut);font-size:14px;margin-top:6px}
.note{border:1px solid var(--line);border-radius:10px;padding:14px 18px;color:var(--mut);font-size:15px;margin-top:24px}
.cta{display:inline-block;margin:32px 0;padding:14px 24px;background:var(--acc);color:#fff;border-radius:999px;text-decoration:none}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:16px;padding:0;list-style:none}
.cards a{display:block;color:var(--fg);text-decoration:none}.cards img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px;border:1px solid var(--line);display:block}
.cards b{display:block;margin-top:10px}.cards span{color:var(--mut);font-size:15px}
ul.list{padding-left:20px}ul.list li{margin:4px 0}
a{color:var(--acc)}footer{border-top:1px solid var(--line);padding:28px 0;color:var(--mut);font-size:14px;margin-top:40px}
footer p{margin:6px 0}
`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">';
const HEAD_ICONS = '<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">';
const ORG = { '@type': 'Organization', '@id': SITE + '/#organization', name: 'Rovard Studios', url: SITE + '/' };

function head({ title, desc, url, image, imageAlt, ogType, ld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="Rovard Studios"><meta property="og:locale" content="en_CA">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}${image}"><meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}${image}">
${HEAD_ICONS}
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">
${jsonld({ '@context': 'https://schema.org', '@graph': ld })}
</script>
</head>
<body>
<header><div class="wrap"><a class="home" href="/">ROVARD STUDIOS</a><nav aria-label="Primary">${SERVICES.map(s => `<a href="/services/${s.slug}/">${esc(s.name)}</a>`).join('')}</nav></div></header>
`;
}

const FOOT = `<footer><div class="wrap"><p>${SERVICES.map(s => `<a href="/services/${s.slug}/">${esc(s.name)}</a>`).join(' · ')}</p><p>© 2026 Rovard Studios · Canada · Worldwide · <a href="/">Back to all work</a> · <a href="mailto:hello@rovardstudio.com">hello@rovardstudio.com</a></p></div></footer>
</body>
</html>
`;

const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item }))
});

const card = p => {
  const cover = abs(p.d.coverImage || p.d.galleryImages[0]);
  return `<li><a href="/work/${p.slug}/"><img src="${esc(cover)}" alt="${esc(p.d.title)} — ${esc(p.d.category)}"${dims(cover)} loading="lazy"><b>${esc(p.d.title)}</b><span>${esc(p.d.summary.length > 110 ? p.d.summary.slice(0, 107).replace(/\s+\S*$/, '') + '…' : p.d.summary)}</span></a></li>`;
};

function videosOf(d) {
  if (d.videos) return d.videos;
  if (d.video) return [{ title: d.title, src: d.video, poster: d.poster }];
  return [];
}

function workPage({ d, slug }) {
  const url = `${SITE}/work/${slug}/`;
  const concept = /concept/i.test(d.type || '') || /fictional/i.test(d.client || '');
  const cover = abs(d.coverImage || d.galleryImages[0]);
  const desc = clip(d.summary);
  const gallery = (d.galleryImages || []).slice(0, 8).map(abs);
  const svc = serviceFor(d);
  const vids = videosOf(d);
  const more = pages.filter(p => p.d.category === d.category && p.slug !== slug).slice(0, 3);
  const alt = `${d.title} — ${d.category} by Rovard Studios`;

  const ld = [
    {
      '@type': 'CreativeWork', '@id': url + '#work', name: d.title, description: d.summary, url,
      image: SITE + cover, dateCreated: d.year, genre: d.category, inLanguage: 'en',
      creator: ORG
    },
    ...vids.map(v => ({
      '@type': 'VideoObject',
      name: v.title === d.title ? `${d.title} — ${d.category}` : `${d.title}: ${v.title}`,
      description: d.summary,
      thumbnailUrl: SITE + abs(v.poster || d.coverImage),
      contentUrl: SITE + abs(v.src),
      uploadDate: addedDate(v.src),
      embedUrl: url,
      publisher: ORG
    })),
    crumbs([['Rovard Studios', SITE + '/'], ...(svc ? [[svc.name, `${SITE}/services/${svc.slug}/`]] : []), [d.title, url]])
  ];

  const live = d.liveUrl ? `<p><a href="${esc(abs(d.liveUrl))}">${esc(d.liveLabel || 'View the live concept site')} ↗</a></p>` : '';
  const films = vids.map(v => `<figure class="film"><video controls preload="none" playsinline poster="${esc(abs(v.poster || d.coverImage))}"${dims(abs(v.poster || d.coverImage))}><source src="${esc(abs(v.src))}" type="video/mp4"></video><figcaption>${esc(v.title)}</figcaption></figure>`).join('');

  return head({ title: `${d.title} — ${d.category} | Rovard Studios`, desc, url, image: cover, imageAlt: alt, ogType: 'article', ld }) + `<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / ${svc ? `<a href="/services/${svc.slug}/">${esc(svc.name)}</a>` : '<a href="/#work">Work</a>'} / ${esc(d.title)}</nav>
<p class="kicker">${esc(d.category)} · ${esc(d.year)}</p>
<h1>${esc(d.title)}</h1>
<p class="lead">${esc(d.summary)}</p>
<div class="meta"><span><b>Services:</b> ${esc(d.services)}</span>${d.client ? `<span><b>Client:</b> ${esc(d.client)}</span>` : ''}${d.industry ? `<span><b>Industry:</b> ${esc(d.industry)}</span>` : ''}</div>
<img class="cover" src="${esc(cover)}" alt="${esc(alt)}"${dims(cover)} fetchpriority="high">
<h2>The challenge</h2><p>${esc(d.challenge)}</p>
<h2>The approach</h2><p>${esc(d.approach)}</p>
<h2>The outcome</h2><p>${esc(d.outcome)}</p>
${live}
${concept ? '<p class="note">Self-initiated concept project. The client and brand shown are fictional; figures and details are illustrative.</p>' : ''}
${films}
${gallery.length ? `<div class="gallery">${gallery.map((g, i) => `<img src="${esc(g)}" alt="${esc(d.title)} — ${esc(d.category)}, image ${i + 1}"${dims(g)} loading="lazy" decoding="async">`).join('')}</div>` : ''}
${svc ? `<p>Planning something similar? See our <a href="/services/${svc.slug}/">${esc(svc.name.toLowerCase())} service</a>.</p>` : ''}
<a class="cta" href="/#contact">Start a project</a>
${more.length ? `<h2>More ${esc(d.category.toLowerCase())} work</h2><ul class="cards">${more.map(card).join('')}</ul>` : ''}
</main>
` + FOOT;
}

function servicePage(s) {
  const url = `${SITE}/services/${s.slug}/`;
  const work = projectsFor(s);
  const image = work.length ? abs(work[0].d.coverImage || work[0].d.galleryImages[0]) : '/assets/og-cover.jpg';
  const ld = [
    {
      '@type': 'Service', '@id': url + '#service', name: s.name, serviceType: s.name, description: s.description, url,
      provider: ORG, areaServed: [{ '@type': 'Country', name: 'Canada' }, 'Worldwide'],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: `${s.name} deliverables`, itemListElement: s.deliverables.map(x => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x } })) }
    },
    {
      '@type': 'FAQPage', '@id': url + '#faq',
      mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    },
    crumbs([['Rovard Studios', SITE + '/'], ['Services', SITE + '/#services'], [s.name, url]])
  ];
  return head({ title: `${s.title} | Rovard Studios`, desc: clip(s.description), url, image, imageAlt: `${s.name} by Rovard Studios`, ogType: 'website', ld }) + `<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#services">Services</a> / ${esc(s.name)}</nav>
<p class="kicker">Service · Canada · Worldwide</p>
<h1>${esc(s.title)}</h1>
<p class="lead">${esc(s.lead)}</p>
${s.sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('\n')}
<h2>What's included</h2>
<ul class="list">${s.deliverables.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Our process</h2>
<p>Discover the real problem, define the direction, design the solution, refine it until it holds together, and deliver organized, production-ready files with the guidance to use them.</p>
<a class="cta" href="/#contact">Start a ${esc(s.name.toLowerCase())} project</a>
${work.length ? `<h2>Selected ${esc(s.name.toLowerCase())} work</h2><ul class="cards">${work.map(card).join('')}</ul>` : ''}
<h2>Frequently asked questions</h2>
${s.faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}
<h2>Other services</h2>
<p>${SERVICES.filter(o => o !== s).map(o => `<a href="/services/${o.slug}/">${esc(o.name)}</a>`).join(' · ')}</p>
</main>
` + FOOT;
}

pages.forEach(p => {
  const dir = path.join(ROOT, 'work', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), workPage(p));
});
SERVICES.forEach(s => {
  const dir = path.join(ROOT, 'services', s.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), servicePage(s));
});

// "All projects" crawlable list in index.html
const groups = {};
pages.forEach(p => (groups[p.d.category] = groups[p.d.category] || []).push(p));
const list = `<!-- work-index:start -->
    <section class="work-index" aria-label="All projects">
      <div class="footer-links">
${Object.entries(groups).map(([cat, ps]) => `        <div><span>${esc(cat)}</span>${ps.map(p => `<a href="/work/${p.slug}/">${esc(p.d.title)}</a>`).join('')}</div>`).join('\n')}
      </div>
    </section>
    <!-- work-index:end -->`;
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (html.includes('<!-- work-index:start -->')) {
  html = html.replace(/<!-- work-index:start -->[\s\S]*?<!-- work-index:end -->/, () => list);
} else {
  html = html.replace('<div class="footer-bottom">', () => list + '\n    <div class="footer-bottom">');
}
fs.writeFileSync(path.join(ROOT, 'index.html'), html);

// sitemap (with image entries so project artwork can surface in image search)
const imgTags = imgs => imgs.map(i => `\n    <image:image><image:loc>${SITE}${esc(i)}</image:loc></image:image>`).join('');
const entry = (loc, freq, prio, imgs = []) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>${imgTags(imgs)}
  </url>`;
const urls = [entry(`${SITE}/`, 'monthly', '1.0', ['/assets/og-cover.jpg'])]
  .concat(SERVICES.map(s => entry(`${SITE}/services/${s.slug}/`, 'monthly', '0.9')))
  .concat(pages.map(p => entry(`${SITE}/work/${p.slug}/`, 'yearly', '0.7',
    [p.d.coverImage, ...(p.d.galleryImages || []).slice(0, 8)].filter(Boolean).map(abs))));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);
// llms.txt: plain summary for AI search tools
fs.writeFileSync(path.join(ROOT, 'llms.txt'), `# Rovard Studios

> Independent branding and design studio based in Canada, working with businesses worldwide. Brand identity, website, UI, social media, packaging and motion design.

Contact: hello@rovardstudio.com · Start a project: ${SITE}/#contact

## Services

${SERVICES.map(s => `- [${s.name}](${SITE}/services/${s.slug}/): ${s.description}`).join('\n')}

## Selected work

${pages.map(p => `- [${p.d.title}](${SITE}/work/${p.slug}/) (${p.d.category}${/fictional/i.test(p.d.client || '') ? ', self-initiated concept' : ''}): ${p.d.summary}`).join('\n')}
`);

console.log('work pages:', pages.length, '· service pages:', SERVICES.length);
