"""Creative Edition: make web-sized WebP copies of every project image.

Run from anywhere:  python tools/edition/images.py
Reads tools/edition/projects.json, writes edition/img/<slug>/ and records each
image's size back into projects.json. Originals in assets/ are never changed.
Needs Pillow (pip install pillow).
"""
import json, os, urllib.parse
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, 'tools', 'edition', 'projects.json')


def make(src, dst, width, q=80):
    src = os.path.join(ROOT, urllib.parse.unquote(src))
    out = os.path.join(ROOT, dst)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
        im.save(out, 'WEBP', quality=q, method=6)
    return [im.width, im.height]


def main():
    projects = json.load(open(DATA, encoding='utf-8'))
    for p in projects:
        s = p['slug']
        p['cover'] = {'src': f'edition/img/{s}/cover.webp',
                      'size': make(p['coverImage'], f'edition/img/{s}/cover.webp', 1400)}
        p['gallery'] = []
        for i, g in enumerate(p.get('galleryImages', []), 1):
            dst = f'edition/img/{s}/{i:02d}.webp'
            p['gallery'].append({'src': dst, 'size': make(g, dst, 1800)})
        print(s, len(p['gallery']))
    json.dump(projects, open(DATA, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
