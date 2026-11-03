/* Map screen (#/map, #/map/N, #/stop/N). Phones: the map, or the stop page full screen.
   900px and up: map on the left, stop page in a 480px panel on the right; tapping a pin
   updates the panel in place. Stage chips dim other stages' pins.
   Scavenger hunt: a progress card on the map ("3 of 8 found", "Next to find") and a
   "Found it" button in the stop preview; both use the Quest progress in NYBG.state. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;
  var lastCur = 1;

  /* Link to NYBG's own garden map (links.json "official_map"). The site's map is an illustration
     made for this project; the official one is linked, not copied. */
  function officialMap() {
    var m = (S.links() || {}).official_map;
    if (!m) return h('span', { class: 'head-hint' }, 'Tap a number');
    return h('a', { class: 'head-hint official-map', href: m.url, target: '_blank', rel: 'noopener' },
      'Official map (PDF)', NYBG.icon('external', 14), h('span', { class: 'sr-only' }, ' (opens in a new tab)'));
  }

  NYBG.screens.map = {
    render: function (params) {
      var stops = S.stops(), total = stops.length;
      var st = { view: params.view, sel: params.n || null, cur: params.n || lastCur, stage: 0, list: false };
      var pickedFrom = null;
      var wrap = function (n) { return n < 1 ? total : n > total ? 1 : n; };

      /* ----- map pane ----- */
      var map = C.mapView.create({
        selected: st.sel,
        onPick: function (n, pin) { pickedFrom = pin; NYBG.router.go('#/map/' + n); }
      });
      var sheet = C.bottomSheet({ label: 'Stop preview', onClose: function () {
        st.sel = null; map.select(null); NYBG.router.replace('#/map');
      } });
      var stageRow = C.chipRow('Filter by stage', [{ id: 0, label: 'All stops' }].concat(S.stages().map(function (g) {
        return { id: g.n, label: g.n + ' · ' + g.name };
      })), 0, function (id) { st.stage = id; stageRow.set(id); map.setStage(id); });
      var listBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, NYBG.icon('list', 16, { style: 'vertical-align: -3px; margin-right: 4px' }), 'List view');
      listBtn.addEventListener('click', function () {
        st.list = !st.list;
        listBtn.setAttribute('aria-pressed', st.list ? 'true' : 'false');
        map.setList(st.list);
        if (st.list) sheet.close(false);
      });
      /* ----- hunt progress card ----- */
      var huntN = h('span', { class: 'hunt-n', 'aria-live': 'polite' });
      var huntBar = h('span', { class: 'hunt-bar' }, h('span'));
      var nextBtn = h('button', { type: 'button', class: 'hunt-next' }, NYBG.icon('target', 16), h('span', null, 'Next to find'));
      nextBtn.addEventListener('click', function () {
        var nx = S.nextToFind(st.sel || st.cur);
        if (nx) { pickedFrom = nextBtn; NYBG.router.go('#/map/' + nx.n); }
        else NYBG.router.go('#/quest');
      });
      var hud = h('div', { class: 'hunt-hud' },
        h('a', { class: 'hunt-score', href: '#/quest', 'aria-label': 'Open the Quest' }, NYBG.icon('flag', 16), huntN, huntBar),
        nextBtn);
      function paintHud() {
        var total = S.speciesStops().length, n = S.foundCount();
        huntN.textContent = n + ' of ' + total + ' found';
        huntBar.firstChild.style.width = Math.round(n / (total || 1) * 100) + '%';
        nextBtn.lastChild.textContent = n >= total ? 'All found!' : 'Next to find';
        hud.classList.toggle('is-done', n >= total);
      }
      paintHud();

      var paneMap = h('section', { class: 'pane-map', 'aria-label': 'Garden map' },
        h('div', { class: 'screen-head' },
          h('div', { class: 'head-row' },
            h('h1', { class: 'h1' }, 'Garden map'),
            officialMap()),
          h('div', { style: 'display: flex; gap: 6px; align-items: center' },
            h('div', { style: 'flex: 1; min-width: 0' }, stageRow.el), listBtn)),
        h('div', { class: 'mapstack' }, map.el, hud),
        sheet.el);

      function fillSheet(n) {
        var s = S.stop(n), sp = s.species ? S.species(s.species) : null;
        var photo = sp ? S.heroPhoto(sp) : null;
        var tint = s.species ? 'var(--invader)' : 'var(--moss)';
        var teaser = sp ? (S.teaser(sp) || {}).text : s.kind === 'intro' ? ((s.quotes || [])[0] || {}).text : 'Native swaps for home gardeners.';
        sheet.fill([
          h('div', { class: 'sheet-top' },
            photo ? h('img', { class: 'sheet-photo', src: photo.src, alt: S.stopName(s) })
              : h('div', { class: 'sheet-num', style: { background: tint }, 'aria-hidden': 'true' }, String(n)),
            h('div', { class: 'sheet-meta' },
              h('div', { class: 'kicker', style: { color: s.species ? 'var(--invader)' : 'var(--moss)' } }, 'Stop ' + n + ' · ' + S.stage(s.stage).name),
              h('h2', { class: 'sheet-name' }, S.stopName(s)),
              h('div', { class: 'sheet-place' }, s.place)),
            h('button', { type: 'button', class: 'sheet-close', 'aria-label': 'Close preview', onClick: function () { sheet.close(true); } }, NYBG.icon('close', 20))),
          teaser ? h('p', { class: 'sheet-teaser' }, teaser) : null,
          s.species ? foundBtn(n) : null,
          h('div', { class: 'sheet-actions' },
            h('a', { class: 'sqbtn navbtn', href: '#/map/' + wrap(n - 1), 'aria-label': 'Previous stop' }, NYBG.icon('chevLeft', 20)),
            h('a', { class: 'sheet-open', href: '#/stop/' + n }, 'Open stop ' + n),
            h('a', { class: 'sqbtn navbtn', href: '#/map/' + wrap(n + 1), 'aria-label': 'Next stop' }, NYBG.icon('chevRight', 20)))
        ]);
      }

      function foundBtn(n) {
        var b = h('button', { type: 'button', class: 'found-btn' }, NYBG.icon('check', 20), h('span'));
        function paint() {
          var f = NYBG.state.isFound(n);
          b.setAttribute('aria-pressed', f ? 'true' : 'false');
          b.lastChild.textContent = f ? 'Found it!' : 'I found it';
        }
        b.addEventListener('click', function () { NYBG.state.setFound(n, !NYBG.state.isFound(n)); paint(); });
        paint();
        return b;
      }

      /* ----- stop pane ----- */
      var count = h('span', { class: 'stop-count' });
      var stageName = h('span', { class: 'stop-stage' });
      var scroll = h('div', { class: 'scroll', tabindex: '-1' });
      var prev = h('a', { class: 'stop-prev navbtn' }), next = h('a', { class: 'stop-next' });
      var paneStop = h('section', { class: 'pane-stop', 'aria-label': 'Stop details' },
        h('div', { class: 'backbar' },
          h('a', { class: 'backbtn backbtn-map navbtn', href: '#/map/' + st.cur }, NYBG.icon('chevLeft', 20), 'Map'),
          count, stageName),
        scroll,
        h('div', { class: 'stop-foot' }, prev, next));

      function fillStop(n) {
        var s = S.stop(n);
        lastCur = n;
        count.textContent = 'Stop ' + n + ' of ' + total;
        stageName.textContent = S.stage(s.stage).name;
        stageName.style.color = s.species ? 'var(--invader)' : 'var(--moss)';
        paneStop.querySelector('.backbtn-map').setAttribute('href', '#/map/' + n);
        var p = S.stop(wrap(n - 1)), q = S.stop(wrap(n + 1));
        prev.setAttribute('href', '#/stop/' + p.n);
        prev.textContent = '';
        prev.appendChild(h('span', { class: 'stop-foot-k' }, 'Previous · ' + p.n));
        prev.appendChild(h('span', { class: 'stop-foot-n' }, S.stopName(p)));
        next.setAttribute('href', '#/stop/' + q.n);
        next.textContent = '';
        next.appendChild(h('span', { class: 'stop-foot-k' }, 'Next · ' + q.n));
        next.appendChild(h('span', { class: 'stop-foot-n' }, S.stopName(q)));
        scroll.textContent = '';
        scroll.appendChild(NYBG.screens.stop.render({ n: n }));
        scroll.scrollTop = 0;
      }

      var root = h('div', { class: 'scr tour', 'data-screen': st.view }, h('div', { class: 'cols' }, paneMap, paneStop));
      function onFound() { paintHud(); }
      window.addEventListener('nybg:found', onFound);
      root.nybgDestroy = function () { window.removeEventListener('nybg:found', onFound); };

      function apply(params, first) {
        var view = params.view, n = params.n;
        var curChanged = first || (n && n !== st.cur);
        st.view = view;
        root.setAttribute('data-screen', view);
        if (n) { st.cur = n; st.sel = n; } else st.sel = null;
        map.select(st.sel);
        if (st.sel && !st.list) { fillSheet(st.sel); sheet.open({ focus: !!pickedFrom, from: pickedFrom || map.pin(st.sel) }); }
        else sheet.close(false);
        pickedFrom = null;
        if (curChanged) fillStop(st.cur);
        if (view === 'stop') {
          if (!first) scroll.focus({ preventScroll: true });
          NYBG.screens.stop.autoplay(scroll);
        }
      }
      apply(params, true);

      root.nybgUpdate = function (p) { apply(p, false); return true; };
      root.nybgTitle = function () { return st.view === 'stop' ? 'Stop ' + st.cur + ' · ' + S.stopName(S.stop(st.cur)) : 'Garden map'; };
      return root;
    }
  };
})();
