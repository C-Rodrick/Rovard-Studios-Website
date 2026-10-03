"""Material and detail studies — raking light, close-up crops."""
import math

import numpy as np
import skia

from core import *  # noqa
from parts import *  # noqa


def _finish(fn, **kw):
    fn.finish_kw = kw
    fn.export = (1600, 78)
    return fn


def d_bronze(W=2400, seed=21):
    sc = Scene(W, seed=seed)
    cv, gl = sc.cv, sc.gl
    rect(cv, 0, 0, DW, DH, P('#0d0b09'))
    tex = shader_lin(tex_bronze(160, 1500, seed=3))
    fw, gap = 118, 20
    x = -40
    while x < DW + 40:
        rect(cv, x, 0, x + fw, DH, tex)
        # rounded bar section: bright raking edge, then falling off into shade
        rect(cv, x, 0, x + fw, DH, P(shader=LG(x, 0, x + fw, 0, [(0, '#ffe2b0', 0.78), (0.14, '#d29a58', 0.35), (0.5, '#000000', 0.12), (1, '#000000', 0.74)])))
        rect(cv, x + gap * 0.0, 0, x + 3, DH, P('#fff1d2', 0.5))
        rect(cv, x + fw, 0, x + fw + gap, DH, P('#030302'))
        x += fw + gap
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, DW, DH, [(0, '#ffd9a0', 0.30), (0.5, '#000000', 0.0), (1, '#000000', 0.55)])))
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, 0, DH, [(0, '#000000', 0.0), (1, '#000000', 0.5)])))
    rect(cv, 0, 0, DW, 6, P('#000000', 0.0))
    gl.drawRect(skia.Rect(0, 0, 500, DH), P(shader=LG(0, 0, 500, 0, [(0, '#f1b868', 0.35), (1, '#f1b868', 0.0)])))
    return sc


def d_stone(W=2400, seed=22):
    sc = Scene(W, seed=seed)
    cv, gl = sc.cv, sc.gl
    tex = shader_lin(tex_stone(2400, 1500, '#b9ab8e', '#e6d9bb', seed=14, course=170, joint=0.55, speck=0.05, pits=0.07))
    rect(cv, 0, 0, DW, DH, tex)
    # grazing light from the left: joints throw shadows
    for i in range(1, 9):
        y = i * 170 - 60
        rect(cv, 0, y, DW, y + 26, P(shader=LG(0, y, 0, y + 26, [(0, '#2a1c0e', 0.50), (1, '#2a1c0e', 0.0)])))
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, DW, 0, [(0, '#ffe7bd', 0.42), (0.55, '#ffe7bd', 0.0), (1, '#1a1008', 0.55)])))
    # bronze reveal set into the wall
    rect(cv, 0, 668, DW, 692, P('#2b1f14'))
    rect(cv, 0, 672, DW, 682, P(shader=LG(0, 672, 0, 682, [(0, '#d9a96a'), (1, '#6b4a28')])))
    rect(cv, 0, 692, DW, 740, P(shader=LG(0, 692, 0, 740, [(0, '#000000', 0.45), (1, '#000000', 0.0)])))
    return sc


def d_oak(W=2400, seed=23):
    sc = Scene(W, seed=seed)
    cv, gl = sc.cv, sc.gl
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, 0, DH, [(0, '#f3c27a'), (1, '#c8854a')])))
    gl.drawRect(skia.Rect(0, 0, DW, DH), P('#f1b868', 0.5))
    tex = shader_lin(tex_oak(150, 1500, seed=6, vertical=True))
    sw, gap = 96, 30
    x = -20
    while x < DW:
        rect(cv, x, 0, x + sw, DH, tex)
        rect(cv, x, 0, x + sw, DH, P(shader=LG(x, 0, x + sw, 0, [(0, '#fff0cf', 0.18), (0.5, '#000000', 0.0), (1, '#1a0f06', 0.6)])))
        rect(cv, x + sw, 0, x + sw + 14, DH, P(shader=LG(x + sw, 0, x + sw + 14, 0, [(0, '#000000', 0.7), (1, '#000000', 0.0)])))
        x += sw + gap
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, 0, DH, [(0, '#000000', 0.45), (0.45, '#000000', 0.0), (1, '#000000', 0.40)])))
    return sc


