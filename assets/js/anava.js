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

  /* Folded, the bar shrinks into its own Let's Talk circle rather than to
     the page centre: --bar-gap pins the capsule's right edge where the open
     bar ends, so only its width changes (CSS, 761px+). */
  function setFoldX() {
    if (!header) return;
    var cs = getComputedStyle(header);
    var room = header.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var max = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--container')) || room;
    var open = Math.min(max, room);
    header.style.setProperty('--bar-gap', Math.max(0, (room - open) / 2) + 'px');
  }
  setFoldX();
  window.addEventListener('resize', setFoldX);

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

  /* ---------- Home hero: load sequence + scroll drift ----------
     html.hero-go starts the staged soft-blur reveal in CSS (nav, eyebrow,
     headline by line, copy, action, logo strip). It waits for the
     clapperboard ident when that is playing. On scroll the copy lifts a
     little and eases to 0.85 opacity while the plate drifts slower. */
  (function () {
    var hero = document.querySelector('.hero-cine');
    if (!hero) return;
    var root = document.documentElement;
    function go() { root.classList.add('hero-go'); }
    if (root.classList.contains('intro-on')) {
      var mo = new MutationObserver(function () {
        if (!root.classList.contains('intro-on')) { mo.disconnect(); setTimeout(go, 120); }
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else {
      requestAnimationFrame(go);
    }
    if (calm) return;
    var tick = false;
    function drift() {
      tick = false;
      var h = hero.offsetHeight || 1;
      var p = Math.max(0, Math.min(1, window.scrollY / (h * 0.7)));
      hero.style.setProperty('--hp', p.toFixed(3));
    }
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  })();

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

  /* ---------- Home approach: three acts. On wide screens a sticky stage
     (frame, stage word, orange rail) follows whichever act is centred in the
     viewport; the page scrolls normally. Narrow screens stack the acts. ---------- */
  (function () {
    var root = document.querySelector('[data-acts]');
    if (!root || !('IntersectionObserver' in window)) return;
    var acts = root.querySelectorAll('.act');
    var imgs = root.querySelectorAll('.act-img'), words = root.querySelectorAll('.act-word');
    var rail = root.querySelector('.acts-rail i');
    var cur = 0;
    function set(i) {
      if (i === cur) return;
      cur = i;
      [acts, imgs, words].forEach(function (list) {
        for (var k = 0; k < list.length; k++) list[k].classList.toggle('is-on', k === i);
      });
      if (rail) rail.style.transform = 'scaleX(' + ((i + 1) / acts.length) + ')';
    }
    if (rail) rail.style.transform = 'scaleX(' + (1 / acts.length) + ')';
    // the sticky stage rides at the viewport's middle, whatever its height
    var stage = root.querySelector('.acts-stage');
    function centre() {
      if (!stage || !stage.offsetHeight) return;
      var hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 78;
      stage.style.top = Math.max(hh + 16, (window.innerHeight - stage.offsetHeight) / 2 + hh / 3) + 'px';
    }
    centre();
    window.addEventListener('resize', centre);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(+e.target.getAttribute('data-act')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    acts.forEach(function (a) { io.observe(a); });
  })();

  /* ---------- Thinkers Who Make: the set still drifts a few px with the scroll ---------- */
  (function () {
    var band = document.querySelector('.phil2-band');
    if (!band || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var img = band.querySelector('img'), on = false, raf = 0;
    function tick() {
      raf = 0;
      var r = band.getBoundingClientRect(), vh = window.innerHeight;
      var k = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);   // -1..1 across the pass
      img.style.setProperty('--py', (Math.max(-1, Math.min(1, k)) * -14).toFixed(1) + 'px');
    }
    function onScroll() { if (on && !raf) raf = requestAnimationFrame(tick); }
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) onScroll(); }).observe(band);
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

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
    var bar = document.querySelector('.filter-bar'), ink = document.querySelector('.pill-ink');
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
    focusClose();
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
    focusClose();
  }

  // focus moves into the player on open and back to its trigger on close
  var lbReturn = null;
  function focusClose() {
    var x = lb && lb.querySelector('.lightbox-close');
    if (x) setTimeout(function () { x.focus({ preventScroll: true }); }, 30);
  }
  function closeLightbox() {
    if (!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('open', 'is-case');
    lbBody.innerHTML = '';
    document.body.style.overflow = '';
    if (lbReturn && document.contains(lbReturn)) lbReturn.focus({ preventScroll: true });
    lbReturn = null;
  }
  window.anavaOpenLightbox = openLightbox;

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lightbox]');
    if (trigger) {
      e.preventDefault();
      lbReturn = trigger;
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
    var subRow = document.querySelector('.sub-pills');
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
      if (empty) empty.hidden = count !== 0;
      if (loadMoreBtn) loadMoreBtn.parentElement.style.display = count > state.shown ? 'flex' : 'none';
    }

    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        var f = p.dataset.filter;
        var sub = p.dataset.sub || '';
        state.filter = f;
        state.sub = sub;
        state.pages = 1;
        document.querySelectorAll('.pill, .drop-menu button, .sub-pill').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active');
        var host = p.closest('.pill-drop');
        if (host) { host.querySelector('.pill').classList.add('active'); host.classList.remove('open'); }
        // Vertical's type choice lives in the desktop menu and, on phones,
        // in a row under the tabs: keep both, and the tab, in step
        if (f === 'vertical') {
          var vt = document.querySelector('.pill-drop > .pill');
          if (vt) vt.classList.add('active');
          document.querySelectorAll('.drop-menu button, .sub-pill').forEach(function (x) {
            if ((x.dataset.sub || '') === sub) x.classList.add('active');
          });
        }
        if (subRow) subRow.hidden = f !== 'vertical';
        var vtab = document.querySelector('.pill-drop > .pill');
        if (vtab) vtab.setAttribute('aria-expanded', f === 'vertical' ? 'true' : 'false');
        render();
        settle();
      });
    });

    // A switch is quick: the new set fades up a few px in a short stagger
    function settle() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var n = 0;
      cards.forEach(function (c) {
        if (c.classList.contains('is-hidden') || c.offsetParent === null) return;
        c.classList.remove('is-swap');
        void c.offsetWidth;
        c.style.setProperty('--sd', Math.min(n++, 8) * 35 + 'ms');
        c.classList.add('is-swap');
      });
      // deep in a long list, return to the top of the new set
      var list = grid.closest('.work-list');
      var hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 78;
      if (list && list.getBoundingClientRect().top < -40) window.scrollTo(0, list.getBoundingClientRect().top + window.scrollY - hh);
    }

    document.querySelectorAll('.pill-drop > .pill').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        // No floating menu: the tab shows all vertical films and the type
        // row (secondary filters) appears beneath the tabs on every screen
        var all = btn.closest('.pill-drop').querySelector('.drop-menu button');
        if (all) { all.click(); return; }
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

  /* ---------- Contact form (AJAX with mailto fallback) ----------
     Posts to FormSubmit as before. Checks each field locally first and
     explains the problem beside it; keeps everything typed on any failure;
     one request at a time; on a network or service failure it offers the
     same email fallback as a link instead of opening mail unasked. */
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (form) {
    var done = document.getElementById('form-done');
    var button = form.querySelector('button[type="submit"]');
    var label = button && button.querySelector('.ct-submit-label');
    var sending = false;
    var RULES = {
      name: function (v) { return v ? '' : 'Please add your name.'; },
      email: function (v) {
        if (!v) return 'Please add your email so we can reply.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn’t look complete — please check it.';
      },
      phone: function (v) { return !v || /^[+()\d\s-]{7,}$/.test(v) ? '' : 'Please use digits only, e.g. +91 98765 43210.'; },
      message: function (v) { return v ? '' : 'Tell us a little about the project — even one line helps.'; }
    };

    function mailtoHref(d) {
      var body =
        'Name: ' + (d.get('name') || '') + '\n' +
        'Email: ' + (d.get('email') || '') + '\n' +
        'Phone: ' + (d.get('phone') || '') + '\n' +
        'Company / Brand: ' + (d.get('company') || '') + '\n' +
        'Project Type: ' + (d.get('type') || '') + '\n' +
        'Budget: ' + (d.get('budget') || '') + '\n\n' +
        'The Thought:\n' + (d.get('message') || '');
      return 'mailto:office@anavafilms.com?subject=' +
        encodeURIComponent('New Thought from ' + (d.get('name') || 'Website')) +
        '&body=' + encodeURIComponent(body);
    }
    function check(name) {
      var el = form.elements[name];
      if (!el || !RULES[name]) return true;
      var msg = RULES[name](el.value.trim());
      var err = document.getElementById('e-' + name);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      el.closest('.ct-field').classList.toggle('is-bad', !!msg);
      if (err) err.textContent = msg;
      return !msg;
    }
    function checkAll() {
      var first = null;
      Object.keys(RULES).forEach(function (n) { if (!check(n) && !first) first = form.elements[n]; });
      return first;
    }
    // Once a field has been left, it re-checks as it is corrected
    Object.keys(RULES).forEach(function (n) {
      var el = form.elements[n];
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value.trim() || el.hasAttribute('aria-invalid')) check(n); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(n); });
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      function mark() { el.closest('.ct-field') && el.closest('.ct-field').classList.toggle('is-filled', !!el.value); }
      el.addEventListener('change', mark); el.addEventListener('input', mark);
    });

    function setBusy(on) {
      sending = on;
      form.classList.toggle('is-sending', on);
      form.setAttribute('aria-busy', on ? 'true' : 'false');
      if (button) button.disabled = on;
      if (label) label.textContent = on ? 'Sending…' : 'Send Enquiry';
    }
    function fail(d) {
      if (!feedback) return;
      feedback.hidden = false;
      feedback.className = 'ct-feedback is-error';
      feedback.innerHTML = '';
      var p = document.createElement('p');
      p.textContent = 'We couldn’t send that just now. Your details are still here — try again, or send it by email.';
      var a = document.createElement('a');
      a.className = 'stays-link';
      a.href = mailtoHref(d);
      a.textContent = 'Send by Email Instead';
      feedback.appendChild(p);
      feedback.appendChild(a);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      if (feedback) feedback.hidden = true;
      var bad = checkAll();
      if (bad) { bad.focus(); return; }
      var d = new FormData(form);
      var actionUrl = form.getAttribute('action');
      if (!actionUrl || actionUrl.indexOf('mailto:') === 0) { window.location.href = mailtoHref(d); return; }
      setBusy(true);
      fetch(actionUrl, { method: 'POST', body: d, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Submission returned ' + res.status);
          return res.text().then(function (t) {
            var j = null;
            try { j = JSON.parse(t); } catch (err) { /* an HTML thank-you page is a success too */ }
            if (j && (j.success === false || j.success === 'false')) throw new Error(j.message || 'Rejected');
          });
        })
        .then(function () {
          form.reset();
          form.querySelectorAll('.ct-field').forEach(function (f) { f.classList.remove('is-filled', 'is-bad'); });
          form.hidden = true;
          if (done) { done.hidden = false; done.focus(); }
        })
        .catch(function () { fail(d); })
        .then(function () { setBusy(false); });
    });

    var again = done && done.querySelector('.ct-again');
    if (again) again.addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      var first = form.elements.name;
      if (first) first.focus();
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

