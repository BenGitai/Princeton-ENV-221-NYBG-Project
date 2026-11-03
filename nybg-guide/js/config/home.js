/* Home tiles (UI labels only). color is a CSS variable name from css/tokens.css. */
window.NYBG = window.NYBG || {};
NYBG.config = NYBG.config || {};
NYBG.config.home = {
  tiles: [
    { href: '#/map', title: 'Garden map', sub: 'All 10 stops', color: '--moss', icon: 'map' },
    { href: '#/layers', title: 'Forest layers', sub: 'Canopy to soil', color: '--moss', icon: 'layers' },
    { href: '#/quest', title: 'Escape Quest', sub: 'Log what you find', color: '--invader', icon: 'quest' },
    { href: '#/hub', title: 'Plant at home', sub: 'Native swaps', color: '--moss', icon: 'house' }
  ],
  /* Walk time: not measured yet, so it stays a visible placeholder. */
  walkTime: '[~75 min]'
};
