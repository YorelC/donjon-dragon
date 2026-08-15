import re
import json

with open(r'C:\_work\my_projects\donjon-dragon\docs\characteres\monsters-batches\lot_01.txt', 'r', encoding='utf-8') as f:
    raw = f.read()

raw = raw.replace('\r\n', '\n')
raw = re.sub(r'^\d+\|', '', raw, flags=re.MULTILINE)
raw = raw.strip()

blocks = re.split(r'<!-- MONSTER: ([^>]+) -->\n', raw)
blocks = blocks[1:]

MONSTER_SECTION_LABELS = [
    'Traits', 'Actions Bonus', 'Actions Légendaires', 'Actions Mythiques',
    'Réactions', 'Actions',
    'Monster Manual', "Player's Handbook", 'Player´s Handbook',
]

MONSTER_FIELD_LABELS = [
    'Compétences', 'Sens', 'Immunités', 'Résistances', 'Vulnérabilités',
    'Langues', 'Équipement',
]


def parse_header(text):
    """Extract name, type, size, alignment from the start of a monster block."""
    # Pattern: "Name » Monstres D&D 5.5 [Name] Type de taille Size, Alignment [Initiative...|CA...|Pv...|Vitesse...]"
    
    # Find the first known marker that ends the header
    next_markers = ['Initiative', 'CA ', 'Pv ', 'Vitesse ', 'MOD JdS']
    positions = []
    for m in next_markers:
        idx = text.find(m)
        if idx >= 0:
            positions.append((idx, m))
    
    if not positions:
        return {'name': None, 'type': None, 'size': None, 'alignment': None}, text
    
    positions.sort()
    header_end = positions[0][0]
    header = text[:header_end].strip()
    remaining = text[header_end:].strip()
    
    # Extract name
    name_match = re.match(r'([^»]+) »', header)
    name = name_match.group(1).strip() if name_match else None
    
    # Find Monstres D&D 5.5 and get content after it
    body = header
    m5 = re.search(r'Monstres D&D 5\.5\s+', body)
    if m5:
        body = body[m5.end():]
        # Remove repeated name if present
        if name and body.startswith(name):
            body = body[len(name):].strip()
    
    # Now extract type, size, alignment from: "Type de taille Size, Alignment"
    # The type can contain parentheses: "Bête (Dinosaure)", "Fiélon (Démon)", "Élémentaire (Titan)", etc.
    pattern = r'^(.+?)\s+de taille\s+(TP|P|M|G|TG|Gig|M ou P),\s+(.+?)$'
    match = re.match(pattern, body)
    
    type_ = None
    size = None
    alignment = None
    
    if match:
        type_ = match.group(1).strip()
        size_raw = match.group(2).strip()
        alignment = match.group(3).strip()
        size_map = {'TP': 'TP', 'P': 'P', 'M': 'M', 'G': 'G', 'TG': 'TG',
                    'Gig': 'Gig', 'Gigantesque': 'Gig', 'M ou P': 'M ou P', 'P ou M': 'M ou P'}
        size = size_map.get(size_raw, size_raw)
    
    return {'name': name, 'type': type_, 'size': size, 'alignment': alignment}, remaining


def parse_initiative(text):
    m = re.search(r'Initiative\s+([+\-]\d+)\s*\((\d+)\)', text)
    return int(m.group(1)) if m else None


def parse_armor_class(text):
    m = re.search(r'CA\s+(\d+)', text)
    return int(m.group(1)) if m else None


def parse_hit_points(text):
    m = re.search(r'Pv\s+(\d+)\s*\((\d+d\d+(?:\s*[+\-]\s*\d+)?)\)', text)
    if m:
        return int(m.group(1)), m.group(2).replace(' ', '')
    return None, None


