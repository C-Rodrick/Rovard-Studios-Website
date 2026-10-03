/* ==========================================================================
   VITA HOUSE — patient dashboard (hash-routed, local demo data)
   Routes: #/  #/appointments  #/care-team  #/messages  #/documents  #/membership  #/settings
   ?state=new       → new-patient (empty) dashboard, not persisted
   ?state=msgerror  → shows a failed-to-send message with Retry
   ========================================================================== */
(function () {
  'use strict';
  const $ = VH.$, $$ = VH.$$, P = VH.params, K = VH.fmt.key, esc = VH.esc;
  VH.emptyMode = P.get('state') === 'new';
  VH.shell({ header: false, footer: false });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const save = (k, v) => { if (!VH.emptyMode) VH.store.set(k, v); };
  const load = (k, d) => VH.emptyMode ? d : VH.store.get(k, d);
  const me = Object.assign({}, VH.patient, load('profile', {}));
  if (VH.emptyMode) me.plan = 'open';

  /* ---------- seed data ---------- */
  const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString();
  const WHO = {
    okafor: { name: 'Dr. Amara Okafor', role: 'Primary care', look: VH.prov('okafor').look },
    kobayashi: { name: 'Hana Kobayashi, RD', role: 'Nutrition', look: VH.prov('kobayashi').look },
    bell: { name: 'Dr. Marcus Bell', role: 'Mental wellness', look: VH.prov('bell').look },
    team: { name: 'East Austin care team', role: 'Care team', icon: 'users' },
    billing: { name: 'Vita House Billing', role: 'Billing', icon: 'card' }
  };
  const seedMsgs = () => {
    const m = [
      { id: 'm1', from: 'okafor', subject: 'Your visit summary is ready', unread: true, msgs: [{ who: 'okafor', ts: hoursAgo(5), text: 'Hi Maya, your summary from your recent visit is now in Documents. The short version: a few small habits to try, and we will check in again next time. Reply here if anything is unclear.' }] },
      { id: 'm2', from: 'team', subject: 'Getting ready for your visit', unread: false, msgs: [{ who: 'team', ts: hoursAgo(30), text: 'Hello Maya! A quick reminder to bring your photo ID and insurance card to your upcoming visit. You can also finish your checklist in the dashboard.' }, { who: 'me', ts: hoursAgo(28), text: 'Thanks! Done. Is there parking at the house?' }, { who: 'team', ts: hoursAgo(27), text: 'Yes, free two-hour parking behind the house. See you soon.' }] },
      { id: 'm3', from: 'kobayashi', subject: 'Your meal-planning worksheet', unread: false, msgs: [{ who: 'kobayashi', ts: hoursAgo(96), text: 'Lovely to meet you, Maya. I attached the worksheet we talked about. Fill in only what feels useful and we will go through it together next time.' }] },
      { id: 'm4', from: 'billing', subject: 'Your October receipt', unread: false, msgs: [{ who: 'billing', ts: hoursAgo(140), text: 'Thank you for your Everyday membership payment of $49.00. Your receipt is saved in Documents.' }] }
    ];
    if (P.get('state') === 'msgerror') m[0].msgs.push({ who: 'me', ts: hoursAgo(.1), text: 'Could I move my appointment to the afternoon?', status: 'failed' });
    return m;
  };
  const dAgo = n => K(VH.fmt.plus(today, -n));
  const seedDocs = () => [
    { id: 'd1', title: 'Lab results: routine bloodwork', cat: 'Lab results', date: dAgo(39), size: '184 KB', kind: 'pdf', isNew: true },
    { id: 'd2', title: 'Visit summary: annual wellness exam', cat: 'Visit summaries', date: dAgo(41), size: '96 KB', kind: 'pdf' },
    { id: 'd3', title: 'Visit summary: introductory session', cat: 'Visit summaries', date: dAgo(83), size: '71 KB', kind: 'pdf' },
    { id: 'd4', title: 'New patient intake form', cat: 'Forms', date: dAgo(120), size: '210 KB', kind: 'pdf' },
    { id: 'd5', title: 'Immunization record', cat: 'Forms', date: dAgo(120), size: '58 KB', kind: 'pdf' },
    { id: 'd6', title: 'Insurance card (front)', cat: 'Insurance', date: dAgo(120), size: '1.1 MB', kind: 'jpg' }
  ];
  let MSG = load('msgs', null) || (VH.emptyMode ? [] : seedMsgs());
  let DOCS = load('docs', null) || (VH.emptyMode ? [] : seedDocs());
  if (P.get('state') === 'msgerror' && !VH.emptyMode) MSG = seedMsgs();
  const saveMsgs = () => save('msgs', MSG), saveDocs = () => save('docs', DOCS);

  /* ---------- helpers ---------- */
  const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return 'Just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : VH.fmt.date(new Date(iso), { month: 'short', day: 'numeric' }); };
  const diff = d => Math.round((VH.fmt.parse(d) - today) / 864e5);
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; };
  const ic = (n, c) => VH.icon(n, c);
  const announce = m => { const a = $('#announce'); a.textContent = ''; setTimeout(() => a.textContent = m, 30); };
  const ovr = () => VH.store.get('apptState', {});
  const appts = () => { const o = ovr(); return VH.allAppts().map(a => Object.assign({}, a, o[a.id] || {})); };
  const findAppt = id => appts().find(a => a.id === id);
  function patchAppt(id, patch) {
    const mine = VH.appts(), i = mine.findIndex(a => a.id === id);
    if (i > -1) { mine[i] = Object.assign({}, mine[i], patch); VH.store.set('appts', mine); }
    else { const o = ovr(); o[id] = Object.assign({}, o[id] || {}, patch); VH.store.set('apptState', o); }
  }
  const upcoming = () => appts().filter(a => a.status === 'upcoming' && diff(a.date) >= 0);
  const past = () => appts().filter(a => a.status === 'completed' || (a.status === 'upcoming' && diff(a.date) < 0)).reverse();
  const cancelled = () => appts().filter(a => a.status === 'cancelled').reverse();
  const unread = () => MSG.filter(m => m.unread).length;
  const avatarFor = (k, cls = '') => { const w = WHO[k]; return w.look ? `<span class="avatar ${cls}">${VH.portrait(Object.assign({}, w.look, { shape: 'circle', alt: '' }))}</span>` : `<span class="icon-chip round" style="width:${cls === 'sm' ? 2.25 : 3}rem;height:${cls === 'sm' ? 2.25 : 3}rem">${ic(w.icon)}</span>`; };
  const pAvatar = (p, cls = '') => `<span class="avatar ${cls}">${VH.portrait(Object.assign({}, p.look, { shape: 'circle', alt: '' }))}</span>`;
  const place = a => { const l = VH.loc(a.locationId); return l.virtual ? 'Video visit' : l.name; };
  const prepItems = a => VH.loc(a.locationId).virtual ? ['Test your camera and microphone', 'Find a quiet, well-lit space', 'Write down your questions', 'Have your ID handy'] : ['Bring your photo ID and insurance card', 'Write down your questions', 'List the medicines you take', 'Arrive 5 minutes early'];
  const prepState = a => { const m = load('prep', {}); return m[a.id] || (a.seed ? [true, true, true, false].slice(0, 4) : [false, false, false, false]); };
  const setPrep = (a, i, v) => { const m = VH.store.get('prep', {}), cur = prepState(a).slice(); cur[i] = v; m[a.id] = cur; save('prep', m); };
  const emptyCard = (art, title, text, cta) => `<div class="empty">${VH.emptyArt(art)}<h3>${title}</h3><p>${text}</p>${cta || ''}</div>`;
  let cur = null;
  const openModal = (html, o) => { cur = VH.modal(html, o); return cur; };
  const closeModal = () => { if (cur) { cur.close(); cur = null; } };

  /* ---------- chrome ---------- */
  const NAV = [['home', 'Overview', 'home'], ['appointments', 'Appointments', 'calendar'], ['care-team', 'Care team', 'users'], ['messages', 'Messages', 'message'], ['documents', 'Documents', 'doc'], ['membership', 'Membership', 'idcard'], ['settings', 'Profile & settings', 'sliders']];
  const MORE = ['care-team', 'membership', 'settings'];
  let route = 'home';
  const meAvatar = () => `<span class="avatar">${VH.portrait({ skin: 's3', hair: 'brown', style: 'long', cloth: '#C4714C', outfit: 'knit', bg: 'blush', shape: 'circle', alt: '' })}</span>`;
  function bell() {
    return `<span class="bell" style="position:relative"><button class="icon-btn" type="button" data-act="bell" aria-haspopup="true" aria-expanded="false" aria-label="Notifications${unread() ? ', ' + unread() + ' new' : ''}">${ic('bell')}${unread() ? '<span class="dot"></span>' : ''}</button></span>`;
  }
  function chrome() {
    const n = unread();
    $('#side').innerHTML = `${VH.logo({ href: 'index.html', dark: true, size: '1.35rem', label: false })}
      <nav aria-label="Dashboard">${NAV.map(([k, t, i]) => `<a href="#/${k === 'home' ? '' : k}" ${route === k ? 'aria-current="page"' : ''}>${ic(i)}${t}${k === 'messages' && n ? `<span class="badge-count" aria-label="${n} unread">${n}</span>` : ''}</a>`).join('')}</nav>
      <div class="grow"></div>
      <div class="me">${meAvatar()}<div><b>${esc(me.first)} ${esc(me.last)}</b><span>${me.plan === 'open' ? 'Open Door' : VH.plans.find(p => p.id === me.plan).name} member</span></div></div>
      <a class="back" href="index.html">${ic('arrow-left')} Back to website</a>`;
    $('#mbar').innerHTML = `${VH.logo({ href: 'index.html', size: '1.2rem', label: false })}<div class="row" style="gap:.4rem">${bell()}<a class="icon-btn" href="#/settings" aria-label="Profile and settings" style="overflow:hidden;padding:0">${meAvatar()}</a></div>`;
    const moreOn = MORE.includes(route);
    $('#tabbar').innerHTML = [['home', 'Home', 'home'], ['appointments', 'Visits', 'calendar'], ['messages', 'Messages', 'message'], ['documents', 'Records', 'doc']].map(([k, t, i]) => `<a href="#/${k === 'home' ? '' : k}" ${route === k ? 'aria-current="page"' : ''}>${ic(i)}${t}${k === 'messages' && n ? `<span class="pip" aria-label="${n} unread">${n}</span>` : ''}</a>`).join('') + `<button type="button" data-act="more" ${moreOn ? 'aria-current="page"' : ''} aria-haspopup="dialog">${ic('menu')}More</button>`;
    $('#tools').innerHTML = `${bell()}<a class="btn btn-primary btn-sm" href="book.html">${ic('plus')} Book a visit</a>`;
  }

  /* ---------- views ---------- */
  const VIEWS = {};

  /* — Overview — */
  function nextCard(a) {
    const p = VH.prov(a.providerId), l = VH.loc(a.locationId), s = VH.svc(a.serviceId), d = VH.fmt.parse(a.date), n = diff(a.date), video = l.virtual;
    const inTxt = n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`;
    return `<section class="next" aria-labelledby="nextH"><div class="big-date" aria-hidden="true"><div><b>${d.getDate()}</b><span>${VH.fmt.date(d, { month: 'short' })}</span></div></div>
      <div style="position:relative;z-index:1"><div class="row" style="gap:.75rem"><span class="eyebrow plain">Next appointment</span><span class="count-in">${inTxt}</span></div>
      <h2 id="nextH">${s.name}</h2>
      <div class="details"><span>${ic('clock')} ${VH.fmt.date(d, { weekday: 'long' })}, ${VH.fmt.time(a.time)}</span><span>${ic('user')} ${p.name}</span><span>${ic(video ? 'video' : 'pin')} ${video ? 'Video visit' : l.name}</span></div>
      <div class="acts">${video ? `<button class="btn btn-honey" type="button" data-act="join" ${n > 0 ? 'aria-disabled="true"' : ''}>${ic('video')} Join video visit</button>` : `<button class="btn btn-honey" type="button" data-act="checkin" ${n <= 1 ? '' : 'aria-disabled="true"'}>${ic('check-circle')} Check in</button>`}<button class="btn btn-outline-light" type="button" data-act="resched" data-id="${a.id}">Reschedule</button><button class="btn btn-outline-light" type="button" data-act="open-appt" data-id="${a.id}">Details</button></div>
      <p class="tiny" style="margin-top:.85rem;color:#AFC0AA">${video ? 'Your secure video link opens 15 minutes before the visit.' : 'Check-in opens the day before your visit.'}</p></div></section>`;
  }
  const noNext = () => `<section class="next" aria-labelledby="nextH"><div class="big-date" aria-hidden="true">${ic('calendar', 'icon-xl')}</div><div style="position:relative;z-index:1"><span class="eyebrow plain">Welcome to Vita House</span><h2 id="nextH">${upcoming().length || appts().length ? 'Nothing coming up' : `Let's book your first visit, ${esc(me.first)}`}</h2><p style="color:#CAD5C5;max-width:32em">${appts().length ? 'You have no upcoming appointments. Book a follow-up or a check-in whenever you are ready.' : 'It takes about three minutes. You can choose your clinician, a location and a time that suits you.'}</p><div class="acts"><a class="btn btn-honey" href="book.html">Book a visit ${ic('arrow-right', 'icon-arrow')}</a><a class="btn btn-outline-light" href="providers.html">Meet the providers</a></div></div></section>`;
  const msgRow = m => { const w = WHO[m.from], last = m.msgs[m.msgs.length - 1]; return `<a class="rowx clickable" href="#/messages/${m.id}">${avatarFor(m.from)}<div style="min-width:0"><div class="ttl">${m.unread ? '<span class="unread-dot" aria-hidden="true"></span><span class="sr-only">Unread: </span>' : ''}${esc(m.subject)}</div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w.name} · ${esc(last.text)}</div></div><span class="sub">${ago(last.ts)}</span></a>`; };
  const docIcon = d => d.cat === 'Lab results' ? 'flask' : d.kind === 'jpg' ? 'idcard' : 'doc';
  function docRow(d, full) {
    return `<div class="${full ? 'doc' : 'rowx'}"><span class="icon-chip ${d.isNew ? 'clay' : ''}">${ic(docIcon(d))}</span><div style="min-width:0"><div class="ttl">${esc(d.title)} ${d.isNew ? '<span class="badge badge-clay" style="margin-left:.4rem">New</span>' : ''}</div><div class="sub">${full ? d.cat + ' · ' : ''}${VH.fmt.date(d.date, { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.kind.toUpperCase()} · ${d.size}</div></div><div class="acts"><button class="icon-btn" type="button" data-act="dl" data-id="${d.id}" aria-label="Download ${esc(d.title)}">${ic('download')}</button>${full ? `<button class="icon-btn" type="button" data-act="del-doc" data-id="${d.id}" aria-label="Delete ${esc(d.title)}">${ic('trash')}</button>` : ''}</div></div>`;
  }
  VIEWS.home = {
    title: () => `Good ${greet()}, ${me.first}`, sub: () => VH.fmt.date(today, { weekday: 'long', month: 'long', day: 'numeric' }),
    html() {
      const up = upcoming(), nx = up[0], isNew = !appts().length;
      const prep = nx ? (() => { const items = prepItems(nx), st = prepState(nx), done = st.filter(Boolean).length; return `<section class="p-card" aria-labelledby="prepH"><div class="head"><h2 id="prepH">Get ready for your visit</h2><span class="badge nums">${done} of ${items.length}</span></div><div class="progress" style="margin-bottom:1rem"><i style="width:${done / items.length * 100}%"></i></div><div class="prep" style="display:grid;gap:.6rem">${items.map((t, i) => `<label class="check" style="padding:.7rem .85rem;border-radius:14px;background:var(--linen);align-items:center"><input type="checkbox" data-act="prep" data-id="${nx.id}" data-i="${i}" ${st[i] ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></section>`; })() :
        `<section class="p-card" aria-labelledby="gsH"><div class="head"><h2 id="gsH">Getting started</h2><span class="badge nums">1 of 4</span></div><div class="progress" style="margin-bottom:1rem"><i style="width:25%"></i></div><ul class="plain" style="display:grid;gap:.5rem">${[['Create your account', 1, ''], ['Book your first visit', 0, 'book.html'], ['Complete your intake form', 0, '#/documents'], ['Add your insurance', 0, '#/documents']].map(([t, d, h]) => `<li class="row" style="flex-wrap:nowrap;gap:.8rem;padding:.65rem .85rem;border-radius:14px;background:var(--linen)"><span class="icon-chip round" style="width:2rem;height:2rem;${d ? 'background:var(--moss-700);color:#fff' : ''}">${ic(d ? 'check' : 'plus')}</span>${h ? `<a href="${h}" style="font-weight:600">${t}</a>` : `<span style="text-decoration:line-through;color:var(--ink-3)">${t}</span>`}</li>`).join('')}</ul></section>`;
      const plan = VH.plans.find(p => p.id === me.plan);
      return `${nx ? nextCard(nx) : noNext()}
        <div class="quick" style="margin-top:1.25rem">
          <a href="book.html"><span class="icon-chip">${ic('calendar-check')}</span>Book a visit<small>Pick a time in minutes</small></a>
          <a href="#/messages"><span class="icon-chip clay">${ic('message')}</span>Message care team<small>Replies within a business day</small></a>
          <a href="#/documents"><span class="icon-chip honey">${ic('flask')}</span>Results &amp; records<small>${DOCS.filter(d => d.isNew).length ? DOCS.filter(d => d.isNew).length + ' new' : 'All up to date'}</small></a>
          <a href="#/membership"><span class="icon-chip">${ic('idcard')}</span>Membership<small>${plan.name}</small></a>
        </div>
        <div class="p-grid main-side" style="margin-top:1.25rem">
          <div class="p-grid" style="align-content:start">
            <section class="p-card" aria-labelledby="upH"><div class="head"><h2 id="upH">Also coming up</h2><a class="link" href="#/appointments">All appointments ${ic('arrow-right')}</a></div>
              ${up.length > 1 ? `<div class="rows">${up.slice(1, 4).map(a => { const d = VH.fmt.parse(a.date); return `<button class="rowx clickable" type="button" data-act="open-appt" data-id="${a.id}" style="background:none;border:0;border-top:1px solid var(--line);text-align:left;width:100%"><div class="date-chip"><div><b>${d.getDate()}</b><span>${VH.fmt.date(d, { month: 'short' })}</span></div></div><div><div class="ttl">${VH.svc(a.serviceId).name}</div><div class="sub">${VH.fmt.time(a.time)} · ${VH.prov(a.providerId).name} · ${place(a)}</div></div>${ic('chev-right')}</button>`; }).join('')}</div>` : `<p class="muted">${nx ? 'Nothing else scheduled.' : 'Nothing scheduled yet.'}</p><a class="btn btn-soft btn-sm" style="margin-top:.75rem" href="book.html">Book another visit</a>`}</section>
            <section class="p-card" aria-labelledby="msgH"><div class="head"><h2 id="msgH">Messages ${unread() ? `<span class="badge badge-clay" style="vertical-align:middle;margin-left:.4rem">${unread()} new</span>` : ''}</h2><a class="link" href="#/messages">Open inbox ${ic('arrow-right')}</a></div>
              ${MSG.length ? `<div class="rows">${MSG.slice(0, 3).map(msgRow).join('')}</div>` : emptyCard('message', 'No messages yet', 'When your care team writes to you, it will show up here.', '<a class="btn btn-soft btn-sm" href="#/messages">Start a conversation</a>')}</section>
            <section class="p-card" aria-labelledby="docH"><div class="head"><h2 id="docH">Recent documents</h2><a class="link" href="#/documents">All documents ${ic('arrow-right')}</a></div>
              ${DOCS.length ? `<div class="rows">${DOCS.slice(0, 3).map(d => docRow(d, false)).join('')}</div>` : emptyCard('doc', 'No documents yet', 'Visit summaries, lab results and forms will appear here after your first visit.')}</section>
          </div>
          <div class="p-grid" style="align-content:start">${prep}
            <section class="p-card" aria-labelledby="mbH"><div class="head"><h2 id="mbH">Membership</h2></div><div class="row" style="flex-wrap:nowrap;gap:1rem"><span class="icon-chip dark">${ic('idcard')}</span><div><b>${plan.name}</b><div class="sub muted small">${plan.price ? `$${plan.price}/month · renews ${VH.fmt.date(new Date(today.getFullYear(), today.getMonth() + 1, 1), { month: 'short', day: 'numeric' })}` : 'Pay per visit · insurance accepted'}</div></div></div><a class="link" href="#/membership" style="margin-top:.75rem">${plan.price ? 'Manage membership' : 'Explore memberships'} ${ic('arrow-right')}</a></section>
            <section class="p-card" aria-labelledby="cpH"><div class="head"><h2 id="cpH">Care plan reminders</h2></div><ul class="plain" style="display:grid;gap:.9rem">
              <li class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:.9rem"><span class="icon-chip">${ic('calendar-check')}</span><div><b>${isNew ? 'Annual wellness exam' : 'Next wellness exam'}</b><div class="sub muted small">${isNew ? 'A good first visit for new patients' : 'Suggested around ' + VH.fmt.date(new Date(today.getFullYear(), today.getMonth() + 9, 1), { month: 'long', year: 'numeric' })}</div></div></li>
              <li class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:.9rem"><span class="icon-chip clay">${ic('syringe')}</span><div><b>Seasonal vaccines</b><div class="sub muted small">Walk-in windows are open at every house.</div></div></li></ul></section>
          </div></div>`;
    },
    after() { }
  };

  /* — Appointments — */
  let apptTab = 'upcoming';
  function apptCard(a) {
    const p = VH.prov(a.providerId), s = VH.svc(a.serviceId), d = VH.fmt.parse(a.date);
    const st = a.status === 'cancelled' ? 'cancel' : (a.status === 'completed' || diff(a.date) < 0) ? 'past' : '';
    const badge = st === 'cancel' ? '<span class="badge badge-err">Cancelled</span>' : st === 'past' ? '<span class="badge">Completed</span>' : '<span class="badge badge-ok"><span class="dot"></span>Confirmed</span>';
    const q = `service=${a.serviceId}&provider=${a.providerId}`;
    const acts = st === '' ? `<button class="btn btn-secondary btn-sm" type="button" data-act="resched" data-id="${a.id}">Reschedule</button><button class="btn btn-soft btn-sm" type="button" data-act="open-appt" data-id="${a.id}">Details</button>` :
      st === 'past' ? `<button class="btn btn-soft btn-sm" type="button" data-act="summary" data-id="${a.id}">View summary</button><a class="btn btn-secondary btn-sm" href="book.html?${q}">Book again</a>` :
        `<a class="btn btn-secondary btn-sm" href="book.html?${q}">Rebook</a>`;
    return `<article class="appt" aria-label="${s.name}, ${VH.fmt.date(d, { month: 'long', day: 'numeric' })}"><div class="date-chip ${st}"><div><b>${d.getDate()}</b><span>${VH.fmt.date(d, { month: 'short' })}</span></div></div>
      <div style="min-width:0"><div class="row" style="gap:.6rem"><h3 style="font:700 1.0625rem var(--font-ui);letter-spacing:0">${s.name}</h3>${badge}</div><div class="muted small" style="margin-top:.25rem">${VH.fmt.date(d, { weekday: 'long' })}, ${VH.fmt.time(a.time)} · ${place(a)}</div><div class="who">${pAvatar(p, 'sm')}${p.name}</div></div><div class="acts">${acts}</div></article>`;
  }
  VIEWS.appointments = {
    title: () => 'Appointments', sub: () => 'Manage upcoming visits and look back at your history.',
    html() {
      const tabs = [['upcoming', 'Upcoming', upcoming()], ['past', 'Past', past()], ['cancelled', 'Cancelled', cancelled()]];
      const list = tabs.find(t => t[0] === apptTab)[2];
      const empties = { upcoming: emptyCard('calendar', 'No upcoming visits', 'Book a visit whenever you are ready. Most people finish in about three minutes.', '<a class="btn btn-primary" href="book.html">Book a visit</a>'), past: emptyCard('doc', 'No past visits yet', 'Your visit history and summaries will appear here after your first appointment.'), cancelled: emptyCard('check-circle', 'Nothing cancelled', 'Cancelled appointments will be listed here.') };
      return `<div class="tabs" role="tablist" aria-label="Appointment status">${tabs.map(([k, t, l]) => `<button class="tab" role="tab" id="tab-${k}" aria-selected="${apptTab === k}" aria-controls="panel" tabindex="${apptTab === k ? 0 : -1}" data-act="apptTab" data-k="${k}">${t}<span class="count">${l.length}</span></button>`).join('')}</div>
        <div id="panel" role="tabpanel" aria-labelledby="tab-${apptTab}" style="margin-top:1.5rem">${list.length ? list.map(apptCard).join('') : empties[apptTab]}</div>`;
    }
  };

  /* — Care team — */
  VIEWS['care-team'] = {
    title: () => 'Your care team', sub: () => 'The people looking after you, and how to reach them.',
    html() {
      const pid = load('pcp', 'okafor'), p = VH.emptyMode ? null : VH.prov(pid);
      if (!p) return emptyCard('user', 'Choose your primary provider', 'Your primary provider gets to know you and coordinates your care. Browse the team and pick someone who feels right.', '<a class="btn btn-primary" href="providers.html">Meet the providers</a>');
      const seen = [...new Set(appts().map(a => a.providerId))].filter(x => x !== p.id).map(VH.prov);
      const home = VH.loc(me.home);
      return `<section class="p-card" aria-labelledby="pcpH"><div class="team-hero"><div class="portrait" style="border-radius:var(--arch);overflow:hidden;background:var(--sage-100)">${VH.portrait(Object.assign({}, p.look, { alt: 'Illustrated portrait of ' + p.name }))}</div>
        <div class="stack" style="--gap:1rem"><div class="row"><span class="badge badge-ok">Primary provider</span><span class="badge">${p.years} years in practice</span></div>
          <div><h2 id="pcpH" style="font-size:2rem">${p.name}, ${p.creds}</h2><p class="muted">${p.role}</p></div><p class="prose" style="color:var(--ink-2)">${p.bio}</p>
          <div class="row"><a class="btn btn-primary" href="book.html?provider=${p.id}">Book a follow-up</a><a class="btn btn-secondary" href="#/messages">${ic('message')} Message</a><a class="btn btn-text" href="provider.html?id=${p.id}">Full profile</a><button class="btn btn-text" type="button" data-act="pcp">Change provider</button></div></div></div>
        <hr class="divider"><dl class="kv"><div><dt>Languages</dt><dd>${p.langs.join(', ')}</dd></div><div><dt>Home house</dt><dd>${home.name}<br><span class="muted" style="font-weight:400">${home.addr}, ${home.city}</span></dd></div><div><dt>Typical reply time</dt><dd>Within one business day</dd></div><div><dt>Phone</dt><dd>${home.phone}</dd></div></dl></section>
        <h2 style="font:400 1.5rem var(--font-display);margin:2rem 0 1rem">Also on your team</h2>
        <div class="p-grid two">${seen.map(o => `<div class="p-card tm">${pAvatar(o)}<div style="flex:1"><b>${o.name}</b><div class="muted small">${o.role}</div></div><a class="btn btn-soft btn-sm" href="book.html?provider=${o.id}">Book</a></div>`).join('')}
        <div class="p-card tm"><span class="avatar">${VH.portrait({ skin: 's4', hair: 'black', style: 'short', cloth: '#4D6F54', outfit: 'knit', bg: 'sage', shape: 'circle', alt: '' })}</span><div style="flex:1"><b>Sam Rivera</b><div class="muted small">Care coordinator</div></div><a class="btn btn-soft btn-sm" href="#/messages">Message</a></div></div>`;
    }
  };

  /* — Messages — */
  let selMsg = null, mailOpen = false;
  VIEWS.messages = {
    title: () => 'Messages', sub: () => 'Secure conversations with your care team.',
    html() {
      if (!MSG.length) return `<div class="mail" style="display:block;height:auto;padding:1rem"><div class="p-card head" style="border:0;display:flex;justify-content:space-between;align-items:center"><h2>Inbox</h2><button class="btn btn-primary btn-sm" type="button" data-act="new-msg">${ic('plus')} New message</button></div>${emptyCard('message', 'No messages yet', 'Ask your care team a question, or wait for a welcome note after your first visit. Replies usually arrive within one business day.', `<button class="btn btn-primary" type="button" data-act="new-msg">Write a message</button>`)}</div>`;
      if (!selMsg || !MSG.find(m => m.id === selMsg)) selMsg = MSG[0].id;
      const t = MSG.find(m => m.id === selMsg), w = WHO[t.from];
      return `<div class="mail ${mailOpen ? 'show-thread' : ''}" id="mail">
        <div class="list" role="list" aria-label="Conversations"><div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.1rem;border-bottom:1px solid var(--line)"><h2 style="font:400 1.25rem var(--font-display)">Inbox</h2><button class="btn btn-soft btn-sm" type="button" data-act="new-msg">${ic('plus')} New</button></div>
          ${MSG.map(m => { const last = m.msgs[m.msgs.length - 1]; return `<button type="button" role="listitem" data-act="thread" data-id="${m.id}" aria-current="${m.id === selMsg}" class="thread-btn ${m.unread ? 'unread' : ''}">${avatarFor(m.from)}<span style="min-width:0"><b>${m.unread ? '<span class="unread-dot" aria-hidden="true"></span><span class="sr-only">Unread: </span>' : ''}${esc(m.subject)}</b><span class="sub" style="display:block;font-size:.8125rem;color:var(--ink-3)">${WHO[m.from].name}</span><span class="snip">${esc(last.text)}</span></span><span class="sub" style="font-size:.75rem;color:var(--ink-3)">${ago(last.ts)}</span></button>`; }).join('')}</div>
        <section class="thread" aria-label="Conversation: ${esc(t.subject)}"><header><button class="icon-btn back-btn" type="button" data-act="back-list" aria-label="Back to inbox">${ic('arrow-left')}</button>${avatarFor(t.from)}<div><h2>${esc(t.subject)}</h2><span class="muted small">${w.name} · ${w.role}</span></div></header>
          <div class="msgs" id="msgs" tabindex="0" aria-label="Messages">${t.msgs.map((m, i) => bubble(m, i)).join('')}</div>
          <form class="composer" id="composer" novalidate><div class="field" style="min-width:0"><label class="sr-only" for="reply">Reply to ${w.name}</label><textarea class="textarea" id="reply" placeholder="Write a reply" aria-describedby="reply-e" rows="1"></textarea><p class="error-text" id="reply-e" role="alert"></p></div><button class="btn btn-primary" type="submit">${ic('send')} Send</button></form></section></div>`;
    },
    after() { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; }
  };
  function bubble(m, i) {
    const me_ = m.who === 'me', nm = me_ ? 'You' : WHO[m.who].name;
    if (m.status === 'failed') return `<div class="bubble me failed" role="alert"><span class="sr-only">Failed to send. </span>${esc(m.text)}<span class="meta">${ic('alert-circle')}<b>Couldn't send.</b> Check your connection. <button class="btn btn-sm btn-secondary" type="button" data-act="retry" data-i="${i}" style="min-height:2.25rem;background:#fff">${ic('refresh')} Retry</button></span></div>`;
    return `<div class="bubble ${me_ ? 'me' : ''}"><span class="sr-only">${nm}: </span>${esc(m.text)}<span class="meta">${nm} · ${ago(m.ts)}${m.status === 'sending' ? ' · Sending…' : ''}</span></div>`;
  }
  function sendReply(text) {
    const t = MSG.find(m => m.id === selMsg), msg = { who: 'me', ts: new Date().toISOString(), text, status: navigator.onLine === false ? 'failed' : 'sending' };
    t.msgs.push(msg); t.unread = false; MSG.splice(MSG.indexOf(t), 1); MSG.unshift(t); saveMsgs(); render();
    if (msg.status === 'sending') settle(t, msg);
  }
  function settle(t, msg) {
    setTimeout(() => { delete msg.status; saveMsgs(); if (route === 'messages' && selMsg === t.id) { const box = $('#msgs'); if (box) { box.innerHTML = t.msgs.map(bubble).join(''); box.scrollTop = box.scrollHeight; } } if (t.from === 'billing') return; autoReply(t); }, 700);
  }
  function autoReply(t) {
    const box = $('#msgs'); if (box && route === 'messages' && selMsg === t.id) { box.insertAdjacentHTML('beforeend', '<div class="typing" id="typing" aria-hidden="true"><i></i><i></i><i></i></div>'); box.scrollTop = box.scrollHeight; }
    setTimeout(() => {
      t.msgs.push({ who: 'team', ts: new Date().toISOString(), text: `Thanks, ${me.first}. We've got your message and someone will reply within one business day. If it's urgent, call ${VH.loc(me.home).phone}. In an emergency, call 911.` });
      const live = route === 'messages' && selMsg === t.id; if (!live) t.unread = true; saveMsgs(); chrome();
      if (live) { const b = $('#msgs'); if (b) { const ty = $('#typing'); if (ty) ty.remove(); b.innerHTML = t.msgs.map(bubble).join(''); b.scrollTop = b.scrollHeight; } announce('New message from ' + WHO[t.from].name); } else VH.toast('New message from ' + WHO[t.from].name, 'message');
    }, 1900);
  }

  /* — Documents — */
  let docCat = 'All', upErrs = [];
  VIEWS.documents = {
    title: () => 'Documents', sub: () => 'Visit summaries, results, forms and insurance, all in one place.',
    html() {
      const cats = ['All', 'Visit summaries', 'Lab results', 'Forms', 'Insurance', 'Other'];
      const list = DOCS.filter(d => docCat === 'All' || d.cat === docCat);
      return `<div class="p-grid main-side">
        <div><div class="chips" role="group" aria-label="Filter documents" style="margin-bottom:1.25rem">${cats.map(c => `<button class="chip" type="button" data-act="docCat" data-c="${c}" aria-pressed="${docCat === c}">${c}</button>`).join('')}</div>
        <p class="muted small" role="status" style="margin-bottom:.9rem">${list.length} ${list.length === 1 ? 'document' : 'documents'}</p>
        ${list.length ? list.map(d => docRow(d, true)).join('') : emptyCard('doc', docCat === 'All' ? 'No documents yet' : `No ${docCat.toLowerCase()} yet`, docCat === 'All' ? 'Visit summaries, lab results and forms appear here after your visits. You can also upload your own.' : 'Nothing in this category. Try another filter, or upload a document.')}</div>
        <aside class="p-card" aria-labelledby="upH" style="align-self:start"><h2 id="upH" style="margin-bottom:.4rem">Upload a document</h2><p class="muted small" style="margin-bottom:1rem">PDF, JPG or PNG, up to 5 MB each.</p>
          ${upErrs.length ? `<div class="alert alert-err" role="alert" style="margin-bottom:1rem">${ic('alert-circle')}<div><b>${upErrs.length === 1 ? 'We couldn’t upload that file' : 'Some files couldn’t be uploaded'}</b><ul style="margin:.4rem 0 0;padding-left:1.1rem">${upErrs.map(e => `<li>${e}</li>`).join('')}</ul></div></div>` : ''}
          <div class="field" style="margin-bottom:1rem"><label for="upCat">Type</label><select class="select" id="upCat"><option>Insurance</option><option>Forms</option><option>Other</option></select></div>
          <label class="dz" id="dz"><input type="file" id="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple><span class="icon-chip round">${ic('upload')}</span><b>Choose files</b><span class="muted small">or drag them here</span></label></aside></div>`;
    },
    after() {
      const dz = $('#dz'), f = $('#file'); if (!dz) return;
      ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', ev => handleFiles(ev.dataTransfer.files));
      f.addEventListener('change', () => handleFiles(f.files));
    }
  };
  function handleFiles(files) {
    upErrs = []; const cat = ($('#upCat') || {}).value || 'Other'; let ok = 0;
    [...files].forEach(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) { upErrs.push(`<b>${esc(f.name)}</b>: this file type isn’t supported. Use PDF, JPG or PNG.`); return; }
      if (f.size > 5 * 1024 * 1024) { upErrs.push(`<b>${esc(f.name)}</b> is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`); return; }
      DOCS.unshift({ id: 'u' + Date.now() + ok, title: f.name.replace(/\.[^.]+$/, ''), cat, date: K(today), size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB', kind: ext === 'jpeg' ? 'jpg' : ext, isNew: false }); ok++;
    });
    saveDocs(); render(); if (ok) VH.toast(`Uploaded ${ok} ${ok === 1 ? 'document' : 'documents'}`); announce(upErrs.length ? 'Upload problem: ' + upErrs.length + ' file(s) rejected' : '');
    if (upErrs.length) { const a = $('.alert-err'); if (a) a.scrollIntoView({ block: 'center' }); }
  }

  /* — Membership — */
  const mem = () => VH.plans.find(p => p.id === me.plan);
  VIEWS.membership = {
    title: () => 'Membership', sub: () => 'Your plan, benefits and billing.',
    html() {
      const pl = mem(), nextBill = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      if (!pl.price) return `<section class="plan-card"><span class="eyebrow">Your plan</span><h2>Open Door</h2><p style="max-width:34em;color:var(--ink-2)">You pay per visit and we accept insurance at every location. Join Everyday or Whole House for unlimited virtual visits, an annual exam, routine labs and priority booking.</p><div class="row" style="position:relative;z-index:1"><button class="btn btn-primary" type="button" data-act="plan">${ic('sparkle')} Compare plans</button></div></section>
        <div class="p-grid two" style="margin-top:1.25rem">${VH.plans.slice(1).map(p => `<article class="p-card"><div class="head"><h2>${p.name}</h2>${p.featured ? '<span class="badge badge-clay">Most popular</span>' : ''}</div><div class="price nums" style="font:300 2.4rem var(--font-display)">$${p.price}<small style="font:500 1rem var(--font-ui)">/month</small></div><p class="muted" style="margin:.5rem 0 1rem">${p.desc}</p><button class="btn btn-secondary btn-block" type="button" data-act="join-plan" data-plan="${p.id}">Join ${p.name}</button></article>`).join('')}</div>`;
      return `<div class="p-grid main-side"><div class="p-grid" style="align-content:start">
        <section class="plan-card"><span class="eyebrow">Your plan</span><div><h2>${pl.name}</h2><p class="nums" style="font-size:1.1rem;margin-top:.25rem">$${pl.price}/month · renews ${VH.fmt.date(nextBill, { month: 'long', day: 'numeric' })}</p></div><p style="max-width:34em;color:var(--ink-2)">${pl.desc}</p><div class="row" style="position:relative;z-index:1"><button class="btn btn-primary" type="button" data-act="plan">Change plan</button><button class="btn btn-text" type="button" data-act="cancel-plan" style="color:var(--ink)">Cancel membership</button></div></section>
        <section class="p-card" aria-labelledby="useH"><div class="head"><h2 id="useH">Your benefits this year</h2></div><div class="stack" style="--gap:1.25rem">
          <div class="meter"><div class="top"><b>Virtual visits</b><span>3 used · unlimited</span></div><div class="progress"><i style="width:12%"></i></div></div>
          <div class="meter"><div class="top"><b>Annual wellness exam</b><span>1 of 1 used</span></div><div class="progress"><i style="width:100%"></i></div></div>
          <div class="meter"><div class="top"><b>Routine labs</b><span>1 of 2 used</span></div><div class="progress"><i style="width:50%"></i></div></div>
          <div class="meter"><div class="top"><b>Nutrition &amp; mental wellness</b><span>Member rate applied</span></div><div class="progress"><i style="width:30%"></i></div></div></div></section>
        <section class="p-card" aria-labelledby="billH"><div class="head"><h2 id="billH">Billing</h2></div><div class="row between" style="padding-bottom:1rem"><div class="row" style="gap:.9rem;flex-wrap:nowrap"><span class="icon-chip">${ic('card')}</span><div><b>Visa ending 4242</b><div class="sub muted small">Fictional card for this concept</div></div></div><button class="btn btn-soft btn-sm" type="button" data-act="toast" data-m="Payment methods are not editable in this concept.">Update</button></div>
          <div class="rows">${[0, 1, 2].map(i => { const d = new Date(today.getFullYear(), today.getMonth() - i, 1); return `<div class="rowx"><span class="icon-chip honey">${ic('doc')}</span><div><div class="ttl">${VH.fmt.date(d, { month: 'long', year: 'numeric' })} invoice</div><div class="sub">$${pl.price}.00 · Paid</div></div><button class="icon-btn" type="button" data-act="inv" data-i="${i}" aria-label="Download ${VH.fmt.date(d, { month: 'long', year: 'numeric' })} invoice">${ic('download')}</button></div>`; }).join('')}</div></section></div>
        <div class="p-grid" style="align-content:start"><div class="member-card" role="img" aria-label="Membership card for ${esc(me.first)} ${esc(me.last)}"><div class="row between">${VH.mark({ arch: 'var(--sage-200)', head: 'var(--honey-400)', cls: '' }).replace('<svg ', '<svg style="width:1.8rem;height:2rem" ')}<small>${pl.name}</small></div><div><small>Member</small><div class="nm">${esc(me.first)} ${esc(me.last)}</div><small>${me.memberId}</small></div></div>
        ${me.plan === 'house' ? '' : `<section class="p-card" aria-labelledby="famH"><h2 id="famH" style="margin-bottom:.5rem">Add your household</h2><p class="muted small">Whole House covers up to four people with a family coordinator.</p><button class="btn btn-secondary btn-sm" style="margin-top:1rem" type="button" data-act="plan">Compare plans</button></section>`}</div></div>`;
    }
  };

  /* — Settings — */
  VIEWS.settings = {
    title: () => 'Profile & settings', sub: () => 'Your details, notifications and accessibility preferences.',
    html() {
      const nf = load('notif', { sms: true, email: true, msg: true, res: true, news: false }), pf = load('prefs', {}), t = pf.text || '';
      const sw = (k, t_, d) => `<label class="switch switch-row"><span><b>${t_}</b><span class="muted small">${d}</span></span><input type="checkbox" role="switch" data-act="notif" data-k="${k}" ${nf[k] ? 'checked' : ''}></label>`;
      return `<section class="set-sec"><div><h2>Profile</h2><p class="desc">Used to confirm visits and send reminders.</p></div>
        <form class="p-card" id="profile" novalidate><div class="stack" style="--gap:1.15rem"><div class="field-row">${pfield('first', 'First name', me.first, 'given-name')}${pfield('last', 'Last name', me.last, 'family-name')}</div>${pfield('email', 'Email', me.email, 'email', 'email')}${pfield('phone', 'Mobile phone', me.phone, 'tel', 'tel')}
          <div class="field"><label for="p-home">Home house</label><select class="select" id="p-home">${VH.locations.map(l => `<option value="${l.id}" ${me.home === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}</select></div>
          <div class="row"><button class="btn btn-primary" type="submit">Save changes</button></div></div></form></section>
        <section class="set-sec"><div><h2>Notifications</h2><p class="desc">Choose how we reach you. Appointment confirmations are always sent.</p></div><div class="p-card">${sw('sms', 'Text reminders', 'A text 24 hours before each visit')}${sw('email', 'Email reminders', 'Visit details and receipts')}${sw('msg', 'New message alerts', 'When your care team replies')}${sw('res', 'Results ready', 'When a new document is added')}${sw('news', 'Monthly newsletter', 'Seasonal guides and house news')}</div></section>
        <section class="set-sec"><div><h2>Accessibility</h2><p class="desc">Make Vita House comfortable for you. Preferences are saved on this device.</p></div>
          <div class="p-card"><fieldset class="fieldset"><legend>Text size</legend><div class="segmented" role="radiogroup">${[['', 'Standard'], ['lg', 'Large'], ['xl', 'Extra large']].map(([v, l]) => `<label><input type="radio" name="text" value="${v}" ${t === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
            <div class="preview-text"><b>Preview</b><p style="margin-top:.25rem">Your next visit is confirmed. Bring your photo ID and insurance card.</p></div>
            <div style="margin-top:1.25rem">${`<label class="switch switch-row"><span><b>Reduce motion</b><span class="muted small">Turns off animation across Vita House</span></span><input type="checkbox" role="switch" id="motion" ${pf.motion === 'reduce' ? 'checked' : ''}></label>`}</div></div></section>
        <section class="set-sec"><div><h2>Privacy &amp; data</h2><p class="desc">You're in control of your information.</p></div><div class="p-card"><div class="row"><button class="btn btn-secondary btn-sm" type="button" data-act="export">${ic('download')} Download my data</button><button class="btn btn-secondary btn-sm" type="button" data-act="toast" data-m="Consent preferences are not editable in this concept.">Manage consent</button></div></div></section>
        <section class="set-sec"><div><h2>Concept demo</h2><p class="desc">Controls for exploring this design.</p></div><div class="p-card" style="border-style:dashed;border-color:var(--clay-500);background:var(--blush-100)"><label class="switch switch-row"><span><b>View as a new patient</b><span class="muted small">Shows empty states throughout the dashboard</span></span><input type="checkbox" role="switch" id="newpt" ${VH.store.get('empty', false) ? 'checked' : ''}></label>
          <div class="row" style="margin-top:1rem"><button class="btn btn-secondary btn-sm" type="button" data-act="reset">${ic('refresh')} Reset demo data</button><button class="btn btn-text btn-sm" type="button" data-act="toast" data-m="This is a concept demo, so you stay signed in.">${ic('logout')} Sign out</button></div></div></section>`;
    },
    after() {
      $('#profile').addEventListener('submit', e => {
        e.preventDefault();
        const v = id => $('#p-' + id).value.trim(), errs = {};
        if (!v('first')) errs.first = 'Enter your first name.'; if (!v('last')) errs.last = 'Enter your last name.';
        if (!v('email')) errs.email = 'Enter your email address.'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 'Enter an email address like name@example.com.';
        if (v('phone').replace(/\D/g, '').length < 10) errs.phone = 'Enter a 10-digit number, like (555) 555-0100.';
        ['first', 'last', 'email', 'phone'].forEach(k => { const f = $('#p-' + k).closest('.field'), m = errs[k]; f.classList.toggle('is-invalid', !!m); $('#p-' + k).toggleAttribute('aria-invalid', !!m); $('#p-' + k + '-e').innerHTML = m ? ic('alert-circle') + `<span>${m}</span>` : ''; });
        const first = Object.keys(errs)[0]; if (first) { $('#p-' + first).focus(); return; }
        Object.assign(me, { first: v('first'), last: v('last'), email: v('email'), phone: v('phone'), home: $('#p-home').value }); save('profile', { first: me.first, last: me.last, email: me.email, phone: me.phone, home: me.home });
        chrome(); VH.toast('Profile saved');
      });
    }
  };
  const pfield = (id, label, val, ac, type = 'text') => `<div class="field"><label for="p-${id}">${label}</label><input class="input" id="p-${id}" type="${type}" value="${esc(val)}" autocomplete="${ac}" aria-describedby="p-${id}-e"><p class="error-text" id="p-${id}-e"></p></div>`;

  /* ---------- router ---------- */
  let first = true;
  function parse() { const h = location.hash.replace(/^#\/?/, '').split('/'); return [h[0] || 'home', h[1]]; }
  function render() {
    const [name, param] = parse(); route = VIEWS[name] ? name : 'home';
    if (route === 'messages' && param && MSG.find(m => m.id === param)) { selMsg = param; mailOpen = true; }
    if (route === 'messages' && selMsg) { const t = MSG.find(m => m.id === selMsg); if (t && t.unread && (mailOpen || matchMedia('(min-width:761px)').matches)) { t.unread = false; saveMsgs(); } }
    const v = VIEWS[route];
    $('#pageH').textContent = v.title(); $('#pageSub').textContent = v.sub();
    $('#view').innerHTML = v.html(); if (v.after) v.after();
    chrome();
    document.title = `${v.title()} — Vita House patient dashboard`;
  }
  function navigate() {
    mailOpen = mailOpen && parse()[0] === 'messages';
    render(); window.scrollTo({ top: 0 });
    if (!first && !VH.embed) { $('#pageH').focus({ preventScroll: true }); announce($('#pageH').textContent); }
    first = false;
  }
  window.addEventListener('hashchange', navigate);

  /* ---------- dialogs ---------- */
  function apptDialog(id) {
    const a = findAppt(id); if (!a) return;
    const p = VH.prov(a.providerId), l = VH.loc(a.locationId), s = VH.svc(a.serviceId), d = VH.fmt.parse(a.date), up = a.status === 'upcoming' && diff(a.date) >= 0;
    openModal(`<span class="badge ${up ? 'badge-ok' : a.status === 'cancelled' ? 'badge-err' : ''}">${up ? 'Confirmed' : a.status === 'cancelled' ? 'Cancelled' : 'Completed'}</span><h3 style="font-size:1.7rem;margin:.6rem 0 1rem">${s.name}</h3>
      <dl class="kv"><div><dt>When</dt><dd>${VH.fmt.date(d, { weekday: 'long', month: 'long', day: 'numeric' })}<br>${VH.fmt.time(a.time)}</dd></div><div><dt>With</dt><dd>${p.name}<br><span class="muted" style="font-weight:400">${p.role}</span></dd></div><div><dt>Where</dt><dd>${l.virtual ? 'Video visit' : l.name + '<br><span class="muted" style="font-weight:400">' + l.addr + ', ' + l.city + '</span>'}</dd></div><div><dt>Format</dt><dd>${l.virtual ? 'Secure video' : 'In person'}</dd></div></dl>
      ${a.reason ? `<div class="card-flat" style="margin-top:1.25rem"><span class="eyebrow plain">What you told us</span><p style="margin-top:.35rem">${esc(a.reason)}</p></div>` : ''}
      <div class="actions" style="justify-content:space-between">${up ? `<button class="btn btn-text" type="button" data-act="cancel" data-id="${a.id}" style="color:var(--brick)">Cancel appointment</button>` : '<span></span>'}<span class="row">${up ? `<button class="btn btn-soft" type="button" data-act="ics" data-id="${a.id}">${ic('calendar-check')} Add to calendar</button><button class="btn btn-secondary" type="button" data-act="resched" data-id="${a.id}">Reschedule</button>` : ''}<button class="btn btn-primary" type="button" data-close>Close</button></span></div>`, { wide: true });
  }
  function cancelDialog(id) {
    const a = findAppt(id), s = VH.svc(a.serviceId), p = VH.prov(a.providerId);
    openModal(`<h3>Cancel this appointment?</h3><p class="muted">${s.name} with ${p.name} on <b>${VH.fmt.date(a.date, { weekday: 'long', month: 'long', day: 'numeric' })}</b> at ${VH.fmt.time(a.time)}.</p>
      <div class="alert alert-info" style="margin-top:1rem">${ic('info')}<div>Changes are free up to 24 hours before your visit. Later cancellations may carry a $25 fee (illustrative).</div></div>
      <div class="field" style="margin-top:1rem"><label for="why">Reason <span class="opt">(optional)</span></label><select class="select" id="why"><option>Choose one</option><option>Schedule conflict</option><option>Feeling better</option><option>Booked another time</option><option>Other</option></select></div>
      <div class="actions"><button class="btn btn-secondary" type="button" data-close autofocus>Keep appointment</button><button class="btn btn-danger" type="button" data-act="do-cancel" data-id="${a.id}">Yes, cancel it</button></div>`, { alert: true });
  }
  function reschedDialog(id) {
    const a = findAppt(id), p = VH.prov(a.providerId), mode = VH.loc(a.locationId).virtual ? 'video' : 'in-person', opts = [];
    for (let i = 0; i < 28 && opts.length < 10; i++) { const k = K(VH.fmt.plus(today, i)), sl = VH.slots(p.id, k, mode).filter(t => !(k === a.date && t === a.time)); if (sl.length) opts.push([k, sl]); }
    if (!opts.length) { openModal(`<h3>No other times right now</h3><p class="muted">${p.name} has no openings in the next four weeks. Message the care team and we'll find you a time.</p><div class="actions"><button class="btn btn-secondary" type="button" data-close>Close</button><a class="btn btn-primary" href="#/messages" data-close>Message the team</a></div>`); return; }
    const slotsHtml = k => { const sl = (opts.find(o => o[0] === k) || opts[0])[1]; return `<fieldset class="fieldset"><legend class="sr-only">Time</legend><div class="slots">${sl.map(t => `<label class="slot"><input type="radio" name="rt" value="${t}"><span>${VH.fmt.time(t)}</span></label>`).join('')}</div></fieldset>`; };
    openModal(`<h3>Reschedule your visit</h3><p class="muted">${VH.svc(a.serviceId).name} with ${p.name}. Currently ${VH.fmt.date(a.date, { weekday: 'short', month: 'short', day: 'numeric' })} at ${VH.fmt.time(a.time)}.</p>
      <div class="field" style="margin-top:1.25rem"><label for="rd">New day</label><select class="select" id="rd">${opts.map(([k, sl]) => `<option value="${k}">${VH.fmt.date(k, { weekday: 'long', month: 'long', day: 'numeric' })} · ${sl.length} times</option>`).join('')}</select></div>
      <div id="rslots" style="margin-top:1rem">${slotsHtml(opts[0][0])}</div><p class="error-text" id="rerr" role="alert" style="margin-top:.75rem"></p>
      <div class="actions"><button class="btn btn-secondary" type="button" data-close>Keep current time</button><button class="btn btn-primary" type="button" data-act="do-resched" data-id="${a.id}">Confirm new time</button></div>`, { wide: true });
    $('#rd').addEventListener('change', e => { $('#rslots').innerHTML = slotsHtml(e.target.value); });
  }
  function summaryDialog(id) {
    const a = findAppt(id), p = VH.prov(a.providerId), s = VH.svc(a.serviceId);
    openModal(`<span class="badge">Visit summary · fictional</span><h3 style="font-size:1.6rem;margin:.6rem 0 .25rem">${s.name}</h3><p class="muted">${VH.fmt.date(a.date, { weekday: 'long', month: 'long', day: 'numeric' })} with ${p.name}</p>
      <div class="stack" style="--gap:1.1rem;margin-top:1.25rem"><div><b>What we talked about</b><p class="muted">Your goals for the year, how your week usually looks, and a few questions you brought with you.</p></div><div><b>Next steps</b><ul style="margin:.4rem 0 0;padding-left:1.1rem;color:var(--ink-2)"><li>Try one small change from our plan for the next few weeks.</li><li>Book a follow-up in about three months.</li><li>Message us any time if something changes.</li></ul></div></div>
      <div class="alert alert-info" style="margin-top:1.25rem">${ic('info')}<div>This is an invented sample for a concept project, not medical advice.</div></div>
      <div class="actions"><button class="btn btn-secondary" type="button" data-close>Close</button><a class="btn btn-primary" href="book.html?service=${a.serviceId}&provider=${a.providerId}">Book a follow-up</a></div>`, { wide: true });
  }
  function planDialog() {
    openModal(`<h3>Choose your plan</h3><p class="muted">Pricing is illustrative. Changes take effect at your next billing date.</p><fieldset class="fieldset" style="margin-top:1.25rem"><legend class="sr-only">Plan</legend><div class="opts one" style="display:grid;gap:.75rem">${VH.plans.map(p => `<label class="choice"><input type="radio" name="plan" value="${p.id}" ${me.plan === p.id ? 'checked' : ''}><span class="ct"><b>${p.name} · ${p.price ? '$' + p.price + '/month' : 'Free'}</b><span>${p.desc}</span></span><span class="tick">${ic('check')}</span></label>`).join('')}</div></fieldset>
      <div class="actions"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" data-act="do-plan">Save plan</button></div>`, { wide: true });
  }
  function newMsgDialog() {
    openModal(`<h3>New message</h3><p class="muted">Not for emergencies. If you need urgent help, call 911.</p><form id="nm" novalidate class="stack" style="--gap:1rem;margin-top:1rem">
      <div class="field"><label for="nm-to">To</label><select class="select" id="nm-to"><option value="team">East Austin care team</option><option value="okafor">Dr. Amara Okafor</option><option value="billing">Billing</option></select></div>
      <div class="field"><label for="nm-sub">Subject</label><input class="input" id="nm-sub" aria-describedby="nm-sub-e"><p class="error-text" id="nm-sub-e"></p></div>
      <div class="field"><label for="nm-body">Message</label><textarea class="textarea" id="nm-body" aria-describedby="nm-body-e"></textarea><p class="error-text" id="nm-body-e"></p></div>
      <div class="actions" style="margin-top:.5rem"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit">${ic('send')} Send message</button></div></form>`, { wide: true });
    $('#nm').addEventListener('submit', e => {
      e.preventDefault(); let bad = null;
      [['sub', 'Add a short subject.'], ['body', 'Write your message.']].forEach(([k, m]) => { const el = $('#nm-' + k), no = !el.value.trim(); el.closest('.field').classList.toggle('is-invalid', no); el.toggleAttribute('aria-invalid', no); $('#nm-' + k + '-e').innerHTML = no ? ic('alert-circle') + `<span>${m}</span>` : ''; if (no && !bad) bad = el; });
      if (bad) return bad.focus();
      const t = { id: 'n' + Date.now(), from: $('#nm-to').value, subject: $('#nm-sub').value.trim(), unread: false, msgs: [{ who: 'me', ts: new Date().toISOString(), text: $('#nm-body').value.trim() }] };
      MSG.unshift(t); selMsg = t.id; mailOpen = true; saveMsgs(); closeModal(); location.hash = '#/messages'; render(); VH.toast('Message sent'); if (t.from !== 'billing') autoReply(t);
    });
  }
  function pcpDialog() {
    const list = VH.providers.filter(p => p.accepting && p.services.includes('primary')), cur_ = load('pcp', 'okafor');
    openModal(`<h3>Choose your primary provider</h3><p class="muted">Providers who are welcoming new primary care patients.</p><fieldset class="fieldset" style="margin-top:1.25rem"><legend class="sr-only">Primary provider</legend><div style="display:grid;gap:.75rem">${list.map(p => `<label class="choice"><input type="radio" name="pcp" value="${p.id}" ${cur_ === p.id ? 'checked' : ''}>${pAvatar(p, 'lg')}<span class="ct"><b>${p.name}, ${p.creds}</b><span>${p.role}</span></span><span class="tick">${ic('check')}</span></label>`).join('')}</div></fieldset><div class="actions"><button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" data-act="do-pcp">Save</button></div>`, { wide: true });
  }
  function moreSheet() {
    openModal(`<div class="grab" aria-hidden="true"></div><h3 style="font-size:1.3rem;margin-bottom:.5rem">More</h3>${MORE.map(k => { const [, t, i] = NAV.find(n => n[0] === k); return `<a class="sheet-link" href="#/${k}" data-close>${ic(i)} ${t}</a>`; }).join('')}<a class="sheet-link" href="index.html">${ic('arrow-left')} Back to website</a>`, { sheet: true });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    if (!e.target.closest('.bell') && !e.target.closest('.pop')) $$('.pop').forEach(p => { p.remove(); const b = $('[data-act=bell][aria-expanded=true]'); if (b) b.setAttribute('aria-expanded', 'false'); });
    const c = e.target.closest('[data-act]'); if (!c || c.getAttribute('aria-disabled') === 'true') return;
    const act = c.dataset.act, id = c.dataset.id;
    switch (act) {
      case 'bell': {
        const wrap = c.closest('.bell'), open = c.getAttribute('aria-expanded') === 'true'; $$('.pop').forEach(p => p.remove());
        c.setAttribute('aria-expanded', String(!open)); if (open) break;
        const items = [];
        const nx = upcoming()[0]; if (nx) items.push(['calendar-check', `Upcoming: ${VH.svc(nx.serviceId).name}`, `${VH.fmt.rel(nx.date)}, ${VH.fmt.time(nx.time)}`, '#/appointments']);
        MSG.filter(m => m.unread).forEach(m => items.push(['message', m.subject, `${WHO[m.from].name} · ${ago(m.msgs[m.msgs.length - 1].ts)}`, '#/messages/' + m.id]));
        DOCS.filter(d => d.isNew).forEach(d => items.push(['flask', d.title, 'New result', '#/documents']));
        wrap.insertAdjacentHTML('beforeend', `<div class="pop" role="region" aria-label="Notifications"><h2>Notifications</h2>${items.length ? items.map(([i, t, s, h]) => `<a href="${h}"><span class="icon-chip" style="width:2.5rem;height:2.5rem">${ic(i)}</span><span><b>${esc(t)}</b><span class="t" style="display:block">${esc(s)}</span></span></a>`).join('') : `<p class="muted small" style="padding:.75rem">You're all caught up.</p>`}</div>`); break;
      }
      case 'more': moreSheet(); break;
      case 'open-appt': closeModal(); apptDialog(id); break;
      case 'resched': closeModal(); reschedDialog(id); break;
      case 'cancel': closeModal(); cancelDialog(id); break;
      case 'summary': summaryDialog(id); break;
      case 'ics': VH.download('vita-house-appointment.ics', VH.ics(findAppt(id)), 'text/calendar'); VH.toast('Calendar file downloaded'); break;
      case 'do-cancel': patchAppt(id, { status: 'cancelled' }); closeModal(); render(); VH.toast('Appointment cancelled'); announce('Appointment cancelled'); break;
      case 'do-resched': {
        const t = $('input[name=rt]:checked'); if (!t) { const er = $('#rerr'); er.innerHTML = ic('alert-circle') + '<span>Choose a new time to continue.</span>'; er.style.display = 'flex'; break; }
        const nd = $('#rd').value, nt = t.value; patchAppt(id, { date: nd, time: nt }); closeModal(); render();
        VH.toast(`Rescheduled to ${VH.fmt.date(nd, { weekday: 'short', month: 'short', day: 'numeric' })} at ${VH.fmt.time(nt)}`); break;
      }
      case 'apptTab': apptTab = c.dataset.k; render(); { const t = $('#tab-' + apptTab); if (t) t.focus(); } break;
      case 'checkin': VH.toast('You’re checked in. We’ll text you when it’s time to come in.'); break;
      case 'join': VH.toast('Opening your secure video room (demo)', 'video'); break;
      case 'thread': selMsg = id; mailOpen = true; { const t = MSG.find(m => m.id === id); if (t && t.unread) { t.unread = false; saveMsgs(); } } render(); break;
      case 'back-list': mailOpen = false; render(); break;
      case 'new-msg': newMsgDialog(); break;
      case 'retry': { const t = MSG.find(m => m.id === selMsg), msg = t.msgs[+c.dataset.i]; msg.status = 'sending'; render(); settle(t, msg); break; }
      case 'docCat': docCat = c.dataset.c; render(); break;
      case 'dl': { const d = DOCS.find(x => x.id === id); d.isNew = false; saveDocs(); VH.download(d.title.replace(/[^\w ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.txt', `${d.title}\n${d.cat} · ${d.date}\n\nFictional sample document for the Vita House concept project.`); render(); VH.toast('Download started'); break; }
      case 'del-doc': { const d = DOCS.find(x => x.id === id); openModal(`<h3>Delete this document?</h3><p class="muted">“${esc(d.title)}” will be removed from your dashboard.</p><div class="actions"><button class="btn btn-secondary" type="button" data-close autofocus>Keep it</button><button class="btn btn-danger" type="button" data-act="do-del" data-id="${id}">Delete</button></div>`, { alert: true }); break; }
      case 'do-del': DOCS = DOCS.filter(x => x.id !== id); saveDocs(); closeModal(); render(); VH.toast('Document deleted'); break;
      case 'plan': closeModal(); planDialog(); break;
      case 'join-plan': me.plan = c.dataset.plan; save('plan', me.plan); render(); VH.toast('Welcome to ' + mem().name); break;
      case 'do-plan': { const v = ($('input[name=plan]:checked') || {}).value; if (v) { me.plan = v; save('plan', v); closeModal(); render(); VH.toast('Plan updated to ' + mem().name); } break; }
      case 'cancel-plan': openModal(`<h3>Cancel your membership?</h3><p class="muted">You'll move to Open Door at your next billing date. You can still book visits and use insurance.</p><div class="actions"><button class="btn btn-secondary" type="button" data-close autofocus>Keep my plan</button><button class="btn btn-danger" type="button" data-act="do-cancel-plan">Cancel membership</button></div>`, { alert: true }); break;
      case 'do-cancel-plan': me.plan = 'open'; save('plan', 'open'); closeModal(); render(); VH.toast('Membership cancelled'); break;
      case 'inv': { const d = new Date(today.getFullYear(), today.getMonth() - (+c.dataset.i), 1); VH.download('vita-house-invoice.txt', `Vita House invoice\n${VH.fmt.date(d, { month: 'long', year: 'numeric' })}\n$${mem().price}.00 · Paid\n\nFictional invoice for a concept project.`); VH.toast('Invoice downloaded'); break; }
      case 'pcp': pcpDialog(); break;
      case 'do-pcp': { const v = ($('input[name=pcp]:checked') || {}).value; if (v) { save('pcp', v); closeModal(); render(); VH.toast('Primary provider updated'); } break; }
      case 'toast': VH.toast(c.dataset.m, 'info'); break;
      case 'export': VH.download('my-vita-house-data.json', JSON.stringify({ patient: me, appointments: appts(), messages: MSG.length, documents: DOCS.length, note: 'Fictional demo data.' }, null, 2), 'application/json'); VH.toast('Your data was downloaded'); break;
      case 'reset': { ['appts', 'apptState', 'msgs', 'docs', 'profile', 'empty', 'plan', 'pcp', 'prep', 'notif'].forEach(k => VH.store.del(k)); location.reload(); break; }
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.act === 'prep') { setPrep(findAppt(t.dataset.id), +t.dataset.i, t.checked); render(); const el = $(`[data-act=prep][data-i="${t.dataset.i}"]`); if (el) el.focus(); }
    if (t.dataset.act === 'notif') { const nf = load('notif', { sms: true, email: true, msg: true, res: true, news: false }); nf[t.dataset.k] = t.checked; save('notif', nf); VH.toast('Preference saved'); }
    if (t.name === 'text') { const pf = VH.store.get('prefs', {}); pf.text = t.value; VH.store.set('prefs', pf); if (t.value) document.documentElement.dataset.text = t.value; else delete document.documentElement.dataset.text; }
    if (t.id === 'motion') { const pf = VH.store.get('prefs', {}); pf.motion = t.checked ? 'reduce' : ''; VH.store.set('prefs', pf); if (t.checked) document.documentElement.dataset.motion = 'reduce'; else delete document.documentElement.dataset.motion; }
    if (t.id === 'newpt') { VH.store.set('empty', t.checked); render(); VH.toast(t.checked ? 'Showing a new-patient dashboard' : 'Back to the demo patient'); setTimeout(() => { const s = $('#newpt'); if (s) s.focus(); }, 0); }
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'composer') return; e.preventDefault();
    const ta = $('#reply'), text = ta.value.trim(), er = $('#reply-e');
    if (!text) { ta.closest('.field').classList.add('is-invalid'); ta.setAttribute('aria-invalid', 'true'); er.innerHTML = ic('alert-circle') + '<span>Write a message first.</span>'; ta.focus(); return; }
    sendReply(text); setTimeout(() => { const r = $('#reply'); if (r) r.focus(); }, 0);
  });
  document.addEventListener('input', e => { if (e.target.id === 'reply') { const f = e.target.closest('.field'); f.classList.remove('is-invalid'); e.target.removeAttribute('aria-invalid'); $('#reply-e').innerHTML = ''; } });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'reply' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#composer').requestSubmit(); }
    if (e.key === 'Escape') { $$('.pop').forEach(p => p.remove()); }
    const tab = e.target.closest && e.target.closest('[role=tab]');
    if (tab && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { const ts = $$('[role=tab]'), i = ts.indexOf(tab), n = ts[(i + (e.key === 'ArrowRight' ? 1 : -1) + ts.length) % ts.length]; e.preventDefault(); apptTab = n.dataset.k; render(); $('#tab-' + apptTab).focus(); }
  });

  /* ---------- go ---------- */
  me.plan = VH.emptyMode ? 'open' : (VH.store.get('plan', null) || me.plan);
  navigate();
  if (P.get('sheet') === 'more') moreSheet();
})();
