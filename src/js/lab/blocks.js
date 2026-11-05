// Study 05, Block System: the logo's R rebuilt from a grid of its own square. Each cell tilts towards the pointer.
const R = 'M60.24 130V40.4H96.464C102.011 40.4 106.875 41.3813 111.056 43.344C115.323 45.2213 118.651 47.952 121.04 51.536C123.429 55.0347 124.624 59.2587 124.624 64.208V65.616C124.624 71.504 123.216 76.1547 120.4 79.568C117.584 82.9813 114.256 85.2853 110.416 86.48V88.272C113.488 88.3573 116.005 89.3813 117.968 91.344C120.016 93.2213 121.04 96.08 121.04 99.92V130H110.416V101.2C110.416 98.64 109.691 96.6773 108.24 95.312C106.875 93.9467 104.784 93.264 101.968 93.264H70.992V130H60.24ZM70.992 83.536H95.44C101.328 83.536 105.851 82.128 109.008 79.312C112.251 76.4107 113.872 72.4 113.872 67.28V66.384C113.872 61.264 112.293 57.296 109.136 54.48C105.979 51.5787 101.413 50.128 95.44 50.128H70.992V83.536Z';

export default function blocks(stage, { still }) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  stage.appendChild(c);
  let cells = [], W = 0, H = 0, d = 1, raf = 0, mx = -1e4, my = -1e4, t = 0;
  const build = () => {
    d = Math.min(devicePixelRatio, 1.5); W = stage.clientWidth; H = stage.clientHeight; c.width = W * d; c.height = H * d;
    const size = Math.min(W, H) * 0.92, k = size / 171, ox = (W - 181 * k) / 2, oy = (H - 171 * k) / 2, cell = Math.max(9, size / 44);
    const test = document.createElement('canvas').getContext('2d'), path = new Path2D(R);
    cells = [];
    for (let y = oy; y < oy + 171 * k; y += cell) for (let x = ox; x < ox + 181 * k; x += cell) {
      const u = (x + cell / 2 - ox) / k, v = (y + cell / 2 - oy) / k;
      cells.push({ x: x + cell / 2, y: y + cell / 2, s: cell, inR: test.isPointInPath(path, u, v, 'evenodd') });
    }
  };
  const draw = () => {
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    for (const q of cells) {
      const dist = Math.hypot(q.x - mx, q.y - my), f = Math.max(0, 1 - dist / 210), wave = still ? 0 : Math.sin(t + (q.x + q.y) * 0.012) * 0.07;
      const s = q.s * (q.inR ? 0.94 - f * 0.45 : 0.22 + f * 0.7 + wave);
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(f * 1.57 + (q.inR ? 0 : wave));
      ctx.fillStyle = q.inR ? (f > 0.55 ? '#FFD83D' : '#F7F6F2') : (f > 0.25 ? '#245BFF' : '#162DAF');
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    }
  };
  const loop = () => { raf = requestAnimationFrame(loop); t += 0.02; draw(); };
  stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  stage.addEventListener('pointerleave', () => { mx = my = -1e4; });
  addEventListener('resize', () => { build(); draw(); }, { passive: true });
  build(); draw();
  return { start() { if (!raf && !still) raf = requestAnimationFrame(loop); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
}
