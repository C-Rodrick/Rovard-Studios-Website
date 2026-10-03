"""Reusable architectural building blocks shared by the scenes."""
import math
import random

import numpy as np
import skia

from core import *  # noqa

SCREEN = skia.BlendMode.kScreen
MULT = skia.BlendMode.kMultiply
PLUS = skia.BlendMode.kPlus
SOFT = skia.BlendMode.kSoftLight
OVERLAY = skia.BlendMode.kOverlay


def shader_lin(arr):
    """Texture as a ready-made Paint. setShader() on an image shader costs ~1 s in skia-python,
    so each texture is bound to a Paint exactly once and that Paint is reused for every draw."""
    im = skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType)
    sh = im.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat,
                       skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear))
    paint = skia.Paint(AntiAlias=True)
    paint.setShader(sh)
    return paint


WARMS = ['#f7d08a', '#f3c27a', '#efb56a', '#f6dca4']


def glass(sc, face, u0, u1, h0, h1, lit, rng, top='#4b5d74', bot='#171d25', warm=None, blind=False):
    """One window on a Face. lit > 0 gives a warm interior; otherwise a dark sky-reflecting pane."""
    cv, gl = sc.cv, sc.gl
    q = face.quad(u0, u1, h0, h1)
    ys = [p[1] for p in q]
    y0, y1 = min(ys), max(ys)
    if lit > 0:
        w = warm or rng.choice(WARMS)
        stops = [(0, mix(w, '#ffffff', 0.18), 1), (0.55, w, 1), (1, mix(w, '#b4631f', 0.5), 1)]
        poly(cv, q, P(shader=LG(0, y0, 0, y1, stops), a=0.55 + 0.45 * lit))
        poly(gl, q, P(w, 0.55 * lit))
        if blind:
            poly(cv, face.quad(u0, u1, h1 - (h1 - h0) * 0.32, h1), P('#2a1f16', 0.55))
        poly(cv, face.quad(u0, u1, h1 - 3, h1), P('#2b1c0f', 0.5))
    else:
        poly(cv, q, P(shader=LG(0, y0, 0, y1, [(0, top, 1), (0.55, mix(top, bot, 0.6), 1), (1, bot, 1)])))
        poly(cv, face.quad(u0, u0 + (u1 - u0) * 0.42, h0, h1), P('#9fb3cc', 0.07))
    wpx = max(1e-3, abs(face.x1 - face.x0))
    ru = min(0.5 * (u1 - u0), 5.0 / wpx)
    poly(cv, face.quad(u0, u0 + ru, h0, h1), P('#0b0a09', 0.42))
    poly(cv, face.quad(u0, u1, h1 - 4, h1), P('#0b0a09', 0.38))
    fp = P('#2a1f16', 0.85, stroke=1.4)
    for a, b in ((q[0], q[1]), (q[1], q[2]), (q[2], q[3]), (q[3], q[0])):
        cv.drawLine(a[0], a[1], b[0], b[1], fp)
    m = face.pt((u0 + u1) / 2, h0)
    m2 = face.pt((u0 + u1) / 2, h1)
    cv.drawLine(m[0], m[1], m2[0], m2[1], P('#2a1f16', 0.7, stroke=1.2))


