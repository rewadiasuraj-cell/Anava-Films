#!/usr/bin/env python3
"""Generate the redesigned ANAVA FILMS pages from live-site content."""
import json, os, html, re, hashlib

ROOT = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(ROOT, "work.json"), encoding="utf-8") as work_file:
    cards = json.load(work_file)


def asset_version(rel):
    """Short content hash for cache-busting. .htaccess lets browsers keep CSS
    and JS for a month, so the URL has to change whenever the file does."""
    with open(os.path.join(ROOT, rel), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:10]

ASSET_V = {"css_v": asset_version("assets/css/anava.css"),
           "js_v": asset_version("assets/js/anava.js"),
           "mo_v": asset_version("assets/js/anava-motion.js")}

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/anava.css?v={css_v}">
<script>document.documentElement.classList.add('m-js');try{{if(sessionStorage.getItem('anavaPT')){{sessionStorage.removeItem('anavaPT');document.documentElement.classList.add('pt-in')}}}}catch(e){{}}</script>
<script defer src="assets/js/anava.js?v={js_v}"></script>
<script defer src="assets/js/vendor/gsap.min.js?v=3.12.5"></script>
<script defer src="assets/js/vendor/ScrollTrigger.min.js?v=3.12.5"></script>
<script defer src="assets/js/vendor/lenis.min.js?v=1.1.13"></script>
<script defer src="assets/js/anava-motion.js?v={mo_v}"></script>
</head>
<body>
"""

BTN_ARR_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>'
# the one arrow every pill CTA carries on its right
BTN_ARR = '<span class="btn-arrow" aria-hidden="true">' + BTN_ARR_SVG + '</span>'
ARROW = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
PLAY = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
CHEV = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>'
DIAG = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>'

NAV = [("index.html", "Home"), ("work.html", "Work"),
       ("process.html", "Process"), ("about.html", "About"), ("contact.html", "Contact")]


def header(active):
    # Contact is reached through Let's Talk wherever that button shows;
    # it stays in the burger menu on phones, where the button is hidden.
    def nav_li(h, n):
        li = ' class="nav-contact"' if h == "contact.html" else ""
        href = "/" if h == "index.html" else h
        cls = "active" if h == active else ""
        return f'<li{li}><a href="{href}" class="{cls}">{n}</a></li>'
    links = "".join(nav_li(h, n) for h, n in NAV)
    return f"""
<a class="skip-link" href="#main-start">Skip to content</a>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand"><img class="brand-word" src="assets/images/anava_official_logo_white.png" alt="ANAVA FILMS"><img class="brand-mark" src="assets/images/anava-mark.png" alt="" aria-hidden="true" width="34" height="29"></a>
    <nav class="nav" id="site-nav" aria-label="Main"><ul style="display:contents">{links}</ul></nav>
    <div class="header-actions" style="display:flex;align-items:center;gap:14px">
      <a href="contact.html" class="btn-talk" aria-label="Let's Talk"><span class="talk-label">Let's Talk</span><span class="circ circ-mark"><img src="assets/images/talk-mark.png" alt="" aria-hidden="true" width="18" height="15"></span></a>
      <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<span id="main-start" tabindex="-1"></span>
"""


SOCIALS = """
<div class="socials">
  <a href="https://www.instagram.com/anavafilms" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg></a>
  <a href="https://vimeo.com/anavafilms" target="_blank" rel="noopener" aria-label="Vimeo"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 7.4c-.1 2.1-1.6 5-4.4 8.6C14.7 19.8 12.2 21.6 10.2 21.6c-1.2 0-2.3-1.1-3.1-3.4l-1.7-6.3C4.8 9.6 4.1 8.5 3.4 8.5c-.2 0-.7.3-1.4.8L1 8.2c1-.9 2-1.8 3-2.7 1.3-1.2 2.3-1.8 3-1.8 1.6-.2 2.6.9 3 3.3.4 2.6.7 4.2.8 4.8.5 2 1 3 1.5 3 .5 0 1.2-.7 2.1-2.2.9-1.5 1.4-2.6 1.5-3.4.1-1-.3-1.5-1.3-1.5-.5 0-.9.1-1.4.3.9-3.1 2.7-4.6 5.4-4.5 2 .1 2.9 1.4 2.8 3.9z"/></svg></a>
  <a href="https://www.youtube.com/@anavafilms" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.5-.4-5.2a2.8 2.8 0 0 0-2-2C18.9 4.4 12 4.4 12 4.4s-6.9 0-8.6.4a2.8 2.8 0 0 0-2 2C1 8.5 1 12 1 12s0 3.5.4 5.2a2.8 2.8 0 0 0 2 2c1.7.4 8.6.4 8.6.4s6.9 0 8.6-.4a2.8 2.8 0 0 0 2-2C23 15.5 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg></a>
</div>
"""


def footer(active):
    """The live anavafilms.com footer, carried over as-is."""
    return f"""
<footer class="main-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="footer-logo">
          <a href="/"><img src="assets/images/anava_official_logo.png" alt="ANAVA FILMS Logo"></a>
        </div>
        <p class="footer-desc">
          ANAVA FILMS. Give us a thought. We&rsquo;ll give you ideas to shoot.
        </p>
      </div>

      <div class="footer-nav">
        <div>
          <div class="footer-col-title">NAVIGATION</div>
          <ul class="footer-links">
            <li><a href="/" class="footer-link">Home</a></li>
            <li><a href="work.html" class="footer-link">Work</a></li>
            <li><a href="process.html" class="footer-link">Process</a></li>
            <li><a href="about.html" class="footer-link">About</a></li>
            <li><a href="contact.html" class="footer-link">Contact</a></li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">CONNECT</div>
          <ul class="footer-links">
            <li>
              <a href="mailto:office@anavafilms.com" class="footer-link footer-social-link">
                <img src="assets/images/icons/mail.svg" alt="Email" class="footer-social-icon" width="18" height="18">
                <span>office@anavafilms.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+918691924669" class="footer-link footer-social-link">
                <img src="assets/images/icons/call.svg" alt="Call" class="footer-social-icon" width="18" height="18">
                <span>Jackson: 8691924669</span>
              </a>
            </li>
            <li>
              <a href="tel:+919911111273" class="footer-link footer-social-link">
                <img src="assets/images/icons/call.svg" alt="Call" class="footer-social-icon" width="18" height="18">
                <span>Anjan: 9911111273</span>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/anava_films" target="_blank" rel="noopener noreferrer" class="footer-link footer-social-link">
                <img src="assets/images/icons/instagram.svg" alt="Instagram" class="footer-social-icon" width="18" height="18">
                <span>Instagram</span>
              </a>
            </li>
            <li>
              <a href="https://vimeo.com/zackdirect" target="_blank" rel="noopener noreferrer" class="footer-link footer-social-link">
                <img src="assets/images/icons/vimeo.svg" alt="Vimeo" class="footer-social-icon" width="18" height="18">
                <span>Vimeo</span>
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/@anava-films" target="_blank" rel="noopener noreferrer" class="footer-link footer-social-link">
                <img src="assets/images/icons/youtube.svg" alt="YouTube" class="footer-social-icon" width="18" height="18">
                <span>YouTube</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div>&copy; <span data-year></span> ANAVA FILMS. All rights reserved.</div>
      <div>Mumbai &middot; Delhi</div>
    </div>
  </div>
</footer>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Film player">
  <button class="lightbox-close" aria-label="Close">&times;</button>
  <div class="lightbox-inner">
    <div id="lightbox-body"></div>
    <p class="lightbox-cap" id="lightbox-cap"></p>
  </div>
