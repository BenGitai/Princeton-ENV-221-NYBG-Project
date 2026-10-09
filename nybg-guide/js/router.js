/* Hash router. Routes:
     #/                 home
     #/map              map            #/map/N   map with stop N previewed
     #/stop/N           stop N (phones: the stop page; wide screens: map + stop panel)
     #/species/<id>     species page (inside the lookup screen: list + page side by side when wide)
     #/lookup?q=&filter=  species lookup
     #/layers/<id>      forest layers for a tour species
     #/quest            Garden Escape Quest
     #/hub              Take it home
   When the new route belongs to the screen already shown, the screen updates in place
   (so the map keeps its zoom and the lookup list keeps its scroll). Speech always stops. */
(function () {
  'use strict';
  var NYBG = window.NYBG;

  function parse(hash) {
    var h = (hash || '').replace(/^#/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var query = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var i = kv.indexOf('=');
        var k = decodeURIComponent(i >= 0 ? kv.slice(0, i) : kv);
        query[k] = decodeURIComponent((i >= 0 ? kv.slice(i + 1) : '').replace(/\+/g, ' '));
      });
    }
    var parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    var a = parts[0] || '', b = parts[1];
    switch (a) {
      case '': return { name: 'home', nav: 'home', params: {} };
      case 'map': return { name: 'map', nav: 'map', params: { view: 'map', n: b ? Number(b) : null } };
      case 'stop': return { name: 'map', nav: 'map', params: { view: 'stop', n: Number(b) || 1 } };
      case 'species': return { name: 'lookup', nav: 'species', params: { open: b || null } };
      case 'lookup': return { name: 'lookup', nav: 'species', params: { open: null, q: query.q, filter: query.filter } };
      case 'layers': return { name: 'layers', nav: 'layers', params: { id: b || null } };
      case 'quest': return { name: 'quest', nav: 'quest', params: {} };
      case 'hub': return { name: 'hub', nav: 'hub', params: {} };
      default: return { name: 'home', nav: 'home', params: {} };
    }
  }

  var main, current = null, previousHash = null, lastHash = null;

  function show() {
    var hash = location.hash || '#/';
    var route = parse(hash);
    if (NYBG.speech) NYBG.speech.stop();
    previousHash = lastHash;
    lastHash = hash;

    var screen = NYBG.screens[route.name];
    var handled = false;
    if (current && current.name === route.name && current.el && typeof current.el.nybgUpdate === 'function') {
      handled = current.el.nybgUpdate(route.params) === true;
    }
    if (!handled) {
      if (current && current.el && typeof current.el.nybgDestroy === 'function') current.el.nybgDestroy();
      main.textContent = '';
      var el = screen.render(route.params);
      main.appendChild(el);
      current = { name: route.name, el: el };
      if (previousHash !== null) main.focus({ preventScroll: true });
    }
    document.getElementById('app').setAttribute('data-route', route.name);
    if (NYBG.nav) NYBG.nav.setActive(route.nav);
    var title = current.el.nybgTitle ? current.el.nybgTitle() : '';
    document.title = (title ? title + ' · ' : '') + 'Garden Escapes · NYBG invasive species guide';
  }

  NYBG.router = {
    parse: parse,
    start: function () {
      main = document.getElementById('main');
      window.addEventListener('hashchange', show);
      show();
    },
    go: function (hash) { if (location.hash === hash) show(); else location.hash = hash; },
    /* Replace the URL without a new history entry or a re-render (used to keep the lookup query in the URL). */
    replace: function (hash) {
      lastHash = hash;
      try { history.replaceState(null, '', hash); } catch (e) { /* file:// in some browsers: ignore */ }
    },
    /* Back inside the app if we came from one of its pages, otherwise go to the fallback route. */
    back: function (fallback) {
      if (previousHash !== null) history.back();
      else location.hash = fallback;
    }
  };
})();
