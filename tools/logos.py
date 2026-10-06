"""Cut the brand logos out of the project artwork into alpha-only masks: img/logos/<name>.png (white shape, transparent rest).
The site paints them with a CSS mask, so they sit in one muted colour and light up on hover."""
import os
from PIL import Image, ImageOps, ImageChops, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = r'C:/Users/PC/OneDrive/Desktop/Rovard-Studios-Website/assets/'
# name: (source, crop box, mode)  mode 'light' = light logo on dark bg, 'dark' = dark/colour logo on light bg
LOGOS = {
    'design-eigen': ('Brand Identitities/2_Design Eigen/imgi_200_f1f03a219180769.67ada23ebe1ae.jpg', (370, 330, 1440, 680), 'light'),
    'linkrithm': ('Brand Identitities/4_Linkrithm/linkrithm-cover.jpg', (230, 225, 800, 350), 'light'),
    'shorteeme': ('Social Media/1_ShorteeMe/Make something amazing 1.jpg', (160, 70, 530, 265), 'dark'),
    'green-blueprint': ('Brand Identitities/1_Green Blueprint/Cover 6.jpg', (60, 200, 640, 790), 'light'),
    'gce-study-app': ('Social Media/6_GCE Study App/1.jpg', (218, 112, 582, 292), 'knock', 50, 130),
    'jojo-foods': ('Packaging Design/2_JoJo Foods/jojo-04-colour.jpg', (275, 585, 740, 1040), 'dark-oval', 95, 190),
    'bitefort': ('Brand Identitities/3_Bitefort/6.jpg', (640, 230, 890, 770), 'light-rot', None, None, (0, 0, .955, .76)),
    'northstar-capital': ('Brand Identitities/6_Northstar Capital/northstar-brand-05-logo-suite.jpg', (240, 480, 1020, 700), 'dark', 60, 170),
    'vita-house': ('Brand Identitities/5_Vita House/vita-brand-06-lockups.jpg', (340, 250, 680, 370), 'dark', 60, 170),
    'mason-and-rowe': ('Brand Identitities/7_Mason and Rowe/mr-brand-05-wordmark.jpg', (280, 290, 2090, 480), 'dark', 60, 170),
    'afaa-pay': ('UI Design/2_Afaa Pay/afaa-02-logo.jpg', (1340, 740, 1990, 935), 'light', 70, 190),
    'proxima-exchange': ('UI Design/1_Proxima Exchange/proxima-01-cover.jpg', (95, 80, 430, 190), 'light', 70, 170),
}
os.makedirs(os.path.join(ROOT, 'img', 'logos'), exist_ok=True)
for name, (src, box, mode, *opt) in LOGOS.items():
    olo, ohi, trim = (opt + [None, None, None])[:3]
    im = Image.open(A + src).convert('RGB').crop(box)
    if mode.endswith('-rot'):
        im = im.rotate(-90, expand=True); mode = mode[:-4]
    oval = mode.endswith('-oval')
    if oval:
        mode = mode[:-5]
    if mode == 'knock':
        a = ImageOps.invert(im.split()[0])
    elif mode == 'light':
        a = im.convert('L')
    else:
        a = ImageOps.invert(Image.merge('L', [ImageChops.darker(ImageChops.darker(*(im.split()[:2])), im.split()[2])]))
    lo, hi = (60, 200) if mode == 'light' else (30, 120) if mode == 'knock' else (40, 170)
    if olo is not None:
        lo, hi = olo, ohi
    if oval:
        m = Image.new('L', a.size, 0); ImageDraw.Draw(m).ellipse((14, 14, a.width - 14, a.height - 14), fill=255); a = ImageChops.multiply(a, m)
    if trim:
        w0, h0 = a.size; a = a.crop((round(trim[0] * w0), round(trim[1] * h0), round(trim[2] * w0), round(trim[3] * h0)))
    a = a.point(lambda v: 0 if v < lo else 255 if v > hi else int((v - lo) * 255 / (hi - lo)))
    bb = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    a = a.crop(bb)
    out = Image.new('RGBA', a.size, (255, 255, 255, 0)); out.putalpha(a)
    out = out.resize((min(a.width, 520), round(a.height * min(a.width, 520) / a.width)), Image.LANCZOS)
    out.save(os.path.join(ROOT, 'img', 'logos', name + '.png'), optimize=True)
    print(name, out.size)

# Coloured copies (img/logos/<name>-c.png) used by the site: plain <img>, no CSS masking needed.
sys_path = os.path.join(ROOT, 'tools')
import sys; sys.path.insert(0, sys_path)
from content import LOGO_COLOURS
for name, hexcol in LOGO_COLOURS.items():
    m = Image.open(os.path.join(ROOT, 'img', 'logos', name + '.png'))
    rgb = tuple(int(hexcol[i:i + 2], 16) for i in (1, 3, 5))
    c = Image.new('RGBA', m.size, rgb + (255,)); c.putalpha(m.getchannel('A'))
    c.save(os.path.join(ROOT, 'img', 'logos', name + '-c.png'), optimize=True)
print('coloured copies written')
