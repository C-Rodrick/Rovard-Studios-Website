// Work filters and the image viewer.
const fr = document.documentElement.lang === 'fr';

// A repeating exhibition rhythm, applied to whichever projects are visible.
const SLOTS = [
  ['1 / span 8', '0'], ['9 / -1', 'clamp(40px, 10vw, 180px)'],
  ['2 / span 5', '0'], ['7 / -1', 'clamp(30px, 6vw, 110px)'],
  ['1 / span 6', '0'], ['8 / span 5', 'clamp(40px, 8vw, 150px)'],
  ['3 / span 8', '0'],
];

export function initWork() {
  const wall = document.querySelector('[data-wall]');
  if (!wall) return;
  const items = [...wall.querySelectorAll('.wk')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const status = document.querySelector('[data-filter-status]');

  const layout = () => {
    let i = 0;
    for (const el of items) {
      if (el.hidden) continue;
      const [c, mt] = SLOTS[i++ % SLOTS.length];
      el.style.setProperty('--c', c);
      el.style.setProperty('--mt', mt);
    }
  };

  const apply = (key, push) => {
    let n = 0;
    for (const el of items) {
      const show = key === 'all' || (key === 'concept' ? el.dataset.concept === '1' : el.dataset.kind === key);
      el.hidden = !show;
      if (show) n++;
    }
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.filter === key));
    layout();
    if (status) status.textContent = fr ? `${n} projets affichés` : `${n} projects shown`;
    if (push) {
      const url = new URL(location.href);
      if (key === 'all') url.searchParams.delete('c'); else url.searchParams.set('c', key);
      history.replaceState(null, '', url);
    }
    dispatchEvent(new Event('oa:layout'));
  };

  for (const b of buttons) b.addEventListener('click', () => apply(b.dataset.filter, true));
  const initial = new URLSearchParams(location.search).get('c');
  apply(buttons.some((b) => b.dataset.filter === initial) ? initial : 'all', false);
}

export function initLightbox() {
  const box = document.querySelector('dialog.lb');
  const items = [...document.querySelectorAll('[data-lb]')];
  if (!box || !items.length) return;
  const img = box.querySelector('img');
  const count = box.querySelector('[data-lb-count]');
  let at = 0;
  const show = (i) => {
    at = (i + items.length) % items.length;
    img.src = items[at].dataset.lb;
    img.alt = items[at].querySelector('img').alt;
    count.textContent = `${at + 1} / ${items.length}`;
  };
  items.forEach((b, i) => b.addEventListener('click', () => { show(i); box.showModal(); }));
  box.querySelector('[data-lb-close]').addEventListener('click', () => box.close());
  box.querySelector('[data-lb-prev]').addEventListener('click', () => show(at - 1));
  box.querySelector('[data-lb-next]').addEventListener('click', () => show(at + 1));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
}
