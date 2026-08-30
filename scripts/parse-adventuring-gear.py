"""
Parse le matériel d'aventurier depuis le texte brut d'AideDD.
Structure : table (Objet, Poids, Prix) suivie des descriptions alphabétiques.
"""
import re, json, sys

TEXT = open(sys.argv[1], encoding='utf-8').read()
OUT = sys.argv[2]

# Nettoyer les artifacts
text = TEXT.replace('\u2013', '-').replace('\u00A0', ' ')

# Extraire la table (entre "Objet Poids Prix" et la première description détaillée)
# La table liste les objets au format: "Nom Poids Prix" 
# Les descriptions commencent par "Acide (25 po)" ou similaire

# Stratégie : parser les descriptions d'abord (elles contiennent le nom + prix en parenthèses),
# puis compléter avec la table pour poids et objets sans description.

# Trouver toutes les entrées de description : "Nom (prix) Description..."
# Pattern: un nom suivi de (prix) suivi d'une description
desc_pattern = re.compile(r'(?P<name>[A-Z].*?)\s*\((?P<cost>[^)]+)\)\s*(?P<desc>.+?)(?=\s*[A-Z][a-zàâçéèêëîïôûùüÿ].*?\s*\([^)]+\)|Monster Manual|$)')

items = []

# Approche plus simple : découper par les titres de section connus
# Les descriptions sont après le tableau
# D'abord, extraire la table

# Isoler la section table (entre "Objet Poids Prix" et le début des descriptions)
table_start = text.find('Objet Poids Prix')
if table_start == -1:
    table_start = text.find('Objet  Poids  Prix')

# Trouver la première description (commence par "Acide (" )
desc_start = text.find('Acide (', table_start)

table_text = text[table_start:desc_start] if desc_start > table_start else text[table_start:]

# Parser la table : chaque ligne = "Nom poids prix" 
# Format: "Acide 0,5 kg 25 po Antidote — 50 po"
# Le pattern: nom (lettres/espaces/tirets/virgules) suivi de poids (nombre + unité ou —) suivi de prix (nombre + unité ou —)
table_pattern = re.compile(r'(?P<name>[A-Z][a-zàâçéèêëîïôûùüÿ\s\-,]+?)\s+(?P<weight>(?:\d+[.,]\d+\s*(?:kg|g)|—|Variable|Variable Variable))\s+(?P<cost>(?:\d+\s*(?:po|pa|pc)|—|Variable|Variable Variable))')

# Nettoyer la table des artefacts
clean_table = table_text.replace('Objet Poids Prix', '').strip()
# Supprimer "Matériel d'aventurier" etc.
clean_table = re.sub(r'Matériel d[’\']aventurier', '', clean_table)

matches = list(table_pattern.finditer(clean_table))

print(f"Table: {len(matches)} entrées trouvées")

# Parser les descriptions
desc_text = text[desc_start:] if desc_start > table_start else ''

# Pattern pour les descriptions individuelles
desc_entries = re.split(r'(?<=\.)\s+(?=[A-Z][a-zàâçéèêëîïôûùüÿ].*?\()', desc_text)

# Approche: on itère sur les entrées de la table, puis on cherche la description correspondante
# Les descriptions sont au format "Nom (prix) Description..."

desc_pattern = re.compile(r'^(?P<name>[A-Z].*?)\s*\((?P<cost>[^)]+)\)\s*(?P<desc>.*?)(?=\s*[A-Z][a-zàâçéèêëîïôûùüÿ].*?\s*\([^)]+\)\s|Monster Manual|$)')

all_descs = []
pos = 0
while pos < len(desc_text):
    m = desc_pattern.match(desc_text[pos:])
    if m:
        all_descs.append(m.groupdict())
        pos += m.end()
    else:
        pos += 1

print(f"Descriptions: {len(all_descs)} trouvées")

# Fusionner table + descriptions
desc_map = {}
for d in all_descs:
    name = d['name'].strip()
    desc_map[name.lower()] = d

# Construire les items finaux
for m in matches:
    name = m.group('name').strip()
    weight = m.group('weight').strip()
    cost = m.group('cost').strip()
    
    key = name.lower().replace(' ', '-').replace(',', '').replace('’', '-').replace('\'', '-')
    # Nettoyer les doubles tirets
    key = re.sub(r'-+', '-', key)
    
    item = {
        'key': key,
        'name': name,
        'weight': weight if weight != '—' else None,
        'cost': cost if cost != '—' else None,
        'description': None
    }
    
    # Chercher la description
    desc_info = desc_map.get(name.lower())
    if desc_info:
        item['description'] = desc_info['desc'].strip()
        # Le coût de la description est plus fiable
        if item['cost'] is None:
            item['cost'] = desc_info['cost'].strip()
    
    items.append(item)

# Sauvegarder
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f"Total: {len(items)} items → {OUT}")
print(f"Avec description: {sum(1 for i in items if i['description'])}")
print(f"Items: {[(i['name'], i['cost'], i['weight']) for i in items[:5]]}")