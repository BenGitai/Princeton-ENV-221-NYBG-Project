/* chip: a toggle button in a chip row. chipRow(label, items, onPick) -> {el, set(id)} */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;

  function chip(label, pressed, onClick, extraClass) {
    return h('button', { type: 'button', class: 'chip' + (extraClass ? ' ' + extraClass : ''), 'aria-pressed': pressed ? 'true' : 'false', onClick: onClick }, label);
  }

  function chipRow(groupLabel, items, current, onPick, extraClass) {
    var buttons = {};
    var el = h('div', { class: 'chip-row', role: 'group', 'aria-label': groupLabel }, items.map(function (it) {
      var b = chip(it.label, it.id === current, function () { onPick(it.id); }, extraClass);
      buttons[it.id] = b;
      return b;
    }));
    return {
      el: el,
      set: function (id) {
        Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', String(k) === String(id) ? 'true' : 'false'); });
        if (buttons[id] && buttons[id].scrollIntoView && el.scrollWidth > el.clientWidth) {
          var b = buttons[id];
          el.scrollLeft = Math.max(0, b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2);
        }
      }
    };
  }

  NYBG.components.chip = chip;
  NYBG.components.chipRow = chipRow;
})();
