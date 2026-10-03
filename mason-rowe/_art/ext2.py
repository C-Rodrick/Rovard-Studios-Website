"""Exterior scenes, part 2 — Miami, Los Angeles, Austin."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa


# ── THE AVERLY — Edgewater, Miami ───────────────────────────────────────────
def averly(W=2400, seed=11):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    HZ, PIER, EDGE, WL = 850, 1008, 1052, 1092          # horizon, building base, pier edge, waterline

    sc.sky([(0, '#6483ad'), (0.30, '#9fb6cf'), (0.58, '#ead3bf'), (0.82, '#f8c99c'), (1, '#fdd7a8')], 0, HZ,
           glow=(520, 790, 1500, '#ffd39a', 0.85),
           clouds=dict(color='#ffe6c8', alpha=0.46, y0=140, y1=780, seed=15, scale=(1000, 100), cover=0.55))
    sc.clouds(color='#ffffff', alpha=0.20, y0=60, y1=420, seed=19, scale=(1500, 170), cover=0.45)
    cv.drawCircle(520, 800, 120, P('#fff2d6', 0.55, blur=40))
    cv.drawCircle(520, 800, 40, P('#fffaf0'))
    gl.drawCircle(520, 800, 120, P('#ffe3b0', 0.85, blur=40))

    with sc.blurred(3):
        far_skyline(sc, HZ + 4, -40, 1000, 120, 330, 40, 110, '#c5bcc0', 2)
        far_skyline(sc, HZ + 4, 2000, 2440, 140, 360, 40, 120, '#c5bcc0', 8)
    with sc.blurred(1.6):
        far_skyline(sc, HZ + 4, -40, 720, 70, 210, 36, 100, '#aba5ae', 3)

    rect(cv, 0, HZ, DW, 1500, P(shader=LG(0, HZ, 0, 1500, [(0, '#f6c69b'), (0.16, '#c7a7a2'), (0.45, '#6f8399'), (1, '#1f3044')])))
    for i in range(420):                                  # sun glitter
        t = rng.random() ** 1.6
        y = HZ + 4 + t * 640
        spread = 30 + t * 260
        x = 520 + rng.gauss(0, spread * 0.55)
        w = rng.uniform(14, 70) * (0.5 + t * 1.2)
        a = rng.uniform(0.25, 0.9) * (1 - t * 0.55)
        cv.drawOval(skia.Rect(x - w / 2, y, x + w / 2, y + rng.uniform(1.5, 3.5) * (0.6 + t)), P('#fff1d2', a, blend=SCREEN))
        gl.drawOval(skia.Rect(x - w / 2, y, x + w / 2, y + 3), P('#ffe3b0', a * 0.4))

    for i in range(9):                                    # marina masts
        mx = 2070 + i * 38 + rng.uniform(-8, 8)
        mh = rng.uniform(120, 250)
        cv.drawLine(mx, PIER - 18, mx, PIER - 18 - mh, P('#f2e6d6', 0.85, stroke=1.6))
        cv.drawLine(mx, PIER - 18 - mh * 0.9, mx + 40 * rng.choice([-1, 1]), PIER - 18, P('#f2e6d6', 0.35, stroke=0.9))
        cv.drawOval(skia.Rect(mx - 17, PIER - 14, mx + 17, PIER - 4), P('#f6efe4', 0.9))
    sx, sy = 880, HZ + 70
    poly(cv, [(sx, sy), (sx, sy - 120), (sx + 56, sy - 4)], P('#fdf6ea', 0.96))
    poly(cv, [(sx - 6, sy), (sx - 6, sy - 96), (sx - 42, sy - 2)], P('#f0e2cf', 0.94))
    cv.drawOval(skia.Rect(sx - 52, sy - 2, sx + 62, sy + 9), P('#2b2a2d'))

    bx0, bx1 = 1180, 1840
    FH, NF, PL = 40, 18, 74
    top_y = PIER - PL - NF * FH
    st = shader_lin(tex_stone(700, 1200, '#cdbfa6', '#eadfc9', seed=21, course=0, speck=0.03, pits=0.02))
    rect(cv, bx0 - 50, PIER - PL, bx1 + 60, PIER, st)
    rect(cv, bx0 - 50, PIER - PL, bx1 + 60, PIER, P(shader=LG(0, PIER - PL, 0, PIER, [(0, '#000000', 0.0), (1, '#1a1008', 0.45)])))
    for i in range(12):
        gx0 = bx0 - 30 + i * 56
        rect(cv, gx0, PIER - PL + 12, gx0 + 44, PIER - 6, P(shader=LG(0, PIER - PL, 0, PIER, [(0, '#f8dcaa'), (1, '#d8914a')])))
        rect(gl, gx0, PIER - PL + 12, gx0 + 44, PIER - 6, P('#f3c27a', 0.7))
    ext_l, ext_r = [], []
    for i in range(NF):
        ext_l.append(18 + 38 * (0.5 + 0.5 * math.sin(i * 0.93 + 0.7)) + rng.uniform(0, 16))
        ext_r.append(18 + 38 * (0.5 + 0.5 * math.sin(i * 1.21 + 2.1)) + rng.uniform(0, 16))
    for i in range(NF):
        yb = PIER - PL - i * FH
        yt = yb - FH
        gx0, gx1 = bx0 + 8, bx1 - 8
        rect(cv, gx0, yt + 9, gx1, yb, P(shader=LG(0, yt, 0, yb, [(0, '#c9d4e2'), (0.45, '#9db0c6'), (1, '#52667f')])))
        lit_floor = 0.25 + 0.5 * (0.5 + 0.5 * math.sin(i * 1.7))
        nbay, unit = 12, 3
        bw_ = (gx1 - gx0) / nbay
        for u in range(nbay // unit):
            if rng.random() < lit_floor:
                w = rng.choice(['#f8d6a0', '#f4c47c', '#f9e0b4'])
                ux0, ux1 = gx0 + u * unit * bw_ + 2, gx0 + (u + 1) * unit * bw_ - 2
                rect(cv, ux0, yt + 12, ux1, yb - 2, P(shader=LG(0, yt, 0, yb, [(0, mix(w, '#ffffff', 0.2)), (1, mix(w, '#b4631f', 0.4))]), a=rng.uniform(0.55, 0.85)))
                rect(gl, ux0, yt + 12, ux1, yb - 2, P(w, 0.45))
                for k in range(3):
                    cv.drawCircle(ux0 + (ux1 - ux0) * (0.2 + 0.3 * k), yt + 18, 4, P('#fff6dc', 0.7))
            elif rng.random() < 0.3:
                ux0, ux1 = gx0 + u * unit * bw_ + 2, gx0 + (u + 1) * unit * bw_ - 2
                rect(cv, ux0, yt + 12, ux1, yb - 2, P('#efe3d0', 0.30))
        for b in range(nbay + 1):
            x0 = gx0 + b * bw_
            cv.drawLine(x0, yt + 9, x0, yb, P('#1e1812', 0.42, stroke=1.2))
        rect(cv, gx0, yt + 9, gx1, yt + 26, P(shader=LG(0, yt + 9, 0, yt + 26, [(0, '#05060a', 0.55), (1, '#05060a', 0.0)])))
        if i % 3 != 1:
            span = bx1 - bx0 + ext_l[i] + ext_r[i]
            for _ in range(int(span / 7)):
                x = bx0 - ext_l[i] + rng.uniform(0, span)
                if rng.random() < 0.55:
                    cv.drawCircle(x, yt - rng.uniform(2, 9), rng.uniform(4, 8), P(rng.choice(['#27382a', '#34493a', '#1c2a20']), 0.95))
            for _ in range(7):
                x = bx0 - ext_l[i] + rng.uniform(0, span)
                cv.drawLine(x, yt + 9, x + rng.uniform(-2, 2), yt + 9 + rng.uniform(8, 22), P('#27382a', 0.9, stroke=1.6))
        rect(cv, bx0 - ext_l[i], yt - 15, bx1 + ext_r[i], yt, P('#cfe0f0', 0.14))
        cv.drawLine(bx0 - ext_l[i], yt - 15, bx1 + ext_r[i], yt - 15, P('#fff4e0', 0.55, stroke=1.2))
        rect(cv, bx0 - ext_l[i], yt, bx1 + ext_r[i], yt + 9, P(shader=LG(bx0 - ext_l[i], 0, bx1 + ext_r[i], 0, [(0, '#fff3dc'), (0.5, '#efe0c8'), (1, '#c6b496')])))
        rect(cv, bx0 - ext_l[i], yt, bx1 + ext_r[i], yt + 2, P('#ffffff', 0.7))
        rect(cv, bx0 - ext_l[i], yt + 9, bx1 + ext_r[i], yt + 11, P('#1b130b', 0.30))
    rt = top_y - 4
    rect(cv, bx0 + 60, rt - 56, bx1 - 80, rt - 50, P('#2a221b'))
    for i in range(11):
        xx = bx0 + 60 + i * (bx1 - bx0 - 140) / 10
        rect(cv, xx, rt - 56, xx + 4, rt, P('#2a221b'))
    rect(cv, bx0 + 66, rt - 46, bx1 - 86, rt - 4, P(shader=LG(0, rt - 46, 0, rt, [(0, '#f8d6a0', 0.9), (1, '#d8914a', 0.9)])))
    rect(gl, bx0 + 66, rt - 46, bx1 - 86, rt - 4, P('#f3c27a', 0.65))
    silhouette = skia.Path()
    for i in range(NF):
        yt_ = PIER - PL - i * FH - FH
        silhouette.addRect(skia.Rect(bx0 - ext_l[i], yt_ - 15, bx1 + ext_r[i], yt_ + FH))
    silhouette.addRect(skia.Rect(bx0 + 60, rt - 56, bx1 - 80, rt))
    cv.save()
    cv.clipPath(silhouette, doAntiAlias=True)
    rect(cv, bx0 - 90, top_y - 70, bx1 + 120, PIER, P(shader=LG(bx0 - 90, 0, bx1 + 120, 0, [(0, '#ffd9a0', 0.34), (0.55, '#ffd9a0', 0.04), (1, '#241830', 0.34)]), blend=SCREEN))
    rect(cv, bx0 - 90, top_y - 70, bx1 + 120, PIER, P(shader=LG(0, top_y, 0, PIER, [(0, '#000000', 0.0), (1, '#1b1020', 0.30)])))
    cv.restore()

    rect(cv, 1020, PIER, DW + 10, EDGE, P(shader=LG(0, PIER, 0, EDGE, [(0, '#e0d3bb'), (1, '#b7a78c')])))
    for i in range(0, 60):
        x = 1020 + i * 38
        cv.drawLine(x, PIER, x - (x - 1500) * 0.03, EDGE, P('#6f6048', 0.22, stroke=1.2))
    rect(cv, 1020, EDGE, DW + 10, WL, P(shader=LG(0, EDGE, 0, WL, [(0, '#8c7c63'), (1, '#2a2118')])))
    rect(cv, 1020, EDGE - 2, DW + 10, EDGE + 2, P('#fff2d6', 0.55))
    for i in range(7):
        bx_ = 1180 + i * 150
        rect(cv, bx_, EDGE - 40, bx_ + 12, EDGE, P('#2a2420'))
        gl.drawCircle(bx_ + 6, EDGE - 40, 12, P('#ffd59a', 0.9))
        cv.drawCircle(bx_ + 6, EDGE - 40, 3.5, P('#fff0d0'))
    for fx in (1430, 1462, 1590):
        figure(cv, fx, EDGE - 6, 40, c='#17120e', a=0.9)

    sc.reflect(WL, strength=0.78, fade=0.78, blur_v=3.5, blur_h=2.2, ripple=11, ripple_scale=60, mixmode=True)
    return sc


averly.finish_kw = dict(grade=dict(sat=0.88, contrast=0.28, lift=0.02, gain=1.02, shadow=(0.006, 0.008, 0.026), high=(0.04, 0.018, -0.02)), grain=0.0075, bloom=0.85)
SCENES = {'averly': averly}
