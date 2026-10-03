"""Photographer-style detail crops cut from the hero renders (native resolution, no upscaling)."""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.normpath(os.path.join(HERE, '..', 'website', 'img'))
CACHE = os.path.join(HERE, '_cache')

# name: (source, box in 2400x1500 design px, output width)
CROPS = {
    'halden-crown':   ('halden', (760, 0, 1760, 625), 1500),
    'halden-lobby':   ('halden', (700, 780, 1800, 1467), 1500),
    'halden-facade':  ('halden', (950, 380, 1750, 880), 1400),
    'averly-slabs':   ('averly', (1020, 140, 2020, 765), 1500),
    'averly-pier':    ('averly', (900, 800, 2150, 1581 - 100), 1500),
    'averly-bay':     ('averly', (0, 650, 1200, 1400), 1400),
    'wren-pavilion':  ('wren', (560, 480, 2060, 1080), 1500),
    'wren-pool':      ('wren', (0, 900, 2400, 1500), 1600),
    'wren-volume':    ('wren', (1250, 440, 2060, 780), 1300),
    'quarry-oak':     ('quarry', (0, 0, 1100, 1100), 1300),
    'quarry-entry':   ('quarry', (680, 500, 1540, 1140), 1400),
    'quarry-tower':   ('quarry', (1500, 200, 2300, 1100), 1100),
}

for name, (src, box, w) in CROPS.items():
    im = Image.open(os.path.join(CACHE, f'hi_{src}.jpg'))
    sx = im.width / 2400.0
    b = tuple(int(v * sx) for v in box)
    b = (b[0], b[1], min(b[2], im.width), min(b[3], im.height))
    c = im.crop(b)
    if c.width > w:
        c = c.resize((w, int(c.height * w / c.width)), Image.LANCZOS)
    out = os.path.join(IMG, name + '.jpg')
    c.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    print(name, c.size, os.path.getsize(out) // 1024, 'KB')
