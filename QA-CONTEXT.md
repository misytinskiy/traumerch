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

### 2.0 Body reads had no timeout — FIXED

In `/api/product-photo`, `clearTimeout` sat in a `finally` right after `fetch`
resolved, which is when headers arrive. The ~888 KB body was then read with no
time limit at all, so a stalled connection hung until the platform killed the
function. Found in independent review, not by testing. Now the abort controller
covers the body read, and a timeout answers 504 instead of hanging.

**The same pattern is still present in `server/airtable/airtable.ts`.**
`fetchAirtable` clears its timer in a `finally` and hands the `Response` back to
callers, who call `.json()` on it afterwards — outside any timeout. Airtable
payloads are small enough that the function's own duration limit is the backstop,
so this is latent rather than urgent, but it sits in the catalog snapshot path
and should be fixed properly rather than left.

### 2.0a Timeout fix returned the wrong status — FIXED

The first version of the fix computed `aborted` for the message but left the
status hardcoded at 504, so a dropped connection reported a gateway timeout.
Now `aborted ? 504 : 502`. Verified against a local server that stalls the body
and one that destroys the socket: 200 / 504 / 502 respectively.

`fetchAirtable` is fixed too — it buffers the response body while its own timer
is still armed and hands callers an already-read Response, so `.json()` outside
the function no longer runs unbounded.

### 2.0b Client payload regression — FIXED

Adding `imageUrlOriginal` / `hoverImageUrlOriginal` to the record type put 414
expiring Airtable URLs back into the catalog HTML, because `ClientProduct` and
`stripPhotoUrls` were not updated with them. Caught by measuring the served page,
not by types. Catalog HTML went 270 KB → 145 KB once excluded.

### 2.0c Too many optimizer variants — FIXED

`sizes` on the large cards resolved to `w=3840` against sources around 1000px, so
the optimizer produced a separate cache entry that returns the same pixels.
`deviceSizes` trimmed from eight values to `[640, 828, 1080, 1920]` and
`imageSizes` to `[96, 128, 256, 384]`. Fewer variants means each is warmed more
often, which is the whole problem in 2.1.

### 2.1 Images fail on a cold first load  — CONFIRMED, CAUSE UNPROVEN

Reported from a real browser: first load of `/catalog` showed broken image icons
with alt text; a refresh fixed it.

Reproduced from a script — 32 distinct product images requested concurrently
through the optimizer:

```
through /_next/image : 31 ok, 1 failed (fetch error), median 1256ms, max 2380ms
direct to the proxy  : 32 ok
```

An independent second run did **not** reproduce the failure — 32/32 succeeded,
all `MISS`, median 2616ms and max 3198ms through the optimizer, using unique
source URLs to defeat the existing cache. Direct proxy calls in that run peaked
at 11 seconds, though they ran after the optimizer had already warmed things, so
they were not fully cold either.

So: the failure is real and was seen in a browser, but its cause is **not
established**. Heavy sources are a plausible contributor, not a proven one.
Whether the infrastructure itself was cold is also not controlled for in either
run. The body-read timeout in 2.0 is a better candidate than source size, since it
produces exactly this signature — one request out of many hanging.

**It not recurring will not prove it was the cause.** The fix bounds a hang; it
does not make a fetch succeed. Closing this needs a browser-side error paired
with a matching server log for the same request, not an absence of complaints.

A third independent run was inconclusive for a different reason: 21/32 through
the optimizer and 30/32 direct, with the failures being connection errors,
client-side timeouts and one closed socket on the tester's own link to Vercel.
Every response that did arrive was `200`. No 504 was ever observed. Results from
a run with that much client-side noise cannot be attributed to the proxy or the
optimizer either way.

A capped WebP master was considered and is **not** clearly a win: it shrinks only
the proxy→optimizer hop. The original still has to come down from Airtable, a
re-encode is added on every miss, and "no visible loss at quality 92" cannot be
promised in advance — it has to be looked at.

