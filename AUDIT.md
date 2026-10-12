# Sneaker Site Audit

## 1. Project Summary

- Stack: Vite 8 + TypeScript (strict) + GSAP ScrollTrigger + Lenis smooth scroll, self-hosted Fontsource fonts (Bricolage Grotesque, Anton, DM Sans). No framework, no 3D library.
- Structure: `index.html` + `src/main.ts` wiring 11 section modules (`src/sections/*.ts`), shared libs (`src/lib/`), all copy in `src/data/site.json`, all asset paths in `src/data/assets.generated.json`. Single static page, previewed via `vite preview` on port 4173.
- Animation: scroll-scrubbed 72-frame WebP turntable drawn on `<canvas>` (hero, `frameplayer.ts`), scroll-scrubbed `currentTime` videos (anatomy), pinned circle-wipe colorway swaps, diagonal-wipe anime roster swaps with speedlines/ink/flash overlays, parallax angles, plus a velocity-reactive marquee.
- Assets: 72-frame hero sets (desktop 1000px/3.4MB, mobile 560px/1.5MB), 4 base stills, 4 showcase MP4s (~21MB total), 6 colorways (2000x1200), 5 anime pairs, FX ink/speedlines/halftone/city-night. Total `public/assets` = 30.1MB in 176 files.
- State: builds clean (`tsc + vite build`), 0 console errors and 0 failed requests in Chromium at all tested viewports, existing Playwright QA passes 8/8 with `?qa=1`.

## 2. Overall Verdict

- Overall score: 5/10
- Scores: Design 7/10 | Animation 6/10 | Performance 4/10 | UX 5/10 | Accessibility 6/10 | SEO 5/10 | Code 7/10
- Honest verdict as lead dev: I would not ship this to a client today. The first colorway every visitor sees (COTTON CANDY) renders with fully transparent copy, and the CTA is unreadable on every dark colorway — the conversion section is broken on arrival, not just unpolished. On top of that the preloader blocks on ~3.4MB of hero frames with no skip, so the experience starts with the worst possible first impression on real networks. The craft is real (zero console errors, strong art direction split between pastel and manga acts, thorough reduced-motion fallbacks), but three Critical issues have to be fixed before this is presentable, and the anime roster's use of copyrighted characters while claiming "Original characters" is a honesty problem that must be resolved before any public portfolio launch.

## 3. What's Already Good

- Clean boot: `npm run build` passes (`tsc --noEmit` + vite, 38 modules, JS 183KB/65KB gzip, CSS 30KB/7.2KB gzip). Verified by running the build.
- Zero console errors/pageerrors and zero failed (4xx/5xx) requests at 375/768/1366/1920px in Chromium (verified with instrumented Playwright probes, `?qa=1`).
- No horizontal overflow at any QA checkpoint on any viewport (`scrollWidth <= innerWidth`, verified at ~35 checkpoints per viewport).
- Thoughtful scroll-engineering details: `ScrollTrigger.config({ ignoreMobileResize: true })` (`src/lib/engine.ts:8`), `svh` with `100vh` fallbacks throughout `sections.css`, DPR capped at 2 with a 1600px canvas cap (`src/lib/frameplayer.ts:40-46`), velocity-adaptive hard-cut instead of smear on fast scroll (`src/lib/frameplayer.ts:83`).
- Preloader failure path exists: frames retry once, failures are replaced by nearest neighbour (`src/lib/preload.ts:90-110`), total failure falls back to a static image with a `console.warn` (`src/sections/preloader.ts:69-72`, `src/sections/hero.ts:111-118`).
- Reduced-motion coverage is genuinely comprehensive: static fallbacks for hero/anatomy/colors/anime/angles, Lenis left stopped (native scroll), digit/countdown/form animations gated on `prefersReduced` (`src/sections/drop.ts:91`, `src/sections/preloader.ts:89`).
- Accessibility foundations: single `h1`, skip link to `#drop`, canvas has `role="img"` + `aria-label`, good alt coverage on product images, visible `:focus-visible` 3px outline (verified 3px `rgb(123,92,224)` on focus), `aria-pressed` on swatches/minis, honeypot + `role="alert"` error on the form.
- Art direction split works: soft pastel act (hero/anatomy/angles/colorways) vs hard dark manga act (roster/drop) feel like two intentional worlds, and the swap mechanics differ per section as specced (circle wipe vs diagonal ink wipe).
- Honest concept framing in most places: "Concept project. No products are for sale." + "Demo form. Nothing is sent or stored." (`src/data/site.json:83-86`).
- Long-term caching header for versioned assets in `vercel.json:3-7` (`Cache-Control: public, max-age=31536000, immutable` on `/assets/*`).

## 4. Issues

### Critical

### [ISS-001] First colorway copy is invisible (transparent text)
- **Severity:** Critical
- **Category:** Design
- **Location:** `src/sections/colors.ts:54-55` (initial `--c-text`), `src/sections/colors.ts:199` (GSAP `--c-text` tween), `src/styles/sections.css:751-755` (`#colors { color: var(--c-text) }`); visible on the Colorways section at first hold, all viewports
- **Problem:** At `colors-hold-1` the computed `color` of the eyebrow, counter, color name, tagline (and specs) is `rgba(0, 0, 0, 0)` — fully transparent. Verified via Playwright `getComputedStyle` at 1440x900 AND 390x844 after scrolling to `colors-hold-1` and waiting 2500ms (past all scrub smoothing), plus screenshots `audit/verify-colors-hold1-1440.png` showing only the shoe and swatch dots with an empty content column. Items 2-6 render text correctly, so this hits 100% of visitors on the first (default) colorway.
- **Why it matters:** The product section's headline, description, specs and CTA are all missing on first view. It reads as a broken site, and it is the section that is supposed to sell the product.
- **Suggested fix:** Stop tweening the CSS variable with GSAP. Drive `--c-bg` AND `--c-text` from the ScrollTrigger `onUpdate` with plain JS color interpolation (same pattern as `setBg` in `src/sections/anatomy.ts:161-174`): compute `k = floor(t)`, `frac = t - k`, set both vars every update from `items[k]`/`items[k+1]`. Remove the `tl.to(section, { "--c-text": ... })` tween. Then assert with a probe: at each `colors-hold-N`, `getComputedStyle(name).color` must equal the item's `text` color and contrast against the bg layer must be >= 4.5:1.
- **Effort:** M

