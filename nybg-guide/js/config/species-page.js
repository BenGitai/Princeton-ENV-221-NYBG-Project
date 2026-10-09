/* SECTION REGISTRY for the species page, in page order.
   Each entry: { id, slot, title?, when(sp), render(sp), source?(sp), placeholder?(sp) }
     slot         where it goes: 'hero' | 'head' (top, beside the photo when wide) | 'main' (text column) | 'side' (right column)
     title        if set, the section gets this heading (read aloud unless readTitle: false) and ends with its "Source: …" line
     when(sp)     show only when this returns true (i.e. when its data exists)
     render(sp)   the section's content (a node or a list of nodes); text comes only from the species record
     source(sp)   the "Source: …" text for the section
     placeholder(sp)  optional: what to show instead when `when` is false (a dashed placeholder naming the file)
   Add an entry here and it appears on every species page; nothing else needs to change.
   Rendered by js/screens/species.js. Species text is never written here: only field lookups. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h, S = NYBG.store, C = NYBG.components;
  var fp = function (sp) { return sp.forest_plan || {}; };
  var cs = function (sp) { return sp.cascade || {}; };
  var paras = function (list) { return list.map(function (t) { return h('p', { 'data-read': '' }, t); }); };
  var onTour = function (sp) { return !!S.stopForSpecies(sp.id); };

  NYBG.config.speciesPage = [
    /* ---------- top: photo, then the header beside it ---------- */
    {
      id: 'hero', slot: 'hero',
      when: function (sp) { return !!S.heroPhoto(sp); },
      render: function (sp) {
        var p = S.heroPhoto(sp);
        return h('figure', null,
          h('img', { src: p.src, alt: 'Photo of ' + S.name(sp) + ' (' + sp.scientific_name + ')' }),
          p.credit ? h('figcaption', null, p.credit) : null);
      },
      placeholder: function () {
        return h('div', { class: 'ph-photo' },
          NYBG.icon('photo', 30),
          h('span', { class: 'ph-photo-title' }, '[No photo in our sources yet]'),
          h('span', { class: 'ph-photo-sub' }, 'Add a CC-licensed photo with credit to this species’ info-page slide (guide-build-kit/content/info-pages/*.pptx) and rerun build_data.py'));
      }
    },
    {
      id: 'place', slot: 'head',
      when: onTour,
      render: function (sp) {
        var st = S.stopForSpecies(sp.id);
        return h('div', { class: 'sp-where' },
          h('span', { 'aria-hidden': 'true', style: 'display: inline-flex' }, NYBG.icon('pin', 18), ''),
          h('span', { 'data-read': '' }, 'Stop ' + st.n + ' · ' + st.place),
          st.verify ? h('span', { class: 'verify' }, 'Spot to confirm') : null);
      }
    },
    {
      id: 'names', slot: 'head',
      when: function () { return true; },
      render: function (sp) {
        var fam = S.family(sp), aka = S.aka(sp);
        return [
          h('h2', { class: 'sp-name', 'data-read': '' }, S.name(sp)),
          h('div', { class: 'sp-sci', 'data-read': '' }, sp.scientific_name, fam ? ' ' : '', fam ? h('span', null, fam) : null),
          aka.length ? h('div', { class: 'sp-aka', 'data-read': '' }, 'Also called: ' + aka.join(', ')) : null
        ];
      }
    },
    {
      id: 'status', slot: 'head',
      when: function () { return true; },
      render: function (sp) {
        return h('div', { class: 'sp-status', 'data-read': '' }, S.status(sp) + ' · native to ' + (S.range(sp) || '[native range not in sources]'));
      }
    },
    {
      id: 'badges', slot: 'head',
      when: function (sp) { return S.badges(sp).length > 0; },
      render: function (sp) {
        return h('ul', { class: 'badges', 'aria-label': 'Status' }, S.badges(sp).map(function (b) { return h('li', { class: 'badge', 'data-read': '' }, b); }));
      }
    },
    {
      id: 'read-aloud', slot: 'head',
      when: function () { return true; },
      render: function () { return C.readAloud(); }
    },

    /* ---------- main column: sourced text ---------- */
    {
      id: 'what', slot: 'main', title: 'What it is',
      when: function (sp) { return !!S.summary(sp); },
      render: function (sp) { return paras([S.summary(sp).text]); },
      source: function (sp) { return S.summary(sp).source; }
    },
    {
      id: 'why', slot: 'main', title: 'Why it matters',
      when: function (sp) { return !!S.impact(sp); },
      render: function (sp) { return paras([S.impact(sp).text]); },
      source: function (sp) { return S.impact(sp).source; }
    },
    {
      id: 'below', slot: 'main', title: 'Below the surface',
      when: function (sp) { return !!(cs(sp).body && cs(sp).body.length); },
      render: function (sp) { return paras(cs(sp).body); },
      source: function (sp) { return S.source(sp, 'cascade'); }
    },
    {
      id: 'threat', slot: 'main', title: 'Threat to the Thain Forest',
      when: function (sp) { return !!fp(sp).threat; },
      render: function (sp) { return paras([fp(sp).threat]); },
      source: function (sp) { return S.source(sp, 'forest_plan'); }
    },
    {
      id: 'garden', slot: 'main', title: 'At the Garden',
      when: function (sp) { return !!cs(sp).nybg; },
      render: function (sp) { return paras([cs(sp).nybg]); },
      source: function (sp) { return S.source(sp, 'cascade'); }
    },
    {
      id: 'manage', slot: 'main', title: 'How NYBG manages it',
      when: function (sp) { return !!fp(sp).control; },
      render: function (sp) { return paras([fp(sp).control]); },
      source: function (sp) { return S.source(sp, 'forest_plan'); }
    },
    {
      id: 'about', slot: 'main', title: 'About this species', readTitle: false,
      when: function (sp) { return !S.hasPageText(sp); },
      render: function () {
        return C.placeholder('Only the NYBG list covers this species so far. Its page fills in automatically when a Forest Plan entry, an info-page slide (guide-build-kit/content/info-pages/*.pptx) or a <name>-cascade.html page is added for it.');
      },
      source: function (sp) { return S.source(sp, 'names') || 'NYBG invasive species list 2026'; }
    },

    /* ---------- side column ---------- */
    {
      id: 'checklist', slot: 'side',
      when: function () { return true; },
      render: function (sp) { return C.checklist(sp); }
    },
    {
      id: 'natives', slot: 'side',
      when: function (sp) { var a = S.alternatives(sp); return a.items.length > 0 || !!a.text; },
      render: function (sp) { return C.nativeGrid(S.alternatives(sp)); },
      placeholder: function (sp) {
        if (!onTour(sp) || sp.kind !== 'plant') return null; // natives only make sense for plants
        return h('section', { class: 'natives', 'aria-label': 'Plant these instead' },
          h('h3', { class: 'h3', 'data-read': '' }, 'Plant these instead'),
          C.placeholder('No native alternatives in our sources yet. Add them to this species’ info-page slide (guide-build-kit/content/info-pages/*.pptx) and rerun build_data.py.'));
      }
    },
    {
      id: 'layers', slot: 'side',
      when: function (sp) { return !!S.web(sp.id); },
      render: function (sp) {
        return h('a', { class: 'layers-card', href: '#/layers/' + sp.id },
          C.webView.thumb(S.web(sp.id)),
          h('span', { class: 'layers-card-text' },
            h('span', { class: 'layers-card-title' }, S.name(sp) + ': forest layers'),
            h('span', { class: 'layers-card-sub' }, 'What it affects from canopy to soil, and what helps it spread.')));
      }
    },
    {
      id: 'inaturalist', slot: 'side',
      when: function () { return true; },
      render: function (sp) { return C.inatLink(sp); }
    },
    {
      id: 'provenance', slot: 'side',
      when: function () { return true; },
      render: function (sp) { return C.provenanceList(sp); }
    }
  ];
})();