def parse_speed(text):
    m = re.search(r'Vitesse\s+(.+?)(?=\s+(?:MOD\s+JdS|CA\s|Pv\s|Initiative|Compétences|Sens|Immunités|Résistances|Vulnérabilités|Langues|FP|Équipement))', text)
    return m.group(1).strip() if m else None


def parse_abilities(text):
    abilities = {k: None for k in ['str', 'dex', 'con', 'int', 'wis', 'cha',
                                    'strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod',
                                    'strSave', 'dexSave', 'conSave', 'intSave', 'wisSave', 'chaSave']}
    
    # Find the ability line: "For X [+-]Y [+-]Z Dex X [+-]Y [+-]Z ..."
    idx = text.find('MOD JdS MOD JdS MOD JdS')
    if idx < 0:
        return abilities
    
    after = text[idx + len('MOD JdS MOD JdS MOD JdS'):]
    
    # Find where For starts
    for_idx = after.find('For ')
    if for_idx < 0:
        return abilities
    
    ability_line = after[for_idx:]
    
    # Find end of ability line (before next known label)
    end_markers = ['Compétences', 'Sens', 'Immunités', 'Résistances', 'Vulnérabilités', 'Langues', 'FP ', 'Équipement']
    best_end = len(ability_line)
    for marker in end_markers:
        pos = ability_line.find(' ' + marker)
        if 0 < pos < best_end:
            best_end = pos
    
    ability_line = ability_line[:best_end].strip()
    
    # Normalize en-dashes to hyphens
    ability_line = ability_line.replace('\u2013', '-').replace('\u2014', '--')
    
    # Parse: For X +Y +Z Dex X +Y +Z Con X +Y +Z Int X +Y +Z Sag X +Y +Z Cha X +Y +Z
    abbr = {'For': 'str', 'Dex': 'dex', 'Con': 'con', 'Int': 'int', 'Sag': 'wis', 'Cha': 'cha'}
    
    # Pattern with saves: For 21 +5 +5 Dex 9 -1 +3 ...
    pattern = r'(For|Dex|Con|Int|Sag|Cha)\s+(-?\d+)\s+([+\-]\d+)\s+([+\-]\d+)'
    matches = re.findall(pattern, ability_line)
    
    if len(matches) == 6:
        for abbr_name, val, mod, save in matches:
            key = abbr[abbr_name]
            abilities[key] = int(val)
            abilities[f'{key}Mod'] = mod
            abilities[f'{key}Save'] = save
        return abilities
    
    # Pattern without save: For 10 +0 Dex 14 +2 ...
    pattern2 = r'(For|Dex|Con|Int|Sag|Cha)\s+(-?\d+)\s+([+\-]\d+)'
    matches = re.findall(pattern2, ability_line)
    if len(matches) == 6:
        for abbr_name, val, mod in matches:
            key = abbr[abbr_name]
            abilities[key] = int(val)
            abilities[f'{key}Mod'] = mod
    
    return abilities


def extract_field_after(text, label, end_labels):
    """Extract text after label until one of end_labels is found."""
    # Find label
    idx = text.find(label + ' ')
    if idx < 0:
        # Try label at end
        idx = text.find(label)
        if idx < 0 or (idx + len(label) < len(text) and text[idx + len(label)] not in [' ', '\n']):
            return None
    
    start = idx + len(label)
    remaining = text[start:]
    
    # Find the earliest end marker
    best_end = len(remaining)
    for marker in end_labels:
        # Search for marker preceded by space or at start
        pos = remaining.find(' ' + marker)
        if 0 < pos < best_end:
            best_end = pos
        # Also check for marker at start of remaining
        if remaining.startswith(marker):
            best_end = 0
    
    return remaining[:best_end].strip() or None


def is_condition(word):
    """Check if a word/phrase is a condition (status effect) rather than a damage type."""
    conditions = ['charmé', 'assourdi', 'épuisement', 'effrayé', 'agrippé', 'paralysé',
                  'pétrifié', 'empoisonné', 'à terre', 'entravé', 'étourdi', 'inconscient',
                  'aveuglé', 'incapable']
    return word.strip(' ,;.').lower() in conditions


