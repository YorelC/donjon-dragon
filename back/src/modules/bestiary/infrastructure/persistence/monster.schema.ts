import { Schema } from 'mongoose';

import type {
  MonsterAbilitiesSnapshot,
  MonsterEntrySnapshot,
  MonsterSnapshot,
} from '../../domain/monster';

export const MONSTER_MODEL = 'Monster';

const requiredNumber = { type: Number, required: true } as const;
const requiredString = { type: String, required: true } as const;

const MonsterAbilitiesSubSchema = new Schema<MonsterAbilitiesSnapshot>(
  {
    str: requiredNumber,
    dex: requiredNumber,
    con: requiredNumber,
    int: requiredNumber,
    wis: requiredNumber,
    cha: requiredNumber,
    strMod: requiredString,
    dexMod: requiredString,
    conMod: requiredString,
    intMod: requiredString,
    wisMod: requiredString,
    chaMod: requiredString,
    strSave: requiredString,
    dexSave: requiredString,
    conSave: requiredString,
    intSave: requiredString,
    wisSave: requiredString,
    chaSave: requiredString,
  },
  { _id: false, versionKey: false },
);

const MonsterEntrySubSchema = new Schema<MonsterEntrySnapshot>(
  {
    name: requiredString,
    description: { type: String, default: '' },
  },
  { _id: false, versionKey: false },
);

const entryList = () => ({ type: [MonsterEntrySubSchema], default: [] });

export const MonsterSchema = new Schema<MonsterSnapshot>(
  {
    key: requiredString,
    name: requiredString,
    type: requiredString,
    size: requiredString,
    alignment: { type: String, default: null },

    armorClass: requiredNumber,
    hitPoints: { type: Number, default: null },
    hitDice: { type: String, default: null },
    initiativeBonus: { type: Number, default: null },
    speed: requiredString,

    skills: { type: String, default: null },
    damageImmunities: { type: String, default: null },
    damageResistances: { type: String, default: null },
    damageVulnerabilities: { type: String, default: null },
    conditionImmunities: { type: String, default: null },
    senses: requiredString,
    languages: requiredString,

    challengeRating: { type: String, default: null },
    xp: { type: String, default: null },
    proficiencyBonus: { type: String, default: null },

    abilities: { type: MonsterAbilitiesSubSchema, required: true },
    traits: entryList(),
    actions: entryList(),
    bonusActions: entryList(),
    reactions: entryList(),
    legendaryActions: entryList(),
    mythicActions: entryList(),

    source: { type: String, default: null },
    nameEN: { type: String, default: null },
    nameES: { type: String, default: null },

    origin: requiredString,
    campaignId: { type: String, default: null },
  },
  { versionKey: false },
);

// La clé n'est unique que dans sa portée : un MJ a le droit de redéfinir un
// « gobelin » chez lui sans écraser celui du manuel.
MonsterSchema.index({ key: 1, origin: 1, campaignId: 1 }, { unique: true });
MonsterSchema.index({ origin: 1, campaignId: 1 });
// Le tri du bestiaire se fait par facteur de puissance bien plus souvent que par clé.
MonsterSchema.index({ challengeRating: 1 });
