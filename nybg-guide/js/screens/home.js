/* Home (#/): hero, lookup link, "Your walk" (stages from tour.json), tiles (js/config/home.js),
   "Look for it this month" (picked from the species' seasonal notes) and the read-aloud setting. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

  function stageStops(n) {
    var ns = S.stops().filter(function (s) { return s.stage === n; }).map(function (s) { return s.n; });
    if (!ns.length) return '';
    return ns.length === 1 ? 'Stop ' + ns[0] : 'Stops ' + ns[0] + '–' + ns[ns.length - 1];
  }

  function monthCard() {
    var month = new Date().getMonth() + 1;
    var pick = S.monthPick(month);
    var kids = [h('div', { class: 'eyebrow' }, 'Look for it this month · ' + NYBG.monthName(month))];
    if (pick) {
      kids.push(h('div', { class: 'month-name' }, S.name(pick.species)));
      kids.push(h('p', { class: 'month-text' }, pick.look));
      kids.push(C.sourceLine(pick.source));
      kids.push(h('a', { class: 'month-link', href: pick.stop ? '#/stop/' + pick.stop.n : '#/species/' + pick.species.id },
        pick.stop ? 'See stop ' + pick.stop.n : 'See its page'));
    } else {
      kids.push(C.placeholder('No seasonal notes for ' + NYBG.monthName(month) + ' in our sources yet. Add "seasons" to a species in guide-build-kit/content/id-checklists.json.'));
    }
    return h('div', { class: 'month' }, kids);
  }

  function setting() {
    var sw = h('button', { id: 'autoplay', type: 'button', class: 'switch', 'aria-pressed': NYBG.state.autoplay() ? 'true' : 'false',
      'aria-describedby': 'autoplay-sub' }, h('span'));
    sw.addEventListener('click', function () {
      var on = sw.getAttribute('aria-pressed') !== 'true';
      sw.setAttribute('aria-pressed', on ? 'true' : 'false');
      NYBG.state.setAutoplay(on);
    });
    return h('div', { class: 'setting' },
      h('div', { class: 'setting-text' },
        h('label', { for: 'autoplay' }, 'Read each stop aloud when I arrive'),
        h('span', { class: 'setting-sub', id: 'autoplay-sub' }, NYBG.speech && NYBG.speech.supported
          ? 'Reads the stop’s page, word for word' : 'Read-aloud is not supported in this browser')),
      sw);
  }

  NYBG.screens.home = {
    render: function () {
      var cfg = NYBG.config.home;
      var stages = S.stages();
      var root = h('div', { class: 'scr' }, h('div', { class: 'scroll' },
        h('header', { class: 'home-hero' },
          h('img', { class: 'home-watermark', src: S.mapSrc(), alt: '' }),
          h('div', { class: 'wrap home-hero-in' },
            h('div', { class: 'home-hero-text' },
              h('div', { class: 'eyebrow' }, 'NYBG · Self-guided tour'),
              h('h1', { class: 'home-title' }, 'Garden Escapes'),
              h('p', { class: 'home-lede' }, 'Many of the Garden’s worst invaders were once prized ornamentals. Find them on the grounds, see what NYBG is doing, and take home natives to plant instead.'),
              h('div', { class: 'home-ctas' },
                h('a', { class: 'cta', href: '#/map' }, 'Start the tour', NYBG.icon('arrowRight', 18)),
                h('a', { class: 'ghost', href: '#/quest' }, 'Join the Quest'))),
            h('a', { class: 'hero-map', href: '#/map', 'aria-label': 'Open the garden map' },
              C.mapView.figure({ class: 'is-cover', alt: 'Illustrated map of the Garden with the tour route' })))),
        h('div', { class: 'wrap' },
          h('div', { class: 'pad', style: 'padding-top: 16px' },
            h('a', { class: 'searchlink', href: '#/lookup' }, NYBG.icon('search', 20), 'Look up any invasive species')),
          h('section', { class: 'pad walk', 'aria-labelledby': 'walk-h' },
            h('div', { class: 'head-row' },
              h('h2', { class: 'h2', id: 'walk-h' }, 'Your walk'),
              h('span', { class: 'head-hint', style: 'font-size: 15px' }, S.stops().length + ' stops · ' + cfg.walkTime)),
            h('ol', null, stages.map(function (g) {
              return h('li', null,
                h('div', { class: 'walk-bar', style: { background: 'var(--stage-' + g.n + ', var(--moss))' } }),
                h('div', { class: 'walk-stage' }, 'Stage ' + g.n),
                h('div', { class: 'walk-name' }, g.name),
                h('div', { class: 'walk-stops' }, stageStops(g.n)));
            }))),
          h('nav', { class: 'pad tiles', 'aria-label': 'Explore' }, cfg.tiles.map(C.card.tile)),
          h('section', { class: 'pad lower' }, monthCard(), setting()))));
      root.nybgTitle = function () { return ''; };
      return root;
    }
  };
})();
