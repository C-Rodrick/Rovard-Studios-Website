"""30 s score for the Northstar ad: 120 BPM pulse, warm pad, sub, risers into each cut, impacts on landings."""
import numpy as np, wave, os
SR = 44100; DUR = 30.0
n = int(SR * DUR); t = np.arange(n) / SR
L = np.zeros(n); Rt = np.zeros(n)
rng = np.random.default_rng(3)
CUTS = [4.3, 7.9, 13.9, 21.2, 25.7]
BEAT = 0.5

def add(at, sig, g=1.0, pan=0.0):
    i = int(at * SR); m = min(n - i, len(sig))
    if m <= 0: return
    L[i:i + m] += sig[:m] * g * (1 - pan) ; Rt[i:i + m] += sig[:m] * g * (1 + pan)

def env_ar(len_s, a, r):
    x = np.arange(int(len_s * SR)) / SR
    return np.clip(x / a, 0, 1) * np.exp(-x / r)

# pad: Dmaj9 -> Bm9 -> Gmaj7#11 -> A6/9 (one chord per section)
chords = [(0, 4.3, [146.83, 220.0, 277.18, 329.63]), (4.3, 13.9, [123.47, 185.0, 220.0, 277.18, 293.66]),
          (13.9, 21.2, [98.0, 146.83, 185.0, 220.0, 277.18]), (21.2, 25.7, [110.0, 164.81, 220.0, 246.94, 277.18]),
          (25.7, 30.0, [146.83, 220.0, 277.18, 329.63, 440.0])]
pad = np.zeros(n)
for a, b, ch in chords:
    e = np.clip((t - a + .3) / .8, 0, 1) * np.clip((b + .6 - t) / .8, 0, 1)
    for k, f in enumerate(ch):
        for d in (-0.003, 0.003):
            pad += e * np.sin(2 * np.pi * f * (1 + d) * t + k) * .028
pad *= .75 + .25 * np.sin(2 * np.pi * t / 4)
L += pad; Rt += pad
# sub bass on the root, eighth-note pump after the intro
roots = [(4.3, 13.9, 61.74), (13.9, 21.2, 49.0), (21.2, 25.7, 55.0), (25.7, 29.4, 73.42)]
for a, b, f in roots:
    for bt in np.arange(a, b, BEAT / 2):
        x = np.arange(int(BEAT / 2 * SR)) / SR
        s = np.sin(2 * np.pi * f * x) * np.clip(x / .01, 0, 1) * np.exp(-x / .18) * .22
        add(bt, s)
# kick on beats, clap on 2 & 4, hats on off-beats (from the headline on, drop out under the end card)
def kick():
    x = np.arange(int(.35 * SR)) / SR
    f = 45 + 110 * np.exp(-x / .04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .12) * .55
def hat():
    x = np.arange(int(.06 * SR)) / SR
    s = rng.standard_normal(len(x)); s = np.diff(s, prepend=0)
    return s * np.exp(-x / .015) * .05
def clap():
    x = np.arange(int(.18 * SR)) / SR
    s = rng.standard_normal(len(x)); return s * np.exp(-x / .05) * .09
K, Hh, C = kick(), hat(), clap()
for i, bt in enumerate(np.arange(4.3, 28.3, BEAT)):
    if 25.2 < bt < 25.7: continue
    add(bt, K)
    add(bt + BEAT / 2, Hh, 1, .3 if i % 2 else -.3)
    if i % 2: add(bt, C, 1, .1)
# risers into cuts
for c in CUTS:
    dur = 1.1; x = np.arange(int(dur * SR)) / SR
    noise = rng.standard_normal(len(x))
    k = (x / dur) ** 2
    b = np.convolve(noise, np.ones(6) / 6, 'same')
    s = (noise - b) * k * .09 + np.sin(2 * np.pi * (300 + 900 * k) * x) * k * .025
    add(c - dur, s, 1, -.2); add(c - dur, s, 1, .2)
# impacts: logo landing, each cut, end card
def impact(g=1.0):
    x = np.arange(int(2.2 * SR)) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-x / .08)) * x) * np.exp(-x / .5)
    air = rng.standard_normal(len(x)) * np.exp(-x / .25) * .15
    return (boom * .7 + air) * g
for at, g in [(1.9, .8)] + [(c, .5) for c in CUTS] + [(26.6, .7)]:
    add(at, impact(g))
# bell motif on landings and the CTA
def bell(f):
    x = np.arange(int(2.5 * SR)) / SR
    return (np.sin(2 * np.pi * f * x) + .5 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / .3)) * np.exp(-x / .9) * .12
for at, f in [(1.95, 880), (2.4, 1108.7), (26.65, 880), (27.1, 1108.7), (27.55, 1318.5)]:
    add(at, bell(f), 1, .2)
# whoosh under each carousel step
for ts in [15.8, 17.45, 19.1]:
    x = np.arange(int(.8 * SR)) / SR; s = rng.standard_normal(len(x)); s = np.convolve(s, np.ones(30) / 30, 'same')
    add(ts, s * np.sin(np.pi * x / .8) * .35)
mast = np.clip(t / .3, 0, 1) * np.clip((DUR - t) / 1.2, 0, 1)
out = np.stack([L, Rt], 1) * mast[:, None]
out = np.tanh(out * 1.5) * .8
d = (out * 32767).astype(np.int16)
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'), 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
print('ok', np.abs(out).max())
