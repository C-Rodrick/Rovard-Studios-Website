// Study 03, Ink Type: the word is sampled from a real font render into squares that remember where they belong.
export default function particles(stage, { still, root }) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  stage.appendChild(c);
  const word = root.dataset.word || 'IDEAS';
  let pts = [], raf = 0, mx = -1e4, my = -1e4, W = 0, H = 0, d = 1;
  const build = () => {
    d = Math.min(devicePixelRatio, 1.5); W = stage.clientWidth; H = stage.clientHeight;
    c.width = W * d; c.height = H * d;
    const o = document.createElement('canvas'); o.width = W; o.height = H;
    const g = o.getContext('2d', { willReadFrequently: true });
    let fs = H * 0.6;
    g.font = `800 ${fs}px Syne, sans-serif`;
    fs = Math.min(fs, fs * (W * 0.86) / g.measureText(word).width);
    g.font = `800 ${fs}px Syne, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(word, W / 2, H / 2);
    const data = g.getImageData(0, 0, W, H).data, step = W < 700 ? 5 : 6;
    pts = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push({ hx: x, hy: y, x: still ? x : Math.random() * W, y: still ? y : Math.random() * H, vx: 0, vy: 0, y2: Math.random() > 0.97 });
    }
  };
  const draw = () => {
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const blue = [], yellow = [];
    for (const p of pts) {
      const dx = p.x - mx, dy = p.y - my, r2 = dx * dx + dy * dy;
      if (r2 < 9000) { const f = (9000 - r2) / 9000; p.vx += (dx / 40) * f; p.vy += (dy / 40) * f; }
      p.vx += (p.hx - p.x) * 0.045; p.vy += (p.hy - p.y) * 0.045;
      p.vx *= 0.82; p.vy *= 0.82; p.x += p.vx; p.y += p.vy;
      (p.y2 ? yellow : blue).push(p);
    }
    ctx.fillStyle = '#F7F6F2'; for (const p of blue) ctx.fillRect(p.x, p.y, 3.4, 3.4);
    ctx.fillStyle = '#FFD83D'; for (const p of yellow) ctx.fillRect(p.x, p.y, 3.4, 3.4);
  };
  const loop = () => { raf = requestAnimationFrame(loop); draw(); };
  stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  stage.addEventListener('pointerleave', () => { mx = my = -1e4; });
  addEventListener('resize', () => { build(); draw(); }, { passive: true });
  build(); draw();
  return { start() { if (!raf && !still) raf = requestAnimationFrame(loop); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
}
