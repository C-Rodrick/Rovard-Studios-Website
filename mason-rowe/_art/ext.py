"""Exterior scenes — fictional developments."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa


# ── HALDEN HOUSE — Tribeca, New York ────────────────────────────────────────
def halden(W=2400, seed=7):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    YG = 1262

    sc.sky([(0, '#1a2739'), (0.20, '#2f4663'), (0.42, '#5d759a'), (0.60, '#b0a7b0'), (0.76, '#eab38a'), (1, '#f8c690')],
           0, 1000, glow=(1750, 760, 1500, '#ffb877', 0.55),
           clouds=dict(color='#f4b78c', alpha=0.34, y0=300, y1=900, seed=21, scale=(1200, 110), cover=0.62))
    sc.clouds(color='#a9bad2', alpha=0.20, y0=60, y1=520, seed=34, scale=(1400, 150), cover=0.5)

    with sc.blurred(3.0):
        far_skyline(sc, YG, -40, 2440, 380, 900, 60, 170, '#a99aa4', 3)
    rect(cv, 0, 560, DW, YG, P(shader=LG(0, 560, 0, YG, [(0, '#f7bd8a', 0.0), (1, '#f7bd8a', 0.34)]), blend=SCREEN))
    with sc.blurred(1.8):
        far_skyline(sc, YG, -40, 2440, 280, 700, 80, 200, '#6d6577', 5, lit_p=0.10)
    rect(cv, 0, 620, DW, YG, P(shader=LG(0, 620, 0, YG, [(0, '#f7bd8a', 0.0), (1, '#f7bd8a', 0.24)]), blend=SCREEN))

    with sc.blurred(1.1):
        building_block(sc, -10, 930, 700, YG, '#342e2c', '#101216', 18, 8, 0.11, win=(0.50, 0.52), roof='tank', seed=4)
        rect(cv, -10, 700, 930, 712, P('#d9a56e', 0.34))
        building_block(sc, 1570, 2110, 520, YG, '#2f2c33', '#0f1116', 12, 18, 0.14, win=(0.46, 0.5), seed=9, hazef=0.3)
        rect(cv, 1570, 520, 2110, 530, P('#e4b080', 0.32))
        building_block(sc, 2090, 2420, 760, YG, '#312f36', '#0f1116', 8, 8, 0.12, win=(0.5, 0.5), seed=12, roof='tank')
    for (xa, xb, ya) in ((-10, 930, 700), (1570, 2110, 520), (2090, 2420, 760)):          # dusk falloff on the neighbours
        rect(cv, xa, ya, xb, YG, P(shader=LG(0, ya, 0, YG, [(0, '#f1b27d', 0.10), (0.45, '#000000', 0.0), (1, '#000000', 0.38)])))

    BW, FH, BASEH = 82, 58, 132
    NB1, NB2 = 5, 3
    X0 = 995
    X1 = X0 + NB1 * BW
    X2a, X2b = X0 + BW, X0 + 4 * BW
    D, K, YH = 120, 0.055, 1225
    st_f = shader_lin(tex_stone(900, 1500, '#8a8070', '#b7ab94', seed=3, course=20, joint=0.16, speck=0.035, pits=0.03))
    st_s = shader_lin(tex_stone(500, 1500, '#b99b72', '#ecd0a0', seed=8, course=20, joint=0.14, speck=0.035, pits=0.02))

    side1 = Face(X1, X1 + D, YG, k=K, yh=YH)
    paint_face(sc, side1, 2, 0, 12, BASEH, FH, 20, st_s, rng, 0.34, glass_top='#b49374', glass_bot='#2b2018', recess='#241a12', sheen=0.12, seed_off=3)
    poly(cv, side1.quad(0, 1, 0, BASEH + 12 * FH), P(shader=LG(0, YG - 1100, 0, YG, [(0, '#ffd098', 0.22), (0.55, '#e7a566', 0.06), (1, '#1a0f08', 0.5)])))
    side2 = Face(X2b, X2b + D * 0.85, YG, k=K, yh=YH)
    paint_face(sc, side2, 2, 12, 16, BASEH, FH, 20, st_s, rng, 0.34, glass_top='#b49374', glass_bot='#2b2018', recess='#241a12', sheen=0.12, seed_off=7)
    poly(cv, side2.quad(0, 1, BASEH + 12 * FH, BASEH + 16 * FH), P(shader=LG(0, YG - 1100, 0, YG - 600, [(0, '#ffd098', 0.28), (1, '#e7a566', 0.08)])))

    front1 = Face(X0, X1, YG)
    paint_face(sc, front1, NB1, 0, 12, BASEH, FH, 17, st_f, rng, 0.36, glass_top='#7488a6', seed_off=1)
    front2 = Face(X2a, X2b, YG)
    paint_face(sc, front2, NB2, 12, 16, BASEH, FH, 17, st_f, rng, 0.40, glass_top='#8497b3', seed_off=5)
    for (xa, xb, ha, hb) in ((X0, X1, 0, BASEH + 12 * FH), (X2a, X2b, BASEH + 12 * FH, BASEH + 16 * FH)):
        rect(cv, xa, YG - hb, xb, YG - ha, P(shader=LG(0, YG - 1150, 0, YG - 60, [(0, '#f1b27d', 0.30), (0.4, '#a98f78', 0.07), (1, '#07080a', 0.52)])))
    cv.drawLine(X1, YG - (BASEH + 12 * FH), X1, YG - BASEH, P('#f6dfb8', 0.7, stroke=2.4))
    cv.drawLine(X2b, YG - (BASEH + 16 * FH), X2b, YG - (BASEH + 12 * FH), P('#f6dfb8', 0.7, stroke=2.4))

    th = BASEH + 12 * FH
    for (fc, ua, ub) in ((front1, 0.0, 0.18), (front1, 0.60, 1.0), (side1, 0.0, 1.0)):
        pa, pb = fc.pt(ua, th), fc.pt(ub, th)
        n = max(2, int(abs(pb[0] - pa[0]) / 8))
        for i in range(n):
            t = i / (n - 1)
            x, y = pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t
            cv.drawCircle(x + rng.uniform(-2, 2), y - 5 - rng.uniform(0, 6), rng.uniform(5, 9), P(rng.choice(['#0b100d', '#15201a', '#0f1712']), 0.97))
            if i % 4 == 0:
                gl.drawCircle(x, y - 3, 2.3, P('#ffd9a0', 0.8))
        cv.drawLine(pa[0], pa[1] - 24, pb[0], pb[1] - 24, P('#d7bf9a', 0.42, stroke=1.2))

    cx0, cx1 = X2a + BW * 0.9, X2b - BW * 0.9
    ch0 = BASEH + 16 * FH
    ph = 74
    rect(cv, cx0 - 14, YG - ch0 - ph - 14, cx1 + 14, YG - ch0 - ph, P('#241d17'))
    rect(cv, cx0 - 14, YG - ch0 - ph - 2, cx1 + 14, YG - ch0 - ph, P('#e1bd8a', 0.6))
    rect(cv, cx0, YG - ch0 - ph, cx1, YG - ch0, P(shader=LG(0, YG - ch0 - ph, 0, YG - ch0, [(0, '#fff0cc'), (0.55, '#f4c377'), (1, '#c97a2c')])))
    rect(gl, cx0, YG - ch0 - ph, cx1, YG - ch0, P('#f5c27b', 1.0))
    for i in range(1, 7):
        xx = cx0 + (cx1 - cx0) * i / 7
        cv.drawLine(xx, YG - ch0 - ph, xx, YG - ch0, P('#2a1f16', 0.85, stroke=2.2))
    for i in range(6):
        xx = cx0 + 22 + i * (cx1 - cx0 - 44) / 5
        cv.drawOval(skia.Rect(xx - 6, YG - ch0 - 40, xx + 6, YG - ch0 - 26), P('#3a2410', 0.5))

    pl_top = YG - BASEH
    rect(cv, X0, pl_top, X1, YG, st_f)
    rect(cv, X0, pl_top, X1, YG, P(shader=LG(0, pl_top, 0, YG, [(0, '#07080a', 0.12), (1, '#07080a', 0.52)])))
    sbase = Face(X1, X1 + D, YG, k=K, yh=YH)
    poly(cv, sbase.quad(0, 1, 0, BASEH), st_s)
    poly(cv, sbase.quad(0, 1, 0, BASEH), P(shader=LG(0, pl_top, 0, YG, [(0, '#ffcf8f', 0.15), (1, '#1a0f08', 0.55)])))
    lobby = Face(X0 + BW * 0.55, X1 - BW * 0.55, YG)
    nl = 5
    for i in range(nl):
        u0, u1 = i / nl + 0.014, (i + 1) / nl - 0.014
        glass(sc, lobby, u0, u1, 8, BASEH - 34, 1.0, rng, warm='#f9d9a0')
        for k in range(1, 7):
            uu = u0 + (u1 - u0) * k / 7
            a, b = lobby.pt(uu, 10), lobby.pt(uu, BASEH - 36)
            cv.drawLine(a[0], a[1], b[0], b[1], P('#8a5a24', 0.35, stroke=1.2))
    rect(cv, X0 + BW * 0.4, YG - BASEH + 20, X1 - BW * 0.4, YG - BASEH + 31, P('#1f1812'))
    rect(cv, X0 + BW * 0.4, YG - BASEH + 31, X1 - BW * 0.4, YG - BASEH + 36, P('#000000', 0.45))
    rect(cv, X0 + BW * 0.4, YG - BASEH + 19, X1 - BW * 0.4, YG - BASEH + 22, P('#e0bc88', 0.65))
    for i in range(nl + 1):
        gl.drawCircle(X0 + BW * 0.55 + i * (X1 - X0 - BW * 1.1) / nl, YG - BASEH + 36, 4, P('#ffe2b0', 0.95))

    rect(cv, -10, YG, DW + 10, 1500, P(shader=LG(0, YG, 0, 1500, [(0, '#25262a'), (0.10, '#1b1c20'), (1, '#0a0b0d')])))
    rect(cv, -10, YG, DW + 10, YG + 58, P(shader=LG(0, YG, 0, YG + 58, [(0, '#4a463f'), (1, '#2b2a28')])))
    for i in range(-40, 80):
        x = 1200 + i * 62
        cv.drawLine(x, YG + 58, 1200 + (x - 1200) * 0.84, YG, P('#000000', 0.22, stroke=1.4))
    rect(cv, -10, YG + 58, DW + 10, YG + 64, P('#6e685c', 0.9))
    rect(cv, -10, YG + 64, DW + 10, YG + 70, P('#000000', 0.55))
    spill = skia.Path()
    spill.moveTo(X0 + BW * 0.5, YG)
    spill.lineTo(X1 - BW * 0.5, YG)
    spill.lineTo(X1 + 260, 1500)
    spill.lineTo(X0 - 260, 1500)
    spill.close()
    cv.drawPath(spill, P(shader=LG(0, YG, 0, 1500, [(0, '#f6c27a', 0.5), (1, '#f6c27a', 0.0)]), blend=SCREEN, blur=18))
    gl.drawPath(spill, P(shader=LG(0, YG, 0, 1500, [(0, '#f2b868', 0.55), (1, '#f2b868', 0.0)]), blur=28))
    rect(cv, 0, YG - 160, DW, YG + 10, P(shader=LG(0, YG - 160, 0, YG + 10, [(0, '#f1b27d', 0.0), (1, '#f1b27d', 0.16)]), blend=SCREEN))

    for _ in range(7):
        x = rng.uniform(20, 900) if rng.random() < 0.6 else rng.uniform(1500, 2380)
        yy = YG + rng.uniform(80, 130)
        gl.drawOval(skia.Rect(x, yy, x + rng.uniform(34, 84), yy + 4), P(rng.choice(['#ff6a40', '#fff0d0']), 0.6))

    with sc.blurred(1.5):
        tree(sc, 300, YG + 56, 1.15, rng)
        tree(sc, 760, YG + 56, 0.95, rng)
        tree(sc, 2040, YG + 56, 1.05, rng)
    for lx in (545, 1830):
        cv.drawLine(lx, YG + 56, lx, YG - 196, P('#0b0c0d', 1, stroke=4.2))
        cv.drawLine(lx, YG - 196, lx + 22, YG - 205, P('#0b0c0d', 1, stroke=3))
        gl.drawCircle(lx + 22, YG - 202, 26, P('#ffd59a', 0.95))
        cv.drawCircle(lx + 22, YG - 202, 6, P('#ffe6bf'))
    for (fx, fy, fh) in ((1090, YG + 52, 46), (1126, YG + 55, 43), (1262, YG + 50, 42), (1360, YG + 56, 45), (960, YG + 60, 47)):
        figure(cv, fx, fy, fh, c='#08090a')
        gl.drawOval(skia.Rect(fx - 14, fy - 3, fx + 14, fy + 5), P('#f2b868', 0.18))

    sc.reflect(YG + 66, strength=0.62, fade=0.55, blur_v=7, blur_h=1.4, ripple=3.5, ripple_scale=90, dark=0.0)
    return sc


halden.finish_kw = dict(grade=dict(gain=1.06, lift=0.018), grain=0.008, bloom=1.0)
SCENES = {'halden': halden}
