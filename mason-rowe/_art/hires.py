"""Render hero scenes at 1.5x into _cache/ as sources for sharp detail crops (not shipped)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render, core
for n in ('halden', 'averly', 'wren', 'quarry'):
    fn = render.REGISTRY[n]
    sc = fn(W=3600)
    out = os.path.join(core.HERE, '_cache', f'hi_{n}.jpg')
    sc.finish(out, quality=90, **getattr(fn, 'finish_kw', {}))
    print(n, os.path.getsize(out) // 1024, 'KB')
