/* Take it home (#/hub): ZIP search over placeholder nurseries (data/nurseries.js), the native swaps
   from tour.json with photos found by name in the info-page data, and the regional links. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

  NYBG.screens.hub = {
    render: function () {
      var hub = S.stops().filter(function (s) { return s.kind === 'hub'; })[0] || { swaps: [] };
      var input = h('input', { id: 'hb-zip', type: 'text', inputmode: 'numeric', autocomplete: 'postal-code', placeholder: 'ZIP code', maxlength: '10' });
      var results = h('div', { class: 'hb-results', hidden: true, 'aria-live': 'polite' });
      function search() {
        var list = (NYBG.nurseries || []);
        results.textContent = '';
        results.appendChild(h('ul', { class: 'hb-results' }, list.map(function (n) {
          return h('li', { class: 'nursery' },
            h('span', { class: 'nursery-text' }, h('span', { class: 'nursery-name' }, n.name), h('span', { class: 'nursery-meta' }, n.meta)),
            h('span', { class: 'nursery-dist' }, n.dist));
        })));
        results.appendChild(h('p', { class: 'hb-note' }, '[Nursery data source to decide with NYBG: nybg-guide/data/nurseries.js]'));
        results.hidden = false;
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') search(); });

      function swapImg(name, kind) {
        var src = S.swapPhoto(name);
        return h('div', { class: 'swapcard-img is-' + kind },
          src ? h('img', { src: src, alt: name, loading: 'lazy' }) : h('span', { class: 'ph-mini' }, '[No photo in the info-page data]'),
          h('span', { class: 'swap-tag ' + (kind === 'from' ? 'skip' : 'plant') }, kind === 'from' ? 'Skip' : 'Plant'));
      }

      var title = S.stage(hub.stage).name || 'Take it home';
      var root = h('div', { class: 'scr' }, h('div', { class: 'scroll' },
        h('header', { class: 'hb-head' }, h('div', { class: 'wrap hb-head-in' },
          h('div', { class: 'eyebrow' }, 'Stop ' + hub.n + ' · ' + title),
          h('h1', { class: 'hb-title' }, 'Plant natives instead'),
          h('p', { class: 'hb-lede' }, 'Native swaps for home gardeners, and where to buy them.'))),
        h('div', { class: 'wrap hb-grid' },
          h('div', { style: 'display: flex; flex-direction: column' },
            h('section', { class: 'hb-sec' },
              h('label', { for: 'hb-zip' }, 'Find native plant nurseries near you'),
              h('div', { class: 'hb-zip' }, input, h('button', { type: 'button', onClick: search }, 'Search')),
              results),
            h('section', { class: 'hb-sec links' },
              h('h2', { class: 'h2', style: 'font-size: 22px' }, 'Learn more'),
              (S.links().regional || []).map(function (l) {
                return h('a', { class: 'extlink', href: l.url, target: '_blank', rel: 'noopener' }, l.label, NYBG.icon('external', 18), h('span', { class: 'sr-only' }, '(opens in a new tab)'));
              }))),
          h('section', { class: 'hb-swaps-sec' },
            h('h2', { class: 'h2', style: 'font-size: 25px' }, 'Native swaps'),
            h('div', { class: 'hb-swaps' }, (hub.swaps || []).map(function (sw) {
              return h('article', { class: 'swapcard' },
                h('div', { class: 'swapcard-imgs' }, swapImg(sw.invasive, 'from'), swapImg(sw.native, 'to')),
                h('div', { class: 'swapcard-text' },
                  h('span', { class: 'from' }, h('span', { class: 'sr-only' }, 'Skip: '), sw.invasive),
                  h('span', { class: 'to' }, h('span', { class: 'sr-only' }, 'Plant: '), sw.native),
                  h('span', { class: 'meta' }, sw.value),
                  h('span', { class: 'meta' }, sw.benefit)));
            })),
            hub.swaps_source ? C.sourceLine(hub.swaps_source) : null,
            (function () {
              var credits = [];
              (hub.swaps || []).forEach(function (sw) {
                [sw.invasive, sw.native].forEach(function (n) { var c = S.swapCredit(n); if (c && credits.indexOf(n + ': ' + c) < 0) credits.push(n + ': ' + c); });
              });
              return credits.length ? h('ul', { class: 'source credits' }, credits.map(function (c) { return h('li', null, c); })) : null;
            })()))));
      root.nybgTitle = function () { return 'Take it home'; };
      return root;
    }
  };
})();