/* ==========================================================================
   Cinematic motion system (Home / Work / Process / About / Contact)
   Layout, copy and colours are untouched: this only adds reveals, a word
   mask for headings, drawn lines,
   quiet background graphics with parallax, and process-step activation.
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  if (!hasIO) { html.classList.remove('m-js'); return; }

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function inside(el, sel) { return !!el.closest(sel); }

  /* ---------- 1. split headings into masked words ---------- */
  var HEADINGS = '.hero-cine-title, .phil2-title, .stays-title, .approach-title, .pb-title, .hero-split .display, .display-sm, .wwd-title, .phil-title';
  function splitHeading(h) {
    var idx = 0;
    (function walk(node, accent) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'mw';
            var i = document.createElement('span'); i.className = 'mw-i' + (accent ? ' mw-accent' : '');
            i.textContent = w;
            i.style.setProperty('--wi', idx++);
            if (accent) i.style.setProperty('--wa', 1);
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n, accent || n.classList.contains('o') || n.tagName === 'EM');
        }
      });
    })(h, false);
    h.classList.add('m-split');
    h.style.setProperty('--wn', idx);
    return idx;
  }

  /* ---------- 2. collect reveal items and give each section a sequence ---------- */
  var SKIP = '.work-hero, .hero-cine, .ww, .step, .pj, .pj-hero, .cap, .ct-hero, .ct-main, .intro, .site-header, .main-footer, .lightbox, .case';
  var ROLES = [
    ['label', '.eyebrow, .sec-name, .stays-label, .approach-eyebrow, .pb-eyebrow'],
    ['heading', HEADINGS],
    ['para', '.hero-cine-lead, p.lead, .standfirst, .approach-lead, .pb-text, .phil2-lead, .phil2-sub'],
    ['cta', '.btn:not(.btn-talk), .stays-link, .sec-more'],
    ['media', '.reel, .sw-media, .phil2-band, .pb-card, .hero-media, .person-img']
  ];
  var sections = new Map();
  ROLES.forEach(function (r) {
    $$(r[1]).forEach(function (el) {
      if (inside(el, SKIP) || el.dataset.mRole) return;
      if (r[0] !== 'media' && el.closest('.pb-card')) return;   // card copy rides with its card
      var host = el.closest('section') || el.parentElement;
      el.dataset.mRole = r[0];
      if (!sections.has(host)) sections.set(host, []);
      sections.get(host).push(el);
    });
  });

  sections.forEach(function (items, host) {
    items.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    var t = 0;
    items.forEach(function (el) {
      var role = el.dataset.mRole;
      el.classList.add('m-item', 'm-' + role);
      var wrap = el.closest('.reveal');
      if (wrap) wrap.classList.add('m-host');
      if (role === 'heading') {
        var n = splitHeading(el);
        el.style.setProperty('--md', t.toFixed(2) + 's');
        t += Math.min(0.55, n * 0.08) + 0.25;
      } else {
        el.style.setProperty('--md', Math.min(t, 1.4).toFixed(2) + 's');
        t += role === 'label' ? 0.12 : role === 'para' ? 0.14 : role === 'cta' ? 0.1 : 0.12;
      }
      if (role === 'label') {
        var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 12;
        var ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
        el.style.setProperty('--ls-to', ls + 'px');
        el.style.setProperty('--ls-from', (ls + fs * 0.17) + 'px');
      }
    });
  });

  function play(host) {
    (sections.get(host) || []).forEach(function (el) {
      if (el.classList.contains('m-on')) return;
      el.classList.add('m-anim');
      requestAnimationFrame(function () { el.classList.add('m-on'); });
      var d = parseFloat(el.style.getPropertyValue('--md')) || 0;
      setTimeout(function () { el.classList.remove('m-anim'); }, (d + 1.6) * 1000);
    });
  }
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      secObs.unobserve(en.target);
      var go = function () { play(en.target); };
      // The home hero waits for the clapperboard ident to clear
      if (html.classList.contains('intro-on') && en.target.classList.contains('hero-cine')) {
        var mo = new MutationObserver(function () {
          if (!html.classList.contains('intro-on')) { mo.disconnect(); setTimeout(go, 150); }
        });
        mo.observe(html, { attributes: true, attributeFilter: ['class'] });
      } else go();
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  sections.forEach(function (_, host) { secObs.observe(host); });

  /* ---------- 3. Work grid: cards rise in sequence as they arrive ---------- */
  var cards = $$('.wcard');
  if (cards.length) {
    var cardObs = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.filter(function (e) { return e.isIntersecting; }).forEach(function (en) {
        var c = en.target; cardObs.unobserve(c);
        c.style.setProperty('--md', Math.min(k++ * 0.08, 0.48).toFixed(2) + 's');
        c.classList.add('m-anim');
        requestAnimationFrame(function () { c.classList.add('m-on'); });
        setTimeout(function () { c.classList.remove('m-anim'); }, 1800);
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { c.classList.add('m-card'); cardObs.observe(c); });
  }

  /* ---------- 4. Process: steps light up in order, the rail follows the scroll ---------- */
  var steps = document.querySelector('.steps');
  if (steps) {
    var rail = document.createElement('span'); rail.className = 'steps-progress'; rail.setAttribute('aria-hidden', 'true');
    steps.appendChild(rail);
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-active'); stepObs.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    $$('.step', steps).forEach(function (s) { s.classList.add('m-step'); stepObs.observe(s); });
  }

  /* ---------- 5. quiet background graphics in selected sections ---------- */
  var DECO = [
    ['.phil2', 'grid'], ['.people-bridge', 'arc-r'],
    ['.home-cta', null], ['.hero-split.centered', 'arc-l'], ['.steps', 'grid'],
    ['.wwd-intro', 'arc-r'], ['#people', 'grid']
  ];
  var decos = [];
  DECO.forEach(function (d) {
    var el = document.querySelector(d[0]);
    if (!el || !d[1]) return;
    var host = el.tagName === 'SECTION' ? el : (el.closest('section') || el);
    if (host.querySelector(':scope > .m-deco')) return;
    var v = d[1], layer = document.createElement('div');
    layer.className = 'm-deco m-deco-' + v; layer.setAttribute('aria-hidden', 'true');
    var h = '<i class="m-glow"></i>';
    if (v === 'hero') h += '<i class="m-vig"></i><i class="m-arc m-arc-a"><b></b></i><i class="m-arc m-arc-b"><b></b></i><i class="m-pt m-pt-1"></i><i class="m-pt m-pt-2"></i><i class="m-pt m-pt-3"></i>';
    if (v === 'grid') h += '<i class="m-grid"></i><i class="m-cross"></i><i class="m-line"></i>';
    if (v === 'arc-r' || v === 'arc-l') h += '<i class="m-arc m-arc-c"><b></b></i><i class="m-line"></i><i class="m-corner"></i>';
    layer.innerHTML = h;
    host.classList.add('m-deco-host');
    host.insertBefore(layer, host.firstChild);
    decos.push(layer);
  });
  var visDeco = new Set();
  var decoObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      en.target.classList.toggle('m-vis', en.isIntersecting);
      if (en.isIntersecting) visDeco.add(en.target); else visDeco.delete(en.target);
    });
  }, { threshold: 0 });
  decos.forEach(function (d) { decoObs.observe(d); });

  /* ---------- 6. section sweep lines ---------- */
  $$('main section, body > section').forEach(function (s, i) {
    if (i === 0 || i % 2 || s.classList.contains('work-hero') || s.classList.contains('hero-cine')) return;
    var line = document.createElement('span');
    line.className = 'm-sweep' + (i % 4 === 2 ? ' m-sweep-r' : ''); line.setAttribute('aria-hidden', 'true');
    s.classList.add('m-sweep-host');
    s.insertBefore(line, s.firstChild);
    var o = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { line.classList.add('m-on'); o.disconnect(); }
    }, { threshold: 0.1 });
    o.observe(s);
  });

  /* ---------- 7. scroll: parallax for the graphics, the process rail ---------- */
  if (!reduce) {
    var ticking = false;
    var frame = function () {
      ticking = false;
      var vh = window.innerHeight;
      visDeco.forEach(function (d) {
        var r = d.parentElement.getBoundingClientRect();
        var off = (r.top + r.height / 2 - vh / 2) * -0.06;
        d.style.setProperty('--py', off.toFixed(1) + 'px');
      });
      if (steps) {
        var sr = steps.getBoundingClientRect();
        var p = (vh * 0.62 - sr.top) / sr.height;
        steps.style.setProperty('--sp', Math.max(0, Math.min(1, p)).toFixed(3));
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  } else if (steps) steps.style.setProperty('--sp', 1);

  /* ---------- 8. page change: nav eases down before same-site navigation ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    html.classList.add('m-leave');
    setTimeout(function () { location.href = url.href; }, reduce ? 0 : 170);
  });
  window.addEventListener('pageshow', function () { html.classList.remove('m-leave'); });

  /* grain over everything (static, very faint) */
  var g = document.createElement('div'); g.className = 'm-grain'; g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
})();

