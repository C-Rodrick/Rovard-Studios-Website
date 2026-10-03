"""Northstar Capital: 30 s 3D product ad (1920x1080, 60 fps).

Screens come from capture.py (live site + dashboard via Playwright). Everything else is drawn here with skia:
a small perspective camera maps each screen/card onto a projected 3D quad (Matrix.setPolyToPoly), and the
N mark is a real extruded prism with per-face lighting.

Usage:
  python render.py stills 1 5.5 10 ...   -> stills/<t>.png
  python render.py video                  -> silent.mp4
"""
import math, os, random, subprocess, sys
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
import skia

W, H, FPS, DUR = 1920, 1080, 60, 30.0
NF = int(DUR * FPS)
R = os.path.dirname(os.path.abspath(__file__))
SH = os.path.join(R, 'shots')
F = 1400.0  # focal length: a plane at z=F renders 1:1

# ── Brand (northstar-capital/shared/tokens.css) ──────────────────────────
INK950, INK900, INK800, INK700, INK600 = (7, 9, 13), (11, 13, 18), (20, 24, 33), (28, 33, 44), (42, 48, 61)
PAPER50, PAPER100, PAPER200, PAPER300 = (251, 250, 247), (246, 245, 241), (239, 237, 231), (228, 225, 216)
SL200, SL300, SL400, SL500, SL700 = (208, 213, 221), (170, 178, 191), (133, 143, 160), (95, 104, 121), (56, 64, 80)
P200, P300, P400, P500, P600, P800, P900 = (185, 203, 255), (143, 169, 255), (106, 138, 255), (43, 91, 255), (30, 71, 230), (21, 43, 130), (15, 30, 87)
SURPLUS, SURPLUS3, AMBER = (20, 160, 111), (61, 220, 151), (237, 161, 0)
WHITE = (255, 255, 255)


def col(c, a=1.0):
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), *[int(v) for v in c])


