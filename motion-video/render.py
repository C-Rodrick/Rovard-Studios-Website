"""Rovard Studios — 90 s brand motion film (1920x1080, 60 fps).

Usage:
  python render.py stills 3.2 9.5 16 ...   -> stills/<t>.png for quick checks
  python render.py video                    -> build/video.mp4 (silent, chunked + concatenated)
"""
import math, os, random, subprocess, sys
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
import skia

W, H, FPS, DUR = 1920, 1080, 60, 90.0
NF = int(DUR * FPS)
ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, '..', 'assets')
BUILD = os.path.join(ROOT, 'build')

# ── Brand ────────────────────────────────────────────────────────────────
BLUE, DEEP, YEL, GOLD = (22, 45, 175), (0, 9, 133), (245, 204, 0), (216, 169, 1)
PAPER, SURF, INK, WHITE = (247, 247, 245), (236, 236, 232), (10, 10, 11), (255, 255, 255)
MUTED = (112, 113, 116)
NAVY = (5, 9, 52)


def col(rgb, a=1.0):
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), *rgb)


def paint(rgb, a=1.0, stroke=None, blur=None):
    p = skia.Paint(AntiAlias=True, Color=col(rgb, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


# ── Easing ───────────────────────────────────────────────────────────────
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def lin(t, a, b): return clamp((t - a) / (b - a)) if b > a else float(t >= a)
def oexpo(x): return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)
def iexpo(x): return 0.0 if x <= 0 else 2 ** (10 * x - 10)
def ioexpo(x):
    if x <= 0: return 0.0
    if x >= 1: return 1.0
    return 2 ** (20 * x - 10) / 2 if x < .5 else (2 - 2 ** (-20 * x + 10)) / 2
def ocubic(x): return 1 - (1 - x) ** 3
def iocubic(x): return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def oback(x, s=1.6):
    x -= 1
    return x * x * ((s + 1) * x + s) + 1
def e(t, a, b, f=oexpo): return f(lin(t, a, b))
def mix(a, b, k): return a + (b - a) * k
def mixc(c1, c2, k): return tuple(int(mix(c1[i], c2[i], k)) for i in range(3))


# ── Fonts & text ─────────────────────────────────────────────────────────
FONT_FILES = {'syne': 'Syne.ttf', 'sg': 'SpaceGrotesk.ttf'}


@lru_cache(None)
def typeface(fam, weight):
    base = skia.Typeface.MakeFromFile(os.path.join(ROOT, 'fonts', FONT_FILES[fam]))
    coord = skia.FontArguments.VariationPosition.Coordinate(0x77676874, float(weight))
    pos = skia.FontArguments.VariationPosition(skia.FontArguments.VariationPosition.Coordinates([coord]))
    args = skia.FontArguments()
    args.setVariationDesignPosition(pos)
    return base.makeClone(args)


@lru_cache(None)
def font(fam, weight, size):
    f = skia.Font(typeface(fam, weight), size)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    f.setHinting(skia.FontHinting.kNone)
    return f


@lru_cache(None)
def layout(s, fam, weight, size, track):
    f = font(fam, weight, size)
    glyphs = f.textToGlyphs(s)
    widths = f.getWidths(glyphs)
    xs, x = [], 0.0
    for wd in widths:
        xs.append(x)
        x += wd + track * size
    total = x - track * size if widths else 0.0
    return xs, total


def text_w(s, size, fam='syne', w=600, track=-0.05):
    return layout(s, fam, w, size, track)[1]


def text(c, s, x, y, size, rgb, a=1.0, fam='syne', w=600, track=-0.05, align=0.0):
    if not s or a <= 0.003:
        return text_w(s, size, fam, w, track) if s else 0
    xs, tot = layout(s, fam, w, size, track)
    x0 = x - tot * align
    blob = skia.TextBlob.MakeFromPosTextH(s, [x0 + v for v in xs], y, font(fam, w, size))
    c.drawTextBlob(blob, 0, 0, paint(rgb, a))
    return tot


def masked_text(c, s, x, y, size, rgb, p, a=1.0, exitp=0.0, **kw):
    """Line slides up into a mask (p 0→1), then up and out (exitp 0→1)."""
    if p <= 0 or exitp >= 1:
        return
    align = kw.get('align', 0.0)
    tot = text_w(s, size, kw.get('fam', 'syne'), kw.get('w', 600), kw.get('track', -0.05))
    x0 = x - tot * align
    c.save()
    c.clipRect(skia.Rect.MakeLTRB(x0 - size * .3, y - size * 1.02, x0 + tot + size * .4, y + size * .3))
    dy = (1 - p) * size * 1.25 - exitp * size * 1.25
    text(c, s, x, y + dy, size, rgb, a, **kw)
    c.restore()


def words_reveal(c, words, x, y, size, t, t0, stagger, dur, colors, w=600, track=-0.055, exit_t=None, exit_dur=.45):
    """Word-by-word masked reveal. words: list of (word, rgb)."""
    cx = x
    space = text_w('a a', size, 'syne', w, track) - text_w('aa', size, 'syne', w, track)
    for i, (wd, rgb) in enumerate(words):
        p = e(t, t0 + i * stagger, t0 + i * stagger + dur)
        ex = e(t, exit_t + i * .03, exit_t + i * .03 + exit_dur, iexpo) if exit_t else 0
        masked_text(c, wd, cx, y, size, rgb, p, exitp=ex, w=w, track=track)
        cx += text_w(wd, size, 'syne', w, track) + space
    return cx - space - x


def word_xs(words, x, size, w=600, track=-0.055):
    """x position of each word exactly as words_reveal lays them out."""
    space = text_w('a a', size, 'syne', w, track) - text_w('aa', size, 'syne', w, track)
    out, cx = [], x
    for wd in words:
        out.append(cx)
        cx += text_w(wd, size, 'syne', w, track) + space
    return out


def typewriter(c, s, x, y, size, rgb, t, t0, t1, a=1.0, **kw):
    n = int(len(s) * lin(t, t0, t1))
    if n > 0:
        text(c, s[:n], x, y, size, rgb, a, **kw)


# ── Images ───────────────────────────────────────────────────────────────
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear)


@lru_cache(None)
def img(rel, maxdim=1400):
    """Decode once and pre-scale (high quality) so per-frame draws are cheap bilinear blits."""
    im = skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(os.path.join(ASSETS, rel)))
    s = min(1.0, maxdim / max(im.width(), im.height()))
    if s >= 1.0:
        return im.makeRasterImage()
    w, h = max(1, int(im.width() * s)), max(1, int(im.height() * s))
    surf = skia.Surface(w, h)
    surf.getCanvas().drawImageRect(im.withDefaultMipmaps(), skia.Rect.MakeWH(w, h), skia.SamplingOptions(skia.CubicResampler.Mitchell()), None)
    return surf.makeImageSnapshot()


@lru_cache(None)
def svg_img(rel, width):
    data = skia.Data.MakeFromFileName(os.path.join(ASSETS, rel))
    dom = skia.SVGDOM.MakeFromStream(skia.MemoryStream(data))
    sz = dom.containerSize()
    s = width / sz.width()
    surf = skia.Surface(int(width), int(round(sz.height() * s)))
    cv = surf.getCanvas()
    cv.clear(skia.ColorTRANSPARENT)
    cv.scale(s, s)
    dom.render(cv)
    return surf.makeImageSnapshot()


def draw_cover(c, im, rect, zoom=1.0, fx=.5, fy=.5, a=1.0, radius=0.0):
    rw, rh = rect.width(), rect.height()
    iw, ih = im.width(), im.height()
    s = max(rw / iw, rh / ih) * zoom
    dw, dh = iw * s, ih * s
    dst = skia.Rect.MakeXYWH(rect.left() + (rw - dw) * fx, rect.top() + (rh - dh) * fy, dw, dh)
    c.save()
    if radius:
        c.clipRRect(skia.RRect.MakeRectXY(rect, radius, radius), skia.ClipOp.kIntersect, True)
    else:
        c.clipRect(rect, skia.ClipOp.kIntersect, True)
    p = skia.Paint(AntiAlias=True)
    p.setAlphaf(a)
    c.drawImageRect(im, dst, SAMP, p)
    c.restore()


@lru_cache(None)
def shadow_sprite(w, h, radius, blur):
    pad = int(blur * 3)
    surf = skia.Surface(w + pad * 2, h + pad * 2)
    cv = surf.getCanvas()
    cv.clear(skia.ColorTRANSPARENT)
    cv.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(pad, pad, w, h), radius, radius), paint((0, 0, 0), 1, blur=blur))
    return surf.makeImageSnapshot(), pad


def shadow(c, rect, radius, a=.45, blur=38, dy=26):
    im, pad = shadow_sprite(int(rect.width()), int(rect.height()), int(radius), int(blur))
    p = skia.Paint()
    p.setAlphaf(clamp(a))
    c.drawImage(im, rect.left() - pad, rect.top() - pad + dy, SAMP, p)


