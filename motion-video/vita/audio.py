"""Soft ambient bed + gentle plucks on scene changes for the 45 s Vita House film."""
import numpy as np, wave, os
SR = 44100; DUR = 45.0
n = int(SR * DUR); t = np.arange(n) / SR
out = np.zeros(n)
chords = [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]]
seg = 11.25
for ci, ch in enumerate(chords):
    a, b = ci * seg, (ci + 1) * seg + 1.5
    env = np.clip((t - a) / 2.5, 0, 1) * np.clip((b - t) / 2.5, 0, 1)
    for f in ch:
        out += env * (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.003 * t)) * .05
        out += env * np.sin(2 * np.pi * (f / 2) * t) * .03
out *= .8 + .2 * np.sin(2 * np.pi * t / 7.5)
def pluck(at, f, g=.18):
    i = int(at * SR); m = min(n - i, int(1.8 * SR)); x = np.arange(m) / SR
    s = (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * 2 * f * x) + .15 * np.sin(2 * np.pi * 3 * f * x)) * np.exp(-3.2 * x)
    out[i:i + m] += s * g * np.clip(x / .006, 0, 1)
for at, f in [(.3, 523.25), (4, 659.25), (12, 659.25), (25, 587.33), (35, 698.46), (40, 783.99)]:
    pluck(at, f)
for k, at in enumerate(np.arange(4.9, 11, .5)):
    pluck(at, [392.0, 493.88, 587.33, 659.25][k % 4] * .5, .05)
for k, at in enumerate(np.arange(13, 24.5, .5)):
    pluck(at, [329.63, 392.0, 493.88, 587.33][k % 4] * .5, .05)
for k, at in enumerate(np.arange(26, 34.5, .5)):
    pluck(at, [261.63, 329.63, 392.0, 523.25][k % 4] * .5, .05)
out *= np.clip(t / 1.0, 0, 1) * np.clip((DUR - t) / 2.0, 0, 1)
out = np.tanh(out * 1.6) * .75
d = (out * 32767).astype(np.int16)
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav'), 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
print('ok')