</div>
</body>
</html>
"""


def esc(s):
    return html.escape(s or "", quote=True)


# ---------------------------------------------------------------- work grid
CAT_LABEL = {
    "tvc": "TVCs / Digital", "vertical": "Vertical", "events": "Events",
    "photoshoots": "Photoshoots", "testimonials": "Testimonials", "podcasts": "Podcasts",
    "bts": "Behind The Scenes",
}


def pretty(s):
    """Title-case a SHOUTY label, keeping small brand quirks readable."""
    if not s:
        return ""
    s = s.replace("∞ lenskart", "Lenskart").replace("&amp;", "&")
    if s.isupper() or s.replace(" ", "").isupper():
        words = []
        for w in s.split():
            if len(w) <= 3 and w.isalpha() and w.upper() in ("KFC", "FIKN", "RCB", "LK", "BTS", "VFX"):
                words.append(w.upper())
            elif w.isdigit() or "—" in w or "&" in w:
                words.append(w)
            else:
                words.append(w.capitalize())
        s = " ".join(words)
    return s


CASE_KEYS = ("title", "client", "format", "roles", "shortDesc", "thought", "idea", "making", "duration")


def case_attr(c):
    """The project write-up a card carries; anava.js lays it out as a case study."""
    case = {k: c[k] for k in CASE_KEYS if c.get(k)}
    return f"data-case='{esc(json.dumps(case, ensure_ascii=False))}'"


def card_for(video):
    return next(c for c in cards if c.get("video", "").split("#")[0] == video)


def build_work_cards():
    out, idx = [], 0
    # BTS opens on its eight strongest cards: designed thumbnails before frame
    # grabs. Tabs filter by category, so moving the rest later changes no
    # other tab's order.
    # Vertical opens on the owner's chosen three, in this order; the rest of
    # the tab keeps its work.json order behind them.
    VERTICAL_LEAD = ["assets/media/vertical-films/aqua-color-2.mp4",
                     "assets/media/vertical-films/lenskart-performance-50.mp4",
                     "assets/media/vertical-films/KARAN JOHAR & KUSHA KAPILA X LENSKART FILM 03.mp4"]

    # TVCs / Digital sequence
    TVC_ORDER = ["assets/media/tvc/Sunil Shetty AD Landscape.mp4",
                 "assets/media/tvc/LENSKART HUSTLER AD FILM.mp4",
                 "assets/media/tvc/TIRA X KAREENA KAPOOR FILM.mp4",
                 "assets/media/tvc/LENSKART JOHN JACBOS EYEWEAR (FILM ).mp4",
                 "assets/media/tvc/LENSKART BLUE RAY GLASSES FILM.mp4",
                 "assets/media/tvc/TIRA MAKEUP SHORTIES.mp4",
                 "assets/media/tvc/LENSKART PERSONALITY FILM.mp4",
                 "assets/media/tvc/LENSKART PERSONALITY FILM 02.mp4",
                 "assets/media/tvc/CHANDAK FILM.mp4",
                 "assets/media/tvc/LK AQUALENS FILM.mp4",
                 "assets/media/tvc/LENSKART SHARK TANK FILM.mp4",
                 "assets/media/tvc/BOAT FILM.mp4",
                 "assets/media/tvc/LENSKART BLUE RAY GLASSES FILM 02.mp4",
                 "assets/media/tvc/INDUS VALLEY FILM.mp4",
                 "assets/media/tvc/AQUALENS CONTACT LENS FILM.mp4",
                 "assets/media/tvc/MAXIMA WATCHES FILM.mp4",
                 "assets/media/testimonials/WOW TESTIMONIAL .mp4"]

    # Photoshoots open on the green-top Aquacolor set (front-facing first)
    PHOTO_LEAD = ["shoot-08", "shoot-09", "shoot-10", "shoot-11"]

    def lead(c):
        v = c.get("video", "").split("#")[0]
        if c["category"] == "vertical" and v in VERTICAL_LEAD:
            return VERTICAL_LEAD.index(v)
        if c["category"] == "tvc" and v in TVC_ORDER:
            return TVC_ORDER.index(v)
        if c["category"] == "photoshoots":
            n = c.get("img", "").rsplit("/", 1)[-1].replace("-560.webp", "")
            if n in PHOTO_LEAD:
                return PHOTO_LEAD.index(n)
        return 99
    ordered = sorted(cards, key=lambda c: (c["category"] == "bts"
                     and "thumbnails/" not in c.get("poster", ""), lead(c)))
    for c in ordered:
        cat = c["category"]
        # The Podcasts tab is retired; its card stays in work.json, unlisted
        if cat == "podcasts":
            continue
        video = c.get("video", "").split("#")[0]
        poster = c.get("poster", "")
        img = c.get("img", "")
        brand = pretty(c.get("brand", "")) or CAT_LABEL.get(cat, "")
        name = pretty(c.get("name", ""))
        sub = c.get("subcat", "") or CAT_LABEL.get(cat, "")
        slogan = c.get("slogan", "")

        if cat == "photoshoots":
            full = img.replace("-560.webp", ".jpg")
            media = (f'<img src="{esc(img)}" alt="{esc(name or "Anava Films photoshoot")}" '
                     f'loading="lazy" decoding="async">')
            shape = "portrait photo"
            lb = f'data-lightbox="{esc(full)}" data-lightbox-type="image" data-caption="Photoshoot &middot; Anava Films"'
            info = ""
        else:
            title = c.get("title") or name
            fmt = c.get("format") or sub
            if video:
                media = (f'<video data-src="{esc(video)}" data-poster="{esc(poster)}" muted loop '
                         f'playsinline preload="none" class="hover-play"></video>')
                # The project write-up rides on the card; anava.js lays it out
                # as a case study around the film when the card is opened.
                lb = f'data-lightbox="{esc(video)}" data-caption="{esc(title)}" {case_attr(c)}'
            elif img:
                media = f'<img src="{esc(img)}" alt="{esc(name)}" loading="lazy">'
                lb = f'data-lightbox="{esc(img)}" data-lightbox-type="image" data-caption="{esc(name)}"'
            else:
                continue
            # One ratio per orientation keeps every row the same height; only the
            # text overlay differs once a card carries designed key art.
            # Event films are shot 9:16, so they belong with the portrait cards.
            # BTS cards are always landscape (16:9) to preserve uniform grid rows.
            shape = "portrait" if (cat in ("vertical", "events") or (c.get("orientation") == "portrait" and cat != "bts")) else ""
            if "thumbnails/" in poster:
                shape = (shape + " has-art").strip()
            d = c.get("duration")
            dur = f'<span class="wcard-dur" aria-label="Duration">{d // 60}:{d % 60:02d}</span>' if d else ""
            info = f"""{dur}
      <div class="wcard-info">
        <div>
          <h3 class="wcard-title">{esc(title)}</h3>
          <div class="wcard-cat">{esc(fmt)}</div>
        </div>
        <span class="circ-arrow">{PLAY}</span>
      </div>"""
            idx += 1

        search = " ".join([brand, name, sub, slogan, c.get("title", ""), CAT_LABEL.get(cat, "")]).lower()
        out.append(f"""
    <article class="wcard {shape}" data-category="{cat}" data-sub="{esc(c.get('subcategories',''))}"
             data-search="{esc(search)}" {lb}>
      {media}{info}
    </article>""")
    return "\n".join(out)


# ---------------------------------------------------------------- pages
def page_work():
    # Sub-filters that need their own running order: [lightbox path, position].
    # The page's JS moves these cards into place when that filter is chosen.
    SUB_ORDERS = esc(json.dumps({
        "vertical|performance": [["assets/media/vertical-films/lenskart-performance-50.mp4", 6]],
        "vertical|social|product": [["assets/media/tvc/FIKN ELIXIR FILM 04.mp4", 1],
                                    ["assets/media/vertical-films/THUMBS UP X ZAID DARBAR FILM.mp4", 2],
                                    ["assets/media/tvc/FILN PERFUME FILM.mp4", 3]],
    }))
    # One stage under the title that plays the horizontal TVCs in turn: each
    # film's thumbnail holds for 5s, then it plays muted, then the next one.
    # anava.js drives it from this list; the markup starts on the first film.
    first = "assets/media/tvc/LENSKART HUSTLER AD FILM.mp4"
    tvcs = [c for c in cards if c["category"] == "tvc" and c.get("video")]
    tvcs.sort(key=lambda c: c["video"].split("#")[0] != first)
    playlist = []
    for c in tvcs:
        v = c["video"].split("#")[0]
        brand = re.sub(r"\s*\(.*?\)", "", c.get("client") or c["title"]).strip()
        playlist.append({
            "v": v,
            "p": c.get("poster", ""),
            "t": brand, "cap": c["title"],
            "case": {k: c[k] for k in CASE_KEYS if c.get(k)},
        })
    f0 = playlist[0]
    playlist_json = json.dumps(playlist, ensure_ascii=False).replace("</", "<\\/")
    features = f"""
      <button class="wh-film wh-stage" type="button" data-lightbox="{esc(f0['v'])}" data-caption="{esc(f0['cap'])}" {case_attr(card_for(f0['v']))}>
        <img class="wh-poster" src="{esc(f0['p'])}" alt="" fetchpriority="high">
        <video class="wh-video" muted playsinline preload="none" aria-hidden="true"></video>
        <span class="wh-film-play" aria-hidden="true">{PLAY}</span>
        <span class="wh-film-tag"><b>01</b><i class="wh-sep">|</i><span class="wh-film-name">{esc(f0['t'])}</span></span>
        <span class="wh-progress" aria-hidden="true"><i></i></span>
      </button>
      <script type="application/json" id="wh-playlist">{playlist_json}</script>"""
    filters = f"""
  <div class="filter-bar">
    <div class="pills" role="group" aria-label="Filter work by category">
      <button class="pill active" data-filter="tvc">TVCs / Digital</button>
      <div class="pill-drop">
        <button class="pill" type="button" aria-controls="vertical-types">Vertical</button>
        <div class="drop-menu">
          <button data-filter="vertical">All Vertical</button>
          <button data-filter="vertical" data-sub="performance">Performance Ads</button>
          <button data-filter="vertical" data-sub="social|product">Social &amp; Product Content</button>
        </div>
      </div>
      <button class="pill" data-filter="events">Events</button>
      <button class="pill" data-filter="bts">BTS</button>
      <button class="pill" data-filter="testimonials">Testimonials</button>
      <button class="pill" data-filter="photoshoots">Photoshoots</button>
    </div>
    <span class="pill-ink" aria-hidden="true"></span>
  </div>
  <div class="sub-pills" id="vertical-types" role="group" aria-label="Vertical: filter by type" hidden>
    <button type="button" class="sub-pill" data-filter="vertical">All Vertical</button>
    <button type="button" class="sub-pill" data-filter="vertical" data-sub="performance">Performance Ads</button>
    <button type="button" class="sub-pill" data-filter="vertical" data-sub="social|product">Social &amp; Product Content</button>
  </div>"""

    return HEAD.format(**ASSET_V,
        title="Our Work — ANAVA FILMS",
        desc="Selected films, TVCs, vertical content, performance campaigns and photoshoots by Anava Films."
    ) + header("work.html") + f"""