/* ==========================================================================
   Home — Works Wheel (02 Selected Work)
   Wide screens with motion: the films start in a ring around the title and,
   as the page scrolls through the pinned section, open into a 3D drum that
   turns one film at a time. The page's own scroll drives it (wheel,
   trackpad, touch, keyboard), so the section never traps scrolling; a mouse
   drag is turned into page scroll. Values ease toward their targets, so
   motion stays weighted rather than snapping. Phones and reduced motion
   get a horizontal strip instead (CSS: .ww[data-mode="gallery"]).
   ========================================================================== */
(function () {
  'use strict';
  var root = document.querySelector('.ww');
  if (!root || !window.matchMedia) return;
  var pin = root.querySelector('.ww-pin');
  var stage = root.querySelector('.ww-stage');
  var head = root.querySelector('.ww-head');
  var intro = root.querySelector('.ww-intro');
  var info = root.querySelector('.ww-info');
  var anchor = root.querySelector('.ww-anchor');
  var numEl = root.querySelector('.ww-num');
  var nameEl = root.querySelector('.ww-name');
  var metaEl = root.querySelector('.ww-meta');
  var viewEl = root.querySelector('.ww-view');
  var barEl = root.querySelector('.ww-bar');
  var items = Array.prototype.slice.call(root.querySelectorAll('.ww-item'));
  var thumbRow = root.querySelector('.ww-strip');
  var thumbs = Array.prototype.slice.call(root.querySelectorAll('.ww-thumb'));
  var N = items.length;
  if (!N) return;

  var wideMq = window.matchMedia('(min-width: 768px)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ratios = items.map(function (el) {
    var r = (el.style.getPropertyValue('--r') || '16/9').split('/');
    return (parseFloat(r[0]) || 16) / (parseFloat(r[1]) || 9);
  });

  // Scroll budget, in viewport heights: opening the ring, one step per film,
  // then a short hold on the last film before the section lets go.
  var OPEN = 45, STEP = 28, HOLD = 16;
  var SPAN = OPEN + STEP * (N - 1) + HOLD;
  var ANG = 34;                       // degrees between films on the drum
  var DEPTH = [1, -0.4, 0.3, -1, 0.7, -0.6, 0.1, -0.2];   // ring: near/far per film

  var mode = '', active = -1, geo = null, raf = 0, visible = true;
  var cur = { m: 0, p: 0 }, tgt = { m: 0, p: 0 };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }

  /* ---- active film: text, link and markers (only when it changes) ---- */
  function setActive(i) {
    if (i === active) return;
    active = i;
    items.forEach(function (el, k) {
      el.classList.toggle('is-active', k === i);
      el.classList.toggle('is-dim', k !== i);
    });
    var el = items[i];
    numEl.textContent = (i < 9 ? '0' : '') + (i + 1);
    nameEl.textContent = el.getAttribute('data-title');
    metaEl.textContent = el.getAttribute('data-meta');
    ['data-lightbox', 'data-caption', 'data-case'].forEach(function (a) {
      var v = el.getAttribute(a);
      if (v !== null) viewEl.setAttribute(a, v); else viewEl.removeAttribute(a);
    });
    viewEl.setAttribute('aria-label', 'View project: ' + el.getAttribute('data-title'));
    barEl.style.setProperty('--wwp', ((i + 1) / N * 100).toFixed(2) + '%');
    // the counter, title and meta ease in again for each new film
    info.classList.remove('is-swap');
    void info.offsetWidth;
    info.classList.add('is-swap');
    thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });
    var th = thumbs[i];
    if (th && thumbRow && thumbRow.offsetParent) {
      var rr = thumbRow.getBoundingClientRect(), tb = th.getBoundingClientRect();
      if (tb.left < rr.left + 8 || tb.right > rr.right - 8) {
        thumbRow.scrollTo({ left: thumbRow.scrollLeft + tb.left - rr.left - (rr.width - tb.width) / 2,
          behavior: calmMq.matches ? 'auto' : 'smooth' });
      }
    }
  }

  /* ---- wheel geometry ---- */
  function measure() {
    var pr = pin.getBoundingClientRect();
    var vw = pr.width, vh = pr.height;
    var ar = anchor.getBoundingClientRect();
    var H = Math.min(vh * 0.5, ar.width * 0.84 / (16 / 9));
    var hr = clamp(Math.min(vh * 0.14, vw * 0.095), 60, 128); // film height in the ring
    var cx = vw / 2, cy = vh / 2 + 28;
    geo = {
      vh: vh, H: H, R: H * 1.25, hr: hr, cx: cx, cy: cy,
      rx: Math.min(vw * 0.4, vw / 2 - hr * 1.05),
      ry: Math.min(vh * 0.36, vh / 2 - hr * 0.62 - 34),
      dx: ar.left - pr.left + ar.width / 2,
      dy: ar.top - pr.top + ar.height / 2
    };
    items.forEach(function (el, i) {
      el.style.width = (H * ratios[i]).toFixed(1) + 'px';
      el.style.height = H.toFixed(1) + 'px';
    });
  }

  function render() {
    var g = geo, mm = clamp(cur.m, 0, 1), m = ease(mm), p = cur.p;
    var spin = mm * 50;                              // the ring turns as it opens
    for (var i = 0; i < N; i++) {
      var el = items[i], w = g.H * ratios[i];
      // start a half-step off vertical so no film sits level with the title
      var phi = (i / N * 360 - 90 + 180 / N + spin) * Math.PI / 180;
      var rx = g.cx + g.rx * Math.cos(phi), ry = g.cy + g.ry * Math.sin(phi);
      var d = i - p, th = d * ANG, t = th * Math.PI / 180, ad = Math.min(1, Math.abs(d));
      var dy = g.dy + g.R * Math.sin(t), dz = g.R * (Math.cos(t) - 1);
      var dO = Math.abs(th) >= 100 ? 0 : (1 - 0.62 * ad) * clamp((100 - Math.abs(th)) / 26, 0, 1);
      var x = lerp(rx, g.dx, m), y = lerp(ry, dy, m), z = dz * m;
      var dep = DEPTH[i % DEPTH.length];
      var s = lerp(g.hr / g.H * (1 + 0.1 * dep), 1 - 0.1 * ad, m);
      var o = lerp(0.74 + 0.16 * dep, dO, m);
      el.style.transform = 'translate3d(' + (x - w / 2).toFixed(1) + 'px,' + (y - g.H / 2).toFixed(1) +
        'px,' + z.toFixed(1) + 'px) rotateX(' + (-th * m).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? 'hidden' : '';
      el.style.zIndex = String(100 - Math.round(ad * 20 * m));
    }
    stage.style.perspectiveOrigin = lerp(g.cx, g.dx, m).toFixed(0) + 'px ' + lerp(g.cy, g.dy, m).toFixed(0) + 'px';
    // One-line title in the middle of the ring; it hands over to the
    // stacked title at the side as the drum forms
    var ho = clamp(mm / 0.4, 0, 1);
    intro.style.opacity = (1 - ho).toFixed(3);
    intro.style.transform = 'translate(-50%,-50%) scale(' + (1 - 0.05 * ho).toFixed(4) + ')';
    intro.style.visibility = ho > 0.98 ? 'hidden' : '';
    head.style.opacity = clamp((mm - 0.3) / 0.4, 0, 1).toFixed(3);
    var io = clamp((mm - 0.55) / 0.45, 0, 1);
    info.style.opacity = io.toFixed(3);
    info.style.transform = 'translate3d(0,' + ((1 - io) * 16).toFixed(1) + 'px,0)';
    info.style.visibility = io < 0.02 ? 'hidden' : '';
    setActive(clamp(Math.round(p), 0, N - 1));
  }

  function frame() {
    raf = 0;
    cur.m += (tgt.m - cur.m) * 0.16;
    cur.p += (tgt.p - cur.p) * 0.15;
    if (Math.abs(tgt.m - cur.m) < 0.0005) cur.m = tgt.m;
    if (Math.abs(tgt.p - cur.p) < 0.0005) cur.p = tgt.p;
    render();
    if (visible && (cur.m !== tgt.m || cur.p !== tgt.p)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && mode === 'wheel') raf = requestAnimationFrame(frame); }

  function span() { return Math.max(1, root.offsetHeight - geo.vh); }
  function readScroll() {
    var s = clamp(-root.getBoundingClientRect().top / span(), 0, 1) * SPAN;
    tgt.m = clamp(s / OPEN, 0, 1);
    tgt.p = clamp((s - OPEN) / STEP, 0, N - 1);
  }
  function yFor(i) {
    return root.getBoundingClientRect().top + window.pageYOffset + (OPEN + i * STEP) / SPAN * span();
  }
  function goTo(i) { window.scrollTo({ top: Math.round(yFor(i)), behavior: 'smooth' }); }

  // After the reader stops, ease onto the nearest film (only mid-drum)
  var settleT = 0, dragging = false;
  function settle() {
    if (mode !== 'wheel' || dragging || tgt.m < 1) return;
    var near = Math.round(tgt.p);
    if (tgt.p <= 0 || tgt.p >= N - 1 || Math.abs(tgt.p - near) < 0.02) return;
    goTo(near);
  }
  function onScroll() {
    if (mode !== 'wheel') return;
    readScroll();
    kick();
    clearTimeout(settleT);
    settleT = setTimeout(settle, 200);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- mouse drag: turned into page scroll, one film per film height ---- */
  var drag = null, eatClick = false;
  stage.addEventListener('pointerdown', function (e) {
    if (mode !== 'wheel' || e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      drag.moved = dragging = true;
      stage.classList.add('is-dragging');
      document.documentElement.style.scrollBehavior = 'auto';
    }
    drag.x = e.clientX; drag.y = e.clientY;
    var delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    var perFilm = STEP / 100 * geo.vh;
    window.scrollTo(window.pageXOffset, window.pageYOffset - delta / geo.H * perFilm);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      eatClick = true;
      setTimeout(function () { eatClick = false; }, 0);
      stage.classList.remove('is-dragging');
      document.documentElement.style.scrollBehavior = '';
      dragging = false;
      clearTimeout(settleT);
      settleT = setTimeout(settle, 120);
    }
    drag = null;
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  stage.addEventListener('click', function (e) {
    if (eatClick) { e.preventDefault(); e.stopPropagation(); eatClick = false; }
  }, true);

  /* ---- strip (phones / reduced motion) ---- */
  function stripPad() {
    var w = stage.getBoundingClientRect().width;
    stage.style.paddingLeft = Math.max(16, (w - items[0].offsetWidth) / 2) + 'px';
    stage.style.paddingRight = Math.max(16, (w - items[N - 1].offsetWidth) / 2) + 'px';
  }
  function stripRead() {
    var r = stage.getBoundingClientRect(), c = r.left + r.width / 2, best = 0, bd = Infinity;
    items.forEach(function (el, i) {
      var b = el.getBoundingClientRect(), dd = Math.abs(b.left + b.width / 2 - c);
      if (dd < bd) { bd = dd; best = i; }
    });
    setActive(best);
  }
  function stripTo(i, instant) {
    i = clamp(i, 0, N - 1);
    var r = stage.getBoundingClientRect(), b = items[i].getBoundingClientRect();
    stage.scrollBy({ left: (b.left + b.width / 2) - (r.left + r.width / 2),
      behavior: instant || calmMq.matches ? 'auto' : 'smooth' });
  }
  var stripTick = false;
  stage.addEventListener('scroll', function () {
    if (mode !== 'gallery' || stripTick) return;
    stripTick = true;
    requestAnimationFrame(function () { stripTick = false; stripRead(); });
  }, { passive: true });
  var prev = root.querySelector('.ww-prev'), next = root.querySelector('.ww-next');
  thumbs.forEach(function (t, k) {
    t.addEventListener('click', function () { if (mode === 'gallery') stripTo(k); else goTo(k); });
  });
  if (prev) prev.addEventListener('click', function () { stripTo(active - 1); });
  if (next) next.addEventListener('click', function () { stripTo(active + 1); });

  /* ---- films: click, keyboard ---- */
  items.forEach(function (el, i) {
    el.addEventListener('click', function (e) {
      if (e.detail === 0) return;                    // keyboard: open the film
      var ready = mode === 'wheel' ? (cur.m > 0.97 && Math.abs(cur.p - i) < 0.35) : i === active;
      if (ready) return;                             // the lightbox opens it
      e.preventDefault();
      e.stopPropagation();
      if (mode === 'wheel') goTo(i); else stripTo(i);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); el.click(); }
    });
    el.addEventListener('focus', function () {
      if (mode === 'wheel') { if (tgt.m < 1 || Math.round(tgt.p) !== i) goTo(i); }
      else stripTo(i, true);
    });
  });

  head.addEventListener('focusin', function () {
    if (mode === 'wheel' && tgt.m < 1) goTo(0);
  });

  /* ---- mode, sizing, visibility ---- */
  var WHEEL_PROPS = ['width', 'height', 'transform', 'opacity', 'visibility', 'z-index'];
  function clearInline() {
    items.forEach(function (el) { WHEEL_PROPS.forEach(function (p) { el.style.removeProperty(p); }); });
    ['transform', 'opacity', 'visibility'].forEach(function (p) {
      head.style.removeProperty(p); info.style.removeProperty(p); intro.style.removeProperty(p);
    });
    stage.style.removeProperty('perspective-origin');
    stage.style.removeProperty('padding-left');
    stage.style.removeProperty('padding-right');
    root.style.removeProperty('--ww-scroll');
  }
  function setMode() {
    // The wheel needs a working sticky pin, which needs overflow-x:clip on
    // the page (anava.css); older browsers get the strip instead.
    var canPin = window.CSS && CSS.supports && CSS.supports('overflow-x', 'clip');
    var want = wideMq.matches && !calmMq.matches && canPin ? 'wheel' : 'gallery';
    if (want !== mode) {
      mode = want;
      clearInline();
      root.setAttribute('data-mode', mode);
      if (mode === 'wheel') root.style.setProperty('--ww-scroll', SPAN + 'vh');
    }
    if (mode === 'wheel') {
      measure();
      readScroll();
      cur.m = tgt.m; cur.p = tgt.p;
      render();
    } else {
      stripPad();
      stripRead();
    }
  }
  var rT = 0;
  function onResize() { clearTimeout(rT); rT = setTimeout(setMode, 120); }
  window.addEventListener('resize', onResize);
  if (wideMq.addEventListener) {
    wideMq.addEventListener('change', setMode);
    calmMq.addEventListener('change', setMode);
  }
  window.addEventListener('load', setMode);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMode);

  // Only animate while the section is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { if (mode === 'wheel') { readScroll(); kick(); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { rootMargin: '200px 0px' }).observe(root);
  }

  setMode();
})();