def P(c, a=1.0, stroke=None, blur=None):
    p = skia.Paint(AntiAlias=True, Color=col(c, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


# ── Easing ───────────────────────────────────────────────────────────────
def cl(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def lin(t, a, b): return cl((t - a) / (b - a)) if b > a else float(t >= a)
def oexpo(x): return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)
def ioexpo(x):
    if x <= 0: return 0.0
    if x >= 1: return 1.0
    return 2 ** (20 * x - 10) / 2 if x < .5 else (2 - 2 ** (-20 * x + 10)) / 2
def ocubic(x): return 1 - (1 - x) ** 3
def icubic(x): return x ** 3
def iocubic(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def oback(x, s=1.4):
    x -= 1
    return x * x * ((s + 1) * x + s) + 1
def e(t, a, b, f=oexpo): return f(lin(t, a, b))
def mix(a, b, k): return a + (b - a) * k
def mixc(c1, c2, k): return tuple(mix(c1[i], c2[i], k) for i in range(3))
def rad(d): return d * math.pi / 180


# ── Fonts & text ─────────────────────────────────────────────────────────
@lru_cache(None)
def typeface(mono, weight):
    base = skia.Typeface.MakeFromFile(os.path.join(R, 'fonts', 'GeistMono.ttf' if mono else 'Geist.ttf'))
    coord = skia.FontArguments.VariationPosition.Coordinate(0x77676874, float(weight))
    pos = skia.FontArguments.VariationPosition(skia.FontArguments.VariationPosition.Coordinates([coord]))
    args = skia.FontArguments(); args.setVariationDesignPosition(pos)
    return base.makeClone(args)


@lru_cache(None)
def font(size, weight=500, mono=False):
    f = skia.Font(typeface(mono, weight), size)
    f.setEdging(skia.Font.Edging.kAntiAlias); f.setSubpixel(True); f.setHinting(skia.FontHinting.kNone)
    return f


@lru_cache(4096)
def layout(s, size, weight, mono, track):
    f = font(size, weight, mono)
    widths = f.getWidths(f.textToGlyphs(s))
    xs, x = [], 0.0
    for wd in widths:
        xs.append(x); x += wd + track * size
    return tuple(xs), x - (track * size if s else 0)


def tw(s, size, weight=500, mono=False, track=0.0):
    return layout(s, size, weight, mono, track)[1]


def text(cv, s, x, y, size, weight=500, c=INK900, a=1.0, anchor='l', mono=False, track=0.0):
    if not s or a <= 0.003:
        return 0
    xs, w = layout(s, size, weight, mono, track)
    if anchor == 'c': x -= w / 2
    elif anchor == 'r': x -= w
    blob = skia.TextBlob.MakeFromPosTextH(s, list(xs), 0, font(size, weight, mono))
    cv.drawTextBlob(blob, x, y, P(c, a))
    return w


# ── Images ───────────────────────────────────────────────────────────────
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)
_IMG = {}


def img(n):
    if n not in _IMG:
        _IMG[n] = skia.Image.open(os.path.join(SH, n + '.png')).withDefaultMipmaps()
    return _IMG[n]


def rr(x, y, w, h, r): return skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)


# ── 3D camera ────────────────────────────────────────────────────────────
class Cam:
    def __init__(self, x=0., y=0., z=0., yaw=0., pitch=0., roll=0.):
        self.p = np.array([x, y, z], float)
        cy, sy = math.cos(rad(yaw)), math.sin(rad(yaw))
        cp, sp = math.cos(rad(pitch)), math.sin(rad(pitch))
        cr, sr = math.cos(rad(roll)), math.sin(rad(roll))
        Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
        Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
        Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
        self.Rinv = (Ry @ Rx @ Rz).T

    def to_cam(self, pts):  # pts: (n,3) world -> camera space
        return (pts - self.p) @ self.Rinv.T

    def proj(self, pc):  # camera space -> screen
        z = np.maximum(pc[:, 2], 1.0)
        return np.stack([W / 2 + F * pc[:, 0] / z, H / 2 + F * pc[:, 1] / z], 1)


def rotm(rx=0., ry=0., rz=0.):
    cx, sx = math.cos(rad(rx)), math.sin(rad(rx))
    cy, sy = math.cos(rad(ry)), math.sin(rad(ry))
    cz, sz = math.cos(rad(rz)), math.sin(rad(rz))
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz


class Plane:
    """A w x h local rectangle placed in the world. Local (ax, ay) sits at `pos`; local -z faces the camera."""

    def __init__(self, cam, w, h, pos, rx=0., ry=0., rz=0., ax=None, ay=None, parent=None):
        self.cam, self.w, self.h = cam, w, h
        self.ax = w / 2 if ax is None else ax
        self.ay = h / 2 if ay is None else ay
        self.R = rotm(rx, ry, rz)
        self.pos = np.array(pos, float)
        if parent is not None:  # nest inside another plane's local space (pos given in parent's local coords)
            self.R = parent.R @ self.R
            self.pos = parent.world(np.array([pos]))[0]

    def world(self, lp):  # local (x, y, z) -> world
        lp = np.array(lp, float)
        return (lp - [self.ax, self.ay, 0]) @ self.R.T + self.pos

    def matrix(self, lz=0.0):
        corners = np.array([[0, 0, lz], [self.w, 0, lz], [self.w, self.h, lz], [0, self.h, lz]])
        pc = self.cam.to_cam(self.world(corners))
        if pc[:, 2].min() < 40:
            return None, pc
        d = self.cam.proj(pc)
        m = skia.Matrix()
        ok = m.setPolyToPoly([skia.Point(0, 0), skia.Point(self.w, 0), skia.Point(self.w, self.h), skia.Point(0, self.h)],
                             [skia.Point(*map(float, p)) for p in d])
        return (m if ok else None), pc

    def depth(self):
        return float(self.cam.to_cam(self.world([[self.w / 2, self.h / 2, 0]]))[0, 2])

    def facing(self):
        n = self.cam.Rinv @ (self.R @ np.array([0, 0, -1.]))
        c = self.cam.to_cam(self.world([[self.w / 2, self.h / 2, 0]]))[0]
        return float(-np.dot(n, c) / (np.linalg.norm(c) + 1e-9))

    def draw(self, cv, fn, lz=0.0):
        m, _ = self.matrix(lz)
        if m is None:
            return False
        cv.save(); cv.concat(m); fn(cv); cv.restore()
        return True


def shadow_on_floor(cv, cam, pl, floor_y, a=.35, blur=40, c=(0, 0, 0)):
    corners = np.array([[0, 0, 0], [pl.w, 0, 0], [pl.w, pl.h, 0], [0, pl.h, 0]])
    wp = pl.world(corners); wp[:, 1] = floor_y
    pc = cam.to_cam(wp)
    if pc[:, 2].min() < 40:
        return
    d = cam.proj(pc)
    path = skia.Path(); path.addPoly([skia.Point(*map(float, p)) for p in d], True)
    cv.drawPath(path, P(c, a, blur=blur))


# ── Environment ──────────────────────────────────────────────────────────
random.seed(7)
DUST = [(random.uniform(-2600, 2600), random.uniform(-1500, 900), random.uniform(500, 5200), random.uniform(.6, 1.6), random.random() * 6.28) for _ in range(150)]


def backdrop(cv, cam, t, dark, glow=(0., -120.), glow_a=1.0):
    base = INK950 if dark else PAPER100
    cv.clear(col(base))
    gx, gy = W / 2 + glow[0], H / 2 + glow[1]
    if dark:
        sh = skia.GradientShader.MakeRadial(skia.Point(gx, gy), 1000,
                                            [col(P800, .55 * glow_a), col(P900, .25 * glow_a), col(INK950, 0)], [0, .45, 1])
    else:
        sh = skia.GradientShader.MakeRadial(skia.Point(gx, gy), 1100,
                                            [col(P100 := (220, 229, 255), .75 * glow_a), col(PAPER100, 0)], [0, 1])
    cv.drawPaint(skia.Paint(Shader=sh))
    # perspective floor grid
    fy = 520
    lc = SL500 if dark else SL300
    pts = []
    for gx_ in range(-4000, 4001, 250):
        pts.append(((gx_, fy, 250), (gx_, fy, 7000)))
    for gz in range(500, 7001, 250):
        pts.append(((-4000, fy, gz), (4000, fy, gz)))
    for a_, b_ in pts:
        seg = cam.to_cam(np.array([a_, b_], float))
        if seg[:, 2].max() < 60: continue
        if seg[0, 2] < 60:  # clip to near plane
            k = (60 - seg[0, 2]) / (seg[1, 2] - seg[0, 2]); seg[0] = seg[0] + (seg[1] - seg[0]) * k
        if seg[1, 2] < 60:
            k = (60 - seg[1, 2]) / (seg[0, 2] - seg[1, 2]); seg[1] = seg[1] + (seg[0] - seg[1]) * k
        zf = cl(1 - (seg[:, 2].mean() - 600) / 6000)
        s = cam.proj(seg)
        cv.drawLine(*map(float, s[0]), *map(float, s[1]), P(lc, (.16 if dark else .32) * zf ** 1.5, stroke=1.2))
    # horizon fade over the grid
    hz = cam.proj(cam.to_cam(np.array([[0, fy, 7000.]])))[0, 1]
    sh = skia.GradientShader.MakeLinear([skia.Point(0, hz - 40), skia.Point(0, hz + 260)], [col(base, 1), col(base, 0)])
    cv.drawRect(skia.Rect.MakeXYWH(0, hz - 400, W, 700), skia.Paint(Shader=sh))
    # drifting dust
    pc = cam.to_cam(np.array([[x, y - t * 14 * s_, z] for x, y, z, s_, _ in DUST]))
    sp = cam.proj(pc)
    dc = P300 if dark else P400
    for i, (x, y, z, s_, ph) in enumerate(DUST):
        zc = pc[i, 2]
        if zc < 100: continue
        r = 2.2 * s_ * F / zc
        a = (.55 if dark else .35) * cl(1 - zc / 5500) * (.6 + .4 * math.sin(t * 1.3 + ph))
        cv.drawCircle(float(sp[i, 0]), float(sp[i, 1]), max(.6, r), P(dc, a))


def vignette(cv, a=.55):
    sh = skia.GradientShader.MakeRadial(skia.Point(W / 2, H / 2), 1250, [col((0, 0, 0), 0), col((0, 0, 0), a)], [.55, 1])
    cv.drawPaint(skia.Paint(Shader=sh))


# ── The mark: extruded N + inlaid north wedge ────────────────────────────
N_POLY = [(7, 42), (7, 6), (16, 6), (32, 29.04), (32, 6), (41, 6), (41, 42), (32, 42), (16, 18.96), (16, 42)]
WEDGE = [(18.2, 25.98), (18.2, 42), (29.32, 42)]
LIGHT = np.array([-.45, -.65, -1.0]); LIGHT /= np.linalg.norm(LIGHT)


def mark3d(cv, cam, pos, rx, ry, rz, size, depth=9, a=1.0, face=PAPER100, side=SL500, accent=P500, rim=0.0):
    """size = rendered height (world units) of the 36-unit-tall mark."""
    s = size / 36.0
    Rm = rotm(rx, ry, rz); pos = np.array(pos, float)
    faces = []
    for poly, fc, sc in ((N_POLY, face, side), (WEDGE, accent, P800)):
        n = len(poly)
        front = np.array([[(x - 24) * s, (y - 24) * s, -depth * s / 2] for x, y in poly])
        back = front.copy(); back[:, 2] += depth * s
        fw, bw = cam.to_cam(front @ Rm.T + pos), cam.to_cam(back @ Rm.T + pos)
        if min(fw[:, 2].min(), bw[:, 2].min()) < 40:
            return
        fs, bs = cam.proj(fw), cam.proj(bw)
        area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
        sgn = 1 if area > 0 else -1
        for i in range(n):
            j = (i + 1) % n
            ex, ey = poly[j][0] - poly[i][0], poly[j][1] - poly[i][1]
            nl = np.array([ey, -ex, 0.]) * sgn; nl /= np.linalg.norm(nl) + 1e-9
            nw = cam.Rinv @ (Rm @ nl)
            cen = (fw[i] + fw[j] + bw[i] + bw[j]) / 4
            if np.dot(nw, cen) >= 0: continue
            lam = max(0., float(np.dot(nw, -LIGHT * [-1, -1, 1] * -1)))
            lam = max(0., float(-np.dot(nw, LIGHT)))
            shade = mixc(mixc(sc, (0, 0, 0), .55), sc, .25 + .75 * lam)
            faces.append((cen[2], [fs[i], fs[j], bs[j], bs[i]], shade, 1.0))
        nf = cam.Rinv @ (Rm @ np.array([0, 0, -1.]))
        cf, cb = fw.mean(0), bw.mean(0)
        if np.dot(nf, cf) < 0:
            lam = max(0., float(-np.dot(nf, LIGHT)))
            faces.append((-1e9 + cf[2], list(fs), mixc(mixc(fc, (0, 0, 0), .25), fc, .55 + .45 * lam), 2.0))
        elif np.dot(-nf, cb) < 0:
            faces.append((-1e9 + cb[2], list(bs), mixc(fc, (0, 0, 0), .5), 2.0))
    faces.sort(key=lambda f: -f[0] if f[3] < 2 else 1e12 - f[0] - 1e9)
    sides = sorted([f for f in faces if f[3] < 2], key=lambda f: -f[0])
    caps = [f for f in faces if f[3] >= 2]
    cv.saveLayerAlpha(None, int(255 * cl(a)))
    for _, pts, c, _ in sides + caps:
        path = skia.Path(); path.addPoly([skia.Point(float(p[0]), float(p[1])) for p in pts], True)
        cv.drawPath(path, P(c))
        if _ < 2:
            cv.drawPath(path, P(c, 1, stroke=.8))  # seal hairline seams
    cv.restore()


# ── UI pieces drawn in plane-local space ─────────────────────────────────
def sheen(cv, w, h, k, a=.16, r=18):
    """diagonal specular band; k in [0,1] slides it across."""
    x = mix(-w * .6, w * 1.4, k)
    sh = skia.GradientShader.MakeLinear([skia.Point(x - 260, 0), skia.Point(x + 260, h * .35)],
                                        [col(WHITE, 0), col(WHITE, a), col(WHITE, 0)], [0, .5, 1])
    cv.save(); cv.clipRRect(rr(0, 0, w, h, r), True); cv.drawPaint(skia.Paint(Shader=sh)); cv.restore()


def browser_fn(name, w, h, scroll=0.0, dark_chrome=False, nav=None, sheen_k=None):
    BAR = 46

    def fn(cv):
        cv.drawRRect(rr(-1, -1, w + 2, h + 2, 18), P(SL300 if not dark_chrome else INK600, .9))
        cv.save(); cv.clipRRect(rr(0, 0, w, h, 16), True)
        cv.drawRect(skia.Rect.MakeWH(w, BAR), P(PAPER200 if not dark_chrome else INK800))
        for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
            cv.drawCircle(26 + i * 20, BAR / 2, 6, P(c))
        tcol = INK900 if not dark_chrome else PAPER100
        pill_w = 420
        cv.drawRRect(rr(w / 2 - pill_w / 2, 9, pill_w, BAR - 18, 8), P(WHITE if not dark_chrome else INK700))
        text(cv, 'Northstar Capital', w / 2, BAR / 2 + 5, 14, 500, tcol, .7, 'c')
        im = img(name)
        sc = w / im.width(); vis = (h - BAR) / sc
        src = skia.Rect.MakeXYWH(0, scroll, im.width(), vis)
        cv.drawImageRect(im, src, skia.Rect.MakeXYWH(0, BAR, w, h - BAR), SAMP, None)
        if nav is not None and scroll > 2:
            ni = img(nav); nh = 96
            cv.drawImageRect(ni, skia.Rect.MakeXYWH(0, 0, ni.width(), nh), skia.Rect.MakeXYWH(0, BAR, w, nh * sc), SAMP, None)
            cv.drawRect(skia.Rect.MakeXYWH(0, BAR + nh * sc, w, 1), P(SL200, .8))
        cv.restore()
        if sheen_k is not None:
            sheen(cv, w, h, sheen_k, .10, 16)
    return fn


def phone_fn(name, w, h, sheen_k=None):
    def fn(cv):
        cv.drawRRect(rr(-14, -14, w + 28, h + 28, 62), P(INK800))
        cv.drawRRect(rr(-14, -14, w + 28, h + 28, 62), P(SL500, .9, stroke=2))
        cv.save(); cv.clipRRect(rr(0, 0, w, h, 50), True)
        cv.drawImageRect(img(name), skia.Rect.MakeWH(w, h), SAMP, None)
        cv.restore()
        cv.drawRRect(rr(w / 2 - 58, 12, 116, 34, 17), P((0, 0, 0)))
        if sheen_k is not None:
            sheen(cv, w, h, sheen_k, .14, 50)
    return fn


def card_fn(w, h, draw, dark=False):
    def fn(cv):
        cv.drawRRect(rr(0, 0, w, h, 20), P(INK800 if dark else WHITE))
        cv.drawRRect(rr(0, 0, w, h, 20), P(INK600 if dark else PAPER300, 1, stroke=1.5))
        draw(cv)
    return fn


def arrow_up(cv, x, y, c, a=1, s=1.):
    p = skia.Path(); p.moveTo(x, y + 5 * s); p.lineTo(x + 5 * s, y - 2 * s); p.lineTo(x + 10 * s, y + 5 * s)
    cv.drawPath(p, P(c, a, stroke=2.4 * s))


def sparkline(cv, x, y, w, h, k, c=P500, seed=3):
    rnd = random.Random(seed); v = 0.5; pts = []
    for i in range(40):
        v = cl(v + rnd.uniform(-.12, .14), .05, .95); pts.append((x + w * i / 39, y + h * (1 - v * (.5 + .5 * i / 39))))
    n = max(2, int(len(pts) * cl(k)))
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:n]: p.lineTo(*q)
    cv.drawPath(p, P(c, 1, stroke=3))
    fill = skia.Path(p); fill.lineTo(pts[n - 1][0], y + h); fill.lineTo(x, y + h); fill.close()
    sh = skia.GradientShader.MakeLinear([skia.Point(0, y), skia.Point(0, y + h)], [col(c, .22), col(c, 0)])
    cv.drawPath(fill, skia.Paint(AntiAlias=True, Shader=sh))


