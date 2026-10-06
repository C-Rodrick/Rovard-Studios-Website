"""French copy of every page: fr/<same path>/index.html, made from the English pages + the dictionary in tools/fr/*.json.

How it works
- The English build is parsed into a small tree. Any element that has its own text (and only inline tags inside) is one "unit";
  its inner HTML (tags kept, text unescaped) is the dictionary key. Attributes alt / aria-label / placeholder / title / meta content
  and the hero rotator JSON are looked up too.
- Anything without a French entry stays English and is listed in tools/fr-missing.json so nothing is silently skipped.
- Asset URLs get one more "../" because the French pages sit one folder deeper.
"""
import glob, html, json, os, re
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {'meta', 'link', 'img', 'br', 'input', 'hr', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'track'}
INLINE = {'span', 'b', 'i', 'em', 'strong', 'a', 'br', 'small', 'abbr', 'sup', 'sub', 'mark', 'u', 'wbr'}
RAW = {'script', 'style'}
ASSET_ROOTS = ('css/', 'js/', 'img/', 'video/', 'assets/', 'favicon.ico', 'mason-rowe/', 'afaa-pay/', 'northstar-capital/', 'vita-house/', 'flyer/', 'motion-video/', 'robots.txt', 'sitemap.xml')
TRANSLATE_ATTRS = {'alt', 'aria-label', 'placeholder', 'title'}


class Node:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.kids, self.raw = tag, attrs, [], None


class Text:
    def __init__(self, s):
        self.s = s


class Raw:
    def __init__(self, s):
        self.s = s


class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', [])
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].kids.append(n)
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].kids.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        top = self.stack[-1]
        top.kids.append(Raw(data) if top.tag in RAW else Text(data))

    def handle_decl(self, decl):
        self.stack[-1].kids.append(Raw(f'<!{decl}>'))

    def handle_comment(self, data):
        self.stack[-1].kids.append(Raw(f'<!--{data}-->'))


def parse(s):
    p = Parser(); p.feed(s); p.close(); return p.root


