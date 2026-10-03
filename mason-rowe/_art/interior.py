"""Interiors and amenity spaces — fictional rooms."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa
from city import sky_stack  # noqa
from ext3 import ridge  # noqa


def bokeh_city(sc, x0, y0, x1, y1, horizon, rng, palette=('#ffd9a0', '#ffb87a', '#ffe9c0', '#9fc4ff', '#ff9d6a')):
    """Night view through glass: soft, out-of-focus city."""
    cv, gl = sc.cv, sc.gl
    rect(cv, x0, y0, x1, y1, P(shader=LG(0, y0, 0, horizon + 40, [(0, '#0c1230'), (0.45, '#241f4c'), (0.8, '#6d466a'), (1, '#d38c6c')])))
    cv.save()
    cv.clipRect(skia.Rect(x0, y0, x1, y1))
    with sc.blurred(4):
        sky_stack(sc, rng, horizon + 40, '#14112a', 70, 300, 40, 90, x0=x0, x1=x1, seed=3, lit=0.2, tiers=(1, 1))
        rect(cv, x0, horizon + 30, x1, y1, P('#0a0818'))
    with sc.blurred(7):
        for _ in range(520):
            x = rng.uniform(x0, x1)
            t = rng.random() ** 0.9
            y = horizon + 40 + t * (y1 - horizon - 40)
            r = 3 + t * 9
            cv.drawCircle(x, y, r, P(rng.choice(palette), rng.uniform(0.35, 0.95)))
    with sc.blurred(14):
        for _ in range(26):
            cv.drawCircle(rng.uniform(x0, x1), rng.uniform(horizon, y1), rng.uniform(16, 34), P(rng.choice(palette), rng.uniform(0.2, 0.45)))
    cv.restore()
    rect(gl, x0, horizon + 40, x1, y1, P('#ffb87a', 0.10))


# ── Residence living room, night ────────────────────────────────────────────
def living(W=2400, seed=31, scheme='ivory'):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    pal = {
        'ivory':    dict(wall='#cdbfa6', shade='#8a7a62', ceil='#bfb199', floor_lo='#2f2219', floor_hi='#5e4631', sofa='#2d2721', rug='#d6cbb5', rim='#ffd9a0', table='#e2d6bc'),
        'charcoal': dict(wall='#3a3733', shade='#1b1a18', ceil='#2a2825', floor_lo='#1f1a17', floor_hi='#44382e', sofa='#d8cdb9', rug='#46413a', rim='#ffd9a0', table='#8a7a62'),
    }[scheme]
    bx0, bx1, yc, yf = 330, 2070, 270, 1005
    vp = (1200, 760)

    bokeh_city(sc, bx0, yc, bx1, yf, 800, rng)
    # reflected room glow in glass
    rect(cv, bx0, yc, bx1, yf, P(shader=LG(bx0, yc, bx1 * 0.7, yf, [(0, '#ffd9a0', 0.10), (0.5, '#ffd9a0', 0.0), (1, '#ffd9a0', 0.0)]), blend=SCREEN))
    for i in range(5):                                             # bronze mullions
        x = bx0 + (bx1 - bx0) * i / 4
        rect(cv, x - 5, yc, x + 5, yf, P(shader=LG(x - 5, 0, x + 5, 0, [(0, '#8a6a46'), (0.5, '#3a2a1b'), (1, '#1a120b')])))
    rect(cv, bx0, yc, bx1, yc + 8, P('#241a11'))

    # walls
    wall_l = [(0, 0), (bx0, yc), (bx0, yf), (0, 1500)]
    wall_r = [(2400, 0), (bx1, yc), (bx1, yf), (2400, 1500)]
    plaster = shader_lin(tex_plaster(1200, 1500, pal['shade'], pal['wall'], seed=7))
    poly(cv, wall_l, plaster)
    poly(cv, wall_r, plaster)
    poly(cv, wall_l, P(shader=LG(0, 0, bx0, 0, [(0, '#000000', 0.60), (1, '#000000', 0.0)])))
    poly(cv, wall_r, P(shader=LG(2400, 0, bx1, 0, [(0, '#000000', 0.62), (1, '#000000', 0.0)])))
    for w in (wall_l, wall_r):
        poly(cv, w, P(shader=LG(0, 0, 0, 1500, [(0, '#ffd9a0', 0.26), (0.4, '#ffd9a0', 0.0), (1, '#000000', 0.35)]), blend=SCREEN))
    # ceiling + cove
    ceil = [(0, 0), (2400, 0), (bx1, yc), (bx0, yc)]
    poly(cv, ceil, P(shader=LG(0, 0, 0, yc, [(0, pal['ceil']), (1, mix(pal['ceil'], '#000000', 0.5))])))
    poly(cv, ceil, P(shader=LG(0, 0, 0, yc, [(0, '#000000', 0.6), (1, '#000000', 0.0)])))
    rect(cv, bx0, yc - 5, bx1, yc, P('#ffe4b4'))
    rect(gl, bx0, yc - 6, bx1, yc + 2, P('#ffd9a0', 1.0))
    rect(gl, 0, 0, 2400, 14, P('#ffd9a0', 0.0))
    for row, (yy, sz, n) in enumerate(((330, 4.5, 7), (190, 6.5, 5), (60, 9, 4))):          # recessed downlights in perspective
        span = bx1 - bx0 + row * 520
        for i in range(n):
            x = 1200 - span / 2 + span * (i + 0.5) / n
            gl.drawCircle(x, yy - 60 if False else yc - (yc - yy) * 0.92, sz * 1.7, P('#fff0cc', 0.9))
            cv.drawCircle(x, yc - (yc - yy) * 0.92, sz, P('#fff6e0'))

    # floor
    floor = [(0, 1500), (2400, 1500), (bx1, yf), (bx0, yf)]
    poly(cv, floor, P(shader=LG(0, yf, 0, 1500, [(0, pal['floor_lo']), (1, pal['floor_hi'])])))
    cv.save()
    path = skia.Path()
    path.moveTo(*floor[0])
    for q in floor[1:]:
        path.lineTo(*q)
    path.close()
    cv.clipPath(path, doAntiAlias=True)
    for k in range(-14, 30):
        bxk = k * 150 - 400
        cv.drawLine(vp[0] + (bxk - vp[0]) * 0.22, yf, bxk * 1.6 - 300 + (bxk - 1200) * 0.9, 1500, P('#000000', 0.20, stroke=1.6))
    cv.restore()
    # rug
    poly(cv, [(840, 1052), (1730, 1052), (1990, 1340), (590, 1340)], P(pal['rug'], 0.94))
    poly(cv, [(880, 1062), (1690, 1062), (1920, 1318), (660, 1318)], P('#000000', 0.07))

    # furniture
    def rr(x0, y0, x1, y1, r, c, a=1.0):
        cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(x0, y0, x1, y1), r, r), P(c, a))
    sofa = pal['sofa']
    cv.drawOval(skia.Rect(760, 1010, 1680, 1090), P('#000000', 0.42, blur=18))
    rr(790, 835, 1640, 1010, 26, sofa)                                       # back
    rr(770, 930, 1660, 1060, 30, mix(sofa, '#ffffff', 0.04))                 # seat plinth
    for i in range(3):
        rr(830 + i * 275, 905, 1090 + i * 275, 990, 18, mix(sofa, '#ffffff', 0.08))
        cv.drawLine(840 + i * 275, 908, 1080 + i * 275, 908, P(pal['rim'], 0.55, stroke=2))
    cv.drawLine(800, 838, 1630, 838, P(pal['rim'], 0.7, stroke=2.4))
    rr(740, 880, 830, 1060, 24, mix(sofa, '#000000', 0.10))
    rr(1600, 880, 1690, 1060, 24, mix(sofa, '#000000', 0.10))
    for (cx_, cc) in ((880, '#8b6b47'), (1550, '#cdbfa6')):
        rr(cx_ - 52, 872, cx_ + 52, 960, 14, cc, 0.95)
    # coffee table — travertine drum
    cv.drawOval(skia.Rect(1060, 1128, 1380, 1186), P('#000000', 0.40, blur=10))
    rect(cv, 1090, 1100, 1350, 1160, P(shader=LG(1090, 0, 1350, 0, [(0, mix(pal['table'], '#000000', 0.35)), (0.35, pal['table']), (1, mix(pal['table'], '#000000', 0.55))])))
    cv.drawOval(skia.Rect(1090, 1072, 1350, 1128), P(mix(pal['table'], '#ffffff', 0.15)))
    cv.drawOval(skia.Rect(1090, 1150, 1350, 1170), P(mix(pal['table'], '#000000', 0.55)))
    rect(cv, 1160, 1064, 1262, 1080, P('#2a1f16'))
    rect(cv, 1166, 1052, 1252, 1064, P('#8b6b47'))
    cv.drawOval(skia.Rect(1290, 1040, 1322, 1100), P('#241a12'))
    # armchair
    cv.drawOval(skia.Rect(430, 1040, 760, 1110), P('#000000', 0.4, blur=14))
    rr(470, 880, 700, 1060, 36, mix(sofa, '#8b6b47', 0.4))
    rr(450, 960, 720, 1060, 28, mix(sofa, '#8b6b47', 0.3))
    cv.drawLine(480, 886, 690, 886, P(pal['rim'], 0.6, stroke=2.4))
    # arc floor lamp (right)
    lamp = skia.Path()
    lamp.moveTo(1945, 1030)
    lamp.lineTo(1945, 560)
    lamp.quadTo(1945, 470, 1790, 480)
    cv.drawPath(lamp, P('#2a1f16', 1, stroke=5, cap='round'))
    cv.drawCircle(1790, 506, 34, P('#fff0cc'))
    gl.drawCircle(1790, 506, 44, P('#ffd9a0', 0.8))
    cv.drawOval(skia.Rect(1895, 1020, 1995, 1046), P('#241a12'))
    # pendants
    for (px, py, r) in ((1010, 392, 26), (1200, 448, 32), (1390, 392, 26)):
        cv.drawLine(px, 0, px, py - r, P('#1d150e', 0.9, stroke=2))
        cv.drawCircle(px, py, r, P(shader=RG(px - r * 0.3, py - r * 0.3, r * 1.3, [(0, '#fffaf0'), (1, '#ffd89a')])))
        gl.drawCircle(px, py, r * 1.15, P('#ffe3b0', 0.8))
    # plant against the glass
    for i in range(22):
        a = rng.uniform(-0.9, 0.9)
        x = 440 + a * 60
        y = 960 - rng.uniform(40, 360)
        cv.drawOval(skia.Rect(x - 28, y - 14, x + 28, y + 14), P(rng.choice(['#0e1710', '#16231a', '#1e2f22']), 0.96))
    cv.drawLine(440, 1010, 440, 700, P('#150f0a', 1, stroke=4))
    rr(398, 975, 482, 1040, 6, '#2a2018')

    sc.reflect(yf, strength=0.50, fade=0.45, blur_v=15, blur_h=3.0, ripple=0, mixmode=True)
    return sc


def living_charcoal(W=2400, seed=32):
    return living(W, seed, 'charcoal')


living.finish_kw = dict(grade=dict(sat=0.94, contrast=0.34, lift=0.014, gain=1.06), grain=0.0095, bloom=1.0, vignette=0.38)
living_charcoal.finish_kw = living.finish_kw


# ── Entrance lobby ──────────────────────────────────────────────────────────
def lobby(W=2400, seed=33):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    FY = 1010
    rect(cv, 0, 0, DW, DH, P('#14120f'))
    rect(cv, 0, 0, DW, FY, P(shader=LG(0, 0, 0, FY, [(0, '#2c2924'), (1, '#171512')])))
    # cove light
    rect(cv, 0, 150, DW, 160, P('#ffe4b4'))
    rect(gl, 0, 148, DW, 162, P('#ffd9a0', 1.0))
    rect(cv, 0, 160, DW, 520, P(shader=LG(0, 160, 0, 520, [(0, '#ffd9a0', 0.34), (1, '#ffd9a0', 0.0)]), blend=SCREEN))
    # bronze fin wall
    tex = shader_lin(tex_bronze(80, 1000, seed=4))
    x = 120
    fw, gap = 34, 16
    while x < 1450:
        rect(cv, x, 170, x + fw, FY, tex)
        rect(cv, x, 170, x + fw, FY, P(shader=LG(x, 0, x + fw, 0, [(0, '#ffe2b0', 0.5), (0.3, '#000000', 0.0), (1, '#000000', 0.62)])))
        rect(cv, x + fw, 170, x + fw + gap, FY, P('#050403'))
        x += fw + gap
    rect(cv, 120, 170, 1450, FY, P(shader=LG(0, 170, 0, FY, [(0, '#000000', 0.62), (0.55, '#000000', 0.1), (1, '#ffb868', 0.38)]), blend=SCREEN))
    rect(cv, 120, 170, 1450, 470, P(shader=LG(0, 170, 0, 470, [(0, '#000000', 0.45), (1, '#000000', 0.0)])))
    rect(gl, 120, 880, 1450, FY, P(shader=LG(0, 880, 0, FY, [(0, '#f1b868', 0.0), (1, '#f1b868', 0.55)])))
    # garden window
    gx0, gx1 = 1560, 2300
    rect(cv, gx0, 170, gx1, 780, P(shader=LG(0, 170, 0, 780, [(0, '#16202f'), (0.5, '#2c3d4a'), (1, '#6b5b52')])))
    with sc.blurred(2.2):
        foliage(cv, rng, 1760, 560, 190, 200, ['#0c140f', '#16241a', '#213426'], hi=['#40583f'], clusters=14, leaves=50, rmin=8, rmax=16, cr_scale=0.4)
        foliage(cv, rng, 2160, 600, 180, 190, ['#0c140f', '#16241a', '#213426'], hi=['#40583f'], clusters=14, leaves=50, rmin=8, rmax=16, cr_scale=0.4)
    for (lx, ly) in ((1900, 640), (2040, 560), (1680, 700)):
        gl.drawCircle(lx, ly, 20, P('#ffd59a', 1.0))
        cv.drawCircle(lx, ly, 7, P('#fff2d0'))
    for i in range(4):
        xx = gx0 + (gx1 - gx0) * i / 3
        rect(cv, xx - 4, 170, xx + 4, 780, P('#241a12'))
    rect(cv, gx0, 170, gx1, 780, P(shader=LG(gx0, 170, gx1, 780, [(0, '#ffffff', 0.12), (0.4, '#ffffff', 0.0), (1, '#ffffff', 0.0)]), blend=SCREEN))
    # reception monolith
    tr = shader_lin(tex_travertine(900, 300, seed=8))
    rect(cv, 1500, 806, 2250, FY, tr)
    rect(cv, 1500, 806, 2250, FY, P(shader=LG(1500, 0, 2250, 0, [(0, '#000000', 0.0), (1, '#000000', 0.45)])))
    rect(cv, 1500, 806, 2250, 880, P(shader=LG(0, 806, 0, 880, [(0, '#000000', 0.55), (1, '#000000', 0.0)])))
    rect(cv, 1500, 920, 2250, 930, P('#2b1f14'))
    rect(cv, 1500, 922, 2250, 927, P('#c99b5c'))
    rect(cv, 1470, 780, 2280, 808, P(shader=LG(0, 780, 0, 808, [(0, '#efe4cc'), (1, '#b9aa8c')])))
    rect(gl, 1500, FY - 14, 2250, FY, P('#f1b868', 0.9))
    rect(cv, 1500, FY - 14, 2250, FY, P('#ffd9a0', 0.55, blend=SCREEN))
    figure(cv, 1840, 806, 400, c='#2a2016', a=0.96)
    cv.drawOval(skia.Rect(2090, 690, 2150, 790), P('#171310'))                       # vase
    for k in range(9):
        a = -math.pi / 2 + (k - 4) * 0.2
        cv.drawLine(2120, 700, 2120 + math.cos(a) * 140, 700 + math.sin(a) * 200, P('#171310', 1, stroke=3))
    # linear pendants
    for px in (1010, 1100, 1190, 1280):
        cv.drawLine(px, 0, px, 300, P('#0a0807', 0.9, stroke=1.6))
        rect(cv, px - 5, 300, px + 5, 520, P('#fff3d4'))
        rect(gl, px - 5, 300, px + 5, 520, P('#ffd9a0', 1.0))
    # bench
    cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(260, 880, 880, 1000), 22, 22), P('#cdbfa6', 0.96))
    cv.drawLine(268, 884, 872, 884, P('#fff0cc', 0.6, stroke=2.2))
    rect(cv, 260, 940, 880, 1000, P('#000000', 0.18))
    # floor
    rect(cv, 0, FY, DW, 1500, P(shader=LG(0, FY, 0, 1500, [(0, '#252220'), (1, '#0b0a09')])))
    for k in range(-6, 14):
        cv.drawLine(k * 260, 1500, 1200 + (k * 260 - 1200) * 0.45, FY, P('#000000', 0.5, stroke=2))
    sc.reflect(FY, strength=0.62, fade=0.6, blur_v=9, blur_h=2.0, ripple=0, mixmode=True)
    return sc


lobby.finish_kw = dict(grade=dict(sat=0.95, contrast=0.36, lift=0.012, gain=1.08), grain=0.01, bloom=1.0, vignette=0.34)


# ── Spa hall — one-point perspective ────────────────────────────────────────
def spa(W=2400, seed=34):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    cx, cy, f = 1200, 640, 1500.0

    def pr(X, Y, Z):
        return (cx + f * X / Z, cy - f * Y / Z)

    RX, YF, YC = 5.5, -1.6, 3.2
    z0, z1 = 1.2, 22.0
    YW = -1.78
    rect(cv, 0, 0, DW, DH, P('#0d0c0b'))

    # back wall with garden window
    b0, b1 = pr(-RX, YC, z1), pr(RX, YF, z1)
    rect(cv, b0[0], b0[1], b1[0], b1[1], P(shader=LG(0, b0[1], 0, b1[1], [(0, '#3a3128'), (1, '#6a5640')])))
    w0, w1 = pr(-3.6, 2.5, z1), pr(3.6, YF, z1)
    rect(cv, w0[0], w0[1], w1[0], w1[1], P(shader=LG(0, w0[1], 0, w1[1], [(0, '#233246'), (0.6, '#4a5a64'), (1, '#8a7a66')])))
    with sc.blurred(1.4):
        foliage(cv, rng, 1090, w1[1] - 40, 120, 60, ['#0c150f', '#16241a', '#233828'], hi=['#4a6a48'], clusters=10, leaves=36, rmin=4, rmax=9, cr_scale=0.5)
        foliage(cv, rng, 1330, w1[1] - 30, 140, 70, ['#0c150f', '#16241a', '#233828'], hi=['#4a6a48'], clusters=10, leaves=36, rmin=4, rmax=9, cr_scale=0.5)
    for i in range(1, 6):
        xx = w0[0] + (w1[0] - w0[0]) * i / 6
        rect(cv, xx - 1.5, w0[1], xx + 1.5, w1[1], P('#241a12'))
    gl.drawRect(skia.Rect(w0[0], w0[1], w1[0], w1[1]), P('#9fc4d0', 0.16))

    # side walls: travertine with vertical light slots
    tr = shader_lin(tex_travertine(900, 900, '#a89a80', '#cfc2a8', seed=12))
    for sgn in (-1, 1):
        wall = [pr(sgn * RX, YC, z0), pr(sgn * RX, YC, z1), pr(sgn * RX, YF, z1), pr(sgn * RX, YF, z0)]
        poly(cv, wall, tr)
        poly(cv, wall, P(shader=LG(cx - sgn * 1200, 0, cx + sgn * 120, 0, [(0, '#000000', 0.78), (1, '#000000', 0.25)])))
        for k in range(8):
            z = 3.0 + k * 2.55
            sl = [pr(sgn * RX, 2.6, z), pr(sgn * RX, 2.6, z + 0.28), pr(sgn * RX, YF + 0.1, z + 0.28), pr(sgn * RX, YF + 0.1, z)]
            poly(cv, sl, P('#fff0cf'))
            poly(gl, sl, P('#ffd9a0', 1.0))
            glow = [pr(sgn * RX, 2.6, z - 0.7), pr(sgn * RX, 2.6, z + 1.0), pr(sgn * RX, YF + 0.1, z + 1.0), pr(sgn * RX, YF + 0.1, z - 0.7)]
            poly(cv, glow, P('#ffd9a0', 0.16, blend=SCREEN))

    # ceiling with three linear light strips
    ceil = [pr(-RX, YC, z0), pr(RX, YC, z0), pr(RX, YC, z1), pr(-RX, YC, z1)]
    poly(cv, ceil, P(shader=LG(0, 0, 0, cy, [(0, '#050505'), (1, '#2d2822')])))
    strips = []
    for X in (-3.2, 0.0, 3.2):
        s = [pr(X - 0.08, YC, z0 + 0.5), pr(X + 0.08, YC, z0 + 0.5), pr(X + 0.08, YC, z1), pr(X - 0.08, YC, z1)]
        poly(cv, s, P('#fff0cf'))
        poly(gl, s, P('#ffd9a0', 1.0))
        strips.append(X)
    for k in range(1, 9):                                              # ceiling beams
        z = 2 + k * 2.4
        a, b = pr(-RX, YC, z), pr(RX, YC, z)
        cv.drawLine(a[0], a[1], b[0], b[1], P('#000000', 0.55, stroke=3))

    # floor deck
    floor = [pr(-RX, YF, z0), pr(RX, YF, z0), pr(RX, YF, z1), pr(-RX, YF, z1)]
    poly(cv, floor, P(shader=LG(0, cy, 0, 1500, [(0, '#5d5240'), (1, '#1f1a15')])))
    for k in range(1, 22):
        z = 1.5 + k * 1.0
        a, b = pr(-RX, YF, z), pr(RX, YF, z)
        cv.drawLine(a[0], a[1], b[0], b[1], P('#000000', 0.22, stroke=1.4))

    # pool basin and water
    PX = 2.4
    water = [pr(-PX, YW, 2.2), pr(PX, YW, 2.2), pr(PX, YW, z1 - 0.4), pr(-PX, YW, z1 - 0.4)]
    poly(cv, water, P(shader=LG(0, cy, 0, 1500, [(0, '#8fc7c0'), (0.25, '#4e8e8e'), (1, '#12363c')])))
    wp = skia.Path()
    wp.moveTo(*water[0])
    for q in water[1:]:
        wp.lineTo(*q)
    wp.close()
    cv.save()
    cv.clipPath(wp, doAntiAlias=True)
    YR = 2 * YW - YC                                                  # mirrored ceiling height
    for X in strips:
        s = [pr(X - 0.1, YR, 2.2), pr(X + 0.1, YR, 2.2), pr(X + 0.1, YR, z1), pr(X - 0.1, YR, z1)]
        poly(cv, s, P('#fff0cf', 0.55, blur=5, blend=SCREEN))
        poly(gl, s, P('#ffd9a0', 0.4))
    for sgn in (-1, 1):
        for k in range(8):
            z = 3.0 + k * 2.55
            rf = [pr(sgn * 4.2, YW - 0.4, z), pr(sgn * 4.2, YW - 0.4, z + 0.28), pr(sgn * 4.2, YW - 1.2, z + 0.28), pr(sgn * 4.2, YW - 1.2, z)]
            poly(cv, rf, P('#ffd9a0', 0.18, blur=3, blend=SCREEN))
    for _ in range(260):                                               # ripple highlights
        z = 2.4 + rng.random() ** 1.7 * 18
        X = rng.uniform(-PX, PX)
        a = pr(X, YW, z)
        w = 160 / z * rng.uniform(0.4, 1.4)
        cv.drawLine(a[0] - w, a[1], a[0] + w, a[1] + rng.uniform(-1, 1), P('#e8fff8', rng.uniform(0.08, 0.28), stroke=max(1, 5 / z), blend=SCREEN))
    cv.restore()
    for sgn in (-1, 1):                                                # coping edges
        e0, e1 = pr(sgn * PX, YF, 2.2), pr(sgn * PX, YF, z1 - 0.4)
        e2, e3 = pr(sgn * (PX + 0.25), YF, 2.2), pr(sgn * (PX + 0.25), YF, z1 - 0.4)
        poly(cv, [e0, e1, e3, e2], P('#d8ccb2', 0.9))
        i0, i1 = pr(sgn * PX, YW, 2.2), pr(sgn * PX, YW, z1 - 0.4)
        poly(cv, [e0, e1, i1, i0], P('#000000', 0.55))
    # loungers + towel stacks on the deck
    for (sgn, z) in ((-1, 5.5), (-1, 8.4), (1, 6.8)):
        xa = sgn * 3.4
        q = [pr(xa - 0.35, YF + 0.35, z), pr(xa + 0.35, YF + 0.35, z), pr(xa + 0.35, YF + 0.35, z + 1.9), pr(xa - 0.35, YF + 0.35, z + 1.9)]
        poly(cv, q, P('#d6c9ae', 0.95))
        sh = [pr(xa - 0.35, YF, z), pr(xa + 0.35, YF, z), pr(xa + 0.35, YF + 0.35, z), pr(xa - 0.35, YF + 0.35, z)]
        poly(cv, sh, P('#8a7d64', 0.95))
    with sc.blurred(1.5):
        foliage(cv, rng, 560, 600, 130, 160, ['#0c150f', '#16241a', '#233828'], hi=['#4a6a48'], clusters=10, leaves=40, rmin=6, rmax=13, cr_scale=0.5)
        foliage(cv, rng, 1850, 600, 130, 160, ['#0c150f', '#16241a', '#233828'], hi=['#4a6a48'], clusters=10, leaves=40, rmin=6, rmax=13, cr_scale=0.5)
    return sc


spa.finish_kw = dict(grade=dict(sat=0.93, contrast=0.34, lift=0.014, gain=1.08), grain=0.0095, bloom=1.0, vignette=0.34)


# ── Rooftop terrace, dusk ───────────────────────────────────────────────────
def terrace(W=2400, seed=35):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    sc.sky([(0, '#1a2739'), (0.2, '#2f4663'), (0.42, '#5d759a'), (0.62, '#b0a7b0'), (0.78, '#eab38a'), (1, '#f8c690')], 0, 900,
           glow=(1750, 640, 1500, '#ffb877', 0.6),
           clouds=dict(color='#f4b78c', alpha=0.3, y0=240, y1=800, seed=21, scale=(1200, 110), cover=0.6))
    with sc.blurred(3):
        sky_stack(sc, rng, 960, '#a99aa4', 260, 700, 60, 150, seed=3, lit=0.0)
    rect(cv, 0, 520, DW, 960, P(shader=LG(0, 520, 0, 960, [(0, '#f7bd8a', 0.0), (1, '#f7bd8a', 0.3)]), blend=SCREEN))
    with sc.blurred(1.6):
        sky_stack(sc, rng, 960, '#6d6577', 200, 560, 80, 170, seed=5, lit=0.14)
    sky_stack(sc, rng, 960, '#2a2937', 140, 420, 90, 200, seed=7, lit=0.22, tiers=(2, 4))
    rect(cv, 0, 960, DW, 1500, P('#14110f'))
    # glass balustrade
    rect(cv, 0, 940, DW, 1010, P('#c6d6e6', 0.12))
    rect(cv, 0, 934, DW, 942, P(shader=LG(0, 934, 0, 942, [(0, '#e0bc88'), (1, '#6b4a28')])))
    for i in range(0, 25):
        rect(cv, i * 100 - 3, 940, i * 100 + 3, 1010, P('#8a6a46', 0.6))
    # deck
    rect(cv, 0, 1010, DW, 1500, P(shader=LG(0, 1010, 0, 1500, [(0, '#3c2b1d'), (1, '#1a120c')])))
    for k in range(-20, 40):
        cv.drawLine(k * 180, 1500, 1200 + (k * 180 - 1200) * 0.35, 1010, P('#000000', 0.45, stroke=2))
    # planters with grasses (left, right)
    for (px0, px1) in ((-20, 360), (2040, 2420)):
        rect(cv, px0, 1010, px1, 1100, P('#241a12'))
        rect(cv, px0, 1010, px1, 1016, P('#e0bc88', 0.35))
        for _ in range(160):
            x = rng.uniform(px0, px1)
            h = rng.uniform(70, 170)
            cv.drawLine(x, 1012, x + rng.uniform(-26, 26), 1012 - h, P(rng.choice(['#18241a', '#223220', '#2e4430']), 0.95, stroke=2.2))
    # festoon lights
    for (xa, xb, ya, sag) in ((0, 2400, 170, 120), (0, 2400, 330, 90), (-100, 2500, 90, 80)):
        pts = []
        for i in range(0, 41):
            t = i / 40
            x = xa + (xb - xa) * t
            y = ya + math.sin(t * math.pi) * sag + (0 if ya != 90 else 30)
            pts.append((x, y))
        path = skia.Path()
        path.moveTo(*pts[0])
        for q in pts[1:]:
            path.lineTo(*q)
        cv.drawPath(path, P('#0a0807', 0.85, stroke=1.6))
        for i, (x, y) in enumerate(pts):
            if i % 2 == 0:
                gl.drawCircle(x, y + 8, 11, P('#ffd59a', 0.95))
                cv.drawCircle(x, y + 8, 3.4, P('#fff2d0'))
    # dining table with chairs, slightly soft
    with sc.blurred(0.9):
        for i in range(7):
            cx_ = 560 + i * 200
            cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect(cx_ - 52, 1010, cx_ + 52, 1130), 14, 14), P('#120d09', 0.97))
            cv.drawLine(cx_ - 50, 1013, cx_ + 50, 1013, P('#e0bc88', 0.4, stroke=1.6))
        cv.drawOval(skia.Rect(400, 1330, 2000, 1420), P('#000000', 0.4, blur=20))
        rect(cv, 430, 1120, 1970, 1150, P(shader=LG(0, 1120, 0, 1150, [(0, '#7a5634'), (1, '#33231a')])))
        rect(cv, 430, 1120, 1970, 1126, P('#f1d3a0', 0.6))
        rect(cv, 470, 1150, 500, 1330, P('#1c130c'))
        rect(cv, 1900, 1150, 1930, 1330, P('#1c130c'))
        for i in range(10):
            x = 520 + i * 160
            cv.drawCircle(x, 1112, 5, P('#fff4d8'))
            gl.drawCircle(x, 1108, 22, P('#ffd59a', 0.95))
            cv.drawOval(skia.Rect(x - 36, 1124, x + 36, 1142), P('#e8dfcd', 0.9))
        for i in range(10):
            x = 560 + i * 150
            cv.drawRect(skia.Rect(x, 1086, x + 8, 1118), P('#f4efe6', 0.4))
    for fx, fy in ((300, 1010), (2120, 1010)):
        figure(cv, fx, fy + 24, 250, c='#0b0908', a=0.0)
    return sc


terrace.finish_kw = dict(grade=dict(gain=1.06, lift=0.018), grain=0.0085, bloom=1.0, vignette=0.3)

for _f in (living, living_charcoal, lobby, spa, terrace):
    _f.export = (1800, 78)

SCENES = {'living': living, 'living_charcoal': living_charcoal, 'lobby': lobby, 'spa': spa, 'terrace': terrace}
