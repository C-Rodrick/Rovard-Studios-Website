/* AFA'A PAY — platform data + business logic.
   Browser-only prototype: state lives in localStorage, payments are simulated, passwords are salted SHA-256
   (demo grade — a real build needs a server, real PSP/mobile-money integrations and proper KYC). */
(function () {
  const KEY = 'afaa.platform.v1', DAY = 864e5, HOUR = 36e5;
  const RATES = { starter: .015, business: .01 };
  let db = null;

  const now = () => Date.now() + (db && db.skew || 0);
  const uid = p => p + Math.random().toString(36).slice(2, 9);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { throw new Error('Browser storage is full. Reset demo data in the sidebar.'); } };
  const fail = m => { throw new Error(m); };

  async function sha(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return 'x' + (h >>> 0).toString(16);
  }

  /* ---------- helpers ---------- */
  const cur = () => db.users[db.session] || null;
  const roleOf = (d, id) => d.buyerId === id ? 'buyer' : d.sellerId === id ? 'seller' : null;
  const rateOf = u => RATES[u && u.plan] || RATES.starter;
  function split(m, payer, rate) {
    const f = Math.round(m.amount * rate);
    const buyer = payer === 'buyer' ? f : payer === 'split' ? Math.round(f / 2) : 0;
    return { buyer, seller: f - buyer, total: f };
  }
  const totals = d => {
    const t = { amount: 0, buyerFee: 0, sellerFee: 0, held: 0, released: 0 };
    d.milestones.forEach(m => {
      const f = split(m, d.feePayer, d.rate);
      t.amount += m.amount; t.buyerFee += f.buyer; t.sellerFee += f.seller;
      if (m.status === 'pending' || m.status === 'submitted') t.held += m.amount;
      if (m.status === 'released') t.released += m.amount;
    });
    t.fund = t.amount + t.buyerFee; return t;
  };
  const ev = (d, by, text) => d.events.push({ at: now(), by, text });
  const notify = (to, text, deal) => { if (to) db.notifs.unshift({ id: uid('n'), to, text, deal, at: now(), read: false }); db.notifs.length = Math.min(db.notifs.length, 200); };
  const wtx = (to, type, amt, label, deal) => {
    const u = db.users[to]; u.bal += amt;
    db.wtx.unshift({ id: uid('t'), uid: to, type, amt, label, deal: deal || null, at: now(), bal: u.bal });
  };
  const deal = id => db.deals[id] || fail('Deal not found.');
  const name = id => (db.users[id] || {}).name || 'Unknown';
  const dealRef = () => 'AFP-' + String(48000 + Object.keys(db.deals).length * 7 + Math.floor(Math.random() * 6)).padStart(5, '0');

  /* ---------- auth ---------- */
  async function signup({ name: n, email, phone, password, biz }) {
    email = (email || '').trim().toLowerCase(); n = (n || '').trim();
    if (n.length < 2) fail('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) fail('Enter a valid email address.');
    if (!/^[+\d][\d\s]{7,}$/.test((phone || '').trim())) fail('Enter a valid mobile number.');
    if ((password || '').length < 8) fail('Password must be at least 8 characters.');
    if (Object.values(db.users).some(u => u.email === email)) fail('An account with this email already exists.');
    const salt = uid('s'), id = uid('u');
    db.users[id] = { id, name: n, email, phone: phone.trim(), biz: (biz || '').trim(), salt, hash: await sha(salt + password), role: 'user', plan: 'starter', kyc: { level: 0 }, bal: 0, created: now() };
    Object.values(db.deals).forEach(d => { // attach pending invitations
      if (d.invite && d.invite.email === email) { d[d.invite.as + 'Id'] = id; delete d.invite; ev(d, id, n + ' joined Afa\'a Pay'); notify(d.createdBy, n + ' joined and can now review "' + d.title + '".', d.id); }
    });
    db.session = id; save(); return db.users[id];
  }
  async function login(email, password) {
    const u = Object.values(db.users).find(x => x.email === (email || '').trim().toLowerCase());
    if (!u || u.hash !== await sha(u.salt + (password || ''))) fail('Incorrect email or password.');
    db.session = u.id; save(); return u;
  }
  const logout = () => { db.session = null; save(); };

  /* ---------- deals ---------- */
  function createDeal(i) {
    const me = cur() || fail('Please sign in.');
    const title = (i.title || '').trim(); if (title.length < 3) fail('Give the deal a short title.');
    const ms = (i.milestones || []).map((m, k) => ({ id: 'm' + (k + 1), title: (m.title || '').trim() || 'Milestone ' + (k + 1), amount: Math.round(+m.amount), days: Math.max(1, Math.round(+m.days) || 7), status: 'pending' }));
    if (!ms.length) fail('Add at least one milestone.');
    if (ms.some(m => !(m.amount >= 1000))) fail('Each milestone must be at least 1 000 XAF.');
    const email = (i.counterparty || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) fail('Enter the other party\'s email address.');
    if (email === me.email) fail('You cannot make a deal with yourself.');
    const other = Object.values(db.users).find(u => u.email === email);
    const mine = i.role === 'seller' ? 'seller' : 'buyer', theirs = mine === 'buyer' ? 'seller' : 'buyer';
    const d = {
      id: uid('d'), ref: dealRef(), title, desc: (i.desc || '').trim(), currency: 'XAF', createdBy: me.id, created: now(), status: 'proposed',
      buyerId: null, sellerId: null, milestones: ms, feePayer: i.feePayer || 'seller', rate: rateOf(me), autoHours: +i.autoHours || 48,
      signed: {}, events: [], messages: [], dispute: null, fundedAt: null,
    };
    d[mine + 'Id'] = me.id;
    if (other) d[theirs + 'Id'] = other.id; else d.invite = { email, as: theirs };
    d.signed[me.id] = now();
    ev(d, me.id, me.name + ' proposed this deal and signed the contract');
    db.deals[d.id] = d; notify(other && other.id, me.name + ' invited you to a deal: "' + title + '".', d.id);
    save(); return d;
  }
  function accept(id) {
    const me = cur(), d = deal(id);
    if (d.status !== 'proposed' || d.createdBy === me.id || !roleOf(d, me.id)) fail('You can\'t accept this deal.');
    d.signed[me.id] = now(); d.status = 'awaiting_funds'; ev(d, me.id, me.name + ' accepted and signed the contract');
    notify(d.createdBy, me.name + ' accepted "' + d.title + '".' + (d.buyerId ? ' Waiting for funding.' : ''), id); save();
  }
  function cancel(id, why) {
    const me = cur(), d = deal(id);
    if (!roleOf(d, me.id) && me.id !== d.createdBy) fail('Not allowed.');
    if (!['proposed', 'awaiting_funds'].includes(d.status)) fail('Funded deals can\'t be cancelled. Open a dispute instead.');
    d.status = 'cancelled'; ev(d, me.id, me.name + (d.createdBy === me.id ? ' cancelled' : ' declined') + ' the deal' + (why ? ': ' + why : ''));
    [d.buyerId, d.sellerId].forEach(x => x !== me.id && notify(x, '"' + d.title + '" was ' + (d.createdBy === me.id ? 'cancelled.' : 'declined.'), id)); save();
  }
  function fund(id) {
    const me = cur(), d = deal(id), t = totals(d);
    if (d.status !== 'awaiting_funds') fail('This deal isn\'t waiting for funds.');
    if (d.buyerId !== me.id) fail('Only the buyer can fund escrow.');
    if (me.bal < t.fund) fail('Insufficient wallet balance. Top up ' + fmt(t.fund - me.bal) + ' XAF first.');
    wtx(me.id, 'escrow_fund', -t.fund, 'Escrow funded · ' + d.title, id);
    d.status = 'active'; d.fundedAt = now(); ev(d, me.id, me.name + ' funded escrow with ' + fmt(t.fund) + ' XAF. Funds are now held.');
    notify(d.sellerId, 'Escrow funded for "' + d.title + '". You can start work.', id); save();
  }
  function submit(id, mid, { note, img }) {
    const me = cur(), d = deal(id), m = d.milestones.find(x => x.id === mid);
    if (d.status !== 'active') fail('Deal is not active.');
    if (d.sellerId !== me.id) fail('Only the seller can submit delivery.');
    const idx = d.milestones.indexOf(m);
    if (!m || m.status !== 'pending' || d.milestones.slice(0, idx).some(x => x.status === 'pending' || x.status === 'submitted')) fail('Finish earlier milestones first.');
    if (!(note || '').trim()) fail('Describe what you delivered (tracking number, link, notes).');
    const due = d.fundedAt + d.milestones.slice(0, idx + 1).reduce((s, x) => s + x.days, 0) * DAY;
    m.status = 'submitted'; m.evidence = { note: note.trim(), img: img || null, at: now() }; m.onTime = now() <= due; m.due = due;
    ev(d, me.id, me.name + ' submitted delivery for "' + m.title + '"' + (m.onTime ? '' : ' (late)'));
    notify(d.buyerId, 'Delivery submitted for "' + m.title + '". Review within ' + d.autoHours + 'h or it auto-releases.', id); save();
  }
  function settle(d, m, p, by) {
    const f = split(m, d.feePayer, d.rate), S = Math.round(m.amount * p), bf = Math.round(f.buyer * p), sf = Math.round(f.seller * p);
    const sellerGets = S - sf, buyerGets = m.amount + f.buyer - S - bf;
    if (sellerGets > 0) wtx(d.sellerId, 'escrow_release', sellerGets, 'Payment received · ' + d.title + ' · ' + m.title, d.id);
    if (buyerGets > 0) wtx(d.buyerId, 'refund', buyerGets, 'Refund · ' + d.title + ' · ' + m.title, d.id);
    db.platform.fees += bf + sf;
    m.status = p > 0 ? 'released' : 'refunded'; m.settled = { at: now(), sellerGets, buyerGets, fee: bf + sf, p, by };
  }
  function closeIfDone(d) {
    if (d.milestones.every(m => m.status === 'released' || m.status === 'refunded')) {
      d.status = d.milestones.every(m => m.status === 'refunded') ? 'refunded' : 'completed';
      ev(d, null, 'Deal ' + d.status + '. Escrow is empty.');
      [d.buyerId, d.sellerId].forEach(x => notify(x, '"' + d.title + '" is ' + d.status + '.', d.id));
    }
  }
  function approve(id, mid, system) {
    const me = system ? null : cur(), d = deal(id), m = d.milestones.find(x => x.id === mid);
    if (!system && d.buyerId !== me.id) fail('Only the buyer can release funds.');
    if (d.status !== 'active' || !m || m.status !== 'submitted') fail('Nothing to release.');
    settle(d, m, 1, system ? 'auto' : me.id);
    ev(d, system ? null : me.id, (system ? 'Auto-release: no response within ' + d.autoHours + 'h. ' : name(me && me.id) + ' approved. ') + fmt(m.settled.sellerGets) + ' XAF released to ' + name(d.sellerId));
    notify(d.sellerId, fmt(m.settled.sellerGets) + ' XAF released for "' + m.title + '".', id);
    closeIfDone(d); save();
  }
  function dispute(id, reason) {
    const me = cur(), d = deal(id);
    if (!roleOf(d, me.id)) fail('Not allowed.');
    if (d.status !== 'active') fail('Only active deals can be disputed.');
    if ((reason || '').trim().length < 10) fail('Explain the problem in at least a sentence.');
    d.status = 'disputed'; d.dispute = { by: me.id, reason: reason.trim(), at: now() };
    ev(d, me.id, me.name + ' opened a dispute. Remaining funds are frozen.');
    [d.buyerId, d.sellerId].forEach(x => x !== me.id && notify(x, 'A dispute was opened on "' + d.title + '".', id));
    Object.values(db.users).filter(u => u.role === 'mediator').forEach(u => notify(u.id, 'New dispute: "' + d.title + '".', id)); save();
  }
  function resolve(id, choice, note) {
    const me = cur(), d = deal(id);
    if (me.role !== 'mediator') fail('Only mediators can resolve disputes.');
    if (d.status !== 'disputed') fail('Deal isn\'t in dispute.');
    if ((note || '').trim().length < 5) fail('Add a short written decision.');
    const p = { seller: 1, buyer: 0, split: .5 }[choice]; if (p === undefined) fail('Choose an outcome.');
    d.milestones.filter(m => m.status === 'pending' || m.status === 'submitted').forEach(m => settle(d, m, p, me.id));
    d.dispute.resolution = { choice, note: note.trim(), at: now(), by: me.id };
    ev(d, me.id, 'Mediator decision: ' + ({ seller: 'funds released to seller', buyer: 'funds refunded to buyer', split: 'funds split 50/50' })[choice] + '. ' + note.trim());
    d.status = 'active'; closeIfDone(d); if (d.status === 'active') d.status = 'completed'; save();
  }
  function message(id, text) {
    const me = cur(), d = deal(id);
    if (!roleOf(d, me.id) && me.role !== 'mediator') fail('Not allowed.');
    text = (text || '').trim(); if (!text) return;
    d.messages.push({ by: me.id, text: text.slice(0, 600), at: now() });
    [d.buyerId, d.sellerId].forEach(x => x && x !== me.id && notify(x, me.name + ' messaged you on "' + d.title + '".', id)); save();
  }

  /* ---------- wallet ---------- */
  function topup(amount, method) {
    const me = cur(); amount = Math.round(+amount);
    if (!(amount >= 1000)) fail('Minimum top-up is 1 000 XAF.'); if (amount > 5e6) fail('Maximum single top-up is 5 000 000 XAF.');
    wtx(me.id, 'topup', amount, 'Top-up via ' + method); save();
  }
  function withdraw(amount, method) {
    const me = cur(); amount = Math.round(+amount);
    if (!(amount >= 1000)) fail('Minimum withdrawal is 1 000 XAF.'); if (amount > me.bal) fail('Amount exceeds your balance.');
    if (me.kyc.level < 1) fail('Verify your phone number in Settings before withdrawing.');
    wtx(me.id, 'withdraw', -amount, 'Withdrawal to ' + method); save();
  }

  /* ---------- trust score ---------- */
  function trust(userId) {
    const u = db.users[userId], ds = Object.values(db.deals).filter(d => roleOf(d, userId) && d.fundedAt);
    let sub = 0, ok = 0, lost = 0, vol = 0;
    ds.forEach(d => {
      const r = roleOf(d, userId);
      d.milestones.forEach(m => { if (r === 'seller' && m.evidence) { sub++; if (m.onTime) ok++; } if (m.status === 'released') vol += m.amount; });
      const res = d.dispute && d.dispute.resolution;
      if (res) lost += res.choice === 'split' ? .5 : (res.choice === 'buyer' && r === 'seller') || (res.choice === 'seller' && r === 'buyer') ? 1 : 0;
    });
    const f = {
      ontime: (ok + 2) / (sub + 3), clean: Math.min(1, (ds.length - lost + 2) / (ds.length + 2.5)),
      identity: [0, .5, 1][u.kyc.level] || 0, age: Math.min(1, .7 * Math.min(1, vol / 5e6) + .3 * Math.min(1, (now() - u.created) / (90 * DAY))),
    };
    const score = Math.round(300 + 550 * (.35 * f.ontime + .25 * f.clean + .2 * f.identity + .2 * f.age));
    return { score, f, deals: ds.length, sub, ok, lost, vol, label: score >= 760 ? 'Excellent' : score >= 680 ? 'Strong' : score >= 560 ? 'Fair' : 'Building' };
  }

  /* ---------- time ---------- */
  function tick() {
    let ch = false;
    Object.values(db.deals).forEach(d => {
      if (d.status !== 'active') return;
      d.milestones.forEach(m => { if (d.status === 'active' && m.status === 'submitted' && now() >= m.evidence.at + d.autoHours * HOUR) { approve(d.id, m.id, true); ch = true; } });
    });
    return ch;
  }
  const fastForward = h => { db.skew = (db.skew || 0) + h * HOUR; save(); return tick(); };

  /* ---------- profile ---------- */
  function updateProfile(p) { const u = cur(); u.name = (p.name || u.name).trim(); u.biz = (p.biz || '').trim(); u.phone = (p.phone || u.phone).trim(); save(); }
  function setPlan(plan) { if (!RATES[plan]) fail('Unknown plan.'); cur().plan = plan; save(); }
  function setKyc(level) { const u = cur(); if (level > u.kyc.level) u.kyc = { level, at: now() }; save(); }

  /* ---------- contract ---------- */
  function contractText(d) {
    const t = totals(d), L = [];
    L.push("AFA'A PAY · ESCROW CONTRACT", 'Reference: ' + d.ref, 'Created: ' + new Date(d.created).toUTCString(), '');
    L.push('BUYER:  ' + name(d.buyerId) + (d.buyerId ? ' <' + db.users[d.buyerId].email + '>' : ' (invited)'));
    L.push('SELLER: ' + name(d.sellerId) + (d.sellerId ? ' <' + db.users[d.sellerId].email + '>' : ' (invited)'), '');
    L.push('SUBJECT: ' + d.title); if (d.desc) L.push(d.desc); L.push('', 'MILESTONES');
    d.milestones.forEach((m, i) => L.push((i + 1) + '. ' + m.title + ' — ' + fmt(m.amount) + ' XAF — due ' + m.days + ' day(s) after funding'));
    L.push('', 'TOTAL: ' + fmt(t.amount) + ' XAF', 'Escrow fee ' + (d.rate * 100).toFixed(1) + '% paid by ' + d.feePayer + ' (buyer pays ' + fmt(t.buyerFee) + ', seller pays ' + fmt(t.sellerFee) + ' XAF)');
    L.push('', 'TERMS', '1. The buyer funds the full amount into escrow before work begins.', '2. The seller submits proof of delivery for each milestone.',
      '3. The buyer has ' + d.autoHours + ' hours to approve or dispute. Silence means automatic release.', '4. In a dispute, funds are frozen and an Afa\'a Pay mediator decides on the evidence.', '5. Mediator decisions are final within this platform.', '', 'SIGNATURES');
    Object.entries(d.signed).forEach(([id, at]) => L.push(name(id) + ' — signed ' + new Date(at).toUTCString()));
    return L.join('\n');
  }
  const contractHash = d => sha(contractText(d));

  /* ---------- seed / init ---------- */
  async function mkUser(id, n, email, phone, biz, role, bal, lvl, plan) {
    const salt = 'seed' + id; db.users[id] = { id, name: n, email, phone, biz, salt, hash: await sha(salt + 'demo1234'), role, plan: plan || 'starter', kyc: { level: lvl }, bal: 0, created: now() - 120 * DAY };
    if (bal) wtx(id, 'topup', bal, 'Top-up via MTN MoMo');
  }
  async function seed() {
    db = { v: 1, users: {}, deals: {}, wtx: [], notifs: [], session: null, skew: 0, platform: { fees: 0 } };
    await mkUser('u_amina', 'Amina Tchinda', 'amina@demo.afaa', '+237 677 000 111', '', 'user', 2500000, 2);
    await mkUser('u_mballa', 'Mballa Electronics', 'mballa@demo.afaa', '+237 699 000 222', 'Mballa Electronics SARL', 'user', 120000, 2, 'business');
    await mkUser('u_med', 'Afa\'a Mediation Desk', 'mediator@demo.afaa', '+237 650 000 000', '', 'mediator', 0, 2);
    const as = id => { db.session = id; };
    db.skew = -9 * DAY; as('u_amina');
    let d = createDeal({ title: 'Dell XPS 13 laptop', desc: 'Brand new, sealed, with 12-month warranty.', role: 'buyer', counterparty: 'mballa@demo.afaa', milestones: [{ title: 'Delivery & warranty card', amount: 450000, days: 3 }], feePayer: 'seller' });
    as('u_mballa'); accept(d.id); as('u_amina'); db.skew = -8.5 * DAY; fund(d.id); as('u_mballa'); db.skew = -8 * DAY;
    submit(d.id, 'm1', { note: 'Delivered by DHL, tracking DLA-77120. Warranty card inside the box.' }); as('u_amina'); db.skew = -7.5 * DAY; approve(d.id, 'm1');
    db.skew = -3 * DAY; as('u_mballa');
    d = createDeal({ title: 'Brand website redesign', desc: 'Design and build of a 5-page marketing site.', role: 'seller', counterparty: 'amina@demo.afaa', milestones: [{ title: 'Design mock-ups', amount: 200000, days: 3 }, { title: 'Development', amount: 300000, days: 6 }, { title: 'Launch & handover', amount: 100000, days: 2 }], feePayer: 'split' });
    as('u_amina'); accept(d.id); db.skew = -2.8 * DAY; fund(d.id); as('u_mballa'); db.skew = -2.5 * DAY;
    submit(d.id, 'm1', { note: 'Figma mock-ups shared: figma.com/file/demo-mockups' }); as('u_amina'); db.skew = -2.2 * DAY; approve(d.id, 'm1');
    as('u_mballa'); db.skew = -.2 * DAY; submit(d.id, 'm2', { note: 'Staging site live at staging.example.com with all five pages.' });
    db.skew = -6 * HOUR; as('u_mballa');
    createDeal({ title: '40 prepaid SIM bundles', desc: 'Wholesale, MTN, activated on delivery.', role: 'seller', counterparty: 'amina@demo.afaa', milestones: [{ title: 'Delivery of 40 bundles', amount: 640000, days: 2 }], feePayer: 'seller' });
    db.skew = -2 * DAY; as('u_amina');
    d = createDeal({ title: 'Kitchen fit-out · phase 1', desc: 'Cabinets and worktops installed.', role: 'buyer', counterparty: 'mballa@demo.afaa', milestones: [{ title: 'Cabinets installed', amount: 780000, days: 5 }], feePayer: 'seller' });
    as('u_mballa'); accept(d.id); as('u_amina'); db.skew = -1.9 * DAY; fund(d.id); as('u_mballa'); db.skew = -1.2 * DAY;
    submit(d.id, 'm1', { note: 'Cabinets installed on site, photos attached to chat.' }); as('u_amina'); db.skew = -.9 * DAY;
    dispute(d.id, 'Two cabinet doors are chipped and the worktop is the wrong colour compared with the quote.');
    message(d.id, 'I can send photos of the damage if needed.'); as('u_mballa'); db.skew = -.8 * DAY; message(d.id, 'We can replace the doors. The worktop colour matches the signed quote.');
    db.skew = 0; db.session = null; db.notifs.forEach(n => n.read = n.at < now() - DAY); save();
  }
  async function init() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || db.v !== 1) await seed();
    tick(); save();
  }
  async function reset() { localStorage.removeItem(KEY); await seed(); }

  function fmt(n) { return Math.round(n).toLocaleString('en-US').replace(/,/g, ' '); }

  window.Afaa = {
    init, reset, signup, login, logout, me: cur, user: id => db.users[id], users: () => Object.values(db.users), now,
    deals: id => Object.values(db.deals).filter(d => roleOf(d, id) || d.createdBy === id).sort((a, b) => b.created - a.created),
    allDeals: () => Object.values(db.deals).sort((a, b) => b.created - a.created), deal: id => db.deals[id],
    createDeal, accept, cancel, fund, submit, approve: id => approve(id), approveM: (id, m) => approve(id, m), dispute, resolve, message,
    topup, withdraw, wtx: id => db.wtx.filter(t => t.uid === id), notifs: id => db.notifs.filter(n => n.to === id),
    markRead: id => { db.notifs.forEach(n => n.to === id && (n.read = true)); save(); }, trust, tick, fastForward,
    updateProfile, setPlan, setKyc, contractText, contractHash, totals, split, roleOf, rateOf, name, fmt, platform: () => db.platform,
    setSession: id => { db.session = id; save(); }, RATES, DAY, HOUR,
  };
})();