def esc_t(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def esc_a(s):
    return s.replace('&', '&amp;').replace('"', '&quot;')


def ser_open(n):
    a = ''.join(f' {k}' if v is None else f' {k}="{esc_a(v)}"' for k, v in n.attrs)
    return f'<{n.tag}{a}>'


def ser(n):
    if isinstance(n, Text):
        return esc_t(n.s)
    if isinstance(n, Raw):
        return n.s
    if n.tag == '#root':
        return ''.join(ser(k) for k in n.kids)
    if n.tag in VOID:
        return ser_open(n)
    return ser_open(n) + ''.join(ser(k) for k in n.kids) + f'</{n.tag}>'


def inner(n):
    return ''.join(ser(k) for k in n.kids)


def inline_only(n):
    for k in n.kids:
        if isinstance(k, Node):
            if k.tag not in INLINE or not inline_only(k):
                return False
    return True


def has_letters(s):
    return re.search(r'[A-Za-zÀ-ÿ]{2,}', re.sub(r'<[^>]+>', '', s)) is not None


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


class Tr:
    def __init__(self):
        self.d = {}
        for f in sorted(glob.glob(os.path.join(ROOT, 'tools', 'fr', '*.json'))):
            self.d.update(json.load(open(f, encoding='utf-8')))
        self.nd = {norm(html.unescape(k)): v for k, v in self.d.items()}
        self.missing = {}

    def _one(self, k):
        v = self.nd.get(k)
        if v is None and k.endswith('.'):
            w = self.nd.get(k[:-1])
            v = w + '.' if w is not None else None
        if v is None and not k.endswith('.'):
            w = self.nd.get(k + '.')
            v = w[:-1] if w is not None and w.endswith('.') else None
        return v

    def get(self, key):
        k = norm(html.unescape(key))
        if not has_letters(k):
            return None
        v = self._one(k)
        if v is not None:
            return v
        m = re.match(r'^(.*) \| ROVARD STUDIOS$', k)
        if m:
            left = self.get(m.group(1))
            return None if left is None else f'{left} | ROVARD STUDIOS'
        m = re.match(r'^(.*) image (\d+)$', k)
        if m:
            left = self.get(m.group(1))
            return None if left is None else f'{left}, image {m.group(2)}'
        if '<' not in k:
            parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"“*$])', k)
            if len(parts) > 1:
                out = [self._one(x) if has_letters(x) else x for x in parts]
                if all(o is not None for o in out):
                    return ' '.join(out)
                for x, o in zip(parts, out):
                    if o is None and has_letters(x):
                        self.missing[x] = self.missing.get(x, 0) + 1
                return None
        self.missing[k] = self.missing.get(k, 0) + 1
        return None


def tr_attr_value(T, name, val, tag, attrs):
    if name in TRANSLATE_ATTRS:
        return T.get(val) or val
    if name == 'content' and tag == 'meta':
        nm = dict(attrs).get('name') or dict(attrs).get('property') or ''
        if nm in ('description', 'og:description', 'og:title', 'twitter:title', 'twitter:description', 'og:image:alt'):
            return T.get(val) or val
    if name == 'data-rotator':
        try:
            data = json.loads(val)
        except ValueError:
            return val
        def walk(x):
            if isinstance(x, str):
                return T.get(x) or x
            if isinstance(x, list):
                return [walk(i) for i in x]
            if isinstance(x, dict):
                return {k: (walk(v) if k in ('verb', 'thing', 'for') else v) for k, v in x.items()}
            return x
        return json.dumps(walk(data), ensure_ascii=False)
    return val


def fix_url(u):
    u = u.strip()
    if not u or re.match(r'^(?:[a-z][a-z0-9+.-]*:|#|/|\?)', u, re.I):
        return u
    rest = re.sub(r'^(?:\.\./|\./)+', '', u)
    if rest.startswith(ASSET_ROOTS):
        return '../' + u
    return u


def fix_srcset(v):
    return ', '.join(' '.join([fix_url(p.split()[0])] + p.split()[1:]) for p in v.split(','))


def fix_style(v):
    return re.sub(r'url\((["\']?)([^)"\']+)\1\)', lambda m: f'url({m.group(1)}{fix_url(m.group(2))}{m.group(1)})', v)


def walk(n, T):
    if isinstance(n, (Text, Raw)):
        return
    # attributes
    new = []
    for k, v in n.attrs:
        if v is not None:
            v = tr_attr_value(T, k, v, n.tag, n.attrs)
            if k in ('href', 'src', 'poster', 'data-src'):
                v = fix_url(v)
            elif k == 'srcset':
                v = fix_srcset(v)
            elif k == 'style':
                v = fix_style(v)
        new.append((k, v))
    n.attrs = new
    if n.tag in RAW:
        return
    direct_text = any(isinstance(k, Text) and norm(k.s) for k in n.kids)
    if direct_text and inline_only(n):
        key = inner(n)
        v = T.get(key)
        if v is not None:
            n.kids = parse(v).kids
        # still fix urls / attrs of inline children (e.g. links inside)
        for k in n.kids:
            walk_attrs_only(k)
        return
    for k in n.kids:
        if isinstance(k, Text):
            if norm(k.s):
                v = T.get(esc_t(k.s))
                if v is not None:
                    k.s = html.unescape(v)
        else:
            walk(k, T)


def walk_attrs_only(n):
    if isinstance(n, (Text, Raw)):
        return
    new = []
    for k, v in n.attrs:
        if v is not None:
            if k in ('href', 'src', 'poster'):
                v = fix_url(v)
            elif k == 'srcset':
                v = fix_srcset(v)
            elif k == 'style':
                v = fix_style(v)
        new.append((k, v))
    n.attrs = new
    for k in n.kids:
        walk_attrs_only(k)


def find(n, pred, out):
    if isinstance(n, (Text, Raw)):
        return
    if pred(n):
        out.append(n)
    for k in n.kids:
        find(k, pred, out)


def make_fr(path, html_en, T, site_url):
    root = parse(html_en)
    depth = path.count('/') if path else 0
    # language switch
    sw = []
    find(root, lambda n: n.tag == 'span' and any(a == 'data-lang' for a, _ in n.attrs), sw)
    for s in sw:
        up = '../' * (depth + 1)
        s.kids = [Node('a', [('href', f'{up}{path}'), ('hreflang', 'en'), ('lang', 'en')]), Node('a', [('href', './'), ('aria-current', 'true')])]
        s.kids[0].kids = [Text('EN')]; s.kids[1].kids = [Text('FR')]
    walk(root, T)
    out = ser(root)
    out = out.replace('<html lang="en">', '<html lang="fr">', 1)
    en_url = f'{site_url}/{path}'
    fr_url = f'{site_url}/fr/{path}'
    out = out.replace(f'<link rel="canonical" href="{en_url}">', f'<link rel="canonical" href="{fr_url}">', 1)
    out = out.replace(f'<meta property="og:url" content="{en_url}">', f'<meta property="og:url" content="{fr_url}"><meta property="og:locale" content="fr_CA">', 1)
    return out


def run(pages, site_url):
    """pages: list of (path, html). Writes fr/<path>/index.html and tools/fr-missing.json."""
    T = Tr()
    for path, h in pages:
        out = make_fr(path, h, T, site_url)
        dest = os.path.join(ROOT, 'fr', path, 'index.html') if path else os.path.join(ROOT, 'fr', 'index.html')
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, 'w', encoding='utf-8').write(out)
    miss = dict(sorted(T.missing.items()))
    json.dump(list(miss.keys()), open(os.path.join(ROOT, 'tools', 'fr-missing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return len(pages), len(miss)
