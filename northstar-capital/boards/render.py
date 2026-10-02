"""Render a board (boards/<name>.html, designed on a 1200x800 canvas) to a 2400x1600 JPG with headless Edge.

Usage (from the repo root, with `py -m http.server 8765` running there):
    py northstar-capital/boards/render.py "assets/Brand Identitities/6_Northstar Capital" brand-01-cover:northstar-brand-01-cover
The boards embed live pages from ../site and ../app in iframes, so they must be served over http.
"""
import os, subprocess, sys
from PIL import Image

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE = os.environ.get("BOARD_BASE", "http://127.0.0.1:8765/northstar-capital/boards/")

def render(name, dest_dir, out_name, wait=14000):
    png = os.path.abspath(out_name + ".png")
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1200,800",
                    "--force-device-scale-factor=2", "--virtual-time-budget=%d" % wait, "--screenshot=" + png, BASE + name + ".html"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    os.makedirs(dest_dir, exist_ok=True)
    Image.open(png).convert("RGB").save(os.path.join(dest_dir, out_name + ".jpg"), "JPEG", quality=90, optimize=True, progressive=True)
    os.remove(png)

if __name__ == "__main__":
    for item in sys.argv[2:]:
        name, _, out = item.partition(":")
        render(name, sys.argv[1], out or name)
