# LiftDuels legal pages

Privacy Policy, Terms of Use and account deletion page of the LiftDuels app (English and Serbian), served by GitHub Pages:

- https://kostadokosic.github.io/liftduel-legal/privacy.html (`sr/privacy.html`)
- https://kostadokosic.github.io/liftduel-legal/terms.html (`sr/terms.html`)
- https://kostadokosic.github.io/liftduel-legal/delete-account.html (`sr/delete-account.html`)

When the texts change in a way users must agree to again, bump `LEGAL_VERSION` in the app (`src/lib/legal.ts`).

## Invite links (LDK-91, LDK-92)

- `invite/index.html`: landing page for friend invite links, `https://liftduels.app/invite/?u=<username>`. It opens `gymduels://invite/<username>` or sends the visitor to the store; no tracking, no external requests. `invite.html` redirects to it (older links).
- `.well-known/apple-app-site-association`: iOS universal links for `/invite`. `.nojekyll` is needed so GitHub Pages serves `.well-known`.
- `.well-known/assetlinks.json`: Android App Links for `https://liftduels.app/invite` with two SHA-256 fingerprints, the Play app signing key and the upload key (Play Console, App signing). Add the new fingerprint if the signing key is ever changed.
- The app side is documented in the app repo (`docs/invites.md`).

## Marketing site (LDK-94)

`liftduels.app` is a static marketing site: landing page (`/`, `/sr/`) and a presentation for gyms (`/gyms/`, `/sr/gyms/`).

- Edit the texts in `site/copy.en.json` and `site/copy.sr.json`, which screen goes where in `site/images.json`, alt texts in `site/alts.json`, structured data in `site/jsonld.json`.
- Run `node scripts/build-site.mjs` (no dependencies): it writes `index.html`, `sr/index.html`, `gyms/index.html`, `sr/gyms/index.html`, `sitemap.xml`, `robots.txt` and `llms.txt`. Commit the generated files: GitHub Pages serves the branch as is. Do not edit the generated HTML by hand.
- Style: `css/site.css` (one file), `js/site.js` (reveal on scroll, nothing else), font `fonts/archivo-var.woff2`. No cookies, no trackers, no third party requests.
- Images in `assets/` are made from the app screens by `scripts/site-assets.mjs` in the app repo (status bar cropped, personal data checked); `assets/img-index.json` lists their sizes. Only claim in the copy what the app does today; unbuilt features are labelled "In development".
- Everything in this repo is public: keep private notes out of it.
