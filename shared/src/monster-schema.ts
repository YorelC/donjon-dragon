import { z } from 'zod';

import { ItemSourceSchema } from './item-schema.js';

/**
 * Le bestiaire : les profils que le MJ jette sur la table.
 *
 * Il suit le même régime que le catalogue d'objets — une collection en base,
 * indexée par `(key, source, campaignId)` — parce qu'il répond au même besoin :
 * un MJ doit pouvoir inventer sa créature, ou redéfinir un gobelin chez lui,
 * sans toucher au manuel.
 *
 * Un monstre n'est pas un personnage. Rien n'est recalculé ici : le manuel
 * imprime la classe d'armure, les points de vie et les modificateurs, et c'est
 * ce qu'on stocke. La fiche de personnage, elle, reste recalculée à la lecture.
 */

/**
 * Les caractéristiques telles que le profil les imprime : le score, son
 * modificateur et le jet de sauvegarde. Les deux derniers sont dérivables du
 * premier, mais le manuel les affiche et un MJ lit un profil, il ne le calcule
 * pas.
 */
export const MonsterAbilitiesSchema = z.object({
  str: z.number().int(),
  dex: z.number().int(),
  con: z.number().int(),
  int: z.number().int(),
  wis: z.number().int(),
  cha: z.number().int(),
  strMod: z.string(),
  dexMod: z.string(),
  conMod: z.string(),
  intMod: z.string(),
  wisMod: z.string(),
  chaMod: z.string(),
  strSave: z.string(),
  dexSave: z.string(),
  conSave: z.string(),
  intSave: z.string(),
  wisSave: z.string(),
  chaSave: z.string(),
});

/** Trait, action, action bonus, réaction, action légendaire : même forme. */
export const MonsterEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string(),
});

/** La clé de catalogue, telle qu'elle arrive en segment d'URL. */
export const MonsterKeySchema = z.string().min(1);

export const MonsterSchema = z.object({
  key: MonsterKeySchema,
  name: z.string().min(1),
  /**
   * `type` et `size` restent des chaînes libres. Le manuel écrit « Bête
   * (Dinosaure) », « Fiélon (Démon) » ou « M ou P » : un vocabulaire fermé
   * rejetterait des profils qui existent vraiment.
   */
  type: z.string().min(1),
  size: z.string().min(1),
  alignment: z.string().nullable(),

  armorClass: z.number().int(),
  hitPoints: z.number().int().nullable(),
  hitDice: z.string().nullable(),
  initiativeBonus: z.number().int().nullable(),
  speed: z.string(),

  skills: z.string().nullable(),
  damageImmunities: z.string().nullable(),
  damageResistances: z.string().nullable(),
  damageVulnerabilities: z.string().nullable(),
  conditionImmunities: z.string().nullable(),
  senses: z.string(),
  languages: z.string(),

  /**
   * `null` pour les profils d'invocation — Esprit bestial, Insecte géant,
   * Objet animé : leur puissance suit celle de l'incantateur, ils n'ont pas de
   * facteur propre. Le bonus de maîtrise est `null` pour la même raison.
   */
  challengeRating: z.string().nullable(),
  xp: z.string().nullable(),
  proficiencyBonus: z.string().nullable(),

  abilities: MonsterAbilitiesSchema,
  traits: z.array(MonsterEntrySchema),
  actions: z.array(MonsterEntrySchema),
  bonusActions: z.array(MonsterEntrySchema),
  reactions: z.array(MonsterEntrySchema),
  legendaryActions: z.array(MonsterEntrySchema),
  mythicActions: z.array(MonsterEntrySchema),

  /** L'ouvrage d'où le profil est tiré, tel que la source le nomme. */
  source: z.string().nullable(),
  nameEN: z.string().nullable(),
  nameES: z.string().nullable(),

  /** Même distinction que pour les objets : le manuel, ou la table d'un MJ. */
  origin: ItemSourceSchema,
  /** Renseigné si et seulement si `origin` vaut `campaign`. */
  campaignId: z.string().nullable(),
});

export const BestiarySchema = z.array(MonsterSchema);

export type MonsterAbilities = z.infer<typeof MonsterAbilitiesSchema>;
export type MonsterEntry = z.infer<typeof MonsterEntrySchema>;
export type Monster = z.infer<typeof MonsterSchema>;
export type Bestiary = z.infer<typeof BestiarySchema>;