The structural alternative, if runtime work keeps being the problem: pre-generate
product photos into static storage on a schedule, the way marketing images are
handled, and drop the runtime hops entirely. That is real work and should only be
started if the current path stays slow after 2.0.

**Observed in the wild after 2.1b shipped.** The owner reported seeing a broken
image, then the photo appearing about half a second later. That is the retry
firing — `RETRY_DELAY_MS` is 500 — which means the failure happens routinely on
a cold load, not rarely. It also means the Vercel logs should now contain
`"tag":"photo-client"` with `"outcome":"recovered"` for each one.

Cause still not proven, but 2.1c gives it a concrete, measured suspect.

### 2.1a Diagnostics for the cold-load failure — ADDED

Both halves of the evidence now get recorded, so the next occurrence can be
attributed instead of guessed at.

**Server side** — `/api/product-photo` writes one JSON line per failure, and per
success slower than 3000 ms. Fast successes write nothing: the catalog is
hundreds of photos per page, and a line each would bury the one event that
matters.

```
{"tag":"photo","requestId":"3bbb0bda","recordId":"rec...","attachmentId":"att...",
 "width":"original","stage":"resolve","outcome":"not-found","status":404,
 "ms":1034,"resolveMs":1034,"fromSnapshot":false}
```

`stage` says how far it got (`resolve` / `fetch` / `encode`), `outcome`
separates a timeout from an upstream error, `sourceHost` says where the bytes
were coming from, and `retry` marks a browser's second attempt so a retry is not
mistaken for an independent failure. Every response also carries
`x-photo-request-id`.

**Browser side** — a single capture-phase listener on `window` sees every image
error on the site, including `next/image`, `MediaImage` and plain tags, without
touching any call site. It reports `currentSrc`, the page path, timing and
whether the image recovered, by `sendBeacon` to `/api/image-diagnostics`.

The two halves join on `recordId` / `attachmentId`, which the endpoint parses out
of the reported URL. Verified end to end against a real product photo.

**Nothing sensitive is written.** Every logged string passes through
`server/diagnostics/redact.ts`, which strips whole URLs (Airtable's signed links
are the thing being protected), `pat*` / `key*` tokens, `Bearer` headers, and all
control characters — the last so a hostile request body cannot forge extra log
lines. Covered by tests, including one asserting a signed URL never reaches the
log while its host still does.

### 2.1b One bounded retry — ADDED

A failed image is retried exactly once, after 500-2000 ms of jitter. The jitter
matters: if thirty images fail together on a cold load, a synchronised retry
recreates the load that may have caused it.

The retry parameter is appended to the **inner** `url` of `/_next/image`, not to
`/_next/image` itself, so the optimizer and the proxy both see a new key and the
retry actually reaches the source instead of returning the same cached failure.
`srcset` is rewritten alongside `src`, otherwise the browser keeps choosing from
the old candidates and the new `src` is ignored.

This does not establish the cause and is not meant to. What it gives is the
distinction the logs were missing: `recovered` means a transient failure,
`failed` means a persistent one.

### 2.1c The sources were 2048px PNGs — FIXED

Measured across all 32 photos on `/catalog`, pulled through the proxy:

```
формат              png, все 32, 2048x2048, без прозрачности
на фото             медиана 1.4 МБ, максимум 4.2 МБ
на одну загрузку    41-42 МБ
```

So on a cold load the Vercel optimizer had to pull ~42 MB through our functions
to hand the browser a couple of MB of WebP. That is the "первичка берёт время"
the owner reported, and it is a far better candidate for the intermittent
failures than anything examined before.

`/original` is replaced by `/master`, which returns WebP instead of the untouched
bytes:

```
оптимизатор тащил   42.0 МБ   (1345 KB на фото)
теперь тащит         6.4 МБ   ( 205 KB на фото)
```

