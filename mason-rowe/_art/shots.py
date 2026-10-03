"""Capture real screenshots of the live Mason & Rowe site for the UI Design portfolio boards.

  py shots.py            -> every shot into ./shots/
  py shots.py d_dev_*    -> only matching names
"""
import fnmatch
import os
import sys

from playwright.sync_api import sync_playwright
from pw import open_browser, url_for, settle

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'shots')
HIDE = '.hdr,.subnav,.mbar,.cur,.curtain{visibility:hidden!important}'

# name: (page, viewport, kind, extra)  kind: 'top' (viewport at top, header visible) | 'el' (element) | 'page' (settled page, viewport)
DESK, TAB, MOB = (1440, 900), (820, 1100), (390, 844)
SHOTS = {
    'd_home_hero':   ('website/index.html', DESK, 'top', {}),
    'd_home_menu':   ('website/index.html', DESK, 'top', {'menu': True}),
    'd_home_feat':   ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(3)'}),
    'd_home_arch':   ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(4)'}),
    'd_home_living': ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(5)'}),
    'd_home_amen':   ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(6)'}),
    'd_home_cities': ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(7)'}),
    'd_home_avail':  ('website/index.html', DESK, 'el', {'sel': 'main > section:nth-of-type(8)'}),
    'd_devs':        ('website/developments.html', DESK, 'page', {}),
    'd_dev_hero':    ('website/development.html?d=halden-house', DESK, 'top', {}),
    'd_dev_over':    ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#overview'}),
    'd_dev_gal':     ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#gallery'}),
    'd_dev_res':     ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#residences'}),
    'd_dev_plans':   ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#plans', 'click': '#planTabs .tab:nth-child(3)'}),
    'd_dev_specs':   ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#specs'}),
    'd_dev_amen':    ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#amenities'}),
    'd_dev_loc':     ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#location'}),
    'd_dev_avail':   ('website/development.html?d=halden-house', DESK, 'el', {'sel': '#availability', 'click': '#avStack .cell[data-id="9B"]'}),
    'd_avail':       ('website/availability.html?d=the-averly', (1440, 1180), 'page', {'click': '#avStack .cell[data-id="12B"]'}),
    'd_avail_list':  ('website/availability.html?d=wren-canyon', DESK, 'page', {'click': '[data-view="list"]'}),
    'd_hood':        ('website/neighborhood.html?c=mia', (1440, 1250), 'page', {'scrollto': '#hoodMap'}),
    'd_res':         ('website/residences.html', DESK, 'top', {}),
    'd_res_cards':   ('website/residences.html', DESK, 'el', {'sel': '#resList'}),
    'd_res_scheme':  ('website/residences.html', DESK, 'el', {'sel': 'section.sec--dark', 'click': '[data-scheme="b"]'}),
    'd_amen':        ('website/amenities.html', DESK, 'top', {}),
    'd_arch':        ('website/architecture.html', DESK, 'el', {'sel': 'main > section:nth-of-type(4)'}),
    'd_arch_top':    ('website/architecture.html', DESK, 'top', {}),
    'd_about':       ('website/about.html', DESK, 'top', {}),
    'd_contact':     ('website/contact.html', (1440, 1100), 'page', {}),
    'd_pv1':         ('website/private-viewing.html', (1440, 1000), 'page', {'click': '#dv-halden-house + label'}),
    'd_pv2':         ('website/private-viewing.html?d=halden-house', (1440, 1250), 'page', {'pv': 2}),
    'd_pv4':         ('website/private-viewing.html?d=halden-house', (1440, 1100), 'page', {'pv': 4}),
    't_home':        ('website/index.html', TAB, 'top', {}),
    't_dev':         ('website/development.html?d=the-averly', TAB, 'top', {}),
    't_avail':       ('website/availability.html?d=halden-house', TAB, 'page', {'click': '#avStack .cell[data-id="6A"]'}),
    'm_home':        ('website/index.html', MOB, 'top', {}),
    'm_menu':        ('website/index.html', MOB, 'top', {'menu': True}),
    'm_feat':        ('website/index.html', MOB, 'el', {'sel': 'main > section:nth-of-type(3)', 'clip': 1500}),
    'm_dev':         ('website/development.html?d=halden-house', MOB, 'top', {}),
    'm_dev_plan':    ('website/development.html?d=halden-house', MOB, 'el', {'sel': '#plans'}),
    'm_dev_avail':   ('website/development.html?d=halden-house', MOB, 'el', {'sel': '#availability', 'click': '#avStack .cell[data-id="9B"]'}),
    'm_avail':       ('website/availability.html?d=the-averly', MOB, 'page', {'click': '#avStack .cell[data-id="12B"]'}),
    'm_pv2':         ('website/private-viewing.html?d=halden-house', MOB, 'page', {'pv': 2}),
    'm_res':         ('website/residences.html', MOB, 'top', {}),
    'm_hood':        ('website/neighborhood.html?c=ny', MOB, 'page', {'scrollto': '#hoodMap'}),
}


def run(pattern='*'):
    os.makedirs(OUT, exist_ok=True)
    names = [n for n in SHOTS if fnmatch.fnmatch(n, pattern)]
    with sync_playwright() as p:
        b = open_browser(p)
        for n in names:
            path, (w, h), kind, ex = SHOTS[n]
            mobile = w < 500
            ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
            pg = ctx.new_page()
            pg.goto(url_for(path))
            if kind == 'top':
                pg.wait_for_load_state('load'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(2600)
            else:
                settle(pg, scroll=True, wait=500)
            if ex.get('menu'):
                pg.click('#menuBtn'); pg.wait_for_timeout(1800)
            if ex.get('pv'):
                pg.click('#dv-halden-house + label') if pg.locator('#dv-halden-house').count() and not pg.is_checked('#dv-halden-house') else None
                pg.click('#to2'); pg.wait_for_timeout(600)
                if ex['pv'] >= 2:
                    pg.locator('#calGrid .day:not([disabled])').nth(4).click(); pg.wait_for_timeout(200)
                    pg.locator('#slots .slot:not([disabled])').nth(1).click(); pg.wait_for_timeout(300)
                if ex['pv'] >= 4:
                    pg.click('#to3'); pg.wait_for_timeout(500)
                    pg.fill('#pvName', 'Alex Morgan'); pg.fill('#pvEmail', 'alex@example.com'); pg.check('#pvForm input[type=checkbox]')
                    pg.click('#pvForm button[type=submit]'); pg.wait_for_timeout(900)
            if ex.get('click'):
                el = pg.locator(ex['click']).first
                el.scroll_into_view_if_needed(); el.click(); pg.wait_for_timeout(700)
            if kind != 'top' and not ex.get('menu'):
                pg.add_style_tag(content=HIDE)
            if ex.get('scrollto'):
                pg.evaluate(f"document.querySelector('{ex['scrollto']}').scrollIntoView({{block:'start'}}); window.scrollBy(0,-120)"); pg.wait_for_timeout(500)
            out = os.path.join(OUT, n + '.png')
            if kind == 'el':
                loc = pg.locator(ex['sel']).first
                loc.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
                loc.screenshot(path=out)
                if ex.get('clip'):
                    from PIL import Image
                    im = Image.open(out); k = 2 if mobile else 1
                    im.crop((0, 0, im.width, min(im.height, ex['clip'] * k))).save(out)
            else:
                pg.screenshot(path=out)
            print('ok', n, os.path.getsize(out) // 1024, 'KB')
            ctx.close()
        b.close()


if __name__ == '__main__':
    run(sys.argv[1] if len(sys.argv) > 1 else '*')
