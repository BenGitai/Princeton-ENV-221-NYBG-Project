/* placeholder: a visible bracketed note (dashed box) for missing content.
   It always names the file that would fill the gap. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;
  NYBG.components.placeholder = function (text, opts) {
    opts = opts || {};
    return h(opts.tag || 'div', { class: 'ph' + (opts.class ? ' ' + opts.class : ''), 'data-read': opts.read ? '' : null }, '[' + text + ']');
  };
})();
