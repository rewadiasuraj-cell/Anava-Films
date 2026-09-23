# Anava Films — notes for Claude

See `BUILD.md` for how the site is generated. The root `.html` files are
built by `python3 build_anava.py`; edit the generator, not the output.

## Target devices

The owner reviews every change on these three devices. Check all three
(screenshots) before pushing any design change:

| Device | Viewport (CSS px) | Scale | Notes |
|---|---|---|---|
| iPhone 15 | 393 × 852 | 3x | burger menu, phone rules (`max-width:760px`) |
| iPad 9th gen, landscape | 1080 × 810 | 2x | full nav, desktop layout |
| Desktop 1080p | 1920 × 1080 | 1x | large-desktop rules (`min-width:1600px`) |

Preview with `npm start` (http://localhost:3000). When screenshotting in a
sandboxed Chromium, make sure Google Fonts actually load (Archivo, Inter,
Playfair Display) or the type will not match the live site. That Chromium
also has no H.264, so site videos will not play there even though they do
in Safari and Chrome.
