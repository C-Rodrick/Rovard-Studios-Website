// Study 04, Weight: Syne's variable axis as an instrument. No canvas. Press and sweep, or use the slider.
export default function weight(stage, { root }) {
  const word = stage.querySelector('[data-weight-word]'), slider = root.querySelector('[data-weight-slider]'), out = root.querySelector('[data-weight-out]');
  const letters = [...word.textContent.trim()];
  word.setAttribute('aria-label', word.textContent.trim());
  word.innerHTML = letters.map((l) => `<span aria-hidden="true">${l}</span>`).join('');
  const spans = [...word.children];
  let px = null, raf = 0, phase = 0;
  const paint = (fn) => spans.forEach((s, i) => { s.style.fontWeight = Math.round(fn(i)); });
  const base = () => +(slider?.value || 600);
  const loop = () => {
    raf = requestAnimationFrame(loop);
    phase += 0.012;
    if (px !== null) {
      paint((i) => { const r = spans[i].getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - px); return 400 + 400 * Math.max(0, 1 - d / 240); });
    } else paint((i) => base() + 100 * Math.sin(phase * 2 + i * 0.7));
  };
  stage.addEventListener('pointermove', (e) => { px = e.clientX; }, { passive: true });
  stage.addEventListener('pointerleave', () => { px = null; });
  if (slider) slider.addEventListener('input', () => { if (out) out.textContent = slider.value; paint(() => base()); });
  paint(() => base());
  return { start() { if (!raf) raf = requestAnimationFrame(loop); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
}