def building_block(sc, x0, x1, y_top, y_base, body, window_dark, cols, rows, lit_p, hazef=0.0,
                   win=(0.52, 0.5), lit_colors=('#f1c27c', '#e9b46a', '#f7d9a0'), roof=None, seed=1):
    """A plain neighbouring building: a mass with a regular window grid."""
    cv, gl = sc.cv, sc.gl
    rng = random.Random(seed)
    rect(cv, x0, y_top, x1, y_base, P(shader=LG(0, y_top, 0, y_base, [(0, mix(body, '#ffffff', 0.05)), (1, mix(body, '#000000', 0.25))])))
    rect(cv, x0, y_top - 6, x1, y_top + 4, P(mix(body, '#ffffff', 0.12)))
    cw = (x1 - x0) / cols
    rh = (y_base - y_top - 20) / rows
    for r in range(rows):
        for c in range(cols):
            wx0 = x0 + c * cw + cw * (1 - win[0]) / 2
            wx1 = wx0 + cw * win[0]
            wy0 = y_top + 14 + r * rh + rh * (1 - win[1]) / 2
            wy1 = wy0 + rh * win[1]
            if rng.random() < lit_p:
                lc = rng.choice(lit_colors)
                a = rng.uniform(0.45, 0.95) * (1 - hazef * 0.5)
                rect(cv, wx0, wy0, wx1, wy1, P(lc, a))
                rect(gl, wx0, wy0, wx1, wy1, P(lc, 0.5 * a))
            else:
                rect(cv, wx0, wy0, wx1, wy1, P(window_dark, 0.9))
    if roof == 'tank':
        tx = x0 + (x1 - x0) * rng.uniform(0.25, 0.7)
        ty = y_top - 4
        lc = mix(body, '#000000', 0.15)
        for dx in (-18, -6, 6, 18):
            cv.drawLine(tx + dx, ty, tx + dx * 0.9, ty - 52, P(lc, 1, stroke=2.2))
        rect(cv, tx - 26, ty - 120, tx + 26, ty - 52, P(lc))
        poly(cv, [(tx - 28, ty - 120), (tx + 28, ty - 120), (tx, ty - 148)], P(lc))
        cv.drawLine(tx - 26, ty - 100, tx + 26, ty - 100, P('#000000', 0.35, stroke=1.5))
        cv.drawLine(tx - 26, ty - 78, tx + 26, ty - 78, P('#000000', 0.35, stroke=1.5))


def far_skyline(sc, y_base, x0, x1, hmin, hmax, wmin, wmax, color, seed, lit_p=0.0):
    rng = random.Random(seed)
    x = x0
    while x < x1:
        w = rng.uniform(wmin, wmax)
        h = rng.uniform(hmin, hmax)
        rect(sc.cv, x, y_base - h, x + w, y_base + 4, P(color))
        if rng.random() < 0.35:
            rect(sc.cv, x + w * 0.3, y_base - h - rng.uniform(10, 40), x + w * 0.7, y_base - h, P(color))
        if lit_p:
            for _ in range(int(w * h / 900 * lit_p)):
                wx = x + rng.uniform(3, w - 6)
                wy = y_base - rng.uniform(10, h - 8)
                rect(sc.cv, wx, wy, wx + 4, wy + 6, P('#f1c27c', rng.uniform(0.25, 0.7)))
                rect(sc.gl, wx, wy, wx + 4, wy + 6, P('#f1c27c', 0.25))
        x += w + rng.uniform(-6, 10)


