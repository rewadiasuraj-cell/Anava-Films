/* ANAVA FILMS — Redesign interactions */
(function () {
  'use strict';

  /* ---------- Responsive welcome film: once per tab session ---------- */
  var intro = document.getElementById('site-intro');
  if (intro && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var seenIntro = false;
    try { seenIntro = sessionStorage.getItem('anava_redesign_intro_seen') === 'true'; } catch (e) {}
    if (!seenIntro && typeof intro.showModal === 'function') {
      var introVideo = document.getElementById('site-intro-video');
      var oldOverflow = document.body.style.overflow;
      var introDone = false;
      var introStartupTimer;
      var introStallTimer;
      var introMaxTimer;
      function finishIntro() {
        if (introDone) return;
        introDone = true;
        clearTimeout(introStartupTimer);
        clearTimeout(introStallTimer);
        clearTimeout(introMaxTimer);
        introVideo.pause();
        intro.close();
        document.body.style.overflow = oldOverflow;
        try { sessionStorage.setItem('anava_redesign_intro_seen', 'true'); } catch (e) {}
      }
      intro.querySelector('.intro-skip').addEventListener('click', finishIntro);
      intro.addEventListener('cancel', function (e) { e.preventDefault(); finishIntro(); });
      introVideo.addEventListener('ended', finishIntro);
      introVideo.addEventListener('error', finishIntro);
      introVideo.addEventListener('playing', function () {
        clearTimeout(introStartupTimer);
        clearTimeout(introStallTimer);
      });
      introVideo.addEventListener('waiting', function () {
        clearTimeout(introStallTimer);
        introStallTimer = setTimeout(finishIntro, 5000);
      });
      introVideo.src = window.matchMedia('(max-width: 760px)').matches
        ? 'intro/intro-3-vertical.mp4?v=20260923'
        : 'intro/intro-3.mp4?v=20260923';
      introVideo.muted = true;
      intro.showModal();
      document.body.style.overflow = 'hidden';
      introStartupTimer = setTimeout(finishIntro, 5000);
      introMaxTimer = setTimeout(finishIntro, 30000);
      introVideo.play().catch(finishIntro);
    }
  }

  /* ---------- Header ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('mobile-open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('mobile-open');
        burger.classList.remove('open');
      }
    });
  }

  /* ---------- Poster hydration + hover play ---------- */
  function hydrate(v) {
    if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster;
  }
  document.querySelectorAll('video[data-poster]').forEach(hydrate);

  document.querySelectorAll('.hover-play').forEach(function (el) {
    var v = el.tagName === 'VIDEO' ? el : el.querySelector('video');
    if (!v) return;
    var card = v.closest('.wcard, .sel, .svc, .lcard, .tst, .reel') || el;

    // Colour only while the clip is actually running — keeps the black & white
    // thumbnail treatment working on touch, where there is no hover.
    v.addEventListener('play', function () {
      v.classList.add('playing');
      card.classList.add('is-playing');
    });
    ['pause', 'ended'].forEach(function (evt) {
      v.addEventListener(evt, function () {
        v.classList.remove('playing');
        card.classList.remove('is-playing');
      });
    });
    card.addEventListener('mouseenter', function () {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.play().catch(function () {});
    });
    card.addEventListener('mouseleave', function () {
      v.pause();
      try { v.currentTime = 0; } catch (e) {}
    });
  });

  /* ---------- Dwell autoplay ----------
     The poster is designed key art worth looking at, so a card that stays in
     view holds its thumbnail for a beat before the clip takes over. Hovering
     still starts it immediately via .hover-play above. */
  var DWELL_MS = 5000;
  if ('IntersectionObserver' in window) {
    var dwellTimers = new WeakMap();
    var dObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (dwellTimers.has(v)) return;
          dwellTimers.set(v, setTimeout(function () {
            // preload="none" means the src alone buffers nothing, so ask for
            // the data and start as soon as there is enough of it.
            if (!v.src && v.dataset.src) v.src = v.dataset.src;
            v.preload = 'auto';
            var start = function () { v.play().catch(function () {}); };
            if (v.readyState >= 2) {
              start();
            } else {
              v.addEventListener('canplay', start, { once: true });
              v.load();
            }
          }, DWELL_MS));
        } else {
          clearTimeout(dwellTimers.get(v));
          dwellTimers.delete(v);
          v.pause();
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('video.dwell-play').forEach(function (v) { dObs.observe(v); });
  }

  /* ---------- Lazy video sources (work grid) ---------- */
  if ('IntersectionObserver' in window) {
    var vObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var v = en.target;
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        vObs.unobserve(v);
      });
    }, { rootMargin: '300px' });
    document.querySelectorAll('video[data-src]').forEach(function (v) { vObs.observe(v); });
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rObs.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
    document.querySelectorAll('.reveal').forEach(function (el) { rObs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbBody = document.getElementById('lightbox-body');
  var lbCap = document.getElementById('lightbox-cap');

  function openLightbox(src, caption, isImage) {
    if (!lb) return;
    lbBody.innerHTML = '';
    var node;
    if (isImage) {
      node = document.createElement('img');
      node.src = src;
      node.alt = caption || '';
    } else {
      node = document.createElement('video');
      node.src = src;
      node.controls = true;
      node.autoplay = true;
      node.playsInline = true;
    }
    lbBody.appendChild(node);
    if (lbCap) lbCap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    lbBody.innerHTML = '';
    document.body.style.overflow = '';
  }
  window.anavaOpenLightbox = openLightbox;

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      e.preventDefault();
      openLightbox(
        trigger.getAttribute('data-lightbox'),
        trigger.getAttribute('data-caption') || '',
        trigger.getAttribute('data-lightbox-type') === 'image'
      );
      return;
    }
    if (e.target.closest('.lightbox-close') || e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- Work filters ---------- */
  var grid = document.getElementById('work-grid');
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.wcard'));
    var pills = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var loadMoreBtn = document.getElementById('load-more');
    var empty = document.getElementById('work-empty');
    // Batch size per tab, every one a multiple of the three-column grid so the
    // last visible row is never half empty. The film tabs open short on
    // purpose — the reader chooses to go deeper rather than being handed
    // everything at once.
    var PAGE = { tvc: 6, vertical: 12, photoshoots: 9 };
    function pageSize(filter) { return PAGE[filter] || 15; }
    // Start on whichever pill ships marked active rather than a hard-coded value
    var firstPill = document.querySelector('.pill.active[data-filter]');
    var startFilter = firstPill ? firstPill.dataset.filter : 'all';
    var state = {
      filter: startFilter,
      sub: firstPill ? (firstPill.dataset.sub || '') : '',
      q: '',
      shown: pageSize(startFilter)
    };

    function matches(card) {
      var cat = card.dataset.category || '';
      var subs = card.dataset.sub || '';
      var text = (card.dataset.search || '').toLowerCase();
      if (state.filter !== 'all' && cat !== state.filter) return false;
      if (state.sub && subs.split(',').indexOf(state.sub) === -1) return false;
      if (state.q && text.indexOf(state.q) === -1) return false;
      return true;
    }

    function render() {
      var count = 0;
      cards.forEach(function (c) {
        if (matches(c)) {
          count++;
          c.classList.toggle('is-hidden', count > state.shown);
        } else {
          c.classList.add('is-hidden');
        }
      });
      if (empty) empty.style.display = count === 0 ? 'block' : 'none';
      if (loadMoreBtn) loadMoreBtn.parentElement.style.display = count > state.shown ? 'flex' : 'none';
    }

    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        var f = p.dataset.filter;
        var sub = p.dataset.sub || '';
        state.filter = f;
        state.sub = sub;
        state.shown = pageSize(f);
        document.querySelectorAll('.pill').forEach(function (x) { x.classList.remove('active'); });
        document.querySelectorAll('.drop-menu button').forEach(function (x) { x.classList.remove('active'); });
        if (p.classList.contains('pill')) {
          p.classList.add('active');
        } else {
          p.classList.add('active');
          var host = p.closest('.pill-drop');
          if (host) { host.querySelector('.pill').classList.add('active'); host.classList.remove('open'); }
        }
        render();
      });
    });

    document.querySelectorAll('.pill-drop > .pill').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var host = btn.closest('.pill-drop');
        var wasOpen = host.classList.contains('open');
        document.querySelectorAll('.pill-drop').forEach(function (d) { d.classList.remove('open'); });
        host.classList.toggle('open', !wasOpen);
      });
    });
    document.addEventListener('click', function () {
      document.querySelectorAll('.pill-drop').forEach(function (d) { d.classList.remove('open'); });
    });

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        state.shown += pageSize(state.filter);
        render();
      });
    }
    render();
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var button = form.querySelector('button[type="submit"]');
      var feedback = document.getElementById('form-feedback');
      if (button.disabled) return;
      button.disabled = true;
      feedback.hidden = false;
      feedback.textContent = 'Sending your thought…';
      try {
        var response = await fetch('https://formsubmit.co/ajax/office@anavafilms.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: 'New Production Inquiry: ' + d.get('name'),
            _template: 'table', _captcha: 'false',
            name: d.get('name'), email: d.get('email'),
            company: d.get('company'), type: d.get('type'), message: d.get('message')
          })
        });
        var result = await response.json();
        if (!response.ok || !(result.success === true || result.success === 'true')) {
          throw new Error('Submission was not confirmed');
        }
        form.reset();
        feedback.textContent = 'Thought received! We’ll get back to you soon.';
      } catch (error) {
        feedback.textContent = 'We couldn’t confirm delivery. Please try again or email office@anavafilms.com. Your message is still here.';
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- CTA ripple ----------
     The metal sheen is pure CSS; only the ripple needs to know where the
     pointer landed, so this is the one line of script the buttons use. */
  document.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.btn-primary, .btn-light, .hero-actions .play-btn');
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var dot = document.createElement('span');
    dot.className = 'btn-ripple';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top) + 'px';
    btn.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 620);
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