### [ISS-002] Colorways CTA is unreadable on dark colorways (stale `--c-bg`)
- **Severity:** Critical
- **Category:** Design
- **Location:** `src/sections/colors.ts:54` (`--c-bg` set once, never updated), `src/styles/sections.css:927-931` (`.c-cta { background: var(--c-text); color: var(--c-bg); }`), `src/styles/sections.css:922-925` (swatch ring also uses stale `--c-bg`)
- **Problem:** `--c-bg` is set to the first colorway's bg (`#EADFFB`) at init and never changes, while `--c-text` is tweened per step. At `colors-hold-6` (CHROME NOIR) the CTA computes to background `rgb(243,243,247)` with text `rgb(234,223,251)` — roughly a 1.2:1 ratio, confirmed in screenshots (`qa/desktop-22-colors-hold-6.png`, `audit/verify-colors-hold6-1440.png`, mobile equivalents) where the pill is a pale blob with invisible text. Same staleness makes the active swatch ring the wrong color on every step after the first.
- **Why it matters:** The only conversion CTA in the product section cannot be read on half the colorways, including the dark ones where it matters most.
- **Suggested fix:** Same fix as ISS-001: set `--c-bg` per step in the same `onUpdate` interpolator. Add a probe asserting CTA contrast >= 4.5:1 at every `colors-hold-N`.
- **Effort:** S

### [ISS-003] Preloader blocks on ~3.4MB of hero frames with no skip or timeout
- **Severity:** Critical
- **Category:** Performance
- **Location:** `src/sections/preloader.ts:31-60` (critical set = 3 fonts + all 72 hero frames), `src/lib/preload.ts:53-111` (`loadHeroFrames`, 8 concurrent fetch->blob->ImageBitmap)
- **Problem:** First paint of any content waits for the full hero frame set: desktop 3493KB / mobile 1551KB (`src/data/assets.generated.json:4-15`), plus a forced minimum 1200ms delay (`preloader.ts:75`). Measured FCP 1840ms on localhost (resource timing probe); on 3G-class networks this is tens of seconds of branded spinner with count-only progress (no bytes, no skip). There is no timeout, no "continue with poster" path, and no `Save-Data` respect. Total page weight is 30.1MB / 176 files / ~110 requests.
- **Why it matters:** Bounce risk before the site is ever seen; the heaviest part of the page gates the lightest (headline + CTA weigh bytes).
- **Suggested fix:** Release the preloader after frame 1 + every 6th frame + fonts (or after N seconds, whichever first), start the hero canvas immediately, and stream the remaining frames in the background (suspend scrub detail until loaded; reuse the existing nearest-neighbour filler). Show byte-based progress, add a 8-10s timeout that falls back to the static image, and skip preloading the idle `queueIdle` set + videos when `Save-Data` is on. Verify with throttled (Fast 3G) runs: time-to-readable-hero-copy < 5s.
- **Effort:** L

### High

### [ISS-004] Mobile Colorways CTA is clipped below the fold
- **Severity:** High
- **Category:** UX
- **Location:** `src/styles/sections.css:1003-1030` (mobile `.c-content`), `src/sections/colors.ts:108-130` (content stack order)
- **Problem:** At 390x844 the CTA's box is y=841 h=52 (measured), i.e. its bottom edge (893px) sits below the 844px pinned viewport. Screenshots `qa/mobile-12..22` and `audit/verify-colors-hold1/6-390.png` show the CTA half-cut or missing at the bottom edge. The pinned section is exactly `100svh` with no internal scroll, so on small phones the primary conversion button is unreachable.
- **Why it matters:** Mobile users cannot tap the section's CTA — the conversion path is physically cut off.
- **Suggested fix:** Compact the mobile stack (smaller `.c-name` clamp, tighter tagline/specs margins, smaller shoe/stage heights) until eyebrow->CTA fits in 100svh at 360x640 worst case, or convert the mobile colorways beat to a short vertical flow instead of a pinned overlay. Probe-assert CTA `bottom <= innerHeight` at 360x640 and 390x844 for all six holds.
- **Effort:** M

### [ISS-005] Anime swap midpoint is a near-full-white flash (photosensitivity + jank read)
- **Severity:** High
- **Category:** Animation
- **Location:** `src/sections/anime.ts:371-372` (`flash` to 0.85), combined with `speed` opacity 1 (`:350`) and `ink` 0.95 (`:351`) in the same 0.168 window
- **Problem:** Screenshot `qa/desktop-24-anime-swap-1.png` is an almost entirely white frame with halftone dots — the scrub passes through flash 0.85 + speedlines 1.0 + ink 0.95 simultaneously on every one of the 5 swaps. It reads as a glitch frame rather than an impact frame, and full-screen white flashes are a WCAG 2.3.1 three-flashes concern for sensitive users (mitigated only for `prefers-reduced-motion` users, who get the static fallback).
- **Why it matters:** Perceived as flicker/broken on fast scroll; exclusionary for photosensitive users.
- **Suggested fix:** Cap the flash peak at ~0.3, stagger the three layers (speedlines up first, ink mid, flash as a 1-frame spike only), and verify by screenshotting every `anime-swap-N` checkpoint: no frame may be >60% near-white pixels. Keep swap energy via the existing skew/blur/travel instead.
- **Effort:** S

### [ISS-006] Desktop colorways copy overlaps the shoe image
- **Severity:** High
- **Category:** Design
- **Location:** `src/styles/sections.css:792-838` (`.c-stage`/`.c-shoe` geometry) vs `src/styles/sections.css:840-904` (`.c-content` at `left: 62vw`)
- **Problem:** At 1440x900 (`qa/desktop-14-colors-hold-2.png`, `qa/desktop-22-colors-hold-6.png`) the spec bullets render on top of the shoe photograph (e.g. "Visible air-cushion heel" over the midsole), dropping text contrast (white on light-grey shoe) and looking like a layering bug rather than intentional overlap.
- **Why it matters:** Body copy legibility + premium feel; overlapping product photography with list text reads as a mistake.
- **Suggested fix:** Narrow the shoe (`width: min(44vw, 100svh)`), move content to `left: 64vw; width: 30vw`, and/or add a soft radial scrim behind `.c-content`. Screenshot-verify holds 1-6 at 1366 and 1920: no glyph pixels may intersect shoe pixels (sample via screenshots).
- **Effort:** M

### [ISS-007] ~21MB of showcase video is pulled in as soon as Anatomy nears
- **Severity:** High
- **Category:** Performance
- **Location:** `src/lib/preload.ts:126-142` (`rootMargin: 100% 0px 100% 0px` upgrades all videos two viewports early), `src/sections/anime.ts:195` (`ink` uses `preload="auto"` at page load), `public/assets/showcase/*` sizes: sole-pushin 4.1MB, side-glide 5.4MB, exploded 4.7MB, laces-detail 6.8MB
- **Problem:** Four clips totalling ~21MB begin loading when Anatomy is still up to two viewports away — on mobile that is most of a data plan for content the user may never reach. The 446KB ink clip (`preload="auto"`) and 315KB city-night image load at initial page load (both seen in the top resource-timing list) despite living 5+ screens down.
- **Why it matters:** Data cost + main-thread/network contention with the hero frame stream; the heaviest bytes on the page have the loosest loading discipline.
- **Suggested fix:** Tighten video upgrade margin to `25%`, set `preload="none"` on ink until the anime trigger nears, `loading="lazy"` the city-night bg, and re-encode showcase clips to <= 4MB each (lower CRF/720p for the mobile path) or serve a poster-only mode on `Save-Data`/small screens. Re-run the pipeline budget check from BUILD_SPEC Phase 2 (each showcase clip <= 6MB — laces-detail at 6.8MB already exceeds it).
- **Effort:** M

