/* Visitor state kept in localStorage: quest progress, checklist ticks, the read-aloud setting.
   Every access is wrapped in try/catch; if storage is blocked the site keeps working from memory. */
(function () {
  'use strict';
  var NYBG = window.NYBG;
  var PREFIX = 'nybg-guide.';
  var memory = {};

  function read(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw != null) return JSON.parse(raw);
    } catch (e) { /* storage blocked or bad JSON: use memory */ }
    return key in memory ? memory[key] : fallback;
  }

  function write(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }

  NYBG.state = {
    /* Quest: found[stopNumber] = true */
    found: function () { return read('quest', {}); },
    isFound: function (n) { return !!read('quest', {})[n]; },
    setFound: function (n, on) { var q = read('quest', {}); if (on) q[n] = true; else delete q[n]; write('quest', q); },

    /* Spot-it checklist ticks: ticks[speciesId][itemIndex] = true */
    ticks: function (id) { return read('ticks', {})[id] || {}; },
    setTick: function (id, i, on) {
      var all = read('ticks', {});
      var mine = all[id] || {};
      if (on) mine[i] = true; else delete mine[i];
      all[id] = mine;
      write('ticks', all);
    },

    /* "Read each stop aloud when I arrive" (on by default, as in the mockup) */
    autoplay: function () { return read('autoplay', true) !== false; },
    setAutoplay: function (on) { write('autoplay', !!on); }
  };
})();
