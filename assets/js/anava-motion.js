/* ==========================================================================
   ANAVA FILMS — premium motion layer (GSAP + ScrollTrigger + Lenis)
   Sits on top of anava.js without touching what it animates:
   1. Lenis inertia scroll (mouse / trackpad only; touch keeps native momentum)
   2. gold scroll-progress line
   3. gold cursor with a "Play" state over films (fine pointers only)
   4. magnetic buttons (fine pointers only)
   5. spring press feedback for taps and clicks (every device)
   6. photo parallax inside their frames
   Transforms go through the individual `translate` / `scale` properties or
   CSS variables, never `transform`, so hover zooms and the site's own
   motion keep working underneath.
   ========================================================================== */
(function () {
  'use strict';
  var gsap = window.gsap;
  if (!gsap) return;
  var ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);

  var html = document.documentElement;
  var mm = window.matchMedia;
  var calm = mm('(prefers-reduced-motion: reduce)').matches;
  var fine = mm('(hover: hover) and (pointer: fine)').matches;
  var EASE = 'expo.out';

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- 1. Lenis inertia scroll ---------- */
  var lenis = null;
  if (window.Lenis && fine && !calm) {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
      prevent: function (node) {
        return !!(node && node.closest && node.closest('.lightbox, .case, .nav.mobile-open, [data-lenis-prevent]'));
      }
    });
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    // Any scroll lock (intro, lightbox, case study, menu) pauses it
    var syncLock = function () {
      var locked = html.classList.contains('intro-on') ||
        document.body.style.overflow === 'hidden' || html.style.overflow === 'hidden';
      if (locked) lenis.stop(); else lenis.start();
    };
    var mo = new MutationObserver(syncLock);
    mo.observe(html, { attributes: true, attributeFilter: ['class', 'style'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    syncLock();
    // In-page anchors glide with the same curve
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -90 });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ---------- 2. scroll-progress line ---------- */
  var bar = document.createElement('div');
  bar.className = 'mo-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  if (ST) {
    ST.create({
      start: 0, end: 'max',
      onUpdate: function (self) { bar.style.setProperty('--p', self.progress.toFixed(4)); }
    });
  }

  /* ---------- 3. gold cursor ---------- */
  var FILM = '[data-lightbox], .wcard, .ww-item';
  var HOT = 'a, button, [role="button"], label, summary, select, .pill';
  if (fine && !calm) {
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'mo-dot'; ring.className = 'mo-ring';
    ring.innerHTML = '<span class="mo-label">Play</span>';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    html.classList.add('has-cursor');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
    var shown = false, lastT = null, lastS = -1;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); html.classList.add('cursor-on'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      if (e.target === lastT) return;
      lastT = e.target;
      var film = !!(lastT.closest && lastT.closest(FILM));
      var hot = !film && !!(lastT.closest && lastT.closest(HOT));
      var state = film ? 2 : hot ? 1 : 0;
      if (state === lastS) return;
      lastS = state;
      ring.classList.toggle('is-film', film);
      ring.classList.toggle('is-hot', hot);
      dot.classList.toggle('is-hidden', film);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { html.classList.remove('cursor-on'); shown = false; });
    window.addEventListener('pointerdown', function () { ring.classList.add('is-down'); }, { passive: true });
    window.addEventListener('pointerup', function () { ring.classList.remove('is-down'); }, { passive: true });
  }

  /* ---------- 4. magnetic buttons ---------- */
  if (fine && !calm) {
    $$('.btn, .btn-talk, .play-btn, .circ-arrow, .ww-view, .ww-nav button').forEach(function (el) {
      var pull = el.classList.contains('btn-talk') ? 0.18 : 0.28;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * pull;
        var y = (e.clientY - (r.top + r.height / 2)) * pull;
        gsap.to(el, { '--mx': x + 'px', '--my': y + 'px', duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { '--mx': '0px', '--my': '0px', duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      });
      el.classList.add('mo-magnet');
    });
  }

  /* ---------- 5. spring press (touch and click) ---------- */
  if (!calm) {
    var PRESS = '.btn, .btn-talk, .play-btn, .circ-arrow, .pill, .wcard, .ww-item, .ww-thumb, .reel, .wh-film, .pb-person, .svc, .burger, .intro-sound, .intro-play, .ct-submit, button[type="submit"]';
    var pressed = null;
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest(PRESS);
      if (!el) return;
      pressed = el;
      var big = el.offsetWidth > 260;
      el.classList.add('mo-press');
      gsap.fromTo(el, { '--press': 1 }, { '--press': big ? 0.985 : 0.94, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
    var release = function () {
      if (!pressed) return;
      var el = pressed;
      pressed = null;
      gsap.to(el, {
        '--press': 1, duration: 0.7, ease: 'elastic.out(1.1, 0.45)', overwrite: 'auto',
        onComplete: function () { el.classList.remove('mo-press'); el.style.removeProperty('--press'); }
      });
    };
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);
  }

  /* ---------- 6. photo parallax ---------- */
  if (ST && !calm) {
    $$('.pb-portrait img, .person-img img, .svc-media img, .ct-hero-media img').forEach(function (img) {
      var frame = img.parentElement;
      img.classList.add('mo-par');
      gsap.fromTo(img, { '--py': '-5%' }, {
        '--py': '5%', ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
    // Late layout shifts (fonts, images, the intro leaving) re-measure once
    window.addEventListener('load', function () { ST.refresh(); });
    new MutationObserver(function () {
      if (!html.classList.contains('intro-on')) ST.refresh();
    }).observe(html, { attributes: true, attributeFilter: ['class'] });
  }

})();