def money(v, cents=False):
    s = '{:,.0f}'.format(v)
    return '$' + s


# ── Scenes ───────────────────────────────────────────────────────────────
def s1_logo(cv, t):
    """0 – 4.3  dark void, extruded mark flies in and lands, wordmark resolves."""
    k = e(t, 0, 2.6, ioexpo)
    push = icubic(lin(t, 3.55, 4.3))
    cam = Cam(x=mix(-260, 0, k), y=mix(-160, -40, k), z=mix(-500, 0, k) + 1250 * push, yaw=mix(-14, 0, k), pitch=mix(10, 2, k))
    backdrop(cv, cam, t, True, glow=(0, -60), glow_a=e(t, .1, 1.6, ocubic))
    # light streak
    ks = lin(t, .25, 1.35)
    if 0 < ks < 1:
        x = mix(-600, W + 600, ocubic(ks))
        sh = skia.GradientShader.MakeLinear([skia.Point(x - 500, 0), skia.Point(x + 500, 0)], [col(P400, 0), col(P300, .55), col(P400, 0)])
        cv.drawRect(skia.Rect.MakeXYWH(0, H / 2 - 110, W, 3), skia.Paint(Shader=sh))
        cv.drawRect(skia.Rect.MakeXYWH(0, H / 2 - 150, W, 80), skia.Paint(Shader=sh, MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 40), Alpha=90))
    land = e(t, .15, 2.4, oexpo)
    ry = mix(-150, -16, land) + 12 * math.sin(t * .9) * lin(t, 2, 3.5)
    rx = mix(30, 6, land)
    mpos = (0, -110, 1400 + mix(2600, 0, land))
    # glow under/behind
    g = cam.proj(cam.to_cam(np.array([mpos])))[0]
    cv.drawCircle(float(g[0]), float(g[1]), 260, P(P500, .35 * lin(t, .6, 2), blur=120))
    mark3d(cv, cam, mpos, rx, ry, 0, 300, depth=10, a=lin(t, .1, .6))
    # wordmark on a plane under the mark
    kw = e(t, 1.7, 2.9, oexpo)
    if kw > 0:
        wm = Plane(cam, 900, 200, (0, 160, 1400), rx=mix(70, 0, kw))
        def word(c):
            text(c, 'Northstar', 450, 90, 108, 620, PAPER100, kw, 'c', track=-.04)
            text(c, 'CAPITAL', 450, 160, 30, 500, SL300, kw * .9, 'c', mono=True, track=.62)
        wm.draw(cv, word)
    vignette(cv, .6)
    # into the blue
    if t > 3.85:
        cv.drawRect(skia.Rect.MakeWH(W, H), P(P500, ocubic(lin(t, 3.85, 4.3))))


