# How this site is built

Every `.html` file at the repo root is **generated**. Do not hand-edit them —
the next build overwrites your changes.

    python3 build_anava.py

That regenerates all five pages from:

- `build_anava.py` — page structure and copy
- `work.json` — the 83 work cards (category, video path, poster, brand, name)

`assets/css/anava.css` and `assets/js/anava.js` are edited directly; they are
not generated.

## Layout

    index.html work.html process.html about.html contact.html
    assets/css/anava.css      one stylesheet, no framework
    assets/js/anava.js        one script, no dependencies
    assets/media/             video by category (tvc, vertical-films,
                              event-films, behind-the-scenes, testimonials)
    assets/images/thumbnails/ designed key art for work cards
    assets/images/posters/    frame grabs used where there is no key art
    assets/Companies logo/    client marks, keyed for a black background

`build_anava.py` resolves its directory automatically and reads `work.json`
beside it. Run `python build_anava.py` after changing page content, then
`npm run build` to package the generated pages and assets into `dist/`.
Run `npm start` to preview at http://localhost:3000.

## Rules that are easy to break

- **Internal links are extensionless** (`href="work"`, not `work.html`).
  Cloudflare Workers static assets and the live site's `.htaccess` both serve
  them. `clean_urls()` in the generator enforces this; don't undo it.
- **Cloudflare Workers rejects any file over 25 MiB.** Two clips were
  re-encoded to fit. Check with `find assets -type f -size +25M` before pushing.
- **Logo marks are pre-processed.** Their neutral-dark ink was lightened so
  they read on the black strip; coloured marks were left untouched. Don't
  replace them with originals from elsewhere.
- Headings marked `.oneline`, `.oneline-long`, `.display-1line` and
  `.display-2line` are `white-space: nowrap` and sized off the viewport so
  they hold their line count. On phones (max-width 760px) the section
  headings are allowed to wrap, because at that width nowrap shrank them
  below body size.

## Local integration

The redesign ZIP has been merged into this project, retaining existing media.
Files replaced during the merge are saved under `.backups/`. The original
ZIP contents are under `.update-staging/`; neither directory enters `dist/`.

The contact form uses the existing FormSubmit destination. Success and error
handling were tested with mocked responses; live email delivery was not tested.

The project is connected to `https://github.com/rewadiasuraj-cell/Anava-Films`.
The redesign is maintained on `codex/website-redesign` for review before merging
into `main`. The ZIP's deployment script was not executed.

For Cloudflare Pages Git integration, select the desired branch, framework
`None`, build command `npm run build`, and output directory `dist`.
