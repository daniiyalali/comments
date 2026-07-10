# HANDOFF.md

**Last updated:** 2026-07-11 — Latest code build = **Build 46: MVP + anchor ad ON by default** (per
the user): fresh loads open in MVP scope with the bottom anchor ad showing (`complex-tlc-mvp` /
`complex-tlc-ad` now default ON, "0" = off; canvas harness `state.mvp/ad = true`). Prior =
**Build 45: comments are OFF the page** — you can
no longer scroll to a comment section; the thread lives **only in the drawer** (desktop side sheet /
mobile bottom sheet), opened via FAB / action-bar comment / markers / dots / select-to-comment. The
`.tlc-cend` section element + its code remain in `live-inject.js` but are never inserted (detached;
`renderEnd` early-returns) — one-line revert. Applies in MVP and full mode. Prior =
**Build 44: bottom anchor-ad simulation**. The live
site sometimes pins a sticky anchor ad to the screen bottom (user screenshot: COMPLEX mark · green LTL
creative · ✕) — new **"Bottom anchor ad" switch** (panel after Template + canvas rail `#swAD` + bridge
`ad`, persisted `complex-tlc-ad`; a page condition, so it applies in MVP too, NOT grayed by it). ON =
`.tlc-ad` bar (50px + safe-area, dismissible) and the `tlc-adon` body class lifts all floating bottom
UI above it: FAB/abar/proto offset up, and the bottom timeline panel stops at the ad's top edge
(`placeMbar()` measures the ad rect). Drawer/sheets still slide over it. Use it to stress the bottom
stack: ad + action bar + bottom timeline together. Prior = **Build 43: flat replies + single composer** (both
MVP and full mode). (a) **Reply-to-reply, flattened:** threads are max ONE level deep — replying to a
reply stays in the same tier and prefixes an **@name mention** (prefilled "@author ", leading mention
styled black/semibold `.tlc-mention`; seed s6r3 demos it; storage key bumped → `complex-tlc-live-v4`).
(b) **ONE comment box per surface** (user spotted two boxes on screen while replying; Mobbin-validated
against HYPE / Spotify / NAVER / Instagram): in the feed + drawer the inline reply box is GONE —
tapping Reply puts the surface's pinned composer into **reply mode** with a dismissible "Replying to
@name ✕" banner (✕ keeps typed text), reply placeholder, "Post reply" button; posting appends to the
parent thread. Only the desktop marker sheet keeps the inline box (it has no persistent composer).
Prior build = **Build 42: the MVP toggle** — a new **MVP** switch
in the prototype control panel + canvas rail (persisted `complex-tlc-mvp`, bridge type `mvp`). ON =
**only the spec'd v1 requirements**: end-of-page comment thread on both templates (placement/entry,
empty state, loading skeleton, sort flip toggle, Load more → drawer as the pagination pattern),
composer (2,000-char counter, first-time community-guidelines, auth gate, banned notice), comment card
(top-level + one reply tier, edit <5 min, [deleted by author], [removed by moderator]), reactions
(heart + count + expandable who-reacted), report/flag + confirmation, and the profile notification-
settings modal (email-on-reply + weekly digest). Everything experimental hides: margin trail, mobile
timeline bar, action bar / re-rank variants, select-to-comment, and the cards' progress snippets /
"% badge" / "Jump to spot". On mobile the plain **Comment FAB** returns as the entry point. The
experiment controls gray out while MVP is ON (values kept). Builds 42–45 were **committed & pushed 2026-07-10** (commit a97bc9c) — the Vercel deploy now carries them. Prior build = **Build 41**: the mobile **timeline bar docks at
the BOTTOM** (user's Figma "Page 3" mock, node 98-100) — top edge of a white panel above the bottom
action bar (track flush at the panel edge, dots bleed over the article, 20px gap to the action bar,
bloomed DP 20px); position switchable **Off / Top / Bottom** (default Bottom) in the panel + canvas
rail (`#selMB`). **The bottom-mode comment card is a BROWSER (Build 41):** centered above the bar,
tiny **‹ ›** in the footer step through every comment (ends disable), the **article auto-scrolls
behind** to each comment's spot, and the referenced paragraph **holds a super-light-gray highlight**
(`#f0f1f2`) while browsing — the whole thread can be skimmed without opening the drawer. Build 39: focus layout: floating
"NEXT · ITEM #N" tip removed on scroll/arrows; RE-RANK button is a full pill, round in both states.
Build 37: comment sort collapsed to a one-tap
flip toggle `Sort [⇅ Most recent]`, validated against Mobbin patterns; Figma sort component mirror
pending). Build 34–36: implemented the **user's own Figma
mock** (file page "Page 2", node 2-2) as a SEVENTH re-rank ⨯ essentials layout, **`focus`, now the
default**: nav deck (‹ RE-RANK ›) expanded at rest with social actions collapsed into a mini-icon
bubble; tap the bubble → essentials pill expands and re-rank collapses to a black shuffle bubble;
tap that → swap back. Re-rank is the default focus on list articles. RE-RANK itself stays inert.
Build 35 fixed the user's two notes on 34: the swap is now a TRUE in-place morph (persistent DOM,
class toggle + coordinated flex/max-width transitions — no fade/re-render), and the shuffle icon is
the exact filled glyph from the Figma asset (was an invisible/wrong hand-drawn stroke icon).
Build 36: RE-RANK is now genuinely black w/ white icon+copy in every variant (root specificity fix —
the global rule lost to the base `.tlc-abar button` rule) and the collapsed mini cluster reflects
the article's hearted/saved state (red heart / filled bookmark) instead of reverting to uninteracted.
The full design inventory also lives in Figma as editable frames:
**https://www.figma.com/design/Ils4e9Naytz66xI6UJ1G49/Comments-Exp** (page “Comments Exp — all
designs & states”, 5 sections, prototype flows wired; only the prototype control panel excluded).
**Status:** Working cosmetic-only prototype, single file (`index.html`). Review it via **`canvas.html`**
(open that instead of `index.html` to get the device switch + external controls).

