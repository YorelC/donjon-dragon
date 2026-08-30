"""Crée un mini-lot avec seulement les monstres problématiques."""
import os, sys

RAW_DIR = sys.argv[1]
SLUGS_FILE = sys.argv[2]
OUT_PATH = sys.argv[3]

with open(SLUGS_FILE) as f:
    slugs = [l.strip() for l in f]

# Lire les slugs problématiques depuis stdin ou un fichier ?
# On les passe en argument
problematic = sys.argv[4:]

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

with open(OUT_PATH, 'w', encoding='utf-8') as out:
    for slug in problematic:
        fname = f"{slug}.txt"
        path = os.path.join(RAW_DIR, fname)
        if not os.path.exists(path):
            print(f"WARN: {fname} not found")
            continue
        content = open(path, encoding='utf-8').read().strip()
        out.write(f"<!-- MONSTER: {slug} -->\n{content}\n\n")

size_kb = os.path.getsize(OUT_PATH) / 1024
print(f"Batch créé: {OUT_PATH} ({size_kb:.0f} KB, {len(problematic)} monstres)")