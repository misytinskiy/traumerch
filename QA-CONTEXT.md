# QA context: image pipeline and catalog caching

Written for someone picking this up cold to run hand tests. Covers what changed,
how it is meant to work, what is already known to be broken, and what to check.

Base commit before any of this work: `743d030`.
Current head on dev (`misytinskiy/traumerch`, branch `main`): `74c731c`.

Site under test (dev stand, public, no auth): https://traumerch.vercel.app

---

## 1. What changed, in order

### 1.1 Marketing images moved into a slot registry

Every non-product image on the site used to be a hardcoded path in JSX, in
`locales/*.json`, or in a component-local array. They are now addressed by a
stable key.

- `content/slots.ts` — registry of **105 slots**: key, human label, page group,
  the original `/public` path they came from, nominal aspect ratio, `sizes`.
- `content/media.json` — slot key → `{ src, w, h, focal?, variants[] }`.
- `components/Media/MediaImage.tsx` — renders a plain `<img>` with
  `srcset`/`sizes`, and `object-position` when the slot has a focal point.

`MediaImage` deliberately does **not** set `object-fit` inline. CSS classes own
that (`contain` for logos, `cover` for photos), and `OurTeam.module.css` also
sets its own `object-position`. Writing either inline shifts those frames.

### 1.2 Marketing images compressed

`scripts/optimize-media.mjs` runs the whole registry through sharp: EXIF-rotate,
resize to what the layout needs, encode WebP, write up to three widths per slot
into `public/media/<slot-key>/<content-hash>-<width>.webp`.

216 MB of originals became ~20 MB. The originals were deleted from the working
tree — they are still in git history at `743d030` if a re-run at different
settings is ever needed:

```bash
git checkout 743d030 -- public/
npm run media:optimize
npm run media:prune -- --apply
```

Filenames carry a content hash, so replacing a photo changes the filename. That
is why `/media/*` is served `immutable` in `next.config.ts`.

Density targets live in `scripts/optimize-media.mjs`: 2x for desktop layout
widths, 3x for mobile ones. Phones are almost universally 3x; treating them as
2x is what made the mobile mosaic look soft at first.

### 1.3 Root layout stopped reading cookies

`app/layout.tsx` called `cookies()` only to choose `de`/`en` for `<html lang>`.
In a root layout that makes **every page** render on demand. Removing it made
everything except `/design` prerendered.

This is the single biggest change for perceived speed. Before: ~1200ms TTFB on
every page. After: 106-305ms with `x-vercel-cache: HIT`.

### 1.4 Catalog served from a cached snapshot

`server/products/catalogSnapshot.ts`. Airtable is queried at most once per
`CATALOG_TTL_SECONDS` (**300s**) and the result is shared by all visitors.

Before: 6 Airtable calls per visit (3 server render + 3 client revalidation).
After: 3 calls per 5 minutes regardless of traffic.

Three things keep the catalog alive when Airtable is not:
- the API token is read *inside* the cached function, not passed as an argument
  (`unstable_cache` derives its key from arguments, so a changed token used to
  mean a cache miss at exactly the wrong moment);
- an empty Airtable response throws and is never cached;
- the API answers `stale-if-error=86400`.

### 1.5 Product photos proxied by attachment id

Airtable attachment URLs expire after ~2 hours. Attachment **ids** do not — they
change only when the photo is replaced.

`/api/product-photo/{recordId}/{attachmentId}/original` resolves the current
Airtable URL from the cached snapshot (zero API calls) and returns the bytes with
an `immutable` header. `next/image` sits on top and produces the display sizes.

The same route also answers a numeric width (`/640`) and resizes with sharp. No
component uses that path any more; it is left as an escape hatch.

Converted: catalog grid, `/design` gallery, cart sidebar, both quote pages.

---

## 2. Known broken / unresolved

### 2.1 Images fail on a cold first load  — CONFIRMED, NOT FIXED

Reported from a real browser: first load of `/catalog` showed broken image icons
with alt text; a refresh fixed it.

Reproduced from a script — 32 distinct product images requested concurrently
through the optimizer:

```
through /_next/image : 31 ok, 1 failed (fetch error), median 1256ms, max 2380ms
direct to the proxy  : 32 ok
```

The proxy itself is fine. The failure is the optimizer fetching from it under
concurrent cold load. Likely cause: the proxy returns the **untouched original**,
which for a typical product is a 888 KB PNG, and it fetches those same 888 KB
from Airtable first. Thirty-two of those at once on a cold edge is a lot of work.

