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
