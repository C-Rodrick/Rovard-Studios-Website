"""Silent mini showreel of our own project mockups: video/showreel.mp4 (+ poster). Run: python tools/showreel.py"""
import json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS = 1440, 1080, 30
HOLD, FADE = 1.0, 0.28                       # seconds per scene, dissolve length
SCENES = [('green-blueprint', 1), ('bitefort', 2), ('jojo-foods', 1), ('design-eigen', 1), ('linkrithm', 5), ('green-blueprint', 4),
          ('bitefort', 3), ('linkrithm', 9), ('bitefort', 7), ('green-blueprint', 6), ('proxima-exchange', 3), ('jojo-foods', 2),
          ('linkrithm', 10), ('bitefort', 6), ('green-blueprint', 9), ('afaa-pay', 4)]
man = json.load(open(os.path.join(ROOT, 'tools', 'manifest.json')))


def load(slug, idx):
    mx = max(man[slug][str(idx)]['sizes'])
    return Image.open(os.path.join(ROOT, 'img', slug, f'{idx:02d}-{mx}.webp')).convert('RGB')


def cover(im, scale, ox, oy):
    """Crop to W:H at a zoom, panning by (ox, oy) in -1..1."""
    iw, ih = im.size
    base = max(W / iw, H / ih)
    cw, ch = W / (base * scale), H / (base * scale)
    x = (iw - cw) / 2 + ox * (iw - cw) / 2
    y = (ih - ch) / 2 + oy * (ih - ch) / 2
    return im.resize((W, H), Image.BICUBIC, box=(x, y, x + cw, y + ch))


def end_card():
    im = Image.new('RGB', (W, H))
    px = np.zeros((H, W, 3), np.float32)
    g = np.linspace(0, 1, H)[:, None]
    c0, c1 = np.array([22, 45, 175], np.float32), np.array([0, 9, 133], np.float32)
    px[:] = (c0 * (1 - g) + c1 * g)[:, None, :].reshape(H, 1, 3)
    im = Image.fromarray(px.astype(np.uint8))
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(os.path.join(ROOT, 'motion-video', 'fonts', 'Syne.ttf'), 118)
    f2 = ImageFont.truetype(os.path.join(ROOT, 'motion-video', 'fonts', 'SpaceGrotesk.ttf'), 40)
    for text, f, y, col in (('ROVARD STUDIOS', f1, H / 2 - 90, (255, 255, 255)), ("Whatever you're putting out there,", f2, H / 2 + 70, (200, 215, 255)), ("we'll make it look right.", f2, H / 2 + 122, (245, 204, 0))):
        w = d.textlength(text, font=f)
        d.text(((W - w) / 2, y), text, font=f, fill=col)
    return im


frames_per = int(HOLD * FPS); fade = int(FADE * FPS)
imgs = [load(*s) for s in SCENES]
cards = [(im, i) for i, im in enumerate(imgs)]


def scene_frame(i, t):
    """t in 0..1 across the scene (extended into the dissolve)."""
    d = 1 if i % 2 == 0 else -1
    return np.asarray(cover(imgs[i], 1.0 + 0.09 * t, d * (0.5 - t) * 0.6, ((i % 3) - 1) * 0.25 * (t - .5)), np.float32)


end = np.asarray(end_card(), np.float32)
ff = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs(os.path.join(ROOT, 'video'), exist_ok=True)
out = os.path.join(ROOT, 'video', 'showreel.mp4')
p = subprocess.Popen([ff, '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
                      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
n = len(imgs)
poster_done = False
for i in range(n + 1):
    last = i == n
    total = frames_per if not last else int(1.6 * FPS)
    for f in range(total):
        t = f / frames_per
        cur = end if last else scene_frame(i, min(t, 1.2))
        if f >= total - fade and not last:  # dissolve into the next scene
            k = (f - (total - fade) + 1) / fade
            nxt = end if i + 1 == n else scene_frame(i + 1, 0)
            k = k * k * (3 - 2 * k)
            cur = cur * (1 - k) + nxt * k
        if i == 3 and f == 20 and not poster_done:
            Image.fromarray(cur.astype(np.uint8)).save(os.path.join(ROOT, 'video', 'showreel-poster.webp'), quality=82); poster_done = True
        p.stdin.write(cur.astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
print('showreel', round(os.path.getsize(out) / 1024), 'KB')
