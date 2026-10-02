/* AFA'A PAY concept — shared behaviour. Every block no-ops if its markup is absent. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');

  // mobile nav
  const burger = $('.burger'), links = $('.links');
  if (burger) burger.addEventListener('click', () => {
    const o = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });

  // scroll reveal
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 }) : null;
  $$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  // counters
  $$('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const run = () => {
      const t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / 1400, 1), v = to * (1 - Math.pow(1 - p, 3));
        el.textContent = pre + (dec ? v.toFixed(dec) : fmt(v)) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    io ? new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { run(); o.disconnect(); } }).observe(el) : run();
  });

  // escrow flow (landing)
  const stepBtns = $$('.step');
  if (stepBtns.length) {
    const data = [
      { t: 'Agree', p: 'Buyer and seller lock terms into a digital contract: amount, deliverables and deadline. Both sign in-app.', tag: 'Contract signed', nodes: ['hot', '', ''], line: [0, 0], g: false },
      { t: 'Fund', p: 'The buyer pays by MTN MoMo, Orange Money or card. Funds move into a ring-fenced escrow account. The seller sees proof of payment but cannot touch it yet.', tag: '250 000 XAF held in escrow', nodes: ['', 'hot', ''], line: [1, 0], g: false },
      { t: 'Deliver', p: 'The seller ships or completes the work and submits proof: a tracking number, files or a photo. Our AI checks the evidence against the contract.', tag: 'Evidence verified', nodes: ['', 'hot', 'hot'], line: [0, 1], g: false },
      { t: 'Release', p: 'The buyer confirms, or the auto-release timer ends. Funds reach the seller\'s wallet in seconds and both trust scores go up.', tag: 'Released · Trust +4', nodes: ['ok', 'ok', 'ok'], line: [0, 0], g: true },
    ];
    const lines = $$('.parties .line'), nodes = $$('.parties .node');
    const info = { h: $('#flow-title'), p: $('#flow-text'), tag: $('#flow-tag') };
    let cur = 0, timer;
    const show = i => {
      cur = i; const d = data[i];
      stepBtns.forEach((b, k) => b.classList.toggle('on', k === i));
      nodes.forEach((n, k) => { n.classList.remove('hot', 'ok'); if (d.nodes[k]) n.classList.add(d.nodes[k]); });
      lines.forEach((l, k) => l.classList.toggle('go', !!d.line[k]));
      info.h.textContent = d.t; info.p.textContent = d.p; info.tag.textContent = d.tag;
      info.tag.className = 'tag' + (d.g ? ' g' : '');
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % data.length), 4500); };
    stepBtns.forEach((b, i) => b.addEventListener('click', () => { show(i); auto(); }));
    show(0); auto();
  }

  // trust score (landing + dashboard)
  function wireScore(root) {
    const fg = $('.fg', root), num = $('.gauge-num b', root), lbl = $('.gauge-num span', root);
    const ins = $$('input[type=range]', root);
    if (!fg) return;
    const C = 754, w = [.35, .25, .2, .2];
    const calc = () => {
      let s = 0;
      ins.forEach((r, i) => { s += (r.value / 100) * w[i] * 1000; const o = r.parentElement.querySelector('output'); if (o) o.textContent = r.value + '%'; });
      s = Math.round(300 + s * .55 + 0); s = Math.min(850, Math.max(300, s));
      num.textContent = s;
      fg.style.strokeDashoffset = C * (1 - (s - 300) / 550);
      lbl.textContent = s >= 760 ? 'Excellent · instant release' : s >= 680 ? 'Strong · 24h release' : s >= 560 ? 'Fair · standard hold' : 'Building · extended hold';
    };
    ins.forEach(r => r.addEventListener('input', calc));
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { calc(); o.disconnect(); } }).observe(root);
  }
  $$('[data-score]').forEach(wireScore);

  // pricing
  const tg = $$('.toggle button');
  if (tg.length) {
    tg.forEach(b => b.addEventListener('click', () => {
      tg.forEach(x => x.classList.toggle('on', x === b));
      $$('[data-m]').forEach(el => el.textContent = b.dataset.p === 'y' ? el.dataset.y : el.dataset.m);
    }));
  }
  const vol = $('#vol');
  if (vol) {
    const comp = $('#comp'), outs = { fee: $('#o-fee'), cmp: $('#o-cmp'), save: $('#o-save'), v: $('#o-vol') };
    const calc = () => {
      const v = +vol.value, rate = +$('#tier').value, other = +comp.value;
      const fee = v * rate / 100, oth = v * other / 100;
      outs.v.textContent = fmt(v) + ' XAF'; outs.fee.textContent = fmt(fee) + ' XAF';
      outs.cmp.textContent = fmt(oth) + ' XAF'; outs.save.textContent = fmt(Math.max(0, oth - fee)) + ' XAF';
    };
    ['input', 'change'].forEach(e => [vol, comp, $('#tier')].forEach(x => x.addEventListener(e, calc)));
    calc();
  }

  // dashboard
  const panels = $$('.tabs-panel');
  if (panels.length) {
    const go = id => {
      panels.forEach(p => p.classList.toggle('on', p.id === id));
      $$('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
      const t = $('#page-title'); const b = $(`.side [data-tab="${id}"]`);
      if (t && b) t.textContent = b.textContent.trim();
      if (id === 'p-trust') wireTrustOnce();
      if (id === 'p-overview') drawBars();
    };
    $$('[data-tab]').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
    const wireTrustOnce = () => setTimeout(() => $$('.dark-ring .fg').forEach(f => f.style.strokeDashoffset = 754 * (1 - (+$('#ts-num').textContent - 300) / 550)), 60);

    // revenue bars
    const sets = {
      '7D': [['Mon', 420], ['Tue', 610], ['Wed', 380], ['Thu', 790], ['Fri', 940], ['Sat', 720], ['Sun', 510]],
      '30D': [['W1', 3200], ['W2', 4100], ['W3', 3700], ['W4', 5200]],
      '12M': [['J', 9], ['F', 11], ['M', 10], ['A', 14], ['M', 13], ['J', 17], ['J', 16], ['A', 19], ['S', 22], ['O', 21], ['N', 25], ['D', 29]],
    };
    let key = '7D';
    function drawBars() {
      const box = $('#bars'), x = $('#bars-x'); if (!box) return;
      const d = sets[key], max = Math.max(...d.map(a => a[1])), unit = key === '12M' ? 'M' : 'K';
      box.innerHTML = d.map(a => `<div style="height:4px" data-v="${a[1]}${unit} XAF" data-h="${a[1] / max * 100}"></div>`).join('');
      x.innerHTML = d.map(a => `<span>${a[0]}</span>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => $$('#bars div').forEach(b => b.style.height = b.dataset.h + '%')));
    }
    $$('#range button').forEach(b => b.addEventListener('click', () => {
      $$('#range button').forEach(x => x.classList.toggle('on', x === b)); key = b.textContent; drawBars();
    }));
    drawBars();

    // transactions
    const tx = [
      ['Mballa Electronics', 'Order #4821 · Laptop', 'ME', '#2f5bff', 'Held', 'b-held', 'In escrow', 450000, 'Today, 09:41', 'MTN MoMo', 2],
      ['Ngono Fashion House', 'Order #4820 · 12 dresses', 'NF', '#6d3bff', 'Released', 'b-rel', 'Completed', 185000, 'Today, 08:12', 'Orange Money', 4],
      ['Tchoumi Logistics', 'Freight · Douala → Yaoundé', 'TL', '#0fa77a', 'Held', 'b-held', 'In escrow', 1200000, 'Yesterday', 'Bank transfer', 3],
      ['Fotso Interiors', 'Milestone 2 of 3 · Kitchen fit-out', 'FI', '#c97a12', 'Disputed', 'b-disp', 'Under review', 780000, 'Yesterday', 'Card', 3],
      ['Kamga Agro', 'Cocoa · 2 tonnes', 'KA', '#2f5bff', 'Released', 'b-rel', 'Completed', 2400000, '28 Sep', 'Bank transfer', 4],
      ['Biyong Studio', 'Brand design · Invoice 112', 'BS', '#6d3bff', 'Released', 'b-rel', 'Completed', 350000, '27 Sep', 'MTN MoMo', 4],
      ['Eyenga Auto Parts', 'Order #4802 · Brake kit', 'EA', '#d1394a', 'Refunded', 'b-ref', 'Returned to buyer', 96000, '26 Sep', 'Orange Money', 4],
      ['Nana Telecom', 'Order #4799 · 40 SIM bundles', 'NT', '#0fa77a', 'Released', 'b-rel', 'Completed', 640000, '25 Sep', 'MTN MoMo', 4],
    ];
    const body = $('#tx-body'); let flt = 'All', q = '';
    const render = () => {
      const rows = tx.map((t, i) => ({ t, i })).filter(({ t }) => (flt === 'All' || t[4] === flt) && (t[0] + t[1]).toLowerCase().includes(q));
      body.innerHTML = rows.length ? rows.map(({ t, i }) => `<tr class="r" data-i="${i}" tabindex="0">
        <td><div class="who"><span class="av" style="background:${t[3]}">${t[2]}</span><div>${t[0]}<small>${t[1]}</small></div></div></td>
        <td><span class="badge ${t[5]}">${t[4]}</span></td><td>${t[9]}</td><td>${t[8]}</td>
        <td class="amt">${fmt(t[7])} XAF</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--mute);padding:40px">No transactions match.</td></tr>';
    };
    $$('#filters button').forEach(b => b.addEventListener('click', () => { $$('#filters button').forEach(x => x.classList.toggle('on', x === b)); flt = b.dataset.f; render(); }));
    $$('.search input').forEach(i => i.addEventListener('input', () => { q = i.value.toLowerCase(); render(); if (q && !$('#p-tx').classList.contains('on')) go('p-tx'); }));
    render();

    // drawer
    const dr = $('#drawer'), sc = $('#scrim');
    const open = i => {
      const t = tx[i], steps = ['Contract signed', 'Funds secured in escrow', 'Delivery evidence submitted', 'Buyer confirmed · funds released'];
      dr.innerHTML = `<button class="close" aria-label="Close">✕</button><span class="badge ${t[5]}">${t[4]}</span><h3>${fmt(t[7])} XAF</h3><p style="color:var(--mute)">${t[0]} · ${t[1]}</p>
        <dl><dt>Status</dt><dd>${t[6]}</dd><dt>Payment method</dt><dd>${t[9]}</dd><dt>Escrow fee</dt><dd>${fmt(t[7] * .015)} XAF</dd><dt>You receive</dt><dd>${fmt(t[7] * .985)} XAF</dd><dt>Reference</dt><dd>AFP-${(48210 + i * 37)}</dd></dl>
        <div class="tl">${steps.map((s, k) => `<div class="${k < t[10] ? 'd' : ''}">${s}<small>${k < t[10] ? t[8] : 'Pending'}</small></div>`).join('')}</div>
        ${t[4] === 'Held' ? '<button class="btn btn-primary" style="width:100%;justify-content:center" id="rel">Request release</button>' : ''}`;
      dr.classList.add('open'); sc.classList.add('open'); $('.close', dr).focus();
      $('.close', dr).onclick = shut;
      const r = $('#rel', dr); if (r) r.onclick = () => { shut(); toast('Release request sent to buyer'); };
    };
    const shut = () => { dr.classList.remove('open'); sc.classList.remove('open'); };
    sc.addEventListener('click', shut); document.addEventListener('keydown', e => e.key === 'Escape' && shut());
    body.addEventListener('click', e => { const r = e.target.closest('tr.r'); if (r) open(+r.dataset.i); });
    body.addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('tr.r'); if (r) open(+r.dataset.i); } });

    // new escrow
    function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2800); }
    const form = $('#new-esc');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form), a = +f.get('amt') || 0;
      tx.unshift([f.get('who') || 'New counterparty', f.get('desc') || 'New escrow', (f.get('who') || 'N')[0].toUpperCase() + 'X', '#2f5bff', 'Held', 'b-held', 'Awaiting buyer funding', a, 'Just now', f.get('pay'), 1]);
      render(); form.reset(); go('p-tx'); toast('Escrow link created · ' + fmt(a) + ' XAF');
    });
    $$('[data-new]').forEach(b => b.addEventListener('click', () => go('p-new')));
    $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  }
})();