## Figma file (design handoff / crit surface)
- **URL:** https://www.figma.com/design/Ils4e9Naytz66xI6UJ1G49/Comments-Exp (file key
  `Ils4e9Naytz66xI6UJ1G49`). All frames are native auto-layout + vector icons + Inter — fully editable.
- **Sections:** ① Bottom bar — Build 33 six-layout comparison (7 screens + deck boundary states) ·
  ② Build 32 re-rank iterations, labeled *superseded* (pill / tab bar / hero / inline + reorder sheet
  open & submitted) · ③ Timeline bar / drawer (populated + loading) / feed / empty / skeleton / flash ·
  ④ Component sheets (composer ×6, card ×8, pill states, sort states, misc, notifications modal) ·
  ⑤ Desktop (default / popover / drawer / bottom sheet / trail-off).
- **Interactions:** “Mobile flow” + “Desktop flow” starting points; comment/Load-more → drawer, dot →
  card, marker hover → popover, marker click → sheet, FAB → panel, ✕ → back. **Re-Rank stays inert.**
- Keep the Figma file and `live-inject.js` in sync going forward — if a build changes UI, mirror it.

**Pick up here next session:** Builds 42–45 (MVP toggle; flat replies + single composer; anchor-ad
simulation; drawer-only comments) are **pushed & deployed** (commit a97bc9c). Open **`canvas.html`** (defaults to Mobile + List +
focus layout + bottom timeline; flip the new **MVP** switch to see the bare v1 scope) — evaluate
(a) the **bottom timeline + comment-browser card** (tap dot → centered
card, ‹ › steps comments, article scrolls behind, light-gray paragraph highlight) vs the Top
placement, and (b) the seven re-rank ⨯ essentials merges; decide what to productionize, then hand to
eng. **Re-Rank tap is inert on purpose** — that interaction lives in a separate file. **Deploy is
live-ready:** repo **https://github.com/daniiyalali/comments** — pushing `main` auto-deploys once the
repo is imported at vercel.com/new (get the `*.vercel.app` URL from the user / dashboard; the site
root opens the CANVAS, `/prototype.html` is the bare prototype for on-device testing). Entry images
need HTTPS — blank over `file://` is expected, not a bug. Vercel domain can be renamed / custom
domain added anytime under Project → Settings → Domains (renaming kills the old link).
**Figma mirror pending:** sort flip-toggle (Build 37) + the Build 34–41 focus/bottom-bar changes + the
Build 43 reply changes (Reply on reply cards, @mention, composer reply-mode banner) are NOT yet
mirrored on the Figma inventory page (the user's own Page 2/3 mocks cover the earlier concepts;
Build 42 MVP needs no mirror — it subsets existing frames).

## Review harness — `canvas.html`
Open this instead of `index.html`. **Desktop ⇄ Mobile** switch + a control rail *outside* the previewed
UI (the prototype hides its own `.tlc-proto` panel when embedded and is driven via postMessage). Rail
controls: **MVP at the very top (Build 42: v1 spec only — grays out the experiment controls below)** ·
Viewer (Guest/Signed-in/Banned) · First-time user · Comments (Populated/Empty/Loading) ·
Template (Article/List) · Margin timeline (desktop) · **Timeline bar (mobile): Off / Top / Bottom**
(`#selMB`, default Bottom) · **Re-rank ⨯ essentials**
(Essentials only / Both stacked / One card two rows / One pill / Edge arrows / Auto-swap / Deck +
bubble tap-to-swap) ·
Notification settings · Reset · Reload. Picking a merge layout auto-switches Template→List (the deck
only exists on list articles).

