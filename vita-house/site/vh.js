/* ==========================================================================
   VITA HOUSE — core: icons, logo, illustration system, shell, helpers
   Concept project by Rovard Studios. Fictional brand.
   ========================================================================== */
(function () {
  'use strict';
  const VH = (window.VH = window.VH || {});

  /* ---------- tiny helpers ---------- */
  VH.$ = (s, r = document) => r.querySelector(s);
  VH.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  VH.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  VH.params = new URLSearchParams(location.search);
  VH.embed = VH.params.has('embed');
  if (VH.embed) document.documentElement.classList.add('embed');
  document.documentElement.classList.remove('no-js');
  if (VH.params.has('static')) document.documentElement.style.scrollBehavior = 'auto';

  /* ---------- icon set: 24px, 1.7 stroke, round caps — Vita House "soft line" ---------- */
  const I = {
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    'calendar-check': '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    video: '<rect x="3" y="6.5" width="12.5" height="11" rx="3"/><path d="m15.5 11 5-2.8v7.6l-5-2.8"/>',
    message: '<path d="M20.5 11.5a8 8 0 0 1-11.9 7L4 20l1.3-4.2A8 8 0 1 1 20.5 11.5z"/>',
    doc: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
    heart: '<path d="M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.5 12 20 12 20z"/>',
    pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
    stethoscope: '<path d="M6 3.5v5a4 4 0 0 0 8 0v-5M5 3.5h2M13 3.5h2"/><path d="M10 12.5V14a4.5 4.5 0 0 0 9 0v-2"/><circle cx="19" cy="10" r="2"/>',
    leaf: '<path d="M12 21v-9"/><path d="M12 12C12 7.5 8.5 5 4.5 5c0 4 2.5 7 7.5 7z"/><path d="M12 15c0-3.5 2.6-6 7-6 0 3.7-2.3 6-7 6z"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14c.9 1.4 2 2 3.5 2s2.6-.6 3.5-2M9 9.5h.01M15 9.5h.01"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    apple: '<path d="M12 8c-1.4-1.2-3.4-1.5-5-.6C4.6 8.2 4 11 5 14c1 3 3 6 5 6 .8 0 1.2-.5 2-.5s1.2.5 2 .5c2 0 4-3 5-6 1-3 .4-5.8-2-7.1-1.6-.9-3.6-.6-5 .6z"/><path d="M12 8c0-2 1-3.5 3-4.2"/>',
    users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.2"/><path d="M3.5 19.5c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M15.5 14.5c2.7-.4 5 1.2 5 4"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.6-3.8 3.6-6 7.5-6s6.9 2.2 7.5 6"/>',
    baby: '<circle cx="12" cy="10" r="5"/><path d="M5 20.5c.8-3 3.5-4.5 7-4.5s6.2 1.5 7 4.5M12 5c0-1.2.9-2 2-2"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    syringe: '<path d="m15 4 5 5M17.5 6.5 8 16l-1 3.2L4.2 22M10 14l-3-3M13 7l4 4M6.5 12.5 12 7"/>',
    flask: '<path d="M9.5 3.5h5M10.5 3.5V9L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5.5-10V3.5M7.5 15h9"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'chev-right': '<path d="m9 6 6 6-6 6"/>',
    'chev-left': '<path d="m15 6-6 6 6 6"/>',
    'chev-down': '<path d="m6 9 6 6 6-6"/>',
    'chev-up': '<path d="m6 15 6-6 6 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 21h4"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14"/>',
    upload: '<path d="M12 16V5M7.5 9 12 4.5 16.5 9M5 20h14"/>',
    phone: '<path d="M5.5 4h3l1.5 4-2 1.3a11 11 0 0 0 5.7 5.7L15 13l4 1.5v3a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m4 8 8 5.5L20 8"/>',
    home: '<path d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
    idcard: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2.2 3-2.2s2.5.7 3 2.2M14.5 10h4M14.5 13h3"/>',
    star: '<path d="m12 3.8 2.5 5.2 5.6.8-4.1 4 1 5.6L12 16.8 7 19.4l1-5.6-4.1-4 5.6-.8z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.5 2.5 4.5-5"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5C9.5 18 8.5 15 8.5 12s1-6 3.5-8.5z"/>',
    access: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="7.8" r=".6"/><path d="m8 10.5 4 .8 4-.8M12 11.3v3.2M10 18l2-3.5 2 3.5"/>',
    external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H10"/>',
    filter: '<path d="M4 6h16l-6 7v5l-4 2v-7z"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 0 1-13 5M4.5 12a7.5 7.5 0 0 1 13-5"/><path d="M17.5 3v4h-4M6.5 21v-4h4"/>',
    paperclip: '<path d="m19 11-7 7a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4a3 3 0 0 1 4.3 4.3l-7.4 7.4a1.5 1.5 0 0 1-2.1-2.1L14 8.5"/>',
    send: '<path d="m21 3-9.5 18-2.2-7.8L2 11z"/><path d="M21 3 9.3 13.2"/>',
    pill: '<path d="m10.5 20.5-6-6a4.2 4.2 0 0 1 6-6l6 6a4.2 4.2 0 0 1-6 6zM7.5 11.5l6 6"/>',
    logout: '<path d="M9 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9M15 8l4 4-4 4M19 12H9"/>',
    map: '<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20zM9 4v13.5M15 6.5V20"/>',
    navigate: '<path d="m4 11 16-7-7 16-2-7z"/>',
    sparkle: '<path d="M12 3.5 14 10l6.5 2-6.5 2L12 20.5 10 14l-6.5-2 6.5-2z"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2-2.5 3.7M12 17h.01"/>',
    checklist: '<path d="m4 7 1.5 1.5L8.5 5.5M4 13l1.5 1.5 3-3M4 19l1.5 1.5 3-3M12 7h8M12 13h8M12 19h8"/>',
    wifi: '<path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4 4 0 0 1 6 0M12 20h.01"/>',
    parking: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9.5 16.5v-9h3.2a2.8 2.8 0 0 1 0 5.6H9.5"/>',
    train: '<rect x="5.5" y="3.5" width="13" height="13" rx="3.5"/><path d="M5.5 11h13M9 20l1.5-3.5M15 20l-1.5-3.5M9 7.5h.01M15 7.5h.01"/>',
    wheelchair: '<circle cx="10" cy="4.5" r="1.7"/><path d="M10 8v6h5l2.5 5M10 11h5M7.5 11.5a5 5 0 1 0 6.5 7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
    shield2: '<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/>',
    layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5zM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    type: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.5.3-2.8 1.8-2.8H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.8 3.5 12 3.5z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".7"/>',
    sitemap: '<rect x="9" y="3.5" width="6" height="4.5" rx="1.5"/><rect x="3" y="16" width="6" height="4.5" rx="1.5"/><rect x="15" y="16" width="6" height="4.5" rx="1.5"/><path d="M12 8v3.5M6 16v-4.5h12V16"/>',
    phone2: '<rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M11 18.5h2"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/>'
  };
  VH.icons = I;
  VH.icon = (n, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">${I[n] || ''}</svg>`;
  VH.sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${Object.keys(I).map(k => `<symbol id="i-${k}" viewBox="0 0 24 24">${I[k]}</symbol>`).join('')}</svg>`;

  /* ---------- logo: the "Open Door" ----------
     An arch (the house / doorway), a V (Vita; two open arms; a sprouting shoot)
     and a small sun / head above it. */
  let mid = 0;
  VH.mark = (o = {}) => {
    const id = 'vm' + (++mid);
    const { arch = 'var(--moss-700)', head = 'var(--honey-400)', cls = '', title = 'Vita House', guides = false } = o;
    return `<svg class="vh-mark ${cls}" viewBox="0 0 64 72" role="img" aria-label="${title}"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="72"><rect width="64" height="72" fill="#fff"/><path d="M19 40 32 62 45 40" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="27" r="7.2" fill="#000"/></mask></defs><path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="${arch}" mask="url(#${id})"/><circle cx="32" cy="27" r="4.5" fill="${head}"/>${guides ? '<g fill="none" stroke="#C4714C" stroke-width=".4" stroke-dasharray="1.2 1.2"><circle cx="32" cy="32" r="26"/><path d="M32 0v72M0 32h64M6 72V32M58 72V32M19 40l13 22 13-22"/><circle cx="32" cy="27" r="7.2"/></g>' : ''}</svg>`;
  };
  VH.logo = (o = {}) => {
    const { href = 'index.html', dark = false, size = '1.5rem', mono = false, label = true } = o;
    const m = VH.mark(mono ? { arch: 'currentColor', head: 'currentColor' } : dark ? { arch: 'var(--sage-200)', head: 'var(--honey-400)' } : {});
    const t = `<span class="logo-word">Vita <i>House</i></span>`;
    return href ? `<a class="logo ${dark ? 'on-dark' : ''}" href="${href}" style="font-size:${size}" ${label ? 'aria-label="Vita House — home"' : ''}>${m}${t}</a>` : `<span class="logo ${dark ? 'on-dark' : ''}" style="font-size:${size}">${m}${t}</span>`;
  };
  VH.favicon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="72"><rect width="64" height="72" fill="#fff"/><path d="M19 40 32 62 45 40" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="27" r="7.2" fill="#000"/></mask></defs><path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="#3F5C47" mask="url(#m)"/><circle cx="32" cy="27" r="4.5" fill="#E8BC5E"/></svg>');

  /* ---------- illustration system: people ---------- */
  const SKIN = {
    s1: ['#F6DDC6', '#E6BFA0'], s2: ['#EBC39B', '#D6A47A'], s3: ['#D49E73', '#B98159'],
    s4: ['#B07448', '#8F5A36'], s5: ['#8A5535', '#6E4128'], s6: ['#63392A', '#4C2A1E']
  };
  const HAIR = { black: '#241C19', brown: '#4B3225', chestnut: '#6E4A30', blond: '#C9A15A', grey: '#A9A9A2', white: '#D8D6CF', auburn: '#8A4A2B' };
  const BG = { sage: '#C9D7C0', sage2: '#DCE6D3', blush: '#F0D3C4', honey: '#F2DDA6', sand: '#E3D8C3', clay: '#E9BFA6', moss: '#3F5C47' };
  VH.palette = { SKIN, HAIR, BG };

  function hairBack(style, c) {
    switch (style) {
      case 'long': return `<path d="M60 104C52 144 56 182 68 200h64c12-18 16-56 8-96-2-34-20-50-40-50S62 70 60 104z" fill="${c}"/>`;
      case 'bob': return `<path d="M58 100c-6 32-2 52 8 64h68c10-12 14-32 8-64-4-30-22-44-42-44S62 70 58 100z" fill="${c}"/>`;
      case 'curly': return `<g fill="${c}"><circle cx="100" cy="72" r="40"/><circle cx="66" cy="92" r="24"/><circle cx="134" cy="92" r="24"/><circle cx="76" cy="60" r="24"/><circle cx="124" cy="60" r="24"/><circle cx="58" cy="116" r="12"/><circle cx="142" cy="116" r="12"/></g>`;
      case 'coils': return `<g fill="${c}"><circle cx="100" cy="68" r="38"/><circle cx="70" cy="80" r="20"/><circle cx="130" cy="80" r="20"/><circle cx="82" cy="56" r="20"/><circle cx="118" cy="56" r="20"/></g>`;
      case 'bun': return `<circle cx="100" cy="42" r="15" fill="${c}"/><path d="M96 54h8v8h-8z" fill="${c}"/>`;
      default: return '';
    }
  }
  function hairFront(style, c) {
    switch (style) {
      case 'short': return `<path d="M63 106C57 70 80 55 100 55c22 0 43 15 37 51-4-12-10-20-22-24-12 8-34 10-52 24z" fill="${c}"/>`;
      case 'side': return `<path d="M63 108C56 70 80 54 102 54c24 0 40 18 34 54-2-14-10-24-22-28-8 12-30 20-51 28z" fill="${c}"/>`;
      case 'long': return `<path d="M63 108C58 70 80 55 101 55c24 0 38 16 36 52-8-14-20-26-42-30-6 14-18 24-32 31z" fill="${c}"/>`;
      case 'bob': return `<path d="M62 110C54 68 80 53 101 53c24 0 42 16 38 56-4-14-16-26-34-30-18 4-34 14-43 31z" fill="${c}"/>`;
      case 'curly': return `<path d="M66 96c4-18 18-26 34-26s30 8 34 26c-8-8-20-12-34-12S74 88 66 96z" fill="${c}"/>`;
      case 'coils': return `<path d="M68 92c4-14 16-22 32-22s28 8 32 22c-8-6-20-10-32-10S76 86 68 92z" fill="${c}"/>`;
      case 'bun': return `<path d="M63 106C58 72 80 56 100 56c22 0 42 16 37 50-4-12-12-20-24-24-14 8-34 10-50 24z" fill="${c}"/>`;
      case 'wrap': return `<path d="M62 100C58 66 80 52 100 52s42 14 38 48c-14-12-28-14-38-14s-24 2-38 14z" fill="${c}"/><path d="M100 54c-12-12-6-26 6-22 10 4 6 16-6 22z" fill="${c}"/><path d="M62 100c14-14 28-16 38-16s24 2 38 16" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="3"/>`;
      case 'beard': return `<path d="M64 108C60 76 80 58 100 58c20 0 40 18 36 50-6-14-14-22-36-22S70 94 64 108z" fill="${c}"/><path d="M66 114c0 30 16 48 34 48s34-18 34-48c-8 12-20 20-34 20s-26-8-34-20z" fill="${c}"/><path d="M88 138c8 5 16 5 24 0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="0"/>`;
      case 'beardbald': return `<path d="M66 114c0 30 16 48 34 48s34-18 34-48c-8 12-20 20-34 20s-26-8-34-20z" fill="${c}"/>`;
      default: return '';
    }
  }

  /* returns <g> content in a 200x240 box. */
  VH.person = (o = {}) => {
    const sk = SKIN[o.skin || 's2'], hc = HAIR[o.hair || 'brown'] || o.hair;
    const cloth = o.cloth || '#3F5C47', style = o.style || 'short', outfit = o.outfit || 'tee';
    const glasses = o.glasses, steth = o.steth, ink = '#2A2320';
    let body = '';
    if (outfit === 'coat') {
      body = `<path d="M14 244C14 198 50 176 100 176S186 198 186 244z" fill="#F4EFE4"/>
        <path d="M78 176 100 214 122 176z" fill="${cloth}"/>
        <path d="M78 176 96 220 82 244H14C14 204 44 182 78 176z" fill="#EAE3D3"/><path d="M122 176 104 220 118 244h68c0-40-30-62-64-68z" fill="#EAE3D3"/>
        <path d="M78 176 100 214 122 176" fill="none" stroke="#D9CFBA" stroke-width="2"/>`;
    } else if (outfit === 'knit') {
      body = `<path d="M16 244C16 198 52 176 100 176S184 198 184 244z" fill="${cloth}"/><path d="M82 176c4 10 12 16 18 16s14-6 18-16" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="6" stroke-linecap="round"/>`;
    } else {
      body = `<path d="M16 244C16 198 52 176 100 176S184 198 184 244z" fill="${cloth}"/>`;
    }
    const neckline = outfit === 'coat' ? '' : `<path d="M80 176c4 18 12 26 20 26s16-8 20-26z" fill="${sk[0]}"/>`;
    const coatSkin = outfit === 'coat' ? `<path d="M84 176c3 14 9 22 16 22s13-8 16-22z" fill="${sk[0]}"/>` : '';
    const stethoscope = steth ? `<g fill="none" stroke="#2F3A33" stroke-width="4" stroke-linecap="round"><path d="M72 178c-6 22 4 44 28 50 24-6 34-28 28-50"/></g><circle cx="100" cy="230" r="7" fill="#2F3A33"/><circle cx="100" cy="230" r="3" fill="#C9D7C0"/>` : '';
    const gl = glasses ? `<g fill="none" stroke="${ink}" stroke-width="3"><rect x="70" y="98" width="25" height="19" rx="8"/><rect x="105" y="98" width="25" height="19" rx="8"/><path d="M95 106h10"/></g>` : '';
    return `
      ${hairBack(style, hc)}
      <rect x="86" y="138" width="28" height="48" rx="12" fill="${sk[1]}"/>
      ${body}${neckline}${coatSkin}
      <circle cx="64" cy="112" r="7.5" fill="${sk[1]}"/><circle cx="136" cy="112" r="7.5" fill="${sk[1]}"/>
      <ellipse cx="100" cy="108" rx="36" ry="42" fill="${sk[0]}"/>
      <path d="M118 70c16 10 22 36 12 58-4 8-12 16-22 20 18-8 28-28 26-48-1-14-6-24-16-30z" fill="${sk[1]}" opacity=".35"/>
      <circle cx="80" cy="124" r="7" fill="#D9695A" opacity=".18"/><circle cx="120" cy="124" r="7" fill="#D9695A" opacity=".18"/>
      ${glasses ? '' : `<path d="M82 108q6 5 12 0M106 108q6 5 12 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`}
      ${glasses ? `<path d="M80 108q4 3 8 0M112 108q4 3 8 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>` : ''}
      <path d="M90 128q10 9 20 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      ${hairFront(style, hc)}${gl}${stethoscope}`;
  };

  /* A portrait in an arch (or circle) */
  VH.portrait = (o = {}) => {
    const bg = BG[o.bg] || o.bg || BG.sage;
    const arch = o.shape !== 'circle';
    const vb = arch ? '0 0 200 240' : '36 50 128 128';
    const bgShape = arch ? `<path d="M0 240V100a100 100 0 0 1 200 0v140z" fill="${bg}"/><path d="M14 240V100a86 86 0 0 1 172 0v140" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>` : `<rect x="0" y="0" width="200" height="240" fill="${bg}"/>`;
    return `<svg viewBox="${vb}" role="img" aria-label="${VH.esc(o.alt || 'Illustrated portrait')}" preserveAspectRatio="xMidYMid slice">${bgShape}${VH.person(o)}</svg>`;
  };

  /* ---------- illustration system: shapes ---------- */
  VH.sprig = (c = '#4D6F54', c2 = '#8DA886') => `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 0C4-30 6-60 2-100" stroke="${c}" stroke-width="3"/>
      <path d="M2 -14C-14-18-24-30-24-44c14 0 24 12 26 30z" fill="${c2}" stroke="none"/>
      <path d="M3 -34C20-36 30-48 30-62c-16 2-28 14-27 28z" fill="${c}" stroke="none"/>
      <path d="M3 -58C-10-62-18-74-16-86c12 2 20 12 19 28z" fill="${c2}" stroke="none"/>
      <path d="M2 -78C14-82 22-92 20-104c-12 4-18 12-18 26z" fill="${c}" stroke="none"/>
    </g>`;
  VH.sunArcs = (cx, cy, r, colors) => colors.map((c, i) => `<path d="M${cx - r + i * r / colors.length} ${cy}a${r - i * r / colors.length} ${r - i * r / colors.length} 0 0 1 ${2 * (r - i * r / colors.length)} 0z" fill="${c}"/>`).join('');
  VH.archPath = (x, y, w, h) => `M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}z`;

  VH.heroScene = () => `
    <svg class="scene" viewBox="0 0 560 600" role="img" aria-label="Illustration: a Vita House clinician and a patient in a warm, arched doorway.">
      <defs><clipPath id="hs-big"><path d="${VH.archPath(130, 30, 340, 570)}"/></clipPath><clipPath id="hs-small"><path d="${VH.archPath(10, 250, 170, 350)}"/></clipPath></defs>
      <g>${VH.sunArcs(120, 175, 120, ['#F2DDA6', '#E8BC5E', '#D98E6B'])}</g>
      <path d="${VH.archPath(10, 250, 170, 350)}" fill="#F0D3C4"/>
      <g clip-path="url(#hs-small)"><g transform="translate(34 300) scale(.72)">${VH.person({ skin: 's5', hair: 'black', style: 'curly', cloth: '#C4714C', outfit: 'knit' })}</g></g>
      <path d="${VH.archPath(130, 30, 340, 570)}" fill="#C9D7C0"/>
      <g clip-path="url(#hs-big)">
        <circle cx="300" cy="190" r="108" fill="#DCE6D3"/>
        <path d="M130 600V300a170 170 0 0 1 340 0v300" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" transform="translate(0 0)"/>
        <g transform="translate(150 258) scale(1.24)">${VH.person({ skin: 's3', hair: 'black', style: 'long', cloth: '#3F5C47', outfit: 'coat', steth: true })}</g>
        <g transform="translate(274 300) scale(1.14)">${VH.person({ skin: 's2', hair: 'chestnut', style: 'short', cloth: '#E8BC5E', outfit: 'knit', glasses: false })}</g>
      </g>
      <g transform="translate(486 600)">${VH.sprig('#4D6F54', '#8DA886')}</g>
      <g transform="translate(520 600) scale(.8)">${VH.sprig('#3F5C47', '#A9BFA0')}</g>
      <circle cx="456" cy="86" r="14" fill="#E8BC5E"/>
    </svg>`;

  VH.doorArt = () => `
    <svg viewBox="0 0 300 340" role="img" aria-label="Illustration: an open arched door with warm light and a small sprig.">
      <path d="${VH.archPath(30, 20, 240, 320)}" fill="#3F5C47"/>
      <path d="${VH.archPath(58, 52, 184, 288)}" fill="#F2DDA6"/>
      <path d="${VH.archPath(78, 74, 144, 266)}" fill="#F6EBC4"/>
      <path d="M150 340V200" stroke="#E8BC5E" stroke-width="2" opacity=".6"/>
      <g transform="translate(150 340) scale(.9)">${VH.sprig('#4D6F54', '#8DA886')}</g>
      <path d="M26 340h248" stroke="#20352A" stroke-width="4" stroke-linecap="round"/>
    </svg>`;

  /* small empty-state illustrations */
  VH.emptyArt = (kind = 'calendar') => `
    <svg class="empty-art" viewBox="0 0 120 120" aria-hidden="true">
      <path d="${VH.archPath(20, 8, 80, 104)}" fill="#E0E8D7"/>
      <path d="${VH.archPath(32, 22, 56, 90)}" fill="#EEF2E8"/>
      <g transform="translate(36 40) scale(2)" fill="none" stroke="#3F5C47" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${I[kind] || I.calendar}</g>
      <g transform="translate(94 112) scale(.28)">${VH.sprig('#4D6F54', '#8DA886')}</g>
      <circle cx="98" cy="22" r="5" fill="#E8BC5E"/>
    </svg>`;

  /* article / resource thumbnails — seeded compositions in the brand palette */
  VH.thumb = (seed = 0, label = '') => {
    const sets = [
      ['#C9D7C0', '#3F5C47', '#E8BC5E', '#F7E6DC'], ['#F0D3C4', '#A8532F', '#F2DDA6', '#C9D7C0'],
      ['#F2DDA6', '#3F5C47', '#C4714C', '#EEF2E8'], ['#E3D8C3', '#4D6F54', '#E8BC5E', '#F0D3C4'],
      ['#3F5C47', '#C9D7C0', '#E8BC5E', '#2F4A39'], ['#DCE6D3', '#A8532F', '#3F5C47', '#F2DDA6']
    ];
    const [bg, a, b, c] = sets[seed % sets.length];
    const kind = seed % 4;
    let art = '';
    if (kind === 0) art = `<path d="${VH.archPath(110, 50, 180, 250)}" fill="${a}"/><path d="${VH.archPath(138, 82, 124, 218)}" fill="${c}"/><circle cx="200" cy="140" r="26" fill="${b}"/><g transform="translate(86 300) scale(.9)">${VH.sprig(a, b)}</g>`;
    else if (kind === 1) art = `<path d="${VH.archPath(40, 130, 100, 170)}" fill="${a}"/><path d="${VH.archPath(150, 70, 100, 230)}" fill="${c}"/><path d="${VH.archPath(260, 160, 100, 140)}" fill="${b}"/><circle cx="200" cy="52" r="16" fill="${b}"/>`;
    else if (kind === 2) art = `${VH.sunArcs(200, 230, 150, [a, b, c])}<rect x="0" y="230" width="400" height="70" fill="${a}" opacity=".18"/>`;
    else art = `<circle cx="200" cy="150" r="96" fill="${c}"/><circle cx="200" cy="150" r="60" fill="${b}"/><g transform="translate(200 300) scale(1.2)">${VH.sprig(a, bg === '#3F5C47' ? '#8DA886' : a)}</g>`;
    return `<svg viewBox="0 0 400 300" role="img" aria-label="${VH.esc(label || 'Decorative illustration')}" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="${bg}"/>${art}</svg>`;
  };

  /* dot-map of the contiguous US with Vita House pins (fictional locations) */
  const US = [[-124.7, 48.4], [-123.3, 49], [-95.2, 49], [-95.2, 49.4], [-94.6, 48.7], [-93, 48.6], [-91.5, 48.1], [-89.6, 48], [-88.4, 48.3], [-84.8, 46.9], [-84.5, 46.5], [-83.5, 46], [-83.9, 45.2], [-83.4, 44.3], [-82.4, 43], [-82.9, 42.1], [-83.4, 41.7], [-80.5, 42], [-79, 42.8], [-79, 43.3], [-76.8, 43.6], [-76.3, 44.2], [-75, 45], [-71.5, 45], [-71, 45.3], [-70.3, 46], [-69.2, 47.4], [-68.2, 47.3], [-67.8, 47], [-67.8, 45.7], [-67, 44.8], [-68.5, 44.3], [-70.2, 43.6], [-70.8, 42.8], [-70.6, 42.4], [-70, 41.8], [-71.4, 41.4], [-72.9, 41.2], [-74, 40.6], [-74.1, 39.7], [-75, 38.9], [-75.5, 38], [-76, 37], [-75.7, 35.6], [-77, 34.6], [-78.5, 33.8], [-79.9, 32.7], [-81.2, 31.9], [-81.4, 30.4], [-80.5, 28.5], [-80, 26.7], [-80.4, 25.2], [-81.1, 25.2], [-81.8, 26.1], [-82.7, 27.7], [-82.8, 29], [-83.7, 29.9], [-84.3, 30], [-85.3, 29.7], [-86.5, 30.4], [-88, 30.3], [-89.5, 30.2], [-89.4, 29], [-90.5, 29.1], [-91.8, 29.5], [-93.8, 29.7], [-94.8, 29.3], [-96.4, 28.4], [-97.2, 27.6], [-97.4, 26], [-99.1, 26.4], [-99.5, 27.5], [-100.7, 29.1], [-101.4, 29.8], [-102.4, 29.8], [-102.9, 29.3], [-103.1, 28.9], [-104.5, 29.6], [-104.9, 30.6], [-106.5, 31.75], [-108.2, 31.8], [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-117.3, 33.1], [-118.4, 33.8], [-119.2, 34.1], [-120.5, 34.5], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.4], [-124.4, 40.4], [-124.2, 41.8], [-124.5, 42.8], [-124, 44.6], [-123.9, 46.2], [-124.1, 46.9]];
  VH.usMap = (pins = [], opts = {}) => {
    const k = 14, W = 62 * 0.788 * k, H = 26 * 1.0 * k;
    const px = lon => (lon + 125) * 0.788 * k, py = lat => (50 - lat) * k;
    const d = 'M' + US.map(([lo, la]) => `${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join('L') + 'z';
    const pinSvg = pins.map(p => {
      const x = px(p.lon), y = py(p.lat);
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="${opts.pulse === false ? 0 : 14}" fill="#E8BC5E" opacity=".35"><animate attributeName="r" values="6;18;6" dur="3.6s" repeatCount="indefinite" begin="${(p.i || 0) * .5}s"/><animate attributeName="opacity" values=".5;0;.5" dur="3.6s" repeatCount="indefinite" begin="${(p.i || 0) * .5}s"/></circle>
        <g transform="translate(-10 -24) scale(.31)"><path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="#3F5C47"/><circle cx="32" cy="27" r="8" fill="#E8BC5E"/></g>
        ${p.label ? `<text x="14" y="5" font-family="Figtree,sans-serif" font-size="15" font-weight="700" fill="#232622" paint-order="stroke" stroke="#E0E8D7" stroke-width="3">${VH.esc(p.label)}</text>` : ''}</g>`;
    }).join('');
    return `<svg viewBox="-10 -14 ${Math.round(W + 40)} ${Math.round(H + 34)}" role="img" aria-label="${VH.esc(opts.alt || 'Map of the United States with Vita House locations')}">
      <defs><pattern id="usdots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.5" fill="#8DA886"/></pattern><clipPath id="usclip"><path d="${d}"/></clipPath></defs>
      <path d="${d}" fill="#E0E8D7" stroke="#C9D7C0" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="-10" y="-14" width="${Math.round(W + 40)}" height="${Math.round(H + 34)}" fill="url(#usdots)" clip-path="url(#usclip)" opacity=".7"/>
      ${pinSvg}</svg>`;
  };
  /* abstract neighbourhood map tile for a location card */
  VH.mapTile = (seed = 0) => {
    const r = n => { const x = Math.sin(seed * 97 + n * 13.7) * 10000; return x - Math.floor(x); };
    let streets = '', blocks = '';
    for (let i = 0; i < 6; i++) streets += `<path d="M${-10 + r(i) * 40} ${30 + i * 28 + r(i + 9) * 10}L${410} ${20 + i * 28 + r(i + 5) * 30}" stroke="#fff" stroke-width="${i % 3 === 0 ? 7 : 4}" stroke-linecap="round"/>`;
    for (let i = 0; i < 7; i++) streets += `<path d="M${30 + i * 58 + r(i + 20) * 14} -10L${50 + i * 54 + r(i + 30) * 30} 190" stroke="#fff" stroke-width="${i % 3 === 1 ? 7 : 4}" stroke-linecap="round"/>`;
    blocks = `<path d="M${40 + r(1) * 60} 120q40-30 80 0t80 8l0 60h-160z" fill="#C9D7C0" opacity=".8"/><circle cx="${300 + r(2) * 50}" cy="${40 + r(3) * 30}" r="28" fill="#C9D7C0" opacity=".8"/>`;
    return `<svg viewBox="0 0 400 190" role="img" aria-label="Stylised neighbourhood map" preserveAspectRatio="xMidYMid slice"><rect width="400" height="190" fill="#EEE6D6"/>${blocks}${streets}
      <g transform="translate(188 62)"><circle cx="12" cy="52" r="13" fill="#232622" opacity=".12"/><g transform="scale(.42)"><path d="M6 72V32a26 26 0 0 1 52 0v40z" fill="#3F5C47"/><circle cx="32" cy="27" r="9" fill="#E8BC5E"/></g></g></svg>`;
  };

  /* page-header art: arch + glyph + sun + sprig */
  VH.pageArt = (icon = 'leaf', tone = 0) => {
    const T = [['#C9D7C0', '#E0E8D7', '#F2DDA6'], ['#F0D3C4', '#F7E6DC', '#C9D7C0'], ['#F2DDA6', '#F8EBC4', '#F0D3C4']][tone % 3];
    return `<svg viewBox="0 0 380 420" role="img" aria-label="Decorative illustration"><path d="${VH.archPath(250, 170, 110, 250)}" fill="${T[2]}"/>
      <path d="${VH.archPath(30, 50, 210, 370)}" fill="${T[0]}"/><path d="${VH.archPath(54, 76, 162, 344)}" fill="${T[1]}"/>
      <g transform="translate(95 150) scale(3.6)" fill="none" stroke="#3F5C47" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${I[icon] || ''}</g>
      <circle cx="312" cy="74" r="26" fill="#E8BC5E"/><g transform="translate(300 420) scale(.95)">${VH.sprig('#4D6F54', '#8DA886')}</g></svg>`;
  };

  /* ---------- accessible modal ---------- */
  VH.modal = (html, o = {}) => {
    const prev = document.activeElement;
    const scrim = document.createElement('div');
    scrim.className = 'scrim' + (o.sheet ? ' sheet-scrim' : '');
    scrim.innerHTML = `<div class="dialog${o.sheet ? ' sheet' : ''}" role="${o.alert ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="dlgT" tabindex="-1" style="${o.wide ? 'width:min(44rem,100%)' : ''}">${html}</div>`;
    const dlg = scrim.firstElementChild;
    const h = dlg.querySelector('h2,h3'); if (h) h.id = 'dlgT';
    const close = v => { document.removeEventListener('keydown', key); scrim.remove(); document.body.style.overflow = ''; if (prev && prev.focus) prev.focus(); if (o.onClose) o.onClose(v); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
        if (!f.length) return; const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    scrim.addEventListener('mousedown', e => { if (e.target === scrim) close(); });
    dlg.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) close(c.dataset.close); });
    document.addEventListener('keydown', key);
    document.body.appendChild(scrim); document.body.style.overflow = 'hidden';
    (dlg.querySelector('[autofocus]') || dlg).focus();
    return { close, el: dlg };
  };

  /* ---------- toast ---------- */
  VH.toast = (msg, icon = 'check-circle') => {
    let box = VH.$('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${VH.icon(icon)}<span>${VH.esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3800);
  };

  /* reveal-on-scroll: call again after injecting new .reveal nodes */
  let io = null;
  VH.reveal = (root = document) => {
    const els = VH.$$('.reveal:not(.in)', root);
    if (!('IntersectionObserver' in window) || VH.embed || VH.params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(el => el.classList.add('in')); return; }
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    els.forEach(el => io.observe(el));
  };

  /* ---------- shell: header, footer, sprite ---------- */
  VH.NAV = [['Services', 'services.html'], ['Providers', 'providers.html'], ['Membership', 'membership.html'], ['Locations', 'locations.html'], ['Resources', 'resources.html'], ['About', 'about.html']];

  VH.shell = (o = {}) => {
    const { active = '', announce = true, footer = true, header = true } = o;
    document.body.insertAdjacentHTML('afterbegin', VH.sprite());
    let favicon = document.querySelector('link[rel~="icon"]');
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon); }
    favicon.href = VH.favicon;
    if (!VH.embed && header) {
      const links = VH.NAV.map(([t, h]) => `<a href="${h}" ${h === active ? 'aria-current="page"' : ''}>${t}</a>`).join('');
      const mlinks = VH.NAV.map(([t, h]) => `<a href="${h}" ${h === active ? 'aria-current="page"' : ''}>${t}${VH.icon('arrow-right')}</a>`).join('');
      document.body.insertAdjacentHTML('afterbegin', `
        <a class="skip" href="#main">Skip to content</a>
        ${announce ? `<div class="announce"><div class="container">${VH.icon('sparkle')}<span>Concept project · Same-day virtual visits, now in 12 states.</span> <a href="book.html">Book a visit</a></div></div>` : ''}
        <header class="site-header" id="siteHeader">
          <div class="container nav">
            ${VH.logo({})}
            <nav class="nav-links" aria-label="Primary">${links}</nav>
            <div class="nav-actions">
              <a class="nav-signin" href="portal.html">${VH.icon('user')} Sign in</a>
              <a class="btn btn-primary btn-sm" href="book.html">Book a visit</a>
              <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobileMenu">${VH.icon('menu')}<span>Menu</span></button>
            </div>
          </div>
          <div class="mobile-menu" id="mobileMenu" hidden>
            <nav aria-label="Mobile primary">${mlinks}<a href="portal.html">Sign in${VH.icon('arrow-right')}</a></nav>
            <a class="btn btn-primary btn-lg btn-block" href="book.html">Book a visit</a>
          </div>
        </header>`);
      const hd = VH.$('#siteHeader'), tg = VH.$('.nav-toggle', hd), mm = VH.$('#mobileMenu');
      tg.addEventListener('click', () => {
        const open = tg.getAttribute('aria-expanded') === 'true';
        tg.setAttribute('aria-expanded', String(!open)); mm.hidden = open;
        tg.querySelector('span').textContent = open ? 'Menu' : 'Close';
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mm.hidden) { tg.click(); tg.focus(); } });
      const onScroll = () => hd.classList.toggle('scrolled', window.scrollY > 8);
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (!VH.embed && footer) {
      const arches = `<svg class="footer-arches" viewBox="0 0 380 300" aria-hidden="true"><path d="${VH.archPath(10, 40, 160, 260)}" fill="#C9D7C0"/><path d="${VH.archPath(190, 0, 180, 300)}" fill="#C9D7C0"/></svg>`;
      document.body.insertAdjacentHTML('beforeend', `
        <footer class="site-footer on-dark">${arches}
          <div class="container">
            <div class="footer-grid">
              <div class="footer-brand">${VH.logo({ dark: true, size: '1.75rem' })}
                <p>Primary care, prevention and wellness that fits into your life, with a front door that's always open.</p>
                <div class="row" style="margin-top:1.5rem"><a class="btn btn-honey btn-sm" href="book.html">Book a visit</a><a class="btn btn-outline-light btn-sm" href="portal.html">Patient sign in</a></div>
              </div>
              <div><h2>Care</h2><ul class="plain"><li><a href="services.html#primary">Primary care</a></li><li><a href="services.html#mental">Mental wellness</a></li><li><a href="services.html#nutrition">Nutrition</a></li><li><a href="services.html#labs">Labs &amp; screenings</a></li><li><a href="services.html#family">Family &amp; pediatrics</a></li></ul></div>
              <div><h2>Vita House</h2><ul class="plain"><li><a href="about.html">About</a></li><li><a href="providers.html">Providers</a></li><li><a href="locations.html">Locations</a></li><li><a href="membership.html">Membership</a></li><li><a href="resources.html">Resources</a></li></ul></div>
              <div><h2>Help</h2><ul class="plain"><li><a href="contact.html">Contact</a></li><li><a href="book.html">Book appointment</a></li><li><a href="portal.html#/settings">Accessibility settings</a></li><li><a href="contact.html#faq">FAQs</a></li><li><a href="../../index.html#work">Portfolio ↗</a></li></ul></div>
            </div>
            <div class="footer-legal">
              <div><strong>SELF-INITIATED CONCEPT PROJECT</strong> · Brand, UX and UI design by <a href="../../index.html#work">Rovard Studios</a>, 2026.</div>
              <div>Vita House is a fictional healthcare brand created for a design portfolio. It is not a real healthcare provider and nothing on this site is medical advice. All providers, locations, prices, testimonials and articles are fictional. If you are experiencing a medical emergency, call 911.</div>
            </div>
          </div>
        </footer>`);
    }
    VH.reveal();
    /* user preferences set in the patient dashboard */
    try {
      const pref = JSON.parse(localStorage.getItem('vh.prefs') || '{}');
      if (pref.text) document.documentElement.dataset.text = pref.text;
      if (pref.motion === 'reduce') document.documentElement.dataset.motion = 'reduce';
    } catch (e) { /* ignore */ }
  };

  /* render helpers: `<div data-vh-logo>` and `<span data-icon="x">` */
  VH.hydrate = (root = document) => {
    VH.$$('[data-icon]', root).forEach(el => { el.innerHTML = VH.icon(el.dataset.icon, el.dataset.cls || ''); });
    VH.$$('[data-art]', root).forEach(el => { const k = el.dataset.art; el.innerHTML = k === 'door' ? VH.doorArt() : k === 'hero' ? VH.heroScene() : k.startsWith('empty:') ? VH.emptyArt(k.slice(6)) : ''; });
  };
})();