<section class="work-hero">
  <div class="wh-deco" aria-hidden="true">
    <div class="wh-glow"></div>
    <div class="wh-grid"></div>
    <div class="wh-p" style="--d:-18"><i class="wh-ring wh-ring-l"></i></div>
    <div class="wh-p" style="--d:22"><i class="wh-ring wh-ring-r"><b class="wh-orbit"></b></i></div>
    <div class="wh-p" style="--d:10"><i class="wh-ring wh-ring-s"><b class="wh-orbit"></b></i></div>
    <div class="wh-p" style="--d:30"><i class="wh-dot wh-dot-1"></i><i class="wh-dot wh-dot-2"></i></div>
    <div class="wh-p" style="--d:14"><i class="wh-cross wh-cross-1"></i><i class="wh-cross wh-cross-2"></i></div>
    <div class="wh-p" style="--d:8"><i class="wh-line wh-line-1"></i><i class="wh-line wh-line-2"></i><i class="wh-line wh-line-3"></i></div>
    <div class="wh-p" style="--d:6"><i class="wh-corner wh-corner-tl"></i><i class="wh-corner wh-corner-tr"></i></div>
  </div>
  <div class="container">
    <div class="wh-head">
      <span class="wh-eyebrow">Our Work</span>
      <h1 class="wh-title"><span class="wm"><span>Ideas</span></span> <span class="wm"><span>That</span></span> <span class="wm"><span>Make</span></span> <span class="wm"><span>An</span></span> <span class="wm wm-impact"><span class="wh-impact">Impact.</span></span></h1>
      <p class="wh-lead">A selection of films, campaigns, content and collaborations we&rsquo;ve created with brands, artists and partners.</p>
      <button class="btn btn-primary wh-cta" type="button" data-lightbox="assets/media/tvc/LENSKART HUSTLER AD FILM.mp4" data-caption="Lenskart &middot; Hustlr">{PLAY} Watch Featured Film</button>
    </div>
  </div>
  <div class="wh-films">{features}
  </div>
</section>

<section class="work-list" style="padding-bottom:90px">
  <div class="work-filters">
    <div class="container">
      {filters}
    </div>
  </div>
  <div class="container">
    <div class="work-grid" id="work-grid" data-view="tvc" data-orders='{SUB_ORDERS}'>
{build_work_cards()}
    </div>
    <p class="empty-state" id="work-empty" hidden>Nothing in this category yet.</p>
    <div class="load-more-wrap">
      <button class="btn btn-ghost" id="load-more">View more</button>
    </div>
  </div>
</section>

<section style="padding-bottom:90px">
  <div class="container">
    <div class="cta-band compact reveal">
      <div class="cta-band-bg"><img src="assets/images/hero_studio_bg.jpg" alt="" loading="lazy" decoding="async"></div>
      <div class="cta-band-inner">
        <div>
          <span class="eyebrow">Have a project in mind?</span>
          <h2 class="display-sm">Let's Create<br><span class="o">Something Great.</span></h2>
        </div>
        <div>
          <p class="lead">Whether it's a thought, a product or a full brief, we're ready to turn it into something powerful.</p>
          <a href="contact.html" class="btn btn-primary">Let's Talk {BTN_ARR}</a>
        </div>
      </div>
      <div class="script">More<br>Ideas<br>More<br>Films</div>
    </div>
  </div>
</section>
""" + footer("work.html")


# Brand intro film ("From thought to final frame"), home page only, once per
# browser session. The overlay ships visible so the site never flashes before
# it; the inline script drops it straight away for a repeat view, a
# reduced-motion visitor, or a data saver, before anything paints. anava.js
# plays the right cut (1080p landscape, or a native 3:4 centre cut that fills
# portrait screens) with sound where the browser allows it, otherwise muted
# with a "Tap for sound" button; then it fades out. Skip, Esc or a stalled
# video end it early.
INTRO = """
<div class="intro" id="intro">
  <video class="intro-video" aria-hidden="true" playsinline preload="auto"
         data-land="intro/intro-4.mp4?v=2" data-port="intro/intro-4-portrait.mp4?v=2"></video>
  <div class="intro-ctrl">
    <button class="intro-skip" type="button" aria-label="Skip intro">Skip</button>
    <button class="intro-sound" type="button" aria-pressed="false" hidden>Tap for sound</button>
  </div>
  <button class="intro-play" type="button" hidden>Play intro</button>
