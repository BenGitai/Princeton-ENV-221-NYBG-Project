/* readAloud: reads out the page, nothing more and nothing less.
   It speaks the textContent of the visible elements marked data-read inside the page's
   [data-read-root], in DOM order, so speech can never drift from what is on screen.
   Only the information is marked: titles, headings, paragraphs, checklist items, quotes, natives,
   swaps. Source lines, photo credits, subtitles, placeholders, links and controls are not marked,
   so they are never read.
   Uses the browser's Web Speech API only: no recordings, no added narration. */
(function () {
  'use strict';
  var NYBG = window.NYBG, h = NYBG.h;
  var synth = window.speechSynthesis || null;
  var supported = !!(synth && window.SpeechSynthesisUtterance);

  /* ---------- the speech controller (one at a time for the whole app) ---------- */
  var session = null; // {owner, parts:[{el,text}], i, paused, utter}
  var listeners = [];
  function emit() { listeners.forEach(function (fn) { fn(session); }); }

  function pickVoice() {
    if (!supported) return null;
    var vs = synth.getVoices() || [];
    var en = vs.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    // Local voices avoid Chrome's cut-off of long utterances on network voices.
    return en.filter(function (v) { return v.localService && /en[-_]US/i.test(v.lang); })[0] ||
      en.filter(function (v) { return v.localService; })[0] || en[0] || null;
  }

  function mark(el) {
    document.querySelectorAll('.is-reading').forEach(function (x) { x.classList.remove('is-reading'); });
    if (!el) return;
    el.classList.add('is-reading');
    try { el.scrollIntoView({ block: 'center', behavior: NYBG.reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
  }

  function speakPart(s) {
    if (session !== s) return;
    if (s.i >= s.parts.length) { finish(s); return; }
    var part = s.parts[s.i];
    if (!part.el.isConnected) { finish(s); return; }
    // Read the element's text as it is now, so a late update (e.g. a live count) is spoken as shown.
    var text = part.el.textContent.replace(/\s+/g, ' ').trim() || part.text;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    var v = pickVoice();
    if (v) u.voice = v;
    u.onend = function () { if (session === s && s.utter === u) { s.i++; speakPart(s); } };
    u.onerror = function (ev) {
      if (session !== s || s.utter !== u) return;
      if (ev && (ev.error === 'not-allowed' || ev.error === 'audio-busy' || ev.error === 'synthesis-unavailable')) { s.blocked = true; finish(s); return; }
      if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) return;
      s.i++; speakPart(s);
    };
    s.utter = u; // keep a reference: some browsers drop events of collected utterances
    mark(part.el);
    emit();
    synth.speak(u);
  }

  function finish(s) {
    if (session !== s) return;
    var blocked = s.blocked;
    session = null;
    mark(null);
    emit();
    if (blocked && s.owner && s.owner.onBlocked) s.owner.onBlocked();
  }

  /* Visible, non-nested data-read elements of a page root, in DOM order. */
  function collect(root, player) {
    var all = Array.prototype.slice.call(root.querySelectorAll('[data-read]'));
    return all.filter(function (el) {
      if (player && player.contains(el)) return false;
      if (el.querySelector('[data-read]')) return false;
      if (el.closest('[hidden]') || el.getClientRects().length === 0) return false;
      var cs = window.getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    }).map(function (el) {
      return { el: el, text: el.textContent.replace(/\s+/g, ' ').trim() };
    }).filter(function (p) { return p.text; });
  }

  NYBG.speech = {
    supported: supported,
    start: function (owner, parts) {
      if (!supported) return;
      NYBG.speech.stop();
      if (!parts.length) return;
      session = { owner: owner, parts: parts, i: 0, paused: false };
      synth.cancel();
      speakPart(session);
    },
    pause: function () {
      if (!session || session.paused) return;
      session.paused = true;
      synth.pause();
      emit();
    },
    resume: function () {
      if (!session || !session.paused) return;
      var s = session;
      s.paused = false;
      synth.resume();
      emit();
      // Some engines (Android Chrome) cannot resume: speak the current part again.
      setTimeout(function () { if (session === s && !s.paused && !synth.speaking) { synth.cancel(); speakPart(s); } }, 300);
    },
    stop: function () {
      if (!session) return;
      session = null;
      try { synth.cancel(); } catch (e) { /* ignore */ }
      mark(null);
      emit();
    },
    session: function () { return session; },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
    collect: collect
  };
  if (supported && synth.addEventListener) synth.addEventListener('voiceschanged', function () { /* voices load lazily */ });
  window.addEventListener('pagehide', function () { NYBG.speech.stop(); });

  /* ---------- the player ---------- */
  NYBG.components.readAloud = function () {
    var IDLE = 'Reads everything on this page, word for word';
    var bar = h('div');
    var status = h('span', { class: 'player-status', 'aria-live': 'polite' }, supported ? IDLE : 'Read-aloud is not supported in this browser');
    var play = h('button', { type: 'button', class: 'player-play', 'aria-label': 'Read this page aloud', disabled: !supported },
      h('span', { class: 'i-play' }, NYBG.glyph('play')),
      h('span', { class: 'i-pause' }, NYBG.icon('pause', 20, { style: 'stroke-width: 2.6' })));
    var stop = h('button', { type: 'button', class: 'player-stop', 'aria-label': 'Stop reading' }, NYBG.glyph('stop', 14));
    var el = h('div', { class: 'player', role: 'group', 'aria-label': 'Read this page aloud' },
      play,
      h('div', { class: 'player-mid' },
        h('span', { class: 'player-title' }, 'Listen to this page'),
        h('div', { class: 'player-bar', 'aria-hidden': 'true' }, bar),
        status),
      stop);

    var me = {
      onBlocked: function () { status.textContent = 'Tap play to listen'; }
    };

    function start() {
      var root = el.closest('[data-read-root]') || document.body;
      NYBG.speech.start(me, collect(root, el));
    }

    play.addEventListener('click', function () {
      var s = NYBG.speech.session();
      if (s && s.owner === me) { if (s.paused) NYBG.speech.resume(); else NYBG.speech.pause(); }
      else start();
    });
    stop.addEventListener('click', function () { NYBG.speech.stop(); play.focus(); });

    var wasConnected = false;
    var unsub = NYBG.speech.subscribe(function (s) {
      if (el.isConnected) wasConnected = true;
      else { if (wasConnected) unsub(); return; }
      var mine = s && s.owner === me;
      el.classList.toggle('is-active', !!mine);
      el.classList.toggle('is-speaking', !!(mine && !s.paused));
      play.setAttribute('aria-label', mine ? (s.paused ? 'Resume reading' : 'Pause reading') : 'Read this page aloud');
      if (mine) {
        status.textContent = s.paused ? 'Paused' : 'Reading part ' + (s.i + 1) + ' of ' + s.parts.length;
        bar.style.width = Math.round((s.i + 1) / s.parts.length * 100) + '%';
      } else {
        if (status.textContent !== 'Tap play to listen') status.textContent = supported ? IDLE : 'Read-aloud is not supported in this browser';
        bar.style.width = '0';
      }
    });

    el.nybgStart = start; // used by "Read each stop aloud when I arrive"
    return el;
  };
})();
