/* Species page: built entirely from the section registry (js/config/species-page.js).
   Used inside the stop page (#/stop/N) and the lookup (#/species/<id>). It is its own container,
   so it goes two-column only when it is itself 760px wide or more (not inside the 480px map panel). */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store;

  function build(entry, sp) {
    var shown = entry.when(sp);
    if (!shown) return entry.placeholder ? entry.placeholder(sp) : null;
    var content = entry.render(sp);
    if (!entry.title) {
      if (!entry.source) return content;
      return [].concat(content, NYBG.components.sourceLine(entry.source(sp)));
    }
    return h('section', { class: 'sp-text', 'data-section': entry.id, 'aria-label': entry.title },
      h('h3', { class: 'h3', 'data-read': entry.readTitle === false ? null : '' }, entry.title),
      content,
      entry.source ? NYBG.components.sourceLine(entry.source(sp)) : null);
  }

  NYBG.screens.species = {
    render: function (params) {
      var sp = S.species(params.id);
      if (!sp) {
        return h('div', { class: 'sp', 'data-read-root': '' },
          h('div', { class: 'sp-head', style: 'padding-bottom: 20px' },
            h('h2', { class: 'sp-name' }, 'Species not found'),
            h('p', null, h('a', { href: '#/lookup' }, 'Search all species'))));
      }
      var slots = { hero: [], head: [], main: [], side: [] };
      NYBG.config.speciesPage.forEach(function (entry) {
        var node = build(entry, sp);
        if (node) (slots[entry.slot] || slots.main).push(node);
      });
      return h('article', { class: 'sp', 'data-read-root': '', 'aria-label': S.name(sp) },
        h('div', { class: 'sp-wrap' },
          h('div', { class: 'sp-top' },
            h('div', { class: 'sp-hero' }, slots.hero),
            h('div', { class: 'sp-head' }, slots.head)),
          h('div', { class: 'sp-body' },
            h('div', { class: 'sp-col' }, slots.main),
            h('div', { class: 'sp-col' }, slots.side)),
          h('div', { class: 'sp-end' })));
    }
  };
})();
