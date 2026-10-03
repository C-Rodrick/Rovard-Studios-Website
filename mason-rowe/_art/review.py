import sys, os
from PIL import Image
from pw import capture
pages = {
 'dev': 'website/development.html?d=halden-house',
 'devs': 'website/developments.html',
 'res': 'website/residences.html',
 'amen': 'website/amenities.html',
 'arch': 'website/architecture.html',
 'hood': 'website/neighborhood.html',
 'avail': 'website/availability.html',
 'pv': 'website/private-viewing.html',
 'about': 'website/about.html',
 'contact': 'website/contact.html',
}
which = sys.argv[1:] or list(pages)
mobile = False
if which and which[0] == '--mobile':
    mobile = True; which = which[1:] or list(pages)
for k in which:
    w, h = (390, 844) if mobile else (1440, 900)
    out = f'_shots/{"m_" if mobile else ""}{k}.png'
    print(k)
    capture(pages[k], out, w, h, full=True, mobile=mobile)
    im = Image.open(out); print('  size', im.size)
    chunk = 1900 if not mobile else 2400
    n = max(1, -(-im.height // chunk))
    tw = 720 if not mobile else 390
    for i in range(n):
        c = im.crop((0, i*chunk, im.width, min(im.height, (i+1)*chunk)))
        c = c.resize((tw, int(c.height * tw / c.width)))
        c.save(f'_shots/{"m_" if mobile else ""}{k}_{i}.png')
