"""Headless Chrome screenshots for review:  python tools/shot.py <url-path> <width> <height> <out.png> [scroll_px]"""
import subprocess, sys, os
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
path, w, h, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
port = os.environ.get('PORT', '8802')
url = f'http://localhost:{port}/{path}'
cmd = [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={w},{h}', '--force-device-scale-factor=1', '--force-prefers-reduced-motion',
       '--virtual-time-budget=6000', f'--screenshot={out}', url]
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
print('ok', out)
