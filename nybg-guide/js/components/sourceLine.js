/* sourceLine: "Source: …" at the end of every content section. Shown, but not read aloud. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;
  NYBG.components.sourceLine = function (text, extraClass) {
    return h('span', { class: 'source' + (extraClass ? ' ' + extraClass : '') }, 'Source: ' + text);
  };
})();