Candidate fix, not implemented: have the proxy return a capped, WebP-encoded
master (say max 1600px at quality 92, roughly 80 KB) instead of the raw original.
The optimizer then fetches something small, and nothing visible is lost because
no slot renders above that width.

### 2.2 Cache hit rate is uneven

Repeating one image URL on the dev stand gave `HIT / MISS / HIT`. Vercel warms
each edge separately, so the first visitor in a region still pays full price.

### 2.3 `/design` ships dead URLs

The page still serializes the raw Airtable record as its initial payload, so
about sixteen expiring URLs travel in the HTML. Nothing renders from them — the
gallery has always drawn itself after hydration — so this is weight, not
correctness.

### 2.4 Pre-existing test failures — NOT caused by this work

`tests/product-info.test.tsx` and `tests/quote-contact-submit.test.tsx` fail, and
`tests/product-tabs.test.tsx` hangs, blocking `npm test` entirely. All three
behave identically at `743d030`, verified in a separate worktree.
`product-info` asserts on a `background-image` div the component has not had for
a long time.

### 2.5 Dead code

`components/Promise/Promise.tsx`, `components/PromiseDesign/PromiseDesign.tsx`
and `components/ProductInfo/ProductInfo.tsx` are not imported anywhere. The first
two point at `/frame2.png`, which does not exist.

### 2.6 Alt text

30 of the 34 Inspiration tiles have alt text of the form `Inspiration photo 12`.
That is what was in the markup before; it was not invented here, but it is not
useful either.

---

## 3. Local setup

```bash
npm install
# .env.local needs AIRTABLE_LINK, API_TOKEN, AIRTABLE_CATALOG_VIEW_ID
npm run dev          # http://localhost:3000
npm run build && npx next start -p 3200
```

**`next start` on Windows serves images unoptimized** — `/_next/image` returns the
source untouched, at full size and original format. Anything about image sizing
or format has to be checked against the deployment, not locally. This cost an
hour of chasing a phantom.

Helper scripts:

```bash
npm run media:verify     # every slot resolves to files that exist
npm run media:optimize   # re-run compression (needs originals restored first)
npm run media:prune      # delete sources nothing references (--apply to act)
```

---

## 4. What to hand-test

### 4.1 The cold-load failure (highest value)

The bug in 2.1 is the one a visitor actually notices. Conditions that matter:
a fresh edge, no warm cache, many images at once. Worth trying from several
networks and locations, and with DevTools throttling, since it did not reproduce
from a warm browser session.

Check: are broken images accompanied by a failed request, and what status?

### 4.2 Image quality

The proxy used to resize from Airtable's 512px thumbnail instead of the original.
Fixed — but verify by eye, not by trusting this document:

- `/design?product=<id>` main photo on a retina screen, which renders around
  520 CSS px and therefore wants ~1040 device pixels
- catalog cards at desktop and at phone width
- flat graphics, where compression artifacts show first: client logos on the
  home page, product photos that are mostly one colour

Known ceiling: some sources are simply small. `inspirationPage/1.png` is 780px
wide and `services/1/5.jpg` is 960px. Those cannot improve without new uploads.

### 4.3 Marketing image framing

`MediaImage` changed how these render. Look for shifted crops rather than
missing images:

- team portraits on the home page — their CSS pins the crop to the bottom edge
- client logos — `object-fit: contain`, so stretching would be obvious
- Inspiration bento grid at desktop and phone width — 34 tiles, several aspect
  ratios
- the mobile mosaic under each service block, especially the wide third image

### 4.4 Catalog freshness

Prices and stock now update within 5 minutes rather than instantly. Change
something in Airtable and time it. Deleting a record is the weak case — nothing
in the current design detects a deletion faster than the next full refresh.

### 4.5 Catalog resilience

The catalog is supposed to survive Airtable being unavailable. Verified once by
building with deliberately broken credentials: all 207 records still served.
Worth re-checking after any change to `catalogSnapshot.ts`.

### 4.6 Regression surface

Cart, `/quote`, `/quote/contact`, `/quote/view` and `/conf` all render product
photos through the proxy now. The quote form submits attachments to Airtable —
that path was not touched but shares `fetchAirtable`.

---

## 5. Rollback

Dev repo (`misytinskiy/traumerch`):
- `backup/pre-catalog-cache` and tag `pre-catalog-cache` → `8a43621`
- `backup/pre-media-migration` and tag `pre-media-migration` → `743d030`

Production repo — **do not push there**, that repository is off limits by
standing instruction:
- `backup/pre-media-migration` and tag `pre-media-migration-prod` → `c44e0cf`

Fastest rollback is Instant Rollback in the Vercel dashboard; it needs no git.