# ── Shapes ───────────────────────────────────────────────────────────────
def arrow(c, x, y, size, rgb, a=1.0, angle=-45, width=None):
    """Arrow pointing in `angle` degrees (0 = right, -45 = ↗, 90 = ↓)."""
    width = width or max(2, size * .11)
    c.save()
    c.translate(x, y)
    c.rotate(angle)
    p = paint(rgb, a, stroke=width)
    c.drawLine(-size * .5, 0, size * .5, 0, p)
    c.drawLine(size * .5, 0, size * .12, -size * .38, p)
    c.drawLine(size * .5, 0, size * .12, size * .38, p)
    c.restore()


def sparkle(c, x, y, r, rgb, a=1.0, rot=0):
    pth = skia.Path()
    for i in range(8):
        ang = math.radians(rot + i * 45 - 90)
        rr = r if i % 2 == 0 else r * .28
        px, py = x + rr * math.cos(ang), y + rr * math.sin(ang)
        pth.moveTo(px, py) if i == 0 else pth.lineTo(px, py)
    pth.close()
    c.drawPath(pth, paint(rgb, a))


@lru_cache(None)
def glow_sprite(rgb):
    n = 256
    surf = skia.Surface(n, n)
    cv = surf.getCanvas()
    cv.clear(skia.ColorTRANSPARENT)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial((n / 2, n / 2), n / 2, [col(rgb, 1), col(rgb, .45), col(rgb, 0)], [0, .45, 1]))
    cv.drawRect(skia.Rect.MakeWH(n, n), p)
    return surf.makeImageSnapshot()


def radial_glow(c, x, y, r, rgb, a):
    if a <= 0.003:
        return
    p = skia.Paint()
    p.setAlphaf(clamp(a))
    c.drawImageRect(glow_sprite(rgb), skia.Rect.MakeLTRB(x - r, y - r, x + r, y + r), SAMP, p)


@lru_cache(None)
def bg(name):
    surf = skia.Surface(W, H)
    cv = surf.getCanvas()
    if name == 'deep':
        fill(cv, DEEP); radial_glow(cv, 960, 540, 950, BLUE, .55)
    elif name == 'deep_r':
        fill(cv, DEEP); radial_glow(cv, 1150, 430, 1000, BLUE, .4)
    elif name == 'deep_tr':
        fill(cv, DEEP); radial_glow(cv, 1500, 300, 900, BLUE, .4)
    elif name == 'navy':
        vgrad(cv, NAVY, (0, 7, 100)); radial_glow(cv, 1300, 420, 1100, BLUE, .35)
    elif name == 'yellow':
        fill(cv, YEL); radial_glow(cv, 960, 1080, 1100, BLUE, .12)
    elif name == 'end':
        fill(cv, DEEP); radial_glow(cv, 960, 480, 1000, BLUE, .5)
    return surf.makeImageSnapshot()


_SRC = skia.Paint()
_SRC.setBlendMode(skia.BlendMode.kSrc)


def blit(c, name):
    c.drawImage(bg(name), 0, 0, skia.SamplingOptions(), _SRC)


def fill(c, rgb, a=1.0):
    c.drawRect(skia.Rect.MakeWH(W, H), paint(rgb, a))


def vgrad(c, top, bottom):
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeLinear([(0, 0), (0, H)], [col(top), col(bottom)]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)


def meta(c, s, x, y, rgb, a, align=0.0):
    text(c, s, x, y, 17, rgb, a, fam='sg', w=500, track=.14, align=align)


@lru_cache(None)
def grain_frames():
    rng = np.random.default_rng(7)
    out = []
    for _ in range(6):
        g = rng.integers(0, 256, (H // 2, W // 2), dtype=np.uint8)
        arr = np.dstack([g, g, g, np.full_like(g, 255)])
        out.append(skia.Image.fromarray(arr, colorType=skia.ColorType.kRGBA_8888_ColorType))
    return out


def grain(c, t, a):
    im = grain_frames()[int(t * 24) % 6]
    p = skia.Paint()
    p.setAlphaf(a)
    p.setBlendMode(skia.BlendMode.kOverlay)
    c.drawImageRect(im, skia.Rect.MakeWH(W, H), skia.SamplingOptions(), p)


def vignette(c, a):
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeRadial((W / 2, H / 2), W * .72, [col((0, 0, 0), 0), col((0, 0, 0), 0), col((0, 0, 0), a)], [0, .55, 1]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)


def particles(c, t, n, rgb, a, seed=3, speed=18):
    rnd = random.Random(seed)
    for _ in range(n):
        x0, y0 = rnd.uniform(0, W), rnd.uniform(0, H)
        sp, r, ph = rnd.uniform(.5, 1.4), rnd.uniform(1.2, 3.2), rnd.uniform(0, 6.28)
        y = (y0 - t * speed * sp) % (H + 40) - 20
        x = x0 + math.sin(t * .6 + ph) * 18
        tw = .55 + .45 * math.sin(t * 2.2 + ph)
        c.drawCircle(x, y, r, paint(rgb, a * tw))


# ── Scene 1 · Cold open (0–8) ────────────────────────────────────────────
def s1(c, t):
    blit(c, 'deep')
    # Blueprint grid drawing outward from the centre
    gp = paint(WHITE, .07, stroke=1)
    for k in range(-8, 9):
        g = e(t, .2 + abs(k) * .05, 1.8 + abs(k) * .05, ocubic) * (1 - e(t, 6.2, 7.4, iexpo))
        if g > 0:
            x = 960 + k * 120
            c.drawLine(x, 540 - g * 620, x, 540 + g * 620, gp)
        if abs(k) <= 5 and g > 0:
            y = 540 + k * 120
            c.drawLine(960 - g * 1100, y, 960 + g * 1100, y, gp)
    # Construction circles + crosshair
    collapse = 1 - e(t, 5.8, 6.9, iocubic)
    for r0, t0, rot in ((170, 1.0, 1), (310, 1.25, -1), (460, 1.5, 1)):
        sweep = 360 * e(t, t0, t0 + 1.6, iocubic)
        if sweep > 0 and collapse > 0:
            r = r0 * collapse
            c.drawArc(skia.Rect.MakeLTRB(960 - r, 540 - r, 960 + r, 540 + r), -90 + rot * t * 14, sweep, False, paint(WHITE, .16, stroke=1.4))
    ch = e(t, .9, 2.0) * collapse
    c.drawLine(960 - 520 * ch, 540, 960 + 520 * ch, 540, paint(WHITE, .14, stroke=1))
    c.drawLine(960, 540 - 300 * ch, 960, 540 + 300 * ch, paint(WHITE, .14, stroke=1))

    # Headline: the dot becomes the full stop of "idea."
    size = 124
    l1 = 'Every great brand'
    l2a, l2b = 'starts as an ', 'idea'
    w2 = text_w(l2a, size, w=600, track=-.055) + text_w(l2b, size, w=600, track=-.055) + 34
    x2 = 960 - w2 / 2
    p1, p2 = e(t, 2.0, 2.9), e(t, 2.3, 3.2)
    ex1, ex2 = e(t, 4.8, 5.4, iexpo), e(t, 4.95, 5.55, iexpo)
    masked_text(c, l1, 960, 470, size, WHITE, p1, exitp=ex1, align=.5, w=600, track=-.055)
    masked_text(c, l2a, x2, 620, size, WHITE, p2, exitp=ex2, w=600, track=-.055)
    masked_text(c, l2b, x2 + text_w(l2a, size, w=600, track=-.055), 620, size, YEL, p2, exitp=ex2, w=600, track=-.055)

    # The dot
    period = (x2 + w2 - 12, 620 - 14)
    k1, k2 = e(t, 2.95, 3.55, iocubic), e(t, 5.55, 6.35, iocubic)
    if t < 5.55:
        px, py = mix(960, period[0], k1), mix(540, period[1], k1) - math.sin(k1 * math.pi) * 120
    else:
        px, py = mix(period[0], 960, k2), mix(period[1], 540, k2) - math.sin(k2 * math.pi) * 90
    r = 14 * e(t, .5, 1.2, oback)
    if 1.0 < t < 4.6:
        ph = (t - 1.0) % .5
        r *= 1 + .2 * math.exp(-ph * 12)
    r += iexpo(lin(t, 6.9, 8.0)) * 1250
    if r > 0:
        if r < 60:
            c.drawCircle(px, py, r * 3.2, paint(YEL, .18, blur=r * 1.2))
        c.drawCircle(px, py, r, paint(YEL))
    la = e(t, 1.2, 2.0) * (1 - e(t, 6.4, 7.0))
    typewriter(c, 'ROVARD STUDIOS / 001', 140, 990, 17, WHITE, t, 1.2, 2.0, .6 * la, fam='sg', w=500, track=.14)
    typewriter(c, 'CANADA · WORLDWIDE', 1780 - text_w('CANADA · WORLDWIDE', 17, 'sg', 500, .14), 990, 17, WHITE, t, 1.4, 2.2, .6 * la, fam='sg', w=500, track=.14)
    if t < 1.3:
        fill(c, (0, 0, 0), 1 - e(t, 0, 1.3, ocubic))


# ── Scene 2 · Logo reveal (8–14) ─────────────────────────────────────────
LOGO_W = 'Combined Logo - Rovard Studios - White.svg'


def s2(c, t):
    fill(c, YEL)
    rr = e(t, 8.0, 8.75) * 1200
    c.drawCircle(960, 540, rr, paint(DEEP))
    if rr > 30:
        c.save()
        c.clipPath(skia.Path().addCircle(960, 540, rr), skia.ClipOp.kIntersect, True)
        blit(c, 'deep')
        particles(c, t, 26, YEL, .5 * e(t, 9, 10))
        c.restore()
    exit_k = e(t, 12.9, 13.6, iexpo)
    sc = 1 + .035 * lin(t, 8.4, 14) + exit_k * .06
    c.save()
    c.translate(960, 540)
    c.scale(sc, sc)
    c.translate(-960, -540)
    a_all = 1 - exit_k
    lw = 940
    logo = svg_img(LOGO_W, lw * 2)
    lh = lw * logo.height() / logo.width()
    lx, ly = 960 - lw / 2, 470 - lh / 2
    mark_w = lw * 181 / 450
    # Mark rises in
    pm = e(t, 8.35, 9.05)
    if pm > 0:
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(lx, ly + lh * (1 - pm), lx + mark_w, ly + lh), skia.ClipOp.kIntersect, True)
        s_m = 1.18 - .18 * pm
        c.translate(lx + mark_w / 2, ly + lh / 2)
        c.scale(s_m, s_m)
        c.translate(-(lx + mark_w / 2), -(ly + lh / 2))
        p = skia.Paint(AntiAlias=True)
        p.setAlphaf(a_all)
        c.drawImageRect(logo, skia.Rect.MakeXYWH(0, 0, logo.width() * 181 / 450, logo.height()), skia.Rect.MakeXYWH(lx, ly, mark_w, lh), SAMP, p)
        c.restore()
    # Wordmark wipes in
    pw = e(t, 8.8, 9.6)
    if pw > 0:
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(lx + mark_w, ly - 10, lx + mark_w + (lw - mark_w) * pw + 2, ly + lh + 10), skia.ClipOp.kIntersect, True)
        c.translate(-50 * (1 - pw), 0)
        p = skia.Paint(AntiAlias=True)
        p.setAlphaf(a_all)
        src = skia.Rect.MakeXYWH(logo.width() * 181 / 450, 0, logo.width() * 269 / 450, logo.height())
        c.drawImageRect(logo, src, skia.Rect.MakeXYWH(lx + mark_w, ly, lw - mark_w, lh), SAMP, p)
        c.restore()
    # Light sweep across the logo
    sw = lin(t, 9.7, 10.7)
    if 0 < sw < 1:
        c.saveLayer(skia.Rect.MakeXYWH(lx, ly, lw, lh), None)
        c.drawImageRect(logo, skia.Rect.MakeXYWH(lx, ly, lw, lh), SAMP, skia.Paint(AntiAlias=True))
        bx = mix(lx - 400, lx + lw + 400, iocubic(sw))
        p = skia.Paint()
        p.setBlendMode(skia.BlendMode.kSrcATop)
        p.setShader(skia.GradientShader.MakeLinear([(bx - 160, 0), (bx + 160, 120)], [col(YEL, 0), col(YEL, .75), col(YEL, 0)]))
        c.drawRect(skia.Rect.MakeXYWH(lx, ly, lw, lh), p)
        c.restore()
    # Divider + tagline
    dl = e(t, 9.7, 10.5) * 300
    c.drawLine(960 - dl, 735, 960 + dl, 735, paint(WHITE, .28 * a_all, stroke=1.2))
    tp = e(t, 10.0, 10.8)
    text(c, 'BRAND  ·  DIGITAL  ·  CREATIVE STUDIO', 960, 800 + 24 * (1 - tp), 26, WHITE, .9 * tp * a_all, fam='sg', w=500, track=.26, align=.5)
    tq = e(t, 10.45, 11.2)
    ws = text_w('Canada', 22, 'sg', 400, .06)
    yq = 850 + 20 * (1 - tq)
    text(c, 'Canada', 960 - 22, yq, 22, WHITE, .6 * tq * a_all, fam='sg', w=400, track=.06, align=1)
    c.drawCircle(960, yq - 7, 5 * tq, paint(YEL, a_all))
    text(c, 'Worldwide', 960 + 22, yq, 22, WHITE, .6 * tq * a_all, fam='sg', w=400, track=.06)
    c.restore()


