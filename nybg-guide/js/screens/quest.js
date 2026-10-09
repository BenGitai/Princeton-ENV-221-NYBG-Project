/* Garden Escape Quest (#/quest): the tour's species stops, Spot it / Found toggles saved in
   localStorage, ONE iNaturalist button (the project link from links.json). */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

  NYBG.screens.quest = {
    render: function () {
      var stops = S.speciesStops();
      var inat = (S.links().inaturalist || {});
      var bar = h('div'), countEl = h('span', { class: 'q-count', 'aria-live': 'polite' });

      function refresh() {
        var n = stops.filter(function (s) { return NYBG.state.isFound(s.n); }).length;
        countEl.textContent = n + ' of ' + stops.length + ' found';
        bar.style.width = Math.round(n / (stops.length || 1) * 100) + '%';
      }

      var rows = stops.map(function (s) {
        var sp = S.species(s.species), name = sp ? S.name(sp) : s.species;
        var btn = h('button', { type: 'button', class: 'q-toggle', 'aria-label': 'Mark ' + name + ' as found' },
          NYBG.icon('check', 18), h('span'));
        function paint() {
          var f = NYBG.state.isFound(s.n);
          btn.setAttribute('aria-pressed', f ? 'true' : 'false');
          btn.lastChild.textContent = f ? 'Found' : 'Spot it';
        }
        btn.addEventListener('click', function () { NYBG.state.setFound(s.n, !NYBG.state.isFound(s.n)); paint(); refresh(); });
        paint();
        return h('li', { class: 'q-row' },
          h('span', { class: 'q-num', 'aria-hidden': 'true' }, String(s.n)),
          h('span', { class: 'q-text' },
            h('a', { class: 'q-name', href: '#/stop/' + s.n }, h('span', { class: 'sr-only' }, 'Stop ' + s.n + ': '), name),
            h('span', { class: 'q-place' }, s.place)),
          btn);
      });

      var root = h('div', { class: 'scr' }, h('div', { class: 'scroll' },
        h('header', { class: 'q-head' }, h('div', { class: 'wrap q-head-in' },
          h('div', { class: 'eyebrow' }, 'Community science'),
          h('h1', { class: 'q-title' }, 'Garden Escape Quest'),
          h('p', { class: 'q-lede' }, 'Find all ' + stops.length + ' invaders on the tour. Every sighting you log goes to NYBG scientists through iNaturalist.'),
          h('div', { class: 'q-progress' }, h('div', { class: 'q-bar', 'aria-hidden': 'true' }, bar), countEl))),
        h('div', { class: 'wrap q-grid' },
          h('div', null,
            h('ol', { class: 'q-steps' },
              h('li', null, h('span', { class: 'q-steps-n' }, '01'), h('span', { class: 'q-steps-t' }, 'Spot it'), h('span', { class: 'q-steps-s' }, 'at a numbered stop')),
              h('li', null, h('span', { class: 'q-steps-n' }, '02'), h('span', { class: 'q-steps-t' }, 'Log it'), h('span', { class: 'q-steps-s' }, 'photo goes to iNaturalist')),
              h('li', null, h('span', { class: 'q-steps-n' }, '03'), h('span', { class: 'q-steps-t' }, 'Count it'), h('span', { class: 'q-steps-s' }, 'adds to the Garden total'))),
            h('section', { class: 'q-list', 'aria-label': 'Invaders on the tour' }, h('ul', null, rows))),
          h('section', { class: 'q-side' },
            h('a', { class: 'btn-dark', href: inat.project_url, target: '_blank', rel: 'noopener' },
              NYBG.icon('camera', 20), 'Log a sighting on iNaturalist', h('span', { class: 'sr-only' }, '(opens in a new tab)')),
            h('span', { class: 'q-inat-note' }, 'Goes to the ' + (inat.project_label || 'NYBG') + ' project'),
            h('div', { class: 'q-impact' },
              h('span', { class: 'eyebrow' }, 'Visitor impact this week'),
              h('span', { class: 'q-impact-n' }, '[###] sightings'),
              h('span', { class: 'q-impact-s' }, 'logged by Garden visitors. [Live count from the NYBG iNaturalist project: not connected yet]'))))));
      refresh();
      root.nybgTitle = function () { return 'Garden Escape Quest'; };
      return root;
    }
  };
})();
