/* MASON & ROWE — monogram + icon sprite (shared by the website and the case study).
   The monogram is "The Shared Pier": an M and an R built on one vertical.
   Self-initiated concept project by Rovard Studios — Mason & Rowe is fictional. */
(function () {
  var s = '' +
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<symbol id="mr-mono" viewBox="0 0 100 100">' +
    '<g fill="none" stroke="currentColor" stroke-width="5.4" stroke-linejoin="miter" stroke-miterlimit="8">' +
    '<path d="M12 88V12L31 60L50 12"/><path d="M50 12H68A19 19 0 0 1 68 50H50"/><path d="M62 50L86 88"/></g>' +
    '<path d="M50 10V90" stroke="var(--mr-pier, currentColor)" stroke-width="9" fill="none"/></symbol>' +

    /* line icons, 24px grid, 1.4 stroke */
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M3 12h17M14 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-arrow-ne" viewBox="0 0 24 24"><path d="M6 18L18 6M8 6h10v10" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-close" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M6 3h4l1.6 4-2.2 1.6a11 11 0 0 0 5 5L16 11.4l4 1.6v4a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-cal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 10h16M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>' +
    '<symbol id="i-spa" viewBox="0 0 24 24"><path d="M12 4c2.5 3 2.5 6.5 0 9-2.5-2.5-2.5-6 0-9zM4 9c3 .2 5.2 1.8 6.5 4.5M20 9c-3 .2-5.2 1.8-6.5 4.5M3 17c3 3 15 3 18 0" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-pool" viewBox="0 0 24 24"><path d="M3 15c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0M3 19.5c2 1.6 4 1.6 6 0s4-1.6 6 0 4 1.6 6 0M8 12V5.5a2 2 0 0 1 4 0M14 12V5.5a2 2 0 0 1 4 0M8 8h6" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-fit" viewBox="0 0 24 24"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-lounge" viewBox="0 0 24 24"><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3zM6 17v3M18 17v3" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-dine" viewBox="0 0 24 24"><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-film" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10 9.5v5l4.5-2.5z M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-wine" viewBox="0 0 24 24"><path d="M7 3h10c0 5-1.6 8-5 8S7 8 7 3zM12 11v9M8 21h8M7 7h10" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-bell" viewBox="0 0 24 24"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 8V6M10 6h4M9 20h6" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-car" viewBox="0 0 24 24"><path d="M3 15l2-6a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 6v4h-3v-2H6v2H3zM3 15h18M7 12h.01M17 12h.01" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5C7 4 10 4.5 12 6c2-1.5 5-2 8-.5V19c-3-1.5-6-1-8 .5-2-1.5-5-2-8-.5zM12 6v13.5" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-paw" viewBox="0 0 24 24"><circle cx="6.5" cy="11" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="6.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="15" cy="6.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="18.5" cy="11" r="1.8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12.5 11c3 0 5 3 5 5.2 0 2-1.8 2.3-3 1.8-1.3-.5-2-.5-4 0-1.2.4-3 .1-3-1.8C7.5 14 9.5 11 12.5 11z" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '<symbol id="i-brief" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 7V5h6v2M3 12h18" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>' +
    '</defs></svg>';
  window.MR_SPRITE = s;
  if (document.body) document.body.insertAdjacentHTML('afterbegin', s);
  else document.addEventListener('DOMContentLoaded', function () { document.body.insertAdjacentHTML('afterbegin', s); });
})();