# ── Scene 3 · Hero statement (14–22) ─────────────────────────────────────
def torus_setup():
    nr, pr, R, r = 48, 16, 185, 70
    u = np.repeat(np.arange(nr) / nr * 2 * np.pi, pr)
    v = np.tile(np.arange(pr) / pr * 2 * np.pi, nr)
    modR = R + np.sin(u * 3) * 15
    xyz = np.stack([(modR + r * np.cos(v)) * np.cos(u), (modR + r * np.cos(v)) * np.sin(u), r * np.sin(v) + np.cos(u * 2) * 20], 1)
    idx = np.arange(nr * pr)
    i, j = idx // pr, idx % pr
    ring = np.stack([idx, i * pr + (j + 1) % pr], 1)
    tube = np.stack([idx, ((i + 1) % nr) * pr + j], 1)
    return xyz, ring, tube


TORUS = torus_setup()


def torus(c, t, cx, cy, scale, alpha, c1=BLUE, c2=DEEP):
    xyz, ring, tube = TORUS
    ax, ay, az = .4 + t * .14, .6 + t * .32, .1 + t * .07
    x, y, z = (xyz * scale).T
    cyy, syy = math.cos(ay), math.sin(ay)
    cxx, sxx = math.cos(ax), math.sin(ax)
    czz, szz = math.cos(az), math.sin(az)
    x1 = x * cyy + z * syy
    z1 = -x * syy + z * cyy
    y2 = y * cxx - z1 * sxx
    z2 = y * sxx + z1 * cxx
    x3 = x1 * czz - y2 * szz
    y3 = x1 * szz + y2 * czz
    f = 900.0
    per = f / (f + z2)
    px, py = cx + x3 * per, cy + y3 * per
    for edges, rgb, mul in ((ring, c1, 1.0), (tube, c2, .7)):
        za = (z2[edges[:, 0]] + z2[edges[:, 1]]) * .5
        al = np.clip((za + 380 * scale) / (720 * scale), .04, .8)
        buckets = np.minimum((al * 6).astype(int), 5)
        for b in range(6):
            sel = edges[buckets == b]
            if not len(sel):
                continue
            pts = np.empty((len(sel) * 2, 2), dtype=np.float32)
            pts[0::2, 0], pts[0::2, 1] = px[sel[:, 0]], py[sel[:, 0]]
            pts[1::2, 0], pts[1::2, 1] = px[sel[:, 1]], py[sel[:, 1]]
            c.drawPoints(skia.Canvas.kLines_PointMode, [skia.Point(float(a_), float(b_)) for a_, b_ in pts], paint(rgb, (b + .5) / 6 * mul * alpha, stroke=1.1))


def s3(c, t):
    fill(c, PAPER)
    sc = 1 + .035 * lin(t, 14, 22)
    c.save()
    c.translate(960, 540)
    c.scale(sc, sc)
    c.translate(-960, -540)
    torus(c, t - 14, 1400, 520, 1.65, .75 * e(t, 14.1, 15.4, ocubic))
    ka = e(t, 14.3, 14.9)
    typewriter(c, 'CANADA · WORLDWIDE', 140, 150, 18, INK, t, 14.3, 14.9, .8, fam='sg', w=500, track=.12)
    c.drawCircle(140 + text_w('CANADA · WORLDWIDE', 18, 'sg', 500, .12) + 22, 144, 4 * ka, paint(YEL))
    typewriter(c, 'INDEPENDENT DESIGN STUDIO', 140 + text_w('CANADA · WORLDWIDE', 18, 'sg', 500, .12) + 44, 150, 18, INK, t, 14.6, 15.2, .8, fam='sg', w=500, track=.12)
    meta(c, 'ROVARD STUDIOS / 001', 1780, 150, INK, .55 * ka, align=1)
    lines = ['Design', 'that moves', 'businesses forward']
    size = min(176, (1920 - 300) / (text_w(lines[2], 1, w=700, track=-.075) + .3))
    lh = size * .87
    base = 300 + size
    # Yellow marker under "moves"
    mk = e(t, 18.4, 19.1) * (1 - e(t, 21.25, 21.6, iexpo))
    if mk > 0:
        mx0 = 140 + 150 + text_w('that ', size, w=700, track=-.075)
        mw = text_w('moves', size, w=700, track=-.075)
        c.drawRect(skia.Rect.MakeXYWH(mx0 - 6, base + lh - size * .26, (mw + 12) * mk, size * .2), paint(YEL))
    for i, ln in enumerate(lines):
        p = e(t, 14.45 + .2 * i, 15.45 + .2 * i)
        ex = e(t, 21.25 + .06 * i, 21.75 + .06 * i, iexpo)
        x = 140 + (150 if i == 1 else 0)
        rgb = BLUE if i == 2 else INK
        masked_text(c, ln, x, base + i * lh, size, rgb, p, exitp=ex, w=700, track=-.075)
        if i == 2 and p > 0:
            wd = text_w(ln, size, w=700, track=-.075)
            dp = e(t, 15.5, 16.0, oback) * (1 - ex)
            c.drawCircle(x + wd + size * .16, base + i * lh - size * .085, size * .085 * dp, paint(YEL))
    pa = e(t, 16.4, 17.2)
    for k, ln in enumerate(['We build visual identities and digital experiences designed to make',
                            'ambitious businesses clearer, more credible and more memorable.']):
        text(c, ln, 140, 905 + k * 38 + 18 * (1 - pa), 26, INK, .75 * pa * (1 - e(t, 21.2, 21.6)), fam='sg', w=400, track=0)
    rp = e(t, 16.8, 17.8, iocubic) * (1 - e(t, 21.2, 21.6))
    if rp > 0:
        c.drawArc(skia.Rect.MakeLTRB(1700 - 70, 900 - 70, 1700 + 70, 900 + 70), -90, 360 * rp, False, paint(INK, 1, stroke=1.5))
        text(c, 'EXPLORE', 1700, 888, 13, INK, rp, fam='sg', w=500, track=.12, align=.5)
        text(c, 'THE WORK', 1700, 908, 13, INK, rp, fam='sg', w=500, track=.12, align=.5)
        arrow(c, 1700, 938 + 4 * math.sin(t * 5), 18, INK, rp, angle=90, width=1.6)
    c.restore()


