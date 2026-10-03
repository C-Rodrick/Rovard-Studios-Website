"""Render Mason & Rowe imagery (fictional buildings, synthetic renders).

  py render.py preview halden          -> scratch preview (1500 px) in ./_preview
  py render.py halden averly           -> final export to ../website/img
  py render.py all                     -> every scene
"""
import importlib
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import core  # noqa

REGISTRY = {}
for mod in ('ext', 'ext2', 'ext3', 'interior', 'detail', 'city'):
    try:
        REGISTRY.update(importlib.import_module(mod).SCENES)
    except ModuleNotFoundError as e:
        if e.name != mod:
            raise

# name -> (export width, jpeg quality)
EXPORT = {
    'halden': (2400, 78), 'averly': (2400, 78), 'wren': (2400, 78), 'quarry': (2400, 78),
}


def main(argv):
    preview = bool(argv) and argv[0] == 'preview'
    names = argv[1:] if preview else argv
    if not names or names == ['all']:
        names = list(REGISTRY)
    for n in names:
        if n not in REGISTRY:
            print('unknown scene', n)
            continue
        t = time.time()
        fn = REGISTRY[n]
        kw = dict(getattr(fn, 'finish_kw', {}))
        if preview:
            sc = fn(W=int(os.environ.get('PW', 1500)))
            out = os.path.join(HERE, '_preview', n + '.jpg')
            sc.finish(out, quality=86, **kw)
        else:
            width, q = EXPORT.get(n, getattr(fn, 'export', (1800, 80)))
            sc = fn(W=max(width, 1800))
            out = os.path.join(core.IMG_OUT, n + '.jpg')
            sc.finish(out, quality=q, width=width, **kw)
        print(f'{n}: {os.path.getsize(out) / 1024:.0f} KB  {time.time() - t:.1f}s -> {out}')


if __name__ == '__main__':
    main(sys.argv[1:])
