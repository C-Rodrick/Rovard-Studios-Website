"""Cut the brand logos out of the project artwork into alpha-only masks: img/logos/<name>.png (white shape, transparent rest).
The site paints them with a CSS mask, so they sit in one muted colour and light up on hover."""
import os
from PIL import Image, ImageOps, ImageChops
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = r'C:/Users/PC/OneDrive/Desktop/Rovard-Studios-Website/assets/'
# name: (source, crop box, mode)  mode 'light' = light logo on dark bg, 'dark' = dark/colour logo on light bg
LOGOS = {
    'design-eigen': ('Brand Identitities/2_Design Eigen/imgi_200_f1f03a219180769.67ada23ebe1ae.jpg', (370, 330, 1440, 680), 'light'),
    'linkrithm': ('Brand Identitities/4_Linkrithm/linkrithm-cover.jpg', (230, 225, 800, 350), 'light'),
    'shorteeme': ('Social Media/1_ShorteeMe/Make something amazing 1.jpg', (160, 70, 530, 265), 'dark'),
    'green-blueprint': ('Brand Identitities/1_Green Blueprint/Cover 6.jpg', (60, 200, 640, 790), 'light'),
}
os.makedirs(os.path.join(ROOT, 'img', 'logos'), exist_ok=True)
for name, (src, box, mode) in LOGOS.items():
    im = Image.open(A + src).convert('RGB').crop(box)
    if mode == 'light':
        a = im.convert('L')
    else:
        a = ImageOps.invert(Image.merge('L', [ImageChops.darker(ImageChops.darker(*(im.split()[:2])), im.split()[2])]))
    lo, hi = (60, 200) if mode == 'light' else (40, 170)
    a = a.point(lambda v: 0 if v < lo else 255 if v > hi else int((v - lo) * 255 / (hi - lo)))
    bb = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    a = a.crop(bb)
    out = Image.new('RGBA', a.size, (255, 255, 255, 0)); out.putalpha(a)
    out = out.resize((min(a.width, 520), round(a.height * min(a.width, 520) / a.width)), Image.LANCZOS)
    out.save(os.path.join(ROOT, 'img', 'logos', name + '.png'), optimize=True)
    print(name, out.size)
