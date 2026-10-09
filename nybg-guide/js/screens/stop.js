/* Stop page content: a species stop shows the species page; the place stops (intro and hub)
   show their quotes or native swaps from tour.json with their sources. Both end with "You are here".
   Composed by the map screen (js/screens/map.js), which adds the header bar and prev/next. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

  function here(st) {
    return h('div', { class: 'here' },
      C.mapView.figure({ stop: st }),
      h('div', { class: 'here-text' },
        h('span', { class: 'here-k' }, 'You are here'),
        h('span', { class: 'here-place' }, st.place),
        h('a', { class: 'here-btn backbtn-map', href: '#/map/' + st.n }, 'Show on map')));
  }

  function placePage(st) {
    var title = S.stopName(st);
    var body;
    if (st.kind === 'intro') {
      body = h('div', { class: 'place-body' },
        (st.quotes || []).map(function (q) {
          return h('figure', { class: 'quote' },
            h('blockquote', { 'data-read': '' }, '“' + q.text + '”'),
            h('figcaption', { class: 'source' }, 'Source: ' + q.source));
        }),
        C.card.link({ href: '#/quest', invader: true, title: 'Join the Garden Escape Quest',
          sub: 'Spot the ' + S.speciesStops().length + ' invaders on the way and log them' }),
        C.card.link({ href: '#/lookup', icon: 'search', title: 'Look up any invasive species',
          sub: 'All ' + S.count() + ' species in this guide, on the tour or not' }));
    } else {
      body = h('div', { class: 'place-body tight' },
        h('h3', { class: 'h3', 'data-read': '' }, 'Native swaps for home gardeners'),
        (st.swaps || []).map(function (sw) {
          return h('div', { class: 'swap-row', 'data-read': '' },
            h('span', { class: 'swap-from' }, sw.invasive),
            h('span', { class: 'sr-only' }, ' to '),
            NYBG.icon('arrowRight', 20, { style: 'color: var(--ink-soft)' }),
            h('span', { class: 'swap-to' }, sw.native));
        }),
        st.swaps_source ? C.sourceLine(st.swaps_source) : null,
        h('a', { class: 'btn-dark', href: '#/hub' }, 'Find natives near my ZIP code'));
    }
    return h('div', { 'data-read-root': '' },
      h('div', { class: 'place-hero' },
        h('img', { src: S.mapSrc(), alt: '' }),
        h('div', { class: 'place-num', 'aria-hidden': 'true' }, String(st.n))),
      h('div', { class: 'place-head' },
        h('div', { class: 'place-where', 'data-read': '' }, st.place),
        h('h2', { class: 'place-title', 'data-read': '' }, title),
        C.readAloud()),
      body,
      here(st));
  }

  NYBG.screens.stop = {
    render: function (params) {
      var st = S.stop(params.n);
      if (!st) return h('div', { class: 'place-head' }, h('h2', { class: 'place-title' }, 'Stop not found'));
      if (st.species) {
        return h('div', null, NYBG.screens.species.render({ id: st.species }), here(st), h('div', { style: 'height: 24px' }));
      }
      return h('div', null, placePage(st), h('div', { style: 'height: 24px' }));
    },
    /* "Read each stop aloud when I arrive": start the stop's own player, reading its own page. */
    autoplay: function (el) {
      if (!NYBG.state.autoplay() || !NYBG.speech || !NYBG.speech.supported) return;
      var player = el.querySelector('.player');
      if (player && player.nybgStart) setTimeout(function () { if (player.isConnected) player.nybgStart(); }, 150);
    }
  };
})();
