/* ANAVA FILMS — Redesign interactions */
(function () {
  'use strict';

  /* ---------- Home intro (clapperboard ident) ----------
     The overlay and the once-per-session check live inline in index.html;
     here it plays the cut that suits the screen and then fades away. */
  var intro = document.getElementById('intro');
  if (intro) {
    var iv = intro.querySelector('video');
    var ended = false;
    var endIntro = function () {
      if (ended) return;
      ended = true;
      try { sessionStorage.setItem('anavaIntro', '1'); } catch (e) {}
      intro.classList.add('is-done');
      document.documentElement.classList.remove('intro-on');
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1000);
    };
    var tall = window.innerHeight > window.innerWidth;
    iv.src = tall ? iv.dataset.port : iv.dataset.land;
    // Start the fade just before the last frame, so the logo dissolves into the site
    iv.addEventListener('timeupdate', function () {
      if (iv.duration && iv.duration - iv.currentTime < 0.6) endIntro();
    });
    iv.addEventListener('ended', endIntro);
    iv.addEventListener('error', endIntro);
    intro.querySelector('.intro-skip').addEventListener('click', endIntro);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') endIntro(); });
    var pr = iv.play();
    if (pr && pr.catch) pr.catch(endIntro);
    // Never hold the site hostage: a slow network or a blocked autoplay lets go
    setTimeout(function () { if (!ended && iv.currentTime < 0.2) endIntro(); }, 3500);
    setTimeout(endIntro, 11000);
  }

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

  /* ---------- Work cards: colour reveal on touch ----------
     The grade only ever comes in at the reader's hand — hover with a mouse,
     a touch on a phone or tablet, never on its own while scrolling. The
     touched card keeps its colour (CSS: .wcard.is-color) until another one
     is touched. */
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    var card = e.target.closest('.wcard:not(.photo)');
    if (!card) return;
    document.querySelectorAll('.wcard.is-color').forEach(function (c) {
      if (c !== card) c.classList.remove('is-color');
    });
    card.classList.add('is-color');
  }, { passive: true });

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

  /* ---------- Home: draw the orange ring when its section scrolls in ---------- */
  var arc = document.querySelector('.stays-arc');
  if (arc && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    arc.classList.add('arc-armed');
    var aObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          // next frame, so the armed (hidden) state has painted first
          requestAnimationFrame(function () { arc.classList.add('is-drawn'); });
          aObs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    aObs.observe(arc.parentNode);
  }

  /* ---------- Home approach steps: tap/click reveals each step's image ---------- */
  document.querySelectorAll('[data-reveal-steps] > li').forEach(function (li) {
    li.addEventListener('click', function () { li.classList.toggle('is-open'); });
  });

  /* ---------- Work hero stage: TVCs in turn, 5s thumbnail then muted play ---------- */
  (function () {
    var stage = document.querySelector('.wh-stage');
    var listEl = document.getElementById('wh-playlist');
    if (!stage || !listEl) return;
    var items; try { items = JSON.parse(listEl.textContent); } catch (e) { return; }
    if (!items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var poster = stage.querySelector('.wh-poster'), video = stage.querySelector('.wh-video');
    var tag = stage.querySelector('.wh-film-tag'), num = tag.querySelector('b'), name = tag.querySelector('.wh-film-name');
    var bar = stage.querySelector('.wh-progress i');
    var i = 0, timer = null, visible = false, phase = 'hold';
    var HOLD = 5000;

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function setItem(it, n) {
      stage.setAttribute('data-lightbox', it.v);
      stage.setAttribute('data-caption', it.cap);
      stage.setAttribute('data-case', JSON.stringify(it.case));
      num.textContent = pad(n + 1);
      name.textContent = it.t;
    }
    function resetBar() {
      stage.classList.remove('is-counting');
      bar.style.transition = 'none'; bar.style.transform = '';
      void bar.offsetWidth; bar.style.transition = '';
    }
    function hold() {
      phase = 'hold'; clearTimeout(timer); resetBar();
      if (!visible) return;
      stage.classList.add('is-counting');
      timer = setTimeout(play, HOLD);
    }
    function play() {
      phase = 'play'; stage.classList.remove('is-counting');
      var it = items[i];
      if (video.getAttribute('data-src') !== it.v) {
        video.setAttribute('data-src', it.v); video.src = it.v;
      }
      video.muted = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () { if (phase === 'play') next(); });
    }
    function next() {
      if (phase === 'next') return;
      phase = 'next'; clearTimeout(timer);
      i = (i + 1) % items.length;
      var it = items[i];
      // swap the thumbnail underneath, then dissolve the film away onto it
      var img = new Image();
      img.onload = img.onerror = function () {
        poster.classList.add('is-swapping'); tag.classList.add('is-swapping');
        setTimeout(function () {
          poster.src = it.p; setItem(it, i);
          stage.classList.remove('is-playing');
          poster.classList.remove('is-swapping'); tag.classList.remove('is-swapping');
          try { video.pause(); } catch (e) {}
          hold();
        }, stage.classList.contains('is-playing') ? 0 : 450);
      };
      img.src = it.p;
    }
    video.addEventListener('playing', function () { stage.classList.add('is-playing'); });
    video.addEventListener('timeupdate', function () {
      if (video.duration) bar.style.transform = 'scaleX(' + (video.currentTime / video.duration) + ')';
    });
    video.addEventListener('ended', next);
    video.addEventListener('error', function () { if (phase === 'play') next(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (!visible) { clearTimeout(timer); resetBar(); if (phase === 'play') video.pause(); }
        else if (phase === 'play') { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else hold();
      }, { threshold: 0.35 }).observe(stage);
    } else { visible = true; hold(); }
  })();

  /* ---------- Work hero: sliding tab ink + background parallax ---------- */
  (function () {
    var hero = document.querySelector('.work-hero');
    if (!hero) return;
    var bar = hero.querySelector('.filter-bar'), ink = hero.querySelector('.pill-ink');
    function moveInk() {
      if (!bar || !ink) return;
      var a = bar.querySelector('.pill.active');
      if (!a) { ink.classList.remove('is-on'); return; }
      var b = bar.getBoundingClientRect(), r = a.getBoundingClientRect();
      ink.style.width = r.width + 'px';
      ink.style.transform = 'translate3d(' + (r.left - b.left) + 'px,' + (r.bottom - b.bottom) + 'px,0)';
      ink.classList.add('is-on');
    }
    if (bar) {
      bar.addEventListener('click', function () { setTimeout(moveInk, 0); });
      window.addEventListener('resize', moveInk);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);
      moveInk();
    }
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var raf = 0;
      hero.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = hero.getBoundingClientRect();
          hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
      });
      hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0);
      });
    }
  })();

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
  function fmtTime(t) {
    t = Math.max(0, Math.round(t || 0));
    return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  /* A Work film opens as its case study: format and title, Client / Format /
     Anava's role, the film with a running-time countdown, then the Thought,
     Idea and Making — the earlier anavafilms.com project page. Built with
     textContent only, so nothing in the data is parsed as markup. */
  function openCase(src, data) {
    if (!lb) return;
    lbBody.innerHTML = '';
    var wrap = el('article', 'case');
    if (data.format) wrap.appendChild(el('span', 'case-eyebrow', data.format));
    wrap.appendChild(el('h2', 'case-title', data.title || ''));

    var meta = el('dl', 'case-meta');
    function row(label, value, cls) {
      var d = el('div', cls || '');
      d.appendChild(el('dt', '', label));
      var dd = el('dd');
      if (Array.isArray(value)) value.forEach(function (r) { dd.appendChild(el('span', 'case-role', r)); });
      else dd.textContent = value;
      d.appendChild(dd);
      meta.appendChild(d);
    }
    if (data.client) row('Client', data.client);
    if (data.format) row('Format', data.format);
    if (data.duration) row('Running time', fmtTime(data.duration));
    if (data.roles && data.roles.length) row('Anava\u2019s role', data.roles, 'case-roles');
    if (meta.children.length) wrap.appendChild(meta);

    var film = el('div', 'case-film');
    var v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
    var count = el('span', 'case-count', data.duration ? fmtTime(data.duration) : '');
    count.setAttribute('aria-hidden', 'true');
    function tick() {
      var total = isFinite(v.duration) ? v.duration : (data.duration || 0);
      count.textContent = fmtTime(total - v.currentTime);
    }
    v.addEventListener('loadedmetadata', tick);
    v.addEventListener('timeupdate', tick);
    v.addEventListener('play', function () { count.classList.add('is-running'); });
    v.addEventListener('pause', function () { count.classList.remove('is-running'); });
    v.addEventListener('ended', function () { count.classList.remove('is-running'); });
    film.appendChild(v);
    film.appendChild(count);
    wrap.appendChild(film);

    if (data.shortDesc) wrap.appendChild(el('p', 'case-desc', data.shortDesc));
    var notes = el('div', 'case-notes');
    [['The thought', data.thought], ['The idea', data.idea], ['The making', data.making]]
      .forEach(function (n) {
        if (!n[1]) return;
        var b = el('div');
        b.appendChild(el('h4', '', n[0]));
        b.appendChild(el('p', '', n[1]));
        notes.appendChild(b);
      });
    if (notes.children.length) wrap.appendChild(notes);

    lbBody.appendChild(wrap);
    if (lbCap) lbCap.textContent = '';
    lb.classList.add('open', 'is-case');
    lb.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open', 'is-case');
    lbBody.innerHTML = '';
    document.body.style.overflow = '';
  }
  window.anavaOpenLightbox = openLightbox;

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      e.preventDefault();
      var caseData = trigger.getAttribute('data-case');
      if (caseData) {
        try { openCase(trigger.getAttribute('data-lightbox'), JSON.parse(caseData)); return; }
        catch (err) { /* malformed data: fall back to the plain player */ }
      }
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
    // on a desktop and two on a tablet; Vertical 5 / 3 / 2 and Photoshoots
    // 4 / 4 / 2 (desktop / tablet / phone). render() rounds each batch up to
    // whole rows. The film tabs open short on purpose — the reader chooses
    // to go deeper rather than being handed everything at once.
    var PAGE = { tvc: 8, bts: 8, vertical: 12, photoshoots: 12 };
    function pageSize(filter) { return PAGE[filter] || 15; }
    // Columns the grid is laying out right now (they change per tab and per
    // device, see .work-grid[data-view]); batches round up to whole rows.
    function columns() {
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      return Math.max(1, cols);
    }
    // Start on whichever pill ships marked active rather than a hard-coded value
    var firstPill = document.querySelector('.pill.active[data-filter]');
    var startFilter = firstPill ? firstPill.dataset.filter : 'all';
    var state = {
      filter: startFilter,
      sub: firstPill ? (firstPill.dataset.sub || '') : '',
      q: '',
      pages: 1
    };

    function matches(card) {
      var cat = card.dataset.category || '';
      var subs = card.dataset.sub || '';
      var text = (card.dataset.search || '').toLowerCase();
      if (state.filter !== 'all' && cat !== state.filter) return false;
      // A menu entry can cover several sub-tags ("social|product")
      if (state.sub && !state.sub.split('|').some(function (s) {
        return subs.split(',').indexOf(s) !== -1;
      })) return false;
      if (state.q && text.indexOf(state.q) === -1) return false;
      return true;
    }

    function render() {
      var count = 0;
      grid.dataset.view = state.filter;
      var cols = columns();
      state.shown = Math.ceil(pageSize(state.filter) * state.pages / cols) * cols;
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
        state.pages = 1;
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
        state.pages += 1;
        render();
      });
    }
    render();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 150); });
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