def is_damage_type(word):
    damages = ['acide', 'contondant', 'froid', 'feu', 'foudre', 'force', 'nécrotique',
               'perforant', 'poison', 'psychique', 'radiant', 'tonnerre', 'tranchant']
    return word.strip(' ,;.').lower() in damages


def split_immunities(text):
    """Split Immunités field into damage and condition parts."""
    if not text:
        return None, None
    
    # Split by ; first (semicolons usually separate damage from conditions)
    parts = [p.strip() for p in text.split(';')]
    
    damage_parts = []
    condition_parts = []
    
    for part in parts:
        words = re.findall(r'[A-Za-zÀ-ÿ]+', part)
        has_damage = any(is_damage_type(w) for w in words)
        has_condition = any(is_condition(w) for w in words)
        
        if has_damage and not has_condition:
            damage_parts.append(part)
        elif has_condition and not has_damage:
            condition_parts.append(part)
        elif has_damage and has_condition:
            # Mixed - need to split further
            # Look for separators
            damage_parts.append(part)
        else:
            condition_parts.append(part)
    
    dmg = '; '.join(damage_parts) if damage_parts else None
    cond = '; '.join(condition_parts) if condition_parts else None
    return dmg, cond


def parse_fp(text):
    """Parse FP line: FP 4 (PX 1100 ; BM +2) or FP 10 (PX 5900 ou 7200 dans son antre ; BM +4)"""
    m = re.search(r'FP\s+([\d/]+)\s*\(PX\s+(.+?)(?:;\s*BM\s+([+\-]\d+))?\)', text)
    if m:
        return m.group(1), m.group(2).strip(), m.group(3)
    return None, None, None


def parse_source_en_es(text):
    """Extract source, nameEN, nameES from the end of a monster block."""
    # Pattern: "SourceName 2024 ... [EN] EnglishName [ES] SpanishName Monstres D&D 5.5 ..."
    # Spanish name may be missing (same as English)
    m = re.search(
        r'((?:Monster Manual|Player\'s Handbook|Player´s Handbook)\s+2024[^[]*?)\s+\[EN\]\s+(.+?)\s+\[ES\]\s+'
        r'(?:(.+?)\s+)?Monstres\s+D&D',
        text, re.DOTALL
    )
    if m:
        src = m.group(1).strip()
        en = m.group(2).strip()
        es = (m.group(3) or en).strip()
        return src, en, es
    
    # Fallback without trailing breadcrumb
    m2 = re.search(
        r'((?:Monster Manual|Player\'s Handbook|Player´s Handbook)\s+2024[^[]*?)\s+\[EN\]\s+(.+?)\s+\[ES\]\s+(.+?)\s*$',
        text, re.DOTALL
    )
    if m2:
        return m2.group(1).strip(), m2.group(2).strip(), m2.group(3).strip()
    
    # Fallback: just find EN and ES
    en = re.search(r'\[EN\]\s+(.+?)\s+\[ES\]', text)
    es = re.search(r'\[ES\]\s+(.+?)$', text)
    src = re.search(r'(Monster Manual|Player\'s Handbook|Player´s Handbook)\s+2024\s*([^[]*)', text)
    
    return (
        src.group(0).strip() if src else None,
        en.group(1).strip() if en else None,
        es.group(1).strip() if es else None,
    )


