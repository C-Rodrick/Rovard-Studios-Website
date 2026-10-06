"""Square the supplied R tile and write favicon.ico + PNG sizes (assets/favicon/)."""
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, 'assets', 'favicon-source.png')).convert('RGBA')
s = min(src.size); l, t = (src.width - s) // 2, (src.height - s) // 2
sq = src.crop((l, t, l + s, t + s))
out = os.path.join(ROOT, 'assets', 'favicon'); os.makedirs(out, exist_ok=True)
for n in (16, 32, 48, 180, 192, 512):
    sq.resize((n, n), Image.LANCZOS).save(os.path.join(out, f'icon-{n}.png'), optimize=True)
sq.resize((256, 256), Image.LANCZOS).save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
print('favicons written')
