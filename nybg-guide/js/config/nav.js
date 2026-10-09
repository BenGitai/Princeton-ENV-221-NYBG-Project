/* The one list behind both the wide-screen top bar and the phone tab bar.
   topOnly items appear only in the top bar. Icons are names from NYBG.ICONS (js/ns.js). */
window.NYBG = window.NYBG || {};
NYBG.config = NYBG.config || {};
NYBG.config.nav = [
  { id: 'home', label: 'Home', short: 'Home', href: '#/', icon: 'home' },
  { id: 'map', label: 'Map & stops', short: 'Map', href: '#/map', icon: 'map' },
  { id: 'species', label: 'Species lookup', short: 'Species', href: '#/lookup', icon: 'species' },
  { id: 'layers', label: 'Forest layers', short: 'Layers', href: '#/layers', icon: 'layers', topOnly: true },
  { id: 'quest', label: 'Quest', short: 'Quest', href: '#/quest', icon: 'quest' },
  { id: 'hub', label: 'At home', short: 'At home', href: '#/hub', icon: 'hub' }
];
