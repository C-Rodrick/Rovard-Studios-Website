"""City skylines — one per market. Generic, fictional silhouettes (no real landmarks)."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa
from ext3 import ridge, palm  # noqa


def stepped_tower(sc, x, base, w, h, color, rng, tiers=3, lit=0.22, spire=True, win_dark=None):
    cv, gl = sc.cv, sc.gl
    cw, y = w, base
    seg = h / tiers
    cx = x + w / 2
    for t in range(tiers):
        top = y - seg * (1.15 if t == 0 else 1.0)
        rect(cv, cx - cw / 2, top, cx + cw / 2, y, P(color))
        rect(cv, cx - cw / 2, top, cx - cw / 2 + cw * 0.12, y, P('#ffffff', 0.05))
        rows = max(2, int((y - top) / 15))
        cols = max(2, int(cw / 11))
        for r in range(rows):
            for c in range(cols):
                if rng.random() < lit:
                    wx = cx - cw / 2 + 4 + c * (cw - 8) / cols
                    wy = top + 5 + r * (y - top - 8) / rows
                    rect(cv, wx, wy, wx + 4.5, wy + 6, P(rng.choice(['#f6d39a', '#f1c27c', '#ffe5b8']), rng.uniform(0.5, 0.95)))
                    rect(gl, wx, wy, wx + 4.5, wy + 6, P('#f1c27c', 0.35))
        y = top
        cw *= 0.72
    if spire:
        cv.drawLine(cx, y, cx, y - h * 0.16, P(color, 1, stroke=3))


def sky_stack(sc, rng, base, color, hmin, hmax, wmin, wmax, x0=-30, x1=DW + 30, lit=0.2, tiers=(1, 3), seed=1):
    r = random.Random(seed)
    x = x0
    while x < x1:
        w = r.uniform(wmin, wmax)
        h = r.uniform(hmin, hmax)
        if h > (hmin + hmax) * 0.62 and tiers[1] > 1:
            stepped_tower(sc, x, base, w, h, color, r, tiers=r.randint(*tiers), lit=lit)
        else:
            rect(sc.cv, x, base - h, x + w, base + 6, P(color))
            for _ in range(int(w * h / 700 * lit)):
                wx, wy = x + r.uniform(3, w - 7), base - r.uniform(8, h - 6)
                rect(sc.cv, wx, wy, wx + 4, wy + 6, P('#f1c27c', r.uniform(0.35, 0.85)))
                rect(sc.gl, wx, wy, wx + 4, wy + 6, P('#f1c27c', 0.3))
        x += w * r.uniform(0.7, 1.05)


def water(sc, y0, stops, reflect_strength=0.6):
    rect(sc.cv, -10, y0, DW + 10, 1500, P(shader=LG(0, y0, 0, 1500, stops)))
    sc.reflect(y0, strength=reflect_strength, fade=0.85, blur_v=4, blur_h=2.6, ripple=9, ripple_scale=70, mixmode=True)


def city_ny(W=2400, seed=3):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    sc.sky([(0, '#1a2740'), (0.3, '#34496c'), (0.55, '#7d86a3'), (0.75, '#e3b093'), (1, '#f7c58f')], 0, 980,
           glow=(1500, 900, 1400, '#ffb877', 0.6),
           clouds=dict(color='#f3b790', alpha=0.30, y0=300, y1=860, seed=7, scale=(1200, 110), cover=0.55))
    with sc.blurred(3):
        sky_stack(sc, rng, 1010, '#a89aa8', 260, 760, 70, 150, seed=1, lit=0.0)
    rect(cv, 0, 600, DW, 1010, P(shader=LG(0, 600, 0, 1010, [(0, '#f7bd8a', 0.0), (1, '#f7bd8a', 0.3)]), blend=SCREEN))
    with sc.blurred(1.4):
        sky_stack(sc, rng, 1010, '#6c6479', 220, 640, 80, 170, seed=2, lit=0.16)
    sky_stack(sc, rng, 1010, '#2b2a37', 180, 560, 90, 190, seed=3, lit=0.2, tiers=(2, 4))
    rect(cv, 0, 1010, DW, 1030, P('#0e0f13'))
    water(sc, 1030, [(0, '#2b3b55'), (0.3, '#1a2539'), (1, '#0a0f1a')], 0.7)
    return sc


def city_mia(W=2400, seed=4):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    sc.sky([(0, '#6c85ae'), (0.35, '#b2bdd0'), (0.62, '#f2cdb4'), (1, '#fbc89a')], 0, 960,
           glow=(1700, 940, 1500, '#ffd39a', 0.9),
           clouds=dict(color='#ffe1c4', alpha=0.45, y0=160, y1=800, seed=8, scale=(1100, 100), cover=0.55))
    with sc.blurred(2.4):
        sky_stack(sc, rng, 980, '#c7b9c0', 150, 560, 60, 120, seed=11, lit=0, tiers=(1, 1))
    with sc.blurred(1.2):
        sky_stack(sc, rng, 990, '#9a8e9a', 120, 480, 70, 150, seed=12, lit=0.06, tiers=(1, 1))
    sky_stack(sc, rng, 1000, '#4a4350', 70, 320, 80, 180, seed=13, lit=0.12, tiers=(1, 1))
    for x in (300, 1340, 2240):
        palm(sc, x, 1010, rng.uniform(300, 420), '#241f2c', rng, lean=rng.choice([-0.1, 0.1]))
    water(sc, 1010, [(0, '#f6c69b'), (0.2, '#c7a7a2'), (0.55, '#6f8399'), (1, '#1f3044')], 0.7)
    for _ in range(260):
        t = rng.random() ** 1.5
        y = 1022 + t * 440
        x = 1700 + rng.gauss(0, 40 + t * 260)
        w = rng.uniform(14, 60) * (0.5 + t)
        cv.drawOval(skia.Rect(x - w / 2, y, x + w / 2, y + rng.uniform(1.5, 3) * (0.6 + t)), P('#fff1d2', rng.uniform(0.25, 0.8), blend=SCREEN))
    return sc


def city_la(W=2400, seed=5):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    sc.sky([(0, '#3b4672'), (0.3, '#7a7ca6'), (0.58, '#d3a2a8'), (0.82, '#f2b896'), (1, '#f8cba2')], 0, 900,
           glow=(1200, 880, 1500, '#ffb28a', 0.55),
           clouds=dict(color='#ffc9a6', alpha=0.34, y0=240, y1=760, seed=9, scale=(1300, 120), cover=0.55))
    with sc.blurred(3):
        ridge(cv, 690, 200, '#9684a0', 3, freq=0.8)
    with sc.blurred(1.6):
        ridge(cv, 790, 230, '#66597e', 6, freq=1.2)
    sky_stack(sc, rng, 920, '#3c3550', 90, 330, 50, 110, x0=800, x1=1500, seed=21, lit=0.18, tiers=(1, 3))
    rect(cv, 0, 900, DW, 1500, P('#1f1b2b'))
    for _ in range(1700):                                  # the basin grid of lights
        x = rng.uniform(0, DW)
        t = rng.random() ** 0.8
        y = 905 + t * 560
        r = 1.2 + t * 2.4
        c = rng.choice(['#ffd9a0', '#ffe9c0', '#ffb87a', '#ff9d6a', '#fff4de'])
        cv.drawCircle(x, y, r, P(c, rng.uniform(0.4, 0.95)))
        gl.drawCircle(x, y, r * 1.4, P('#ffd9a0', 0.28))
    for i in range(0, 9):                                  # boulevards, converging
        x = 300 + i * 260
        cv.drawLine(x, 1500, 1200 + (x - 1200) * 0.18, 910, P('#ffd9a0', 0.10, stroke=3, blend=SCREEN))
    for x in (210, 2230):
        palm(sc, x, 1500, rng.uniform(900, 1000), '#12101a', rng, lean=rng.choice([-0.05, 0.05]))
    return sc


def city_atx(W=2400, seed=6):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    sc.sky([(0, '#7ea4c9'), (0.34, '#bdd0dc'), (0.66, '#f1e0c4'), (1, '#f9d7a2')], 0, 900,
           glow=(1900, 800, 1500, '#ffd9a0', 0.85),
           clouds=dict(color='#ffffff', alpha=0.6, y0=100, y1=640, seed=12, scale=(900, 120), cover=0.5))
    with sc.blurred(2.5):
        ridge(cv, 760, 130, '#b7bfae', 2, freq=0.7)
    with sc.blurred(1.4):
        ridge(cv, 830, 110, '#8d9a7c', 5, freq=1.0)
    with sc.blurred(0.8):
        sky_stack(sc, rng, 920, '#9aa2a4', 120, 520, 60, 100, x0=700, x1=1700, seed=31, lit=0.0, tiers=(1, 2))
    ridge(cv, 980, 90, '#4e6341', 8, freq=1.4)
    rect(cv, -10, 940, DW + 10, 1500, P(shader=LG(0, 940, 0, 1500, [(0, '#6d8350'), (1, '#27391f')])))
    rect(cv, -10, 940, DW + 10, 1500, P(shader=LG(DW, 0, 0, 0, [(0, '#ffd9a0', 0.30), (1, '#ffd9a0', 0.0)]), blend=SCREEN))
    # river
    path = skia.Path()
    path.moveTo(-10, 1030)
    path.cubicTo(700, 1000, 1500, 1090, DW + 10, 1040)
    path.lineTo(DW + 10, 1180)
    path.cubicTo(1600, 1220, 800, 1140, -10, 1190)
    path.close()
    cv.drawPath(path, P(shader=LG(0, 1000, 0, 1220, [(0, '#e7dfc9'), (0.5, '#a8bccb'), (1, '#6f8a9c')])))
    for i in range(70):
        yy = 1050 + rng.uniform(0, 120)
        xx = rng.uniform(200, 2200)
        cv.drawLine(xx, yy, xx + rng.uniform(30, 120), yy, P('#ffffff', rng.uniform(0.15, 0.4), stroke=1.4))
    # oaks, both banks
    for (tx, s_, g) in ((220, 1.4, 1060), (620, 0.9, 1030), (1980, 1.2, 1050), (2260, 1.5, 1080)):
        cv.drawLine(tx, g + 60, tx - 10, g - 120 * s_, P('#241a12', 1, stroke=18 * s_))
        foliage(cv, rng, tx, g - 210 * s_, 230 * s_, 120 * s_, ['#243a24', '#32502f', '#3f6637'], hi=['#8fa95e', '#c0cc78'], clusters=24, leaves=60, rmin=5 * s_, rmax=11 * s_, cr_scale=0.3, squash=0.7)
    return sc


for _f, _k in ((city_ny, dict(grade=dict(gain=1.04, lift=0.018), grain=0.008)),
               (city_mia, dict(grade=dict(sat=0.9, contrast=0.28, lift=0.02), grain=0.0075, bloom=0.8)),
               (city_la, dict(grade=dict(sat=0.9, contrast=0.3, lift=0.018), grain=0.008)),
               (city_atx, dict(grade=dict(sat=0.9, contrast=0.24, lift=0.02), grain=0.0075, bloom=0.6, vignette=0.2))):
    _f.finish_kw = _k
    _f.export = (1800, 76)

SCENES = {'city_ny': city_ny, 'city_mia': city_mia, 'city_la': city_la, 'city_atx': city_atx}
