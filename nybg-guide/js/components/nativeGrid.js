/* nativeGrid: "Plant these instead", the sourced native alternatives in a 2-column grid. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, C = NYBG.components;

  NYBG.components.nativeGrid = function (alts) {
    return h('section', { class: 'natives', 'aria-label': 'Plant these instead' },
      h('h3', { class: 'h3', 'data-read': '' }, 'Plant these instead'),
      alts.text ? h('p', { class: 'natives-text', 'data-read': '' }, alts.text) : null,
      alts.items.length ? h('ul', { class: 'natives-grid' }, alts.items.map(function (a) {
        return h('li', { class: 'native' },
          a.img ? h('img', { src: a.img, alt: a.name, loading: 'lazy' }) : null,
          h('span', { class: 'native-name', 'data-read': '' }, a.name),
          a.sci ? h('span', { class: 'native-sci', 'data-read': '' }, a.sci) : null);
      })) : null,
      C.sourceLine(alts.source, 'on-natives'),
      (function () {
        var credits = alts.items.filter(function (a) { return a.img && a.credit; })
          .map(function (a) { return h('li', null, a.name + ': ' + a.credit); });
        return credits.length ? h('ul', { class: 'source on-natives credits' }, credits) : null;
      })());
  };
})();
