#!/usr/bin/env python3
"""Extract all monsters from lot_02.txt into lot_02.seed.json"""
import re, json

SOURCE = r"C:\_work\my_projects\donjon-dragon\docs\characteres\monsters-batches\lot_02.txt"
DEST = r"C:\_work\my_projects\donjon-dragon\docs\characteres\monsters-batches\lot_02.seed.json"

with open(SOURCE, "r", encoding="utf-8") as f:
    text = f.read()

blocks = re.split(r'<!-- MONSTER:\s*([^>]+?)\s*-->', text)
monsters = []
for i in range(1, len(blocks), 2):
    monsters.append((blocks[i].strip(), blocks[i+1]))

# Expanded character set for French names including parens, slash, dash, comma, apostrophe
NC = r"[A-Z\u00C0-\u00DC\u00C9\u00C8\u00CA\u00CB][a-z\u00E0-\u00FC\u00E9\u00E8\u00EA\u00EB0-9()\/,\-\u2013\u2019']+"
WC = r"[a-z\u00E0-\u00FC\u00E9\u00E8\u00EA\u00EB0-9()\/,\-\u2013\u2019']+"
SW = r"d|l|D|L|d'|l'|D'|L'"
DW = r"de|du|la|les|des|sur|dans|en|au|aux|par|une|ce|cet|cette|ces|mon|ton|son|ses|leur|leurs|plus|entre|avec|sans|parmi|pour"

NAME_RE_SPACED = re.compile(
    r'(' + NC + r'(?:\s+(?:' + WC + r'|' + SW + r')){0,10})' + r'\s\.\s'
)

NAME_RE_DOT = re.compile(
    r'\b(' + NC + r'(?:\s+(?:' + WC + r'|' + SW + r'|' + DW + r')){0,10})' + r'\.(?:\s|$)'
)

def split_items(content):
    if not content or len(content) < 3:
        return []
    for regex in [NAME_RE_SPACED, NAME_RE_DOT]:
        matches = list(regex.finditer(content))
        if matches:
            items = []
            for i, m in enumerate(matches):
                name = m.group(1).strip()
                desc_start = m.end()
                desc_end = matches[i+1].start() if i + 1 < len(matches) else len(content)
                desc = content[desc_start:desc_end].strip()
                desc = re.sub(r'\s+', ' ', desc).strip()
                if name:
                    items.append({"name": name, "description": desc if desc else name})
            return items
    return []

def extract_section(content, section_name, stops):
    stops_expr = '|'.join(re.escape(s) for s in stops)
    p = re.compile(re.escape(section_name) + r'([\s\S]*?)(?=(?:' + stops_expr + r')|$)', re.DOTALL)
    m = p.search(content)
    if m:
        raw = m.group(1).strip()
        raw = re.sub(r'\s+', ' ', raw).strip()
        return raw
    return ""

def parse_section(content, section_name, stops):
    raw = extract_section(content, section_name, stops)
    if not raw:
        return []
    return split_items(raw)

def text_between(content, label, stops):
    p = re.compile(re.escape(label) + r'\s+(.*?)(?=' + '|'.join(re.escape(s) for s in stops) + r'|$)', re.DOTALL)
    m = p.search(content)
    if m:
        t = re.sub(r'\s+', ' ', m.group(1)).strip()
        return t if t else None
    return None

def parse_abilities(content):
    r = {"str": None, "dex": None, "con": None, "int": None, "wis": None, "cha": None,
         "strMod": None, "dexMod": None, "conMod": None, "intMod": None, "wisMod": None, "chaMod": None,
         "strSave": None, "dexSave": None, "conSave": None, "intSave": None, "wisSave": None, "chaSave": None}
    m = re.search(r'MOD\s*JdS\s+(.*?)(?:Comp\u00e9tences|Sens|Immunit\u00e9s|R\u00e9sistances|Vuln\u00e9rabilit\u00e9s|Langues|\u00c9quipement|FP)', content)
    if not m:
        return r
    rest = m.group(1)
    abbr_to_key = {"For": "str", "Dex": "dex", "Con": "con", "Int": "int", "Sag": "wis", "Cha": "cha"}
    for abbr, score, mod, save in re.findall(r'(For|Dex|Con|Int|Sag|Cha)\s+(-?\d+)\s+([+-]\d+)\s+([+-]\d+)', rest):
        key = abbr_to_key[abbr]
        r[key] = int(score); r[key+"Mod"] = mod; r[key+"Save"] = save
    return r