</div>
<script>
(function () {
  var el = document.getElementById('intro'), seen = false;
  try {
    seen = sessionStorage.getItem('anavaIntro') === '1';
    if (sessionStorage.getItem('anavaIntroReplay') === '1') { seen = false; el.setAttribute('data-replay', '1'); sessionStorage.removeItem('anavaIntroReplay'); }
  } catch (e) {}
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saver = navigator.connection && navigator.connection.saveData;
  if (seen || calm || saver) { el.parentNode.removeChild(el); return; }
  document.documentElement.classList.add('intro-on');
})();
</script>
"""


def page_home():
    # The wide film under the logo lane: the Sunil Shetty x Green Lotus brand
    # film (not a showreel; there is no showreel cut yet). It opens with its
    # case study like any other card.
    REEL_V = "assets/media/tvc/Sunil Shetty AD Landscape.mp4"
    REEL_CASE = case_attr(card_for(REEL_V))
    # Works Wheel: the homepage's selected films. Each entry points at an
    # existing work.json film (video key), its existing thumbnail, and the
    # short title / format / client shown while it is the active film. The
    # ratio is the thumbnail's own frame so nothing is stretched or re-cut
    # beyond the Work page's card crop.
    WHEEL = [
        ("assets/media/tvc/Sunil Shetty AD Landscape.mp4", "assets/images/thumbnails/sunil-shetty-film.jpg",
         "Sunil Shetty", "Brand Film", "Green Lotus", "16/9"),
        ("assets/media/tvc/TIRA X KAREENA KAPOOR FILM.mp4", "assets/images/thumbnails/tira-beauty-kareena.jpg",
         "Kareena Kapoor &times; Tira Beauty", "Brand Film", "Tira Beauty", "16/9"),
        ("assets/media/tvc/LENSKART HUSTLER AD FILM.mp4", "assets/images/thumbnails/lenskart-hustler.jpg",
         "Hustlr", "Commercial Ad Film", "Lenskart", "16/9"),
        ("assets/media/tvc/LK AQUALENS FILM.mp4", "assets/images/thumbnails/lk-aqualens-film.jpg",
         "Aqualens", "Digital TVC", "Lenskart", "16/9"),
        ("assets/media/tvc/LENSKART JOHN JACBOS EYEWEAR (FILM ).mp4", "assets/images/thumbnails/john-jacobs.jpg",
         "John Jacobs", "Commercial Ad Film", "John Jacobs", "16/9"),
        ("assets/media/tvc/BOAT FILM.mp4", "assets/images/thumbnails/boat-brand-film.jpg",
         "boAt", "Brand Film", "boAt", "16/9"),
        ("assets/media/tvc/MAXIMA WATCHES FILM.mp4", "assets/images/thumbnails/maxima-watches.jpg",
         "Maxima Watches", "Brand Film", "Maxima", "16/9"),
        ("assets/media/tvc/LENSKART BLUE RAY GLASSES FILM.mp4", "assets/images/thumbnails/lenskart-blue-ray.jpg",
         "Blue Ray Glasses", "Digital TVC", "Lenskart", "16/9"),
    ]
    WN = len(WHEEL)

    def wheel_item(i, v, img, title, fmt, client, ratio):
        c = card_for(v)
        rw, rh = (int(n) for n in ratio.split("/"))
        orient = "portrait" if rw < rh else "landscape"
        load = 'loading="lazy"'   # below the fold: never compete with the hero image
        plain = re.sub(r"&times;", "x", title)
        return f"""
        <a class="ww-item" href="work" style="--r:{ratio}" data-orient="{orient}" data-i="{i}"
           data-title="{title}" data-meta="{fmt} &middot; {client}"
           data-lightbox="{esc(v)}" data-caption="{esc(c['title'])}" {case_attr(c)}
           aria-label="{plain}, {fmt}, {re.sub(r'&times;', 'x', client)}. Play film">
          <img src="{esc(img)}" alt="{plain}: {fmt} by Anava Films" {load} decoding="async">
        </a>"""

    wheel_html = "".join(wheel_item(i, *w) for i, w in enumerate(WHEEL))
    # Phone filmstrip: small frames under the active film that jump to it.
    # The films above are the focusable, announced controls; this row is a
    # visual shortcut only, so it stays out of the tab order and the a11y tree.
    strip_html = "".join(
        f'\n      <button type="button" class="ww-thumb{" is-on" if i == 0 else ""}" data-i="{i}" tabindex="-1">'
        f'<img src="{esc(w[1])}" alt="" loading="lazy" decoding="async"></button>'
        for i, w in enumerate(WHEEL))

    # A knockout mark — a light shape sitting inside a coloured plate — cannot be
    # flattened to a silhouette: brightness(0) blacks out the light parts too and
    # the whole thing becomes one white blob. These two ship as hand-made white
    # versions instead, and skip the filter.
    KNOCKOUT = {"KFC": "KFC-white", "Simpl ai": "Simpl ai-white"}

    def logo_img(name, extra=""):
        file = KNOCKOUT.get(name, name)
        cls = ("logo-asis " + extra).strip() if name in KNOCKOUT else extra
        c = f' class="{cls}"' if cls else ""
        return f'<img{c} src="assets/Companies logo/{file}.png" alt="{name}" loading="lazy">'

    logos = ["Lenskart", "KFC", "tira", "Indus Valley", "wow skin science", "celio",
             "fikn", "godrej properties", "Simpl ai", "Green LOTUS"]
    marquee = "".join(logo_img(l) for l in logos * 2)

    trusted_order = ["Lenskart", "Indus Valley", "Green LOTUS", "celio", "tira",
                     "godrej properties", "wow skin science", "fikn", "KFC", "Simpl ai"]
    # The list runs twice so the scroll loops seamlessly; the copy is hidden
    # from screen readers so each brand is announced once.
    trusted = ("".join(f"<li>{logo_img(l)}</li>" for l in trusted_order)
               + "".join(f'<li aria-hidden="true">{logo_img(l)}</li>' for l in trusted_order))

    return HEAD.format(**ASSET_V,
        title="ANAVA FILMS — Give us a thought. We'll give you ideas to shoot.",
        desc="Anava Films is an agency-cum-production house in Mumbai and Delhi taking a thought all the way to the final frame."
    ) + INTRO + header("index.html") + f"""
<section class="hero-cine">
  <div class="hero-cine-bg">
    <img src="assets/images/home-hero-stage.jpg" alt="" fetchpriority="high" data-parallax>
    <canvas class="velaris" aria-hidden="true" tabindex="-1" data-velaris
      data-bg="#000000" data-colors="#E4E7EB,#A9AFB7,#4E545C,#060607"
      data-speed="0.5" data-grain="0.12"></canvas>
    <i class="hero-haze" aria-hidden="true"></i>
  </div>

  <div class="container hero-cine-inner">
    <p class="hero-cine-eyebrow hr-eyebrow">An Agency-Cum-Production House</p>
    <h1 class="hero-cine-title">
      <span class="hl-1">Give Us a <em>Thought.</em></span>
      <span class="hl-2">We&rsquo;ll Give You Ideas to Shoot.</span>
    </h1>
    <p class="hero-cine-lead">
      <span class="hero-line hero-line-1">Anava Films is an <span class="nobr">agency-cum-production</span> house bringing ideas to life from first thought to final frame.</span>
      <span class="hero-line hero-line-2">We work across creative direction, ideation, scripting, production and <span class="nobr">post-production</span>,</span>
      <span class="hero-line hero-line-3">turning brand briefs into compelling films, campaigns and content.</span>
    </p>
    <div class="hero-cine-actions">
      <a href="work.html" class="btn btn-primary hero-cta">View Our Work {BTN_ARR}</a>
    </div>
  </div>

  <div class="trusted">
    <div class="trusted-inner">
      <p class="trusted-label">Trusted by brands who dare</p>
      <div class="trusted-marquee" tabindex="0" role="region" aria-label="Brands we have worked with. Hover or focus to pause.">
        <ul class="trusted-logos">{trusted}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section-sm reel-band">
  <div class="container reel-wide">
    <button class="reel" type="button" data-lightbox="{REEL_V}" data-caption="Sunil Shetty &middot; Green Lotus Brand Film" {REEL_CASE}>
      <img class="reel-poster" src="assets/images/thumbnails/sunil-shetty-film.jpg" alt="Sunil Shetty in the Green Lotus brand film" decoding="async">
      <span class="reel-overlay">
        <span class="reel-cta">
          <span class="play-btn">{PLAY}</span>
          <span class="reel-meta">Watch the Film <em>01:03</em></span>
        </span>
      </span>
      <span class="reel-credit">Sunil Shetty &middot; Green Lotus Brand Film</span>
      <span class="reel-mark">Anava Films</span>
    </button>
  </div>
</section>

<section class="phx" aria-labelledby="phx-title">
  <picture class="phx-media">
    <source media="(max-width:760px)" srcset="assets/images/thinkers-set-m.webp" type="image/webp">
    <source srcset="assets/images/thinkers-set.webp" type="image/webp">
    <img src="assets/images/thinkers-band-4k.jpg" alt="Anava Films crew directing a scene on set" width="3200" height="854" loading="lazy" decoding="async">
  </picture>
  <div class="container phx-inner">
    <div class="phx-copy">
      <p class="phx-eyebrow phx-in"><span class="phx-num">01</span><span class="phx-name">Our Philosophy</span></p>
      <h2 class="phx-title phx-in" id="phx-title">Thinkers<br class="phx-br"> Who <span class="o">Make.</span></h2>
      <p class="phx-lead phx-in">Anava Films sits somewhere between an agency and a production house. We believe great ideas shouldn&rsquo;t get lost between the people who think them and the people who make them.</p>
      <a href="about.html" class="btn btn-ghost phx-cta phx-in">About Anava {BTN_ARR}</a>
    </div>
  </div>
</section>

<section class="ww" aria-labelledby="ww-title" data-mode="gallery">
  <div class="ww-pin">
    <div class="ww-frame container">
      <div class="ww-side">
        <div class="ww-head">
          <p class="stays-label ww-label"><b>02</b> Selected Work</p>
          <h2 class="ww-title" id="ww-title">Work That Stays<br>With <span class="o">You.</span></h2>
          <a href="work" class="btn btn-ghost ww-all">All Work {BTN_ARR}</a>
        </div>
        <div class="ww-info" aria-live="polite">
          <p class="ww-count"><span class="ww-num">01</span> / {WN:02d}</p>
          <h3 class="ww-name">{WHEEL[0][2]}</h3>
          <p class="ww-meta">{WHEEL[0][3]} &middot; {WHEEL[0][4]}</p>
          <a class="ww-view" href="work">View Project <span aria-hidden="true">&#8599;</span></a>
          <span class="ww-bar" aria-hidden="true"><i></i></span>
        </div>
      </div>
      <div class="ww-anchor" aria-hidden="true"></div>
    </div>
    <div class="ww-intro" aria-hidden="true">
      <p class="stays-label ww-label"><b>02</b> Selected Work</p>
      <p class="ww-intro-title">Work That Stays With <span class="o">You.</span></p>
      <a href="work" class="btn btn-ghost ww-all" tabindex="-1">All Work {BTN_ARR}</a>
    </div>
    <div class="ww-stage">{wheel_html}
    </div>
    <div class="ww-strip" aria-hidden="true">{strip_html}
    </div>
    <div class="ww-nav" aria-hidden="true">
      <button type="button" class="ww-prev" tabindex="-1">&larr;</button>
      <button type="button" class="ww-next" tabindex="-1">&rarr;</button>
    </div>
  </div>
