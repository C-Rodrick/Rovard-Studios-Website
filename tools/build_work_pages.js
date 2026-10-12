// Generates crawlable static pages at /work/<slug>/ from caseData in script.js,
// the "All projects" link list in index.html, and sitemap.xml.
// Run: node tools/build_work_pages.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://rovardstudio.com';
const TODAY = new Date().toISOString().slice(0, 10);

const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const data = eval(src.match(/const caseData = (\[[\s\S]*?\n\]);/)[1]);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const abs = p => '/' + p.replace(/^\/+/, '');
const jsonld = o => JSON.stringify(o, null, 2).replace(/</g, '\\u003c');

const pages = data.map(d => ({ d, slug: slugify(d.title) }));
const seen = new Set();
pages.forEach(p => { if (seen.has(p.slug)) throw new Error('duplicate slug ' + p.slug); seen.add(p.slug); });

const CSS = `
:root{--bg:#F7F7F5;--fg:#0b1030;--mut:#5a5d6b;--line:#dcdce0;--acc:#0b1a8a}
@media (prefers-color-scheme:dark){:root{--bg:#0a0b12;--fg:#f1f1f4;--mut:#a3a6b5;--line:#25283a;--acc:#8fa0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 "Space Grotesk",system-ui,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{padding:22px 0;border-bottom:1px solid var(--line)}header a{color:var(--fg);text-decoration:none;font-family:Syne,sans-serif;font-weight:700;letter-spacing:.04em}
nav.crumbs{font-size:14px;color:var(--mut);margin:28px 0 8px}nav.crumbs a{color:var(--mut)}
h1{font-family:Syne,sans-serif;font-size:clamp(34px,6vw,60px);line-height:1.05;margin:.2em 0 .3em}
h2{font-family:Syne,sans-serif;font-size:22px;margin:2em 0 .4em}
.kicker{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.lead{font-size:20px}.meta{display:flex;flex-wrap:wrap;gap:8px 28px;color:var(--mut);font-size:15px;margin:18px 0 28px}
.cover,.gallery img{width:100%;height:auto;border-radius:10px;border:1px solid var(--line);display:block}
.gallery{display:grid;gap:16px;margin-top:20px}
.note{border:1px solid var(--line);border-radius:10px;padding:14px 18px;color:var(--mut);font-size:15px;margin-top:24px}
.cta{display:inline-block;margin:32px 0;padding:14px 24px;background:var(--acc);color:#fff;border-radius:999px;text-decoration:none}
a{color:var(--acc)}footer{border-top:1px solid var(--line);padding:28px 0;color:var(--mut);font-size:14px;margin-top:40px}
`;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">';
const HEAD_ICONS = '<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">';

function page({ d, slug }) {
  const url = `${SITE}/work/${slug}/`;
  const concept = /concept/i.test(d.type || '') || /fictional/i.test(d.client || '');
  const cover = abs(d.coverImage || d.galleryImages[0]);
  const title = `${d.title} — ${d.category} | Rovard Studios`;
  const desc = d.summary.length > 158 ? d.summary.slice(0, 155).replace(/\s+\S*$/, '') + '…' : d.summary;
  const gallery = (d.galleryImages || []).slice(0, 8);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork', '@id': url + '#work', name: d.title, description: d.summary, url,
        image: SITE + cover, dateCreated: d.year, genre: d.category, inLanguage: 'en',
        creator: { '@type': 'Organization', name: 'Rovard Studios', url: SITE + '/' }
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Rovard Studios', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Work', item: SITE + '/#work' },
          { '@type': 'ListItem', position: 3, name: d.title, item: url }
        ]
      }
    ]
  };
  const live = d.liveUrl ? `<p><a href="${esc(abs(d.liveUrl))}">${esc(d.liveLabel || 'View the live concept site')} ↗</a></p>` : '';
  const alt = `${esc(d.title)} — ${esc(d.category)} by Rovard Studios`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Rovard Studios"><meta property="og:locale" content="en_CA">
<meta property="og:title" content="${esc(d.title)} — ${esc(d.category)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}${cover}"><meta property="og:image:alt" content="${alt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(d.title)} — ${esc(d.category)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}${cover}">
${HEAD_ICONS}
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">
${jsonld(ld)}
</script>
</head>
<body>
<header><div class="wrap"><a href="/">ROVARD STUDIOS</a></div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/#work">Work</a> / ${esc(d.title)}</nav>
<p class="kicker">${esc(d.category)} · ${esc(d.year)}</p>
<h1>${esc(d.title)}</h1>
<p class="lead">${esc(d.summary)}</p>
<div class="meta"><span><b>Services:</b> ${esc(d.services)}</span>${d.client ? `<span><b>Client:</b> ${esc(d.client)}</span>` : ''}${d.industry ? `<span><b>Industry:</b> ${esc(d.industry)}</span>` : ''}</div>
<img class="cover" src="${esc(cover)}" alt="${alt}" fetchpriority="high">
<h2>The challenge</h2><p>${esc(d.challenge)}</p>
<h2>The approach</h2><p>${esc(d.approach)}</p>
<h2>The outcome</h2><p>${esc(d.outcome)}</p>
${live}
${concept ? '<p class="note">Self-initiated concept project. The client and brand shown are fictional; figures and details are illustrative.</p>' : ''}
${gallery.length ? `<div class="gallery">${gallery.map((g, i) => `<img src="${esc(abs(g))}" alt="${esc(d.title)} — ${esc(d.category)}, image ${i + 1}" loading="lazy">`).join('')}</div>` : ''}
<a class="cta" href="/#contact">Start a project</a>
</main>
<footer><div class="wrap">© 2026 Rovard Studios · Canada · Worldwide · <a href="/">Back to all work</a></div></footer>
</body>
</html>
`;
}

pages.forEach(p => {
  const dir = path.join(ROOT, 'work', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(p));
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

// sitemap
const urls = [`  <url>
    <loc>${SITE}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${SITE}/assets/og-cover.jpg</image:loc></image:image>
  </url>`].concat(pages.map(p => `  <url>
    <loc>${SITE}/work/${p.slug}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>`));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);
console.log('pages:', pages.length);
