ROVARD STUDIOS WEBSITE

Files:
- index.html
- styles.css
- script.js
- robots.txt
- sitemap.xml

ASSETS TO ADD:
- assets/rovard-logo.svg
- assets/rovard-mark.svg
- assets/og-cover.jpg

Before launch:
1. Final domain is https://rovardstudio.com/ (already set in index.html, robots.txt, sitemap.xml and work pages).
   Per-project pages in /work/, service pages in /services/, sitemap.xml and llms.txt are generated: run `node tools/build_work_pages.js` after editing caseData in script.js or the service copy in tools/services.js.
2. Replace placeholder portfolio artwork with the real project images.
3. Connect FORM_ENDPOINT in script.js to Formspree, Basin, a serverless function, or your own API.
4. Replace placeholder testimonial names/content with real testimonials.
5. Add real social profile URLs.
6. Add real favicon/OG image.
7. Submit sitemap.xml to Google Search Console and Bing Webmaster Tools.
