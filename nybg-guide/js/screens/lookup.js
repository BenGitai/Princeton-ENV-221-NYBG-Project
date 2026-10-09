/* Species lookup (#/lookup?q=&filter=) and species pages (#/species/<id>).
   Phones: the list, or the selected species page full screen. 900px and up: the list (420px)
   on the left and the selected species page on the right. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;
  var PAGE = 40;
  var memo = { q: '', filter: 'all' }; // the list survives opening a species and coming back

  function lookupHash() {
    var parts = [];
    if (memo.q) parts.push('q=' + encodeURIComponent(memo.q));
    if (memo.filter && memo.filter !== 'all') parts.push('filter=' + encodeURIComponent(memo.filter));
    return '#/lookup' + (parts.length ? '?' + parts.join('&') : '');
  }

  NYBG.screens.lookup = {
    render: function (params) {
      if (params.q != null) memo.q = params.q;
      if (params.filter) memo.filter = params.filter;
      var st = { open: params.open || null, limit: PAGE, hits: [] };
      var webIds = {};
      S.webs().forEach(function (w) { webIds[w.id] = true; });

      var countEl = h('span', { class: 'head-hint', 'aria-live': 'polite' });
      var input = h('input', { id: 'lk-q', type: 'search', placeholder: 'Common or scientific name', autocomplete: 'off', value: memo.q });
      var filters = C.chipRow('Filter', S.filters(), memo.filter, function (id) {
        memo.filter = id; filters.set(id); st.limit = PAGE; refreshList(); syncUrl();
      });
      var rows = h('ul', { class: 'lk-rows', 'aria-label': 'Species' });
      var moreBtn = h('button', { type: 'button' });
      var more = h('div', { class: 'lk-more' }, moreBtn);
      var empty = C.placeholder('No species match. Try a common name, a scientific name or a synonym.', { read: false, class: 'lk-empty' });
      moreBtn.addEventListener('click', function () { st.limit += PAGE; refreshList(); });
      var listScroll = h('div', { class: 'scroll' }, rows, empty, more,
        h('p', { class: 'lk-note' }, 'Dots show which sources feed each page: Forest Plan · ENV 221 info page · cascade page · public sources. Pages are assembled from those files by a script.'));
      var list = h('section', { class: 'lk-list', 'aria-label': 'Species list' },
        h('div', { class: 'screen-head', style: 'padding-bottom: 8px' },
          h('div', { class: 'head-row' }, h('h1', { class: 'h1' }, 'Species lookup'), countEl),
          h('label', { for: 'lk-q', class: 'sr-only' }, 'Search invasive species'),
          h('div', { class: 'lk-search' }, NYBG.icon('search', 20), input),
          filters.el),
        listScroll);

      var pageScroll = h('div', { class: 'scroll', tabindex: '-1' });
      var page = h('section', { class: 'lk-page', 'aria-label': 'Species page' },
        h('div', { class: 'lk-back backbar', style: 'justify-content: flex-start' },
          h('button', { type: 'button', class: 'backbtn navbtn', onClick: function () { NYBG.router.back(lookupHash()); } },
            NYBG.icon('chevLeft', 20), 'All species')),
        pageScroll);

      var root = h('div', { class: 'scr' }, h('div', { class: 'lk-cols' }, list, page));

      function row(e) {
        var tags = [];
        if (e.tour_stop) tags.push(h('span', { class: 'tag tag-stop' }, 'Stop ' + e.tour_stop));
        if (e.category) tags.push(h('span', { class: 'tag tag-cat' }, 'Category ' + e.category));
        if (e.kind !== 'plant') tags.push(h('span', { class: 'tag tag-pest' }, e.kind === 'pest' ? 'Pest' : 'Disease'));
        if (webIds[e.id]) tags.push(h('span', { class: 'tag tag-web' }, 'Forest layers'));
        var parts = [!!e.forest_plan, !!e.info_page, !!e.cascade, !!e.public];
        var n = parts.filter(Boolean).length;
        return h('li', null, h('a', { class: 'row', href: '#/species/' + encodeURIComponent(e.id), 'data-id': e.id },
          h('span', { class: 'row-text' },
            h('span', { class: 'row-name' }, S.name(e)),
            h('span', { class: 'row-sci' }, e.scientific_name),
            tags.length ? h('span', { class: 'row-tags' }, tags) : null),
          h('span', { class: 'dots', role: 'img', 'aria-label': n + ' of 4 sources' }, parts.map(function (on) { return h('span', { class: on ? 'on' : '' }); })),
          NYBG.icon('chevRight', 18, { style: 'flex: none; color: var(--ink-soft)' })));
      }

      function shownId() { return st.open || (st.hits[0] || {}).id || null; }

      function markSelected() {
        var id = shownId();
        rows.querySelectorAll('.row').forEach(function (a) {
          var on = a.getAttribute('data-id') === id;
          // With nothing opened, the first row is only "selected" where its page is shown (wide screens).
          a.classList.toggle('is-sel', on && !!st.open);
          a.classList.toggle('is-default', on && !st.open);
          if (on && st.open) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      }

      var listKey = null, savedScroll = 0;
      function refreshList() {
        var key = memo.q + '|' + memo.filter + '|' + st.limit;
        if (key === listKey) { markSelected(); if (!st.open) fillPage(); return; }
        listKey = key;
        st.hits = S.search(memo.q, memo.filter);
        countEl.textContent = st.hits.length + ' of ' + S.count();
        rows.textContent = '';
        st.hits.slice(0, st.limit).forEach(function (e) { rows.appendChild(row(e)); });
        var left = st.hits.length - st.limit;
        more.hidden = left <= 0;
        moreBtn.textContent = 'Show more (' + Math.max(0, left) + ')';
        empty.hidden = st.hits.length > 0;
        markSelected();
        if (!st.open) fillPage();
      }

      var pageId = null;
      function fillPage() {
        var id = shownId();
        if (id === pageId) return;
        pageId = id;
        pageScroll.textContent = '';
        if (id) pageScroll.appendChild(NYBG.screens.species.render({ id: id }));
        pageScroll.scrollTop = 0;
      }

      function syncUrl() { if (!st.open) NYBG.router.replace(lookupHash()); }

      input.addEventListener('input', function () { memo.q = input.value; st.limit = PAGE; refreshList(); syncUrl(); });

      function apply(p) {
        if (p.q != null && p.q !== memo.q) { memo.q = p.q; input.value = memo.q; }
        if (p.filter && p.filter !== memo.filter) { memo.filter = p.filter; filters.set(memo.filter); }
        st.open = p.open || null;
        if (st.open) {
          if (list.offsetParent) savedScroll = listScroll.scrollTop;
          list.setAttribute('data-hidden', ''); page.removeAttribute('data-hidden');
        } else {
          page.setAttribute('data-hidden', ''); list.removeAttribute('data-hidden');
        }
        refreshList();
        if (!st.open && savedScroll) { listScroll.scrollTop = savedScroll; savedScroll = 0; }
        fillPage();
      }
      apply(params);

      root.nybgUpdate = function (p) {
        var wasOpen = st.open;
        apply(p);
        // Phones: opening a species replaces the list, so move focus to the page.
        if (st.open && st.open !== wasOpen && page.offsetWidth === root.offsetWidth) pageScroll.focus({ preventScroll: true });
        return true;
      };
      root.nybgTitle = function () { var e = st.open && S.species(st.open); return e ? S.name(e) : 'Species lookup'; };
      return root;
    }
  };
})();