### [ISS-008] Idle pre-decode of all below-fold stills risks hundreds of MB of image memory
- **Severity:** High
- **Category:** Performance
- **Location:** `src/main.ts:39-49` (`queueIdle` of 6 colors + 10 anime + 4 base + FX), `src/lib/preload.ts:114-123` (`img.decode()` on all of them), `src/lib/preload.ts:53-111` (72 held `ImageBitmap`s: ~185MB desktop / ~60MB mobile estimated at 4B/px)
- **Problem:** After idle, the app forces decode of 16 large stills (2000x1200 colorways ≈ 9.6MB decoded each; 10 anime stills; 4 base stills) whether or not the user scrolls there, on top of 72 held canvas frames. Combined with 4 scrubbed videos this can exceed 500MB on a full scroll — an iOS Safari tab-kill risk. Verified by code read (decode calls are unconditional) + file dimensions from the manifest.
- **Why it matters:** Crashes and evictions on the exact low-end phones the mobile frame set was built for.
- **Suggested fix:** Decode lazily per section (IntersectionObserver ~50% margin, nearest 2 colorways/anime items only), drop the blanket `queueIdle` image list (keep FX halftone/speedlines which are tiny), and downscale color/anime sources or use `createImageBitmap` with `resizeWidth` for the displayed size. Memory-probe on a mid-tier Android via `performance.measureUserAgentSpecificMemory` (where available) or DevTools heap snapshots before/after.
- **Effort:** M

### [ISS-009] Several text/background pairs fail WCAG contrast
- **Severity:** High
- **Category:** A11y
- **Location:** `src/data/site.json:56` (TOMATO SODA `#F4776E`/white ≈ 2.7:1), `src/styles/sections.css:254-260` (gradient H1 on light bg), anime rail label white on `#F07931`/`#59B27B` primaries (≈ 2.6-2.9:1, `src/styles/sections.css:1210-1215`), `src/styles/sections.css:1623-1625` (placeholder at 50% white)
- **Problem:** TOMATO SODA body copy at ~2.7:1 (needs 4.5:1; even the large name at ~2.7:1 misses 3:1). The gradient "THE STORY." H1 is decorative-light on near-white. The vertical "THE ROSTER" rail label (13px) sits on fully saturated orange/green bg layers. Ratios computed via standard relative luminance; failures confirmed visually in `qa/desktop-14-colors-hold-2.png` (washed-out white on coral).
- **Why it matters:** Real users cannot read product copy; fails WCAG AA, the bar this project claims.
- **Suggested fix:** Per-item text colors chosen for contrast (not just brand feel) — e.g. deep ink text on TOMATO, dark rail label chip with translucent backing, solid-ink H1 option or darker gradient stops, placeholder at >= 70% white. Re-check every `site.json` bg/text pair + anime `text`-on-`deep` + rail with an automated contrast pass over `assets.generated.json` palettes.
- **Effort:** M

### [ISS-010] No site navigation on mobile (links hidden, no menu)
- **Severity:** High
- **Category:** UX
- **Location:** `src/styles/sections.css:59-62` (`.nav-links { display: none }` ≤1023px), `src/sections/header.ts:17-24`
- **Problem:** Below 1024px the header shows only the wordmark + CTA. There is no hamburger, no anchor row, nothing — verified in `qa/mobile-00-hero-0.png` and `audit/mobile-375-*.png`. A phone user can never jump to Anatomy/Colors/Roster except by long manual scroll (through ~25 screens of pinned content).
- **Why it matters:** Navigation is a baseline expectation; hiding it with no replacement strands mobile users.
- **Suggested fix:** Add a minimal menu (hamburger opening a full overlay with the 4 `site.nav` links, focus-trapped, Escape closes) reusing `header.ts`'s existing `go()` smooth-scroll. Must work with Lenis stopped state and `prefersReduced`.
- **Effort:** M

### [ISS-011] Footer claims "Original characters" while the roster uses Naruto/Itachi/Sasuke/Zoro/Gojo likenesses and names
- **Severity:** High
- **Category:** UX
- **Location:** `src/data/site.json:97` (`"Original characters. Concept project, not a real store."`), `src/data/assets.generated.json:121-222` (slugs `naruto/itachi/sasuke/zoro/gojo`), roster screenshots (`qa/desktop-23/25-anime-hold-*.png`)
- **Problem:** The characters are recognizably third-party IP (names derived from slugs via `displayName` in `src/lib/data.ts:147-150`). Telling visitors — and potential employers viewing a portfolio piece — that they are original is factually wrong and, if published as-is, an IP-reputation risk.
- **Why it matters:** Credibility and legal hygiene of a portfolio piece; one screenshot of "NARUTO — Original characters" undermines trust.
- **Suggested fix:** Either replace the five pairs with genuinely original characters (new slugs, names, palettes) or relabel honestly ("Fan-art concept tribute. Not affiliated with ...") and drop the "Original characters" line. Do not ship the current combination of names + disclaimer.
- **Effort:** S (copy) / L (replacement art)

### [ISS-012] Header CTA degrades to borderless text on dark sections
- **Severity:** High
- **Category:** Design
- **Location:** `src/styles/components.css:1-16` (`.btn` always ink bg), `src/styles/sections.css:31-35` (dark header theme)
- **Problem:** On anime/roster/drop/footer (dark header), the ink pill sits on a near-black blurred header so only the text reads — compare the crisp black pill in `qa/desktop-00-hero-0.png` with the floating text in `qa/desktop-33-anime-roster.png` / `desktop-34-drop.png`. Measured: CTA bg `rgb(13,11,20)` on header `rgba(13,11,20,.45)` over dark content.
- **Why it matters:** Primary CTA loses its affordance exactly where conversion CTAs appear ("Pre-order this pair" context).
- **Suggested fix:** Theme-aware CTA: `[data-theme="dark"] .header-cta { background: var(--paper); color: var(--ink); }`. Screenshot-verify the header on hero (light), marquee (dark), anime, and drop.
- **Effort:** S

