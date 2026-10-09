/* checklist: the tickable spot-it checklist with "N of M", the "Right now (Month)" callout,
   and, at 3+ ticks on a tour species, "add it to my Quest". Ticks are saved by js/state.js. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;

  NYBG.components.checklist = function (sp) {
    var list = S.checklist(sp);
    var month = new Date().getMonth() + 1;
    var now = S.seasonNow(sp, month);
    var stop = S.stopForSpecies(sp.id);
    var total = list.items.length;

    var count = h('span', { class: 'checklist-count' });
    var match = null;

    function refresh() {
      var ticks = NYBG.state.ticks(sp.id);
      var n = list.items.filter(function (_, i) { return ticks[i]; }).length;
      count.textContent = n + ' of ' + total;
      if (match) match.hidden = !(n >= 3);
    }

    var body = [];
    if (now) {
      body.push(h('div', { class: 'checklist-now', 'data-read': '' }, h('b', null, 'Right now (' + NYBG.monthName(month) + '):'), ' ' + now.look));
    }
    if (total) {
      var ticks = NYBG.state.ticks(sp.id);
      body.push(h('ul', null, list.items.map(function (t, i) {
        var btn = h('button', { type: 'button', class: 'tick', 'aria-pressed': ticks[i] ? 'true' : 'false' },
          h('span', { class: 'tick-box' }, NYBG.icon('check', 16, { style: 'stroke-width: 3' })),
          h('span', { 'data-read': '' }, t));
        btn.addEventListener('click', function () {
          var on = btn.getAttribute('aria-pressed') !== 'true';
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          NYBG.state.setTick(sp.id, i, on);
          refresh();
        });
        return h('li', null, btn);
      })));
      if (stop) {
        match = h('a', { class: 'match-btn', href: '#/quest', hidden: true,
          onClick: function () { NYBG.state.setFound(stop.n, true); } }, 'Looks like a match: add it to my Quest');
        body.push(match);
      }
      body.push(C.sourceLine(list.source));
    } else {
      body.push(C.placeholder('No ID checklist in our sources yet. Add one to guide-build-kit/content/id-checklists.json and it appears here.'));
    }

    var el = h('section', { class: 'checklist', 'aria-label': 'Spot-it checklist' },
      h('div', { class: 'checklist-head' },
        h('h3', { class: 'h3', 'data-read': '' }, 'Spot-it checklist'),
        total ? count : null),
      body);
    if (total) refresh();
    return el;
  };
})();
