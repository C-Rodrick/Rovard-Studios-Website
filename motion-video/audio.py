"""Rovard Studios film — synthesized soundtrack + sound design (90 s, 48 kHz stereo).

Everything is generated in code and locked to the same timings as render.py.
Output: build/soundtrack.wav
"""
import os

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 90.0
N = int(SR * DUR)
BEAT = .5            # 120 BPM
BAR = 2.0
ROOT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(42)

dry = np.zeros((2, N))
verb = np.zeros((2, N))        # reverb send bus
music = np.zeros((2, N))       # tonal instruments (sidechained to the kick)
duck = np.ones(N)              # sidechain envelope from the kick


def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def lp(x, fc, order=2): return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def place(sig, start, gain=1.0, pan=0.0, send=0.0, bus=None):
    """Add a mono or stereo signal at `start` seconds with equal-power pan and a reverb send."""
    i0 = int(start * SR)
    if i0 >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        st = np.vstack([sig * np.cos(a), sig * np.sin(a)])
    else:
        st = sig
    n = min(st.shape[1], N - max(i0, 0))
    s0 = max(0, -i0)
    i0 = max(i0, 0)
    seg = st[:, s0:s0 + n - s0] * gain
    (bus if bus is not None else dry)[:, i0:i0 + seg.shape[1]] += seg
    if send:
        verb[:, i0:i0 + seg.shape[1]] += seg * send


def sweep_filter(x, f_from, f_to, kind='low', block=480, curve=1.0):
    """Time-varying filter by block-wise coefficient updates (keeps filter state)."""
    out = np.zeros_like(x)
    zi = np.zeros((1, 2))
    nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        k = (b / max(1, nb - 1)) ** curve
        fc = f_from * (f_to / f_from) ** k
        fc = min(fc, SR * .45)
        sos = butter(1, fc, kind, fs=SR, output='sos')
        out[b * block:(b + 1) * block], zi = sosfilt(sos, x[b * block:(b + 1) * block], zi=zi)
    return out


# ── Instruments ──────────────────────────────────────────────────────────
def saw(f, n, detune=0.0):
    ph = (np.cumsum(np.full(n, f * 2 ** (detune / 1200))) / SR + rng.random()) % 1
    return 2 * ph - 1


def kick(gain=1.0):
    n = int(.45 * SR)
    t = tt(n)
    f = 45 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 300) * .35
    return np.tanh((body + click) * 1.6) * gain * .78


def clap():
    n = int(.35 * SR)
    t = tt(n)
    nz = bp(rng.standard_normal(n), 900, 5200)
    env = np.exp(-t * 18)
    for d in (.0, .011, .022):             # the classic triple-hit clap
        k = int(d * SR)
        env[k:] += .55 * np.exp(-(t[: n - k]) * 70)
    return nz * env * .7


def hat(open_=False):
    n = int((.22 if open_ else .05) * SR)
    t = tt(n)
    return hp(rng.standard_normal(n), 7500, 3) * np.exp(-t * (14 if open_ else 90)) * .46


def rim():
    n = int(.08 * SR)
    t = tt(n)
    return (np.sin(2 * np.pi * 1700 * t) * .6 + bp(rng.standard_normal(n), 1500, 4500)) * np.exp(-t * 60) * .22


def pluck(m, dur=.42):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .45 * np.sin(4 * np.pi * f * t) + .18 * np.sin(6 * np.pi * f * t + .4)
    return lp(s * np.exp(-t * 9) * (1 - np.exp(-t * 900)), 5200) * .34


def bass_note(m, dur, cutoff=420):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    s = .7 * np.sin(2 * np.pi * f * t) + .5 * saw(f, n) * .5
    env = (1 - np.exp(-t * 200)) * np.exp(-t * 1.1)
    env[-int(.02 * SR):] *= np.linspace(1, 0, int(.02 * SR))
    return np.tanh(lp(s, cutoff) * env * 1.8) * .27


def pad_chord(notes, dur, cutoff=1400, gain=.11):
    gain *= 1.5
    n = int(dur * SR)
    t = tt(n)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f = mtof(m)
        L += saw(f, n, -7) + saw(f, n, 4)
        R += saw(f, n, 7) + saw(f, n, -3)
    att = np.minimum(1, t / .35)
    rel = np.minimum(1, (dur - t) / .45)
    env = att * np.clip(rel, 0, 1)
    return np.vstack([lp(L, cutoff, 2) * env, lp(R, cutoff, 2) * env]) * gain


# ── Sound design ─────────────────────────────────────────────────────────
def impact(size=1.0):
    n = int(2.6 * SR)
    t = tt(n)
    f = 32 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = lp(rng.standard_normal(n), 2600) * np.exp(-t * 11) * .7
    air = hp(rng.standard_normal(n), 4000) * np.exp(-t * 6) * .12
    return np.tanh((boom * 1.4 + crack + air) * size)


