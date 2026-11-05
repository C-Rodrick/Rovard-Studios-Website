// The five-step project form and the short contact form.
// Without JavaScript both are ordinary forms that post directly. With it, nothing claims success until the endpoint confirms it.
const fr = document.documentElement.lang === 'fr';
const L = (en, f) => (fr ? f : en);
const EMAIL = 'hello@rovardstudio.com';
const mail = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;

function errorFor(input) {
  const v = input.value.trim();
  if (input.required && !v) {
    if (input.type === 'email') return L('Please enter your email address, so we can reply.', 'Veuillez indiquer votre adresse courriel, pour que nous puissions répondre.');
    if (input.tagName === 'SELECT') return L('Please choose one.', 'Veuillez en choisir un.');
    if (input.name === 'name') return L('Please tell us your name.', 'Veuillez indiquer votre nom.');
    return L('Please write a few words here. Rough is fine.', 'Écrivez quelques mots ici. Même approximatifs.');
  }
  if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return L('That email address looks incomplete. It should look like name@example.com.', 'Cette adresse semble incomplète. Elle devrait ressembler à nom@exemple.com.');
  }
  return '';
}

function setError(input, msg) {
  const box = document.getElementById(`${input.id}-e`);
  if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  if (box) { box.textContent = msg; box.hidden = !msg; }
}

function validate(scope) {
  let first = null;
  for (const input of scope.querySelectorAll('input[required], select[required], textarea[required]')) {
    const msg = errorFor(input);
    setError(input, msg);
    if (msg && !first) first = input;
  }
  if (first) first.focus();
  return !first;
}

function liveValidation(form) {
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) setError(e.target, errorFor(e.target)); });
  form.addEventListener('focusout', (e) => { if (e.target.required && e.target.value.trim()) setError(e.target, errorFor(e.target)); });
}

// One send at a time. The endpoint's answer decides what the visitor sees.
function submitter(form) {
  const btn = form.querySelector('[data-submit]');
  const errBox = form.querySelector('[data-form-error]');
  const done = form.parentElement.querySelector('[data-form-done]');
  const label = btn.querySelector('span');
  const idle = label.textContent;
  let sending = false, sent = false;
  return async () => {
    if (sending || sent) return;
    sending = true;
    btn.disabled = true;
    label.textContent = L('Sending…', 'Envoi…');
    errBox.hidden = true;
    let ok = false;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      ok = res.ok;
    } catch (e) { ok = false; }
    sending = false;
    if (ok) {
      sent = true;
      form.hidden = true;
      done.hidden = false;
      done.focus();
      if (done.scrollIntoView) done.scrollIntoView({ block: 'center' });
    } else {
      btn.disabled = false;
      label.textContent = idle;
      errBox.innerHTML = L(`We couldn't send that, and nothing has been lost. Please try again, or email us at ${mail}.`, `L'envoi n'a pas abouti, et rien n'est perdu. Veuillez réessayer, ou écrivez-nous à ${mail}.`);
      errBox.hidden = false;
      errBox.focus && errBox.focus();
    }
  };
}

function initSteps(form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const prog = [...document.querySelectorAll('[data-prog]')];
  const status = form.querySelector('[data-step-status]');
  const review = form.querySelector('[data-review]');
  let at = 0;

  const params = new URLSearchParams(location.search);
  const type = form.elements.project_type;
  const pack = form.elements.package;
  if (params.get('need') && [...type.options].some((o) => o.value === params.get('need'))) type.value = params.get('need');
  if (params.get('package') && [...pack.options].some((o) => o.value === params.get('package'))) pack.value = params.get('package');

  const go = (n, focus = true) => {
    at = n;
    steps.forEach((s, i) => s.classList.toggle('is-now', i === n));
    prog.forEach((p, i) => { p.classList.toggle('is-now', i === n); p.classList.toggle('is-done', i < n); });
    status.textContent = L(`Step ${n + 1} of ${steps.length}`, `Étape ${n + 1} sur ${steps.length}`);
    if (n === steps.length - 1) buildReview();
    if (focus) {
      const legend = steps[n].querySelector('legend');
      legend.tabIndex = -1;
      legend.focus({ preventScroll: true });
      const y = form.getBoundingClientRect().top + scrollY - 110;
      if (scrollY > y) scrollTo({ top: y });
    }
  };

  const value = (name) => {
    const el = form.elements[name];
    if (!el) return '';
    if (el.tagName === 'SELECT') return el.value ? el.options[el.selectedIndex].text : '';
    return (el.value || '').trim();
  };

  function buildReview() {
    const rows = [
      [L('Name', 'Nom'), value('name'), 0], [L('Email', 'Courriel'), value('email'), 0],
      [L('Company or organization', 'Entreprise ou organisation'), value('company'), 0], [L('Location', 'Lieu'), value('location'), 0],
      [L('Project type', 'Type de projet'), value('project_type'), 1], [L('About the project', 'À propos du projet'), value('description'), 1], [L('Objectives', 'Objectifs'), value('objectives'), 1],
      [L('Services', 'Services'), [...form.querySelectorAll('[name="services"]:checked')].map((c) => c.closest('label').querySelector('b').textContent).join(', '), 2],
      [L('Package', 'Forfait'), value('package'), 3], [L('Budget', 'Budget'), value('budget'), 3], [L('Timeline', 'Échéancier'), value('timeline'), 3], [L('Anything else', 'Autre chose'), value('additional'), 3],
    ].filter((r) => r[1]);
    review.textContent = '';
    const dl = document.createElement('dl');
    for (const [k, v, step] of rows) {
      const row = document.createElement('div'); row.className = 'rv-row';
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      const b = document.createElement('button'); b.type = 'button'; b.textContent = L('Edit', 'Modifier');
      b.setAttribute('aria-label', `${L('Edit', 'Modifier')}: ${k}`);
      b.addEventListener('click', () => go(step));
      row.append(dt, dd, b);
      dl.append(row);
    }
    review.append(dl);
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { if (validate(steps[at])) go(at + 1); }
    if (e.target.closest('[data-back]')) go(at - 1);
  });
  // Enter in a text field moves on instead of submitting early.
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && at < steps.length - 1) {
      e.preventDefault();
      if (validate(steps[at])) go(at + 1);
    }
  });

  const send = submitter(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (at < steps.length - 1) return;
    for (let i = 0; i < steps.length - 1; i++) {
      for (const input of steps[i].querySelectorAll('[required]')) {
        if (errorFor(input)) { go(i, false); validate(steps[i]); return; }
      }
    }
    send();
  });

  liveValidation(form);
  go(0, false);
}

function initSimple(form) {
  liveValidation(form);
  const send = submitter(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validate(form)) send();
  });
}

export function initForms() {
  const steps = document.querySelector('form[data-steps]');
  if (steps) initSteps(steps);
  const simple = document.querySelector('form[data-simple]');
  if (simple) initSimple(simple);
}