def paint_face(sc, face, nb, f0, f1, base_h, FH, pier_px, pier_tex, rng, lit_p, sp_h=15,
               glass_top='#55698a', glass_bot='#1a2029', recess='#1d1611', sheen=0.07, seed_off=0):
    """Continuous limestone piers with recessed bronze spandrels and glazing between."""
    cv = sc.cv
    ha, hb = base_h + f0 * FH, base_h + f1 * FH
    wpx = max(1.0, abs(face.x1 - face.x0))
    pu = pier_px / wpx
    lefts = [b * (1 - pu) / nb for b in range(nb + 1)]
    poly(cv, face.quad(0, 1, ha, hb), P(recess))
    for f in range(f0, f1):
        h0 = base_h + f * FH
        for b in range(nb):
            cu0, cu1 = lefts[b] + pu, lefts[b + 1]
            q = face.quad(cu0, cu1, h0, h0 + sp_h)
            ys = [p[1] for p in q]
            poly(cv, q, P(shader=LG(0, min(ys), 0, max(ys), [(0, '#8d6a43'), (0.18, '#5e4429'), (1, '#2a1d12')])))
            poly(cv, face.quad(cu0, cu1, h0 + sp_h - 1.6, h0 + sp_h), P('#d7b27c', 0.55))
            lit_ = rng.uniform(0.6, 1.0) if rng.random() < lit_p * (0.85 + 0.3 * math.sin(f * 1.3 + b * 2.1 + seed_off)) else 0
            glass(sc, face, cu0 + 0.0015, cu1 - 0.0015, h0 + sp_h, h0 + FH - 2, lit_, rng,
                  top=glass_top, bot=glass_bot, blind=rng.random() < 0.3)
    for b in range(nb + 1):
        l, r = lefts[b], lefts[b] + pu
        r2 = min(1.0, r + 7.0 / wpx)
        poly(cv, face.quad(r, r2, ha, hb),
             P(shader=LG(*face.pt(r, ha), *face.pt(r2, ha), [(0, '#000000', 0.55), (1, '#000000', 0.0)])))
        poly(cv, face.quad(l, r, ha, hb), pier_tex)
        x0p, _ = face.pt(l, ha)
        x1p, _ = face.pt(r, ha)
        poly(cv, face.quad(l, r, ha, hb), P(shader=LG(x0p, 0, x1p, 0, [(0, '#fff3d8', 0.20), (0.35, '#fff3d8', 0.0), (1, '#000000', 0.30)])))
    q = face.quad(0, 1, ha, hb)
    xs = [p[0] for p in q]
    poly(cv, q, P(shader=LG(min(xs), 0, max(xs), 0, [(0, '#ffffff', 0.0), (0.45, '#ffffff', sheen), (1, '#ffffff', 0.0)]), blend=SCREEN))


def foliage(cv, rng, cx, cy, rx, ry, colors, hi=None, clusters=16, leaves=70, rmin=5, rmax=12, cr_scale=0.30, lit=(-1, -1), squash=0.8):
    """Organic canopy: clusters of small leaves, each cluster dark at its base and lit toward `lit`."""
    for _ in range(clusters):
        ang = rng.uniform(0, math.tau)
        d = math.sqrt(rng.random())
        ccx, ccy = cx + math.cos(ang) * rx * d, cy + math.sin(ang) * ry * d
        cr = rng.uniform(0.7, 1.2) * cr_scale * min(rx, ry)
        for _ in range(leaves):
            a2 = rng.uniform(0, math.tau)
            d2 = math.sqrt(rng.random()) * cr
            x, y = ccx + math.cos(a2) * d2, ccy + math.sin(a2) * d2 * squash
            r = rng.uniform(rmin, rmax)
            cv.drawCircle(x, y, r, P(rng.choice(colors), rng.uniform(0.82, 1.0)))
            if hi and ((x - ccx) * lit[0] + (y - ccy) * lit[1]) > cr * 0.25 and rng.random() < 0.55:
                cv.drawCircle(x + lit[0] * r * 0.25, y + lit[1] * r * 0.25, r * 0.55, P(rng.choice(hi), rng.uniform(0.25, 0.6)))


def tree(sc, tx, ground, scale, rng, glow=True, cols=None, height=215):
    """Dark, softly lit street tree."""
    cv, gl = sc.cv, sc.gl
    trunk = skia.Path()
    trunk.moveTo(tx - 5 * scale, ground)
    trunk.lineTo(tx + 5 * scale, ground)
    trunk.lineTo(tx + 3 * scale, ground - 150 * scale)
    trunk.lineTo(tx - 3 * scale, ground - 150 * scale)
    trunk.close()
    cv.drawPath(trunk, P('#0a0b0a'))
    cols = cols or ['#090d0a', '#0e150f', '#141d16', '#1a261d']
    cy = ground - height * scale
    foliage(cv, rng, tx, cy, 105 * scale, 80 * scale, cols, hi=['#2c3d2f', '#3a4f38'], clusters=11, leaves=46, rmin=4 * scale, rmax=9 * scale, cr_scale=0.34)
    if glow:
        for _ in range(9):
            gl.drawCircle(tx + rng.uniform(-100, 100) * scale, cy + rng.uniform(-70, 70) * scale, 2.6 * scale, P('#ffd9a0', 0.8))
