"""Tiny Chrome DevTools driver for review: load a page at a size, run JS steps, take screenshots.

    from cdp import Browser
    with Browser(1440, 900) as b:
        b.goto('http://localhost:8000/'); b.wait(1500)
        b.js("document.querySelector('.menu-btn').click()"); b.wait(1200)
        b.shot('menu.png')
"""
import base64, json, os, subprocess, tempfile, time, urllib.request
import websocket

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'


class Browser:
    def __init__(self, w=1440, h=900, mobile=False, port=9333):
        self.w, self.h, self.port, self.mobile = w, h, port, mobile
        self.dir = tempfile.mkdtemp(prefix='cdp-')

    def __enter__(self):
        self.proc = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', f'--remote-debugging-port={self.port}', f'--user-data-dir={self.dir}',
                                      '--hide-scrollbars', f'--window-size={max(self.w, 500)},{self.h + 200}', 'about:blank'],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(60):
            try:
                tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{self.port}/json'))
                page = next(t for t in tabs if t['type'] == 'page')
                break
            except Exception:
                time.sleep(.25)
        self.ws = websocket.create_connection(page['webSocketDebuggerUrl'], timeout=60, suppress_origin=True)
        self.i = 0
        self.send('Page.enable'); self.send('Runtime.enable')
        self.send('Emulation.setDeviceMetricsOverride', width=self.w, height=self.h, deviceScaleFactor=1, mobile=self.mobile)
        return self

    def __exit__(self, *a):
        try:
            self.ws.close()
        finally:
            self.proc.terminate()

    def send(self, method, **params):
        self.i += 1
        self.ws.send(json.dumps({'id': self.i, 'method': method, 'params': params}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get('id') == self.i:
                if 'error' in m:
                    raise RuntimeError(m['error'])
                return m.get('result', {})

    def goto(self, url):
        self.send('Page.navigate', url=url)
        time.sleep(1.2)

    def wait(self, ms):
        time.sleep(ms / 1000)

    def js(self, expr):
        r = self.send('Runtime.evaluate', expression=expr, returnByValue=True, awaitPromise=True)
        return r.get('result', {}).get('value')

    def shot(self, path, full=False, clip=None):
        p = {'format': 'png'}
        if full:
            h = self.js('document.documentElement.scrollHeight')
            p['clip'] = {'x': 0, 'y': 0, 'width': self.w, 'height': h, 'scale': 1}
            p['captureBeyondViewport'] = True
        elif clip:
            p['clip'] = {'x': clip[0], 'y': clip[1], 'width': clip[2], 'height': clip[3], 'scale': 1}
        data = self.send('Page.captureScreenshot', **p)['data']
        open(path, 'wb').write(base64.b64decode(data))
        return path

    def mouse(self, x, y, wheel=None):
        if wheel:
            self.send('Input.dispatchMouseEvent', type='mouseWheel', x=x, y=y, deltaX=0, deltaY=wheel)
        else:
            self.send('Input.dispatchMouseEvent', type='mouseMoved', x=x, y=y)