/* ==========================================================================
   Velaris — slow tungsten light in deep black (WebGL)
   A decorative film layer behind the home hero: domain-warped noise lit
   only inside soft, off-centre pools, so most of the frame stays black and
   the orange reads as light spilling through, not a gradient. The canvas
   is screen-blended over the stage photograph (black adds nothing) and sits
   under the hero's own dark overlays, so copy contrast is unchanged.
   Draws at up to 30fps, at reduced resolution, only while the hero is on
   screen and the tab is visible; reduced motion gets one still frame.
   Usage: <canvas data-velaris data-bg data-colors data-speed data-grain>.
   A React version with the same props lives in components/ui/velaris.tsx.
   ========================================================================== */
(function () {
  'use strict';
  var canvases = document.querySelectorAll('canvas[data-velaris]');
  if (!canvases.length) return;

  var VERT = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform vec2 uRes;uniform float uTime;uniform vec3 uBg;',
    'uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;',
    'uniform float uGrain;uniform vec2 uFocus;uniform float uGain;uniform vec2 uShift;',
    'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);',
    ' for(int i=0;i<4;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}',
    'void main(){',
    ' float asp=uRes.x/uRes.y;',
    ' vec2 p=vec2((v.x-.5)*asp,v.y-.5)*1.7+uShift;float t=uTime;',
    ' vec2 q=vec2(fbm(p+vec2(0.,t*.9)),fbm(p+vec2(5.2,1.3)-t*.7));',
    ' vec2 r=vec2(fbm(p+1.8*q+vec2(1.7,9.2)+t*.5),fbm(p+1.8*q+vec2(8.3,2.8)-t*.4));',
    ' float f=fbm(p+1.6*r);',
    // one main pool of light off-centre, one faint echo up and across
    ' vec2 d=(v-uFocus)*vec2(asp,1.);',
    ' vec2 d2=(v-uFocus-vec2(.42,.26))*vec2(asp,1.);',
    ' float pool=exp(-dot(d,d)*2.4)+exp(-dot(d2,d2)*5.)*.32;',
    ' float e=clamp(f*f*2.6*pool*uGain,0.,1.);',
    ' vec3 c=uBg;',
    ' c=mix(c,uC3,smoothstep(.04,.2,e));',
    ' c=mix(c,uC2,smoothstep(.14,.42,e));',
    ' c=mix(c,uC1,smoothstep(.34,.66,e)*.85);',
    ' c=mix(c,uC0,smoothstep(.55,.9,e)*.7);',
    // edges fall away to black: radial vignette plus top and bottom fades
    ' float vg=smoothstep(1.,.18,length((v-.5)*vec2(asp*.78,1.))*1.24);',
    ' c=mix(uBg,c,vg*smoothstep(0.,.32,v.y)*smoothstep(1.,.76,v.y)*smoothstep(0.,.1,v.x)*smoothstep(1.,.9,v.x));',
    ' c+=(h(v*uRes+fract(t*61.))-.5)*uGrain*.045;',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');

  function hex(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec((c || '').trim());
    if (!m) return [0, 0, 0];
    var x = parseInt(m[1], 16);
    return [(x >> 16 & 255) / 255, (x >> 8 & 255) / 255, (x & 255) / 255];
  }

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  Array.prototype.forEach.call(canvases, function (cv) {
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false,
      stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;                                     // CSS haze stays as the fallback

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aLoc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uBg', 'uC0', 'uC1', 'uC2', 'uC3', 'uGrain', 'uFocus', 'uGain', 'uShift']
      .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    // Colours are parsed once
    var cols = (cv.getAttribute('data-colors') || '#F05223,#D94116,#8F260C,#120604').split(',');
    gl.uniform3fv(U.uBg, hex(cv.getAttribute('data-bg') || '#020202'));
    ['uC0', 'uC1', 'uC2', 'uC3'].forEach(function (k, i) { gl.uniform3fv(U[k], hex(cols[i] || cols[cols.length - 1])); });
    gl.uniform1f(U.uGrain, parseFloat(cv.getAttribute('data-grain')) || 0.14);
    var speed = parseFloat(cv.getAttribute('data-speed')) || 0.55;

    var host = cv.closest('section') || cv.parentElement;
    host.classList.add('has-velaris');

    // Composition: the main pool sits lower-left of the centred copy; on a
    // phone it drops lower and dims so body text keeps plain black behind it
    function compose() {
      var w = cv.clientWidth || 1, h = cv.clientHeight || 1, narrow = w < 768;
      var portrait = h > w;
      gl.uniform2f(U.uFocus, narrow ? 0.18 : (portrait ? 0.18 : 0.19), narrow ? 0.26 : (portrait ? 0.28 : 0.4));
      gl.uniform1f(U.uGain, narrow ? 0.88 : 1.0);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var scale = Math.max(0.75, dpr * 0.5);             // the field is soft; half-res is plenty
      var W = Math.round(w * scale), H = Math.round(h * scale);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uRes, W, H);
    }

    var t0 = performance.now(), last = 0, raf = 0, onScreen = true, lost = false;
    var shift = [0, 0], aim = [0, 0];
    function draw(now) {
      var secs = calm ? 7.3 : (now - t0) / 1000;
      gl.uniform1f(U.uTime, secs * speed * 0.05);
      shift[0] += (aim[0] - shift[0]) * 0.04;
      shift[1] += (aim[1] - shift[1]) * 0.04;
      gl.uniform2f(U.uShift, shift[0], shift[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!cv.classList.contains('is-on')) cv.classList.add('is-on');
    }
    function loop(now) {
      raf = 0;
      if (lost || !onScreen || document.hidden) return;
      if (now - last >= 33) { last = now; draw(now); }  // ~30fps is ample for this pace
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!calm && !raf && !lost) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    compose();
    draw(performance.now());
    start();

    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { compose(); draw(performance.now()); }) : null;
    if (ro) ro.observe(cv); else window.addEventListener('resize', function () { compose(); draw(performance.now()); });
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      onScreen = en[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { rootMargin: '100px 0px' }) : null;
    if (io) io.observe(host);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    // The faintest drift toward the pointer; never a blob that follows it
    if (finePointer && !calm) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        aim[0] = ((e.clientX - r.left) / r.width - 0.5) * 0.06;
        aim[1] = -((e.clientY - r.top) / r.height - 0.5) * 0.04;
      }, { passive: true });
      host.addEventListener('pointerleave', function () { aim[0] = aim[1] = 0; });
    }

    cv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); lost = true; stop(); host.classList.remove('has-velaris');
    });
    window.addEventListener('pagehide', function () {
      stop(); if (ro) ro.disconnect(); if (io) io.disconnect();
    });
  });
})();

