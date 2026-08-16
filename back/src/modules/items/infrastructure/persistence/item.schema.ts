import { Schema } from 'mongoose';
import type {
  ArmorStatsSnapshot,
  ItemEntrySnapshot,
  ItemSnapshot,
  WeaponRange,
  WeaponStatsSnapshot,
} from '../../domain/item';

export const ITEM_MODEL = 'Item';

const ItemEntrySubSchema = new Schema<ItemEntrySnapshot>(
  {
    itemKey: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false, versionKey: false },
);

const WeaponRangeSubSchema = new Schema<WeaponRange>(
  {
    normal: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false, versionKey: false },
);

const WeaponStatsSubSchema = new Schema<WeaponStatsSnapshot>(
  {
    category: { type: String, required: true },
    kind: { type: String, required: true },
    damageDice: { type: String, required: true },
    damageType: { type: String, required: true },
    versatileDice: { type: String, default: null },
    range: { type: WeaponRangeSubSchema, default: null },
    properties: { type: [String], required: true },
    mastery: { type: String, default: null },
  },
  { _id: false, versionKey: false },
);

const ArmorStatsSubSchema = new Schema<ArmorStatsSnapshot>(
  {
    training: { type: String, required: true },
    baseArmorClass: { type: Number, required: true },
    dexterityAllowance: { type: String, required: true },
    strengthRequirement: { type: Number, default: null },
    stealthDisadvantage: { type: Boolean, required: true },
  },
  { _id: false, versionKey: false },
);

export const ItemSchema = new Schema<ItemSnapshot>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    weapon: { type: WeaponStatsSubSchema, default: null },
    armor: { type: ArmorStatsSubSchema, default: null },
    costInCopper: { type: Number, default: null },
    weightInKg: { type: Number, default: null },
    description: { type: String, default: null },
    contents: { type: [ItemEntrySubSchema], default: null },
    source: { type: String, required: true },
    campaignId: { type: String, default: null },
  },
  { versionKey: false },
);

// La clé n'est unique que dans sa portée : un MJ a le droit de redéfinir une
// « épée longue » chez lui sans écraser celle du manuel.
ItemSchema.index({ key: 1, source: 1, campaignId: 1 }, { unique: true });
ItemSchema.index({ source: 1, campaignId: 1 });
