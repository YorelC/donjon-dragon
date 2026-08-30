#!/usr/bin/env python3
"""
Extract structured mechanical effects from D&D 2024 spell descriptions (V4).
Output: {key: [effects]}
"""
import json
import re
import sys

DAMAGE_TYPE_FR_TO_EN = {
    'acide': 'acid', 'contondant': 'bludgeoning', 'contondants': 'bludgeoning',
    'froid': 'cold', 'feu': 'fire', 'force': 'force', 'foudre': 'lightning',
    'nécrotique': 'necrotic', 'nécrotiques': 'necrotic',
    'necrotique': 'necrotic', 'necrotiques': 'necrotic',
    'perforant': 'piercing', 'perforants': 'piercing', 'poison': 'poison',
    'psychique': 'psychic', 'psychiques': 'psychic', 'radiant': 'radiant',
    'radiants': 'radiant', 'tranchant': 'slashing', 'tranchants': 'slashing',
    'tonnerre': 'thunder',
}

ABILITY_FR_TO_EN = {
    'Force': 'strength', 'Dextérité': 'dexterity', 'Dexterité': 'dexterity',
    'Constitution': 'constitution', 'Intelligence': 'intelligence',
    'Sagesse': 'wisdom', 'Charisme': 'charisma',
}

CONDITION_NAMES = [
    'aveuglé', 'aveuglée', 'charmé', 'charmée', 'assourdi', 'effrayé', 'effrayée',
    'agrippé', 'neutralisé', 'incapable d\'agir', 'invisible', 'paralysé', 'paralysée',
    'pétrifié', 'pétrifiée', 'empoisonné', 'empoisonnée', 'à terre', 'entravé',
    'étourdi', 'inconscient', 'épuisé',
]

CONDITION_FR_TO_EN = {
    'aveuglé': 'blinded', 'aveuglée': 'blinded',
    'charmé': 'charmed', 'charmée': 'charmed',
    'assourdi': 'deafened',
    'effrayé': 'frightened', 'effrayée': 'frightened',
    'agrippé': 'grappled',
    'neutralisé': 'incapacitated',
    'incapable d\'agir': 'incapacitated',
    'invisible': 'invisible',
    'paralysé': 'paralyzed', 'paralysée': 'paralyzed',
    'pétrifié': 'petrified', 'pétrifiée': 'petrified',
    'empoisonné': 'poisoned', 'empoisonnée': 'poisoned',
    'à terre': 'prone',
    'entravé': 'restrained',
    'étourdi': 'stunned',
    'inconscient': 'unconscious',
    'épuisé': 'exhausted',
}

STOP_TYPES = {'en', 'et', 'ou', 'si', 'à', 'la', 'le', 'les', 'des', 'un', 'une',
              'dans', 'sur', 'par', 'pour', 'avec', 'sans', 'chaque', 'augmente',
              'augmentent', 'lorsque', 'lorsqu', 'inflige', 'réussite', 'échec',
              'succès', 'sort', 'supplémentaires', 'égaux', 'égal', 'moitié',
              'dégâts', 'points', 'votre', 'ces', 'cette', 'ce', 'tous',
              'moins', 'du', 'choisi', 'supplémentaire', 'plus', 'supplément'}


def normalize(text):
    return text.replace('\u00a0', ' ').strip()


def map_damage_type(fr_type):
    t = fr_type.strip().lower().rstrip('s')
    if t.startswith("d'"):
        t = t[2:]
    return DAMAGE_TYPE_FR_TO_EN.get(t, t)


def map_ability(fr_ability):
    a = re.sub(r"^(?:de\s+|d')", '', fr_ability.strip())
    return ABILITY_FR_TO_EN.get(a, a.lower())


def map_condition(fr_condition):
    c = fr_condition.strip().lower()
    return CONDITION_FR_TO_EN.get(c, c)


DAMAGE_RE = re.compile(
    r'(\d+d\d+(?:\s*\+\s*\d+)?)\s+(?:points\s+de\s+)?d[ée]g[âa]ts?\s+'
    r'(?:suppl[ée]mentaires\s+)?(?:de\s+|d\')?([a-zéûîêèàùôâëïüç]+)',
    re.IGNORECASE
)

REVERSE_DAMAGE_RE = re.compile(
    r'd[ée]g[âa]ts?\s+(?:suppl[ée]mentaires\s+)?(?:de\s+|d\')?([a-zéûîêèàùôâëïüç]+)\s+'
    r'[ée]gaux?\s+[àa]\s+(\d+d\d+(?:\s*\+\s*\d+)?)',
    re.IGNORECASE
)


