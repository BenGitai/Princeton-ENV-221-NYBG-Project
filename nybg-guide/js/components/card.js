/* card: home tiles and link cards. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;

  NYBG.components.card = {
    tile: function (t) {
      return h('a', { class: 'tile', href: t.href },
        NYBG.icon(t.icon, 26, { style: 'color: var(' + t.color + ')' }),
        h('span', { class: 'tile-title' }, t.title),
        h('span', { class: 'tile-sub' }, t.sub));
    },
    /* A full-width link card; title is read aloud on pages with read-aloud (opts.read). */
    link: function (o) {
      return h('a', { class: 'linkcard' + (o.invader ? ' is-invader' : ''), href: o.href },
        h('span', { class: 'linkcard-text' },
          h('span', { class: 'linkcard-title', 'data-read': o.read ? '' : null }, o.title),
          o.sub ? h('span', { class: 'linkcard-sub' }, o.sub) : null),
        NYBG.icon(o.icon || 'arrowRight', 22, { style: 'flex: none; color: var(' + (o.invader ? '--invader' : '--moss') + ')' }));
    }
  };
})();
