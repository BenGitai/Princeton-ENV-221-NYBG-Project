/* Home tiles (UI labels only). color is a CSS variable name from css/tokens.css. */
window.NYBG = window.NYBG || {};
NYBG.config = NYBG.config || {};
NYBG.config.home = {
  tiles: [
    { href: '#/map', title: 'Garden map', sub: 'Tap a number to jump to that stop', color: '--moss', icon: 'map' },
    { href: '#/layers', title: 'Forest layers', sub: 'How each tour invader ripples through the forest', color: '--moss', icon: 'layers' },
    { href: '#/quest', title: 'Escape Quest', sub: 'Spot and log invaders for NYBG scientists', color: '--invader', icon: 'quest' },
    { href: '#/hub', title: 'Plant at home', sub: 'Native swaps and nurseries near you', color: '--moss', icon: 'house' }
  ],
  /* Walk time: not measured yet, so it stays a visible placeholder. */
  walkTime: '[~75 min]'
};
