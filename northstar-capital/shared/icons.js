/* Northstar Capital — icon set + logo sprite
   24px grid · 1.5px stroke · round caps and joins · currentColor.
   Include as the first script in <body>; it injects one hidden SVG sprite.
   Use:  <svg class="i"><use href="#i-overview"/></svg>   or   NS.icon('overview') */
(function () {
  var I = {
    overview: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.6"/><rect x="13.5" y="11" width="7" height="9.5" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/>',
    cashflow: '<path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5"/><path d="M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5"/>',
    revenue: '<path d="M3.5 17 9 11.5l4 4 7-8"/><path d="M15.5 7.5H20V12"/>',
    expenses: '<path d="M3.5 7 9 12.5l4-4 7 8"/><path d="M15.5 16.5H20V12"/>',
    invoices: '<path d="M7 3.5h7.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M14.5 3.5V8H19"/><path d="M9 12.5h6M9 16h4"/>',
    transactions: '<path d="M8 4.5v14m0 0L4.5 15M8 18.5 11.5 15"/><path d="M16 19.5v-14m0 0L12.5 9M16 5.5 19.5 9"/>',
    reports: '<rect x="4.5" y="12" width="4" height="8" rx=".9"/><rect x="10" y="4.5" width="4" height="15.5" rx=".9"/><rect x="15.5" y="9" width="4" height="11" rx=".9"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'arrow-right': '<path d="M4.5 12h15m0 0L14 6.5M19.5 12 14 17.5"/>',
    'arrow-left': '<path d="M19.5 12h-15m0 0L10 6.5M4.5 12 10 17.5"/>',
    'arrow-up': '<path d="M12 19.5v-15m0 0L6.5 10M12 4.5 17.5 10"/>',
    'arrow-down': '<path d="M12 4.5v15m0 0L6.5 14M12 19.5 17.5 14"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    'arrow-down-right': '<path d="M7 7l10 10M17 8.5V17H8.5"/>',
    'chevron-down': '<path d="m6 9.5 6 6 6-6"/>',
    'chevron-up': '<path d="m6 14.5 6-6 6 6"/>',
    'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
    'chevron-left': '<path d="m14.5 6-6 6 6 6"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 15v1.5"/>',
    bank: '<path d="M3.5 9 12 4l8.5 5z"/><path d="M6 11.5v6M10 11.5v6M14 11.5v6M18 11.5v6M3.5 20.5h17"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M6.5 15h3.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.5-3.2 2.8-5 5.5-5s5 1.8 5.5 5"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17 14.7c2 .5 3.2 2.2 3.5 4.8"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.6-3.7 3.4-6 7-6s6.400 2.300 7 6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.500"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    download: '<path d="M12 4v11m0 0-4.500-4.500M12 15l4.500-4.500M5 19.500h14"/>',
    upload: '<path d="M12 15V4m0 0L7.500 8.500M12 4l4.500 4.500M5 19.500h14"/>',
    filter: '<path d="M4 6.500h16M7 12h10M10 17.500h4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
    alert: '<path d="M12 4 21 19.500H3z"/><path d="M12 10v4.500M12 17.300v.1"/>',
    info: '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5M12 8v.1"/>',
    wallet: '<path d="M4 7.500A2.500 2.500 0 0 1 6.500 5H18v3"/><rect x="3.500" y="8" width="17" height="11.500" rx="2.500"/><path d="M16.500 13.800H18"/>',
    target: '<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><path d="M12 12v.01"/>',
    globe: '<circle cx="12" cy="12" r="8.500"/><path d="M3.500 12h17M12 3.500c2.600 2.400 3.800 5.200 3.800 8.500s-1.200 6.100-3.800 8.500c-2.600-2.400-3.800-5.200-3.800-8.500S9.400 5.900 12 3.500z"/>',
    mail: '<rect x="3.500" y="5.500" width="17" height="13" rx="2.500"/><path d="m4 8 8 5.500L20 8"/>',
    chat: '<path d="M5 5.500h14A1.500 1.500 0 0 1 20.500 7v8.500a1.500 1.500 0 0 1-1.500 1.500h-7l-4.500 3.500V17H5a1.500 1.500 0 0 1-1.500-1.500V7A1.500 1.500 0 0 1 5 5.500z"/>',
    pin: '<path d="M12 21s6.500-5.600 6.500-11a6.500 6.500 0 0 0-13 0c0 5.400 6.500 11 6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
    send: '<path d="M20.500 3.500 3.500 10.200l6.700 3.100 3.100 6.700z"/><path d="M10.200 13.300 20.500 3.500"/>',
    clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
    refresh: '<path d="M19.500 12a7.500 7.500 0 0 1-13 5.100"/><path d="M4.500 12a7.500 7.500 0 0 1 13-5.100"/><path d="M17.500 3.500v3.800h-3.800M6.500 20.500v-3.800h3.800"/>',
    layers: '<path d="m12 4 8.500 4.500L12 13 3.500 8.500z"/><path d="m3.500 12.500 8.500 4.500 8.500-4.500M3.500 16.500 12 21l8.500-4.500"/>',
    key: '<circle cx="8" cy="15" r="3.800"/><path d="m10.700 12.300 8.800-8.800M16 7l2.500 2.500M13.500 9.500l2 2"/>',
    eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9.500 4.500H6A1.500 1.500 0 0 0 4.500 6v12A1.500 1.500 0 0 0 6 19.500h3.500M15 8l4 4-4 4M19 12H9.500"/>',
    moon: '<path d="M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="3.800"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M18.400 5.600 17 7M7 17l-1.400 1.400"/>',
    help: '<circle cx="12" cy="12" r="8.500"/><path d="M9.800 9.700a2.300 2.300 0 0 1 4.400.9c0 1.600-2.200 2-2.200 3.400M12 16.800v.1"/>',
    book: '<path d="M4.500 5.500A1.500 1.500 0 0 1 6 4h13.500v13.500H6A1.500 1.500 0 0 0 4.500 19z"/><path d="M4.500 19A1.500 1.500 0 0 0 6 20.500h13.500v-3"/>',
    play: '<path d="M8 5.500v13l10.500-6.500z"/>',
    compass: '<circle cx="12" cy="12" r="8.500"/><path d="m15.500 8.500-2 5-5 2 2-5z"/>',
    repeat: '<path d="M5 11V9a3 3 0 0 1 3-3h11M16 3l3 3-3 3"/><path d="M19 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>',
    percent: '<path d="M18.500 5.500 5.500 18.500"/><circle cx="7.500" cy="7.500" r="2.300"/><circle cx="16.500" cy="16.500" r="2.300"/>',
    copy: '<rect x="8.500" y="8.500" width="11" height="11" rx="2"/><path d="M15.500 8.500V6A1.500 1.500 0 0 0 14 4.500H6A1.500 1.500 0 0 0 4.500 6v8A1.500 1.500 0 0 0 6 15.500h2.500"/>',
    more: '<circle cx="6" cy="12" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="18" cy="12" r=".9"/>',
    edit: '<path d="m4.500 19.500 1-4.200L16.800 4a1.800 1.800 0 0 1 2.500 0l.7.7a1.800 1.800 0 0 1 0 2.500L8.700 18.500z"/><path d="m14.500 6.500 3 3"/>',
    trash: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l.8 12a1.500 1.500 0 0 0 1.500 1.400h6.400a1.500 1.500 0 0 0 1.500-1.400l.8-12"/>',
    bolt: '<path d="M13 3.500 5.500 13.500H11l-.5 7L18.500 10H13z"/>',
    plug: '<path d="M9 3.500v4M15 3.500v4M6.500 7.500h11V11a5.500 5.500 0 0 1-11 0zM12 16.500v4"/>',
    pie: '<path d="M12 3.500V12h8.500A8.500 8.500 0 0 0 12 3.500z"/><path d="M10 6a8.500 8.500 0 1 0 8 8"/>',
    building: '<rect x="5" y="3.500" width="9.500" height="17" rx="1.500"/><path d="M14.500 9.500H19a.5.5 0 0 1 .5.5v10.500M8.500 7.500H11M8.500 11H11M8.500 14.500H11M5 20.500h14.500"/>',
    tag: '<path d="M3.500 12.200V4.500a1 1 0 0 1 1-1h7.700l8.300 8.300-8.700 8.700z"/><circle cx="8" cy="8" r="1.300"/>',
    receipt: '<path d="M6.500 3.500h11v17l-2.750-1.800L12 20.500l-2.750-1.800L6.500 20.500z"/><path d="M9.500 8.500h5M9.500 12h5"/>',
    inbox: '<path d="m3.500 13.500 2.500-8h12l2.500 8v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M3.500 13.500H9l1 2.500h4l1-2.500h5.500"/>',
    activity: '<path d="M3.500 12h4l2.500-6.500 4 13 2.500-6.500h4"/>',
    sparkline: '<path d="M3.500 16 8 11l3.500 3.500L20.500 6"/>',
    scale: '<path d="M12 4v16M6 20h12M5 7h14"/><path d="m5 7-2.500 6a3 3 0 0 0 5 0zM19 7l-2.500 6a3 3 0 0 0 5 0z"/>',
    flag: '<path d="M5.500 21V4.500M5.500 5h12l-2 3.500 2 3.500h-12"/>',
    briefcase: '<rect x="3.500" y="7.500" width="17" height="12" rx="2.200"/><path d="M8.500 7.500V6a1.500 1.500 0 0 1 1.500-1.500h4A1.500 1.500 0 0 1 15.500 6v1.500M3.500 13h17"/>',
    box: '<path d="M12 3.500 20 8v8l-8 4.500L4 16V8z"/><path d="M4 8l8 4.500L20 8M12 12.500v8"/>',
    fingerprint: '<path d="M6.500 10a5.500 5.500 0 0 1 11 0v2.500M5 14.500v-4M8.500 18.500c.7-1.500 1-3.200 1-5v-3a2.500 2.500 0 0 1 5 0v2.500c0 2.200.5 4.200 1.500 6M12 12.500c0 2.700-.4 4.800-1.300 6.800M18.500 16c0 1.300.2 2.600.6 3.500"/>'
  };
  // tidy any padded decimals (e.g. 4.500 -> 4.5) so sprite stays compact
  Object.keys(I).forEach(function (k) { I[k] = I[k].replace(/(\d)\.(\d*?)0+(?=\D)/g, function (m, a, b) { return b ? a + '.' + b : a; }); });

  /* ---------- Northstar logo geometry (48 grid) ----------
     Mark = bold N + a "north wedge" inlay in the lower-left counter.
     N polygon: 7,42 7,6 16,6 32,29.04 32,6 41,6 41,42 32,42 16,18.96 16,42
     Wedge (inlaid, 2.2u gap): 18.2,25.98 18.2,42 29.32,42
     Wedge (solid, for <=24px): 16,18.96 16,42 32,42                         */
  var N = '<polygon fill="currentColor" points="7,42 7,6 16,6 32,29.04 32,6 41,6 41,42 32,42 16,18.96 16,42"/>';
  var W = '<polygon fill="var(--mark-accent,#2B5BFF)" points="18.2,25.98 18.2,42 29.32,42"/>';
  var WS = '<polygon fill="var(--mark-accent,#2B5BFF)" points="16,18.96 16,42 32,42"/>';
  var FONT = 'font-family="Geist,Inter,ui-sans-serif,system-ui,sans-serif"';
  var MONO = 'font-family="Geist Mono,ui-monospace,Menlo,Consolas,monospace"';

  var logos =
    // symbol (tight crop of the mark)
    '<symbol id="ns-mark" viewBox="7 6 34 36">' + N + W + '</symbol>' +
    '<symbol id="ns-mark-sm" viewBox="7 6 34 36">' + N + WS + '</symbol>' +
    // app tile: mark centred on a rounded square (colours follow --tile-bg / --tile-fg)
    '<symbol id="ns-tile" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="var(--tile-bg,#0B0D12)"/><g transform="translate(24 24)" style="color:var(--tile-fg,#F6F5F1)">' + N + WS + '</g></symbol>' +
    // wordmark
    '<symbol id="ns-word" viewBox="0 -2 142.6 28"><text x="0" y="24" ' + FONT + ' font-weight="600" font-size="33" letter-spacing="-1.15" textLength="142.6" lengthAdjust="spacing" fill="currentColor">Northstar</text></symbol>' +
    // primary logo — horizontal, two-line
    '<symbol id="ns-logo" viewBox="7 6 195.6 36"><g>' + N + W + '</g>' +
      '<text x="55" y="30.2" ' + FONT + ' font-weight="600" font-size="31" letter-spacing="-1.08" textLength="134" lengthAdjust="spacing" fill="currentColor">Northstar</text>' +
      '<text x="55.5" y="42" ' + MONO + ' font-weight="500" font-size="10.5" textLength="132" lengthAdjust="spacing" fill="currentColor" opacity=".62">CAPITAL</text></symbol>' +
    // compact horizontal — mark + Northstar
    '<symbol id="ns-logo-compact" viewBox="7 6 195.6 36"><g>' + N + W + '</g>' +
      '<text x="55" y="35" ' + FONT + ' font-weight="600" font-size="31" letter-spacing="-1.08" textLength="134" lengthAdjust="spacing" fill="currentColor">Northstar</text></symbol>' +
    // secondary logo — stacked
    '<symbol id="ns-logo-stacked" viewBox="0 0 142.6 110"><g transform="translate(54.3 0) translate(-7 -6)">' + N + W + '</g>' +
      '<text x="0" y="78" ' + FONT + ' font-weight="600" font-size="33" letter-spacing="-1.15" textLength="142.6" lengthAdjust="spacing" fill="currentColor">Northstar</text>' +
      '<text x="0.5" y="102" ' + MONO + ' font-weight="500" font-size="10.5" textLength="141" lengthAdjust="spacing" fill="currentColor" opacity=".62">CAPITAL</text></symbol>';

  function sprite() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" focusable="false">';
    Object.keys(I).forEach(function (k) {
      s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + I[k] + '</symbol>';
    });
    return s + logos + '</svg>';
  }
  function inject() {
    if (document.getElementById('ns-sprite')) return;
    var d = document.createElement('div');
    d.id = 'ns-sprite';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = sprite();
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.body) inject(); else document.addEventListener('DOMContentLoaded', inject);

  var NS = (window.NS = window.NS || {});
  NS.icons = Object.keys(I);
  NS.icon = function (name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  };
  NS.logo = function (variant, cls) {
    var map = { primary: ['ns-logo', '195.6 / 36'], compact: ['ns-logo-compact', '195.6 / 36'], stacked: ['ns-logo-stacked', '142.6 / 110'], word: ['ns-word', '142.6 / 28'], mark: ['ns-mark', '34 / 36'] };
    var m = map[variant || 'primary'];
    return '<svg class="ns-logo ' + (cls || '') + '" role="img" aria-label="Northstar Capital" style="aspect-ratio:' + m[1] + '"><use href="#' + m[0] + '"/></svg>';
  };
})();
