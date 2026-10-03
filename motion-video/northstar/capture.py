"""Capture Northstar site + app screens for the ad. Needs `py -m http.server 8771` at repo root."""
import os
from playwright.sync_api import sync_playwright
B = 'http://127.0.0.1:8771/northstar-capital/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
SHOTS = {
    # name: (url, w, h, scale, full_page)
    'home_full': ('site/index.html?reveal=all', 1440, 900, 1.5, True),
    'home': ('site/index.html?reveal=all', 1440, 900, 1.5, False),
    'pricing': ('site/pricing.html?reveal=all', 1440, 900, 1.5, False),
    'features': ('site/features.html?reveal=all', 1440, 900, 1.5, False),
    'app_overview': ('app/index.html?theme=dark#/overview', 1440, 900, 1.5, False),
    'app_overview_l': ('app/index.html?theme=light#/overview', 1440, 900, 1.5, False),
    'app_cash': ('app/index.html?theme=dark#/cash-flow', 1440, 900, 1.5, False),
    'app_invoices': ('app/index.html?theme=dark#/invoices', 1440, 900, 1.5, False),
    'app_reports': ('app/index.html?theme=dark#/reports', 1440, 900, 1.5, False),
    'm_overview': ('app/index.html?theme=dark#/overview', 390, 844, 3, False),
    'm_cash': ('app/index.html?theme=dark#/cash-flow', 390, 844, 3, False),
    'm_home': ('site/index.html?reveal=all', 390, 844, 3, False),
}
with sync_playwright() as p:
    br = p.chromium.launch(channel='msedge')
    for k, (u, w, h, s, full) in SHOTS.items():
        ctx = br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=s, reduced_motion='reduce')
        pg = ctx.new_page(); pg.goto(B + u, wait_until='networkidle'); pg.wait_for_timeout(2500)
        pg.screenshot(path=os.path.join(OUT, k + '.png'), full_page=full); ctx.close(); print(k)
    br.close()