### [ISS-013] Custom anime snap is untested — QA runs with it disabled
- **Severity:** High
- **Category:** Animation
- **Location:** `src/sections/anime.ts:447-482` (idle-timer `lenis.scrollTo` snap; dormant when `qa=1` per `:457`), `scripts/qa.mjs` (always uses `?qa=1`)
- **Problem:** The snap hijacks scroll 140/180ms after every stop inside the anime pin (`snapEps: 0.06`, 0.9s retarget). It is the most scroll-jacking behavior on the page, and the project's own QA explicitly bypasses it — so the shipped scroll feel has zero automated coverage. Verified by code read; manual fast-scroll behavior through the roster was not measured in this audit's Chromium runs either (scrolls used immediate `__qa.scrollTo`).
- **Why it matters:** Highest risk of "the page fights me" complaints; untested code paths in the signature interaction.
- **Suggested fix:** Add a QA mode that keeps snap enabled and asserts single-flick-single-swap + settle position within eps, or soften snap (larger eps, only when velocity was high, skip when user reverses within 500ms). At minimum, run the existing checkpoint suite once with snap on and diff screenshots.
- **Effort:** M

### [ISS-014] Character portraits show baked-in grey box backgrounds
- **Severity:** High
- **Category:** Design
- **Location:** Asset pipeline deviation logged in `BUILD_LOG.md` (Phase 2b: "PNGs flattened to source/; alpha-bypass branch"); visible in `qa/desktop-23-anime-hold-1.png` / `desktop-25-anime-hold-2.png` (portrait cards render as grey rectangles around the character, unlike the transparent sneakers)
- **Problem:** The pre-matted character PNGs kept flat backgrounds, so the "framed portrait card" is a muddy grey box that clashes with the per-character `deep` panel tones and cheapens the SELECT-screen composition. The medallions mostly crop it away, but the hero portrait card cannot hide it.
- **Why it matters:** The roster's centerpiece visual looks unfinished; inconsistent matting between sneakers (clean cutouts) and characters (boxes).
- **Suggested fix:** Re-run the character cutouts through the normal rembg path (or manually mask the 5 portraits), regenerate the 1200x1600 canvases with transparency, and let `.a-port`'s tinted glass show through. Fallback: set `.a-port` background to each theme's `deep` so the box at least matches the panel.
- **Effort:** M

### Medium

### [ISS-015] Skip link is never visible, even on keyboard focus
- **Severity:** Medium
- **Category:** A11y
- **Location:** `src/styles/base.css:25-35` (`.sr-only` with no `:focus` reveal), `index.html:17`
- **Problem:** Measured: focusing the skip link leaves it at 1x1px — keyboard users get no visible affordance. The link itself works; it is just permanently invisible.
- **Why it matters:** Fails the intent of SC 2.4.1 bypass blocks; keyboard/SR users cannot discover it.
- **Suggested fix:** Add `.sr-only:focus-visible { position: fixed; top: 12px; left: 12px; width: auto; height: auto; clip: auto; padding: 12px 20px; background: var(--ink); color: var(--paper); z-index: 200; }`.
- **Effort:** S

### [ISS-016] Marquee duplicate is announced twice by screen readers
- **Severity:** Medium
- **Category:** A11y
- **Location:** `src/sections/marquee.ts:22-23` (`half.cloneNode(true)` with no `aria-hidden`)
- **Problem:** The seamless-loop clone doubles ~14 items (colorway + anime names) in the a11y tree. Verified: second `.marquee-half` has no `aria-hidden`.
- **Why it matters:** Verbose, confusing SR output on a decorative element.
- **Suggested fix:** Set `aria-hidden="true"` on the clone (and ideally `role="marquee"`/`aria-label` once on the track, or hide the whole strip if purely decorative).
- **Effort:** S

### [ISS-017] Hidden anatomy beats stay exposed to assistive tech
- **Severity:** Medium
- **Category:** A11y
- **Location:** `src/sections/anatomy.ts:50-59` (inactive titles/bodies hidden via `opacity: 0` only), `:189-214` (timeline fades, never `display:none`/`hidden`)
- **Problem:** All 4 beat titles + bodies + callout chips remain in the accessibility tree simultaneously (verified: 1 `h1` + 4 anatomy `h2`s + 6 colorway `h2`s + 5 anime `h3`s in heading order probe). SR users hear four overlapping "slides" at once. (Colors does this right with `display:none`; anime info lines share the flaw via `yPercent` masking.)
- **Why it matters:** Confusing narration of the page's core storytelling section.
- **Suggested fix:** Toggle `aria-hidden`/`inert` on inactive beats (and anime `.a-info` blocks) in the existing `onUpdate` handlers; keep exactly one beat exposed.
- **Effort:** M

### [ISS-018] Small tap targets (nav links 18px, ghost link 22px tall)
- **Severity:** Medium
- **Category:** UX
- **Location:** `src/styles/sections.css:52-57` (nav links), `src/styles/components.css:40-49` (`.link-arrow`), measured via `getBoundingClientRect` at 1366px: Anatomy 80x18, Colors 66x18, Roster 63x18, Drop 45x18; ghost link 146x22
- **Problem:** Below WCAG 2.5.8's 24px minimum. Desktop pointer users will manage, but touch laptops/tablets will mis-tap.
- **Why it matters:** Baseline touch-usability failure on primary navigation.
- **Suggested fix:** Add vertical padding to hit >= 24x24 (keep visual size via line-height), same for `.link-arrow`.
- **Effort:** S

