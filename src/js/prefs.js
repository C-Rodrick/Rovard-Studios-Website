// The "pause motion" control (WCAG 2.2.2): stops looping movement site-wide and remembers the choice.
import { $$, html, L } from './config.js';

const KEY = 'rv-motion';
const read = () => { try { return localStorage.getItem(KEY) === 'off'; } catch { return false; } };
const listeners = new Set();
let paused = read();

export const isPaused = () => paused;
export const onPause = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function apply() {
  html.classList.toggle('motion-off', paused);
  $$('[data-motion-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(paused));
    b.querySelector('span').textContent = paused ? L('Play motion', 'Lancer le mouvement') : L('Pause motion', 'Mettre en pause');
  });
  listeners.forEach((fn) => fn(paused));
}

export function initPrefs() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-motion-toggle]')) return;
    paused = !paused;
    try { localStorage.setItem(KEY, paused ? 'off' : 'on'); } catch { /* private mode */ }
    apply();
  });
  apply();
}