def d_travertine(W=2400, seed=24):
    sc = Scene(W, seed=seed)
    cv, gl = sc.cv, sc.gl
    tex = shader_lin(tex_travertine(2400, 1500, seed=5))
    rect(cv, 0, 0, DW, DH, tex)
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, DW, DH, [(0, '#fff3d8', 0.25), (1, '#3a2a18', 0.35)])))
    # a window mullion's shadow falling across the slab
    poly(cv, [(1100, 0), (1230, 0), (780, 1500), (650, 1500)], P('#3a2812', 0.34, blur=3))
    poly(cv, [(1500, 0), (1560, 0), (1110, 1500), (1050, 1500)], P('#3a2812', 0.26, blur=3))
    # inset bronze line
    rect(cv, 0, 1010, DW, 1024, P(shader=LG(0, 1010, 0, 1024, [(0, '#c99b5c'), (1, '#6e4c2a')])))
    rect(cv, 0, 1024, DW, 1060, P(shader=LG(0, 1024, 0, 1060, [(0, '#000000', 0.35), (1, '#000000', 0.0)])))
    return sc


def d_glass(W=2400, seed=25):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    rect(cv, 0, 0, DW, DH, P('#08090c'))
    pw, ph = 380, 560
    for r in range(-1, 4):
        for c in range(-1, 7):
            x, y = c * (pw + 16), r * (ph + 16)
            rect(cv, x, y, x + pw, y + ph, P(shader=LG(x, y, x + pw * 0.6, y + ph, [(0, '#c28a64'), (0.35, '#7a6a86'), (0.7, '#2f3a56'), (1, '#10151f')])))
            rect(cv, x, y, x + pw, y + ph, P(shader=LG(x, 0, x + pw, 0, [(0, '#ffffff', 0.0), (0.5, '#ffd9a0', 0.12), (1, '#ffffff', 0.0)]), blend=SCREEN))
    # a diagonal reflection of the sky sweeping across every pane
    poly(cv, [(300, 0), (900, 0), (-100, 1500), (-700, 1500)], P('#ffe3bd', 0.14, blur=60, blend=SCREEN))
    for c in range(-1, 8):
        x = c * (pw + 16) - 16
        rect(cv, x, 0, x + 16, DH, P(shader=LG(x, 0, x + 16, 0, [(0, '#2a2018'), (0.5, '#9a7448'), (1, '#1e160f')])))
    for r in range(-1, 4):
        y = r * (ph + 16) - 16
        rect(cv, 0, y, DW, y + 16, P(shader=LG(0, y, 0, y + 16, [(0, '#2a2018'), (0.5, '#9a7448'), (1, '#1e160f')])))
    gl.drawRect(skia.Rect(0, 0, DW, DH), P('#f1b868', 0.12))
    return sc


def d_plaster(W=2400, seed=26):
    sc = Scene(W, seed=seed)
    cv, gl, rng = sc.cv, sc.gl, sc.rng
    tex = shader_lin(tex_plaster(2400, 1500, '#d9cfbc', '#efe7d6', seed=9))
    rect(cv, 0, 0, DW, DH, tex)
    rect(cv, 0, 0, DW, DH, P(shader=LG(0, 0, DW, DH, [(0, '#fff6e2', 0.4), (1, '#6b5a40', 0.38)])))
    # window shadow: arched opening of light, with a soft branch shadow
    path = skia.Path()
    path.moveTo(700, 1500)
    path.lineTo(700, 640)
    path.cubicTo(700, 260, 1380, 260, 1380, 640)
    path.lineTo(1380, 1500)
    path.close()
    cv.drawPath(path, P('#fff1cf', 0.55, blur=2))
    for _ in range(26):
        bx = rng.uniform(750, 1330)
        by = rng.uniform(700, 1300)
        cv.drawOval(skia.Rect(bx, by, bx + rng.uniform(40, 90), by + rng.uniform(14, 30)), P('#4a3a20', rng.uniform(0.12, 0.3), blur=7))
    rect(cv, 0, 1360, DW, 1500, P(shader=LG(0, 1360, 0, 1500, [(0, '#000000', 0.0), (1, '#2a1c10', 0.35)])))
    return sc


for _f in (d_bronze, d_stone, d_oak, d_travertine, d_glass, d_plaster):
    _finish(_f, grade=dict(sat=0.92, contrast=0.3, lift=0.015), grain=0.009, bloom=0.8, vignette=0.22)

SCENES = {'d_bronze': d_bronze, 'd_stone': d_stone, 'd_oak': d_oak, 'd_travertine': d_travertine, 'd_glass': d_glass, 'd_plaster': d_plaster}
