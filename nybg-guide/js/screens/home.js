/* Home (#/), the landing page. Built to be looked at more than read:
     hero         title, two buttons, a photo strip of the invaders to find
     The hunt     "wanted" cards (one per species stop, photo + found stamp) next to a live map
     Why it matters  four short quotes from NYBG pages (guide-build-kit/content/landing.json), each sourced
     Explore      lookup link, tiles (js/config/home.js), "Look for it this month", read-aloud setting
   Found state comes from the Quest (NYBG.state) and repaints on the 'nybg:found' event. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

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
          ? '' : 'Read-aloud is not supported in this browser')),
      sw);
  }

  /* Progress ring: an SVG circle that fills as stops are found. */
  function ring() {
    var R = 26, L = 2 * Math.PI * R;
    var arc = NYBG.s('circle', { class: 'ring-arc', cx: 32, cy: 32, r: R, 'stroke-dasharray': L.toFixed(1), 'stroke-dashoffset': L.toFixed(1) });
    var num = h('span', { class: 'ring-num' });
    var el = h('div', { class: 'ring' },
      NYBG.s('svg', { viewBox: '0 0 64 64', width: 64, height: 64, 'aria-hidden': 'true', focusable: 'false' },
        NYBG.s('circle', { class: 'ring-bg', cx: 32, cy: 32, r: R }), arc),
      num);
    return {
      el: el,
      set: function (n, total) {
        arc.setAttribute('stroke-dashoffset', (L * (1 - n / (total || 1))).toFixed(1));
        num.textContent = n + '/' + total;
      }
    };
  }

  /* One "wanted" card per species stop. */
  function wanted(item) {
    var st = item.stop;
    var stamp = h('span', { class: 'wanted-stamp', 'aria-hidden': 'true' }, NYBG.icon('check', 14), 'Found');
    var a = h('a', { class: 'wanted', href: '#/map/' + st.n },
      h('span', { class: 'wanted-pic' },
        item.photo ? h('img', { src: item.photo.src, alt: '', loading: 'lazy' }) : h('span', { class: 'wanted-nopic' }, NYBG.icon('photo', 28)),
        h('span', { class: 'wanted-num', 'aria-hidden': 'true' }, String(st.n)),
        stamp),
      h('span', { class: 'wanted-name' }, item.name),
      h('span', { class: 'wanted-place' }, st.place),
      h('span', { class: 'sr-only wanted-sr' }));
    a.nybgPaint = function () {
      var f = NYBG.state.isFound(st.n);
      a.classList.toggle('is-found', f);
      a.querySelector('.wanted-sr').textContent = f ? ' (found)' : ' (not found yet)';
    };
    return a;
  }

  function why() {
    var L = S.landing(), items = L.why || [];
    if (!items.length) return null;
    return h('section', { class: 'pad why', 'aria-labelledby': 'why-h' },
      h('div', { class: 'head-row' }, h('h2', { class: 'h2', id: 'why-h' }, 'Why it matters')),
      h('ol', { class: 'why-list' }, items.map(function (w, i) {
        return h('li', { class: 'why-card' },
          h('span', { class: 'why-top' },
            h('span', { class: 'why-ic', 'aria-hidden': 'true' }, NYBG.icon(w.icon || 'tree', 26)),
            h('span', { class: 'why-step', 'aria-hidden': 'true' }, String(i + 1))),
          h('span', { class: 'why-label' }, w.label),
          h('blockquote', { class: 'why-text' }, '“' + w.text + '”'),
          w.url ? h('a', { class: 'source', href: w.url, target: '_blank', rel: 'noopener' }, 'Source: ' + w.source, h('span', { class: 'sr-only' }, ' (opens in a new tab)'))
            : C.sourceLine(w.source));
      })),
      L.more ? h('a', { class: 'why-more', href: L.more.url, target: '_blank', rel: 'noopener' },
        L.more.label, NYBG.icon('external', 16), h('span', { class: 'sr-only' }, ' (opens in a new tab)')) : null);
  }

  NYBG.screens.home = {
    render: function () {
      var cfg = NYBG.config.home;
      var hunt = S.hunt(), total = hunt.length;
      var pr = ring();
      var cards = hunt.map(wanted);
      var huntMsg = h('p', { class: 'hunt-msg', 'aria-live': 'polite' });
      var startBtn = h('a', { class: 'cta', href: '#/map' }, h('span'), NYBG.icon('arrowRight', 18));

      function paint() {
        var n = S.foundCount();
        pr.set(n, total);
        cards.forEach(function (c) { c.nybgPaint(); });
        huntMsg.textContent = n >= total ? 'You found them all!' : n ? (total - n) + ' still hiding' : 'Tap a card or a pin to start';
        var nx = S.nextToFind(0);
        startBtn.setAttribute('href', n && nx ? '#/map/' + nx.n : '#/map');
        startBtn.firstChild.textContent = n >= total ? 'See the map' : n ? 'Keep hunting' : 'Start the hunt';
      }

      var liveMap = C.mapView.create({ zoom: false, onPick: function (n) { NYBG.router.go('#/map/' + n); } });

      var strip = h('div', { class: 'hero-strip', 'aria-hidden': 'true' }, hunt.filter(function (i) { return i.photo; }).map(function (i) {
        return h('span', { class: 'hero-strip-pic' }, h('img', { src: i.photo.src, alt: '' }), h('span', null, String(i.stop.n)));
      }));

      var root = h('div', { class: 'scr' }, h('div', { class: 'scroll' },
        h('header', { class: 'home-hero' },
          h('div', { class: 'wrap home-hero-in' },
            h('div', { class: 'home-hero-text' },
              h('div', { class: 'eyebrow' }, 'NYBG · Invasive species hunt'),
              h('h1', { class: 'home-title' }, 'Garden Escapes'),
              h('p', { class: 'home-lede' }, 'Find ' + total + ' invaders hiding in the Garden.'),
              h('div', { class: 'home-ctas' }, startBtn,
                h('a', { class: 'ghost', href: '#/quest' }, 'Log sightings'))),
            strip)),
        h('div', { class: 'wrap' },
          h('section', { class: 'pad hunt', 'aria-labelledby': 'hunt-h' },
            h('div', { class: 'hunt-head' },
              pr.el,
              h('div', { class: 'hunt-head-text' },
                h('h2', { class: 'h2', id: 'hunt-h' }, 'The hunt'),
                huntMsg),
              h('span', { class: 'head-hint' }, S.stops().length + ' stops · ' + cfg.walkTime)),
            h('div', { class: 'hunt-grid' },
              h('ul', { class: 'wanted-list', 'aria-label': 'Invaders to find' }, cards.map(function (c) { return h('li', null, c); })),
              h('div', { class: 'hunt-map' },
                liveMap.el,
                h('a', { class: 'hunt-map-open', href: '#/map' }, NYBG.icon('map', 18), 'Open the full map')))),
          why(),
          h('div', { class: 'pad', style: 'padding-top: 20px' },
            h('a', { class: 'searchlink', href: '#/lookup' }, NYBG.icon('search', 20), 'Look up any invasive species')),
          h('nav', { class: 'pad tiles', 'aria-label': 'Explore' }, cfg.tiles.map(C.card.tile)),
          h('section', { class: 'pad lower' }, monthCard(), setting()))));

      paint();
      function onFound() { paint(); }
      window.addEventListener('nybg:found', onFound);
      root.nybgDestroy = function () { window.removeEventListener('nybg:found', onFound); };
      root.nybgTitle = function () { return ''; };
      return root;
    }
  };
})();