</section>

<section class="people-bridge">
  <div class="container pb-grid">
    <div class="pb-copy reveal">
      <p class="pb-eyebrow">The People Behind the Work</p>
      <h2 class="pb-title">Thinkers and Makers.<br><span class="o">One Crew.</span></h2>
      <p class="pb-text">The same team that shapes the idea is on set to shoot it.</p>
      <a class="btn btn-ghost pb-link" href="about.html#people">Meet the Team {BTN_ARR}</a>
    </div>
    <div class="pb-people">
      <figure class="pb-person reveal">
        <div class="pb-portrait"><img src="assets/images/jackson_khatri.jpg" alt="Jackson Khatri" loading="lazy" decoding="async"></div>
        <figcaption>
          <h3 class="pb-name">Jackson Khatri</h3>
          <p class="pb-role">Founder &middot; Creative Director</p>
          <p class="pb-line">Started Anava so ideas stop getting lost between the people who think them and the people who make them.</p>
        </figcaption>
      </figure>
      <figure class="pb-person reveal">
        <div class="pb-portrait"><img src="assets/images/anjan_khatri.jpg" alt="Anjan Khatri" loading="lazy" decoding="async"></div>
        <figcaption>
          <h3 class="pb-name">Anjan Khatri</h3>
          <p class="pb-role">Producer &middot; Production Head</p>
          <p class="pb-line">Runs the production backbone: multi-location shoots, crews, budgets and timelines.</p>
        </figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="approach">
  <div class="approach-top">
    <div class="approach-bg" aria-hidden="true"><img src="assets/images/idea-to-impact.jpg" alt="" loading="lazy" decoding="async"></div>
    <div class="container approach-copy reveal">
      <span class="approach-eyebrow">Our Approach</span>
      <h2 class="approach-title">From Idea to <span class="o">Impact.</span></h2>
      <p class="approach-lead">Ideas are everywhere. Impact takes the right people, the right process and the courage to make it real.</p>
      <p class="approach-path"><span>Thought</span><i aria-hidden="true">&rarr;</i><span>Idea</span><i aria-hidden="true">&rarr;</i><span>Film</span></p>
      <a href="process.html" class="btn btn-ghost approach-cta">Explore Our Process {BTN_ARR}</a>
    </div>
  </div>
  <div class="container">
    <div class="acts" data-acts>
      <div class="acts-stage" aria-hidden="true">
        <div class="acts-frame">
          <img class="act-img is-on" src="assets/images/approach-think.jpg" alt="" loading="lazy" decoding="async">
          <img class="act-img" src="assets/images/approach-make.jpg" alt="" loading="lazy" decoding="async">
          <img class="act-img" src="assets/images/approach-finish.jpg" alt="" loading="lazy" decoding="async">
          <span class="acts-words"><span class="act-word is-on">Think</span><span class="act-word">Make</span><span class="act-word">Finish</span></span>
        </div>
        <span class="acts-rail"><i></i></span>
      </div>
      <ol class="acts-list">
      <li class="act is-on" data-act="0">
        <p class="act-num"><b>01</b> <span>Concept</span></p>
        <h3 class="act-title">Think</h3>
        <p class="act-desc">Creative Direction, Ideation &amp; Concept Development, Scripting, Creative Consulting.</p>
        <figure class="act-media"><img src="assets/images/approach-think.jpg" alt="Writer sketching storyboards and a script at a desk" loading="lazy" decoding="async"></figure>
      </li>
      <li class="act" data-act="1">
        <p class="act-num"><b>02</b> <span>Shoot</span></p>
        <h3 class="act-title">Make</h3>
        <p class="act-desc">Production, Direction, Casting (Domestic &amp; International), Art Direction &amp; Production Design.</p>
        <figure class="act-media"><img src="assets/images/approach-make.jpg" alt="Film crew and cameras on a lit set" loading="lazy" decoding="async"></figure>
      </li>
      <li class="act" data-act="2">
        <p class="act-num"><b>03</b> <span>Post</span></p>
        <h3 class="act-title">Finish</h3>
        <p class="act-desc">Editing, VFX, Sound Design, Color Grading, Motion Graphics &amp; Final Delivery.</p>
        <figure class="act-media"><img src="assets/images/approach-finish.jpg" alt="Editor grading a film across three monitors" loading="lazy" decoding="async"></figure>
      </li>
      </ol>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="cta-band compact home-cta reveal">
      <div class="cta-band-bg"><img src="assets/images/hero_studio_bg.jpg" alt="" loading="lazy"></div>
      <div class="cta-band-inner">
        <h2 class="display-sm">Have a Thought Worth <span class="o">Shooting?</span></h2>
        <a href="contact.html" class="btn btn-primary">Let's Talk {BTN_ARR}</a>
      </div>
    </div>
  </div>
</section>
""" + footer("index.html")


def page_process():
    steps = [
        ("01", "Thought", "Start With a Thought.",
         "You bring a thought, brief, product or problem. It could be a single line or a fully detailed idea. We listen, understand and ask the right questions.",
         ["Brief", "Product", "Problem", "Listening", "The right questions"],
         "assets/images/process/process_step_1.jpg", "Your thought.<br>Our starting point."),
        ("02", "Idea", "Turn It Into an Idea.",
         "We explore creative territories, find the right angle and develop a strong, relevant and exciting idea.",
         ["Creative territories", "The right angle", "Idea development", "Relevance"],
         "assets/images/process/process_step_2.jpg", "Ideas<br>that make<br>sense."),
        ("03", "Deck", "Shape the Story.",
         "The idea becomes a visual world — a clear creative deck with mood, references, tone, treatment and execution plan.",
         ["Concept", "Treatment", "Script", "Mood", "Visual references", "Casting", "Locations", "Execution approach"],
         "assets/images/process/process_step_3.jpg", "A clear vision<br>before we roll."),
        ("04", "Pre-production", "Plan Every Detail.",
         "We plan everything required to execute the idea, so shoot day runs smoothly.",
         ["Crew", "Casting", "Locations", "Art direction", "Styling", "Production design", "Schedule", "Equipment", "Logistics"],
         "assets/images/process/process_step_4.jpg", "Prepared<br>for a stronger<br>tomorrow."),
        ("05", "Shoot", "Bring It to Life.",
         "The deck becomes reality. We direct, collaborate with talent and capture the moments that make the story real.",
         ["Direction", "Talent", "Camera", "Lighting", "Sound", "On-set art", "The moments"],
         "assets/images/process/process_step_5.jpg", "Ideas<br>in action."),
        ("06", "Post-production", "Polish the Story.",
         "Editing, sound design, music, colour grading, VFX and final finishing — where the film truly comes together.",
         ["Offline Edit", "Music", "Sound", "Colour", "Online", "VFX", "Mastering"],
         "assets/images/process/process_step_6.jpg", "Where<br>good gets<br>great."),
        ("07", "Delivery", "A Film That Works.",
         "The final idea reaches the audience, ready to make an impact across screens, platforms and audiences.",
         ["The final film", "Formats", "Screens", "Platforms", "Audiences"],
         "assets/images/process/process_step_7.jpg", "From our screen<br>to the world."),
    ]
    # The journey: one pinned composition on wide screens (see anava.js,
    # "Process journey"); each stage is a real <article> in DOM order, with
    # its own frame, so narrow screens and reduced motion simply stack them.
    KEYS = ["thought", "idea", "deck", "pre", "shoot", "post", "delivery"]
    REFS = ["assets/images/approach-think.jpg", "assets/images/thinkers-band-4k.jpg",
            "assets/images/approach-camera.jpg"]
    nav = "".join(
        f'<li><button type="button" data-go="{i}" aria-label="Go to stage {n}: {label}"><b>{n}</b><span>{label}</span></button></li>'
        for i, (n, label, *_rest) in enumerate(steps))
    rows = ""
    for i, (n, label, title, body, chips, img, cap) in enumerate(steps):
        key = KEYS[i]
        items = "".join(f'<li style="--k:{k}"><span>{c}</span><i aria-hidden="true"></i></li>'
                        for k, c in enumerate(chips))
        extra = ""
        if key == "idea":
            extra = '<div class="pj-refs" aria-hidden="true">' + "".join(
                f'<span class="pj-ref pj-ref-{k}"><img src="{r}" alt="" loading="lazy" decoding="async"></span>'
                for k, r in enumerate(REFS)) + "</div>"
        elif key == "pre":
            extra = '<ul class="pj-edge" aria-hidden="true">' + "".join(
                f'<li style="--k:{k}" data-t="{c}"></li>' for k, c in enumerate(chips)) + "</ul>"
        elif key == "shoot":
            extra = '<span class="pj-rec" aria-hidden="true"><i></i>REC</span>'
        load = 'fetchpriority="high"' if i == 0 else 'loading="lazy"'
        rows += f"""
      <article class="pj-stage pj-{key}{' is-on' if i == 0 else ''}" id="stage-{n}" data-i="{i}" style="--n:{len(chips)}" aria-labelledby="stage-{n}-t">
        <div class="pj-text">
          <p class="pj-num"><b>{n}</b><span>{label}</span></p>
          <h2 class="pj-title" id="stage-{n}-t">{title}</h2>
          <p class="pj-body">{body}</p>
          <ul class="pj-items" aria-label="{label}: what it covers">{items}</ul>
        </div>
        <figure class="pj-fig">
          <img src="{img}" alt="{label}" {load} decoding="async">
          <figcaption class="pj-cap">{cap}</figcaption>
          {extra}
        </figure>
      </article>"""

    return HEAD.format(**ASSET_V,
        title="The Process — From Thought to Screen — ANAVA FILMS",
        desc="A clear, collaborative creative process that takes you from a simple thought to a powerful final film."
    ) + header("process.html") + f"""