# ── Scene 4 · Positioning (22–30) ────────────────────────────────────────
def s4(c, t):
    blit(c, 'deep_r')
    particles(c, t, 18, WHITE, .18, seed=11, speed=10)
    meta(c, '01 / POSITIONING', 140, 140, WHITE, .5 * e(t, 22.3, 22.9))
    text(c, 'THE STUDIO', 180, 330 + 14 * (1 - e(t, 22.4, 23.0)), 18, YEL, e(t, 22.4, 23.0), fam='sg', w=600, track=.16)
    size = 112
    l1 = [("We", WHITE), ("don't", WHITE), ("design", WHITE), ("for", WHITE), ("decoration.", WHITE)]
    l2 = [("We", YEL), ("design", YEL), ("for", YEL), ("perception.", YEL)]
    words_reveal(c, l1, 180, 480, size, t, 22.5, .09, .75, None, w=600, track=-.065)
    # dim "decoration." after the strike
    x_dec = word_xs([w_ for w_, _ in l1], 180, size, track=-.065)[4]
    x_per = word_xs([w_ for w_, _ in l2], 180, size, track=-.065)[3]
    dim = e(t, 25.35, 25.9)
    if dim > 0:
        wd = text_w('decoration.', size, w=600, track=-.065)
        text(c, 'decoration.', x_dec, 480, size, DEEP, .58 * dim, w=600, track=-.065)
    st = e(t, 25.0, 25.5, iocubic)
    if st > 0:
        wd = text_w('decoration.', size, w=600, track=-.065)
        c.drawLine(x_dec - 6, 480 - size * .3, x_dec - 6 + (wd + 12) * st, 480 - size * .3, paint(YEL, 1, stroke=8))
    words_reveal(c, l2, 180, 615, size, t, 23.45, .1, .75, None, w=600, track=-.065)
    # Focus brackets lock onto "perception."
    fb = e(t, 25.9, 26.7)
    if fb > 0:
        x0 = x_per - 18
        wd = text_w('perception.', size, w=600, track=-.065) + 36
        y0, hh = 615 - size * .92, size * 1.22
        grow = (1 - fb) * 120
        L = 34
        p = paint(WHITE, fb, stroke=3)
        for sx, sy in ((0, 0), (1, 0), (0, 1), (1, 1)):
            bx = x0 + sx * wd + (grow if sx else -grow)
            by = y0 + sy * hh + (grow * .5 if sy else -grow * .5)
            dx, dy = (-L if sx else L), (-L if sy else L)
            c.drawLine(bx, by, bx + dx, by, p)
            c.drawLine(bx, by, bx, by + dy, p)
    pa = e(t, 26.8, 27.6)
    for k, ln in enumerate(['From identity systems to digital interfaces, every decision is made to help',
                            'a business communicate with confidence and move with intention.']):
        text(c, ln, 180, 790 + k * 42 + 18 * (1 - pa), 28, WHITE, .68 * pa, fam='sg', w=400, track=0)


# ── Scene 5 · Services (30–40) ───────────────────────────────────────────
SERVICES = [
    ('Brand Identity', 'Distinctive systems that clarify what you stand for.'),
    ('Social Media Design', 'Campaigns built to keep your brand recognizable.'),
    ('UI Design', 'Clear interfaces that turn complexity into confidence.'),
    ('Packaging', 'Physical experiences that feel unmistakably yours.'),
    ('Motion Design', 'Movement systems that give identity a pulse.'),
    ('Web Design', 'Conversion-focused sites with purposeful interaction.'),
]


def s5(c, t):
    fill(c, SURF)
    meta(c, '03 / SERVICES', 140, 120, INK, .55 * e(t, 30.2, 30.8))
    masked_text(c, 'One studio.', 140, 245, 92, INK, e(t, 30.25, 31.05), w=600, track=-.06)
    masked_text(c, 'Many ways to move.', 140, 340, 92, BLUE, e(t, 30.45, 31.25), w=600, track=-.06)
    pa = e(t, 31.0, 31.7)
    text(c, 'Strategy, visual design and digital thinking', 1780, 270 + 14 * (1 - pa), 24, MUTED, pa, fam='sg', w=400, track=0, align=1)
    text(c, 'brought together in one connected system.', 1780, 306 + 14 * (1 - pa), 24, MUTED, pa, fam='sg', w=400, track=0, align=1)
    top, rh = 410, 100
    act_t = 32.6
    for i, (name, desc) in enumerate(SERVICES):
        y = top + i * rh
        lp = e(t, 30.8 + i * .12, 31.5 + i * .12, ocubic)
        k0 = act_t + i * 1.0
        on = e(t, k0, k0 + .38)
        off = e(t, k0 + 1.0, k0 + 1.35, iocubic) if i < 5 else e(t, 38.9, 39.3, iocubic)
        if on > 0 and off < 1:
            x_from = 140 + 1640 * off
            c.drawRect(skia.Rect.MakeLTRB(x_from, y, 140 + 1640 * on, y + rh), paint(YEL))
        hi = on * (1 - off)
        c.drawLine(140, y, 140 + 1640 * lp, y, paint(INK, .16, stroke=1))
        if i == 5:
            c.drawLine(140, y + rh, 140 + 1640 * lp, y + rh, paint(INK, .16, stroke=1))
        np_ = e(t, 31.0 + i * .12, 31.75 + i * .12)
        text(c, f'0{i + 1}', 150 + 20 * hi, y + 62, 18, INK if hi > .5 else MUTED, np_, fam='sg', w=500, track=.08)
        masked_text(c, name, 270 + 22 * hi, y + 70, 54, INK, np_, w=600, track=-.055)
        da = e(t, k0 + .15, k0 + .5) * (1 - off)
        text(c, desc, 1660, y + 62, 22, INK, da * .85, fam='sg', w=400, track=0, align=1)
        arrow(c, 1745 + 6 * hi, y + 52 - 6 * hi, 26, INK, np_, angle=-45, width=2.2)


def marquee_overlay(c, t):
    """Diagonal yellow capability ribbon that sweeps across 38.6–40.2."""
    k = lin(t, 38.6, 40.25)
    if k <= 0 or k >= 1:
        return
    c.save()
    c.translate(960, 540)
    c.rotate(-7)
    band_h = 130
    grow = e(t, 38.6, 39.0)
    shrink = e(t, 39.9, 40.25, iexpo)
    x0 = -1400 + 2800 * shrink
    x1 = -1400 + 2800 * grow
    c.clipRect(skia.Rect.MakeLTRB(x0, -band_h / 2, x1, band_h / 2))
    c.drawRect(skia.Rect.MakeLTRB(-1400, -band_h / 2, 1400, band_h / 2), paint(YEL))
    items = ['BRAND IDENTITY', 'SOCIAL SYSTEMS', 'UI DESIGN', 'PACKAGING', 'MOTION', 'WEB DESIGN'] * 3
    x = -1400 - (t - 38.6) * 520
    for it in items:
        wd = text(c, it, x, 18, 50, DEEP, 1, w=700, track=.02)
        sparkle(c, x + wd + 40, 0, 15, DEEP, 1, rot=t * 90)
        x += wd + 80
    c.restore()


