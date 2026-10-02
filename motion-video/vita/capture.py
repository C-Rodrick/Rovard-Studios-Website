import subprocess, os
C=r"C:\Program Files\Google\Chrome\Application\chrome.exe"
B="http://localhost:5173/vita-house/site/"
bp="static=1&force=1&service=primary&provider=okafor&location=austin&date=%2B3&time=09:30"
shots={
 'home':('index.html?static=1',1440,900,1),
 'providers':('providers.html?static=1',1440,900,1),
 'provider':('provider.html?id=okafor&static=1',1440,900,1),
 'membership':('membership.html?static=1',1440,900,1),
 'book1':('book.html?static=1&step=1',1440,900,1),
 'book2':('book.html?static=1&service=primary&step=2',1440,900,1),
 'book4':('book.html?'+bp+'&step=4',1440,900,1),
 'book5':('book.html?'+bp+'&autofill=1&step=5',1440,900,1),
 'book6':('book.html?'+bp+'&step=6',1440,900,1),
 'portal':('portal.html?static=1#/',1440,900,1),
 'messages':('portal.html?static=1#/messages',1440,900,1),
 'docs':('portal.html?static=1#/documents',1440,900,1),
 'settings':('portal.html?static=1#/settings',1440,900,1),
 'm_book':('book.html?embed=1&'+bp+'&step=4',500,900,1.7),
 'm_portal':('portal.html?embed=1&static=1#/',500,900,1.7),
}
for k,(u,w,h,s) in shots.items():
    out=os.path.abspath(f'shots/{k}.png')
    subprocess.run([C,'--headless=new','--disable-gpu','--hide-scrollbars',f'--force-device-scale-factor={s}','--virtual-time-budget=8000',f'--window-size={w},{h}',f'--screenshot={out}',B+u],capture_output=True)
    print(k,os.path.exists(out))