<section class="hero-split centered pj-hero">
  <div class="container">
    <div class="hero-split-grid">
      <div class="hero-copy">
        <span class="eyebrow">Our Process</span>
        <h1 class="display">From Thought<br>to <span class="o">Screen.</span></h1>
        <p class="lead">A clear, collaborative and creative process that takes you from a simple thought to a powerful final film.</p>
        <div class="hero-actions">
          <button class="play-btn" data-lightbox="assets/media/behind-the-scenes/BTS Think.mp4" data-caption="Our Process &middot; Anava Films">{PLAY}<span class="pb-label">Watch Our Process</span></button>
        </div>
        <a class="pj-cue" href="#process-journey"><span>Scroll to Follow the Process</span><i aria-hidden="true"></i></a>
      </div>
      <div class="hero-media">
        <img src="assets/images/process/from-thought-to-screen.jpg" alt="Anava Films process — From Thought to Screen">
        <div class="hero-script script">Thoughts<br>Ideas<br>Plans<br>Action</div>
        <div class="hero-tag">Same thinking. Different perspective.</div>
      </div>
    </div>
  </div>
</section>

<section class="pj" id="process-journey" aria-label="The process, stage by stage">
  <div class="pj-pin">
    <nav class="pj-nav" aria-label="Process stages">
      <ol>{nav}</ol>
      <span class="pj-rail" aria-hidden="true"><i></i></span>
    </nav>
    <div class="pj-stages">{rows}
    </div>
  </div>
</section>

<section style="padding-bottom:90px">
  <div class="container">
    <div class="cta-band warm reveal">
      <div class="cta-band-bg"><img src="assets/images/hero_dark.jpg" alt="" loading="lazy" decoding="async"></div>
      <div class="cta-band-inner">
        <div>
          <span class="eyebrow">The Result</span>
          <h2 class="display-sm">A Thought Goes In.<br>A Film <span class="o">Comes Out.</span></h2>
        </div>
        <div>
          <p class="lead">Whether it's a product, a problem or a simple thought, we take it all the way — from idea to execution, under one roof.</p>
          <a href="contact.html" class="btn btn-primary">Let's Create Together {BTN_ARR}</a>
        </div>
      </div>
      <div class="script">More<br>Ideas<br>More<br>Films</div>
    </div>
  </div>
