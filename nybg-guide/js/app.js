/* Boot: mount the navigation and start the router. */
(function () {
  'use strict';
  var NYBG = window.NYBG;
  function boot() {
    if (!NYBG.data) {
      document.getElementById('main').textContent = 'The guide data is missing. Run: python guide-build-kit/tools/build_data.py';
      return;
    }
    NYBG.components.navBar.mount(document.getElementById('app-top'), document.getElementById('app-tabs'));
    NYBG.router.start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
