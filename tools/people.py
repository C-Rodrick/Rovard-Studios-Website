"""Responsive WebP for the supplied people photos: img/people/<n>-<w>.webp, merged into tools/manifest.json."""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from images import work, ROOT

jobs = []
for f in sorted(glob.glob(os.path.join(ROOT, 'assets', 'People', 'person-*.jpg'))):
    n = int(re.search(r'person-(\d+)', f).group(1))
    jobs.append(('people', n, os.path.relpath(f, ROOT).replace(os.sep, '/')))
mp = os.path.join(ROOT, 'tools', 'manifest.json')
m = json.load(open(mp))
m['people'] = {}
for slug, i, w0, h0, made in (work(j) for j in jobs):
    m['people'][str(i)] = {'w': w0, 'h': h0, 'sizes': made}
json.dump(m, open(mp, 'w'), indent=1)
print('people:', len(jobs), 'photos processed')
