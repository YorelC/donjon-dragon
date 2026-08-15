import re, json

with open(r'C:\_work\my_projects\donjon-dragon\docs\characteres\monsters-batches\lot_01.txt', 'r', encoding='utf-8') as f:
    raw = f.read()
raw = raw.replace('\r\n', '\n')
raw = re.sub(r'^\d+\|', '', raw, flags=re.MULTILINE)

start = raw.index('<!-- MONSTER: arcanaloth -->')
end = raw.index('<!-- MONSTER: archelon -->')
block = raw[start:end]

all_sections = ['Traits', 'Actions Bonus', 'Actions Legendaires', 'Actions Mythiques',
                'Reactions', 'Actions', 'Monster Manual', "Player's Handbook", "Player's Handbook"]

positions = []
for sec in all_sections:
    idx = block.find(sec)
    if idx >= 0:
        positions.append((idx, sec))

print('Section positions:', positions)

# Traits
our_pos = positions[0][0]  # Traits position
end_pos = len(block)
for pos, sec in positions[1:]:
    if pos > our_pos:
        end_pos = pos
        break

traits_text = block[our_pos + 6:end_pos].strip()
print('Traits text length:', len(traits_text))
print('Traits text start:', repr(traits_text[:200]))
print('Traits text end:', repr(traits_text[-200:]))

# Count " . " in the traits text
for m in re.finditer(r'\s\.\s', traits_text):
    ctx_start = max(0, m.start() - 20)
    ctx_end = min(len(traits_text), m.end() + 20)
    context = traits_text[ctx_start:ctx_end]
    print('  " . " at', m.start(), ':', repr(context))