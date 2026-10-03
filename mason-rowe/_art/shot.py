"""Headless-Chrome capture helper.

  py shot.py <page-or-url> <out.png> [width] [height] [budget_ms] [--mobile]

<page-or-url> may be a path relative to mason-rowe/ (e.g. website/index.html?d=halden-house) or a full URL.
Console errors/warnings are echoed so layout and script problems surface while shooting.
"""
import os
import subprocess
import sys

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))


def shot(target, out, w=1440, h=900, budget=9000, mobile=False, extra=None):
    if not target.startswith(('http', 'file:')):
        path, _, q = target.partition('?')
        target = 'file:///' + os.path.join(ROOT, path).replace('\\', '/') + ('?' + q if q else '')
    out = out if os.path.isabs(out) else os.path.join(HERE, out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    args = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={w},{h}',
            f'--virtual-time-budget={budget}', '--enable-logging=stderr', '--v=0', '--allow-file-access-from-files',
            '--force-device-scale-factor=1', f'--screenshot={out}']
    if mobile:
        args += ['--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1']
    args += (extra or []) + [target]
    r = subprocess.run(args, capture_output=True, text=True, timeout=240)
    for line in (r.stderr or '').splitlines():
        if 'CONSOLE' in line or 'Uncaught' in line:
            print('  ', line.split('] ', 1)[-1][:300])
    print(('ok ' if os.path.exists(out) else 'FAILED ') + out)
    return out


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    shot(a[0], a[1], int(a[2]) if len(a) > 2 else 1440, int(a[3]) if len(a) > 3 else 900, int(a[4]) if len(a) > 4 else 9000, '--mobile' in sys.argv)
