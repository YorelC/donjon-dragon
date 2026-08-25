import { Schema } from 'mongoose';

import type { AbilityAssignmentSnapshot } from '../../domain/ability-assignment';
import type { AbilityRollSnapshot } from '../../domain/ability-roll';
import type {
  CarriedItemSnapshot,
  CharacterEquipmentSnapshot,
} from '../../domain/character-equipment';
import type { CharacterBuildSnapshot, CharacterSnapshot } from '../../domain/character';

export const CHARACTER_MODEL = 'Character';

/** Sous-document : pas d'`_id`, il n'a pas d'identité propre. */
const subSchema = { _id: false, versionKey: false } as const;

const AbilityRollSubSchema = new Schema<AbilityRollSnapshot>(
  { dice: { type: [[Number]], required: true } },
  subSchema,
);

const AbilityAssignmentSubSchema = new Schema<AbilityAssignmentSnapshot>(
  {
    base: { type: Object, required: true },
    backgroundBonuses: { type: Object, required: true },
    method: { type: String, required: true },
  },
  subSchema,
);

const CarriedItemSubSchema = new Schema<CarriedItemSnapshot>(
  {
    itemKey: { type: String, required: true },
    quantity: { type: Number, required: true },
  },
  subSchema,
);

const CharacterEquipmentSubSchema = new Schema<CharacterEquipmentSnapshot>(
  {
    armorKey: { type: String, default: null },
    shield: { type: Boolean, required: true },
    items: { type: [CarriedItemSubSchema], required: true },
    gold: { type: Number, required: true },
    // Nullables : les personnages créés avant les paquetages n'ont pas d'option.
    classOptionId: { type: String, default: null },
    backgroundOptionId: { type: String, default: null },
  },
  subSchema,
);

const CharacterBuildSubSchema = new Schema<CharacterBuildSnapshot>(
  {
    speciesKey: { type: String, required: true },
    lineageKey: { type: String, default: null },
    classKey: { type: String, required: true },
    backgroundKey: { type: String, required: true },
    abilities: { type: AbilityAssignmentSubSchema, required: true },
    /**
     * Une liste nue, et en forme libre : les champs d'un choix sont optionnels
     * et changent d'une source à l'autre. Zod les valide à l'entrée, l'agrégat
     * les vérifie contre les règles ; Mongo n'a rien à en dire de plus.
     */
    choices: { type: [Object], required: true },
    equipment: { type: CharacterEquipmentSubSchema, required: true },
  },
  subSchema,
);

export const CharacterSchema = new Schema<CharacterSnapshot>(
  {
    id: { type: String, required: true, unique: true },
    campaignId: { type: String, required: true },
    name: { type: String, required: true },
    /** Participation à l'aventure de la campagne, pas avancement de la création. */
    status: { type: String, required: true },
    /** `null` pour les méthodes standardArray/pointBuy, qui n'ont pas de tirage. */
    abilityRoll: { type: AbilityRollSubSchema, default: null },
    build: { type: CharacterBuildSubSchema, required: true },
    createdBy: { type: String, required: true },
    assignedTo: { type: String, default: null },
    revision: { type: Number, required: true, min: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

/** Les deux lectures du module : toute la campagne, et « qui a ce joueur ». */
CharacterSchema.index({ campaignId: 1 });
CharacterSchema.index(
  { campaignId: 1, assignedTo: 1 },
  { unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } } },
);