def extract_section(text, section_name):
    """Extract a named section (Traits, Actions, etc.) and parse its items."""
    # All known section labels in order
    all_sections = [
        'Traits', 'Actions Bonus', 'Actions Légendaires', 'Actions Mythiques',
        'Réactions', 'Actions',
        'Monster Manual', "Player's Handbook", "Player´s Handbook"
    ]
    
    # Find all section positions
    positions = []
    for sec in all_sections:
        idx = text.find(sec)
        if idx >= 0:
            positions.append((idx, sec))
    
    # Sort by position in text
    positions.sort(key=lambda x: x[0])
    
    our_pos = None
    for pos, sec in positions:
        if sec == section_name:
            our_pos = pos
            break
    
    if our_pos is None:
        return []
    
    # Find end: next section after ours
    end_pos = len(text)
    for pos, sec in positions:
        if pos > our_pos and sec != section_name:
            end_pos = pos
            break
    
    section_text = text[our_pos + len(section_name):end_pos].strip()
    
    if not section_text:
        return []
    
    # Parse items: each starts with a name followed by " . " then description
    # Pattern: "Name . Description" where Name is capitalized
    items = []
    
    # Split on pattern that looks like the start of a new item
    # An item starts with a word (capitalized) followed by " . " or " (x/jour) . " or " (recharge X) . "
    # The tricky part: descriptions can contain " . " as well (like after "Échec : ... . Réussite : ...")
    
    # Strategy: find all " . " occurrences, then figure out which ones are item separators
    dot_positions = [m.start() for m in re.finditer(r'\s\.\s', section_text)]
    
    if not dot_positions:
        return [{'name': section_name, 'description': section_text}]
    
    # The first item starts at the beginning
    # An item name is the text before the first " . " that is a sensible name (short, capitalized)
    
    # Try a different approach: match items with regex
    # Pattern: "Name (optional modifier) . Description"
    # The name ends when we see " . " and the description starts after
    
    # Split by sections that look like a new item name followed by " . "
    # A new item starts at a word boundary before a capital letter
    
    raw_items = re.split(r'(?=[A-ZÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ][a-zéèêëàâäùûüôöïîç][A-Za-zéèêëàâäùûüôöïîçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ\s\'\-\(\)/,0-9]*?\s\.\s)', section_text)
    
    # Process each candidate item
    for raw_item in raw_items:
        raw_item = raw_item.strip()
        if not raw_item:
            continue
        
        # Try to match: "Name . Description"
        m = re.match(r'^([A-Za-zéèêëàâäùûüôöïîçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ][A-Za-zéèêëàâäùûüôöïîçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ\s\'\-\(\)/,0-9]*?)\s\.\s(.*)', raw_item, re.DOTALL)
        if m:
            name = m.group(1).strip()
            desc = m.group(2).strip()
            if name and desc and len(name) < 120:
                items.append({'name': name, 'description': desc})
    
    return items


def parse_monster(text):
    """Parse a complete monster text."""
    result = {}
    
    # Header
    header_info, remaining = parse_header(text)
    result.update(header_info)
    
    # Initiative
    result['initiativeBonus'] = parse_initiative(text)
    
    # Armor Class
    result['armorClass'] = parse_armor_class(text)
    
    # Hit Points
    hp, hd = parse_hit_points(text)
    result['hitPoints'] = hp
    result['hitDice'] = hd
    
    # Speed
    result['speed'] = parse_speed(text)
    
    # Abilities
    result['abilities'] = parse_abilities(text)
    
    # Fields that are just text after a label
    field_end_labels = MONSTER_FIELD_LABELS + ['FP ', 'Traits', 'Actions Bonus', 'Actions Légendaires',
                                                'Actions Mythiques', 'Réactions', 'Actions',
                                                'Monster Manual', "Player's Handbook", "Player´s Handbook"]
    
    result['skills'] = extract_field_after(text, 'Compétences', field_end_labels)
    result['senses'] = extract_field_after(text, 'Sens', field_end_labels)
    result['languages'] = extract_field_after(text, 'Langues', field_end_labels)
    result['damageResistances'] = extract_field_after(text, 'Résistances', field_end_labels)
    result['damageVulnerabilities'] = extract_field_after(text, 'Vulnérabilités', field_end_labels)
    
    # Immunities - split into damage and condition
    immunities_raw = extract_field_after(text, 'Immunités', field_end_labels)
    dmg_imm, cond_imm = split_immunities(immunities_raw)
    result['damageImmunities'] = dmg_imm
    result['conditionImmunities'] = cond_imm
    
    # Equipment
    result['equipment'] = extract_field_after(text, 'Équipement', field_end_labels)
    
    # FP
    cr, xp, pb = parse_fp(text)
    result['challengeRating'] = cr
    result['xp'] = xp
    result['proficiencyBonus'] = pb
    
    # Source, nameEN, nameES
    src, en, es = parse_source_en_es(text)
    result['source'] = src
    result['nameEN'] = en
    result['nameES'] = es
    
    # Sections
    result['traits'] = extract_section(text, 'Traits')
    result['actions'] = extract_section(text, 'Actions')
    # Check for "Actions Bonus" before "Actions"
    if 'Actions Bonus' in text:
        result['bonusActions'] = extract_section(text, 'Actions Bonus')
    else:
        result['bonusActions'] = []
    result['reactions'] = extract_section(text, 'Réactions')
    result['legendaryActions'] = extract_section(text, 'Actions Légendaires')
    result['mythicActions'] = extract_section(text, 'Actions Mythiques')
    
    return result


