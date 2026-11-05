// Header state, full-screen menu and back-to-top.
export function initNav() {
  const top = document.querySelector('[data-top]');
  if (top) {
    const onScroll = () => top.classList.toggle('is-solid', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const menu = document.getElementById('menu');
  const openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const close = () => {
      if (!menu.open) return;
      if (reduced) { menu.close(); return; }
      menu.classList.add('is-closing');
      setTimeout(() => { menu.classList.remove('is-closing'); menu.close(); }, 160);
    };
    openBtn.addEventListener('click', () => { menu.showModal(); openBtn.setAttribute('aria-expanded', 'true'); });
    menu.querySelector('[data-menu-close]').addEventListener('click', close);
    // <dialog> traps focus and returns it to the button on close. Escape is handled here so it animates too.
    menu.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    menu.addEventListener('close', () => openBtn.setAttribute('aria-expanded', 'false'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.close(); });
    // A rotated phone or a wider window should not leave the phone menu open.
    matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches && menu.open) menu.close(); });
  }

  const toTop = document.querySelector('[data-totop]');
  if (toTop) {
    toTop.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      const home = document.querySelector('.top-logo');
      if (home) home.focus({ preventScroll: true });
    });
  }
}