**Resolution is deliberately not reduced.** Capping width here would resample
twice — once in the proxy, once in the optimizer. The 2048 cap is a guard against
a future 4000px upload, not a downscale of what exists. Quality is 92 rather than
the 88 used for width variants, because the optimizer compresses this a second
time and headroom on the first pass is cheaper than loss on the second.

Quality was checked before shipping, not assumed. On the most detailed photo in
the catalog, comparing what a visitor gets now against what they got before:

```
сейчас, вариант 828px   120 KB
через мастер 2048 q92   117 KB   расхождение 0.85/255 в среднем, макс 16
```

0.85/255 is a third of a percent. A four-way side-by-side of the woven texture,
rope handle and embroidered logo showed nothing distinguishable. The earlier note
in this document calling a capped WebP master "not clearly a win" was written
without these numbers and was wrong — the source being PNG is what changes the
arithmetic.

**The URL had to change.** Serving different bytes from `/original` would have
left the old PNGs sitting in the optimizer and CDN caches for up to 31 days.
`/original` still works, as a debugging path to the untouched source and so an
already-open tab does not get a 400.

One-time cost: the first load after this deploys is cold for every photo, since
the source URL the optimizer keys on has changed.

### 2.1d The optimizer was doubling the work — REMOVED from the photo path

Measured on the dev deployment, width 640, everything cold, three runs:

```
                    поштучно              пачкой в 32 (как делает браузер)
через оптимизатор   847 / 824 / 870 мс    2005 / 1825 / 1950 мс
напрямую из прокси  385 / 416 / 440 мс     689 /  519 / 1000 мс
вес на выходе       17-22 КБ              15-20 КБ
```

The sequential figure is the clean one — no concurrency, no saturated link — and
it reproduced 3/3. **The optimizer roughly doubles per-image latency and returns
an image of the same size.** It is a second hop and a second encode: we compress
the source to WebP, it decompresses that WebP and compresses it again.

`productPhotoLoader` is passed to every product `<Image>`, so next/image still
builds the srcset and picks the width, but the URLs point straight at the proxy.
`/_next/image` no longer appears in the catalog markup at all (checked: 0
occurrences, 220 direct proxy URLs).

The earlier justification for routing through the optimizer — "its cache is
global and long-lived, ours would need warming" — was wrong. Both are the same
Vercel CDN with the same number of keys; our responses already carry
`Cache-Control: immutable`.

**Known imprecision.** Next generates srcset descriptors from its own
`deviceSizes`/`imageSizes`, and the loader snaps them to the proxy's widths, so
a `384w` entry can serve a 640px file. Rounding is deliberately upward: the
image can be larger than the slot, never smaller, so this cannot cause blur. It
was left alone rather than aligned by changing `deviceSizes`, because that
setting is global and other components (Footer, QuoteOverlay, ConfLandingPage)
still use the optimizer.

**Not established: whether this fixes the broken images.** Concurrent runs showed
2-3 failures through the optimizer and 0 direct on two runs — but the third run
failed on both paths and took 10s per batch, which means the tester's own link
was the variable there. Latency is measured; failure attribution is not. The
`photo-client` counts in the logs are what will answer it.

### 2.0d Empty catalog could be baked into the build — FIXED

`/catalog` is prerendered, and `getCatalogSnapshot` deliberately never throws —
it returns an empty list when Airtable is unreachable. Together that meant a
failed fetch during `next build` was baked into a static page: the deploy
succeeded and shipped an empty catalog, which then served until revalidation.

Observed on roughly every other local build. One build produced a 276 KB
prerender with products; the next produced 22 KB with none, no error logged.

`CatalogPage` now throws during `phase-production-build` if the snapshot is
empty. A failed deploy is fixable by retrying; a shipped empty catalog is not.
Verified by building with deliberately broken credentials — the build stops with
an explicit message.

### 2.0e Cache-layer failure emptied the catalog — FIXED