/* ==========================================================================
   Process journey — one composition the page scrolls through.
   Wide screens: the section is tall (about 0.8 viewport per stage) and its
   inner frame is sticky, so the page keeps scrolling normally while the
   frame stays put. Scroll position alone drives everything: which stage is
   on, how far its content has unfolded (number, title, body, then its
   items one by one), the slow push-in on its frame and the orange rail.
   Phones, portrait tablets and reduced motion: the stages simply stack and
   reveal as they enter, under a small sticky 01–07 indicator.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.querySelector('.pj');
  if (!root || !window.matchMedia) return;
  var stages = Array.prototype.slice.call(root.querySelectorAll('.pj-stage'));
  var navBtns = Array.prototype.slice.call(root.querySelectorAll('.pj-nav button'));
  var rail = root.querySelector('.pj-rail i');
  var N = stages.length;
  if (!N) return;
  var wideMq = window.matchMedia('(min-width: 1025px) and (min-height: 560px)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lists = stages.map(function (st) {
    return {
      items: Array.prototype.slice.call(st.querySelectorAll('.pj-items > li')),
      edges: Array.prototype.slice.call(st.querySelectorAll('.pj-edge > li')),
      shown: -1, r: 0, cur: -1
    };
  });
  var mode = '', active = -1, raf = 0, near = true, io = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function perStage() { return window.innerWidth < 1280 ? 0.62 : 0.78; }
  function span() { return Math.max(1, root.offsetHeight - window.innerHeight); }
  function progress() { return clamp(-root.getBoundingClientRect().top / span(), 0, 1); }

  function setActive(i) {
    if (i === active) return;
    active = i;
    stages.forEach(function (st, k) {
      st.classList.toggle('is-on', k === i);
      st.classList.toggle('is-past', k < i);
    });
    navBtns.forEach(function (b, k) {
      b.classList.toggle('is-on', k === i);
      b.classList.toggle('is-done', k < i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    root.setAttribute('data-stage', stages[i].className.replace(/.*\bpj-(thought|idea|deck|pre|shoot|post|delivery)\b.*/, '$1'));
    // warm the next frame before it is needed
    var nx = stages[i + 1] && stages[i + 1].querySelector('.pj-fig img');
    if (nx && nx.loading === 'lazy') nx.loading = 'eager';
  }

  // How much of stage i has unfolded at local progress t (0..1)
  function unfold(i, t) {
    var L = lists[i], st = stages[i];
    var r = t < 0.1 ? 1 : t < 0.24 ? 2 : 3;
    if (r !== L.r) { L.r = r; st.setAttribute('data-r', r); }
    var n = L.items.length, a = 0.34, b = 0.84;
    var f = n ? (t - a) / ((b - a) / n) : 0;              // items revealed, fractional
    var shown = clamp(Math.floor(f) + 1, 0, n);
    if (t < a) shown = 0;
    if (shown !== L.shown) {
      L.shown = shown;
      for (var k = 0; k < n; k++) {
        L.items[k].classList.toggle('is-in', k < shown);
        L.items[k].classList.toggle('is-cur', k === shown - 1);
        if (L.edges[k]) L.edges[k].classList.toggle('is-in', k < shown);
      }
    }
    // the current item's own progress (post-production timeline fill)
    if (shown > 0) L.items[shown - 1].style.setProperty('--f', clamp(f - (shown - 1), 0, 1).toFixed(3));
    st.style.setProperty('--t', t.toFixed(3));
  }

  function update() {
    raf = 0;
    var p = progress();
    if (rail) rail.style.transform = (mode === 'pin' ? 'scaleY(' : 'scaleX(') + p.toFixed(4) + ')';
    if (mode !== 'pin') return;
    var P = p * N, i = Math.min(N - 1, Math.floor(P));
    setActive(i);
    unfold(i, Math.min(1, P - i));
  }
  function onScroll() { if (near && !raf) raf = requestAnimationFrame(update); }

  function reset() {
    stages.forEach(function (st, k) {
      st.classList.remove('is-seen', 'is-on', 'is-past');
      st.removeAttribute('data-r');
      st.style.removeProperty('--t');
      lists[k].shown = -1; lists[k].r = 0;
      lists[k].items.forEach(function (li) { li.classList.remove('is-in', 'is-cur'); li.style.removeProperty('--f'); });
      lists[k].edges.forEach(function (li) { li.classList.remove('is-in'); });
    });
    active = -1;
    if (io) { io.disconnect(); io = null; }
  }

  function setMode() {
    var want = wideMq.matches && !calmMq.matches ? 'pin' : 'flow';
    if (want !== mode) {
      mode = want;
      reset();
      root.setAttribute('data-mode', mode);
      if (mode === 'flow') flow();
    }
    if (mode === 'pin') root.style.setProperty('--pj-h', (100 + N * perStage() * 100).toFixed(0) + 'vh');
    else root.style.removeProperty('--pj-h');
    update();
  }

  // Stacked stages: each unfolds once as it arrives; the one in the middle
  // of the screen lights its number in the indicator
  function flow() {
    if (!('IntersectionObserver' in window) || calmMq.matches) {
      stages.forEach(function (st) { st.classList.add('is-seen'); });
      lists.forEach(function (L) { L.items.forEach(function (li) { li.classList.add('is-in'); }); });
    }
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var k = +e.target.getAttribute('data-i');
        if (e.intersectionRatio > 0 || e.rootBounds === null) {
          e.target.classList.add('is-seen');
          lists[k].items.forEach(function (li) { li.classList.add('is-in'); });
        }
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    var mid = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(+e.target.getAttribute('data-i')); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    stages.forEach(function (st) { io.observe(st); mid.observe(st); });
    var d = io.disconnect.bind(io);
    io.disconnect = function () { d(); mid.disconnect(); };
  }

  // 01–07: jump to a stage (landing once its title and copy are up)
  navBtns.forEach(function (b, k) {
    b.addEventListener('click', function () {
      var hh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 78;
      var top = root.getBoundingClientRect().top + window.pageYOffset;
      var y = mode === 'pin' ? top + (k + 0.55) / N * span()
        : stages[k].getBoundingClientRect().top + window.pageYOffset - hh - 64;
      window.scrollTo({ top: Math.round(y), behavior: calmMq.matches ? 'auto' : 'smooth' });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  var rT = 0;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(setMode, 120); });
  if (wideMq.addEventListener) { wideMq.addEventListener('change', setMode); calmMq.addEventListener('change', setMode); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) onScroll(); },
      { rootMargin: '100px 0px' }).observe(root);
  }
  setMode();
})();

