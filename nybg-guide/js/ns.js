/* Namespace and small DOM helpers shared by every script.
   Classic scripts only (the site must run from file://), so everything hangs off window.NYBG. */
(function () {
  'use strict';
  var NYBG = (window.NYBG = window.NYBG || {});
  NYBG.components = NYBG.components || {};
  NYBG.screens = NYBG.screens || {};
  NYBG.config = NYBG.config || {};

  var SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, kids) {
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k == null || k === false) continue;
      if (Array.isArray(k)) append(el, k);
      else if (typeof k === 'string' || typeof k === 'number') el.appendChild(document.createTextNode(String(k)));
      else el.appendChild(k);
    }
  }

  function setAttrs(el, attrs, isSvg) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (key) {
      var v = attrs[key];
      if (v == null || v === false) return;
      if (key === 'class') el.setAttribute('class', v);
      else if (key === 'text') el.textContent = v;
      else if (key === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { el.style.setProperty(p, v[p]); });
      else if (key.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(key.slice(2).toLowerCase(), v);
      else if (key === 'ref' && typeof v === 'function') v(el);
      else if (!isSvg && (key === 'value' || key === 'checked' || key === 'disabled' || key === 'hidden')) el[key] = v;
      else el.setAttribute(key, v === true ? '' : v);
    });
  }

  /* h('div', {class: 'x', onClick: fn}, child, [children], 'text') */
  NYBG.h = function (tag) {
    var attrs = arguments[1];
    var start = 2;
    if (attrs && (typeof attrs !== 'object' || Array.isArray(attrs) || attrs.nodeType)) { attrs = null; start = 1; }
    var el = document.createElement(tag);
    setAttrs(el, attrs, false);
    append(el, Array.prototype.slice.call(arguments, start));
    return el;
  };

  NYBG.s = function (tag) {
    var attrs = arguments[1];
    var start = 2;
    if (attrs && (typeof attrs !== 'object' || Array.isArray(attrs) || attrs.nodeType)) { attrs = null; start = 1; }
    var el = document.createElementNS(SVGNS, tag);
    setAttrs(el, attrs, true);
    append(el, Array.prototype.slice.call(arguments, start));
    return el;
  };

  /* Icon paths (from the mockup). */
  NYBG.ICONS = {
    home: 'M3 11 12 4l9 7M5 10v10h14V10',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
    species: 'M4 5h11M4 10h7M4 15h5M16 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 18l2.5 2.5',
    layers: 'M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 18l10 5 10-5',
    quest: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    hub: 'M12 21V9M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6zM12 10c3.5 0 5.5-2 5.5-5.5-3.5 0-5.5 2-5.5 5.5z',
    house: 'M3 11 12 4l9 7M5 10v10h14V10M12 20v-6',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    arrowRight: 'M5 12h14M13 6l6 6-6 6',
    chevLeft: 'M15 6l-6 6 6 6',
    chevRight: 'M9 6l6 6-6 6',
    chevUp: 'M6 15l6-6 6 6',
    chevDown: 'M6 9l6 6 6-6',
    close: 'M6 6l12 12M18 6 6 18',
    external: 'M7 17 17 7M9 7h8v8',
    check: 'M5 12l5 5 9-10',
    pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM14.5 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
    target: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
    photo: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM11 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 16l-5-5-8 8',
    pause: 'M9 5v14M15 5v14',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'
  };

  NYBG.icon = function (name, size, extra) {
    size = size || 20;
    var attrs = { class: 'ic', width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' };
    if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
    return NYBG.s('svg', attrs, NYBG.s('path', { d: NYBG.ICONS[name] || name }));
  };

  /* Filled play / stop glyphs (the mockup draws these filled, not stroked). */
  NYBG.glyph = function (kind, size) {
    size = size || 20;
    var d = kind === 'play' ? 'M8 5l12 7-12 7z' : 'M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z';
    return NYBG.s('svg', { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      NYBG.s('path', { d: d, fill: 'currentColor' }));
  };

  NYBG.reducedMotion = function () {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  NYBG.monthName = function (m) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1];
  };
})();