HEAD = [[('Know', 0), ('exactly', 0)], [('where', 0), ('your', 1)], [('business', 1), ('stands.', 1)]]


def s2_headline(cv, t, overlay=True):
    """4.3 – 8.4  kinetic 3D headline on paper."""
    lt = t - 4.3
    out = ioexpo(lin(t, 7.55, 8.35))
    cam = Cam(x=mix(-60, 60, lin(t, 4.3, 8.4)), y=-20, z=mix(-120, 60, ocubic(lin(t, 4.3, 7.6))),
              yaw=mix(-4, 3, lin(t, 4.3, 8.4)), pitch=mix(2, -1, lin(t, 4.3, 8)))
    if overlay:
        backdrop(cv, cam, t, False, glow=(300, -100))
    size, wt, lh = 168, 620, 168
    lines_w = [sum(tw(w_, size, wt, track=-.045) for w_, _ in ln) + 44 * (len(ln) - 1) for ln in HEAD]
    x0 = -max(lines_w) / 2; y0 = -lh * 1.5 + 20
    idx = 0
    for li, ln in enumerate(HEAD):
        x = x0
        for word, dim in ln:
            ww = tw(word, size, wt, track=-.045)
            st = .15 + idx * .13
            k = lin(lt, st, st + .9)
            if k > 0:
                kk = oback(k, 1.25)
                exit_z = 1500 * out * (1 + li * .35)
                pl = Plane(cam, ww + 20, size * 1.2, (x, y0 + li * lh + size * .9, 1400 + exit_z), rx=mix(-95, 0, kk), ry=mix(20, 0, kk),
                           ax=0, ay=size * 1.0)
                c = SL400 if dim else INK900
                pl.draw(cv, lambda c_, ww=ww, word=word, c=c, k=k: text(c_, word, 0, size * .98, size, wt, c, cl(k * 2.5) * (1 - cl(out * 1.6)), track=-.045))
            x += ww + 44; idx += 1
    # eyebrow
    ke = e(lt, .1, .9)
    if ke > 0:
        eb = Plane(cam, 900, 40, (x0, y0 - 40, 1400 + 1500 * out), ax=0, ay=30)
        def eyebrow(c):
            c.drawRRect(rr(0, 0, 64, 30, 15), P(P500, ke * (1 - out)))
            text(c, 'NEW', 32, 21, 15, 600, WHITE, ke * (1 - out), 'c', mono=True, track=.08)
            text(c, 'Financial clarity for small business', 80, 22, 22, 500, SL500, ke * (1 - out))
        eb.draw(cv, eyebrow)
    # blue wash from scene 1
    if t < 4.75:
        cv.drawRect(skia.Rect.MakeWH(W, H), P(P500, 1 - ocubic(lin(t, 4.3, 4.75))))