def extract_effects(spell):
    desc = normalize(spell['description'])
    higher = normalize(spell.get('higherLevel') or '')
    effects = []
    seen_damage = set()
    key = spell['key']

    # --- Attack roll / save detection ---
    has_attack_roll = bool(re.search(
        r'attaque\s+de\s+sort\s+au\s+corps\s+[àa]\s+corps|'
        r'attaque\s+de\s+sort\s+[àa]\s+distance|'
        r'attaque\s+(?:de\s+)?corps\s+[àa]\s+corps\s+(?:de\s+sort|avec\s+un\s+sort)|'
        r'Effectuez\s+une\s+attaque|La\s+cible\s+touch[ée]e\s+par',
        desc, re.IGNORECASE
    ))

    # Smite spells: damage is added to a weapon attack
    is_smite = bool(re.search(
        r'suppl[ée]mentaires?\s+suite\s+[àa]\s+l[\'’]?attaque|'
        r'touch[ée]e\s+subit|Lorsque\s+vous\s+touchez',
        desc, re.IGNORECASE
    )) or key.endswith('smite')

    save_match = re.search(
        r'jet\s+de\s+sauvegarde\s+(?:de\s+|d\')?(Force|Dext[ée]rit[ée]|Constitution|Intelligence|Sagesse|Charisme)',
        desc, re.IGNORECASE
    )
    save_ability = map_ability(save_match.group(1)) if save_match else None

    half_on_save = bool(re.search(
        r'moiti[ée].*en\s+cas\s+de\s+r[ée]ussite|la\s+moiti[ée].*en\s+cas\s+de\s+r[ée]ussite|'
        r'en\s+cas\s+de\s+r[ée]ussite[^.]*moiti[ée]',
        desc, re.IGNORECASE
    ))

    # Upcast scaling (optionally captures a damage type: "dégâts de froid augmentent de 1d6")
    per_upcast = None
    per_upcast_type = None
    m = re.search(r'(?:d[ée]g[âa]ts?\s+(?:suppl[ée]mentaires\s+)?(?:de\s+|d\')?([a-zéûîêèàùôâëïüç]+)\s+)?augmentent?\s+(?:de\s+)?(\d+d\d+)', higher, re.IGNORECASE)
    if m:
        if m.group(1) and m.group(1).lower() not in STOP_TYPES:
            per_upcast_type = map_damage_type(m.group(1))
        per_upcast = m.group(2).replace(' ', '')
    if not per_upcast:
        m = re.search(r'(?:d[ée]g[âa]ts?\s+)?augmentent?\s+(?:de\s+)?(\d+d\d+)\s+lorsque', desc, re.IGNORECASE)
        if m:
            per_upcast = m.group(1).replace(' ', '')

    # === DAMAGE EXTRACTION ===
    for m in DAMAGE_RE.finditer(desc):
        dice = m.group(1).replace(' ', '')
        raw_type = m.group(2).strip().lower()
        if raw_type in STOP_TYPES:
            continue
        dmg_type = map_damage_type(raw_type)
        if dmg_type in STOP_TYPES or not dmg_type:
            continue

        ctx = desc[max(0, m.start() - 120):m.start()]
        if re.search(r'Si\s+l[\'’]?attaque\s+touche|l[\'’]?attaque\s+touche|touch[ée]e', ctx, re.IGNORECASE):
            inst_attack = True
        elif is_smite:
            inst_attack = True
        elif re.search(r'jet\s+de\s+sauvegarde', ctx, re.IGNORECASE):
            inst_attack = False
        else:
            inst_attack = has_attack_roll

        dkey = (dice, dmg_type)
        if dkey in seen_damage:
            continue
        seen_damage.add(dkey)

        dmg = {"dice": dice, "type": dmg_type, "attackRoll": inst_attack}
        # Save only for save-based damage
        if save_ability and not inst_attack:
            dmg["save"] = {"ability": save_ability, "onSuccess": "half" if half_on_save else "none"}
        if per_upcast:
            # Only apply if no type filter or damage type matches
            if not per_upcast_type or per_upcast_type == dmg_type:
                dmg["perUpcastLevel"] = per_upcast
        effects.append({"application": "active", "damage": dmg})

    for m in REVERSE_DAMAGE_RE.finditer(desc):
        raw_type = m.group(1).strip().lower()
        dice = m.group(2).replace(' ', '')
        if raw_type in STOP_TYPES:
            continue
        dmg_type = map_damage_type(raw_type)
        if dmg_type in STOP_TYPES or not dmg_type:
            continue
        dkey = (dice, dmg_type)
        if dkey in seen_damage:
            continue
        seen_damage.add(dkey)
        dmg = {"dice": dice, "type": dmg_type, "attackRoll": has_attack_roll or is_smite}
        if save_ability and not (has_attack_roll or is_smite):
            dmg["save"] = {"ability": save_ability, "onSuccess": "half" if half_on_save else "none"}
        effects.append({"application": "active", "damage": dmg})

    # === HEALING ===
    for m in re.finditer(
        r'(?:r[ée]cup[èe]re?z?|regagnez?|restaurez?|restaurer?)\s+'
        r'(?:des\s+points\s+de\s+vie\s+[ée]gaux?\s+[àa]\s+)?'
        r'(\d+d\d+(?:\s*\+\s*\d+)?)\s+points?\s+de\s+vie',
        desc, re.IGNORECASE
    ):
        heal_dice = m.group(1).replace(' ', '')
        heal = {"dice": heal_dice}
        mod = re.search(
            r'(?:votre\s+)?modificateur\s+(?:de\s+|d\')?(Force|Dext[ée]rit[ée]|Constitution|Intelligence|Sagesse|Charisme)',
            desc, re.IGNORECASE
        )
        if mod:
            heal["abilityModifier"] = map_ability(mod.group(1))
        if not any(e.get('healing', {}).get('dice') == heal_dice for e in effects if e.get('healing')):
            effects.append({"application": "active", "healing": heal})

    for m in re.finditer(r'(?:restaure|r[ée]cup[èe]re)\s+(\d+)\s+points?\s+de\s+vie', desc, re.IGNORECASE):
        hp = int(m.group(1))
        if not any(e.get('healing', {}).get('dice') == str(hp) for e in effects if e.get('healing')):
            effects.append({"application": "active", "healing": {"dice": str(hp)}})

    if re.search(r'r[ée]cup[èe]rez?\s+des\s+points\s+de\s+vie\s+[ée]gaux?\s+[àa]\s+(?:la\s+)?moiti[ée]', desc, re.IGNORECASE):
        if not any(e.get('healing') for e in effects):
            effects.append({"application": "active", "healing": {"note": "moitié des dégâts nécrotiques infligés"}})

    # === TEMP HP ===
    for m in re.finditer(
        r'(?:gagnez?|obtenez?|confère?)\s+(\d+d\d+(?:\s*\+\s*\d+)?|\d+)\s+points?\s+de\s+vie\s+temporaires?',
        desc, re.IGNORECASE
    ):
        thp = m.group(1).replace(' ', '')
        effects.append({"application": "active", "note": f"Gain de {thp} points de vie temporaires"})

    # === CONDITIONS ===
    seen_conditions = set()
    # Match applied conditions: "subit l'état X", "subir l'état X", "la cible a l'état X", "avec l'état X"
    for m in re.finditer(
        r'(subit|subir|subissent|a|avec)\s+l[\'\u2019]?\s*[ée]tat\s+',
        desc, re.IGNORECASE
    ):
        # Skip negation / conditional contexts
        pre_ctx = desc[max(0, m.start() - 60):m.start()]
        if re.search(r'ne\s+peu[vt]\s+|ne\s+peuvent\s+|\bni\b|ne\s+pas', pre_ctx, re.IGNORECASE):
            continue
        if re.search(r'\bsi\s+vous\s+|vous\s+avez\s+$', pre_ctx, re.IGNORECASE):
            continue

        tail = desc[m.end():m.end() + 80]
        conds = extract_condition_names(tail)
        for cname in conds:
            cond_en = map_condition(cname)
            if cond_en in seen_conditions or cond_en not in set(CONDITION_FR_TO_EN.values()):
                continue
            seen_conditions.add(cond_en)
            effects.append({"application": "active",
                            "condition": build_condition(cond_en, cname, desc, spell)})

    # === SPECIAL CASES ===
    specials = {
        'armor-of-agathys': [{"application": "reactive",
                              "damage": {"dice": "5", "type": "cold", "attackRoll": False},
                              "note": "En riposte quand une créature vous touche au corps à corps"}],
        'holy-aura': [{"application": "active", "note": "Avantage aux JdS des alliés, Désavantage aux attaques ennemies"}],
        'shield': [{"application": "reactive", "note": "+5 CA jusqu'au début du prochain tour"}],
        'bless': [{"application": "active", "note": "+1d4 aux jets d'attaque et de sauvegarde"}],
        'aid': [{"application": "active", "note": "+5 PV max et actuels (3 cibles max)"}],
        'magic-weapon': [{"application": "active", "note": "+1 attaque et dégâts de l'arme"}],
        'shield-of-faith': [{"application": "active", "note": "+2 à la CA"}],
        'enhance-ability': [{"application": "active", "note": "Avantage aux jets de la caractéristique choisie"}],
        'enlarge-reduce': [{"application": "active", "note": "Agrandit: +1d4 dmg, Avantage Force. Rapetisse: -1d4 dmg"}],
        'guidance': [{"application": "active", "note": "+1d4 à un jet de caractéristique"}],
        'true-strike': [{"application": "active", "note": "Attaque avec carac. d'incantation, dégâts radiants"}],
        'counterspell': [{"application": "reactive", "note": "Interrompt un sort de niveau 3 ou moins"}],
        'dispel-magic': [{"application": "active", "note": "Dissipe les effets magiques de niveau 3 ou moins"}],
        'aura-of-purity': [{"application": "active", "note": "Résistance au poison, Avantage JdS contre états"}],
        'aura-of-life': [{"application": "active", "note": "Résistance nécrotique, soigne 1 PV si 0 PV"}],
        'crusader-s-mantle': [{"application": "active", "note": "+1d4 dégâts radiants aux attaques alliées"}],
        'circle-of-power': [{"application": "active", "note": "Avantage aux JdS, zéro dégât si réussite"}],
        'enthrall': [{"application": "active", "note": "-10 Perception passive et Sagesse (Perception)"}],
        'shillelagh': [{"application": "active", "note": "Carac. d'incantation pour attaques, dé d8"}],
        'elemental-weapon': [{"application": "active", "note": "+1 attaque, +1d4 dégâts élémentaires"}],
        'fire-shield': [{"application": "active", "note": "Résistance feu/froid, 2d8 riposte au contact"}],
        'mage-armor': [{"application": "active", "note": "CA = 13 + modificateur de Dextérité"}],
        'glibness': [{"application": "active", "note": "Substitue 15 aux jets de Charisme"}],
        'antilife-shell': [{"application": "active", "note": "Barrière de 3 m contre les créatures vivantes"}],
        'gust-of-wind': [{"application": "active", "note": "Repousse de 4,50 m, terrain difficile contre le vent"}],
        'calm-emotions': [{"application": "active", "note": "Supprime ou immunise Charmé et Effrayé"}],
        'confusion': [{"application": "active", "note": "Comportement aléatoire (table 1d10) chaque tour"}],
        'delayed-blast-fireball': [{"application": "active", "damage": {"dice": "12d6", "type": "fire", "attackRoll": False, "save": {"ability": "dexterity", "onSuccess": "half"}, "note": "+1d6 par tour (max 22d6)"}}],
        'blade-barrier': [{"application": "active", "damage": {"dice": "6d10", "type": "slashing", "attackRoll": False, "save": {"ability": "dexterity", "onSuccess": "none"}}}],
        'control-water': [{"application": "active", "damage": {"dice": "2d8", "type": "bludgeoning", "attackRoll": False, "save": {"ability": "strength", "onSuccess": "none"}, "note": "Tourbillon"}}],
    }

    if key in specials:
        for eff in specials[key]:
            effects.append(eff)

    # === DEFAULT ===
    if not effects:
        summary = desc[:150].rsplit('.', 1)[0] if '.' in desc[:150] else desc[:150]
        summary = ' '.join(summary.split()[:10]) + '...'
        effects.append({"application": "informational", "note": summary})

    return effects


