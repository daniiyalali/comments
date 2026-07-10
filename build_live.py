#!/usr/bin/env python3
# Builds live-prototype.html: the REAL live complex.com page (scripts stripped, real CSS inlined)
# with the timeline-comments module injected onto the real article DOM.
import re, json

live = open('live.html', encoding='utf-8', errors='ignore').read()
allcss = open('all.css', encoding='utf-8', errors='ignore').read()
entries = json.load(open('entries.json'))
inject = open('live-inject.js', encoding='utf-8').read()

# 1) strip Next.js scripts → static page (no hydration that would fight our injected DOM)
live = re.sub(r'<script\b[^>]*>.*?</script>', '', live, flags=re.S | re.I)
live = re.sub(r'<script\b[^>]*/>', '', live, flags=re.I)

# 2) load Inter (the live design's font) + inline the real stylesheets so it renders standalone
head_add = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">'
            '<style id="tlc-livecss">\n' + allcss + '\n</style>\n')
live = live.replace('</head>', head_add + '</head>', 1)

# 3) inject entry-image data + the module before </body>
ej = json.dumps(entries).replace('</', '<\\/')
blob = ('<script>window.__TLC_ENTRIES__=' + ej + ';</script>\n'
        '<script>\n' + inject.replace('</script>', '<\\/script>') + '\n</script>\n')
live = live.replace('</body>', blob + '</body>', 1)

open('index.html', 'w', encoding='utf-8').write(live)
print('built index.html', len(live), 'bytes |', len(entries), 'entry images available')
