/* AFA'A PAY platform UI — hash-routed SPA on top of window.Afaa (store.js). */
(function () {
  const A = Afaa, F = A.fmt;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = n => (n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const fdate = t => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const left = ms => { if (ms <= 0) return 'now'; const h = Math.floor(ms / A.HOUR); return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h + 'h ' + Math.floor(ms % A.HOUR / 6e4) + 'm'; };
  const STATUS = {
    proposed: ['b-held', 'Awaiting acceptance'], awaiting_funds: ['b-disp', 'Awaiting funds'], active: ['b-held', 'In escrow'],
    completed: ['b-rel', 'Completed'], disputed: ['b-disp', 'Disputed'], cancelled: ['b-ref', 'Cancelled'], refunded: ['b-ref', 'Refunded'],
  };
  const badge = s => `<span class="badge ${STATUS[s][0]}">${STATUS[s][1]}</span>`;
  const MS_BADGE = { pending: ['b-held', 'Pending'], submitted: ['b-disp', 'Awaiting approval'], released: ['b-rel', 'Released'], refunded: ['b-ref', 'Refunded'] };
  const mbadge = m => `<span class="badge ${MS_BADGE[m.status][0]}">${m.status === 'released' && m.settled && m.settled.p < 1 ? 'Part-released' : MS_BADGE[m.status][1]}</span>`;

  let toastT;
  function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
  const run = async fn => { try { await fn(); } catch (e) { toast(e.message || 'Something went wrong', true); } };

  /* ---------- action detection ---------- */
  function actionFor(d, me) {
    const r = A.roleOf(d, me.id);
    if (me.role === 'mediator') return d.status === 'disputed' ? 'Resolve dispute' : null;
    if (!r) return null;
    if (d.status === 'proposed' && d.createdBy !== me.id) return 'Review & accept';
    if (d.status === 'awaiting_funds' && r === 'buyer') return 'Fund escrow';
    if (d.status === 'active' && r === 'seller' && d.milestones.some(m => m.status === 'pending') && !d.milestones.some(m => m.status === 'submitted')) return 'Submit delivery';
    if (d.status === 'active' && r === 'buyer') { const m = d.milestones.find(x => x.status === 'submitted'); if (m) return 'Approve release · auto in ' + left(m.evidence.at + d.autoHours * A.HOUR - A.now()); }
    return null;
  }
  const myCounterparty = (d, me) => A.name(A.roleOf(d, me.id) === 'buyer' ? d.sellerId : d.buyerId) || (d.invite ? d.invite.email : '—');
  const needCount = me => A.allDeals().filter(d => actionFor(d, me)).length;

  /* ---------- shell ---------- */
  const NAV = {
    user: [['#/', 'Dashboard', 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z'], ['#/deals', 'Deals', 'M7 7h13l-3-3M17 17H4l3 3'], ['#/new', 'New deal', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8'], ['#/wallet', 'Wallet', 'M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h2'], ['#/trust', 'Trust score', 'M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6zM9 12l2 2 4-4'], ['#/settings', 'Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1V5h-4v2l-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1v2h4v-2l2-1 2 1 2-4-2-1z']],
    mediator: [['#/mediation', 'Mediation', 'M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6zM9 12l2 2 4-4'], ['#/deals', 'All deals', 'M7 7h13l-3-3M17 17H4l3 3'], ['#/settings', 'Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z']],
  };
  function shell(title, sub, body, active) {
    const me = A.me(), nav = NAV[me.role === 'mediator' ? 'mediator' : 'user'], n = needCount(me), unread = A.notifs(me.id).filter(x => !x.read).length;
    const skew = A.now() - Date.now();
    const link = ([h, l, p]) => `<a class="nv ${active === h ? 'on' : ''}" href="${h}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>${l}${h === '#/deals' && n ? `<span class="count">${n}</span>` : ''}</a>`;
    return `<div class="mnav" aria-label="Sections">${nav.map(([h, l]) => `<a class="${active === h ? 'on' : ''}" href="${h}">${l}</a>`).join('')}</div>
    <div class="app-shell"><aside class="side">
      <a class="logo" href="../index.html" title="Marketing site"><svg><use href="#mark"/></svg>Afa'a Pay</a>
      ${nav.map(link).join('')}<div class="sp"></div>
      <div class="demo"><span>Demo controls</span><div><button data-act="ff" data-h="24">+24h</button><button data-act="ff" data-h="72">+72h</button></div></div>
      <div class="merchant"><span class="av">${initials(me.name)}</span><div>${esc(me.name)}<small>${me.role === 'mediator' ? 'Mediator' : me.plan === 'business' ? 'Business plan' : 'Starter plan'}</small></div></div>
      <button class="nv" data-act="logout" style="margin-top:6px">⎋ Sign out</button>
    </aside>
    <main class="main"><div class="topbar"><div><h1>${title}</h1><p>${sub || ''}</p></div>
      <div class="top-actions">${skew > A.HOUR ? `<span class="clock" title="Demo clock is ahead">⏩ +${Math.round(skew / A.HOUR)}h</span>` : ''}
      <button class="bell" data-act="notifs" aria-label="Notifications">🔔${unread ? `<b>${unread}</b>` : ''}</button>
      ${me.role === 'mediator' ? '' : '<a class="btn btn-primary btn-sm" href="#/new">+ New deal</a>'}</div></div>${body}</main></div>`;
  }

  /* ---------- views ---------- */
  function vDashboard() {
    const me = A.me(), ds = A.deals(me.id), tr = A.trust(me.id);
    const held = ds.filter(d => ['active', 'disputed'].includes(d.status)).reduce((s, d) => s + A.totals(d).held, 0);
    const todo = ds.filter(d => actionFor(d, me)), notifs = A.notifs(me.id).slice(0, 6);
    return shell('Welcome back, ' + esc(me.name.split(' ')[0]), 'Here\'s what\'s happening across your deals.', `
      <div class="kpis">
        <div class="kpi"><span>Wallet balance</span><b>${F(me.bal)} <small style="font-size:13px;color:var(--mute)">XAF</small></b><em style="color:var(--blue2)"><a href="#/wallet">Top up or withdraw →</a></em></div>
        <div class="kpi"><span>Held in escrow</span><b>${F(held)} <small style="font-size:13px;color:var(--mute)">XAF</small></b><em style="color:var(--blue2)">${ds.filter(d => d.status === 'active').length} active deals</em></div>
        <div class="kpi"><span>Needs your action</span><b>${todo.length}</b><em class="${todo.length ? 'dn' : ''}" style="${todo.length ? 'color:var(--amber)' : ''}">${todo.length ? 'Waiting on you' : 'All caught up'}</em></div>
        <div class="kpi"><span>Trust score</span><b>${tr.score}</b><em><a href="#/trust">${tr.label} →</a></em></div>
      </div>
      <div class="dash-grid" style="grid-template-columns:1.4fr 1fr">
        <div class="box"><div class="box-h"><h3>Needs your action</h3></div><div class="stack">
          ${todo.length ? todo.map(d => `<a class="act-item" href="#/deal/${d.id}"><div><b>${esc(d.title)}</b><small>${esc(myCounterparty(d, me))} · ${F(A.totals(d).amount)} XAF</small></div><span class="badge b-disp">${esc(actionFor(d, me))}</span></a>`).join('') : '<div class="empty">Nothing needs your attention. <br><a href="#/new" style="color:var(--blue2)">Start a new protected deal →</a></div>'}
        </div></div>
        <div class="box"><div class="box-h"><h3>Recent activity</h3></div><div class="stack">
          ${notifs.length ? notifs.map(n => `<a class="nitem ${n.read ? '' : 'new'}" href="#/deal/${n.deal}">${esc(n.text)}<small>${fdate(n.at)}</small></a>`).join('') : '<div class="empty">No activity yet.</div>'}
        </div></div>
      </div>
      <div class="box"><div class="box-h"><h3>Recent deals</h3><a href="#/deals" style="color:var(--blue2);font-weight:600;font-size:14px">View all</a></div>${dealTable(ds.slice(0, 5), me)}</div>`, '#/');
  }

  function dealTable(ds, me) {
    if (!ds.length) return '<div class="empty">No deals yet.</div>';
    return `<div class="tbl-wrap"><table class="tx"><thead><tr><th>Deal</th><th>With</th><th>Status</th><th class="hide-sm">Created</th><th>Amount</th></tr></thead><tbody>${ds.map(d => {
      const r = A.roleOf(d, me.id), a = actionFor(d, me);
      return `<tr class="r" data-href="#/deal/${d.id}" tabindex="0"><td><b>${esc(d.title)}</b><small>${d.ref}${r ? ' · you are the ' + r : ''}</small></td><td>${esc(me.role === 'mediator' ? A.name(d.buyerId) + ' ↔ ' + A.name(d.sellerId) : myCounterparty(d, me))}</td><td>${badge(d.status)}${a ? '<small style="color:var(--amber)">● ' + esc(a.split(' · ')[0]) + '</small>' : ''}</td><td class="hide-sm">${fdate(d.created)}</td><td class="amt">${F(A.totals(d).amount)} XAF</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  let dealFilter = 'All';
  function vDeals() {
    const me = A.me(), all = me.role === 'mediator' ? A.allDeals() : A.deals(me.id);
    const f = { All: () => true, 'Needs action': d => actionFor(d, me), Active: d => d.status === 'active', Closed: d => ['completed', 'refunded', 'cancelled'].includes(d.status), Disputed: d => d.status === 'disputed' }[dealFilter];
    return shell(me.role === 'mediator' ? 'All deals' : 'Deals', all.length + ' deals', `<div class="box"><div class="filters">${['All', 'Needs action', 'Active', 'Disputed', 'Closed'].map(k => `<button class="${k === dealFilter ? 'on' : ''}" data-act="filter" data-f="${k}">${k}</button>`).join('')}</div>${dealTable(all.filter(f), me)}</div>`, '#/deals');
  }

  /* new deal wizard */
  function vNew() {
    const me = A.me(), hint = A.users().filter(u => u.id !== me.id && u.role === 'user' && u.email.endsWith('@demo.afaa'));
    const row = (i, m = {}) => `<div class="ms-row" data-row><label class="field">${i === 0 ? 'Milestone' : '<span class="sm">&nbsp;</span>'}<input name="mt" placeholder="e.g. Delivery" value="${esc(m.title || '')}"></label><label class="field">${i === 0 ? 'Amount (XAF)' : '&nbsp;'}<input name="ma" type="number" min="1000" step="500" placeholder="150000" value="${m.amount || ''}"></label><label class="field">${i === 0 ? 'Due (days)' : '&nbsp;'}<input name="md" type="number" min="1" value="${m.days || 5}"></label><button type="button" class="x" data-act="rmms" aria-label="Remove milestone">✕</button></div>`;
    return shell('New protected deal', 'Agree terms once. Funds stay locked until delivery is confirmed.', `
      <form class="box new-esc" id="deal-form" style="max-width:760px;gap:18px">
        <div class="field"><span>I am the…</span><div class="radio-cards" style="grid-template-columns:1fr 1fr"><label><input type="radio" name="role" value="buyer" checked><b>Buyer</b>I'm paying for goods or work</label><label><input type="radio" name="role" value="seller"><b>Seller</b>I'm delivering goods or work</label></div></div>
        <label class="field">Other party's email<input name="cp" type="email" required placeholder="name@example.com" list="cps"></label>
        <datalist id="cps">${hint.map(u => `<option value="${esc(u.email)}">${esc(u.name)}</option>`).join('')}</datalist>
        <div class="sm muted" style="margin-top:-8px">Demo accounts: ${hint.map(u => `<a href="#" data-act="fillcp" data-e="${esc(u.email)}" style="color:var(--blue2)">${esc(u.email)}</a>`).join(' · ')}. Not registered yet? They're invited and see the deal when they sign up.</div>
        <label class="field">Title<input name="title" required maxlength="80" placeholder="e.g. 12 dresses, Order #4830"></label>
        <label class="field">Description <span class="sm">(optional)</span><textarea name="desc" maxlength="500" placeholder="Specs, quantities, acceptance criteria…"></textarea></label>
        <div id="ms-rows">${row(0, { title: 'Delivery', amount: '' })}</div>
        <button type="button" class="btn btn-ghost btn-sm" data-act="addms" style="justify-self:start">+ Add milestone</button>
        <div class="grid2" style="gap:12px"><label class="field">Who pays the escrow fee?<select name="fee"><option value="seller">Seller</option><option value="buyer">Buyer</option><option value="split">Split 50/50</option></select></label>
        <label class="field">Auto-release after delivery<select name="auto"><option value="24">24 hours</option><option value="48" selected>48 hours</option><option value="72">72 hours</option><option value="168">7 days</option></select></label></div>
        <div class="fee-prev" id="fee-prev"></div>
        <div class="err-msg" id="form-err"></div>
        <button class="btn btn-primary" style="justify-content:center">Sign contract & send →</button>
      </form>`, '#/new');
  }
  function feePreview() {
    const f = $('#deal-form'); if (!f) return;
    const me = A.me(), rows = $$('[data-row]', f).map(r => ({ amount: +$('[name=ma]', r).value || 0 })), payer = f.fee.value;
    let amt = 0, b = 0, s = 0; rows.forEach(m => { const x = A.split(m, payer, A.rateOf(me)); amt += m.amount; b += x.buyer; s += x.seller; });
    $('#fee-prev').innerHTML = `<div class="sum"><span>Deal value</span><b>${F(amt)} XAF</b><span>Fee rate (${me.plan} plan)</span><b>${(A.rateOf(me) * 100).toFixed(1)}%</b><span>Buyer funds escrow with</span><b>${F(amt + b)} XAF</b><span>Seller receives</span><b>${F(amt - s)} XAF</b></div>`;
  }

  /* deal detail */
  function vDeal(id) {
    const me = A.me(), d = A.deal(id);
    if (!d || (!A.roleOf(d, me.id) && d.createdBy !== me.id && me.role !== 'mediator')) return shell('Deal not found', '', '<div class="box empty">This deal doesn\'t exist or you don\'t have access. <a href="#/deals" style="color:var(--blue2)">Back to deals</a></div>', '#/deals');
    const r = A.roleOf(d, me.id), t = A.totals(d), isMed = me.role === 'mediator';
    const nextP = d.status === 'active' && d.milestones.find(m => m.status === 'pending');
    const canSubmit = m => d.status === 'active' && r === 'seller' && nextP === m && !d.milestones.some(x => x.status === 'submitted');
    const msHtml = d.milestones.map((m, i) => {
      const cls = m.status === 'released' ? 'done' : m.status === 'submitted' ? 'sub' : m.status === 'refunded' ? 'ref' : '';
      let acts = '';
      if (canSubmit(m)) acts += `<button class="btn btn-primary btn-sm" data-act="submit" data-id="${d.id}" data-m="${m.id}">Submit delivery</button>`;
      if (m.status === 'submitted' && r === 'buyer' && d.status === 'active') acts += `<button class="btn btn-green btn-sm" data-act="approve" data-id="${d.id}" data-m="${m.id}">Approve & release ${F(m.amount)} XAF</button>`;
      const ev = m.evidence ? `<div class="evid"><b>Delivery proof</b> · ${fdate(m.evidence.at)}${m.onTime === false ? ' · <span style="color:var(--amber)">late</span>' : ''}<br>${esc(m.evidence.note)}${m.evidence.img ? `<img src="${m.evidence.img}" alt="Delivery evidence">` : ''}${m.status === 'submitted' && d.status === 'active' ? `<br><span class="muted sm">Auto-releases in ${left(m.evidence.at + d.autoHours * A.HOUR - A.now())} unless the buyer responds.</span>` : ''}</div>` : '';
      const st = m.settled ? `<div class="sm muted" style="margin-top:8px">Seller received ${F(m.settled.sellerGets)} XAF${m.settled.buyerGets ? ' · buyer refunded ' + F(m.settled.buyerGets) + ' XAF' : ''} · fee ${F(m.settled.fee)} XAF${m.settled.by === 'auto' ? ' · auto-released' : ''}</div>` : '';
      return `<div class="ms ${cls}"><div class="n">${m.status === 'released' ? '✓' : i + 1}</div><div><div class="ms-top"><b>${esc(m.title)}</b><span>${F(m.amount)} XAF ${mbadge(m)}</span></div><div class="sm muted">Due ${m.days} day${m.days > 1 ? 's' : ''} after funding${m.due ? ' · deadline ' + fdate(m.due) : ''}</div>${ev}${st}${acts ? `<div class="ms-actions">${acts}</div>` : ''}</div></div>`;
    }).join('');

    let banner = '';
    if (d.status === 'proposed') banner = d.createdBy === me.id ? `<div class="hero-card"><b>Waiting for ${esc(myCounterparty(d, me))} to accept.</b><div class="ms-actions"><button class="btn btn-danger btn-sm" data-act="cancel" data-id="${d.id}">Cancel deal</button></div></div>`
      : r ? `<div class="hero-card"><b>${esc(A.name(d.createdBy))} proposed this deal. Review the contract, then accept to sign.</b><div class="ms-actions"><button class="btn btn-light btn-sm" data-act="accept" data-id="${d.id}">Accept & sign</button><button class="btn btn-ghost btn-sm" data-act="contract" data-id="${d.id}">Read contract</button><button class="btn btn-danger btn-sm" data-act="cancel" data-id="${d.id}">Decline</button></div></div>` : '';
    if (d.status === 'awaiting_funds') banner = r === 'buyer' ? `<div class="hero-card"><b>Fund escrow with ${F(t.fund)} XAF to start the work.</b><span class="sm" style="color:#b9c4ff">Your wallet: ${F(me.bal)} XAF. The seller can't touch the money until you approve delivery.</span><div class="ms-actions"><button class="btn btn-light btn-sm" data-act="fund" data-id="${d.id}">Fund escrow from wallet</button>${me.bal < t.fund ? '<a class="btn btn-ghost btn-sm" href="#/wallet">Top up wallet</a>' : ''}<button class="btn btn-danger btn-sm" data-act="cancel" data-id="${d.id}">Cancel</button></div></div>`
      : `<div class="hero-card"><b>Waiting for the buyer to fund escrow.</b>${r ? `<div class="ms-actions"><button class="btn btn-danger btn-sm" data-act="cancel" data-id="${d.id}">Cancel</button></div>` : ''}</div>`;
    if (d.status === 'disputed') {
      const dp = d.dispute;
      banner = `<div class="dispute-box"><b>⚠ Dispute opened by ${esc(A.name(dp.by))} · ${fdate(dp.at)}</b><div>${esc(dp.reason)}</div><div class="sm muted">Funds are frozen. Add evidence in the chat below. A mediator will decide.</div>
        ${isMed ? `<form id="resolve-form" data-id="${d.id}" class="stack"><div class="radio-cards"><label><input type="radio" name="c" value="seller" required><b>Release to seller</b>Work was delivered</label><label><input type="radio" name="c" value="split"><b>Split 50/50</b>Shared fault</label><label><input type="radio" name="c" value="buyer"><b>Refund buyer</b>Not as agreed</label></div><textarea class="inp" name="note" placeholder="Written decision, visible to both parties" required minlength="5"></textarea><button class="btn btn-primary btn-sm" style="justify-self:start">Issue decision</button></form>` : ''}</div>`;
    }
    if (d.dispute && d.dispute.resolution) banner = `<div class="dispute-box" style="border-color:rgba(46,229,157,.4);background:rgba(46,229,157,.06)"><b>Mediator decision · ${fdate(d.dispute.resolution.at)}</b><div>${{ seller: 'Funds released to seller', buyer: 'Funds refunded to buyer', split: 'Funds split 50/50' }[d.dispute.resolution.choice]}. ${esc(d.dispute.resolution.note)}</div></div>`;

    const party = (id, role) => { const u = A.user(id); if (!u) return `<div class="party"><span class="av">?</span><div>${esc(d.invite ? d.invite.email : 'Unknown')}<small>${role} · invited, not signed up yet</small></div></div>`; const s = A.trust(id); return `<div class="party"><span class="av">${initials(u.name)}</span><div>${esc(u.name)}${u.id === me.id ? ' (you)' : ''}<small>${role}${u.kyc.level >= 2 ? ' · ID verified ✓' : ''}</small></div><div class="sc">${s.score}<small>trust</small></div></div>`; };
    const chat = d.messages.map(m => `<div class="msg ${m.by === me.id ? 'me' : ''}"><small>${esc(A.name(m.by))} · ${fdate(m.at)}</small>${esc(m.text)}</div>`).join('') || '<div class="muted sm">No messages yet.</div>';
    const canDispute = d.status === 'active' && r;
    return shell(esc(d.title), `${d.ref} · ${badge(d.status).replace(/<[^>]+>/g, '')}`, `
      <div class="pf-grid"><div class="stack">
        ${banner}
        <div class="box"><div class="box-h"><h3>Milestones</h3><span class="muted sm">${F(t.released)} of ${F(t.amount)} XAF released</span></div>${d.desc ? `<p class="muted sm" style="margin-bottom:8px">${esc(d.desc)}</p>` : ''}${msHtml}
          ${canDispute ? `<div class="ms-actions" style="margin-top:14px"><button class="btn btn-danger btn-sm" data-act="dispute" data-id="${d.id}">Open a dispute</button></div>` : ''}</div>
        <div class="box"><div class="box-h"><h3>Messages</h3></div><div class="chat" id="chat">${chat}</div>${r || isMed ? `<form class="chat-form" id="chat-form" data-id="${d.id}"><input class="inp" name="t" placeholder="Write a message…" maxlength="600" autocomplete="off"><button class="btn btn-primary btn-sm">Send</button></form>` : ''}</div>
      </div><div class="stack">
        <div class="box"><div class="box-h"><h3>Parties</h3></div>${party(d.buyerId, 'Buyer')}${party(d.sellerId, 'Seller')}</div>
        <div class="box"><div class="box-h"><h3>Amounts</h3></div><div class="sum"><span>Deal value</span><b>${F(t.amount)} XAF</b><span>Fee (${(d.rate * 100).toFixed(1)}%, paid by ${d.feePayer})</span><b>${F(t.buyerFee + t.sellerFee)} XAF</b><span>Buyer funds</span><b>${F(t.fund)} XAF</b><span>Seller nets</span><b>${F(t.amount - t.sellerFee)} XAF</b><span>Currently in escrow</span><b style="color:var(--blue2)">${d.fundedAt ? F(t.held) : 0} XAF</b></div>
          <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:10px" data-act="contract" data-id="${d.id}">View signed contract</button></div>
        <div class="box"><div class="box-h"><h3>Timeline</h3></div><div class="tl">${d.events.map(e => `<div class="d">${esc(e.text)}<small>${fdate(e.at)}</small></div>`).reverse().join('')}</div></div>
      </div></div>`, '#/deals');
  }

  function vWallet() {
    const me = A.me(), tx = A.wtx(me.id);
    return shell('Wallet', 'Funds you can spend on escrow or withdraw to mobile money.', `
      <div class="pf-grid" style="grid-template-columns:1fr 1.6fr"><div class="hero-card"><span style="color:#b9c4ff">Available balance</span><div class="bal">${F(me.bal)} <small>XAF</small></div>
        <div class="ms-actions"><button class="btn btn-light btn-sm" data-act="topup">+ Top up</button><button class="btn btn-ghost btn-sm" data-act="withdraw">Withdraw</button></div>
        <span class="sm" style="color:#b9c4ff">Plan fee: ${(A.rateOf(me) * 100).toFixed(1)}% per escrow</span></div>
      <div class="box"><div class="box-h"><h3>History</h3></div>${tx.length ? `<div class="tbl-wrap"><table class="tx"><thead><tr><th>Description</th><th class="hide-sm">Date</th><th>Amount</th></tr></thead><tbody>${tx.map(t => `<tr ${t.deal ? `class="r" data-href="#/deal/${t.deal}"` : ''}><td>${esc(t.label)}</td><td class="hide-sm">${fdate(t.at)}</td><td class="amt" style="color:${t.amt > 0 ? 'var(--green)' : '#fff'}">${t.amt > 0 ? '+' : '−'}${F(Math.abs(t.amt))} XAF</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No transactions yet. Top up to get started.</div>'}</div></div>`, '#/wallet');
  }

  function vTrust() {
    const me = A.me(), t = A.trust(me.id), pct = x => Math.round(x * 100);
    const tips = []; if (me.kyc.level < 2) tips.push('Verify your ID in Settings (up to +' + Math.round(550 * .2 * (1 - [0, .5, 1][me.kyc.level])) + ' points).'); if (t.f.ontime < .9) tips.push('Deliver milestones before their deadline to lift on-time delivery.'); if (t.f.age < .5) tips.push('Complete more deals. Volume and account age build over time.'); if (!tips.length) tips.push('Great work. Keep delivering on time and your score keeps climbing.');
    const f = (l, v, s) => `<div class="factor"><div>${l}<b>${pct(v)}%</b></div><div class="meter"><i style="width:${pct(v)}%"></i></div><small>${s}</small></div>`;
    return shell('Trust score', 'Computed from your real activity on Afa\'a Pay.', `
      <div class="trust-dash"><div class="box" style="text-align:center"><div class="gauge-ring dark-ring"><svg viewBox="0 0 270 270"><circle class="bg" cx="135" cy="135" r="120" style="stroke:rgba(255,255,255,.08)"/><circle class="fg" cx="135" cy="135" r="120" id="fg"/></svg><div class="gauge-num"><b>${t.score}</b><span>${t.label}</span></div></div>
        <p class="muted sm">${t.score >= 850 ? 'Maximum score.' : (850 - t.score) + ' points to the maximum'}</p>
        <div style="text-align:left;margin-top:20px"><div class="perk ${t.score >= 560 ? 'on' : ''}"><span>560+ Fair</span><span>Standard terms</span></div><div class="perk ${t.score >= 680 ? 'on' : ''}"><span>680+ Strong</span><span>24h payouts</span></div><div class="perk ${t.score >= 760 ? 'on' : ''}"><span>760+ Excellent</span><span>Instant release</span></div></div></div>
      <div class="box"><div class="box-h"><h3>What shapes your score</h3></div>
        ${f('On-time delivery', t.f.ontime, t.sub ? t.ok + ' of ' + t.sub + ' submitted milestones were on time' : 'No deliveries yet. Starting estimate')}
        ${f('Dispute-free deals', t.f.clean, t.deals + ' funded deal' + (t.deals === 1 ? '' : 's') + ', ' + t.lost + ' lost dispute' + (t.lost === 1 ? '' : 's'))}
        ${f('Identity verification', t.f.identity, ['Not verified', 'Phone verified', 'Phone and ID verified'][me.kyc.level])}
        ${f('Account age & volume', t.f.age, F(t.vol) + ' XAF released in completed milestones')}
        <div class="factor" style="background:rgba(47,91,255,.1);padding:14px;border-radius:12px;margin:0"><div><b>💡 How to improve</b></div>${tips.map(x => `<small style="color:#cfd3e3">• ${x}</small>`).join('')}</div></div></div>`, '#/trust');
  }

  function vSettings() {
    const me = A.me(), k = me.kyc.level;
    return shell('Settings', 'Profile, verification and plan.', `
      <div class="pf-grid" style="grid-template-columns:1fr 1fr"><div class="stack">
        <form class="box new-esc" id="profile-form"><div class="box-h"><h3>Profile</h3></div>
          <label class="field">Full name<input name="name" value="${esc(me.name)}" required></label>
          <label class="field">Business <span class="sm">(optional)</span><input name="biz" value="${esc(me.biz)}"></label>
          <label class="field">Mobile<input name="phone" value="${esc(me.phone)}" required></label>
          <label class="field">Email<input value="${esc(me.email)}" disabled></label><button class="btn btn-primary btn-sm" style="justify-self:start">Save</button></form>
        <div class="box"><div class="box-h"><h3>Plan</h3></div><div class="radio-cards" style="grid-template-columns:1fr 1fr">${['starter', 'business'].map(p => `<label><input type="radio" name="plan" value="${p}" ${me.plan === p ? 'checked' : ''} data-act="plan"><b>${p[0].toUpperCase() + p.slice(1)}</b>${(A.RATES[p] * 100).toFixed(1)}% per escrow</label>`).join('')}</div><p class="muted sm" style="margin-top:10px">Applies to deals you create from now on.</p></div>
      </div><div class="stack">
        <div class="box"><div class="box-h"><h3>Verification</h3></div>
          <div class="kyc done"><span class="ok">✓</span><div>Email<small>${esc(me.email)}</small></div></div>
          <div class="kyc ${k >= 1 ? 'done' : ''}"><span class="ok">${k >= 1 ? '✓' : '2'}</span><div>Phone number<small>${k >= 1 ? 'Verified' : 'Verify to enable withdrawals'}</small></div>${k >= 1 ? '' : '<button class="btn btn-primary btn-sm" data-act="kyc-phone">Verify</button>'}</div>
          <div class="kyc ${k >= 2 ? 'done' : ''}"><span class="ok">${k >= 2 ? '✓' : '3'}</span><div>National ID<small>${k >= 2 ? 'Verified' : 'Raises your trust score and limits'}</small></div>${k >= 2 ? '' : `<button class="btn btn-primary btn-sm" data-act="kyc-id" ${k < 1 ? 'disabled' : ''}>Upload ID</button>`}</div></div>
        <div class="box"><div class="box-h"><h3>Demo data</h3></div><p class="muted sm" style="margin-bottom:12px">Everything is stored in this browser. Money is simulated.</p><div class="ms-actions" style="margin:0"><button class="btn btn-ghost btn-sm" data-act="ff" data-h="24">Fast-forward 24h</button><button class="btn btn-ghost btn-sm" data-act="ff" data-h="72">+72h</button><button class="btn btn-danger btn-sm" data-act="reset">Reset all data</button></div></div>
      </div></div>`, '#/settings');
  }

  function vMediation() {
    const me = A.me(), ds = A.allDeals(), open = ds.filter(d => d.status === 'disputed'), done = ds.filter(d => d.dispute && d.dispute.resolution);
    return shell('Mediation desk', 'Review evidence and issue binding decisions.', `
      <div class="kpis"><div class="kpi"><span>Open disputes</span><b>${open.length}</b><em>${open.length ? 'Awaiting decision' : 'Queue clear'}</em></div><div class="kpi"><span>Resolved</span><b>${done.length}</b><em>All time</em></div><div class="kpi"><span>Funds frozen</span><b>${F(open.reduce((s, d) => s + A.totals(d).held, 0))}</b><em style="color:var(--amber)">XAF</em></div><div class="kpi"><span>Platform fees earned</span><b>${F(A.platform().fees)}</b><em>XAF</em></div></div>
      <div class="box"><div class="box-h"><h3>Open disputes</h3></div>${open.length ? open.map(d => `<a class="act-item" href="#/deal/${d.id}" style="margin-bottom:10px"><div><b>${esc(d.title)}</b><small>${esc(A.name(d.buyerId))} ↔ ${esc(A.name(d.sellerId))} · ${esc(d.dispute.reason.slice(0, 90))}…</small></div><span class="badge b-disp">${F(A.totals(d).held)} XAF frozen</span></a>`).join('') : '<div class="empty">No open disputes.</div>'}</div>`, '#/mediation');
  }

  /* auth */
  function vAuth(mode) {
    const art = `<div class="auth-art"><a class="logo" href="../index.html"><svg><use href="#mark"/></svg>Afa'a Pay</a><div class="stack"><h2>Building <span class="grad">trust</span> into every transaction.</h2><ul><li>Funds held until delivery is confirmed</li><li>Contracts signed in-app</li><li>Mediation when things go wrong</li></ul></div><span class="muted sm">Concept platform · simulated payments · data stays in your browser</span></div>`;
    const demo = `<div class="or">try the demo</div><div class="demo-tiles">${[['u_amina', 'Amina Tchinda', 'Buyer · funded wallet · 4 deals'], ['u_mballa', 'Mballa Electronics', 'Seller · Business plan'], ['u_med', 'Mediation Desk', 'Resolve the open dispute']].map(([id, n, s]) => `<button data-act="demo" data-u="${id}"><span class="av">${initials(n)}</span><div>${n}<small>${s}</small></div></button>`).join('')}</div>`;
    if (mode === 'signup') return `<div class="auth">${art}<form class="auth-form" id="signup-form"><h1>Create your account</h1><p class="muted">Free to start. Pay only on completed deals.</p>
      <label class="field">Full name<input name="name" required autocomplete="name"></label><label class="field">Email<input name="email" type="email" required autocomplete="email"></label><label class="field">Mobile number<input name="phone" required placeholder="+237 6XX XXX XXX" autocomplete="tel"></label>
      <label class="field">Business name <span class="sm">(optional)</span><input name="biz"></label><label class="field">Password (8+ characters)<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
      <div class="err-msg" id="form-err"></div><button class="btn btn-primary" style="justify-content:center">Create account</button><p class="muted sm">Already registered? <a href="#/login" style="color:var(--blue2)">Sign in</a></p></form></div>`;
    return `<div class="auth">${art}<form class="auth-form" id="login-form"><h1>Sign in</h1><p class="muted">Welcome back to Afa'a Pay.</p>
      <label class="field">Email<input name="email" type="email" required autocomplete="email"></label><label class="field">Password<input name="password" type="password" required autocomplete="current-password"></label>
      <div class="err-msg" id="form-err"></div><button class="btn btn-primary" style="justify-content:center">Sign in</button><p class="muted sm">New here? <a href="#/signup" style="color:var(--blue2)">Create an account</a></p>${demo}</form></div>`;
  }

  /* ---------- router ---------- */
  function route() {
    const me = A.me(), h = location.hash || '#/', root = $('#root');
    const [, p, arg] = h.match(/^#\/([^/]*)\/?(.*)$/) || [];
    if (!me) { root.innerHTML = vAuth(p === 'signup' ? 'signup' : 'login'); return; }
    if (p === 'login' || p === 'signup') { location.hash = me.role === 'mediator' ? '#/mediation' : '#/'; return; }
    const med = me.role === 'mediator';
    const views = { '': med ? vMediation : vDashboard, deals: vDeals, new: med ? vMediation : vNew, wallet: med ? vMediation : vWallet, trust: med ? vMediation : vTrust, settings: vSettings, mediation: med ? vMediation : vDashboard };
    const keepScroll = root.dataset.h === h ? scrollY : 0;
    root.innerHTML = p === 'deal' ? vDeal(arg) : (views[p] || views[''])();
    root.dataset.h = h; scrollTo(0, keepScroll);
    if (p === 'new') feePreview();
    const fg = $('#fg'); if (fg) { const s = +$('.gauge-num b').textContent; setTimeout(() => fg.style.strokeDashoffset = 754 * (1 - (s - 300) / 550), 80); }
    const chat = $('#chat'); if (chat) chat.scrollTop = chat.scrollHeight;
  }

  /* ---------- modals ---------- */
  const modal = h => { $('#modal').innerHTML = h ? `<div class="modal-scrim" data-act="closem"><div class="modal" role="dialog" aria-modal="true">${h}</div></div>` : ''; const i = $('#modal input,#modal textarea'); if (i) i.focus(); };
  const readImg = file => new Promise(res => {
    if (!file) return res(null);
    const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 720 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .72)); }; im.onerror = () => res(null); im.src = r.result; }; r.onerror = () => res(null); r.readAsDataURL(file);
  });
  const payChips = (name = 'method') => `<div class="paychips">${[['MTN MoMo', 'mtn', 'MTN', '#ffcc00;color:#000'], ['Orange Money', 'om', 'OM', '#ff7900;color:#000'], ['Card', 'card', '▭', 'var(--indigo);color:#fff']].map(([n, v, l, c], i) => `<label><input type="radio" name="${name}" value="${n}" ${i ? '' : 'checked'}><i style="background:${c}">${l}</i>${n}</label>`).join('')}</div>`;

  function payFlow(kind) {
    const w = kind === 'topup';
    modal(`<h3>${w ? 'Top up wallet' : 'Withdraw to mobile money'}</h3><form id="pay-form" class="stack"><label class="field">Amount (XAF)<input name="amt" type="number" required min="1000" step="500" value="${w ? 100000 : ''}" placeholder="50000"></label><div class="field"><span>${w ? 'Pay with' : 'Send to'}</span>${payChips()}</div><label class="field">Mobile / card number<input name="num" required value="${esc(A.me().phone)}"></label><div class="err-msg" id="form-err"></div><div class="ms-actions" style="margin:0"><button class="btn btn-primary">Continue</button><button type="button" class="btn btn-ghost" data-act="closem-x">Cancel</button></div></form>`);
    $('#pay-form').onsubmit = e => {
      e.preventDefault(); const f = e.target, amt = +f.amt.value, method = f.method.value;
      try { if (!w) { if (!(amt >= 1000)) throw new Error('Minimum is 1 000 XAF.'); if (amt > A.me().bal) throw new Error('Amount exceeds your balance.'); if (A.me().kyc.level < 1) throw new Error('Verify your phone number in Settings before withdrawing.'); } else if (!(amt >= 1000)) throw new Error('Minimum is 1 000 XAF.'); } catch (x) { $('#form-err').textContent = x.message; return; }
      modal(`<h3>Approve on your phone</h3><p class="muted">${method === 'Card' ? 'Enter the 4-digit code from your bank (demo: any digits).' : 'We sent a prompt to ' + esc(f.num.value) + '. Enter your ' + method + ' PIN (demo: any 4 digits).'}</p><form id="pin-form" class="stack"><input class="inp pin" name="pin" inputmode="numeric" pattern="\\d{4}" maxlength="4" required placeholder="••••" autocomplete="off"><button class="btn btn-primary" style="justify-content:center">Confirm ${F(amt)} XAF</button></form>`);
      $('#pin-form').onsubmit = ev => { ev.preventDefault(); modal('<div class="spin"></div><p class="muted" style="text-align:center">Processing with ' + method + '…</p>'); setTimeout(() => run(async () => { try { w ? A.topup(amt, method) : A.withdraw(amt, method); toast(w ? F(amt) + ' XAF added to your wallet' : F(amt) + ' XAF sent to ' + method); } finally { modal(''); route(); } }), 1400); };
    };
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const row = e.target.closest('[data-href]'); if (row && !e.target.closest('a,button')) { location.hash = row.dataset.href; return; }
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id, m = el.dataset.m;
    if (act === 'closem') { if (e.target === el) modal(''); return; }
    if (act === 'closem-x') return modal('');
    run(async () => {
      switch (act) {
        case 'demo': A.setSession(el.dataset.u); location.hash = el.dataset.u === 'u_med' ? '#/mediation' : '#/'; route(); break;
        case 'logout': A.logout(); location.hash = '#/login'; route(); break;
        case 'ff': { const had = A.fastForward(+el.dataset.h); toast('Moved the demo clock forward ' + el.dataset.h + 'h' + (had ? ' · auto-releases triggered' : '')); route(); break; }
        case 'reset': if (confirm('Delete everything and restore the demo data?')) { await A.reset(); location.hash = '#/login'; route(); toast('Demo data restored'); } break;
        case 'filter': dealFilter = el.dataset.f; route(); break;
        case 'fillcp': e.preventDefault(); $('[name=cp]').value = el.dataset.e; break;
        case 'addms': { const c = $('#ms-rows'); if (c.children.length >= 8) return toast('Up to 8 milestones.', true); c.insertAdjacentHTML('beforeend', `<div class="ms-row" data-row><label class="field"><input name="mt" placeholder="Milestone ${c.children.length + 1}"></label><label class="field"><input name="ma" type="number" min="1000" step="500" placeholder="150000"></label><label class="field"><input name="md" type="number" min="1" value="5"></label><button type="button" class="x" data-act="rmms" aria-label="Remove milestone">✕</button></div>`); break; }
        case 'rmms': { const rows = $$('[data-row]'); if (rows.length > 1) { el.closest('[data-row]').remove(); feePreview(); } break; }
        case 'accept': A.accept(id); toast('Contract signed'); route(); break;
        case 'cancel': if (confirm('Are you sure?')) { A.cancel(id); toast('Deal closed'); route(); } break;
        case 'fund': A.fund(id); toast('Escrow funded. Funds are now held.'); route(); break;
        case 'approve': if (confirm('Release the funds to the seller? This can\'t be undone.')) { A.approveM(id, m); toast('Funds released'); route(); } break;
        case 'submit': modal(`<h3>Submit delivery</h3><p class="muted sm">Give the buyer proof: tracking number, links, a photo.</p><form id="sub-form" class="stack" data-id="${id}" data-m="${m}"><label class="field">What did you deliver?<textarea name="note" required placeholder="e.g. Shipped via DHL, tracking DLA-77120"></textarea></label><label class="field">Photo evidence (optional)<input type="file" name="img" accept="image/*"></label><div class="err-msg" id="form-err"></div><div class="ms-actions" style="margin:0"><button class="btn btn-primary">Submit for approval</button><button type="button" class="btn btn-ghost" data-act="closem-x">Cancel</button></div></form>`); break;
        case 'dispute': modal(`<h3>Open a dispute</h3><p class="muted sm">Remaining funds will be frozen until a mediator decides.</p><form id="disp-form" class="stack" data-id="${id}"><label class="field">What went wrong?<textarea name="reason" required minlength="10" placeholder="Describe the issue clearly…"></textarea></label><div class="err-msg" id="form-err"></div><div class="ms-actions" style="margin:0"><button class="btn btn-danger">Open dispute</button><button type="button" class="btn btn-ghost" data-act="closem-x">Cancel</button></div></form>`); break;
        case 'contract': { const d = A.deal(id), h = await A.contractHash(d); modal(`<h3>Signed contract</h3><pre>${esc(A.contractText(d))}</pre><div class="sm muted" style="word-break:break-all">SHA-256: ${h}</div><div class="ms-actions" style="margin:0"><button class="btn btn-primary btn-sm" data-act="dl" data-id="${id}">Download .txt</button><button class="btn btn-ghost btn-sm" data-act="closem-x">Close</button></div>`); break; }
        case 'dl': { const d = A.deal(id), b = new Blob([A.contractText(d)], { type: 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = d.ref + '-contract.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); break; }
        case 'topup': case 'withdraw': payFlow(act); break;
        case 'kyc-phone': { const code = String(Math.floor(100000 + Math.random() * 900000)); modal(`<h3>Verify your phone</h3><p class="muted sm">Demo mode: no SMS is sent. Your code is <b style="color:#fff;font-size:18px">${code}</b></p><form id="otp-form" class="stack" data-code="${code}"><input class="inp pin" name="c" inputmode="numeric" maxlength="6" required placeholder="000000" autocomplete="off"><div class="err-msg" id="form-err"></div><button class="btn btn-primary" style="justify-content:center">Verify</button></form>`); break; }
        case 'kyc-id': modal(`<h3>Upload national ID</h3><p class="muted sm">Demo mode: the file is not stored or sent anywhere.</p><form id="id-form" class="stack"><input class="inp" type="file" accept="image/*,.pdf" required><button class="btn btn-primary" style="justify-content:center">Submit for verification</button></form>`); break;
        case 'notifs': { const me = A.me(), ns = A.notifs(me.id).slice(0, 30); $('#drawer').innerHTML = `<button class="close" data-act="closed" aria-label="Close">✕</button><h3>Notifications</h3><div class="nlist">${ns.length ? ns.map(n => `<a class="nitem ${n.read ? '' : 'new'}" href="#/deal/${n.deal}" data-act="closed">${esc(n.text)}<small>${fdate(n.at)}</small></a>`).join('') : '<div class="empty">Nothing yet.</div>'}</div>`; $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); A.markRead(me.id); break; }
        case 'closed': $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); setTimeout(route, 50); break;
      }
    });
  });
  $('#scrim').addEventListener('click', () => { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); route(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { modal(''); $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); } if (e.key === 'Enter' && e.target.matches('tr[data-href]')) location.hash = e.target.dataset.href; });
  document.addEventListener('input', e => { if (e.target.closest('#deal-form')) feePreview(); });
  document.addEventListener('change', e => { if (e.target.matches('[data-act=plan]')) run(async () => { A.setPlan(e.target.value); toast('Plan updated'); }); if (e.target.closest('#deal-form')) feePreview(); });

  document.addEventListener('submit', e => {
    const f = e.target, err = m => { const x = $('#form-err'); if (x) x.textContent = m; };
    const go = fn => { e.preventDefault(); err(''); run(async () => { try { await fn(); } catch (x) { err(x.message); throw x; } }); };
    switch (f.id) {
      case 'login-form': return go(async () => { const u = await A.login(f.email.value, f.password.value); location.hash = u.role === 'mediator' ? '#/mediation' : '#/'; route(); });
      case 'signup-form': return go(async () => { await A.signup({ name: f.name.value, email: f.email.value, phone: f.phone.value, biz: f.biz.value, password: f.password.value }); location.hash = '#/'; route(); toast('Welcome to Afa\'a Pay'); });
      case 'deal-form': return go(async () => {
        const rows = $$('[data-row]', f).map(r => ({ title: $('[name=mt]', r).value, amount: $('[name=ma]', r).value, days: $('[name=md]', r).value }));
        const d = A.createDeal({ role: f.role.value, counterparty: f.cp.value, title: f.title.value, desc: f.desc.value, milestones: rows, feePayer: f.fee.value, autoHours: f.auto.value });
        toast('Contract signed and sent'); location.hash = '#/deal/' + d.id;
      });
      case 'sub-form': return go(async () => { const img = await readImg(f.img.files[0]); A.submit(f.dataset.id, f.dataset.m, { note: f.note.value, img }); modal(''); toast('Delivery submitted'); route(); });
      case 'disp-form': return go(async () => { A.dispute(f.dataset.id, f.reason.value); modal(''); toast('Dispute opened. Funds frozen.'); route(); });
      case 'resolve-form': return go(async () => { A.resolve(f.dataset.id, f.c.value, f.note.value); toast('Decision issued'); route(); });
      case 'chat-form': return go(async () => { A.message(f.dataset.id, f.t.value); route(); });
      case 'profile-form': return go(async () => { A.updateProfile({ name: f.name.value, biz: f.biz.value, phone: f.phone.value }); toast('Profile saved'); route(); });
      case 'otp-form': return go(async () => { if (f.c.value !== f.dataset.code) throw new Error('That code is incorrect.'); A.setKyc(1); modal(''); toast('Phone verified'); route(); });
      case 'id-form': return go(async () => { modal('<div class="spin"></div><p class="muted" style="text-align:center">Verifying document…</p>'); await new Promise(r => setTimeout(r, 1500)); A.setKyc(2); modal(''); toast('Identity verified · trust score updated'); route(); });
    }
  });
  addEventListener('hashchange', route);

  (async function boot() {
    await A.init();
    $('#boot').remove(); route();
    setInterval(() => { if (A.me() && A.tick() && !document.querySelector('#modal .modal') && !/new|settings/.test(location.hash)) route(); }, 20000);
  })();
})();
