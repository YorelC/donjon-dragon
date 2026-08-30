#!/usr/bin/env python3
"""Génère les prompts pour chaque lot de monstres."""
import os

PROMPT_TEMPLATE = open('docs/characteres/monsters-extract.prompt.txt', encoding='utf-8').read()
BATCH_DIR = 'docs/characteres/monsters-batches'

for i in range(1, 8):
    source = os.path.join(BATCH_DIR, f'lot_{i:02d}.txt')
    output = os.path.join(BATCH_DIR, f'lot_{i:02d}.seed.json')
    
    # Chemins absolus Windows
    source_abs = 'C:\\\\_work\\\\my_projects\\\\donjon-dragon\\\\docs\\\\characteres\\\\monsters-batches\\\\lot_{:02d}.txt'.format(i)
    output_abs = 'C:\\\\_work\\\\my_projects\\\\donjon-dragon\\\\docs\\\\characteres\\\\monsters-batches\\\\lot_{:02d}.seed.json'.format(i)
    
    prompt = PROMPT_TEMPLATE.replace('{SOURCE}', source_abs).replace('{OUTPUT}', output_abs)
    
    out_path = os.path.join(BATCH_DIR, f'prompt_lot_{i:02d}.txt')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(prompt)
    
    print(f"Generated {out_path} ({len(prompt)} chars)")

print("Done")