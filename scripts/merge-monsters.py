"""
Fusionne les fichiers lot_*.seed.json en un seul monsters.seed.json.
Vérifie les clés dupliquées et la cohérence.
"""
import json, os, sys
from collections import Counter

BATCH_DIR = sys.argv[1]
OUTPUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(BATCH_DIR, '..', 'monsters.seed.json')

all_monsters = []
keys_seen = set()
duplicates = []

for fname in sorted(os.listdir(BATCH_DIR)):
    if not fname.startswith('lot_') or not fname.endswith('.seed.json'):
        continue
    path = os.path.join(BATCH_DIR, fname)
    data = json.load(open(path, encoding='utf-8'))
    for m in data:
        if m['key'] in keys_seen:
            duplicates.append(m['key'])
        keys_seen.add(m['key'])
        all_monsters.append(m)
    print(f"  {fname}: {len(data)} monstres")

print(f"\nTotal: {len(all_monsters)} monstres")
if duplicates:
    print(f"DUPLICATES: {duplicates}")

# Vérifications
empty_names = [m['key'] for m in all_monsters if not m.get('name')]
empty_types = [m['key'] for m in all_monsters if not m.get('type')]
no_actions = [m['key'] for m in all_monsters if not m.get('actions')]
no_traits = [m['key'] for m in all_monsters if not m.get('traits')]

if empty_names:
    print(f"WARN: {len(empty_names)} monstres sans nom: {empty_names[:5]}...")
if empty_types:
    print(f"WARN: {len(empty_types)} monstres sans type: {empty_types[:5]}...")
if no_actions:
    print(f"WARN: {len(no_actions)} monstres sans actions: {no_actions[:10]}...")
if no_traits:
    print(f"WARN: {len(no_traits)} monstres sans traits: {no_traits[:10]}...")

# Stats
types = Counter(m.get('type', 'N/A') for m in all_monsters)
sizes = Counter(m.get('size', 'N/A') for m in all_monsters)
crs = Counter(m.get('challengeRating', 'N/A') for m in all_monsters)

print(f"\nTypes: {dict(types.most_common())}")
print(f"Tailles: {dict(sizes.most_common())}")
print(f"FP: {dict(crs.most_common(10))}...")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(all_monsters, f, ensure_ascii=False, indent=2)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"\nÉcrit: {OUTPUT} ({size_kb:.0f} KB)")