# -*- coding: utf-8 -*-
"""Lighthouse several times, reporting the median.  python tools/oa/lh.py OUTDIR [path] [runs]   (needs the server on :8131)"""
import json, os, statistics, subprocess, sys
out = sys.argv[1]
path = sys.argv[2] if len(sys.argv) > 2 else ''
runs = int(sys.argv[3]) if len(sys.argv) > 3 else 3
env = {**os.environ, 'MSYS_NO_PATHCONV': '1'}
for mode in ('mobile', 'desktop'):
    rows = []
    for i in range(runs):
        f = os.path.join(out, f'lh-{mode}{i}.json')
        cmd = f'npx -y lighthouse@12 http://localhost:8131/{path} {"--preset=desktop" if mode == "desktop" else ""} --only-categories=performance,accessibility,seo,best-practices --output=json --output-path="{f}" --quiet --chrome-flags="--headless=new"'
        subprocess.run(cmd, shell=True, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        d = json.load(open(f, encoding='utf-8'))
        a, c = d['audits'], d['categories']
        rows.append(dict(perf=c['performance']['score'], a11y=c['accessibility']['score'], bp=c['best-practices']['score'], seo=c['seo']['score'],
                         lcp=a['largest-contentful-paint'].get('numericValue'), tbt=a['total-blocking-time'].get('numericValue'), cls=a['cumulative-layout-shift'].get('numericValue')))
        print(mode, i, {k: (round(v, 3) if v is not None else None) for k, v in rows[-1].items()})
    good = [r for r in rows if r['perf'] is not None]
    if good:
        print(mode, 'MEDIAN perf', statistics.median(r['perf'] for r in good) * 100, 'LCP', round(statistics.median(r['lcp'] for r in good)), 'ms TBT', round(statistics.median(r['tbt'] for r in good)), 'ms CLS', round(statistics.median(r['cls'] for r in good), 4))
