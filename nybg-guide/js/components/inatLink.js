/* inatLink: the ONE iNaturalist link on a species page: its sightings inside the Garden (place_id
   from content/links.json), with the static record count from the sources when there is one.
   When online it also asks the iNaturalist API for a live count, without ever blocking rendering. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store;

  var cache = {}; // scientific name -> live count, so revisiting a page does not ask again

  function show(sub, n) { sub.textContent = n + ' verifiable records inside the Garden (live from iNaturalist)'; }

  function liveCount(sp, placeId, sub) {
    if (sp.scientific_name in cache) { if (cache[sp.scientific_name] != null) show(sub, cache[sp.scientific_name]); return; }
    if (!window.fetch || !navigator.onLine || !placeId || !sub.isConnected) return;
    cache[sp.scientific_name] = null;
    var url = 'https://api.inaturalist.org/v1/observations?place_id=' + encodeURIComponent(placeId) +
      '&taxon_name=' + encodeURIComponent(sp.scientific_name) + '&verifiable=true&per_page=0';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        if (d && typeof d.total_results === 'number') {
          cache[sp.scientific_name] = d.total_results;
          if (sub.isConnected) show(sub, d.total_results);
        } else delete cache[sp.scientific_name];
      })
      .catch(function () { clearTimeout(timer); delete cache[sp.scientific_name]; });
  }

  NYBG.components.inatLink = function (sp) {
    var i = S.inat(sp);
    var sub = h('span', { class: 'inat-sub' }, i.staticText);
    var el = h('a', { class: 'inat', href: i.url, target: '_blank', rel: 'noopener' },
      NYBG.icon('target', 26, { style: 'flex: none; color: var(--moss)' }),
      h('span', { class: 'inat-text' },
        h('span', { class: 'inat-title' }, 'See it on iNaturalist'),
        sub),
      NYBG.icon('external', 18, { style: 'flex: none' }),
      h('span', { class: 'sr-only' }, '(opens in a new tab)'));
    // Ask only once the page has stayed open a moment (never blocks rendering).
    setTimeout(function () { liveCount(sp, i.placeId, sub); }, 700);
    return el;
  };
})();
