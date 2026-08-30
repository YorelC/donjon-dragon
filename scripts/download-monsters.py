"""
Télécharge toutes les pages de détail de monstres et extrait le texte brut.
Usage: python scripts/download-monsters.py docs/characteres/monsters-slugs.txt docs/characteres/monsters-raw/
"""
import re, html as html_mod, sys, os, urllib.request, time

SLUGS_FILE = sys.argv[1]
OUT_DIR = sys.argv[2]
os.makedirs(OUT_DIR, exist_ok=True)

with open(SLUGS_FILE, encoding='utf-8') as f:
    slugs = [l.strip() for l in f if l.strip()]

print(f"Downloading {len(slugs)} monster pages...")
errors = []

for i, slug in enumerate(slugs):
    url = f"https://www.aidedd.org/monster/fr/{slug}"
    out_path = os.path.join(OUT_DIR, f"{slug}.txt")
    
    if os.path.exists(out_path):
        continue  # skip already downloaded
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode('utf-8', errors='replace')
        
        # Extract text
        t = html_mod.unescape(raw)
        t = re.sub(r'<script[^>]*>.*?</script>', ' ', t, flags=re.S)
        t = re.sub(r'<style[^>]*>.*?</style>', ' ', t, flags=re.S)
        t = re.sub(r'<[^>]+>', ' ', t)
        t = re.sub(r'&[a-z]+;', ' ', t)
        t = re.sub(r'\s+', ' ', t).strip()
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(t)
    except Exception as e:
        errors.append(f"{slug}: {e}")
    
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/{len(slugs)} done...")
        time.sleep(1)  # be polite

print(f"Done. {len(slugs) - len(errors)} downloaded, {len(errors)} errors.")
if errors:
    for e in errors[:10]:
        print(f"  {e}")