def extract_condition_names(text):
    found = []
    lower = text.lower()
    for cname in CONDITION_NAMES:
        if re.search(r'\b' + re.escape(cname) + r'\b', lower):
            found.append(cname)
    return found


def build_condition(cond_en, cname, desc, spell):
    cond = {"state": cond_en}
    # Find the condition name in desc and look at the following ~80 chars for duration
    idx = desc.lower().find(cname.lower())
    if idx >= 0:
        after = desc[idx + len(cname):idx + len(cname) + 80]
        if re.search(r'prochain\s+tour', after, re.IGNORECASE):
            cond["duration"] = "Until end of your next turn"
        else:
            cond["duration"] = spell.get('duration', 'Duration of spell')
    else:
        cond["duration"] = spell.get('duration', 'Duration of spell')

    # Save
    save = re.search(
        r'(?:doit\s+r[ée]ussir|effectue)\s+un\s+jet\s+de\s+sauvegarde\s+(?:de\s+|d\')?'
        r'(Force|Dext[ée]rit[ée]|Constitution|Intelligence|Sagesse|Charisme)',
        desc, re.IGNORECASE
    )
    if save:
        cond["save"] = {"ability": map_ability(save.group(1)), "onSuccess": "none"}
    return cond


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else 'docs/characteres/spells.part1.json'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'docs/characteres/spells.effects.part1.json'

    with open(input_path, 'r', encoding='utf-8') as f:
        spells = json.load(f)

    result = {}
    for spell in spells:
        result[spell['key']] = extract_effects(spell)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"OK {len(result)} sorts -> {output_path}")
    total = sum(len(v) for v in result.values())
    dmg = sum(1 for v in result.values() for e in v if e.get('damage'))
    heal = sum(1 for v in result.values() for e in v if e.get('healing'))
    cond = sum(1 for v in result.values() for e in v if e.get('condition'))
    info = sum(1 for v in result.values() if len(v) == 1 and v[0].get('application') == 'informational')
    print(f"  effets={total} dégâts={dmg} soins={heal} conditions={cond} info={info}")


if __name__ == '__main__':
    main()