# ── Scene 6 · Selected work (40–62) ──────────────────────────────────────
BI, SM, PK = 'Brand%20Identitities', 'Social%20Media', 'Packaging%20Design'
PROJECTS = [
    ('Green Blueprint', 'Brand Identity', 'Identity / Art Direction / Packaging', 'Brand Identitities/1_Green Blueprint/Cover 7.jpg', 'Brand Identitities/1_Green Blueprint/Cover 3.jpg', (92, 173, 141)),
    ('Design Eigen', 'Brand Identity', 'Identity / Positioning / Direction', 'Brand Identitities/2_Design Eigen/imgi_157_c7b3d4219180769.67b0aff187b1c.jpg', 'Brand Identitities/2_Design Eigen/Tshirt Mockup.jpg', (214, 36, 110)),
    ('Bitefort', 'Brand Identity', 'Art Direction / Identity / Messaging', 'Brand Identitities/3_Bitefort/1.jpg', 'Brand Identitities/3_Bitefort/3.jpg', (107, 47, 179)),
    ('LinkRithm', 'Brand Identity', 'Identity / Packaging / Positioning', 'Brand Identitities/4_Linkrithm/linkrithm-gallery-13.jpg', 'Brand Identitities/4_Linkrithm/linkrithm-gallery-06.jpg', (139, 92, 246)),
    ('ShorteeMe', 'Social Media Design', 'Campaign System / Content Direction', 'Social Media/1_ShorteeMe/Make something amazing 1.jpg', 'Social Media/1_ShorteeMe/Become an investor today 1.jpg', (255, 151, 0)),
    ('PDOCA', 'Social Media Design', 'Campaign Art / Social Stories', 'Social Media/3_PDOCA/Layer 5.jpg', 'Social Media/3_PDOCA/October.jpg', (61, 92, 255)),
    ('GCE Study App', 'Social Media Design', 'Campaign Art / Product Promotion', 'Social Media/6_GCE Study App/3.jpg', 'Social Media/6_GCE Study App/2.jpg', (0, 200, 140)),
    ('Book Cover Design', 'Packaging', 'Book Design / Art Direction / Print', 'Packaging Design/1_Book Cover Design/Book Cover mockup 3.1 1.jpg', 'Packaging Design/1_Book Cover Design/Book Cover mockup 5.jpg', (201, 162, 75)),
]
WORK_T0, WORK_STEP = 42.0, 2.0


def card_size(im, big=True):
    a = im.width() / im.height()
    if big:
        return (1000, 640) if a > 1.15 else (720, 720) if a > .9 else (600, 760)
    return (420, 290) if a > 1.15 else (320, 320) if a > .9 else (280, 360)


def draw_project_cards(c, t, j):
    name, cat, serv, m, s_, acc = PROJECTS[j]
    start = WORK_T0 + j * WORK_STEP - (.3 if j else 0)
    end = WORK_T0 + (j + 1) * WORK_STEP - .3
    if t < start or t > end + .7:
        return
    ein = e(t, start, start + .65)
    eout = e(t, end, end + .6, iocubic) if j < len(PROJECTS) - 1 else e(t, 57.7, 58.3, iocubic)
    a = ein * (1 - eout)
    if a <= 0.002:
        return
    im, im2 = img(m, 1250), img(s_, 640)
    cw, ch = card_size(im)
    cx = 1250 + 700 * (1 - ein) - 620 * eout
    cy = 540 + 40 * (1 - ein)
    rot = 7 * (1 - ein) - 5 * eout
    sc = (.88 + .12 * ein) * (1 - .12 * eout)
    radial_glow(c, cx, cy, 760, acc, .32 * a)
    # secondary card (deeper parallax)
    sw, sh = card_size(im2, big=False)
    e2 = e(t, start + .12, start + .82)
    sx = cx - cw / 2 - 40 + 900 * (1 - e2) - 820 * eout
    sy = cy + ch / 2 - sh + 80
    c.save()
    c.translate(cx, cy)
    c.rotate(rot)
    c.scale(sc, sc)
    rect = skia.Rect.MakeXYWH(-cw / 2, -ch / 2, cw, ch)
    shadow(c, rect, 26, .5 * a, 42, 30)
    zoom = 1.14 - .14 * lin(t, start, start + 2.6)
    draw_cover(c, im, rect, zoom=zoom, a=a, radius=26)
    c.drawRRect(skia.RRect.MakeRectXY(rect, 26, 26), paint(WHITE, .12 * a, stroke=1.2))
    c.restore()
    a2 = e2 * (1 - eout)
    if a2 > 0.002:
        c.save()
        c.translate(sx + sw / 2, sy + sh / 2)
        c.rotate(-4 * (1 - e2) + 3 * eout)
        r2 = skia.Rect.MakeXYWH(-sw / 2, -sh / 2, sw, sh)
        shadow(c, r2, 18, .55 * a2, 30, 22)
        draw_cover(c, im2, r2, zoom=1.08 - .08 * lin(t, start, start + 2.6), a=a2, radius=18)
        c.drawRRect(skia.RRect.MakeRectXY(r2, 18, 18), paint(WHITE, .18 * a2, stroke=1.2))
        c.restore()


def draw_project_text(c, t, j):
    name, cat, serv, *_ = PROJECTS[j]
    start = WORK_T0 + j * WORK_STEP - (.3 if j else 0)
    end = WORK_T0 + (j + 1) * WORK_STEP - .3
    p = e(t, start + .12, start + .8)
    ex = e(t, end, end + .38, iexpo) if j < len(PROJECTS) - 1 else e(t, 57.6, 58.0, iexpo)
    if p <= 0 or ex >= 1:
        return
    masked_text(c, f'{j + 1:02d}', 140, 330, 30, YEL, p, exitp=ex, fam='sg', w=500, track=.04)
    masked_text(c, f'/ {len(PROJECTS):02d}', 140 + text_w(f'{j + 1:02d}', 30, 'sg', 500, .04) + 10, 330, 30, WHITE, p, a=.4, exitp=ex, fam='sg', w=500, track=.04)
    # category pill
    pp = e(t, start + .2, start + .7, oback) * (1 - ex)
    if pp > 0:
        label = cat.upper()
        tw = text_w(label, 16, 'sg', 600, .14)
        c.save()
        c.translate(140, 375)
        c.scale(pp, pp)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(0, 0, tw + 36, 40), 20, 20), paint(YEL))
        text(c, label, 18, 26, 16, DEEP, 1, fam='sg', w=600, track=.14)
        c.restore()
    size = min(104, 700 / (text_w(name, 1, w=600, track=-.06) + .01))
    masked_text(c, name, 136, 540, size, WHITE, p, exitp=ex, w=600, track=-.06)
    sp = e(t, start + .3, start + .9) * (1 - ex)
    text(c, serv, 140, 600 + 12 * (1 - sp), 24, WHITE, .62 * sp, fam='sg', w=400, track=0)
    vp = e(t, start + .45, start + 1.0) * (1 - ex)
    if vp > 0:
        wd = text(c, 'VIEW CASE STUDY', 140, 690, 16, YEL, vp, fam='sg', w=600, track=.14)
        arrow(c, 140 + wd + 22, 684, 16, YEL, vp, angle=-45, width=2)


MOSAIC = [
    'Brand Identitities/1_Green Blueprint/Cover 3.jpg', 'Social Media/4_Dress Doctor/BOOK PICKUP_DD.jpg', 'Brand Identitities/3_Bitefort/3.jpg',
    'Social Media/Kymela/cover.jpg', 'Brand Identitities/4_Linkrithm/linkrithm-cover.jpg', 'Social Media/1_ShorteeMe/Make something amazing 1.jpg',
    'Brand Identitities/2_Design Eigen/imgi_157_c7b3d4219180769.67b0aff187b1c.jpg', 'Packaging Design/1_Book Cover Design/Book Cover mockup 3.1 1.jpg',
    'Social Media/3_PDOCA/Layer 5.jpg', 'Brand Identitities/1_Green Blueprint/Cover 7.jpg', 'Social Media/6_GCE Study App/3.jpg',
    'Brand Identitities/2_Design Eigen/Tshirt Mockup.jpg', 'Brand Identitities/3_Bitefort/1.jpg', 'Social Media/1_ShorteeMe/Become an investor today 1.jpg',
    'Brand Identitities/4_Linkrithm/linkrithm-gallery-13.jpg', 'Social Media/3_PDOCA/October.jpg', 'Brand Identitities/4_Linkrithm/linkrithm-gallery-06.jpg',
    'Social Media/6_GCE Study App/2.jpg', 'Packaging Design/1_Book Cover Design/Book Cover mockup 5.jpg', 'Social Media/4_Dress Doctor/Wash in Bulk.jpg',
    'Brand Identitities/1_Green Blueprint/Cover 5.jpg', 'Social Media/Kymela/img1.jpg', 'Brand Identitities/2_Design Eigen/ID Card.jpg',
    'Brand Identitities/3_Bitefort/6.jpg', 'Social Media/1_ShorteeMe/Get your support 1.jpg', 'Brand Identitities/4_Linkrithm/linkrithm-gallery-02.jpg',
    'Social Media/3_PDOCA/September.jpg', 'Brand Identitities/1_Green Blueprint/Cover 8.jpg', 'Social Media/6_GCE Study App/1.jpg',
    'Brand Identitities/3_Bitefort/7.jpg',
]


