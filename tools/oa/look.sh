#!/bin/sh
# Review helper: bundle, then render the named states into the folder given as $1.
node tools/oa/bundle.mjs >/dev/null 2>&1
d="$1"; shift
for st in "$@"; do python tools/oa/stills.py --look "$st" 1440 900 "$d/$st.png" 2>&1 | tail -2; done
