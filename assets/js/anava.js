/* ANAVA FILMS — Redesign interactions */
(function () {
  'use strict';

  /* ---------- Header ---------- */
  var header = document.querySelector('.site-header');
  var lastPeekY = 0;
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    // Past the first screenful the capsule folds to the wordmark (CSS, 761px+)
    header.classList.toggle('is-compact', window.scrollY > 120);
    // A tap-opened header closes again once the reader scrolls on
    if (header.classList.contains('is-peek') && Math.abs(window.scrollY - lastPeekY) > 60) {
      header.classList.remove('is-peek');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Touch screens have no hover: the first tap on the folded pill opens it
     (instead of following the wordmark link home), a tap elsewhere folds it. */
  if (header && window.matchMedia) {
    var noHover = window.matchMedia('(hover: none)');
    var wide = window.matchMedia('(min-width: 761px)');
    header.addEventListener('click', function (e) {
      if (!noHover.matches || !wide.matches) return;
      if (header.classList.contains('is-compact') && !header.classList.contains('is-peek')) {
        e.preventDefault();
        header.classList.add('is-peek');
        lastPeekY = window.scrollY;
      }
    }, true);
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) header.classList.remove('is-peek');
    });
  }

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

  /* ---------- Poster hydration ---------- */
  function hydrate(v) {
    if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster;
  }
  document.querySelectorAll('video[data-poster]').forEach(hydrate);

  /* Video playback is on card click only (via lightbox) — no auto-play on hover or scroll */
  document.querySelectorAll('video').forEach(function (v) {
    var card = v.closest('.wcard, .sel, .svc, .lcard, .tst, .reel');
    if (!card) return;
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
  });

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

  /* ---------- Home hero parallax ----------
     The still drifts down at a fifth of the scroll speed, so it falls
     behind the headline as the page moves. It stops updating once the hero
     has scrolled out of view. */
  var para = document.querySelector('img[data-parallax]');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (para && !calm) {
    var paraHost = para.closest('.hero-cine') || para.parentElement;
    var paraTick = false;
    var paraMove = function () {
      paraTick = false;
      var y = Math.min(window.scrollY, paraHost.offsetHeight);
      para.style.transform = 'translate3d(0,' + (y * 0.2).toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!paraTick) { paraTick = true; requestAnimationFrame(paraMove); }
    }, { passive: true });
    paraMove();
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
    // Batch size per tab, each a whole number of rows for that tab's grid
    // (see .work-grid[data-view] in anava.css): TVCs and BTS run four across
    // on a desktop and two on a tablet, Vertical three across, Photoshoots
    // four across. The film tabs open short on purpose — the reader chooses
    // to go deeper rather than being handed everything at once.
    var PAGE = { tvc: 8, bts: 8, vertical: 12, photoshoots: 12 };
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
      grid.dataset.view = state.filter;
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

  /* ---------- Contact form (AJAX with mailto fallback) ---------- */
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (form) {
    function openMailto(d) {
      var body =
        'Name / Brand: ' + (d.get('name') || '') + '\n' +
        'Email: ' + (d.get('email') || '') + '\n' +
        'Company / Brand: ' + (d.get('company') || '') + '\n' +
        'Project Type: ' + (d.get('type') || '') + '\n\n' +
        'The Thought:\n' + (d.get('message') || '');
      window.location.href =
        'mailto:office@anavafilms.com?subject=' +
        encodeURIComponent('New Thought from ' + (d.get('name') || 'Website')) +
        '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var actionUrl = form.getAttribute('action');

      if (!actionUrl || actionUrl.startsWith('mailto:')) {
        openMailto(d);
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      var originalText = button ? button.innerHTML : '';
      if (button) {
        button.disabled = true;
        button.innerHTML = 'Sending...';
      }

      fetch(actionUrl, {
        method: 'POST',
        body: d,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          if (feedback) {
            feedback.hidden = false;
            feedback.style.color = '#34d399';
            feedback.textContent = 'Thank you! Your message has been sent. We’ll be in touch shortly.';
          } else {
            alert('Thank you! Your message has been sent. We’ll be in touch shortly.');
          }
        } else {
          throw new Error('Submission returned error');
        }
      }).catch(function () {
        // Fallback to mailto if fetch encounters issue or network error
        if (feedback) {
          feedback.hidden = false;
          feedback.style.color = '#f59e0b';
          feedback.textContent = 'Opening your email client to send message...';
        }
        openMailto(d);
      }).finally(function () {
        if (button) {
          button.disabled = false;
          button.innerHTML = originalText;
        }
      });
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
