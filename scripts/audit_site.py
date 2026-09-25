#!/usr/bin/env python3
"""Static source/asset audit for Anava's generated HTML and portfolio."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
PAGES = ("index.html", "work.html", "process.html", "about.html", "contact.html", "404.html")
ASSET_ATTRS = {"src", "href", "poster", "data-poster", "data-src", "data-land", "data-port"}
errors = []
checks = 0


def local_path(raw, from_file):
    raw = raw.strip()
    if not raw or raw.startswith("#") or raw.lower().startswith(("data:", "mailto:", "tel:", "javascript:", "//")):
        return None
    url = urlsplit(raw)
    if url.scheme or url.netloc:
        return None
    clean = unquote(url.path)
    if not clean:
        return None
    if clean == "/":
        return ROOT / "index.html"
    path = (ROOT / clean.lstrip("/")) if clean.startswith("/") else (from_file.parent / clean)
    if not path.suffix and not path.is_file():
        path = path.with_suffix(".html")
    return path


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name
        self.ids = []
        self.h1 = 0
        self.images = 0

    def handle_starttag(self, tag, attrs):
        global checks
        vals = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        if vals.get("id"):
            self.ids.append(vals["id"])
        if tag == "img":
            self.images += 1
            if "alt" not in vals:
                errors.append(f"{self.name}: image missing alt: {vals.get('src', '?')}")
        if tag in ("script", "img", "video", "source", "a", "link", "iframe"):
            for key, value in attrs:
                if key not in ASSET_ATTRS or not value:
                    continue
                target = local_path(value, ROOT / self.name)
                if target is None:
                    continue
                checks += 1
                if not target.is_file():
                    errors.append(f"{self.name}: missing {key}={value}")

for name in PAGES:
    source = (ROOT / name).read_text(encoding="utf-8")
    p = Page(name)
    p.feed(source)
    if p.h1 != 1:
        errors.append(f"{name}: expected one h1, found {p.h1}")
    for id_, total in Counter(p.ids).items():
        if total > 1:
            errors.append(f"{name}: duplicate id {id_} ({total} occurrences)")
    print(f"{name}: {p.h1} H1, {p.images} images, {len(p.ids)} IDs")

css = ROOT / "assets/css/anava.css"
for ref in re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", css.read_text(encoding="utf-8")):
    target = local_path(ref, css)
    if target is None:
        continue
    checks += 1
    if not target.is_file():
        errors.append(f"anava.css: missing url({ref})")

cards = json.loads((ROOT / "work.json").read_text(encoding="utf-8"))
for i, card in enumerate(cards, start=1):
    for key in ("video", "poster", "img"):
        if not card.get(key):
            continue
        target = local_path(card[key], ROOT / "work.json")
        if target is None:
            continue
        checks += 1
        if not target.is_file():
            errors.append(f"work.json record {i}: missing {key}={card[key]}")

print(f"Checked {checks} local references across {len(PAGES)} pages, CSS and {len(cards)} portfolio records.")
if errors:
    for issue in errors:
        print("ERROR:", issue)
    sys.exit(1)
print("Static website asset and semantic checks passed.")