def s3_website(cv, t):
    """7.7 – 14.2  the live site in a floating 3D browser; page scrolls; data cards lift off the glass."""
    k_in = e(t, 7.85, 9.1, oexpo)
    k_out = ioexpo(lin(t, 13.45, 14.2))
    drift = lin(t, 8.5, 14)
    cam = Cam(x=mix(140, -120, drift) - 400 * k_out, y=mix(-40, -10, drift), z=mix(-60, 80, ocubic(drift)) - 300 * k_out,
              yaw=mix(5, -5, iocubic(drift)) - 18 * k_out, pitch=mix(4, 1, drift))
    if t >= 8.35:
        backdrop(cv, cam, t, False, glow=(-200, -60))
    w, h = 1360, 870
    pl = Plane(cam, w, h, (0, mix(900, -10, k_in), mix(2200, 1500, k_in)),
               rx=mix(48, 7, k_in) - 3 * drift, ry=mix(-35, -14, k_in) + 22 * iocubic(drift) + 30 * k_out, rz=mix(-8, 0, k_in))
    shadow_on_floor(cv, cam, pl, 520, .16 * k_in, 60)
    # browser thickness
    for i in range(6, 0, -1):
        pl.draw(cv, lambda c: c.drawRRect(rr(-1, -1, w + 2, h + 2, 18), P(SL300 if i > 1 else SL200)), lz=i * 2.4)
    sc = (lin(t, 9.4, 13.3))
    scroll = 4700 * iocubic(sc)
    pl.draw(cv, browser_fn('home_full', w, h, scroll, nav='home', sheen_k=lin(t, 8.6, 12.5)))
    # floating cards (in browser-local space, lifted toward the camera)
    cards = [
        (9.9, 12.7, -60, 520, 400, 190, -170, 'cash'),
        (10.35, 13.0, 1030, 140, 400, 132, -230, 'overdue'),
        (10.8, 13.3, 1010, 640, 410, 132, -120, 'payroll'),
    ]
    for t0, t1, cx, cy, cw, ch, lz, kind in cards:
        k = e(t, t0, t0 + .9, oexpo) * (1 - e(t, t1, t1 + .5, ocubic))
        if k <= 0: continue
        cp = Plane(cam, cw, ch, (cx + cw / 2, cy + ch / 2 + 30 * (1 - k), lz * k - 4), ry=mix(-25, 0, k), parent=pl)
        def card(c, kind=kind, k=k, cw=cw, ch=ch):
            c.saveLayerAlpha(None, int(255 * cl(k * 1.4)))
            c.drawRRect(rr(6, 22, cw - 12, ch - 6, 22), P((15, 30, 87), .22, blur=26))
            card_fn(cw, ch, lambda c2: None)(c)
            if kind == 'cash':
                text(c, 'CASH ON HAND', 28, 42, 15, 500, SL500, 1, mono=True, track=.09)
                v = 201704 * oexpo(lin(t, 9.9, 11.2))
                text(c, money(v), 28, 108, 58, 620, INK900, 1, track=-.035)
                c.drawRRect(rr(28, 128, 96, 34, 17), P(SURPLUS, .12)); arrow_up(c, 40, 142, SURPLUS, 1, .9)
                text(c, '+1.0%', 58, 151, 17, 600, SURPLUS)
                text(c, 'vs 30 days ago', 138, 151, 17, 450, SL500)
                sparkline(c, 250, 128, 125, 42, lin(t, 10, 11.4), P500, 4)
            elif kind == 'overdue':
                c.drawCircle(42, 44, 14, P(AMBER, .18)); c.drawCircle(42, 44, 5, P(AMBER))
                text(c, '4 invoices are overdue', 70, 51, 22, 600, INK900)
                text(c, '$18,932 outstanding', 28, 90, 18, 450, SL500)
                text(c, 'Send reminders  →', 28, 118, 18, 550, P500)
            else:
                c.drawCircle(42, 44, 14, P(SURPLUS, .15)); c.drawCircle(42, 44, 5, P(SURPLUS))
                text(c, 'Payroll is covered', 70, 51, 22, 600, INK900)
                text(c, 'Next run in 13 days · $27,264 net this month', 28, 90, 17, 450, SL500)
                c.drawRRect(rr(28, 104, 350, 8, 4), P(PAPER200)); c.drawRRect(rr(28, 104, 350 * .82 * oexpo(lin(t, 11, 12)), 8, 4), P(SURPLUS))
            c.restore()
        cp.draw(cv, card)
    # label
    kl = e(t, 8.4, 9.2) * (1 - lin(t, 13.2, 13.6))
    text(cv, '01', 96, 112, 18, 500, P500, kl, mono=True, track=.1)
    text(cv, 'THE WEBSITE', 140, 112, 18, 500, SL500, kl, mono=True, track=.14)


