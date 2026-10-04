"""List every written form of the brand name in the generated pages (visible text + title/meta). Expect only ROVARD STUDIOS."""
import re, glob, html
SKIP = ('afaa-pay', 'mason-rowe', 'northstar-capital', 'vita-house', 'flyer', 'motion-video')
forms = {}
for f in glob.glob('**/index.html', recursive=True) + ['404.html']:
    if f.replace(chr(92), '/').split('/')[0] in SKIP:
        continue
    t = open(f, encoding='utf-8').read()
    vis = re.sub(r'<script.*?</script>|<style.*?</style>', '', t, flags=re.S)
    metas = ' '.join(m for tup in re.findall(r'<title>(.*?)</title>|<meta[^>]*content="([^"]*)"', t) for m in tup)
    vis = html.unescape(re.sub(r'<[^>]+>', ' ', vis) + ' ' + metas)
    for m in re.finditer(r'rovar\w*(?:\s+studios?)?', vis, flags=re.I):
        forms.setdefault(m.group(0).strip(), set()).add(f)
for k, v in sorted(forms.items()):
    print(repr(k), len(v), 'pages', sorted(v)[:3])