`unstable_cache` only works inside the Next runtime and throws
`Invariant: incrementalCache missing` outside it. That was landing in the outer
catch, so a failure of the *caching layer* looked exactly like *no products*.
Now it falls back to loading directly: lose the cache, not the data. This is also
what made `tests/api-airtable-products.test.ts` fail.

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
both behave identically at `743d030`. `product-info` asserts on a
`background-image` div the component has not had for a long time.

`npm test` runs to completion again. Everything below this line is the record of
how the hang was found, because the earlier entry here was wrong about it.

### 2.4-a `product-tabs` hang — FIXED, and it was a real defect

Earlier this document claimed the hang was "not test logic — the worker process
exits", and that it reproduced under `jsdom` and `--pool=threads`. That was
wrong. It is an infinite render loop, and it is in the component.

`ProductTabs` had:

```tsx
useEffect(() => {
  setActivatedHoverImageIds([]);
}, [allRecords, activeTab]);
```

`[]` is a fresh array every call, so React never sees the state as unchanged.
`allRecords` derives its identity from whatever SWR returns. The moment SWR's
result is not reference-stable, this becomes render -> effect -> setState ->
render, forever.

The third test in the file uses `mockImplementation` returning a new object per
call, while the first two use `mockReturnValue`. That is why only that one hung —
and why the first faithful-looking reproduction attempt passed in 21 ms and
nearly led to the wrong conclusion a second time.

In production the loop does not run, because real SWR returns a stable object.
That is luck, not design: the component was one refactor away from spinning in
the browser. Fixed by bailing out instead of always allocating:

```tsx
setActivatedHoverImageIds((current) => (current.length === 0 ? current : []));
```

Same behaviour, no update when there is nothing to clear. `product-tabs` now
passes in 51 ms, and `npm test` needs no `--exclude`.

### 2.4a New coverage

`tests/fetch-with-deadline.test.ts` and `tests/airtable-fetch.test.ts` cover the
defect class that got through twice: successful read, body stalling after
headers, connection dropped mid-body, 204 with no body, non-2xx passed through,
Airtable retry after 429, and no retry on a 4xx. Both run against a local server
in the default node environment, so they stay out of the DOM trouble above.

The bounded-fetch logic now lives in `server/http/fetchWithDeadline.ts` and is
used by both the photo proxy and `fetchAirtable`, so there is one implementation
to test rather than two copies to keep in step.

`tests/image-diagnostics.test.ts` (21) covers redaction, the retry-URL builder
and the reporting endpoint. The redaction cases are the important ones: a signed
Airtable URL must not survive into a log line, and a newline in a request body
must not be able to forge one.

`tests/product-photo-route.test.ts` (6) drives the proxy end to end with a
mocked source: request id header, timeout mapped to 504 with stage and timings
recorded, dropped connection mapped to 502, browser retry marked, and — the
point of the exercise — the signed URL and the token absent from the log while
the source host is still present.

The route now reads its query from `request.url` rather than `nextUrl`, so it can
be called with a plain `Request` and needs no Next wrapper to test.

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

Since 2.1a, this no longer depends on catching it live. Open `/catalog` cold,
then read the Vercel runtime logs and filter:

- `"tag":"photo"` — server-side failures and slow successes. Look at `stage`,
  `outcome`, `fetchMs`, `sourceStatus`.
- `"tag":"photo-client"` — what the browser actually saw. `"outcome":"recovered"`
  means the retry worked (transient); `"outcome":"failed"` means it did not.

The two join on `recordId` / `attachmentId`. **The useful case is a
`photo-client` line with no matching `photo` line**: that means the request never
reached the function, which points at the optimizer or the network rather than at
the proxy — and that is exactly the question three concurrency runs failed to
settle.

An absence of `photo-client` lines over a period with real traffic is weak
evidence the problem is gone, and still not proof of what caused it.

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
