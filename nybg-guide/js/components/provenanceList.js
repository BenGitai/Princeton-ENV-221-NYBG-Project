/* provenanceList: "This page was built from", one row per source file, with "Not yet:" for the missing ones. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store;

  NYBG.components.provenanceList = function (sp) {
    return h('section', { class: 'prov', 'aria-label': 'This page was built from' },
      h('h3', null, 'This page was built from'),
      h('ul', null, S.provenance(sp).map(function (p) {
        return h('li', { class: p.on ? '' : 'is-off' }, h('span', { class: 'prov-dot', 'aria-hidden': 'true' }), h('span', null, p.label));
      })));
  };
})();
