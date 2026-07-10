/* Timeline-comments module injected onto the REAL live complex.com page.
   Discovers the live article DOM at runtime, reconstructs the client-rendered entry
   images, and layers on the margin trail + bottom sheet (replies) + end-of-page
   comment section (section tags + snippets). All classes are tlc- prefixed to avoid
   colliding with the live page's styles.

   Build 26: full comment-thread spec mocked up + a PROTOTYPE CONTROL PANEL (bottom-left)
   with toggles for every condition — viewer (guest / signed-in / banned), first-time
   community-guidelines prompt, comments state (populated / empty / loading skeleton),
   template (article / list), and the margin timeline. Adds: 2,000-char composer counter,
   auth gate, banned notice, sort toggle (recent / popular), edit (<5 min), deleted-by-
   author + removed-by-moderator placeholders, reactions + "who reacted" list, report/flag
   + confirmation, and a profile Notification-settings modal. */
(function(){
  "use strict";
  if(window.__TLC_ON__) return; window.__TLC_ON__=true;

  /* ---------------- styles ---------------- */
  const CSS=`
  :root{--tlc-red:#f03c3c;--tlc-line:#e1e3e5;--tlc-ter:#8f959d;--tlc-sec:#40444a;--tlc-b3:#f0f1f2;--tlc-r:4px;}
  .tlc-entry-img{display:block;width:100%;height:auto;}
  /* margin trail (absolute over the document, scrolls with content) */
  .tlc-trail{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;}
  .tlc-line{position:absolute;width:2px;background:var(--tlc-line);border-radius:2px;}
  .tlc-fill{position:absolute;left:0;top:0;width:100%;height:0;background:#000;border-radius:2px;}
  .tlc-marker{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;}
  .tlc-av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:700 10px/1 Inter,sans-serif;
    color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28);transition:transform .15s,box-shadow .15s;}
  .tlc-marker:hover .tlc-av,.tlc-marker.tlc-near .tlc-av{transform:scale(1.16);box-shadow:0 0 0 3px rgba(240,60,60,.28),0 1px 4px rgba(0,0,0,.3);}
  .tlc-cl{position:absolute;top:-5px;right:-7px;background:var(--tlc-red);color:#fff;font:800 9px/1 Inter,sans-serif;
    min-width:15px;height:15px;border-radius:99px;border:2px solid #fff;display:grid;place-items:center;padding:0 2px;}
  /* popover (desktop hover) */
  .tlc-pop{position:fixed;z-index:2147483000;width:230px;background:#fff;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);
    box-shadow:0 4px 16px rgba(0,0,0,.14);padding:12px;display:none;font-family:Inter,sans-serif;}
  .tlc-pop .p{font:700 10px/1 Inter;letter-spacing:.08em;text-transform:uppercase;color:var(--tlc-ter);margin-bottom:6px;}
  .tlc-pop .h{display:flex;gap:8px;align-items:center;margin-bottom:6px;}
  .tlc-pop .h .tlc-av{width:24px;height:24px;}
  .tlc-pop .n{font:600 13px Inter;} .tlc-pop .t{font:400 13px/1.45 Inter;color:#16181c;}
  /* FAB */
  .tlc-fab{position:fixed;right:16px;bottom:20px;z-index:2147483001;height:48px;padding:0 18px;border:0;background:#000;color:#fff;
    border-radius:var(--tlc-r);font:700 12px/1 Inter;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:8px;
    box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer;}
  .tlc-fab svg{width:18px;height:18px;}
  /* scrim (transparent click-catcher) + bottom sheet */
  .tlc-scrim{position:fixed;inset:0;z-index:2147483400;background:transparent;visibility:hidden;}
  .tlc-scrim.tlc-show{visibility:visible;}
  .tlc-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483401;background:#fff;border-radius:12px 12px 0 0;
    transform:translateY(100%);transition:transform .32s cubic-bezier(.2,.85,.25,1);max-height:82vh;display:flex;flex-direction:column;
    box-shadow:0 -8px 40px rgba(0,0,0,.2);font-family:Inter,sans-serif;}
  .tlc-sheet.tlc-show{transform:translateY(0);}
  .tlc-grip{width:38px;height:4px;border-radius:99px;background:#d6d6d6;margin:10px auto 4px;}
  .tlc-head{width:100%;max-width:1440px;align-self:center;padding:6px 18px 12px;border-bottom:1px solid var(--tlc-line);
    display:flex;align-items:center;justify-content:space-between;}
  .tlc-head .t{font:700 15px Inter;} .tlc-head .p{font:700 11px Inter;color:var(--tlc-ter);letter-spacing:.06em;text-transform:uppercase;}
  .tlc-body{width:100%;max-width:1440px;align-self:center;overflow-y:auto;padding:6px 18px 12px;}
  .tlc-cmt{display:flex;gap:11px;padding:14px 0;border-bottom:1px solid var(--tlc-line);}
  .tlc-cmt:last-child{border-bottom:none;}
  .tlc-cmt .tlc-av{width:34px;height:34px;flex:0 0 auto;font-size:13px;border:0;box-shadow:none;}
  .tlc-cmt .tlc-av.sm{width:26px;height:26px;font-size:11px;}
  .tlc-main{min-width:0;flex:1;}
  .tlc-top{display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;}
  .tlc-nm{font:600 14px Inter;} .tlc-tm{font:400 12px Inter;color:var(--tlc-ter);}
  .tlc-badge{font:700 10px Inter;color:var(--tlc-ter);border:1px solid var(--tlc-line);border-radius:var(--tlc-r);padding:2px 7px;letter-spacing:.04em;text-transform:uppercase;}
  .tlc-tx{font:400 14px/1.5 Inter;color:#16181c;}
  .tlc-acts{display:flex;gap:16px;margin-top:7px;align-items:center;}
  .tlc-acts button{border:0;background:none;color:var(--tlc-ter);font:600 12px Inter;display:flex;align-items:center;gap:5px;cursor:pointer;padding:0;}
  .tlc-acts button.tlc-liked{color:var(--tlc-red);}
  .tlc-acts svg{width:14px;height:14px;}
  .tlc-replies{margin-top:10px;padding-left:14px;border-left:2px solid var(--tlc-line);}
  .tlc-cmt.tlc-reply{padding:10px 0;border-bottom:none;}
  /* flattened reply-to-reply: the target is an @mention inside the same (single) reply tier */
  .tlc-mention{font-weight:600;color:#000;}
  .tlc-rbox{display:flex;gap:8px;margin-top:10px;}
  .tlc-rinput{flex:1;min-width:0;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);padding:9px 11px;font:400 13px Inter;color:#16181c;}
  .tlc-rinput:focus{outline:none;border-color:#000;}
  .tlc-rsend{border:0;background:#000;color:#fff;border-radius:var(--tlc-r);padding:0 14px;height:36px;font:700 11px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-comp{width:100%;max-width:1440px;align-self:center;border-top:1px solid var(--tlc-line);padding:12px 18px calc(14px + env(safe-area-inset-bottom));background:var(--tlc-b3);}
  .tlc-comp .c{font:400 12px Inter;color:var(--tlc-sec);margin-bottom:8px;} .tlc-comp .c b{color:#000;}
  .tlc-comp .r{display:flex;gap:9px;align-items:flex-end;}
  .tlc-comp textarea{flex:1;resize:none;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);padding:11px 12px;font:400 14px/1.4 Inter;min-height:44px;max-height:120px;}
  .tlc-comp textarea:focus{outline:none;border-color:#000;}
  .tlc-comp .s{border:0;background:#000;color:#fff;font:700 12px Inter;border-radius:var(--tlc-r);padding:0 18px;height:44px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
  .tlc-comp .s:disabled{opacity:.35;}
  .tlc-empty{padding:30px 6px;text-align:center;color:var(--tlc-ter);font:400 14px Inter;}
  /* the margin trail is a desktop-only affordance — mobile has no side margin for it (the live
     article has only ~16px side padding). Mobile relies on the FAB + end-of-page feed instead. */
  @media(max-width:1023px){.tlc-pop{display:none!important;}.tlc-trail{display:none!important;}}
  /* end-of-page section */
  .tlc-cend{border-top:8px solid var(--tlc-b3);background:#fff;font-family:Inter,sans-serif;}
  .tlc-cend-in{max-width:1376px;margin:0 auto;padding:32px 16px;}
  .tlc-cend-col{max-width:760px;margin:0 auto;}
  .tlc-cend-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
  .tlc-cend h2{font:700 20px/1.2 Inter;letter-spacing:-.01em;margin:0;color:#000;}
  .tlc-cend h2 span{color:var(--tlc-ter);font-weight:600;}
  .tlc-cend-comp{margin-bottom:18px;}
  .tlc-cend-list .tlc-cmt{padding:16px 0;}
  .tlc-snip{font:italic 400 13px/1.5 Inter;color:var(--tlc-sec);border-left:3px solid var(--tlc-line);padding:2px 8px 2px 10px;margin:0 0 8px;
    cursor:pointer;border-radius:0 var(--tlc-r) var(--tlc-r) 0;transition:border-color .15s,color .15s,background .15s;outline:none;}
  .tlc-snip:hover,.tlc-snip:focus-visible{border-left-color:var(--tlc-red);color:#16181c;background:rgba(0,0,0,.03);}
  .tlc-flash{background:#e5e5e5!important;transition:background .4s;border-radius:var(--tlc-r);}
  /* "Load more" CTA under the (capped) end-of-page feed */
  .tlc-loadmore{display:block;width:100%;margin-top:8px;border:1px solid #000;background:#fff;color:#000;
    font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;border-radius:var(--tlc-r);height:46px;cursor:pointer;}
  .tlc-loadmore:hover{background:#000;color:#fff;}
  /* sort control — single toggle (Build 37): one compact trigger showing the active order; tapping
     flips it. Matches the compact "Sort: <value>" triggers on LinkedIn/NYT/Substack, collapsed to a
     direct flip since we only have two orders (no menu needed). */
  .tlc-sort{display:flex;align-items:center;gap:6px;}
  .tlc-sort .lbl{font:700 10px Inter;letter-spacing:.06em;text-transform:uppercase;color:var(--tlc-ter);margin-right:2px;}
  .tlc-sortt{display:flex;align-items:center;gap:6px;border:1px solid var(--tlc-line);background:#fff;color:var(--tlc-sec);font:600 12px Inter;padding:6px 11px;border-radius:var(--tlc-r);cursor:pointer;}
  .tlc-sortt svg{width:13px;height:13px;stroke:currentColor;fill:none;flex:0 0 auto;}
  .tlc-sortt:active{background:var(--tlc-b3);}
  .tlc-pt-note{font:400 12px/1.5 Inter;color:var(--tlc-sec);background:var(--tlc-b3);border-radius:var(--tlc-r);padding:9px 12px;margin-bottom:16px;}
  /* sticky right-side comments drawer (opened from "Load more"). No scrim — article stays scrollable. */
  .tlc-drawer{position:fixed;top:0;right:0;height:100vh;width:min(420px,92vw);background:#fff;z-index:2147483300;
    transform:translateX(100%);transition:transform .32s cubic-bezier(.2,.85,.25,1);box-shadow:-8px 0 40px rgba(0,0,0,.18);
    display:flex;flex-direction:column;font-family:Inter,sans-serif;border-left:1px solid var(--tlc-line);}
  .tlc-drawer.tlc-show{transform:translateX(0);}
  .tlc-dw-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--tlc-line);}
  .tlc-dw-head .t{font:700 16px Inter;}
  .tlc-dw-x{border:0;background:none;cursor:pointer;width:34px;height:34px;display:grid;place-items:center;border-radius:var(--tlc-r);color:var(--tlc-sec);}
  .tlc-dw-x:hover{background:var(--tlc-b3);} .tlc-dw-x svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;}
  .tlc-dw-tools{flex:0 0 auto;padding:10px 18px;border-bottom:1px solid var(--tlc-line);}
  .tlc-dw-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 18px 16px;}
  .tlc-dw-comp{flex:0 0 auto;border-top:1px solid var(--tlc-line);background:var(--tlc-b3);
    padding:12px 18px calc(12px + env(safe-area-inset-bottom));}
  /* quote chip shown in the drawer composer when commenting on a selected passage */
  .tlc-dw-quote{display:flex;align-items:flex-start;gap:8px;background:#fff;border:1px solid var(--tlc-line);
    border-left:3px solid #000;border-radius:var(--tlc-r);padding:8px 10px;margin-bottom:8px;}
  .tlc-dw-quote .q{flex:1;min-width:0;font:italic 400 13px/1.45 Inter;color:var(--tlc-sec);}
  .tlc-dw-quote .x{flex:0 0 auto;border:0;background:none;color:var(--tlc-ter);font:700 17px/1 Inter;cursor:pointer;padding:0 2px;}
  /* shared composer (auth gate / banned / guidelines / editor with 2000-char counter) */
  .tlc-gate{background:#fff;border:1px dashed var(--tlc-line);border-radius:var(--tlc-r);padding:18px 16px;text-align:center;}
  .tlc-gate .gt{font:700 15px Inter;color:#000;margin-bottom:4px;}
  .tlc-gate .gs{font:400 13px/1.5 Inter;color:var(--tlc-sec);margin-bottom:13px;}
  .tlc-gate .gb{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}
  .tlc-signin{border:0;background:#000;color:#fff;border-radius:var(--tlc-r);padding:10px 18px;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-signup{border:1px solid #000;background:#fff;color:#000;border-radius:var(--tlc-r);padding:10px 18px;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-banned{display:flex;gap:10px;align-items:flex-start;background:#fdecec;border:1px solid #f6b3b3;border-radius:var(--tlc-r);padding:13px 14px;font:400 13px/1.5 Inter;color:#8f1a1a;}
  .tlc-banned svg{flex:0 0 auto;width:18px;height:18px;stroke:#c62828;fill:none;stroke-width:2;margin-top:1px;}
  .tlc-banned b{color:#6f1414;}
  .tlc-gl{background:var(--tlc-b3);border:1px solid var(--tlc-line);border-radius:var(--tlc-r);padding:14px 15px;}
  .tlc-gl .gt{font:700 14px Inter;margin-bottom:8px;color:#000;}
  .tlc-gl ul{margin:0 0 10px;padding-left:18px;} .tlc-gl li{font:400 12.5px/1.65 Inter;color:var(--tlc-sec);}
  .tlc-gl .gf{font:400 12px/1.5 Inter;color:var(--tlc-ter);margin-bottom:11px;} .tlc-gl a{color:#000;text-decoration:underline;}
  .tlc-glok{border:0;background:#000;color:#fff;border-radius:var(--tlc-r);padding:10px 16px;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-ta{width:100%;box-sizing:border-box;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);padding:11px 12px;font:400 14px/1.5 Inter;resize:none;min-height:58px;max-height:150px;color:#16181c;}
  .tlc-ta:focus{outline:none;border-color:#000;}
  .tlc-comp-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:12px;}
  .tlc-counter{font:600 11px Inter;color:var(--tlc-ter);font-variant-numeric:tabular-nums;}
  .tlc-counter.over{color:var(--tlc-red);}
  .tlc-post{border:0;background:#000;color:#fff;border-radius:var(--tlc-r);height:40px;padding:0 18px;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-post:disabled{opacity:.35;cursor:default;}
  /* reactions "who reacted" list */
  .tlc-reactors-t{color:var(--tlc-ter);}
  .tlc-reactors{margin-top:9px;background:var(--tlc-b3);border-radius:var(--tlc-r);padding:9px 11px;}
  .tlc-react-avs{display:flex;margin-bottom:6px;}
  .tlc-react-avs .tlc-av{margin-right:-6px;border:2px solid var(--tlc-b3);box-shadow:none;}
  .tlc-av.xs{width:20px;height:20px;font-size:9px;}
  .tlc-react-tx{font:400 12px/1.4 Inter;color:var(--tlc-sec);}
  /* overflow menu (report / edit / delete) */
  .tlc-menu-wrap{position:relative;margin-left:auto;}
  .tlc-more{border:0;background:none;color:var(--tlc-ter);font:700 18px/1 Inter;cursor:pointer;padding:0 4px;}
  .tlc-menu{position:absolute;right:0;top:24px;background:#fff;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);box-shadow:0 6px 20px rgba(0,0,0,.16);min-width:140px;z-index:5;padding:4px;}
  .tlc-menu button{display:block;width:100%;text-align:left;border:0;background:none;font:600 12px Inter;color:#16181c;padding:9px 10px;border-radius:var(--tlc-r);cursor:pointer;}
  .tlc-menu button:hover{background:var(--tlc-b3);}
  .tlc-menu .tlc-report{color:var(--tlc-red);}
  .tlc-menu-note{font:600 11px Inter;color:var(--tlc-ter);padding:9px 10px;}
  .tlc-reported-note{font:600 11px Inter;color:var(--tlc-ter);margin-top:7px;}
  /* deleted / removed placeholders */
  .tlc-cmt.tlc-ph .tlc-phtx{font:italic 400 14px Inter;color:var(--tlc-ter);}
  /* inline edit */
  .tlc-edit-cancel{border:1px solid var(--tlc-line)!important;background:#fff;color:var(--tlc-sec)!important;border-radius:var(--tlc-r);height:36px;padding:0 14px;font:700 11px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-edit-save{border:0;background:#000;color:#fff;border-radius:var(--tlc-r);height:36px;padding:0 16px;font:700 11px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  /* skeleton loading */
  .tlc-sk{display:flex;gap:11px;padding:16px 0;border-bottom:1px solid var(--tlc-line);}
  .tlc-sk-av{width:34px;height:34px;border-radius:50%;flex:0 0 auto;}
  .tlc-sk-av,.tlc-sk-l{background:linear-gradient(90deg,#ececec 25%,#f6f6f6 37%,#ececec 63%);background-size:400% 100%;animation:tlcsh 1.4s ease infinite;}
  .tlc-sk-main{flex:1;} .tlc-sk-l{height:11px;border-radius:4px;margin-bottom:9px;}
  .tlc-sk-l.w40{width:40%;} .tlc-sk-l.w90{width:90%;} .tlc-sk-l.w70{width:70%;}
  @keyframes tlcsh{0%{background-position:100% 0;}100%{background-position:0 0;}}
  /* large empty state */
  .tlc-empty-lg{padding:46px 12px;text-align:center;}
  .tlc-empty-lg .ico{font-size:30px;margin-bottom:8px;}
  .tlc-empty-lg .t{font:700 16px Inter;color:#000;margin-bottom:4px;}
  .tlc-empty-lg .s{font:400 13px/1.5 Inter;color:var(--tlc-ter);}
  /* Medium-style floating selection tooltip (one action: Comment) */
  .tlc-seltip{position:fixed;z-index:2147483500;transform:translate(-50%,-100%);background:#000;border-radius:var(--tlc-r);
    box-shadow:0 4px 16px rgba(0,0,0,.28);display:none;}
  .tlc-seltip.tlc-show{display:block;}
  .tlc-seltip button{border:0;background:none;color:#fff;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;
    padding:10px 15px;cursor:pointer;display:flex;align-items:center;gap:7px;}
  .tlc-seltip button svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2;}
  .tlc-seltip:after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#000;}
  /* on mobile the comments drawer becomes a bottom sheet (slides up from the bottom, up to 80vh) */
  @media(max-width:1023px){
    .tlc-drawer{top:auto;bottom:0;left:0;right:0;width:auto;height:auto;max-height:80vh;border-left:0;
      border-top:1px solid var(--tlc-line);border-radius:12px 12px 0 0;transform:translateY(100%);box-shadow:0 -8px 40px rgba(0,0,0,.2);}
    .tlc-drawer.tlc-show{transform:translateY(0);}
  }
  /* page dim while the comments drawer is open (15% black). pointer-events:none → article stays scrollable */
  .tlc-dim{position:fixed;inset:0;z-index:2147483290;background:#000;opacity:0;pointer-events:none;transition:opacity .3s;}
  .tlc-dim.tlc-show{opacity:.15;}
  /* toast */
  .tlc-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%) translateY(16px);background:#000;color:#fff;font:600 13px Inter;
    padding:11px 16px;border-radius:var(--tlc-r);box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:2147483600;opacity:0;pointer-events:none;
    transition:opacity .2s,transform .2s;max-width:88vw;text-align:center;}
  .tlc-toast.tlc-show{opacity:1;transform:translateX(-50%) translateY(0);}
  /* prototype control panel — toggles for every condition */
  .tlc-proto{position:fixed;left:16px;bottom:20px;z-index:2147483200;font-family:Inter,sans-serif;}
  .tlc-proto-tog{display:flex;align-items:center;gap:7px;background:#000;color:#fff;border:0;border-radius:var(--tlc-r);
    padding:10px 13px;font:700 11px Inter;letter-spacing:.09em;text-transform:uppercase;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);}
  .tlc-proto-tog i{width:7px;height:7px;border-radius:50%;background:var(--tlc-red);display:inline-block;}
  .tlc-proto-body{display:none;margin-top:8px;width:252px;background:#fff;border:1px solid var(--tlc-line);border-radius:8px;
    box-shadow:0 12px 38px rgba(0,0,0,.22);padding:13px;max-height:74vh;overflow:auto;}
  .tlc-proto.tlc-open .tlc-proto-body{display:block;}
  .tlc-pg{margin-bottom:13px;} .tlc-pg:last-child{margin-bottom:0;}
  .tlc-pg>.cap{display:block;font:700 9px Inter;letter-spacing:.11em;text-transform:uppercase;color:var(--tlc-ter);margin-bottom:6px;}
  .tlc-seg{display:flex;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);overflow:hidden;}
  .tlc-seg button{flex:1;border:0;background:#fff;color:var(--tlc-sec);font:600 11px Inter;padding:8px 4px;cursor:pointer;border-right:1px solid var(--tlc-line);}
  .tlc-seg button:last-child{border-right:0;}
  .tlc-seg button.active{background:#000;color:#fff;}
  .tlc-prow{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .tlc-prow .lbl{font:600 12px Inter;color:#000;}
  .tlc-pnote{font:400 10px/1.45 Inter;color:var(--tlc-ter);margin-top:5px;}
  .tlc-pbtn{width:100%;border:1px solid #000;background:#fff;color:#000;border-radius:var(--tlc-r);padding:9px;font:700 11px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;margin-top:7px;}
  .tlc-pbtn:hover{background:#000;color:#fff;}
  .tlc-switch{position:relative;width:40px;height:22px;border-radius:99px;border:0;background:#000;cursor:pointer;padding:0;transition:background .18s;flex:0 0 auto;}
  .tlc-switch[aria-checked="false"]{background:#c7ccd1;}
  .tlc-switch .knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .18s;}
  .tlc-switch[aria-checked="true"] .knob{transform:translateX(18px);}
  @media(max-width:1023px){.tlc-pg-timeline{display:none;}}
  /* Notification settings modal (profile) */
  .tlc-ns-scrim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:2147483550;opacity:0;visibility:hidden;transition:opacity .2s;}
  .tlc-ns-scrim.tlc-show{opacity:1;visibility:visible;}
  .tlc-ns{position:fixed;left:50%;top:50%;transform:translate(-50%,-46%);width:min(460px,92vw);background:#fff;border-radius:8px;z-index:2147483560;
    box-shadow:0 20px 60px rgba(0,0,0,.32);opacity:0;visibility:hidden;transition:opacity .2s,transform .2s;font-family:Inter,sans-serif;overflow:hidden;}
  .tlc-ns.tlc-show{opacity:1;visibility:visible;transform:translate(-50%,-50%);}
  .tlc-ns-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--tlc-line);}
  .tlc-ns-head .t{font:700 16px Inter;color:#000;}
  .tlc-ns-sub{font:700 10px Inter;color:var(--tlc-ter);padding:14px 18px 0;letter-spacing:.09em;text-transform:uppercase;}
  .tlc-ns-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:15px 18px;border-bottom:1px solid var(--tlc-line);}
  .tlc-ns-row:last-child{border-bottom:0;}
  .tlc-ns-row .nm{font:600 14px Inter;color:#000;margin-bottom:3px;}
  .tlc-ns-row .ds{font:400 12.5px/1.5 Inter;color:var(--tlc-sec);}
  /* mobile timeline bar — slim scroll-progress line with comment DP dots. Two placements: top (under
     the sticky nav) or bottom (Page 3 iteration: the bar is the top edge of a white panel docked above
     the bottom action bar; the abar floats over the panel, comment cards open UPWARD). */
  .tlc-mbar{position:fixed;left:0;right:0;padding:4px 0;z-index:2147483050;display:none;pointer-events:none;
    background:#fff;border-bottom:1px solid var(--tlc-line);}  /* 4px breathing room + white fill so the line isn't floaty */
  /* bottom mode: the track IS the panel's top edge — no chrome above it; the dots (7px on a 3px
     track) and bloomed DPs deliberately bleed past the edge over the article, like the mock */
  .tlc-mbar.tlc-mbar-bot{top:auto;bottom:0;padding:0;border-bottom:0;box-sizing:border-box;}
  .tlc-mcard.mc-bot .mc-arrow{display:none;}
  /* Build 41 — bottom-mode card is a comment BROWSER: centered, tiny ‹ › to step between comments;
     the article auto-scrolls behind it and the referenced paragraph holds a super-light-gray
     highlight (lighter than the .tlc-flash jump flash) while browsing */
  .tlc-mcard .mc-nav{margin-left:auto;display:flex;gap:5px;}
  .tlc-mcard .mc-nav button{width:24px;height:24px;border:1px solid var(--tlc-line);background:#fff;border-radius:var(--tlc-r);cursor:pointer;color:var(--tlc-sec);display:grid;place-items:center;padding:0;}
  .tlc-mcard .mc-nav button:disabled{opacity:.3;cursor:default;}
  .tlc-mcard .mc-nav button:not(:disabled):active{background:var(--tlc-b3);}
  .tlc-mcard .mc-nav svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.2;}
  .tlc-mlit{background:#f0f1f2!important;transition:background .3s;border-radius:var(--tlc-r);}
  .tlc-mbar-track{position:relative;height:3px;background:var(--tlc-line);}
  .tlc-mbar-fill{position:absolute;left:0;top:0;height:100%;width:0;background:#000;transition:width .06s linear;}
  .tlc-mdot{position:absolute;top:50%;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;
    padding:10px 8px;display:grid;place-items:center;}   /* invisible ~20×24 hit area — the visible dot is only 4px */
  /* resting: a plain black dot (no DP, no number). When the fill front reaches it, it blooms into the DP. */
  .tlc-mdot .tlc-av{width:4px;height:4px;background:#000;color:transparent;font-size:0;
    border:0;   /* must be explicit — the base .tlc-av (trail markers) has a 2px white border that leaks in otherwise */
    box-shadow:0 1px 2px rgba(0,0,0,.3);transition:width .18s ease,height .18s ease,background .18s ease,box-shadow .18s ease;}
  .tlc-mdot.tlc-mact{z-index:2;}
  .tlc-mdot.tlc-mact .tlc-av{width:20px;height:20px;background:var(--dp);color:#fff;font-size:9px;   /* 20px per the Page 3 mock */
    box-shadow:0 1px 4px rgba(0,0,0,.35);}
  .tlc-mcard{position:fixed;z-index:2147483100;width:min(320px,86vw);background:#fff;border:1px solid var(--tlc-line);border-radius:8px;
    box-shadow:0 10px 34px rgba(0,0,0,.22);padding:12px 13px;display:none;font-family:Inter,sans-serif;}
  .tlc-mcard.tlc-show{display:block;}
  .tlc-mcard .mc-arrow{position:absolute;top:-7px;width:12px;height:12px;background:#fff;border-left:1px solid var(--tlc-line);border-top:1px solid var(--tlc-line);transform:rotate(45deg);}
  .tlc-mcard .mc-top{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
  .tlc-mcard .mc-top .tlc-av{width:30px;height:30px;font-size:12px;border:0;box-shadow:none;flex:0 0 auto;}
  .tlc-mcard .mc-nm{font:600 13px Inter;color:#000;} .tlc-mcard .mc-tm{font:400 11px Inter;color:var(--tlc-ter);}
  .tlc-mcard .mc-x{margin-left:auto;border:0;background:none;color:var(--tlc-ter);cursor:pointer;width:28px;height:28px;display:grid;place-items:center;border-radius:var(--tlc-r);}
  .tlc-mcard .mc-x:hover{background:var(--tlc-b3);} .tlc-mcard .mc-x svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;}
  .tlc-mcard .mc-tx{font:400 13.5px/1.5 Inter;color:#16181c;margin-bottom:9px;}
  .tlc-mcard .mc-foot{display:flex;align-items:center;gap:16px;}
  .tlc-mcard .mc-foot .tlc-like{border:0;background:none;color:var(--tlc-ter);font:600 12px Inter;display:flex;align-items:center;gap:5px;cursor:pointer;padding:0;}
  .tlc-mcard .mc-foot .tlc-like svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;} .tlc-mcard .mc-foot .tlc-like.tlc-liked{color:var(--tlc-red);}
  .tlc-mview{border:0;background:none;color:#000;font:700 12px Inter;cursor:pointer;text-decoration:underline;padding:0;}
  /* mobile bottom action bar — like / comment / bookmark the article (mobile only) */
  .tlc-abar{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483060;   /* above the bottom-docked timeline panel (2147483050) */
    display:none;align-items:center;gap:2px;background:#fff;border:1px solid var(--tlc-line);border-radius:999px;
    box-shadow:0 8px 30px rgba(0,0,0,.18);padding:6px;}
  .tlc-abar button{border:0;background:none;display:flex;align-items:center;gap:7px;padding:10px 16px;border-radius:999px;cursor:pointer;color:#16181c;font:700 13px Inter;}
  .tlc-abar button:active{background:var(--tlc-b3);}
  .tlc-abar svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.9;}
  .tlc-abar .cnt{font:700 13px Inter;font-variant-numeric:tabular-nums;}
  .tlc-abar .tlc-ab-like.on{color:var(--tlc-red);} .tlc-abar .tlc-ab-like.on svg{fill:var(--tlc-red);stroke:var(--tlc-red);}
  .tlc-abar .tlc-ab-save.on svg{fill:#000;}
  @media(max-width:1023px){.tlc-fab{display:none!important;}.tlc-abar{display:flex;}}
  /* re-rank segment folded into the bottom bar + its bottom sheet.
     NB: must be .tlc-abar-scoped — a bare .tlc-ab-rank loses to ".tlc-abar button" (class+type beats
     lone class), leaving the button transparent with dark text/icon. */
  .tlc-abar .tlc-ab-rank{background:#000;color:#fff;}
  .tlc-abar .tlc-ab-rank svg{stroke:#fff;}
  .tlc-ab-div{width:1px;height:26px;background:var(--tlc-line);margin:0 3px;flex:0 0 auto;}
  .tlc-rr{position:fixed;inset:0;z-index:2147483350;visibility:hidden;font-family:Inter,sans-serif;}
  .tlc-rr.tlc-show{visibility:visible;}
  .tlc-rr-bg{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .3s;}
  .tlc-rr.tlc-show .tlc-rr-bg{opacity:.4;}
  .tlc-rr-sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:14px 14px 0 0;max-height:84vh;display:flex;flex-direction:column;
    transform:translateY(100%);transition:transform .32s cubic-bezier(.2,.85,.25,1);box-shadow:0 -8px 40px rgba(0,0,0,.24);}
  .tlc-rr.tlc-show .tlc-rr-sheet{transform:translateY(0);}
  .tlc-rr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:2px 16px 12px;border-bottom:1px solid var(--tlc-line);}
  .tlc-rr-head .t{font:700 17px Inter;color:#000;} .tlc-rr-head .s{font:400 12.5px/1.4 Inter;color:var(--tlc-ter);margin-top:2px;}
  .tlc-rr-x{border:0;background:none;cursor:pointer;width:32px;height:32px;display:grid;place-items:center;color:var(--tlc-sec);flex:0 0 auto;}
  .tlc-rr-x svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;}
  .tlc-rr-list{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:2px 16px;}
  .tlc-rr-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--tlc-line);}
  .tlc-rr-row:last-child{border-bottom:0;}
  .tlc-rr-rank{width:24px;height:24px;border-radius:6px;background:#000;color:#fff;font:800 12px Inter;display:grid;place-items:center;flex:0 0 auto;}
  .tlc-rr-thumb{width:46px;height:34px;border-radius:4px;object-fit:cover;background:var(--tlc-b3);border:1px solid var(--tlc-line);flex:0 0 auto;}
  .tlc-rr-nm{flex:1;min-width:0;font:600 13.5px/1.35 Inter;color:#000;}
  .tlc-rr-ctrls{display:flex;gap:5px;flex:0 0 auto;}
  .tlc-rr-ctrls button{width:32px;height:32px;border:1px solid var(--tlc-line);background:#fff;border-radius:var(--tlc-r);cursor:pointer;color:var(--tlc-sec);display:grid;place-items:center;padding:0;}
  .tlc-rr-ctrls button:disabled{opacity:.3;cursor:default;}
  .tlc-rr-ctrls svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;}
  .tlc-rr-foot{padding:12px 16px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--tlc-line);}
  .tlc-rr-submit{width:100%;border:0;background:#000;color:#fff;border-radius:var(--tlc-r);height:48px;font:700 13px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  .tlc-rr-done{text-align:center;padding:30px 18px;}
  .tlc-rr-done .em{font-size:30px;margin-bottom:8px;} .tlc-rr-done .t{font:700 17px Inter;color:#000;margin-bottom:5px;} .tlc-rr-done .s{font:400 13px/1.5 Inter;color:var(--tlc-sec);}
  .tlc-rr-again{margin-top:16px;border:1px solid #000;background:#fff;color:#000;border-radius:var(--tlc-r);height:42px;padding:0 18px;font:700 12px Inter;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}
  /* re-rank ⨯ essentials coexistence variants — how the list nav (‹ › + Re-Rank) merges with the pill.
     Shared pieces: .tlc-ab-nav = the real product's nav trio (‹ gray / RE-RANK black / › red),
     .tlc-ab-cap = the "NEXT · ITEM #N" label, .tlc-ab-tip = floating version of that label. */
  .tlc-ab-prev,.tlc-ab-next{justify-content:center;}
  .tlc-ab-prev:disabled,.tlc-ab-next:disabled{opacity:.35;cursor:default;}
  .tlc-abar .tlc-ab-rank:active{opacity:.85;background:#000;}
  .tlc-ab-cap{font:800 12px Inter;letter-spacing:.04em;color:#16181c;text-transform:uppercase;font-variant-numeric:tabular-nums;white-space:nowrap;}
  .tlc-ab-pill{display:flex;align-items:center;gap:2px;background:#fff;border:1px solid var(--tlc-line);border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.18);padding:5px;}
  .tlc-ab-nav{display:flex;align-items:center;gap:10px;width:100%;}
  .tlc-ab-nav button{padding:0;height:50px;border-radius:8px;justify-content:center;}
  .tlc-ab-nav .tlc-ab-prev{flex:1;border:1px solid var(--tlc-line);background:#fff;color:var(--tlc-ter);}
  .tlc-ab-nav .tlc-ab-rank{flex:1.7;background:#000;color:#fff;font:800 13.5px Inter;letter-spacing:.06em;text-transform:uppercase;}
  .tlc-ab-nav .tlc-ab-next{flex:1;background:var(--tlc-red);color:#fff;}
  .tlc-ab-nav .tlc-ab-next:active{opacity:.85;background:var(--tlc-red);}
  .tlc-ab-tip{position:absolute;bottom:calc(100% + 8px);right:6px;background:#16181c;color:#fff;padding:6px 9px;border-radius:6px;
    opacity:0;transform:translateY(3px);transition:opacity .18s,transform .18s;pointer-events:none;}
  .tlc-abar .tlc-ab-tip{color:#fff;font-size:10.5px;}
  .tlc-abar.tlc-tipshow .tlc-ab-tip{opacity:1;transform:none;}
  /* stacked — status quo baseline: essentials pill floating above the full-width nav deck */
  .tlc-abar.tlc-abar-stack{left:12px;right:12px;transform:none;background:none;border:0;box-shadow:none;border-radius:0;padding:0;flex-direction:column;align-items:center;gap:8px;}
  .tlc-ab-deck{width:100%;box-sizing:border-box;background:#fff;border:1px solid var(--tlc-line);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);padding:10px 12px 12px;}
  .tlc-ab-deck .caprow{display:flex;align-items:center;justify-content:flex-end;margin-bottom:8px;}
  /* deck — one card, two rows: essentials fold into the nav card's label row */
  .tlc-abar.tlc-abar-deck{left:12px;right:12px;transform:none;border-radius:14px;padding:8px 12px 12px;flex-direction:column;align-items:stretch;gap:8px;}
  .tlc-abar.tlc-abar-deck .caprow{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .tlc-abar.tlc-abar-deck .acts{display:flex;align-items:center;}
  .tlc-abar.tlc-abar-deck .acts button{padding:6px 8px;}
  .tlc-abar.tlc-abar-deck .acts svg{width:19px;height:19px;}
  .tlc-abar.tlc-abar-deck .acts .cnt{font-size:12.5px;}
  /* unified — one pill, single row: ‹ RE-RANK › | icons (counts dropped to fit 375px) */
  .tlc-abar.tlc-abar-uni{gap:4px;}
  .tlc-abar.tlc-abar-uni button{padding:9px;}
  .tlc-abar.tlc-abar-uni svg{width:20px;height:20px;}
  .tlc-abar.tlc-abar-uni .tlc-ab-prev,.tlc-abar.tlc-abar-uni .tlc-ab-next{width:40px;height:40px;padding:0;}
  .tlc-abar.tlc-abar-uni .tlc-ab-prev{border:1px solid var(--tlc-line);background:#fff;color:var(--tlc-ter);}
  .tlc-abar.tlc-abar-uni .tlc-ab-next{background:var(--tlc-red);color:#fff;}
  .tlc-abar.tlc-abar-uni .tlc-ab-rank{height:40px;padding:0 14px;font:800 12px Inter;letter-spacing:.05em;text-transform:uppercase;}
  /* flank — round ‹ › at the screen edges, essentials pill (with Re-Rank segment) centered */
  .tlc-abar.tlc-abar-flank{left:12px;right:12px;transform:none;background:none;border:0;box-shadow:none;border-radius:0;padding:0;justify-content:space-between;gap:8px;}
  .tlc-abar.tlc-abar-flank .tlc-ab-pill button{padding:9px 8px;}
  .tlc-abar.tlc-abar-flank .tlc-ab-pill .tlc-ab-rank{padding:9px 12px;font:800 12px Inter;letter-spacing:.04em;}
  .tlc-abar.tlc-abar-flank .tlc-ab-pill svg{width:20px;height:20px;}
  .tlc-abar.tlc-abar-flank .tlc-ab-prev,.tlc-abar.tlc-abar-flank .tlc-ab-next{width:46px;height:46px;padding:0;flex:0 0 auto;box-shadow:0 8px 30px rgba(0,0,0,.18);}
  .tlc-abar.tlc-abar-flank .tlc-ab-prev{background:#fff;border:1px solid var(--tlc-line);color:var(--tlc-ter);}
  .tlc-abar.tlc-abar-flank .tlc-ab-next{background:var(--tlc-red);color:#fff;}
  /* swap — one slot: essentials at rest, morphs into ‹ RE-RANK › while scrolling the list */
  .tlc-abar.tlc-abar-swap{transition:opacity .15s,transform .15s;}
  .tlc-abar.tlc-swapping{opacity:0;transform:translateX(-50%) scale(.94);}
  /* focus (Build 34–35, from the user's Figma Page 2) — two slots that trade focus: at rest the nav deck
     (‹ RE-RANK ›) is expanded with the social actions collapsed into a bubble of mini icons; tapping the
     bubble expands the essentials pill while the deck collapses into a black shuffle bubble (tap it to
     swap back). Both slots are ALWAYS in the DOM and morph in place — flex-basis/max-width/opacity
     transitions on one shared curve — so the swap is one continuous transform, not a re-render. */
  .tlc-abar.tlc-abar-focus{left:16px;right:16px;transform:none;background:none;border:0;box-shadow:none;border-radius:0;padding:0;gap:4px;justify-content:center;}
  .tlc-fdeck{display:flex;align-items:center;gap:4px;min-width:0;height:52px;box-sizing:border-box;padding:5px;overflow:hidden;
    flex:1 1 240px;background:#fff;border:1px solid var(--tlc-line);border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.18);
    transition:flex-grow .38s cubic-bezier(.4,0,.2,1),flex-basis .38s cubic-bezier(.4,0,.2,1),gap .38s cubic-bezier(.4,0,.2,1),padding .38s cubic-bezier(.4,0,.2,1),background-color .3s,border-color .3s;}
  .tlc-fdeck svg{width:20px;height:20px;flex:0 0 auto;}
  .tlc-fdeck .tlc-ab-prev,.tlc-fdeck .tlc-ab-next{width:40px;height:40px;padding:0;flex:0 0 auto;overflow:hidden;
    transition:width .38s cubic-bezier(.4,0,.2,1),border-width .38s cubic-bezier(.4,0,.2,1),opacity .2s;}
  .tlc-fdeck .tlc-ab-prev{border:1px solid var(--tlc-line);background:#fff;color:var(--tlc-ter);}
  .tlc-fdeck .tlc-ab-next{background:var(--tlc-red);color:#fff;}
  .tlc-abar .tlc-fdeck .tlc-ab-next:active{background:var(--tlc-red);opacity:.85;}
  .tlc-abar .tlc-fdeck .tlc-ab-rank{flex:1 1 auto;min-width:0;height:40px;border-radius:999px;justify-content:center;gap:8px;padding:0 10px;font:800 12px Inter;letter-spacing:.05em;text-transform:uppercase;overflow:hidden;
    transition:height .38s cubic-bezier(.4,0,.2,1),gap .38s cubic-bezier(.4,0,.2,1),padding .38s cubic-bezier(.4,0,.2,1);}
  .tlc-fdeck .tlc-ab-rank svg{transition:width .38s cubic-bezier(.4,0,.2,1),height .38s cubic-bezier(.4,0,.2,1);}
  .tlc-fdeck .tlc-ab-rank .lbl{max-width:90px;overflow:hidden;white-space:nowrap;transition:opacity .15s,max-width .38s cubic-bezier(.4,0,.2,1);}
  /* collapsed: the whole deck becomes the 52px black shuffle bubble */
  .tlc-fdeck.min{flex:0 0 52px;gap:0;padding:0;background:#000;border-color:#000;cursor:pointer;}
  .tlc-fdeck.min .tlc-ab-prev,.tlc-fdeck.min .tlc-ab-next{width:0;opacity:0;border-width:0;pointer-events:none;}
  .tlc-abar .tlc-fdeck.min .tlc-ab-rank{height:50px;gap:0;padding:0;}
  .tlc-fdeck.min .tlc-ab-rank svg{width:24px;height:24px;}
  .tlc-fdeck.min .tlc-ab-rank .lbl{opacity:0;max-width:0;}
  /* right slot — the mini-icon bubble that stretches into the full essentials pill */
  .tlc-abar .tlc-fsoc{position:relative;display:flex;align-items:center;flex:0 0 auto;height:52px;box-sizing:border-box;max-width:52px;overflow:hidden;cursor:pointer;
    background:#fff;border:1px solid var(--tlc-line);border-radius:999px;box-shadow:0 8px 15px rgba(0,0,0,.18);
    transition:max-width .38s cubic-bezier(.4,0,.2,1),box-shadow .3s;}
  .tlc-fsoc .fmini{position:absolute;top:0;bottom:0;left:0;width:50px;opacity:1;transition:opacity .18s;}
  .tlc-fsoc .fmini span{position:absolute;width:18px;height:18px;color:#16181c;}
  .tlc-fsoc .fmini svg{width:18px;height:18px;}
  .tlc-fsoc .fmini .fh{left:7px;top:13px;} .tlc-fsoc .fmini .fc{left:25px;top:8px;} .tlc-fsoc .fmini .fb{left:19px;top:26px;}
  /* the collapsed cluster mirrors the article's liked/saved state (kept in sync by the like/save handlers) */
  .tlc-fsoc .fmini .fh.on{color:var(--tlc-red);} .tlc-fsoc .fmini .fh.on svg{fill:var(--tlc-red);stroke:var(--tlc-red);}
  .tlc-fsoc .fmini .fb.on svg{fill:#000;}
  .tlc-fsoc .fx{display:flex;align-items:center;gap:2px;padding:4px;width:max-content;opacity:0;transition:opacity .18s;}
  .tlc-fsoc.exp{max-width:320px;cursor:default;box-shadow:0 8px 30px rgba(0,0,0,.18);}
  .tlc-fsoc.exp .fmini{opacity:0;pointer-events:none;}
  .tlc-fsoc.exp .fx{opacity:1;transition-delay:.14s;}
  .tlc-sel{width:100%;box-sizing:border-box;border:1px solid var(--tlc-line);border-radius:var(--tlc-r);background:#fff;padding:9px 10px;font:600 12px Inter;color:#000;cursor:pointer;}
  /* simulated sticky bottom anchor ad (Build 44) — the live site pins one to the viewport bottom
     (COMPLEX mark · ad creative · dismiss ✕). Toggleable page condition; when ON the body class
     tlc-adon lifts every floating bottom element above it (offsets = 50px bar + safe area). */
  .tlc-ad{position:fixed;left:0;right:0;bottom:0;z-index:2147483065;display:none;align-items:center;gap:8px;
    padding:4px 8px calc(4px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -2px 10px rgba(0,0,0,.14);font-family:Inter,sans-serif;}
  .tlc-ad.on{display:flex;}
  .tlc-ad .ad-mark{flex:0 0 auto;font:900 11px/0.95 Inter;color:#4a4f55;text-transform:uppercase;}
  .tlc-ad .ad-cr{flex:1;min-width:0;max-width:360px;margin:0 auto;height:42px;background:#0b7a33;border-radius:2px;
    display:flex;align-items:center;gap:10px;padding:0 10px;color:#fff;overflow:hidden;}
  .tlc-ad .ad-tx{flex:1;min-width:0;}
  .tlc-ad .ad-tx .l1{font:900 10.5px/1.2 Inter;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tlc-ad .ad-tx .l2{font:900 10.5px/1.2 Inter;text-transform:uppercase;}
  .tlc-ad .ad-tx .l3{font:400 6.5px/1.3 Inter;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tlc-ad .ad-cta{flex:0 0 auto;background:#fff;color:#16181c;font:700 9px Inter;letter-spacing:.03em;text-transform:uppercase;border:0;border-radius:2px;padding:8px 10px;cursor:pointer;}
  .tlc-ad .ad-x{flex:0 0 auto;border:0;background:none;color:#8f959d;width:30px;height:30px;display:grid;place-items:center;cursor:pointer;padding:0;}
  .tlc-ad .ad-x svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;}
  .tlc-adon .tlc-fab{bottom:calc(70px + env(safe-area-inset-bottom));}
  .tlc-adon .tlc-abar{bottom:calc(66px + env(safe-area-inset-bottom));}
  .tlc-adon .tlc-mbar.tlc-mbar-bot{bottom:calc(50px + env(safe-area-inset-bottom));}
  .tlc-adon .tlc-proto{bottom:calc(70px + env(safe-area-inset-bottom));}
  /* MVP scope (Build 42) — only the spec'd v1 comment-thread requirements. The body class hides the
     experimental layers (margin trail, mobile timeline bar, action bar / re-rank, select-to-comment)
     and brings the Comment FAB back on mobile as the plain entry point. */
  .tlc-mvp .tlc-trail,.tlc-mvp .tlc-mbar,.tlc-mvp .tlc-mcard,.tlc-mvp .tlc-abar,.tlc-mvp .tlc-seltip{display:none!important;}
  @media(max-width:1023px){.tlc-mvp .tlc-fab{display:flex!important;}}
  .tlc-proto .tlc-pg-exp.mvpdim{opacity:.4;pointer-events:none;}
  `;
  const st=document.createElement("style"); st.textContent=CSS; document.head.appendChild(st);

  /* ---------------- data ---------------- */
  const ENTRIES=window.__TLC_ENTRIES__||[];
  const COLORS=["#f03c3c","#0f65ef","#0a7d57","#b8590a","#5a2fb0","#16181c","#40444a","#8f959d"];
  const KEY="complex-tlc-live-v4";   // bumped for the flattened reply-to-reply @mention seed (Build 43)
  const CURRENT_USER="you";
  const SEED=[
    {id:"s1",author:"sneakerhead_92",progress:4,text:"the way they open with 'no basketball, no sneaker culture' — facts.",time:"2h",likes:14},
    {id:"s2",author:"hoopdreams",progress:7,text:"finally a list that actually starts in the right era. let's go.",time:"4h",likes:6},
    {id:"s3",author:"mjisgoat",progress:11,text:"Black/Infrared 6s are still the best Jordan colorway ever. fight me.",time:"5h",likes:41,reactors:["airmax_andy","retroqueen","vintagekicks"],replies:[
      {id:"s3r1",author:"airmax_andy",text:"the 6 is so underrated in the Jordan lineup it's criminal",time:"3h",likes:8}]},
    {id:"s4",author:"vintagekicks",progress:13,text:"nostalgia hitting hard scrolling through these early ones",time:"1d",likes:5},
    {id:"me1",author:"you",progress:16,text:"grew up watching these — this list is a time machine. (edit demo)",time:"3h",likes:2,edited:true,ts:Date.now()-3*3600e3},
    {id:"s5",author:"bullsfan4life",progress:19,text:"three-peat shoes back to back, what a run.",time:"8h",likes:22},
    {id:"del1",author:"someguy_deleted",progress:22,deleted:true,time:"1d",likes:3,replies:[
      {id:"del1r1",author:"calm_take",text:"nah I actually agreed with the point they made here.",time:"20h",likes:4}]},
    {id:"s6",author:"flugame97",progress:24,text:"the flu game 12s give me chills every time. iconic.",time:"1d",likes:88,reactors:["jumpman_23","chicago_312","mjisgoat","retroqueen","bullsfan4life"],replies:[
      {id:"s6r1",author:"jumpman_23",text:"and he gave them to a ballboy after. wild.",time:"22h",likes:9},
      {id:"s6r2",author:"chicago_312",text:"still the most emotional sneaker moment in finals history",time:"19h",likes:15},
      {id:"s6r3",author:"flugame97",text:"@chicago_312 facts — nothing else in finals history comes close.",time:"18h",likes:3}]},
    {id:"s7",author:"retroqueen",progress:27,text:"the playoff 12s are on my grail list forever",time:"2d",likes:17},
    {id:"rem1",author:"banned_troll",progress:29,removed:true,time:"1d",likes:0},
    {id:"s8",author:"pippenAintEasy",progress:31,text:"can we talk about how clean these looked on the hardwood floor",time:"1d",likes:11},
    {id:"s9",author:"knicks_til_i_die",progress:38,text:"spree's And1s in '99 were so underrated.",time:"1d",likes:12},
    {id:"s10",author:"and1mixtape",progress:40,text:"And1 era was peak streetball-meets-pro energy man",time:"1d",likes:24,replies:[
      {id:"s10r1",author:"streetballhof",text:"the Tai Chi will always be a classic no debate",time:"20h",likes:6}]},
    {id:"s11",author:"lakeshow_24",progress:46,text:"shaq's size 22s deserved their own paragraph honestly",time:"3d",likes:31},
    {id:"s12",author:"mambaforever",progress:52,text:"2K4 huaraches > half the actual Kobe signatures, no debate",time:"3d",likes:27},
    {id:"s13",author:"vinosince07",progress:55,text:"this is where the list really heats up imo",time:"2d",likes:4},
    {id:"s14",author:"duncanfundamentals",progress:59,text:"spurs reps never get enough love in these lists",time:"4d",likes:18},
    {id:"s15",author:"swishlist",progress:63,text:"the colorways in the 2010s finals were unreal",time:"1d",likes:9},
    {id:"s16",author:"heatcheck",progress:67,text:"LeBron's South Beach run shoes >>> change my mind",time:"2d",likes:35,reactors:["witness_23","splashbros"],replies:[
      {id:"s16r1",author:"witness_23",text:"the P.S. colorways from that era are still heat",time:"1d",likes:12}]},
    {id:"s17",author:"splashbros",progress:72,text:"KD's finals KDs are so slept on it hurts",time:"1d",likes:21},
    {id:"s18",author:"dubnation",progress:75,text:"the warriors dynasty had a different shoe for every gear",time:"22h",likes:8},
    {id:"s19",author:"clevelandstand",progress:80,text:"laceless Soldier 10 during the 3-1 comeback was peak storytelling",time:"4d",likes:19},
    {id:"s20",author:"land216",progress:83,text:"goosebumps every time i think about that comeback",time:"3d",likes:13},
    {id:"s21",author:"kawhiboard",progress:87,text:"the bubble finals shoes were so weird and i kinda loved it",time:"2d",likes:10},
    {id:"s22",author:"raptors_north",progress:90,text:"2019 reps need to be way higher on this list",time:"1d",likes:16},
    {id:"s23",author:"bucksinsix",progress:93,text:"giannis closing it out in those was a moment",time:"1d",likes:14},
    {id:"s24",author:"newyorkforever",progress:97,text:"Brunson PE Kobe 6s need a retail release ASAP 🔥",time:"6h",likes:33,reactors:["kobe_stan","mambaforever"],replies:[
      {id:"s24r1",author:"kobe_stan",text:"the Mamba line living on through Brunson is poetic",time:"3h",likes:7}]},
    {id:"s25",author:"lastdance_fan",progress:99,text:"incredible list. somebody had to say all of this.",time:"5h",likes:20}
  ];
  let comments=load();

  /* ---------------- prototype / condition state ---------------- */
  const TKEY="complex-tlc-trail", USER_KEY="complex-tlc-user", GL_KEY="complex-tlc-guidelines",
        PT_KEY="complex-tlc-pagetype", NR_KEY="complex-tlc-ntf-reply", ND_KEY="complex-tlc-ntf-digest",
        MBAR_KEY="complex-tlc-mbar", MVP_KEY="complex-tlc-mvp", AD_KEY="complex-tlc-ad";
  let trailOn=true;               try{if(localStorage.getItem(TKEY)==="0")trailOn=false;}catch(e){}
  // MVP scope: ON = only the spec'd v1 requirements (thread + composer + card states, reactions,
  // flagging, notification settings); the experimental timeline/action-bar layers are hidden.
  let mvpOn=true;                 try{if(localStorage.getItem(MVP_KEY)==="0")mvpOn=false;}catch(e){}   // default ON (Build 46)
  if(mvpOn)document.body.classList.add("tlc-mvp");
  // simulated sticky bottom anchor ad — page condition, applies in MVP and full mode alike
  let adOn=true;                  try{if(localStorage.getItem(AD_KEY)==="0")adOn=false;}catch(e){}     // default ON (Build 46)
  if(adOn)document.body.classList.add("tlc-adon");
  // mobile timeline bar position: off | top (under the nav) | bottom (docked above the bottom bar —
  // the Page 3 iteration, default). Legacy stored values: "1"→bottom, "0"→off.
  let mbarPos="bottom";
  try{const v=localStorage.getItem(MBAR_KEY);
    if(v==="0"||v==="off")mbarPos="off";else if(v==="top")mbarPos="top";}catch(e){}
  // when embedded in the canvas harness (inside an iframe) the in-page control panel is hidden and
  // conditions are driven from the harness rail via postMessage instead.
  const EMBED=(function(){try{return window.top!==window.self;}catch(e){return true;}})();
  // article-level actions (mobile bottom bar): like + bookmark the article itself
  const AL_KEY="complex-tlc-artlike", AS_KEY="complex-tlc-artsave", ART_LIKE_BASE=248;
  let artLiked=false;  try{if(localStorage.getItem(AL_KEY)==="1")artLiked=true;}catch(e){}
  let artSaved=false;  try{if(localStorage.getItem(AS_KEY)==="1")artSaved=true;}catch(e){}
  // re-rank module (mobile, ranked-list articles): coexistence variant — how the list nav deck
  // (‹ › item nav + Re-Rank) merges with the essentials pill (heart/comment/bookmark).
  // Only applies on the List template; Article template always shows essentials only.
  const RRO_KEY="complex-tlc-rerank-order", RRV_KEY="complex-tlc-rerank-var";
  const RR_VARS=["off","stacked","deck","unified","flank","swap","focus"];
  let rerankVar="focus";
  try{const v=localStorage.getItem(RRV_KEY);if(v&&RR_VARS.indexOf(v)>=0)rerankVar=v;}catch(e){}
  let userState="user";           try{const u=localStorage.getItem(USER_KEY);if(u)userState=u;}catch(e){}   // anon | user | banned
  let guidelinesAccepted=false;   try{if(localStorage.getItem(GL_KEY)==="1")guidelinesAccepted=true;}catch(e){}
  let pageType="article";         try{const p=localStorage.getItem(PT_KEY);if(p)pageType=p;}catch(e){}       // article | list
  let ntfReply=true;              try{if(localStorage.getItem(NR_KEY)==="0")ntfReply=false;}catch(e){}
  let ntfDigest=false;            try{if(localStorage.getItem(ND_KEY)==="1")ntfDigest=true;}catch(e){}
  let cmtState="populated";       // populated | empty | loading  (not persisted — demo control)
  let sortMode="recent";          // recent | popular
  let editingId=null;
  // single-composer reply mode (Mobbin-validated: HYPE/Spotify/NAVER/Instagram — no inline second box;
  // the one pinned composer gets a dismissible "Replying to @name ✕" banner): {pid, author} or null
  let replyCtx=null;

  function load(){try{const r=localStorage.getItem(KEY);if(r){const a=JSON.parse(r);if(Array.isArray(a)&&a.length)return a;}}catch(e){}return SEED.slice();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(comments));}catch(e){}}
  function persist(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function colorFor(n){let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;return COLORS[h%COLORS.length];}
  function initials(n){const c=n.replace(/[^a-zA-Z0-9]/g,"");return (c.slice(0,2)||"?").toUpperCase();}
  function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

  // condition helpers
  function isAnon(){return userState==="anon";}
  function isBanned(){return userState==="banned";}
  function canWrite(){return userState==="user";}                          // signed in & not banned
  function needGuidelines(){return canWrite()&&!guidelinesAccepted;}       // first-time prompt
  function canPost(){return canWrite()&&guidelinesAccepted;}
  function visibleComments(){return cmtState==="empty"?[]:comments;}
  function countLabel(){return cmtState==="loading"?"…":visibleComments().length;}

  // recency ordering (seeds carry a relative "time" string; new posts carry ts)
  const BASE=Date.now();
  function parseAgo(t){if(!t||t==="now")return 0;const m=/(\d+)\s*([mhdw])/.exec(t);if(!m)return 0;const n=+m[1],u=m[2],H=3600e3;
    return u==="m"?n*60e3:u==="h"?n*H:u==="d"?n*24*H:u==="w"?n*7*24*H:0;}
  function tsOf(c){return c.ts!=null?c.ts:BASE-parseAgo(c.time);}
  function sortComments(list){const a=list.slice();
    if(sortMode==="popular")a.sort((x,y)=>(y.likes||0)-(x.likes||0));
    else a.sort((x,y)=>tsOf(y)-tsOf(x));
    return a;}
  function editable(c){return c.author===CURRENT_USER && (Date.now()-tsOf(c))<5*60e3;}   // edit window: 5 min

  /* ---------------- discover the live article DOM ---------------- */
  const article=document.querySelector("article")||document.querySelector("main")||document.body;
  const titleEl=document.querySelector("h1");
  const entryHeads=[...document.querySelectorAll("h2")].filter(h=>/^\s*\d{4}\s*:/.test(h.textContent||""));

  entryHeads.forEach(h=>{
    const yr=(h.textContent.match(/^\s*(\d{4})/)||[])[1];
    const e=ENTRIES.find(x=>x.name.indexOf(yr+":")===0); if(!e) return;
    const card=h.closest("[data-sticky-nav-stop]")||h.closest(".relative")||h.parentElement;
    if(!card || card.querySelector(".tlc-entry-img")) return;
    const img=document.createElement("img");
    img.className="tlc-entry-img"; img.loading="lazy"; img.src=e.img; img.alt=e.name;
    const ph=card.querySelector(".lazyload-placeholder");
    if(ph){ ph.replaceWith(img); return; }
    const wrap=card.querySelector(".lazyload-wrapper");
    if(wrap){ wrap.innerHTML=""; wrap.appendChild(img); return; }
    const slot=card.querySelector('div[class*="lead-image-attribution"]');
    if(slot){ slot.insertBefore(img, slot.firstChild); return; }
    const divider=[...card.querySelectorAll("div")].find(d=>(d.className||"").includes("h-px"));
    if(divider && divider.nextElementSibling){ divider.nextElementSibling.insertBefore(img, divider.nextElementSibling.firstChild); }
  });

  let paras=[...document.querySelectorAll('p[class*="text-[16px]"]')];
  if(!paras.length) paras=[...(article.querySelectorAll?article.querySelectorAll("p"):[])].filter(p=>(p.textContent||"").trim().length>60);
  paras=paras.filter(p=>!/^NBA Championsh/.test((p.textContent||"").trim()));
  paras.forEach((p,i)=>p.setAttribute("data-p",i));

  /* ---------------- coordinate / band helpers (document space) ---------------- */
  const REF=0.40;
  function docTop(el){return el.getBoundingClientRect().top+window.scrollY;}
  function bandTop(){return titleEl?docTop(titleEl):0;}
  function bandBot(){const l=paras[paras.length-1];return l?docTop(l)+l.offsetHeight:document.documentElement.scrollHeight;}
  function bandSpan(){return Math.max(1,bandBot()-bandTop());}
  function curProgress(){const r=window.scrollY+window.innerHeight*REF;return Math.min(100,Math.max(0,((r-bandTop())/bandSpan())*100));}
  function yToProgress(yDoc){return Math.min(100,Math.max(0,((yDoc-bandTop())/bandSpan())*100));}
  function progToY(p){return Math.max(0,bandTop()+(p/100)*bandSpan()-window.innerHeight*REF);}
  function nearestPara(p){const t=bandTop()+(p/100)*bandSpan();let b=null,bd=1e9;for(const el of paras){const c=docTop(el)+el.offsetHeight/2;const d=Math.abs(c-t);if(d<bd){bd=d;b=el;}}return b;}
  function colLeft(){const ref=paras[Math.floor(paras.length/2)]||titleEl;return ref?ref.getBoundingClientRect().left+window.scrollX:40;}
  function trailX(){
    const b=document.querySelector('[data-testid="hamburger-menu-button"]');
    if(b){const r=b.getBoundingClientRect();if(r.width)return r.left+r.width/2+window.scrollX;}
    const g=document.querySelector('[class*="max-w-[1400px]"]');
    if(g){return g.getBoundingClientRect().left+window.scrollX+18;}
    return Math.max(12,colLeft()-30);
  }

  /* ---------------- trail ---------------- */
  document.body.style.position=document.body.style.position||"relative";
  const trail=document.createElement("div");trail.className="tlc-trail";
  const line=document.createElement("div");line.className="tlc-line";
  const fill=document.createElement("div");fill.className="tlc-fill";line.appendChild(fill);trail.appendChild(line);
  document.body.appendChild(trail);

  const THRESH=30;let clusters=[];
  function anchorYdoc(c){const el=nearestPara(c.progress)||titleEl;return el?docTop(el)+el.offsetHeight/2:0;}
  function buildClusters(){
    const src=visibleComments().filter(c=>!c.removed);   // no marker for removed content
    const items=src.map(c=>({c,y:anchorYdoc(c)})).sort((a,b)=>a.y-b.y);const out=[];
    for(const it of items){const last=out[out.length-1];
      if(last&&(it.y-last.y)<THRESH){last.items.push(it.c);last.y=(last.y*(last.items.length-1)+it.y)/last.items.length;}
      else out.push({y:it.y,items:[it.c]});}
    return out;
  }
  const DESK=()=>window.innerWidth>=1024;
  function renderTrail(){
    [...trail.querySelectorAll(".tlc-marker")].forEach(m=>m.remove());
    if(!DESK()||!trailOn||mvpOn||cmtState==="loading"){trail.style.display="none";return;}
    trail.style.display="";
    if(!titleEl||!paras.length)return;
    const x=trailX();
    const top=bandTop(),bot=bandBot();
    line.style.left=x+"px";line.style.top=top+"px";line.style.height=Math.max(0,bot-top)+"px";
    clusters=buildClusters();
    for(const cl of clusters){
      const lead=cl.items[cl.items.length-1];
      const m=document.createElement("div");m.className="tlc-marker";m.style.top=cl.y+"px";m.style.left=x+"px";
      m.innerHTML='<span class="tlc-av" style="background:'+colorFor(lead.author)+'">'+initials(lead.author)+'</span>'+
        (cl.items.length>1?'<span class="tlc-cl">'+cl.items.length+'</span>':'');
      m.addEventListener("click",ev=>{ev.stopPropagation();openSheet(cl.items);});
      m.addEventListener("mouseenter",ev=>showPop(ev,cl.items));
      m.addEventListener("mouseleave",hidePop);
      trail.appendChild(m);
    }
    updateFill();
  }
  function updateFill(){
    if(!DESK()||!trailOn||mvpOn)return;
    if(!titleEl||!paras.length)return;
    const top=bandTop(),bot=bandBot();
    const readY=Math.min(bot,Math.max(top,window.scrollY+window.innerHeight*REF));
    fill.style.height=(readY-top)+"px";
    [...trail.querySelectorAll(".tlc-marker")].forEach((m,i)=>{const cy=clusters[i]?clusters[i].y:parseFloat(m.style.top);m.classList.toggle("tlc-near",Math.abs(cy-readY)<44);});
  }

  /* ---------------- mobile timeline bar (slim scroll-progress line under the sticky nav) ----------------
     Comment DP dots (avatar circles) sit along the bar at each comment's progress%. As the fill front
     reaches a dot it swells +2px to pull focus, then shrinks back as you scroll past. Tapping a dot
     floats a compact comment card in right below it (X to dismiss). Mobile-only (<1024px). */
  const mbar=document.createElement("div");mbar.className="tlc-mbar";
  const mtrack=document.createElement("div");mtrack.className="tlc-mbar-track";
  const mfill=document.createElement("div");mfill.className="tlc-mbar-fill";mtrack.appendChild(mfill);
  mbar.appendChild(mtrack);document.body.appendChild(mbar);
  const mcard=document.createElement("div");mcard.className="tlc-mcard";document.body.appendChild(mcard);
  let mclusters=[];
  function headerBottom(){
    // The live mobile nav is two stacked FIXED rows: the top bar (top:0, ~48px) and the category
    // pills row `.pillbox` (top:48px, ~53px). The `site-header` wrapper collapses to 0 height because
    // its rows are fixed, so we measure the visible bottom-most row instead — the pills' bottom (~101px).
    const pill=document.querySelector(".pillbox");
    if(pill){const r=pill.getBoundingClientRect();if(r.height>4)return Math.max(0,r.bottom);}
    // fallback: bottom-most top-docked fixed/sticky row inside the header
    let b=0;const hd=document.querySelector('[data-testid="site-header"]');
    if(hd)hd.querySelectorAll("*").forEach(el=>{const cs=getComputedStyle(el);
      if(cs.position==="fixed"||cs.position==="sticky"){const r=el.getBoundingClientRect();
        if(r.height>4&&r.top<160&&r.bottom<320&&r.bottom>b)b=r.bottom;}});
    return b||52;}
  function mLead(items){return items.slice().sort((a,b)=>(b.likes||0)-(a.likes||0))[0];}
  function mProg(cl){return cl.items.reduce((s,c)=>s+c.progress,0)/cl.items.length;}
  function buildMClusters(){   // cluster by pixel proximity along the bar width so tiny DPs don't overlap
    const w=window.innerWidth;
    const src=visibleComments().filter(c=>!c.removed).slice().sort((a,b)=>a.progress-b.progress);const out=[];
    for(const c of src){const x=(c.progress/100)*w;const last=out[out.length-1];
      if(last&&(x-last.x)<16){last.items.push(c);last.x=(last.x*(last.items.length-1)+x)/last.items.length;}
      else out.push({x,items:[c]});}
    return out;}
  function placeMbar(){
    if(mbarPos==="bottom"){
      // the bar is the top edge of a white panel that runs to the screen bottom (measured live so any
      // abar variant/height works). +23 = the 3px track itself (flush at the panel's top edge, no
      // chrome above it) plus a clear 20px between the track and the action bar — the Figma gap.
      mbar.classList.add("tlc-mbar-bot");mbar.style.top="auto";
      const at=abar.getBoundingClientRect().top;
      // panel runs down to the screen bottom — or to the top of the anchor ad when that's showing
      const bot=(adOn&&adEl.classList.contains("on"))?adEl.getBoundingClientRect().top:window.innerHeight;
      mbar.style.height=Math.max(24,bot-at+23)+"px";
    }else{mbar.classList.remove("tlc-mbar-bot");mbar.style.height="";mbar.style.top=headerBottom()+"px";}
  }
  function renderMbar(){
    [...mtrack.querySelectorAll(".tlc-mdot")].forEach(d=>d.remove());
    if(DESK()||mvpOn||mbarPos==="off"||cmtState==="loading"){mbar.style.display="none";closeMcard();return;}
    mbar.style.display="block";placeMbar();
    mclusters=buildMClusters();
    for(let i=0;i<mclusters.length;i++){const cl=mclusters[i];const lead=mLead(cl.items);
      const d=document.createElement("div");d.className="tlc-mdot";d.style.left=cl.x+"px";d.dataset.i=i;
      d.innerHTML='<span class="tlc-av" style="--dp:'+colorFor(lead.author)+'">'+initials(lead.author)+'</span>';
      d.addEventListener("click",ev=>{ev.stopPropagation();openMcard(i,d);});
      mtrack.appendChild(d);}
    updateMbar();
  }
  function updateMbar(){
    if(DESK()||mvpOn||mbarPos==="off"||mbar.style.display==="none")return;
    placeMbar();
    const cur=curProgress();mfill.style.width=cur+"%";
    mtrack.querySelectorAll(".tlc-mdot").forEach(d=>{const cl=mclusters[+d.dataset.i];if(!cl)return;
      d.classList.toggle("tlc-mact",Math.abs(cur-mProg(cl))<4);});
  }
  let mcardIdx=-1,mlitEl=null;   // bottom-mode browsing state: current cluster + held paragraph highlight
  function mlit(el){if(mlitEl)mlitEl.classList.remove("tlc-mlit");mlitEl=el||null;if(mlitEl)mlitEl.classList.add("tlc-mlit");}
  function openMcard(i,dotEl){const cl=mclusters[i];if(!cl)return;const c=mLead(cl.items);const extra=cl.items.length-1;
    const bot=mbarPos==="bottom";
    mcard.innerHTML='<div class="mc-arrow"></div>'+
      '<div class="mc-top"><span class="tlc-av" style="background:'+colorFor(c.author)+'">'+initials(c.author)+'</span>'+
      '<div><div class="mc-nm">@'+esc(c.author)+'</div><div class="mc-tm">'+Math.round(c.progress)+'% into article · '+c.time+' ago</div></div>'+
      '<button class="mc-x" aria-label="Close">'+X_SVG+'</button></div>'+
      '<div class="mc-tx">'+esc(c.text)+'</div>'+
      '<div class="mc-foot"><button class="tlc-like" data-id="'+c.id+'">'+HEART+'<span>'+c.likes+'</span></button>'+
      '<button class="tlc-mview">'+(extra>0?("View all "+cl.items.length+" here"):"View in thread")+'</button>'+
      (bot?'<span class="mc-nav"><button data-d="-1" aria-label="Previous comment"'+(i<=0?" disabled":"")+'>'+CHEV_L+'</button>'+
        '<button data-d="1" aria-label="Next comment"'+(i>=mclusters.length-1?" disabled":"")+'>'+CHEV_R+'</button></span>':'')+
      '</div>';
    mcard.classList.add("tlc-show");
    const w=mcard.offsetWidth;
    if(bot){   // browsing card: centered above the bar; the article scrolls behind to the comment's
      // spot and its paragraph holds a light highlight — browse without ever opening the drawer
      mcardIdx=i;
      mcard.classList.add("mc-bot");mcard.style.top="auto";
      mcard.style.bottom=(window.innerHeight-mbar.getBoundingClientRect().top+10)+"px";
      mcard.style.left=Math.max(8,(window.innerWidth-w)/2)+"px";
      window.scrollTo({top:progToY(c.progress),behavior:"smooth"});
      mlit(nearestPara(c.progress));
    }else{
      mcard.classList.remove("mc-bot");mcard.style.bottom="";
      const dr=dotEl.getBoundingClientRect();const dotX=dr.left+dr.width/2;
      const left=Math.max(8,Math.min(window.innerWidth-8-w,dotX-w/2));
      mcard.style.left=left+"px";
      const barTop=parseFloat(mbar.style.top)||headerBottom();mcard.style.top=(barTop+12)+"px";
      const ar=mcard.querySelector(".mc-arrow");if(ar)ar.style.left=Math.max(10,Math.min(w-22,dotX-left-6))+"px";
    }
  }
  function closeMcard(){mcard.classList.remove("tlc-show");mlit(null);mcardIdx=-1;}
  function doLike(lk){const c=findById(lk.dataset.id);if(!c)return;c.reactors=c.reactors||[];
    if(lk.classList.contains("tlc-liked")){c.likes=Math.max(0,c.likes-1);lk.classList.remove("tlc-liked");c.reactors=c.reactors.filter(n=>n!==CURRENT_USER);}
    else{c.likes++;lk.classList.add("tlc-liked");if(!c.reactors.includes(CURRENT_USER))c.reactors.unshift(CURRENT_USER);}
    const sp=lk.querySelector("span");if(sp)sp.textContent=c.likes;save();}
  mcard.addEventListener("click",e=>{
    if(e.target.closest(".mc-x")){closeMcard();return;}
    const nv=e.target.closest(".mc-nav button");
    if(nv){e.stopPropagation();   // openMcard re-renders the card, detaching this button — without this
      // the document outside-click handler no longer sees the click as inside .tlc-mcard and closes it
      const j=mcardIdx+(+nv.dataset.d);if(mclusters[j])openMcard(j);return;}
    const lk=e.target.closest(".tlc-like");if(lk){if(!canWrite()){toast(isBanned()?"Your account is suspended.":"Sign in to react.");return;}doLike(lk);return;}
    if(e.target.closest(".tlc-mview")){closeMcard();openDrawer();return;}
  });

  /* ---------------- popover ---------------- */
  const pop=document.createElement("div");pop.className="tlc-pop";document.body.appendChild(pop);
  function showPop(e,items){if(window.innerWidth<1024)return;const c=items[items.length-1];
    pop.innerHTML='<div class="p">'+Math.round(c.progress)+'% in'+(items.length>1?' · '+items.length+' comments':'')+'</div>'+
      '<div class="h"><span class="tlc-av" style="background:'+colorFor(c.author)+'">'+initials(c.author)+'</span><div><div class="n">@'+esc(c.author)+'</div><div class="tlc-tm">'+c.time+' ago</div></div></div>'+
      '<div class="t">'+esc(c.deleted?"[deleted by author]":c.removed?"[removed by moderator]":c.text)+'</div>';
    pop.style.display="block";const r=e.currentTarget.getBoundingClientRect();
    pop.style.left=Math.min(window.innerWidth-244,r.right+12)+"px";pop.style.top=Math.max(60,Math.min(window.innerHeight-160,r.top-10))+"px";}
  function hidePop(){pop.style.display="none";}

  /* ---------------- section / snippet ---------------- */
  const HEART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  const RIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5z"/></svg>';
  const WARN='<svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
  const FAB_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const CHAT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.4 8.4 0 1 1 21 11.5z"/></svg>';
  const BOOKMARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>';
  const RANK_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14M8 5 5 8M8 5l3 3"/><path d="M16 19V5M16 19l3-3M16 19l-3-3"/></svg>';
  // the exact filled shuffle glyph from the user's Figma mock (Streamline Sharp); stroke="none" +
  // fill="currentColor" on the path so the shared .tlc-abar svg{fill:none;stroke:...} rules don't blank it
  const SHUF='<svg viewBox="0 0 24 21" fill="none"><path fill="currentColor" stroke="none" fill-rule="evenodd" clip-rule="evenodd" d="M17.0858 9V8V5.75H14.625L12.3124 8.8334L10.7499 6.75006L13 3.75L13.375 3.25H14H17.0858V1V0H18.0858H19.0858H19.5L19.7929 0.29289L23.2929 3.7929L24 4.5L23.2929 5.20711L19.7929 8.7071L19.5 9H19.0858H18.0858H17.0858ZM17.0858 20V21H18.0858H19.0858H19.5L19.7929 20.7071L23.2929 17.2071L24 16.5L23.2929 15.7929L19.7929 12.2929L19.5 12H19.0858H18.0858H17.0858V13V15.25H14.625L5.99999 3.75L5.62499 3.25H4.99999H6.338e-07L5.245e-07 5.75H4.37499L13 17.25L13.375 17.75H14H17.0858V20ZM8.24995 14.2501L6.68745 12.1667L4.37499 15.25H1.092e-07L0 17.75H4.99999H5.62499L5.99999 17.25L8.24995 14.2501Z"/></svg>';
  const ARR_UP='<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>';
  const ARR_DN='<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
  const CHEV_L='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg>';
  const CHEV_R='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6"/></svg>';
  const X_SVG='<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  function sectionInfo(c){const el=nearestPara(c.progress);let name="Introduction";
    if(el){const top=docTop(el);let bt=-1;for(const h of entryHeads){const ht=docTop(h);if(ht<=top+4&&ht>bt){bt=ht;name=h.textContent.trim();}}}
    let s=c.quote?c.quote.trim():(el?el.textContent.trim():"");const cap=c.quote?160:90;
    if(s.length>cap)s=s.slice(0,cap).trim()+"…";return{name,snip:s};}

  /* ---------------- comment html ---------------- */
  function avg(items){return items.reduce((s,c)=>s+c.progress,0)/items.length;}
  function findById(id){for(const c of comments){if(c.id===id)return c;if(c.replies)for(const r of c.replies)if(r.id===id)return r;}return null;}
  function reactorsHtml(c){
    if(!(c.likes>0))return "";
    const rs=(c.reactors||[]).slice(0,8);
    const others=Math.max(0,(c.likes||0)-(c.reactors?c.reactors.length:0));
    const avs=rs.map(n=>'<span class="tlc-av xs" style="background:'+colorFor(n)+'">'+initials(n)+'</span>').join("");
    let txt;
    if(rs.length){const names=rs.map(n=>'@'+esc(n)).join(", ");txt=names+(others>0?(" and "+others+" other"+(others>1?"s":"")):"")+" reacted";}
    else txt=c.likes+" "+(c.likes>1?"people":"person")+" reacted";
    return '<div class="tlc-reactors" data-for="'+c.id+'" style="display:none">'+(avs?'<div class="tlc-react-avs">'+avs+'</div>':'')+'<div class="tlc-react-tx">'+txt+'</div></div>';
  }
  function menuHtml(c,isReply){
    if(!canWrite())return "";
    const own=c.author===CURRENT_USER;
    let items="";
    if(own && !isReply && editable(c)) items+='<button class="tlc-editb" data-id="'+c.id+'">Edit</button>';
    if(own && !isReply) items+='<button class="tlc-delete" data-id="'+c.id+'">Delete</button>';
    if(!own) items+=c.reported?'<div class="tlc-menu-note">✓ Reported</div>':'<button class="tlc-report" data-id="'+c.id+'">Report</button>';
    if(!items)return "";
    return '<div class="tlc-menu-wrap"><button class="tlc-more" data-id="'+c.id+'" aria-label="More">⋯</button>'+
      '<div class="tlc-menu" data-for="'+c.id+'" style="display:none">'+items+'</div></div>';
  }
  function phCard(text,replies,reply,pid){
    return '<div class="tlc-cmt tlc-ph'+(reply?' tlc-reply':'')+'"><span class="tlc-av'+(reply?' sm':'')+'" style="background:#c7ccd1">–</span>'+
      '<div class="tlc-main"><div class="tlc-tx tlc-phtx">'+text+'</div>'+
      (replies&&replies.length?'<div class="tlc-replies">'+replies.map(r=>replyHtml(r,pid)).join("")+'</div>':'')+'</div></div>';
  }
  // pid = the top-level parent's id. Replies to a reply stay in this same (single) tier: the Reply
  // button on a reply reopens the parent's box with an "@author " mention prefilled — max one level.
  function replyHtml(r,pid){
    if(r.removed)return phCard("[removed by moderator]",null,true);
    if(r.deleted)return phCard("[deleted by author]",null,true);
    const tx=esc(r.text).replace(/^(@[A-Za-z0-9_.\-]+)/,'<span class="tlc-mention">$1</span>');
    return '<div class="tlc-cmt tlc-reply" data-id="'+r.id+'"><span class="tlc-av sm" style="background:'+colorFor(r.author)+'">'+initials(r.author)+'</span>'+
      '<div class="tlc-main"><div class="tlc-top"><span class="tlc-nm">@'+esc(r.author)+'</span><span class="tlc-tm">'+r.time+' ago</span>'+(r.edited?'<span class="tlc-tm">· edited</span>':'')+'</div><div class="tlc-tx">'+tx+'</div>'+
      '<div class="tlc-acts"><button class="tlc-like'+'" data-id="'+r.id+'">'+HEART+'<span>'+r.likes+'</span></button>'+
      (pid?'<button class="tlc-replyb" data-id="'+pid+'" data-to="'+esc(r.author)+'">'+RIC+'Reply</button>':'')+menuHtml(r,true)+'</div>'+
      (r.reported?'<div class="tlc-reported-note">You reported this reply — our team will review it.</div>':'')+'</div></div>';
  }
  function editCard(c,opts){
    return '<div class="tlc-cmt" data-id="'+c.id+'"><span class="tlc-av" style="background:'+colorFor(c.author)+'">'+initials(c.author)+'</span>'+
      '<div class="tlc-main"><div class="tlc-top"><span class="tlc-nm">@'+esc(c.author)+'</span><span class="tlc-tm">editing…</span></div>'+
      '<textarea class="tlc-ta tlc-edit-ta" data-id="'+c.id+'">'+esc(c.text)+'</textarea>'+
      '<div class="tlc-comp-foot"><span></span><div style="display:flex;gap:8px"><button class="tlc-edit-cancel" data-id="'+c.id+'">Cancel</button><button class="tlc-edit-save" data-id="'+c.id+'">Save</button></div></div>'+
      '</div></div>';
  }
  function cmtHtml(c,opts){opts=opts||{};const replies=c.replies||[];
    if(c.removed) return phCard("[removed by moderator]",replies,false,c.id);
    if(c.deleted) return phCard("[deleted by author]",replies,false,c.id);
    if(editingId===c.id) return editCard(c,opts);
    let tag="";
    if(mvpOn){}   // MVP scope: plain cards — no progress snippet/badge (timeline anchors are beyond v1)
    else if(opts.tag){const s=sectionInfo(c);tag=s.snip?'<div class="tlc-snip" data-p="'+c.progress+'" role="button" tabindex="0" title="Jump to this part of the article">“'+esc(s.snip)+'”</div>':'';}
    else{tag='<span class="tlc-badge" style="margin-bottom:4px;display:inline-block">'+Math.round(c.progress)+'%</span>';}
    return '<div class="tlc-cmt" data-id="'+c.id+'"><span class="tlc-av" style="background:'+colorFor(c.author)+'">'+initials(c.author)+'</span>'+
      '<div class="tlc-main"><div class="tlc-top"><span class="tlc-nm">@'+esc(c.author)+'</span><span class="tlc-tm">'+c.time+' ago</span>'+(c.edited?'<span class="tlc-tm">· edited</span>':'')+'</div>'+
      tag+'<div class="tlc-tx">'+esc(c.text)+'</div>'+
      '<div class="tlc-acts"><button class="tlc-like" data-id="'+c.id+'">'+HEART+'<span>'+c.likes+'</span></button>'+
      ((c.likes>0&&!mvpOn)?'<button class="tlc-reactors-t" data-id="'+c.id+'">Who reacted</button>':'')+   // who-reacted is beyond MVP (Build 47)
      '<button class="tlc-replyb" data-id="'+c.id+'">'+RIC+'Reply'+(replies.length?' · '+replies.length:'')+'</button>'+
      ((opts.tag||mvpOn)?'':'<button class="tlc-jump" data-p="'+c.progress+'">Jump to spot</button>')+
      menuHtml(c,false)+'</div>'+
      (mvpOn?'':reactorsHtml(c))+
      (c.reported?'<div class="tlc-reported-note">You reported this comment — our team will review it.</div>':'')+
      (replies.length?'<div class="tlc-replies">'+replies.map(r=>replyHtml(r,c.id)).join("")+'</div>':'')+
      (opts.tag?'':'<div class="tlc-rbox" data-for="'+c.id+'" style="display:none"><input class="tlc-rinput" placeholder="Reply to @'+esc(c.author)+'…"/><button class="tlc-rsend" data-id="'+c.id+'">Reply</button></div>')+
      '</div></div>';}

  /* ---------------- shared composer (auth gate / banned / guidelines / editor) ---------------- */
  function authGateHtml(){
    return '<div class="tlc-gate"><div class="gt">Join the conversation</div>'+
      '<div class="gs">Sign in to comment, reply, and react on Complex.</div>'+
      '<div class="gb"><button class="tlc-signin">Sign in</button><button class="tlc-signup">Create account</button></div></div>';
  }
  function bannedHtml(){
    return '<div class="tlc-banned">'+WARN+'<div><b>Commenting is disabled on your account.</b><br>Your account has been suspended for violating the Community Guidelines. If you think this is a mistake, contact support.</div></div>';
  }
  function guidelinesHtml(){
    return '<div class="tlc-gl"><div class="gt">Before you post — our house rules</div>'+
      '<ul><li>Be respectful. No harassment, hate speech, or personal attacks.</li>'+
      '<li>Keep it on-topic and add to the conversation.</li>'+
      '<li>No spam, self-promotion, or spoilers without warning.</li></ul>'+
      '<div class="gf">By continuing you agree to our <a href="#" onclick="return false">Community Guidelines</a>.</div>'+
      '<button class="tlc-glok">I agree &amp; continue</button></div>';
  }
  function editorHtml(kind){
    let chip="";
    if(replyCtx){chip='<div class="tlc-dw-quote"><span class="q">Replying to <b>@'+esc(replyCtx.author)+'</b></span><button class="x tlc-rc-x" aria-label="Cancel reply">×</button></div>';}
    else if(kind==="drawer"&&composeQuote){const q=composeQuote.length>180?composeQuote.slice(0,180)+"…":composeQuote;
      chip='<div class="tlc-dw-quote"><span class="q">“'+esc(q)+'”</span><button class="x tlc-dw-qx" aria-label="Remove quote">×</button></div>';}
    const ph=replyCtx?("Reply to @"+replyCtx.author+"…"):(kind==="drawer"&&composeQuote)?"Add your thoughts on this passage…":(pageType==="list"?"Comment on this list…":"Join the discussion…");
    return chip+'<textarea class="tlc-ta" rows="2" placeholder="'+esc(ph)+'"></textarea>'+
      '<div class="tlc-comp-foot"><span class="tlc-counter">0 / 2000</span><button class="tlc-post">'+(replyCtx?"Post reply":"Post comment")+'</button></div>';
  }
  function composerInner(kind){
    if(isAnon())return authGateHtml();
    if(isBanned())return bannedHtml();
    if(needGuidelines())return guidelinesHtml();
    return editorHtml(kind);
  }
  function updateCounter(container){
    const ta=container.querySelector("textarea.tlc-ta");if(!ta)return;
    const cnt=container.querySelector(".tlc-counter"),post=container.querySelector(".tlc-post");
    const len=ta.value.length,over=len>2000;
    if(cnt){cnt.textContent=len+" / 2000";cnt.classList.toggle("over",over);}
    if(post)post.disabled=!ta.value.trim()||over||!canPost();
    ta.style.height="auto";ta.style.height=Math.min(150,ta.scrollHeight)+"px";
  }
  function submitComposer(container,kind){
    const ta=container.querySelector("textarea.tlc-ta");if(!ta)return;
    const t=(ta.value||"").trim();if(!t||t.length>2000||!canPost())return;
    if(replyCtx){   // reply mode: append to the parent thread (one flat tier) instead of posting top-level
      const par=comments.find(c=>c.id===replyCtx.pid);
      if(par)(par.replies=par.replies||[]).push({id:"r"+Date.now(),author:CURRENT_USER,text:t,time:"now",likes:0,ts:Date.now()});
      replyCtx=null;save();toast("Reply posted.");refresh();return;}
    const c={id:"u"+Date.now(),author:CURRENT_USER,progress:0,text:t,time:"now",likes:0,ts:Date.now()};
    if(kind==="drawer"&&composeQuote){c.quote=composeQuote;c.progress=composeQuoteP;}
    comments.push(c);save();
    if(kind==="drawer")composeQuote=null;
    toast("Comment posted.");refresh();
  }
  function wireComposer(container,kind){
    container.addEventListener("input",e=>{if(e.target.classList.contains("tlc-ta"))updateCounter(container);});
    container.addEventListener("click",e=>{
      if(e.target.closest(".tlc-signin")||e.target.closest(".tlc-signup")){setUser("user");toast("Signed in (demo).");return;}
      if(e.target.closest(".tlc-glok")){guidelinesAccepted=true;persist(GL_KEY,"1");syncProto();refresh();toast("Thanks — you can post now.");return;}
      if(e.target.closest(".tlc-rc-x")){   // cancel reply mode; keep whatever was typed
        const ta=container.querySelector("textarea.tlc-ta");const keep=ta?ta.value:"";
        replyCtx=null;rerenderComposer(kind);
        const t2=container.querySelector("textarea.tlc-ta");if(t2){t2.value=keep;updateCounter(container);}return;}
      if(e.target.closest(".tlc-dw-qx")){composeQuote=null;renderDrawerComposer();return;}
      if(e.target.closest(".tlc-post")){submitComposer(container,kind);return;}
    });
  }

  /* ---------------- bottom sheet (marker click, desktop) ---------------- */
  const scrim=document.createElement("div");scrim.className="tlc-scrim";document.body.appendChild(scrim);
  const sheet=document.createElement("div");sheet.className="tlc-sheet";
  sheet.innerHTML='<div class="tlc-grip"></div><div class="tlc-head"><div class="t" id="tlcT">Comments</div><div class="p" id="tlcP"></div></div>'+
    '<div class="tlc-body" id="tlcB"></div>'+
    '<div class="tlc-comp" id="tlcC" style="display:none"><div class="c">Posting at <b id="tlcCP">—</b> of the article</div>'+
    '<div class="r"><textarea id="tlcCT" rows="1" placeholder="Add a comment at this point…"></textarea><button class="s" id="tlcCS" disabled>Post</button></div></div>';
  document.body.appendChild(sheet);
  const shT=sheet.querySelector("#tlcT"),shP=sheet.querySelector("#tlcP"),shB=sheet.querySelector("#tlcB");
  const comp=sheet.querySelector("#tlcC"),cP=sheet.querySelector("#tlcCP"),cT=sheet.querySelector("#tlcCT"),cS=sheet.querySelector("#tlcCS");
  let openItems=null,composeP=0;
  function show(){scrim.classList.add("tlc-show");sheet.classList.add("tlc-show");}
  function close(){scrim.classList.remove("tlc-show");sheet.classList.remove("tlc-show");comp.style.display="none";}
  function openSheet(items){openItems=items;comp.style.display="none";const p=Math.round(avg(items));
    shT.textContent=items.length>1?items.length+" comments":"Comment";shP.textContent=p+"% into article";
    shB.innerHTML=items.slice().sort((a,b)=>b.likes-a.likes).map(c=>cmtHtml(c)).join("");show();}
  function openComposer(p){openItems=null;composeP=p;const pr=Math.round(p);
    shT.textContent="Add a comment";shP.textContent=pr+"% into article";
    const near=comments.filter(c=>Math.abs(c.progress-p)<8&&!c.removed).sort((a,b)=>a.progress-b.progress);
    shB.innerHTML=near.length?('<div style="font:600 12px Inter;color:#6b6b6b;padding:10px 0 4px">Others commented around here</div>'+near.map(c=>cmtHtml(c)).join("")):'<div class="tlc-empty">Be the first to comment at this point.</div>';
    cP.textContent=pr+"%";cT.value="";cS.disabled=true;comp.style.display="block";show();setTimeout(()=>cT.focus(),320);}

  /* ---------------- end-of-page section ---------------- */
  const cend=document.createElement("section");cend.className="tlc-cend";
  const END_MAX=5;
  cend.innerHTML='<div class="tlc-cend-in"><div class="tlc-cend-col">'+
    '<div class="tlc-cend-head"><h2 id="tlcCendH">Comments <span id="tlcCendN"></span></h2><div id="tlcCendSort"></div></div>'+
    '<div id="tlcCendNote"></div>'+
    '<div class="tlc-cend-comp" id="tlcCendComp"></div>'+
    '<div class="tlc-cend-list" id="tlcCendL"></div>'+
    '<button class="tlc-loadmore" id="tlcCendMore" style="display:none">Load more</button></div></div>';
  // Build 45: comments are NOT on the page anymore — you can't scroll to them. The thread lives ONLY
  // in the drawer (desktop side sheet / mobile bottom sheet), opened via FAB / action-bar comment /
  // markers / select-to-comment. The cend element stays DETACHED (never inserted) so the render +
  // composer wiring below keeps working and reverting is a one-line change.
  const cendH=cend.querySelector("#tlcCendH"),cendCount=cend.querySelector("#tlcCendN"),cendSort=cend.querySelector("#tlcCendSort"),
    cendNote=cend.querySelector("#tlcCendNote"),cendComp=cend.querySelector("#tlcCendComp"),cendList=cend.querySelector("#tlcCendL"),cendMore=cend.querySelector("#tlcCendMore");
  function sortControlHtml(){return '<div class="tlc-sort"><span class="lbl">Sort</span>'+
    '<button class="tlc-sortt" aria-label="Sort order: '+(sortMode==="recent"?"most recent":"most popular")+'. Tap to switch." title="Switch sort order">'+
    RANK_ICON+(sortMode==="recent"?"Most recent":"Most popular")+'</button></div>';}
  function skel(n){let s="";for(let i=0;i<n;i++)s+='<div class="tlc-sk"><div class="tlc-sk-av"></div><div class="tlc-sk-main"><div class="tlc-sk-l w40"></div><div class="tlc-sk-l w90"></div><div class="tlc-sk-l w70"></div></div></div>';return s;}
  function emptyStateHtml(){return '<div class="tlc-empty tlc-empty-lg"><div class="ico">💬</div><div class="t">No comments yet</div>'+
    '<div class="s">Be the first to share your thoughts on this '+(pageType==="list"?"list":"story")+'.</div></div>';}
  function renderEndComposer(){cendComp.innerHTML=composerInner("end");updateCounter(cendComp);}
  function renderEnd(){if(!cendList||!cend.parentNode)return;   // detached since Build 45 — drawer-only
    cendH.innerHTML=(pageType==="list"?"Reader comments ":"Comments ")+'<span id="tlcCendN">('+countLabel()+")</span>";
    cendSort.innerHTML=(cmtState==="loading")?"":sortControlHtml();
    cendNote.innerHTML=(pageType==="list")?'<div class="tlc-pt-note">You’re commenting on this list overall — not a single entry. Comments appear on the list page for every reader.</div>':"";
    if(cmtState==="loading"){cendList.innerHTML=skel(4);cendMore.style.display="none";}
    else{const list=sortComments(visibleComments());
      cendList.innerHTML=list.length?list.slice(0,END_MAX).map(c=>cmtHtml(c,{tag:true})).join(""):emptyStateHtml();
      const extra=list.length-END_MAX;cendMore.style.display=extra>0?"block":"none";cendMore.textContent="Load more ("+extra+")";}
    renderEndComposer();}

  /* ---------------- sticky right-side comments drawer ---------------- */
  const drawer=document.createElement("aside");drawer.className="tlc-drawer";
  drawer.innerHTML='<div class="tlc-dw-head"><div class="t" id="tlcDwT">Comments</div><button class="tlc-dw-x" id="tlcDwX" aria-label="Close">'+X_SVG+'</button></div>'+
    '<div class="tlc-dw-tools" id="tlcDwSort"></div>'+
    '<div class="tlc-dw-body" id="tlcDwB"></div>'+
    '<div class="tlc-dw-comp" id="tlcDwComp"></div>';
  document.body.appendChild(drawer);
  const dim=document.createElement("div");dim.className="tlc-dim";document.body.appendChild(dim);
  const dwT=drawer.querySelector("#tlcDwT"),dwSort=drawer.querySelector("#tlcDwSort"),dwB=drawer.querySelector("#tlcDwB"),
    dwX=drawer.querySelector("#tlcDwX"),dwComp=drawer.querySelector("#tlcDwComp");
  let composeQuote=null,composeQuoteP=0;
  function renderDrawerComposer(){dwComp.innerHTML=composerInner("drawer");updateCounter(dwComp);}
  function renderDrawer(){
    dwT.textContent=(pageType==="list"?"List comments (":"Comments (")+countLabel()+")";
    dwSort.innerHTML=(cmtState==="loading")?"":sortControlHtml();
    if(cmtState==="loading"){dwB.innerHTML=skel(5);}
    else{const list=sortComments(visibleComments());dwB.innerHTML=list.length?list.map(c=>cmtHtml(c,{tag:true})).join(""):emptyStateHtml();}
    renderDrawerComposer();}
  function showDrawer(){drawer.classList.add("tlc-show");dim.classList.add("tlc-show");}
  function openDrawer(){composeQuote=null;replyCtx=null;renderDrawer();showDrawer();}
  function openDrawerWithQuote(quote,progress){composeQuoteP=progress;composeQuote=quote;replyCtx=null;renderDrawer();showDrawer();
    const ta=dwComp.querySelector("textarea.tlc-ta");if(ta)setTimeout(()=>ta.focus(),340);}
  function closeDrawer(){drawer.classList.remove("tlc-show");dim.classList.remove("tlc-show");}
  function rerenderComposer(kind){if(kind==="drawer")renderDrawerComposer();else renderEndComposer();}
  // single-composer reply mode: the surface's own pinned composer becomes the reply box — banner chip,
  // reply placeholder, and (for reply-to-reply) the "@name " mention prefilled into the text
  function startReply(pid,author,mention,kind){
    replyCtx={pid:pid,author:author};
    if(kind==="drawer")composeQuote=null;
    rerenderComposer(kind);
    const box=kind==="drawer"?dwComp:cendComp;
    const ta=box.querySelector("textarea.tlc-ta");
    if(kind==="end")box.scrollIntoView({behavior:"smooth",block:"center"});
    if(ta){if(mention&&!ta.value.trim())ta.value="@"+author+" ";updateCounter(box);
      setTimeout(()=>{ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);},kind==="end"?350:0);}
  }

  function updateFab(){const n=visibleComments().length;fab.innerHTML=FAB_ICON+"Comments"+(cmtState!=="loading"&&n?" · "+n:"");
    const ac=document.getElementById("tlcAbCmt");if(ac)ac.textContent=cmtState==="loading"?"":n;}
  function refresh(){renderTrail();renderMbar();renderEnd();if(drawer.classList.contains("tlc-show"))renderDrawer();if(openItems&&sheet.classList.contains("tlc-show"))openSheet(openItems);updateFab();renderAbar();}

  /* ---------------- toast ---------------- */
  const toastEl=document.createElement("div");toastEl.className="tlc-toast";document.body.appendChild(toastEl);
  let toastT;function toast(m){toastEl.textContent=m;toastEl.classList.add("tlc-show");clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove("tlc-show"),2600);}

  /* ---------------- interactions ---------------- */
  function jumpTo(p){
    if(!DESK())closeDrawer();
    window.scrollTo({top:progToY(p),behavior:"smooth"});const el=nearestPara(p);
    if(el){const f=(el.previousElementSibling&&/tlc-entry-img/.test(el.previousElementSibling.className))?el.previousElementSibling:el;f.classList.add("tlc-flash");setTimeout(()=>f.classList.remove("tlc-flash"),1800);}}
  function doReply(box,id){if(!box)return;const inp=box.querySelector(".tlc-rinput");const t=(inp.value||"").trim();if(!t)return;
    const par=comments.find(c=>c.id===id);if(!par)return;(par.replies=par.replies||[]).push({id:"r"+Date.now(),author:CURRENT_USER,text:t,time:"now",likes:0,ts:Date.now()});save();refresh();}
  function closeMenus(root){(root||document).querySelectorAll(".tlc-menu").forEach(m=>m.style.display="none");}
  function onClick(e){const root=e.currentTarget;
    // like / react
    const lk=e.target.closest(".tlc-like");if(lk){if(!canWrite()){toast(isBanned()?"Your account is suspended.":"Sign in to react.");return;}doLike(lk);return;}
    // who-reacted expandable list
    const rt=e.target.closest(".tlc-reactors-t");if(rt){const box=root.querySelector('.tlc-reactors[data-for="'+rt.dataset.id+'"]');if(box)box.style.display=box.style.display==="block"?"none":"block";return;}
    // overflow menu
    const mo=e.target.closest(".tlc-more");if(mo){const menu=mo.parentElement.querySelector(".tlc-menu");const open=menu&&menu.style.display==="block";closeMenus();if(menu&&!open)menu.style.display="block";return;}
    const rep=e.target.closest(".tlc-report");if(rep){const c=findById(rep.dataset.id);if(c){c.reported=true;save();}closeMenus();toast("Report received — our team will review it.");refresh();return;}
    const del=e.target.closest(".tlc-delete");if(del){const c=comments.find(x=>x.id===del.dataset.id);if(c){if(c.replies&&c.replies.length){c.deleted=true;}else{comments=comments.filter(x=>x.id!==c.id);}save();}closeMenus();refresh();return;}
    const eb=e.target.closest(".tlc-editb");if(eb){editingId=eb.dataset.id;closeMenus();refresh();setTimeout(()=>{const ta=root.querySelector('.tlc-edit-ta[data-id="'+editingId+'"]');if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}},0);return;}
    const es=e.target.closest(".tlc-edit-save");if(es){const ta=root.querySelector('.tlc-edit-ta[data-id="'+es.dataset.id+'"]');const c=comments.find(x=>x.id===es.dataset.id);
      if(ta&&c){const v=(ta.value||"").trim();if(v){c.text=v;c.edited=true;}}editingId=null;save();refresh();return;}
    const ec=e.target.closest(".tlc-edit-cancel");if(ec){editingId=null;refresh();return;}
    // reply
    const rb=e.target.closest(".tlc-replyb");if(rb){if(!canWrite()){toast(isBanned()?"Your account is suspended.":"Sign in to reply.");return;}
      const pid=rb.dataset.id,to=rb.dataset.to;   // to = set only on reply-tier buttons (reply-to-reply)
      const box=root.querySelector('.tlc-rbox[data-for="'+pid+'"]');
      if(box){   // sheet: no persistent composer there, keep the inline box (with @mention for reply-to-reply)
        const i=box.querySelector(".tlc-rinput");
        if(to){box.style.display="flex";
          if(i){const m="@"+to+" ";if(!i.value.trim()||/^@[A-Za-z0-9_.\-]+\s*$/.test(i.value))i.value=m;
            i.focus();i.setSelectionRange(i.value.length,i.value.length);}}
        else{const o=box.style.display!=="flex";box.style.display=o?"flex":"none";if(o&&i)i.focus();}
        return;}
      // feed / drawer: ONE composer — put the surface's pinned composer into reply mode
      const par=findById(pid);
      startReply(pid,to||(par?par.author:""),!!to,root===dwB?"drawer":"end");
      return;}
    const rs=e.target.closest(".tlc-rsend");if(rs){if(!canWrite()){toast("Sign in to reply.");return;}doReply(rs.closest(".tlc-rbox"),rs.dataset.id);return;}
    const j=e.target.closest(".tlc-snip,.tlc-jump");if(j){jumpTo(parseFloat(j.dataset.p));}}
  function onKey(e){const i=e.target.closest(".tlc-rinput");if(i&&e.key==="Enter"){e.preventDefault();const b=i.closest(".tlc-rbox");doReply(b,b.dataset.for);return;}
    const sn=e.target.closest(".tlc-snip");if(sn&&(e.key==="Enter"||e.key===" ")){e.preventDefault();jumpTo(parseFloat(sn.dataset.p));}}
  shB.addEventListener("click",onClick);shB.addEventListener("keydown",onKey);
  cendList.addEventListener("click",onClick);cendList.addEventListener("keydown",onKey);
  dwB.addEventListener("click",onClick);dwB.addEventListener("keydown",onKey);
  dwX.addEventListener("click",closeDrawer);
  cendMore.addEventListener("click",openDrawer);
  // sort controls (persistent parents)
  function flipSort(){sortMode=sortMode==="recent"?"popular":"recent";refresh();}
  cend.addEventListener("click",e=>{if(e.target.closest(".tlc-sortt"))flipSort();});
  drawer.addEventListener("click",e=>{if(e.target.closest(".tlc-sortt"))flipSort();});
  // composers
  wireComposer(cendComp,"end");wireComposer(dwComp,"drawer");
  // close any open overflow menu on outside click
  document.addEventListener("click",e=>{if(!e.target.closest(".tlc-menu-wrap"))closeMenus();if(!e.target.closest(".tlc-mcard,.tlc-mdot"))closeMcard();});

  // FAB — persistent entry point; opens the full comments drawer everywhere
  const fab=document.createElement("button");fab.className="tlc-fab";document.body.appendChild(fab);
  fab.addEventListener("click",openDrawer);

  // mobile bottom: essentials (heart/comment/bookmark) on every article. On List articles the re-rank
  // nav deck (‹ › in-page item nav + Re-Rank) coexists with it per the selected variant.
  // NOTE: the Re-Rank button is deliberately INERT here — the re-ranking interaction itself is
  // prototyped in a separate file and is out of scope; only the coexistence layout is under evaluation.
  function artLikeCount(){return ART_LIKE_BASE+(artLiked?1:0);}
  const abar=document.createElement("div");abar.className="tlc-abar";document.body.appendChild(abar);
  function rerankActive(){return rerankVar!=="off"&&pageType==="list";}
  // in-page list navigation: current item = last entry heading above the reading line (nav bottom)
  function curEntryIdx(){const ref=window.scrollY+headerBottom()+14;let i=-1;
    for(let k=0;k<entryHeads.length;k++){if(docTop(entryHeads[k])<=ref)i=k;else break;}return i;}
  function goEntry(i){const h=entryHeads[i];if(!h)return;
    window.scrollTo({top:Math.max(0,docTop(h)-headerBottom()-10),behavior:"smooth"});}
  function navNext(){const i=curEntryIdx();if(i<entryHeads.length-1)goEntry(i+1);}
  function navPrev(){const i=curEntryIdx();if(i<0)return;
    const into=window.scrollY+headerBottom()+14-docTop(entryHeads[i]);
    goEntry(into>140||i===0?i:i-1);}   // track-style: first jump back to the current item's top
  function updateAbarNav(){if(!rerankActive())return;   // NB: don't gate on caps — focus has arrows but no label
    const i=curEntryIdx(),last=i>=entryHeads.length-1;
    const lbl=last?"Last item":"Next · Item #"+(i+2);
    abar.querySelectorAll(".tlc-ab-cap").forEach(el=>{if(el.textContent!==lbl)el.textContent=lbl;});
    abar.querySelectorAll(".tlc-ab-prev").forEach(b=>b.disabled=i<0);
    abar.querySelectorAll(".tlc-ab-next").forEach(b=>b.disabled=last);}
  let swapNav=false,swapT=null,tipT=null;   // "swap" variant: which deck the single slot shows
  let focusSoc=false;   // "focus" variant: false = nav deck expanded (default on lists), true = essentials expanded
  function esBtns(counts){
    const cn=cmtState==="loading"?"":visibleComments().length;
    return '<button class="tlc-ab-like'+(artLiked?" on":"")+'" aria-label="Like article">'+HEART+(counts?'<span class="cnt" id="tlcAbLike">'+artLikeCount()+'</span>':'')+'</button>'+
      '<button class="tlc-ab-cmt" aria-label="Comments">'+CHAT+(counts?'<span class="cnt" id="tlcAbCmt">'+cn+'</span>':'')+'</button>'+
      '<button class="tlc-ab-save'+(artSaved?" on":"")+'" aria-label="Bookmark article">'+BOOKMARK+'</button>';}
  const PREV_B='<button class="tlc-ab-prev" aria-label="Previous item">'+CHEV_L+'</button>',
        NEXT_B='<button class="tlc-ab-next" aria-label="Next item">'+CHEV_R+'</button>',
        RANK_B='<button class="tlc-ab-rank" aria-label="Re-rank this list">Re-Rank</button>',
        TIP='<span class="tlc-ab-tip tlc-ab-cap"></span>';
  function renderAbar(){
    abar.className="tlc-abar";
    if(mvpOn){abar.innerHTML="";return;}   // MVP scope: no action bar — the FAB is the mobile entry point
    if(!rerankActive()){abar.innerHTML=esBtns(true);return;}
    if(rerankVar==="stacked"){abar.classList.add("tlc-abar-stack");
      abar.innerHTML='<div class="tlc-ab-pill">'+esBtns(true)+'</div>'+
        '<div class="tlc-ab-deck"><div class="caprow"><span class="tlc-ab-cap"></span></div><div class="tlc-ab-nav">'+PREV_B+RANK_B+NEXT_B+'</div></div>';}
    else if(rerankVar==="deck"){abar.classList.add("tlc-abar-deck");
      abar.innerHTML='<div class="caprow"><div class="acts">'+esBtns(true)+'</div><span class="tlc-ab-cap"></span></div>'+
        '<div class="tlc-ab-nav">'+PREV_B+RANK_B+NEXT_B+'</div>';}
    else if(rerankVar==="unified"){abar.classList.add("tlc-abar-uni");
      abar.innerHTML=TIP+PREV_B+RANK_B+NEXT_B+'<span class="tlc-ab-div"></span>'+esBtns(false);}
    else if(rerankVar==="flank"){abar.classList.add("tlc-abar-flank");
      abar.innerHTML=TIP+PREV_B+'<div class="tlc-ab-pill"><button class="tlc-ab-rank" aria-label="Re-rank this list">'+RANK_ICON+'Re-Rank</button><span class="tlc-ab-div"></span>'+esBtns(false)+'</div>'+NEXT_B;}
    else if(rerankVar==="swap"){abar.classList.add("tlc-abar-swap");
      if(swapNav){abar.classList.add("tlc-abar-uni");abar.innerHTML=TIP+PREV_B+RANK_B+NEXT_B;}
      else abar.innerHTML=esBtns(true);}
    else if(rerankVar==="focus"){abar.classList.add("tlc-abar-focus");
      // no floating "NEXT · ITEM #N" tip here — per the user, focus stays label-free on scroll/arrows
      abar.innerHTML='<div class="tlc-fdeck'+(focusSoc?" min":"")+'">'+PREV_B+
        '<button class="tlc-ab-rank" aria-label="Re-rank this list">'+SHUF+'<span class="lbl">Re-Rank</span></button>'+NEXT_B+'</div>'+
        '<div class="tlc-fsoc'+(focusSoc?" exp":"")+'" role="button" tabindex="0" aria-label="Like, comment and bookmark">'+
        '<span class="fmini"><span class="fh'+(artLiked?" on":"")+'">'+HEART+'</span><span class="fc">'+CHAT+'</span><span class="fb'+(artSaved?" on":"")+'">'+BOOKMARK+'</span></span>'+
        '<span class="fx">'+esBtns(true)+'</span></div>';}
    updateAbarNav();
  }
  renderAbar();
  // "focus" variant: swap which slot is expanded by toggling classes in place (never re-render mid-swap
  // — the CSS transitions on the existing nodes ARE the animation)
  function applyFocus(){const d=abar.querySelector(".tlc-fdeck"),s=abar.querySelector(".tlc-fsoc");
    if(d)d.classList.toggle("min",focusSoc);if(s)s.classList.toggle("exp",focusSoc);}
  abar.addEventListener("click",e=>{
    const fs=e.target.closest(".tlc-fsoc");
    if(fs&&!fs.classList.contains("exp")){focusSoc=true;applyFocus();return;}   // collapsed bubble → expand essentials
    const fd=e.target.closest(".tlc-fdeck");
    if(fd&&fd.classList.contains("min")){focusSoc=false;applyFocus();return;}   // black shuffle bubble → back to nav deck
    if(e.target.closest(".tlc-ab-rank"))return;   // inert by design — the re-rank flow lives in another prototype
    if(e.target.closest(".tlc-ab-prev")){navPrev();return;}
    if(e.target.closest(".tlc-ab-next")){navNext();return;}
    const lb=e.target.closest(".tlc-ab-like");
    if(lb){artLiked=!artLiked;persist(AL_KEY,artLiked?"1":"0");lb.classList.toggle("on",artLiked);
      const n=abar.querySelector("#tlcAbLike");if(n)n.textContent=artLikeCount();
      const mh=abar.querySelector(".tlc-fsoc .fh");if(mh)mh.classList.toggle("on",artLiked);   // mirror into the collapsed cluster
      toast(artLiked?"You liked this article":"Removed your like");return;}
    if(e.target.closest(".tlc-ab-cmt")){openDrawer();return;}
    const sv=e.target.closest(".tlc-ab-save");
    if(sv){artSaved=!artSaved;persist(AS_KEY,artSaved?"1":"0");sv.classList.toggle("on",artSaved);
      const mb=abar.querySelector(".tlc-fsoc .fb");if(mb)mb.classList.toggle("on",artSaved);   // mirror into the collapsed cluster
      toast(artSaved?"Saved to your list":"Removed from your list");return;}
  });
  // scroll behavior: keep the "NEXT · ITEM #N" label live; surface the floating tip while moving;
  // in the "swap" variant morph the single slot to the nav deck while scrolling, back after ~1.6s idle.
  function morphAbar(){abar.classList.add("tlc-swapping");setTimeout(renderAbar,150);}
  function abarOnScroll(){
    if(!rerankActive())return;
    updateAbarNav();
    if(rerankVar==="unified"||rerankVar==="flank"||(rerankVar==="swap"&&swapNav)){
      abar.classList.add("tlc-tipshow");clearTimeout(tipT);tipT=setTimeout(()=>abar.classList.remove("tlc-tipshow"),1200);}
    if(rerankVar==="swap"){
      if(!swapNav){swapNav=true;morphAbar();}
      clearTimeout(swapT);swapT=setTimeout(()=>{swapNav=false;morphAbar();},1600);}
  }

  // simulated sticky bottom anchor ad (Build 44, from the user's live screenshot): COMPLEX mark ·
  // green 320×50-style creative · dismiss ✕. Pure page condition — the comment UI floats above it
  // via the tlc-adon body offsets; the ✕ dismisses it (same as the real ad's close).
  const adEl=document.createElement("div");adEl.className="tlc-ad"+(adOn?" on":"");
  adEl.setAttribute("aria-label","Advertisement");
  adEl.innerHTML='<span class="ad-mark">COM<br>PLEX</span>'+
    '<div class="ad-cr"><div class="ad-tx"><div class="l1">The #1 National LTL Carrier for Quality*</div>'+
    '<div class="l2">Always Delivers</div>'+
    '<div class="l3">*The Mastio Quality Award is a trademark of Mastio &amp; Company. © 2025 ODFL</div></div>'+
    '<button class="ad-cta">Learn more</button></div>'+
    '<button class="ad-x" aria-label="Close ad">'+X_SVG+'</button>';
  document.body.appendChild(adEl);
  function setAd(v){adOn=!!v;persist(AD_KEY,adOn?"1":"0");
    adEl.classList.toggle("on",adOn);document.body.classList.toggle("tlc-adon",adOn);
    syncProto();renderMbar();}
  adEl.addEventListener("click",e=>{
    if(e.target.closest(".ad-x")){setAd(false);toast("Ad dismissed.");return;}
    if(e.target.closest(".ad-cta")){toast("Ad click (simulated).");return;}
  });

  // re-rank bottom sheet (reader builds their own ranking of the article's list items)
  const RR_FALLBACK=[{name:"Air Jordan 12 “Flu Game”"},{name:"Air Jordan 6 “Infrared”"},{name:"Kobe 6 “Grinch”"},
    {name:"LeBron 8 “South Beach”"},{name:"KD 4 “Weatherman”"},{name:"Nike Kyrie 3"},{name:"Air Jordan 11 “Space Jam”"},{name:"Kobe 5 “Lakers”"}];
  let rerankItems=(ENTRIES&&ENTRIES.length>=6)?ENTRIES.slice(0,8).map(e=>({name:e.name,img:e.img})):RR_FALLBACK.slice();
  const rerankDefault=rerankItems.map(x=>x.name);
  try{const saved=JSON.parse(localStorage.getItem(RRO_KEY)||"null");
    if(Array.isArray(saved)&&saved.length)rerankItems.sort((a,b)=>{const ia=saved.indexOf(a.name),ib=saved.indexOf(b.name);return (ia<0?99:ia)-(ib<0?99:ib);});}catch(e){}
  let rerankDone=false;
  function cleanName(n){return n.replace(/^\s*\d{4}\s*:\s*/,"");}   // strip "1991: " year prefix from entry headings
  const rr=document.createElement("div");rr.className="tlc-rr";
  rr.innerHTML='<div class="tlc-rr-bg"></div><div class="tlc-rr-sheet"><div class="tlc-grip"></div>'+
    '<div class="tlc-rr-head"><div><div class="t">Re-Rank the list</div><div class="s">Use the arrows to build your own ranking, then submit.</div></div>'+
    '<button class="tlc-rr-x" aria-label="Close">'+X_SVG+'</button></div>'+
    '<div class="tlc-rr-list" id="tlcRrList"></div>'+
    '<div class="tlc-rr-foot"><button class="tlc-rr-submit">Submit my ranking</button></div></div>';
  document.body.appendChild(rr);
  const rrList=rr.querySelector("#tlcRrList"),rrFoot=rr.querySelector(".tlc-rr-foot");
  function renderRr(){
    if(rerankDone){
      rrFoot.style.display="none";
      rrList.innerHTML='<div class="tlc-rr-done"><div class="em">🏆</div><div class="t">Ranking submitted</div>'+
        '<div class="s">Your #1: <b>'+esc(cleanName(rerankItems[0].name))+'</b>. Thanks for voting — check back to see how it stacks up against the crowd.</div>'+
        '<button class="tlc-rr-again">Edit my ranking</button></div>';
      return;}
    rrFoot.style.display="";
    rrList.innerHTML=rerankItems.map((it,i)=>'<div class="tlc-rr-row"><span class="tlc-rr-rank">'+(i+1)+'</span>'+
      (it.img?'<img class="tlc-rr-thumb" src="'+it.img+'" alt="">':'<span class="tlc-rr-thumb"></span>')+
      '<span class="tlc-rr-nm">'+esc(cleanName(it.name))+'</span>'+
      '<span class="tlc-rr-ctrls"><button class="tlc-rr-up" data-i="'+i+'" aria-label="Move up"'+(i===0?" disabled":"")+'>'+ARR_UP+'</button>'+
      '<button class="tlc-rr-down" data-i="'+i+'" aria-label="Move down"'+(i===rerankItems.length-1?" disabled":"")+'>'+ARR_DN+'</button></span></div>').join("");
  }
  function openRerank(){rerankDone=false;renderRr();rr.classList.add("tlc-show");}
  function closeRerank(){rr.classList.remove("tlc-show");}
  rr.addEventListener("click",e=>{
    if(e.target.closest(".tlc-rr-x")||e.target.closest(".tlc-rr-bg")){closeRerank();return;}
    if(e.target.closest(".tlc-rr-again")){rerankDone=false;renderRr();return;}
    const up=e.target.closest(".tlc-rr-up");if(up){const i=+up.dataset.i;if(i>0){const t=rerankItems[i-1];rerankItems[i-1]=rerankItems[i];rerankItems[i]=t;renderRr();}return;}
    const dn=e.target.closest(".tlc-rr-down");if(dn){const i=+dn.dataset.i;if(i<rerankItems.length-1){const t=rerankItems[i+1];rerankItems[i+1]=rerankItems[i];rerankItems[i]=t;renderRr();}return;}
    if(e.target.closest(".tlc-rr-submit")){rerankDone=true;try{localStorage.setItem(RRO_KEY,JSON.stringify(rerankItems.map(x=>x.name)));}catch(_){}renderRr();toast("Ranking submitted — thanks!");return;}
  });

  /* ---------------- prototype control panel ---------------- */
  const proto=document.createElement("div");proto.className="tlc-proto";
  proto.innerHTML='<button class="tlc-proto-tog" id="tlcProtoTog"><i></i>Prototype</button>'+
    '<div class="tlc-proto-body">'+
      '<div class="tlc-pg"><div class="tlc-prow"><span class="lbl">MVP</span>'+
        '<button class="tlc-switch" id="tlcSwMVP" role="switch" aria-label="MVP scope"><span class="knob"></span></button></div>'+
        '<div class="tlc-pnote">Only the v1 spec: comments drawer (desktop side sheet / mobile bottom sheet) with empty, loading and sort states, composer states, card states, reactions, flagging, notification settings. Hides the timeline / action-bar experiments (their controls below are ignored).</div></div>'+
      '<div class="tlc-pg"><span class="cap">Viewer</span><div class="tlc-seg" data-g="user">'+
        '<button data-v="anon">Guest</button><button data-v="user">Signed in</button><button data-v="banned">Banned</button></div></div>'+
      '<div class="tlc-pg"><div class="tlc-prow"><span class="lbl">First-time user</span>'+
        '<button class="tlc-switch" id="tlcSwGL" role="switch" aria-label="First-time community guidelines"><span class="knob"></span></button></div>'+
        '<div class="tlc-pnote">Shows the community-guidelines prompt before the first post.</div></div>'+
      '<div class="tlc-pg"><span class="cap">Comments</span><div class="tlc-seg" data-g="cmt">'+
        '<button data-v="populated">Populated</button><button data-v="empty">Empty</button><button data-v="loading">Loading</button></div></div>'+
      '<div class="tlc-pg"><span class="cap">Template</span><div class="tlc-seg" data-g="page">'+
        '<button data-v="article">Article</button><button data-v="list">List</button></div></div>'+
      '<div class="tlc-pg"><div class="tlc-prow"><span class="lbl">Bottom anchor ad</span>'+
        '<button class="tlc-switch" id="tlcSwAD" role="switch" aria-label="Bottom anchor ad"><span class="knob"></span></button></div>'+
        '<div class="tlc-pnote">Simulates the sticky ad pinned to the screen bottom on the live site — the floating comment UI lifts above it. Applies in MVP too.</div></div>'+
      '<div class="tlc-pg tlc-pg-timeline tlc-pg-exp"><div class="tlc-prow"><span class="lbl">Margin timeline</span>'+
        '<button class="tlc-switch" id="tlcSwTL" role="switch" aria-label="Toggle timeline"><span class="knob"></span></button></div>'+
        '<div class="tlc-pnote">Desktop-only reading-progress trail (left margin).</div></div>'+
      '<div class="tlc-pg tlc-pg-exp"><span class="cap">Timeline bar (mobile)</span>'+
        '<div class="tlc-seg" data-g="mbar"><button data-v="off">Off</button><button data-v="top">Top</button><button data-v="bottom">Bottom</button></div>'+
        '<div class="tlc-pnote">Slim scroll-progress bar with comment DP dots (tap a dot) — under the nav (Top) or docked above the bottom bar with cards opening upward (Bottom, the Page 3 iteration).</div></div>'+
      '<div class="tlc-pg tlc-pg-exp"><span class="cap">Re-rank ⨯ essentials (mobile)</span>'+
        '<select class="tlc-sel" id="tlcSelRR"><option value="off">Essentials only</option><option value="stacked">Both, stacked (today)</option>'+
        '<option value="deck">One card, two rows</option><option value="unified">One pill, single row</option>'+
        '<option value="flank">Edge arrows + pill</option><option value="swap">Auto-swap on scroll</option>'+
        '<option value="focus">Deck + bubble (tap to swap)</option></select>'+
        '<div class="tlc-pnote">How the list nav (‹ › + Re-Rank) merges with like/comment/save. List template only — picking a layout switches Template to List. Re-Rank itself is inert here.</div></div>'+
      '<div class="tlc-pg"><button class="tlc-pbtn" id="tlcNsOpen">Notification settings</button>'+
        '<button class="tlc-pbtn" id="tlcReset">Reset demo data</button></div>'+
    '</div>';
  document.body.appendChild(proto);
  if(EMBED)proto.style.display="none";   // controls live in the canvas harness rail instead
  const protoBody=proto.querySelector(".tlc-proto-body");
  if(DESK())proto.classList.add("tlc-open");
  proto.querySelector("#tlcProtoTog").addEventListener("click",()=>proto.classList.toggle("tlc-open"));
  function setUser(v){userState=v;persist(USER_KEY,v);syncProto();refresh();}
  function syncProto(){
    protoBody.querySelectorAll('.tlc-seg[data-g="user"] button').forEach(b=>b.classList.toggle("active",b.dataset.v===userState));
    protoBody.querySelectorAll('.tlc-seg[data-g="cmt"] button').forEach(b=>b.classList.toggle("active",b.dataset.v===cmtState));
    protoBody.querySelectorAll('.tlc-seg[data-g="page"] button').forEach(b=>b.classList.toggle("active",b.dataset.v===pageType));
    const gl=protoBody.querySelector("#tlcSwGL");if(gl)gl.setAttribute("aria-checked",(!guidelinesAccepted)?"true":"false");
    const tl=protoBody.querySelector("#tlcSwTL");if(tl)tl.setAttribute("aria-checked",trailOn?"true":"false");
    protoBody.querySelectorAll('.tlc-seg[data-g="mbar"] button').forEach(b=>b.classList.toggle("active",b.dataset.v===mbarPos));
    const rrs=protoBody.querySelector("#tlcSelRR");if(rrs)rrs.value=rerankVar;
    const mv=protoBody.querySelector("#tlcSwMVP");if(mv)mv.setAttribute("aria-checked",mvpOn?"true":"false");
    const aw=protoBody.querySelector("#tlcSwAD");if(aw)aw.setAttribute("aria-checked",adOn?"true":"false");
    protoBody.querySelectorAll(".tlc-pg-exp").forEach(g=>g.classList.toggle("mvpdim",mvpOn));
  }
  function setMvp(v){mvpOn=!!v;persist(MVP_KEY,mvpOn?"1":"0");document.body.classList.toggle("tlc-mvp",mvpOn);
    hideSel();closeMcard();syncProto();refresh();}
  protoBody.addEventListener("click",e=>{
    const seg=e.target.closest(".tlc-seg button");
    if(seg){const g=seg.parentElement.dataset.g,v=seg.dataset.v;
      if(g==="user")setUser(v);
      else if(g==="cmt"){cmtState=v;editingId=null;syncProto();refresh();}
      else if(g==="page"){pageType=v;persist(PT_KEY,v);syncProto();refresh();}
      else if(g==="mbar"){mbarPos=v;persist(MBAR_KEY,v);syncProto();renderMbar();}
      return;}
    if(e.target.closest("#tlcSwGL")){guidelinesAccepted=!guidelinesAccepted;persist(GL_KEY,guidelinesAccepted?"1":"0");syncProto();refresh();return;}
    if(e.target.closest("#tlcSwTL")){trailOn=!trailOn;persist(TKEY,trailOn?"1":"0");syncProto();renderTrail();return;}
    if(e.target.closest("#tlcSwMVP")){setMvp(!mvpOn);return;}
    if(e.target.closest("#tlcSwAD")){setAd(!adOn);return;}
    if(e.target.closest("#tlcNsOpen")){openNs();return;}
    if(e.target.closest("#tlcReset")){comments=SEED.slice();try{localStorage.removeItem(KEY);}catch(_){}guidelinesAccepted=false;persist(GL_KEY,"0");
      cmtState="populated";editingId=null;sortMode="recent";replyCtx=null;
      try{localStorage.removeItem(RRO_KEY);}catch(_){}rerankItems.sort((a,b)=>rerankDefault.indexOf(a.name)-rerankDefault.indexOf(b.name));rerankDone=false;
      syncProto();refresh();toast("Demo data reset.");return;}
  });
  protoBody.addEventListener("change",e=>{
    if(e.target.closest("#tlcSelRR")){rerankVar=e.target.value;persist(RRV_KEY,rerankVar);
      if(rerankVar!=="off"&&pageType!=="list"){pageType="list";persist(PT_KEY,"list");}   // variants only exist on lists
      syncProto();refresh();}
  });
  syncProto();

  /* ---------------- notification settings modal (profile) ---------------- */
  const nsScrim=document.createElement("div");nsScrim.className="tlc-ns-scrim";document.body.appendChild(nsScrim);
  const ns=document.createElement("div");ns.className="tlc-ns";
  ns.innerHTML='<div class="tlc-ns-head"><div class="t">Settings</div><button class="tlc-dw-x" id="tlcNsX" aria-label="Close">'+X_SVG+'</button></div>'+
    '<div class="tlc-ns-sub">Notifications</div>'+
    '<div class="tlc-ns-row"><div><div class="nm">Email me on comment replies</div><div class="ds">Get an email whenever someone replies to one of your comments.</div></div>'+
      '<button class="tlc-switch" id="tlcNsReply" role="switch" aria-label="Email on reply"><span class="knob"></span></button></div>'+
    '<div class="tlc-ns-row"><div><div class="nm">Weekly activity digest</div><div class="ds">A weekly summary of activity on threads you follow.</div></div>'+
      '<button class="tlc-switch" id="tlcNsDigest" role="switch" aria-label="Weekly digest"><span class="knob"></span></button></div>';
  document.body.appendChild(ns);
  const nsReply=ns.querySelector("#tlcNsReply"),nsDigest=ns.querySelector("#tlcNsDigest");
  function syncNs(){nsReply.setAttribute("aria-checked",ntfReply?"true":"false");nsDigest.setAttribute("aria-checked",ntfDigest?"true":"false");}
  function openNs(){syncNs();nsScrim.classList.add("tlc-show");ns.classList.add("tlc-show");}
  function closeNs(){nsScrim.classList.remove("tlc-show");ns.classList.remove("tlc-show");}
  nsScrim.addEventListener("click",closeNs);
  ns.querySelector("#tlcNsX").addEventListener("click",closeNs);
  nsReply.addEventListener("click",()=>{ntfReply=!ntfReply;persist(NR_KEY,ntfReply?"1":"0");syncNs();});
  nsDigest.addEventListener("click",()=>{ntfDigest=!ntfDigest;persist(ND_KEY,ntfDigest?"1":"0");syncNs();});
  syncNs();

  /* ---------------- sheet composer + global handlers ---------------- */
  scrim.addEventListener("click",close);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){close();closeDrawer();closeNs();closeMenus();closeMcard();closeRerank();}});
  cT.addEventListener("input",()=>{cS.disabled=!cT.value.trim();cT.style.height="auto";cT.style.height=Math.min(120,cT.scrollHeight)+"px";});
  cS.addEventListener("click",()=>{if(!canPost()){toast(isAnon()?"Sign in to comment.":isBanned()?"Your account is suspended.":"Please accept the guidelines first.");return;}
    const t=cT.value.trim();if(!t)return;const c={id:"u"+Date.now(),author:CURRENT_USER,progress:composeP,text:t,time:"now",likes:0,ts:Date.now()};comments.push(c);save();renderTrail();renderEnd();openSheet([c]);});

  /* ---------------- Medium-style text selection → Comment ---------------- */
  const seltip=document.createElement("div");seltip.className="tlc-seltip";
  seltip.innerHTML='<button id="tlcSelC"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Comment</button>';
  document.body.appendChild(seltip);
  let selData=null;
  function hideSel(){seltip.classList.remove("tlc-show");}
  function selectionText(){
    const sel=window.getSelection();
    if(!sel||sel.isCollapsed||!sel.rangeCount)return null;
    const txt=(sel.toString()||"").replace(/\s+/g," ").trim();
    if(txt.length<2)return null;
    let node=sel.getRangeAt(0).commonAncestorContainer;
    if(node.nodeType===3)node=node.parentElement;
    if(!node)return null;
    if(node.closest(".tlc-drawer,.tlc-sheet,.tlc-cend,.tlc-pop,.tlc-seltip,.tlc-proto,.tlc-ns,nav,header,footer,textarea,input,button"))return null;
    if(!article.contains(node))return null;
    return txt;
  }
  function showSel(){
    if(mvpOn){hideSel();return;}   // select-to-comment is beyond the MVP scope
    const txt=selectionText();
    if(!txt){hideSel();return;}
    const rect=window.getSelection().getRangeAt(0).getBoundingClientRect();
    if(!rect||(!rect.width&&!rect.height)){hideSel();return;}
    selData={quote:txt,progress:yToProgress(rect.top+window.scrollY)};
    seltip.style.left=Math.max(60,Math.min(window.innerWidth-60,rect.left+rect.width/2))+"px";
    seltip.style.top=Math.max(44,rect.top-10)+"px";
    seltip.classList.add("tlc-show");
  }
  document.addEventListener("mouseup",e=>{if(e.target.closest&&e.target.closest(".tlc-seltip"))return;setTimeout(showSel,0);});
  document.addEventListener("touchend",e=>{if(e.target.closest&&e.target.closest(".tlc-seltip"))return;setTimeout(showSel,0);});
  document.addEventListener("selectionchange",()=>{const s=window.getSelection();if(!s||s.isCollapsed)hideSel();});
  window.addEventListener("scroll",hideSel,{passive:true});
  const selBtn=seltip.querySelector("#tlcSelC");
  selBtn.addEventListener("mousedown",e=>e.preventDefault());
  selBtn.addEventListener("click",()=>{if(!selData)return;const d=selData;hideSel();openDrawerWithQuote(d.quote,d.progress);});

  /* ---------------- canvas harness bridge (postMessage) ---------------- */
  if(EMBED){
    window.addEventListener("message",e=>{const d=e.data;if(!d||d.__tlc!==1)return;
      if(d.type==="user")setUser(d.value);
      else if(d.type==="cmt"){cmtState=d.value;editingId=null;syncProto();refresh();}
      else if(d.type==="page"){pageType=d.value;persist(PT_KEY,d.value);syncProto();refresh();}
      else if(d.type==="gl"){guidelinesAccepted=!!d.value;persist(GL_KEY,guidelinesAccepted?"1":"0");syncProto();refresh();}
      else if(d.type==="trail"){trailOn=!!d.value;persist(TKEY,trailOn?"1":"0");syncProto();renderTrail();}
      else if(d.type==="mbar"){const v=d.value;   // accepts "off"/"top"/"bottom" (legacy booleans: true→bottom)
        mbarPos=(v==="top"||v==="bottom"||v==="off")?v:(v?"bottom":"off");persist(MBAR_KEY,mbarPos);syncProto();renderMbar();}
      else if(d.type==="mvp")setMvp(!!d.value);
      else if(d.type==="ad")setAd(!!d.value);
      else if(d.type==="rerank"){rerankVar=RR_VARS.indexOf(d.value)>=0?d.value:"off";persist(RRV_KEY,rerankVar);
        if(rerankVar!=="off"&&pageType!=="list"){pageType="list";persist(PT_KEY,"list");}
        syncProto();refresh();}
      else if(d.type==="ns")openNs();
      else if(d.type==="reset"){comments=SEED.slice();try{localStorage.removeItem(KEY);}catch(_){}
        guidelinesAccepted=false;persist(GL_KEY,"0");cmtState="populated";editingId=null;sortMode="recent";replyCtx=null;syncProto();refresh();}
    });
    try{parent.postMessage({__tlc:1,type:"ready"},"*");}catch(_){}
  }

  /* ---------------- loop + init ---------------- */
  let tick=false;
  window.addEventListener("scroll",()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{updateFill();updateMbar();abarOnScroll();tick=false;});},{passive:true});
  window.addEventListener("resize",()=>{renderTrail();renderMbar();closeMcard();});
  window.addEventListener("load",()=>{renderTrail();renderMbar();renderEnd();updateFab();});
  if(window.ResizeObserver)new ResizeObserver(()=>renderTrail()).observe(article);
  renderTrail();renderMbar();renderEnd();updateFab();
})();