APP = [('app_overview', '02', 'Every account, one live view.', 'Cash on hand, updated as money moves'),
       ('app_cash', '03', 'See 90 days ahead.', 'Forecasts built from bills, payroll and invoices'),
       ('app_invoices', '04', 'Get paid nine days faster.', 'Send, track and chase invoices in seconds'),
       ('app_reports', '05', 'Books your accountant trusts.', 'P&L and cash reports, always up to date')]
CAR_T = [14.6, 16.25, 17.9, 19.55]


def s4_dashboard(cv, t):
    """13.9 – 21.6  dark: dashboard screens on a 3D carousel arc."""
    k_in = e(t, 13.9, 15.0, oexpo)
    out = ioexpo(lin(t, 20.9, 21.7))
    step = sum(iocubic(lin(t, ts + 1.2, ts + 1.85)) for ts in CAR_T[:3])
    ang_step = 38
    cam = Cam(x=0, y=mix(-260, -70, k_in) + 200 * out, z=mix(-900, 0, k_in) - 500 * out, pitch=mix(14, 4, k_in) + 8 * out,
              yaw=2 * math.sin(t * .5))
    backdrop(cv, cam, t, True, glow=(0, -40), glow_a=k_in)
    Rr, zc = 2100, 1550 + 2100
    w, h = 1180, 1180 / 1.6
    items = []
    for i, (name, *_r) in enumerate(APP):
        a = (i - step) * ang_step
        x = Rr * math.sin(rad(a)); z = zc - Rr * math.cos(rad(a))
        pl = Plane(cam, w, h, (x, -5 + 25 * math.sin(t * .8 + i), z), ry=-a, rx=0)
        items.append((pl.depth(), i, pl, a))
    for d, i, pl, a in sorted(items, key=lambda q: -q[0]):
        if abs(a) > 100: continue
        dim = cl(abs(a) / 50)
        shadow_on_floor(cv, cam, pl, 520, .5 * (1 - dim * .6), 50)
        for j in range(5, 0, -1):
            pl.draw(cv, lambda c: c.drawRRect(rr(-1, -1, w + 2, h + 2, 18), P(INK600 if j > 1 else SL700)), lz=j * 2.6)
        def scr(c, name=APP[i][0], dim=dim, a=a):
            browser_fn(name, w, h, 0, dark_chrome=True, sheen_k=cl(.5 - a / 80))(c)
            c.drawRRect(rr(0, 0, w, h, 16), P(INK950, .55 * dim))
            c.drawRRect(rr(0, 0, w, h, 16), P(P400, .5 * (1 - dim), stroke=1.6))
        pl.draw(cv, scr)
        # reflection on the floor
    # captions (2D, track active index)
    fi = step
    for i, (_, num, head, sub) in enumerate(APP):
        ka = cl(1 - abs(fi - i) * 2.2) * k_in * (1 - out)
        if ka <= 0: continue
        dy = (fi - i) * 60
        text(cv, num, W / 2, 168 + dy, 18, 500, P400, ka, 'c', mono=True, track=.1)
        text(cv, head, W / 2, 236 + dy, 60, 620, PAPER100, ka, 'c', track=-.035)
        text(cv, sub, W / 2, 286 + dy, 24, 450, SL300, ka * .9, 'c')
    vignette(cv, .55)
    kl = k_in * (1 - out)
    text(cv, 'THE PRODUCT', 96, 112, 18, 500, SL300, kl, mono=True, track=.14)
    if t < 14.25:  # dark wipe from below
        k = ioexpo(lin(t, 13.6, 14.25))
        return k


