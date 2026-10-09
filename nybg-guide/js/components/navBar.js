/* navBar: the top bar (wide) and tab bar (narrow), both drawn from js/config/nav.js.
   The app shell shows one or the other by width (css/base.css). */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;

  function top(items) {
    return h('header', { class: 'topnav' },
      h('a', { class: 'topnav-brand', href: '#/' }, 'Garden Escapes', h('span', null, 'NYBG invasive species guide')),
      h('nav', { 'aria-label': 'Main' }, items.map(function (it) {
        return h('a', { href: it.href, 'data-nav': it.id }, it.label);
      })));
  }

  function bottom(items) {
    return h('nav', { class: 'tabbar', 'aria-label': 'Main' }, items.filter(function (it) { return !it.topOnly; }).map(function (it) {
      return h('a', { href: it.href, 'data-nav': it.id }, NYBG.icon(it.icon, 24), it.short);
    }));
  }

  NYBG.components.navBar = {
    mount: function (topEl, bottomEl) {
      var items = NYBG.config.nav;
      topEl.appendChild(top(items));
      bottomEl.appendChild(bottom(items));
      NYBG.nav = {
        setActive: function (id) {
          document.querySelectorAll('[data-nav]').forEach(function (a) {
            if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
          });
        }
      };
    }
  };
})();
