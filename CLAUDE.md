# CLAUDE.md — Article Timeline Comments (Complex.com prototype)

## What this is
A cosmetic-only prototype of **SoundCloud/Loom-style timeline comments, but for an article**.
Readers leave comments pinned to a point in the article; the "timeline" is **reading progress
(scroll %)**. Built for Complex.com using the real article:
`https://www.complex.com/sneakers/a/matt-welty/the-best-sneakers-in-the-nba-finals`

## THE one main file: `index.html`
`index.html` is the whole prototype — open it in a browser. It is the **real live complex.com page**
(genuine nav, footer, grid, ad slots, hero, title, body, typography) with the comment system
injected on top. It's self-contained (images/fonts load from CDN).

> We deliberately collapsed to a single deliverable (Build 14). The earlier reconstructed version
> and the device-preview/harness files were removed to avoid confusion.

## How `index.html` is generated (don't hand-edit it)
`index.html` is **built**, so edit the sources and re-run the builder:
- `build_live.py` — assembles `index.html`: takes `live.html` (the raw live page) + `all.css` (its real
  stylesheets), **strips the Next.js `<script>`s** (→ static), inlines `all.css` + Inter, then injects
  `entries.json` + `live-inject.js` before `</body>`.
- `live-inject.js` — the comment system (all classes `tlc-` prefixed so they never clash with the live
  page). At runtime it discovers the live DOM (`h1`, body `p[class*="text-[16px]"]`, `h2` entry heads,
  `<footer>`), **reconstructs the 36 entry images** (they're client-rendered on the live site, absent
  from static HTML) from `entries.json`, and layers on the UI.
- To change behavior/design of the comment system → edit `live-inject.js`, then `python3 build_live.py`.
- Inputs kept for rebuilds: `live.html`, `all.css`, `entries.json`. Design values were verified against
  the live site (see MEMORY Build 4).

## Core principle (don't break this)
- A comment's anchor is captured cosmetically: `{ progress%, nearest-paragraph }` at post time.
  **No text/NLP analysis** — the deliberate "low-lift" v1 scope.
- The model carries `nearest-paragraph` so a future **smart version** (detect the exact line) is a
  drop-in upgrade with no marker-UI changes.

## Audience constraints (drive every design decision)
- **85% of users are on mobile** → mobile-first. (On the real page the article has only ~16px side
  padding, so the margin trail is tight on mobile — a real constraint to keep evaluating.)
- Desktop **right rail is ad inventory** — comments must never compete with ads; the trail lives in
  the article's **left** margin. Real Complex articles also embed in-content ads between sections.

## Comment system (in `live-inject.js`)
- **Margin trail (desktop only, ≥1024px)**: a vertical line + avatar **markers** in the article's left
  margin, anchored to the paragraph each comment refers to, scrolling with the content. Line runs from
  the **title** to the last paragraph; a fill grows with reading. Nearby markers **cluster** (avatar +
  count badge). **Hidden on mobile (<1024px)** — the live article has only ~16px side padding, so there
  is no room for a margin trail; mobile relies on the action bar / FAB → drawer instead (`DESK()`
  guard + `@media(max-width:1023px)` hides `.tlc-trail`).
- Coordinates are all **document-space** (`getBoundingClientRect`+scrollY) because the live DOM's
  offsetParents are unknown. Trail X (`trailX()`) aligns with the **hamburger menu** (`[data-testid=
  "hamburger-menu-button"]`) / the `max-w-[1400px]` grid left edge — so it sits at the grid edge and
  stays there on wide screens rather than running to the viewport edge.
- **Mobile (<1024px):** no margin trail. Engage via the **action bar's comment button** (MVP: the
  FAB) → the **comments drawer** — since Build 45 the ONLY thread surface (no on-page feed).
  The **bottom sheet** (full-width; content capped at 1440, centered; no dim
  overlay, drop shadow only) is used by the FAB composer. **Desktop (≥1024px):** markers show; hover →
  popover, click → bottom sheet.