</section>
""" + footer("process.html")


def wwd_sections():
    """Think / Make / Finish — once its own page, now a section of About (#what-we-do)."""
    think = [
        ("Creative Direction", "We find the creative thought behind the brief and build a visual direction that gives the idea a clear personality.",
         "assets/media/behind-the-scenes/BTS Think.mp4", "assets/images/posters/bts-think.jpg"),
        ("Ideation &amp; Concept Development", "The brief is only the starting point. We explore creative territories and develop ideas that are exciting, relevant and executable.",
         "", "assets/images/posters/think.jpg"),
        ("Scripting", "From a one-line thought to a complete film script, we develop stories built specifically for the screen.",
         "assets/media/behind-the-scenes/BTS Scripting.mp4", "assets/images/posters/bts-scripting.jpg"),
        ("Creative Consulting", "Brands can approach Anava even before they have a production brief. We help define what the idea could be before deciding how it should be made.",
         "", "assets/images/posters/make.jpg"),
    ]
    make = [
        ("Production", "End-to-end production, shoot management, crew, equipment and execution.",
         "assets/media/behind-the-scenes/BTS Make.mp4", "assets/images/posters/bts-make.jpg"),
        ("Direction", "Turning the idea into performances, frames, visuals and moments.",
         "assets/media/what-we-do/MAKE.mp4", "assets/images/posters/make.jpg"),
        ("Casting", "Domestic and international casting — finding the right talent for the world of each project.",
         "assets/media/behind-the-scenes/BTS International Casting.mp4", "assets/images/posters/bts-international-casting.jpg"),
        ("Art Direction", "Production design, props, styling, colour, sets and the details inside every frame.",
         "", "assets/images/posters/bts-finish-1.jpg"),
    ]
    finish = [
        ("Offline Editing", "Shaping performance, pacing, structure and rhythm — where the shoot becomes a story.",
         "assets/media/behind-the-scenes/BTS Finish 1.mp4", "assets/images/posters/bts-finish-1.jpg"),
        ("Music &amp; Sound", "Music, sound design, ambience and final audio finishing.",
         "assets/media/behind-the-scenes/BTS Finish 2.mp4", "assets/images/posters/bts-finish-2.jpg"),
        ("Colour Grading &amp; Online", "Premium colour grading, online finishing and final picture polish.",
         "assets/media/behind-the-scenes/BTS Colour Grading.mp4", "assets/images/posters/bts-colour-grading.jpg"),
        ("VFX &amp; Mastering", "Compositing &middot; Cleanup &middot; Animation &middot; VFX &middot; Motion &middot; Finishing &middot; Mastering.",
         "assets/media/behind-the-scenes/BTS VFX Mastering.mp4", "assets/images/posters/bts-vfx-mastering.jpg"),
    ]

    def cap_items(items):
        out = ""
        for t, d, v, p in items:
            media = (f'<video data-src="{esc(v)}" data-poster="{esc(p)}" muted loop playsinline preload="none" class="hover-play"></video>'
                     if v else f'<img src="{esc(p)}" alt="{t}" loading="lazy">')
            attrs = f'data-lightbox="{esc(v)}" data-caption="{t}"' if v else ""
            out += f"""
          <article class="svc cap-item" {attrs}>
            <div class="svc-media">{media}</div>
            <div class="svc-body"><h4>{t}</h4><p>{d}</p></div>
          </article>"""
        return out

    # Capabilities: the stage word holds on the left while the three
    # chapters scroll past on the right (anava.js, "About capabilities")
    return f"""
<section class="section wwd-intro" id="what-we-do">
  <div class="container">
    <div class="sec-head">
      <div class="sec-label"><span class="sec-name"><b class="ch-n">02</b> Capabilities</span></div>
    </div>
    <h2 class="display-sm oneline oneline-long" id="caps-title">From Idea to <span class="o">Impact.</span></h2>
    <p class="lead" style="margin-top:14px">End-to-end creative solutions that turn ideas into powerful visual stories &mdash; think, make and finish, all under one roof.</p>
  </div>
</section>

<section class="caps" aria-labelledby="caps-title">
  <div class="container">
    <div class="caps-grid" data-caps>
      <div class="caps-word" aria-hidden="true">
        <span class="is-on">Think<i>.</i></span><span>Make<i>.</i></span><span>Finish<i>.</i></span>
        <b class="caps-rail"><i></i></b>
      </div>
      <div class="caps-body">
        <article class="cap" data-cap="0">
          <span class="cap-num">01</span>
          <h3 class="wwd-title">Think<span class="o">.</span></h3>
          <p class="lead">Before there's a shoot, there needs to be an idea worth shooting. This is where raw ideas turn into shootable stories.</p>
          <div class="cap-list">{cap_items(think)}
          </div>
        </article>
        <article class="cap" data-cap="1">
          <span class="cap-num">02</span>
          <h3 class="wwd-title">Then We <span class="o">Make It Real.</span></h3>
          <p class="lead">From pre-production to the final shot, we bring together the right people, technology and craft to turn ideas into powerful visual experiences.</p>
          <figure class="cap-visual">
            <video data-inview-src="assets/media/what-we-do/MAKE.mp4" poster="assets/images/posters/make.jpg" muted loop playsinline preload="none"></video>
            <figcaption class="cap-side">People<br>Equipment<br>Locations<br>Stories</figcaption>
          </figure>
          <div class="cap-list">{cap_items(make)}
          </div>
        </article>
        <article class="cap" data-cap="2">
          <span class="cap-num">03</span>
          <h3 class="wwd-title">The Shoot Ends.<br class="br-mobile"> The Story <span class="o">Doesn't.</span></h3>
          <p class="lead">Post is where everything comes together. We refine, enhance and elevate the film so it not only looks great, but feels right.</p>
          <div class="phil-media cap-visual" data-lightbox="assets/media/behind-the-scenes/BTS Colour Grading.mp4" data-caption="From cut to craft">
            <video data-src="assets/media/behind-the-scenes/BTS Colour Grading.mp4" data-poster="assets/images/posters/bts-colour-grading.jpg" muted loop playsinline preload="none" class="hover-play"></video>
            <div class="phil-side">From Cut<br>To Craft</div>
          </div>
          <div class="cap-list">{cap_items(finish)}
          </div>
        </article>
      </div>
    </div>
  </div>
</section>
"""


def page_contact():
    return HEAD.format(**ASSET_V,
        title="Got a Thought? — Contact ANAVA FILMS",
        desc="Talk to Anava Films in Mumbai and Delhi. You don't need a finished brief — just give us the thought."
    ) + header("contact.html") + f"""
<section class="ct-hero">
  <div class="container ct-hero-grid">
    <div class="ct-hero-copy">
      <p class="ct-label">Contact</p>
      <h1 class="ct-title">Have a <span class="o">Thought?</span><br>Let&rsquo;s Talk.</h1>
      <p class="ct-lead">You don&rsquo;t need a finished brief, a script or a clear picture of the film. Just give us the thought &mdash; we&rsquo;ll bring the ideas.</p>
    </div>
    <figure class="ct-hero-media" aria-hidden="true">
      <img src="assets/images/director_chair_hero.jpg" alt="" fetchpriority="high">
    </figure>
  </div>
</section>

<section class="ct-main" id="form">
  <div class="container ct-grid">
    <div class="ct-form-wrap">
      <h2 class="ct-h2" id="enquiry-title">Tell Us About the Project</h2>
      <p class="ct-sub">Fields marked <span aria-hidden="true">*</span><span class="sr-only">with an asterisk</span> are required. We usually respond within 24 hours.</p>
      <form id="contact-form" class="ct-form" action="https://formsubmit.co/office@anavafilms.com" method="POST" novalidate aria-labelledby="enquiry-title">
        <input type="hidden" name="_subject" value="New project enquiry — anavafilms.com">
        <input type="text" name="_honey" class="ct-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="ct-fields">
          <div class="ct-field">
            <label for="f-name">Name <span class="req" aria-hidden="true">*</span></label>
            <input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="e-name">
            <p class="ct-err" id="e-name" aria-live="polite"></p>
          </div>
          <div class="ct-field">
            <label for="f-company">Company / Brand</label>
            <input id="f-company" name="company" type="text" autocomplete="organization">
            <p class="ct-err" aria-hidden="true"></p>
          </div>
          <div class="ct-field">
            <label for="f-email">Email <span class="req" aria-hidden="true">*</span></label>
            <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="e-email">
            <p class="ct-err" id="e-email" aria-live="polite"></p>
          </div>
          <div class="ct-field">
            <label for="f-phone">Phone <span class="opt">Optional</span></label>
            <input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="e-phone">
            <p class="ct-err" id="e-phone" aria-live="polite"></p>
          </div>
          <div class="ct-field">
            <label for="f-type">Project Type</label>
            <select id="f-type" name="type">
              <option value="">Choose one</option>
              <option>TVC / Brand Film</option>
              <option>Digital Film</option>
              <option>Vertical / Social Content</option>
              <option>Performance Ads</option>
              <option>Event Film</option>
              <option>Photoshoot</option>
              <option>Production</option>
              <option>Post-Production</option>
              <option>Creative Consulting / Just a Thought</option>
              <option>Other</option>
            </select>
            <p class="ct-err" aria-hidden="true"></p>
          </div>
          <div class="ct-field">
            <label for="f-budget">Budget <span class="opt">Optional</span></label>
            <select id="f-budget" name="budget">
              <option value="">Not sure yet</option>
              <option>Under &#8377;5 Lakh</option>
              <option>&#8377;5&ndash;15 Lakh</option>
              <option>&#8377;15&ndash;40 Lakh</option>
              <option>&#8377;40 Lakh+</option>
            </select>
            <p class="ct-err" aria-hidden="true"></p>
          </div>
          <div class="ct-field full">
            <label for="f-message">Tell Us About the Project <span class="req" aria-hidden="true">*</span></label>
            <textarea id="f-message" name="message" rows="5" required aria-describedby="e-message" placeholder="The thought, the brief, the product or the problem &mdash; whatever you have."></textarea>
            <p class="ct-err" id="e-message" aria-live="polite"></p>
          </div>
        </div>
        <div class="ct-foot">
          <button class="btn btn-primary ct-submit" type="submit"><span class="ct-submit-label">Send Enquiry</span> {BTN_ARR}</button>
          <span class="ct-progress" aria-hidden="true"><i></i></span>
        </div>
        <div id="form-feedback" class="ct-feedback" role="status" aria-live="polite" hidden></div>
      </form>
      <div class="ct-done" id="form-done" tabindex="-1" hidden>
        <p class="ct-done-title">Thought received.</p>
        <p class="ct-done-text">Thank you &mdash; we&rsquo;ll get back to you within 24 hours.</p>
        <button type="button" class="stays-link ct-again">Send another enquiry</button>
      </div>
    </div>

    <aside class="ct-direct" aria-labelledby="direct-title">
      <h2 class="ct-h3" id="direct-title">Direct Contact</h2>
      <dl class="ct-list">
        <div><dt>Email</dt><dd><a href="mailto:office@anavafilms.com">office@anavafilms.com</a></dd></div>
        <div><dt>Phone</dt><dd><a href="tel:+918691924669">Jackson &middot; +91 86919 24669</a><a href="tel:+919911111273">Anjan &middot; +91 99111 11273</a></dd></div>
        <div><dt>Follow</dt><dd class="ct-social"><a href="https://www.instagram.com/anava_films" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://vimeo.com/zackdirect" target="_blank" rel="noopener noreferrer">Vimeo</a><a href="https://www.youtube.com/@anava-films" target="_blank" rel="noopener noreferrer">YouTube</a></dd></div>
        <div><dt>Studios</dt><dd>Mumbai &middot; Delhi</dd></div>
      </dl>
    </aside>
  </div>
</section>

<section class="section-sm">
  <div class="container">
    <div class="loc-head reveal">
      <span class="eyebrow">Visit Us</span>
      <h2 class="display-sm oneline">Our <span class="o">Locations.</span></h2>
      <p class="lead">Come say hello. We're in Mumbai and Delhi.</p>
    </div>
    <div class="loc-grid reveal">
          <div class="loc">
            <div class="loc-bg"><img src="assets/images/mumbai_gateway_bg.jpg" alt="Mumbai"></div>
            <span class="script">Same<br>City<br>Bigger<br>Stories</span>
            <div class="loc-inner">
              <div class="loc-top"><h3>Mumbai</h3></div>
              <p class="loc-detail">Linking Road, Bandra West</p>
              <a class="loc-link" href="https://maps.google.com/?q=Linking+Road+Bandra+West+Mumbai" target="_blank" rel="noopener">Get Directions {ARROW.replace('width="1em" height="1em"','width="14" height="14"')}</a>
            </div>
          </div>
          <div class="loc">
            <div class="loc-bg"><img src="assets/images/delhi_indiagate_bg.jpg" alt="Delhi"></div>
            <span class="script">More<br>Ideas<br>More<br>Films</span>
            <div class="loc-inner">
              <div class="loc-top"><h3>Delhi</h3></div>
              <p class="loc-detail">Saket, New Delhi</p>
              <a class="loc-link" href="https://maps.google.com/?q=Saket+New+Delhi" target="_blank" rel="noopener">Get Directions {ARROW.replace('width="1em" height="1em"','width="14" height="14"')}</a>
            </div>
          </div>
    </div>
  </div>
</section>

<section class="ct-close">
  <div class="container">
    <p class="ct-close-line">Great Ideas Start With a <span class="o">Conversation.</span></p>
    <a class="stays-link ct-close-link" href="mailto:office@anavafilms.com">office@anavafilms.com {DIAG}</a>
  </div>
</section>
""" + footer("contact.html")


def page_about():
    stats = [("50+", "Projects Delivered"), ("8+", "Years of Experience"),
             ("30+", "Creative Professionals"), ("Across", "India")]
    stat_html = "".join(f'<div class="stat"><div class="stat-n">{n}</div><div class="stat-l">{l}</div></div>'
                        for n, l in stats)
    values = [("Think Deep", "We challenge ideas to find what's worth making."),
              ("Work Together", "Thinkers and makers under one roof."),
              ("Make It Real", "From thought to screen, we own the journey."),
              ("Keep It Simple", "Fewer layers. Faster decisions. Stronger outcomes.")]
    # One running line, read as a manifesto; the copy runs twice for a
    # seamless loop and the second pass is hidden from assistive tech
    man = "".join(f'<li><b>{t}.</b> <span>{d}</span></li>' for t, d in values)
    val_html = (f'<ul class="manifesto-line">{man}</ul>'
                f'<ul class="manifesto-line" aria-hidden="true">{man}</ul>')


    return HEAD.format(**ASSET_V,
        title="About &amp; What We Do — ANAVA FILMS",
        desc="Anava Films is an agency-cum-production house: creative direction, ideation, scripting, production, direction and post-production, under one roof."
    ) + header("about.html") + f"""
<section class="hero-split centered">
  <div class="container">
    <div class="hero-split-grid">
      <div class="hero-copy reveal">
        <span class="eyebrow"><b class="ch-n">01</b> Identity</span>
        <h1 class="display display-2line"><span>We Are Not Just a</span><span class="o">Production House.</span></h1>
        <p class="standfirst">A production house gets an idea and figures out how to make it.</p>
        <p class="lead">We like to get involved earlier &mdash; sometimes it's a complete brief, sometimes a problem, sometimes a product, and sometimes just a thought.</p>
      </div>
      <div class="hero-media shift-right reveal">
        <img src="assets/images/about-director-onset.jpg" alt="Anava Films directing team on set">
        <div class="hero-script script">Thinkers<br>Who<br>Make</div>
        <div class="hero-tag">Mumbai &middot; Delhi</div>
      </div>
    </div>
  </div>
</section>

<section class="section-sm">
  <div class="container">
    <div class="wwd-grid wwd-grid-even">
      <div class="reveal">
        <p class="lead">We take that thought, challenge it, shape it and turn it into an idea worth making. Then we make it — from creative direction and ideation to scripting, casting, production, direction and post-production, bringing the creative and executional sides together.</p>
      </div>
      <div class="reveal">
        <p class="lead">That's why we see Anava as an agency-cum-production house. We don't believe in the gap between the people who think and the people who make. At Anava, the people who think are also close to the people who make.</p>
      </div>
    </div>
    <div class="pull-quote reveal">
      <p>&ldquo;Fewer layers. Faster thinking. Better communication. Ideas that are actually made to work on screen.&rdquo;</p>
    </div>
    <div class="stats reveal">{stat_html}</div>
    <div class="manifesto" aria-label="How we work">{val_html}</div>
  </div>
</section>
{wwd_sections()}
<section class="section" id="people" style="padding-top:20px">
  <div class="container">
    <div class="sec-head">
      <div class="sec-label"><span class="sec-name"><b class="ch-n">03</b> People</span></div>
    </div>
    <h2 class="display-sm oneline oneline-long">The People Behind <span class="o">Anava.</span></h2>
    <p class="lead" style="margin-top:14px">Creative vision paired with structured production execution.</p>
    <div class="people people-ed">
      <article class="person reveal">
        <div class="person-img"><img src="assets/images/jackson_khatri.jpg" alt="Jackson Khatri"></div>
        <div class="person-body">
          <div class="person-role">Founder &middot; Creative Director &middot; Producer &middot; Director</div>
          <h3>Jackson Khatri</h3>
          <p>Jackson's journey began with a B.Sc. in Animation &amp; Multimedia, developing a deep understanding of visual storytelling, framing, pacing, and crafting worlds frame by frame.</p>
          <p>Working across assistant direction, scripting, producing and directing, he identified a recurring fracture in the industry: great ideas getting lost in translation between agency thinkers and on-set makers.</p>
        </div>
      </article>
      <article class="person reveal">
        <div class="person-img"><img src="assets/images/anjan_khatri.jpg" alt="Anjan Khatri"></div>
        <div class="person-body">
          <div class="person-role">Producer &middot; Production Head</div>
          <h3>Anjan Khatri</h3>
          <p>As Anava expanded, Jackson's brother Anjan Khatri joined the team as Producer to fortify the production and execution backbone of the company.</p>
          <p>Anjan oversees the complete physical execution machinery — managing complex multi-location shoots, crew assemblies, budgeting and high-efficiency logistical timelines.</p>
        </div>
      </article>
    </div>
    <p class="lead" style="margin-top:26px">Together, Jackson and Anjan ensure that client ideas are both creatively groundbreaking and executively flawless.</p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band compact reveal">
      <div class="cta-band-bg"><img src="assets/images/hero_studio_bg.jpg" alt="" loading="lazy" decoding="async"></div>
      <div class="cta-band-inner">
        <div>
          <span class="eyebrow">Let's create together</span>
          <h2 class="display-sm cta-collab"><span class="cc-1">Want to Collaborate With</span><br><span class="o">Anava?</span></h2>
        </div>
        <div>
          <p class="lead">Give us a thought. We'll give you ideas to shoot.</p>
          <a href="contact.html" class="btn btn-primary">Let's Talk {BTN_ARR}</a>
        </div>
      </div>
      <div class="script">Ideas<br>Into<br>Action</div>
    </div>
  </div>
</section>
""" + footer("about.html")


def page_404():
    return HEAD.format(**ASSET_V,
        title="Page Not Found — ANAVA FILMS",
        desc="This page doesn't exist on anavafilms.com."
    ).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"', 1) + header("") + f"""
<section class="nf">
  <div class="container">
    <p class="nf-code"><b>404</b>Page Not Found</p>
    <h1 class="nf-title">This Scene Didn&rsquo;t Make <span class="o">the Cut.</span></h1>
    <p class="nf-lead">The link may be old or mistyped. Everything we make is a click away.</p>
    <div class="nf-actions">
      <a href="index.html" class="btn btn-primary">Back to Home {BTN_ARR}</a>
      <a href="work.html" class="btn btn-ghost">See Our Work {BTN_ARR}</a>
    </div>
  </div>
</section>
""" + footer("")


def absolute_paths(markup):
    """The 404 page is served at any URL depth, so every local path starts at the root."""
    return re.sub(r'(\s(?:src|href|poster|data-poster|data-src))="(?![a-z]+:|/|#)', r'\1="/', markup)


PAGES = {
    "index.html": page_home,
    "work.html": page_work,
    "process.html": page_process,
    "about.html": page_about,
    "contact.html": page_contact,
}

def clean_urls(markup):
    """Rewrite internal page links to the extensionless form .htaccess serves."""
    markup = markup.replace('href="index.html"', 'href="/"')
    for page in PAGES:
        if page == "index.html":
            continue
        markup = markup.replace(f'href="{page}"', f'href="{page[:-5]}"')
        markup = markup.replace(f'href="{page}#', f'href="{page[:-5]}#')
    return markup


SITE = "https://anavafilms.com"
SHARE_IMAGE = SITE + "/assets/images/home-hero-stage.jpg"


def social_meta(markup, fn):
    """Canonical URL plus Open Graph / Twitter tags, from the page's own title and description."""
    title = re.search(r"<title>(.*?)</title>", markup, re.S).group(1)
    desc = re.search(r'<meta name="description" content="(.*?)">', markup, re.S).group(1)
    url = SITE + ("/" if fn == "index.html" else "/" + fn[:-5])
    tags = (f'\n<link rel="canonical" href="{url}">'
            f'\n<meta property="og:type" content="website">'
            f'\n<meta property="og:site_name" content="Anava Films">'
            f'\n<meta property="og:title" content="{title}">'
            f'\n<meta property="og:description" content="{desc}">'
            f'\n<meta property="og:url" content="{url}">'
            f'\n<meta property="og:image" content="{SHARE_IMAGE}">'
            f'\n<meta name="twitter:card" content="summary_large_image">')
    anchor = f'<meta name="description" content="{desc}">'
    return markup.replace(anchor, anchor + tags, 1)


if __name__ == "__main__":
    for fn, builder in PAGES.items():
        path = os.path.join(ROOT, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(social_meta(clean_urls(builder()), fn))
        print("wrote", fn, os.path.getsize(path) // 1024, "KB")
    path = os.path.join(ROOT, "404.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(absolute_paths(clean_urls(page_404())))
    print("wrote 404.html", os.path.getsize(path) // 1024, "KB")
