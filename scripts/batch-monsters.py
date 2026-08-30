"""
Découpe les fichiers texte de monstres en lots pour json-extractor.
Produit des fichiers lot_N.txt avec séparateurs <!-- MONSTER: slug -->
"""
import os, sys

RAW_DIR = sys.argv[1]
OUT_DIR = sys.argv[2]
BATCH_SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 85

os.makedirs(OUT_DIR, exist_ok=True)

files = sorted(f for f in os.listdir(RAW_DIR) if f.endswith('.txt'))
batches = [files[i:i+BATCH_SIZE] for i in range(0, len(files), BATCH_SIZE)]

for bi, batch in enumerate(batches, 1):
    out_path = os.path.join(OUT_DIR, f"lot_{bi:02d}.txt")
    with open(out_path, 'w', encoding='utf-8') as out:
        for fname in batch:
            slug = fname[:-4]  # remove .txt
            path = os.path.join(RAW_DIR, fname)
            content = open(path, encoding='utf-8').read().strip()
            out.write(f"<!-- MONSTER: {slug} -->\n{content}\n\n")
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Lot {bi:02d}: {len(batch)} monstres, {size_kb:.0f} KB -> {out_path}")

print(f"\n{len(batches)} lots créés, total {len(files)} monstres")