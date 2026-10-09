/* Map screen (#/map, #/map/N, #/stop/N). Phones: the map, or the stop page full screen.
   900px and up: map on the left, stop page in a 480px panel on the right; tapping a pin
   updates the panel in place. Stage chips dim other stages' pins. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;
  var lastCur = 1;

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
      var paneMap = h('section', { class: 'pane-map', 'aria-label': 'Garden map' },
        h('div', { class: 'screen-head' },
          h('div', { class: 'head-row' },
            h('h1', { class: 'h1' }, 'Garden map'),
            h('span', { class: 'head-hint' }, 'Tap a number')),
          h('div', { style: 'display: flex; gap: 6px; align-items: center' },
            h('div', { style: 'flex: 1; min-width: 0' }, stageRow.el), listBtn)),
        map.el,
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
          h('div', { class: 'sheet-actions' },
            h('a', { class: 'sqbtn navbtn', href: '#/map/' + wrap(n - 1), 'aria-label': 'Previous stop' }, NYBG.icon('chevLeft', 20)),
            h('a', { class: 'sheet-open', href: '#/stop/' + n }, 'Open stop ' + n),
            h('a', { class: 'sqbtn navbtn', href: '#/map/' + wrap(n + 1), 'aria-label': 'Next stop' }, NYBG.icon('chevRight', 20)))
        ]);
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