def extract_one(slug, content):
    content = content.strip()
    
    name_m = re.match(r'([^\u00bb]+)', content)
    name = name_m.group(1).strip() if name_m else slug
    
    type_str = None
    type_mm = re.search(r'Monstres D&D 5\.5\s+(.+?)\s+de\s+taille', content)
    if type_mm:
        after = type_mm.group(1).strip()
        if after.startswith(name):
            type_str = after[len(name):].strip()
        else:
            fw = name.split()[0]
            type_str = after[len(fw):].strip() if after.startswith(fw) else after
        if not type_str:
            type_str = after
    
    size_m = re.search(r'taille\s+(TP|P|M(?:\s*ou\s*P)?|G|TG|Gig)', content)
    size = size_m.group(1).strip() if size_m else None
    
    align_m = re.search(r'taille\s+(?:TP|P|M(?:\s*ou\s*P)?|G|TG|Gig)[,\s]\s*(.+?)\s+Initiative', content)
    alignment = align_m.group(1).strip() if align_m else None
    
    init_m = re.search(r'Initiative\s+([+-]\d+)\s*\((\d+)\)', content)
    initiative_bonus = int(init_m.group(1)) if init_m else None
    
    ac_m = re.search(r'CA\s+(\d+)', content)
    armor_class = int(ac_m.group(1)) if ac_m else None
    
    hp_m = re.search(r'Pv\s+(\d+)\s*\(([^)]+)\)', content)
    hit_points = int(hp_m.group(1)) if hp_m else None
    hit_dice = hp_m.group(2).strip() if hp_m else None
    
    speed_m = re.search(r'Vitesse\s+(.*?)(?=\s*MOD)', content)
    speed = speed_m.group(1).strip() if speed_m else None
    
    abilities = parse_abilities(content)
    
    skill_stops = ["Sens", "Immunit\u00e9s", "R\u00e9sistances", "Vuln\u00e9rabilit\u00e9s", "Langues", "\u00c9quipement", "FP"]
    skills = text_between(content, "Comp\u00e9tences", skill_stops)
    
    dmgImm = text_between(content, "Immunit\u00e9s", ["Sens", "R\u00e9sistances", "Vuln\u00e9rabilit\u00e9s", "Comp\u00e9tences", "Langues", "FP", "\u00c9quipement"])
    condImm = None
    if dmgImm:
        if ";" in dmgImm:
            parts = dmgImm.split(";", 1)
            dmg_part = parts[0].strip()
            cond_part = parts[1].strip() if len(parts) > 1 else ""
            dmgImm = dmg_part if dmg_part else None
            condImm = cond_part if cond_part else None
        else:
            cond_keywords = ["P\u00e9trifi\u00e9", "Charm\u00e9", "Empoisonn\u00e9", "Effray\u00e9", "\u00c9puisement", "Paralys\u00e9", "\u00c9tourdi", "Inconscient", "\u00c0 terre", "Aveugl\u00e9", "Assourdi", "Agripp\u00e9", "Entrav\u00e9", "Incapable"]
            if any(c in dmgImm for c in cond_keywords):
                condImm = dmgImm
                dmgImm = None
    
    damRes = text_between(content, "R\u00e9sistances", ["Immunit\u00e9s", "Vuln\u00e9rabilit\u00e9s", "Comp\u00e9tences", "Sens", "Langues", "FP", "\u00c9quipement"])
    damVuln = text_between(content, "Vuln\u00e9rabilit\u00e9s", ["R\u00e9sistances", "Immunit\u00e9s", "Comp\u00e9tences", "Sens", "Langues", "FP", "\u00c9quipement"])
    
    senses = text_between(content, "Sens", ["Langues", "FP", "Comp\u00e9tences", "Immunit\u00e9s", "\u00c9quipement"])
    languages = text_between(content, "Langues", ["FP", "Sens", "Immunit\u00e9s", "\u00c9quipement"])
    
    fp_m = re.search(r'FP\s+(\d+(?:\s*/\s*\d+)?)\s*\(PX\s+([^)]+)\)', content)
    challengeRating = fp_m.group(1).strip() if fp_m else None
    xp = re.search(r'(\d+)', fp_m.group(2)).group(1) if fp_m else None
    pb_m = re.search(r'BM\s+([+-]\d+)', content)
    proficiencyBonus = pb_m.group(1) if pb_m else None
    
    s_acts = ["Actions Bonus", "R\u00e9actions", "Actions L\u00e9gendaires", "Actions Mythiques", "Monster Manual"]
    s_trts = ["Actions"] + s_acts
    s_bns = ["R\u00e9actions", "Actions L\u00e9gendaires", "Actions Mythiques", "Monster Manual"]
    s_rea = ["Actions L\u00e9gendaires", "Actions Mythiques", "Monster Manual"]
    s_leg = ["Actions Mythiques", "Monster Manual"]
    s_myt = ["Monster Manual"]
    
    traits = parse_section(content, "Traits", s_trts)
    actions = parse_section(content, "Actions", s_acts)
    bonusActions = parse_section(content, "Actions Bonus", s_bns)
    reactions = parse_section(content, "R\u00e9actions", s_rea)
    legendaryActions = parse_section(content, "Actions L\u00e9gendaires", s_leg)
    mythicActions = parse_section(content, "Actions Mythiques", s_myt)
    
    src_m = re.search(r'(Monster Manual 2024(?: \([A-Z]+\))?)', content)
    source = src_m.group(1) if src_m else None
    
    en_m = re.search(r'(?:Monster Manual 2024(?: \([A-Z]+\))?)\s+(.+?)\s*\[EN\]', content)
    es_m = re.search(r'\[EN\]\s+(.+?)\s*\[ES\]', content)
    nameEN = en_m.group(1).strip() if en_m else None
    nameES = es_m.group(1).strip() if es_m else None
    
    return {
        "key": slug, "name": name, "type": type_str, "size": size, "alignment": alignment,
        "armorClass": armor_class, "hitPoints": hit_points, "hitDice": hit_dice,
        "initiativeBonus": initiative_bonus, "speed": speed, "abilities": abilities,
        "skills": skills, "damageImmunities": dmgImm, "damageResistances": damRes,
        "damageVulnerabilities": damVuln, "conditionImmunities": condImm,
        "senses": senses, "languages": languages, "challengeRating": challengeRating,
        "xp": xp, "proficiencyBonus": proficiencyBonus, "traits": traits, "actions": actions,
        "bonusActions": bonusActions, "reactions": reactions, "legendaryActions": legendaryActions,
        "mythicActions": mythicActions, "source": source, "nameEN": nameEN, "nameES": nameES
    }

