// Five-step project enquiry. It is one real <form> posting to Formspree: without JS every step shows at once and
// a normal POST still works. With JS it becomes steps with validation, Back/Continue and a confirmation state.
import gsap from 'gsap';
import { $, $$, DUR, EASE, L, REDUCED } from './config.js';
import { scrollToEl } from './scroll.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEGACY = { brand: 'branding', design: 'graphic', social: 'graphic', print: 'graphic', docs: 'graphic', packaging: 'graphic', ads: 'campaign', vehicle: 'graphic', media: 'video', unsure: 'else' };

export function initForm() {
  const form = $('#start-form');
  if (!form) return;
  const shell = form.parentElement;
  const steps = $$('[data-step]', form), progress = $$('[data-progress] li', shell), bar = $('[data-progress-bar]', shell), label = $('[data-count]', shell);
  const back = $('[data-back]', form), next = $('[data-next]', form), submit = $('[data-submit]', form), err = $('.form-error', form);
  let cur = 0;
  form.classList.add('is-stepped');
  form.noValidate = true;

  const fieldError = (field, msg) => {
    const wrap = field.closest('.f, fieldset'), box = wrap && $('.f-err', wrap);
    if (box) box.textContent = msg || '';
    if (wrap) wrap.classList.toggle('bad', !!msg);
    if (field.type !== 'checkbox') { if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
  };
  const checks = [
    () => {
      const boxes = $$('input[name="need"]', form), ok = boxes.some((b) => b.checked);
      fieldError(boxes[0], ok ? '' : L('Choose at least one. "Something else" is fine.', 'Choisissez-en au moins un. « Autre chose » convient très bien.'));
      return ok ? null : boxes[0];
    },
    () => {
      const ok = form.idea.value.trim().length >= 3;
      fieldError(form.idea, ok ? '' : L('A sentence is plenty. What are you working on?', 'Une phrase suffit. Sur quoi travaillez-vous ?'));
      return ok ? null : form.idea;
    },
    () => null,
    () => null,
    () => {
      const name = form.elements.name, email = form.email;
      const a = name.value.trim() ? '' : L('Please tell us your name.', 'Veuillez nous indiquer votre nom.');
      const b = EMAIL.test(email.value.trim()) ? '' : L('Please check your email address.', 'Veuillez vérifier votre adresse courriel.');
      fieldError(name, a); fieldError(email, b);
      return a ? name : b ? email : null;
    },
  ];

  const render = (focus) => {
    steps.forEach((s, i) => { s.hidden = i !== cur; });
    back.hidden = cur === 0; next.hidden = cur === steps.length - 1; submit.hidden = cur !== steps.length - 1;
    progress.forEach((li, i) => {
      li.classList.toggle('done', i < cur); li.classList.toggle('now', i === cur);
      if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (bar) bar.style.transform = `scaleX(${(cur + 1) / steps.length})`;
    if (label) label.textContent = L(`Step ${cur + 1} of ${steps.length}`, `Étape ${cur + 1} sur ${steps.length}`);
    err.textContent = '';
    if (focus) {
      const s = steps[cur], h = $('[data-step-title]', s);
      if (!REDUCED) gsap.fromTo(s, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: DUR.base, ease: EASE.out, clearProps: 'transform,opacity' });
      h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
      if (shell.getBoundingClientRect().top < 40) scrollToEl(shell);
    }
  };
  const go = (n) => { cur = n; render(true); };

  next.addEventListener('click', () => {
    const bad = checks[cur]();
    if (bad) { bad.focus(); return; }
    go(cur + 1);
  });
  back.addEventListener('click', () => go(cur - 1));
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < steps.length - 1) { e.preventDefault(); next.click(); }
  });
  $$('input,textarea', form).forEach((f) => f.addEventListener('input', () => { if (f.closest('.bad')) fieldError(f, ''); }));

  // Deep links from services and pricing: /start/?need=website or /start/?package=brand
  const qs = new URLSearchParams(location.search);
  const tick = (v) => { const b = form.querySelector(`input[name="need"][value="${CSS.escape(LEGACY[v] || v)}"]`); if (b) b.checked = true; };
  (qs.get('need') || '').split(',').filter(Boolean).forEach(tick);
  const syncPackage = () => {
    const o = form.package.selectedOptions[0];
    if (o && o.dataset.pk) { tick(o.dataset.need); if (o.dataset.budget && !form.budget.value) form.budget.value = o.dataset.budget; }
  };
  form.package.addEventListener('change', syncPackage);
  const pk = qs.get('package') && form.querySelector(`#f-package option[data-pk="${CSS.escape(qs.get('package'))}"]`);
  if (pk) { form.package.value = pk.value; syncPackage(); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cur < steps.length - 1) { next.click(); return; }
    for (let i = 0; i < checks.length; i++) {
      const bad = checks[i]();
      if (bad) { if (cur !== i) { cur = i; render(false); } bad.focus(); return; }
    }
    err.textContent = '';
    const text = submit.querySelector('span'), idle = text.textContent;
    submit.disabled = true; text.textContent = L('Sending...', 'Envoi en cours...');
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      form.hidden = true;
      $$('[data-form-head]', shell).forEach((h) => { h.hidden = true; });
      const done = $('.form-done');
      done.hidden = false;
      const h = $('h2', done); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
      scrollToEl(done);
    } catch {
      err.innerHTML = L('That did not send. Please try again, or email us at ', "L'envoi a échoué. Veuillez réessayer, ou écrivez-nous à ") + '<a href="mailto:hello@rovardstudio.com">hello@rovardstudio.com</a>.';
      submit.disabled = false; text.textContent = idle;
    }
  });
  render(false);
}
