"""Upload every image and video to a Cloudflare R2 bucket (S3 API), with long cache headers.

One-time setup (Cloudflare dashboard):
  1. R2 -> Create bucket (e.g. rovard-media).  2. Bucket -> Settings -> Custom domain: media.rovardstudio.com (or enable the r2.dev URL).
  3. R2 -> Manage API tokens -> create a token with Object Read & Write for that bucket.
Then:
  pip install boto3
  set R2_ACCOUNT_ID=...  R2_ACCESS_KEY_ID=...  R2_SECRET_ACCESS_KEY=...  R2_BUCKET=rovard-media
  python tools/upload_media.py            (only uploads what changed; add --dry to just list)
  put the public URL in tools/content.py -> SITE['media'], then: python tools/build.py
Folders uploaded: img/, video/, assets/Motion Design/ (the brand film).
"""
import hashlib, mimetypes, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ['img', 'video', os.path.join('assets', 'Motion Design')]
TYPES = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.svg': 'image/svg+xml'}
dry = '--dry' in sys.argv
files = []
for d in DIRS:
    for dp, _, fs in os.walk(os.path.join(ROOT, d)):
        for f in fs:
            if os.path.splitext(f)[1].lower() in TYPES:
                files.append(os.path.join(dp, f))
print(len(files), 'files', f'({sum(os.path.getsize(f) for f in files) // 1048576} MB)')
if dry:
    sys.exit(0)
import boto3  # noqa
env = {k: os.environ.get(k) for k in ('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET')}
if not all(env.values()):
    sys.exit('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET first.')
s3 = boto3.client('s3', endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
                  aws_access_key_id=env['R2_ACCESS_KEY_ID'], aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'], region_name='auto')
bucket = env['R2_BUCKET']
have = {}
tok = None
while True:
    r = s3.list_objects_v2(Bucket=bucket, **({'ContinuationToken': tok} if tok else {}))
    for o in r.get('Contents', []):
        have[o['Key']] = o['ETag'].strip('"')
    if not r.get('IsTruncated'):
        break
    tok = r['NextContinuationToken']
n = 0
for f in files:
    key = os.path.relpath(f, ROOT).replace(os.sep, '/')
    md5 = hashlib.md5(open(f, 'rb').read()).hexdigest()
    if have.get(key) == md5:
        continue
    s3.upload_file(f, bucket, key, ExtraArgs={'ContentType': TYPES[os.path.splitext(f)[1].lower()], 'CacheControl': 'public, max-age=2592000'})
    n += 1
    print('uploaded', key)
print('done,', n, 'uploaded')