/* ==========================================================================
   About capabilities — the stage word on the left follows whichever
   chapter (Think, Make, Finish) is in the middle of the screen. A light
   touch: no pinning of the content itself, just a sticky word and rail.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.querySelector('[data-caps]');
  if (!root || !('IntersectionObserver' in window)) return;
  var caps = Array.prototype.slice.call(root.querySelectorAll('.cap'));
  var words = Array.prototype.slice.call(root.querySelectorAll('.caps-word > span'));
  var rail = root.querySelector('.caps-rail i');
  var cur = 0;
  function set(i) {
    if (i === cur) return;
    cur = i;
    words.forEach(function (w, k) { w.classList.toggle('is-on', k === i); });
    caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
    if (rail) rail.style.transform = 'scaleY(' + ((i + 1) / caps.length) + ')';
  }
  if (rail) rail.style.transform = 'scaleY(' + (1 / caps.length) + ')';
  if (caps[0]) caps[0].classList.add('is-on');
  // the chapter whose top has passed the middle of the screen is current
  var raf = 0, near = false;
  function read() {
    raf = 0;
    var mid = window.innerHeight * 0.55, i = 0;
    for (var k = 0; k < caps.length; k++) if (caps[k].getBoundingClientRect().top < mid) i = k;
    set(i);
  }
  new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) read(); }).observe(root);
  window.addEventListener('scroll', function () { if (near && !raf) raf = requestAnimationFrame(read); }, { passive: true });
})();