def riser(dur, f0=180, f1=2600):
    n = int(dur * SR)
    t = tt(n)
    k = t / dur
    nz = sweep_filter(rng.standard_normal(n), 300, 9000, 'low', curve=1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (k ** 1.8)) / SR) * .25
    env = k ** 2.4
    s = (nz * .55 + tone) * env
    s[-int(.03 * SR):] *= np.linspace(1, 0, int(.03 * SR))
    return s * .7


def whoosh(dur=.7, f_lo=250, f_hi=5000, gain=1.0):
    n = int(dur * SR)
    t = tt(n)
    k = t / dur
    nz = rng.standard_normal(n)
    up = sweep_filter(nz, f_lo, f_hi, 'low', curve=.8)
    env = np.sin(np.pi * np.clip(k, 0, 1)) ** 1.6
    s = up * env
    # stereo motion: pan left → right through the sweep
    a = (np.clip(k * 2 - 1, -1, 1) + 1) * np.pi / 4
    return np.vstack([s * np.cos(a), s * np.sin(a)]) * .55 * gain


def swish(gain=.6):
    return whoosh(.32, 900, 9000, gain)


def tick(freq=3200, gain=.18):
    n = int(.03 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 220) * gain


def key_tick():
    n = int(.025 * SR)
    t = tt(n)
    return bp(rng.standard_normal(n), 1800, 6500) * np.exp(-t * 320) * .16


def ping(m, gain=.2):
    n = int(1.4 * SR)
    t = tt(n)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 4.5) * (1 - np.exp(-t * 1500)) * gain


def shimmer(dur=1.6, gain=.14):
    n = int(dur * SR)
    t = tt(n)
    out = np.zeros(n)
    for m in (88, 91, 95, 100, 103, 107):
        f = mtof(m)
        on = rng.uniform(0, dur * .45)
        e = np.where(t >= on, np.exp(-(t - on) * 3.2), 0) * (1 - np.exp(-np.maximum(t - on, 0) * 400))
        out += np.sin(2 * np.pi * f * t + rng.random() * 6) * e
    return out * gain


def click():
    n = int(.06 * SR)
    t = tt(n)
    a = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 260)
    b = np.zeros(n)
    k = int(.035 * SR)
    b[k:] = np.sin(2 * np.pi * 3100 * t[: n - k]) * np.exp(-t[: n - k] * 300)
    return (a + b * .7) * .3


