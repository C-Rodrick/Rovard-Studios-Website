"""Mason & Rowe — fictional architectural imagery engine.

Self-initiated concept project by Rovard Studios. Every image produced here is a
synthetic render of a *fictional* building; none depicts a real property.

Design space is 2400 x 1500 (16:10). Scenes draw in design units and are scaled to
the requested output width, so previews and final exports share one code path.
"""
import math
import os
import random

import numpy as np
import skia
from PIL import Image
from scipy import ndimage as ndi

DW, DH = 2400, 1500
HERE = os.path.dirname(os.path.abspath(__file__))
IMG_OUT = os.path.normpath(os.path.join(HERE, '..', 'website', 'img'))


# ── colour helpers ──────────────────────────────────────────────────────────
def rgb(c):
    if isinstance(c, str):
        c = c.lstrip('#')
        return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
    return tuple(c)


def col(c, a=1.0):
    r, g, b = rgb(c)
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(r), int(g), int(b))


def mix(c1, c2, t):
    a, b = rgb(c1), rgb(c2)
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def P(c=None, a=1.0, shader=None, blur=0, blend=None, stroke=0, cap=None):
    p = skia.Paint(AntiAlias=True)
    if c is not None:
        p.setColor(col(c, a))
    if shader is not None:
        p.setShader(shader)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if blend is not None:
        p.setBlendMode(blend)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        if cap == 'round':
            p.setStrokeCap(skia.Paint.kRound_Cap)
    return p


def LG(x0, y0, x1, y1, stops):
    cols = [col(s[1], s[2] if len(s) > 2 else 1.0) for s in stops]
    pos = [s[0] for s in stops]
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], cols, pos)


def RG(cx, cy, r, stops):
    cols = [col(s[1], s[2] if len(s) > 2 else 1.0) for s in stops]
    pos = [s[0] for s in stops]
    return skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, cols, pos)


def poly(cv, pts, paint):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    p.close()
    cv.drawPath(p, paint)


def rect(cv, x0, y0, x1, y1, paint):
    cv.drawRect(skia.Rect(x0, y0, x1, y1), paint)


def line(cv, x0, y0, x1, y1, paint):
    cv.drawLine(x0, y0, x1, y1, paint)


# ── procedural textures (numpy) ─────────────────────────────────────────────
import functools
import hashlib

CACHE = os.path.join(HERE, '_cache')


def disk_cache(fn):
    """Cache texture arrays on disk — they are deterministic and slow to build."""
    @functools.wraps(fn)
    def wrapper(*a, **k):
        key = hashlib.md5(repr((fn.__name__, a, sorted(k.items()))).encode()).hexdigest()[:16]
        path = os.path.join(CACHE, f'{fn.__name__}_{key}.npy')
        if os.path.exists(path):
            return np.load(path)
        out = fn(*a, **k)
        os.makedirs(CACHE, exist_ok=True)
        np.save(path, out)
        return out
    return wrapper


