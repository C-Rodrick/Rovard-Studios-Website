"""Social share image (1200x630) for ROVARD STUDIOS: assets/og-cover.jpg"""
import os, skia
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
PAPER, INK, BLUE, YEL = (246, 242, 234), (23, 20, 15), (22, 45, 175), (245, 204, 0)
# logo (blue) via skia
data = skia.Data.MakeFromFileName(os.path.join(ROOT, 'assets', 'Combined Logo - Rovard Studios - Blue.svg'))
dom = skia.SVGDOM.MakeFromStream(skia.MemoryStream(data)); sz = dom.containerSize()
lw = 300; sc = lw / sz.width(); lh = int(sz.height() * sc) + 1
surf = skia.Surface(lw, lh); cv = surf.getCanvas(); cv.clear(skia.ColorTRANSPARENT); cv.scale(sc, sc); dom.render(cv)
arr = surf.makeImageSnapshot().toarray()[..., [2, 1, 0, 3]]  # skia gives BGRA
logo = Image.fromarray(arr.copy(), 'RGBA')
im = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(im)
f = ImageFont.truetype(os.path.join(ROOT, 'motion-video', 'fonts', 'Syne.ttf'), 70)
f.set_variation_by_axes([700])
lines = ["Whatever you're", "putting out there,", "we'll make it", "look right."]
x, y, lh_ = 80, 192, 84
for i, t in enumerate(lines):
    if i == 3:
        w = d.textlength(t, font=f)
        d.rectangle([x - 4, y + i * lh_ + 56, x + w + 4, y + i * lh_ + 77], fill=YEL)
    d.text((x, y + i * lh_), t, font=f, fill=INK)
im.paste(logo, (80, 52), logo)
fs = ImageFont.truetype(os.path.join(ROOT, 'motion-video', 'fonts', 'SpaceGrotesk.ttf'), 26); fs.set_variation_by_axes([500])
d.text((80, 560), 'Logos, flyers, websites, billboards, vehicle branding and more', font=fs, fill=(107, 101, 90))
d.rectangle([W - 60, 0, W, H], fill=BLUE)
d.rectangle([W - 60, 0, W, 90], fill=YEL)
im.save(os.path.join(ROOT, 'assets', 'og-cover.jpg'), quality=88, optimize=True)
print('og-cover.jpg', os.path.getsize(os.path.join(ROOT, 'assets', 'og-cover.jpg')) // 1024, 'KB')
