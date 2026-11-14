# 0007. The brand is a package; logos and photos stay in one public folder

- Status: Accepted; event photos superseded by 0008
- Date: 2026-11-13

## Context
The website (`apps/site`) is the second app, so the brand moves to
`packages/` as ADR 0004 planned. The brand's components reference logos and
photos by URL (`/assets/logo/...`), and Astro serves exactly one `public/`
folder per app.

## Decision
`packages/brand` holds the tokens (`styles.css`), the components, the pixel
icons and the dither, consumed as raw source by both apps. Logos, speaker
photos and event photos stay in `apps/branding/public/`; the site serves that
same folder (`publicDir` in its Astro config) so both apps resolve the same
URLs.

## Consequences
Renaming or removing a file in `apps/branding/public/` affects agnteng.com
too. Everything in that folder is public on both domains, which it already
was. Moving the assets into the package would mean importing every logo as a
module and changing what the decks render; that is left until a third app
needs it.
