/* bottomSheet: a non-modal sheet over the map. Focus moves into it when opened from a control,
   Escape closes it and focus returns to the control that opened it. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;

  NYBG.components.bottomSheet = function (opts) {
    var el = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'false', 'aria-label': opts.label || 'Preview', tabindex: '-1', hidden: true });
    var returnTo = null;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); api.close(true); }
    });
    var api = {
      el: el,
      isOpen: function () { return !el.hidden; },
      /* fill(children), then open({focus: true, from: element}) */
      fill: function (children) { el.textContent = ''; [].concat(children).forEach(function (c) { if (c) el.appendChild(c); }); },
      open: function (o) {
        o = o || {};
        el.hidden = false;
        if (o.from) returnTo = o.from;
        if (o.focus) el.focus({ preventScroll: true });
      },
      close: function (restoreFocus) {
        if (el.hidden) return;
        el.hidden = true;
        if (opts.onClose) opts.onClose();
        if (restoreFocus && returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
      }
    };
    return api;
  };
})();