STATS = [('12,400+', 'U.S. businesses run on Northstar', 12400, '{:,.0f}+'), ('9 days', 'faster to get paid, on average', 9, '{:.0f} days'),
         ('$4.1B', 'in invoices tracked', 4.1, '${:.1f}B')]


def s5_mobile(cv, t):
    """21.2 – 26.0  phones rise in 3D; stats count up."""
    k_in = e(t, 21.2, 22.6, oexpo)
    out = ioexpo(lin(t, 25.3, 26.1))
    d = lin(t, 21.2, 26)
    cam = Cam(x=mix(-120, 120, d), y=-60, z=mix(-200, 40, ocubic(d)) + 600 * out, yaw=mix(-5, 5, iocubic(d)), pitch=4)
    backdrop(cv, cam, t, True, glow=(260, -40))
    pw, ph = 390, 844
    phones = [('m_overview', 200, 1850, -18, 0.0), ('m_cash', 720, 2150, -26, .22)]
    for name, x, z, ry, dl in sorted(phones, key=lambda p: -p[2]):
        k = e(t, 21.25 + dl, 22.7 + dl, oexpo)
        pl = Plane(cam, pw, ph, (x, mix(1300, -60, k) + 14 * math.sin(t * 1.1 + dl * 9) - 900 * out * (1 + dl), z),
                   rx=mix(-40, 4, k), ry=ry + mix(-60, 0, k) + 8 * math.sin(t * .6 + dl * 5), rz=mix(12, 2, k))
        shadow_on_floor(cv, cam, pl, 520, .55 * k, 40)
        for j in range(9, 0, -1):
            pl.draw(cv, lambda c, j=j: c.drawRRect(rr(-14, -14, pw + 28, ph + 28, 62), P(SL700 if j < 9 else INK700)), lz=j * 2.2)
        pl.draw(cv, phone_fn(name, pw, ph, sheen_k=lin(t, 21.6 + dl, 24.8)))
    # stats on the left
    for i, (_, lbl, v, fmt) in enumerate(STATS):
        k = e(t, 22.0 + i * .35, 22.9 + i * .35, oexpo) * (1 - out)
        if k <= 0: continue
        val = v * oexpo(lin(t, 22.0 + i * .35, 23.6 + i * .35))
        y = 330 + i * 210
        cv.save(); cv.translate(-60 * (1 - k), 0)
        cv.drawRect(skia.Rect.MakeXYWH(150, y - 74, 4, 104), P(P500, k))
        text(cv, fmt.format(val), 186, y, 92, 620, PAPER100, k, track=-.04)
        text(cv, lbl, 190, y + 40, 26, 450, SL300, k * .9)
        cv.restore()
    kl = k_in * (1 - out)
    text(cv, 'IN YOUR POCKET', 96, 112, 18, 500, SL300, kl, mono=True, track=.14)
    vignette(cv, .5)


