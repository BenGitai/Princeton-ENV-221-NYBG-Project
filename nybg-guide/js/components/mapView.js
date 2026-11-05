/* mapView: the illustrated garden map with the dashed route and numbered pins, all placed from
   content/tour.json. Pinch-zoom and pan on phones (wheel / buttons on desktop); pins keep a constant
   size at any zoom. Also a "List view" of the same stops, and a static figure for thumbnails.
   Scavenger hunt: species pins that the visitor marked found (NYBG.state) turn green with a tick,
   and repaint when the 'nybg:found' event fires. opts.zoom === false makes a map with no zoom or
   pan (used on Home, so the page still scrolls). */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, s = NYBG.s, S = NYBG.store;

  function routeSvg() {
    return s('svg', { viewBox: S.mapBox().join(' '), preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' },
      s('path', { class: 'map-route', d: S.routePath(), 'vector-effect': 'non-scaling-stroke' }));
  }
  var MAP_ALT = 'NYBG Garden Map 2025, with north to the left: the Thain Forest and the Bronx River across the middle, the Haupt Conservatory and the Leon Levy Visitor Center at the bottom.';
  var MAX = 6;
  function credit() {
    var m = S.mapInfo();
    if (!m.credit) return null;
    return m.url ? h('a', { class: 'map-credit', href: m.url, target: '_blank', rel: 'noopener' }, m.credit, h('span', { class: 'sr-only' }, ' (opens in a new tab)'))
      : h('span', { class: 'map-credit' }, m.credit);
  }

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
          'aria-label': 'Stop ' + st.n + ': ' + S.stopName(st) }, String(st.n),
          st.species ? h('span', { class: 'pin-tick', 'aria-hidden': 'true' }, NYBG.icon('check', 12)) : null);
        b.addEventListener('click', function () { opts.onPick(st.n, b); });
        pins[st.n] = b;
        return b;
      }));
    var box = h('div', { class: 'mapbox', style: { '--map-ar': String(S.mapRatio()) } }, world);
    var zin = h('button', { type: 'button', 'aria-label': 'Zoom in' }, NYBG.icon('plus', 20));
    var zout = h('button', { type: 'button', 'aria-label': 'Zoom out' }, NYBG.icon('minus', 20));
    var zreset = h('button', { type: 'button', 'aria-label': 'Reset zoom' }, NYBG.icon('reset', 20));
    var zoomable = opts.zoom !== false;
    var area = h('div', { class: 'maparea' + (zoomable ? '' : ' is-static') }, box, zoomable ? h('div', { class: 'zoomctl' }, zin, zout, zreset) : null, opts.credit === false ? null : credit());

    var list = h('div', { class: 'maplist', hidden: true },
      h('ul', { 'aria-label': 'Tour stops' }, stops.map(function (st) {
        var g = S.stage(st.stage);
        return h('li', null, h('a', { class: 'maplist-row', href: '#/stop/' + st.n, 'data-stage': st.stage },
          h('span', { class: 'maplist-num' + (st.species ? '' : ' is-place'), 'aria-hidden': 'true', 'data-n': st.n }, String(st.n)),
          h('span', { class: 'maplist-text' },
            h('span', { class: 'maplist-name' }, h('span', { class: 'sr-only' }, 'Stop ' + st.n + ': '), S.stopName(st)),
            h('span', { class: 'maplist-place' }, st.place + ' · ' + g.name)),
          NYBG.icon('chevRight', 18, { style: 'flex: none; color: var(--ink-soft)' })));
      })));
    var el = h('div', { class: 'mapview' }, area, list);

    /* ----- zoom and pan ----- */
    /* Keep the map on screen. Translation is a fraction of the box; the visible window is the
       whole map area, so a zoomed map can fill a tall phone screen even though the box is short. */
    function clampAxis(f, boxSize, boxOff, areaSize) {
      var w = z.s * boxSize;
      if (!boxSize) return f;
      if (w <= areaSize) return Math.min(Math.max(f, -boxOff / boxSize), (areaSize - boxOff - w) / boxSize);
      return Math.min(-boxOff / boxSize, Math.max((areaSize - boxOff - w) / boxSize, f));
    }
    function clamp() {
      z.s = Math.min(MAX, Math.max(1, z.s));
      if (z.s <= 1) { z.fx = 0; z.fy = 0; return; }
      var a = area.getBoundingClientRect(), b = box.getBoundingClientRect();
      z.fx = clampAxis(z.fx, b.width, b.left - a.left, a.width);
      z.fy = clampAxis(z.fy, b.height, b.top - a.top, a.height);
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
    if (zoomable) {
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
    }

    function paint() {
      stops.forEach(function (st) {
        var b = pins[st.n], found = !!st.species && NYBG.state.isFound(st.n);
        b.classList.toggle('is-active', st.n === sel);
        b.classList.toggle('is-dim', !!stage && st.stage !== stage);
        b.classList.toggle('is-found', found);
        b.setAttribute('aria-label', 'Stop ' + st.n + ': ' + S.stopName(st) + (found ? ' (found)' : ''));
      });
      list.querySelectorAll('.maplist-row').forEach(function (a) {
        a.classList.toggle('is-dim', !!stage && Number(a.getAttribute('data-stage')) !== stage);
      });
      list.querySelectorAll('.maplist-num').forEach(function (m) {
        m.classList.toggle('is-found', NYBG.state.isFound(Number(m.getAttribute('data-n'))) && !m.classList.contains('is-place'));
      });
    }
    function onFound() { if (!el.isConnected) window.removeEventListener('nybg:found', onFound); else paint(); }
    window.addEventListener('nybg:found', onFound);
    apply();
    paint();
    /* Phones (a tall area and a wide map): start zoomed in so the map fills the screen height,
       centred on the tour route. */
    if (zoomable) requestAnimationFrame(function () {
      var a = area.getBoundingClientRect(), b = box.getBoundingClientRect();
      if (!b.height || a.height < b.height * 1.3) return;
      var ns = Math.min(MAX, a.height / b.height), cx = 0;
      stops.forEach(function (st) { cx += S.mapPos(st).left / 100; });
      cx /= stops.length || 1;
      z.s = ns; z.fx = 0.5 * a.width / b.width - cx * ns; z.fy = 0;
      apply();
    });

    return {
      el: el,
      select: function (n) { sel = n; paint(); },
      refresh: paint,
      setStage: function (g) { stage = g; paint(); },
      setList: function (on) { area.hidden = !!on; list.hidden = !on; },
      pin: function (n) { return pins[n]; }
    };
  }

  /* Static map: route always; optional dot at one stop. */
  function figure(o) {
    o = o || {};
    var inner = h('div', { class: 'mapfig-world', style: { '--map-ar': String(S.mapRatio()) } },
      h('img', { src: S.mapSrc(), alt: o.alt || '' }), routeSvg());
    var kids = [inner];
    if (o.stop) {
      /* A close-up: the map at 5x, moved so the stop sits in the middle of the figure. */
      var p = S.mapPos(o.stop);
      inner.classList.add('is-zoom');
      inner.style.transform = 'translate(-' + p.left.toFixed(2) + '%, -' + p.top.toFixed(2) + '%)';
      kids.push(h('span', { class: 'mapfig-dot', style: { left: '50%', top: '50%', background: o.stop.species ? 'var(--invader)' : 'var(--moss)' } }));
    }
    return h('div', { class: 'mapfig' + (o.class ? ' ' + o.class : '') }, kids);
  }

  NYBG.components.mapView = { create: create, figure: figure, credit: credit };
})();