def fbm(h, w, scale=64, octaves=5, seed=0, aniso=(1.0, 1.0), persistence=0.5):
    """Fractal value noise in [0, 1]. scale is the largest feature size in px."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(w / (scale * aniso[0]) * (2 ** o)) + 2)
        gh = max(2, int(h / (scale * aniso[1]) * (2 ** o)) + 2)
        g = rng.random((gh, gw)).astype(np.float32)
        layer = np.asarray(Image.fromarray(g, 'F').resize((w, h), Image.BICUBIC), np.float32)
        out += layer * amp
        tot += amp
        amp *= persistence
    out /= tot
    lo, hi = out.min(), out.max()
    return (out - lo) / (hi - lo + 1e-6)


def _rgba(arr3):
    h, w, _ = arr3.shape
    out = np.empty((h, w, 4), np.uint8)
    out[..., :3] = np.clip(arr3, 0, 255).astype(np.uint8)
    out[..., 3] = 255
    return out


def shader_from(arr_rgba, tile=True):
    im = skia.Image.fromarray(arr_rgba, colorType=skia.kRGBA_8888_ColorType)
    mode = skia.TileMode.kRepeat if tile else skia.TileMode.kClamp
    return im.makeShader(mode, mode)


@disk_cache
def tex_stone(w, h, lo, hi, seed=1, course=0, joint=0.20, speck=0.05, pits=0.0):
    """Limestone / sandstone texture. course = px height of ashlar courses (0 = none)."""
    lo, hi = np.array(rgb(lo), np.float32), np.array(rgb(hi), np.float32)
    n = 0.55 * fbm(h, w, 220, 5, seed) + 0.45 * fbm(h, w, 18, 3, seed + 7, aniso=(3, 1))
    t = np.clip((n - 0.15) * 1.3, 0, 1)[..., None]
    img = lo + (hi - lo) * t
    rng = np.random.default_rng(seed + 3)
    img *= (1 + rng.normal(0, speck, (h, w, 1)).astype(np.float32))
    if pits:
        p = fbm(h, w, 6, 2, seed + 11)
        img *= 1 - (p > 1 - pits)[..., None] * 0.35
    if course:
        y = 0
        row = 0
        while y < h:
            y1 = min(h, y + course)
            img[y:y + 1] *= 1 - joint
            # per-course tone shift so each course reads as its own block
            img[y:y1] *= 1 + rng.normal(0, 0.035)
            bw = int(course * rng.uniform(2.2, 4.2))
            x = int(rng.uniform(0, bw))
            while x < w:
                img[y:y1, x:x + 1] *= 1 - joint * 0.8
                x += int(course * rng.uniform(2.2, 4.2))
            y = y1
            row += 1
    return _rgba(img)


@disk_cache
def tex_travertine(w, h, lo='#cfc2aa', hi='#e6dcc8', seed=2):
    lo, hi = np.array(rgb(lo), np.float32), np.array(rgb(hi), np.float32)
    band = fbm(h, w, 60, 4, seed, aniso=(8, 1))
    fine = fbm(h, w, 8, 3, seed + 5, aniso=(10, 1))
    t = np.clip(0.65 * band + 0.35 * fine, 0, 1)[..., None]
    img = lo + (hi - lo) * t
    pits = fbm(h, w, 5, 2, seed + 9, aniso=(6, 1))
    img *= 1 - ((pits > 0.86)[..., None]) * 0.28
    return _rgba(img)


@disk_cache
def tex_bronze(w, h, seed=3, lo='#3a2a1c', hi='#a77d4f'):
    lo, hi = np.array(rgb(lo), np.float32), np.array(rgb(hi), np.float32)
    streak = fbm(h, w, 80, 4, seed, aniso=(0.12, 4.0))
    fine = fbm(h, w, 4, 2, seed + 1, aniso=(0.3, 6))
    t = np.clip(0.7 * streak + 0.3 * fine, 0, 1)[..., None]
    return _rgba(lo + (hi - lo) * t)


@disk_cache
def tex_oak(w, h, seed=4, lo='#6b4a2c', hi='#b98d58', vertical=False):
    lo, hi = np.array(rgb(lo), np.float32), np.array(rgb(hi), np.float32)
    an = (0.07, 3.5) if vertical else (3.5, 0.07)
    g = fbm(h, w, 70, 5, seed, aniso=an)
    ring = 0.5 + 0.5 * np.sin(g * 40 + fbm(h, w, 200, 2, seed + 2) * 6)
    t = np.clip(0.55 * g + 0.45 * ring, 0, 1)[..., None]
    return _rgba(lo + (hi - lo) * t)


@disk_cache
def tex_plaster(w, h, lo, hi, seed=5):
    lo, hi = np.array(rgb(lo), np.float32), np.array(rgb(hi), np.float32)
    t = (0.7 * fbm(h, w, 260, 4, seed) + 0.3 * fbm(h, w, 22, 3, seed + 1))[..., None]
    img = lo + (hi - lo) * t
    img *= 1 + np.random.default_rng(seed).normal(0, 0.02, (h, w, 1))
    return _rgba(img)


# ── scene container ─────────────────────────────────────────────────────────
class Scene:
    def __init__(self, W, H=None, seed=1):
        self.W = int(W)
        self.H = int(H or W * DH / DW)
        self.s = self.W / DW
        self.seed = seed
        self.rng = random.Random(seed)
        self.np_rng = np.random.default_rng(seed)
        self.base_surf = skia.Surface(self.W, self.H)
        self.glow_surf = skia.Surface(self.W, self.H)
        self.cv = self.base_surf.getCanvas()
        self.gl = self.glow_surf.getCanvas()
        self.gl.clear(skia.ColorBLACK)
        self.cv.clear(skia.ColorBLACK)
        for c in (self.cv, self.gl):
            c.scale(self.s, self.s)
        self.reflections = []     # (y0, y1_design, kwargs) applied in finish()

    def blurred(self, sigma):
        """with sc.blurred(3): ...  — draw a depth layer through a gaussian blur (design units)."""
        import contextlib

        @contextlib.contextmanager
        def cm():
            self.cv.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(sigma, sigma)))
            try:
                yield
            finally:
                self.cv.restore()
        return cm()

    # px helpers ------------------------------------------------------------
    def px(self, v):
        return int(round(v * self.s))

    # layers -----------------------------------------------------------------
    def fill(self, paint, canvas='cv'):
        c = self.cv if canvas == 'cv' else self.gl
        c.drawRect(skia.Rect(-10, -10, DW + 10, DH + 10), paint)

    def array(self, surf):
        a = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)
        return a[..., :3].astype(np.float32) / 255.0

    def sky(self, stops, y0=0, y1=1260, glow=None, clouds=None):
        self.cv.drawRect(skia.Rect(0, 0, DW, DH), P(shader=LG(0, y0, 0, y1, stops)))
        if glow:
            cx, cy, r, c, a = glow
            self.cv.drawRect(skia.Rect(0, 0, DW, DH),
                             P(shader=RG(cx, cy, r, [(0, c, a), (0.45, c, a * 0.35), (1, c, 0)]),
                               blend=skia.BlendMode.kScreen))
        if clouds:
            self.clouds(**clouds)

    def clouds(self, color='#e2a681', alpha=0.22, y0=300, y1=950, seed=11, scale=(900, 90), cover=0.5):
        w, h = self.W, self.H
        a = fbm(h, w, scale[0] * self.s, 5, seed, aniso=(1.0, scale[1] / scale[0] * 1.0))
        a = np.clip((a - (1 - cover)) / cover, 0, 1) ** 1.4
        yy = np.linspace(0, DH, h)[:, None]
        mask = np.clip((yy - y0) / 120, 0, 1) * np.clip((y1 - yy) / 220, 0, 1)
        a = a * mask * alpha
        rgbc = np.array(rgb(color), np.uint8)
        arr = np.empty((h, w, 4), np.uint8)
        arr[..., :3] = rgbc
        arr[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
        im = skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType)
        self.cv.save()
        self.cv.resetMatrix()
        self.cv.drawImage(im, 0, 0)
        self.cv.restore()

    def glowdot(self, x, y, r, color, a=1.0):
        self.gl.drawCircle(x, y, r, P(color, a))

    def reflect(self, y_ground, **kw):
        self.reflections.append((y_ground, kw))

    # post -------------------------------------------------------------------
    def _blur(self, a, sigma):
        sigma = max(0.5, sigma)
        if sigma > 12:      # blur at reduced res, then lift back — much faster
            f = int(min(8, sigma // 6))
            small = a[::f, ::f]
            small = ndi.gaussian_filter(small, (sigma / f, sigma / f, 0))
            im = Image.fromarray(np.clip(small * 255, 0, 255).astype(np.uint8)).resize((a.shape[1], a.shape[0]), Image.BICUBIC)
            return np.asarray(im, np.float32) / 255.0
        return ndi.gaussian_filter(a, (sigma, sigma, 0))

    def _apply_reflection(self, img, gl, y_ground, strength=0.5, fade=0.9, blur_v=10, blur_h=1.5,
                          ripple=0.0, ripple_scale=140, tint=None, tint_a=0.0, dark=0.0, depth=None, mixmode=False):
        s = self.s
        yg = int(y_ground * s)
        H, W = img.shape[:2]
        n = H - yg
        if n <= 4:
            return img, gl
        depth = depth or n
        src_idx = (yg - 1 - np.arange(n)).clip(0, H - 1)
        refl = img[src_idx].copy()
        rgl = gl[src_idx].copy()
        if ripple:
            rr = np.random.default_rng(self.seed + 77)
            sh = (fbm(n, 1 + 1, ripple_scale * s, 3, self.seed + 5, aniso=(1, 0.15))[:, :1] - 0.5)
            sh = sh * 2 * ripple * s * (0.4 + np.linspace(0, 1, n)[:, None])
            sh = sh + (rr.random((n, 1)) - 0.5) * ripple * 0.5 * s
            xs = np.arange(W)[None, :] + sh
            xi = np.clip(xs, 0, W - 1).astype(np.int32)
            rows = np.arange(n)[:, None]
            refl = refl[rows, xi]
            rgl = rgl[rows, xi]
        refl = ndi.gaussian_filter(refl, (blur_v * s, blur_h * s, 0))
        rgl = ndi.gaussian_filter(rgl, (blur_v * s * 1.4, blur_h * s * 1.4, 0))
        t = np.linspace(0, 1, n)[:, None, None]
        f = strength * np.clip(1 - t / max(fade, 1e-3), 0, 1) ** 1.35
        region = img[yg:]
        if dark:
            region = region * (1 - dark)
        if tint is not None:
            tc = np.array(rgb(tint), np.float32) / 255.0
            region = region * (1 - tint_a) + tc * tint_a
        img = img.copy()
        gl = gl.copy()
        img[yg:] = (region * (1 - f) + refl * f) if mixmode else (region + refl * f)
        gl[yg:] = gl[yg:] + rgl * f * 1.2
        return img, gl

    def finish(self, path, grade=None, bloom=1.0, grain=0.011, vignette=0.28, soft=0.55,
               quality=82, width=None, bloom_tint=None):
        g = dict(GRADE_DEFAULT)
        if grade:
            g.update(grade)
        img = self.array(self.base_surf)
        gl = self.array(self.glow_surf)
        s = self.s
        if soft:
            img = ndi.gaussian_filter(img, (soft * s * 1.3, soft * s * 1.3, 0))
        for y_ground, kw in self.reflections:
            img, gl = self._apply_reflection(img, gl, y_ground, **kw)
        # bloom — three radii, screened over the picture
        b = (0.50 * self._blur(gl, 5 * s) + 0.55 * self._blur(gl, 20 * s) + 0.60 * self._blur(gl, 70 * s)) * bloom
        if bloom_tint:
            b = b * (np.array(rgb(bloom_tint), np.float32) / 255.0)
        b = np.clip(b, 0, 1)
        img = 1 - (1 - np.clip(img, 0, 1)) * (1 - b)
        img = grade_image(img, g)
        H, W = img.shape[:2]
        # vignette
        if vignette:
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.41
            img = img * (1 - vignette * np.clip(d, 0, 1) ** 2.4)[..., None]
        # film grain — generated at lower res and lifted, so it clumps like film rather than sensor noise
        if grain:
            rng = np.random.default_rng(self.seed + 123)
            gh, gw = int(H * 0.62), int(W * 0.62)
            n = rng.normal(0, 1, (gh, gw)).astype(np.float32)
            n = np.asarray(Image.fromarray(n, 'F').resize((W, H), Image.BICUBIC), np.float32)
            lum = img.mean(-1, keepdims=True)
            img = img + n[..., None] * grain * (0.55 + 0.9 * (1 - lum))
            cn = rng.normal(0, grain * 0.28, (H, W, 3)).astype(np.float32)
            img = img + cn
        img = np.clip(img, 0, 1)
        out = Image.fromarray((img * 255 + 0.5).astype(np.uint8))
        if width and width != W:
            out = out.resize((width, int(width * H / W)), Image.LANCZOS)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        out.save(path, 'JPEG', quality=quality, optimize=True, progressive=True)
        return path


GRADE_DEFAULT = dict(
    shadow=(-0.004, 0.006, 0.020),     # cool, slightly teal shadows
    high=(0.040, 0.016, -0.022),       # warm bronze highlights
    sat=0.90, contrast=0.34, lift=0.012, gain=1.0, gamma=1.0,
)


def grade_image(img, g):
    img = np.clip(img * g['gain'], 0, 1)
    if g['gamma'] != 1.0:
        img = img ** (1.0 / g['gamma'])
    lum = (img * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    img = img + (1 - lum) ** 2.4 * np.array(g['shadow'], np.float32) + lum ** 2 * np.array(g['high'], np.float32)
    lum = (img * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
    img = lum + (img - lum) * g['sat']
    img = np.clip(img, 0, 1)
    sm = img * img * (3 - 2 * img)
    img = img * (1 - g['contrast']) + sm * g['contrast']
    img = img * (1 - g['lift']) + g['lift']
    return np.clip(img, 0, 1)


# ── drawing building blocks ─────────────────────────────────────────────────
class Face:
    """A planar facade. u runs 0..1 across, h is px above base. k > 0 recedes to the right
    toward the horizon line yh, giving a one-point side face with true parallel verticals."""

    def __init__(self, x0, x1, y_base, k=0.0, yh=0.0):
        self.x0, self.x1, self.yb, self.k, self.yh = x0, x1, y_base, k, yh

    def pt(self, u, h):
        x = self.x0 + (self.x1 - self.x0) * u
        y = self.yb - h
        if self.k:
            y = self.yh + (y - self.yh) * (1 - self.k * u)
        return (x, y)

    def quad(self, u0, u1, h0, h1):
        return [self.pt(u0, h0), self.pt(u1, h0), self.pt(u1, h1), self.pt(u0, h1)]


def figure(cv, x, y, h, c='#0c0d0e', a=0.95, glow=None):
    """Tiny standing figure for scale."""
    w = h * 0.26
    cv.drawOval(skia.Rect(x - w * 0.42, y - h, x + w * 0.42, y - h + h * 0.13), P(c, a))
    path = skia.Path()
    path.moveTo(x - w * 0.55, y - h * 0.86)
    path.lineTo(x + w * 0.55, y - h * 0.86)
    path.lineTo(x + w * 0.42, y - h * 0.42)
    path.lineTo(x + w * 0.5, y)
    path.lineTo(x + w * 0.08, y)
    path.lineTo(x, y - h * 0.38)
    path.lineTo(x - w * 0.08, y)
    path.lineTo(x - w * 0.5, y)
    path.lineTo(x - w * 0.42, y - h * 0.42)
    path.close()
    cv.drawPath(path, P(c, a))


def canopy(cv, cx, cy, r, colors, rng, n=46, spread=1.0, squash=0.8):
    """Dense tree canopy from many overlapping blobs."""
    for i in range(n):
        ang = rng.uniform(0, math.tau)
        d = r * math.sqrt(rng.random()) * spread
        x = cx + math.cos(ang) * d
        y = cy + math.sin(ang) * d * squash
        rr = r * rng.uniform(0.16, 0.34)
        cv.drawCircle(x, y, rr, P(rng.choice(colors), rng.uniform(0.75, 1.0)))
