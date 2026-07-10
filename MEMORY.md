# MEMORY.md — decisions & state log

Running log of decisions, rationale, and state. Newest first. Update every build.

> **Current state = Build 45 (2026-07-10), PUSHED — commit a97bc9c on main, auto-deployed via Vercel.** Build 45 = **comments are OFF the page** — no scrollable
> end-of-page section; the thread lives ONLY in the drawer (desktop side sheet / mobile bottom
> sheet). Build 44 = **bottom anchor-ad simulation** ("Bottom
> anchor ad" switch, `complex-tlc-ad`, bridge `ad` — sticky 50px ad bar at the viewport bottom;
> `tlc-adon` lifts FAB/abar/timeline panel above it; page condition, applies in MVP too).
> Build 43 = **flat reply-to-reply (@name mention, max one
> tier) + single composer per surface** (reply mode with "Replying to @name ✕" banner — Mobbin-
> validated; storage key → `complex-tlc-live-v4`). Build 42 = the **MVP toggle** (panel + canvas
> rail + bridge, persisted `complex-tlc-mvp`): ON shows only the spec'd v1 comment-thread
> requirements and hides trail / timeline bar / action bar / re-rank / select-to-comment; mobile
> entry point reverts to the Comment FAB. See the entries below.
>
> **Build 41 state, ON GITHUB + VERCEL:** repo
> **https://github.com/daniiyalali/comments** — push `main` → auto-deploy; the deployed root is the
> **canvas harness**, `/prototype.html` is the bare prototype (`build_live.py` packages `dist/`
> itself, no manual copy).
> **Timeline bar docks at the BOTTOM (user's "Page 3" mock — default; off/top/bottom switchable);
> its comment card is a centered BROWSER: ‹ › steps through comments, the article auto-scrolls
> behind, the referenced paragraph holds a light-gray highlight. Dots = 4px solid black (no stroke,
> hidden 20×24 tap area), bloom to a 20px DP. Bottom bar = the user's "Page 2" `focus` layout
> (DEFAULT): nav deck (‹ RE-RANK ›) expanded at rest + social mini-icon bubble; tap to swap via a
> true in-place morph.** Review via **`canvas.html`** (defaults
> to Mobile + List template). Main deliverable is still `index.html` (real live complex.com page +
> injected comment system, built via `build_live.py` + `live-inject.js`).
> **Mobile bottom = essentials pill; on List articles it merges with the nav deck per
> `rerankVar`: off / stacked / deck / unified / flank / swap / focus (default `focus`).**
> **Mobile timeline = top progress bar with black dots that bloom into DPs.**
> **2026-07-10: the ENTIRE design inventory also lives in Figma as editable frames** —
> https://www.figma.com/design/Ils4e9Naytz66xI6UJ1G49/Comments-Exp (see the entry below).

---

## 2026-07-10 — Build 45: comments removed from the page (drawer-only)
- **User:** "remove the comments from the page. So you can't just scroll to them. It's only side
  sheet on desktop and bottom sheet on mobile." Applies in MVP and full mode.
- **Implementation:** the `.tlc-cend` end-of-page section is **never inserted into the DOM** — the
  element and ALL its render/composer wiring stay in `live-inject.js` (detached node; `renderEnd`
  early-returns on `!cend.parentNode`) so reverting = restoring the one insertBefore line. Entry
  points to the drawer: FAB (desktop + MVP mobile), action-bar comment button (full-mode mobile),
  trail markers → sheet (desktop), timeline-bar dots → card → "View in thread", select-to-comment.
  The drawer already carried empty/loading/sort states and the full list, so nothing was lost.
  MVP note copy updated in both panel + canvas rail ("comments drawer … " instead of "end-of-page
  thread + drawer"). The feed-reply path (`startReply(kind="end")`) is now unreachable but kept.
- **Verified:** JavaScriptCore syntax OK; rebuild OK (749,451 bytes). Pushed with 42–44 in commit a97bc9c.

## 2026-07-10 — Build 44: sticky bottom anchor-ad simulation
- **User (with a live screenshot):** "sometimes we have this ad at the bottom, please add a toggle to
  simulate the ad." The live page pins a full-width **anchor ad** to the viewport bottom: small
  stacked COMPLEX mark on the left, a green 320×50-style creative (LTL carrier: "THE #1 NATIONAL LTL
  CARRIER FOR QUALITY* / ALWAYS DELIVERS" + LEARN MORE + tiny legal line), dismiss ✕ on the right.
- **Why it matters:** it's the stress case for the whole bottom stack — action bar, bottom timeline
  panel, and FAB must clear the ad, in every layout variant AND in MVP mode.
- **Implementation (`live-inject.js`):** `.tlc-ad` fixed bar (z 2147483065, 50px content + safe-area,
  white gutters + recreated creative; ✕ dismisses = toggles off with toast, CTA toasts "simulated").
  `adOn` persisted `complex-tlc-ad` + **`tlc-adon` body class** offsets: FAB 20→70px, abar 16→66px,
  `.tlc-mbar-bot` 0→50px (+safe-area), proto panel 20→70px; `placeMbar()` now ends the bottom
  timeline panel at the **measured ad top edge** instead of the screen bottom. Drawer/sheets (higher
  z) still slide over the ad — modal surfaces. Controls: `#tlcSwAD` in the in-page panel (grouped
  with the page conditions after Template — deliberately NOT `.tlc-pg-exp`, so it does NOT gray out
  in MVP; it's a page condition, valid in both modes), `#swAD` in the canvas rail, bridge
  `{type:"ad"}` in `sendAll`. Default OFF.
- **Verified:** JavaScriptCore syntax OK; rebuild OK (749,106 bytes); ad markup + switches confirmed
  in `index.html` and `dist/`. Pushed in commit a97bc9c.

## 2026-07-10 — Build 43: flat reply-to-reply + one composer per surface
- **User spec:** replies to replies are allowed, but the hierarchy stays **max one level deep** —
  replying to a reply lands in the same indented tier and just carries an "@name" of who's being
  answered (YouTube/Instagram-style flattening). Applies in MVP **and** full mode (same component).
- **Then, mid-build:** the user noticed that replying put **two comment boxes on screen** (inline
  reply box + the surface's own composer) and asked to check **Mobbin** and keep ONE box for both.
  Mobbin confirmed the standard: [HYPE](https://mobbin.com/screens/359350d7-729e-4ba4-8e4f-7f6967fe4ae8)
  (publisher), [Spotify](https://mobbin.com/screens/d8031e04-0c81-4ff0-bf71-d0e466b15412),
  [NAVER](https://mobbin.com/screens/8321c75a-018f-4f4a-b974-1f357bc5f7fa),
  [Instagram](https://mobbin.com/screens/30df9dc7-3473-45af-ac50-216c3907d0c6) — one persistent
  composer that switches into reply mode with a dismissible "Replying to @name ✕" banner above the
  input (mention prefilled for sub-replies). No inline second box anywhere.
- **Implementation (`live-inject.js`):**
  - `replyHtml(r,pid)` — reply cards now have a **Reply** button carrying `data-id`=parent +
    `data-to`=reply author; `phCard` also threads `pid`. A leading `@mention` in reply text renders
    via `.tlc-mention` (semibold black). Seed `s6r3` demos it → **storage key bumped
    `complex-tlc-live-v3` → `v4`** (project rule: bump on seed change).
  - `replyCtx={pid,author}` + `startReply(pid,author,mention,kind)` — feed (`cendComp`) and drawer
    (`dwComp`) composers get reply mode: banner chip (reuses `.tlc-dw-quote` styling, ✕ =
    `.tlc-rc-x` cancels and PRESERVES typed text), placeholder "Reply to @name…", button "Post
    reply", "@author " prefilled when replying to a reply. `submitComposer` appends to the parent's
    `replies` and clears `replyCtx`; also cleared on `openDrawer`/quote-open/reset (both paths).
  - The inline `.tlc-rbox` is **gone from feed + drawer cards** (`opts.tag` gate in `cmtHtml`); the
    desktop marker **sheet keeps it** — that surface has no persistent composer, so no duplication.
  - Feed reply scrolls the composer into view (it sits above the list) before focusing.
- **Verified:** JavaScriptCore syntax OK; rebuild OK (744,772 bytes); `tlc-rc-x`/`startReply`/
  `tlc-mention` confirmed in `index.html` + `dist/`. Pushed in commit a97bc9c.
- **Figma mirror pending:** card sheet (Reply on replies + @mention) and composer sheet (reply-mode
  banner state) — add when the Figma catch-up pass happens (sort flip-toggle is also still pending).

## 2026-07-10 — Build 42: MVP toggle (v1 spec scope)
- **User asked for an "MVP" toggle in the prototype control**: ON = exactly the v1 requirements list —
  comment thread on article & list templates (placement/entry point, empty state, loading skeleton,
  sort toggle, Load more → drawer as the pagination pattern), composer (2,000-char counter, first-time
  guidelines, auth gate, banned notice), comment card (top-level + one reply tier, edit <5 min,
  [deleted by author] with replies kept, [removed by moderator]), reactions (affordance + count +
  expandable who-reacted), report/flag (auth-only) + confirmation, and the profile notification-
  settings modal (email-on-reply + weekly digest). All of these already existed — MVP mode *subsets*
  the prototype rather than adding UI.
- **Hidden while ON** (experimental / beyond-v1 layers): desktop margin trail, mobile timeline bar +
  its browser card, the mobile action bar and all seven re-rank ⨯ essentials variants,
  select-to-comment, and the cards' timeline anchors (snippet quotes, "% badge", "Jump to spot").
  **Mobile entry point reverts to the plain Comment FAB** (`.tlc-mvp .tlc-fab{display:flex!important}`
  inside the <1024px media block outranks the base mobile hide).
- **Implementation:** `mvpOn` state (persisted `complex-tlc-mvp`) + a **`tlc-mvp` body class** (CSS
  belt-and-braces hides `.tlc-trail/.tlc-mbar/.tlc-mcard/.tlc-abar/.tlc-seltip`) + JS guards in
  `renderTrail`, `updateFill`, `renderMbar`, `updateMbar`, `renderAbar` (early return, empties the
  bar), `showSel`, and `cmtHtml` (no tag/snip, no jump button). `setMvp()` toggles class + persists +
  `hideSel()/closeMcard()` + `syncProto()/refresh()`. Switches: `#tlcSwMVP` (in-page panel — moved
  to the VERY TOP, above Viewer, same day per the user), `#swMVP` (canvas rail — also first, an hr
  separates it from Viewer), bridge message `{type:"mvp", value:bool}` (sent in `sendAll`).
  The experiment controls get `.tlc-pg-exp` / `.grp.exp` and gray out (`.mvpdim`, opacity .4 +
  pointer-events none) while MVP is ON — stored values untouched, so flipping MVP off restores the
  previous setup exactly.
- **Verified:** JavaScriptCore syntax check OK; `python3 build_live.py` OK (741,302 bytes, 36 images);
  toggle markup confirmed present in `index.html`, `dist/prototype.html`, `dist/index.html` (canvas).
  No visual check possible in this sandbox, as usual.
- **⚠️ Per the user mid-build: "keep it local for now" — NOT committed, NOT pushed.** Working tree has
  the Build 42 changes (`live-inject.js`, `canvas.html`, `index.html`, `dist/*`, docs). Figma mirror:
  no update needed — MVP adds no new UI (the control panel is excluded from the Figma inventory and
  MVP screens are subsets of existing frames).

## 2026-07-10 — Repo + deploy: GitHub (daniiyalali/comments) → Vercel; canvas is the deployed root
- **git init + pushed to https://github.com/daniiyalali/comments** — the push worked via the user's
  macOS keychain git credentials (no token needed; user offered one — classic PAT with `repo` scope
  is the answer if ever required). `.gitignore`: `.DS_Store`, `.claude/settings.local.json`, the zip.
- **Vercel via Git integration** (no node/npx/vercel CLI in this sandbox): `vercel.json` =
  `{buildCommand:null, outputDirectory:"dist"}`; the user imports the repo once at vercel.com/new,
  then every push auto-deploys. Vercel domain can be renamed/custom-domained anytime (Settings →
  Domains; renaming the `.vercel.app` name breaks old links).
- **User: "can we not upload how we have it in prototype? Like on a canvas?"** → the DEPLOYED SITE
  OPENS ON THE CANVAS: `build_live.py` now packages `dist/` itself — `dist/index.html` = canvas
  harness (iframe retargeted `index.html`→`prototype.html`), `dist/prototype.html` = the
  self-contained prototype. The manual `cp index.html dist/` step is GONE. Root-level files unchanged
  (local `canvas.html` still embeds local `index.html`).
- Commit convention: build-numbered messages + `Co-Authored-By: Claude Fable 5`. Pending: record the
  live `*.vercel.app` URL in docs once the user shares it.

## 2026-07-10 — Build 41: bottom-mode comment card → comment BROWSER (centered + ‹ › + auto-scroll + held highlight)
- **User iteration on Page 3:** when the card appears (bottom mode): (1) card is **centered**, (2) has
  **tiny ‹ › arrows** to step between comments, (3) the **article auto-scrolls behind** to each
  comment's spot, (4) the referenced paragraph holds a **super-light-gray highlight** — browse all
  comments in place without ever opening the drawer.
- Implementation: `mcardIdx` tracks the current cluster; `.mc-nav` (24px bordered buttons, CHEV_L/R,
  disabled at ends) appended to the card footer in bottom mode only; arrow tap → `openMcard(idx±1)`
  re-renders in place. On open/step: `window.scrollTo(progToY(progress), smooth)` + `mlit(nearestPara)`
  — `.tlc-mlit` = persistent `#f0f1f2` (B3, deliberately lighter than the `#e5e5e5` `.tlc-flash` jump
  flash); `mlit(null)` on close/dismiss clears it. Top mode keeps the old dot-anchored card + arrow.
- Clusters are progress-ordered so ‹ › walk the article top→bottom; scrolling behind also animates the
  bar fill + dot blooms live, which reinforces the position feedback.
- ⚠️ **Detached-target gotcha (user hit it):** the ‹ › tap re-renders the card's innerHTML, so by the
  time the document-level outside-click handler ran, the clicked button was detached →
  `e.target.closest(".tlc-mcard")` = null → card closed instead of stepping. Fix: `e.stopPropagation()`
  in the nav branch. General rule: any in-card control that re-renders the card must stop propagation
  (or the outside-click check must use coordinates, not ancestry).

## 2026-07-10 — Build 40: timeline bar moves to the bottom (user's Figma "Page 3" mock), position switchable
- **The user mocked Page 3 (node `98-100`, frames `98:120`/`98:194`/`98:561`)**: the mobile timeline
  bar relocates from under the top nav to the BOTTOM — the top edge of a white panel above the action
  bar; works with both focus states; **tapping a bloomed dot opens the comment card UPWARD** above the
  bar (mock card: avatar/name/"2d · at 45%"/✕/text/♥ 18/"View in thread" — same `.tlc-mcard`, no arrow).
- **Implemented as a position setting, not a replacement** (comparable-variants preference):
  `mbarPos` = off | top | bottom, default **bottom**; legacy `complex-tlc-mbar` "1"/"0" → bottom/off.
  Bottom mode: `.tlc-mbar-bot` (top:auto, bottom:0, border-top, inline height) + `placeMbar()` sizes
  the white panel off the LIVE abar rect (`winH - abarTop + 12`) so any bottom-bar variant/height
  works; abar z-index 2147483001→2147483060 so pills float over the panel (mcard 2147483100 still on
  top). `openMcard()` bottom-anchors the card (`mc-bot` hides the arrow) via `style.bottom`.
- Controls updated in all three surfaces: in-page panel switch → **3-way seg (Off/Top/Bottom)**
  (`data-g="mbar"` in the shared seg handler), canvas rail switch → **select `#selMB`** (default
  bottom), postMessage bridge accepts strings + legacy booleans. No `mbarOn` refs remain.
- Figma mirror: Page 3 is the user's own mock; the main inventory page still shows the top-bar-only
  timeline (fine — position is now a switchable condition, both exist in the prototype).
- **Spacing fix (user: "super cramped"):** panel height is `winH - abarTop + 23` — the 3px track sits
  FLUSH at the panel's top edge (bottom mode strips the base border/padding chrome) + a clear **20px
  track→action-bar gap** (the Figma value). First cut (+12) left ~4px visually — the +N must count
  what's above/including the track, not just the gap.
- **Edge fix (user):** in the mock the track is at the absolute panel edge and the 7px dots/bloomed
  DPs BLEED past it over the article. Bottom mode now has `padding:0;border-top:0` (`.tlc-mbar-bot`),
  the full-width track itself is the visual edge, and dots overflow it naturally (no clipping).
- **Bloomed DP = 20px** (was 16px; Page 3 mock value — Page 2 had drawn it at 16), initials 9px.
  Resting dot stays 7px. **White stroke removed from the dots (user)** — needed `border:0` EXPLICITLY
  on `.tlc-mdot .tlc-av`: just deleting its own border fell back to the base `.tlc-av` rule's
  `border:2px solid #fff` (trail markers) and the ring came back (user caught it). Dots are solid
  **4px** black (user walked 7→6→4 once the ring was gone) with just the soft shadow; the bloomed DP
  (20px) has no ring either. At 4px the dot got an **invisible ~20×24 hit area** (`.tlc-mdot`
  padding + grid centering) so taps still land.

## 2026-07-10 — Build 39: focus layout — "NEXT · ITEM #N" tip removed (user tweak)
- Removed the floating "NEXT · ITEM #N" label from the focus variant entirely — no tip on scroll or
  on arrow taps (unified/flank/swap keep theirs for comparison). Focus deck = pure ‹ RE-RANK › with
  no caption.
- ⚠️ Gotcha fixed: `updateAbarNav()` early-returned when no `.tlc-ab-cap` exists — with the tip gone,
  focus's prev/next end-disabling would have silently stopped updating. Now gates on `rerankActive()`
  instead and treats the label as optional.

## 2026-07-10 — Build 38: RE-RANK button rounded (user tweak)
- Expanded-deck RE-RANK is now a full pill (`border-radius:999px`, was the mock's 4px rectangle) —
  per the user. Shape no longer animates on collapse (both states round); dropped border-radius from
  the rank transition + the `.min` override. Everything else unchanged.

## 2026-07-10 — Build 37: comment sort = single flip toggle (Mobbin-validated)
- **User asked whether the two-button sort row is typical and if it can be a toggle; scanned Mobbin
  (MCP `search_screens`, iOS)** before changing. Findings: the DOMINANT pattern is a compact single
  trigger showing the active order ("Sort by Newest ▾" NYTimes · "Most relevant ⇅" LinkedIn ·
  "Most Recent ▾" Binance · icon-button Substack) that opens a menu/action sheet; visible chip rows
  exist too (YouTube "Top/Timed/Newest"). Two side-by-side buttons like ours were NOT a common pattern.
  With only two orders, a menu is overkill → collapsed to a **one-tap flip toggle**.
- **Change:** `sortControlHtml()` now renders `Sort  [⇅ Most recent]` (one `.tlc-sortt` button, reuses
  `RANK_ICON` ⇅); tapping flips recent⇄popular (`flipSort()`), used in both the end feed and the
  drawer. Removed `.tlc-sortb` two-button row + its delegation.
- **Figma mirror PENDING:** the component sheet in Comments-Exp still shows the old two-button sort
  (both states) — update it once the toggle direction is confirmed.

## 2026-07-10 — Build 36: focus layout — RE-RANK black-button root fix + stateful mini cluster
- **User: "re-rank button needs to be black, icon and copy white — not happening."** Root cause was a
  LATENT SPECIFICITY BUG: the global `.tlc-ab-rank{background:#000;color:#fff}` (0,1,0) loses to the
  base `.tlc-abar button{background:none;color:#16181c}` (0,1,1). Older variants only looked right via
  their own stronger rules (`.tlc-ab-nav .tlc-ab-rank`); focus/unified/flank had transparent RE-RANK
  with dark text, and collapsed-focus showed a dark icon on the black bubble (invisible). Fix at the
  root: scoped the rule to `.tlc-abar .tlc-ab-rank` (0,2,0) — fixes every variant at once.
- ⚠️ **Burned once:** put BACKTICKS in a CSS comment inside the template literal → terminated the
  string → whole injected script was a syntax error, and `build_live.py` happily built it. The
  JavaScriptCore parse check (osascript) caught it AFTER the build had already shipped to `index.html`.
  **Always run the parse check BEFORE building; never use backticks anywhere inside the CSS template.**
- **User (mid-turn): the collapsed mini cluster must reflect hearted/saved state** (was reverting to
  uninteracted icons on collapse, since collapse only toggles classes and never re-renders). Fix:
  `.fh`/`.fb` mini spans get `on` classes (heart red-filled, bookmark black-filled) — baked into
  `renderAbar()` markup from `artLiked`/`artSaved` AND mirrored live inside the like/save click
  handlers (`.tlc-fsoc .fh/.fb` classList sync), matching how the count node is updated in place.

## 2026-07-10 — Build 35: focus layout — true morph + the real Figma shuffle glyph (user feedback on 34)
- **User feedback:** "The animation is not smooth. It really needs to transform in between 2 states.
  The Re-rank button is wrong, i cant see icon."
- **Icon root cause:** Build 34 drew a hand-made STROKE shuffle, but the shared `.tlc-abar svg{fill:none;
  stroke:currentColor;stroke-width:1.9}` rules + the mock's actual icon being a FILLED Streamline Sharp
  glyph made it wrong/invisible. Fix: downloaded the actual asset from the Figma MCP asset URL
  (`get_design_context` const → `curl`), inlined its exact path as `SHUF` (viewBox `0 0 24 21`) with
  **path-level `fill="currentColor" stroke="none"`** so the shared svg rules can't blank it.
  ⚠️ Lesson: Figma MCP asset URLs are downloadable for ~7 days — inline real glyph paths instead of
  redrawing icons by hand; and check new icons against the shared `.tlc-abar svg` fill/stroke resets.
- **Animation root cause:** 34 faded the bar out (150ms), re-rendered innerHTML, faded in — reads as a
  blink, not a transform. Fix (the current architecture): in the `focus` branch BOTH slots are always
  in the DOM; `applyFocus()` only toggles `.min` (deck) / `.exp` (bubble) classes — **no re-render mid-
  swap** — and CSS does a coordinated two-sided morph on one curve (`.38s cubic-bezier(.4,0,.2,1)`):
  deck `flex:1 1 240px → 0 0 52px` + gap/padding→0 + white→black + prev/next width 40→0 & fade + rank
  40px rect (radius 4) → 50px circle (radius 999) + label `max-width→0` fade + icon 20→24px; bubble
  `max-width 52→320px` while the absolute mini-icon layer (`.fmini`) crossfades into the real
  essentials row (`.fx`, opacity with .14s delay). Heights are constant 52px both states so nothing
  jumps vertically. `renderAbar()` still bakes the current classes on full refresh (no animation then).
- Removed `.tlc-fbubble` (the collapsed re-rank is now the deck itself in `.min`); collapsed-state taps
  are caught in the abar click listener BEFORE the inert `.tlc-ab-rank` guard; hidden prev/next get
  `pointer-events:none`.
- Rebuilt + `dist/` + zip refreshed; parse-checked via JavaScriptCore. Still needs a real-browser look.

## 2026-07-10 — Build 34: "focus" layout — deck ⇄ social bubble tap-to-swap (from the user's Figma mock)
- **The user designed this one themselves** in the Comments-Exp Figma file, page "Page 2" (node `2-2`,
  frames "State 1" `83:271` / "State 2" `83:384`) and asked to look at the bottom bar only. Implemented
  1:1 from the Figma specs (`get_design_context` on `83:458` + `83:479`).
- **Concept — two slots that trade focus** (`focusSoc` boolean, session-only):
  - **State 1 (rest / default on list articles — "re-rank is the default interaction"):** full-width
    white nav pill (radius 999, padding 6, gap 4, shadow `0 8px 30px rgba(0,0,0,.18)`): 40px white
    `‹` circle · flex-1 black **RE-RANK** button (radius 4, 20px shuffle icon + 12px/800 uppercase,
    inert) · 40px red `›` circle — plus a **52px white bubble** on the right (shadow `0 8px 15px`)
    holding three overlapped 18px mini icons (heart 7,13 / comment 25,8 / bookmark 19,26).
  - **State 2 (after tapping the bubble):** re-rank collapses to a **52px black circle with a 24px
    white shuffle icon**; essentials pill expands to the standard pill WITH counts (heart 249 red-on /
    comment n / bookmark). Tapping the black bubble swaps back. Both centered, gap 4, margins 16.
  - Transition reuses the `swap` variant's `.tlc-swapping` fade (150ms), scale tweaked for the
    non-translated container (`.tlc-abar-focus.tlc-swapping{transform:scale(.96)}`).
- **Code:** new `SHUF` shuffle SVG (Figma used a Streamline shuffle; drew an equivalent inline);
  `.tlc-fdeck` (expanded nav pill) / `.tlc-fsoc` (social bubble) / `.tlc-fbubble` (collapsed re-rank);
  `focus` branch in `renderAbar()`; bubble taps handled in the abar click listener BEFORE the inert
  `.tlc-ab-rank` guard (the black bubble must toggle back; the RE-RANK button itself stays inert);
  floating "NEXT · ITEM #N" tip shows while scrolling in state 1 only.
- **Defaults changed:** `rerankVar` default `deck` → `focus` in `live-inject.js` AND canvas
  (`state.rerank`), so fresh opens show the new iteration. NOTE: a previously-persisted
  `complex-tlc-rerank-var` still wins in standalone `index.html` (canvas always posts its rail state,
  so canvas is unaffected) — use the dropdown or Reset if an old value sticks.
- Added to all three control surfaces as **"Deck + bubble (tap to swap)"** (`#tlcSelRR`, `#selRR`,
  postMessage bridge validates via `RR_VARS`).
- Verified `live-inject.js` parses (no node in sandbox — used `osascript -l JavaScript` /
  JavaScriptCore `new Function(src)`; the old brace-count check is unreliable, don't trust it).
  Rebuilt `index.html`, re-copied `dist/`, re-zipped `complex-comments-netlify.zip`. Still needs a
  real-browser visual check.
- **Figma NOT re-mirrored** — the design already exists there (the user drew it); the Build 33
  comparison section on the main page doesn't yet include a `focus` entry if a full 7-way comparison
  frame set is wanted later.

## 2026-07-10 — Figma export: full design inventory → “Comments-Exp” file (editable frames)
- **Everything in the prototype (except the prototype control panel + canvas harness) was rebuilt in
  Figma as native editable frames** — real auto-layout, vector SVG icons, Inter text, design tokens
  (#f03c3c red / #e1e3e5 lines / #f0f1f2 B3 / 4px radius) — NOT screenshots. Built via the Figma MCP
  (`use_figma` Plugin-API scripts; article context is a faithful mock, not a scrape).
- **File:** https://www.figma.com/design/Ils4e9Naytz66xI6UJ1G49/Comments-Exp — file key
  `Ils4e9Naytz66xI6UJ1G49`, page “Comments Exp — all designs & states” (id `0:1`). **Five sections:**
  1. **📱 Bottom bar — Build 33 comparison:** the 7 variant screens (essentials-only / stacked / deck ⭐ /
     unified / flank / swap-rest / swap-scrolling) on full article context, + nav-deck boundary states
     (“NEXT · ITEM #1” prev-disabled, “LAST ITEM” next-disabled).
  2. **🗂 Re-rank iterations — Build 32 set, labeled “superseded”:** pill / tab bar / hero / inline
     screens + the reorder sheet in BOTH states (open with rank badges + arrows; submitted 🏆 +
     “Edit my ranking”). Sheet labeled “placeholder, wired in a separate file”.
  3. **📱 Timeline bar / drawer / feed:** resting dots → bloomed DP → tapped dot → mcard; drawer
     populated + drawer LOADING (skeletons, “List comments (…)”); end feed w/ snippets + Load more;
     empty; skeleton; snippet-jump flash (#e5e5e5).
  4. **🧩 Component sheets:** composer ×6 (editor/counter, over-limit, guest gate, banned, guidelines,
     quote-chip compose); card ×8 (who-reacted, edited, own-menu, deleted-with-replies, removed,
     report+confirmation, inline edit, reply box open); essentials pill both engagement states; sort
     both states; seltip / quote chip / toast / FAB / switches; notification-settings modal.
  5. **🖥 Desktop:** trail+FAB default; marker hover→popover; drawer open; marker click→bottom sheet;
     margin-timeline OFF.
- **Prototype interactions wired** (two flows, “Mobile flow” + “Desktop flow”): comment buttons &
  Load more → drawer; bloomed dot → mcard; marker hover → popover; marker click → sheet; FAB →
  desktop drawer; every ✕ → Back. **Re-Rank buttons deliberately unwired** (inert by design).
- Process notes: `figma-use` skill loaded via MCP resource before every `use_figma` call; built
  incrementally (base screen → clone ×7 → per-variant bottom modules); user audited twice — first
  audit added reply-box, boundary states, flash, quote-chip composer, pill alternates, desktop
  trail-off; second (“EVERYTHING”) added the whole Build 32 section + reorder sheet + loading drawer.

## 2026-07-09 — Build 33: Re-rank = nav deck (‹ › + inert RE-RANK); six merge layouts vs the essentials pill
- **User reframed the problem** (with screenshots of the real components): the re-rank floater is NOT
  just a button — it's a **white card**: "NEXT · ITEM #1" label top-right + three buttons — `‹` (white,
  gray chevron) = jump to previous list item, **RE-RANK** (black) center, `›` (**red**) = next item.
  It appears on **list articles only**; the essentials pill (❤ 249 / 💬 28 / 🔖) is default on ALL
  articles — so list articles would show BOTH floaters. Task: **find a better merged UX.**
- **Hard constraint: Re-Rank tap does NOTHING here.** The re-ranking interaction is handled in a
  separate file — the old `.tlc-rr` reorder sheet stays in the code but is **unwired** (no entry point
  calls `openRerank()` anymore); the abar click handler explicitly returns on `.tlc-ab-rank`.
- **Arrows are real in-page nav:** `curEntryIdx()` = last entry `h2` above the reading line
  (`scrollY+headerBottom()+14`); `goEntry()` smooth-scrolls to `docTop(h2)-headerBottom()-10`;
  `navPrev()` is track-style (first tap → current item top, then previous); prev disabled above item 1,
  next disabled at the last item; label = "NEXT · ITEM #(idx+2)" → "LAST ITEM", updated in the scroll rAF.
- **Six layouts** (`rerankVar` ∈ `RR_VARS`, persisted `complex-tlc-rerank-var`, default **deck**; old
  Build-32 stored values [pill/bar/hero/inline] fail validation and fall back to deck):
  - **off** — essentials pill only (what non-list articles always get).
  - **stacked** — status-quo baseline for comparison: essentials pill floating above the full-width deck.
  - **deck** — ⭐ one card, two rows: essentials (with counts) fold into the deck's label row, left of
    "NEXT · ITEM #N" (that row was dead space in the real component); nav trio below. Lowest-risk merge.
  - **unified** — one pill, one row: `‹ RE-RANK › | ❤ 💬 🔖` (counts dropped to fit 375px; the
    "NEXT · ITEM #N" becomes a floating `.tlc-ab-tip` above the pill that fades in while scrolling).
  - **flank** — nav at the edges: round `‹` `›` at screen left/right, essentials pill (with a black
    Re-Rank segment) centered. Reads as "page controls" vs "actions".
  - **swap** — one slot, context-aware: essentials at rest; while scrolling it morphs (150ms fade) into
    `‹ RE-RANK ›` + tip; morphs back ~1.6s after scrolling stops. Navigation while moving, actions at rest.
- **Gating:** variants only render when `pageType==="list"` (`rerankActive()`); picking a non-off
  variant **auto-switches Template→List** in both the in-page panel and the canvas rail (which now
  defaults to `page:"list"`, `rerank:"deck"` so the merge is visible on load). Article template =
  essentials only, regardless of the selector.
- Removed Build-32 leftovers: `injectInlineRerank`/`removeInlineRerank`, `.tlc-rr-inline`,
  `.tlc-abar-bar`, `.tlc-abar-hero` CSS. `refresh()` now also calls `renderAbar()`.
- New shared CSS: `.tlc-ab-nav` (the deck's button trio), `.tlc-ab-cap` (label), `.tlc-ab-tip`
  (floating label), `.tlc-ab-pill`, `.tlc-ab-deck`; variant classes `tlc-abar-stack/-deck/-uni/-flank/-swap`.
- Verified: JS syntax OK (JXA `new Function`; no node in sandbox); rebuilt `index.html` (727,710 B,
  36 entry images), `cp` → `dist/`, re-zipped `complex-comments-netlify.zip`. Still needs a human
  browser pass (sandbox can't screenshot).

## 2026-07-09 — Build 32: Four re-rank ⨯ comments coexistence layouts (mobile), switchable
- **User wants to COMPARE options, not commit to one** ("mockup different ways it can show up on
  mobile"). Also clarified the re-rank interaction = **the arrows that reorder the list + the "Re-Rank"
  button**, NOT the popup that opens on tap (that's not what we're evaluating).
- Replaced the single re-rank on/off toggle with a **layout selector** (`rerankVar`, persisted
  `complex-tlc-rerank-var`, default `pill`) in the canvas rail (`#selRR`), the in-page panel
  (`#tlcSelRR`), and the postMessage bridge. `renderAbar()` branches on it:
  - **off** — bottom bar = ❤ 💬 🔖 only.
  - **pill** — `[Re-Rank] | ❤ 💬 🔖` in one floating capsule.
  - **bar** — `.tlc-abar-bar`: full-width docked tab bar, 4 equal icon+label cells.
  - **hero** — `.tlc-abar-hero`: icons row + full-width black "Re-Rank this list" CTA below.
  - **inline** — bottom bar = ❤ 💬 🔖; `.tlc-rr-inline` CTA injected in the article (after the title +
    before the end section), Complex-style. `injectInlineRerank()`/`removeInlineRerank()`.
- Reorder surface (`.tlc-rr` sheet) left as-is per the user (not the thing being evaluated); every
  Re-Rank entry point still opens it. Mobile-only throughout; desktop unaffected.

## 2026-07-09 — Build 31: Re-rank module folded into the mobile bottom bar (+ toggle)
- **Ref (user): complex.com/music/a/…/best-rap-verses-2026** — Complex's real "Re-Rank" interaction:
  a **"Re-Rank"** CTA near the title and again after the article (alongside Save/Share) that opens a
  separate ranking page for the list's items (15 there). No aggregate shown on the article page.
- **Coexistence solution (the ask):** fold **"Re-Rank"** into the SAME mobile bottom bar as a leading
  primary black button + a divider, then the like/comment/bookmark icons — one bar does both. `renderAbar()`
  now rebuilds the bar with/without the re-rank segment; the delegated click handler routes `.tlc-ab-rank`.
- **Re-rank sheet (`.tlc-rr`, mobile bottom sheet w/ dim backdrop):** reader reorders the list items with
  **up/down arrows** (rank badges + thumbnails from `ENTRIES.slice(0,8)`, `cleanName()` strips the year
  prefix), **Submit my ranking** → confirmation state ("Your #1: …") + **Edit my ranking**. Order persists
  `complex-tlc-rerank-order`; Reset clears it.
- **Toggle:** `rerankOn` (persisted `complex-tlc-rerank-on`, default on) — in the in-page panel
  (`#tlcSwRR`), the canvas rail (`#swRR`), and the postMessage bridge (`type:"rerank"`). **Mobile-only**
  (the whole bottom bar is mobile-only). Desktop unaffected.

## 2026-07-09 — Build 30: Mobile bottom action bar (heart / comment / bookmark)
- Per user (ref: complex1.framer.website/weekend-article — a Framer SPA, couldn't scrape exact styling,
  matched the pattern): a **mobile-only floating pill** at the bottom with three article-level actions.
  `.tlc-abar` (centered, `border-radius:999px`, white, soft shadow, `bottom:16px + safe-area`).
  - **Heart** = like the *article* (`artLiked`, base count `ART_LIKE_BASE=248`, red fill when on,
    persisted `complex-tlc-artlike`).
  - **Comment** = `openDrawer()`, shows live comment count (kept in sync via `updateFab()` → `#tlcAbCmt`).
  - **Bookmark** = save the article (`artSaved`, filled when on, persisted `complex-tlc-artsave`), toast.
- **Replaces the FAB on mobile** (`@media(max-width:1023px){.tlc-fab{display:none}.tlc-abar{display:flex}}`);
  **desktop keeps its FAB** + margin trail. New icons `CHAT` + `BOOKMARK`.
- Also (earlier this session): canvas now **defaults to Mobile** on refresh; removed the red focus
  ring on the bloomed mobile DP.

## 2026-07-09 — Build 29: Mobile bar — black dots that bloom into DPs, no numbers, padded
- Per user: on the mobile timeline bar, markers now rest as **plain black dots** (7px, white-ringed so
  they stay visible over the black fill) with **no count-number badges at all**. When the fill front
  reaches a dot it **blooms into the DP** (colored avatar + initials) — same look as before — then
  shrinks back to a black dot after passing. Color carried via a `--dp` CSS var (set on the avatar
  span) so `.tlc-mact` swaps `background:#000`→`var(--dp)` and reveals the initials; smooth transition.
- Bar restructured to `.tlc-mbar` (`pointer-events:none`, **`padding:4px 0`**, **white `#fff` fill +
  bottom hairline** so it seats under the nav instead of floating) → inner `.tlc-mbar-track` (3px line +
  fill); dots live on the track (`pointer-events:auto`).
- Desktop margin trail is unchanged (still clusters with a numeric badge — that's the only remaining
  `.tlc-cl` usage).

## 2026-07-09 — Build 28: Canvas preview harness (device switch + external controls)
- **Idea (user):** a canvas where you switch Desktop/Mobile easily and the controls live **outside**
  the previewed UI (not floating over it). This revives the device-preview concept removed in Build 14,
  done properly.
- **`canvas.html`** (standalone; NOT part of the build). Left **control rail** replicates every
  condition (Viewer · First-time · Comments · Template · Margin timeline · Timeline bar · Notification
  settings · Reset · Reload frame). Stage has a **Desktop (1440×900) / Mobile (390×844)** segmented
  switch and renders `index.html` in a scaled device frame (browser chrome for desktop, phone bezel +
  notch for mobile). `layout()` scales-to-fit (transform scale, capped 1×) on load/resize/device-change.
- **Bridge (postMessage):** `live-inject.js` now detects `EMBED` (`window.top!==window.self`), **hides
  its in-page `.tlc-proto`** when embedded, listens for `{__tlc:1,type,value}` messages
  (user/cmt/page/gl/trail/mbar/ns/reset), and posts `{type:"ready"}` to the parent on boot. The harness
  is the source of truth: on `ready` (and on iframe `load`, as a fallback) it `sendAll()`s current state.
  Uses one iframe that just resizes between device widths so both breakpoints share one instance and the
  prototype re-evaluates its responsive logic on resize.
- **Note:** over `file://` the entry images stay blank (known) and cross-origin DOM access is blocked,
  but **postMessage works**, so the harness drives the frame fine. Rebuilt `index.html` + synced `dist/`.

---

## 2026-07-09 — Build 27: Mobile timeline — top progress bar with comment DP dots
- **Idea (user):** the mobile counterpart to the desktop margin trail. A **slim (3px) black scroll-
  progress bar pinned right under the sticky nav**; along it sit **tiny comment DP dots** (the
  commenters' avatar circles, positioned at each comment's progress%). As the fill front reaches a dot
  it **swells +2px** to pull focus, then shrinks back as you scroll past. **Tap a dot → a compact
  comment card floats in right below it** (author/%/time, text, ❤ like, "View in thread"), with an **X**
  to dismiss. Mobile-only (<1024px).
- **Anchor (fixed post-review):** the mobile nav is **two stacked FIXED rows** — the top bar (`top:0`,
  ~48px) and the **category pills row `.pillbox`** (`top:48px`, ~53px, "GET THE APP / Style / …").
  Because the rows are `fixed`, the `site-header` wrapper collapses to 0 height, so measuring it put the
  bar at the viewport top. `headerBottom()` now measures **`.pillbox`'s `getBoundingClientRect().bottom`
  (~101px)** each frame → bar sits right **below the pills**; fallback scans header fixed/sticky rows,
  then 52px.
- **Impl (`live-inject.js`):** `.tlc-mbar` (fixed track) + `.tlc-mbar-fill` (black, width = `curProgress`)
  + `.tlc-mdot` avatar dots. `buildMClusters()` clusters by **pixel proximity along the bar width**
  (<16px) so tiny DPs don't overlap → clustered dot shows a count badge. `renderMbar()` builds dots,
  `updateMbar()` (in the scroll rAF) sets fill + toggles `.tlc-mact` (active, +2px) when
  `|curProgress − clusterProgress| < 4`. `openMcard()` positions `.tlc-mcard` below the tapped dot with
  a caret, clamped to viewport. Card like reuses new `doLike()` (also now used by the thread `onClick`);
  "View in thread" → `openDrawer()`. Closes on X / Escape / outside tap / resize.
- **Toggle:** new **"Timeline bar"** switch in the prototype panel (persisted `complex-tlc-mbar`,
  default on), separate from the desktop **"Margin timeline"** switch — both patterns are independently
  toggleable, each rendering only on its own breakpoint.
- Rebuilt + synced `dist/` + zip. NOT visually verified in-sandbox — **view at <1024px width** (device
  toolbar) to see the bar.

---

## 2026-07-09 — Build 26: New requirements batch — all states + a condition control panel
- **Decision (user, via AskUserQuestion + follow-up):** integrate the new requirements into the LIVE
  prototype (not a standalone gallery), use a **"Load more" button** (kept the existing pattern), and
  add **toggles for all different conditions**.
- **Prototype control panel** (redesigned `.tlc-proto`, bottom-left, collapsible; now visible on all
  viewports, default-open on desktop). Segmented/switch toggles for every condition:
  - **Viewer:** Guest (anon) / Signed in / Banned. Persisted `complex-tlc-user`.
  - **First-time user:** switch → shows the community-guidelines prompt before first post. Acceptance
    persisted `complex-tlc-guidelines`.
  - **Comments:** Populated / Empty / Loading (skeleton). Not persisted (demo control).
  - **Template:** Article / List. Persisted `complex-tlc-pagetype`; list adds a "commenting on the
    list overall" note + relabels headings.
  - **Margin timeline:** existing desktop-only trail switch (`complex-tlc-trail`).
  - Buttons: **Notification settings** (opens the profile modal) + **Reset demo data**.
- **Composer** refactored to a shared `composerInner(kind)` rendered into persistent containers
  (end + drawer), state-aware: **auth gate** (anon), **banned notice** (red, warn icon — the
  "notification signal to frontend"), **community-guidelines card** (first-time), or the **editor with
  a live 2,000-char counter** (`N / 2000`, turns red + disables Post when over). Delegated input/click
  wiring (`wireComposer`) so re-rendering innerHTML never loses listeners.
- **Comment card** states: `edited` → "· edited"; `deleted:true` → **[deleted by author]** placeholder
  (kept when it has replies, else removed); `removed:true` → **[removed by moderator]** placeholder;
  inline **Edit** (own comments, `editable()` = 5-min window, via `editingId` re-render); **Delete**.
- **Reactions:** heart affordance + count (existing), plus a **"Who reacted"** expandable list
  (`reactorsHtml` → avatar stack + "@a, @b and N others reacted"). Liking adds `you` to `reactors`.
- **Flagging:** overflow **⋯ menu** (auth-only) with **Report** (others' comments) / Edit+Delete
  (own). Report → toast **"Report received…"** + persistent "You reported this" note + menu shows
  "✓ Reported". Reply/like/report all gated: guest → "Sign in to…" toast, banned → suspended toast.
- **Sort toggle** (Most recent / Most popular) in the end-section header + drawer toolbar; recency via
  `tsOf()`/`parseAgo()` (seeds' relative "time" → synthetic ts; new posts carry `ts`).
- **Notification settings modal** (profile): two `.tlc-switch` toggles — **Email on comment reply**
  (`complex-tlc-ntf-reply`, default on) + **Weekly activity digest** (`complex-tlc-ntf-digest`, default
  off). Opened from the panel.
- **Seeds bumped `KEY` → `complex-tlc-live-v3`** and given demo flags: an `edited` "you" comment, a
  `[deleted by author]` with a surviving reply, a `[removed by moderator]`, and `reactors` on several.
- **Loading/empty:** skeleton shimmer cards; large empty state ("No comments yet — be the first…").
  Trail is hidden while loading and skips removed comments.
- Still **NOT visually verified in-sandbox** (no server/screenshot) — opened via `open index.html` on
  the user's machine; entry images still need HTTPS. Rebuilt + synced `dist/`.

---

## 2026-06-22 — Build 25: Prototype timeline toggle + 5% page dim + 80vh mobile sheet
- **Prototype control (desktop only):** `.tlc-proto` card bottom-left ("PROTOTYPE / Timeline [switch]")
  toggles the margin trail so both iterations are viewable. State `trailOn` persisted in localStorage
  `complex-tlc-trail` ("0"/"1"); `renderTrail()`/`updateFill()` now bail on `!trailOn` too. Control shown
  only at `@media(min-width:1024px)` (timeline is desktop-only).
- **15% page dim when the drawer is open** (desktop + mobile; started at 5%, user found it too faint):
  `.tlc-dim` fixed layer, `opacity:.15` on show, **`pointer-events:none`** so the article stays
  scrollable (keeps the no-scroll-lock behavior).
  Wired via new `showDrawer()` + `closeDrawer()`. (Marker-click `tlc-sheet` is not dimmed — open Q.)
- **Mobile bottom sheet max-height 90vh → 80vh.**

## 2026-06-22 — Build 24: FAB opens the drawer on desktop too
- Per user: the "Comment" FAB now opens the full comments drawer **everywhere** — `fab` click is just
  `openDrawer` (side sheet on desktop, bottom sheet on mobile). No more `DESK()` branch on the FAB.
- `openComposer()` / `curProgress()` / the `tlc-sheet` composer (`cS` handler) are now **unreachable
  from the FAB** (dead but harmless; left in place). Desktop point-commenting = trail markers +
  select-to-comment. Strip later if desired.

## 2026-06-22 — Build 23: Snippet click collapses the mobile sheet + light-gray arrival highlight
- `jumpTo()` now calls `closeDrawer()` when `!DESK()` (mobile bottom sheet covers the article, so it
  collapses as the article scrolls to the spot). Desktop side drawer stays open (only covers the right edge).
- Arrival highlight changed from light-red to **light gray `#e5e5e5`** (`.tlc-flash`); duration bumped
  1100→1800ms so it's still visible after the smooth scroll. Applied to `nearestPara(p)` (or the entry
  image above it).

## 2026-06-22 — Build 22: Mobile FAB opens the full drawer (no point-commenting)
- Per user: on **mobile** the "Comment" FAB now opens the full comments drawer (bottom sheet, all
  comments) instead of the point-composer. `fab` click: `DESK() ? openComposer(curProgress()) :
  openDrawer()`. Desktop unchanged (still composes at the reading spot; trail + select-to-comment
  cover point-commenting there).

## 2026-06-22 — Build 21: Select-to-comment, drawer→bottom-sheet on mobile, clickable snippets
- **Medium-style selection → Comment:** selecting article copy shows a floating `.tlc-seltip` (black
  pill, one "Comment" action) above the selection. Click → `openDrawerWithQuote(quote,progress)` opens
  the drawer with a quote chip (`.tlc-dw-quote`) + composer. Posted comment carries `c.quote` and
  progress derived from the selection's doc-Y via new `yToProgress()`. `selectionText()` ignores our
  UI / nav / footer / form fields and requires `article.contains(node)`. `mousedown` preventDefault on
  the button keeps the selection alive through the click; `selData` is captured so it survives anyway.
- **Mobile drawer = bottom sheet** (per user): `@media(max-width:1023px)` flips `.tlc-drawer` to
  bottom/full-width, `max-height:90vh`, slides up via translateY. Desktop stays right-side.
- **Removed pin/section tags** (`.tlc-sectag` + `PIN` icon deleted). The **snippet/quote itself is now
  the clickable jump target** (`.tlc-snip` gets `data-p`, role=button, tabindex, hover/focus affordance;
  `onClick`/`onKey` jump on it). `sectionInfo()` now uses `c.quote` as the snippet when present (cap 160).
- Open Qs for user: mobile selection vs native OS menu; show quote in desktop popover/bottom-sheet too?

## 2026-06-22 — Build 20: End feed capped at 5 + sticky right-side comments drawer
- End-of-page feed now shows only `END_MAX=5` comments (by reading position) + a **"Load more (N)"**
  CTA (`.tlc-loadmore`). Hidden when ≤5.
- **"Load more" → sticky right drawer** (`.tlc-drawer`, `position:fixed;right:0;height:100vh;
  width:min(420px,92vw)`, slides in via translateX) listing ALL comments. Has its own scrollable body
  + composer; reuses `cmtHtml({tag:true})` and the shared `onClick`/`onKey` (like/reply/jump).
- **Deliberately NO scrim and NO body scroll-lock** → the article stays scrollable while the drawer is
  open, and section-tag jumps inside the drawer scroll+flash the article while the drawer stays put
  (the user's key requirement). Close via ✕ or Escape (`closeDrawer()` added to the Escape handler).
- `refresh()` now also re-renders the drawer when open. Drawer composer posts at progress 0 (same
  known limitation as the end composer).
- Note: drawer overlays the desktop right rail (ad inventory) but only when user-invoked, so it doesn't
  permanently compete with ads — consistent with the project constraint.

## 2026-06-22 — Build 19: No margin trail on mobile (per user — no room)
- **Decision (user):** there is NO timeline/margin trail on mobile — the live article has only ~16px
  side padding, so there's simply no space for it. Not a fit-tweak; the trail is desktop-only.
- Implemented: `DESK()=()=>innerWidth>=1024` guard in `renderTrail()`/`updateFill()` (skips layout +
  hides `.tlc-trail` on mobile), plus CSS `@media(max-width:1023px){.tlc-trail{display:none}}`.
  Breakpoint = 1024px to match the existing desktop-popover threshold.
- **Mobile UX is now:** read the article → "Comment" FAB (compose at current progress) →
  end-of-page feed (section tags + snippets, jump-to). Bottom sheet still used by the FAB composer.
- Resolves the long-standing "mobile trail fit" open item — answer was "remove it on mobile."

## 2026-06-22 — Build 18: More seeded comments (timeline felt empty)
- Expanded SEED from 7 → **25 comments + 6 replies**, spread 4%–99% across the article, with
  deliberate clusters (~24–31%, ~38–40%) to exercise the marker-clustering UI and several reply threads.
- **Bumped `KEY` → `complex-tlc-live-v2`** so the new seeds show even if old localStorage exists
  (load() returns saved data if present). Hard-refresh if previously interacted.
- Synced `dist/index.html` + refreshed zip. Open question for user: density right, or busier/top-weighted?

## 2026-06-22 — Build 17: Revert placeholders → real images; prep Netlify deploy
- Briefly swapped entry images for gray 1920×2400 (4:5) placeholder boxes (`.tlc-entry-ph`) because
  images looked "missing" when opening `index.html` locally. **Root cause:** `file://` protocol, not
  a code bug — the Complex CDN images load fine over HTTPS. Reverted to the real `<img>` (`e.img`).
- **Lesson:** don't treat locally-blank CDN images as broken; verify over HTTP(S) first.
- Deploy prep: `dist/index.html` (clean publish folder), `netlify.toml` (`publish="dist"`, no-op
  build), `complex-comments-netlify.zip`. No CLI in sandbox → use Netlify Drop (app.netlify.com/drop).
- Reminder: builder writes `index.html`; after each rebuild `cp index.html dist/index.html`.

## 2026-06-15 — Build 16: Align the trail with the hamburger / grid left edge
- Trail previously hugged the article text column (`colLeft()-30`). User wants it at the **grid's
  left edge, aligned with the hamburger**, and **capped to the 1400 grid** so it stays at the grid
  edge on wide screens (doesn't run to the viewport edge).
- Added `trailX()`: anchors markers + line to `[data-testid="hamburger-menu-button"]` center x
  (fallback: the `max-w-[1400px]` grid container left + 18; final fallback: old colLeft-30). The
  live nav uses `grid-fluid-padding`, so the hamburger stays at the grid edge on big screens.
- Not visually verified in-sandbox. Open `index.html` to confirm.

## 2026-06-15 — Build 15: Fix squeezed entry images (place in the real card slot)
- Images were squeezed because each live entry is a **bordered card**: a 76px header bar (gray cell
  with the "YEAR: Sneaker" `h2`) → divider → image slot (`.overflow-hidden > .lazyload-wrapper >
  .lazyload-placeholder`). I had inserted the `<img>` *before the h2*, cramming it into the 76px
  header flex cell → crushed.
- Fix: locate the entry card via `h2.closest('[data-sticky-nav-stop]')`, then **replace the empty
  `.lazyload-placeholder`** (the lazy-load slot, empty because we stripped the loader JS) with the
  img. CSS changed to natural sizing `display:block;width:100%;height:auto` (the served URLs are
  already `ar_1.91`, so no distortion). Fallbacks: `.lazyload-wrapper` → lead-image slot → after divider.
- Note: ~6 non-entry placeholders (related-stories thumbs) remain empty — no URLs for those; harmless.
- Not visually verified in-sandbox (no server). Open `index.html` to confirm.

## 2026-06-15 — Build 14: Consolidated to ONE main file (index.html = the live version)
- User: "it's getting confusing, keep one main file, index.html" → chose "whichever is latest with
  all the things we discussed" = the **live-page version** (Build 13, which has every feature).
- `build_live.py` now outputs **`index.html`** (the live page + injected comment system).
- **Deleted** the reconstructed-version + harness files to kill the clutter: `template.html`,
  `build.py`, `preview.html`, `preview.template.html`, `live-prototype.html`, `server.py`,
  `paras.json`, and the `css_*.css` chunks (already merged into `all.css`).
- Remaining: `index.html` (main), `build_live.py` + `live-inject.js` + inputs (`live.html`,
  `all.css`, `entries.json`), the 4 docs, `DESIGN-SYSTEM.md`. Rewrote CLAUDE.md for the new setup.
- Still NOT visually verified in-sandbox (no server/browser) — open `index.html` to confirm.

## 2026-06-15 — Build 13: Live-page variant (comment system injected onto real complex.com HTML)
- User wants the prototype on the REAL live page to see it under genuine constraints. New artifacts:
  `build_live.py` + `live-inject.js` → **`live-prototype.html`**. (The reconstructed version —
  `index.html`/`preview.html` — is unchanged and still the main one.)
- `build_live.py`: strips ALL Next.js `<script>`s (→ static), inlines `all.css` + Inter, injects
  `entries.json` + the module before `</body>`.
- **Key finding:** the 36 entry sneaker images are **client-rendered** (only ~9 `<img>` in static
  HTML; rest live in RSC data) → the module **reconstructs them** from `entries.json` (insert `<img>`
  before each `h2` matching /^\d{4}:/, with a dedup guard). Nav/footer/hero/title/body/grid/ads ARE
  in the SSR HTML, so they render statically.
- `live-inject.js`: self-contained, **`tlc-` prefixed** to avoid clobbering live styles; discovers
  the live DOM at runtime (h1, body `p[class*="text-[16px]"]`, `h2` entry heads, `<footer>`), and
  layers the margin trail + bottom sheet (replies) + end section (tags+snippets) + FAB. Uses
  **document coordinates** (getBoundingClientRect) throughout since the live DOM's offsetParents are
  unknown. Trail X = article column left − 30 (tight on mobile — a real constraint to evaluate).
- **NOT visually verified** — sandbox can't run any local server (getcwd blocked) and no browser is
  connected. Validated structurally only (JS balanced, scripts stripped to 2, nav/footer/body intact).
  Needs a human to open `live-prototype.html`.

## 2026-06-15 — Build 12: Standard end-of-page comment section (tag + snippet variation)
- Added a **standard comments section** below the article (`#cend`, before footer; content in a
  760px readable column within the 1376 safe area). It lists the SAME comments as the margin trail —
  two views of one dataset.
- Each end-of-page comment shows: a **section tag chip** (nearest preceding entry heading, e.g.
  "1997: Air Jordan 12", or "Introduction") that **jumps to + flashes** that section, AND a
  **snippet** (≤90 chars of the anchored paragraph) — covering both variations the user proposed.
- Likes + threaded replies work here too: refactored the sheet's handlers into shared
  `onThreadClick`/`onThreadKeydown`/`doPostReply` wired to BOTH `shBody` and `cendList`; `refreshViews()`
  keeps trail + end list + open sheet in sync. End composer posts a general comment at progress 0
  ("Introduction" tag). `jumpTo()` scrolls + briefly flashes the target section.
- Build verified 11/11; preview embeds current index.html.

## 2026-06-15 — Build 11: Sheet = full-width, content capped at 1440; no dim overlay
- Reversed Build 9's approach: the **sheet itself is full-width** again, but the **inner content**
  (`sh-head` / `body` / `composer`) is capped at **max-width 1440, centred** (`align-self:center`) —
  responsive below 1440. So the bar spans the screen; the comments sit in the 1440 column.
- **Removed the dark overlay**: `.scrim` background is now `transparent` (kept as an invisible
  click-catcher to close). Separation comes from the sheet's drop shadow only.

## 2026-06-15 — Build 10: React + reply to a specific comment
- Added **threaded replies** in the bottom sheet. Each comment now has a **Reply** action → inline
  reply box (Enter or button to send); replies render nested under the parent with a left border,
  smaller avatars, and their own like (react) button. "React" = the existing heart, now works on
  both comments and replies.
- Data model: comments gained an optional `replies:[{id,author,text,time,likes}]` (one level deep).
  `findById()` resolves a comment OR reply for likes; `postReply()` appends + re-renders the open
  thread. **Bumped STORE_KEY → v2** (schema changed) so seeds/feature show despite old localStorage.
- Seeded a couple of replies (flu-game + Brunson threads) so threading is visible on load.
- Marker cluster badges still count **top-level** comments only.

## 2026-06-15 — Build 9: Bottom sheet capped to the grid on desktop
- The bottom sheet was full-viewport-width (edge-to-edge), which looked wrong on wide desktops.
  Capped `.sheet` to **max-width:1440px, centred** (`left:0;right:0;margin:0 auto`) — full width as
  the screen shrinks below 1440, centred above it. Kept the bottom dock + slide-up transform.
- On desktop the sheet's inner content (`sh-head`/`body`/`composer`) gets **32px gutters** so the
  comments align to the 1376 safe area within the 1440 cap. Added a soft top shadow.
- Mobile unchanged (full-width sheet). Rebuilt; preview embeds the current index.html.

## 2026-06-15 — Build 8: Margin trail (document-anchored markers)
- Build 7 rebased the % but the dots didn't move (fixed minimap, %-of-rail) → "I don't see the
  change." User chose (AskUserQuestion): **markers in the margin beside each paragraph**, scrolling
  with the article, starting at the title.
- Replaced the fixed side-rail minimap with a **margin trail** living in the article's left gutter
  (`--gutter` 40px mobile / 56px desktop; `.article` gets `padding-left`). A vertical `.trail-line`
  runs from the **title** to the end of the last paragraph with a `.trail-fill` that grows with
  reading; `.marker` avatars are absolutely positioned at each comment's **anchor paragraph** center
  (article-relative `offsetTop`). Clusters by pixel proximity. Removed the now-pill + fixed rails.
- **Fixed a coordinate bug** from Build 7: band math mixed document `scrollY` with article-relative
  `offsetTop`. Now uses `docTop()` (getBoundingClientRect+scrollY) for the band/progress, and
  `offsetTop` (article-relative) for marker placement — two consistent coordinate spaces.
- Interactions: tap marker → bottom sheet; desktop hover → popover; click empty gutter → compose at
  that point; FAB composes at current reading position. Re-renders on resize/load + ResizeObserver
  (image loads shift offsets). 26/26 build checks pass; no dangling refs.

## 2026-06-15 — Build 7: Comment trail starts at the title
- The reading-progress trail used to map the **whole document** (0% = page top, i.e. above the nav/
  leaderboard ad). User wants it to **start at the article title**. Rewrote the progress helpers
  (`bandTop`/`bandBot`/`bandSpan`) so the trail spans the **reading band**: `h1.title` top → bottom
  of the last `[data-p]` paragraph. 0% = headline, 100% = end of the article body (nav, hero, and
  footer are excluded). Reading reference point is ~40% down the viewport (`REF`).
- `progressToScrollY` / `currentProgress` now both key off the band; `paraNearestProgress` and
  scroll-to still work unchanged. Seed comment %s now distribute across the body, as intended.

## 2026-06-15 — Build 6: Port nav + footer from "1. Cart Optimization"
- User asked to take the **top navigation and footer design** from the sibling project
  `/Users/daniyalali/Desktop/Claude Work/1. Cart Optimization` (same SMPLX system, Tailwind-based).
- **Header → two-tier Complex nav** (translated Tailwind→plain CSS): Tier 1 = hamburger · centered
  COMPLEX wordmark · right cluster (desktop 320px search field / mobile search icon, wishlist,
  profile, cart with red count badge). Tier 2 = centered uppercase nav links (12px bold), scrollable.
  Adapted nav links to **editorial sections** (Style/Sneakers[active]/Music/Pop Culture/Sports/Life/
  Shows/Shop); kept the cart's exact structure/sizing. Replaced the old promo+single-row nav.
- **Footer → full black footer**: big COMPLEX wordmark + "Follow on" social row (FB/X/WhatsApp/IG/
  YouTube/Snapchat/TikTok, exact SVG paths from cart) + 3 link columns (Shop/Explore/Work With Us)
  + newsletter (email + Notify Me + disclaimer) + legal row + region select + copyright.
- **Breakpoint unified to 1024px** (the cart's `tablet`); container = 1376px safe area. Header is
  **NOT sticky** (matches cart) so `--hd` is now `0` and the timeline rail spans the viewport.
- Cart's red token is `#db1c1c`; I kept the article's live-accurate `#f03c3c` for accents/badge to
  stay consistent within this prototype.
- Rebuilt via `build.py`; 26/26 checks pass, comment system + 36 entries/images intact.

## 2026-06-15 — Build 5: Device-preview harness (preview.html)
- Added **`preview.html`** to check viewports without resizing the window. It loads the real
  `index.html` in iframes (390px phone / 1440px desktop) with a **Mobile / Desktop** toggle that
  **switches between one view at a time** (user didn't want side-by-side). Iframe width drives each
  frame's media queries, so each renders its true layout. Defaults to Mobile.
- A shared scale factor fits the visible frame(s) to the stage (recomputed on resize/load), capped
  at 1× to avoid upscaling. Phone has a notch shell; desktop has a browser-chrome frame.
- `index.html` is untouched — still the clean deliverable; `preview.html` is just a viewer.
- **Fix (empty-preview):** relative `src="index.html"` did NOT resolve in the Launch preview panel,
  so the iframes were blank. `preview.html` is now GENERATED by `build.py` from
  `preview.template.html`, **embedding the whole prototype as `srcdoc`** (index.html JSON-encoded
  with `</` → `<\/` so its `<script>`/`</body>` can't break the outer document). No path dependency.
- Per user follow-up: removed the side-by-side "Both" mode — it's a **switch** between Mobile and
  Desktop, one at a time. Defaults to Mobile.

## 2026-06-15 — Build 4: Pixel audit vs LIVE site + full rebuild (36 entries)
- User asked for a thorough audit of the LIVE article and a pixel-faithful rebuild. Instead of
  guessing, I pulled the **real source**: `curl` the live HTML (`live.html`, 771KB) + all 8 CSS
  bundles (`all.css`, 335KB), and extracted real tokens/structure.
- **Verified-from-live corrections (were wrong before):**
  - Title is `headings-28-semi-bold` = **28px/600/34** (I had 48px). Body is **16px / line-height
    1.75 / #000** (I had 18px). Entry headers **18px/600/#050505** (I had giant year numbers).
  - There's a **dek/subtitle** (16px secondary) and a **gray category label** (`tags-labels-12-
    semi-bold`, `#8f959d`) — both were missing/wrong.
  - **Hero is 3:2** (I had 16:9). Each of the **36 entries has a real sneaker image** at **1.91:1**.
  - Live brand red is **`#f03c3c`** (error `#cd0000`), not `#db1c1c`. Tokens `#e1e3e5`/`#8f959d`/
    `#f0f1f2`/`#40444a` confirmed. Nav sections: Style/Sneakers/Music/Pop Culture/Sports/Life/Shows/Shop.
  - Added in-article **dark newsletter** (max-w 580), **top leaderboard ad**, and a **black footer**.
- **New build system:** `build.py` + `template.html` generate `index.html` from `paras.json`
  (real body text, in order) + `entries.json` (real images). Comment-system JS is reused verbatim.
- **Data quirk handled:** the live 2025 entry is misspelled "Championsh**o**p Year" and merges its
  meta+body in one paragraph — the parser handles both, and an assertion verifies each entry's image
  aligns with its sneaker (caught a 1-off image shift before it shipped).
- Post-build automated audit: **26/26 token/structure checks pass**, JS balanced, all 37 images
  return HTTP 200. NOTE: could not take a literal pixel screenshot (no browser/node; preview server
  sandbox-blocked) — fidelity verified against extracted live CSS values, not a visual diff.

## 2026-06-15 — Build 3: Adopt SMPLX design system (DESIGN-SYSTEM.md)
- User added **`DESIGN-SYSTEM.md`** (SMPLX) and said the look still wasn't right. Re-skinned the
  page to the actual system instead of approximating Complex from memory. Corrections made:
  - **Font → Inter** (Google Fonts), replacing the Helvetica-grotesque guess.
  - **Header is WHITE, not black** — this was the biggest miss. SMPLX Top Nav = white bg, black
    COMPLEX wordmark, `Border/Primary` bottom rule, optional B3 promo banner. Mobile 48px nav with
    EXPLORE dropdown; desktop 72px nav with centered category links (active = black + underline).
  - **Tokens applied:** Text `#000`/`#40444a`/`#8f959d`, Border `#e1e3e5`, B3 `#f0f1f2`.
  - **Radius → 4px** (`--r`) across buttons/inputs/cards/ad slots (was 12–18px rounded).
  - **Buttons → black "Loud"** (uppercase 12pt bold, 4px). FAB + Post are now black, not red.
  - **Red `#db1c1c` reserved for notifications/likes only** (cluster badge, heart, dot hover ring,
    lit-paragraph accent bar) — it's the system's Icons/Error, not a brand accent.
  - Reading-progress fill + head → black. Avatar palette desaturated to a restrained set
    (JS `COLORS` array aligned to CSS `--c1..c6`).
  - In-content ads restyled to top/bottom hairline rules (matches SMPLX ad placement).
  - `--hd` updated: 80px mobile (promo 32 + nav 48) / 108px desktop (promo 36 + nav 72).
- **Takeaway for future builds:** `DESIGN-SYSTEM.md` is the source of truth — read it first, don't
  approximate Complex's brand from memory.

## 2026-06-15 — Build 2: Complex design fidelity + project docs
- **Matched Complex.com design** more closely:
  - Two-row black header: hamburger + **"Complex" wordmark** (monochrome — dropped the earlier
    red "LEX" split, which wasn't accurate) + search icon + "Get the App" pill.
  - Real **category nav** row (Shop / Style / Sneakers[active] / Music / Sports / Pop Culture /
    Bets / Cover Stories / Verzuz / Watch), horizontally scrollable on mobile.
  - Switched type system to **Helvetica Neue / Arial grotesque**; tighter headline tracking.
  - Introduced `--hd` header-height var so the fixed timeline + sticky ad rail offset correctly.
- **Added in-content ad units** (300×250) between sections — the real article embeds ads inline,
  and it proves the comment markers coexist with inline ads on mobile (not just the desktop rail).
- Could NOT pull exact Complex webfonts/hex tokens: they live in external stylesheets WebFetch
  can't reach, and no browser was connected. Matched the design from known brand language + the
  nav structure WebFetch did return. **If exact tokens are needed, connect a browser and inspect.**
- Created `CLAUDE.md`, `MEMORY.md`, `HANDOFF.md`. Logged the "update docs every build" rule.

## 2026-06-15 — Build 1: First working prototype
- Decided the article "timeline" = **reading progress (scroll %)**. Comment captures
  `{progress%, nearest-paragraph}` on submit. **Cosmetic only, no NLP** (agreed v1 scope).
- Mobile-first (85% of users): right-edge track + "now passing" pill + bottom sheet + FAB composer.
- Desktop: **left** timeline rail (right rail reserved for ads), hover popovers, gutter highlight.
- Dot **clustering** so busy articles don't become dot-soup.
- `localStorage` persistence; 7 seeded comments spread across the piece.
- Real article content + hero image pulled from the live Complex URL.
- Verification limits in this env: no `node`, Python static server sandbox-blocked. Validated via
  structural checks (brace/paren balance, function presence) + the Launch preview panel.

## Open questions / parked
- Mobile: keep the "now passing" pill, or also offer always-visible inline avatars? (pill chosen
  for a cleaner read — variant not yet built).
- Tap-target on the thin right-edge track — confirm it feels right on a real device.
- Exact Complex brand tokens (fonts/hex) still approximated — see note above.
