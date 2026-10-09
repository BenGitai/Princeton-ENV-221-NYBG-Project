/* Forest layers (#/layers/<id>): one web per tour species, all from build/webs.json.
   A chip row switches webs; tapping a node shows its word-for-word quote and source, with links
   to its species page, its own web, and every other web that shares the node. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;
  var lastId = null;

  function legend() {
    function sw(style) { return h('span', { class: 'legend-swatch', style: style }); }
    return h('ul', { class: 'legend ly-legend', 'aria-label': 'How to read the web' },
      h('li', null, sw('height: 3px; border-radius: 2px; background: var(--edge-harm)'), 'Harms'),
      h('li', null, sw('border-top: 3px dashed var(--edge-help)'), 'Helps'),
      h('li', null, sw('border-top: 3px dotted var(--edge-mutual)'), 'Partners'),
      h('li', null, sw('border-top: 2px dashed var(--edge-link)'), 'Named together'),
      h('li', null, h('span', { class: 'legend-link' }, NYBG.icon('external', 10, { style: 'stroke-width: 3' })), 'Links out'));
  }

  NYBG.screens.layers = {
    render: function (params) {
      var webs = S.webs();
      var st = { id: null, i: 0 };
      var sub = h('span', { class: 'ly-sub' });
      var back = h('a', { class: 'ly-back' }, NYBG.icon('chevLeft', 22));
      var chips = C.chipRow('Choose an invader', webs.map(function (w) { return { id: w.id, label: w.title }; }), null,
        function (id) { NYBG.router.go('#/layers/' + id); }, 'chip-invader');
      var stage = h('div', { class: 'ly-stage' });
      var cardBody = h('div', { class: 'ly-card-body' });
      var prevBtn = h('button', { type: 'button', 'aria-label': 'Previous species in this web', class: 'navbtn' }, NYBG.icon('chevUp', 20));
      var nextBtn = h('button', { type: 'button', 'aria-label': 'Next species in this web', class: 'navbtn' }, NYBG.icon('chevDown', 20));
      var card = h('section', { class: 'ly-card', 'aria-live': 'polite', 'aria-label': 'Selected species' }, cardBody, h('div', { class: 'ly-nav' }, prevBtn, nextBtn));
      var main = h('div', { class: 'ly-main' }, stage, card);
      var root = h('div', { class: 'scr' },
        h('header', { class: 'ly-head' }, back,
          h('div', { style: 'display: flex; flex-direction: column; min-width: 0' }, h('h1', { class: 'ly-title' }, 'Forest layers'), sub)),
        h('div', { class: 'ly-chips' }, chips.el),
        legend(),
        main);

      var view = null, web = null, links = {};

      function select(i, focus) {
        st.i = (i + web.nodes.length) % web.nodes.length;
        view.select(st.i);
        var n = web.nodes[st.i], L = links[n.id] || { also: [] };
        cardBody.textContent = '';
        cardBody.appendChild(h('span', { class: 'ly-step', style: { color: n.group === 'invader' ? 'var(--invader)' : 'var(--ink-soft)' } }, n.step || ''));
        cardBody.appendChild(h('h2', { class: 'ly-name' }, n.name));
        cardBody.appendChild(h('p', { class: 'ly-quote' }, '“' + n.quote + '”'));
        cardBody.appendChild(C.sourceLine(n.source));
        var acts = [];
        if (L.page) acts.push(h('a', { class: 'act', href: '#/species/' + L.page }, 'Species page'));
        if (L.ownWeb) acts.push(h('a', { class: 'act is-web', href: '#/layers/' + L.ownWeb }, 'Its own web'));
        L.also.forEach(function (w) { acts.push(h('a', { class: 'act is-also', href: '#/layers/' + w }, 'Also in: ' + S.web(w).title)); });
        if (acts.length) cardBody.appendChild(h('div', { class: 'ly-acts' }, acts));
        cardBody.appendChild(h('details', { class: 'ly-arrows' },
          h('summary', null, 'All arrows in this web, as text'),
          h('ul', null, C.webView.arrowList(web).map(function (a) { return h('li', null, a.kind + ': ' + a.text); }))));
        if (focus) view.button(st.i).focus();
      }

      function fit() {
        if (!view || !root.isConnected) return;
        var wide = root.clientWidth >= 900;
        var s;
        if (wide) {
          s = Math.max(0.8, Math.min(1.2, (main.clientHeight - 36) / 560));
        } else {
          var availH = main.clientHeight - 150 - 16;
          s = Math.max(0.5, Math.min(0.9 * Math.min(1, root.clientWidth / 390), availH / 560));
        }
        view.el.style.transform = 'scale(' + s + ')';
        stage.style.width = Math.round(390 * s) + 'px';
        stage.style.height = Math.round(560 * s) + 'px';
      }

      function show(id) {
        lastId = id;
        st.id = id;
        web = S.web(id);
        links = S.webLinks(id);
        chips.set(id);
        var sp = S.species(id), stop = S.stopForSpecies(id);
        sub.textContent = web.title + ' · tap a species, follow the links';
        back.setAttribute('href', stop ? '#/stop/' + stop.n : '#/species/' + id);
        back.setAttribute('aria-label', 'Back to the ' + (sp ? S.name(sp) : web.title) + ' page');
        view = C.webView.create(web, { onPick: function (i) { select(i, false); } });
        stage.textContent = '';
        stage.appendChild(view.el);
        stage.setAttribute('aria-label', 'Forest layers web for ' + web.title);
        stage.setAttribute('role', 'group');
        select(0, false);
        fit();
      }

      prevBtn.addEventListener('click', function () { select(st.i - 1, false); });
      nextBtn.addEventListener('click', function () { select(st.i + 1, false); });

      function resolve(id) { return S.web(id) ? id : (lastId && S.web(lastId) ? lastId : (webs[0] || {}).id); }
      show(resolve(params.id));

      var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
      if (ro) ro.observe(root); else window.addEventListener('resize', fit);
      setTimeout(function () { fit(); chips.set(st.id); }, 0); // chip scroll needs the row on screen

      root.nybgUpdate = function (p) { var id = resolve(p.id); if (id !== st.id) show(id); return true; };
      root.nybgDestroy = function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); };
      root.nybgTitle = function () { return 'Forest layers · ' + web.title; };
      return root;
    }
  };
})();
