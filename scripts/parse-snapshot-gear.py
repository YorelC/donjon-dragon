"""
Parse le snapshot browser d'AideDD (matériel d'aventurier) en JSON structuré.
V2 — corrige le regex pour le format réel du snapshot.
"""
import re, json, sys

SNAPSHOT = sys.argv[1]
OUT = sys.argv[2]

text = open(SNAPSHOT, encoding='utf-8').read()

items = []

# Extraire les lignes de la table
# Format: chaque row contient 3 cell, séparées par des row
# Pattern: row suivi de cell "x" puis cell "y" puis cell "z"
table_pattern = re.compile(
    r'- row\n'
    r'(?:(?!- row).)*?'  # skip header row
    r'- cell "([^"]+)"[^\n]*\n'
    r'(?:[^\n]*\n)*?'    # skip attributes/lines between cells
    r'- cell "([^"]+)"[^\n]*\n'
    r'(?:[^\n]*\n)*?'
    r'- cell "([^"]+)"',
    re.MULTILINE
)

# Approche plus simple : extraire toutes les cell et les grouper par 3
# Après le premier row avec columnheaders, chaque row a 3 cell
all_rows = re.split(r'(?=\n\s*- row\n)', text)

# Trouver la section table
table_start = -1
for i, row in enumerate(all_rows):
    if 'columnheader "Objet"' in row:
        table_start = i + 1  # skip header
        break

if table_start >= 0:
    table_rows = []
    for row in all_rows[table_start:]:
        cells = re.findall(r'cell "([^"]+)"', row)
        if len(cells) == 3:
            table_rows.append(cells)
        elif 'heading "' in row or 'cell "' not in row:
            break  # fin de la table
    
    print(f"Table rows: {len(table_rows)}")
else:
    table_rows = []

# Extraire les descriptions
# Format: heading "Nom (prix)" [level=4] puis paragraph(s) avec StaticText
desc_pattern = re.compile(
    r'- heading "([^"]+)"[^\n]*\n'
    r'((?:[ \t]*- paragraph\n(?:[ \t]*- StaticText "[^"]+"\n?)+)+)',
    re.MULTILINE
)

descriptions = {}
for m in desc_pattern.finditer(text):
    heading = m.group(1)
    content = m.group(2)
    
    # Extraire nom et prix du heading
    h_match = re.match(r'^(.+?)\s*\(([^)]+)\)\s*$', heading)
    if not h_match:
        continue
    
    name = h_match.group(1).strip()
    
    # Extraire tous les StaticText
    desc_parts = re.findall(r'StaticText "([^"]+)"', content)
    desc = ' '.join(desc_parts).strip()
    
    if desc:
        descriptions[name.lower()] = desc

print(f"Descriptions: {len(descriptions)}")

# Fusionner
for name, weight, cost in table_rows:
    name = name.strip()
    weight = weight.strip()
    cost = cost.strip()
    
    key = name.lower()
    key = re.sub(r'[^a-z0-9àâçéèêëîïôûùüÿ\s-]', '', key)
    key = re.sub(r'\s+', '-', key)
    key = re.sub(r'-+', '-', key)
    
    item = {
        'key': key,
        'name': name,
        'weight': None if weight in ('—', 'Variable') else weight,
        'cost': None if cost in ('—', 'Variable') else cost,
        'description': descriptions.get(name.lower())
    }
    
    items.append(item)

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f"Total: {len(items)} items → {OUT}")
with_desc = sum(1 for i in items if i['description'])
print(f"Avec description: {with_desc}/{len(items)}")