### [ISS-019] SEO metadata is half-done: relative OG image, no canonical/robots/sitemap/structured data
- **Severity:** Medium
- **Category:** SEO
- **Location:** `index.html:10-14`
- **Problem:** Verified live: `og:image` is `/og-image.jpg` (scrapers require absolute URLs); no `canonical`; `/robots.txt` and `/sitemap.xml` both return the SPA fallback HTML (200 `text/html`, i.e. they don't exist); no JSON-LD; Twitter block is `card` only (no title/description/image); no `apple-touch-icon` (SVG favicon only). Title/description/OG basics are present and correct (UTF-8 em-dash verified in bytes — the `�` seen in PowerShell output was a console decoding artifact, not a file bug).
- **Why it matters:** Link unfurls break/look bare; crawlers get no directives or rich entities for a portfolio piece that lives off sharing.
- **Suggested fix:** Absolute `og:image` (+ `og:url`, `twitter:title/description/image`), add `public/robots.txt` + `public/sitemap.xml`, one JSON-LD `Organization`/`Product` (concept) block, `apple-touch-icon.png` 180px. Re-validate with a card validator + `curl` status checks.
- **Effort:** S

### [ISS-020] Custom cursor doubles the native cursor
- **Severity:** Medium
- **Category:** UX
- **Location:** `src/sections/cursor.ts:1-43`, no `cursor: none` rule anywhere in `src/styles/*`
- **Problem:** Dot + ring follow the pointer while the OS arrow stays visible — two cursors at once on all fine-pointer devices (verified by code search for `cursor:` — only canvas/btn defaults).
- **Why it matters:** Looks like a bug, not an effect; distracts on every CTA.
- **Suggested fix:** Either add `@media (hover:hover) and (pointer:fine) { body, a, button { cursor: none; } }` (keeping the custom pair as the single cursor, with a visible focus fallback) or remove the custom cursor entirely.
- **Effort:** S

### [ISS-021] Hero frame set is chosen once; crossing the 1024px breakpoint keeps the wrong set
- **Severity:** Medium
- **Category:** Responsive
- **Location:** `src/sections/preloader.ts:31` (`heroSet` from `innerWidth` at load), `src/lib/frameplayer.ts:39-52`
- **Problem:** Load at 1366px then resize to 700px (or rotate a tablet): the 1000px desktop frames stay resident — wasted memory and bandwidth, and vice versa (560px frames upscaled on a large monitor). Verified by code read; not exercised live (limitation).
- **Why it matters:** Common real-world path (devtools, rotation, windowed browsers) silently degrades quality or memory.
- **Suggested fix:** On breakpoint cross (debounced, same 250ms refresh handler in `engine.ts`), reload the correct set in the background and `player.setFrames()` swap; or always load the set for the larger of load-time and current width.
- **Effort:** M

### [ISS-022] No lazy loading anywhere below the fold
- **Severity:** Medium
- **Category:** Performance
- **Location:** All `img` creation sites (`colors.ts:98-105`, `anime.ts:118-136`, `angles.ts:53-58`, `drop.ts:21-26`) set `decoding="async"` but never `loading="lazy"`; verified live: all 38 `img`s present in DOM at load
- **Problem:** The browser fetches roster/angles/drop images during initial load (they appear in the top transfer list) instead of near-viewport. Pinned sections make native lazy less effective, but explicit laziness + the existing `watchLazyVideos` pattern would still cut initial contention.
- **Why it matters:** Contributes directly to ISS-003's blocked start and ISS-007/008's data cost.
- **Suggested fix:** `loading="lazy"` + `fetchpriority="low"` on all below-Anatomy images; keep hero/posters eager. Confirm initial request count drops (target: < 90 incl. frames).
- **Effort:** S

### [ISS-023] Object-URL leak in the ImageBitmap fallback path
- **Severity:** Medium
- **Category:** Code
- **Location:** `src/lib/preload.ts:11-26` (`decodeBlob`: `URL.createObjectURL(blob)` never revoked)
- **Problem:** Every frame decoded via the `<img>` fallback (hidden tabs/some webviews) leaks one blob URL. 72 potential leaks per load; also the success-path blobs are never explicitly released.
- **Why it matters:** Slow memory growth on affected browsers; trivial to fix.
- **Suggested fix:** `URL.revokeObjectURL(url)` after `img.onload` (and on error), in a `finally`.
- **Effort:** S

### [ISS-024] `?debug=callouts` backdoor ships to production
- **Severity:** Medium
- **Category:** Code
- **Location:** `src/sections/anatomy.ts:236-246` (click-to-coordinate overlay + `console.log`)
- **Problem:** Any visitor appending `?debug=callouts` gets a debug HUD and click logger on the live site.
- **Why it matters:** Unprofessional surface; leaks internal tooling into the shipped bundle.
- **Suggested fix:** Gate behind `import.meta.env.DEV`.
- **Effort:** S

### [ISS-025] Footer list wraps without hanging indent on mobile
- **Severity:** Medium
- **Category:** Design
- **Location:** `src/styles/sections.css:1713-1735` (`.f-list`), visible in `audit/mobile-375-mid.png` ("AI-generated imagery, hand- / processed: cut-outs…" wraps under the bullet)
- **Problem:** Wrapped lines align to the bullet instead of the text, breaking the list's left edge on narrow screens.
- **Why it matters:** Fit-and-finish; the footer is the last thing seen.
- **Suggested fix:** `li { display: grid; grid-template-columns: auto 1fr; }` or `text-indent`/`padding-left` hanging indent.
- **Effort:** S

### [ISS-026] Hero flicker suspects exceed the spec's action threshold (6/72, incl. the wrap seam)
- **Severity:** Medium
- **Category:** Animation
- **Location:** `src/data/assets.generated.json:16-23` (`flickerSuspects: [22, 30, 67, 68, 69, 72]`), pipeline rule BUILD_SPEC §6.3-step-3 (>4 suspects ⇒ retry with `birefnet-general`)
- **Problem:** The required cleaner-model comparison was attempted but "died silently (likely memory)" per `BUILD_LOG.md` and `isnet` was kept on visual-inspection grounds. Suspects 67-69 + 72 sit at the loop seam, exactly where the idle spin wraps every revolution — the highest-visibility frames for a pop. No scrub-through-frame-diff verification was recorded.
- **Why it matters:** A visible pop twice per hero rotation would undermine the signature moment; the process deviation is undocumented in code.
- **Suggested fix:** Re-run the birefnet comparison on a machine with headroom (or inspect frames 66-72 + 21-22/29-30 as a strip), record IoU medians for both models, and either swap models or add a 2-frame cross-dissolve bias at the seam in `FramePlayer`. Note the decision in the audit log, not just chat.
- **Effort:** M

### [ISS-027] Spec deviations live only in chat logs, not in code
- **Severity:** Medium
- **Category:** Code
- **Location:** `src/config.ts:3` (`idleFps: 12`, `lerpK: 16` vs spec 6/10), anime SELECT-screen rebuild, `--c-bg` staleness context
- **Problem:** `tsc` is clean and `no `any`` holds (verified via grep — zero matches), but a new dev reading `config.ts` has no idea the values intentionally differ from BUILD_SPEC, and nothing points at the why.
- **Why it matters:** Next session "fixes" the deviations back and regresses tuned behavior.
- **Suggested fix:** One-line comments on each deviation (`// SPEC §9.2 says 6; tuned to 12 after <date> because …`), plus a `DECISIONS.md` pointer if the pattern continues.
- **Effort:** S

### [ISS-028] Countdown re-creates GSAP tweens every second per digit
- **Severity:** Medium
- **Category:** Performance
- **Location:** `src/sections/drop.ts:87-98` (`setDigit` → `gsap.fromTo` on each change, 4 digits/second forever)
- **Problem:** Unbounded tween creation for a 1s tick; works, but churns GC for the lifetime of the page view.
- **Why it matters:** Death by a thousand cuts on low-end devices already carrying canvas + video + blur workloads.
- **Suggested fix:** Single CSS transition class on digit change, or FLIP via one reusable tween per node.
- **Effort:** S

### [ISS-029] Anchor smooth-scroll lands content under the fixed header
- **Severity:** Medium
- **Category:** UX
- **Location:** `src/sections/header.ts:31-43` (`offset: 0`), `src/styles/sections.css:8-23` (72px/60px fixed header)
- **Problem:** `lenis.scrollTo(target, { offset: 0 })` puts section tops exactly at viewport top, under the 72px (desktop) / 60px (mobile) blurred header. Non-pinned targets (`#drop`) lose their eyebrow behind glass.
- **Why it matters:** Every nav/CTA click slightly misframes its destination.
- **Suggested fix:** `offset: -1 * headerHeight` (read from `getComputedStyle`/`--header-h` at click time), and verify each `site.nav` target's eyebrow is fully visible post-scroll.
- **Effort:** S

### [ISS-030] Waitlist POST has no backend (dead path behind `demoMode`)
- **Severity:** Medium
- **Category:** Deploy
- **Location:** `src/sections/drop.ts:131-154` (`fetch("/")` URL-encoded `waitlist` form), no server route/Formspree/Vercel Function in repo
- **Problem:** Today `demoMode: true` masks it (verified: form shows success locally without network). The moment anyone flips the flag for a "real" launch, every signup POSTs to the SPA root and fails with "Something went wrong."
- **Why it matters:** A launch-day trap wired to the only conversion on the page.
- **Suggested fix:** Decide: keep the demo (then delete the dead fetch branch and document the waitlist as decorative) or wire a real endpoint (Vercel Function + provider) and add success/failure E2E to `scripts/qa.mjs`.
- **Effort:** S (decision + cleanup) / M (real backend)

### Low

### [ISS-031] Canvas has no fallback content
- **Severity:** Low
- **Category:** A11y
- **Location:** `src/sections/hero.ts:71-74` (empty `<canvas>`, `innerHTML.length === 0` verified)
- **Problem:** Ancient/no-canvas browsers get nothing (mitigated: `role="img"` + `aria-label`, plus the full-failure static image path).
- **Why it matters:** Trivial robustness win.
- **Suggested fix:** Put the fallback `<img>` inside the `<canvas>` element as well.
- **Effort:** S

### [ISS-032] Snap reads `lenis.direction`, which is version-fragile
- **Severity:** Low
- **Category:** Code
- **Location:** `src/sections/anime.ts:468`
- **Problem:** Relies on an undocumented-ish Lenis property; a minor Lenis bump can silently break snap targeting (falls to `Math.floor` path with `NaN`? — actually `undefined > 0` is false, so it floors; graceful but wrong).
- **Why it matters:** Silent behavior change on dependabot-style updates.
- **Suggested fix:** Track direction from consecutive `scroll` event `scroll`/`limit` values locally.
- **Effort:** S

### [ISS-033] Marquee loop width measured once, before fonts settle
- **Severity:** Low
- **Category:** Animation
- **Location:** `src/sections/marquee.ts:29-39` (`measure` only on `resize`)
- **Problem:** `halfW` is captured at init while the preloader still holds fonts; when display fonts swap in, the loop point is stale and the wrap visibly jumps. (Preloader blocks fonts, but marquee inits before `saga:ready`.)
- **Why it matters:** One-time jump on load for a component whose whole job is seamlessness.
- **Suggested fix:** Re-measure on `saga:ready` and on `document.fonts.ready`.
- **Effort:** S

### [ISS-034] Active swatch ring uses the stale `--c-bg` (wrong color on steps 2-6)
- **Severity:** Low
- **Category:** Design
- **Location:** `src/styles/sections.css:922-925`
- **Problem:** Same root cause as ISS-002: `box-shadow: 0 0 0 3px var(--c-bg)` always rings with COTTON CANDY's lavender. On light steps the ring nearly vanishes; on dark steps it is the wrong hue.
- **Why it matters:** Wayfinding polish for the section's own navigation.
- **Suggested fix:** Fixed with ISS-001/002 (live `--c-bg`); add explicit screenshot check of the active ring per hold.
- **Effort:** S

### [ISS-035] Missing hardening headers (HSTS/CSP/frame-ancestors)
- **Severity:** Low
- **Category:** Deploy
- **Location:** `vercel.json:8-15` (only `nosniff` + `Referrer-Policy`)
- **Problem:** No `Strict-Transport-Security`, no `Content-Security-Policy`/`frame-ancestors`, no `X-Content-Type-Options` gap (present). Static marketing page, so blast radius is small — but it is a 5-minute addition.
- **Why it matters:** Baseline security posture for anything public.
- **Suggested fix:** Add HSTS (after confirming HTTPS-only), `frame-ancestors 'self'`, and a tight CSP (self + data: + blob: for the frame pipeline; no `unsafe-inline` needed since styles are files).
- **Effort:** S

### [ISS-036] Absolute asset paths assume root deployment
- **Severity:** Low
- **Category:** Deploy
- **Location:** Manifest `dir`/`src` values (`/assets/…`), `index.html` favicon/OG paths
- **Problem:** Fine on Vercel root domains; breaks under any subpath mount or preview-path hosting.
- **Why it matters:** Limits hosting options; bites during client handoff.
- **Suggested fix:** Keep absolute (document the constraint) or switch to Vite `base: "./"`-compatible relative paths and re-QA.
- **Effort:** S

### [ISS-037] Preloader holds a full 1.2s even when everything is cached
- **Severity:** Low
- **Category:** UX
- **Location:** `src/sections/preloader.ts:75` (`Math.max(0, 900 - elapsed) + 300`)
- **Problem:** Repeat visitors stare at the brand animation for over a second with nothing to learn.
- **Why it matters:** Return-visit snappiness.
- **Suggested fix:** Skip the minimum hold when load completed from cache fast (e.g. `elapsed < 400ms` and frames cached ⇒ shorten to ~350ms exit), or add a click-to-skip.
- **Effort:** S

### [ISS-038] Anime halftone drift shares one accumulator for two writers
- **Severity:** Low
- **Category:** Code
- **Location:** `src/sections/anime.ts:237` (`hx`), `:281-284` (step bumps `hx += 60`), `:521-526` (idle drift `hx += 20*dt`)
- **Problem:** Works, but two systems mutating one position variable is a future bug magnet (pausing one changes the other's feel).
- **Why it matters:** Maintainability of the signature section.
- **Suggested fix:** Separate `driftX` from swap-pulse offsets, or comment the coupling.
- **Effort:** S

### [ISS-039] `luminance()` uses non-linear sRGB (header-theme classifier can misjudge saturated hues)
- **Severity:** Low
- **Category:** Code
- **Location:** `src/sections/colors.ts:6-13`
- **Problem:** The 0.2126/0.7152/0.0722 weights assume linear light, but inputs are gamma-encoded — saturated reds/oranges score too high, risking a light header on a mid-dark bg. (TOMATO currently lands "light" and looks acceptable, so this is latent, not active.)
- **Why it matters:** Next added colorway could silently get the wrong header theme.
- **Suggested fix:** Linearize channels before weighting; add a unit assertion for all six current pairs.
- **Effort:** S

## 5. Bugs and Glitches

- **BUG-1 — First colorway text missing (ISS-001).** Repro: fresh load → scroll to Colorways hold 1 (or click nothing; it is the default). Expect: "COTTON CANDY" + tagline + specs + CTA. Actual: empty column, only swatch dots. Viewports: 1440x900, 390x844 (also visible in `qa/desktop-12-*` and `qa/mobile-12-*`). Persists after 2.5s settle — not a scrub-lag artifact.
- **BUG-2 — CTA unreadable on dark colorways (ISS-002).** Repro: scroll to CHROME NOIR hold. Expect: legible pill. Actual: near-white pill, near-white text (~1.2:1). Same on mobile.
- **BUG-3 — Mobile Colorways CTA clipped (ISS-004).** Repro: 390x844, any colorway hold. Actual: CTA bottom edge extends past the viewport (measured y841+h52 > 844); bottom rows show it half-cut.
- **BUG-4 — White-out frame mid anime-swap (ISS-005).** Repro: slow-scroll through any `anime-swap-N` on desktop. Actual: near-full-white frame (`qa/desktop-24-anime-swap-1.png`). Also flirts with photosensitivity guidance.
- **BUG-5 — Header CTA loses its pill on dark sections (ISS-012).** Repro: scroll to Roster/Drop/Footer. Actual: borderless text where a pill was (compare hero vs `qa/desktop-33/34/35`).
- **BUG-6 — Spec text over shoe photo (ISS-006).** Repro: desktop 1440, colorway holds 2 and 6. Actual: bullets overlap the shoe; white glyphs on light shoe areas.
- **Non-bug notes (checked, OK):** zero console errors, zero failed requests, no horizontal overflow at any checkpoint, countdown ticks (50d 20h 30m 23s at audit time, matches 2026-12-01 target), demo form submits to success state, swatch/mini jump buttons scroll, footer/anatomy static fallbacks exist (code-read; reduced-motion live render not exercised — see limitations).

## 6. Suggested Improvements

- **Beyond fixes, if the concept is kept:** (1) give mobile a real menu (ISS-010 covers the need; design it as a full-screen pastel sheet to match the brand); (2) add a sticky "current colorway" buy-bar on the last colorway beat to rescue conversion after ISS-004's fix; (3) replace the anime white flash with a 2-frame ink-bloom + haptic-scale punch — same energy, no white-out; (4) add per-colorway deep-linking (`#colors/03`) reusing the existing swatch scroll-to so roster/colorway cards are shareable; (5) compress the story: 25 screens is long for zero commerce — collapse Angles into Anatomy beat 4's exploded view and reinvest the saved weight into video bitrate; (6) add a comparison strip (pastel vs noir side-by-side) as the Colorways finale instead of a 6th identical-layout beat; (7) OG video/poster per anime pair for shareability; (8) caption/describe the manga FX (halftone/speedlines) in alt-adjacent visually-hidden text for SR users who currently get silence where sighted users get story.

## 7. Recommended Fix Order

- **Phase 0 — Stop the bleeding (blocks everything else)**
  1. ISS-001 (transparent first-colorway copy) + ISS-002 (dark CTA) + ISS-034 (swatch ring) — one interpolator change, one verification pass. (M total)
  2. ISS-004 (mobile CTA clipped) — layout compaction + probe asserts at 360x640/390x844. (M)
  3. ISS-011 (IP honesty: "Original characters" vs Naruto roster) — copy decision before any public link. (S)
- **Phase 1 — Performance triage (unblock real networks)**
  4. ISS-003 (staged hero loading + timeout + Save-Data). (L)
  5. ISS-007 (video loading discipline + laces-detail over budget) + ISS-022 (lazy below fold). (M+S)
  6. ISS-008 (kill blanket idle pre-decode; per-section lazy decode). (M)
- **Phase 2 — Animation safety + trust**
  7. ISS-005 (defuse white flash) + ISS-026 (seam-frame inspection). (S+M)
  8. ISS-013 (snap: test with it ON; soften targeting). (M)
  9. ISS-030 (waitlist backend decision; remove dead branch if demo). (S)
- **Phase 3 — Access, contrast, conversion polish**
  10. ISS-009 (contrast pairs) + ISS-006 (text/shoe overlap) + ISS-012 (dark header CTA). (M+M+S)
  11. ISS-010 (mobile menu) + ISS-015/016/017/018 (skip-link reveal, marquee aria, beat exposure, targets). (M+S×4)
  12. ISS-019 (SEO: absolute OG, canonical, robots, sitemap, JSON-LD, apple icon). (S)
- **Phase 4 — Hardening + hygiene**
  13. ISS-021/023/024/028/029/035/036/037/038/039/015-033-long-tail (each S; batch as one cleanup PR with the QA script extended for: CTA contrast per hold, CTA-in-viewport per hold/mobile, no-white-flash per swap, snap-on screenshot diff, header pill per theme).
  14. Re-run full `npm run build` + `npm run qa` + this audit's probe set (throttled 3G, 360x640 spot-check) and record medians.

## 8. Fix-Ready Checklist

- [ ] ISS-001 — First colorway copy transparent (drive --c-text from JS, remove GSAP var tween)
- [ ] ISS-002 — CTA unreadable on dark colorways (live --c-bg per step)
- [ ] ISS-003 — Preloader blocks on 72 frames, no skip/timeout (staged release + byte progress)
- [ ] ISS-004 — Mobile Colorways CTA clipped below fold (compact stack to fit 100svh)
- [ ] ISS-005 — White-out frame mid anime-swap (cap flash, stagger layers)
- [ ] ISS-006 — Desktop copy overlaps shoe photo (re-balance stage/content geometry)
- [ ] ISS-007 — 21MB showcase video loads too early (tighten margins, re-encode, poster-only mobile)
- [ ] ISS-008 — Blanket idle pre-decode of all stills (per-section lazy decode)
- [ ] ISS-009 — Contrast failures TOMATO/rail/H1/placeholder (per-pair text colors + scrims)
- [ ] ISS-010 — No mobile navigation (add menu reusing header go())
- [ ] ISS-011 — "Original characters" claim vs Naruto IP roster (reword or replace art)
- [ ] ISS-012 — Header CTA pill invisible on dark (theme-aware CTA style)
- [ ] ISS-013 — Snap untested (QA with snap on; soften targeting)
- [ ] ISS-014 — Character grey-box backgrounds (re-cut portraits to transparent)
- [ ] ISS-015 — Skip link never visible on focus (focus-reveal style)
- [ ] ISS-016 — Marquee clone announced twice (aria-hidden on clone)
- [ ] ISS-017 — Hidden anatomy beats exposed to AT (toggle aria-hidden/inert)
- [ ] ISS-018 — Tap targets under 24px (pad nav links, ghost link)
- [ ] ISS-019 — SEO gaps: relative OG, no canonical/robots/sitemap/JSON-LD (add all)
- [ ] ISS-020 — Double cursor (cursor:none on fine pointers or remove custom)
- [ ] ISS-021 — Wrong hero frame set after breakpoint cross (reload correct set)
- [ ] ISS-022 — No lazy loading below fold (loading=lazy + low fetchpriority)
- [ ] ISS-023 — Object-URL leak in decode fallback (revoke in finally)
- [ ] ISS-024 — ?debug=callouts in prod bundle (gate on DEV)
- [ ] ISS-025 — Footer list wrap alignment on mobile (hanging indent)
- [ ] ISS-026 — 6/72 flicker suspects incl. seam (birefnet compare or seam dissolve)
- [ ] ISS-027 — Undocumented spec deviations in config (comment idleFps/lerpK)
- [ ] ISS-028 — Countdown tween churn (CSS transition instead of per-second tweens)
- [ ] ISS-029 — Anchor landings hide under fixed header (offset by header height)
- [ ] ISS-030 — Waitlist POST has no backend (wire endpoint or delete dead branch)
- [ ] ISS-031 — Canvas without fallback content (nest fallback img in canvas)
- [ ] ISS-032 — Snap depends on lenis.direction (track direction locally)
- [ ] ISS-033 — Marquee measured pre-fonts (re-measure on fonts.ready/saga:ready)
- [ ] ISS-034 — Swatch ring uses stale --c-bg (fixed by ISS-001/002; verify per hold)
- [ ] ISS-035 — Missing HSTS/CSP/frame-ancestors (add headers)
- [ ] ISS-036 — Absolute asset paths assume root (document or relativize)
- [ ] ISS-037 — 1.2s preloader hold on cached loads (shorten/skip on fast cache)
- [ ] ISS-038 — Shared hx accumulator in anime drift (split or comment)
- [ ] ISS-039 — Non-linear luminance() classifier (linearize + unit asserts)

## 9. Audit Limitations
- **No Lighthouse scores.** `npx lighthouse` download timed out in this environment; Performance/SEO judgments use build output, resource-timing probes (FCP 1840ms localhost, 110 requests, top transfers), file weights, and code inspection instead of lab CLS/LCP/INP numbers. Re-run Lighthouse (mobile + desktop, throttled) before/after fixes.
- **Chromium only.** No Safari/iOS, Firefox, or real-device testing — canvas scrub, `100svh`, backdrop-filter, and video-`currentTime` behaviors on iOS are code-read only. The 1920px pass was also partial (top screenshot + facts captured; full checkpoint walk completed for 375/768/1366).
- **No slow-network / low-end runs.** Throttled-3G time-to-copy, frame-stream behavior, and memory pressure (ISS-003/007/008) are estimated from weights, not measured.
- **Anime snap path untested live.** Like the project's own QA, this audit's scrolls used immediate `__qa.scrollTo` (snap is dormant under `?qa=1`); real flick-feel, overshoot, and pin-fighting were not exercised.
- **No screen-reader or keyboard-only session.** A11y findings are DOM/computed-style/static-review based (headings, alt, focus outline verified; SR narration flows inferred).
- **No refresh-mid-scroll / resize-across-breakpoint / fast-fling live tests.** Covered by code read (ISS-021) rather than execution.
- **AI-artifact inspection limited** to shipped screenshots/QA captures (no contact-sheet or per-frame review); flicker-seam risk (ISS-026) is manifest-data + log based.
- **Contrast ratios are computed approximations** (linearized sRGB math), not lab-tool readings — close enough to call fails, but re-verify with a checker when recoloring.
- **Server ran as `vite preview` of `dist/`** (production build, port 4173) — equivalent to static hosting for these purposes, but Vercel edge headers/compression were not measured live (config reviewed statically).

## 10. Fix Verification (2026-10-12)

All 39 issues plus the two follow-ups (hero motion, roster faces) were fixed and verified: `tsc` clean, `vite build` clean, project QA 8/8 PASS (desktop + mobile, zero console errors, zero failed requests, no overflow), plus targeted Playwright probes.

- ISS-001/002/034: name color at holds 1-6 reads ink/maroon/near-white per item (was transparent); CTA contrast fixed; verified 1440 + 390.
- ISS-004: mobile CTA bottom 789/844 (was 893, clipped).
- ISS-003: preloader releases after 13 priority frames + fonts, 12s timeout, background swap via saga:frames, Save-Data respected. Throttled-3G timing not measured.
- ISS-005: flash peak 0.85 to 0.3; settled swap frames read opacity 0.
- ISS-006: shoe narrowed to 44vw; hold-2 screenshot shows clear gap, no glyph overlap.
- ISS-007: laces-detail re-encoded 6.9 to 5.6MB (under 6MB budget); ink + city-night lazy. Video upgrade margin kept at 100 percent (not tightened to 25 percent).
- ISS-009/012: TOMATO ink text, text-grade H1 gradient, rail backing chip, placeholder .75, paper pill CTA on dark headers (screenshots).
- ISS-010: hamburger menu verified open/jump/close on 390, Escape + focus trap included.
- ISS-013: snap-ON probe settled exactly on anime-hold-3 after an off-step nudge, no errors.
- ISS-015-018: skip link visible on desktop focus (147x45), marquee clone hidden, one anatomy beat exposed.
- Hero motion: idle 12 to 5 fps angular, 3-frame dissolve, redraw key /8; canvas advances (instrumentally confirmed). Judge smoothness with your own eyes.
- Faces: 512px face thumbs in manifest, medallions + rail minis use them; roster screenshots show all five faces at 1440 + 390.
- Left for deploy time: absolute og:image/canonical need the production domain; Safari/iOS + throttled-network runs still open.

## 11. Hybrid Hero (2026-10-12, user-requested follow-up)

Idle rotation replaced with a hover loop; scroll keeps the 72-frame turntable scrub. `hero-hover.mp4` checked (near-white solid bg, same shoe) and shipped as 960x540/3.0MB + poster, with a manifest `hero.hover` entry. The multiply blend initially rendered a white box: any stacking context on an ancestor (first `will-change` stage, then even `z-index` on the wrapper) traps blending. Fixed with static box geometry, no transforms, DOM-order painting. Video plays at rest / pauses on scroll with a canvas crossfade; no-video keeps the old rotation idle; reduced-motion path untouched. Verified: tsc/build clean, QA 8/8, state probes exact on 1440 + 390, screenshots show a seamless blend at both viewports.