- **React + reply (revised Build 43):** like (heart) on comments and replies. **Threading is flat, max
  ONE level deep**: replying to a top-level comment starts its thread; replying to a **reply** stays in
  that same tier and just carries an **@name mention** (prefilled "@author " in the text; a leading
  @mention renders styled via `.tlc-mention`). Reply buttons on reply cards pass `data-to` +
  `data-id`(=parent). **ONE composer per surface (Mobbin-validated: HYPE/Spotify/NAVER/Instagram —
  no inline second box):** in the feed + drawer, tapping Reply puts that surface's own pinned composer
  into **reply mode** (`replyCtx={pid,author}`) — a dismissible "Replying to @name ✕" banner chip
  (reuses `.tlc-dw-quote`), reply placeholder, "Post reply" button; ✕ cancels and keeps typed text;
  posting appends to the parent's `replies` (`startReply`/`rerenderComposer` in `live-inject.js`).
  Only the desktop marker **sheet** keeps the old inline `.tlc-rbox` (it has no persistent composer,
  so there is no duplication there).
- **"Comment" FAB**: opens the full comments drawer — **desktop only now** (Build 30). On **mobile**
  it's replaced by the **bottom action bar**.
- **Mobile bottom action bar (Build 30, `<1024px`):** `.tlc-abar` — a centered floating pill,
  rebuilt by `renderAbar()`: **Heart (like article) · Comment (opens drawer) · Bookmark (save)** — the
  "essentials", default on ALL articles. Heart/bookmark toggle + persist (`complex-tlc-artlike` /
  `complex-tlc-artsave`); comment shows the live count. Replaces the FAB on mobile; desktop keeps FAB + trail.
