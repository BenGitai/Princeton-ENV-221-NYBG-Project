/* mapView: the illustrated garden map with the dashed route and numbered pins, all placed from
   content/tour.json. Pinch-zoom and pan on phones (wheel / buttons on desktop); pins keep a constant
   size at any zoom. Also a "List view" of the same stops, and a static figure for thumbnails. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, s = NYBG.s, S = NYBG.store;
  var MAX = 4;

  function routeSvg() {
    return s('svg', { viewBox: '40 95 440 560', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' },
      s('path', { class: 'map-route', d: S.routePath(), 'vector-effect': 'non-scaling-stroke' }));
  }
  var MAP_ALT = 'Illustrated map of the New York Botanical Garden: the Thain Family Forest in the center with the Bronx River along its east side, the Conservatory and Visitor Center to the west.';

  function create(opts) {
    var stops = S.stops();
    var sel = opts.selected || null, stage = opts.stage || 0;
    var z = { s: 1, fx: 0, fy: 0 }; // scale, translation as a fraction of the map box
    var pins = {};

    var world = h('div', { class: 'mapworld' },
      h('img', { src: S.mapSrc(), alt: MAP_ALT, draggable: 'false' }),
      routeSvg(),
      stops.map(function (st) {
        var p = S.mapPos(st);
        var b = h('button', { type: 'button', class: 'pin' + (st.species ? '' : ' is-place'),
          style: { left: p.left.toFixed(2) + '%', top: p.top.toFixed(2) + '%' },
          'aria-label': 'Stop ' + st.n + ': ' + S.stopName(st) }, String(st.n));
        b.addEventListener('click', function () { opts.onPick(st.n, b); });
        pins[st.n] = b;
        return b;
      }));
    var box = h('div', { class: 'mapbox' }, world);
    var zin = h('button', { type: 'button', 'aria-label': 'Zoom in' }, NYBG.icon('plus', 20));
    var zout = h('button', { type: 'button', 'aria-label': 'Zoom out' }, NYBG.icon('minus', 20));
    var zreset = h('button', { type: 'button', 'aria-label': 'Reset zoom' }, NYBG.icon('reset', 20));
    var area = h('div', { class: 'maparea' }, box, h('div', { class: 'zoomctl' }, zin, zout, zreset));

    var list = h('div', { class: 'maplist', hidden: true },
      h('ul', { 'aria-label': 'Tour stops' }, stops.map(function (st) {
        var g = S.stage(st.stage);
        return h('li', null, h('a', { class: 'maplist-row', href: '#/stop/' + st.n, 'data-stage': st.stage },
          h('span', { class: 'maplist-num' + (st.species ? '' : ' is-place'), 'aria-hidden': 'true' }, String(st.n)),
          h('span', { class: 'maplist-text' },
            h('span', { class: 'maplist-name' }, h('span', { class: 'sr-only' }, 'Stop ' + st.n + ': '), S.stopName(st)),
            h('span', { class: 'maplist-place' }, st.place + ' · ' + g.name)),
          NYBG.icon('chevRight', 18, { style: 'flex: none; color: var(--ink-soft)' })));
      })));
    var el = h('div', { class: 'mapview' }, area, list);

    /* ----- zoom and pan ----- */
    function clamp() {
      z.s = Math.min(MAX, Math.max(1, z.s));
      z.fx = Math.min(0, Math.max(1 - z.s, z.fx));
      z.fy = Math.min(0, Math.max(1 - z.s, z.fy));
    }
    function apply() {
      clamp();
      world.style.transform = 'translate(' + (z.fx * 100) + '%, ' + (z.fy * 100) + '%) scale(' + z.s + ')';
      world.style.setProperty('--inv', String(1 / z.s));
      zin.disabled = z.s >= MAX; zout.disabled = z.s <= 1; zreset.disabled = z.s <= 1;
    }
    /* Zoom to scale ns keeping the point (px, py) of the box (in px) still. */
    function zoomAt(ns, px, py) {
      var r = box.getBoundingClientRect();
      if (!r.width) return;
      var ux = (px / r.width - z.fx) / z.s, uy = (py / r.height - z.fy) / z.s;
      z.s = Math.min(MAX, Math.max(1, ns));
      z.fx = px / r.width - ux * z.s; z.fy = py / r.height - uy * z.s;
      apply();
    }
    function centerZoom(f) { var r = box.getBoundingClientRect(); zoomAt(z.s * f, r.width / 2, r.height / 2); }
    zin.addEventListener('click', function () { centerZoom(1.5); });
    zout.addEventListener('click', function () { centerZoom(1 / 1.5); });
    zreset.addEventListener('click', function () { z = { s: 1, fx: 0, fy: 0 }; apply(); });

    var pts = {}, gesture = null, dragged = false;
    function local(e) { var r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
    function two() { var k = Object.keys(pts); return k.length >= 2 ? [pts[k[0]], pts[k[1]]] : null; }
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.zoomctl')) return;
      pts[e.pointerId] = local(e);
      dragged = false;
      var t = two();
      if (t) {
        var mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
        gesture = { kind: 'pinch', d0: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1, s0: z.s,
          ux: (mx / t[0].w - z.fx) / z.s, uy: (my / t[0].h - z.fy) / z.s };
      } else {
        gesture = { kind: 'pan', x0: pts[e.pointerId].x, y0: pts[e.pointerId].y, fx0: z.fx, fy0: z.fy, id: e.pointerId };
      }
    });
    area.addEventListener('pointermove', function (e) {
      if (!(e.pointerId in pts) || !gesture) return;
      pts[e.pointerId] = local(e);
      var p = pts[e.pointerId];
      if (gesture.kind === 'pinch') {
        var t = two(); if (!t) return;
        var d = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y);
        var mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
        z.s = Math.min(MAX, Math.max(1, gesture.s0 * d / gesture.d0));
        z.fx = mx / p.w - gesture.ux * z.s; z.fy = my / p.h - gesture.uy * z.s;
        dragged = true;
        apply();
      } else if (gesture.id === e.pointerId) {
        var dx = p.x - gesture.x0, dy = p.y - gesture.y0;
        if (!dragged && Math.hypot(dx, dy) < 6) return;
        if (z.s <= 1) return;
        if (!dragged) { dragged = true; try { area.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
        z.fx = gesture.fx0 + dx / p.w; z.fy = gesture.fy0 + dy / p.h;
        apply();
      }
    });
    function up(e) {
      delete pts[e.pointerId];
      var k = Object.keys(pts);
      if (k.length === 1) { var p = pts[k[0]]; gesture = { kind: 'pan', x0: p.x, y0: p.y, fx0: z.fx, fy0: z.fy, id: Number(k[0]) }; }
      else if (!k.length) gesture = null;
    }
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
    // A pan or pinch must not also count as a tap on a pin.
    area.addEventListener('click', function (e) { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    area.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = local(e);
      zoomAt(z.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), p.x, p.y);
    }, { passive: false });

    function paint() {
      stops.forEach(function (st) {
        var b = pins[st.n];
        b.classList.toggle('is-active', st.n === sel);
        b.classList.toggle('is-dim', !!stage && st.stage !== stage);
      });
      list.querySelectorAll('.maplist-row').forEach(function (a) {
        a.classList.toggle('is-dim', !!stage && Number(a.getAttribute('data-stage')) !== stage);
      });
    }
    apply();
    paint();

    return {
      el: el,
      select: function (n) { sel = n; paint(); },
      setStage: function (g) { stage = g; paint(); },
      setList: function (on) { area.hidden = !!on; list.hidden = !on; },
      pin: function (n) { return pins[n]; }
    };
  }

  /* Static map: route always; optional dot at one stop. */
  function figure(o) {
    o = o || {};
    var kids = [h('img', { src: S.mapSrc(), alt: o.alt || '' }), routeSvg()];
    if (o.stop) {
      var p = S.mapPos(o.stop);
      kids.push(h('span', { class: 'mapfig-dot', style: { left: p.left.toFixed(2) + '%', top: p.top.toFixed(2) + '%', background: o.stop.species ? 'var(--invader)' : 'var(--moss)' } }));
    }
    return h('div', { class: 'mapfig' + (o.class ? ' ' + o.class : '') }, kids);
  }

  NYBG.components.mapView = { create: create, figure: figure };
})();
