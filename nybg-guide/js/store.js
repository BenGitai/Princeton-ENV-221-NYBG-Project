/* Store: the only code that reads NYBG.data (built by guide-build-kit/tools/bundle_site_data.py).
   Screens and components ask the store; they never touch the data bundle directly.
   Everything returned here is either sourced text copied by the pipeline, or a lookup over it. */
(function () {
  'use strict';
  var NYBG = window.NYBG;
  var D = NYBG.data || { species: [], webs: [], shared_nodes: {}, tour: { stages: [], stops: [] }, links: {}, assets: { photos: {} } };

  var byId = {};
  D.species.forEach(function (e) { byId[e.id] = e; });
  var webById = {};
  D.webs.forEach(function (w) { webById[w.id] = w; });

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  /* First sentence of a sourced field, cut at the source's own sentence end (never rewritten). */
  function firstSentence(t) {
    t = t || '';
    var m = /[.!?][”"’)]?\s+(?=[A-Z“"])/.exec(t);
    return m ? t.slice(0, m.index + m[0].trimEnd().length) : t;
  }

  var FILTERS = [
    { id: 'all', label: 'All', test: function () { return true; } },
    { id: 'tour', label: 'On the tour', test: function (e) { return !!e.tour_stop; } },
    { id: 'full', label: 'Has a full page', test: function (e) { return e.completeness > 0; } },
    { id: 'c1', label: 'Category 1', test: function (e) { return e.category === 1; } },
    { id: 'c2', label: 'Category 2', test: function (e) { return e.category === 2; } },
    { id: 'pests', label: 'Pests & diseases', test: function (e) { return e.kind !== 'plant'; } }
  ];

  var S = {
    raw: function () { return D; }, /* for the debug page only */

    /* ---------- species ---------- */
    species: function (id) { return byId[id] || null; },
    allSpecies: function () { return D.species; },
    count: function () { return D.species.length; },
    /* Only filters that match something (the public edition has no NYBG list categories). */
    filters: function () {
      return FILTERS.filter(function (f) { return f.id === 'all' || D.species.some(f.test); })
        .map(function (f) { return { id: f.id, label: f.label }; });
    },
    edition: function () { return D.edition || 'public'; },
    search: function (q, filter) {
      var needle = (q || '').trim().toLowerCase();
      var f = FILTERS.filter(function (x) { return x.id === filter; })[0] || FILTERS[0];
      return D.species.filter(function (e) {
        if (!f.test(e)) return false;
        if (!needle) return true;
        var names = [e.scientific_name].concat(e.names || [], e.synonyms || [], e.common_names || [], e.forest_plan ? [e.forest_plan.common_name] : []);
        return names.some(function (n) { return n && n.toLowerCase().indexOf(needle) >= 0; });
      });
    },
    name: function (e) { return cap((e.common_names || [])[0] || (e.forest_plan || {}).common_name || e.scientific_name); },
    family: function (e) { return (e.forest_plan || {}).family || ''; },
    aka: function (e) { return (e.common_names || []).slice(1, 4); },
    status: function (e) { return e.kind === 'plant' ? 'INVASIVE' : e.kind === 'disease' ? 'INVASIVE DISEASE' : 'INVASIVE PEST'; },
    range: function (e) { return (e.info_page || {}).native_range || (e.forest_plan || {}).native_range || ''; },
    badges: function (e) {
      var b = [];
      if (e.category === 1) b.push('NYBG Category 1 · invasive locally');
      if (e.category === 2) b.push('NYBG Category 2 · do not buy');
      if ((e.list_sources || []).some(function (s) { return s.indexOf('NYS 575') >= 0; })) b.push('NY State regulated (Part 575)');
      if ((e.list_sources || []).some(function (s) { return s.indexOf('PRISM') >= 0; })) b.push('LH PRISM priority');
      var fr = (e.forest_plan || {}).first_record;
      if (fr && fr.toLowerCase().indexOf('unknown') !== 0) b.push('First at the Garden: ' + fr);
      return b;
    },
    source: function (e, key) { return (e.provenance || {})[key] || ''; },
    heroPhoto: function (e) {
      var ip = e.info_page || {}, pub = (e.public || {}).photo;
      if (ip.photo && S.photo(ip.photo)) return { src: S.photo(ip.photo), credit: ip.photo_credit || '' };
      if (pub && S.photo(pub.file)) return { src: S.photo(pub.file), credit: pub.credit || '' };
      return null;
    },
    /* A sourced text field: the project's own sources first, then public sources (U.S. government works). */
    summary: function (e) {
      var fp = e.forest_plan || {}, pub = (e.public || {}).summary;
      if (fp.summary) return { text: fp.summary, source: S.source(e, 'forest_plan') };
      return pub ? { text: pub.text, source: pub.source } : null;
    },
    impact: function (e) {
      var ip = e.info_page || {}, pub = (e.public || {}).impact;
      if (ip.impact) return { text: ip.impact, source: S.source(e, 'info_page') + (ip.impact_source ? ', citing ' + ip.impact_source : '') };
      return pub ? { text: pub.text, source: pub.source } : null;
    },
    checklist: function (e) {
      var cs = e.cascade || {}, ck = e.checklist || {};
      var pub = e.public || {}, pc = pub.checklist || {};
      var seasons = (cs.seasons && cs.seasons.length ? cs.seasons : ck.seasons && ck.seasons.length ? ck.seasons : pub.seasons) || [];
      if (cs.id_checklist && cs.id_checklist.length) return { items: cs.id_checklist, source: S.source(e, 'cascade'), seasons: seasons };
      if (ck.items && ck.items.length) return { items: ck.items, source: ck.source || S.source(e, 'checklist'), seasons: seasons };
      return { items: pc.items || [], source: pc.source || '', seasons: seasons };
    },
    seasonNow: function (e, month) {
      var c = S.checklist(e);
      var s = c.seasons.filter(function (x) { return x.months.indexOf(month) >= 0; })[0];
      return s ? { look: s.look, source: s.source || c.source } : null;
    },
    alternatives: function (e) {
      var ip = e.info_page || {}, cs = e.cascade || {};
      if (ip.alternatives && ip.alternatives.length) {
        return { source: S.source(e, 'info_page'), items: ip.alternatives.map(function (a) { return { name: a.name, sci: '', img: a.photo ? S.photo(a.photo) : '' }; }) };
      }
      if (cs.plant_instead && cs.plant_instead.length) {
        return { source: S.source(e, 'cascade'), items: cs.plant_instead.map(function (a) { return { name: a.name, sci: a.sci || '', img: '' }; }) };
      }
      var pn = (e.public || {}).natives;
      if (pn && pn.text) return { source: pn.source, items: [], text: pn.text };
      return { source: '', items: [] };
    },
    inat: function (e) {
      var t = ((D.links || {}).inaturalist || {}).species_url_template || '';
      var cs = e.cascade || {};
      return {
        url: t.replace('{scientific_name}', encodeURIComponent(e.scientific_name)),
        placeId: ((D.links || {}).inaturalist || {}).place_id,
        staticText: cs.inat_count ? cs.inat_count + ' records inside the Garden (as of ' + cs.inat_as_of + ')' : 'Sightings inside the Garden'
      };
    },
    provenance: function (e) {
      var p = e.provenance || {};
      var rows = [];
      if (e.category != null) rows.push({ label: p.category || 'NYBG invasive species list 2026', fallback: '', on: true }); // staff edition only
      rows = rows.concat([
        { label: p.forest_plan, fallback: 'Forest Plan 2016, Appendix 3', on: !!e.forest_plan },
        { label: p.info_page, fallback: 'ENV 221 info page', on: !!e.info_page },
        { label: p.cascade, fallback: 'Cascade page', on: !!e.cascade }
      ]);
      if (e.checklist) rows.push({ label: p.checklist || 'Spot-it checklist', fallback: '', on: true });
      (p.public || []).forEach(function (c) { rows.push({ label: c, fallback: '', on: true }); });
      rows.push({ label: 'Forest layers web (generated by make_webs.py)', fallback: 'Forest layers web (tour species only)', on: !!webById[e.id] });
      return rows.map(function (r) { return { on: r.on, label: r.on ? (r.label || r.fallback) : 'Not yet: ' + r.fallback }; });
    },
    hasPageText: function (e) {
      var fp = e.forest_plan || {}, cs = e.cascade || {};
      return !!(S.summary(e) || S.impact(e) || (cs.body && cs.body.length) || fp.threat || cs.nybg || fp.control);
    },
    teaser: function (e) {
      var fp = (e && e.forest_plan) || {}, im = e ? S.impact(e) : null;
      if (im) return { text: firstSentence(im.text), source: im.source };
      if (fp.threat) return { text: firstSentence(fp.threat), source: S.source(e, 'forest_plan') };
      if (fp.summary) return { text: firstSentence(fp.summary), source: S.source(e, 'forest_plan') };
      return null;
    },
    firstSentence: firstSentence,

    /* ---------- tour ---------- */
    stages: function () { return D.tour.stages || []; },
    stage: function (n) { return (D.tour.stages || []).filter(function (g) { return g.n === n; })[0] || { n: n, name: '' }; },
    stops: function () { return D.tour.stops || []; },
    stop: function (n) { return (D.tour.stops || []).filter(function (s) { return s.n === Number(n); })[0] || null; },
    stopForSpecies: function (id) { return (D.tour.stops || []).filter(function (s) { return s.species === id; })[0] || null; },
    speciesStops: function () { return (D.tour.stops || []).filter(function (s) { return !!s.species; }); },
    stopName: function (s) {
      if (s.species && byId[s.species]) return S.name(byId[s.species]);
      return s.kind === 'intro' ? 'Welcome: garden escapes' : s.kind === 'hub' ? 'Take it home' : s.place;
    },
    /* Map position as % of garden-map.svg (viewBox 40 95 440 560). */
    mapPos: function (s) { return { left: (s.x - 40) / 440 * 100, top: (s.y - 95) / 560 * 100 }; },
    routePath: function () {
      return (D.tour.stops || []).map(function (s, i) {
        if (i === 0) return 'M' + s.x + ' ' + s.y;
        return s.route_in ? s.route_in : 'L' + s.x + ' ' + s.y;
      }).join(' ');
    },
    /* "Look for it this month": the first tour species (in tour order) with seasonal notes for this month. */
    monthPick: function (month) {
      var order = S.speciesStops().map(function (s) { return byId[s.species]; }).filter(Boolean)
        .concat(D.species.filter(function (e) { return !e.tour_stop; }));
      for (var i = 0; i < order.length; i++) {
        var now = S.seasonNow(order[i], month);
        if (now) return { species: order[i], stop: S.stopForSpecies(order[i].id), look: now.look, source: now.source };
      }
      return null;
    },
    swapCredit: function (name) { var pub = (D.swap_photos || {})[name]; return pub ? pub.credit : ''; },
    /* Photo for a native-swap name: a public-source photo listed for that name, else the info page
       whose species or alternative carries that name. */
    swapPhoto: function (name) {
      var pub = (D.swap_photos || {})[name];
      if (pub && S.photo(pub.file)) return S.photo(pub.file);
      var n = name.toLowerCase(), words = n.split(/\s+/);
      for (var i = 0; i < D.species.length; i++) {
        var e = D.species[i], ip = e.info_page;
        if (!ip) continue;
        if (ip.photo && (e.common_names || []).some(function (c) {
          var cw = c.toLowerCase().split(/\s+/);
          return words.every(function (w) { return cw.indexOf(w) >= 0; });
        })) return S.photo(ip.photo);
        var alt = (ip.alternatives || []).filter(function (a) { return a.name.toLowerCase() === n; })[0];
        if (alt && alt.photo) return S.photo(alt.photo);
      }
      return '';
    },

    /* ---------- forest-layer webs ---------- */
    webs: function () { return D.webs; },
    web: function (id) { return webById[id] || null; },
    /* For each node of a web: where it links out to. */
    webLinks: function (id) {
      var w = webById[id];
      var out = {};
      if (!w) return out;
      w.nodes.forEach(function (n) {
        var page = n.species && byId[n.species] ? n.species : '';
        var ownWeb = n.species && n.species !== w.id && webById[n.species] ? n.species : '';
        var also = n.shared ? uniq((D.shared_nodes[n.shared] || []).filter(function (x) { return x !== w.id && webById[x]; })) : [];
        out[n.id] = { page: page, ownWeb: ownWeb, also: also, linksOut: !!(ownWeb || also.length || (page && page !== w.id)) };
      });
      return out;
    },

    /* ---------- assets and links ---------- */
    photo: function (file) { return (D.assets.photos || {})[file] || ''; },
    mapSrc: function () { return D.assets.map; },
    layersBg: function () { return D.assets.layers_bg; },
    links: function () { return D.links || {}; }
  };

  NYBG.store = S;
})();