def mosaic(c, t):
    k = lin(t, 57.9, 62.0)
    if k <= 0:
        return
    zoom_in = e(t, 57.9, 59.5, ioexpo)
    zoom_out = e(t, 61.15, 62.0, iexpo)
    cam = mix(2.8, 1.0, zoom_in) * (1 + 2.2 * zoom_out)
    cols, rows, tw, th, gap = 6, 5, 400, 290, 26
    c.save()
    c.translate(960, 540)
    c.scale(cam, cam)
    c.rotate(-9)
    for ci in range(cols):
        drift = (t - 57.9) * (38 if ci % 2 else -38)
        for ri in range(rows):
            n = ci * rows + ri
            x = (ci - (cols - 1) / 2) * (tw + gap) - tw / 2
            y = (ri - (rows - 1) / 2) * (th + gap) - th / 2 + drift
            ta = e(t, 57.9 + .03 * ((ci * 7 + ri * 3) % 11), 58.6 + .03 * ((ci * 7 + ri * 3) % 11))
            if ta <= 0:
                continue
            r = skia.Rect.MakeXYWH(x, y, tw, th)
            draw_cover(c, img(MOSAIC[n % len(MOSAIC)], 900), r, zoom=1.05, a=ta, radius=16)
    c.restore()
    scrim = e(t, 59.7, 60.3) * (1 - zoom_out)
    fill(c, NAVY, .62 * scrim)
    size = 104
    masked_text(c, 'Good design gets attention.', 960, 520, size, WHITE, e(t, 59.85, 60.6), exitp=e(t, 61.0, 61.35, iexpo), align=.5, w=600, track=-.06)
    masked_text(c, 'Great design earns trust.', 960, 650, size, YEL, e(t, 60.1, 60.85), exitp=e(t, 61.05, 61.4, iexpo), align=.5, w=600, track=-.06)
    fill(c, PAPER, e(t, 61.55, 62.0, iexpo))


def s6(c, t):
    blit(c, 'navy')
    particles(c, t, 22, WHITE, .14, seed=21, speed=12)
    meta(c, '02 / SELECTED WORK', 140, 140, WHITE, .5 * e(t, 40.4, 41.0) * (1 - e(t, 57.6, 58.0)))
    masked_text(c, 'Built to be', 960, 500, 150, WHITE, e(t, 40.2, 41.0), exitp=e(t, 41.55, 42.0, iexpo), align=.5, w=600, track=-.07)
    masked_text(c, 'remembered.', 960, 655, 150, YEL, e(t, 40.4, 41.2), exitp=e(t, 41.6, 42.05, iexpo), align=.5, w=600, track=-.07)
    if 41.6 < t < 58.4:
        for j in range(len(PROJECTS)):
            draw_project_cards(c, t, j)
        for j in range(len(PROJECTS)):
            draw_project_text(c, t, j)
        pb = e(t, 41.8, 42.4) * (1 - e(t, 57.6, 58.0))
        if pb > 0:
            c.drawRect(skia.Rect.MakeXYWH(140, 990, 1640, 3), paint(WHITE, .14 * pb))
            c.drawRect(skia.Rect.MakeXYWH(140, 990, 1640 * lin(t, 42, 58), 3), paint(YEL, pb))
            for j in range(len(PROJECTS) + 1):
                c.drawRect(skia.Rect.MakeXYWH(140 + 1640 * j / len(PROJECTS) - 1, 984, 2, 15), paint(WHITE, .25 * pb))
    mosaic(c, t)


# ── Scene 7 · Principles (62–72) ─────────────────────────────────────────
PRINCIPLES = [
    ('Clarity', 'Make the important thing unmistakable.'),
    ('Character', 'Create a visual signature people can recognize.'),
    ('Craft', 'Obsess over the details that change perception.'),
    ('Consistency', 'Build systems, not disconnected assets.'),
]


def superellipse(cx, cy, r, n, rot):
    pth = skia.Path()
    for i in range(181):
        th = i / 180 * 2 * math.pi
        ct, st = math.cos(th), math.sin(th)
        x = r * math.copysign(abs(ct) ** (2 / n), ct)
        y = r * math.copysign(abs(st) ** (2 / n), st)
        a = math.radians(rot)
        px, py = cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)
        pth.moveTo(px, py) if i == 0 else pth.lineTo(px, py)
    pth.close()
    return pth


def principle_visual(c, i, v, a):
    cx, cy = 1400, 540
    if i == 0:  # Clarity: a blurred form snaps into focus
        f = e(v, .2, 1.5, iocubic)
        for r0, w0 in ((250, 1), (330, 1), (410, 1)):
            c.drawCircle(cx, cy, r0, paint(INK, .1 * a, stroke=w0))
        c.drawCircle(cx, cy, 170, paint(BLUE, a, blur=1 + 46 * (1 - f)))
        c.drawCircle(cx, cy, 26, paint(YEL, a, blur=.5 + 14 * (1 - f)))
        g = (1 - f) * 120 + 210
        p = paint(INK, .6 * a * f, stroke=2.5)
        for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
            bx, by = cx + sx * g, cy + sy * g
            c.drawLine(bx, by, bx - sx * 40, by, p)
            c.drawLine(bx, by, bx, by - sy * 40, p)
    elif i == 1:  # Character: a form morphs into a signature shape
        n = 2 + 3.2 * (.5 + .5 * math.sin(v * 2.6 - 1.4))
        s = e(v, 0, .7, oback)
        c.drawPath(superellipse(cx, cy, 230 * s, n, v * 38), paint(YEL, a))
        c.drawPath(superellipse(cx, cy, 120 * s, 8 - n * .9, -v * 55), paint(DEEP, a))
        c.drawCircle(cx + 290 * math.cos(v * 2.2), cy + 290 * math.sin(v * 2.2), 14 * s, paint(BLUE, a))
    elif i == 2:  # Craft: grid + pen-tool bezier
        gp = paint(INK, .07 * a, stroke=1)
        for k in range(-5, 6):
            c.drawLine(cx + k * 60, cy - 330, cx + k * 60, cy + 330, gp)
            c.drawLine(cx - 330, cy + k * 60, cx + 330, cy + k * 60, gp)
        for k in range(0, 41):
            hh = 16 if k % 5 == 0 else 8
            c.drawLine(cx - 300 + k * 15, cy + 360, cx - 300 + k * 15, cy + 360 - hh, paint(INK, .35 * a, stroke=1))
        P0, P1, P2, P3 = (cx - 290, cy + 170), (cx - 160, cy - 330), (cx + 150, cy + 350), (cx + 290, cy - 170)
        pr = e(v, .15, 1.6, iocubic)
        pth = skia.Path()
        for k in range(0, int(120 * pr) + 1):
            u = k / 120
            x = (1 - u) ** 3 * P0[0] + 3 * (1 - u) ** 2 * u * P1[0] + 3 * (1 - u) * u * u * P2[0] + u ** 3 * P3[0]
            y = (1 - u) ** 3 * P0[1] + 3 * (1 - u) ** 2 * u * P1[1] + 3 * (1 - u) * u * u * P2[1] + u ** 3 * P3[1]
            pth.moveTo(x, y) if k == 0 else pth.lineTo(x, y)
        c.drawPath(pth, paint(BLUE, a, stroke=7))
        ha = e(v, .1, .5) * a
        for (ax_, ay_), (hx, hy) in ((P0, P1), (P3, P2)):
            c.drawLine(ax_, ay_, hx, hy, paint(INK, .45 * ha, stroke=1.5))
            c.drawCircle(hx, hy, 8, paint(INK, ha))
            c.drawRect(skia.Rect.MakeXYWH(ax_ - 10, ay_ - 10, 20, 20), paint(WHITE, ha))
            c.drawRect(skia.Rect.MakeXYWH(ax_ - 10, ay_ - 10, 20, 20), paint(BLUE, ha, stroke=2.5))
    else:  # Consistency: scattered parts snap into one system
        rnd = random.Random(5)
        for gx in range(5):
            for gy in range(5):
                tx, ty = cx + (gx - 2) * 130, cy + (gy - 2) * 130
                sx, sy = rnd.uniform(900, 1900), rnd.uniform(60, 1020)
                rot = rnd.uniform(-180, 180)
                k = e(v, .05 + (gx + gy) * .05, .9 + (gx + gy) * .05, oexpo)
                x, y = mix(sx, tx, k), mix(sy, ty, k)
                c.save()
                c.translate(x, y)
                c.rotate(rot * (1 - k))
                if (gx + gy) % 2 == 0:
                    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-46, -46, 92, 92), 16, 16), paint(BLUE, a))
                else:
                    c.drawCircle(0, 0, 40, paint(YEL, a))
                c.restore()


