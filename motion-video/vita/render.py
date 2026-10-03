"""Vita House: 45 s walkthrough motion film (1920x1080, 30 fps). Usage: render.py stills t1 t2 | video"""
import math, os, subprocess, sys
import skia
W, H, FPS, DUR = 1920, 1080, 30, 45.0
NF = int(DUR * FPS)
R = os.path.dirname(os.path.abspath(__file__))
SH = os.path.join(R, 'shots')
LINEN = (246, 241, 231); OAT = (251, 248, 242); MOSS = (63, 92, 71); DEEP = (32, 53, 42)
HONEY = (232, 188, 94); SAGE = (201, 215, 192); INK = (35, 38, 34); CLAY = (196, 113, 76); BLUSH = (240, 211, 196)


def col(c, a=1):
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), *c)


def P(c, a=1, stroke=None):
    p = skia.Paint(AntiAlias=True, Color=col(c, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
    return p


def cl(x): return max(0., min(1., x))
def lin(t, a, b): return cl((t - a) / (b - a))
def oc(x): return 1 - (1 - x) ** 3
def ob(x, s=1.5):
    x -= 1
    return x * x * ((s + 1) * x + s) + 1


SER = skia.Typeface('Georgia')
SANS = skia.Typeface('Segoe UI', skia.FontStyle.Bold())
SANSR = skia.Typeface('Segoe UI')
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)
IMG = {}


def img(n):
    if n not in IMG:
        IMG[n] = skia.Image.open(os.path.join(SH, n + '.png'))
    return IMG[n]


def text(cv, s, x, y, tf, sz, c, a=1, anchor='l'):
    f = skia.Font(tf, sz)
    w = f.measureText(s)
    if anchor == 'c':
        x -= w / 2
    cv.drawString(s, x, y, f, P(c, a))
    return w


def mark(cv, cx, cy, h, arch=MOSS, sun=HONEY):
    s = h / 72
    cv.save(); cv.translate(cx - 32 * s, cy - 36 * s); cv.scale(s, s)
    cv.saveLayer(None, None)
    path = skia.Path(); path.moveTo(6, 72); path.lineTo(6, 32); path.arcTo(skia.Rect(6, 6, 58, 58), 180, 180, False); path.lineTo(58, 72); path.close()
    cv.drawPath(path, P(arch))
    clr = skia.Paint(AntiAlias=True, BlendMode=skia.BlendMode.kClear)
    v = skia.Paint(AntiAlias=True, BlendMode=skia.BlendMode.kClear, Style=skia.Paint.kStroke_Style, StrokeWidth=7,
                   StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    vp = skia.Path(); vp.moveTo(19, 40); vp.lineTo(32, 62); vp.lineTo(45, 40)
    cv.drawPath(vp, v); cv.drawCircle(32, 27, 7.2, clr); cv.restore()
    cv.drawCircle(32, 27, 4.5, P(sun)); cv.restore()


def rr(x, y, w, h, r): return skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)


def shadow(cv, x, y, w, h, r, blur=40, dy=24, a=.28):
    p = skia.Paint(AntiAlias=True, Color=col((20, 30, 24), a))
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    cv.drawRRect(rr(x, y + dy, w, h, r), p)


def browser(cv, name, x, y, w, a=1, zoom=1.0):
    im = img(name); ch = 34; ih = w * im.height() / im.width(); h = ih + ch
    shadow(cv, x, y, w, h, 18, a=.3 * a)
    cv.save(); cv.clipRRect(rr(x, y, w, h, 18), True)
    cv.drawRect(skia.Rect.MakeXYWH(x, y, w, ch), P((236, 228, 214), a))
    for i in range(3):
        cv.drawCircle(x + 22 + i * 18, y + ch / 2, 5, P((207, 194, 168), a))
    cv.clipRect(skia.Rect.MakeXYWH(x, y + ch, w, ih))
    cv.translate(x + w / 2, y + ch + ih / 2); cv.scale(zoom, zoom)
    cv.drawImageRect(im, skia.Rect.MakeXYWH(-w / 2, -ih / 2, w, ih), SAMP, P((255, 255, 255), a))
    cv.restore()


def phone(cv, name, x, y, w, a=1, rot=0):
    im = img(name); h = w * im.height() / im.width()
    cv.save(); cv.translate(x + w / 2, y + h / 2); cv.rotate(rot); cv.translate(-w / 2, -h / 2)
    shadow(cv, 0, 0, w, h, 40, a=.35 * a)
    cv.drawRRect(rr(-10, -10, w + 20, h + 20, 44), P((27, 30, 27), a))
    cv.save(); cv.clipRRect(rr(0, 0, w, h, 34), True)
    cv.drawImageRect(im, skia.Rect.MakeXYWH(0, 0, w, h), SAMP, P((255, 255, 255), a)); cv.restore()
    cv.drawRRect(rr(w / 2 - 46, 6, 92, 22, 11), P((0, 0, 0), a)); cv.restore()


def bg_fx(cv, t, dark):
    cv.clear(col(DEEP if dark else LINEN))
    c = MOSS if dark else SAGE
    for i, (x, w, hh) in enumerate([(1500, 260, 520), (1740, 200, 380), (1320, 160, 300)]):
        yy = H - hh + math.sin(t * .6 + i) * 10
        p = skia.Path(); p.moveTo(x, H); p.lineTo(x, yy + w / 2); p.arcTo(skia.Rect(x, yy, x + w, yy + w), 180, 180, False); p.lineTo(x + w, H); p.close()
        cv.drawPath(p, P(c, .28 if dark else .45))


def chip(cv, s, x, y, bg, fg, sz=26, a=1):
    f = skia.Font(SANS, sz); w = f.measureText(s) + 44
    cv.drawRRect(rr(x, y - sz - 12, w, sz + 30, (sz + 30) / 2), P(bg, a)); cv.drawString(s, x + 22, y + 2, f, P(fg, a))


def scene_text(cv, t, t0, num, title, bullets, dark):
    fg = OAT if dark else INK; acc = HONEY if dark else CLAY
    k = oc(lin(t, t0, t0 + .7)); cv.save(); cv.translate(-40 * (1 - k), 0)
    text(cv, '0%d' % num, 120, 230, SER, 150, acc, k * .9)
    text(cv, title, 120, 360, SER, 84, fg, k)
    for i, b in enumerate(bullets):
        kk = oc(lin(t, t0 + .9 + i * .5, t0 + 1.5 + i * .5)); cv.save(); cv.translate(0, 24 * (1 - kk))
        cv.drawCircle(132, 470 + i * 86 - 9, 8, P(acc, kk)); text(cv, b, 162, 470 + i * 86, SANSR, 36, fg, kk * .92); cv.restore()
    cv.restore()


def seq(cv, t, t0, t1, names, x, y, w):
    n = len(names); seg = (t1 - t0) / n; i = min(n - 1, int((t - t0) / seg)); lt = (t - t0) - i * seg
    if i > 0:
        browser(cv, names[i - 1], x, y, w, 1, 1.0)
    a = oc(lin(lt, 0, .45)) if i > 0 else oc(lin(t, t0 - .3, t0 + .4))
    z = 1.0 + .05 * lin(lt, 0, seg)
    browser(cv, names[i], x, y + (1 - a) * 30, w, a, z)
    return i


def progress(cv, i, total, x, y):
    for s in range(total):
        cv.drawRRect(rr(x + s * 72, y, 60, 10, 5), P(HONEY if s <= i else SAGE))


SCENES = [(0, 4, False), (4, 12, True), (12, 25, False), (25, 35, True), (35, 40, False), (40, 45, True)]


def render(t):
    surf = skia.Surface(W, H); cv = surf.getCanvas()
    idx = max(i for i, s in enumerate(SCENES) if s[0] <= t) if t < 45 else 5
    bg_fx(cv, t, SCENES[idx][2])
    out = 0
    if t < 4:
        mark(cv, 960, 380, 260 * (.6 + .4 * ob(lin(t, .2, 1.3))), MOSS, HONEY)
        text(cv, 'Vita House', 960, 640, SER, 120, INK, oc(lin(t, 1.0, 1.9)), 'c')
        text(cv, 'How to use this site, in 45 seconds', 960, 730, SANSR, 40, MOSS, oc(lin(t, 1.7, 2.5)), 'c')
        chip(cv, 'SELF-INITIATED CONCEPT PROJECT', 960 - 270, 850, BLUSH, (148, 71, 43), 24, oc(lin(t, 2.3, 3.1)))
        out = lin(t, 3.6, 4.0)
    elif t < 12:
        scene_text(cv, t, 4, 1, 'Explore', ['Services, providers and membership', 'Filter by need, language and place', 'See real next-available times'], True)
        seq(cv, t, 4.3, 12, ['home', 'providers', 'provider'], 830, 200, 980)
        out = lin(t, 11.6, 12)
    elif t < 25:
        scene_text(cv, t, 12, 2, 'Book in six steps', ['Service, provider, then location', 'Pick a day, then a time', 'Errors explained, never blamed', 'Confirm, then add it to your calendar'], False)
        i = seq(cv, t, 12.4, 25, ['book1', 'book2', 'book4', 'book5', 'book6'], 830, 190, 980)
        progress(cv, [0, 1, 3, 4, 5][i], 6, 120, 900); text(cv, 'Step progress is always visible', 120, 960, SANSR, 28, MOSS, .9)
        out = lin(t, 24.6, 25)
    elif t < 35:
        scene_text(cv, t, 25, 3, 'Your dashboard', ['Next visit, check-in and prep list', 'Message your care team', 'Documents, results and membership'], True)
        seq(cv, t, 25.4, 35, ['portal', 'messages', 'docs'], 830, 200, 980)
        out = lin(t, 34.6, 35)
    elif t < 40:
        scene_text(cv, t, 35, 4, 'On any device', ['Mobile-first booking and dashboard', 'Text size and reduced motion in Settings', 'Keyboard and screen-reader friendly'], False)
        a = oc(lin(t, 35.3, 36.1)); phone(cv, 'm_book', 1060, 110 + 40 * (1 - a), 300, a, -3)
        a = oc(lin(t, 35.6, 36.4)); phone(cv, 'm_portal', 1450, 190 + 40 * (1 - a), 300, a, 3)
        out = lin(t, 39.6, 40)
    else:
        text(cv, 'Use it to', 960, 250, SER, 96, OAT, oc(lin(t, 40, 40.8)), 'c')
        items = ['Test the UX', 'Demo the brand', 'Learn the flows']
        ws = [skia.Font(SANS, 40).measureText(s) + 70 for s in items]; x = 960 - (sum(ws) + 80) / 2
        for i, s in enumerate(items):
            kk = oc(lin(t, 40.6 + i * .35, 41.3 + i * .35)); cv.save(); cv.translate(0, 30 * (1 - kk))
            cv.drawRRect(rr(x, 330, ws[i], 90, 45), P(HONEY, kk)); text(cv, s, x + 35, 390, SANS, 40, DEEP, kk); cv.restore(); x += ws[i] + 40
        k = oc(lin(t, 42, 42.9)); mark(cv, 960, 620, 150, SAGE, HONEY)
        text(cv, 'Vita House', 960, 780, SER, 84, OAT, k, 'c')
        text(cv, 'Open  vita-house/site/index.html', 960, 850, SANSR, 34, SAGE, k, 'c')
        text(cv, 'Self-initiated concept by Rovard Studios. Fictional, not medical advice.', 960, 980, SANSR, 28, SAGE, k * .8, 'c')
    if out > 0:
        nxt = SCENES[idx + 1][2] if idx < 5 else True
        cv.drawRect(skia.Rect.MakeWH(W, H), P(DEEP if nxt else LINEN, oc(out)))
    if t < .4:
        cv.drawRect(skia.Rect.MakeWH(W, H), P(LINEN, 1 - t / .4))
    if t > 44.4:
        cv.drawRect(skia.Rect.MakeWH(W, H), P((0, 0, 0), lin(t, 44.4, 45)))
    return surf


def stills(ts):
    os.makedirs(os.path.join(R, 'stills'), exist_ok=True)
    for t in ts:
        render(float(t)).makeImageSnapshot().save(os.path.join(R, 'stills', '%04.1f.png' % float(t)), skia.kPNG); print('still', t)


def ff():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def video():
    out = os.path.join(R, 'silent.mp4')
    pr = subprocess.Popen([ff(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', out], stdin=subprocess.PIPE)
    for f in range(NF):
        pr.stdin.write(render(f / FPS).makeImageSnapshot().tobytes())
        if f % 150 == 0:
            print(f, flush=True)
    pr.stdin.close(); pr.wait(); print('done')


if __name__ == '__main__':
    stills(sys.argv[2:]) if sys.argv[1] == 'stills' else video()
