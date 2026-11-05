# -*- coding: utf-8 -*-
"""Static server with gzip and caching headers, close to how Netlify serves the site, for fair performance numbers.
    python tools/oa/serve_gz.py 8131
"""
import gzip, http.server, io, os, socketserver, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEXT = ('.html', '.css', '.js', '.svg', '.json', '.xml', '.txt')


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if path.endswith(TEXT) and os.path.exists(path) and 'gzip' in self.headers.get('Accept-Encoding', ''):
            body = gzip.compress(open(path, 'rb').read(), 6)
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            return io.BytesIO(body)
        return super().send_head()


class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    S(('', int(sys.argv[1]) if len(sys.argv) > 1 else 8131), H).serve_forever()