# Spot-check edge cases
for slug, content in monsters:
    if slug in ["cockatrice-souveraine", "colosse", "couatl", "demi-liche", 
                 "dragon-blanc-adulte", "dragon-rouge-ancien", "demon-des-ombres", "diable-des-chaines"]:
        m = extract_one(slug, content)
        tn = [t['name'] for t in m['traits']]
        an = [a['name'] for a in m['actions']]
        bn = [b['name'] for b in m['bonusActions']]
        rn = [r['name'] for r in m['reactions']]
        ln = [l['name'] for l in m['legendaryActions']]
        print(f"{slug:30s} tr={len(tn):2d} act={len(an):2d} ba={len(bn)} re={len(rn)} le={len(ln)}")
        if bn: print(f"       bonus: {', '.join(bn)[:60]}")
        if ln: print(f"       legend: {', '.join(ln)[:60]}")

results = [extract_one(slug, c) for slug, c in monsters]
with open(DEST, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

total_items = sum(len(m['traits']) + len(m['actions']) + len(m['bonusActions']) + len(m['reactions']) + len(m['legendaryActions']) + len(m['mythicActions']) for m in results)
print(f"\nDone! {len(results)} monsters written to {DEST}")
print(f"Total items (traits+actions+bonus+reactions+legendary+mythic): {total_items}")