- **Re-rank ⨯ essentials coexistence (Build 33–34, mobile-only, List template only):** on list articles
  the real product also shows a **nav deck** — `‹`/`›` **in-page item navigation** (jump to prev/next list
  entry, "NEXT · ITEM #N" label) + a central **RE-RANK** button (white card; gray prev, black RE-RANK,
  red next — matches the live component). **The Re-Rank button is deliberately INERT** — the re-ranking
  interaction is prototyped in a separate file and is OUT OF SCOPE (the old `.tlc-rr` reorder sheet code
  remains in `live-inject.js` but is unwired; don't re-wire it). Under evaluation = how the nav deck and
  the essentials pill **merge** into one bottom UX. **Seven switchable layouts** (`rerankVar`, persisted
  `complex-tlc-rerank-var`, default `focus`; stored values validated against `RR_VARS`) — in the in-page
  panel (`#tlcSelRR`), the canvas rail (`#selRR`), and the bridge:
  **off** (essentials only) · **stacked** (both, pill floating above the deck — status-quo baseline) ·
  **deck** (ONE card, two rows: essentials icons fold into the deck's label row, left of "NEXT · ITEM #N") ·
  **unified** (one pill, single row: `‹ RE-RANK › | ❤ 💬 🔖`, counts dropped to fit 375px; floating
  label tip while scrolling) · **flank** (round `‹` `›` at the screen edges, essentials pill with a
  Re-Rank segment centered) · **swap** (one slot: essentials at rest, morphs into `‹ RE-RANK ›` while
  scrolling, back ~1.6s after idle) · **focus** (Build 34–36, DEFAULT — from the user's own Figma mock,
  file page "Page 2": two slots that trade focus. At rest the nav deck `‹ RE-RANK ›` is expanded
  (re-rank = the default interaction on list articles) with the social actions collapsed into a 52px
  white bubble of mini heart/comment/bookmark icons on the right; tapping the bubble expands the
  essentials pill (with counts) and collapses re-rank into a 52px black shuffle-icon bubble; tapping
  that swaps back. Build 35: both slots (`.tlc-fdeck` deck / `.tlc-fsoc` bubble) are ALWAYS in the DOM
  and the swap is a real in-place morph — `applyFocus()` only toggles `.min`/`.exp` classes, never
  re-renders, and coordinated flex-basis/max-width/opacity transitions (.38s, one shared curve) do the
  animation. The shuffle glyph is the exact filled Streamline path from the Figma asset (`SHUF`,
  path-level `fill="currentColor" stroke="none"` so the shared abar svg rules don't blank it).
  RE-RANK itself stays inert, only the bubbles toggle. Build 38–39: RE-RANK is a full pill (round in
  both states) and focus shows NO "NEXT · ITEM #N" tip on scroll/arrows (other variants keep theirs;
  `updateAbarNav` treats the label as optional so end-disabling still works). Build 36: the mini cluster mirrors the
  article's hearted/saved state — baked into the markup AND live-synced in the like/save handlers;
  and the black-RE-RANK rule is scoped `.tlc-abar .tlc-ab-rank` — a bare `.tlc-ab-rank` LOSES to
  `.tlc-abar button` and goes transparent. NEVER use backticks inside the CSS template literal —
  it terminates the string and the whole injected script dies). Picking any non-off layout
  auto-switches Template→List (variants gate on `pageType==="list"`; Article template = essentials only).
  Arrows really navigate:
  `curEntryIdx()`/`goEntry()` smooth-scroll between the entry `h2`s offset by `headerBottom()`; prev is
  track-style (first tap returns to the current item's top); ends disable.
- **Select-to-comment (Medium-style, Build 21)**: selecting article copy shows a floating `.tlc-seltip`
  pill with one **Comment** action; clicking opens the drawer in compose mode with the selected passage
  as a **quote chip**. Posted comments carry `c.quote` + a progress derived from the selection position.
- **End-of-page comment section — REMOVED from the page (Build 45).** Comments can no longer be
  scrolled to; the thread lives **only in the drawer** (desktop side sheet / mobile bottom sheet).
  The `.tlc-cend` element + its render/composer code are still in `live-inject.js` but the element is
  **never inserted** (kept detached; `renderEnd` early-returns) — reverting is a one-line change.
  The drawer keeps the snippet/quote behavior: each comment shows a **clickable snippet/quote**
  (the `c.quote` if it was a selection, else nearest-paragraph text) that **jumps to** that part of the
  article (`.tlc-snip`, keyboard-accessible; hidden in MVP). On arrival the target paragraph gets a
  subtle **light-gray `#e5e5e5`** highlight (`.tlc-flash`, ~1.8s). On **mobile**, clicking a snippet
  **collapses the bottom sheet** as it scrolls so the spot is visible; the desktop side drawer stays
  open (Build 23).
- **Comments drawer** (Build 20–21): "Load more" / select-to-comment / FAB opens `.tlc-drawer`. **Desktop:**
  sticky right-side panel (`min(420px,92vw)`, full-height). **Mobile (<1024px): a bottom sheet** — slides
  up from the bottom, `max-height:80vh`, rounded top. Its own composer (like/reply/post + quote chip).
  **No scroll-lock**; instead a **15% page dim** (`.tlc-dim`, `pointer-events:none`) so the article still
  scrolls and snippet jumps scroll the article *while the drawer stays open*. Close via ✕ or Escape.
- **Prototype control (Build 25, desktop only):** `.tlc-proto` card bottom-left ("PROTOTYPE / Timeline
  [switch]") toggles the margin trail on/off so both iterations are viewable. `trailOn` persisted in
  `localStorage` `complex-tlc-trail`.
- **Mobile timeline bar (Build 27/29 + 40, `<1024px` only):** `.tlc-mbar` — a slim (3px) black scroll-
  progress line with comment markers at each comment's progress%: **4px solid-black dots — no white
  stroke, no numbers** (`border:0` must stay EXPLICIT on `.tlc-mdot .tlc-av`: the base `.tlc-av` has a
  2px white border that leaks back otherwise), each with an invisible ~20×24 tap area (wrapper
  padding); when the fill front reaches one it **blooms into the 20px DP** (colored avatar + 9px
  initials, via a `--dp` CSS var on `.tlc-mact`), then shrinks back. Clusters by pixel proximity. Mobile counterpart to the
  desktop margin trail. **Position is switchable (Build 40, from the user's Figma "Page 3" mock,
  node 98-100): `mbarPos` = off | top | bottom (DEFAULT bottom)**, persisted `complex-tlc-mbar`
  (legacy "1"/"0" map to bottom/off). **Top** = pinned under the sticky nav (`headerBottom()`, ~101px),
  4px padding both sides, tap a dot → `.tlc-mcard` floats in BELOW it (with arrow). **Bottom** = the
  bar is the top edge of a white panel docked above the bottom action bar (`placeMbar()` measures the
  live abar rect, bar sits 12px above it; abar z-index raised to 2147483060 to float over the panel);
  tap a dot → the card opens UPWARD above the bar (`mc-bot`, bottom-anchored, no arrow — per the mock).
  **Bottom-mode card = comment browser (Build 41): centered; tiny ‹ › footer arrows (`.mc-nav`,
  `mcardIdx`, ends disable) step through the progress-ordered clusters; each step auto-scrolls the
  article behind (`progToY` smooth) and holds a super-light-gray `#f0f1f2` highlight (`.tlc-mlit`,
  `mlit()`) on the nearest paragraph — cleared on close. Top mode keeps the dot-anchored card.**
  Controls: 3-way seg in the in-page panel (`data-g="mbar"`), select `#selMB` in the canvas rail,
  bridge `mbar` accepts "off"/"top"/"bottom" (+ legacy booleans).
- **Prototype control panel (Build 26–27, bottom-left, collapsible, all viewports):** `.tlc-proto` with
  toggles for **every condition** — **MVP first, at the very top** (Build 42–43, see below), then
  Viewer (Guest/Signed-in/Banned), First-time user (community-guidelines prompt), Comments
  (Populated/Empty/Loading skeleton), Template (Article/List), **Margin timeline** (desktop trail) +
  **Timeline bar** (mobile bar), plus **Notification settings** + **Reset demo data** buttons.
- **Bottom anchor ad toggle (Build 44; DEFAULT ON since Build 46):** the live site sometimes pins a **sticky anchor ad** to the
  viewport bottom (user screenshot: COMPLEX mark · green LTL creative · ✕). Simulated as `.tlc-ad`
  (fixed, z 2147483065, 50px + safe-area, dismissible ✕ = toggle off, CTA/✕ toast). `adOn` persisted
  `complex-tlc-ad`, switch `#tlcSwAD` (panel, after Template — NOT in the MVP-grayed group: it's a
  page condition that applies in MVP too), `#swAD` (canvas rail), bridge type `ad`. When ON the
  `tlc-adon` body class lifts every floating bottom element: FAB → 70px, abar → 66px, bottom timeline
  panel → 50px (its height calc in `placeMbar()` stops at the ad's top edge), proto panel → 70px.
  Drawer/sheets still slide over the ad (they're modal surfaces).
- **MVP toggle (Build 42; DEFAULT ON since Build 46 — both toggles read "0" as off, anything else =
  on; canvas harness state also defaults `mvp:true, ad:true`):** `mvpOn` (persisted `complex-tlc-mvp`; switch `#tlcSwMVP` in the panel,
  `#swMVP` in the canvas rail, bridge type `mvp`). **ON = only the spec'd v1 requirements**: the
  comments drawer (since Build 45 the ONLY thread surface — empty, loading skeleton, sort flip), composer (2,000-char
  counter, guidelines first-time, auth gate, banned notice), card states (reply tier, edit <5 min,
  [deleted by author], [removed by moderator]), reactions (heart + count — **the "Who reacted" list is
  hidden in MVP since Build 47**, full mode keeps it), report/flag +
  confirmation, notification-settings modal. **Hidden in MVP:** margin trail, mobile timeline bar,
  action bar / re-rank variants, select-to-comment, who-reacted, and the cards' progress snippets /
  "% badge" / "Jump to spot" (timeline anchors are beyond v1). On mobile the plain **Comment FAB** returns as the
  entry point (`.tlc-mvp .tlc-fab{display:flex}` overrides the mobile hide). Implementation = a
  `tlc-mvp` body class + `mvpOn` guards in `renderTrail`/`updateFill`/`renderMbar`/`updateMbar`/
  `renderAbar`/`showSel`/`cmtHtml`; the experiment controls gray out (`.tlc-pg-exp.mvpdim` /
  `.grp.exp.mvpdim`) while ON but keep their stored values.
- **Composer states (Build 26):** shared `composerInner(kind)` → **auth gate** (guest), **banned**
  notice (the frontend "notification signal"), first-time **community-guidelines** acceptance, or the
  **editor with a live 2,000-char counter** (red + Post disabled when over). Wired via delegation
  (`wireComposer`) so re-render never drops listeners.
- **Card states (Build 26):** `edited` "· edited"; **[deleted by author]** (kept when replies exist);
  **[removed by moderator]**; inline **Edit** (own, 5-min window); **Delete**. **Reactions** = heart +
  count + **"Who reacted"** expandable list (`reactors`). **Report/flag** in the ⋯ menu (auth-only) +
  confirmation. **Sort** = single flip-toggle button (Build 37: `Sort [⇅ Most recent]`, one tap flips
  recent⇄popular — Mobbin-validated compact pattern; Figma sort component mirror pending). All write
  actions gated by viewer state.
- **Notification settings (Build 26):** profile modal, two toggles — Email-on-reply + Weekly-digest.
- **Persistence:** comments in `localStorage` key `complex-tlc-live-v4` (v4 = Build 43 seed adds a
  flattened reply-to-reply @mention demo, s6r3); falls back to seeded comments
  (incl. demo edited/deleted/removed/reactors flags), spread 4%–99%. Bump the key version when changing
  seeds so they re-show. Condition state persists in `complex-tlc-{user,guidelines,pagetype,trail,
  ntf-reply,ntf-digest}`.
- **Design tokens** (verified from live CSS): Inter; Text `#000`/`#40444a`/`#8f959d`; Border `#e1e3e5`;
  B3 `#f0f1f2`; **4px** radius; black buttons; red `#f03c3c` for notifications/likes only.
  See `DESIGN-SYSTEM.md` (SMPLX) — the source of truth, don't guess.

## How to run / verify
**Preferred: open `canvas.html`** — a device-preview harness (Build 28) with a **Desktop/Mobile switch**
and all condition controls in a **side rail outside the previewed UI**. It embeds `index.html` in a
scaled iframe and drives it via `postMessage`; the prototype hides its own `.tlc-proto` panel when
embedded (`EMBED` = in an iframe). Or open `index.html` directly for the standalone in-page panel. NOTE: this sandbox can't run a local server (getcwd blocked) or
screenshot, so `index.html` is **not visually verified here** — it needs a human/browser to confirm
the static-stripped live page + injected UI render correctly.
- **Syntax-check BEFORE building** (no node here): `osascript -l JavaScript` + JavaScriptCore
  `new Function(src)` on `live-inject.js`. And NEVER put backticks inside the CSS template literal.
- **Entry images need HTTPS:** opened via `file://` the Complex CDN images stay blank; served over
  HTTPS (Vercel/Netlify) they load. Don't mistake local blank images for a bug.
- **Live/deployed:** repo https://github.com/daniiyalali/comments, auto-deploys to Vercel on push —
  the deployed root is the canvas; `/prototype.html` is the bare prototype.

## Figma mirror (added 2026-07-10)
The complete design inventory — every screen, variant, and state in `live-inject.js` — also exists as
**editable Figma frames**: https://www.figma.com/design/Ils4e9Naytz66xI6UJ1G49/Comments-Exp
(file key `Ils4e9Naytz66xI6UJ1G49`, page "Comments Exp — all designs & states"). Five sections:
Build 33 six-layout bottom-bar comparison · Build 32 re-rank iterations (labeled *superseded*, incl.
the reorder sheet open/submitted) · timeline bar / drawer (incl. loading) / feed / states · component
sheets (composer ×6, card ×8, misc) · desktop (trail, popover, drawer, sheet, trail-off). Prototype
flows are wired ("Mobile flow" / "Desktop flow"); **Re-Rank buttons are inert there too**. Only the
prototype control panel + canvas harness are excluded (internal tooling). **If a build changes UI,
mirror the change in the Figma file** (edit via Figma MCP `use_figma`; load the `figma-use` skill
resource first).

## Deploy (GitHub → Vercel; Netlify drop as fallback)
- **Repo: https://github.com/daniiyalali/comments** — push to `main` auto-deploys on Vercel (once the
  repo is imported at vercel.com/new). `vercel.json` serves `dist/` statically, no build.
- **`dist/` is packaged BY `build_live.py`** (no manual copy step): `dist/index.html` = the **canvas
  harness** (the deployed site opens on the device-preview canvas, iframe retargeted to
  `prototype.html`) and `dist/prototype.html` = the self-contained prototype (direct link).
  Locally unchanged: root `canvas.html` still embeds root `index.html`.
- Fallback: drag `dist/` to https://app.netlify.com/drop (`netlify.toml` sets `publish = "dist"`);
  `complex-comments-netlify.zip` = zipped dist.

## Project rule
After **every build**, update `CLAUDE.md`, `MEMORY.md`, and `HANDOFF.md`.