def heartbeat():
    n = int(.4 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * (48 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 11) * .5


# ── Arrangement ──────────────────────────────────────────────────────────
PROG = [([57, 60, 64], 33), ([53, 57, 60], 29), ([55, 60, 64], 36), ([55, 59, 62], 31)]   # Am F C G
ARP = [[69, 72, 76, 72], [65, 69, 72, 69], [67, 72, 76, 72], [67, 71, 74, 71]]


def section(t):
    if t < 8: return 'intro'
    if t < 14: return 'logo'
    if t < 22: return 'groove'
    if t < 30: return 'break'
    if t < 40: return 'groove'
    if t < 59.6: return 'work'
    if t < 62: return 'lift'
    if t < 72: return 'half'
    if t < 82: return 'build'
    if t < 86.4: return 'cta'
    return 'end'


# Pads (every bar, brighter in fuller sections)
for b in range(45):
    t0 = b * BAR
    sec = section(t0)
    notes, root = PROG[b % 4]
    cutoff = {'intro': 520 + 140 * b, 'logo': 1500, 'groove': 1700, 'break': 1100, 'work': 2300, 'lift': 2600,
              'half': 1400, 'build': 1600 + 260 * (b - 36), 'cta': 1500, 'end': 1300}[sec]
    gain = {'intro': .06 + .012 * b, 'end': .12}.get(sec, .1)
    if t0 >= 86.0:
        notes = PROG[0][0]
        place(pad_chord(notes + [69], 4.2, 1300, .12), 86.4, send=.5, bus=music)
        break
    place(pad_chord(notes, BAR + .45, cutoff, gain), t0, send=.35, bus=music)

# Final chord root + octave bass swell
place(bass_note(33, 3.6, 260), 86.4, gain=.9)

# Heartbeat pulses on the dot (1.0–4.5 s)
for k in range(8):
    place(heartbeat(), 1.0 + k * BEAT, gain=.55 + .05 * k)

# Drums, bass, plucks per beat
for i in range(int(DUR / BEAT)):
    t = i * BEAT
    sec = section(t)
    bar = int(t // BAR)
    beat_in_bar = i % 4
    notes, root = PROG[bar % 4]
    kick_on = sec in ('groove', 'work', 'build', 'cta') or (sec == 'logo' and t >= 10) or (sec == 'half' and beat_in_bar in (0, 2))
    if sec == 'cta' and t >= 85.5:
        kick_on = False
    if kick_on:
        place(kick(), t, gain=.95)
        a, b_ = int(t * SR), min(N, int((t + .4) * SR))
        duck[a:b_] = np.minimum(duck[a:b_], 1 - .55 * np.exp(-tt(b_ - a) / .11))
    if sec in ('groove', 'work', 'build') and beat_in_bar in (1, 3):
        place(clap(), t, gain=.8, send=.25)
    if sec == 'half' and beat_in_bar == 2:
        place(clap(), t, gain=.7, send=.4)
    if sec in ('groove', 'work', 'build', 'logo', 'cta') and not (sec == 'logo' and t < 10):
        place(hat(), t + .25, gain=.9, pan=.25)
        if sec in ('work', 'build'):
            place(hat(), t + .125, gain=.45, pan=-.2)
            place(hat(), t + .375, gain=.4, pan=.3)
        if beat_in_bar == 3 and bar % 2 == 1:
            place(hat(True), t + .25, gain=.6, pan=.2)
    if sec == 'break':
        for s16 in range(4):
            place(hat(), t + s16 * .125, gain=.22 + .1 * (s16 % 2), pan=-.3 + .2 * s16)
    if sec == 'work':
        place(rim(), t + .375, gain=.8, pan=-.4)
    # Bass
    if sec in ('groove', 'work', 'build', 'cta'):
        for e8 in range(2):
            m = root + (12 if (e8 == 1 and beat_in_bar == 3) else 0)
            place(bass_note(m, .24, 520 if sec == 'work' else 420), t + e8 * .25, gain=1.0, bus=music)
    elif sec in ('logo', 'break', 'half') and beat_in_bar == 0:
        place(bass_note(root, 1.9, 300), t, gain=.95, bus=music)
    # Pluck arpeggio (16ths in break/half, 8ths in groove/work)
    arp = ARP[bar % 4]
    if sec in ('break', 'half', 'build'):
        for s16 in range(4):
            idx = (beat_in_bar * 4 + s16) % 4
            place(pluck(arp[idx] + (12 if s16 == 3 and beat_in_bar % 2 else 0)), t + s16 * .125, gain=.9, pan=-.35 + .23 * s16, send=.3, bus=music)
    elif sec in ('groove', 'work'):
        for e8 in range(2):
            place(pluck(arp[(beat_in_bar * 2 + e8) % 4]), t + e8 * .25, gain=.75, pan=.3 if e8 else -.3, send=.3, bus=music)

# Snare roll building into the CTA (80–82 s)
for k in range(24):
    tr = 80.0 + 2.0 * (1 - (1 - k / 24) ** 1.5)
    place(clap(), tr, gain=.25 + .55 * k / 24, send=.2)

# Simple tempo-synced echo on the plucks (dotted 8th) — applied via the reverb bus tail below

# ── Sound design cues (seconds) ──────────────────────────────────────────
# Intro typewriter ticks
for s, t0, t1 in (('ROVARD STUDIOS / 001', 1.2, 2.0), ('CANADA · WORLDWIDE', 1.4, 2.2)):
    for k in range(len(s)):
        place(key_tick(), t0 + (t1 - t0) * k / len(s), gain=1.0, pan=-.6 if t0 == 1.2 else .6)
# Headline reveal + dot flight
place(swish(.35), 1.95)
place(swish(.3), 2.25)
place(whoosh(.7, 400, 6000, .5), 2.9)
place(ping(84, .16), 3.5, send=.6)                 # dot lands as the full stop
place(whoosh(.6, 600, 7000, .45), 4.75)
place(whoosh(.8, 300, 4000, .5), 5.55)
# Riser → silence → logo impact
place(riser(2.0), 6.0, gain=.9, send=.3)
place(impact(1.1), 8.0, gain=1.0, send=.6)
place(shimmer(1.8, .16), 8.4, send=.8)
place(whoosh(.6, 300, 3000, .5), 8.75)
place(shimmer(1.4, .12), 9.7, send=.7)             # light sweep across the logo
place(tick(2600, .12), 10.0)
place(tick(3400, .1), 10.45)
# Transitions
for t0, d in ((13.55, .85), (21.55, .8), (29.55, .75), (39.55, .95), (71.45, .85), (81.55, .75)):
    place(whoosh(d, 200, 6500, .9), t0, send=.25)
for t0 in (14.0, 22.0, 30.0, 40.0, 72.0, 82.0):
    place(impact(.65), t0, gain=.45, send=.4)
# Hero line reveals + marker
for k in range(3):
    place(swish(.35), 14.4 + .2 * k)
place(ping(88, .1), 15.5, send=.5)
place(whoosh(.5, 1200, 9000, .35), 18.35)
place(tick(2800, .12), 16.8)
# Positioning words, strike + focus lock
for k in range(9):
    place(tick(2400 + 90 * k, .06), 22.5 + (.09 * k if k < 5 else .95 + .1 * (k - 5)))
place(whoosh(.45, 1500, 9000, .55), 24.95)                     # strike swipe
place(click(), 26.55, gain=.8)
place(ping(81, .12), 26.6, send=.6)
# Services
for k in range(6):
    place(tick(2000 + 120 * k, .07), 31.0 + .12 * k)
    place(tick(3000, .14), 32.6 + k)
    place(swish(.25), 32.6 + k)
place(whoosh(1.3, 300, 7000, .6), 38.6)                        # ribbon
place(riser(1.4, 220, 3200), 38.6, gain=.6)
# Work: one swish per card swap
place(swish(.4), 40.2)
for j in range(8):
    t0 = 42.0 + j * 2.0 - (.3 if j else 0)
    place(whoosh(.55, 400, 7000, .7), t0, send=.15)
    place(tick(3600, .08), t0 + .35)
# Mosaic pull-back, quote, zoom into principles
place(whoosh(1.8, 150, 3500, .9), 57.8, send=.4)
place(impact(.7), 59.5, gain=.4, send=.6)
place(shimmer(2.0, .12), 59.9, send=.8)
place(riser(.9, 300, 4000), 61.1, gain=.8)
place(impact(.9), 62.0, gain=.7, send=.5)
# Principles
for k, t0 in enumerate((62.0, 64.5, 67.0, 69.5)):
    if k:
        place(whoosh(.5, 500, 6000, .5), t0 - .3)
        place(impact(.4), t0, gain=.3, send=.4)
place(whoosh(1.2, 2000, 300, .3), 62.2)                        # focus pull (clarity)
place(ping(76, .1), 63.4, send=.6)
for k in range(25):                                            # consistency: pieces snapping into place
    gx, gy = k // 5, k % 5
    place(tick(1500 + 180 * ((gx + gy) % 5), .05), 69.5 + .05 + (gx + gy) * .05 + .35, pan=(gx - 2) * .3)
# Process steps
for k in range(5):
    t0 = 73.8 + 1.6 * k
    place(ping([69, 72, 76, 79, 81][k], .14), t0 + .35, send=.55)
    place(swish(.3), t0 + .3)
for k in range(5):
    place(tick(2200 + 200 * k, .06), 72.9 + .18 * k)
place(riser(1.6, 200, 3600), 80.4, gain=.75)
# CTA: button pop, cursor, click, expansion, logo
place(tick(2500, .14), 83.6)
place(whoosh(.9, 600, 3000, .25), 84.1)                        # cursor travel
place(click(), 85.08, gain=1.0)
place(whoosh(.9, 200, 5000, 1.0), 85.55, send=.3)
place(impact(1.0), 86.4, gain=.85, send=.7)
place(shimmer(2.4, .15), 86.6, send=.9)
place(ping(81, .1), 87.95, send=.8)

# ── Mix & master ─────────────────────────────────────────────────────────
music_mask = np.ones(N)
dry += music * duck  # sidechain pump on the tonal instruments only

# Convolution reverb (stereo, 2.4 s decaying noise IR with early pre-delay)
ir_n = int(2.4 * SR)
irt = tt(ir_n)
ir = np.vstack([lp(rng.standard_normal(ir_n), 6000) * np.exp(-irt * 2.6), lp(rng.standard_normal(ir_n), 6000) * np.exp(-irt * 2.6)])
ir[:, :int(.02 * SR)] = 0
ir /= np.abs(ir).sum(axis=1, keepdims=True) ** .5 * 40
wet = np.vstack([fftconvolve(verb[0], ir[0])[:N], fftconvolve(verb[1], ir[1])[:N]])

mixbus = dry + wet * .9
# Pull everything right down for a breath just before the logo impact
gap = (np.arange(N) / SR)
mixbus *= np.where((gap > 7.86) & (gap < 8.0), .08, 1.0)
# Fade in / out
mixbus *= np.clip(gap / 1.0, 0, 1)
mixbus *= np.clip((DUR - gap) / 1.6, 0, 1)
# Gentle bus glue + soft clip, then normalise to -1 dBFS peak
mixbus = hp(mixbus, 28)
mixbus = np.tanh(mixbus / np.percentile(np.abs(mixbus), 99.7) * 1.1)
mixbus *= 10 ** (-1 / 20) / np.abs(mixbus).max()

pcm = (mixbus.T * 32767).astype(np.int16)
os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
out = os.path.join(ROOT, 'build', 'soundtrack.wav')
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('soundtrack ->', out, f'{len(pcm) / SR:.2f}s')
