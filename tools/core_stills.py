"""Render the still images of the ROVARD Core (fallback for reduced motion, weak GPUs and phones) from the live scene itself,
so the stills can never drift from the real object. Needs a local server on :8123.

    python tools/core_stills.py
"""
import base64, io, json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'img', 'core')
BASE = 'http://localhost:8123/'
FLUID = dict(x=0, y=0, s=.62, rx=-.1, ry=.3, fluid=1, strata=0, block=0, seed=0, r=0, burst=0, tint=.16, rough=.08, dust=.8)
POSES = {
    'hero': FLUID,
    'idea': dict(FLUID, s=.36, fluid=.1, seed=.9, burst=1.2, tint=.05, rough=.05, dust=.9),
    'thinking': dict(FLUID, s=.62, fluid=0, strata=1, rx=.25, ry=.6, burst=.4, tint=.2, rough=.16, dust=.5),
    'design': dict(FLUID, s=.56, fluid=0, block=1, r=1, rx=-.08, ry=-.32, tint=1, rough=.26, dust=.3),
    'experience': dict(FLUID, s=.56, fluid=.55, block=.45, rx=.1, ry=.45, burst=1.6, tint=.3, rough=.08, dust=.95),
    'cta': dict(FLUID, s=.56, fluid=0, block=1, r=1, rx=-.06, ry=-.34, tint=1, rough=.22, dust=0),
}

with Browser(900, 900) as b:
    b.goto(BASE)
    b.js("localStorage.setItem('rv-seen','1')")
    b.goto(BASE + '?core=poster')
    for _ in range(120):
        b.wait(500)
        if b.js('!!window.__rovardCore'):
            break
    else:
        raise SystemExit('Core did not start')
    b.js("window.__rovardCore.setActive(false); window.scrollTo(0,0); document.querySelector('.core-canvas').style.opacity=1")
    b.wait(800)
    for name, pose in POSES.items():
        data = b.js(f"(()=>{{const c=window.__rovardCore;c.jump({json.dumps(pose)});return document.querySelector('.core-canvas').toDataURL('image/png')}})()")
        im = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1]))).convert('RGBA')
        path = os.path.join(OUT, name + '.webp')
        im.save(path, 'WEBP', quality=82, method=6)
        print(name, im.size, os.path.getsize(path) // 1024, 'KB')
