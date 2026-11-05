# -*- coding: utf-8 -*-
"""French for strings that are combinations of things already translated (labels with counts, image names, crumbs).
Reads tools/fr-missing.json from the last build and adds what it can work out to tools/fr/oa_generated.json.

    python tools/oa/build.py && python tools/oa/fr_gen.py && python tools/oa/build.py
"""
import html, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import i18n
T = i18n.Tr()
path = os.path.join(ROOT, 'tools', 'fr', 'oa_generated.json')
out = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
miss = json.load(open(os.path.join(ROOT, 'tools', 'fr-missing.json'), encoding='utf-8'))


def tr(s):
    return T._one(i18n.norm(html.unescape(s)))


def rule(k):
    m = re.match(r'^View (.+) image (\d+), larger$', k)
    if m:
        return f"Agrandir l'image {m.group(2)} de {m.group(1)}"
    m = re.match(r'^(.+) · Concept$', k)
    if m:
        return k
    m = re.match(r'^<small>(\d+)</small>(.+)$', k)
    if m and tr(m.group(2)):
        return f'<small>{m.group(1)}</small>{tr(m.group(2))}'
    m = re.match(r'^(.+?) <small>(\d+)</small>$', k)
    if m:
        v = {'All': 'Tout', 'Concepts': 'Concepts'}.get(m.group(1)) or tr(m.group(1))
        if v:
            return f'{v} <small>{m.group(2)}</small>'
    m = re.match(r'^(.+?) · (\d{4})( · <span class="tag-t">Concept</span>)?$', k)
    if m and tr(m.group(1)):
        return f'{tr(m.group(1))} · {m.group(2)}{m.group(3) or ""}'
    m = re.match(r'^<a href="([^"]+)">(Insights|Work|Capabilities)</a> / (.+?)( <span class="tag tag--concept">Concept</span>)?$', k)
    if m and tr(m.group(3)):
        return f'<a href="{m.group(1)}">{tr(m.group(2))}</a> / {tr(m.group(3))}{m.group(4) or ""}'
    m = re.match(r'^<span class="meta">See</span> (.+)$', k)
    if m:
        return f'<span class="meta">Voir</span> {m.group(1)}'
    m = re.match(r'^([^:<]+): (.+)$', k)
    if m and tr(m.group(2)):
        return f'{m.group(1)} : {tr(m.group(2))}'
    return None


left = []
for k in miss:
    v = rule(k)
    if v:
        out[k] = v
    else:
        left.append(k)
json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('generated', len(out), '| still missing', len(left))
for x in left:
    print(' ', x[:200])
