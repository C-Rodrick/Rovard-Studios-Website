"""Merge tools/fr_parts/p*.json (index -> French) with tools/fr_parts/keys.json (index -> English key) into tools/fr/dict.json."""
import glob, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
keys = json.load(open(os.path.join(ROOT, 'tools', 'fr_parts', 'keys.json'), encoding='utf-8'))
out = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'tools', 'fr_parts', 'p*.json'))):
    for i, v in json.load(open(f, encoding='utf-8')).items():
        out[keys[int(i)]] = v
json.dump(out, open(os.path.join(ROOT, 'tools', 'fr', 'dict.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'of', len(keys))