def s7(c, t):
    fill(c, PAPER)
    meta(c, 'ROVARD / PRINCIPLES', 140, 140, INK, .55 * e(t, 62.1, 62.6))
    i = min(3, int((t - 62) / 2.5))
    v = t - (62 + 2.5 * i)
    meta(c, f'0{i + 1} / 04', 1780, 140, INK, .55 * e(t, 62.1, 62.6), align=1)
    for j, (word, desc) in enumerate(PRINCIPLES):
        vj = t - (62 + 2.5 * j)
        if not (-0.1 < vj < 2.7):
            continue
        p = e(vj, .05, .7)
        ex = e(vj, 2.15, 2.5, iexpo) if j < 3 else e(t, 71.2, 71.55, iexpo)
        masked_text(c, f'0{j + 1}', 144, 420, 30, BLUE, p, exitp=ex, fam='sg', w=600, track=.04)
        size = min(200, 820 / text_w(word, 1, w=700, track=-.07))
        masked_text(c, word, 134, 620, size, INK, p, exitp=ex, w=700, track=-.07)
        da = e(vj, .4, .95) * (1 - ex)
        text(c, desc, 144, 700 + 14 * (1 - da), 30, MUTED, da, fam='sg', w=400, track=0)
        va = e(vj, 0, .45) * (1 - e(vj, 2.15, 2.5) if j < 3 else 1 - e(t, 71.1, 71.5))
        if va > 0:
            principle_visual(c, j, vj, va)
    for j in range(4):
        on = 1.0 if j <= i else .25
        c.drawRect(skia.Rect.MakeXYWH(140 + j * 46, 975, 36, 4), paint(BLUE if j <= i else INK, on * e(t, 62.2, 62.8)))


# ── Scene 8 · Process (72–82) ────────────────────────────────────────────
STEPS = [
    ('DISCOVER', 'Start with the real problem.', 'We learn the business, audience, context and objective first.'),
    ('DEFINE', 'Turn context into direction.', 'Positioning and creative direction become a clear north star.'),
    ('DESIGN', 'Make the idea visible.', 'We explore, develop and execute wherever the work needs to live.'),
    ('REFINE', 'Make good work better.', "We test, remove what isn't working and sharpen what is."),
    ('DELIVER', 'Leave you with a system.', 'Organized, production-ready files and the guidance to use them.'),
]
STEP_T0, STEP_DT = 73.8, 1.6
NODE_X = [220 + k * 370 for k in range(5)]
NODE_Y = 610


def s8(c, t):
    blit(c, 'deep_tr')
    meta(c, '06 / PROCESS', 140, 120, WHITE, .5 * e(t, 72.2, 72.8))
    masked_text(c, 'A clear process.', 140, 240, 88, WHITE, e(t, 72.3, 73.1), w=600, track=-.06)
    masked_text(c, 'Better creative work.', 140, 330, 88, YEL, e(t, 72.5, 73.3), w=600, track=-.06)
    lp = e(t, 72.8, 73.8, iocubic)
    c.drawLine(NODE_X[0], NODE_Y, NODE_X[0] + (NODE_X[-1] - NODE_X[0]) * lp, NODE_Y, paint(WHITE, .22, stroke=2))
    k = int(clamp((t - STEP_T0) // STEP_DT, -1, 4)) if t >= STEP_T0 else -1
    if k >= 0:
        prev_x = NODE_X[k - 1] if k > 0 else NODE_X[0]
        fx = mix(prev_x, NODE_X[k], e(t, STEP_T0 + k * STEP_DT, STEP_T0 + k * STEP_DT + .5))
        c.drawLine(NODE_X[0], NODE_Y, fx, NODE_Y, paint(YEL, 1, stroke=3))
    for n, x in enumerate(NODE_X):
        ap = e(t, 72.9 + n * .18, 73.4 + n * .18, oback)
        if ap <= 0:
            continue
        ts = STEP_T0 + n * STEP_DT
        active = k == n
        done = k > n
        c.drawCircle(x, NODE_Y, 11 * ap, paint(DEEP))
        c.drawCircle(x, NODE_Y, 11 * ap, paint(WHITE, .45, stroke=2))
        if done or active:
            pop = e(t, ts + .35, ts + .7, oback)
            c.drawCircle(x, NODE_Y, (16 if active else 9) * pop, paint(YEL))
        if active:
            rp = lin(t, ts + .4, ts + 1.3)
            if 0 < rp < 1:
                c.drawCircle(x, NODE_Y, 16 + 50 * ocubic(rp), paint(YEL, .6 * (1 - rp), stroke=2))
        hl = e(t, ts + .3, ts + .7) if (active or done) else 0
        num_rgb = mixc(WHITE, YEL, hl if active else 0)
        text(c, f'0{n + 1}', x, NODE_Y - 42, 30, num_rgb, ap * (.45 + .55 * (1 if active else .3)), w=600, track=-.02, align=.5)
        text(c, STEPS[n][0], x, NODE_Y + 58, 17, WHITE, ap * (.9 if active else .4), fam='sg', w=600, track=.16, align=.5)
    # Detail block for the active step
    for n in range(5):
        ts = STEP_T0 + n * STEP_DT
        p = e(t, ts + .3, ts + .95)
        ex = e(t, ts + STEP_DT + .2, ts + STEP_DT + .5, iexpo) if n < 4 else e(t, 81.4, 81.7, iexpo)
        if p <= 0 or ex >= 1:
            continue
        masked_text(c, STEPS[n][1], 220, 845, 72, WHITE, p, exitp=ex, w=600, track=-.055)
        da = e(t, ts + .5, ts + 1.0) * (1 - ex)
        text(c, STEPS[n][2], 222, 905 + 12 * (1 - da), 28, WHITE, .62 * da, fam='sg', w=400, track=0)
    # Progress ring (top-right), echoing the website
    ra = e(t, 73.0, 73.6)
    if ra > 0:
        rx, ry, rr = 1630, 280, 120
        c.drawCircle(rx, ry, rr, paint(WHITE, .14 * ra, stroke=2))
        prog = 0 if k < 0 else mix(k / 5, (k + 1) / 5, e(t, STEP_T0 + k * STEP_DT + .3, STEP_T0 + k * STEP_DT + 1.0))
        c.drawArc(skia.Rect.MakeLTRB(rx - rr, ry - rr, rx + rr, ry + rr), -90, 360 * prog, False, paint(YEL, ra, stroke=4))
        text(c, f'0{max(k, 0) + 1}', rx, ry + 34, 96, WHITE, ra, w=700, track=-.06, align=.5)


# ── Scene 9 · CTA + end card (82–90) ─────────────────────────────────────
def cursor(c, x, y, s, a):
    pth = skia.Path()
    pts = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
    for i, (px, py) in enumerate(pts):
        pth.moveTo(x + px * s, y + py * s) if i == 0 else pth.lineTo(x + px * s, y + py * s)
    pth.close()
    c.drawPath(pth, paint((0, 0, 0), .35 * a, blur=4))
    c.drawPath(pth, paint(WHITE, a))
    c.drawPath(pth, paint(INK, a, stroke=1.8))


def s9(c, t):
    blit(c, 'yellow')
    meta(c, '07 / START A PROJECT', 140, 120, DEEP, .6 * e(t, 82.3, 82.9))
    text(c, 'CANADA · WORLDWIDE', 960, 300 + 14 * (1 - e(t, 82.3, 82.9)), 18, BLUE, e(t, 82.3, 82.9), fam='sg', w=600, track=.16, align=.5)
    size = 150
    masked_text(c, 'Have a business', 960, 480, size, INK, e(t, 82.4, 83.2), align=.5, w=700, track=-.075)
    wa = text_w('worth ', size, w=700, track=-.075)
    wb = text_w('building?', size, w=700, track=-.075)
    x0 = 960 - (wa + wb) / 2
    p2 = e(t, 82.65, 83.45)
    masked_text(c, 'worth ', x0, 630, size, INK, p2, w=700, track=-.075)
    masked_text(c, 'building?', x0 + wa, 630, size, DEEP, p2, w=700, track=-.075)
    ca = e(t, 83.2, 83.9)
    text(c, "Tell us what you're building. We'll take it from there.", 960, 720 + 14 * (1 - ca), 28, INK, .8 * ca, fam='sg', w=400, track=0, align=.5)
    # Button → click → expands into the end card
    bp = e(t, 83.6, 84.2, oback)
    grow = e(t, 85.55, 86.45, ioexpo)
    if bp > 0:
        bw, bh, bx, by = 430, 86, 960, 830
        hov = e(t, 84.85, 85.05)
        press = 1 - .05 * math.sin(math.pi * lin(t, 85.05, 85.3))
        w_ = mix(bw * bp * press, W * 1.02, grow)
        h_ = mix(bh * bp * press, H * 1.02, grow)
        cx, cy = mix(bx, 960, grow), mix(by, 540, grow)
        rad = mix(4, 0, grow)
        rect = skia.Rect.MakeXYWH(cx - w_ / 2, cy - h_ / 2, w_, h_)
        if grow < .05:
            shadow(c, rect, rad, .25, 20, 14)
        c.drawRRect(skia.RRect.MakeRectXY(rect, rad, rad), paint(mixc(DEEP, BLUE, hov * (1 - grow))))
        la = (1 - e(t, 85.5, 85.8)) * bp
        if la > 0:
            twd = text_w('START A PROJECT', 22, 'sg', 600, .1)
            text(c, 'START A PROJECT', cx - 22, cy + 8, 22, WHITE, la, fam='sg', w=600, track=.1, align=.5)
            arrow(c, cx - 22 + twd / 2 + 34, cy, 22, YEL, la, angle=-45, width=2.6)
        rp = lin(t, 85.1, 85.7)
        if 0 < rp < 1:
            rr = 50 + 260 * ocubic(rp)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(bx - bw / 2 - rr * .3, by - bh / 2 - rr * .3, bw + rr * .6, bh + rr * .6), 10, 10), paint(DEEP, .5 * (1 - rp), stroke=2))
    cu = lin(t, 84.1, 85.0)
    ca2 = e(t, 84.1, 84.4) * (1 - e(t, 85.45, 85.7))
    if ca2 > 0:
        k = iocubic(cu)
        px, py = mix(1560, 1000, k), mix(1010, 846, k) + math.sin(k * math.pi) * -40
        s = 1 - .14 * math.sin(math.pi * lin(t, 85.02, 85.28))
        cursor(c, px, py, 1.25 * s, ca2)
    if grow > 0.95:
        end_card(c, t)


