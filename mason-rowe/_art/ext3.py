"""Exterior scenes, part 3 — Los Angeles and Austin."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa


def ridge(cv, base, amp, color, seed, x0=-20, x1=DW + 20, step=24, freq=1.0, bottom=1500, alpha=1.0):
    rng = random.Random(seed)
    comps = [(rng.uniform(0.6, 1.4) * freq / 900.0, rng.uniform(0, math.tau), rng.uniform(0.35, 1.0)) for _ in range(5)]
    path = skia.Path()
    path.moveTo(x0, bottom)
    x = x0
    pts = []
    while x <= x1:
        v = sum(a * math.sin(f * x * math.tau + p) for f, p, a in comps) / sum(a for _, _, a in comps)
        pts.append((x, base - amp * (0.5 + 0.5 * v)))
        x += step
    for (px, py) in pts:
        path.lineTo(px, py)
    path.lineTo(x1, bottom)
    path.close()
    cv.drawPath(path, P(color, alpha))
    return pts


def palm(sc, x, ground, h, color, rng, lean=0.12):
    """Slender palm: tapering trunk, drooping arched fronds."""
    cv = sc.cv
    tx, ty = x + h * lean, ground - h
    trunk = skia.Path()
    w0, w1 = max(3.0, h * 0.016), max(1.6, h * 0.008)
    trunk.moveTo(x - w0, ground)
    trunk.quadTo(x + h * lean * 0.15 - w0, ground - h * 0.55, tx - w1, ty)
    trunk.lineTo(tx + w1, ty)
    trunk.quadTo(x + h * lean * 0.15 + w0, ground - h * 0.55, x + w0, ground)
    trunk.close()
    cv.drawPath(trunk, P(color))
    n = 13
    for i in range(n):
        a = math.radians(-172 + 164 * i / (n - 1)) + rng.uniform(-0.05, 0.05)
        L = h * rng.uniform(0.15, 0.22)
        cx_, cy_ = tx + math.cos(a) * L * 0.62, ty + math.sin(a) * L * 0.9
        ex, ey = tx + math.cos(a) * L, ty + L * 0.34 + math.sin(a) * L * 0.25
        pth = skia.Path()
        pth.moveTo(tx, ty)
        pth.quadTo(cx_, cy_, ex, ey)
        cv.drawPath(pth, P(color, 1, stroke=max(1.6, h * 0.009), cap='round'))
        for k in (0.45, 0.7):
            px_, py_ = tx + (ex - tx) * k, ty + (ey - ty) * k * 0.9
            cv.drawLine(px_, py_, px_ + math.cos(a + 0.9) * L * 0.16, py_ + L * 0.16, P(color, 0.9, stroke=max(1, h * 0.005)))


# ── WREN CANYON — Brentwood, Los Angeles ────────────────────────────────────
def wren(W=2400, seed=5):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    GY = 985                                               # pool coping / building base

    sc.sky([(0, '#39466f'), (0.28, '#767aa6'), (0.55, '#d2a2a8'), (0.80, '#f2b896'), (1, '#f8cba2')], 0, 820,
           glow=(1700, 800, 1500, '#ffb28a', 0.6),
           clouds=dict(color='#ffc9a6', alpha=0.34, y0=260, y1=760, seed=31, scale=(1300, 120), cover=0.55))
    sc.clouds(color='#a5a8cf', alpha=0.20, y0=40, y1=420, seed=36, scale=(1500, 160), cover=0.5)

    # hills with valley lights
    with sc.blurred(2.5):
        ridge(cv, 760, 150, '#9d8ba2', 2, freq=0.8)
    pts = ridge(cv, 820, 190, '#6b5f83', 4, freq=1.2)
    with sc.blurred(0.8):
        for _ in range(170):
            x = rng.uniform(0, DW)
            yy = rng.uniform(780, 900)
            r = rng.uniform(1.2, 2.4)
            cv.drawCircle(x, yy, r, P(rng.choice(['#ffd9a0', '#ffe9c0', '#ffb87a']), rng.uniform(0.4, 0.9)))
            gl.drawCircle(x, yy, r * 1.4, P('#ffd9a0', 0.35))
    ridge(cv, 905, 140, '#2f2b3f', 7, freq=1.6)

    # ground / retaining wall
    rect(cv, -10, 905, DW + 10, GY, P('#1b1a24'))
    st_t = shader_lin(tex_stone(900, 900, '#a99d85', '#d8ccb2', seed=41, course=0, speck=0.04, pits=0.05))

    # ── the house ──
    # stone end wall
    rect(cv, 520, 560, 720, GY, st_t)
    rect(cv, 520, 560, 720, GY, P(shader=LG(0, 560, 0, GY, [(0, '#f4b98a', 0.30), (1, '#0c0a14', 0.42)])))
    rect(cv, 650, 620, 668, 880, P(shader=LG(0, 620, 0, 880, [(0, '#fbe0ae'), (1, '#e0a05a')])))
    rect(gl, 650, 620, 668, 880, P('#f5c27b', 0.9))
    # upper timber-screened volume
    rect(cv, 1330, 505, 1990, 700, P('#25211f'))
    for i in range(78):
        xx = 1336 + i * 8.4
        rect(cv, xx, 505, xx + 3.2, 700, P(shader=LG(0, 505, 0, 700, [(0, '#8d6a43', 0.9), (1, '#3c2b1c', 0.95)])))
    rect(cv, 1400, 580, 1920, 640, P(shader=LG(0, 580, 0, 640, [(0, '#fde5b3'), (1, '#e5a65f')])))
    rect(gl, 1400, 580, 1920, 640, P('#f5c27b', 0.95))
    for i in range(1, 6):
        rect(cv, 1400 + i * 86.7, 580, 1402 + i * 86.7, 640, P('#2a1f16', 0.8))
    rect(cv, 1318, 492, 2004, 508, P('#1a1816'))
    rect(cv, 1318, 492, 2004, 495, P('#e1bd8a', 0.5))
    # long roof plane
    rect(cv, 470, 690, 2010, 718, P('#201d1b'))
    rect(cv, 470, 690, 2010, 694, P('#e1bd8a', 0.55))
    rect(cv, 470, 718, 2010, 722, P('#000000', 0.5))
    # oak soffit, warmly lit from below
    rect(cv, 700, 722, 1960, 748, P(shader=LG(0, 722, 0, 748, [(0, '#6d4a2a'), (1, '#c99660')])))
    for i in range(110):
        xx = 700 + i * 11.5
        cv.drawLine(xx, 722, xx, 748, P('#2a1a0c', 0.25, stroke=1))
    rect(gl, 700, 730, 1960, 748, P('#e0a860', 0.35))

    # glass pavilion with interior
    gx0, gx1, gy0, gy1 = 720, 1960, 748, GY
    rect(cv, gx0, gy0, gx1, gy1, P(shader=LG(0, gy0, 0, gy1, [(0, '#f2cd94'), (0.5, '#d9a066'), (1, '#8a5124')])))
    rect(gl, gx0, gy0, gx1, gy1, P('#f1b868', 0.62))
    # back wall bands
    rect(cv, gx0, gy0 + 20, gx1, gy1 - 62, P(shader=LG(gx0, 0, gx1, 0, [(0, '#6a4222', 0.62), (0.45, '#6a4222', 0.0), (0.7, '#6a4222', 0.0), (1, '#6a4222', 0.55)])))
    rect(cv, 960, 790, 1190, 868, P(shader=LG(0, 790, 0, 868, [(0, '#8b5a34'), (0.5, '#c58b52'), (1, '#6a4126')])))      # artwork
    rect(cv, 1810, 765, 1950, 900, P('#d8a96a', 0.5))                                                                         # hearth wall glow
    # floor plane
    rect(cv, gx0, gy1 - 62, gx1, gy1, P(shader=LG(0, gy1 - 62, 0, gy1, [(0, '#7a4a22'), (1, '#33200f')])))
    # furniture silhouettes (warm, soft)
    sof = skia.RRect.MakeRectXY(skia.Rect(850, 898, 1280, 962), 14, 14)
    cv.drawRRect(sof, P('#2a180c', 0.95))
    cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(850, 878, 1280, 914), 14, 14), P('#3a2414', 0.97))
    cv.drawLine(856, 880, 1274, 880, P('#f1c88e', 0.5, stroke=1.6))
    cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(1000, 960, 1130, 978), 4, 4), P('#2b1c10', 0.9))
    for (px, w_) in ((1480, 150), (1560, 150), (1640, 150)):                                             # pendants
        cv.drawLine(px, gy0, px, 806, P('#24170d', 0.8, stroke=1.2))
        cv.drawCircle(px, 812, 11, P('#fff3d4'))
        gl.drawCircle(px, 812, 16, P('#ffeab8', 0.95))
    rect(cv, 1410, 918, 1730, 926, P('#2b1c10', 0.92))                                                  # table
    for lx in (1424, 1716):
        rect(cv, lx, 926, lx + 6, 978, P('#2b1c10', 0.9))
    for cx in (1450, 1520, 1590, 1660):
        cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx - 16, 934, cx + 16, 962), 5, 5), P('#24140a', 0.95))
    rect(cv, 1780, 890, 1950, 985, P(shader=LG(0, 890, 0, 985, [(0, '#e6d2ac'), (1, '#8e7a5a')])))         # island
    rect(cv, 1780, 888, 1950, 894, P('#fff0d0', 0.7))
    cv.drawCircle(760, 930, 40, P('#1e2a1d', 0.95))
    cv.drawCircle(782, 905, 28, P('#1e2a1d', 0.95))
    # bronze mullions
    n = 10
    for i in range(n + 1):
        xx = gx0 + (gx1 - gx0) * i / n
        rect(cv, xx - 3, gy0, xx + 3, gy1, P(shader=LG(xx - 3, 0, xx + 3, 0, [(0, '#8a6a46'), (1, '#2a1f16')])))
    # sky reflection on the glass
    rect(cv, gx0, gy0, gx1, gy1, P(shader=LG(gx0, gy0, gx1 * 0.6, gy1, [(0, '#c6b5d6', 0.20), (0.5, '#c6b5d6', 0.0), (1, '#c6b5d6', 0.0)]), blend=SCREEN))

    # roof-edge planting
    for (hx0, hx1) in ((480, 700), (1700, 1990)):
        foliage(cv, rng, (hx0 + hx1) / 2, 684, (hx1 - hx0) / 2, 14, ['#121a14', '#1b261d', '#233126'], clusters=10, leaves=26, rmin=4, rmax=8, cr_scale=0.9)

    # ── terrace, coping, pool ──
    rect(cv, -10, GY, DW + 10, GY + 22, P(shader=LG(0, GY, 0, GY + 22, [(0, '#efe2c8'), (1, '#b2a48a')])))
    rect(cv, -10, GY + 22, DW + 10, GY + 40, P('#000000', 0.55))
    rect(cv, -10, GY + 40, DW + 10, 1500, P(shader=LG(0, GY + 40, 0, 1500, [(0, '#526f78'), (0.18, '#2d4a55'), (1, '#0b1a21')])))
    rect(cv, -10, GY + 40, DW + 10, GY + 120, P(shader=LG(0, GY + 40, 0, GY + 120, [(0, '#9ee6df', 0.34), (1, '#9ee6df', 0.0)]), blend=SCREEN))
    gl.drawRect(skia.Rect(-10, GY + 40, DW, GY + 80), P(shader=LG(0, GY + 40, 0, GY + 80, [(0, '#7fd6d0', 0.28), (1, '#7fd6d0', 0.0)])))
    # loungers + olive trees
    for (lx, ly) in ((1300, GY - 2), (1480, GY - 2)):
        poly(cv, [(lx, ly), (lx + 90, ly), (lx + 120, ly - 26), (lx + 108, ly - 28), (lx + 84, ly - 12), (lx, ly - 12)], P('#161412', 0.92))
    with sc.blurred(1.2):
        for (tx, s_) in ((330, 1.3), (2190, 1.0)):
            cv.drawLine(tx, GY + 20, tx - 14 * s_, GY - 160 * s_, P('#14110f', 1, stroke=16 * s_))
            cv.drawLine(tx - 14 * s_, GY - 160 * s_, tx + 50 * s_, GY - 260 * s_, P('#14110f', 1, stroke=6 * s_))
            foliage(cv, rng, tx + 10, GY - 270 * s_, 190 * s_, 90 * s_, ['#1c241e', '#242f26', '#16201a'], hi=['#6f7f6a', '#8a9a84'], clusters=40, leaves=80, rmin=5 * s_, rmax=10 * s_, cr_scale=0.34, squash=0.7)
    sc.reflect(GY + 40, strength=0.82, fade=0.7, blur_v=3.0, blur_h=2.0, ripple=7, ripple_scale=80, mixmode=True)
    return sc


wren.finish_kw = dict(grade=dict(sat=0.9, contrast=0.32, lift=0.016, gain=1.04, shadow=(0.012, 0.004, 0.026), high=(0.05, 0.016, -0.018)), grain=0.0085, bloom=1.0)


# ── QUARRY HOUSE — Zilker, Austin ───────────────────────────────────────────
def quarry(W=2400, seed=9):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    GY = 1010

    sc.sky([(0, '#82a6c8'), (0.36, '#bcd0dc'), (0.70, '#f0e2c6'), (1, '#f9dcab')], 0, 860,
           glow=(260, 330, 1600, '#ffe2a8', 0.75),
           clouds=dict(color='#ffffff', alpha=0.62, y0=90, y1=600, seed=44, scale=(900, 120), cover=0.5))
    with sc.blurred(2):
        ridge(cv, 790, 120, '#b8c0ac', 2, freq=0.7)
    with sc.blurred(1):
        ridge(cv, 850, 100, '#8f9b7c', 5, freq=1.1)

    st_l = shader_lin(tex_stone(1400, 1000, '#dccfae', '#f1e6c8', seed=51, course=26, joint=0.16, speck=0.035, pits=0.05))
    st_m = shader_lin(tex_stone(1400, 1000, '#cdbd96', '#e3d4b0', seed=52, course=26, joint=0.16, speck=0.035, pits=0.05))

    def opening(x0, y0, x1, y1, depth=26, lit=False):
        rect(cv, x0, y0, x1, y1, P('#23190f'))
        rect(cv, x0 + depth * 0.2, y0 + depth * 0.4, x1 - 3, y1 - 6, P(shader=LG(0, y0, 0, y1, [(0, '#44566a'), (1, '#1a222c')])))
        if lit:
            rect(cv, x0 + depth * 0.2, y0 + depth * 0.4, x1 - 3, y1 - 6, P(shader=LG(0, y0, 0, y1, [(0, '#f8dcaa'), (1, '#d8914a')]), a=0.9))
            rect(gl, x0 + depth * 0.2, y0 + depth * 0.4, x1 - 3, y1 - 6, P('#f3c27a', 0.4))
        rect(cv, x0, y0, x0 + depth, y1, P('#1c130b', 0.78))                # shadowed left jamb
        rect(cv, x0, y0, x1, y0 + depth * 0.45, P('#1c130b', 0.62))        # head shadow
        rect(cv, x0 - 4, y1, x1 + 6, y1 + 5, P('#fff4da', 0.6))             # sunlit sill
        cv.drawLine((x0 + x1) / 2 + depth * 0.2, y0 + depth * 0.4, (x0 + x1) / 2 + depth * 0.2, y1 - 6, P('#1a130c', 0.7, stroke=2))

    # Block A — tall
    A = (760, 380, 1230, GY)
    rect(cv, *A, st_l)
    for r in range(5):
        for c in range(3):
            if (r, c) in ((2, 1), (3, 0)):
                continue
            x0 = 800 + c * 140
            y0 = 440 + r * 108
            opening(x0, y0, x0 + 82, y0 + 70, lit=(r, c) in ((0, 2), (4, 1)))
    # long recessed loggia on A
    rect(cv, 940, 668, 1210, 812, P('#1a120a'))
    rect(cv, 954, 682, 1198, 806, P(shader=LG(0, 682, 0, 806, [(0, '#e4cc9a'), (1, '#b88f56')])))
    rect(gl, 954, 682, 1198, 806, P('#f3c27a', 0.3))
    # Block B — long, lower
    B = (1210, 560, 1860, GY)
    rect(cv, *B, st_m)
    rect(cv, 1210, 560, 1870, 576, P('#f7ecd0'))
    rect(cv, 1210, 576, 1870, 592, P('#000000', 0.34))
    for c in range(5):
        x0 = 1262 + c * 124
        opening(x0, 640, x0 + 78, 760, depth=30, lit=(c == 3))
    # deep terrace slab (casting a strong shadow)
    rect(cv, 1190, 790, 1890, 818, P(shader=LG(0, 790, 0, 818, [(0, '#f6ebcf'), (1, '#cdbd96')])))
    rect(cv, 1190, 818, 1890, 880, P(shader=LG(0, 818, 0, 880, [(0, '#000000', 0.55), (1, '#000000', 0.0)])))
    for c in range(4):
        x0 = 1280 + c * 150
        rect(cv, x0, 840, x0 + 92, GY - 20, P('#20170e'))
        rect(cv, x0 + 6, 850, x0 + 88, GY - 24, P(shader=LG(0, 850, 0, GY, [(0, '#3b4c5e'), (1, '#1b232d')])))
        rect(cv, x0, 840, x0 + 22, GY - 20, P('#1c130b', 0.65))
    # Block C — stair tower
    C = (1850, 300, 2090, GY)
    rect(cv, *C, st_l)
    for r in range(8):
        y0 = 370 + r * 76
        rect(cv, 1925, y0, 1940, y0 + 52, P('#1b120a'))
        rect(cv, 1940, y0, 1948, y0 + 52, P('#fff0cc', 0.6))
    rect(cv, 1840, 290, 2100, 312, P('#efe2c4'))
    rect(cv, 1840, 312, 2100, 330, P('#000000', 0.32))
    # shadows cast by A onto B and by B onto C
    poly(cv, [(1210, 560), (1500, 560), (1330, 790), (1210, 790)], P('#3a2a1c', 0.30))
    poly(cv, [(1850, 300), (1990, 300), (1850, 640)], P('#3a2a1c', 0.22))
    # overall sun: warm from upper left, falling into soft shade at right and base
    for (xa, ya, xb) in ((760, 380, 1230), (1210, 560, 1860), (1850, 300, 2090)):
        rect(cv, xa, ya, xb, GY, P(shader=LG(xa, 0, xb, 0, [(0, '#fff2cf', 0.20), (1, '#3a2a40', 0.20)]), blend=SCREEN))
        rect(cv, xa, ya, xb, GY, P(shader=LG(0, ya, 0, GY, [(0, '#ffffff', 0.0), (1, '#2a1c10', 0.30)])))
    # entry: bronze door set in a deep reveal
    rect(cv, 1050, 810, 1160, GY, P('#1a120a'))
    rect(cv, 1062, 822, 1148, GY, P(shader=LG(0, 822, 0, GY, [(0, '#8d6a43'), (1, '#4a3320')])))
    for i in range(1, 6):
        cv.drawLine(1062 + i * 14.3, 822, 1062 + i * 14.3, GY, P('#2a1d12', 0.5, stroke=1.4))
    gl.drawRect(skia.Rect(1062, 822, 1148, GY), P('#f3c27a', 0.18))

    # ── court ──
    pave = shader_lin(tex_stone(1400, 520, '#c9b996', '#e1d3b2', seed=61, course=0, speck=0.05, pits=0.05))
    rect(cv, -10, GY, DW + 10, 1500, pave)
    rect(cv, -10, GY, DW + 10, 1500, P(shader=LG(0, GY, 0, 1500, [(0, '#2a1c10', 0.40), (0.1, '#2a1c10', 0.0), (1, '#fff2cf', 0.16)])))
    rect(cv, 700, GY, 2150, GY + 14, P('#000000', 0.34))
    for i in range(-12, 30):                                   # paving joints in perspective
        x = 1200 + i * 120
        cv.drawLine(x, GY + 10, 1200 + (x - 1200) * 2.4, 1500, P('#6f5e3c', 0.18, stroke=1.4))
    for j in range(1, 9):
        yy = GY + 10 + (j ** 1.7) * 11
        cv.drawLine(-10, yy, DW + 10, yy, P('#6f5e3c', 0.15, stroke=1.4))
    # reflecting trough
    poly(cv, [(960, 1120), (1620, 1120), (1700, 1215), (900, 1215)], P(shader=LG(0, 1120, 0, 1215, [(0, '#bcd2e0'), (1, '#8aa5b8')])))
    poly(cv, [(960, 1120), (1620, 1120), (1630, 1130), (950, 1130)], P('#fff6e0', 0.9))
    cv.drawLine(900, 1215, 1700, 1215, P('#5b4a30', 0.8, stroke=4))
    for i in range(8):
        yy = 1136 + i * 10
        cv.drawLine(980 - i * 6, yy, 1600 + i * 6, yy, P('#ffffff', 0.18, stroke=1.4))
    for fx, fy, fh in ((1182, 1030, 70), (1226, 1034, 68)):
        figure(cv, fx, fy, fh, c='#2a2018', a=0.92)

    # live oak, left, with dappled shadow on the court
    for i in range(60):
        ex = rng.uniform(560, 1500)
        ey = rng.uniform(1040, 1420)
        sc.cv.drawOval(skia.Rect(ex, ey, ex + rng.uniform(60, 190), ey + rng.uniform(14, 40)), P('#2a3a24', rng.uniform(0.10, 0.22), blur=6))
    trunk = skia.Path()
    trunk.moveTo(330, 1180)
    trunk.cubicTo(330, 980, 300, 800, 380, 640)
    trunk.lineTo(440, 650)
    trunk.cubicTo(380, 820, 420, 1000, 470, 1190)
    trunk.close()
    cv.drawPath(trunk, P(shader=LG(300, 0, 480, 0, [(0, '#3a2c20'), (1, '#1a120c')])))
    cv.drawLine(400, 700, 150, 560, P('#2a1e14', 1, stroke=34))
    cv.drawLine(420, 690, 760, 540, P('#2a1e14', 1, stroke=30))
    greens = ['#1c2d1c', '#27402a', '#33523a']
    hi = ['#7e9b55', '#a3b765', '#d2d482']
    foliage(cv, rng, 420, 430, 560, 330, greens, hi=hi, clusters=46, leaves=84, rmin=6, rmax=14, cr_scale=0.20, lit=(-1, -1), squash=0.78)
    # dappled shade falling across the west facade
    cv.save()
    cv.clipRect(skia.Rect(760, 380, 1500, GY))
    for _ in range(90):
        ex = rng.uniform(760, 1240)
        ey = rng.uniform(400, GY - 40)
        cv.drawOval(skia.Rect(ex, ey, ex + rng.uniform(20, 60), ey + rng.uniform(14, 40)), P('#1d2b1a', rng.uniform(0.10, 0.28), blur=5))
    cv.restore()
    return sc


quarry.finish_kw = dict(grade=dict(sat=0.92, contrast=0.26, lift=0.02, gain=1.02, shadow=(0.004, 0.006, 0.014), high=(0.04, 0.02, -0.01)), grain=0.0075, bloom=0.7, vignette=0.2)

SCENES = {'wren': wren, 'quarry': quarry}
