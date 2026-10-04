"""Self-host Syne + Space Grotesk as subsetted variable WOFF2 (Latin only)."""
import os
from fontTools import subset
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'motion-video', 'fonts')
UNI = '0020-007E,00A0-00FF,2013-2014,2018-201D,2022,2026,2190,2192,2197,00B7'
for name in ('Syne', 'SpaceGrotesk'):
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.notdef_outline = True
    f = subset.load_font(os.path.join(SRC, name + '.ttf'), opts)
    s = subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(UNI)); s.subset(f)
    out = os.path.join(ROOT, 'css', 'fonts', name + '.woff2')
    subset.save_font(f, out, opts)
    print(name, os.path.getsize(out) // 1024, 'KB')