def end_card(c, t):
    blit(c, 'end')
    particles(c, t, 30, YEL, .45 * e(t, 86.5, 87.5), seed=9, speed=14)
    lw = 760
    logo = svg_img(LOGO_W, lw * 2)
    lh = lw * logo.height() / logo.width()
    lx, ly = 960 - lw / 2, 420 - lh / 2
    lp = e(t, 86.5, 87.3)
    if lp > 0:
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(lx - 10, ly - 10, lx + lw + 10, ly + lh + 10))
        p = skia.Paint(AntiAlias=True)
        c.drawImageRect(logo, skia.Rect.MakeXYWH(lx, ly + lh * 1.05 * (1 - lp), lw, lh), SAMP, p)
        c.restore()
    dl = e(t, 87.2, 87.9) * 260
    c.drawLine(960 - dl, 640, 960 + dl, 640, paint(WHITE, .28, stroke=1.2))
    tp = e(t, 87.4, 88.1)
    tag = 'Design that moves businesses forward'
    tw = text_w(tag, 34, 'syne', 600, -.03)
    text(c, tag, 960 - 10, 712 + 16 * (1 - tp), 34, WHITE, tp, fam='syne', w=600, track=-.03, align=.5)
    c.drawCircle(960 - 10 + tw / 2 + 12, 712 + 16 * (1 - tp) - 5, 6 * e(t, 87.9, 88.3, oback), paint(YEL))
    ip = e(t, 87.75, 88.4)
    text(c, 'hello@rovardstudios.com     ·     Canada · Worldwide', 960, 768 + 12 * (1 - ip), 22, WHITE, .55 * ip, fam='sg', w=400, track=.04, align=.5)


# ── Transitions ──────────────────────────────────────────────────────────
def slats(c, t, t0, t1, draw_a, draw_b, rgb, n=6, colors=None):
    u = lin(t, t0, t1)
    (draw_a if u < .5 else draw_b)(c, t)
    for i in range(n):
        d = i * .045
        if u < .5:
            k = iocubic(clamp((u * 2 - d) / (1 - .045 * (n - 1))))
            top, h = H * (1 - k), H * k
        else:
            k = iocubic(clamp(((u - .5) * 2 - d) / (1 - .045 * (n - 1))))
            top, h = 0, H * (1 - k)
        cc = colors[i % len(colors)] if colors else rgb
        c.drawRect(skia.Rect.MakeXYWH(i * W / n - 1, top, W / n + 2, h), paint(cc))


def diag_wipe(c, t, t0, t1, draw_a, draw_b):
    u = e(t, t0, t1, ioexpo)
    draw_a(c, t)
    if u <= 0:
        return
    slant = 420
    x = mix(-slant, W + slant, u)
    pth = skia.Path()
    pth.moveTo(-10, -10); pth.lineTo(x + slant / 2, -10); pth.lineTo(x - slant / 2, H + 10); pth.lineTo(-10, H + 10); pth.close()
    c.save()
    c.clipPath(pth, skia.ClipOp.kIntersect, True)
    draw_b(c, t)
    c.restore()
    if u < 1:
        c.drawLine(x + slant / 2, -10, x - slant / 2, H + 10, paint(YEL, 1, stroke=10))


def push(c, t, t0, t1, draw_a, draw_b):
    u = e(t, t0, t1, ioexpo)
    c.save(); c.translate(-W * u, 0); draw_a(c, t); c.restore()
    c.save(); c.translate(W * (1 - u), 0); draw_b(c, t); c.restore()
    if 0 < u < 1:
        c.drawRect(skia.Rect.MakeXYWH(W * (1 - u) - 14, 0, 14, H), paint(YEL))


def circle_wipe(c, t, t0, t1, draw_a, draw_b, cx, cy):
    u = e(t, t0, t1, iexpo if False else ioexpo)
    draw_a(c, t)
    r = u * 2300
    if r > 0:
        c.save()
        c.clipPath(skia.Path().addCircle(cx, cy, r), skia.ClipOp.kIntersect, True)
        draw_b(c, t)
        c.restore()


def frame(c, t):
    if t < 8:
        s1(c, t)
    elif t < 13.55:
        s2(c, t)
    elif t < 14.4:
        slats(c, t, 13.55, 14.4, s2, s3, PAPER, colors=[PAPER, (233, 233, 228)])
    elif t < 21.55:
        s3(c, t)
    elif t < 22.35:
        diag_wipe(c, t, 21.55, 22.35, s3, s4)
    elif t < 29.55:
        s4(c, t)
    elif t < 30.3:
        push(c, t, 29.55, 30.3, s4, s5)
    elif t < 39.55:
        s5(c, t)
    elif t < 40.5:
        slats(c, t, 39.55, 40.5, s5, s6, BLUE, n=5, colors=[BLUE, DEEP, YEL, BLUE, DEEP])
    elif t < 62:
        s6(c, t)
    elif t < 71.45:
        s7(c, t)
    elif t < 72.3:
        slats(c, t, 71.45, 72.3, s7, s8, DEEP, colors=[DEEP, BLUE])
    elif t < 81.55:
        s8(c, t)
    elif t < 82.3:
        circle_wipe(c, t, 81.55, 82.3, s8, s9, NODE_X[-1], NODE_Y)
    else:
        s9(c, t)
    marquee_overlay(c, t)
    if t > 89.15:
        fill(c, (0, 0, 0), e(t, 89.15, 90.0, iocubic))


# ── Output ───────────────────────────────────────────────────────────────
def render_rgba(t):
    surf = skia.Surface.MakeRaster(skia.ImageInfo.Make(W, H, skia.ColorType.kRGBA_8888_ColorType, skia.AlphaType.kPremul_AlphaType))
    c = surf.getCanvas()
    c.clear(skia.ColorBLACK)
    frame(c, t)
    return surf


def ffmpeg_exe():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def render_chunk(args):
    idx, f0, f1 = args
    out = os.path.join(BUILD, f'chunk_{idx:03d}.mp4')
    done = out + '.done'
    if os.path.exists(done):
        return out
    cmd = [ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-vf', 'vignette=angle=PI/6,noise=alls=5:allf=t', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
           '-x264-params', 'rc-lookahead=15:threads=3', '-pix_fmt', 'yuv420p', '-tune', 'animation', out]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(f0, f1):
        surf = render_rgba(f / FPS)
        pr.stdin.write(surf.makeImageSnapshot().tobytes())
    pr.stdin.close()
    if pr.wait() != 0:
        raise RuntimeError(f'ffmpeg failed on chunk {idx}')
    open(done, 'w').close()
    return out


def video(workers=4, chunks=45):
    os.makedirs(BUILD, exist_ok=True)
    step = math.ceil(NF / chunks)
    jobs = [(i, i * step, min(NF, (i + 1) * step)) for i in range(chunks) if i * step < NF]
    with Pool(workers) as pool:
        outs = []
        for o in pool.imap(render_chunk, jobs):
            outs.append(o)
            print(f'rendered {len(outs)}/{len(jobs)}', flush=True)
    lst = os.path.join(BUILD, 'chunks.txt')
    with open(lst, 'w') as fh:
        for o in outs:
            fh.write(f"file '{os.path.basename(o)}'\n")
    subprocess.check_call([ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', os.path.join(BUILD, 'video.mp4')])
    print('video ->', os.path.join(BUILD, 'video.mp4'))


def stills(times):
    d = os.path.join(ROOT, 'stills')
    os.makedirs(d, exist_ok=True)
    for ts in times:
        surf = render_rgba(float(ts))
        surf.makeImageSnapshot().save(os.path.join(d, f'{float(ts):05.1f}.png'), skia.kPNG)
        print('still', ts)


if __name__ == '__main__':
    if sys.argv[1] == 'stills':
        stills(sys.argv[2:])
    elif sys.argv[1] == 'video':
        video()
