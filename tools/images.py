"""Build responsive WebP images for V2: img/<slug>/<idx>-<width>.webp  (idx 0 = cover, 1.. = gallery).
Also writes tools/manifest.json with source dimensions so pages can set width/height (no layout shift)."""
import json, os, re, sys, urllib.parse
from multiprocessing import Pool
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTHS = [560, 1100, 1600]


def slugify(t):
    t = t.lower().replace('&', 'and').replace("'", '')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def jobs():
    data = json.load(open(os.path.join(ROOT, 'tools', 'projects-raw.json'), encoding='utf-8'))
    out = []
    for p in data:
        slug = slugify(p['title'])
        srcs = [p['coverImage']] + p.get('galleryImages', [])
        for i, s in enumerate(srcs):
            out.append((slug, i, urllib.parse.unquote(s)))
    return out


def work(job):
    slug, i, src = job
    path = os.path.join(ROOT, src)
    d = os.path.join(ROOT, 'img', slug)
    os.makedirs(d, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(path))
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, (246, 242, 234))
        bg.paste(im, mask=im.split()[3])
        im = bg
    w0, h0 = im.size
    made = []
    # 560 and 1100 always (capped at source), then the largest of 1600 / native width
    targets = []
    for w in WIDTHS[:2] + [WIDTHS[2]]:
        tw = min(w, w0)
        if tw not in targets:
            targets.append(tw)
    for tw in targets:
        th = round(h0 * tw / w0)
        r = im.resize((tw, th), Image.LANCZOS) if tw != w0 else im
        r.save(os.path.join(d, f'{i:02d}-{tw}.webp'), 'WEBP', quality=78, method=5)
        made.append(tw)
    return slug, i, w0, h0, made


if __name__ == '__main__':
    js = jobs()
    print(len(js), 'images')
    with Pool(6) as pool:
        res = pool.map(work, js, chunksize=4)
    manifest = {}
    for slug, i, w, h, made in res:
        manifest.setdefault(slug, {})[str(i)] = {'w': w, 'h': h, 'sizes': made}
    json.dump(manifest, open(os.path.join(ROOT, 'tools', 'manifest.json'), 'w'), indent=1)
    tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(os.path.join(ROOT, 'img')) for f in fs)
    print('done', round(tot / 1e6, 1), 'MB')
