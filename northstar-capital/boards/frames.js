/* Board helper: fills [data-frame] containers with a scaled live iframe (used only to render portfolio images) */
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('[data-frame]'));
  frames.forEach(function (vp) {
    var w = +vp.dataset.w, h = +vp.dataset.h, ih = +(vp.dataset.ih || h), cw = vp.clientWidth, s = cw / w;
    if (vp.hasAttribute('data-fit')) vp.style.height = (ih * s) + 'px';
    var fr = document.createElement('iframe');
    fr.setAttribute('scrolling', 'no'); fr.tabIndex = -1;
    fr.style.width = w + 'px'; fr.style.height = ih + 'px'; fr.style.transform = 'scale(' + s + ')';
    fr.src = vp.dataset.src; vp.appendChild(fr);
    fr.addEventListener('load', function () {
      var win = fr.contentWindow, y = +(vp.dataset.scroll || 0), act = vp.dataset.act;
      setTimeout(function () {
        try { if (y) win.scrollTo({ top: y, behavior: 'instant' }); } catch (e) {}
        try { if (act) win.eval(act); } catch (e) { console.log('act failed', e); }
      }, +(vp.dataset.wait || 700));
    });
  });
})();