# Parse all monsters
monsters_json = []
for i in range(0, len(blocks), 2):
    slug = blocks[i].strip()
    text = blocks[i+1].strip()
    
    parsed = parse_monster(text)
    
    entry = {
        'key': slug,
        'name': parsed.get('name'),
        'type': parsed.get('type'),
        'size': parsed.get('size'),
        'alignment': parsed.get('alignment'),
        'armorClass': parsed.get('armorClass'),
        'hitPoints': parsed.get('hitPoints'),
        'hitDice': parsed.get('hitDice'),
        'initiativeBonus': parsed.get('initiativeBonus'),
        'speed': parsed.get('speed'),
        'abilities': parsed.get('abilities', {
            k: None for k in ['str', 'dex', 'con', 'int', 'wis', 'cha',
                              'strMod', 'dexMod', 'conMod', 'intMod', 'wisMod', 'chaMod',
                              'strSave', 'dexSave', 'conSave', 'intSave', 'wisSave', 'chaSave']
        }),
        'skills': parsed.get('skills'),
        'damageImmunities': parsed.get('damageImmunities'),
        'damageResistances': parsed.get('damageResistances'),
        'damageVulnerabilities': parsed.get('damageVulnerabilities'),
        'conditionImmunities': parsed.get('conditionImmunities'),
        'senses': parsed.get('senses'),
        'languages': parsed.get('languages'),
        'challengeRating': parsed.get('challengeRating'),
        'xp': parsed.get('xp'),
        'proficiencyBonus': parsed.get('proficiencyBonus'),
        'traits': parsed.get('traits', []),
        'actions': parsed.get('actions', []),
        'bonusActions': parsed.get('bonusActions', []),
        'reactions': parsed.get('reactions', []),
        'legendaryActions': parsed.get('legendaryActions', []),
        'mythicActions': parsed.get('mythicActions', []),
        'source': parsed.get('source'),
        'nameEN': parsed.get('nameEN'),
        'nameES': parsed.get('nameES'),
    }
    
    monsters_json.append(entry)
    # Debug: show any monsters with missing key fields
    missing = [k for k in ['name', 'type', 'size', 'alignment'] if entry[k] is None]
    ab_issues = all(v is None for v in entry['abilities'].values())
    if missing or ab_issues:
        print(f"WARN: {slug} - missing={missing}, abilities_empty={ab_issues}")

# Write output
output_path = r'C:\_work\my_projects\donjon-dragon\docs\characteres\monsters-batches\lot_01.seed.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(monsters_json, f, ensure_ascii=False, indent=2)

print(f"\nDone! {len(monsters_json)} monsters written to {output_path}")