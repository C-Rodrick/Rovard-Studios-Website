/* ==========================================================================
   VITA HOUSE — booking flow (6 steps)
   Query params (used by deep links and by the case-study frames):
     service, provider (id | any), location (id | virtual), date (YYYY-MM-DD | +N), time (HH:MM), step (1-6)
     state=errors | empty | taken  → demonstrates the error / empty / slot-conflict states
   ========================================================================== */
(function () {
  'use strict';
  const $ = VH.$, $$ = VH.$$, P = VH.params;
  VH.shell({ active: 'book.html' });
  $$('[data-icon-li]').forEach(li => li.insertAdjacentHTML('afterbegin', VH.icon(li.dataset.iconLi)));

  const STEPS = ['Service', 'Provider', 'Location', 'Date & time', 'Your details', 'Confirmed'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const K = VH.fmt.key;
  const rel = v => /^\+\d+$/.test(v || '') ? K(VH.fmt.plus(today, +v)) : v;

  const S = {
    step: 1, service: '', provider: '', loc: '', date: '', time: '', slotProvider: '', week: new Date(today),
    blocked: null, taken: false, simTaken: P.get('state') === 'taken', force: P.has('force'),
    showAll: false, errs: {}, summary: [], done: null,
    info: { type: 'new', first: '', last: '', dob: '', email: '', phone: '', cover: 'insured', insurer: '', memberId: '', reason: '', sms: true, consent: false }
  };

  /* ---------- initial state from URL ---------- */
  const pSvc = P.get('service'), pPrv = P.get('provider'), pLoc = P.get('location');
  if (pSvc && VH.svc(pSvc)) S.service = pSvc;
  if (pPrv === 'any' || (pPrv && VH.prov(pPrv))) S.provider = pPrv;
  if (pLoc && VH.loc(pLoc)) S.loc = pLoc;
  if (P.get('date')) S.date = rel(P.get('date'));
  if (P.get('time')) S.time = P.get('time');
  if (S.date) { S.week = VH.fmt.parse(S.date); if (S.week < today) S.week = new Date(today); }
  if (P.get('state') === 'empty') { let d = new Date(today); while (d.getDay() !== 0) d = VH.fmt.plus(d, 1); S.date = K(d); S.week = d; S.time = ''; }
  if (S.provider && S.provider !== 'any' && S.service && !VH.prov(S.provider).services.includes(S.service)) S.provider = '';

  const eligible = () => VH.providers.filter(p => !S.service || p.services.includes(S.service));
  const videoOK = () => !S.service || /video/i.test(VH.svc(S.service).mode);
  const specific = () => S.provider && S.provider !== 'any' ? VH.prov(S.provider) : null;
  const locationsFor = () => { const ps = specific() ? [specific()] : eligible(); const ids = new Set(ps.flatMap(p => p.locations)); return VH.locations.filter(l => ids.has(l.id)); };

  function firstIncomplete() {
    if (!S.service) return 1; if (!S.provider) return 2; if (!S.loc) return 3; if (!S.date || !S.time) return 4; return 5;
  }
  S.step = P.get('step') ? Math.min(6, Math.max(1, +P.get('step'))) : firstIncomplete();
  if (S.step > 1 && S.step < 6 && S.step > firstIncomplete()) S.step = firstIncomplete();
  if (S.step === 6) { S.step = 5; }               // never start on the confirmation without a booking
  if (P.get('step') === '6') S.preview = true;

  /* ---------- availability ---------- */
  function slotsFor(key) {
    const mode = S.loc === 'virtual' ? 'video' : 'in-person';
    const provs = specific() ? [specific()] : eligible().filter(p => S.loc === 'virtual' || !S.loc || p.locations.includes(S.loc));
    const map = new Map();
    provs.forEach(p => { if (!p.accepting) return; VH.slots(p.id, key, mode).forEach(t => { if (S.blocked && S.blocked.date === key && S.blocked.time === t) return; if (!map.has(t)) map.set(t, p.id); }); });
    if (S.force && key === S.date && S.time && !map.has(S.time) && provs[0]) map.set(S.time, provs[0].id);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([time, pid]) => ({ time, pid }));
  }
  function nextOpen(after) {
    for (let i = 0; i < 28; i++) { const k = K(VH.fmt.plus(after || today, i)); const s = slotsFor(k); if (s.length) return { date: k, time: s[0].time }; }
    return null;
  }
  const nextFor = p => VH.nextAvail(p.id, S.loc === 'virtual' || (!S.loc && p.locations[0] === 'virtual') ? 'video' : 'in-person');

  /* ---------- rendering ---------- */
  const tick = `<span class="tick">${VH.icon('check')}</span>`;
  const announce = m => { $('#announce').textContent = ''; setTimeout(() => $('#announce').textContent = m, 30); };

  function renderStepper() {
    $('#stepper').innerHTML = STEPS.map((n, i) => {
      const k = i + 1, cls = k < S.step ? 'done' : k === S.step ? 'current' : '';
      return `<li class="${cls}"><button type="button" data-go="${k}" ${k < S.step && S.step < 6 ? '' : 'disabled tabindex="-1"'} ${k === S.step ? 'aria-current="step"' : ''}><span class="bar"></span><span class="lbl"><span class="n">Step ${k}</span>${n}${k < S.step ? '<span class="sr-only"> (completed)</span>' : ''}</span></button></li>`;
    }).join('');
    $('#stepMobile').innerHTML = `<div class="meta"><span>${STEPS[S.step - 1]}</span><span>Step ${S.step} of 6</span></div><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${S.step}" aria-label="Booking progress"><i style="width:${S.step / 6 * 100}%"></i></div>`;
  }

  function renderSummary() {
    const s = S.service && VH.svc(S.service), p = S.done ? VH.prov(S.done.providerId) : (S.slotProvider && S.provider === 'any' ? VH.prov(S.slotProvider) : specific());
    const l = S.loc && VH.loc(S.loc);
    const row = (icon, label, val, step) => `<div class="row-s"><span class="icon-chip">${VH.icon(icon)}</span><div><dt>${label}</dt><dd class="${val ? '' : 'empty-v'}">${val || 'Not chosen yet'}</dd></div>${val && step && S.step < 6 && step < S.step ? `<button class="edit" type="button" data-go="${step}">Edit<span class="sr-only"> ${label.toLowerCase()}</span></button>` : '<span></span>'}</div>`;
    const when = S.date && S.time ? `${VH.fmt.date(S.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${VH.fmt.time(S.time)}` : '';
    const prov = S.provider === 'any' && !S.slotProvider ? 'First available provider' : p ? `${p.name}, ${p.creds}` : '';
    $('#summary').innerHTML = `<details ${matchMedia('(min-width:1021px)').matches || S.openSummary ? 'open' : ''}><summary><h2>Your visit</h2>${VH.icon('chev-down')}</summary>
      <dl style="margin-top:1.1rem">${row('stethoscope', 'Service', s && s.name, 1)}${row('user', 'Provider', prov, 2)}${row(l && l.virtual ? 'video' : 'pin', 'Location', l && (l.virtual ? 'Video visit' : `${l.name}`), 3)}${row('calendar', 'Date & time', when, 4)}</dl>
      <div class="promise-s" style="margin-top:1.1rem"><span>${VH.icon('check-circle')}Free to change or cancel up to 24 hours before</span><span>${VH.icon('shield')}Insurance accepted at every location</span></div></details>`;
    const d = $('#summary details'); d.addEventListener('toggle', () => S.openSummary = d.open);
  }

  /* — Step 1 — */
  function step1() {
    const pv = specific();
    const list = VH.services.filter(s => S.showAll || !pv || pv.services.includes(s.id));
    return `<h2 id="stepH" tabindex="-1">What would you like to book?</h2><p class="sub">Choose the closest match. Not sure? <a href="services.html#choose">Our service helper</a> can point you in the right direction.</p>
      ${pv ? `<div class="opt-note"><span>Showing visits with <b>${pv.name}</b>.</span><button class="btn btn-text" type="button" data-showall>${S.showAll ? 'Show only ' + pv.short + '’s services' : 'Show all services'}</button></div>` : ''}
      ${errBox(1)}
      <fieldset class="fieldset"><legend class="sr-only">Service</legend><div class="opts">${list.map(s => `<label class="choice"><input type="radio" name="service" value="${s.id}" ${S.service === s.id ? 'checked' : ''}><span class="icon-chip">${VH.icon(s.icon, 'icon-lg')}</span><span class="ct"><b>${s.name}</b><span>${s.mins} · ${s.mode}</span></span>${tick}</label>`).join('')}</div></fieldset>`;
  }
  /* — Step 2 — */
  function step2() {
    const el = eligible(), soon = el.filter(p => p.accepting).map(p => nextFor(p)).filter(Boolean).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    return `<h2 id="stepH" tabindex="-1">Who would you like to see?</h2><p class="sub">Every clinician below covers <b>${VH.svc(S.service).name.toLowerCase()}</b>. Times shown are the next opening.</p>${errBox(2)}
      <fieldset class="fieldset"><legend class="sr-only">Provider</legend><div class="opts one">
        <label class="choice"><input type="radio" name="provider" value="any" ${S.provider === 'any' ? 'checked' : ''}><span class="icon-chip dark" style="width:4rem;height:4rem;border-radius:50%">${VH.icon('sparkle', 'icon-lg')}</span><span class="ct"><b>Any available provider</b><span>We'll match you with the soonest opening that suits you.</span>${soon ? `<span class="meta"><b>Next: ${VH.fmt.rel(soon.date)}, ${VH.fmt.time(soon.time)}</b></span>` : ''}</span>${tick}</label>
        ${el.map(p => { const n = nextFor(p); return `<label class="choice ${p.accepting ? '' : 'is-disabled'}"><input type="radio" name="provider" value="${p.id}" ${S.provider === p.id ? 'checked' : ''} ${p.accepting ? '' : 'disabled'}><span class="avatar lg">${VH.portrait({ ...p.look, shape: 'circle', alt: '' })}</span><span class="ct"><b>${p.name}, ${p.creds}</b><span>${p.role}</span><span class="meta"><span>${p.langs.join(', ')}</span>${p.accepting ? (n ? `<b>Next: ${n.label}</b>` : '') : '<span>Not accepting new patients right now</span>'}</span></span>${p.accepting ? tick : '<span class="badge badge-warn">Waitlist</span>'}</label>`; }).join('')}
      </div></fieldset>`;
  }
  /* — Step 3 — */
  function step3() {
    const locs = locationsFor();
    return `<h2 id="stepH" tabindex="-1">Where would you like to be seen?</h2><p class="sub">Visit a Vita House in person${videoOK() ? ' or join by video from wherever you are' : ''}.</p>${errBox(3)}
      <fieldset class="fieldset"><legend class="sr-only">Location</legend><div class="opts">
        ${videoOK() ? `<label class="choice"><input type="radio" name="loc" value="virtual" ${S.loc === 'virtual' ? 'checked' : ''}><span class="icon-chip clay">${VH.icon('video', 'icon-lg')}</span><span class="ct"><b>Video visit</b><span>Join securely from your phone or computer. Evening times available.</span></span>${tick}</label>` : ''}
        ${locs.map(l => `<label class="choice"><input type="radio" name="loc" value="${l.id}" ${S.loc === l.id ? 'checked' : ''}><span class="icon-chip">${VH.icon('pin', 'icon-lg')}</span><span class="ct"><b>${l.name}</b><span>${l.addr}, ${l.city}, ${l.state}</span><span class="meta"><span>${l.dist} from you</span><span>${l.amen[0]}</span></span></span>${tick}</label>`).join('')}
      </div></fieldset>`;
  }
  /* — Step 4 — */
  function step4() {
    const days = Array.from({ length: 7 }, (_, i) => VH.fmt.plus(S.week, i));
    const canPrev = K(S.week) > K(today), canNext = VH.fmt.plus(S.week, 7) < VH.fmt.plus(today, 56);
    const slots = S.date ? slotsFor(S.date) : [];
    const grp = (name, icon, a, b) => { const g = slots.filter(x => { const h = +x.time.split(':')[0]; return h >= a && h < b; }); return g.length ? `<fieldset class="slot-group fieldset"><legend>${VH.icon(icon, 'icon')} ${name}</legend><div class="slots">${g.map(x => `<label class="slot"><input type="radio" name="time" value="${x.time}" data-pid="${x.pid}" ${S.time === x.time ? 'checked' : ''}><span>${VH.fmt.time(x.time)}</span></label>`).join('')}</div></fieldset>` : ''; };
    const nxt = !slots.length && S.date ? nextOpen(VH.fmt.plus(VH.fmt.parse(S.date), 1)) : null;
    const closed = S.date && VH.fmt.parse(S.date).getDay() === 0 && S.loc !== 'virtual';
    return `<h2 id="stepH" tabindex="-1">Choose a date and time</h2><p class="sub">${S.loc === 'virtual' ? 'Video visits' : 'In-person visits'}${specific() ? ' with <b>' + specific().name + '</b>' : ''}. Select a day, then a time.</p>
      ${S.taken ? `<div class="alert alert-err" role="alert" tabindex="-1" id="takenAlert">${VH.icon('alert-circle')}<div><b>That time was just taken</b>Someone else booked it a moment ago. Here are the closest openings, or pick another time below.<div class="row" style="margin-top:.75rem">${(S.alts || []).map(a => `<button class="btn btn-secondary btn-sm" type="button" data-alt="${a.date}|${a.time}">${VH.fmt.rel(a.date)} · ${VH.fmt.time(a.time)}</button>`).join('')}</div></div></div>` : ''}
      ${errBox(4)}
      <div class="weekbar"><button class="icon-btn" type="button" data-week="-7" aria-label="Previous week" ${canPrev ? '' : 'disabled'}>${VH.icon('chev-left')}</button><b>${VH.fmt.date(days[0], { month: 'long', day: 'numeric' })} – ${VH.fmt.date(days[6], { month: 'long', day: 'numeric' })}</b><button class="icon-btn" type="button" data-week="7" aria-label="Next week" ${canNext ? '' : 'disabled'}>${VH.icon('chev-right')}</button></div>
      <fieldset class="fieldset"><legend class="sr-only">Date</legend><div class="days">${days.map(d => { const k = K(d), n = slotsFor(k).length, past = d < today; return `<label class="day-tile ${n ? '' : 'none'}"><input type="radio" name="date" value="${k}" ${S.date === k ? 'checked' : ''} ${past ? 'disabled' : ''}><span><span class="dow">${VH.fmt.date(d, { weekday: 'short' })}</span><span class="dn">${d.getDate()}</span><span class="av">${past ? '–' : n ? n + ' times' : (d.getDay() === 0 && S.loc !== 'virtual' ? 'Closed' : 'Full')}</span></span></label>`; }).join('')}</div></fieldset>
      ${!S.date ? `<div class="alert alert-info">${VH.icon('info')}<div>Select a day above to see available times.</div></div>` : slots.length ? `${grp('Morning', 'sun', 0, 12)}${grp('Afternoon', 'sun', 12, 17)}${grp('Evening', 'moon', 17, 24)}` :
        `<div class="empty">${VH.emptyArt('calendar')}<h3>${closed ? 'We’re closed in person on Sundays' : 'No openings on ' + VH.fmt.date(S.date, { weekday: 'long', month: 'short', day: 'numeric' })}</h3><p>${closed ? 'Video visits are available on Sundays, or you can choose another day.' : 'This day is fully booked. Try another day, or see the next opening.'}</p><div class="row" style="justify-content:center">${nxt ? `<button class="btn btn-primary" type="button" data-alt="${nxt.date}|${nxt.time}">Next opening: ${VH.fmt.rel(nxt.date)}, ${VH.fmt.time(nxt.time)}</button>` : ''}${closed && videoOK() ? '<button class="btn btn-secondary" type="button" data-switch-video>Switch to video visit</button>' : ''}</div></div>`}
      <p class="tz">${VH.icon('globe')} Times are shown in ${S.loc === 'virtual' ? 'your local time' : 'local time at the Vita House you chose'}.</p>`;
  }
  /* — Step 5 — */
  const I5 = () => S.info;
  function fld(id, label, o = {}) {
    const v = I5()[id] ?? '', e = S.errs[id];
    const common = `id="f-${id}" name="${id}" ${o.ac ? `autocomplete="${o.ac}"` : ''} ${o.req ? 'required' : ''} aria-describedby="${id}-h ${id}-e" ${e ? 'aria-invalid="true"' : ''}`;
    const ctl = o.type === 'select' ? `<select class="select" ${common}>${o.opts.map(([val, t]) => `<option value="${val}" ${v === val ? 'selected' : ''}>${t}</option>`).join('')}</select>` :
      o.type === 'textarea' ? `<textarea class="textarea" ${common} maxlength="${o.max}" rows="4">${VH.esc(v)}</textarea>` :
        `<input class="input" type="${o.type || 'text'}" ${common} value="${VH.esc(v)}" ${o.inputmode ? `inputmode="${o.inputmode}"` : ''} ${o.max ? `max="${o.max}"` : ''} ${o.min ? `min="${o.min}"` : ''} ${o.ph ? `placeholder="${o.ph}"` : ''}>`;
    return `<div class="field ${e ? 'is-invalid' : ''}" data-f="${id}"><label for="f-${id}">${label}${o.req ? ' <span aria-hidden="true">*</span>' : ' <span class="opt">(optional)</span>'}</label>${ctl}<p class="hint" id="${id}-h">${o.hint || ''}</p><p class="error-text" id="${id}-e">${e ? VH.icon('alert-circle') + `<span>${e}</span>` : ''}</p></div>`;
  }
  function step5() {
    const i = I5(), errs = Object.entries(S.errs);
    return `<h2 id="stepH" tabindex="-1">Tell us about you</h2><p class="sub">We only ask for what we need to confirm your visit. Fields marked <span aria-hidden="true">*</span><span class="sr-only">with an asterisk</span> are required.</p>
      ${errs.length ? `<div class="alert alert-err err-summary" role="alert" tabindex="-1" id="errSum">${VH.icon('alert-circle')}<div><b>${errs.length === 1 ? '1 thing needs' : errs.length + ' things need'} your attention</b><ul>${errs.map(([k, m]) => `<li><a href="#f-${k}" data-focus="f-${k}">${m}</a></li>`).join('')}</ul></div></div>` : ''}
      <form id="form" class="form-grid" novalidate>
        <fieldset class="fieldset"><legend>Have you visited Vita House before?</legend><div class="segmented" role="radiogroup"><label><input type="radio" name="type" value="new" ${i.type === 'new' ? 'checked' : ''}><span>I'm new here</span></label><label><input type="radio" name="type" value="returning" ${i.type === 'returning' ? 'checked' : ''}><span>I'm a returning patient</span></label></div></fieldset>
        <div class="field-row">${fld('first', 'First name', { req: 1, ac: 'given-name' })}${fld('last', 'Last name', { req: 1, ac: 'family-name' })}</div>
        <div class="field-row">${fld('dob', 'Date of birth', { req: 1, type: 'date', ac: 'bday', max: K(today), min: '1900-01-01', hint: 'We use this to find your record.' })}${fld('phone', 'Mobile phone', { req: 1, type: 'tel', ac: 'tel', inputmode: 'tel', ph: '(555) 555-0100', hint: 'For appointment reminders.' })}</div>
        ${fld('email', 'Email', { req: 1, type: 'email', ac: 'email', hint: 'Your confirmation is sent here.' })}
        <div class="field-row">${fld('cover', 'How will you pay?', { type: 'select', req: 1, opts: [['insured', 'I have insurance'], ['member', 'I am a Vita House member'], ['self', 'I will pay myself']] })}${i.cover === 'insured' ? fld('insurer', 'Insurance type', { type: 'select', opts: [['', 'Choose one'], ['employer', 'Employer plan'], ['market', 'Marketplace plan'], ['medicare', 'Medicare'], ['medicaid', 'Medicaid'], ['other', 'Other or not sure']] }) : '<div></div>'}</div>
        ${fld('reason', 'What would you like to talk about?', { type: 'textarea', max: 280, hint: 'A sentence or two helps your clinician prepare. Please don\'t describe an emergency.' })}
        <div class="count" id="count" aria-live="off">${(i.reason || '').length} / 280</div>
        <div class="alert alert-info">${VH.icon('info')}<div>If you think you may be having a medical emergency, call 911 instead of booking online.</div></div>
        <div class="field ${S.errs.consent ? 'is-invalid' : ''}" data-f="consent"><label class="check"><input type="checkbox" id="f-consent" name="consent" ${i.consent ? 'checked' : ''} aria-describedby="consent-e" ${S.errs.consent ? 'aria-invalid="true"' : ''}><span>I agree to the <a href="#" data-noop>Terms</a> and <a href="#" data-noop>Privacy Notice</a> (concept project). <span aria-hidden="true">*</span></span></label><p class="error-text" id="consent-e">${S.errs.consent ? VH.icon('alert-circle') + `<span>${S.errs.consent}</span>` : ''}</p></div>
        <label class="check"><input type="checkbox" name="sms" ${i.sms ? 'checked' : ''}><span>Text me reminders 24 hours before my visit.</span></label>
      </form>`;
  }
  /* — Step 6 — */
  function step6() {
    const a = S.done, p = VH.prov(a.providerId), l = VH.loc(a.locationId), s = VH.svc(a.serviceId), d = VH.fmt.parse(a.date);
    const prep = l.virtual ? ['Check your camera and microphone with the test link we emailed', 'Find a quiet, well-lit spot', 'Have any questions written down', 'Keep your phone nearby in case the link needs refreshing'] : ['Bring a photo ID and your insurance card', 'Arrive 5 minutes early and check in from your phone', 'Write down any questions and the medicines you take', 'Wear something comfortable'];
    return `<div class="confirm"><div class="confirm-hero">
        <div class="confirm-arch" aria-hidden="true"><svg viewBox="0 0 88 100"><path d="M4 100V44a40 40 0 0 1 80 0v56z" fill="#E0E8D7"/><path d="M14 100V44a30 30 0 0 1 60 0v56z" fill="#3F5C47"/><path class="tickpath" d="M30 52l10 10 18-20" fill="none" stroke="#E8BC5E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h2 id="stepH" tabindex="-1" style="font-size:clamp(2rem,4vw,3rem)">You're all set, <em>${VH.esc(a.patient.first || 'friend')}.</em></h2>
        <p class="lead">Your visit is confirmed. We've sent the details to <b>${VH.esc(a.patient.email)}</b>.${S.preview ? ' (Preview)' : ''}</p></div>
      <div class="ticket"><div class="main"><div><span class="eyebrow plain" style="color:var(--moss-800)">${s.name}</span></div>
        <dl><div><dt>When</dt><dd>${VH.fmt.date(d, { weekday: 'long', month: 'long', day: 'numeric' })}<br>${VH.fmt.time(a.time)}</dd></div>
        <div><dt>With</dt><dd>${p.name}, ${p.creds}<br><span class="muted" style="font-weight:400">${p.role}</span></dd></div>
        <div><dt>Where</dt><dd>${l.virtual ? 'Video visit<br><span class="muted" style="font-weight:400">Link arrives 15 min before</span>' : `${l.name}<br><span class="muted" style="font-weight:400">${l.addr}, ${l.city}, ${l.state}</span>`}</dd></div>
        <div><dt>Cost</dt><dd>${a.patient.cover === 'member' ? 'Included in your membership' : a.patient.cover === 'self' ? 'Self-pay rate shown at check-in' : 'Insurance will be verified before your visit'}</dd></div></dl></div>
        <div class="stub"><span class="tiny muted">${VH.fmt.date(d, { month: 'short' }).toUpperCase()}</span><b>${d.getDate()}</b><span class="code">${a.code}</span></div></div>
      <div class="confirm-actions"><button class="btn btn-primary" type="button" data-ics>${VH.icon('calendar-check')} Add to calendar</button><a class="btn btn-secondary" href="portal.html#/appointments">${VH.icon('home')} Go to my dashboard</a><a class="btn btn-text" href="book.html">Book another visit</a></div>
      <section><h3 style="font-size:1.4rem;font-weight:400;margin-bottom:1rem">Getting ready</h3><div class="prep">${prep.map((t, i) => `<label><span class="check" style="display:contents"><input type="checkbox" aria-label="${t}"><span>${t}</span></span></label>`).join('')}</div></section>
      <div class="alert alert-info">${VH.icon('info')}<div><b>Need to change something?</b>Reschedule or cancel from your dashboard up to 24 hours before your visit. This is a concept project, so this appointment is only saved in this browser.</div></div></div>`;
  }

  const errBox = n => S.errs['s' + n] ? `<div class="alert alert-err" role="alert" tabindex="-1" id="stepErr">${VH.icon('alert-circle')}<div>${S.errs['s' + n]}</div></div>` : '';
  const actions = () => {
    const back = S.step > 1 ? `<button class="btn btn-text" type="button" data-back>${VH.icon('arrow-left')} Back</button>` : '<span></span>';
    const label = ['Continue', 'Continue', 'Continue', 'Continue', 'Confirm appointment'][S.step - 1];
    return `<div class="stage-actions">${back}<button class="btn btn-primary btn-lg" type="button" data-next>${label} ${S.step < 5 ? VH.icon('arrow-right', 'icon-arrow') : VH.icon('check')}</button></div>`;
  };

  let changed = true;
  function focusKey() {
    const a = document.activeElement; if (!a || !$('#stage').contains(a) || a === document.body) return null;
    if (a.id) return '#' + a.id;
    if (a.name && a.type === 'radio') return `[name="${a.name}"][value="${a.value}"]`;
    if (a.dataset.week) return `[data-week="${a.dataset.week}"]`;
    if (a.hasAttribute('data-showall')) return '[data-showall]';
    return null;
  }
  function render() {
    renderStepper();
    const stage = $('#stage'), fk = changed ? null : focusKey();
    stage.innerHTML = [step1, step2, step3, step4, step5, step6][S.step - 1]() + (S.step < 6 ? actions() : '');
    renderSummary();
    if (fk) { const el = stage.querySelector(fk); if (el && !el.disabled) el.focus({ preventScroll: true }); }
    if (changed) { const h = $('#stepH'); if (h && !VH.embed) { h.focus({ preventScroll: true }); } changed = false; }
    document.title = `${STEPS[S.step - 1]} · Book an appointment — Vita House`;
  }
  function go(n, scroll = true) {
    S.step = n; changed = true; S.errs = {}; render(); announce(`Step ${n} of 6: ${STEPS[n - 1]}`);
    if (scroll && !VH.embed) window.scrollTo({ top: Math.max(0, $('.stepper').getBoundingClientRect().top + scrollY - 100), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (!VH.embed) { try { history.pushState({ step: n }, '', '#step-' + n); } catch (e) { /* ignore */ } }
  }

  /* ---------- validation ---------- */
  function validate(step) {
    S.errs = {};
    if (step === 1 && !S.service) S.errs.s1 = '<b>Choose a service to continue.</b>Select the closest match from the list.';
    if (step === 2 && !S.provider) S.errs.s2 = '<b>Choose a provider to continue.</b>Pick a clinician, or choose “Any available provider”.';
    if (step === 3 && !S.loc) S.errs.s3 = '<b>Choose where you would like to be seen.</b>Select a Vita House or a video visit.';
    if (step === 4) {
      if (!S.date) S.errs.s4 = '<b>Select a day first.</b>Choose a date, then pick a time.';
      else if (!S.time) S.errs.s4 = '<b>Choose a time to continue.</b>Select one of the available times below.';
      else if (S.simTaken) {
        S.blocked = { date: S.date, time: S.time }; S.simTaken = false; S.taken = true; S.time = '';
        const alts = []; for (let i = 0; i < 14 && alts.length < 3; i++) { const k = K(VH.fmt.plus(VH.fmt.parse(S.date), i)); slotsFor(k).slice(0, 2).forEach(x => { if (alts.length < 3) alts.push({ date: k, time: x.time }); }); } S.alts = alts;
        S.errs.s4x = 1;
      }
    }
    if (step === 5) {
      const i = I5(), e = S.errs;
      if (!i.first.trim()) e.first = 'Enter your first name.';
      if (!i.last.trim()) e.last = 'Enter your last name.';
      if (!i.dob) e.dob = 'Enter your date of birth.'; else if (i.dob > K(today)) e.dob = 'Date of birth can’t be in the future.'; else if (i.dob < '1900-01-01') e.dob = 'Enter a year after 1900.';
      const digits = (i.phone || '').replace(/\D/g, '');
      if (!i.phone.trim()) e.phone = 'Enter a mobile number so we can send reminders.'; else if (digits.length < 10) e.phone = 'Enter a 10-digit number, like (555) 555-0100.';
      if (!i.email.trim()) e.email = 'Enter your email address.'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email.trim())) e.email = 'Enter an email address like name@example.com.';
      if (!i.consent) e.consent = 'Tick the box to agree before confirming.';
    }
    return !Object.keys(S.errs).length;
  }

  function confirmBooking() {
    const code = 'VH-' + (Date.now().toString(36).slice(-5)).toUpperCase();
    const pid = S.provider === 'any' ? S.slotProvider : S.provider;
    const appt = { id: 'u' + Date.now(), serviceId: S.service, providerId: pid, locationId: S.loc, date: S.date, time: S.time, status: 'upcoming', mode: S.loc === 'virtual' ? 'video' : 'in-person', reason: S.info.reason, patient: { ...S.info }, code, created: new Date().toISOString() };
    if (!S.preview) VH.store.set('appts', VH.appts().concat(appt));
    S.done = appt; go(6);
  }

  /* ---------- events ---------- */
  const stage = $('#stage');
  stage.addEventListener('change', e => {
    const t = e.target, n = t.name;
    if (n === 'service') { S.service = t.value; if (specific() && !specific().services.includes(S.service)) S.provider = ''; S.date = S.date; delete S.errs.s1; }
    if (n === 'provider') { S.provider = t.value; S.slotProvider = ''; if (S.loc && S.loc !== 'virtual' && !locationsFor().some(l => l.id === S.loc)) S.loc = ''; }
    if (n === 'loc') { S.loc = t.value; S.time = ''; S.slotProvider = ''; }
    if (n === 'date') { S.date = t.value; S.time = ''; S.slotProvider = ''; S.taken = false; changed = false; render(); announce(slotsFor(S.date).length + ' times available'); }
    if (n === 'time') { S.time = t.value; S.slotProvider = t.dataset.pid; S.taken = false; delete S.errs.s4; $('#summary') && renderSummary(); }
    if (n === 'type') { S.info.type = t.value; if (t.value === 'returning') Object.assign(S.info, { first: VH.patient.first, last: VH.patient.last, email: VH.patient.email, phone: VH.patient.phone, dob: VH.patient.dob }); else if (S.info.email === VH.patient.email) Object.assign(S.info, { first: '', last: '', email: '', phone: '', dob: '' }); S.errs = {}; changed = false; render(); }
    if (S.step === 5 && n && n !== 'type') { const i = S.info; if (t.type === 'checkbox') i[n] = t.checked; else i[n] = t.value; if (n === 'cover') { changed = false; render(); $('#f-cover').focus(); } else if (S.errs[n]) { delete S.errs[n]; const f = t.closest('.field'); if (f) { f.classList.remove('is-invalid'); t.removeAttribute('aria-invalid'); } } }
  });
  stage.addEventListener('input', e => {
    const t = e.target; if (S.step !== 5 || !t.name) return;
    if (t.type !== 'checkbox' && t.name !== 'type') S.info[t.name] = t.value;
    if (t.name === 'reason') $('#count').textContent = `${t.value.length} / 280`;
    if (S.errs[t.name] && t.name !== 'cover') { delete S.errs[t.name]; const f = t.closest('.field'); if (f) f.classList.remove('is-invalid'); t.removeAttribute('aria-invalid'); const er = $('#' + t.name + '-e'); if (er) er.innerHTML = ''; }
  });
  stage.addEventListener('focusout', e => {
    const t = e.target; if (S.step !== 5 || !t.name || t.name === 'type' || t.type === 'checkbox') return;
    S.info[t.name] = t.value;
  });
  stage.addEventListener('click', e => {
    const c = e.target.closest('[data-next],[data-back],[data-week],[data-alt],[data-showall],[data-ics],[data-switch-video],[data-focus],[data-noop]');
    if (!c) return;
    if (c.hasAttribute('data-noop')) { e.preventDefault(); VH.toast('Concept project: no real terms exist.', 'info'); return; }
    if (c.dataset.focus) { e.preventDefault(); const el = $('#' + c.dataset.focus); if (el) el.focus(); return; }
    if (c.hasAttribute('data-back')) return go(S.step - 1);
    if (c.hasAttribute('data-showall')) { S.showAll = !S.showAll; changed = false; return render(); }
    if (c.dataset.week) { S.week = VH.fmt.plus(S.week, +c.dataset.week); if (S.week < today) S.week = new Date(today); changed = false; render(); return; }
    if (c.dataset.alt) { const [d, t] = c.dataset.alt.split('|'); S.date = d; S.time = t; S.week = VH.fmt.parse(d); S.slotProvider = (slotsFor(d).find(x => x.time === t) || {}).pid || ''; S.taken = false; S.errs = {}; changed = false; render(); return; }
    if (c.hasAttribute('data-switch-video')) { S.loc = 'virtual'; S.time = ''; changed = false; render(); return; }
    if (c.hasAttribute('data-ics')) { VH.download('vita-house-appointment.ics', VH.ics(S.done), 'text/calendar'); VH.toast('Calendar file downloaded'); return; }
    if (c.hasAttribute('data-next')) {
      if (S.step === 5) { collect(); }
      const ok = validate(S.step);
      if (!ok) {
        changed = false; const wasTaken = S.errs.s4x; render();
        const f = $('#errSum') || $('#stepErr') || (wasTaken && $('#takenAlert')); if (f) { f.focus(); f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        return;
      }
      if (S.step === 5) return confirmBooking();
      go(S.step + 1);
    }
  });
  stage.addEventListener('submit', e => e.preventDefault());
  function collect() { const f = $('#form'); if (!f) return; new FormData(f).forEach((v, k) => { if (k !== 'consent' && k !== 'sms') S.info[k] = v; }); S.info.consent = !!$('#f-consent').checked; S.info.sms = !!f.elements.sms.checked; }

  $('#stepper').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b && !b.disabled) go(+b.dataset.go); });
  $('#summary').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });
  window.addEventListener('popstate', e => { const m = /step-(\d)/.exec(location.hash); const n = m ? +m[1] : 1; if (n < 6 && n <= firstIncomplete() + 1 && !S.done) { S.step = n; changed = true; render(); } });
  window.addEventListener('beforeunload', () => { /* nothing is lost: nothing is saved until confirm */ });

  /* ---------- demo states ---------- */
  if (P.get('state') === 'errors') { S.step = 5; Object.assign(S.info, { first: 'Maya', last: '', dob: '', email: 'maya@', phone: '555', consent: false }); S.service = S.service || 'primary'; S.provider = S.provider || 'okafor'; S.loc = S.loc || 'austin'; S.date = S.date || K(VH.fmt.plus(today, 3)); S.time = S.time || '09:30'; S.force = true; validate(5); }
  if (P.get('state') === 'taken') { S.simTaken = true; if (S.step === 4 && S.time) { S.force = true; validate(4); } }
  if (P.has('autofill')) { Object.assign(S.info, { type: 'returning', first: VH.patient.first, last: VH.patient.last, email: VH.patient.email, phone: VH.patient.phone, dob: VH.patient.dob, reason: 'Check-in and a question about low energy', consent: true }); }
  if (S.step === 6 || P.get('step') === '6') {
    S.service = S.service || 'primary'; S.provider = S.provider || 'okafor'; S.loc = S.loc || 'austin'; S.date = S.date || K(VH.fmt.plus(today, 3)); S.time = S.time || '09:30'; S.preview = true;
    Object.assign(S.info, { first: VH.patient.first, last: VH.patient.last, email: VH.patient.email, phone: VH.patient.phone, dob: VH.patient.dob, consent: true });
    S.done = { id: 'preview', serviceId: S.service, providerId: S.provider === 'any' ? 'okafor' : S.provider, locationId: S.loc, date: S.date, time: S.time, code: 'VH-7K2QX', patient: { ...S.info } }; S.step = 6;
  }
  if (S.step === 4 && !S.date) { const n = nextOpen(); if (n && !P.get('state')) { /* leave the date unset: the user chooses */ } }
  changed = !VH.embed; render();
})();