def s6_end(cv, t):
    """25.7 – 30  end card."""
    k = e(t, 25.7, 27.2, oexpo)
    cam = Cam(x=0, y=mix(-200, -60, k), z=mix(-700, 0, k) + 60 * lin(t, 27, 30), pitch=mix(10, 3, k))
    backdrop(cv, cam, t, True, glow=(0, -150), glow_a=k)
    ry = mix(140, -14, e(t, 25.7, 27.6, oexpo)) + 10 * math.sin((t - 27) * 1.2) * lin(t, 27, 28.5)
    g = cam.proj(cam.to_cam(np.array([[0, -250, 1400.]])))[0]
    cv.drawCircle(float(g[0]), float(g[1]), 200, P(P500, .35 * k, blur=110))
    mark3d(cv, cam, (0, -250, 1400 + 1200 * (1 - k)), 6, ry, 0, 190, depth=10, a=cl(k * 2))
    k2 = e(t, 26.4, 27.5, oexpo)
    cv.save(); cv.translate(0, 40 * (1 - k2))
    text(cv, 'Know where you stand.', W / 2, 640, 100, 620, PAPER100, k2, 'c', track=-.045)
    text(cv, 'Cash flow, invoices and spending in one clear view.', W / 2, 712, 30, 450, SL300, k2 * .9, 'c')
    cv.restore()
    k3 = e(t, 27.0, 28.0, oback)
    if k3 > 0:
        bw1, bw2, bh = 240, 330, 68
        x0 = W / 2 - (bw1 + bw2 + 20) / 2; y = 790
        cv.save(); cv.translate(0, 30 * (1 - cl(k3)))
        a = cl(k3)
        cv.drawRRect(rr(x0, y + 10, bw1, bh, bh / 2), P(P500, .55 * a, blur=26))
        cv.drawRRect(rr(x0, y, bw1, bh, bh / 2), P(P500, a))
        text(cv, 'Start free  →', x0 + bw1 / 2, y + 44, 26, 600, WHITE, a, 'c')
        cv.drawRRect(rr(x0 + bw1 + 20, y, bw2, bh, bh / 2), P(PAPER100, .35 * a, stroke=1.5))
        text(cv, 'Explore the live demo', x0 + bw1 + 20 + bw2 / 2, y + 44, 26, 500, PAPER100, a, 'c')
        cv.restore()
    k4 = e(t, 27.8, 28.6)
    text(cv, 'No credit card required  ·  Free for solo founders', W / 2, 925, 22, 450, SL400, k4, 'c')
    text(cv, 'Northstar Capital is a self-initiated concept by Rovard Studios. Fictional brand and data; not a bank.', W / 2, 1040, 17, 450, SL500, k4 * .85, 'c')
    vignette(cv, .5)


# ── Compositor ───────────────────────────────────────────────────────────
def render(t):
    info = skia.ImageInfo.Make(W, H, skia.kRGBA_8888_ColorType, skia.kPremul_AlphaType)
    surf = skia.Surface.MakeRaster(info); cv = surf.getCanvas()
    if t < 4.3:
        s1_logo(cv, t)
    elif t < 7.7:
        s2_headline(cv, t)
    elif t < 13.6:
        # headline exits through the camera while the browser flies in on the same paper set
        if t < 8.35:
            cam = Cam()
            backdrop(cv, Cam(x=60, y=-20, z=60, yaw=3, pitch=-1), t, False, glow=(300, -100))
            s3_website(cv, t)
            s2_headline(cv, t, overlay=False)
        else:
            s3_website(cv, t)
    elif t < 21.2:
        if t < 14.25:
            s3_website(cv, t)
            k = ioexpo(lin(t, 13.6, 14.25))
            y = H * (1 - k)
            cv.save(); cv.clipRect(skia.Rect.MakeXYWH(0, y, W, H - y)); s4_dashboard(cv, t); cv.restore()
            cv.drawRect(skia.Rect.MakeXYWH(0, y - 3, W, 3), P(P500))
        else:
            s4_dashboard(cv, t)
    elif t < 21.7:
        s4_dashboard(cv, t)
        k = ocubic(lin(t, 21.2, 21.7))
        layer = cv.saveLayerAlpha(None, int(255 * k)); s5_mobile(cv, t); cv.restore()
    elif t < 25.7:
        s5_mobile(cv, t)
    elif t < 26.1:
        s5_mobile(cv, t)
        cv.saveLayerAlpha(None, int(255 * ocubic(lin(t, 25.7, 26.1)))); s6_end(cv, t); cv.restore()
    else:
        s6_end(cv, t)
    # film grain-free fades
    if t < .35:
        cv.drawRect(skia.Rect.MakeWH(W, H), P((0, 0, 0), 1 - t / .35))
    if t > 29.4:
        cv.drawRect(skia.Rect.MakeWH(W, H), P((0, 0, 0), ocubic(lin(t, 29.4, 30))))
    return surf


def frame_bytes(f):
    return render(f / FPS).makeImageSnapshot().tobytes()


def stills(ts):
    os.makedirs(os.path.join(R, 'stills'), exist_ok=True)
    for t in ts:
        render(float(t)).makeImageSnapshot().save(os.path.join(R, 'stills', '%05.2f.png' % float(t)), skia.kPNG)
        print('still', t, flush=True)


def ff():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def video():
    out = os.path.join(R, 'silent.mp4')
    pr = subprocess.Popen([ff(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '%dx%d' % (W, H), '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out],
                          stdin=subprocess.PIPE)
    with Pool(10) as pool:
        for i, b in enumerate(pool.imap(frame_bytes, range(NF), chunksize=4)):
            pr.stdin.write(b)
            if i % 120 == 0:
                print(i, '/', NF, flush=True)
    pr.stdin.close(); pr.wait(); print('done', flush=True)


if __name__ == '__main__':
    stills(sys.argv[2:]) if sys.argv[1] == 'stills' else video()
