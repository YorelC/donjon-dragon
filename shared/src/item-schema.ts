import { z } from 'zod';

import {
  ArmorTrainingSchema,
  DamageTypeSchema,
  WeaponMasterySchema,
  WeaponPropertySchema,
} from './dnd-reference-schema.js';

/**
 * Le catalogue d'objets : ce qu'on achète, ce qu'on transporte, ce qu'on donne
 * en butin — et ce qu'il fait en jeu.
 *
 * C'est LA source de vérité des statistiques d'objet : les dégâts d'une épée et
 * la classe d'armure d'une cotte de mailles sont ici, pas dans une constante
 * compilée. Le moteur de fiche ne les lit pas lui-même — il ne fait pas d'I/O —
 * mais les reçoit, résolus, de la couche application.
 *
 * C'est ce qui rend le MJ possible : une armure qu'il invente change la classe
 * d'armure de celui qui la porte, exactement comme une armure du manuel.
 */

export const ITEM_TYPES = ['weapon', 'armor', 'gear', 'pack', 'tool'] as const;
export const ItemTypeSchema = z.enum(ITEM_TYPES);

/** `srd` pour le manuel, `campaign` pour ce qu'un MJ a inventé chez lui. */
export const ITEM_SOURCES = ['srd', 'campaign'] as const;
export const ItemSourceSchema = z.enum(ITEM_SOURCES);

/** Une ligne d'inventaire : un objet, en tant d'exemplaires. */
export const ItemEntrySchema = z.object({
  itemKey: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const WeaponRangeSchema = z.object({
  /** En mètres. Au-delà de `normal`, l'attaque est désavantagée. */
  normal: z.number().positive(),
  max: z.number().positive(),
});

export const WeaponStatsSchema = z.object({
  category: z.enum(['simple', 'martial']),
  kind: z.enum(['melee', 'ranged']),
  damageDice: z.string().min(1),
  damageType: DamageTypeSchema,
  /** Dés de dégâts à deux mains, pour les armes Polyvalentes. */
  versatileDice: z.string().min(1).nullable(),
  range: WeaponRangeSchema.nullable(),
  properties: z.array(WeaponPropertySchema),
  /**
   * Toutes les armes du manuel en portent une. `null` reste possible pour l'arme
   * qu'un MJ invente sans en donner.
   */
  mastery: WeaponMasterySchema.nullable(),
});

/**
 * De quoi calculer une classe d'armure. Le bouclier est décrit ici comme les
 * autres : son `baseArmorClass` est le bonus qu'il ajoute, et c'est son
 * `training` — `shields` — qui dit qu'il s'ajoute au lieu de remplacer.
 */
export const ArmorStatsSchema = z.object({
  training: ArmorTrainingSchema,
  baseArmorClass: z.number().int(),
  dexterityAllowance: z.enum(['full', 'capped', 'none']),
  /** Score de Force sous lequel l'armure coûte de la vitesse. */
  strengthRequirement: z.number().int().nullable(),
  stealthDisadvantage: z.boolean(),
});

export const ItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  type: ItemTypeSchema,
  /** Renseigné si et seulement si `type` vaut `weapon`. */
  weapon: WeaponStatsSchema.nullable(),
  /** Renseigné si et seulement si `type` vaut `armor`. */
  armor: ArmorStatsSchema.nullable(),
  /**
   * En pièces de cuivre : 1 po = 100 pc, 1 pa = 10 pc. Un entier, parce qu'on
   * soustraira des bourses dessus et qu'un prix flottant finit toujours par
   * perdre une pièce. `null` quand le manuel dit « variable ».
   */
  costInCopper: z.number().int().nonnegative().nullable(),
  /**
   * `null` pour ce que le manuel ne pèse pas — et pour tout paquetage : ce qui
   * pèse, ce sont ses lignes de `contents`, sac à dos compris. Lui donner un
   * poids propre le compterait deux fois.
   */
  weightInKg: z.number().nonnegative().nullable(),
  description: z.string().nullable(),
  /** Non vide pour les paquetages seuls : un sac est un objet qui en contient. */
  contents: z.array(ItemEntrySchema).nullable(),
  source: ItemSourceSchema,
  /** Renseigné si et seulement si `source` vaut `campaign`. */
  campaignId: z.string().nullable(),
});

export const ItemCatalogSchema = z.array(ItemSchema);

export type ItemType = z.infer<typeof ItemTypeSchema>;
export type ItemSource = z.infer<typeof ItemSourceSchema>;
export type ItemEntry = z.infer<typeof ItemEntrySchema>;
export type WeaponRange = z.infer<typeof WeaponRangeSchema>;
export type WeaponStats = z.infer<typeof WeaponStatsSchema>;
export type ArmorStats = z.infer<typeof ArmorStatsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type ItemCatalog = z.infer<typeof ItemCatalogSchema>;
