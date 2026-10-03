"""Contact sheet of previews so many scenes can be reviewed in one look.
   py sheet.py a b c d  ->  _preview/_sheet.jpg
"""
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
names = sys.argv[1:]
cols = 2 if len(names) <= 4 else 3
tw = 760 if cols == 2 else 600
th = int(tw * 0.625)
rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    p = os.path.join(HERE, '_preview', n + '.jpg')
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
    sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
    d.text(((i % cols) * tw + 8, (i // cols) * th + 6), n, fill=(255, 255, 255))
sheet.save(os.path.join(HERE, '_preview', '_sheet.jpg'), quality=88)
print('ok')