## What's in the prototype now
- **Comment thread (Build 45: drawer-ONLY — no on-page section to scroll to):** desktop side sheet /
  mobile bottom sheet; empty state, loading skeleton, sort flip (recent/popular); entry via FAB,
  action-bar comment, markers/dots, select-to-comment.
- **Composer:** 2,000-char counter; first-time community-guidelines; auth gate (guest); banned notice.
- **Comment card:** top-level + ONE flat reply tier (Build 43: reply-to-reply stays in the tier with an
  @name mention; Reply on feed/drawer cards drives the surface's single pinned composer — "Replying to
  @name ✕" banner, no inline box); Edit (<5 min); [deleted by author]; [removed by moderator].
- **Reactions:** heart + count + "Who reacted" list. **Flagging:** Report (auth) + confirmation.
- **Profile:** Notification settings modal (email-on-reply + weekly digest).
- **Desktop:** left **margin timeline** trail (toggle) + comment FAB.
- **Mobile:** **top timeline bar** (black dots that bloom into DPs, tap → floating comment card) +
  **bottom essentials pill** (heart / comment / bookmark) on every article. On **List** articles the
  **nav deck** (‹ › item nav with live "NEXT · ITEM #N" label + inert RE-RANK) merges with it per the
  selected variant: **stacked** (baseline: both) · **deck** (one card, two rows) · **unified**
  (one pill, one row) · **flank** (edge arrows + centered pill) · **swap** (morphs on scroll) ·
  **focus** (Build 34, default — deck expanded + social mini-icon bubble; tap the bubble to swap
  which side is expanded, the other collapses to a bubble). Arrows
  really jump between the 36 entries; ends disable; prev is track-style.

## Deploy (GitHub → Vercel; Netlify drop as fallback)
- **Repo: https://github.com/daniiyalali/comments** (pushed via the user's keychain git credentials).
  Import it once at vercel.com/new → every push to `main` auto-deploys. `vercel.json` = static serve
  of `dist/`, no build step.
- **The deployed site opens on the CANVAS harness** (device switch + control rail): `build_live.py`
  now packages `dist/` itself — `dist/index.html` = canvas (iframe → `prototype.html`),
  `dist/prototype.html` = the self-contained prototype. **No manual `cp` step anymore.**
- Fallback: drag `dist/` to https://app.netlify.com/drop; `complex-comments-netlify.zip` = zipped dist.

## TL;DR
SoundCloud/Loom-style timeline comments for a Complex.com article — the "timeline" is reading
progress (scroll %). **Everything is in [index.html](index.html)** — open it in a browser.
`index.html` is the **real live complex.com page** with the comment system injected on top.

## How it's built (don't hand-edit index.html)
`index.html` is generated by **`build_live.py`**:
1. Takes `live.html` (raw live page) + `all.css` (its real stylesheets).
2. Strips the Next.js `<script>`s → static page; inlines `all.css` + Inter.
3. Injects `entries.json` + **`live-inject.js`** (the comment system) before `</body>`.
- To change the comment system: **edit `live-inject.js`, then `python3 build_live.py`.**
- `live-inject.js` is `tlc-`-prefixed (won't clash with live styles) and discovers the live DOM at
  runtime; all positioning is **document-space** (`getBoundingClientRect`) since the live DOM's
  offsetParents are unknown.

## Done
- [x] Single deliverable `index.html` = live page + injected comments (Build 14 consolidation).
- [x] **Margin trail**: avatar markers in the article's left margin, anchored to the paragraph each
      comment refers to; line runs title → last paragraph with a reading fill; nearby markers cluster.
- [x] **Bottom sheet**: full-width, content capped at 1440 & centered, **no dim overlay** (drop shadow
      only). Used by the FAB composer everywhere; on desktop also opens when clicking a marker.
- [x] **Trail is desktop-only (≥1024px)** (Build 19) — hidden on mobile (no side margin); mobile uses
      the FAB + end-of-page feed. Desktop: hover marker → popover, click → sheet.
- [x] **React + reply**: like (heart) on comments and replies; inline **Reply** → one level of nesting.
- [x] **"Comment" FAB**: opens the full comments drawer **everywhere** — side sheet (desktop) / bottom
      sheet (mobile) (Build 24). Desktop point-commenting = trail markers + select-to-comment.
- [x] **Select-to-comment** (Build 21): select article copy → floating "Comment" pill → drawer opens
      with the selected passage as a quote chip; posted comment carries the quote + anchor.
- [x] **End-of-page comment section**: feed capped at **5** + a **"Load more (N)"** CTA. **Pins removed**
      (Build 21) — each comment's **snippet/quote is itself clickable**, jumping to that part. On arrival
      the target gets a subtle **light-gray `#e5e5e5`** highlight (~1.8s); on **mobile the bottom sheet
      collapses** as it scrolls so the spot is visible (Build 23).
- [x] **Comments drawer** (Build 20–21): desktop = sticky right panel; **mobile = bottom sheet (≤80vh,
      slides up)**. ALL comments + composer (like/reply/post + quote chip). **No scroll-lock**; a **15%
      page dim** (`pointer-events:none`) so the article stays scrollable and snippet jumps scroll it while
      open. ✕ / Esc.
- [x] **Prototype control** (Build 25, desktop only): bottom-left "PROTOTYPE / Timeline [toggle]" shows/
      hides the margin trail so both iterations are viewable; choice persisted (`complex-tlc-trail`).
- [x] **36 entry images reconstructed** from `entries.json` (client-rendered on the live site).
      Build 15: placed into each entry card's real image slot (`.lazyload-placeholder`) at natural
      size — fixes the earlier "squeezed" look (was wrongly crammed into the 76px header cell).
- [x] `localStorage` (`complex-tlc-live-v2`) + 25 seeded comments (+6 replies), spread 4%–99% with
      deliberate clusters (~24–31%, ~38–40%) to exercise marker clustering (Build 18).
- [x] Real nav / footer / grid / ad slots / typography from the live SSR HTML; real CSS inlined; Inter.
- [x] **Trail aligned to the hamburger / grid left edge** (Build 16), capped to the 1400 grid so it
      stays at the grid edge on wide screens (`trailX()`).

## Not done / next candidates
- [ ] **Visually verify in a real browser** — the sandbox can't run a server or screenshot, so this is
      NOT yet confirmed to render. Open `index.html` and check: (a) the static-stripped nav/footer
      render without hydration, (b) the injected UI looks right.
- [x] **Mobile trail** — RESOLVED (Build 19): per the user there's no room, so the margin trail is
      **desktop-only (≥1024px)**; mobile uses the FAB + end-of-page feed. (`DESK()` guard + CSS media query.)
- [ ] End-of-page composer currently posts a general comment at progress 0 ("Introduction" tag) —
      decide whether it should let people pick/keep a section.
- [ ] Optional: emoji reactions beyond the heart.
- [ ] **Smart v1 (future):** infer the exact line a comment refers to. Hook exists — the anchor stores
      a nearest-paragraph; populate a precise paragraph id/offset, no marker-UI change needed.

## Gotchas for the next session
- **`index.html` is GENERATED** by `build_live.py` — never hand-edit it. Edit `live-inject.js` (the
  comment system) and rebuild. The article text/images come from `live.html` / `entries.json`.
- If the live article changes: re-`curl` `live.html` + the CSS bundles (→ `all.css`) and re-extract
  `entries.json` (the 36 `{name,img}` from the page's JSON-LD), then rebuild.
- Entry images are **client-rendered** on the live site (only ~9 `<img>` in static HTML) → the module
  reconstructs all 36 from `entries.json` (insert before each `h2` matching /^\d{4}:/, with a dedup guard).
- The live 2025 entry has a source typo ("Championsh**o**p") with merged meta+body — handled when
  `entries.json` was extracted; keep that in mind if re-extracting.
- **`DESIGN-SYSTEM.md` (SMPLX) + the live-extracted values are the source of truth** — don't guess
  Complex's brand. Inter; tokens `#000`/`#40444a`/`#8f959d`/`#e1e3e5`/`#f0f1f2`; 4px radius; black
  buttons; red `#f03c3c` for notifications/likes only.
- Mobile is primary (85% of users); the right rail is ad inventory, so the trail stays on the left.
- **Per the user: update `CLAUDE.md` / `MEMORY.md` / `HANDOFF.md` after every build.**

## Files
- `canvas.html` — **review harness (open this)**: Desktop/Mobile switch + external control rail; embeds `index.html`.
- `index.html` — the prototype itself (open directly for the standalone in-page control panel).
- `build_live.py`, `live-inject.js` — builder + comment-system source. The builder also packages
  `dist/` (canvas as `index.html` + `prototype.html`).
- `live.html`, `all.css`, `entries.json` — build inputs (live page, real CSS, entry images).
- `dist/` — deploy folder (auto-generated, committed); `vercel.json` (static serve of dist),
  `netlify.toml` (fallback), `.gitignore`, `complex-comments-netlify.zip` (untracked).
- `CLAUDE.md`, `MEMORY.md`, `HANDOFF.md`, `DESIGN-SYSTEM.md` — docs + design-system reference.
